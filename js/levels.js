import { mulberry32, hash, randInt, pick, shuffle } from './rng.js';
import { follows, mod13, solve, initState } from './engine.js';
import { EVENT_DATA } from './event-data.js';
import { HARD_DATA } from './path-data.js';
import { SPECIAL_DATA } from './special-data.js';
import { SOFT_DATA } from './soft-data.js';

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
  ['Pirámide', 'f', '🔺', 45], ['Bahía', 'f', '🐚', 340], ['Arboleda', 'f', '🍄', 285],
  ['Bambú', 'm', '🎋', 140], ['Tundra', 'f', '⛄', 200], ['Sabana', 'f', '🦒', 40],
  ['Luna', 'f', '🌙', 250], ['Viñedo', 'm', '🍇', 300], ['Cascada', 'f', '💧', 175],
  ['Oasis', 'm', '🌴', 55], ['Colmena', 'f', '🐝', 48], ['Aurora', 'f', '🌌', 165],
];
// Nombres que le quedan a cada lugar (ya con su género). Se usan en orden barajado fijo: la vuelta k del lugar toma el k-ésimo.
const NAMES = {
  Bosque: ['Frondoso', 'Verde', 'Susurrante', 'Musgoso', 'del Búho', 'de los Duendes', 'de las Ardillas', 'Esmeralda'],
  Valle: ['Otoñal', 'Dorado', 'Ventoso', 'de los Arces', 'Ámbar', 'Cobrizo', 'del Atardecer', 'Rojizo'],
  Isla: ['Tropical', 'Soleada', 'Turquesa', 'de las Palmeras', 'del Coco', 'Paradisíaca', 'de los Loros', 'Arenosa'],
  Castillo: ['Real', 'Imperial', 'de las Torres', 'del Rey', 'de Cristal', 'Majestuoso', 'del Dragón', 'de la Princesa'],
  Pantano: ['Brumoso', 'Burbujeante', 'de las Ranas', 'del Sapo', 'Verdoso', 'Neblinoso', 'de los Juncos', 'de las Luciérnagas'],
  Desierto: ['Ardiente', 'de las Dunas', 'Soleado', 'del Escorpión', 'Infinito', 'Caluroso', 'del Espejismo', 'Dorado'],
  Arrecife: ['Coralino', 'Turquesa', 'de los Peces', 'Multicolor', 'Sumergido', 'de las Perlas', 'Marino', 'del Delfín'],
  Montaña: ['Nevada', 'Altiva', 'de las Águilas', 'Rocosa', 'Escarpada', 'del Eco', 'Gigante', 'de las Nubes'],
  Pradera: ['Florida', 'Verde', 'de las Margaritas', 'Soleada', 'Ventosa', 'de los Conejos', 'Primaveral', 'Dulce'],
  Cueva: ['Profunda', 'de Cristal', 'de los Murciélagos', 'Amatista', 'del Eco', 'Resplandeciente', 'Subterránea', 'de las Gemas'],
  Jardín: ['Florido', 'de las Rosas', 'Perfumado', 'Secreto', 'de los Tulipanes', 'Primaveral', 'de las Mariposas', 'Rosado'],
  Puerto: ['Marinero', 'del Faro', 'Azul', 'de las Gaviotas', 'Pesquero', 'del Ancla', 'Bullicioso', 'de los Barcos'],
  Glaciar: ['Helado', 'Cristalino', 'Polar', 'Azul', 'de Hielo', 'del Pingüino', 'Congelado', 'Invernal'],
  Volcán: ['Ardiente', 'de Fuego', 'Rugiente', 'Carmesí', 'de Lava', 'Humeante', 'Furioso', 'Dormido'],
  Lago: ['Sereno', 'de los Cisnes', 'Espejo', 'Cristalino', 'Tranquilo', 'de los Nenúfares', 'Azul', 'de la Bruma'],
  Ciudad: ['Brillante', 'de Neón', 'Moderna', 'Nocturna', 'de las Torres', 'Bulliciosa', 'Luminosa', 'del Futuro'],
  Selva: ['Salvaje', 'Tropical', 'de los Jaguares', 'Esmeralda', 'Húmeda', 'de los Monos', 'Frondosa', 'de las Lianas'],
  Cañón: ['Rojo', 'Profundo', 'del Eco', 'Escarpado', 'del Halcón', 'Cobrizo', 'Ventoso', 'Carmesí'],
  Cielo: ['Celeste', 'de Algodón', 'Rosado', 'de las Nubes', 'Infinito', 'del Arcoíris', 'Alado', 'Azul'],
  Granja: ['Feliz', 'de las Vacas', 'Dorada', 'del Molino', 'de los Pollitos', 'Campestre', 'Risueña', 'de Trigo'],
  Pueblo: ['Pintoresco', 'de Colores', 'Tranquilo', 'de las Campanas', 'Alegre', 'del Río', 'Rústico', 'de los Faroles'],
  Templo: ['de Jade', 'del Sol', 'de los Cerezos', 'Sagrado', 'de la Luna', 'Dorado', 'del Dragón', 'de las Linternas'],
  Mina: ['Dorada', 'de Oro', 'Profunda', 'de las Gemas', 'de Diamantes', 'Brillante', 'del Minero', 'de Rubíes'],
  Feria: ['Alegre', 'de Colores', 'de los Globos', 'Dulce', 'Risueña', 'de las Luces', 'del Carrusel', 'de Algodón'],
  Pirámide: ['Dorada', 'del Faraón', 'Antigua', 'del Sol', 'de Arena', 'Misteriosa', 'Perdida', 'de la Esfinge'],
  Bahía: ['Rosada', 'de los Corales', 'Turquesa', 'Serena', 'de las Conchas', 'Escondida', 'Soleada', 'de las Sirenas'],
  Arboleda: ['de los Hongos', 'Mágica', 'Encantada', 'Morada', 'Brumosa', 'de las Hadas', 'Luminosa', 'de los Gnomos'],
  Bambú: ['Verde', 'Susurrante', 'del Panda', 'Sereno', 'Esmeralda', 'del Viento', 'Tranquilo', 'Dorado'],
  Tundra: ['Nevada', 'Helada', 'Blanca', 'Polar', 'del Reno', 'Invernal', 'Silenciosa', 'Ventosa'],
  Sabana: ['Dorada', 'Salvaje', 'del León', 'de las Jirafas', 'Soleada', 'Infinita', 'Ámbar', 'del Atardecer'],
  Luna: ['Plateada', 'Llena', 'Creciente', 'Menguante', 'Nueva', 'de Queso', 'Brillante', 'Silenciosa'],
  Viñedo: ['Morado', 'de las Uvas', 'Soleado', 'Dulce', 'del Atardecer', 'Dorado', 'Otoñal', 'de las Colinas'],
  Cascada: ['Cristalina', 'Rugiente', 'Esmeralda', 'del Arcoíris', 'Escondida', 'Brumosa', 'Azul', 'Eterna'],
  Oasis: ['Escondido', 'Fresco', 'de las Palmeras', 'Turquesa', 'del Desierto', 'Dorado', 'Secreto', 'Soñado'],
  Colmena: ['Dorada', 'de Miel', 'Dulce', 'Zumbadora', 'de las Abejas', 'Ámbar', 'Florida', 'Risueña'],
  Aurora: ['Boreal', 'Austral', 'Brillante', 'Danzante', 'Verde', 'Mágica', 'Polar', 'Estrellada'],
};
// Para completar la lista de cada lugar: adjetivos que le quedan a cualquiera.
const ANY = [
  ['Encantado', 'Encantada'], ['Escondido', 'Escondida'], ['Secreto', 'Secreta'], ['Mágico', 'Mágica'],
  ['Antiguo', 'Antigua'], ['Perdido', 'Perdida'], ['Eterno', 'Eterna'], ['Brillante', 'Brillante'],
  ['Lejano', 'Lejana'], ['Risueño', 'Risueña'], ['Estrellado', 'Estrellada'], ['Plateado', 'Plateada'],
  ['Soñado', 'Soñada'], ['Legendario', 'Legendaria'], ['Misterioso', 'Misteriosa'], ['Celeste', 'Celeste'],
];
// Orden de los mundos: cada vuelta de 36 trae los 36 lugares una vez, barajados (la primera empieza en el Bosque),
// sin repetir lugar entre el final de una vuelta y el inicio de la siguiente.
const LAPS = Math.ceil(520 / PLACES.length);
const ORDER = [];
for (let k = 0; k < LAPS; k++) {
  const lap = shuffle(mulberry32(777 + k), [...PLACES.keys()]);
  if (k === 0) lap.unshift(...lap.splice(lap.indexOf(0), 1));
  else if (lap[0] === ORDER.at(-1)) [lap[0], lap[1]] = [lap[1], lap[0]];
  ORDER.push(...lap);
}
const NAME_LIST = PLACES.map(([place, gender], i) => {
  const own = shuffle(mulberry32(31 + i), [...NAMES[place]]);
  const rest = ANY.map((a) => a[gender === 'm' ? 0 : 1]).filter((a) => !own.includes(a));
  return [...own, ...shuffle(mulberry32(91 + i), rest)];
});

