// Tipos de mundo: colores del planeta 3D, planetita 2D y la mesa donde se juega.
// Cada lugar de levels.js (Bosque, Isla, Volcán…) usa uno de estos tipos.
import { worldInfo } from './levels.js';
import { INK, tshape, CIRCLE, starPath, planetInner, setPlaceColors, marigold, icon } from './art.js';

const K = INK;

// Planeta: sea = altura del agua (−1 = sin agua), bands = colores por altura, prop = lo que crece.
export const BIOMES = {
  bosque: { emblem: ['#86cf5c', '#4d9f45', '#2f86c8'], table: 'wood', tint: '#1a1206',
    planet: { sea: 0.47, amp: 0.13, freq: 1.7, seed: 3, outline: 0x1d3a3a, glow: 0x9ff5c0, prop: 'round', path: '#fff3d6', bands: [[0, '#2f86c8'], [0.45, '#4fb6e0'], [0.48, '#f3dc94'], [0.52, '#86cf5c'], [0.66, '#4d9f45'], [0.8, '#8c7a62']] } },
  selva: { emblem: ['#4fae4a', '#2f8a3f', '#3aa0c8'], table: 'wood', tint: '#0d1608',
    planet: { sea: 0.42, amp: 0.14, freq: 1.8, seed: 7, outline: 0x123322, glow: 0x7ff0a0, prop: 'round', dense: 1.4, path: '#fff3d6', bands: [[0, '#1f7fb0'], [0.4, '#3aa0c8'], [0.43, '#e9d58a'], [0.46, '#4fae4a'], [0.6, '#2f8a3f'], [0.75, '#23692f']] } },
  pradera: { emblem: ['#a8e06a', '#7cc04f', '#ffd0e0'], table: 'wood', tint: '#1a1206',
    planet: { sea: 0.4, amp: 0.1, freq: 1.5, seed: 11, outline: 0x2a4a2a, glow: 0xd8ffb0, prop: 'round', dense: 0.6, path: '#fff3d6', bands: [[0, '#3a9ad8'], [0.38, '#62c0ea'], [0.41, '#f3e0a0'], [0.44, '#a8e06a'], [0.6, '#8fd45a'], [0.75, '#c9e88a']] } },
  pantano: { emblem: ['#7a8f4a', '#5f7a3a', '#3f6b4a'], table: 'wood', tint: '#0a120a',
    planet: { sea: 0.5, amp: 0.08, freq: 2.2, seed: 15, outline: 0x1a2a1a, glow: 0xb0e090, prop: 'round', dense: 0.8, path: '#f0e6c8', bands: [[0, '#3f6b4a'], [0.48, '#567d4f'], [0.52, '#7a8f4a'], [0.62, '#5f7a3a'], [0.75, '#4a6a35']] } },
  arrecife: { emblem: ['#38c2dd', '#1f8fc8', '#ffe2a0'], table: 'dock', tint: '#002a44',
    planet: { sea: 0.64, amp: 0.12, freq: 1.6, seed: 17, outline: 0x14365a, glow: 0x8fe8ff, prop: 'palm', dense: 0.35, path: '#fff3d6', bands: [[0, '#1d63ad'], [0.5, '#2a86cc'], [0.58, '#3fb0e0'], [0.62, '#7fe0ee'], [0.645, '#ffe2a0'], [0.68, '#8fd468']] } },
  desierto: { emblem: ['#f8d68e', '#e9a24f', '#5bb85a'], table: 'sand', tint: '#3a1400',
    planet: { sea: 0.3, amp: 0.15, freq: 2.1, seed: 31, outline: 0x5a2a12, glow: 0xffd28a, prop: 'cactus', dense: 0.5, path: '#fff3d6', bands: [[0, '#2aa6c9'], [0.29, '#6fd6dc'], [0.31, '#8fd468'], [0.34, '#f8d68e'], [0.5, '#f2bd6a'], [0.62, '#e9a24f'], [0.74, '#d98a3d']] } },
  canon: { emblem: ['#e98a5a', '#c4532f', '#6fd6dc'], table: 'sand', tint: '#3a0e00',
    planet: { sea: 0.25, amp: 0.2, freq: 2.0, seed: 35, outline: 0x4a1a0a, glow: 0xffb08a, prop: 'cactus', dense: 0.4, path: '#fff3d6', bands: [[0, '#2a9ac9'], [0.24, '#6fd6dc'], [0.27, '#e98a5a'], [0.45, '#d9693f'], [0.6, '#c4532f'], [0.72, '#f0a070']] } },
  volcan: { emblem: ['#5d4a5f', '#3a2d40', '#ff8a2a'], table: 'stone', tint: '#0a0510', lava: true,
    planet: { sea: 0.42, amp: 0.2, freq: 1.9, seed: 41, outline: 0x1c0f1f, glow: 0xff7a3a, prop: null, volcano: true, path: '#ffe0b0', bands: [[0, '#ff7a1f'], [0.4, '#ffb340'], [0.43, '#3f3346'], [0.55, '#54445c'], [0.68, '#6a5770'], [0.8, '#2f2536']] } },
  cueva: { emblem: ['#62567f', '#3a3150', '#b48cff'], table: 'stone', tint: '#06040e',
    planet: { sea: -1, amp: 0.12, freq: 2.4, seed: 45, outline: 0x140c24, glow: 0xb48cff, prop: 'crystal', path: '#e6dcff', bands: [[0, '#3a3150'], [0.45, '#4d4366'], [0.6, '#62567f'], [0.72, '#8a7cb0']] } },
  glaciar: { emblem: ['#eaf7ff', '#bfe0f4', '#6cc0ea'], table: 'wood', frost: true, tint: '#0b1a3a',
    planet: { sea: 0.44, amp: 0.16, freq: 1.9, seed: 21, outline: 0x22406a, glow: 0xcfefff, prop: 'pine', path: '#ffffff', bands: [[0, '#3e8fd0'], [0.42, '#6cc0ea'], [0.45, '#dff3ff'], [0.6, '#bfe0f4'], [0.72, '#f8fdff']] } },
  montana: { emblem: ['#a9a9bc', '#8a8a9e', '#86cf5c'], table: 'wood', tint: '#101420',
    planet: { sea: 0.4, amp: 0.3, freq: 1.8, seed: 25, outline: 0x22263a, glow: 0xdfe8ff, prop: 'pine', dense: 0.6, path: '#fff3d6', bands: [[0, '#2f86c8'], [0.38, '#4fb6e0'], [0.41, '#86cf5c'], [0.55, '#8a8a9e'], [0.68, '#a9a9bc'], [0.76, '#ffffff']] } },
  cielo: { emblem: ['#ffe3f1', '#c9ebff', '#fff4c9'], table: 'cloud', tint: '#1a2a5a',
    planet: { sea: 0.5, amp: 0.1, freq: 1.4, seed: 51, outline: 0x3a4a8a, glow: 0xffd0f0, prop: null, clouds: 9, path: '#fff3d6', bands: [[0, '#9fd8ff'], [0.48, '#c9ebff'], [0.52, '#ffffff'], [0.62, '#ffe3f1'], [0.72, '#fff4c9']] } },
};
// Planetas del evento del mes: los 5 son el mismo planeta (misma forma, colores y lo que crece) y solo cambia
// cuánta agua tiene (sea) y desde qué altura se pinta de naranja (orange): así se ven hermanos pero distintos.
const sameLook = (base, vary) => vary.map(([sea, orange, dense]) => {
  const [c] = base.colors;
  const bands = [[0, c[0]], [sea - 0.02, c[1]], [sea + 0.01, c[2]], [sea + 0.04, c[3]], [orange, c[4]], [orange + 0.14, c[5]]];
  return { emblem: base.emblem, planet: { ...base.planet, sea, dense, bands } };
});
export const EVENT_BIOMES = {
  muertos: sameLook(
    { emblem: ['#ff9c1a', '#7cc04f', '#4fc2c0'], colors: [['#2f8f9a', '#4fc2c0', '#ffe2a0', '#7cc04f', '#ff9c1a', '#ffb13d']],
      planet: { amp: 0.13, freq: 1.7, seed: 61, outline: 0x4a2a10, glow: 0xffb13d, prop: 'round', crown: '#ff8a1a', path: '#fff3d6' } },
    // [agua, naranja desde, cuántas flores]
    [[0.4, 0.56, 1.2], [0.32, 0.55, 1.4], [0.48, 0.53, 0.9], [0.38, 0.48, 1.3], [0.35, 0.45, 1.6]],
  ),
  // Navidad: pinos con punta nevada sobre pasto verde; la nieve (el "naranja" de sameLook) baja en cada planeta.
  navidad: sameLook(
    { emblem: ['#f2f8ff', '#4fa86a', '#5fa8e0'], colors: [['#2a5f9e', '#5fa8e0', '#e8f4ff', '#4fa86a', '#f2f8ff', '#ffffff']],
      planet: { amp: 0.16, freq: 1.8, seed: 83, outline: 0x14284a, glow: 0xbfe6ff, prop: 'pine', path: '#ffd6d6' } },
    // [agua, nieve desde, cuántos pinos]
    [[0.4, 0.6, 1.1], [0.34, 0.56, 1.3], [0.46, 0.53, 0.9], [0.38, 0.5, 1.4], [0.3, 0.44, 1.6]],
  ),
  // Primavera: pradera verde con árboles en flor (copa rosa) y lagos azules; las flores suben en cada planeta.
  primavera: sameLook(
    { emblem: ['#8fd46a', '#ffb0cc', '#4fb6e0'], colors: [['#2f86c8', '#5fc0f0', '#fff4c9', '#8fd46a', '#ffc2dc', '#ffe3f1']],
      planet: { amp: 0.14, freq: 1.7, seed: 101, outline: 0x1f4a2a, glow: 0xb9f0a0, prop: 'round', crown: '#ffb0cc', path: '#fff6ee' } },
    // [agua, flores desde, cuántos árboles]
    [[0.4, 0.66, 1.1], [0.34, 0.62, 1.3], [0.46, 0.58, 0.9], [0.38, 0.54, 1.4], [0.3, 0.5, 1.6]],
  ),
  // Amor y Amistad: praderas rosas con rosales y mares lila; el rosa fuerte sube en cada planeta.
  amor: sameLook(
    { emblem: ['#ff5f7e', '#ffb0cc', '#b36bff'], colors: [['#8a5cf0', '#b98cff', '#ffe3f1', '#ffb0cc', '#ff5f7e', '#ff8fb0']],
      planet: { amp: 0.13, freq: 1.8, seed: 97, outline: 0x4a1030, glow: 0xff9cc8, prop: 'round', crown: '#ff4f6e', path: '#fff6ee' } },
    // [agua, rosa fuerte desde, cuántos rosales]
    [[0.4, 0.6, 1.1], [0.34, 0.56, 1.3], [0.46, 0.52, 0.9], [0.38, 0.5, 1.4], [0.3, 0.45, 1.6]],
  ),
  // Día de Reyes: desierto de arena con oasis y palmeras; las dunas doradas suben en cada planeta.
  reyes: sameLook(
    { emblem: ['#ffc83d', '#e8b56f', '#4fb6e0'], colors: [['#2f86c8', '#4fb6e0', '#fff1c9', '#e8b56f', '#ffc83d', '#ffe08a']],
      planet: { amp: 0.15, freq: 1.6, seed: 89, outline: 0x4a2a10, glow: 0xffd27a, prop: 'palm', path: '#fff3d6' } },
    // [agua, dorado desde, cuántas palmeras]
    [[0.42, 0.62, 0.9], [0.36, 0.57, 1.1], [0.32, 0.53, 0.8], [0.38, 0.5, 1.2], [0.28, 0.46, 1]],
  ),
  // Verano: islas de playa con palmeras y mar turquesa; el verde de la selva sube en cada planeta.
  verano: sameLook(
    { emblem: ['#38c2dd', '#1f8fc8', '#f6d98e'], colors: [['#1f8fc8', '#38c2dd', '#fff1c9', '#f6d98e', '#6fc25a', '#4fa84a']],
      planet: { amp: 0.13, freq: 1.6, seed: 113, outline: 0x14365a, glow: 0x8fe8ff, prop: 'palm', path: '#fff3d6' } },
    // [agua, verde desde, cuántas palmeras]
    [[0.46, 0.62, 0.9], [0.4, 0.58, 1.1], [0.5, 0.6, 0.8], [0.42, 0.54, 1.2], [0.36, 0.5, 1.1]],
  ),
  // Fiestas Patrias: campos verdes con nopales, montañas rojas y cumbres blancas (los tres colores); el rojo sube en cada planeta.
  patrias: sameLook(
    { emblem: ['#47c27a', '#2f9e5c', '#e8434f'], colors: [['#2f86c8', '#4fb6e0', '#fff1c9', '#4fae4a', '#e8434f', '#fff6ee']],
      planet: { amp: 0.15, freq: 1.8, seed: 127, outline: 0x1f3a1a, glow: 0xb8f0a0, prop: 'cactus', path: '#fff3d6' } },
    // [agua, rojo desde, cuántos nopales]
    [[0.46, 0.64, 0.7], [0.42, 0.62, 0.9], [0.5, 0.64, 0.6], [0.44, 0.58, 1], [0.4, 0.55, 0.9]],
  ),
  // Festividad: Día de la Candelaria (3 planetas). Milpas verdes con árboles dorados como mazorcas; el dorado sube en cada planeta.
  candelaria: sameLook(
    { emblem: ['#f2c94a', '#6fae3a', '#4fb6e0'], colors: [['#2f86c8', '#4fb6e0', '#fff1c9', '#6fae3a', '#f2c94a', '#ffe08a']],
      planet: { amp: 0.14, freq: 1.7, seed: 151, outline: 0x3a2a10, glow: 0xffe08a, prop: 'round', crown: '#f2c94a', path: '#fff6e0' } },
    // [agua, dorado desde, cuántas matas]
    [[0.42, 0.62, 1.1], [0.36, 0.56, 1.3], [0.3, 0.5, 1.5]],
  ),
  // Festividad: Día del Taco (3 planetas). Campos verdes con nopales y cerros naranjas como salsa; el naranja sube en cada planeta.
  taco: sameLook(
    { emblem: ['#e8853e', '#7cc04f', '#4fb6e0'], colors: [['#2f86c8', '#4fb6e0', '#fff1c9', '#7cc04f', '#e8853e', '#e8434f']],
      planet: { amp: 0.15, freq: 1.8, seed: 163, outline: 0x3a1a0a, glow: 0xffb066, prop: 'cactus', path: '#fff6e0' } },
    // [agua, naranja desde, cuántos nopales]
    [[0.42, 0.62, 0.8], [0.36, 0.56, 1], [0.3, 0.5, 1.1]],
  ),
  // Festividad: Día de la Tierra (3 planetas). Mucha agua limpia y bosques; el verde oscuro del bosque sube en cada planeta.
  tierra: sameLook(
    { emblem: ['#6fc25a', '#3f9a4a', '#4aa8de'], colors: [['#2f86c8', '#4aa8de', '#fff1c9', '#8fd46a', '#3f9a4a', '#2f7a3a']],
      planet: { amp: 0.14, freq: 1.7, seed: 173, outline: 0x14361a, glow: 0x9be8a0, prop: 'pine', path: '#fff6e0' } },
    // [agua, bosque desde, cuántos árboles]
    [[0.5, 0.64, 1.2], [0.56, 0.66, 1], [0.44, 0.58, 1.5]],
  ),
  // Festividad: Día del Niño (3 planetas). Colores de feria: árboles de algodón de azúcar y cerros amarillos que suben en cada planeta.
  nino: sameLook(
    { emblem: ['#ff9cc8', '#7fd6ff', '#ffc83d'], colors: [['#3fa0e0', '#7fd6ff', '#fff1c9', '#8fd46a', '#ffc83d', '#ffe08a']],
      planet: { amp: 0.14, freq: 1.8, seed: 181, outline: 0x3a1a4a, glow: 0xff9cc8, prop: 'round', crown: '#ff9cc8', path: '#fff6ee' } },
    // [agua, amarillo desde, cuántos árboles]
    [[0.42, 0.64, 1.1], [0.36, 0.58, 1.3], [0.32, 0.52, 1.5]],
  ),
  // Festividad: Día de las Madres (3 planetas). Jardines de árboles en flor rosa y cerros fucsia que suben en cada planeta.
  madres: sameLook(
    { emblem: ['#ff7aa6', '#ffb3cb', '#8fd46a'], colors: [['#3f8ad8', '#7fc4f0', '#fff1e6', '#8fd46a', '#ff7aa6', '#ffb3cb']],
      planet: { amp: 0.13, freq: 1.7, seed: 191, outline: 0x4a1030, glow: 0xffb3cb, prop: 'round', crown: '#ff7aa6', path: '#fff6f0' } },
    // [agua, fucsia desde, cuántos árboles]
    [[0.4, 0.62, 1.2], [0.34, 0.56, 1.4], [0.3, 0.5, 1.6]],
  ),
  // Festividad: Día del Padre (3 planetas). Lagos de pesca entre pinos; el bosque oscuro sube en cada planeta.
  padre: sameLook(
    { emblem: ['#4aa8de', '#5fae5a', '#ffc83d'], colors: [['#2a6fb8', '#5fb0e8', '#f0e2b8', '#7fc46a', '#4a8a4a', '#3a6f42']],
      planet: { amp: 0.15, freq: 1.7, seed: 203, outline: 0x10284a, glow: 0x9fd0ff, prop: 'pine', path: '#fff3d6' } },
    // [agua, bosque desde, cuántos pinos]
    [[0.46, 0.64, 1.1], [0.4, 0.58, 1.3], [0.34, 0.52, 1.5]],
  ),
  // Festividad: Día del Gato (3 planetas). Pasto de hierba gatera con flores rosas y cerros lila que suben en cada planeta.
  gato: sameLook(
    { emblem: ['#b48cff', '#9ad46a', '#ff9cc8'], colors: [['#3a5fb8', '#6f9be8', '#f0e2c8', '#9ad46a', '#c9a6e8', '#e8d8ff']],
      planet: { amp: 0.14, freq: 1.8, seed: 211, outline: 0x2a1a4a, glow: 0xc9a6ff, prop: 'round', crown: '#ff9cc8', path: '#fff6ee' } },
    // [agua, lila desde, cuántos árboles]
    [[0.4, 0.62, 1.1], [0.34, 0.56, 1.3], [0.3, 0.5, 1.5]],
  ),
  // Festividad: Día del Perro (3 planetas). Parques de pasto con árboles de copa verde y caminos de tierra naranja que suben.
  perro: sameLook(
    { emblem: ['#ff9c5b', '#7fc46a', '#fff6e6'], colors: [['#2f86c8', '#5fc0f0', '#f6e0b8', '#7fc46a', '#e8a35a', '#f6c890']],
      planet: { amp: 0.13, freq: 1.7, seed: 223, outline: 0x3a200a, glow: 0xffc890, prop: 'round', crown: '#5fae5a', path: '#fff6e6' } },
    // [agua, tierra desde, cuántos árboles]
    [[0.42, 0.64, 1.2], [0.36, 0.58, 1.4], [0.3, 0.52, 1.6]],
  ),
  // Halloween: mares morados, huertos de calabaza naranjas y árboles otoñales; el naranja sube en cada planeta.
  halloween: sameLook(
    { emblem: ['#5a2f9a', '#3a1a6a', '#ff8a1a'], colors: [['#3a1a6a', '#6a3fb0', '#c9b0e8', '#4a6a3a', '#ff8a1a', '#ffb13d']],
      planet: { amp: 0.14, freq: 1.8, seed: 139, outline: 0x1a0a2a, glow: 0xb36bff, prop: 'round', crown: '#ff6a1a', path: '#f0e0ff' } },
    // [agua, naranja desde, cuántos árboles]
    [[0.44, 0.6, 1], [0.38, 0.56, 1.2], [0.48, 0.6, 0.9], [0.42, 0.52, 1.3], [0.36, 0.48, 1.4]],
  ),
};
// Planetas guardados para los mundos normales (aún sin lugar asignado): papel picado, velas, alebrijes y Mictlán.
export const SPARE_BIOMES = {
  papelpicado: { emblem: ['#ff5fa8', '#e8438f', '#7b2fbf'],
    planet: { sea: 0.45, amp: 0.13, freq: 1.8, seed: 65, outline: 0x3a0f4a, glow: 0xff7ab8, prop: 'round', crown: '#5fd1c5', dense: 0.8, path: '#fff3d6', bands: [[0, '#7b2fbf'], [0.43, '#9a4ad8'], [0.46, '#ffd6ec'], [0.5, '#ff5fa8'], [0.62, '#e8438f'], [0.74, '#ffc83d']] } },
  velas: { emblem: ['#a8744a', '#6e4a3a', '#ffd27a'],
    planet: { sea: 0.42, amp: 0.14, freq: 1.9, seed: 69, outline: 0x2a1030, glow: 0xffb13d, prop: 'candle', path: '#ffe0b0', bands: [[0, '#3a1a5a'], [0.4, '#5a2a80'], [0.44, '#6e4a3a'], [0.52, '#8a5a3a'], [0.66, '#a8744a'], [0.78, '#ffd27a']] } },
  alebrijes: { emblem: ['#ff5fa8', '#b36bff', '#5fd1c5'],
    planet: { sea: 0.4, amp: 0.15, freq: 2.0, seed: 73, outline: 0x2a1f5c, glow: 0x5fd1c5, prop: 'crystal', path: '#fff3d6', bands: [[0, '#1fa6c9'], [0.38, '#5fd1c5'], [0.41, '#ffc83d'], [0.48, '#ff5fa8'], [0.58, '#b36bff'], [0.68, '#5fd1c5'], [0.78, '#ffc83d']] } },
  mictlan: { emblem: ['#3e2366', '#1a0f2e', '#ff8a1a'],
    planet: { sea: -1, amp: 0.13, freq: 2.2, seed: 77, outline: 0x0a0414, glow: 0xff8a1a, prop: 'candle', path: '#ffb13d', bands: [[0, '#1a0f2e'], [0.45, '#2a1848'], [0.58, '#3e2366'], [0.7, '#ff8a1a']] } },
};
// Planeta gris de los mundos bloqueados (todos iguales).
export const LOCKED = { sea: -1, amp: 0.1, freq: 2.6, seed: 5, outline: 0x2a1f5c, glow: null, prop: null, bands: [[0, '#6f6c80'], [0.4, '#8a879a'], [0.55, '#a3a0b2'], [0.7, '#b9b6c6']] };

