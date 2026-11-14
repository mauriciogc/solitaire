// Avatares 3D (10 nov 2026): tu personaje (niño o niña con su piel, pelo y peinado, save.kid) de busto dentro del
// círculo del avatar, con su ropa de inicio o un disfraz de la tienda encima, en el estilo toon de los planetas y las
// naves. Bodega de 10 movimientos (MOVES); cada ropa o disfraz escoge 3 y el jugador nunca ve sus nombres.
// avatarHTML (art.js) marca data-a3d="ropa:base.piel.pelo.peinado"; watchAvatars() cambia el dibujo 2D por el 3D si esa
// ropa ya tiene modelo: vivo en el botón del perfil, el nivel, tu tarjeta y la ficha del paquete; foto quieta en lo
// demás (también al editar). Un solo lienzo WebGL para todos. Sin modelo todavía: el dibujo 2D de antes.
import * as THREE from 'three';
import { INK, KID_SKINS, KID_HAIRS, KID_STYLES } from './art.js';
import { toonMaker } from './travelers.js';
import dA from './costumes/a.js';
import dB from './costumes/b.js';
import dC from './costumes/c.js';
import dD from './costumes/d.js';
import dE from './costumes/e.js';
import dF from './costumes/f.js';
import dG from './costumes/g.js';
import dH from './costumes/h.js';
import dI from './costumes/i.js';
import dJ from './costumes/j.js';
import dK from './costumes/k.js';

const TAU = Math.PI * 2;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOUTH = '#8a2440', TONGUE = '#ff7a8e';

// Pieza con contorno de tinta (igual que en las naves): la misma forma un poco más grande, por dentro.
function kit(toon) {
  const ink = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  return (geo, color, { ol = 0.08, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s, mat } = {}) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, mat || toon({ color })));
    if (ol) { const o = new THREE.Mesh(geo, ink); o.scale.setScalar(1 + ol); g.add(o); }
    g.position.set(x, y, z); g.rotation.set(rx, ry, rz);
    if (s) g.scale.set(...s);
    return g;
  };
}
const flat = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity === 1 });
// Figura plana con orilla de tinta (bocas): la forma de color y detrás la misma, de tinta y más grande.
function flatShape(geo, color, ol = 1.3) {
  const g = new THREE.Group();
  const ink = new THREE.Mesh(geo, flat(INK)); ink.scale.setScalar(ol); ink.position.z = -0.003;
  g.add(ink, new THREE.Mesh(geo, flat(color)));
  return g;
}
const lerp = (a, b, k) => a + (b - a) * k;

// ---------- Bodega de movimientos ----------
// Cada uno: cuánto dura (s) y hacia dónde va la cara. eye: tamaño de ojos (1.3 = sorpresa); lid: qué tan abiertos
// (0.35 = sueño); happy: cerrados felices (^ ^); wink: el izquierdo cerrado; brow: cejas arriba (+) o abajo (-);
// browTilt: ladeadas; look: hacia dónde mira; mouth: smile, open, o, small, tongue o puff; mouthS: tamaño de la boca;
// tilt/turn: cabeza ladeada y volteando; back: se echa para atrás; blush: se chapea; puff: infla los cachetes;
// laugh: rebota riéndose; nod: dice que sí; hand: saluda con la mano.
const REST = { eye: 1, lid: 1, happy: 0, wink: 0, brow: 0, browTilt: 0, look: [0, 0], mouth: 'smile', mouthS: 1, tilt: 0, turn: 0, back: 0, blush: 0, puff: 0 };
export const MOVES = {
  saludo: { name: 'Saluda', s: 2.6, brow: 0.4, mouth: 'open', hand: 1, tilt: -0.06 },
  risa: { name: 'Se ríe', s: 2.2, happy: 1, brow: 0.5, mouth: 'open', laugh: 1 },
  guino: { name: 'Guiño', s: 1.8, wink: 1, brow: 0.2, browTilt: -0.3, tilt: 0.14, turn: -0.12 },
  pensando: { name: 'Pensando', s: 2.2, brow: 0.3, browTilt: 0.25, mouth: 'small', look: [1, 0.4], turn: 0.3, tilt: -0.08 },
  sorpresa: { name: 'Sorpresa', s: 1.6, eye: 1.3, brow: 1, mouth: 'o', back: 1 },
  lengua: { name: 'Saca la lengua', s: 1.8, happy: 1, brow: 0.3, mouth: 'tongue', tilt: 0.12, turn: 0.1 },
  bostezo: { name: 'Bosteza', s: 2.4, lid: 0.3, brow: -0.2, mouth: 'o', mouthS: 1.8, back: 0.6 },
  timido: { name: 'Tímido', s: 2.2, look: [-0.6, -1], blush: 1, mouth: 'small', tilt: 0.14, turn: -0.18 },
  cachetes: { name: 'Infla los cachetes', s: 1.8, brow: -0.4, browTilt: 0.2, mouth: 'puff', puff: 1 },
  asiente: { name: 'Dice que sí', s: 1.8, happy: 1, brow: 0.3, nod: 1 },
};
const MOVE_KEYS = Object.keys(MOVES);
// La ronda: feliz, movimiento, feliz, movimiento… (con 'all', los 10 de la bodega, para escoger).
function plan(moves) {
  const list = moves === 'all' ? MOVE_KEYS : moves;
  const steps = list.flatMap((k, i) => [{ ...REST, s: 2.2 + (i % 3) * 0.3 }, { ...REST, ...MOVES[k], key: k }]);
  const loop = steps.reduce((n, f) => n + f.s, 0);
  return (t) => { let x = ((t % loop) + loop) % loop; for (const f of steps) { if (x < f.s) return [f, x]; x -= f.s; } return [steps[0], 0]; };
}

