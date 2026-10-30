// Dibujos del juego (SVG): estilo "toon" con contorno de tinta y sombreado por bloques,
// el mismo trazo de los planetas. Reemplaza a lowpoly.js con la misma interfaz.
export const INK = '#2a1f5c';
const K = INK;
let uid = 0;

// Comillas simples: así el url() se puede poner dentro de un atributo style="…".
export const svgUrl = (svg) => `url('data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}')`;
export const CIRCLE = (cx, cy, r) => `M${cx} ${cy - r}a${r} ${r} 0 1 1 0 ${2 * r}a${r} ${r} 0 1 1 0 ${-2 * r}z`;
export function starPath(cx, cy, R, r) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R;
    d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(2) + ' ' + (cy + rr * Math.sin(a)).toFixed(2);
  }
  return d + 'z';
}

// Forma con sombra abajo a la derecha (la forma de color se corre arriba-izquierda) y contorno.
export function tshape(d, base, shade, inside = '', sw = 2, off = [-1.4, -2.2]) {
  const id = 'ts' + uid++;
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})"><path d="${d}" fill="${shade}"/><path d="${d}" fill="${base}" transform="translate(${off[0]} ${off[1]})"/>${inside}</g><path d="${d}" fill="none" stroke="${K}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}
const svg = (inner, cls = '', vb = 32) => `<svg class="ico ${cls}" viewBox="0 0 ${vb} ${vb}" aria-hidden="true">${inner}</svg>`;
const glyph = (d, w = 5, color = K) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

export const SUITS = {
  h: 'M12 21.3C5.2 16.4 2 12.6 2 8.6 2 5.5 4.4 3.1 7.4 3.1c1.9 0 3.6 1 4.6 2.6 1-1.6 2.7-2.6 4.6-2.6 3 0 5.4 2.4 5.4 5.5 0 4-3.2 7.8-10 12.7z',
  d: 'M12 1.8C14.4 5.6 17 8.8 20.6 12 17 15.2 14.4 18.4 12 22.2 9.6 18.4 7 15.2 3.4 12 7 8.8 9.6 5.6 12 1.8z',
  s: 'M12 1.9C9 6.4 3 9.5 3 14c0 2.7 2.1 4.6 4.6 4.6 1.4 0 2.6-.6 3.4-1.5-.3 2-1.2 3.6-2.7 4.9h7.4c-1.5-1.3-2.4-2.9-2.7-4.9.8.9 2 1.5 3.4 1.5 2.5 0 4.6-1.9 4.6-4.6 0-4.5-6-7.6-9-12.1z',
  c: 'M12 2.4a4.4 4.4 0 0 0-4 6.3A4.4 4.4 0 1 0 10.9 16.6c-.3 2.1-1.2 3.8-2.6 5h7.4c-1.4-1.2-2.3-2.9-2.6-5a4.4 4.4 0 1 0 2.9-7.9A4.4 4.4 0 0 0 12 2.4z',
};
export const suitSVG = (s) => `<svg class="suit" viewBox="0 0 24 24" aria-hidden="true"><path d="${SUITS[s]}" fill="currentColor"/></svg>`;

// Planetita (títulos, reversos, bola de nieve). Sin <svg>, para incrustar.
export function planetInner(a, b, land, ring) {
  const rl = (w, c) => `<ellipse cx="16" cy="17" rx="15" ry="5" fill="none" stroke="${c}" stroke-width="${w}" transform="rotate(-18 16 17)"/>`;
  const front = (w, c) => `<path d="M1 17a15 5 0 0 0 30 0" fill="none" stroke="${c}" stroke-width="${w}" transform="rotate(-18 16 17)"/>`;
  return (ring ? rl(5, K) + rl(2.4, ring) : '')
    + tshape(CIRCLE(16, 16, 10.5), a, b, `<path d="M6 13c3-1 4 2 7 1s2-5 6-5c2 0 3 1 4 2v3c-2 0-3 2-5 3s-4-1-6 1-3 4-6 3z" fill="${land}"/>`, 2.2)
    + (ring ? front(5, K) + front(2.4, ring) : '');
}
export const miniPlanet = (colors, cls = '') => svg(planetInner(...colors), cls);

