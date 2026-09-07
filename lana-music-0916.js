(() => {
  const RELEASE = '0.9.16';
  const DB_NAME = 'lanaMusicDB0916';
  const DB_VERSION = 1;
  const SETTINGS_KEY = 'lanaMusic0916SettingsV1';
  const SEARCH_LIMIT = 14;

  let dbPromise = null;
  let queue = [];
  let currentIndex = -1;
  let activeObjectUrl = '';
  let searchResults = [];
  let currentTab = 'search';
  let lastQuery = '';

  const $ = id => document.getElementById(id);
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const s = Math.floor(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function formatBytes(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
    return `${(n / 1024 ** 3).toFixed(2)} GB`;
  }

  function safeUrl(url) {
    try {
      const parsed = new URL(String(url || '').trim(), location.href);
      if (!['http:', 'https:', 'blob:'].includes(parsed.protocol)) return '';
      return parsed.href;
    } catch {
      return '';
    }
  }

  function readSettings() {
    try {
      const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return {
        volume: Number.isFinite(Number(raw.volume)) ? clamp(Number(raw.volume), 0, 1) : 0.72
      };
    } catch {
      return { volume: 0.72 };
    }
  }

  function saveSettings() {
    const audio = $('lanaMusicAudio');
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ volume: audio?.volume ?? 0.72 }));
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB nije dostupan na ovom uređaju.'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('saved')) db.createObjectStore('saved', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('downloads')) db.createObjectStore('downloads', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Ne mogu otvoriti glazbenu bazu.'));
    });
    return dbPromise;
  }

  async function dbGet(storeName, key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbGetAll(storeName) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbPut(storeName, value) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Spremanje je prekinuto.'));
    });
  }

  async function dbDelete(storeName, key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function isDownloaded(id) {
    if (!id) return false;
    try { return !!(await dbGet('downloads', id)); }
    catch { return false; }
  }

  function setStatus(text, tone = '') {
    const el = $('lanaMusicStatus');
    if (!el) return;
    el.textContent = text || '';
    el.dataset.tone = tone;
  }

  function setNowState(text) {
    if ($('lanaMusicState')) $('lanaMusicState').textContent = text || '';
  }

  function installStyle() {
    document.getElementById('lanaMusic0915Style')?.remove();
    if ($('lanaMusic0916Style')) return;
    const style = document.createElement('style');
    style.id = 'lanaMusic0916Style';
    style.textContent = `
      #lanaMusicOpen{position:fixed;z-index:76;right:12px;bottom:204px;width:58px;min-width:58px;height:58px;min-height:58px;padding:0;border-radius:50%;border:1px solid #9db9dc;background:rgba(248,252,255,.98);color:#174578;box-shadow:0 12px 34px rgba(21,61,111,.24);font-size:1.55rem;display:grid;place-items:center;pointer-events:auto;touch-action:manipulation}
      #lanaMusicOpen.lana-music-active{background:#2f6deb;color:#fff;border-color:#2f6deb}
      #lanaMusicOpen.lana-music-active::after{content:'♪';position:absolute;right:2px;top:-5px;font-size:.8rem;animation:lanaMusicPulse0916 1.3s ease-in-out infinite}
      @keyframes lanaMusicPulse0916{0%,100%{transform:translateY(0) rotate(-8deg);opacity:.55}50%{transform:translateY(-5px) rotate(8deg);opacity:1}}
      #lanaMusicPanel{position:fixed;z-index:75;right:12px;bottom:272px;width:min(560px,calc(100vw - 24px));max-height:min(670px,70vh);overflow:auto;background:rgba(250,253,255,.985);color:#14345f;border:1px solid #c8d9ec;border-radius:26px;box-shadow:0 24px 68px rgba(16,52,99,.28);padding:15px;pointer-events:auto;backdrop-filter:blur(11px)}
      #lanaMusicPanel[hidden]{display:none!important}
      .lana-music-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px}.lana-music-head strong{font-size:1.05rem}.lana-music-head small{display:block;color:#6b7f99;margin-top:2px}.lana-music-close{width:42px!important;min-width:42px!important;height:42px!important;min-height:42px!important;padding:0!important;border-radius:50%!important;background:#e9f2ff!important;color:#173f75!important;border:1px solid #bfd3eb!important}
      .lana-music-now{background:#f2f7ff;border:1px solid #cfdded;border-radius:17px;padding:11px 12px;margin-bottom:10px;text-align:center}.lana-music-now .title{font-weight:900;font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lana-music-now .state{font-size:.73rem;color:#6b7f99;margin-top:3px}
      .lana-music-progress{display:grid;grid-template-columns:40px 1fr 40px;align-items:center;gap:7px;font-size:.68rem;color:#6b7f99;margin:7px 0 9px}.lana-music-progress input{margin:0!important;min-height:24px!important;padding:0!important}
      .lana-music-controls{display:grid;grid-template-columns:1fr 1.35fr 1fr;gap:8px;margin-bottom:9px}.lana-music-controls button{min-height:50px!important;border-radius:15px!important;font-size:1.05rem!important;background:#e9f2ff!important;color:#173f75!important;border:1px solid #bfd3eb!important}.lana-music-controls .play{background:#2f6deb!important;color:#fff!important;border-color:#2f6deb!important;font-size:1.28rem!important}
      .lana-music-volume{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;background:#f7fbff;border:1px solid #d1dfef;border-radius:14px;padding:7px 10px;margin-bottom:10px}.lana-music-volume input{margin:0!important;min-height:26px!important}.lana-music-volume span{font-size:.73rem;font-weight:850;min-width:32px;text-align:right}
      .lana-music-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0 10px}.lana-music-tab{min-height:42px!important;border-radius:13px!important;background:#edf4fd!important;color:#315980!important;border:1px solid #ccdaea!important;font-size:.76rem!important;padding:7px 5px!important}.lana-music-tab.active{background:#173f75!important;color:#fff!important;border-color:#173f75!important}
      .lana-music-pane[hidden]{display:none!important}.lana-music-searchbar{display:grid;grid-template-columns:1fr auto;gap:7px;margin-bottom:8px}.lana-music-searchbar input{margin:0!important;min-height:46px!important;background:#fff!important;color:#12345f!important;border:1px solid #c5d6e9!important;border-radius:13px!important;padding:0 11px!important}.lana-music-searchbar button{width:auto!important;min-width:48px!important;min-height:46px!important;border-radius:13px!important;padding:8px 12px!important}.lana-music-search-note{font-size:.7rem;line-height:1.35;color:#6f8197;margin:0 2px 9px}.lana-music-search-note strong{color:#4a6484}
      #lanaMusicStatus{min-height:1.25em;font-size:.72rem;line-height:1.35;color:#4d6580;margin:5px 2px 8px}#lanaMusicStatus[data-tone="ok"]{color:#17643a}#lanaMusicStatus[data-tone="warn"]{color:#8a5b08}#lanaMusicStatus[data-tone="bad"]{color:#9b2531}
      .lana-music-list{display:grid;gap:7px}.lana-music-empty{padding:14px;text-align:center;color:#7b8da4;font-size:.78rem;border:1px dashed #c7d8eb;border-radius:12px}.lana-music-card{display:grid;grid-template-columns:44px 1fr;gap:9px;background:#fff;border:1px solid #d6e2ef;border-radius:14px;padding:9px}.lana-music-art{width:44px;height:44px;border-radius:10px;background:#edf4fd;display:grid;place-items:center;overflow:hidden;font-size:1.2rem}.lana-music-art img{width:100%;height:100%;object-fit:cover}.lana-music-info{min-width:0}.lana-music-title{font-size:.82rem;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lana-music-meta{font-size:.68rem;color:#75879e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:2px 0 6px}.lana-music-badges{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px}.lana-music-badge{display:inline-flex;align-items:center;border:1px solid #cad8e8;border-radius:999px;padding:2px 6px;font-size:.61rem;color:#5c7290;background:#f6faff}.lana-music-badge.offline{border-color:#9cc9ad;color:#17643a;background:#effbf3}.lana-music-badge.preview{border-color:#dcc68e;color:#806018;background:#fff9e8}
      .lana-music-actions{display:flex;flex-wrap:wrap;gap:5px}.lana-music-actions button{width:auto!important;min-height:34px!important;padding:5px 8px!important;border-radius:10px!important;background:#eaf2ff!important;color:#174578!important;border:1px solid #c7d8eb!important;font-size:.68rem!important}.lana-music-actions button.primary{background:#2f6deb!important;color:#fff!important;border-color:#2f6deb!important}.lana-music-actions button.danger{background:#fff1f2!important;color:#8f2732!important;border-color:#efb2ba!important}.lana-music-actions button:disabled{opacity:.48}
      .lana-music-import{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:9px 0}.lana-music-import label,.lana-music-import button{min-height:43px!important;border-radius:12px!important;border:1px solid #bfd3eb!important;background:#e9f2ff!important;color:#173f75!important;font-size:.73rem!important;font-weight:850;display:flex;align-items:center;justify-content:center;padding:7px;text-align:center;cursor:pointer}.lana-music-import input[type=file]{display:none}.lana-music-urlbox{background:#f7fbff;border:1px solid #d1dfef;border-radius:14px;padding:9px;margin:7px 0}.lana-music-urlbox[hidden]{display:none!important}.lana-music-urlbox input{width:100%;margin:0 0 7px!important;min-height:42px!important;background:#fff!important;color:#12345f!important;border:1px solid #c5d6e9!important;border-radius:10px!important;padding:0 9px!important}.lana-music-url-actions{display:grid;grid-template-columns:1fr auto;gap:7px}.lana-music-url-actions button{min-height:40px!important;border-radius:10px!important}
      .lana-music-storage{font-size:.68rem;color:#70839b;background:#f7fbff;border:1px solid #d6e2ef;border-radius:11px;padding:7px 9px;margin-bottom:8px}
      @media(max-width:760px){#lanaMusicOpen{right:8px;bottom:198px;width:56px;min-width:56px;height:56px;min-height:56px}#lanaMusicPanel{right:7px;bottom:262px;width:calc(100vw - 14px);max-height:60vh;border-radius:22px}}
      @media(max-width:420px){#lanaMusicOpen{bottom:195px;width:54px;min-width:54px;height:54px;min-height:54px;font-size:1.45rem}#lanaMusicPanel{bottom:256px;max-height:48vh;padding:11px}.lana-music-import{grid-template-columns:1fr}.lana-music-actions button{font-size:.64rem!important;padding:5px 7px!important}}
    `;
    document.head.appendChild(style);
  }

  function panelMarkup() {
    return `
      <div class="lana-music-head"><div><strong>🎵 Lana Glazba</strong><small>Traži • Spremi • Offline • v${RELEASE}</small></div><button class="lana-music-close" id="lanaMusicClose" type="button" aria-label="Zatvori glazbu">✕</button></div>
      <div class="lana-music-now"><div class="title" id="lanaMusicTitle">Nema odabrane pjesme</div><div class="state" id="lanaMusicState">Traži pjesmu ili otvori svoju biblioteku.</div></div>
      <div class="lana-music-progress"><span id="lanaMusicElapsed">0:00</span><input id="lanaMusicSeek" type="range" min="0" max="1000" value="0" aria-label="Pozicija pjesme"><span id="lanaMusicDuration">0:00</span></div>
      <div class="lana-music-controls"><button id="lanaMusicPrev" type="button" aria-label="Prethodna">⏮️</button><button class="play" id="lanaMusicPlay" type="button" aria-label="Pokreni ili pauziraj">▶️</button><button id="lanaMusicNext" type="button" aria-label="Sljedeća">⏭️</button></div>
      <div class="lana-music-volume"><span>🔈</span><input id="lanaMusicVolume" type="range" min="0" max="100" value="72" aria-label="Glasnoća"><span id="lanaMusicVolumeText">72%</span></div>
      <div class="lana-music-tabs"><button class="lana-music-tab active" type="button" data-music-tab="search">🔎 Traži</button><button class="lana-music-tab" type="button" data-music-tab="saved">❤️ Spremljeno</button><button class="lana-music-tab" type="button" data-music-tab="downloads">⬇️ Preuzeto</button></div>
      <div id="lanaMusicStatus"></div>
      <section class="lana-music-pane" data-music-pane="search">
        <div class="lana-music-searchbar"><input id="lanaMusicSearch" type="search" autocomplete="off" placeholder="Izvođač ili naziv pjesme"><button id="lanaMusicSearchButton" type="button">Traži</button></div>
        <div class="lana-music-search-note"><strong>Internet:</strong> Lana traži kataloge i otvoreno licencirane izvore. Cijelu pjesmu i preuzimanje nudi samo kad izvor to dopušta; inače može biti dostupan samo preview.</div>
        <div class="lana-music-import"><label for="lanaMusicFiles">📂 Dodaj svoje audio datoteke<input id="lanaMusicFiles" type="file" accept="audio/*" multiple></label><button id="lanaMusicUrlToggle" type="button">🔗 Dodaj audio URL</button></div>
        <div class="lana-music-urlbox" id="lanaMusicUrlBox" hidden><input id="lanaMusicUrlName" type="text" placeholder="Naziv pjesme"><input id="lanaMusicUrlArtist" type="text" placeholder="Izvođač (nije obavezno)"><input id="lanaMusicUrl" type="url" inputmode="url" placeholder="https://… izravni audio/stream URL"><div class="lana-music-url-actions"><button id="lanaMusicAddUrl" type="button">Dodaj</button><button id="lanaMusicCancelUrl" type="button">Odustani</button></div><div class="lana-music-search-note">Preuzimaj samo sadržaj za koji izvor dopušta download ili za koji imaš pravo spremanja.</div></div>
        <div class="lana-music-list" id="lanaMusicSearchResults"></div>
      </section>
      <section class="lana-music-pane" data-music-pane="saved" hidden><div class="lana-music-list" id="lanaMusicSavedList"></div></section>
      <section class="lana-music-pane" data-music-pane="downloads" hidden><div class="lana-music-storage" id="lanaMusicStorage">Offline pohrana: učitavanje…</div><div class="lana-music-list" id="lanaMusicDownloadList"></div></section>
    `;
  }

  function createUi() {
    ['lanaMusicOpen', 'lanaMusicPanel', 'lanaMusicAudio'].forEach(id => document.getElementById(id)?.remove());
    document.getElementById('lanaMusic0915Style')?.remove();
    installStyle();
    const open = document.createElement('button');
    open.id = 'lanaMusicOpen';
    open.type = 'button';
    open.textContent = '🎵';
    open.title = 'Glazba';
    open.setAttribute('aria-label', 'Otvori Lana Glazbu');
    document.body.appendChild(open);
    const panel = document.createElement('section');
    panel.id = 'lanaMusicPanel';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Lana glazba');
    panel.innerHTML = panelMarkup();
    document.body.appendChild(panel);
    const audio = document.createElement('audio');
    audio.id = 'lanaMusicAudio';
    audio.preload = 'metadata';
    document.body.appendChild(audio);
  }

  function resultId(prefix, parts) {
    const seed = parts.map(v => String(v || '')).join('|');
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    return `${prefix}-${Math.abs(hash)}`;
  }

  async function getPlayableUrl(item) {
    const offline = await dbGet('downloads', item.id).catch(() => null);
    if (offline?.blob) {
      if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
      activeObjectUrl = URL.createObjectURL(offline.blob);
      return activeObjectUrl;
    }
    return safeUrl(item.streamUrl || item.previewUrl || item.playUrl || item.url);
  }

  async function playItem(item, replaceQueue = false) {
    if (!item) return;
    const existingIndex = queue.findIndex(t => t.id === item.id);
    if (replaceQueue) { queue = [item]; currentIndex = 0; }
    else if (existingIndex >= 0) currentIndex = existingIndex;
    else { queue.push(item); currentIndex = queue.length - 1; }
    const url = await getPlayableUrl(item);
    if (!url) { setStatus('Ovaj rezultat nema izravni audio za reprodukciju.', 'warn'); return; }
    const audio = $('lanaMusicAudio');
    audio.src = url;
    updateNow();
    updateProgress();
    try {
      await audio.play();
      setStatus((await isDownloaded(item.id)) ? 'Svira offline kopija.' : 'Reprodukcija pokrenuta.', 'ok');
    } catch {
      setNowState('Dodirni ▶️ za pokretanje reprodukcije.');
      setStatus('Preglednik traži dodir za pokretanje zvuka.', 'warn');
    }
  }

  async function setQueueIndex(index, autoplay = true) {
    if (!queue.length) return;
    currentIndex = (index + queue.length) % queue.length;
    const item = queue[currentIndex];
    const url = await getPlayableUrl(item);
    if (!url) return;
    const audio = $('lanaMusicAudio');
    audio.src = url;
    updateNow();
    updateProgress();
    if (autoplay) { try { await audio.play(); } catch { setNowState('Dodirni ▶️ za nastavak.'); } }
  }

  async function togglePlay() {
    const audio = $('lanaMusicAudio');
    if (!audio) return;
    if (!queue.length) {
      const downloads = await dbGetAll('downloads').catch(() => []);
      const saved = await dbGetAll('saved').catch(() => []);
      const first = downloads[0] || saved[0] || searchResults[0];
      if (!first) { setStatus('Prvo pronađi ili dodaj pjesmu.', 'warn'); return; }
      await playItem(first, true);
      return;
    }
    if (audio.paused) { try { await audio.play(); } catch { setStatus('Dodirni ponovno ▶️ za reprodukciju.', 'warn'); } }
    else audio.pause();
  }

  function updateNow() {
    const audio = $('lanaMusicAudio');
    const item = queue[currentIndex];
    if ($('lanaMusicTitle')) $('lanaMusicTitle').textContent = item ? `${item.artist ? item.artist + ' • ' : ''}${item.name}` : 'Nema odabrane pjesme';
    if ($('lanaMusicState')) $('lanaMusicState').textContent = !item ? 'Traži pjesmu ili otvori svoju biblioteku.' : (audio?.paused ? 'Pauzirano' : 'Svira');
    if ($('lanaMusicPlay')) $('lanaMusicPlay').textContent = audio && !audio.paused ? '⏸️' : '▶️';
    $('lanaMusicOpen')?.classList.toggle('lana-music-active', !!audio && !audio.paused);
    if ('mediaSession' in navigator && item) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({title: item.name || 'Lana Glazba', artist: item.artist || 'VAŠ CHARLIE • Lana', artwork: item.artwork ? [{ src: item.artwork }] : []});
      } catch {}
    }
  }

  function updateProgress() {
    const audio = $('lanaMusicAudio');
    if (!audio) return;
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    if ($('lanaMusicElapsed')) $('lanaMusicElapsed').textContent = formatTime(current);
    if ($('lanaMusicDuration')) $('lanaMusicDuration').textContent = formatTime(duration);
    if ($('lanaMusicSeek')) $('lanaMusicSeek').value = duration > 0 ? String(Math.round((current / duration) * 1000)) : '0';
  }

  async function saveItem(item) {
    if (!item?.id) return;
    const record = {id:item.id,name:item.name||'Bez naziva',artist:item.artist||'',source:item.source||'Lana',streamUrl:safeUrl(item.streamUrl||item.previewUrl||item.playUrl||item.url),downloadUrl:safeUrl(item.downloadUrl),sourceUrl:safeUrl(item.sourceUrl),artwork:safeUrl(item.artwork),downloadable:!!item.downloadable,previewOnly:!!item.previewOnly,licenseUrl:safeUrl(item.licenseUrl),savedAt:Date.now()};
    await dbPut('saved', record);
    setStatus('Spremljeno u Laninu biblioteku. ❤️', 'ok');
    await refreshCurrentPane();
  }

  async function unsaveItem(id) {
    await dbDelete('saved', id);
    setStatus('Uklonjeno iz Spremljenog.', 'ok');
    await refreshCurrentPane();
  }

  async function requestPersistentStorage() {
    if (navigator.storage?.persist) { try { await navigator.storage.persist(); } catch {} }
  }

  async function downloadItem(item) {
    if (!item?.id) return;
    if (!item.downloadable) { setStatus('Ovaj izvor ne nudi dopušten izravni download.', 'warn'); return; }
    const url = safeUrl(item.downloadUrl || item.streamUrl || item.url);
    if (!url) { setStatus('Nema izravne poveznice za preuzimanje.', 'warn'); return; }
    setStatus('Preuzimam za offline slušanje…');
    try {
      await requestPersistentStorage();
      const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (!blob.size) throw new Error('Prazna datoteka');
      const contentType = blob.type || response.headers.get('content-type') || '';
      if (contentType && !contentType.includes('audio') && !contentType.includes('octet-stream')) throw new Error('Izvor nije vratio audio datoteku');
      const record = {id:item.id,name:item.name||'Bez naziva',artist:item.artist||'',source:item.source||'Lana',artwork:safeUrl(item.artwork),sourceUrl:safeUrl(item.sourceUrl),licenseUrl:safeUrl(item.licenseUrl),contentType,size:blob.size,downloadedAt:Date.now(),blob};
      await dbPut('downloads', record);
      await saveItem({ ...item, downloadable: true });
      setStatus(`Preuzeto za offline: ${formatBytes(blob.size)}. ⬇️`, 'ok');
      await renderDownloads();
      await updateStorageInfo();
    } catch (err) {
      setStatus(`Preuzimanje nije uspjelo. Izvor možda blokira izravni download (${err?.message || 'greška'}).`, 'bad');
    }
  }

  async function removeDownload(id) {
    await dbDelete('downloads', id);
    setStatus('Offline kopija je obrisana. Spremljena stavka ostaje u biblioteci.', 'ok');
    await renderDownloads();
    await renderSaved();
    await updateStorageInfo();
  }

  function makeBadge(text, cls = '') {
    const span = document.createElement('span');
    span.className = `lana-music-badge ${cls}`.trim();
    span.textContent = text;
    return span;
  }

  async function renderItemCard(item, context) {
    const card = document.createElement('div');
    card.className = 'lana-music-card';
    const art = document.createElement('div');
    art.className = 'lana-music-art';
    if (item.artwork) {
      const img = document.createElement('img');
      img.src = item.artwork; img.alt = ''; img.loading = 'lazy'; img.onerror = () => { art.textContent = '🎵'; }; art.appendChild(img);
    } else art.textContent = '🎵';
    const info = document.createElement('div'); info.className = 'lana-music-info';
    const title = document.createElement('div'); title.className = 'lana-music-title'; title.textContent = item.name || 'Bez naziva';
    const meta = document.createElement('div'); meta.className = 'lana-music-meta'; meta.textContent = [item.artist, item.source].filter(Boolean).join(' • ');
    const badges = document.createElement('div'); badges.className = 'lana-music-badges';
    const downloaded = context === 'downloads' ? true : await isDownloaded(item.id);
    if (downloaded) badges.appendChild(makeBadge('OFFLINE', 'offline'));
    if (item.previewOnly) badges.appendChild(makeBadge('PREVIEW', 'preview'));
    if (item.downloadable && !downloaded) badges.appendChild(makeBadge('DOWNLOAD DOSTUPAN'));
    const actions = document.createElement('div'); actions.className = 'lana-music-actions';
    const play = document.createElement('button'); play.type='button'; play.className='primary'; play.textContent='▶️ Pusti'; play.addEventListener('click',()=>playItem(item)); actions.appendChild(play);
    if (context !== 'saved' && context !== 'downloads') { const save=document.createElement('button'); save.type='button'; save.textContent='❤️ Sačuvaj'; save.addEventListener('click',()=>saveItem(item)); actions.appendChild(save); }
    if (item.downloadable && !downloaded) { const download=document.createElement('button'); download.type='button'; download.textContent='⬇️ Preuzmi'; download.addEventListener('click',()=>downloadItem(item)); actions.appendChild(download); }
    if (context === 'saved') { const remove=document.createElement('button'); remove.type='button'; remove.className='danger'; remove.textContent='♡ Ukloni'; remove.addEventListener('click',()=>unsaveItem(item.id)); actions.appendChild(remove); }
    if (context === 'downloads') { const remove=document.createElement('button'); remove.type='button'; remove.className='danger'; remove.textContent='🗑️ Obriši offline'; remove.addEventListener('click',()=>removeDownload(item.id)); actions.appendChild(remove); }
    info.append(title, meta, badges, actions); card.append(art, info); return card;
  }

  async function renderList(container, items, context, emptyText) {
    if (!container) return;
    container.innerHTML = '';
    if (!items.length) { container.innerHTML = `<div class="lana-music-empty">${emptyText}</div>`; return; }
    for (const item of items) container.appendChild(await renderItemCard(item, context));
  }

  async function renderSaved() {
    const items = (await dbGetAll('saved').catch(() => [])).sort((a,b)=>(b.savedAt||0)-(a.savedAt||0));
    await renderList($('lanaMusicSavedList'), items, 'saved', 'Još nema spremljenih pjesama. ❤️');
  }

  async function renderDownloads() {
    const rows = (await dbGetAll('downloads').catch(() => [])).sort((a,b)=>(b.downloadedAt||0)-(a.downloadedAt||0));
    const items = rows.map(row => ({ ...row, streamUrl:'', downloadable:false }));
    await renderList($('lanaMusicDownloadList'), items, 'downloads', 'Još nema offline pjesama. Preuzete pjesme pojavit će se ovdje. ⬇️');
  }

  async function updateStorageInfo() {
    const rows = await dbGetAll('downloads').catch(() => []);
    const ownBytes = rows.reduce((sum,row)=>sum+(Number(row.size)||Number(row.blob?.size)||0),0);
    let extra='';
    if (navigator.storage?.estimate) { try { const estimate=await navigator.storage.estimate(); if (estimate.quota) extra=` • preglednik koristi ${formatBytes(estimate.usage||0)} / ${formatBytes(estimate.quota)}`; } catch {} }
    if ($('lanaMusicStorage')) $('lanaMusicStorage').textContent=`Lana offline glazba: ${rows.length} • ${formatBytes(ownBytes)}${extra}`;
  }

  async function localSearch(query) {
    const q=normalizeText(query); if(!q) return [];
    const [saved,downloads]=await Promise.all([dbGetAll('saved').catch(()=>[]),dbGetAll('downloads').catch(()=>[])]);
    const map=new Map();
    [...downloads.map(x=>({...x,source:x.source||'Offline',offline:true})),...saved].forEach(item=>{ const hay=normalizeText(`${item.name} ${item.artist}`); if(hay.includes(q)) map.set(item.id,item); });
    return [...map.values()];
  }

  async function searchItunes(query) {
    const endpoint=`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${SEARCH_LIMIT}&country=hr`;
    const response=await fetch(endpoint,{mode:'cors',credentials:'omit'}); if(!response.ok) throw new Error(`Apple katalog ${response.status}`);
    const data=await response.json();
    return (data.results||[]).filter(x=>x.previewUrl).map(x=>({id:resultId('itunes',[x.trackId,x.previewUrl]),name:x.trackName||'Bez naziva',artist:x.artistName||'',source:'Apple katalog',streamUrl:x.previewUrl,previewUrl:x.previewUrl,previewOnly:true,downloadable:false,sourceUrl:x.trackViewUrl||x.collectionViewUrl||'',artwork:x.artworkUrl100||'',durationMs:x.trackTimeMillis||0}));
  }

  function isOpenLicense(url, rights='') {
    const value=normalizeText(`${url||''} ${rights||''}`);
    return value.includes('creativecommons.org/licenses/')||value.includes('creativecommons.org/publicdomain/')||value.includes('public domain')||value.includes('cc0');
  }

  function archiveFileScore(file) {
    const name=String(file?.name||'').toLowerCase(); const format=String(file?.format||'').toLowerCase();
    if(!name||name.endsWith('.zip')||name.includes('spectrogram')) return -999;
    let score=0; if(file.source==='original') score+=10; if(name.endsWith('.mp3')) score+=8; if(format.includes('vbr mp3')) score+=6; if(name.endsWith('.ogg')||format.includes('ogg')) score+=4; if(name.endsWith('.m4a')) score+=3; return score;
  }

  async function hydrateArchiveDoc(doc) {
    const identifier=doc.identifier; if(!identifier) return null;
    const response=await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`,{mode:'cors',credentials:'omit'}); if(!response.ok) return null;
    const meta=await response.json(); const licenseUrl=doc.licenseurl||meta?.metadata?.licenseurl||''; const rights=meta?.metadata?.rights||''; if(!isOpenLicense(licenseUrl,rights)) return null;
    const files=(meta.files||[]).filter(f=>archiveFileScore(f)>0).sort((a,b)=>archiveFileScore(b)-archiveFileScore(a)); const file=files[0]; if(!file?.name) return null;
    const encodedName=file.name.split('/').map(encodeURIComponent).join('/'); const audioUrl=`https://archive.org/download/${encodeURIComponent(identifier)}/${encodedName}`;
    const title=Array.isArray(meta?.metadata?.title)?meta.metadata.title[0]:(meta?.metadata?.title||doc.title||file.title||file.name); const creatorRaw=meta?.metadata?.creator||doc.creator||''; const creator=Array.isArray(creatorRaw)?creatorRaw.join(', '):String(creatorRaw||'');
    return {id:resultId('archive',[identifier,file.name]),name:String(title||'Bez naziva'),artist:creator,source:'Internet Archive • otvorena licenca',streamUrl:audioUrl,downloadUrl:audioUrl,downloadable:true,previewOnly:false,sourceUrl:`https://archive.org/details/${encodeURIComponent(identifier)}`,licenseUrl:String(licenseUrl||''),artwork:`https://archive.org/services/img/${encodeURIComponent(identifier)}`};
  }

  async function searchArchive(query) {
    const phrase=query.trim().replace(/["()]/g,' '); const q=`mediatype:audio AND licenseurl:* AND (${phrase})`;
    const endpoint=`https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=creator&fl%5B%5D=licenseurl&rows=8&page=1&output=json`;
    const response=await fetch(endpoint,{mode:'cors',credentials:'omit'}); if(!response.ok) throw new Error(`Archive ${response.status}`);
    const data=await response.json(); const docs=data?.response?.docs||[]; const hydrated=await Promise.allSettled(docs.slice(0,6).map(hydrateArchiveDoc));
    return hydrated.filter(r=>r.status==='fulfilled'&&r.value).map(r=>r.value);
  }

  function dedupeResults(items) {
    const seen=new Set(); return items.filter(item=>{ const key=normalizeText(`${item.name}|${item.artist}|${item.source}|${item.streamUrl}`); if(!key||seen.has(key)) return false; seen.add(key); return true; });
  }

  async function runSearch(queryInput) {
    const query=String(queryInput??$('lanaMusicSearch')?.value??'').trim(); if(!query){setStatus('Upiši izvođača ili naziv pjesme.','warn');return;}
    lastQuery=query; if($('lanaMusicSearch')) $('lanaMusicSearch').value=query;
    setStatus(navigator.onLine?'Tražim u tvojoj biblioteci i na internetu…':'Offline si. Tražim samo Spremljeno i Preuzeto…');
    const local=await localSearch(query); let online=[];
    if(navigator.onLine){ const settled=await Promise.allSettled([searchItunes(query),searchArchive(query)]); for(const result of settled) if(result.status==='fulfilled') online.push(...result.value); if(settled.every(r=>r.status==='rejected')) setStatus('Internet pretraga trenutno nije dostupna. Lokalni rezultati su prikazani.','warn'); }
    searchResults=dedupeResults([...local,...online]);
    await renderList($('lanaMusicSearchResults'),searchResults,'search',navigator.onLine?'Nisam pronašla rezultat. Pokušaj izvođač + naziv pjesme.':'Nema odgovarajuće offline ili spremljene pjesme.');
    if(searchResults.length){ const fullCount=searchResults.filter(x=>x.downloadable).length; const previewCount=searchResults.filter(x=>x.previewOnly).length; setStatus(`Pronađeno ${searchResults.length}. Cijeli/download izvori: ${fullCount}; preview: ${previewCount}.`,'ok'); }
  }

  async function importFiles(fileList) {
    const files=[...(fileList||[])].filter(file=>file?.type?.startsWith('audio/')||/\.(mp3|m4a|aac|ogg|wav|flac)$/i.test(file?.name||''));
    if(!files.length){setStatus('Nisam pronašla audio datoteke u odabiru.','warn');return;}
    setStatus(`Spremam ${files.length} datoteka za offline…`); await requestPersistentStorage(); let count=0;
    for(const file of files){ const id=resultId('local',[file.name,file.size,file.lastModified]); const name=file.name.replace(/\.[^.]+$/,''); const record={id,name,artist:'',source:'Tvoj uređaj',artwork:'',sourceUrl:'',licenseUrl:'',contentType:file.type||'',size:file.size,downloadedAt:Date.now(),blob:file}; await dbPut('downloads',record); await dbPut('saved',{id,name,artist:'',source:'Tvoj uređaj',streamUrl:'',downloadUrl:'',sourceUrl:'',artwork:'',downloadable:false,previewOnly:false,savedAt:Date.now()}); count++; }
    setStatus(`${count} pjesama spremljeno je za offline slušanje. ⬇️`,'ok'); await renderDownloads(); await renderSaved(); await updateStorageInfo();
  }

  async function addDirectUrl() {
    const name=String($('lanaMusicUrlName')?.value||'').trim(); const artist=String($('lanaMusicUrlArtist')?.value||'').trim(); const url=safeUrl($('lanaMusicUrl')?.value||'');
    if(!name||!url){setStatus('Za audio URL trebam naziv i valjanu https poveznicu.','warn');return;}
    const item={id:resultId('direct',[name,artist,url]),name,artist,source:'Izravni audio URL',streamUrl:url,downloadUrl:url,downloadable:true,previewOnly:false,sourceUrl:url,artwork:''};
    searchResults=[item,...searchResults.filter(x=>x.id!==item.id)]; await saveItem(item); await renderList($('lanaMusicSearchResults'),searchResults,'search',''); $('lanaMusicUrlBox').hidden=true; setStatus('Audio URL dodan je u Spremljeno. Ako izvor dopušta, možeš ga i preuzeti za offline.','ok');
  }

  async function switchTab(tab) {
    currentTab=tab; document.querySelectorAll('[data-music-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.musicTab===tab)); document.querySelectorAll('[data-music-pane]').forEach(pane=>{pane.hidden=pane.dataset.musicPane!==tab;});
    if(tab==='saved') await renderSaved(); if(tab==='downloads'){await renderDownloads();await updateStorageInfo();}
  }

  async function refreshCurrentPane() {
    if(currentTab==='saved') await renderSaved(); else if(currentTab==='downloads'){await renderDownloads();await updateStorageInfo();} else if(lastQuery) await runSearch(lastQuery);
  }

  function bindEvents() {
    const audio=$('lanaMusicAudio'); const settings=readSettings(); audio.volume=settings.volume; $('lanaMusicVolume').value=String(Math.round(settings.volume*100)); $('lanaMusicVolumeText').textContent=`${Math.round(settings.volume*100)}%`;
    $('lanaMusicOpen').addEventListener('click',async()=>{const panel=$('lanaMusicPanel');panel.hidden=!panel.hidden;if(!panel.hidden) await refreshCurrentPane();});
    $('lanaMusicClose').addEventListener('click',()=>{$('lanaMusicPanel').hidden=true;}); $('lanaMusicPlay').addEventListener('click',togglePlay); $('lanaMusicPrev').addEventListener('click',()=>setQueueIndex(currentIndex-1)); $('lanaMusicNext').addEventListener('click',()=>setQueueIndex(currentIndex+1));
    $('lanaMusicVolume').addEventListener('input',event=>{const value=clamp(Number(event.target.value)/100,0,1);audio.volume=value;$('lanaMusicVolumeText').textContent=`${Math.round(value*100)}%`;saveSettings();});
    $('lanaMusicSeek').addEventListener('input',event=>{if(!Number.isFinite(audio.duration)||audio.duration<=0)return;audio.currentTime=(Number(event.target.value)/1000)*audio.duration;updateProgress();});
    document.querySelectorAll('[data-music-tab]').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.musicTab))); $('lanaMusicSearchButton').addEventListener('click',()=>runSearch()); $('lanaMusicSearch').addEventListener('keydown',event=>{if(event.key==='Enter')runSearch();}); $('lanaMusicFiles').addEventListener('change',event=>{importFiles(event.target.files);event.target.value='';}); $('lanaMusicUrlToggle').addEventListener('click',()=>{$('lanaMusicUrlBox').hidden=!$('lanaMusicUrlBox').hidden;}); $('lanaMusicCancelUrl').addEventListener('click',()=>{$('lanaMusicUrlBox').hidden=true;}); $('lanaMusicAddUrl').addEventListener('click',addDirectUrl);
    audio.addEventListener('play',updateNow); audio.addEventListener('pause',updateNow); audio.addEventListener('timeupdate',updateProgress); audio.addEventListener('loadedmetadata',updateProgress); audio.addEventListener('ended',()=>setQueueIndex(currentIndex+1)); audio.addEventListener('error',()=>{updateNow();setStatus(navigator.onLine?'Ovaj audio izvor trenutno se ne može reproducirati.':'Offline si. Ova pjesma nije preuzeta za offline slušanje.','bad');});
    window.addEventListener('online',()=>setStatus('Internet je ponovno dostupan.','ok')); window.addEventListener('offline',()=>setStatus('Offline način. Preuzete pjesme ostaju dostupne.','warn'));
    if('mediaSession'in navigator){try{navigator.mediaSession.setActionHandler('play',()=>audio.play());navigator.mediaSession.setActionHandler('pause',()=>audio.pause());navigator.mediaSession.setActionHandler('previoustrack',()=>setQueueIndex(currentIndex-1));navigator.mediaSession.setActionHandler('nexttrack',()=>setQueueIndex(currentIndex+1));navigator.mediaSession.setActionHandler('seekbackward',details=>{audio.currentTime=Math.max(0,audio.currentTime-(details.seekOffset||10));});navigator.mediaSession.setActionHandler('seekforward',details=>{audio.currentTime=Math.min(audio.duration||Infinity,audio.currentTime+(details.seekOffset||10));});}catch{}}
  }

  function exposeApi() {
    window.LanaMusic={version:RELEASE,open:()=>{$('lanaMusicPanel').hidden=false;},close:()=>{$('lanaMusicPanel').hidden=true;},search:async query=>{await switchTab('search');$('lanaMusicPanel').hidden=false;return runSearch(query);},play:togglePlay,pause:()=>$('lanaMusicAudio')?.pause(),next:()=>setQueueIndex(currentIndex+1),previous:()=>setQueueIndex(currentIndex-1),setVolume:value=>{const audio=$('lanaMusicAudio');const normalized=clamp(Number(value)>1?Number(value)/100:Number(value),0,1);audio.volume=normalized;$('lanaMusicVolume').value=String(Math.round(normalized*100));$('lanaMusicVolumeText').textContent=`${Math.round(normalized*100)}%`;saveSettings();},playFirstSearchResult:async()=>{if(searchResults[0])await playItem(searchResults[0],true);},refresh:refreshCurrentPane};
  }

  async function install() {
    if(window.__lanaMusic0916Installed)return; window.__lanaMusic0916Installed=true; createUi(); bindEvents(); exposeApi(); await openDb().catch(err=>setStatus(err.message,'bad')); await renderSaved(); await renderDownloads(); await updateStorageInfo(); await renderList($('lanaMusicSearchResults'),[],'search','Upiši pjesmu ili izvođača. Lana će prvo pogledati tvoju biblioteku, zatim dostupne internetske izvore.');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
