import { mulberry32, hash, randInt, pick, shuffle } from './rng.js';

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
export function generateLevel(g) {
  const world = Math.floor(g / LEVELS_PER_WORLD);
  const index = g % LEVELS_PER_WORLD;
  const r = mulberry32(hash(g));
  const d = difficulty(g);
  const template = chooseTemplate(r, g, d);

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

  // Carta regalo: una carta especial (sin número) que se activa sola al quedar destapada del todo
  // y manda 2-5 cartas al final del mazo. Va tapada y en el primer 40% del orden de retirada.
  let packId = null;
  if (d >= 0.1 && n >= 8 && r() < 0.2 + d * 0.35) {
    const early = order.slice(0, Math.floor(n * 0.4)).filter((i) => coveredBy[i].length);
    if (early.length) packId = pick(r, early);
  }
  const play = packId == null ? order : order.filter((i) => i !== packId); // cartas con número, en orden de solución
  const np = play.length;

  const minC = d < 0.15 ? 4 : d < 0.35 ? 3 : 2;
  const boss = index === LEVELS_PER_WORLD - 1;
  const maxC = Math.max(minC + 1, Math.round(9 - d * 5.5) - (boss ? 2 : 0));
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
  // En niveles fáciles las sobrantes suelen ser vecinas de alguna carta del tablero.
  const helpfulCard = (p) => card(r() < p ? (pick(r, known) + pick(r, [1, 12])) % 13 : randInt(r, 0, 12));
  for (let i = 0; i < spares; i++) stock.push(helpfulCard((1 - d) * 0.85));

  const cards = pos.map((p, i) => ({ id: i, ...p, rank: ranks[i], suit: randInt(r, 0, 3), coveredBy: coveredBy[i] }));

  // Candados y llaves: la carta con candado no se puede jugar hasta retirar su llave.
  // La llave siempre va antes que el candado en la solución, así el nivel sigue siendo ganable.
  const pairs = np < 10 || d < 0.12 ? 0 : boss ? (d < 0.4 ? 1 : 2) : r() < Math.min(0.4, d) ? 1 : 0;
  const keys = [];
  for (let k = 0; k < pairs; k++) {
    const used = (i) => cards[play[i]].lock != null || cards[play[i]].key != null;
    let li = randInt(r, Math.ceil(np * 0.45), np - 1);
    while (li > 1 && used(li)) li--;
    let ki = randInt(r, 0, li - 1);
    while (ki > 0 && used(ki)) ki--;
    if (used(li) || used(ki) || ki >= li) continue;
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
      while (!canFollow(top, ranks[id])) top = stock[si++];
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

  return {
    g, world, index, d, template, boss,
    groups: groups.map(({ w, h }) => ({ w, h })),
    cards,
    keys,
    waste0,
    stock,
    solution: play, // la carta regalo no está: se activa sola
    meta: { spares, decoys, chains: starts.length, locks: keys.length, pack },
  };
}

// ¿Puede jugarse ya? (libre, sin candado cerrado y ±1 del descarte)
export function isOpen(level, c, removed) {
  return !c.pack && !removed[c.id] && c.coveredBy.every((j) => removed[j]) && (c.lock == null || !!removed[level.keys[c.lock]]);
}

// ---------- Premios de racha ----------
// Racha 6: +1 carta útil al mazo · 9: un comodín al mazo · 12: +1 comodín al inventario
// · después, cada 3: +1 carta útil. Las cartas de premio entran en un lugar "al azar" del mazo, nunca entre las 3 primeras,
// (determinista según el estado, para que juego, solucionador y bot coincidan).
// Los premios solo añaden cartas, así que nunca hacen imposible un nivel.
export function streakReward(streak) {
  if (streak === 6) return 'card';
  if (streak === 9) return 'wild';
  if (streak === 12) return 'bank';
  if (streak > 12 && streak % 3 === 0) return 'card';
  return null;
}

export function nextReward(streak) {
  for (let s = streak + 1; ; s++) {
    const kind = streakReward(s);
    if (kind) return { at: s, kind };
  }
}

// La carta útil es vecina (+1) de la primera carta jugable del tablero, por id: determinista,
// así el juego, el solucionador y el bot la calculan igual.
export function rewardCard(level, removed, kind) {
  if (kind === 'wild') return { wild: true, reward: true };
  const c = level.cards.find((c) => isOpen(level, c, removed)) || level.cards.find((c) => !removed[c.id] && !c.pack);
  return { rank: c ? (c.rank + 1) % 13 : 0, suit: c ? (c.id + 1) % 4 : 0, reward: true };
}

// Pone en el mazo el premio de alcanzar `streak` (si toca). Devuelve { kind, pos } o null.
export function applyReward(level, removed, stock, streak) {
  const kind = streakReward(streak);
  if (!kind) return null;
  let pos = -1;
  if (kind === 'card' || kind === 'wild') {
    const gone = removed.reduce((a, b) => a + (b ? 1 : 0), 0);
    // Nunca entre las 3 primeras del mazo (salvo que haya menos de 3: entonces al final).
    const h = hash(level.g * 131 + streak * 17 + gone * 7 + stock.length);
    pos = stock.length < 3 ? stock.length : 3 + (h % (stock.length - 2));
    stock.splice(pos, 0, rewardCard(level, removed, kind));
  }
  return { kind, pos };
}

// Cartas regalo que ya quedaron destapadas: se quitan del tablero y su contenido va al final del mazo.
// Devuelve los ids activados (para poder deshacer).
export function activatePacks(level, removed, stock) {
  const out = [];
  for (const c of level.cards) {
    if (!c.pack || removed[c.id] || !c.coveredBy.every((j) => removed[j])) continue;
    removed[c.id] = true;
    stock.push(...c.pack.map((x) => ({ ...x })));
    out.push(c.id);
  }
  return out;
}

// Busca una solución desde un estado (profundidad primero, con memoria). null = no hay o se agotó el límite.
// Tiene en cuenta los premios de racha que caen en el mazo.
export function solve(level, removed, stock0, top, streak0 = 0, limit = 250000) {
  const rem = removed.slice();
  const seen = new Set();
  const path = [];
  let nodes = 0;
  const sig = (st) => st.map((c) => (c.wild ? 'w' : c.rank)).join(',');
  const dfs = (stock, top, left, streak) => {
    if (left === 0) return true;
    if (++nodes > limit) return false;
    const key = `${rem.map((b) => (b ? 1 : 0)).join('')}|${sig(stock)}|${top.wild ? 'w' : top.rank}|${Math.min(streak, 13 + (streak % 3))}`;
    if (seen.has(key)) return false;
    seen.add(key);
    for (const c of level.cards) {
      if (!isOpen(level, c, rem) || !canFollow(top, c.rank)) continue;
      rem[c.id] = true;
      path.push(c.id);
      const next = stock.slice();
      const act = activatePacks(level, rem, next);
      applyReward(level, rem, next, streak + 1);
      if (dfs(next, c, left - 1 - act.length, streak + 1)) return true;
      path.pop();
      rem[c.id] = false;
      for (const id of act) rem[id] = false;
    }
    if (stock.length) {
      path.push('draw');
      if (dfs(stock.slice(1), stock[0], left, 0)) return true;
      path.pop();
    }
    return false;
  };
  return dfs(stock0.slice(), top, rem.filter((b) => !b).length, streak0) ? path : null;
}

// Jugador casual: juega cualquier carta válida al azar; si no hay, roba. Sin boosters, con premios de racha.
export function playCasual(level, r = Math.random) {
  const removed = new Array(level.cards.length).fill(false);
  const stock = [...level.stock];
  let top = level.waste0;
  let left = level.cards.length;
  let streak = 0;
  for (;;) {
    const moves = level.cards.filter((c) => isOpen(level, c, removed) && canFollow(top, c.rank));
    if (moves.length) {
      const c = moves[Math.floor(r() * moves.length)];
      removed[c.id] = true;
      top = c;
      left -= 1 + activatePacks(level, removed, stock).length;
      if (left === 0) return true;
      applyReward(level, removed, stock, ++streak);
    } else if (stock.length) {
      top = stock.shift();
      streak = 0;
    } else return false;
  }
}

// Cada intento de un nivel cambia las cartas sin cambiar el tablero: se suma lo mismo a todos los rangos
// (mod 13, así ±1 y A–K siguen valiendo igual) y se barajan los palos. El intento 0 es el original.
export function variantLevel(level, v) {
  if (!v) return level;
  const r = mulberry32(hash(level.g * 7919 + v));
  const k = randInt(r, 1, 12);
  const perm = shuffle(r, [0, 1, 2, 3]);
  const map = (c) => (c.rank == null ? { ...c } : { ...c, rank: (c.rank + k) % 13, suit: perm[c.suit] });
  const mapCard = (c) => ({ ...map(c), ...(c.pack && { pack: c.pack.map(map) }) });
  return { ...level, variant: v, cards: level.cards.map(mapCard), stock: level.stock.map(map), waste0: map(level.waste0) };
}

export const canFollow = (top, rank) => top.wild || Math.abs(top.rank - rank) === 1 || Math.abs(top.rank - rank) === 12;

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
