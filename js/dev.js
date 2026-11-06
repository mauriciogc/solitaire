// Modo dev: probar niveles rápido sin jugarlos a mano.
// Se prende y apaga con los botones de pruebas de Ajustes (8 toques seguidos al título). Queda guardado en el navegador.
import { save, prefs, persist, resetProfile, backupOnce, restoreBackup, setDev } from './storage.js';
import { rachaWin, rachaLose, racha, nextGoal, col, daysToNextCol, ev, daysToNextEvent, evEnter, evWin, EVENT_PER_PLANET, EVENT_LEVELS, fiesta, fiEnter, fiWin, nextFiesta, daysToNextFiesta, daysToFiesta, fiShape, isOn, UNLOCK } from './events.js';
import { generateLevel, hardHelp, fiestaPick, fiestaLevel, eventLevel, eventGroup, EVENT_WORLDS, packGroups, worldInfo, specials, specialGroup, SPECIAL_ID, TOTAL_LEVELS, LEVELS_PER_WORLD, MECH_NAMES, MECHANICS, MECH_INTRO, SCROLL_FROM, EXTRA, extraDebut } from './levels.js';
import { playCasual, solve, initState } from './engine.js';
import { openModal, toast, updateCoins, popGoal } from './ui.js';
import { mulberry32 } from './rng.js';
import { icon, miniPlanet } from './art.js';
import { tableHTML, BIOMES, biomeKey } from './biomes.js';
import { peek } from './galaxy.js';
import { EVENTOS, COLECCIONES, FIESTAS, fiestaDays } from './events.js';
import { ITEMS, SECTIONS, GROUPS, owns, lockedUntil } from './shop.js';
import { KINDS, TREASURE, makeLot, makeCode, rewardName, lotText, usedHere, lotNonces } from './codes.js';
// Icono de cada sección de la tienda (para el recuento).
const SEC_ICO = { avatar: 'user', ring: 'star', title: 'crown', back: 'deck', face: 'face', traveler: 'rocket', space: 'planet', frame: 'album' };

export const dev = {
  get on() {
    return !!prefs.dev;
  },
  get infinite() {
    return !!prefs.devInfinite;
  },
};

// Dónde estaba la galería, para volver a la misma página y filtros al salir de un nivel.
// src: camino · mes (evento del mes) · dia (festividades; fi = 'reserva' para los 1,000 especiales). help: '' todas, '0' sin ayuda, 'any' alguna, 'n' exactas.
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
  // Tres grupos: ir (galería y niveles), probar (ver, solución, paso, resolver, ganar) e Info. Iconos de trazo, sin emojis.
  const L = game.level;
  // Evento o festividad (traen k): su número dentro del evento; especial suelto; si no, mundo y nivel.
  const set = L.k != null, num = set ? L.k + 1 : g + 1;
  const where = set ? (L.special != null ? 'festividad' : 'evento del mes') : L.special != null ? `Especial ${L.special + 1}` : `M${Math.floor(g / LEVELS_PER_WORLD) + 1} · N${(g % LEVELS_PER_WORLD) + 1}`;
  const btn = (d, ico, txt, extra = '') => `<button data-d="${d}" ${extra}>${DI[ico]}${txt ? `<span>${txt}</span>` : ''}</button>`;
  bar.innerHTML = `
    <b class="db-tag">DEV</b>
    <div class="db-grp">${btn('gal', 'grid', 'Galería')}</div>
    <div class="db-grp db-nav">${btn('prev', 'prev', '', `aria-label="Nivel anterior" ${g === 0 ? 'disabled' : ''}`)}<button data-d="goto" class="db-lvl" title="Ir a nivel"><b>#${num}</b><small>${where}${L.help ? ` · pide ${L.help}` : ''}</small></button>${btn('next', 'next', '', `aria-label="Nivel siguiente" ${g >= TOTAL_LEVELS - 1 ? 'disabled' : ''}`)}</div>
    <div class="db-grp">${btn('reveal', 'eye', 'Ver todo')}${btn('sol', 'flag', 'Solución')}${btn('step', 'step', 'Paso')}${btn('auto', 'play', 'Resolver')}${btn('win', 'trophy', 'Ganar')}</div>
    <div class="db-grp">${btn('info', 'info', 'Info')}</div>`;
  let reveal = false;
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-d]');
    if (!b) return;
    const act = {
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
      info: () => showInfo(game.level),
    };
    act[b.dataset.d]?.();
  });
  game.el.querySelector('.board-wrap').before(bar);
}

