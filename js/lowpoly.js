// Gráficos low poly generados con SVG: fondos, reversos de carta e iconos facetados.
import { mulberry32 } from './rng.js';

let uid = 0;
const f2 = (v) => +v.toFixed(2);
const poly = (pts, fill) => `<polygon points="${pts.map((p) => p.map(f2).join(',')).join(' ')}" fill="${fill}" stroke="${fill}" stroke-width=".03" stroke-linejoin="round"/>`;

// Malla de triángulos con puntos desplazados al azar; el color se oscurece hacia abajo.
function field(seed, hue, { cols = 6, rows = 10, sat = 55, top = 52, bottom = 20, hueSpread = 18, jitter = 0.38 } = {}) {
  const r = mulberry32(seed);
  const pts = [];
  for (let j = 0; j <= rows; j++) {
    const row = [];
    for (let i = 0; i <= cols; i++) {
      const ex = i === 0 || i === cols;
      const ey = j === 0 || j === rows;
      row.push([i + (ex ? 0 : (r() - 0.5) * jitter * 2), j + (ey ? 0 : (r() - 0.5) * jitter * 2)]);
    }
    pts.push(row);
  }
  let out = '';
  const tri = (a, b, c) => {
    const cy = (a[1] + b[1] + c[1]) / 3 / rows;
    const cx = (a[0] + b[0] + c[0]) / 3 / cols;
    const l = top + (bottom - top) * cy + (r() - 0.5) * 8 - (cx - 0.5) * 5;
    const h = hue + (cy - 0.5) * hueSpread + (r() - 0.5) * 8;
    out += poly([a, b, c], `hsl(${h.toFixed(0)} ${sat}% ${l.toFixed(1)}%)`);
  };
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const [a, b, c, d] = [pts[j][i], pts[j][i + 1], pts[j + 1][i + 1], pts[j + 1][i]];
      if (r() < 0.5) (tri(a, b, c), tri(a, c, d));
      else (tri(a, b, d), tri(b, c, d));
    }
  return out;
}

export const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

// Abanico de triángulos desde un centro, alternando tonos (aspecto de gema tallada).
function fan(cx, cy, pts, colors) {
  return pts.map((p, i) => poly([[cx, cy], p, pts[(i + 1) % pts.length]], colors[i % colors.length])).join('');
}
const ngon = (cx, cy, r, n, rot = -Math.PI / 2) =>
  Array.from({ length: n }, (_, i) => [cx + r * Math.cos(rot + (i * 2 * Math.PI) / n), cy + r * Math.sin(rot + (i * 2 * Math.PI) / n)]);

// Reverso de carta: malla del color del mundo + gema central.
export function cardBack(hue) {
  const bg = field(hue * 13 + 5, hue, { cols: 4, rows: 6, sat: 72, top: 62, bottom: 36, hueSpread: 24, jitter: 0.32 });
  const gem = fan(2, 3, ngon(2, 3, 1.05, 6), [`hsl(${hue} 90% 88%)`, `hsl(${hue} 80% 74%)`, `hsl(${hue} 85% 94%)`]);
  const inner = fan(2, 3, ngon(2, 3, 0.5, 6, -Math.PI / 2 + Math.PI / 6), ['#fff', `hsl(${hue} 90% 90%)`]);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 6" preserveAspectRatio="none">${bg}${gem}${inner}</svg>`;
}