export function worldInfo(w) {
  const p = ORDER[w % ORDER.length], [place, , emoji, hue] = PLACES[p];
  const list = NAME_LIST[p];
  return {
    index: w,
    name: `${place} ${list[Math.floor(w / PLACES.length) % list.length]}`,
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

  // ----- Figuras (Fase 7): solo en niveles sin ayudas (ver FRESH_UNLOCK) -----
  // Corazón: filas de arriba abajo; las de arriba tapan a las de abajo (la punta es lo último).
  heart(r, d) {
    const big = d > 0.3 && r() < 0.4 + d * 0.5;
    const rows = big
      ? [[-2, -1, 1, 2], [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5], [-2, -1, 0, 1, 2], [-1.5, -0.5, 0.5, 1.5], [-1, 0, 1], [-0.5, 0.5], [0]]
      : [[-1.5, 1.5], [-2, -1, 0, 1, 2], [-1.5, -0.5, 0.5, 1.5], [-1, 0, 1], [-0.5, 0.5], [0]];
    const out = [];
    rows.forEach((xs, i) => xs.forEach((x) => out.push({ x, y: i * ROW, z: rows.length - i })));
    return out;
  },
  // Estrella: 5 brazos de cartas giradas que salen del centro; las puntas quedan encima y se limpia hacia dentro.
  star(r, d) {
    const len = d > 0.3 ? 3 : 2;
    const out = [cc(0, 0, 0, 0)];
    // Con más dificultad, cartas entre los brazos, debajo de los dos vecinos.
    if (d > 0.3) for (let k = 0; k < 5; k++) out.push(radial((-54 + 72 * k) * DEG, 1.05, 1 + k));
    for (let j = 0; j < len; j++) for (let k = 0; k < 5; k++) out.push(radial((-90 + 72 * k) * DEG, 1.0 + j * 0.85, 6 + j * 5 + k));
    return out;
  },
  // Mariposa: cuerpo al centro encima de las alas; cada ala tiene parte de arriba y de abajo.
  butterfly(r, d) {
    const wing = [
      [-1.15, -0.75, -20, 3], [-2.05, -1.0, -32, 2], // arriba (de dentro hacia fuera)
      [-1.05, 0.85, 22, 6], [-1.9, 1.15, 36, 5], // abajo
    ];
    if (d > 0.15) wing.push([-2.9, -1.15, -44, 1], [-2.7, 1.4, 48, 4]);
    // Más grande: una carta acostada bajo cada ala y otra encima, entre la parte de arriba y la de abajo.
    if (d > 0.3) wing.push([-1.55, 0.05, 90, 0], [-1.1, 0.05, 0, 7]);
    const out = [];
    for (const [x, y, rot, z] of wing) out.push(cc(x, y, z, rot), cc(-x, y, z, -rot));
    const body = d > 0.15 ? 4 : 3;
    for (let i = 0; i < body; i++) out.push(cc(0, -0.9 + i * 0.6, 10 + i, 0));
    return out;
  },
  // Galaxia espiral: 2 o 3 brazos que salen del centro; las puntas de afuera quedan encima y se "desenrolla" hacia dentro.
  spiral(r, d) {
    const arms = d < 0.4 ? 3 : 2;
    const per = Math.round(5 + d * 4 + (arms === 2 ? 2 : 0));
    const out = [];
    for (let k = 0; k < arms; k++) {
      let th = 0;
      let last = null;
      for (let i = 0; i < per; i++) {
        // Avanza por la espiral hasta quedar a ~0.8 de la carta anterior.
        let p;
        do {
          th += 0.05;
          const rad = 0.75 + 0.42 * th;
          const a = th + (k * 2 * Math.PI) / arms;
          p = [rad * Math.cos(a), rad * Math.sin(a), a];
        } while (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.8);
        last = p;
        out.push(cc(p[0], p[1], 1 + i * arms + k, (p[2] * 180) / Math.PI));
      }
    }
    out.push(cc(0, 0, 0, 0));
    return out;
  },
  // Reloj de arena: dos triángulos punta con punta; todo pasa por la carta del cuello (difícil).
  hourglass(r, d) {
    const R = d > 0.55 ? 5 : 4;
    const sizes = [...Array(R).keys()].map((i) => R - i).concat([...Array(R - 1).keys()].map((i) => i + 2));
    const out = [];
    sizes.forEach((s, i) => rowOf(s, i * ROW, i, out));
    return out;
  },
};

const DEG = Math.PI / 180;
// Carta por su centro (las figuras se piensan así) → esquina superior izquierda.
function cc(cx, cy, z, rot = 0) {
  return { x: cx - W / 2, y: cy - H / 2, z, rot };
}
// Carta a una distancia del centro, con su lado largo apuntando hacia fuera.
function radial(a, dist, z) {
  return cc(dist * Math.cos(a), dist * Math.sin(a), z, a / DEG + 90);
}

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

  // ----- Piezas nuevas (Fase 7): solo en niveles sin ayudas -----
  // Sándwich: una carta escondida atrás, dos lado a lado y una encima al centro. 1 o 2 juntos.
  sandwich(r) {
    const k = randInt(r, 1, 2);
    const out = [];
    for (let u = 0; u < k; u++) {
      const x = u * 2.35;
      out.push(cc(x, 0, 0), cc(x - 0.6, 0.4, 1), cc(x + 0.6, 0.4, 1), cc(x, 0.7, 2));
    }
    return out;
  },
  // Cruz: una carta acostada al centro y cuatro alrededor que la tapan; a veces una más encima.
  cross(r) {
    const out = [cc(0, 0, 0, 90), cc(0, -1.05, 1), cc(0, 1.05, 1), cc(-1.25, 0, 1, 90), cc(1.25, 0, 1, 90)];
    if (r() < 0.5) out.push(cc(0, 0, 2));
    return out;
  },
  // Escalerita: dos escaleras de 2-3 cartas que suben una hacia la otra.
  steps(r) {
    const n = randInt(r, 2, 3);
    const out = [];
    for (let i = 0; i < n; i++) out.push({ x: i * 0.38, y: 0, z: i }, { x: (n - 1) * 0.76 + 1.08 - i * 0.38, y: 0, z: i });
    return out;
  },
  // Roseta: pétalos alrededor del centro (cada uno tapa al anterior) y una carta encima en medio.
  rosette(r) {
    const n = pick(r, [6, 8]);
    const out = [];
    for (let i = 0; i < n; i++) out.push(radial((i / n) * 2 * Math.PI - Math.PI / 2, 1.0, i));
    out.push(cc(0, 0, n));
    return out;
  },
  // Abanico inclinado: dos arriba, tres abajo (la del centro encima) y dos cartas giradas que tapan las dos filas.
  tiltFan(r) {
    const s = r() < 0.5 ? 1 : -1;
    return [
      cc(0, 0, 0), cc(1.1, 0, 0),
      cc(-0.25, 1.7, 0), cc(0.55, 1.75, 1), cc(1.35, 1.7, 0),
      cc(0.05, 0.85, 2, -16 * s), cc(1.05, 0.85, 3, 14 * s),
    ];
  },
  // Corona: 2 atrás, 3 en medio (tapan a las de atrás), 2 adelante en las orillas; a veces una escondida bajo el centro.
  crown(r) {
    const out = [];
    if (r() < 0.5) out.push(cc(1.05, 0.95, 0));
    out.push(cc(0.525, 0, 1), cc(1.575, 0, 1));
    out.push(cc(0, ROW, 2), cc(1.05, ROW, 2), cc(2.1, ROW, 2));
    out.push(cc(-0.3, 2 * ROW + 0.3, 3), cc(2.4, 2 * ROW + 0.3, 3));
    return out;
  },
};
// Las 7 de siempre, en su orden: los niveles con ayudas, el evento y los especiales solo usan estas.
const SMALL_BASE = ['miniPyramid', 'miniInv', 'stack', 'arc', 'ring', 'fan', 'twoRows'];

