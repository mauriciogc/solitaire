// Temáticas de la tienda (8 nov 2026): cada una trae de una vez un reverso, una cara, un fondo de espacio y un marco
// de postal con la misma paleta y su dibujo (un icono de art.js). Así hay muchas cosas que comprar sin dibujar cada una.
// Paleta: main (color principal), dark (su sombra), light (clarito), accent (segundo color), red (números rojos de la
// cara), night y deep (el fondo del espacio, de oscuro a menos oscuro).
// Las claves llevan "tm" adelante para no chocar con lo que ya existe en cada sección.
export const THEMES = [
  { k: 'corazones', name: 'Corazones', ico: 'corazon', main: '#ff7aa2', dark: '#e0507e', light: '#ffe0ea', accent: '#ff5f7e', red: '#e8434f', night: '#3a1030', deep: '#6a1a4a' },
  { k: 'mariposas', name: 'Mariposas', ico: 'mariposa', main: '#b48cff', dark: '#8a5cf0', light: '#efe6ff', accent: '#ffb3d1', red: '#d6337a', night: '#1e1240', deep: '#3a2470' },
  { k: 'verano', name: 'Verano', ico: 'sol', main: '#ffc83d', dark: '#ec9a17', light: '#fff4c7', accent: '#ff8a3d', red: '#e8434f', night: '#3a1e08', deep: '#8a3a10' },
  { k: 'invierno', name: 'Invierno', ico: 'copo', main: '#8fd6ff', dark: '#4aa8de', light: '#eaf8ff', accent: '#c9bff0', red: '#d6337a', night: '#0a1838', deep: '#1e3a6e' },
  { k: 'tropical', name: 'Tropical', ico: 'palmera', main: '#2fbf9a', dark: '#1f9a7c', light: '#dcfff4', accent: '#ffc83d', red: '#ff5f7e', night: '#04241e', deep: '#0f4a3e' },
  { k: 'plumas', name: 'Plumas', ico: 'pluma', main: '#5fd1c5', dark: '#2fa89c', light: '#e6fffb', accent: '#ff9c5b', red: '#e8434f', night: '#0a2a30', deep: '#145a60' },
  { k: 'globos', name: 'Globos', ico: 'globito', main: '#ff9c5b', dark: '#e2753a', light: '#fff0e2', accent: '#4aa8de', red: '#e8434f', night: '#2a1408', deep: '#5a2a10' },
  { k: 'limonada', name: 'Limonada', ico: 'limon', main: '#c8e85a', dark: '#9ac43a', light: '#f6ffd8', accent: '#ffe066', red: '#e85a3a', night: '#1e2a06', deep: '#3a5010' },
  { k: 'jardin', name: 'Jardín', ico: 'tulipan', main: '#7fd36a', dark: '#56b83a', light: '#eaffe0', accent: '#ff7ab8', red: '#e8434f', night: '#0e2a0a', deep: '#245a1a' },
  { k: 'gatitos', name: 'Gatitos', ico: 'gatito', main: '#ffb066', dark: '#e8853e', light: '#fff1e0', accent: '#ff9cb4', red: '#e0507e', night: '#2a1608', deep: '#5a3010' },
  { k: 'perritos', name: 'Perritos', ico: 'cachorro', main: '#c99a68', dark: '#a87650', light: '#f6ead8', accent: '#5fc7e8', red: '#c22c49', night: '#1e1208', deep: '#4a2e18' },
  { k: 'lluvia', name: 'Lluvia', ico: 'gota', main: '#4aa8de', dark: '#2f86c0', light: '#e2f3ff', accent: '#5ff0ff', red: '#e8434f', night: '#061830', deep: '#0e3a6a' },
  { k: 'fuego', name: 'Fuego', ico: 'flame', main: '#ff6b3d', dark: '#d6452a', light: '#ffe6d6', accent: '#ffc83d', red: '#c22c49', night: '#2a0806', deep: '#6a1408' },
  { k: 'realeza', name: 'Realeza', ico: 'crown', main: '#8a5cf0', dark: '#6c3fd4', light: '#f0e8ff', accent: '#ffc83d', red: '#c22c49', night: '#140a30', deep: '#2e1a6a' },
];
export const themeKey = (t) => `tm${t.k}`;

