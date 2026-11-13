// Modo dev: probar niveles rápido sin jugarlos a mano.
// Se prende y apaga con los botones de pruebas de Ajustes (8 toques seguidos al título). Queda guardado en el navegador.
import { save, prefs, persist, backupOnce, restoreBackup, setDev, backupInfo } from './storage.js';
import { missions, missionDone, ACHIEVEMENTS, ACHIEVEMENT_TOP, achievementGot, achievementNeed, achievementsVisible } from './missions.js';
import { streakWin, streakLose, dailyStreak, nextGoal, col, daysToNextCol, ev, daysToNextEvent, evEnter, evWin, EVENT_PER_PLANET, EVENT_LEVELS, festival, festEnter, festWin, nextFestival, daysToNextFestival, daysToFestival, festShape, isOn, UNLOCK } from './events.js';
import { TIERS, generateLevel, hardHelp, festivalPick, festivalLevel, eventLevel, eventGroup, EVENT_WORLDS, packGroups, worldInfo, specials, specialGroup, SPECIAL_ID, TOTAL_LEVELS, LEVELS_PER_WORLD, MECH_NAMES, MECHANICS, MECH_INTRO, SCROLL_FROM, EXTRA, extraDebut, tideFirst, holeFirst, doorsFirst, bandaFirst, rocksFirst } from './levels.js';
import { playCasual, solve, initState } from './engine.js';
import { openModal, toast, updateCoins, popGoal } from './ui.js';
import { mulberry32 } from './rng.js';
import { icon, miniPlanet } from './art.js';
import { tableHTML, BIOMES, biomeKey } from './biomes.js';
import { peek } from './galaxy.js';
import { EVENTS, COLLECTIONS, FESTIVALS, festivalDays } from './events.js';
import { ITEMS, SECTIONS, owns, lockedUntil } from './shop.js';
import { PASS_MAX, SECRET_MAX, secretGoal, passGoal, passPrize, secretPrize, passCount, secretCount } from './passport.js';
import { meteor, nextShowers, metItems, MET_FROM, STAR_FROM, metPrizes } from './meteor.js';
import { BET_STEPS, maxBet } from './economy.js';
import { KINDS, TREASURE, makeLot, makeCode, rewardName, lotText, usedHere, lotNonces } from './codes.js';
// Darte los exclusivos del pasaporte (kind 'pase') o de los secretos ('secreto'), sin cobrar sus premios.
function passGive(kind) {
  const list = SECTIONS.flatMap(({ k: sec }) => ITEMS[sec].filter((it) => it[kind]).map((it) => `${sec}:${it.k}`));
  list.forEach((key) => (save.owned[key] = 1));
  persist();
  toast(`Ya tienes los ${list.length} exclusivos ${kind === 'pase' ? 'del pasaporte' : 'de secretos'}`);
}
const GIFT_KIND_DEV = { avatar: 'Disfraz', ring: 'Marco', title: 'Título', back: 'Reverso', face: 'Caras', traveler: 'Viajero', space: 'Fondo', frame: 'Postal' };
// Icono de cada sección de la tienda (para el recuento).
const SEC_ICO = { avatar: 'disfraz', ring: 'star', title: 'crown', back: 'deck', face: 'face', traveler: 'rocket', space: 'planet', frame: 'album' };

export const dev = {
  get on() {
    return !!prefs.dev;
  },
  get infinite() {
    return !!prefs.devInfinite;
  },
};

// Dónde estaba la galería, para volver a la misma página y filtros al salir de un nivel.
// src: camino · mes (evento del mes) · dia (festividades; fi = 'reserva' para los 1,000 especiales). help (filtro Dificultad): '' todos, '0' normales, 'any' duros, 'n' escalón n (TIERS).
export const gallery = { start: 0, tpl: 'todas', boss: false, mA: '', mB: '', help: '', active: false, src: 'camino', month: null, fi: null, year: null, grp: null };

const label = (g) => (g >= SPECIAL_ID ? `Especial ${g - SPECIAL_ID + 1} · grupo ${specialGroup(g - SPECIAL_ID) + 1}` : `Mundo ${Math.floor(g / LEVELS_PER_WORLD) + 1} · Nivel ${(g % LEVELS_PER_WORLD) + 1}`);

function askLevel(current) {
  const v = prompt(`Ir a nivel (1-${TOTAL_LEVELS}). También vale "mundo-nivel", ej. 12-3`, String(current + 1));
  if (!v) return null;
  const m = v.match(/^(\d+)\s*-\s*(\d+)$/);
  const g = m ? (+m[1] - 1) * LEVELS_PER_WORLD + (+m[2] - 1) : +v - 1;
  return Number.isInteger(g) && g >= 0 && g < TOTAL_LEVELS ? g : null;
}

export function casualRate(level, tries = 60) {
  const r = mulberry32(level.g + 1);
  let w = 0;
  for (let i = 0; i < tries; i++) w += playCasual(level, r);
  return Math.round((w / tries) * 100);
}

// ---------- Barra dentro de la partida ----------
// Iconos de la barra dev (trazo blanco, para que se lean sobre la mesa).
const DSV = (d) => `<svg class="db-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const DI = {
  grid: DSV('<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>'),
  prev: DSV('<path d="M15 5l-7 7 7 7"/>'),
  next: DSV('<path d="M9 5l7 7-7 7"/>'),
  eye: DSV('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
  flag: DSV('<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>'),
  step: DSV('<path d="M6 5l9 7-9 7z"/><path d="M18.5 5v14"/>'),
  play: DSV('<path d="M7 4.5l12 7.5-12 7.5z"/>'),
  trophy: DSV('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v3M8 20h8"/>'),
  info: DSV('<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.1"/>'),
};
export function attachDevBar(game, { go, toGallery }) {
  const g = game.level.g;
  const bar = document.createElement('div');
  bar.className = 'dev-bar';
  // Botón DEV flotante (siempre a la vista, no quita lugar al tablero) que abre el menú como uno de hamburguesa.
  // Tres grupos: ir (galería y niveles), probar (ver, solución, paso, resolver, ganar) e Info. Iconos de trazo, sin emojis.
  const L = game.level;
  // Evento o festividad (traen k): su número dentro del evento; especial suelto; si no, mundo y nivel.
  const set = L.k != null, num = set ? L.k + 1 : g + 1;
  const where = set ? (L.special != null ? 'festividad' : 'evento del mes') : L.special != null ? `Especial ${L.special + 1}` : `M${Math.floor(g / LEVELS_PER_WORLD) + 1} · N${(g % LEVELS_PER_WORLD) + 1}`;
  const btn = (d, ico, txt, extra = '') => `<button data-d="${d}" ${extra}>${DI[ico]}${txt ? `<span>${txt}</span>` : ''}</button>`;
  bar.innerHTML = `
    <button class="db-fab" data-d="menu" aria-label="Menú dev" aria-expanded="false">DEV</button>
    <div class="db-menu">
    <div class="db-grp">${btn('gal', 'grid', 'Galería')}</div>
    <div class="db-grp db-nav">${btn('prev', 'prev', '', `aria-label="Nivel anterior" ${g === 0 ? 'disabled' : ''}`)}<button data-d="goto" class="db-lvl" title="Ir a nivel"><b>#${num}</b><small>${where}${L.tier ? ` · ${TIERS[L.tier].name.toLowerCase()}` : ''}</small></button>${btn('next', 'next', '', `aria-label="Nivel siguiente" ${g >= TOTAL_LEVELS - 1 ? 'disabled' : ''}`)}</div>
    <div class="db-grp">${btn('reveal', 'eye', 'Ver todo')}${btn('sol', 'flag', 'Solución')}${btn('step', 'step', 'Paso')}${btn('auto', 'play', 'Resolver')}${btn('win', 'trophy', 'Ganar')}${btn('streak', 'next', 'Premio de racha')}${btn('broom', 'next', 'A 1 de la escoba')}</div>
    <div class="db-grp">${btn('info', 'info', 'Info')}</div>
    </div>`;
  const open = (on) => {
    bar.classList.toggle('open', on);
    bar.querySelector('.db-fab').setAttribute('aria-expanded', on);
  };
  // Tocar fuera lo cierra (lo de adentro lo deja abierto: Paso o Ver todo se usan varias veces seguidas).
  const outside = (e) => {
    if (!bar.isConnected) return document.removeEventListener('pointerdown', outside, true);
    if (!bar.contains(e.target)) open(false);
  };
  document.addEventListener('pointerdown', outside, true);
  let reveal = false;
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-d]');
    if (!b) return;
    const act = {
      menu: () => open(!bar.classList.contains('open')),
      gal: () => toGallery(),
      prev: () => go(g - 1),
      next: () => go(g + 1),
      goto: () => {
        const n = askLevel(g);
        if (n != null) go(n);
      },
      reveal: () => {
        reveal = !reveal;
        b.classList.toggle('on', reveal);
        game.devReveal(reveal);
      },
      sol: () => game.devSolution(),
      step: () => game.devStep(),
      auto: () => {
        b.classList.toggle('on', !game.autoplay);
        game.devAuto().then(() => b.classList.remove('on'));
      },
      win: () => game.devWin(),
      streak: () => game.devStreak(),
      broom: () => game.devBroom(),
      info: () => showInfo(game.level),
    };
    act[b.dataset.d]?.();
  });
  game.el.append(bar);
}

function showInfo(L) {
  const t0 = performance.now();
  let solution = null, w = 0;
  for (; w <= 3 && !solution; w++) solution = solve(L, initState(L), w ? 60000 : 250000, w);
  w--;
  const ms = Math.round(performance.now() - t0);
  const free = L.cards.filter((c) => !c.coveredBy.length).length;
  const rows = [
    ['Nivel', `#${L.g + 1} · ${label(L.g)}${L.boss ? ' · JEFE' : ''}`],
    ['Forma', `${tplName(L)} (${L.groups.length} grupo${L.groups.length > 1 ? 's' : ''})`],
    ['Dificultad d', L.d.toFixed(2)],
    ['Cartas tablero', `${L.cards.length} (${free} libres al inicio)`],
    ['Mazo', `${L.stock.length} = ${L.meta.chains - 1} inicios de cadena + ${L.meta.decoys} señuelos + ${L.meta.spares} sobrantes`],
    ['Mecánicas', L.meta.mechs.length ? L.meta.mechs.map((m) => MECH_NAMES[m]).join(', ') : 'ninguna'],
    ['Candados', L.meta.locks],
    ['Carta regalo', L.meta.pack ? `+${L.meta.pack} cartas al mazo` : 'no'],
    ...(L.tier ? [['Nivel duro', `${TIERS[L.tier].name} (bot meta ${TIERS[L.tier].aim}%) · 3★ si te quedan ${L.stars[1]} en el mazo, 2★ con ${L.stars[0]}`]] : []),
    ['Bot casual gana', ((p) => `${p}% · ${rateTag(L, p)}`)(casualRate(L))],
    ['Solucionador', solution ? `resuelve en ${solution.length} pasos${w ? ` con ${w} comodín${w > 1 ? 'es' : ''}` : ''} (${ms} ms)` : `no encontró (${ms} ms)`],
  ];
  openModal({
    title: 'Info del nivel',
    body: `<ul class="summary dev-info">${rows.map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('')}</ul>`,
    buttons: [{ label: 'Cerrar', cls: 'ghost' }],
  });
}

