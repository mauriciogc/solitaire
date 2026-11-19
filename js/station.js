// Construir con estrellas (18 nov 2026, pedido del usuario; idea de Tripeaks Decor y Grand Harvest): cada planeta
// abierto tiene en su polo norte una estación de 5 piezas que se compran con bloques. Cada constelación tiene su estilo
// (se turnan los 4). Los bloques salen de las estrellas: cada estrella nueva que ganas da 1 bloque, pero las estrellas
// NO se gastan (siguen abriendo mundos). Así al pasar de constelación no se mezclan.
// Modo dev: save.devStation = { style, n, play } enseña un estilo en todos los planetas (vista previa).
import * as THREE from 'three';
import { INK } from './art.js';
import { save, persist } from './storage.js';
import { UNLOCK } from './events.js';
import { round5 } from './economy.js';

export const STATION_STYLES = {
  a: { name: 'Base lunar', pieces: ['Base', 'Domo', 'Antena', 'Huerto', 'Cohete'] },
  b: { name: 'Ciudad cúpula', pieces: ['Base', 'Edificios', 'Torre', 'Cúpula', 'Luces'] },
  c: { name: 'Faro estelar', pieces: ['Escalones', 'Torre', 'Mirador', 'Lámpara', 'Anillo'] },
  d: { name: 'Granja espacial', pieces: ['Parcela', 'Casita', 'Silo', 'Molino', 'Paneles'] },
  // 19 nov 2026 (pedido del usuario): 6 estilos más, uno por constelación hasta la 10.
  e: { name: 'Observatorio', pieces: ['Base', 'Cúpula', 'Telescopio', 'Radar', 'Satélite'] },
  f: { name: 'Puerto de naves', pieces: ['Plataforma', 'Hangar', 'Torre de control', 'Luces de pista', 'Nave'] },
  g: { name: 'Mina de cristales', pieces: ['Entrada', 'Rieles', 'Vagón', 'Grúa', 'Cristales'] },
  h: { name: 'Castillo galáctico', pieces: ['Muralla', 'Torres', 'Puerta', 'Torre mayor', 'Banderas'] },
  i: { name: 'Parque de diversiones', pieces: ['Base', 'Carrusel', 'Rueda de la fortuna', 'Montaña rusa', 'Globos'] },
  j: { name: 'Templo antiguo', pieces: ['Escalones', 'Columnas', 'Altar', 'Techo', 'Cristal flotante'] },
};
const STYLE_ORDER = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
export const PIECES = 5;
// Lo que cuesta cada pieza, en orden (20 bloques la estación; un planeta da hasta 30 estrellas).
export const PIECE_COST = [2, 3, 4, 5, 6];
// Estación completa: cofre planeta de oro con monedas (+10% por constelación, tope ×3) y un deshacer.
export const stationPrize = (w) => ({ coins: round5(300 * Math.min(3, 1 + 0.1 * Math.floor(w / 10))), undo: 1, metal: 'oro' });
// Las 10 estaciones de una constelación: cápsula con un exclusivo, el siguiente que no tengas de esta lista.
// 19 nov 2026 (el usuario): además de los 5 títulos, 3 disfraces, 3 marcos, 2 reversos y 2 naves, intercalados; el
// primero sigue siendo Albañil estelar. Ya con todos, la constelación da un cofre con monedas (buildBonus).
export const BUILD_PRIZES = [
  ['title', 'albanil_estelar'], ['avatar', 'astrolunar'], ['ring', 'cupulacristal'],
  ['title', 'constructor_lunar'], ['back', 'faroluz'], ['traveler', 'tractorvolador'],
  ['title', 'ingeniero_espacial'], ['avatar', 'astronomo'], ['traveler', 'transbordador'],
  ['title', 'arquitecto_galactico'], ['ring', 'minacristales'], ['avatar', 'caballerogalactico'],
  ['title', 'urbanista_cosmos'], ['back', 'carrusel'], ['ring', 'templodorado'],
];
// Cofre de cuando ya tienes los 15: monedas (+10% por constelación, tope ×3).
export const buildBonus = (r) => ({ coins: round5(1500 * Math.min(3, 1 + 0.1 * r)), metal: 'oro' });

export const buildOn = () => (save.next || 0) >= UNLOCK.construir;
export const styleOf = (w) => STYLE_ORDER[Math.floor(w / 10) % STYLE_ORDER.length];
export const built = (w) => save.build?.[w] || 0;
export const pieceCost = (w) => (built(w) < PIECES ? PIECE_COST[built(w)] : 0);
export const bloques = () => save.bloques || 0;
// Hay una pieza que alcanza a comprarse en el mundo w (el martillo brinca).
export const canBuild = (w) => buildOn() && built(w) < PIECES && bloques() >= pieceCost(w);

