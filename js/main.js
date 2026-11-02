import { save, prefs, persist, resetProfile, renameProfile, exportCode, readCode, loadProfile, setDev } from './storage.js';
import { UNLOCK, EVENTOS, isOn, nextEvent, daysToNextCol, plusCols, RACHA_GOALS, racha, rachaTheme, rachaReady, rachaHot, rachaWin, rachaLose, rachaClaim, msToMidnight, col, colLeft, colWin, colOffers, colBuy, ev, evLeft, evTicketLeft, evPrize, evEnter, evWin, evLose, evAlbum, EVENT_PLANETS, EVENT_PER_PLANET, EVENT_LEVELS } from './events.js';
import { WORLD_COUNT, LEVELS_PER_WORLD, TOTAL_LEVELS, worldInfo, generateLevel, variantLevel, MECH_INTRO, MECH_NAMES, secretId, isSecret, eventLevel } from './levels.js';
import { Game, faceHTML, backHTML } from './game.js';
import { DAILY_PATH, dailyState, starsNeeded, TICKET_PRICE, ticketCost, ticketRefund, coinsFor, bossChest, openSurprise, SECRET_MULT, SECRET_PRIZE } from './economy.js';
import { openModal, toast, updateCoins, money, esc, reduced, wait, flyToWallet, spendFromWallet, sparkle, confetti, starsHTML, warp, buzz, balloons, popBalloon } from './ui.js';
import { icon, star, coin, miniPlanet, avatarHTML, AVATAR_COLORS, cardBackURL, setDeck, lockIcon, chestBody, chestLid, boxBody, boxLid } from './art.js';
import { GROUPS, SECTIONS, ITEMS, shopItems, groupOf, owns, equipped, equip, buy, item, lockedUntil, titleHTML } from './shop.js';
import { BIOMES, biomeKey, EVENT_BIOMES } from './biomes.js';
import { dev, gallery, initDevFromUrl, attachDevBar, galleryScreen, openDevMenu } from './dev.js';

initDevFromUrl();
document.documentElement.classList.toggle('dev-on', !!prefs.dev);
// Reversos de los premios de racha (carta regalo violeta y comodín dorado), para todo el documento:
// las cartas que vuelan van fuera del tablero.
// Lo que el jugador eligió en la tienda: baraja, caras de las cartas y fondo del espacio.
function applyLook() {
  const root = document.documentElement;
  setDeck(equipped('back'));
  root.style.setProperty('--back', cardBackURL());
  for (const sec of ['face', 'space']) {
    root.classList.forEach((c) => c.startsWith(`${sec}-`) && root.classList.remove(c));
    root.classList.add(`${sec}-${equipped(sec)}`);
  }
}
applyLook();
document.documentElement.style.setProperty('--back-gift', cardBackURL('regalo'));
document.documentElement.style.setProperty('--back-wild', cardBackURL('comodin'));
// Escala de la interfaz según el lado corto de la pantalla (390 = alto de un teléfono acostado).
const setScale = () => document.documentElement.style.setProperty('--k', Math.max(0.85, Math.min(1.3, Math.min(innerWidth, innerHeight) / 390)).toFixed(3));
setScale();
// Se mide la página ya reacomodada (en iOS, al girar, el aviso de la ventana llega con el tamaño viejo).
// Orillas por el notch: con el teléfono acostado, iPhone reserva lo mismo en los dos lados aunque la cámara esté en uno.
// Se ve hacia dónde quedó la cámara y el otro lado se achica (queda un poco por la esquina redondeada). --cl / --cr; los botones siguen usando --sl / --sr.
const safeProbe = document.createElement('div');
safeProbe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)';
document.body.append(safeProbe);
const setSafe = () => {
  const cs = getComputedStyle(safeProbe);
  const l = parseFloat(cs.paddingLeft) || 0;
  const r = parseFloat(cs.paddingRight) || 0;
  // 90: girado a la izquierda (la cámara queda a la izquierda) · -90 / 270: a la derecha.
  const a = typeof window.orientation === 'number' ? window.orientation : screen.orientation?.angle;
  const both = l > 0 && Math.abs(l - r) < 1 && innerWidth > innerHeight;
  const s = document.documentElement.style;
  s.setProperty('--cl', both && (a === -90 || a === 270) ? '14px' : 'var(--sl)');
  s.setProperty('--cr', both && a === 90 ? '14px' : 'var(--sr)');
};
setSafe();
// Al girar, iPhone puede dejar la página desplazada o con zoom: el dibujo se ve en un lugar y los toques
// caen en otro. Se regresa a su lugar en cada cambio de tamaño y otra vez cuando el giro termina.
const pin = () => {
  if (scrollX || scrollY) scrollTo(0, 0);
  for (const e of [document.documentElement, document.body]) if (e.scrollTop || e.scrollLeft) e.scrollTop = e.scrollLeft = 0;
};
new ResizeObserver(() => (setScale(), setSafe(), pin())).observe(document.documentElement);
addEventListener('orientationchange', () => [0, 150, 400, 800].forEach((t) => setTimeout(() => (pin(), setSafe()), t)));
addEventListener('scroll', pin, { passive: true });
visualViewport?.addEventListener('resize', pin);

// Todo botón se hunde al tocarlo, al instante, para que se note que el toque llegó.
addEventListener('touchstart', () => {}, { passive: true }); // en iPhone, sin esto :active no se activa
addEventListener('pointerdown', (e) => {
  const b = e.target.closest?.('button:not(:disabled), .go');
  if (!b || b.closest('.board')) return;
  b.classList.remove('tapped');
  void b.offsetWidth; // reinicia la animación si se toca seguido
  b.classList.add('tapped');
  b.addEventListener('animationend', () => b.classList.remove('tapped'), { once: true });
}, { passive: true });

const app = document.getElementById('app');
let game = null;
let current = null; // cómo volver a dibujar la pantalla actual (para prender/apagar el modo dev)
let Galaxy = null; // se carga aparte (Three.js)
let PlanetView = null; // planeta solo, para la postal (mismo módulo)
let Universe = null; // todas las constelaciones (mismo módulo)

// ---------- Cambiar de pantalla ----------
// anim: 'up' = la nueva sube desde abajo (entrar al tablero) · 'down' = la actual baja y deja ver la nueva (salir).
function mount(el, anim) {
  game?.destroy();
  game = null;
  document.getElementById('modal-root').replaceChildren();
  const old = [...app.children];
  const drop = () => old.forEach((o) => (o._dispose?.(), o.remove()));
  if (!el) return drop();
  if (!anim || reduced() || !old.length) {
    drop();
    app.append(el);
    return;
  }
  if (anim === 'up') {
    app.append(el);
    old.forEach((o) => o.animate([{ opacity: 1, scale: 1 }, { opacity: 0.5, scale: 0.94 }], { duration: 520, easing: 'ease-out', fill: 'forwards' }));
    el.animate([{ translate: '0 100%' }, { translate: '0 0' }], { duration: 560, easing: 'cubic-bezier(0.2, 0.9, 0.25, 1)' }).finished.then(drop, drop);
  } else {
    app.prepend(el);
    el.animate([{ opacity: 0.4, scale: 0.94 }, { opacity: 1, scale: 1 }], { duration: 520, easing: 'ease-out' });
    Promise.all(old.map((o) => o.animate([{ translate: '0 0' }, { translate: '0 100%' }], { duration: 480, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'forwards' }).finished)).then(drop, drop);
  }
}

function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// Los niveles secretos tienen id aparte (después de los normales): ver secretId en levels.js.
const worldOf = (g) => (isSecret(g) ? g - TOTAL_LEVELS : Math.floor(g / LEVELS_PER_WORLD));
// El mundo en el que vas: el del siguiente nivel, salvo que aún no lo hayas abierto con el boleto dorado.
const currentWorld = () => Math.min(worldOf(save.next), save.open, WORLD_COUNT - 1);
// Las estrellas del nivel secreto son extra: suman al total y ayudan a abrir mundos (un mundo puede quedar 33/30).
const secretStars = (w) => save.secret[w] || 0;
const sumSecret = (until = Infinity) => Object.entries(save.secret).reduce((a, [w, s]) => a + (+w < until ? s : 0), 0);
const starsBefore = (w) => Object.entries(save.stars).reduce((a, [g, s]) => a + (+g < w * LEVELS_PER_WORLD ? s : 0), 0) + sumSecret(w);
// ¿El siguiente nivel está en un mundo que hay que abrir?
const pendingWorld = () => (worldOf(save.next) > save.open && save.next < TOTAL_LEVELS ? worldOf(save.next) : null);
// Solo cuesta boletos un nivel que aún no has ganado; repetir uno ganado es gratis.
// El nivel secreto tampoco cuesta: es el premio por las 30 estrellas.
const entryCost = (g) => (isSecret(g) || save.stars[g] || dev.infinite ? 0 : ticketCost(g));
const levelName = (g) => `Mundo ${worldOf(g) + 1} · ${isSecret(g) ? 'Nivel secreto' : `Nivel ${(g % LEVELS_PER_WORLD) + 1}`}`;
const worldStars = (w) => {
  let s = 0;
  for (let l = 0; l < LEVELS_PER_WORLD; l++) s += save.stars[w * LEVELS_PER_WORLD + l] || 0;
  return s;
};
const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0) + sumSecret();
const fmt = (n) => n.toLocaleString('es-MX');
// Estrellas del mundo con su secreto (para mostrar): la estrella se vuelve morada cuando el secreto ya se hizo.
const worldStarsHTML = (w) => `${secretStars(w) ? icon('starSecret') : star(true)}${worldStars(w) + secretStars(w)}/30`;

// ---------- Regiones: 10 mundos cada una ----------
const REGION_SIZE = 10;
const REGION_COUNT = Math.ceil(WORLD_COUNT / REGION_SIZE);
const R_A = ['Constelación', 'Nebulosa', 'Cúmulo', 'Galaxia', 'Órbita', 'Cinturón'];
const R_B = ['del Alba', 'de Cristal', 'de las Brisas', 'del Coral', 'de Ámbar', 'del Eco', 'de la Luna', 'de Algodón', 'de la Aurora'];
const regionName = (r) => `${R_A[r % R_A.length]} ${R_B[Math.floor(r / R_A.length) % R_B.length]}`;
const regionOf = (w) => Math.floor(w / REGION_SIZE);

const wallet = () => `
  ${save.gold ? `<div class="pill info" aria-label="${save.gold} boletos dorados">${icon('gold')}<span>${save.gold}</span></div>` : ''}
  <div class="pill info" aria-label="Estrellas">${star(true)}<span>${fmt(totalStars())}</span></div>
  <div class="pill info" aria-label="Boletos">${icon('ticket')}<span data-tickets>${save.tickets}</span></div>
  <div class="pill info" aria-label="Monedas">${coin()}<span data-coins>${money(save.coins)}</span></div>
  <button class="me press" data-a="me" aria-label="Tu perfil" title="Tu perfil">${avatarHTML(save)}</button>`;
// Botón de jugar: es el mismo en todas las vistas (universo, constelación) y lleva directo al tablero;
// al salir del tablero se vuelve al planeta de ese nivel.
const playCTA = () => {
  const run = save.run, gateW = pendingWorld(), done = save.next >= TOTAL_LEVELS;
  return run ? goBtn('Continuar', levelName(run.g), 'continue') : gateW != null ? goBtn('Abrir', `Mundo ${gateW + 1}`, 'gate') : done ? goBtn('¡Completado!', '', 'none') : goBtn('Jugar', `Nivel ${save.next + 1}`, 'continue');
};
const playNow = () => (save.run ? enterLevel(save.run.g) : pendingWorld() != null ? openWorldGate(pendingWorld()) : enterLevel(save.next));
const goBtn = (title, sub, act) => `<button class="go" data-a="${act}">${icon('play')}<span class="t"><b class="outl">${title}</b>${sub ? `<small>${sub}</small>` : ''}</span></button>`;

// Estado de un mundo para dibujarlo. gate: forzar que se vea por abrir (antes de animar su desbloqueo).
function worldData(w, gate = pendingWorld()) {
  const cur = currentWorld(), first = w * LEVELS_PER_WORLD;
  const state = w === gate ? 'gate' : w > cur ? 'locked' : save.next > first + LEVELS_PER_WORLD - 1 ? 'done' : 'current';
  const levels = [];
  for (let l = 0; l < LEVELS_PER_WORLD; l++) {
    const g = first + l;
    levels.push({ kind: g < save.next ? 'done' : g === save.next ? 'cur' : 'lock', stars: save.stars[g] || 0, paused: save.run?.g === g });
  }
  const stars = worldStars(w), full = stars >= LEVELS_PER_WORLD * 3;
  return {
    w, place: worldInfo(w).place, state, stars, levels, need: starsNeeded(w), pin: true,
    done: Math.max(0, Math.min(LEVELS_PER_WORLD, save.next - first)),
    secret: { open: full, stars: save.secret[w] || 0, fresh: full && !save.secretSeen[w] },
  };
}
const worldsOf = (region, gate) => {
  const out = [];
  for (let w = region * REGION_SIZE; w < Math.min(WORLD_COUNT, (region + 1) * REGION_SIZE); w++) out.push(worldData(w, gate));
  return out;
};

// ---------- Galaxia (mapa) y planeta (zoom) ----------
// start: mundo al que entrar directo (al volver de un nivel) · anim: transición de entrada
// after: lo que hay que animar al volver de ganar ({ g, w, res }) · unlock: mundo cuyo desbloqueo hay que animar al llegar.
let map = null; // el mapa en pantalla: { galaxy, region }
function showMap({ region, start = null, anim, after = null, unlock = null } = {}) {
  gallery.active = false;
  if (region == null) region = regionOf(start ?? unlock ?? currentWorld());
  current = () => showMap({ region });
  // Se pueden ver todas las constelaciones, aunque estén bloqueadas: así se nota que hay muchas.
  const locked = region * REGION_SIZE > currentWorld();
  const el = h(`<div class="screen galaxy">
    <div class="space"></div><div class="g3d"></div><div class="glabels g-only"></div>
    <div class="g-only">
      <button class="hbtn tb press out-btn" data-a="up" aria-label="Ver todas las constelaciones" title="Constelaciones">${icon('prev')}</button>
      <div class="wtitle info">${constIcon()}<div><b>${locked ? icon('lock') : ''}${regionName(region)}</b><small>Constelación ${region + 1} de ${REGION_COUNT} · ${star(true)}${regionStars(region)}/${REGION_SIZE * 30}</small></div></div>
    </div>
    <button class="dev-pill" data-a="dev">DEV</button>
    <div class="side l">${sideButtons()}</div>
    <div class="side r" ${after ? 'style="opacity:0"' : ''}>${eventButtons(after?.res)}</div>
    <div class="p-only phud"></div>
    <div class="res">${wallet()}</div>
    <div class="cta"></div>
  </div>`);
  let galaxy = null;
  const cta = el.querySelector('.cta'), phud = el.querySelector('.phud');
  const paintGalaxyCTA = () => (cta.innerHTML = playCTA());
  const paintPlanet = (w) => {
    const info = worldInfo(w), b = BIOMES[biomeKey(info.place)];
    const mech = Object.entries(MECH_INTRO).find(([, iw]) => iw === w)?.[0];
    phud.innerHTML = `<button class="hbtn tb press out-btn" data-a="out" aria-label="Volver a la galaxia" title="Galaxia">${icon('prev')}</button>
      <div class="wtitle info">${miniPlanet(b.emblem, 'em')}<div><b>${esc(info.name)}</b><small>Mundo ${w + 1} · ${worldStarsHTML(w)}</small></div></div>`;
    const first = w * LEVELS_PER_WORLD, run = save.run;
    let go;
    if (run && worldOf(run.g) === w) go = goBtn('Continuar', isSecret(run.g) ? 'Nivel secreto' : `Nivel ${run.g + 1}`, 'continue');
    else if (save.next >= first && save.next < first + LEVELS_PER_WORLD) go = goBtn('Jugar', `Nivel ${save.next + 1}`, 'play-next');
    else go = '<div class="hint-chip">Toca un nivel para repetirlo</div>';
    // Mecánica nueva: botón con su carta junto a Jugar; al tocarlo se despliega el aviso y al tocarlo otra vez se recoge.
    // Brinca hasta que lo lee (o hasta que vio el "Nuevo: …" del tablero).
    cta.classList.remove('mech-open');
    cta.innerHTML = mech ? `<div class="newmech info"><div><b>Aquí aparece: ${MECH_NAMES[mech].toLowerCase()}</b><span>${MECH_TEXT[mech]}</span></div></div>
      <button class="mech-tog tb press${save.seen[mech] ? ' seen' : ''}" data-a="mech" aria-expanded="false" aria-label="Qué hay de nuevo en este mundo" title="Nuevo en este mundo">${mechCard(mech)}<i>?</i></button>${go}` : go;
  };
  const paint = () => (galaxy?.mode === 'planet' && galaxy.sel ? paintPlanet(galaxy.sel.wd.w) : paintGalaxyCTA());
  paintGalaxyCTA();
  el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (galaxy?.busy) return; // mientras se anima un avance, no se toca nada
    if (a === 'up') return galaxy && !galaxy.anim && warp(() => showUniverse({ from: region }), { out: true });
    if (sideAction(a)) return;
    if (a === 'out') return galaxy?.zoomOut();
    if (a === 'mech') {
      const open = cta.classList.toggle('mech-open'), tog = cta.querySelector('.mech-tog');
      tog.setAttribute('aria-expanded', open);
      // Ya lo leyó: deja de brincar y en el tablero ya no sale el "Nuevo: …" (misma bandera, save.seen).
      const mech = galaxy?.sel && Object.entries(MECH_INTRO).find(([, iw]) => iw === galaxy.sel.wd.w)?.[0];
      if (open && mech && !save.seen[mech]) {
        save.seen[mech] = true;
        persist();
        tog.classList.add('seen');
      }
      return;
    }
    if (a === 'gate') return openWorldGate(pendingWorld());
    if (a === 'continue') return playNow();
    if (a === 'play-next') return enterLevel(save.next);
  });
  // El aviso de mecánica se recoge al tocar en cualquier otro lado (planeta, el mismo aviso, etc.).
  el.addEventListener('pointerdown', (e) => {
    if (!cta.classList.contains('mech-open') || e.target.closest('.mech-tog')) return;
    cta.classList.remove('mech-open');
    cta.querySelector('.mech-tog')?.setAttribute('aria-expanded', false);
  });
  mount(el, anim);
  // Al volver de ganar, los avisos esperan a que termine el festejo (ver celebrateWin).
  if (!after) notices();
  // Al volver de ganar, el monedero muestra lo de antes y luego se suma con las piezas que vuelan.
  if (after) {
    const c = el.querySelector('[data-coins]'), t = el.querySelector('[data-tickets]');
    if (c) c.textContent = money(save.coins - after.res.coins - (after.res.chest?.coins || 0));
    if (t) t.textContent = save.tickets - after.res.tickets;
  }
  const host = el.querySelector('.g3d');
  const make = () => {
    if (!el.isConnected) return;
    const w0 = after?.w;
    galaxy = new Galaxy(host, el.querySelector('.glabels'), {
      worlds: worldsOf(region, unlock ?? pendingWorld()),
      player: { traveler: equipped('traveler') },
      start,
      // El nivel secreto se anima en su insignia (índice 10): al volver ya se ve hecho.
      celebrate: after ? { w: w0, i: isSecret(after.g) ? 10 : after.g % LEVELS_PER_WORLD, kind: after.res.first ? 'cur' : 'done', stars: after.res.prev } : null,
      on: {
        mode: (m, w) => {
          el.classList.toggle('zoomed', m === 'planet');
          current = () => showMap({ region, start: m === 'planet' ? w : null });
          if (m === 'planet') paintPlanet(w);
          else paintGalaxyCTA();
          // Recorrido: al entrar al mundo 1 se explican los niveles.
          if (m === 'planet' && tourStep() === 'galaxy') {
            setTour('planet');
            wait(1400).then(() => guide(galaxy, 'planet', el));
          }
          // Mundo con 30/30 cuyo nivel secreto aún no se ha mostrado: se revela al entrar.
          if (m === 'planet' && !galaxy?.busy && worldData(w).secret.fresh) wait(1350).then(() => galaxy.mode === 'planet' && galaxy.sel?.wd.w === w && !galaxy.busy && revealSecret(galaxy, w));
        },
        planet: (w) => openWorldGate(w),
        locked: () => toast(`${icon('lock')} Primero abre los mundos anteriores`),
        relayout: () => current?.(),
        level: (w, i) => {
          if (tourStep() === 'planet') setTour('done'), endTouring(el);
          if (i === 10) return enterLevel(secretId(w));
          const g = w * LEVELS_PER_WORLD + i;
          if (g > save.next) return toast('Completa el nivel anterior');
          enterLevel(g);
        },
      },
    });
    map = { galaxy, region, paint };
    if (tourStep() === 'galaxy' && !start) wait(700).then(() => guide(galaxy, 'galaxy', el));
    el._dispose = () => {
      galaxy.dispose();
      if (map?.galaxy === galaxy) map = null;
    };
    if (after) celebrateWin(galaxy, after, cta, paint, !!anim);
    else if (unlock != null) wait(500).then(() => playUnlock(unlock));
  };
  if (Galaxy) requestAnimationFrame(make);
  else loadGalaxy().then(make);
}

// Al volver de ganar: premios al monedero, estrellas en la insignia, el avatar camina al siguiente nivel
// y el botón de jugar se actualiza. Si fue el jefe, después se va a la galaxia a abrir el mundo siguiente.
async function celebrateWin(galaxy, a, cta, paint, slide) {
  galaxy.busy = true;
  cta.style.opacity = 0;
  await wait(slide && !reduced() ? 650 : 150);
  const mid = { x: innerWidth / 2, y: innerHeight * 0.45 };
  const coins = a.res.coins + (a.res.chest?.coins || 0);
  const runs = [galaxy.playCelebrate()];
  if (coins) runs.push(flyToWallet('coins', mid, coins));
  if (a.res.tickets) runs.push(wait(300).then(() => flyToWallet('tickets', mid, a.res.tickets)));
  await Promise.all(runs);
  // Los eventos aparecen después del monedero (como Jugar) y ahí la racha suma su +1.
  const side = document.querySelector('.galaxy .side.r');
  if (side) {
    side.style.opacity = '';
    if (!reduced()) await side.animate([{ scale: 0.4, opacity: 0 }, { scale: 1.08, opacity: 1, offset: 0.6 }, { scale: 1 }], { duration: 420, easing: 'ease-out' }).finished;
  }
  if (a.res.racha) bumpRacha();
  if (a.res.col && col()) bumpCol(a.res.col.n);
  if (worldData(a.w).secret.fresh) await revealSecret(galaxy, a.w);
  galaxy.busy = false;
  paint();
  cta.style.opacity = '';
  if (!reduced()) cta.animate([{ scale: 0.4, opacity: 0 }, { scale: 1.08, opacity: 1, offset: 0.6 }, { scale: 1 }], { duration: 420, easing: 'ease-out' });
  // Jefe ganado por primera vez: a la galaxia, a abrir el mundo siguiente (o a decir qué falta).
  if (a.res.chest && a.w + 1 < WORLD_COUNT) {
    await wait(600);
    await playUnlock(a.w + 1);
  }
  notices();
}

