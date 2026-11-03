import { mulberry32, hash, randInt, pick, shuffle } from './rng.js';
import { follows, mod13, solve, initState } from './engine.js';
import { EVENT_DATA } from './event-data.js';
import { HARD_DATA } from './path-data.js';
import { SPECIAL_DATA } from './special-data.js';

// Unidades del tablero: una carta mide W x H. Posiciones = esquina superior izquierda.
export const W = 1;
export const H = 1.4;
const ROW = 0.62; // paso vertical entre filas que se solapan

export const WORLD_COUNT = 520;
export const LEVELS_PER_WORLD = 10;
export const TOTAL_LEVELS = WORLD_COUNT * LEVELS_PER_WORLD;

// ---------- Mundos ----------
const PLACES = [
  ['Bosque', 'm', '🌲', 130], ['Valle', 'm', '🏞️', 100], ['Isla', 'f', '🏝️', 180],
  ['Castillo', 'm', '🏰', 260], ['Pantano', 'm', '🐸', 90], ['Desierto', 'm', '🏜️', 35],
  ['Arrecife', 'm', '🐠', 195], ['Montaña', 'f', '⛰️', 220], ['Pradera', 'f', '🌼', 75],
  ['Cueva', 'f', '🦇', 275], ['Jardín', 'm', '🌷', 330], ['Puerto', 'm', '⚓', 210],
  ['Glaciar', 'm', '🧊', 190], ['Volcán', 'm', '🌋', 10], ['Lago', 'm', '🦢', 200],
  ['Ciudad', 'f', '🏙️', 240], ['Selva', 'f', '🦜', 120], ['Cañón', 'm', '🌵', 25],
  ['Cielo', 'm', '☁️', 205], ['Granja', 'f', '🐄', 60], ['Pueblo', 'm', '🏘️', 30],
  ['Templo', 'm', '⛩️', 350], ['Mina', 'f', '⛏️', 40], ['Feria', 'f', '🎡', 300],
];
const ADJ = [
  ['Encantado', 'Encantada'], ['Dorado', 'Dorada'], ['Brumoso', 'Brumosa'],
  ['Estrellado', 'Estrellada'], ['Helado', 'Helada'], ['Florido', 'Florida'],
  ['Lunar', 'Lunar'], ['Escondido', 'Escondida'], ['Mágico', 'Mágica'],
  ['Soleado', 'Soleada'], ['Dulce', 'Dulce'], ['Salvaje', 'Salvaje'],
  ['Antiguo', 'Antigua'], ['Brillante', 'Brillante'], ['Secreto', 'Secreta'],
  ['Tranquilo', 'Tranquila'], ['Esmeralda', 'Esmeralda'], ['Carmesí', 'Carmesí'],
  ['Plateado', 'Plateada'], ['Eterno', 'Eterna'], ['Risueño', 'Risueña'],
  ['Perdido', 'Perdida'], ['Celeste', 'Celeste'], ['Otoñal', 'Otoñal'],
];
// 24 lugares × 24 adjetivos = 576 nombres únicos, en orden barajado fijo.
const COMBOS = shuffle(mulberry32(777), [...Array(PLACES.length * ADJ.length).keys()]);

export function worldInfo(w) {
  const c = COMBOS[w % COMBOS.length];
  const [place, gender, emoji, hue] = PLACES[c % PLACES.length];
  const adj = ADJ[Math.floor(c / PLACES.length)][gender === 'm' ? 0 : 1];
  return {
    index: w,
    name: `${place} ${adj}`,
    place,
    emoji,
    hue: (hue + ((w * 37) % 40) - 20 + 360) % 360,
  };
}

// ---------- Dificultad ----------
// 0 = muy fácil, 1 = máximo. Sube rápido al principio y luego despacio.
export function difficulty(g) {
  const boss = g % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1;
  const d = 0.05 + 0.5 * (1 - Math.exp(-g / 150)) + (g / TOTAL_LEVELS) * 0.45;
  return Math.min(1, d + (boss ? 0.1 : 0));
}

// ---------- Plantillas de tablero ----------
function rowOf(n, y, z, out, dx = 0) {
  for (let j = 0; j < n; j++) out.push({ x: -(n - 1) / 2 + j + dx, y, z });
}