// Al abrirse (aviso de primera vez): te dan de golpe un bloque por cada estrella que ya ganaste (el usuario, 18 nov).
export function startBuild() {
  if (save.bloques != null) return 0;
  const n = Object.values(save.stars || {}).reduce((a, x) => a + (x || 0), 0) + Object.values(save.secret || {}).reduce((a, x) => a + (x || 0), 0);
  save.bloques = n;
  save.build ||= {};
  persist();
  return n;
}
// Estrellas nuevas (las que suben tu récord en un nivel) = bloques. Antes de abrirse no se cuenta: al abrirse se dan todas.
export function earnBloques(n) {
  if (!(n > 0) || save.bloques == null) return 0;
  save.bloques += n;
  persist();
  return n;
}
// Compra la siguiente pieza del mundo w. Devuelve { i, done, prize, item, bonus, region } o null si no alcanza.
export function buyPiece(w) {
  const i = built(w), cost = pieceCost(w);
  if (i >= PIECES || bloques() < cost) return null;
  save.bloques -= cost;
  (save.build ||= {})[w] = i + 1;
  const out = { i, done: i + 1 === PIECES, prize: null, item: null };
  if (out.done) {
    const p = (out.prize = stationPrize(w));
    save.coins += p.coins;
    save.undo += p.undo;
    // ¿Ya están las 10 de su constelación? El siguiente exclusivo que no tengas; si ya están todos, monedas.
    const r = Math.floor(w / 10);
    if (Array.from({ length: 10 }, (_, k) => built(r * 10 + k)).every((n) => n >= PIECES)) {
      const it = BUILD_PRIZES.find(([sec, k]) => !save.owned[`${sec}:${k}`]);
      if (it) (save.owned[`${it[0]}:${it[1]}`] = 1), (out.item = it);
      else (out.bonus = buildBonus(r)), (save.coins += out.bonus.coins);
      out.region = r;
    }
  }
  persist();
  return out;
}

// Qué estación se dibuja en el planeta wd (null = ninguna): la vista previa del modo dev manda.
export function stationFor(wd) {
  const d = save.devStation;
  if (d?.style && STATION_STYLES[d.style]) return { style: d.style, n: d.n ?? PIECES, play: d.play };
  return buildOn() ? { style: styleOf(wd.w), n: built(wd.w) } : null;
}

