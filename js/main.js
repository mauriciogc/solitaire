import { save, persist, resetProfile, renameProfile } from './storage.js';
import { WORLD_COUNT, LEVELS_PER_WORLD, TOTAL_LEVELS, worldInfo, generateLevel, variantLevel } from './levels.js';
import { Game } from './game.js';
import { DAILY, TICKET_PRICE, ticketCost, coinsFor, price } from './economy.js';
import { openModal, toast, updateCoins, starsHTML, esc } from './ui.js';
import { icon, star, coin, placeIcon, avatarHTML, AVATAR_HUES } from './lowpoly.js';
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
const ticket = (dark) => (dark ? icon('ticket', '#7a4a00', '#5a3500') : icon('ticket', '#ffd0e6', '#ff7fb6'));
// Solo cuesta boletos un nivel que aún no has ganado; repetir uno ganado es gratis.
const entryCost = (g) => (save.stars[g] || dev.infinite ? 0 : ticketCost(g));
const levelName = (g) => `Mundo ${worldOf(g) + 1} · Nivel ${(g % LEVELS_PER_WORLD) + 1}`;

function worldStars(w) {
  let s = 0;
  for (let l = 0; l < LEVELS_PER_WORLD; l++) s += save.stars[w * LEVELS_PER_WORLD + l] || 0;
  return s;
}
const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);

const walletHTML = () => `
  <div class="pill tickets">${ticket()}<span data-tickets>${save.tickets}</span></div>
  <div class="pill coins">${coin()}<span data-coins>${save.coins}</span></div>`;

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
  const run = save.run;
  const fab = run
    ? `${icon('next', '#7a4a00', '#5a3500')} Continuar · ${levelName(run.g)}`
    : done
      ? `${icon('trophy', '#7a4a00', '#5a3500')} ¡Todo completado!`
      : `${icon('next', '#7a4a00', '#5a3500')} ${levelName(save.next)} · ${entryCost(save.next)} ${ticket(true)}`;
  const el = h(`<div class="screen map">
    <header class="top">
      <button class="profile-btn" data-a="profile" aria-label="Jugador">${avatarHTML(save)}<span>${esc(save.name)}</span></button>
      <div class="top-right">
        ${dev.on ? '<button class="dev-pill" data-a="dev">DEV</button>' : ''}
        ${walletHTML()}
        <button class="icon-btn" data-a="shop" aria-label="Tienda">${icon('bag', '#ffd0e6', '#ff7fb6')}</button>
      </div>
    </header>
    <div class="world-list">${items}<div class="list-end">¡${WORLD_COUNT} mundos · ${TOTAL_LEVELS} niveles! · ${star(true)} ${totalStars()}</div></div>
    <button class="btn play-fab" data-a="continue">${fab}</button>
  </div>`);
  el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'shop') return openShop();
    if (a === 'profile') return openProfiles();
    if (a === 'dev') return openDevMenu({ onGallery: () => showGallery(save.next), onPlay: (g) => startLevel(g, { free: true }), onRefresh: boot });
    if (a === 'continue') return run ? enterLevel(run.g) : done ? null : enterLevel(save.next);
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
    const paused = save.run?.g === g;
    nodes += `<button class="node${open ? '' : ' locked'}${g === save.next ? ' current' : ''}${boss ? ' boss' : ''}${paused ? ' paused' : ''}" data-g="${g}" style="--o:${Math.sin(l * 1.25).toFixed(3)}">
      <span class="n">${boss ? icon('crown', '#fff6c9', '#ffd34d') : open ? l + 1 : icon('lock')}</span>
      ${paused ? `<span class="pause-mark">${icon('pause', '#ffffff', '#ffe0ef')}</span>` : ''}
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
      <div class="top-right">${walletHTML()}</div>
    </header>
    <div class="path-scroll"><div class="deco">${placeIcon(i.place)}</div><div class="path">${nodes}</div></div>
    <div class="world-foot">${star(true)} ${worldStars(w)} / ${LEVELS_PER_WORLD * 3} · Nivel nuevo: ${ticketCost(w * LEVELS_PER_WORLD)} ${ticket()}</div>
  </div>`);
  el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'map') return showMap();
    if (a === 'prev') return showWorld(w - 1);
    if (a === 'next') return showWorld(w + 1);
    const n = e.target.closest('[data-g]');
    if (!n) return;
    if (n.classList.contains('locked')) return toast('Completa el nivel anterior');
    enterLevel(+n.dataset.g);
  });
  mount(el);
  const sc = el.querySelector('.path-scroll');
  sc.scrollTop = sc.scrollHeight;
  el.querySelector('.node.current')?.scrollIntoView({ block: 'center' });
}