const ICONS = {
  coin: () => tshape(CIRCLE(16, 16, 12.5), '#ffc83d', '#ec9a17', `<circle cx="14.6" cy="13.8" r="8" fill="none" stroke="#ec9a17" stroke-width="2"/><path d="${starPath(14.6, 14.2, 4.8, 2.2)}" fill="#fff4c7"/>`),
  star: () => tshape(starPath(16, 17, 14, 6.6), '#ffc83d', '#ec9a17', `<path d="M10.5 13.5l2.2-3.6" stroke="#fff4c7" stroke-width="2.2" stroke-linecap="round"/>`),
  starOff: () => tshape(starPath(16, 17, 14, 6.6), '#ddd3c0', '#c7baa2'),
  ticket: () => `<g transform="rotate(-12 16 16)">${tshape('M3 10.5a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v3a2.6 2.6 0 0 0 0 5.2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2.6 2.6 0 0 0 0-5.2z', '#ff6f8e', '#e0496b', `<path d="M21 9v14" stroke="#fff" stroke-width="1.8" stroke-dasharray="2 2"/><path d="${starPath(11.5, 15.6, 4.4, 2)}" fill="#fff"/>`)}</g>`,
  gold: () => `<g transform="rotate(-12 16 16)">${tshape('M3 10.5a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v3a2.6 2.6 0 0 0 0 5.2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2.6 2.6 0 0 0 0-5.2z', '#ffc83d', '#ec9a17', `<path d="M21 9v14" stroke="#fff" stroke-width="1.8" stroke-dasharray="2 2"/><path d="${starPath(11.5, 15.6, 4.4, 2)}" fill="#fff"/>`)}</g>`,
  bag: () => tshape('M6 13h20v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z', '#ffb066', '#e8853e')
    + tshape('M13 28v-6.5a3 3 0 0 1 6 0V28z', '#9a5a32', '#7a4024')
    + tshape('M4 12.5 6.5 5h19l2.5 7.5c0 2-1.4 3.2-3 3.2S22 14.5 22 12.5c0 2-1.4 3.2-3 3.2S16 14.5 16 12.5c0 2-1.4 3.2-3 3.2S10 14.5 10 12.5c0 2-1.4 3.2-3 3.2S4 14.5 4 12.5z', '#ff6f8e', '#e0496b', '<path d="M10 4v13M22 4v13" stroke="#fff6e6" stroke-width="6"/>'),
  gift: () => tshape('M6 14h20v12.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z', '#47c27a', '#2f9e5c')
    + tshape('M4 10a1.5 1.5 0 0 1 1.5-1.5h21A1.5 1.5 0 0 1 28 10v4.2H4z', '#5ad68c', '#3fb873')
    + tshape('M14.3 8.5h3.4v20h-3.4z', '#ffc83d', '#ec9a17', '', 1.6)
    + tshape('M16 8.5c-2-4.5-7.5-5.5-7.5-2.3 0 2 3.5 2.3 7.5 2.3zM16 8.5c2-4.5 7.5-5.5 7.5-2.3 0 2-3.5 2.3-7.5 2.3z', '#ffc83d', '#ec9a17', '', 1.8),
  gear: () => `<g transform="scale(.889)">${tshape('M15.5 4h5l.8 3.6 2.4 1 3.1-2 3.5 3.5-2 3.1 1 2.4 3.7.9v5l-3.7.8-1 2.4 2 3.1-3.5 3.5-3.1-2-2.4 1-.8 3.7h-5l-.9-3.7-2.4-1-3.1 2-3.5-3.5 2-3.1-1-2.4L4 20.5v-5l3.6-.9 1-2.4-2-3.1 3.5-3.5 3.1 2 2.4-1z', '#b9b1dc', '#9188c0', '', 2.2)}${tshape(CIRCLE(18, 18, 5), '#fff6e6', '#ecdcc0', '', 2.2)}</g>`,
  help: () => tshape(CIRCLE(16, 16, 13), '#4aa8de', '#2f86c0', '', 2.2) + `<path d="M11.5 12.5a4.5 4.5 0 1 1 6 4.2c-1.2.5-1.5 1.2-1.5 2.6" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/><circle cx="16" cy="24" r="2" fill="#fff"/>`,
  prev: () => glyph('M20 6 10 16l10 10'),
  next: () => glyph('M12 6l10 10-10 10'),
  chev: () => glyph('M12 7l9 9-9 9', 4),
  close: () => `<path d="M8 8l16 16M24 8 8 24" stroke="${K}" stroke-width="8" stroke-linecap="round"/><path d="M8 8l16 16M24 8 8 24" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>`,
  play: () => `<path d="M10 6.5c0-1.6 1.7-2.5 3-1.7l12.4 8.4c1.2.8 1.2 2.6 0 3.4L13 25.2c-1.3.8-3-.1-3-1.7z" fill="#fff" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/>`,
  pause: () => `<rect x="8" y="6" width="5.6" height="20" rx="2.4" fill="${K}"/><rect x="18.4" y="6" width="5.6" height="20" rx="2.4" fill="${K}"/>`,
  pauseW: () => `<rect x="8" y="6" width="5.6" height="20" rx="2.4" fill="#fff" stroke="${K}" stroke-width="2"/><rect x="18.4" y="6" width="5.6" height="20" rx="2.4" fill="#fff" stroke="${K}" stroke-width="2"/>`,
  undo: () => glyph('M12 7 5 13.5l7 6.5', 4.4) + `<path d="M6 13.5h12.5a7.5 7.5 0 0 1 0 15H13" fill="none" stroke="${K}" stroke-width="4.4" stroke-linecap="round"/>`,
  replay: () => `<path d="M25 16a9 9 0 1 1-3-6.7" fill="none" stroke="${K}" stroke-width="4.4" stroke-linecap="round"/>` + glyph('M23.5 4.5v6h-6', 4.4),
  pencil: () => `<g transform="rotate(45 16 16)">${tshape('M13 4h6v18l-3 5-3-5z', '#ffc83d', '#ec9a17', '<path d="M13 22h6" stroke="#f6dcb0" stroke-width="5"/>', 2)}${tshape('M13 4h6v4h-6z', '#ff8aa3', '#e0496b', '', 2)}</g>`,
  check: () => glyph('M6 17l6 6 14-14', 7) + glyph('M6 17l6 6 14-14', 3.4, '#5ad68c'),
  door: () => tshape('M7 4h14v24H7z', '#c9893a', '#a86a22', '', 2.2) + `<circle cx="17.5" cy="16.5" r="1.6" fill="${K}"/>` + glyph('M23 16h7M27 12.5l3.5 3.5-3.5 3.5', 3.2),
  flag: () => `<path d="M8 4v25" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>` + tshape('M9 5h16l-4 5.5 4 5.5H9z', '#ff5f7e', '#d63d5f', '', 2),
  planet: () => planetInner('#86cf5c', '#4d9f45', '#2f86c8', '#ffc83d'),
  crown: () => tshape('M4 26 3 8l7 6 6-9 6 9 7-6-1 18z', '#ffc83d', '#ec9a17', '<circle cx="16" cy="18" r="2.6" fill="#ff5f7e"/>', 2.2),
  trophy: () => tshape('M9 5h14v6a7 7 0 0 1-14 0z', '#ffc83d', '#ec9a17', '', 2.2) + `<path d="M9 7H5a4 4 0 0 0 4 6M23 7h4a4 4 0 0 1-4 6" fill="none" stroke="${K}" stroke-width="2.2"/>` + tshape('M13 18h6l1 5h-8z', '#ffc83d', '#ec9a17', '', 2) + tshape('M9 23h14v4H9z', '#9a5a32', '#7a4024', '', 2),
  flame: () => tshape('M16 3c1.5 5 8 7 8 15a8 8 0 0 1-16 0c0-4 2-6 3.5-8 .5 2.5 2 4 3.5 4-1-5 0-8.5 1-11z', '#ff6a3d', '#e04a20', '<path d="M16 15c1 3 4 4 4 7a4 4 0 0 1-8 0c0-2 1.5-3.5 4-7z" fill="#ffc83d"/>', 2.2),
  vibra: () => tshape('M11 4h10a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', '#4aa8de', '#2f86c0', '<path d="M11 7h10v15H11z" fill="#d8f0ff"/>', 2.2) + `<path d="M5 11v10M27 11v10M2 13.5v5M30 13.5v5" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>`,
  snail: () => tshape('M4 25h20c3 0 4-2 4-4v-2l-2-1-2 3H4z', '#ffd27a', '#e8a94a', '', 2) + tshape(CIRCLE(14, 16, 8), '#ff9c5b', '#e2753a', `<path d="M14 16a3 3 0 1 1 3-3" fill="none" stroke="${K}" stroke-width="1.8"/>`, 2.2) + `<path d="M26 18l1-6M28.5 18.5l2.5-5" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/>`,
  wild: () => `<g transform="rotate(8 16 16)">${tshape('M9 4h14a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z', '#fffaf0', '#eadcc2', '', 2.2)}${tshape(starPath(16, 16.5, 7.5, 3.4), '#ff9c2b', '#e8761a', '', 1.8)}</g>`,
  deck: () => [0, 1, 2].map((i) => tshape(`M${8 + i * 3} ${8 - i * 2}h11a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H${8 + i * 3}a2 2 0 0 1-2-2V${10 - i * 2}a2 2 0 0 1 2-2z`, '#2b2b7a', '#22226a', '', 1.8)).join(''),
  lock: () => lockInner('#d3cde8', '#aea6cc'),
  bomb: () => tshape(CIRCLE(15, 19, 10.5), '#4a4373', '#332d58', '<path d="M9 16a7 7 0 0 1 5.5-4.5" stroke="#8f88c0" stroke-width="2.4" stroke-linecap="round" fill="none"/>', 2.2)
    + `<g transform="rotate(40 21 9)">${tshape('M18 6h6v5h-6z', '#8f88c0', '#6e66a3', '', 1.8)}</g><path d="M24 6c1.5-2.5 3.5-2.8 5-1.2" stroke="${K}" stroke-width="1.8" fill="none" stroke-linecap="round"/>${tshape(starPath(29, 4.5, 3.6, 1.6), '#ffd85a', '#ffb02e', '', 1.4)}`,
  album: () => tshape('M5 7a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z', '#4aa8de', '#2f86c0', '', 2.2) + tshape('M9 9h14v10H9z', '#fff6e6', '#ecdcc0', '<path d="M9 17l4-4 3 3 2-2 5 5v0H9z" fill="#5ad68c"/><circle cx="19" cy="12" r="1.8" fill="#ffc83d"/>', 1.8) + `<path d="M10 23h8" stroke="${K}" stroke-width="2" stroke-linecap="round"/>`,
  user: () => tshape(CIRCLE(16, 17, 12), '#ff9c5b', '#e2753a', '', 2.2) + `<circle cx="12" cy="16" r="1.8" fill="${K}"/><circle cx="20" cy="16" r="1.8" fill="${K}"/><path d="M12 21q4 3 8 0" fill="none" stroke="${K}" stroke-width="2" stroke-linecap="round"/>`,
};
// icon(nombre): los colores viejos (light, dark) ya no se usan; se conserva la firma.
export const icon = (name, _light, _dark, cls = '') => svg((ICONS[name] || ICONS.star)(), `i-${name} ${cls}`);
export const star = (on = true, cls = '') => svg(on ? ICONS.star() : ICONS.starOff(), `star ${cls}`);
export const coin = (cls = '') => svg(ICONS.coin(), `coin ${cls}`);