// Revela el nivel secreto del planeta en pantalla (una sola vez por mundo).
async function revealSecret(galaxy, w) {
  save.secretSeen[w] = true;
  persist();
  galaxy.busy = true;
  const pt = await galaxy.revealSecret();
  galaxy.busy = false;
  if (!pt) return;
  const r = galaxy.host.getBoundingClientRect();
  sparkle({ x: r.left + pt[0], y: r.top + pt[1] }, 18);
  toast(`${star(true)} ¡Nivel secreto desbloqueado!`);
  await wait(900);
}

// Abrir el mundo w: si tienes el boleto dorado y las estrellas, se gasta el boleto y se anima el desbloqueo
// en la galaxia; si no, sale la ventana que dice qué falta.
async function playUnlock(w) {
  const okStars = starsBefore(w) >= starsNeeded(w), okGold = save.gold > 0;
  const galaxy = map?.galaxy;
  if (!galaxy || map.region !== regionOf(w)) {
    if (okStars && okGold) return showMap({ unlock: w });
    if (galaxy?.sel) await galaxy.zoomOut();
    return openWorldGate(w);
  }
  if (galaxy.sel) await galaxy.zoomOut();
  if (!(okStars && okGold)) return openWorldGate(w);
  save.gold--;
  save.open = w;
  persist();
  galaxy.busy = true;
  document.querySelector('.galaxy .res').innerHTML = wallet();
  await galaxy.unlock(w, worldData(w));
  galaxy.busy = false;
  map.paint();
  toast(`¡Mundo ${w + 1} abierto!`);
  await wait(400);
  const o = galaxy.objs.find((q) => q.wd.w === w);
  if (o && galaxy.mode === 'galaxy') galaxy.zoomTo(o);
}
// ---------- Recorrido de primera vez ----------
// Jugador nuevo: cada capa del mapa se explica y solo deja tocar lo que sigue
// (constelación 1 → mundo 1 → nivel 1). Al entrar al nivel 1 termina y ya se mueve libre.
// save.mapTour: 'uni' → 'galaxy' → 'planet' → 'done'.
const TOUR = {
  uni: { kind: 'region', i: 0, size: 170, title: 'Las constelaciones', text: 'Cada grupo de estrellas es una <b>constelación</b> con 10 mundos. Toca la primera para entrar.' },
  galaxy: { kind: 'planet', i: 0, size: 140, title: 'Tus mundos', text: 'Cada planeta es un <b>mundo</b> con 10 niveles. Toca el primero.' },
  planet: { kind: 'level', i: 0, size: 76, title: 'Los niveles', text: 'Gana un nivel para abrir el siguiente. Toca el <b>nivel 1</b> para jugar.' },
};
const tourStep = () => (save.next === 0 && save.mapTour !== 'done' ? save.mapTour || 'uni' : null);
function setTour(step) {
  save.mapTour = step;
  persist();
  document.querySelector('.guide')?.remove();
}
// Pone el aviso sobre la vista 3D (view) y lo sigue mientras se mueve. screen = pantalla donde va.
function guide(view, step, screen) {
  const t = TOUR[step];
  if (!t || tourStep() !== step || !view || view.dead) return;
  screen.querySelector('.guide')?.remove();
  view.guide = (kind, i) => kind === t.kind && i === t.i;
  screen.classList.add('touring');
  const el = h(`<div class="guide"><div class="g-ring" style="--s:${t.size}px"></div>
    <div class="g-bubble info"><b>${t.title}</b><span>${t.text}</span></div></div>`);
  screen.append(el);
  const ring = el.querySelector('.g-ring'), bub = el.querySelector('.g-bubble');
  if (!reduced()) bub.animate([{ opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1.05, offset: 0.7 }, { opacity: 1, scale: 1 }], { duration: 420, easing: 'ease-out' });
  const loop = () => {
    if (!el.isConnected || view.dead) return;
    const p = view.screenOf(t.kind, t.i);
    if (p) {
      const r = view.host.getBoundingClientRect(), x = r.left + p[0], y = r.top + p[1], below = y < innerHeight * 0.5;
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      bub.style.top = below ? `${Math.min(innerHeight - bub.offsetHeight - 12, y + t.size / 2 + 24)}px` : `${Math.max(12, y - t.size / 2 - 28 - bub.offsetHeight)}px`;
    }
    requestAnimationFrame(loop);
  };
  loop();
}
const endTouring = (screen) => screen.classList.toggle('touring', !!tourStep());

