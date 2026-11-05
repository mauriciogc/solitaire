// Modo dev: probar niveles rápido sin jugarlos a mano.
// Se activa con ?dev en la URL (y se apaga con ?dev=0). Queda guardado en el navegador.
import { save, prefs, persist, resetProfile, backupOnce, restoreBackup, setDev } from './storage.js';
import { rachaWin, rachaLose, racha, nextGoal, col, daysToNextCol, ev, daysToNextEvent, evEnter, evWin, EVENT_PER_PLANET, EVENT_LEVELS, fiesta, fiEnter, fiWin, nextFiesta, daysToNextFiesta, daysToFiesta, fiShape, isOn, UNLOCK } from './events.js';
import { generateLevel, packGroups, worldInfo, specials, specialGroup, SPECIAL_ID, TOTAL_LEVELS, LEVELS_PER_WORLD, MECH_NAMES, MECHANICS, MECH_INTRO, SCROLL_FROM } from './levels.js';
import { playCasual, solve, initState } from './engine.js';
import { openModal, toast, updateCoins, popGoal } from './ui.js';
import { mulberry32 } from './rng.js';
import { icon, miniPlanet } from './art.js';
import { tableHTML, BIOMES, biomeKey } from './biomes.js';
import { peek } from './galaxy.js';
import { EVENTOS, COLECCIONES, FIESTAS } from './events.js';
import { ITEMS, SECTIONS, owns, lockedUntil } from './shop.js';

export const dev = {
  get on() {
    return !!prefs.dev;
  },
  get infinite() {
    return !!prefs.devInfinite;
  },
};

// Dónde estaba la galería, para volver a la misma página y filtros al salir de un nivel.
export const gallery = { start: 0, tpl: 'todas', boss: false, mA: '', mB: '', help: '', active: false };