// ---------- Galería: muchos niveles de un vistazo ----------
const PAGE = 24;
// Tableros y piezas en el orden en que salen en el camino, con el nivel donde aparecen por primera vez
// (medido recorriendo los 5,200; si cambia el generador, volver a medir).
const TEMPLATES = [['pyramid', 1], ['peaks', 2], ['clusters', 3], ['star', 10], ['layers', 12], ['wall', 19], ['towers', 23], ['butterfly', 33], ['diamond', 34], ['spiral', 35], ['mesa', 40], ['heart', 42], ['gravedad', 70], ['scatter', 71], ['nebulosa', 100], ['invPyramid', 148], ['hourglass', 169]];
// Fase 7: piezas nuevas (solo salen en niveles sin ayudas) y respiros.
// Iconos chiquitos de las mesas especiales (para el recuento).
const SV = (b) => `<svg class="ico" viewBox="0 0 32 32" fill="none" stroke="#2a1f5c" stroke-width="2" stroke-linejoin="round">${b}</svg>`;
const TABLE_ICONS = {
  mesa: SV('<rect x="3" y="9" width="20" height="16" rx="3" fill="#3fa0a8"/><rect x="21" y="6" width="8" height="22" rx="4" fill="#6fc6cc"/><path d="M25 9v16" stroke-width="1.4"/>'),
  gravedad: SV('<rect x="4" y="3" width="10" height="26" rx="3" fill="#c9bff0"/><rect x="18" y="3" width="10" height="26" rx="3" fill="#c9bff0"/><rect x="5.5" y="17" width="7" height="10" rx="1.6" fill="#fff"/><rect x="19.5" y="17" width="7" height="10" rx="1.6" fill="#fff"/><path d="M9 7v6l-2-2M9 13l2-2M23 7v6l-2-2M23 13l2-2" stroke-width="1.6" stroke-linecap="round"/>'),
  nebulosa: SV('<circle cx="16" cy="16" r="13" fill="#8a5cf0"/><path d="M16 16c0-3 4-3 4 0s-3 6-7 5-6-5-4-9 8-6 12-3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'),
  // Mesas sobre un tablero normal (8 nov 2026: faltaban en el recuento y en los filtros).
  banda: SV('<rect x="3" y="11" width="26" height="11" rx="3" fill="#5d5a7a"/><rect x="9" y="8" width="6" height="9" rx="1.4" fill="#fff"/><rect x="17" y="8" width="6" height="9" rx="1.4" fill="#fff"/><rect x="1" y="7" width="5" height="18" rx="2" fill="#ffb066"/><rect x="26" y="7" width="5" height="18" rx="2" fill="#ffb066"/>'),
  puertas: SV('<rect x="5" y="4" width="22" height="25" rx="3" fill="#b5763f"/><path d="M16 4v25" stroke-width="1.6"/><circle cx="13" cy="17" r="1.6" fill="#2a1f5c"/><circle cx="19" cy="17" r="1.6" fill="#2a1f5c"/>'),
  hoyo: SV('<circle cx="16" cy="16" r="13" fill="#8a5cf0"/><circle cx="16" cy="16" r="9" fill="#ff8a3d"/><circle cx="16" cy="16" r="5.5" fill="#05030f"/>'),
  rocas: SV('<path d="M8 8l8-3 7 5 1 8-5 6-9 1-5-6z" fill="#a99bbd"/><circle cx="12" cy="13" r="2.4" fill="#7a6c94"/><circle cx="18" cy="18" r="1.8" fill="#7a6c94"/><path d="M25 5l3-2M27 10l3 0" stroke-width="1.8" stroke-linecap="round"/>'),
  marea: SV('<rect x="5" y="3" width="22" height="26" rx="3" fill="#fff6e6"/><path d="M5 18c4-3 7 3 11 0s7 3 11 0v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" fill="#4aa8de"/>'),
};
export const tableIcon = (t) => TABLE_ICONS[t] || '';
const SCROLL_NAMES = { mesa: 'mesa enrollada', gravedad: 'gravedad', nebulosa: 'nebulosa' };
// Mesas que van sobre un tablero normal (no son tira): se filtran por su bandera del nivel.
const OVERLAY_TABLES = [['marea', 'Marea', tideFirst() + 1, (L) => !!L.tide], ['hoyo', 'Agujero negro', holeFirst() + 1, (L) => !!L.hole], ['puertas', 'Puertas', doorsFirst() + 1, (L) => !!L.doors], ['banda', 'Banda transportadora', bandaFirst() + 1, (L) => !!L.belt], ['rocas', 'Asteroides', rocksFirst() + 1, (L) => !!L.rocks]];
const PIECES = [['steps', 3], ['cross', 3], ['crown', 8], ['rosette', 13], ['sandwich', 16], ['tiltFan', 21]];
// Nombres en español de formas y piezas (galería e Info).
const TPL_NAMES = { pyramid: 'Pirámide', peaks: 'Picos', clusters: 'Grupitos', star: 'Estrella', layers: 'Capas', wall: 'Muro', towers: 'Torres', butterfly: 'Mariposa', diamond: 'Diamante', spiral: 'Espiral', mesa: 'Mesa enrollada', heart: 'Corazón', gravedad: 'Gravedad', scatter: 'Dispersas', nebulosa: 'Nebulosa', invPyramid: 'Pirámide invertida', hourglass: 'Reloj de arena' };
const PIECE_NAMES = { steps: 'escalerita', cross: 'cruz', crown: 'corona', rosette: 'roseta', sandwich: 'sándwich', tiltFan: 'abanico inclinado' };
// Filtro de tablero, en grupos: formas, mesas especiales y piezas (cada una con el nivel donde sale primero).
const TPL_GROUPS = [
  ['Formas', [...TEMPLATES.filter(([t]) => !SCROLL_NAMES[t]).map(([t, n]) => [t, `${TPL_NAMES[t]} · ${n}`]), ['respiros', 'Respiros · 12']]],
  ['Mesas especiales', [...TEMPLATES.filter(([t]) => SCROLL_NAMES[t]).map(([t, n]) => [t, `${TPL_NAMES[t]} · ${n}`]), ...OVERLAY_TABLES.map(([k, name, n]) => [`ov:${k}`, `${name} · ${n}`])]],
  ['Piezas', PIECES.map(([k, n]) => [`pz:${k}`, `${PIECE_NAMES[k]} · ${n}`])],
];
// Cartas en el orden en que salen (nivel de estreno: el primero de su mundo; cometa y turbo, el primero normal).
const mechDebut = (m) => (EXTRA.includes(m) ? extraDebut(m) : MECH_INTRO[m] * LEVELS_PER_WORLD) + 1;
const MECH_ORDER = MECHANICS.slice().sort((a, b) => mechDebut(a) - mechDebut(b));
const okTpl = (L, t) => t === 'todas' || (t === 'respiros' ? !!L.respite : t.startsWith('pz:') ? !!L.pieces?.includes(t.slice(3)) : t.startsWith('ov:') ? OVERLAY_TABLES.find(([k]) => k === t.slice(3))[3](L) : L.template === t);
const tplName = (L) => (TPL_NAMES[L.template] || L.template) + (L.pieces ? ` + ${L.pieces.map((k) => PIECE_NAMES[k] || k).join(', ')}` : '');
// Etiqueta según el % del bot casual: fácil ≥75, medio ≥50, difícil ≥25, muy difícil ≥14, extremo ≥6 y demasiado
// extremo (los niveles duros del camino buscan 18, 10 y 3%, ver TIERS).
export const rateTag = (L, p) => (p >= 75 ? 'fácil' : p >= 50 ? 'medio' : p >= 25 ? 'difícil' : p >= 14 ? 'muy difícil' : p >= 6 ? 'extremo' : 'demasiado extremo');
// Color de la dificultad en la tarjeta (mismo corte que rateTag).
const rateCls = (L, p) => (p >= 75 ? 'r-easy' : p >= 50 ? 'r-mid' : p >= 25 ? 'r-hard' : 'r-max');

function preview(L, W = 150, H = 104) {
  const { u, bw, bh, offsets } = packGroups(L.groups, W - 8, H - 8, 0.7, 26);
  const ox = (W - bw * u) / 2;
  const oy = (H - bh * u) / 2;
  const hue = worldInfo(L.world).hue;
  return L.cards
    .map((c) => {
      const o = offsets[c.group];
      const cls = ['m', c.coveredBy.length ? '' : 'free', c.lock != null ? 'lock' : '', c.key != null ? 'key' : '', c.pack ? 'pack' : '', c.ice ? 'ice' : '', c.bomb ? 'bomb' : '', c.live ? 'live' : '', c.comet ? 'comet' : '', c.turbo ? 'turbo' : '', c.alt != null ? 'alt' : '', c.half != null ? 'ticket' : '', c.arrow ? 'arrow' : '', c.curtain != null ? 'curtain' : ''].join(' ');
      return `<i class="${cls}" style="left:${ox + (o.x + c.x) * u}px;top:${oy + (o.y + c.y) * u}px;width:${u}px;height:${u * 1.4}px;rotate:${c.rot}deg;z-index:${c.z};--hue:${hue}"></i>`;
    })
    .join('');
}

const MONTHS_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
// Grupos de mundos del evento y las festividades (sus niveles cambian según las cartas que ya conoce el jugador).
const GRP_NAMES = EVENT_WORLDS.map((w, i) => (i ? `Mundos ${w + 1}${EVENT_WORLDS[i + 1] ? `-${EVENT_WORLDS[i + 1]}` : ' en adelante'}` : `Mundos 1-${EVENT_WORLDS[1]}`));