const PLACE_BIOME = {
  Bosque: 'bosque', Valle: 'pradera', Isla: 'arrecife', Castillo: 'montana', Pantano: 'pantano', Desierto: 'desierto',
  Arrecife: 'arrecife', Montaña: 'montana', Pradera: 'pradera', Cueva: 'cueva', Jardín: 'pradera', Puerto: 'arrecife',
  Glaciar: 'glaciar', Volcán: 'volcan', Lago: 'bosque', Ciudad: 'cielo', Selva: 'selva', Cañón: 'canon',
  Cielo: 'cielo', Granja: 'pradera', Pueblo: 'bosque', Templo: 'selva', Mina: 'cueva', Feria: 'cielo',
};
export const biomeKey = (place) => PLACE_BIOME[place] || 'bosque';
export const biomeOf = (w) => BIOMES[biomeKey(worldInfo(w).place)];
setPlaceColors((place) => BIOMES[biomeKey(place)].emblem);

// ======================================================================
// Mesas: fondo plano (patrón) + objetos del mundo en las esquinas.
// Más oscuras que la escena para que cartas y botones resalten; sin animación.
// ======================================================================
const enc = (s) => `url('data:image/svg+xml,${encodeURIComponent(s)}')`;
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function planksTile({ colors, seam, hl, grain, nails, W = 800, h = 68 }) {
  const r = rng(colors.length * 7 + h), H = h * 6;
  let s = '';
  for (let i = 0; i < 6; i++) {
    const y = i * h;
    s += `<rect y="${y}" width="${W}" height="${h}" fill="${colors[i % colors.length]}"/><rect y="${y + 2}" width="${W}" height="4" fill="${hl}" opacity=".5"/>`;
    for (let k = 0; k < 4; k++) { const gx = r() * W, gy = y + 14 + r() * (h - 28), w = 60 + r() * 140; s += `<path d="M${gx} ${gy}c${w * 0.3} ${-6 + r() * 4} ${w * 0.6} ${4 + r() * 4} ${w} 0" stroke="${grain}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>`; }
    if (r() > 0.4) { const kx = 60 + r() * (W - 120), ky = y + h / 2; s += `<ellipse cx="${kx}" cy="${ky}" rx="9" ry="5" fill="${grain}" stroke="${seam}" stroke-width="1.6"/><ellipse cx="${kx}" cy="${ky}" rx="17" ry="9" fill="none" stroke="${grain}" stroke-width="2" opacity=".6"/>`; }
    const cut = 100 + r() * (W - 200);
    s += `<path d="M${cut} ${y}v${h}" stroke="${seam}" stroke-width="2.6"/>`;
    if (nails) for (const [dx, dy] of [[-12, 12], [-12, h - 12], [12, 12], [12, h - 12]]) s += `<circle cx="${cut + dx}" cy="${y + dy}" r="2.6" fill="${seam}"/>`;
    s += `<rect y="${y + h - 3}" width="${W}" height="${nails ? 5 : 3}" fill="${seam}"/>`;
  }
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
function sandTile({ cols, grout, line, crack }) {
  const W = 392, H = 208, r = rng(5);
  let s = `<rect width="${W}" height="${H}" fill="${grout}"/>`;
  for (let row = 0; row < 2; row++) for (let c = -1; c < 2; c++) {
    const x = c * 196 + (row % 2) * 98 + 4, y = row * 104 + 4, col = cols[(row * 2 + c + 4) % cols.length];
    s += `<rect x="${x}" y="${y}" width="188" height="96" rx="12" fill="${col}"/><rect x="${x + 4}" y="${y + 3}" width="180" height="5" rx="2.5" fill="#fff3d0" opacity=".5"/><path d="M${x + 8} ${y + 92}h172" stroke="${line}" stroke-width="5" stroke-linecap="round"/>`;
    if (r() > 0.45) { const cx = x + 30 + r() * 110, cy = y + 30 + r() * 40; s += `<path d="M${cx} ${cy}l10 6 6 -4 12 8" stroke="${crack}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`; }
  }
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
function stoneTile({ tones, seam, lava }) {
  const W = 600, H = 400;
  const slabs = ['M0 0H300L280 130 0 150z', 'M300 0H600V140L280 130z', 'M0 150 280 130 300 270 0 290z', 'M280 130 600 140V280L300 270z', 'M0 290 300 270 310 400H0z', 'M300 270 600 280V400H310z'];
  let s = slabs.map((d, i) => `<path d="${d}" fill="${tones[i % tones.length]}" stroke="${seam}" stroke-width="5" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="2" transform="translate(1.5 1.5)"/>`).join('');
  const r = rng(9);
  for (let i = 0; i < 26; i++) s += `<circle cx="${r() * W}" cy="${r() * H}" r="${1 + r() * 2.5}" fill="#000" opacity=".12"/>`;
  if (lava) s += ['M300 0 292 40 304 70 286 130', 'M0 290 60 286 90 300 140 284'].map((d) => `<path d="${d}" fill="none" stroke="#ff6a1f" stroke-width="3" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#ffd36b" stroke-width="1.2" stroke-linecap="round"/>`).join('');
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
function cloudTile() {
  const W = 420, H = 300, r = rng(3);
  let s = `<rect width="${W}" height="${H}" fill="#b9c8f2"/>`;
  for (let i = 0; i < 7; i++) { const x = r() * W, y = r() * H, w = 50 + r() * 60; s += `<g opacity=".55"><ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * 0.32}" fill="#d9e2ff"/><ellipse cx="${x + w * 0.3}" cy="${y - w * 0.15}" rx="${w * 0.5}" ry="${w * 0.3}" fill="#d9e2ff"/></g>`; }
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel de ofrenda (evento de Día de Muertos): morado oscuro con bordado de florecitas y pétalos de cempasúchil sueltos.
function mantelTile() {
  const W = 360, H = 360, r = rng(11);
  let s = `<rect width="${W}" height="${H}" fill="#3e1650"/>`;
  for (let y = 0; y < H; y += 60) s += `<path d="M0 ${y + 30}h${W}" stroke="#4d1d62" stroke-width="18"/>`;
  for (let y = 0; y < H; y += 60) for (let x = (y / 60) % 2 ? 30 : 0; x < W; x += 60) {
    const c = ['#ff5fa8', '#ffb13d', '#5fd1c5'][((x + y) / 30) % 3];
    s += `<g transform="translate(${x} ${y})" opacity=".55">${[0, 90, 180, 270].map((a) => `<ellipse cx="0" cy="-6" rx="3.2" ry="5.5" fill="${c}" transform="rotate(${a})"/>`).join('')}<circle r="2.4" fill="#fff3d6"/></g>`;
  }
  for (let i = 0; i < 14; i++) s += `<ellipse cx="${(r() * W).toFixed(1)}" cy="${(r() * H).toFixed(1)}" rx="4" ry="2.6" fill="#ff9c1a" opacity=".7" transform="rotate(${(r() * 180).toFixed(0)} ${(r() * W).toFixed(1)} ${(r() * H).toFixed(1)})"/>`;
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel de Navidad: rojo tejido, con filas de pinitos y copos (como suéter navideño).
function mantelNavidadTile() {
  const W = 360, H = 240;
  let s = `<rect width="${W}" height="${H}" fill="#a51f30"/>`;
  for (const y of [18, 222]) s += `<path d="M0 ${y}h${W}" stroke="#fff3d6" stroke-width="6" stroke-dasharray="8 8" opacity=".5"/>`;
  for (let x = 0; x < W; x += 45) s += `<path d="M${x + 22} 40l-14 26h8l-12 22h36l-12-22h8z" fill="#2f7a42" opacity=".3"/>`;
  for (let x = 0; x < W; x += 60) for (const [y, dx] of [[136, 0], [186, 30]]) {
    const cx = x + 30 + dx;
    s += `<g stroke="#fff3d6" stroke-width="3" stroke-linecap="round" opacity=".5">${[0, 60, 120].map((a) => `<path d="M${cx} ${y - 11}v22" transform="rotate(${a} ${cx} ${y})"/>`).join('')}</g>`;
  }
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel de Día de Reyes: terciopelo morado con estrellitas doradas y una greca dorada.
function mantelReyesTile() {
  const W = 300, H = 300;
  let s = `<rect width="${W}" height="${H}" fill="#3a1a6a"/>`;
  for (let y = 0; y < H; y += 50) s += `<path d="M0 ${y + 25}h${W}" stroke="#42207a" stroke-width="14"/>`;
  for (let y = 0; y < H; y += 75) for (let x = (y / 75) % 2 ? 37 : 0; x < W; x += 75) s += `<path d="${starPath(x + 18, y + 18, 7, 3)}" fill="#ffc83d" opacity=".45"/>`;
  s += `<path d="M0 150h${W}" stroke="#ffc83d" stroke-width="3" stroke-dasharray="10 6" opacity=".35"/>`;
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel de Amor y Amistad: rosa con corazoncitos de encaje blanco y una orilla de puntitos.
function mantelAmorTile() {
  const W = 240, H = 240, hrt = (x, y, k) => `M${x} ${y + 7 * k}C${x - 11 * k} ${y} ${x - 7 * k} ${y - 8 * k} ${x} ${y - 3 * k}C${x + 7 * k} ${y - 8 * k} ${x + 11 * k} ${y} ${x} ${y + 7 * k}z`;
  let s = `<rect width="${W}" height="${H}" fill="#e8559a"/>`;
  for (let y = 0; y < H; y += 60) for (let x = (y / 60) % 2 ? 30 : 0; x < W; x += 60) s += `<path d="${hrt(x + 15, y + 15, 1.1)}" fill="none" stroke="#fff0f6" stroke-width="2.4" opacity=".5"/><circle cx="${x + 15}" cy="${y + 15}" r="2" fill="#fff0f6" opacity=".5"/>`;
  s += `<path d="M0 120h${W}" stroke="#fff0f6" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round" opacity=".45"/>`;
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel de Primavera: cuadros de picnic verde y blanco, con florecitas.
function mantelPrimaveraTile() {
  const W = 240, H = 240;
  let s = `<rect width="${W}" height="${H}" fill="#e9f7dc"/>`;
  for (let x = 0; x < W; x += 40) s += `<rect x="${x}" y="0" width="20" height="${H}" fill="#7cc04f" opacity=".45"/>`;
  for (let y = 0; y < H; y += 40) s += `<rect x="0" y="${y}" width="${W}" height="20" fill="#7cc04f" opacity=".45"/>`;
  for (const [x, y, c] of [[30, 30, '#ff7ab8'], [150, 110, '#ffc83d'], [90, 190, '#b36bff'], [210, 30, '#fff']]) s += `<g opacity=".8">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${x}" cy="${y - 5}" rx="3.4" ry="5" fill="${c}" transform="rotate(${a} ${x} ${y})"/>`).join('')}<circle cx="${x}" cy="${y}" r="2.6" fill="#ff9c1a"/></g>`;
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel de Verano: toalla de playa a rayas turquesa, blanco, amarillo y coral.
function mantelVeranoTile() {
  const W = 240, H = 240, cols = ['#1f9fc8', '#fff6e6', '#ffc83d', '#fff6e6', '#ff7a6a', '#fff6e6'];
  let s = '';
  for (let i = 0; i < 6; i++) s += `<rect x="${i * 40}" width="40" height="${H}" fill="${cols[i]}" opacity="${i % 2 ? 0.9 : 1}"/>`;
  s += `<rect width="${W}" height="${H}" fill="#0a3a5a" opacity=".35"/>`;
  for (let i = 0; i < 6; i++) s += `<path d="M${i * 40 + 20} 0v${H}" stroke="#fff" stroke-width="2" stroke-dasharray="3 9" opacity=".25"/>`;
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel de Fiestas Patrias: sarape de rayas de colores con líneas finas y una franja de rombos.
function mantelPatriasTile() {
  const W = 120, H = 240, bands = [['#e8438f', 34], ['#ff9c1a', 16], ['#ffc83d', 10], ['#2f9e5c', 30], ['#fff6e6', 6], ['#1fa6c9', 22], ['#7b2fbf', 14], ['#e8434f', 40], ['#ffc83d', 8], ['#2f9e5c', 18], ['#fff6e6', 6], ['#ff9c1a', 46]];
  let s = '', y = 0;
  for (const [c, h] of bands) (s += `<rect y="${y}" width="${W}" height="${h}" fill="${c}"/><rect y="${y + h - 1.5}" width="${W}" height="1.5" fill="#2a1f5c" opacity=".35"/>`), (y += h);
  for (let x = 0; x < W; x += 20) s += `<path d="M${x} 109l10-8 10 8-10 8z" fill="#fff6e6" opacity=".7"/>`;
  s += `<rect width="${W}" height="${H}" fill="#1a0a20" opacity=".35"/>`;
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel de Halloween: morado oscuro con telarañas en las esquinas y estrellitas naranjas.
function mantelHalloweenTile() {
  const W = 240, H = 240;
  let s = `<rect width="${W}" height="${H}" fill="#2a1640"/>`;
  const web = (x, y, a0) => {
    let d = '';
    for (let i = 0; i <= 4; i++) { const a = ((a0 + i * 22.5) * Math.PI) / 180; d += `M${x} ${y}L${(x + Math.cos(a) * 70).toFixed(1)} ${(y + Math.sin(a) * 70).toFixed(1)}`; }
    for (const r of [22, 40, 58]) for (let i = 0; i < 4; i++) { const a = ((a0 + i * 22.5) * Math.PI) / 180, b = ((a0 + (i + 1) * 22.5) * Math.PI) / 180, m = (a + b) / 2; d += `M${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)}Q${(x + Math.cos(m) * r * 0.86).toFixed(1)} ${(y + Math.sin(m) * r * 0.86).toFixed(1)} ${(x + Math.cos(b) * r).toFixed(1)} ${(y + Math.sin(b) * r).toFixed(1)}`; }
    return `<path d="${d}" fill="none" stroke="#7a5aaa" stroke-width="1.6" opacity=".55"/>`;
  };
  s += web(0, 0, 0) + web(240, 240, 180) + web(240, 0, 90);
  for (const [x, y] of [[60, 150], [150, 70], [190, 180], [100, 220], [30, 90]]) s += `<path d="${starPath(x, y, 4, 1.8)}" fill="#ff8a1a" opacity=".5"/>`;
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel de la Candelaria: servilleta crema bordada con florecitas rojas, verdes y amarillas en hileras.
function mantelCandelariaTile() {
  const W = 120, H = 120;
  let s = `<rect width="${W}" height="${H}" fill="#f4e6c8"/>`;
  for (const y of [0, 60]) s += `<path d="M0 ${y + 2}h${W}M0 ${y + 58}h${W}" stroke="#e8434f" stroke-width="2" stroke-dasharray="4 3" opacity=".6"/>`;
  const flor = (x, y, c) => `${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${x}" cy="${y - 5}" rx="2.6" ry="4.4" fill="${c}" transform="rotate(${a} ${x} ${y})"/>`).join('')}<circle cx="${x}" cy="${y}" r="2.4" fill="#ffc83d"/>`;
  [[30, 30, '#e8434f'], [90, 30, '#2f9e5c'], [60, 90, '#e8434f'], [0, 90, '#ff9c1a'], [120, 90, '#ff9c1a']].forEach(([x, y, c]) => (s += flor(x, y, c)));
  s += `<path d="M30 42v10M90 42v10M60 102v10" stroke="#2f9e5c" stroke-width="2"/>`;
  s += `<rect width="${W}" height="${H}" fill="#2a1408" opacity=".38"/>`;
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel del Día del Taco: hule de cuadros rojos y blancos, como en la taquería.
function mantelTacoTile() {
  const W = 80, H = 80;
  let s = `<rect width="${W}" height="${H}" fill="#fff6ee"/>`;
  s += `<rect width="${W}" height="40" fill="#e8434f" opacity=".55"/><rect width="40" height="${H}" fill="#e8434f" opacity=".55"/>`;
  s += `<path d="M0 20h${W}M0 60h${W}M20 0v${H}M60 0v${H}" stroke="#fff" stroke-width="2" opacity=".35"/>`;
  s += `<rect width="${W}" height="${H}" fill="#2a0a08" opacity=".4"/>`;
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel del Día de la Tierra: pasto con florecitas y tréboles.
function mantelTierraTile() {
  const W = 120, H = 120;
  let s = `<rect width="${W}" height="${H}" fill="#5fae4a"/>`;
  for (const [x, y] of [[10, 14], [40, 30], [76, 12], [100, 44], [22, 60], [60, 70], [94, 90], [30, 100], [70, 108], [8, 84]]) s += `<path d="M${x} ${y}l-3 -9M${x} ${y}l1 -10M${x} ${y}l4 -8" stroke="#4a9a3a" stroke-width="2" stroke-linecap="round"/>`;
  const flor = (x, y, c) => `${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${x}" cy="${y - 4}" rx="2.4" ry="3.8" fill="${c}" transform="rotate(${a} ${x} ${y})"/>`).join('')}<circle cx="${x}" cy="${y}" r="2" fill="#ffc83d"/>`;
  [[30, 40, '#fff6ee'], [90, 70, '#ff9cc8'], [56, 20, '#fff6ee'], [14, 104, '#ff9cc8'], [104, 112, '#fff6ee']].forEach(([x, y, c]) => (s += flor(x, y, c)));
  s += `<rect width="${W}" height="${H}" fill="#06200a" opacity=".42"/>`;
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel del Día del Niño: azul clarito de fiesta con confeti de colores y serpentinas.
function mantelNinoTile() {
  const W = 120, H = 120, C = ['#ff5f7e', '#ffc83d', '#47c27a', '#b36bff', '#ff9c5b', '#4aa8de'];
  let s = `<rect width="${W}" height="${H}" fill="#9fdcf5"/>`;
  [[12, 18, 20], [44, 8, -30], [80, 22, 45], [104, 6, 10], [24, 50, -15], [62, 44, 60], [96, 58, -40], [10, 86, 30], [48, 80, -60], [84, 92, 15], [30, 110, 50], [70, 112, -20], [110, 100, 70]].forEach(([x, y, a], i) => (s += `<rect x="${x - 3}" y="${y - 1.6}" width="6" height="3.2" rx="1" fill="${C[i % C.length]}" transform="rotate(${a} ${x} ${y})"/>`));
  s += `<path d="M0 66q15-10 30 0t30 0 30 0 30 0" fill="none" stroke="#ff7ab8" stroke-width="2.4" opacity=".7"/>`;
  s += `<rect width="${W}" height="${H}" fill="#0a1030" opacity=".45"/>`;
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel del Día del Padre: cuadros azules de día de campo.
function mantelPadreTile() {
  const W = 120, H = 120;
  let s = `<rect width="${W}" height="${H}" fill="#e6f2fb"/>`;
  [10, 50, 90].forEach((v) => (s += `<rect x="${v}" width="20" height="${H}" fill="#4a8fd0" opacity=".55"/><rect y="${v}" width="${W}" height="20" fill="#4a8fd0" opacity=".55"/>`));
  s += `<path d="M0 60h120M60 0v120" stroke="#fff" stroke-width="1.4" stroke-dasharray="3 4" opacity=".7"/>`;
  s += `<rect width="${W}" height="${H}" fill="#06122a" opacity=".55"/>`;
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel del Día del Gato: cojín lila con huellitas.
function mantelGatoTile() {
  const W = 120, H = 120;
  let s = `<rect width="${W}" height="${H}" fill="#d8c6f5"/>`;
  const paw = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})" fill="#a98ae0"><ellipse cy="3" rx="5" ry="4.2"/>${[[-5.4, -3.4], [-1.8, -6.2], [1.8, -6.2], [5.4, -3.4]].map(([a2, b]) => `<circle cx="${a2}" cy="${b}" r="1.9"/>`).join('')}</g>`;
  [[24, 26, -20], [42, 50, -10], [84, 80, 15], [100, 104, 25], [90, 20, 40], [20, 92, -35]].forEach(([x, y, a]) => (s += paw(x, y, a)));
  s += `<rect width="${W}" height="${H}" fill="#140a2a" opacity=".55"/>`;
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel del Día del Perro: cobija naranja a rayas con huesitos.
function mantelPerroTile() {
  const W = 120, H = 120;
  let s = `<rect width="${W}" height="${H}" fill="#f6c890"/>`;
  [0, 60].forEach((y) => (s += `<rect y="${y + 22}" width="${W}" height="16" fill="#e8853e" opacity=".6"/><rect y="${y + 26}" width="${W}" height="3" fill="#fff6e6" opacity=".7"/>`));
  const bone = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})" fill="#fff6e6"><rect x="-7" y="-2" width="14" height="4" rx="1"/>${[[-7, -2.4], [-7, 2.4], [7, -2.4], [7, 2.4]].map(([a2, b]) => `<circle cx="${a2}" cy="${b}" r="2.6"/>`).join('')}</g>`;
  [[30, 10, -20], [90, 50, 25], [30, 70, 15], [90, 110, -30]].forEach(([x, y, a]) => (s += bone(x, y, a)));
  s += `<rect width="${W}" height="${H}" fill="#1a0c04" opacity=".55"/>`;
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
// Mantel del Día de las Madres: rosa clarito con florecitas y su orilla de encaje.
function mantelMadresTile() {
  const W = 120, H = 120;
  let s = `<rect width="${W}" height="${H}" fill="#ffc2d6"/>`;
  s += `<path d="M0 60h120M60 0v120" stroke="#fff0f6" stroke-width="2" stroke-dasharray="3 5"/>`;
  const flor = (x, y, c) => `${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${x}" cy="${y - 4}" rx="2.6" ry="4" fill="${c}" transform="rotate(${a} ${x} ${y})"/>`).join('')}<circle cx="${x}" cy="${y}" r="2.1" fill="#ffc83d"/>`;
  [[30, 30, '#ff5f8f'], [90, 90, '#ff5f8f'], [90, 30, '#fff6ee'], [30, 90, '#fff6ee']].forEach(([x, y, c]) => (s += flor(x, y, c)));
  [[60, 60], [0, 0], [120, 0], [0, 120], [120, 120]].forEach(([x, y]) => (s += `<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="#fff0f6" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="2" fill="#fff0f6"/>`));
  s += `<rect width="${W}" height="${H}" fill="#2a0618" opacity=".5"/>`;
  return { url: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), w: W, h: H };
}
const TILE_CACHE = {};
function tableTile(key) {
  if (TILE_CACHE[key]) return TILE_CACHE[key];
  const b = BIOMES[key];
  let t;
  if (b.table === 'sand') t = key === 'canon' ? sandTile({ cols: ['#e9a07a', '#e0926a', '#eeab85'], grout: '#9a4a2a', line: '#c97a52', crack: '#b8673f' }) : sandTile({ cols: ['#f0c27e', '#e8b56f', '#f3c98a', '#ebbb75'], grout: '#a8693a', line: '#d59a55', crack: '#c98b4f' });
  else if (b.table === 'dock') t = planksTile({ colors: ['#7fb6c2', '#73aab7', '#86bdc8', '#79b0bd'], seam: '#1d5878', hl: '#b5e0e8', grain: '#5f97a6', nails: true });
  else if (b.table === 'stone') t = stoneTile(key === 'cueva' ? { tones: ['#463d5e', '#4f466a', '#423958'], seam: '#231c33' } : { tones: ['#4a4152', '#544a5c', '#463d4e', '#504656'], seam: '#2a2230', lava: true });
  else if (b.table === 'cloud') t = cloudTile();
  else if (key === 'pantano') t = planksTile({ colors: ['#8a7a52', '#7f704a', '#938357'], seam: '#3a3018', hl: '#b0a070', grain: '#6a5c38' });
  else if (key === 'glaciar' || key === 'montana') t = planksTile({ colors: ['#c98a57', '#bf7e4b', '#d0935f', '#c4834f', '#cb8c58', '#bd7c49'], seam: '#5c2f1c', hl: '#e3a874', grain: '#a86a40' });
  else t = planksTile({ colors: ['#b97a48', '#ad6f3f', '#c08250', '#b4764a'], seam: '#4f2816', hl: '#d8996a', grain: '#94582f' });
  return (TILE_CACHE[key] = t);
}

// ---------- objetos de mesa (cada uno en su SVG, centrado en 0,0) ----------
const T = (x, y, a = 0, s = 1) => `transform="translate(${x} ${y}) rotate(${a}) scale(${s})"`;
const tt = (d, base, shade, inside = '', sw = 2.6) => tshape(d, base, shade, inside, sw, [-3, -4]);
const circ = (r) => CIRCLE(0, 0, r);
const ELLd = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`;
const drop = (d, dx = 6, dy = 9) => `<path d="${d}" fill="#000" opacity=".3" transform="translate(${dx} ${dy})" filter="url(#pb)"/>`;
const P = {
  mug: (c = ['#ff6f8e', '#d94a6a', '#ff8fa6']) => `${drop(circ(36))}<path d="M28 -6h12a11 11 0 0 1 0 22H28" fill="none" stroke="${K}" stroke-width="11"/><path d="M28 -6h12a11 11 0 0 1 0 22H28" fill="none" stroke="${c[2]}" stroke-width="5"/>${tt(circ(34), c[0], c[1])}${tt(circ(25), '#8a4f2a', '#6e3a1c', '', 2.2)}<g ${T(-6, -6, 20)}>${tt('M-7 -7h14v14h-14z', '#fffaf2', '#eadfce', '', 2)}</g><g ${T(9, 4, -12)}>${tt('M-6 -6h12v12h-12z', '#fffaf2', '#eadfce', '', 2)}</g>`,
  mittens: () => [[-14, 6, -18], [34, -34, 24]].map(([x, y, a]) => `<g ${T(x, y, a)}>${drop('M-20 -26c0-14 12-22 24-20 12 2 18 12 18 26v26h-42z')}${tt('M-20 -26c0-14 12-22 24-20 12 2 18 12 18 26v26h-42z', '#4aa8de', '#2f86c0', '<path d="M-22 -6h46" stroke="#fff" stroke-width="5"/><path d="M-22 4h46" stroke="#ff6f8e" stroke-width="4"/>')}${tt('M-20 -6c-10 -2-16-12-12-20 4-6 10-4 12 2z', '#4aa8de', '#2f86c0')}${tt('M-24 20h50v14a4 4 0 0 1-4 4h-42a4 4 0 0 1-4-4z', '#fff6e6', '#e6dccb', '', 2.4)}</g>`).join(''),
  cookies: () => [[-14, -12, 10], [18, 18, -20]].map(([x, y, a]) => `<g ${T(x, y, a)}>${drop(circ(22))}${tt(circ(22), '#e0a25c', '#c4833d', `<g stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M-3 -14v24M-14 -8l20 12M-14 4l20-12"/></g>`)}</g>`).join(''),
  marble: (emb) => `${drop(circ(42))}${tt(circ(42), '#8a5a3a', '#6e4026')}${tt(circ(33), '#d8f0ff', '#b9e0f7', '', 2.4)}<g transform="translate(-37 -36) scale(2.3)">${planetInner(...emb)}</g><path d="M-22 -14a26 26 0 0 1 14 -12" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  leaves: (cols = ['#e8892f', '#c9b02f', '#d6503a']) => cols.map((c, i) => `<g ${T(-20 + i * 24, (i % 2) * 22 - 10, -30 + i * 50)}>${drop('M0 0C-20-2-30-16-32-28c14 0 30 6 32 28z', 4, 5)}${tt('M0 0C-20-2-30-16-32-28c14 0 30 6 32 28z', c, '#00000022', '<path d="M0 0-26-22" stroke="#00000033" stroke-width="1.6"/>', 2.2)}</g>`).join(''),
  acorns: () => [[-12, 0, 25], [16, 14, -30]].map(([x, y, a]) => `<g ${T(x, y, a)}>${drop('M-8 0a8 11 0 1 0 16 0a8 11 0 1 0-16 0z', 3, 4)}${tt('M-8 4a8 11 0 1 0 16 0a8 11 0 1 0-16 0z', '#c98a3a', '#a86a22', '', 2.2)}${tt('M-10 -3a10 8 0 0 1 20 0z', '#7a4a24', '#5e3618', '', 2.2)}</g>`).join(''),
  map: () => `<g ${T(0, 0, -14)}>${drop('M-50 -36h100v72h-100z')}${tt('M-50 -36h100v72h-100z', '#f7e2b0', '#e5c98b', `<path d="M-34 18c10-20 20 8 32-10s18-10 26-24" stroke="#c45e33" stroke-width="3" stroke-dasharray="6 6" fill="none" stroke-linecap="round"/><path d="M20 -24l10 10M30 -24l-10 10" stroke="#e8434f" stroke-width="4" stroke-linecap="round"/>`)}${tt('M-56 -40h12v80h-12z', '#e5c98b', '#cfae6c', '', 2.4)}${tt('M44 -40h12v80h-12z', '#e5c98b', '#cfae6c', '', 2.4)}</g>`,
  compass: () => `${drop(circ(34))}${tt(circ(34), '#ffc83d', '#ec9a17')}${tt(circ(25), '#fff8e8', '#efe3c8', '', 2.2)}<path d="M0 -20 6 0 0 20-6 0z" fill="#e8434f" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/><path d="M0 0 6 0 0 20-6 0z" fill="#fff6e6" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/><circle r="3" fill="${K}"/><circle cy="-38" r="5" fill="#ffc83d" stroke="${K}" stroke-width="2.2"/>`,
  cactus: () => `${drop(circ(38))}${tt(circ(38), '#e07a4a', '#c45e33')}${tt(circ(28), '#7a4a2a', '#5e3820', '', 2.2)}${tt('M0 -24c6 0 7 8 12 8s10-6 14 0-2 10 0 16 8 12 2 16-10-2-14 2-4 12-14 12-8-10-14-12-14 4-16-4 4-10 0-16-10-8-4-14 10 2 14-2 4-8 10-8z', '#5bb85a', '#3f9a46', '', 2.4)}${[[-8, -10], [10, -6], [-12, 8], [8, 12]].map(([a, b]) => `<path d="M${a - 3} ${b}h6M${a} ${b - 3}v6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`).join('')}${tt(starPath(2, 0, 8, 4), '#ff6f8e', '#e0496b', '', 2)}`,
  shells: () => [[-16, -18, -20, '#ffd0dc', '#f2a9bc'], [20, 20, 26, '#fff1c9', '#ead097']].map(([x, y, a, c, d]) => `<g ${T(x, y, a)}>${drop('M0 16-20 -2c0-14 10-20 20-20s20 6 20 20z', 4, 6)}${tt('M0 16-20 -2c0-14 10-20 20-20s20 6 20 20z', c, d, '<path d="M0 16V-18M0 16-12-14M0 16 12-14" stroke="#fff" stroke-width="2" opacity=".7"/>')}</g>`).join(''),
  starfish: () => `<g ${T(0, 0, 14)}>${drop(starPath(0, 0, 34, 14))}${tt(starPath(0, 0, 34, 14), '#ff8a4a', '#e5662c', [...Array(5)].map((_, i) => `<circle cx="${Math.cos(-Math.PI / 2 + i * 1.2566) * 16}" cy="${Math.sin(-Math.PI / 2 + i * 1.2566) * 16}" r="2.6" fill="#ffd0a8"/>`).join(''))}</g>`,
  ring: () => `<g ${T(0, 0, -10)}>${drop(circ(40))}<path d="${circ(40)}${circ(19)}" fill-rule="evenodd" fill="#fff6e6" stroke="${K}" stroke-width="2.6"/>${[0, 1, 2, 3].map((i) => `<path d="M0 -40A40 40 0 0 1 28.3 -28.3L13.4 -13.4A19 19 0 0 0 0 -19z" fill="#e8434f" stroke="${K}" stroke-width="2.6" stroke-linejoin="round" transform="rotate(${i * 90})"/>`).join('')}</g>`,
  crystals: (cols = ['#ff5a6e', '#ff8a3d', '#b48cff']) => cols.map((c, i) => `<g ${T(-18 + i * 18, (i % 2) * 20 - 8, -20 + i * 30, 1 - i * 0.15)}><path d="M-12 8 0 -18 12 8 0 18z" fill="#000" opacity=".35" transform="translate(5 6)"/>${tt('M-12 6 0 -18 12 6 0 16z', c, '#00000033', '', 2.4)}</g>`).join(''),
  candle: () => `<circle r="70" fill="#ffb347" opacity=".14"/>${drop(circ(18))}${tt(circ(17), '#f3e6cf', '#d8c6a6')}<circle r="4" fill="#3d2a1d"/><circle r="9" fill="#ffd36b" opacity=".9"/><circle r="4.6" fill="#fffbe8"/>`,
  flowers: () => [[-16, -10, '#ff6f8e'], [14, -16, '#ffc83d'], [6, 16, '#b48cff']].map(([x, y, c]) => `<g ${T(x, y)}>${[0, 72, 144, 216, 288].map((a) => `<g transform="rotate(${a})">${tt('M0 -4c5-2 9-10 0-14-9 4-5 12 0 14z', c, '#00000022', '', 2)}</g>`).join('')}${tt(circ(4.5), '#fff4c7', '#ffd27a', '', 2)}</g>`).join(''),
  lily: () => `${drop(circ(34))}${tt('M0 0 30 -14A34 34 0 1 1 30 14z', '#5aa94e', '#3f8a3a', '<path d="M0 0-24 -14M0 0-26 10M0 0-6 28" stroke="#3f8a3a" stroke-width="2"/>')}<g ${T(-6, -4)}>${[0, 60, 120, 180, 240, 300].map((a) => `<g transform="rotate(${a})">${tt('M0 -3c4-2 6-8 0-12-6 4-4 10 0 12z', '#ffd0e6', '#f2a9bc', '', 1.8)}</g>`).join('')}</g>`,
  // Ofrenda (evento de Día de Muertos): ramo de cempasúchil, calaverita de azúcar y pan de muerto.
  marigolds: () => [[-20, -10, 17], [16, -18, 14], [8, 18, 16], [-14, 22, 11]].map(([x, y, r]) => `<g ${T(x, y)}>${drop(circ(r), 4, 6)}</g>${marigold(x, y, r)}`).join(''),
  sugarskull: () => `<g ${T(0, 0, -12)}>${drop(circ(34))}<g transform="translate(-48 -50) scale(3)">${icon('calavera').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`,
  pan: () => `${drop(circ(38))}${tt(circ(38), '#e0a25c', '#c4833d', `${[0, 60, 120].map((a) => `<path d="M-30 0h60" stroke="#c4833d" stroke-width="9" stroke-linecap="round" transform="rotate(${a})"/>`).join('')}${tt(circ(9), '#e8b070', '#c4833d', '', 2)}${[[-18, -20], [20, -14], [-22, 16], [16, 22], [2, -28], [28, 4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#fff6e6"/>`).join('')}`)}`,
  // Navidad: esferas y bastones de caramelo.
  ornaments: () => [[-18, -10, 22, '#e8434f', '#c22c3c'], [20, -16, 17, '#ffc83d', '#ec9a17'], [8, 20, 19, '#3fa0e0', '#2a7cc0']].map(([x, y, r, c, d]) => `<g ${T(x, y, (x - y) / 2)}>${drop(circ(r), 4, 6)}${tt(circ(r), c, d, `<path d="M${-r} -2q${r} ${r * 0.4} ${2 * r} 0" stroke="#fff3d6" stroke-width="3" fill="none"/><ellipse cx="${-r * 0.4}" cy="${-r * 0.45}" rx="${r * 0.22}" ry="${r * 0.12}" fill="#fff" opacity=".6" transform="rotate(-35 ${-r * 0.4} ${-r * 0.45})"/>`)}${tt(`M-6 ${-r - 6}h12v8h-12z`, '#ffc83d', '#ec9a17', '', 2)}</g>`).join(''),
  candycanes: () => [[-12, 2, -14], [14, -4, 18]].map(([x, y, a]) => `<g ${T(x, y, a)}><path d="M0 40V-14a12 12 0 0 1 24 0v6" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="13" stroke-linecap="round" transform="translate(5 7)"/><path d="M0 40V-14a12 12 0 0 1 24 0v6" fill="none" stroke="${K}" stroke-width="13" stroke-linecap="round"/><path d="M0 40V-14a12 12 0 0 1 24 0v6" fill="none" stroke="#fff6ee" stroke-width="8" stroke-linecap="round"/><path d="M0 40V-14a12 12 0 0 1 24 0v6" fill="none" stroke="#e8434f" stroke-width="8" stroke-dasharray="6 7" stroke-linecap="butt"/></g>`).join(''),
  // Primavera: ramo de tulipanes y mariposas.
  tulips: () => [[-22, 4, -18], [0, -6, 0], [22, 4, 18]].map(([x, y, a]) => `<g ${T(x, y, a)}><g transform="translate(-24 -36) scale(1.5)">${icon('tulipan').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`).join(''),
  butterflies: () => [[-14, -10, -20, 1.6], [18, 16, 25, 1.2]].map(([x, y, a, k]) => `<g ${T(x, y, a)}><g transform="translate(${-16 * k} ${-16 * k}) scale(${k})">${icon('mariposa').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`).join(''),
  // Amor y Amistad: ramo de rosas, carta y caja de bombones en forma de corazón.
  roses: () => [[-30, 0, -30], [30, 4, 30]].map(([x, y, a]) => `<g ${T(x, y, a)}>${tt('M0 -10Q8 0 0 10Q-8 0 0 -10z', '#4fb85e', '#2f8a42', '', 2)}</g>`).join('') + [[-16, -12, 15], [14, -18, 13], [10, 14, 14], [-14, 18, 11]].map(([x, y, r]) => `<g ${T(x, y, x * 3)}>${drop(circ(r), 3, 5)}${tt(circ(r), '#ff4f6e', '#d6304f', `<path d="M${-r * 0.55} ${r * 0.1}a${r * 0.55} ${r * 0.55} 0 0 1 ${r * 1.1} 0M${-r * 0.3} ${r * 0.2}a${r * 0.3} ${r * 0.32} 0 0 1 ${r * 0.6} 0M${-r * 0.75} ${-r * 0.15}q${r * 0.75} ${-r * 0.8} ${r * 1.5} 0" stroke="#a51f3c" stroke-width="2" fill="none" stroke-linecap="round"/>`, 2.4)}</g>`).join(''),
  letter: () => `<g ${T(0, 0, -12)}>${drop('M-46 -30h92v60h-92z')}<g transform="translate(-52 -48) scale(3.25)">${icon('sobre').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`,
  chocobox: () => `<g ${T(0, 0, 10)}>${drop('M0 40C-50 10-52-24-30-34-16-40-4-32 0-22 4-32 16-40 30-34 52-24 50 10 0 40z')}${tt('M0 40C-50 10-52-24-30-34-16-40-4-32 0-22 4-32 16-40 30-34 52-24 50 10 0 40z', '#c22c4f', '#a51f3c', [[-18, -14], [0, -2], [18, -14], [-10, 14], [10, 14]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#6e3a1c" stroke="${K}" stroke-width="2"/><circle cx="${x - 2}" cy="${y - 2}" r="2" fill="#a86a40"/>`).join(''))}</g>`,
  // Día de Reyes: la rosca grande, una corona y estrellas doradas.
  rosca: () => `${drop(ELLd(0, 0, 58, 40))}<g transform="translate(-58 -42) scale(3.6)">${icon('rosca').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`,
  crown: () => `<g ${T(0, 0, -10)}>${drop(circ(30))}<g transform="translate(-40 -44) scale(2.5)">${icon('crown').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`,
  goldstars: () => [[-16, -14, 20], [18, 8, 14], [-6, 24, 10]].map(([x, y, r]) => `<g ${T(x, y, x)}>${drop(starPath(0, 0, r, r * 0.45), 3, 4)}${tt(starPath(0, 0, r, r * 0.45), '#ffc83d', '#ec9a17', '', 2.2)}</g>`).join(''),
  plane: () => `<g ${T(0, 0, -20)}>${drop('M-36 0 36 -20 10 20z')}${tt('M-36 0 36 -20 4 4z', '#fffaf0', '#e8e0d0')}${tt('M4 4 36 -20 10 20z', '#ece4d4', '#d8cfbd')}</g>`,
  // Verano: pelota de playa, lentes de sol y rebanadas de sandía.
  beachball: () => `${drop(circ(40))}${tt(circ(40), '#fff6ee', '#e3d8c4', ['#e8434f', '#3fa0e0', '#ffc83d'].map((c, i) => { const a = (i * 120 * Math.PI) / 180, b = a + Math.PI / 3; return `<path d="M0 0L${(Math.cos(a) * 44).toFixed(1)} ${(Math.sin(a) * 44).toFixed(1)}A44 44 0 0 1 ${(Math.cos(b) * 44).toFixed(1)} ${(Math.sin(b) * 44).toFixed(1)}z" fill="${c}"/>`; }).join('') + `<circle r="7" fill="#fff6ee" stroke="${K}" stroke-width="2.2"/><ellipse cx="-16" cy="-20" rx="8" ry="4" fill="#fff" opacity=".6" transform="rotate(-35 -16 -20)"/>`)}`,
  sunglasses: () => {
    const lens = (x) => `M${x} -12h34a4 4 0 0 1 4 4v6a14 14 0 0 1-14 14h-14a14 14 0 0 1-14-14v-6a4 4 0 0 1 4-4z`;
    return `<g ${T(0, 0, -14)}>${drop('M-48 -14h96v32h-96z')}<path d="M-46 -8-58 -16M46 -8 58 -16" stroke="${K}" stroke-width="8" stroke-linecap="round"/><path d="M-46 -8-58 -16M46 -8 58 -16" stroke="#ff5f7e" stroke-width="3.6" stroke-linecap="round"/>`
      + `<path d="M-6 -6q6-7 12 0" fill="none" stroke="${K}" stroke-width="8" stroke-linecap="round"/><path d="M-6 -6q6-7 12 0" fill="none" stroke="#ff5f7e" stroke-width="3.6" stroke-linecap="round"/>`
      + [-42, 8].map((x) => `<path d="${lens(x)}" fill="none" stroke="${K}" stroke-width="12"/><path d="${lens(x)}" fill="none" stroke="#ff5f7e" stroke-width="6"/>${tt(lens(x), '#3a3550', '#2a2540', `<path d="M${x + 6} -6l10 10" stroke="#7fe0ff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`, 2)}`).join('') + '</g>';
  },
  watermelons: () => [[-14, -6, -20, 2.3], [18, 18, 24, 1.8]].map(([x, y, a, k]) => `<g ${T(x, y, a)}><g transform="translate(${-16 * k} ${-16 * k}) scale(${k})">${icon('sandia').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`).join(''),
  // Fiestas Patrias: sombrero de charro (visto desde arriba), chiles y maracas.
  charro: () => `${drop(circ(60))}${tt(circ(60), '#f2d38a', '#d9b060', `<circle r="53" fill="none" stroke="#e8434f" stroke-width="4"/><circle r="47" fill="none" stroke="#2f9e5c" stroke-width="2.4" stroke-dasharray="5 5"/>`)}${tt(circ(28), '#f2d38a', '#d9b060', `<circle r="28" fill="none" stroke="#e8434f" stroke-width="7"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(Math.cos((a * Math.PI) / 180) * 28).toFixed(1)}" cy="${(Math.sin((a * Math.PI) / 180) * 28).toFixed(1)}" r="2.4" fill="#ffd27a"/>`).join('')}<ellipse cx="-8" cy="-10" rx="7" ry="4" fill="#fff" opacity=".35" transform="rotate(-30 -8 -10)"/>`)}`,
  chiles: () => [[-12, -8, -30, 2.3, false], [16, 14, 40, 2, true]].map(([x, y, a, k, green]) => `<g ${T(x, y, a)}><g transform="translate(${-16 * k} ${-16 * k}) scale(${k})">${(green ? icon('chile').replace(/#e8434f/g, '#5fbf5a').replace(/#c22c3c/g, '#3f9a46').replace(/#ff9aa2/g, '#b8f0a0') : icon('chile')).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`).join(''),
  maracas: () => [[-14, -4, -30, '#e8434f', '#c22c3c'], [16, 8, 30, '#2f9e5c', '#1f7a42']].map(([x, y, a, c, d]) => `<g ${T(x, y, a)}>${drop('M-5 10h10v34h-10zM0 -24a18 18 0 1 1 0 36a18 18 0 1 1 0-36z', 4, 6)}${tt('M-4.5 10h9v32a4.5 4.5 0 0 1-9 0z', '#c9893a', '#a86a22', '', 2.2)}${tt(CIRCLE(0, -6, 18), c, d, `<path d="M-17 -10q17 8 34 0" stroke="#ffc83d" stroke-width="4" fill="none"/><path d="M-16 0q16 7 32 0" stroke="#fff6e6" stroke-width="3" fill="none"/><ellipse cx="-7" cy="-15" rx="5" ry="3" fill="#fff" opacity=".45" transform="rotate(-30 -7 -15)"/>`)}</g>`).join(''),
  // Candelaria: tamales, jarritos de atole y elotes.
  tamalesPlate: () => `${drop(circ(52))}${tt(circ(52), '#fff6e6', '#e8dcc4', `<circle r="42" fill="none" stroke="#3fa0e0" stroke-width="3"/>`)}${[[-14, -6, -30, 1.7], [14, 4, 25, 1.7], [0, 18, 90, 1.5]].map(([x, y, a, k]) => `<g ${T(x, y, a)}><g transform="translate(${-16 * k} ${-16 * k}) scale(${k})">${icon('tamal').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`).join('')}`,
  jarro: () => `${drop(circ(34))}<g transform="translate(-40 -44) scale(2.5)">${icon('atole').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`,
  elotes: () => [[-14, -6, -25], [16, 10, 30]].map(([x, y, a]) => `<g ${T(x, y, a)}>${drop('M-10 -34h20v62h-20z', 4, 6)}${tt('M-12 30C-16 0-10-28 0-36 10-28 16 0 12 30z', '#7cc04f', '#4fa84a')}${tt('M-8 24C-10 0-6-22 0-28 6-22 10 0 8 24z', '#ffd23d', '#f0b020', [-18, -10, -2, 6, 14].map((yy) => `<path d="M-7 ${yy}h14" stroke="#e8a020" stroke-width="1.6"/>`).join('') + '<path d="M0 -26v48" stroke="#e8a020" stroke-width="1.6"/>', 2.2)}</g>`).join(''),
  // Día del Taco: plato de tacos, molcajete con salsa y limones.
  tacosPlate: () => `${drop(circ(52))}${tt(circ(52), '#fff6e6', '#e8dcc4', `<circle r="42" fill="none" stroke="#e8434f" stroke-width="3"/>`)}${[[-14, -8, -20, 1.6], [14, 2, 15, 1.6], [-2, 18, 0, 1.4]].map(([x, y, a, k]) => `<g ${T(x, y, a)}><g transform="translate(${-16 * k} ${-16 * k}) scale(${k})">${icon('taco').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`).join('')}`,
  molcajete: () => `${drop(circ(40))}${tt(circ(40), '#6e6688', '#4f4866', [[-20, -18], [16, -24], [24, 14], [-26, 12], [-4, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#4f4866"/>`).join(''))}${tt(circ(30), '#e8434f', '#c22c3c', `<circle cx="-8" cy="-6" r="3" fill="#ff8a8a"/><circle cx="10" cy="6" r="2.4" fill="#6fc25a"/><circle cx="2" cy="-12" r="2" fill="#6fc25a"/>`, 2.2)}`,
  limones: () => [[-14, -6, 1.7], [16, 12, 1.4]].map(([x, y, k]) => `<g ${T(x, y, x)}>${drop(circ(16 * k * 0.8), 3, 4)}<g transform="translate(${-16 * k} ${-16 * k}) scale(${k})">${icon('limon').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`).join(''),
  // Día de la Tierra: maceta con su brote y la Tierra como canica.
  maceta: () => `${drop(circ(40))}<g transform="translate(-48 -52) scale(3)">${icon('brote').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`,
  tierraMarble: () => `${drop(circ(36))}<g transform="translate(-44 -50) scale(2.75)">${icon('tierra').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`,
  // Día del Niño: la piñata, un ramo de globos y estrellas doradas.
  pinataProp: () => `${drop(circ(44))}<g transform="translate(-56 -60) scale(3.5)">${icon('pinata').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`,
  globos: () => [[-16, -10, -15, '#ff5f7e'], [14, -16, 12, '#ffc83d'], [2, 10, 0, '#4aa8de']].map(([x, y, a, c]) => `<g ${T(x, y, a)}><g transform="translate(-30 -30) scale(1.9)">${icon('globito').replace(/^<svg[^>]*>|<\/svg>$/g, '').replace(/#ff5f7e/g, c).replace(/#d63d5f/g, '#00000033')}</g></g>`).join(''),
  // Día de las Madres: ramo de claveles y dos regalitos.
  ramo: () => `${drop(circ(42))}${tt('M-22 6 0 44 22 6z', '#fff6ee', '#f0dce6', '<path d="M-10 22h20" stroke="#ff7aa6" stroke-width="5" stroke-linecap="round"/>', 2.4)}${[[-18, -14, -25], [18, -16, 25], [0, -26, 0]].map(([x, y, a]) => `<g ${T(x, y, a)}><g transform="translate(-34 -32) scale(2.1)">${icon('clavel').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`).join('')}`,
  regalitos: () => [[-14, -6, -14, 2.2], [18, 16, 18, 1.7]].map(([x, y, a, k]) => `<g ${T(x, y, a)}>${drop(circ(15 * k * 0.8), 3, 4)}<g transform="translate(${-16 * k} ${-16 * k}) scale(${k})">${icon('regalito').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`).join(''),
  // Día del Padre: la corbata, llave y martillo de su caja de herramientas.
  corbataProp: () => `<g ${T(0, 0, -18)}>${drop(circ(36))}<g transform="translate(-50 -50) scale(3.1)">${icon('corbata').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`,
  tools: () => `<g ${T(-18, 0, -24)}>${drop('M-12 -24a12 12 0 0 1 8-12v10h8v-10a12 12 0 0 1 8 12 12 12 0 0 1-8 11.4V26a4 4 0 0 1-8 0V-12.6A12 12 0 0 1-12 -24z', 4, 5)}${tt('M-4 -14h8v40a4 4 0 0 1-8 0z', '#b8c4d8', '#8f9bb5', '', 2.4)}${tt('M-12 -24a12 12 0 0 1 8-12v10h8v-10a12 12 0 0 1 8 12 12 12 0 0 1-9 11.6h-6A12 12 0 0 1-12 -24z', '#cfd8e8', '#9aa7cf', '', 2.4)}</g>`
    + `<g ${T(20, 4, 22)}>${drop('M-4 -18h8v48h-8z', 4, 5)}${tt('M-3.5 -16h7v46h-7z', '#c98a3a', '#a86a22', '', 2.4)}${tt('M-18 -28h30a6 6 0 0 1 6 6v7h-36z', '#8f9bb5', '#6e7a96', '<path d="M-14 -24h20" stroke="#cfd8e8" stroke-width="2.4" stroke-linecap="round"/>', 2.4)}</g>`,
  // Día del Gato: el gatito, dos bolas de estambre y un pescadito.
  gatitoProp: () => `<g ${T(0, 0, -12)}>${drop(circ(38))}<g transform="translate(-52 -54) scale(3.25)">${icon('gatito').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`,
  estambres: () => [[-14, -8, -14, 2.2], [18, 16, 30, 1.6]].map(([x, y, a, k]) => `<g ${T(x, y, a)}>${drop(circ(13 * k), 3, 4)}<g transform="translate(${-17 * k} ${-15 * k}) scale(${k})">${icon('estambre').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`).join(''),
  pescadito: () => `<g ${T(0, 0, -24)}>${drop('M-34 0C-20-18 10-18 22 0 10 18-20 18-34 0zM20 0l16-14v28z')}${tt('M-34 0C-20-18 10-18 22 0 10 18-20 18-34 0z', '#7fc4f0', '#4aa8de', '<path d="M-8-12q6 12 0 24M2-12q6 12 0 24" stroke="#3f8ad8" stroke-width="2.4" fill="none"/>')}${tt('M20 0 36-14v28z', '#7fc4f0', '#4aa8de', '', 2.4)}<circle cx="-22" cy="-3" r="3.6" fill="${K}"/><circle cx="-23" cy="-4.2" r="1.2" fill="#fff"/></g>`,
  // Día del Perro: el cachorro, dos huesitos y una pelota de tenis.
  cachorroProp: () => `<g ${T(0, 0, -12)}>${drop(circ(38))}<g transform="translate(-52 -54) scale(3.25)">${icon('cachorro').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`,
  huesos: () => [[-10, -12, -28, 2.2], [14, 18, 20, 1.7]].map(([x, y, a, k]) => `<g ${T(x, y, a)}>${drop('M-30 -6h60v12h-60z', 3, 4)}<g transform="translate(${-16 * k} ${-16 * k}) scale(${k})">${icon('hueso').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`).join(''),
  tennis: () => `${drop(circ(26))}${tt(circ(26), '#d8f05a', '#b8d03a', '<path d="M-24-10q14 10 0 22M24-12q-14 10 0 24" stroke="#fff" stroke-width="3.4" fill="none"/>')}`,
  // Halloween: calabaza tallada, murciélagos y un caldero con poción.
  pumpkin: () => `${drop(ELLd(0, 2, 48, 38))}<g transform="translate(-54 -62) scale(3.4)">${icon('calabaza').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`,
  bats: () => [[-14, -10, -15, 2.2], [20, 18, 20, 1.6]].map(([x, y, a, k]) => `<g ${T(x, y, a)}><g transform="translate(${-16 * k} ${-16 * k}) scale(${k})">${icon('murcielago').replace(/#5a4a8a/g, '#a890d8').replace(/#3f3270/g, '#7a62b8').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`).join(''),
  cauldron: () => `${drop(circ(40))}${tt(circ(40), '#3a3550', '#2a2540', `<path d="M-30 -26h60" stroke="#4a4466" stroke-width="3"/>`)}${tt(circ(29), '#6fd36a', '#3fae4a', [[-10, -8, 6], [8, 4, 8], [-4, 14, 4], [14, -12, 3.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#b8f0a0" stroke="${K}" stroke-width="1.8"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.3}" fill="#fff"/>`).join(''), 2.4)}`,
};
// Objetos por tipo de mundo: [arriba-izquierda, arriba-derecha, abajo-izquierda]; abajo-derecha siempre es la canica con el planeta.
const PROPS = {
  bosque: ['leaves', 'acorns', ['mug', ['#ffb066', '#e8853e', '#ffc794']]],
  selva: [['leaves', ['#4fae4a', '#2f8a3f', '#7cc04f']], 'flowers', ['mug', ['#47c27a', '#2f9e5c', '#7fe0a8']]],
  pradera: ['flowers', ['leaves', ['#a8e06a', '#7cc04f', '#c9e88a']], ['mug', ['#ffc83d', '#ec9a17', '#ffe08a']]],
  pantano: ['lily', 'acorns', ['mug', ['#7a8f4a', '#5f7a3a', '#a0b070']]],
  arrecife: ['shells', 'starfish', 'ring'],
  desierto: ['map', 'compass', 'cactus'],
  canon: ['map', 'compass', 'cactus'],
  volcan: ['crystals', 'candle', 'candle'],
  cueva: [['crystals', ['#b48cff', '#8fd2ef', '#ff7ab8']], 'candle', 'candle'],
  glaciar: ['mittens', 'cookies', 'mug'],
  montana: ['compass', 'map', ['mug', ['#4aa8de', '#2f86c0', '#8fd2ef']]],
  cielo: ['plane', 'starfish', ['mug', ['#b48cff', '#8a5cf0', '#d0b8ff']]],
};
const propSVG = (inner, size) => `<svg viewBox="${-size / 2} ${-size / 2} ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><defs><filter id="pb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>${inner}</svg>`;
const call = (p) => (Array.isArray(p) ? P[p[0]](p[1]) : P[p]());

// Mesas de los eventos del mes: mantel, tinte y objetos [arriba-izq, arriba-der, abajo-izq, abajo-der].
const EVENT_TABLES = {
  muertos: { tile: mantelTile, tint: '#1a0614', props: ['marigolds', 'sugarskull', 'candle', 'pan'] },
  primavera: { tile: mantelPrimaveraTile, tint: '#0a1a08', props: ['tulips', 'butterflies', ['mug', ['#47c27a', '#2f9e5c', '#a8e8b8']], 'flowers'] },
  amor: { tile: mantelAmorTile, tint: '#1a0410', props: ['roses', 'letter', ['mug', ['#ff7ab8', '#e8559a', '#ffc2dc']], 'chocobox'] },
  reyes: { tile: mantelReyesTile, tint: '#0e0620', props: ['rosca', 'crown', ['mug', ['#8a5cf0', '#6c3fd4', '#b9a6ff']], 'goldstars'] },
  navidad: { tile: mantelNavidadTile, tint: '#1a0408', props: ['ornaments', 'candycanes', ['mug', ['#e8434f', '#c22c3c', '#ff8a94']], 'cookies'] },
  verano: { tile: mantelVeranoTile, tint: '#04202e', props: ['beachball', 'sunglasses', ['mug', ['#38c2dd', '#1f8fc8', '#8fe8ff']], 'watermelons'] },
  patrias: { tile: mantelPatriasTile, tint: '#140814', props: ['charro', 'chiles', ['mug', ['#e8434f', '#c22c3c', '#ff9aa2']], 'maracas'] },
  candelaria: { tile: mantelCandelariaTile, tint: '#1a0e04', props: ['tamalesPlate', 'elotes', ['mug', ['#d9783f', '#b85a28', '#f0a070']], 'jarro'] },
  taco: { tile: mantelTacoTile, tint: '#1a0604', props: ['tacosPlate', 'limones', ['mug', ['#ff9c5b', '#e2753a', '#ffc794']], 'molcajete'] },
  tierra: { tile: mantelTierraTile, tint: '#04140a', props: ['maceta', 'flowers', ['mug', ['#47c27a', '#2f9e5c', '#a8e8b8']], 'tierraMarble'] },
  nino: { tile: mantelNinoTile, tint: '#0a0a24', props: ['pinataProp', 'globos', ['mug', ['#ff7ab8', '#e8559a', '#ffc2dc']], 'goldstars'] },
  madres: { tile: mantelMadresTile, tint: '#1a0410', props: ['ramo', 'regalitos', ['mug', ['#ff7aa6', '#e0406f', '#ffc2d6']], 'letter'] },
  padre: { tile: mantelPadreTile, tint: '#060e24', props: ['corbataProp', 'tools', ['mug', ['#4aa8de', '#2f86c0', '#bfe2ff']], 'letter'] },
  gato: { tile: mantelGatoTile, tint: '#0e0820', props: ['gatitoProp', 'estambres', ['mug', ['#b48cff', '#8a5cf0', '#e2d4ff']], 'pescadito'] },
  perro: { tile: mantelPerroTile, tint: '#140a04', props: ['cachorroProp', 'huesos', ['mug', ['#ff9c5b', '#e2753a', '#ffe0c4']], 'tennis'] },
  halloween: { tile: mantelHalloweenTile, tint: '#0e0618', props: ['pumpkin', 'bats', ['mug', ['#6fd36a', '#3fae4a', '#b8f0a0']], 'cauldron'] },
};
// HTML del fondo de la mesa para el mundo w (o la del evento del mes: theme = su clave).
export function tableHTML(w, theme) {
  const ev = EVENT_TABLES[theme];
  if (ev) {
    const t = (TILE_CACHE[`ev-${theme}`] ||= ev.tile()), [tl, tr, bl, br] = ev.props;
    return `<div class="table t-ev t-${theme}" style="--tile:${t.url};--tw:${t.w}px;--th:${t.h}px;--tint:${ev.tint}">
    <div class="prop tl">${propSVG(call(tl), 150)}</div><div class="prop tr">${propSVG(call(tr), 120)}</div>
    <div class="prop bl">${propSVG(call(bl), 120)}</div><div class="prop br">${propSVG(call(br), 120)}</div></div>`;
  }
  const key = biomeKey(worldInfo(w).place), b = BIOMES[key], t = tableTile(key);
  const [tl, tr, bl] = PROPS[key] || PROPS.bosque;
  const frost = b.frost ? ['tl', 'tr', 'br'].map((c) => `<svg class="frost ${c}" viewBox="0 0 150 110" aria-hidden="true"><path d="M0 0h140c-8 14-30 12-36 26s-26 6-34 22-24 10-30 30-26 18-40 18z" fill="#eaf7ff" stroke="#8cc4e6" stroke-width="2.6" stroke-linejoin="round"/></svg>`).join('') : '';
  return `<div class="table t-${b.table}" style="--tile:${t.url};--tw:${t.w}px;--th:${t.h}px;--tint:${b.tint}">${frost}
    <div class="prop tl">${propSVG(call(tl), 150)}</div><div class="prop tr">${propSVG(call(tr), 120)}</div>
    <div class="prop bl">${propSVG(call(bl), 120)}</div><div class="prop br">${propSVG(P.marble(b.emblem), 120)}</div></div>`;
}
