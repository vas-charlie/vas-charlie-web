const CACHE = 'lana-static-v0.9.7-hotfix3';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/lana-shell.webp',
  '/lana-hotfix-097.js?v=097h3',
  '/version.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('lana-static-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

function injectHotfix(html) {
  html = html.replace(/<script src="\/lana-hotfix-097\.js[^\"]*"><\/script>\s*/g, '');
  return html.replace('</body>', '<script src="/lana-hotfix-097.js?v=097h3"></script>\n</body>');
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(async res => {
        if (!res.ok) return res;
        const type = res.headers.get('content-type') || '';
        if (!type.includes('text/html')) return res;
        const html = injectHotfix(await res.text());
        const headers = new Headers(res.headers);
        headers.set('content-type', 'text/html; charset=utf-8');
        const patched = new Response(html, {status: res.status, statusText: res.statusText, headers});
        caches.open(CACHE).then(cache => cache.put('/index.html', patched.clone()));
        return patched;
      }).catch(async () => {
        const cached = await caches.match('/index.html');
        if (!cached) return Response.error();
        const html = injectHotfix(await cached.text());
        return new Response(html, {headers:{'content-type':'text/html; charset=utf-8'}});
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res.ok) caches.open(CACHE).then(cache => cache.put(req, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