// Caras quitadas (9 nov 2026, el usuario: su fondo se veía feo y tapaba mucho; Fuego se veía transparente al jugar).
// Esas temáticas siguen con su reverso, fondo y postal; quien tenía la cara puesta vuelve a la clásica.
const NO_FACE = new Set(['mariposas', 'tropical', 'plumas', 'limonada', 'jardin', 'lluvia', 'realeza', 'fuego']);
// Lo que cuesta y desde qué mundo (antes del ×5 de NEED_X en shop.js): de la más barata a la más cara, repartidas.
export function themeItems() {
  const out = { back: [], face: [], space: [], frame: [] };
  THEMES.forEach((t, i) => {
    const k = themeKey(t), need = 4 + i * 7;
    out.back.push({ k, name: t.name, price: 600 + i * 100, need, theme: t.k });
    if (!NO_FACE.has(t.k)) out.face.push({ k, name: t.name, price: 550 + i * 100, need: need + 2, theme: t.k });
    out.space.push({ k, name: t.name, price: 650 + i * 100, need: need + 3, theme: t.k });
    out.frame.push({ k, name: t.name, price: 300 + i * 60, need: need + 1, theme: t.k });
  });
  return out;
}

// Caras (9 nov 2026: el usuario no veía diferencia entre muchas, solo el tinte). Cada temática trae su letra, su efecto
// en los números y su dibujo de fondo con su icono. Letras del sistema (iPhone las tiene; en otros, la de respaldo).
// font: letra de los números · num: efecto (sticker, hollow, stamp) · bg: fondo (tile = icono repetido, dots).
// Verano e Invierno se quedan como estaban (el usuario dijo que esas sí se distinguen).
const FACE = {
  corazones: { font: "'Chalkboard SE', 'Comic Sans MS', cursive", num: 'sticker', bg: 'tile' },
  globos: { font: "'Baloo 2', sans-serif", num: 'hollow', bg: 'dots' },
  gatitos: { font: "'Arial Rounded MT Bold', 'Baloo 2', sans-serif", num: 'sticker', bg: 'tile' },
  perritos: { font: "'American Typewriter', 'Courier New', serif", num: 'stamp', bg: 'tile' },
};
// Cómo se ve el número (y la esquina) según el efecto. s = tamaño de la sombra.
const NUM = (t, kind) => {
  const s = 'calc(var(--cw) * 0.025)', s2 = 'calc(var(--cw) * 0.05)';
  return {
    sticker: `text-shadow: ${s} 0 0 #fff, -${s} 0 0 #fff, 0 ${s} 0 #fff, 0 -${s} 0 #fff, ${s2} ${s2} 0 ${t.main};`,
    hollow: `-webkit-text-fill-color: ${t.light}; -webkit-text-stroke: calc(var(--cw) * 0.035) currentColor; font-weight: 800; text-shadow: ${s2} ${s2} 0 ${t.main};`,
    stamp: `text-shadow: ${s} ${s} 0 ${t.light}, -${s} -${s} 0 ${t.dark}66; letter-spacing: -0.02em;`,
  }[kind] || '';
};
// Fondo de la cara según su tipo, debajo del degradado de siempre.
const BG = (t, f, url) => {
  const base = `linear-gradient(160deg, ${t.light}, #fffdf7 70%)`;
  return {
    tile: `${url(t.ico, 0.2)} 0 0 / calc(var(--cw) * 0.36) repeat, ${base}`,
    dots: `radial-gradient(circle, ${t.main} 0 22%, transparent 26%) 0 0 / calc(var(--cw) * 0.3) calc(var(--cw) * 0.3), radial-gradient(circle, ${t.accent} 0 18%, transparent 22%) calc(var(--cw) * 0.15) calc(var(--cw) * 0.15) / calc(var(--cw) * 0.3) calc(var(--cw) * 0.3), #fffdf7`,
  }[f.bg] || base;
};
// CSS de caras, espacios y marcos de cada temática (se agrega una vez al arrancar, ver main.js).
// url(icono, opacidad, giro): el icono como imagen de fondo (iconURL de art.js).
export function themeCSS(url) {
  return THEMES.map((t) => {
    const k = themeKey(t), f = FACE[t.k];
    const sel = `.face-${k} .front:not(.face-prev:not(.face-${k}) .front)`;
    const ring = `inset 0 0 0 4.5px ${t.main}66`;
    return [
      `${sel}:not(.wild):not(.arrowed):not(.live) { color: ${t.night}; background: ${f ? BG(t, f, url) : `radial-gradient(1.4px 1.4px at 22% 70%, ${t.main}, transparent), radial-gradient(1.2px 1.2px at 78% 36%, ${t.accent}, transparent), radial-gradient(1px 1px at 46% 88%, ${t.main}, transparent), linear-gradient(160deg, ${t.light}, #fffdf7 70%)`}; box-shadow: inset 0 0 0 2px var(--ink), ${ring}, inset 0 calc(var(--cw) * -0.1) 0 ${t.light}, 2px 4px 0 #0b062a33, 4px 9px 12px #0b062a40; }`,
      `${sel}.red:not(.arrowed):not(.live) { color: ${t.red}; }`,
      f && `${sel}:not(.wild) :is(.big, .rk, .dbl b, .tk b) { font-family: ${f.font}; ${f.bold ? 'font-weight: 700;' : ''} ${NUM(t, f.num)} }`,
      `.space-${k} { --sky: radial-gradient(60% 80% at 22% 30%, ${t.main}55, transparent 70%), radial-gradient(50% 70% at 80% 75%, ${t.accent}40, transparent 70%), radial-gradient(40% 50% at 55% 8%, ${t.light}26, transparent 70%), linear-gradient(170deg, ${t.night} 0%, ${t.deep} 55%, ${t.dark} 130%); }`,
      `.postcard.fr-${k} { padding: 16px 22px 16px 16px; box-shadow: inset 0 0 0 4px ${t.main}, inset 0 0 0 7px #fff, inset 0 0 0 10px ${t.accent}, inset 0 0 0 12px ${t.dark}, 0 4px 0 var(--ink); }`,
    ].filter(Boolean).join('\n');
  }).join('\n');
}

// Viajeros de otros colores (8 nov 2026): el mismo modelo 3D con su paleta cambiada (color de antes → color nuevo).
export const TRAVELER_VARIANTS = [
  { k: 'cohetementa', base: 'cohete', name: 'Cohete menta', text: 'Despega con su llama', price: 900, need: 5, map: { '#fff6e6': '#dcfff4', '#ff5f7e': '#2fbf9a', '#5fc7e8': '#ffc83d' } },
  { k: 'cohetenoche', base: 'cohete', name: 'Cohete de noche', text: 'Despega con su llama', price: 1300, need: 18, map: { '#fff6e6': '#3a3a6a', '#ff5f7e': '#ffc83d', '#5fc7e8': '#8fe8ff' } },
  { k: 'ovnidorado', base: 'ovni', name: 'Ovni dorado', text: 'Gira con sus luces', price: 1500, need: 22, map: { '#b9b1dc': '#ffd970', '#8fe8ff': '#ff9cc8', '#8f88c0': '#e8a93a' } },
  { k: 'ovniverde', base: 'ovni', name: 'Ovni marciano', text: 'Gira con sus luces', price: 1100, need: 10, map: { '#b9b1dc': '#9be86a', '#8fe8ff': '#d8f0ff', '#8f88c0': '#56b83a' } },
  { k: 'globorayas', base: 'globo', name: 'Globo de fiesta', text: 'Se mece con su fueguito', price: 1300, need: 14, map: { '#ff5f7e': '#8a5cf0', '#ffc83d': '#5fd1c5', '#4aa8de': '#ff7ab8', '#fff6e6': '#c8e85a', '#b8865a': '#ff9c5b' } },
  { k: 'satelitedorado', base: 'satelite', name: 'Satélite dorado', text: 'Gira con sus paneles', price: 1700, need: 28, map: { '#ffc83d': '#e8a93a', '#4a6fde': '#ffd970', '#9ad9ff': '#fff4c7', '#f4f1ff': '#ffe08a', '#b9c4e0': '#c4900f', '#ff5f7e': '#5ff0ff' } },
  { k: 'ballenarosa', base: 'ballena', name: 'Ballena rosa', text: 'Sopla polvo de estrellas', price: 2700, need: 65, map: { '#4aa8de': '#ff9cc8', '#3d95cc': '#e870a8' } },
  { k: 'medusaazul', base: 'medusa', name: 'Medusa azul', text: 'Late y ondula sus tentáculos', price: 1800, need: 33, map: { '#ff5f9e': '#4aa8de', '#ffc2dc': '#c9ecff', '#ff9cc8': '#8fd6ff', '#ff7ab8': '#5fc7e8', '#c9a6ff': '#9ad9ff' } },
  { k: 'mantadorada', base: 'mantarraya', name: 'Mantarraya de oro', text: 'Aletea despacio', price: 2300, need: 45, map: { '#6f5fd8': '#e8a93a', '#5a4bc0': '#c47a00', '#e3d8ff': '#fff4c7' } },
  { k: 'avioncielo', base: 'avion', name: 'Avión del cielo', text: 'Planea en ondas', price: 1000, need: 7, map: { '#fff6e6': '#d8f0ff', '#ff9cc8': '#4aa8de', '#f0eaff': '#bfe0f5' } },
];