const TEMPLATES = {
  pyramid(r, d) {
    const R = randInt(r, 4, 4 + Math.round(d * 3));
    const out = [];
    for (let i = 0; i < R; i++) rowOf(i + 1, i * ROW, i, out);
    return out;
  },
  peaks(r, d) {
    const [P, R] = pick(r, d < 0.2 ? [[2, 3]] : [[2, 3], [3, 3], [2, 4], [3, 3]]);
    const out = [];
    for (let k = 0; k < P; k++)
      for (let row = 0; row < R; row++)
        for (let j = 0; j <= row; j++) out.push({ x: k * R - row / 2 + j, y: row * ROW, z: row });
    for (let j = 0; j < P * R + 1; j++) out.push({ x: -R / 2 + j, y: R * ROW, z: R });
    return out;
  },
  wall(r, d) {
    const rows = randInt(r, 3, 3 + Math.round(d * 2));
    const cols = randInt(r, 5, 7);
    const out = [];
    for (let i = 0; i < rows; i++) rowOf(i % 2 ? cols - 1 : cols, i * ROW, i, out);
    return out;
  },
  diamond(r) {
    const R = randInt(r, 4, 5);
    const sizes = [...Array(R).keys()].map((i) => i + 1);
    const all = [...sizes, ...sizes.slice(0, -1).reverse()];
    const out = [];
    all.forEach((s, i) => rowOf(s, i * ROW, i, out));
    return out;
  },
  invPyramid(r, d) {
    const R = randInt(r, 5, 5 + Math.round(d * 2));
    const out = [];
    for (let i = 0; i < R; i++) rowOf(R - i, i * ROW, i, out);
    return out;
  },
  towers(r, d) {
    const C = randInt(r, 4, 6);
    const Hh = randInt(r, 3, 3 + Math.round(d * 3));
    const out = [];
    for (let k = 0; k < C; k++)
      for (let i = 0; i < Hh; i++) out.push({ x: (k - (C - 1) / 2) * 1.12, y: i * 0.4, z: i });
    return out;
  },
  layers(r, d) {
    const cols = randInt(r, 5, 7);
    const rows = randInt(r, 2, 3);
    const out = [];
    for (let rr = 0; rr < rows; rr++)
      for (let c = 0; c < cols; c++) out.push({ x: (c - (cols - 1) / 2) * 1.08, y: rr * 1.5, z: 0 });
    for (let rr = 0; rr < rows - 1; rr++)
      for (let c = 0; c < cols - 1; c++)
        out.push({ x: (c + 0.5 - (cols - 1) / 2) * 1.08, y: rr * 1.5 + 0.75, z: 1 });
    if (d > 0.5 && rows === 3)
      for (let c = 0; c < cols - 2; c++) out.push({ x: (c + 1 - (cols - 1) / 2) * 1.08, y: 1.5, z: 2 });
    return out;
  },
  scatter(r) {
    const rows = randInt(r, 4, 6);
    const out = [];
    for (let i = 0; i < rows; i++) {
      const xs = [];
      const center = r() < 0.5;
      if (center) xs.push(0);
      let last = center ? 0 : -0.5;
      for (let x = center ? 1 : 0.5; x <= 4; x += 0.5) {
        if (x - last >= 1 && r() < 0.55) { xs.push(x, -x); last = x; }
      }
      if (!xs.length) xs.push(0);
      xs.forEach((x) => out.push({ x, y: i * ROW, z: i }));
    }
    return out;
  },
};

// ---------- Grupos pequeños (para tableros con piezas separadas) ----------
// Cada uno devuelve cartas locales {x, y, z, rot}. rot en grados, gira sobre el centro.
// Regla: dos cartas que se solapan nunca comparten z.
const SMALL = {
  miniPyramid(r) {
    const R = randInt(r, 3, 4);
    const out = [];
    for (let i = 0; i < R; i++) rowOf(i + 1, i * ROW, i, out);
    return out;
  },
  miniInv(r) {
    const R = randInt(r, 3, 4);
    const out = [];
    for (let i = 0; i < R; i++) rowOf(R - i, i * ROW, i, out);
    return out;
  },
  stack(r) {
    const n = randInt(r, 4, 6);
    return Array.from({ length: n }, (_, i) => ({ x: (r() - 0.5) * 0.12, y: i * 0.3, z: i, rot: (r() - 0.5) * 8 }));
  },
  arc(r) {
    const n = pick(r, [5, 7, 9]);
    const mid = (n - 1) / 2;
    const R = 1.9 + n * 0.06;
    return Array.from({ length: n }, (_, i) => {
      const t = ((160 - (140 * i) / (n - 1)) * Math.PI) / 180;
      const cx = R * Math.cos(t);
      const cy = R * Math.sin(t);
      const base = mid - Math.abs(i - mid);
      return { x: cx - W / 2, y: cy - H / 2, rot: ((t * 180) / Math.PI - 90) * 0.55, z: base * 2 + (i > mid ? 1 : 0) };
    });
  },
  ring(r) {
    const n = 12;
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2 - Math.PI / 2;
      out.push({ x: 2.2 * Math.cos(t) - W / 2, y: 2.6 * Math.sin(t) - H / 2, z: i, rot: Math.sin(t * 2) * 10 });
    }
    const c = randInt(r, 2, 3);
    for (let k = 0; k < c; k++) out.push({ x: -W / 2, y: -H / 2 + (k - (c - 1) / 2) * 0.28, z: n + k, rot: (r() - 0.5) * 10 });
    return out;
  },
  fan(r) {
    const n = randInt(r, 5, 7);
    const mid = (n - 1) / 2;
    return Array.from({ length: n }, (_, i) => ({ x: i * 0.45, y: 0.09 * (i - mid) ** 2, z: i, rot: (i - mid) * 9 }));
  },
  twoRows(r) {
    const n = randInt(r, 3, 4);
    const out = [];
    rowOf(n, 0, 0, out);
    rowOf(n - 1, ROW, 1, out);
    return out;
  },
};

// Junta 2-4 grupos pequeños; el juego los acomoda según la pantalla.
function clusters(r, d, boss) {
  const k = Math.min(4, (d < 0.2 ? 2 : randInt(r, 2, d < 0.5 ? 3 : 4)) + (boss ? 1 : 0));
  const big = ['arc', 'ring'];
  const names = Object.keys(SMALL);
  const chosen = [];
  for (let i = 0; i < k; i++) {
    let name = pick(r, names);
    if (big.includes(name) && chosen.filter((c) => big.includes(c)).length >= 1) name = pick(r, ['miniPyramid', 'stack', 'twoRows']);
    chosen.push(name);
  }
  const seeds = chosen.map(() => randInt(r, 0, 1e9));
  // Simétrico: con 3 grupos, el primero y el último suelen ser idénticos.
  if (k === 3 && r() < 0.6) {
    chosen[2] = chosen[0];
    seeds[2] = seeds[0];
  }
  return chosen.map((name, i) => SMALL[name](mulberry32(seeds[i])));
}