function lockInner(c, d) {
  return `<path d="M10.5 15v-4a5.5 5.5 0 0 1 11 0v4" fill="none" stroke="${K}" stroke-width="6.4"/><path d="M10.5 15v-4a5.5 5.5 0 0 1 11 0v4" fill="none" stroke="${c}" stroke-width="2.6"/>`
    + tshape('M7 15a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3z', c, d, '', 2.2)
    + `<circle cx="15" cy="19.5" r="2.2" fill="${K}"/><rect x="14" y="20" width="2" height="4.4" rx="1" fill="${K}"/>`;
}
const hsl = (h, s, l) => `hsl(${h} ${s}% ${l}%)`;
// Candado y llave del mismo color (pareja). hue = tono de la pareja.
export const lockIcon = (hue, cls = '') => svg(lockInner(hsl(hue, 75, 60), hsl(hue, 65, 45)), `lock ${cls}`);
export const keyIcon = (hue, cls = '') => svg(`<g transform="rotate(-35 16 16)">${tshape('M14 14.2h14.5v3.6H26v3.6h-3v-3.6h-2v3h-3v-3h-4z', hsl(hue, 75, 60), hsl(hue, 65, 45), '', 2)}${tshape(CIRCLE(9, 16, 6.4), hsl(hue, 75, 60), hsl(hue, 65, 45), `<circle cx="8" cy="14.2" r="2.2" fill="#fffdf7"/>`, 2.2)}</g>`, `key ${cls}`);
export const arrowIcon = (up) => svg(tshape(CIRCLE(16, 16, 13), '#ff9c5b', '#e2753a', '', 2.2) + glyph(up ? 'M14.6 22V9.5M9.6 14 14.6 9l5 5' : 'M14.6 8v12.5M9.6 16l5 5 5-5', 3.6, '#fff'), 'arrow');
export const curtainIcon = () => svg(`${tshape('M2 4h28v4H2z', '#c9893a', '#a86a22', '', 1.8)}${tshape('M3.5 8H15c-1 5-3 9-6.5 12.5h-5z', '#e8435f', '#c22c49', '', 1.8)}${tshape('M28.5 8H17c1 5 3 9 6.5 12.5h5z', '#e8435f', '#c22c49', '', 1.8)}`, 'curtain');