// ---------- Entrar a un nivel: boletos y partida a medias ----------
function enterLevel(g) {
  const run = save.run;
  if (run && run.g === g) return startLevel(g, { resume: true });
  if (run) {
    return openModal({
      title: 'Tienes un nivel a medias',
      body: `<p><b>${levelName(run.g)}</b> sigue en juego. Termínalo, o abandónalo y pierdes su boleto.</p>`,
      buttons: [
        { label: 'Continuar ese nivel', onClick: () => startLevel(run.g, { resume: true }) },
        {
          label: 'Abandonarlo y jugar este',
          cls: 'ghost danger',
          onClick: () => {
            save.run = null;
            persist();
            enterLevel(g);
          },
        },
        { label: 'Cancelar', cls: 'ghost' },
      ],
    });
  }
  const cost = entryCost(g);
  if (!cost) return startLevel(g);
  if (save.tickets >= cost) {
    save.tickets -= cost;
    persist();
    toast(`−${cost} boleto${cost > 1 ? 's' : ''}`);
    return startLevel(g);
  }
  const need = cost - save.tickets;
  const price = need * TICKET_PRICE;
  openModal({
    title: 'Faltan boletos',
    body: `<p>Entrar a <b>${levelName(g)}</b> cuesta <b>${cost}</b> ${ticket()}. Tienes ${save.tickets}.</p>
      <p>Ganar un nivel por primera vez regala 1 boleto. Repetir niveles ganados es gratis.</p>`,
    buttons: [
      {
        label: `Comprar ${need} ${ticket(true)} y jugar · ${coin()} ${price}`,
        disabled: save.coins < price,
        onClick: () => {
          save.coins -= price;
          save.tickets += need;
          persist();
          updateCoins();
          enterLevel(g);
        },
      },
      { label: 'Ir a la tienda', cls: 'ghost', onClick: openShop },
      { label: 'Cancelar', cls: 'ghost' },
    ],
  });
}

