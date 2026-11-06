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

// Flor de cempasúchil: dos vueltas de pétalos redondos y el centro (x, y = centro, r = radio).
export const marigold = (x, y, r, a = '#ffb13d', b = '#ff8a1a') => {
  const ring = (rr, n, pr, c, off) => Array.from({ length: n }, (_, i) => { const t = ((i + off) / n) * Math.PI * 2; return `<circle cx="${(x + Math.cos(t) * rr).toFixed(2)}" cy="${(y + Math.sin(t) * rr).toFixed(2)}" r="${pr.toFixed(2)}" fill="${c}"/>`; }).join('');
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${K}"/>${ring(r * 0.62, 9, r * 0.36, b, 0)}${ring(r * 0.36, 7, r * 0.3, a, 0.5)}<circle cx="${x}" cy="${y}" r="${(r * 0.22).toFixed(2)}" fill="#e0700a"/>`;
};
// Copo de nieve: 6 brazos con ramitas, contorno de tinta. w = grosor del color.
export const flake = (x, y, r, c = '#bfe8ff', w = 2.2) => {
  const arms = [0, 60, 120, 180, 240, 300].map((a) => `<g transform="rotate(${a} ${x} ${y})"><path d="M${x} ${y}v${-r}M${x} ${y - r * 0.62}l${-r * 0.28} ${-r * 0.24}M${x} ${y - r * 0.62}l${r * 0.28} ${-r * 0.24}M${x} ${y - r * 0.3}l${-r * 0.2} ${-r * 0.18}M${x} ${y - r * 0.3}l${r * 0.2} ${-r * 0.18}"/></g>`).join('');
  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${K}" stroke-width="${w + 2.4}">${arms}</g><g stroke="${c}" stroke-width="${w}">${arms}</g></g><circle cx="${x}" cy="${y}" r="${r * 0.18}" fill="#fff" stroke="${K}" stroke-width="${w * 0.8}"/>`;
};
const ICONS = {
  coin: () => tshape(CIRCLE(16, 16, 12.5), '#ffc83d', '#ec9a17', `<circle cx="14.6" cy="13.8" r="8" fill="none" stroke="#ec9a17" stroke-width="2"/><path d="${starPath(14.6, 14.2, 4.8, 2.2)}" fill="#fff4c7"/>`),
  star: () => tshape(starPath(16, 17, 14, 6.6), '#ffc83d', '#ec9a17', `<path d="M10.5 13.5l2.2-3.6" stroke="#fff4c7" stroke-width="2.2" stroke-linecap="round"/>`),
  // Evento del mes: Día de Muertos.
  calavera: () => tshape('M16 3C8.5 3 4.5 8.3 4.5 14c0 3.8 1.8 6.4 4.5 7.6V26a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4.4c2.7-1.2 4.5-3.8 4.5-7.6C27.5 8.3 23.5 3 16 3z', '#fff6ee', '#e3d6ee',
    `${[[11, 15], [21, 15]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#ff5fa8"/><circle cx="${x}" cy="${y}" r="2.6" fill="${K}"/><circle cx="${x - 0.8}" cy="${y - 0.9}" r=".8" fill="#fff"/>`).join('')}<path d="M16 18.6l-1.6 2.6h3.2z" fill="${K}"/><path d="M12.5 23.5v3M16 23.5v3M19.5 23.5v3" stroke="${K}" stroke-width="1.3" stroke-linecap="round"/><path d="M10.5 23.2h11" stroke="${K}" stroke-width="1.3" stroke-linecap="round"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(16 + Math.cos((a * Math.PI) / 180) * 2.1).toFixed(1)}" cy="${(8 + Math.sin((a * Math.PI) / 180) * 2.1).toFixed(1)}" r="1.5" fill="#ffb13d"/>`).join('')}<circle cx="16" cy="8" r="1.1" fill="#5fd1c5"/>`, 2.2),
  cempasuchil: () => `<path d="M16 22v8" stroke="${K}" stroke-width="4.4" stroke-linecap="round"/><path d="M16 22v8" stroke="#4fae4a" stroke-width="2" stroke-linecap="round"/>` + marigold(16, 14, 11),
  tkMuertos: () => `<g transform="rotate(-12 16 16)">${tshape('M3 10.5a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v3a2.6 2.6 0 0 0 0 5.2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2.6 2.6 0 0 0 0-5.2z', '#ff9c1a', '#e0700a', `<path d="M21 9v14" stroke="#fff" stroke-width="1.8" stroke-dasharray="2 2"/>${marigold(11.5, 15.8, 5, '#fff6e6', '#ffd6a0')}`)}</g>`,
  // Evento del mes: Navidad (esfera = ícono del evento, copo = adorno de botones, boleto rojo).
  esfera: () => `<path d="M16 5.5V3.2q0-1.6 2.2-1.6" fill="none" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/>` + tshape(CIRCLE(16, 18.5, 11), '#e8434f', '#c22c3c',
    `<path d="M5.6 15.6q10.4 4.4 20.8 0" stroke="#fff3d6" stroke-width="2.2" fill="none"/><path d="M5.4 21.8q10.6 4.4 21.2 0" stroke="#ffc83d" stroke-width="2.2" fill="none"/>${[[10.5, 18.9], [16, 20.2], [21.5, 18.9]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff3d6"/>`).join('')}<ellipse cx="11" cy="12.6" rx="2.4" ry="1.3" fill="#fff" opacity=".65" transform="rotate(-35 11 12.6)"/>`, 2.2)
    + tshape('M12.6 5h6.8v3.6h-6.8z', '#ffc83d', '#ec9a17', '', 1.8),
  copo: () => flake(16, 16, 13),
  tkNavidad: () => `<g transform="rotate(-12 16 16)">${tshape('M3 10.5a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v3a2.6 2.6 0 0 0 0 5.2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2.6 2.6 0 0 0 0-5.2z', '#e8434f', '#c22c3c', `<path d="M21 9v14" stroke="#fff" stroke-width="1.8" stroke-dasharray="2 2"/>`)}${flake(11.5, 15.8, 5.2, '#fff6e6', 1.2)}</g>`,
  // Evento del mes: Día de Reyes (rosca = ícono del evento, corona = adorno de botones, boleto morado).
  rosca: () => tshape(ELL(16, 17, 13.5, 10), '#e8a654', '#c9853a', `<ellipse cx="16" cy="17" rx="6.2" ry="3.6" fill="#7a4a2a" stroke="${K}" stroke-width="1.6"/>${[[16, 8.6, 0, '#e8434f'], [25.6, 12.4, 38, '#4fb85e'], [26.4, 21, -30, '#ffc83d'], [16, 25.6, 0, '#e8434f'], [5.6, 21, 30, '#4fb85e'], [6.4, 12.4, -38, '#ffc83d']].map(([x, y, a, c]) => `<rect x="${x - 3}" y="${y - 1.4}" width="6" height="2.8" rx="1.4" fill="${c}" stroke="${K}" stroke-width="1.1" transform="rotate(${a} ${x} ${y})"/>`).join('')}${[[11, 10.6], [21, 10.6], [24, 16.4], [8, 16.4], [11, 23.6], [21, 23.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#fff6e6"/>`).join('')}`, 2.2),
  tkReyes: () => `<g transform="rotate(-12 16 16)">${tshape('M3 10.5a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v3a2.6 2.6 0 0 0 0 5.2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2.6 2.6 0 0 0 0-5.2z', '#8a5cf0', '#6c3fd4', `<path d="M21 9v14" stroke="#fff" stroke-width="1.8" stroke-dasharray="2 2"/><g transform="translate(6.3 10.6) scale(.34)">${ICONS.crown()}</g>`)}</g>`,
  // Evento del mes: Amor y Amistad (corazón = ícono del evento, sobre = adorno de botones, boleto rosa).
  corazon: () => tshape('M16 27.5C6 21 3 15.5 3.6 11.2 4.3 6.4 9.4 4.4 13 7.2c1.3 1 2.3 2.2 3 3.4.7-1.2 1.7-2.4 3-3.4 3.6-2.8 8.7-.8 9.4 4 .6 4.3-2.4 9.8-12.4 16.3z', '#ff4f6e', '#d6304f', '<ellipse cx="9.6" cy="10.4" rx="2.6" ry="1.6" fill="#fff" opacity=".7" transform="rotate(-40 9.6 10.4)"/>', 2.2),
  sobre: () => tshape('M3.5 9.5a2 2 0 0 1 2-2h21a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-21a2 2 0 0 1-2-2z', '#fff6ee', '#f0dccb', `<path d="M4 9l12 9 12-9" fill="none" stroke="${K}" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 24l8.6-7.4M28 24l-8.6-7.4" stroke="${K}" stroke-width="1.4" opacity=".5"/><g transform="translate(10.6 12.6) scale(.34)">${tshape('M16 27.5C6 21 3 15.5 3.6 11.2 4.3 6.4 9.4 4.4 13 7.2c1.3 1 2.3 2.2 3 3.4.7-1.2 1.7-2.4 3-3.4 3.6-2.8 8.7-.8 9.4 4 .6 4.3-2.4 9.8-12.4 16.3z', '#ff4f6e', '#d6304f', '', 4)}</g>`, 2.2),
  tkAmor: () => `<g transform="rotate(-12 16 16)">${tshape('M3 10.5a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v3a2.6 2.6 0 0 0 0 5.2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2.6 2.6 0 0 0 0-5.2z', '#ff7ab8', '#e8559a', `<path d="M21 9v14" stroke="#fff" stroke-width="1.8" stroke-dasharray="2 2"/><g transform="translate(6.6 10.8) scale(.34)">${tshape('M16 27.5C6 21 3 15.5 3.6 11.2 4.3 6.4 9.4 4.4 13 7.2c1.3 1 2.3 2.2 3 3.4.7-1.2 1.7-2.4 3-3.4 3.6-2.8 8.7-.8 9.4 4 .6 4.3-2.4 9.8-12.4 16.3z', '#fff6ee', '#ffd6ec', '', 4)}</g>`)}</g>`,
  // Evento del mes: Primavera (tulipán = ícono del evento, mariposa = adorno de botones, boleto verde).
  tulipan: () => `<path d="M16 16v13" stroke="${K}" stroke-width="4.4" stroke-linecap="round"/><path d="M16 16v13" stroke="#4fae4a" stroke-width="2" stroke-linecap="round"/>`
    + tshape('M16 29c-1-6-6-9-10-9 2 5 6 8 10 9z', '#5fbf5a', '#3f9a46', '', 1.8) + tshape('M16 29c1-6 6-9 10-9-2 5-6 8-10 9z', '#5fbf5a', '#3f9a46', '', 1.8)
    + tshape('M8 4.5l4 4 4-5.5 4 5.5 4-4V12a8 8 0 0 1-16 0z', '#ff5f7e', '#e0496b', '<path d="M16 3v14" stroke="#e0496b" stroke-width="1.4"/><ellipse cx="11.6" cy="11" rx="1.4" ry="2.6" fill="#fff" opacity=".55"/>', 2.2),
  mariposa: () => tshape('M16 15C12 3.5 2.8 4 3.4 10.6 3.9 15 10 16.2 16 16z', '#b36bff', '#8a4ad8', '<circle cx="8.6" cy="10" r="2.2" fill="#fff6ee"/>', 1.8)
    + tshape('M16 15C20 3.5 29.2 4 28.6 10.6 28.1 15 22 16.2 16 16z', '#b36bff', '#8a4ad8', '<circle cx="23.4" cy="10" r="2.2" fill="#fff6ee"/>', 1.8)
    + tshape('M16 16C10 16 5 19 6.4 23.6 7.8 27.4 13 24.4 16 18z', '#ff7ab8', '#e8559a', '', 1.8) + tshape('M16 16C22 16 27 19 25.6 23.6 24.2 27.4 19 24.4 16 18z', '#ff7ab8', '#e8559a', '', 1.8)
    + `<path d="M16 9v15" stroke="${K}" stroke-width="3.2" stroke-linecap="round"/><path d="M15.4 9.4Q13.6 5.4 11.2 4.4M16.6 9.4Q18.4 5.4 20.8 4.4" stroke="${K}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
  tkPrimavera: () => `<g transform="rotate(-12 16 16)">${tshape('M3 10.5a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v3a2.6 2.6 0 0 0 0 5.2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2.6 2.6 0 0 0 0-5.2z', '#47c27a', '#2f9e5c', `<path d="M21 9v14" stroke="#fff" stroke-width="1.8" stroke-dasharray="2 2"/><g transform="translate(6.4 10.6) scale(.34)">${ICONS.tulipan()}</g>`)}</g>`,
  // Evento del mes: Verano (sandía = ícono del evento, sol con lentes = adorno de botones, boleto turquesa).
  sandia: () => `<g transform="rotate(-14 16 16)">${tshape('M2.5 11.5h27a13.5 13.5 0 0 1-27 0z', '#4fb85e', '#2f8a42',
    `<path d="M4.8 11.5h22.4a11.2 11.2 0 0 1-22.4 0z" fill="#f2ffe0"/><path d="M6.4 11.5h19.2a9.6 9.6 0 0 1-19.2 0z" fill="#ff4f6e"/>${[[11, 14.2], [16, 16.6], [21, 14.2], [13.4, 18.6], [18.6, 18.6]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1" ry="1.5" fill="${K}"/>`).join('')}<path d="M8.4 13q1 3 3.4 4.6" stroke="#ffb0bf" stroke-width="1.6" fill="none" stroke-linecap="round"/>`, 2.2)}</g>`,
  sol: () => `${Array.from({ length: 8 }, (_, i) => `<path d="M16 1.6l2.6 5.2h-5.2z" fill="#ffb02e" stroke="${K}" stroke-width="1.5" stroke-linejoin="round" transform="rotate(${i * 45} 16 16)"/>`).join('')}`
    + tshape(CIRCLE(16, 16, 9), '#ffd23d', '#f0a81a', `<path d="M10.2 14.6c0 2.4 1.2 3.4 2.6 3.4s2.4-1 2.6-3.4zM16.6 14.6c.2 2.4 1.2 3.4 2.6 3.4s2.6-1 2.6-3.4z" fill="${K}"/><path d="M8 14.6h16" stroke="${K}" stroke-width="1.4"/><path d="M12.2 15.6l1.2 1" stroke="#7fe0ff" stroke-width="1" stroke-linecap="round"/><path d="M13.4 20.6q2.6 2 5.2 0" stroke="${K}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`, 1.8),
  tkVerano: () => `<g transform="rotate(-12 16 16)">${tshape('M3 10.5a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v3a2.6 2.6 0 0 0 0 5.2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2.6 2.6 0 0 0 0-5.2z', '#38c2dd', '#1f8fc8', `<path d="M21 9v14" stroke="#fff" stroke-width="1.8" stroke-dasharray="2 2"/><g transform="translate(5.8 9.6) scale(.38)">${ICONS.sandia()}</g>`)}</g>`,
  // Evento del mes: Fiestas Patrias (sombrero de charro = ícono del evento, chile = adorno de botones, boleto verde tricolor).
  sombrero: () => tshape(ELL(16, 21.5, 14.5, 5.6), '#f2d38a', '#d9b060', `<path d="M2.6 21.5a13.4 4.6 0 0 0 26.8 0" fill="none" stroke="#e8434f" stroke-width="1.6"/><path d="M4 23.4a12 3.6 0 0 0 24 0" fill="none" stroke="#2f9e5c" stroke-width="1.2" stroke-dasharray="1.6 1.6"/>`, 2)
    + tshape('M9.6 20.6c0-8.2 2.8-14 6.4-14s6.4 5.8 6.4 14q-6.4 2.4-12.8 0z', '#f2d38a', '#d9b060', `<path d="M9.8 17.2q6.2 2 12.4 0" stroke="#e8434f" stroke-width="2.4" fill="none"/><path d="M10.4 15.2q5.6 1.6 11.2 0" stroke="#2f9e5c" stroke-width="1.2" fill="none"/>${[[12.4, 18], [16, 18.6], [19.6, 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#ffd27a"/>`).join('')}`, 2),
  chile: () => `<g transform="rotate(-20 16 16)">${tshape('M10 9.5c4 1.6 5.6 6 8.2 11.6 2.2 4.6 5.4 6.6 9.2 6.2-3.6 3.4-10.6 3.2-15.2-1.8C8.2 21 7.8 13.8 10 9.5z', '#e8434f', '#c22c3c', '<path d="M12 13q.6 5 3.4 8.6" stroke="#ff9aa2" stroke-width="1.8" fill="none" stroke-linecap="round"/>', 2)}${tshape('M7.6 10.6c.6-2 2.6-2.8 4.6-2.2l1.4.8c-1 1.6-3.4 2.4-6 1.4z', '#4fb85e', '#2f8a42', '', 1.6)}<path d="M10.8 8.8c-.4-2.4.6-4.6 2.8-5.6" stroke="${K}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M10.8 8.8c-.4-2.4.6-4.6 2.8-5.6" stroke="#4fb85e" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`,
  tkPatrias: () => `<g transform="rotate(-12 16 16)">${tshape('M3 10.5a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v3a2.6 2.6 0 0 0 0 5.2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2.6 2.6 0 0 0 0-5.2z', '#47c27a', '#2f9e5c', `<path d="M21 9v14" stroke="#fff" stroke-width="1.8" stroke-dasharray="2 2"/><rect x="7" y="11.4" width="3" height="9" fill="#2f9e5c" stroke="${K}" stroke-width="1"/><rect x="10" y="11.4" width="3" height="9" fill="#fff6ee" stroke="${K}" stroke-width="1"/><rect x="13" y="11.4" width="3" height="9" fill="#e8434f" stroke="${K}" stroke-width="1"/>`)}</g>`,
  // Evento del mes: Halloween (calabaza = ícono del evento, murciélago = adorno de botones, boleto morado).
  calabaza: () => tshape('M14.4 9.6l.6-5.4h3.2l-.8 5.4z', '#5a8a3a', '#3f6a2a', '', 1.8)
    + tshape(ELL(16, 18.6, 13.4, 10.6), '#ff8a1a', '#e0700a', `<path d="M16 8.4q-5 10 0 20.4M16 8.4q5 10 0 20.4M10 9.6q-5 9 0 18M22 9.6q5 9 0 18" fill="none" stroke="#e0700a" stroke-width="1.4"/><path d="M8.6 15.6l3.6-2.4 1 4.2zM23.4 15.6l-3.6-2.4-1 4.2z" fill="#ffd23d" stroke="${K}" stroke-width="1.2" stroke-linejoin="round"/><path d="M8.8 20.4q7.2 5.6 14.4 0l-2 3.4-1.8-1.6-1.6 2.2-1.8-1.8-1.8 1.8-1.6-2.2-1.8 1.6z" fill="#ffd23d" stroke="${K}" stroke-width="1.2" stroke-linejoin="round"/>`, 2.2),
  murcielago: () => tshape('M16 12.4c-1.8 0-2.8 1-3.4 2.4C10 12.4 6 11.6 2 13.6c2 1 3 3 3 5.2 2-1.4 4-1.4 5.4 0 1-1.4 2.6-2 4-1.2h3.2c1.4-.8 3-.2 4 1.2 1.4-1.4 3.4-1.4 5.4 0 0-2.2 1-4.2 3-5.2-4-2-8-1.2-10.6 1.2-.6-1.4-1.6-2.4-3.4-2.4z', '#5a4a8a', '#3f3270', '', 1.8)
    + tshape('M13 13.6l-.4-4 2.2 2.4h2.4l2.2-2.4-.4 4c0 2.6-1.4 4.4-3 4.4s-3-1.8-3-4.4z', '#5a4a8a', '#3f3270', '<circle cx="14.6" cy="14" r="1" fill="#ffd23d"/><circle cx="17.4" cy="14" r="1" fill="#ffd23d"/>', 1.6),
  tkHalloween: () => `<g transform="rotate(-12 16 16)">${tshape('M3 10.5a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v3a2.6 2.6 0 0 0 0 5.2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2.6 2.6 0 0 0 0-5.2z', '#8a5cf0', '#6c3fd4', `<path d="M21 9v14" stroke="#fff" stroke-width="1.8" stroke-dasharray="2 2"/><g transform="translate(5.6 9.4) scale(.38)">${ICONS.calabaza()}</g>`)}</g>`,
  // Festividad: Día de la Candelaria (tamal = ícono, jarrito de atole = adorno).
  tamal: () => `<g transform="rotate(-32 16 16) translate(16 16) scale(.94) translate(-16 -16)">${tshape('M8 27.5C4.6 20 6.4 9.6 16 3.4c9.6 6.2 11.4 16.6 8 24.1Q16 30.6 8 27.5z', '#c8d86a', '#a8bc4a', '<path d="M16 6v21M11.6 9.6Q9.6 18 11.4 27M20.4 9.6Q22.4 18 20.6 27" stroke="#98ac3e" stroke-width="1.2" fill="none"/>', 2.2)}${tshape('M10.6 21.6C9.8 15.6 12 10.4 16 8c4 2.4 6.2 7.6 5.4 13.6Q16 24 10.6 21.6z', '#ffe7a0', '#f2cf72', '<path d="M13.6 13.8q2.4-1.6 4.8 0" stroke="#e8434f" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="13.6" cy="17.4" rx="1.2" ry="2" fill="#fff6dc"/>', 1.8)}<path d="M8.4 24.4Q16 26.8 23.6 24.4" fill="none" stroke="${K}" stroke-width="4.2" stroke-linecap="round"/><path d="M8.4 24.4Q16 26.8 23.6 24.4" fill="none" stroke="#e8c070" stroke-width="2" stroke-linecap="round"/></g>`,
  atole: () => `${['M11 8.6q-1.6-2.4 0-4.6', 'M16 7.6q-1.6-2.6 0-5', 'M21 8.6q-1.6-2.4 0-4.6'].map((d) => `<path d="${d}" fill="none" stroke="#c9bff0" stroke-width="1.8" stroke-linecap="round"/>`).join('')}`
    + `<path d="M24.6 14.6h1.8a4 4 0 0 1 0 8h-2" fill="none" stroke="${K}" stroke-width="4.4" stroke-linecap="round"/><path d="M24.6 14.6h1.8a4 4 0 0 1 0 8h-2" fill="none" stroke="#d9783f" stroke-width="2" stroke-linecap="round"/>`
    + tshape('M6.4 11h19.2l-1.6 13.2a4 4 0 0 1-4 3.6h-8a4 4 0 0 1-4-3.6z', '#d9783f', '#b85a28', '<path d="M7.4 17.6h17.2" stroke="#fff1d6" stroke-width="1.6" stroke-dasharray="2.4 1.8"/>', 2.2)
    + `<ellipse cx="16" cy="11.2" rx="9.6" ry="2.2" fill="#a8623a" stroke="${K}" stroke-width="1.8"/>`,
  // Festividad: Día del Taco (taco = ícono, rodaja de limón = adorno).
  taco: () => `<g transform="rotate(-10 16 16)">${tshape('M3.6 14.6q1.8-4.6 5-2.6 1.8-4.2 5.2-1.4 3-4 6 .2 3-3.2 5.4.8 3-1.2 3.2 3z', '#6fc25a', '#4fa84a', '', 1.8)}`
    + `${[[9, 13.4], [15.6, 12.2], [22, 13.2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.3" fill="#e8434f" stroke="${K}" stroke-width="1.4"/>`).join('')}${[[12.4, 14], [19, 13.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff6ee" stroke="${K}" stroke-width="1"/>`).join('')}`
    + `${tshape('M3 15h26a13 12 0 0 1-26 0z', '#ffd27a', '#e8b04a', `<path d="M5.6 16.4a10.4 9 0 0 0 20.8 0" fill="none" stroke="#f2c060" stroke-width="1.4"/>${[[10, 21], [16, 24], [22, 20], [13, 18.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#c98a3a"/>`).join('')}`, 2.2)}</g>`,
  limon: () => tshape(CIRCLE(16, 16, 12.5), '#7cc04f', '#5fa83a', `<circle cx="16" cy="16" r="9.6" fill="#e8f7b0"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M16 16 ${(16 + Math.cos((a * Math.PI) / 180) * 9).toFixed(1)} ${(16 + Math.sin((a * Math.PI) / 180) * 9).toFixed(1)}" stroke="#bfe080" stroke-width="1.4"/>`).join('')}<circle cx="16" cy="16" r="1.6" fill="#fff"/><path d="M8.4 9.6q2.4-2.6 5.6-3.2" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/>`, 2.2),
  // Festividad: Día de la Tierra (la Tierra con un brote = ícono, brote = adorno).
  tierra: () => `<g transform="translate(16 17.6) scale(.88) translate(-16 -16)">${tshape(CIRCLE(16, 18, 11.5), '#4aa8de', '#2f86c0', '<path d="M7 14c3-2 5 1 7 0s1-5 5-4c2 .5 2 3 4 3l2 1c-1 3-4 3-5 6s-3 4-5 2-1-4-4-3-4 0-5-2z" fill="#6fc25a"/><path d="M15 25c2-1 4 0 5 2l-3 1z" fill="#6fc25a"/><ellipse cx="11" cy="12.6" rx="2.6" ry="1.4" fill="#fff" opacity=".55" transform="rotate(-35 11 12.6)"/>', 2.2)}`
    + `<path d="M16 7V2.6" stroke="${K}" stroke-width="3.6" stroke-linecap="round"/><path d="M16 7V2.6" stroke="#4fa84a" stroke-width="1.6" stroke-linecap="round"/>`
    + tshape('M16 4.4Q14 -.6 8.6 .4Q9.8 5.2 16 4.4z', '#6fc25a', '#4fa84a', '', 1.6) + tshape('M16 3.6Q18.4 -.8 23.4 .8Q21.8 5 16 3.6z', '#8fd46a', '#6fc25a', '', 1.6) + '</g>',
  brote: () => tshape('M5 25.6Q16 19.6 27 25.6Q27 30 16 30T5 25.6z', '#a86a3a', '#83501a', '', 2)
    + `<path d="M16 25V13" stroke="${K}" stroke-width="4.4" stroke-linecap="round"/><path d="M16 25V13" stroke="#4fa84a" stroke-width="2" stroke-linecap="round"/>`
    + tshape('M16 15Q12 6 3.6 7.6Q5.6 16 16 15z', '#6fc25a', '#4fa84a', '<path d="M15 14Q10 10 6.6 9.6" stroke="#4fa84a" stroke-width="1.2" fill="none"/>', 2) + tshape('M16 13Q19 4 28.4 4.4Q27 13.6 16 13z', '#8fd46a', '#6fc25a', '<path d="M17 12.4Q22 8 25.6 6.8" stroke="#6fc25a" stroke-width="1.2" fill="none"/>', 2),
  // Festividad: Día del Niño (piñata de estrella = ícono, globito = adorno).
  pinata: () => [-90, -18, 54, 126, 198].map((d, i) => {
      const a = (d * Math.PI) / 180, b = 0.62, c = ['#ffc83d', '#47c27a', '#4aa8de', '#ff9c5b', '#b36bff'][i], sh = ['#ec9a17', '#2f9e5c', '#2f86c0', '#e2753a', '#8a4ad8'][i];
      const P2 = (r, aa) => `${(16 + Math.cos(aa) * r).toFixed(1)} ${(17 + Math.sin(aa) * r).toFixed(1)}`;
      return tshape(`M${P2(6.6, a - b)}L${P2(14.4, a)}L${P2(6.6, a + b)}z`, c, sh, '', 1.8) + `<path d="M${P2(14.4, a)}l${(Math.cos(a + 0.5) * 2.6).toFixed(1)} ${(Math.sin(a + 0.5) * 2.6).toFixed(1)}M${P2(14.4, a)}l${(Math.cos(a - 0.5) * 2.6).toFixed(1)} ${(Math.sin(a - 0.5) * 2.6).toFixed(1)}" stroke="#ff5f7e" stroke-width="1.6" stroke-linecap="round"/>`;
    }).join('')
    + tshape(CIRCLE(16, 17, 7.4), '#ff7ab8', '#e8559a', '<path d="M8.6 15h14.8M8.8 19h14.4" stroke="#fff0f6" stroke-width="1.4"/><ellipse cx="13" cy="13.6" rx="1.8" ry="1" fill="#fff" opacity=".6"/>', 2.2),
  globito: () => `<path d="M16 23.6Q14 27 16.6 29.6" fill="none" stroke="${K}" stroke-width="1.4" stroke-linecap="round"/>`
    + tshape('M16 3.4C22.4 3.4 25.4 8.4 25.4 12.6 25.4 18.4 20.4 22.6 16 23.6 11.6 22.6 6.6 18.4 6.6 12.6 6.6 8.4 9.6 3.4 16 3.4z', '#ff5f7e', '#d63d5f', '<ellipse cx="12" cy="9.4" rx="2" ry="3" fill="#fff" opacity=".6" transform="rotate(25 12 9.4)"/>', 2.2)
    + tshape('M14.4 23.4h3.2l.8 2.2h-4.8z', '#ff5f7e', '#d63d5f', '', 1.6),
  // Festividad: Día de las Madres (clavel = ícono, regalito = adorno).
  clavel: () => `<path d="M16 29.6V17" stroke="${K}" stroke-width="4.4" stroke-linecap="round"/><path d="M16 29.6V17" stroke="#4fa84a" stroke-width="2" stroke-linecap="round"/>`
    + tshape('M16 26Q10.4 26.4 8 21.2Q13.6 20.4 16 24.4z', '#6fc25a', '#4fa84a', '', 1.6)
    + tshape('M16 24Q21.2 23.6 24 18.6Q18.4 18.4 16 22.4z', '#8fd46a', '#6fc25a', '', 1.6)
    + tshape('M12.2 15.4h7.6l-1.6 4.8h-4.4z', '#6fc25a', '#4fa84a', '', 1.6)
    + tshape('M5.4 14Q4.2 8.4 8.4 7Q9.2 3.2 12.8 4.4Q16 1.4 19.2 4.4Q22.8 3.2 23.6 7Q27.8 8.4 26.6 14Q16 19.6 5.4 14z', '#ff5f8f', '#e0406f', '<path d="M8.4 11.8q1.9-2 3.8 0t3.8 0 3.8 0 3.8 0M11.2 8.2q1.6-1.8 3.4 0t3.4 0" stroke="#b8285a" stroke-width="1.3" fill="none" stroke-linecap="round"/><ellipse cx="10.6" cy="7.8" rx="1.8" ry="1" fill="#fff" opacity=".55"/>', 2.2),
  regalito: () => ICONS.gift().replace(/#47c27a/g, '#ff7ab8').replace(/#2f9e5c/g, '#e8559a').replace(/#5ad68c/g, '#ff9cc8').replace(/#3fb873/g, '#ff7ab8'),
  // Festividad: Día del Padre (corbata = ícono, bigote = adorno).
  corbata: () => tshape('M6.6 3.4 12.6 4l1.6 5.4-3.8 2.6z', '#fff6ee', '#e3d8c4', '', 1.8) + tshape('M25.4 3.4 19.4 4l-1.6 5.4 3.8 2.6z', '#fff6ee', '#e3d8c4', '', 1.8)
    + tshape('M13.6 9.4h4.8l3.6 14.2L16 29.6l-6-6z', '#3f8ad8', '#2a6fb8', '<path d="M9 18.6l13-6.4M9 24.2l13-6.4" stroke="#ffc83d" stroke-width="1.8"/>', 2.2)
    + tshape('M12.2 3.6h7.6l-1.4 6.2h-4.8z', '#3f8ad8', '#2a6fb8', '<path d="M13.6 5.4h2.4" stroke="#9fd0ff" stroke-width="1.4" stroke-linecap="round"/>', 2.2),
  bigote: () => tshape('M16 12.4C14 9.8 10.6 9.8 8.6 12.2 6.6 14.6 4.4 15 2.6 13.6 3 18.2 7.6 20.4 11.6 18.6 13.6 17.7 15 16.4 16 15.2 17 16.4 18.4 17.7 20.4 18.6 24.4 20.4 29 18.2 29.4 13.6 27.6 15 25.4 14.6 23.4 12.2 21.4 9.8 18 9.8 16 12.4z', '#8a5a3a', '#6e4026', '<path d="M9.6 13.8q2.4-1.6 4.4 0M18 13.8q2.4-1.6 4.4 0" stroke="#b07a52" stroke-width="1.3" fill="none" stroke-linecap="round"/>', 2.2),
  // Festividad: Día del Gato (gatito = ícono, estambre = adorno).
  gatito: () => tshape('M6.6 14.4 7.6 3.4 15 9.4z', '#a9b0c8', '#868ea8', '<path d="M8.6 11 9.2 6.6 12.4 9.2z" fill="#ff9cb4"/>', 2) + tshape('M25.4 14.4 24.4 3.4 17 9.4z', '#a9b0c8', '#868ea8', '<path d="M23.4 11 22.8 6.6 19.6 9.2z" fill="#ff9cb4"/>', 2)
    + tshape('M16 7.6C23 7.6 27 12.2 27 18 27 24.2 22 28.4 16 28.4S5 24.2 5 18C5 12.2 9 7.6 16 7.6z', '#a9b0c8', '#868ea8', '<path d="M13.6 9v3.4M16 8.6v4M18.4 9v3.4" stroke="#6e7690" stroke-width="1.5" stroke-linecap="round"/>', 2.2)
    + `<circle cx="11.6" cy="17.6" r="1.9" fill="${K}"/><circle cx="20.4" cy="17.6" r="1.9" fill="${K}"/><circle cx="11" cy="16.9" r=".7" fill="#fff"/><circle cx="19.8" cy="16.9" r=".7" fill="#fff"/>`
    + `<path d="M14.8 21h2.4L16 22.4z" fill="#ff7a9a" stroke="${K}" stroke-width="1" stroke-linejoin="round"/><path d="M16 22.4q-1.2 1.6-2.8.4M16 22.4q1.2 1.6 2.8.4M9.6 21.6 3.6 20.8M9.6 23.4 4 24.4M22.4 21.6 28.4 20.8M22.4 23.4 28 24.4" fill="none" stroke="${K}" stroke-width="1.1" stroke-linecap="round"/>`,
  estambre: () => `<path d="M8 23.6Q3 27 6.4 29.6Q9 31 11.6 29" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round"/><path d="M8 23.6Q3 27 6.4 29.6Q9 31 11.6 29" fill="none" stroke="#ff7ab8" stroke-width="1.4" stroke-linecap="round"/>`
    + tshape(CIRCLE(17, 15, 11), '#ff7ab8', '#e8559a', '<path d="M8 10q9 2 15 13M7 15q10 0 16 9M10 6.4q9 4 13 15M21 5.6q-6 9-12 16M26.6 10q-8 6-14 15" stroke="#c23d7f" stroke-width="1.2" fill="none"/><ellipse cx="12.6" cy="9.6" rx="2.2" ry="1.2" fill="#fff" opacity=".5" transform="rotate(-30 12.6 9.6)"/>', 2.2),
  // Festividad: Día del Perro (cachorro = ícono, hueso = adorno).
  cachorro: () => tshape('M16 7C23 7 26.6 11.6 26.6 17.4 26.6 24 22 28.6 16 28.6S5.4 24 5.4 17.4C5.4 11.6 9 7 16 7z', '#f6d4a0', '#e8b678', '<path d="M19 10.6a4.6 4 0 1 1 0 8 4.6 4 0 1 1 0-8z" fill="#d9a066"/>', 2.2)
    + tshape('M8.4 8.6Q2 9 2.6 19.4Q5.6 22 9 16z', '#8a5a3a', '#6a4028', '', 2) + tshape('M23.6 8.6Q30 9 29.4 19.4Q26.4 22 23 16z', '#8a5a3a', '#6a4028', '', 2)
    + `<circle cx="12" cy="16.6" r="1.9" fill="${K}"/><circle cx="20" cy="16.6" r="1.9" fill="${K}"/><circle cx="11.4" cy="15.9" r=".7" fill="#fff"/><circle cx="19.4" cy="15.9" r=".7" fill="#fff"/>`
    + `<ellipse cx="16" cy="21" rx="2.4" ry="1.7" fill="${K}"/><path d="M16 22.6q-1.6 1.8-3.2.6M16 22.6q1.6 1.8 3.2.6" fill="none" stroke="${K}" stroke-width="1.1" stroke-linecap="round"/>`
    + tshape('M14.4 23.8h3.2v2.2a1.6 1.6 0 0 1-3.2 0z', '#ff7a9a', '#e0507e', '', 1),
  hueso: () => {
    const sh = (g, c, t = '') => `<g fill="${c}" ${t}>${[[7.4, 11.8], [7.4, 20.2], [24.6, 11.8], [24.6, 20.2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${3.8 + g}"/>`).join('')}<rect x="7.4" y="${13.2 - g}" width="17.2" height="${5.6 + 2 * g}"/></g>`;
    return sh(1.1, K) + sh(0, '#e8d8b8') + sh(-0.5, '#fff6e6', 'transform="translate(-.5 -.8)"') + '<path d="M9 15h12" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".9"/>';
  },
  // Festividad: Día del Gamer (control = ícono, corazón de píxeles = adorno).
  control: () => tshape('M10 9h12c4.2 0 6.6 2.8 7.2 6.8l.9 6c.5 3.2-2.4 5-4.6 3.1L22.2 22H9.8l-3.3 2.9c-2.2 1.9-5.1.1-4.6-3.1l.9-6C3.4 11.8 5.8 9 10 9z', '#5a4f8a', '#3f3570',
    '<path d="M7.6 12.4h2.8V15h2.6v2.8h-2.6v2.6H7.6v-2.6H5V15h2.6z" fill="#d8d2f0"/><path d="M13.4 12.6h5.2" stroke="#8a80c0" stroke-width="1.4" stroke-linecap="round"/>', 2.2)
    + [[22.4, 13, '#ff5f7e'], [25.4, 15.8, '#5fd1f0'], [19.4, 15.8, '#ffc83d'], [22.4, 18.6, '#7fd36a']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="${c}" stroke="${K}" stroke-width=".9"/>`).join(''),
  pixcora: () => {
    const rows = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'], c = 3.6, x0 = 3.4, y0 = 6;
    const cells = (g, f) => rows.map((r, j) => [...r].map((ch, i) => (ch === 'X' ? `<rect x="${(x0 + i * c - g).toFixed(1)}" y="${(y0 + j * c - g).toFixed(1)}" width="${(c + 2 * g).toFixed(1)}" height="${(c + 2 * g).toFixed(1)}" fill="${f(i, j)}"/>` : '')).join('')).join('');
    return cells(1.4, () => K) + cells(0, (i, j) => (i >= 5 - j || j >= 4 ? '#d63d5f' : '#ff5f7e')) + `<rect x="${x0 + c}" y="${y0 + c}" width="${c}" height="${c}" fill="#ffd0da"/>`;
  },
  // Festividad: Día del Programador (laptop = ícono, llaves { } = adorno).
  laptop: () => tshape('M7 5.6h18a2 2 0 0 1 2 2v13.2H5V7.6a2 2 0 0 1 2-2z', '#5a4f8a', '#3f3570', '<path d="M7.8 8.2h16.4v10H7.8z" fill="#163a26"/><path d="M9.8 11h5M9.8 13.6h8.4M11.8 16.2h3.6" stroke="#7fe8a0" stroke-width="1.4" stroke-linecap="round"/><path d="M17.4 15.2h1.8v2h-1.8z" fill="#7fe8a0"/>', 2.2)
    + tshape('M2 20.8h28l-2.2 4.4a2 2 0 0 1-1.8 1.1H6a2 2 0 0 1-1.8-1.1z', '#d8d2f0', '#a9a2cc', '<path d="M13 22.6h6" stroke="#7a72a8" stroke-width="1.4" stroke-linecap="round"/>', 2.2),
  llaves: () => ['M12.4 5C9.4 5 8.4 6.4 8.4 9v3.4c0 2-1 3.2-3 3.6 2 .4 3 1.6 3 3.6V23c0 2.6 1 4 4 4', 'M19.6 5c3 0 4 1.4 4 4v3.4c0 2 1 3.2 3 3.6-2 .4-3 1.6-3 3.6V23c0 2.6-1 4-4 4']
    .map((d) => `<path d="${d}" fill="none" stroke="${K}" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#5ad68c" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`).join('')
    + `<path d="M11.6 6.6q-1.4.4-1.6 2" fill="none" stroke="#c8f5d8" stroke-width="1.1" stroke-linecap="round"/>`,
  // Festividad: Día de los Inocentes (gorro de bufón = ícono, palomita = adorno, cascabel para el marco).
  bufon: () => tshape('M5.6 22C4.6 16 2.6 12.4 3.4 7.4 7 9.6 10 13.6 12 22z', '#e8434f', '#c22c3c', '', 2) + tshape('M26.4 22C27.4 16 29.4 12.4 28.6 7.4 25 9.6 22 13.6 20 22z', '#e8434f', '#c22c3c', '', 2)
    + tshape('M10 22C11 14.4 13.6 8.4 16 4.6 18.4 8.4 21 14.4 22 22z', '#8a5cf0', '#6c3fd4', '<path d="M16 7.6 14.2 22M16 7.6 17.8 22" stroke="#a98af5" stroke-width="1.2"/>', 2)
    + tshape('M5 21.6h22v4.4a1.6 1.6 0 0 1-1.6 1.6H6.6A1.6 1.6 0 0 1 5 26z', '#ffc83d', '#ec9a17', '<path d="M8 24.4l2-1.4 2 1.4 2-1.4 2 1.4 2-1.4 2 1.4 2-1.4 2 1.4" fill="none" stroke="#c97a10" stroke-width="1.1"/>', 2)
    + [[3.6, 7.2], [28.4, 7.2], [16, 4.2]].map(([x, y]) => tshape(CIRCLE(x, y, 2.3), '#ffe27a', '#ec9a17', '', 1.6)).join(''),
  palomita: () => tshape('M3.6 21C6 14.8 11 13 16 13.6 19 14 21.4 16 22.4 18.6 21 24.6 14 27.2 8 25.8L2.6 28z', '#fffaf2', '#d8d2ec', '', 2)
    + tshape('M8.6 17.6C11.4 11 17 8.2 21.6 9 20.6 14.6 16 18.6 8.6 17.6z', '#eeeaf8', '#c4bce0', '<path d="M12 15.6q3-2 6-5.4M14.4 16.4q2.6-1.4 4.6-4" stroke="#c4bce0" stroke-width="1" fill="none"/>', 2)
    + tshape(CIRCLE(22.6, 11.2, 4.6), '#fffaf2', '#d8d2ec', '', 2)
    + tshape('M26.8 10.2 30.6 11.8l-3.6 1.6z', '#ffc83d', '#ec9a17', '', 1.4)
    + `<circle cx="23.8" cy="10.4" r="1.1" fill="${K}"/><ellipse cx="24.4" cy="13.4" rx="1.4" ry=".8" fill="#ff8fa6" opacity=".7"/>`,
  cascabel: () => tshape(CIRCLE(16, 17.6, 10.4), '#ffc83d', '#ec9a17', '<path d="M7 16h18" stroke="#c97a10" stroke-width="1.6"/><ellipse cx="12" cy="12" rx="3" ry="1.6" fill="#fff4c7" opacity=".8" transform="rotate(-30 12 12)"/>', 2.2)
    + `<circle cx="16" cy="22" r="2" fill="${K}"/><path d="M16 22v4.4" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/>` + tshape('M13.6 7.6a2.4 2.4 0 0 1 4.8 0z', '#ec9a17', '#c97a10', '', 1.6),
  // Festividad: Año Nuevo (reloj a las doce = ícono, uvas = adorno).
  reloj: () => [8.4, 23.6].map((x) => tshape(CIRCLE(x, 7.2, 3.4), '#ff5f7e', '#d63d5f', '', 1.8)).join('')
    + tshape(CIRCLE(16, 17.6, 11.4), '#ffc83d', '#ec9a17', `<circle cx="15" cy="16.6" r="8.4" fill="#fff6e6"/>`, 2.2)
    + `<path d="M15 9.6v1.6M15 22v1.6M8 16.6h1.6M20.4 16.6H22" stroke="${K}" stroke-width="1.4" stroke-linecap="round"/><path d="M15 16.6V10.8M15 16.6V12.4" stroke="${K}" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="16.6" r="1.5" fill="#ff5f7e" stroke="${K}" stroke-width=".9"/>`,
  uvas: () => `<path d="M16 9.4V5.2" stroke="${K}" stroke-width="3.6" stroke-linecap="round"/><path d="M16 9.4V5.2" stroke="#8a5a3a" stroke-width="1.6" stroke-linecap="round"/>`
    + tshape('M16 6.2c2-3 6-3.4 8.6-2-1.6 3-5 4.4-8.6 2z', '#7fc46a', '#5fae5a', '', 1.6)
    + [[9.6, 12.6], [16, 12.4], [22.4, 12.6], [12.8, 18.2], [19.2, 18.2], [16, 23.8]].map(([x, y]) => tshape(CIRCLE(x, y, 3.8), '#b06ce0', '#7b3fb8', `<circle cx="${x - 1.2}" cy="${y - 1.3}" r="1" fill="#f0dcff"/>`, 1.8)).join(''),
  // Fichas de las colecciones del nivel 150: gota de pintura (arte), nota (música) y claqueta (cine).
  gota: () => tshape('M16 3C12 10 6.6 15 6.6 20.4a9.4 9.4 0 0 0 18.8 0C25.4 15 20 10 16 3z', '#ff5f7e', '#d63d5f', '<path d="M4 19h24v4.4H4z" fill="#ffc83d"/><path d="M4 23.4h24V28H4z" fill="#4aa8de"/><ellipse cx="12.4" cy="14" rx="1.8" ry="3" fill="#fff" opacity=".7" transform="rotate(25 12.4 14)"/>', 2.2),
  nota: () => tshape('M14 9.4h2.6V24H14zM25.4 5.4H28V20h-2.6z', '#6c3fd4', '#4a2a9a', '', 1.8) + tshape('M14 8.6 28 4.6v5.2L14 13.8z', '#8a5cf0', '#6c3fd4', '', 2)
    + tshape('M5 24.4a5.6 4.4 0 1 0 11.2 0a5.6 4.4 0 1 0-11.2 0z', '#8a5cf0', '#6c3fd4', '<ellipse cx="9" cy="23" rx="1.6" ry="1" fill="#c9b4ff"/>', 2) + tshape('M16.4 20.4a5.6 4.4 0 1 0 11.2 0a5.6 4.4 0 1 0-11.2 0z', '#8a5cf0', '#6c3fd4', '<ellipse cx="20.4" cy="19" rx="1.6" ry="1" fill="#c9b4ff"/>', 2),
  claqueta: () => tshape('M4 14h24v12.4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', '#4a4560', '#36324a', '<path d="M8 19.6h16M8 23.6h10" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>', 2.2)
    + tshape('M3.6 12.6 25.6 4.4l1.8 4.8-22 8.2z', '#4a4560', '#36324a', '<path d="M8.4 11.6l4-6M14.4 9.4l4-6M20.4 7.2l4-6M5.4 14.2l3-4.6" stroke="#fff" stroke-width="2.2"/>', 2)
    + `<circle cx="5" cy="14.6" r="1.4" fill="#ffc83d" stroke="${K}" stroke-width="1"/>`,
  // Festividades de leyendas mexicanas (nivel 200).
  // Nahual y Chaneques: máscara de jaguar (ícono) y chaneque con su gorro de hoja (adorno).
  nahual: () => tshape('M7 9 9.6 3.4 14 7.4zM25 9l-2.6-5.6L18 7.4z', '#ffb13d', '#e2851a', '', 1.8)
    + tshape('M16 6C24 6 28 11 28 17 28 24 22.6 29 16 29S4 24 4 17C4 11 8 6 16 6z', '#ffc24d', '#e8941a', `${[[10, 11], [21, 10], [7, 18], [25, 18], [16, 9]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="none" stroke="#8a4a10" stroke-width="1.2"/>`).join('')}<path d="M11 22q5 6 10 0z" fill="#fff6e6"/>`, 2.2)
    + `<path d="M8.6 15.4q3-2.4 5.6 0-2.6 2.2-5.6 0zM17.8 15.4q3-2.4 5.6 0-3 2.2-5.6 0z" fill="#7fd36a" stroke="${K}" stroke-width="1.2"/><circle cx="11.4" cy="15.4" r=".9" fill="${K}"/><circle cx="20.6" cy="15.4" r=".9" fill="${K}"/><path d="M14.4 19.6h3.2L16 21.6z" fill="${K}"/><path d="M16 21.6v2" stroke="${K}" stroke-width="1"/>`,
  chaneque: () => tshape('M3 16 10 11 11 19zM29 16l-7-5-1 8z', '#9ad46a', '#6fae4a', '', 1.8)
    + tshape(CIRCLE(16, 19, 9), '#9ad46a', '#6fae4a', '<circle cx="11.6" cy="22.6" r=".7" fill="#4a8a3a"/><circle cx="20.4" cy="22.6" r=".7" fill="#4a8a3a"/>', 2.2)
    + tshape('M5 13C8 4 24 4 27 13 20 9 12 9 5 13z', '#3f9a4a', '#2f7a3a', '<path d="M16 6v6M11 8l2 3M21 8l-2 3" stroke="#7fd36a" stroke-width="1.1"/>', 2)
    + `<circle cx="12.6" cy="18" r="1.7" fill="${K}"/><circle cx="19.4" cy="18" r="1.7" fill="${K}"/><circle cx="12.1" cy="17.4" r=".6" fill="#fff"/><circle cx="18.9" cy="17.4" r=".6" fill="#fff"/><path d="M12 22.4q4 3.6 8 0" fill="none" stroke="${K}" stroke-width="1.4" stroke-linecap="round"/><path d="M14 23.6l.6 1.4.6-1.2M17 23.6l.6 1.4.6-1.2" fill="#fff"/>`,
  // Día del Xoloitzcuintle: carita de xolo (ícono) y farolito de papel (adorno).
  xolito: () => tshape('M6 14 5 2l9 7zM26 14l1-12-9 7z', '#4a4560', '#36324a', '<path d="M7.4 11 7 5l4.4 3.4zM24.6 11 25 5l-4.4 3.4z" fill="#ff9cb0"/>', 2)
    + tshape('M16 7.6C23.4 7.6 27 12.6 27 18 27 24.4 22 28.6 16 28.6S5 24.4 5 18C5 12.6 8.6 7.6 16 7.6z', '#4a4560', '#36324a', '<path d="M13.6 8.4q2.4-3 4.8 0" fill="none" stroke="#7a7290" stroke-width="1.6"/>', 2.2)
    + `<circle cx="11.6" cy="17" r="2" fill="#fff6e6"/><circle cx="20.4" cy="17" r="2" fill="#fff6e6"/><circle cx="11.9" cy="17.3" r="1.1" fill="${K}"/><circle cx="20.7" cy="17.3" r="1.1" fill="${K}"/><ellipse cx="16" cy="21.4" rx="2.2" ry="1.5" fill="#1a1530"/><path d="M14.6 23.4h2.8v2.2a1.4 1.4 0 0 1-2.8 0z" fill="#ff7a9a"/>`,
  farolito: () => `<path d="M16 2.4v3" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/>` + tshape('M11 5h10v3H11zM12 25h8v3h-8z', '#4a4560', '#36324a', '', 1.8)
    + tshape('M16 8C24 8 26 12 26 16.4S24 25 16 25 6 20.8 6 16.4 8 8 16 8z', '#ff9c1a', '#e0700a', '<path d="M16 8v17M11 9q-3 7 0 15M21 9q3 7 0 15" stroke="#c95e00" stroke-width="1.2" fill="none"/><ellipse cx="16" cy="16.4" rx="5" ry="5.6" fill="#ffe27a" opacity=".55"/>', 2),
  // La Llorona: su cara con el rebozo azul (ícono) y una velita que flota en el agua (adorno).
  llorona: () => tshape('M16 3C25 3 29 10 28 20 27 26 24 29 24 29H8S5 26 4 20C3 10 7 3 16 3z', '#4a6ad8', '#3a52b0', '<path d="M8 26q8-4 16 0" stroke="#7f9cf0" stroke-width="1.4" fill="none"/>', 2.2)
    + tshape('M9.6 13C9.6 22 12 26 16 26S22.4 22 22.4 13Q16 8 9.6 13z', '#2a2540', '#1a1530', '', 1.6)
    + tshape(ELL(16, 17, 5.4, 6.6), '#f0e6ff', '#d8c8f0', '', 1.8)
    + `<path d="M12.6 16.4q1.4 1.2 2.6 0M16.8 16.4q1.4 1.2 2.6 0" fill="none" stroke="${K}" stroke-width="1.2" stroke-linecap="round"/><path d="M13.4 18.6q-.8 1.8.2 2.4.9-.6-.2-2.4z" fill="#8fd8ff" stroke="${K}" stroke-width=".7"/><path d="M14.8 21.6q1.2.8 2.4 0" fill="none" stroke="${K}" stroke-width="1.1" stroke-linecap="round"/>`,
  velita: () => `<path d="M3 26q4-3 8 0t8 0 8 0" fill="none" stroke="#5fb0e0" stroke-width="2.4" stroke-linecap="round"/>`
    + tshape('M5 22q11 6 22 0-2 4-11 4T5 22z', '#ffb13d', '#ff8a1a', '', 1.8)
    + tshape('M12.6 12h6.8v10.4h-6.8z', '#fff6e6', '#e8dcc4', '<path d="M14 13v6" stroke="#fff" stroke-width="1.2"/>', 1.8)
    + `<path d="M16 11.6q-3.4-4 0-8.4 3.4 4.4 0 8.4z" fill="#ffc83d" stroke="${K}" stroke-width="1.4"/><path d="M16 10.6q-1.4-1.8 0-3.6 1.4 1.8 0 3.6z" fill="#fff6c8"/>`,
  // La Catrina: calaverita con sombrero de flores (ícono) y una pluma (adorno).
  catrina: () => tshape(CIRCLE(16, 20, 9), '#fff6ee', '#e3d6ee', `<circle cx="12.4" cy="19.6" r="2.6" fill="${K}"/><circle cx="19.6" cy="19.6" r="2.6" fill="${K}"/><circle cx="12.4" cy="19.6" r="1.4" fill="#ff5fa8"/><circle cx="19.6" cy="19.6" r="1.4" fill="#ff5fa8"/><path d="M15 23.4h2l-1 1.4z" fill="${K}"/><path d="M12 26h8M13.6 25v2M16 25v2M18.4 25v2" stroke="${K}" stroke-width=".9"/>`, 2.2)
    + tshape('M1.6 13.6Q16 7 30.4 13.6 16 17 1.6 13.6z', '#6c3fd4', '#4a2a9a', '', 2) + tshape('M9 12q0-8 7-8t7 8q-7 2-14 0z', '#8a5cf0', '#6c3fd4', '', 2)
    + [[10, 9.6, '#ff5fa8'], [14.4, 7.4, '#ffc83d'], [19, 8.4, '#ff7a3a']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${c}" stroke="${K}" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r=".9" fill="#fff6c8"/>`).join('')
    + `<path d="M22 9Q28 2 31 4 27 7 23 10z" fill="#ff9cc8" stroke="${K}" stroke-width="1.2"/>`,
  pluma: () => tshape('M26 3C14 5 7 13 6 24L10 25C12 16 18 9 26 3z', '#c9a6ff', '#a07cf0', '<path d="M24 5Q14 12 9 24" stroke="#fff" stroke-width="1" fill="none" opacity=".7"/>', 2)
    + `<path d="M8 24 5 30" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/><path d="M8 24 5 30" stroke="#e3d8ff" stroke-width="1" stroke-linecap="round"/><path d="M14 13l-4-2M17 10l-3-3M12 17l-5-1" stroke="#ff9cc8" stroke-width="1.6" stroke-linecap="round"/>`,
  // Día de la Revolución: la locomotora (ícono) y una herradura (adorno).
  locomotora: () => `<circle cx="9" cy="4" r="2.4" fill="#dfe6f2" stroke="${K}" stroke-width="1"/><circle cx="13" cy="2.4" r="1.6" fill="#dfe6f2" stroke="${K}" stroke-width="1"/>`
    + tshape('M7 7h5l-1 5H8z', '#4a4560', '#36324a', '', 1.6)
    + tshape('M3 12h18v10H3z', '#4a4560', '#36324a', '<path d="M3 15h18" stroke="#ffc83d" stroke-width="1.4"/>', 2)
    + tshape('M19 6h10v16H19z', '#e8434f', '#c22c3c', '<rect x="22" y="9" width="5" height="5" fill="#ffe27a"/>', 2)
    + tshape('M1 22h3l-3 5z', '#9aa2ba', '#6e7690', '', 1.4)
    + [[8, 26, 3.4], [16, 26, 3.4], [25, 25.6, 4]].map(([x, y, r]) => tshape(CIRCLE(x, y, r), '#e8434f', '#c22c3c', `<circle cx="${x}" cy="${y}" r="1" fill="${K}"/>`, 1.6)).join(''),
  herradura: () => `<path d="M8 6v10a8 8 0 0 0 16 0V6" fill="none" stroke="${K}" stroke-width="8.4" stroke-linecap="round"/><path d="M8 6v10a8 8 0 0 0 16 0V6" fill="none" stroke="#b8c4d8" stroke-width="5" stroke-linecap="round"/><path d="M7 9v7a9 9 0 0 0 2.6 6" fill="none" stroke="#fff" stroke-width="1.2" opacity=".7"/>`
    + [[8, 10], [8, 16], [24, 10], [24, 16], [12, 22.6], [20, 22.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="${K}"/>`).join(''),
  // Fichas de la colección (una por temática).
  concha: () => tshape('M16 27.5 4.5 14.5C5 7.5 10 4 16 4s11 3.5 11.5 10.5z', '#ffb3c7', '#f28aa5', ['M16 27V6', 'M16 27 9.5 7.5', 'M16 27 22.5 7.5', 'M16 27 5.5 12', 'M16 27 26.5 12'].map((d) => `<path d="${d}" stroke="#e0607f" stroke-width="1.6" fill="none"/>`).join(''))
    + tshape('M11 26.5h10l-1.5 3h-7z', '#ffb3c7', '#f28aa5', '', 1.8),
  gema: () => tshape('M9.5 5h13l5.5 8L16 28 4 13z', '#7fe0ff', '#3fb6e0', `<path d="M4 13h24M12 5l-2.5 8L16 28l6.5-15L20 5" fill="none" stroke="#2f9ccc" stroke-width="1.5"/><path d="M9 8.5l2-2.2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`),
  bellota: () => tshape('M8 14.5h16c0 8-3 12.5-8 13.5-5-1-8-5.5-8-13.5z', '#e8a94a', '#c9893a', '<path d="M11 18q1 5 4 7" stroke="#fff4c7" stroke-width="2" fill="none" stroke-linecap="round"/>')
    + tshape('M5 15q0-8 11-8t11 8z', '#a86a22', '#83501a', '<path d="M9 11.5h3M14 10h3M19 11.5h3M11 13.5h3M17 13.5h3" stroke="#83501a" stroke-width="1.4"/>')
    + `<path d="M16 7q0-3 3-4" stroke="${K}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  caramelo: () => tshape('M9.5 16 2.5 9.5v13z', '#ff9cc8', '#f27aad', '', 1.8) + tshape('M22.5 16l7-6.5v13z', '#ff9cc8', '#f27aad', '', 1.8)
    + tshape(CIRCLE(16, 16, 8), '#ff5f7e', '#d63d5f', '<path d="M10 11q6 3 3 12M15 8.5q6 4 4 14" stroke="#fff" stroke-width="2.2" fill="none" opacity=".85"/>'),
  // Fósil (Valle de los dinosaurios): piedra con la huella de un dinosaurio.
  fosil: () => tshape('M5 12.5C6 6 11.5 3.6 17 4.2c6 .6 10.6 4 10.8 10.4.2 6.6-3.4 12.6-11 13.2C9.6 28.4 3.8 21 5 12.5z', '#f0d4a0', '#d4b078',
    `<path d="M16.4 24.6Q12.4 24 12.6 19.6L7.6 10.4Q7.6 8.6 9.4 9.4L14.6 15.4 15.4 6.2Q16.4 4.4 17.4 6.2L18.2 15.4 23.4 9.4Q25.2 8.6 25.2 10.4L20.2 19.6Q20.4 24 16.4 24.6z" fill="#a8622a"/>`
    + `<g fill="#c98a4a"><circle cx="8.6" cy="22.4" r="1.1"/><circle cx="24.4" cy="22" r=".9"/><circle cx="23.4" cy="7.8" r=".8"/></g><path d="M8 9.6q2-3 5-3.8" stroke="#fff6e0" stroke-width="2" fill="none" stroke-linecap="round"/>`, 2.2),
  // Tuerca (Taller de robots): hexágono de metal con su agujero y su rosca.
  tuerca: () => tshape('M16 2.6 27.6 9.3V22.7L16 29.4 4.4 22.7V9.3z', '#c9d2ea', '#9aa7cf',
    `<path d="M16 2.6V9.4M27.6 9.3 22 12.6M27.6 22.7 22 19.4M16 29.4V22.6M4.4 22.7 10 19.4M4.4 9.3 10 12.6" stroke="#aab4d8" stroke-width="1.4"/><path d="M8.4 9.4 15 5.6" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`, 2.2)
    + `<circle cx="16" cy="16" r="6.4" fill="#5a6494" stroke="${K}" stroke-width="2"/><circle cx="16" cy="16" r="4.2" fill="none" stroke="#7f8ab8" stroke-width="1.4" stroke-dasharray="2 1.6"/><circle cx="16" cy="16" r="2.4" fill="#3a4270"/>`,
  // Estrella morada del nivel secreto (mismo dibujo que la dorada).
  // Tesoro escondido (exclusivos de los códigos de regalo): cofre, doblón y palmera.
  cofre: () => tshape('M4 15h24v10.5a2.5 2.5 0 0 1-2.5 2.5h-19A2.5 2.5 0 0 1 4 25.5z', '#c27a3e', '#9a5a2a', '<path d="M9.5 15v13M22.5 15v13" stroke="#ffc83d" stroke-width="3"/>')
    + tshape('M4 15v-2.5A6.5 6.5 0 0 1 10.5 6h11A6.5 6.5 0 0 1 28 12.5V15z', '#d88e4e', '#b0683a', '<path d="M9.5 6v9M22.5 6v9" stroke="#ffc83d" stroke-width="3"/><path d="M8 9.5q8-3 16 0" stroke="#f2b47a" stroke-width="1.6" fill="none" stroke-linecap="round"/>')
    + tshape('M12.6 12.6h6.8v7.2h-6.8z', '#ffd23d', '#e8a417', `<circle cx="16" cy="15.6" r="1.4" fill="${K}"/><path d="M16 16.4v2" stroke="${K}" stroke-width="1.4" stroke-linecap="round"/>`, 1.6),
  doblon: () => tshape(CIRCLE(16, 16, 12.5), '#ffd23d', '#e8a417', `<circle cx="16" cy="16" r="8.6" fill="none" stroke="#d99a17" stroke-width="1.8"/><path d="M16 10.4v11.2M10.4 16h11.2" stroke="#c98a17" stroke-width="2.6" stroke-linecap="round"/><path d="M9 10.5a9 9 0 0 1 4-3.2" stroke="#fff3b8" stroke-width="2" fill="none" stroke-linecap="round"/>`),
  palmera: () => `<path d="M15.5 29Q14 20 18 12" fill="none" stroke="${K}" stroke-width="5.4" stroke-linecap="round"/><path d="M15.5 29Q14 20 18 12" fill="none" stroke="#b8743a" stroke-width="2.8" stroke-linecap="round" stroke-dasharray="2.2 1.4"/>`
    + ['M18 12Q10 6 3.5 10.5Q11 9.5 18 12z', 'M18 12Q26 5 30 11Q24 9 18 12z', 'M18 12Q12 13 7.5 20Q14 15 18 12z', 'M18 12Q25 13 27.5 20Q22 14.5 18 12z', 'M18 12Q17 5 21 2.5Q19.5 7 18 12z'].map((d) => tshape(d, '#5fc760', '#3f9a4a', '', 1.6)).join('')
    + [[16.4, 13.4], [19.4, 13.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.9" fill="#8a5a2a" stroke="${K}" stroke-width="1.2"/>`).join(''),
  starSecret: () => tshape(starPath(16, 17, 14, 6.6), '#b36bff', '#8a3fe0', `<path d="M10.5 13.5l2.2-3.6" stroke="#ecdcff" stroke-width="2.2" stroke-linecap="round"/>`),
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
  backup: () => tshape('M5 13h22v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z', '#5ad68c', '#3bb26c', '', 2.2) + glyph('M16 3v15M11 13l5 5 5-5', 3.2),
  flag: () => `<path d="M8 4v25" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>` + tshape('M9 5h16l-4 5.5 4 5.5H9z', '#ff5f7e', '#d63d5f', '', 2),
  planet: () => planetInner('#86cf5c', '#4d9f45', '#2f86c8', '#ffc83d'),
  crown: () => tshape('M4 26 3 8l7 6 6-9 6 9 7-6-1 18z', '#ffc83d', '#ec9a17', '<circle cx="16" cy="18" r="2.6" fill="#ff5f7e"/>', 2.2),
  trophy: () => tshape('M9 5h14v6a7 7 0 0 1-14 0z', '#ffc83d', '#ec9a17', '', 2.2) + `<path d="M9 7H5a4 4 0 0 0 4 6M23 7h4a4 4 0 0 1-4 6" fill="none" stroke="${K}" stroke-width="2.2"/>` + tshape('M13 18h6l1 5h-8z', '#ffc83d', '#ec9a17', '', 2) + tshape('M9 23h14v4H9z', '#9a5a32', '#7a4024', '', 2),
  flame: () => tshape('M16 3c1.5 5 8 7 8 15a8 8 0 0 1-16 0c0-4 2-6 3.5-8 .5 2.5 2 4 3.5 4-1-5 0-8.5 1-11z', '#ff6a3d', '#e04a20', '<path d="M16 15c1 3 4 4 4 7a4 4 0 0 1-8 0c0-2 1.5-3.5 4-7z" fill="#ffc83d"/>', 2.2),
  vibra: () => tshape('M11 4h10a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', '#4aa8de', '#2f86c0', '<path d="M11 7h10v15H11z" fill="#d8f0ff"/>', 2.2) + `<path d="M5 11v10M27 11v10M2 13.5v5M30 13.5v5" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>`,
  snail: () => tshape('M4 25h20c3 0 4-2 4-4v-2l-2-1-2 3H4z', '#ffd27a', '#e8a94a', '', 2) + tshape(CIRCLE(14, 16, 8), '#ff9c5b', '#e2753a', `<path d="M14 16a3 3 0 1 1 3-3" fill="none" stroke="${K}" stroke-width="1.8"/>`, 2.2) + `<path d="M26 18l1-6M28.5 18.5l2.5-5" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/>`,
  wild: () => `<g transform="rotate(8 16 16)">${tshape('M9 4h14a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z', '#fffaf0', '#eadcc2', '', 2.2)}${tshape(starPath(16, 16.5, 7.5, 3.4), '#ff9c2b', '#e8761a', '', 1.8)}</g>`,
  // Una sola carta de reverso (botón Cartas de la tienda).
  card: () => `<g transform="rotate(-10 16 16)">${tshape('M10 4h12a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z', '#fff6e6', '#e3d8c4', '<rect x="9.6" y="6.6" width="12.8" height="18.8" rx="1.8" fill="#4a4ac0"/>', 1.8)}<path d="${starPath(16, 16, 5, 2.3)}" fill="#ffc83d" stroke="#2a1f5c" stroke-width="1.4" stroke-linejoin="round"/></g>`,
  deck: () => [0, 1, 2].map((i) => tshape(`M${8 + i * 3} ${8 - i * 2}h11a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H${8 + i * 3}a2 2 0 0 1-2-2V${10 - i * 2}a2 2 0 0 1 2-2z`, '#2b2b7a', '#22226a', '', 1.8)).join(''),
  lock: () => lockInner('#d3cde8', '#aea6cc'),
  bomb: () => tshape(CIRCLE(15, 19, 10.5), '#4a4373', '#332d58', '<path d="M9 16a7 7 0 0 1 5.5-4.5" stroke="#8f88c0" stroke-width="2.4" stroke-linecap="round" fill="none"/>', 2.2)
    + `<g transform="rotate(40 21 9)">${tshape('M18 6h6v5h-6z', '#8f88c0', '#6e66a3', '', 1.8)}</g><path d="M24 6c1.5-2.5 3.5-2.8 5-1.2" stroke="${K}" stroke-width="1.8" fill="none" stroke-linecap="round"/>${tshape(starPath(29, 4.5, 3.6, 1.6), '#ffd85a', '#ffb02e', '', 1.4)}`,
  // Cometa: estrella con cola, de lado (carta cometa).
  // Lluvia de meteoritos: piedra morada con cráteres y su cola de fuego (cae hacia abajo a la izquierda).
  meteoro: () => tshape('M6.5 15.5Q15 6 30 2Q23.5 13 17 25.5z', '#ff9c3d', '#ff6a2e', '<path d="M11 16.5Q18 9.5 26.5 5.5Q21.5 13.5 17 21.5z" fill="#ffd85a"/>', 2)
    + tshape(CIRCLE(12, 21, 7.6), '#a493bd', '#7a6a9e', '<circle cx="9.4" cy="19.6" r="1.9" fill="#7a6a9e"/><circle cx="14.6" cy="24" r="1.3" fill="#7a6a9e"/><circle cx="14.4" cy="17.6" r="1" fill="#7a6a9e"/><path d="M7.4 18.4a5 5 0 0 1 3-3.2" stroke="#e4dcf2" stroke-width="1.6" fill="none" stroke-linecap="round"/>', 2.2),
  comet: () => tshape('M2.5 29.5 14 10.5l9 8.5z', '#8fd8ff', '#5fb6e8', '<path d="M6 27 15.5 14.5l3.5 3.2z" fill="#e4f7ff"/>', 2)
    + tshape(starPath(19.5, 13, 9, 4.2), '#ffd85a', '#ffb02e', '<circle cx="18" cy="11.5" r="1.6" fill="#fff6c8"/>', 2.2),
  album: () => tshape('M5 7a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z', '#4aa8de', '#2f86c0', '', 2.2) + tshape('M9 9h14v10H9z', '#fff6e6', '#ecdcc0', '<path d="M9 17l4-4 3 3 2-2 5 5v0H9z" fill="#5ad68c"/><circle cx="19" cy="12" r="1.8" fill="#ffc83d"/>', 1.8) + `<path d="M10 23h8" stroke="${K}" stroke-width="2" stroke-linecap="round"/>`,
  rocket: () => `<g transform="rotate(35 16 16)">${tshape('M9.5 20 6 26l6-1.5zM22.5 20 26 26l-6-1.5z', '#ff5f7e', '#d63d5f', '', 1.8)}${tshape('M16 3c4.5 3.5 6.5 9 6.5 14.5V23h-13v-5.5C9.5 12 11.5 6.5 16 3z', '#fff6e6', '#d9cfee', '', 2.2)}${tshape(CIRCLE(16, 13.5, 3.2), '#5fc7e8', '#2f86c0', '', 1.8)}${tshape('M13 23h6l-3 6.5z', '#ffc83d', '#ff8a3d', '', 1.6)}</g>`,
  face: () => `<g transform="rotate(-8 16 16)">${tshape('M9 4h14a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z', '#fffdf7', '#efe4d0', '', 2.2)}</g><text x="16" y="22.5" text-anchor="middle" font-family="Lilita One" font-size="15" fill="#e8434f" transform="rotate(-8 16 16)">A</text>`,
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
  coral: { a: '#ff6f61', b: '#e0524a', moon: true, dots: '#fff1d6' },
  menta: { a: '#2fbf9a', b: '#1f9a7c', emb: ['#ffd27a', '#e8a94a', '#ff7a9a', '#fff6e6'] },
  cielo: { a: '#4aa8de', b: '#2f86c0', comet: true },
  noche: { a: '#1d1838', b: '#141029', constel: true, dots: '#c9bff0' },
  // De aquí en adelante: art = dibujo del centro · bg = dibujo que llena el fondo (recortado) · flat = sin la ola de abajo.
  galaxia: { a: '#2e1d6b', b: '#24165a', dots: '#e3d8ff', art: () => `<g transform="rotate(-20 50 70)"><ellipse cx="50" cy="70" rx="34" ry="14" fill="#8a5cf0" opacity=".35"/><path d="M50 70c0-8 12-10 16-2s-4 20-18 18-22-16-14-30 30-16 40-2" fill="none" stroke="${K}" stroke-width="9" stroke-linecap="round"/><path d="M50 70c0-8 12-10 16-2s-4 20-18 18-22-16-14-30 30-16 40-2" fill="none" stroke="#c9a6ff" stroke-width="5" stroke-linecap="round"/><path d="M50 70c0 8-12 10-16 2s4-20 18-18 22 16 14 30-30 16-40 2" fill="none" stroke="${K}" stroke-width="9" stroke-linecap="round"/><path d="M50 70c0 8-12 10-16 2s4-20 18-18 22 16 14 30-30 16-40 2" fill="none" stroke="#ff9cc8" stroke-width="5" stroke-linecap="round"/></g><circle cx="50" cy="70" r="7" fill="#fff3b8" stroke="${K}" stroke-width="3"/>` },
  sandia: { a: '#ff5f7e', b: '#e8435f', flat: true, nodots: true, bg: () => `<rect x="8" y="8" width="84" height="124" rx="8" fill="none" stroke="#5fc760" stroke-width="12"/><rect x="14" y="14" width="72" height="112" rx="5" fill="none" stroke="#e9ffd9" stroke-width="3"/>${[[30, 30], [52, 26], [70, 36], [26, 56], [74, 62], [30, 90], [50, 108], [72, 96], [40, 74], [62, 84]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="4" fill="${K}" transform="rotate(${(x - 50) / 2} ${x} ${y})"/>`).join('')}`,
    art: () => tshape('M28 66a22 22 0 0 0 44 0z', '#ff7a8f', '#e8435f', `<path d="M28 66a22 22 0 0 0 44 0" fill="none" stroke="#5fc760" stroke-width="5"/><circle cx="42" cy="74" r="2" fill="${K}"/><circle cx="50" cy="80" r="2" fill="${K}"/><circle cx="58" cy="74" r="2" fill="${K}"/>`, 3) },
  picnic: { a: '#fff6e6', b: '#fff6e6', flat: true, nodots: true, bg: () => `${Array.from({ length: 7 }, (_, i) => `<rect x="${8 + i * 13}" y="8" width="7" height="124" fill="#ff5f7e" opacity=".55"/>`).join('')}${Array.from({ length: 10 }, (_, i) => `<rect x="8" y="${8 + i * 13}" width="84" height="7" fill="#ff5f7e" opacity=".55"/>`).join('')}`,
    art: () => tshape(CIRCLE(50, 70, 17), '#ff5f7e', '#d63d5f', `<path d="M50 54q2-8 9-9" fill="none" stroke="#6a4028" stroke-width="3" stroke-linecap="round"/><path d="M52 50q8-6 12 0-6 4-12 0z" fill="#5fc760" stroke="${K}" stroke-width="2"/><ellipse cx="43" cy="64" rx="4" ry="2.4" fill="#fff" opacity=".6"/>`, 3) },
  anillos: { a: '#2fb6c8', b: '#1f96a8', art: () => `<g transform="rotate(-18 50 70)"><path d="M14 70a36 11 0 0 1 72 0" fill="none" stroke="${K}" stroke-width="10"/><path d="M14 70a36 11 0 0 1 72 0" fill="none" stroke="#fff3b8" stroke-width="5"/></g>${tshape(CIRCLE(50, 70, 20), '#ff9c5b', '#e2753a', '<path d="M32 64q18 6 36 0M33 76q17 5 34 0" stroke="#ffc83d" stroke-width="4" fill="none"/>', 3)}<g transform="rotate(-18 50 70)"><path d="M14 70a36 11 0 0 0 72 0" fill="none" stroke="${K}" stroke-width="10"/><path d="M14 70a36 11 0 0 0 72 0" fill="none" stroke="#fff3b8" stroke-width="5"/></g>` },
  eclipse: { a: '#1a1433', b: '#120e26', dots: '#ffe58a', art: () => `${Array.from({ length: 12 }, (_, i) => `<path d="M50 70L${(50 + Math.cos((i * Math.PI) / 6) * 34).toFixed(1)} ${(70 + Math.sin((i * Math.PI) / 6) * 34).toFixed(1)}" stroke="#ffc83d" stroke-width="${i % 2 ? 3 : 6}" stroke-linecap="round"/>`).join('')}<circle cx="50" cy="70" r="22" fill="#ffc83d" stroke="${K}" stroke-width="3"/><circle cx="50" cy="70" r="18" fill="#1a1433"/><path d="M38 62a14 14 0 0 1 10-8" fill="none" stroke="#fff3b8" stroke-width="2.4" stroke-linecap="round"/>` },
  cohete: { a: '#ff9c5b', b: '#e2753a', dots: '#fff6e6', art: () => `<g transform="rotate(30 50 70)">${tshape('M42 88 36 100 46 94z', '#ff5f7e', '#d63d5f', '', 3)}${tshape('M58 88 64 100 54 94z', '#ff5f7e', '#d63d5f', '', 3)}<path d="M44 96q6 14 12 0z" fill="#ffc83d" stroke="${K}" stroke-width="2.6"/>${tshape('M50 40Q64 54 60 92H40Q36 54 50 40z', '#fff6e6', '#e3d8ff', '', 3)}${tshape(CIRCLE(50, 66, 7), '#5fc7e8', '#3aa0c8', '', 2.6)}</g>` },
  ajedrez: { a: '#e3d8ff', b: '#e3d8ff', flat: true, nodots: true, bg: () => Array.from({ length: 70 }, (_, i) => { const x = i % 7, y = Math.floor(i / 7); return (x + y) % 2 ? `<rect x="${8 + x * 12}" y="${8 + y * 12.4}" width="12" height="12.4" fill="#8a5cf0"/>` : ''; }).join(''),
    art: () => tshape(CIRCLE(50, 70, 20), '#fff6e6', '#e3d8ff', `<path d="${starPath(50, 70, 13, 6)}" fill="#ffc83d" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/>`, 3) },
  flores: { a: '#ff9cc8', b: '#f27aad', dots: '#fff6fb', art: () => { const f = (x, y, r, c) => `${Array.from({ length: 5 }, (_, i) => { const a = (i * 2 * Math.PI) / 5 - Math.PI / 2; return `<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="${r * 0.75}" fill="${c}" stroke="${K}" stroke-width="2.6"/>`; }).join('')}<circle cx="${x}" cy="${y}" r="${r * 0.6}" fill="#ffc83d" stroke="${K}" stroke-width="2.6"/>`; return f(50, 70, 13, '#fff6fb') + f(26, 34, 6, '#c9a6ff') + f(76, 108, 6, '#c9a6ff'); } },
  fuegos: { a: '#1d2060', b: '#151850', dots: '#c9bff0', art: () => [[50, 62, 24, '#ffc83d'], [28, 100, 13, '#ff7aa2'], [74, 34, 12, '#5ff0ff']].map(([x, y, r, c]) => Array.from({ length: 10 }, (_, i) => { const a = (i * Math.PI) / 5; return `<path d="M${(x + Math.cos(a) * r * 0.35).toFixed(1)} ${(y + Math.sin(a) * r * 0.35).toFixed(1)}L${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)}" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/><circle cx="${(x + Math.cos(a) * r * 1.15).toFixed(1)}" cy="${(y + Math.sin(a) * r * 1.15).toFixed(1)}" r="1.6" fill="${c}"/>`; }).join('') + `<circle cx="${x}" cy="${y}" r="${r * 0.18}" fill="#fff"/>`).join('') },
  papel: { a: '#c23a8f', b: '#a82a78', flat: true, dots: '#ffd6ec', bg: () => [[18, '#ffc83d'], [56, '#5fd1c5'], [94, '#ff9c5b']].map(([y, c]) => `<path d="M8 ${y}Q50 ${y + 6} 92 ${y}" fill="none" stroke="${K}" stroke-width="1.6"/>${Array.from({ length: 5 }, (_, i) => { const x = 12 + i * 16; return `<path d="M${x} ${y + 1}h13v18l-6.5-4-6.5 4z" fill="${c}" stroke="${K}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="${x + 6.5}" cy="${y + 8}" r="2.4" fill="${'#c23a8f'}"/>`; }).join('')}`).join('') },
  // Exclusivo de la colección: Tesoros del mar. Arrecife claro: corales, la concha en la arena, pececitos y burbujas.
  arrecife: { a: '#bfeaf5', b: '#f6dca0', dots: '#fff',
    art: () => [[22, 58, '#ff7aa6'], [78, 66, '#ff9c5b']].map(([x, y, c]) => `<path d="M${x} 104V${y + 20}M${x} ${y + 30}l-8-12M${x} ${y + 24}l7-10M${x - 8} ${y + 18}v-8M${x + 7} ${y + 14}v-6" fill="none" stroke="${K}" stroke-width="7" stroke-linecap="round"/><path d="M${x} 104V${y + 20}M${x} ${y + 30}l-8-12M${x} ${y + 24}l7-10M${x - 8} ${y + 18}v-8M${x + 7} ${y + 14}v-6" fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/>`).join('')
      + [[40, 34, 1], [64, 46, -1]].map(([x, y, d]) => `<g transform="translate(${x} ${y}) scale(${d} 1)">${tshape('M-8 0Q0-6 8 0Q0 6-8 0zM8 0l6-5v10z', '#ffc83d', '#ec9a17', '', 1.8)}<circle cx="-4" cy="-1" r="1.2" fill="${K}"/></g>`).join('')
      + [[50, 22, 2.4], [56, 14, 1.6], [30, 70, 2], [70, 30, 1.8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#5fb0e0" stroke-width="1"/>`).join('')
      + `<g transform="translate(50 108) scale(1.2) translate(-16 -16)">${ICONS.concha()}</g>` },
  // Exclusivo de la colección: Cueva de gemas. Cueva clara con estalactitas y un racimo de gemas brillando sobre la roca.
  cristales: { a: '#ddd0ff', b: '#a898d8', dots: '#fff', flat: true,
    bg: () => `${[[8, 18], [22, 12], [34, 24], [50, 10], [64, 20], [78, 14], [90, 22]].map(([x, h], i) => `<path d="M${x - 8} 8h16l-8 ${h}z" fill="${i % 2 ? '#b8a8e8' : '#c8baf0'}" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>`).join('')}`
      + tshape('M8 108Q30 94 50 100T92 104V132H8z', '#8a7cb0', '#6a5c90', '', 2.4),
    art: () => [[50, 84, 1.7, 0], [30, 96, 1, -20], [72, 94, 1.1, 18], [62, 108, 0.7, 30]].map(([x, y, k, r]) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${k}) translate(-16 -16)">${ICONS.gema()}</g>`).join('')
      + [[30, 60], [74, 54], [52, 44]].map(([x, y]) => `<path d="M${x} ${y - 6}l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z" fill="#fff" stroke="${K}" stroke-width="1"/>`).join('') },
  // Exclusivo de la colección: Bosque encantado. Una rama de roble con bellotas colgando y hojas que caen.
  hojas: { a: '#e6f5d0', b: '#b8dc8a', dots: '#7fae5a',
    art: () => `<path d="M6 20Q40 30 94 16" fill="none" stroke="${K}" stroke-width="8" stroke-linecap="round"/><path d="M6 20Q40 30 94 16" fill="none" stroke="#8a5a3a" stroke-width="4.4" stroke-linecap="round"/>`
      + [[26, 25, 30, 1.15], [50, 26, 52, 1.5], [74, 21, 34, 1.1]].map(([x, y, l, k]) => `<path d="M${x} ${y}v${l - 14}" stroke="${K}" stroke-width="2"/><g transform="translate(${x} ${y + l}) scale(${k}) translate(-16 -16)">${ICONS.bellota()}</g>`).join('')
      + [[20, 96, 30, '#ff9c3d'], [78, 104, -40, '#e8434f'], [40, 116, 70, '#ffc83d'], [62, 92, 10, '#7fae5a']].map(([x, y, r, c]) => `<g transform="translate(${x} ${y}) rotate(${r})">${tshape('M0-8Q7-3 0 8Q-7-3 0-8z', c, '#00000033', '<path d="M0-6v12" stroke="#0003" stroke-width="1"/>', 1.6)}</g>`).join('') },
  // Exclusivo de la colección: Feria de dulces. El frasco de vidrio lleno de dulces, con su moño.
  caramelos: { a: '#ffe0ee', b: '#ffe0ee', dots: '#ff7ab8', flat: true,
    art: () => `<rect x="22" y="34" width="56" height="84" rx="14" fill="#e8f6ff" stroke="${K}" stroke-width="3"/>`
      + [[34, 104, '#ff5f7e'], [50, 108, '#4aa8de'], [66, 104, '#ffc83d'], [42, 92, '#7fd36a'], [58, 92, '#b48cff'], [34, 80, '#ff9c5b'], [50, 78, '#ff7ab8'], [66, 80, '#5fd1c5'], [42, 66, '#ffc83d'], [58, 64, '#ff5f7e']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6.4" fill="${c}" stroke="${K}" stroke-width="1.6"/><path d="M${x - 3} ${y - 2}q3-3 6 0" stroke="#fff" stroke-width="1.4" fill="none"/>`).join('')
      + `<path d="M28 44v60" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`
      + tshape('M28 24h44v12H28z', '#ff7ab8', '#e0559a', '', 2.6) + `<g transform="translate(50 26) scale(.9) translate(-16 -16)">${ICONS.caramelo()}</g>` },
  // Exclusivo de la colección: Valle de los dinosaurios. Un camino de huellas de dinosaurio en la arena y su volcán al fondo.
  huellas: { a: '#ffe6c4', b: '#f6d098', dots: '#c9692a',
    art: () => tshape('M54 44 66 22h8l12 22z', '#a8744a', '#8a5a3a', '<path d="M66 22q4 6 8 0" fill="#ff7a3a"/>', 2.2) + `<path d="M70 20q-4-8 2-12M70 18q6-6 4-12" fill="none" stroke="#b8a898" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`
      + [[28, 112, -20, 1], [56, 92, -10, 0.92], [32, 70, -20, 0.84], [58, 52, -10, 0.76]].map(([x, y, r, k]) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${k})"><path d="M0 8C-6 8-8 2-6-2L-12-12M-6-2-2-14M6-2 12-12M6-2C8 2 6 8 0 8z" fill="none" stroke="${K}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 8C-6 8-8 2-6-2L-12-12M-6-2-2-14M6-2 12-12M6-2C8 2 6 8 0 8z" fill="#c9692a" stroke="#c9692a" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></g>`).join('') },
  // Exclusivo de la colección: Taller de robots. Plano azul de un robot dibujado en blanco, con sus tuercas.
  circuitos: { a: '#bcd6ff', b: '#bcd6ff', flat: true, nodots: true,
    bg: () => Array.from({ length: 12 }, (_, i) => `<path d="M${8 + i * 8} 8v124M8 ${8 + i * 11}h84" stroke="#fff" stroke-width=".8" opacity=".55"/>`).join(''),
    art: () => `<g fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="32" y="40" width="36" height="28" rx="6"/><path d="M50 40v-10"/><circle cx="50" cy="27" r="3"/><circle cx="42" cy="53" r="4"/><circle cx="58" cy="53" r="4"/><path d="M42 62h16"/><rect x="28" y="72" width="44" height="34" rx="6"/><path d="M28 80H18v16M72 80h10v16M38 106v14M62 106v14"/><path d="M40 84h20M40 92h12" stroke-dasharray="3 3"/></g>`
      + `<path d="M14 22h10M19 17v10" stroke="#fff" stroke-width="1.6"/>`
      + [[20, 116, 0.55], [80, 30, 0.5]].map(([x, y, k]) => `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.tuerca()}</g>`).join('') },
  // Exclusivo de la colección: Taller de arte. El caballete con su cuadro a medio pintar, la paleta y salpicones.
  lienzo: { a: '#fff1dc', b: '#ffe2bc', dots: '#ff9c5b',
    art: () => [[14, 30, '#4aa8de', 5], [86, 26, '#ff5f7e', 4], [16, 118, '#7fd36a', 4.4], [84, 112, '#ffc83d', 5]].map(([x, y, c, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x + r + 2}" cy="${y - 3}" r="1.6" fill="${c}"/><circle cx="${x - r}" cy="${y + r}" r="1.2" fill="${c}"/>`).join('')
      + `<path d="M34 112 46 40M66 112 54 40M50 40v74" stroke="${K}" stroke-width="6" stroke-linecap="round"/><path d="M34 112 46 40M66 112 54 40M50 40v74" stroke="#c98a3a" stroke-width="3" stroke-linecap="round"/>`
      + `<rect x="24" y="34" width="52" height="42" rx="2" fill="#fff" stroke="${K}" stroke-width="3"/><path d="M27 70q10-14 20-6t26-10V73H27z" fill="#7fd36a"/><circle cx="62" cy="46" r="6" fill="#ffc83d"/><path d="M27 58q8-6 14 0" stroke="#4aa8de" stroke-width="3" fill="none" stroke-linecap="round"/>`
      + tshape('M22 80h56v4H22z', '#c98a3a', '#a86a22', '', 2.4) },
  // Exclusivo de la colección: Banda musical. Un tocadiscos con su disco y notas que salen volando.
  partitura: { a: '#efe6ff', b: '#e0d2ff', dots: '#8a5cf0',
    bg: () => [20, 116].map((y) => [0, 4, 8, 12, 16].map((d) => `<path d="M8 ${y + d}h84" stroke="#c9b4ff" stroke-width="1"/>`).join('')).join(''),
    art: () => tshape('M14 74h72v34H14z', '#c98a5a', '#a86a3a', '<circle cx="76" cy="100" r="2.6" fill="#ffc83d"/><circle cx="68" cy="100" r="2.6" fill="#ffc83d"/>', 3)
      + `<ellipse cx="44" cy="76" rx="27" ry="10" fill="#2a2540" stroke="${K}" stroke-width="2.6"/><ellipse cx="44" cy="76" rx="18" ry="6.6" fill="none" stroke="#4a4560" stroke-width="1.4"/><ellipse cx="44" cy="76" rx="7" ry="2.6" fill="#ff5f7e" stroke="${K}" stroke-width="1.4"/>`
      + `<path d="M80 70 70 64 56 74" fill="none" stroke="${K}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M80 70 70 64 56 74" fill="none" stroke="#dfe6f2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
      + [[30, 52, 0.6, -14], [52, 38, 0.7, 10], [74, 50, 0.5, 18], [40, 26, 0.45, -8]].map(([x, y, k, r]) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${k}) translate(-16 -16)">${ICONS.nota()}</g>`).join('') },
  // Exclusivo de la colección: Estudio de cine. Letrero de estreno con focos y la cubeta de palomitas.
  peliculas: { a: '#fff0c8', b: '#ffe08a', dots: '#e8434f', flat: true,
    bg: () => `<g transform="rotate(-28 50 70)"><rect x="-20" y="58" width="140" height="24" fill="#2a2540"/>${Array.from({ length: 14 }, (_, i) => `<rect x="${-18 + i * 10}" y="61" width="5" height="3.4" fill="#fff0c8"/><rect x="${-18 + i * 10}" y="76" width="5" height="3.4" fill="#fff0c8"/>`).join('')}</g>`,
    art: () => `<rect x="16" y="14" width="68" height="26" rx="5" fill="#e8434f" stroke="${K}" stroke-width="3"/>${Array.from({ length: 12 }, (_, i) => `<circle cx="${21 + i * 5.3}" cy="18" r="1.6" fill="#fff6c8"/><circle cx="${21 + i * 5.3}" cy="36" r="1.6" fill="#fff6c8"/>`).join('')}<path d="${starPath(50, 27, 7, 3)}" fill="#ffc83d" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>`
      + Array.from({ length: 9 }, (_, i) => `<circle cx="${34 + (i % 5) * 8 + (i > 4 ? 4 : 0)}" cy="${72 - (i > 4 ? 7 : 0)}" r="6" fill="#fff6e6" stroke="${K}" stroke-width="1.6"/>`).join('')
      + tshape('M28 76h44l-6 46H34z', '#fff', '#e8e0d0', '<path d="M36 76l3 46M46 76l1 46M56 76l-1 46M66 76l-3 46" stroke="#e8434f" stroke-width="5"/>', 3) },
  // Exclusivo de la festividad: Nahual y Chaneques. Piel de jaguar con la máscara del nahual bajo la luna.
  jaguar: { a: '#ffd98a', b: '#ffd98a', flat: true, nodots: true,
    bg: () => Array.from({ length: 24 }, (_, i) => { const x = 14 + (i % 4) * 24 + (Math.floor(i / 4) % 2) * 12, y = 14 + Math.floor(i / 4) * 22; return `<circle cx="${x}" cy="${y}" r="5" fill="none" stroke="#c97a20" stroke-width="2.4" stroke-dasharray="5 3"/><circle cx="${x}" cy="${y}" r="1.6" fill="#c97a20"/>`; }).join(''),
    art: () => `<circle cx="50" cy="70" r="34" fill="#fff6e6" stroke="${K}" stroke-width="3"/><circle cx="50" cy="70" r="29" fill="none" stroke="#3f9a4a" stroke-width="3" stroke-dasharray="4 5"/><g transform="translate(22 42) scale(1.75)">${ICONS.nahual()}</g>`
      + [[16, 118, 0.6], [84, 22, 0.55]].map(([x, y, k]) => `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.chaneque()}</g>`).join('') },
  // Exclusivo de la festividad: Día del Xoloitzcuintle. Farolitos colgando y el xolo que los mira desde su camino de flores.
  xolos: { a: '#ffe2b8', b: '#ffb13d', dots: '#fff6e6',
    art: () => `<path d="M6 14Q50 30 94 14" fill="none" stroke="${K}" stroke-width="1.6"/>` + [[22, 20, 0.6], [50, 26, 0.7], [78, 20, 0.6]].map(([x, y, k]) => `<g transform="translate(${x - 16 * k} ${y - 2}) scale(${k})">${ICONS.farolito()}</g>`).join('')
      + [[30, 116], [44, 110], [60, 114], [72, 106]].map(([x, y]) => marigold(x, y, 5)).join('')
      + `<g transform="translate(16 54) scale(2.1)">${ICONS.xolito()}</g>` },
  // Exclusivo de la festividad: La Llorona. Rebozo a rayas con sus flecos y la Llorona con su velita bajo la luna.
  rebozos: { a: '#d6e2ff', b: '#d6e2ff', flat: true, nodots: true,
    bg: () => Array.from({ length: 12 }, (_, i) => `<rect x="${8 + i * 7}" y="8" width="3" height="124" fill="${i % 3 ? '#a8bff0' : '#4a6ad8'}" opacity=".55"/>`).join('') + Array.from({ length: 21 }, (_, i) => `<path d="M${9 + i * 4} 122v10" stroke="#4a6ad8" stroke-width="1.6"/>`).join(''),
    art: () => `<circle cx="72" cy="28" r="12" fill="#fff6c8" stroke="${K}" stroke-width="2.4"/><g transform="translate(18 40) scale(2)">${ICONS.llorona()}</g><g transform="translate(66 92) scale(.8) translate(-16 -16)">${ICONS.velita()}</g>` },
  // Exclusivo de la festividad: La Catrina. Retrato elegante en su marco dorado, entre plumas.
  elegante: { a: '#ffe0ee', b: '#ffe0ee', dots: '#c9a6ff', flat: true,
    art: () => [[20, 30, -30], [80, 110, 150]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(1.1) translate(-16 -16)">${ICONS.pluma()}</g>`).join('')
      + `<ellipse cx="50" cy="70" rx="30" ry="38" fill="#fff6ee" stroke="${K}" stroke-width="3"/><ellipse cx="50" cy="70" rx="26" ry="34" fill="none" stroke="#ffc83d" stroke-width="3.4"/><ellipse cx="50" cy="70" rx="26" ry="34" fill="none" stroke="#ec9a17" stroke-width="1" stroke-dasharray="2 3"/>`
      + `<g transform="translate(26 44) scale(1.5)">${ICONS.catrina()}</g>` },
  // Exclusivo de la festividad: Día de la Revolución. La locomotora sobre sus vías, echando humo.
  locomotora: { a: '#ffe6c4', b: '#e8c48a', dots: '#c96a1a',
    art: () => `<path d="M18 132 40 96h20l22 36" fill="none" stroke="${K}" stroke-width="3"/>${[100, 108, 118, 130].map((y, i) => `<path d="M${40 - i * 6} ${y}h${20 + i * 12}" stroke="#8a5a3a" stroke-width="${2 + i}"/>`).join('')}`
      + [[30, 30, 6], [40, 22, 8], [54, 18, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${K}" stroke-width="2"/>`).join('')
      + `<g transform="translate(16 36) scale(2.1)">${ICONS.locomotora()}</g>` },
  // Exclusivo de la festividad: Candelaria. La vaporera llena de tamales echando vapor.
  tamales: { a: '#fff1c9', b: '#ecd98e', dots: '#d9b060',
    art: () => [30, 50, 70].map((x, i) => `<path d="M${x} ${44 - (i % 2) * 6}q-6-8 0-14t0-14" fill="none" stroke="#c9a65a" stroke-width="3.4" stroke-linecap="round" opacity=".55"/>`).join('')
      + [[34, 62, -22], [50, 58, 0], [66, 62, 22]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(.95) translate(-16 -16)">${ICONS.tamal()}</g>`).join('')
      + tshape('M18 72h64l-6 42a6 6 0 0 1-6 5H30a6 6 0 0 1-6-5z', '#b8c4d8', '#8f9bb5', '<path d="M22 86h56M24 100h52" stroke="#8f9bb5" stroke-width="2"/>', 3)
      + tshape('M14 68h72v7H14z', '#cfd8e8', '#9aa7cf', '', 2.6) + [10, 90].map((x) => `<circle cx="${x}" cy="84" r="5" fill="none" stroke="${K}" stroke-width="4.4"/><circle cx="${x}" cy="84" r="5" fill="none" stroke="#9aa7cf" stroke-width="2"/>`).join('') },
  // Exclusivo de la festividad: Día del Taco. El trompo al pastor con su piña arriba y un taquito al lado.
  tacos: { a: '#ffe3b8', b: '#ffe3b8', dots: '#e2753a', flat: true,
    art: () => `<path d="M50 14v106" stroke="${K}" stroke-width="5" stroke-linecap="round"/><path d="M50 14v106" stroke="#c9c4e0" stroke-width="2.4" stroke-linecap="round"/>`
      + tshape('M28 44h44l-9 64H37z', '#e2603a', '#b8422a', '<path d="M29 54h42M30 64h40M31 74h38M33 84h34M34 94h32" stroke="#ff9c5b" stroke-width="3"/>', 3)
      + tshape('M43 31 39 14 47 24 50 9 53 24 61 14 57 31z', '#5fae5a', '#3f8a3a', '', 2.4)
      + tshape('M38 40a12 10 0 0 1 24 0z', '#ffc83d', '#ec9a17', '<path d="M41 36l6-6M47 38l8-8M53 38l5-5" stroke="#c97a10" stroke-width="1.4"/>', 2.4)
      + tshape('M32 110h36v8H32z', '#9aa2ba', '#6e7690', '', 2.4)
      + `<g transform="translate(66 104) rotate(-10) scale(.7) translate(-16 -16)">${ICONS.taco()}</g><g transform="translate(18 110) scale(.5) translate(-16 -16)">${ICONS.limon()}</g>` },
  // Exclusivo de la festividad: Día de la Tierra. Un árbol grande en su cerro, con brotes alrededor y el sol.
  planetaverde: { a: '#d6f0ff', b: '#6fc25a', dots: '#fff',
    art: () => `<g transform="translate(64 12) scale(.72)">${ICONS.sol()}</g>`
      + tshape('M45 70h10l3 34H42z', '#8a5a3a', '#6e4026', '', 3)
      + [[34, 62, 15], [66, 62, 15], [50, 46, 19]].map(([x, y, r]) => tshape(CIRCLE(x, y, r), '#5fae5a', '#3f8a3a', '', 3)).join('')
      + [[40, 50], [58, 40], [64, 66], [32, 66], [50, 60]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${i % 2 ? '#ff9cc8' : '#ffc83d'}" stroke="${K}" stroke-width="1.2"/>`).join('')
      + [[20, 116, 0.6], [80, 118, 0.55]].map(([x, y, k]) => `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.brote()}</g>`).join('') },
  // Exclusivo de la festividad: Día del Niño. La piñata colgando de su cuerda y los dulces que van cayendo.
  pinata: { a: '#ffe6f2', b: '#ffe6f2', dots: '#ff7ab8', flat: true,
    art: () => `<path d="M8 12Q50 22 92 12" fill="none" stroke="${K}" stroke-width="2"/><path d="M50 17v18" stroke="${K}" stroke-width="2"/><g transform="rotate(-8 50 36) translate(14 30) scale(2.25)">${ICONS.pinata()}</g>`
      + [[22, 108, '#ff5f7e', 20], [44, 122, '#4aa8de', -30], [66, 112, '#ffc83d', 40], [82, 124, '#7fd36a', -10], [32, 92, '#b48cff', 60]].map(([x, y, c, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-9-4-5 0-9 4zM9-4 5 0 9 4z" fill="${c}" stroke="${K}" stroke-width="1.2" stroke-linejoin="round"/><ellipse rx="5.4" ry="3.6" fill="${c}" stroke="${K}" stroke-width="1.6"/></g>`).join('') },
  // Exclusivo de la festividad: Día de las Madres. Un corazón hecho de claveles con el regalito en medio.
  regalos: { a: '#ffe6ee', b: '#ffe6ee', dots: '#ff7aa6', flat: true,
    art: () => Array.from({ length: 18 }, (_, i) => { const t = (i / 18) * Math.PI * 2, x = (50 + 2.2 * 16 * Math.sin(t) ** 3).toFixed(1), y = (64 - 2.2 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))).toFixed(1); const c = ['#ff5f8f', '#e8434f', '#ffb3cb'][i % 3];
        return `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((d) => `<circle cx="${(Math.cos((d * Math.PI) / 180) * 3).toFixed(1)}" cy="${(Math.sin((d * Math.PI) / 180) * 3).toFixed(1)}" r="3.4" fill="${c}" stroke="${K}" stroke-width="1.2"/>`).join('')}<circle r="2.4" fill="#fff0f4"/></g>`; }).join('')
      + `<g transform="translate(50 68) scale(1.15) translate(-16 -16)">${ICONS.regalito()}</g>` },
  // Exclusivo de la festividad: Día del Padre. La camisa de papá: cuello, su corbata y una pluma en la bolsa.
  bigotes: { a: '#dcecff', b: '#dcecff', flat: true, nodots: true,
    bg: () => Array.from({ length: 9 }, (_, i) => `<path d="M${12 + i * 10} 8v124" stroke="#b8d4f5" stroke-width="2"/>`).join(''),
    art: () => tshape('M50 34 26 8 16 24 40 44z', '#fff', '#dfe6f2', '', 2.6) + tshape('M50 34 74 8 84 24 60 44z', '#fff', '#dfe6f2', '', 2.6)
      + `<g transform="translate(15 22) scale(2.2)">${ICONS.corbata()}</g>`
      + tshape('M14 76h22v22H14z', '#cfe2fa', '#a8c8f0', '', 2.4) + `<path d="M20 70v12" stroke="${K}" stroke-width="4.4" stroke-linecap="round"/><path d="M20 70v12" stroke="#e8434f" stroke-width="2" stroke-linecap="round"/>`
      + [100, 116].map((y) => `<circle cx="74" cy="${y}" r="2.6" fill="#fff" stroke="${K}" stroke-width="1.4"/>`).join('') },
  // Exclusivo de la festividad: Día del Gato. Un michi dormido en su cojín, con sus zzz y su estambre.
  michis: { a: '#e6dcff', b: '#d6c6ff', dots: '#b48cff',
    art: () => tshape(ELL(50, 100, 40, 13), '#ff9cc8', '#e87aa8', '', 3)
      + `<path d="M76 92Q94 74 80 64" fill="none" stroke="${K}" stroke-width="9" stroke-linecap="round"/><path d="M76 92Q94 74 80 64" fill="none" stroke="#a9b0c8" stroke-width="4.6" stroke-linecap="round"/>`
      + tshape(ELL(54, 86, 28, 15), '#a9b0c8', '#868ea8', '<path d="M50 72v8M58 72v8M66 74v7" stroke="#6e7690" stroke-width="2.4" stroke-linecap="round"/>', 3)
      + tshape('M18 76 20 60 30 68z', '#a9b0c8', '#868ea8', '', 2.4) + tshape('M38 74 40 59 30 66z', '#a9b0c8', '#868ea8', '', 2.4)
      + tshape(CIRCLE(29, 82, 13), '#a9b0c8', '#868ea8', '', 3)
      + `<path d="M22 82q3 3 6 0M31 82q3 3 6 0" fill="none" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/><path d="M27.6 86h2.8l-1.4 1.6z" fill="#ff7a9a"/>`
      + `<text x="42" y="54" font-family="Lilita One, sans-serif" font-size="13" fill="#8a5cf0">z</text><text x="52" y="40" font-family="Lilita One, sans-serif" font-size="18" fill="#8a5cf0">z</text>`
      + `<g transform="translate(78 30) scale(.5) translate(-16 -16)">${ICONS.estambre()}</g>` },
  // Exclusivo de la festividad: Día del Perro. La casita roja con el cachorro asomado y su plato con hueso.
  cachorros: { a: '#ffe6cc', b: '#7fc46a', dots: '#fff',
    art: () => tshape('M22 60h56v50H22z', '#ff9c5b', '#e2753a', '<path d="M22 72h56M22 86h56M22 100h56" stroke="#e2753a" stroke-width="1.6"/>', 3)
      + tshape('M14 64 50 28 86 64z', '#e8434f', '#c22c3c', '<path d="M30 52h40M22 60h56" stroke="#c22c3c" stroke-width="1.6"/>', 3)
      + tshape('M37 110V88a13 13 0 0 1 26 0v22z', '#5a3a2a', '#3a2418', '', 3)
      + `<g transform="translate(50 96) scale(.85) translate(-16 -16)">${ICONS.cachorro()}</g>`
      + tshape('M70 114h20l-3 8H73z', '#4aa8de', '#2f86c0', '', 2.2) + `<g transform="translate(80 110) rotate(-10) scale(.42) translate(-16 -16)">${ICONS.hueso()}</g>` },
  // Exclusivo de la festividad: Día del Gamer. Pantalla de videojuego: vidas arriba, el control y el piso de bloques.
  controles: { a: '#b9a6ff', b: '#a48ef5', dots: '#fff', flat: true,
    bg: () => Array.from({ length: 84 }, (_, i) => { const x = i % 7, y = Math.floor(i / 7); return (x + y) % 2 ? '' : `<rect x="${8 + x * 12}" y="${8 + y * 12}" width="12" height="12" fill="#fff" opacity=".13"/>`; }).join('')
      + Array.from({ length: 7 }, (_, i) => `<rect x="${8 + i * 12}" y="114" width="12" height="18" fill="${i % 2 ? '#5fae5a' : '#7fd36a'}" stroke="${K}" stroke-width="1.6"/>`).join(''),
    art: () => `${[18, 30, 42].map((x) => `<g transform="translate(${x - 6} 14) scale(.38)">${ICONS.pixcora()}</g>`).join('')}<g transform="translate(70 13) scale(.4)">${ICONS.coin()}</g>`
      + `<g transform="rotate(-12 50 70) translate(14 38) scale(2.25)">${ICONS.control()}</g>` },
  // Exclusivo de la festividad: Día del Programador. Ventana del editor con su código de colores y las llaves abajo.
  binario: { a: '#c8f5d8', b: '#a8ecc0', dots: '#2f9e5c',
    art: () => `<rect x="15" y="26" width="70" height="64" rx="7" fill="#163a26" stroke="${K}" stroke-width="3"/><path d="M15 33a7 7 0 0 1 7-7h56a7 7 0 0 1 7 7v4H15z" fill="#2f5a40"/>`
      + ['#ff5f7e', '#ffc83d', '#7fd36a'].map((c, i) => `<circle cx="${23 + i * 7}" cy="32" r="2.4" fill="${c}"/>`).join('')
      + [[22, 46, 18, '#b48cff'], [43, 46, 22, '#7fe8a0'], [28, 54, 26, '#5ff0ff'], [28, 62, 14, '#ffc83d'], [45, 62, 24, '#ff9cc8'], [28, 70, 30, '#7fe8a0'], [22, 78, 10, '#b48cff']].map(([x, y, w, c]) => `<rect x="${x}" y="${y - 2}" width="${w}" height="4" rx="2" fill="${c}"/>`).join('')
      + `<rect x="35" y="74" width="3.4" height="7" fill="#c8f5d8"/><g transform="translate(34 96) scale(1)">${ICONS.llaves()}</g>` },
  // Exclusivo de la festividad: Día de los Inocentes. Rombos de arlequín claros y la palomita con su gorro de bufón.
  arlequin: { a: '#ffe9a8', b: '#ffe9a8', flat: true, nodots: true,
    bg: () => Array.from({ length: 48 }, (_, i) => { const c = i % 6, r = Math.floor(i / 6), x = 8 + c * 17 + (r % 2 ? 8.5 : 0), y = 8 + r * 17; return `<path d="M${x} ${y - 8.5}l8.5 8.5-8.5 8.5-8.5-8.5z" fill="${(c + r) % 2 ? '#ff8a8f' : '#b9a0f5'}" opacity=".45"/>`; }).join(''),
    art: () => `<circle cx="50" cy="78" r="27" fill="#fff6ee" stroke="${K}" stroke-width="3"/><circle cx="50" cy="78" r="22" fill="none" stroke="#ffc83d" stroke-width="2" stroke-dasharray="3 4"/>`
      + `<g transform="translate(26 58) scale(1.5)">${ICONS.palomita()}</g><g transform="rotate(14 60 40) translate(42 22) scale(1.05)">${ICONS.bufon()}</g>` },
  // Exclusivo de la festividad: Año Nuevo. Serpentinas de colores, el reloj a punto de dar las doce y uvas en las esquinas.
  medianoche: { a: '#8a7cf5', b: '#7766e8', dots: '#ffe27a',
    bg: () => [['#ff9cc8', 22], ['#5ff0ff', 52], ['#ffe27a', 92]].map(([c, y]) => `<path d="M0 ${y}q12-12 24 0t24 0 24 0 24 0 24 0" fill="none" stroke="${c}" stroke-width="3" opacity=".75" transform="rotate(-18 50 ${y})"/>`).join('')
      + [[20, 40, '#ffe27a'], [78, 36, '#ff9cc8'], [30, 104, '#5ff0ff'], [72, 110, '#fff'], [58, 22, '#7fd36a']].map(([x, y, c], i) => `<rect x="${x}" y="${y}" width="6" height="3.4" fill="${c}" transform="rotate(${i * 40} ${x} ${y})"/>`).join(''),
    art: () => `<g transform="translate(16 38) scale(2.1)">${ICONS.reloj()}</g>${[[22, 114, 0.5], [78, 114, 0.5]].map(([x, y, k]) => `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.uvas()}</g>`).join('')}` },
  // Exclusivo del evento: Día de Muertos. Altar: papel picado arriba, la calaverita entre dos velas y cempasúchil en el mantel.
  calaverita: { a: '#ffd08a', b: '#b36bff', dots: '#fff6e6', flat: true,
    bg: () => `<path d="M6 7h88" stroke="${K}" stroke-width="1.4"/>` + [['#ff5fa8', 10], ['#5fd1c5', 36], ['#7b2fbf', 62]].map(([c, x]) => `<path d="M${x} 7h28v20l-3.5-4-3.5 4-3.5-4-3.5 4-3.5-4-3.5 4-3.5-4-3.5 4z" fill="${c}" stroke="${K}" stroke-width="1.4" stroke-linejoin="round"/><circle cx="${x + 9}" cy="15" r="2.4" fill="#ffd08a"/><circle cx="${x + 19}" cy="15" r="2.4" fill="#ffd08a"/><path d="M${x + 11} 21h6" stroke="#ffd08a" stroke-width="2"/>`).join('')
      + `<rect x="8" y="104" width="84" height="28" fill="#b36bff"/><path d="M8 104h84" stroke="${K}" stroke-width="2.4"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${9 + i * 7} 104l3.5 6 3.5-6" fill="#ff5fa8" stroke="${K}" stroke-width="1.2" stroke-linejoin="round"/>`).join('')}`,
    art: () => [20, 80].map((x) => `${tshape(`M${x - 5} 82h10v22h-10z`, '#fff6e6', '#e8d8c0', '', 2.2)}<path d="M${x} 81q-4-6 0-11 4 5 0 11z" fill="#ffb13d" stroke="${K}" stroke-width="1.6"/>`).join('')
      + `<g transform="translate(23 50) scale(1.7)">${ICONS.calavera()}</g>` + [[30, 120, 7], [50, 124, 8], [70, 120, 7]].map(([x, y, r]) => marigold(x, y, r)).join('') },
  // Exclusivo del evento: Navidad. El pino con su estrella y esferas, sobre nieve, con copos cayendo.
  esferas: { a: '#d8efff', b: '#fff', dots: '#9fd0ff',
    art: () => [[18, 24, 4], [84, 32, 5], [18, 66, 3.6], [86, 78, 4]].map(([x, y, r]) => flake(x, y, r, '#fff', 1.6)).join('')
      + tshape('M45 96h10v12H45z', '#8a5a3a', '#6e4026', '', 2.4)
      + tshape('M50 30 74 64H62L80 98H20L38 64H26z', '#3f9a5a', '#2f7a46', '<path d="M30 92q20-8 42-14M34 60q14-4 28-10" stroke="#ffc83d" stroke-width="2" fill="none" stroke-dasharray="1 4" stroke-linecap="round"/>', 3)
      + `<path d="${starPath(50, 27, 10, 4.4)}" fill="#ffc83d" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/>`
      + [[42, 56, 0.32], [58, 74, 0.34], [38, 86, 0.3], [64, 90, 0.28]].map(([x, y, k]) => `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.esfera()}</g>`).join('') },
  // Exclusivo del evento: Día de Reyes. La rosca vista desde arriba con su fruta cristalizada, la corona y el muñequito asomado.
  rosca: { a: '#ffe9c0', b: '#ffe9c0', dots: '#e8a94a', flat: true,
    art: () => `<ellipse cx="50" cy="78" rx="34" ry="27" fill="none" stroke="${K}" stroke-width="24"/><ellipse cx="50" cy="78" rx="34" ry="27" fill="none" stroke="#d98a3a" stroke-width="18.5"/><ellipse cx="50" cy="75.5" rx="34" ry="27" fill="none" stroke="#f0b05a" stroke-width="10"/>`
      + Array.from({ length: 10 }, (_, i) => { const t = (i / 10) * Math.PI * 2, x = (50 + Math.cos(t) * 34).toFixed(1), y = (75.5 + Math.sin(t) * 27).toFixed(1); return `<rect x="${x - 5}" y="${y - 2}" width="10" height="4" rx="2" fill="${['#e8434f', '#5fae5a', '#ffc83d'][i % 3]}" stroke="${K}" stroke-width="1.2" transform="rotate(${Math.round((t * 180) / Math.PI + 90)} ${x} ${y})"/>`; }).join('')
      + `<circle cx="70" cy="101" r="5.4" fill="#ffe0c4" stroke="${K}" stroke-width="2"/><circle cx="68.4" cy="100.4" r=".9" fill="${K}"/><circle cx="71.6" cy="100.4" r=".9" fill="${K}"/>`
      + `<g transform="translate(34 18)">${ICONS.crown()}</g>` },
  // Exclusivo del evento: Amor y Amistad. Cartitas que vuelan por un camino de corazones.
  cartas: { a: '#ffd9e8', b: '#ffd9e8', dots: '#ff7aa6', flat: true,
    art: () => `<path d="M12 126Q30 100 46 94T70 58 88 18" fill="none" stroke="#ff7aa6" stroke-width="2.4" stroke-dasharray="2 5" stroke-linecap="round"/>`
      + [[26, 104, -16, 1.05], [56, 70, 8, 1.3], [74, 30, -10, 0.9]].map(([x, y, r, k]) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${k}) translate(-16 -16)">${ICONS.sobre()}</g>`).join('')
      + [[42, 120, 0.32], [84, 60, 0.3], [22, 42, 0.36], [46, 22, 0.26]].map(([x, y, k]) => `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.corazon()}</g>`).join('') },
  // Exclusivo del evento: Primavera. Jardín: tres tulipanes en el pasto, mariposas y el sol.
  tulipanes: { a: '#d6f0ff', b: '#7fd36a', dots: '#fff',
    art: () => `<g transform="translate(60 12) scale(.8)">${ICONS.sol()}</g>`
      + [[26, 90, 0.95], [50, 80, 1.15], [74, 92, 0.95]].map(([x, y, k]) => `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.tulipan()}</g>`).join('')
      + [[22, 40, 0.55, -15], [80, 54, 0.45, 20]].map(([x, y, k, r]) => `<g transform="translate(${x - 16 * k} ${y - 16 * k}) rotate(${r} ${16 * k} ${16 * k}) scale(${k})">${ICONS.mariposa()}</g>`).join('')
      + `<path d="M14 128l3-10 3 10M34 130l2-8 3 8M62 130l3-9 3 9M82 128l2-8 3 8" fill="#5fae5a" stroke="${K}" stroke-width="1.4" stroke-linejoin="round"/>` },
  sandias: { a: '#5fc7e8', b: '#f3d48a', dots: '#fff', art: () => `${[[20, 26, 0.48], [80, 116, 0.48], [80, 26, 0.36], [22, 116, 0.36]].map(([x, y, k]) => `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.sol()}</g>`).join('')}<g transform="translate(14 36) scale(2.25)">${ICONS.sandia()}</g>` },
  vivamexico: { a: '#fff6ee', b: '#fff6ee', flat: true, dots: '#ffd27a', bg: () => `<rect x="8" y="8" width="28" height="124" fill="#2f9e5c"/><rect x="64" y="8" width="28" height="124" fill="#e8434f"/>`,
    art: () => `${[[22, 26, -20, 0.5], [78, 116, 160, 0.5], [78, 26, 20, 0.42], [22, 116, 200, 0.42]].map(([x, y, a, k]) => `<g transform="translate(${x - 16 * k} ${y - 16 * k}) rotate(${a} ${16 * k} ${16 * k}) scale(${k})">${ICONS.chile()}</g>`).join('')}<g transform="translate(14 38) scale(2.25)">${ICONS.sombrero()}</g>` },
  // Exclusivo del evento: Halloween. Huerto de calabazas bajo la luna llena, con murciélagos (más claro, para que no se pierda).
  calabazas: { a: '#a890f0', b: '#6a4fc0', dots: '#fff3c4',
    art: () => `<circle cx="68" cy="32" r="17" fill="#fff3c4" stroke="${K}" stroke-width="2.6"/><circle cx="62" cy="28" r="3" fill="#efdca0"/><circle cx="73" cy="38" r="2.2" fill="#efdca0"/>`
      + [[28, 30, 0.45], [42, 48, 0.34]].map(([x, y, k]) => `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.murcielago()}</g>`).join('')
      + `<path d="M14 112q12-10 22 0t22 0 22 0" fill="none" stroke="#3f8a3a" stroke-width="2.6" stroke-linecap="round"/>`
      + [[70, 102, 0.8], [30, 100, 0.95], [52, 116, 0.7]].map(([x, y, k]) => `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.calabaza()}</g>`).join('') },
  // Exclusivo de los códigos: Tesoro escondido. Mapa de pergamino con su camino punteado, la palmera y la X roja.
  mapatesoro: { a: '#f3dca6', b: '#f3dca6', flat: true, nodots: true,
    bg: () => `<ellipse cx="24" cy="30" rx="18" ry="12" fill="#e8c98a" opacity=".55"/><ellipse cx="78" cy="104" rx="20" ry="14" fill="#e8c98a" opacity=".55"/><ellipse cx="66" cy="20" rx="10" ry="6" fill="#d9b06a" opacity=".35"/>`
      + `<path d="M14 54q8-4 14 2t14-2M60 120q6-3 12 1t12-1" fill="none" stroke="#7fc6d6" stroke-width="2" stroke-linecap="round"/>`,
    art: () => `<path d="M30 112Q22 92 40 88T58 70Q74 62 68 44" fill="none" stroke="#c22c3c" stroke-width="3" stroke-linecap="round" stroke-dasharray="5 5"/>`
      + `<g transform="translate(8 84) scale(1.25)">${ICONS.palmera()}</g>`
      + `<path d="M58 26 76 44M76 26 58 44" stroke="${K}" stroke-width="10" stroke-linecap="round"/><path d="M58 26 76 44M76 26 58 44" stroke="#e8434f" stroke-width="5.4" stroke-linecap="round"/>`
      + `<g transform="translate(64 96)"><circle r="11" fill="#fff6e6" stroke="${K}" stroke-width="2.4"/><path d="M0-9 2.6 0 0 9-2.6 0z" fill="#e8434f" stroke="${K}" stroke-width="1.4" stroke-linejoin="round"/><path d="M-9 0 0-2.4 9 0 0 2.4z" fill="#4aa8de" stroke="${K}" stroke-width="1.4" stroke-linejoin="round"/></g>` },
  // Exclusivo de la lluvia de meteoritos: noche morada con meteoritos que caen en diagonal y polvo de estrellas.
  lluvia: { a: '#2a1f66', b: '#1d1550', flat: true, dots: '#ffe7a8',
    bg: () => `<ellipse cx="80" cy="24" rx="30" ry="18" fill="#ff8a3d" opacity=".16"/><ellipse cx="20" cy="118" rx="30" ry="18" fill="#8a5cf0" opacity=".3"/>`
      + [[66, 22, 0.5], [84, 58, 0.42], [22, 40, 0.38], [74, 104, 0.46]].map(([x, y, k]) => `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.meteoro()}</g>`).join(''),
    art: () => `<g transform="translate(14 38) scale(2.1)">${ICONS.meteoro()}</g>` },
  regalo: { a: '#7b4ee6', b: '#6438c8', star: ['#fff6e6', '#e3d3ff'] },
  comodin: { a: '#ffc83d', b: '#eca21f', star: ['#ff9c2b', '#e8761a'], dots: '#fff4c7' },
};
const backCache = {};
// La baraja que usa el jugador (la cambia la tienda): cardBackURL() sin nombre la dibuja.
let deck = 'clasico';
export const setDeck = (k) => (deck = BACKS[k] ? k : 'clasico');
// frame: color de la orilla (la del cohete turbo es naranja; la normal, crema).
export function cardBackURL(k = deck, frame = '#fff6e6') {
  const ck = `${k}|${frame}`;
  if (backCache[ck]) return backCache[ck];
  const t = BACKS[k] || BACKS.clasico;
  let dots = '', seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 22; i++) dots += `<circle cx="${(14 + r() * 72).toFixed(1)}" cy="${(14 + r() * 112).toFixed(1)}" r="${(0.8 + r() * 1.3).toFixed(1)}" fill="${t.dots || '#fff'}" opacity="${(0.25 + r() * 0.4).toFixed(2)}"/>`;
  const emb = t.art ? t.art() : t.star
    ? `<path d="${starPath(50, 72, 27, 12.5)}" fill="${t.star[1]}" stroke="${K}" stroke-width="4" stroke-linejoin="round"/><path d="${starPath(48.5, 69.5, 24, 11)}" fill="${t.star[0]}"/>`
    : t.moon // luna creciente con cráteres
      ? `<path d="M60 48A26 26 0 1 0 60 96 27 27 0 0 1 60 48z" fill="#fff1d6" stroke="${K}" stroke-width="4" stroke-linejoin="round"/><path d="M58 52A22 22 0 0 0 40 90" fill="none" stroke="#e8c98a" stroke-width="4" stroke-linecap="round"/><circle cx="35" cy="66" r="3.6" fill="#e8c98a"/><circle cx="40" cy="80" r="2.4" fill="#e8c98a"/>`
      : t.comet // cometa con cola
        ? `<path d="M30 98 74 52" stroke="${K}" stroke-width="17" stroke-linecap="round"/><path d="M30 98 74 52" stroke="#d8f0ff" stroke-width="11" stroke-linecap="round"/><path d="M38 96 72 60" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/><path d="${starPath(32, 96, 17, 8)}" fill="#ffc83d" stroke="${K}" stroke-width="4" stroke-linejoin="round"/>`
        : t.constel // constelación de estrellas doradas unidas
          ? `<path d="M26 98 40 60 62 74 76 44" fill="none" stroke="#c9bff0" stroke-width="2.5" stroke-dasharray="4 4"/>${[[26, 98, 8], [40, 60, 10], [62, 74, 7], [76, 44, 9]].map(([x, y, r]) => `<path d="${starPath(x, y, r, r * 0.46)}" fill="#ffc83d" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`).join('')}`
          : t.emb ? `<g transform="translate(22 42) scale(1.75)">${planetInner(...t.emb)}</g>` : "";
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140"><rect x="1.5" y="1.5" width="97" height="137" rx="13" fill="${frame}" stroke="${K}" stroke-width="3"/><defs><clipPath id="in"><rect x="8" y="8" width="84" height="124" rx="8"/></clipPath></defs><rect x="8" y="8" width="84" height="124" rx="8" fill="${t.a}"/><g clip-path="url(#in)">${t.bg ? t.bg() : ''}${t.flat ? '' : `<path d="M8 100Q50 84 92 100V132H8z" fill="${t.b}"/>`}</g><rect x="8" y="8" width="84" height="124" rx="8" fill="none" stroke="${K}" stroke-width="2.5"/>${t.nodots ? '' : dots}${emb}</svg>`;
  return (backCache[ck] = svgUrl(s));
}
// Compatibilidad: antes el reverso dependía del tono del mundo; ahora es la baraja elegida.
export const cardBack = () => '';

// ---------- Avatar del jugador ----------
// Su inicial o un personaje 2D, sobre un círculo del color que elija.
export const AVATAR_COLORS = ['#ff9c5b', '#ff5f7e', '#8a5cf0', '#4aa8de', '#2fae6a', '#ffc83d', '#5fc7e8', '#e8758a'];
export const AVATAR_HUES = AVATAR_COLORS; // nombre viejo

// Piezas de los personajes (lienzo de 100×100, el círculo los recorta).
const P = (d, a, b, inside = '') => tshape(d, a, b, inside, 4, [-2.2, -3.6]);
const ELL = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`;
const mirror = (inner) => `${inner}<g transform="matrix(-1 0 0 1 100 0)">${inner}</g>`;
const eyes = (y = 52, dx = 13, r = 5) => [-dx, dx].map((x) => `<circle cx="${50 + x}" cy="${y}" r="${r}" fill="${K}"/><circle cx="${50 + x - r * 0.35}" cy="${y - r * 0.4}" r="${r * 0.38}" fill="#fff"/>`).join('');
const smile = (y = 63, w = 7) => `<path d="M${50 - w} ${y}q${w} ${w * 0.85} ${2 * w} 0" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>`;
const blush = (y = 61, dx = 22) => [-dx, dx].map((x) => `<ellipse cx="${50 + x}" cy="${y}" rx="5.5" ry="3.2" fill="#ff6f8e" opacity=".55"/>`).join('');
const shoulders = (a, b) => P('M10 104Q12 80 50 78Q88 80 90 104z', a, b);
// Cara de niño o niña: piel, orejas y facciones (el pelo lo pone cada uno).
const kid = (shirt, shirtD) => shoulders(shirt, shirtD)
  + mirror(P(CIRCLE(23, 55, 6), '#ffc596', '#eda06c'))
  + P(CIRCLE(50, 53, 27), '#ffd3a8', '#f2b07c');
const kidFace = () => eyes(56, 11, 4.4) + smile(65, 6) + blush(63, 19);
export const AVATARS = {
  nino: () => kid('#ff9c5b', '#e2753a')
    + `<path d="M40 82 50 92 60 82" fill="none" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`
    + P('M22 52Q18 22 50 21Q82 22 78 52Q74 40 64 37Q58 43 47 38Q36 42 22 52z', '#7a4a2a', '#5a331b')
    + P('M46 24Q49 11 61 12Q56 17 55 25z', '#7a4a2a', '#5a331b')
    + kidFace(),
  nina: () => mirror(P(CIRCLE(24, 25, 11), '#4a2e6b', '#352050'))
    + mirror(P('M24 50Q18 64 21 80Q28 78 30 66z', '#4a2e6b', '#352050'))
    + kid('#8a5cf0', '#6a3fd0')
    + P('M22 54Q18 22 50 21Q82 22 78 54Q72 38 58 34Q54 41 44 36Q32 40 22 54z', '#4a2e6b', '#352050')
    + P(starPath(70, 30, 7, 3.2), '#ffc83d', '#ec9a17', '', 2.6)
    + kidFace(),
  astro: () => shoulders('#f4f1ff', '#d3cdea')
    + `<path d="M50 18V9" stroke="${K}" stroke-width="3.5"/>` + P(CIRCLE(50, 8, 4.5), '#ff5f7e', '#d63d5f')
    + mirror(P(CIRCLE(20, 48, 6), '#c9bff0', '#a79ee0'))
    + P(CIRCLE(50, 48, 31), '#f4f1ff', '#d3cdea')
    + P('M28 42a12 12 0 0 1 12-12h20a12 12 0 0 1 12 12v5a14 14 0 0 1-14 14H42a14 14 0 0 1-14-14z', '#2f3f8f', '#22306e',
      `<ellipse cx="42" cy="45" rx="3.6" ry="4.6" fill="#fff"/><ellipse cx="58" cy="45" rx="3.6" ry="4.6" fill="#fff"/><path d="M45 53q5 4 10 0" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M33 38q3-5 9-5" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6"/>`),
  ajolote: () => shoulders('#ffb3d1', '#f28ab3')
    + mirror([[17, 32, -40], [11, 47, -8], [15, 62, 24]].map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})">${P(ELL(x, y, 11, 5.5), '#ff6f9e', '#e04f85')}</g>`).join(''))
    + P(ELL(50, 52, 32, 26), '#ffc2dc', '#f59cc0') + eyes(49, 15, 4.6) + `<path d="M36 60q14 10 28 0" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>` + blush(58, 24),
  gato: () => shoulders('#ffb066', '#e8853e')
    + mirror(P('M20 42 24 12 44 30z', '#ffb066', '#e8853e', '<path d="M26 34 28 20 37 29z" fill="#ff9cb4"/>'))
    + P(ELL(50, 54, 32, 27), '#ffc183', '#f0974f', `<path d="M44 30v7M50 29v8M56 30v7" stroke="#e8853e" stroke-width="3.4" stroke-linecap="round"/>`)
    + eyes(52, 13, 4.8) + `<path d="M47 60h6l-3 3.5z" fill="#ff7a9a" stroke="${K}" stroke-width="2" stroke-linejoin="round"/><path d="M50 63.5q-3 4-7 1M50 63.5q3 4 7 1" fill="none" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>`
    + mirror(`<path d="M30 60 12 57M30 64 13 66" stroke="${K}" stroke-width="2.2" stroke-linecap="round"/>`),
  zorro: () => shoulders('#ff8a3d', '#e2692a')
    + mirror(P('M18 44 20 8 44 30z', '#ff8a3d', '#e2692a', '<path d="M24 34 25 18 36 29z" fill="#5a3324"/>'))
    + P('M16 48Q16 26 50 26Q84 26 84 48Q84 68 50 84Q16 68 16 48z', '#ff9a4f', '#ec7631', '<path d="M16 50Q32 52 50 84Q24 74 16 50zM84 50Q68 52 50 84Q76 74 84 50z" fill="#fff6e6"/>')
    + eyes(50, 14, 4.6) + `<ellipse cx="50" cy="70" rx="5" ry="3.8" fill="${K}"/>` + smile(74, 4),
  robot: () => shoulders('#b9c4e0', '#8f9cc4')
    + `<path d="M50 28V14" stroke="${K}" stroke-width="3.5"/>` + P(CIRCLE(50, 12, 5), '#ffc83d', '#ec9a17')
    + mirror(P('M10 46h8v18h-8z', '#8f9cc4', '#6f7cab'))
    + P('M24 28h52a9 9 0 0 1 9 9v34a9 9 0 0 1-9 9H24a9 9 0 0 1-9-9V37a9 9 0 0 1 9-9z', '#c9d2ea', '#9aa7cf',
      `<path d="M27 37h46a5 5 0 0 1 5 5v22a5 5 0 0 1-5 5H27a5 5 0 0 1-5-5V42a5 5 0 0 1 5-5z" fill="#24305e" stroke="${K}" stroke-width="3"/><rect x="33" y="44" width="10" height="10" rx="3" fill="#5ff0ff"/><rect x="57" y="44" width="10" height="10" rx="3" fill="#5ff0ff"/><path d="M42 60q8 5 16 0" fill="none" stroke="#5ff0ff" stroke-width="3" stroke-linecap="round"/>`),
  alien: () => shoulders('#7fd85a', '#56b83a')
    + mirror(`<path d="M40 28 30 10" stroke="${K}" stroke-width="3.5" stroke-linecap="round"/>` + P(CIRCLE(29, 9, 5), '#ff7ab8', '#e0569a'))
    + P('M50 22C77 22 86 42 82 58 78 74 63 86 50 86 37 86 22 74 18 58 14 42 23 22 50 22z', '#9be86a', '#6cc447')
    + mirror(`<g transform="rotate(-28 36 54)"><ellipse cx="36" cy="54" rx="9" ry="12.5" fill="${K}"/><ellipse cx="33" cy="49" rx="3" ry="4" fill="#fff"/></g>`)
    + `<path d="M45 72q5 3 10 0" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`,
  pulpo: () => mirror([18, 32, 46].map((x, i) => P(`M${x - 6} 70h12v${22 - i * 3}a6 6 0 0 1-12 0z`, '#a77bff', '#8257e6')).join(''))
    + P('M18 66C16 34 32 18 50 18S84 34 82 66Q66 74 50 74T18 66z', '#b993ff', '#9068ee', '<circle cx="34" cy="30" r="4" fill="#d9c4ff"/><circle cx="64" cy="26" r="3" fill="#d9c4ff"/><circle cx="72" cy="40" r="2.4" fill="#d9c4ff"/>')
    + eyes(50, 13, 5) + smile(60, 6) + blush(58, 23),
  buho: () => mirror(P('M24 36 21 12 40 27z', '#a8703f', '#835228'))
    + P(ELL(50, 62, 34, 36), '#b57a4a', '#8d5a32', `<path d="${ELL(50, 86, 19, 17)}" fill="#f2d3a8"/><path d="M42 82l4 3 4-3 4 3 4-3M44 90l3 2 3-2 3 2 3-2" fill="none" stroke="#c99a68" stroke-width="2.2" stroke-linecap="round"/>`)
    + mirror(P(CIRCLE(37, 50, 12.5), '#fff6e6', '#ecdcc0') + `<circle cx="38" cy="51" r="6.5" fill="${K}"/><circle cx="35.5" cy="48.5" r="2.4" fill="#fff"/>`)
    + P('M45 60h10l-5 9z', '#ffb02e', '#e8851a', '', 3),
  dino: () => mirror(P('M8 104Q10 80 50 78Q90 80 92 104z', '#7fd85a', '#56b83a'))
    + [[36, 30, -20], [50, 24, 0], [64, 30, 20]].map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})">${P(`M${x - 7} ${y + 8}L${x} ${y - 8}L${x + 7} ${y + 8}z`, '#ff9c5b', '#e2753a')}</g>`).join('')
    + P(ELL(50, 56, 31, 27), '#8fe06a', '#62c043', `<circle cx="30" cy="40" r="3" fill="#62c043"/><circle cx="70" cy="38" r="2.4" fill="#62c043"/>`)
    + P(ELL(50, 69, 17, 10), '#c8f5a8', '#a8e284', `<circle cx="45" cy="66" r="1.8" fill="${K}"/><circle cx="55" cy="66" r="1.8" fill="${K}"/>`)
    + eyes(51, 14, 5) + `<path d="M43 72q7 5 14 0" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round"/>` + blush(60, 24),
  unicornio: () => shoulders('#f4ecff', '#dccff0')
    + mirror(P('M24 40Q8 62 18 86Q26 74 32 60z', '#ff9cc8', '#e870a8'))
    + mirror(P('M28 36 30 16 42 30z', '#fff6fb', '#ecd8ec', '<path d="M32 30 33 21 38 28z" fill="#ffb3d1"/>'))
    + P(ELL(50, 57, 28, 26), '#fff6fb', '#ecd8ec')
    + P('M30 40Q40 24 60 32Q70 28 72 40Q60 34 50 40Q40 36 30 40z', '#b993ff', '#9068ee')
    + P('M44 32 50 6 56 32z', '#ffc83d', '#ec9a17', `<path d="M46 26l8-3M47 19l6-2" stroke="#fff3b8" stroke-width="2.4" stroke-linecap="round"/>`)
    + eyes(57, 11, 4.4) + smile(67, 5) + blush(65, 19),
  panda: () => shoulders('#3a3a4a', '#26263a')
    + mirror(P(CIRCLE(26, 32, 10), '#3a3a4a', '#26263a'))
    + P(ELL(50, 57, 31, 27), '#ffffff', '#e3e0ef')
    + mirror(`<g transform="rotate(-25 37 55)">${P(ELL(37, 55, 8, 10.5), '#3a3a4a', '#26263a')}</g><circle cx="37" cy="54" r="3.6" fill="#fff"/><circle cx="36" cy="53" r="1.6" fill="${K}"/>`)
    + `<ellipse cx="50" cy="66" rx="5" ry="3.6" fill="${K}"/>` + smile(71, 4.5) + blush(66, 25),
  pinguino: () => shoulders('#2f3550', '#1f2440')
    + P(ELL(50, 54, 32, 30), '#2f3550', '#1f2440')
    + P('M50 40Q60 30 72 40Q80 56 70 72Q60 82 50 82Q40 82 30 72Q20 56 28 40Q40 30 50 40z', '#ffffff', '#e3e0ef')
    + eyes(54, 11, 4.4) + P('M43 62h14l-7 8z', '#ffb02e', '#e8851a') + blush(64, 19),
  conejo: () => shoulders('#f4f1ff', '#d3cdea')
    + mirror(`<g transform="rotate(-8 36 24)">${P('M30 42Q22 4 35 2Q46 6 42 42z', '#f4f1ff', '#d3cdea', '<path d="M33 36Q30 14 35 9Q40 14 38 36z" fill="#ffb3d1"/>')}</g>`)
    + P(ELL(50, 60, 28, 25), '#f4f1ff', '#d3cdea')
    + eyes(58, 11, 4.4) + `<path d="M47 65h6l-3 3z" fill="#ff7a9a" stroke="${K}" stroke-width="2" stroke-linejoin="round"/><path d="M50 68q-3 4-6 1M50 68q3 4 6 1" fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>` + blush(66, 19),
  capibara: () => shoulders('#b8865a', '#94663e')
    + mirror(P(CIRCLE(25, 33, 6), '#a87650', '#86592f'))
    + P('M20 44Q20 28 50 28Q80 28 80 44V66Q80 84 50 84Q20 84 20 66z', '#c4946a', '#a87650')
    + P(ELL(50, 70, 20, 12), '#a87650', '#8a5c38', `<ellipse cx="44" cy="66" rx="2.4" ry="1.6" fill="${K}"/><ellipse cx="56" cy="66" rx="2.4" ry="1.6" fill="${K}"/>`)
    + `<path d="M31 49q5 3 10 0M59 49q5 3 10 0" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>` + smile(76, 4)
    + P(CIRCLE(50, 21, 9), '#ff9c3b', '#e2752a', '<path d="M50 12q4-6 9-4-3 5-9 4z" fill="#5fc760" stroke="#2a1f5c" stroke-width="1.6"/>'),
  perrito: () => shoulders('#ff9c5b', '#e2753a')
    + P(ELL(50, 56, 28, 26), '#f6d4a0', '#e8b678', `<path d="${ELL(62, 52, 9, 8)}" fill="#d9a066"/>`)
    + mirror(`<g transform="rotate(14 20 50)">${P('M26 32Q8 36 12 62Q20 68 28 52z', '#8a5a3a', '#6a4028')}</g>`)
    + eyes(53, 12, 4.6) + `<ellipse cx="50" cy="63" rx="5.5" ry="4" fill="${K}"/>` + P('M46 69h8v5a4 4 0 0 1-8 0z', '#ff7a9a', '#e0507e', '', 2.6) + blush(64, 21),
  tortuga: () => P('M6 104Q8 70 50 68Q92 70 94 104z', '#8a6a3a', '#6a4c22', `<path d="M30 104 36 84H64L70 104M36 84 50 76 64 84" fill="none" stroke="#c9a06a" stroke-width="3"/>`)
    + P(ELL(50, 50, 26, 24), '#9be86a', '#6cc447', `<circle cx="36" cy="34" r="3" fill="#6cc447"/><circle cx="64" cy="36" r="2.4" fill="#6cc447"/>`)
    + eyes(50, 11, 4.6) + smile(60, 6) + blush(58, 18),
  abeja: () => P('M10 104Q12 80 50 78Q88 80 90 104z', '#ffd23d', '#ecab17', `<path d="M20 92h60M14 102h72" stroke="${K}" stroke-width="7"/>`)
    + mirror(`<g transform="rotate(-25 20 44)">${P(ELL(20, 44, 13, 8), '#e6f6ff', '#bfe0f5')}</g>`)
    + mirror(`<path d="M40 32Q34 18 26 14" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>` + P(CIRCLE(25, 13, 4.5), '#3a3a4a', '#26263a'))
    + P(ELL(50, 56, 28, 26), '#ffd23d', '#ecab17')
    + eyes(55, 11, 4.6) + smile(65, 6) + blush(63, 19),
  dragoncito: () => mirror(P('M20 70 2 46 8 70 0 78 22 80z', '#2fae96', '#1f8a76'))
    + shoulders('#4fd1b5', '#2fae96')
    + mirror(P('M32 34 24 12 42 28z', '#ffe58a', '#e8b53a'))
    + P(ELL(50, 56, 29, 26), '#5fdcc0', '#3fbea2', `<path d="${ELL(50, 72, 14, 7)}" fill="#c9f5e8"/>`)
    + eyes(53, 12, 4.8) + `<circle cx="45" cy="68" r="1.7" fill="${K}"/><circle cx="55" cy="68" r="1.7" fill="${K}"/><path d="M43 74q7 4 14 0" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round"/><path d="M53 75l2 4 2-4z" fill="#fff" stroke="${K}" stroke-width="1.4"/>` + blush(62, 23),
  fantasma: () => P('M18 110V54Q18 20 50 20Q82 20 82 54V110z', '#ffffff', '#e3e0ef')
    + mirror(`<ellipse cx="39" cy="50" rx="5.5" ry="7.5" fill="${K}"/><circle cx="37" cy="47" r="2" fill="#fff"/>`)
    + `<ellipse cx="50" cy="64" rx="4.5" ry="5.5" fill="${K}"/>` + blush(60, 20)
    + mirror(P('M18 66Q8 70 10 80Q16 76 20 76z', '#ffffff', '#e3e0ef')),
  estrella: () => P(starPath(50, 56, 46, 23), '#ffd23d', '#ecab17')
    + eyes(54, 9, 4.2) + smile(63, 5) + blush(61, 16)
    + P(starPath(84, 16, 7, 3), '#fff3b8', '#ffd77a', '', 2) + P(starPath(14, 22, 5, 2.2), '#fff3b8', '#ffd77a', '', 2),
  // Exclusivos de la colección.
  cangrejo: () => mirror(`<path d="M26 54 18 40" stroke="${K}" stroke-width="7" stroke-linecap="round"/><path d="M26 54 18 40" stroke="#ff6f61" stroke-width="3.4" stroke-linecap="round"/>`
      + P('M16 42Q4 30 12 16Q19 21 17 28Q25 23 27 32Q27 42 16 42z', '#ff6f61', '#e0524a'))
    + P(ELL(50, 72, 36, 26), '#ff6f61', '#e0524a', '<path d="M30 64q20 -8 40 0" stroke="#ff9c8f" stroke-width="3" fill="none" stroke-linecap="round"/>')
    + mirror(`<path d="M40 56V40" stroke="${K}" stroke-width="7" stroke-linecap="round"/><path d="M40 56V40" stroke="#ff6f61" stroke-width="3.4" stroke-linecap="round"/>`
      + P(CIRCLE(40, 36, 8), '#fff', '#e3d8ff', `<circle cx="41" cy="37" r="4" fill="${K}"/><circle cx="39.6" cy="35.4" r="1.5" fill="#fff"/>`))
    + smile(76, 7) + blush(74, 20),
  topo: () => shoulders('#8a6a5a', '#6a4e40')
    + P(ELL(50, 58, 30, 30), '#9a7a6a', '#7a5a4a')
    + P(ELL(50, 69, 15, 11), '#f0d2b8', '#dcb898') + eyes(55, 12, 3.6)
    + P(CIRCLE(50, 64, 5.5), '#ff8fb0', '#e8648a') + smile(73, 5) + blush(66, 21)
    + P('M18 44Q18 16 50 16Q82 16 82 44z', '#ffc83d', '#ec9a17') + P('M12 42h76v7H12z', '#ffc83d', '#ec9a17')
    + P(CIRCLE(50, 28, 7.5), '#fff3b8', '#ffd27a', '<path d="M47 25l3-2" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>'),
  ardilla: () => P('M66 104Q100 86 92 52Q88 28 70 32Q84 50 74 70Q64 86 66 104z', '#c9692a', '#a8521c', '<path d="M80 44q8 14 0 32" stroke="#e8853e" stroke-width="5" fill="none" stroke-linecap="round"/>')
    + shoulders('#ffb066', '#e8853e')
    + mirror(P('M27 36 28 14 42 28z', '#e8853e', '#c9692a', '<path d="M31 30 31 21 37 28z" fill="#ffd2a8"/>'))
    + P(ELL(50, 52, 27, 25), '#ffb066', '#e8853e')
    + P(ELL(50, 63, 13, 9), '#fff1d6', '#f0d8b4') + eyes(50, 11, 4.8)
    + `<path d="M47 59h6l-3 3z" fill="${K}" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>` + smile(64, 5) + blush(60, 20),
  osito: () => shoulders('#ff6f8e', '#e0496b')
    + mirror(P(CIRCLE(27, 30, 10), '#ff6f8e', '#e0496b'))
    + P(ELL(50, 54, 29, 26), '#ff7a95', '#e8566f', '<ellipse cx="38" cy="40" rx="7" ry="4" fill="#fff" opacity=".45" transform="rotate(-25 38 40)"/>')
    + P(ELL(50, 64, 11, 8), '#ffb0c0', '#ff94a8') + eyes(51, 12, 4.4)
    + `<ellipse cx="50" cy="61" rx="3.6" ry="2.6" fill="${K}"/>` + smile(66, 5),
  // Triceratops (Valle de los dinosaurios): cresta naranja con picos y manchas, dos cuernos, pico y cuerno en la nariz.
  triceratops: () => shoulders('#5fb8d0', '#3f98b4')
    + [[12, 50], [15, 32], [26, 18], [41, 11], [59, 11], [74, 18], [85, 32], [88, 50]].map(([x, y]) => P(CIRCLE(x, y, 6.5), '#ffa040', '#e8802a')).join('')
    + P('M10 60Q6 16 50 12Q94 16 90 60Q70 50 50 50Q30 50 10 60z', '#ffa040', '#e8802a', `${[[19, 42], [28, 27], [50, 20], [72, 27], [81, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#ffd23d"/>`).join('')}`)
    + P(ELL(50, 60, 26, 23), '#6cc8de', '#4aa8c4', '<ellipse cx="36" cy="47" rx="6" ry="3.4" fill="#fff" opacity=".35" transform="rotate(-25 36 47)"/>')
    + mirror(P('M33 44Q25 30 24 14Q36 27 43 40z', '#fff1d6', '#e8d2a8'))
    + P('M38 67Q50 61 62 67Q61 79 50 86Q39 79 38 67z', '#8fd6e8', '#6cc0d6', `<circle cx="45.5" cy="70.5" r="1.7" fill="${K}"/><circle cx="54.5" cy="70.5" r="1.7" fill="${K}"/><path d="M45 76.5q5 3 10 0" fill="none" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>`)
    + P('M45 66Q50 50 55 66z', '#fff1d6', '#e8d2a8', '', 3)
    + eyes(54, 13, 4.6) + blush(65, 22),
  // Perro robot (Taller de robots): cabeza de metal, orejas de antena, ojos de luz y collar con su tuerca.
  robodog: () => shoulders('#9aa7cf', '#7884b0')
    + P('M24 82Q50 92 76 82l2 7Q50 100 22 89z', '#ff9c5b', '#e2753a', `<g transform="translate(43.6 85.6) scale(.4)">${ICONS.tuerca()}</g>`)
    + mirror(`<path d="M28 40 18 18" stroke="${K}" stroke-width="5" stroke-linecap="round"/><path d="M28 40 18 18" stroke="#c9d2ea" stroke-width="2" stroke-linecap="round"/>` + P(CIRCLE(17, 16, 5), '#ff5f7e', '#d63d5f'))
    + mirror(`<g transform="rotate(14 20 52)">${P('M26 36Q10 38 12 64Q20 70 28 54z', '#7f8ab8', '#5f6a9a')}</g>`)
    + P('M26 34h48a10 10 0 0 1 10 10v24a14 14 0 0 1-14 14H30a14 14 0 0 1-14-14V44a10 10 0 0 1 10-10z', '#d6dcf0', '#aab4d8', '<path d="M24 42h52" stroke="#aab4d8" stroke-width="2"/><circle cx="22" cy="40" r="1.6" fill="#7f8ab8"/><circle cx="78" cy="40" r="1.6" fill="#7f8ab8"/>')
    + [-13, 13].map((x) => `<circle cx="${50 + x}" cy="54" r="7" fill="#24305e" stroke="${K}" stroke-width="2.4"/><circle cx="${50 + x}" cy="54" r="4" fill="#5ff0ff"/><circle cx="${50 + x - 1.4}" cy="52.4" r="1.4" fill="#fff"/>`).join('')
    + P(ELL(50, 69, 12, 8), '#eef1fb', '#c9d2ea', `<ellipse cx="50" cy="66" rx="4.4" ry="3" fill="${K}"/><path d="M44 72q6 4 12 0" fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>`)
    + blush(66, 25),
  // Tamalito (Candelaria): un tamal con cara, envuelto en su hoja de maíz y con su moño.
  tamalito: () => P('M12 104C4 72 16 30 50 8c34 22 46 64 38 96z', '#c8d86a', '#a8bc4a', '<path d="M50 14v90M34 30Q24 66 30 104M66 30Q76 66 70 104" stroke="#98ac3e" stroke-width="3" fill="none"/>')
    + P('M26 80C22 56 32 36 50 26c18 10 28 30 24 54Q50 90 26 80z', '#ffe7a0', '#f2cf72', '<path d="M40 36q10-6 20 0" stroke="#e8434f" stroke-width="5" fill="none" stroke-linecap="round"/>')
    + eyes(56, 10, 4.4) + smile(66, 5) + blush(64, 17)
    + `<path d="M14 88Q50 100 86 88" fill="none" stroke="${K}" stroke-width="11" stroke-linecap="round"/><path d="M14 88Q50 100 86 88" fill="none" stroke="#e8c070" stroke-width="5.4" stroke-linecap="round"/>`
    + P('M50 94 36 84 38 100z', '#e8434f', '#c22c3c', '', 3) + P('M50 94 64 84 62 100z', '#e8434f', '#c22c3c', '', 3) + P(CIRCLE(50, 94, 4.6), '#ff6f7a', '#e8434f', '', 3),
  // Taquito (Día del Taco): tortilla dorada con cara, y de pelo la lechuga, el jitomate y la cebolla.
  taquito: () => P('M8 52q4-14 14-8 4-12 14-5 6-12 16-1 8-11 16 1 10-8 16 5 8-3 8 8z', '#6fc25a', '#4fa84a')
    + [[26, 44], [44, 40], [62, 42], [78, 47]].map(([x, y]) => P(CIRCLE(x, y, 6), '#e8434f', '#c22c3c', '<circle cx="-2" cy="-2" r="1.6" fill="#fff" opacity=".6"/>', 3)).join('')
    + [[35, 47], [70, 48]].map(([x, y]) => P(CIRCLE(x, y, 4), '#fff6ee', '#e8dfd2', '', 2.6)).join('')
    + P('M4 52h92a46 44 0 0 1-92 0z', '#ffd27a', '#e8b04a', `<path d="M12 56a38 36 0 0 0 76 0" fill="none" stroke="#f2c060" stroke-width="3"/>${[[24, 80], [70, 84], [80, 66], [20, 64]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#c98a3a"/>`).join('')}`)
    + eyes(66, 13, 4.6) + smile(77, 6) + blush(74, 23),
  // Arbolito (Día de la Tierra): copa verde esponjada con cara, tronco de camisa y una florecita.
  arbolito: () => shoulders('#a86a3a', '#83501a')
    + P('M40 70h20v14H40z', '#a86a3a', '#83501a')
    + P('M18 54C8 52 8 34 20 32 18 18 34 12 42 20 46 8 64 10 66 22 80 18 90 30 84 42 94 50 88 66 76 64 72 76 56 78 50 72 42 80 26 76 26 66 16 68 12 58 18 54z', '#6fc25a', '#4fa84a', '<path d="M26 30q6-6 14-4M62 22q8 0 12 6" stroke="#8fd46a" stroke-width="4" fill="none" stroke-linecap="round"/>')
    + eyes(50, 12, 4.6) + smile(60, 6) + blush(58, 21)
    + [0, 72, 144, 216, 288].map((a) => `<ellipse cx="74" cy="${30 - 4.6}" rx="3" ry="4.6" fill="#ff9cc8" stroke="${K}" stroke-width="1.6" transform="rotate(${a} 74 30)"/>`).join('') + `<circle cx="74" cy="30" r="3" fill="#ffc83d" stroke="${K}" stroke-width="1.6"/>`,
  // Piñatita (Día del Niño): piñata de estrella con cara y sus picos de colores con flecos.
  pinatita: () => [-90, -18, 54, 126, 198].map((d, i) => {
      const a = (d * Math.PI) / 180, b = 0.6, c = ['#ffc83d', '#47c27a', '#4aa8de', '#ff9c5b', '#b36bff'][i], sh = ['#ec9a17', '#2f9e5c', '#2f86c0', '#e2753a', '#8a4ad8'][i];
      const Q = (r, aa) => `${(50 + Math.cos(aa) * r).toFixed(1)} ${(58 + Math.sin(aa) * r).toFixed(1)}`;
      return P(`M${Q(23, a - b)}L${Q(48, a)}L${Q(23, a + b)}z`, c, sh) + `<path d="M${Q(48, a)}l${(Math.cos(a + 0.5) * 8).toFixed(1)} ${(Math.sin(a + 0.5) * 8).toFixed(1)}M${Q(48, a)}l${(Math.cos(a - 0.5) * 8).toFixed(1)} ${(Math.sin(a - 0.5) * 8).toFixed(1)}" stroke="#ff5f7e" stroke-width="4" stroke-linecap="round"/>`;
    }).join('')
    + P(CIRCLE(50, 58, 25), '#ff7ab8', '#e8559a', '<path d="M25 50h50M25 68h50" stroke="#fff0f6" stroke-width="4"/>')
    + eyes(56, 10, 4.6) + smile(66, 6) + blush(64, 17),
  // Clavelito (Día de las Madres): clavel con cara, sus pétalos de holán y dos hojas como hombros.
  clavelito: () => P('M42 104Q42 86 50 82Q58 86 58 104z', '#4fa84a', '#2f8a42')
    + P('M50 96Q28 100 14 84Q34 76 50 90z', '#6fc25a', '#4fa84a') + P('M50 96Q72 100 86 84Q66 76 50 90z', '#8fd46a', '#6fc25a')
    + Array.from({ length: 12 }, (_, i) => { const a = (i * 30 * Math.PI) / 180; return P(CIRCLE(+(50 + Math.cos(a) * 31).toFixed(1), +(46 + Math.sin(a) * 29).toFixed(1), 11), i % 2 ? '#ff5f8f' : '#ff7aa6', '#e0406f'); }).join('')
    + P(ELL(50, 46, 31, 28), '#ffb3cb', '#ff8fb0', '<path d="M26 34q6-8 14-8" stroke="#ffd6e4" stroke-width="4" fill="none" stroke-linecap="round"/>')
    + eyes(46, 11, 4.6) + smile(56, 6) + blush(54, 20),
  // Bigotón (Día del Padre): el tazón azul de papá con su café humeante, gran bigote y franja dorada.
  bigoton: () => '<path d="M40 24q-4-5 0-10t0-10M60 24q-4-5 0-10t0-10" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".75"/>'
    + P('M74 44h5a13 13 0 0 1 0 26h-5v-8h5a5 5 0 0 0 0-10h-5z', '#3f8ad8', '#2a6fb8')
    + P('M26 34h48v50a12 12 0 0 1-12 12H38a12 12 0 0 1-12-12z', '#4aa8de', '#2f86c0', '<path d="M26 86h48" stroke="#ffc83d" stroke-width="5"/><path d="M33 44v30" stroke="#9fd8ff" stroke-width="4" stroke-linecap="round" opacity=".7"/>')
    + P(ELL(50, 34, 24, 6), '#8a5a3a', '#6e4026')
    + eyes(52, 11, 4.6) + blush(62, 18)
    + `<g transform="translate(28.2 47) scale(1.36)">${ICONS.bigote()}</g>`,
  // Michi atigrado (Día del Gato): gatito gris con rayas, ojos verdes, collar rojo y su cascabel.
  atigrado: () => shoulders('#a9b0c8', '#868ea8')
    + mirror(P('M20 42 24 12 44 30z', '#a9b0c8', '#868ea8', '<path d="M26 34 28 20 37 29z" fill="#ff9cb4"/>'))
    + P(ELL(50, 54, 32, 27), '#b9c0d6', '#9aa2ba', `<path d="M44 29v8M50 28v9M56 29v8M19 50h7M18 58h7M81 50h-7M82 58h-7" stroke="#6e7690" stroke-width="3.4" stroke-linecap="round"/>`)
    + [-13, 13].map((x) => `<ellipse cx="${50 + x}" cy="52" rx="5.4" ry="6" fill="#7fd36a" stroke="${K}" stroke-width="2.4"/><ellipse cx="${50 + x}" cy="52.6" rx="1.8" ry="4.4" fill="${K}"/><circle cx="${48.4 + x}" cy="49.6" r="1.6" fill="#fff"/>`).join('')
    + `<path d="M47 61h6l-3 3.5z" fill="#ff7a9a" stroke="${K}" stroke-width="2" stroke-linejoin="round"/><path d="M50 64.5q-3 4-7 1M50 64.5q3 4 7 1" fill="none" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>`
    + mirror(`<path d="M30 61 12 58M30 65 13 67" stroke="${K}" stroke-width="2.2" stroke-linecap="round"/>`)
    + P('M28 79Q50 88 72 79l1 7Q50 95 27 86z', '#e8434f', '#c22c3c')
    + P(CIRCLE(50, 92, 6), '#ffc83d', '#ec9a17', `<path d="M45 92h10" stroke="${K}" stroke-width="1.6"/><circle cx="50" cy="94.6" r="1.4" fill="${K}"/>`),
  // Manchitas (Día del Perro): dálmata blanco con manchas negras, orejas caídas, lengua de fuera y su collar con placa.
  dalmata: () => shoulders('#fff8f0', '#e6dccb') + `<circle cx="28" cy="92" r="5" fill="${K}"/><circle cx="72" cy="96" r="4" fill="${K}"/>`
    + P(ELL(50, 54, 30, 27), '#fff8f0', '#e6dccb', `<circle cx="66" cy="40" r="6" fill="${K}"/><circle cx="34" cy="70" r="4" fill="${K}"/><circle cx="72" cy="66" r="3" fill="${K}"/><circle cx="40" cy="34" r="3" fill="${K}"/>`)
    + mirror(`<g transform="rotate(10 22 46)">${P('M28 30Q8 32 12 64Q20 70 28 52z', '#3a3550', '#2a2540')}</g>`)
    + eyes(53, 12, 4.6) + `<ellipse cx="50" cy="63" rx="6" ry="4.4" fill="${K}"/>` + P('M45 68h10v8a5 5 0 0 1-10 0z', '#ff7a9a', '#e0507e', '<path d="M50 69v6" stroke="#e0507e" stroke-width="1.6"/>', 2.6) + blush(64, 21)
    + P('M28 80Q50 89 72 80l1 6Q50 95 27 86z', '#e8434f', '#c22c3c')
    + P('M44 88h12v6a6 6 0 0 1-12 0z', '#ffc83d', '#ec9a17', `<path d="M47 92h6" stroke="#ec9a17" stroke-width="1.6" stroke-linecap="round"/>`),
  // Gamer pro (Día del Gamer): con sus audífonos rosas, micrófono y un corazón de píxeles en la playera.
  audifonos: () => shoulders('#5a4f8a', '#3f3570') + `<g transform="translate(41 84) scale(.56)">${ICONS.pixcora()}</g>`
    + mirror(P(CIRCLE(23, 55, 6), '#ffc596', '#eda06c'))
    + P(CIRCLE(50, 53, 27), '#ffd3a8', '#f2b07c')
    + P('M23 50Q19 23 50 22Q81 23 77 50Q71 37 58 35Q52 42 44 36Q33 40 23 50z', '#2a2540', '#1a1530')
    + `<path d="M21 52Q19 15 50 15Q81 15 79 52" fill="none" stroke="${K}" stroke-width="10" stroke-linecap="round"/><path d="M21 52Q19 15 50 15Q81 15 79 52" fill="none" stroke="#ff5f7e" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M22 62Q24 74 38 72" fill="none" stroke="${K}" stroke-width="5.4" stroke-linecap="round"/><path d="M22 62Q24 74 38 72" fill="none" stroke="#9aa2ba" stroke-width="2.4" stroke-linecap="round"/>`
    + mirror(P(ELL(21, 55, 7, 10), '#ff5f7e', '#d63d5f', `<ellipse cx="20" cy="55" rx="3" ry="5" fill="#5fd1f0"/>`))
    + P(CIRCLE(39, 72, 3.6), '#4a4560', '#36324a')
    + kidFace(),
  // Bichito (Día del Programador): el bug más simpático, verde con sus lentes redondos y antenas.
  bichito: () => mirror(`<path d="M24 58 12 52M23 70 10 72M28 82 18 92" stroke="${K}" stroke-width="4" stroke-linecap="round"/>`)
    + mirror(`<path d="M44 28Q38 12 28 12" fill="none" stroke="${K}" stroke-width="3.6" stroke-linecap="round"/>` + P(CIRCLE(27, 12, 5), '#ffc83d', '#ec9a17'))
    + P(ELL(50, 66, 28, 28), '#5ad68c', '#2f9e5c', `<path d="M50 40v56" stroke="${K}" stroke-width="3"/><circle cx="36" cy="70" r="5" fill="#2f9e5c"/><circle cx="64" cy="76" r="6" fill="#2f9e5c"/><circle cx="62" cy="58" r="3.6" fill="#2f9e5c"/><circle cx="38" cy="86" r="3.4" fill="#2f9e5c"/>`)
    + P(ELL(50, 40, 22, 17), '#4a4560', '#36324a')
    + [-9, 9].map((x) => `<circle cx="${50 + x}" cy="40" r="6.6" fill="#fff"/><circle cx="${50 + x}" cy="41" r="3.4" fill="${K}"/><circle cx="${48.8 + x}" cy="39.4" r="1.3" fill="#fff"/>`).join('')
    + `<circle cx="41" cy="40" r="8" fill="none" stroke="#ffc83d" stroke-width="2.6"/><circle cx="59" cy="40" r="8" fill="none" stroke="#ffc83d" stroke-width="2.6"/><path d="M49 39h2" stroke="#ffc83d" stroke-width="2.6"/>`
    + `<path d="M45 50q5 4 10 0" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`,
  // Bufoncito (Día de los Inocentes): con su gorro de tres puntas, cascabeles y su cuello de olanes.
  bufoncito: () => shoulders('#8a5cf0', '#6c3fd4')
    + P('M18 80h64l-5 11-5.4-8-5.4 8-5.4-8-5.4 8-5.4-8-5.4 8-5.4-8-5.4 8-5.4-8-5.4 8z', '#fff6ee', '#e3d8ff')
    + mirror(P(CIRCLE(23, 57, 6), '#ffc596', '#eda06c'))
    + P(CIRCLE(50, 55, 26), '#ffd3a8', '#f2b07c')
    + P('M26 44Q14 32 13 14Q28 18 40 34z', '#e8434f', '#c22c3c') + P('M74 44Q86 32 87 14Q72 18 60 34z', '#e8434f', '#c22c3c')
    + P('M34 38Q40 16 50 6Q60 16 66 38z', '#ffc83d', '#ec9a17')
    + P('M22 46Q50 30 78 46l-2 9Q50 40 24 55z', '#8a5cf0', '#6c3fd4', `<path d="M30 48l4 4 4-5 4 4 4-5 4 4 4-5 4 4 4-5 4 4" fill="none" stroke="#c9b4ff" stroke-width="2"/>`)
    + [[13, 14], [87, 14], [50, 7]].map(([x, y]) => P(CIRCLE(x, y, 5.4), '#ffe27a', '#ec9a17')).join('')
    + eyes(59, 11, 4.4) + `<path d="M41 68q9 9 18 0" fill="#c22c3c" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>` + blush(66, 19),
  // Uvita (Año Nuevo): una de las doce uvas, con su hojita y gorrito de fiesta.
  uvita: () => shoulders('#ffc83d', '#ec9a17') + `<circle cx="30" cy="94" r="2.6" fill="#ff5f7e"/><circle cx="50" cy="90" r="2.6" fill="#5fd1f0"/><circle cx="70" cy="95" r="2.6" fill="#7fd36a"/>`
    + P(CIRCLE(50, 56, 29), '#b06ce0', '#7b3fb8', `<ellipse cx="36" cy="42" rx="7" ry="4" fill="#f0dcff" opacity=".7" transform="rotate(-35 36 42)"/>`)
    + P('M56 30Q68 18 80 24Q72 36 56 30z', '#7fc46a', '#5fae5a', `<path d="M58 29q10-2 18-4" stroke="#4a8a3a" stroke-width="1.6" fill="none"/>`)
    + `<g transform="rotate(-14 44 20)">${P('M44 4 56 30H32z', '#ff5fa8', '#e0408a', `<path d="M38 18h12M35 25h18" stroke="#ffe27a" stroke-width="3"/>`)}${P(CIRCLE(44, 4, 4.6), '#ffe27a', '#ec9a17')}</g>`
    + eyes(56, 11, 4.6) + smile(66, 6) + blush(64, 20),
  // Pincelín (Taller de arte): pulpo pintor con boina roja, salpicado de pintura, con su pincel en un tentáculo.
  pulpopintor: () => mirror(`<path d="M30 76Q18 86 22 100M40 80q-4 12 0 22" fill="none" stroke="${K}" stroke-width="10" stroke-linecap="round"/><path d="M30 76Q18 86 22 100M40 80q-4 12 0 22" fill="none" stroke="#ff8fb8" stroke-width="6" stroke-linecap="round"/>`)
    + `<path d="M74 78Q90 72 88 58" fill="none" stroke="${K}" stroke-width="10" stroke-linecap="round"/><path d="M74 78Q90 72 88 58" fill="none" stroke="#ff8fb8" stroke-width="6" stroke-linecap="round"/><path d="M88 60 96 30" stroke="${K}" stroke-width="5.4" stroke-linecap="round"/><path d="M88 60 96 30" stroke="#c98a3a" stroke-width="2.6" stroke-linecap="round"/><path d="M94 34l4-10 3 2-3 10z" fill="#4aa8de" stroke="${K}" stroke-width="2"/>`
    + P(ELL(50, 54, 30, 28), '#ff8fb8', '#e86a9a', `<circle cx="66" cy="70" r="4" fill="#4aa8de"/><circle cx="32" cy="38" r="3" fill="#ffc83d"/><circle cx="70" cy="44" r="2.4" fill="#7fd36a"/><circle cx="36" cy="72" r="2.6" fill="#e86a9a"/>`)
    + eyes(56, 11, 5) + smile(68, 6) + blush(64, 20)
    + P('M24 34Q26 16 50 15Q74 16 78 32Q50 40 24 34z', '#e8434f', '#c22c3c') + P(CIRCLE(52, 14, 4), '#e8434f', '#c22c3c'),
  // Ranita (Banda musical): rana verde de ojos saltones, sonrisa grande y su guitarra.
  ranita: () => shoulders('#5fae5a', '#3f8a3a')
    + P(ELL(50, 62, 33, 24), '#7fd36a', '#5fae5a', '<ellipse cx="50" cy="76" rx="18" ry="6" fill="#c8f0a8"/>')
    + mirror(P(CIRCLE(33, 40, 12), '#7fd36a', '#5fae5a', `<circle cx="33" cy="40" r="7.6" fill="#fff"/><circle cx="34" cy="41" r="4.4" fill="${K}"/><circle cx="32.4" cy="39" r="1.6" fill="#fff"/>`))
    + `<path d="M30 64q20 16 40 0" fill="#e8434f" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>` + blush(62, 24)
    + `<g transform="rotate(-30 66 90)">${P(ELL(64, 92, 13, 10), '#ff9c3d', '#e2753a', `<circle cx="64" cy="92" r="4" fill="${K}"/>`)}${P('M74 89h22v6H74z', '#8a5a3a', '#6e4026')}<path d="M76 92h18" stroke="#fff6e6" stroke-width="1"/></g>`,
  // Mapache director (Estudio de cine): con su antifaz, boina negra, chaqueta roja y el megáfono.
  mapache: () => shoulders('#e8434f', '#c22c3c') + `<path d="M40 80 50 90 60 80" fill="#fff6ee" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/>`
    + mirror(P('M26 46 22 22 40 34z', '#a9b0c8', '#868ea8', '<path d="M27 40 25 28 34 35z" fill="#4a4560"/>'))
    + P(ELL(50, 58, 28, 23), '#a9b0c8', '#868ea8', '<path d="M50 62q-10 16-20 6M50 62q10 16 20 6" fill="#fff6ee"/>')
    + `<path d="M22 54Q30 44 44 52Q50 56 56 52Q70 44 78 54Q70 64 58 60Q50 56 42 60Q30 64 22 54z" fill="#3a3550"/>` + eyes(54, 11, 4.4)
    + `<ellipse cx="50" cy="66" rx="4.4" ry="3.2" fill="${K}"/><path d="M50 69v3M46 74q4 3 8 0" fill="none" stroke="${K}" stroke-width="2" stroke-linecap="round"/>`
    + P('M28 36Q30 22 50 21Q70 22 74 34Q50 42 28 36z', '#2a2540', '#1a1530') + P(CIRCLE(50, 21, 3.4), '#2a2540', '#1a1530')
    + `<g transform="rotate(-20 82 86)">${P('M70 82h8l14-8v26l-14-8h-8z', '#ffc83d', '#ec9a17')}</g>`,
  // Chaneque (Nahual y Chaneques): duende travieso de la selva con orejotas y su gorro de hoja.
  chaneque: () => shoulders('#3f9a4a', '#2f7a3a') + mirror(P('M26 52 4 40 22 66z', '#9ad46a', '#6fae4a', '<path d="M22 54 10 46 21 61z" fill="#c8f0a8"/>'))
    + P(CIRCLE(50, 58, 26), '#9ad46a', '#6fae4a', '<circle cx="36" cy="66" r="1.4" fill="#4a8a3a"/><circle cx="40" cy="70" r="1.4" fill="#4a8a3a"/><circle cx="64" cy="66" r="1.4" fill="#4a8a3a"/><circle cx="60" cy="70" r="1.4" fill="#4a8a3a"/>')
    + P('M20 44C26 16 74 16 80 44 66 34 34 34 20 44z', '#3f9a4a', '#2f7a3a', '<path d="M50 22v16M36 28l6 8M64 28l-6 8" stroke="#7fd36a" stroke-width="2.4"/>') + P('M48 20q4-10 12-10-2 8-10 12z', '#7fd36a', '#5fae5a')
    + eyes(56, 10, 4.8) + `<path d="M38 68q12 12 24 0" fill="#fff6e6" stroke="${K}" stroke-width="3" stroke-linejoin="round"/><path d="M44 70v4M50 71v5M56 70v4" stroke="${K}" stroke-width="1.6"/>`,
  // Xolo guía (Día del Xoloitzcuintle): xolo gris con su copete, collar de cempasúchil y su farolito.
  xologuia: () => shoulders('#ff9c1a', '#e0700a') + mirror(P('M30 46 22 8 46 32z', '#4a4560', '#36324a', '<path d="M30 38 26 16 40 31z" fill="#ff9cb0"/>'))
    + P(ELL(50, 58, 25, 23), '#4a4560', '#36324a', '<path d="M44 37q6-8 12 0" fill="none" stroke="#7a7290" stroke-width="3"/>')
    + [-10, 10].map((x) => `<circle cx="${50 + x}" cy="56" r="5" fill="#fff6e6"/><circle cx="${50.6 + x}" cy="56.6" r="3" fill="${K}"/><circle cx="${49.4 + x}" cy="55" r="1" fill="#fff"/>`).join('')
    + `<ellipse cx="50" cy="66" rx="5" ry="3.4" fill="#1a1530"/>` + P('M46 70h8v6a4 4 0 0 1-8 0z', '#ff7a9a', '#e0507e', '', 2.6)
    + [26, 36, 46, 56, 66, 76].map((x, i) => marigold(x, 82 + Math.abs(i - 2.5) * -1.6 + 3, 5.4)).join('')
    + `<g transform="translate(64 64) scale(.9)">${ICONS.farolito()}</g>`,
  // Lloronita (La Llorona): con su rebozo azul, su cabello largo y la velita que alumbra el río.
  lloronita: () => P('M14 104Q8 70 20 42 30 18 50 16 70 18 80 42 92 70 86 104z', '#4a6ad8', '#3a52b0', '<path d="M18 92q32-10 64 0" stroke="#7f9cf0" stroke-width="2.4" fill="none"/><path d="M20 98q30-8 60 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-dasharray="4 4"/>')
    + P('M28 48Q28 90 38 96H62Q72 90 72 48 50 30 28 48z', '#2a2540', '#1a1530')
    + P(ELL(50, 58, 18, 22), '#f0e6ff', '#d8c8f0')
    + `<path d="M40 56q4 4 8 0M52 56q4 4 8 0" fill="none" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/><path d="M42 62q-2 5 0 7 2-2 0-7z" fill="#8fd8ff" stroke="${K}" stroke-width="1.2"/><path d="M46 70q4 2.4 8 0" fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>` + blush(64, 12)
    + `<g transform="translate(60 72) scale(.9)">${ICONS.velita()}</g>`,
  // Catrinita (La Catrina): calaverita elegante con su sombrero de flores, pluma y cuello de encaje.
  catrinita: () => shoulders('#8a5cf0', '#6c3fd4') + P('M26 82Q50 96 74 82l2 8Q50 104 24 90z', '#fff6ee', '#e3d8ff', `${[30, 38, 46, 54, 62, 70].map((x) => `<circle cx="${x}" cy="${88 + (x === 30 || x === 70 ? -2 : 0)}" r="2" fill="#e3d8ff"/>`).join('')}`)
    + P(CIRCLE(50, 60, 22), '#fff6ee', '#e3d6ee', `${[-9, 9].map((x) => `<circle cx="${50 + x}" cy="58" r="6.4" fill="${K}"/><circle cx="${50 + x}" cy="58" r="3.6" fill="#ff5fa8"/><circle cx="${50 + x}" cy="58" r="1.4" fill="#ffc83d"/>`).join('')}<path d="M47.6 66h4.8L50 69.6z" fill="${K}"/><path d="M40 74h20M43 72v4M47 72v4M51 72v4M55 72v4" stroke="${K}" stroke-width="1.6"/><circle cx="50" cy="44" r="2.4" fill="#ff5fa8"/>`)
    + P('M4 38Q50 22 96 38 50 48 4 38z', '#6c3fd4', '#4a2a9a') + P('M30 34q0-22 20-22t20 22q-20 6-40 0z', '#8a5cf0', '#6c3fd4')
    + [[34, 26, '#ff5fa8'], [46, 20, '#ffc83d'], [58, 22, '#ff7a3a'], [66, 30, '#ff5fa8']].map(([x, y, c]) => P(CIRCLE(x, y, 6), c, '#0002', `<circle cx="${x}" cy="${y}" r="2" fill="#fff6c8"/>`)).join('')
    + `<path d="M68 22Q86 2 96 8 86 14 72 28z" fill="#ff9cc8" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`,
  // Revolucionario (Día de la Revolución): niño con sombrero de palma, bigotote y paliacate rojo; sin armas.
  revolucionario: () => shoulders('#fff6ee', '#e3d8ff') + P('M34 80 50 96 66 80 58 78 50 86 42 78z', '#e8434f', '#c22c3c', '<circle cx="46" cy="84" r="1.2" fill="#fff"/><circle cx="54" cy="84" r="1.2" fill="#fff"/>')
    + mirror(P(CIRCLE(24, 58, 5.4), '#e8a878', '#cf8a5a'))
    + P(CIRCLE(50, 58, 25), '#f0b888', '#dca06a')
    + eyes(55, 10, 4.2) + blush(64, 18)
    + `<path d="M50 64Q42 60 32 70Q42 70 50 67Q58 70 68 70Q58 60 50 64z" fill="#3a2418" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>`
    + P(ELL(50, 40, 44, 9), '#f2d38a', '#d9b060', '<path d="M10 41a40 6 0 0 0 80 0" fill="none" stroke="#c9a050" stroke-width="2"/>')
    + P('M34 40c0-16 7-26 16-26s16 10 16 26q-16 4-32 0z', '#f2d38a', '#d9b060', '<path d="M34 34q16 4 32 0" stroke="#e8434f" stroke-width="4" fill="none"/>'),
  // Exclusivo del evento: Día de Muertos.
  xolo: () => mirror(P('M26 46 16 10 42 30z', '#4a4560', '#36324a', '<path d="M25 37 21 18 35 30z" fill="#ff9cb0"/>'))
    + shoulders('#4a4560', '#36324a')
    + [22, 36, 50, 64, 78].map((x, i) => marigold(x, 86 + (i % 2 ? 2 : 0), 7.5)).join('')
    + P(ELL(50, 56, 27, 25), '#5a5472', '#47425c')
    + P('M41 34q3-11 9-3q5-9 9 3q-9-3-18 0z', '#efeaf7', '#cfc8e2')
    + P(ELL(50, 67, 13, 9), '#6e6888', '#5a5472') + eyes(53, 12, 4.6)
    + `<ellipse cx="50" cy="62" rx="4.6" ry="3.4" fill="${K}"/>` + smile(70, 5) + blush(66, 20)
    + marigold(70, 33, 8),
  // Exclusivo del evento: Navidad. Reno con suéter verde y bufanda de rayas.
  reno: () => mirror(`<path d="M37 36Q31 22 25 9M29.5 22 17 18M33 29 22 31" fill="none" stroke="${K}" stroke-width="8.6" stroke-linecap="round"/><path d="M37 36Q31 22 25 9M29.5 22 17 18M33 29 22 31" fill="none" stroke="#e8c08a" stroke-width="4" stroke-linecap="round"/>`)
    + mirror(P(ELL(23, 47, 9, 5), '#a8693a', '#8a5228', '<ellipse cx="23" cy="47" rx="5" ry="2.2" fill="#ffc8a0"/>'))
    + shoulders('#4fae4a', '#3a8a3a')
    + P(ELL(50, 56, 25, 24), '#a8693a', '#8a5228', '<ellipse cx="39" cy="42" rx="6" ry="3.4" fill="#fff" opacity=".35" transform="rotate(-25 39 42)"/>')
    + P('M24 80Q50 90 76 80l3 9Q50 100 21 89z', '#e8434f', '#c22c3c', '<path d="M33 83v12M44 86v12M56 86v12M67 83v12" stroke="#fff" stroke-width="4"/>')
    + P(ELL(50, 68, 14, 9.5), '#ecc79e', '#d4a676') + eyes(52, 11, 4.6)
    + P(CIRCLE(50, 63, 5.6), '#ff4a5a', '#d62a3c', '<circle cx="48.3" cy="61.3" r="1.7" fill="#fff"/>') + smile(71, 5) + blush(64, 19),
  // Exclusivo del evento: Día de Reyes. Rey Mago: barba blanca, capa con cuello de armiño y su corona alta con joyas.
  reymago: () => shoulders('#8a5cf0', '#6c3fd4')
    + P('M24 84Q50 98 76 84l3 10Q50 108 21 94z', '#fff6ee', '#e3d8ff', `${[30, 42, 54, 66].map((x, i) => `<path d="M${x} ${90 + (i % 2) * 2}v4" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>`).join('')}`)
    + mirror(P(CIRCLE(25, 52, 5.6), '#e8b48a', '#d4966a'))
    + P(CIRCLE(50, 50, 24), '#f0c49a', '#dca47a')
    + P('M27 54Q28 86 50 88Q72 86 73 54Q66 64 50 63Q34 64 27 54z', '#f4f1ff', '#d3cdea', '<path d="M40 70q2 8 4 12M50 68v14M60 70q-2 8-4 12" stroke="#d3cdea" stroke-width="1.8" fill="none"/>')
    + P('M50 60Q42 56 36 62Q44 66 50 63Q56 66 64 62Q58 56 50 60z', '#f4f1ff', '#d3cdea')
    + eyes(48, 10, 4.2) + blush(54, 17)
    + P('M28 36 25 6l9 10 8-13 8 13 8-13 8 13 9-10-3 30z', '#ffc83d', '#ec9a17', '<circle cx="34" cy="16" r="2.4" fill="#e8434f"/><circle cx="50" cy="12" r="2.6" fill="#3fa0e0"/><circle cx="66" cy="16" r="2.4" fill="#5fae5a"/>')
    + P('M26 30h48v8H26z', '#ffc83d', '#ec9a17', '<circle cx="50" cy="34" r="2.8" fill="#e8434f"/><circle cx="36" cy="34" r="2" fill="#3fa0e0"/><circle cx="64" cy="34" r="2" fill="#3fa0e0"/>'),
  // Exclusivo del evento: Amor y Amistad. Cupido: querubín cachetón de rizos dorados, alas grandes y su arco con flecha de corazón.
  cupido: () => mirror(P('M28 74Q2 70 4 42Q14 54 22 52Q12 40 20 30Q32 48 36 70z', '#fff6ee', '#e3d6ee', '<path d="M10 48q6 6 14 6M16 36q6 8 14 14" stroke="#cfc0e0" stroke-width="1.8" fill="none"/>'))
    + shoulders('#fff6ee', '#e3d6ee') + P('M28 82Q50 92 74 80l2 6Q50 100 26 88z', '#ff7ab8', '#e8559a')
    + P(CIRCLE(50, 54, 28), '#ffdcc4', '#f4bc9e')
    + [[30, 32, 8], [41, 26, 8.4], [53, 24, 8.4], [65, 28, 8], [73, 38, 6.4], [26, 42, 6]].map(([x, y, r]) => P(CIRCLE(x, y, r), '#ffc83d', '#ec9a17', `<path d="M${x - r * 0.4} ${y}a${r * 0.4} ${r * 0.4} 0 1 1 ${r * 0.5} ${r * 0.3}" fill="none" stroke="#e89a17" stroke-width="1.6"/>`)).join('')
    + eyes(56, 11, 4.8) + `<ellipse cx="50" cy="68" rx="3.6" ry="3" fill="#c22c5c"/>` + `<ellipse cx="29" cy="64" rx="7" ry="4.4" fill="#ff6f8e" opacity=".6"/><ellipse cx="71" cy="64" rx="7" ry="4.4" fill="#ff6f8e" opacity=".6"/>`
    + `<path d="M70 66Q94 80 74 100" fill="none" stroke="${K}" stroke-width="5.4" stroke-linecap="round"/><path d="M70 66Q94 80 74 100" fill="none" stroke="#c98a3a" stroke-width="2.6" stroke-linecap="round"/><path d="M70 66L74 100" stroke="${K}" stroke-width="1.2"/>`
    + `<path d="M58 96 92 70" stroke="${K}" stroke-width="2.4"/>` + `<g transform="translate(84 60) rotate(50) scale(.5)">${ICONS.corazon()}</g>`,
  // Exclusivo del evento: Primavera. Catarina: carita oscura, caparazón rojo con puntos y antenas.
  catarina: () => mirror(`<path d="M42 33Q37 19 30 14" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/><circle cx="30" cy="14" r="4.4" fill="#3a3550" stroke="${K}" stroke-width="2.4"/>`)
    + shoulders('#ff4f5a', '#d63040') + `${[[28, 94], [72, 94], [42, 100], [58, 100]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${K}"/>`).join('')}`
    + P(ELL(50, 58, 26, 24), '#3a3550', '#2a2540')
    + P('M23 54Q23 28 50 28Q77 28 77 54Q66 45 50 45Q34 45 23 54z', '#ff4f5a', '#d63040', `<path d="M50 29v16" stroke="${K}" stroke-width="2.4"/>${[[36, 38], [64, 38], [42, 32], [58, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${K}"/>`).join('')}<ellipse cx="34" cy="34" rx="4" ry="2.2" fill="#fff" opacity=".45" transform="rotate(-30 34 34)"/>`)
    + [-11, 11].map((x) => `<circle cx="${50 + x}" cy="60" r="6.6" fill="#fff" stroke="${K}" stroke-width="2"/><circle cx="${50 + x + 1}" cy="61" r="3.6" fill="${K}"/><circle cx="${50 + x}" cy="59.4" r="1.3" fill="#fff"/>`).join('')
    + `<path d="M44 70q6 5 12 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>` + blush(68, 20),
  // Exclusivo del evento: Verano. Foca gris con lentes de sol, bigotes y su flotador rojo y blanco.
  foca: () => P('M8 104Q8 82 30 80H70Q92 82 92 104z', '#e8434f', '#c22c3c', `${[24, 50, 76].map((x) => `<path d="M${x - 7} 80h14v24h-14z" fill="#fff6ee"/>`).join('')}`)
    + P(ELL(50, 56, 31, 28), '#a9bdd8', '#8aa1c2', '<ellipse cx="37" cy="40" rx="6" ry="3.4" fill="#fff" opacity=".4" transform="rotate(-25 37 40)"/>')
    + mirror(P(ELL(44.5, 70, 7.5, 6), '#e8f0ff', '#cfdcf2') + `<circle cx="42" cy="70" r="1" fill="#8aa1c2"/><circle cx="45" cy="72.5" r="1" fill="#8aa1c2"/><path d="M38 69 25 66M38 72 24 74" stroke="${K}" stroke-width="1.6" stroke-linecap="round"/>`)
    + `<ellipse cx="50" cy="64.5" rx="5.4" ry="3.8" fill="${K}"/><ellipse cx="48.6" cy="63.4" rx="1.6" ry=".9" fill="#fff" opacity=".7"/><path d="M47.4 77q2.6 2.4 5.2 0" fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>`
    + mirror(`<path d="M27 47h18a2 2 0 0 1 2 2v2a9 9 0 0 1-9 9h-2a11 11 0 0 1-11-11 2 2 0 0 1 2-2z" fill="${K}"/><path d="M31 50l5 5" stroke="#7fe0ff" stroke-width="2.2" stroke-linecap="round"/>`)
    + `<path d="M45 50h10" stroke="${K}" stroke-width="3"/>` + blush(62, 26),
  // Exclusivo del evento: Fiestas Patrias. Chihuahua con orejotas, sombrero de charro y sarape.
  chihuahua: () => P('M10 104Q12 80 50 78Q88 80 90 104z', '#e8438f', '#c22c70', `${[['#ffc83d', 86], ['#2f9e5c', 92], ['#1fa6c9', 98]].map(([c, y]) => `<path d="M8 ${y}h84" stroke="${c}" stroke-width="3.6"/>`).join('')}`)
    + mirror(P('M34 52Q16 34 4 40Q6 60 30 66z', '#e8b878', '#cf9a5a', '<path d="M30 55Q18 42 10 44Q12 56 27 61z" fill="#f2c9a8"/>'))
    + P('M27 60Q27 44 50 44Q73 44 73 60Q73 76 58 82Q50 85 42 82Q27 76 27 60z', '#e8b878', '#cf9a5a', '<path d="M50 46q-6 8-4 18h8q2-10-4-18z" fill="#f6dcb0"/>')
    + P(ELL(50, 74, 8.4, 6), '#f6dcb0', '#e8c48e')
    + `<path d="M46.4 70.4h7.2L50 74.6z" fill="${K}" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/><path d="M50 74.6v2M47 78q3 2 6 0" fill="none" stroke="${K}" stroke-width="2" stroke-linecap="round"/>`
    + [-12, 12].map((x) => `<circle cx="${50 + x}" cy="61" r="7.2" fill="${K}"/><circle cx="${47.6 + x}" cy="58.4" r="2.6" fill="#fff"/><circle cx="${52.6 + x}" cy="63.6" r="1.2" fill="#fff"/>`).join('') + blush(70, 21)
    + P(ELL(50, 40, 40, 8.5), '#f2d38a', '#d9b060', `<path d="M12 41a38 6.6 0 0 0 76 0" fill="none" stroke="#e8434f" stroke-width="2.4"/>`)
    + P('M36 40c0-14 6-24 14-24s14 10 14 24q-14 4-28 0z', '#f2d38a', '#d9b060', `<path d="M36 33q14 4 28 0" stroke="#e8434f" stroke-width="4" fill="none"/><path d="M37 29q13 3.6 26 0" stroke="#2f9e5c" stroke-width="2" fill="none"/>`),
  // Exclusivo del evento: Halloween. Gato negro con sombrero de bruja, ojos verdes y capa morada.
  gatobruja: () => P('M10 104Q12 80 50 78Q88 80 90 104z', '#8a5cf0', '#6c3fd4', '<path d="M34 80 50 92 66 80" fill="#ff8a1a" stroke="#2a1f5c" stroke-width="2.4" stroke-linejoin="round"/>')
    + mirror(P('M31 56 20 32 44 46z', '#3a3550', '#2a2540', '<path d="M29 50 23 37 37 46z" fill="#ff9cb0"/>'))
    + P(ELL(50, 63, 24, 21), '#3a3550', '#2a2540')
    + mirror(`<ellipse cx="40" cy="62" rx="6.4" ry="7" fill="#c9f24a" stroke="${K}" stroke-width="2"/><ellipse cx="40" cy="62" rx="1.8" ry="5.4" fill="${K}"/><circle cx="38.4" cy="59.4" r="1.4" fill="#fff"/><path d="M38 72 22 70M38 75 23 78" stroke="#c9c0e8" stroke-width="1.6" stroke-linecap="round"/>`)
    + `<path d="M47.4 70h5.2L50 73z" fill="#ff9cb0" stroke="${K}" stroke-width="1.4" stroke-linejoin="round"/><path d="M50 73q-2 3-4.4 1.6M50 73q2 3 4.4 1.6" fill="none" stroke="#c9c0e8" stroke-width="1.8" stroke-linecap="round"/>`
    + P(ELL(50, 44, 31, 6.4), '#6c3fd4', '#5a2fbf')
    + P('M34 44Q44 30 52 6Q56 4 57 8Q60 30 66 44z', '#6c3fd4', '#5a2fbf', '<path d="M35 40q15 4.4 30 0" stroke="#ff8a1a" stroke-width="4.4" fill="none"/><rect x="46" y="36.6" width="8" height="6.4" rx="1" fill="#ffc83d" stroke="#2a1f5c" stroke-width="1.6"/>'),
  // Exclusivo de la lluvia de meteoritos: Meteorín, piedrita espacial con cráteres y pelo de fuego.
  meteorin: () => P('M20 56Q10 32 26 12Q29 28 37 31Q35 13 50 2Q57 21 63 29Q67 16 78 10Q90 32 80 56z', '#ff8a3d', '#ff5f2e', '<path d="M31 50Q27 34 33 23Q37 35 44 37Q43 24 50 13Q55 27 59 35Q63 26 69 22Q74 37 69 50z" fill="#ffd85a"/>')
    + P(ELL(50, 64, 34, 32), '#a493bd', '#7f6ea0', '<circle cx="28" cy="56" r="5.4" fill="#8a79a8"/><circle cx="72" cy="80" r="4.2" fill="#8a79a8"/><circle cx="70" cy="47" r="3" fill="#8a79a8"/><circle cx="34" cy="84" r="2.6" fill="#8a79a8"/><path d="M24 48a26 26 0 0 1 12-12" stroke="#e4dcf2" stroke-width="3" fill="none" stroke-linecap="round"/>')
    + eyes(62, 13, 5.2) + blush(72, 22)
    + `<path d="M42 75q8 7 16 0" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>`,
  // Exclusivo de los códigos: Tesoro escondido. Loro pirata con paliacate rojo, pico ganchudo y su doblón.
  loro: () => P('M10 104Q12 80 50 78Q88 80 90 104z', '#3fbf5a', '#2f9e48', '<path d="M38 82q12 10 24 0" fill="none" stroke="#ffd23d" stroke-width="6" stroke-linecap="round"/>')
    + mirror(P('M24 58Q12 66 14 84Q24 78 28 68z', '#2fae4a', '#22903a'))
    + P(ELL(50, 56, 27, 27), '#4fd16a', '#36b350')
    + mirror(P(ELL(38, 54, 9.4, 10), '#fff', '#e6eef0')) + eyes(54, 12, 4.2)
    + P('M38 62Q50 55 62 62Q63 72 53 81Q54 73 47 70Q40 68 38 62z', '#ffc83d', '#ec9a17', '<path d="M43 61q7-3 14 0" stroke="#fff3b8" stroke-width="2" fill="none" stroke-linecap="round"/>')
    + P('M44 70Q49 73 53 72Q51 78 46 76z', '#5a3a2a', '#3f2618') + blush(64, 21)
    + P('M22 46Q24 25 50 25Q76 25 78 46Q64 37 50 37Q36 37 22 46z', '#e8434f', '#c22c3c', [[34, 33], [50, 30], [66, 33], [42, 40], [58, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#fff"/>`).join(''))
    + P('M75 37 90 30 86 44z', '#e8434f', '#c22c3c') + P('M76 41 89 50 74 50z', '#e8434f', '#c22c3c')
    + `<g transform="translate(64 80) scale(.62)">${ICONS.doblon()}</g>`,
  sirena: () => P('M20 50Q12 82 20 104H80Q88 82 80 50Q78 24 50 22Q22 24 20 50z', '#ff6f61', '#e0524a')
    + kid('#5fd1c5', '#2fae9e')
    + mirror(P('M34 96Q38 84 46 88Q44 98 34 96z', '#ff9cc8', '#e870a8'))
    + P('M22 54Q18 22 50 21Q82 22 78 54Q72 36 54 32Q44 40 32 38Q26 44 22 54z', '#ff6f61', '#e0524a')
    + P(starPath(30, 34, 8, 3.6), '#ffc83d', '#ec9a17', '', 2.4)
    + kidFace(),
  vampiro: () => mirror(P('M8 104 10 70 40 84z', '#c22c49', '#9e1f37'))
    + P('M10 104Q12 80 50 78Q88 80 90 104z', '#2a2440', '#1a1530', `<path d="M42 80 50 92 58 80" fill="#fff" stroke="${K}" stroke-width="2.4"/>`)
    + mirror(P(CIRCLE(23, 55, 6), '#ded4f5', '#c4b8e8'))
    + P(CIRCLE(50, 53, 27), '#efe8ff', '#d3cdea')
    + P('M22 50Q18 22 50 21Q82 22 78 50Q72 36 60 34L50 46 40 34Q28 36 22 50z', '#2a2440', '#1a1530')
    + eyes(56, 11, 4.4) + `<path d="M44 65q6 5 12 0" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round"/><path d="M45.5 66.5l1.6 4 1.6-3.2M51.3 67.3l1.6 3.2 1.6-4" fill="#fff" stroke="${K}" stroke-width="1.4" stroke-linejoin="round"/>` + blush(63, 19),
};
const initial = (p) => ((p.name || '?').trim().charAt(0).toUpperCase() || '?').replace(/[&<>"']/g, '');
const avColor = (p) => AVATAR_COLORS[(p.avatar || 0) % AVATAR_COLORS.length];
// Dibujo del personaje (sin el círculo de color: lo pone quien lo usa).
export const charSVG = (k, cls = '') => `<svg class="av-char ${cls}" viewBox="0 0 100 100" aria-hidden="true">${(AVATARS[k] || AVATARS.nino)()}</svg>`;

// ---------- Marcos del avatar (tienda) ----------
// Aro dibujado encima del círculo: lienzo de 140×140 con el avatar en el centro (radio 50).
const at = (deg, r) => [70 + r * Math.cos((deg * Math.PI) / 180), 70 + r * Math.sin((deg * Math.PI) / 180)];
const band = (r, color, w = 6) => `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${K}" stroke-width="${w + 5}"/><circle cx="70" cy="70" r="${r}" fill="none" stroke="${color}" stroke-width="${w}"/>`;
const heart = (x, y, s) => `M${x} ${y + s * 0.9}C${x - s * 1.6} ${y - s * 0.1} ${x - s * 0.9} ${y - s * 1.3} ${x} ${y - s * 0.45}C${x + s * 0.9} ${y - s * 1.3} ${x + s * 1.6} ${y - s * 0.1} ${x} ${y + s * 0.9}z`;
export const RINGS = {
  sencillo: () => '',
  destello: () => band(55, '#5fe0c8', 5) + [-45, 45, 135, 225].map((d, i) => {
    const [x, y] = at(d, 56), R = i % 2 ? 7.5 : 10.5;
    return `<g class="r-tw" style="animation-delay:${i * 0.45}s">${tshape(`M${x} ${y - R}Q${x} ${y} ${x + R} ${y}Q${x} ${y} ${x} ${y + R}Q${x} ${y} ${x - R} ${y}Q${x} ${y} ${x} ${y - R}z`, '#fff6b8', '#ffc83d', '', 2.2)}</g>`;
  }).join(''),
  dorado: () => band(55, '#ffc83d', 6) + `<circle cx="70" cy="70" r="55" fill="none" stroke="#fff3b8" stroke-width="2" stroke-dasharray="14 160" stroke-linecap="round" class="r-shine"/>`
    + [0, 90, 180, 270].map((d) => { const [x, y] = at(d - 90, 55); return tshape(`M${x} ${y - 8}L${x + 6} ${y}L${x} ${y + 8}L${x - 6} ${y}z`, '#5ff0ff', '#2fb6d8', '', 2.4); }).join(''),
  dulce: () => band(55, '#ff8fb0', 5) + [-90, -18, 54, 126, 198].map((d) => tshape(heart(...at(d, 56), 8), '#ff5f7e', '#d63d5f', '', 2.4)).join(''),
  estrellas: () => `<g class="r-spin">${band(55, '#b9a6ff', 4)}${[0, 60, 120, 180, 240, 300].map((d, i) => tshape(starPath(...at(d, 57), i % 2 ? 7 : 10, i % 2 ? 3.2 : 4.4), '#ffc83d', '#ec9a17', '', 2.2)).join('')}</g>`,
  orbita: () => `<g transform="rotate(-18 70 70)"><path d="M3 70A67 22 0 0 0 137 70" fill="none" stroke="${K}" stroke-width="10" stroke-linecap="round"/><path d="M3 70A67 22 0 0 0 137 70" fill="none" stroke="#ffb13d" stroke-width="5" stroke-linecap="round"/></g>`
    + `<g class="r-moon">${tshape(CIRCLE(70, 8, 9), '#9ad9ff', '#5fb0e0', '<circle cx="67" cy="6" r="2.4" fill="#fff" opacity=".8"/>', 2.4)}</g>`,
  // Burbujas (Tesoros del mar): aro de agua con burbujas que titilan y un pececito que le da la vuelta.
  burbujas: () => band(55, '#4aa8de', 7) + `<circle cx="70" cy="70" r="55" fill="none" stroke="#9fd8ff" stroke-width="2" stroke-dasharray="10 14" stroke-linecap="round"/>`
    + Array.from({ length: 10 }, (_, i) => { const [x, y] = at(i * 36 + 10, i % 2 ? 61 : 58); return `<circle class="r-tw" style="animation-delay:${(i * 0.18).toFixed(2)}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 3 ? 3 : 4.4}" fill="#e6f6ff" stroke="${K}" stroke-width="1.6"/>`; }).join('')
    + `<g class="r-moon" style="animation-duration:9s">${tshape('M62 14Q70 8 78 14Q70 20 62 14zM62 14l-6-5v10z', '#ffc83d', '#ec9a17', '', 1.8)}<circle cx="74" cy="13" r="1.2" fill="${K}"/></g>`,
  // Gemas (Cueva de gemas): aro hecho de gemas de colores pegaditas, con un brillo que le da la vuelta.
  gemas: () => `<circle cx="70" cy="70" r="55" fill="none" stroke="${K}" stroke-width="14"/>`
    + Array.from({ length: 18 }, (_, i) => { const d = i * 20, [x, y] = at(d, 55); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${d + 90})"><path d="M-6-5h12l3 5-9 6-9-6z" fill="${['#b36bff', '#5ff0ff', '#ff7ab8'][i % 3]}" stroke="${K}" stroke-width="1.4" stroke-linejoin="round"/><path d="M-6-5 0 6 6-5M-9 0h18" fill="none" stroke="#fff" stroke-width=".8" opacity=".7"/></g>`; }).join('')
    + `<circle cx="70" cy="70" r="55" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="14 160" stroke-linecap="round" class="r-shine"/>`,
  // Hojas (Bosque encantado): corona de hojas de otoño encimadas que gira despacio, con dos bellotas abajo.
  hojas: () => `<g class="r-spin">${Array.from({ length: 20 }, (_, i) => { const d = i * 18, [x, y] = at(d, 56); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${d + 30})">${tshape('M0-9Q8-3 0 9Q-8-3 0-9z', ['#7fae5a', '#ff9c3d', '#ffc83d', '#e8434f'][i % 4], '#0002', '<path d="M0-7v14" stroke="#0003" stroke-width="1"/>', 1.6)}</g>`; }).join('')}</g>`
    + [80, 100].map((d) => { const [x, y] = at(d, 58), k = 0.5; return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.bellota()}</g>`; }).join(''),
  // Caramelos (Feria de dulces): aro de bastón de caramelo a rayas que gira, con dos dulces envueltos.
  caramelos: () => `<circle cx="70" cy="70" r="55" fill="none" stroke="${K}" stroke-width="13"/><circle cx="70" cy="70" r="55" fill="none" stroke="#fff" stroke-width="8.4"/>`
    + `<circle class="r-spin" cx="70" cy="70" r="55" fill="none" stroke="#ff5f8f" stroke-width="8.4" stroke-dasharray="8.6 8.6"/>`
    + [45, 225].map((d) => { const [x, y] = at(d, 57), k = 0.62; return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) rotate(${d} ${16 * k} ${16 * k}) scale(${k})">${ICONS.caramelo()}</g>`; }).join(''),
  // Huesitos (Valle de los dinosaurios): aro verde de lomo de dinosaurio con sus placas naranjas para afuera.
  huesitos: () => Array.from({ length: 14 }, (_, i) => { const d = i * (360 / 14), [x1, y1] = at(d - 9, 55), [x2, y2] = at(d + 9, 55), [tx, ty] = at(d, i % 2 ? 66 : 64); return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}Q${tx.toFixed(1)} ${ty.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}z" fill="${i % 2 ? '#ff9c5b' : '#ffc83d'}" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/>`; }).join('')
    + band(54, '#6fae4a', 7) + Array.from({ length: 14 }, (_, i) => { const [x, y] = at(i * (360 / 14) + 12.8, 54); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="#4a8a3a"/>`; }).join(''),
  // Tuercas (Taller de robots): un engrane que gira con sus dientes y un foquito que parpadea arriba.
  tuercas: () => { const d = Array.from({ length: 24 }, (_, i) => { const a1 = (i * 15 - 4) * Math.PI / 180, a2 = (i * 15 + 4) * Math.PI / 180, r = i % 2 ? 54 : 61; return `${i ? 'L' : 'M'}${(70 + Math.cos(a1) * r).toFixed(1)} ${(70 + Math.sin(a1) * r).toFixed(1)}L${(70 + Math.cos(a2) * r).toFixed(1)} ${(70 + Math.sin(a2) * r).toFixed(1)}`; }).join('') + 'z';
    return `<g class="r-spin"><path d="${d}" fill="none" stroke="${K}" stroke-width="7" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#9aa7cf" stroke-width="3.6" stroke-linejoin="round"/>${Array.from({ length: 6 }, (_, i) => { const [x, y] = at(i * 60 + 30, 52); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="#dfe6f2" stroke="${K}" stroke-width="1.2"/>`; }).join('')}</g>`
      + `<circle cx="70" cy="9" r="6" fill="#5f6a9a" stroke="${K}" stroke-width="2"/><circle class="r-tw" cx="70" cy="9" r="3.4" fill="#ff5f7e"/>`; },
  // Paleta de pintor (Taller de arte): aro de madera con manchas de pintura que laten una tras otra y su pincel.
  pinceles: () => band(55, '#e0b07a', 9)
    + Array.from({ length: 8 }, (_, i) => { const [x, y] = at(i * 45 - 70, 55), c = ['#ff5f7e', '#ffc83d', '#7fd36a', '#4aa8de', '#b48cff', '#ff9c5b', '#fff', '#2a2540'][i]; return `<g class="r-tw" style="animation-delay:${(i * 0.22).toFixed(2)}s"><path d="M${(x - 5).toFixed(1)} ${y.toFixed(1)}q0-6 5-6 6 0 6 5 0 4-3 5 1 3-2 3-6 0-6-7z" fill="${c}" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/></g>`; }).join('')
    + (() => { const [x, y] = at(40, 58); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(-50)"><path d="M0 0v20" stroke="${K}" stroke-width="6" stroke-linecap="round"/><path d="M0 0v20" stroke="#c98a3a" stroke-width="3" stroke-linecap="round"/><path d="M-3-1h6v-5h-6z" fill="#dfe6f2" stroke="${K}" stroke-width="1.6"/><path d="M-3-6q3-8 3-8 3 4 3 8z" fill="#ff5f7e" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/></g>`; })(),
  // Pentagrama (Banda musical): las cinco líneas dan la vuelta con sus notas, que giran como un disco.
  pentagrama: () => `<circle cx="70" cy="70" r="55" fill="none" stroke="#fff" stroke-width="14"/><circle cx="70" cy="70" r="62" fill="none" stroke="${K}" stroke-width="2"/><circle cx="70" cy="70" r="48" fill="none" stroke="${K}" stroke-width="2"/>`
    + [51.5, 55, 58.5].map((r) => `<circle cx="70" cy="70" r="${r}" fill="none" stroke="#8a5cf0" stroke-width="1.2"/>`).join('')
    + `<g class="r-spin">${Array.from({ length: 9 }, (_, i) => { const d = i * 40, [x, y] = at(d, [50, 53.5, 57, 60.5, 55][i % 5]); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${d + 90})"><ellipse rx="3.4" ry="2.4" fill="${K}" transform="rotate(-20)"/><path d="M3 -1v-9" stroke="${K}" stroke-width="1.4"/></g>`; }).join('')}</g>`
    + (() => { const [x, y] = at(-135, 58), k = 0.62; return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.nota()}</g>`; })(),
  // Rollo de película (Estudio de cine): tira de película con sus agujeritos que gira, y la claqueta en la diagonal.
  rollo: () => `<circle cx="70" cy="70" r="55" fill="none" stroke="${K}" stroke-width="16"/><circle cx="70" cy="70" r="55" fill="none" stroke="#3a3550" stroke-width="12"/>`
    + `<g class="r-spin">${[50.6, 59.4].map((r) => `<circle cx="70" cy="70" r="${r}" fill="none" stroke="#fff6e6" stroke-width="2.4" stroke-dasharray="2.6 4.2"/>`).join('')}${Array.from({ length: 12 }, (_, i) => { const [x, y] = at(i * 30, 55); return `<rect x="${(x - 3.6).toFixed(1)}" y="${(y - 2.6).toFixed(1)}" width="7.2" height="5.2" rx="1" fill="${['#ffc83d', '#8fe8ff', '#ff9cc8'][i % 3]}" opacity=".85" transform="rotate(${i * 30 + 90} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }).join('')}</g>`
    + (() => { const [x, y] = at(45, 58), k = 0.72; return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.claqueta()}</g>`; })(),
  // Enredadera (Nahual y Chaneques): bejuco con hojas alrededor y ojitos de chaneque que se asoman y parpadean.
  enredadera: () => [['#3f9a4a', 0], ['#5fae5a', Math.PI]].map(([c, ph]) => { const d = Array.from({ length: 73 }, (_, i) => { const t = (i / 72) * Math.PI * 2, r = 55 + 3 * Math.sin(6 * t + ph); return `${i ? 'L' : 'M'}${(70 + Math.cos(t) * r).toFixed(1)} ${(70 + Math.sin(t) * r).toFixed(1)}`; }).join('') + 'z'; return `<path d="${d}" fill="none" stroke="${K}" stroke-width="5.4"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2.6"/>`; }).join('')
    + Array.from({ length: 12 }, (_, i) => { const d = i * 30 + 15, [x, y] = at(d, 56); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${d + (i % 2 ? 50 : 130)})">${tshape('M0 0Q6-7 14-1Q6 6 0 0z', i % 2 ? '#7fd36a' : '#9ad46a', '#3f8a3a', '', 1.6)}</g>`; }).join('')
    + [-60, 60, 180].map((d, i) => { const [x, y] = at(d, 56); return `<g class="r-tw" style="animation-delay:${i * 0.6}s"><ellipse cx="${(x - 3).toFixed(1)}" cy="${y.toFixed(1)}" rx="2.4" ry="1.8" fill="#ffd84a" stroke="${K}" stroke-width="1.2"/><ellipse cx="${(x + 3).toFixed(1)}" cy="${y.toFixed(1)}" rx="2.4" ry="1.8" fill="#ffd84a" stroke="${K}" stroke-width="1.2"/></g>`; }).join(''),
  // Collar de huellitas (Día del Xoloitzcuintle): huellitas que caminan alrededor y el farolito que se columpia abajo.
  collarxolo: () => band(55, '#4a4560', 9)
    + `<g class="r-spin">${Array.from({ length: 12 }, (_, i) => { const d = i * 30, [x, y] = at(d, 55); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${d + 180}) scale(.62)" fill="#ffb13d"><ellipse cy="2.4" rx="4" ry="3.4"/>${[[-4.4, -2.8], [-1.5, -5], [1.5, -5], [4.4, -2.8]].map(([a2, b]) => `<circle cx="${a2}" cy="${b}" r="1.5"/>`).join('')}</g>`; }).join('')}</g>`
    + `<g class="r-swing"><path d="M70 120v4" stroke="${K}" stroke-width="1.6"/><g transform="translate(70 123) scale(.5) translate(-16 -3)">${ICONS.farolito()}</g></g>`,
  // Velitas del río (La Llorona): aro de agua de noche con velitas que flotan y se mecen.
  velitas: () => band(55, '#3a52b0', 9) + `<circle cx="70" cy="70" r="55" fill="none" stroke="#7f9cf0" stroke-width="1.6" stroke-dasharray="8 6"/>`
    + Array.from({ length: 7 }, (_, i) => { const d = i * (360 / 7) - 90, [x, y] = at(d, 56), k = 0.56; return `<g class="r-bob" style="animation-delay:${(i * 0.3).toFixed(1)}s"><g transform="translate(${(x - 16 * k).toFixed(1)} ${(y - 20 * k).toFixed(1)}) scale(${k})">${ICONS.velita()}</g></g>`; }).join(''),
  // Dalias (La Catrina): aro morado con perlas y un brillo que pasa, dalias en cuatro puntos y una pluma.
  dalias: () => band(55, '#6c3fd4', 7) + Array.from({ length: 24 }, (_, i) => { const [x, y] = at(i * 15, 55); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="#fff6ee"/>`; }).join('')
    + `<circle cx="70" cy="70" r="55" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="14 160" stroke-linecap="round" class="r-shine"/>`
    + [-45, 45, 135, 225].map((d, i) => { const [x, y] = at(d, 56), c = ['#ff5fa8', '#ff7a3a', '#ffc83d', '#ff5fa8'][i]; return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${Array.from({ length: 8 }, (_, j) => `<ellipse cx="0" cy="-5" rx="2.6" ry="5" fill="${c}" stroke="${K}" stroke-width="1.2" transform="rotate(${j * 45})"/>`).join('')}<circle r="2.6" fill="#fff6c8" stroke="${K}" stroke-width="1.2"/></g>`; }).join(''),
  // Vías del tren (Día de la Revolución): aro de vías con sus durmientes y la locomotora que le da la vuelta.
  vias: () => `<circle cx="70" cy="70" r="55" fill="none" stroke="#8a5a3a" stroke-width="12" stroke-dasharray="3 5"/>` + [51, 59].map((r) => `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${K}" stroke-width="3.4"/><circle cx="70" cy="70" r="${r}" fill="none" stroke="#b8c4d8" stroke-width="1.6"/>`).join('')
    + `<g class="r-moon" style="animation-duration:10s"><g transform="translate(70 15) rotate(90) scale(.66) translate(-16 -16)">${ICONS.locomotora()}</g></g>`,
  // Tamalitos (Candelaria): una mazorca hecha aro, granos amarillos sobre hoja de maíz, con hojas abajo y un tamalito.
  tamalitos: () => band(55, '#8aa83a', 10)
    + Array.from({ length: 32 }, (_, i) => { const [x, y] = at(i * 11.25, i % 2 ? 52.6 : 57.4).map((v) => v.toFixed(1)); return `<ellipse cx="${x}" cy="${y}" rx="2.9" ry="2.2" fill="${i % 4 < 2 ? '#ffd84a' : '#ffe98a'}" stroke="${K}" stroke-width="1" transform="rotate(${i * 11.25} ${x} ${y})"/>`; }).join('')
    + [[118, 1], [62, -1]].map(([d, s]) => { const [x, y] = at(d, 60); return `<g transform="translate(${x} ${y}) rotate(${d + 90 * s})">${tshape('M0 0Q8-6 20 2Q8 6 0 0z', '#c8d86a', '#98ac3e', '<path d="M2 0q8-1 16 1" stroke="#98ac3e" stroke-width="1.2" fill="none"/>', 1.8)}</g>`; }).join('')
    + (() => { const [x, y] = at(90, 57), k = 0.62; return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.tamal()}</g>`; })(),
  // Salsas (Día del Taco): gotas de salsa roja, verde y de mango dando vueltas; un limón en la diagonal.
  salsas: () => band(55, '#ff9c5b', 6)
    + `<g class="r-spin">${Array.from({ length: 12 }, (_, i) => { const d = i * 30, [x, y] = at(d, 56); return `<path d="M0-7C3-3 5 0 5 2.6A5 5 0 0 1-5 2.6C-5 0-3-3 0-7z" fill="${['#e8434f', '#6fc25a', '#ffc83d'][i % 3]}" stroke="${K}" stroke-width="2" stroke-linejoin="round" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${d + 90})"/>`; }).join('')}</g>`
    + (() => { const [x, y] = at(135, 57), k = 0.6; return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.limon()}</g>`; })(),
  // Brotes (Día de la Tierra): corona de hojas sobre un aro de mar, y la Tierra que le da la vuelta como luna.
  brotes: () => `<circle cx="70" cy="70" r="56" fill="none" stroke="${K}" stroke-width="9"/><circle cx="70" cy="70" r="56" fill="none" stroke="#4aa8de" stroke-width="4.4"/>`
    + Array.from({ length: 16 }, (_, i) => { const d = i * 22.5, [x, y] = at(d, 56); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${d + (i % 2 ? 60 : 120)})">${tshape('M0 0Q5-6 12-1Q6 5 0 0z', i % 3 ? '#6fc25a' : '#9ad46a', '#3f9a4a', '', 1.6)}</g>`; }).join('')
    + `<g class="r-moon">${tshape(CIRCLE(70, 13, 7.6), '#4aa8de', '#2f86c0', '<path d="M64 12c2-2 4 0 6-1s2-3 4-2 1 4-1 5-4 0-5 2" fill="#6fc25a"/>', 2)}</g>`,
  // Globitos (Día del Niño): ocho globos amarrados al aro que se mecen cada uno a su ritmo.
  globitos: () => band(51, '#4aa8de', 4)
    + Array.from({ length: 8 }, (_, i) => { const d = i * 45 - 67.5, [x, y] = at(d, 60), [sx, sy] = at(d, 51), c = ['#ff5f7e', '#ffc83d', '#7fd36a', '#b48cff'][i % 4];
      return `<g class="r-bob" style="animation-delay:${(i * 0.31).toFixed(2)}s"><path d="M${sx.toFixed(1)} ${sy.toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}" stroke="${K}" stroke-width="1.2"/><g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${d + 90})"><path d="M-1.6 5.4h3.2L0 3z" fill="${c}" stroke="${K}" stroke-width="1"/><ellipse cy="-2" rx="5.2" ry="6.4" fill="${c}" stroke="${K}" stroke-width="2"/><ellipse cx="-1.8" cy="-4.4" rx="1.4" ry="2" fill="#fff" opacity=".7"/></g></g>`; }).join(''),
  // Claveles (Día de las Madres): corona de claveles de tres colores entre hojas, que gira despacito.
  claveles: () => band(55, '#7fc46a', 5)
    + Array.from({ length: 10 }, (_, i) => { const d = i * 36 + 18, [x, y] = at(d, 57); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${d})">${tshape('M0 0Q4-5 10-1Q5 4 0 0z', '#7fc46a', '#4f9a3a', '', 1.4)}</g>`; }).join('')
    + `<g class="r-spin">${Array.from({ length: 10 }, (_, i) => { const [x, y] = at(i * 36, 56), c = ['#ff5f8f', '#e8434f', '#fff0f4'][i % 3]; return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${[0, 60, 120, 180, 240, 300].map((d) => `<circle cx="${(Math.cos((d * Math.PI) / 180) * 3.6).toFixed(1)}" cy="${(Math.sin((d * Math.PI) / 180) * 3.6).toFixed(1)}" r="3.4" fill="${c}" stroke="${K}" stroke-width="1.4"/>`).join('')}<circle r="2.8" fill="${c === '#fff0f4' ? '#ffb3cb' : '#fff0f4'}"/></g>`; }).join('')}</g>`,
  // Cinta métrica (Día del Padre): aro amarillo de cinta de medir con sus rayitas y números, su estuche y la corbata.
  corbatas: () => `<circle cx="70" cy="70" r="56" fill="none" stroke="${K}" stroke-width="14"/><circle cx="70" cy="70" r="56" fill="none" stroke="#ffd84a" stroke-width="9.4"/>`
    + Array.from({ length: 72 }, (_, i) => { const [x1, y1] = at(i * 5, 51.6), [x2, y2] = at(i * 5, i % 6 ? 54.4 : 57.4); return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${K}" stroke-width="${i % 6 ? 0.9 : 1.4}"/>`; }).join('')
    + [1, 2, 3, 4, 5].map((n) => { const d = -90 + n * 60, [x, y] = at(d, 58); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="Lilita One, sans-serif" font-size="6.4" fill="${K}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${d + 90} ${x.toFixed(1)} ${y.toFixed(1)})">${n * 10}</text>`; }).join('')
    + (() => { const [x, y] = at(-40, 58); return `<rect x="${(x - 9).toFixed(1)}" y="${(y - 9).toFixed(1)}" width="18" height="18" rx="5" fill="#9aa2ba" stroke="${K}" stroke-width="2.4"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#cfd8e8" stroke="${K}" stroke-width="1.6"/>`; })()
    + (() => { const [x, y] = at(90, 56), k = 0.6; return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.corbata()}</g>`; })(),
  // Estambres (Día del Gato): hilos de estambre rosa y lila enredados alrededor que giran, y la bola de estambre en la diagonal.
  estambres: () => [['#ff7ab8', 0], ['#b48cff', Math.PI / 2]].map(([c, ph]) => { const d = Array.from({ length: 97 }, (_, i) => { const t = (i / 96) * Math.PI * 2, r = 55 + 3.6 * Math.sin(9 * t + ph); return `${i ? 'L' : 'M'}${(70 + Math.cos(t) * r).toFixed(1)} ${(70 + Math.sin(t) * r).toFixed(1)}`; }).join('') + 'z';
      return `<g class="r-spin"><path d="${d}" fill="none" stroke="${K}" stroke-width="6"/><path d="${d}" fill="none" stroke="${c}" stroke-width="3"/></g>`; }).join('')
    + (() => { const [x, y] = at(45, 57), k = 0.78; return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.estambre()}</g>`; })()
    + (() => { const [x, y] = at(-135, 57), k = 0.6; return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.gatito()}</g>`; })(),
  // Collar (Día del Perro): collar rojo con estoperoles y su placa de hueso que se columpia abajo.
  huesos: () => `<circle cx="70" cy="70" r="56" fill="none" stroke="${K}" stroke-width="14"/><circle cx="70" cy="70" r="56" fill="none" stroke="#e8434f" stroke-width="9"/><circle cx="70" cy="70" r="56" fill="none" stroke="#ff7a84" stroke-width="2" stroke-dasharray="40 300" transform="rotate(200 70 70)"/>`
    + Array.from({ length: 11 }, (_, i) => { const [x, y] = at(i * 30 - 60, 56); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#dfe6f2" stroke="${K}" stroke-width="1.4"/>`; }).join('')
    + `<g class="r-swing"><circle cx="70" cy="125" r="3.2" fill="none" stroke="${K}" stroke-width="3.6"/><circle cx="70" cy="125" r="3.2" fill="none" stroke="#ffc83d" stroke-width="1.6"/><g transform="translate(70 132) scale(.46) translate(-16 -16)">${ICONS.hueso().replace(/#e8d8b8/g, '#ec9a17').replace(/#fff6e6/g, '#ffc83d')}</g></g>`,
  // Pixelado (Día del Gamer): aro de focos de colores que se prenden en cadena, como marquesina de arcade; vida y control en las diagonales.
  pixelado: () => `<circle cx="70" cy="70" r="56" fill="none" stroke="${K}" stroke-width="14"/><circle cx="70" cy="70" r="56" fill="none" stroke="#3f3570" stroke-width="9"/>`
    + Array.from({ length: 24 }, (_, i) => { const [x, y] = at(i * 15, 56).map((v) => v.toFixed(1)); return `<rect class="r-tw" style="animation-delay:${(i % 4) * 0.45}s" x="${x - 3}" y="${y - 3}" width="6" height="6" rx="1" fill="${['#ff5f7e', '#5ff0ff', '#ffc83d', '#7fd36a'][i % 4]}" transform="rotate(${i * 15} ${x} ${y})"/>`; }).join('')
    + (() => { const [x, y] = at(-135, 57), k = 0.62; return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.pixcora()}</g>`; })()
    + (() => { const [x, y] = at(45, 57), k = 0.78; return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) rotate(-20 ${16 * k} ${16 * k}) scale(${k})">${ICONS.control()}</g>`; })(),
  // Llaves de código (Día del Programador): banda de terminal con código verde que gira; el cursor parpadea arriba.
  llavecitas: () => `<defs><path id="rg-code" d="M70 70m-55 0a55 55 0 1 1 110 0a55 55 0 1 1-110 0"/></defs>` + band(55, '#163a26', 12)
    + `<g class="r-spin"><text font-family="ui-monospace, monospace" font-weight="700" font-size="9.4" fill="#7fe8a0" dy="3.2" letter-spacing=".4"><textPath href="#rg-code">${'{ } 01 &lt;/&gt; ; '.repeat(4)}{ } 01</textPath></text></g>`
    + (() => { const [x, y] = at(-90, 55); return `<rect x="${x - 6}" y="${y - 7}" width="12" height="14" rx="2" fill="#163a26" stroke="${K}" stroke-width="2.4"/><rect class="r-tw" x="${x - 3}" y="${y - 4.5}" width="6" height="9" fill="#c8f5d8"/>`; })()
    + (() => { const [x, y] = at(135, 57), k = 0.8; return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.laptop()}</g>`; })(),
  // Cascabeles (Día de los Inocentes): cuello de bufón de picos rojos y morados con cascabel en las puntas; gira despacio.
  cascabeles: () => `<g class="r-spin">${Array.from({ length: 16 }, (_, i) => {
      const a = i * 22.5, [x1, y1] = at(a - 11.25, 51), [x2, y2] = at(a + 11.25, 51), [tx, ty] = at(a, 62);
      const bell = i % 2 ? '' : (() => { const [bx, by] = at(a, 63), k = 0.36; return `<g transform="translate(${bx - 16 * k} ${by - 17 * k}) scale(${k})">${ICONS.cascabel()}</g>`; })();
      return `<path d="M${x1} ${y1}L${tx} ${ty}L${x2} ${y2}z" fill="${i % 2 ? '#8a5cf0' : '#e8434f'}" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/>${bell}`;
    }).join('')}</g>` + band(52, '#ffc83d', 5),
  // Chispitas (Año Nuevo): las doce uvas acomodadas como las horas de un reloj; titilan una tras otra, como la cuenta regresiva.
  chispas: () => band(55, '#3a1a6a', 7) + `<circle cx="70" cy="70" r="55" fill="none" stroke="#ffc83d" stroke-width="2.2" stroke-dasharray="1 7.6" stroke-linecap="round"/>`
    + Array.from({ length: 12 }, (_, i) => {
      const [x, y] = at(i * 30 - 90, 56), d = (i * 0.15).toFixed(2);
      if (!i) return `<g class="r-tw" style="animation-delay:${d}s"><g transform="translate(${x - 9.6} ${y - 9.6}) scale(.6)">${ICONS.reloj()}</g></g>`;
      // Uva sencilla (sin sombreado): son once en cada avatar.
      return `<g class="r-tw" style="animation-delay:${d}s"><circle cx="${x}" cy="${y}" r="5.4" fill="#b06ce0" stroke="${K}" stroke-width="2.2"/><circle cx="${x - 1.6}" cy="${y - 1.8}" r="1.4" fill="#f0dcff"/></g>`;
    }).join(''),
  // Exclusivo del evento: Día de Muertos.
  cempasuchil: () => band(55, '#ff9c1a', 6) + `<circle cx="70" cy="70" r="55" fill="none" stroke="#b36bff" stroke-width="2.4" stroke-dasharray="3 9" stroke-linecap="round"/>`
    + [-90, -30, 30, 90, 150, 210].map((d, i) => marigold(...at(d, 56), i % 2 ? 8 : 10.5)).join(''),
  // Exclusivo del evento: Navidad. Acebo: hojas y bolitas rojas sobre una banda verde.
  acebo: () => band(55, '#3f9a5a', 6) + `<circle cx="70" cy="70" r="55" fill="none" stroke="#fff3d6" stroke-width="2.2" stroke-dasharray="2 10" stroke-linecap="round"/>`
    + [-90, -18, 54, 126, 198].map((d) => { const [x, y] = at(d, 56); return `<g transform="translate(${x} ${y}) rotate(${d + 90})">${[-55, 55].map((r) => `<g transform="rotate(${r})">${tshape('M0 0Q8 -6 0 -16Q-8 -6 0 0z', '#4fb85e', '#2f8a42', '<path d="M0 -2V-13" stroke="#2f7a3a" stroke-width="1.4"/>', 2.2)}</g>`).join('')}${[[-3.4, 0], [3.4, 0], [0, 4.6]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="3.6" fill="#e8434f" stroke="${K}" stroke-width="2"/>`).join('')}</g>`; }).join(''),
  // Exclusivo del evento: Día de Reyes. Corona real: banda dorada con gemas y la corona arriba.
  corona: () => band(55, '#ffc83d', 6) + [-18, 54, 126, 198].map((d, i) => { const [x, y] = at(d, 55); return tshape(`M${x} ${y - 7}L${x + 6} ${y}L${x} ${y + 7}L${x - 6} ${y}z`, ['#e8434f', '#3fa0e0', '#4fb85e', '#b36bff'][i], '#00000033', '', 2.2); }).join('')
    + `<g transform="translate(51 -4) scale(1.2)">${ICONS.crown()}</g>`,
  // Exclusivo del evento: Amor y Amistad. Flecha de Cupido que atraviesa una banda rosa dorado.
  cupido: () => band(55, '#ffb0c8', 6) + `<circle cx="70" cy="70" r="55" fill="none" stroke="#fff6ee" stroke-width="2" stroke-dasharray="2 9" stroke-linecap="round"/>`
    + `<path d="M14 126 126 14" stroke="${K}" stroke-width="8" stroke-linecap="round"/><path d="M14 126 126 14" stroke="#ffc83d" stroke-width="3.6" stroke-linecap="round"/>`
    + tshape('M126 14l-16 3 13 13z', '#ff4f6e', '#d6304f', '', 2.4)
    + tshape('M14 126l4-14 6 6zM14 126l14-4-6-6z', '#fff6ee', '#e3d6ee', '', 2)
    + [[-90, 9], [150, 7], [30, 6]].map(([d, r]) => tshape(heart(...at(d, 56), r), '#ff4f6e', '#d6304f', '', 2.4)).join(''),
  // Exclusivo del evento: Primavera. Mariposas sobre una banda verde con florecitas.
  mariposas: () => band(55, '#8fd46a', 6) + `<circle cx="70" cy="70" r="55" fill="none" stroke="#fff6ee" stroke-width="2.4" stroke-dasharray="2 10" stroke-linecap="round"/>`
    + [-135, -45, 45, 135].map((d, i) => { const [x, y] = at(d, 56), k = i % 2 ? 0.5 : 0.62; return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) rotate(${d + 90} ${16 * k} ${16 * k}) scale(${k})">${ICONS.mariposa()}</g>`; }).join('')
    + [-90, 0, 90, 180].map((d) => { const [x, y] = at(d, 55); return `<circle cx="${x}" cy="${y}" r="5" fill="#ffc83d" stroke="${K}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="2" fill="#ff8a1a"/>`; }).join(''),
  // Exclusivo del evento: Verano. Salvavidas: banda blanca con 4 franjas rojas, cuerda y dos soles.
  salvavidas: () => band(55, '#fff6ee', 9) + `<circle cx="70" cy="70" r="55" fill="none" stroke="#e8434f" stroke-width="9" pathLength="8" stroke-dasharray="1 1" stroke-dashoffset=".5"/>`
    + [0, 90, 180, 270].map((d) => { const [x, y] = at(d, 55); return `<rect x="${x - 3}" y="${y - 8}" width="6" height="16" rx="2" fill="#ffd27a" stroke="${K}" stroke-width="1.8" transform="rotate(${d} ${x} ${y})"/>`; }).join('')
    + [[-135, 0.9], [45, 0.72]].map(([d, k]) => { const [x, y] = at(d, 56); return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.sol()}</g>`; }).join(''),
  // Exclusivo del evento: Fiestas Patrias. Listón tricolor (verde, blanco y rojo) con sombrero y chiles.
  tricolor: () => band(55, '#fff6ee', 9) + `<circle cx="70" cy="70" r="55" fill="none" stroke="#2f9e5c" stroke-width="9" pathLength="3" stroke-dasharray="1 2" stroke-dashoffset="-.25"/><circle cx="70" cy="70" r="55" fill="none" stroke="#e8434f" stroke-width="9" pathLength="3" stroke-dasharray="1 2" stroke-dashoffset="-2.25"/><circle cx="70" cy="70" r="55" fill="none" stroke="#ffd27a" stroke-width="1.6" stroke-dasharray="2 8" stroke-linecap="round"/>`
    + (() => { const [x, y] = at(-90, 56), k = 1; return `<g transform="translate(${x - 16 * k} ${y - 18 * k}) scale(${k})">${ICONS.sombrero()}</g>`; })()
    + [[30, 0.62], [150, 0.62]].map(([d, k]) => { const [x, y] = at(d, 56); return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.chile()}</g>`; }).join(''),
  // Exclusivo del evento: Halloween. Telaraña: banda morada con hilos, una arañita colgando, calabaza y murciélago.
  telarana: () => band(55, '#4a3a7a', 7)
    + `<path d="${Array.from({ length: 16 }, (_, i) => { const [x1, y1] = at(i * 22.5, 58), [cx, cy] = at(i * 22.5 + 11.25, 51), [x2, y2] = at(i * 22.5 + 22.5, 58); return `${i ? '' : `M${x1.toFixed(1)} ${y1.toFixed(1)}`}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`; }).join('')}" fill="none" stroke="#e8e0ff" stroke-width="1.5"/>`
    + Array.from({ length: 16 }, (_, i) => { const [a, b] = at(i * 22.5, 50), [c, d] = at(i * 22.5, 60); return `<path d="M${a.toFixed(1)} ${b.toFixed(1)}L${c.toFixed(1)} ${d.toFixed(1)}" stroke="#e8e0ff" stroke-width="1.2"/>`; }).join('')
    + (() => { const [x, y] = at(-60, 56); return `<path d="M${x} ${y}v14" stroke="#e8e0ff" stroke-width="1.2"/><g transform="translate(${x} ${y + 18})">${[-1, 1].map((sx) => [0, 1, 2, 3].map((k) => `<path d="M0 0q${sx * 5} ${-4 + k * 2.6} ${sx * 8} ${-1 + k * 3}" fill="none" stroke="${K}" stroke-width="1.6" stroke-linecap="round"/>`).join('')).join('')}<circle r="4.6" fill="#3a3550" stroke="${K}" stroke-width="1.6"/><circle cx="-1.6" cy="-1" r=".9" fill="#ffd23d"/><circle cx="1.6" cy="-1" r=".9" fill="#ffd23d"/></g>`; })()
    + [[-135, 'calabaza', 0.95], [30, 'murcielago', 1.05]].map(([d, k, z]) => { const [x, y] = at(d, 56); return `<g transform="translate(${x - 16 * z} ${y - 16 * z}) scale(${z})">${ICONS[k]()}</g>`; }).join(''),
  // Exclusivo de los códigos: Tesoro escondido. Cuerda de barco con doblones que giran despacio y el cofre arriba.
  doblones: () => band(55, '#b8743a', 8) + `<circle cx="70" cy="70" r="55" fill="none" stroke="#e8b06a" stroke-width="3" stroke-dasharray="5 5"/>`
    + `<g class="r-spin">${Array.from({ length: 8 }, (_, i) => { const [x, y] = at(i * 45 + 22.5, 55), k = i % 2 ? 0.5 : 0.62; return `<g class="r-tw" style="animation-delay:${(i * 0.3).toFixed(1)}s"><g transform="translate(${(x - 16 * k).toFixed(1)} ${(y - 16 * k).toFixed(1)}) scale(${k})">${ICONS.doblon()}</g></g>`; }).join('')}</g>`
    + (() => { const [x, y] = at(-90, 57), k = 0.9; return `<g transform="translate(${x - 16 * k} ${y - 16 * k}) scale(${k})">${ICONS.cofre()}</g>`; })(),
  arcoiris: () => `<circle cx="70" cy="70" r="56" fill="none" stroke="${K}" stroke-width="13"/><g class="r-spin">${['#ff5f7e', '#ff9c5b', '#ffc83d', '#6fd36a', '#4aa8de', '#8a5cf0'].map((c, i) => `<circle cx="70" cy="70" r="56" fill="none" stroke="${c}" stroke-width="8" pathLength="6" stroke-dasharray="1 5" stroke-dashoffset="${-i}"/>`).join('')}</g>`,
};
const ringOf = (p) => (RINGS[p.ring] ? p.ring : RINGS[p.equip?.ring] ? p.equip.ring : 'sencillo');
export const ringSVG = (k) => (k !== 'sencillo' && RINGS[k] ? `<svg class="av-ring" viewBox="0 0 140 140" aria-hidden="true">${RINGS[k]()}</svg>` : '');
// p: { name, avatar (color), look, char, ring } o el guardado entero (lee p.equip.ring).
export function avatarHTML(p, cls = '') {
  const char = p.look === 'char' && AVATARS[p.char], ring = ringOf(p);
  return `<span class="avatar ${char ? 'char' : ''} ring-${ring} ${cls}" style="--av:${avColor(p)}">${char ? charSVG(p.char) : `<span class="av-l">${initial(p)}</span>`}${ringSVG(ring)}</span>`;
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