export function galleryScreen({ onPlay, onPlayLevel, onBack }) {
  const st = gallery;
  const now = new Date().getFullYear();
  const evs = Object.entries(EVENTS).filter(([, e]) => e.ready).map(([m, e]) => [+m, e]).sort((a, b) => a[0] - b[0]);
  st.year ??= now;
  st.grp ??= eventGroup(save.open || 0);
  st.month ??= (evs.find(([m]) => m >= new Date().getMonth()) || evs[0])[0];
  const festDays = () => festivalDays(st.year, true);
  st.fi ??= festDays()[0]?.f.key || 'reserva';
  const el = document.createElement('div');
  el.className = 'screen gallery';
  const SRCS = [['camino', 'Camino'], ['mes', 'Del mes'], ['dia', 'De un día']];
  const hardN = [...Array(TOTAL_LEVELS).keys()].filter((g) => hardHelp(g)).length;
  const fmt = (n) => n.toLocaleString('es-MX');
  const opt = (v, t, cur) => `<option value="${v}"${String(cur) === String(v) ? ' selected' : ''}>${t}</option>`;
  const pick = (k, title, opts, on = false) => `<label class="${on ? 'on' : ''}"><small>${title}</small><select data-g="${k}">${opts}</select></label>`;
  // Qué festividad usa cada especial en el año elegido (todos los grupos de mundos).
  const usesOf = () => {
    const out = {};
    for (const { f, day } of festDays()) {
      const { N, L } = festShape(f);
      for (const w of EVENT_WORLDS) for (let k = 0; k < L; k++) (out[festivalPick(day, k, w, N)] ??= new Map()).set(f.key, f);
    }
    return out;
  };
  let useBy = usesOf();

  // Lo que se recorre. Camino y reserva: por páginas (ids). Mes y día: la lista completa, por planeta.
  const paged = () => st.src === 'camino' || (st.src === 'dia' && st.fi === 'reserva');
  function eventSet() {
    if (st.src === 'mes') {
      const e = EVENTS[st.month];
      return { look: { ico: e.ico, table: e.key }, planets: e.planets, levels: [...Array(EVENT_LEVELS).keys()].map((k) => eventLevel(st.year * 12 + st.month, k, EVENT_WORLDS[st.grp])) };
    }
    const x = festDays().find((o) => o.f.key === st.fi);
    if (!x) return { look: {}, planets: [], levels: [] };
    const { N, L } = festShape(x.f);
    return { look: { ico: x.f.ico, table: x.f.key }, planets: x.f.planets || [], levels: [...Array(L).keys()].map((k) => festivalLevel(x.day, k, EVENT_WORLDS[st.grp], N)), day: x.day };
  }
  // Niveles duros por escalón (L.tier; ver TIERS).
  const hv = (L) => L.tier || 0;
  const okH = (L) => !st.help || (st.help === '0' ? !hv(L) : st.help === 'any' ? !!hv(L) : hv(L) === +st.help);
  const okM = (L, m) => !m || (m === 'none' ? !L.meta.mechs.length : L.meta.mechs.includes(m));
  const ok = (L) => okTpl(L, st.tpl) && okM(L, st.mA) && okM(L, st.mB) && okH(L) && (!st.boss || L.boss);

  function controls() {
    const evText = st.src === 'mes' ? 'La forma de cada tablero es la misma todos los años; con el año solo cambian los números de las cartas.' : '';
    const what = {
      camino: `Los ${fmt(TOTAL_LEVELS)} niveles del mapa, en orden (${fmt(hardN)} duros: muy difícil, extremo y demasiado extremo; se ganan sin ayudas con el camino acertado). No cambian con el año.`,
      mes: `Los ${EVENT_LEVELS} niveles del evento, por planeta. ${evText}`,
      dia: st.fi === 'reserva'
        ? `Los 1,000 tableros especiales, fuera del mapa. Las festividades toman de aquí los suyos (los niveles muy difíciles y el jefe extremo); la etiqueta dice cuál lo usa en ${st.year}. Los difíciles y los demasiado extremos quedan para eventos futuros.`
        : `Sus niveles, por planeta. Cada año le tocan otros tableros (se eligen por la fecha) y cambian con el grupo de mundos.`,
    }[st.src];
    const years = [...Array(6).keys()].map((i) => now - 1 + i);
    const source = st.src === 'mes'
      ? pick('month', 'Evento', evs.map(([m, e]) => opt(m, `${e.name} · ${MONTHS_C[m]}`, st.month)).join('')) + pick('year', 'Año', years.map((y) => opt(y, y, st.year)).join('')) + pick('grp', 'Jugador en', GRP_NAMES.map((n, i) => opt(i, n, st.grp)).join(''))
      : st.src === 'dia'
        ? pick('fi', 'Festividad', festDays().map(({ f, day }) => { const d = new Date(day * 864e5); return opt(f.key, `${f.name} · ${d.getUTCDate()} ${MONTHS_C[d.getUTCMonth()]}`, st.fi); }).join('') + opt('reserva', 'Reserva: los 1,000 especiales', st.fi)) + pick('year', 'Año', years.map((y) => opt(y, y, st.year)).join('')) + (st.fi === 'reserva' ? '' : pick('grp', 'Jugador en', GRP_NAMES.map((n, i) => opt(i, n, st.grp)).join('')))
        : '';
    // Escalones de los niveles duros (ver TIERS): camino 2-4, evento 1-3, especiales 1-4.
    const tiers = st.src === 'camino' ? [2, 3, 4] : st.src === 'mes' ? [1, 2, 3] : [1, 2, 3, 4];
    const helps = [['', 'Todos'], ['0', 'Normales'], ['any', 'Duros'], ...tiers.map((i) => [String(i), TIERS[i].name])];
    const dirty = st.tpl !== 'todas' || st.mA || st.mB || st.boss || st.help;
    el.querySelector('.g-filters').innerHTML = `
      <div class="g-seg">${SRCS.map(([k, t]) => `<button data-src="${k}" class="${st.src === k ? 'on' : ''}">${t}</button>`).join('')}</div>
      ${source ? `<div class="g-pick g-source">${source}</div>` : ''}
      <p class="g-what">${what}</p>
      <div class="g-pick">
        ${pick('tpl', 'Tablero', opt('todas', 'Todos', st.tpl) + TPL_GROUPS.map(([h, list]) => `<optgroup label="${h}">${list.map(([k, t]) => opt(k, t, st.tpl)).join('')}</optgroup>`).join(''), st.tpl !== 'todas')}
        ${pick('mA', 'Carta especial', opt('', 'Todas', st.mA) + opt('none', 'Sin cartas especiales', st.mA) + MECH_ORDER.map((m) => opt(m, `${MECH_NAMES[m]} · ${mechDebut(m)}`, st.mA)).join(''), !!st.mA)}
        ${st.mA && st.mA !== 'none' ? pick('mB', 'Junto con', opt('', 'Cualquiera', st.mB) + MECH_ORDER.filter((m) => m !== st.mA).map((m) => opt(m, MECH_NAMES[m], st.mB)).join(''), !!st.mB) : ''}
        ${pick('help', 'Dificultad', helps.map(([k, t]) => opt(k, t, st.help)).join(''), !!st.help)}
        <button class="g-boss${st.boss ? ' on' : ''}" data-g="boss" aria-pressed="${st.boss}">${icon('crown')}Solo jefes</button>
        ${dirty ? '<button class="g-clear" data-g="clear">Limpiar</button>' : ''}
      </div>`;
  }
  el.innerHTML = `
    <header class="top">
      <button class="icon-btn" data-g="back" aria-label="Volver">${icon('close')}</button>
      <b>Galería de niveles</b>
      <button class="g-jump" data-g="goto" title="Ir a un nivel del camino">${icon('next')}<span>Ir a…</span></button>
    </header>
    <div class="g-filters"></div>
    <div class="g-grid"></div>
    <nav class="g-pager"><button data-g="prev" aria-label="Anteriores">${icon('prev')}</button><span class="g-range"></span><button data-g="next" aria-label="Siguientes">${icon('next')}</button></nav>`;
  const grid = el.querySelector('.g-grid');

  // Tarjeta: el tablero grande con su número y lo que lo distingue encima; abajo forma, cartas y dificultad.
  // pickI: índice en la lista del mes/día (se juega el tablero tal cual); si no, el id del nivel.
  const tile = (L, pickI) => {
    const badges = [L.boss && `<i class="gb gb-boss">${icon('crown')}Jefe</i>`, L.tier && `<i class="gb gb-tier gb-t${L.tier}">${TIERS[L.tier].name}</i>`, L.respite && '<i class="gb gb-rest">Respiro</i>', L.scroll && `<i class="gb gb-mesa">${tableIcon(L.scroll)}${TPL_NAMES[L.scroll]}</i>`, L.tide && `<i class="gb gb-mesa">${tableIcon('marea')}Marea</i>`].filter(Boolean).join('');
    const inSet = pickI != null;
    const uses = !inSet && L.special != null ? [...(useBy[L.special]?.values() || [])] : [];
    const num = inSet ? L.k + 1 : L.special != null ? L.special + 1 : L.g + 1;
    const where = inSet ? `Nivel ${L.k + 1}${L.special != null ? ` · especial ${L.special + 1}` : ''}` : L.special != null ? `Especial ${L.special + 1} · grupo ${specialGroup(L.special) + 1}` : `Mundo ${Math.floor(L.g / LEVELS_PER_WORLD) + 1} · nivel ${(L.g % LEVELS_PER_WORLD) + 1}`;
    return `<button class="tile" ${inSet ? `data-pick="${pickI}"` : `data-play="${L.g}"`}>
      <div class="g-pv"><div class="pv">${preview(L)}</div><b class="g-num">${num}</b><div class="g-badges">${badges}</div></div>
      <div class="g-where">${where}</div>
      <div class="g-shape">${tplName(L)}</div>
      <div class="g-stats"><span>${L.cards.length} cartas</span><span>mazo ${L.stock.length}</span><span>d ${L.d.toFixed(2)}</span></div>
      ${uses.length ? `<div class="g-uses">${uses.map((f) => `<i title="${f.name}">${icon(f.ico)}${f.name}</i>`).join('')}</div>` : ''}
      <div class="g-mechs">${L.meta.mechs.map((m) => `<i class="tag m-${m}">${MECH_NAMES[m]}</i>`).join('')}</div>
      <div class="g-rate" data-rate="${inSet ? `p${pickI}` : L.g}"><i></i><span>bot …</span></div>
    </button>`;
  };
  let set = null; // lo del mes o día que se está viendo
  function render() {
    controls();
    const pager = el.querySelector('.g-pager');
    let items = [], html = '';
    if (paged()) {
      const specialPool = st.src === 'dia';
      const end = specialPool ? 1000 : TOTAL_LEVELS;
      let g = st.start;
      while (items.length < PAGE && g < end) {
        const id = specialPool ? SPECIAL_ID + g : g;
        if (specialPool || !st.boss || id % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1) {
          const L = generateLevel(id);
          if (ok(L)) items.push({ L, key: L.g });
        }
        g++;
        if (g - st.start > 4000) break; // filtros muy estrictos: no colgar la página
      }
      st.end = g;
      pager.hidden = false;
      el.querySelector('.g-range').textContent = specialPool ? `Especiales ${st.start + 1} – ${g}` : `Niveles ${st.start + 1} – ${g}`;
      el.querySelector('[data-g="prev"]').disabled = st.start <= 0;
      el.querySelector('[data-g="next"]').disabled = g >= end;
      html = items.map(({ L }) => tile(L)).join('');
    } else {
      set = eventSet();
      pager.hidden = true;
      const per = set.levels.length / Math.max(1, set.planets.length || 1);
      const byPlanet = {};
      set.levels.forEach((L, i) => ok(L) && (byPlanet[L.planet ?? Math.floor(i / per)] ??= []).push(i));
      for (const [p, list] of Object.entries(byPlanet)) {
        html += `<h3 class="g-planet">${icon(set.look.ico || 'planet')}Planeta ${+p + 1}${set.planets[p] ? ` · ${set.planets[p]}` : ''}</h3>`;
        html += list.map((i) => tile(set.levels[i], i)).join('');
        items.push(...list.map((i) => ({ L: set.levels[i], key: `p${i}` })));
      }
    }
    grid.innerHTML = items.length ? html : '<p class="g-empty">No hay niveles con estos filtros por aquí. Prueba con los siguientes o limpia los filtros.</p>';
    // El % del bot se calcula después, para no bloquear el dibujo.
    let i = 0;
    const next = () => {
      const it = items[i++];
      if (!it || !el.isConnected) return;
      const box = grid.querySelector(`[data-rate="${it.key}"]`);
      if (box) {
        const p = casualRate(it.L, 40);
        box.className = `g-rate ${rateCls(it.L, p)}`;
        box.querySelector('i').style.width = `${p}%`;
        box.querySelector('span').textContent = `bot ${p}% · ${rateTag(it.L, p)}`;
      }
      setTimeout(next, 0);
    };
    setTimeout(next, 30); // tras montar la pantalla
    const y = st.scroll || 0;
    st.scroll = 0;
    requestAnimationFrame(() => (grid.scrollTop = y));
  }

  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-play]');
    if (t) {
      st.active = true;
      st.scroll = grid.scrollTop;
      return onPlay(+t.dataset.play);
    }
    const pk = e.target.closest('[data-pick]');
    if (pk) {
      st.active = true;
      st.scroll = grid.scrollTop;
      const L = set.levels[+pk.dataset.pick];
      return onPlayLevel(L, { ...set.look, boss: !!L.boss });
    }
    const src = e.target.closest('[data-src]')?.dataset.src;
    if (src) {
      st.src = src;
      st.start = 0;
      // Cada fuente tiene sus escalones (camino 2-4, mes 1-3, día 1-4): si el elegido no existe ahí, se quita.
      if ((st.help === '1' && src === 'camino') || (st.help === '4' && src === 'mes')) st.help = '';
      return render();
    }
    const a = e.target.closest('[data-g]')?.dataset.g;
    if (a === 'back') {
      st.active = false;
      return onBack();
    }
    if (a === 'boss') {
      st.boss = !st.boss;
      st.start = 0;
      render();
    }
    if (a === 'clear') {
      st.boss = false;
      st.tpl = 'todas';
      st.mA = st.mB = st.help = '';
      st.start = 0;
      render();
    }
    if (a === 'prev') {
      st.start = Math.max(0, st.start - PAGE);
      render();
    }
    if (a === 'next') {
      st.start = st.end;
      render();
    }
    if (a === 'goto') {
      const n = askLevel(st.start);
      if (n != null) {
        st.src = 'camino';
        st.start = n;
        render();
      }
    }
  });
  el.addEventListener('change', (e) => {
    const k = e.target.dataset.g, v = e.target.value;
    if (k === 'tpl' || k === 'mB' || k === 'help' || k === 'fi') st[k] = v;
    if (k === 'mA') {
      st.mA = v;
      if (!v || v === 'none' || st.mB === v) st.mB = '';
    }
    if (k === 'month' || k === 'grp') st[k] = +v;
    if (k === 'year') {
      st.year = +v;
      useBy = usesOf();
      if (st.fi !== 'reserva' && !festDays().some((o) => o.f.key === st.fi)) st.fi = festDays()[0]?.f.key || 'reserva';
    }
    st.start = 0;
    render();
  });
  render();
  return el;
}

