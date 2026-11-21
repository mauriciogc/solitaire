import { mulberry32, hash, randInt, pick, shuffle } from './rng.js';
import { follows, mod13, HOLE_EVERY, BELT_W, solve, initState, playRank, cutOf, refStep, refReady, play as playCard, draw as drawCard, won, starsFor, playCasual, casualRun, SL_NEED, PAINT_N } from './engine.js';

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
// mundos otro más. Nunca el jefe ni uno duro (esos no son "fresh"). Forma fácil, dificultad baja y
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
// Solo niveles sin ayudas, ~1 de cada 12 cada una: mesa desde el nivel 51, gravedad desde el 110 y nebulosa desde
// el 100 (no respiros ni secretos; sí jefes).
// Gravedad: 3 a 5 columnas paradas sobre la mesa, cada una en su riel. Solo se juega la de abajo; la de encima va
// boca arriba para planear y las demás esperan apiladas arriba. Al quitar la de abajo, la columna cae un lugar.
// Para el motor: cada carta está tapada por la de abajo de su columna. Desde el nivel 70.
// Mesa plegable (desde el 208) y luego mantel doblado: los dos se quitaron el 12 nov 2026 (el usuario: en el celular
// se veían chicos y las animaciones no convencieron). Sus niveles ahora llevan una de las otras mesas (scrollKind).
// 8 nov 2026: todo lo que estrena el camino (cartas, mesas y eventos) va a 10 niveles o más de lo anterior; lo que estaba
// encimado se separó y lo de después se corrió lo mismo (antes mesa 39, gravedad 69, nebulosa 99, plegable 139).
// 13 nov 2026: mesa que se voltea (columnas como la gravedad que dan media vuelta) en el nivel 611.
// 13 nov 2026 (pedido del usuario): hangar 201 y bitácora 311 (entre el 170 y el 331 no había mesa) y portales 551.
// 14 nov 2026 (pedido del usuario, calendario nuevo): una mesa cada 50 niveles (51, 101, … 601) y dos cartas en medio
// (a +20 y +30 de la mesa): enrollada 51, gravedad 101, nebulosa 151, hangar 201, bitácora 251, marea 301, agujero
// negro 351, puertas 401, banda 451, asteroides 501, grúa 551 y la que se voltea 601.
// 16 nov 2026 (pedido del usuario): el cohete se estrena en el 651 (el lugar de la caja galáctica, que se quitó).
// Tubos neumáticos (19 nov 2026, pedido del usuario) en el 851: la mesa que sigue al meteoro fugaz (801). 20 nov 2026:
// sin tubos, ahora «cartas al vuelo» (la clave sigue siendo 'tubos' por los guardados).
export const SCROLL_FROM = { mesa: 50, gravedad: 100, nebulosa: 150, hangar: 200, bitacora: 250, portal: 550, voltea: 600, cohete: 650, tubos: 850 };
// Marea (7 nov 2026): el agua sube desde abajo cada 3 robos y baja cada 3 jugadas; lo que queda bajo el agua no se
// juega. Desde el nivel MAREA_FROM + 1, ~1 de cada 10 normales del camino (sin otra mesa, respiro ni ayudas).
export const TIDE_FROM = 300; // antes 340 (ver SCROLL_FROM)
// Estreno: el primero desde MAREA_FROM que no es otra mesa, duro ni respiro.
let tideDebut = null;
export const tideFirst = () => {
  if (tideDebut == null) for (tideDebut = TIDE_FROM; cardDebut(tideDebut) || exFold(tideDebut) || scrollKind(tideDebut) || hardHelp(tideDebut) || isRespite(tideDebut); tideDebut++);
  return tideDebut;
};
export const tideKind = (g) => finalTable(g) ? finalTable(g) === 'tide' : (exFoldKind(g) ? exFoldKind(g) === 'tide' : !cardDebut(g) && (g === tideFirst() || (g > tideFirst() && !ovDebut(g) && !((hash(g * 3571 + 61) >>> 5) % 10))));
// Agujero negro (8 nov 2026): mesa sobre un tablero normal, como la marea (nunca juntas). Atrapa casi todo un grupo
// (9 nov 2026; antes 3-4 cartas marcadas) y cada HOLE_EVERY jugadas o robos les revuelve los números (ver rankOf en engine.js). Desde HOYO_FROM + 1 (a más de
// 10 niveles de la carta moneda), se intenta en ~1 de cada 5 normales del camino sin otra mesa, respiro ni ayudas
// (se queda en ~1 de cada 3 de esos: en los demás no hay cartas vecinas o no se podría ganar).
export const HOLE_FROM = 350; // antes 373
let holeDebut = null;
export const holeFirst = () => {
  if (holeDebut == null) for (holeDebut = HOLE_FROM; cardDebut(holeDebut) || exFold(holeDebut) || scrollKind(holeDebut) || hardHelp(holeDebut) || isRespite(holeDebut) || tideKind(holeDebut); holeDebut++);
  return holeDebut;
};
// Puertas (9 nov 2026, rehechas a pedido del usuario): un tablero normal y, a la orilla, 2 o 3 puertas chicas con una
// pila de 3 a 5 cartas detrás. Hay menos llaves que puertas (2 puertas: 1 llave; 3: 1 o 2): cada carta llave del
// tablero da una llave y el jugador escoge qué puerta abrir. Al abrirse, su premio se activa (moneda, cometa o cohete) y
// sus cartas salen al tablero: unas pilas ayudan (números seguidos) y otras estorban. Si no la abre, no cuentan.
export const DOORS_FROM = 400; // antes 404
let doorsDebut = null;
export const doorsFirst = () => {
  if (doorsDebut == null) for (doorsDebut = DOORS_FROM; cardDebut(doorsDebut) || exFold(doorsDebut) || scrollKind(doorsDebut) || hardHelp(doorsDebut) || isRespite(doorsDebut) || tideKind(doorsDebut) || holeKind(doorsDebut); doorsDebut++);
  return doorsDebut;
};
export const doorsKind = (g) => finalTable(g) ? finalTable(g) === 'doors' : (exFoldKind(g) ? exFoldKind(g) === 'doors' : !cardDebut(g) && !tideKind(g) && !holeKind(g) && (g === doorsFirst() || (g > doorsFirst() && !ovDebut(g) && !((hash(g * 6151 + 113) >>> 4) % 10))));
// Banda transportadora (8 nov 2026): una fila de cartas da vueltas dentro de una máquina; solo se ven BELT_W a la vez
// y avanza un lugar con cada jugada o robo (ver beltShown en engine.js). Va junto a un tablero normal.
export const BANDA_FROM = 450; // antes 455
let bandaDebut = null;
export const bandaFirst = () => {
  if (bandaDebut == null) for (bandaDebut = BANDA_FROM; cardDebut(bandaDebut) || exFold(bandaDebut) || scrollKind(bandaDebut) || hardHelp(bandaDebut) || isRespite(bandaDebut) || tideKind(bandaDebut) || holeKind(bandaDebut) || doorsKind(bandaDebut); bandaDebut++);
  return bandaDebut;
};
export const bandaKind = (g) => finalTable(g) ? finalTable(g) === 'banda' : (exFoldKind(g) ? exFoldKind(g) === 'banda' : !cardDebut(g) && !tideKind(g) && !holeKind(g) && !doorsKind(g) && (g === bandaFirst() || (g > bandaFirst() && !ovDebut(g) && !((hash(g * 2477 + 71) >>> 5) % 6))));
// Cinturón de asteroides (10 nov 2026, pedido del usuario): mesa sobre un tablero normal, nunca con otra. Cada
// ROCK_EVERY robos caen 2 o 3 piedras que tapan cartas libres por unas jugadas (ver dropRocks en engine.js). Desde
// ROCAS_FROM, ~1 de cada 6 normales que no traen otra mesa.
export const ROCKS_FROM = 500; // antes 505
let rocksDebut = null;
export const rocksFirst = () => {
  if (rocksDebut == null) for (rocksDebut = ROCKS_FROM; cardDebut(rocksDebut) || exFold(rocksDebut) || scrollKind(rocksDebut) || hardHelp(rocksDebut) || isRespite(rocksDebut) || tideKind(rocksDebut) || holeKind(rocksDebut) || doorsKind(rocksDebut) || bandaKind(rocksDebut); rocksDebut++);
  return rocksDebut;
};
export const rocksKind = (g) => finalTable(g) ? finalTable(g) === 'rocks' : (exFoldKind(g) ? exFoldKind(g) === 'rocks' : !cardDebut(g) && !tideKind(g) && !holeKind(g) && !doorsKind(g) && !bandaKind(g) && (g === rocksFirst() || (g > rocksFirst() && !ovDebut(g) && !((hash(g * 5303 + 89) >>> 5) % 6))));
// Gravedad cero (701), planetas en órbita (751) y ping-pong (801) (17 nov 2026, pedido del usuario; escogidas en
// dev/ideas-dinamicas-2.html): mesas sobre un tablero normal, como los asteroides (ver zeroStep, orbitOn y pongStep en
// engine.js). Desde su estreno, ~1 de cada 6 normales que no traen otra mesa.
export const ZERO_FROM = 700, ORBIT_FROM = 750, PONG_FROM = 800;
const firstOf = {};
const ovTaken = (g) => tideKind(g) || holeKind(g) || doorsKind(g) || bandaKind(g) || rocksKind(g);
const ovFirst = (k, from, prev) => {
  if (firstOf[k] == null) for (firstOf[k] = from; cardDebut(firstOf[k]) || exFold(firstOf[k]) || scrollKind(firstOf[k]) || hardHelp(firstOf[k]) || isRespite(firstOf[k]) || ovTaken(firstOf[k]) || prev(firstOf[k]); firstOf[k]++);
  return firstOf[k];
};
const ovKind = (k, first, salt, prev) => (g) => (finalTable(g) ? finalTable(g) === k : exFoldKind(g) ? exFoldKind(g) === k : !cardDebut(g) && !ovTaken(g) && !prev(g) && (g === first() || (g > first() && !ovDebut(g) && !((hash(g * salt + 101) >>> 5) % 6))));
export const zeroFirst = () => ovFirst('zero', ZERO_FROM, () => false);
export const zeroKind = ovKind('zero', zeroFirst, 6007, () => false);
export const orbitFirst = () => ovFirst('orbit', ORBIT_FROM, zeroKind);
export const orbitKind = ovKind('orbit', orbitFirst, 7349, zeroKind);
export const pongFirst = () => ovFirst('pong', PONG_FROM, (g) => zeroKind(g) || orbitKind(g));
export const pongKind = ovKind('pong', pongFirst, 8191, (g) => zeroKind(g) || orbitKind(g));
// Planetas en órbita: de 1 a 3 planetas (17 nov 2026, el usuario: «¿siempre solo salen dos?»; según el tamaño del grupo)
// dan vueltas por el grupo más grande (sus cartas en orden alrededor del centro) y empiezan repartidos. El primero, si el
// grupo es de 12+, es grande: tapa su carta y la de junto (la más cercana); los demás tapan una. Cada parada = las
// cartas que tapa; todos avanzan una carta por acción.
function orbitPath(cards, g) {
  const by = new Map();
  for (const c of cards) if (c.door == null && c.belt == null) by.set(c.group, [...(by.get(c.group) || []), c]);
  const list = [...by.values()].sort((a, b) => b.length - a.length)[0];
  if (!list || list.length < 6) return null;
  const cx = list.reduce((a, c) => a + c.x, 0) / list.length, cy = list.reduce((a, c) => a + c.y, 0) / list.length;
  const ring = list.map((c) => [c.id, Math.atan2(c.y - cy, c.x - cx)]).sort((a, b) => a[1] - b[1]).map(([id]) => id);
  const near = (id) => {
    const c = cards[id];
    let best = null, bd = 1.3;
    for (const x of list) if (x.id !== id && Math.hypot(x.x - c.x, x.y - c.y) < bd) (bd = Math.hypot(x.x - c.x, x.y - c.y)), (best = x.id);
    return best;
  };
  const h = hash(g * 389 + 11), L = ring.length;
  const k = Math.min(3, 1 + (L >= 12 ? 1 : 0) + (L >= 32 || (L >= 22 && (h >>> 4) % 2) ? 1 : 0));
  return Array.from({ length: k }, (_, j) => {
    const size = j === 0 && L >= 12 ? 2 : 1;
    const stops = ring.map((id) => (size === 2 && near(id) != null ? [id, near(id)] : [id]));
    return { stops, off: (h + Math.floor((j * L) / k)) % L, size };
  });
}
// Caja galáctica (15 nov 2026): descartada el 16 nov 2026 por el usuario (no le gustó; no volver a proponer cajas
// con combinación). Su nivel 651 quedó como nivel normal.
// Nivel final de cada planeta (el 10, menos el del jefe de constelación): de preferencia una mesa especial de las que
// ya se estrenaron (FINAL_TABLES: desde qué nivel), escogida con su hash. Los duros no (su tablero es otro).
export const FINAL_MIX = 3;
export const isFinal = (g) => g < TOTAL_LEVELS && g % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1 && !constBoss(g);
const FINAL_TABLES = () => [['zero', ZERO_FROM], ['orbit', ORBIT_FROM], ['pong', PONG_FROM], ['gravedad', SCROLL_FROM.gravedad], ['nebulosa', SCROLL_FROM.nebulosa], ['hangar', SCROLL_FROM.hangar], ['bitacora', SCROLL_FROM.bitacora], ['tide', TIDE_FROM], ['hole', HOLE_FROM], ['doors', DOORS_FROM], ['banda', BANDA_FROM], ['rocks', ROCKS_FROM], ['portal', SCROLL_FROM.portal], ['voltea', SCROLL_FROM.voltea], ['cohete', SCROLL_FROM.cohete]];
export const finalTable = (g) => {
  if (!isFinal(g) || hardHelp(g)) return null;
  const open = FINAL_TABLES().filter(([, f]) => g > f + 5);
  return open.length ? open[hash(g * 911 + 17) % open.length][0] : null;
};
export const holeKind = (g) => finalTable(g) ? finalTable(g) === 'hole' : (exFoldKind(g) ? exFoldKind(g) === 'hole' : !cardDebut(g) && !tideKind(g) && (g === holeFirst() || (g > holeFirst() && !ovDebut(g) && !((hash(g * 4241 + 97) >>> 6) % 5))));
export const GRAV_SHOWN = 2; // cartas boca arriba en cada columna
export const HOLE_MAX = 99; // cartas que atrapa el agujero negro, como mucho (10 nov 2026: todas; antes 12)
export const HOLE_TAKE = 1; // parte que se traga y revuelve en cada vuelta (10 nov 2026: todas; antes 0.4)
export const DOOR_STEP = 0.3; // paso entre las cartas de la pila de una puerta
export const NEB_SLOTS = 3;
export const SCROLL_VIEW = 8.2, SCROLL_GAP = 0.45, SCROLL_SHOW = 0.5;
// Cohete (16 nov 2026, el usuario: «pega más los grupos… que no se distinga mucho dónde empieza uno y otro»).
export const ROCKET_GAP = 0.2; // (0.12 juntaba de más las cartas torcidas de tramos vecinos)
export const stripGap = (L) => (L?.rocket ? ROCKET_GAP : SCROLL_GAP);
const SCROLL_SPARE = 0.2; // sobrantes extra por carta del tablero
const SCROLL_PIECES = ['miniPyramid', 'miniInv', 'twoRows', 'twoRows', 'sandwich', 'crown', 'steps', 'stack', 'fan', 'tiltFan', 'arc', 'cross', 'rosette'];
// Estreno de una carta (el primer nivel de su mundo; el cometa y el cohete ya buscan uno sin mesa en extraDebut): sin
// ninguna mesa, para que se vea sola lo que anuncia el camino (11 nov 2026: la nave salía en una plegable y el fantasma
// no salía, porque el agujero negro quita las demás cartas).
const cardDebut = (g) => g % LEVELS_PER_WORLD === 0 && MECHANICS.some((m) => !EXTRA.includes(m) && MECH_INTRO[m] * LEVELS_PER_WORLD === g);
// Niveles que eran de la mesa plegable (desde el 208, ~1 de cada 12 normales; se quitó el 12 nov 2026, igual que el
// mantel doblado que la iba a cambiar). El usuario pidió que salgan más las mesas especiales que ya están abiertas
// (salían poco comparadas con la plegable): desde la marea, cada uno lleva una de las que ya se estrenaron (marea,
// agujero negro, puertas, banda o asteroides), escogida por nivel; antes, enrollada, gravedad o nebulosa.
// 14 nov 2026 (calendario nuevo): los estrenos de las mesas que van sobre un tablero normal y de las cartas de regalo
// caen justo en el primer nivel de su mundo (301, 401…; 221, 271): ahí no sale otra mesa al azar.
const ovDebut = (g) => g === TIDE_FROM || g === HOLE_FROM || g === DOORS_FROM || g === BANDA_FROM || g === ROCKS_FROM || g === ZERO_FROM || g === ORBIT_FROM || g === PONG_FROM;
const reserved = (g) => ovDebut(g) || constBoss(g) || EXTRA.some((m) => MECH_INTRO[m] * LEVELS_PER_WORLD === g);
const exFold = (g) => g >= 208 && g < TOTAL_LEVELS && !cardDebut(g) && !reserved(g) && !((hash(g * 3571 + 211) >>> 7) % 12);
const exFoldKind = (g) => {
  if (!exFold(g) || g < TIDE_FROM) return null;
  const open = [['tide', tideFirst], ['hole', holeFirst], ['doors', doorsFirst], ['banda', bandaFirst], ['rocks', rocksFirst], ['zero', zeroFirst], ['orbit', orbitFirst], ['pong', pongFirst]].filter(([, first]) => g > first());
  return open.length ? open[hash(g * 787 + 43) % open.length][0] : null;
};
export function scrollKind(g) {
  if (g >= TOTAL_LEVELS || cardDebut(g) || reserved(g)) return null;
  const ft = finalTable(g);
  if (ft) return SCROLL_FROM[ft] != null ? ft : null;
  // Cada una se presenta justo en su nivel de inicio; después sale al azar.
  for (const k in SCROLL_FROM) if (g === SCROLL_FROM[k]) return k;
  if (g >= SCROLL_FROM.mesa && !(hash(g * 31 + 7) % 12)) return 'mesa';
  if (g >= SCROLL_FROM.nebulosa && !((hash(g * 7919 + 1013) >>> 9) % 12)) return 'nebulosa';
  if (g >= SCROLL_FROM.gravedad && !((hash(g * 104729 + 577) >>> 11) % 12)) return 'gravedad';
  if (g >= SCROLL_FROM.voltea && !((hash(g * 6151 + 331) >>> 8) % 12)) return 'voltea';
  if (g >= SCROLL_FROM.hangar && !((hash(g * 4127 + 61) >>> 7) % 12)) return 'hangar';
  if (g >= SCROLL_FROM.bitacora && !((hash(g * 8297 + 19) >>> 6) % 12)) return 'bitacora';
  if (g >= SCROLL_FROM.portal && !((hash(g * 2389 + 503) >>> 9) % 12)) return 'portal';
  if (g >= SCROLL_FROM.cohete && !((hash(g * 5011 + 409) >>> 8) % 12)) return 'cohete';
  if (g >= SCROLL_FROM.tubos && !((hash(g * 3253 + 151) >>> 7) % 12)) return 'tubos';
  // Los que eran de la plegable, antes de que se abra la marea, llevan una de estas tres (después, ver exFoldKind).
  return exFold(g) && g < TIDE_FROM ? ['mesa', 'gravedad', 'nebulosa'][hash(g * 613 + 29) % 3] : null;
}
// Lo bonito de la mesa es lo larga: el doble de cartas que un tablero normal.
// La nebulosa, algo menos: solo se ven 3 tramos a la vez.
function scrollSegments(r, d, kind) {
  if (kind === 'gravedad') return gravCols(r, d);
  if (kind === 'tubos') return gravCols(r, d, 4, 8);
  if (kind === 'hangar') return hangarCols(r, d);
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
// Gravedad: columnas de alto parecido (cada carta un poco más arriba que la de abajo; el juego las acomoda).
// Cartas al vuelo (20 nov 2026, el usuario: «mínimo 4 columnas y quizás máximo 7 u 8»): de 4 a 8.
function gravCols(r, d, lo = 3, hi = 5) {
  const n = randInt(r, lo, hi), want = 26 + Math.round(d * 14);
  const out = Array.from({ length: n }, () => []);
  for (let i = 0; i < want; i++) out[i % n].push({ x: 0, y: -out[i % n].length * 0.2, z: out[i % n].length });
  return out;
}
// Hangar (13 nov 2026): más columnas, más cortas; solo se ven HANGAR_SHOW y las demás esperan en el hangar.
export const HANGAR_SHOW = 4;
function hangarCols(r, d) {
  const n = randInt(r, 6, 8), out = [];
  for (let i = 0; i < n; i++) out.push(Array.from({ length: randInt(r, 3, 4 + Math.round(d * 2)) }, (_, k) => ({ x: 0, y: -k * 0.2, z: k })));
  return out;
}
// Bitácora (13 nov 2026): hojas encimadas, cada una de piezas chicas sin giros, en un solo grupo (ocupa lo de un tablero
// chico y cabe acostado). De 2 a 7 hojas (el usuario: «de dos a 7»; casi siempre 2 o 3): con 2-3 cada hoja trae dos
// piezas; con más, una (así no pasa de ~48 cartas). raw.sheet dice de qué hoja es cada carta (0 = la de encima).
const BITA_PIECES = ['miniPyramid', 'miniInv', 'twoRows', 'sandwich', 'crown', 'steps', 'stack', 'cross'];
export const BITA_MAX = 7;
function bitaSheets(r) {
  const n = Math.min(BITA_MAX, 2 + Math.floor(r() * r() * 6));
  const piece = () => normalizeGroup(SMALL[pick(r, BITA_PIECES)](mulberry32(randInt(r, 0, 1e9))));
  const sheet = () => {
    if (n > 3) return piece();
    const a = piece(), b = piece();
    return normalizeGroup([...a.cards, ...b.cards.map((c) => ({ ...c, x: c.x + a.w + 0.35, y: c.y + (a.h - b.h) / 2 }))]);
  };
  const s = Array.from({ length: n }, sheet);
  // Con 4 o más hojas (una pieza cada una) cada hoja lleva además una carta suelta en una orilla, una vez a la
  // izquierda y otra a la derecha: así siempre queda lugar para la escotilla de la de abajo.
  const side = n > 3 ? 1.4 : 0, W = Math.max(...s.map((g) => g.w)) + side * 2, H = Math.max(...s.map((g) => g.h), 1.4);
  const sh = s.map((g, k) => [...g.cards.map((c) => ({ ...c, x: c.x + (W - g.w) / 2, y: c.y + (H - g.h) / 2 })), ...(side ? [{ x: k % 2 ? W - 1 : 0, y: (H - 1.4) / 2, z: 0, rot: 0 }] : [])]);
  // Escotillas: en cada hoja, 1-2 cartas que no tapa ninguna de su hoja; las de la hoja de encima que les quedan
  // arriba se quitan (esa hoja se queda con 4 o más).
  const near = (a, b, mx = 1, my = 1.4) => Math.abs(a.x - b.x) < mx && Math.abs(a.y - b.y) < my;
  // 13 nov 2026 (el usuario): todas las hojas con escotilla; se prueban las libres hasta abrir 1 (o 2). De abajo hacia
  // arriba: así abrir el hueco de una hoja nunca se lleva la escotilla de la de encima (ya escogida).
  const peek = new Set();
  for (let k = n - 1; k >= 1; k--) {
    const free = shuffle(r, sh[k].filter((c) => !sh[k].some((o) => o !== c && o.z > c.z && near(c, o, 1.05, 1.45))));
    let want = 1 + (r() < 0.5 ? 1 : 0);
    for (const c of free) {
      if (!want) break;
      const rest = sh[k - 1].filter((o) => !near(c, o, 1.3, 1.7));
      if (rest.length >= 3) (sh[k - 1] = rest), peek.add(c), want--;
    }
  }
  const cards = [], ix = [], pk = [];
  // Capas de 10 en 10 por hoja (13 nov 2026: con 50 las cartas quedaban por encima de lo que vuela y pasaban por detrás).
  sh.forEach((g, k) => g.forEach((c) => (peek.has(c) && pk.push(cards.length), cards.push({ ...c, z: c.z + (n - 1 - k) * 10 }), ix.push(k))));
  const out = [cards];
  out.sheet = ix;
  out.peek = pk;
  return out;
}
// Dónde empieza cada tramo en la tira (de izquierda a derecha).
export function scrollStrip(groups, gap = SCROLL_GAP) {
  const at = [];
  const end = groups.reduce((s, g, k) => ((at[k] = s), s + g.w + gap), 0) - gap;
  return { at, end };
}
// Tapas del rollo con una ventana de view: a cada carta la tapan las que empiezan antes de su orilla izquierda
// + SCROLL_SHOW − view (mientras no se vayan, la carta no asoma lo bastante del rollo).
function rollCover(cards, groups, view, gap = SCROLL_GAP) {
  const { at } = scrollStrip(groups, gap), span = cards.map((p) => scrollSpan(p, at));
  return cards.map((p, i) => cards.reduce((acc, q, j) => (span[j][0] < span[i][0] + SCROLL_SHOW - view && acc.push(j), acc), []));
}
// Tapas de cada carta de una mesa enrollada con una ventana más larga (view ≥ SCROLL_VIEW).
export function scrollCover(L, view) {
  const roll = rollCover(L.cards, L.groups, Math.max(SCROLL_VIEW, view), stripGap(L));
  return L.cards.map((c, i) => [...c.under, ...roll[i]]);
}
// Orillas izquierda y derecha de una carta en la tira.
export function scrollSpan(c, at) {
  const xs = corners(c).map((p) => p[0]);
  return [at[c.group] + Math.min(...xs), at[c.group] + Math.max(...xs)];
}

export function isRespite(g) {
  const w = Math.floor(g / LEVELS_PER_WORLD), i = g % LEVELS_PER_WORLD;
  // El estreno de una mesa no es respiro (ya va amable): si no, el camino la anuncia y no sale.
  if (g < LEVELS_PER_WORLD || i === LEVELS_PER_WORLD - 1 || Object.values(SCROLL_FROM).includes(g)) return false;
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

// Lo mínimo que se enciman dos cartas giradas para que una tape a la otra (la carta mide 1 × 1.4 = 1.4).
const COVER_MIN = 0.01;
// Área (en unidades de carta) de lo que se enciman dos cartas: recorte de un cuadrilátero convexo con el otro.
export function overlapArea(a, b) {
  let poly = corners(a);
  const B = corners(b);
  for (let i = 0; i < 4 && poly.length; i++) {
    const [x1, y1] = B[i], [x2, y2] = B[(i + 1) % 4];
    const side = ([x, y]) => (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1);
    const out = [];
    for (let k = 0; k < poly.length; k++) {
      const P = poly[k], Q = poly[(k + 1) % poly.length], sp = side(P), sq = side(Q);
      if (sp >= 0) out.push(P);
      if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); }
    }
    poly = out;
  }
  let A = 0;
  for (let k = 0; k < poly.length; k++) { const [x1, y1] = poly[k], [x2, y2] = poly[(k + 1) % poly.length]; A += x1 * y2 - x2 * y1; }
  return Math.abs(A) / 2;
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
// Ningún nivel pide ayudas (6 nov 2026; el sistema de antes, con niveles que sin comodines o +5 no tenían solución,
// quedó en la rama ayudas-en-duro). Los duros se arman con su escalón (TIERS): siempre se pueden ganar sin ayudas y
// con el camino acertado dan 3★. Camino (hardHelp 1-3): muy difícil, extremo, demasiado extremo. Evento del mes
// (EVENT_HELP 1-3): difícil, muy difícil, extremo. Festividades: muy difícil y el jefe extremo (festivalLevel).
// Sin archivos: el tablero de cada uno lo escoge el juego al armarlo con una revisión rápida (pickLevel).
export function generateLevel(g, ev = null) {
  if (ev) return buildLevel(g, ev);
  if (constBoss(g)) return bossLevel(g);
  const h = hardHelp(g);
  if (h) return pickLevel(`c${g}`, h + 1, (t) => buildLevel(g, null, t, h + 1));
  return softLevel(g);
}

// Revisión rápida (sin archivos, 6 nov 2026): el bot casual juega QUICK partidas con una semilla fija (el mismo
// resultado en todos los teléfonos). Lo que se escogió se recuerda mientras la página esté abierta (picked).
export const QUICK = 30;
const picked = new Map();
// Victorias del bot en QUICK partidas; deja de jugar en cuanto pasa de stop (ya se sabe que es demasiado fácil).
const quickWins = (L, stop = QUICK) => {
  const r = mulberry32(L.g + 1);
  let w = 0;
  for (let i = 0; i < QUICK && w <= stop; i++) w += playCasual(L, r);
  return w;
};
// Niveles duros: prueba versiones t hasta una que se gane con el camino acertado y deje al bot cerca de TIERS[tier].aim
// (si en PICK_TRIES ninguna cae en su rango, la más cercana). Unas decenas de milisegundos.
const PICK_TRIES = 16;
export function pickLevel(key, tier, make) {
  if (picked.has(key)) return make(picked.get(key));
  const aim = (TIERS[tier].aim / 100) * QUICK, near = Math.max(1, aim * 0.35);
  let best = null;
  for (let t = 0; t < PICK_TRIES; t++) {
    const L = make(t);
    if (refLeft(L) < 0) continue;
    const off = Math.abs(quickWins(L, aim + Math.max(near, best ? best.off : QUICK)) - aim);
    if (!best || off < best.off) best = { L, t, off };
    if (off <= near) break;
  }
  picked.set(key, best.t);
  return best.L;
}

// ---------- Jefes de constelación (15 nov 2026, pedido del usuario) ----------
// El último nivel de cada constelación (100, 200…) trae una criatura que juega contra ti (ver bossStep en engine.js).
// Se turnan de la más sencilla a la más compleja y cada vez que pasan todos vuelven más fuertes (r = la vuelta): la
// fuego del Fénix cae en más cartas, el Ilusionista y el Kraken atacan más seguido, el Kraken mancha más cartas y la Ballena
// se traga más. Mesa normal (sin otra mesa) y nunca duro. Se prueba el tablero t hasta que el solucionador lo gana con
// el jefe; la vida (hp) sube con el tablero y la vuelta. level.foe (level.boss ya es el jefe de cada planeta).
// 16 nov 2026 (pedido del usuario): la Medusa de plasma entra en el 300, antes del Kraken (es más sencilla: no bloquea
// cartas, solo pide el color). Vendrán más; el 100 (Fénix) no se mueve.
// El Reloj del vacío entra en el 600 (16 nov 2026): congela cartas y no deja deshacer, más complejo que la Ballena.
// El Viento solar entra en el 400 (17 nov 2026), después de la Medusa: no bloquea cartas, solo se lleva las de tu
// descarte justo cuando tienes jugada (más sencillo que Kraken, Ballena y Reloj, que se recorren a 500, 600 y 700).
// La Mano alien entra en el 500 (19 nov 2026, pedido del usuario: «muévela de lugar, estamos a tiempo»; por
// dificultad va después del Viento: solo toca tu mazo y no bloquea cartas). Kraken, Ballena y Reloj pasan a 600, 700 y 800.
export const BOSS_ORDER = ['fenix', 'ilus', 'medusa', 'wind', 'hand', 'kraken', 'whale', 'clock'];
export const BOSS_NAMES = { fenix: 'Fénix estelar', ilus: 'El Ilusionista', medusa: 'Medusa de plasma', kraken: 'Kraken', whale: 'Ballena glotona', clock: 'Reloj del vacío', wind: 'Viento solar', hand: 'Mano alien' };
export const BOSS_MIN = 0.15;
// Vida del jefe: 60% de las cartas + bossExtra por vuelta. Si con ella ningún tablero llega a BOSS_MIN, se baja por pasos
// (15 nov 2026, el usuario: «si son jefes, buscar un tablero que cumpla mayor a 15%»; la Ballena enterraba el 1600):
// con menos vida se le vence antes y deja de atacar.
// 16 nov 2026 (el usuario: «el 300 no tiene suficientes cartas para matar al enemigo ni haciendo bien todo»): además
// de ganarse, el jefe se tiene que poder vencer: el solucionador lo vence y el bot casual también, al menos BOSS_KILL de
// las veces (aunque luego pierda). Antes en tableros chicos la vida casi llegaba a las cartas (el 1900: 16 de 16).
const BOSS_HP = [null, 0.45, 0.35, 0.25, 0.18];
export const BOSS_KILL = 0.35;
// Vida extra por vuelta: +0, +3, +5, +7 y +9 desde la 5.ª (17 nov 2026, el usuario: «súbele +1 a todos menos el primero»;
// antes +2 por vuelta).
export const bossExtra = (r) => (r ? 2 * Math.min(4, r) + 1 : 0);
export const constBoss = (g) => g < TOTAL_LEVELS && g % (10 * LEVELS_PER_WORLD) === 10 * LEVELS_PER_WORLD - 1;
export const bossOf = (g) => (constBoss(g) ? { kind: BOSS_ORDER[Math.floor(g / (10 * LEVELS_PER_WORLD)) % BOSS_ORDER.length], r: Math.floor(g / (10 * LEVELS_PER_WORLD) / BOSS_ORDER.length) } : null);
// Jefe en segundo plano (15 nov 2026): buscar un tablero que pase del 15% puede tardar segundos; js/boss-worker.js lo
// arma sin trabar la pantalla mientras juegas los niveles de antes y main.js guarda lo que escogió (setBossPick).
export const bossPick = (g) => (bossLevel(g), picked.get(`b${g}`));
export const setBossPick = (g, p) => picked.set(`b${g}`, p);
export const bossPicked = (g) => picked.has(`b${g}`);
function bossLevel(g) {
  const key = `b${g}`, B = bossOf(g);
  // p = [t, k]: la versión del tablero y el paso de vida.
  const make = ([t, k]) => {
    const L = buildLevel(g, null, t);
    L.foe = { kind: B.kind, r: B.r, hp: k ? Math.round(L.cards.length * BOSS_HP[k]) : Math.round(L.cards.length * 0.6) + bossExtra(B.r) };
    return L;
  };
  if (picked.has(key)) return picked.get(key) < 0 ? buildLevel(g) : make(picked.get(key));
  // El primero que se gana con el jefe y que el bot casual gana más de BOSS_MIN (15%) de las veces, probando 8
  // tableros con cada paso de vida; si ninguno, el más fácil de los que se ganan. Se arma al entrar al nivel.
  let best = null;
  const solved = new Set();
  // Partidas del bot: [ganadas, veces que venció al jefe].
  const runs = (x, r, n) => {
    let w = 0, k = 0;
    for (let i = 0; i < n; i++) {
      const o = casualRun(x, r);
      w += o.win;
      k += o.kill;
    }
    return [w, k];
  };
  search: for (let k = 0; k < BOSS_HP.length; k++) {
    for (let t = 0; t < 8; t++) {
      const x = make([t, k]);
      // Que el solucionador gane venciendo al jefe. Con menos vida lo que ya se vencía se sigue venciendo: no se vuelve
      // a resolver.
      if (!solved.has(t) && !solve(x, initState(x), 60000, 0, true)) continue;
      solved.add(t);
      // Prueba rápida (30 partidas) y, si pasa, se confirma con 120 más (con 30 solas, 5 victorias parecían 17% y
      // eran 10%; 16 nov 2026: con 90, la Medusa del 800 parecía 22% y era 10%). Pide un poco más de BOSS_MIN.
      let n = QUICK, [w, kl] = runs(x, mulberry32(x.g + 1), QUICK);
      if (w >= QUICK * BOSS_MIN && kl >= QUICK * BOSS_KILL) {
        const [w2, k2] = runs(x, mulberry32(x.g * 7 + 3), 4 * QUICK);
        (w += w2), (kl += k2), (n = 5 * QUICK);
      }
      // El más cercano a pasar las dos cosas (ganar y vencerlo), por si ninguno pasa.
      const score = Math.min(w / n / (BOSS_MIN + 0.03), kl / n / BOSS_KILL);
      if (!best || score > best.w) best = { L: x, p: [t, k], w: score };
      if (score >= 1) break search;
    }
  }
  // Si ninguno se gana con el jefe (no ha pasado), el primero sin él.
  if (!best) return picked.set(key, -1), buildLevel(g);
  picked.set(key, best.p);
  return best.L;
}

// ---------- Arena de jefes (20 nov 2026, pedido del usuario) ----------
// Volver a jugar contra los jefes que ya venciste, por gusto: sin estrellas, premios ni nada del camino. Cada pelea es
// un tablero nuevo (seed) de la constelación del último jefe que venciste (base), así trae las cartas que ya conoces.
// Dificultad: Tranquilo (menos vida, ataca como en la primera vuelta), Normal (como en el camino) y Furioso (más vida
// y ataca como una vuelta después). Se busca como el jefe del camino (bossLevel): que el solucionador lo gane
// venciéndolo y que el bot casual gane y lo venza lo bastante (menos en Furioso).
// hp: vida por pasos (parte de las cartas; x = + bossExtra de su vuelta), del más alto al más bajo; si ningún tablero
// cumple con uno, se prueba el siguiente. bot: rango de victorias del bot casual; kill: cuántas veces lo vence; tries:
// cuántos tableros prueba con cada paso (el Tranquilo, más: su tablero tiene que salir amable).
export const ARENA_DIFF = [
  { hp: [0.35, 0.25, 0.18], r: () => 0, bot: [0.3, 1], kill: 0.5, tries: 10 },
  { hp: ['x', 0.45, 0.35, 0.25], r: (r0) => r0, bot: [BOSS_MIN, 0.6], kill: BOSS_KILL, tries: 5 },
  { hp: ['x+', 'x', 0.45], r: (r0) => r0 + 1, bot: [0.06, 0.35], kill: 0.2, tries: 4 },
];
// El jefe de constelación más alto ya ganado (99, 199…), según el primer nivel sin completar.
export const arenaBase = (next) => Math.min(TOTAL_LEVELS - 1, Math.max(99, Math.floor(next / 100) * 100 - 1));
export function arenaMake({ kind, base, diff }, [t, k]) {
  const D = ARENA_DIFF[diff], r = D.r(bossOf(base).r), L = buildLevel(base, null, t), n = L.cards.length, h = D.hp[k];
  L.foe = { kind, r, hp: Math.round(h === 'x+' ? n * 0.75 + bossExtra(r) : h === 'x' ? n * 0.6 + bossExtra(r) : n * h) };
  L.arena = 1;
  return L;
}
// Devuelve [t, k] (el tablero y el paso de vida). Va en un worker (boss-worker.js) y a lo mucho ARENA_MS: si no
// encontró uno que cumpla, el más cercano.
const ARENA_MS = 3500;
export function arenaPick(spec) {
  const D = ARENA_DIFF[spec.diff], seed = spec.seed | 0, end = Date.now() + ARENA_MS;
  let best = null;
  const solved = new Set();
  for (let k = 0; k < D.hp.length; k++) {
    for (let i = 0; i < D.tries; i++) {
      if (Date.now() > end) return best ? best.p : [seed, D.hp.length - 1];
      const t = seed + i, x = arenaMake(spec, [t, k]);
      if (!solved.has(t) && !solve(x, initState(x), 25000, 0, true)) continue;
      solved.add(t);
      const r = mulberry32(seed * 31 + i * 7 + k);
      let w = 0, kl = 0;
      for (let j = 0; j < QUICK; j++) {
        const o = casualRun(x, r);
        w += o.win;
        kl += o.kill;
      }
      const p = w / QUICK, score = Math.min(p / D.bot[0], kl / QUICK / D.kill, p > D.bot[1] ? D.bot[1] / p : 1);
      if (!best || score > best.w) best = { p: [t, k], w: score };
      if (score >= 1) return best.p;
    }
  }
  return best ? best.p : [seed, D.hp.length - 1];
}

// Niveles normales: a veces, por suerte de los números, uno sale brutal (bot < 15%, como un extremo pero sin estar
// marcado). Si en la revisión rápida el bot gana menos del 15%, se arma la siguiente versión t. Del 11 al SOFT_UNTIL.
export const SOFT_UNTIL = 2500;
function softLevel(g) {
  if (g < 10 || g >= SOFT_UNTIL || isSecret(g)) return buildLevel(g);
  const key = `s${g}`;
  if (picked.has(key)) return buildLevel(g, null, picked.get(key));
  let best = null;
  // Estreno de gravedad cero, planetas o ping-pong (17 nov 2026): la versión tiene que traer su mesa (si no se podía
  // ganar con ella, el nivel se quedaba sin la mesa que anuncia el camino).
  const ov = g === zeroFirst() ? 'zero' : g === orbitFirst() ? 'orbit' : g === pongFirst() ? 'pong' : null;
  for (let t = 0; t < (ov ? 40 : 12); t++) {
    const L = buildLevel(g, null, t);
    if (ov && !L[ov]) continue;
    const w = quickWins(L);
    if (!best || w > best.w) best = { L, t, w };
    if (w >= QUICK * 0.15) break;
  }
  best ||= { L: buildLevel(g), t: 0 };
  picked.set(key, best.t);
  return best.L;
}

// Escalones de los niveles duros (tier 1-4; el camino usa hardHelp + 1). min: cartas mínimas del tablero; decoys: señuelos de más;
// chain: cadenas más cortas (más robos y menos premios de racha); mechs: mecánicas (cuántas como mucho y al menos);
// spares: sobrantes al final del mazo (pocas: un error y ya no alcanza); miss: cartas que puedes desperdiciar
// respecto al camino acertado y aún sacar 3★ (sus estrellas van aparte, ver level.stars y starsFor); aim: % de
// victorias del bot casual que se busca (pickLevel prueba tableros t y se queda con el más cercano).
export const TIERS = [
  null,
  { name: 'Difícil', min: 20, decoys: 0, chain: 1, mechs: [2, 1], spares: 2, miss: 1, aim: 28 },
  { name: 'Muy difícil', min: 24, decoys: 0, chain: 1, mechs: [2, 1], spares: 1, miss: 1, aim: 18 },
  { name: 'Extremo', min: 28, decoys: 0, chain: 2, mechs: [2, 2], spares: 1, miss: 1, aim: 10 },
  { name: 'Demasiado extremo', min: 32, decoys: 0, chain: 3, mechs: [3, 2], spares: 0, miss: 0, aim: 3 },
];
// Cartas que le quedan al mazo jugando la solución de referencia (el camino acertado: roba solo cuando su carta aún
// no se puede jugar). -1 si no termina.
// Igual que la referencia de npm test (tests/verify-levels.mjs).
// Los números que juega la solución de referencia, en orden (lo que queda en el descarte tras cada jugada).
export function refRanks(L) {
  let s = initState(L);
  const out = [], al = {};
  for (const id0 of L.solution) {
    const id = al[id0] ?? id0;
    if (s.rem[id]) continue;
    const c = L.cards[id], w = refStep(c, s);
    while (!refReady(L, c, s, w)) {
      if (!s.stock.length) return out;
      s = drawCard(L, s).s;
    }
    const r = playCard(L, s, id, w.low ?? false);
    s = r.s;
    if (r.ev.tug != null) al[r.ev.tug] = id;
    if (!s.top.wild && s.top.rank != null) out.push(s.top.rank);
  }
  return out;
}

export function refLeft(L) {
  let s = initState(L);
  // Cartas con cable: la pareja se juega desde el lugar de la otra (al[pareja] = lugar donde quedó).
  const al = {};
  for (const id0 of L.solution) {
    const id = al[id0] ?? id0;
    if (s.rem[id]) continue;
    // Boleto partido entero: la solución juega primero la mitad de arriba; el triple, arriba, abajo y en medio.
    const c = L.cards[id], w = refStep(c, s);
    while (!refReady(L, c, s, w)) {
      if (!s.stock.length) return -1;
      s = drawCard(L, s).s;
    }
    const r = playCard(L, s, id, w.low ?? false);
    s = r.s;
    if (r.ev.tug != null) al[r.ev.tug] = id;
  }
  return won(s, L) ? s.stock.length : -1;
}
export const refStars = (L) => { const k = refLeft(L); return k < 0 ? 0 : starsFor(L, k); };

// t: otro tablero para el mismo nivel (pickLevel escoge el de los duros; softLevel, el de los normales).
export function buildLevel(g, ev = null, t = 0, tier = ev?.tier || 0) {
  const T = TIERS[tier];
  const secret = !ev && isSecret(g);
  const base = ev ? ev.world * LEVELS_PER_WORLD + ev.index : secret ? (g - TOTAL_LEVELS) * LEVELS_PER_WORLD + LEVELS_PER_WORLD - 1 : g;
  const world = Math.floor(base / LEVELS_PER_WORLD);
  const index = base % LEVELS_PER_WORLD;
  const r = mulberry32(hash(ev ? ev.seed : t ? g + t * 104729 : g));
  // Todos los niveles usan las formas, piezas, mesas y cartas nuevas (cierre de la Fase 7). Solo los del camino que no
  // son duros (fresh) tienen respiros; los duros no llevan mesa enrollada (en una pantalla ancha se ve más tira). El evento y las festividades traen su mesa en ev.scroll (ver eventBase, festivalBase).
  const fresh = !ev && !hardHelp(g);
  // Respiro: en cada mundo 1 nivel (a veces 2) sale fácil, para que no todos sean cuesta arriba (ver isRespite).
  const respite = fresh && !secret && isRespite(base);
  // Nivel final de cada planeta (15 nov 2026, pedido del usuario): junta más cartas de las que ya conoces (cada una
  // FINAL_MIX veces más probable) y de preferencia una mesa especial (finalTable). No el del jefe de constelación.
  const fin = fresh && !secret && !respite && isFinal(base) ? FINAL_MIX : 1;
  const kind0 = !ev && !secret && !respite ? scrollKind(base) : null;
  const want = ev ? ev.scroll || null : fresh || (kind0 !== 'mesa' && kind0 !== 'cohete') ? kind0 : null;
  // Mesas de columnas (son la gravedad, scroll 'gravedad'): la que se voltea (media vuelta cada FLIP_EVERY acciones,
  // level.flip, c.flipBy; los duros no la llevan: su tablero y sus estrellas salen del camino acertado, que no sabe de
  // la vuelta), los portales (la gravedad al revés: solo se ve distinta) y el hangar (solo se ven HANGAR_SHOW columnas;
  // al vaciar una sale otra, con la regla de la nebulosa). La bitácora es un tablero normal de hojas encimadas.
  // Cartas al vuelo (antes tubos; 20 nov 2026 sin tubos): la gravedad con solo la carta de abajo de cada columna a la
  // vista (de 4 a 8 columnas); al vaciar un hueco, la que sigue llega volando de arriba, abajo o un lado.
  const flipOn = want === 'voltea' && !T, portalOn = want === 'portal', hangarOn = want === 'hangar', bitaOn = want === 'bitacora', tubesOn = want === 'tubos';
  // Cohete (16 nov 2026, el usuario: «exactamente las mismas mecánicas del tapete, solo otra animación»): es la mesa
  // enrollada (scroll 'mesa') con level.rocket; el juego la dibuja como cohete y regala monedas por tramo.
  const rocketOn = want === 'cohete';
  const scroll = ['voltea', 'portal', 'hangar', 'tubos'].includes(want) ? 'gravedad' : bitaOn ? null : rocketOn ? 'mesa' : want;
  const d0 = ev ? ev.d : secret ? Math.min(1, difficulty(base) + 0.05) : difficulty(base);
  // Mesa enrollada: la tira es larga y solo se ve un pedazo; el mazo va más amable (y con más sobrantes, abajo).
  // La nebulosa, algo menos (medido con el bot casual).
  // El nivel donde se estrena cada mesa va amable aunque sea jefe.
  const debut = !!want && base === SCROLL_FROM[want];
  let d = respite ? Math.min(d0, 0.06 + d0 * 0.15) : debut ? d0 * (scroll === 'gravedad' ? 0.35 : 0.3) : scroll === 'mesa' ? d0 * 0.3 : scroll === 'gravedad' ? d0 * (base < 200 ? 0.35 : 0.55) : scroll ? d0 * 0.65 : d0;
  // Mesas sobre un tablero normal (marea, agujero negro y puertas): nunca dos en el mismo nivel.
  const overlay = fresh && !secret && !respite && !scroll && !constBoss(base);
  const holeOn = overlay && holeKind(base);
  const doorsOn = overlay && doorsKind(base);
  const banda = overlay && !doorsOn && bandaKind(base);
  const rocksOn = overlay && !holeOn && !doorsOn && !banda && rocksKind(base);
  const zeroOn = overlay && !holeOn && !doorsOn && !banda && !rocksOn && zeroKind(base);
  const orbitOn = overlay && !holeOn && !doorsOn && !banda && !rocksOn && !zeroOn && orbitKind(base);
  const pongOn = overlay && !holeOn && !doorsOn && !banda && !rocksOn && !zeroOn && !orbitOn && pongKind(base);
  // Las tres de cartas que se mueven (17 nov 2026): un poco más amables, y su estreno más.
  if (zeroOn) d *= base === zeroFirst() ? 0.4 : 0.85;
  if (orbitOn) d *= base === orbitFirst() ? 0.4 : 0.85;
  if (pongOn) d *= base === pongFirst() ? 0.4 : 0.85;
  // Agujero negro y banda ya cuestan por sí mismas: el tablero va un poco más amable (como las otras mesas). Las
  // puertas, apenas (sus pilas no cuentan si no las abres). La banda pesa más (al bot le costaba 31% contra 47%): la mitad.
  if (holeOn) d *= base === holeFirst() ? 0.25 : 0.6; // su estreno, más amable
  if (doorsOn) d *= 0.9;
  if (banda) d *= 0.5;
  if (rocksOn) d *= base === rocksFirst() ? 0.4 : 0.9;
  // Bitácora: lo de abajo no se ve hasta arrancar la hoja; un poco más amable. (Con el bot, en los niveles altos queda
  // en ~20% y la mesa que se voltea en ~15%: el usuario los quiere así, 13 nov 2026.)
  if (bitaOn && !debut) d *= 0.8;
  // Evento: en cada planeta salen más seguido las formas que más cuestan (medido con el bot casual).
  const template = (ev?.scroll && (bitaOn ? 'bitacora' : scroll)) || ev?.template || (ev && (index === LEVELS_PER_WORLD - 1 || r() < 0.15 + ev.tight * 0.17) ? pick(r, ['peaks', 'peaks', 'scatter', 'invPyramid']) : (bitaOn ? 'bitacora' : rocketOn ? 'cohete' : scroll) || (respite ? pick(r, RESPITE_SHAPES) : chooseTemplate(r, ev ? Math.max(3, base) : base, d, true)));

  const shape = (dd) => (template === 'clusters' ? clusters(r, dd, index === LEVELS_PER_WORLD - 1, true) : [TEMPLATES[template](r, dd)]);
  let raw = bitaOn ? bitaSheets(r) : scroll ? scrollSegments(r, d, hangarOn ? 'hangar' : tubesOn ? 'tubos' : scroll) : shape(d);
  // Sin ayudas: si salió muy chico, se vuelve a armar un poco más grande.
  // Niveles duros: tableros más grandes (T.min).
  const minN = respite ? RESPITE_MIN : Math.max(freshMin(base), T?.min || 0);
  for (let k = 1; (!ev || T) && !scroll && !bitaOn && k <= 12 && raw.reduce((s, gr) => s + gr.length, 0) < minN; k++) raw = shape(Math.min(1, d + k * 0.15));
  // Banda: un grupo más, una fila de 6-9 cartas sueltas (no se tapan). Su lugar en la vuelta se decide abajo.
  const rbe = mulberry32(hash(g * 3929 + t * 71 + 37));
  if (banda) raw.push(Array.from({ length: randInt(rbe, 6, 9) }, (_, j) => ({ x: j * 1.08, y: 0, z: 0 })));
  const groups = raw.map(normalizeGroup);
  const pos = groups.flatMap((gr, gi) => gr.cards.map((c) => ({ ...c, group: gi })));
  const n = pos.length;

  // Solo se tapan cartas del mismo grupo. 11 nov 2026 (el usuario: la A tapaba la carta regalo «y no se nota»): con
  // cartas giradas, un roce de esquinas (redondeadas, no se ve) no tapa; hace falta encimarse COVER_MIN.
  const covers = (p, q) => overlaps(p, q) && (!(p.rot || q.rot) || overlapArea(p, q) >= COVER_MIN);
  const coveredBy = pos.map((p) =>
    pos.reduce((acc, q, j) => (q.group === p.group && q.z > p.z && covers(p, q) ? (acc.push(j), acc) : acc), []),
  );
  // Mesa enrollada: una carta sale completa del rollo cuando la tira ya empieza en su orilla derecha − SCROLL_VIEW
  // o más adelante; o sea, cuando ya se fueron todas las cartas que empiezan antes de eso.
  const tableScroll = scroll === 'mesa', nebula = scroll === 'nebulosa', grav = scroll === 'gravedad';
  const under = tableScroll && coveredBy.map((a) => a.slice());
  if (tableScroll) rollCover(pos, groups, SCROLL_VIEW, rocketOn ? ROCKET_GAP : SCROLL_GAP).forEach((a, i) => coveredBy[i].push(...a));
  // Nebulosa: tramos que hay que vaciar antes de que salga cada carta.
  const neb = nebula ? pos.map((p) => Math.max(0, p.group - NEB_SLOTS + 1)) : hangarOn ? pos.map((p) => Math.max(0, p.group - HANGAR_SHOW + 1)) : null;
  const segments = (nebula || grav) && groups.map((_, gi) => pos.reduce((a, p, i) => (p.group === gi && a.push(i), a), []));
  // Gravedad: a cada carta solo la tapa la de abajo de su columna (la primera de cada columna es la de abajo).
  if (grav) for (const t of segments) t.forEach((id, k) => (coveredBy[id] = k ? [t[k - 1]] : []));
  // Volteada, a cada carta la tapa la de encima.
  const flipBy = flipOn && pos.map(() => []);
  if (flipOn) for (const t of segments) t.forEach((id, k) => (flipBy[id] = k < t.length - 1 ? [t[k + 1]] : []));
  // Bitácora: la hoja de encima tapa toda la de abajo, menos 1-2 cartas libres de abajo que no quedan bajo ninguna
  // carta de encima: esas se asoman por una escotilla y se juegan cuando quieras. La hoja se arranca al vaciarse.
  // Con más hojas: a una carta la tapan todas las hojas de encima; a la de una escotilla, todas menos la de justo encima
  // (se ve por su hueco en cuanto esa es la de encima).
  let sheets = null, peek = [];
  if (bitaOn) {
    const sh = raw.sheet, n = Math.max(...sh) + 1;
    sheets = Array.from({ length: n }, () => []);
    sh.forEach((k, i) => sheets[k].push(i));
    const rp = mulberry32(hash(g * 4651 + t * 59 + 17));
    // Las escotillas que abrió bitaSheets (si alguna quedó tapada por su propia hoja, no cuenta).
    peek = raw.peek.filter((i) => !coveredBy[i].some((j) => sh[j] === sh[i]));
    for (let k = 1; k < n; k++) for (const i of sheets[k]) {
      const above = sheets.slice(0, peek.includes(i) ? k - 1 : k).flat();
      coveredBy[i] = [...new Set([...coveredBy[i], ...above])];
    }
  }

  const removed = new Array(n).fill(false);
  const order = [];
  while (order.length < n) {
    const free = [];
    const out = neb ? segments.reduce((k, t) => k + t.every((j) => removed[j]), 0) : 0;
    for (let i = 0; i < n; i++) if (!removed[i] && coveredBy[i].every((j) => removed[j]) && (!neb || neb[i] <= out)) free.push(i);
    const i = pick(r, free);
    removed[i] = true;
    order.push(i);
  }

  const boss = index === LEVELS_PER_WORLD - 1;
  // Mecánicas del nivel: cada una aparece a partir de su mundo y luego se combinan (máximo 2 tipos).
  // Respiro: una sola mecánica como mucho.
  // Agujero negro (10 nov 2026, el usuario: «¿no puede jalar todas?»): sin otras cartas especiales, para que se las trague todas.
  const mech = new Set(chooseMechanics(r, world, index, boss, n, ev, T).slice(0, holeOn ? 0 : respite ? 1 : T ? T.mechs[0] : 2));
  // Mesa enrollada y nebulosa sin bombas: su cuenta correría con la carta todavía escondida.
  if (scroll) mech.delete('bomb');
  // Bitácora: nada con cuenta ni carta regalo escondida bajo la hoja.
  if (bitaOn) for (const m of ['bomb', 'pack']) mech.delete(m);
  const tideOn = fresh && !secret && !respite && !scroll && tideKind(base);

  // Cometa: es un regalo, así que va aparte de las demás (no cuenta en el límite de 2 y sale con cualquiera).
  // Por ahora solo sin ayudas y sin mesas especiales. Se estrena en el primer nivel de su mundo y después sale de
  // vez en cuando (es un regalo: no muy seguido). Usa su propio sorteo: un nivel que no lo trae queda igual que antes.
  const rc = mulberry32(hash(g * 7907 + t * 31 + 11));
  // En el camino sin ayudas no es al azar: va donde lo pone extraPlan (1-4 por tramo de 30-35 niveles).
  const plan = fresh && !secret;
  const extraHere = (m, roll) => base === extraDebut(m) || (plan ? (roll(), extraPlanned(m, base)) : roll() < EXTRA_ODDS * fin);
  if (!scroll && !bitaOn && n >= 8 && world >= MECH_INTRO.comet && extraHere('comet', rc)) mech.add('comet');
  // Cohete turbo: el otro regalo, igual que el cometa pero con su propio sorteo.
  const rt = mulberry32(hash(g * 6007 + t * 37 + 5));
  // También en las mesas especiales (7 nov 2026, pedido del usuario: se juega como cualquier carta, no tiene cuenta).
  const turbo = n >= 8 && world >= MECH_INTRO.turbo && extraHere('turbo', rt);
  // Boleto partido: mecánica normal (cuenta en el límite de 2), pero con su propio sorteo como el cometa, para que los
  // niveles que no lo traen queden igual. En su mundo va en todos (sola en los primeros niveles); después, de vez en cuando.
  // También en las mesas especiales (7 nov 2026): se juega como cualquier carta.
  const rb = mulberry32(hash(g * 5303 + t * 41 + 3));
  if (n >= 10 && world >= MECH_INTRO.ticket && (world === MECH_INTRO.ticket || rb() < TICKET_ODDS * fin)) {
    const keep = respite || (world === MECH_INTRO.ticket && index < 5) ? 0 : 1;
    const comet = mech.has('comet');
    [...mech].slice(keep).forEach((m) => mech.delete(m));
    mech.add('ticket');
    // El cometa no cuenta en el límite: en el camino sin ayudas se queda (los demás niveles, como estaban).
    if (plan && comet) mech.add('comet');
  }
  // Fantasma: su propio sorteo, como el boleto. En su mundo va en todos (solo en los primeros 5); cuenta en el límite de 2.
  const rgh = mulberry32(hash(g * 7411 + t * 43 + 9));
  if (n >= 10 && world >= MECH_INTRO.ghost && (world === MECH_INTRO.ghost || rgh() < GHOST_ODDS * fin)) {
    const keep = respite || (world === MECH_INTRO.ghost && index < 5) ? 0 : 1;
    const comet = mech.has('comet');
    [...mech].filter((m) => m !== 'comet').slice(keep).forEach((m) => mech.delete(m));
    mech.add('ghost');
    if (!comet) mech.delete('comet');
  }
  // Nave ladrona: sorteo propio; en su mundo, en todos (sola en los 5 primeros). Cuenta en el límite de 2.
  const rsh = mulberry32(hash(g * 8641 + t * 47 + 13));
  if (n >= 10 && world >= MECH_INTRO.ship && (world === MECH_INTRO.ship || rsh() < SHIP_ODDS * fin)) {
    const keep = respite || (world === MECH_INTRO.ship && index < 5) ? 0 : 1;
    [...mech].filter((m) => m !== 'comet').slice(keep).forEach((m) => mech.delete(m));
    mech.add('ship');
  }
  // Enredadera y fuego (13 nov 2026): sorteo propio, como el fantasma; en su mundo, en todos (sola en los 5 primeros).
  // Cuenta en el límite de 2. Fuera de las mesas que se recorren y del agujero negro (ese no lleva otras cartas).
  const rvi = mulberry32(hash(g * 9173 + t * 79 + 53));
  if (n >= 12 && !scroll && !holeOn && world >= MECH_INTRO.vine && (world === MECH_INTRO.vine || rvi() < VINE_ODDS * fin)) {
    const keep = respite || (world === MECH_INTRO.vine && index < 5) ? 0 : 1;
    const comet = mech.has('comet');
    [...mech].filter((m) => m !== 'comet').slice(keep).forEach((m) => mech.delete(m));
    mech.add('vine');
    if (!comet) mech.delete('comet');
  }

  // Dominó y boleto triple (13 nov 2026, pedido del usuario): sorteo propio, como el boleto partido; en su mundo, en
  // todos (solos en los 5 primeros). Cuentan en el límite de 2. No en la mesa que se voltea ni con agujero negro.
  for (const [m, odds, seed] of [['domino', DOM_ODDS, 6763], ['triple', TRI_ODDS, 8237]]) {
    const rr = mulberry32(hash(g * seed + t * 83 + 71));
    if (n >= (m === 'triple' ? 12 : 10) && !flipOn && !holeOn && world >= MECH_INTRO[m] && (world === MECH_INTRO[m] || rr() < odds * fin)) {
      const keep = respite || (world === MECH_INTRO[m] && index < 5) ? 0 : 1;
      const comet = mech.has('comet');
      [...mech].filter((x) => x !== 'comet').slice(keep).forEach((x) => mech.delete(x));
      mech.add(m);
      if (!comet) mech.delete('comet');
    }
  }

  // Candado de palo, pintura, telescopio y gemelas: solas en los 5 primeros niveles de su mundo (se ponen al final de buildLevel).
  if ((world === MECH_INTRO.slock || world === MECH_INTRO.paint || world === MECH_INTRO.scope || world === MECH_INTRO.twin || world === MECH_INTRO.tug || world === MECH_INTRO.lasso || world === MECH_INTRO.wand || world === MECH_INTRO.mirror || world === MECH_INTRO.echo || world === MECH_INTRO.bubble || world === MECH_INTRO.clone) && index < 5) [...mech].filter((x) => x !== 'comet').forEach((x) => mech.delete(x));

  // Carta regalo: una carta especial (sin número) que se activa sola al quedar destapada del todo
  // y manda 2-5 cartas al final del mazo. Va tapada y en el primer 40% del orden de retirada.
  // Banda: sin candados, boletos ni carta regalo (se ponen antes que la banda y la dejarían sin vuelta).
  if (banda) for (const m of ['lock', 'ticket', 'pack', 'domino', 'triple']) mech.delete(m);
  let packId = null;
  if (mech.has('pack')) {
    // (En la nebulosa, solo en los tramos que se ven al empezar: su momento de salir no depende de sus tapas.)
    const early = order.slice(0, Math.floor(n * 0.4)).filter((i) => coveredBy[i].length && !neb?.[i]);
    if (early.length) packId = pick(r, early);
  }
  // Bombas (1-3): cartas especiales sin número, tapadas, que hay que destapar antes de que su cuenta llegue a 0.
  const bombIds = [];
  // Ninguna bomba (ni cometa) tapa ni está tapada por otra especial. El motor ya activa en cadena (la de abajo
  // sale en la misma acción), pero se deja así: los mazos probados de todos los niveles dependen de este orden.
  const touch = (i, j) => coveredBy[i].includes(j) || coveredBy[j].includes(i);
  if (mech.has('bomb')) {
    const mid = order.slice(Math.floor(n * 0.15), Math.floor(n * 0.75)).filter((i) => coveredBy[i].length && i !== packId);
    shuffle(r, mid);
    const want = randInt(r, 1, n >= 20 ? 3 : 2);
    for (const i of mid) bombIds.length < want && ![packId, ...bombIds].some((j) => j != null && touch(i, j)) && bombIds.push(i);
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
  const maxC = Math.max(minC + 1, Math.round(9 - d * 5.5) - (boss ? 2 : 0) - (ev ? ev.tight : 0) - (T ? T.chain : 0));
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
  // Dominó: se entra por su número de la cadena y en el descarte queda el otro (dom), que salta de 3 a 10; el resto de
  // esa cadena se corre lo mismo, así la referencia sigue desde ahí. Uno por cadena (y que no sea la última carta).
  const doms = [];
  if (mech.has('domino')) {
    const rd = mulberry32(hash(g * 2953 + t * 97 + 19));
    const opts = shuffle(rd, [...Array(np).keys()].filter((k) => chainEnd[k] > k));
    const want = randInt(rd, 1, np >= 20 ? 2 : 1), used = new Set();
    for (const k of opts) {
      if (doms.length >= want || used.has(chainEnd[k])) continue;
      const delta = randInt(rd, 3, 10);
      for (let q = k + 1; q <= chainEnd[k]; q++) ranks[play[q]] = mod13(ranks[play[q]] + delta);
      doms.push([play[k], mod13(ranks[play[k]] + delta)]);
      used.add(chainEnd[k]);
    }
  }
  const known = ranks.filter((x) => x != null);

  const card = (rank) => ({ rank, suit: randInt(r, 0, 3) });
  const waste0 = card(starts[0]);
  const stock = starts.slice(1).map(card);
  const decoys = d < 0.15 ? 0 : randInt(r, 0, Math.round(d * 3)) + (boss ? 1 : 0) + (T ? T.decoys : 0);
  for (let i = 0; i < decoys; i++) stock.splice(randInt(r, 0, stock.length), 0, card(randInt(r, 0, 12)));
  // Desde d ≥ 0.15 el margen base baja a 1: las 3★ (y a veces ganar) dependen de los premios de racha o de gastar.
  let spares = (d < 0.15 ? 2 : 1) + Math.round((1 - d) ** 1.5 * (3 + n * 0.25));
  // Jefes: menos margen, para que el comodín o el +5 se sientan valiosos (siguen siendo ganables).
  if (boss && d > 0.15) spares = Math.max(1, spares - 3);
  // Evento: cada planeta deja menos cartas de sobra en el mazo (ev.tight = 0 en el primero … 4 en el último).
  // Desde el tercero puede no sobrar ninguna: sigue siendo ganable, pero sin errores (o con ayudas).
  if (ev) spares = Math.max(ev.tight >= 2 ? 0 : 1, spares - ev.tight);
  // Mesa enrollada: la tira es el doble de larga; más sobrantes para que no cueste el doble (nebulosa: la mitad).
  if (scroll) spares += Math.round(n * (tableScroll ? SCROLL_SPARE : SCROLL_SPARE / 2));
  // En niveles fáciles las sobrantes suelen ser vecinas de alguna carta del tablero.
  const helpfulCard = (p) => card(r() < p ? (pick(r, known) + pick(r, [1, 12])) % 13 : randInt(r, 0, 12));
  // Niveles duros: pocas sobrantes (las estrellas se miden contra el camino acertado, ver abajo).
  if (T) spares = T.spares;
  for (let i = 0; i < spares; i++) stock.push(helpfulCard((1 - d) * 0.85));

  const cards = pos.map((p, i) => ({ id: i, ...p, rank: ranks[i], suit: randInt(r, 0, 3), coveredBy: coveredBy[i], ...(under && { under: under[i] }), ...(neb?.[i] && { neb: neb[i] }) }));
  for (const id of [...bombIds, ...cometIds]) delete cards[id].rank;
  for (const [id, x] of doms) cards[id].dom = x;
  if (flipOn) for (const c of cards) c.flipBy = flipBy[c.id];
  const SPECIAL = ['lock', 'key', 'pack', 'ice', 'alt', 'arrow', 'curtain', 'curtainKey', 'bomb', 'live', 'comet', 'turbo', 'half', 'dom', 'tri', 'sl', 'paint', 'ghost', 'coin', 'cham', 'ring', 'doorKey', 'belt', 'bolt', 'shield', 'vine', 'fire', 'sleep', 'rainbow', 'magnet', 'twin', 'scope', 'lasso', 'wand', 'echo', 'mirror', 'clone', 'bubble'];
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
  // Boleto triple (13 nov 2026): la referencia arranca el de arriba en su cadena, el de abajo al final de esa cadena
  // (±1 de la última) y el de en medio al final de la cadena siguiente. Las cartas que tapa van después de todo eso.
  const ttails = {};
  if (mech.has('triple')) {
    const rtp = mulberry32(hash(g * 3361 + t * 101 + 23));
    const specials = [packId, ...bombIds, ...cometIds].filter((j) => j != null);
    const opts = [];
    for (let k = 0; k < np; k++) {
      const id = play[k], m = chainEnd[k];
      if (m + 1 >= np || !plain(id) || specials.some((j) => coveredBy[j].includes(id))) continue;
      const m2 = chainEnd[m + 1];
      if (tails[m] != null || tails[m2] != null || play.some((j, q) => q > k && q <= m2 && coveredBy[j].includes(id))) continue;
      opts.push(k);
    }
    shuffle(rtp, opts);
    const want = randInt(rtp, 1, np >= 24 ? 2 : 1);
    let got = 0;
    for (const k of opts) {
      const m = chainEnd[k], m2 = chainEnd[m + 1];
      if (got >= want || ttails[m] || ttails[m2]) continue;
      const id = play[k];
      let b = mod13(ranks[play[m]] + (rtp() < 0.5 ? 1 : -1));
      if (b === ranks[id]) b = mod13(2 * ranks[play[m]] - b);
      const mid = mod13(ranks[play[m2]] + (rtp() < 0.5 ? 1 : -1));
      cards[id].tri = [mid, b];
      ttails[m] = { id, rank: b, tail: 'tb' };
      ttails[m2] = { id, rank: mid, tail: 'tm' };
      got++;
    }
  }
  // Solución de referencia con las dos mitades de cada boleto (y los talones del triple).
  const steps = play.flatMap((id, k) => [{ id, rank: ranks[id], k }, ...(tails[k] != null ? [{ id: tails[k], rank: cards[tails[k]].half, tail: true }] : []), ...(ttails[k] ? [ttails[k]] : [])]);

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
      top = cards[id].dom != null ? { rank: cards[id].dom } : cards[id];
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
  const seq = []; // pasos de la referencia en orden: { id, k, tail, dn = robos antes }
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
      seq.push({ id, k, tail, dn });
      if (tail === true || tail === 'tm' || (!tail && cards[id].half == null && !cards[id].tri)) rem[id] = true;
      top = { rank: !tail && cards[id].dom != null ? cards[id].dom : rank };
      a++;
      if (!packed && coveredBy[packId].every((j) => rem[j])) {
        stk.push(...cards[packId].pack);
        packed = true;
      }
      for (const id of [...bombIds, ...cometIds]) if (bombFree[id] == null && coveredBy[id].every((j) => rem[j])) bombFree[id] = a;
    }
  }
  // Banda: cada carta de la banda ocupa un lugar de una vuelta de K; se ve cuando su lugar pasa por la ventana
  // (BELT_W lugares). Como la carta viva, cada una se pone para que la referencia la vea justo cuando la juega. Si no
  // caben (o alguna ya trae otra mecánica), se queda como una fila normal.
  let belt = null;
  if (banda) {
    const bg = groups.length - 1, ids = cards.filter((c) => c.group === bg).map((c) => c.id);
    const kOf = new Map(play.map((id, k) => [id, k]));
    if (ids.every((id) => plain(id) && kOf.has(id))) {
      const byAct = ids.slice().sort((a, b) => act[kOf.get(a)] - act[kOf.get(b)]);
      for (let K = ids.length + 4, tries = 0; K <= ids.length + 16 && !belt; tries++ % 4 === 3 && (K += 3)) {
        const taken = new Array(K).fill(false), slot = {};
        const ok = byAct.every((id) => {
          const a = act[kOf.get(id)], opts = [];
          for (let p = 0; p < BELT_W; p++) if (!taken[(a + p) % K]) opts.push((a + p) % K);
          if (!opts.length) return false;
          const j = opts[Math.floor(rbe() * opts.length)];
          taken[j] = true;
          slot[id] = j;
          return true;
        });
        if (ok) {
          ids.forEach((id) => (cards[id].belt = slot[id] + 1));
          belt = { g: bg, K, W: BELT_W, dir: rbe() < 0.5 ? 'h' : 'v' };
        }
      }
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
      const k = pickPlain(0, np - 1, (k) => drew[k + 1] === 0 && tails[k] == null && !ttails[k]);
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
  // Enredadera (13 nov 2026, pedido del usuario): la carta de fuego va entre el 15% y el 50% de la referencia y las
  // enredaderas en cartas que la referencia juega después del fuego (así nunca le estorban). Empiezan 2-4 y crecen a
  // 2-4 más, cada una la más cercana a las que ya tienen (orden de c.vine; ver vineOn en engine.js).
  let vine = null;
  if (mech.has('vine')) {
    const rv = mulberry32(hash(g * 9173 + t * 83 + 59));
    const kf = pickPlain(Math.max(2, Math.floor(np * 0.15)), Math.ceil(np * 0.5));
    const after = [];
    if (kf != null) for (let k = kf + 1; k < np; k++) if (plain(play[k]) && !after.includes(play[k])) after.push(play[k]);
    if (after.length >= 3) {
      const n0 = Math.min(after.length, randInt(rv, 2, 4)), total = Math.min(after.length, n0 + randInt(rv, 2, 4));
      const got = shuffle(rv, after.slice()).slice(0, n0);
      const dist = (a, b) => (pos[a].group === pos[b].group ? Math.hypot(pos[a].x - pos[b].x, (pos[a].y - pos[b].y) * 1.4) : 99);
      while (got.length < total) {
        const rest = after.filter((id) => !got.includes(id));
        got.push(rest.reduce((best, id) => (Math.min(...got.map((j) => dist(id, j))) < Math.min(...got.map((j) => dist(best, j))) ? id : best)));
      }
      cards[play[kf]].fire = 1;
      got.forEach((id, i) => (cards[id].vine = i));
      vine = { n0, n: total };
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
  // Agujero negro (9 nov 2026, rehecho dos veces a pedido del usuario): elige hasta HOLE_MAX cartas de todo el tablero
  // (10 nov 2026: todas las que no tienen otra mecánica, ~80%; con 12 parecía que siempre se tragaba las mismas)
  // (boca arriba y boca abajo, sin marcarlas) y en cada vuelta se traga unas al azar (40%) y las escupe con
  // números nuevos; las demás se quedan igual. Cada carta guarda su número de cada vuelta (c.ring, ver rankOf). Como la
  // carta viva, se arma para que la referencia vea cada carta con su número: el que sacó en la última vuelta que se la
  // tragó antes de jugarla vale lo de la cadena. Las vueltas se repiten (c.ring.length = las que dura la referencia + 1).
  // Sorteo propio.
  let hole = null;
  if (holeOn) {
    const rh = mulberry32(hash(g * 8111 + t * 61 + 29));
    const ok = [];
    for (let k = 0; k < np; k++) if (plain(play[k])) ok.push(k);
    const P = shuffle(rh, ok).slice(0, HOLE_MAX);
    if (P.length >= 4) {
      const T = Math.floor(Math.max(...P.map((k) => act[k])) / HOLE_EVERY) + 2;
      const took = Array.from({ length: T }, (_, v) => new Set(v ? P.filter(() => rh() < HOLE_TAKE) : P));
      for (const k of P) {
        const tk = Math.floor(act[k] / HOLE_EVERY), want = ranks[play[k]];
        const seq = [];
        for (let v = 0; v < T; v++) {
          if (!took[v].has(k)) { seq.push(seq[v - 1]); continue; }
          let x = randInt(rh, 0, 12);
          if (v && x === seq[v - 1]) x = mod13(x + randInt(rh, 1, 12));
          seq.push(x);
        }
        // La última vuelta en que se la tragó antes de jugarla (o el principio) le da su número de la cadena.
        let v0 = tk;
        while (v0 > 0 && !took[v0].has(k)) v0--;
        for (let v = v0; v <= tk; v++) seq[v] = want;
        Object.assign(cards[play[k]], { ring: seq, rank: seq[0] });
      }
      hole = { n: P.length };
    }
  }

  // Carta moneda (1-3): al jugarla da monedas (10 + 2 por constelación, tope 60). No cambia las reglas: ganable igual.
  const rco = mulberry32(hash(g * 9293 + t * 53 + 17));
  if (n >= 8 && world >= MECH_INTRO.coin && (world === MECH_INTRO.coin || rco() < COIN_ODDS * fin)) {
    const coins = Math.round(Math.min(60, 10 + 2 * Math.floor(base / (LEVELS_PER_WORLD * 10))) * 1.15);
    for (let k2 = randInt(rco, 1, 3); k2 > 0; k2--) {
      const k = pickPlain(0, np);
      if (k != null) cards[play[k]].coin = coins;
    }
  }
  // Camaleón (7 nov 2026): una carta que cada 3 jugadas o robos (CHAM_EVERY) cambia entre comodín y su número. Es regalo (como la
  // moneda: no cuenta en el límite ni cambia otros niveles). Siempre ganable: jugado como comodín deja el descarte
  // como comodín y la referencia sigue igual. En su mundo, en todos (los 5 primeros con 2).
  const rcm = mulberry32(hash(g * 6271 + t * 59 + 23));
  if (n >= 8 && world >= MECH_INTRO.cham && (world === MECH_INTRO.cham || rcm() < CHAM_ODDS * fin)) {
    for (let k2 = world === MECH_INTRO.cham && index < 5 ? 2 : 1; k2 > 0; k2--) {
      const k = pickPlain(0, np);
      if (k != null) cards[play[k]].cham = rcm() < 0.5 ? 1 : 2;
    }
  }
  // Fantasma (11 nov 2026, pedido del usuario: de 1 a 4 o más, no solo uno): 1-4 y en tableros grandes a veces 5.
  // Su fase se escoge para que se vea justo cuando la referencia lo juega.
  if (mech.has('ghost')) {
    for (let t = 1 + Math.floor(r() * 4) + (n >= 28 && r() < 0.35 ? 1 : 0); t > 0; t--) {
      const k = pickPlain(1, np);
      if (k != null) cards[play[k]].ghost = Math.floor(act[k] / 2) % 2 === 0 ? 1 : 2;
    }
  }

  // Marea: las cartas de la mitad de abajo de cada grupo llevan su franja (1 = la más baja). Se comprueba abajo con
  // la referencia o el solucionador; si no se puede ganar, se quita.
  if (tideOn) {
    for (const c of cards) {
      if (c.pack || c.bomb || c.comet) continue;
      const p = pos[c.id], rel = (p.y + 0.7) / Math.max(1.4, groups[p.group].h);
      if (rel > 0.78) c.wet = 1;
      else if (rel > 0.55) c.wet = 2;
    }
  }
  // Puertas: las llaves son cartas sin otra mecánica entre el 10% y el 70% de la solución (hay tiempo de usarlas) y
  // las pilas se agregan al final (ids después de las del tablero; la solución no las toca: cerradas no cuentan).
  // Cada pila es su propio grupo (una columna: cada carta tapa a la de arriba). Sorteo propio.
  let doors = null;
  if (doorsOn) {
    const rp = mulberry32(hash(g * 7177 + t * 67 + 31));
    const D = rp() < 0.5 ? 2 : 3, K = D === 2 ? 1 : rp() < 0.5 ? 1 : 2;
    const opts = [];
    for (let k = Math.floor(np * 0.1); k < Math.ceil(np * 0.7); k++) if (plain(play[k])) opts.push(k);
    shuffle(rp, opts);
    const keyN = Math.min(K, opts.length);
    if (keyN) {
      opts.slice(0, keyN).forEach((k) => (cards[play[k]].doorKey = 1));
      const prizes = shuffle(rp, ['coin', 'comet', 'turbo']).slice(0, D);
      const coins = 3 * Math.min(60, 10 + 2 * Math.floor(base / (LEVELS_PER_WORLD * 10)));
      doors = prizes.map((prize, d) => {
        const m = randInt(rp, 3, 5), gi = groups.length + d;
        // Pila que ayuda: números seguidos desde la de encima (racha); la que estorba: al azar.
        const easy = rp() < 0.5, dir = rp() < 0.5 ? 1 : -1;
        // La de encima (la última, j = m − 1) se juega primero.
        let cur = randInt(rp, 0, 12);
        const rk = [], id0 = cards.length;
        for (let j = m - 1; j >= 0; j--) (rk[j] = cur), (cur = easy ? mod13(cur + dir) : randInt(rp, 0, 12));
        for (let j = 0; j < m; j++) cards.push({ id: id0 + j, x: 0, y: j * DOOR_STEP, z: j, rot: 0, group: gi, rank: rk[j], suit: randInt(rp, 0, 3), coveredBy: j < m - 1 ? [id0 + j + 1] : [], door: d });
        return { n: m, prize, ...(prize === 'coin' && { coins }), g: gi, h: H + (m - 1) * DOOR_STEP };
      });
    }
  }
  const level = {
    g, world, index, d, template, boss, secret, event: !!ev, fresh, ...(respite && { respite }), ...(scroll && { scroll }), ...(tideOn && cards.some((c) => c.wet) && { tide: 1 }), ...(hole && { hole }), ...(vine && { vine }), ...(doors && { doors }), ...(belt && { belt }), ...(zeroOn && { zero: 1 }), ...(pongOn && { pong: 1 }), ...(rocksOn && { rocks: { n: base === rocksFirst() ? 2 : 2 + (hash(g * 211 + 7) % 2) } }),
    ...(raw.names && { pieces: raw.names }),
    ...((nebula || hangarOn) && { neb: segments }),
    ...(rocketOn && { rocket: 1 }),
    ...(hangarOn && { hangar: HANGAR_SHOW }),
    ...(portalOn && { portal: 1 }),
    ...(tubesOn && { tubes: 1 }),
    ...(sheets && { sheets, peek }),
    ...(grav && { cols: segments }),
    ...(flipOn && { flip: 1 }),
    // La banda ocupa solo su ventana (BELT_W lugares), acostada o parada.
    groups: [...groups.map(({ w, h }, gi) => (belt?.g === gi ? (belt.dir === 'h' ? { w: BELT_W * 1.08 - 0.08, h: 1.4 } : { w: 1, h: BELT_W * 1.55 - 0.15 }) : { w, h })), ...(doors || []).map((x) => ({ w: W, h: x.h }))],
    cards,
    keys,
    curtains,
    waste0,
    stock,
    solution: steps.map((x) => x.id), // la carta regalo no está (se activa sola); el boleto partido va dos veces y el triple tres
    meta: { spares, decoys, chains: starts.length, locks: keys.length, pack },
  };
  // Bomba y carta viva dependen de cuántas acciones haces, y en el juego los premios de racha añaden robos.
  // Se comprueba con el solucionador (que sí aplica premios); si no hay solución, se quitan.
  // Si no hay solución: primero se quita la carta viva y luego se le da más margen a la bomba.
  // En el evento los premios de racha van al doble de distancia: se comprueba igual que se juega.
  if (ev) level.rewardStep = 2;
  if (mech.has('ship')) level.ship = 1;
  // Primero el camino acertado (instantáneo); el solucionador solo si ese no llega a tiempo.
  if (orbitOn) {
    const o = orbitPath(cards, g);
    if (o) level.orbit = o;
  }
  const check = () => (!level.flip && !level.ship && !level.tide && !level.hole && !level.belt && !level.rocks && !level.zero && !level.orbit && !level.pong && !level.vine && !cards.some((c) => c.live || c.bomb || c.ghost)) || refLeft(level) >= 0 || !!solve(level, initState(level), 60000);
  // Mesa que se voltea: si no se puede ganar, se queda como gravedad.
  if (level.flip && !check()) {
    delete level.flip;
    for (const c of cards) delete c.flipBy;
  }
  // La banda: si no se puede ganar, se para (queda como una fila de cartas sueltas).
  if (level.belt && !check()) {
    level.groups[level.belt.g] = { w: groups[level.belt.g].w, h: groups[level.belt.g].h };
    delete level.belt;
    for (const c of cards) delete c.belt;
  }
  // El agujero negro también se quita si no se puede ganar (sus cartas vuelven a su número de la cadena).
  if (level.hole && !check()) {
    delete level.hole;
    for (const c of cards) if (c.ring) (c.rank = ranks[c.id]), delete c.ring;
  }
  // Los asteroides también se quitan si no se puede ganar (y las mesas de cartas que se mueven).
  if (level.rocks && !check()) delete level.rocks;
  if (level.zero && !check()) delete level.zero;
  if (level.orbit && !check()) delete level.orbit;
  if (level.pong && !check()) delete level.pong;
  // La marea es lo primero que se quita (luego la nave y el fantasma).
  if (level.tide && !check()) {
    delete level.tide;
    for (const c of cards) delete c.wet;
  }
  // La nave y el fantasma son lo primero que se quita (los niveles sin ellos quedan igual que antes).
  if (level.ship && !check()) delete level.ship;
  // Fantasmas: se quitan de uno en uno (el último primero) hasta que se pueda ganar.
  for (let gs = cards.filter((c) => c.ghost); gs.length && !check(); ) delete gs.pop().ghost;
  if (!check()) {
    for (const c of cards) if (c.live) (c.rank = ranks[c.id]), delete c.live;
    for (let extra = 4; !check() && extra <= 40; extra *= 2) for (const c of cards) if (c.bomb) c.bomb += extra;
  }
  // Enredadera: si aun así no se gana, se quita con su fuego (17 nov 2026: el 2781 salió con cometa y sin solución).
  if (level.vine && !check()) {
    delete level.vine;
    for (const c of cards) delete c.vine, delete c.fire;
  }
  // Niveles duros: estrellas contra el camino acertado (level.stars = cartas que deben quedar para 2★ y 3★).
  // 3★ = terminar con lo que deja la referencia menos T.miss; 2★ = la mitad de eso; 1★ = ganar.
  if (T) {
    level.tier = tier;
    // Si el camino acertado termina con el mazo vacío, ganar ya son 3★ (ganar es lo difícil).
    const best = Math.max(0, refLeft(level));
    level.stars = [Math.ceil(best / 2), Math.max(0, best - T.miss)];
  }
  // Rayo, escudo y constelación (10 nov 2026): al final, cada uno con su sorteo, y solo ayudan o dan premio (no hace
  // falta volver a comprobar). Los niveles que no los traen quedan igual. Fuera de las mesas que se recorren (scroll).
  if (n >= 10 && !scroll) {
    // Rayo: una carta sin otra mecánica en la primera mitad de la referencia (así tiene a quién sacar). 11 nov 2026: se
    // lleva al mazo de 1 a 3 cartas enterradas; eso puede romper la referencia, así que se comprueba (si no, sin rayo).
    const rbo = mulberry32(hash(g * 7333 + t * 67 + 41));
    if (world >= MECH_INTRO.bolt && (world === MECH_INTRO.bolt || rbo() < BOLT_ODDS * fin)) {
      const ks = [];
      for (let k = 1; k < Math.ceil(np * 0.55); k++) if (plain(play[k])) ks.push(k);
      if (ks.length) {
        const c = cards[play[pick(rbo, ks)]];
        c.bolt = 1 + Math.floor(rbo() * 3);
        if (!(refLeft(level) >= 0 || solve(level, initState(level), 60000))) delete c.bolt;
      }
    }
    // (El escudo ya no es carta: desde el 11 nov 2026 es una ayuda que se compra, ver HELPS en economy.js.)
    // Telescopio (14 nov 2026, pedido del usuario): al jugarlo se ven todas las cartas 3 turnos. Solo deja ver: no se
    // comprueba. En la primera mitad de la referencia, para que sirva.
    const rsp = mulberry32(hash(g * 6151 + t * 109 + 83));
    if (world >= MECH_INTRO.scope && (world === MECH_INTRO.scope || rsp() < SCOPE_ODDS * fin)) {
      const ks = [];
      for (let k = 0; k < Math.ceil(np * 0.5); k++) if (plain(play[k])) ks.push(k);
      if (ks.length) cards[play[pick(rsp, ks)]].scope = 1;
    }
    // Lazo y varita (15 nov 2026, pedido del usuario): solo ayudan (la referencia los juega como cartas normales y no los
    // usa), así que no se comprueban. En la primera mitad de la referencia, para que sirvan.
    for (const [m, f, salt, odds] of [['lasso', 'lasso', 131, LASSO_ODDS], ['wand', 'wand', 137, WAND_ODDS]]) {
      const rw = mulberry32(hash(g * 7417 + t * salt + 101));
      if (world < MECH_INTRO[m] || !(world === MECH_INTRO[m] || rw() < odds * fin)) continue;
      const ks = [];
      for (let k = 0; k < Math.ceil(np * 0.5); k++) if (plain(play[k]) && !cards[play[k]].cst) ks.push(k);
      if (ks.length) cards[play[pick(rw, ks)]][f] = 1;
    }
    // Gemelas (14 nov 2026, pedido del usuario): dos cartas atadas con un lazo; al jugar una, la otra sale de donde
    // esté y cae al descarte. La segunda va más adelante en la referencia (casi siempre tapada al jugar la primera).
    // Cambia el camino: se comprueba cada pareja (hasta 3 intentos) y si ninguna se gana, sin gemelas.
    // 14 nov 2026 (el usuario: «podríamos poner más de una»): de 1 a 3 parejas según el tamaño, cada una de su color
    // (c.twinC); la pareja se reconoce por el color.
    const rtw = mulberry32(hash(g * 5381 + t * 113 + 89));
    if (world >= MECH_INTRO.twin && (world === MECH_INTRO.twin || rtw() < TWIN_ODDS * fin)) {
      const ok = (k) => plain(play[k]) && !cards[play[k]].cst;
      const want = 1 + Math.floor(rtw() * (n >= 30 ? 3 : n >= 20 ? 2 : 1));
      for (let pc = 0, tries = 0; pc < want && tries < 3 * want; tries++) {
        const as = [], k0 = Math.floor(np * 0.15);
        for (let k = k0; k < Math.ceil(np * 0.6); k++) if (ok(k)) as.push(k);
        if (!as.length) break;
        const ka = pick(rtw, as), bs = [];
        for (let k = ka + 2; k < np; k++) if (ok(k)) bs.push(k);
        if (!bs.length) continue;
        const a = cards[play[ka]], b = cards[play[pick(rtw, bs)]];
        (a.twin = b.id), (b.twin = a.id), (a.twinC = b.twinC = pc);
        // En los duros (T) el camino acertado tiene que seguir ganando (pickLevel lo pide); en los demás basta que se gane.
        if (refLeft(level) >= 0 || (!T && solve(level, initState(level), 60000))) pc++;
        else delete a.twin, delete b.twin, delete a.twinC, delete b.twinC;
      }
    }
    // Cartas con cable (19 nov 2026, pedido del usuario: «son otro tipo de cartas»): parejas como las gemelas (c.twin)
    // con c.tug: al jugar una, la otra llega jalada a su lugar (ver play en engine.js). Mismo armado que las gemelas,
    // con su propio sorteo (los niveles de antes no cambian); 1 o 2 parejas.
    const rtg = mulberry32(hash(g * 6007 + t * 131 + 23));
    if (world >= MECH_INTRO.tug && (world === MECH_INTRO.tug || rtg() < TUG_ODDS * fin)) {
      const ok = (k) => plain(play[k]) && !cards[play[k]].cst;
      const want = 1 + Math.floor(rtg() * (n >= 24 ? 2 : 1));
      for (let pc = 0, tries = 0; pc < want && tries < 5 * want; tries++) {
        const as = [], k0 = Math.floor(np * 0.15);
        for (let k = k0; k < Math.ceil(np * 0.6); k++) if (ok(k)) as.push(k);
        if (!as.length) break;
        const ka = pick(rtg, as), bs = [];
        for (let k = ka + 2; k < np; k++) if (ok(k)) bs.push(k);
        if (!bs.length) continue;
        const a = cards[play[ka]], b = cards[play[pick(rtg, bs)]];
        (a.twin = b.id), (b.twin = a.id), (a.tug = b.tug = 1), (a.twinC = b.twinC = pc);
        if (refLeft(level) >= 0 || (!T && solve(level, initState(level), 60000))) pc++;
        else delete a.twin, delete b.twin, delete a.tug, delete b.tug, delete a.twinC, delete b.twinC;
      }
    }
    // Astronauta (14 nov 2026, pedido del usuario): llega al nivel para guardarte una carta. Solo ayuda (el
    // solucionador no lo usa): no se comprueba. Solo en mesas normales.
    const ras = mulberry32(hash(g * 4919 + t * 127 + 97));
    if (world >= MECH_INTRO.astro && !level.tide && !level.belt && !level.doors && !level.hole && !level.rocks && !level.zero && !level.orbit && !level.pong && !level.neb && (world === MECH_INTRO.astro || ras() < ASTRO_ODDS * fin)) level.astro = 1;
    // Constelación: 3 (o 4) cartas que la referencia juega una tras otra sin robar. Pueden traer otra mecánica (hielo,
    // candado…), menos el boleto partido (se juega en dos veces).
    const rcs = mulberry32(hash(g * 3301 + t * 73 + 47));
    if (world >= MECH_INTRO.cst && (world === MECH_INTRO.cst || rcs() < CST_ODDS * fin)) {
      const m = n >= 22 && rcs() < 0.4 ? 4 : 3, at = [];
      for (let i = 0; i + m <= seq.length; i++) {
        const run = seq.slice(i, i + m);
        if (run.every((x, j) => !x.tail && cards[x.id].half == null && !cards[x.id].tri && (!j || !x.dn))) at.push(i);
      }
      if (at.length) {
        const i = pick(rcs, at);
        for (const x of seq.slice(i, i + m)) cards[x.id].cst = 1;
        level.cst = m;
      }
    }
    // Carta dormida (13 nov 2026, pedido del usuario): no se juega hasta llevar racha de `sleep` (2-4, cartas seguidas
    // sin robar); al llegar despierta y se queda despierta. Va donde la referencia ya trae esa racha antes de jugarla,
    // así nunca le estorba. En su mundo, en todos (1-2); después, con su sorteo.
    const rsl = mulberry32(hash(g * 4447 + t * 89 + 61));
    if (world >= MECH_INTRO.sleep && (world === MECH_INTRO.sleep || rsl() < SLEEP_ODDS * fin)) {
      const run = new Map();
      let r0 = 0;
      for (const x of seq) {
        if (x.dn) r0 = 0;
        if (!x.tail && !run.has(x.id)) run.set(x.id, r0);
        r0++;
      }
      const ok = [...run].filter(([id, r]) => r >= 2 && plain(id));
      for (let w = 1 + (rsl() < 0.4 ? 1 : 0); w > 0 && ok.length; w--) {
        const [id, r] = ok.splice(Math.floor(rsl() * ok.length), 1)[0];
        cards[id].sleep = 2 + Math.floor(rsl() * (Math.min(4, r) - 1));
      }
      // Con mesas que la referencia no sigue (asteroides, marea…) sí puede estorbar: se comprueba y si no, se quita.
      if (!(refLeft(level) >= 0 || solve(level, initState(level), 60000))) for (const c of cards) delete c.sleep;
    }
    // Arcoíris (13 nov 2026): al jugarlo, las 3 jugadas siguientes pueden ser ±2. Casi siempre solo ayuda, pero se comprueba.
    const rar = mulberry32(hash(g * 3767 + t * 97 + 67));
    if (world >= MECH_INTRO.rainbow && (world === MECH_INTRO.rainbow || rar() < RAINBOW_ODDS * fin)) {
      const ks = [];
      for (let k = 0; k < np; k++) if (plain(play[k])) ks.push(k);
      if (ks.length) {
        const c = cards[play[pick(rar, ks)]];
        c.rainbow = 1;
        // 17 nov 2026: con enredadera y cometa el 2781 se quedaba sin solución; se comprueba y si no, se quita.
        if (!(refLeft(level) >= 0 || (!T && solve(level, initState(level), 60000)))) delete c.rainbow;
      }
    }
    // Imán (13 nov 2026): al jugarlo, tu siguiente robo saca del mazo la carta que deja jugar más cartas del tablero.
    // Cambia lo que robas, así que la referencia puede no servir: se comprueba y si no se gana, se quita.
    const rmg = mulberry32(hash(g * 2909 + t * 101 + 71));
    if (world >= MECH_INTRO.magnet && (world === MECH_INTRO.magnet || rmg() < MAGNET_ODDS * fin)) {
      const ks = [];
      for (let k = 1; k < Math.ceil(np * 0.7); k++) if (plain(play[k])) ks.push(k);
      if (ks.length) {
        const c = cards[play[pick(rmg, ks)]];
        c.magnet = 1;
        if (!(refLeft(level) >= 0 || solve(level, initState(level), 60000))) delete c.magnet;
      }
    }
  }
  // Candado de palo (17 nov 2026, pedido del usuario): una carta tapada de la segunda parte de la referencia con un
  // candado de un palo que la referencia ya jugó SL_NEED veces antes de llegar a ella. 1-2 por nivel. Si aun así no se
  // gana (mesas que la referencia no sigue), se quita. No en mesas que se recorren.
  const rsk = mulberry32(hash(g * 5737 + t * 113 + 29));
  if (!scroll && world >= MECH_INTRO.slock && (world === MECH_INTRO.slock || rsk() < SL_ODDS * fin)) {
    const cnt = [0, 0, 0, 0], ks = [];
    for (let i = 0; i < seq.length; i++) {
      const x = seq[i], c = cards[x.id];
      if (!x.tail && i >= seq.length * 0.35 && plain(x.id) && coveredBy[x.id].length && !ks.some(([id]) => id === x.id)) {
        const ok = [0, 1, 2, 3].filter((k) => cnt[k] >= SL_NEED);
        if (ok.length) ks.push([x.id, ok]);
      }
      if (c.suit != null) cnt[c.suit]++;
    }
    for (let w = 1 + (ks.length > 3 && rsk() < 0.35 ? 1 : 0); w > 0 && ks.length; w--) {
      const [id, ok] = ks.splice(Math.floor(rsk() * ks.length), 1)[0];
      cards[id].sl = pick(rsk, ok);
    }
    if (cards.some((c) => c.sl != null)) {
      level.sl = 1;
      // Al abrirse da monedas como la carta moneda.
      level.slCoins = Math.round(Math.min(60, 10 + 2 * Math.floor(base / (LEVELS_PER_WORLD * 10))) * 1.15);
      if (!(refLeft(level) >= 0 || (!T && solve(level, initState(level), 60000)))) {
        for (const c of cards) delete c.sl;
        delete level.sl, delete level.slCoins;
      }
    }
  }
  // Pintura (17 nov 2026, pedido del usuario): de preferencia donde la referencia juega justo después 3 cartas seguidas
  // (sin robar) de su mismo color, para que se pueda llenar. La carta de regalo cambia el mazo: se comprueba.
  const rpt = mulberry32(hash(g * 6421 + t * 131 + 37));
  if (!scroll && world >= MECH_INTRO.paint && (world === MECH_INTRO.paint || rpt() < PAINT_ODDS * fin)) {
    const red = (id) => cards[id].suit === 1 || cards[id].suit === 2;
    const good = [], any = [];
    for (let i = 0; i < seq.length; i++) {
      const x = seq[i];
      if (x.tail || !plain(x.id) || cards[x.id].sl != null) continue;
      if (i < seq.length * 0.7) any.push(x.id);
      const next = seq.slice(i + 1, i + 1 + PAINT_N);
      if (next.length === PAINT_N && next.every((y) => !y.dn && !y.tail && cards[y.id].suit != null && red(y.id) === red(x.id))) good.push(x.id);
    }
    const ids = good.length ? good : world === MECH_INTRO.paint ? any : [];
    if (ids.length) {
      const c = cards[pick(rpt, ids)];
      c.paint = 1;
      if (!(refLeft(level) >= 0 || (!T && solve(level, initState(level), 60000)))) delete c.paint;
    }
  }
  // Espejo, eco, burbuja de racha y clon (21 nov 2026, pedido del usuario; escogidas en dev/ideas-21-nov.html): al
  // final, con su sorteo (los niveles de antes no cambian). Cada una se comprueba con la referencia y, si no, con el
  // solucionador (no en los duros); si no se gana, se quita. No en mesas que se recorren.
  // Espejo: donde la referencia roba justo después (el descarte cambia) o es la última; si no, cualquiera.
  // Eco: solo abre jugadas. Burbuja: de preferencia antes de un robo, para que cuide la racha.
  const stepOk = (x) => !x.tail && plain(x.id) && cards[x.id].suit != null;
  // En los 5 primeros niveles de su estreno, sola (sin las otras tres).
  const solo = ['mirror', 'echo', 'bubble', 'clone'].find((m) => world === MECH_INTRO[m] && index < 5);
  const keep = (c, f, ok = () => true) => (ok() && (refLeft(level) >= 0 || (!T && solve(level, initState(level), 60000)))) || (delete c[f], false);
  for (const [m, f, odds, seed] of [['mirror', 'mirror', MIRROR_ODDS, 7039], ['echo', 'echo', ECHO_ODDS, 7451], ['bubble', 'bubble', BUBBLE_ODDS, 7883]]) {
    const rr = mulberry32(hash(g * seed + t * 139 + 41));
    if (scroll || (solo && solo !== m) || world < MECH_INTRO[m] || !(world === MECH_INTRO[m] || rr() < odds * fin)) continue;
    const good = [], any = [];
    seq.forEach((x, i) => {
      if (!stepOk(x) || i > seq.length * 0.85) return;
      any.push(x.id);
      if (m === 'echo' || !seq[i + 1] || seq[i + 1].dn > 0) good.push(x.id);
    });
    const ids = shuffle(rr, [...new Set(good.length ? good : any)]);
    for (const id of ids.slice(0, world === MECH_INTRO[m] ? 6 : 2)) {
      cards[id][f] = 1;
      if (keep(cards[id], f)) break;
    }
  }
  // Clon: copia a su vecina de fila (la de la izquierda más cercana primero, luego las de la derecha), de las que
  // tienen un solo número fijo. Se prueban varias hasta que la referencia (o el solucionador) siga ganando.
  const rcl = mulberry32(hash(g * 8111 + t * 149 + 53));
  if (!scroll && (!solo || solo === 'clone') && !level.pong && !level.foe && world >= MECH_INTRO.clone && (world === MECH_INTRO.clone || rcl() < CLONE_ODDS * fin)) {
    const fixed = (id) => plain(id) && cards[id].rank != null && cards[id].suit != null;
    const row = (c) => {
      const mates = cards.filter((x) => x.id !== c.id && Math.abs(x.y - c.y) < 0.01 && (x.group ?? 0) === (c.group ?? 0) && fixed(x.id));
      const L = mates.filter((x) => x.x < c.x).sort((a, b) => b.x - a.x), R = mates.filter((x) => x.x > c.x).sort((a, b) => a.x - b.x);
      return [...L, ...R];
    };
    const ids = shuffle(rcl, [...new Set(seq.filter((x) => stepOk(x)).map((x) => x.id))]).filter((id) => row(cards[id]).length);
    for (const id of ids.slice(0, world === MECH_INTRO.clone ? 12 : 4)) {
      const c = cards[id], nb = row(c);
      Object.assign(c, { clone: nb.map((x) => x.id), cloneR: nb.map((x) => x.rank), cloneS: nb.map((x) => x.suit) });
      if (refLeft(level) >= 0 || (!T && solve(level, initState(level), 60000))) break;
      delete c.clone, delete c.cloneR, delete c.cloneS;
    }
  }
  level.meta.mechs = MECHANICS.filter((m) => cards.some((c) => c[MECH_FIELD[m]] != null && !(m === 'twin' && c.tug)) || (m === 'turbo' && stock.some((c) => c.turbo)) || (m === 'ship' && level.ship) || (m === 'astro' && level.astro));
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
// Escalón de cada nivel (por planeta; el nombre viene de cuando pedían ayudas): 0 normal, 1 difícil, 2 muy difícil,
// 3 extremo (TIERS). Planeta 1: 1 de 5 niveles duro, planeta 2: 2 de 5… planeta 5: los 5. El 5.º de cada planeta es el más duro.
export const EVENT_HELP = [
  [0, 0, 0, 0, 1],
  [0, 0, 1, 0, 2],
  [0, 1, 0, 1, 2],
  [0, 1, 1, 1, 3],
  [1, 2, 1, 2, 3],
];
// Los tableros del evento dependen de qué mecánicas conoces: 5 grupos según el mundo al empezar el evento
// (el evento se abre al ganar el nivel 130, mundo 14). El mundo de cada grupo es el que se usa para armarlo.
// 8 nov 2026: los mundos donde llegan flecha, cortina, bomba y carta viva (antes [8, 11, 15, 19, 24]).
export const EVENT_WORLDS = [13, 17, 22, 27, 33];
export const eventGroup = (world) => EVENT_WORLDS.reduce((b, w, i) => (world >= w ? i : b), 0);
// t = otro tablero para el mismo nivel (pickLevel escoge cuál va en los duros).
// En el evento los premios de racha van al doble de distancia (rewardStep 2).
// Mesas especiales que ya conoce quien llegó al mundo w (sin la enrollada: depende del ancho de la pantalla).
const helpScrolls = (w) => Object.keys(SCROLL_FROM).filter((k) => k !== 'mesa' && SCROLL_FROM[k] < (w + 1) * LEVELS_PER_WORLD);
// tier: escalón del nivel duro (ver TIERS; EVENT_HELP dice cuál lleva cada uno, 0 = normal).
export function eventBase(month, k, group, t = 0, tier = 0) {
  const p = Math.floor(k / EVENT_PER_PLANET), j = k % EVENT_PER_PLANET, boss = j === EVENT_PER_PLANET - 1;
  // Una mesa especial por planeta, nunca en el jefe (cuál nivel y cuál mesa cambian con el mes).
  const kinds = helpScrolls(EVENT_WORLDS[group]), h = hash(month * 131 + group * 17 + p);
  const scroll = kinds.length && j === h % (EVENT_PER_PLANET - 1) ? kinds[(h >>> 4) % kinds.length] : null;
  // Índice dentro del mundo: el jefe usa el 10 (tableros de jefe); los demás, del 2 al 8.
  const L = generateLevel(EVENT_ID + k, { world: EVENT_WORLDS[group], index: boss ? LEVELS_PER_WORLD - 1 : 1 + j * 2, d: eventDifficulty(k), tight: p, scroll, seed: 7e6 + month * 977 + group * 131 + k + t * 7919, tier });
  return { ...L, k, planet: p, boss, rewardStep: 2 };
}
// key = edición (año × 12 + mes). Los duros escogen su tablero al armarse (pickLevel); cada año se cambian los
// números de las cartas (mismo tablero, misma dificultad).
export function eventLevel(key, k, world) {
  const month = key % 12, group = eventGroup(world), h = EVENT_HELP[Math.floor(k / EVENT_PER_PLANET)][k % EVENT_PER_PLANET];
  const L = h ? pickLevel(`e${month}.${group}.${k}`, h, (t) => eventBase(month, k, group, t, h)) : eventBase(month, k, group);
  const v = Math.floor(key / 12) - 2026;
  return v > 0 ? { ...variantLevel(L, v), variant: 0 } : L;
}
// Id de los niveles del evento (después de los normales y los secretos): solo sirve para guardar intentos.
export const EVENT_ID = TOTAL_LEVELS + WORLD_COUNT;
export const isEvent = (g) => g >= EVENT_ID;

// ---------- Niveles duros del camino ----------
// Cada constelación (10 mundos = 100 niveles) tiene redondear(3 + (c − 1) × 37 / 51) niveles duros: 3 en la primera
// y sube hasta 40 (el tope, 40%) en la 52. Cuáles son sale de una semilla fija (los mismos para todos; en la primera,
// desde el planeta 6). hardHelp(g) = 1, 2 o 3 (el nombre viene de cuando pedían ayudas): escalón TIERS[h + 1], muy
// difícil, extremo o demasiado extremo. Constelaciones 1-15: todos 1; 16-35: algunos 2; 36-52: algunos 2 y 3.
export const CONST_LEVELS = 10 * LEVELS_PER_WORLD;
export const hardCount = (c) => Math.round(3 + (c * 37) / 51); // c desde 0
// 14 nov 2026: el estreno de una carta nunca es duro (con el calendario nuevo el 121 de las gemelas y el 571 del
// arcoíris cayeron en duros y el 121 salía sin gemelas): el duro pasa al siguiente nivel que no sea estreno, así cada
// constelación tiene los mismos. Se arma la primera vez que se pide (MECH_INTRO y los *_FROM se definen después).
let HARD = null;
const debutLevels = () => new Set([...MECHANICS.filter((m) => !EXTRA.includes(m)).map((m) => MECH_INTRO[m] * LEVELS_PER_WORLD), ...Object.values(SCROLL_FROM), TIDE_FROM, HOLE_FROM, DOORS_FROM, BANDA_FROM, ROCKS_FROM, ZERO_FROM, ORBIT_FROM, PONG_FROM, ...Array.from({ length: TOTAL_LEVELS / CONST_LEVELS }, (_, c) => (c + 1) * CONST_LEVELS - 1)]);
function hardMap() {
  if (HARD) return HARD;
  HARD = new Map();
  for (let c = 0; c < TOTAL_LEVELS / CONST_LEVELS; c++) {
    const from = c ? 0 : 5 * LEVELS_PER_WORLD;
    const slots = shuffle(mulberry32(hash(9e6 + c)), [...Array(CONST_LEVELS - from).keys()]).slice(0, hardCount(c));
    const n = slots.length, n3 = c >= 35 ? Math.round(n * 0.2) : 0, n2 = c >= 15 ? Math.round(n * 0.3) : 0;
    slots.forEach((i, k) => HARD.set(c * CONST_LEVELS + from + i, k < n3 ? 3 : k < n3 + n2 ? 2 : 1));
  }
  const debut = debutLevels();
  for (const g of [...HARD.keys()]) {
    if (!debut.has(g)) continue;
    let to = g + 1;
    while (to < TOTAL_LEVELS && (HARD.has(to) || debut.has(to))) to++;
    if (to < TOTAL_LEVELS) HARD.set(to, HARD.get(g));
    HARD.delete(g);
  }
  return HARD;
}
export const hardHelp = (g) => hardMap().get(g) || 0;

// ---------- Festividades (eventos de 24 h) ----------
// 3 planetas de 3 niveles (algunas traen más): los que no son jefe muy difíciles y el jefe extremo (con tablero de jefe).
// Usan las mecánicas que ya conoces (grupo según el mundo al empezar). Cada nivel se arma al momento con la fecha de la
// festividad (day, cambia cada año): cada edición trae otros tableros, y dentro de una no se repiten.
// 16 nov 2026 (el usuario): antes los escogían de una lista de 1,000 tableros especiales (la «reserva»); se quitó.
export const FESTIVAL_PLANETS = 3;
export const FESTIVAL_PER_PLANET = 3;
export const FESTIVAL_LEVELS = FESTIVAL_PLANETS * FESTIVAL_PER_PLANET;
// Para que no salgan todos con la misma forma se turnan (desde una que cambia con la fecha).
const FESTIVAL_SHAPES = ['pyramid', 'diamond', 'wall', 'invPyramid', 'clusters', 'towers', 'peaks', 'scatter', 'layers'];
// Id de los niveles de las festividades (después de los del evento): solo para sus semillas.
export const FESTIVAL_ID = EVENT_ID + EVENT_LEVELS;
// n: niveles por planeta · t: otro tablero para el mismo nivel (pickLevel escoge cuál) · tier: su escalón (TIERS).
export function festivalBase(day, k, group, n = FESTIVAL_PER_PLANET, t = 0, tier = 2) {
  const j = k % n, boss = j === n - 1, hs = hash(day * 7349 + group * 131 + k);
  // ~1 de cada 12 con mesa especial (de las que ya conoce su grupo), como en el camino.
  const kinds = helpScrolls(EVENT_WORLDS[group]);
  const scroll = kinds.length && !(hs % 12) ? kinds[(hs >>> 5) % kinds.length] : null;
  const template = FESTIVAL_SHAPES[(hash(day * 31 + group) + k) % FESTIVAL_SHAPES.length];
  const L = buildLevel(FESTIVAL_ID + (day % 4096) * 16 + k, { world: EVENT_WORLDS[group], index: boss ? LEVELS_PER_WORLD - 1 : 1 + j * 2, d: Math.min(1, 0.45 + tier * 0.1), tight: tier, scroll, template, seed: 8e6 + day * 131 + group * 29 + k + t * 7919, tier });
  return { ...L, event: false, fest: true, rewardStep: 2 };
}
export function festivalLevel(day, k, world, n = FESTIVAL_PER_PLANET) {
  const p = Math.floor(k / n), boss = k % n === n - 1, group = eventGroup(world), tier = boss ? 3 : 2;
  const L = pickLevel(`f${day}.${group}.${k}.${n}`, tier, (t) => festivalBase(day, k, group, n, t, tier));
  return { ...L, k, planet: p, boss };
}

// ---------- Mecánicas por mundo ----------
export const MECHANICS = ['lock', 'pack', 'ice', 'double', 'arrow', 'curtain', 'bomb', 'live', 'ticket', 'comet', 'turbo', 'ghost', 'ship', 'coin', 'cham', 'bolt', 'cst', 'vine', 'magnet', 'rainbow', 'sleep', 'domino', 'triple', 'slock', 'paint', 'scope', 'twin', 'astro', 'lasso', 'wand', 'tug', 'mirror', 'echo', 'bubble', 'clone'];
const MECH_FIELD = { lock: 'lock', pack: 'pack', ice: 'ice', double: 'alt', arrow: 'arrow', curtain: 'curtain', bomb: 'bomb', live: 'live', ticket: 'half', comet: 'comet', turbo: 'turbo', ghost: 'ghost', ship: 'ship', coin: 'coin', cham: 'cham', bolt: 'bolt', cst: 'cst', vine: 'vine', magnet: 'magnet', rainbow: 'rainbow', sleep: 'sleep', domino: 'dom', triple: 'tri', slock: 'sl', paint: 'paint', scope: 'scope', twin: 'twin', astro: 'astro', lasso: 'lasso', wand: 'wand', tug: 'tug' , mirror: 'mirror', echo: 'echo', bubble: 'bubble', clone: 'clone' };
// Van con su sorteo, fuera de chooseMechanics (si entraran, cambiarían todos los niveles ya probados).
const OWN_DRAW = ['ticket', 'ghost', 'ship', 'coin', 'cham', 'bolt', 'cst', 'vine', 'magnet', 'rainbow', 'sleep', 'domino', 'triple', 'slock', 'paint', 'scope', 'twin', 'astro', 'lasso', 'wand', 'tug', 'mirror', 'echo', 'bubble', 'clone'];
// Mundo (índice desde 0) en el que se presenta cada una.
// 8 nov 2026: corridas para que cada estreno quede a 10 niveles o más del anterior (antes lock 1, pack 2, ice 4, double 7,
// arrow 11, curtain 15, bomb 19, live 24, ticket 20, comet 12, turbo 16, ghost 29, ship 34, coin 26, cham 32).
// 10 nov 2026: rayo 47, constelación 49 y escudo 52 (a 10 niveles o más de las festividades del 461 y de los asteroides
// del ROCAS_FROM).
// 13 nov 2026: enredadera 52 (nivel 521, a 14 de los asteroides del 507), imán 54 (541), arcoíris 56 (561) y carta
// dormida 58 (581).
// 13 nov 2026: dominó 60 (601) y boleto triple 62 (621), con la mesa que se voltea en medio (611).
// 14 nov 2026 (el usuario: «entre 71 y 91 no hay cartas nuevas»): telescopio 7 (71, con los logros) y gemelas 8 (81,
// con los meteoros); el astronauta 14 (141, el usuario: entre 110 y 160).
// 14 nov 2026 (pedido del usuario, calendario nuevo; ver SCROLL_FROM): dos cartas entre cada mesa, a +20 y +30: hielo 71,
// telescopio 81, gemelas 121, doble 131, astronauta 171, flecha 181, cometa 221, cortina 231, turbo 271, bomba 281,
// boleto partido 321, viva 331, moneda 371, fantasma 381, camaleón 421, nave 431, rayo 471, constelación 481,
// enredadera 521, imán 531, arcoíris 571, dormida 581, dominó 621, triple 631 y raspadita 651. Antes: { lock: 1, pack: 2, ice: 6, double: 12, arrow: 17, curtain: 22, bomb: 27, live: 33, ticket: 28, comet: 19, turbo: 24, ghost: 39, ship: 44, coin: 36, cham: 42, bolt: 47, cst: 49, vine: 52, magnet: 54, rainbow: 56, sleep: 58, domino: 60, triple: 62, scratch: 63, scope: 7, twin: 8, astro: 14 };
// 15 nov 2026 (pedido del usuario): lazo 67 (671) y varita 68 (681); la raspadita se recorre al final, 72 (721). La caja
// galáctica (mesa del 651) se quitó el 16 nov 2026. 17 nov 2026 (pedido del usuario): se quitó la raspadita; en su
// lugar, candado de palo 72 (721) y pintura 73 (731). 21 nov 2026 (pedido del usuario): espejo 78 (781), eco 82 (821),
// burbuja de racha 83 (831) y clon 87 (871).
export const MECH_INTRO = { lock: 1, pack: 2, ice: 7, scope: 8, twin: 12, double: 13, astro: 17, arrow: 18, comet: 22, curtain: 23, turbo: 27, bomb: 28, ticket: 32, live: 33, coin: 37, ghost: 38, cham: 42, ship: 43, bolt: 47, cst: 48, vine: 52, magnet: 53, rainbow: 57, sleep: 58, domino: 62, triple: 63, lasso: 67, wand: 68, slock: 72, paint: 73, tug: 77 , mirror: 78, echo: 82, bubble: 83, clone: 87 };
export const MECH_NAMES = {
  lock: 'Candado', pack: 'Carta regalo', ice: 'Hielo', double: 'Carta doble', arrow: 'Flecha', curtain: 'Cortina', bomb: 'Bomba', live: 'Carta viva', ticket: 'Boleto partido', comet: 'Cometa', turbo: 'Cohete turbo', ghost: 'Fantasma', ship: 'Nave ladrona', coin: 'Carta moneda', cham: 'Camaleón', bolt: 'Rayo', cst: 'Constelación', vine: 'Enredadera', magnet: 'Imán', rainbow: 'Arcoíris', sleep: 'Carta dormida', domino: 'Dominó', triple: 'Boleto triple', slock: 'Candado de palo', paint: 'Pintura', scope: 'Telescopio', twin: 'Cartas gemelas', astro: 'Astronauta', lasso: 'Lazo', wand: 'Varita', tug: 'Cartas con cable', mirror: 'Espejo', echo: 'Eco', bubble: 'Burbuja de racha', clone: 'Clon',
};
// Cartas de regalo (cometa y cohete turbo): no entran al sorteo de mecánicas, van aparte (buildLevel).
// En el camino sin ayudas cada una sale de 1 a 4 veces en cada tramo de 30-35 niveles (extraPlan, pedido 6 nov 2026).
// Los duros del camino, el evento, los especiales y los secretos siguen con esta probabilidad por nivel (cambiarían
// sus tableros); los duros que la traen cuentan en su tramo.
export const EXTRA = ['comet', 'turbo'];
// Boleto partido: no entra al sorteo de chooseMechanics (cambiaría los niveles ya probados); va con su propio sorteo.
export const TICKET_ODDS = 0.12;
// Fantasma (7 nov 2026): como el boleto partido, con su propio sorteo (los niveles que no lo traen quedan igual).
export const GHOST_ODDS = 0.14;
// Nave ladrona (7 nov 2026): igual, con su sorteo. Es del nivel (level.ship), no de una carta.
export const SHIP_ODDS = 0.1;
// Carta moneda (7 nov 2026): regalo dentro del tablero (como el cometa: no cuenta en el límite). Sorteo propio.
export const COIN_ODDS = 0.18;
// Camaleón (7 nov 2026): regalo como la moneda, con su sorteo.
export const CHAM_ODDS = 0.12;
// Rayo, constelación y escudo (10 nov 2026): con su sorteo. El escudo, en la mitad de los niveles con nave.
export const BOLT_ODDS = 0.12, CST_ODDS = 0.12;
// Enredadera (13 nov 2026): con su sorteo, como el fantasma.
export const VINE_ODDS = 0.12;
// Imán, arcoíris y carta dormida (13 nov 2026): con su sorteo, al final de buildLevel como el rayo.
export const MAGNET_ODDS = 0.1, RAINBOW_ODDS = 0.1, SLEEP_ODDS = 0.12;
// Dominó y boleto triple (13 nov 2026): con su sorteo, como el boleto partido.
export const DOM_ODDS = 0.12, TRI_ODDS = 0.1;
// Candado de palo y pintura (17 nov 2026): al final de buildLevel, con su sorteo.
export const SL_ODDS = 0.1, PAINT_ODDS = 0.1;
// Espejo, eco, burbuja de racha y clon (21 nov 2026): al final de buildLevel, con su sorteo.
export const MIRROR_ODDS = 0.1, ECHO_ODDS = 0.1, BUBBLE_ODDS = 0.1, CLONE_ODDS = 0.1;
// Telescopio, gemelas y astronauta (14 nov 2026): al final de buildLevel, con su sorteo.
export const SCOPE_ODDS = 0.1, TWIN_ODDS = 0.12, ASTRO_ODDS = 0.1, TUG_ODDS = 0.12;
// Lazo y varita (15 nov 2026): al final de buildLevel, con su sorteo.
export const LASSO_ODDS = 0.1, WAND_ODDS = 0.1;
export const EXTRA_ODDS = 0.047;
// Estreno: el primer nivel de su mundo que no es duro ni mesa especial.
const debuts = {};
export function extraDebut(m) {
  if (debuts[m] == null) {
    let g = MECH_INTRO[m] * LEVELS_PER_WORLD;
    while (hardHelp(g) || scrollKind(g)) g++;
    debuts[m] = g;
  }
  return debuts[m];
}

// Tramos de 30-35 niveles desde el estreno: en cada uno, de 1 a 4 niveles con el regalo (casi siempre 1-2), en
// lugares al azar entre los que pueden traerlo (sin ayudas ni mesa especial).
const extraAt = {};
const helpExtra = (m, g) => {
  if (!hardHelp(g) || Math.floor(g / LEVELS_PER_WORLD) < MECH_INTRO[m]) return false;
  const t = 0; // aproximado: el tablero de un duro se escoge al armarlo (pickLevel)
  return mulberry32(hash(m === 'comet' ? g * 7907 + t * 31 + 11 : g * 6007 + t * 37 + 5))() < EXTRA_ODDS;
};
function extraPlan(m) {
  const at = new Set(), r = mulberry32(hash(m === 'comet' ? 4241 : 9137));
  for (let g = extraDebut(m) + 1; g < TOTAL_LEVELS; ) {
    const end = Math.min(TOTAL_LEVELS, g + randInt(r, 30, 35)), ok = [];
    let fixed = 0;
    // El cohete turbo también puede caer en mesa especial; el cometa no (tiene cuenta y podría estar escondido).
    for (; g < end; g++) if (hardHelp(g)) fixed += helpExtra(m, g); else if (m === 'turbo' || !scrollKind(g)) ok.push(g);
    const x = r(), want = x < 0.45 ? 1 : x < 0.8 ? 2 : x < 0.95 ? 3 : 4;
    // Siempre al menos 1 propio: el de un nivel con ayudas es solo el sorteo (puede no salir por la mesa o el tamaño).
    const k = Math.max(1, Math.min(4 - fixed, want - fixed));
    for (const j of shuffle(r, ok).slice(0, k)) at.add(j);
  }
  return at;
}
export const extraPlanned = (m, g) => (extraAt[m] ||= extraPlan(m)).has(g);

function chooseMechanics(r, world, index, boss, n, ev = null, T = null) {
  if (n < 8) return [];
  const avail = MECHANICS.filter((m) => !EXTRA.includes(m) && !OWN_DRAW.includes(m) && world >= MECH_INTRO[m]);
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
  // Niveles duros: al menos T.mechs[1] y, si cabe, hasta T.mechs[0].
  if (T) return shuffle(r, avail.slice()).slice(0, Math.max(k, T.mechs[1]) + (T.mechs[0] > 2 && r() < 0.5 ? 1 : 0));
  return shuffle(r, avail.slice()).slice(0, k);
}

// Cada intento de un nivel cambia las cartas sin cambiar el tablero: se suma lo mismo a todos los rangos
// (mod 13, así ±1 y A–K siguen valiendo igual) y se barajan los palos. El intento 0 es el original.
// El clon cambia también lo que copia de sus vecinas y el agujero negro los números de cada vuelta (20 nov 2026: al
// repetir se quedaban con los del intento 0).
export function variantLevel(level, v) {
  if (!v) return level;
  const r = mulberry32(hash(level.g * 7919 + v));
  const k = randInt(r, 1, 12);
  // Con espejo (vale 12 − su número) sumar k lo deja restado: ahí se voltean todos los números (A↔K, 2↔Q…), que sí lo
  // respeta (la carta viva y la flecha cambian de sentido), en los intentos nones (20 nov 2026: al repetir, los niveles con espejo dejaban de poder ganarse).
  const flip = level.cards.some((c) => c.mirror), rk = (x) => (flip ? (v % 2 ? 12 - x : x) : (x + k) % 13);
  // Palos: se cambian sin revolver colores (rojos con rojos o todos los rojos por negros), para que la pintura siga
  // teniendo sus jugadas del mismo color (20 nov 2026).
  const blk = r() < 0.5 ? [0, 3] : [3, 0], rd = r() < 0.5 ? [1, 2] : [2, 1], [B, R] = r() < 0.5 ? [blk, rd] : [rd, blk];
  const perm = [B[0], R[0], R[1], B[1]];
  const map = (c) => (c.rank == null ? { ...c } : { ...c, rank: rk(c.rank), suit: perm[c.suit], ...(c.alt != null && { alt: rk(c.alt) }), ...(c.half != null && { half: rk(c.half) }), ...(c.dom != null && { dom: rk(c.dom) }), ...(c.tri && { tri: c.tri.map(rk) }), ...(c.ring && { ring: c.ring.map(rk) }), ...(flip && v % 2 && { ...(c.live && { live: -c.live }), ...(c.arrow && { arrow: -c.arrow }) }), ...(c.sl != null && { sl: perm[c.sl] }), ...(c.clone && { cloneR: c.cloneR.map(rk), cloneS: c.cloneS.map((x) => perm[x]) }) });
  const mapCard = (c) => ({ ...map(c), ...(c.pack && { pack: c.pack.map(map) }) });
  return { ...level, variant: v, ...(flip && v % 2 && { revRank: true }), cards: level.cards.map(mapCard), stock: level.stock.map(map), waste0: map(level.waste0) };
}

// Acomoda los grupos en filas: prueba 1..n filas y elige la que deja las cartas más grandes.
// Devuelve el tamaño de carta (u, en px), el tablero (bw, bh, en unidades) y la posición de cada grupo.
export function packRows(groups, availW, availH, gap = 0.7, maxU = 120) {
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
// Acomodo de los grupos del tablero: el de renglones (packRows, el de siempre) o, si las cartas salen al menos 6% más
// grandes y la pantalla está acostada, uno libre (19 nov 2026, el usuario: «cuando es vertical hay un acomodo bonito de cartas y cuando es
// horizontal no… pueden acomodarse bonito en H y verse hasta más grandes»): parte los grupos en dos y los pone lado a
// lado o uno encima del otro, y así cada parte (por ejemplo, el aro a la izquierda y los demás apilados a su lado).
export function packGroups(groups, availW, availH, gap = 0.7, maxU = 120) {
  const rows = packRows(groups, availW, availH, gap, maxU);
  const n = groups.length;
  // Parado se queda el de siempre (al usuario le gusta así); solo acostado se busca uno mejor.
  if (n < 3 || n > 8 || availW <= availH) return rows;
  // front[mask] = acomodos que no le ganan otro (ni más angosto ni más bajo) de esos grupos.
  const front = new Map();
  const add = (list, o) => {
    if (list.some((x) => x.w <= o.w + 1e-6 && x.h <= o.h + 1e-6)) return;
    for (let k = list.length - 1; k >= 0; k--) if (o.w <= list[k].w + 1e-6 && o.h <= list[k].h + 1e-6) list.splice(k, 1);
    list.push(o);
  };
  const all = (1 << n) - 1;
  const masks = Array.from({ length: all }, (_, k) => k + 1).sort((a, b) => popcount(a) - popcount(b));
  for (const m of masks) {
    const list = [];
    if ((m & (m - 1)) === 0) {
      const i = 31 - Math.clz32(m);
      list.push({ w: groups[i].w, h: groups[i].h, i });
    } else {
      // Cada forma de partirlo en dos (A con el bit más bajo para no repetir).
      const low = m & -m;
      for (let a = (m - 1) & m; a > 0; a = (a - 1) & m) {
        if (!(a & low)) continue;
        const b = m ^ a;
        for (const x of front.get(a)) for (const y of front.get(b)) {
          add(list, { w: x.w + gap + y.w, h: Math.max(x.h, y.h), side: true, a: x, b: y });
          add(list, { w: Math.max(x.w, y.w), h: x.h + gap + y.h, side: false, a: x, b: y });
        }
      }
    }
    front.set(m, list);
  }
  const uOf = (o) => Math.min(availW / o.w, availH / o.h, maxU);
  const best = front.get(all).reduce((p, o) => (uOf(o) > uOf(p) ? o : p));
  if (uOf(best) < rows.u * 1.06) return rows;
  const offsets = [];
  const put = (o, x, y) => {
    if (o.i != null) return void (offsets[o.i] = { x, y });
    if (o.side) {
      put(o.a, x, y + (o.h - o.a.h) / 2);
      put(o.b, x + o.a.w + gap, y + (o.h - o.b.h) / 2);
    } else {
      put(o.a, x + (o.w - o.a.w) / 2, y);
      put(o.b, x + (o.w - o.b.w) / 2, y + o.a.h + gap);
    }
  };
  put(best, 0, 0);
  return { u: uOf(best), bw: best.w, bh: best.h, offsets };
}
const popcount = (m) => { let k = 0; for (; m; m &= m - 1) k++; return k; };