// ---------- Partida ----------
// resume: retoma save.run · free: modo dev (sin boletos y sin guardar la partida)
function startLevel(g, { resume = false, free = false } = {}) {
  mount(null);
  const run = resume ? save.run : null;
  const v = run ? run.v : save.tries[g] || 0;
  // Solo se guarda la partida de un nivel nuevo; las repeticiones se pierden al salir.
  const saved = !!run || (!free && g === save.next);
  if (!run) {
    save.tries[g] = v + 1;
    if (saved) save.run = { g, v, state: null };
    persist();
  }
  const level = variantLevel(generateLevel(g), v);
  const back = () => (dev.on && gallery.active ? showGallery() : showWorld(worldOf(g)));
  const clearRun = () => {
    if (save.run?.g === g) save.run = null;
    persist();
  };
  game = new Game(app, level, {
    dev,
    resume: run?.state,
    saved,
    free: !!save.stars[g] || free || dev.infinite, // intento que no costó boleto
    tutorial: g === 0 && !save.tutorial,
    nextCost: g + 1 < TOTAL_LEVELS ? entryCost(g + 1) : 0,
    onSave: saved
      ? (state) => {
          save.run = { g, v, state };
          persist();
        }
      : null,
    onExit: back,
    onAbandon: () => {
      clearRun();
      back();
    },
    onRetry: () => {
      clearRun();
      enterLevel(g);
    },
    onNext: () => {
      const n = g + 1;
      if (n >= TOTAL_LEVELS) return showMap();
      if (worldOf(n) !== worldOf(g)) {
        showWorld(worldOf(n));
        toast('¡Nuevo mundo desbloqueado!');
      } else enterLevel(n);
    },
    onWin: (stars) => {
      clearRun();
      // En modo dev se puede saltar a cualquier nivel: solo cuenta si ya estaba desbloqueado.
      if (g > save.next) return { coins: 0, tickets: 0, prev: 0 };
      const prev = save.stars[g] || 0;
      const coins = coinsFor(g, stars, prev);
      // El boleto de regalo es solo la primera vez que se gana el nivel.
      const tickets = prev ? 0 : 1;
      save.stars[g] = Math.max(prev, stars);
      save.coins += coins;
      save.tickets += tickets;
      if (g >= save.next) save.next = g + 1;
      if (g === 0) save.tutorial = true;
      persist();
      updateCoins();
      return { coins, tickets, prev };
    },
  });
  if (dev.on) attachDevBar(game, { go: (n) => startLevel(n, { free: true }), toGallery: () => showGallery(gallery.active ? undefined : g) });
}

// ---------- Galería (modo dev) ----------
function showGallery(start) {
  if (start != null) gallery.start = Math.max(0, start - (start % 24));
  mount(galleryScreen({ onPlay: (g) => startLevel(g, save.run?.g === g ? { resume: true } : { free: true }), onBack: showMap }));
}

// ---------- Tienda ----------
function openShop() {
  const today = new Date().toDateString();
  const gift = save.gift !== today;
  const wild = price('wild', save.next);
  const undo = price('undo', save.next);
  const buy = (price, fn, msg) => () => {
    save.coins -= price;
    fn();
    persist();
    updateCoins();
    toast(msg);
  };
  openModal({
    title: 'Tienda',
    body: `<p class="inv">${coin()} ${save.coins} · ${ticket()} ${save.tickets} · ${star(true)} ${save.wild} · ${icon('undo')} ${save.undo}</p>`,
    buttons: [
      {
        label: `${icon('gift', '#ff8fb8', '#e2457f')} ${gift ? `Regalo diario · +${DAILY.coins} ${coin()} +${DAILY.tickets} ${ticket(true)}` : 'Vuelve mañana'}`,
        disabled: !gift,
        onClick: () => {
          save.gift = today;
          save.coins += DAILY.coins;
          save.tickets += DAILY.tickets;
          persist();
          updateCoins();
          toast(`+${DAILY.coins} monedas y +${DAILY.tickets} boletos`);
        },
      },
      { label: `${ticket(true)} 1 boleto · ${coin()} ${TICKET_PRICE}`, disabled: save.coins < TICKET_PRICE, onClick: buy(TICKET_PRICE, () => save.tickets++, '+1 boleto') },
      { label: `${ticket(true)} 5 boletos · ${coin()} ${TICKET_PRICE * 4.5}`, disabled: save.coins < TICKET_PRICE * 4.5, onClick: buy(TICKET_PRICE * 4.5, () => (save.tickets += 5), '+5 boletos') },
      { label: `${star(true)} 1 comodín · ${coin()} ${wild}`, disabled: save.coins < wild, onClick: buy(wild, () => save.wild++, '+1 comodín') },
      { label: `${icon('undo', '#7a4a00', '#5a3500')} 3 deshacer · ${coin()} ${undo}`, disabled: save.coins < undo, onClick: buy(undo, () => (save.undo += 3), '+3 deshacer') },
      { label: 'Cerrar', cls: 'ghost' },
    ],
  });
}

