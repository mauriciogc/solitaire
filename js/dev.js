// Modo dev: probar niveles rápido sin jugarlos a mano.
// Se activa con ?dev en la URL (y se apaga con ?dev=0). Queda guardado en el navegador.
import { save, persist } from './storage.js';
import { generateLevel, packGroups, playCasual, solve, worldInfo, TOTAL_LEVELS, LEVELS_PER_WORLD } from './levels.js';
import { openModal, toast, updateCoins } from './ui.js';
import { mulberry32 } from './rng.js';
import { icon } from './lowpoly.js';

export const dev = {
  get on() {
    return !!save.dev;
  },
  get infinite() {
    return !!save.devInfinite;
  },
};

export function initDevFromUrl() {
  const q = new URLSearchParams(location.search);
  if (!q.has('dev')) return;
  save.dev = q.get('dev') !== '0';
  persist();
  history.replaceState(null, '', location.pathname);
}

const label = (g) => `Mundo ${Math.floor(g / LEVELS_PER_WORLD) + 1} · Nivel ${(g % LEVELS_PER_WORLD) + 1}`;

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
export function attachDevBar(game, { go }) {
  const g = game.level.g;
  const bar = document.createElement('div');
  bar.className = 'dev-bar';
  bar.innerHTML = `
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
  game.el.querySelector('.progress').before(bar);
}

function showInfo(L) {
  const t0 = performance.now();
  const sol = solve(L, new Array(L.cards.length).fill(false), L.stock, L.waste0);
  const ms = Math.round(performance.now() - t0);
  const free = L.cards.filter((c) => !c.coveredBy.length).length;
  const rows = [
    ['Nivel', `#${L.g + 1} · ${label(L.g)}${L.boss ? ' · JEFE' : ''}`],
    ['Forma', `${L.template} (${L.groups.length} grupo${L.groups.length > 1 ? 's' : ''})`],
    ['Dificultad d', L.d.toFixed(2)],
    ['Cartas tablero', `${L.cards.length} (${free} libres al inicio)`],
    ['Mazo', `${L.stock.length} = ${L.meta.chains - 1} inicios de cadena + ${L.meta.decoys} señuelos + ${L.meta.spares} sobrantes`],
    ['Candados', L.meta.locks],
    ['Bot casual gana', `${casualRate(L)}%`],
    ['Solucionador', sol ? `resuelve en ${sol.length} pasos (${ms} ms)` : `no encontró (${ms} ms)`],
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

function preview(L, W = 150, H = 104) {
  const { u, bw, bh, offsets } = packGroups(L.groups, W - 8, H - 8, 0.7, 26);
  const ox = (W - bw * u) / 2;
  const oy = (H - bh * u) / 2;
  const hue = worldInfo(L.world).hue;
  return L.cards
    .map((c) => {
      const o = offsets[c.group];
      const cls = ['m', c.coveredBy.length ? '' : 'free', c.lock != null ? 'lock' : '', c.key != null ? 'key' : ''].join(' ');
      return `<i class="${cls}" style="left:${ox + (o.x + c.x) * u}px;top:${oy + (o.y + c.y) * u}px;width:${u}px;height:${u * 1.4}px;rotate:${c.rot}deg;z-index:${c.z};--hue:${hue}"></i>`;
    })
    .join('');
}

export function galleryScreen({ start = 0, onPlay, onBack }) {
  const st = { start, tpl: 'todas', boss: false };
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
      <select data-g="tpl">${TEMPLATES.map((t) => `<option>${t}</option>`).join('')}</select>
      <label><input type="checkbox" data-g="boss"> solo jefes</label>
    </div>
    <div class="g-grid"></div>`;
  const grid = el.querySelector('.g-grid');

  function render() {
    const items = [];
    let g = st.start;
    while (items.length < PAGE && g < TOTAL_LEVELS) {
      if (!st.boss || g % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1) {
        const L = generateLevel(g);
        if (st.tpl === 'todas' || L.template === st.tpl) items.push(L);
      }
      g++;
      if (g - st.start > 4000) break; // filtros muy estrictos: no colgar la página
    }
    st.end = g;
    el.querySelector('.g-range').textContent = `#${st.start + 1} – #${g}`;
    grid.innerHTML = items
      .map(
        (L) => `<button class="tile" data-play="${L.g}">
          <div class="pv">${preview(L)}</div>
          <div class="tl"><b>#${L.g + 1}</b> ${label(L.g)}${L.boss ? ' · jefe' : ''}</div>
          <div class="tl">${L.template} · d ${L.d.toFixed(2)} · ${L.cards.length} cartas · mazo ${L.stock.length}${L.meta.locks ? ` · ${L.meta.locks} candado` : ''}</div>
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
      if (span) span.textContent = `bot casual ${casualRate(L, 40)}%`;
      setTimeout(next, 0);
    };
    setTimeout(next, 30); // tras montar la pantalla
    grid.scrollTop = 0;
  }

  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-play]');
    if (t) return onPlay(+t.dataset.play);
    const a = e.target.closest('[data-g]')?.dataset.g;
    if (a === 'back') return onBack();
    if (a === 'prev') {
      st.start = Math.max(0, st.start - PAGE);
      render();
    }
    if (a === 'next' && st.end < TOTAL_LEVELS) {
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
    if (e.target.dataset.g === 'tpl') st.tpl = e.target.value;
    if (e.target.dataset.g === 'boss') st.boss = e.target.checked;
    render();
  });
  render();
  return el;
}

// ---------- Menú dev (desde el mapa) ----------
export function openDevMenu({ onGallery, onPlay, onRefresh }) {
  openModal({
    title: 'Modo dev',
    body: '<p>Las victorias en niveles más allá de tu progreso no se guardan.</p>',
    buttons: [
      { label: 'Galería de niveles', onClick: onGallery },
      {
        label: 'Ir a nivel…',
        onClick: () => {
          const g = askLevel(save.next);
          if (g != null) onPlay(g);
        },
      },
      {
        label: `Boosters infinitos: ${dev.infinite ? 'SÍ' : 'no'}`,
        cls: 'ghost',
        onClick: () => {
          save.devInfinite = !save.devInfinite;
          persist();
          toast(`Boosters infinitos: ${save.devInfinite ? 'sí' : 'no'}`);
        },
      },
      {
        label: '+1000 monedas',
        cls: 'ghost',
        onClick: () => {
          save.coins += 1000;
          persist();
          updateCoins();
        },
      },
      {
        label: 'Desbloquear todo',
        cls: 'ghost',
        onClick: () => {
          save.next = TOTAL_LEVELS - 1;
          persist();
          onRefresh();
        },
      },
      {
        label: 'Reiniciar progreso',
        cls: 'ghost',
        onClick: () => {
          Object.assign(save, { next: 0, stars: {}, coins: 300, wild: 3, undo: 5, tutorial: false });
          persist();
          onRefresh();
        },
      },
      {
        label: 'Salir del modo dev',
        cls: 'ghost',
        onClick: () => {
          save.dev = false;
          persist();
          onRefresh();
        },
      },
    ],
  });
}
