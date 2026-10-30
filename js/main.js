import { save, prefs, persist, resetProfile, renameProfile } from './storage.js';
import { WORLD_COUNT, LEVELS_PER_WORLD, TOTAL_LEVELS, worldInfo, generateLevel, variantLevel, MECH_INTRO, MECH_NAMES, secretId, isSecret } from './levels.js';
import { Game, faceHTML, backHTML } from './game.js';
import { DAILY_PATH, dailyState, starsNeeded, TICKET_PRICE, ticketCost, coinsFor, bossChest, openSurprise, SECRET_MULT, SECRET_PRIZE } from './economy.js';
import { openModal, toast, updateCoins, esc, reduced, wait, flyToWallet, sparkle, confetti, starsHTML, warp } from './ui.js';
import { icon, star, coin, miniPlanet, avatarHTML, avatarPin, AVATAR_COLORS, cardBackURL, lockIcon, chestBody, chestLid, boxBody, boxLid } from './art.js';
import { BIOMES, biomeKey } from './biomes.js';
import { dev, gallery, initDevFromUrl, attachDevBar, galleryScreen, openDevMenu } from './dev.js';

initDevFromUrl();
document.documentElement.classList.toggle('dev-on', !!prefs.dev);
// Reversos de los premios de racha (carta regalo violeta y comodín dorado), para todo el documento:
// las cartas que vuelan van fuera del tablero.
document.documentElement.style.setProperty('--back', cardBackURL());
document.documentElement.style.setProperty('--back-gift', cardBackURL('regalo'));
document.documentElement.style.setProperty('--back-wild', cardBackURL('comodin'));
// Escala de la interfaz según el lado corto de la pantalla (390 = alto de un teléfono acostado).
const setScale = () => document.documentElement.style.setProperty('--k', Math.max(0.85, Math.min(1.3, Math.min(innerWidth, innerHeight) / 390)).toFixed(3));
setScale();
addEventListener('resize', setScale);

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
const starsBefore = (w) => Object.entries(save.stars).reduce((a, [g, s]) => a + (+g < w * LEVELS_PER_WORLD ? s : 0), 0);
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
const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);
const fmt = (n) => n.toLocaleString('es-MX');

// ---------- Regiones: 10 mundos cada una ----------
const REGION_SIZE = 10;
const REGION_COUNT = Math.ceil(WORLD_COUNT / REGION_SIZE);
const R_A = ['Constelación', 'Nebulosa', 'Cúmulo', 'Galaxia', 'Órbita', 'Cinturón'];
const R_B = ['del Alba', 'de Cristal', 'de las Brisas', 'del Coral', 'de Ámbar', 'del Eco', 'de la Luna', 'de Algodón', 'de la Aurora'];
const regionName = (r) => `${R_A[r % R_A.length]} ${R_B[Math.floor(r / R_A.length) % R_B.length]}`;
const regionOf = (w) => Math.floor(w / REGION_SIZE);