// [nombre, dificultad mínima, peso]
const TEMPLATE_UNLOCK = [
  ['pyramid', 0, 1], ['peaks', 0, 1], ['clusters', 0.07, 4], ['wall', 0.1, 1], ['diamond', 0.14, 1],
  ['scatter', 0.18, 1], ['towers', 0.22, 1], ['layers', 0.28, 1], ['invPyramid', 0.34, 1],
];

function chooseTemplate(r, g, d) {
  if (g < 3) return ['pyramid', 'peaks', 'clusters'][g];
  // Jefes: las formas que más cuesta limpiar (medido con tests/difficulty.mjs).
  if (g % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1 && d > 0.15) return pick(r, ['peaks', 'peaks', 'diamond', 'pyramid', 'wall', 'scatter']);
  const ok = TEMPLATE_UNLOCK.filter(([, min]) => min <= d);
  let t = r() * ok.reduce((s, [, , w]) => s + w, 0);
  for (const [name, , w] of ok) if ((t -= w) < 0) return name;
  return ok[0][0];
}

// Esquinas de una carta (ligeramente encogida para que un roce no cuente como tapar).
function corners(c) {
  const a = ((c.rot || 0) * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const cx = c.x + W / 2;
  const cy = c.y + H / 2;
  const hw = (W - 0.02) / 2;
  const hh = (H - 0.04) / 2;
  return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => [cx + x * cos - y * sin, cy + x * sin + y * cos]);
}

// ¿Se solapan dos cartas? (teorema del eje separador para rectángulos girados)
export function overlaps(a, b) {
  if (!a.rot && !b.rot) return Math.abs(a.x - b.x) < W - 0.02 && Math.abs(a.y - b.y) < H - 0.04;
  const A = corners(a);
  const B = corners(b);
  for (const P of [A, B]) {
    for (let i = 0; i < 2; i++) {
      const [x1, y1] = P[i];
      const [x2, y2] = P[i + 1];
      const nx = y2 - y1;
      const ny = x1 - x2;
      const proj = (Q) => Q.map(([x, y]) => x * nx + y * ny);
      const pa = proj(A);
      const pb = proj(B);
      if (Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)) return false;
    }
  }
  return true;
}

// Normaliza un grupo para que su caja (con giros) empiece en 0,0 y devuelve su tamaño.
function normalizeGroup(cards) {
  const pts = cards.flatMap(corners);
  const minX = Math.min(...pts.map((p) => p[0]));
  const minY = Math.min(...pts.map((p) => p[1]));
  const maxX = Math.max(...pts.map((p) => p[0]));
  const maxY = Math.max(...pts.map((p) => p[1]));
  return {
    cards: cards.map((c) => ({ x: c.x - minX, y: c.y - minY, z: c.z, rot: c.rot || 0 })),
    w: maxX - minX,
    h: maxY - minY,
  };
}

// ---------- Generación del nivel (siempre resoluble) ----------
// 1. Se elige un orden de retirada válido (solo cartas libres).
// 2. Ese orden se corta en cadenas; cada cadena empieza con una carta del mazo
//    y cada carta de la cadena es ±1 de la anterior (A y K se conectan).
// 3. El mazo = inicios de cadena + señuelos en medio + sobrantes al final.
// Nivel secreto de cada mundo (se abre con 30/30 estrellas): id aparte, después de los 5,200 normales.
// Se arma como un jefe del mismo mundo, un poco más difícil y con otro tablero.
export const secretId = (w) => TOTAL_LEVELS + w;
export const isSecret = (g) => g >= TOTAL_LEVELS && g < TOTAL_LEVELS + WORLD_COUNT;

// ev: nivel del evento del mes (ver eventLevel): trae su propia dificultad, semilla y mundo de mecánicas.
// Los niveles que piden ayudas (hardHelp) y los tableros especiales salen ya endurecidos de path-data.js y special-data.js.
export function generateLevel(g, ev = null) {
  if (ev) return buildLevel(g, ev);
  if (g >= SPECIAL_ID) return specialLevel(g - SPECIAL_ID);
  const h = hardHelp(g), d = h && hardData(HARD_DATA[g]);
  return h ? hardened(buildLevel(g, null, d?.t), d, h) : buildLevel(g);
}