// ---------- Universo: todas las constelaciones en 3D ----------
// Se recorren de lado; al tocar una, la cámara se acerca y se entra a sus planetas.
// from: constelación de la que vienes (la vista empieza pegada a ella y se aleja).
function regionData(r) {
  const cw = currentWorld(), w0 = r * REGION_SIZE;
  let stars = 0;
  const worlds = [], hues = [];
  for (let w = w0; w < w0 + REGION_SIZE; w++) {
    stars += worldStars(w) + secretStars(w);
    worlds.push(w < cw ? 'done' : w === cw ? 'cur' : 'lock');
    hues.push(worldInfo(w).hue);
  }
  const state = w0 > cw ? 'locked' : w0 + REGION_SIZE - 1 < cw ? 'done' : 'current';
  return { r, name: regionName(r), hue: hues[0], hues, worlds, stars, state };
}
function showUniverse({ from = regionOf(currentWorld()) } = {}) {
  gallery.active = false;
  current = () => showUniverse({ from });
  const el = h(`<div class="screen galaxy universe">
    <div class="space"></div><div class="g3d"></div><div class="glabels"></div>
    <div class="wtitle solo info">${constIcon()}<div><b>Constelaciones</b><small>${REGION_COUNT} en el universo · ${star(true)}${fmt(totalStars())}</small></div></div>
    <div class="side l">${sideButtons()}</div>
    <div class="side r">${eventButtons()}</div>
    <button class="dev-pill" data-a="dev">DEV</button>
    <div class="res">${wallet()}</div>
    <div class="cta">${playCTA()}</div>
  </div>`);
  let uni = null;
  // Entrar a una constelación: la cámara se lanza hacia ella y el túnel de estrellas lleva a sus planetas.
  const open = (r) => {
    if (!uni || uni.busy) return;
    if (tourStep() === 'uni') setTour('galaxy');
    uni.zoomInto(r);
    warp(() => showMap({ region: r }));
  };
  el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (uni?.busy) return;
    if (a === 'continue') return playNow();
    if (a === 'gate') return openWorldGate(pendingWorld());
    sideAction(a);
  });
  mount(el);
  notices();
  const make = () => {
    if (!el.isConnected) return;
    const regions = Array.from({ length: REGION_COUNT }, (_, r) => regionData(r));
    uni = new Universe(el.querySelector('.g3d'), el.querySelector('.glabels'), {
      regions,
      start: from,
      fromZoom: true,
      traveler: equipped('traveler'),
      on: { open, relayout: () => current?.() },
    });
    el._dispose = () => uni.dispose();
    if (tourStep() === 'uni') wait(1000).then(() => guide(uni, 'uni', el));
  };
  if (Universe) requestAnimationFrame(make);
  else loadGalaxy().then(make);
}
// Botones de la derecha (los mismos en constelaciones y en mundos).
// Boleto diario: cada 24 h desde que se cobra, los boletos que cuesta el siguiente nivel (para no quedarse atorado nunca).
const TICKET_WAIT = 24 * 3600e3;
const ticketLeft = () => Math.max(0, (save.ticketAt || 0) + TICKET_WAIT - Date.now());
const ticketGift = () => ticketCost(Math.min(save.next, TOTAL_LEVELS - 1));
// Tiempo que le queda a un evento, en chiquito para su botón: días (3 d), horas (5 h) o minutos (40 m).
const shortLeft = (ms) => (ms >= 864e5 ? `${Math.floor(ms / 864e5)} d` : ms >= 3600e3 ? `${Math.floor(ms / 3600e3)} h` : `${Math.max(1, Math.ceil(ms / 6e4))} m`);
const leftText = (ms) => (ms >= 3600e3 ? `${Math.ceil(ms / 3600e3)} h` : `${Math.max(1, Math.ceil(ms / 60e3))} min`);
const clock = (ms) => { const t = Math.ceil(ms / 1000); return `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
const ticketBtn = () => {
  const left = ticketLeft();
  return `<button class="iconbtn tb press tk-btn ${left ? 'waiting' : 'ready'}" data-a="dticket" aria-label="Boletos de regalo" title="Boletos de regalo">${icon('ticket')}${left ? `<small class="wait">${leftText(left)}</small>` : '<span class="dot"></span>'}</button>`;
};
// El contador del botón avanza solo; al llegar a cero, el botón vuelve a moverse con su punto.
setInterval(() => {
  const b = document.querySelector('[data-a="dticket"]');
  if (b && b.classList.contains('waiting') !== !!ticketLeft()) b.outerHTML = ticketBtn();
  else if (b?.querySelector('.wait')) b.querySelector('.wait').textContent = leftText(ticketLeft());
}, 20e3);
// Eventos: columna de la derecha, solo los activos.
// prev: el número de antes de ganar (se pinta así y luego sube con el +1, sin avisos todavía).
// fresh: recién desbloqueado y aún sin presentar (no se ve hasta que entra volando con su ventana).
// revealed: ya entró volando aunque su ventana siga abierta (si el botón se vuelve a pintar, no se esconde).
const revealed = new Set();
const fresh = (k) => (save.intro?.[k] || revealed.has(k) ? '' : 'fresh');
const rachaBtn = (prev = null) => {
  if (!isOn('racha')) return '';
  const r = racha(), t = rachaTheme(), old = prev != null;
  const ready = !old && rachaReady(), hot = !old && !ready && rachaHot();
  return `<button class="iconbtn tb press racha-btn ${fresh('racha')} ${ready ? 'ready' : ''} ${hot ? 'hot' : ''}" data-a="racha" aria-label="${t.name}" title="${t.name}">${hot ? `<span class="fire">${icon('flame')}</span>` : ''}${icon(t.ico)}<small class="rn">${old ? prev : r.n}</small>${ready ? '<span class="dot"></span>' : ''}</button>`;
};
// Colección: la ficha de su temática, arriba cuánto le queda y abajo cuántas lleva (como la racha; con 0 no sale);
// se mueve con punto rojo si ya alcanza para algo.
const colBtn = () => {
  const c = col();
  if (!c) return '';
  const ready = colOffers(ticketGift()).some((o) => colAvail(o) && c.state.n >= o.price);
  return `<button class="iconbtn tb press col-btn ${fresh('col')} ${ready ? 'ready' : ''}" data-a="col" aria-label="${c.name}" title="${c.name}">${icon(c.token)}<small class="tl">${shortLeft(colLeft())}</small>${c.state.n ? `<small class="rn">${c.state.n}</small>` : ''}${ready ? '<span class="dot"></span>' : ''}</button>`;
};
// res: lo que dejó la victoria (se pinta el número de antes y luego sube).
const eventButtons = (res) => rachaBtn(res?.racha ? res.racha - 1 : null) + colBtn() + evBtn();
const sideButtons = () => `${ibtn('gift', 'Regalo diario', 'daily', !dailyState(save.daily).claimed)}${ticketBtn()}${ibtn('bag', 'Tienda', 'shop')}${ibtn('album', 'Álbum de postales', 'album')}${ibtn('gear', 'Ajustes', 'settings')}`;
function sideAction(a) {
  const act = { me: () => !tourStep() && openProfile(), shop: () => openShop(), daily: openDaily, dticket: openDailyTicket, racha: openRacha, col: openCol, evento: () => warp(() => showEvent()), album: openAlbum, settings: openSettings, dev: () => openDevMenu({ onGallery: () => showGallery(save.next), onRefresh: boot }) }[a];
  act?.();
  return !!act;
}
const regionStars = (r) => {
  let n = 0;
  for (let w = r * REGION_SIZE; w < (r + 1) * REGION_SIZE; w++) n += worldStars(w) + secretStars(w);
  return n;
};
// Icono de constelación: tres estrellas unidas.
const constIcon = () => `<svg class="ico em" viewBox="0 0 32 32"><path d="M6 22 14 9l12 6" fill="none" stroke="#c9bff0" stroke-width="2.4" stroke-linecap="round"/>${[[6, 22, 4.6], [14, 9, 3.8], [26, 15, 4.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffc83d" stroke="#2a1f5c" stroke-width="2.2"/>`).join('')}</svg>`;
const ibtn = (k, label, act, dot) => `<button class="iconbtn tb press${dot ? ' ready' : ''}" data-a="${act}" aria-label="${label}" title="${label}">${icon(k)}${dot ? '<span class="dot"></span>' : ''}</button>`;
const loadGalaxy = () => import('./galaxy.js').then((m) => ((PlanetView = m.PlanetView), (Universe = m.Universe), (Galaxy = m.Galaxy)));

// Se conserva el nombre: en dev y otros lugares se pide "el mundo w".
const showWorld = (w, anim) => showMap({ start: w, anim });

// ---------- Cartas de ejemplo (ayuda y avisos) ----------
const SUITS = ['s', 'h', 'd', 'c'];
const R = { A: 0, J: 10, Q: 11, K: 12 };
const rk = (r) => R[r] ?? +r - 1;
const mini = (x, r, s, extra = {}, cls = '') => `<div class="card up ${cls}" style="left:${x}px">${faceHTML({ rank: rk(r), suit: SUITS.indexOf(s), ...extra })}${extra.marks || ''}</div>`;
const MECH_TEXT = {
  lock: 'Retira la llave del mismo color para abrirlo.',
  pack: 'Al destaparla, sus cartas se van a tu mazo.',
  ice: 'Se derrite al jugar las cartas que marca.',
  double: 'Vale los dos números.',
  arrow: 'La siguiente carta tiene que ir hacia donde apunta.',
  curtain: 'Se abre al retirar su carta con telón.',
  bomb: 'Destápala antes de que llegue a cero.',
  live: 'Su número cambia con cada acción.',
};
function mechCard(m, x = 0) {
  const back = `--back:${cardBackURL()}`;
  if (m === 'lock') return mini(x, '9', 'd', { marks: `<span class="lock-ov">${lockIcon(350)}</span>` });
  if (m === 'pack') return `<div class="card pack-card up" style="left:${x}px"><div class="inner"><div class="face front"></div></div><span class="pack-num">+3</span></div>`;
  if (m === 'ice') return mini(x, 'Q', 'c', { marks: '<span class="ice-ov"><b>2</b></span>' });
  if (m === 'double') return `<div class="card up" style="left:${x}px">${faceHTML({ rank: 4, alt: 7, suit: 1 })}</div>`;
  if (m === 'arrow') return mini(x, '6', 'd', { arrow: 1 });
  if (m === 'curtain') return `<div class="card curtain" style="left:${x}px;${back}"><div class="inner">${backHTML({ curtain: 0 })}</div></div>`;
  if (m === 'bomb') return `<div class="card bomb-card up" style="left:${x}px"><div class="inner"><div class="face front"></div></div><span class="bomb-face">${icon('bomb')}<b>3</b></span></div>`;
  if (m === 'live') return mini(x, 'K', 's', { live: 1 });
  return '';
}

// ---------- Entrar a un nivel: boletos y partida a medias ----------
// Gastar boletos se ve: cada boleto sale del monedero, crece al centro y se rompe en dos. Luego se entra al nivel.
let entering = false;
// sel / ico: el contador y el boleto que se gastan (el evento del mes tiene el suyo) · before: cuántos había.
function spendTickets(cost, sel = '[data-tickets]', ico = 'ticket', before = save.tickets + cost) {
  const label = document.querySelector(`#app ${sel}`);
  const from = label?.closest('.pill')?.querySelector('.ico')?.getBoundingClientRect();
  if (!from || reduced()) return Promise.resolve(updateCoins());
  let shown = before;
  label.textContent = shown;
  const fx = from.left + from.width / 2, fy = from.top + from.height / 2;
  const runs = [];
  for (let k = 0; k < cost; k++) {
    const tx = innerWidth / 2 + (k - (cost - 1) / 2) * 96, ty = innerHeight / 2;
    const f = document.createElement('div');
    f.className = 'fly-ticket';
    f.innerHTML = icon(ico);
    f.style.cssText = `left:${fx}px;top:${fy}px`;
    document.body.append(f);
    const go = f.animate(
      [
        { translate: '0 0', scale: 0.8, rotate: '0deg', opacity: 0 },
        { translate: '0 0', scale: 1, rotate: '0deg', opacity: 1, offset: 0.1 },
        { translate: `${tx - fx}px ${ty - fy}px`, scale: 3.2, rotate: '12deg', opacity: 1, offset: 0.75 },
        { translate: `${tx - fx}px ${ty - fy}px`, scale: 3, rotate: '0deg', opacity: 1 },
      ],
      { duration: 760, delay: k * 280, easing: 'cubic-bezier(0.3, 0.9, 0.3, 1.1)', fill: 'both' },
    );
    setTimeout(() => {
      label.textContent = --shown;
      label.closest('.pill').animate([{ scale: 1 }, { scale: 0.85 }, { scale: 1 }], { duration: 240, easing: 'ease-out' });
    }, k * 280 + 80);
    runs.push(
      go.finished.then(() => {
        // Se rompe por la mitad: cada mitad gira y cae.
        const r = f.getBoundingClientRect();
        f.remove();
        return Promise.all(
          [-1, 1].map((side) => {
            const half = document.createElement('div');
            half.className = 'fly-ticket half';
            half.innerHTML = icon(ico);
            half.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;clip-path:inset(0 ${side < 0 ? 50 : 0}% 0 ${side < 0 ? 0 : 50}%)`;
            document.body.append(half);
            return half
              .animate([{ translate: '0 0', rotate: '0deg', opacity: 1 }, { translate: `${side * 40}px -16px`, rotate: `${side * 18}deg`, opacity: 1, offset: 0.3 }, { translate: `${side * 90}px 160px`, rotate: `${side * 70}deg`, opacity: 0 }], { duration: 560, easing: 'cubic-bezier(0.4, 0, 0.8, 0.6)' })
              .finished.then(() => half.remove());
          }),
        );
      }),
    );
  }
  return Promise.all(runs).then(() => wait(80));
}

// La partida a medias es de un nivel nuevo del camino (cuenta para la racha) y lo que se pierde si se abandona.
const runCounts = (g) => !save.stars[g] && !isSecret(g) && g <= save.next;
const runRacha = (g) => {
  const r = racha();
  if (!runCounts(g) || !isOn('racha') || !r.n) return '';
  return `<p class="note racha-warn">${icon('flame')} Si lo abandonas, tu racha de <b>${r.n}</b> vuelve a 0${r.pend.length ? ' y pierdes los premios sin reclamar' : ''}.</p>`;
};
function enterLevel(g) {
  if (worldOf(g) > save.open && !dev.infinite) return openWorldGate(worldOf(g));
  const run = save.run;
  if (run && run.g === g) return startLevel(g, { resume: true });
  if (run) {
    return openModal({
      title: 'Nivel a medias',
      color: 'orange',
      body: `<p class="lead"><b>${levelName(run.g)}</b> sigue en juego. Termínalo, o abandónalo y pierdes su boleto.</p>${runRacha(run.g)}`,
      buttons: [
        {
          label: 'Abandonar y jugar este',
          cls: 'ghost',
          onClick: () => {
            if (runCounts(run.g)) rachaLose(); // abandonar un nivel nuevo reinicia la racha
            save.run = null;
            persist();
            enterLevel(g);
          },
        },
        { label: `${icon('play')} Continuar ese`, cls: 'green', onClick: () => startLevel(run.g, { resume: true }) },
      ],
    });
  }
  const cost = entryCost(g);
  if (!cost) return startLevel(g);
  if (save.tickets >= cost) {
    if (entering) return;
    entering = true;
    save.tickets -= cost;
    persist();
    return spendTickets(cost).then(() => {
      entering = false;
      startLevel(g);
    });
  }
  const need = cost - save.tickets;
  const price = need * TICKET_PRICE;
  openModal({
    title: 'Faltan boletos',
    ico: 'ticket',
    color: 'pink',
    body: `<p class="lead">Este nivel cuesta <b>${cost}</b> ${icon('ticket')} y tienes ${save.tickets}.</p>
      <p class="note">Si ganas el nivel, te devuelve los boletos. Repetir niveles ganados es gratis.</p>`,
    buttons: [
      {
        label: `${need} ${icon('ticket')} · ${coin()} ${price}`,
        disabled: save.coins < price,
        onClick: () => {
          save.coins -= price;
          save.tickets += need;
          persist();
          updateCoins();
          enterLevel(g);
        },
      },
    ],
  });
}

// ---------- Partida ----------
// resume: retoma save.run · free: modo dev (sin boletos y sin guardar la partida) · anim: transición
function startLevel(g, { resume = false, free = false, anim = 'up' } = {}) {
  const old = [...app.children];
  game?.destroy();
  game = null;
  document.getElementById('modal-root').replaceChildren();
  const run = resume ? save.run : null;
  const v = run ? run.v : save.tries[g] || 0;
  // Se guarda la partida de un nivel aún no ganado (el que cuesta boleto); repetir uno ganado se pierde al salir.
  const saved = !!run || (!free && !save.stars[g] && !isSecret(g));
  if (!run) {
    save.tries[g] = v + 1;
    if (saved) save.run = { g, v, state: null };
    persist();
  }
  const level = variantLevel(generateLevel(g), v);
  // Cuenta para la racha: nivel nuevo del camino normal (no repetir, no secreto, no la galería dev).
  const counts = !free && !save.stars[g] && !isSecret(g) && g <= save.next;
  // Repetir un nivel ganado del camino: no suma a la racha, pero rendirse o abandonar la reinicia.
  const replay = !free && !!save.stars[g] && !isSecret(g);
  const back = () => (dev.on && gallery.active ? showGallery() : showWorld(worldOf(g), 'down'));
  const clearRun = () => {
    if (save.run?.g === g) save.run = null;
    persist();
  };
  game = new Game(app, level, {
    dev,
    resume: run?.state,
    saved,
    free: !!save.stars[g] || isSecret(g) || free || dev.infinite, // intento que no costó boleto
    tutorial: g === 0 && !save.tutorial,
    racha: counts && isOn('racha') ? { n: racha().n, ico: rachaTheme().ico, hot: rachaHot() } : null,
    onSave: saved
      ? (state) => {
          save.run = { g, v, state };
          persist();
        }
      : null,
    onExit: back,
    // Si la racha está abierta y va en algo, las ventanas de rendirse/abandonar lo dicen.
    rachaRisk: () => ((counts || replay) && isOn('racha') && racha().n ? { n: racha().n, pend: racha().pend.length, isNew: counts } : null),
    // gaveUp: se rindió o abandonó (no solo salió de un nivel repetido sin jugar).
    onAbandon: (gaveUp) => {
      if (counts || (replay && gaveUp)) rachaLose();
      clearRun();
      back();
    },
    onRetry: () => {
      if (counts) rachaLose();
      clearRun();
      enterLevel(g);
    },
    // Sin las 3 estrellas: lo vuelve a jugar ya (gratis, porque ya lo ganó).
    onReplay: () => startLevel(g),
    // Tras la ventana de victoria: de vuelta al planeta, con el avance animado (o a la galería en dev).
    onDone: (res) => {
      if (dev.on && gallery.active) return showGallery();
      const w = worldOf(g);
      const go = () => showMap({ start: w, anim: 'down', after: res.counted ? { g, w, res } : null });
      if (res.chest) return openBossReward(w, res).then(go);
      if (res.seal) return openSecretSeal(w).then(go);
      go();
    },
    onWin: (stars) => {
      clearRun();
      const w = worldOf(g);
      // Nivel secreto: el doble que el jefe de su mundo, según las estrellas. Comodín y deshacer
      // solo la primera vez que se saca con 3 estrellas; con menos, solo monedas.
      if (isSecret(g)) {
        const prev = save.secret[w] || 0;
        const coins = coinsFor(w * LEVELS_PER_WORLD + LEVELS_PER_WORLD - 1, stars, prev) * SECRET_MULT;
        const bonus = stars >= 3 && prev < 3 ? SECRET_PRIZE : {};
        const wild = bonus.wild || 0, undo = bonus.undo || 0;
        const fichas = colWin(stars, prev);
        save.secret[w] = Math.max(prev, stars);
        save.coins += coins;
        save.wild += wild;
        save.undo += undo;
        persist();
        updateCoins();
        // Primera vez con 3 estrellas: la postal del mundo gana el sello secreto (se celebra al continuar).
        return { coins, tickets: 0, prev, wild, undo, counted: true, first: !prev, replay: !free, seal: stars >= 3 && prev < 3, col: fichas ? { n: fichas, ico: col().token } : null };
      }
      // En modo dev se puede saltar a cualquier nivel: solo cuenta si ya estaba desbloqueado.
      if (g > save.next) return { coins: 0, tickets: 0, prev: 0, replay: !free };
      const prev = save.stars[g] || 0;
      const coins = coinsFor(g, stars, prev);
      // La primera victoria devuelve los boletos que cuesta el nivel.
      const tickets = prev ? 0 : ticketRefund(g);
      // El jefe da el boleto dorado para abrir el mundo siguiente (solo la primera vez).
      const gold = !prev && level.boss && w + 1 < WORLD_COUNT ? 1 : 0;
      const fichas = colWin(stars, prev);
      save.stars[g] = Math.max(prev, stars);
      save.coins += coins;
      save.tickets += tickets;
      save.gold += gold;
      const rachaOn = isOn('racha'); // la racha cuenta desde el nivel siguiente al que la abre
      if (g >= save.next) save.next = g + 1;
      if (g === 0) save.tutorial = true;
      // Cofre del jefe (primera vez): según el % de estrellas del mundo. Se guarda ya, aunque salgas antes de verlo.
      let chest = null;
      if (level.boss && !prev) {
        chest = bossChest(worldStars(w));
        save.coins += chest.coins || 0;
        save.undo += chest.undo || 0;
        save.wild += chest.wild || 0;
      }
      const racha = counts && !prev && rachaOn ? rachaWin() : null;
      persist();
      updateCoins();
      // Repetir desde la victoria salta el festejo del mapa: no se ofrece si toca abrir el mundo siguiente.
      return { coins, tickets, prev, gold, chest, worldStars: worldStars(w), counted: true, first: !prev, racha, replay: !free && !chest, col: fichas ? { n: fichas, ico: col().token } : null };
    },
  });
  // El tablero sube y la pantalla anterior se queda atrás.
  const el = game.el;
  const drop = () => old.forEach((o) => (o._dispose?.(), o.remove()));
  if (old.length && anim && !reduced()) {
    old.forEach((o) => o.animate([{ opacity: 1, scale: 1 }, { opacity: 0.4, scale: 0.94 }], { duration: 520, easing: 'ease-out', fill: 'forwards' }));
    el.animate([{ translate: '0 100%' }, { translate: '0 0' }], { duration: 560, easing: 'cubic-bezier(0.2, 0.9, 0.25, 1)' }).finished.then(drop, drop);
  } else drop();
  game.attachDev = () => attachDevBar(game, { go: (n) => startLevel(n, { free: true, anim: null }), toGallery: () => showGallery(gallery.active ? undefined : g) });
  current = null;
  if (dev.on) game.attachDev();
}

// ---------- Galería (modo dev) ----------
function showGallery(start) {
  current = () => showGallery();
  if (start != null) {
    gallery.start = Math.max(0, start - (start % 24));
    if (gallery.help[0] === 's') gallery.help = ''; // ir a un nivel del camino: deja la lista de especiales
  }
  mount(galleryScreen({ onPlay: (g) => startLevel(g, save.run?.g === g ? { resume: true, anim: null } : { free: true, anim: null }), onBack: () => showMap() }));
}

// ---------- Tienda ----------
// Solo cosas para verse bonito (nada ayuda a ganar). Catálogo y compras en shop.js.
// Comprar: las monedas salen del monedero hacia la pieza, que salta con chispas y queda puesta.
const SHOP_HINT = {
  avatar: 'Tu cara en la esquina de arriba. Nico, Lila y tu inicial son gratis.',
  ring: 'El adorno alrededor de tu avatar. También viste la ventana de tu perfil.',
  title: 'Va debajo de tu nombre, cada uno con su estilo.',
  back: 'El dibujo de atrás de todas tus cartas.',
  face: 'El frente de tus cartas.',
  traveler: 'Te acompaña por el universo y por el camino de cada planeta.',
  space: 'El cielo de tus constelaciones y planetas.',
  frame: 'El marco de las postales de tu álbum.',
};
const inUse = (sec, k) => (sec === 'avatar' ? save.look === 'char' && save.char === k : equipped(sec) === k);
function shopPreview(sec, k) {
  if (sec === 'avatar') return avatarHTML({ ...save, look: 'char', char: k }, 'huge');
  if (sec === 'ring') return avatarHTML({ ...save, ring: k }, 'huge');
  if (sec === 'traveler') return `<canvas class="trav-prev" data-kind="${k}"></canvas>`;
  if (sec === 'back') return `<div class="card-prev" style="background-image:${cardBackURL(k)}"></div>`;
  if (sec === 'face') return `<div class="face-prev face-${k}"><div class="card up">${faceHTML({ rank: 6, suit: 1 })}</div><div class="card up">${faceHTML({ rank: 12, suit: 0 })}</div></div>`;
  if (sec === 'space') return `<div class="space-prev space-${k}"><div class="space"></div>${miniPlanet(['#86cf5c', '#4d9f45', '#2f86c8', '#ffc83d'])}</div>`;
  if (sec === 'frame') return `<div class="frame-prev">${postcardHTML(0, 24, 'mini', k)}</div>`;
  return `<div class="title-prev"><b>${esc(save.name)}</b>${titleHTML(k)}</div>`;
}
let shelf = null; // vitrina 3D de los viajeros: un solo lienzo WebGL mientras se ven
const closeShelf = () => (shelf?.dispose(), (shelf = null));
const travShelf = (root) => import('./travelers.js').then(({ TravelerShelf }) => {
  closeShelf();
  const slots = [...root.querySelectorAll('canvas[data-kind]')].map((c) => ({ canvas: c, kind: c.dataset.kind }));
  if (slots.length && root.isConnected) shelf = new TravelerShelf(slots);
});
// Arriba 3 grupos (Tú · Cartas · Viaje), abajo sus secciones. Así todo cabe en un teléfono.
function openShop(tab = 'avatar') {
  const was = { traveler: equipped('traveler') };
  const m = openModal({
    title: 'Tienda',
    ico: 'bag',
    color: 'orange',
    wide: true,
    cls: 'shop-modal',
    body: `<div class="shead"><div class="sgroups">${GROUPS.map((g) => `<button class="sgroup" data-group="${g.k}">${icon(g.ico)}<span>${g.name}</span></button>`).join('')}</div>
      <div class="stabs"></div>
      <div class="sbar"><p class="shint"></p><span class="smoney">${coin()}<b data-shop-coins>${fmt(save.coins)}</b></span></div></div><div class="sgrid"></div>`,
    onClose: () => {
      closeShelf();
      // El viajero vive en la escena 3D: al cambiarlo se vuelve a armar el mapa.
      if (equipped('traveler') !== was.traveler) current?.();
    },
  });
  const grid = m.el.querySelector('.sgrid'), hint = m.el.querySelector('.shint'), tabs = m.el.querySelector('.stabs');
  const card = (sec, it) => {
    const own = owns(sec, it.k), on = inUse(sec, it.k), lock = lockedUntil(sec, it.k);
    const foot = on ? `<span class="s-on">${icon('check')}En uso</span>`
      : own ? '<span class="s-use">Usar</span>'
      : lock ? `<span class="s-lock">${icon('lock')}Mundo ${lock}</span>`
      : `<span class="s-price ${save.coins < it.price ? 'short' : ''}">${coin()}${fmt(it.price)}</span>`;
    return `<button class="sitem ${on ? 'on' : ''} ${own ? 'own' : ''} ${lock ? 'locked' : ''}" data-k="${it.k}"><div class="s-art">${shopPreview(sec, it.k)}</div>${sec === 'title' ? '' : `<b>${it.name}</b>`}${it.text ? `<small>${it.text}</small>` : ''}${foot}</button>`;
  };
  const show = (sec, anim = true) => {
    const g = groupOf(sec), newGroup = groupOf(tab) !== g || !tabs.children.length;
    tab = sec;
    m.el.querySelectorAll('.sgroup').forEach((b) => b.classList.toggle('on', b.dataset.group === g.k));
    if (newGroup) {
      tabs.innerHTML = g.secs.map((k) => `<button class="stab" data-tab="${k}">${SECTIONS.find((x) => x.k === k).name}</button>`).join('');
      if (anim && !reduced()) [...tabs.children].forEach((el, i) => el.animate([{ opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1 }], { duration: 260, delay: i * 40, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'backwards' }));
    }
    tabs.querySelectorAll('.stab').forEach((b) => b.classList.toggle('on', b.dataset.tab === sec));
    hint.textContent = SHOP_HINT[sec];
    closeShelf();
    grid.className = `sgrid sg-${sec}`;
    m.el.querySelector('.mbody').scrollTop = 0;
    grid.innerHTML = shopItems(sec).map((it) => card(sec, it)).join('');
    if (anim && !reduced()) [...grid.children].forEach((el, i) => el.animate([{ opacity: 0, translate: '0 16px', scale: 0.9 }, { opacity: 1, translate: '0 0', scale: 1 }], { duration: 360, delay: i * 45, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'backwards' }));
    if (sec === 'traveler') travShelf(grid).then(() => tab !== 'traveler' && closeShelf());
  };
  // Vuelve a dibujar solo los pies de las tarjetas (sin reiniciar la vitrina 3D).
  const refresh = () => {
    m.el.querySelector('[data-shop-coins]').textContent = fmt(save.coins);
    grid.querySelectorAll('.sitem').forEach((el) => {
      const fresh = h(card(tab, item(tab, el.dataset.k)));
      el.className = fresh.className;
      el.querySelector('.s-on, .s-use, .s-price, .s-lock').replaceWith(fresh.querySelector('.s-on, .s-use, .s-price, .s-lock'));
      // El marco se ve sobre tu avatar actual: al cambiar de avatar se redibuja.
      if (tab === 'ring') el.querySelector('.s-art').innerHTML = shopPreview('ring', el.dataset.k);
    });
  };
  m.el.querySelector('.sgroups').addEventListener('click', (e) => {
    const b = e.target.closest('[data-group]');
    if (b && b.dataset.group !== groupOf(tab).k) show(GROUPS.find((g) => g.k === b.dataset.group).secs[0]);
  });
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b && b.dataset.tab !== tab) show(b.dataset.tab);
  });
  grid.addEventListener('click', async (e) => {
    const el = e.target.closest('.sitem');
    if (!el || el.classList.contains('on')) return;
    const k = el.dataset.k, it = item(tab, k), art = el.querySelector('.s-art');
    const nope = (msg) => {
      el.animate([{ translate: '0 0' }, { translate: '-6px 0' }, { translate: '5px 0' }, { translate: '-3px 0' }, { translate: '0 0' }], { duration: 300 });
      toast(msg);
    };
    if (lockedUntil(tab, k)) return nope(`${icon('lock')} Se abre al llegar al mundo ${lockedUntil(tab, k)}`);
    if (!owns(tab, k) && save.coins < it.price) return nope(`${coin()} Te faltan ${fmt(it.price - save.coins)} monedas`);
    const bought = !owns(tab, k);
    if (bought) {
      buy(tab, k);
      const r = el.getBoundingClientRect();
      await spendFromWallet('coins', { x: r.left + r.width / 2, y: r.top + r.height / 2 }, it.price);
    } else equip(tab, k);
    applyLook();
    paintMe();
    refresh();
    const r = art.getBoundingClientRect();
    if (bought) { sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 22); toast(`¡Nuevo! ${esc(it.name)}`); }
    art.animate([{ scale: 1 }, { scale: 1.18, rotate: '-4deg' }, { scale: 0.95, rotate: '2deg' }, { scale: 1, rotate: '0deg' }], { duration: 480, easing: 'ease-out' });
  });
  show(tab, false);
}
// Avatar de arriba a la derecha (y el del perfil en Ajustes): se vuelve a pintar al cambiarlo.
function paintMe() {
  document.querySelectorAll('.me').forEach((b) => {
    b.innerHTML = avatarHTML(save);
    if (!reduced()) b.animate([{ scale: 0.6 }, { scale: 1.15, offset: 0.6 }, { scale: 1 }], { duration: 420, easing: 'ease-out' });
  });
}

// ---------- Regalo diario: se ve una semana (6 días + el día 7 grande con caja sorpresa) ----------
const prizeIcons = (p) =>
  [p.coins && `${coin()}<b>${p.coins}</b>`, p.tickets && `${icon('ticket')}<b>×${p.tickets}</b>`, p.undo && `${icon('undo')}<b>×${p.undo}</b>`, p.wild && `${icon('wild')}<b>×${p.wild}</b>`].filter(Boolean);
// Lo que da un premio, como piezas para la ventana (icono + cantidad).
const lootHTML = (p) => prizeIcons(p).map((x) => `<span class="loot-it">${x}</span>`).join('');
// Suma el premio al guardado y lo lanza al monedero desde un punto de la pantalla.
async function grantPrize(p, from) {
  save.coins += p.coins || 0;
  save.tickets += p.tickets || 0;
  save.undo += p.undo || 0;
  save.wild += p.wild || 0;
  persist();
  const runs = [];
  if (p.coins) runs.push(flyToWallet('coins', from, p.coins));
  if (p.tickets) runs.push(wait(200).then(() => flyToWallet('tickets', from, p.tickets)));
  if (p.undo || p.wild) toast(prizeIcons({ undo: p.undo, wild: p.wild }).join(' '));
  await Promise.all(runs);
}
function openDailyTicket() {
  const left = ticketLeft(), n = ticketGift();
  const pile = (k) => Array.from({ length: k }, (_, i) => `<span style="--i:${i - (k - 1) / 2}">${icon('ticket', 0, 0, 'big')}</span>`).join('');
  const m = openModal({
    title: left ? 'Boletos de regalo' : '¡Boletos de regalo!',
    ico: 'ticket',
    color: 'pink',
    body: left
      ? `<div class="dticket wait"><div class="rays"></div>${pile(n)}</div><p class="tk-clock">${clock(left)}</p>`
      : `<div class="dticket"><div class="rays"></div>${pile(n)}<b>+${n}</b></div>`,
    buttons: left
      ? []
      : [
          {
            label: `${icon('ticket')} Reclamar`,
            cls: 'green',
            keep: true,
            onClick: async (btn) => {
              btn.disabled = true;
              const el = m.el.querySelector('.dticket'), r = el.getBoundingClientRect();
              sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 24);
              if (!reduced()) await el.animate([{ scale: 1 }, { scale: 1.25 }, { scale: 1 }], { duration: 420, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' }).finished;
              save.ticketAt = Date.now();
              persist();
              const b = document.querySelector('[data-a="dticket"]');
              if (b) b.outerHTML = ticketBtn();
              m.close();
              grantPrize({ tickets: n }, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
            },
          },
        ],
  });
  // Esperando: el reloj corre a la vista.
  if (left) {
    const c = m.el.querySelector('.tk-clock');
    const t = setInterval(() => (c.isConnected ? (c.textContent = clock(Math.max(0, ticketLeft()))) : clearInterval(t)), 1000);
  }
}
// "?" en la cabecera de una ventana: abre un globo con la ayuda. Se cierra al tocar el "?" otra vez o fuera del globo.
function helpTip(m, text) {
  const modal = m.el.querySelector('.modal'), head = modal.querySelector('.mhead');
  head.insertAdjacentHTML('afterbegin', '<button class="qhelp" aria-label="Ayuda" aria-expanded="false">?</button>');
  modal.insertAdjacentHTML('beforeend', `<div class="qtip info">${text}</div>`);
  const btn = head.querySelector('.qhelp');
  const set = (on) => (modal.classList.toggle('tip-open', on), btn.setAttribute('aria-expanded', on));
  btn.addEventListener('click', () => set(!modal.classList.contains('tip-open')));
  m.el.addEventListener('pointerdown', (e) => modal.classList.contains('tip-open') && !e.target.closest('.qhelp, .qtip') && set(false));
}

// ---------- Racha diaria ----------
// Camino: un punto de salida y los 6 premios, igual de separados; la barra se llena entre premio y premio.
function openRacha() {
  const r = racha(), t = rachaTheme(), next = RACHA_GOALS.find((x) => x.n > r.n);
  const pts = [0, ...RACHA_GOALS.map((x) => x.n)];
  let k = pts.findIndex((v) => v > r.n);
  const fill = k < 0 ? 1 : (k - 1 + (r.n - pts[k - 1]) / (pts[k] - pts[k - 1])) / (pts.length - 1);
  const stateOf = (i) => (r.pend.includes(i) ? 'ready' : r.got.includes(i) ? 'got' : 'next');
  const prize = (x) => `<div class="rps"><span class="rp">${coin()}<b>${x.coins}</b></span>${x.wild ? `<span class="rp">${icon('wild')}<b>×${x.wild}</b></span>` : ''}</div>`;
  // Entre mejor el premio, más grande y más vistoso el punto (el último lleva rayos y una caja).
  const nodes = RACHA_GOALS.map((x, i) => {
    const st = stateOf(i), last = i === RACHA_GOALS.length - 1;
    // Los premios listos también son botón: se canjean al tocarlos.
    const tag = st === 'ready' ? 'button' : 'div';
    return `<${tag} class="rg t${i} ${st}" data-i="${i}"${st === 'ready' ? ' aria-label="Reclamar"' : ''}>${last ? '<span class="rays"></span>' : ''}<i>${st === 'got' ? icon('check') : `<b>${x.n}</b>`}</i>${prize(x)}</${tag}>`;
  }).join('');
  const ready = rachaReady();
  let m;
  const claim = async () => {
    const cells = [...m.el.querySelectorAll('.rg.ready')];
    if (!cells.length) return;
    m.el.querySelectorAll('.rclaim, .mbtns .btn').forEach((b) => (b.disabled = true));
    const r0 = cells[0].getBoundingClientRect();
    cells.forEach((c) => {
      const b = c.getBoundingClientRect();
      sparkle({ x: b.left + b.width / 2, y: b.top + b.height / 3 }, 14);
      c.classList.replace('ready', 'got');
      c.querySelector('i').innerHTML = icon('check');
    });
    const p = rachaClaim();
    refreshRacha();
    await wait(reduced() ? 0 : 650);
    m.close();
    grantPrize(p, { x: r0.left + r0.width / 2, y: r0.top + r0.height / 2 });
  };
  // Acostado no cabe el botón de abajo: va arriba, junto al número (rtop se vuelve una fila).
  m = openModal({
    title: t.name,
    ico: t.ico,
    color: t.color,
    wide: true,
    cls: 'racha-modal',
    body: `<div class="rtop"><div class="rhero"><span class="rh-ico">${icon(t.ico)}</span><b>${r.n}</b></div>
      <p class="lead rsub">${next ? `Gana <b>${next.n - r.n}</b> más para el siguiente premio` : '¡Llegaste al premio más grande!'}</p>
      ${ready ? `<button class="btn gold rclaim">${icon('gift')} Reclamar</button>` : ''}</div>
      <div class="rpath" style="--fill:${fill}"><div class="rbar"><i></i></div><div class="rg start"><i>${icon(t.ico)}</i><div class="rps"></div></div>${nodes}</div>
      <div class="rclock-chip${ready ? ' urgent' : ''}">${ready ? 'Reclama antes de' : 'Nueva racha en'} <b class="rclock">${clock(msToMidnight())}</b></div>`,
    // Solo sirve para ver y canjear: sin botón de jugar.
    buttons: ready ? [{ label: `${icon('gift')} Reclamar`, cls: 'gold', keep: true, onClick: claim }] : [],
  });
  m.el.querySelectorAll('.rclaim, .rg.ready').forEach((b) => b.addEventListener('click', claim));
  helpTip(m, 'Gana niveles nuevos seguidos, con las estrellas que sea. Repetir niveles no suma. Si pierdes o abandonas uno nuevo, o te rindes en uno repetido, vuelves a 0 y se pierden los premios sin reclamar. A medianoche empieza otra: lo que no reclames antes, se pierde.');
  const c = m.el.querySelector('.rclock');
  const tick = setInterval(() => (c.isConnected ? (c.textContent = clock(msToMidnight())) : clearInterval(tick)), 1000);
}
const refreshRacha = () => document.querySelectorAll('[data-a="racha"]').forEach((b) => (b.outerHTML = rachaBtn()));
// Al volver de ganar: el número sube con un +1 que sale del botón.
function bumpRacha() {
  refreshRacha();
  bumpBtn('racha', '+1', rachaReady());
}
const refreshCol = () => document.querySelectorAll('[data-a="col"]').forEach((b) => (b.outerHTML = colBtn()));
function bumpCol(n) {
  refreshCol();
  bumpBtn('col', `+${n}`, document.querySelector('[data-a="col"]')?.classList.contains('ready'));
}
// El botón de un evento salta y suelta un "+n" que sube y se desvanece.
function bumpBtn(a, text, shine) {
  const b = document.querySelector(`[data-a="${a}"]`);
  if (!b || reduced()) return;
  b.animate([{ scale: 1 }, { scale: 1.3 }, { scale: 1 }], { duration: 480, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' });
  const r = b.getBoundingClientRect(), plus = document.createElement('b');
  plus.className = 'racha-plus outl';
  plus.textContent = text;
  plus.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top}px`;
  document.body.append(plus);
  plus.animate([{ opacity: 0, translate: '-50% 0' }, { opacity: 1, translate: '-50% -26px', offset: 0.3 }, { opacity: 0, translate: '-50% -50px' }], { duration: 1100, easing: 'ease-out' }).finished.then(() => plus.remove());
  if (shine) sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 16);
}

// ---------- Colección: tienda temporal ----------
// ¿Todavía se puede cambiar? Lo exclusivo, si no es tuyo; las ayudas, siempre.
const colAvail = (o) => !o.sec || !owns(o.sec, o.item);
// sec: con segundos (en la tienda de la colección, para que se vea avanzar).
const daysLeft = (ms, sec = false) => { if (ms <= 864e5) return clock(ms); const t = clock(ms % 864e5); return `${Math.floor(ms / 864e5)} d ${sec ? t : t.replace(/:\d\d$/, '')}`; };
const COL_KIND = { title: 'Título', frame: 'Postal', space: 'Espacio', ring: 'Marco', avatar: 'Avatar', back: 'Reverso', traveler: 'Viajero' };
const COL_HELP = { wild: 'Comodín', undo: 'Deshacer', tickets: 'Boletos' };
function openCol() {
  const c = col();
  if (!c) return;
  const tier = ticketGift();
  const was = equipped('traveler');
  // Como en la tienda: cada tarjeta dice qué es (la cinta morada = exclusivo de la temática) y cómo se llama.
  const offerHTML = (o) => {
    const mine = o.sec && owns(o.sec, o.item), short = c.state.n < o.price;
    const art = o.sec === 'title' ? titleHTML(o.item) : o.sec ? shopPreview(o.sec, o.item) : `<div class="c-prize">${prizeIcons(o.prize).join('')}</div>`;
    const foot = mine ? `<span class="s-on">${icon('check')}Tuyo</span>` : `<span class="s-price ${short ? 'short' : ''}">${icon(c.token)}${o.price}</span>`;
    const name = o.sec === 'title' ? '' : o.sec ? item(o.sec, o.item).name : COL_HELP[o.k];
    return `<button class="coffer sg-${o.sec || 'help'} ${mine ? 'own' : ''}" data-k="${o.k}">${o.sec ? `<em class="c-ex">${icon('star')}${COL_KIND[o.sec]}</em>` : ''}<div class="s-art">${art}</div>${name ? `<b>${name}</b>` : ''}${foot}</button>`;
  };
  const m = openModal({
    title: c.name,
    ico: c.token,
    color: c.color,
    wide: true,
    cls: 'col-modal',
    body: `<div class="ctop"><div class="cbank"><span class="cb-ico">${icon(c.token)}</span><b data-col-n>${c.state.n}</b></div>
      <div class="rclock-chip">Termina en <b class="cclock">${daysLeft(colLeft(), true)}</b></div></div>
      <div class="cgrid"></div>`,
    onClose: () => {
      closeShelf();
      // El viajero vive en la escena 3D: al cambiarlo se vuelve a armar el mapa.
      if (equipped('traveler') !== was) current?.();
    },
  });
  const grid = m.el.querySelector('.cgrid'), bank = m.el.querySelector('[data-col-n]');
  const paint = () => {
    grid.innerHTML = colOffers(tier).map(offerHTML).join('');
    travShelf(grid);
  };
  paint();
  if (!reduced()) [...grid.children].forEach((el, i) => el.animate([{ opacity: 0, translate: '0 16px', scale: 0.9 }, { opacity: 1, translate: '0 0', scale: 1 }], { duration: 360, delay: 120 + i * 50, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'backwards' }));
  helpTip(m, `Cada estrella nueva que ganas en un nivel te da 1 ${c.one || c.token}. Cámbia${c.m ? 'los' : 'las'} aquí antes de que acabe el domingo: las que sobren se pierden. Lo exclusivo es tuyo para siempre.`);
  grid.addEventListener('click', async (e) => {
    const el = e.target.closest('.coffer');
    if (!el) return;
    const o = colOffers(tier).find((x) => x.k === el.dataset.k);
    if (!colAvail(o)) return;
    if (c.state.n < o.price) {
      el.animate([{ translate: '0 0' }, { translate: '-6px 0' }, { translate: '6px 0' }, { translate: '-4px 0' }, { translate: '0 0' }], { duration: 300 });
      buzz(30);
      return toast(`Te faltan ${o.price - c.state.n} ${c.tokens}`);
    }
    colBuy(o);
    const r = el.getBoundingClientRect(), at = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    bank.textContent = c.state.n;
    if (!reduced()) bank.parentElement.animate([{ scale: 1 }, { scale: 0.85 }, { scale: 1 }], { duration: 300, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' });
    sparkle(at, 16);
    buzz(15);
    paint();
    const fresh = grid.querySelector(`[data-k="${o.k}"]`);
    if (!reduced()) fresh.animate([{ scale: 0.9 }, { scale: 1.08 }, { scale: 1 }], { duration: 420, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' });
    refreshCol();
    if (o.sec) {
      applyLook();
      toast(`${icon('check')} ¡Nuevo! Ya lo traes puesto`);
    } else grantPrize(o.prize, at);
  });
  const clk = m.el.querySelector('.cclock');
  const tick = setInterval(() => (clk.isConnected ? (clk.textContent = daysLeft(colLeft(), true)) : clearInterval(tick)), 1000);
}
// ---------- Evento del mes ----------
// 5 planetas de 5 niveles en su propia constelación. Un boleto temático para entrar: ganar lo devuelve,
// perder lo gasta y el siguiente llega a las 24 h (no se compra). El 5.º nivel de cada planeta da su exclusivo.
const EV_W = 900; // w de los planetas del evento en la vista 3D (solo para sus semillas y para reconocerlos)
const EV_NODES = [0, 2, 5, 7, 9]; // dónde van sus 5 insignias en el camino del planeta
const evBtn = () => {
  const e = ev();
  if (!e || e.done) return ''; // terminado: el botón se va hasta el siguiente evento
  // Arriba, lo que le queda al mes. El reloj del boleto vive adentro: aquí solo se apaga si no hay boleto
  // y se mueve con su punto cuando sí lo hay.
  const ready = !!(e.state.run || e.state.tk);
  return `<button class="iconbtn tb press ev-btn ${fresh('mes')} ${ready ? 'ready' : 'waiting'}" data-a="evento" aria-label="${e.name}" title="${e.name}">${icon(e.ico)}<small class="tl">${shortLeft(evLeft())}</small>${ready ? '<span class="dot"></span>' : ''}</button>`;
};
// Los tiempos de los botones avanzan solos (y el del mes vuelve a moverse cuando llega el boleto).
setInterval(() => {
  const b = document.querySelector('[data-a="evento"]');
  if (b && !b.classList.contains('fresh')) b.outerHTML = evBtn();
  const c = document.querySelector('[data-a="col"]');
  if (c && !c.classList.contains('fresh')) c.outerHTML = colBtn();
}, 20e3);
// El premio de un planeta, en chiquito (para la etiqueta del planeta y la ventana del premio).
const EV_KIND = { space: 'Fondo', frame: 'Postal', ring: 'Marco', avatar: 'Avatar', back: 'Reverso', title: 'Título', traveler: 'Nave' };
const evPrizeArt = (sec, k) => (sec === 'title' ? titleHTML(k) : shopPreview(sec, k));
// Tiempo que queda del evento, dicho para animar a jugar: días (o horas el último día).
const evDays = () => { const ms = evLeft(), d = Math.floor(ms / 864e5); return d >= 2 ? `${d} días` : d === 1 ? '1 día' : `${Math.max(1, Math.ceil(ms / 3600e3))} horas`; };
// El ícono del evento como imagen (la insignia del jefe se dibuja en un lienzo). Se carga una vez por temática.
const evImgs = {};
function evIcoImg(e) {
  if (evImgs[e.key]) return evImgs[e.key];
  const img = new Image();
  img.src = `data:image/svg+xml,${encodeURIComponent(icon(e.ico).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" '))}`;
  return (evImgs[e.key] = img);
}
// hold: planeta que se dibuja aún cerrado (para animar que se abre al volver de ganar el jefe anterior).
function evWorlds(e, hold = null) {
  const s = e.state, B = EVENT_BIOMES[e.key];
  return Array.from({ length: EVENT_PLANETS }, (_, p) => {
    const first = p * EVENT_PER_PLANET, done = Math.max(0, Math.min(EVENT_PER_PLANET, s.k - first));
    const state = p === hold ? 'locked' : done >= EVENT_PER_PLANET ? 'done' : s.k >= first ? 'current' : 'locked';
    const levels = Array.from({ length: EVENT_PER_PLANET }, (_, j) => ({ kind: first + j < s.k ? 'done' : first + j === s.k ? 'cur' : 'lock', stars: 0, paused: s.run?.k === first + j }));
    const chip = state === 'done' ? `<span class="chip info">${icon('check')}${icon('gift')}</span>` : state === 'current' ? `<span class="chip info">${icon('flag')}${done + 1}/${EVENT_PER_PLANET}</span>` : `<span class="lk">${icon('lock')}</span>`;
    return { w: EV_W + p, theme: B[p].planet, state, levels, done, pin: true, gift: true, badgeIco: evIcoImg(e), nodes: EV_NODES, chip };
  });
}
const evTicketPill = (e) => `<div class="pill info ev-tk" aria-label="Boleto del evento">${icon(e.tk)}<span data-evtk>${e.state.tk}</span></div>`;
function evCTA(e) {
  const s = e.state;
  if (e.done) return '';
  if (s.run) return goBtn('Continuar', `Nivel ${s.k + 1}`, 'ev-play');
  if (s.tk) return goBtn('Jugar', `Nivel ${s.k + 1}`, 'ev-play');
  return `<button class="go wait" data-a="ev-wait">${icon(e.tk)}<span class="t"><b class="outl">Boleto en</b><small data-evclock>${clock(evTicketLeft())}</small></span></button>`;
}
// after: lo que dejó la victoria ({ k, res }) para animar el avance al volver.
function showEvent({ anim, after = null, start = null } = {}) {
  const e = ev();
  if (!e) return showMap({ anim });
  gallery.active = false;
  current = () => showEvent();
  const p0 = after ? after.planet : start;
  const el = h(`<div class="screen galaxy event ev-${e.key}">
    <div class="space space-${e.ex[0].space}"></div><div class="g3d"></div><div class="glabels g-only"></div>
    <div class="g-only">
      <button class="hbtn tb press out-btn" data-a="back" aria-label="Volver al mapa" title="Mapa">${icon('prev')}</button>
      <div class="wtitle info">${icon(e.ico, 0, 0, 'em')}<div><b>${e.name}</b><small>¡A jugar! Quedan <span data-evleft>${evDays()}</span></small></div><button class="ev-help tb press" data-a="ev-help" aria-label="Cómo funciona el evento" title="Cómo funciona">?</button></div>
    </div>
    <div class="p-only phud"></div>
    <div class="res">${evTicketPill(e)}<div class="pill info" aria-label="Monedas">${coin()}<span data-coins>${money(save.coins - (after?.coins || 0))}</span></div>
      <button class="me press" data-a="me" aria-label="Tu perfil" title="Tu perfil">${avatarHTML(save)}</button></div>
    <div class="cta"></div>
    <button class="dev-pill" data-a="dev">DEV</button>
  </div>`);
  let galaxy = null;
  const cta = el.querySelector('.cta'), phud = el.querySelector('.phud');
  const paint = () => {
    const now = ev();
    if (!now) return showMap();
    cta.innerHTML = evCTA(now);
    el.querySelector('[data-evtk]').textContent = now.state.tk;
    if (galaxy?.mode === 'planet' && galaxy.sel) paintPlanet(galaxy.sel.wd.w - EV_W);
  };
  const paintPlanet = (p) => {
    phud.innerHTML = `<button class="hbtn tb press out-btn" data-a="out" aria-label="Volver a los planetas" title="Planetas">${icon('prev')}</button>
      <div class="wtitle info">${miniPlanet(EVENT_BIOMES[e.key][p].emblem, 'em')}<div><b>${e.planets[p]}</b><small>Planeta ${p + 1} de ${EVENT_PLANETS}</small></div></div>`;
  };
  // El reloj del boleto y el del mes corren solos; al llegar el boleto, el botón cambia a Jugar.
  const tick = setInterval(() => {
    if (!el.isConnected) return clearInterval(tick);
    el.querySelector('[data-evleft]').textContent = evDays();
    const c = el.querySelector('[data-evclock]');
    if (c) (evTicketLeft() ? (c.textContent = clock(evTicketLeft())) : (paint(), evTicketArrives(el)));
  }, 1000);
  el.addEventListener('click', (ev2) => {
    const a = ev2.target.closest('[data-a]')?.dataset.a;
    if (galaxy?.busy) return;
    if (a === 'back') return warp(() => showMap(), { out: true });
    if (a === 'out') return galaxy?.zoomOut();
    if (a === 'ev-play') return evPlay();
    if (a === 'ev-wait') return openEvWait();
    if (a === 'ev-help') return openEvIntro(ev() || e);
    if (a === 'me') return openProfile();
    if (a === 'dev') return sideAction(a);
  });
  mount(el, anim);
  paint();
  if (!e.state.intro) wait(anim ? 700 : 300).then(() => el.isConnected && openEvIntro(e));
  const make = () => {
    if (!el.isConnected) return;
    galaxy = new Galaxy(el.querySelector('.g3d'), el.querySelector('.glabels'), {
      worlds: evWorlds(e, after && after.k % EVENT_PER_PLANET === EVENT_PER_PLANET - 1 && !after.last ? after.planet + 1 : null),
      player: { traveler: equipped('traveler') },
      start: p0 != null ? EV_W + p0 : null,
      celebrate: after ? { w: EV_W + after.planet, i: after.k % EVENT_PER_PLANET, kind: 'cur', stars: 0 } : null,
      on: {
        mode: (m, w) => {
          el.classList.toggle('zoomed', m === 'planet');
          current = () => showEvent({ start: m === 'planet' ? w - EV_W : null });
          if (m === 'planet') paintPlanet(w - EV_W);
        },
        locked: () => toast(`${icon('lock')} Primero termina el planeta anterior`),
        relayout: () => current?.(),
        level: (w, i) => {
          const k = (w - EV_W) * EVENT_PER_PLANET + i, s = ev()?.state;
          if (!s) return;
          if (k < s.k) return toast(`${icon('check')} Ya lo ganaste`);
          if (k > s.k) return toast('Gana el nivel anterior');
          evPlay();
        },
      },
    });
    el._dispose = () => galaxy.dispose();
    if (after) evCelebrate(galaxy, after, el, cta, paint);
  };
  const img = evIcoImg(e), ready = img.complete ? Promise.resolve() : img.decode().catch(() => {});
  Promise.all([ready, Galaxy ? null : loadGalaxy()]).then(() => requestAnimationFrame(make));
}
// Al volver de ganar: monedas al monedero, el viajero camina al siguiente nivel; si fue el jefe del planeta,
// se sale a la constelación y el siguiente planeta se enciende.
async function evCelebrate(galaxy, a, el, cta, paint) {
  galaxy.busy = true;
  cta.style.opacity = 0;
  await wait(reduced() ? 150 : 650);
  const runs = [galaxy.playCelebrate()];
  if (a.coins) runs.push(flyToWallet('coins', { x: innerWidth / 2, y: innerHeight * 0.45 }, a.coins));
  await Promise.all(runs);
  updateCoins();
  if (a.wild || a.undo) toast(prizeIcons({ undo: a.undo, wild: a.wild }).join(' '));
  const boss = a.k % EVENT_PER_PLANET === EVENT_PER_PLANET - 1;
  if (boss && a.planet + 1 < EVENT_PLANETS && galaxy.sel) {
    await wait(500);
    await galaxy.zoomOut();
    const e = ev();
    galaxy.busy = true;
    if (e) await galaxy.unlock(EV_W + a.planet + 1, evWorlds(e)[a.planet + 1]);
    toast(`¡${e?.planets[a.planet + 1] || 'Siguiente planeta'} abierto!`);
  }
  galaxy.busy = false;
  paint();
  cta.style.opacity = '';
  if (!reduced()) cta.animate([{ scale: 0.4, opacity: 0 }, { scale: 1.08, opacity: 1, offset: 0.6 }, { scale: 1 }], { duration: 420, easing: 'ease-out' });
  if (a.last) openEvDone(ev() || { name: 'el evento', ico: 'trophy', color: 'gold' });
}
// El boleto llega (a las 24 h): el contador salta y brilla.
function evTicketArrives(el) {
  const pill = el.querySelector('.ev-tk');
  if (!pill || reduced()) return;
  pill.animate([{ scale: 1 }, { scale: 1.35 }, { scale: 1 }], { duration: 520, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' });
  const r = pill.getBoundingClientRect();
  sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 14);
}
// Bienvenida (la primera vez que se entra al evento del mes, y luego con el botón ?): de qué va y cómo se juega.
// Los premios no se muestran: son sorpresa (solo se dice qué tipo de cosas se pueden ganar).
// go: se abre afuera (en las constelaciones) y su botón lleva al evento. Devuelve una promesa que se cumple al cerrarla.
function openEvIntro(e, go = false) {
  let done;
  const closed = new Promise((r) => (done = r));
  const rule = (ico, html) => `<li>${icon(ico)}<span>${html}</span></li>`;
  const m = openModal({
    title: e.name,
    ico: e.ico,
    color: e.color,
    wide: true,
    cls: 'ev-intro',
    body: `<div class="evi-hero"><div class="rays"></div>${[0, 1, 2, 3, 4].map((p) => `<span class="evi-pl" style="--i:${p - 2}">${miniPlanet(EVENT_BIOMES[e.key][p].emblem)}</span>`).join('')}<span class="evi-ico">${icon(e.ico, 0, 0, 'big')}</span></div>
      <p class="lead">¡Llegó el evento del mes! Viaja por <b>${EVENT_PLANETS} planetas</b> y gana premios <b>exclusivos</b> que solo salen ahora: avatares, marcos, reversos, postales, fondos, títulos y naves.</p>
      <ul class="evi-rules">
        ${rule(e.tk, `Entras con <b>1 boleto</b>. Si ganas, lo conservas; si pierdes, el siguiente llega en <b>24 horas</b>.`)}
        ${rule('gift', `Gana el <b>nivel 5</b> de cada planeta y abre su <b>regalo sorpresa</b>. Es tuyo para siempre.`)}
        ${rule('flame', `${EVENT_LEVELS} niveles <b>difíciles</b>. Aquí no cuentan las estrellas: solo ganar. Usa tus comodines y deshacer.`)}
        ${rule('flag', `Tienes <b>${evDays()}</b> para llegar al último planeta. ¡Entra cada día y no dejes pasar tu boleto!`)}
      </ul>`,
    // Botón del mes: con los colores y la flor de la temática (sin el triángulo de Jugar).
    buttons: [{ label: `${icon(e.deco)}<span>¡A jugar!</span>${icon(e.deco)}`, cls: `wide ev-go ev-go-${e.key}`, onClick: () => go && warp(() => showEvent()) }],
    // Se da por vista al cerrarla (si se gira el teléfono con la ventana abierta, vuelve a salir).
    onClose: () => {
      e.state.intro = true;
      persist();
      done();
    },
  });
  if (reduced()) return closed;
  m.el.querySelectorAll('.evi-pl').forEach((el, i) => el.animate([{ opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1.15, offset: 0.7 }, { opacity: 1, scale: 1 }], { duration: 460, delay: 150 + i * 90, easing: 'ease-out', fill: 'backwards' }));
  m.el.querySelectorAll('.evi-rules li').forEach((el, i) => el.animate([{ opacity: 0, translate: '-14px 0' }, { opacity: 1, translate: '0 0' }], { duration: 320, delay: 650 + i * 120, easing: 'ease-out', fill: 'backwards' }));
  return closed;
}
// Evento terminado: el show (confeti, rayos, el ícono del evento) y Finalizar, que regresa al mapa.
function openEvDone(e) {
  const pcHere = e.state ? evAlbum().find((x) => x.id === e.state.id) : null; // la postal del álbum, con el año
  confetti(120);
  buzz(30);
  const m = openModal({
    title: `¡Completaste ${e.name}!`,
    ico: e.ico,
    color: 'gold',
    closable: false,
    cls: 'win ev-done',
    body: `<div class="win-top"><div class="rays"></div><div class="ev-win">${icon(e.ico, 0, 0, 'big')}</div></div>
      <p class="lead">Recorriste los ${EVENT_PLANETS} planetas y ganaste los ${EVENT_LEVELS} niveles. Todos los premios ya son tuyos.</p>
      ${pcHere ? `${evPostcardHTML(pcHere, 'mini ev-done-pc')}<p class="note">Su postal ya está en tu álbum, en <b>Eventos</b>.</p>` : '<p class="note">El próximo evento trae una temática nueva. ¡Te esperamos!</p>'}`,
    // Un solo botón: se sale del evento y vuelves a tu mapa, donde ibas.
    buttons: [{ label: 'Finalizar', cls: `wide ev-go ev-go-${e.key || 'muertos'}`, onClick: () => warp(() => showMap(), { out: true }) }],
  });
  if (!reduced()) setTimeout(() => { const r = m.el.querySelector('.ev-win')?.getBoundingClientRect(); if (r) sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 26); }, 700);
  // La postal llega girando y el sello del año cae encima.
  const pc = m.el.querySelector('.ev-done-pc');
  if (pc && !reduced()) {
    pc.animate([{ rotate: '-8deg', scale: 0.7, opacity: 0 }, { rotate: '3deg', scale: 1.04, opacity: 1, offset: 0.7 }, { rotate: '-1.5deg', scale: 1 }], { duration: 620, delay: 900, easing: 'ease-out', fill: 'backwards' });
    pc.querySelector('.stamp').animate([{ scale: 2.6, rotate: '-30deg', opacity: 0 }, { scale: 0.92, rotate: '12deg', opacity: 1, offset: 0.7 }, { scale: 1, rotate: '8deg' }], { duration: 420, delay: 1500, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'backwards' });
  }
}
// Jugar el nivel que sigue: retoma la partida guardada o gasta el boleto (se rompe con su animación).
function evPlay() {
  const e = ev();
  if (!e || e.done) return;
  if (e.state.run) return startEvent();
  if (!e.state.tk) return openEvWait();
  if (entering) return;
  entering = true;
  evEnter();
  spendTickets(1, '[data-evtk]', e.tk, 1).then(() => {
    entering = false;
    startEvent();
  });
}
function openEvWait() {
  const e = ev();
  if (!e) return;
  const m = openModal({
    title: 'Sin boleto',
    ico: e.tk,
    color: e.color,
    body: `<div class="dticket wait"><div class="rays"></div><span style="--i:0">${icon(e.tk, 0, 0, 'big')}</span></div><p class="tk-clock">${clock(evTicketLeft())}</p>
      <p class="note">Gastaste tu boleto del evento. El siguiente llega solo, a las 24 horas de perderlo.</p>`,
    buttons: [{ label: 'Entendido', cls: 'ghost wide' }],
  });
  const c = m.el.querySelector('.tk-clock');
  const t = setInterval(() => (c.isConnected ? (evTicketLeft() ? (c.textContent = clock(evTicketLeft())) : (m.close(), current?.())) : clearInterval(t)), 1000);
}
// La partida del evento: mismas reglas, sin estrellas. Perder, rendirse o abandonar gasta el boleto.
function startEvent() {
  const e = ev(), run = e?.state.run;
  if (!run) return showEvent();
  const old = [...app.children];
  game?.destroy();
  game = null;
  document.getElementById('modal-root').replaceChildren();
  const level = variantLevel(eventLevel(e.id, run.k, e.state.world), run.v);
  const back = (after) => showEvent({ anim: 'down', after, start: Math.floor(run.k / EVENT_PER_PLANET) });
  const lose = () => (evLose(), back());
  game = new Game(app, level, {
    dev,
    resume: run.state,
    saved: true,
    event: { ico: e.ico, table: e.key, boss: run.k % EVENT_PER_PLANET === EVENT_PER_PLANET - 1 },
    onSave: (state) => {
      const r = ev()?.state.run;
      if (r) (r.state = state), persist();
    },
    onExit: () => back(),
    onAbandon: lose,
    onRetry: lose,
    onDone: async (res) => {
      if (res.items?.length) await openEvPrize(e, res);
      back(res.counted ? res : null);
    },
    onWin: () => {
      const r = evWin();
      if (!r) return { coins: 0, tickets: 0, prev: 0, items: [], title: '¡Nivel superado!' };
      persist();
      return { ...r, coins: r.coins || 0, tickets: 0, prev: 0, counted: true, title: r.last ? '¡Evento completado!' : `¡Nivel ${r.k + 1} de ${EVENT_LEVELS}!` };
    },
  });
  const el = game.el;
  const drop = () => old.forEach((o) => (o._dispose?.(), o.remove()));
  if (old.length && !reduced()) {
    old.forEach((o) => o.animate([{ opacity: 1, scale: 1 }, { opacity: 0.4, scale: 0.94 }], { duration: 520, easing: 'ease-out', fill: 'forwards' }));
    el.animate([{ translate: '0 100%' }, { translate: '0 0' }], { duration: 560, easing: 'cubic-bezier(0.2, 0.9, 0.25, 1)' }).finished.then(drop, drop);
  } else drop();
  // Modo dev: la misma barra (Ganar, Resolver, Solución…) para probar el evento sin jugarlo entero.
  game.attachDev = () => attachDevBar(game, { go: () => toast('En el evento se juega en orden'), toGallery: () => showGallery(save.next) });
  current = null;
  if (dev.on) game.attachDev();
}
// Premio del 5.º nivel: la caja tiembla, se abre y salen los exclusivos (ya puestos).
function openEvPrize(e, res) {
  return new Promise((done) => {
    confetti(60);
    const m = openModal({
      title: `¡${e.planets[res.planet]} completado!`,
      color: e.color,
      closable: false,
      wide: res.items.length > 1,
      cls: 'ev-prize',
      body: `<div class="evbox"><div class="gbox"><span class="lid">${boxLid()}</span><span class="body">${boxBody()}</span></div></div>
        <div class="ev-items">${res.items.map((it) => `<div class="coffer sg-${it.sec}"><em class="c-ex">${icon('star')}${EV_KIND[it.sec]}</em><div class="s-art">${evPrizeArt(it.sec, it.k)}</div>${it.sec === 'title' ? '' : `<b>${item(it.sec, it.k).name}</b>`}</div>`).join('')}</div>
        <p class="note">Exclusivo de ${e.name}: es tuyo para siempre y ya lo traes puesto.</p>`,
      buttons: [{ label: 'Continuar', cls: 'green wide', onClick: () => { closeShelf(); done(); } }],
    });
    applyLook();
    travShelf(m.el);
    const box = m.el.querySelector('.gbox'), items = [...m.el.querySelectorAll('.ev-items .coffer')];
    if (reduced()) return m.el.classList.add('opened');
    items.forEach((x) => (x.style.opacity = 0));
    setTimeout(async () => {
      await box.animate([{ rotate: '0deg' }, { rotate: '-9deg' }, { rotate: '8deg' }, { rotate: '-6deg' }, { rotate: '4deg' }, { rotate: '0deg' }], { duration: 650, iterations: 2 }).finished;
      box.querySelector('.lid').animate([{ translate: '0 0', rotate: '0deg' }, { translate: '30px -70px', rotate: '40deg', opacity: 1, offset: 0.6 }, { translate: '60px -40px', rotate: '80deg', opacity: 0 }], { duration: 600, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)', fill: 'forwards' });
      const r = box.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 3;
      sparkle({ x: cx, y: cy }, 22);
      buzz(20);
      await Promise.all(items.map((x, i) => {
        x.style.opacity = '';
        const b = x.getBoundingClientRect(), dx = cx - (b.left + b.width / 2), dy = cy - (b.top + b.height / 2);
        return x.animate([
          { translate: `${dx}px ${dy}px`, scale: 0.2, rotate: '-20deg', opacity: 0 },
          { translate: `${dx * 0.4}px ${dy * 0.4 - 60}px`, scale: 1.12, rotate: '6deg', opacity: 1, offset: 0.6 },
          { translate: '0 0', scale: 1, rotate: '0deg', opacity: 1 },
        ], { duration: 700, delay: 150 + i * 260, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)', fill: 'backwards' }).finished.then(() => {
          const q = x.getBoundingClientRect();
          sparkle({ x: q.left + q.width / 2, y: q.top + q.height / 3 }, 12);
          buzz(12);
        });
      }));
    }, 500);
  });
}

// ---------- Avisos al llegar ----------
// En las constelaciones (y al volver al mapa) salen, uno por uno: lo recién desbloqueado (una sola vez en la vida),
// la bienvenida de la colección (cada colección) y la del evento del mes (cada mes con evento), y si se perdió la racha.
// Cada uno se marca visto al cerrarlo. Al cambiar de pantalla (o al girar el teléfono, que vuelve a dibujarla)
// la cola vieja se olvida y la pantalla nueva empieza otra.
let noticeGen = 0;
const modalOpen = () => !!document.querySelector('#modal-root .modal-back');
// Espera a que no haya ventanas, túnel ni animaciones del mapa; false si mientras tanto cambió la pantalla.
async function calm(gen) {
  await wait(700);
  while (gen === noticeGen && (modalOpen() || document.querySelector('.warp') || map?.galaxy?.busy || document.querySelector('.guide'))) await wait(250);
  return gen === noticeGen;
}
async function notices() {
  const gen = ++noticeGen;
  if (tourStep() || save.onboard !== 'done') return;
  for (const k of ['racha', 'col', 'mes', 'col2']) {
    if (!isOn(k) || save.intro?.[k]) continue;
    if (!(await calm(gen))) return;
    await openUnlock(k);
  }
  const c = col();
  if (c && !c.state.intro) {
    if (!(await calm(gen))) return;
    await openColIntro(c);
  }
  const e = ev();
  if (e && !e.done && !e.state.intro) {
    if (!(await calm(gen))) return;
    await openEvIntro(e, true);
  }
  if (await calm(gen)) rachaLost();
}

// Algo nuevo en la columna de la derecha: su botón entra volando, sale la ventana que lo explica
// y, al cerrarla, el botón late con un anillo para que se vea dónde quedó.
const UNLOCK_INFO = {
  racha: () => {
    const t = rachaTheme();
    return {
      title: `¡Nueva: ${t.name}!`, ico: t.ico, color: t.color, hero: icon(t.ico, 0, 0, 'big'),
      lead: `Ganaste <b>${UNLOCK.racha} niveles</b>: ¡se abrió la racha! Gana niveles seguidos y llévate premios cada día.`,
      rules: [
        ['flag', 'Cuenta cada nivel <b>nuevo</b> que ganes, con las estrellas que sea. Repetir no suma.'],
        ['gift', `Premios a los <b>${RACHA_GOALS.map((g) => g.n).join(', ')}</b> seguidos: monedas y <b>comodines</b>.`],
        ['flame', 'Si pierdes o abandonas un nivel nuevo, o te rindes en uno repetido, la racha <b>vuelve a 0</b> y se pierden los premios sin reclamar.'],
        ['rocket', 'A medianoche empieza otra: <b>reclama tus premios</b> antes o se pierden. La encuentras a la <b>derecha</b>.'],
      ],
    };
  },
  col: () => {
    const c = col(), days = daysToNextCol();
    return {
      title: '¡Nuevas: Colecciones!', ico: c?.token || 'concha', color: c?.color || 'blue', hero: ['concha', 'gema', 'bellota', 'caramelo'].map((t) => icon(t)).join(''),
      lead: 'Una o dos semanas al mes llega una <b>colección</b> con su temática y su <b>tienda</b> de premios exclusivos.',
      rules: [
        ['star', 'Cada <b>estrella nueva</b> que ganas te da <b>1 ficha</b> de la colección.'],
        ['bag', 'Cámbialas por avatares, reversos, viajeros y más que <b>solo salen ahí</b>.'],
        ['flag', 'Termina el <b>domingo</b>: las fichas que sobren se pierden.'],
        ['gift', c ? '¡Ya llegó una! Búscala a la <b>derecha</b>.' : `La próxima llega en <b>${days} ${days === 1 ? 'día' : 'días'}</b>.`],
      ],
    };
  },
  // Nivel 100: se suman las colecciones nuevas y hay colección 3 semanas al mes.
  col2: () => {
    const c = col(), days = daysToNextCol(), nuevas = plusCols(), n = nuevas.length;
    return {
      title: n === 1 ? '¡Una colección nueva!' : `¡${n} colecciones nuevas!`, ico: nuevas[0].token, color: nuevas[0].color, hero: nuevas.map((x) => icon(x.token)).join(''),
      lead: `Llegaste al <b>nivel ${UNLOCK.col2}</b>: ${n === 1 ? 'se suma una colección nueva' : `se suman ${n} colecciones nuevas`} y ahora hay colección <b>3 semanas al mes</b>.`,
      rules: [
        ...nuevas.map((x) => [x.token, `<b>${x.name}</b>: junta <b>${x.tokens}</b> y gana sus exclusivos.`]),
        ['star', 'Se turnan con las de siempre: <b>conchas, gemas, bellotas y caramelos</b>.'],
        ['gift', c ? 'Hay una ahora mismo: búscala a la <b>derecha</b>.' : `La próxima llega en <b>${days} ${days === 1 ? 'día' : 'días'}</b>.`],
      ],
    };
  },
  mes: () => {
    const e = ev(), nx = !e && nextEvent();
    return {
      // Arriba, los iconos de todos los eventos del año; el de este mes (o el próximo) va al centro y más grande.
      title: '¡Nuevo: Evento del mes!', ico: e?.ico || nx?.ico || 'calavera', color: e?.color || 'orange', hero: evHeroIcons(e?.ico || nx?.ico),
      lead: 'Algunos meses llega un <b>evento de temporada</b>: 5 planetas, 25 niveles y premios que <b>solo salen ese mes</b>.',
      rules: [
        ['flame', 'Son los niveles <b>más difíciles</b>: muchos piden <b>comodines</b> o <b>+5 cartas</b>. ¡Guárdalos!'],
        ['gift', 'Gana el <b>nivel 5</b> de cada planeta y abre su <b>regalo sorpresa</b>.'],
        ['flag', 'Dura todo el mes. Si lo empiezas tarde, juega lo que alcances.'],
        ['ticket', e ? `¡Este mes hay uno: <b>${e.name}</b>! Búscalo a la <b>derecha</b>.` : nx ? `El próximo, <b>${nx.name}</b>, llega en <b>${nx.days} ${nx.days === 1 ? 'día' : 'días'}</b>.` : 'Pronto llega el primero.'],
      ],
    };
  },
};
// Solo 3: el evento anterior, el de este mes (o el próximo) al centro y más grande, y el siguiente (en orden del año).
function evHeroIcons(main) {
  const all = Object.keys(EVENTOS).map(Number).sort((a, b) => a - b).map((m) => EVENTOS[m]).filter((x) => x.ready).map((x) => x.ico);
  const i = Math.max(0, all.indexOf(main)), at = (k) => all[(i + k + all.length) % all.length];
  return [at(-1), at(0), at(1)].map((x, k) => icon(x, 0, 0, k === 1 ? 'main' : '')).join('');
}
async function openUnlock(k) {
  const sel = `.side.r [data-a="${{ racha: 'racha', col: 'col', mes: 'evento', col2: 'col' }[k]}"]`;
  const btn = document.querySelector(sel);
  revealed.add(k);
  if (btn) {
    btn.classList.remove('fresh');
    if (!reduced()) {
      const r = btn.getBoundingClientRect();
      await btn.animate([{ scale: 0, rotate: '-30deg', opacity: 0 }, { scale: 1.35, rotate: '8deg', opacity: 1, offset: 0.6 }, { scale: 1, rotate: '0deg', opacity: 1 }], { duration: 620, easing: 'ease-out' }).finished;
      sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 22);
      buzz(20);
      await wait(350);
    }
  }
  const info = UNLOCK_INFO[k]();
  await new Promise((done) => {
    const m = openModal({
      title: info.title,
      color: info.color,
      wide: true,
      cls: `ev-intro unlock-${k}`,
      body: `<div class="evi-hero"><div class="rays"></div><span class="evi-ico ul-hero">${info.hero}<span class="ul-new outl">¡Nuevo!</span></span></div>
        <p class="lead">${info.lead}</p>
        <ul class="evi-rules">${info.rules.map(([ico, html]) => `<li>${icon(ico)}<span>${html}</span></li>`).join('')}</ul>`,
      buttons: [{ label: '¡Entendido!', cls: 'gold wide' }],
      onClose: () => {
        (save.intro ||= {})[k] = true;
        persist();
        done();
      },
    });
    if (reduced()) return;
    m.el.querySelectorAll('.ul-hero > .ico').forEach((el, i) => el.animate([{ opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1.2, offset: 0.7 }, { opacity: 1, scale: 1 }], { duration: 500, delay: 150 + i * 110, easing: 'ease-out', fill: 'backwards' }));
    m.el.querySelectorAll('.evi-rules li').forEach((el, i) => el.animate([{ opacity: 0, translate: '-14px 0' }, { opacity: 1, translate: '0 0' }], { duration: 320, delay: 550 + i * 120, easing: 'ease-out', fill: 'backwards' }));
  });
  // El botón pudo volverse a pintar mientras leía (su tiempo avanza solo): se busca el de ahora.
  const now = document.querySelector(sel);
  if (now) {
    now.classList.add('spot');
    setTimeout(() => now.classList.remove('spot'), 4200);
  }
}

// Bienvenida de cada colección: cuál es, cómo se juntan sus fichas y qué exclusivos trae (estos sí se ven).
function openColIntro(c) {
  return new Promise((done) => {
    const show = ['avatar', 'back', 'ring', 'space'];
    const m = openModal({
      title: c.name,
      ico: c.token,
      color: c.color,
      wide: true,
      cls: 'ev-intro col-intro',
      body: `<div class="evi-hero"><div class="rays"></div>${show.map((sec, i) => `<span class="ci-ex" style="--i:${i < 2 ? i - 2 : i - 1}">${shopPreview(sec, c.ex[sec])}</span>`).join('')}<span class="evi-ico">${icon(c.token, 0, 0, 'big')}</span></div>
        <p class="lead">¡Llegó una colección! Junta <b>${c.tokens}</b> y cámbia${c.m ? 'los' : 'las'} por premios <b>exclusivos</b>: avatar, reverso, marco, fondo, viajero y más.</p>
        <ul class="evi-rules">
          <li>${icon('star')}<span>Cada <b>estrella nueva</b> que ganas te da <b>1 ${c.one || c.token}</b>.</span></li>
          <li>${icon('bag')}<span>Cámbia${c.m ? 'los' : 'las'} en su tienda: toca su botón a la <b>derecha</b>.</span></li>
          <li>${icon('flag')}<span>Te quedan <b>${daysLeft(colLeft())}</b>: ${c.m ? 'los' : 'las'} ${c.tokens} que sobren se pierden.</span></li>
        </ul>`,
      buttons: [{ label: `${icon(c.token)}<span>¡A juntar!</span>`, cls: 'gold wide' }],
      onClose: () => {
        c.state.intro = true;
        persist();
        done();
      },
    });
    if (reduced()) return;
    m.el.querySelectorAll('.ci-ex').forEach((el, i) => el.animate([{ opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1.15, offset: 0.7 }, { opacity: 1, scale: 1 }], { duration: 460, delay: 150 + i * 90, easing: 'ease-out', fill: 'backwards' }));
    m.el.querySelectorAll('.evi-rules li').forEach((el, i) => el.animate([{ opacity: 0, translate: '-14px 0' }, { opacity: 1, translate: '0 0' }], { duration: 320, delay: 650 + i * 120, easing: 'ease-out', fill: 'backwards' }));
  });
}

// Si se perdió una racha, al llegar al mapa el botón tiembla y lo dice.
// También si pasó la medianoche con premios sin reclamar: esos se perdieron.
function rachaLost() {
  const r = racha();
  if (!r.lost && !r.expired) return;
  const msg = r.lost ? 'Tu racha volvió a 0' : 'No reclamaste los premios de tu racha: se perdieron';
  delete r.lost;
  delete r.expired;
  persist();
  wait(700).then(() => {
    const b = document.querySelector('[data-a="racha"]');
    b?.animate([{ rotate: '0deg' }, { rotate: '-12deg' }, { rotate: '10deg' }, { rotate: '-6deg' }, { rotate: '0deg' }], { duration: 500 });
    toast(`${icon(rachaTheme().ico)} ${msg}`);
  });
}

function openDaily() {
  const st = dailyState(save.daily);
  const N = DAILY_PATH.length;
  const idx = st.claimed ? (st.day - 1 + N) % N : st.day;
  const week = Math.floor(idx / 7) * 7;
  const stateOf = (i) => (i < idx || (st.claimed && i === idx) ? 'got' : i === idx ? 'today' : 'next');
  let days = '';
  for (let i = week; i < week + 6; i++) {
    const p = DAILY_PATH[i], k = stateOf(i);
    const main = p.coins ? `${coin('big')}<b>+${p.coins}</b>` : p.tickets ? `${icon('ticket', 0, 0, 'big')}<b>+${p.tickets}</b>` : '';
    days += `<div class="day ${k}" data-i="${i}"><small>Día ${i - week + 1}</small><span class="dp">${main}</span>${k === 'got' ? `<i class="ok">${icon('check')}</i>` : ''}</div>`;
  }
  const big = week + 6, bk = stateOf(big);
  const seven = `<div class="day day7 ${bk}" data-i="${big}"><small>Día 7</small>
      <div class="gbox"><span class="lid">${boxLid()}</span><span class="body">${boxBody()}</span></div>
      <b class="q">${bk === 'got' ? '¡Abierta!' : '¡Sorpresa!'}</b><div class="loot"></div>${bk === 'got' ? `<i class="ok">${icon('check')}</i>` : ''}</div>`;
  const m = openModal({
    title: 'Regalo diario',
    ico: 'gift',
    color: 'green',
    wide: true,
    body: `${st.reset ? '<p class="note">Se rompió tu racha: vuelves al día 1.</p>' : ''}<div class="daily"><div class="dgrid">${days}</div>${seven}</div>`,
    buttons: [
      {
        label: st.claimed ? 'Vuelve mañana' : `${icon('gift')} Reclamar`,
        cls: 'green',
        disabled: st.claimed,
        keep: true,
        onClick: async (btn) => {
          btn.disabled = true;
          const cell = m.el.querySelector('.day.today');
          let p = DAILY_PATH[st.day];
          if (p.surprise) {
            // La caja tiembla, la tapa sale volando y aparece lo que traía.
            p = openSurprise(p.surprise);
            const box = cell.querySelector('.gbox');
            if (!reduced()) {
              await box.animate([{ rotate: '0deg' }, { rotate: '-9deg' }, { rotate: '8deg' }, { rotate: '-6deg' }, { rotate: '4deg' }, { rotate: '0deg' }], { duration: 650, iterations: 2 }).finished;
              box.querySelector('.lid').animate([{ translate: '0 0', rotate: '0deg' }, { translate: '30px -70px', rotate: '40deg', opacity: 1, offset: 0.6 }, { translate: '60px -40px', rotate: '80deg', opacity: 0 }], { duration: 600, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)', fill: 'forwards' });
            }
            const r = box.getBoundingClientRect();
            sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 3 }, 20);
            cell.querySelector('.q').textContent = '¡Abierta!';
            cell.classList.add('opened');
            cell.querySelector('.loot').innerHTML = lootHTML(p);
            await wait(1500);
          } else if (!reduced()) {
            await cell.animate([{ scale: 1 }, { scale: 1.18 }, { scale: 1 }], { duration: 380, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' }).finished;
          }
          cell.classList.replace('today', 'got');
          cell.insertAdjacentHTML('beforeend', `<i class="ok">${icon('check')}</i>`);
          save.daily = { day: (st.day + 1) % N, last: new Date().toDateString() };
          document.querySelector('[data-a="daily"] .dot')?.remove();
          document.querySelector('[data-a="daily"]')?.classList.remove('ready');
          await wait(450);
          const r = cell.getBoundingClientRect();
          m.close();
          grantPrize(p, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
        },
      },
    ],
  });
  helpTip(m, 'Entra cada día y reclama tu regalo. El día 7 abres una caja sorpresa. Si un día faltas, vuelves al día 1.');
}

// ---------- Jefe vencido: postal del mundo (según sus estrellas) y cofre ----------
const TIER = { oro: '¡Perfecto!', plata: '¡Excelente!', bronce: '¡Muy bien!', sello: '¡Completado!' };
// Segundo sello: el nivel secreto del mundo sacado con 3 estrellas.
const sealHTML = (w) => ((save.secret[w] || 0) >= 3 ? `<div class="seal-secret" title="Nivel secreto con 3 estrellas">${icon('star')}<small>Secreto</small></div>` : '');
// frame: el marco de la tienda (si no se dice, el que usa el jugador).
function postcardHTML(w, stars, cls = '', frame = equipped('frame')) {
  const info = worldInfo(w), b = BIOMES[biomeKey(info.place)], tier = bossChest(stars).tier, pct = Math.round((stars / 30) * 100);
  return `<div class="postcard tier-${tier} fr-${frame} ${cls}" style="--h:${info.hue}">
    <div class="pc-art">${miniPlanet(b.emblem, 'pc-planet')}</div>
    <div class="pc-txt"><small>Postal de</small><b>${esc(info.name)}</b><span>${star(true)}${stars}/30</span></div>
    <div class="stamp"><b>${pct}%</b><small>${TIER[tier]}</small></div>${sealHTML(w)}
  </div>`;
}
// Postal de un evento del mes ganado completo: su último planeta y el año en el sello (para distinguir ediciones).
const EV_HUE = { orange: 30, red: 355, violet: 268, pink: 330, green: 120, blue: 205, gold: 45 };
const evPcPlanet = (x) => EVENT_BIOMES[x.e.key][EVENT_PLANETS - 1];
function evPostcardHTML(x, cls = '', frame = equipped('frame')) {
  return `<div class="postcard tier-oro ev-pc fr-${frame} ${cls}" style="--h:${EV_HUE[x.e.color] ?? 45}">
    <div class="pc-art">${miniPlanet(evPcPlanet(x).emblem, 'pc-planet')}</div>
    <div class="pc-txt"><small>Postal de</small><b>${esc(x.e.name)}</b><span>${icon(x.e.ico)}¡Evento ganado!</span></div>
    <div class="stamp"><b>${x.year}</b><small>Evento</small></div>
  </div>`;
}
function openBossReward(w, res) {
  return new Promise((done) => {
    const ch = res.chest;
    confetti(60);
    const m = openModal({
      title: `¡Mundo ${w + 1} completado!`,
      color: 'gold',
      closable: false,
      cls: 'boss-win',
      body: `${postcardHTML(w, res.worldStars)}
        <div class="chest-row"><div class="chest"><span class="lid">${chestLid()}</span><span class="body">${chestBody()}</span></div></div>`,
      buttons: [{ label: 'Continuar', cls: 'green wide', onClick: done }],
    });
    balloons(m);
    // Los premios son burbujas: salen del cofre y suben despacio (más lento que los globos) por encima de la ventana.
    const layer = document.createElement('div');
    layer.className = 'bubbles';
    m.el.append(layer);
    const bubbles = prizeIcons(ch).map((x) => {
      const b = document.createElement('button');
      b.className = 'loot-bub';
      b.setAttribute('aria-label', 'Tronar burbuja');
      b.innerHTML = `<span class="lb-wob">${x}</span>`;
      b.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        b.getAnimations({ subtree: true }).forEach((a) => a.pause());
        if (popBalloon(b, ['#fff3c4', '#ffc83d'])) sparkle(center(b), 12);
      });
      return b;
    });
    const center = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    const place = () => {
      const r = m.el.querySelector('.chest').getBoundingClientRect(), n = bubbles.length;
      bubbles.forEach((b, i) => {
        b.style.left = `${r.left + r.width / 2 + (i - (n - 1) / 2) * 78}px`;
        b.style.top = `${r.top - 30 - (i % 2) * 18}px`;
        layer.append(b);
      });
      return r;
    };
    if (reduced()) {
      m.el.querySelector('.chest-row').classList.add('open', 'done');
      return place();
    }
    const pc = m.el.querySelector('.postcard'), stamp = m.el.querySelector('.stamp'), chest = m.el.querySelector('.chest');
    pc.animate([{ rotate: '-8deg', scale: 0.7, opacity: 0 }, { rotate: '3deg', scale: 1.04, opacity: 1, offset: 0.7 }, { rotate: '-1.5deg', scale: 1 }], { duration: 620, delay: 150, easing: 'ease-out', fill: 'backwards' });
    stamp.animate([{ scale: 2.6, rotate: '-30deg', opacity: 0 }, { scale: 0.92, rotate: '12deg', opacity: 1, offset: 0.7 }, { scale: 1, rotate: '8deg' }], { duration: 420, delay: 750, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'backwards' });
    setTimeout(async () => {
      await chest.animate([{ rotate: '0deg' }, { rotate: '-8deg' }, { rotate: '7deg' }, { rotate: '-5deg' }, { rotate: '0deg' }], { duration: 520, iterations: 2 }).finished;
      const row = m.el.querySelector('.chest-row');
      row.classList.add('open');
      const r = place(), cx = r.left + r.width / 2, cy = r.top + r.height / 3;
      sparkle({ x: cx, y: cy }, 20);
      // Cada premio sale del cofre con un salto, se mece como burbuja y luego sube despacio hasta salir de la pantalla.
      await Promise.all(bubbles.map((el, i) => {
        const b = center(el), dx = cx - b.x, dy = cy - b.y;
        el.querySelector('.lb-wob').animate([{ translate: '-5px 2px', rotate: '-5deg' }, { translate: '5px -3px', rotate: '5deg' }], { duration: 1600 + i * 300, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        return el.animate([
          { translate: `${dx}px ${dy}px`, scale: 0.3, opacity: 0 },
          { translate: `${dx * 0.4}px -40px`, scale: 1.15, opacity: 1, offset: 0.6 },
          { translate: '0 0', scale: 1, opacity: 1 },
        ], { duration: 640, delay: 120 + i * 240, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)', fill: 'backwards' }).finished.then(() => {
          sparkle(center(el), 10);
          buzz(12);
          if (el.popped) return;
          const drift = (Math.random() - 0.5) * 90, top = el.getBoundingClientRect().top;
          el.animate([{ translate: '0 0' }, { translate: `${drift}px ${-(top + 160)}px` }], { duration: 16000 + i * 2500, delay: 900, easing: 'cubic-bezier(0.4, 0, 0.8, 1)', fill: 'forwards' }).finished.then(() => el.remove(), () => {});
        });
      }));
      row.classList.add('done');
    }, 1300);
  });
}

// Nivel secreto con 3 estrellas: el sello morado cae sobre la postal del mundo.
const SEAL_IN = [{ scale: 2.8, rotate: '20deg', opacity: 0 }, { scale: 0.9, rotate: '-16deg', opacity: 1, offset: 0.7 }, { scale: 1, rotate: '-10deg' }];
function openSecretSeal(w) {
  return new Promise((done) => {
    const m = openModal({
      title: '¡Sello secreto!',
      color: 'violet',
      closable: false,
      cls: 'boss-win',
      body: `${postcardHTML(w, worldStars(w))}
        <p class="lead">Sacaste 3 estrellas en el nivel secreto de <b>${esc(worldInfo(w).name)}</b>. Su postal ahora lleva el sello secreto.</p>`,
      buttons: [{ label: 'Continuar', cls: 'green wide', onClick: done }],
    });
    if (reduced()) return;
    const pc = m.el.querySelector('.postcard'), seal = m.el.querySelector('.seal-secret');
    pc.animate([{ rotate: '-8deg', scale: 0.7, opacity: 0 }, { rotate: '3deg', scale: 1.04, opacity: 1, offset: 0.7 }, { rotate: '-1.5deg', scale: 1 }], { duration: 620, delay: 150, easing: 'ease-out', fill: 'backwards' });
    seal.animate(SEAL_IN, { duration: 460, delay: 900, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'backwards' }).finished.then(() => {
      pc.animate([{ translate: '0 0' }, { translate: '0 5px' }, { translate: '0 0' }], { duration: 220, easing: 'ease-out' });
      const r = seal.getBoundingClientRect();
      sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 18);
      confetti(50);
    });
  });
}

// ---------- Álbum: una postal por cada mundo completado ----------
// ---------- Álbum: postales por constelación ----------
// Postal = jefe vencido. El álbum se abre por constelaciones; cada una muestra sus 10 mundos
// (con postal o hueco vacío) y al tocar una postal se ve el planeta en 3D, que se puede girar y guardar como foto.
const hasCard = (w) => save.next > w * LEVELS_PER_WORLD + LEVELS_PER_WORLD - 1;
function openAlbum() {
  const total = (() => { let n = 0; for (let w = 0; w < WORLD_COUNT && hasCard(w); w++) n++; return n; })();
  const m = openModal({ title: 'Álbum de postales', ico: 'album', color: 'blue', wide: true, cls: 'album-modal', body: '' });
  const body = m.el.querySelector('.mbody'), head = m.el.querySelector('.mhead'), h2 = head.querySelector('h2');
  // Dentro de una constelación: la cabecera dice su nombre y lleva la flecha de regresar a la izquierda.
  const setHead = (title, back) => {
    h2.textContent = title;
    head.querySelector('.hback')?.remove();
    if (back) {
      head.insertAdjacentHTML('afterbegin', `<button class="hback" aria-label="Volver a las constelaciones">${icon('prev')}</button>`);
      head.querySelector('.hback').addEventListener('click', regions);
    }
    if (!reduced()) h2.animate([{ opacity: 0, translate: `${back ? 24 : -24}px 0` }, { opacity: 1, translate: '0 0' }], { duration: 260, easing: 'ease-out' });
  };
  const show = (html) => {
    body.innerHTML = html;
    body.scrollTop = 0;
    if (!reduced()) [...body.querySelectorAll('.vol, .postcard, .album-empty')].slice(0, 12).forEach((el, i) =>
      el.animate([{ opacity: 0, translate: '0 14px', scale: 0.96 }, { opacity: 1, translate: '0 0', scale: 1 }], { duration: 320, delay: i * 45, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }));
  };
  // Vacío de verdad: marcos punteados sin nada, uno flotando con "?" y estrellitas que titilan.
  const empty = () => `<div class="album-empty">
      <div class="ae-stage">
        <div class="ae-frame f1"></div><div class="ae-frame f3"></div><div class="ae-frame f2"><b>?</b></div>
        ${[[8, 20], [40, 110], [70, 6], [168, 4], [205, 96], [226, 30], [120, 132]].map(([x, y], i) => `<i class="tw" style="left:${x}px;top:${y}px;--i:${i}"></i>`).join('')}
      </div>
      <b class="ae-title">Tu álbum está vacío</b>
      <p class="note">Vence al jefe de un mundo para ganar tu primera postal.<br>Entre más estrellas tenga el mundo, mejor sello.</p>
    </div>`;
  // Pestañas Mundos / Eventos: la de eventos sale cuando ya ganó al menos un evento del mes completo.
  const evs = evAlbum();
  const tabs = (t) => (evs.length ? `<div class="tabs" role="tablist"><button role="tab" data-tab="mundos" aria-selected="${t === 'mundos'}">${icon('album')}Mundos</button><button role="tab" data-tab="eventos" aria-selected="${t === 'eventos'}">${icon('trophy')}Eventos</button></div>` : '');
  const events = () => {
    setHead('Álbum de postales', false);
    show(`${tabs('eventos')}<p class="note">Una postal por cada evento que ganaste completo. El sello dice el año.</p>
      <div class="album">${evs.map((x, i) => `<button class="pc-btn" data-ev="${i}">${evPostcardHTML(x, 'mini')}</button>`).join('')}</div>`);
  };
  function regions() {
    const last = regionOf(currentWorld());
    const vols = [];
    for (let r = 0; r <= Math.min(REGION_COUNT - 1, last + 1); r++) {
      const w0 = r * REGION_SIZE;
      let n = 0;
      for (let w = w0; w < w0 + REGION_SIZE; w++) if (hasCard(w)) n++;
      const locked = r > last;
      const stack = Array.from({ length: Math.min(3, Math.max(1, n)) }, (_, k) => `<i style="--h:${worldInfo(w0 + k).hue};--k:${k}" class="${n ? '' : 'none'}"></i>`).join('');
      vols.push(`<button class="vol ${locked ? 'locked' : ''} ${n === REGION_SIZE ? 'full' : ''}" data-r="${r}" ${locked ? 'disabled' : ''}>
        <span class="vstack">${stack}</span>
        <span class="vtxt"><b>${regionName(r)}</b><small>${locked ? `${icon('lock')} Aún no llegas` : `${n} de ${REGION_SIZE} postales`}</small></span>
        <span class="vbar"><i style="width:${(n / REGION_SIZE) * 100}%"></i></span>
      </button>`);
    }
    setHead('Álbum de postales', false);
    show(`${tabs('mundos')}<p class="note">Tienes ${total} postal${total === 1 ? '' : 'es'}. Toca una constelación para verlas.</p><div class="vols">${vols.join('')}</div>`);
  };
  const region = (r) => {
    const w0 = r * REGION_SIZE;
    const cards = [];
    for (let w = w0; w < Math.min(WORLD_COUNT, w0 + REGION_SIZE); w++)
      cards.push(hasCard(w) ? `<button class="pc-btn" data-w="${w}">${postcardHTML(w, worldStars(w), 'mini')}</button>` : `<div class="postcard mini empty"><span>Mundo ${w + 1}</span>${icon('lock')}</div>`);
    setHead(regionName(r), true);
    show(`<div class="album">${cards.join('')}</div>`);
  };
  body.addEventListener('click', (e) => {
    const t = e.target.closest('[data-r], [data-w], [data-ev], [data-tab]');
    if (!t) return;
    if (t.dataset.tab) return t.getAttribute('aria-selected') === 'true' ? null : t.dataset.tab === 'eventos' ? events() : regions();
    if (t.dataset.r != null) return region(+t.dataset.r);
    if (t.dataset.ev != null) return openEvPostcard(evs[+t.dataset.ev]);
    openPostcard(+t.dataset.w);
  });
  if (!total && !evs.length) show(empty());
  else if (!total) events();
  else regions();
}

// Postal en grande: el planeta en 3D para girarlo, su nombre, estrellas y sello. Se guarda como foto.
function openPostcard(w) {
  const info = worldInfo(w), stars = worldStars(w), tier = bossChest(stars).tier, pct = Math.round((stars / 30) * 100);
  return showPostcard({
    name: info.name, hue: info.hue, tier, wd: { w, place: info.place },
    sub: `Mundo ${w + 1} · ${regionName(regionOf(w))}`,
    line: `<span class="pv-stars">${starsHTML(Math.round((stars / 30) * 3))}<em>${stars}/30</em></span>`,
    stamp: [`${pct}%`, TIER[tier]], seal: sealHTML(w),
    photo: { kicker: `POSTAL DE · MUNDO ${w + 1}`, sub: regionName(regionOf(w)), stars, secret: (save.secret[w] || 0) >= 3, file: `postal-mundo-${w + 1}` },
  });
}
// Postal de un evento ganado: su último planeta en 3D y el año en el sello.
function openEvPostcard(x) {
  const B = evPcPlanet(x);
  return showPostcard({
    name: x.e.name, hue: EV_HUE[x.e.color] ?? 45, tier: 'oro', wd: { w: EV_W + EVENT_PLANETS - 1, theme: B.planet },
    sub: `Evento del mes · ${x.year}`,
    line: `<span class="pv-stars">${icon(x.e.ico)}<em>¡Evento ganado!</em></span>`,
    stamp: [x.year, 'Evento'], seal: '',
    photo: { kicker: `POSTAL DE · EVENTO ${x.year}`, sub: x.e.planets[EVENT_PLANETS - 1], stars: null, secret: false, file: `postal-${x.e.key}-${x.year}` },
  });
}
// pc: { name, hue, tier, wd (para PlanetView), sub, line (estrellas o lo que va debajo), stamp: [grande, chico], seal, photo }
async function showPostcard(pc) {
  const frame = equipped('frame');
  let view = null;
  const m = openModal({
    title: esc(pc.name),
    color: 'gold',
    wide: true,
    cls: 'pc-modal',
    onClose: () => view?.dispose(),
    body: `<div class="pc-view tier-${pc.tier} ${frame === 'simple' ? '' : 'framed'}" style="--h:${pc.hue}">
        <div class="postcard pv-deco tier-${pc.tier} fr-${frame}" aria-hidden="true"></div>
        <div class="pv-3d"></div>
        <div class="pv-info">
          <small>${esc(pc.sub)}</small>
          <b>${esc(pc.name)}</b>
          ${pc.line}
          <div class="stamp"><b>${pc.stamp[0]}</b><small>${esc(pc.stamp[1])}</small></div>${pc.seal}
        </div>
      </div>`,
    buttons: [{ label: `${icon('album')} Guardar foto`, cls: 'gold wide', keep: true, onClick: (btn) => view && savePostcard(view, pc, btn) }],
  });
  if (!Galaxy) await loadGalaxy();
  const host = m.el.querySelector('.pv-3d');
  if (!host.isConnected) return;
  view = new PlanetView(host, pc.wd);
  const st = m.el.querySelector('.pc-view .stamp');
  if (!reduced()) {
    host.animate([{ scale: 0.4, opacity: 0, rotate: '-20deg' }, { scale: 1.06, opacity: 1, rotate: '3deg', offset: 0.7 }, { scale: 1, rotate: '0deg' }], { duration: 700, easing: 'ease-out' });
    st.animate([{ scale: 2.6, rotate: '-30deg', opacity: 0 }, { scale: 0.92, rotate: '12deg', opacity: 1, offset: 0.7 }, { scale: 1, rotate: '8deg' }], { duration: 420, delay: 650, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'backwards' });
    m.el.querySelector('.pc-view .seal-secret')?.animate(SEAL_IN, { duration: 420, delay: 950, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'backwards' });
  }
}

// La foto de la postal: un lienzo con el marco, el planeta tal como lo dejaste girado, nombre, estrellas y sello.
async function savePostcard(view, pc, btn) {
  const { stars, kicker, sub, secret, file: fname } = pc.photo, tier = pc.tier;
  const TC = { oro: ['#fff6d6', '#ffc83d', '#e89a17'], plata: ['#f4f6ff', '#c3cbe8', '#6e7ab0'], bronce: ['#fff1e6', '#f0b48a', '#c06a35'], sello: ['#fffaf0', '#e3d3b5', '#7a6f9d'] }[tier];
  await document.fonts?.ready;
  const W = 1080, H = 1350, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const rr = (x, y, w2, h2, r) => { g.beginPath(); g.roundRect(x, y, w2, h2, r); };
  g.fillStyle = '#2a1f5c'; g.fillRect(0, 0, W, H);
  rr(30, 30, W - 60, H - 60, 56); g.fillStyle = TC[0]; g.fill();
  // El marco de postal que tienes puesto (bandas, orilla y adornos), copiado del CSS.
  const deco = await paintFrame(g, equipped('frame'), tier, 30, 30, W - 60, H - 60, 56);
  rr(30, 30, W - 60, H - 60, 56); g.lineWidth = 8; g.strokeStyle = '#2a1f5c'; g.stroke();
  // Ventana del espacio con el planeta.
  const sx = 90, sy = 90, sw = W - 180, sh = 820;
  rr(sx, sy, sw, sh, 36);
  const sky = g.createRadialGradient(W / 2, sy + sh / 2, 60, W / 2, sy + sh / 2, sh * 0.75);
  sky.addColorStop(0, `hsl(${pc.hue} 55% 38%)`); sky.addColorStop(1, '#140c3a');
  g.fillStyle = sky; g.fill(); g.lineWidth = 8; g.strokeStyle = '#2a1f5c'; g.stroke();
  g.save(); rr(sx, sy, sw, sh, 36); g.clip();
  for (let i = 0; i < 70; i++) { const r = (Math.sin(i * 91.7) + 1) / 2, q = (Math.cos(i * 37.3) + 1) / 2; g.fillStyle = `rgba(255,255,255,${0.25 + r * 0.6})`; g.beginPath(); g.arc(sx + r * sw, sy + q * sh, 1.5 + (i % 3), 0, Math.PI * 2); g.fill(); }
  const shot = view.snapshot(), k = Math.min(sw / shot.width, sh / shot.height) * 1.02;
  g.drawImage(shot, W / 2 - (shot.width * k) / 2, sy + sh / 2 - (shot.height * k) / 2, shot.width * k, shot.height * k);
  g.restore();
  // Textos.
  g.fillStyle = '#8a80ad'; g.font = '800 34px "Baloo 2"'; g.textAlign = 'left';
  g.fillText(kicker, 100, 990);
  g.fillStyle = '#2a1f5c'; g.font = '84px "Lilita One"';
  g.fillText(pc.name, 100, 1075, 640);
  g.font = '800 34px "Baloo 2"'; g.fillStyle = '#6d6394';
  g.fillText(sub, 100, 1130, 640);
  // Estrellas.
  const starAt = (x, y, R, on) => {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? R * 0.46 : R; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    g.closePath(); g.fillStyle = on ? '#ffc83d' : '#ddd3bd'; g.fill(); g.lineWidth = 7; g.lineJoin = 'round'; g.strokeStyle = '#2a1f5c'; g.stroke();
  };
  if (stars != null) {
    const n = Math.round((stars / 30) * 3);
    for (let i = 0; i < 3; i++) starAt(130 + i * 82, 1215, 36, i < n);
    g.fillStyle = '#2a1f5c'; g.font = '56px "Lilita One"'; g.fillText(`${stars}/30`, 380, 1236);
  } else {
    starAt(130, 1215, 36, true);
    g.fillStyle = '#2a1f5c'; g.font = '56px "Lilita One"'; g.fillText('¡Evento ganado!', 190, 1236, 420);
  }
  // Sello.
  g.save(); g.translate(870, 1120); g.rotate(0.14);
  g.beginPath(); g.arc(0, 0, 118, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 9; g.strokeStyle = TC[2]; g.setLineDash([16, 10]); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.arc(0, 0, 96, 0, Math.PI * 2); g.lineWidth = 5; g.stroke();
  g.fillStyle = TC[2]; g.textAlign = 'center'; g.font = '64px "Lilita One"'; g.fillText(String(pc.stamp[0]), 0, 14, 190);
  g.font = '900 24px "Baloo 2"'; g.fillText(String(pc.stamp[1]).toUpperCase(), 0, 54, 190);
  g.restore();
  // Sello secreto: el nivel secreto con 3 estrellas.
  if (secret) {
    g.save(); g.translate(690, 1230); g.rotate(-0.17);
    g.beginPath(); g.arc(0, 0, 74, 0, Math.PI * 2); g.fillStyle = '#8a5cf0'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#2a1f5c'; g.stroke();
    g.beginPath(); g.arc(0, 0, 60, 0, Math.PI * 2); g.lineWidth = 4; g.strokeStyle = '#fff'; g.setLineDash([12, 8]); g.stroke(); g.setLineDash([]);
    starAt(0, -12, 30, true);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '900 20px "Baloo 2"'; g.fillText('SECRETO', 0, 42);
    g.restore();
  }
  deco();
  g.fillStyle = '#b3a9cf'; g.font = '800 26px "Baloo 2"'; g.textAlign = 'center'; g.fillText('Solitaire', W / 2, H - 56);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
  const name = `${fname}.png`;
  const file = new File([blob], name, { type: 'image/png' });
  btn.animate([{ scale: 1 }, { scale: 0.94 }, { scale: 1.04 }, { scale: 1 }], { duration: 320, easing: 'ease-out' });
  // En el teléfono se comparte (guardar en fotos, mandar); en la compu se descarga.
  if (navigator.canShare?.({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ files: [file], title: pc.name }); return; } catch { /* canceló: no pasa nada */ return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`${icon('album')} Postal guardada`);
}

// Dibuja en el lienzo el marco de postal tal como lo pinta el CSS: se arma una postal invisible del mismo
// tamaño (a escala) y se copian sus bandas (box-shadow), su línea punteada (outline) y sus capas ::before y
// ::after (imágenes, cintas y orillas con --ring). Así cualquier marco nuevo sale en la foto sin dibujarlo aparte.
// Pinta las bandas ya y devuelve una función que pinta los adornos encima de todo lo demás.
async function paintFrame(g, frame, tier, X, Y, Wc, Hc, R) {
  const k = 3, wd = Wc / k, hd = Hc / k;
  const el = document.createElement('div');
  el.className = `postcard tier-${tier} fr-${frame}`;
  el.style.cssText = `position:fixed;left:-4000px;top:0;width:${wd}px;height:${hd}px;margin:0;padding:0;rotate:none;box-sizing:border-box;display:block`;
  document.body.append(el);
  const cs = getComputedStyle(el), px = (v) => parseFloat(v) || 0, bw = px(cs.borderLeftWidth);
  // Separa una lista del CSS por comas de primer nivel (las imágenes data: llevan comas y paréntesis adentro).
  const split = (v) => {
    const out = [];
    let depth = 0, q = '', cur = '';
    for (const ch of v || '') {
      if (q) { if (ch === q) q = ''; } else if (ch === '"' || ch === "'") q = ch; else if (ch === '(') depth++; else if (ch === ')') depth--; else if (ch === ',' && !depth) { out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  };
  const path = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, r)); };
  // Bandas: box-shadow por dentro (la primera va encima, así que se pintan de la última a la primera).
  const ix = X + bw * k, iy = Y + bw * k, iw = Wc - 2 * bw * k, ih = Hc - 2 * bw * k, ir = R - bw * k;
  for (const sh of split(cs.boxShadow).reverse()) {
    if (!sh.includes('inset')) continue;
    const color = sh.match(/rgba?\([^)]*\)/)?.[0], n = sh.replace(/rgba?\([^)]*\)/, '').match(/-?[\d.]+px/g)?.map(px) || [];
    const s = (n[3] || 0) * k;
    if (!color || !s) continue;
    g.save(); g.beginPath(); g.roundRect(ix, iy, iw, ih, ir); g.roundRect(ix + s, iy + s, iw - 2 * s, ih - 2 * s, Math.max(0, ir - s));
    g.fillStyle = color; g.fill('evenodd'); g.restore();
  }
  // Línea punteada (outline) por dentro.
  if (cs.outlineStyle !== 'none' && px(cs.outlineWidth)) {
    const o = -px(cs.outlineOffset) * k, lw = px(cs.outlineWidth) * k;
    g.save(); path(X + o + lw / 2, Y + o + lw / 2, Wc - 2 * o - lw, Hc - 2 * o - lw, R - o); g.lineWidth = lw; g.strokeStyle = cs.outlineColor;
    if (cs.outlineStyle === 'dashed') g.setLineDash([lw * 3, lw * 2]); g.stroke(); g.restore();
  }
  // Capas ::before y ::after (en orden de z-index).
  const layers = ['::before', '::after'].map((pe, i) => ({ pe, i, s: getComputedStyle(el, pe) })).filter((l) => l.s.content !== 'none' && l.s.content !== 'normal')
    .map((l) => ({ ...l, z: parseInt(l.s.zIndex) || 0 })).sort((a, b) => a.z - b.z || a.i - b.i)
    .map(({ s: live }) => {
      // getComputedStyle está "en vivo": al quitar la postal se vacía, así que se copia lo que se usa.
      const s = { getPropertyValue: () => live.getPropertyValue('--ring') };
      for (const k of ['width', 'height', 'left', 'top', 'right', 'bottom', 'rotate', 'paddingTop', 'borderTopLeftRadius', 'backgroundColor', 'backgroundImage', 'backgroundPositionX', 'backgroundPositionY', 'backgroundSize', 'backgroundRepeat',
        'borderLeftStyle', 'borderLeftWidth', 'borderLeftColor', 'borderRightStyle', 'borderRightWidth', 'borderRightColor']) s[k] = live[k];
      const ringMark = live.getPropertyValue('--ring').trim();
      s.getPropertyValue = () => ringMark;
      const pw = wd - 2 * bw, ph = hd - 2 * bw, auto = (v) => v === 'auto' || v === '';
      const w = !auto(s.width) && px(s.width) ? px(s.width) : pw - px(s.left) - px(s.right), h = !auto(s.height) && px(s.height) ? px(s.height) : ph - px(s.top) - px(s.bottom);
      const x = auto(s.left) ? pw - px(s.right) - w : px(s.left), y = auto(s.top) ? ph - px(s.bottom) - h : px(s.top);
      const urls = split(s.backgroundImage).map((u) => u.match(/^url\(\s*"(.*)"\s*\)$/s)?.[1] || u.match(/^url\((.*)\)$/s)?.[1] || null);
      return { s, x, y, w, h, urls, ring: s.getPropertyValue('--ring').trim() === '1' };
    });
  el.remove();
  const load = (u) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = u; });
  for (const l of layers) l.imgs = await Promise.all(l.urls.map((u) => (u ? load(u) : null)));
  // Posición de una capa de fondo: "0%", "100%", "26px", "calc(100% - 50px)", "right 50px"…
  const pos = (v, room) => {
    v = v.trim();
    let base = 0, off = 0;
    const kw = v.match(/^(left|right|center|top|bottom)\s*(.*)$/);
    if (kw) { base = { left: 0, top: 0, center: 0.5, right: 1, bottom: 1 }[kw[1]]; off = px(kw[2]) * (kw[1] === 'right' || kw[1] === 'bottom' ? -1 : 1); return room * base + off; }
    const pc = v.match(/(-?[\d.]+)%/), p2 = v.match(/([+-])\s*([\d.]+)px/), solo = v.match(/^(-?[\d.]+)px$/);
    if (solo) return px(solo[1]);
    if (pc) base = px(pc[1]) / 100;
    if (p2) off = px(p2[2]) * (p2[1] === '-' ? -1 : 1);
    return room * base + off;
  };
  const drawLayer = (l) => {
    const { s } = l, ox = X + (bw + l.x) * k, oy = Y + (bw + l.y) * k, w = l.w * k, h = l.h * k;
    g.save();
    g.translate(ox + w / 2, oy + h / 2);
    const rot = parseFloat(s.rotate); if (rot) g.rotate((rot * Math.PI) / 180);
    g.translate(-w / 2, -h / 2);
    if (l.ring) { const p = px(s.paddingTop) * k, r = px(s.borderTopLeftRadius) * k; g.beginPath(); g.roundRect(0, 0, w, h, r); g.roundRect(p, p, w - 2 * p, h - 2 * p, Math.max(0, r - p)); g.clip('evenodd'); }
    if (s.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor)) { g.fillStyle = s.backgroundColor; g.fillRect(0, 0, w, h); }
    for (const side of ['Left', 'Right']) if (s[`border${side}Style`] === 'dashed') {
      const bwd = px(s[`border${side}Width`]) * k, x = side === 'Left' ? bwd / 2 : w - bwd / 2;
      g.save(); g.strokeStyle = s[`border${side}Color`]; g.lineWidth = bwd; g.setLineDash([bwd * 2, bwd * 2]); g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); g.restore();
    }
    const sx = split(s.backgroundPositionX), sy = split(s.backgroundPositionY), sz = split(s.backgroundSize), rp = split(s.backgroundRepeat);
    l.imgs.forEach((im, i) => {
      if (!im) return;
      const vb = l.urls[i].match(/viewBox=['"]?[\d.-]+(?:%20|\s)+[\d.-]+(?:%20|\s)+([\d.]+)(?:%20|\s)+([\d.]+)/), asp = vb ? px(vb[1]) / px(vb[2]) : im.naturalWidth / im.naturalHeight || 1;
      const [a, b] = (sz[i] || sz[0] || 'auto').split(/\s+/), dim = (v, full) => (v.endsWith('%') ? (px(v) / 100) * full : px(v) * k);
      let iw2, ih2;
      if (a === 'auto' && b) { ih2 = dim(b, h); iw2 = ih2 * asp; } else if (b && b !== 'auto') { iw2 = dim(a, w); ih2 = dim(b, h); } else if (a !== 'auto') { iw2 = dim(a, w); ih2 = iw2 / asp; } else { iw2 = im.naturalWidth * k; ih2 = im.naturalHeight * k; }
      const rep = rp[i] || rp[0] || 'repeat', toPx = (v, room) => { const q = pos(v, room / k); return q * k + (v.match(/%/) ? 0 : 0); };
      let px0 = toPx(sx[i] || sx[0] || '0%', w - iw2), py0 = toPx(sy[i] || sy[0] || '0%', h - ih2);
      const rx = rep.startsWith('repeat') && !rep.startsWith('repeat no') && rep !== 'repeat-y', ry = rep === 'repeat' || rep === 'repeat repeat' || rep === 'repeat-y';
      if (rx) px0 = (px0 % iw2) - (px0 % iw2 > 0 ? iw2 : 0);
      if (ry) py0 = (py0 % ih2) - (py0 % ih2 > 0 ? ih2 : 0);
      for (let yy = py0; yy < (ry ? h : py0 + 1); yy += ih2) for (let xx = px0; xx < (rx ? w : px0 + 1); xx += iw2) g.drawImage(im, xx, yy, iw2, ih2);
    });
    g.restore();
  };
  // Las orillas (--ring) van con las bandas; los adornos, al final, encima de todo.
  layers.filter((l) => l.ring).forEach(drawLayer);
  return () => layers.filter((l) => !l.ring).forEach(drawLayer);
}

// ---------- Abrir un mundo: boleto dorado + estrellas ----------
function openWorldGate(w, onCancel) {
  const need = starsNeeded(w);
  const have = starsBefore(w);
  const okStars = have >= need;
  const okGold = save.gold > 0;
  const info = worldInfo(w);
  openModal({
    title: `Mundo ${w + 1}`,
    color: 'gold',
    onClose: onCancel,
    body: `<div class="gate">${miniPlanet(BIOMES[biomeKey(info.place)].emblem, 'gate-pl')}<b>${esc(info.name)}</b>
      <div class="rows">
        <div class="row ${okGold ? 'ok' : ''}">${icon('gold')}<b>Boleto dorado<span>Lo da el jefe del mundo anterior</span></b>${okGold ? icon('check') : '<em>0/1</em>'}</div>
        <div class="row ${okStars ? 'ok' : ''}">${star(true)}<b>Estrellas<span>${okStars ? '¡Listo!' : `Te faltan ${need - have}: repite niveles (es gratis)`}</span></b>${okStars ? icon('check') : `<em>${have}/${need}</em>`}</div>
      </div></div>`,
    buttons: [
      {
        label: `${icon('gold')} Abrir`,
        disabled: !(okStars && okGold),
        onClick: () => playUnlock(w),
      },
    ],
  });
}

// ---------- Perfil ----------
// Se abre tocando tu avatar (arriba a la derecha) o desde Ajustes. Dentro del tablero el avatar solo se ve.
function openProfile() {
  const worlds = Math.min(currentWorld(), worldOf(save.next));
  // Postales = jefes vencidos; secretos = niveles secretos ganados; tesoros = todo lo demás que tienes de la tienda y la colección.
  let cards = 0;
  for (let w = 0; w < WORLD_COUNT; w++) cards += hasCard(w) ? 1 : 0;
  const secrets = Object.values(save.secret).filter(Boolean).length;
  const mine = (sec) => ITEMS[sec].filter((it) => owns(sec, it.k)).length;
  const things = SECTIONS.reduce((a, s) => a + (s.k === 'avatar' ? 0 : mine(s.k)), 0);
  const pm = openModal({
    title: 'Perfil',
    color: 'blue',
    wide: true,
    cls: `mr-${equipped('ring')}`,
    body: `<div class="prof">
      <button class="prof-av press" data-a="edit" aria-label="Editar tu jugador" title="Editar tu jugador">${avatarHTML(save, 'huge')}<span class="pen">${icon('pencil')}</span></button>
      <div class="who"><div class="name"><b>${esc(save.name)}</b></div>
        ${titleHTML()}
        <small>Vas en ${levelName(Math.min(save.next, TOTAL_LEVELS - 1))}</small></div>
      <div class="stats">
        <div class="stat">${star(true)}<div><b>${fmt(totalStars())}</b><span>estrellas</span></div></div>
        <div class="stat">${icon('planet')}<div><b>${worlds}</b><span>mundos</span></div></div>
        <div class="stat">${icon('flag')}<div><b>${Math.min(save.next, TOTAL_LEVELS)}</b><span>niveles</span></div></div>
        <div class="stat">${coin()}<div><b>${fmt(save.coins)}</b><span>monedas</span></div></div>
        <div class="stat">${icon('album')}<div><b>${cards}</b><span>postales</span></div></div>
        <div class="stat">${icon('starSecret')}<div><b>${secrets}</b><span>secretos</span></div></div>
        <div class="stat">${icon('user')}<div><b>${mine('avatar')}</b><span>avatares</span></div></div>
        <div class="stat">${icon('bag')}<div><b>${things}</b><span>tesoros</span></div></div>
      </div></div>`,
    buttons: [
      {
        label: 'Reiniciar perfil',
        cls: 'link',
        onClick: () =>
          openModal({
            title: '¿Reiniciar tu perfil?',
            color: 'pink',
            body: '<p class="lead">Se pierde todo: niveles, estrellas, monedas, boletos, comodines y lo comprado en la tienda. Tu nombre se conserva. No se puede deshacer.</p>',
            buttons: [
              { label: 'Cancelar', cls: 'ghost', onClick: openProfile },
              { label: 'Sí, reiniciar', cls: 'pink', onClick: () => (resetProfile(), boot()) },
            ],
          }),
      },
    ],
  });
  document.querySelectorAll('.modal [data-a="edit"]').forEach((b) => (b.onclick = () => {
    document.getElementById('modal-root').replaceChildren();
    editProfile();
  }));
  // Las fichas de datos entran en cascada.
  if (!reduced()) pm.el.querySelectorAll('.stat').forEach((el, i) => el.animate([{ opacity: 0, translate: '0 12px', scale: 0.9 }, { opacity: 1, translate: '0 0', scale: 1 }], { duration: 360, delay: 260 + i * 50, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'backwards' }));
}

// Formulario de jugador (crear o editar): nombre, avatar (inicial o personaje), color, marco, título, viajero,
// fondo del universo y postal. p: { name, avatar, look, char, ring, title, traveler, space, frame } · onSave(p). La ventana toma el estilo del marco elegido.
// first: al crear el jugador solo se elige entre lo gratis (inicial, Nico, Lila; marco sencillo o destello).
function profileForm({ title, p, action, onSave, noCancel = false, first = false }) {
  p = { ...p };
  const mine = (sec) => ITEMS[sec].filter((it) => owns(sec, it.k) && (!first || it.price === 0));
  if (first && p.look === 'char' && !mine('avatar').some((it) => it.k === p.char)) p.look = 'letter';
  if (first && !mine('ring').some((it) => it.k === p.ring)) p.ring = 'sencillo';
  const chars = mine('avatar'), rings = mine('ring'), titles = mine('title'), travs = mine('traveler'), spaces = mine('space'), frames = mine('frame');
  const on = (yes) => (yes ? 'on' : '');
  const lookBtn = (look, k) => `<button data-look="${look}" data-char="${k || ''}" class="${on(p.look === look && (look === 'letter' || p.char === k))}" aria-label="${look === 'letter' ? 'Tu inicial' : item('avatar', k).name}" title="${look === 'letter' ? 'Tu inicial' : item('avatar', k).name}">${avatarHTML({ ...p, look, char: k })}</button>`;
  const shopBtn = (tab, cls, label) => (noCancel ? '' : `<button class="more ${cls}" data-shop="${tab}" aria-label="${label}" title="${label}">${icon('bag')}</button>`);
  // Al crear el jugador, Continuar va hasta abajo (dentro de lo que se desplaza) para que se vea que hay más
  // opciones; la foto se queda fija arriba para ver lo que se va eligiendo.
  const m = openModal({
    title,
    color: 'blue',
    closable: !noCancel,
    cls: `pform ${first ? 'pf-first' : ''} mr-${p.ring}`,
    body: `<div class="avatar-preview">${avatarHTML(p, 'huge')}</div>
      <input class="text-in" maxlength="16" placeholder="Tu nombre" autocomplete="off" autocapitalize="words" enterkeyhint="done" value="${esc(p.name)}">
      <div class="pick-lbl">Avatar</div>
      <div class="look-pick">${lookBtn('letter')}${chars.map((it) => lookBtn('char', it.k)).join('')}${shopBtn('avatar', '', 'Más avatares en la tienda')}</div>
      ${first ? `<div class="pf-more"><div class="pf-locked">${ITEMS.avatar.filter((it) => !owns('avatar', it.k)).slice(0, 5).map((it) => `<span>${avatarHTML({ ...p, look: 'char', char: it.k })}${icon('lock')}</span>`).join('')}</div><small>¡Mientras más juegues, más personajes desbloqueas!</small></div>` : ''}
      <div class="pick-lbl">Color</div>
      <div class="avatar-pick">${AVATAR_COLORS.map((c, i) => `<button data-av="${i}" class="${on(i === p.avatar)}" style="background:${c}" aria-label="Color ${i + 1}"></button>`).join('')}</div>
      ${rings.length > 1 || !noCancel ? `<div class="pick-lbl">Marco</div><div class="look-pick rings">${rings.map((it) => `<button data-ring="${it.k}" class="${on(it.k === p.ring)}" aria-label="${it.name}" title="${it.name}">${avatarHTML({ ...p, ring: it.k })}</button>`).join('')}${shopBtn('ring', '', 'Más marcos en la tienda')}</div>` : ''}
      ${titles.length > 1 ? `<div class="pick-lbl">Título</div><div class="title-pick">${titles.map((it) => titleHTML(it.k, on(it.k === p.title), 'button', `data-title="${it.k}"`)).join('')}</div>` : ''}
      ${noCancel ? '' : `<div class="pick-lbl">Viajero</div><div class="trav-pick">${travs.map((it) => `<button data-trav="${it.k}" class="${on(it.k === p.traveler)}" aria-label="${it.name}" title="${it.name}"><canvas data-kind="${it.k}"></canvas></button>`).join('')}${shopBtn('traveler', '', 'Más viajeros en la tienda')}</div>`}
      ${noCancel ? '' : `<div class="pick-lbl">Fondo del universo</div><div class="space-pick">${spaces.map((it) => `<button data-space="${it.k}" class="${on(it.k === p.space)}" aria-label="${it.name}" title="${it.name}"><div class="space-prev space-${it.k}"><div class="space"></div></div><small>${it.name}</small></button>`).join('')}${shopBtn('space', '', 'Más fondos en la tienda')}</div>
      <div class="pick-lbl">Postal</div><div class="frame-pick">${frames.map((it) => `<button data-frame="${it.k}" class="${on(it.k === p.frame)}" aria-label="${it.name}" title="${it.name}"><div class="frame-prev">${postcardHTML(0, 24, 'mini', it.k)}</div><small>${it.name}</small></button>`).join('')}${shopBtn('frame', '', 'Más postales en la tienda')}</div>`}
      ${first ? `<p class="pf-note">Puedes cambiar tu nombre y avatar <b>cuando quieras</b>.</p><button class="btn green pf-go">${action}</button>` : ''}`,
    buttons: first ? [] : [{ label: action, cls: 'green', onClick: () => onSave({ ...p, name: p.name.trim() }) }],
    onClose: closeShelf,
  });
  const box = document.querySelector('.pform');
  const input = box.querySelector('.text-in');
  if (!noCancel) travShelf(box);
  if (first) {
    // La foto flotante vive en la cabecera (que no se desplaza) y aparece cuando la grande ya no se ve.
    const head = box.querySelector('.mhead'), big = box.querySelector('.avatar-preview');
    head.insertAdjacentHTML('beforeend', `<div class="pf-float">${avatarHTML(p)}</div>`);
    const check = () => box.classList.toggle('floating', big.getBoundingClientRect().top + big.offsetHeight * 0.55 < head.getBoundingClientRect().bottom);
    m.el.addEventListener('scroll', check, true);
  }
  const paint = (pop) => {
    box.querySelector('.avatar-preview').innerHTML = avatarHTML(p, 'huge');
    const fl = box.querySelector('.pf-float');
    if (fl) fl.innerHTML = avatarHTML(p);
    box.querySelectorAll('[data-look]').forEach((b) => (b.innerHTML = avatarHTML({ ...p, look: b.dataset.look, char: b.dataset.char || p.char })));
    box.querySelectorAll('[data-ring]').forEach((b) => (b.innerHTML = avatarHTML({ ...p, ring: b.dataset.ring })));
    box.className = box.className.replace(/\bmr-\S+/, `mr-${p.ring}`);
    if (pop && !reduced()) box.querySelector('.avatar-preview .avatar').animate([{ scale: 0.7, rotate: '-8deg' }, { scale: 1.1, rotate: '4deg', offset: 0.6 }, { scale: 1, rotate: '0deg' }], { duration: 420, easing: 'ease-out' });
  };
  input.addEventListener('input', () => {
    p.name = input.value;
    paint();
  });
  input.addEventListener('keydown', (e) => e.key === 'Enter' && box.querySelector('.mbtns .btn, .pf-go')?.click());
  const pick = (sel, b) => box.querySelectorAll(sel).forEach((x) => x.classList.toggle('on', x === b));
  const bounce = (el) => !reduced() && el.animate([{ scale: 0.8 }, { scale: 1.12, offset: 0.6 }, { scale: 1 }], { duration: 360, easing: 'ease-out' });
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('pf-go')) { m.close(); return onSave({ ...p, name: p.name.trim() }); }
    if (b.dataset.shop) { closeShelf(); document.getElementById('modal-root').replaceChildren(); return openShop(b.dataset.shop); }
    if (b.dataset.look) { p.look = b.dataset.look; if (b.dataset.char) p.char = b.dataset.char; pick('[data-look]', b); paint(true); }
    if (b.dataset.av) { p.avatar = +b.dataset.av; pick('[data-av]', b); paint(true); }
    if (b.dataset.ring) { p.ring = b.dataset.ring; pick('[data-ring]', b); paint(true); }
    if (b.dataset.title) { p.title = b.dataset.title; pick('[data-title]', b); bounce(b); }
    if (b.dataset.trav) { p.traveler = b.dataset.trav; pick('[data-trav]', b); bounce(b); }
    if (b.dataset.space) { p.space = b.dataset.space; pick('[data-space]', b); bounce(b); }
    if (b.dataset.frame) { p.frame = b.dataset.frame; pick('[data-frame]', b); bounce(b); }
  });
  if (matchMedia('(pointer: fine)').matches) input.focus();
}
const playerNow = () => ({ name: save.named ? save.name : '', avatar: save.avatar || 0, look: save.look, char: save.char, ring: equipped('ring'), title: equipped('title'), traveler: equipped('traveler'), space: equipped('space'), frame: equipped('frame') });
const savePlayer = (p, fallback) => {
  renameProfile(p.name || fallback, p.avatar, { look: p.look, char: p.char });
  for (const sec of ['ring', 'title', 'traveler', 'space', 'frame']) if (p[sec]) equip(sec, p[sec]);
  applyLook();
};

// ---------- Primera vez ----------
// 1) Presentación: el logo y 3 escenas que avanzan solas (cartas, mundos, premios); al final, ¡Iniciar!. No se salta.
// 2) Perfil: nombre, avatar y color; Continuar lleva a las constelaciones (y a su recorrido).
// Las dos son obligatorias: save.onboard guarda el paso, así que si cierra el juego vuelve a la misma.
// No tienen vista 3D: al girar el teléfono no se vuelven a dibujar (solo se acomodan).
const LOGO = document.querySelector('#boot .logo')?.outerHTML.replace('<h1', '<div').replace('</h1>', '</div>') || '';
const INTRO_SCENES = [
  {
    ill: () => `<div class="it-ill it-cards">${[[0, 'n', 8, 2], [1, 'n', 9, 3], [2, 'w', 7, 1]].map(([i, kind, r, s]) => `<div class="card up it-c${i} ${kind}">${faceHTML({ rank: r - 1, suit: s })}</div>`).join('')}<b class="it-plus outl p1">+1</b><b class="it-plus outl p2">+1</b></div>`,
    text: 'Junta cartas <b>una arriba o una abajo</b> y limpia la mesa.',
  },
  {
    ill: () => `<div class="it-ill it-worlds"><svg class="it-path" viewBox="0 0 300 110" preserveAspectRatio="none"><path d="M20 80Q90 10 150 60T280 40" /></svg>${Object.values(BIOMES).filter((_, i) => i % 3 === 0).slice(0, 4).map((b, i) => `<span class="it-pl" style="--i:${i};top:${[64, 14, 52, 6][i]}px">${miniPlanet(b.emblem)}</span>`).join('')}<span class="it-rocket">${icon('rocket')}</span></div>`,
    text: 'Viaja por <b>cientos de mundos</b> y abre nuevas constelaciones.',
  },
  {
    ill: () => `<div class="it-ill it-prizes"><div class="rays"></div><span class="it-gift">${icon('gift')}</span>${['coin', 'star', 'rocket', 'calavera', 'wild', 'gema'].map((k, i) => `<span class="it-pz" style="--a:${i * 60 - 90}deg;--d:${700 + i * 120}ms">${k === 'coin' ? coin() : icon(k)}</span>`).join('')}</div>`,
    text: 'Gana <b>premios</b>, rachas y <b>eventos</b> de temporada.',
  },
];
const SCENE_MS = 2700;
// La palabra "Solitaire" con su o normal; el planeta del logo llega y la tumba para quedarse en su lugar.
const LOGO_O = document.querySelector('#boot .logo-o')?.outerHTML || '';
const introLogo = () => `<div class="logo" aria-label="Solitaire">S<span class="it-oslot">${LOGO_O}<b class="it-o">o</b></span>litaire</div>`;
// Mueve un elemento a su nuevo lugar (después de cambiar el acomodo) con animación desde donde estaba.
const flip = (el, change, ms = 650) => {
  const a = el.getBoundingClientRect();
  change();
  const b = el.getBoundingClientRect();
  if (reduced()) return Promise.resolve();
  const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
  return el.animate([{ translate: `${dx}px ${dy}px`, scale: a.width / b.width }, { translate: '0 0', scale: 1 }], { duration: ms, easing: 'cubic-bezier(0.34, 1.3, 0.64, 1)' }).finished;
};
// Corre de principio a fin y no se puede saltar: logo, el planeta tumba la o, sube el logo, 3 escenas,
// baja el logo y sale ¡Iniciar!.
function showIntro() {
  gallery.active = false;
  current = showIntro;
  const el = h(`<div class="screen intro-screen solo">
    <div class="space"></div>
    <div class="it-logo">${introLogo()}</div>
    <div class="it-stage">${INTRO_SCENES.map((sc, i) => `<section class="it-scene" data-i="${i}">${sc.ill()}<p class="it-text">${sc.text}</p></section>`).join('')}</div>
    <button class="go it-start" hidden><span class="t"><b class="outl">¡Iniciar!</b></span></button>
  </div>`);
  mount(el);
  const scenes = [...el.querySelectorAll('.it-scene')], start = el.querySelector('.it-start'), logo = el.querySelector('.it-logo');
  const planet = el.querySelector('.it-oslot .logo-o'), o = el.querySelector('.it-o');
  const alive = () => el.isConnected;
  // Las escenas miden 340×290: se achican lo necesario para caber debajo del logo en cualquier pantalla.
  const stage = el.querySelector('.it-stage');
  const fit = () => {
    if (!alive()) return removeEventListener('resize', fit);
    const cs = getComputedStyle(el), padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom), padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const free = el.clientHeight - padY - logo.offsetHeight - parseFloat(cs.rowGap || 0) - 8;
    stage.style.setProperty('--is', Math.max(0.4, Math.min(1, free / 290, (el.clientWidth - padX) / 340)).toFixed(3));
  };
  fit();
  addEventListener('resize', fit);
  (async () => {
    if (!reduced()) {
      logo.animate([{ scale: 0.3, opacity: 0, rotate: '-8deg' }, { scale: 1.12, opacity: 1, rotate: '3deg', offset: 0.65 }, { scale: 1, rotate: '0deg' }], { duration: 700, easing: 'ease-out' });
      await wait(1000);
      if (!alive()) return;
      // El planeta cae girando desde arriba, choca con la o y la avienta.
      planet.style.opacity = 1;
      planet.animate([{ translate: '1.6em -2.2em', scale: 0.25, rotate: '-260deg' }, { translate: '0 0', scale: 1.15, rotate: '0deg', offset: 0.6 }, { translate: '0 0', scale: 0.92, offset: 0.8 }, { translate: '0 0', scale: 1 }], { duration: 900, easing: 'ease-in' });
      await wait(540);
      if (!alive()) return;
      o.animate([{ translate: '0 0', rotate: '0deg', opacity: 1 }, { translate: '-130% -70%', rotate: '-80deg', opacity: 1, offset: 0.35 }, { translate: '-270% 150%', rotate: '-220deg', opacity: 0 }], { duration: 700, easing: 'ease-in', fill: 'forwards' });
      const r = planet.getBoundingClientRect();
      sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 18);
      buzz(20);
      await wait(1100);
    } else {
      planet.style.opacity = 1;
      o.style.opacity = 0;
    }
    if (!alive()) return;
    // Sube el logo y empiezan las escenas.
    await flip(logo, () => el.classList.remove('solo'));
    for (let i = 0; i < scenes.length; i++) {
      if (!alive()) return;
      scenes.forEach((sc, j) => sc.classList.toggle('on', j === i));
      await wait(SCENE_MS);
    }
    if (!alive()) return;
    // Se van las escenas, baja el logo y sale el botón.
    scenes[scenes.length - 1].classList.remove('on');
    await wait(380);
    if (!alive()) return;
    start.hidden = false;
    flip(logo, () => el.classList.add('end'));
    if (!reduced()) start.animate([{ scale: 0.3, opacity: 0 }, { scale: 1.12, opacity: 1, offset: 0.65 }, { scale: 1 }], { duration: 480, delay: 420, easing: 'ease-out', fill: 'backwards' });
  })();
  start.addEventListener('click', () => {
    save.onboard = 'perfil';
    persist();
    warp(showSignup);
  });
}
function showSignup() {
  gallery.active = false;
  current = showSignup;
  mount(h(`<div class="screen intro-screen signup"><div class="space"></div><div class="it-logo">${LOGO}</div></div>`));
  profileForm({
    title: '¡Crea tu jugador!',
    p: { ...playerNow(), name: '' },
    action: 'Continuar',
    noCancel: true,
    first: true,
    onSave: (p) => {
      savePlayer(p, 'Jugador');
      save.onboard = 'done';
      persist();
      warp(() => showUniverse());
    },
  });
}

function editProfile() {
  profileForm({
    title: 'Tu jugador',
    p: playerNow(),
    action: 'Guardar',
    onSave: (p) => {
      const trav = equipped('traveler');
      savePlayer(p, save.name);
      paintMe();
      if (equipped('traveler') !== trav) current?.();
      openProfile();
    },
  });
}

// ---------- Ajustes ----------
function openSettings(then) {
  const m = openModal({
    title: 'Ajustes',
    ico: 'gear',
    color: 'gray',
    onClose: then,
    body: `<div class="rows">
      <button class="row" data-a="help">${icon('help')}<b>Cómo jugar</b>${icon('chev')}</button>
      ${game ? '' : `<button class="row" data-a="profile">${avatarHTML(save)}<b>Perfil</b>${icon('chev')}</button>`}
      ${game ? '' : `<button class="row" data-a="backup">${icon('backup')}<b>Respaldo<span>Guarda tu avance con un código</span></b>${icon('chev')}</button>`}
      ${installPrompt ? `<button class="row" data-a="install"><img class="ico app-ico" src="icon.svg" alt=""><b>Instalar app<span>Pantalla completa y sin conexión</span></b>${icon('chev')}</button>` : ''}
    </div>`,
  });
  m.el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'help') { m.el.remove(); openHelp('basico', () => openSettings(then)); }
    if (a === 'profile') { m.el.remove(); openProfile(); }
    if (a === 'backup') { m.el.remove(); openBackup(() => openSettings(then)); }
    if (a === 'install') installApp().then((ok) => ok && m.el.remove());
  });
  // Escondido: 5 toques al título prenden o apagan las medidas de pantalla (para revisar el iPhone, aun con la app instalada).
  let taps = 0;
  m.el.querySelector('.mhead h2').addEventListener('click', () => {
    if (++taps < 5) return;
    taps = 0;
    prefs.screenInfo = !prefs.screenInfo;
    persist();
    screenInfo();
    toast(prefs.screenInfo ? 'Medidas de pantalla: sí' : 'Medidas de pantalla: no');
  });
}

// ---------- Medidas de pantalla (diagnóstico) ----------
// Borde rojo = el área que el juego cree que tiene; el texto, lo que dice el navegador. Sirve para ver qué hace iOS.
function screenInfo() {
  document.getElementById('screen-info')?.remove();
  if (!prefs.screenInfo) return;
  const box = document.createElement('div');
  box.id = 'screen-info';
  box.innerHTML = '<pre></pre>';
  document.body.append(box);
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  box.append(probe);
  const paint = () => {
    if (!box.isConnected) return;
    const cs = getComputedStyle(probe), vv = visualViewport, app = document.getElementById('app').getBoundingClientRect();
    const px = (v) => Math.round(parseFloat(v));
    const mode = ['fullscreen', 'standalone', 'minimal-ui', 'browser'].find((d) => matchMedia(`(display-mode: ${d})`).matches);
    box.querySelector('pre').textContent = [
      `ventana   ${innerWidth} × ${innerHeight}`,
      `pantalla  ${screen.width} × ${screen.height}`,
      `visible   ${vv ? `${Math.round(vv.width)} × ${Math.round(vv.height)} (arriba ${Math.round(vv.offsetTop)})` : '—'}`,
      `#app      ${Math.round(app.width)} × ${Math.round(app.height)} (y ${Math.round(app.top)})`,
      `movida    x ${Math.round(scrollX)} y ${Math.round(scrollY)} · zoom ${vv ? vv.scale.toFixed(2) : '—'} · visible desde ${vv ? `${Math.round(vv.offsetLeft)}, ${Math.round(vv.offsetTop)}` : '—'}`,
      `orillas   ↑${px(cs.paddingTop)} →${px(cs.paddingRight)} ↓${px(cs.paddingBottom)} ←${px(cs.paddingLeft)}`,
      `modo      ${mode} · instalada ${navigator.standalone ? 'sí' : 'no'} · giro ${window.orientation ?? screen.orientation?.angle}`,
    ].join('\n');
  };
  paint();
  new ResizeObserver(paint).observe(document.documentElement);
  visualViewport?.addEventListener('resize', paint);
  visualViewport?.addEventListener('scroll', paint);
  addEventListener('scroll', paint, { passive: true });
  addEventListener('orientationchange', () => setTimeout(paint, 400));
}
screenInfo();

// ---------- Respaldo con código ----------
// El avance vive en este navegador: si se borra la app (o Safari lo limpia) se pierde. Con el código se recupera.
function openBackup(then) {
  const m = openModal({
    title: 'Respaldo',
    ico: 'backup',
    color: 'green',
    onClose: then,
    body: `<p class="lead">Copia tu código y guárdalo en tus notas o mándatelo por mensaje. Si borras el juego o lo abres en otro lado, pégalo aquí y recuperas tu avance.</p>
      <textarea class="text-in code-in" rows="3" placeholder="Pega aquí tu código" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>`,
    buttons: [
      { label: 'Cargar código', cls: 'ghost', keep: true, disabled: true, onClick: () => loadBackup(m, then) },
      { label: 'Copiar mi código', cls: 'green', keep: true, onClick: () => copyBackup(m) },
    ],
  });
  // "Cargar código" solo se puede tocar cuando hay algo pegado en la caja.
  const box = m.el.querySelector('.code-in'), load = m.el.querySelector('.mbtns .btn');
  const sync = () => (load.disabled = !box.value.trim());
  box.addEventListener('input', sync);
  m.sync = sync;
}

async function copyBackup(m) {
  const code = await exportCode();
  const box = m.el.querySelector('.code-in');
  try {
    // En el teléfono se abre "Compartir" (Notas, WhatsApp, correo…); en la PC se copia directo.
    if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ title: 'Solitaire · respaldo', text: code });
    else {
      await navigator.clipboard.writeText(code);
      toast(`${icon('check')}¡Código copiado!`);
    }
  } catch (e) {
    if (e?.name === 'AbortError') return; // cerró el menú de compartir
    // Sin portapapeles: el código queda en la caja, seleccionado, para copiarlo a mano.
    box.value = code;
    m.sync?.();
    box.focus();
    box.select();
    toast('Copia el código de la caja');
  }
}