// Junta 2-4 grupos pequeños; el juego los acomoda según la pantalla.
// fresh: nivel sin ayudas, que también usa las piezas nuevas (ver buildLevel).
function clusters(r, d, boss, fresh = false) {
  const k = Math.min(4, (d < 0.2 ? 2 : randInt(r, 2, d < 0.5 ? 3 : 4)) + (boss ? 1 : 0));
  const big = ['arc', 'ring', 'rosette', 'tiltFan'];
  const names = fresh ? Object.keys(SMALL) : SMALL_BASE;
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
  // Nuevos: con 2 o 4 grupos también salen en espejo (como los tableros por piezas de otros juegos).
  if (fresh && k !== 3 && r() < 0.5)
    for (let i = 0; i < k / 2; i++) {
      chosen[k - 1 - i] = chosen[i];
      seeds[k - 1 - i] = seeds[i];
    }
  const out = chosen.map((name, i) => SMALL[name](mulberry32(seeds[i])));
  out.names = chosen;
  return out;
}

// [nombre, dificultad mínima, peso]
const TEMPLATE_UNLOCK = [
  ['pyramid', 0, 1], ['peaks', 0, 1], ['clusters', 0.07, 4], ['wall', 0.1, 1], ['diamond', 0.14, 1],
  ['scatter', 0.18, 1], ['towers', 0.22, 1], ['layers', 0.28, 1], ['invPyramid', 0.34, 1],
];