// Tablero sin endurecer. t: otro tablero para el mismo nivel (tools/hard-levels.mjs prueba varios hasta que uno se deja).
export function buildLevel(g, ev = null, t = 0) {
  const secret = !ev && isSecret(g);
  const base = ev ? ev.world * LEVELS_PER_WORLD + ev.index : secret ? (g - TOTAL_LEVELS) * LEVELS_PER_WORLD + LEVELS_PER_WORLD - 1 : g;
  const world = Math.floor(base / LEVELS_PER_WORLD);
  const index = base % LEVELS_PER_WORLD;
  const r = mulberry32(hash(ev ? ev.seed : t ? g + t * 104729 : g));
  const d = ev ? ev.d : secret ? Math.min(1, difficulty(base) + 0.05) : difficulty(base);
  // Evento: en cada planeta salen más seguido las formas que más cuestan (medido con el bot casual).
  // Evento: en cada planeta salen más seguido las formas que más cuestan (medido con el bot casual).
  const template = ev?.template || (ev && (index === LEVELS_PER_WORLD - 1 || r() < 0.15 + ev.tight * 0.17) ? pick(r, ['peaks', 'peaks', 'scatter', 'invPyramid']) : chooseTemplate(r, ev ? Math.max(3, base) : base, d));

  const raw = template === 'clusters' ? clusters(r, d, index === LEVELS_PER_WORLD - 1) : [TEMPLATES[template](r, d)];
  const groups = raw.map(normalizeGroup);
  const pos = groups.flatMap((gr, gi) => gr.cards.map((c) => ({ ...c, group: gi })));
  const n = pos.length;

  // Solo se tapan cartas del mismo grupo.
  const coveredBy = pos.map((p) =>
    pos.reduce((acc, q, j) => (q.group === p.group && q.z > p.z && overlaps(p, q) ? (acc.push(j), acc) : acc), []),
  );

  const removed = new Array(n).fill(false);
  const order = [];
  while (order.length < n) {
    const free = [];
    for (let i = 0; i < n; i++) if (!removed[i] && coveredBy[i].every((j) => removed[j])) free.push(i);
    const i = pick(r, free);
    removed[i] = true;
    order.push(i);
  }

  const boss = index === LEVELS_PER_WORLD - 1;
  // Mecánicas del nivel: cada una aparece a partir de su mundo y luego se combinan (máximo 2 tipos).
  const mech = new Set(chooseMechanics(r, world, index, boss, n, ev));

  // Carta regalo: una carta especial (sin número) que se activa sola al quedar destapada del todo
  // y manda 2-5 cartas al final del mazo. Va tapada y en el primer 40% del orden de retirada.
  let packId = null;
  if (mech.has('pack')) {
    const early = order.slice(0, Math.floor(n * 0.4)).filter((i) => coveredBy[i].length);
    if (early.length) packId = pick(r, early);
  }
  // Bombas (1-3): cartas especiales sin número, tapadas, que hay que destapar antes de que su cuenta llegue a 0.
  const bombIds = [];
  if (mech.has('bomb')) {
    const mid = order.slice(Math.floor(n * 0.15), Math.floor(n * 0.75)).filter((i) => coveredBy[i].length && i !== packId);
    shuffle(r, mid);
    bombIds.push(...mid.slice(0, randInt(r, 1, n >= 20 ? 3 : 2)));
  }
  const play = order.filter((i) => i !== packId && !bombIds.includes(i)); // cartas con número, en orden de solución
  const np = play.length;

  const minC = d < 0.15 ? 4 : d < 0.35 ? 3 : 2;
  // Evento: cadenas más cortas en cada planeta (menos rachas largas = menos premios de racha).
  const maxC = Math.max(minC + 1, Math.round(9 - d * 5.5) - (boss ? 2 : 0) - (ev ? ev.tight : 0));
  const ranks = new Array(n);
  const starts = [];
  for (let k = 0; k < np; ) {
    const len = Math.min(np - k, randInt(r, minC, maxC));
    let cur = randInt(r, 0, 12);
    starts.push(cur);
    let dir = r() < 0.5 ? 1 : -1;
    for (let t = 0; t < len; t++) {
      if (t > 0 && r() < 0.35) dir = -dir;
      cur = (cur + dir + 13) % 13;
      ranks[play[k + t]] = cur;
    }
    k += len;
  }
  const known = ranks.filter((x) => x != null);

  const card = (rank) => ({ rank, suit: randInt(r, 0, 3) });
  const waste0 = card(starts[0]);
  const stock = starts.slice(1).map(card);
  const decoys = d < 0.15 ? 0 : randInt(r, 0, Math.round(d * 3)) + (boss ? 1 : 0);
  for (let i = 0; i < decoys; i++) stock.splice(randInt(r, 0, stock.length), 0, card(randInt(r, 0, 12)));
  // Desde d ≥ 0.15 el margen base baja a 1: las 3★ (y a veces ganar) dependen de los premios de racha o de gastar.
  let spares = (d < 0.15 ? 2 : 1) + Math.round((1 - d) ** 1.5 * (3 + n * 0.25));
  // Jefes: menos margen, para que el comodín o el +5 se sientan valiosos (siguen siendo ganables).
  if (boss && d > 0.15) spares = Math.max(1, spares - 3);
  // Evento: cada planeta deja menos cartas de sobra en el mazo (ev.tight = 0 en el primero … 4 en el último).
  // Desde el tercero puede no sobrar ninguna: sigue siendo ganable, pero sin errores (o con ayudas).
  if (ev) spares = Math.max(ev.tight >= 2 ? 0 : 1, spares - ev.tight);
  // En niveles fáciles las sobrantes suelen ser vecinas de alguna carta del tablero.
  const helpfulCard = (p) => card(r() < p ? (pick(r, known) + pick(r, [1, 12])) % 13 : randInt(r, 0, 12));
  for (let i = 0; i < spares; i++) stock.push(helpfulCard((1 - d) * 0.85));

  const cards = pos.map((p, i) => ({ id: i, ...p, rank: ranks[i], suit: randInt(r, 0, 3), coveredBy: coveredBy[i] }));
  for (const id of bombIds) delete cards[id].rank;
  const SPECIAL = ['lock', 'key', 'pack', 'ice', 'alt', 'arrow', 'curtain', 'curtainKey', 'bomb', 'live'];
  const plain = (id) => SPECIAL.every((f) => cards[id][f] == null);

  // Candados y llaves: la carta con candado no se puede jugar hasta retirar su llave.
  // La llave siempre va antes que el candado en la solución, así el nivel sigue siendo ganable.
  const pairs = !mech.has('lock') || np < 10 ? 0 : boss ? (d < 0.4 ? 1 : 2) : 1;
  const keys = [];
  // Llave y candado lejos uno del otro (de preferencia en grupos distintos): se prueban varias parejas y gana la más separada.
  const apart = (a, b) => (a.group !== b.group ? 100 : 0) + Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  for (let k = 0; k < pairs; k++) {
    const used = (i) => !plain(play[i]);
    let best = null;
    for (let t = 0; t < 30; t++) {
      const li = randInt(r, Math.ceil(np * 0.45), np - 1);
      const ki = randInt(r, 0, li - 1);
      if (used(li) || used(ki)) continue;
      const sc = apart(cards[play[li]], cards[play[ki]]);
      if (!best || sc > best.sc) best = { li, ki, sc };
    }
    if (!best) continue;
    const { li, ki } = best;
    cards[play[li]].lock = keys.length;
    cards[play[ki]].key = keys.length;
    keys.push(play[ki]);
  }

  // Contenido de la carta regalo: las últimas cartas del mazo (las que la solución de referencia
  // aún no habrá robado cuando la carta se active) y, si no alcanzan, cartas útiles extra.
  // Como vuelven al final del mazo, el mazo de la solución queda igual: sigue siendo ganable.
  let pack = 0;
  if (packId != null) {
    const want = randInt(r, 2, 5);
    const rem = new Array(n).fill(false);
    let top = waste0;
    let si = 0;
    let at = null;
    for (const id of play) {
      while (!follows(top, ranks[id])) top = stock[si++];
      rem[id] = true;
      top = cards[id];
      if (coveredBy[packId].every((j) => rem[j])) {
        at = si;
        break;
      }
    }
    const take = Math.max(0, Math.min(want, stock.length - (at ?? stock.length)));
    const content = stock.splice(stock.length - take, take);
    while (content.length < want) content.push(helpfulCard(0.7));
    cards[packId].pack = content;
    delete cards[packId].rank;
    pack = want;
  }

  // Tiempos de la solución de referencia (sin premios de racha): acciones antes de cada jugada
  // y si la jugada siguiente va sin robar en medio. Las mecánicas se colocan para que la referencia las cumpla.
  const act = [];
  const drew = [];
  const bombFree = {}; // acciones al quedar destapada cada bomba en la referencia
  {
    const stk = stock.slice();
    const rem = new Array(n).fill(false);
    let top = waste0;
    let si = 0;
    let a = 0;
    let packed = packId == null;
    play.forEach((id, k) => {
      let dn = 0;
      while (!follows(top, ranks[id])) {
        top = stk[si++];
        a++;
        dn++;
      }
      drew[k] = dn;
      act[k] = a;
      rem[id] = true;
      top = { rank: ranks[id] };
      a++;
      if (!packed && coveredBy[packId].every((j) => rem[j])) {
        stk.push(...cards[packId].pack);
        packed = true;
      }
      for (const id of bombIds) if (bombFree[id] == null && coveredBy[id].every((j) => rem[j])) bombFree[id] = a;
    });
  }
  const pickPlain = (from, to, ok = () => true) => {
    const c = [];
    for (let k = Math.max(0, from); k < Math.min(np, to); k++) if (plain(play[k]) && ok(k)) c.push(k);
    return c.length ? pick(r, c) : null;
  };

  // Hielo: se derrite tras N cartas jugadas; N nunca pasa de las jugadas que la referencia hace antes.
  if (mech.has('ice')) {
    for (let t = randInt(r, 1, 3); t > 0; t--) {
      const k = pickPlain(3, np);
      if (k != null) cards[play[k]].ice = Math.min(k, randInt(r, 3, 8));
    }
  }
  // Carta doble: un segundo número cualquiera (la referencia usa el principal).
  if (mech.has('double')) {
    for (let t = randInt(r, 1, 3); t > 0; t--) {
      const k = pickPlain(0, np);
      if (k == null) continue;
      let alt = randInt(r, 0, 12);
      if (alt === ranks[play[k]]) alt = (alt + 6) % 13;
      cards[play[k]].alt = alt;
    }
  }
  // Flecha: solo donde la referencia juega justo después, sin robar, el número de arriba (o de abajo).
  if (mech.has('arrow')) {
    for (let t = randInt(r, 1, 2); t > 0; t--) {
      const k = pickPlain(0, np - 1, (k) => drew[k + 1] === 0);
      if (k == null) continue;
      const a = ranks[play[k]];
      const b = ranks[play[k + 1]];
      cards[play[k]].arrow = (a + 1) % 13 === b ? 1 : -1;
    }
  }
  // Cortina: una fila de 3+ cartas que siguen boca abajo hasta retirar su carta llave (anterior en la referencia).
  const curtains = [];
  if (mech.has('curtain')) {
    const rows = new Map();
    play.forEach((id, k) => {
      const key = `${cards[id].group}|${Math.round(cards[id].y * 10)}`;
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key).push(k);
    });
    const opts = [...rows.values()].filter((ks) => ks.length >= 3 && ks.length <= 7 && Math.min(...ks) >= 3 && ks.every((k) => plain(play[k])));
    // A veces, en vez de una fila, cartas sueltas repartidas por el tablero.
    if (!opts.length || r() < 0.4) {
      const loose = [];
      for (let k = Math.ceil(np * 0.35); k < np; k++) if (plain(play[k])) loose.push(k);
      if (loose.length >= 3) opts.splice(0, opts.length, shuffle(r, loose).slice(0, randInt(r, 3, Math.min(5, loose.length))));
    }
    if (opts.length) {
      const ks = pick(r, opts);
      const kk = pickPlain(0, Math.min(...ks));
      if (kk != null) {
        ks.forEach((k) => (cards[play[k]].curtain = 0));
        cards[play[kk]].curtainKey = 0;
        curtains.push(play[kk]);
      }
    }
  }
  // Bomba: explota si llevas `bomb` acciones sin destaparla. La referencia la destapa antes, con 2-5 de margen.
  for (const id of bombIds) cards[id].bomb = (bombFree[id] ?? 0) + randInt(r, 2, 5);
  // Carta viva: su número cambia ±1 con cada acción; se calcula para que encaje justo cuando la referencia la juega.
  // Puede haber dos (una que sube y otra que baja) para complicar más.
  if (mech.has('live')) {
    let dir = r() < 0.5 ? 1 : -1;
    for (let t = r() < 0.45 ? 2 : 1; t > 0; t--, dir = -dir) {
      const k = pickPlain(1, np);
      if (k == null) continue;
      cards[play[k]].live = dir;
      cards[play[k]].rank = mod13(ranks[play[k]] - dir * act[k]);
    }
  }

  const level = {
    g, world, index, d, template, boss, secret, event: !!ev,
    groups: groups.map(({ w, h }) => ({ w, h })),
    cards,
    keys,
    curtains,
    waste0,
    stock,
    solution: play, // la carta regalo no está: se activa sola
    meta: { spares, decoys, chains: starts.length, locks: keys.length, pack },
  };
  // Bomba y carta viva dependen de cuántas acciones haces, y en el juego los premios de racha añaden robos.
  // Se comprueba con el solucionador (que sí aplica premios); si no hay solución, se quitan.
  // Si no hay solución: primero se quita la carta viva y luego se le da más margen a la bomba.
  // En el evento los premios de racha van al doble de distancia: se comprueba igual que se juega.
  if (ev) level.rewardStep = 2;
  const check = () => !cards.some((c) => c.live || c.bomb) || !!solve(level, initState(level), 60000);
  if (!check()) {
    for (const c of cards) if (c.live) (c.rank = ranks[c.id]), delete c.live;
    for (let extra = 4; !check() && extra <= 40; extra *= 2) for (const c of cards) if (c.bomb) c.bomb += extra;
  }
  level.meta.mechs = MECHANICS.filter((m) => cards.some((c) => c[MECH_FIELD[m]] != null));
  return level;
}