async function loadBackup(m, then) {
  const box = m.el.querySelector('.code-in');
  const p = box.value.trim() && (await readCode(box.value));
  if (!p) {
    toast('Ese código no sirve');
    if (!reduced()) box.animate([{ translate: '0 0' }, { translate: '-8px 0' }, { translate: '7px 0' }, { translate: '-4px 0' }, { translate: '0 0' }], { duration: 340, easing: 'ease-out' });
    box.focus();
    return;
  }
  const stars = Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
  m.el.remove();
  openModal({
    title: '¿Cargar este avance?',
    color: 'pink',
    body: `<p class="lead">El código es de <b>${esc(p.name || 'un jugador')}</b>: va en ${levelName(Math.min(p.next, TOTAL_LEVELS - 1))} con ${fmt(stars)} estrellas. Tu avance actual en este juego se reemplaza.</p>`,
    buttons: [
      { label: 'Cancelar', cls: 'ghost', onClick: () => openBackup(then) },
      {
        label: 'Sí, cargar',
        cls: 'pink',
        onClick: () => {
          loadProfile(p);
          applyLook();
          boot();
          toast(`${icon('check')}¡Avance recuperado!`);
        },
      },
    ],
  });
}

// ---------- Instalar como app ----------
// Chrome (Android y escritorio) avisa cuando se puede instalar; se guarda el aviso y la opción sale en Ajustes.
// En iPhone no existe: se instala desde Compartir → Agregar a inicio.
let installPrompt = null;
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
});
addEventListener('appinstalled', () => (installPrompt = null));
async function installApp() {
  if (!installPrompt) return false;
  installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;
  installPrompt = null;
  return outcome === 'accepted';
}