// ---------- Cara compartida ----------
// Ojos, cejas, cachetes, bocas y la mano de saludar, sobre una cabeza de radio ~0.27 en el origen de head.
// o: { brow (color de cejas), y (altura de los ojos), sleeve (color de la manga), skin, lashes (pestañas) }.
function faceRig(part, head, root, o) {
  const ey = o.y ?? -0.02;
  // Ojos: abiertos (bolita de tinta con brillos) y cerrados felices (arco ^), los dos en cada lado.
  const eyes = [-1, 1].map((sx) => {
    const pos = new THREE.Group(); pos.position.set(sx * 0.095, ey, 0.242); pos.rotation.y = sx * 0.35;
    const open = new THREE.Group();
    open.add(new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), flat(INK)));
    const hi = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 5), flat('#ffffff')); hi.position.set(-0.014, 0.018, 0.034);
    const hi2 = new THREE.Mesh(new THREE.SphereGeometry(0.007, 5, 4), flat('#ffffff')); hi2.position.set(0.014, -0.014, 0.036);
    open.add(hi, hi2);
    if (o.lashes) for (const k of [0, 1]) { // pestañitas hacia afuera (la niña)
      const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.007, 0.022, 2, 4), flat(INK));
      l.position.set(sx * (0.036 + k * 0.01), 0.028 - k * 0.012, 0.01); l.rotation.z = -sx * (0.9 + k * 0.5);
      open.add(l);
    }
    open.scale.set(1, 1.25, 0.6);
    const shut = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.011, 5, 12, Math.PI), flat(INK)); shut.position.z = 0.012;
    pos.add(open, shut); head.add(pos);
    return { pos, open, shut, sx };
  });
  // Cejas cortitas: suben con la sorpresa, bajan al inflar cachetes y se ladean al pensar o guiñar.
  const brows = [-1, 1].map((sx) => {
    const b = part(new THREE.CapsuleGeometry(0.012, 0.05, 3, 6), o.brow, { x: sx * 0.095, y: ey + 0.08, z: 0.243, rz: Math.PI / 2, ry: sx * 0.35, ol: 0.25 });
    head.add(b); return { b, sx };
  });
  const cheekMat = flat('#ff6f8e', 0.55);
  const cheeks = [-1, 1].map((sx) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 6), cheekMat);
    b.position.set(sx * 0.165, ey - 0.07, 0.2); b.rotation.y = sx * 0.6;
    head.add(b); return b;
  });
  // Bocas: sonrisa, risa abierta con lengüita, "o", sonrisita de lado, lengua de fuera y cachetes inflados.
  const mouthAt = new THREE.Group(); mouthAt.position.set(0, ey - 0.08, 0.245); mouthAt.rotation.x = -0.38; head.add(mouthAt);
  const arc = (r, a = Math.PI) => new THREE.Mesh(new THREE.TorusGeometry(r, 0.011, 6, 14, a), flat(INK));
  const smile = arc(0.045); smile.rotation.z = Math.PI;
  const open = flatShape(new THREE.CircleGeometry(0.058, 20, Math.PI, Math.PI), MOUTH, 1.22);
  const tg = new THREE.Mesh(new THREE.CircleGeometry(0.026, 12, Math.PI, Math.PI), flat(TONGUE)); tg.position.set(0, -0.026, 0.002); open.add(tg);
  open.position.y = 0.02;
  const oo = flatShape(new THREE.CircleGeometry(0.026, 16), MOUTH, 1.4); oo.scale.y = 1.3; oo.position.y = -0.01;
  const small = arc(0.03, Math.PI * 0.8); small.rotation.z = Math.PI * 1.1; small.position.x = 0.02;
  const tongue = new THREE.Group();
  const ts = arc(0.04); ts.rotation.z = Math.PI;
  const tt = flatShape(new THREE.CircleGeometry(0.024, 14), TONGUE, 1.35); tt.scale.y = 1.3; tt.position.set(0.012, -0.052, 0.004);
  tongue.add(tt, ts);
  const puff = flatShape(new THREE.CircleGeometry(0.014, 12), MOUTH, 1.6);
  const mouths = { smile, open, o: oo, small, tongue, puff };
  mouthAt.add(...Object.values(mouths));
  // Mano que sube a saludar desde abajo, junto a la cara.
  const hand = new THREE.Group();
  hand.add(part(new THREE.SphereGeometry(0.065, 12, 10), o.skin, { s: [1, 1.15, 0.6], ol: 0.12 }));
  hand.add(part(new THREE.SphereGeometry(0.025, 8, 6), o.skin, { x: -0.06, y: -0.01, ol: 0.2 }));
  hand.add(part(new THREE.CapsuleGeometry(0.045, 0.12, 4, 10), o.sleeve, { y: -0.13, ol: 0.12 }));
  root.add(hand);

  // Estado suave: cada número va hacia el de la cara actual (igual a 30 o 60 cuadros por segundo).
  const st = { ...REST, lx: 0, ly: 0, hand: 0 };
  let shown = 'smile', pop = 1, last = null;
  return (f, x, t) => {
    const dt = last === null ? 1 : Math.min(0.25, Math.max(0, t - last)); last = t;
    const k = (r) => 1 - Math.pow(1 - r, dt * 60);
    for (const n of ['eye', 'lid', 'happy', 'wink', 'brow', 'browTilt', 'blush', 'puff']) st[n] = lerp(st[n], f[n], k(0.18));
    st.lx = lerp(st.lx, f.look[0], k(0.12)); st.ly = lerp(st.ly, f.look[1], k(0.12));
    st.turn = lerp(st.turn, f.turn, k(0.08)); st.tilt = lerp(st.tilt, f.tilt, k(0.08));
    st.back = lerp(st.back, f.back, k(0.2)); st.mouthS = lerp(st.mouthS, f.mouthS, k(0.15));
    st.hand = lerp(st.hand, f.hand && x > 0.2 && x < f.s - 0.3 ? 1 : 0, k(0.15));
    const blink = t % 2.7 > 2.58 ? 0.08 : 1; // parpadea cada ~2.7 s
    for (const e of eyes) {
      const op = (1 - Math.max(st.happy, e.sx < 0 ? st.wink : 0)) * blink * st.lid;
      e.open.visible = op > 0.22;
      e.shut.visible = !e.open.visible;
      e.open.scale.set(st.eye, 1.25 * op * st.eye, 0.6);
      e.pos.position.x = e.sx * 0.095 + st.lx * 0.022;
      e.pos.position.y = ey + st.ly * 0.015;
    }
    for (const { b, sx } of brows) {
      b.position.y = ey + 0.08 + st.brow * 0.03 + sx * st.browTilt * 0.012;
      b.rotation.z = Math.PI / 2 + sx * st.browTilt * 0.5 - sx * st.brow * 0.15;
    }
    cheeks.forEach((c) => c.scale.set(1.3 * (1 + st.puff * 0.5 + st.blush * 0.25), 0.75 * (1 + st.puff * 0.6), 0.3 + st.puff * 0.5));
    cheekMat.opacity = 0.55 + st.blush * 0.35;
    // Boca: sale la de la cara actual con un pequeño "pop".
    if (shown !== f.mouth) { shown = f.mouth; pop = 0.4; }
    pop = lerp(pop, 1, k(0.25));
    for (const [n, m] of Object.entries(mouths)) m.visible = n === shown;
    const laugh = f.laugh ? 1 + Math.abs(Math.sin(t * 12)) * 0.25 : 1;
    mouthAt.scale.set(pop * st.mouthS, pop * st.mouthS * laugh, 1);
    // Cabeza: voltea, se ladea y respira; con risa rebota, al asentir cabecea y con sorpresa se echa para atrás.
    head.rotation.y = st.turn + Math.sin(t * 0.8) * 0.06;
    head.rotation.z = st.tilt + Math.sin(t * 1.1) * 0.04;
    head.rotation.x = -st.back * 0.18 + (f.laugh ? Math.sin(t * 12) * 0.05 : 0) + (f.nod ? Math.sin(x * 9) * 0.16 * Math.min(1, x * 3, (f.s - x) * 3) : 0) + Math.sin(t * 0.9) * 0.03;
    head.position.y = (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.012 : 0) + st.back * 0.015;
    hand.position.set(0.3, lerp(-0.62, -0.15, st.hand), 0.12);
    hand.rotation.z = -0.25 + (st.hand > 0.5 ? Math.sin(t * 13) * 0.35 : 0);
    return f;
  };
}