// ---------- Evento del mes ----------
// 25 niveles en 5 planetas de 5 (el 5.º de cada planeta es su jefe). Más difíciles que el camino normal
// y suben con cada planeta. key = edición (año × 12 + mes, un número) para que cada mes traiga otros tableros.
// world = mundo hasta el que llegaba el jugador al empezar el evento: solo salen las mecánicas que ya conoce.
export const EVENT_PLANETS = 5;
export const EVENT_PER_PLANET = 5;
export const EVENT_LEVELS = EVENT_PLANETS * EVENT_PER_PLANET;
export const eventDifficulty = (k) => {
  const p = Math.floor(k / EVENT_PER_PLANET), j = k % EVENT_PER_PLANET;
  return Math.min(1, 0.42 + p * 0.1 + j * 0.02 + (j === EVENT_PER_PLANET - 1 ? 0.05 : 0));
};
// Ayudas que pide cada nivel (por planeta): sin ellas no hay solución; con ese número de comodines
// (o de compras de +5) sí. Planeta 1: 1 de 5 niveles, planeta 2: 2 de 5… planeta 5: los 5. El 5.º de cada planeta es el más duro.
export const EVENT_HELP = [
  [0, 0, 0, 0, 1],
  [0, 0, 1, 0, 2],
  [0, 1, 0, 1, 2],
  [0, 1, 1, 1, 3],
  [1, 2, 1, 2, 3],
];
// Los tableros del evento dependen de qué mecánicas conoces: 5 grupos según el mundo al empezar el evento
// (el evento se abre al ganar el nivel 80, mundo 9). El mundo de cada grupo es el que se usa para armarlo.
export const EVENT_WORLDS = [8, 11, 15, 19, 24];
export const eventGroup = (world) => EVENT_WORLDS.reduce((b, w, i) => (world >= w ? i : b), 0);
// Tablero base (antes de endurecerlo). t = intento: tools/event-levels.mjs prueba varios hasta dar con uno que cumpla.
// En el evento los premios de racha van al doble de distancia (rewardStep 2).
export function eventBase(month, k, group, t = 0) {
  const p = Math.floor(k / EVENT_PER_PLANET), j = k % EVENT_PER_PLANET, boss = j === EVENT_PER_PLANET - 1;
  // Índice dentro del mundo: el jefe usa el 10 (tableros de jefe); los demás, del 2 al 8.
  const L = generateLevel(EVENT_ID + k, { world: EVENT_WORLDS[group], index: boss ? LEVELS_PER_WORLD - 1 : 1 + j * 2, d: eventDifficulty(k), tight: p, seed: 7e6 + month * 977 + group * 131 + k + t * 7919 });
  return { ...L, k, planet: p, boss, rewardStep: 2, help: EVENT_HELP[p][j] };
}
// key = edición (año × 12 + mes). Los tableros salen de event-data.js (ya probados: piden sus ayudas);
// cada año se cambian los números de las cartas (mismo tablero, misma dificultad).
export function eventLevel(key, k, world) {
  const month = key % 12, group = eventGroup(world);
  const d = EVENT_DATA[`${month}.${group}`]?.[k];
  let L = eventBase(month, k, group, d?.t || 0);
  if (d?.s && L.help) L = { ...L, stock: L.stock.map((c, i) => ({ ...c, rank: d.s[i] })), help: d.h ?? L.help };
  else L.help = 0;
  const v = Math.floor(key / 12) - 2026;
  return v > 0 ? { ...variantLevel(L, v), variant: 0 } : L;
}
// Id de los niveles del evento (después de los normales y los secretos): solo sirve para guardar intentos.
export const EVENT_ID = TOTAL_LEVELS + WORLD_COUNT;
export const isEvent = (g) => g >= EVENT_ID;