// ---------- Ayuda ----------
function openHelp(tab = 'basico', then) {
  const body = (t) =>
    t === 'basico'
      ? `<div class="steps">
        <div class="step"><div class="ill">${mini(0, '6', 's')}${mini(37, '7', 'h', {}, 'ring')}${mini(74, '8', 'd')}</div><p>Toca una carta que sea <b>uno más o uno menos</b> que la de tu montón.</p></div>
        <div class="step"><div class="ill">${mini(16, 'K', 'c')}${mini(56, 'A', 'h')}</div><p>La <b>K</b> y el <b>A</b> se conectan.</p></div>
        <div class="step"><div class="ill c">${icon('deck')}</div><p>¿Sin jugada? <b>Toca el mazo</b>. Ojo: tu racha vuelve a cero.</p></div>
        <div class="step"><div class="ill c dots">${'<i></i>'.repeat(6)}</div><p>Racha de <b>6</b>: carta extra. De <b>9</b>: un comodín.</p></div>
        <div class="step"><div class="ill c">${star(true)}${star(true, 'big')}${star(true)}</div><p>Termina con <b>2 cartas</b> de sobra en el mazo y ganas 3 estrellas.</p></div>
      </div>`
      : `<div class="mechs">${Object.keys(MECH_TEXT).map((m) => `<div class="mech"><div class="ill">${mechCard(m)}</div><div><b>${MECH_NAMES[m]}</b><span>${MECH_TEXT[m]}</span></div></div>`).join('')}</div>`;
  const m = openModal({
    title: 'Ayuda',
    ico: 'help',
    color: 'blue',
    wide: true,
    onClose: then,
    body: `<div class="tabs" role="tablist"><button role="tab" data-t="basico" aria-selected="${tab === 'basico'}">${icon('help')}Cómo jugar</button><button role="tab" data-t="cartas" aria-selected="${tab !== 'basico'}">${icon('wild')}Cartas especiales</button></div><div class="tab-body">${body(tab)}</div>`,
  });
  m.el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-t]');
    if (!t) return;
    m.el.querySelectorAll('[data-t]').forEach((b) => b.setAttribute('aria-selected', b === t));
    m.el.querySelector('.tab-body').innerHTML = body(t.dataset.t);
  });
}

