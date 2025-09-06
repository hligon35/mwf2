/*
  Minimal service worker for offline resilience.
  - Cache-first for static assets (CSS, JS, images).
  - Network-first for HTML; fall back to /404.html when offline.
*/

const CACHE_NAME = 'mwf-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/images/Melalogo.png',
  '/images/Melapro.png',
  '/images/empower.avif',
  '/images/empower.jpg',
  '/images/produce.jpg',
  '/images/grains.jpg',
  '/images/delivery.avif',
  '/images/fooddelivery.jpg',
  '/images/nutrition.jpg',
  '/404.html',
  '/site.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
    ))
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // For navigation requests (HTML), try network first, then cache, then 404 fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Optionally update cache
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/404.html')))
    );
    return;
  }

  // For same-origin static assets, use cache-first
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached || fetch(req).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        }).catch(() => cached)
      )
    );
  }
});
