// Red primero, caché como respaldo: siempre la última versión y funciona sin conexión.
// cache: 'no-cache' pregunta siempre al servidor (GitHub Pages pide guardar 10 minutos y se veía la versión vieja).
const CACHE = 'solitario-v200';
const FILES = [
  './', 'index.html', 'css/styles.css', 'manifest.webmanifest', 'icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'js/main.js', 'js/game.js', 'js/art.js', 'js/biomes.js', 'js/galaxy.js', 'js/dev.js', 'js/levels.js', 'js/rng.js', 'js/storage.js', 'js/ui.js', 'js/economy.js', 'js/coach.js', 'js/engine.js', 'js/shop.js', 'js/travelers.js', 'js/events.js', 'js/codes.js', 'js/meteor.js', 'js/missions.js', 'js/themes.js', 'js/sets.js', 'js/set-art.js', 'js/set-travelers.js', 'js/avatar3d.js', 'js/costumes/a.js', 'js/costumes/b.js', 'js/costumes/c.js', 'js/costumes/d.js', 'js/costumes/e.js', 'js/costumes/f.js', 'js/costumes/g.js', 'js/costumes/h.js', 'js/costumes/i.js', 'js/costumes/j.js', 'js/passport.js', 'js/starshower.js', 'js/festival-art.js', 'js/festival-travelers.js',
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
  // El icono y el manifest los pide el iPhone directo (al agregar a inicio no salía el icono: sospecha del service worker).
  if (/\/icons\/|manifest\.webmanifest$/.test(new URL(e.request.url).pathname)) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request)),
  );
});
