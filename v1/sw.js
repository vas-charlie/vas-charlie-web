const VERSION='1.0.0';
const CACHE='vc-os-'+VERSION;
const ASSETS=['./','./index.html','./app.js','./backup.js','./db.js','./offline-core.js','./shift-core.js','./finance-core.js','./report-core.js','./report-ui.js','./history-core.js','./route-core.js','./translations.js','./messages-ui.js','./payment-ui.js','./version.json','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('vc-os-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(e.request,r.clone()));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))) )});