// ---------- Tu personaje (niño o niña) + ropa de inicio o disfraz ----------
// Todos son el niño o la niña que arma el jugador (save.kid: base, piel, pelo y peinado; listas en art.js). Encima va
// la ropa de inicio (Trotamundos o Explorador) o un disfraz de la tienda. Con disfraz de gorro (hood) el pelo no se ve
// (nunca se sale del gorro). Cada ropa o disfraz escoge 3 movimientos de la bodega; el jugador nunca ve sus nombres.
const dim = (c, l) => '#' + new THREE.Color(c).offsetHSL(0, 0, l).getHexString();
// Cabeza con su piel (y orejas, si no hay gorro).
const head0 = (part, head, skin, hood) => {
  head.add(part(new THREE.SphereGeometry(0.27, 28, 20), skin, { ol: 0.04, s: [1, 0.96, 0.96] }));
  if (!hood) for (const sx of [-1, 1]) head.add(part(new THREE.SphereGeometry(0.06, 10, 8), dim(skin, -0.04), { x: sx * 0.265, y: -0.01, ol: 0.14, s: [0.6, 1, 1] }));
};
const shirt = (part, torso, color, skin) => {
  torso.add(part(new THREE.SphereGeometry(0.3, 20, 12), color, { y: -0.44, s: [1.15, 0.75, 0.75], ol: 0.04 }));
  torso.add(part(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 12), dim(skin, -0.04), { y: -0.25, ol: 0.1 }));
};
// Estrellita plana con grosor (broche de la exploradora).
const starGeo = (R, r) => {
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r : R; sh[i ? 'lineTo' : 'moveTo'](Math.cos(a) * q, Math.sin(a) * q); }
  return new THREE.ExtrudeGeometry(sh, { depth: 0.014, bevelEnabled: false }).translate(0, 0, -0.007);
};
// Casco de pelo: media esfera echada para atrás (tapa la nuca, deja libre la cara).
const cap = (part, head, c, r = 0.285) => head.add(part(new THREE.SphereGeometry(r, 28, 12, 0, TAU, 0, Math.PI * 0.5), c, { rx: -0.42, y: 0.01, ol: 0.035 }));
// Fleco: mechones redondos sobre la frente.
const fringe = (part, head, c, list, s = [1.2, 0.55, 0.7]) => list.forEach(([x, y, z, rz]) => head.add(part(new THREE.SphereGeometry(0.09, 12, 8), c, { x, y, z, rz, ol: 0.08, s })));
const FRINGE_BOY = [[-0.12, 0.14, 0.2, 0.3], [0.0, 0.17, 0.22, 0], [0.12, 0.14, 0.2, -0.3]];
const FRINGE_GIRL = [[-0.13, 0.15, 0.19, 0.5], [-0.03, 0.17, 0.22, 0.25], [0.09, 0.16, 0.21, -0.1]];
// Peinados: [niño: remolino, despeinado, rizos] · [niña: chongos, coletas, suelto con diadema]. Devuelven sus ticks.
const HAIR_STYLES = {
  nino: [
    (part, head, c) => { // Remolino: el mechón parado de Nico.
      cap(part, head, c); fringe(part, head, c, FRINGE_BOY);
      const tuft = part(new THREE.ConeGeometry(0.05, 0.17, 10), c, { x: 0.04, y: 0.31, z: 0.02, rz: -0.55, ol: 0.12 });
      head.add(tuft);
      return [(f, t) => (tuft.rotation.z = -0.55 + Math.sin(t * 4) * 0.1 + (f.laugh ? Math.sin(t * 12) * 0.15 : 0))];
    },
    (part, head, c) => { // Despeinado: picos para todos lados.
      cap(part, head, c);
      const spikes = [[-0.17, 0.2, 0.08, 0.7, 0.2], [-0.07, 0.27, 0.05, 0.25, 0.1], [0.06, 0.28, 0.03, -0.2, 0.1], [0.17, 0.21, 0.06, -0.7, 0.2], [0, 0.22, -0.15, 0, -0.6], [-0.15, 0.13, -0.16, 0.9, -0.5], [0.15, 0.13, -0.16, -0.9, -0.5]]
        .map(([x, y, z, rz, rx]) => { const s = part(new THREE.ConeGeometry(0.06, 0.16, 8), c, { x, y, z, rz, rx, ol: 0.12 }); head.add(s); return s; });
      [[-0.13, 0.13, 0.21, 2.6], [-0.02, 0.15, 0.23, 3.0], [0.1, 0.13, 0.22, -2.7]].forEach(([x, y, z, rz]) => head.add(part(new THREE.ConeGeometry(0.045, 0.13, 8), c, { x, y, z, rz, rx: -0.5, ol: 0.12 })));
      return [(f, t) => spikes.forEach((s, i) => (s.scale.y = 1 + Math.sin(t * 3 + i) * 0.05 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.08 : 0)))];
    },
    (part, head, c) => { // Rizos: bolitas alrededor de la cabeza.
      cap(part, head, c, 0.29);
      const curls = [];
      for (let i = 0; i < 11; i++) {
        const a = -2.3 + (i / 10) * 4.6, r = 0.29;
        const x = Math.sin(a) * r * 0.95, y = Math.cos(a) * r * 0.75 + 0.07, z = 0.04 + Math.cos(a) * 0.08;
        const k = part(new THREE.SphereGeometry(0.068, 10, 8), c, { x, y, z, ol: 0.1 }); head.add(k); curls.push(k);
      }
      fringe(part, head, c, [[-0.1, 0.15, 0.2, 0], [0.02, 0.17, 0.22, 0], [0.13, 0.14, 0.2, 0]], [0.8, 0.7, 0.7]);
      return [(f, t) => curls.forEach((k, i) => k.scale.setScalar(1 + Math.sin(t * 2.5 + i) * 0.04))];
    },
  ],
  nina: [
    (part, head, c) => { // Chongos con mechones a los lados (como Lila).
      cap(part, head, c); fringe(part, head, c, FRINGE_GIRL, [1.25, 0.55, 0.7]);
      const buns = [-1, 1].map((sx) => { const b = part(new THREE.SphereGeometry(0.1, 14, 10), c, { x: sx * 0.2, y: 0.22, z: -0.04, ol: 0.08 }); head.add(b); return b; });
      const locks = [-1, 1].map((sx) => { const l = part(new THREE.CapsuleGeometry(0.05, 0.16, 4, 10), c, { x: sx * 0.235, y: -0.09, z: 0.06, rz: sx * 0.15, ol: 0.1 }); head.add(l); return l; });
      return [(f, t) => {
        buns.forEach((b, i) => b.scale.setScalar(1 + Math.sin(t * 3 + i * 1.5) * 0.03 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.06 : 0)));
        locks.forEach((l, i) => (l.rotation.z = (i ? 0.15 : -0.15) + Math.sin(t * 2.2 + i) * 0.05));
      }];
    },
    (part, head, c) => { // Coletas: dos colas a los lados con ligas rosas, que se mecen.
      cap(part, head, c); fringe(part, head, c, FRINGE_GIRL, [1.25, 0.55, 0.7]);
      const tails = [-1, 1].map((sx) => {
        const g = new THREE.Group(); g.position.set(sx * 0.25, 0.1, -0.06);
        g.add(part(new THREE.SphereGeometry(0.035, 10, 8), '#ff7ab8', { ol: 0.18 }));
        g.add(part(new THREE.CapsuleGeometry(0.06, 0.15, 4, 10), c, { x: sx * 0.05, y: -0.1, rz: sx * 0.35, ol: 0.1 }));
        head.add(g); return g;
      });
      return [(f, t) => tails.forEach((g, i) => (g.rotation.z = (i ? 1 : -1) * (Math.sin(t * 2.4 + i) * 0.12 + (f.laugh ? Math.sin(t * 12) * 0.15 : 0))))];
    },
    (part, head, c) => { // Suelto con diadema: pelo largo detrás de la cabeza hasta los hombros.
      cap(part, head, c); fringe(part, head, c, FRINGE_GIRL, [1.25, 0.55, 0.7]);
      const back = part(new THREE.SphereGeometry(0.3, 20, 14), c, { y: -0.13, z: -0.07, s: [1.08, 1.12, 0.75], ol: 0.04 });
      head.add(back);
      const locks = [-1, 1].map((sx) => { const l = part(new THREE.CapsuleGeometry(0.055, 0.2, 4, 10), c, { x: sx * 0.235, y: -0.12, z: 0.06, rz: sx * 0.1, ol: 0.1 }); head.add(l); return l; });
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.018, 6, 28, Math.PI), new THREE.MeshBasicMaterial({ color: '#ff7ab8' }));
      band.position.set(0, 0.02, 0.03); band.rotation.x = -0.35; head.add(band);
      return [(f, t) => locks.forEach((l, i) => (l.rotation.z = (i ? 0.1 : -0.1) + Math.sin(t * 2.2 + i) * 0.05))];
    },
  ],
};
// Ropa de inicio (gratis): cada base la suya (10 nov 2026, el usuario: la morada hacía ver niña al niño).
const OUTFITS = {
  // Trotamundos: playera naranja y su brújula colgando (la aguja busca el norte).
  nino: {
    moves: ['saludo', 'risa', 'guino'], sleeve: '#ff9c5b',
    build(part, head, torso, k) {
      shirt(part, torso, this.sleeve, k.skin);
      const cord = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 5, 16, Math.PI), flat('#a86a22'));
      cord.position.set(0, -0.27, 0.17); cord.rotation.set(-0.7, 0, Math.PI);
      torso.add(cord);
      const comp = new THREE.Group();
      comp.add(part(new THREE.CylinderGeometry(0.05, 0.05, 0.022, 18), '#ffc83d', { rx: Math.PI / 2, ol: 0.16 }));
      const dial = new THREE.Mesh(new THREE.CircleGeometry(0.034, 18), flat('#fff6e6')); dial.position.z = 0.013; comp.add(dial);
      const needle = new THREE.Group();
      const nr = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.03, 5), flat('#e8455a')); nr.position.y = 0.015;
      const nb = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.03, 5), flat('#4aa8de')); nb.position.y = -0.015; nb.rotation.z = Math.PI;
      needle.add(nr, nb); needle.position.z = 0.016; comp.add(needle);
      comp.position.set(0, -0.37, 0.225); comp.rotation.x = -0.35;
      torso.add(comp);
      return [(f, t) => (needle.rotation.z = Math.sin(t * 1.7) * 0.6 + Math.sin(t * 4.3) * 0.2)];
    },
  },
  // Explorador: blusa morada con cuellito blanco y broche de estrella en el pelo.
  nina: {
    moves: ['risa', 'timido', 'saludo'], sleeve: '#8a5cf0',
    build(part, head, torso, k) {
      shirt(part, torso, this.sleeve, k.skin);
      for (const sx of [-1, 1]) torso.add(part(new THREE.SphereGeometry(0.07, 12, 8), '#fff6e6', { x: sx * 0.065, y: -0.27, z: 0.15, rz: sx * 0.5, ol: 0.12, s: [1.2, 0.6, 0.5] }));
      const star = part(starGeo(0.05, 0.022), '#ffc83d', { x: 0.17, y: 0.19, z: 0.2, ry: 0.5, rz: 0.2, ol: 0.18 });
      head.add(star);
      return [(f, t) => (star.rotation.z = 0.2 + Math.sin(t * 1.5) * 0.12)];
    },
  },
};
// Disfraces de gorro (10 nov 2026): media esfera grande echada para atrás que deja libre la cara, del mismo color por
// dentro (DoubleSide; si no, por la abertura se ve la tinta y parece pelo oscuro). Cubre la frente hasta y ≈ 0.11.
const hoodCap = (part, head, color, toon) => head.add(part(new THREE.SphereGeometry(0.305, 28, 14, 0, TAU, 0, Math.PI * 0.62), color, { rx: -0.75, ol: 0.035, mat: toon({ color, side: THREE.DoubleSide }) }));
// Punto sobre el gorro (radio r) en la dirección (x, y, z): para pegarle rayitas, manchas, picos.
const onCap = (x, y, z, r) => { const v = new THREE.Vector3(x, y, z).setLength(r); return { x: v.x, y: v.y, z: v.z }; };
// Panza o pechera de otro color al frente del mameluco.
const belly = (part, torso, color, w = 1) => torso.add(part(new THREE.SphereGeometry(0.13, 16, 10), color, { y: -0.4, z: 0.17, ol: 0.06, s: [w, 0.85, 0.4] }));
// Collar o bufanda alrededor del cuello.
const neckRing = (part, color, tube = 0.02) => part(new THREE.TorusGeometry(0.095, tube, 8, 22), color, { y: -0.24, rx: Math.PI / 2 - 0.25, ol: 0.12 });
const COSTUMES = {
  // Conejo (Copito): mameluco blanco, gorro con orejas largas (una se dobla) y una zanahoria de broche.
  conejo: {
    hood: true, moves: ['asiente', 'lengua', 'cachetes'], sleeve: '#f4f1ff',
    build(part, head, torso, k, toon) {
      const W = this.sleeve, PINK = '#ffb3d1';
      shirt(part, torso, W, k.skin);
      // Gorro: media esfera grande echada para atrás; deja libre la cara. Blanco también por dentro (DoubleSide):
      // si no, por la abertura se veía la tinta y parecía pelo oscuro.
      head.add(part(new THREE.SphereGeometry(0.305, 28, 14, 0, TAU, 0, Math.PI * 0.62), W, { rx: -0.75, ol: 0.035, mat: toon({ color: W, side: THREE.DoubleSide }) }));
      const ears = [-1, 1].map((sx) => {
        const e = new THREE.Group();
        e.add(part(new THREE.CapsuleGeometry(0.06, 0.18, 4, 12), W, { y: 0.12, ol: 0.08, s: [1, 1, 0.6] }));
        e.add(part(new THREE.CapsuleGeometry(0.032, 0.13, 4, 10), PINK, { y: 0.12, z: 0.03, ol: 0, s: [1, 1, 0.4] }));
        e.position.set(sx * 0.12, 0.23, -0.04); e.rotation.z = -sx * 0.22;
        head.add(e); return e;
      });
      const carrot = new THREE.Group();
      carrot.add(part(new THREE.ConeGeometry(0.035, 0.11, 10), '#ff8a3d', { rz: Math.PI, ol: 0.14 }));
      [-0.4, 0, 0.4].forEach((rz) => carrot.add(part(new THREE.ConeGeometry(0.012, 0.05, 6), '#5fbf5a', { y: 0.07, rz, ol: 0.2 })));
      carrot.position.set(0.1, -0.36, 0.215); carrot.rotation.set(-0.35, 0, -0.5);
      torso.add(carrot);
      return [(f, t) => {
        ears[0].rotation.z = 0.22 + Math.sin(t * 2.4) * 0.06 + (f.nod ? 0.15 : 0);
        // La derecha se dobla y se endereza de vez en cuando.
        ears[1].rotation.x = -Math.max(0, Math.sin(t * 0.9)) * 0.9 * (f.back ? 0 : 1);
        ears[1].rotation.z = -0.22 - Math.sin(t * 2.4 + 1) * 0.06;
      }];
    },
  },
  // Gatito (Michi): gorro de gato atigrado naranja con orejas y rayitas, mameluco naranja con panza crema y cascabel.
  gato: {
    hood: true, moves: ['guino', 'bostezo', 'lengua'], sleeve: '#ffad5c',
    build(part, head, torso, k, toon) {
      const O = this.sleeve, D = '#c4501f', CREAM = '#fff1dc';
      shirt(part, torso, O, k.skin);
      belly(part, torso, CREAM);
      hoodCap(part, head, O, toon);
      // Rayitas en la frente del gorro.
      [[-0.08, 0.35], [0, 0], [0.08, -0.35]].forEach(([x, rz]) => head.add(part(new THREE.SphereGeometry(0.032, 8, 6), D, { ...onCap(x, 0.2, 0.2, 0.31), rx: -0.8, rz, ol: 0.15, s: [0.5, 1.8, 0.35] })));
      const ears = [-1, 1].map((sx) => {
        const e = new THREE.Group();
        e.add(part(new THREE.ConeGeometry(0.1, 0.18, 4), O, { ol: 0.1, s: [1, 1, 0.55] }));
        e.add(part(new THREE.ConeGeometry(0.06, 0.12, 4), '#ffb3d1', { y: -0.01, z: 0.035, ol: 0, s: [1, 1, 0.3] }));
        e.position.set(sx * 0.155, 0.25, 0.04); e.rotation.z = -sx * 0.35;
        head.add(e); return e;
      });
      // Collar rojo con cascabel.
      torso.add(neckRing(part, '#e8455a'));
      const bell = part(new THREE.SphereGeometry(0.035, 12, 10), '#ffc83d', { y: -0.29, z: 0.135, ol: 0.15 });
      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.006, 0.01), flat(INK)); slit.position.set(0, -0.006, 0.035); bell.add(slit);
      torso.add(bell);
      return [(f, t) => {
        // Una oreja se sacude de vez en cuando (como gato) y el cascabel se mece.
        ears[0].rotation.z = 0.35 + Math.sin(t * 2.2) * 0.04;
        ears[1].rotation.z = -0.35 - (t % 3.4 < 0.25 ? Math.sin((t % 3.4) * 25) * 0.25 : 0);
        bell.rotation.z = Math.sin(t * 3) * 0.3;
      }];
    },
  },
  // Ajolote (Axo): gorro rosa con branquias de plumita a los lados que se mecen, mameluco rosa y burbujitas.
  ajolote: {
    hood: true, moves: ['risa', 'sorpresa', 'cachetes'], sleeve: '#ffb8d6',
    build(part, head, torso, k, toon) {
      const P = this.sleeve, G = '#ff7ab8';
      shirt(part, torso, P, k.skin);
      belly(part, torso, '#ffe0ec');
      hoodCap(part, head, P, toon);
      // Lunarcitos claros en el gorro.
      [[-0.12, 0.26, 0.05], [0.1, 0.28, 0.0], [0.02, 0.24, -0.14]].forEach(([x, y, z]) => head.add(part(new THREE.SphereGeometry(0.025, 8, 6), '#ffe0ec', { ...onCap(x, y, z, 0.31), ol: 0, s: [1, 1, 0.4] })));
      // Branquias: tres plumitas por lado, en abanico.
      const gills = [-1, 1].map((sx) => {
        const g = new THREE.Group(); g.position.set(sx * 0.27, 0.06, -0.03);
        [0.55, 0, -0.55].forEach((a) => {
          const fan = new THREE.Group(); fan.rotation.z = sx * (-Math.PI / 2 + a);
          fan.add(part(new THREE.CapsuleGeometry(0.024, 0.09, 3, 8), G, { y: 0.07, ol: 0.15 }));
          for (const d of [-1, 1]) fan.add(part(new THREE.SphereGeometry(0.014, 6, 4), G, { x: d * 0.026, y: 0.08, ol: 0.2 }));
          g.add(fan);
        });
        head.add(g); return g;
      });
      // Burbujitas que suben junto al hombro.
      const bub = [0, 1, 2].map((i) => { const b = part(new THREE.SphereGeometry(0.022 + i * 0.006, 10, 8), null, { ol: 0.12, mat: flat('#bfe8ff', 0.75) }); torso.add(b); return b; });
      return [(f, t) => {
        gills.forEach((g, i) => (g.rotation.z = (i ? -1 : 1) * (Math.sin(t * 2.6 + i) * 0.12 + (f.laugh ? Math.sin(t * 12) * 0.12 : 0))));
        bub.forEach((b, i) => { const u = (t * 0.35 + i / 3) % 1; b.position.set(0.3 + Math.sin(u * 9 + i) * 0.02, -0.38 + u * 0.4, 0.12); b.scale.setScalar(Math.min(1, u * 6, (1 - u) * 6)); });
      }];
    },
  },
  // Perrito (Toby): gorro color galleta con manchita y orejas caídas que rebotan; playera con collar rojo y placa de hueso.
  perrito: {
    hood: true, moves: ['lengua', 'saludo', 'risa'], sleeve: '#d9b48a',
    build(part, head, torso, k, toon) {
      const T = this.sleeve, B = '#8a5c38';
      shirt(part, torso, T, k.skin);
      hoodCap(part, head, T, toon);
      head.add(part(new THREE.SphereGeometry(0.07, 12, 8), B, { ...onCap(-0.11, 0.24, 0.12, 0.31), ol: 0.1, s: [1.2, 1, 0.35], rx: -0.4, ry: -0.3 }));
      const ears = [-1, 1].map((sx) => {
        const e = new THREE.Group(); e.position.set(sx * 0.25, 0.15, -0.01);
        e.add(part(new THREE.CapsuleGeometry(0.055, 0.14, 4, 10), B, { y: -0.11, ol: 0.1, s: [1, 1, 0.5] }));
        e.rotation.z = sx * 0.3;
        head.add(e); return e;
      });
      torso.add(neckRing(part, '#e8455a'));
      // Placa de hueso dorada.
      const tag = new THREE.Group();
      tag.add(part(new THREE.CapsuleGeometry(0.012, 0.05, 3, 6), '#ffc83d', { rz: Math.PI / 2, ol: 0.25 }));
      for (const x of [-0.035, 0.035]) for (const y of [-0.012, 0.012]) tag.add(part(new THREE.SphereGeometry(0.014, 6, 5), '#ffc83d', { x, y, ol: 0.2 }));
      tag.position.set(0, -0.3, 0.13);
      torso.add(tag);
      return [(f, t) => {
        // Las orejas rebotan; más cuando se ríe o saluda.
        const jig = f.laugh || f.hand ? 0.18 : 0.06;
        ears.forEach((e, i) => (e.rotation.z = (i ? 1 : -1) * (0.3 + Math.abs(Math.sin(t * (f.laugh ? 12 : 3) + i)) * jig)));
        tag.rotation.z = Math.sin(t * 2.5) * 0.2;
      }];
    },
  },
  // Zorro o Zorrita (Canela): gorro naranja de orejas con punta blanca, suéter naranja con pecho blanco, bufanda de
  // mora y la colita esponjada sobre el hombro.
  zorro: {
    hood: true, moves: ['guino', 'pensando', 'risa'], sleeve: '#ff8a3d',
    build(part, head, torso, k, toon) {
      const O = this.sleeve, W = '#fff6e6';
      shirt(part, torso, O, k.skin);
      belly(part, torso, W);
      hoodCap(part, head, O, toon);
      const ears = [-1, 1].map((sx) => {
        const e = new THREE.Group();
        e.add(part(new THREE.ConeGeometry(0.095, 0.22, 4), O, { ol: 0.1, s: [1, 1, 0.55] }));
        e.add(part(new THREE.ConeGeometry(0.04, 0.08, 4), W, { y: 0.075, ol: 0.12, s: [1, 1, 0.6] }));
        e.add(part(new THREE.ConeGeometry(0.055, 0.12, 4), '#5a2a10', { y: -0.02, z: 0.035, ol: 0, s: [1, 1, 0.3] }));
        e.position.set(sx * 0.15, 0.27, 0.03); e.rotation.z = -sx * 0.3;
        head.add(e); return e;
      });
      torso.add(neckRing(part, '#c9406a', 0.03));
      torso.add(part(new THREE.CapsuleGeometry(0.03, 0.08, 3, 8), '#c9406a', { x: -0.08, y: -0.33, z: 0.13, rz: -0.25, ol: 0.15 }));
      // Colita sobre el hombro: naranja con la punta blanca.
      // Más rojiza que el suéter para que no se pierda en el fondo naranja.
      const tail = new THREE.Group(); tail.position.set(0.22, -0.38, -0.02);
      tail.add(part(new THREE.SphereGeometry(0.095, 14, 10), '#d9531f', { y: 0.1, ol: 0.08, s: [1, 1.6, 1] }));
      tail.add(part(new THREE.SphereGeometry(0.06, 12, 8), W, { y: 0.25, ol: 0.1, s: [1, 1.1, 1] }));
      tail.rotation.z = -0.35;
      torso.add(tail);
      return [(f, t) => {
        tail.rotation.z = -0.35 + Math.sin(t * 2) * 0.12 + (f.laugh ? Math.sin(t * 12) * 0.1 : 0);
        ears.forEach((e, i) => (e.rotation.z = (i ? -0.3 : 0.3) + Math.sin(t * 1.8 + i) * 0.04));
      }];
    },
  },
  // Pingüino (Pingo): gorro negro con pico amarillo en la frente, mameluco negro con pechera blanca y bufanda azul.
  pinguino: {
    hood: true, moves: ['cachetes', 'sorpresa', 'saludo'], sleeve: '#2e3550',
    build(part, head, torso, k, toon) {
      const N = this.sleeve;
      shirt(part, torso, N, k.skin);
      belly(part, torso, '#fff6e6', 1.15);
      hoodCap(part, head, N, toon);
      // Pico amarillo en la frente del gorro (y dos ojitos de botón arriba).
      head.add(part(new THREE.ConeGeometry(0.045, 0.09, 12), '#ffc83d', { ...onCap(0, 0.2, 0.22, 0.33), rx: Math.PI / 2 - 0.5, ol: 0.15, s: [1.2, 1, 0.7] }));
      for (const sx of [-1, 1]) head.add(part(new THREE.SphereGeometry(0.022, 8, 6), '#fff6e6', { ...onCap(sx * 0.07, 0.25, 0.17, 0.312), ol: 0.2, s: [1, 1, 0.5] }));
      torso.add(neckRing(part, '#4aa8de', 0.03));
      const end = part(new THREE.CapsuleGeometry(0.03, 0.09, 3, 8), '#4aa8de', { x: 0.08, y: -0.34, z: 0.13, rz: 0.2, ol: 0.15 });
      torso.add(end);
      return [(f, t) => (end.rotation.z = 0.2 + Math.sin(t * 3.2) * 0.15)];
    },
  },
  // Panda (Bambú): gorro blanco con orejas negras redondas, mameluco blanco con hombros negros y una hoja de bambú en
  // la oreja.
  panda: {
    hood: true, moves: ['bostezo', 'asiente', 'timido'], sleeve: '#2e2a3a',
    build(part, head, torso, k, toon) {
      const W = '#f6f4fb', K2 = this.sleeve;
      shirt(part, torso, W, k.skin);
      // Hombros negros (los brazos del panda), bien visibles a los lados.
      for (const sx of [-1, 1]) torso.add(part(new THREE.SphereGeometry(0.13, 14, 10), K2, { x: sx * 0.24, y: -0.37, z: 0.04, ol: 0.06, s: [1, 0.9, 0.85] }));
      hoodCap(part, head, W, toon);
      const ears = [-1, 1].map((sx) => {
        const e = part(new THREE.SphereGeometry(0.08, 14, 10), K2, { ...onCap(sx * 0.6, 0.75, 0.05, 0.3), ol: 0.1, s: [1, 1, 0.6] });
        head.add(e); return e;
      });
      // Hoja de bambú en la oreja derecha.
      const leaf = new THREE.Group(); leaf.position.copy(ears[1].position).add(new THREE.Vector3(0.02, 0.02, 0.05));
      leaf.add(part(new THREE.SphereGeometry(0.04, 10, 6), '#5fbf5a', { x: 0.06, ol: 0.15, s: [2, 0.5, 0.3], rz: 0.35 }));
      leaf.add(part(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 6), '#7a9a3a', { x: -0.01, y: -0.02, rz: -0.9, ol: 0.25 }));
      head.add(leaf);
      return [(f, t) => {
        ears.forEach((e, i) => e.scale.set(1 + Math.sin(t * 2 + i) * 0.04, 1 + Math.sin(t * 2 + i) * 0.04, 0.6));
        leaf.rotation.z = Math.sin(t * 1.6) * 0.15 + (f.nod ? Math.sin(t * 9) * 0.1 : 0);
      }];
    },
  },
  // Tortuga (Tula): gorro verde con dibujo de caparazón, mameluco verde con pechera clara y el caparazón de mochila
  // asomándose por los hombros.
  tortuga: {
    hood: true, moves: ['bostezo', 'asiente', 'sorpresa'], sleeve: '#6fc35a',
    build(part, head, torso, k, toon) {
      const G = this.sleeve, D = '#3f8a3a', SH = '#8a6a2a';
      // El caparazón va detrás del cuerpo: su orilla asoma sobre los hombros.
      const shell = new THREE.Group(); shell.position.set(0, -0.27, -0.2);
      shell.add(part(new THREE.SphereGeometry(0.27, 20, 12), SH, { s: [1.25, 0.85, 0.55], ol: 0.05 }));
      [[-0.13, 0.08], [0.13, 0.08], [0, 0.16]].forEach(([x, y]) => shell.add(part(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 6), '#b8903a', { x, y, z: 0.0, rx: Math.PI / 2, ol: 0, s: [1, 1, 1] })));
      torso.add(shell);
      shirt(part, torso, G, k.skin);
      belly(part, torso, '#f0e8a8');
      hoodCap(part, head, G, toon);
      // Hexágonos del caparazón sobre el gorro, pegados a su superficie.
      const zAxis = new THREE.Vector3(0, 0, 1);
      [[0, 0.3, 0.1], [-0.17, 0.24, 0.1], [0.17, 0.24, 0.1], [-0.1, 0.2, 0.22], [0.1, 0.2, 0.22], [0, 0.3, -0.1]].forEach(([x, y, z]) => {
        const p = onCap(x, y, z, 0.306), hex = part(new THREE.CylinderGeometry(0.062, 0.062, 0.014, 6).rotateX(Math.PI / 2), D, { ...p, ol: 0.18 });
        hex.quaternion.setFromUnitVectors(zAxis, new THREE.Vector3(p.x, p.y, p.z).normalize());
        head.add(hex);
      });
      return [(f, t) => {
        shell.scale.setScalar(1 + Math.sin(t * 1.4) * 0.015);
        shell.position.y = -0.33 + (f.back ? 0.02 : 0);
      }];
    },
  },
  // Robot (Bip): casco gris con antena y foquito que parpadea (la cara queda libre), overol metálico con botones de
  // colores y una tuerca colgando.
  robot: {
    hood: true, moves: ['sorpresa', 'asiente', 'saludo'], sleeve: '#b9bfd6',
    build(part, head, torso, k, toon) {
      const M = this.sleeve, D = '#7f86a8';
      shirt(part, torso, M, k.skin);
      // Panel del pecho con tres botones que se prenden en ronda.
      torso.add(part(new THREE.BoxGeometry(0.2, 0.09, 0.03), '#e3e6f2', { y: -0.36, z: 0.205, rx: -0.35, ol: 0.12 }));
      const lights = ['#e8455a', '#ffc83d', '#4aa8de'].map((c, i) => {
        const m = flat(c); const b = part(new THREE.SphereGeometry(0.02, 10, 8), null, { x: (i - 1) * 0.06, y: -0.355, z: 0.225, ol: 0.25, mat: m });
        torso.add(b); return { m, c: new THREE.Color(c) };
      });
      hoodCap(part, head, M, toon);
      // Tornillos a los lados (como orejas) y remaches en la frente.
      for (const sx of [-1, 1]) head.add(part(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 14), D, { x: sx * 0.31, y: 0.0, z: -0.02, rz: Math.PI / 2, ol: 0.1 }));
      [-0.1, 0, 0.1].forEach((x) => head.add(part(new THREE.SphereGeometry(0.016, 8, 6), D, { ...onCap(x, 0.2, 0.22, 0.31), ol: 0.2 })));
      // Antena con foquito.
      const ant = new THREE.Group(); ant.position.copy(new THREE.Vector3(...Object.values(onCap(0.02, 1, 0, 0.3))));
      ant.add(part(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6), D, { y: 0.05, ol: 0.25 }));
      const bulbM = flat('#ff5f7e');
      ant.add(part(new THREE.SphereGeometry(0.035, 12, 10), null, { y: 0.12, ol: 0.18, mat: bulbM }));
      head.add(ant);
      // Tuerca dorada colgando del cuello.
      const nut = new THREE.Group();
      nut.add(part(new THREE.TorusGeometry(0.032, 0.014, 6, 6), '#ffc83d', { ol: 0.2 }));
      nut.position.set(0, -0.28, 0.14);
      torso.add(nut);
      const on = new THREE.Color('#fff4c7'), red = new THREE.Color('#ff5f7e');
      return [(f, t) => {
        bulbM.color.copy(t % 1.2 < 0.6 ? on : red);
        ant.rotation.z = Math.sin(t * 3) * 0.12 + (f.back ? Math.sin(t * 20) * 0.1 : 0);
        lights.forEach((l, i) => l.m.color.copy(Math.floor(t * 2) % 3 === i ? on : l.c));
        nut.rotation.z = Math.sin(t * 2.4) * 0.3;
      }];
    },
  },
  // Pulpo (Tako): gorro morado de pulpo con ojitos y tentáculos que cuelgan a los lados y se mueven, playera morada con
  // lunares de ventosa.
  pulpo: {
    hood: true, moves: ['risa', 'cachetes', 'sorpresa'], sleeve: '#9a6cf0',
    build(part, head, torso, k, toon) {
      const P = this.sleeve, L = '#e3d0ff';
      shirt(part, torso, P, k.skin);
      [[-0.14, -0.36], [0.02, -0.4], [0.16, -0.35], [-0.04, -0.3]].forEach(([x, y]) => torso.add(part(new THREE.SphereGeometry(0.022, 8, 6), L, { x, y, z: 0.205, ol: 0, s: [1, 1, 0.4] })));
      hoodCap(part, head, P, toon);
      // Cabeza de pulpo: un bulto encima del gorro, con dos ojitos.
      head.add(part(new THREE.SphereGeometry(0.19, 18, 12), P, { y: 0.14, z: -0.08, ol: 0.05, s: [1, 0.9, 1] }));
      for (const sx of [-1, 1]) head.add(part(new THREE.SphereGeometry(0.022, 8, 6), '#2a1f5c', { ...onCap(sx * 0.08, 0.3, 0.15, 0.315), ol: 0, s: [1, 1.2, 0.5] }));
      // Tentáculos: tres por lado, de dos tramos, con ventosas claras.
      const arms = [];
      for (const sx of [-1, 1]) for (const [z, y] of [[0.1, -0.02], [0.0, -0.04], [-0.1, -0.03]]) {
        const a = new THREE.Group(); a.position.set(sx * 0.245, y, z);
        a.add(part(new THREE.CapsuleGeometry(0.036, 0.08, 3, 8), P, { y: -0.055, ol: 0.12 }));
        const b = new THREE.Group(); b.position.y = -0.115;
        b.add(part(new THREE.CapsuleGeometry(0.028, 0.05, 3, 8), P, { y: -0.04, ol: 0.12 }));
        b.add(part(new THREE.SphereGeometry(0.013, 6, 4), L, { y: -0.05, z: 0.025, ol: 0 }));
        a.add(b); a.add(part(new THREE.SphereGeometry(0.014, 6, 4), L, { y: -0.06, z: 0.033, ol: 0 }));
        a.rotation.z = sx * 0.15;
        head.add(a); arms.push({ a, b, sx, ph: arms.length });
      }
      return [(f, t) => arms.forEach(({ a, b, sx, ph }) => {
        const w = Math.sin(t * 2.2 + ph) * 0.15 + (f.laugh ? Math.sin(t * 12 + ph) * 0.15 : 0);
        a.rotation.z = sx * (0.15 + w); b.rotation.z = sx * (0.15 + w * 1.4);
      })];
    },
  },
  // Abeja (Miel): gorrito amarillo con rayas negras y antenas de bolita, chaleco rayado con alitas que se agitan y un
  // tarrito de miel.
  abeja: {
    hood: true, moves: ['saludo', 'risa', 'guino'], sleeve: '#ffd23d',
    build(part, head, torso, k, toon) {
      const Y = this.sleeve, K2 = '#2e2a3a';
      // Alitas detrás de los hombros.
      const wings = [-1, 1].map((sx) => {
        const w = new THREE.Group(); w.position.set(sx * 0.17, -0.27, -0.12);
        w.add(part(new THREE.SphereGeometry(0.09, 12, 8), null, { x: sx * 0.08, y: 0.06, ol: 0.1, s: [1.3, 0.75, 0.3], mat: flat('#dff4ff', 0.9) }));
        torso.add(w); return w;
      });
      shirt(part, torso, Y, k.skin);
      // Rayas del chaleco: bandas de la misma esfera, un poco más grandes.
      for (const [a, b] of [[0.2, 0.06], [0.33, 0.06]]) torso.add(part(new THREE.SphereGeometry(0.303, 24, 4, 0, TAU, Math.PI * a, Math.PI * b), K2, { y: -0.44, s: [1.15, 0.75, 0.75], ol: 0 }));
      hoodCap(part, head, Y, toon);
      // Rayas del gorro (bandas de la media esfera, inclinadas igual que él).
      for (const [a, b] of [[0.2, 0.08], [0.4, 0.08]]) head.add(part(new THREE.SphereGeometry(0.309, 28, 4, 0, TAU, Math.PI * a, Math.PI * b), K2, { rx: -0.75, ol: 0, mat: toon({ color: K2, side: THREE.DoubleSide }) }));
      const ants = [-1, 1].map((sx) => {
        const g = new THREE.Group(); const p = onCap(sx * 0.35, 1, 0.1, 0.29); g.position.set(p.x, p.y, p.z);
        g.add(part(new THREE.CylinderGeometry(0.009, 0.009, 0.13, 6), K2, { y: 0.06, ol: 0.25 }));
        g.add(part(new THREE.SphereGeometry(0.03, 10, 8), K2, { y: 0.13, ol: 0.15 }));
        g.rotation.z = -sx * 0.35;
        head.add(g); return g;
      });
      // Tarrito de miel.
      const jar = new THREE.Group();
      jar.add(part(new THREE.CylinderGeometry(0.04, 0.035, 0.07, 12), '#ffb02e', { ol: 0.15 }));
      jar.add(part(new THREE.CylinderGeometry(0.044, 0.044, 0.018, 12), '#a86a22', { y: 0.042, ol: 0.2 }));
      jar.position.set(0.12, -0.37, 0.205); jar.rotation.set(-0.35, 0, -0.25);
      torso.add(jar);
      return [(f, t) => {
        wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * (0.2 + Math.abs(Math.sin(t * 18)) * 0.35)));
        ants.forEach((g, i) => (g.rotation.z = (i ? -0.35 : 0.35) + Math.sin(t * 3 + i) * 0.1 + (f.laugh ? Math.sin(t * 12) * 0.12 : 0)));
      }];
    },
  },
  // Capibara (Capi): gorro café de orejitas chiquitas con una naranja encima que se balancea, mameluco café con
  // panza clara y flotador rosa en el cuello.
  capibara: {
    hood: true, moves: ['bostezo', 'asiente', 'pensando'], sleeve: '#a8754a',
    build(part, head, torso, k, toon) {
      const C = this.sleeve, D = '#6a4028';
      shirt(part, torso, C, k.skin);
      belly(part, torso, '#e3c49a');
      hoodCap(part, head, C, toon);
      for (const sx of [-1, 1]) head.add(part(new THREE.SphereGeometry(0.045, 10, 8), D, { ...onCap(sx * 0.62, 0.75, 0.05, 0.3), ol: 0.14, s: [1, 0.8, 0.6] }));
      // Naranja sobre la cabeza, con su hojita; se balancea desde abajo.
      const orange = new THREE.Group(); orange.position.set(0, 0.3, -0.02);
      orange.add(part(new THREE.SphereGeometry(0.075, 14, 10), '#ff9c2b', { y: 0.07, ol: 0.1 }));
      orange.add(part(new THREE.SphereGeometry(0.03, 8, 6), '#5fbf5a', { x: 0.025, y: 0.15, rz: -0.6, ol: 0.15, s: [1.6, 0.6, 0.6] }));
      head.add(orange);
      torso.add(neckRing(part, '#ff7ab8', 0.05));
      return [(f, t) => {
        orange.rotation.z = Math.sin(t * 1.3) * 0.18 + (f.nod ? Math.sin(t * 9) * 0.12 : 0);
        orange.rotation.x = Math.sin(t * 0.9) * 0.08;
      }];
    },
  },
  // Astronauta (Cosmo): casco de burbuja de vidrio con tu pelo adentro, traje blanco con parche y la mochila de
  // oxígeno asomando por los hombros. Sin gorro: se ve tu peinado (la burbuja es grande para que quepa).
  astro: {
    moves: ['saludo', 'sorpresa', 'risa'], sleeve: '#f4f1ff',
    build(part, head, torso, k, toon) {
      const W = this.sleeve, G = '#9aa2c4';
      // Mochila detrás del cuerpo: asoma por los hombros.
      torso.add(part(new THREE.BoxGeometry(0.46, 0.26, 0.14), G, { y: -0.33, z: -0.2, ol: 0.05 }));
      for (const sx of [-1, 1]) torso.add(part(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 10), '#ff9c5b', { x: sx * 0.2, y: -0.2, z: -0.2, ol: 0.15 }));
      shirt(part, torso, W, k.skin);
      // Parche: círculo azul con estrellita.
      torso.add(part(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 16), '#4aa8de', { x: -0.11, y: -0.37, z: 0.2, rx: Math.PI / 2 - 0.35, ry: -0.3, ol: 0.18 }));
      torso.add(part(starGeo(0.026, 0.012), '#ffc83d', { x: -0.11, y: -0.367, z: 0.212, rx: -0.35, ry: -0.3, ol: 0 }));
      // Aro del casco en el cuello.
      torso.add(part(new THREE.TorusGeometry(0.15, 0.03, 8, 24), G, { y: -0.27, rx: Math.PI / 2 - 0.2, ol: 0.12 }));
      // Burbuja: vidrio azul clarito transparente; su orilla de tinta es un aro de frente (no tapa la cara).
      const R = 0.4, bubble = new THREE.Group();
      bubble.add(new THREE.Mesh(new THREE.SphereGeometry(R, 32, 20), new THREE.MeshBasicMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.2, depthWrite: false })));
      const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 6, 48), flat(INK)); bubble.add(rim);
      const shine = new THREE.Mesh(new THREE.TorusGeometry(R * 0.8, 0.014, 6, 16, 0.9), flat('#ffffff', 0.85));
      shine.position.z = R * 0.55; shine.rotation.z = Math.PI * 0.55; bubble.add(shine);
      bubble.position.y = 0.02;
      head.add(bubble);
      return [(f, t) => { rim.quaternion.copy(head.quaternion).invert(); shine.material.opacity = 0.7 + Math.sin(t * 2) * 0.15; }];
    },
  },
  // Marciano o Marciana (Zuli): diadema de antenas verdes con bolitas que brillan (se ve tu pelo), traje plateado de
  // cuello alto y una plantita de Marte en el hombro.
  alien: {
    moves: ['sorpresa', 'lengua', 'guino'], sleeve: '#c9cfe0',
    build(part, head, torso, k, toon) {
      const S2 = this.sleeve, GR = '#7fd36a';
      shirt(part, torso, S2, k.skin);
      torso.add(part(new THREE.CylinderGeometry(0.105, 0.12, 0.11, 18, 1, true), S2, { y: -0.23, ol: 0.1, mat: toon({ color: S2, side: THREE.DoubleSide }) }));
      // Rayita verde en el pecho.
      torso.add(part(new THREE.BoxGeometry(0.26, 0.022, 0.02), GR, { y: -0.36, z: 0.205, rx: -0.35, ol: 0.15 }));
      // Diadema: arco verde por encima del pelo y dos antenas con bolitas que brillan.
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.315, 0.016, 6, 28, Math.PI), flat(GR));
      band.position.set(0, 0.02, 0.0); band.rotation.x = -0.2; head.add(band);
      const glow = flat('#c8ff7a');
      const ants = [-1, 1].map((sx) => {
        const g = new THREE.Group(); const p = onCap(sx * 0.42, 1, 0.08, 0.3); g.position.set(p.x, p.y, p.z);
        g.add(part(new THREE.CylinderGeometry(0.01, 0.01, 0.11, 6), GR, { y: 0.055, ol: 0.25 }));
        g.add(part(new THREE.SphereGeometry(0.034, 12, 10), null, { y: 0.12, ol: 0.18, mat: glow }));
        g.rotation.z = -sx * 0.4;
        head.add(g); return g;
      });
      // Plantita de Marte en su macetita roja.
      const plant = new THREE.Group(); plant.position.set(0.15, -0.36, 0.2); plant.rotation.x = -0.35;
      plant.add(part(new THREE.CylinderGeometry(0.035, 0.026, 0.045, 10), '#d9532f', { ol: 0.18 }));
      plant.add(part(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 5), '#3f9a46', { y: 0.045, ol: 0 }));
      const bud = part(new THREE.SphereGeometry(0.02, 8, 6), '#ff7ab8', { y: 0.075, ol: 0.2 });
      plant.add(bud);
      for (const sx of [-1, 1]) plant.add(part(new THREE.SphereGeometry(0.018, 8, 6), GR, { x: sx * 0.02, y: 0.05, rz: sx * 0.7, ol: 0.2, s: [1.6, 0.6, 0.5] }));
      torso.add(plant);
      const a = new THREE.Color('#c8ff7a'), b = new THREE.Color('#fff9c4');
      return [(f, t) => {
        glow.color.copy(a).lerp(b, (Math.sin(t * 4) + 1) / 2);
        ants.forEach((g, i) => (g.rotation.z = (i ? -0.4 : 0.4) + Math.sin(t * 2.6 + i * 1.3) * 0.12 + (f.back ? Math.sin(t * 18) * 0.08 : 0)));
        bud.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
      }];
    },
  },
  // Dinosaurio (Pepo): gorro verde con cresta de picos y dientitos blancos en la orilla, mameluco verde con panza
  // amarilla.
  dino: {
    hood: true, moves: ['risa', 'lengua', 'cachetes'], sleeve: '#5fbf5a',
    build(part, head, torso, k, toon) {
      const G = this.sleeve;
      shirt(part, torso, G, k.skin);
      belly(part, torso, '#ffe066', 1.1);
      hoodCap(part, head, G, toon);
      // Cresta: placas naranjas por el centro, de arriba a la nuca, apuntando hacia afuera.
      const Y = new THREE.Vector3(0, 1, 0), spikes = [];
      // Planos (anchos de lado, delgados de frente a atrás): de frente se ven como placas, no como un cuerno.
      [[1, 0.25, 0.08], [0.85, -0.5, 0.075], [0.35, -0.95, 0.065]].forEach(([a, b, h]) => {
        const dir = new THREE.Vector3(0, a, b).normalize();
        const s = part(new THREE.ConeGeometry(h * 0.9, h * 1.5, 4), '#ffb02e', { ol: 0.12, s: [1, 1, 0.35] });
        s.position.copy(dir.clone().multiplyScalar(0.3 + h * 0.4)); s.quaternion.setFromUnitVectors(Y, dir);
        head.add(s); spikes.push(s);
      });
      // Dientitos en la orilla del gorro (sobre la frente), apuntando hacia abajo.
      const th = Math.PI * 0.62, rot = new THREE.Euler(-0.75, 0, 0);
      for (let i = -2; i <= 2; i++) {
        const ph = Math.PI / 2 + i * 0.32;
        const v = new THREE.Vector3(-Math.cos(ph) * Math.sin(th), Math.cos(th), Math.sin(ph) * Math.sin(th)).multiplyScalar(0.3).applyEuler(rot);
        head.add(part(new THREE.ConeGeometry(0.022, 0.045, 6), '#fffdf7', { x: v.x, y: v.y - 0.012, z: v.z + 0.01, rx: Math.PI, ol: 0.2 }));
      }
      return [(f, t) => spikes.forEach((s, i) => (s.scale.y = 1 + Math.sin(t * 3 + i) * 0.06 + (f.laugh ? Math.abs(Math.sin(t * 12 + i)) * 0.12 : 0)))];
    },
  },
  // Fantasmita (Boo): sábana blanca con la cara asomándose por la abertura, que ondea con su puntita arriba, y una
  // linterna amarilla.
  fantasma: {
    hood: true, moves: ['sorpresa', 'timido', 'cachetes'], sleeve: '#f6f4ff',
    build(part, head, torso, k, toon) {
      const W = this.sleeve;
      shirt(part, torso, W, k.skin);
      hoodCap(part, head, W, toon);
      // La sábana cae de la cabeza a los hombros por los lados.
      const drapes = [-1, 1].map((sx) => {
        const d = new THREE.Group(); d.position.set(sx * 0.24, -0.06, -0.02);
        d.add(part(new THREE.CapsuleGeometry(0.075, 0.2, 4, 10), W, { y: -0.12, ol: 0.08, s: [1, 1, 0.8] }));
        torso.add(d); return d;
      });
      // Puntita de la sábana arriba, doblada.
      const tip = new THREE.Group(); tip.position.set(0, 0.29, -0.06);
      tip.add(part(new THREE.ConeGeometry(0.06, 0.13, 12), W, { y: 0.05, ol: 0.12 }));
      head.add(tip);
      // Linterna: marco oscuro y luz amarilla que titila.
      const lamp = new THREE.Group(); lamp.position.set(0.15, -0.37, 0.2); lamp.rotation.x = -0.35;
      lamp.add(part(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 10), '#5a4a99', { ol: 0.2 }));
      const light = flat('#ffd84a');
      lamp.add(part(new THREE.SphereGeometry(0.026, 10, 8), null, { ol: 0, mat: light, s: [1, 1.1, 1] }).translateZ(0.012));
      lamp.add(part(new THREE.TorusGeometry(0.02, 0.006, 4, 10, Math.PI), '#5a4a99', { y: 0.04, ol: 0 }));
      torso.add(lamp);
      const a = new THREE.Color('#ffd84a'), b = new THREE.Color('#fff4c7');
      return [(f, t) => {
        tip.rotation.z = -0.5 + Math.sin(t * 1.8) * 0.2; tip.rotation.x = Math.sin(t * 1.3) * 0.1;
        drapes.forEach((d, i) => (d.rotation.z = (i ? -1 : 1) * (0.05 + Math.sin(t * 2 + i) * 0.06)));
        light.color.copy(a).lerp(b, Math.abs(Math.sin(t * 5)) * (0.5 + Math.sin(t * 13) * 0.3));
        lamp.rotation.z = Math.sin(t * 2) * 0.12;
      }];
    },
  },
};
// spec = "ropa:base.piel.pelo.peinado" ("conejo:nina.1.5.0"). También vale "nino", "conejo:nina" (lo demás, de inicio).
function parse(spec) {
  const [k, rest = ''] = String(spec).split(':');
  const [b, skin, hair, style] = rest.split('.');
  const base = b === 'nina' || (!b && k === 'nina') ? 'nina' : 'nino';
  const kid = { base, skin: KID_SKINS[+skin] ? +skin : 1, hair: KID_HAIRS[+hair] ? +hair : base === 'nina' ? 5 : 0, style: KID_STYLES[base][+style] ? +style : 0 };
  // Ropa de inicio: cada quien la suya (el niño de naranja, la niña de morado), sea cual sea la clave.
  return { dress: k === 'nino' || k === 'nina' ? OUTFITS[base] : COSTUMES[k], kid };
}
export const has3D = (spec) => { const k = String(spec).split(':')[0]; return !!(OUTFITS[k] || COSTUMES[k]); };
export const movesOf = (spec) => parse(spec).dress?.moves || [];
export const COSTUME_LIST = [['nino', 'Ropa de inicio'], ['gato', 'Gatito'], ['ajolote', 'Ajolote'], ['conejo', 'Conejo'], ['perrito', 'Perrito'], ['zorro', 'Zorro'], ['pinguino', 'Pingüino'], ['panda', 'Panda'], ['tortuga', 'Tortuga'], ['robot', 'Robot'], ['pulpo', 'Pulpo'], ['abeja', 'Abeja'], ['capibara', 'Capibara'], ['astro', 'Astronauta'], ['alien', 'Marciano'], ['dino', 'Dinosaurio'], ['fantasma', 'Fantasmita']];
// Disfraces en archivos aparte (js/costumes/*.js, 10 nov 2026) para modelarlos en paralelo. Cada archivo exporta
// default (H) => ({ clave: { name, moves, sleeve, hood?, wig?, build(part, head, torso, k, toon) => [ticks] } }), con H los
// ayudantes de aquí. hood: gorro (tu pelo no se dibuja) · wig: peluca (el disfraz pone su pelo y el tuyo no se dibuja).
const H = { THREE, TAU, flat, flatShape, dim, shirt, starGeo, cap, fringe, hoodCap, onCap, belly, neckRing, KID_HAIRS };
for (const mk of [dA, dB, dC, dD, dE, dF, dG, dH, dI, dJ, dK]) for (const [k, c] of Object.entries(mk(H))) { COSTUMES[k] = c; if (!COSTUME_LIST.some((x) => x[0] === k)) COSTUME_LIST.push([k, c.name || k]); }

