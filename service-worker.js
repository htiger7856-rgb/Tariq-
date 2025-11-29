
const CACHE_NAME = 'invoice-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  // libs from CDN are fetched online; still add core files
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', (e) => {
  // Network-first for dynamic libs (cdn), cache-first for app shell
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        // cache html/css/js responses from same origin
        if (e.request.url.startsWith(self.location.origin)) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(c=>c.put(e.request, copy));
        }
        return resp;
      }).catch(()=> cached || new Response('', {status:503, statusText:'offline'}));
    })
  );
});