// Arma la estación. toon: material del mapa; tint: colores del planeta (para que cada una combine con su mundo).
// Devuelve { obj, pieces: [Group ×5], tick(t) }. Medidas para un planeta de radio 1.
// Cada estilo con sus colores se arma una sola vez (molde) y cada planeta usa una copia que comparte formas y
// materiales (18 nov 2026: armar todas al entrar a la constelación hacía lento el gusano).
const TPL = new Map();
// full: la estación ya terminada se junta toda en una sola pieza (menos dibujos: el mapa con los 10 planetas
// terminados pesaba casi el doble).
export function makeStation(style, toon, tint, full = false) {
  const key = `${style}:${tint.join()}:${full ? 1 : 0}`;
  if (!TPL.has(key)) TPL.set(key, buildStation(style, toon, tint, full));
  const tpl = TPL.get(key), obj = tpl.obj.clone(true), spinners = [];
  obj.traverse((o) => o.userData.spin && spinners.push([o, ...o.userData.spin]));
  const tick = (t) => {
    for (const [o, v, ax] of spinners) {
      if (ax === 'pulse') o.scale.setScalar(1 + Math.sin(t * 3 + v) * 0.12);
      else if (ax === 'z') o.rotation.z = t * v;
      else o.rotation.y = t * v;
    }
  };
  return { obj, pieces: [...obj.children], tick, h: tpl.h };
}
function buildStation(style, toon, tint, full) {
  const obj = new THREE.Group(), pieces = [], spinners = [];
  const ol = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  const M = {}, mat = (c) => (M[c] ||= toon({ color: c }));
  const glass = new THREE.MeshToonMaterial({ color: '#bfeaff', transparent: true, opacity: 0.55 });
  const glow = (c) => new THREE.MeshBasicMaterial({ color: c });
  const [acc, acc2] = tint;
  let P;
  // Agrega una pieza con su contorno de tinta (como el castillo del jefe).
  const add = (geo, m, x, y, z = 0, line = true) => {
    const g = new THREE.Group(), me = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m);
    g.add(me);
    if (line) { const s = new THREE.Mesh(geo, ol); s.scale.setScalar(1.1); g.add(s); }
    g.position.set(x, y, z); P.add(g);
    return g;
  };
  const piece = () => { P = new THREE.Group(); pieces.push(P); obj.add(P); return P; };
  const dome = (r) => new THREE.SphereGeometry(r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  // Parte extra dentro de algo que gira (g): su forma con contorno, en (x, y, z) del giro.
  const sub = (g, geo, m, x = 0, y = 0, z = 0, line = true) => {
    const me = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m);
    me.position.set(x, y, z); g.add(me);
    if (line) { const s = new THREE.Mesh(geo, ol); s.scale.setScalar(1.1); s.position.copy(me.position); g.add(s); }
    return me;
  };
  // Lo que gira con su centro corrido: lo que trae add() se mueve a (x, y, z) dentro del giro.
  const shift = (g, x, y = 0, z = 0) => (g.children.forEach((c) => c.position.set(x, y, z)), g);

  if (style === 'a') {
    piece(); add(new THREE.CylinderGeometry(0.5, 0.55, 0.08, 6), '#d9dbe8', 0, 0.04); add(new THREE.CylinderGeometry(0.36, 0.36, 0.02, 6), acc, 0, 0.09, 0, false);
    piece(); add(dome(0.24), glass, -0.08, 0.09); add(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16), '#ffffff', -0.08, 0.1);
    piece(); add(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), '#9aa0b8', 0.3, 0.24); { const d = add(new THREE.ConeGeometry(0.11, 0.07, 14, 1, true), '#ffffff', 0.3, 0.4); d.rotation.x = Math.PI; spinners.push([d, 0.8]); }
    piece(); add(dome(0.12), mat('#7ee08a'), 0.2, 0.09, 0.26); add(new THREE.SphereGeometry(0.04, 8, 6), '#3fa65a', 0.2, 0.13, 0.26, false);
    piece(); { add(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 10), '#ffffff', -0.3, 0.27, -0.12); add(new THREE.ConeGeometry(0.07, 0.14, 10), acc2, -0.3, 0.49, -0.12); add(new THREE.SphereGeometry(0.035, 8, 6), '#7fd8ff', -0.3, 0.33, -0.05, false); for (const a of [0, 2.1, 4.2]) add(new THREE.BoxGeometry(0.02, 0.1, 0.08), acc2, -0.3 + Math.cos(a) * 0.08, 0.15, -0.12 + Math.sin(a) * 0.08).rotation.y = -a; }
  } else if (style === 'b') {
    piece(); add(new THREE.CylinderGeometry(0.5, 0.54, 0.08, 20), '#e6e3f2', 0, 0.04); add(new THREE.TorusGeometry(0.44, 0.025, 6, 30), acc, 0, 0.085, 0, false).rotation.x = Math.PI / 2;
    piece(); [[-0.2, 0.1, 0.16, '#ff9f6b'], [0.18, 0.15, 0.2, '#7fb8ff'], [-0.05, -0.22, 0.12, '#ffd36b'], [0.2, -0.15, 0.14, acc]].forEach(([x, z, h, c]) => add(new THREE.BoxGeometry(0.12, h, 0.12), c, x, 0.08 + h / 2, z));
    piece(); add(new THREE.CylinderGeometry(0.05, 0.08, 0.42, 10), '#ffffff', 0, 0.29); add(new THREE.SphereGeometry(0.06, 10, 8), acc2, 0, 0.52);
    piece(); add(dome(0.42), glass, 0, 0.08, 0, false);
    piece(); { const g = add(new THREE.TorusGeometry(0.5, 0.018, 6, 40), '#fff3b0', 0, 0.3); g.rotation.x = Math.PI / 2 - 0.25; g.add(new THREE.Mesh(mergeGeo(Array.from({ length: 6 }, (_, k) => [new THREE.SphereGeometry(0.035, 8, 6), new THREE.Matrix4().makeTranslation(Math.cos((k * Math.PI) / 3) * 0.5, Math.sin((k * Math.PI) / 3) * 0.5, 0)])), glow('#ffe066'))); spinners.push([g, 0.6, 'z']); }
  } else if (style === 'c') {
    piece(); add(new THREE.CylinderGeometry(0.4, 0.46, 0.07, 10), '#b9b3cc', 0, 0.035); add(new THREE.CylinderGeometry(0.3, 0.34, 0.06, 10), '#d6d1e6', 0, 0.1);
    piece(); for (let k = 0; k < 3; k++) add(new THREE.CylinderGeometry(0.13 - k * 0.015, 0.15 - k * 0.015, 0.14, 14), k % 2 ? acc : '#ffffff', 0, 0.2 + k * 0.14);
    piece(); { const g = add(new THREE.TorusGeometry(0.15, 0.025, 6, 20), '#ffffff', 0, 0.56); g.rotation.x = Math.PI / 2; } add(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 14), '#ffffff', 0, 0.55);
    piece(); { const l = add(new THREE.SphereGeometry(0.09, 12, 10), glow('#fff3a0'), 0, 0.66); l.name = 'lamp'; spinners.push([l, 0, 'pulse']); } add(new THREE.ConeGeometry(0.12, 0.1, 12), acc2, 0, 0.8);
    piece(); { const g = add(new THREE.TorusGeometry(0.32, 0.02, 6, 36), acc2, 0, 0.6); g.rotation.x = Math.PI / 2 - 0.4; spinners.push([g, 1.1, 'z']); } add(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 5), '#9aa0b8', 0, 0.92); add(new THREE.BoxGeometry(0.1, 0.06, 0.01), '#ff5f7e', 0.05, 0.97);
  } else if (style === 'd') {
    piece(); add(new THREE.CylinderGeometry(0.5, 0.52, 0.06, 18), '#a8754a', 0, 0.03); for (let k = -2; k <= 2; k++) add(new THREE.BoxGeometry(0.62, 0.025, 0.05), '#6fc25a', 0.05, 0.075, k * 0.11 + 0.1, false);
    piece(); add(new THREE.BoxGeometry(0.22, 0.16, 0.18), '#fff1d6', -0.22, 0.14, -0.15); add(new THREE.ConeGeometry(0.18, 0.13, 4).rotateY(Math.PI / 4), acc2, -0.22, 0.28, -0.15);
    piece(); add(new THREE.CylinderGeometry(0.08, 0.08, 0.32, 12), '#e9e6f2', 0.12, 0.22, -0.25); add(dome(0.08), acc, 0.12, 0.38, -0.25);
    piece(); add(new THREE.CylinderGeometry(0.025, 0.035, 0.42, 6), '#ffffff', 0.32, 0.27, 0.05); { const h = add(new THREE.SphereGeometry(0.03, 8, 6), acc2, 0.32, 0.48, 0.07); for (let k = 0; k < 4; k++) { const p = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.2, 0.012), mat('#ffffff')); b.position.y = 0.11; p.add(b); p.rotation.z = (k * Math.PI) / 2; h.add(p); } spinners.push([h, 2.2, 'z']); }
    piece(); for (const x of [-0.25, -0.05]) { const g = add(new THREE.BoxGeometry(0.16, 0.012, 0.1), '#3a5ad8', x, 0.14, 0.28); g.rotation.x = -0.5; add(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 5), '#9aa0b8', x, 0.1, 0.28, false); }
  } else if (style === 'e') {
    // Observatorio: cúpula blanca con su rendija, telescopio que se asoma, radar que gira y un satélite en órbita.
    piece(); add(new THREE.CylinderGeometry(0.48, 0.52, 0.08, 8), '#cfd3e6', 0, 0.04); add(new THREE.CylinderGeometry(0.3, 0.32, 0.12, 16), '#ffffff', -0.05, 0.14); add(new THREE.TorusGeometry(0.31, 0.02, 6, 24), acc, -0.05, 0.2, 0, false).rotation.x = Math.PI / 2;
    piece(); add(dome(0.27), '#f2f4ff', -0.05, 0.2); { const s = add(new THREE.BoxGeometry(0.09, 0.03, 0.24), '#2a2f55', -0.05, 0.415, 0.165, false); s.rotation.x = 0.7; }
    piece(); for (const [geo, c, d] of [[new THREE.CylinderGeometry(0.045, 0.06, 0.4, 12), acc2, 0], [new THREE.CylinderGeometry(0.068, 0.068, 0.04, 12), '#ffffff', 0.2]]) { const g = add(geo, c, 0.02 + 0.717 * (0.1 + d), 0.32 + 0.697 * (0.1 + d), 0.1); g.rotation.z = -0.8; }
    piece(); add(new THREE.CylinderGeometry(0.015, 0.022, 0.24, 6), '#9aa0b8', 0.34, 0.2, -0.2); { const d = add(new THREE.ConeGeometry(0.12, 0.06, 16, 1, true), '#ffffff', 0.34, 0.34, -0.2); d.children.forEach((c) => (c.rotation.x = Math.PI - 0.5)); sub(d, new THREE.SphereGeometry(0.02, 8, 6), acc2, 0, 0.03, 0.02); spinners.push([d, 0.9]); }
    piece(); { const o = shift(add(new THREE.BoxGeometry(0.08, 0.06, 0.06), '#ffd36b', 0, 0.66, 0), 0.28); for (const sx of [-1, 1]) sub(o, new THREE.BoxGeometry(0.11, 0.012, 0.06), '#3a5ad8', 0.28 + sx * 0.1, 0, 0); sub(o, new THREE.SphereGeometry(0.018, 8, 6), glow('#ff5f7e'), 0.28, 0.045, 0, false); spinners.push([o, 0.7]); }
  } else if (style === 'f') {
    // Puerto de naves: plataforma con su pista, hangar de arco, torre de control, luces que laten y un platillo que gira.
    piece(); add(new THREE.CylinderGeometry(0.5, 0.53, 0.06, 6), '#7d84a6', 0, 0.03); add(new THREE.TorusGeometry(0.15, 0.018, 6, 24), '#ffd36b', 0.14, 0.065, 0.1, false).rotation.x = Math.PI / 2; add(new THREE.BoxGeometry(0.03, 0.01, 0.16), '#ffd36b', 0.14, 0.065, 0.1, false);
    piece(); { const g = add(new THREE.CylinderGeometry(0.17, 0.17, 0.34, 16, 1, false, 0, Math.PI), '#e6e3f2', -0.22, 0.06, -0.12); g.rotation.z = Math.PI / 2; add(new THREE.CylinderGeometry(0.175, 0.175, 0.04, 16, 1, false, 0, Math.PI), acc, -0.22, 0.06, -0.12, false).rotation.z = Math.PI / 2; add(new THREE.BoxGeometry(0.012, 0.11, 0.18), '#2a2f55', -0.045, 0.115, -0.12, false); }
    piece(); add(new THREE.CylinderGeometry(0.04, 0.06, 0.42, 10), '#ffffff', 0.3, 0.27, -0.24); add(new THREE.CylinderGeometry(0.11, 0.08, 0.09, 10), glass, 0.3, 0.52, -0.24); add(new THREE.CylinderGeometry(0.12, 0.12, 0.025, 10), acc2, 0.3, 0.58, -0.24); { const b = add(new THREE.SphereGeometry(0.03, 8, 6), glow('#ff5f7e'), 0.3, 0.62, -0.24, false); spinners.push([b, 0, 'pulse']); }
    piece(); for (let k = 0; k < 6; k++) { const a = -0.9 + k * 0.36, b = add(new THREE.SphereGeometry(0.028, 8, 6), glow(k % 2 ? '#7fd8ff' : '#ffe066'), Math.sin(a) * 0.42, 0.08, Math.cos(a) * 0.42, false); spinners.push([b, k * 0.9, 'pulse']); }
    piece(); { const n = add(new THREE.SphereGeometry(0.15, 18, 10).scale(1, 0.28, 1), acc2, 0.14, 0.2, 0.1); sub(n, dome(0.07), glass, 0, 0.03, 0, false); for (let k = 0; k < 4; k++) sub(n, new THREE.SphereGeometry(0.018, 8, 6), glow('#fff3a0'), Math.cos(k * 1.57) * 0.11, -0.01, Math.sin(k * 1.57) * 0.11, false); spinners.push([n, 1.2]); }
  } else if (style === 'g') {
    // Mina de cristales: cerro con su entrada, rieles, vagón con gemas, grúa que gira y cristales que brillan.
    piece(); add(new THREE.CylinderGeometry(0.5, 0.52, 0.06, 9), '#b59a7a', 0, 0.03); add(new THREE.DodecahedronGeometry(0.22, 0).scale(1.4, 0.85, 1), '#8a7a6a', -0.2, 0.14, -0.18); add(new THREE.BoxGeometry(0.13, 0.15, 0.03), '#2a1f3a', -0.14, 0.13, 0.02, false); for (const x of [-0.215, -0.065]) add(new THREE.BoxGeometry(0.025, 0.17, 0.025), '#a8754a', x, 0.14, 0.03); add(new THREE.BoxGeometry(0.18, 0.025, 0.03), '#a8754a', -0.14, 0.225, 0.03);
    piece(); for (const x of [0.07, 0.17]) add(new THREE.BoxGeometry(0.02, 0.02, 0.5), '#9aa0b8', x, 0.07, 0.16); for (let k = 0; k < 6; k++) add(new THREE.BoxGeometry(0.16, 0.012, 0.03), '#a8754a', 0.12, 0.062, -0.06 + k * 0.088, false);
    piece(); add(new THREE.BoxGeometry(0.14, 0.08, 0.18), '#c27a3a', 0.12, 0.13, 0.24); for (const [x, z] of [[0.05, 0.18], [0.19, 0.18], [0.05, 0.3], [0.19, 0.3]]) add(new THREE.CylinderGeometry(0.025, 0.025, 0.015, 10).rotateZ(Math.PI / 2), '#3a3550', x, 0.09, z, false); for (const [x, z, c] of [[0.1, 0.21, acc], [0.15, 0.27, '#c9a6ff']]) add(new THREE.OctahedronGeometry(0.04, 0).scale(1, 1.6, 1), c, x, 0.2, z);
    piece(); add(new THREE.CylinderGeometry(0.02, 0.03, 0.42, 6), '#ffd36b', 0.33, 0.25, -0.2); { const g = shift(add(new THREE.BoxGeometry(0.3, 0.03, 0.03), '#ffd36b', 0.33, 0.47, -0.2), -0.1); sub(g, new THREE.CylinderGeometry(0.004, 0.004, 0.12, 4), '#3a3550', -0.22, -0.06, 0, false); sub(g, new THREE.BoxGeometry(0.05, 0.035, 0.05), '#c9a6ff', -0.22, -0.13, 0); spinners.push([g, 0.5]); }
    piece(); for (const [x, z, s, rz, c] of [[-0.36, 0.2, 1.2, 0.2, acc], [-0.3, 0.3, 0.9, -0.35, '#c9a6ff'], [-0.42, 0.06, 0.8, 0.45, acc2], [0.0, -0.36, 1, -0.2, '#c9a6ff']]) add(new THREE.OctahedronGeometry(0.06 * s, 0).scale(1, 2, 1), c, x, 0.12 * s + 0.04, z).rotation.z = rz; { const l = add(new THREE.OctahedronGeometry(0.05, 0).scale(1, 1.8, 1), glow('#ecdfff'), -0.36, 0.3, 0.2, false); spinners.push([l, 0, 'pulse']); }
  } else if (style === 'h') {
    // Castillo galáctico: muralla de 8 lados con su puerta al frente, 4 torres, la torre mayor y banderas que giran.
    piece(); add(new THREE.CylinderGeometry(0.5, 0.52, 0.06, 8), '#b9b3cc', 0, 0.03); for (let k = 0; k < 8; k++) { if (k === 2) continue; const a = (k * Math.PI) / 4, w = add(new THREE.BoxGeometry(0.29, 0.13, 0.05), '#d6d1e6', Math.cos(a) * 0.36, 0.125, Math.sin(a) * 0.36); w.rotation.y = -a + Math.PI / 2; }
    piece(); for (let k = 0; k < 4; k++) { const a = Math.PI / 8 + (k * Math.PI) / 2, x = Math.cos(a) * 0.39, z = Math.sin(a) * 0.39; add(new THREE.CylinderGeometry(0.07, 0.075, 0.3, 10), '#e6e3f2', x, 0.21, z); add(new THREE.ConeGeometry(0.09, 0.14, 10), acc2, x, 0.43, z); }
    piece(); add(new THREE.BoxGeometry(0.22, 0.2, 0.07), '#d6d1e6', 0, 0.16, 0.36); add(new THREE.BoxGeometry(0.1, 0.12, 0.02), '#7a4a2a', 0, 0.12, 0.4, false); add(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2), '#7a4a2a', 0, 0.18, 0.4, false);
    piece(); add(new THREE.CylinderGeometry(0.12, 0.14, 0.5, 12), '#ffffff', 0, 0.31, -0.05); add(new THREE.ConeGeometry(0.17, 0.22, 12), acc, 0, 0.67, -0.05); add(new THREE.SphereGeometry(0.03, 8, 6), glow('#fff3a0'), 0, 0.42, 0.08, false);
    piece(); for (const [x, y, z, s] of [[0, 0.78, -0.05, 1], [Math.cos(Math.PI / 8) * 0.39, 0.5, Math.sin(Math.PI / 8) * 0.39, 0.7], [-Math.cos(Math.PI / 8) * 0.39, 0.5, -Math.sin(Math.PI / 8) * 0.39, 0.7]]) { add(new THREE.CylinderGeometry(0.008, 0.008, 0.16 * s, 5), '#9aa0b8', x, y + 0.08 * s, z, false); const f = shift(add(new THREE.BoxGeometry(0.1 * s, 0.06 * s, 0.01), '#ff5f7e', x, y + 0.13 * s, z), 0.05 * s); spinners.push([f, 0.8]); }
  } else if (style === 'i') {
    // Parque de diversiones: plaza redonda, carrusel y rueda de la fortuna que giran, montaña rusa y globos que laten.
    piece(); add(new THREE.CylinderGeometry(0.5, 0.52, 0.06, 20), '#f2e6c9', 0, 0.03); add(new THREE.TorusGeometry(0.4, 0.02, 6, 32), acc, 0, 0.065, 0, false).rotation.x = Math.PI / 2;
    piece(); { const g = add(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 16), acc, -0.22, 0.08, 0.14); sub(g, new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), '#ffffff', 0, 0.11, 0, false); sub(g, new THREE.ConeGeometry(0.17, 0.1, 16), '#ff5f7e', 0, 0.25, 0); for (let k = 0; k < 4; k++) sub(g, new THREE.SphereGeometry(0.032, 8, 6).scale(1.3, 1, 0.8), ['#ffffff', '#ffd36b', '#7fb8ff', '#7ee08a'][k], Math.cos(k * 1.57) * 0.1, 0.07, Math.sin(k * 1.57) * 0.1); spinners.push([g, 0.9]); }
    piece(); for (const sz of [-1, 1]) { const l = add(new THREE.BoxGeometry(0.025, 0.36, 0.025), '#9aa0b8', 0.22, 0.18, -0.16 + sz * 0.05); l.rotation.x = sz * 0.18; } { const w = add(new THREE.TorusGeometry(0.2, 0.014, 6, 32), '#ffffff', 0.22, 0.38, -0.16, false); sub(w, new THREE.TorusGeometry(0.2, 0.022, 6, 32), ol, 0, 0, 0, false); for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; sub(w, new THREE.BoxGeometry(0.008, 0.2, 0.008), '#ffffff', Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0, false).rotation.z = a - Math.PI / 2; sub(w, new THREE.BoxGeometry(0.05, 0.045, 0.05), ['#ff5f7e', '#ffd36b', '#7fb8ff'][k % 3], Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0); } spinners.push([w, 0.5, 'z']); }
    piece(); { const c = new THREE.Vector3(0.24, 0.2, 0.22), pts = [[0.02, 0.1, 0.32], [0.2, 0.34, 0.38], [0.4, 0.12, 0.24], [0.42, 0.28, 0.04], [0.24, 0.1, 0.1], [0.06, 0.2, 0.16]].map(([x, y, z]) => new THREE.Vector3(x, y, z).sub(c)); const curve = new THREE.CatmullRomCurve3(pts, true); add(new THREE.TubeGeometry(curve, 48, 0.014, 6, true), acc2, c.x, c.y, c.z, false); add(new THREE.TubeGeometry(curve, 48, 0.022, 6, true), ol, c.x, c.y, c.z, false); for (const [x, y, z] of [[0.2, 0.34, 0.38], [0.42, 0.28, 0.04]]) add(new THREE.CylinderGeometry(0.008, 0.008, y - 0.06, 5), '#9aa0b8', x, 0.06 + (y - 0.06) / 2, z, false); }
    piece(); for (const [x, y, z, c, k] of [[-0.3, 0.5, -0.22, '#ff5f7e', 0], [-0.22, 0.56, -0.28, '#ffd36b', 1.5], [-0.38, 0.55, -0.3, '#7fb8ff', 3]]) { add(new THREE.CylinderGeometry(0.003, 0.003, y - 0.12, 4), '#ffffff', x, 0.06 + (y - 0.12) / 2, z, false); const b = add(new THREE.SphereGeometry(0.05, 12, 10).scale(1, 1.15, 1), c, x, y, z); spinners.push([b, k, 'pulse']); }
  } else {
    // Templo antiguo: escalones de piedra, 4 columnas, altar con su llama, techo de pirámide y un cristal que flota.
    piece(); [[0.72, '#e8d9b0'], [0.58, '#d9c79a'], [0.44, '#e8d9b0']].forEach(([s, c], k) => add(new THREE.BoxGeometry(s, 0.06, s), c, 0, 0.03 + k * 0.06));
    piece(); for (const [x, z] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]]) { add(new THREE.CylinderGeometry(0.03, 0.035, 0.28, 10), '#fff6e0', x, 0.32, z); add(new THREE.BoxGeometry(0.08, 0.025, 0.08), '#d9c79a', x, 0.47, z); }
    piece(); add(new THREE.BoxGeometry(0.1, 0.08, 0.1), '#c9b27a', 0, 0.22, 0); { const f = add(new THREE.ConeGeometry(0.035, 0.08, 8), glow('#ffb347'), 0, 0.3, 0, false); spinners.push([f, 0, 'pulse']); }
    piece(); add(new THREE.BoxGeometry(0.44, 0.03, 0.44), '#e8d9b0', 0, 0.495); add(new THREE.ConeGeometry(0.3, 0.18, 4).rotateY(Math.PI / 4), acc2, 0, 0.6);
    piece(); { const g = add(new THREE.OctahedronGeometry(0.07, 0).scale(1, 1.5, 1), acc, 0, 0.84); sub(g, new THREE.OctahedronGeometry(0.035, 0).scale(1, 1.5, 1), glow('#ffffff'), 0, 0, 0.03, false); spinners.push([g, 1.2]); }
  }
  // Cada pieza en 2 dibujos (relleno con sus colores por vértice y contorno de tinta), no uno por parte: con estaciones
  // en varios planetas el mapa dibujaba el doble (18 nov 2026, al girar el teléfono se sentía lento). Lo que gira, el
  // vidrio y las luces quedan aparte.
  const skip = new Set(spinners.map((x) => x[0])), mats = new Set(Object.values(M)), vc = toon({ vertexColors: true });
  for (const P of pieces) {
    const fills = [], lines = [];
    for (const g of [...P.children]) {
      const [me, line] = g.children;
      if (skip.has(g) || g.children.length > 2 || !me?.isMesh || !mats.has(me.material)) continue;
      g.updateMatrix();
      fills.push([me.geometry, g.matrix, me.material.color]);
      if (line) lines.push([me.geometry, g.matrix.clone().multiply(new THREE.Matrix4().makeScale(1.1, 1.1, 1.1))]);
      P.remove(g);
    }
    if (fills.length) P.add(new THREE.Mesh(mergeGeo(fills), vc));
    if (lines.length) P.add(new THREE.Mesh(mergeGeo(lines), ol));
    fills.forEach(([geo]) => geo.dispose());
  }
  if (full) {
    // Terminada: los rellenos de las 5 piezas en uno y los contornos en otro; lo demás (lo que gira, vidrio, luces) igual.
    const all = new THREE.Group(), fill = [], line = [];
    for (const P of pieces) for (const c of [...P.children]) {
      if (c.isMesh && c.material === vc) fill.push([c.geometry, P.matrix]);
      else if (c.isMesh && c.material === ol) line.push([c.geometry, P.matrix]);
      else { all.add(c); continue; }
      P.remove(c);
    }
    all.add(new THREE.Mesh(mergeGeo(fill), vc), new THREE.Mesh(mergeGeo(line), ol));
    pieces.forEach((P) => obj.remove(P));
    pieces.length = 0;
    pieces.push(all);
    obj.add(all);
  }
  // Cada pieza guarda su lugar para la animación de caída; lo que gira, su vuelta (para las copias).
  pieces.forEach((p) => (p.userData.y0 = p.position.y));
  for (const [o, v, ax] of spinners) o.userData.spin = [v, ax];
  const tick = (t) => {
    for (const [o, v, ax] of spinners) {
      if (ax === 'pulse') o.scale.setScalar(1 + Math.sin(t * 3 + v) * 0.12);
      else if (ax === 'z') o.rotation.z = t * v;
      else o.rotation.y = t * v;
    }
  };
  // Alto total (para que quepa arriba del planeta en horizontal).
  const h = new THREE.Box3().setFromObject(obj).max.y;
  return { obj, pieces, tick, h };
}