// ---------- Pantalla de carga ----------
function setLoad(p, msg) {
  const b = document.getElementById('boot');
  if (!b) return;
  b.style.setProperty('--p', p);
  if (msg) b.querySelector('.boot-msg').textContent = msg;
}
function hideLoader() {
  const b = document.getElementById('boot');
  if (!b) return;
  setLoad(1);
  b.classList.add('done');
  setTimeout(() => b.remove(), 450);
}

// ---------- Arranque ----------
// La primera vez: presentación y perfil (obligatorias). Después siempre empieza en las constelaciones,
// con la que vas al frente: ahí salen los avisos. Una partida a medias se retoma con Continuar.
function boot() {
  if (save.onboard === 'intro') return showIntro();
  if (save.onboard === 'perfil') return showSignup();
  showUniverse();
}

(async () => {
  setLoad(0.15, 'Cargando letras…');
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
  setLoad(0.45, 'Preparando los planetas…');
  try {
    await loadGalaxy();
  } catch (e) {
    console.error(e);
  }
  setLoad(0.85, 'Repartiendo cartas…');
  boot();
  setTimeout(hideLoader, 60);
})();

// Atajo de pruebas: la tecla 0 prende o apaga el modo dev en cualquier pantalla (se quitará al publicar).
window.addEventListener('keydown', (e) => {
  if (e.key !== '0' || e.metaKey || e.ctrlKey || e.target.closest?.('input, textarea')) return;
  setDev(!prefs.dev);
  toast(prefs.dev ? 'Modo dev: lo que hagas es de prueba' : 'Modo dev apagado: tu partida volvió');
  // Solo se muestran u ocultan los botones dev: la pantalla no se vuelve a dibujar.
  document.documentElement.classList.toggle('dev-on', !!prefs.dev);
  // Al apagarlo vuelve tu partida real: se dibuja todo de nuevo.
  if (!prefs.dev) return boot();
  if (game) {
    game.el.querySelector('.dev-bar')?.remove();
    game.attachDev();
  }
});

// Para pruebas automáticas en modo dev: abrir un nivel por número (desde la consola).
window.devPlay = (g) => prefs.dev && startLevel(g, { free: true });
Object.defineProperty(window, 'devGame', { get: () => (prefs.dev ? game : null) });
Object.defineProperty(window, 'devMap', { get: () => (prefs.dev ? map : null) });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