// ---------- Reversos ----------
// emb: planetita del centro · star: estrella grande (premios de racha: carta regalo violeta y comodín dorado).
export const BACKS = {
  clasico: { a: '#2b2b7a', b: '#22226a', emb: ['#ffc83d', '#ec9a17', '#ff9c5b', '#8fe8ff'] },
  regalo: { a: '#7b4ee6', b: '#6438c8', star: ['#fff6e6', '#e3d3ff'] },
  comodin: { a: '#ffc83d', b: '#eca21f', star: ['#ff9c2b', '#e8761a'], dots: '#fff4c7' },
};
const backCache = {};
export function cardBackURL(k = 'clasico') {
  if (backCache[k]) return backCache[k];
  const t = BACKS[k] || BACKS.clasico;
  let dots = '', seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 22; i++) dots += `<circle cx="${(14 + r() * 72).toFixed(1)}" cy="${(14 + r() * 112).toFixed(1)}" r="${(0.8 + r() * 1.3).toFixed(1)}" fill="${t.dots || '#fff'}" opacity="${(0.25 + r() * 0.4).toFixed(2)}"/>`;
  const emb = t.star
    ? `<path d="${starPath(50, 72, 27, 12.5)}" fill="${t.star[1]}" stroke="${K}" stroke-width="4" stroke-linejoin="round"/><path d="${starPath(48.5, 69.5, 24, 11)}" fill="${t.star[0]}"/>`
    : `<g transform="translate(22 42) scale(1.75)">${planetInner(...t.emb)}</g>`;
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140"><rect x="1.5" y="1.5" width="97" height="137" rx="13" fill="#fff6e6" stroke="${K}" stroke-width="3"/><rect x="8" y="8" width="84" height="124" rx="8" fill="${t.a}" stroke="${K}" stroke-width="2.5"/><path d="M9.3 100Q50 84 90.7 100V124a6.7 6.7 0 0 1-6.7 6.7H16a6.7 6.7 0 0 1-6.7-6.7z" fill="${t.b}"/>${dots}${emb}</svg>`;
  return (backCache[k] = svgUrl(s));
}
// Compatibilidad: antes el reverso dependía del tono del mundo; ahora es la baraja elegida.
export const cardBack = () => '';