// Figuras nuevas (Fase 7): solo en niveles sin ayudas; los demás siguen con TEMPLATE_UNLOCK tal cual
// (sus mazos ya probados dependen de la forma).
// Corazón y reloj de arena son de los más duros (bot ~35%, como los picos): salen menos.
const FRESH_UNLOCK = [['butterfly', 0.08, 1], ['heart', 0.12, 0.6], ['spiral', 0.15, 1], ['star', 0.2, 1], ['hourglass', 0.3, 0.5]];
// Mínimo de cartas en niveles sin ayudas: los tableros chicos salían demasiado fáciles (bot 75-100%).
// Desde el nivel 4, 13; desde el 11, 15.
const freshMin = (g) => (g >= 10 ? 15 : g >= 3 ? 13 : 0);

// Respiros: desde el nivel 11, en cada mundo 1 nivel al azar (fijo por mundo) del 2.º al 9.º, y en 1 de cada 3
// mundos otro más. Nunca el jefe ni uno que pide ayudas (esos no son "fresh"). Forma fácil, dificultad baja y
// tablero chico permitido: el bot casual los gana ~80% (como los del 1 al 10).
const RESPITE_SHAPES = ['butterfly', 'layers', 'towers', 'clusters', 'clusters', 'pyramid'];
const RESPITE_MIN = 10;

// ---------- Tableros que se van descubriendo (Fase 7, parte 2) ----------
// Mesa enrollada: el tablero es una tira larga de piezas chicas pegadas una tras otra, de izquierda a derecha, que
// se ve por una ventana de SCROLL_VIEW de largo o más; lo demás sigue en el rollo (a la derecha, también con el
// teléfono parado). Cuando se va vaciando el principio de la tira, la mesa avanza justo lo que se liberó y las cartas
// salen del rollo de una en una (cortadas en el rollo mientras salen).
// Fuera del rollo valen las tapas de siempre. Una carta que no tiene otra encima se abre en cuanto asoma media
// carta (SCROLL_SHOW): ya se ve su número.
// Para el motor es tapar: cada carta está tapada por todas las que empiezan antes de su orilla izquierda
// + SCROLL_SHOW − ventana.
// El nivel se arma y se prueba con SCROLL_VIEW; si en la pantalla cabe más tira, el juego la alarga (scrollCover):
// con más ventana solo se quitan tapas, así que el nivel sigue teniendo solución.
// Nebulosa: se ven NEB_SLOTS tramos y los demás esperan en la nebulosa (a la derecha, o abajo con el teléfono
// parado). Al vaciar cualquier tramo, los que quedan se recorren y de la nebulosa sale el siguiente. Para el motor:
// las cartas del tramo k (k ≥ NEB_SLOTS) tienen neb = k − NEB_SLOTS + 1 (tramos que hay que vaciar antes).
// Solo niveles sin ayudas, ~1 de cada 12 cada una: mesa desde el nivel 40, gravedad desde el 70 y nebulosa desde
// el 100 (no respiros ni secretos; sí jefes).
// Gravedad: 3 a 5 columnas paradas sobre la mesa, cada una en su riel. Solo se juega la de abajo; la de encima va
// boca arriba para planear y las demás esperan apiladas arriba. Al quitar la de abajo, la columna cae un lugar.
// Para el motor: cada carta está tapada por la de abajo de su columna. Desde el nivel 70.
// Mesa plegable: llega doblada en 3. Solo se ve y se juega el panel de en medio; al vaciarlo, los dos de los lados se
// despliegan sobre sus bisagras (a los lados con el teléfono acostado, arriba y abajo parado). Para el motor es como
// la nebulosa: las cartas de los lados tienen neb = 1 (level.neb = [en medio, lado, lado]). Desde el nivel 140.
export const SCROLL_FROM = { mesa: 39, gravedad: 69, nebulosa: 99, plegable: 139 };
export const GRAV_SHOWN = 2; // cartas boca arriba en cada columna
export const NEB_SLOTS = 3;
export const SCROLL_VIEW = 8.2, SCROLL_GAP = 0.45, SCROLL_SHOW = 0.5;
const SCROLL_SPARE = 0.2; // sobrantes extra por carta del tablero
const SCROLL_PIECES = ['miniPyramid', 'miniInv', 'twoRows', 'twoRows', 'sandwich', 'crown', 'steps', 'stack', 'fan', 'tiltFan', 'arc', 'cross', 'rosette'];
export function scrollKind(g) {
  if (g >= TOTAL_LEVELS) return null;
  // Cada una se presenta justo en su nivel de inicio; después sale al azar.
  for (const k in SCROLL_FROM) if (g === SCROLL_FROM[k]) return k;
  if (g >= SCROLL_FROM.mesa && !(hash(g * 31 + 7) % 12)) return 'mesa';
  if (g >= SCROLL_FROM.nebulosa && !((hash(g * 7919 + 1013) >>> 9) % 12)) return 'nebulosa';
  if (g >= SCROLL_FROM.gravedad && !((hash(g * 104729 + 577) >>> 11) % 12)) return 'gravedad';
  // La plegable va al final: los niveles que ya eran de otra mesa siguen igual.
  return g >= SCROLL_FROM.plegable && !((hash(g * 3571 + 211) >>> 7) % 12) ? 'plegable' : null;
}
// Lo bonito de la mesa es lo larga: el doble de cartas que un tablero normal.
// La nebulosa, algo menos: solo se ven 3 tramos a la vez.
function scrollTramos(r, d, kind) {
  if (kind === 'gravedad') return gravCols(r, d);
  if (kind === 'plegable') return foldPanels(r, d);
  const want = kind === 'nebulosa' ? 32 + Math.round(d * 16) : 40 + Math.round(d * 20);
  const out = [], names = [];
  for (let n = 0; n < want; ) {
    const name = pick(r, SCROLL_PIECES);
    const cards = SMALL[name](mulberry32(randInt(r, 0, 1e9)));
    out.push(cards), names.push(name);
    n += cards.length;
  }
  out.names = names;
  return out;
}
// Mesa plegable: el panel de en medio y los dos lados (la misma figura en espejo). Cada panel es una pieza chica o
// dos juntas, hasta tener las cartas que pide.
function foldPanels(r, d) {
  const names = [];
  const panel = (want) => {
    const cards = [];
    let x = 0;
    for (let k = 0; k < 3 && cards.length < want; k++) {
      const name = pick(r, Object.keys(SMALL));
      const g = normalizeGroup(SMALL[name](mulberry32(randInt(r, 0, 1e9))));
      cards.push(...g.cards.map((c) => ({ ...c, x: c.x + x, h: g.h })));
      names.push(name);
      x += g.w + 0.4;
    }
    // Las piezas centradas a lo alto.
    const H = Math.max(...cards.map((c) => c.h));
    return cards.map(({ h, ...c }) => ({ ...c, y: c.y + (H - h) / 2 }));
  };
  const mid = panel(11 + Math.round(d * 6));
  const side = panel(8 + Math.round(d * 5));
  const w = Math.max(...side.map((c) => c.x));
  const out = [mid, side, side.map((c) => ({ ...c, x: w - c.x, rot: -(c.rot || 0) }))];
  out.names = names;
  return out;
}
// Gravedad: columnas de alto parecido (cada carta un poco más arriba que la de abajo; el juego las acomoda).
function gravCols(r, d) {
  const n = randInt(r, 3, 5), want = 26 + Math.round(d * 14);
  const out = Array.from({ length: n }, () => []);
  for (let i = 0; i < want; i++) out[i % n].push({ x: 0, y: -out[i % n].length * 0.2, z: out[i % n].length });
  return out;
}
// Dónde empieza cada tramo en la tira (de izquierda a derecha).
export function scrollStrip(groups) {
  const at = [];
  const end = groups.reduce((s, g, k) => ((at[k] = s), s + g.w + SCROLL_GAP), 0) - SCROLL_GAP;
  return { at, end };
}
// Tapas del rollo con una ventana de view: a cada carta la tapan las que empiezan antes de su orilla izquierda
// + SCROLL_SHOW − view (mientras no se vayan, la carta no asoma lo bastante del rollo).
function rollCover(cards, groups, view) {
  const { at } = scrollStrip(groups), span = cards.map((p) => scrollSpan(p, at));
  return cards.map((p, i) => cards.reduce((acc, q, j) => (span[j][0] < span[i][0] + SCROLL_SHOW - view && acc.push(j), acc), []));
}
// Tapas de cada carta de una mesa enrollada con una ventana más larga (view ≥ SCROLL_VIEW).
export function scrollCover(L, view) {
  const roll = rollCover(L.cards, L.groups, Math.max(SCROLL_VIEW, view));
  return L.cards.map((c, i) => [...c.under, ...roll[i]]);
}
// Orillas izquierda y derecha de una carta en la tira.
export function scrollSpan(c, at) {
  const xs = corners(c).map((p) => p[0]);
  return [at[c.group] + Math.min(...xs), at[c.group] + Math.max(...xs)];
}

