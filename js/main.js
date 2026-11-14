import { save, prefs, persist, resetProfile, deleteProfile, renameProfile, exportCode, readCode, loadProfile, setDev } from './storage.js';
import { UNLOCK, EVENTS, FESTIVALS, COLLECTIONS, evSoon, isOn, nextEvent, daysToNextCol, plusCols, STREAK_GOALS, STREAK_STEP, streakGoal, nextIndex, dailyStreak, streakTheme, streakReady, streakHot, streakWin, streakLose, streakPendToFeats, msToMidnight, col, colLeft, colWin, colOffers, colBuy, ev, evLeft, evTicketLeft, evTicketPrice, evBuyTicket, evPrize, evEnter, evWin, evLose, evAlbum, festAlbum, EVENT_PLANETS, EVENT_PER_PLANET, EVENT_LEVELS, festival, festivalLeft, festivalSoon, soonLeft, evPrePrice, evPreOwned, evPreBuy, nextFestival, festEnter, festWin, festLose, festShape, festPrice, festPaid, festBuy, festPre, FEST_PRE, FEST_ENTRY, EV_FIRST } from './events.js';
import { WORLD_COUNT, LEVELS_PER_WORLD, TOTAL_LEVELS, worldInfo, generateLevel, variantLevel, MECH_INTRO, MECH_NAMES, MECHANICS, EXTRA, extraDebut, SCROLL_FROM, tideFirst, holeFirst, doorsFirst, bandaFirst, rocksFirst, secretId, isSecret, eventLevel, festivalLevel } from './levels.js';
import { Game, faceHTML, backHTML, TIPS, TABLE_TEXT, MECH_KINDS, ART, scrSVG } from './game.js';
import { maxBet, betFee, betSteps, BET_STEPS, HELPS, DAILY_PATH, dailyState, dailyPieces, DAILY_SHIELD_MAX, starsNeeded, TICKET_PRICE, ticketCost, ticketRefund, coinsFor, bossChest, rollChest, CONST_PRIZE, CONST_OPEN, openCost, constStart, openFree, boosted, secretCoins, rollSecret, openSurprise, MET_OFF, metShopPrice } from './economy.js';
import { track, missions, missionDef, missionDone, missionsAllDone, autoClaim, ACHIEVEMENTS, ACHIEVEMENT_PRIZES, ACHIEVEMENT_MEDAL, ACHIEVEMENT_TOP, achievementGot, achievementProgress, achievementsVisible } from './missions.js';
import { pauseOffscreen, openModal, toast, updateCoins, money, esc, reduced, wait, flyToWallet, spendFromWallet, sparkle, confetti, starsHTML, warp, buzz, balloons, lootBubbles, floatBubbles, streakWarnHTML, popPrize, popBalloon, countPop, HEADS, betLoseHTML, shownCoins } from './ui.js';
import { icon, iconURL, iconInner, star, coin, miniPlanet, avatarHTML, AVATAR_COLORS, kidOf, KID_SKINS, KID_HAIRS, KID_STYLES, cardBackURL, setDeck, lockIcon, curtainIcon, chestBody, chestLid, boxBody, boxLid, capChute, capBody, capLid, vineSVG } from './art.js';
import { GROUPS, SECTIONS, ITEMS, shopItems, groupOf, owns, equipped, equip, buy, item, lockedUntil, titleHTML, titleIcon, sell, sellable, sellPrice } from './shop.js';
import { BIOMES, biomeKey, EVENT_BIOMES, tableHTML } from './biomes.js';
import { redeem } from './codes.js';
import { meteor, metWin, metCoins, helpOff, MET_FROM, STAR_FROM, SHOWERS, NEW_RAINS } from './meteor.js';
import { rainCSS } from './rains.js';
import { dev, gallery, attachDevBar, galleryScreen, openDevMenu, planetGal, planetsScreen, casualRate, rateTag, tableIcon } from './dev.js';
import { themeCSS } from './themes.js';
import { setCSS, SETS, setOf, setItems, SET_DEAL } from './sets.js';
import { festivalCSS } from './festival-art.js';
import { mulberry32, hash } from './rng.js';
import { starCSS } from './starshower.js';
import { PASS_MAX, secretGoal, passFrameOf, passGoal, passPrize, secretPrize, passCount, secretCount, passCSS } from './passport.js';
// Caras, fondos y marcos de las temáticas de la tienda (themes.js): su CSS se arma de su paleta.
document.head.append(Object.assign(document.createElement('style'), { textContent: themeCSS(iconURL) + setCSS(iconURL, iconInner) + festivalCSS(FESTIVALS, iconInner) + passCSS(iconInner) + starCSS(iconInner) + rainCSS(iconInner) + `.go.met.sh-star::before { background-image: ${iconURL('starFall', 1)}; }` }));

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
document.documentElement.style.setProperty('--back-help', cardBackURL('ayudas'));
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
// 8 nov 2026: al girar con una ventana abierta, iPhone a veces la deja dibujada donde estaba (fuera de la vista, "en el
// limbo"). Se termina su entrada y se obliga a dibujarla de nuevo en su lugar.
const refloat = () => document.querySelectorAll('#modal-root .modal-back').forEach((b) => {
  const m = b.querySelector('.modal');
  [...b.getAnimations(), ...(m?.getAnimations() || [])].forEach((a) => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity && a.finish());
  b.style.display = 'none';
  void b.offsetHeight;
  b.style.display = '';
  if (m) m.scrollTop = 0;
});
addEventListener('orientationchange', () => [0, 150, 400, 800].forEach((t) => setTimeout(() => (pin(), setSafe(), t >= 400 && refloat()), t)));
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
// Girar el teléfono vuelve a armar el mapa 3D (parado y acostado se acomodan distinto): las ventanas abiertas se
// quedan (8 nov 2026: antes se borraban y la del evento terminado se perdía).
// Las escenas encima del mapa con .keep-turn (la nave de rescate) también se quedan: pasan a la pantalla nueva y
// reciben 'remount' para acomodarse (12 nov 2026: antes al girar se borraba y empezaba otra desde cero).
let keepModals = false;
function remount() {
  keepModals = true;
  const keep = [...document.querySelectorAll('#app .screen .keep-turn')];
  keep.forEach((e) => e.remove());
  try {
    current?.();
  } finally {
    keepModals = false;
  }
  const scr = document.querySelector('#app .screen');
  if (scr) for (const e of keep) scr.append(e), e.dispatchEvent(new Event('remount'));
}
function mount(el, anim) {
  game?.destroy();
  game = null;
  if (!keepModals) document.getElementById('modal-root').replaceChildren();
  if (el) initGroups(el);
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
  ${save.cgold ? `<div class="pill info" aria-label="${save.cgold} boletos de constelación">${icon('constTicket')}<span>${save.cgold}</span></div>` : ''}
  <div class="pill info" aria-label="Estrellas">${star(true)}<span>${fmt(totalStars())}</span></div>
  <div class="pill info" aria-label="Boletos">${icon('ticket')}<span data-tickets>${save.tickets}</span></div>
  <div class="pill info" aria-label="Monedas">${coin()}<span data-coins>${money(shownCoins())}</span></div>
  <button class="me press" data-a="me" aria-label="Tu perfil" title="Tu perfil">${avatarHTML(save)}</button>${devBtn}`;
// Modo dev: va en el lugar del avatar (arriba a la derecha); con el modo dev prendido el avatar se esconde (CSS).
const devBtn = '<button class="tb press dev-pill" data-a="dev" aria-label="Modo dev" title="Modo dev">DEV</button>';
// Botón de jugar: es el mismo en todas las vistas (universo, constelación) y lleva directo al tablero;
// al salir del tablero se vuelve al planeta de ese nivel.
const playCTA = () => {
  const run = save.run, gateW = pendingWorld(), done = save.next >= TOTAL_LEVELS;
  return run ? goBtn('Continuar', levelName(run.g), 'continue', run.bet) : gateW != null ? goBtn('Abrir', `Mundo ${gateW + 1}`, 'gate') : done ? goBtn('¡Completado!', '', 'none') : goBtn('Jugar', playSub(), 'continue', betShown());
};
// ---------- Apuesta (8 nov 2026; 9 nov: desde la constelación 2, hasta ×10 y con su ventana) ----------
// Cada ×N que se abre (×2 en el nivel 101, antes del evento del mes; ×3, ×5, ×10 después) tiene su presentación como
// las de desbloqueo (openUnlock 'apuesta' / 'apuesta3'…: reglas en lista y "¡Entendido!"; la última, en verde: su
// primer ×N va por nuestra cuenta). SIEMPRE el primer ×N que le sale es gratis y forzado (save.betFreeN = el último
// regalado): al tocar Jugar, la ventana para apostar lo trae fijo (las demás fichas bloqueadas) y no cobra. Después
// Jugar abre esa ventana con la última escogida (save.bet). Solo niveles nuevos del camino; nunca en los eventos.
const betOk = (g) => !save.run && !isSecret(g) && g === save.next && g < TOTAL_LEVELS && maxBet(g) > 1 && !save.stars[g];
const betNow = (g) => betSteps(g).filter((m) => m <= (save.bet || 1)).pop() || 1;
// El primer ×N que le sale va por nuestra cuenta (save.betFree / save.betGift eran marcas viejas del ×2).
const betFreeN = () => save.betFreeN ?? (save.betFree || save.betGift ? 2 : 1);
const betGiftNow = (g) => betOk(g) && maxBet(g) > betFreeN();
// Lo que se paga al entrar con la apuesta m: boletos × apuesta y una cuota en monedas. Con la lluvia de meteoritos los
// boletos cuestan la mitad (la cuota no); full: lo de siempre, para enseñarlo tachado.
// La lluvia que rebaja la tienda y los boletos de la apuesta (meteoritos y estrellas; las nuevas no).
const saleRain = () => { const m = meteor(); return m?.K.shop ? m : null; };
// Lluvia de cometas (14 nov 2026): mientras cae, la entrada a un nivel nuevo no gasta boletos (la cuota sí).
const cometNow = () => meteor()?.K.kind === 'comet';
// Lluvia de cristales: la ayuda que dio el nivel (comodín y deshacer van aparte, en su burbuja).
const giftHelps = (met) => (met?.gift && !['wild', 'undo'].includes(met.gift) ? { [met.gift]: 1 } : undefined);
const betPay = (g, m) => {
  const full = ticketCost(g) * m, met = m > 1 && !!saleRain();
  return { tk: cometNow() ? 0 : met ? Math.ceil(full / 2) : full, full, met, fee: betFee(g, m) };
};
// La apuesta que lleva el Jugar del camino (etiqueta ×N; si toca la gratis, esa), y repintarla sin redibujar.
const betShown = () => (!betOk(save.next) ? 1 : betGiftNow(save.next) ? maxBet(save.next) : betNow(save.next));
const betSticker = (m) => (m > 1 ? `<i class="go-bet b${m}" aria-hidden="true">×${m}</i>` : '');
const playSub = () => `Nivel ${save.next + 1}${betGiftNow(save.next) ? ' · ¡gratis!' : ''}`;
function paintBetSticker() {
  if (save.run) return;
  document.querySelectorAll('#app .go[data-a="continue"], #app .go[data-a="play-next"]').forEach((b) => {
    b.querySelector('.go-bet')?.remove();
    b.insertAdjacentHTML('beforeend', betSticker(betShown()));
    const sm = b.querySelector('.t small');
    if (sm) sm.textContent = playSub();
  });
}
// Primer nivel (índice) donde se abre cada ×N: [[2, 100], [3, 200]…].
const betStarts = () => BET_STEPS.slice(1).map((m) => { let g = 0; while (g < TOTAL_LEVELS && maxBet(g) < m) g += LEVELS_PER_WORLD; return [m, g]; });
// Lo que da el nivel al ganarlo con 3★, cada cosa con su número (n) o solo su ×N: monedas, la devolución de boletos,
// fichas de la colección y el cofre del jefe (la lluvia va en las monedas: tachado y ×2).
const betLoot = (g) => [
  { ico: coin(), n: boosted(coinsFor(g, 3, 0), save.coins, g), met: meteor()?.K.x > 1 ? meteor().K.x : 0 },
  { ico: icon('ticket'), n: ticketRefund(g) },
  col() && { ico: icon(col().token), n: 3 },
  g % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1 && { ico: icon('cofre') },
].filter(Boolean);
// Sin etiqueta ×N donde hay número (9 nov 2026): ya va multiplicado y la etiqueta hacía creer que era eso ×N otra vez.
// El cofre y el meteoro (sin número: su premio sale al ganar) sí llevan su ×N.
// Con la lluvia, las monedas enseñan lo de la apuesta tachado y al lado lo final (×2 del meteoro), con su meteorito.
const lootN = (x, m) => x.n * m * (x.met || 1);
// Cada número aparta el ancho del más grande (M, la apuesta más alta): al cambiar la apuesta la ventana no se mueve.
const wch = (n) => `style="min-width:${money(n).length}ch"`;
const betLootHTML = (loot, m, M = m) => loot.map((x, i) => `<span class="bl${x.met ? ' met' : ''}">${x.ico}${x.met ? `<s ${wch(x.n * M)}>${money(x.n * m)}</s>` : ''}${x.n != null ? `<b class="outl" data-i="${i}" data-n="${lootN(x, m)}" ${wch(lootN(x, M))}>${money(lootN(x, m))}</b>${x.met ? icon(meteor()?.K.ico || 'meteoro') : ''}` : `<i class="bl-x b${m}"${m > 1 ? '' : ' hidden'}>×${m}</i>`}</span>`).join('');
// Cuenta de a poco hasta el número nuevo (sube o baja).
function countTo(el, to) {
  const from = +el.dataset.n || 0;
  el.dataset.n = to;
  if (reduced() || from === to) return (el.textContent = money(to));
  const t0 = performance.now(), D = 420;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / D), e = 1 - (1 - k) ** 3;
    el.textContent = money(Math.round(from + (to - from) * e));
    if (k < 1 && el.isConnected) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
// Ventana para apostar (al tocar Jugar): "¡Apuesta y gana más!", la ficha grande ×N y "Puedes ganar hasta" con cada
// premio (su número multiplicado y su etiqueta ×N); abajo las fichas ×1 ×2 ×3… para escoger (la escogida llena de su
// color, levantada y con palomita), el botón y debajo lo que cuesta. Sin letra chiquita. Al cambiar, todo cuenta y brinca.
function openBet() {
  const g = save.next;
  if (!betOk(g)) return enterLevel(g, true);
  // El primer ×N que le sale: forzado, las demás fichas bloqueadas y gratis (va por nuestra cuenta).
  const gift = betGiftNow(g);
  let cur = gift ? maxBet(g) : betNow(g);
  const loot = betLoot(g);
  const p0 = betPay(g, cur);
  const m = openModal({
    title: '¡Apuesta y gana más!',
    color: 'gold',
    cls: 'bet-modal',
    body: `<div class="bet-top"><div class="bet-hero"><div class="rays"></div><span class="bet-big b${cur} outl">×${cur}</span></div>
      <div class="bet-sell"><p class="bet-lead">Puedes ganar hasta</p><div class="bet-loot">${betLootHTML(loot, cur, maxBet(g))}</div></div></div>
      <div class="bet-opts" role="group" aria-label="Apuesta">${betSteps(g).map((k) => `<button class="bet-opt press b${k}${k === cur ? ' sel' : ''}" data-m="${k}" aria-pressed="${k === cur}"${gift && k !== cur ? ' disabled' : ''}><b class="outl">×${k}</b>${icon('check')}</button>`).join('')}</div>`,
    buttons: [{ label: '', cls: 'green wide bet-go', keep: true, onClick: () => {
      save.bet = cur;
      persist();
      m.close();
      paintBetSticker();
      enterLevel(g, true);
    } }],
  });
  const go = m.el.querySelector('.bet-go'), big = m.el.querySelector('.bet-big');
  go.insertAdjacentHTML('afterend', gift ? `<p class="bet-cost free">${icon('gift')}¡Tu primer ×${cur} va por nuestra cuenta!</p>` : `<p class="bet-cost">Cuesta <s class="bc-full"${p0.met ? '' : ' hidden'}>${p0.full}</s><b data-tk data-n="${p0.tk}">${p0.tk}</b>${icon('ticket')}<span class="bc-met"${p0.met ? '' : ' hidden'}>${icon(meteor()?.K.ico || 'meteoro')}−50%</span><span class="bc-fee"${p0.fee ? '' : ' hidden'}>+ ${coin()}<b data-fee data-n="${p0.fee}">${money(p0.fee)}</b></span></p>`);
  const paint = () => (go.innerHTML = `${icon('play')} ${cur > 1 ? `¡Jugar ×${cur}${gift ? ' gratis' : ''}!` : 'Jugar sin apostar'}`);
  paint();
  m.el.querySelectorAll('.bet-opt').forEach((b) =>
    b.addEventListener('click', () => {
      const k = +b.dataset.m;
      if (k === cur || gift) return;
      const up = k > cur;
      cur = k;
      buzz(10);
      m.el.querySelectorAll('.bet-opt').forEach((o) => (o.classList.toggle('sel', o === b), o.setAttribute('aria-pressed', o === b)));
      const pay = betPay(g, k);
      countTo(m.el.querySelector('[data-tk]'), pay.tk);
      const full = m.el.querySelector('.bc-full');
      full.textContent = pay.full;
      full.hidden = m.el.querySelector('.bc-met').hidden = !pay.met;
      countTo(m.el.querySelector('[data-fee]'), pay.fee);
      m.el.querySelector('.bc-fee').hidden = !pay.fee;
      big.className = `bet-big b${k} outl`;
      big.textContent = `×${k}`;
      m.el.querySelectorAll('.bet-loot b').forEach((el) => {
        const x = loot[+el.dataset.i];
        countTo(el, lootN(x, k));
        if (x.met) el.previousElementSibling.textContent = money(x.n * k);
      });
      m.el.querySelectorAll('.bl-x').forEach((el) => ((el.className = `bl-x b${k}`), (el.textContent = `×${k}`), (el.hidden = k < 2)));
      paint();
      if (reduced()) return;
      big.animate([{ scale: 1, rotate: '0deg' }, { scale: up ? 1.35 : 0.8, rotate: up ? '-10deg' : '6deg' }, { scale: 1, rotate: '0deg' }], { duration: 380, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' });
      m.el.querySelectorAll('.bet-loot .bl').forEach((el, i) => el.animate([{ translate: '0 0', scale: 1 }, { translate: `0 ${up ? -8 : 5}px`, scale: up ? 1.18 : 0.9 }, { translate: '0 0', scale: 1 }], { duration: 420, delay: i * 60, easing: 'ease-out' }));
      if (up) { const r = big.getBoundingClientRect(); sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 10 + k); }
    }),
  );
  if (!reduced()) m.el.querySelectorAll('.bet-loot .bl, .bet-opt').forEach((el, i) => el.animate([{ opacity: 0, translate: '0 10px' }, { opacity: 1, translate: '0 0' }], { duration: 300, delay: 250 + i * 70, easing: 'ease-out', fill: 'backwards' }));
}
const playNow = () => (save.run ? enterLevel(save.run.g) : pendingWorld() != null ? openWorldGate(pendingWorld()) : enterLevel(save.next));
const goBtn = (title, sub, act, bet = 1) => {
  // Lluvia de meteoritos: el Jugar del camino lleva orilla de fuego y lo que le queda (el del evento no: ahí no cuenta).
  const m = ['continue', 'play-next'].includes(act) && meteor();
  return `<button class="go${m ? ` met sh-${m.K.kind}` : ''}" data-a="${act}">${icon('play')}<span class="t"><b class="outl">${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>${m ? `<small class="met-clock">${mmss(m.left())}</small>` : ''}${betSticker(bet)}</button>`;
};

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
function showMap({ region, start = null, anim, after = null, unlock = null, paid = false } = {}) {
  gallery.active = false;
  if (region == null) region = regionOf(start ?? unlock ?? currentWorld());
  current = () => showMap({ region });
  // Se pueden ver todas las constelaciones, aunque estén bloqueadas: así se nota que hay muchas.
  const locked = region * REGION_SIZE > currentWorld();
  const el = h(`<div class="screen galaxy">
    <div class="space"></div><div class="g3d"></div>${metSky()}<div class="glabels g-only"></div>
    <div class="g-only">
      <button class="hbtn tb press out-btn" data-a="up" aria-label="Ver todas las constelaciones" title="Constelaciones">${icon('prev')}</button>
      <div class="wtitle info">${constIcon()}<div><b>${locked ? icon('lock') : ''}${regionName(region)}</b><small>Constelación ${region + 1} de ${REGION_COUNT} · ${star(true)}${regionStars(region)}/${REGION_SIZE * 30}</small></div></div>
    </div>
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
    if (run && worldOf(run.g) === w) go = goBtn('Continuar', isSecret(run.g) ? 'Nivel secreto' : `Nivel ${run.g + 1}`, 'continue', run.bet);
    else if (save.next >= first && save.next < first + LEVELS_PER_WORLD) go = goBtn('Jugar', playSub(), 'play-next', betShown());
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
      // Acostado el aviso sale a la izquierda: no más ancho que lo que hay hasta la orilla.
      const nm = cta.querySelector('.newmech');
      if (open && nm && !matchMedia('(max-aspect-ratio: 1/1)').matches) nm.style.maxWidth = `${Math.min(420 * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--k') || 1), cta.getBoundingClientRect().left - 24)}px`;
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
    if (c) c.textContent = money(shownCoins() - after.res.coins - (after.res.chest?.coins || 0));
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
        relayout: remount,
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
    else if (unlock != null) wait(500).then(() => playUnlock(unlock, paid));
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
  if (a.res.racha) openGroup('r', 'open', true);
  refreshMis();
  refreshAchievements();
  if (a.res.racha) bumpStreak();
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
// paid: ya aceptó pagar en la ventana (el primer mundo de cada constelación cuesta monedas).
async function playUnlock(w, paid = false) {
  // El primer mundo de una constelación pide el boleto de constelación (no el dorado) y monedas.
  const cost = openCost(w), isConst = constStart(w), tk = isConst ? 'cgold' : 'gold';
  const okStars = starsBefore(w) >= starsNeeded(w), okGold = save[tk] > 0, okCoins = save.coins >= cost;
  // Constelación nueva (8 nov 2026): se paga, se sale a las constelaciones, se ve cómo se abre la nueva y se entra
  // directo a su planeta 1 (antes se entraba con el título todavía con candado).
  if (isConst && paid && okStars && okGold && okCoins) {
    const r = regionOf(w), was = regionData(r);
    save[tk]--;
    save.coins -= cost;
    save.open = w;
    persist();
    if (map?.galaxy?.sel) await map.galaxy.zoomOut();
    return warp(() => showUniverse({ from: r, opening: { r, was, w } }), { out: true });
  }
  const galaxy = map?.galaxy;
  if (!galaxy || map.region !== regionOf(w)) {
    if (okStars && okGold && okCoins && (!isConst || paid)) return showMap({ unlock: w, paid });
    if (galaxy?.sel) await galaxy.zoomOut();
    return openWorldGate(w);
  }
  if (galaxy.sel) await galaxy.zoomOut();
  if (!(okStars && okGold && okCoins) || (isConst && !paid)) return openWorldGate(w);
  save[tk]--;
  save.coins -= cost;
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
// La app siempre abre en el universo: si se cerró a medio recorrido (en la constelación o el planeta), vuelve a
// empezar desde el universo. Si no, ningún círculo salía y el perfil se quedaba bloqueado.
if (tourStep() && tourStep() !== 'uni') setTour('uni');
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

// ---------- Recorrido de los botones ----------
// Una sola vez en la vida, al volver al mapa con el nivel 1 ganado (también jugadores que ya iban más adelante).
// Se ve igual que el recorrido del mapa: círculo y globo, lo demás apagado, y se avanza tocando lo del círculo.
// Orden: los botones de la izquierda, lo de arriba (estrellas, boletos, monedas y perfil), los eventos que faltan
// por abrirse (salen solo durante su paso, con candado) y al final Jugar, que cierra el recorrido y entra al nivel.
// El círculo se desliza de un lugar a otro. El regalo se reclama de verdad y no se sigue hasta reclamarlo (si hoy
// ya se reclamó, solo se señala). save.sideTour = paso en el que va (si cierra el juego, sigue ahí) o 'done'.
const TOUR_EVS = [['mes', 'star'], ['fiesta', 'flame'], ['col', 'concha'], ['racha', 'rocket']];
// Orden de los botones de eventos (por su data-a), el mismo de eventButtons.
const EV_ORDER = ['evento', 'evento-next', 'fiesta', 'fiesta-next', 'col', 'racha', 'mis', 'logros'];
const SIDE_TOUR = [
  // 8 nov 2026: los menús van agrupados; primero el botón que los junta (tocarlo abre su cajón) y luego cada uno.
  { sel: '.side.l .grp-btn', open: 'l', title: 'Menú', text: () => 'Aquí se juntan el <b>regalo diario</b>, los <b>boletos</b>, la <b>tienda</b>, el <b>álbum</b>, <b>tu camino</b> y los <b>ajustes</b>. Tócalo para abrirlo; toca afuera para cerrarlo.' },
  { a: 'daily', title: 'Regalo diario', text: () => (dailyState(save.daily).claimed ? 'Cada día te espera un <b>regalo</b>. Hoy ya lo abriste: vuelve mañana por el siguiente.' : 'Cada día te espera un <b>regalo</b>: ábrelo y <b>toca el planeta de hoy</b>. Cada semana ganas una pieza de planeta y con 4 piezas, un <b>escudo</b>.'), act: () => !dailyState(save.daily).claimed },
  { a: 'dticket', title: 'Boletos de regalo', text: () => 'Cada 24 horas te regalamos <b>boletos</b> para entrar a niveles nuevos.' },
  { a: 'shop', title: 'Tienda', text: () => 'Con tus monedas cambia cómo se ven tus <b>cartas</b>, tu <b>avatar</b> y tu <b>viajero</b>.' },
  { a: 'album', title: 'Álbum', text: () => 'Cada planeta que terminas te da una <b>postal</b> para tu álbum.' },
  { a: 'camino', title: 'Tu camino', text: () => 'Aquí ves <b>todo lo que se abre</b> jugando y <b>en qué nivel</b> llega: eventos, cartas especiales y mesas.' },
  { a: 'settings', title: 'Ajustes', text: () => 'Aquí está cómo jugar, el sonido y tu respaldo.' },
  { sel: '.res .pill[aria-label="Estrellas"]', title: 'Tus estrellas', text: () => 'Cada nivel te da hasta <b>3 estrellas</b>. Las necesitas para abrir mundos nuevos.' },
  { sel: '.res .pill[aria-label="Boletos"]', title: 'Tus boletos', text: () => 'Entrar a un nivel nuevo cuesta <b>boletos</b>. Si lo ganas, te los devuelve.' },
  { sel: '.res .pill[aria-label="Monedas"]', title: 'Tus monedas', text: () => 'Las ganas en cada nivel. Con ellas compras <b>comodines</b>, <b>deshacer</b> y cosas de la <b>tienda</b>.' },
  { sel: '.res .me', title: 'Tu perfil', text: () => 'Tu nombre, tu avatar y todo lo que llevas ganado.' },
  { sel: '.side.r .grp-btn', open: 'r', title: 'Eventos', text: () => 'Tus <b>eventos</b> también van juntos. El botón dorado te enseña el que tiene algo listo y cuántos te esperan.' },
  { evs: true, sel: '[data-tour-evs]', title: 'Eventos', text: () => 'Jugando se abren los <b>eventos</b>: la racha, las colecciones, el evento del mes y las festividades. ¡Con premios exclusivos!' },
  // Cierre: el círculo pasa al botón de jugar; tocarlo termina el recorrido y hace lo de siempre (jugar, continuar…).
  { go: true, sel: '.cta .go', title: '¡Ahora sí, a jugar!', text: (b) => `Toca <b>${b?.querySelector('b')?.textContent || 'Jugar'}</b> y sigue tu camino.` },
];
const sideTourDue = () => save.next >= 1 && save.sideTour !== 'done';
function sideTour() {
  return new Promise((done) => {
    const screen = document.querySelector('#app .screen');
    const el = h(`<div class="guide side-guide"><div class="g-ring"></div><div class="g-bubble info"><b></b><span></span></div></div>`);
    screen.append(el);
    screen.classList.add('side-touring');
    // Si el recorrido se retoma a medias, el cajón de lo que señala ya va abierto (en orden se abren al tocar su botón).
    const resumeOpen = () => {
      const k = SIDE_TOUR.slice(0, i).findLast((t) => t.open)?.open;
      if (k) openGroup(k, 'open');
    };
    const ring = el.querySelector('.g-ring'), bub = el.querySelector('.g-bubble');
    let i = typeof save.sideTour === 'number' ? Math.min(save.sideTour, SIDE_TOUR.length - 1) : 0, busy = false, over = false;
    const btn = () => { const t = SIDE_TOUR[i]; return screen.querySelector(t.sel || `.side.l [data-a="${t.a}"]`); };
    // Eventos que faltan por abrirse: salen en la columna de la derecha, con candado, solo durante su paso.
    const lockedEvs = () => TOUR_EVS.filter(([k]) => !isOn(k));
    // Los que faltan van en su lugar dentro del cajón de eventos. Si todavía no hay botón que los agrupe, se enseña
    // cómo será: el botón dorado y su cajón abierto con los que ya tiene y los que faltan (solo durante este paso).
    const addEvs = () => {
      const col = screen.querySelector('.side.r');
      if (!col || col.querySelector('.tour-lock')) return;
      const key = (k) => (k === 'mes' ? 'evento' : k);
      const locked = lockedEvs().map(([k, ico]) => h(`<span class="iconbtn tb ev-btn soon tour-lock" data-k="${key(k)}">${icon(ico)}<span class="fi-lock">${icon('lock')}</span><em class="grp-name">${GRP_NAMES[key(k)]}</em></span>`));
      let drawer = col.querySelector('.grp-drawer');
      if (!drawer) {
        const own = [...col.querySelectorAll(':scope > .iconbtn')].map((b) => {
          const c = b.cloneNode(true);
          c.dataset.k = c.dataset.a;
          c.removeAttribute('data-a');
          c.insertAdjacentHTML('beforeend', `<em class="grp-name">${GRP_NAMES[b.dataset.a] || ''}</em>`);
          return c;
        });
        const n = own.length + locked.length;
        const g = h(`<div class="tour-grp"><span class="iconbtn tb grp-btn">${icon('star')}</span><div class="grp-drawer" style="--gc:${Math.min(3, Math.ceil(n / 2))}"></div></div>`);
        drawer = g.querySelector('.grp-drawer');
        own.forEach((c) => drawer.append(c));
        col.append(g);
        col.classList.add('tour-demo', 'open');
      }
      // Cada uno en su lugar (mes, día, colección, racha, misiones, logros).
      const rank = (el) => EV_ORDER.indexOf(el.dataset.k || el.dataset.a);
      for (const el of locked) drawer.insertBefore(el, [...drawer.children].find((x) => rank(x) > rank(el)) || null);
      drawer.setAttribute('data-tour-evs', '');
      if (!reduced()) locked.forEach((b, k) => b.animate([{ opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1.12, offset: 0.7 }, { opacity: 1, scale: 1 }], { duration: 420, delay: k * 90, easing: 'ease-out', fill: 'backwards' }));
    };
    const dropEvs = () => {
      const col = screen.querySelector('.side.r');
      const gone = [...screen.querySelectorAll('.tour-lock, .tour-grp')];
      screen.querySelector('[data-tour-evs]')?.removeAttribute('data-tour-evs');
      const end = () => (gone.forEach((g) => g.remove()), col?.classList.remove('tour-demo', 'open'));
      if (!gone.length) return;
      if (reduced()) return end();
      Promise.all(gone.map((g) => g.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.6 }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).finished)).then(end, end);
    };
    const finish = () => {
      over = true;
      save.sideTour = 'done';
      persist();
      dropEvs();
      screen.querySelector('.tour-on')?.classList.remove('tour-on');
      screen.classList.remove('side-touring');
      closeGroups();
      if (reduced()) el.remove();
      else el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220 }).finished.then(() => el.remove());
      done();
    };
    // Círculo sobre lo señalado y globo a su lado (o debajo / encima si no cabe). Se vuelve a medir en cada cuadro:
    // los botones entran animados y en iPhone el giro avisa tarde, así el círculo nunca se descuadra.
    // Todo se mide contra la capa del recorrido (no contra la ventana): si algo la desplaza (iPhone en vertical, la
    // pantalla que entra animada), el círculo y el globo igual caen sobre el botón. El círculo se desliza solo (JS).
    let cur = null;
    function put() {
      const b = btn();
      if (!b) return;
      if (!b.classList.contains('tour-on')) b.classList.add('tour-on'); // por si se volvió a dibujar
      const g = el.getBoundingClientRect(), W = g.width, H = g.height, br = b.getBoundingClientRect();
      const r = { left: br.left - g.left, top: br.top - g.top, right: br.right - g.left, bottom: br.bottom - g.top, width: br.width, height: br.height };
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, roomR = W - r.right - 24, roomL = r.left - 24;
      const wide = r.width > r.height * 1.25 || r.height > r.width * 1.25 || Math.min(r.width, r.height) > 110;
      ring.classList.toggle('wide', wide);
      // Círculo: cuadrado alrededor del botón; cápsula si es alargado. Siempre centrado en el botón: junto a una orilla
      // no se recorre (se veía chueco), se achica hasta lo que cabe (nunca menos que el botón y su borde).
      const B = 8, near = (c, len, full) => Math.max(len + B, 2 * (Math.min(c, full - c) - 3));
      const s = Math.max(r.width, r.height) + 22 + B;
      let rw = Math.min(wide ? r.width + 26 + B : s, near(cx, r.width, W)), rh = Math.min(wide ? r.height + 26 + B : s, near(cy, r.height, H));
      if (!wide) rw = rh = Math.min(rw, rh);
      const to = { x: cx, y: cy, w: rw, h: rh };
      if (!cur || reduced()) cur = { ...to };
      else for (const k in to) cur[k] += (to[k] - cur[k]) * 0.2;
      Object.assign(ring.style, { left: `${cur.x - cur.w / 2}px`, top: `${cur.y - cur.h / 2}px`, width: `${cur.w}px`, height: `${cur.h}px`, translate: 'none', boxSizing: 'border-box' });
      const bh = bub.offsetHeight, midY = () => Math.min(H - bh - 12, Math.max(12, cy - bh / 2));
      if (cx < W / 2 && roomR >= 220) Object.assign(bub.style, { left: `${r.right + 20}px`, width: `${Math.min(330, roomR)}px`, translate: '0 0', top: `${midY()}px` });
      // 9 nov 2026: los de la derecha, igual de pegados que los de la izquierda (antes solo si eran alargados).
      else if (cx > W / 2 && roomL >= 220) {
        const w = Math.min(330, roomL);
        Object.assign(bub.style, { left: `${r.left - 20 - w}px`, width: `${w}px`, translate: '0 0', top: `${midY()}px` });
      } else {
        // Debajo si cabe; si no (botón de jugar, abajo), encima. Alineado con el botón (no centrado en la pantalla).
        const below = r.bottom + 24 + bh < H - 12, w = Math.min(330, W - 24);
        Object.assign(bub.style, { left: `${Math.min(W - w - 12, Math.max(12, cx - w / 2))}px`, width: `${w}px`, translate: '0 0', top: `${below ? r.bottom + 24 : Math.max(12, r.top - 24 - bh)}px` });
      }
    }
    const loop = () => {
      if (over || !el.isConnected) return;
      if (!busy) put();
      requestAnimationFrame(loop);
    };
    const show = () => {
      const t = SIDE_TOUR[i];
      if (t.evs && !lockedEvs().length) return next(); // ya se abrieron todos
      save.sideTour = i;
      persist();
      screen.querySelector('.tour-on')?.classList.remove('tour-on');
      if (t.evs) addEvs();
      // Lo de arriba que no se ve (en vertical la primera ficha se oculta) se salta.
      if (!btn()?.getClientRects().length) return t.sel && !t.go ? next() : finish();
      btn().classList.add('tour-on');
      bub.querySelector('b').textContent = t.title;
      bub.querySelector('span').innerHTML = t.text(btn());
      put();
      if (!reduced()) bub.animate([{ opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1.05, offset: 0.7 }, { opacity: 1, scale: 1 }], { duration: 420, easing: 'ease-out' });
    };
    const next = () => {
      if (SIDE_TOUR[i].evs) dropEvs();
      return ++i >= SIDE_TOUR.length ? finish() : show();
    };
    // Solo cuenta tocar lo del círculo; tocar fuera hace latir el círculo.
    el.addEventListener('click', async (e) => {
      if (busy) return;
      const r = btn()?.getBoundingClientRect();
      if (!r) return finish();
      const pad = 14;
      if (e.clientX < r.left - pad || e.clientX > r.right + pad || e.clientY < r.top - pad || e.clientY > r.bottom + pad) {
        if (!reduced()) ring.animate([{ scale: 1 }, { scale: 1.25 }, { scale: 1 }], { duration: 300 });
        return;
      }
      const t = SIDE_TOUR[i];
      btn()?.classList.add('tapped');
      setTimeout(() => btn()?.classList.remove('tapped'), 160);
      if (t.go) {
        const b = btn();
        finish();
        return b?.click();
      }
      if (t.open) {
        openGroup(t.open, 'open');
        await wait(reduced() ? 0 : 380);
        return next();
      }
      if (!t.act?.()) return next();
      // El regalo se abre de verdad; al cerrar su ventana se sigue solo si ya se reclamó.
      busy = true;
      el.style.visibility = 'hidden';
      sideAction(t.a);
      await wait(400);
      while (modalOpen()) await wait(250);
      el.style.visibility = '';
      busy = false;
      if (t.act()) return show();
      next();
    });
    resumeOpen();
    show();
    loop();
  });
}

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
// opening: constelación que se acaba de comprar ({ r, was: cómo se veía cerrada, w: su primer mundo}).
// «Arma tu personaje» (10 nov 2026): quien ya jugaba antes de los avatares 3D lo ve una vez en el mapa, cuando no
// hay otra ventana abierta (ni el tutorial ni avisos de desbloqueo). Se abre en la pestaña Personaje.
let kidAsking = false;
function askKid() {
  if (!save.kidAsk || kidAsking || save.onboard !== 'done') return;
  kidAsking = true;
  const go = () => {
    if (!save.kidAsk) return (kidAsking = false);
    if (document.querySelector('#modal-root .modal') || !document.querySelector('.screen.galaxy')) return setTimeout(go, 1500);
    kidAsking = false;
    delete save.kidAsk;
    persist();
    profileForm({ title: 'Arma tu personaje', p: playerNow(), action: '¡Listo!', onSave: (p) => { savePlayer(p, save.name); paintMe(); } });
  };
  setTimeout(go, 1800);
}
function showUniverse({ from = regionOf(currentWorld()), opening = null } = {}) {
  gallery.active = false;
  askKid();
  current = () => showUniverse({ from });
  const el = h(`<div class="screen galaxy universe">
    <div class="space"></div><div class="g3d"></div>${metSky()}<div class="glabels"></div>
    <div class="wtitle solo info">${constIcon()}<div><b>Constelaciones</b><small>${REGION_COUNT} en el universo · ${star(true)}${fmt(totalStars())}</small></div></div>
    <div class="side l">${sideButtons()}</div>
    <div class="side r">${eventButtons()}</div>
    <div class="res">${wallet()}</div>
    <div class="cta">${playCTA()}</div>
  </div>`);
  let uni = null;
  // Entrar a una constelación: la cámara se lanza hacia ella y el túnel de estrellas lleva a sus planetas.
  // 8 nov 2026: una constelación cerrada no se abre al tocarla: sale lo que pide (boleto, estrellas y monedas) y solo
  // se entra cuando se cumple (Abrir).
  const open = (r) => {
    if (!uni || uni.busy) return;
    if (r * REGION_SIZE > currentWorld()) return openConstGate(r);
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
    const regions = Array.from({ length: REGION_COUNT }, (_, r) => (opening?.r === r ? opening.was : regionData(r)));
    uni = new Universe(el.querySelector('.g3d'), el.querySelector('.glabels'), {
      regions,
      start: from,
      fromZoom: true,
      traveler: equipped('traveler'),
      on: { open, relayout: remount },
    });
    el._dispose = () => uni.dispose();
    if (tourStep() === 'uni') wait(1000).then(() => guide(uni, 'uni', el));
    if (opening) {
      uni.busy = true;
      wait(reduced() ? 0 : 1100).then(async () => {
        if (!el.isConnected) return;
        await uni.unlockRegion(opening.r, regionData(opening.r));
        buzz(25);
        toast(`${constIcon()} ¡${regionName(opening.r)} abierta!`);
        await wait(reduced() ? 0 : 500);
        if (!el.isConnected) return;
        uni.zoomInto(opening.r);
        warp(() => showMap({ start: opening.w }));
      });
    }
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
const clock = (ms) => { const t = Math.ceil(ms / 1000), d = Math.floor(t / 86400); return `${d ? `${d} d ` : ''}${Math.floor(t / 3600) % (d ? 24 : Infinity)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
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
const streakBtn = (prev = null) => {
  if (!isOn('racha')) return '';
  const r = dailyStreak(), t = streakTheme(), old = prev != null;
  const ready = !old && streakReady(), hot = !old && !ready && streakHot();
  // 10 nov 2026: el anillo de misiones y logros, lleno con lo que lleva hacia el siguiente premio.
  const i = nextIndex(r), from = i ? streakGoal(i - 1).n : 0, p = ready ? 1 : Math.max(0, Math.min(1, ((old ? prev : r.n) - from) / (streakGoal(i).n - from)));
  return `<button class="iconbtn tb press prog racha-btn ${fresh('racha')} ${ready ? 'ready' : ''} ${hot ? 'hot' : ''}" data-a="racha" style="--p:${p.toFixed(3)}" aria-label="${t.name}" title="${t.name}">${hot ? `<span class="fire">${icon('flame')}</span>` : ''}${icon(t.ico)}<small class="rn">${old ? prev : r.n}</small>${ready ? '<span class="dot"></span>' : ''}</button>`;
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
// Misiones del día y logros (10 nov 2026): ya no se reclaman (se cobran solos), así que el botón no lleva punto rojo:
// un anillo alrededor se llena con lo que llevas (--p, 0 a 1). Misiones: lo de las 3 juntas y un puntito por misión
// cumplida; todas y el cofre: palomita. Logros: lo que le falta al más cercano a su siguiente medalla y cuántas llevas.
const missionPips = (s) => `<small class="rn pips">${s.list.map((x) => `<i class="${missionDone(x) ? 'on' : ''}"></i>`).join('')}</small>`;
const missionsBtn = () => {
  if (!isOn('mis')) return '';
  const s = missions(ev()?.state?.paid), all = missionsAllDone();
  const p = s.list.reduce((n, x) => n + Math.min(1, x.n / x.goal), 0) / (s.list.length || 1);
  return `<button class="iconbtn tb press prog mis-btn ${fresh('mis')} ${all ? 'all-done' : ''}" data-a="mis" style="--p:${p.toFixed(3)}" aria-label="Misiones del día" title="Misiones del día">${icon('misiones')}${all ? `<span class="fi-lock">${icon('check')}</span>` : missionPips(s)}</button>`;
};
const achievementsBtn = () => {
  if (!isOn('logros')) return '';
  const ls = achievementsVisible(), open = ls.filter((l) => achievementGot(l) < ACHIEVEMENT_TOP);
  const p = Math.max(0, ...open.map((l) => Math.min(1, achievementProgress(l) / l.steps[achievementGot(l)]))), medals = ls.reduce((n, l) => n + achievementGot(l), 0);
  return `<button class="iconbtn tb press prog logros-btn ${fresh('logros')}" data-a="logros" style="--p:${open.length ? p.toFixed(3) : 1}" aria-label="Logros" title="Logros">${icon('trophy')}${medals ? `<small class="rn">${medals}</small>` : ''}</button>`;
};
// 8 nov 2026: con más de 3 botones, cada lado se agrupa en un botón dorado con lo más urgente (listo > arde > nuevo) y
// cuántos tienen algo listo; tocarlo abre su cajón (tarjeta oscura sin título, 3 o 4 renglones y hasta 3 columnas,
// cada botón con su nombre abajo) y
// tocar afuera lo cierra.
// La festividad del día entra a la columna de eventos.
const GROUP_FROM = 4;
const grouped = (k, label, html) => {
  const n = (html.match(/<button /g) || []).length;
  if (n < GROUP_FROM) return html;
  // Menú: de 3 o 4 renglones y máximo 3 columnas (hasta 6 en 3 renglones, 7-8 en 4 de 2, más en 3 columnas).
  // Eventos: máximo 2 renglones (hasta 3 columnas), para que el cajón no llegue al botón de jugar.
  const cols = k === 'r' ? Math.min(3, Math.ceil(n / 2)) : n <= 6 ? Math.ceil(n / 3) : n <= 8 ? 2 : 3;
  return `<button class="iconbtn tb press grp-btn" data-a="grp-${k}" aria-label="${label}" aria-expanded="false" title="${label}">${icon(k === 'l' ? 'menu' : 'star')}<span class="grp-n" hidden></span></button><div class="grp-drawer" style="--gc:${cols}">${html}</div>`;
};
const eventButtons = (res) => {
  // Siempre en este orden (8 nov 2026, pedido del usuario): mes, día, colección, racha, misiones, logros.
  const all = evBtn() + festBtn() + colBtn() + streakBtn(res?.racha ? res.racha - 1 : null) + missionsBtn() + achievementsBtn();
  return grouped('r', 'Eventos', all);
};
// Tu camino (8 nov 2026) va en el menú después del álbum, con su puntito cuando hay algo nuevo que ver.
const sideButtons = () => grouped('l', 'Menú', `${ibtn('gift', 'Regalo diario', 'daily', !dailyState(save.daily).claimed)}${ticketBtn()}${ibtn('bag', 'Tienda', 'shop', shopNew())}${ibtn('album', 'Álbum de postales', 'album')}${roadBtn()}${ibtn('gear', 'Ajustes', 'settings')}`);
function sideAction(a) {
  if (a === 'grp-r' || a === 'grp-l') return openGroup(a.slice(4)), true;
  const act = { me: () => !document.querySelector('.touring') && openProfile(), camino: openRoad, shop: () => openShop(), daily: openDaily, dticket: openDailyTicket, racha: openStreak, mis: openMis, logros: openAchievements, col: openCol, evento: openEvent, 'evento-next': openEventNext, fiesta: () => openFestival(), 'fiesta-next': () => openFestival(festivalSoon(), 'fiesta-next'), album: openAlbum, settings: openSettings, dev: () => openDevMenu({ onGallery: () => showGallery(save.next), onPlanets: showPlanets, onFestivals: openFestivalPack, onGoLevel: openGoLevel, onRefresh: boot, onRescue: () => (document.getElementById('modal-root').replaceChildren(), openRescue()), card: mechCard }) }[a];
  // Usar un botón cierra su cajón (menos durante el recorrido, que los va enseñando).
  if (act && !document.querySelector('.side-touring')) closeGroups();
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
// Tienda con algo recién abierto (9 nov 2026): punto rojo hasta que la abras. save.shopSeen = el mundo abierto la
// última vez que entró (quien ya jugaba empieza sin punto).
const shopFresh = (it) => !it.ev && it.need && it.need <= save.open && it.need > (save.shopSeen ?? save.open);
const shopNew = () => Object.values(ITEMS).some((l) => l.some(shopFresh));
const ibtn = (k, label, act, dot) => `<button class="iconbtn tb press${dot ? ' ready' : ''}" data-a="${act}" aria-label="${label}" title="${label}">${icon(k)}${dot ? '<span class="dot"></span>' : ''}</button>`;
const loadGalaxy = () => import('./galaxy.js').then((m) => ((PlanetView = m.PlanetView), (Universe = m.Universe), (Galaxy = m.Galaxy)));

// Se conserva el nombre: en dev y otros lugares se pide "el mundo w".
const showWorld = (w, anim) => showMap({ start: w, anim });

// ---------- Cartas de ejemplo (ayuda y avisos) ----------
const SUITS = ['s', 'h', 'd', 'c'];
const R = { A: 0, J: 10, Q: 11, K: 12 };
const rk = (r) => R[r] ?? +r - 1;
const mini = (x, r, s, extra = {}, cls = '') => `<div class="card up ${cls}" style="left:${x}px">${faceHTML({ rank: rk(r), suit: SUITS.indexOf(s), ...extra })}${extra.marks || ''}</div>`;
// Texto corto de cada carta (Tu camino, Cómo jugar, «Aquí aparece»): el mismo de su ventana (TIPS en game.js).
const MECH_TEXT = TIPS;
// Flecha y carta viva: se enseñan los dos casos (arriba y abajo). Candado y cortina: con la carta que los abre.
const MECH_BOTH = {
  lock: () => mini(0, '8', 'c', { key: 0 }) + mini(0, '9', 'd', { lock: 0 }),
  curtain: () => mini(0, '5', 's', { marks: `<span class="curtain-mark">${curtainIcon()}</span>` }, 'curtain-key-demo') + mechCard('curtain'),
  arrow: () => mini(0, '6', 'd', { arrow: 1 }) + mini(0, '6', 'c', { arrow: -1 }),
  live: () => mini(0, 'K', 's', { live: 1 }) + mini(0, '4', 'h', { live: -1 }),
  // Enredadera: con la carta de fuego que la quema.
  vine: () => mini(0, '3', 'h', { fire: 1 }) + mechCard('vine'),
};
// Ayuda → Cartas especiales, en bloques como "Cómo jugar".
// Grupos de Cómo jugar: los mismos de las ventanas (MECH_KINDS en game.js).
const MECH_GROUPS = MECH_KINDS;
// Reverso de la baraja del jugador, para los dibujos de la ayuda.
const helpBack = (x, extra = '') => `<div class="card" style="left:${x}px;${extra};--back:${cardBackURL()}"><div class="inner">${backHTML({})}</div></div>`;
function mechCard(m, x = 0) {
  const back = `--back:${cardBackURL()}`;
  if (m === 'lock') return mini(x, '9', 'd', { lock: 0 });
  if (m === 'pack') return `<div class="card pack-card up" style="left:${x}px"><div class="inner"><div class="face front"></div></div><span class="pack-num">+3</span></div>`;
  if (m === 'ice') return mini(x, 'Q', 'c', { marks: '<span class="ice-ov"><b>2</b></span>' });
  if (m === 'double') return `<div class="card up" style="left:${x}px">${faceHTML({ rank: 4, alt: 7, suit: 1 })}</div>`;
  if (m === 'arrow') return mini(x, '6', 'd', { arrow: 1 });
  if (m === 'curtain') return `<div class="card curtain curtain-demo" style="left:${x}px;${back}"><div class="inner">${backHTML({ curtain: 0 })}</div></div>`;
  if (m === 'bomb') return `<div class="card bomb-card up" style="left:${x}px"><div class="inner"><div class="face front"></div></div><span class="bomb-face">${icon('bomb')}<b>3</b></span></div>`;
  if (m === 'live') return mini(x, 'K', 's', { live: 1 });
  if (m === 'ticket') return `<div class="card up" style="left:${x}px">${faceHTML({ rank: 4, half: 9, suit: 1 })}</div>`;
  if (m === 'scratch') return mini(x, '8', 'c', { marks: `<span class="scr-ov">${scrSVG(`demo${x}`, 2)}</span>` });
  if (m === 'domino') return `<div class="card up" style="left:${x}px">${faceHTML({ rank: 4, dom: 9, suit: 0 })}</div>`;
  if (m === 'triple') return `<div class="card up" style="left:${x}px">${faceHTML({ rank: 6, tri: [11, 2], suit: 2 })}</div>`;
  if (m === 'turbo') return mini(x, '7', 'h', { turbo: true });
  if (m === 'coin') return mini(x, '5', 'd', { coin: 20 });
  if (m === 'astro') return `<div class="card up ship-demo" style="left:${x}px">${faceHTML({ rank: 3, suit: 1 })}<span class="ship-mark">${icon('astronauta')}</span></div>`;
  if (m === 'ship') return `<div class="card up ship-demo" style="left:${x}px">${faceHTML({ rank: 6, suit: 2 })}<span class="ship-mark">${icon('nave')}</span></div>`;
  if (m === 'ghost') return mini(x, '8', 'h', { ghost: 1 }, 'ghost-demo');
  if (m === 'cham') return mini(x, '7', 'c', { cham: 1 }, 'cham-demo');
  if (m === 'bolt') return mini(x, '6', 'h', { bolt: 1 });
  if (m === 'cst') return mini(x, 'J', 'd', { cst: 1 });
  if (m === 'vine') return mini(x, '9', 's', { marks: `<span class="vine-ov">${vineSVG()}</span>` }, 'vined vine-demo');
  if (m === 'magnet') return mini(x, '4', 'h', { magnet: 1 });
  if (m === 'scope') return mini(x, '9', 'c', { scope: 1 });
  if (m === 'twin') return mini(x, '5', 'h', { twin: 1 });
  if (m === 'rainbow') return mini(x, '6', 'c', { rainbow: 1 });
  if (m === 'sleep') return mini(x, '8', 'd', { marks: `<span class="sleep-ov"><i class="sl-cap">${icon('dormida')}</i><span class="zz"><i>z</i><i>z</i><i>z</i></span><b>3</b></span>` }, 'asleep');
  if (m === 'comet') return `<div class="card comet-card up" style="left:${x}px"><div class="inner"><div class="face front"></div></div><span class="comet-face">${icon('comet')}<b>4</b><em>+3</em></span></div>`;
  return '';
}

ART.mechCard = (m) => mechCard(m);
ART.tableIcon = tableIcon;
// Misiones y logros de una carta especial (8 nov 2026): llevan la carta misma de ejemplo (la de la ayuda), no un ícono.
// Carta especial: su carta de ejemplo · Apostador: la etiqueta ×N de la apuesta (la de Jugar).
const missionIcon = (m) => (m.mech ? `<span class="mis-card">${mechCard(m.mech)}</span>` : m.bet ? `<span class="mis-bet"><i class="go-bet dbet b${m.bet}">×${m.bet}</i></span>` : icon(m.ico));

// ---------- Tu camino (8 nov 2026) ----------
// Todo lo que se abre jugando (eventos, cartas especiales y mesas) en el orden en que sale. Lo que ya alcanzaste se ve
// completo; lo que falta sale con "?" y el nivel en que llega. "Tú" marca el nivel en que vas.
// n: el nivel (contando desde 1) en que se ve por primera vez: los eventos, al ganar UNLOCK[k] niveles.
const ROAD_KINDS = { ev: 'Evento', card: 'Carta nueva', mesa: 'Mesa nueva' };
const ROAD_TABLES = [
  ['mesa', 'Mesa enrollada', 'Limpia las cartas del principio y la mesa avanza: salen más cartas del rollo.'],
  ['gravedad', 'Gravedad', 'Solo juegas la carta de abajo de cada columna. Al quitarla, la columna cae.'],
  ['nebulosa', 'Nebulosa', 'Solo ves 3 grupos. Vacía cualquiera y de la nebulosa sale otro.'],
  ['hangar', 'Hangar', ''],
  ['bitacora', 'Bitácora', ''],
  ['portal', 'Grúa de feria', ''],
  ['voltea', 'Mesa que se voltea', 'Columnas dentro de una cápsula: solo juegas la de abajo. Cada 5 jugadas o robos da media vuelta.'],
];
function roadItems() {
  const t = streakTheme();
  const evs = [
    ['racha', UNLOCK.racha, t.name, t.ico, 'Gana niveles seguidos, junta estrellas y llévate premios cada día.'],
    ['mis', UNLOCK.mis, 'Misiones del día', 'misiones', 'Cada día 3 misiones con monedas, y un cofre si cumples las 3.'],
    ['logros', UNLOCK.logros, 'Logros', 'trophy', 'Todo suma para siempre: bronce, plata, oro, platino y diamante.'],
    ['meteoro', MET_FROM, 'Lluvia de meteoritos', 'meteoro', 'Cae sin aviso 30 minutos: doble de monedas y un premio sorpresa.'],
    ['estrellas', STAR_FROM, 'Lluvia de estrellas', 'starFall', 'Cae sin aviso 15 minutos: triple de monedas y hasta 3 premios.'],
    ['cometas', SHOWERS.comet.from, 'Lluvia de cometas', 'cometaLluvia', 'Cae sin aviso 20 minutos: niveles sin gastar boletos, 1 boleto más por victoria y un premio sorpresa.'],
    ['aurora', SHOWERS.aurora.from, 'Aurora', 'aurora', 'Sale sin aviso 20 minutos: doble de fichas de colección y hasta 2 premios.'],
    ['cristales', SHOWERS.crystal.from, 'Lluvia de cristales', 'cristal', 'Cae sin aviso 10 minutos: ayudas al ganar y un premio sorpresa.'],
    ['col', UNLOCK.col, 'Colecciones', 'concha', 'Junta fichas con tus estrellas y cámbialas por exclusivos.'],
    ['mes', UNLOCK.mes, 'Eventos del mes', 'planet', 'Cada mes un evento con sus planetas y premios que solo salen ahí.'],
    ['col2', UNLOCK.col2, 'Más colecciones', 'fosil', 'Llegan colecciones nuevas y hay colección 3 semanas al mes.'],
    ['fiesta', UNLOCK.fiesta, 'Festividades', 'pinata', 'Fiestas de un día con sus niveles y sus premios.'],
    ['col3', UNLOCK.col3, 'Arte, Música y Cine', 'nota', 'Colecciones nuevas: ya hay colección todas las semanas.'],
    ['fiesta2', UNLOCK.fiesta2, 'Leyendas mexicanas', 'catrina', 'Festividades nuevas de leyendas mexicanas.'],
    ['fiesta3', UNLOCK.fiesta3, 'Fiestas de México', 'piramide', 'Día de la Bandera, Equinoccio de Primavera y Las Posadas.'],
    ['fiesta4', UNLOCK.fiesta4, 'Fiestas de América', 'antifaz', 'Festividades de toda América: Carnaval, Alasitas, Tapati, Guelaguetza y más.'],
  ].map(([id, n, name, ico, text]) => ({ id, n: n + 1, k: 'ev', name, pic: icon(ico), text }));
  // Apuesta (9 nov 2026): una parada por cada ×N, con su etiqueta.
  const BET_TXT = { 2: 'En los niveles nuevos apuesta al tocar Jugar y gana hasta el doble de todo. Tu primer ×2 va por nuestra cuenta.', 3: 'Ya puedes apostar ×3 y ganar hasta el triple. Tu primer ×3, gratis.' };
  const bets = betStarts().map(([m, g]) => ({ id: `apuesta${m}`, n: g + 1, k: 'ev', name: m === 2 ? 'Apuestas' : `Apuesta ×${m}`, pic: `<i class="go-bet dbet b${m}">×${m}</i>`, text: BET_TXT[m] || `Ya puedes apostar ×${m} y ganar hasta ×${m} de todo. Tu primer ×${m}, gratis.` }));
  const cards = MECHANICS.filter((m) => TIPS[m]).map((m) => ({ id: m, n: (EXTRA.includes(m) ? extraDebut(m) : MECH_INTRO[m] * LEVELS_PER_WORLD) + 1, k: 'card', name: MECH_NAMES[m], pic: `<span class="rd-card">${mechCard(m)}</span>`, text: MECH_TEXT[m] }));
  const tables = [
    ...ROAD_TABLES.map(([id, name, text]) => ({ id, n: SCROLL_FROM[id] + 1, name, text })),
    { id: 'marea', n: tideFirst() + 1, name: 'Marea', text: 'Cada robo sube el agua y cada carta que juegas la baja.' },
    { id: 'puertas', n: doorsFirst() + 1, name: 'Puertas', text: 'Juega una carta llave y escoge qué puerta abrir: sus cartas salen al tablero.' },
    { id: 'banda', n: bandaFirst() + 1, name: 'Banda transportadora', text: 'Sus cartas dan vueltas: solo ves 4 a la vez y avanza con cada jugada o robo.' },
    { id: 'hoyo', n: holeFirst() + 1, name: 'Agujero negro', text: 'Cada 4 jugadas o robos se traga todas sus cartas y las escupe con los números revueltos.' },
    { id: 'nave', n: MECH_INTRO.ship * LEVELS_PER_WORLD + 1, name: 'Nave ladrona', text: '' },
    { id: 'rocas', n: rocksFirst() + 1, name: 'Asteroides', text: '' },
    { id: 'astro', n: MECH_INTRO.astro * LEVELS_PER_WORLD + 1, name: 'Astronauta', text: '' },
  ].map((x) => ({ ...x, k: 'mesa', pic: x.id === 'nave' ? icon('nave') : x.id === 'astro' ? icon('astronauta') : tableIcon(x.id), text: TABLE_TEXT[x.id] ? TABLE_TEXT[x.id].join(' ') : x.text }));
  // Pasaporte y secretos (12 nov 2026): los sellos y premios ganados, en el nivel en que ibas; el siguiente sello, en el
  // nivel en que llegaría ganando un nivel nuevo por nivel (se mueve si ganas eventos o secretos).
  const P = save.pass || {}, PA = P.at || { s: [], x: [] }, ns = (P.s || 0) + 1;
  const stampTxt = (i) => `Ganaste ${fmt(passGoal(i))} niveles distintos (camino, secretos, eventos y festividades): ${passWhat(passPrize(i))}.`;
  const stampStop = (i, n) => ({ id: `pase${i}`, n, k: 'ev', name: `Sello ${i} del pasaporte`, pic: icon('pasaporte'), text: stampTxt(i) });
  const pass = [
    ...Array.from({ length: P.s || 0 }, (_, i) => stampStop(i + 1, PA.s[i] || roadAt())),
    ...(ns <= PASS_MAX ? [stampStop(ns, Math.min(TOTAL_LEVELS, roadAt() + passGoal(ns) - passCount()))] : []),
    ...Array.from({ length: P.x || 0 }, (_, i) => ({ id: `secreto${i + 1}`, n: PA.x[i] || roadAt(), k: 'ev', name: `${secretGoal(i + 1)} niveles secretos`, pic: icon('starSecret'), text: `Ganaste ${secretGoal(i + 1)} niveles secretos: ${passWhat(secretPrize(i + 1))}.` })),
  ];
  // Ayudas que se venden después de conocer su carta o su mesa (14 nov 2026, pedido del usuario): van con las cartas.
  const helpStop = (id, m, back, name, text) => ({ id, n: MECH_INTRO[m] * LEVELS_PER_WORLD + 1, k: 'card', kind: 'Ayuda nueva', name, pic: `<span class="rd-card"><span class="rd-help" style="background-image:${cardBackURL(back)}"></span></span>`, text });
  const helps = [
    helpStop('ayuda-tele', 'scope', 'htele', 'Telescopio (ayuda)', 'Lo compras en tus ayudas: deja ver todas las cartas del tablero 5 turnos.'),
    helpStop('ayuda-astro', 'astro', 'hastro', 'Astronauta (ayuda)', 'Lo compras en tus ayudas: llega a tu nivel y te guarda una carta.'),
  ];
  const order = Object.keys(ROAD_KINDS);
  return [...evs, ...bets, ...cards, ...helps, ...tables, ...pass].sort((a, b) => a.n - b.n || order.indexOf(a.k) - order.indexOf(b.k));
}
// Nivel en que vas (el siguiente por jugar) y cuántas paradas ya alcanzaste (siempre son las primeras de la lista).
const roadAt = () => Math.min((save.next || 0) + 1, TOTAL_LEVELS);
const roadGot = (items = roadItems()) => items.filter((x) => x.n <= roadAt()).length;
// Puntito: nunca lo ha abierto, o alcanzó algo desde la última vez.
const roadNew = () => save.roadSeen == null || roadGot() > save.roadSeen;
const roadBtn = () => `<button class="iconbtn tb press road-btn${roadNew() ? ' nuevo' : ''}" data-a="camino" aria-label="Tu camino" title="Tu camino">${icon('camino')}${roadNew() ? '<span class="dot"></span>' : ''}</button>`;
const fmtLvl = (n) => n.toLocaleString('es-MX');

function openRoad() {
  const items = roadItems(), at = roadAt(), got = roadGot(items);
  // Lo que alcanzó desde la última vez que lo abrió lleva "¡Nuevo!" (la primera vez, nada).
  const seen = save.roadSeen ?? got;
  save.roadSeen = got;
  persist();
  document.querySelectorAll('#app .road-btn').forEach((b) => (b.classList.remove('nuevo'), b.querySelector('.dot')?.remove()));
  const next = items[got];
  const left = (x) => x.n - at;
  // Rediseño (8 nov 2026): sin tarjeta por parada. El dibujo va sobre la línea; al lado, el nombre y su nivel.
  // Lo alcanzado lleva palomita en el dibujo; lo que falta, "?" y cuántos niveles faltan. Tocar despliega qué es.
  const leftLabel = (x) => (left(x) === 1 ? 'falta 1' : `faltan ${fmtLvl(left(x))}`);
  const row = (x, i) => {
    const on = i < got;
    const more = on ? `<span class="rd-more"><span><em class="rd-kind">${x.kind || ROAD_KINDS[x.k]}</em> ${x.text}</span></span>` : '';
    return `<li class="rd k-${x.k}${on ? ' got' : ' lock'}${x === next ? ' next' : ''}${on && i >= seen ? ' fresh' : ''}" data-k="${x.k}" style="--d:${i % 6}">
      <button class="rd-box"${on ? ' aria-expanded="false"' : ''}>
        <span class="rd-pic">${on ? x.pic : '<b class="rd-q">?</b>'}</span>
        <span class="rd-txt"><b>${on ? x.name : '? ? ? ? ?'}${on && i >= seen ? ' <i class="rd-new">¡Nuevo!</i>' : ''}</b><small>Nivel ${fmtLvl(x.n)}${on ? '' : ` · ${leftLabel(x)}`}</small>${more}</span>
      </button></li>`;
  };
  const me = `<li class="rd-me"><span class="rd-av">${avatarHTML(save)}</span><p class="rd-me-txt"><b>Vas en el nivel ${fmtLvl(at)}</b><small>${next ? `Lo siguiente: en ${left(next) === 1 ? '1 nivel' : `${fmtLvl(left(next))} niveles`}` : '¡Ya descubriste todo!'}</small></p></li>`;
  // Filtros: lo único arriba. Cada uno dice cuántos llevas (antes además había un resumen y una barra: lo mismo 3 veces).
  const chip = (k, label, ico) => {
    const all = k ? items.filter((x) => x.k === k) : items;
    const n = all.filter((x) => x.n <= at).length;
    return `<button class="rd-chip${k ? '' : ' on'}" data-f="${k}" aria-pressed="${!k}"><span class="rd-cl">${ico}<span>${label}</span></span><i>${k ? n : `${n}/${all.length}`}</i></button>`;
  };
  const list = items.map(row);
  list.splice(got, 0, me);
  let io = null;
  const m = openModal({
    title: 'Tu camino',
    color: 'blue',
    wide: true,
    cls: 'road-modal',
    onClose: () => io?.disconnect(),
    body: `<div class="rd-top"><div class="rd-seg" style="--i:0"><span class="rd-ind"></span>${chip('', 'Todo', icon('camino'))}${chip('ev', 'Eventos', icon('star'))}${chip('card', 'Cartas', icon('card'))}${chip('mesa', 'Mesas', icon('planet'))}</div></div>
      <ol class="road" data-f=""><span class="rd-line"></span><span class="rd-fill"></span>${list.join('')}<li class="rd-end">${icon('flag')}<small>¡Y aún hay más por venir!</small></li></ol>`,
  });
  const body = m.el.querySelector('.mbody'), road = m.el.querySelector('.road'), meEl = road.querySelector('.rd-me');
  // La línea dorada llega hasta ti (se recalcula al filtrar).
  const fill = (anim) => {
    const f = road.querySelector('.rd-fill');
    const h = meEl.offsetTop + meEl.offsetHeight / 2;
    if (anim && !reduced()) f.classList.add('grow');
    f.style.height = `${h}px`;
  };
  const toMe = (smooth) => {
    const r = meEl.getBoundingClientRect(), b = body.getBoundingClientRect();
    body.scrollTo({ top: Math.max(0, body.scrollTop + r.top - b.top - body.clientHeight / 2 + r.height / 2), behavior: smooth && !reduced() ? 'smooth' : 'auto' });
  };
  // En pantalla ancha el camino va en zigzag: cada parada visible a un lado de la línea (se recalcula al filtrar).
  const sides = () => {
    let k = 0, prev = null;
    for (const x of road.children) {
      if (x.hidden || x.tagName !== 'LI') continue;
      if (x.classList.contains('rd')) {
        x.classList.toggle('alt', k++ % 2 === 1);
        x.classList.toggle('tuck', !!prev?.classList.contains('rd'));
      }
      prev = x;
    }
  };
  sides();
  // Cada parada entra cuando se ve (en cascada); sin animaciones, todas de una vez.
  if (reduced() || !('IntersectionObserver' in window)) road.classList.add('all-in');
  else {
    io = new IntersectionObserver((es) => {
      es.filter((e) => e.isIntersecting).forEach((e, k) => {
        e.target.style.setProperty('--in', `${k * 55}ms`);
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { root: body, threshold: 0.1 });
    road.querySelectorAll('.rd, .rd-me, .rd-end').forEach((x) => io.observe(x));
  }
  setTimeout(() => (toMe(true), fill(true)), reduced() ? 0 : 560);
  // Las nuevas brillan al llegar a ellas.
  setTimeout(() => road.querySelectorAll('.rd.fresh .rd-pic').forEach((p) => {
    const r = p.getBoundingClientRect();
    if (r.top > 0 && r.bottom < innerHeight) sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 14);
  }), reduced() ? 0 : 1300);
  m.el.addEventListener('click', (e) => {
    const c = e.target.closest('.rd-chip');
    if (c) {
      m.el.querySelectorAll('.rd-chip').forEach((x, k) => (x.classList.toggle('on', x === c), x.setAttribute('aria-pressed', x === c), x === c && m.el.querySelector('.rd-seg').style.setProperty('--i', k)));
      road.dataset.f = c.dataset.f;
      road.querySelectorAll('.rd').forEach((x) => {
        // 10 nov 2026: con filtro solo sale lo ya descubierto (la idea es no saber dónde sale lo que falta).
        const show = !c.dataset.f || (x.dataset.k === c.dataset.f && !x.classList.contains('lock'));
        x.hidden = !show;
        if (show && !reduced()) x.animate([{ opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1 }], { duration: 260, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      });
      sides();
      fill(false);
      // Se vuelve arriba del todo (la lista cambió de alto y el scroll quedaba en cualquier lado).
      body.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    const box = e.target.closest('.rd-box');
    if (!box) return;
    const li = box.closest('.rd');
    // Lo que falta no se abre (diría lo mismo en todas): su "?" tiembla.
    if (li.classList.contains('lock')) {
      if (!reduced()) li.querySelector('.rd-q').animate([{ rotate: '0deg' }, { rotate: '-14deg' }, { rotate: '12deg' }, { rotate: '-6deg' }, { rotate: '0deg' }], { duration: 420, easing: 'ease-out' });
      return buzz(8);
    }
    const open = !li.classList.contains('open');
    li.classList.toggle('open', open);
    box.setAttribute('aria-expanded', open);
    buzz(8);
    // La línea dorada sigue a la marca aunque cambie el alto de las de arriba.
    setTimeout(() => fill(false), 260);
  });
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
  // 9 nov 2026 (con apuesta pueden ser muchos): hasta 10 boletos en filas que caben en la pantalla (parada o acostada),
  // más chicos entre más sean; si cuesta más de 10, cada uno descuenta su parte.
  const V = Math.min(cost, 10);
  let best = null;
  for (let C = V; C >= 1; C--) {
    const R = Math.ceil(V / C), S = Math.min(3, (innerWidth - 32) / (C * 32 + 8), (innerHeight * 0.55) / (R * 36 + 4));
    if (!best || S > best.S) best = { C, R, S };
  }
  const { C, R, S } = best, sx = 32 * S, sy = 36 * S, step = Math.min(280, 1400 / V);
  for (let k = 0; k < V; k++) {
    const row = Math.floor(k / C), inRow = Math.min(C, V - row * C), col = k - row * C;
    const tx = innerWidth / 2 + (col - (inRow - 1) / 2) * sx, ty = innerHeight / 2 + (row - (R - 1) / 2) * sy;
    const dec = Math.floor(((k + 1) * cost) / V) - Math.floor((k * cost) / V);
    const f = document.createElement('div');
    f.className = 'fly-ticket';
    f.innerHTML = icon(ico);
    f.style.cssText = `left:${fx}px;top:${fy}px`;
    document.body.append(f);
    const go = f.animate(
      [
        { translate: '0 0', scale: 0.8, rotate: '0deg', opacity: 0 },
        { translate: '0 0', scale: 1, rotate: '0deg', opacity: 1, offset: 0.1 },
        { translate: `${tx - fx}px ${ty - fy}px`, scale: S * 1.07, rotate: '12deg', opacity: 1, offset: 0.75 },
        { translate: `${tx - fx}px ${ty - fy}px`, scale: S, rotate: '0deg', opacity: 1 },
      ],
      { duration: 760, delay: k * step, easing: 'cubic-bezier(0.3, 0.9, 0.3, 1.1)', fill: 'both' },
    );
    setTimeout(() => {
      label.textContent = shown -= dec;
      label.closest('.pill').animate([{ scale: 1 }, { scale: 0.85 }, { scale: 1 }], { duration: 240, easing: 'ease-out' });
    }, k * step + 80);
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
// ¿Abandonar la partida a medias reinicia la racha? Nivel nuevo, o repetido/secreto que se cerró a medias.
const runLoses = (run) => (run.replay ? !!run.racha : runCounts(run.g));
const runStreak = (run) => {
  const r = dailyStreak();
  if (!runLoses(run) || !isOn('racha') || !r.n) return '';
  return streakWarnHTML(r.n, r.pend.length, 'Si lo abandonas');
};
// chosen: ya escogió la apuesta en su ventana (si no, un nivel nuevo con apuesta abre la ventana primero).
function enterLevel(g, chosen = false) {
  // También en modo dev: así se prueba la puerta (y las monedas de la constelación). La galería entra sin puerta.
  if (worldOf(g) > save.open) return openWorldGate(worldOf(g));
  const run = save.run;
  if (run && run.g === g) return startLevel(g, { resume: true });
  if (run) {
    return openModal({
      title: 'Nivel a medias',
      color: 'orange',
      body: `<p class="lead"><b>${levelName(run.g)}</b> sigue en juego. Termínalo, o abandónalo${run.replay ? '' : ' y pierdes su boleto'}.</p>${betLoseHTML(run.bet, run.paid)}${runStreak(run)}`,
      buttons: [
        {
          label: 'Abandonar y jugar este',
          cls: 'ghost',
          onClick: () => {
            if (runLoses(run)) streakLose(); // abandonar un nivel nuevo (o un repetido a medias) reinicia la racha
            save.run = null;
            persist();
            enterLevel(g);
          },
        },
        { label: `${icon('play')} Continuar ese`, cls: 'green', onClick: () => startLevel(run.g, { resume: true }) },
      ],
    });
  }
  // Apuesta: Jugar abre su ventana para escoger (y ahí dice lo que cuesta). La primera apuesta de todas va forzada
  // y gratis (la ventana no deja bajarla y dice que va por nuestra cuenta); luego boletos × apuesta y su cuota. Si no alcanza no se juega ×1 a
  // escondidas: la ventana de abajo vende lo que falta para la apuesta escogida o deja jugar sin apostar.
  if (betOk(g) && !chosen) return openBet();
  if (betGiftNow(g)) {
    if (entering) return;
    const bet = maxBet(g);
    save.bet = bet;
    save.betFreeN = bet;
    persist();
    return startLevel(g, { bet, paid: { tk: 0, fee: 0, gift: true } });
  }
  const base = entryCost(g), bet = betOk(g) ? betNow(g) : 1;
  // Sin costo (modo dev con boletos infinitos): entra igual con su apuesta.
  if (!base) return startLevel(g, { bet });
  const { tk: cost, fee } = bet > 1 ? betPay(g, bet) : { tk: cometNow() ? 0 : base, fee: 0 };
  if (save.tickets >= cost && save.coins >= fee) {
    if (entering) return;
    entering = true;
    save.tickets -= cost;
    save.coins -= fee;
    persist();
    const payFee = fee ? spendFromWallet('coins', { x: innerWidth / 2, y: innerHeight / 2 }, fee) : Promise.resolve();
    return Promise.all([cost ? spendTickets(cost) : Promise.resolve(updateCoins()), payFee]).then(() => {
      entering = false;
      startLevel(g, { bet, paid: { tk: cost, fee } });
    });
  }
  return openShort(g, bet, cost, fee, base);
}
// Faltan boletos (9 nov 2026, "más creativo"): la taquilla. Una fila de boletos con los que pide la entrada: los que
// tienes de color y los que faltan punteados, latiendo. "Completar" paga y los que faltan caen uno por uno (con
// chispas), el contador sube y entra solo. Con apuesta lleva su etiqueta ×N; si le alcanza para ×1, puede bajarla.
// Si solo faltan monedas (la cuota), lo dice con la moneda.
function openShort(g, bet, cost, fee, base) {
  const have = save.tickets, need = Math.max(0, cost - have), price = need * TICKET_PRICE;
  const plain = bet > 1 && have >= base, broke = save.coins < price + fee;
  const N = Math.min(cost, 10), full = Math.min(N, Math.floor((have / cost) * N));
  const slots = Array.from({ length: N }, (_, i) => `<span class="sh-slot${i < full ? '' : ' miss'}">${icon('ticket')}</span>`).join('');
  const m = openModal({
    title: need ? '¡Faltan boletos!' : '¡Faltan monedas!',
    color: 'pink',
    cls: 'short-modal',
    body: `<div class="sh-booth">${bet > 1 ? `<i class="go-bet b${bet}">×${bet}</i>` : ''}<div class="sh-row">${slots}</div>
        <p class="sh-count"><b data-n="${have}">${have}</b> / ${cost} ${icon('ticket')}</p></div>
      <p class="sh-lead">${need ? `¡Te falta${need === 1 ? '' : 'n'} <b>${need}</b> ${icon('ticket')} para entrar!` : `Te faltan ${coin()} <b>${money(fee - save.coins)}</b> para la apuesta`}</p>`,
    buttons: [
      need && { label: broke ? `Te faltan ${coin()} ${money(price + fee - save.coins)}` : `${icon('ticket')} Completar · ${coin()} ${money(price)}`, cls: 'green wide sh-buy', disabled: broke, keep: true, onClick: (btn) => fill(btn) },
      plain && { label: 'Jugar sin apostar', cls: 'ghost wide', onClick: () => ((save.bet = 1), persist(), paintBetSticker(), enterLevel(g, true)) },
    ].filter(Boolean),
  });
  if (!reduced()) m.el.querySelectorAll('.sh-slot').forEach((el, i) => el.animate([{ opacity: 0, translate: '0 -14px', rotate: '-12deg' }, { opacity: 1, translate: '0 0', rotate: '0deg' }], { duration: 320, delay: 150 + i * 50, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'backwards' }));
  async function fill(btn) {
    m.el.querySelectorAll('.mbtns .btn').forEach((b) => (b.disabled = true));
    save.coins -= price;
    save.tickets += need;
    persist();
    updateCoins();
    countTo(m.el.querySelector('.sh-count b'), save.tickets);
    const miss = [...m.el.querySelectorAll('.sh-slot.miss')];
    for (const el of miss) {
      el.classList.remove('miss');
      el.classList.add('got');
      buzz(8);
      if (!reduced()) {
        const r = el.getBoundingClientRect();
        sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 6);
        await wait(Math.max(70, 420 / miss.length));
      }
    }
    btn.innerHTML = `${icon('check')} ¡Listo!`;
    await wait(reduced() ? 0 : 450);
    m.close();
    enterLevel(g, true);
  }
}

// ---------- Nave de rescate (11 nov 2026, pedido del usuario) ----------
// Si en la galaxia o el planeta ya no te alcanza para el siguiente nivel (sin boletos, sin monedas para comprarlos y
// sin el regalo de boletos listo) y no hay partida a medias, llega una nave y suelta 4 cápsulas: escoges una. Todas
// traen 1 comodín, 3 deshacer y 1 ver cartas 3 s; lo que cambia son los boletos: de los que pide el nivel a 50% más.
// 13 nov 2026 (el usuario): hasta RESCUE_WEEK veces en 7 días y nunca dos el mismo día; cada cápsula trae además
// monedas (RESCUE_COINS, hasta 500), más en la que trae más boletos.
const RESCUE_WEEK = 3;
const RESCUE_COINS = [200, 300, 400, 500];
const RESCUE_ITEMS = { wild: 1, undo: 3, helps: { ver3: 1 } };
const RESCUE_HUES = [['#ff9c5b', '#e2753a'], ['#5fd4c4', '#2fa79a'], ['#ff6f8e', '#e0496b'], ['#a785ff', '#8a5cf0']];
const rescueNeed = () => {
  const g = save.next || 0;
  if (g >= TOTAL_LEVELS || save.run || save.stars[g] || ticketLeft() <= 0) return 0;
  const need = ticketCost(g);
  return save.tickets < need && save.coins < (need - save.tickets) * TICKET_PRICE ? need : 0;
};
// Las veces que llegó en los últimos 7 días (antes se guardaba solo la última, save.rescueAt).
const rescueLog = () => (save.rescues ||= save.rescueAt ? [save.rescueAt] : []).filter((t) => Date.now() - t < 7 * 864e5);
const rescueReady = () => {
  const log = rescueLog();
  return log.length < RESCUE_WEEK && !log.some((t) => new Date(t).toDateString() === new Date().toDateString());
};
const rescueDue = () => !!rescueNeed() && rescueReady();
// Cada cápsula: boletos de need a need × 1.5 (redondeado arriba) y sus monedas; revueltas.
const rescueBoxes = (need) => {
  const top = Math.ceil(need * 1.5);
  return [0, 1, 2, 3].map((k) => ({ tickets: need + Math.round((k * (top - need)) / 3), coins: RESCUE_COINS[k] })).sort(() => Math.random() - 0.5);
};
// 12 nov 2026 (el usuario: sin ventana y con más producción): se oscurece la pantalla y la nave cruza despacio echando
// humo; al pasar suelta las cápsulas, que bajan con paracaídas a su lugar (2×2 parado, en fila acostado). Al tocar una:
// tiembla, se le va el paracaídas, salta la tapa y salen en burbujas todos sus premios (ya quedaron en tu inventario);
// las demás pierden el paracaídas y se caen, y todo se va. No se dice qué traían las otras.
// Una sola a la vez: si ya va una (p. ej. los avisos vuelven a empezar al girar), se espera esa.
let rescueRun = null;
function openRescue(need) {
  return (rescueRun ||= playRescue(need).finally(() => (rescueRun = null)));
}
async function playRescue(need = rescueNeed() || ticketCost(Math.min(save.next || 0, TOTAL_LEVELS - 1))) {
  const screen = document.querySelector('#app .screen.galaxy');
  if (!screen) return;
  const boxes = rescueBoxes(need), fast = reduced();
  const back = h(`<div class="rs-back keep-turn"><div class="rs-title"><b class="outl">¡Nave de rescate!</b><span>¿Sin boletos? <b>Escoge una cápsula.</b></span></div>
    <div class="rs-ship"><span class="rs-fire"></span>${icon('rocket')}</div></div>`);
  screen.append(back);
  // El monedero queda encima de lo oscuro (también el de la pantalla nueva si giras).
  const lift = (on) => document.querySelector('#app .screen .res')?.classList.toggle('feat-lift', on);
  lift(true);
  back.addEventListener('remount', () => lift(true));
  // Lugares de las cápsulas (centro de cada una), la altura de la nave y el tamaño: se vuelven a medir si giras el
  // teléfono a la mitad (12 nov 2026: antes se quedaban con las medidas viejas, fuera de la vista).
  let W, H, land, cw, slots, sy;
  const caps = boxes.map((n, i) => {
    const c = h(`<button class="rs-cap" aria-label="Cápsula ${i + 1}"><span class="rs-chute">${capChute(RESCUE_HUES[i])}</span><span class="rs-pod">${capBody(RESCUE_HUES[i])}<span class="rs-lid">${capLid(RESCUE_HUES[i])}</span></span></button>`);
    c.disabled = true;
    // Escondida hasta que la nave la suelta (antes ya estaban abajo cuando llegaba la nave).
    if (!fast) c.style.opacity = '0';
    back.append(c);
    return c;
  });
  const ship = back.querySelector('.rs-ship');
  const layout = () => {
    W = back.clientWidth; H = back.clientHeight; land = W > H;
    cw = land ? Math.min(150, W / 5.5, H / 3.2) : Math.min(150, W / 3);
    slots = land
      ? [0, 1, 2, 3].map((k) => ({ x: W / 2 + (k - 1.5) * cw * 1.2, y: H * 0.6 }))
      : [0, 1, 2, 3].map((k) => ({ x: W / 2 + (k % 2 ? 0.62 : -0.62) * cw, y: H * (k < 2 ? 0.46 : 0.7) }));
    sy = H * (land ? 0.2 : 0.24);
    ship.style.top = `${sy}px`;
    caps.forEach((c, i) => {
      c.style.setProperty('--w', `${cw}px`);
      c.style.left = `${slots[i].x}px`;
      c.style.top = `${slots[i].y}px`;
    });
  };
  layout();
  const ro = new ResizeObserver(() => back.isConnected && (back.clientWidth !== W || back.clientHeight !== H) && layout());
  ro.observe(back);
  const anim = (node, kf, o) => (fast ? Promise.resolve() : node.animate(kf, { fill: 'forwards', ...o }).finished.catch(() => {}));
  return new Promise((done) => {
    let picked = false;
    const finish = async () => {
      await anim(back, [{ opacity: 1 }, { opacity: 0 }], { duration: 450, delay: 500 });
      ro.disconnect();
      back.remove();
      lift(false);
      updateCoins();
      done();
    };
    // Entra lo oscuro y el letrero; la nave cruza despacio (con humo) y suelta cada cápsula al pasar por su columna.
    anim(back, [{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
    const title = back.querySelector('.rs-title');
    anim(title, [{ translate: '0 -60px', opacity: 0 }, { translate: '0 6px', opacity: 1, offset: 0.7 }, { translate: '0 0', opacity: 1 }], { duration: 600, delay: 300, easing: 'ease-out' });
    // 12 nov 2026: cruza en 3 s (antes 5.2). Va de orilla a orilla con left en %, así sigue bien aunque gires.
    const D = 3000, x0 = -140;
    const shipAt = (x) => (x - x0) / (W + 280);
    if (!fast) {
      ship.animate([{ left: `${x0}px` }, { left: 'calc(100% + 140px)' }], { duration: D, delay: 500, easing: 'cubic-bezier(0.35, 0.1, 0.65, 0.9)', fill: 'both' });
      ship.animate([{ rotate: '-3deg' }, { rotate: '3deg' }], { duration: 900, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', composite: 'add' });
      const t0 = performance.now() + 500;
      const smoke = setInterval(() => {
        if (!back.isConnected || performance.now() > t0 + D) return clearInterval(smoke);
        const r = ship.getBoundingClientRect(), b = back.getBoundingClientRect();
        if (r.right < b.left) return;
        const p = h('<i class="rs-puff"></i>');
        p.style.cssText = `left:${r.left - b.left + 6}px;top:${r.top - b.top + r.height / 2 + (Math.random() - 0.5) * 14}px`;
        back.insertBefore(p, ship);
        p.animate([{ scale: 0.4, opacity: 0.9 }, { scale: 2.4, opacity: 0, translate: `${-30 - Math.random() * 30}px ${(Math.random() - 0.5) * 30}px` }], { duration: 1300, easing: 'ease-out' }).finished.then(() => p.remove());
      }, 70);
    }
    const drop = (c, i) => {
      const s = slots[i];
      c.style.opacity = '';
      return anim(c, [{ translate: `0 ${sy - s.y}px`, scale: 0.35, opacity: 0 }, { translate: `0 ${sy - s.y + 30}px`, scale: 0.6, opacity: 1, offset: 0.12 }, { translate: '0 8px', scale: 1, opacity: 1, offset: 0.85 }, { translate: '0 0', scale: 1, opacity: 1 }], { duration: 1700, easing: 'cubic-bezier(0.2, 0.6, 0.35, 1)' })
        .then(() => { if (!picked) (c.disabled = false), c.classList.add('sway'); });
    };
    const order = caps.map((c, i) => i).sort((a, b) => slots[a].x - slots[b].x || slots[a].y - slots[b].y);
    const drops = order.map((i, k) => wait(fast ? 0 : 500 + D * shipAt(slots[i].x) + (k % 2 && !land ? 180 : 0)).then(() => { buzz(8); return drop(caps[i], i); }));
    Promise.all(drops).then(() => anim(title.querySelector('span'), [{ scale: 1 }, { scale: 1.1 }, { scale: 1 }], { duration: 500 }));
    back.addEventListener('click', async (e) => {
      const c = e.target.closest('.rs-cap');
      if (!c || picked || c.disabled) return;
      picked = true;
      const i = caps.indexOf(c), p = { ...boxes[i], ...RESCUE_ITEMS };
      caps.forEach((x) => ((x.disabled = true), x.classList.remove('sway')));
      // Ya es tuyo (si cierras la app a la mitad, no se pierde).
      save.tickets += p.tickets;
      save.coins += p.coins;
      save.wild += p.wild;
      save.undo += p.undo;
      for (const [k, n] of Object.entries(p.helps)) save.helps[k] = (save.helps[k] || 0) + n;
      save.rescues = [...rescueLog(), Date.now()];
      delete save.rescueAt;
      persist();
      buzz(15);
      anim(title, [{ opacity: 1 }, { opacity: 0, translate: '0 -30px' }], { duration: 300 });
      await anim(c, [{ rotate: '0deg' }, { rotate: '-9deg' }, { rotate: '9deg' }, { rotate: '-7deg' }, { rotate: '7deg' }, { rotate: '0deg' }], { duration: 560 });
      anim(c.querySelector('.rs-chute'), [{ translate: '0 0', opacity: 1 }, { translate: '0 -160px', rotate: '20deg', opacity: 0 }], { duration: 700, easing: 'ease-in' });
      anim(c.querySelector('.rs-lid'), [{ translate: '0 0', rotate: '0deg' }, { translate: '-22px -60px', rotate: '-45deg', offset: 0.5 }, { translate: '-34px -10px', rotate: '-90deg', opacity: 0 }], { duration: 560, easing: 'ease-out' });
      c.classList.add('open');
      buzz(30);
      const r = c.querySelector('.rs-pod').getBoundingClientRect(), at = { x: r.left + r.width / 2, y: r.top + r.height / 3 };
      sparkle(at, 30);
      if (!fast) confetti(60);
      // Todos sus premios salen en burbujas para tronarlas; los boletos y las monedas además vuelan al monedero.
      floatBubbles(prizeIcons(p), at);
      wait(fast ? 0 : 500).then(() => flyToWallet('tickets', at, p.tickets));
      wait(fast ? 0 : 750).then(() => flyToWallet('coins', at, p.coins));
      // Las demás pierden el paracaídas y se caen dando vueltas.
      caps.filter((x) => x !== c).forEach((x, k) => {
        anim(x.querySelector('.rs-chute'), [{ translate: '0 0', opacity: 1 }, { translate: '0 -90px', opacity: 0 }], { duration: 500, delay: 250 + k * 120 });
        anim(x, [{ translate: '0 0', rotate: '0deg' }, { translate: '0 -14px', rotate: `${k % 2 ? 8 : -8}deg`, offset: 0.15 }, { translate: `${(k - 1) * 40}px ${H}px`, rotate: `${k % 2 ? 160 : -160}deg` }], { duration: 1300, delay: 350 + k * 120, easing: 'cubic-bezier(0.55, 0, 0.9, 0.5)' });
      });
      // La tuya se queda un momento abierta y se va.
      await wait(fast ? 0 : 1400);
      anim(c, [{ scale: 1, opacity: 1 }, { scale: 0.6, opacity: 0, translate: '0 30px' }], { duration: 400 });
      finish();
    });
  });
}

// ---------- Partida ----------
// resume: retoma save.run · free: modo dev (sin boletos y sin guardar la partida) · anim: transición
// bet: apuesta (8 nov 2026; la partida guardada recuerda la suya)
// paid: lo que pagó al entrar con apuesta ({ tk, fee, gift }), para decírselo si abandona.
function startLevel(g, { resume = false, free = false, anim = 'up', bet = 1, paid = null } = {}) {
  const old = [...app.children];
  game?.destroy();
  game = null;
  document.getElementById('modal-root').replaceChildren();
  const run = resume ? save.run : null;
  const v = run ? run.v : save.tries[g] || 0;
  // Se guarda la partida de un nivel aún no ganado (el que cuesta boleto); repetir uno ganado se pierde al salir.
  // Un repetido o secreto también se guarda en cuanto juegas algo (run.replay), pero solo para cuando se cierra la app
  // a medias: al volver, Jugar apunta a ese nivel y para jugar otro hay que abandonarlo (y se pierde la racha).
  // Salir desde la pausa sigue perdiendo el intento.
  const saved = run ? !run.replay : !free && !save.stars[g] && !isSecret(g);
  const mult = run ? run.bet || 1 : bet;
  const betPaid = run ? run.paid || null : mult > 1 ? paid : null;
  if (!run) {
    save.tries[g] = v + 1;
    if (saved) save.run = { g, v, state: null, sig: null, ...(mult > 1 && { bet: mult, paid: betPaid }) };
    persist();
  }
  const level = variantLevel(generateLevel(g), v);
  // Firma del tablero: si el nivel cambió de forma (p. ej. formas nuevas de la Fase 7), la partida guardada ya no
  // le queda y se empieza de nuevo (sin cobrar boleto: es el mismo intento).
  const sig = `${level.template}:${level.cards.length}:${level.stock.length}`;
  if (run && run.sig !== sig) run.state = null;
  // Cuenta para la racha: nivel nuevo del camino o secreto aún no ganado (no repetir, no la galería dev).
  const won = isSecret(g) ? !!save.secret[worldOf(g)] : !!save.stars[g];
  const counts = !free && !won && (isSecret(g) || g <= save.next);
  // Repetir un nivel ganado: no suma a la racha, pero rendirse o abandonar la reinicia.
  const replay = !free && won;
  const back = () => (dev.on && gallery.active ? showGallery() : showWorld(worldOf(g), 'down'));
  const clearRun = () => {
    if (save.run?.g === g) save.run = null;
    persist();
  };
  // Lluvia de meteoritos: si cae al empezar, el nivel cuenta aunque se gane cuando ya terminó (no en la galería dev).
  const met0 = free ? null : meteor()?.id;
  game = new Game(app, level, {
    dev,
    meteor: met0 ? meteor().K : null,
    resume: run?.state,
    saved,
    bet: mult,
    betPaid,
    // Desde la constelación 2 no hay Guardar y salir (7 nov 2026); si cierra la app tiene RUN_LIMIT para volver.
    canExit: !(saved && g >= NO_EXIT_FROM),
    free: !!save.stars[g] || isSecret(g) || free || dev.infinite, // intento que no costó boleto
    noTrack: free, // la galería del modo dev no cuenta para misiones ni logros
    noAchieve: replay, // 12 nov 2026 (el usuario): repetir un nivel ya ganado no cuenta para los logros (sí para misiones)
    tutorial: g === 0 && !save.tutorial,
    racha: counts && isOn('racha') ? { n: dailyStreak().n, ico: streakTheme().ico, hot: streakHot() } : null,
    onSave: saved
      ? (state) => {
          save.run = { g, v, state, sig, at: Date.now(), ...(mult > 1 && { bet: mult, paid: betPaid }) };
          persist();
        }
      : free
        ? null
        : (state) => {
            // Sin jugadas (o deshechas todas) no hay nada a medias.
            if (!state.history?.length) {
              if (save.run?.g === g && save.run.replay) (save.run = null), persist();
              return;
            }
            save.run = { g, v, state, sig, replay: true, racha: counts || replay };
            persist();
          },
    onExit: back,
    // Si la racha está abierta y va en algo, las ventanas de rendirse/abandonar lo dicen.
    rachaRisk: () => ((counts || replay) && isOn('racha') && dailyStreak().n ? { n: dailyStreak().n, pend: dailyStreak().pend.length, isNew: counts } : null),
    // gaveUp: se rindió o abandonó (no solo salió de un nivel repetido sin jugar).
    onAbandon: (gaveUp) => {
      if ((counts && gaveUp !== false) || (replay && gaveUp)) streakLose();
      clearRun();
      back();
    },
    // Sin las 3 estrellas: lo vuelve a jugar ya (gratis, porque ya lo ganó).
    onReplay: () => startLevel(g),
    // Tras la ventana de victoria: de vuelta al planeta, con el avance animado (o a la galería en dev).
    onDone: async (res) => {
      if (dev.on && gallery.active) return showGallery();
      if (res.met?.prize?.items) await openMetPrize(res.met.prize.items, res.met.kind);
      const w = worldOf(g);
      const go = () => showMap({ start: w, anim: 'down', after: res.counted ? { g, w, res } : null });
      if (res.chest) return openBossReward(w, res).then(go);
      if (res.seal) return openSecretSeal(w).then(go);
      go();
    },
    onWin: (stars) => {
      clearRun();
      const w = worldOf(g);
      // Nivel secreto: de 1.5 a 2.5 veces el jefe de su mundo, según las estrellas. Comodín y deshacer por
      // probabilidad, solo la primera vez que se saca con 3 estrellas; con menos, solo monedas.
      if (isSecret(g)) {
        const prev = save.secret[w] || 0;
        const met = metWin(free ? null : meteor()?.id || met0, stars);
        const boss = w * LEVELS_PER_WORLD + LEVELS_PER_WORLD - 1;
        const coins = metCoins(boosted(secretCoins(coinsFor(boss, stars, prev)), save.coins, boss), met);
        const bonus = stars >= 3 && prev < 3 ? rollSecret() : {};
        const wild = bonus.wild || 0, undo = bonus.undo || 0;
        const tokenCount = colWin(stars, prev, met?.col || 1);
        save.secret[w] = Math.max(prev, stars);
        save.coins += coins;
        save.wild += wild;
        save.undo += undo;
        const dailyStreak = counts && isOn('racha') ? streakWin(stars) : null;
        persist();
        updateCoins();
        // Primera vez con 3 estrellas: la postal del mundo gana el sello secreto (se celebra al continuar).
        return { coins, tickets: met?.prize?.tickets || 0, prev, wild: wild + (met?.prize?.wild || 0) + (met?.gift === 'wild' ? 1 : 0), undo: undo + (met?.prize?.undo || 0) + (met?.gift === 'undo' ? 1 : 0), helps: giftHelps(met), met, counted: true, first: !prev, racha: dailyStreak, replay: !free, seal: stars >= 3 && prev < 3, col: tokenCount ? { n: tokenCount, ico: col().token } : null };
      }
      // En modo dev se puede saltar a cualquier nivel: solo cuenta si ya estaba desbloqueado.
      if (g > save.next) return { coins: 0, tickets: 0, prev: 0, replay: !free };
      const prev = save.stars[g] || 0;
      const met = metWin(free ? null : meteor()?.id || met0, stars);
      // Si va corto de monedas para su avance, el nivel paga más (boosted; nunca menos de lo normal).
      // Apuesta: todo × apuesta (monedas, boletos, fichas, cofre y el premio de la lluvia de meteoritos).
      const coins = metCoins(boosted(coinsFor(g, stars, prev), save.coins, g), met) * mult;
      // La primera victoria devuelve los boletos que cuesta el nivel.
      // Lluvia de cometas: además, sus boletos de más (no se multiplican con la apuesta).
      const tickets = (prev ? 0 : ticketRefund(g) * mult) + (met?.tk || 0);
      // El jefe da el boleto dorado para abrir el mundo siguiente (solo la primera vez).
      // El del último mundo de cada constelación da el boleto de constelación (abre la siguiente; 8 nov 2026).
      const bossTk = !prev && level.boss && w + 1 < WORLD_COUNT ? 1 : 0;
      const gold = w % 10 === 9 ? 0 : bossTk, cgold = w % 10 === 9 ? bossTk : 0;
      const tokenCount = colWin(stars, prev, mult * (met?.col || 1));
      save.stars[g] = Math.max(prev, stars);
      save.coins += coins;
      save.tickets += tickets;
      save.gold += gold;
      save.cgold = (save.cgold || 0) + cgold;
      const streakOn = isOn('racha'); // la racha cuenta desde el nivel siguiente al que la abre
      if (g >= save.next) save.next = g + 1;
      if (g === 0) save.tutorial = true;
      // Cofre del jefe (primera vez): según el % de estrellas del mundo. Se guarda ya, aunque salgas antes de verlo.
      let chest = null;
      if (level.boss && !prev) {
        chest = rollChest(worldStars(w));
        // Último mundo de la constelación: además, el premio de constelación (va en el mismo cofre).
        if (w % 10 === 9) {
          chest.constel = true;
          for (const k of ['coins', 'wild', 'undo']) chest[k] = (chest[k] || 0) + CONST_PRIZE[k];
        }
        for (const k of ['coins', 'wild', 'undo']) if (chest[k]) chest[k] *= mult;
        if (mult > 1) chest.bet = mult;
        save.coins += chest.coins || 0;
        save.undo += chest.undo || 0;
        save.wild += chest.wild || 0;
      }
      // La lluvia de meteoritos ya dio su comodín o deshacer (metWin): con apuesta se suman los que faltan.
      const mw = (met?.prize?.wild || 0) * mult, mu = (met?.prize?.undo || 0) * mult;
      save.wild += mw - (met?.prize?.wild || 0);
      save.undo += mu - (met?.prize?.undo || 0);
      const dailyStreak = counts && !prev && streakOn ? streakWin(stars) : null;
      persist();
      updateCoins();
      // Repetir desde la victoria salta el festejo del mapa: no se ofrece si toca abrir el mundo siguiente.
      // Los boletos del premio de la lluvia ya los guardó metWin: aquí solo se enseñan.
      return { bet: mult, coins, tickets: tickets + (met?.prize?.tickets || 0), prev, gold, cgold, chest, wild: mw + (met?.gift === 'wild' ? 1 : 0), undo: mu + (met?.gift === 'undo' ? 1 : 0), helps: giftHelps(met), met, worldStars: worldStars(w), counted: true, first: !prev, racha: dailyStreak, replay: !free && !chest, col: tokenCount ? { n: tokenCount, ico: col().token } : null };
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
  diffTag(game, level);
}

// ---------- Galería (modo dev) ----------
function showGallery(start) {
  // Se jugó una mesa desde la galería de planetas: se vuelve a esa.
  if (start == null && planetGal.active) return showPlanets();
  planetGal.active = false;
  current = () => showGallery();
  if (start != null) {
    gallery.start = Math.max(0, start - (start % 24));
    if (gallery.src !== 'camino' || isSecret(start)) gallery.src = 'camino'; // ir a un nivel del camino
  }
  mount(galleryScreen({ onPlay: (g) => startLevel(g, save.run?.g === g ? { resume: true, anim: null } : { free: true, anim: null }), onPlayLevel: playDevLevel, onBack: () => showMap() }));
}
// Dev (11 nov 2026, pedido del usuario): ir directo al tablero de un nivel, como al tocarlo en la galería (gratis, sin
// guardar; al salir vuelves a la galería).
function openGoLevel() {
  const m = openModal({ title: 'Ir al tablero', color: 'gray',
    body: `<p class="lead">¿Qué nivel? (1 a ${fmt(TOTAL_LEVELS)})</p><input class="text-in go-lvl" type="number" inputmode="numeric" min="1" max="${TOTAL_LEVELS}" value="${Math.min((save.next || 0) + 1, TOTAL_LEVELS)}">`,
    buttons: [{ label: 'Jugar', cls: 'green', keep: true, onClick: () => go() }] });
  const input = m.el.querySelector('.go-lvl');
  const go = () => {
    const n = Math.round(+input.value);
    if (!(n >= 1 && n <= TOTAL_LEVELS)) return toast(`Escribe un nivel del 1 al ${fmt(TOTAL_LEVELS)}`);
    document.getElementById('modal-root').replaceChildren();
    gallery.active = true;
    startLevel(n - 1, { free: true, anim: null });
  };
  input.addEventListener('keydown', (e) => e.key === 'Enter' && go());
  setTimeout(() => (input.focus(), input.select()), 50);
}
// Modo dev: jugar un tablero del evento del mes o de una festividad desde la galería, con su mesa, sin guardar nada.
function playDevLevel(level, look) {
  const old = [...app.children];
  game?.destroy();
  game = null;
  document.getElementById('modal-root').replaceChildren();
  const back = () => showGallery();
  game = new Game(app, level, {
    dev,
    free: true,
    noTrack: true,
    event: look,
    onExit: back,
    onAbandon: back,
    onReplay: () => playDevLevel(level, look),
    onDone: back,
    onWin: () => ({ coins: 0, tickets: 0, prev: 0, title: '¡Nivel superado!' }),
  });
  const drop = () => old.forEach((o) => (o._dispose?.(), o.remove()));
  if (old.length && !reduced()) game.el.animate([{ translate: '0 100%' }, { translate: '0 0' }], { duration: 560, easing: 'cubic-bezier(0.2, 0.9, 0.25, 1)' }).finished.then(drop, drop);
  else drop();
  game.attachDev = () => attachDevBar(game, { go: () => toast('Cambia de nivel desde la galería'), toGallery: back });
  current = null;
  if (dev.on) game.attachDev();
}
// Galería de planetas (modo dev): al volver de su mesa o de su planeta se regresa aquí.
function showPlanets() {
  current = () => showPlanets();
  mount(planetsScreen({ onWorld: (w) => showWorld(w, null), onPlay: (g) => (gallery.active = true, startLevel(g, { free: true, anim: null })), onBack: () => showMap() }));
}

// ---------- Tienda ----------
// Solo cosas para verse bonito (nada ayuda a ganar). Catálogo y compras en shop.js.
// Comprar: las monedas salen del monedero hacia la pieza, que salta con chispas y queda puesta.
// 9 nov 2026: sin leyendas debajo de las pestañas (el usuario); cada sección lleva su icono.
const SHOP_ICO = { avatar: 'disfraz', ring: 'star', title: 'crown', back: 'card', face: 'face', traveler: 'rocket', space: 'planet', frame: 'album' };
// La tienda se separa por de dónde sale cada cosa. Los exclusivos solo se ven si ya son tuyos.
const ORIGINS = [
  { k: 'tienda', name: 'De la tienda', ico: 'bag' },
  { k: 'col', name: 'Colección de la semana', ico: 'gift' },
  { k: 'mes', name: 'Evento del mes', ico: 'star' },
  { k: 'fiesta', name: 'Festividades de un día', ico: 'flame' },
  { k: 'codigo', name: 'Tesoro escondido · con código', ico: 'cofre' },
  { k: 'meteoro', name: 'Lluvia de meteoritos', ico: 'meteoro' },
  { k: 'estrellas', name: 'Lluvia de estrellas', ico: 'starFall' },
  { k: 'cometas', name: 'Lluvia de cometas', ico: 'cometaLluvia' },
  { k: 'aurora', name: 'Aurora', ico: 'aurora' },
  { k: 'cristales', name: 'Lluvia de cristales', ico: 'cristal' },
  { k: 'logro', name: 'Logros', ico: 'trophy' },
  { k: 'pasaporte', name: 'Pasaporte', ico: 'pasaporte' },
  { k: 'secretos', name: 'Niveles secretos', ico: 'starSecret' },
];
// De qué evento salió un exclusivo: { g: grupo de ORIGINS, ico, name } (o null si es de la tienda).
function exFrom(it) {
  if (!it.ev) return null;
  if (it.code) return { g: 'codigo', ico: 'cofre', name: 'Código de regalo' };
  if (it.met) return { g: 'meteoro', ico: 'meteoro', name: 'Lluvia de meteoritos' };
  if (it.star) return { g: 'estrellas', ico: 'starFall', name: 'Lluvia de estrellas' };
  if (it.rain) return { g: it.ev, ico: SHOWERS[it.rain].ico, name: SHOWERS[it.rain].name };
  if (it.logro) return { g: 'logro', ico: 'trophy', name: 'Logros' };
  if (it.pase) return { g: 'pasaporte', ico: 'pasaporte', name: 'Pasaporte' };
  if (it.secreto) return { g: 'secretos', ico: 'starSecret', name: 'Niveles secretos' };
  const f = FESTIVALS.find((x) => x.key === it.ev);
  if (f) return { g: 'fiesta', ico: f.ico, name: f.name };
  const e = Object.values(EVENTS).find((x) => x.key === it.ev);
  if (e) return { g: 'mes', ico: e.ico, name: e.name };
  const c = COLLECTIONS.find((x) => x.key === it.ev);
  return c ? { g: 'col', ico: c.token, name: c.name } : null;
}
const inUse = (sec, k) => (sec === 'avatar' ? save.look === 'char' && save.char === k : equipped(sec) === k);
function shopPreview(sec, k) {
  if (sec === 'avatar') return avatarHTML({ ...save, look: 'char', char: k }, 'huge');
  if (sec === 'ring') return avatarHTML({ ...save, ring: k }, 'huge');
  if (sec === 'traveler') return `<canvas class="trav-prev" data-kind="${k}"></canvas>`;
  if (sec === 'back') return `<div class="card-prev" style="background-image:${cardBackURL(k)}"></div>`;
  if (sec === 'face') return `<div class="face-prev face-${k}"><div class="card up">${faceHTML({ rank: 6, suit: 1 })}</div><div class="card up">${faceHTML({ rank: 12, suit: 0 })}</div></div>`;
  if (sec === 'space') return `<div class="space-prev space-${k}"><div class="space"></div>${miniPlanet(['#86cf5c', '#4d9f45', '#2f86c8', '#ffc83d'])}</div>`;
  if (sec === 'frame') return `<div class="frame-prev">${postcardHTML(0, 24, 'mini', k)}</div>`;
  return `<div class="title-prev">${titleHTML(k)}</div>`;
}
let shelf = null; // vitrina 3D de los viajeros: un solo lienzo WebGL mientras se ven
const closeShelf = () => (shelf?.dispose(), (shelf = null));
const travShelf = (root) => import('./travelers.js').then(({ TravelerShelf }) => {
  closeShelf();
  const slots = [...root.querySelectorAll('canvas[data-kind]')].map((c) => ({ canvas: c, kind: c.dataset.kind }));
  if (slots.length && root.isConnected) shelf = new TravelerShelf(slots);
});
// Arriba 3 grupos (Tú · Cartas · Viaje), abajo sus secciones. Así todo cabe en un teléfono.
// Paquetes (9 nov 2026): la colección de cada personaje en tarjetas; al tocar una se abre su ficha. Va como un grupo
// más de la tienda, después de Viaje, con una sola sección (sin pestañas abajo).
const SHOP_GROUPS = [...GROUPS, { k: 'sets', name: 'Paquetes', ico: 'gift', secs: ['sets'] }];
const shopGroupOf = (sec) => SHOP_GROUPS.find((g) => g.secs.includes(sec));
// Lo de la tienda en orden: lo gratis, luego por el mundo donde se abre y por precio (antes iban en el orden en que se
// agregaron y había cosas comprables después de otras con candado).
const byWorld = (a, b) => (b.price === 0) - (a.price === 0) || (a.need || 0) - (b.need || 0) || a.price - b.price;
// Las piezas de un personaje (su avatar primero) y lo que costaría llevarse lo que falta.
const setPieces = (av) => [{ sec: 'avatar', k: av }, ...setItems().filter((x) => x.set === av)].map(({ sec, k }) => ({ sec, k, it: item(sec, k) }));
// Los descuentos se suman: el de la lluvia de meteoritos (si cae) en cada pieza y luego el del paquete. full = lo
// que costaría sin ningún descuento (es lo que va tachado).
function setDealOf(av, pieces = setPieces(av)) {
  const met = saleRain(), cost = (it) => metShopPrice(it.price, met);
  const rest = pieces.filter((p) => !owns(p.sec, p.k)), full = rest.reduce((n, p) => n + p.it.price, 0);
  return { rest, full, met, pay: Math.round((rest.reduce((n, p) => n + cost(p.it), 0) * (1 - SET_DEAL)) / 5) * 5, lock: rest.map((p) => lockedUntil(p.sec, p.k)).find(Boolean), n: pieces.length };
}
function openShop(tab = 'avatar') {
  const was = { traveler: equipped('traveler') };
  // Lo recién abierto lleva su etiqueta mientras la tienda está abierta; el punto rojo se quita.
  save.shopSeen ??= save.open;
  const fresh = (it) => !it.ev && it.need && it.need <= save.open && it.need > save.shopSeen;
  const seenBefore = save.shopSeen;
  save.shopSeen = save.open;
  persist();
  document.querySelectorAll('[data-a="shop"]').forEach((b) => (b.outerHTML = ibtn('bag', 'Tienda', 'shop', false)));
  const m = openModal({
    title: `${icon('bag')}Tienda`,
    color: 'orange',
    wide: true,
    cls: 'shop-modal',
    body: `<div class="shead"><div class="sgroups">${SHOP_GROUPS.map((g) => `<button class="sgroup" data-group="${g.k}">${icon(g.ico)}<span>${g.name}</span></button>`).join('')}</div>
      <div class="stabs"></div>
      ${saleRain() ? `<p class="met-sale">${icon(saleRain().K.ico)}${saleRain().K.name}: <b>−${Math.round(saleRain().K.shop * 100)}%</b> en toda la tienda</p>` : ''}</div><div class="sgrid"></div>`,
    onClose: () => {
      closeShelf();
      // El viajero vive en la escena 3D: al cambiarlo se vuelve a armar el mapa.
      if (equipped('traveler') !== was.traveler) current?.();
    },
  });
  // Tus monedas en la barra de arriba, a la izquierda (9 nov 2026).
  m.el.querySelector('.mhead').insertAdjacentHTML('afterbegin', `<span class="smoney">${coin()}<b data-shop-coins>${fmt(save.coins)}</b></span>`);
  const grid = m.el.querySelector('.sgrid'), tabs = m.el.querySelector('.stabs');
  // Lluvia de meteoritos: 10% menos en toda la tienda (se ve el precio tachado).
  const cost = (it) => metShopPrice(it.price, saleRain());
  const card = (sec, it) => {
    const own = owns(sec, it.k), on = inUse(sec, it.k), lock = lockedUntil(sec, it.k);
    const foot = on ? `<span class="s-on">${icon('check')}En uso</span>`
      : own ? '<span class="s-use">Usar</span>'
      : lock ? `<span class="s-lock">${icon('lock')}Mundo ${lock}</span>`
      : `<span class="s-price ${save.coins < cost(it) ? 'short' : ''}">${coin()}${cost(it) < it.price ? `<s>${fmt(it.price)}</s>` : ''}${fmt(cost(it))}</span>`;
    const ex = exFrom(it);
    // Lo tuyo se puede vender (70%): una etiqueta abajo a la derecha.
    const onSale = sellable(sec, it) ? `<span class="s-sell" data-sell role="button" aria-label="Vender" title="Vender">${icon('tag')}</span>` : '';
    const isNew = !own && !it.ev && it.need && it.need <= save.open && it.need > seenBefore;
    return `<button class="sitem ${on ? 'on' : ''} ${own ? 'own' : ''} ${lock ? 'locked' : ''}" data-k="${it.k}" data-sec="${sec}">${isNew ? '<i class="s-new">¡Nuevo!</i>' : ''}${ex ? `<i class="s-ev" title="${ex.name}">${icon(ex.ico)}</i>` : ''}<div class="s-art">${shopPreview(sec, it.k)}</div>${sec === 'title' ? '' : `<b>${it.name}</b>`}${it.text ? `<small>${it.text}</small>` : ''}${foot}${onSale}</button>`;
  };
  // Confirmar antes de vender (o de comprar un recuerdo): son monedas grandes.
  // look: clase extra de la ventana (un marco la viste con su estilo, como la ficha de su paquete).
  const confirm = ({ title, text, label, cls = 'green', look = '', onYes }) => {
    const c = openModal({
      title,
      color: 'orange',
      body: `<div class="lead">${text}</div>`,
      cls: `buy-modal ${look}`,
      buttons: [{ label, cls: `${cls} grow`, onClick: onYes }, { label: 'Ahora no', cls: 'later' }],
    });
    return c;
  };
  const show = (sec, anim = true) => {
    const g = shopGroupOf(sec), newGroup = shopGroupOf(tab) !== g || !tabs.children.length;
    tab = sec;
    m.el.querySelectorAll('.sgroup').forEach((b) => b.classList.toggle('on', b.dataset.group === g.k));
    if (newGroup) {
      tabs.hidden = g.secs.length < 2;
      tabs.innerHTML = g.secs.length < 2 ? '' : g.secs.map((k) => `<button class="stab" data-tab="${k}">${icon(SHOP_ICO[k])}<span>${SECTIONS.find((x) => x.k === k).name}</span></button>`).join('');
      if (anim && !reduced()) [...tabs.children].forEach((el, i) => el.animate([{ opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1 }], { duration: 260, delay: i * 40, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'backwards' }));
    }
    tabs.querySelectorAll('.stab').forEach((b) => b.classList.toggle('on', b.dataset.tab === sec));
    closeShelf();
    grid.className = `sgrid sg-${sec}`;
    m.el.querySelector('.mbody').scrollTop = 0;
    if (sec === 'sets') {
      grid.innerHTML = [...SETS].sort((a, b) => byWorld(item('avatar', a.av), item('avatar', b.av))).map(setCard).join('');
      pauseOffscreen(grid, '.sitem');
      if (anim && !reduced()) [...grid.children].forEach((el, i) => el.animate([{ opacity: 0, translate: '0 16px', scale: 0.9 }, { opacity: 1, translate: '0 0', scale: 1 }], { duration: 360, delay: i * 35, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'backwards' }));
      return;
    }
    // Un subtítulo por origen (si solo hay de la tienda, sin subtítulo).
    const list = shopItems(sec).sort(byWorld), groups = ORIGINS.map((o) => ({ ...o, its: list.filter((it) => (exFrom(it)?.g || 'tienda') === o.k) })).filter((o) => o.its.length);
    grid.innerHTML = groups.map((o) => (groups.length > 1 ? `<h3 class="s-sub">${icon(o.ico)}${o.name}</h3>` : '') + o.its.map((it) => card(sec, it)).join('')).join('');
    pauseOffscreen(grid, '.sitem');
    if (anim && !reduced()) [...grid.children].forEach((el, i) => el.animate([{ opacity: 0, translate: '0 16px', scale: 0.9 }, { opacity: 1, translate: '0 0', scale: 1 }], { duration: 360, delay: i * 45, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'backwards' }));
    if (sec === 'traveler') travShelf(grid).then(() => tab !== 'traveler' && closeShelf());
  };
  // Ficha de un paquete en su propia ventana, encima de la tienda; al cerrarla sigues donde estabas (si estabas en
  // naves, su vitrina 3D se vuelve a armar).
  const showSet = (av) => {
    const body = m.el.querySelector('.mbody'), y = body.scrollTop;
    // Al volver, la lista se redibuja pero se queda donde ibas (no regresa hasta arriba).
    openSetSheet(av, () => { tab === 'traveler' ? show(tab, false) : refresh(); body.scrollTop = y; });
  };
  // Tarjeta de un paquete: el avatar con su marco, cuántas piezas tienes y lo que cuesta llevarte lo que falta.
  const setCard = (st) => {
    const a = item('avatar', st.av), d = setDealOf(st.av), have = d.n - d.rest.length;
    const foot = !d.rest.length ? `<span class="s-on">${icon('check')}Completa</span>` : d.lock ? `<span class="s-lock">${icon('lock')}Mundo ${d.lock}</span>`
      : `<span class="s-price ${save.coins < d.pay ? 'short' : ''}">${coin()}<s>${fmt(d.full)}</s>${fmt(d.pay)}</span>`;
    const isNew = fresh(a) && a.need > seenBefore;
    return `<button class="sitem sset ${!d.rest.length ? 'own' : ''} ${d.lock ? 'locked' : ''}" data-set="${st.av}">${isNew ? '<i class="s-new">¡Nuevo!</i>' : ''}<div class="s-art">${avatarHTML({ ...save, look: 'char', char: st.av, ring: st.ring[0] }, 'huge')}</div><b>${esc(a.name)}</b><small class="sset-n">${have}/${d.n} piezas</small>${foot}</button>`;
  };
  // Vuelve a dibujar solo los pies de las tarjetas (sin reiniciar la vitrina 3D).
  const refresh = () => {
    m.el.querySelector('[data-shop-coins]').textContent = fmt(save.coins);
    if (tab === 'sets') return show('sets', false);
    grid.querySelectorAll('.sitem').forEach((el) => {
      const fresh = h(card(tab, item(tab, el.dataset.k)));
      el.className = fresh.className;
      el.querySelector('.s-on, .s-use, .s-price, .s-lock').replaceWith(fresh.querySelector('.s-on, .s-use, .s-price, .s-lock'));
      el.querySelector('.s-sell')?.remove();
      const sl = fresh.querySelector('.s-sell');
      if (sl) el.append(sl);
      // El marco se ve sobre tu avatar actual: al cambiar de avatar se redibuja.
      if (tab === 'ring') el.querySelector('.s-art').innerHTML = shopPreview('ring', el.dataset.k);
    });
  };
  m.el.querySelector('.sgroups').addEventListener('click', (e) => {
    const b = e.target.closest('[data-group]');
    if (!b) return;
    if (b.dataset.group !== shopGroupOf(tab).k) {
      show(SHOP_GROUPS.find((g) => g.k === b.dataset.group).secs[0]);
    }
  });
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b && b.dataset.tab !== tab) show(b.dataset.tab);
  });
  grid.addEventListener('click', async (e) => {
    const el = e.target.closest('.sitem');
    if (!el) return;
    const sec = el.dataset.sec || tab;
    const st = e.target.closest('[data-set]');
    if (st) {
      // 10 nov 2026: un paquete con candado no se abre; avisa como un avatar bloqueado.
      const d = setDealOf(st.dataset.set);
      if (d.rest.length && d.lock) {
        st.animate([{ translate: '0 0' }, { translate: '-6px 0' }, { translate: '5px 0' }, { translate: '-3px 0' }, { translate: '0 0' }], { duration: 300 });
        return toast(`${icon('lock')} Se abre al llegar al mundo ${d.lock}`);
      }
      return showSet(st.dataset.set);
    }
    if (!el.dataset.k) return;
    // Vender (70%): regresa a la tienda; un exclusivo de evento se recupera hasta que vuelva su evento.
    if (e.target.closest('[data-sell]')) {
      const it = item(sec, el.dataset.k), p = sellPrice(sec, it);
      return confirm({
        title: 'Vender',
        text: `¿Vendes <b>${esc(it.name)}</b> por ${coin()} <b>${fmt(p)}</b>? ${it.ev ? 'Es exclusivo de un evento: lo puedes recuperar <b>el próximo año</b>, cuando vuelva su evento.' : 'Regresa a la tienda.'}`,
        label: `Vender ${coin()} ${fmt(p)}`,
        cls: 'orange',
        onYes: async () => {
          const r = el.getBoundingClientRect(), was = shownCoins();
          if (!sell(sec, it.k)) return;
          applyLook();
          paintMe();
          await flyToWallet('coins', { x: r.left + r.width / 2, y: r.top + r.height / 2 }, p, was);
          if (it.ev) show(tab, false);
          else refresh();
          toast(`${coin()} +${fmt(p)}`);
        },
      });
    }
    if (el.classList.contains('on')) return;
    const k = el.dataset.k, it = item(tab, k), art = el.querySelector('.s-art');
    const nope = (msg) => {
      el.animate([{ translate: '0 0' }, { translate: '-6px 0' }, { translate: '5px 0' }, { translate: '-3px 0' }, { translate: '0 0' }], { duration: 300 });
      toast(msg);
    };
    if (lockedUntil(tab, k)) return nope(`${icon('lock')} Se abre al llegar al mundo ${lockedUntil(tab, k)}`);
    const pay = cost(it);
    if (!owns(tab, k) && save.coins < pay) return nope(`${coin()} Te faltan ${fmt(pay - save.coins)} monedas`);
    // 10 nov 2026 (el usuario): tocar la tarjeta ya no compra: abre la pieza en grande con «¿La compras?». Solo el botón
    // del precio compra directo. Lo tuyo se pone de un toque, como antes.
    if (!owns(tab, k) && !e.target.closest('.s-price')) {
      const c = confirm({
        title: esc(it.name),
        text: `<span class="s-zoom a3d-live">${shopPreview(tab, k)}</span>¿Lo compras por ${coin()} <b>${fmt(pay)}</b>?`,
        label: `Comprar ${coin()} ${fmt(pay)}`,
        // 10 nov 2026: al ver un marco, la ventana toma su estilo (cabecera, orilla y fondo) para que sepa cómo se ve.
        look: tab === 'ring' ? `mr-${k}` : '',
        onYes: () => el.querySelector('.s-price')?.click(),
      });
      const cv = c.el.querySelector('canvas[data-kind]');
      if (cv) import('./travelers.js').then(({ TravelerShelf }) => cv.isConnected && new TravelerShelf([{ canvas: cv, kind: cv.dataset.kind }]));
      return;
    }
    const bought = !owns(tab, k);
    if (bought) {
      buy(tab, k, pay);
      const r = el.getBoundingClientRect();
      await spendFromWallet('coins', { x: r.left + r.width / 2, y: r.top + r.height / 2 }, pay);
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
// Dev (11 nov 2026, pedido del usuario): el paquete completo de las festividades nuevas, una pestaña por grupo. Cada
// festividad con su fecha, su mesa y sus 7 exclusivos dibujados como en la tienda. Solo para ver: no da nada.
function openFestivalPack() {
  const TABS = [['Leyendas', (f) => f.local], ['Fiestas de México', (f) => f.grp === 3], ['Fiestas de América', (f) => f.grp === 4]];
  const LBL = { avatar: 'Disfraz', ring: 'Marco', title: 'Título', traveler: 'Nave', back: 'Reverso', space: 'Espacio', frame: 'Postal' };
  const MONTHS_ABBR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const y = new Date().getFullYear(), when = (f) => { const d = f.date(y); return `${d.getDate()} ${MONTHS_ABBR[d.getMonth()]}${f.days > 1 ? ` · ${f.days} días` : ''}`; };
  const cell = (lbl, ico, pic, name, cls = '') => `<li class="ss-cell"><em class="c-ex">${icon(ico)}${lbl}</em><span class="ss-pic ${cls}">${pic}</span><b>${esc(name)}</b></li>`;
  const fest = (f) => {
    const ex = Object.assign({}, ...f.ex), name = (sec) => item(sec, ex[sec])?.name || ex[sec];
    const pic = (sec) => sec === 'ring' ? avatarHTML({ ...save, look: 'char', char: ex.avatar, ring: ex.ring }) : sec === 'title' ? titleHTML(ex[sec]) : shopPreview(sec, ex[sec]);
    return `<section class="fp-fest"><h5>${icon(f.ico)}<b>${esc(f.name)}</b><small>${when(f)}${f.zone ? ` · ${esc(f.zone)}` : ''}</small></h5>
      <ul class="ss-list">${cell('Mesa', 'card', `<span class="fp-mesa">${tableHTML(0, f.key)}</span>`, 'Su mesa', 'ssk-mesa')}${Object.keys(LBL).filter((sec) => ex[sec]).map((sec) => cell(LBL[sec], SHOP_ICO[sec], pic(sec), name(sec), `ssk-${sec}`)).join('')}</ul></section>`;
  };
  const pane = (i) => FESTIVALS.filter((f) => TABS[i][1](f) && f.ready).sort((a, b) => a.date(y) - b.date(y)).map(fest).join('');
  const m = openModal({ title: 'Festividades nuevas', color: 'orange', wide: true, cls: 'fp-pack', onClose: closeShelf,
    body: `<div class="fp-tabs">${TABS.map(([n, of], i) => `<button class="fp-tab${i ? '' : ' on'}" data-t="${i}">${n} <small>${FESTIVALS.filter((f) => of(f) && f.ready).length}</small></button>`).join('')}</div><div class="fp-body"></div>` });
  const body = m.el.querySelector('.fp-body');
  const show = (i) => {
    body.innerHTML = pane(i);
    body.scrollTop = 0;
    m.el.querySelectorAll('.fp-tab').forEach((b) => b.classList.toggle('on', +b.dataset.t === i));
    if (!reduced()) body.querySelectorAll('.fp-fest').forEach((el, k) => el.animate([{ opacity: 0, translate: '0 14px' }, { opacity: 1, translate: '0 0' }], { duration: 320, delay: k * 60, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'backwards' }));
    travShelf(body);
  };
  m.el.querySelector('.fp-tabs').addEventListener('click', (e) => { const b = e.target.closest('.fp-tab'); if (b) show(+b.dataset.t); });
  show(0);
}
// Ficha de la colección de un personaje (9 nov 2026): su propia ventana (openSetSheet) o dentro de otra (host), con
// "Regresar" si se da back. El avatar con su marco y su título, las piezas en columnas (se compran o se ponen de un toque)
// y abajo "Llevarte todo" con SET_DEAL menos por lo que falta: lo compra todo y lo pone. Con candado por mundo, todo
// espera a ese mundo. back(): volver a donde estaba · changed(): repintar monedas, avatar y lo demás.
function openSetSheet(av, after = () => {}) {
  // Con la ventana personalizada de su marco (cabecera, fondo y sticker): así se ve cómo queda todo junto.
  const m = openModal({ title: esc(item('avatar', av).name), color: 'orange', wide: true, cls: `set-sheet mr-${setOf(av).ring[0]}`, body: '<div class="ss-host"></div>', onClose: () => { closeShelf(); after(); } });
  setSheet(m.el.querySelector('.ss-host'), av, { changed: () => { document.querySelector('[data-shop-coins]')?.replaceChildren(fmt(save.coins)); updateCoins(); applyLook(); paintMe(); } });
}
function setSheet(host, av, { back, backLabel, changed }) {
  const pieces = setPieces(av);
  const cost = (it) => metShopPrice(it.price, saleRain());
  const LBL = { avatar: 'Disfraz', ring: 'Marco', title: 'Título', traveler: 'Nave', back: 'Reverso', face: 'Cara', space: 'Espacio', frame: 'Postal' };
  const pic = ({ sec, k }) => sec === 'traveler' ? `<canvas class="trav-prev" data-kind="${k}"></canvas>` : sec === 'title' ? titleHTML(k) : sec === 'ring' ? avatarHTML({ ...save, look: 'char', char: av, ring: k }) : shopPreview(sec, k);
  const state = ({ sec, k, it }) => {
    if (inUse(sec, k)) return `<span class="s-on">${icon('check')}En uso</span>`;
    // Mismos botones que las tarjetas de la tienda (s-use, s-price, s-lock): el paquete se ve como lo demás.
    if (owns(sec, k)) return '<button class="s-use press" data-do="use">Usar</button>';
    const lock = lockedUntil(sec, k);
    // Con candado no lleva nada: abajo ya dice en qué mundo se abre toda la colección.
    if (lock) return '';
    return `<button class="s-price press${save.coins < cost(it) ? ' short' : ''}" data-do="buy">${coin()}${cost(it) < it.price ? `<s>${fmt(it.price)}</s>` : ''}${fmt(cost(it))}</button>`;
  };
  const deal = () => setDealOf(av, pieces);
  // "Usar todas" (9 nov 2026, pedido del usuario): pone de un toque lo que ya tienes de su colección.
  const mine = () => pieces.filter((p) => owns(p.sec, p.k));
  const useHTML = () => {
    const own = mine();
    if (own.length < 2 || own.every((p) => inUse(p.sec, p.k))) return '';
    return `<button class="btn green wide ss-use press">${icon('check')}<span>${own.length === pieces.length ? 'Usar todas' : `Usar las ${own.length} que tienes`}</span></button>`;
  };
  const dealHTML = () => {
    const d = deal();
    if (!d.rest.length) return useHTML();
    if (d.lock) return `<p class="ss-done lock">${icon('lock')}Toda su colección se abre en el mundo ${d.lock}</p>`;
    return `${useHTML()}<button class="btn gold wide ss-all press${save.coins < d.pay ? ' short' : ''}">${icon('bag')}<span>Llevarte todo</span><s>${fmt(d.full)}</s>${coin()}<b>${fmt(d.pay)}</b><i class="ss-off">−${Math.round(SET_DEAL * 100)}%</i>${d.met ? `<i class="ss-off met">${icon(d.met.K.ico)}−${Math.round(d.met.K.shop * 100)}%</i>` : ''}</button>`;
  };
  const a = item('avatar', av), set = setOf(av);
  host.innerHTML = `<div class="ss-sheet">${back ? `<button class="ss-back press">${icon('prev')}<span>${backLabel}</span></button>` : ''}
    <div class="ss-head"><div class="ss-hero"><div class="rays"></div>${avatarHTML({ ...save, look: 'char', char: av, ring: set.ring[0] }, 'huge')}</div>
    <div class="ss-who">${back ? `<b class="outl">${esc(a.name)}</b>` : ''}${titleHTML(set.title[0])}<small>${esc(a.text || '')} · ${pieces.length} piezas</small></div></div>
    <ul class="ss-list">${pieces.map((p, i) => `<li class="ss-cell" data-i="${i}"><em class="c-ex">${icon(SHOP_ICO[p.sec] || 'user')}${LBL[p.sec]}</em><span class="ss-pic ssk-${p.sec}">${pic(p)}</span><b>${esc(p.it.name)}</b><span class="ss-st">${state(p)}</span></li>`).join('')}</ul>
    <div class="ss-deal">${dealHTML()}</div></div>`;
  travShelf(host);
  if (!reduced()) host.querySelectorAll('.ss-cell').forEach((el, i) => el.animate([{ opacity: 0, translate: '0 14px', scale: 0.9 }, { opacity: 1, translate: '0 0', scale: 1 }], { duration: 340, delay: 80 + i * 50, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'backwards' }));
  const paint = () => {
    host.querySelectorAll('.ss-cell').forEach((c) => (c.querySelector('.ss-st').innerHTML = state(pieces[+c.dataset.i])));
    host.querySelector('.ss-deal').innerHTML = dealHTML();
    changed();
  };
  const pop = (c) => {
    const r = c.querySelector('.ss-pic').getBoundingClientRect();
    sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 14);
    if (!reduced()) c.querySelector('.ss-pic').animate([{ scale: 1 }, { scale: 1.2, rotate: '-5deg' }, { scale: 1 }], { duration: 420, easing: 'ease-out' });
  };
  const nope = (el, msg) => { el.animate([{ translate: '0 0' }, { translate: '-6px 0' }, { translate: '5px 0' }, { translate: '0 0' }], { duration: 280 }); toast(msg); };
  host.onclick = async (e) => {
    if (back && e.target.closest('.ss-back')) return back();
    const b = e.target.closest('[data-do], .ss-all, .ss-use');
    if (!b) return;
    e.stopPropagation();
    if (b.classList.contains('ss-use')) {
      for (const p of mine()) equip(p.sec, p.k);
      buzz(20);
      paint();
      host.querySelectorAll('.ss-cell').forEach((c, i) => owns(pieces[i].sec, pieces[i].k) && setTimeout(() => c.isConnected && pop(c), i * 80));
      return toast(`¡Listo! Traes puesto a ${esc(a.name)}`);
    }
    if (b.classList.contains('ss-all')) {
      const d = deal();
      if (save.coins < d.pay) return nope(b, `${coin()} Te faltan ${fmt(d.pay - save.coins)} monedas`);
      const r = b.getBoundingClientRect();
      save.coins -= d.pay;
      for (const p of d.rest) save.owned[`${p.sec}:${p.k}`] = 1;
      for (const p of pieces) equip(p.sec, p.k);
      persist();
      buzz(30);
      await spendFromWallet('coins', { x: r.left + r.width / 2, y: r.top + r.height / 2 }, d.pay);
      paint();
      host.querySelectorAll('.ss-cell').forEach((c, i) => setTimeout(() => c.isConnected && pop(c), i * 90));
      confetti(80);
      return toast(`¡La colección de ${esc(a.name)} es tuya!`);
    }
    const c = b.closest('.ss-cell'), p = pieces[+c.dataset.i];
    if (b.dataset.do === 'buy') {
      const pay = cost(p.it);
      if (save.coins < pay) return nope(b, `${coin()} Te faltan ${fmt(pay - save.coins)} monedas`);
      const r = b.getBoundingClientRect();
      buy(p.sec, p.k, pay);
      await spendFromWallet('coins', { x: r.left + r.width / 2, y: r.top + r.height / 2 }, pay);
    } else equip(p.sec, p.k);
    paint();
    pop(c);
  };
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
  [p.coins && `${coin()}<b>${p.coins}</b>`, p.tickets && `${icon('ticket')}<b>×${p.tickets}</b>`, p.undo && `${icon('undo')}<b>×${p.undo}</b>`, p.wild && `${icon('wild')}<b>×${p.wild}</b>`, ...Object.entries(p.helps || {}).map(([k, n]) => n && `${icon(HELPS[k].ico)}<b>×${n}</b>`)].filter(Boolean);
// Lo que da un premio, como piezas para la ventana (icono + cantidad).
const lootHTML = (p) => prizeIcons(p).map((x) => `<span class="loot-it">${x}</span>`).join('');
// Suma el premio al guardado y lo lanza al monedero desde un punto de la pantalla.
// Comodines y deshacer no tienen monedero: salen en burbujas (bubbles: false si la ventana ya las mostró; 'pop':
// se dan de una vez, saltando en grande, como en la racha).
async function grantPrize(p, from, { bubbles = true } = {}) {
  save.coins += p.coins || 0;
  save.tickets += p.tickets || 0;
  save.undo += p.undo || 0;
  save.wild += p.wild || 0;
  for (const [k, n] of Object.entries(p.helps || {})) save.helps[k] = (save.helps[k] || 0) + n;
  persist();
  const runs = [];
  if (p.coins) runs.push(flyToWallet('coins', from, p.coins));
  if (p.tickets) runs.push(wait(200).then(() => flyToWallet('tickets', from, p.tickets)));
  if (bubbles === 'pop') [p.wild && ['wild', p.wild], p.undo && ['undo', p.undo]].filter(Boolean).forEach(([k, n], i) => wait(i * 450).then(() => popPrize(icon(k), `+${n}`, { x: from.x + (i ? 40 : p.undo && p.wild ? -40 : 0), y: from.y })));
  else if (bubbles) floatBubbles(prizeIcons({ undo: p.undo, wild: p.wild, helps: p.helps }), from);
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
      ? [
          // Sin esperar (7 nov 2026): los mismos boletos a TICKET_PRICE cada uno; el reloj vuelve a empezar.
          {
            label: `${n} ${icon('ticket')} ya · ${coin()} ${money(n * TICKET_PRICE)}`,
            cls: 'green',
            disabled: save.coins < n * TICKET_PRICE,
            keep: true,
            onClick: async (btn) => {
              const p = n * TICKET_PRICE;
              if (save.coins < p) return;
              btn.disabled = true;
              save.coins -= p;
              save.ticketAt = Date.now();
              persist();
              const r = btn.getBoundingClientRect(), at = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
              await spendFromWallet('coins', at, p);
              m.close();
              grantPrize({ tickets: n }, at);
            },
          },
        ]
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
  // El globo va dentro de la cabecera: en pantallas bajas la cabecera se queda fija arriba al desplazar la ventana.
  head.insertAdjacentHTML('beforeend', `<div class="qtip info">${text}</div>`);
  const btn = head.querySelector('.qhelp');
  const set = (on) => (modal.classList.toggle('tip-open', on), btn.setAttribute('aria-expanded', on));
  btn.addEventListener('click', () => set(!modal.classList.contains('tip-open')));
  m.el.addEventListener('pointerdown', (e) => modal.classList.contains('tip-open') && !e.target.closest('.qhelp, .qtip') && set(false));
}

// ---------- Racha diaria ----------
// Una fila de 6 premios a la vez, igual de separados: primero 3 a 30; cuando esa se acaba (alcanzados o perdidos),
// la siguiente de 50 en 50 (50 a 300, luego 350 a 600…). Se queda en la fila con premios sin reclamar.
// La barra se llena entre premio y premio.
// 10 nov 2026: los premios se cobran solos al alcanzarlos (rachaWin) y se festejan en la portada: la ventana ya solo es
// vista, sin Reclamar ni nada que tocar (los puntos van planos, no parecen botones).
function openStreak() {
  streakPendToFeats();
  const r = dailyStreak(), t = streakTheme(), miss = r.miss || [], N = STREAK_GOALS.length;
  const stateOf = (i) => (miss.includes(i) ? 'miss' : r.got.includes(i) ? 'got' : 'next');
  const prize = (x) => `<div class="rps"><span class="rp">${coin()}<b>${x.coins}</b></span>${x.wild ? `<span class="rp">${icon('wild')}<b>×${x.wild}</b></span>` : ''}${x.undo ? `<span class="rp">${icon('undo')}<b>×${x.undo}</b></span>` : ''}</div>`;
  // Entre más lejos en la fila, más grande y más vistoso el punto (el último lleva rayos).
  // Los alcanzados llevan palomita; los que se perdieron (guardados de antes), tache.
  const node = (i) => {
    const x = streakGoal(i), st = stateOf(i), tier = i < N ? i : (i - N) % N;
    return `<div class="rg t${tier} ${st}" data-i="${i}">${tier === N - 1 ? '<span class="rays"></span>' : ''}<i>${st === 'got' ? icon('check') : st === 'miss' ? icon('close') : `<b>${x.n}</b>`}</i>${prize(x)}</div>`;
  };
  const row = (from, idx, start) => {
    const pts = [from, ...idx.map((i) => streakGoal(i).n)], k = pts.findIndex((v) => v > r.n);
    const fill = k < 0 ? 1 : k === 0 ? 0 : (k - 1 + (r.n - pts[k - 1]) / (pts[k] - pts[k - 1])) / (pts.length - 1);
    return `<div class="rpath" style="--fill:${fill};--cols:${pts.length}"><div class="rbar"><i></i></div><div class="rg start"><i>${start}</i><div class="rps"></div></div>${idx.map(node).join('')}</div>`;
  };
  const rowOf = (i) => (i < N ? 0 : 1 + Math.floor((i - N) / N));
  const k = rowOf(nextIndex(r)), first = k ? N + (k - 1) * N : 0;
  const idx = Array.from({ length: N }, (_, j) => first + j);
  const path = row(k ? streakGoal(first - 1).n : 0, idx, k ? `<b>${streakGoal(first - 1).n}</b>` : icon(t.ico));
  const m = openModal({
    title: t.name,
    ico: t.ico,
    color: t.color,
    wide: true,
    cls: 'racha-modal',
    body: `<div class="rtop"><div class="rhero"><span class="rh-ico">${icon(t.ico)}</span><b>${r.n}</b></div></div>
      ${path}
      <div class="rclock-chip">Nueva racha en <b class="rclock">${clock(msToMidnight())}</b></div>`,
  });
  helpTip(m, 'Gana niveles nuevos seguidos: cada uno suma sus estrellas. Los eventos no cuentan. Los premios se cobran solos. Si pierdes o abandonas, vuelves a 0. A medianoche empieza otra.');
  const c = m.el.querySelector('.rclock');
  const tick = setInterval(() => (c.isConnected ? (c.textContent = clock(msToMidnight())) : clearInterval(tick)), 1000);
}

// Al volver de ganar: el número sube con un +1 que sale del botón.
function bumpStreak() {
  refreshStreak();
  bumpBtn('racha', '+1', streakReady());
}
// ---------- Misiones del día y logros (7 nov 2026; ver missions.js) ----------
// Se repintan en su lugar (sin cambiar el botón) para que el anillo se llene poco a poco.
const swapBtn = (a, html) => document.querySelectorAll(`[data-a="${a}"]`).forEach((b) => {
  if (!html) return b.remove();
  const n = h(html);
  b.className = n.className;
  b.style.cssText = n.style.cssText;
  b.innerHTML = n.innerHTML;
});
// 10 nov 2026: se repinta en su lugar (como misiones y logros) para que su anillo se llene poco a poco.
const refreshStreak = () => swapBtn('racha', streakBtn());
const refreshMis = () => swapBtn('mis', missionsBtn());
const refreshAchievements = () => swapBtn('logros', achievementsBtn());
const barHTML = (n, goal) => `<span class="mbar"><i style="width:${Math.min(100, (n / goal) * 100)}%"></i><b>${money(Math.min(n, goal))}/${money(goal)}</b></span>`;
function openMis() {
  const s = missions(ev()?.state?.paid);
  // Ya hizo todas (y abrió el cofre): solo festejo y cuándo llegan las de mañana, sin botón de jugar.
  if (missionsAllDone()) {
    const m = openModal({
      title: 'Misiones del día',
      color: 'green',
      cls: 'mis-modal mis-all',
      body: `<div class="evi-hero"><div class="rays"></div><span class="evi-ico">${icon('misiones', 0, 0, 'big')}<span class="mis-all-ok">${icon('check')}</span></span></div>
        <p class="lead"><b>¡Cumpliste todas las de hoy!</b> Vuelve mañana por 3 nuevas.</p>
        <p class="tk-clock mis-clock">${clock(msToMidnight())}</p>`,
    });
    const c = m.el.querySelector('.mis-clock');
    const t = setInterval(() => (c.isConnected ? (c.textContent = clock(msToMidnight())) : clearInterval(t)), 1000);
    return;
  }
  // 10 nov 2026: se cobran solas al cumplirlas (autoClaim): la ventana solo enseña cómo vas.
  const row = (x) => {
    const m = missionDef(x.id), done = missionDone(x);
    const end = done ? `<span class="mis-got">${icon('check')}</span>` : `<span class="mis-prize">${coin()}${money(x.coins)}</span>`;
    return `<li class="mis ${done ? 'got' : ''}">${missionIcon(m)}<div><b>${m.text(x.goal)}</b>${barHTML(x.n, x.goal)}</div>${end}</li>`;
  };
  // El cofre de las 3 (lo que trae es sorpresa); a la derecha, un puntito por misión cumplida.
  const bonus = () => `<li class="mis bonus ${s.bonus ? 'got' : ''}">${icon('cofre')}<div><b>Cofre del día</b><small>${s.bonus ? 'Ya lo abriste' : 'Sorpresa al cumplir las 3'}</small></div>${s.bonus ? `<span class="mis-got">${icon('check')}</span>` : `<span class="mis-pips">${s.list.map((x) => `<i class="${missionDone(x) ? 'on' : ''}"></i>`).join('')}</span>`}</li>`;
  const m = openModal({
    title: 'Misiones del día',
    color: 'green',
    cls: 'mis-modal',
    body: `<p class="tk-clock mis-clock">${clock(msToMidnight())}</p><ul class="mis-list">${s.list.map(row).join('')}${bonus()}</ul>
      <p class="note">Se cobran solas al cumplirlas. A medianoche llegan otras.</p>`,
    // 10 nov 2026: sin botón «¡A jugar!» (solo es vista; se cierra con la X).
    onClose: () => refreshMis(),
  });
  const c = m.el.querySelector('.mis-clock');
  const t = setInterval(() => (c.isConnected ? (c.textContent = clock(msToMidnight())) : clearInterval(t)), 1000);
  if (!reduced()) m.el.querySelectorAll('.mis').forEach((el, i) => el.animate([{ opacity: 0, translate: '-16px 0' }, { opacity: 1, translate: '0 0' }], { duration: 300, delay: 120 + i * 90, easing: 'ease-out', fill: 'backwards' }));
}
// Hasta abajo de los logros (12 nov 2026): los sellos del pasaporte y los premios de secretos que ya ganaste (los que
// faltan no se ven). Cada uno con su sello de color, lo que pidió y lo que dio.
const passWhat = (p) => `${p.item ? `${GIFT_KIND[p.item[0]]} <b>${esc(item(...p.item).name)}</b> · ` : ''}${coin()}${money(p.coins)}`;
const passStampHTML = (i) => { const F = passFrameOf(i); return `<span class="ps-stamp on" style="--pc:${F[3]}">${icon(F[4])}</span>`; };
function passTrophies() {
  const s = save.pass?.s || 0, x = save.pass?.x || 0;
  const rows = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1)).join('');
  const stampStop = (i) => `<li class="mis ps got">${passStampHTML(i)}<div><b>Sello ${i} · ${fmt(passGoal(i))} niveles</b><small>${passWhat(passPrize(i))}</small></div><span class="mis-got">${icon('check')}</span></li>`;
  const sec = (i) => `<li class="mis ps got"><span class="ps-stamp on sec">${icon('starSecret')}</span><div><b>${secretGoal(i)} niveles secretos</b><small>${passWhat(secretPrize(i))}</small></div><span class="mis-got">${icon('check')}</span></li>`;
  return (s ? `<h3 class="ps-h">${icon('pasaporte')} Pasaporte</h3><ul class="mis-list">${rows(s, stampStop)}</ul>` : '')
    + (x ? `<h3 class="ps-h">${icon('starSecret')} Niveles secretos</h3><ul class="mis-list">${rows(x, sec)}</ul>` : '');
}
function openAchievements() {
  const list = achievementsVisible();
  const row = (l) => {
    const T = ACHIEVEMENT_TOP, got = achievementGot(l), next = l.steps[Math.min(got, T - 1)], v = achievementProgress(l), done = got >= T;
    const medals = ACHIEVEMENT_MEDAL.map((x, i) => `<i class="medal m${i} ${i < got ? 'on' : ''}" title="${x}"></i>`).join('');
    // Premio del escalón que sigue: monedas y, en platino y diamante, comodines y deshacer.
    const pz = ACHIEVEMENT_PRIZES[Math.min(got, T - 1)];
    const prize = `${coin()}${money(pz.coins)}${pz.wild ? ` ${icon('wild')}×${pz.wild}` : ''}${pz.undo ? ` ${icon('undo')}×${pz.undo}` : ''}`;
    const end = done ? `<span class="mis-got">${icon('check')}</span>` : `<span class="mis-prize">${prize}</span>`;
    return `<li class="mis lg ${done ? 'got' : ''}">${missionIcon(l)}<div><b>${l.name} <span class="medals">${medals}</span></b><small>${done ? '¡Diamante!' : `${ACHIEVEMENT_MEDAL[got]}: ${l.text(next)}`}${l.title && got < 3 ? ` · el oro da el título <b>${item('title', l.title).name}</b>` : ''}</small>${done ? '' : barHTML(v, next)}</div>${end}</li>`;
  };
  // Primero lo que va más avanzado (10 nov 2026: se cobran solos, ya no hay nada que reclamar).
  const step = (l) => l.steps[Math.min(achievementGot(l), ACHIEVEMENT_TOP - 1)];
  const sorted = () => [...list].sort((a, b) => (achievementGot(a) >= ACHIEVEMENT_TOP) - (achievementGot(b) >= ACHIEVEMENT_TOP) || achievementProgress(b) / step(b) - achievementProgress(a) / step(a));
  const m = openModal({
    title: 'Logros',
    ico: 'trophy',
    color: 'gold',
    wide: true,
    cls: 'mis-modal lg-modal',
    body: `<p class="note lg-note">Cada medalla empieza desde cero.</p><ul class="mis-list">${sorted().map(row).join('')}</ul>${passTrophies()}`,
    onClose: () => refreshAchievements(),
  });
}
// Cajón de un lado ('l' menú, 'r' eventos): 'toggle' / 'open' / 'close'. auto: se cierra solo a los 5 s.
const grpTimer = { l: 0, r: 0 };
function openGroup(k, how = 'toggle', auto = false) {
  const side = document.querySelector(`#app .side.${k}`), btn = side?.querySelector('.grp-btn');
  if (!btn) return;
  const open = how === 'toggle' ? !side.classList.contains('open') : how === 'open';
  clearTimeout(grpTimer[k]);
  if (open) document.querySelectorAll('#app .side.open').forEach((x) => x !== side && openGroup(x.classList.contains('r') ? 'r' : 'l', 'close'));
  if (open === side.classList.contains('open')) return;
  side.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', open);
  if (open && !reduced()) side.querySelectorAll('.grp-drawer > *').forEach((b, i) => b.animate([{ opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1.1, offset: 0.7 }, { opacity: 1, scale: 1 }], { duration: 320, delay: 40 + i * 35, easing: 'ease-out', fill: 'backwards' }));
  if (open && auto) grpTimer[k] = setTimeout(() => openGroup(k, 'close'), 5000);
}
const closeGroups = () => ['l', 'r'].forEach((k) => openGroup(k, 'close'));
// Tocar fuera de un cajón abierto lo cierra (menos durante el recorrido de botones).
document.addEventListener('pointerdown', (e) => {
  if (e.target.closest('#app .side.open, .side-touring, .modal-back')) return;
  closeGroups();
}, true);
// Nombre corto de cada botón del cajón (va abajo).
const GRP_NAMES = { daily: 'Regalo', dticket: 'Boletos', shop: 'Tienda', album: 'Álbum', camino: 'Camino', settings: 'Ajustes', racha: 'Racha', mis: 'Misiones', logros: 'Logros', col: 'Colección', evento: 'Evento', 'evento-next': 'Próximo', fiesta: 'Festividad', 'fiesta-next': 'Próxima' };
// El botón del grupo enseña lo más urgente de su cajón y cuántos tienen algo listo; se repinta cuando cambian.
function paintGroup(side) {
  const btn = side.querySelector('.grp-btn'), drawer = side.querySelector('.grp-drawer');
  if (!btn || !drawer) return;
  const btns = [...drawer.querySelectorAll(':scope > .iconbtn')];
  const ready = btns.filter((b) => b.classList.contains('ready'));
  const top = ready[0] || btns.find((b) => b.classList.contains('hot')) || btns.find((b) => b.classList.contains('nuevo'));
  const ico = top?.querySelector(':scope > .ico');
  btn.querySelector(':scope > .ico').replaceWith(ico ? ico.cloneNode(true) : h(icon(side.classList.contains('l') ? 'menu' : 'star')));
  btn.classList.toggle('ready', !!ready.length || btns.some((b) => b.querySelector(':scope > .dot')));
  const n = btn.querySelector('.grp-n');
  n.textContent = ready.length || '';
  n.hidden = !ready.length;
}
function initGroups(root) {
  root.querySelectorAll('.side').forEach((side) => {
    const drawer = side.querySelector('.grp-drawer');
    if (!drawer) return;
    paintGroup(side);
    new MutationObserver(() => paintGroup(side)).observe(drawer, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  });
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
const COL_KIND = { title: 'Título', frame: 'Postal', space: 'Espacio', ring: 'Marco', avatar: 'Disfraz', back: 'Reverso', traveler: 'Viajero' };
const COL_HELP = { wild: 'Comodín', undo: 'Deshacer', tickets: 'Boletos', reloj: 'Reloj de arena', ver3: 'Ver cartas 3 s', llave: 'Llave maestra' };
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
  helpTip(m, `Cada estrella nueva que ganas en un nivel te da 1 ${c.one || c.token} (los del evento del mes y las festividades no dan). Cámbia${c.m ? 'los' : 'las'} aquí antes de que acabe el domingo: las que sobren se pierden. Lo exclusivo es tuyo para siempre.`);
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
    // Lo comprado sale en burbuja desde su tarjeta. Lo exclusivo no se pone solo: se cambia en el perfil.
    if (o.sec) {
      lootBubbles(m, [giftBubble(o.sec, o.item)], fresh);
      if (o.sec === 'traveler') setTimeout(() => travShelf(m.el), 50);
    } else {
      lootBubbles(m, prizeIcons(o.prize), fresh);
      grantPrize(o.prize, at, { bubbles: false });
    }
  });
  const clk = m.el.querySelector('.cclock');
  const tick = setInterval(() => (clk.isConnected ? (clk.textContent = daysLeft(colLeft(), true)) : clearInterval(tick)), 1000);
}
// ---------- Evento del mes ----------
// 5 planetas de 5 niveles en su propia constelación. Un boleto temático para entrar: ganar lo devuelve,
// perder lo gasta y el siguiente llega a las 24 h o se compra (evTicketPrice; el primero de cada edición se paga). El 5.º nivel de cada planeta da su exclusivo.
const EV_W = 900; // w de los planetas del evento en la vista 3D (solo para sus semillas y para reconocerlos)
const EV_NODES = [0, 2, 5, 7, 9]; // dónde van sus 5 insignias en el camino del planeta
// El evento del mes y las festividades (24 h) usan la misma pantalla: EVS dice cuál se está viendo y cómo se juega.
// get: el evento (o null) · P planetas de N niveles (L en total) · W: w de sus planetas en la vista 3D · tk: lleva boleto.
const EVK = {
  mes: { get: () => ev(), enter: evEnter, win: evWin, lose: evLose, P: EVENT_PLANETS, N: EVENT_PER_PLANET, L: EVENT_LEVELS, W: EV_W, nodes: EV_NODES, tk: true,
    level: (e, k) => eventLevel(e.id, k, e.state.world), left: () => evLeft() },
  // P, N y L dependen de la festividad (el Nahual trae 4 planetas de 4).
  fiesta: { get: () => { const f = festival(); return f && !f.soon ? f : null; }, enter: festEnter, win: festWin, lose: festLose, W: 950, tk: false,
    get P() { return festShape(festival()).P; }, get N() { return festShape(festival()).N; }, get L() { return festShape(festival()).L; },
    get nodes() { return this.N === 4 ? [0, 3, 6, 9] : [0, 4, 9]; },
    level: (e, k) => festivalLevel(e.day, k, e.state.world, festShape(e).N), left: () => festivalLeft() },
};
let EVS = EVK.mes;
const kindOf = (e) => (e.date ? 'fiesta' : 'mes');
// 8 nov 2026: un evento o festividad que se anuncia (aún no empieza) sale como nuevo en la botonera (punto, se mueve,
// "¡Nuevo!" y abre la columna) hasta que abres su ventana.
const soonId = (e) => `${e.key}:${new Date().getFullYear()}`;
const soonNew = (e) => !save.soonSeen?.[soonId(e)];
const soonTag = (e) => (soonNew(e) ? ' ready nuevo' : '');
const soonDot = (e) => (soonNew(e) ? '<em class="soon-new outl">¡Nuevo!</em>' : '');
function seeSoon(e, a) {
  if (!soonNew(e)) return;
  (save.soonSeen ||= {})[soonId(e)] = 1;
  persist();
  document.querySelectorAll(`[data-a="${a}"]`).forEach((b) => (b.classList.remove('ready', 'nuevo'), b.querySelectorAll('.soon-new, .dot').forEach((x) => x.remove())));
}
// 9 nov 2026: los botones van agrupados, así que desde 3 días antes el del mes que viene sale junto al del que termina
// (evNextBtn, gris y con candado; con palomita si ya compró su entrada en preventa).
const evBtn = () => evNowBtn() + evNextBtn();
const evNextBtn = () => {
  const n = evSoon();
  if (!n) return '';
  const pre = evPreOwned(n);
  return `<button class="iconbtn tb press ev-btn soon ${pre ? 'pre' : ''} ${fresh('mes')}${soonTag(n)}" data-a="evento-next" aria-label="${n.name}: ${n.inDays > 1 ? `en ${n.inDays} días` : 'mañana'}" title="${n.name}">${icon(n.ico)}<span class="fi-lock">${icon(pre ? 'check' : 'lock')}</span><small class="tl">en ${shortLeft(evLeft())}</small>${soonDot(n)}</button>`;
};
const evNowBtn = () => {
  const e = ev();
  if (!e || e.done) return '';
  // Arriba, lo que le queda al mes. El reloj del boleto vive adentro: aquí solo se apaga si no hay boleto
  // y se mueve con su punto cuando sí lo hay.
  // Sin pagar todavía el primer boleto también llama (hay algo que hacer adentro).
  const ready = !!(e.state.run || e.state.tk || !e.state.paid);
  return `<button class="iconbtn tb press ev-btn ${fresh('mes')} ${ready ? 'ready' : 'waiting'}" data-a="evento" aria-label="${e.name}" title="${e.name}">${icon(e.ico)}<small class="tl">${shortLeft(evLeft())}</small>${ready ? '<span class="dot"></span>' : ''}</button>`;
};
// Evento del mes: si ya empezó, a su pantalla; si empieza mañana, de qué va y la cuenta regresiva.
function openEvent() {
  // Entrar al mundo del evento ya es haber pagado: si no, primero la entrada (openEntry).
  if (ev() && !ev().done) return ev().state.paid ? warp(() => showEvent({ kind: 'mes' })) : openEntry('mes');
  openEventNext();
}
// El mes que viene (desde 3 días antes): de qué va, la cuenta regresiva y su entrada en preventa con descuento.
function openEventNext() {
  const n = evSoon();
  if (!n) return;
  seeSoon(n, 'evento-next');
  const pre = evPreOwned(n), p = evPrePrice(n), full = evPrePrice(n, false), short = save.coins < p;
  const m = openModal({
    title: n.inDays > 1 ? `¡En ${n.inDays} días empieza ${n.name}!` : `¡Mañana empieza ${n.name}!`,
    color: n.color,
    cls: 'entry-modal',
    body: `${passHTML(n, { ico: n.ico, state: pre ? 'owned' : 'soon', label: 'Empieza en', sub: `<span class="ep-clock" data-pclock>${clock(evLeft())}</span>`, off: pre ? '' : `−${Math.round(FEST_PRE * 100)}%` })}
      <p class="lead">Todo el mes: <b>${EVENT_PLANETS} planetas</b>, ${EVENT_LEVELS} niveles y premios <b>exclusivos</b>. ${pre ? 'Ya tienes tu entrada: ese día entras directo.' : 'Compra tu entrada desde hoy y paga menos.'}</p>`,
    buttons: pre ? [] : [{
      label: short ? `Te faltan ${coin()} ${money(p - save.coins)}` : `Comprar · ${coin()} <s>${money(full)}</s> ${money(p)}`,
      cls: 'green wide',
      disabled: short,
      keep: true,
      onClick: async (btn) => {
        if (!evPreBuy()) return;
        btn.disabled = true;
        const r = btn.getBoundingClientRect();
        await spendFromWallet('coins', { x: r.left + r.width / 2, y: r.top + r.height / 2 }, p);
        updateCoins();
        m.close();
        toast(`${icon('check')} ¡Entrada lista para ${n.name}!`);
        current?.();
      },
    }],
  });
  passClock(m, () => (evSoon() ? evLeft() : 0), () => current?.());
}
// Festividad (24 h): botón dorado junto a Jugar, del tamaño de los laterales. Desde 3 días antes sale gris, con
// candado y la cuenta regresiva ("en 2 d", "en 19 h"); el día de la fiesta, a color con "¡Hoy!" y lo que le queda.
// 9 nov 2026: festividades pegadas (p. ej. La Llorona y La Catrina): mientras dura una, la que sigue ya sale a su lado
// (fiNextBtn, data-a="fiesta-next") con su preventa.
const festSoonHTML = (f, a) => `<button class="iconbtn tb press fi-btn soon ${festPre(f) ? 'pre' : ''} ${fresh('fiesta')}${soonTag(f)}" data-a="${a}" aria-label="${f.name}: ${f.inDays > 1 ? `en ${f.inDays} días` : 'mañana'}" title="${f.name}">${icon(f.ico)}<span class="fi-lock">${icon(festPre(f) ? 'check' : 'lock')}</span><small class="tl">en ${shortLeft(soonLeft(f))}</small>${soonDot(f)}</button>`;
const festBtn = () => festNowBtn() + festNextBtn();
const festNextBtn = () => { const f = festivalSoon(); return f ? festSoonHTML(f, 'fiesta-next') : ''; };
const festNowBtn = () => {
  const f = festival();
  if (!f || f.done) return '';
  return f.soon
    ? festSoonHTML(f, 'fiesta')
    : `<button class="iconbtn tb press fi-btn ready ${fresh('fiesta')}" data-a="fiesta" aria-label="${f.name}" title="${f.name}">${icon(f.ico)}<small class="tl">${shortLeft(festivalLeft())}</small><em class="fi-hoy outl">¡Hoy!</em><span class="dot"></span></button>`;
};
// Antes de que empiece: de qué va y la cuenta regresiva (nunca se dice que los niveles piden ayudas). El día de la fiesta, el botón lleva a ella.
function openFestival(f = festival(), a = 'fiesta') {
  if (!f) return;
  if (!f.soon) return festPaid(f) ? warp(() => showEvent({ kind: 'fiesta' })) : openEntry('fiesta');
  // Preventa (7 nov 2026): comprada antes cuesta FI_PRE menos; el día de la fiesta ya entras sin pagar.
  // 8 nov 2026: el mismo pase que la entrada del mes, con la cinta del descuento; ya comprada, el pase lleva el sello
  // "¡Lista!" y no hay botones (ni "Ahora no" ni "Entrada comprada").
  const pre = festPre(f);
  seeSoon(f, a);
  EVS = EVK.fiesta;
  const m = openModal({
    title: f.inDays > 1 ? `¡En ${f.inDays} días es ${f.name}!` : `¡Mañana es ${f.name}!`,
    color: f.color,
    cls: 'entry-modal',
    body: `${passHTML(f, { ico: f.ico, state: pre ? 'owned' : 'soon', label: 'Empieza en', sub: `<span class="ep-clock" data-pclock>${clock(soonLeft(f))}</span>`, off: pre ? '' : `−${Math.round(FEST_PRE * 100)}%` })}
      <p class="lead">${pre ? 'Ya tienes tu entrada. Ese día entras directo.' : 'Compra tu entrada desde hoy y paga menos.'}</p>`,
    buttons: pre ? [] : [buyTicketBtn(f, () => m, 'fiesta', () => (toast(`${icon('check')} ¡Entrada lista para ${f.name}!`), current?.()), 'Comprar')],
  });
  passClock(m, () => (festival()?.soon || festivalSoon() ? soonLeft(f) : 0), () => current?.());
}
// Los tiempos de los botones avanzan solos (y el del mes vuelve a moverse cuando llega el boleto).
setInterval(() => {
  for (const [a, f] of [['fiesta', festNowBtn], ['fiesta-next', festNextBtn], ['evento', evNowBtn], ['evento-next', evNextBtn]]) {
    const b = document.querySelector(`[data-a="${a}"]`);
    if (b && !b.classList.contains('fresh')) b.outerHTML = f();
  }
  const c = document.querySelector('[data-a="col"]');
  if (c && !c.classList.contains('fresh')) c.outerHTML = colBtn();
}, 20e3);
// El premio de un planeta, en chiquito (para la etiqueta del planeta y la ventana del premio).
// Tiempo que queda del evento, dicho para animar a jugar: días (o horas el último día).
const evDaysOf = (K) => { const ms = K.left(), d = Math.floor(ms / 864e5); return d >= 2 ? `${d} días` : d === 1 ? '1 día' : `${Math.max(1, Math.ceil(ms / 3600e3))} horas`; };
const evDays = () => { const ms = EVS.left(), d = Math.floor(ms / 864e5); return d >= 2 ? `${d} días` : d === 1 ? '1 día' : `${Math.max(1, Math.ceil(ms / 3600e3))} horas`; };
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
  const { P, N } = EVS;
  return Array.from({ length: P }, (_, p) => {
    const first = p * N, done = Math.max(0, Math.min(N, s.k - first));
    const state = p === hold ? 'locked' : done >= N ? 'done' : s.k >= first ? 'current' : 'locked';
    const levels = Array.from({ length: N }, (_, j) => ({ kind: first + j < s.k ? 'done' : first + j === s.k ? 'cur' : 'lock', stars: 0, paused: s.run?.k === first + j }));
    const chip = state === 'done' ? `<span class="chip info">${icon('check')}${icon('gift')}</span>` : state === 'current' ? `<span class="chip info">${icon('flag')}${done + 1}/${N}</span>` : `<span class="lk">${icon('lock')}</span>`;
    return { w: EVS.W + p, theme: B[p].planet, state, levels, done, pin: true, gift: true, badgeIco: evIcoImg(e), nodes: EVS.nodes, chip };
  });
}
const evTicketPill = (e) => `<div class="pill info ev-tk" aria-label="Boleto del evento">${icon(e.tk)}<span data-evtk>${e.state.tk}</span></div>`;
function evCTA(e) {
  const s = e.state;
  if (e.done) return '';
  if (s.run) return goBtn('Continuar', `Nivel ${s.k + 1}`, 'ev-play');
  // Entrada sin pagar (no debería pasar: se paga antes de entrar al mundo): Jugar abre la entrada.
  if (EVS.tk ? !s.tk && !s.paid : !festPaid(e)) return goBtn('Jugar', `Nivel ${s.k + 1}`, 'ev-buy');
  if (s.tk || !EVS.tk) return goBtn('Jugar', `Nivel ${s.k + 1}`, 'ev-play');
  return `<button class="go wait" data-a="ev-wait">${icon(e.tk)}<span class="t"><b class="outl">Boleto en</b><small data-evclock>${clock(evTicketLeft())}</small></span></button>`;
}
// after: lo que dejó la victoria ({ k, res }) para animar el avance al volver.
// kind: 'mes' o 'fiesta' (si no se dice, el que se estaba viendo).
function showEvent({ anim, after = null, start = null, kind = null } = {}) {
  if (kind) EVS = EVK[kind];
  noticeGen++; // los avisos que el mapa tenía en fila ya no salen aquí
  const e = EVS.get();
  if (!e) return showMap({ anim });
  gallery.active = false;
  current = () => showEvent();
  const p0 = after ? after.planet : start;
  const el = h(`<div class="screen galaxy event ev-${e.key}">
    <div class="space space-${e.ex[0].space}"></div><div class="g3d"></div><div class="glabels g-only"></div>
    <div class="g-only">
      <button class="hbtn tb press out-btn" data-a="back" aria-label="Volver al mapa" title="Mapa">${icon('prev')}</button>
      <div class="wtitle info">${icon(e.ico, 0, 0, 'em')}<div><b>${e.name}</b><small>${e.zone ? `Celebrando en ${e.zone} · ` : ''}¡A jugar! Quedan <span data-evleft>${evDays()}</span></small></div><button class="ev-help tb press" data-a="ev-help" aria-label="Cómo funciona el evento" title="Cómo funciona">?</button></div>
    </div>
    <div class="p-only phud"></div>
    <div class="res">${EVS.tk ? evTicketPill(e) : ''}<div class="pill info" aria-label="Monedas">${coin()}<span data-coins>${money(shownCoins() - (after?.coins || 0))}</span></div>
      <button class="me press" data-a="me" aria-label="Tu perfil" title="Tu perfil">${avatarHTML(save)}</button>${devBtn}</div>
    <div class="cta"></div>
  </div>`);
  let galaxy = null;
  const cta = el.querySelector('.cta'), phud = el.querySelector('.phud');
  const paint = () => {
    const now = EVS.get();
    if (!now) return showMap();
    cta.innerHTML = evCTA(now);
    const tk = el.querySelector('[data-evtk]');
    if (tk) tk.textContent = now.state.tk;
    if (galaxy?.mode === 'planet' && galaxy.sel) paintPlanet(galaxy.sel.wd.w - EVS.W);
  };
  const paintPlanet = (p) => {
    phud.innerHTML = `<button class="hbtn tb press out-btn" data-a="out" aria-label="Volver a los planetas" title="Planetas">${icon('prev')}</button>
      <div class="wtitle info">${miniPlanet(EVENT_BIOMES[e.key][p].emblem, 'em')}<div><b>${e.planets[p]}</b><small>Planeta ${p + 1} de ${EVS.P}</small></div></div>`;
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
    if (a === 'ev-buy') return openEntry(kindOf(e), true);
    if (a === 'ev-help') return openEvIntro(EVS.get() || e);
    if (a === 'me') return openProfile();
    if (a === 'dev') return sideAction(a);
  });
  mount(el, anim);
  paint();
  if (!e.state.intro) wait(anim ? 700 : 300).then(() => el.isConnected && openEvIntro(e));
  const make = () => {
    if (!el.isConnected) return;
    galaxy = new Galaxy(el.querySelector('.g3d'), el.querySelector('.glabels'), {
      worlds: evWorlds(e, after && after.k % EVS.N === EVS.N - 1 && !after.last ? after.planet + 1 : null),
      player: { traveler: equipped('traveler') },
      start: p0 != null ? EVS.W + p0 : null,
      celebrate: after ? { w: EVS.W + after.planet, i: after.k % EVS.N, kind: 'cur', stars: 0 } : null,
      on: {
        mode: (m, w) => {
          el.classList.toggle('zoomed', m === 'planet');
          current = () => showEvent({ start: m === 'planet' ? w - EVS.W : null });
          if (m === 'planet') paintPlanet(w - EVS.W);
        },
        locked: () => toast(`${icon('lock')} Primero termina el planeta anterior`),
        relayout: remount,
        level: (w, i) => {
          const k = (w - EVS.W) * EVS.N + i, s = EVS.get()?.state;
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
  floatBubbles(prizeIcons({ undo: a.undo, wild: a.wild }), { x: innerWidth / 2, y: innerHeight * 0.45 });
  const boss = a.k % EVS.N === EVS.N - 1;
  if (boss && a.planet + 1 < EVS.P && galaxy.sel) {
    await wait(500);
    await galaxy.zoomOut();
    const e = EVS.get();
    galaxy.busy = true;
    if (e) await galaxy.unlock(EVS.W + a.planet + 1, evWorlds(e)[a.planet + 1]);
    toast(`¡${e?.planets[a.planet + 1] || 'Siguiente planeta'} abierto!`);
  }
  galaxy.busy = false;
  paint();
  cta.style.opacity = '';
  if (!reduced()) cta.animate([{ scale: 0.4, opacity: 0 }, { scale: 1.08, opacity: 1, offset: 0.6 }, { scale: 1 }], { duration: 420, easing: 'ease-out' });
  if (a.last) openEvDone(EVS.get() || { name: 'el evento', ico: 'trophy', color: 'gold' });
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
  const kind = kindOf(e), K = EVK[kind];
  let done;
  const closed = new Promise((r) => (done = r));
  const rule = (ico, html) => `<li>${icon(ico)}<span>${html}</span></li>`;
  const m = openModal({
    title: e.name,
    ico: e.ico,
    color: e.color,
    wide: true,
    cls: 'ev-intro',
    body: `<div class="evi-hero"><div class="rays"></div>${EVENT_BIOMES[e.key].map((b, p, all) => `<span class="evi-pl" style="--i:${all.length === 3 ? [-2, -1, 1][p] : p - (all.length - 1) / 2}">${miniPlanet(b.emblem)}</span>`).join('')}${EVENT_BIOMES[e.key].length === 3 ? `<span class="evi-pl" style="--i:2">${icon(e.deco)}</span>` : ''}<span class="evi-ico">${icon(e.ico, 0, 0, 'big')}</span></div>
      ${kind === 'fiesta' ? `<p class="lead">¡Hoy es <b>${e.name}</b>! ${e.days > 1 ? `Solo por ${e.days} días` : 'Solo por hoy'}: viaja por <b>${K.P} planetas</b> y gana premios <b>exclusivos</b> que no salen en ningún otro lado.</p>
      <ul class="evi-rules">
        ${rule('ticket', `Pagas la entrada <b>una vez</b> y reintentas <b>las veces que quieras</b> ${e.days > 1 ? 'mientras dure' : 'hasta la medianoche'}.`)}
        ${rule('flame', `${K.L} niveles <b>difíciles</b>. No cuentan para tu <b>racha</b> ni tu <b>colección</b>.`)}
        ${rule('gift', `El <b>nivel ${K.N}</b> de cada planeta trae un <b>regalo sorpresa</b>: entre más estrellas, más fácil que sea un exclusivo.`)}
        ${rule('flag', `${K.left() > 864e5 ? 'Termina en unos días' : 'Termina hoy a la medianoche'}: te quedan <b>${evDaysOf(K)}</b>.`)}
      </ul>` : `<p class="lead">¡Llegó el evento del mes! Viaja por <b>${EVENT_PLANETS} planetas</b> y gana premios <b>exclusivos</b> que solo salen ahora: disfraces, marcos, reversos, postales, fondos, títulos y naves.</p>
      <ul class="evi-rules">
        ${rule(e.tk, `Cada nivel se juega con tu <b>boleto</b>. Si ganas, lo conservas; si pierdes, llega otro en <b>48 horas</b> o lo compras en ${coin()} <b>${money(evTicketPrice({ ...e, state: { ...e.state, paid: true } }))}</b>.`)}
        ${rule('gift', `El <b>nivel 5</b> de cada planeta trae un <b>regalo sorpresa</b>: entre más estrellas, más fácil que sea un exclusivo.`)}
        ${rule('flame', `${EVENT_LEVELS} niveles <b>difíciles</b>. No cuentan para tu <b>racha</b> ni tu <b>colección</b>.`)}
        ${rule('flag', `Tienes <b>${evDays()}</b> para llegar al último planeta. ¡Entra cada día y no dejes pasar tu boleto!`)}
      </ul>`}`,
    // Botón del mes: con los colores y la flor de la temática (sin el triángulo de Jugar).
    buttons: [{ label: `${icon(e.deco)}<span>¡A jugar!</span>${icon(e.deco)}`, cls: `wide ev-go ev-go-${e.key}`, onClick: () => go && (kind === 'mes' ? openEvent() : openFestival()) }],
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
  const pcHere = !e.state ? null : e.date ? festAlbum().find((x) => x.id === `${e.key}-${e.year}`) : evAlbum().find((x) => x.id === e.state.id); // la postal del álbum, con el año
  confetti(120);
  buzz(30);
  const m = openModal({
    title: `¡Completaste ${e.name}!`,
    ico: e.ico,
    color: 'gold',
    closable: false,
    cls: 'win ev-done',
    body: `<div class="win-top"><div class="rays"></div><div class="ev-win">${icon(e.ico, 0, 0, 'big')}</div></div>
      <p class="lead">Recorriste los ${EVS.P} planetas y ganaste los ${EVS.L} niveles. Todos los premios ya son tuyos.</p>
      ${pcHere ? `${evPostcardHTML(pcHere, 'mini ev-done-pc')}<p class="note">Su postal ya está en tu álbum, en <b>${e.date ? 'Especiales' : 'Eventos'}</b>.</p>` : `<p class="note">${e.date ? 'La próxima festividad trae otra temática. ¡Te esperamos!' : 'El próximo evento trae una temática nueva. ¡Te esperamos!'}</p>`}`,
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
  const e = EVS.get();
  if (!e || e.done) return;
  if (e.state.run) return startEvent();
  if (!EVS.tk) return festPaid(e) ? EVS.enter() && startEvent() : openEntry('fiesta', true);
  if (!e.state.tk) return e.state.paid ? openEvWait() : openEntry('mes', true);
  if (entering) return;
  entering = true;
  evEnter();
  spendTickets(1, '[data-evtk]', e.tk, 1).then(() => {
    entering = false;
    startEvent();
  });
}
// Pase de entrada (8 nov 2026): un boleto grande con el ícono del evento en el talón, su nombre y una línea abajo
// (planetas y niveles, o un reloj). Lo usan la entrada, la espera del boleto, la preventa y la cuenta regresiva, así
// todas se ven igual y caben en una sola vista (también acostado). Las reglas del evento viven en su bienvenida (?).
// state: 'buy' (para comprar) · 'wait' (sin boleto, gris) · 'soon' (todavía no empieza) · 'owned' (entrada lista).
// sub: lo de abajo (HTML; un reloj lleva data-pclock). off: descuento ("−20%") en una cinta.
function passHTML(e, { ico = e.tk || e.ico, state = 'buy', label = 'Boleto de entrada', sub = '', off = '' } = {}) {
  const [hc, hd] = HEADS[e.color] || HEADS.violet;
  return `<div class="ev-pass-wrap"><div class="rays"></div><div class="ev-pass ${state}" style="--pc:${hc};--pd:${hd}">
    <div class="ep-card"><span class="ep-stub">${icon(ico, 0, 0, 'big')}</span>
    <span class="ep-main"><small>${label}</small><b>${e.name}</b>${e.zone ? `<small class="ep-zone">Celebrando en ${e.zone}</small>` : ''}<em>${sub}</em></span></div>
    ${off ? `<i class="ep-off">${off}</i>` : ''}${state === 'owned' ? `<i class="ep-stamp">${icon('check')}¡Lista!</i>` : ''}
  </div></div>`;
}
// Reloj que corre dentro del pase (cierra la ventana cuando llega a 0). get: ms que faltan (0 = ya).
function passClock(m, get, done) {
  const c = m.el.querySelector('[data-pclock]');
  const t = setInterval(() => (c?.isConnected ? (get() > 0 ? (c.textContent = clock(get())) : (clearInterval(t), m.close(), done?.())) : clearInterval(t)), 1000);
}
// Botón para pagar la entrada o el boleto: las monedas salen del monedero. after: qué hacer ya pagado.
// verb: lo que dice el botón ("Entrar", "Comprar boleto"…). Con descuento se ve el precio de antes tachado.
function buyTicketBtn(e, modal, kind = kindOf(e), after = () => wait(350).then(evPlay), verb = null) {
  const K = EVK[kind];
  const p = K.tk ? evTicketPrice(e) : festPrice(e);
  const full = !K.tk && e.soon ? festPrice({ ...e, soon: false }) : p;
  const short = save.coins < p;
  return {
    label: short ? `Te faltan ${coin()} ${money(p - save.coins)}` : `${verb || (e.state?.paid || e.soon ? 'Comprar' : 'Entrar')} · ${coin()} ${full > p ? `<s>${money(full)}</s> ` : ''}${money(p)}`,
    cls: 'green wide',
    disabled: short,
    keep: true,
    onClick: async (btn) => {
      if (!(K.tk ? evBuyTicket() : festBuy(e.soon ? e : undefined))) return;
      btn.disabled = true;
      const r = btn.getBoundingClientRect();
      await spendFromWallet('coins', { x: r.left + r.width / 2, y: r.top + r.height / 2 }, p);
      updateCoins();
      modal().close();
      after();
    },
  };
}
// La entrada (7 nov 2026): es como un contrato. Se paga antes de entrar al mundo del evento, así adentro solo se juega.
// inside: se abrió desde la pantalla del evento (ya pagado se juega el nivel; si no, se entra al mundo).
// 8 nov 2026: solo el pase y "Compra tu boleto"; sin lista de reglas ni "Ahora no" (la X cierra).
function openEntry(kind, inside = false) {
  EVS = EVK[kind];
  const e = EVS.get();
  if (!e) return;
  const fi = kind === 'fiesta';
  const m = openModal({
    title: e.name,
    color: e.color,
    cls: 'entry-modal',
    body: `${passHTML(e, { label: fi ? 'Entrada' : 'Boleto de entrada', sub: `${EVS.P} planetas · ${EVS.L} niveles` })}
      <p class="lead">${fi ? `Compra tu entrada y juega ${e.days > 1 ? 'mientras dure' : 'todo el día'}.` : 'Compra tu boleto y entra al evento.'}</p>`,
    buttons: [buyTicketBtn(e, () => m, kind, () => (inside ? current?.() : warp(() => showEvent({ kind }))), 'Entrar')],
  });
}
// Perdiste el boleto del mes: el siguiente llega solo (reloj) o se compra ya.
function openEvWait() {
  const e = ev();
  if (!e) return;
  EVS = EVK.mes;
  const m = openModal({
    title: 'Sin boleto',
    color: e.color,
    cls: 'entry-modal',
    body: `${passHTML(e, { state: 'wait', label: 'Tu próximo boleto llega en', sub: `<span class="ep-clock" data-pclock>${clock(evTicketLeft())}</span>` })}
      <p class="lead">Espéralo o cómpralo ya y sigue jugando.</p>`,
    buttons: [buyTicketBtn(e, () => m, 'mes', () => (current?.(), wait(350).then(evPlay)), 'Comprar boleto')],
  });
  passClock(m, evTicketLeft, () => current?.());
}
// La partida del evento: mismas reglas, sin estrellas. Perder, rendirse o abandonar gasta el boleto.
function startEvent() {
  const e = EVS.get(), run = e?.state.run;
  if (!run) return showEvent();
  const old = [...app.children];
  game?.destroy();
  game = null;
  document.getElementById('modal-root').replaceChildren();
  const K = EVS, level = variantLevel(K.level(e, run.k), run.v);
  const back = (after) => showEvent({ anim: 'down', after, start: Math.floor(run.k / K.N) });
  const lose = () => (K.lose(), back());
  game = new Game(app, level, {
    dev,
    resume: run.state,
    saved: true,
    canExit: false, // eventos: sin Guardar y salir (7 nov 2026)
    event: { ico: e.ico, table: e.key, boss: run.k % K.N === K.N - 1, tk: !!K.tk },
    onSave: (state) => {
      const r = K.get()?.state.run;
      if (r) (r.state = state), (r.at = Date.now()), persist();
    },
    onExit: () => back(),
    onAbandon: lose,
    onDone: async (res) => {
      if (res.items?.length) await openEvPrize(e, res);
      back(res.counted ? res : null);
    },
    onWin: (stars) => {
      const r = K.win(stars);
      if (!r) return { coins: 0, tickets: 0, prev: 0, items: [], title: '¡Nivel superado!' };
      persist();
      return { ...r, coins: r.coins || 0, tickets: 0, prev: 0, counted: true, title: r.last ? (e.date ? '¡Festividad completada!' : '¡Evento completado!') : `¡Nivel ${r.k + 1} de ${K.L}!` };
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
  diffTag(game, level);
}
// Premio del 5.º nivel: la caja tiembla, se abre y los exclusivos salen en burbujas. No se ponen solos: se cambian en el perfil.
function openEvPrize(e, res) {
  return new Promise((done) => {
    confetti(60);
    const m = openModal({
      title: `¡${e.planets[res.planet]} completado!`,
      color: e.color,
      closable: false,
      cls: 'gift-prize',
      body: `<div class="gift-box"><div class="gbox"><span class="lid">${boxLid()}</span><span class="body">${boxBody()}</span></div></div>
        <p class="note">Exclusivo de ${e.name}: es tuyo para siempre. Póntelo desde tu perfil.</p>`,
      buttons: [{ label: 'Continuar', cls: 'green wide', onClick: () => { closeShelf(); done(); } }],
    });
    boxBubbles(m, res.items.map((it) => giftBubble(it.sec, it.k)));
  });
}
// Una cosa de la tienda como burbuja: un circulito con su dibujo y abajo qué es (Avatar, Postal…).
const GIFT_KIND = { avatar: 'Disfraz', ring: 'Marco', title: 'Título', back: 'Reverso', face: 'Caras', traveler: 'Viajero', space: 'Fondo', frame: 'Postal' };
const giftBubble = (sec, k) => `<span class="lb-pic lp-${sec}">${sec === 'title' ? titleIcon(k) : shopPreview(sec, k)}</span><b>${GIFT_KIND[sec]}</b>`;
// La caja de regalo de la ventana (.gbox) tiembla, se abre y suelta sus premios en burbujas.
function boxBubbles(m, bubbles) {
  const box = m.el.querySelector('.gbox');
  // Los viajeros son 3D: su lienzo vive en la burbuja, así que la vitrina se arma cuando la burbuja ya existe.
  const out = () => {
    lootBubbles(m, bubbles, box, { lift: 40 });
    if (m.el.querySelector('.loot-bub canvas')) setTimeout(() => travShelf(m.el), 50);
  };
  if (reduced()) return m.el.classList.add('opened'), out();
  setTimeout(async () => {
    await box.animate([{ rotate: '0deg' }, { rotate: '-9deg' }, { rotate: '8deg' }, { rotate: '-6deg' }, { rotate: '4deg' }, { rotate: '0deg' }], { duration: 650, iterations: 2 }).finished;
    box.querySelector('.lid').animate([{ translate: '0 0', rotate: '0deg' }, { translate: '30px -70px', rotate: '40deg', opacity: 1, offset: 0.6 }, { translate: '60px -40px', rotate: '80deg', opacity: 0 }], { duration: 600, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)', fill: 'forwards' });
    const q = box.getBoundingClientRect();
    sparkle({ x: q.left + q.width / 2, y: q.top + q.height / 3 }, 22);
    buzz(20);
    out();
  }, 450);
}

// ---------- Lluvia de meteoritos (ver meteor.js) ----------
const mmss = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
// Meteoritos que cruzan el cielo del mapa (encima de los planetas, debajo de los botones). Cada uno con su lugar,
// tamaño y espera, para que no caigan parejos.
const METS = [[78, 4, 1, 0], [52, -6, 0.7, 1.3], [96, 18, 0.85, 2.1], [64, 26, 0.6, 3.4], [88, -2, 1.1, 4.6], [38, 8, 0.75, 5.5], [70, 40, 0.65, 6.8]];
// Se truenan al tocarlos (cuentan para el premio de meteoros, ver countPop) y no vuelven hasta su siguiente pasada.
// Lluvia de estrellas: estrellas fugaces en lugar de meteoritos (12 nov 2026: cuentan aparte, con su premio y su logro).
// La aurora no trae nada que tronar (sky: null).
const metSky = () => { const m = meteor(); return m?.K.sky ? `<div class="met-sky sh-${m.K.kind}" aria-hidden="true">${METS.map(([x, y, s, d]) => `<i style="left:${x}%;top:${y}%;--s:${s};animation-delay:${d}s">${icon(m.K.sky)}</i>`).join('')}</div>` : ''; };
document.addEventListener('pointerdown', (e) => {
  const m = e.target.closest?.('.met-sky i');
  if (!m || m.classList.contains('popped')) return;
  e.stopPropagation();
  const r = m.getBoundingClientRect(), at = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  // El que se ve se va (hasta que vuelva a pasar) y en su lugar truena una copia quieta.
  const f = document.createElement('div');
  f.className = 'met-pop';
  f.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
  f.innerHTML = icon(meteor()?.K.sky || 'meteoro');
  document.body.append(f);
  m.classList.add('popped');
  m.addEventListener('animationiteration', () => m.classList.remove('popped'), { once: true });
  popBalloon(f, ['#ffd85a', '#ff8a3d']);
  sparkle(at, 10);
  const K0 = meteor()?.K;
  countPop(K0?.pop || (K0?.kind === 'star' ? 'estrella' : 'meteoro'), at);
}, true);
// Aviso de cada lluvia: un meteorito cae, truena y se dice lo que da. La primera vez en la vida, con sus reglas.
// La de estrellas (11 nov 2026) usa la misma ventana con sus números: monedas ×3, hasta 3 premios, más descuento.
// Lluvias nuevas (14 nov 2026): cada una con lo suyo (RAIN_RULES); la primera vez en la vida, además, cuándo cae.
// Mismo formato que meteoritos y estrellas (14 nov 2026, el usuario): lo que da, el premio de 3★ y, la primera vez,
// cuándo cae.
const RAIN_RULES = {
  comet: () => [
    [icon('ticket'), 'Los niveles nuevos <b>no gastan boletos</b> y cada uno que ganes te da <b>1 boleto más</b>.'],
    [star(true), 'Gana un nivel con <b>3 estrellas</b> y te cae un <b>premio sorpresa</b> (uno por lluvia).'],
  ],
  aurora: () => [
    [icon(col()?.token || 'concha'), 'Las <b>fichas de la colección</b> de cada nivel que ganes valen <b>el doble</b>.'],
    [star(true), 'Cada nivel que ganes con <b>3 estrellas</b> te da un <b>premio sorpresa</b> (hasta 2 por aurora).'],
  ],
  crystal: () => [
    [icon('gift'), 'Los niveles que ganes te pueden dar una <b>ayuda</b>: comodín, deshacer, imán, telescopio o reloj.'],
    [star(true), 'Gana un nivel con <b>3 estrellas</b> y te cae un <b>premio sorpresa</b> (uno por lluvia).'],
  ],
};
const RAIN_WHEN = {
  comet: 'Cae <b>sin aviso</b>, una vez por semana y solo <b>20 minutos</b>. ¡Si la ves, juega!',
  aurora: 'Sale <b>sin aviso</b>, una vez por semana y solo <b>20 minutos</b>, cuando hay colección. ¡Si la ves, juega!',
  crystal: 'Cae <b>sin aviso</b>, una vez cada dos semanas y solo <b>10 minutos</b>. ¡Si la ves, juega ya!',
};
const rainSeen = (k) => (k === 'star' ? save.starSeen : k === 'met' ? save.metSeen : save.rainSeen?.[k]);
function openMetIntro() {
  const K = meteor()?.K || SHOWERS.met, star3 = K.kind === 'star';
  const first = !rainSeen(K.kind);
  const fresh = RAIN_RULES[K.kind];
  return new Promise((done) => {
    const m = openModal({
      title: `¡${K.name}!`,
      color: 'violet',
      wide: true,
      cls: `ev-intro met-intro sh-${K.kind}`,
      body: `<div class="evi-hero met-hero"><div class="rays"></div><span class="met-fall">${icon(K.ico, 0, 0, 'big')}</span></div>
        <p class="lead">¡Está cayendo ahora! Te quedan <b class="met-clock">${mmss(meteor()?.left() || 0)}</b> para aprovecharla.</p>
        <ul class="evi-rules">${fresh ? `${fresh(K).map(([ic, t]) => `<li>${ic}<span>${t}</span></li>`).join('')}${first ? `<li>${icon(K.ico)}<span>${RAIN_WHEN[K.kind]}</span></li>` : ''}</ul>` : `
          <li>${coin()}<span>Las monedas de cada nivel que ganes valen <b>${star3 ? 'el triple' : 'el doble'}</b>.</span></li>
          <li>${star(true)}<span>${star3 ? 'Cada nivel que ganes con <b>3 estrellas</b> te da un <b>premio sorpresa</b> (hasta 3 por lluvia).' : 'Gana un nivel con <b>3 estrellas</b> y te cae un <b>premio sorpresa</b> (uno por lluvia).'}</span></li>
          <li>${icon('bag')}<span>Tienda <b>−${Math.round(K.shop * 100)}%</b>; ${star3 ? `comodín <b>−${Math.round(helpOff(K, 'wild') * 100)}%</b>, deshacer y ayudas <b>−${Math.round(helpOff(K, 'undo') * 100)}%</b> y +5 cartas <b>−${Math.round(helpOff(K, 'extra') * 100)}%</b>` : `comodín y deshacer <b>−${Math.round(helpOff(K, 'wild') * 100)}%</b>`}.</span></li>
          ${maxBet(save.next || 0) > 1 ? `<li>${icon('ticket')}<span>¿Apuestas? Los boletos de tu <b>×${betShown() > 1 ? betShown() : maxBet(save.next || 0)}</b> cuestan <b>la mitad</b>.</span></li>` : ''}
          ${first ? `<li>${icon(K.ico)}<span>${star3 ? 'Cae <b>sin aviso</b>, unas veces por semana y solo <b>15 minutos</b>. ¡Si la ves, juega ya!' : 'Cae <b>sin aviso</b>, unas veces por semana, a cualquier hora. ¡Si la ves, juega!'}</span></li>` : ''}
        </ul>`}`,
      buttons: [{ label: '¡A jugar!', cls: 'gold wide' }],
      onClose: () => {
        const mt = meteor();
        if (mt) mt.state.intro = true;
        if (star3) save.starSeen = true;
        else if (fresh) (save.rainSeen ||= {})[K.kind] = true;
        else save.metSeen = true;
        persist();
        done();
      },
    });
    if (reduced()) return;
    // Cae en diagonal dejando su estela y al llegar truena con chispas.
    const f = m.el.querySelector('.met-fall');
    f.animate([{ translate: '160px -150px', scale: 0.5, opacity: 0 }, { opacity: 1, offset: 0.2 }, { translate: '0 0', scale: 1.1, opacity: 1, offset: 0.8 }, { translate: '0 0', scale: 1 }], { duration: 900, delay: 250, easing: 'cubic-bezier(0.5, 0, 0.9, 0.6)', fill: 'backwards' })
      .finished.then(() => {
        if (!f.isConnected) return;
        const r = f.getBoundingClientRect();
        sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 26);
        buzz(25);
        f.classList.add('landed');
      }, () => {});
    m.el.querySelectorAll('.evi-rules li').forEach((el, i) => el.animate([{ opacity: 0, translate: '-14px 0' }, { opacity: 1, translate: '0 0' }], { duration: 320, delay: 1100 + i * 120, easing: 'ease-out', fill: 'backwards' }));
  });
}
// El premio de la lluvia fue un exclusivo de meteoro: sale de una caja como los del evento.
function openMetPrize(items, kind = 'met') {
  return new Promise((done) => {
    confetti(60);
    const m = openModal({
      title: '¡Te cayó un tesoro del cielo!',
      color: 'violet',
      closable: false,
      cls: 'gift-prize',
      body: `<div class="gift-box"><div class="gbox"><span class="lid">${boxLid()}</span><span class="body">${boxBody()}</span></div></div>
        <p class="note">Exclusivo de la ${(SHOWERS[kind] || SHOWERS.met).name.toLowerCase()}: es tuyo para siempre. Póntelo desde tu perfil.</p>`,
      buttons: [{ label: 'Continuar', cls: 'green wide', onClick: () => { closeShelf(); done(); } }],
    });
    boxBubbles(m, items.map((it) => giftBubble(it.sec, it.k)));
  });
}
// Cada segundo avanzan los relojes de la lluvia (botón Jugar, aviso y ficha del tablero). Cuando empieza o termina,
// la pantalla se vuelve a pintar (si hay una ventana o una animación, en cuanto se pueda).
let metWas = !!meteor();
setInterval(() => {
  const m = meteor();
  document.querySelectorAll('.met-clock').forEach((c) => (c.textContent = m ? mmss(m.left()) : ''));
  if (!!m === metWas || (!game && (modalOpen() || document.querySelector('.warp') || map?.galaxy?.busy))) return;
  metWas = !!m;
  // En el tablero no se toca nada: la pantalla que sigue ya sale como debe.
  if (!game) current?.();
}, 1000);

// ---------- Misiones, logros y racha cumplidos: festejo en la portada (10 nov 2026, pedido del usuario) ----------
// Ya se cobraron al cumplirse (autoClaim en missions.js, rachaWin en events.js; si cerró la app, ya los tenía). En la
// portada se oscurece todo y al centro sale una tarjeta por cada uno, con su etiqueta de qué es (Misión del día, Logro,
// Racha cohete, Cofre del día) y su animación: la misión llena su barra y cae la palomita; el logro deja caer su medalla
// girando con confeti; el cohete de la racha sube y aterriza; el cofre tiembla. Los premios brotan uno por uno, luego las
// monedas vuelan al monedero (que se queda encima de lo oscuro y hasta ahí no las enseñaba) y lo demás sale en burbujas.
// Tocar apura. Si llegan muchos juntos, los primeros salen uno por uno y el resto en una sola tarjeta.
const FEAT_ONE = 3;
const FEAT_KIND = {
  mis: { tag: 'Misión del día', ico: 'misiones', head: '¡Misión cumplida!' },
  bonus: { tag: 'Misiones del día', ico: 'cofre', head: '¡Cumpliste las 3!' },
  logro: { tag: 'Logro', ico: 'trophy' },
  racha: { tag: 'Racha cohete', ico: 'rocket' },
  pase: { tag: 'Pasaporte', ico: 'pasaporte' },
  secreto: { tag: 'Niveles secretos', ico: 'starSecret' },
  many: { tag: '¡Y más premios!', ico: 'gift' },
};
const FEAT_WORD = { mis: ['misión', 'misiones'], bonus: ['cofre', 'cofres'], logro: ['logro', 'logros'], racha: ['premio de racha', 'premios de racha'], pase: ['sello', 'sellos'], secreto: ['premio secreto', 'premios secretos'] };
const featPrize = (fs) => {
  const p = { coins: 0, wild: 0, undo: 0 };
  fs.forEach((f) => ['coins', 'wild', 'undo'].forEach((k) => (p[k] += f[k] || 0)));
  return p;
};
function featHTML(fs) {
  const f = fs[0], p = featPrize(fs), t = fs.length > 1 ? 'many' : f.t, K = FEAT_KIND[t];
  const prize = [p.coins && [coin(), p.coins], p.wild && [icon('wild'), p.wild], p.undo && [icon('undo'), p.undo]].filter(Boolean)
    .map(([ico, n]) => `<span class="ft-chip">${ico}<b class="outl" data-n="${n}">+0</b></span>`).join('')
    // Pasaporte y secretos: el exclusivo que trae, con el dibujo de su sección y su nombre.
    + (fs.length === 1 && f.item ? `<span class="ft-chip ft-ex">${icon(SHOP_ICO[f.item[0]])}<b class="outl">${esc(item(...f.item).name)}</b></span>` : '');
  // inPic: lo que va encima del dibujo (palomita, medalla, número) · below: lo de abajo del nombre (barra, medallas).
  let pic = icon(K.ico), head = K.head, name = '', inPic = '', below = '';
  if (t === 'many') {
    const by = {};
    fs.forEach((x) => (by[x.t] = (by[x.t] || 0) + 1));
    head = `${fs.length} premios más`;
    name = Object.entries(by).map(([k, n]) => `${n} ${FEAT_WORD[k][n === 1 ? 0 : 1]}`).join(' · ');
  } else if (t === 'mis') {
    const m = missionDef(f.id);
    pic = missionIcon(m);
    name = m.text(f.goal);
    below = '<span class="mbar"><i></i></span>';
    inPic = `<i class="ft-ok">${icon('check')}</i>`;
  } else if (t === 'bonus') {
    name = 'Cofre del día';
  } else if (t === 'logro') {
    const l = ACHIEVEMENTS.find((x) => x.id === f.id);
    pic = missionIcon(l);
    head = `¡Medalla de ${ACHIEVEMENT_MEDAL[f.step]}!`;
    name = l.name;
    below = `<span class="ft-medals">${ACHIEVEMENT_MEDAL.map((x, i) => `<i class="medal m${i}${i < f.step ? ' on' : ''}${i === f.step ? ' ft-new' : ''}"></i>`).join('')}</span>`;
    inPic = `<i class="ft-medal medal on m${f.step}"></i>`;
  } else if (t === 'pase') {
    head = `¡Sello ${f.n} de tu pasaporte!`;
    name = `${fmt(passGoal(f.n))} niveles ganados`;
    inPic = `<b class="ft-num outl">${f.n}</b>`;
  } else if (t === 'secreto') {
    head = `¡${f.n} niveles secretos ganados!`;
    name = 'Premio secreto';
    inPic = `<b class="ft-num outl">${f.n}</b>`;
  } else if (t === 'racha') {
    head = `¡${f.n} estrellas seguidas!`;
    name = 'Premio de racha';
    inPic = `<b class="ft-num outl">${f.n}</b>`;
  }
  return `<div class="feat ft-${t}${t === 'logro' ? ` m${f.step}` : ''}" role="status"><span class="rays"></span>
    <span class="ft-tag">${icon(K.ico)}${K.tag}</span>
    <span class="ft-pic">${pic}${inPic}</span>
    <small class="ft-head">${head}</small><b class="ft-name">${name}</b>${below}
    <div class="ft-prize">${prize}</div></div>`;
}
// Pasaporte y secretos (12 nov 2026, el usuario: sin botón ni ventana, con más producción): antes de su tarjeta entra un
// pasaporte, se abre, cae el sello (el ícono de su marco; en los secretos, la estrella morada), dice lo que ganaste, se
// cierra y se va volando. Luego sale la tarjeta de siempre con sus premios. Los dos son el mismo Pasaporte galáctico
// (12 nov 2026): la página izquierda va vacía y en la derecha cae el sello; dice «¡N niveles ganados!» o
// «¡N niveles secretos!» y lo que ganaste.
const EX_WORD = { frame: 'Postal exclusiva', title: 'Título exclusivo', space: 'Fondo exclusivo', back: 'Reverso exclusivo', avatar: 'Disfraz exclusivo', ring: 'Marco exclusivo', face: 'Caras exclusivas', traveler: 'Viajero exclusivo' };
async function passScene(back, f) {
  if (reduced()) return;
  const sec = f.t === 'secreto', F = passFrameOf(f.n);
  const ico = sec ? 'starSecret' : F[4], pc = sec ? '#8a5cf0' : F[3];
  const what = f.item ? `${EX_WORD[f.item[0]]}: <b>${esc(item(...f.item).name)}</b>` : `<b>${money(f.coins)}</b> monedas`;
  const el = h(`<div class="pp-scene${sec ? ' sec' : ''}" style="--pc:${pc}">
    <div class="pp-book">
      <div class="pp-page pp-r"><span class="pp-slot"></span><span class="pp-stamp">${icon(ico)}<i class="outl">${f.n}</i></span></div>
      <div class="pp-cover"><div class="pp-front">${icon('pasaporte')}<b>PASAPORTE</b><small>Galáctico</small></div><div class="pp-page pp-l"></div></div>
    </div>
    <p class="pp-say"><b class="outl">${sec ? `¡${fmt(f.n)} niveles secretos!` : `¡${fmt(passGoal(f.n))} niveles ganados!`}</b><span>${what}</span></p>
  </div>`);
  back.append(el);
  const book = el.querySelector('.pp-book'), cover = el.querySelector('.pp-cover'), stamp = el.querySelector('.pp-stamp'), say = el.querySelector('.pp-say');
  const anim = (node, kf, o) => node.animate(kf, { fill: 'forwards', ...o }).finished.catch(() => {});
  // Entra cerrado, girando desde abajo.
  await anim(book, [{ translate: '-25% 90vh', rotate: '-25deg', scale: 0.5 }, { translate: '-25% -14px', rotate: '6deg', scale: 1.05, offset: 0.75 }, { translate: '-25% 0', rotate: '0deg', scale: 1 }], { duration: 750, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' });
  await wait(200);
  // Se abre: la portada gira sobre el lomo y el libro se centra.
  anim(book, [{ translate: '-25% 0' }, { translate: '0 0' }], { duration: 650, easing: 'ease-in-out' });
  await anim(cover, [{ rotate: 'y 0deg' }, { rotate: 'y -180deg' }], { duration: 650, easing: 'ease-in-out' });
  await wait(250);
  // Cae el sello con golpe: tiembla el libro, chispas.
  await anim(stamp, [{ scale: 3.2, rotate: '-40deg', opacity: 0 }, { scale: 0.88, rotate: '-4deg', opacity: 1, offset: 0.75 }, { scale: 1, rotate: '-10deg', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(0.5, 0, 0.75, 0)' });
  buzz(35);
  sparkleAt(stamp, 26);
  book.animate([{ translate: '0 0' }, { translate: '0 6px' }, { translate: '0 -2px' }, { translate: '0 0' }], { duration: 260 });
  // Lo que ganaste.
  await anim(say, [{ scale: 0.4, opacity: 0, translate: '0 20px' }, { scale: 1.08, opacity: 1, translate: '0 0', offset: 0.7 }, { scale: 1, opacity: 1, translate: '0 0' }], { duration: 380, easing: 'ease-out' });
  confetti(60);
  await wait(1500);
  // Se cierra y se va volando.
  anim(say, [{ opacity: 1 }, { opacity: 0, translate: '0 16px' }], { duration: 250 });
  anim(book, [{ translate: '0 0' }, { translate: '-25% 0' }], { duration: 550, easing: 'ease-in-out' });
  await anim(cover, [{ rotate: 'y -180deg' }, { rotate: 'y 0deg' }], { duration: 550, easing: 'ease-in-out' });
  await anim(book, [{ translate: '-25% 0', rotate: '0deg', scale: 1, opacity: 1 }, { translate: '-25% 12px', rotate: '-6deg', scale: 1.05, opacity: 1, offset: 0.25 }, { translate: '60vw -80vh', rotate: '35deg', scale: 0.3, opacity: 0 }], { duration: 650, easing: 'cubic-bezier(0.5, 0, 0.75, 0)' });
  el.remove();
}
async function featCard(back, fs) {
  const p = featPrize(fs), t = fs.length > 1 ? 'many' : fs[0].t;
  if (t === 'pase' || t === 'secreto') await passScene(back, fs[0]);
  const el = h(featHTML(fs));
  back.append(el);
  // Sin atajo al tocar (10 nov 2026, el usuario lo pidió): solo "reducir movimiento" la hace instantánea.
  const fast = reduced();
  const pause = (ms) => wait(fast ? 60 : ms);
  const anim = (node, kf, o) => (fast || !node ? Promise.resolve() : node.animate(kf, o).finished);
  const pic = el.querySelector('.ft-pic'), tag = el.querySelector('.ft-tag');
  buzz(20);
  // Entra la tarjeta con resorte; la etiqueta llega de lado y el dibujo brota.
  anim(tag, [{ translate: '-120% 0', rotate: '-14deg', opacity: 0 }, { translate: '6% 0', rotate: '-4deg', opacity: 1, offset: 0.7 }, { translate: '0 0', rotate: '-4deg', opacity: 1 }], { duration: 340, delay: 110, easing: 'ease-out', fill: 'backwards' });
  await anim(el, [{ scale: 0.2, rotate: '-10deg', opacity: 0 }, { scale: 1.1, rotate: '3deg', opacity: 1, offset: 0.65 }, { scale: 1, rotate: '0deg', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' });
  el.classList.add('pic-on');
  if (t === 'racha') {
    // El cohete despega desde abajo, se pasa y aterriza temblando (una sola vez: hasta aquí no se veía).
    await anim(pic.querySelector(':scope > .ico'), [{ translate: '0 140px', scale: 0.6, opacity: 0 }, { translate: '0 -26px', scale: 1.15, opacity: 1, offset: 0.65 }, { translate: '0 0', scale: 1, opacity: 1 }], { duration: 420, easing: 'ease-out' });
    sparkleAt(pic, 18);
    anim(pic, [{ rotate: '0deg' }, { rotate: '-7deg' }, { rotate: '6deg' }, { rotate: '0deg' }], { duration: 260 });
    el.classList.add('num-on');
    await anim(el.querySelector('.ft-num'), [{ scale: 3, opacity: 0 }, { scale: 0.9, opacity: 1, offset: 0.7 }, { scale: 1, opacity: 1 }], { duration: 260, easing: 'ease-out', fill: 'backwards' });
  } else {
    // Brota el dibujo de adentro (el círculo ya llegó con la tarjeta).
    await anim(pic.firstElementChild, [{ scale: 0, rotate: '-30deg' }, { scale: 1.25, rotate: '8deg', offset: 0.6 }, { scale: 1, rotate: '0deg' }], { duration: 320, easing: 'ease-out' });
    // Pasaporte y secretos: el número cae como sello, con confeti.
    if (t === 'pase' || t === 'secreto') {
      el.classList.add('num-on');
      await anim(el.querySelector('.ft-num'), [{ scale: 3, rotate: '-25deg', opacity: 0 }, { scale: 0.9, rotate: '6deg', opacity: 1, offset: 0.7 }, { scale: 1, rotate: '0deg', opacity: 1 }], { duration: 300, easing: 'ease-out', fill: 'backwards' });
      buzz(25);
      sparkleAt(pic, 22);
      if (!fast) confetti(50);
    }
  }
  if (t === 'mis') {
    await anim(el.querySelector('.mbar i'), [{ width: '45%' }, { width: '100%' }], { duration: 380, easing: 'ease-out', fill: 'forwards' });
    el.classList.add('done');
    await anim(el.querySelector('.ft-ok'), [{ scale: 3, opacity: 0, rotate: '-40deg' }, { scale: 0.85, opacity: 1, rotate: '0deg', offset: 0.7 }, { scale: 1, opacity: 1 }], { duration: 260, easing: 'ease-out' });
    sparkleAt(pic, 14);
  } else if (t === 'bonus') {
    await anim(pic, [{ rotate: '0deg' }, { rotate: '-14deg' }, { rotate: '12deg' }, { rotate: '-9deg' }, { rotate: '0deg' }], { duration: 340, iterations: 2 });
    sparkleAt(pic, 26);
    if (!fast) confetti(40);
  } else if (t === 'logro') {
    el.classList.add('done');
    await anim(el.querySelector('.ft-medal'), [{ translate: '0 -220px', scale: 0.4, rotate: '-540deg' }, { translate: '0 8px', scale: 1.3, rotate: '15deg', offset: 0.75 }, { translate: '0 0', scale: 1, rotate: '0deg' }], { duration: 520, easing: 'ease-out' });
    sparkleAt(pic, 20);
    if (!fast) confetti(50);
    anim(el.querySelector('.ft-new'), [{ scale: 1 }, { scale: 1.8 }, { scale: 1 }], { duration: 300 });
  } else el.classList.add('done');
  // Los premios brotan uno por uno y su número cuenta.
  const chips = [...el.querySelectorAll('.ft-chip')];
  for (const c of chips) {
    c.classList.add('on');
    const b = c.querySelector('b');
    if (b.dataset.n == null) await anim(c, [{ scale: 0, opacity: 0 }, { scale: 1.3, opacity: 1, offset: 0.6 }, { scale: 1, opacity: 1 }], { duration: 260, easing: 'ease-out' });
    else if (fast) b.textContent = `+${money(+b.dataset.n)}`;
    else {
      countUp(b, +b.dataset.n);
      await anim(c, [{ scale: 0, opacity: 0 }, { scale: 1.3, opacity: 1, offset: 0.6 }, { scale: 1, opacity: 1 }], { duration: 230, easing: 'ease-out' });
    }
  }
  await pause(450);
  // Fuera de la cola: ahora sí cuentan en el monedero y vuelan a él.
  // Se quitan esos (no siempre son los primeros: pasaporte y secretos van solos y los demás se juntan).
  for (const f of fs) save.feats.splice(save.feats.indexOf(f), 1);
  persist();
  const r = el.querySelector('.ft-prize').getBoundingClientRect(), at = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  const runs = [p.coins ? flyToWallet('coins', at, p.coins) : Promise.resolve()];
  [p.wild && ['wild', p.wild], p.undo && ['undo', p.undo]].filter(Boolean).forEach(([k, n], i) => runs.push(wait(i * 400).then(() => popPrize(icon(k), `+${n}`, { x: at.x + (i ? 50 : p.undo && p.wild ? -50 : 0), y: at.y }))));
  fs.forEach((f) => f.title && toast(`${icon('crown')} ¡Nuevo título! ${item('title', f.title).name}`));
  chips.forEach((c) => c.classList.remove('on'));
  refreshMis();
  refreshAchievements();
  refreshStreak();
  await Promise.race([Promise.all(runs), wait(850)]);
  await anim(el, [{ scale: 1, opacity: 1, translate: '0 0' }, { scale: 0.6, opacity: 0, translate: '0 -60px' }], { duration: 220, easing: 'ease-in' });
  el.remove();
}
const sparkleAt = (node, n) => {
  const r = node.getBoundingClientRect();
  sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, n);
};
// Cuenta de 0 a n en el número de un premio.
function countUp(el, n) {
  const t0 = performance.now(), D = 260;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / D);
    el.textContent = `+${money(Math.round(n * (1 - (1 - k) ** 3)))}`;
    if (k < 1 && el.isConnected) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
// Corre la cola. Al girar el teléfono la pantalla se vuelve a dibujar: lo oscuro (con la tarjeta que va) se pasa a la
// nueva y sigue donde iba (antes se quitaba). Si entra a un nivel, se detiene y lo que falte sale al volver.
let featsRun = null;
function playFeats() {
  autoClaim();
  streakPendToFeats();
  if (featsRun) return featsRun;
  if (!save.feats?.length || !document.querySelector('#app .screen.galaxy')) return Promise.resolve();
  const back = h('<div class="feat-back"></div>');
  let res = null;
  // Lo oscuro va dentro de la pantalla para que el monedero quede encima (la pantalla aísla sus capas).
  const attach = () => {
    const screen = document.querySelector('#app .screen.galaxy');
    if (!screen) return false;
    if (back.parentNode !== screen) screen.append(back);
    const r = screen.querySelector('.res');
    if (r !== res) res?.classList.remove('feat-lift'), (res = r), r?.classList.add('feat-lift');
    return true;
  };
  attach();
  const keep = setInterval(() => !back.isConnected && !game && attach(), 120);
  if (!reduced()) back.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'backwards' });
  featsRun = (async () => {
    try {
      let shown = 0;
      while (save.feats?.length && !game && attach()) {
        if (modalOpen()) { await wait(300); continue; }
        // Pasaporte y secretos siempre solos (llevan su escena); los demás se juntan después de FEAT_ONE.
        const solo = (f) => f.t === 'pase' || f.t === 'secreto';
        const rest = save.feats.filter((f) => !solo(f));
        const pick = solo(save.feats[0]) || shown < FEAT_ONE || rest.length < 2 ? save.feats.slice(0, 1) : rest;
        await featCard(back, pick);
        shown++;
      }
    } finally {
      clearInterval(keep);
      if (!reduced() && back.isConnected) await back.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).finished;
      back.remove();
      res?.classList.remove('feat-lift');
      featsRun = null;
    }
  })();
  return featsRun;
}
// Algo se cumplió estando en la portada (p. ej. meteoros del cielo): se festeja ahí mismo.
addEventListener('feats', () => {
  if (game || featsRun || save.onboard !== 'done' || !document.querySelector('#app .galaxy')) return;
  const gen = noticeGen;
  calm(gen).then((ok) => ok && !game && playFeats());
});

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
  if (sideTourDue()) {
    if (!(await calm(gen))) return;
    if (document.querySelector('#app .side.l')) await sideTour();
  }
  // La lluvia de meteoritos va antes que todo: dura solo 30 minutos.
  if (meteor() && !meteor().state.intro) {
    if (!(await calm(gen))) return;
    if (meteor() && !meteor().state.intro) await openMetIntro();
  }
  // Nave de rescate: ya no te alcanza para el siguiente nivel (una vez por semana).
  if (rescueDue()) {
    if (!(await calm(gen))) return;
    if (rescueDue()) await openRescue();
  }
  for (const k of ['racha', 'mis', 'logros', 'meteoro', 'col', 'apuesta', 'estrellas', 'mes', 'col2', 'cometas', 'fiesta', 'col3', 'aurora', 'fiesta2', 'cristales', 'fiesta3', 'fiesta4']) {
    // La lluvia: solo si nunca se ha visto una (quien ya la vio caer no necesita la ventana). La apuesta: nivel 101.
    // Las lluvias nuevas (14 nov 2026), igual: al llegar a su nivel, si todavía no ha visto caer una.
    const rk = RAIN_KEY[k];
    if (!(k === 'meteoro' ? (save.next || 0) >= MET_FROM && !save.metSeen : k === 'estrellas' ? (save.next || 0) >= STAR_FROM && !save.starSeen : rk ? (save.next || 0) >= SHOWERS[rk].from && !rainSeen(rk) : k === 'apuesta' ? maxBet(save.next) > 1 : isOn(k)) || save.intro?.[k]) continue;
    if (!(await calm(gen))) return;
    await openUnlock(k);
    if (k === 'apuesta') {
      // Ya vio la apuesta más alta de aquí: las de abajo no salen otra vez.
      for (const m of betSteps(save.next)) save.intro[`apuesta${m}`] = true;
      persist();
      paintBetSticker();
    }
  }
  // Misiones, logros y racha que se cumplieron jugando: su festejo y sus monedas al monedero.
  autoClaim();
  streakPendToFeats();
  if (save.feats?.length) {
    if (!(await calm(gen))) return;
    await playFeats();
  }
  const c = col();
  if (c && !c.state.intro) {
    if (!(await calm(gen))) return;
    await openColIntro(c);
  }
  // La festividad va antes que el evento del mes: dura solo 24 horas.
  const f = festival();
  if (f && !f.soon && !f.done && !f.state.intro) {
    if (!(await calm(gen))) return;
    await openEvIntro(f, true);
  }
  const e = ev();
  if (e && !e.done && !e.state.intro) {
    if (!(await calm(gen))) return;
    await openEvIntro(e, true);
  }
  // Apuesta (9 nov 2026): al subir a ×3, ×5 o ×10, su presentación (la del ×2 sale con las de desbloqueo).
  const mb = maxBet(save.next || 0);
  if (mb > 2 && save.intro?.apuesta && !save.intro[`apuesta${mb}`]) {
    if (!(await calm(gen))) return;
    await openUnlock(`apuesta${mb}`);
    paintBetSticker();
  }
  // Preventa (9 nov 2026): cuando sale el botón del próximo evento (mes o festividad), su ventana avisa una vez.
  const pf = festivalSoon() || (festival()?.soon ? festival() : null), pe = evSoon();
  for (const [x, open] of [[pf, () => openFestival(pf, festivalSoon() ? 'fiesta-next' : 'fiesta')], [pe, openEventNext]]) {
    if (!x || (save.preSeen ||= {})[x.id]) continue;
    if (!(await calm(gen))) return;
    save.preSeen[x.id] = 1;
    persist();
    open();
  }
  if (await calm(gen)) streakLost();
}

// Algo nuevo en la columna de la derecha: su botón entra volando, sale la ventana que lo explica
// y, al cerrarla, el botón late con un anillo para que se vea dónde quedó.
// Presentación de cada ×N de la apuesta (9 nov 2026): la primera ("¡Nuevo: Apuestas!") con todas las reglas; al subir
// ("¡Subiste a ×N!") lo que gana y lo que paga. La última, en verde: su primer ×N va por nuestra cuenta.
const BET_WORD = { 2: 'el doble', 3: 'el triple' };
function betInfo(first) {
  const m = maxBet(save.next), w = BET_WORD[m] || `×${m}`;
  const gift = ['gift', `¡Tu primer <b>×${m}</b> va por nuestra cuenta!`, 'evi-gift'];
  // Mismo formato que los demás avisos (11 nov 2026): nivel y esencia arriba; premios, reglas y el regalo.
  const lvl = (betStarts().find(([x]) => x === m)?.[1] ?? save.next) + 1;
  return first
    ? {
        title: '¡Nuevo: Apuestas!', color: 'gold', hero: `<span class="bet-big b${m} outl">×${m}</span>`,
        lead: ulLead(lvl, 'la apuesta', `En los niveles nuevos apuestas al tocar Jugar y ganas <b>hasta ${w} de todo</b>.`),
        rules: [
          ['gift', `Todo lo que ganes va <b>×${m}</b>: monedas, boletos, comodines, fichas y el cofre del jefe.`],
          ['ticket', `Al entrar pagas tus boletos <b>×${m}</b> y unas monedas. Si no ganas, <b>no regresa</b>.`],
          ['flag', 'Los niveles que ya ganaste y los eventos se juegan <b>normal</b>.'],
          gift,
        ],
      }
    : {
        title: `¡Subiste a ×${m}!`, color: 'gold', badge: '¡Subiste!', hero: `<span class="bet-big b${m} outl">×${m}</span>`,
        lead: ulLead(lvl, `la apuesta ×${m}`, `Ahora ganas <b>hasta ${w} de todo</b>.`),
        rules: [
          ['gift', `Monedas, boletos, comodines, deshacer, fichas y el cofre del jefe: todo <b>×${m}</b>.`],
          ['ticket', `Al entrar pagas tus boletos <b>×${m}</b> y unas monedas. Si no ganas, <b>no regresa</b>.`],
          gift,
        ],
      };
}
// Avisos de lo que se abre jugando (11 nov 2026, pedido del usuario: homologados). Todos igual: arriba «Llegaste al
// nivel N: se abre X» y en una frase su esencia; luego, en este orden y con el mismo icono, cuándo y cuánto dura
// (reloj), planetas y niveles si tiene (planet), premios (gift), reglas (ticket, flame…) y al final dónde está o cuándo
// llega el próximo (flag). El nivel es el que ves en Tu camino (lo ganado + 1).
const ulLead = (lvl, what, essence) => `Llegaste al <b>nivel ${lvl}</b>: se abre${/^(las|los|\d)/.test(what) ? 'n' : ''} <b>${what}</b>. ${essence}`;
const inDays = (n) => `<b>${n} ${n === 1 ? 'día' : 'días'}</b>`;
const colNow = (c, days) => ['flag', c ? '¡Hay una ahora mismo! Búscala a la <b>derecha</b>.' : `La próxima llega en ${inDays(days)}.`];
const festNow = (f, nx) => ['flag', f ? (f.soon ? `${f.inDays > 1 ? `En ${f.inDays} días` : 'Mañana'} es <b>${f.name}</b>. Su botón ya está a la <b>derecha</b>.` : `¡Hoy es <b>${f.name}</b>! Búscala a la <b>derecha</b>.`) : nx ? `La próxima, <b>${nx.name}</b>, llega en ${inDays(nx.days)}.` : 'Pronto llega la primera.'];
// Reglas de todas las festividades (las de un día y los grupos nuevos).
const FEST_RULES = () => [
  ['reloj', 'El día de la fiesta, <b>24 horas</b> (algunas duran varios días).'],
  ['planet', '<b>3 planetas</b> de 3 niveles: <b>9 niveles</b> difíciles.'],
  ['gift', 'Cada planeta termina con un <b>regalo</b>: entre más estrellas, más fácil que sea un <b>exclusivo</b>.'],
  ['ticket', `Pagas la entrada <b>una vez</b> y reintentas las veces que quieras. <b>3 días antes</b> sale su botón y la entrada cuesta <b>${Math.round(FEST_PRE * 100)}% menos</b>.`],
];
// Cuáles son las nuevas (11 nov 2026, el usuario: «faltó poner cuáles son»): fichas con su icono, nombre y fecha.
const MONTHS3 = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const festDate = (f) => { const d = f.date(new Date().getFullYear()); return `${d.getDate()} ${MONTHS3[d.getMonth()]}`; };
const festList = (fs) => fs.slice().sort((a, b) => a.date(2026) - b.date(2026)).map((f) => [f.ico, f.name, `${festDate(f)}${f.zone ? ` · ${f.zone}` : ''}`]);
const colList = (cs) => cs.map((x) => [x.token, x.name, '']);
const evList = () => Object.keys(EVENTS).map(Number).sort((a, b) => a - b).filter((m) => EVENTS[m].ready).map((m) => [EVENTS[m].ico, EVENTS[m].name, MONTHS_LONG[m]]);
const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const ulList = (list) => (list?.length ? `<ul class="ul-list">${list.map(([ico, name, sub]) => `<li>${icon(ico)}<span><b>${name}</b>${sub ? `<small>${sub}</small>` : ''}</span></li>`).join('')}</ul>` : '');
const RAIN_KEY = { cometas: 'comet', aurora: 'aurora', cristales: 'crystal' };
const UNLOCK_INFO = {
  cometas: () => ({
    title: '¡Nueva: Lluvia de cometas!', ico: 'cometaLluvia', color: 'blue', hero: icon('cometaLluvia', 0, 0, 'big'),
    lead: ulLead(SHOWERS.comet.from + 1, 'la lluvia de cometas', 'De vez en cuando caen cometas sobre tu mapa y traen boletos.'),
    rules: [
      ['reloj', 'Una vez por semana, <b>20 minutos</b>, a cualquier hora y <b>sin aviso</b>.'],
      ['gift', 'Mientras cae, los niveles nuevos <b>no gastan boletos</b>, cada victoria da <b>1 boleto más</b> y tu primer nivel con 3★ trae un <b>premio sorpresa</b>.'],
      ['flag', 'Si la ves caer, ¡no la dejes pasar!'],
    ],
  }),
  aurora: () => ({
    title: '¡Nueva: Aurora!', ico: 'aurora', color: 'green', hero: icon('aurora', 0, 0, 'big'),
    lead: ulLead(SHOWERS.aurora.from + 1, 'la aurora', 'De vez en cuando se pinta el cielo de colores y tu colección avanza más.'),
    rules: [
      ['reloj', 'Una vez por semana, <b>20 minutos</b>, a cualquier hora y <b>sin aviso</b>, cuando hay colección.'],
      ['gift', 'Mientras sale, las <b>fichas de la colección valen el doble</b> y hasta <b>2 premios sorpresa</b>: uno por cada nivel con 3★.'],
      ['flag', 'Si la ves en el cielo, ¡no la dejes pasar!'],
    ],
  }),
  cristales: () => ({
    title: '¡Nueva: Lluvia de cristales!', ico: 'cristal', color: 'blue', hero: icon('cristal', 0, 0, 'big'),
    lead: ulLead(SHOWERS.crystal.from + 1, 'la lluvia de cristales', 'De vez en cuando caen cristales sobre tu mapa y traen ayudas.'),
    rules: [
      ['reloj', 'Una vez cada dos semanas, solo <b>10 minutos</b>, a cualquier hora y <b>sin aviso</b>.'],
      ['gift', 'Mientras cae, los niveles que ganes te pueden dar una <b>ayuda</b> y tu primer nivel con 3★ trae un <b>premio sorpresa</b>.'],
      ['flag', 'Es la más rara: si la ves caer, ¡no la dejes pasar!'],
    ],
  }),
  estrellas: () => ({
    title: '¡Nueva: Lluvia de estrellas!', ico: 'starFall', color: 'violet', hero: icon('starFall', 0, 0, 'big'),
    lead: ulLead(STAR_FROM + 1, 'la lluvia de estrellas', 'Más corta que la de meteoritos y da mucho más.'),
    rules: [
      ['reloj', '2 o 3 veces por semana, solo <b>15 minutos</b>, a cualquier hora y <b>sin aviso</b>.'],
      ['gift', 'Mientras cae, <b>el triple de monedas</b>, más descuento y hasta <b>3 premios sorpresa</b>: uno por cada nivel con 3★.'],
      ['flag', 'Si la ves caer, ¡no la dejes pasar!'],
    ],
  }),
  meteoro: () => ({
    title: '¡Nueva: Lluvia de meteoritos!', ico: 'meteoro', color: 'orange', hero: icon('meteoro', 0, 0, 'big'),
    lead: ulLead(MET_FROM + 1, 'la lluvia de meteoritos', 'De vez en cuando caen meteoritos sobre tu mapa y todo da más.'),
    rules: [
      ['reloj', '2 o 3 veces por semana, <b>30 minutos</b>, a cualquier hora y <b>sin aviso</b>.'],
      ['gift', 'Mientras cae, <b>el doble de monedas</b>, descuento en la tienda y un <b>premio sorpresa</b> en tu primer nivel con 3★.'],
      ['flag', 'Entre más juegues, más fácil que te toque verla.'],
    ],
  }),
  mis: () => ({
    title: '¡Nuevas: Misiones del día!', ico: 'misiones', color: 'green', hero: icon('misiones', 0, 0, 'big'),
    lead: ulLead(UNLOCK.mis + 1, 'las misiones del día', 'Cada día, 3 retos para jugar como siempre.'),
    rules: [
      ['reloj', '<b>3 misiones</b> cada día. A medianoche llegan otras.'],
      ['gift', 'Cada una da <b>monedas</b>, y las 3 juntas, un <b>cofre</b>.'],
      ['check', 'Todo cuenta: cartas, estrellas, rachas, bombas, burbujas… Se cobran <b>solas</b>.'],
      ['flag', 'Las ves a la <b>derecha</b>.'],
    ],
  }),
  logros: () => ({
    title: '¡Nuevos: Logros!', ico: 'trophy', color: 'gold', hero: icon('trophy', 0, 0, 'big'),
    lead: ulLead(UNLOCK.logros + 1, 'los logros', 'Todo lo que haces suma, para siempre.'),
    rules: [
      ['reloj', 'No se acaban: siguen sumando siempre.'],
      ['gift', 'Medallas de <b>bronce, plata, oro, platino y diamante</b>. Las últimas dan <b>comodines</b> y algunos oros, un <b>título</b>.'],
      ['check', 'Se cobran <b>solos</b> al lograrlos.'],
      ['flag', 'Los ves a la <b>derecha</b>.'],
    ],
  }),
  racha: () => {
    const t = streakTheme();
    return {
      title: `¡Nueva: ${t.name}!`, ico: t.ico, color: t.color, hero: icon(t.ico, 0, 0, 'big'),
      lead: ulLead(UNLOCK.racha + 1, 'la racha', 'Gana niveles seguidos, junta estrellas y llévate premios.'),
      rules: [
        ['reloj', 'Una racha <b>cada día</b>: a medianoche empieza otra.'],
        ['gift', `Premios a las <b>${STREAK_GOALS.map((g) => g.n).join(', ')}</b> estrellas y luego cada <b>${STREAK_STEP}</b>: monedas, <b>deshacer</b> y <b>comodines</b>. Se cobran solos.`],
        ['star', 'Cada nivel <b>nuevo</b> que ganes suma sus estrellas (también los secretos). Repetir y los eventos no suman.'],
        ['flame', 'Si pierdes o abandonas un nivel nuevo, o te rindes en uno repetido, vuelve a <b>0</b>.'],
        ['flag', 'La ves a la <b>derecha</b>.'],
      ],
    };
  },
  col: () => {
    const c = col(), days = daysToNextCol();
    return {
      title: '¡Nuevas: Colecciones!', ico: c?.token || 'concha', color: c?.color || 'blue', hero: ['concha', 'gema', 'bellota', 'caramelo'].map((t) => icon(t)).join(''),
      lead: ulLead(UNLOCK.col + 1, 'las colecciones', 'Junta fichas con tus estrellas y cámbialas por premios.'),
      list: colList(COLLECTIONS.filter((x) => !x.plus)),
      rules: [
        ['reloj', '<b>2 semanas al mes</b>, de lunes a domingo. Las fichas que sobren se pierden.'],
        ['gift', 'Su <b>tienda</b> tiene disfraces, reversos, naves y más que <b>solo salen ahí</b>.'],
        ['star', 'Cada <b>estrella nueva</b> que ganas te da <b>1 ficha</b>.'],
        colNow(c, days),
      ],
    };
  },
  col2: () => {
    const c = col(), days = daysToNextCol(), newCols = plusCols(), n = newCols.length;
    return {
      title: n === 1 ? '¡Una colección nueva!' : `¡${n} colecciones nuevas!`, ico: newCols[0].token, color: newCols[0].color, hero: newCols.map((x) => icon(x.token)).join(''),
      lead: ulLead(UNLOCK.col2 + 1, n === 1 ? 'una colección nueva' : `${n} colecciones nuevas`, 'Con sus propios exclusivos.'),
      list: colList(newCols),
      rules: [
        ['reloj', 'Ahora hay colección <b>3 semanas al mes</b>, de lunes a domingo.'],
        ['gift', 'Cada una con su <b>tienda</b> de premios que <b>solo salen ahí</b>.'],
        ['star', 'Se turnan con las de antes. Igual que siempre: <b>1 ficha</b> por cada estrella nueva.'],
        colNow(c, days),
      ],
    };
  },
  col3: () => {
    const c = col(), days = daysToNextCol(), newCols = plusCols(2), n = newCols.length;
    return {
      title: `¡${n} colecciones nuevas!`, ico: newCols[0].token, color: newCols[0].color, hero: newCols.map((x) => icon(x.token)).join(''),
      lead: ulLead(UNLOCK.col3 + 1, `${n} colecciones nuevas`, 'Con sus propios exclusivos.'),
      list: colList(newCols),
      rules: [
        ['reloj', 'Ahora hay colección <b>todas las semanas</b>, de lunes a domingo.'],
        ['gift', 'Cada una con su <b>tienda</b> de premios que <b>solo salen ahí</b>.'],
        ['star', 'Se turnan las <b>9 temáticas</b>, una tras otra. <b>1 ficha</b> por cada estrella nueva.'],
        colNow(c, days),
      ],
    };
  },
  fiesta: () => {
    const f = festival(), nx = nextFestival();
    return {
      title: '¡Nuevo: Festividades!', ico: f?.ico || nx?.ico || 'tamal', color: 'gold', hero: evHeroIcons(f?.ico || nx?.ico, FESTIVALS),
      lead: ulLead(UNLOCK.fiesta + 1, 'las festividades', 'Los días de fiesta llega un evento especial con premios exclusivos.'),
      list: festList(FESTIVALS.filter((x) => x.ready && !x.local && !x.grp)),
      rules: [...FEST_RULES(), festNow(f, nx)],
    };
  },
  fiesta2: () => festGroupIntro((f) => f.local, 'fiesta2', '¡Nuevas: Leyendas de México!'),
  fiesta3: () => festGroupIntro((f) => f.grp === 3, 'fiesta3', '¡Nuevas: Fiestas de México!'),
  fiesta4: () => festGroupIntro((f) => f.grp === 4, 'fiesta4', '¡Nuevas: Fiestas de América!'),
  mes: () => {
    const e = ev(), nx = !e && nextEvent();
    return {
      // Arriba, los iconos de todos los eventos del año; el de este mes (o el próximo) va al centro y más grande.
      title: '¡Nuevo: Evento del mes!', ico: e?.ico || nx?.ico || 'calavera', color: e?.color || 'orange', hero: evHeroIcons(e?.ico || nx?.ico),
      lead: ulLead(UNLOCK.mes + 1, 'los eventos del mes', 'Algunos meses llega un evento de temporada con premios que solo salen ese mes.'),
      list: evList(),
      rules: [
        ['reloj', 'Dura <b>todo el mes</b>. Si lo empiezas tarde, juega lo que alcances.'],
        ['planet', '<b>5 planetas</b> de 5 niveles: <b>25 niveles</b> difíciles.'],
        ['gift', 'El último nivel de cada planeta abre un <b>regalo sorpresa</b>: entre más estrellas, más fácil que sea un <b>exclusivo</b>.'],
        ['ticket', 'Cada nivel se juega con tu <b>boleto</b>: si pierdes, llega otro en <b>48 horas</b> o lo compras.'],
        ['flag', e ? `¡Este mes hay uno: <b>${e.name}</b>! Búscalo a la <b>derecha</b>.` : nx ? `El próximo, <b>${nx.name}</b>, llega en ${inDays(nx.days)}.` : 'Pronto llega el primero.'],
      ],
    };
  },
};
// Aviso de un grupo de festividades nuevas (leyendas, fiestas de México y de América): hasta 5 iconos arriba, cuáles
// son y las mismas reglas que las festividades.
function festGroupIntro(of, k, title) {
  const newCols = FESTIVALS.filter((f) => of(f) && f.ready), f = festival(), nx = nextFestival();
  if (!newCols.length) return null;
  const shown = newCols.slice(0, 5), mid = shown[Math.floor(shown.length / 2)];
  return {
    title, ico: mid.ico, color: mid.color, hero: shown.map((x) => icon(x.ico, 0, 0, x === mid ? 'main' : '')).join(''),
    lead: ulLead(UNLOCK[k] + 1, `${newCols.length} festividades nuevas`, 'Con sus propios exclusivos.'),
    list: festList(newCols),
    rules: [...FEST_RULES(), festNow(f, nx)],
  };
}
// Solo 3: el evento anterior, el de ahora (o el próximo) al centro y más grande, y el siguiente (en orden del año).
// list: los eventos del mes (por omisión) o las festividades.
function evHeroIcons(main, list = Object.keys(EVENTS).map(Number).sort((a, b) => a - b).map((m) => EVENTS[m])) {
  const all = list.filter((x) => x.ready).map((x) => x.ico);
  const i = Math.max(0, all.indexOf(main)), at = (k) => all[(i + k + all.length) % all.length];
  return [at(-1), at(0), at(1)].map((x, k) => icon(x, 0, 0, k === 1 ? 'main' : '')).join('');
}
async function openUnlock(k) {
  const sel = k === 'meteoro' || k === 'estrellas' || RAIN_KEY[k] || k.startsWith('apuesta') ? null : `.side.r [data-a="${{ racha: 'racha', mis: 'mis', logros: 'logros', col: 'col', mes: 'evento', col2: 'col', col3: 'col', fiesta: 'fiesta', fiesta2: 'fiesta', fiesta3: 'fiesta', fiesta4: 'fiesta' }[k]}"]`;
  if (sel) openGroup('r', 'open');
  const btn = sel && document.querySelector(sel);
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
  const info = k.startsWith('apuesta') ? betInfo(k === 'apuesta') : UNLOCK_INFO[k]();
  // (Un grupo de festividades sin ninguna lista todavía no tiene aviso: sale cuando lleguen.)
  if (!info) return;
  await new Promise((done) => {
    const m = openModal({
      title: info.title,
      color: info.color,
      wide: true,
      cls: `ev-intro unlock-${k}`,
      body: `<div class="evi-hero"><div class="rays"></div><span class="evi-ico ul-hero">${info.hero}<span class="ul-new outl">${info.badge || '¡Nuevo!'}</span></span></div>
        <p class="lead">${info.lead}</p>${ulList(info.list)}
        <ul class="evi-rules">${info.rules.map(([ico, html, cls]) => `<li${cls ? ` class="${cls}"` : ''}>${icon(ico)}<span>${html}</span></li>`).join('')}</ul>`,
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
  const now = sel && document.querySelector(sel);
  if (now) {
    now.classList.add('spot');
    setTimeout(() => now.classList.remove('spot'), 4200);
  }
}

// Bienvenida de cada colección: cuál es, cómo se juntan sus fichas y qué exclusivos trae (estos sí se ven).
function openColIntro(c) {
  return new Promise((done) => {
    const m = openModal({
      title: c.name,
      ico: c.token,
      color: c.color,
      wide: true,
      cls: 'ev-intro col-intro',
      body: `<div class="evi-hero"><div class="rays"></div><span class="evi-ico">${icon(c.token, 0, 0, 'big')}</span></div>
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
    m.el.querySelectorAll('.evi-rules li').forEach((el, i) => el.animate([{ opacity: 0, translate: '-14px 0' }, { opacity: 1, translate: '0 0' }], { duration: 320, delay: 650 + i * 120, easing: 'ease-out', fill: 'backwards' }));
  });
}

// Si se perdió una racha, al llegar al mapa el botón tiembla y lo dice.
// También si pasó la medianoche con premios sin reclamar: esos se perdieron.
function streakLost() {
  const r = dailyStreak();
  if (!r.lost && !r.expired) return;
  const msg = r.lost ? 'Tu racha volvió a 0' : 'No reclamaste los premios de tu racha: se perdieron';
  delete r.lost;
  delete r.expired;
  persist();
  wait(700).then(() => {
    const b = document.querySelector('[data-a="racha"]');
    b?.animate([{ rotate: '0deg' }, { rotate: '-12deg' }, { rotate: '10deg' }, { rotate: '-6deg' }, { rotate: '0deg' }], { duration: 500 });
    toast(`${icon(streakTheme().ico)} ${msg}`);
  });
}

// Regalo diario (13 nov 2026, rehecho a pedido del usuario: el de antes se veía viejo). Un camino de 7 planetitas por
// semana; se reclama tocando el planetita de hoy (sin botón ni personaje: el usuario los quitó). Debajo de cada uno, lo
// que trae (para motivar); lo que ganas sale en burbujas y al cerrar las monedas y boletos vuelan al monedero. El día 7
// es un agujero de gusano que gira y escupe los premios de la caja sorpresa y una pieza de planeta (arriba, el planeta
// de tu mundo en 4 piezas). Con las 4 (28 días seguidos) el planeta se arma y da un escudo: si un día no entras, te
// salva (dailyState). El escudo arriba es solo un botón con su número; tocarlo recuerda para qué sirve.
const DAY_PLANETS = [['#ff9c5b', '#e2753a', '#ffd27a'], ['#5ab0ff', '#2f86c8', '#9fe6ff'], ['#86cf5c', '#4d9f45', '#2f86c8'], ['#ff7aa2', '#d64f7c', '#ffd0e0'], ['#ffd54a', '#e8a91a', '#ff9c5b', '#fff'], ['#a37bff', '#7c55e0', '#e0d0ff']];
const PIECE_CLIP = ['inset(0 50% 50% 0)', 'inset(0 0 50% 50%)', 'inset(50% 50% 0 0)', 'inset(50% 0 0 50%)'];
// Presentación del regalo diario (13 nov 2026, pedido del usuario: decirle antes cómo funciona). Sale una vez, la
// primera vez que lo abre (también en el recorrido de botones), con el mismo formato que las ventanas de cartas.
function openDailyIntro(then) {
  const step = (pic, name, text) => `<div class="tip-card"><span class="tip-pic tip-ico">${pic}</span><p><b>${name}</b>${text}</p></div>`;
  openModal({
    title: '¡Nuevo regalo diario!',
    color: 'green',
    cls: 'daily-intro',
    body: `<div class="dly-intro">${step(miniPlanet(DAY_PLANETS[1]), 'Un planeta por día', 'Entra cada día y <b>toca el planeta de hoy</b> para reclamar tu regalo.')}
      ${step('<span class="worm mini"><i></i><i></i><i></i><b></b></span>', 'Día 7: agujero de gusano', 'Gira y te escupe premios sorpresa y una <b>pieza de planeta</b>.')}
      ${step(icon('escudito'), 'Escudo', 'Junta las <b>4 piezas</b> (4 semanas seguidas) y ganas un escudo: si un día no entras, te salva y no vuelves al día 1.')}</div>`,
    buttons: [{ label: '¡Entendido!', cls: 'green wide', onClick: () => { save.intro.regalo = true; persist(); then(); } }],
  });
}
const SHIELD_TXT = 'Escudo: si un día no entras, te salva y no vuelves al día 1. Ganas uno al armar tu planeta.';
function openDaily() {
  if (!save.intro?.regalo) return openDailyIntro(openDaily);
  const st = dailyState(save.daily);
  const N = DAILY_PATH.length;
  const idx = st.claimed ? (st.day - 1 + N) % N : st.day;
  const week = Math.floor(idx / 7) * 7;
  const stateOf = (i) => (i < idx || (st.claimed && i === idx) ? 'got' : i === idx ? 'today' : 'next');
  const info = worldInfo(Math.min(WORLD_COUNT - 1, Math.floor((save.next || 0) / LEVELS_PER_WORLD))), emblem = BIOMES[biomeKey(info.place)].emblem;
  // Piezas que ya tienes: semanas completas de este ciclo (al reclamar el día 28 el ciclo vuelve a empezar).
  const pieces = st.claimed && idx === N - 1 ? 4 : dailyPieces(st.claimed ? idx + 1 : idx);
  let shield = save.daily.shield || 0;
  const tap = '<em class="tap-me">¡Reclama!</em>';
  // 13 nov 2026 (pedido del usuario): sin «Día n»; el número va donde sale la paloma y al reclamar la paloma lo cambia.
  const mark = (k, n) => (k === 'got' ? `<i class="ok">${icon('check')}</i>` : `<b class="ok dnum outl">${n}</b>`);
  let nodes = '';
  for (let i = week; i < week + 6; i++) {
    const p = DAILY_PATH[i], k = stateOf(i);
    const main = p.coins ? `${coin()}<b>${p.coins}</b>` : p.tickets ? `${icon('ticket')}<b>${p.tickets}</b>` : '';
    nodes += `<div class="dnode ${k}" data-i="${i}"><span class="dpl">${miniPlanet(DAY_PLANETS[i - week])}${mark(k, i - week + 1)}${k === 'today' ? tap : ''}</span><span class="dp">${main}</span></div>`;
  }
  const big = week + 6, bk = stateOf(big);
  nodes += `<div class="dnode d7 ${bk}" data-i="${big}"><span class="dpl worm"><i></i><i></i><i></i><b></b>${mark(bk, 7)}${bk === 'today' ? tap : ''}</span><span class="dp q">${icon('gift')}<b>?</b></span></div>`;
  const quarters = PIECE_CLIP.map((c, i) => `<span class="pq${i < pieces ? ' on' : ''}" style="clip-path:${c}">${miniPlanet(emblem)}</span>`).join('');
  const note = st.saved ? `<p class="note dly-saved">${icon('escudito')} ¡Tu escudo te salvó! Sigues en el día ${idx + 1}.</p>` : st.reset ? '<p class="note">Se rompió tu racha: vuelves al día 1.</p>' : '';
  // Lo ganado: se suma al reclamar; al cerrar, monedas y boletos vuelan al monedero.
  let won = null, wonAt = null;
  const m = openModal({
    title: 'Regalo diario',
    color: 'green',
    wide: true,
    cls: 'daily-modal',
    body: `${note}<div class="dly">
      <div class="dly-top"><div class="dly-box"><div class="dly-planet">${quarters}</div><p><b>Tu planeta · <span class="pc">${pieces}</span>/4</b><small>Una pieza por semana completa</small></p></div>
        <button class="dly-shield${shield ? '' : ' none'}" aria-label="Escudos: ${shield}">${icon('escudito')}<b>${shield}</b></button></div>
      <div class="dpath"><svg class="dline" aria-hidden="true"><path/><path/></svg>${nodes}</div>
    </div>`,
    onClose: () => {
      if (!won) return;
      if (won.coins) flyToWallet('coins', wonAt, won.coins);
      if (won.tickets) wait(200).then(() => flyToWallet('tickets', wonAt, won.tickets));
    },
  });
  m.el.querySelector('.dly-shield').addEventListener('click', (e) => {
    toast(`${icon('escudito')} ${SHIELD_TXT}`);
    e.currentTarget.animate([{ scale: 1 }, { scale: 1.2 }, { scale: 1 }], { duration: 300, easing: 'ease-out' });
  });
  let busy = false;
  const claim = async () => {
    if (busy) return;
    busy = true;
    const cell = m.el.querySelector('.dnode.today');
    cell.querySelector('.tap-me')?.remove();
    cell.removeAttribute('role');
    let p = DAILY_PATH[st.day];
    const last = st.day === N - 1;
    const pl = cell.querySelector('.dpl'), r = pl.getBoundingClientRect();
    if (p.surprise) {
      // El agujero de gusano gira cada vez más rápido, se traga la luz y escupe los premios en burbujas.
      p = openSurprise(p.surprise);
      cell.classList.add('gulp');
      if (!reduced()) await wait(1300);
      sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 20);
    } else if (!reduced()) {
      await cell.animate([{ scale: 1 }, { scale: 1.25 }, { scale: 1 }], { duration: 380, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' }).finished;
    }
    // Se suma ya (si cierra la app, ya lo tiene) y sale en burbujas.
    save.coins += p.coins || 0;
    save.tickets += p.tickets || 0;
    save.undo += p.undo || 0;
    save.wild += p.wild || 0;
    won = p;
    wonAt = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    save.daily = { day: (st.day + 1) % N, last: new Date().toDateString(), shield: Math.min(DAILY_SHIELD_MAX, (save.daily.shield || 0) - (st.saved || 0) + (last ? 1 : 0)) };
    // Logros Constante (regalos reclamados) y Constructor de planetas (planetas armados).
    track({ dailies: 1, ...(last && { planets: 1 }) });
    cell.classList.replace('today', 'got');
    // El número se va y llega la paloma con un brinco.
    pl.querySelector('.dnum')?.remove();
    pl.insertAdjacentHTML('beforeend', `<i class="ok">${icon('check')}</i>`);
    if (!reduced()) pl.querySelector('.ok').animate([{ scale: 0, rotate: '-30deg' }, { scale: 1.4, rotate: '8deg', offset: 0.6 }, { scale: 1, rotate: '0deg' }], { duration: 420, easing: 'ease-out' });
    document.querySelector('[data-a="daily"] .dot')?.remove();
    document.querySelector('[data-a="daily"]')?.classList.remove('ready');
    lootBubbles(m, prizeIcons(p), pl);
    // Como el de los boletos: al terminar, la ventana se cierra sola y lo ganado vuela al monedero (onClose).
    const done = async () => { await wait(reduced() ? 300 : 1700); m.close(); };
    if (p === DAILY_PATH[st.day]) return done();
    await wait(reduced() ? 0 : 900);
    // La pieza del planeta sale del agujero y vuela a su lugar.
    const slot = m.el.querySelectorAll('.dly-planet .pq')[pieces];
    if (slot) {
      const to = slot.getBoundingClientRect();
      if (!reduced()) {
        const f = slot.cloneNode(true);
        f.classList.add('on', 'pq-fly');
        Object.assign(f.style, { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` });
        document.body.append(f);
        await f.animate([{ translate: `${r.left + r.width / 2 - to.left - to.width / 2}px ${r.top + r.height / 2 - to.top - to.height / 2}px`, scale: 0.3, rotate: '-180deg' }, { translate: '0 -30px', scale: 1.4, rotate: '0deg', offset: 0.6 }, { translate: '0 0', scale: 1, rotate: '0deg' }], { duration: 800, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)' }).finished;
        f.remove();
      }
      slot.classList.add('on');
      m.el.querySelector('.dly-top .pc').textContent = pieces + 1;
      sparkle({ x: to.left + to.width / 2, y: to.top + to.height / 2 }, 10);
    }
    // Con la 4.ª el planeta se arma, brilla y suelta un escudo.
    if (last) {
      m.el.querySelector('.dly-planet').classList.add('whole');
      confetti(40);
      await wait(reduced() ? 0 : 900);
      shield = Math.min(DAILY_SHIELD_MAX, shield + 1);
      const sh = m.el.querySelector('.dly-shield');
      sh.classList.remove('none');
      sh.querySelector('b').textContent = shield;
      if (!reduced()) sh.animate([{ scale: 0.2, rotate: '-30deg' }, { scale: 1.4, rotate: '8deg', offset: 0.6 }, { scale: 1, rotate: '0deg' }], { duration: 600, easing: 'ease-out' });
      toast(`${icon('escudito')} ¡Planeta armado! Ganaste un escudo`);
    }
    done();
  };
  const path = m.el.querySelector('.dpath');
  // En vertical (pantalla angosta) el camino va de arriba hacia abajo (--vert lo pone el CSS).
  const vert = () => getComputedStyle(path).getPropertyValue('--vert').trim() === '1';
  const line = () => {
    if (!path.isConnected) return;
    const a = path.getBoundingClientRect();
    const pts = [...path.querySelectorAll('.dpl')].map((d) => { const b = d.getBoundingClientRect(); return [b.left - a.left + b.width / 2, b.top - a.top + b.height / 2]; });
    const v = vert(), w = (i) => (i % 2 ? 18 : -18);
    const d = pts.map(([x, y], i) => (i ? `Q${(pts[i - 1][0] + x) / 2 + (v ? w(i) : 0)} ${(y + pts[i - 1][1]) / 2 + (v ? 0 : w(i))} ${x} ${y}` : `M${x} ${y}`)).join(' ');
    const svgEl = path.querySelector('.dline');
    svgEl.setAttribute('viewBox', `0 0 ${a.width} ${a.height}`);
    svgEl.querySelectorAll('path').forEach((q) => q.setAttribute('d', d));
  };
  requestAnimationFrame(line);
  new ResizeObserver(line).observe(path);
  // Se reclama tocando el planetita de hoy (13 nov 2026: ya no hay botón).
  const today = m.el.querySelector('.dnode.today');
  if (today && !st.claimed) {
    today.setAttribute('role', 'button');
    today.setAttribute('aria-label', 'Reclamar el regalo de hoy');
    today.addEventListener('click', claim);
  }
  helpTip(m, 'Toca el planeta de hoy para reclamar tu regalo. El día 7 el agujero de gusano te da premios sorpresa y una pieza de tu planeta. Con 4 piezas ganas un escudo: si un día no entras, te salva.');
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
// Las de festividades (x.e.date) son iguales, con su último planeta (el 3.º) y "Festividad" en el sello.
const evPcPlanet = (x) => EVENT_BIOMES[x.e.key].at(-1);
const pcKind = (x) => (x.e.date ? { won: '¡Festividad ganada!', stamp: 'Fiesta', W: EVK.fiesta.W + x.e.planets.length - 1 } : { won: '¡Evento ganado!', stamp: 'Evento', W: EV_W + EVENT_PLANETS - 1 });
function evPostcardHTML(x, cls = '', frame = equipped('frame')) {
  return `<div class="postcard tier-oro ev-pc fr-${frame} ${cls}" style="--h:${EV_HUE[x.e.color] ?? 45}">
    <div class="pc-art">${miniPlanet(evPcPlanet(x).emblem, 'pc-planet')}</div>
    <div class="pc-txt"><small>Postal de</small><b>${esc(x.e.name)}</b><span>${icon(x.e.ico)}${pcKind(x).won}</span></div>
    <div class="stamp"><b>${x.year}</b><small>${pcKind(x).stamp}</small></div>
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
        <div class="chest-row"><div class="chest"><span class="lid">${chestLid()}</span><span class="body">${chestBody()}</span>${ch.bet > 1 ? `<i class="go-bet chest-bet b${ch.bet}">×${ch.bet}</i>` : ''}</div></div>`,
      buttons: [{ label: 'Continuar', cls: 'green wide', onClick: done }],
    });
    balloons(m);
    // Los premios son burbujas: salen del cofre y suben despacio (más lento que los globos) por encima de la ventana.
    const loot = () => lootBubbles(m, prizeIcons(ch), m.el.querySelector('.chest'));
    if (reduced()) {
      m.el.querySelector('.chest-row').classList.add('open', 'done');
      return loot();
    }
    const pc = m.el.querySelector('.postcard'), stamp = m.el.querySelector('.stamp'), chest = m.el.querySelector('.chest');
    pc.animate([{ rotate: '-8deg', scale: 0.7, opacity: 0 }, { rotate: '3deg', scale: 1.04, opacity: 1, offset: 0.7 }, { rotate: '-1.5deg', scale: 1 }], { duration: 620, delay: 150, easing: 'ease-out', fill: 'backwards' });
    stamp.animate([{ scale: 2.6, rotate: '-30deg', opacity: 0 }, { scale: 0.92, rotate: '12deg', opacity: 1, offset: 0.7 }, { scale: 1, rotate: '8deg' }], { duration: 420, delay: 750, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'backwards' });
    setTimeout(async () => {
      await chest.animate([{ rotate: '0deg' }, { rotate: '-8deg' }, { rotate: '7deg' }, { rotate: '-5deg' }, { rotate: '0deg' }], { duration: 520, iterations: 2 }).finished;
      const row = m.el.querySelector('.chest-row');
      row.classList.add('open');
      const r = m.el.querySelector('.chest').getBoundingClientRect();
      sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 3 }, 20);
      await loot();
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
    pauseOffscreen(body, '.postcard');
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
  // Pestañas Mundos / Eventos / Especiales: Eventos sale cuando ya ganó al menos un evento del mes completo, y
  // Especiales, una festividad completa.
  const evs = evAlbum(), fis = festAlbum();
  const tab = (k, ico, label, t) => `<button role="tab" data-tab="${k}" aria-selected="${t === k}">${icon(ico)}${label}</button>`;
  const tabs = (t) => (evs.length || fis.length ? `<div class="tabs" role="tablist">${tab('mundos', 'album', 'Mundos', t)}${evs.length ? tab('eventos', 'trophy', 'Eventos', t) : ''}${fis.length ? tab('especiales', 'gift', 'Especiales', t) : ''}</div>` : '');
  // Eventos y Especiales van por año (una página por año, el más reciente primero): con los años serán muchas.
  // Si hay más de un año, arriba sale ◀ 2027 ▶ para cambiar de página.
  const yearsOf = (list) => [...new Set(list.map((x) => x.year))].sort((a, b) => b - a);
  const page = { eventos: 0, especiales: 0 };
  const pager = (k, years) => (years.length > 1 ? `<div class="pager"><button data-pg="${k}" data-d="-1" aria-label="Año más nuevo" ${page[k] ? '' : 'disabled'}>${icon('prev')}</button>
      <span><b>${years[page[k]]}</b><small>${page[k] + 1} de ${years.length}</small></span>
      <button data-pg="${k}" data-d="1" aria-label="Año anterior" ${page[k] < years.length - 1 ? '' : 'disabled'}>${icon('next')}</button></div>` : '');
  const yearPage = (k, list, attr, note) => {
    const years = yearsOf(list), y = years[Math.min(page[k], years.length - 1)];
    setHead('Álbum de postales', false);
    show(`${tabs(k)}<p class="note">${note}</p>${pager(k, years)}
      <div class="album">${list.map((x, i) => (x.year === y ? `<button class="pc-btn" ${attr}="${i}">${evPostcardHTML(x, 'mini')}</button>` : '')).join('')}</div>`);
  };
  const events = () => yearPage('eventos', evs, 'data-ev', 'Una postal por cada evento que ganaste completo. El sello dice el año.');
  const specials = () => yearPage('especiales', fis, 'data-fi', 'Una postal por cada festividad que ganaste completa. El sello dice el año.');
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
    const t = e.target.closest('[data-r], [data-w], [data-ev], [data-fi], [data-tab], [data-pg]');
    if (!t) return;
    if (t.dataset.pg) { page[t.dataset.pg] += +t.dataset.d; return (t.dataset.pg === 'eventos' ? events : specials)(); }
    if (t.dataset.tab) return t.getAttribute('aria-selected') === 'true' ? null : ({ eventos: events, especiales: specials }[t.dataset.tab] || regions)();
    if (t.dataset.r != null) return region(+t.dataset.r);
    if (t.dataset.ev != null) return openEvPostcard(evs[+t.dataset.ev]);
    if (t.dataset.fi != null) return openEvPostcard(fis[+t.dataset.fi]);
    openPostcard(+t.dataset.w);
  });
  if (!total && !evs.length && !fis.length) show(empty());
  else if (!total) (evs.length ? events : specials)();
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
  const B = evPcPlanet(x), K = pcKind(x);
  return showPostcard({
    name: x.e.name, hue: EV_HUE[x.e.color] ?? 45, tier: 'oro', wd: { w: K.W, theme: B.planet },
    sub: `${x.e.date ? 'Festividad' : 'Evento del mes'} · ${x.year}`,
    line: `<span class="pv-stars">${icon(x.e.ico)}<em>${K.won}</em></span>`,
    stamp: [x.year, K.stamp], seal: '',
    photo: { kicker: `POSTAL DE · ${K.stamp.toUpperCase()} ${x.year}`, sub: x.e.planets.at(-1), stars: null, secret: false, file: `postal-${x.e.key}-${x.year}` },
  });
}
// Sellos del pasaporte y de secretos que ya ganaste (12 nov 2026): van en todas las postales en grande, encima del
// planeta. Se pueden ocultar (save.pcPass === false) y la foto sale igual que como los dejaste.
const passSeals = () => [
  ...Array.from({ length: save.pass?.s || 0 }, (_, i) => { const F = passFrameOf(i + 1); return { ico: F[4], pc: F[3], n: i + 1 }; }),
  ...Array.from({ length: save.pass?.x || 0 }, (_, i) => ({ ico: 'starSecret', pc: '#8a5cf0', n: secretGoal(i + 1) })),
];
// 12 nov 2026 (el usuario: «más aleatorios, que se vean como sellos»): cada sello cae en su lugar, con su giro, su
// tamaño y su forma (círculo, óvalo o rectángulo), como estampados a mano en la parte de arriba del planeta. Salen de
// una semilla con el nombre del planeta: la vista y la foto quedan iguales y cada postal tiene su acomodo.
// [{ x, y (0-1 de la ventana del planeta), r (grados), s (escala), f: 'c' | 'o' | 'r' }]
const sealSpots = (n, key) => {
  const rnd = mulberry32(hash([...String(key)].reduce((a, ch) => Math.imul(a ^ ch.charCodeAt(0), 16777619), 2166136261))), out = [];
  for (let i = 0; i < n; i++) {
    // De varios lugares al azar, el más alejado de los que ya están (se reparten sin amontonarse).
    let best = null, bd = -1;
    for (let k = 0; k < 24; k++) {
      const p = { x: 0.1 + rnd() * 0.8, y: 0.11 + rnd() * 0.24 };
      const d = Math.min(9, ...out.map((q) => Math.hypot(q.x - p.x, q.y - p.y)));
      if (d > bd) (bd = d), (best = p);
    }
    out.push({ ...best, r: Math.round(rnd() * 50 - 25), s: +(0.88 + rnd() * 0.3).toFixed(2), f: 'cor'[Math.floor(rnd() * 3)] });
  }
  return out;
};
// Cada sello se estampa (cae grande y girado) y queda en su giro y su tamaño.
const stampSeals = (el, delay, step) => el.querySelectorAll('.pv-seal').forEach((s, i) => {
  const r = parseFloat(s.style.getPropertyValue('--r')), k = +s.style.getPropertyValue('--s');
  s.animate([{ scale: 2.8 * k, rotate: `${r + 30}deg`, opacity: 0 }, { scale: 0.9 * k, rotate: `${r - 6}deg`, opacity: 1, offset: 0.7 }, { scale: k, rotate: `${r}deg` }], { duration: 380, delay: delay + i * step, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'backwards' });
});
const passSealsHTML = (key) => {
  const L = passSeals(), at = sealSpots(L.length, key);
  return `<div class="pv-pass">${L.map((x, i) => `<span class="pv-seal f-${at[i].f}" style="--pc:${x.pc};--r:${at[i].r}deg;--s:${at[i].s};left:${at[i].x * 100}%;top:${at[i].y * 100}%">${icon(x.ico)}<i class="outl">${x.n}</i></span>`).join('')}</div>`;
};
// pc: { name, hue, tier, wd (para PlanetView), sub, line (estrellas o lo que va debajo), stamp: [grande, chico], seal, photo }
async function showPostcard(pc) {
  const frame = equipped('frame'), seals = passSeals().length;
  let view = null;
  const m = openModal({
    title: esc(pc.name),
    color: 'gold',
    wide: true,
    cls: 'pc-modal',
    onClose: () => view?.dispose(),
    body: `<div class="pc-view tier-${pc.tier} ${frame === 'simple' ? '' : 'framed'}${save.pcPass === false ? ' no-pass' : ''}" style="--h:${pc.hue}">
        <div class="postcard pv-deco tier-${pc.tier} fr-${frame}" aria-hidden="true"></div>
        <div class="pv-3d">${seals ? passSealsHTML(pc.name) : ''}</div>
        <div class="pv-info">
          <small>${esc(pc.sub)}</small>
          <b>${esc(pc.name)}</b>
          ${pc.line}
          <div class="stamp"><b>${pc.stamp[0]}</b><small>${esc(pc.stamp[1])}</small></div>${pc.seal}
        </div>
      </div>`,
    buttons: [
      seals && { label: passBtn(), cls: 'ghost wide pv-pass-btn', keep: true, onClick: (btn) => {
        save.pcPass = save.pcPass === false;
        persist();
        m.el.querySelector('.pc-view').classList.toggle('no-pass', save.pcPass === false);
        btn.innerHTML = passBtn();
        if (save.pcPass !== false && !reduced()) stampSeals(m.el, 0, 70);
      } },
      { label: `${icon('album')} Guardar foto`, cls: 'gold wide', keep: true, onClick: (btn) => view && savePostcard(view, pc, btn) },
    ].filter(Boolean),
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
    stampSeals(m.el, 1150, 90);
  }
}
const passBtn = () => `${icon('pasaporte')} ${save.pcPass === false ? 'Poner mis sellos' : 'Quitar mis sellos'}`;

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
  // Sellos del pasaporte y de secretos (si no los quitaste): en la orilla de arriba del planeta, de derecha a izquierda.
  if (save.pcPass !== false) {
    const list = passSeals(), at = sealSpots(list.length, pc.name);
    const img = (ico) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = iconURL(ico, 1).slice(5, -2); });
    const pics = await Promise.all(list.map((x) => img(x.ico)));
    list.forEach((x, i) => {
      const a = at[i], hw = a.f === 'o' ? 62 : a.f === 'r' ? 55 : 50, hh = a.f === 'c' ? 50 : 45;
      // La forma del sello, p más grande (la orilla punteada va por fuera).
      const shape = (p) => { g.beginPath(); if (a.f === 'r') g.roundRect(-hw - p, -hh - p, 2 * (hw + p), 2 * (hh + p), 12 + p / 2); else g.ellipse(0, 0, hw + p, hh + p, 0, 0, Math.PI * 2); };
      g.save(); g.translate(sx + a.x * sw, sy + a.y * sh); g.rotate((a.r * Math.PI) / 180); g.scale(a.s, a.s);
      shape(0); g.fillStyle = '#fffaf0'; g.fill(); g.lineWidth = 7; g.strokeStyle = x.pc; g.stroke();
      shape(8); g.lineWidth = 4; g.setLineDash([10, 7]); g.stroke(); g.setLineDash([]);
      if (pics[i]) g.drawImage(pics[i], -32, -34, 64, 64);
      g.fillStyle = x.pc; g.strokeStyle = '#2a1f5c'; g.lineWidth = 6; g.textAlign = 'center'; g.font = '34px "Lilita One"';
      g.strokeText(String(x.n), hw - 20, hh - 2); g.fillText(String(x.n), hw - 20, hh - 2);
      g.restore();
    });
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
// Constelación cerrada (tocada en el universo): lo que pide su primer mundo. Si todavía no llegas a ella, además
// pide terminar la anterior y no se puede abrir.
function openConstGate(r) {
  const w0 = r * REGION_SIZE;
  openWorldGate(w0, null, pendingWorld() === w0 ? null : r - 1);
}
// prior: constelación que falta terminar antes (entonces nada cuenta todavía y Abrir queda apagado).
function openWorldGate(w, onCancel, prior = null) {
  const need = starsNeeded(w);
  const have = starsBefore(w);
  const okStars = have >= need;
  // Primer mundo de una constelación: pide el boleto de constelación (no el dorado) y monedas (openCost).
  // Las primeras constelaciones (openFree): el precio tachado y «Gratis».
  const cost = openCost(w), okCoins = save.coins >= cost, free = openFree(w);
  const isConst = constStart(w), tk = isConst ? 'cgold' : 'gold', okGold = prior == null && save[tk] > 0;
  const info = worldInfo(w), was = `<s class="was">${money(CONST_OPEN)}</s>`;
  openModal({
    title: isConst ? regionName(regionOf(w)) : `Mundo ${w + 1}`,
    color: 'gold',
    onClose: onCancel,
    body: `<div class="gate">${miniPlanet(BIOMES[biomeKey(info.place)].emblem, 'gate-pl')}<b>${isConst ? `Constelación ${regionOf(w) + 1} · ` : ''}${esc(info.name)}</b>
      <div class="rows">
        ${prior != null ? `<div class="row">${icon('lock')}<b>Constelación anterior<span>Termina ${esc(regionName(prior))} y vence a su último jefe</span></b><em>${icon('lock')}</em></div>` : ''}
        <div class="row ${okGold ? 'ok' : ''}">${isConst ? `${icon('constTicket')}<b>Boleto de constelación<span>Lo da el último jefe de la constelación</span></b>` : `${icon('gold')}<b>Boleto dorado<span>Lo da el jefe del mundo anterior</span></b>`}${okGold ? icon('check') : '<em>0/1</em>'}</div>
        <div class="row ${okStars ? 'ok' : ''}">${star(true)}<b>Estrellas<span>${okStars ? '¡Listo!' : `Te faltan ${need - have}: repite niveles (es gratis)`}</span></b>${okStars ? icon('check') : `<em>${have}/${need}</em>`}</div>
        ${cost ? `<div class="row ${okCoins ? 'ok' : ''}">${coin()}<b>Monedas<span>${okCoins ? 'Nueva constelación' : `Te faltan ${money(cost - save.coins)}`}</span></b>${okCoins ? `<em>${money(cost)}</em>` : `<em>${money(save.coins)}/${money(cost)}</em>`}</div>`  : ''}
        ${free ? `<div class="row ok">${coin()}<b>Monedas<span>¡Esta constelación va por nuestra cuenta!</span></b><em>${was} Gratis</em></div>` : ''}
      </div></div>`,
    buttons: [
      {
        label: `${icon(tk === 'cgold' ? 'constTicket' : 'gold')} Abrir${cost ? ` · ${coin()} ${money(cost)}` : free ? ` · ${coin()} ${was} Gratis` : ''}`,
        disabled: prior != null || !(okStars && okGold && okCoins),
        onClick: () => playUnlock(w, true),
      },
    ],
  });
}

// ---------- Perfil ----------
// Se abre tocando tu avatar (arriba a la derecha) o desde Ajustes. Dentro del tablero el avatar solo se ve.
// Perfil (13 nov 2026, el usuario: más dinámico y con temática): arriba tu credencial de piloto sobre tu fondo del
// universo, con tu avatar, nombre, título y tu nave 3D volando a un lado; luego tus datos (los números suben al
// abrir) y tu última postal con tu marco (al tocarla, el álbum).
// Escondido, para probar en el iPhone: 8 toques seguidos al título («Perfil») muestran los botones de pruebas
// (vista de dificultad y modo dev). Otros 8 los esconden y apagan los dos. Antes estaban en Ajustes.
function openProfile() {
  const worlds = Math.min(currentWorld(), worldOf(save.next));
  // Postales = jefes vencidos; secretos = niveles secretos ganados; tesoros = todo lo demás que tienes de la tienda y la colección.
  let cards = 0, lastW = -1;
  for (let w = 0; w < WORLD_COUNT; w++) if (hasCard(w)) (cards++, (lastW = w));
  const secrets = Object.values(save.secret).filter(Boolean).length;
  const mine = (sec) => ITEMS[sec].filter((it) => owns(sec, it.k)).length;
  const things = SECTIONS.reduce((a, s) => a + (s.k === 'avatar' ? 0 : mine(s.k)), 0);
  const trav = equipped('traveler'), travName = item('traveler', trav)?.name || '';
  const stat = (ico, n, name) => `<div class="stat">${ico}<div><b data-n="${n}">${fmt(n)}</b><span>${name}</span></div></div>`;
  const pm = openModal({
    title: 'Perfil',
    color: 'blue',
    wide: true,
    cls: `mr-${equipped('ring')}`,
    body: `<div class="prof">
      <div class="pf-hero prof-card space-${equipped('space')}"><div class="space"></div><i class="prof-shine"></i>
        <button class="prof-av press" data-a="edit" aria-label="Editar tu jugador" title="Editar tu jugador">${avatarHTML(save, 'huge')}<span class="pen">${icon('pencil')}</span></button>
        <div class="who"><div class="name"><b class="outl">${esc(save.name)}</b></div>
          ${titleHTML()}
          <small>${icon('flag')}Vas en ${levelName(Math.min(save.next, TOTAL_LEVELS - 1))}</small></div>
        <div class="prof-ship" title="Tu nave: ${esc(travName)}"><canvas data-kind="${trav}"></canvas><small>${esc(travName)}</small></div>
      </div>
      <div class="stats">
        ${stat(star(true), totalStars(), 'estrellas')}${stat(icon('planet'), worlds, 'mundos')}${stat(icon('flag'), Math.min(save.next, TOTAL_LEVELS), 'niveles')}${stat(coin(), save.coins, 'monedas')}
        ${stat(icon('album'), cards, 'postales')}${stat(icon('starSecret'), secrets, 'secretos')}${stat(icon('disfraz'), mine('avatar'), 'disfraces')}${stat(icon('cofre'), things, 'tesoros')}
      </div>
      ${lastW >= 0 ? `<button class="prof-pc press" data-a="album"><span class="prof-lbl">${icon('album')}Tu última postal</span>${postcardHTML(lastW, worldStars(lastW), 'mini')}</button>` : ''}
    </div><div class="rows tools prof-tools"${prefs.tools ? '' : ' hidden'}>${toolRows()}</div>`,
    buttons: [
      {
        label: 'Reiniciar perfil',
        cls: 'link duo',
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
      { label: 'Eliminar perfil', cls: 'link duo', onClick: askDelete },
    ],
  });
  document.querySelectorAll('.modal [data-a="edit"]').forEach((b) => (b.onclick = () => {
    document.getElementById('modal-root').replaceChildren();
    editProfile();
  }));
  pm.el.querySelector('[data-a="album"]')?.addEventListener('click', () => (document.getElementById('modal-root').replaceChildren(), openAlbum()));
  // Tu nave en 3D, dando vueltas junto a tu credencial.
  travShelf(pm.el.querySelector('.prof-ship'));
  // Botones de pruebas: 8 toques seguidos al título.
  const pt = pm.el.querySelector('.prof-tools');
  pt.addEventListener('click', (e) => toolClick(e, pt));
  let taps = 0, last = 0;
  pm.el.querySelector('.mhead h2')?.addEventListener('click', (e) => {
    taps = e.timeStamp - last < 1500 ? taps + 1 : 1;
    last = e.timeStamp;
    if (taps < 8) return;
    taps = 0;
    prefs.tools = !prefs.tools;
    if (!prefs.tools) {
      prefs.diffInfo = false;
      if (prefs.dev) toggleDev();
    }
    persist();
    pt.innerHTML = toolRows();
    pt.hidden = !prefs.tools;
    toast(prefs.tools ? 'Pruebas: a la vista' : 'Pruebas: escondidas y apagadas');
  });
  if (reduced()) return;
  // La credencial entra girando un poco; las fichas de datos en cascada y sus números suben desde 0.
  pm.el.querySelector('.prof-card').animate([{ opacity: 0, transform: 'perspective(600px) rotateX(18deg) translateY(16px) scale(0.94)' }, { opacity: 1, transform: 'perspective(600px) rotateX(-3deg) translateY(-2px) scale(1.01)', offset: 0.7 }, { opacity: 1, transform: 'none' }], { duration: 560, delay: 120, easing: 'ease-out', fill: 'backwards' });
  pm.el.querySelector('.prof-ship').animate([{ opacity: 0, translate: '60px -30px', rotate: '20deg' }, { opacity: 1, translate: '0 0', rotate: '0deg' }], { duration: 700, delay: 420, easing: 'cubic-bezier(0.34, 1.3, 0.64, 1)', fill: 'backwards' });
  pm.el.querySelectorAll('.stat').forEach((el, i) => el.animate([{ opacity: 0, translate: '0 12px', scale: 0.9 }, { opacity: 1, translate: '0 0', scale: 1 }], { duration: 360, delay: 360 + i * 50, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'backwards' }));
  pm.el.querySelectorAll('.stat b[data-n]').forEach((b, i) => {
    const n = +b.dataset.n, t0 = performance.now() + 380 + i * 50;
    if (!n) return;
    b.textContent = '0';
    const step = (now) => {
      if (!b.isConnected) return;
      const k = Math.min(1, Math.max(0, (now - t0) / 800));
      b.textContent = fmt(Math.round(n * (1 - (1 - k) ** 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  pm.el.querySelector('.prof-pc')?.animate([{ opacity: 0, translate: '0 20px', rotate: '-3deg' }, { opacity: 1, translate: '0 0', rotate: '0deg' }], { duration: 480, delay: 780, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'backwards' });
}

// Formulario de jugador (crear o editar): nombre, avatar (inicial o personaje), color, marco, título, viajero,
// fondo del universo y postal. p: { name, avatar, look, char, ring, title, traveler, space, frame } · onSave(p). La ventana toma el estilo del marco elegido.
// first: al crear el jugador solo se elige entre lo gratis (inicial, Nico, Lila; marco sencillo o destello).
// onChange(p) (editar, 12 nov 2026, el usuario): cada cosa que eliges se guarda al momento; ya no hay botón Guardar.
function profileForm({ title, p, action, onSave, onChange, onClose, noCancel = false, first = false, tab = 'kid' }) {
  p = { ...p, kid: { ...kidOf(p) } };
  // Al crear el jugador se arma tu personaje (niño o niña, piel, pelo y peinado) con su ropa de inicio.
  if (p.char === 'nina') p.char = 'nino'; // la ropa de inicio es una sola: cada base la suya
  if (first && (p.look !== 'char' || p.char !== 'nino')) Object.assign(p, { look: 'char', char: 'nino' });
  const mine = (sec) => ITEMS[sec].filter((it) => owns(sec, it.k) && (!first || it.price === 0));
  if (first && !mine('ring').some((it) => it.k === p.ring)) p.ring = 'sencillo';
  const chars = mine('avatar').filter((it) => it.k !== 'nina'), rings = mine('ring'), titles = mine('title'), travs = mine('traveler'), spaces = mine('space'), frames = mine('frame');
  const on = (yes) => (yes ? 'on' : '');
  const lookBtn = (look, k) => `<button data-look="${look}" data-char="${k || ''}" class="${on(p.look === look && (look === 'letter' || p.char === k))}" aria-label="${look === 'letter' ? 'Tu inicial' : item('avatar', k).name}" title="${look === 'letter' ? 'Tu inicial' : item('avatar', k).name}">${avatarHTML({ ...p, look, char: k })}</button>`;
  // Tu personaje (10 nov 2026): niño o niña, piel, pelo y peinado, todo gratis. Las fotos de niño/niña y de los
  // peinados van con la ropa de inicio para que se vea el pelo (un disfraz de gorro lo tapa).
  // part: 'base' (niño o niña, con su nombre abajo: así va en la creación), 'look' (piel, pelo y peinado) o todo.
  const kidHTML = (part) => {
    const k = p.kid, photo = (kid, char) => avatarHTML({ ...p, look: 'char', char, kid, ring: 'sencillo' });
    const base = `${part ? '' : '<div class="pick-lbl">Personaje</div>'}<div class="look-pick kid-pick">${['nino', 'nina'].map((b) => `<button data-kbase="${b}" class="${on(k.base === b)}" aria-label="${b === 'nino' ? 'Niño' : 'Niña'}" title="${b === 'nino' ? 'Niño' : 'Niña'}">${photo({ ...k, base: b, style: b === k.base ? k.style : 0 }, 'nino')}${part ? `<small>${b === 'nino' ? 'Niño' : 'Niña'}</small>` : ''}</button>`).join('')}</div>`;
    if (part === 'base') return base;
    return `${part ? '' : base}
      <div class="pick-lbl">Piel</div><div class="avatar-pick">${KID_SKINS.map((c, i) => `<button data-skin="${i}" class="${on(i === k.skin)}" style="background:${c}" aria-label="Piel ${i + 1}"></button>`).join('')}</div>
      <div class="pick-lbl">Pelo</div><div class="avatar-pick">${KID_HAIRS.map((c, i) => `<button data-hair="${i}" class="${on(i === k.hair)}" style="background:${c}" aria-label="Pelo ${i + 1}"></button>`).join('')}</div>
      <div class="pick-lbl">Peinado</div><div class="look-pick kid-pick">${KID_STYLES[k.base].map((n, i) => `<button data-style="${i}" class="${on(i === k.style)}" aria-label="${n}" title="${n}">${photo({ ...k, style: i }, 'nino')}</button>`).join('')}</div>`;
  };
  const shopBtn = (tab, cls, label) => (noCancel ? '' : `<button class="more ${cls}" data-shop="${tab}" aria-label="${label}" title="${label}">${icon('bag')}</button>`);
  // Al crear el jugador, Continuar va hasta abajo (dentro de lo que se desplaza) para que se vea que hay más
  // opciones; la foto se queda fija arriba para ver lo que se va eligiendo.
  // Editar (no la primera vez): arriba una franja fija con tu avatar, nombre y título sobre tu cielo; abajo
  // pestañas con ícono y en cada una solo sus opciones, separadas por de dónde salen. Así no se amontona
  // aunque tengas de todo, y las naves 3D solo se dibujan en su pestaña.
  const TABS = [
    { k: 'kid', name: 'Tú', ico: 'user' }, // tu personaje: niño o niña, piel, pelo y peinado
    { k: 'avatar', name: 'Disfraz', ico: 'disfraz' },
    { k: 'ring', name: 'Marco', ico: 'crown' },
    { k: 'title', name: 'Título', ico: 'flag' },
    { k: 'traveler', name: 'Viajero', ico: 'rocket' },
    { k: 'space', name: 'Fondo', ico: 'planet' },
    { k: 'frame', name: 'Postal', ico: 'album' },
  ];
  // Una lista en grupos por origen (tienda, colección, mes, festividades), con subtítulo si hay más de uno.
  // cls: la cuadrícula de siempre de esa sección · lead: lo que va primero (tu inicial, en Avatar).
  const grouped = (list, cell, cls, lead = '') => {
    const gs = ORIGINS.map((o) => ({ ...o, its: list.filter((it) => (exFrom(it)?.g || 'tienda') === o.k) })).filter((o) => o.its.length || (lead && o.k === 'tienda'));
    return gs.map((o, i) => (gs.length > 1 ? `<h3 class="s-sub">${icon(o.ico)}${o.name}</h3>` : '') + `<div class="${cls}">${i ? '' : lead}${o.its.map(cell).join('')}</div>`).join('');
  };
  const panel = (tab) => ({
    kid: () => `<div class="kid-panel">${kidHTML()}</div>`,
    avatar: () => `<div class="pick-lbl">Color de fondo</div><div class="avatar-pick">${AVATAR_COLORS.map((c, i) => `<button data-av="${i}" class="${on(i === p.avatar)}" style="background:${c}" aria-label="Color de fondo ${i + 1}"></button>`).join('')}</div>
      <div class="pick-lbl">Disfraz</div>${grouped(chars, (it) => lookBtn('char', it.k), 'look-pick', lookBtn('letter'))}`,
    ring: () => grouped(rings, (it) => `<button data-ring="${it.k}" class="${on(it.k === p.ring)}" aria-label="${it.name}" title="${it.name}">${avatarHTML({ ...p, ring: it.k })}</button>`, 'look-pick rings'),
    title: () => grouped(titles, (it) => titleHTML(it.k, on(it.k === p.title), 'button', `data-title="${it.k}"`), 'title-pick'),
    traveler: () => grouped(travs, (it) => `<button data-trav="${it.k}" class="${on(it.k === p.traveler)}" aria-label="${it.name}" title="${it.name}"><canvas data-kind="${it.k}"></canvas></button>`, 'trav-pick'),
    space: () => grouped(spaces, (it) => `<button data-space="${it.k}" class="${on(it.k === p.space)}" aria-label="${it.name}" title="${it.name}"><div class="space-prev space-${it.k}"><div class="space"></div></div><small>${it.name}</small></button>`, 'space-pick'),
    frame: () => grouped(frames, (it) => `<button data-frame="${it.k}" class="${on(it.k === p.frame)}" aria-label="${it.name}" title="${it.name}"><div class="frame-prev">${postcardHTML(0, 24, 'mini', it.k)}</div><small>${it.name}</small></button>`, 'frame-pick'),
  })[tab]();
  let tabNow = tab; // la pestaña abierta: el botón de la tienda lleva a esa sección
  const editBody = `<div class="pf-top"><div class="pf-hero space-${p.space}"><div class="space"></div><div class="avatar-preview">${avatarHTML(p, 'huge')}</div>
      <div class="pf-id"><input class="text-in" maxlength="16" aria-label="Tu nombre" placeholder="Tu nombre" autocomplete="off" autocapitalize="words" enterkeyhint="done" value="${esc(p.name)}"><div class="pf-title">${titleHTML(p.title)}</div></div></div>
      <div class="pf-tabs">${TABS.map((t) => `<button class="pf-tab ${on(t.k === tab)}" data-tab="${t.k}">${icon(t.ico)}<span>${t.name}</span></button>`).join('')}</div></div>
      <div class="pf-panel">${panel(tab)}</div>`;
  const m = openModal({
    title,
    color: 'blue',
    closable: !noCancel,
    cls: `pform ${first ? 'pf-first' : 'pf-edit'} mr-${p.ring}`,
    // Creación (10 nov 2026, el usuario: «muy saturada de tanta opción»): 3 pasos cortos con tu personaje grande
    // arriba: 1) tu nombre, 2) niño o niña, 3) tu look (piel, pelo y peinado). Color, marco y título se quedan
    // como vienen; se cambian después al editar tu jugador.
    // 11 nov 2026 (pedido del usuario): en el paso del nombre no sale tu personaje; aparece en «¿Quién eres?».
    body: first ? `<div class="pf-wiz at-0"><div class="pf-stage"><div class="avatar-preview">${avatarHTML(p, 'huge')}</div>
      <div class="pf-dots" aria-hidden="true"><i class="on"></i><i></i><i></i></div></div>
      <div class="pf-side"><div class="pf-steps">
        <section class="pf-step" data-step="0"><h3 class="pf-q">¿Cómo te llamas?</h3>
          <input class="text-in" maxlength="16" placeholder="Tu nombre" aria-label="Tu nombre" autocomplete="off" autocapitalize="words" enterkeyhint="next" value="${esc(p.name)}"></section>
        <section class="pf-step" data-step="1" hidden><h3 class="pf-q">¿Quién eres?</h3><div class="kid-panel" data-part="base">${kidHTML('base')}</div></section>
        <section class="pf-step" data-step="2" hidden><h3 class="pf-q">Tu look</h3><div class="kid-panel" data-part="look">${kidHTML('look')}</div>
          <p class="pf-note">${icon('disfraz')}<span>Jugando desbloqueas <b>disfraces</b>. Todo esto lo cambias cuando quieras.</span></p></section>
      </div>
      <div class="pf-nav"><button class="pf-back" hidden>${icon('prev')}Atrás</button><button class="btn green pf-next">Siguiente</button></div></div></div>` : editBody,
    buttons: first ? [] : [
      // keep: se cierra sin onClose (que regresa al perfil), como el botón de la tienda de cada pestaña.
      { label: `${icon('bag')}<span>Tienda</span>`, cls: 'ghost grow', title: 'Ir a la tienda', keep: true, onClick: () => (closeShelf(), document.getElementById('modal-root').replaceChildren(), openShop(tabNow === 'kid' ? 'avatar' : tabNow)) },
    ],
    onClose: () => (closeShelf(), onClose?.()),
  });
  const box = document.querySelector('.pform');
  if (!first) pauseOffscreen(box.querySelector('.pf-panel'), 'button');
  const input = box.querySelector('.text-in');
  const changed = () => onChange?.({ ...p, name: p.name.trim() });
  // Creación por pasos: Siguiente / Atrás con los pasos deslizándose y los puntitos de avance; el último es «¡Listo!».
  let step = 0;
  const goStep = (to) => {
    const steps = [...box.querySelectorAll('.pf-step')], from = step;
    if (to < 0 || to >= steps.length || to === from) return;
    step = to;
    const dir = to > from ? 1 : -1, now = steps[to];
    steps.forEach((x, i) => (x.hidden = i !== to));
    if (!reduced()) {
      now.animate([{ opacity: 0, translate: `${dir * 40}px 0` }, { opacity: 1, translate: '0 0' }], { duration: 320, easing: 'cubic-bezier(0.34, 1.3, 0.64, 1)' });
      [...now.querySelectorAll('button')].slice(0, 16).forEach((el, i) => el.animate([{ opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1 }], { duration: 280, delay: 60 + i * 30, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'backwards' }));
    }
    box.querySelector('.pf-wiz').classList.toggle('at-0', to === 0);
    if (from === 0 && !reduced()) box.querySelector('.pf-stage .avatar-preview').animate([{ opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1.1, offset: 0.7 }, { opacity: 1, scale: 1 }], { duration: 420, easing: 'ease-out' });
    box.querySelectorAll('.pf-dots i').forEach((d, i) => d.classList.toggle('on', i === to));
    box.querySelectorAll('.pf-dots i').forEach((d, i) => d.classList.toggle('done', i < to));
    const back = box.querySelector('.pf-back'), next = box.querySelector('.pf-next');
    back.hidden = to === 0;
    next.textContent = to === steps.length - 1 ? action : 'Siguiente';
    if (!reduced()) next.animate([{ scale: 0.92 }, { scale: 1.05, offset: 0.6 }, { scale: 1 }], { duration: 300, easing: 'ease-out' });
    if (to === 0 && matchMedia('(pointer: fine)').matches) box.querySelector('.text-in').focus();
    else if (from === 0) box.querySelector('.text-in').blur();
  };
  const paint = (pop) => {
    box.querySelector('.avatar-preview').innerHTML = avatarHTML(p, 'huge');
    const fl = box.querySelector('.pf-float');
    if (fl) fl.innerHTML = avatarHTML(p);
    box.querySelectorAll('[data-look]').forEach((b) => (b.innerHTML = avatarHTML({ ...p, look: b.dataset.look, char: b.dataset.char || p.char })));
    box.querySelectorAll('[data-ring]').forEach((b) => (b.innerHTML = avatarHTML({ ...p, ring: b.dataset.ring })));
    box.className = box.className.replace(/\bmr-\S+/, `mr-${p.ring}`);
    if (pop && !reduced()) box.querySelector('.avatar-preview .avatar').animate([{ scale: 0.7, rotate: '-8deg' }, { scale: 1.1, rotate: '4deg', offset: 0.6 }, { scale: 1, rotate: '0deg' }], { duration: 420, easing: 'ease-out' });
  };
  // El nombre solo cambia el dibujo si el avatar es tu inicial (si no, se volvía a armar con cada letra).
  input.addEventListener('input', () => {
    p.name = input.value;
    if (p.look === 'letter') paint();
    changed();
  });
  input.addEventListener('keydown', (e) => e.key === 'Enter' && (first ? box.querySelector('.pf-next')?.click() : input.blur()));
  const pick = (sel, b) => box.querySelectorAll(sel).forEach((x) => x.classList.toggle('on', x === b));
  const bounce = (el) => !reduced() && el.animate([{ scale: 0.8 }, { scale: 1.12, offset: 0.6 }, { scale: 1 }], { duration: 360, easing: 'ease-out' });
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('pf-back')) return goStep(step - 1);
    if (b.classList.contains('pf-next')) {
      if (step < box.querySelectorAll('.pf-step').length - 1) return goStep(step + 1);
      m.close();
      return onSave({ ...p, name: p.name.trim() });
    }
    if (b.dataset.shop) { closeShelf(); document.getElementById('modal-root').replaceChildren(); return openShop(b.dataset.shop); }
    if (b.dataset.tab) {
      if (b.classList.contains('on')) return;
      pick('[data-tab]', b);
      tabNow = b.dataset.tab;
      closeShelf();
      const pn = box.querySelector('.pf-panel');
      pn.innerHTML = panel(b.dataset.tab);
      pauseOffscreen(pn, 'button');
      box.querySelector('.mbody').scrollTop = 0;
      if (b.dataset.tab === 'traveler') travShelf(pn);
      if (!reduced()) [...pn.querySelectorAll('.pf-panel button')].slice(0, 24).forEach((el, i) => el.animate([{ opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1 }], { duration: 260, delay: i * 18, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'backwards' }));
      return;
    }
    if (b.dataset.look) { p.look = b.dataset.look; if (b.dataset.char) p.char = b.dataset.char; pick('[data-look]', b); paint(true); }
    // Tu personaje: al cambiar de niño a niña (o al revés) el peinado vuelve al primero y la ropa de inicio se cambia
    // con él; un disfraz se queda puesto. Las fotos del panel se vuelven a sacar con lo nuevo.
    if (b.dataset.kbase || b.dataset.skin || b.dataset.hair || b.dataset.style) {
      const k = { ...p.kid }, d = b.dataset;
      if (d.kbase && d.kbase !== k.base) { k.base = d.kbase; k.style = 0; if (p.look !== 'char') Object.assign(p, { look: 'char', char: 'nino' }); }
      if (d.skin) k.skin = +d.skin;
      if (d.hair) k.hair = +d.hair;
      if (d.style) k.style = +d.style;
      p.kid = k;
      box.querySelectorAll('.kid-panel').forEach((x) => (x.innerHTML = kidHTML(x.dataset.part)));
      paint(true);
    }
    if (b.dataset.av) { p.avatar = +b.dataset.av; pick('[data-av]', b); paint(true); }
    if (b.dataset.ring) { p.ring = b.dataset.ring; pick('[data-ring]', b); paint(true); }
    if (b.dataset.title) { p.title = b.dataset.title; pick('[data-title]', b); bounce(b); const t = box.querySelector('.pf-title'); if (t) { t.innerHTML = titleHTML(p.title); bounce(t); } }
    if (b.dataset.trav) { p.traveler = b.dataset.trav; pick('[data-trav]', b); bounce(b); }
    if (b.dataset.space) { p.space = b.dataset.space; pick('[data-space]', b); bounce(b); const hero = box.querySelector('.pf-hero'); if (hero) hero.className = `pf-hero space-${p.space}`; }
    if (b.dataset.frame) { p.frame = b.dataset.frame; pick('[data-frame]', b); bounce(b); }
    changed();
  });
  if (matchMedia('(pointer: fine)').matches) input.focus();
}
const playerNow = () => ({ name: save.named ? save.name : '', avatar: save.avatar || 0, look: save.look, char: save.char, kid: kidOf(save), ring: equipped('ring'), title: equipped('title'), traveler: equipped('traveler'), space: equipped('space'), frame: equipped('frame') });
const savePlayer = (p, fallback) => {
  renameProfile(p.name || fallback, p.avatar, { look: p.look, char: p.char, kid: p.kid });
  delete save.kidAsk;
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
    action: '¡Listo!',
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

// Se guarda solo con cada cambio (12 nov 2026, el usuario); al cerrar regresa al perfil y se repinta lo de atrás.
function editProfile() {
  const trav = equipped('traveler'), name = save.name;
  profileForm({
    title: 'Tu jugador',
    p: playerNow(),
    onChange: (p) => savePlayer(p, name),
    onClose: () => {
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
      ${game ? '' : `<button class="row" data-a="gift">${icon('gift')}<b>Códigos<span>Canjea un código de regalo</span></b>${icon('chev')}</button>`}
      ${game ? '' : `<button class="row" data-a="backup">${icon('backup')}<b>Respaldo<span>Guarda tu avance con un código</span></b>${icon('chev')}</button>`}
      ${installPrompt ? `<button class="row" data-a="install"><img class="ico app-ico" src="icon.svg" alt=""><b>Instalar app<span>Pantalla completa y sin conexión</span></b>${icon('chev')}</button>` : ''}
    </div>`,
  });
  m.el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'help') { m.el.remove(); openHelp('basico', () => openSettings(then)); }
    if (a === 'profile') { m.el.remove(); openProfile(); }
    if (a === 'backup') { m.el.remove(); openBackup(() => openSettings(then)); }
    if (a === 'gift') { m.el.remove(); openGiftCode(() => openSettings(then)); }
    if (a === 'install') installApp().then((ok) => ok && m.el.remove());
  });
}
// Tocar un botón de pruebas (en el perfil): lo prende o apaga y repinta los botones.
function toolClick(e, box) {
  const a = e.target.closest('[data-a]')?.dataset.a;
  if (a === 't-diff') {
    prefs.diffInfo = !prefs.diffInfo;
    persist();
    toast(prefs.diffInfo ? 'Dificultad del nivel: sí' : 'Dificultad del nivel: no');
  }
  if (a === 't-dev') toggleDev();
  if (box.isConnected) box.innerHTML = toolRows();
}
// Botones de pruebas en el perfil (8 toques al título): cada uno dice si está prendido.
const toolRows = () => [['t-diff', 'flame', 'Vista de dificultad', 'El tablero dice qué tan difícil es el nivel', prefs.diffInfo], ['t-dev', 'gear', 'Modo dev', 'Botones de pruebas en el mapa y el tablero', prefs.dev]]
  .map(([a, ico, name, sub, on]) => `<button class="row${on ? ' ok' : ''}" data-a="${a}">${icon(ico)}<b>${name}<span>${sub}</span></b><em>${on ? 'Desactivar' : 'Activar'}</em></button>`).join('');

// ---------- Dificultad escondida ----------
// Con la vista de dificultad prendida (botones de pruebas del perfil: 8 toques al título), el tablero dice en una esquina qué tan
// difícil es el nivel, como en el modo dev: % que gana el bot casual y su etiqueta. Para probar en el iPhone sin dev.
function diffTag(g, level) {
  if (!prefs.diffInfo || !g?.el) return;
  const tag = h('<div class="diff-tag">…</div>');
  g.el.append(tag);
  // El bot juega 60 partidas: después de que el tablero entra, para no trabar la animación.
  setTimeout(() => {
    if (!tag.isConnected) return;
    const p = casualRate(level);
    tag.textContent = `bot ${p}% · ${rateTag(level, p)}`;
  }, 700);
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
addEventListener('screeninfo', screenInfo); // el menú dev las prende o apaga

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

// ---------- Códigos de regalo ----------
// Un código (ver codes.js) da monedas, ayudas o una cosa de la tienda. Sirve una sola vez.
function openGiftCode(then, text = '') {
  const m = openModal({
    title: 'Códigos',
    color: 'green',
    onClose: then,
    body: `<div class="gift-top">${icon('gift', 0, 0, 'big')}</div>
      <p class="lead">¿Te regalaron un código? Escríbelo aquí y descubre tu regalo.</p>
      <input class="text-in gift-in" value="${esc(text)}" maxlength="14" placeholder="XXXX-XXXX-XXXX" spellcheck="false" autocapitalize="characters" autocomplete="off" autocorrect="off" enterkeyhint="go">`,
    buttons: [{ label: `${icon('gift')} Canjear`, cls: 'green wide', keep: true, disabled: true, onClick: () => tryGift(m, then) }],
  });
  const box = m.el.querySelector('.gift-in'), go = m.el.querySelector('.mbtns .btn');
  // Se ve como se escribe en el código: mayúsculas y un guion cada 4 letras.
  const tidy = () => {
    const raw = box.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    box.value = raw.match(/.{1,4}/g)?.join('-') || '';
    go.disabled = raw.length < 12;
  };
  box.addEventListener('input', tidy);
  box.addEventListener('keydown', (e) => e.key === 'Enter' && !go.disabled && go.click());
  tidy();
}
function tryGift(m, then) {
  const box = m.el.querySelector('.gift-in');
  const res = redeem(box.value);
  if (res.err) {
    const it = res.reward?.item && item(res.reward.item.sec, res.reward.item.k);
    toast(res.err === 'usado' ? 'Ese código ya se usó' : it ? `Ya tienes ${it.name}: regálale el código a alguien más` : 'Ese código no sirve');
    buzz(30);
    if (!reduced()) box.animate([{ translate: '0 0' }, { translate: '-8px 0' }, { translate: '7px 0' }, { translate: '-4px 0' }, { translate: '0 0' }], { duration: 340, easing: 'ease-out' });
    box.focus();
    return;
  }
  m.el.remove();
  openGiftPrize(res.reward);
}
// La caja tiembla, se abre y el regalo sale en burbujas, como los premios al ganar: icono y número (monedas, ayudas)
// o un circulito con lo que es (giftBubble). Lo de la tienda se ve luego en la tienda o el perfil.
// Las monedas y los boletos vuelan al monedero al continuar (el guardado ya los tiene).
function openGiftPrize(r) {
  confetti(60);
  const it = r.item;
  const m = openModal({
    title: '¡Un regalo para ti!',
    color: 'green',
    closable: false,
    cls: 'gift-prize',
    body: `<div class="gift-box"><div class="gbox"><span class="lid">${boxLid()}</span><span class="body">${boxBody()}</span></div></div>`,
    buttons: [{
      label: 'Continuar',
      cls: 'green wide',
      onClick: () => {
        const b = m.el.querySelector('.gbox').getBoundingClientRect(), at = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
        closeShelf();
        (async () => {
          if (r.coins) await flyToWallet('coins', at, r.coins);
          if (r.tickets) await flyToWallet('tickets', at, r.tickets);
        })();
      },
    }],
  });
  boxBubbles(m, it ? [giftBubble(it.sec, it.k)] : prizeIcons(r));
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
// 9 nov 2026: la ayuda crece con el jugador. Cada bloque con data-u (id de Tu camino: carta, mesa, meteoro, apuesta2;
// varios con "|") sale solo si ya lo alcanzó; los títulos que se quedan sin bloques y las pestañas vacías se esconden.
function openHelp(tab = 'basico', then) {
  const reached = new Set(roadItems().filter((x) => x.n <= roadAt()).map((x) => x.id));
  const prune = (html) => {
    const d = document.createElement('div');
    d.innerHTML = html;
    d.querySelectorAll('[data-u]').forEach((el) => !el.dataset.u.split('|').some((u) => reached.has(u)) && el.remove());
    d.querySelectorAll('.help-h').forEach((h) => (!h.nextElementSibling || h.nextElementSibling.matches('.help-h')) && h.remove());
    return d.innerHTML;
  };
  const tabs = ['basico', 'cartas', 'mesas'].filter((t) => t === 'basico' || /class="step"/.test(prune(raw(t))));
  if (!tabs.includes(tab)) tab = 'basico';
  const body = (t) => prune(raw(t));
  function raw(t) {
    return (
    t === 'basico'
      ? `<div class="steps">
        <h3 class="help-h">Jugar</h3>
        <div class="step"><div class="ill">${mini(0, '6', 's')}${mini(37, '7', 'h', {}, 'ring')}${mini(74, '8', 'd')}</div><p>Toca una carta <b>boca arriba</b> que sea <b>uno más o uno menos</b> que la de tu montón.</p></div>
        <div class="step"><div class="ill">${mini(16, 'K', 'c')}${mini(56, 'A', 'h')}</div><p>La <b>K</b> y el <b>A</b> se conectan.</p></div>
        <div class="step"><div class="ill">${[0, 1, 2].map((i) => helpBack(14 + i * 6, `top:${8 - i * 3}px`)).join('')}${mini(70, '3', 'h')}</div><p>¿Sin jugada? <b>Toca el mazo</b> y sale otra carta. Ojo: tu racha vuelve a cero.</p></div>
        <h3 class="help-h">Racha</h3>
        <div class="step"><div class="ill c dots">${'<i></i>'.repeat(4)}<div class="card gift-card"><div class="inner"><div class="face back"></div></div></div></div><p>Juega cartas <b>seguidas</b> sin tocar el mazo. A las <b>6</b> te cae una carta extra al mazo y a las <b>13</b>, un comodín.</p></div>
        <div class="step"><div class="ill c pair"><div class="card gift-card"><div class="inner"><div class="face back"></div></div></div><div class="card up"><div class="inner"><div class="face front wild"></div></div></div></div><p>Si sigues: carta extra a las <b>18</b> y <b>23</b>, y a las <b>31</b> un comodín para guardar.</p></div>
        <div class="step"><div class="ill c">${icon('escoba')}</div><p>A las <b>30</b> pasa la <b>escoba</b> y se lleva todas las cartas del fondo, las más tapadas.</p></div>
        <h3 class="help-h">Ayudas</h3>
        <div class="step"><div class="ill c"><span class="help-btn gold">${icon('ayudas')}</span></div><p>El <b>botón dorado</b> abre tus ayudas. Abajo de cada una compras <b>+1</b> con un toque; tocar la carta la usa cuando tú quieras. Solo salen las que sirven en ese nivel.</p></div>
        <div class="step"><div class="ill c"><div class="card up"><div class="inner"><div class="face front wild"></div></div></div></div><p><b>Comodín:</b> vale cualquier número. Úsalo cuando no tengas jugada.</p></div>
        <div class="step" data-u="bomb|comet|live|ghost|cham|vine"><div class="ill c"><span class="help-card" style="background-image:${cardBackURL('hreloj')}"></span></div><p><b>Reloj de arena:</b> congela 3 turnos todo lo que cuenta: bombas, cometas, cartas vivas, fantasmas y camaleones.</p></div>
        <div class="step"><div class="ill c"><span class="help-card" style="background-image:${cardBackURL('hver')}"></span></div><p><b>Ver cartas:</b> voltea todas las cartas de la mesa unos segundos.</p></div>
        <div class="step" data-u="lock|curtain"><div class="ill c"><span class="help-card" style="background-image:${cardBackURL('hllave')}"></span></div><p><b>Llave maestra:</b> abre todos los candados y cortinas.</p></div>
        <div class="step" data-u="rocas"><div class="ill c"><span class="help-card" style="background-image:${cardBackURL('hlaser')}"></span></div><p><b>Láser:</b> rompe todas las piedras de los asteroides.</p></div>
        <div class="step" data-u="ship"><div class="ill c"><span class="help-card" style="background-image:${cardBackURL('hescudo')}"></span></div><p><b>Escudo:</b> la nave ladrona ya no te roba en todo el nivel.</p></div>
        <div class="step" data-u="magnet"><div class="ill c"><span class="help-card" style="background-image:${cardBackURL('himan')}"></span></div><p><b>Imán:</b> tu siguiente robo saca del mazo la carta que más te sirve, sin cortar tu racha, y la carta que conviene jugar tiembla.</p></div>
        <div class="step" data-u="scope"><div class="ill c"><span class="help-card" style="background-image:${cardBackURL('htele')}"></span></div><p><b>Telescopio:</b> deja ver todas las cartas del tablero 5 turnos.</p></div>
        <div class="step" data-u="astro"><div class="ill c"><span class="help-card" style="background-image:${cardBackURL('hastro')}"></span></div><p><b>Astronauta:</b> llega a tu nivel y te guarda una carta libre. Cuando conecte, la manda al descarte.</p></div>
        <div class="step"><div class="ill c"><span class="help-btn">${icon('undo')}</span></div><p><b>Deshacer:</b> regresa tu última jugada o la carta que robaste.</p></div>
        <div class="step"><div class="ill c"><span class="help-five"><b>+5</b></span></div><p>¿Se acabó el mazo? Toca el <b>+5</b> para comprar 5 cartas. Con ellas te llevas solo 1 estrella.</p></div>
        <h3 class="help-h">Estrellas y boletos</h3>
        <div class="step"><div class="ill c">${star(true)}${star(true, 'big')}${star(true)}</div><p>Ganas al <b>vaciar la mesa</b>. Si te queda la <b>mitad del mazo</b> o más: 3 estrellas. Una cuarta parte: 2. Menos: 1.</p></div>
        <div class="step"><div class="ill c">${icon('ticket')}</div><p>Un nivel nuevo cuesta <b>boletos</b>. Si lo ganas, te los regresamos; si pierdes o lo dejas, se gastan.</p></div>
        <h3 class="help-h">Para ganar más</h3>
        <div class="step" data-u="meteoro"><div class="ill c">${icon('meteoro')}</div><p><b>Lluvia de meteoritos:</b> cae sin aviso por 30 minutos. Las monedas valen <b>el doble</b> y con 3 estrellas te cae un <b>premio sorpresa</b>.</p></div>
        <div class="step" data-u="estrellas"><div class="ill c">${icon('starFall')}</div><p><b>Lluvia de estrellas:</b> cae sin aviso por 15 minutos. Las monedas valen <b>el triple</b> y cada nivel con 3 estrellas te da un <b>premio sorpresa</b> (hasta 3).</p></div>
        <div class="step" data-u="cometas"><div class="ill c">${icon('cometaLluvia')}</div><p><b>Lluvia de cometas:</b> cae sin aviso por 20 minutos. Los niveles nuevos <b>no gastan boletos</b>, cada victoria da <b>1 boleto más</b> y tu primer nivel con 3 estrellas te da un <b>premio sorpresa</b>.</p></div>
        <div class="step" data-u="aurora"><div class="ill c">${icon('aurora')}</div><p><b>Aurora:</b> sale sin aviso por 20 minutos cuando hay colección. Las <b>fichas valen el doble</b> y cada nivel con 3 estrellas te da un <b>premio sorpresa</b> (hasta 2).</p></div>
        <div class="step" data-u="cristales"><div class="ill c">${icon('cristal')}</div><p><b>Lluvia de cristales:</b> cae sin aviso por 10 minutos, la más rara. Los niveles que ganes te pueden dar una <b>ayuda</b> y tu primer nivel con 3 estrellas te da un <b>premio sorpresa</b>.</p></div>
        <div class="step" data-u="apuesta2"><div class="ill c"><i class="go-bet dbet b2">×2</i><i class="go-bet dbet b10">×10</i></div><p><b>Apuesta:</b> al tocar <b>Jugar</b> escoge tu ×N. Si ganas, <b>todo</b> lo que da el nivel se multiplica por ese número.</p></div>
      </div>`
      : t === 'mesas'
        ? `<div class="steps">
        <h3 class="help-h">Mesas que se descubren</h3>
        <div class="step" data-u="ship"><div class="ill c">${mechCard('ship')}</div><p><b>Nave ladrona:</b> ${TABLE_TEXT.nave.join(' ')}</p></div>
        <div class="step" data-u="mesa"><div class="ill"><span class="h-rug"></span>${mini(2, '4', 'c')}${mini(40, '5', 'h')}<span class="h-roll"></span></div><p><b>Mesa enrollada:</b> ${TABLE_TEXT.mesa.join(' ')}</p></div>
        <div class="step" data-u="nebulosa"><div class="ill">${mini(0, '9', 's')}${mini(34, '10', 'd')}<span class="h-neb"></span></div><p><b>Nebulosa:</b> ${TABLE_TEXT.nebulosa.join(' ')}</p></div>
        <div class="step" data-u="gravedad"><div class="ill"><span class="h-rail" style="left:10px"></span><span class="h-rail" style="left:58px"></span>${helpBack(14, 'top:0px')}${mini(14, '8', 'c', {}, 'h-low')}${helpBack(62, 'top:0px')}${mini(62, 'J', 'h', {}, 'h-low')}</div><p><b>Gravedad:</b> ${TABLE_TEXT.gravedad.join(' ')}</p></div>
        <div class="step" data-u="hangar"><div class="ill tbl-ill">${tableIcon('hangar')}</div><p><b>Hangar:</b> ${TABLE_TEXT.hangar.join(' ')}</p></div>
        <div class="step" data-u="bitacora"><div class="ill tbl-ill">${tableIcon('bitacora')}</div><p><b>Bitácora:</b> ${TABLE_TEXT.bitacora.join(' ')}</p></div>
        <div class="step" data-u="portal"><div class="ill tbl-ill">${tableIcon('portal')}</div><p><b>Grúa de feria:</b> ${TABLE_TEXT.portal.join(' ')}</p></div>
        <div class="step" data-u="voltea"><div class="ill tbl-ill">${tableIcon('voltea')}</div><p><b>Mesa que se voltea:</b> ${TABLE_TEXT.voltea.join(' ')}</p></div>
        <div class="step" data-u="marea"><div class="ill">${mini(10, '7', 's')}${mini(48, '8', 'h')}<span class="h-tide"></span></div><p><b>Marea:</b> ${TABLE_TEXT.marea.join(' ')}</p></div>
        <div class="step" data-u="hoyo"><div class="ill">${mini(6, '4', 'd')}${mini(44, '9', 's')}<span class="h-hole"></span></div><p><b>Agujero negro:</b> ${TABLE_TEXT.hoyo.join(' ')}</p></div>
        <div class="step" data-u="astro"><div class="ill c"><span class="help-btn">${icon('astronauta')}</span></div><p><b>Astronauta:</b> ${TABLE_TEXT.astro.join(' ')}</p></div>
        <div class="step" data-u="rocas"><div class="ill">${mini(10, '7', 's')}${mini(48, '8', 'h', { marks: `<span class="rock-ov">${icon('asteroide')}<b class="outl">3</b></span>` })}</div><p><b>Asteroides:</b> ${TABLE_TEXT.rocas.join(' ')}</p></div>
        <div class="step" data-u="puertas"><div class="ill"><span class="h-door"><i></i><i></i></span>${mini(56, '6', 'h', { doorKey: 1 })}</div><p><b>Puertas:</b> ${TABLE_TEXT.puertas.join(' ')}</p></div>
        <div class="step" data-u="banda"><div class="ill"><span class="h-belt"><i></i></span>${mini(24, 'K', 'c', {}, 'h-belt-c')}${mini(58, '2', 'h', {}, 'h-belt-c')}</div><p><b>Banda transportadora:</b> ${TABLE_TEXT.banda.join(' ')}</p></div>
      </div>`
        : `<div class="steps">${MECH_GROUPS.map(([h, ms]) => `<h3 class="help-h">${h}</h3>${ms.map((m) => `<div class="step" data-u="${m}"><div class="ill c${MECH_BOTH[m] ? ' pair' : ''}">${MECH_BOTH[m]?.() || mechCard(m)}</div><p><b>${MECH_NAMES[m]}:</b> ${MECH_TEXT[m]}</p></div>`).join('')}`).join('')}</div>`);
  }
  const m = openModal({
    title: 'Ayuda',
    ico: 'help',
    color: 'blue',
    wide: true,
    onClose: then,
    body: `${tabs.length < 2 ? '' : `<div class="tabs" role="tablist">${[['basico', 'help', 'Cómo jugar'], ['cartas', 'wild', 'Cartas especiales'], ['mesas', 'planet', 'Mesas']].filter(([t]) => tabs.includes(t)).map(([t, ico, name]) => `<button role="tab" data-t="${t}" aria-selected="${tab === t}">${icon(ico)}${name}</button>`).join('')}</div>`}<div class="tab-body">${body(tab)}</div>`,
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

// Eliminar perfil (8 nov 2026): pregunta dos veces y vuelve a empezar desde la presentación, como la primera vez.
// La segunda ventana no deja eliminar hasta que pasan 3 segundos (para no tocarlo de corrido).
function askDelete() {
  openModal({
    title: '¿Eliminar tu perfil?',
    color: 'pink',
    body: `<p class="lead">Se borra <b>todo</b>: tu nombre, tu avatar, niveles, estrellas, monedas y lo comprado. El juego empieza otra vez <b>desde el principio</b>.</p>
      <p class="note">Si quieres guardar tu avance, antes saca tu código en Ajustes → Respaldo.</p>`,
    buttons: [
      { label: 'Cancelar', cls: 'ghost', onClick: openProfile },
      { label: 'Sí, eliminar', cls: 'pink', onClick: askDeleteAgain },
    ],
  });
}
function askDeleteAgain() {
  const m = openModal({
    title: '¿Seguro?',
    color: 'pink',
    body: `<p class="lead">Última pregunta: <b>${esc(save.name || 'tu perfil')}</b> se elimina para siempre. No se puede deshacer.</p>`,
    buttons: [
      { label: 'No, me quedo', cls: 'green', onClick: openProfile },
      { label: 'Eliminar para siempre', cls: 'pink', disabled: true, onClick: () => (deleteProfile(), location.reload()) },
    ],
  });
  const b = m.el.querySelector('.mbtns .pink'), txt = b.innerHTML;
  let n = 3;
  b.innerHTML = `${txt} (${n})`;
  const t = setInterval(() => {
    if (!b.isConnected) return clearInterval(t);
    if (--n > 0) return void (b.innerHTML = `${txt} (${n})`);
    clearInterval(t);
    b.innerHTML = txt;
    b.disabled = false;
    if (!reduced()) b.animate([{ scale: 1 }, { scale: 1.08 }, { scale: 1 }], { duration: 260, easing: 'ease-out' });
  }, 1000);
}

// ---------- Arranque ----------
// La primera vez: presentación y perfil (obligatorias). Después siempre empieza en las constelaciones,
// con la que vas al frente: ahí salen los avisos. Una partida a medias se retoma con Continuar.
// ---------- Partidas que no se pueden dejar a medias (7 nov 2026) ----------
// Eventos y niveles desde la constelación 2: no hay Guardar y salir. Si la app se cierra o se va al fondo, al volver
// sigue la partida si pasaron menos de RUN_LIMIT; si no, se pierde el intento (y el boleto), como abandonar.
// El juego no puede saber si la cerró el jugador o el teléfono (una llamada): por eso hay margen.
const RUN_LIMIT = 30 * 60e3;
const NO_EXIT_FROM = LEVELS_PER_WORLD * REGION_SIZE; // nivel 101 (antes decía 1000 por error)
const openRuns = () => [
  save.run && !save.run.replay && save.run.g >= NO_EXIT_FROM && !isSecret(save.run.g) ? { r: save.run, lose: () => ((save.run = null), isOn('racha') && streakLose(), persist()) } : null,
  ev()?.state.run ? { r: ev().state.run, lose: evLose } : null,
  festival()?.state?.run ? { r: festival().state.run, lose: festLose } : null,
].filter(Boolean);
// Al irse al fondo se marca la hora; al volver (o al abrir la app) se revisa.
function stampRuns() {
  const now = Date.now();
  openRuns().forEach(({ r }) => (r.at = now));
  persist();
}
function staleRuns() {
  const old = openRuns().filter(({ r }) => r.at && Date.now() - r.at > RUN_LIMIT);
  if (!old.length) return false;
  old.forEach(({ lose }) => lose());
  if (game) {
    game.destroy();
    game = null;
    document.getElementById('modal-root').replaceChildren();
    showUniverse();
  }
  toast('Pasaron más de 30 minutos: se perdió el intento que dejaste a medias');
  return true;
}
document.addEventListener('visibilitychange', () => (document.hidden ? stampRuns() : staleRuns()));
// Avatares 3D (10 nov 2026): los personajes que ya tienen modelo se cambian solos del dibujo 2D al busto 3D.
// Se cargan después de que el universo ya se ve (con sus 80 disfraces pesan y se peleaban con la carga de los planetas):
// mientras tanto va el dibujo 2D y luego se cambia con un fundido.
const loadAvatars = () => import('./avatar3d.js').then((m) => m.watchAvatars()).catch(() => {});
addEventListener('pagehide', stampRuns);

function boot() {
  staleRuns();
  // Reiniciar el perfil, salir del modo dev o volver al punto de partida cambian lo puesto: reverso, frente y fondo.
  applyLook();
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
  // Cuando el universo ya se acomodó (o en cuanto el teléfono descanse), los avatares 3D.
  setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(loadAvatars, { timeout: 1200 }) : loadAvatars()), 700);
})();

// Modo dev: botones de pruebas en el perfil, 8 toques seguidos al título (ver openProfile).
function toggleDev() {
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
}

// Para pruebas automáticas en modo dev: abrir un nivel por número (desde la consola).
window.devPlay = (g) => prefs.dev && startLevel(g, { free: true });
Object.defineProperty(window, 'devGame', { get: () => (prefs.dev ? game : null) });
Object.defineProperty(window, 'devMap', { get: () => (prefs.dev ? map : null) });

// 8 nov 2026: probando desde la Mac (npm start, puerto 5173) no hay service worker: se quita con su caché, porque
// el iPhone mezclaba archivos viejos y nuevos. Publicado, al llegar una versión nueva se recarga una vez para que
// todos los archivos sean de la misma.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  if (location.port === '5173') {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
    caches?.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
  } else {
    const had = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => had && !reloaded && ((reloaded = true), location.reload()));
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