export function initDevFromUrl() {
  const q = new URLSearchParams(location.search);
  if (!q.has('dev')) return;
  setDev(q.get('dev') !== '0');
  history.replaceState(null, '', location.pathname);
}

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
export function attachDevBar(game, { go, toGallery }) {
  const g = game.level.g;
  const bar = document.createElement('div');
  bar.className = 'dev-bar';
  bar.innerHTML = `
    <button data-d="gal">▦ Galería</button>
    <span class="sep"></span>
    <button data-d="prev" ${g === 0 ? 'disabled' : ''}>◀</button>
    <button data-d="goto" title="Ir a nivel">#${g + 1}</button>
    <button data-d="next" ${g >= TOTAL_LEVELS - 1 ? 'disabled' : ''}>▶</button>
    <span class="sep"></span>
    <button data-d="reveal">Ver todo</button>
    <button data-d="sol">Solución</button>
    <button data-d="step">Paso</button>
    <button data-d="auto">Resolver</button>
    <button data-d="win">Ganar</button>
    <button data-d="info">Info</button>`;
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
const TEMPLATES = ['todas', 'clusters', 'pyramid', 'peaks', 'wall', 'diamond', 'scatter', 'towers', 'layers', 'invPyramid'];
// Fase 7: formas y piezas nuevas (solo salen en niveles sin ayudas) y respiros.
const PIECES = ['sandwich', 'cross', 'steps', 'rosette', 'tiltFan', 'crown'];
const TPL_OPTS = [
  ...[...TEMPLATES, 'butterfly', 'heart', 'spiral', 'star', 'hourglass', 'mesa', 'nebulosa', 'gravedad'].map((t) => [t, t]),
  ...PIECES.map((k) => [`pz:${k}`, `pieza ${k}`]),
  ['respiros', 'respiros'],
];
const okTpl = (L, t) => t === 'todas' || (t === 'respiros' ? !!L.respite : t.startsWith('pz:') ? !!L.pieces?.includes(t.slice(3)) : L.template === t);
const tplName = (L) => L.template + (L.pieces ? ` (${L.pieces.join(', ')})` : '');
// Etiqueta según el % del bot casual (ver tabla de la Fase 7): fácil ≥75, medio ≥50, difícil ≥25, muy difícil.
const rateTag = (L, p) => (L.help ? `pide ${L.help}` : p >= 75 ? 'fácil' : p >= 50 ? 'medio' : p >= 25 ? 'difícil' : 'muy difícil');

function preview(L, W = 150, H = 104) {
  const { u, bw, bh, offsets } = packGroups(L.groups, W - 8, H - 8, 0.7, 26);
  const ox = (W - bw * u) / 2;
  const oy = (H - bh * u) / 2;
  const hue = worldInfo(L.world).hue;
  return L.cards
    .map((c) => {
      const o = offsets[c.group];
      const cls = ['m', c.coveredBy.length ? '' : 'free', c.lock != null ? 'lock' : '', c.key != null ? 'key' : '', c.pack ? 'pack' : '', c.ice ? 'ice' : '', c.bomb ? 'bomb' : '', c.live ? 'live' : '', c.alt != null ? 'alt' : '', c.arrow ? 'arrow' : '', c.curtain != null ? 'curtain' : ''].join(' ');
      return `<i class="${cls}" style="left:${ox + (o.x + c.x) * u}px;top:${oy + (o.y + c.y) * u}px;width:${u}px;height:${u * 1.4}px;rotate:${c.rot}deg;z-index:${c.z};--hue:${hue}"></i>`;
    })
    .join('');
}

export function galleryScreen({ onPlay, onBack }) {
  const st = gallery;
  const el = document.createElement('div');
  el.className = 'screen gallery';
  el.innerHTML = `
    <header class="top">
      <button class="icon-btn" data-g="back" aria-label="Volver">${icon('close')}</button>
      <b>Galería dev</b>
      <span></span>
    </header>
    <div class="g-controls">
      <button data-g="prev">◀</button>
      <button data-g="goto" class="g-range"></button>
      <button data-g="next">▶</button>
      <select data-g="tpl">${TPL_OPTS.map(([v, t]) => `<option value="${v}"${v === st.tpl ? ' selected' : ''}>${t}</option>`).join('')}</select>
      <label><input type="checkbox" data-g="boss"${st.boss ? ' checked' : ''}> solo jefes</label>
      ${['mA', 'mB']
        .map(
          (k, i) => `<select data-g="${k}">
            <option value="">${i ? '+ otra mecánica' : 'mecánica: todas'}</option>
            ${i ? '' : `<option value="none"${st[k] === 'none' ? ' selected' : ''}>sin mecánicas</option>`}
            ${MECHANICS.map((m) => `<option value="${m}"${st[k] === m ? ' selected' : ''}>${MECH_NAMES[m]}</option>`).join('')}
          </select>`,
        )
        .join('')}
      <select data-g="help">
        ${[['', 'ayudas: todas'], ['any', 'piden ayuda'], ['1', 'piden 1'], ['2', 'piden 2'], ['3', 'piden 3'], ['s1', 'especiales de 1'], ['s2', 'especiales de 2'], ['s3', 'especiales de 3'], ['s4', 'especiales de 4']]
          .map(([v, t]) => `<option value="${v}"${st.help === v ? ' selected' : ''}>${t}</option>`)
          .join('')}
      </select>
    </div>
    <div class="g-grid"></div>`;
  const grid = el.querySelector('.g-grid');

  // Especiales: se recorre su lista (st.start cuenta dentro de ella); si no, los niveles del camino.
  const list = () => (st.help[0] === 's' ? specials(+st.help[1]).map((i) => SPECIAL_ID + i) : null);
  const last = () => list()?.length ?? TOTAL_LEVELS;
  function render() {
    const items = [], sp = list(), end = last();
    let g = st.start;
    while (items.length < PAGE && g < end) {
      const id = sp ? sp[g] : g;
      if (!st.boss || id % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1 || sp) {
        const L = generateLevel(id);
        const ms = L.meta.mechs;
        const okM = (m) => !m || (m === 'none' ? !ms.length : ms.includes(m));
        const okH = sp || !st.help || (st.help === 'any' ? L.help : L.help === +st.help);
        if (okTpl(L, st.tpl) && okM(st.mA) && okM(st.mB) && okH && (!st.boss || L.boss)) items.push(L);
      }
      g++;
      if (g - st.start > 4000) break; // filtros muy estrictos: no colgar la página
    }
    st.end = g;
    el.querySelector('.g-range').textContent = sp ? `especiales ${st.start + 1} – ${g} de ${end}` : `#${st.start + 1} – #${g}`;
    grid.innerHTML = items
      .map(
        (L) => `<button class="tile" data-play="${L.g}">
          <div class="pv">${preview(L)}</div>
          <div class="tl"><b>${L.special != null ? '' : `#${L.g + 1}`}</b> ${label(L.g)}${L.boss ? ' · jefe' : ''}${L.respite ? ' · <b>respiro</b>' : ''}${L.help ? ` · <b>pide ${L.help}</b>` : ''}</div>
          <div class="tl">${tplName(L)} · d ${L.d.toFixed(2)} · ${L.cards.length} cartas · mazo ${L.stock.length}</div>
          <div class="tl mechs">${L.meta.mechs.map((m) => `<i class="tag m-${m}">${MECH_NAMES[m]}</i>`).join('') || '—'}</div>
          <div class="tl rate" data-rate="${L.g}">bot …</div>
        </button>`,
      )
      .join('');
    // El % del bot se calcula después, para no bloquear el dibujo.
    let i = 0;
    const next = () => {
      const L = items[i++];
      if (!L || !el.isConnected) return;
      const span = grid.querySelector(`[data-rate="${L.g}"]`);
      if (span) {
        const p = casualRate(L, 40);
        span.textContent = `bot casual ${p}% · ${rateTag(L, p)}`;
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
    const a = e.target.closest('[data-g]')?.dataset.g;
    if (a === 'back') {
      st.active = false;
      return onBack();
    }
    if (a === 'prev') {
      st.start = Math.max(0, st.start - PAGE);
      render();
    }
    if (a === 'next' && st.end < last()) {
      st.start = st.end;
      render();
    }
    if (a === 'goto') {
      const n = askLevel(st.start);
      if (n != null) {
        st.start = n;
        render();
      }
    }
  });
  el.addEventListener('change', (e) => {
    if (e.target.dataset.g === 'tpl') {
      st.tpl = e.target.value;
      st.start = 0;
    }
    if (e.target.dataset.g === 'boss') st.boss = e.target.checked;
    if (e.target.dataset.g === 'help') {
      st.help = e.target.value;
      st.start = 0;
    }
    if (e.target.dataset.g === 'mA' || e.target.dataset.g === 'mB') {
      st[e.target.dataset.g] = e.target.value;
      st.start = 0;
    }
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
export function openDevMenu({ onGallery, onPlanets, onRefresh }) {
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
  const origin = (it) => (!it.ev ? 'tienda' : FIESTAS.some((f) => f.key === it.ev) ? 'fiesta' : Object.values(EVENTOS).some((e) => e.key === it.ev) ? 'mes' : 'col');
  const ORI = [['tienda', 'Tienda'], ['col', 'Colección'], ['mes', 'Del mes'], ['fiesta', 'De un día']];
  const cnt = (sec, o) => ITEMS[sec].filter((it) => origin(it) === o).length;
  const mine = (sec, o) => ITEMS[sec].filter((it) => origin(it) === o && owns(sec, it.k)).length;
  const cell = (sec, o) => (cnt(sec, o) ? `${mine(sec, o)}/${cnt(sec, o)}` : '–');
  const sum = (f) => SECTIONS.reduce((n, { k }) => n + f(k), 0);
  // Desde qué nivel ganado se abre cada cosa, y si tú ya llegaste.
  const won = save.next || 0;
  const opens = (lvl) => (won >= lvl ? `<em class="d-ok">abierto</em>` : `<em class="d-no">faltan ${lvl - won}</em>`);
  const UN = [['Racha', UNLOCK.racha], ['Colección (4 temáticas)', UNLOCK.col], ['Evento del mes', UNLOCK.mes], ['Colección: Dinos y Robots y 3.ª semana', UNLOCK.col2], ['Festividades de un día', UNLOCK.fiesta], ['Colección: Arte, Música y Cine, todas las semanas', UNLOCK.col3], ['Festividades de leyendas mexicanas', UNLOCK.fiesta2]];
  const lastNeed = Math.max(...Object.values(ITEMS).flat().map((it) => it.need || 0));
  const shopLocked = sum((k) => ITEMS[k].filter((it) => lockedUntil(k, it.k)).length);
  const chips = (list) => `<div class="dcount">${list.map(([ico, txt]) => `<span>${icon(ico)}${txt}</span>`).join('')}</div>`;
  const recuento = `<p class="dline"><b>Tú: ${won} niveles ganados</b> (mundo ${(save.open || 0) + 1})</p>
    <table class="dtable"><tr><th>Se abre</th><th>Nivel</th><th>Tú</th></tr>${UN.map(([n, l]) => `<tr><td>${n}</td><td>${l}</td><td>${opens(l)}</td></tr>`).join('')}</table>
    <p class="dline"><b>Cartas especiales</b> (aparecen en el primer nivel de su mundo)</p>
    <table class="dtable"><tr><th>Carta</th><th>Mundo</th><th>Nivel</th><th>Tú</th></tr>${MECHANICS.map((m) => `<tr><td>${MECH_NAMES[m]}</td><td>${MECH_INTRO[m] + 1}</td><td>${MECH_INTRO[m] * LEVELS_PER_WORLD + 1}</td><td>${opens(MECH_INTRO[m] * LEVELS_PER_WORLD)}</td></tr>`).join('')}
    ${Object.entries(SCROLL_FROM).map(([k, g]) => `<tr><td>Tablero: ${k === 'mesa' ? 'mesa enrollada' : k}</td><td>${Math.floor(g / LEVELS_PER_WORLD) + 1}</td><td>${g + 1}</td><td>${opens(g)}</td></tr>`).join('')}</table>
    <p class="dline"><b>${evs.length + COLECCIONES.length + fis.length} eventos</b>: ${evs.length} del mes · ${COLECCIONES.length} colecciones · ${fis.length} de un día</p>
    <p class="dline"><b>Del mes (${evs.length})</b></p>${chips(evs.map(([m, e]) => [e.ico, `${MES[m]} · ${e.name}`]))}
    <p class="dline"><b>Colecciones (${COLECCIONES.length})</b></p>${chips(COLECCIONES.map((c) => [c.token, c.name]))}
    <p class="dline"><b>De un día (${fis.length})</b></p>${chips(fis.map((f) => { const d = f.date(y); return [f.ico, `${d.getDate()} ${MES[d.getMonth()]} · ${f.name}`]; }))}
    <p class="dline"><b>Tienda: tienes ${sum((k) => ITEMS[k].filter((it) => owns(k, it.k)).length)} de ${Object.values(ITEMS).flat().length}</b> (tuyas / que hay)</p>
    <table class="dtable"><tr><th></th>${ORI.map(([, n]) => `<th>${n}</th>`).join('')}<th>Total</th></tr>${SECTIONS.map(({ k, name }) => `<tr><td>${name}</td>${ORI.map(([o]) => `<td>${cell(k, o)}</td>`).join('')}<td><b>${ITEMS[k].filter((it) => owns(k, it.k)).length}/${ITEMS[k].length}</b></td></tr>`).join('')}<tr><td><b>Total</b></td>${ORI.map(([o]) => `<td><b>${sum((k) => mine(k, o))}/${sum((k) => cnt(k, o))}</b></td>`).join('')}<td><b>${sum((k) => ITEMS[k].filter((it) => owns(k, it.k)).length)}/${Object.values(ITEMS).flat().length}</b></td></tr></table>
    <p class="dline">De la tienda, ${shopLocked} siguen con candado por mundo; lo último se abre en el mundo ${lastNeed + 1} (nivel ${lastNeed * LEVELS_PER_WORLD + 1}).</p>`;
  // Secciones con título; cada botón dice en corto lo que hace (la explicación larga va en su title).
  const S = [
    { t: 'General', items: [
      { l: 'Galería de niveles', cls: 'gold', fn: onGallery },
      { l: 'Galería de planetas', cls: 'gold', title: 'Cada tipo de planeta: verlo en el mapa o jugar en su mesa', fn: onPlanets },
      { l: `Boosters infinitos: ${prefs.devInfinite ? 'sí' : 'no'}`, fn: () => { prefs.devInfinite = !prefs.devInfinite; persist(); toast(`Boosters infinitos: ${prefs.devInfinite ? 'sí' : 'no'}`); } },
      { l: '+1000 monedas', fn: () => ((save.coins += 1000), persist(), updateCoins()) },
      { l: '+20,000 monedas', fn: () => ((save.coins += 20000), persist(), updateCoins()) },
      { l: 'Explicar mecánicas', title: 'Las explicaciones de cada mecánica salen otra vez', fn: () => ((save.seen = {}), persist(), toast('Las explicaciones saldrán otra vez')) },
      { l: 'Recorrido de botones', title: 'El recorrido de los botones de la izquierda sale otra vez al cerrar este menú', fn: () => { delete save.sideTour; persist(); onRefresh(); } },
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
  // Pestaña Fechas: mover el reloj al primer día de un evento del mes o al día de una festividad.
  const F = [
    { t: 'Eventos del mes', sub: isOn('mes') ? 'el reloj cae en el día 1 del mes' : `se abren en el nivel ${UNLOCK.mes}`, items: evs.map(([m, e]) => ({ l: `${e.name} · ${MES[m]}`, title: `Mueve el reloj al 1 de ${MES[m]}`, fn: () => toDay(daysToMonth(+m)) })) },
    { t: 'Festividades', sub: isOn('fiesta2') ? 'el reloj cae en su primer día' : `las de leyendas (⚑) se abren en el nivel ${UNLOCK.fiesta2}`, items: fis.map((f) => {
      const d = f.date(y);
      return { l: `${f.local && !isOn('fiesta2') ? '⚑ ' : ''}${f.name} · ${d.getDate()} ${MES[d.getMonth()]}`, title: `Mueve el reloj al ${d.getDate()} de ${MES[d.getMonth()]}, cuando empieza`, fn: () => toDay(daysToFiesta(f.key)) };
    }) }
  ];
  const all = [...S, ...F].flatMap((sec) => sec.items);
  const secHTML = (sec) => `<section class="dsec"><h4>${sec.t}${sec.sub ? `<small>${sec.sub}</small>` : ''}</h4>${sec.html || ''}<div class="dbtns">${sec.items.map((it) => `<button class="btn ${it.cls || 'ghost'}" data-i="${all.indexOf(it)}"${it.title ? ` title="${it.title}"` : ''}>${it.l}</button>`).join('')}</div></section>`;
  const m = openModal({
    title: 'Modo dev',
    cls: 'devmenu',
    wide: true,
    // Dos pestañas: los botones primero (lo que más se usa) y el recuento aparte.
    body: `<div class="dtabs"><button class="dtab on" data-tab="btns">Pruebas</button><button class="dtab" data-tab="dates">Fechas</button><button class="dtab" data-tab="count">Recuento</button></div>
      <div class="dpane" data-pane="dates" hidden>${F.map(secHTML).join('')}</div>
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
  m.el.querySelectorAll('.dsec [data-i]').forEach((b) => b.addEventListener('click', () => { m.close(); all[+b.dataset.i].fn(); }));
}
