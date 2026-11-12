import { mulberry32, hash, randInt, pick, shuffle } from './rng.js';
import { follows, mod13, HOLE_EVERY, BELT_W, solve, initState, playRank, cutOf, play as playCard, draw as drawCard, won, starsFor, playCasual } from './engine.js';

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
// Mesa plegable: llega doblada en 3. Solo se ve y se juega el panel de en medio; al vaciarlo, los dos de los lados se
// despliegan sobre sus bisagras (a los lados con el teléfono acostado, arriba y abajo parado). Para el motor es como
// la nebulosa: las cartas de los lados tienen neb = 1 (level.neb = [en medio, lado, lado]). Desde el nivel 140.
// 8 nov 2026: todo lo que estrena el camino (cartas, mesas y eventos) va a 10 niveles o más de lo anterior; lo que estaba
// encimado se separó y lo de después se corrió lo mismo (antes mesa 39, gravedad 69, nebulosa 99, plegable 139).
export const SCROLL_FROM = { mesa: 50, gravedad: 109, nebulosa: 149, plegable: 208 };
// Marea (7 nov 2026): el agua sube desde abajo cada 3 robos y baja cada 3 jugadas; lo que queda bajo el agua no se
// juega. Desde el nivel MAREA_FROM + 1, ~1 de cada 10 normales del camino (sin otra mesa, respiro ni ayudas).
export const TIDE_FROM = 340; // antes 239 (ver SCROLL_FROM)
// Estreno: el primero desde MAREA_FROM que no es otra mesa, duro ni respiro.
let tideDebut = null;
export const tideFirst = () => {
  if (tideDebut == null) for (tideDebut = TIDE_FROM; cardDebut(tideDebut) || scrollKind(tideDebut) || hardHelp(tideDebut) || isRespite(tideDebut); tideDebut++);
  return tideDebut;
};
export const tideKind = (g) => !cardDebut(g) && (g === tideFirst() || (g > tideFirst() && !((hash(g * 3571 + 61) >>> 5) % 10)));
// Agujero negro (8 nov 2026): mesa sobre un tablero normal, como la marea (nunca juntas). Atrapa casi todo un grupo
// (9 nov 2026; antes 3-4 cartas marcadas) y cada HOLE_EVERY jugadas o robos les revuelve los números (ver rankOf en engine.js). Desde HOYO_FROM + 1 (a más de
// 10 niveles de la carta moneda), se intenta en ~1 de cada 5 normales del camino sin otra mesa, respiro ni ayudas
// (se queda en ~1 de cada 3 de esos: en los demás no hay cartas vecinas o no se podría ganar).
export const HOLE_FROM = 373;
let holeDebut = null;
export const holeFirst = () => {
  if (holeDebut == null) for (holeDebut = HOLE_FROM; cardDebut(holeDebut) || scrollKind(holeDebut) || hardHelp(holeDebut) || isRespite(holeDebut) || tideKind(holeDebut); holeDebut++);
  return holeDebut;
};
// Puertas (9 nov 2026, rehechas a pedido del usuario): un tablero normal y, a la orilla, 2 o 3 puertas chicas con una
// pila de 3 a 5 cartas detrás. Hay menos llaves que puertas (2 puertas: 1 llave; 3: 1 o 2): cada carta llave del
// tablero da una llave y el jugador escoge qué puerta abrir. Al abrirse, su premio se activa (moneda, cometa o cohete) y
// sus cartas salen al tablero: unas pilas ayudan (números seguidos) y otras estorban. Si no la abre, no cuentan.
export const DOORS_FROM = 404;
let doorsDebut = null;
export const doorsFirst = () => {
  if (doorsDebut == null) for (doorsDebut = DOORS_FROM; cardDebut(doorsDebut) || scrollKind(doorsDebut) || hardHelp(doorsDebut) || isRespite(doorsDebut) || tideKind(doorsDebut) || holeKind(doorsDebut); doorsDebut++);
  return doorsDebut;
};
export const doorsKind = (g) => !cardDebut(g) && !tideKind(g) && !holeKind(g) && (g === doorsFirst() || (g > doorsFirst() && !((hash(g * 6151 + 113) >>> 4) % 10)));
// Banda transportadora (8 nov 2026): una fila de cartas da vueltas dentro de una máquina; solo se ven BELT_W a la vez
// y avanza un lugar con cada jugada o robo (ver beltShown en engine.js). Va junto a un tablero normal.
export const BANDA_FROM = 455;
let bandaDebut = null;
export const bandaFirst = () => {
  if (bandaDebut == null) for (bandaDebut = BANDA_FROM; cardDebut(bandaDebut) || scrollKind(bandaDebut) || hardHelp(bandaDebut) || isRespite(bandaDebut) || tideKind(bandaDebut) || holeKind(bandaDebut) || doorsKind(bandaDebut); bandaDebut++);
  return bandaDebut;
};
export const bandaKind = (g) => !cardDebut(g) && !tideKind(g) && !holeKind(g) && !doorsKind(g) && (g === bandaFirst() || (g > bandaFirst() && !((hash(g * 2477 + 71) >>> 5) % 6)));
// Cinturón de asteroides (10 nov 2026, pedido del usuario): mesa sobre un tablero normal, nunca con otra. Cada
// ROCK_EVERY robos caen 2 o 3 piedras que tapan cartas libres por unas jugadas (ver dropRocks en engine.js). Desde
// ROCAS_FROM, ~1 de cada 6 normales que no traen otra mesa.
export const ROCKS_FROM = 505;
let rocksDebut = null;
export const rocksFirst = () => {
  if (rocksDebut == null) for (rocksDebut = ROCKS_FROM; cardDebut(rocksDebut) || scrollKind(rocksDebut) || hardHelp(rocksDebut) || isRespite(rocksDebut) || tideKind(rocksDebut) || holeKind(rocksDebut) || doorsKind(rocksDebut) || bandaKind(rocksDebut); rocksDebut++);
  return rocksDebut;
};
export const rocksKind = (g) => !cardDebut(g) && !tideKind(g) && !holeKind(g) && !doorsKind(g) && !bandaKind(g) && (g === rocksFirst() || (g > rocksFirst() && !((hash(g * 5303 + 89) >>> 5) % 6)));
export const holeKind = (g) => !cardDebut(g) && !tideKind(g) && (g === holeFirst() || (g > holeFirst() && !((hash(g * 4241 + 97) >>> 6) % 5)));
export const GRAV_SHOWN = 2; // cartas boca arriba en cada columna
export const HOLE_MAX = 99; // cartas que atrapa el agujero negro, como mucho (10 nov 2026: todas; antes 12)
export const HOLE_TAKE = 1; // parte que se traga y revuelve en cada vuelta (10 nov 2026: todas; antes 0.4)
export const DOOR_STEP = 0.3; // paso entre las cartas de la pila de una puerta
export const NEB_SLOTS = 3;
export const SCROLL_VIEW = 8.2, SCROLL_GAP = 0.45, SCROLL_SHOW = 0.5;
const SCROLL_SPARE = 0.2; // sobrantes extra por carta del tablero
const SCROLL_PIECES = ['miniPyramid', 'miniInv', 'twoRows', 'twoRows', 'sandwich', 'crown', 'steps', 'stack', 'fan', 'tiltFan', 'arc', 'cross', 'rosette'];
// Estreno de una carta (el primer nivel de su mundo; el cometa y el cohete ya buscan uno sin mesa en extraDebut): sin
// ninguna mesa, para que se vea sola lo que anuncia el camino (11 nov 2026: la nave salía en una plegable y el fantasma
// no salía, porque el agujero negro quita las demás cartas).
const cardDebut = (g) => g % LEVELS_PER_WORLD === 0 && MECHANICS.some((m) => !EXTRA.includes(m) && MECH_INTRO[m] * LEVELS_PER_WORLD === g);
export function scrollKind(g) {
  if (g >= TOTAL_LEVELS || cardDebut(g)) return null;
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
function scrollSegments(r, d, kind) {
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
  // El estreno de una mesa no es respiro (ya va amable): si no, el camino la anuncia y no sale (plegable en el 209).
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
// (EVENT_HELP 1-3) y especiales/festividades (specialHelp 1-4): difícil, muy difícil, extremo, demasiado extremo.
// Sin archivos: el tablero de cada uno lo escoge el juego al armarlo con una revisión rápida (pickLevel).
export function generateLevel(g, ev = null) {
  if (ev) return buildLevel(g, ev);
  if (g >= SPECIAL_ID) return specialLevel(g - SPECIAL_ID);
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

// Niveles normales: a veces, por suerte de los números, uno sale brutal (bot < 15%, como un extremo pero sin estar
// marcado). Si en la revisión rápida el bot gana menos del 15%, se arma la siguiente versión t. Del 11 al SOFT_UNTIL.
export const SOFT_UNTIL = 2500;
function softLevel(g) {
  if (g < 10 || g >= SOFT_UNTIL || isSecret(g)) return buildLevel(g);
  const key = `s${g}`;
  if (picked.has(key)) return buildLevel(g, null, picked.get(key));
  let best = null;
  for (let t = 0; t < 12; t++) {
    const L = buildLevel(g, null, t), w = quickWins(L);
    if (!best || w > best.w) best = { L, t, w };
    if (w >= QUICK * 0.15) break;
  }
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
export function refLeft(L) {
  let s = initState(L);
  for (const id of L.solution) {
    if (s.rem[id]) continue;
    // Boleto partido entero: la solución juega primero la mitad de arriba.
    const c = L.cards[id], top = c.half != null && !cutOf(c, s);
    while (top ? playRank(L, c, s) !== c.rank : playRank(L, c, s) == null) {
      if (!s.stock.length) return -1;
      s = drawCard(L, s).s;
    }
    s = playCard(L, s, id).s;
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
  // son duros (fresh) tienen respiros; los duros no llevan mesa enrollada (en una pantalla ancha se ve más tira). El evento y los especiales traen su mesa en ev.scroll (ver eventBase, specialBase).
  const fresh = !ev && !hardHelp(g);
  // Respiro: en cada mundo 1 nivel (a veces 2) sale fácil, para que no todos sean cuesta arriba (ver isRespite).
  const respite = fresh && !secret && isRespite(base);
  const kind = !ev && !secret && !respite ? scrollKind(base) : null;
  const scroll = ev ? ev.scroll || null : fresh || kind !== 'mesa' ? kind : null;
  const d0 = ev ? ev.d : secret ? Math.min(1, difficulty(base) + 0.05) : difficulty(base);
  // Mesa enrollada: la tira es larga y solo se ve un pedazo; el mazo va más amable (y con más sobrantes, abajo).
  // La nebulosa, algo menos (medido con el bot casual).
  // El nivel donde se estrena cada mesa va amable aunque sea jefe.
  const debut = scroll && base === SCROLL_FROM[scroll];
  let d = respite ? Math.min(d0, 0.06 + d0 * 0.15) : debut ? d0 * (scroll === 'gravedad' ? 0.35 : scroll === 'plegable' ? 0.15 : 0.3) : scroll === 'mesa' ? d0 * 0.3 : scroll === 'gravedad' ? d0 * (base < 200 ? 0.35 : 0.55) : scroll ? d0 * 0.65 : d0;
  // Mesas sobre un tablero normal (marea, agujero negro y puertas): nunca dos en el mismo nivel.
  const overlay = fresh && !secret && !respite && !scroll;
  const holeOn = overlay && holeKind(base);
  const doorsOn = overlay && doorsKind(base);
  const banda = overlay && !doorsOn && bandaKind(base);
  const rocksOn = overlay && !holeOn && !doorsOn && !banda && rocksKind(base);
  // Agujero negro y banda ya cuestan por sí mismas: el tablero va un poco más amable (como las otras mesas). Las
  // puertas, apenas (sus pilas no cuentan si no las abres). La banda pesa más (al bot le costaba 31% contra 47%): la mitad.
  if (holeOn) d *= base === holeFirst() ? 0.25 : 0.6; // su estreno, más amable
  if (doorsOn) d *= 0.9;
  if (banda) d *= 0.5;
  if (rocksOn) d *= base === rocksFirst() ? 0.4 : 0.9;
  // Evento: en cada planeta salen más seguido las formas que más cuestan (medido con el bot casual).
  const template = ev?.scroll || ev?.template || (ev && (index === LEVELS_PER_WORLD - 1 || r() < 0.15 + ev.tight * 0.17) ? pick(r, ['peaks', 'peaks', 'scatter', 'invPyramid']) : scroll || (respite ? pick(r, RESPITE_SHAPES) : chooseTemplate(r, ev ? Math.max(3, base) : base, d, true)));

  const shape = (dd) => (template === 'clusters' ? clusters(r, dd, index === LEVELS_PER_WORLD - 1, true) : [TEMPLATES[template](r, dd)]);
  let raw = scroll ? scrollSegments(r, d, scroll) : shape(d);
  // Sin ayudas: si salió muy chico, se vuelve a armar un poco más grande.
  // Niveles duros: tableros más grandes (T.min).
  const minN = respite ? RESPITE_MIN : Math.max(freshMin(base), T?.min || 0);
  for (let k = 1; (!ev || T) && !scroll && k <= 12 && raw.reduce((s, gr) => s + gr.length, 0) < minN; k++) raw = shape(Math.min(1, d + k * 0.15));
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
  const tableScroll = scroll === 'mesa', nebula = scroll === 'nebulosa', grav = scroll === 'gravedad', fold = scroll === 'plegable';
  const under = tableScroll && coveredBy.map((a) => a.slice());
  if (tableScroll) rollCover(pos, groups, SCROLL_VIEW).forEach((a, i) => coveredBy[i].push(...a));
  // Nebulosa: tramos que hay que vaciar antes de que salga cada carta.
  // Plegable: los lados salen al vaciar el panel de en medio.
  const neb = nebula ? pos.map((p) => Math.max(0, p.group - NEB_SLOTS + 1)) : fold ? pos.map((p) => (p.group ? 1 : 0)) : null;
  const segments = (nebula || grav || fold) && groups.map((_, gi) => pos.reduce((a, p, i) => (p.group === gi && a.push(i), a), []));
  // Gravedad: a cada carta solo la tapa la de abajo de su columna (la primera de cada columna es la de abajo).
  if (grav) for (const t of segments) t.forEach((id, k) => (coveredBy[id] = k ? [t[k - 1]] : []));

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
  const tideOn = fresh && !secret && !respite && !scroll && tideKind(base);

  // Estreno de la plegable sin otras mecánicas: al principio solo se juega el panel de en medio y ya cuesta más.
  if (debut && scroll === 'plegable') mech.clear();
  // Cometa: es un regalo, así que va aparte de las demás (no cuenta en el límite de 2 y sale con cualquiera).
  // Por ahora solo sin ayudas y sin mesas especiales. Se estrena en el primer nivel de su mundo y después sale de
  // vez en cuando (es un regalo: no muy seguido). Usa su propio sorteo: un nivel que no lo trae queda igual que antes.
  const rc = mulberry32(hash(g * 7907 + t * 31 + 11));
  // En el camino sin ayudas no es al azar: va donde lo pone extraPlan (1-4 por tramo de 30-35 niveles).
  const plan = fresh && !secret;
  const extraHere = (m, roll) => base === extraDebut(m) || (plan ? (roll(), extraPlanned(m, base)) : roll() < EXTRA_ODDS);
  if (!scroll && n >= 8 && world >= MECH_INTRO.comet && extraHere('comet', rc)) mech.add('comet');
  // Cohete turbo: el otro regalo, igual que el cometa pero con su propio sorteo.
  const rt = mulberry32(hash(g * 6007 + t * 37 + 5));
  // También en las mesas especiales (7 nov 2026, pedido del usuario: se juega como cualquier carta, no tiene cuenta).
  const turbo = n >= 8 && world >= MECH_INTRO.turbo && extraHere('turbo', rt);
  // Boleto partido: mecánica normal (cuenta en el límite de 2), pero con su propio sorteo como el cometa, para que los
  // niveles que no lo traen queden igual. En su mundo va en todos (sola en los primeros niveles); después, de vez en cuando.
  // También en las mesas especiales (7 nov 2026): se juega como cualquier carta.
  const rb = mulberry32(hash(g * 5303 + t * 41 + 3));
  if (n >= 10 && world >= MECH_INTRO.ticket && (world === MECH_INTRO.ticket || rb() < TICKET_ODDS)) {
    const keep = respite || (world === MECH_INTRO.ticket && index < 5) ? 0 : 1;
    const comet = mech.has('comet');
    [...mech].slice(keep).forEach((m) => mech.delete(m));
    mech.add('ticket');
    // El cometa no cuenta en el límite: en el camino sin ayudas se queda (los demás niveles, como estaban).
    if (plan && comet) mech.add('comet');
  }
  // Fantasma: su propio sorteo, como el boleto. En su mundo va en todos (solo en los primeros 5); cuenta en el límite de 2.
  const rgh = mulberry32(hash(g * 7411 + t * 43 + 9));
  if (n >= 10 && world >= MECH_INTRO.ghost && (world === MECH_INTRO.ghost || rgh() < GHOST_ODDS)) {
    const keep = respite || (world === MECH_INTRO.ghost && index < 5) ? 0 : 1;
    const comet = mech.has('comet');
    [...mech].filter((m) => m !== 'comet').slice(keep).forEach((m) => mech.delete(m));
    mech.add('ghost');
    if (!comet) mech.delete('comet');
  }
  // Nave ladrona: sorteo propio; en su mundo, en todos (sola en los 5 primeros). Cuenta en el límite de 2.
  const rsh = mulberry32(hash(g * 8641 + t * 47 + 13));
  if (n >= 10 && world >= MECH_INTRO.ship && (world === MECH_INTRO.ship || rsh() < SHIP_ODDS)) {
    const keep = respite || (world === MECH_INTRO.ship && index < 5) ? 0 : 1;
    [...mech].filter((m) => m !== 'comet').slice(keep).forEach((m) => mech.delete(m));
    mech.add('ship');
  }

  // Carta regalo: una carta especial (sin número) que se activa sola al quedar destapada del todo
  // y manda 2-5 cartas al final del mazo. Va tapada y en el primer 40% del orden de retirada.
  // Banda: sin candados, boletos ni carta regalo (se ponen antes que la banda y la dejarían sin vuelta).
  if (banda) for (const m of ['lock', 'ticket', 'pack']) mech.delete(m);
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
  // Plegable: en su estreno, unas cartas de más (al principio solo hay jugadas en el panel de en medio).
  if (debut && fold) spares += 3;
  // En niveles fáciles las sobrantes suelen ser vecinas de alguna carta del tablero.
  const helpfulCard = (p) => card(r() < p ? (pick(r, known) + pick(r, [1, 12])) % 13 : randInt(r, 0, 12));
  // Niveles duros: pocas sobrantes (las estrellas se miden contra el camino acertado, ver abajo).
  if (T) spares = T.spares;
  for (let i = 0; i < spares; i++) stock.push(helpfulCard((1 - d) * 0.85));

  const cards = pos.map((p, i) => ({ id: i, ...p, rank: ranks[i], suit: randInt(r, 0, 3), coveredBy: coveredBy[i], ...(under && { under: under[i] }), ...(neb?.[i] && { neb: neb[i] }) }));
  for (const id of [...bombIds, ...cometIds]) delete cards[id].rank;
  const SPECIAL = ['lock', 'key', 'pack', 'ice', 'alt', 'arrow', 'curtain', 'curtainKey', 'bomb', 'live', 'comet', 'turbo', 'half', 'ghost', 'coin', 'cham', 'ring', 'doorKey', 'belt', 'bolt', 'shield'];
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
  if (n >= 8 && world >= MECH_INTRO.coin && (world === MECH_INTRO.coin || rco() < COIN_ODDS)) {
    const coins = Math.min(60, 10 + 2 * Math.floor(base / (LEVELS_PER_WORLD * 10)));
    for (let k2 = randInt(rco, 1, 3); k2 > 0; k2--) {
      const k = pickPlain(0, np);
      if (k != null) cards[play[k]].coin = coins;
    }
  }
  // Camaleón (7 nov 2026): una carta que cada 3 jugadas o robos (CHAM_EVERY) cambia entre comodín y su número. Es regalo (como la
  // moneda: no cuenta en el límite ni cambia otros niveles). Siempre ganable: jugado como comodín deja el descarte
  // como comodín y la referencia sigue igual. En su mundo, en todos (los 5 primeros con 2).
  const rcm = mulberry32(hash(g * 6271 + t * 59 + 23));
  if (n >= 8 && world >= MECH_INTRO.cham && (world === MECH_INTRO.cham || rcm() < CHAM_ODDS)) {
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
    g, world, index, d, template, boss, secret, event: !!ev, fresh, ...(respite && { respite }), ...(scroll && { scroll }), ...(tideOn && cards.some((c) => c.wet) && { tide: 1 }), ...(hole && { hole }), ...(doors && { doors }), ...(belt && { belt }), ...(rocksOn && { rocks: { n: base === rocksFirst() ? 2 : 2 + (hash(g * 211 + 7) % 2) } }),
    ...(raw.names && { pieces: raw.names }),
    ...((nebula || fold) && { neb: segments }),
    ...(grav && { cols: segments }),
    // La banda ocupa solo su ventana (BELT_W lugares), acostada o parada.
    groups: [...groups.map(({ w, h }, gi) => (belt?.g === gi ? (belt.dir === 'h' ? { w: BELT_W * 1.08 - 0.08, h: 1.4 } : { w: 1, h: BELT_W * 1.55 - 0.15 }) : { w, h })), ...(doors || []).map((x) => ({ w: W, h: x.h }))],
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
  if (mech.has('ship')) level.ship = 1;
  // Primero el camino acertado (instantáneo); el solucionador solo si ese no llega a tiempo.
  const check = () => (!level.ship && !level.tide && !level.hole && !level.belt && !level.rocks && !cards.some((c) => c.live || c.bomb || c.ghost)) || refLeft(level) >= 0 || !!solve(level, initState(level), 60000);
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
  // Los asteroides también se quitan si no se puede ganar.
  if (level.rocks && !check()) delete level.rocks;
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
    if (world >= MECH_INTRO.bolt && (world === MECH_INTRO.bolt || rbo() < BOLT_ODDS)) {
      const ks = [];
      for (let k = 1; k < Math.ceil(np * 0.55); k++) if (plain(play[k])) ks.push(k);
      if (ks.length) {
        const c = cards[play[pick(rbo, ks)]];
        c.bolt = 1 + Math.floor(rbo() * 3);
        if (!(refLeft(level) >= 0 || solve(level, initState(level), 60000))) delete c.bolt;
      }
    }
    // (El escudo ya no es carta: desde el 11 nov 2026 es una ayuda que se compra, ver HELPS en economy.js.)
    // Constelación: 3 (o 4) cartas que la referencia juega una tras otra sin robar. Pueden traer otra mecánica (hielo,
    // candado…), menos el boleto partido (se juega en dos veces).
    const rcs = mulberry32(hash(g * 3301 + t * 73 + 47));
    if (world >= MECH_INTRO.cst && (world === MECH_INTRO.cst || rcs() < CST_ODDS)) {
      const m = n >= 22 && rcs() < 0.4 ? 4 : 3, at = [];
      for (let i = 0; i + m <= seq.length; i++) {
        const run = seq.slice(i, i + m);
        if (run.every((x, j) => !x.tail && cards[x.id].half == null && (!j || !x.dn))) at.push(i);
      }
      if (at.length) {
        const i = pick(rcs, at);
        for (const x of seq.slice(i, i + m)) cards[x.id].cst = 1;
        level.cst = m;
      }
    }
  }
  level.meta.mechs = MECHANICS.filter((m) => cards.some((c) => c[MECH_FIELD[m]] != null) || (m === 'turbo' && stock.some((c) => c.turbo)) || (m === 'ship' && level.ship));
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
const HARD = new Map();
for (let c = 0; c < TOTAL_LEVELS / CONST_LEVELS; c++) {
  const from = c ? 0 : 5 * LEVELS_PER_WORLD;
  const slots = shuffle(mulberry32(hash(9e6 + c)), [...Array(CONST_LEVELS - from).keys()]).slice(0, hardCount(c));
  const n = slots.length, n3 = c >= 35 ? Math.round(n * 0.2) : 0, n2 = c >= 15 ? Math.round(n * 0.3) : 0;
  slots.forEach((i, k) => HARD.set(c * CONST_LEVELS + from + i, k < n3 ? 3 : k < n3 + n2 ? 2 : 1));
}
export const hardHelp = (g) => HARD.get(g) || 0;

// ---------- Tableros especiales (para eventos exclusivos) ----------
// 1,000 tableros aparte, que no salen ni en el camino ni en el evento del mes, ordenados por escalón
// (specialHelp): 0-249 difícil, 250-499 muy difícil, 500-749 extremo y 750-999 demasiado extremo. Cada uno es de un grupo de
// mecánicas como el evento (grupo 0-4 = el jugador ya llegó al mundo 9, 12, 16, 20 o 25): solo usan las que ya conoce.
// Cada 4.º es tablero de jefe. specialLevel(i) arma el tablero (escoge la versión con pickLevel); specials(h, grupo) los busca.
export const SPECIAL_COUNT = 1000;
export const SPECIAL_ID = EVENT_ID + EVENT_LEVELS;
export const specialHelp = (i) => 1 + Math.floor(i / 250);
export const specialGroup = (i) => i % EVENT_WORLDS.length;
export const specials = (h, group = null) => [...Array(SPECIAL_COUNT).keys()].filter((i) => specialHelp(i) === h && (group == null || specialGroup(i) === group));
// Para que no salgan todos con la misma forma, cada uno trae la suya (se turnan). Dispersa y capas no van en los
// demasiado extremos.
const SPECIAL_SHAPES = ['pyramid', 'diamond', 'wall', 'invPyramid', 'clusters', 'towers', 'peaks', 'scatter', 'layers'];
export function specialBase(i, t = 0, tier = 0) {
  const h = specialHelp(i), boss = i % 4 === 3, shapes = SPECIAL_SHAPES.slice(0, h === 4 ? 7 : 9);
  // ~1 de cada 12 con mesa especial (de las que ya conoce su grupo), como en el camino.
  const kinds = helpScrolls(EVENT_WORLDS[specialGroup(i)]), hs = hash(i * 7349 + 101);
  const scroll = kinds.length && !(hs % 12) ? kinds[(hs >>> 5) % kinds.length] : null;
  const L = buildLevel(SPECIAL_ID + i, { world: EVENT_WORLDS[specialGroup(i)], index: boss ? LEVELS_PER_WORLD - 1 : 1 + (i % 4) * 2, d: Math.min(1, 0.45 + h * 0.1), tight: h, scroll, template: shapes[i % shapes.length], seed: 8e6 + i * 13 + t * 7919, tier });
  return { ...L, event: false, special: i, rewardStep: 2 };
}
export const specialLevel = (i) => pickLevel(`p${i}`, specialHelp(i), (t) => specialBase(i, t, specialHelp(i)));

// ---------- Festividades (eventos de 24 h) ----------
// 3 planetas de 3 niveles, todos con tableros especiales: los dos primeros de cada planeta muy difíciles y el jefe extremo
// (y es tablero de jefe). Usan las mecánicas que ya conoces (grupo según el mundo al empezar). seed cambia con la
// festividad y el año: cada edición trae otros tableros, y dentro de una no se repiten.
export const FESTIVAL_PLANETS = 3;
export const FESTIVAL_PER_PLANET = 3;
export const FESTIVAL_LEVELS = FESTIVAL_PLANETS * FESTIVAL_PER_PLANET;
// Algunas festividades largas traen más (n: niveles por planeta); los que no son jefe muy difíciles y el jefe extremo.
// Qué tablero especial toca (sin armarlo; el modo dev lo usa para saber qué festividad usa cada uno).
export function festivalPick(seed, k, world, n = FESTIVAL_PER_PLANET) {
  const j = k % n, p = Math.floor(k / n), boss = j === n - 1;
  const pool = specials(boss ? 3 : 2, eventGroup(world)).filter((i) => (i % 4 === 3) === boss);
  // Las de 3×3 siguen como siempre; las más largas cuentan jefes y no jefes por separado para no repetir tablero.
  const step = n === FESTIVAL_PER_PLANET ? k : boss ? p : p * (n - 1) + j;
  return pool[(hash(seed) + step * 7) % pool.length];
}
export function festivalLevel(seed, k, world, n = FESTIVAL_PER_PLANET) {
  const p = Math.floor(k / n), boss = k % n === n - 1;
  return { ...specialLevel(festivalPick(seed, k, world, n)), k, planet: p, boss };
}

// ---------- Mecánicas por mundo ----------
export const MECHANICS = ['lock', 'pack', 'ice', 'double', 'arrow', 'curtain', 'bomb', 'live', 'ticket', 'comet', 'turbo', 'ghost', 'ship', 'coin', 'cham', 'bolt', 'cst'];
const MECH_FIELD = { lock: 'lock', pack: 'pack', ice: 'ice', double: 'alt', arrow: 'arrow', curtain: 'curtain', bomb: 'bomb', live: 'live', ticket: 'half', comet: 'comet', turbo: 'turbo', ghost: 'ghost', ship: 'ship', coin: 'coin', cham: 'cham', bolt: 'bolt', cst: 'cst' };
// Van con su sorteo, fuera de chooseMechanics (si entraran, cambiarían todos los niveles ya probados).
const OWN_DRAW = ['ticket', 'ghost', 'ship', 'coin', 'cham', 'bolt', 'cst'];
// Mundo (índice desde 0) en el que se presenta cada una.
// 8 nov 2026: corridas para que cada estreno quede a 10 niveles o más del anterior (antes lock 1, pack 2, ice 4, double 7,
// arrow 11, curtain 15, bomb 19, live 24, ticket 20, comet 12, turbo 16, ghost 29, ship 34, coin 26, cham 32).
// 10 nov 2026: rayo 47, constelación 49 y escudo 52 (a 10 niveles o más de las festividades del 461 y de los asteroides
// del ROCAS_FROM).
export const MECH_INTRO = { lock: 1, pack: 2, ice: 6, double: 12, arrow: 17, curtain: 22, bomb: 27, live: 33, ticket: 28, comet: 19, turbo: 24, ghost: 39, ship: 44, coin: 36, cham: 42, bolt: 47, cst: 49 };
export const MECH_NAMES = {
  lock: 'Candado', pack: 'Carta regalo', ice: 'Hielo', double: 'Carta doble', arrow: 'Flecha', curtain: 'Cortina', bomb: 'Bomba', live: 'Carta viva', ticket: 'Boleto partido', comet: 'Cometa', turbo: 'Cohete turbo', ghost: 'Fantasma', ship: 'Nave ladrona', coin: 'Carta moneda', cham: 'Camaleón', bolt: 'Rayo', cst: 'Constelación',
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
