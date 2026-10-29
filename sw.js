// Red primero, caché como respaldo: siempre la última versión y funciona sin conexión.
const CACHE = 'solitario-v5';
const FILES = [
  './', 'index.html', 'css/styles.css', 'manifest.webmanifest', 'icon.svg',
  'js/main.js', 'js/game.js', 'js/lowpoly.js', 'js/dev.js', 'js/levels.js', 'js/rng.js', 'js/storage.js', 'js/ui.js', 'js/economy.js', 'js/coach.js',
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
