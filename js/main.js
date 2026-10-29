import { save, persist } from './storage.js';
import { WORLD_COUNT, LEVELS_PER_WORLD, TOTAL_LEVELS, worldInfo, generateLevel } from './levels.js';
import { Game, COST } from './game.js';
import { openModal, toast, updateCoins, starsHTML } from './ui.js';
import { icon, star, coin, placeIcon } from './lowpoly.js';
import { dev, gallery, initDevFromUrl, attachDevBar, galleryScreen, openDevMenu } from './dev.js';

initDevFromUrl();

const app = document.getElementById('app');
let game = null;

function mount(el) {
  game?.destroy();
  game = null;
  document.getElementById('modal-root').replaceChildren();
  app.replaceChildren(...(el ? [el] : []));
}

function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

const worldOf = (g) => Math.floor(g / LEVELS_PER_WORLD);
const currentWorld = () => Math.min(worldOf(save.next), WORLD_COUNT - 1);

function worldStars(w) {
  let s = 0;
  for (let l = 0; l < LEVELS_PER_WORLD; l++) s += save.stars[w * LEVELS_PER_WORLD + l] || 0;
  return s;
}
const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);

// ---------- Mapa de mundos ----------
function showMap() {
  gallery.active = false;
  const cur = currentWorld();
  let items = '';
  for (let w = 0; w < WORLD_COUNT; w++) {
    const i = worldInfo(w);
    const locked = w > cur;
    items += `<button class="world${locked ? ' locked' : ''}${w === cur ? ' current' : ''}" data-w="${w}" style="--h:${i.hue}">
      <span class="w-badge">${placeIcon(i.place)}</span>
      <span class="w-text"><small>Mundo ${w + 1}</small><b>${i.name}</b></span>
      <span class="w-stars">${locked ? icon('lock') : `${star(true)} ${worldStars(w)}/${LEVELS_PER_WORLD * 3}`}</span>
    </button>`;
  }
  const done = save.next >= TOTAL_LEVELS;
  const el = h(`<div class="screen map">
    <header class="top">
      <div class="brand"><b>Solitario</b><span>de los Mundos</span></div>
      <div class="top-right">
        ${dev.on ? '<button class="dev-pill" data-a="dev">DEV</button>' : ''}
        <div class="pill stars-pill">${star(true)}${totalStars()}</div>
        <div class="pill coins">${coin()}<span data-coins>${save.coins}</span></div>
        <button class="icon-btn" data-a="shop" aria-label="Tienda">${icon('bag', '#ffd0e6', '#ff7fb6')}</button>
      </div>
    </header>
    <div class="world-list">${items}<div class="list-end">¡${WORLD_COUNT} mundos · ${TOTAL_LEVELS} niveles!</div></div>
    <button class="btn play-fab" data-a="continue">${done ? `${icon('trophy', '#7a4a00', '#5a3500')} ¡Todo completado!` : `${icon('next', '#7a4a00', '#5a3500')} Mundo ${cur + 1} · Nivel ${(save.next % LEVELS_PER_WORLD) + 1}`}</button>
  </div>`);
  el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'shop') return openShop();
    if (a === 'dev') return openDevMenu({ onGallery: () => showGallery(save.next), onPlay: startLevel, onRefresh: showMap });
    if (a === 'continue') return done ? null : startLevel(save.next);
    const w = e.target.closest('[data-w]');
    if (!w) return;
    if (w.classList.contains('locked')) return toast('Completa el mundo anterior para desbloquearlo');
    showWorld(+w.dataset.w);
  });
  mount(el);
  el.querySelector('.world.current')?.scrollIntoView({ block: 'center' });
}