// ---------- Galería de planetas: cada tipo de planeta con su mesa ----------
// Tocar el planeta lo abre en el mapa (con colores aunque esté cerrado); tocar la mesa juega su primer nivel.
export const planetGal = { active: false, scroll: 0 };
export function planetsScreen({ onWorld, onPlay, onBack }) {
  const el = document.createElement('div');
  el.className = 'screen gallery';
  el.innerHTML = `
    <header class="top">
      <button class="icon-btn" data-g="back" aria-label="Volver">${icon('close')}</button>
      <b>Planetas dev</b>
      <span></span>
    </header>
    <div class="g-grid">${firstWorlds().map(([place, w]) => `<div class="tile ptile">
      <button class="pt-table" data-mesa="${w}" style="--k:.42;--sl:0px;--sr:0px;--st:0px;--sb:0px">${tableHTML(w)}<span class="pt-pl" data-world="${w}">${miniPlanet(BIOMES[biomeKey(place)].emblem)}</span></button>
      <div class="tl"><b>${place}</b> · mundo ${w + 1}</div>
      <div class="pt-btns"><button data-world="${w}">Planeta</button><button data-mesa="${w}">Mesa</button></div>
    </div>`).join('')}</div>`;
  const grid = el.querySelector('.g-grid');
  requestAnimationFrame(() => (grid.scrollTop = planetGal.scroll));
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-world], [data-mesa], [data-g]');
    if (!t) return;
    planetGal.scroll = grid.scrollTop;
    if (t.dataset.g === 'back') return (planetGal.active = false), onBack();
    planetGal.active = true;
    if (t.dataset.world != null) return (peek.on = true), onWorld(+t.dataset.world);
    onPlay(+t.dataset.mesa * LEVELS_PER_WORLD);
  });
  return el;
}

