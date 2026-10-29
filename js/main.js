import { save, prefs, persist, resetProfile, renameProfile } from './storage.js';
import { WORLD_COUNT, LEVELS_PER_WORLD, TOTAL_LEVELS, worldInfo, generateLevel, variantLevel } from './levels.js';
import { Game } from './game.js';
import { DAILY_PATH, dailyState, starsNeeded, TICKET_PRICE, ticketCost, coinsFor } from './economy.js';
import { openModal, toast, updateCoins, starsHTML, esc } from './ui.js';
import { icon, star, coin, placeIcon, avatarHTML, AVATAR_HUES } from './lowpoly.js';
import { dev, gallery, initDevFromUrl, attachDevBar, galleryScreen, openDevMenu } from './dev.js';

initDevFromUrl();

const app = document.getElementById('app');
let game = null;
let current = null; // cómo volver a dibujar la pantalla actual (para prender/apagar el modo dev)

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
// El mundo en el que vas: el del siguiente nivel, salvo que aún no lo hayas abierto con el boleto dorado.
const currentWorld = () => Math.min(worldOf(save.next), save.open, WORLD_COUNT - 1);
const goldTicket = () => icon('ticket', '#ffe680', '#f5a91c');
// Estrellas ganadas en los mundos anteriores a w (las que cuentan para abrirlo).
const starsBefore = (w) => Object.entries(save.stars).reduce((a, [g, s]) => a + (+g < w * LEVELS_PER_WORLD ? s : 0), 0);
// ¿El siguiente nivel está en un mundo que hay que abrir?
const pendingWorld = () => (worldOf(save.next) > save.open && save.next < TOTAL_LEVELS ? worldOf(save.next) : null);
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
  ${save.gold ? `<div class="pill gold">${goldTicket()}<span>${save.gold}</span></div>` : ''}
  <div class="pill tickets">${ticket()}<span data-tickets>${save.tickets}</span></div>
  <div class="pill coins">${coin()}<span data-coins>${save.coins}</span></div>`;

// ---------- Mapa de mundos ----------
function showMap() {
  current = showMap;
  gallery.active = false;
  const cur = currentWorld();
  let items = '';
  for (let w = 0; w < WORLD_COUNT; w++) {
    const i = worldInfo(w);
    const locked = w > cur;
    const gate = locked && w === pendingWorld();
    items += `<button class="world${locked ? ' locked' : ''}${gate ? ' gate' : ''}${w === cur ? ' current' : ''}" data-w="${w}" style="--h:${i.hue}">
      <span class="w-badge">${placeIcon(i.place)}</span>
      <span class="w-text"><small>Mundo ${w + 1}</small><b>${i.name}</b></span>
      <span class="w-stars">${gate ? `${goldTicket()} ${star(true)} ${starsNeeded(w)}` : locked ? icon('lock') : `${star(true)} ${worldStars(w)}/${LEVELS_PER_WORLD * 3}`}</span>
    </button>`;
  }
  const done = save.next >= TOTAL_LEVELS;
  const run = save.run;
  const gateW = pendingWorld();
  const fab = run
    ? `${icon('next', '#7a4a00', '#5a3500')} Continuar · ${levelName(run.g)}`
    : gateW != null
      ? `${goldTicket()} Abrir Mundo ${gateW + 1}`
      : done
      ? `${icon('trophy', '#7a4a00', '#5a3500')} ¡Todo completado!`
      : `${icon('next', '#7a4a00', '#5a3500')} ${levelName(save.next)} · ${entryCost(save.next)} ${ticket(true)}`;
  const el = h(`<div class="screen map">
    <header class="top">
      <button class="profile-btn" data-a="profile" aria-label="Jugador">${avatarHTML(save)}<span>${esc(save.name)}</span></button>
      <div class="top-right">
        ${dev.on ? '<button class="dev-pill" data-a="dev">DEV</button>' : ''}
        ${walletHTML()}
        <button class="icon-btn gift-btn${dailyState(save.daily).claimed ? '' : ' ready'}" data-a="daily" aria-label="Regalo diario">${icon('gift', '#ff8fb8', '#e2457f')}</button>
        <button class="icon-btn" data-a="shop" aria-label="Tienda">${icon('bag', '#ffd0e6', '#ff7fb6')}</button>
      </div>
    </header>
    <div class="world-list">${items}<div class="list-end">¡${WORLD_COUNT} mundos · ${TOTAL_LEVELS} niveles! · ${star(true)} ${totalStars()}</div></div>
    <button class="btn play-fab" data-a="continue">${fab}</button>
  </div>`);
  el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'shop') return openShop();
    if (a === 'daily') return openDaily();
    if (a === 'profile') return openProfiles();
    if (a === 'dev') return openDevMenu({ onGallery: () => showGallery(save.next), onPlay: (g) => startLevel(g, { free: true }), onRefresh: boot });
    if (a === 'continue') return run ? enterLevel(run.g) : gateW != null ? openWorldGate(gateW) : done ? null : enterLevel(save.next);
    const w = e.target.closest('[data-w]');
    if (!w) return;
    if (w.classList.contains('gate')) return openWorldGate(+w.dataset.w);
    if (w.classList.contains('locked')) return toast('Completa el mundo anterior para desbloquearlo');
    showWorld(+w.dataset.w);
  });
  mount(el);
  el.querySelector('.world.current')?.scrollIntoView({ block: 'center' });
}

// ---------- Pantalla de un mundo ----------
function showWorld(w) {
  current = () => showWorld(w);
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
  if (worldOf(g) > save.open && !dev.infinite) return openWorldGate(worldOf(g));
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
      if (worldOf(n) > save.open) return openWorldGate(worldOf(n), () => showWorld(worldOf(g)));
      enterLevel(n);
    },
    onWin: (stars) => {
      clearRun();
      // En modo dev se puede saltar a cualquier nivel: solo cuenta si ya estaba desbloqueado.
      if (g > save.next) return { coins: 0, tickets: 0, prev: 0 };
      const prev = save.stars[g] || 0;
      const coins = coinsFor(g, stars, prev);
      // El boleto de regalo es solo la primera vez que se gana el nivel.
      const tickets = prev ? 0 : 1;
      // El jefe da el boleto dorado para abrir el mundo siguiente (solo la primera vez).
      const gold = !prev && level.boss && worldOf(g) + 1 < WORLD_COUNT ? 1 : 0;
      save.stars[g] = Math.max(prev, stars);
      save.coins += coins;
      save.tickets += tickets;
      save.gold += gold;
      if (g >= save.next) save.next = g + 1;
      if (g === 0) save.tutorial = true;
      persist();
      updateCoins();
      return { coins, tickets, prev, gold };
    },
  });
  game.attachDev = () => attachDevBar(game, { go: (n) => startLevel(n, { free: true }), toGallery: () => showGallery(gallery.active ? undefined : g) });
  current = null;
  if (dev.on) game.attachDev();
}

// ---------- Galería (modo dev) ----------
function showGallery(start) {
  current = () => showGallery();
  if (start != null) gallery.start = Math.max(0, start - (start % 24));
  mount(galleryScreen({ onPlay: (g) => startLevel(g, save.run?.g === g ? { resume: true } : { free: true }), onBack: showMap }));
}

// ---------- Tienda ----------
// Comodín, deshacer y boletos ya no se venden aquí: se compran en el momento (dentro del nivel o al entrar).
// La tienda de barajas y avatares llega en su fase.
function openShop() {
  openModal({
    title: 'Tienda',
    body: '<p>Muy pronto: barajas, avatares y adornos para tu perfil.</p>',
    buttons: [{ label: 'Cerrar', cls: 'ghost' }],
  });
}

// ---------- Regalo diario ----------
// Camino de 28 días; si un día no se reclama se vuelve al día 1 (ver dailyState).
const prizeHTML = (p) =>
  [p.coins && `${coin()}${p.coins}`, p.tickets && `${ticket()}${p.tickets}`, p.undo && `${icon('undo')}${p.undo}`, p.wild && `${star(true)}${p.wild}`].filter(Boolean).join(' ');

function openDaily() {
  const st = dailyState(save.daily);
  const days = DAILY_PATH.map(
    (p, i) => `<div class="day${i < st.day || (st.claimed && i === st.day - 1) ? ' got' : ''}${i === st.day && !st.claimed ? ' today' : ''}${p.chest || p.wild || p.undo ? ' big' : ''}">
      <small>Día ${i + 1}</small><span>${p.chest ? icon('gift', '#ff8fb8', '#e2457f') : ''}${prizeHTML(p)}</span></div>`,
  ).join('');
  openModal({
    title: 'Regalo diario',
    body: `${st.reset ? '<p class="note">Se rompió tu racha: vuelves al día 1.</p>' : ''}
      <p>Entra cada día: los premios crecen. Si un día faltas, vuelves al inicio.</p>
      <div class="daily-path">${days}</div>`,
    buttons: [
      {
        label: st.claimed ? 'Vuelve mañana' : `Reclamar día ${st.day + 1}`,
        disabled: st.claimed,
        onClick: () => {
          const p = DAILY_PATH[st.day];
          save.coins += p.coins || 0;
          save.tickets += p.tickets || 0;
          save.undo += p.undo || 0;
          save.wild += p.wild || 0;
          save.daily = { day: (st.day + 1) % DAILY_PATH.length, last: new Date().toDateString() };
          persist();
          updateCoins();
          document.querySelector('.gift-btn')?.classList.remove('ready');
          toast(`Día ${st.day + 1}: ${[p.coins && `+${p.coins} monedas`, p.tickets && `+${p.tickets} boleto${p.tickets > 1 ? 's' : ''}`, p.undo && `+${p.undo} deshacer`, p.wild && `+${p.wild} comodín`].filter(Boolean).join(', ')}`);
        },
      },
      { label: 'Cerrar', cls: 'ghost' },
    ],
  });
}

// ---------- Abrir un mundo: boleto dorado + estrellas ----------
function openWorldGate(w, onCancel) {
  const need = starsNeeded(w);
  const have = starsBefore(w);
  const okStars = have >= need;
  const okGold = save.gold > 0;
  openModal({
    title: `Abrir Mundo ${w + 1}`,
    body: `<p><b>${worldInfo(w).name}</b> te espera.</p>
      <ul class="summary gate-list">
        <li class="${okGold ? 'ok' : ''}"><span>${goldTicket()} Boleto dorado (lo da el jefe)</span><b>${okGold ? '✓' : '✗'}</b></li>
        <li class="${okStars ? 'ok' : ''}"><span>${star(true)} Estrellas</span><b>${have} / ${need}</b></li>
      </ul>
      ${okStars ? '' : `<p>Te faltan <b>${need - have}</b> estrellas: repite niveles para sacar más (repetir es gratis).</p>`}`,
    buttons: [
      {
        label: `Abrir con ${goldTicket()}`,
        disabled: !(okStars && okGold),
        onClick: () => {
          save.gold--;
          save.open = w;
          persist();
          showWorld(w);
          toast(`¡Mundo ${w + 1} abierto!`);
        },
      },
      { label: okStars ? 'Ahora no' : 'Ir por estrellas', cls: 'ghost', onClick: onCancel },
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

// Atajo de pruebas: la tecla 0 prende o apaga el modo dev en cualquier pantalla (se quitará al publicar).
window.addEventListener('keydown', (e) => {
  if (e.key !== '0' || e.metaKey || e.ctrlKey || e.target.closest?.('input, textarea')) return;
  prefs.dev = !prefs.dev;
  persist();
  toast(`Modo dev ${prefs.dev ? 'activado' : 'desactivado'}`);
  if (game) {
    game.el.querySelector('.dev-bar')?.remove();
    if (prefs.dev) game.attachDev();
  } else if (!prefs.dev && gallery.active) showMap();
  else current?.();
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