// ---------- Pantalla de un mundo ----------
function showWorld(w) {
  gallery.active = false;
  const i = worldInfo(w);
  const cur = currentWorld();
  let nodes = '';
  for (let l = 0; l < LEVELS_PER_WORLD; l++) {
    const g = w * LEVELS_PER_WORLD + l;
    const open = g <= save.next;
    const boss = l === LEVELS_PER_WORLD - 1;
    nodes += `<button class="node${open ? '' : ' locked'}${g === save.next ? ' current' : ''}${boss ? ' boss' : ''}" data-g="${g}" style="--o:${Math.sin(l * 1.25).toFixed(3)}">
      <span class="n">${boss ? icon('crown', '#fff6c9', '#ffd34d') : open ? l + 1 : icon('lock')}</span>
      <span class="ns">${open && save.stars[g] ? starsHTML(save.stars[g]) : ''}</span>
    </button>`;
  }
  const el = h(`<div class="screen world-screen" style="--h:${i.hue}">
    <header class="top">
      <button class="icon-btn" data-a="map" aria-label="Mapa">${icon('menu')}</button>
      <div class="w-head">
        <button class="arrow" data-a="prev" aria-label="Mundo anterior" ${w === 0 ? 'disabled' : ''}>${icon('prev')}</button>
        <div><small>Mundo ${w + 1}</small><b>${placeIcon(i.place)} ${i.name}</b></div>
        <button class="arrow" data-a="next" aria-label="Mundo siguiente" ${w >= Math.min(cur, WORLD_COUNT - 1) ? 'disabled' : ''}>${icon('next')}</button>
      </div>
      <div class="pill coins">${coin()}<span data-coins>${save.coins}</span></div>
    </header>
    <div class="path-scroll"><div class="deco">${placeIcon(i.place)}</div><div class="path">${nodes}</div></div>
    <div class="world-foot">${star(true)} ${worldStars(w)} / ${LEVELS_PER_WORLD * 3}</div>
  </div>`);
  el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'map') return showMap();
    if (a === 'prev') return showWorld(w - 1);
    if (a === 'next') return showWorld(w + 1);
    const n = e.target.closest('[data-g]');
    if (!n) return;
    if (n.classList.contains('locked')) return toast('Completa el nivel anterior');
    startLevel(+n.dataset.g);
  });
  mount(el);
  const sc = el.querySelector('.path-scroll');
  sc.scrollTop = sc.scrollHeight;
  el.querySelector('.node.current')?.scrollIntoView({ block: 'center' });
}

// ---------- Partida ----------
function startLevel(g) {
  mount(null);
  const level = generateLevel(g);
  const w = level.world;
  game = new Game(app, level, {
    // Si se entró desde la galería dev, salir regresa a la galería donde estaba.
    onExit: () => (dev.on && gallery.active ? showGallery() : showWorld(w)),
    onRetry: () => startLevel(g),
    onNext: () => {
      const n = g + 1;
      if (n >= TOTAL_LEVELS) return showMap();
      if (worldOf(n) !== w) {
        showWorld(worldOf(n));
        toast('¡Nuevo mundo desbloqueado!');
      } else startLevel(n);
    },
    dev,
    onWin: (stars, coins) => {
      // En modo dev se puede saltar a cualquier nivel: solo cuenta si ya estaba desbloqueado.
      if (g > save.next) return;
      save.stars[g] = Math.max(save.stars[g] || 0, stars);
      save.coins += coins;
      if (g >= save.next) save.next = g + 1;
      persist();
      updateCoins();
    },
  });
  if (dev.on) attachDevBar(game, { go: startLevel, toGallery: () => showGallery(gallery.active ? undefined : g) });
  if (!save.tutorial) {
    save.tutorial = true;
    persist();
    openModal({
      title: 'Cómo jugar',
      body: `<ul class="howto">
        <li>Toca una carta <b>un número mayor o menor</b> que la carta de abajo.</li>
        <li>La <b>A</b> y la <b>K</b> se conectan.</li>
        <li>Sin jugadas, toca el <b>mazo</b> para sacar otra carta.</li>
        <li>Limpia el tablero. ¡Las cartas que sobren dan estrellas y monedas!</li>
        <li>${star(true)} Comodín: cualquier carta vale encima. ${icon('undo')} Deshacer.</li>
      </ul>`,
      buttons: [{ label: '¡A jugar!' }],
    });
  }
}

// ---------- Galería (modo dev) ----------
function showGallery(start) {
  if (start != null) gallery.start = Math.max(0, start - (start % 24));
  mount(galleryScreen({ onPlay: startLevel, onBack: showMap }));
}

// ---------- Tienda ----------
function openShop() {
  const today = new Date().toDateString();
  const gift = save.gift !== today;
  const buy = (price, fn, msg) => () => {
    save.coins -= price;
    fn();
    persist();
    updateCoins();
    toast(msg);
  };
  openModal({
    title: 'Tienda',
    body: `<p class="inv">${coin()} ${save.coins} · ${star(true)} ${save.wild} comodines · ${icon('undo')} ${save.undo} deshacer</p>`,
    buttons: [
      {
        label: `${icon('gift', '#ff8fb8', '#e2457f')} ${gift ? `Regalo diario · +150 ${coin()}` : 'Vuelve mañana'}`,
        disabled: !gift,
        onClick: () => {
          save.gift = today;
          save.coins += 150;
          persist();
          updateCoins();
          toast('+150 monedas');
        },
      },
      { label: `${star(true)} 1 comodín · ${coin()} ${COST.wild}`, disabled: save.coins < COST.wild, onClick: buy(COST.wild, () => save.wild++, '+1 comodín') },
      { label: `${icon('undo', '#7a4a00', '#5a3500')} 3 deshacer · ${coin()} ${COST.undo}`, disabled: save.coins < COST.undo, onClick: buy(COST.undo, () => (save.undo += 3), '+3 deshacer') },
      { label: 'Cerrar', cls: 'ghost' },
    ],
  });
}

showMap();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