// ---------- Menú dev (desde el mapa) ----------
// Botones chicos en dos columnas (solo son de prueba). Todo se hace sobre la copia del modo dev:
// al salir del modo dev tu partida vuelve como estaba.
const REGION = 10;
// Días que hay que mover el reloj (del modo dev) para caer en el 1 del mes m: este año, o el que sigue si ya pasó.
function daysToMonth(m) {
  const d = new Date(Date.now() + (save.devDay || 0) * 864e5), day0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const t = new Date(d.getFullYear() + (m < d.getMonth() ? 1 : 0), m, 1);
  return Math.round((t - day0) / 864e5);
}
// Primer mundo de cada lugar (Bosque, Isla…), en el orden en que salen.
function firstWorlds() {
  const seen = new Map();
  for (let w = 0; w < TOTAL_LEVELS / LEVELS_PER_WORLD; w++) { const { place } = worldInfo(w); if (!seen.has(place)) seen.set(place, w); }
  return [...seen];
}
function completeWorlds(from, to) {
  for (let w = from; w <= to; w++) for (let l = 0; l < LEVELS_PER_WORLD; l++) save.stars[w * LEVELS_PER_WORLD + l] = 3;
  save.next = Math.max(save.next, Math.min(TOTAL_LEVELS - 1, (to + 1) * LEVELS_PER_WORLD));
  save.open = Math.max(save.open, Math.min(Math.floor(save.next / LEVELS_PER_WORLD), to + 1));
  save.run = null;
  persist();
}
// Apuesta: el primer nivel (índice, como save.next) donde se abre cada ×N.
const BET_AT = BET_STEPS.slice(1).map((m) => { let g = 0; while (g < TOTAL_LEVELS && maxBet(g) < m) g += LEVELS_PER_WORLD; return [m, g]; });
// Deja el camino justo en el nivel g (sin ganar): si vas antes, gana con 3★ lo de en medio; si vas después, borra
// lo ganado desde ahí. Vuelven a salir la presentación de ese ×N (en el ×2 la de "¡Nuevo!") y su partida gratis.
function goToLevel(g, betBefore) {
  if (save.next < g) completeWorlds(Math.floor(save.next / LEVELS_PER_WORLD), g / LEVELS_PER_WORLD - 1);
  for (let k = g; k < TOTAL_LEVELS; k++) delete save.stars[k];
  save.next = g;
  save.open = Math.floor(g / LEVELS_PER_WORLD);
  save.run = null;
  const intro = (save.intro ||= {});
  for (const m of BET_STEPS) intro[`apuesta${m}`] = m <= betBefore || undefined;
  if (betBefore < 2) delete intro.apuesta;
  else intro.apuesta = true;
  save.betFreeN = betBefore;
  delete save.betFree;
  delete save.betGift;
  persist();
}
// card: dibuja la carta de una mecánica (mechCard de main.js) para el recuento.
// Para ver el festejo de la portada (10 nov 2026): cumple una cosa de verdad y al cerrar el menú se cobra y se festeja.
// Devuelve lo que falta abrir (texto) si todavía no se puede.
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
function devMisOne() {
  if (!isOn('mis')) return `misiones (nivel ${UNLOCK.mis + 1})`;
  const x = pickOne(missions().list.filter((m) => !missionDone(m)));
  if (x) x.n = x.goal;
  return '';
}
function devAchievementOne() {
  if (!isOn('logros')) return `logros (nivel ${UNLOCK.logros + 1})`;
  const l = pickOne(achievementsVisible().filter((x) => achievementGot(x) < ACHIEVEMENT_TOP));
  if (!l) return '';
  const st = (save.stats ||= {}), k = l.best ? `${l.k}Best` : l.k;
  st[k] = Math.max(st[k] || 0, achievementNeed(l));
  return '';
}
function devStreakNext() {
  if (!isOn('racha')) return `racha (nivel ${UNLOCK.racha + 1})`;
  const g = nextGoal();
  while (dailyStreak().n < g.n) streakWin(Math.min(3, g.n - dailyStreak().n));
  return '';
}
// Regalo diario en pruebas: toca reclamar el día `day` (0-27) y la última vez fue hace `ago` días.
function devDaily(day, ago, onRefresh) {
  save.daily = { ...save.daily, day, last: new Date(Date.now() - ago * 864e5).toDateString() };
  persist();
  onRefresh();
  toast(ago > 1 ? 'Faltaste un día: abre el regalo diario' : `Abre el regalo diario: toca el día ${(day % 7) + 1}`);
}
const devDo = (fns, onRefresh) => {
  const no = fns.map((f) => f()).filter(Boolean);
  persist();
  if (no.length) toast(`Aún no se abren: ${no.join(', ')}`);
  onRefresh();
};
export function openDevMenu({ onGallery, onPlanets, onFestivals, onGoLevel, onRefresh, onRescue, card }) {
  const w = Math.min(Math.floor(save.next / LEVELS_PER_WORLD), save.open);
  const r = Math.floor(w / REGION);
  const evNow = ev(), colNow = col();
  const evSet = (patch) => { Object.assign(ev().state, { run: null, tk: 1, at: 0, ...patch }); persist(); onRefresh(); };
  // fiNext: la siguiente fiesta que no es la de hoy ni la de mañana (para brincar al día antes de ella).
  const metNow = meteor(), metOn = metNow?.K.kind === 'met', starOn = metNow?.K.kind === 'star';
  const DAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const when = (x) => { const d = new Date(x.at); return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} · ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
  // Cuánto falta para una lluvia (con el reloj del modo dev, si se movió de día).
  const until = (x) => {
    const ms = x.at - (Date.now() + (save.devDay || 0) * 864e5);
    if (ms <= 0) return 'cayendo ahora';
    const m = Math.ceil(ms / 6e4), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60);
    return `en ${d ? `${d} d ` : ''}${d || h ? `${h} h ` : ''}${m % 60} min`;
  };
  const festNow = festival(), festNext = nextFestival(festNow?.soon ? festNow.inDays : 0), festOn = festNow && !festNow.soon;
  const { N: FN, L: FL } = festShape(festNow);
  const festSet = (patch) => { Object.assign(festival().state, { run: null, ...patch }); persist(); onRefresh(); };
  // Deja la cuenta a 1 del premio: el siguiente globo (jefe) o burbuja (cofre) que truene lo da.
  const popTxt = (k) => { const p = save.pops?.[k] || { n: 0, lvl: 0 }; return `${k}s ${p.n} de ${popGoal(k, p.lvl)}`; };
  const popNear = (k) => { const p = ((save.pops ||= {})[k] ||= { n: 0, lvl: 0 }); p.n = popGoal(k, p.lvl) - 1; persist(); onRefresh(); };
  const toDay = (d) => ((save.devDay = (save.devDay || 0) + d), persist(), onRefresh());
  // Gana uno por uno los niveles que faltan antes del último jefe: se cobran sus monedas y sus regalos (como si se jugaran).
  const winTo = (get, enter, win, last) => {
    let n = 0;
    while (get()?.state && get().state.k < last && enter()) {
      if (get().state.run) get().state.run.state = null;
      win();
      n++;
    }
    persist();
    toast(n ? `Ganaste ${n} nivel${n === 1 ? '' : 'es'}: sigue el último jefe` : 'Ya estás en el último jefe');
    onRefresh();
  };
  // Recuento: cuántos eventos hay de cada tipo (y cuáles) y cuántas cosas hay en la tienda según de dónde salen.
  const MONTHS_ABBR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const evs = Object.entries(EVENTS).filter(([, e]) => e.ready).sort((a, b) => a[0] - b[0]);
  const fis = FESTIVALS.filter((f) => f.ready), y = new Date().getFullYear();
  const origin = (it) => (!it.ev ? 'tienda' : it.code ? 'codigo' : it.met ? 'meteoro' : it.star ? 'estrellas' : it.logro ? 'logro' : it.pase ? 'pasaporte' : it.secreto ? 'secretos' : FESTIVALS.some((f) => f.key === it.ev) ? 'fiesta' : Object.values(EVENTS).some((e) => e.key === it.ev) ? 'mes' : 'col');
  const ORIGINS_DEV = [['tienda', 'De la tienda', 'bag'], ['col', 'Colecciones', 'concha'], ['mes', 'Evento del mes', 'planet'], ['fiesta', 'Festividades', 'flame'], ['codigo', 'Códigos de regalo', 'cofre'], ['meteoro', 'Lluvia de meteoritos', 'meteoro'], ['estrellas', 'Lluvia de estrellas', 'starFall'], ['logro', 'Logros', 'trophy'], ['pasaporte', 'Pasaporte', 'pasaporte'], ['secretos', 'Niveles secretos', 'starSecret']];
  const cnt = (sec, o) => ITEMS[sec].filter((it) => origin(it) === o).length;
  const mine = (sec, o) => ITEMS[sec].filter((it) => origin(it) === o && owns(sec, it.k)).length;
  const sum = (f) => SECTIONS.reduce((n, { k }) => n + f(k), 0);
  // Totales de la tienda: en verde las que tienes y en rojo las que te faltan.
  // Tienes (verde), faltan (rojo) y cuántas hay, cada una en su columna.
  const nums = (y, n) => `<td class="d-yes">${y}</td><td class="${n - y ? 'd-no' : ''}">${n - y || '–'}</td><td>${n}</td>`;
  const have = (n, of) => `<span class="d-yes" title="tienes">${n}</span>${of - n ? ` <span class="d-no" title="faltan">${of - n}</span>` : ''}`;
  // Desde qué nivel ganado se abre cada cosa, y si tú ya llegaste.
  const won = save.next || 0;
  const opens = (lvl) => (won >= lvl ? '' : `<span class="d-no" title="faltan ${lvl - won} niveles">${lvl - won}</span>`);
  // Los eventos de cada tipo (van dentro de su renglón, como acordeón): del mes por mes, colecciones, de un día por fecha.
  const festDay = (f) => f.date(y);
  const colsOf = (plus) => COLLECTIONS.filter((c) => (c.plus || 0) === plus).map((c) => [c.token, c.name, '']);
  const fisOf = (local, grp) => fis.filter((f) => !!f.local === local && (f.grp || 0) === (grp || 0)).sort((a, b) => festDay(a) - festDay(b)).map((f) => [f.ico, f.name, `${festDay(f).getDate()} ${MONTHS_ABBR[festDay(f).getMonth()]}${f.days > 1 ? ` · ${f.days} días` : ''}`, `f:${f.key}`]);
  // Todo lo que sale en el camino, en el orden en que aparece (nivel = el primero donde lo ves; los eventos se abren al ganar el anterior).
  const UN = [
    ['Racha cohete', UNLOCK.racha, 'rocket'],
    ['Misiones del día', UNLOCK.mis, 'misiones', null, '3 cada día (las de cartas especiales, cuando ya llegaste a su mundo). Se cambian a medianoche.'],
    ['Logros', UNLOCK.logros, 'trophy', null, 'Para siempre. Los de cartas especiales salen al llegar al mundo de su carta.'],
    // Las próximas lluvias del horario: iguales en todos los teléfonos, a la misma hora de cada uno.
    ['Lluvia de meteoritos', MET_FROM, 'meteoro', nextShowers(6).map((x) => ['meteoro', when(x), until(x), '']), '2 o 3 veces por semana, 30 minutos a cualquier hora, sin aviso. Es igual en todos los teléfonos.'],
    ['Lluvia de estrellas', STAR_FROM, 'starFall', nextShowers(6, true).map((x) => ['starFall', when(x), until(x), '']), '2 o 3 veces por semana, 15 minutos sin aviso, en días sin lluvia de meteoritos: monedas ×3 y hasta 3 premios (con sus 5 exclusivos). Igual en todos los teléfonos.'],
    ['Colecciones', UNLOCK.col, 'concha', colsOf(0), 'Se turnan: 2 semanas al mes (la del 1.er y la del 3.er lunes)'],
    ['Eventos del mes', UNLOCK.mes, 'planet', evs.map(([m, e]) => [e.ico, e.name, MONTHS_ABBR[m], `m:${m}`])],
    ['Colecciones nuevas y 3.ª semana', UNLOCK.col2, 'fosil', colsOf(true), 'Se suman a las de antes y se turnan: 3 semanas al mes'],
    ['Festividades de un día', UNLOCK.fiesta, 'pinata', fisOf(false)],
    ['Colecciones de Arte, Música y Cine', UNLOCK.col3, 'nota', colsOf(2), 'Se suman a las de antes y se turnan: todas las semanas'],
    ['Festividades de leyendas mexicanas', UNLOCK.fiesta2, 'catrina', fisOf(true)],
    ['Fiestas de México', UNLOCK.fiesta3, 'piramide', fisOf(false, 3)],
    ['Fiestas de América', UNLOCK.fiesta4, 'antifaz', fisOf(false, 4)],
  ];
  const KINDS = { ev: 'Evento', card: 'Carta', mesa: 'Mesa' };
  const rows = [
    ...UN.map(([name, l, ico, sub, note]) => ({ n: l + 1, k: 'ev', name, pic: icon(ico), sub, note })),
    ...MECH_ORDER.map((m) => ({ n: mechDebut(m), k: 'card', name: MECH_NAMES[m], pic: `<span class="dmc">${card(m)}</span>` })),
    ...Object.entries(SCROLL_FROM).map(([t, g]) => ({ n: g + 1, k: 'mesa', name: SCROLL_NAMES[t], pic: tableIcon(t) })),
    ...OVERLAY_TABLES.map(([k, name, n]) => ({ n, k: 'mesa', name: name.toLowerCase(), pic: tableIcon(k) })),
    ...BET_AT.map(([m, g], i) => ({ n: g + 1, k: 'ev', name: `Apuesta hasta ×${m}`, pic: `<i class="go-bet dbet b${m}">×${m}</i>`, note: `${i ? `Sale su presentación "¡Subiste a ×${m}!"` : 'Sale la presentación "¡Nuevo: Apuestas!" con sus reglas (antes del evento del mes)'}. Su primera partida va forzada a ×${m} y gratis; cuota ${10 * (m - 1)} monedas, en jefes ${{ 2: 200, 3: 400, 5: 800, 10: 1600 }[m]} (× el boleto de entrada); con lluvia de meteoritos, los boletos a mitad.` })),
  ].sort((a, b) => a.n - b.n || Object.keys(KINDS).indexOf(a.k) - Object.keys(KINDS).indexOf(b.k));
  // Choques: dos ventanas de desbloqueo (eventos) en el mismo nivel salen una tras otra. Se marcan en rojo.
  const evAt = {};
  for (const r of rows) if (r.k === 'ev') evAt[r.n] = (evAt[r.n] || 0) + 1;
  const clash = (r) => r.k === 'ev' && evAt[r.n] > 1;
  const clashes = Object.entries(evAt).filter(([, n]) => n > 1).map(([n]) => n);
  const subRow = (i) => ([ico, name, when, go]) => `<tr class="dsub" data-of="${i}" hidden><td></td><td class="dpic">${icon(ico)}</td><td class="dname">${name}</td><td colspan="2">${when}</td><td>${go ? `<button class="dgo" data-go="${go}" title="Mueve el reloj al día en que empieza">Ir</button>` : ''}</td></tr>`;
  const line = (r, i) => `<tr class="${r.sub || r.note ? 'dacc' : ''}${clash(r) ? ' dclash' : ''}"${r.sub || r.note ? ` data-acc="${i}"` : ''}${clash(r) ? ' title="Se abre en el mismo nivel que otra cosa: salen dos ventanas seguidas"' : ''}><td><i class="dkind k-${r.k}" title="${KINDS[r.k]}">${KINDS[r.k][0]}</i></td><td class="dpic">${r.pic}</td><td class="dname">${r.name}${r.sub ? ` <b class="dnum">${r.sub.length}</b>` : ''}${r.sub || r.note ? `<span class="dchev">${icon('chev')}</span>` : ''}</td><td>${r.n}</td><td>${Math.ceil(r.n / LEVELS_PER_WORLD)}</td><td>${opens(r.n - 1)}</td></tr>${r.note ? `<tr class="dsub dnote" data-of="${i}" hidden><td></td><td colspan="5">${r.note}</td></tr>` : ''}${(r.sub || []).map(subRow(i)).join('')}`;
  const lastNeed = Math.max(...Object.values(ITEMS).flat().map((it) => it.need || 0));
  const shopLocked = sum((k) => ITEMS[k].filter((it) => lockedUntil(k, it.k)).length);
  // Pasaporte y secretos (12 nov 2026): qué da cada sello y cada premio de secretos, si ya lo cobraste y si tienes su
  // exclusivo (los botones para dártelos están en Pruebas → Pasaporte y secretos).
  const itName = (it) => (it ? `${GIFT_KIND_DEV[it[0]] || it[0]} ${ITEMS[it[0]].find((x) => x.k === it[1])?.name || it[1]}` : '–');
  const ppRow = (n, goal, pr, got) => `<tr><td>${n}</td><td>${goal.toLocaleString('es-MX')}</td><td>${pr.coins.toLocaleString('es-MX')}</td><td class="dname">${itName(pr.item)}${pr.item && owns(pr.item[0], pr.item[1]) ? ' <span class="d-yes">✓</span>' : ''}</td><td>${got ? '<span class="d-yes">cobrado</span>' : ''}</td></tr>`;
  const passTable = `<p class="dline"><b>Pasaporte</b>: ${passCount().toLocaleString('es-MX')} niveles distintos · ${save.pass?.s || 0} de ${PASS_MAX} sellos</p>
    <table class="dtable"><tr><th>Sello</th><th>Niveles</th><th>Monedas</th><th>Exclusivo</th><th></th></tr>${Array.from({ length: PASS_MAX }, (_, i) => ppRow(i + 1, passGoal(i + 1), passPrize(i + 1), i < (save.pass?.s || 0))).join('')}</table>
    <p class="dline"><b>Secretos</b>: ${secretCount()} ganados · ${save.pass?.x || 0} de ${SECRET_MAX} premios</p>
    <table class="dtable"><tr><th>Premio</th><th>Secretos</th><th>Monedas</th><th>Exclusivo</th><th></th></tr>${Array.from({ length: SECRET_MAX }, (_, i) => ppRow(i + 1, secretGoal(i + 1), secretPrize(i + 1), i < (save.pass?.x || 0))).join('')}</table>`;
  const countHTML = `<p class="dline ${clashes.length ? 'd-no' : 'd-yes'}">${clashes.length ? `<b>Choque:</b> en el nivel ${clashes.join(', ')} se abren dos cosas a la vez (en rojo).` : 'Sin choques: cada ventana de desbloqueo sale en su propio nivel.'}</p><table class="dtable dorder"><tr><th></th><th></th><th>Qué</th><th>Nivel</th><th>Mundo</th><th>Tú</th></tr>${rows.map(line).join('')}</table>
    <p class="dline"><b>Tienda: tienes ${sum((k) => ITEMS[k].filter((it) => owns(k, it.k)).length)} de ${Object.values(ITEMS).flat().length}</b> (tuyas / que hay)</p>
    <table class="dtable dshop"><tr><th>De dónde sale</th><th>Tienes</th><th>Faltan</th><th>Hay</th></tr>${ORIGINS_DEV.map(([o, name, ico]) => { const n = sum((k) => cnt(k, o)), y = sum((k) => mine(k, o)); return !n ? '' : `<tr class="dshop-g dacc" data-acc="s${o}"><td class="dname">${icon(ico)}${name}<span class="dchev">${icon('chev')}</span></td>${nums(y, n)}</tr>${SECTIONS.filter(({ k }) => cnt(k, o)).map(({ k, name: sn }) => `<tr class="dsub" data-of="s${o}" hidden><td class="dname">${icon(SEC_ICO[k])}${sn}</td>${nums(mine(k, o), cnt(k, o))}</tr>`).join('')}`; }).join('')}<tr class="dtot"><td><b>Total</b></td>${nums(sum((k) => ITEMS[k].filter((it) => owns(k, it.k)).length), Object.values(ITEMS).flat().length)}</tr></table>
    ${passTable}
    <p class="dline">De la tienda, ${shopLocked} siguen con candado por mundo; lo último se abre en el mundo ${lastNeed + 1} (nivel ${lastNeed * LEVELS_PER_WORLD + 1}).</p>`;
  // Secciones con título; cada botón dice en corto lo que hace (la explicación larga va en su title).
  const S = [
    // Orden del menú (10 nov 2026, pedido del usuario): de lo más importante a lo menos.
    // General (10 nov 2026): herramientas, volver a explicar y códigos de regalo en un grupo, cada uno con su parte.
    { t: 'General', items: [], parts: [
      { k: 'gen', h: 'Herramientas', ico: 'gear', items: [
        { l: 'Galería de niveles', cls: 'gold', fn: onGallery },
        { l: 'Ir al tablero', cls: 'gold', title: 'Escribe un nivel y juega su tablero (gratis, sin guardar), como desde la galería', fn: onGoLevel },
        { l: 'Galería de planetas', cls: 'gold', title: 'Cada tipo de planeta: verlo en el mapa o jugar en su mesa', fn: onPlanets },
        { l: `Boosters infinitos: ${prefs.devInfinite ? 'sí' : 'no'}`, fn: () => { prefs.devInfinite = !prefs.devInfinite; persist(); toast(`Boosters infinitos: ${prefs.devInfinite ? 'sí' : 'no'}`); } },
        { l: '+20,000 monedas', fn: () => ((save.coins += 20000), persist(), updateCoins()) },
        // 9 nov 2026: para ver todo sin avanzar niveles (dev es caja de pruebas: al apagarlo vuelve tu partida).
        { l: 'Darme toda la tienda', title: 'Te da todo lo que se compra en la tienda, aunque tenga candado por mundo', fn: () => { for (const sec in ITEMS) ITEMS[sec].forEach((it) => !it.ev && (save.owned[`${sec}:${it.k}`] = 1)); persist(); toast('Ya tienes toda la tienda'); } },
        { l: 'Darme todos los exclusivos', title: 'Te da todos los premios exclusivos: evento del mes, festividades, colecciones, lluvia de meteoritos, código de regalo y logros', fn: () => { for (const sec in ITEMS) ITEMS[sec].forEach((it) => it.ev && (save.owned[`${sec}:${it.k}`] = 1)); persist(); toast('Ya tienes todos los exclusivos'); } },
        { l: `Medidas de pantalla: ${prefs.screenInfo ? 'sí' : 'no'}`, title: 'Recuadro con lo que dice el navegador del tamaño de la pantalla (para revisar el iPhone)', fn: () => { prefs.screenInfo = !prefs.screenInfo; persist(); dispatchEvent(new Event('screeninfo')); toast(`Medidas de pantalla: ${prefs.screenInfo ? 'sí' : 'no'}`); } },
      ] },
      { k: 'exp', h: 'Volver a explicar', ico: 'replay', items: [
        { l: 'Explicar mecánicas', title: 'Las explicaciones de cada mecánica salen otra vez', fn: () => ((save.seen = {}), persist(), toast('Las explicaciones saldrán otra vez')) },
        { l: 'Recorrido de botones', title: 'El recorrido de los botones (izquierda, arriba, eventos y Jugar) sale otra vez al cerrar este menú', fn: () => { delete save.sideTour; persist(); onRefresh(); } },
        // 8 nov 2026: los avisos de desbloqueo salen una sola vez por jugador (Reiniciar progreso los conserva).
        { l: 'Avisos de desbloqueo', title: 'Racha, misiones, lluvia de meteoritos, logros, colecciones, evento del mes y festividades: sus ventanas de "¡Nuevo!" salen otra vez (las que ya tengas abiertas, al volver al mapa)', fn: () => { save.intro = {}; delete save.metSeen; persist(); toast('Los avisos de desbloqueo saldrán otra vez'); onRefresh(); } },
      ] },
      { k: 'cod', h: 'Códigos de regalo', ico: 'gift', sub: prefs.codeLot ? `${prefs.codeLot.length} hechos` : 'aún no hay', items: [
        { l: prefs.codeLot ? 'Hacer otro lote' : 'Hacer lote', cls: 'gold', title: 'Uno de cada cosa del Tesoro escondido, 20 de monedas (100 a 500), comodines, deshacer y boletos. Los de antes siguen sirviendo', fn: () => (makeLot(), openCodeList()) },
        prefs.codeLot && { l: 'Ver los códigos', fn: openCodeList },
        { l: 'Un código suelto', title: 'Elige qué da: monedas, ayudas o una cosa del Tesoro escondido', fn: openOneCode },
      ] },
    ] },
    { t: 'Avance', sub: `vas en el mundo ${w + 1}`, items: [
      { l: `Abrir mundo ${w + 1}`, fn: () => (completeWorlds(w, w), onRefresh()) },
      { l: `Abrir constelación ${r + 1}`, fn: () => (completeWorlds(w, Math.min(r * REGION + REGION - 1, TOTAL_LEVELS / LEVELS_PER_WORLD - 1)), onRefresh()) },
      { l: 'Abrir todo', fn: () => { save.next = TOTAL_LEVELS - 1; save.open = Math.floor(save.next / LEVELS_PER_WORLD); save.run = null; persist(); onRefresh(); } },
      // Volver a jugar como nuevo el último nivel ganado (cobra boleto, cuenta para la racha, festejo completo).
      save.next > 0 && { l: `Reiniciar nivel ${save.next}`, title: 'El último nivel normal ganado vuelve a estar sin ganar', fn: () => {
        const g = save.next - 1, wg = Math.floor(g / LEVELS_PER_WORLD);
        delete save.stars[g];
        save.next = g;
        // Si era el jefe: el mundo siguiente se vuelve a cerrar (o se quita el boleto dorado que dio y no se gastó),
        // así al ganarlo otra vez salen el cofre y la apertura del mundo como la primera vez.
        if (g % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1) {
          const tk = wg % 10 === 9 ? 'cgold' : 'gold';
          if (save.open > wg) save.open = wg;
          else if (save[tk] > 0) save[tk]--;
        }
        if (save.run?.g === g) save.run = null;
        persist();
        toast(`Nivel ${g + 1} otra vez sin ganar`);
        onRefresh();
      } },
      { l: `Ir al jefe del mundo ${w + 1}`, title: 'Gana con 3★ los niveles que faltan antes del jefe del planeta', fn: () => {
        const boss = w * LEVELS_PER_WORLD + LEVELS_PER_WORLD - 1;
        if (save.next >= boss) return toast('Ya estás en el jefe');
        for (let g = save.next; g < boss; g++) save.stars[g] = 3;
        save.next = boss;
        save.run = null;
        persist();
        toast(`Siguiente: el jefe del mundo ${w + 1}`);
        onRefresh();
      } },
      // Para probar cómo se abre la siguiente constelación (boleto de constelación y monedas).
      { l: `Ir al último jefe de la constelación ${r + 1}`, title: 'Gana con 3★ todo hasta el jefe del mundo 10 de esta constelación', fn: () => {
        const last = r * REGION + REGION - 1, boss = last * LEVELS_PER_WORLD + LEVELS_PER_WORLD - 1;
        if (save.next >= boss) return toast('Ya estás en el último jefe');
        if (last > w) completeWorlds(w, last - 1);
        for (let g = save.next; g < boss; g++) save.stars[g] = 3;
        save.next = boss;
        save.open = Math.max(save.open, last);
        save.run = null;
        persist();
        toast(`Siguiente: el jefe del mundo ${last + 1}, el último de la constelación`);
        onRefresh();
      } },
      // En pruebas, empezar de cero también vuelve a enseñar los avisos de desbloqueo (el Reiniciar de Ajustes no).
    ] },
    // Misiones del día, logros y racha (10 nov 2026): un solo grupo con su parte cada uno, de su color (como sus
    // tarjetas de festejo), y arriba "Premios mezclados" para ver los festejos juntos.
    { t: 'Misiones, logros y racha', items: [
      { l: 'Premios mezclados', cls: 'gold', title: 'Siguiente premio de racha, una misión y un logro: para ver sus festejos juntos', fn: () => devDo([devStreakNext, devMisOne, devAchievementOne], onRefresh) },
    ], parts: [
      { k: 'racha', h: 'Racha cohete', ico: 'rocket', sub: `va en ${dailyStreak().n}`, items: [
        { l: 'Siguiente premio', fn: () => devDo([devStreakNext], onRefresh) },
        { l: '+1 victoria (3★)', fn: () => (streakWin(3), onRefresh()) },
        { l: 'Perderla', fn: () => (streakLose(), onRefresh()) },
        { l: 'Pasar al otro día', fn: () => ((save.devDay = (save.devDay || 0) + 1), persist(), onRefresh()) },
      ] },
      // Regalo diario (13 nov 2026): mover el día sin esperar.
      { k: 'mis', h: 'Regalo diario', ico: 'gift', sub: `día ${((save.daily?.day || 0) % 28) + 1} · ${save.daily?.shield || 0} escudos`, items: [
        { l: 'Reclamar otra vez', title: 'Como si fuera el día siguiente', fn: () => devDaily(save.daily?.day || 0, 1, onRefresh) },
        { l: 'Ir al día 7', fn: () => devDaily(6, 1, onRefresh) },
        { l: 'Ir al día 28', title: 'El 4.º agujero de gusano: arma el planeta y da un escudo', fn: () => devDaily(27, 1, onRefresh) },
        { l: 'Faltar un día', title: 'Como si no hubieras entrado ayer (con escudo te salva)', fn: () => devDaily(save.daily?.day || 0, 2, onRefresh) },
        { l: 'Darme un escudo', fn: () => ((save.daily = { ...save.daily, shield: Math.min(3, (save.daily?.shield || 0) + 1) }), persist(), onRefresh()) },
      ] },
      { k: 'mis', h: 'Misiones del día', ico: 'misiones', sub: `${missions().list.filter(missionDone).length}/3 cumplidas`, items: [
        { l: 'Cumplir una', title: 'Una de las de hoy que falte, al azar', fn: () => devDo([devMisOne], onRefresh) },
        { l: 'Cumplir las 3', fn: () => { for (const x of missions().list) x.n = x.goal; persist(); onRefresh(); } },
        { l: 'Otras misiones', title: 'Escoge 3 nuevas (como si fuera otro día, sin mover la fecha)', fn: () => { save.misSeed = (save.misSeed || 0) + 1; save.mis = null; missions(); onRefresh(); } },
      ] },
      { k: 'logro', h: 'Logros', ico: 'trophy', sub: `${ACHIEVEMENTS.reduce((n, l) => n + achievementGot(l), 0)} medallas`, items: [
        { l: 'Completar uno', title: 'Uno al azar llega a su siguiente medalla y al cerrar se cobra su premio', fn: () => devDo([devAchievementOne], onRefresh) },
        { l: 'Subir todos un escalón', fn: () => { const st = (save.stats ||= {}); for (const l of ACHIEVEMENTS) { const k = l.best ? `${l.k}Best` : l.k; st[k] = Math.max(st[k] || 0, l.steps.find((n) => n > (st[k] || 0)) || st[k]); } persist(); onRefresh(); } },
      ] },
      // Pasaporte y secretos (11 nov 2026): sumar lo que falta para el siguiente sello o premio (se festeja al volver al
      // mapa) y darte sus exclusivos sin cobrarlos. Van al final del grupo (Premios mezclados no los incluye).
      { k: 'pase', h: 'Pasaporte', ico: 'pasaporte', sub: `${passCount().toLocaleString('es-MX')} niveles · ${save.pass?.s || 0} de ${PASS_MAX} sellos`, items: [
        { l: 'Siguiente sello', cls: 'gold', title: 'Suma los niveles que faltan para el siguiente sello (solo cuenta en el pasaporte)', fn: () => (save.pass?.s || 0) < PASS_MAX && ((save.devPass = (save.devPass || 0) + passGoal((save.pass?.s || 0) + 1) - passCount()), persist(), onRefresh()) },
        { l: 'Darme sus exclusivos', title: 'Postales, título, fondo, reverso y marco de los sellos, sin cobrar los sellos', fn: () => passGive('pase') },
      ] },
      { k: 'sec', h: 'Secretos', ico: 'starSecret', sub: `${secretCount()} ganados · ${save.pass?.x || 0} de ${SECRET_MAX} premios`, items: [
        { l: 'Siguiente premio', cls: 'gold', title: 'Suma los secretos que faltan para el siguiente premio (solo aquí; no abre niveles)', fn: () => (save.pass?.x || 0) < SECRET_MAX && ((save.devSec = (save.devSec || 0) + Math.max(0, secretGoal((save.pass?.x || 0) + 1) - secretCount())), persist(), onRefresh()) },
        { l: 'Darme sus exclusivos', title: 'Título, postal, fondo, reverso, disfraz, marco y caras de los premios de secretos', fn: () => passGive('secreto') },
      ] },
    ] },
    // Eventos (10 nov 2026): del mes, del día (festividad) y colección en un solo grupo, cada uno con su parte.
    { t: 'Eventos', items: [], parts: [
      { k: 'mes', h: 'Evento del mes', ico: 'planet', sub: evNow ? `${evNow.name} · nivel ${Math.min(evNow.state.k + 1, EVENT_LEVELS)} de ${EVENT_LEVELS} · ${evNow.state.tk ? 'con boleto' : 'sin boleto'}` : 'no hay este mes', items: [
        { l: evNow ? 'Siguiente evento' : 'Ir al próximo', fn: () => ((save.devDay = (save.devDay || 0) + daysToNextEvent()), persist(), onRefresh()) },
        { l: 'Día antes del próximo', title: 'Mueve el reloj al último día del mes anterior: su botón sale gris con candado y la cuenta regresiva', fn: () => ((save.devDay = (save.devDay || 0) + daysToNextEvent() - 1), persist(), onRefresh()) },
        evNow && { l: 'Darme un boleto', title: 'Da el boleto sin esperar las 48 horas', fn: () => evSet({}) },
        evNow && { l: 'Ir al jefe del planeta', fn: () => evSet({ k: Math.min(EVENT_LEVELS - 1, Math.floor(evNow.state.k / EVENT_PER_PLANET) * EVENT_PER_PLANET + EVENT_PER_PLANET - 1) }) },
        evNow && { l: 'Siguiente planeta', fn: () => evSet({ k: Math.min(EVENT_LEVELS - 1, (Math.floor(evNow.state.k / EVENT_PER_PLANET) + 1) * EVENT_PER_PLANET) }) },
        evNow && { l: 'Ganar todo hasta el último jefe', title: 'Gana los niveles que faltan (con sus premios) y te deja en el jefe del último planeta', fn: () => (ev().state.tk = 1, ev().state.run = null, winTo(ev, evEnter, evWin, EVENT_LEVELS - 1)) },
      ] },
      { k: 'dia', h: 'Festividad del día', ico: 'calavera', sub: `${festNow ? `${festNow.name} · ${festNow.soon ? (festNow.inDays > 1 ? `en ${festNow.inDays} días` : 'mañana') : `nivel ${Math.min(festNow.state.k + 1, FL)} de ${FL}`}` : festNext ? `próxima: ${festNext.name} en ${festNext.days} días` : 'ninguna lista'}${isOn('fiesta') ? '' : ` · se abre en el nivel ${UNLOCK.fiesta}`}`, items: [
        festNext && festNext.days > 3 && { l: `3 días antes de: ${festNext.name}`, title: 'Mueve el reloj a 3 días de la siguiente fiesta: su botón sale gris con la cuenta regresiva', fn: () => toDay(festNext.days - 3) },
        festNow?.soon && { l: 'Empezarla', title: 'Mueve el reloj al día de la fiesta', fn: () => toDay(festNow.inDays) },
        festOn && { l: 'Ir al jefe del planeta', fn: () => festSet({ k: Math.min(FL - 1, Math.floor(festNow.state.k / FN) * FN + FN - 1) }) },
        festOn && { l: 'Siguiente planeta', fn: () => festSet({ k: Math.min(FL - 1, (Math.floor(festNow.state.k / FN) + 1) * FN) }) },
        festOn && { l: 'Ganar todo hasta el último jefe', title: 'Gana los niveles que faltan (con sus premios) y te deja en el jefe del último planeta', fn: () => ((festival().state.run = null), winTo(festival, festEnter, festWin, FL - 1)) },
        festOn && { l: 'Empezar de cero', fn: () => ((save.fi = null), persist(), onRefresh()) },
        { l: 'Ver el paquete de festividades', cls: 'gold', title: 'Leyendas, fiestas de México y de América: cada una con su mesa y sus 7 exclusivos (solo para ver, no te da nada)', fn: onFestivals },
        { l: 'Ver el aviso de Festividades', title: 'La ventana que sale al desbloquearlas (nivel 120), con 3 iconos', fn: () => (save.intro && delete save.intro.fiesta, persist(), onRefresh()) },
        { l: 'Ver el aviso de Leyendas', title: `La ventana que sale al llegar al nivel ${UNLOCK.fiesta2}, con las festividades nuevas`, fn: () => (save.intro && delete save.intro.fiesta2, persist(), onRefresh()) },
        { l: 'Ver el aviso de Fiestas de México', title: `La ventana que sale al llegar al nivel ${UNLOCK.fiesta3 + 1}`, fn: () => (save.intro && delete save.intro.fiesta3, persist(), onRefresh()) },
        { l: 'Ver el aviso de Fiestas de América', title: `La ventana que sale al llegar al nivel ${UNLOCK.fiesta4 + 1}`, fn: () => (save.intro && delete save.intro.fiesta4, persist(), onRefresh()) },
      ] },
      { k: 'col', h: 'Colección', ico: colNow?.token || COLLECTIONS[0].token, sub: colNow ? `${colNow.name} · ${colNow.state.n} fichas` : 'no hay esta semana', items: [
        { l: colNow ? 'Siguiente colección' : 'Ir a la próxima', fn: () => ((save.devDay = (save.devDay || 0) + daysToNextCol()), persist(), onRefresh()) },
        colNow && { l: '+500 fichas', fn: () => ((col().state.n += 500), persist(), onRefresh()) },
        colNow && { l: 'Ver su bienvenida', fn: () => ((col().state.intro = false), persist(), onRefresh()) },
      ] },
    ] },
    // Lluvias (12 nov 2026, el usuario: juntas): meteoritos y estrellas, cada una con sus botones en el mismo orden.
    { t: 'Lluvias', items: [], parts: [
      { k: 'met', h: 'Lluvia de meteoritos', ico: 'meteoro', sub: `${metOn ? `cayendo · quedan ${Math.ceil(metNow.left() / 6e4)} min · premio ${metNow.state.prize ? 'ya dado' : 'pendiente'}` : 'no está cayendo'}${(save.next || 0) >= MET_FROM ? '' : ` · te cae desde el nivel ${MET_FROM}`}`, items: [
        !metNow && { l: 'Hacerla caer', cls: 'gold', title: 'Empieza una lluvia de 30 minutos ahora (aunque no hayas llegado a su nivel)', fn: () => ((save.devMet = Date.now()), (save.devStar = 0), persist(), onRefresh()) },
        metOn && { l: 'Terminarla', fn: () => { if (save.devMet) save.devMet = 0; else save.devMetOff = metNow.id; persist(); onRefresh(); } },
        metOn && { l: 'Premio otra vez', title: 'El siguiente nivel con 3★ vuelve a dar el premio de esta lluvia', fn: () => ((metNow.state.prize = false), persist(), toast('El premio vuelve a estar pendiente')) },
        metOn && { l: 'Siguiente premio: exclusivo', title: 'El siguiente nivel con 3★ da uno de los exclusivos de meteoro que te faltan (con su ventana)', fn: () => { if (!metItems().some((x) => !owns(x.sec, x.k))) return toast('Ya tienes los 5 exclusivos'); metNow.state.prize = false; save.devMetItem = 1; persist(); toast('Gana un nivel con 3★: te cae un exclusivo'); } },
        metOn && { l: 'Ver su aviso', title: 'El aviso de esta lluvia al volver al mapa', fn: () => ((metNow.state.intro = false), persist(), onRefresh()) },
        { l: 'A 1 meteoro de las monedas', title: `Los meteoros cruzan el cielo del mapa durante la lluvia · ${popTxt('meteoro')}`, fn: () => popNear('meteoro') },
        { l: 'Ver aviso de primera vez', title: 'Vuelven a salir la ventana de desbloqueo (al volver al mapa) y la explicación completa de la siguiente lluvia', fn: () => (delete save.metSeen, save.intro && delete save.intro.meteoro, persist(), toast('Saldrán la ventana de desbloqueo y el aviso completo')) },
        { l: 'Darme sus exclusivos', title: 'Meteorín, Cazaestrellas, Lluvia de estrellas, Meteoro y Cielo de meteoros: para verlos en tu perfil y en la tienda', fn: () => { metItems().forEach((x) => (save.owned[`${x.sec}:${x.k}`] = 1)); persist(); toast('Ya tienes los 5 exclusivos de meteoro'); } },
      ] },
      { k: 'star', h: 'Lluvia de estrellas', ico: 'starFall', sub: `${starOn ? `cayendo · quedan ${Math.ceil(metNow.left() / 6e4)} min · premios ${metPrizes(metNow.state)} de 3` : `próxima: ${new Date(nextShowers(1, true)[0].at - (save.devDay || 0) * 864e5).toLocaleString('es-MX', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`}${(save.next || 0) >= STAR_FROM ? '' : ` · te cae desde el nivel ${STAR_FROM + 1}`}`, items: [
        !metNow && { l: 'Hacerla caer', cls: 'gold', title: 'Empieza una lluvia de estrellas de 15 minutos ahora (aunque no hayas llegado a su nivel)', fn: () => ((save.devStar = Date.now()), (save.devMet = 0), persist(), onRefresh()) },
        starOn && { l: 'Terminarla', fn: () => { if (save.devStar) save.devStar = 0; else save.devMetOff = metNow.id; persist(); onRefresh(); } },
        starOn && { l: 'Premios otra vez', title: 'Los siguientes 3 niveles con 3★ vuelven a dar premio', fn: () => ((metNow.state.prize = 0), persist(), toast('Los 3 premios vuelven a estar pendientes')) },
        starOn && { l: 'Siguiente premio: exclusivo', title: 'El siguiente nivel con 3★ da uno de los exclusivos de la lluvia de estrellas que te faltan (con su ventana)', fn: () => { if (!metItems('star').some((x) => !owns(x.sec, x.k))) return toast('Ya tienes los 5 exclusivos'); if (metPrizes(metNow.state) >= 3) metNow.state.prize = 2; save.devMetItem = 1; persist(); toast('Gana un nivel con 3★: te cae un exclusivo'); } },
        starOn && { l: 'Ver su aviso', title: 'El aviso de esta lluvia al volver al mapa', fn: () => ((metNow.state.intro = false), persist(), onRefresh()) },
        { l: 'A 1 estrella de las monedas', title: `Las estrellas fugaces cruzan el cielo del mapa durante la lluvia de estrellas · ${popTxt('estrella')}`, fn: () => popNear('estrella') },
        { l: 'Ver aviso de primera vez', title: 'Vuelven a salir la ventana de desbloqueo (al volver al mapa) y la explicación completa de la siguiente lluvia', fn: () => (delete save.starSeen, save.intro && delete save.intro.estrellas, persist(), toast('Saldrán la ventana de desbloqueo y el aviso completo')) },
        { l: 'Darme sus exclusivos', title: 'Pide un deseo, Deseo fugaz, Cielo de deseos, Lluvia dorada y Estrellas fugaces: para verlos en tu perfil y en la tienda', fn: () => { metItems('star').forEach((x) => (save.owned[`${x.sec}:${x.k}`] = 1)); persist(); toast('Ya tienes los 5 exclusivos de la lluvia de estrellas'); } },
      ] },
    ] },
    // Apuesta (9 nov 2026): brincar al nivel donde se abre cada ×N, para ver su ventana.
    { t: 'Apuesta', sub: `aquí hasta ×${maxBet(save.next)} · escogida ×${save.bet || 1} · gratis hasta ×${save.betFreeN ?? (save.betFree || save.betGift ? 2 : 1)}`, items: [
      ...BET_AT.map(([m, g], i) => ({ l: `Ir al inicio de ×${m} (nivel ${g + 1})`, title: `Deja el camino en el nivel ${g + 1} sin ganar (gana lo de antes o borra lo de después) y su ventana sale sola`, fn: () => (goToLevel(g, i ? BET_AT[i - 1][0] : 1), toast(`Siguiente: nivel ${g + 1}, apuesta hasta ×${m}`), onRefresh()) })),
    ] },
    // Nave de rescate (11 nov 2026): verla ya, o quedarse sin nada para que llegue sola al volver al mapa.
    { t: 'Nave de rescate', sub: save.rescueAt && Date.now() - save.rescueAt < 7 * 864e5 ? `usada · vuelve en ${Math.ceil((save.rescueAt + 7 * 864e5 - Date.now()) / 864e5)} días` : 'lista', items: [
      { l: 'Ver la nave', cls: 'gold', title: 'Llega la nave con sus 4 cápsulas (sí te da el premio)', fn: onRescue },
      { l: 'Quedarme sin boletos ni monedas', title: 'Boletos y monedas en 0, el regalo de boletos sin listo y la nave lista: llega sola en el mapa', fn: () => ((save.tickets = 0), (save.coins = 0), (save.ticketAt = Date.now()), (save.rescueAt = 0), (save.run = null), persist(), onRefresh()) },
      { l: 'Lista otra vez', title: 'Que pueda volver a llegar (una vez por semana)', fn: () => ((save.rescueAt = 0), persist(), onRefresh()) },
    ] },
    { t: 'Globos y burbujas', sub: ['globo', 'burbuja'].map(popTxt).join(' · '), items: [
      { l: 'A 1 globo del comodín', fn: () => popNear('globo') },
      { l: 'A 1 burbuja de las monedas', title: 'Las burbujas salen de los premios al ganar cualquier nivel y del cofre del jefe', fn: () => popNear('burbuja') },
    ] },
    // Una por festividad: mueve el reloj al día en que empieza (la de este año). Las de leyendas, solo desde el nivel 200.
  ].map((sec) => ({ ...sec, items: sec.items.filter(Boolean), parts: sec.parts?.map((p) => ({ ...p, items: p.items.filter(Boolean) })) }));
  const all = S.flatMap((sec) => [...sec.items, ...(sec.parts || []).flatMap((p) => p.items)]);
  const btns = (items) => `<div class="dbtns">${items.map((it) => `<button class="btn ${it.cls || 'ghost'}" data-i="${all.indexOf(it)}"${it.title ? ` title="${it.title}"` : ''}>${it.l}</button>`).join('')}</div>`;
  // parts: partes dentro de una sección, cada una con su icono, su color y sus botones.
  const partHTML = (p) => `<div class="dpart dp-${p.k}"><h5>${icon(p.ico)}${p.h}${p.sub ? `<small>${p.sub}</small>` : ''}</h5>${btns(p.items)}</div>`;
  const secHTML = (sec) => `<section class="dsec"><h4>${sec.t}${sec.sub ? `<small>${sec.sub}</small>` : ''}</h4>${sec.html || ''}${sec.items.length ? btns(sec.items) : ''}${(sec.parts || []).map(partHTML).join('')}</section>`;
  const m = openModal({
    title: 'Modo dev',
    cls: 'devmenu',
    wide: true,
    // Dos pestañas: los botones primero (lo que más se usa) y el recuento aparte.
    body: `<div class="dtabs"><button class="dtab on" data-tab="btns">Pruebas</button><button class="dtab" data-tab="count">Recuento</button></div>
      <div class="dpane" data-pane="count" hidden><section class="dsec">${countHTML}</section></div>
      <div class="dpane" data-pane="btns"><p class="note">Todo lo que hagas aquí es de prueba: al salir del modo dev vuelve tu partida.${(() => { const b = backupInfo(); return b ? `<br>Tu partida guardada: <b>nivel ${b.next + 1}</b>, mundo ${b.open + 1}, ${b.coins.toLocaleString('es-MX')} monedas.` : '<br><b>No hay copia de tu partida</b>: sal y vuelve a entrar al modo dev.'; })()}</p>
      ${S.map(secHTML).join('')}</div>`,
    buttons: [
      { label: 'Empezar de cero las pruebas', cls: 'green', onClick: () => { restoreBackup(); backupOnce(); toast('Tu partida volvió a como estaba'); onRefresh(); } },
      { label: 'Salir del modo dev', cls: 'pink', onClick: () => ((peek.on = false), setDev(false), document.documentElement.classList.remove('dev-on'), toast('Tu partida volvió a como estaba'), onRefresh()) },
    ],
  });
  m.el.querySelector('.dtabs').addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab]');
    if (!t) return;
    m.el.querySelectorAll('.dtab').forEach((b) => b.classList.toggle('on', b === t));
    m.el.querySelectorAll('.dpane').forEach((p) => (p.hidden = p.dataset.pane !== t.dataset.tab));
  });
  // Acordeón de los eventos: abre o cierra los renglones de su tipo.
  m.el.querySelectorAll('[data-acc]').forEach((r) => r.addEventListener('click', () => {
    const open = r.classList.toggle('open');
    m.el.querySelectorAll(`[data-of="${r.dataset.acc}"]`).forEach((x, k) => ((x.hidden = !open), x.style.setProperty('--d', `${k * 25}ms`)));
  }));
  m.el.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
    const [t, k] = b.dataset.go.split(':');
    m.close();
    toDay(t === 'm' ? daysToMonth(+k) : daysToFestival(k));
  }));
  m.el.querySelectorAll('.dsec [data-i]').forEach((b) => b.addEventListener('click', () => { m.close(); all[+b.dataset.i].fn(); }));
}

