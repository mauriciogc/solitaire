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
};
const STYLE_ORDER = ['a', 'b', 'c', 'd'];
export const PIECES = 5;
// Lo que cuesta cada pieza, en orden (20 bloques la estación; un planeta da hasta 30 estrellas).
export const PIECE_COST = [2, 3, 4, 5, 6];
// Estación completa: cofre planeta de oro con monedas (+10% por constelación, tope ×3) y un deshacer.
export const stationPrize = (w) => ({ coins: round5(300 * Math.min(3, 1 + 0.1 * Math.floor(w / 10))), undo: 1, metal: 'oro' });
// Las 10 estaciones de una constelación: cápsula con un título exclusivo (uno por constelación, en orden; después ya no hay).
export const BUILD_TITLES = ['albanil_estelar', 'constructor_lunar', 'ingeniero_espacial', 'arquitecto_galactico', 'urbanista_cosmos'];

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
// Compra la siguiente pieza del mundo w. Devuelve { i, done, prize, title } o null si no alcanza.
export function buyPiece(w) {
  const i = built(w), cost = pieceCost(w);
  if (i >= PIECES || bloques() < cost) return null;
  save.bloques -= cost;
  (save.build ||= {})[w] = i + 1;
  const out = { i, done: i + 1 === PIECES, prize: null, title: null };
  if (out.done) {
    const p = (out.prize = stationPrize(w));
    save.coins += p.coins;
    save.undo += p.undo;
    // ¿Ya están las 10 de su constelación? El siguiente título que no tengas.
    const r = Math.floor(w / 10);
    if (Array.from({ length: 10 }, (_, k) => built(r * 10 + k)).every((n) => n >= PIECES)) {
      const t = BUILD_TITLES.find((k) => !save.owned[`title:${k}`]);
      if (t) (save.owned[`title:${t}`] = 1), (out.title = t);
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
      if (ax === 'pulse') o.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
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
  } else {
    piece(); add(new THREE.CylinderGeometry(0.5, 0.52, 0.06, 18), '#a8754a', 0, 0.03); for (let k = -2; k <= 2; k++) add(new THREE.BoxGeometry(0.62, 0.025, 0.05), '#6fc25a', 0.05, 0.075, k * 0.11 + 0.1, false);
    piece(); add(new THREE.BoxGeometry(0.22, 0.16, 0.18), '#fff1d6', -0.22, 0.14, -0.15); add(new THREE.ConeGeometry(0.18, 0.13, 4).rotateY(Math.PI / 4), acc2, -0.22, 0.28, -0.15);
    piece(); add(new THREE.CylinderGeometry(0.08, 0.08, 0.32, 12), '#e9e6f2', 0.12, 0.22, -0.25); add(dome(0.08), acc, 0.12, 0.38, -0.25);
    piece(); add(new THREE.CylinderGeometry(0.025, 0.035, 0.42, 6), '#ffffff', 0.32, 0.27, 0.05); { const h = add(new THREE.SphereGeometry(0.03, 8, 6), acc2, 0.32, 0.48, 0.07); for (let k = 0; k < 4; k++) { const p = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.2, 0.012), mat('#ffffff')); b.position.y = 0.11; p.add(b); p.rotation.z = (k * Math.PI) / 2; h.add(p); } spinners.push([h, 2.2, 'z']); }
    piece(); for (const x of [-0.25, -0.05]) { const g = add(new THREE.BoxGeometry(0.16, 0.012, 0.1), '#3a5ad8', x, 0.14, 0.28); g.rotation.x = -0.5; add(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 5), '#9aa0b8', x, 0.1, 0.28, false); }
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
      if (ax === 'pulse') o.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
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
