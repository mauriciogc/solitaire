// Modo dev: probar niveles rápido sin jugarlos a mano.
// Se activa con ?dev en la URL (y se apaga con ?dev=0). Queda guardado en el navegador.
import { save, prefs, persist, resetProfile, backupOnce, restoreBackup, setDev } from './storage.js';
import { rachaWin, rachaLose, racha, RACHA_GOALS } from './events.js';
import { generateLevel, packGroups, worldInfo, TOTAL_LEVELS, LEVELS_PER_WORLD, MECH_NAMES, MECHANICS } from './levels.js';
import { playCasual, solve, initState } from './engine.js';
import { openModal, toast, updateCoins } from './ui.js';
import { mulberry32 } from './rng.js';
import { icon } from './art.js';

export const dev = {
  get on() {
    return !!prefs.dev;
  },
  get infinite() {
    return !!prefs.devInfinite;
  },
};

// Dónde estaba la galería, para volver a la misma página y filtros al salir de un nivel.
export const gallery = { start: 0, tpl: 'todas', boss: false, mA: '', mB: '', active: false };

export function initDevFromUrl() {
  const q = new URLSearchParams(location.search);
  if (!q.has('dev')) return;
  setDev(q.get('dev') !== '0');
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
  const sol = solve(L, initState(L));
  const ms = Math.round(performance.now() - t0);
  const free = L.cards.filter((c) => !c.coveredBy.length).length;
  const rows = [
    ['Nivel', `#${L.g + 1} · ${label(L.g)}${L.boss ? ' · JEFE' : ''}`],
    ['Forma', `${L.template} (${L.groups.length} grupo${L.groups.length > 1 ? 's' : ''})`],
    ['Dificultad d', L.d.toFixed(2)],
    ['Cartas tablero', `${L.cards.length} (${free} libres al inicio)`],
    ['Mazo', `${L.stock.length} = ${L.meta.chains - 1} inicios de cadena + ${L.meta.decoys} señuelos + ${L.meta.spares} sobrantes`],
    ['Mecánicas', L.meta.mechs.length ? L.meta.mechs.map((m) => MECH_NAMES[m]).join(', ') : 'ninguna'],
    ['Candados', L.meta.locks],
    ['Carta regalo', L.meta.pack ? `+${L.meta.pack} cartas al mazo` : 'no'],
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
      <select data-g="tpl">${TEMPLATES.map((t) => `<option${t === st.tpl ? ' selected' : ''}>${t}</option>`).join('')}</select>
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
    </div>
    <div class="g-grid"></div>`;
  const grid = el.querySelector('.g-grid');

  function render() {
    const items = [];
    let g = st.start;
    while (items.length < PAGE && g < TOTAL_LEVELS) {
      if (!st.boss || g % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1) {
        const L = generateLevel(g);
        const ms = L.meta.mechs;
        const okM = (m) => !m || (m === 'none' ? !ms.length : ms.includes(m));
        if ((st.tpl === 'todas' || L.template === st.tpl) && okM(st.mA) && okM(st.mB)) items.push(L);
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
          <div class="tl">${L.template} · d ${L.d.toFixed(2)} · ${L.cards.length} cartas · mazo ${L.stock.length}</div>
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
      if (span) span.textContent = `bot casual ${casualRate(L, 40)}%`;
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
    if (e.target.dataset.g === 'mA' || e.target.dataset.g === 'mB') {
      st[e.target.dataset.g] = e.target.value;
      st.start = 0;
    }
    render();
  });
  render();
  return el;
}

// ---------- Menú dev (desde el mapa) ----------
// Botones chicos en dos columnas (solo son de prueba). Todo se hace sobre la copia del modo dev:
// al salir del modo dev tu partida vuelve como estaba.
const REGION = 10;
function completeWorlds(from, to) {
  for (let w = from; w <= to; w++) for (let l = 0; l < LEVELS_PER_WORLD; l++) save.stars[w * LEVELS_PER_WORLD + l] = 3;
  save.next = Math.max(save.next, Math.min(TOTAL_LEVELS - 1, (to + 1) * LEVELS_PER_WORLD));
  save.open = Math.max(save.open, Math.min(Math.floor(save.next / LEVELS_PER_WORLD), to + 1));
  save.run = null;
  persist();
}
export function openDevMenu({ onGallery, onRefresh }) {
  const w = Math.min(Math.floor(save.next / LEVELS_PER_WORLD), save.open);
  const r = Math.floor(w / REGION);
  const toggle = (k, label) => ({
    label: `${label}: ${prefs[k] ? 'sí' : 'no'}`,
    cls: 'ghost',
    onClick: () => {
      prefs[k] = !prefs[k];
      persist();
      toast(`${label}: ${prefs[k] ? 'sí' : 'no'}`);
    },
  });
  openModal({
    title: 'Modo dev',
    cls: 'devmenu',
    body: '<p class="note">Todo lo que hagas aquí es de prueba: al salir del modo dev vuelve tu partida.</p>',
    buttons: [
      { label: 'Galería de niveles', cls: 'gold', onClick: onGallery },
      toggle('devInfinite', 'Boosters infinitos'),
      { label: '+1000 monedas', cls: 'ghost', onClick: () => ((save.coins += 1000), persist(), updateCoins()) },
      { label: 'Explicar mecánicas otra vez', cls: 'ghost', onClick: () => ((save.seen = {}), persist(), toast('Las explicaciones saldrán otra vez')) },
      { label: `Desbloquear mundo ${w + 1}`, cls: 'ghost', onClick: () => (completeWorlds(w, w), onRefresh()) },
      { label: `Desbloquear constelación ${r + 1}`, cls: 'ghost', onClick: () => (completeWorlds(w, Math.min(r * REGION + REGION - 1, TOTAL_LEVELS / LEVELS_PER_WORLD - 1)), onRefresh()) },
      {
        label: 'Desbloquear todo',
        cls: 'ghost',
        onClick: () => {
          save.next = TOTAL_LEVELS - 1;
          save.open = Math.floor(save.next / LEVELS_PER_WORLD);
          save.run = null;
          persist();
          onRefresh();
        },
      },
      { label: 'Reiniciar progreso', cls: 'ghost', onClick: () => (resetProfile(), onRefresh()) },
      // Eventos
      { label: `Racha +1 (va en ${racha().n})`, cls: 'ghost', onClick: () => (rachaWin(), onRefresh()) },
      {
        label: 'Racha: al siguiente premio',
        cls: 'ghost',
        onClick: () => {
          const g = RACHA_GOALS.find((x) => x.n > racha().n);
          if (!g) return toast('Ya llegó al último premio');
          while (racha().n < g.n) rachaWin();
          onRefresh();
        },
      },
      { label: 'Racha: perder', cls: 'ghost', onClick: () => (rachaLose(), onRefresh()) },
      { label: 'Racha: pasar al otro día', cls: 'ghost', onClick: () => ((save.devDay = (save.devDay || 0) + 1), persist(), onRefresh()) },
      {
        label: 'Empezar de cero las pruebas',
        cls: 'green',
        onClick: () => {
          restoreBackup();
          backupOnce();
          toast('Tu partida volvió a como estaba');
          onRefresh();
        },
      },
      { label: 'Salir del modo dev', cls: 'pink', onClick: () => (setDev(false), document.documentElement.classList.remove('dev-on'), toast('Tu partida volvió a como estaba'), onRefresh()) },
    ],
  });
}