// ---------- Niveles que piden ayudas (camino normal) ----------
// Cada constelación (10 mundos = 100 niveles) tiene redondear(3 + (c − 1) × 37 / 51) niveles que no se
// ganan sin ayudas (comodines o compras de +5): 3 en la primera y sube hasta 40 (el tope, 40%) en la 52.
// Cuáles son sale de una semilla fija (los mismos para todos; en la primera, desde el planeta 6). Constelaciones 1-15:
// todos piden 1; 16-35: algunos piden 2; 36-52: algunos 2 y algunos 3.
// Su mazo ya probado viene de path-data.js (tools/hard-levels.mjs) y npm test lo revisa.
export const CONST_LEVELS = 10 * LEVELS_PER_WORLD;
export const hardCount = (c) => Math.round(3 + (c * 37) / 51); // c desde 0
const HARD = new Map();
for (let c = 0; c < TOTAL_LEVELS / CONST_LEVELS; c++) {
  const from = c ? 0 : 5 * LEVELS_PER_WORLD;
  const slots = shuffle(mulberry32(hash(9e6 + c)), [...Array(CONST_LEVELS - from).keys()]).slice(0, hardCount(c));
  const n = slots.length, n3 = c >= 35 ? Math.round(n * 0.2) : 0, n2 = c >= 15 ? Math.round(n * 0.3) : 0;
  slots.forEach((i, k) => HARD.set(c * CONST_LEVELS + from + i, k < n3 ? 3 : k < n3 + n2 ? 2 : 1));
}
export const hardHelp = (g) => HARD.get(g) || 0;