// ---------- Avatar del jugador ----------
// Por ahora: círculo de color con su inicial. Los personajes llegan con la tienda.
export const AVATAR_COLORS = ['#ff9c5b', '#ff5f7e', '#8a5cf0', '#4aa8de', '#2fae6a', '#ffc83d', '#5fc7e8', '#e8758a'];
export const AVATAR_HUES = AVATAR_COLORS; // nombre viejo
export function avatarHTML(p, cls = '') {
  const c = AVATAR_COLORS[(p.avatar || 0) % AVATAR_COLORS.length];
  const ch = (p.name || '?').trim().charAt(0).toUpperCase() || '?';
  return `<span class="avatar ${cls}" style="--av:${c}">${ch.replace(/[&<>"']/g, '')}</span>`;
}
// Para dibujarlo en un lienzo (marcador del planeta).
export function avatarSVG(p, size = 128) {
  const c = AVATAR_COLORS[(p.avatar || 0) % AVATAR_COLORS.length];
  const ch = ((p.name || '?').trim().charAt(0).toUpperCase() || '?').replace(/[&<>"']/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="${c}" stroke="${K}" stroke-width="6"/><circle cx="46" cy="44" r="40" fill="#fff" opacity=".14"/><text x="50" y="66" text-anchor="middle" font-family="Lilita One" font-size="48" fill="#fff" stroke="${K}" stroke-width="8" paint-order="stroke" stroke-linejoin="round">${ch}</text></svg>`;
}

// Marcador del avatar en el mapa (SVG en la página, así usa la letra del juego): mismo dibujo que dentro del planeta.
export function avatarPin(p) {
  const c = AVATAR_COLORS[(p.avatar || 0) % AVATAR_COLORS.length];
  const ch = ((p.name || '?').trim().charAt(0).toUpperCase() || '?').replace(/[&<>"']/g, '');
  return `<svg class="pin-av" viewBox="0 0 128 160"><path d="M46 112 64 148 82 112z" fill="${K}"/><circle cx="64" cy="62" r="52" fill="${c}"/><circle cx="58" cy="54" r="46" fill="#fff" opacity=".16"/><circle cx="64" cy="62" r="52" fill="none" stroke="${K}" stroke-width="8"/><text x="64" y="66" dominant-baseline="middle" text-anchor="middle" font-family="Lilita One" font-size="58" fill="#fff" stroke="${K}" stroke-width="11" paint-order="stroke" stroke-linejoin="round">${ch}</text></svg>`;
}

// placeIcon(lugar): ahora es el planetita del mundo (ver biomes.js para los colores).
let placeColors = () => ['#86cf5c', '#4d9f45', '#2f86c8'];
export const setPlaceColors = (fn) => (placeColors = fn);
export const placeIcon = (place, cls = '') => miniPlanet(placeColors(place), `place ${cls}`);

// ---------- Cofre del jefe y caja sorpresa (cuerpo y tapa por separado, para abrirlos) ----------
// Ambos usan el mismo lienzo de 64×64: la tapa se pone encima del cuerpo y se anima sola.
const big = (inner, cls) => `<svg class="ico ${cls}" viewBox="0 0 64 64" aria-hidden="true">${inner}</svg>`;
export const chestBody = (cls = '') => big(
  tshape('M8 30h48v22a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z', '#c07a3e', '#94572a', '<path d="M8 40h48" stroke="#94572a" stroke-width="2"/>', 3)
  + tshape('M15 30h7v26h-7zM42 30h7v26h-7z', '#ffc83d', '#ec9a17', '', 2.4)
  + tshape('M27 30h10v10a5 5 0 0 1-10 0z', '#ffc83d', '#ec9a17', `<circle cx="32" cy="35" r="2" fill="${K}"/>`, 2.4), cls);
export const chestLid = (cls = '') => big(
  tshape('M8 31v-7a11 11 0 0 1 11-11h26a11 11 0 0 1 11 11v7z', '#d58a4a', '#a8652f', '<path d="M12 18q20-6 40 0" stroke="#e8a66a" stroke-width="3" fill="none"/>', 3)
  + tshape('M15 14.5h7V31h-7zM42 14.5h7V31h-7z', '#ffc83d', '#ec9a17', '', 2.4), cls);
export const boxBody = (cls = '') => big(
  tshape('M10 30h44v24a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3z', '#8a5cf0', '#6c3fd4', '<path d="M14 36h36" stroke="#a785ff" stroke-width="3"/>', 3)
  + tshape('M28 30h8v27h-8z', '#ffc83d', '#ec9a17', '', 2.4), cls);
export const boxLid = (cls = '') => big(
  tshape('M32 20c-4-9-15-11-15-5 0 4 7 5 15 5zM32 20c4-9 15-11 15-5 0 4-7 5-15 5z', '#ffc83d', '#ec9a17', '', 2.6)
  + tshape('M6 22a2 2 0 0 1 2-2h48a2 2 0 0 1 2 2v9H6z', '#a785ff', '#8a5cf0', '', 3)
  + tshape('M28 20h8v11h-8z', '#ffc83d', '#ec9a17', '', 2.4), cls);
