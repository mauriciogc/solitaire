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
  plane: () => `<g ${T(0, 0, -20)}>${drop('M-36 0 36 -20 10 20z')}${tt('M-36 0 36 -20 4 4z', '#fffaf0', '#e8e0d0')}${tt('M4 4 36 -20 10 20z', '#ece4d4', '#d8cfbd')}</g>`,
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