const wallet = () => `
  ${save.gold ? `<div class="pill tb" aria-label="${save.gold} boletos dorados">${icon('gold')}<span>${save.gold}</span></div>` : ''}
  <div class="pill tb" aria-label="Estrellas">${star(true)}<span>${fmt(totalStars())}</span></div>
  <div class="pill tb" aria-label="Boletos">${icon('ticket')}<span data-tickets>${save.tickets}</span></div>
  <div class="pill tb" aria-label="Monedas">${coin()}<span data-coins>${fmt(save.coins)}</span></div>`;
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
    w, place: worldInfo(w).place, state, stars, levels, need: starsNeeded(w), pin: avatarPin(save),
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
      <div class="wtitle tb">${constIcon()}<div><b>${locked ? icon('lock') : ''}${regionName(region)}</b><small>Constelación ${region + 1} de ${REGION_COUNT} · ${star(true)}${regionStars(region)}/${REGION_SIZE * 30}</small></div></div>
      <div class="side r">${sideButtons()}</div>
      <button class="dev-pill" data-a="dev">DEV</button>
    </div>
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
      <div class="wtitle tb">${miniPlanet(b.emblem, 'em')}<div><b>${esc(info.name)}</b><small>Mundo ${w + 1} · ${star(true)}${worldStars(w)}/30</small></div></div>
      ${mech ? `<div class="newmech tb">${mechCard(mech)}<div><b>Aquí aparece: ${MECH_NAMES[mech].toLowerCase()}</b><span>${MECH_TEXT[mech]}</span></div></div>` : ''}`;
    const first = w * LEVELS_PER_WORLD, run = save.run;
    if (run && worldOf(run.g) === w) cta.innerHTML = goBtn('Continuar', isSecret(run.g) ? 'Nivel secreto' : `Nivel ${run.g + 1}`, 'continue');
    else if (save.next >= first && save.next < first + LEVELS_PER_WORLD) cta.innerHTML = goBtn('Jugar', `Nivel ${save.next + 1}`, 'play-next');
    else cta.innerHTML = '<div class="hint-chip">Toca un nivel para repetirlo</div>';
  };
  const paint = () => (galaxy?.mode === 'planet' && galaxy.sel ? paintPlanet(galaxy.sel.wd.w) : paintGalaxyCTA());
  paintGalaxyCTA();
  el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (galaxy?.busy) return; // mientras se anima un avance, no se toca nada
    if (a === 'up') return galaxy && !galaxy.anim && warp(() => showUniverse({ from: region }), { out: true });
    if (sideAction(a)) return;
    if (a === 'out') return galaxy?.zoomOut();
    if (a === 'gate') return openWorldGate(pendingWorld());
    if (a === 'continue') return playNow();
    if (a === 'play-next') return enterLevel(save.next);
  });
  mount(el, anim);
  // Al volver de ganar, el monedero muestra lo de antes y luego se suma con las piezas que vuelan.
  if (after) {
    const c = el.querySelector('[data-coins]'), t = el.querySelector('[data-tickets]');
    if (c) c.textContent = fmt(save.coins - after.res.coins - (after.res.chest?.coins || 0));
    if (t) t.textContent = save.tickets - after.res.tickets;
  }
  const host = el.querySelector('.g3d');
  const make = () => {
    if (!el.isConnected) return;
    const w0 = after?.w;
    galaxy = new Galaxy(host, el.querySelector('.glabels'), {
      worlds: worldsOf(region, unlock ?? pendingWorld()),
      player: save,
      start,
      celebrate: after && !isSecret(after.g) ? { w: w0, i: after.g % LEVELS_PER_WORLD, kind: after.res.first ? 'cur' : 'done', stars: after.res.prev } : null,
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
  if (worldData(a.w).secret.fresh) await revealSecret(galaxy, a.w);
  galaxy.busy = false;
  paint();
  cta.style.opacity = '';
  if (!reduced()) cta.animate([{ scale: 0.4, opacity: 0 }, { scale: 1.08, opacity: 1, offset: 0.6 }, { scale: 1 }], { duration: 420, easing: 'ease-out' });
  // Jefe ganado por primera vez: a la galaxia, a abrir el mundo siguiente (o a decir qué falta).
  if (a.res.chest && a.w + 1 < WORLD_COUNT) {
    await wait(600);
    playUnlock(a.w + 1);
  }
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
  const el = h(`<div class="guide"><div class="g-ring" style="--s:${t.size}px"></div><div class="g-arrow"><svg viewBox="0 0 40 40"><path d="M5 14h15V6l15 14-15 14v-8H5z" fill="#ffc83d" stroke="#2a1f5c" stroke-width="3.5" stroke-linejoin="round"/></svg></div>
    <div class="g-bubble tb"><b>${t.title}</b><span>${t.text}</span></div></div>`);
  screen.append(el);
  const ring = el.querySelector('.g-ring'), arrow = el.querySelector('.g-arrow'), bub = el.querySelector('.g-bubble');
  if (!reduced()) bub.animate([{ opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1.05, offset: 0.7 }, { opacity: 1, scale: 1 }], { duration: 420, easing: 'ease-out' });
  const loop = () => {
    if (!el.isConnected || view.dead) return;
    const p = view.screenOf(t.kind, t.i);
    if (p) {
      const r = view.host.getBoundingClientRect(), x = r.left + p[0], y = r.top + p[1], below = y < innerHeight * 0.5;
      ring.style.left = `${x}px`;
      ring.style.top = arrow.style.top = `${y}px`;
      // La flecha va a un lado del círculo (arriba suele estar el avatar), apuntando hacia él.
      const left = x - t.size / 2 - 48 > 8;
      arrow.style.left = `${left ? x - t.size / 2 - 26 : x + t.size / 2 + 26}px`;
      arrow.classList.toggle('flip', !left);
      bub.style.top = below ? `${Math.min(innerHeight - bub.offsetHeight - 12, y + t.size / 2 + 48)}px` : `${Math.max(12, y - t.size / 2 - 52 - bub.offsetHeight)}px`;
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
    stars += worldStars(w);
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
    <div class="wtitle solo tb">${constIcon()}<div><b>Constelaciones</b><small>${REGION_COUNT} en el universo · ${star(true)}${fmt(totalStars())}</small></div></div>
    <div class="side r">${sideButtons()}</div>
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
  const make = () => {
    if (!el.isConnected) return;
    const regions = Array.from({ length: REGION_COUNT }, (_, r) => regionData(r));
    uni = new Universe(el.querySelector('.g3d'), el.querySelector('.glabels'), {
      regions,
      start: from,
      fromZoom: true,
      pin: avatarPin(save),
      on: { open, relayout: () => current?.() },
    });
    el._dispose = () => uni.dispose();
    if (tourStep() === 'uni') wait(1000).then(() => guide(uni, 'uni', el));
  };
  if (Universe) requestAnimationFrame(make);
  else loadGalaxy().then(make);
}
// Botones de la derecha (los mismos en constelaciones y en mundos).
const sideButtons = () => `${ibtn('gift', 'Regalo diario', 'daily', !dailyState(save.daily).claimed)}${ibtn('bag', 'Tienda', 'shop')}${ibtn('album', 'Álbum de postales', 'album')}${ibtn('gear', 'Ajustes', 'settings')}`;
function sideAction(a) {
  const act = { shop: openShop, daily: openDaily, album: openAlbum, settings: openSettings, dev: () => openDevMenu({ onGallery: () => showGallery(save.next), onRefresh: boot }) }[a];
  act?.();
  return !!act;
}
const regionStars = (r) => {
  let n = 0;
  for (let w = r * REGION_SIZE; w < (r + 1) * REGION_SIZE; w++) n += worldStars(w);
  return n;
};
// Icono de constelación: tres estrellas unidas.
const constIcon = () => `<svg class="ico em" viewBox="0 0 32 32"><path d="M6 22 14 9l12 6" fill="none" stroke="#c9bff0" stroke-width="2.4" stroke-linecap="round"/>${[[6, 22, 4.6], [14, 9, 3.8], [26, 15, 4.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffc83d" stroke="#2a1f5c" stroke-width="2.2"/>`).join('')}</svg>`;
const ibtn = (k, label, act, dot) => `<button class="iconbtn tb press" data-a="${act}" aria-label="${label}" title="${label}">${icon(k)}${dot ? '<span class="dot"></span>' : ''}</button>`;
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
function spendTickets(cost) {
  const label = document.querySelector('#app [data-tickets]');
  const from = label?.closest('.pill')?.querySelector('.ico')?.getBoundingClientRect();
  if (!from || reduced()) return Promise.resolve(updateCoins());
  let shown = save.tickets + cost;
  label.textContent = shown;
  const fx = from.left + from.width / 2, fy = from.top + from.height / 2;
  const runs = [];
  for (let k = 0; k < cost; k++) {
    const tx = innerWidth / 2 + (k - (cost - 1) / 2) * 96, ty = innerHeight / 2;
    const f = document.createElement('div');
    f.className = 'fly-ticket';
    f.innerHTML = icon('ticket');
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
            half.innerHTML = icon('ticket');
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

function enterLevel(g) {
  if (worldOf(g) > save.open && !dev.infinite) return openWorldGate(worldOf(g));
  const run = save.run;
  if (run && run.g === g) return startLevel(g, { resume: true });
  if (run) {
    return openModal({
      title: 'Nivel a medias',
      color: 'orange',
      body: `<p class="lead"><b>${levelName(run.g)}</b> sigue en juego. Termínalo, o abandónalo y pierdes su boleto.</p>`,
      buttons: [
        {
          label: 'Abandonar y jugar este',
          cls: 'ghost',
          onClick: () => {
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
      <p class="note">Ganar un nivel por primera vez regala 1 boleto. Repetir niveles ganados es gratis.</p>`,
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
    // Tras la ventana de victoria: de vuelta al planeta, con el avance animado (o a la galería en dev).
    onDone: (res) => {
      if (dev.on && gallery.active) return showGallery();
      const w = worldOf(g);
      const go = () => showMap({ start: w, anim: 'down', after: res.counted ? { g, w, res } : null });
      if (res.chest) return openBossReward(w, res).then(go);
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
        save.secret[w] = Math.max(prev, stars);
        save.coins += coins;
        save.wild += wild;
        save.undo += undo;
        persist();
        updateCoins();
        return { coins, tickets: 0, prev, wild, undo, counted: true, first: !prev };
      }
      // En modo dev se puede saltar a cualquier nivel: solo cuenta si ya estaba desbloqueado.
      if (g > save.next) return { coins: 0, tickets: 0, prev: 0 };
      const prev = save.stars[g] || 0;
      const coins = coinsFor(g, stars, prev);
      // El boleto de regalo es solo la primera vez que se gana el nivel.
      const tickets = prev ? 0 : 1;
      // El jefe da el boleto dorado para abrir el mundo siguiente (solo la primera vez).
      const gold = !prev && level.boss && w + 1 < WORLD_COUNT ? 1 : 0;
      save.stars[g] = Math.max(prev, stars);
      save.coins += coins;
      save.tickets += tickets;
      save.gold += gold;
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
      persist();
      updateCoins();
      return { coins, tickets, prev, gold, chest, worldStars: worldStars(w), counted: true, first: !prev };
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
  if (start != null) gallery.start = Math.max(0, start - (start % 24));
  mount(galleryScreen({ onPlay: (g) => startLevel(g, save.run?.g === g ? { resume: true, anim: null } : { free: true, anim: null }), onBack: () => showMap() }));
}

// ---------- Tienda ----------
// La tienda de verdad (barajas, avatares y marcos) llega en la Fase 5.
function openShop() {
  openModal({
    title: 'Tienda',
    ico: 'bag',
    color: 'orange',
    body: `<div class="soon"><div class="card down" style="--back:${cardBackURL()}"></div><p class="lead">Muy pronto: barajas, avatares y marcos para tu perfil.</p></div>`,
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
    body: `${st.reset ? '<p class="note">Se rompió tu racha: vuelves al día 1.</p>' : ''}<div class="daily"><div class="dgrid">${days}</div>${seven}</div>
      <p class="note">Entra cada día: el día 7 abres una caja sorpresa. Si un día faltas, vuelves al inicio.</p>`,
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
          await wait(450);
          const r = cell.getBoundingClientRect();
          m.close();
          grantPrize(p, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
        },
      },
    ],
  });
}

// ---------- Jefe vencido: postal del mundo (según sus estrellas) y cofre ----------
const TIER = { oro: '¡Perfecto!', plata: '¡Excelente!', bronce: '¡Muy bien!', sello: '¡Completado!' };
function postcardHTML(w, stars, cls = '') {
  const info = worldInfo(w), b = BIOMES[biomeKey(info.place)], tier = bossChest(stars).tier, pct = Math.round((stars / 30) * 100);
  return `<div class="postcard tier-${tier} ${cls}" style="--h:${info.hue}">
    <div class="pc-art">${miniPlanet(b.emblem, 'pc-planet')}</div>
    <div class="pc-txt"><small>Postal de</small><b>${esc(info.name)}</b><span>${star(true)}${stars}/30</span></div>
    <div class="stamp"><b>${pct}%</b><small>${TIER[tier]}</small></div>
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
        <div class="chest-row"><div class="chest"><span class="lid">${chestLid()}</span><span class="body">${chestBody()}</span></div><div class="loot">${lootHTML(ch)}</div></div>`,
      buttons: [{ label: 'Continuar', cls: 'green wide', onClick: done }],
    });
    if (reduced()) return m.el.querySelector('.chest-row').classList.add('open');
    const pc = m.el.querySelector('.postcard'), stamp = m.el.querySelector('.stamp'), chest = m.el.querySelector('.chest');
    pc.animate([{ rotate: '-8deg', scale: 0.7, opacity: 0 }, { rotate: '3deg', scale: 1.04, opacity: 1, offset: 0.7 }, { rotate: '-1.5deg', scale: 1 }], { duration: 620, delay: 150, easing: 'ease-out', fill: 'backwards' });
    stamp.animate([{ scale: 2.6, rotate: '-30deg', opacity: 0 }, { scale: 0.92, rotate: '12deg', opacity: 1, offset: 0.7 }, { scale: 1, rotate: '8deg' }], { duration: 420, delay: 750, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'backwards' });
    setTimeout(async () => {
      await chest.animate([{ rotate: '0deg' }, { rotate: '-8deg' }, { rotate: '7deg' }, { rotate: '-5deg' }, { rotate: '0deg' }], { duration: 520, iterations: 2 }).finished;
      m.el.querySelector('.chest-row').classList.add('open');
      const r = chest.getBoundingClientRect();
      sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 3 }, 20);
    }, 1300);
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
    head.querySelector('.ico')?.classList.toggle('hidden', back);
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
    show(`<p class="note">Tienes ${total} postal${total === 1 ? '' : 'es'}. Toca una constelación para verlas.</p><div class="vols">${vols.join('')}</div>`);
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
    const t = e.target.closest('[data-r], [data-w]');
    if (!t) return;
    if (t.dataset.r != null) return region(+t.dataset.r);
    openPostcard(+t.dataset.w);
  });
  if (!total) show(empty());
  else regions();
}

// Postal en grande: el planeta en 3D para girarlo, su nombre, estrellas y sello. Se guarda como foto.
async function openPostcard(w) {
  const info = worldInfo(w), stars = worldStars(w), tier = bossChest(stars).tier, pct = Math.round((stars / 30) * 100);
  let view = null;
  const m = openModal({
    title: esc(info.name),
    color: 'gold',
    wide: true,
    cls: 'pc-modal',
    onClose: () => view?.dispose(),
    body: `<div class="pc-view tier-${tier}" style="--h:${info.hue}">
        <div class="pv-3d"><span class="pv-hint">${icon('prev')} Arrastra para girar ${icon('next')}</span></div>
        <div class="pv-info">
          <small>Mundo ${w + 1} · ${regionName(regionOf(w))}</small>
          <b>${esc(info.name)}</b>
          <span class="pv-stars">${starsHTML(Math.round((stars / 30) * 3))}<em>${stars}/30</em></span>
          <div class="stamp"><b>${pct}%</b><small>${TIER[tier]}</small></div>
        </div>
      </div>`,
    buttons: [{ label: `${icon('album')} Guardar foto`, cls: 'gold wide', keep: true, onClick: (btn) => view && savePostcard(view, w, btn) }],
  });
  if (!Galaxy) await loadGalaxy();
  const host = m.el.querySelector('.pv-3d');
  if (!host.isConnected) return;
  view = new PlanetView(host, { w, place: info.place });
  const st = m.el.querySelector('.pc-view .stamp');
  if (!reduced()) {
    host.animate([{ scale: 0.4, opacity: 0, rotate: '-20deg' }, { scale: 1.06, opacity: 1, rotate: '3deg', offset: 0.7 }, { scale: 1, rotate: '0deg' }], { duration: 700, easing: 'ease-out' });
    st.animate([{ scale: 2.6, rotate: '-30deg', opacity: 0 }, { scale: 0.92, rotate: '12deg', opacity: 1, offset: 0.7 }, { scale: 1, rotate: '8deg' }], { duration: 420, delay: 650, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'backwards' });
  }
}

// La foto de la postal: un lienzo con el marco, el planeta tal como lo dejaste girado, nombre, estrellas y sello.
async function savePostcard(view, w, btn) {
  const info = worldInfo(w), stars = worldStars(w), tier = bossChest(stars).tier, pct = Math.round((stars / 30) * 100);
  const TC = { oro: ['#fff6d6', '#ffc83d', '#e89a17'], plata: ['#f4f6ff', '#c3cbe8', '#6e7ab0'], bronce: ['#fff1e6', '#f0b48a', '#c06a35'], sello: ['#fffaf0', '#e3d3b5', '#7a6f9d'] }[tier];
  await document.fonts?.ready;
  const W = 1080, H = 1350, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const rr = (x, y, w2, h2, r) => { g.beginPath(); g.roundRect(x, y, w2, h2, r); };
  g.fillStyle = '#2a1f5c'; g.fillRect(0, 0, W, H);
  rr(30, 30, W - 60, H - 60, 56); g.fillStyle = TC[0]; g.fill(); g.lineWidth = 10; g.strokeStyle = TC[1]; g.stroke();
  // Ventana del espacio con el planeta.
  const sx = 90, sy = 90, sw = W - 180, sh = 820;
  rr(sx, sy, sw, sh, 36);
  const sky = g.createRadialGradient(W / 2, sy + sh / 2, 60, W / 2, sy + sh / 2, sh * 0.75);
  sky.addColorStop(0, `hsl(${info.hue} 55% 38%)`); sky.addColorStop(1, '#140c3a');
  g.fillStyle = sky; g.fill(); g.lineWidth = 8; g.strokeStyle = '#2a1f5c'; g.stroke();
  g.save(); rr(sx, sy, sw, sh, 36); g.clip();
  for (let i = 0; i < 70; i++) { const r = (Math.sin(i * 91.7) + 1) / 2, q = (Math.cos(i * 37.3) + 1) / 2; g.fillStyle = `rgba(255,255,255,${0.25 + r * 0.6})`; g.beginPath(); g.arc(sx + r * sw, sy + q * sh, 1.5 + (i % 3), 0, Math.PI * 2); g.fill(); }
  const shot = view.snapshot(), k = Math.min(sw / shot.width, sh / shot.height) * 1.02;
  g.drawImage(shot, W / 2 - (shot.width * k) / 2, sy + sh / 2 - (shot.height * k) / 2, shot.width * k, shot.height * k);
  g.restore();
  // Textos.
  g.fillStyle = '#8a80ad'; g.font = '800 34px "Baloo 2"'; g.textAlign = 'left';
  g.fillText(`POSTAL DE · MUNDO ${w + 1}`, 100, 990);
  g.fillStyle = '#2a1f5c'; g.font = '84px "Lilita One"';
  g.fillText(info.name, 100, 1075, 640);
  g.font = '800 34px "Baloo 2"'; g.fillStyle = '#6d6394';
  g.fillText(regionName(regionOf(w)), 100, 1130, 640);
  // Estrellas.
  const starAt = (x, y, R, on) => {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? R * 0.46 : R; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    g.closePath(); g.fillStyle = on ? '#ffc83d' : '#ddd3bd'; g.fill(); g.lineWidth = 7; g.lineJoin = 'round'; g.strokeStyle = '#2a1f5c'; g.stroke();
  };
  const n = Math.round((stars / 30) * 3);
  for (let i = 0; i < 3; i++) starAt(130 + i * 82, 1215, 36, i < n);
  g.fillStyle = '#2a1f5c'; g.font = '56px "Lilita One"'; g.fillText(`${stars}/30`, 380, 1236);
  // Sello.
  g.save(); g.translate(870, 1120); g.rotate(0.14);
  g.beginPath(); g.arc(0, 0, 118, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 9; g.strokeStyle = TC[2]; g.setLineDash([16, 10]); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.arc(0, 0, 96, 0, Math.PI * 2); g.lineWidth = 5; g.stroke();
  g.fillStyle = TC[2]; g.textAlign = 'center'; g.font = '64px "Lilita One"'; g.fillText(`${pct}%`, 0, 14);
  g.font = '900 24px "Baloo 2"'; g.fillText(TIER[tier].toUpperCase(), 0, 54);
  g.restore();
  g.fillStyle = '#b3a9cf'; g.font = '800 26px "Baloo 2"'; g.textAlign = 'center'; g.fillText('Solitario de los Mundos', W / 2, H - 56);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
  const name = `postal-mundo-${w + 1}.png`;
  const file = new File([blob], name, { type: 'image/png' });
  btn.animate([{ scale: 1 }, { scale: 0.94 }, { scale: 1.04 }, { scale: 1 }], { duration: 320, easing: 'ease-out' });
  // En el teléfono se comparte (guardar en fotos, mandar); en la compu se descarga.
  if (navigator.canShare?.({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ files: [file], title: info.name }); return; } catch { /* canceló: no pasa nada */ return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`${icon('album')} Postal guardada`);
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
function openProfile() {
  const worlds = Math.min(currentWorld(), worldOf(save.next));
  openModal({
    title: 'Perfil',
    color: 'blue',
    wide: true,
    body: `<div class="prof">
      ${avatarHTML(save, 'huge')}
      <div class="who"><div class="name"><b>${esc(save.name)}</b><button class="btn ghost sq" data-a="edit" aria-label="Cambiar nombre y color" title="Cambiar nombre y color">${icon('pencil')}</button></div>
        <small>Vas en ${levelName(Math.min(save.next, TOTAL_LEVELS - 1))}</small></div>
      <div class="stats">
        <div class="stat">${star(true)}<div><b>${fmt(totalStars())}</b><span>estrellas</span></div></div>
        <div class="stat">${icon('planet')}<div><b>${worlds}</b><span>mundos</span></div></div>
        <div class="stat">${icon('flag')}<div><b>${Math.min(save.next, TOTAL_LEVELS)}</b><span>niveles</span></div></div>
        <div class="stat">${coin()}<div><b>${fmt(save.coins)}</b><span>monedas</span></div></div>
      </div></div>`,
    buttons: [
      {
        label: 'Reiniciar perfil',
        cls: 'link',
        onClick: () =>
          openModal({
            title: '¿Reiniciar tu perfil?',
            color: 'pink',
            body: '<p class="lead">Se pierde todo: niveles, estrellas, monedas, boletos y comodines. Tu nombre se conserva. No se puede deshacer.</p>',
            buttons: [
              { label: 'Cancelar', cls: 'ghost', onClick: openProfile },
              { label: 'Sí, reiniciar', cls: 'pink', onClick: () => (resetProfile(), boot()) },
            ],
          }),
      },
    ],
  });
  document.querySelector('.modal [data-a="edit"]').onclick = () => {
    document.getElementById('modal-root').replaceChildren();
    editProfile();
  };
}

// Formulario de jugador (crear o editar): nombre y color del avatar.
function profileForm({ title, name = '', avatar = 0, action, onSave, noCancel = false }) {
  openModal({
    title,
    color: 'blue',
    closable: !noCancel,
    body: `<div class="avatar-preview">${avatarHTML({ name, avatar }, 'huge')}</div>
      <input class="text-in" maxlength="16" placeholder="Tu nombre" autocomplete="off" autocapitalize="words" enterkeyhint="done" value="${esc(name)}">
      <div class="avatar-pick">${AVATAR_COLORS.map((c, i) => `<button data-av="${i}" class="${i === avatar ? 'on' : ''}" style="background:${c}" aria-label="Color ${i + 1}"></button>`).join('')}</div>`,
    buttons: [{ label: action, cls: 'green', onClick: () => onSave(name.trim(), avatar) }],
  });
  const input = document.querySelector('.text-in');
  const paint = () => (document.querySelector('.avatar-preview').innerHTML = avatarHTML({ name, avatar }, 'huge'));
  input.addEventListener('input', () => {
    name = input.value;
    paint();
  });
  input.addEventListener('keydown', (e) => e.key === 'Enter' && document.querySelector('.modal .mbtns .btn')?.click());
  document.querySelector('.avatar-pick').addEventListener('click', (e) => {
    const b = e.target.closest('[data-av]');
    if (!b) return;
    avatar = +b.dataset.av;
    document.querySelectorAll('.avatar-pick button').forEach((x) => x.classList.toggle('on', x === b));
    paint();
  });
  if (matchMedia('(pointer: fine)').matches) input.focus();
}

// Primera vez: pedir nombre y color (no se puede cerrar sin elegir).
function welcome() {
  profileForm({
    title: '¡Bienvenido!',
    action: 'Empezar',
    noCancel: true,
    onSave: (name, avatar) => {
      renameProfile(name || 'Jugador', avatar);
      showUniverse();
    },
  });
}

function editProfile() {
  profileForm({
    title: 'Tu jugador',
    name: save.named ? save.name : '',
    avatar: save.avatar || 0,
    action: 'Guardar',
    onSave: (name, avatar) => {
      renameProfile(name || save.name, avatar);
      current?.();
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
    </div>`,
  });
  m.el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'help') { m.el.remove(); openHelp('basico', () => openSettings(then)); }
    if (a === 'profile') { m.el.remove(); openProfile(); }
  });
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
// Si quedó un nivel a medias (se cerró la ventana o se salió), se vuelve directo a él.
function boot() {
  if (save.run) return startLevel(save.run.g, { resume: true, anim: null });
  // La app empieza en las constelaciones (la vista de más afuera).
  showUniverse();
  if (!save.named) welcome();
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
  prefs.dev = !prefs.dev;
  persist();
  toast(`Modo dev ${prefs.dev ? 'activado' : 'desactivado'}`);
  // Solo se muestran u ocultan los botones dev: la pantalla no se vuelve a dibujar.
  document.documentElement.classList.toggle('dev-on', !!prefs.dev);
  if (game) {
    game.el.querySelector('.dev-bar')?.remove();
    if (prefs.dev) game.attachDev();
  } else if (!prefs.dev && gallery.active) showMap();
});

// Para pruebas automáticas en modo dev: abrir un nivel por número (desde la consola).
window.devPlay = (g) => prefs.dev && startLevel(g, { free: true });
Object.defineProperty(window, 'devGame', { get: () => (prefs.dev ? game : null) });
Object.defineProperty(window, 'devMap', { get: () => (prefs.dev ? map : null) });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