export function isRespite(g) {
  const w = Math.floor(g / LEVELS_PER_WORLD), i = g % LEVELS_PER_WORLD;
  if (g < LEVELS_PER_WORLD || i === LEVELS_PER_WORLD - 1) return false;
  const h = hash(w * 7919 + 17);
  const a = 1 + (h % 8), b = 1 + ((h >>> 8) % 8);
  return i === a || (h >>> 16) % 3 === 0 && i === b;
}

function chooseTemplate(r, g, d, fresh = false) {
  if (g < 3) return ['pyramid', 'peaks', 'clusters'][g];
  // Jefes: las formas que más cuesta limpiar (medido con tests/difficulty.mjs).
  if (g % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1 && d > 0.15) return pick(r, ['peaks', 'peaks', 'diamond', 'pyramid', 'wall', 'scatter', ...(fresh ? ['star'] : [])]);
  const ok = (fresh ? [...TEMPLATE_UNLOCK, ...FRESH_UNLOCK] : TEMPLATE_UNLOCK).filter(([, min]) => min <= d);
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
  // Sin ayudas: si salía muy duro (bot < 15% antes del 2500), otro tablero ya probado (soft-data.js).
  return h ? hardened(buildLevel(g, null, d?.t), d, h) : buildLevel(g, null, SOFT_DATA[g] || 0);
}