// Datos guardados: "t:mazo[:h]" (t = tablero, mazo = un carácter por carta en base 13, h = ayudas si se
// lograron menos de las pedidas). Sin datos (aún no se corre la herramienta) queda el tablero normal.
export function hardData(str) {
  if (!str) return null;
  const [t, s, h] = str.split(':');
  return { t: +t, s: [...s].map((c) => parseInt(c, 13)), ...(h && { h: +h }) };
}
function hardened(L, d, help) {
  return d?.s ? { ...L, stock: L.stock.map((c, i) => ({ ...c, rank: d.s[i] })), help: d.h ?? help } : L;
}

// ---------- Tableros especiales (para eventos exclusivos) ----------
// 1,000 tableros aparte, que no salen ni en el camino ni en el evento del mes, ordenados por cuántas ayudas
// piden: 0-249 piden 1, 250-499 piden 2, 500-749 piden 3 y 750-999 piden 4. Cada uno es de un grupo de
// mecánicas como el evento (grupo 0-4 = el jugador ya llegó al mundo 9, 12, 16, 20 o 25): solo usan las que ya conoce.
// Cada 4.º es tablero de jefe. specialLevel(i) da el tablero ya probado (special-data.js); specials(h, grupo) los busca.
export const SPECIAL_COUNT = 1000;
export const SPECIAL_ID = EVENT_ID + EVENT_LEVELS;
export const specialHelp = (i) => 1 + Math.floor(i / 250);
export const specialGroup = (i) => i % EVENT_WORLDS.length;
export const specials = (h, group = null) => [...Array(SPECIAL_COUNT).keys()].filter((i) => specialHelp(i) === h && (group == null || specialGroup(i) === group));
// Para que no salgan todos con la misma forma, cada uno trae la suya (se turnan); si en 300 tableros no se deja
// endurecer, se permite cualquiera. Dispersa y capas casi nunca aguantan 4 ayudas: en esos no van.
const SPECIAL_SHAPES = ['pyramid', 'diamond', 'wall', 'invPyramid', 'clusters', 'towers', 'peaks', 'scatter', 'layers'];
export function specialBase(i, t = 0) {
  const h = specialHelp(i), boss = i % 4 === 3, shapes = SPECIAL_SHAPES.slice(0, h === 4 ? 7 : 9);
  const L = buildLevel(SPECIAL_ID + i, { world: EVENT_WORLDS[specialGroup(i)], index: boss ? LEVELS_PER_WORLD - 1 : 1 + (i % 4) * 2, d: Math.min(1, 0.45 + h * 0.1), tight: h, template: t < 300 ? shapes[i % shapes.length] : null, seed: 8e6 + i * 13 + t * 7919 });
  return { ...L, event: false, special: i, help: h, rewardStep: 2 };
}
export function specialLevel(i) {
  const d = hardData(SPECIAL_DATA[i]);
  return hardened(specialBase(i, d?.t), d, specialHelp(i));
}

