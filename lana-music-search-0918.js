(() => {
  const RELEASE = '0.9.18';
  const originalFetch = window.fetch.bind(window);
  const responseCache = new Map();
  const CACHE_MS = 5 * 60 * 1000;

  function clean(value) {
    return String(value || '').replace(/[“”„"'()\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function fold(value) {
    return clean(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function regionalVariant(value) {
    let text = clean(value);
    const lower = text.toLocaleLowerCase('hr');
    if (/(^|\s)što(?=\s|$)/i.test(lower)) text = text.replace(/(^|\s)što(?=\s|$)/gi, '$1šta');
    else if (/(^|\s)šta(?=\s|$)/i.test(lower)) text = text.replace(/(^|\s)šta(?=\s|$)/gi, '$1što');
    text = text.replace(/(^|\s)mjestu(?=\s|$)/gi, '$1mestu').replace(/(^|\s)mjesto(?=\s|$)/gi, '$1mesto');
    return clean(text);
  }

  function queryVariants(query) {
    const base = clean(query);
    if (!base) return [];
    const tokens = base.split(/\s+/).filter(Boolean);
    const candidates = [base, regionalVariant(base)];

    if (tokens.length >= 5) {
      const one = tokens.slice(1).join(' ');
      candidates.push(regionalVariant(one), one);
    }
    if (tokens.length >= 6) {
      const two = tokens.slice(2).join(' ');
      candidates.splice(2, 0, regionalVariant(two), two);
    }
    if (tokens.length >= 8) {
      const three = tokens.slice(3).join(' ');
      candidates.push(regionalVariant(three), three);
    }

    const seen = new Set();
    return candidates.filter(item => {
      const key = fold(item);
      if (!key || seen.has(key) || key.length < 4) return false;
      seen.add(key);
      return true;
    }).slice(0, 6);
  }

  function resultScore(result, query) {
    const hay = fold(`${result?.trackName || ''} ${result?.artistName || ''} ${result?.collectionName || ''}`);
    const words = fold(query).split(/\s+/).filter(word => word.length > 1);
    if (!hay || !words.length) return 0;
    let hit = 0;
    for (const word of words) if (hay.includes(word)) hit++;
    return hit / words.length;
  }

  function dedupeResults(results) {
    const seen = new Set();
    return results.filter(result => {
      const key = String(result?.trackId || result?.previewUrl || `${result?.artistName}|${result?.trackName}`);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function usefulResults(data, query) {
    const list = Array.isArray(data?.results) ? data.results : [];
    if (!list.length) return false;
    const best = Math.max(...list.slice(0, 8).map(item => resultScore(item, query)));
    return list.length >= 3 && best >= 0.42;
  }

  async function fetchJson(url, init) {
    const key = url.toString();
    const cached = responseCache.get(key);
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;
    const response = await originalFetch(url.toString(), init);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    responseCache.set(key, { at: Date.now(), data });
    return data;
  }

  async function smartItunes(input, init) {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    const query = url.searchParams.get('term') || '';
    if (!query) return originalFetch(input, init);

    let firstResponse;
    let firstData;
    try {
      firstResponse = await originalFetch(input, init);
      if (!firstResponse.ok) return firstResponse;
      firstData = await firstResponse.clone().json();
    } catch {
      return originalFetch(input, init);
    }

    if (usefulResults(firstData, query)) return firstResponse;

    const merged = Array.isArray(firstData?.results) ? [...firstData.results] : [];
    const variants = queryVariants(query).filter(v => fold(v) !== fold(query));
    const attempts = [];

    for (const variant of variants.slice(0, 3)) {
      const next = new URL(url);
      next.searchParams.set('term', variant);
      attempts.push(next);
    }

    if (variants[0]) {
      const otherStore = new URL(url);
      otherStore.searchParams.set('term', variants[0]);
      otherStore.searchParams.set('country', 'us');
      attempts.push(otherStore);
    }

    for (const attempt of attempts.slice(0, 4)) {
      try {
        const data = await fetchJson(attempt, init);
        if (Array.isArray(data?.results)) merged.push(...data.results);
        if (usefulResults({ results: merged }, query) && merged.length >= 8) break;
      } catch {}
    }

    const results = dedupeResults(merged)
      .map((item, index) => ({ item, score: resultScore(item, query), index }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map(entry => entry.item)
      .slice(0, 28);

    window.__lanaMusicSearch0918Last = {
      query,
      variants: queryVariants(query),
      resultCount: results.length
    };

    return new Response(JSON.stringify({ resultCount: results.length, results }), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  function broadenArchiveUrl(url) {
    const q = url.searchParams.get('q') || '';
    const match = q.match(/^(.*?AND\s*)\((.*)\)\s*$/i);
    if (!match) return url;
    const variants = queryVariants(match[2]).slice(0, 4);
    if (variants.length < 2) return url;
    const escaped = variants.map(value => `"${value.replace(/["\\]/g, ' ').trim()}"`);
    const next = new URL(url);
    next.searchParams.set('q', `${match[1]}(${escaped.join(' OR ')})`);
    return next;
  }

  function patchFetch() {
    if (window.__lanaMusicSearch0918FetchPatched) return;
    window.__lanaMusicSearch0918FetchPatched = true;
    window.fetch = function(input, init) {
      try {
        const url = new URL(typeof input === 'string' ? input : input.url, location.href);
        if (url.hostname === 'itunes.apple.com' && url.pathname === '/search') {
          return smartItunes(input, init);
        }
        if (url.hostname === 'archive.org' && url.pathname.endsWith('/advancedsearch.php')) {
          return originalFetch(broadenArchiveUrl(url).toString(), init);
        }
      } catch {}
      return originalFetch(input, init);
    };
  }

  function tightenSearchNote() {
    const pane = document.querySelector('[data-music-pane="search"]');
    const note = pane?.querySelector('.lana-music-search-note');
    if (!note) return false;
    note.innerHTML = '<strong>Pametna pretraga:</strong> probavam naziv, izvođača i varijante pisanja. Offline preuzimanje nudim samo kad izvor to dopušta.';
    return true;
  }

  function install() {
    if (window.__lanaMusicSearch0918Installed) return;
    window.__lanaMusicSearch0918Installed = true;
    patchFetch();
    tightenSearchNote();

    const test = queryVariants('Željko Bebek što bi dao da si na mom mjestu');
    window.LanaMusicSearch = {
      version: RELEASE,
      variants: queryVariants,
      last: () => window.__lanaMusicSearch0918Last || null,
      selfTest: () => ({ ok: test.some(x => fold(x).includes('sta bi dao da si na mom mestu')), variants: test })
    };

    if (!tightenSearchNote()) {
      const observer = new MutationObserver(() => {
        if (tightenSearchNote()) observer.disconnect();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