// Un avatar listo para la escena: { obj, tick(segundos) }. moves: los 3 de su ropa o 'all' (los 10, para dev).
// Con "reducir movimiento" se queda feliz y quieto.
export function makeAvatar3D(spec, toon = toonMaker(), moves) {
  const { dress = OUTFITS.nino, kid } = parse(spec), part = kit(toon);
  const skin = KID_SKINS[kid.skin], hair = KID_HAIRS[kid.hair];
  const g = new THREE.Group(), root = new THREE.Group(), head = new THREE.Group(), torso = new THREE.Group();
  // Como el dibujo 2D: la cabeza a la mitad del círculo con aire alrededor y los hombros cortados abajo.
  root.scale.setScalar(1.48); root.position.y = -0.08;
  root.add(torso, head); g.add(root);
  head0(part, head, skin, dress.hood);
  const ticks = [...(dress.hood || dress.wig ? [] : HAIR_STYLES[kid.base][kid.style](part, head, hair)), ...dress.build(part, head, torso, { ...kid, skin }, toon)];
  const face = faceRig(part, head, root, { brow: hair, sleeve: dress.sleeve, skin, lashes: kid.base === 'nina' }), at = plan(moves || dress.moves);
  const tick = (t) => {
    const [f, x] = at(t);
    m.key = f.key; // qué movimiento va haciendo (vacío = feliz)
    face(f, x, t);
    torso.scale.y = 1 + Math.sin(t * 2) * 0.015;
    ticks.forEach((fn) => fn(f, t));
  };
  const m = { obj: g, key: null };
  m.tick = (t) => (calm() ? tick(0) : tick(t));
  tick(0); // derecho, de frente y feliz: así sale la foto
  return m;
}