// ---------- Iconos ----------
const wrap = (body, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;

// Silueta con dos tonos cortados en diagonal (faceta clara arriba-izquierda).
function flat(d, light, dark, cls) {
  const id = `lp${uid++}`;
  return wrap(
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset=".5" stop-color="${light}"/><stop offset=".5" stop-color="${dark}"/></linearGradient></defs><path d="${d}" fill="url(#${id})"/>`,
    cls,
  );
}

const WHITE = ['#ffffff', '#dfe3f5'];
const PATHS = {
  close: 'M5 3 12 10 19 3 21 5 14 12 21 19 19 21 12 14 5 21 3 19 10 12 3 5Z',
  undo: 'M10 2 2 9.5 10 17V12.5H15L17.5 14 18.5 16.5 17.5 21 21.5 18 22.5 13 20 9 15.5 7.5H10Z',
  bag: 'M4 8H20L19 21H5ZM8 8V6L10 3H14L16 6V8H14.5V6.5L13.2 4.6H10.8L9.5 6.5V8Z',
  menu: 'M3 4.5H21V8H3ZM3 10.25H21V13.75H3ZM3 16H21V19.5H3Z',
  prev: 'M16 3 6 12 16 21Z',
  next: 'M8 3 18 12 8 21Z',
  lock: 'M5 10H19V21H5ZM7.5 10V7L9.5 3.5H14.5L16.5 7V10H14V7.6L13.2 6H10.8L10 7.6V10Z',
  crown: 'M2 7 7 12 12 3.5 17 12 22 7 20 19H4Z',
  gift: 'M3 8.5H21V12.5H3ZM4.5 13.5H19.5V21H4.5ZM11 8 7 3.5 5 5.5 8 8ZM13 8 17 3.5 19 5.5 16 8Z',
  pause: 'M6 4H10.5V20H6ZM13.5 4H18V20H13.5Z',
  ticket: 'M2 6H22V10C20.5 10 19.5 11 19.5 12S20.5 14 22 14V18H2V14C3.5 14 4.5 13 4.5 12S3.5 10 2 10ZM14 8V9.5H15.5V8ZM14 11.25V12.75H15.5V11.25ZM14 14.5V16H15.5V14.5Z',
  user: 'M12 2 16.5 4.5 17 9 14.5 12.5H9.5L7 9 7.5 4.5ZM4 22 5.5 16 9 13.5H15L18.5 16 20 22Z',
  trophy: 'M7 3H17V9L15 13H9L7 9ZM3 4H6V8L4 7ZM18 4H21V7L18 8ZM10.5 13H13.5V17H10.5ZM7 18H17V21H7Z',
};

export const icon = (name, light = WHITE[0], dark = WHITE[1], cls = '') => flat(PATHS[name], light, dark, cls);

export function star(on = true, cls = '') {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? 4.8 : 11;
    pts.push([12 + rr * Math.cos(a), 12.6 + rr * Math.sin(a)]);
  }
  const c = on ? ['#ffe46b', '#f5a712'] : ['#ffffff40', '#ffffff22'];
  return wrap(fan(12, 12.6, pts, c), `star ${cls}`);
}

export function coin(cls = '') {
  const outer = fan(12, 12, ngon(12, 12, 11, 8, -Math.PI / 8), ['#ffd54a', '#e9a10f', '#ffc72c', '#d68b0a']);
  const inner = fan(12, 12, ngon(12, 12, 6.5, 8, -Math.PI / 8), ['#fff1a8', '#ffd54a']);
  return wrap(outer + inner, `coin ${cls}`);
}

// ---------- Iconos de lugar (uno por tipo de mundo) ----------
// Cada icono son polígonos convexos; cada uno se talla en facetas desde su centro.
function facet(pts, [h, sat, l]) {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const tones = [l + 8, l - 4, l + 3, l - 8];
  return pts.map((p, i) => poly([[cx, cy], p, pts[(i + 1) % pts.length]], `hsl(${h} ${sat}% ${Math.max(4, Math.min(97, tones[i % 4]))}%)`)).join('');
}
const P = (str) => str.trim().split(/\s+/).map((p) => p.split(',').map(Number));
const shapes = (list) => list.map(([pts, c]) => facet(typeof pts === 'string' ? P(pts) : pts, c)).join('');
const WATER = [200, 65, 50];
const GROUND = [110, 50, 42];

const PLACE_SHAPES = {
  Bosque: [['10.5,18 13.5,18 13.5,22 10.5,22', [25, 45, 30]], ['12,8 19,19 5,19', [130, 55, 30]], ['12,5 17.5,14 6.5,14', [130, 55, 37]], ['12,2 16,9.5 8,9.5', [130, 55, 45]]],
  Valle: [['0,17 24,17 24,22 0,22', GROUND], ['1,19 8,7 14,19', [220, 25, 55]], ['9,19 16,5 23,19', [220, 20, 62]], ['16,5 17.9,8.4 14.1,8.4', [0, 0, 96]]],
  Isla: [['0,17 24,17 24,22 0,22', WATER], ['3,18 8,13 16,13 21,18', [45, 70, 65]], ['11,14 13,14 15,5 14,5', [30, 45, 35]], ['14.5,5 21,7 17,9', [120, 55, 40]], ['14.5,5 8,6 11,9', [120, 55, 45]], ['14.5,5 18,1.5 19,4', [120, 55, 50]], ['14.5,5 10,2 11,4.5', [120, 50, 38]]],
  Castillo: [['5,11 19,11 19,21 5,21', [230, 10, 72]], ['3,7 8,7 8,21 3,21', [230, 10, 62]], ['16,7 21,7 21,21 16,21', [230, 10, 62]], ['2.5,7 5.5,2 8.5,7', [350, 65, 50]], ['15.5,7 18.5,2 21.5,7', [350, 65, 50]], ['10.5,21 10.5,16 12,14.5 13.5,16 13.5,21', [25, 45, 30]]],
  Pantano: [['0,16 24,16 24,22 0,22', [170, 35, 35]], ['4,17 8,14 14,14 18,17 14,20 8,20', [100, 50, 42]], ['18,16 19,5 20,16', [90, 40, 35]], ['20.5,16 22,8 23,16', [90, 40, 30]], ['18.5,10 19.5,10 19.4,4 18.6,4', [25, 50, 30]], ['11,13 12.5,11 14,13 12.5,15', [330, 70, 70]]],
  Desierto: [['0,15 24,15 24,22 0,22', [38, 70, 56]], ['17,3 21,4 22,8 19,10 15,9 14,5', [45, 90, 58]], ['0,15 9,9 18,15', [35, 70, 62]], ['4,22 15,12 24,18 24,22', [30, 70, 50]]],
  Arrecife: [['18,12 23,7 22,12', [195, 75, 40]], ['18,12 22,12 23,17', [195, 75, 36]], ['3,12 9,6 16,7 19,12 16,17 9,18', [195, 75, 50]], ['9,6 12,3 14,7', [195, 70, 42]], ['11,7 13,7 13,17 11,17.5', [45, 90, 60]], ['6,10 7.5,9.5 8,11 6.5,11.5', [230, 30, 15]]],
  Montaña: [['1,21 12,3 23,21', [215, 20, 45]], ['12,3 15.5,9 8.5,9', [0, 0, 95]]],
  Pradera: 'flower',
  Cueva: [['1,21 4,10 10,4 17,5 22,11 23,21', [25, 15, 45]], ['7,21 8,14 12,11 16,14 17,21', [250, 25, 12]]],
  Jardín: [['11.3,12 12.7,12 12.7,22 11.3,22', [110, 50, 35]], ['12,19 7,14 8,19', [110, 55, 42]], ['7.5,9 16.5,9 16.5,12 12,15 7.5,12', [345, 75, 52]], ['7,5 12,9 7.5,10.5', [345, 75, 58]], ['12,4 15,9.5 9,9.5', [345, 75, 62]], ['17,5 16.5,10.5 12,9', [345, 75, 56]]],
  Puerto: [[ngon(12, 4, 2.2, 8), [210, 20, 45]], ['11,6 13,6 13,20 11,20', [210, 20, 45]], ['7,8.5 17,8.5 17,10.5 7,10.5', [210, 20, 52]], ['4,13 11,20 11,22 3,15', [210, 20, 40]], ['20,13 21,15 13,22 13,20', [210, 20, 40]]],
  Glaciar: [['0,17 24,17 24,22 0,22', [205, 60, 45]], ['4,17 20,17 17,21 7,21', [195, 50, 62]], ['3,17 7,8 11,4 16,7 21,17', [195, 60, 82]]],
  Volcán: [['8,5 10,2 14,2 16,4 14,6 10,6', [0, 0, 75]], ['2,21 9,8 15,8 22,21', [20, 25, 30]], ['9,8 15,8 12,11', [15, 90, 52]], ['10,9 11.5,9 10.5,13', [25, 95, 55]]],
  Lago: [['0,16 24,16 24,22 0,22', WATER], ['5,15 19,15 17,18 7,18', [25, 50, 40]], ['12,3 12,14 18,14', [0, 0, 95]], ['11,5 11,14 6,14', [200, 30, 86]]],
  Ciudad: [['9.5,1 10.5,1 10.5,4 9.5,4', [230, 20, 60]], ['2,9 7,9 7,22 2,22', [230, 25, 45]], ['7,4 13,4 13,22 7,22', [230, 25, 56]], ['13,11 18,11 18,22 13,22', [230, 25, 40]], ['18,7 22,7 22,22 18,22', [230, 25, 50]]],
  Selva: [['12,20 3,13 5,6 11,11', [140, 60, 30]], ['12,20 21,13 19,6 13,11', [140, 60, 35]], ['12,20 9,9 12,1 15,9', [140, 60, 43]]],
  Cañón: [['0,19 24,19 24,22 0,22', [25, 55, 45]], ['1,19 2,10 8,9 9,19', [15, 60, 45]], ['14,19 15,6 22,6 23,19', [15, 60, 50]], ['15,6 22,6 22.3,8 14.8,8', [25, 65, 62]], ['10.8,19 10.8,13 12.2,13 12.2,19', [120, 40, 35]]],
  Cielo: [[ngon(8, 13, 4, 7), [210, 40, 88]], [ngon(17, 13, 4, 7), [210, 40, 88]], [ngon(12.5, 10, 5, 8), [210, 40, 95]], ['4,13 21,13 21,17 4,17', [210, 40, 92]]],
  Granja: [['3,10 12,3 21,10', [0, 30, 30]], ['4,10 20,10 20,21 4,21', [0, 65, 45]], ['9,21 9,14 15,14 15,21', [35, 50, 85]]],
  Pueblo: [['2,13 10,13 10,21 2,21', [40, 60, 75]], ['1,13 6,7 11,13', [10, 60, 45]], ['12,11 22,11 22,21 12,21', [200, 40, 80]], ['11,11 17,4 23,11', [10, 60, 40]], ['15.5,21 15.5,16 18.5,16 18.5,21', [25, 45, 30]]],
  Templo: [['2,4 22,4 21,7 3,7', [5, 75, 45]], ['4,9 20,9 20,10.5 4,10.5', [5, 75, 40]], ['6,7 8,7 8.5,22 5.5,22', [5, 75, 47]], ['16,7 18,7 18.5,22 15.5,22', [5, 75, 47]]],
  Mina: [['5,21 3,19 14,8 16,10', [30, 45, 40]], ['5,8 11,3 19,3 13,6', [210, 15, 65]], ['15,15 18,13 21,15 18,20', [190, 80, 60]]],
  Feria: [['2,11 12,3 22,11', [0, 75, 50]], ['12,3 12,0.5 15,1.5', [50, 90, 55]], ['4,11 8,11 8,20 4,20', [0, 75, 55]], ['8,11 12,11 12,20 8,20', [0, 0, 95]], ['12,11 16,11 16,20 12,20', [0, 75, 55]], ['16,11 20,11 20,20 16,20', [0, 0, 95]], ['10,20 12,15 14,20', [250, 30, 20]]],
};

function flowerShapes() {
  const out = [['11.3,13 12.7,13 12.7,22 11.3,22', [110, 50, 35]], ['12,18 17,14 16,18', [110, 55, 42]]];
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    const p = (r, da) => [12 + r * Math.cos(a + da), 9 + r * Math.sin(a + da)];
    out.push([[[12, 9], p(6, -0.45), p(6.6, 0), p(6, 0.45)], k % 2 ? [50, 90, 60] : [40, 95, 55]]);
  }
  out.push([ngon(12, 9, 2.3, 6), [20, 85, 48]]);
  return out;
}

export function placeIcon(place, cls = '') {
  const def = PLACE_SHAPES[place];
  return wrap(shapes(def === 'flower' ? flowerShapes() : def || []), `place ${cls}`);
}

// Candado y llave de un color (para las cartas bloqueadas y sus llaves).
export function lockIcon(hue, cls = '') {
  return wrap(
    shapes([
      ['7,10 9,4 10,6 9,10', [hue, 10, 82]],
      ['9,4 15,4 14,6 10,6', [hue, 10, 88]],
      ['15,4 17,10 15,10 14,6', [hue, 10, 74]],
      ['4,10 20,10 20,22 4,22', [hue, 80, 50]],
      ['11,13 13,13 13.5,16 12.8,19 11.2,19 10.5,16', [hue, 60, 22]],
    ]),
    `lock ${cls}`,
  );
}

export function keyIcon(hue, cls = '') {
  return wrap(
    shapes([
      [ngon(7, 12, 5, 8), [hue, 85, 55]],
      [ngon(7, 12, 2, 6), [hue, 50, 25]],
      [P('11,10.8 22,10.8 22,13.2 11,13.2'), [hue, 85, 50]],
      [P('17,13 19,13 19,17 17,17'), [hue, 85, 45]],
      [P('20,13 22,13 22,16 20,16'), [hue, 85, 45]],
    ]),
    `key ${cls}`,
  );
}

// Avatar del jugador: círculo de color con su inicial (por ahora; la tienda traerá más).
export const AVATAR_HUES = [210, 340, 140, 40, 275, 180, 10, 95];
export function avatarHTML(p, cls = '') {
  const h = AVATAR_HUES[(p.avatar || 0) % AVATAR_HUES.length];
  const ch = (p.name || '?').trim().charAt(0).toUpperCase() || '?';
  return `<span class="avatar ${cls}" style="--ah:${h}">${ch}</span>`;
}