function showInfo(L) {
  const t0 = performance.now();
  let sol = null, w = 0;
  for (; w <= 3 && !sol; w++) sol = solve(L, initState(L), w ? 60000 : 250000, w);
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
    ['Ayudas', L.help ? `pide ${L.help} (comodines o compras de +5): sin ellas no hay solución` : 'no pide'],
    ['Bot casual gana', ((p) => `${p}% · ${rateTag(L, p)}`)(casualRate(L))],
    ['Solucionador', sol ? `resuelve en ${sol.length} pasos${w ? ` con ${w} comodín${w > 1 ? 'es' : ''}` : ''} (${ms} ms)` : `no encontró (${ms} ms)`],
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
const TEMPLATES = [['pyramid', 1], ['peaks', 2], ['clusters', 3], ['star', 10], ['layers', 12], ['wall', 19], ['towers', 23], ['butterfly', 33], ['diamond', 34], ['spiral', 35], ['mesa', 40], ['heart', 42], ['gravedad', 70], ['scatter', 71], ['nebulosa', 100], ['plegable', 140], ['invPyramid', 148], ['hourglass', 169]];
// Fase 7: piezas nuevas (solo salen en niveles sin ayudas) y respiros.
// Iconos chiquitos de las mesas especiales (para el recuento).
const SV = (b) => `<svg class="ico" viewBox="0 0 32 32" fill="none" stroke="#2a1f5c" stroke-width="2" stroke-linejoin="round">${b}</svg>`;
const TABLE_ICONS = {
  mesa: SV('<rect x="3" y="9" width="20" height="16" rx="3" fill="#3fa0a8"/><rect x="21" y="6" width="8" height="22" rx="4" fill="#6fc6cc"/><path d="M25 9v16" stroke-width="1.4"/>'),
  gravedad: SV('<rect x="4" y="3" width="10" height="26" rx="3" fill="#c9bff0"/><rect x="18" y="3" width="10" height="26" rx="3" fill="#c9bff0"/><rect x="5.5" y="17" width="7" height="10" rx="1.6" fill="#fff"/><rect x="19.5" y="17" width="7" height="10" rx="1.6" fill="#fff"/><path d="M9 7v6l-2-2M9 13l2-2M23 7v6l-2-2M23 13l2-2" stroke-width="1.6" stroke-linecap="round"/>'),
  nebulosa: SV('<circle cx="16" cy="16" r="13" fill="#8a5cf0"/><path d="M16 16c0-3 4-3 4 0s-3 6-7 5-6-5-4-9 8-6 12-3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'),
  plegable: SV('<path d="M2 9l9 3v14l-9-3z" fill="#6fc6cc"/><rect x="11" y="7" width="10" height="19" rx="1.6" fill="#3fa0a8"/><path d="M30 9l-9 3v14l9-3z" fill="#6fc6cc"/>'),
};
const tableIcon = (t) => TABLE_ICONS[t] || '';
const SCROLL_NAMES = { mesa: 'mesa enrollada', gravedad: 'gravedad', nebulosa: 'nebulosa', plegable: 'mesa plegable' };
const PIECES = [['steps', 3], ['cross', 3], ['crown', 8], ['rosette', 13], ['sandwich', 16], ['tiltFan', 21]];
// Nombres en español de formas y piezas (galería e Info).
const TPL_NAMES = { pyramid: 'Pirámide', peaks: 'Picos', clusters: 'Grupitos', star: 'Estrella', layers: 'Capas', wall: 'Muro', towers: 'Torres', butterfly: 'Mariposa', diamond: 'Diamante', spiral: 'Espiral', mesa: 'Mesa enrollada', heart: 'Corazón', gravedad: 'Gravedad', scatter: 'Dispersas', nebulosa: 'Nebulosa', plegable: 'Mesa plegable', invPyramid: 'Pirámide invertida', hourglass: 'Reloj de arena' };
const PIECE_NAMES = { steps: 'escalerita', cross: 'cruz', crown: 'corona', rosette: 'roseta', sandwich: 'sándwich', tiltFan: 'abanico inclinado' };
// Filtro de tablero, en grupos: formas, mesas especiales y piezas (cada una con el nivel donde sale primero).
const TPL_GROUPS = [
  ['Formas', [...TEMPLATES.filter(([t]) => !SCROLL_NAMES[t]).map(([t, n]) => [t, `${TPL_NAMES[t]} · ${n}`]), ['respiros', 'Respiros · 12']]],
  ['Mesas especiales', TEMPLATES.filter(([t]) => SCROLL_NAMES[t]).map(([t, n]) => [t, `${TPL_NAMES[t]} · ${n}`])],
  ['Piezas', PIECES.map(([k, n]) => [`pz:${k}`, `${PIECE_NAMES[k]} · ${n}`])],
];
// Cartas en el orden en que salen (nivel de estreno: el primero de su mundo; cometa y turbo, el primero normal).
const mechDebut = (m) => (EXTRA.includes(m) ? extraDebut(m) : MECH_INTRO[m] * LEVELS_PER_WORLD) + 1;
const MECH_ORDER = MECHANICS.slice().sort((a, b) => mechDebut(a) - mechDebut(b));
const okTpl = (L, t) => t === 'todas' || (t === 'respiros' ? !!L.respite : t.startsWith('pz:') ? !!L.pieces?.includes(t.slice(3)) : L.template === t);
const tplName = (L) => (TPL_NAMES[L.template] || L.template) + (L.pieces ? ` + ${L.pieces.map((k) => PIECE_NAMES[k] || k).join(', ')}` : '');
// Etiqueta según el % del bot casual (ver tabla de la Fase 7): fácil ≥75, medio ≥50, difícil ≥25, muy difícil.
export const rateTag = (L, p) => (L.help ? `pide ${L.help}` : p >= 75 ? 'fácil' : p >= 50 ? 'medio' : p >= 25 ? 'difícil' : 'muy difícil');
// Color de la dificultad en la tarjeta (mismo corte que rateTag).
const rateCls = (L, p) => (L.help ? 'r-help' : p >= 75 ? 'r-easy' : p >= 50 ? 'r-mid' : p >= 25 ? 'r-hard' : 'r-max');

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

const MES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
// Grupos de mundos del evento y las festividades (sus niveles cambian según las cartas que ya conoce el jugador).
const GRP_NAMES = EVENT_WORLDS.map((w, i) => (i ? `Mundos ${w + 1}${EVENT_WORLDS[i + 1] ? `-${EVENT_WORLDS[i + 1]}` : ' en adelante'}` : `Mundos 1-${EVENT_WORLDS[1]}`));

export function galleryScreen({ onPlay, onPlayLevel, onBack }) {
  const st = gallery;
  const now = new Date().getFullYear();
  const evs = Object.entries(EVENTOS).filter(([, e]) => e.ready).map(([m, e]) => [+m, e]).sort((a, b) => a[0] - b[0]);
  st.year ??= now;
  st.grp ??= eventGroup(save.open || 0);
  st.month ??= (evs.find(([m]) => m >= new Date().getMonth()) || evs[0])[0];
  const fiDays = () => fiestaDays(st.year, true);
  st.fi ??= fiDays()[0]?.f.key || 'reserva';
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
    for (const { f, day } of fiDays()) {
      const { N, L } = fiShape(f);
      for (const w of EVENT_WORLDS) for (let k = 0; k < L; k++) (out[fiestaPick(day, k, w, N)] ??= new Map()).set(f.key, f);
    }
    return out;
  };
  let useBy = usesOf();

  // Lo que se recorre. Camino y reserva: por páginas (ids). Mes y día: la lista completa, por planeta.
  const paged = () => st.src === 'camino' || (st.src === 'dia' && st.fi === 'reserva');
  function eventSet() {
    if (st.src === 'mes') {
      const e = EVENTOS[st.month];
      return { look: { ico: e.ico, table: e.key }, planets: e.planets, levels: [...Array(EVENT_LEVELS).keys()].map((k) => eventLevel(st.year * 12 + st.month, k, EVENT_WORLDS[st.grp])) };
    }
    const x = fiDays().find((o) => o.f.key === st.fi);
    if (!x) return { look: {}, planets: [], levels: [] };
    const { N, L } = fiShape(x.f);
    return { look: { ico: x.f.ico, table: x.f.key }, planets: x.f.planets || [], levels: [...Array(L).keys()].map((k) => fiestaLevel(x.day, k, EVENT_WORLDS[st.grp], N)), day: x.day };
  }
  const okH = (L) => !st.help || (st.help === '0' ? !L.help : st.help === 'any' ? !!L.help : L.help === +st.help);
  const okM = (L, m) => !m || (m === 'none' ? !L.meta.mechs.length : L.meta.mechs.includes(m));
  const ok = (L) => okTpl(L, st.tpl) && okM(L, st.mA) && okM(L, st.mB) && okH(L) && (!st.boss || L.boss);

  function controls() {
    const evText = st.src === 'mes' ? 'La forma de cada tablero es la misma todos los años; con el año solo cambian los números de las cartas.' : '';
    const what = {
      camino: `Los ${fmt(TOTAL_LEVELS)} niveles del mapa, en orden (${fmt(hardN)} piden ayuda). No cambian con el año.`,
      mes: `Los ${EVENT_LEVELS} niveles del evento, por planeta. ${evText}`,
      dia: st.fi === 'reserva'
        ? `Los 1,000 tableros especiales, fuera del mapa. Las festividades toman de aquí los suyos (los niveles piden 2 y el jefe 3); la etiqueta dice cuál lo usa en ${st.year}. Los de 1 y 4 quedan para eventos futuros.`
        : `Sus niveles, por planeta. Cada año le tocan otros tableros (se eligen por la fecha) y cambian con el grupo de mundos.`,
    }[st.src];
    const years = [...Array(6).keys()].map((i) => now - 1 + i);
    const source = st.src === 'mes'
      ? pick('month', 'Evento', evs.map(([m, e]) => opt(m, `${e.name} · ${MES_C[m]}`, st.month)).join('')) + pick('year', 'Año', years.map((y) => opt(y, y, st.year)).join('')) + pick('grp', 'Jugador en', GRP_NAMES.map((n, i) => opt(i, n, st.grp)).join(''))
      : st.src === 'dia'
        ? pick('fi', 'Festividad', fiDays().map(({ f, day }) => { const d = new Date(day * 864e5); return opt(f.key, `${f.name} · ${d.getUTCDate()} ${MES_C[d.getUTCMonth()]}`, st.fi); }).join('') + opt('reserva', 'Reserva: los 1,000 especiales', st.fi)) + pick('year', 'Año', years.map((y) => opt(y, y, st.year)).join('')) + (st.fi === 'reserva' ? '' : pick('grp', 'Jugador en', GRP_NAMES.map((n, i) => opt(i, n, st.grp)).join('')))
        : '';
    const maxH = st.src === 'dia' ? 4 : 3;
    const helps = [['', 'Todas'], ['0', 'Sin ayuda'], ['any', 'Piden alguna'], ...[...Array(maxH).keys()].map((i) => [String(i + 1), `Piden ${i + 1}`])];
    const dirty = st.tpl !== 'todas' || st.mA || st.mB || st.boss || st.help;
    el.querySelector('.g-filters').innerHTML = `
      <div class="g-seg">${SRCS.map(([k, t]) => `<button data-src="${k}" class="${st.src === k ? 'on' : ''}">${t}</button>`).join('')}</div>
      ${source ? `<div class="g-pick g-source">${source}</div>` : ''}
      <p class="g-what">${what}</p>
      <div class="g-pick">
        ${pick('tpl', 'Tablero', opt('todas', 'Todos', st.tpl) + TPL_GROUPS.map(([h, list]) => `<optgroup label="${h}">${list.map(([k, t]) => opt(k, t, st.tpl)).join('')}</optgroup>`).join(''), st.tpl !== 'todas')}
        ${pick('mA', 'Carta especial', opt('', 'Todas', st.mA) + opt('none', 'Sin cartas especiales', st.mA) + MECH_ORDER.map((m) => opt(m, `${MECH_NAMES[m]} · ${mechDebut(m)}`, st.mA)).join(''), !!st.mA)}
        ${st.mA && st.mA !== 'none' ? pick('mB', 'Junto con', opt('', 'Cualquiera', st.mB) + MECH_ORDER.filter((m) => m !== st.mA).map((m) => opt(m, MECH_NAMES[m], st.mB)).join(''), !!st.mB) : ''}
        ${pick('help', 'Ayudas', helps.map(([k, t]) => opt(k, t, st.help)).join(''), !!st.help)}
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
    const badges = [L.boss && `<i class="gb gb-boss">${icon('crown')}Jefe</i>`, L.help && `<i class="gb gb-help">Pide ${L.help}</i>`, L.respite && '<i class="gb gb-rest">Respiro</i>', L.scroll && `<i class="gb gb-mesa">${tableIcon(L.scroll)}${TPL_NAMES[L.scroll]}</i>`].filter(Boolean).join('');
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
      const reserva = st.src === 'dia';
      const end = reserva ? 1000 : TOTAL_LEVELS;
      let g = st.start;
      while (items.length < PAGE && g < end) {
        const id = reserva ? SPECIAL_ID + g : g;
        if (reserva || !st.boss || id % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1) {
          const L = generateLevel(id);
          if (ok(L)) items.push({ L, key: L.g });
        }
        g++;
        if (g - st.start > 4000) break; // filtros muy estrictos: no colgar la página
      }
      st.end = g;
      pager.hidden = false;
      el.querySelector('.g-range').textContent = reserva ? `Especiales ${st.start + 1} – ${g}` : `Niveles ${st.start + 1} – ${g}`;
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
      if (st.help === '4' && src !== 'dia') st.help = '';
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
      if (st.fi !== 'reserva' && !fiDays().some((o) => o.f.key === st.fi)) st.fi = fiDays()[0]?.f.key || 'reserva';
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
// card: dibuja la carta de una mecánica (mechCard de main.js) para el recuento.
export function openDevMenu({ onGallery, onPlanets, onRefresh, card }) {
  const w = Math.min(Math.floor(save.next / LEVELS_PER_WORLD), save.open);
  const r = Math.floor(w / REGION);
  const evNow = ev(), colNow = col();
  const evSet = (patch) => { Object.assign(ev().state, { run: null, tk: 1, at: 0, ...patch }); persist(); onRefresh(); };
  // fiNext: la siguiente fiesta que no es la de hoy ni la de mañana (para brincar al día antes de ella).
  const fiNow = fiesta(), fiNext = nextFiesta(fiNow?.soon ? fiNow.inDays : 0), fiOn = fiNow && !fiNow.soon;
  const { N: FN, L: FL } = fiShape(fiNow);
  const fiSet = (patch) => { Object.assign(fiesta().state, { run: null, ...patch }); persist(); onRefresh(); };
  // Deja la cuenta a 1 del premio: el siguiente globo (jefe) o burbuja (cofre) que truene lo da.
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
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const evs = Object.entries(EVENTOS).filter(([, e]) => e.ready).sort((a, b) => a[0] - b[0]);
  const fis = FIESTAS.filter((f) => f.ready), y = new Date().getFullYear();
  const origin = (it) => (!it.ev ? 'tienda' : it.code ? 'codigo' : FIESTAS.some((f) => f.key === it.ev) ? 'fiesta' : Object.values(EVENTOS).some((e) => e.key === it.ev) ? 'mes' : 'col');
  const ORI = [['tienda', 'Tienda'], ['col', 'Colección'], ['mes', 'Del mes'], ['fiesta', 'De un día'], ['codigo', 'Código']];
  const cnt = (sec, o) => ITEMS[sec].filter((it) => origin(it) === o).length;
  const mine = (sec, o) => ITEMS[sec].filter((it) => origin(it) === o && owns(sec, it.k)).length;
  const cell = (sec, o) => (cnt(sec, o) ? `${mine(sec, o)}/${cnt(sec, o)}` : '–');
  const sum = (f) => SECTIONS.reduce((n, { k }) => n + f(k), 0);
  // Totales de la tienda: en verde las que tienes y en rojo las que te faltan.
  const have = (n, of) => `<span class="d-yes" title="tienes">${n}</span>${of - n ? ` <span class="d-no" title="faltan">${of - n}</span>` : ''}`;
  // Desde qué nivel ganado se abre cada cosa, y si tú ya llegaste.
  const won = save.next || 0;
  const opens = (lvl) => (won >= lvl ? '' : `<span class="d-no" title="faltan ${lvl - won} niveles">${lvl - won}</span>`);
  // Los eventos de cada tipo (van dentro de su renglón, como acordeón): del mes por mes, colecciones, de un día por fecha.
  const fiDay = (f) => f.date(y);
  const colsOf = (plus) => COLECCIONES.filter((c) => (c.plus || 0) === plus).map((c) => [c.token, c.name, '']);
  const fisOf = (local) => fis.filter((f) => !!f.local === local).sort((a, b) => fiDay(a) - fiDay(b)).map((f) => [f.ico, f.name, `${fiDay(f).getDate()} ${MES[fiDay(f).getMonth()]}${f.days > 1 ? ` · ${f.days} días` : ''}`, `f:${f.key}`]);
  // Todo lo que sale en el camino, en el orden en que aparece (nivel = el primero donde lo ves; los eventos se abren al ganar el anterior).
  const UN = [
    ['Racha cohete', UNLOCK.racha, 'rocket'],
    ['Colecciones', UNLOCK.col, 'concha', colsOf(0), 'Se turnan: 2 semanas al mes (la del 1.er y la del 3.er lunes)'],
    ['Eventos del mes', UNLOCK.mes, 'planet', evs.map(([m, e]) => [e.ico, e.name, MES[m], `m:${m}`])],
    ['Colecciones nuevas y 3.ª semana', UNLOCK.col2, 'fosil', colsOf(true), 'Se suman a las de antes y se turnan: 3 semanas al mes'],
    ['Festividades de un día', UNLOCK.fiesta, 'pinata', fisOf(false)],
    ['Colecciones de Arte, Música y Cine', UNLOCK.col3, 'nota', colsOf(2), 'Se suman a las de antes y se turnan: todas las semanas'],
    ['Festividades de leyendas mexicanas', UNLOCK.fiesta2, 'catrina', fisOf(true)],
  ];
  const KINDS = { ev: 'Evento', card: 'Carta', mesa: 'Mesa' };
  const rows = [
    ...UN.map(([name, l, ico, sub, note]) => ({ n: l + 1, k: 'ev', name, pic: icon(ico), sub, note })),
    ...MECH_ORDER.map((m) => ({ n: mechDebut(m), k: 'card', name: MECH_NAMES[m], pic: `<span class="dmc">${card(m)}</span>` })),
    ...Object.entries(SCROLL_FROM).map(([t, g]) => ({ n: g + 1, k: 'mesa', name: SCROLL_NAMES[t], pic: tableIcon(t) })),
  ].sort((a, b) => a.n - b.n || Object.keys(KINDS).indexOf(a.k) - Object.keys(KINDS).indexOf(b.k));
  const subRow = (i) => ([ico, name, when, go]) => `<tr class="dsub" data-of="${i}" hidden><td></td><td class="dpic">${icon(ico)}</td><td class="dname">${name}</td><td colspan="2">${when}</td><td>${go ? `<button class="dgo" data-go="${go}" title="Mueve el reloj al día en que empieza">Ir</button>` : ''}</td></tr>`;
  const line = (r, i) => `<tr${r.sub ? ` class="dacc" data-acc="${i}"` : ''}><td><i class="dkind k-${r.k}" title="${KINDS[r.k]}">${KINDS[r.k][0]}</i></td><td class="dpic">${r.pic}</td><td class="dname">${r.name}${r.sub ? ` <b class="dnum">${r.sub.length}</b><span class="dchev">${icon('chev')}</span>` : ''}</td><td>${r.n}</td><td>${Math.ceil(r.n / LEVELS_PER_WORLD)}</td><td>${opens(r.n - 1)}</td></tr>${r.note ? `<tr class="dsub dnote" data-of="${i}" hidden><td></td><td colspan="5">${r.note}</td></tr>` : ''}${(r.sub || []).map(subRow(i)).join('')}`;
  const lastNeed = Math.max(...Object.values(ITEMS).flat().map((it) => it.need || 0));
  const shopLocked = sum((k) => ITEMS[k].filter((it) => lockedUntil(k, it.k)).length);
  const recuento = `<table class="dtable dorder"><tr><th></th><th></th><th>Qué</th><th>Nivel</th><th>Mundo</th><th>Tú</th></tr>${rows.map(line).join('')}</table>
    <p class="dline"><b>Tienda: tienes ${sum((k) => ITEMS[k].filter((it) => owns(k, it.k)).length)} de ${Object.values(ITEMS).flat().length}</b> (tuyas / que hay)</p>
    <table class="dtable dshop"><tr><th></th>${ORI.map(([, n]) => `<th>${n}</th>`).join('')}<th>Total</th></tr>${GROUPS.map((g) => `<tr class="dshop-g dacc" data-acc="s${g.k}"><td class="dname">${icon(g.ico)}${g.name}<span class="dchev">${icon('chev')}</span></td>${ORI.map(([o]) => `<td>${g.secs.reduce((n, k) => n + mine(k, o), 0)}/${g.secs.reduce((n, k) => n + cnt(k, o), 0)}</td>`).join('')}<td>${have(g.secs.reduce((n, k) => n + ITEMS[k].filter((it) => owns(k, it.k)).length, 0), g.secs.reduce((n, k) => n + ITEMS[k].length, 0))}</td></tr>${g.secs.map((k) => `<tr class="dsub" data-of="s${g.k}" hidden><td class="dname">${icon(SEC_ICO[k])}${SECTIONS.find((x) => x.k === k).name}</td>${ORI.map(([o]) => `<td>${cell(k, o)}</td>`).join('')}<td>${have(ITEMS[k].filter((it) => owns(k, it.k)).length, ITEMS[k].length)}</td></tr>`).join('')}`).join('')}<tr class="dtot"><td><b>Total</b></td>${ORI.map(([o]) => `<td>${have(sum((k) => mine(k, o)), sum((k) => cnt(k, o)))}</td>`).join('')}<td>${have(sum((k) => ITEMS[k].filter((it) => owns(k, it.k)).length), Object.values(ITEMS).flat().length)}</td></tr></table>
    <p class="dline">De la tienda, ${shopLocked} siguen con candado por mundo; lo último se abre en el mundo ${lastNeed + 1} (nivel ${lastNeed * LEVELS_PER_WORLD + 1}).</p>`;
  // Secciones con título; cada botón dice en corto lo que hace (la explicación larga va en su title).
  const S = [
    { t: 'General', items: [
      { l: 'Galería de niveles', cls: 'gold', fn: onGallery },
      { l: 'Galería de planetas', cls: 'gold', title: 'Cada tipo de planeta: verlo en el mapa o jugar en su mesa', fn: onPlanets },
      { l: `Boosters infinitos: ${prefs.devInfinite ? 'sí' : 'no'}`, fn: () => { prefs.devInfinite = !prefs.devInfinite; persist(); toast(`Boosters infinitos: ${prefs.devInfinite ? 'sí' : 'no'}`); } },
      { l: '+20,000 monedas', fn: () => ((save.coins += 20000), persist(), updateCoins()) },
      { l: `Medidas de pantalla: ${prefs.screenInfo ? 'sí' : 'no'}`, title: 'Recuadro con lo que dice el navegador del tamaño de la pantalla (para revisar el iPhone)', fn: () => { prefs.screenInfo = !prefs.screenInfo; persist(); dispatchEvent(new Event('screeninfo')); toast(`Medidas de pantalla: ${prefs.screenInfo ? 'sí' : 'no'}`); } },
    ] },
    { t: 'Códigos de regalo', sub: prefs.codeLot ? `${prefs.codeLot.length} hechos` : 'aún no hay', items: [
      { l: prefs.codeLot ? 'Hacer otro lote' : 'Hacer lote', cls: 'gold', title: 'Uno de cada cosa del Tesoro escondido, 20 de monedas (100 a 500), comodines, deshacer y boletos. Los de antes siguen sirviendo', fn: () => (makeLot(), openCodeList()) },
      prefs.codeLot && { l: 'Ver los códigos', fn: openCodeList },
      { l: 'Un código suelto', title: 'Elige qué da: monedas, ayudas o una cosa del Tesoro escondido', fn: openOneCode },
    ] },
    { t: 'Volver a explicar', items: [
      { l: 'Explicar mecánicas', title: 'Las explicaciones de cada mecánica salen otra vez', fn: () => ((save.seen = {}), persist(), toast('Las explicaciones saldrán otra vez')) },
      { l: 'Recorrido de botones', title: 'El recorrido de los botones (izquierda, arriba, eventos y Jugar) sale otra vez al cerrar este menú', fn: () => { delete save.sideTour; persist(); onRefresh(); } },
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
          if (save.open > wg) save.open = wg;
          else if (save.gold > 0) save.gold--;
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
      { l: 'Reiniciar progreso', fn: () => (resetProfile(), onRefresh()) },
    ] },
    { t: 'Racha', sub: `va en ${racha().n}`, items: [
      { l: '+1 victoria', fn: () => (rachaWin(), onRefresh()) },
      { l: 'Al siguiente premio', fn: () => { const g = nextGoal(); while (racha().n < g.n) rachaWin(); onRefresh(); } },
      { l: 'Perderla', fn: () => (rachaLose(), onRefresh()) },
      { l: 'Pasar al otro día', fn: () => ((save.devDay = (save.devDay || 0) + 1), persist(), onRefresh()) },
    ] },
    { t: 'Globos y burbujas', sub: ['globo', 'burbuja'].map((k) => { const p = save.pops?.[k] || { n: 0, lvl: 0 }; return `${k}s ${p.n} de ${popGoal(k, p.lvl)}`; }).join(' · '), items: [
      { l: 'A 1 globo del comodín', fn: () => popNear('globo') },
      { l: 'A 1 burbuja de las monedas', title: 'Las burbujas salen de los premios al ganar cualquier nivel y del cofre del jefe', fn: () => popNear('burbuja') },
      { l: 'Empezar de cero', fn: () => ((save.pops = {}), persist(), onRefresh()) },
    ] },
    { t: 'Colección', sub: colNow ? `${colNow.name} · ${colNow.state.n} fichas` : 'no hay esta semana', items: [
      { l: colNow ? 'Siguiente colección' : 'Ir a la próxima', fn: () => ((save.devDay = (save.devDay || 0) + daysToNextCol()), persist(), onRefresh()) },
      colNow && { l: '+500 fichas', fn: () => ((col().state.n += 500), persist(), onRefresh()) },
      colNow && { l: 'Ver su bienvenida', fn: () => ((col().state.intro = false), persist(), onRefresh()) },
    ] },
    { t: 'Evento del mes', sub: evNow ? `${evNow.name} · nivel ${Math.min(evNow.state.k + 1, EVENT_LEVELS)} de ${EVENT_LEVELS} · ${evNow.state.tk ? 'con boleto' : 'sin boleto'}` : 'no hay este mes', items: [
      { l: evNow ? 'Siguiente evento' : 'Ir al próximo', fn: () => ((save.devDay = (save.devDay || 0) + daysToNextEvent()), persist(), onRefresh()) },
      { l: 'Día antes del próximo', title: 'Mueve el reloj al último día del mes anterior: su botón sale gris con candado y la cuenta regresiva', fn: () => ((save.devDay = (save.devDay || 0) + daysToNextEvent() - 1), persist(), onRefresh()) },
      evNow && { l: 'Boleto ya', title: 'Da el boleto sin esperar las 24 horas', fn: () => evSet({}) },
      evNow && { l: 'Ir al jefe del planeta', fn: () => evSet({ k: Math.min(EVENT_LEVELS - 1, Math.floor(evNow.state.k / EVENT_PER_PLANET) * EVENT_PER_PLANET + EVENT_PER_PLANET - 1) }) },
      evNow && { l: 'Siguiente planeta', fn: () => evSet({ k: Math.min(EVENT_LEVELS - 1, (Math.floor(evNow.state.k / EVENT_PER_PLANET) + 1) * EVENT_PER_PLANET) }) },
      evNow && { l: 'Ganar todo hasta el último jefe', title: 'Gana los niveles que faltan (con sus premios) y te deja en el jefe del último planeta', fn: () => (ev().state.tk = 1, ev().state.run = null, winTo(ev, evEnter, evWin, EVENT_LEVELS - 1)) },
      evNow && { l: 'Empezar de cero', fn: () => ((save.ev = null), persist(), onRefresh()) },
    ] },
    { t: 'Festividad', sub: `${fiNow ? `${fiNow.name} · ${fiNow.soon ? (fiNow.inDays > 1 ? `en ${fiNow.inDays} días` : 'mañana') : `nivel ${Math.min(fiNow.state.k + 1, FL)} de ${FL}`}` : fiNext ? `próxima: ${fiNext.name} en ${fiNext.days} días` : 'ninguna lista'}${isOn('fiesta') ? '' : ` · se abre en el nivel ${UNLOCK.fiesta}`}`, items: [
      fiNext && fiNext.days > 3 && { l: `3 días antes de: ${fiNext.name}`, title: 'Mueve el reloj a 3 días de la siguiente fiesta: su botón sale gris con la cuenta regresiva', fn: () => toDay(fiNext.days - 3) },
      fiNow?.soon && { l: 'Que empiece ya', title: 'Mueve el reloj al día de la fiesta', fn: () => toDay(fiNow.inDays) },
      fiOn && { l: 'Ir al jefe del planeta', fn: () => fiSet({ k: Math.min(FL - 1, Math.floor(fiNow.state.k / FN) * FN + FN - 1) }) },
      fiOn && { l: 'Siguiente planeta', fn: () => fiSet({ k: Math.min(FL - 1, (Math.floor(fiNow.state.k / FN) + 1) * FN) }) },
      fiOn && { l: 'Ganar todo hasta el último jefe', title: 'Gana los niveles que faltan (con sus premios) y te deja en el jefe del último planeta', fn: () => ((fiesta().state.run = null), winTo(fiesta, fiEnter, fiWin, FL - 1)) },
      fiOn && { l: 'Empezar de cero', fn: () => ((save.fi = null), persist(), onRefresh()) },
      { l: 'Ver el aviso de Festividades', title: 'La ventana que sale al desbloquearlas (nivel 120), con 3 iconos', fn: () => (save.intro && delete save.intro.fiesta, persist(), onRefresh()) },
      { l: 'Ver el aviso de Leyendas', title: `La ventana que sale al llegar al nivel ${UNLOCK.fiesta2}, con las festividades nuevas`, fn: () => (save.intro && delete save.intro.fiesta2, persist(), onRefresh()) },
    ] },
    // Una por festividad: mueve el reloj al día en que empieza (la de este año). Las de leyendas, solo desde el nivel 200.
  ].map((sec) => ({ ...sec, items: sec.items.filter(Boolean) }));
  const all = S.flatMap((sec) => sec.items);
  const secHTML = (sec) => `<section class="dsec"><h4>${sec.t}${sec.sub ? `<small>${sec.sub}</small>` : ''}</h4>${sec.html || ''}<div class="dbtns">${sec.items.map((it) => `<button class="btn ${it.cls || 'ghost'}" data-i="${all.indexOf(it)}"${it.title ? ` title="${it.title}"` : ''}>${it.l}</button>`).join('')}</div></section>`;
  const m = openModal({
    title: 'Modo dev',
    cls: 'devmenu',
    wide: true,
    // Dos pestañas: los botones primero (lo que más se usa) y el recuento aparte.
    body: `<div class="dtabs"><button class="dtab on" data-tab="btns">Pruebas</button><button class="dtab" data-tab="count">Recuento</button></div>
      <div class="dpane" data-pane="count" hidden><section class="dsec">${recuento}</section></div>
      <div class="dpane" data-pane="btns"><p class="note">Todo lo que hagas aquí es de prueba: al salir del modo dev vuelve tu partida.</p>
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
    toDay(t === 'm' ? daysToMonth(+k) : daysToFiesta(k));
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