// Tablero sin endurecer. t: otro tablero para el mismo nivel (tools/hard-levels.mjs prueba varios hasta que uno se deja).
export function buildLevel(g, ev = null, t = 0) {
  const secret = !ev && isSecret(g);
  const base = ev ? ev.world * LEVELS_PER_WORLD + ev.index : secret ? (g - TOTAL_LEVELS) * LEVELS_PER_WORLD + LEVELS_PER_WORLD - 1 : g;
  const world = Math.floor(base / LEVELS_PER_WORLD);
  const index = base % LEVELS_PER_WORLD;
  const r = mulberry32(hash(ev ? ev.seed : t ? g + t * 104729 : g));
  // Nivel sin ayudas: puede salir con las formas y piezas nuevas. Los que piden ayudas, el evento y los
  // especiales no las usan, porque sus mazos ya probados (path-data, event-data, special-data) dependen de la forma.
  const fresh = !ev && !hardHelp(g);
  // Respiro: en cada mundo 1 nivel (a veces 2) sale fácil, para que no todos sean cuesta arriba (ver isRespite).
  const respite = fresh && !secret && isRespite(base);
  const scroll = fresh && !secret && !respite ? scrollKind(base) : null;
  const d0 = ev ? ev.d : secret ? Math.min(1, difficulty(base) + 0.05) : difficulty(base);
  // Mesa enrollada: la tira es larga y solo se ve un pedazo; el mazo va más amable (y con más sobrantes, abajo).
  // La nebulosa, algo menos (medido con el bot casual).
  // El nivel donde se estrena cada mesa va amable aunque sea jefe.
  const debut = scroll && base === SCROLL_FROM[scroll];
  const d = respite ? Math.min(d0, 0.06 + d0 * 0.15) : debut ? d0 * (scroll === 'gravedad' ? 0.35 : scroll === 'plegable' ? 0.15 : 0.3) : scroll === 'mesa' ? d0 * 0.3 : scroll === 'gravedad' ? d0 * (base < 200 ? 0.35 : 0.55) : scroll ? d0 * 0.65 : d0;
  // Evento: en cada planeta salen más seguido las formas que más cuestan (medido con el bot casual).
  // Evento: en cada planeta salen más seguido las formas que más cuestan (medido con el bot casual).
  const template = ev?.template || (ev && (index === LEVELS_PER_WORLD - 1 || r() < 0.15 + ev.tight * 0.17) ? pick(r, ['peaks', 'peaks', 'scatter', 'invPyramid']) : scroll || (respite ? pick(r, RESPITE_SHAPES) : chooseTemplate(r, ev ? Math.max(3, base) : base, d, fresh)));

  const shape = (dd) => (template === 'clusters' ? clusters(r, dd, index === LEVELS_PER_WORLD - 1, fresh) : [TEMPLATES[template](r, dd)]);
  let raw = scroll ? scrollTramos(r, d, scroll) : shape(d);
  // Sin ayudas: si salió muy chico, se vuelve a armar un poco más grande.
  for (let k = 1; fresh && !scroll && k <= 12 && raw.reduce((s, gr) => s + gr.length, 0) < (respite ? RESPITE_MIN : freshMin(base)); k++) raw = shape(Math.min(1, d + k * 0.15));
  const groups = raw.map(normalizeGroup);
  const pos = groups.flatMap((gr, gi) => gr.cards.map((c) => ({ ...c, group: gi })));
  const n = pos.length;

  // Solo se tapan cartas del mismo grupo.
  const coveredBy = pos.map((p) =>
    pos.reduce((acc, q, j) => (q.group === p.group && q.z > p.z && overlaps(p, q) ? (acc.push(j), acc) : acc), []),
  );
  // Mesa enrollada: una carta sale completa del rollo cuando la tira ya empieza en su orilla derecha − SCROLL_VIEW
  // o más adelante; o sea, cuando ya se fueron todas las cartas que empiezan antes de eso.
  const mesa = scroll === 'mesa', nebula = scroll === 'nebulosa', grav = scroll === 'gravedad', fold = scroll === 'plegable';
  const under = mesa && coveredBy.map((a) => a.slice());
  if (mesa) rollCover(pos, groups, SCROLL_VIEW).forEach((a, i) => coveredBy[i].push(...a));
  // Nebulosa: tramos que hay que vaciar antes de que salga cada carta.
  // Plegable: los lados salen al vaciar el panel de en medio.
  const neb = nebula ? pos.map((p) => Math.max(0, p.group - NEB_SLOTS + 1)) : fold ? pos.map((p) => (p.group ? 1 : 0)) : null;
  const tramos = (nebula || grav || fold) && groups.map((_, gi) => pos.reduce((a, p, i) => (p.group === gi && a.push(i), a), []));
  // Gravedad: a cada carta solo la tapa la de abajo de su columna (la primera de cada columna es la de abajo).
  if (grav) for (const t of tramos) t.forEach((id, k) => (coveredBy[id] = k ? [t[k - 1]] : []));

  const removed = new Array(n).fill(false);
  const order = [];
  while (order.length < n) {
    const free = [];
    const out = neb ? tramos.reduce((k, t) => k + t.every((j) => removed[j]), 0) : 0;
    for (let i = 0; i < n; i++) if (!removed[i] && coveredBy[i].every((j) => removed[j]) && (!neb || neb[i] <= out)) free.push(i);
    const i = pick(r, free);
    removed[i] = true;
    order.push(i);
  }

  const boss = index === LEVELS_PER_WORLD - 1;
  // Mecánicas del nivel: cada una aparece a partir de su mundo y luego se combinan (máximo 2 tipos).
  // Respiro: una sola mecánica como mucho.
  const mech = new Set(chooseMechanics(r, world, index, boss, n, ev).slice(0, respite ? 1 : 2));
  // Mesa enrollada y nebulosa sin bombas: su cuenta correría con la carta todavía escondida.
  if (scroll) mech.delete('bomb');
  // Estreno de la plegable sin otras mecánicas: al principio solo se juega el panel de en medio y ya cuesta más.
  if (debut && scroll === 'plegable') mech.clear();
  // Cometa: es un regalo, así que va aparte de las demás (no cuenta en el límite de 2 y sale con cualquiera).
  // Por ahora solo sin ayudas y sin mesas especiales. Se estrena en el primer nivel de su mundo y después sale de
  // vez en cuando (es un regalo: no muy seguido). Usa su propio sorteo: un nivel que no lo trae queda igual que antes.
  const rc = mulberry32(hash(g * 7907 + t * 31 + 11));
  if (fresh && !scroll && n >= 8 && world >= MECH_INTRO.comet && (base === extraDebut('comet') || rc() < EXTRA_ODDS)) mech.add('comet');
  // Cohete turbo: el otro regalo, igual que el cometa pero con su propio sorteo.
  const rt = mulberry32(hash(g * 6007 + t * 37 + 5));
  const turbo = fresh && !scroll && n >= 8 && world >= MECH_INTRO.turbo && (base === extraDebut('turbo') || rt() < EXTRA_ODDS);
  // Boleto partido: mecánica normal (cuenta en el límite de 2), pero con su propio sorteo como el cometa, para que los
  // niveles que no lo traen queden igual. En su mundo va en todos (sola en los primeros niveles); después, de vez en cuando.
  // Por ahora solo sin ayudas y sin mesas especiales (los demás, al cerrar la Fase 7).
  const rb = mulberry32(hash(g * 5303 + t * 41 + 3));
  if (fresh && !scroll && n >= 10 && world >= MECH_INTRO.ticket && (world === MECH_INTRO.ticket || rb() < TICKET_ODDS)) {
    const keep = respite || (world === MECH_INTRO.ticket && index < 5) ? 0 : 1;
    [...mech].slice(keep).forEach((m) => mech.delete(m));
    mech.add('ticket');
  }

  // Carta regalo: una carta especial (sin número) que se activa sola al quedar destapada del todo
  // y manda 2-5 cartas al final del mazo. Va tapada y en el primer 40% del orden de retirada.
  let packId = null;
  if (mech.has('pack')) {
    // (En la nebulosa, solo en los tramos que se ven al empezar: su momento de salir no depende de sus tapas.)
    const early = order.slice(0, Math.floor(n * 0.4)).filter((i) => coveredBy[i].length && !neb?.[i]);
    if (early.length) packId = pick(r, early);
  }
  // Bombas (1-3): cartas especiales sin número, tapadas, que hay que destapar antes de que su cuenta llegue a 0.
  const bombIds = [];
  // Sin ayudas: ninguna bomba (ni cometa) tapa ni está tapada por otra especial (el motor solo activa una por
  // jugada y la de abajo se quedaba atorada). Los demás niveles siguen igual: sus mazos probados dependen de esto.
  const touch = (i, j) => coveredBy[i].includes(j) || coveredBy[j].includes(i);
  if (mech.has('bomb')) {
    const mid = order.slice(Math.floor(n * 0.15), Math.floor(n * 0.75)).filter((i) => coveredBy[i].length && i !== packId);
    shuffle(r, mid);
    const want = randInt(r, 1, n >= 20 ? 3 : 2);
    if (fresh) for (const i of mid) bombIds.length < want && ![packId, ...bombIds].some((j) => j != null && touch(i, j)) && bombIds.push(i);
    else bombIds.push(...mid.slice(0, want));
  }
  // Cometas (1-2): cartas especiales sin número, tapadas. Destapado a tiempo suma a la racha (ver cometWish en
  // engine.js); si no, se va. Nunca estorba, así que no hace falta comprobarlo con el solucionador.
  const cometIds = [];
  if (mech.has('comet')) {
    const mid = order.slice(Math.floor(n * 0.15), Math.floor(n * 0.8)).filter((i) => coveredBy[i].length && i !== packId && !bombIds.includes(i));
    shuffle(rc, mid);
    const want = randInt(rc, 1, n >= 24 ? 2 : 1);
    for (const i of mid) cometIds.length < want && ![packId, ...bombIds, ...cometIds].some((j) => j != null && touch(i, j)) && cometIds.push(i);
  }
  const play = order.filter((i) => i !== packId && !bombIds.includes(i) && !cometIds.includes(i)); // cartas con número, en orden de solución
  const np = play.length;

  const minC = d < 0.15 ? 4 : d < 0.35 ? 3 : 2;
  // Evento: cadenas más cortas en cada planeta (menos rachas largas = menos premios de racha).
  const maxC = Math.max(minC + 1, Math.round(9 - d * 5.5) - (boss ? 2 : 0) - (ev ? ev.tight : 0));
  const ranks = new Array(n);
  const starts = [];
  const chainEnd = []; // índice (en play) de la última carta de la cadena de cada carta
  for (let k = 0; k < np; ) {
    const len = Math.min(np - k, randInt(r, minC, maxC));
    for (let t = 0; t < len; t++) chainEnd[k + t] = k + len - 1;
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
  // Mesa enrollada: la tira es el doble de larga; más sobrantes para que no cueste el doble (nebulosa: la mitad).
  if (scroll) spares += Math.round(n * (mesa ? SCROLL_SPARE : SCROLL_SPARE / 2));
  // Plegable: en su estreno, unas cartas de más (al principio solo hay jugadas en el panel de en medio).
  if (debut && fold) spares += 3;
  // En niveles fáciles las sobrantes suelen ser vecinas de alguna carta del tablero.
  const helpfulCard = (p) => card(r() < p ? (pick(r, known) + pick(r, [1, 12])) % 13 : randInt(r, 0, 12));
  for (let i = 0; i < spares; i++) stock.push(helpfulCard((1 - d) * 0.85));

  const cards = pos.map((p, i) => ({ id: i, ...p, rank: ranks[i], suit: randInt(r, 0, 3), coveredBy: coveredBy[i], ...(under && { under: under[i] }), ...(neb?.[i] && { neb: neb[i] }) }));
  for (const id of [...bombIds, ...cometIds]) delete cards[id].rank;
  const SPECIAL = ['lock', 'key', 'pack', 'ice', 'alt', 'arrow', 'curtain', 'curtainKey', 'bomb', 'live', 'comet', 'turbo', 'half'];
  const plain = (id) => SPECIAL.every((f) => cards[id][f] == null);

  // Boleto partido (1-2): la referencia juega primero la mitad de arriba (su número de la cadena) y la de abajo al final
  // de esa misma cadena, que es ±1 de la última carta. Por eso las cartas que tapa el boleto deben ir después de esa
  // cadena. Cada boleto en una cadena distinta. tails[m] = boleto cuya otra mitad se juega tras la carta m.
  const tails = {};
  if (mech.has('ticket')) {
    const specials = [packId, ...bombIds, ...cometIds].filter((j) => j != null);
    const opts = [];
    for (let k = 0; k < np; k++) {
      const id = play[k], m = chainEnd[k];
      if (!plain(id) || specials.some((j) => coveredBy[j].includes(id))) continue;
      if (play.some((j, q) => q > k && q <= m && coveredBy[j].includes(id))) continue;
      opts.push(k);
    }
    shuffle(rb, opts);
    const want = randInt(rb, 1, np >= 20 ? 2 : 1);
    for (const k of opts) {
      const m = chainEnd[k];
      if (Object.keys(tails).length >= want || tails[m] != null) continue;
      const id = play[k];
      let b = mod13(ranks[play[m]] + (rb() < 0.5 ? 1 : -1));
      if (b === ranks[id]) b = mod13(2 * ranks[play[m]] - b);
      cards[id].half = b;
      tails[m] = id;
    }
  }
  // Solución de referencia con las dos mitades de cada boleto.
  const steps = play.flatMap((id, k) => [{ id, rank: ranks[id], k }, ...(tails[k] != null ? [{ id: tails[k], rank: cards[tails[k]].half, tail: true }] : [])]);

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
  const bombFree = {}; // acciones al quedar destapada cada bomba (o cometa) en la referencia
  {
    const stk = stock.slice();
    const rem = new Array(n).fill(false);
    let top = waste0;
    let si = 0;
    let a = 0;
    let packed = packId == null;
    for (const { id, rank, k, tail } of steps) {
      let dn = 0;
      while (!follows(top, rank)) {
        top = stk[si++];
        a++;
        dn++;
      }
      if (!tail) (drew[k] = dn), (act[k] = a);
      if (tail || cards[id].half == null) rem[id] = true;
      top = { rank };
      a++;
      if (!packed && coveredBy[packId].every((j) => rem[j])) {
        stk.push(...cards[packId].pack);
        packed = true;
      }
      for (const id of [...bombIds, ...cometIds]) if (bombFree[id] == null && coveredBy[id].every((j) => rem[j])) bombFree[id] = a;
    }
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
      const k = pickPlain(0, np - 1, (k) => drew[k + 1] === 0 && tails[k] == null);
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
  // Cometa: la referencia lo alcanza con 2-4 acciones de margen.
  for (const id of cometIds) cards[id].comet = (bombFree[id] ?? 0) + randInt(rc, 2, 4);
  // Cohete turbo: la mitad de las veces es una carta del tablero (de la primera mitad de la solución, para que
  // alcance a lucirse) y la otra mitad una carta del mazo. Solo suma a la racha: no cambia la solución.
  if (turbo) {
    const k = rt() < 0.5 ? pickPlain(0, Math.ceil(np * 0.6)) : null;
    if (k != null) cards[play[k]].turbo = true;
    else stock[randInt(rt, 0, Math.max(0, Math.floor(stock.length * 0.6) - 1))].turbo = true;
  }
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
    g, world, index, d, template, boss, secret, event: !!ev, fresh, ...(respite && { respite }), ...(scroll && { scroll }),
    ...(raw.names && { pieces: raw.names }),
    ...((nebula || fold) && { neb: tramos }),
    ...(grav && { cols: tramos }),
    groups: groups.map(({ w, h }) => ({ w, h })),
    cards,
    keys,
    curtains,
    waste0,
    stock,
    solution: steps.map((x) => x.id), // la carta regalo no está (se activa sola); el boleto partido va dos veces
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
  level.meta.mechs = MECHANICS.filter((m) => cards.some((c) => c[MECH_FIELD[m]] != null) || (m === 'turbo' && stock.some((c) => c.turbo)));
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
export const MECHANICS = ['lock', 'pack', 'ice', 'double', 'arrow', 'curtain', 'bomb', 'live', 'ticket', 'comet', 'turbo'];
const MECH_FIELD = { lock: 'lock', pack: 'pack', ice: 'ice', double: 'alt', arrow: 'arrow', curtain: 'curtain', bomb: 'bomb', live: 'live', ticket: 'half', comet: 'comet', turbo: 'turbo' };
// Mundo (índice desde 0) en el que se presenta cada una.
export const MECH_INTRO = { lock: 1, pack: 2, ice: 4, double: 7, arrow: 11, curtain: 15, bomb: 19, live: 24, ticket: 20, comet: 12, turbo: 16 };
export const MECH_NAMES = {
  lock: 'Candado', pack: 'Carta regalo', ice: 'Hielo', double: 'Carta doble', arrow: 'Flecha', curtain: 'Cortina', bomb: 'Bomba', live: 'Carta viva', ticket: 'Boleto partido', comet: 'Cometa', turbo: 'Cohete turbo',
};
// Cartas de regalo (cometa y cohete turbo): no entran al sorteo de mecánicas, van aparte (buildLevel), con esta
// probabilidad por nivel cada una. Los que piden ayudas, el evento y los especiales todavía no las traen: sus mazos ya
// probados (path-data, event-data, special-data) cambiarían; se meten al cerrar la Fase 7.
// Como los de ayudas y las mesas especiales no las traen, se sortean algo más seguido: contando todos queda ~1 de cada 32.
// (Pendiente al acomodar niveles: que salgan cada 30-35 niveles en vez de al azar.)
export const EXTRA = ['comet', 'turbo'];
// Boleto partido: no entra al sorteo de chooseMechanics (cambiaría los niveles ya probados); va con su propio sorteo.
export const TICKET_ODDS = 0.12;
export const EXTRA_ODDS = 0.047;
// Estreno: el primer nivel de su mundo que no pide ayudas ni es mesa especial.
const debuts = {};
export function extraDebut(m) {
  if (debuts[m] == null) {
    let g = MECH_INTRO[m] * LEVELS_PER_WORLD;
    while (hardHelp(g) || scrollKind(g)) g++;
    debuts[m] = g;
  }
  return debuts[m];
}

function chooseMechanics(r, world, index, boss, n, ev = null) {
  if (n < 8) return [];
  const avail = MECHANICS.filter((m) => !EXTRA.includes(m) && m !== 'ticket' && world >= MECH_INTRO[m]);
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
  const map = (c) => (c.rank == null ? { ...c } : { ...c, rank: (c.rank + k) % 13, suit: perm[c.suit], ...(c.alt != null && { alt: (c.alt + k) % 13 }), ...(c.half != null && { half: (c.half + k) % 13 }) });
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