// Junta varias formas (cada una con su matriz y, si trae, su color) en una sola.
function mergeGeo(list) {
  const pos = [], nor = [], col = [];
  for (const [geo, m, c] of list) {
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(m);
    const p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
      if (c) col.push(c.r, c.g, c.b);
      else if (g.attributes.color) col.push(g.attributes.color.getX(i), g.attributes.color.getY(i), g.attributes.color.getZ(i));
    }
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  if (col.length) out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return out;
}

// Cuántas piezas se ven (las demás quedan escondidas).
export function showPieces(st, n) { st.pieces.forEach((p, i) => (p.visible = i < n)); }

// Polvito al caer una pieza: bolitas que salen hacia los lados y se apagan.
export function puff(parent, color = '#ffffff') {
  const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
  const bits = Array.from({ length: 8 }, (_, k) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), m); const a = (k / 8) * Math.PI * 2; s.userData.d = new THREE.Vector3(Math.cos(a), 0.15, Math.sin(a)); g.add(s); return s; });
  parent.add(g);
  return (k) => {
    for (const b of bits) { b.position.copy(b.userData.d).multiplyScalar(0.12 + k * 0.45); b.scale.setScalar(1 - k * 0.6); }
    m.opacity = 0.9 * (1 - k);
    if (k >= 1) { parent.remove(g); g.traverse((o) => o.geometry?.dispose()); m.dispose(); }
  };
}