// ---------- Festividades (eventos de 24 h) ----------
// 3 planetas de 3 niveles, todos con tableros especiales: los dos primeros de cada planeta piden 2 ayudas y el jefe 3
// (y es tablero de jefe). Usan las mecánicas que ya conoces (grupo según el mundo al empezar). seed cambia con la
// festividad y el año: cada edición trae otros tableros, y dentro de una no se repiten.
export const FIESTA_PLANETS = 3;
export const FIESTA_PER_PLANET = 3;
export const FIESTA_LEVELS = FIESTA_PLANETS * FIESTA_PER_PLANET;
// Algunas festividades largas traen más (n: niveles por planeta); los que no son jefe piden 2 ayudas y el jefe 3.
export function fiestaLevel(seed, k, world, n = FIESTA_PER_PLANET) {
  const j = k % n, p = Math.floor(k / n), boss = j === n - 1;
  const pool = specials(boss ? 3 : 2, eventGroup(world)).filter((i) => (i % 4 === 3) === boss);
  // Las de 3×3 siguen como siempre; las más largas cuentan jefes y no jefes por separado para no repetir tablero.
  const step = n === FIESTA_PER_PLANET ? k : boss ? p : p * (n - 1) + j;
  const i = pool[(hash(seed) + step * 7) % pool.length];
  return { ...specialLevel(i), k, planet: p, boss };
}

// ---------- Mecánicas por mundo ----------
export const MECHANICS = ['lock', 'pack', 'ice', 'double', 'arrow', 'curtain', 'bomb', 'live'];
const MECH_FIELD = { lock: 'lock', pack: 'pack', ice: 'ice', double: 'alt', arrow: 'arrow', curtain: 'curtain', bomb: 'bomb', live: 'live' };
// Mundo (índice desde 0) en el que se presenta cada una.
export const MECH_INTRO = { lock: 1, pack: 2, ice: 4, double: 7, arrow: 11, curtain: 15, bomb: 19, live: 24 };
export const MECH_NAMES = {
  lock: 'Candado', pack: 'Carta regalo', ice: 'Hielo', double: 'Carta doble', arrow: 'Flecha', curtain: 'Cortina', bomb: 'Bomba', live: 'Carta viva',
};

function chooseMechanics(r, world, index, boss, n, ev = null) {
  if (n < 8) return [];
  const avail = MECHANICS.filter((m) => world >= MECH_INTRO[m]);
  if (!avail.length) return [];
  // Evento: siempre trae alguna de las que ya conoces (dos en los jefes). En los últimos planetas
  // la carta viva y la bomba (las más duras) van primero si ya las conoces.
  if (ev) {
    const mix = shuffle(r, avail.slice());
    const hard = mix.filter((m) => (m === 'live' || m === 'bomb') && r() < ev.tight * 0.2);
    return [...new Set([...hard, ...mix])].slice(0, boss || r() < 0.45 ? 2 : 1);
  }
  const newest = avail.find((m) => MECH_INTRO[m] === world);
  const others = avail.filter((m) => m !== newest);
  // Mundo de presentación: la nueva va sola en los primeros niveles y luego acompañada.
  if (newest) return index < 5 || !others.length ? [newest] : [newest, pick(r, others)];
  const k = boss ? 2 : r() < 0.2 ? 0 : r() < 0.55 ? 1 : 2;
  return shuffle(r, avail.slice()).slice(0, k);
}

// Cada intento de un nivel cambia las cartas sin cambiar el tablero: se suma lo mismo a todos los rangos
// (mod 13, así ±1 y A–K siguen valiendo igual) y se barajan los palos. El intento 0 es el original.
export function variantLevel(level, v) {
  if (!v) return level;
  const r = mulberry32(hash(level.g * 7919 + v));
  const k = randInt(r, 1, 12);
  const perm = shuffle(r, [0, 1, 2, 3]);
  const map = (c) => (c.rank == null ? { ...c } : { ...c, rank: (c.rank + k) % 13, suit: perm[c.suit], ...(c.alt != null && { alt: (c.alt + k) % 13 }) });
  const mapCard = (c) => ({ ...map(c), ...(c.pack && { pack: c.pack.map(map) }) });
  return { ...level, variant: v, cards: level.cards.map(mapCard), stock: level.stock.map(map), waste0: map(level.waste0) };
}

// Acomoda los grupos en filas: prueba 1..n filas y elige la que deja las cartas más grandes.
// Devuelve el tamaño de carta (u, en px), el tablero (bw, bh, en unidades) y la posición de cada grupo.
export function packGroups(groups, availW, availH, gap = 0.7, maxU = 120) {
  let best = null;
  for (let rows = 1; rows <= groups.length; rows++) {
    const per = Math.ceil(groups.length / rows);
    const lines = [];
    for (let i = 0; i < groups.length; i += per) lines.push(groups.slice(i, i + per).map((_, k) => i + k));
    const lw = lines.map((l) => l.reduce((s, i) => s + groups[i].w, 0) + gap * (l.length - 1));
    const lh = lines.map((l) => Math.max(...l.map((i) => groups[i].h)));
    const bw = Math.max(...lw);
    const bh = lh.reduce((a, b) => a + b, 0) + gap * (lines.length - 1);
    const u = Math.min(availW / bw, availH / bh, maxU);
    if (!best || u > best.u + 0.5) best = { u, lines, lw, lh, bw, bh };
  }
  const { lines, lw, lh, bw } = best;
  const offsets = [];
  let y = 0;
  lines.forEach((l, li) => {
    let x = (bw - lw[li]) / 2;
    for (const i of l) {
      offsets[i] = { x, y: y + (lh[li] - groups[i].h) / 2 };
      x += groups[i].w + gap;
    }
    y += lh[li] + gap;
  });
  return { u: best.u, bw: best.bw, bh: best.bh, offsets };
}