// ---------- Jugador ----------
// Tarjeta del jugador (versión sencilla; el diseño final llega con la revisión de UX).
function openProfiles() {
  openModal({
    title: '',
    body: `<div class="player-card">
        ${avatarHTML(save, 'big')}
        <b>${esc(save.name)}</b>
        <ul class="summary">
          <li><span>Vas en</span><b>${levelName(Math.min(save.next, TOTAL_LEVELS - 1))}</b></li>
          <li><span>Estrellas</span><b>${star(true)} ${totalStars()}</b></li>
          <li><span>Monedas</span><b>${coin()} ${save.coins}</b></li>
          <li><span>Boletos</span><b>${ticket()} ${save.tickets}</b></li>
        </ul>
      </div>`,
    buttons: [
      { label: 'Editar nombre y color', onClick: editProfile },
      {
        label: 'Reiniciar perfil',
        cls: 'ghost danger',
        onClick: () =>
          openModal({
            title: '¿Reiniciar tu perfil?',
            body: '<p>Se pierde todo: niveles, estrellas, monedas, boletos y comodines. Tu nombre se conserva. No se puede deshacer.</p>',
            buttons: [
              { label: 'Cancelar' },
              { label: 'Sí, reiniciar', cls: 'ghost danger', onClick: () => (resetProfile(), boot()) },
            ],
          }),
      },
      { label: 'Cerrar', cls: 'ghost' },
    ],
  });
}

// Formulario de jugador (crear o editar): nombre y color del avatar.
function profileForm({ title, name = '', avatar = 0, action, onSave, noCancel = false }) {
  openModal({
    title,
    body: `<div class="avatar-preview">${avatarHTML({ name, avatar }, 'big')}</div>
      <input class="text-in" maxlength="16" placeholder="Nombre" autocomplete="off" value="${esc(name)}">
      <div class="avatar-pick">${AVATAR_HUES.map((_, i) => `<button data-av="${i}" class="${i === avatar ? 'on' : ''}">${avatarHTML({ name, avatar: i })}</button>`).join('')}</div>`,
    buttons: [{ label: action, onClick: () => onSave(name.trim(), avatar) }, !noCancel && { label: 'Cancelar', cls: 'ghost' }].filter(Boolean),
  });
  const input = document.querySelector('.text-in');
  const paint = () => {
    const ch = name.trim().charAt(0).toUpperCase() || '?';
    document.querySelectorAll('.avatar-pick .avatar').forEach((a) => (a.textContent = ch));
    document.querySelector('.avatar-preview').innerHTML = avatarHTML({ name, avatar }, 'big');
  };
  input.addEventListener('input', () => {
    name = input.value;
    paint();
  });
  document.querySelector('.avatar-pick').addEventListener('click', (e) => {
    const b = e.target.closest('[data-av]');
    if (!b) return;
    avatar = +b.dataset.av;
    document.querySelectorAll('.avatar-pick button').forEach((x) => x.classList.toggle('on', x === b));
    paint();
  });
  input.focus();
}

// Primera vez: pedir nombre y color (no se puede cerrar sin elegir).
function welcome() {
  profileForm({
    title: '¡Bienvenido!',
    action: 'Empezar',
    noCancel: true,
    onSave: (name, avatar) => {
      renameProfile(name || 'Jugador', avatar);
      showMap();
    },
  });
}

function editProfile() {
  profileForm({
    title: 'Editar jugador',
    name: save.named ? save.name : '',
    avatar: save.avatar || 0,
    action: 'Guardar',
    onSave: (name, avatar) => {
      renameProfile(name || save.name, avatar);
      showMap();
    },
  });
}

// ---------- Arranque ----------
// Si quedó un nivel a medias (se cerró la ventana o se salió), se vuelve directo a él.
function boot() {
  if (save.run) return startLevel(save.run.g, { resume: true });
  showMap();
  if (!save.named) welcome();
}

boot();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