// ---------- Un solo dibujante para todos ----------
const S = 320; // lado del lienzo 3D (los vivos se copian a su tamaño)
let stage = null;
function getStage() {
  if (stage) return stage;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(1); renderer.setSize(S, S, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x3a2470, 1.3));
  // Luz casi de frente (un poco arriba e izquierda): con la de lado de las naves, el sombreado por bloques partía la
  // cara en dos tonos y se veía chueca. Así la sombra solo queda en las orillas.
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.6); sun.position.set(-1.2, 2.5, 8); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20); camera.position.set(0, 0, 2.9); camera.lookAt(0, 0, 0);
  stage = { renderer, scene, camera, toon: toonMaker(), live: [], stills: new Map(), raf: 0, last: 0, turn: 0 };
  stage.io = new IntersectionObserver((es) => es.forEach((e) => { const s = stage.live.find((o) => o.canvas === e.target); if (s) s.vis = e.isIntersecting; }));
  return stage;
}
const dispose = (obj) => obj.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => m.dispose()); });
// Dibuja un modelo solo y lo copia al lienzo 2D (o devuelve la foto).
// Los vivos se dibujan solo del tamaño de su lienzo (esquina de abajo del de 320): 30 veces por segundo, dibujar y
// copiar el lienzo entero para un avatar de 52 px era lo que más pesaba.
function shoot(st, obj, ctx) {
  st.scene.children.forEach((c) => c.isGroup && (c.visible = c === obj));
  const w = ctx ? Math.min(S, ctx.canvas.width) : S;
  st.renderer.setViewport(0, 0, w, w);
  st.renderer.render(st.scene, st.camera);
  if (!ctx) return st.renderer.domElement.toDataURL('image/png');
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(st.renderer.domElement, 0, S - w, w, w, 0, 0, ctx.canvas.width, ctx.canvas.height);
}
// Foto quieta (feliz), una vez por personaje.
function still(kind) {
  const st = getStage();
  if (!st.stills.has(kind)) {
    const m = makeAvatar3D(kind, st.toon);
    st.scene.add(m.obj);
    st.stills.set(kind, shoot(st, m.obj));
    st.scene.remove(m.obj); dispose(m.obj);
  }
  return st.stills.get(kind);
}
// Los vivos: 30 cuadros por segundo, solo los que se ven y no están tapados por una ventana; máximo 8 por cuadro.
function loop(now) {
  const st = stage;
  st.raf = 0;
  st.live = st.live.filter((s) => {
    if (s.canvas.isConnected) return true;
    st.io.unobserve(s.canvas); st.scene.remove(s.m.obj); dispose(s.m.obj);
    return false;
  });
  if (!st.live.length) return;
  st.raf = requestAnimationFrame(loop);
  if (now - st.last < 32) return;
  st.last = now;
  const modal = !!document.querySelector('#modal-root .modal');
  const due = st.live.filter((s) => s.vis && !(modal && !s.canvas.closest('#modal-root')));
  const n = Math.min(8, due.length);
  for (let i = 0; i < n; i++) {
    const s = due[(st.turn + i) % due.length];
    s.m.tick(now / 1000 + s.phase);
    shoot(st, s.m.obj, s.ctx);
  }
  st.turn = due.length ? (st.turn + n) % due.length : 0;
}
function goLive(el, kind, moves) {
  const st = getStage(), canvas = document.createElement('canvas');
  canvas.className = 'av-char av3d-pic';
  const px = Math.min(S, Math.round((el.clientWidth || 52) * Math.min(3, devicePixelRatio || 1)));
  canvas.width = canvas.height = px;
  const m = makeAvatar3D(kind, st.toon, moves), s = { canvas, ctx: canvas.getContext('2d'), m, vis: true, phase: Math.random() * 20 };
  st.scene.add(m.obj);
  m.tick(s.phase); shoot(st, m.obj, s.ctx); // ya con imagen desde el primer momento
  el.querySelector('.av-char, .av-l')?.replaceWith(canvas);
  st.live.push(s); st.io.observe(canvas);
  if (!st.raf) st.raf = requestAnimationFrame(loop);
}
// Qué movimiento va haciendo el avatar vivo de ese lienzo (para el menú dev).
export const moveNow = (canvas) => stage?.live.find((s) => s.canvas === canvas)?.m.key || null;
// Dónde se mueve: en el botón del perfil de los mundos (arriba), en el del nivel, en tu tarjeta (al tocar tu avatar) y en
// la ficha del paquete. Al editar tu
// jugador va quieto, igual que en la tienda, Tu camino y paquetes (lo pidió el usuario). .a3d-live / .a3d-still
// fuerzan uno u otro.
const LIVE = '.me .avatar, .hud-av, .prof-av .avatar, .ss-hero .avatar, .a3d-live .avatar';
function hydrate() {
  for (const el of document.querySelectorAll('.avatar[data-a3d]:not([data-a3d-on])')) {
    const kind = el.dataset.a3d;
    el.dataset.a3dOn = '1';
    if (!has3D(kind)) continue;
    try {
      if (el.matches(LIVE) && !el.closest('.a3d-still') && !calm()) goLive(el, kind, null);
      else {
        const img = new Image(); img.className = 'av-char av3d-pic'; img.alt = ''; img.src = still(kind);
        el.querySelector('.av-char, .av-l')?.replaceWith(img);
      }
    } catch (e) { console.warn('avatar 3D', e); } // sin WebGL se queda el dibujo 2D
  }
}
// Vigila la página: cada avatar nuevo que aparezca se cambia al 3D en el siguiente cuadro.
export function watchAvatars() {
  let queued = false;
  const run = () => { queued = false; hydrate(); };
  new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(run); } }).observe(document.body, { childList: true, subtree: true });
  hydrate();
}