// ---------- Códigos de regalo ----------
// En el teléfono se abre "Compartir" (Notas, WhatsApp…); en la PC se copia.
async function shareText(text, what = 'Copiado') {
  try {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ text });
    else {
      await navigator.clipboard.writeText(text);
      toast(`${icon('check')}${what}`);
    }
  } catch (e) {
    if (e?.name !== 'AbortError') toast('No se pudo copiar');
  }
}
// Todos los códigos hechos, por grupos (acordeón). Tocar uno lo copia. "usado" = ya se canjeó en este teléfono.
function openCodeList() {
  const lot = prefs.codeLot || [];
  const groups = [...new Set(lot.map((c) => c.group))];
  const rows = groups.map((g, i) => {
    const list = lot.filter((c) => c.group === g);
    return `<tr class="dacc" data-acc="c${i}"><td class="dname" colspan="2"><b>${g}</b> <b class="dnum">${list.length}</b><span class="dchev">${icon('chev')}</span></td></tr>
      ${list.map((c) => `<tr class="dsub dcode${usedHere(c.code) ? ' used' : ''}" data-of="c${i}" data-code="${c.code}" hidden><td class="dname">${c.name}</td><td><code>${c.code}</code></td></tr>`).join('')}`;
  }).join('');
  const m = openModal({
    title: 'Códigos de regalo',
    cls: 'devmenu',
    wide: true,
    body: `<p class="note">Cada código sirve una vez. Toca uno para copiarlo. Tachado = ya se usó en este teléfono.</p>
      <table class="dtable dcodes">${rows}</table>`,
    buttons: [
      { label: 'Compartir todos', cls: 'green', keep: true, onClick: () => shareText(lotText(), `${lot.length} códigos copiados`) },
      { label: 'Un código suelto', cls: 'ghost', onClick: openOneCode },
    ],
  });
  m.el.querySelectorAll('[data-acc]').forEach((r) => r.addEventListener('click', () => {
    const open = r.classList.toggle('open');
    m.el.querySelectorAll(`[data-of="${r.dataset.acc}"]`).forEach((x) => (x.hidden = !open));
  }));
  m.el.querySelectorAll('[data-code]').forEach((r) => r.addEventListener('click', () => shareText(`${r.dataset.code} · ${r.firstChild.textContent}`, `${r.dataset.code} copiado`)));
}
// Uno a la medida: qué da (monedas, ayudas o el Tesoro escondido) y cuánto o cuál.
function openOneCode() {
  const opts = KINDS.map((k) => [k.k, k.name]);
  const m = openModal({
    title: 'Un código suelto',
    cls: 'devmenu',
    body: `<section class="dsec dform">
        <label><small>Qué da</small><select data-c="kind">${opts.map(([v, n]) => `<option value="${v}">${n}</option>`).join('')}</select></label>
        <label data-c="nbox"><small>Cuánto</small><input data-c="n" type="number" inputmode="numeric" min="1" value="100"></label>
        <label data-c="ibox" hidden><small>Cuál</small><select data-c="item"></select></label>
      </section>
      <p class="dcode-out" hidden><code></code><small></small></p>`,
    buttons: [
      { label: 'Hacer código', cls: 'gold', keep: true, onClick: () => make() },
      { label: 'Copiar', cls: 'green', keep: true, disabled: true, onClick: () => shareText(`${last.code} · ${last.name}`, `${last.code} copiado`) },
    ],
  });
  const $ = (k) => m.el.querySelector(`[data-c="${k}"]`);
  const out = m.el.querySelector('.dcode-out'), copy = m.el.querySelectorAll('.mbtns .btn')[1];
  let last = null;
  const sync = () => {
    const v = $('kind').value, tre = v === 'item';
    $('nbox').hidden = tre;
    $('ibox').hidden = !tre;
    if (tre) $('item').innerHTML = TREASURE.map((it, i) => `<option value="${i}">${rewardName({ item: it })}</option>`).join('');
    else $('n').value = { coins: 100, wild: 1, undo: 3, tickets: 2 }[v];
  };
  $('kind').addEventListener('change', sync);
  const make = () => {
    const v = $('kind').value, n = Math.round(+$('n').value);
    const r = v === 'item' ? { item: TREASURE[+$('item').value] } : { [v]: v === 'coins' ? Math.round(n / 10) * 10 : n };
    const max = v === 'coins' ? 655350 : 65535;
    if (!r.item && !(r[v] >= 1 && r[v] <= max)) return toast(`Pon un número de 1 a ${max.toLocaleString('es-MX')}${v === 'coins' ? ' (de 10 en 10)' : ''}`);
    last = { group: 'Sueltos', name: rewardName(r), code: makeCode(r, lotNonces()) };
    (prefs.codeLot ||= []).push(last);
    persist();
    out.hidden = false;
    out.querySelector('code').textContent = last.code;
    out.querySelector('small').textContent = last.name;
    copy.disabled = false;
    out.animate([{ scale: 0.8, opacity: 0 }, { scale: 1.06, opacity: 1, offset: 0.6 }, { scale: 1 }], { duration: 380, easing: 'ease-out' });
  };
  sync();
}
