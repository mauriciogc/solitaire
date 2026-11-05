// Red primero, caché como respaldo: siempre la última versión y funciona sin conexión.
const CACHE = 'solitario-v96';
const FILES = [
  './', 'index.html', 'css/styles.css', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'js/main.js', 'js/game.js', 'js/art.js', 'js/biomes.js', 'js/galaxy.js', 'js/dev.js', 'js/levels.js', 'js/rng.js', 'js/storage.js', 'js/ui.js', 'js/economy.js', 'js/coach.js', 'js/engine.js', 'js/shop.js', 'js/travelers.js', 'js/events.js', 'js/event-data.js', 'js/path-data.js', 'js/special-data.js', 'js/soft-data.js',
  'vendor/three.module.min.js', 'fonts/baloo2.woff2', 'fonts/lilita-one.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request)),
  );
});