// Fotos de cada pieza para la tira de compra: se dibujan una vez con el mismo modelo 3D (en su color) y se guardan.
const thumbCache = {};
export function pieceThumbs(style, tint, size = 112) {
  const key = `${style}:${tint.join()}`;
  if (thumbCache[key]) return thumbCache[key];
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(size, size, false); r.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
  scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x3a2470, 1.2));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.6); sun.position.set(-6, 5, 7); scene.add(sun);
  const grad = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
  const st = makeStation(style, (o) => new THREE.MeshToonMaterial({ gradientMap: grad, ...o }), tint);
  scene.add(st.obj);
  const out = st.pieces.map((p, k) => {
    st.pieces.forEach((q, j) => (q.visible = j === k));
    const b = new THREE.Box3().setFromObject(p), c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3()).length();
    cam.position.set(c.x + sz * 0.9, c.y + sz * 0.75, c.z + sz * 1.5);
    cam.lookAt(c);
    r.render(scene, cam);
    return r.domElement.toDataURL();
  });
  scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => m.dispose()); });
  r.dispose(); r.forceContextLoss();
  return (thumbCache[key] = out);
}
// Los colores de la estación según el planeta (los mismos que en el mapa).
export const stationTint = (planet) => [planet.bands.at(-2)[1], planet.outline === INK ? '#ff5f7e' : planet.bands.at(-1)[1]];
