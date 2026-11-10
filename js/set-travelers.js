// Naves 3D de las colecciones de personaje (market de avatares, 9 nov 2026; datos en sets.js). Mismo estilo que
// travelers.js: material toon con contorno de tinta, ~1 de alto, centradas en el origen. Cada una: { obj, tick(t) }.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const V2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));
const glow = (color, opacity = 0.85) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
const shape = (pts) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); return s; };
const extrude = (pts, depth, bevel = 0.02) => new THREE.ExtrudeGeometry(shape(pts), { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2 }).translate(0, 0, -depth / 2);

// Hélice de 2 aspas (gira en tick).
function propeller(part, color = '#ff5f7e', r = 0.18) {
  const p = new THREE.Group();
  p.add(part(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 8), '#8f88c0', { y: -0.04, ol: 0.2 }));
  for (const a of [0, Math.PI]) p.add(part(new THREE.SphereGeometry(r / 2, 10, 6).scale(1, 0.12, 0.35), color, { x: Math.cos(a) * r / 2, z: Math.sin(a) * r / 2, ry: -a, ol: 0.15 }));
  return p;
}
// Par de alas (planas, aletean en tick con wing.rotation).
function wingPair(part, color, w = 0.32, y = 0) {
  const ws = [-1, 1].map((sx) => {
    const g = new THREE.Group();
    g.add(part(new THREE.SphereGeometry(w / 2, 14, 8).scale(1, 0.55, 0.12), color, { x: sx * w / 2, ol: 0.1 }));
    g.position.set(sx * 0.12, y, -0.02); return g;
  });
  return ws;
}

export function setModels(INK) {
  return {
    // Nico: brújula dorada con su aguja que tiembla y una hélice arriba.
    avnino(part) {
      const g = new THREE.Group(), c = new THREE.Group();
      c.add(part(new THREE.CylinderGeometry(0.36, 0.36, 0.1, 32).rotateX(Math.PI / 2), '#ffc83d', { ol: 0.06 }));
      c.add(part(new THREE.CylinderGeometry(0.29, 0.29, 0.11, 32).rotateX(Math.PI / 2), '#fff6e6', { ol: 0 }));
      const needle = new THREE.Group();
      needle.add(part(new THREE.ConeGeometry(0.06, 0.24, 4).translate(0, 0.12, 0), '#e8434f', { z: 0.07, ol: 0.15 }));
      needle.add(part(new THREE.ConeGeometry(0.06, 0.24, 4).translate(0, 0.12, 0).rotateZ(Math.PI), '#4aa8de', { z: 0.07, ol: 0.15 }));
      needle.add(part(new THREE.SphereGeometry(0.035, 10, 8), '#ffc83d', { z: 0.08, ol: 0.2 }));
      c.add(needle);
      c.add(part(new THREE.TorusGeometry(0.05, 0.018, 8, 16), '#ffc83d', { y: 0.4, ol: 0.2 }));
      const prop = propeller(part, '#4aa8de', 0.36); prop.position.y = 0.5; c.add(prop);
      g.add(c);
      return { obj: g, tick: (t) => { needle.rotation.z = Math.sin(t * 1.3) * 0.5 + Math.sin(t * 7) * 0.06; prop.rotation.y = t * 14; c.position.y = Math.sin(t * 2) * 0.04 - 0.05; c.rotation.y = Math.sin(t * 0.8) * 0.45; } };
    },
    // Lila: diente de león; el tallo se mece y se le van soltando semillitas.
    avnina(part) {
      const g = new THREE.Group(), f = new THREE.Group();
      f.add(part(new THREE.CylinderGeometry(0.018, 0.022, 0.6, 8), '#5fbf5a', { y: -0.28, ol: 0.25 }));
      f.add(part(new THREE.SphereGeometry(0.08, 10, 6).scale(0.4, 1, 0.15), '#7fd36a', { x: 0.06, y: -0.42, rz: -0.6, ol: 0.15 }));
      f.add(part(new THREE.SphereGeometry(0.06, 12, 10), '#c9a46a', { y: 0.06, ol: 0.15 }));
      for (let i = 0; i < 46; i++) {
        const y = 1 - (i / 45) * 2, r = Math.sqrt(1 - y * y), a = i * 2.4;
        f.add(part(new THREE.SphereGeometry(0.035, 6, 4), '#ffffff', { x: Math.cos(a) * r * 0.22, y: 0.06 + y * 0.22, z: Math.sin(a) * r * 0.22, ol: 0 }));
      }
      const seeds = [0, 1, 2].map((k) => { const s = part(new THREE.SphereGeometry(0.03, 6, 4), '#ffffff', { ol: 0.3 }); g.add(s); return s; });
      g.add(f);
      return { obj: g, tick: (t) => {
        f.rotation.z = Math.sin(t * 1.2) * 0.15; f.position.y = Math.sin(t * 2) * 0.03 + 0.05;
        seeds.forEach((s, k) => { const p = ((t * 0.35 + k / 3) % 1); s.position.set(0.15 + p * 0.45, 0.12 + p * 0.3 + Math.sin(p * 9) * 0.04, 0); s.scale.setScalar(1 - p * 0.6); });
      } };
    },
    // Michi: cojín morado con botón y borlas doradas que se mecen.
    avgato(part) {
      const g = new THREE.Group(), c = new THREE.Group();
      c.add(part(new THREE.SphereGeometry(0.42, 24, 14).scale(1, 0.32, 0.85), '#8a5cf0', { ol: 0.05 }));
      c.add(part(new THREE.SphereGeometry(0.05, 10, 8), '#ffc83d', { y: 0.13, ol: 0.2 }));
      const tassels = [[0.36, 0.3], [-0.36, 0.3], [0.36, -0.3], [-0.36, -0.3]].map(([x, z]) => {
        const tg = new THREE.Group();
        tg.add(part(new THREE.SphereGeometry(0.035, 8, 6), '#ffc83d', { ol: 0.25 }));
        tg.add(part(new THREE.ConeGeometry(0.04, 0.12, 8), '#ffc83d', { y: -0.08, ol: 0.2 }));
        tg.position.set(x, -0.02, z); c.add(tg); return tg;
      });
      c.rotation.x = 0.45; g.add(c);
      return { obj: g, tick: (t) => { c.position.y = Math.sin(t * 2) * 0.05; c.rotation.z = Math.sin(t * 1.4) * 0.08; c.rotation.y = Math.sin(t * 0.7) * 0.4; tassels.forEach((s, k) => (s.rotation.z = Math.sin(t * 3 + k) * 0.35)); } };
    },
    // Axo: pecera de vidrio con agua y un pececito que da vueltas; hélice arriba.
    avajolote(part, toon) {
      const g = new THREE.Group(), b = new THREE.Group();
      b.add(part(new THREE.SphereGeometry(0.33, 24, 16), '#cdf0ff', { ol: 0.04, mat: toon({ color: '#cdf0ff', transparent: true, opacity: 0.35, depthWrite: false }) }));
      b.add(part(new THREE.SphereGeometry(0.3, 24, 12, 0, TAU, Math.PI * 0.42, Math.PI * 0.58), '#5fc7e8', { ol: 0, mat: toon({ color: '#5fc7e8', transparent: true, opacity: 0.7 }) }));
      b.add(part(new THREE.TorusGeometry(0.16, 0.03, 8, 24).rotateX(Math.PI / 2), '#ff9cc8', { y: 0.3, ol: 0.15 }));
      const fish = new THREE.Group();
      fish.add(part(new THREE.SphereGeometry(0.06, 12, 8).scale(1.4, 1, 0.8), '#ff9c2b', { ol: 0.15 }));
      fish.add(part(new THREE.ConeGeometry(0.05, 0.08, 6).rotateZ(Math.PI / 2), '#ff9c2b', { x: -0.11, ol: 0.15 }));
      const swim = new THREE.Group(); fish.position.x = 0.13; swim.add(fish); swim.position.y = -0.06; b.add(swim);
      const prop = propeller(part, '#ff9cc8', 0.34); prop.position.y = 0.4; b.add(prop);
      g.add(b);
      return { obj: g, tick: (t) => { swim.rotation.y = t * 1.6; prop.rotation.y = t * 12; b.position.y = Math.sin(t * 2) * 0.04 - 0.04; } };
    },
    // Toby: su casita roja con techo azul y alitas que aletean.
    avperrito(part) {
      const g = new THREE.Group(), h = new THREE.Group();
      h.add(part(new THREE.BoxGeometry(0.42, 0.32, 0.36), '#e8434f', { y: -0.08, ol: 0.05 }));
      const roof = new THREE.ConeGeometry(0.36, 0.24, 4).rotateY(Math.PI / 4);
      h.add(part(roof, '#4aa8de', { y: 0.2, ol: 0.06 }));
      h.add(part(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 20, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), INK, { y: -0.14, z: 0.18, ol: 0 }));
      h.add(part(new THREE.BoxGeometry(0.16, 0.05, 0.02), '#ffc83d', { y: 0.03, z: 0.19, ol: 0.2 }));
      const ws = wingPair(part, '#fffdf7', 0.34, 0.02); ws.forEach((w) => { w.position.x *= 2; h.add(w); });
      g.add(h);
      return { obj: g, tick: (t) => { ws[0].rotation.z = Math.sin(t * 9) * 0.5; ws[1].rotation.z = -Math.sin(t * 9) * 0.5; h.position.y = Math.sin(t * 2.4) * 0.05; h.rotation.y = -0.4 + Math.sin(t * 0.8) * 0.3; } };
    },
    // Canela: bufanda a rayas que ondula como alfombra mágica, con flecos.
    avzorro(part) {
      const g = new THREE.Group(), s = new THREE.Group(), N = 9;
      const segs = Array.from({ length: N }, (_, i) => { const m = part(new THREE.BoxGeometry(0.1, 0.03, 0.3), i % 2 ? '#fff6e6' : '#e2652a', { ol: 0.12 }); m.position.x = (i - (N - 1) / 2) * 0.1; s.add(m); return m; });
      for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) s.add(part(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 5).rotateZ(Math.PI / 2), '#e2652a', { x: sx * 0.5, z: -0.11 + k * 0.075, ol: 0.3 }));
      s.rotation.set(0.5, -0.4, 0); g.add(s);
      return { obj: g, tick: (t) => { segs.forEach((m, i) => (m.position.y = Math.sin(t * 3 - i * 0.7) * 0.05)); s.position.y = Math.sin(t * 1.8) * 0.04; } };
    },
    // Pingo: iglú de bloques con su puerta y una hélice de hielo.
    avpinguino(part) {
      const g = new THREE.Group(), i = new THREE.Group();
      i.add(part(new THREE.SphereGeometry(0.34, 24, 12, 0, TAU, 0, Math.PI / 2), '#f4fbff', { y: -0.12, ol: 0.05 }));
      for (const y of [0.0, 0.1, 0.18]) i.add(part(new THREE.TorusGeometry(Math.sqrt(0.34 ** 2 - y ** 2), 0.008, 4, 40).rotateX(Math.PI / 2), '#8fd6ff', { y: y - 0.12, ol: 0 }));
      i.add(part(new THREE.CylinderGeometry(0.11, 0.11, 0.18, 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), '#f4fbff', { y: -0.12, z: 0.3, ol: 0.08 }));
      i.add(part(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), INK, { y: -0.08, z: 0.39, ol: 0 }));
      i.add(part(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 16, 1).rotateX(Math.PI / 2), '#c9ecff', { y: -0.12, z: 0.391, ol: 0, rz: 0 }));
      const prop = propeller(part, '#8fd6ff', 0.4); prop.position.y = 0.3; i.add(prop);
      g.add(i);
      return { obj: g, tick: (t) => { prop.rotation.y = t * 13; i.position.y = Math.sin(t * 2) * 0.04; i.rotation.y = Math.sin(t * 0.7) * 0.5; } };
    },
    // Bambú: tallo de bambú con nudos y dos hojas arriba que giran como hélice.
    avpanda(part) {
      const g = new THREE.Group(), b = new THREE.Group();
      for (let k = 0; k < 3; k++) {
        b.add(part(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 14), '#8fdc6a', { y: -0.3 + k * 0.21, ol: 0.12 }));
        b.add(part(new THREE.TorusGeometry(0.072, 0.014, 6, 16).rotateX(Math.PI / 2), '#56b83a', { y: -0.2 + k * 0.21, ol: 0 }));
      }
      b.add(part(new THREE.SphereGeometry(0.1, 10, 6).scale(1.4, 0.25, 0.5), '#7fd36a', { x: 0.14, y: -0.12, rz: 0.4, ol: 0.15 }));
      const top = new THREE.Group();
      for (const a of [0, Math.PI]) top.add(part(new THREE.SphereGeometry(0.13, 12, 6).scale(1.6, 0.15, 0.5), '#5fbf5a', { x: Math.cos(a) * 0.2, z: Math.sin(a) * 0.2, ry: -a, ol: 0.12 }));
      top.position.y = 0.37; b.add(top);
      g.add(b);
      return { obj: g, tick: (t) => { top.rotation.y = t * 7; b.position.y = Math.sin(t * 2.2) * 0.04; b.rotation.z = Math.sin(t * 1.3) * 0.12; } };
    },
    // Tula: islita de tierra que flota con su palmera y un coco.
    avtortuga(part) {
      const g = new THREE.Group(), i = new THREE.Group();
      i.add(part(new THREE.ConeGeometry(0.34, 0.34, 9).rotateX(Math.PI), '#a86a3a', { y: -0.24, ol: 0.05 }));
      i.add(part(new THREE.CylinderGeometry(0.36, 0.34, 0.06, 18), '#f3d48a', { y: -0.06, ol: 0.06 }));
      i.add(part(new THREE.CylinderGeometry(0.22, 0.24, 0.04, 16), '#7fd36a', { x: -0.06, y: -0.02, ol: 0.08 }));
      const palm = new THREE.Group();
      for (let k = 0; k < 4; k++) palm.add(part(new THREE.CylinderGeometry(0.035, 0.04, 0.1, 8), '#b8865a', { x: k * 0.015, y: k * 0.095, rz: -0.12, ol: 0.2 }));
      const leaves = new THREE.Group(); leaves.position.set(0.06, 0.38, 0);
      for (let k = 0; k < 5; k++) { const l = new THREE.Group(); l.add(part(new THREE.SphereGeometry(0.1, 10, 6).scale(1.8, 0.18, 0.55), '#5fbf5a', { x: 0.16, rz: -0.35, ol: 0.15 })); l.rotation.y = (k / 5) * TAU; leaves.add(l); }
      leaves.add(part(new THREE.SphereGeometry(0.045, 10, 8), '#8a5a2a', { y: -0.04, x: 0.03, ol: 0.2 }));
      palm.add(leaves); palm.position.set(0.05, -0.02, 0); i.add(palm);
      g.add(i);
      return { obj: g, tick: (t) => { i.position.y = Math.sin(t * 1.8) * 0.05; i.rotation.y = t * 0.5; leaves.rotation.z = Math.sin(t * 2) * 0.08; } };
    },
    // Bip: lavadora con su ventana redonda; la ropita da vueltas y abajo salen dos llamitas.
    avrobot(part, toon) {
      const g = new THREE.Group(), w = new THREE.Group();
      w.add(part(new THREE.BoxGeometry(0.46, 0.5, 0.42), '#f4f1ff', { ol: 0.05 }));
      w.add(part(new THREE.BoxGeometry(0.46, 0.08, 0.43), '#c9c4e8', { y: 0.2, ol: 0 }));
      for (const [x, c] of [[-0.14, '#ff5f7e'], [-0.06, '#7fe05a'], [0.12, '#4aa8de']]) w.add(part(new THREE.SphereGeometry(0.022, 8, 6), c, { x, y: 0.2, z: 0.22, ol: 0.2 }));
      w.add(part(new THREE.TorusGeometry(0.15, 0.03, 10, 28), '#9a92c4', { y: -0.04, z: 0.21, ol: 0.15 }));
      w.add(part(new THREE.CircleGeometry(0.15, 28), '#bfe8ff', { y: -0.04, z: 0.215, ol: 0, mat: toon({ color: '#bfe8ff', transparent: true, opacity: 0.55 }) }));
      const clothes = new THREE.Group(); clothes.position.set(0, -0.04, 0.17);
      for (const [a, c] of [[0, '#ff9c5b'], [2.1, '#8a5cf0'], [4.2, '#ffc83d']]) clothes.add(part(new THREE.BoxGeometry(0.08, 0.05, 0.02), c, { x: Math.cos(a) * 0.07, y: Math.sin(a) * 0.07, rz: a, ol: 0 }));
      w.add(clothes);
      const flames = [-0.13, 0.13].map((x) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 10), glow('#ffb02e', 0.95)); f.rotation.x = Math.PI; f.position.set(x, -0.35, 0); w.add(f); return f; });
      w.rotation.y = -0.35; g.add(w);
      return { obj: g, tick: (t) => { clothes.rotation.z = t * 6; flames.forEach((f, k) => f.scale.set(1, 1 + Math.sin(t * 27 + k) * 0.2, 1)); w.position.y = Math.sin(t * 2.2) * 0.04 + 0.04; w.rotation.z = Math.sin(t * 9) * 0.015; } };
    },
    // Tako: submarino morado con ventanitas, periscopio, hélice atrás y burbujas.
    avpulpo(part) {
      const g = new THREE.Group(), s = new THREE.Group();
      s.add(part(new THREE.CapsuleGeometry(0.2, 0.38, 8, 20).rotateZ(Math.PI / 2), '#8a5cf0', { ol: 0.05 }));
      for (const x of [-0.12, 0.04, 0.2]) { s.add(part(new THREE.TorusGeometry(0.05, 0.015, 6, 16), '#ffc83d', { x, z: 0.19, ol: 0.2 })); s.add(part(new THREE.CircleGeometry(0.05, 16), '#8fe8ff', { x, z: 0.195, ol: 0 })); }
      s.add(part(new THREE.CylinderGeometry(0.07, 0.09, 0.1, 14), '#6c3fd4', { x: 0.02, y: 0.22, ol: 0.12 }));
      s.add(part(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8), '#c9c4e8', { x: 0.05, y: 0.34, ol: 0.25 }));
      s.add(part(new THREE.CylinderGeometry(0.018, 0.018, 0.08, 8).rotateZ(Math.PI / 2), '#c9c4e8', { x: 0.08, y: 0.41, ol: 0.25 }));
      const prop = propeller(part, '#ffc83d', 0.26); prop.rotation.z = Math.PI / 2; prop.position.x = -0.44; s.add(prop);
      const bubbles = [0, 1, 2, 3].map((k) => { const b = part(new THREE.SphereGeometry(0.03, 8, 6), '#cdf0ff', { ol: 0.25 }); g.add(b); return b; });
      s.rotation.y = -0.4; g.add(s);
      return { obj: g, tick: (t) => { prop.rotation.x = t * 14; s.position.y = Math.sin(t * 1.8) * 0.04; s.rotation.z = Math.sin(t * 1.3) * 0.06; bubbles.forEach((b, k) => { const p = (t * 0.5 + k / 4) % 1; b.position.set(-0.42 - p * 0.05 + Math.sin(p * 12) * 0.03, -0.05 + p * 0.55, 0); b.scale.setScalar(0.6 + p); }); } };
    },
    // Miel: girasol que vuela girando sus pétalos, con su tallo y hojas.
    avabeja(part) {
      const g = new THREE.Group(), f = new THREE.Group(), petals = new THREE.Group();
      for (let k = 0; k < 14; k++) { const p = new THREE.Group(); p.add(part(new THREE.SphereGeometry(0.08, 10, 6).scale(0.55, 1.6, 0.2), '#ffd23d', { y: 0.22, ol: 0.12 })); p.rotation.z = (k / 14) * TAU; petals.add(p); }
      f.add(petals);
      f.add(part(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 24).rotateX(Math.PI / 2), '#8a5a2a', { z: 0.02, ol: 0.08 }));
      f.add(part(new THREE.CylinderGeometry(0.025, 0.03, 0.4, 8), '#5fbf5a', { y: -0.36, ol: 0.25 }));
      f.add(part(new THREE.SphereGeometry(0.08, 10, 6).scale(1.5, 0.3, 0.6), '#7fd36a', { x: 0.1, y: -0.36, rz: 0.5, ol: 0.15 }));
      f.add(part(new THREE.SphereGeometry(0.08, 10, 6).scale(1.5, 0.3, 0.6), '#7fd36a', { x: -0.1, y: -0.44, rz: -0.5, ol: 0.15 }));
      f.scale.setScalar(0.95); f.position.y = 0.08; g.add(f);
      return { obj: g, tick: (t) => { petals.rotation.z = t * 0.9; f.rotation.y = Math.sin(t * 0.8) * 0.5; f.rotation.z = Math.sin(t * 1.5) * 0.08; f.position.y = 0.08 + Math.sin(t * 2) * 0.04; } };
    },
    // Capi: naranja con hojita adentro de un flotador rosa y blanco.
    avcapibara(part) {
      const g = new THREE.Group(), n = new THREE.Group();
      n.add(part(new THREE.SphereGeometry(0.26, 24, 16), '#ff9c2b', { y: 0.06, ol: 0.05 }));
      n.add(part(new THREE.SphereGeometry(0.07, 10, 6).scale(1.6, 0.25, 0.7), '#5fbf5a', { x: 0.08, y: 0.33, rz: 0.4, ol: 0.15 }));
      n.add(part(new THREE.CylinderGeometry(0.014, 0.014, 0.06, 6), '#6a4028', { y: 0.33, ol: 0.3 }));
      const ring = new THREE.Group();
      ring.add(part(new THREE.TorusGeometry(0.28, 0.09, 14, 32).rotateX(Math.PI / 2), '#fffdf7', { ol: 0.06 }));
      for (let k = 0; k < 4; k++) ring.add(part(new THREE.TorusGeometry(0.28, 0.092, 14, 8, TAU / 8).rotateX(Math.PI / 2), '#ff5f7e', { ry: (k / 4) * TAU, ol: 0 }));
      ring.position.y = -0.06; n.add(ring);
      n.rotation.x = 0.35; g.add(n);
      return { obj: g, tick: (t) => { n.position.y = Math.sin(t * 1.8) * 0.05; n.rotation.z = Math.sin(t * 1.8 + 0.6) * 0.1; n.rotation.y = t * 0.4; } };
    },
    // Cosmo: cápsula espacial blanca con su ventanita y un paracaídas de colores.
    avastro(part) {
      const g = new THREE.Group(), c = new THREE.Group();
      c.add(part(new THREE.CylinderGeometry(0.1, 0.24, 0.3, 20), '#f4f1ff', { y: -0.2, ol: 0.06 }));
      c.add(part(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 20), '#4a4270', { y: -0.37, ol: 0.08 }));
      c.add(part(new THREE.SphereGeometry(0.06, 12, 10), '#5fc7e8', { y: -0.18, z: 0.17, ol: 0.25 }));
      const chute = new THREE.Group();
      ['#ff5f7e', '#ffc83d', '#4aa8de', '#7fd36a', '#ff9c5b', '#b48cff'].forEach((col, k) => chute.add(part(new THREE.SphereGeometry(0.3, 6, 8, (k / 6) * TAU, TAU / 6, 0, Math.PI / 2), col, { ol: 0.04 })));
      chute.position.y = 0.2; c.add(chute);
      for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + 0.4; const l = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.36, 4), new THREE.MeshBasicMaterial({ color: INK })); l.position.set(Math.cos(a) * 0.17, 0.02, Math.sin(a) * 0.17); l.lookAt(0, -0.1, 0); l.rotateX(Math.PI / 2); c.add(l); }
      g.add(c);
      return { obj: g, tick: (t) => { c.rotation.z = Math.sin(t * 1.2) * 0.12; c.position.y = Math.sin(t * 1.6) * 0.04; chute.rotation.y = t * 0.3; } };
    },
    // Zuli: burbuja de vidrio con una roca de Marte y su plantita de antenas que brillan.
    avalien(part, toon) {
      const g = new THREE.Group(), b = new THREE.Group();
      b.add(part(new THREE.SphereGeometry(0.34, 24, 16), '#d8ffc0', { ol: 0.04, mat: toon({ color: '#d8ffc0', transparent: true, opacity: 0.3, depthWrite: false }) }));
      b.add(part(new THREE.DodecahedronGeometry(0.16, 0).scale(1.4, 0.6, 1.2), '#d9643a', { y: -0.2, ol: 0.08 }));
      const plant = new THREE.Group();
      for (const [x, h] of [[-0.05, 0.22], [0.04, 0.3], [0.1, 0.18]]) {
        plant.add(part(new THREE.CylinderGeometry(0.012, 0.015, h, 6), '#7fd36a', { x, y: -0.12 + h / 2, ol: 0.3 }));
        plant.add(part(new THREE.SphereGeometry(0.035, 10, 8), '#c8ff8a', { x, y: -0.12 + h, ol: 0.25, mat: glow('#c8ff8a', 1) }));
      }
      b.add(plant);
      b.add(part(new THREE.TorusGeometry(0.36, 0.02, 6, 40).rotateX(Math.PI / 2 - 0.3), '#b48cff', { ol: 0.2 }));
      b.scale.setScalar(0.85); g.add(b);
      return { obj: g, tick: (t) => { b.position.y = Math.sin(t * 2) * 0.05; b.rotation.y = t * 0.5; plant.rotation.z = Math.sin(t * 2.4) * 0.12; } };
    },
    // Pepo: hoja de helecho que vuela doblándose con el viento.
    avdino(part) {
      const g = new THREE.Group(), f = new THREE.Group(), N = 8;
      const segs = [];
      let parent = f;
      for (let i = 0; i < N; i++) {
        const sgm = new THREE.Group(), len = 0.1 - i * 0.004, w = 0.17 - i * 0.015;
        sgm.add(part(new THREE.CylinderGeometry(0.014, 0.016, len, 6), '#3f9a46', { y: len / 2, ol: 0.3 }));
        for (const sx of [-1, 1]) sgm.add(part(new THREE.SphereGeometry(w / 2, 8, 6).scale(1, 0.3, 0.12), i % 2 ? '#7fd36a' : '#5fbf5a', { x: sx * w * 0.55, y: len / 2, rz: sx * -0.4, ol: 0.15 }));
        if (i) sgm.position.y = 0.1 - (i - 1) * 0.004;
        parent.add(sgm); parent = sgm; segs.push(sgm);
      }
      f.position.y = -0.38; g.add(f);
      return { obj: g, tick: (t) => { segs.forEach((s, i) => (s.rotation.z = -0.08 + Math.sin(t * 2 - i * 0.5) * 0.06)); f.rotation.y = Math.sin(t * 0.7) * 0.6; g.position.y = Math.sin(t * 1.9) * 0.04; } };
    },
    // Boo: sábana voladora con ojitos; su orilla ondula.
    avfantasma(part) {
      const g = new THREE.Group(), s = new THREE.Group();
      const prof = V2([[0, 0.34], [0.14, 0.32], [0.24, 0.22], [0.27, 0.02], [0.29, -0.16], [0.33, -0.28], [0.3, -0.31], [0, -0.31]]);
      const body = part(new THREE.LatheGeometry(prof, 24), '#fffdf7', { ol: 0.05 }); s.add(body);
      for (const x of [-0.08, 0.08]) s.add(part(new THREE.SphereGeometry(0.035, 10, 8).scale(1, 1.4, 0.5), INK, { x, y: 0.1, z: 0.245, ol: 0 }));
      s.add(part(new THREE.SphereGeometry(0.03, 10, 8).scale(1.4, 1, 0.5), INK, { y: 0.0, z: 0.26, ol: 0 }));
      for (const x of [-0.16, 0.16]) s.add(part(new THREE.SphereGeometry(0.03, 8, 6).scale(1.4, 0.8, 0.4), '#ffb3c4', { x, y: 0.03, z: 0.23, ol: 0 }));
      g.add(s);
      return { obj: g, tick: (t) => { s.position.y = Math.sin(t * 2) * 0.06; s.rotation.z = Math.sin(t * 1.5) * 0.1; body.scale.set(1 + Math.sin(t * 4) * 0.03, 1, 1 - Math.sin(t * 4) * 0.03); s.rotation.y = Math.sin(t * 0.8) * 0.3; } };
    },
    // Estelita: luna creciente con un columpio y una estrellita sentada.
    avestrella(part) {
      const g = new THREE.Group(), m = new THREE.Group();
      m.add(part(new THREE.TorusGeometry(0.28, 0.09, 12, 32, Math.PI * 1.25), '#ffe066', { rz: Math.PI * 0.62, ol: 0.06 }));
      const swing = new THREE.Group(); swing.position.set(0.06, 0.12, 0);
      for (const x of [-0.08, 0.08]) swing.add(part(new THREE.CylinderGeometry(0.006, 0.006, 0.38, 4), '#c98a3a', { x, y: -0.19, ol: 0 }));
      swing.add(part(new THREE.BoxGeometry(0.22, 0.025, 0.08), '#c98a3a', { y: -0.38, ol: 0.15 }));
      const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.045 : 0.1; i ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      swing.add(part(new THREE.ExtrudeGeometry(st, { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012 }).translate(0, 0, -0.02), '#ffc83d', { y: -0.29, ol: 0.1 }));
      m.add(swing); m.position.x = -0.04; g.add(m);
      return { obj: g, tick: (t) => { swing.rotation.z = Math.sin(t * 2) * 0.35; m.position.y = Math.sin(t * 1.4) * 0.04; m.rotation.y = Math.sin(t * 0.6) * 0.4; } };
    },
    // Ulises: libro que aletea con sus tapas como alas.
    avbuho(part) {
      const g = new THREE.Group(), b = new THREE.Group();
      b.add(part(new THREE.BoxGeometry(0.05, 0.42, 0.06), '#86481a', { ol: 0.1 }));
      const covers = [-1, 1].map((sx) => {
        const c = new THREE.Group();
        c.add(part(new THREE.BoxGeometry(0.3, 0.42, 0.025), '#a8642a', { x: sx * 0.15, ol: 0.06 }));
        c.add(part(new THREE.BoxGeometry(0.27, 0.38, 0.05), '#fff6e0', { x: sx * 0.14, z: 0.035 * -sx * 0 + 0.03, ol: 0 }));
        b.add(c); return c;
      });
      b.add(part(new THREE.BoxGeometry(0.04, 0.2, 0.01), '#e8434f', { x: 0.02, y: -0.28, z: 0.04, ol: 0.2 }));
      b.rotation.x = -0.9; g.add(b);
      return { obj: g, tick: (t) => { const a = 0.55 + Math.sin(t * 5) * 0.4; covers[0].rotation.y = a; covers[1].rotation.y = -a; b.position.y = Math.sin(t * 2.5) * 0.06; b.rotation.z = Math.sin(t * 0.9) * 0.3; } };
    },
    // Marina: caracol gigante en espiral que navega despacio.
    avsirena(part) {
      const g = new THREE.Group(), s = new THREE.Group();
      for (let i = 0; i < 18; i++) {
        const a = i * 0.55, r = 0.03 + i * 0.012, rr = 0.03 + i * 0.008;
        s.add(part(new THREE.SphereGeometry(rr * 1.6, 12, 10), i % 2 ? '#ffd6e6' : '#ff9cc8', { x: Math.cos(a) * r * 1.6, y: 0.18 - i * 0.022, z: Math.sin(a) * r * 1.6, ol: 0.07 }));
      }
      s.add(part(new THREE.SphereGeometry(0.15, 16, 12).scale(1, 0.6, 1), '#fff0f6', { x: 0.1, y: -0.24, ol: 0.07 }));
      s.add(part(new THREE.SphereGeometry(0.04, 10, 8), '#fffdf7', { x: 0.12, y: -0.17, z: 0.1, ol: 0.2 }));
      s.scale.setScalar(0.85); g.add(s);
      return { obj: g, tick: (t) => { s.rotation.y = t * 0.6; s.position.y = Math.sin(t * 1.8) * 0.05 + 0.03; s.rotation.z = Math.sin(t * 1.4) * 0.08; } };
    },
    // Vladi: ataúd de madera con su murciélago dorado; la tapa se abre y alas de murciélago aletean.
    avvampiro(part) {
      const g = new THREE.Group(), c = new THREE.Group();
      const pts = [[0, 0.36], [0.13, 0.22], [0.1, -0.36], [-0.1, -0.36], [-0.13, 0.22], [-0.0, 0.36]];
      c.add(part(extrude(pts, 0.12), '#6a3a2a', { ol: 0.05 }));
      const lid = new THREE.Group(); lid.position.set(0.13, 0, 0.08);
      lid.add(part(extrude(pts, 0.03), '#8a4a3a', { x: -0.13, ol: 0.08 }));
      lid.add(part(new THREE.SphereGeometry(0.04, 10, 8).scale(2.2, 0.8, 0.4), '#ffc83d', { x: -0.13, y: 0.1, z: 0.03, ol: 0.2 }));
      c.add(lid);
      const ws = [-1, 1].map((sx) => { const w = new THREE.Group(); w.add(part(new THREE.SphereGeometry(0.12, 10, 6).scale(1.5, 0.7, 0.12), '#3a2a5a', { x: sx * 0.16, ol: 0.1 })); w.position.set(sx * 0.1, 0.1, -0.04); c.add(w); return w; });
      c.rotation.set(0.2, -0.3, -0.25); g.add(c);
      return { obj: g, tick: (t) => { lid.rotation.y = -Math.max(0, Math.sin(t * 0.9)) * 0.7; ws[0].rotation.z = Math.sin(t * 10) * 0.5; ws[1].rotation.z = -Math.sin(t * 10) * 0.5; c.position.y = Math.sin(t * 2) * 0.04; } };
    },
    // Chispa: huevo de dragón rojo con escamas doradas y alitas.
    avdragoncito(part) {
      const g = new THREE.Group(), e = new THREE.Group();
      e.add(part(new THREE.SphereGeometry(0.25, 24, 16).scale(1, 1.3, 1), '#e8452a', { ol: 0.05 }));
      for (let k = 0; k < 14; k++) { const a = k * 2.4, y = -0.22 + (k / 14) * 0.48, r = Math.sqrt(Math.max(0.01, 1 - (y / 0.33) ** 2)) * 0.25; e.add(part(new THREE.ConeGeometry(0.03, 0.06, 4), '#ffc83d', { x: Math.cos(a) * r, y, z: Math.sin(a) * r, rz: -Math.cos(a) * 1.2, rx: Math.sin(a) * 1.2, ol: 0.2 })); }
      const ws = [-1, 1].map((sx) => { const w = new THREE.Group(); w.add(part(new THREE.SphereGeometry(0.14, 10, 6).scale(1.4, 0.8, 0.1), '#ffc83d', { x: sx * 0.15, y: 0.05, ol: 0.1 })); w.position.set(sx * 0.18, 0.06, -0.05); e.add(w); return w; });
      g.add(e);
      return { obj: g, tick: (t) => { ws[0].rotation.z = Math.sin(t * 8) * 0.55; ws[1].rotation.z = -Math.sin(t * 8) * 0.55; e.position.y = Math.sin(t * 2.4) * 0.05; e.rotation.z = Math.sin(t * 1.6) * 0.1; e.rotation.y = Math.sin(t * 0.7) * 0.4; } };
    },
    // Brisa: carroza de cristal facetado rosa con aros dorados y ruedas.
    avunicornio(part, toon) {
      const g = new THREE.Group(), c = new THREE.Group();
      c.add(part(new THREE.IcosahedronGeometry(0.25, 1), '#ffc2dc', { ol: 0.04, mat: toon({ color: '#ffc2dc', transparent: true, opacity: 0.75 }) }));
      for (const a of [0, Math.PI / 2]) c.add(part(new THREE.TorusGeometry(0.255, 0.016, 6, 36), '#ffc83d', { ry: a, ol: 0.2 }));
      const wheels = [[-0.16, 0.2], [0.16, 0.2], [-0.16, -0.2], [0.16, -0.2]].map(([x, z]) => { const w = part(new THREE.TorusGeometry(0.08, 0.02, 6, 16).rotateY(Math.PI / 2), '#ffc83d', { x, y: -0.24, z: z * 0.6, ol: 0.2 }); c.add(w); return w; });
      c.add(part(new THREE.OctahedronGeometry(0.06), '#fff6c8', { y: 0.32, ol: 0.15 }));
      c.rotation.y = -0.5; g.add(c);
      return { obj: g, tick: (t) => { c.position.y = Math.sin(t * 1.9) * 0.05 + 0.04; wheels.forEach((w) => (w.rotation.x = t * 4)); c.rotation.z = Math.sin(t * 1.3) * 0.06; } };
    },
    // Kage: nube de humo gris con una estrella ninja que gira al frente.
    avninja(part) {
      const g = new THREE.Group(), n = new THREE.Group();
      const puffs = [[0, 0, 0.2], [-0.2, -0.05, 0.15], [0.2, -0.04, 0.16], [-0.1, 0.13, 0.13], [0.12, 0.12, 0.14], [0, -0.12, 0.14]].map(([x, y, r]) => { const p = part(new THREE.SphereGeometry(r, 16, 12), '#b9b4d0', { x, y, ol: 0.06 }); n.add(p); return p; });
      const sh = new THREE.Group();
      const st = []; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, r = i % 2 ? 0.04 : 0.14; st.push([Math.cos(a) * r, Math.sin(a) * r]); }
      sh.add(part(extrude(st, 0.02, 0.008), '#d9dde8', { ol: 0.12 }));
      sh.add(part(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 10).rotateX(Math.PI / 2), '#2a2a40', { ol: 0 }));
      sh.position.set(0.05, 0, 0.28); n.add(sh);
      g.add(n);
      return { obj: g, tick: (t) => { sh.rotation.z = -t * 6; puffs.forEach((p, k) => p.scale.setScalar(1 + Math.sin(t * 2.5 + k * 1.3) * 0.08)); n.position.y = Math.sin(t * 1.7) * 0.04; } };
    },
    // Voltio: esfera eléctrica (pedido del usuario: "como pokebola, sin serlo"). Mitad de arriba amarilla con rayos,
    // la de abajo crema, banda azul con botón que brilla; de vez en cuando se abre con un chispazo.
    avvoltio(part) {
      const g = new THREE.Group(), b = new THREE.Group(), R = 0.28;
      const lid = new THREE.Group();
      lid.add(part(new THREE.SphereGeometry(R, 28, 14, 0, TAU, 0, Math.PI / 2), '#ffd23d', { ol: 0.05 }));
      for (let k = 0; k < 3; k++) {
        const bolt = [[0.02, 0.07], [-0.04, -0.005], [0.0, -0.005], [-0.02, -0.07], [0.045, 0.012], [0.005, 0.012]];
        const m = part(extrude(bolt, 0.015, 0.005), '#4aa8de', { ol: 0.2 }), a = (k / 3) * TAU + 0.3;
        m.position.set(Math.sin(a) * R * 0.78, R * 0.6, Math.cos(a) * R * 0.78); m.lookAt(Math.sin(a) * 2, R * 1.4, Math.cos(a) * 2); lid.add(m);
      }
      // Bisagra en la orilla de atrás: la tapa gira desde ahí.
      const hinge = new THREE.Group(); hinge.position.set(0, 0.012, -R); lid.position.z = R; hinge.add(lid); b.add(hinge);
      b.add(part(new THREE.SphereGeometry(R, 28, 14, 0, TAU, Math.PI / 2, Math.PI / 2), '#fff6e6', { y: -0.012, ol: 0.05 }));
      b.add(part(new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.05, 32), '#2f6fc0', { ol: 0 }));
      b.add(part(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 20).rotateX(Math.PI / 2), '#2f6fc0', { z: R, ol: 0.15 }));
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 20).rotateX(Math.PI / 2), glow('#8ff8ff', 1)); btn.position.z = R + 0.03; b.add(btn);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), glow('#fff36b', 0.9)); core.scale.setScalar(0.01); b.add(core);
      const sparks = [0, 1, 2, 3, 4].map(() => { const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.028), glow('#fff36b', 1)); b.add(sp); return sp; });
      b.rotation.x = 0.25; g.add(b);
      return { obj: g, tick: (t) => {
        const open = Math.max(0, Math.sin(t * 0.8) - 0.6) / 0.4; // se abre un ratito en cada vuelta
        hinge.rotation.x = -open * 0.9; core.scale.setScalar(0.01 + open);
        btn.material.opacity = 0.6 + Math.sin(t * 6) * 0.4;
        sparks.forEach((sp, k) => { const p = (t * 1.4 + k / 5) % 1, a = k * 1.25; sp.position.set(Math.cos(a) * (0.3 + p * 0.12), 0.05 + p * 0.25, Math.sin(a) * (0.3 + p * 0.12)); sp.scale.setScalar((1 - p) * (0.4 + open)); });
        b.position.y = Math.sin(t * 2.2) * 0.04; b.rotation.y = t * 0.7;
      } };
    },
    // Tic: reloj de bolsillo dorado; las manecillas corren y la tapa se abre y se cierra.
    avtic(part) {
      const g = new THREE.Group(), w = new THREE.Group();
      w.add(part(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 32).rotateX(Math.PI / 2), '#e8b86a', { ol: 0.06 }));
      w.add(part(new THREE.CylinderGeometry(0.25, 0.25, 0.085, 32).rotateX(Math.PI / 2), '#fffdf7', { ol: 0 }));
      for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; w.add(part(new THREE.BoxGeometry(0.012, k % 3 ? 0.03 : 0.05, 0.01), INK, { x: Math.sin(a) * 0.21, y: Math.cos(a) * 0.21, z: 0.045, rz: -a, ol: 0 })); }
      const hh = part(new THREE.BoxGeometry(0.02, 0.12, 0.01).translate(0, 0.06, 0), INK, { z: 0.05, ol: 0 }), mh = part(new THREE.BoxGeometry(0.014, 0.18, 0.01).translate(0, 0.09, 0), '#e8434f', { z: 0.055, ol: 0 });
      w.add(hh, mh);
      w.add(part(new THREE.TorusGeometry(0.06, 0.02, 8, 16), '#e8b86a', { y: 0.36, ol: 0.2 }));
      w.add(part(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 10), '#e8b86a', { y: 0.31, ol: 0.2 }));
      const lid = new THREE.Group(); lid.position.set(-0.3, 0, 0.045);
      lid.add(part(new THREE.CylinderGeometry(0.3, 0.3, 0.025, 32).rotateX(Math.PI / 2), '#ffc83d', { x: 0.3, ol: 0.06 }));
      w.add(lid);
      g.add(w);
      return { obj: g, tick: (t) => { mh.rotation.z = -t * 2; hh.rotation.z = -t * 0.17; lid.rotation.y = -(0.6 + Math.sin(t * 0.9) * 0.6); w.position.y = Math.sin(t * 2) * 0.04 - 0.03; w.rotation.y = 0.3 + Math.sin(t * 0.7) * 0.3; } };
    },
    // Bruno: escudo plateado con su banda roja y orilla dorada que gira despacio.
    avguardian(part) {
      const g = new THREE.Group(), s = new THREE.Group();
      const pts = [[0, 0.36], [0.28, 0.28], [0.28, 0.04], [0.18, -0.2], [0, -0.36], [-0.18, -0.2], [-0.28, 0.04], [-0.28, 0.28]];
      s.add(part(extrude(pts, 0.06, 0.02), '#d9dde8', { ol: 0.05 }));
      s.add(part(new THREE.BoxGeometry(0.1, 0.6, 0.02), '#e8434f', { y: -0.01, z: 0.045, ol: 0 }));
      s.add(part(new THREE.BoxGeometry(0.5, 0.09, 0.022), '#e8434f', { y: 0.12, z: 0.046, ol: 0 }));
      s.add(part(new THREE.SphereGeometry(0.06, 14, 10), '#ffc83d', { y: 0.12, z: 0.06, ol: 0.15 }));
      g.add(s);
      return { obj: g, tick: (t) => { s.rotation.y = Math.sin(t * 0.8) * 0.8; s.position.y = Math.sin(t * 2) * 0.04; } };
    },
    // Zafiro: bola de cristal azul en su base dorada, con estrellitas que giran adentro.
    avmago(part, toon) {
      const g = new THREE.Group(), b = new THREE.Group();
      b.add(part(new THREE.SphereGeometry(0.27, 24, 16), '#8fd6ff', { y: 0.08, ol: 0.04, mat: toon({ color: '#8fd6ff', transparent: true, opacity: 0.45, depthWrite: false }) }));
      const stars = new THREE.Group(); stars.position.y = 0.08;
      for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; stars.add(part(new THREE.OctahedronGeometry(0.035), '#fff36b', { x: Math.cos(a) * 0.14, y: Math.sin(k * 2) * 0.08, z: Math.sin(a) * 0.14, ol: 0, mat: glow('#fff36b', 1) })); }
      b.add(stars);
      b.add(part(new THREE.CylinderGeometry(0.16, 0.22, 0.1, 20), '#ffc83d', { y: -0.23, ol: 0.07 }));
      b.add(part(new THREE.TorusGeometry(0.17, 0.025, 8, 24).rotateX(Math.PI / 2), '#e8a12a', { y: -0.17, ol: 0.15 }));
      g.add(b);
      return { obj: g, tick: (t) => { stars.rotation.y = t * 1.5; b.position.y = Math.sin(t * 1.8) * 0.04; b.rotation.z = Math.sin(t * 1.2) * 0.06; } };
    },
    // Sir Galleta: caballito de galleta con betún blanco y alitas que galopa por el aire.
    avcaballero(part) {
      const g = new THREE.Group(), h = new THREE.Group(), C = '#e8b06a';
      h.add(part(new THREE.CapsuleGeometry(0.11, 0.26, 6, 14).rotateZ(Math.PI / 2), C, { ol: 0.06 }));
      h.add(part(new THREE.CapsuleGeometry(0.06, 0.16, 6, 12), C, { x: 0.2, y: 0.12, rz: -0.6, ol: 0.08 }));
      h.add(part(new THREE.CapsuleGeometry(0.065, 0.1, 6, 12).rotateZ(Math.PI / 2), C, { x: 0.3, y: 0.2, rz: -0.3, ol: 0.08 }));
      for (let k = 0; k < 4; k++) h.add(part(new THREE.SphereGeometry(0.03, 8, 6), '#fffdf7', { x: 0.14 + k * 0.04, y: 0.2 + k * 0.03, z: -0.02, ol: 0.2 }));
      h.add(part(new THREE.SphereGeometry(0.018, 8, 6), INK, { x: 0.33, y: 0.23, z: 0.05, ol: 0 }));
      const legs = [[0.12, 0.06], [0.12, -0.06], [-0.12, 0.06], [-0.12, -0.06]].map(([x, z]) => { const l = new THREE.Group(); l.add(part(new THREE.CapsuleGeometry(0.035, 0.12, 4, 8), C, { y: -0.08, ol: 0.15 })); l.position.set(x, -0.06, z); h.add(l); return l; });
      for (let k = 0; k < 6; k++) h.add(part(new THREE.SphereGeometry(0.014, 6, 4), k % 2 ? '#e8434f' : '#4aa8de', { x: -0.14 + k * 0.05, y: 0.1, z: 0.07, ol: 0 }));
      const ws = wingPair(part, '#fffdf7', 0.26, 0.1); ws.forEach((w) => { w.position.z = 0; w.rotation.y = Math.PI / 2; h.add(w); });
      h.rotation.y = -0.5; g.add(h);
      return { obj: g, tick: (t) => { legs.forEach((l, k) => (l.rotation.z = Math.sin(t * 8 + (k % 2) * Math.PI) * 0.5)); ws[0].rotation.x = Math.sin(t * 8) * 0.4; ws[1].rotation.x = -Math.sin(t * 8) * 0.4; h.position.y = Math.abs(Math.sin(t * 4)) * 0.06 - 0.03; } };
    },
    // Profe Voltaje: auto del tiempo plateado con puertas de ala abiertas y rastro de fuego.
    avprofe(part) {
      const g = new THREE.Group(), c = new THREE.Group();
      c.add(part(new THREE.BoxGeometry(0.62, 0.12, 0.3), '#c9d6e8', { ol: 0.05 }));
      c.add(part(new THREE.BoxGeometry(0.3, 0.1, 0.26), '#a8bcd6', { x: -0.02, y: 0.1, ol: 0.07 }));
      c.add(part(new THREE.BoxGeometry(0.16, 0.08, 0.27), '#2a3a6a', { x: 0.06, y: 0.1, ol: 0 }));
      for (const z of [-1, 1]) { const d = part(new THREE.BoxGeometry(0.22, 0.015, 0.1), '#c9d6e8', { x: -0.02, y: 0.2, z: z * 0.15, rx: z * 0.9, ol: 0.15 }); c.add(d); }
      const wheels = [[0.2, 0.16], [0.2, -0.16], [-0.2, 0.16], [-0.2, -0.16]].map(([x, z]) => { const w = part(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 16).rotateX(Math.PI / 2), '#2a2a40', { x, y: -0.07, z, ol: 0.1 }); c.add(w); return w; });
      for (const z of [-0.08, 0.08]) c.add(part(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 10).rotateZ(Math.PI / 2), '#ff5f7e', { x: -0.32, y: 0.0, z, ol: 0.2 }));
      const trail = [-0.1, 0.1].map((z) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.4, 10).rotateZ(Math.PI / 2), glow('#ff9c2b', 0.9)); f.position.set(-0.55, -0.1, z); c.add(f); return f; });
      c.rotation.set(0.25, -0.5, 0.05); g.add(c);
      return { obj: g, tick: (t) => { wheels.forEach((w) => (w.rotation.z = -t * 8)); trail.forEach((f, k) => f.scale.set(1 + Math.sin(t * 20 + k) * 0.2, 1, 1)); c.position.y = Math.sin(t * 2.2) * 0.04; } };
    },
    // Turbo: patineta flotante rosa sin llantas, con su brillo abajo.
    avturbo(part) {
      const g = new THREE.Group(), b = new THREE.Group();
      b.add(part(new THREE.CapsuleGeometry(0.1, 0.5, 6, 16).rotateZ(Math.PI / 2).scale(1, 0.25, 1), '#ff5fa8', { ol: 0.07 }));
      b.add(part(new THREE.BoxGeometry(0.5, 0.012, 0.05), '#ffd23d', { y: 0.026, ol: 0 }));
      const pads = [-0.2, 0.2].map((x) => { b.add(part(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16), '#4a4270', { x, y: -0.035, ol: 0.15 })); const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.02, 0.08, 16), glow('#5ff0ff', 0.7)); gl.position.set(x, -0.09, 0); b.add(gl); return gl; });
      b.rotation.set(0.5, -0.4, 0.1); g.add(b);
      return { obj: g, tick: (t) => { b.position.y = Math.sin(t * 2.4) * 0.05; pads.forEach((p, k) => p.scale.set(1, 1 + Math.sin(t * 12 + k) * 0.2, 1)); b.rotation.z = 0.1 + Math.sin(t * 1.5) * 0.08; } };
    },
    // Papaya: auto de carreras naranja con alerones y llantas grandes que giran.
    avpapaya(part) {
      const g = new THREE.Group(), c = new THREE.Group();
      c.add(part(new THREE.CapsuleGeometry(0.07, 0.5, 6, 14).rotateZ(Math.PI / 2).scale(1, 0.75, 1.2), '#ff8a1a', { ol: 0.06 }));
      c.add(part(new THREE.ConeGeometry(0.06, 0.14, 12).rotateZ(-Math.PI / 2), '#ff8a1a', { x: 0.36, y: -0.01, ol: 0.1 }));
      c.add(part(new THREE.BoxGeometry(0.08, 0.02, 0.4), '#2f86c0', { x: 0.36, y: -0.04, ol: 0.15 }));
      c.add(part(new THREE.BoxGeometry(0.1, 0.02, 0.36), '#2f86c0', { x: -0.33, y: 0.12, ol: 0.15 }));
      for (const z of [-0.14, 0.14]) c.add(part(new THREE.BoxGeometry(0.03, 0.12, 0.02), '#2a2a40', { x: -0.33, y: 0.06, z, ol: 0.15 }));
      c.add(part(new THREE.SphereGeometry(0.065, 14, 10), '#ffd23d', { x: -0.02, y: 0.07, ol: 0.15 }));
      const wheels = [[0.2, 0.18], [0.2, -0.18], [-0.22, 0.19], [-0.22, -0.19]].map(([x, z]) => { const w = part(new THREE.CylinderGeometry(x > 0 ? 0.075 : 0.09, x > 0 ? 0.075 : 0.09, 0.08, 16).rotateX(Math.PI / 2), '#2a2a40', { x, y: -0.01, z, ol: 0.1 }); c.add(w); return w; });
      c.rotation.set(0.3, -0.6, 0); g.add(c);
      return { obj: g, tick: (t) => { wheels.forEach((w) => (w.rotation.z = -t * 10)); c.position.y = Math.sin(t * 2.6) * 0.03; c.rotation.z = Math.sin(t * 1.4) * 0.05; } };
    },
    // Cora: carrito de mina de madera con pepitas de oro, volando sobre dos rieles.
    avcora(part) {
      const g = new THREE.Group(), c = new THREE.Group();
      c.add(part(new THREE.CylinderGeometry(0.3, 0.22, 0.24, 4, 1).rotateY(Math.PI / 4).scale(1.2, 1, 0.8), '#a86a3a', { ol: 0.05 }));
      for (const y of [-0.06, 0.06]) c.add(part(new THREE.CylinderGeometry(0.27 - y * 0.3, 0.27 - y * 0.3, 0.025, 4, 1, true).rotateY(Math.PI / 4).scale(1.2, 1, 0.8), '#8a8aa8', { y, ol: 0 }));
      for (const [x, z] of [[-0.06, 0], [0.06, 0.04], [0.0, -0.05], [0.1, -0.03]]) c.add(part(new THREE.DodecahedronGeometry(0.06, 0), '#ffd23d', { x, y: 0.13, z, ol: 0.15 }));
      const wheels = [[0.14, 0.14], [0.14, -0.14], [-0.14, 0.14], [-0.14, -0.14]].map(([x, z]) => { const w = part(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12).rotateX(Math.PI / 2), '#4a4270', { x, y: -0.15, z, ol: 0.15 }); c.add(w); return w; });
      for (const z of [-0.14, 0.14]) c.add(part(new THREE.BoxGeometry(0.6, 0.02, 0.025), '#8a8aa8', { y: -0.21, z, ol: 0.15 }));
      c.rotation.set(0.3, -0.5, 0); g.add(c);
      return { obj: g, tick: (t) => { wheels.forEach((w) => (w.rotation.z = -t * 6)); c.position.y = Math.sin(t * 2) * 0.04; c.rotation.z = Math.sin(t * 3) * 0.04; } };
    },
    // ---------- Segunda tanda (9 nov 2026) ----------
    // Pip: mochila verde con hélice y correas que se mecen.
    avpip(part) {
      const g = new THREE.Group(), b = new THREE.Group();
      b.add(part(new THREE.CapsuleGeometry(0.2, 0.18, 8, 16).scale(1, 1, 0.65), '#5fbf5a', { ol: 0.06 }));
      b.add(part(new THREE.BoxGeometry(0.3, 0.16, 0.06), '#7fd36a', { y: -0.08, z: 0.13, ol: 0.1 }));
      b.add(part(new THREE.BoxGeometry(0.07, 0.05, 0.02), '#ffc83d', { y: -0.04, z: 0.17, ol: 0.2 }));
      const straps = [-0.1, 0.1].map((x) => { const st = part(new THREE.TorusGeometry(0.1, 0.02, 6, 16, Math.PI), '#3f9a46', { x, y: 0.02, z: -0.15, ry: Math.PI / 2, rz: Math.PI / 2, ol: 0.2 }); b.add(st); return st; });
      const prop = propeller(part, '#4aa8de', 0.36); prop.position.y = 0.36; b.add(prop);
      g.add(b);
      return { obj: g, tick: (t) => { prop.rotation.y = t * 13; b.position.y = Math.sin(t * 2) * 0.05 - 0.04; b.rotation.y = Math.sin(t * 0.8) * 0.5; straps.forEach((st, k) => (st.rotation.x = Math.sin(t * 3 + k) * 0.2)); } };
    },
    // Gatobot: gorrito amarillo con hélice roja que gira y gira.
    avgatobot(part) {
      const g = new THREE.Group(), c = new THREE.Group();
      c.add(part(new THREE.SphereGeometry(0.26, 24, 12, 0, TAU, 0, Math.PI / 2), '#ffd23d', { ol: 0.06 }));
      c.add(part(new THREE.CylinderGeometry(0.27, 0.27, 0.05, 28), '#e8434f', { y: 0.02, ol: 0.06 }));
      c.add(part(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8), '#8aa0bf', { y: 0.32, ol: 0.25 }));
      const prop = propeller(part, '#e8434f', 0.5); prop.position.y = 0.42; c.add(prop);
      c.add(part(new THREE.SphereGeometry(0.035, 10, 8), '#ffc83d', { y: 0.42, ol: 0.2 }));
      c.position.y = -0.1; g.add(c);
      return { obj: g, tick: (t) => { prop.rotation.y = t * 18; c.position.y = -0.1 + Math.sin(t * 2.4) * 0.05; c.rotation.z = Math.sin(t * 1.6) * 0.12; } };
    },
    // Esponjita: hamburguesa voladora de pisos que se asoman y aplastan.
    avesponjita(part) {
      const g = new THREE.Group(), h = new THREE.Group();
      const top = part(new THREE.SphereGeometry(0.3, 24, 12, 0, TAU, 0, Math.PI / 2).scale(1, 0.75, 1), '#e8a64a', { y: 0.08, ol: 0.05 });
      for (let k = 0; k < 7; k++) { const a = k * 2.3, r = 0.12 + (k % 3) * 0.05; top.add(part(new THREE.SphereGeometry(0.018, 6, 4).scale(1.4, 0.6, 0.8), '#fff6dc', { x: Math.cos(a) * r, y: Math.sqrt(Math.max(0, 0.09 - r * r)) * 0.75, z: Math.sin(a) * r, ol: 0 })); }
      h.add(top);
      h.add(part(new THREE.CylinderGeometry(0.33, 0.3, 0.04, 20), '#7fd36a', { y: 0.06, ol: 0.08 }));
      h.add(part(new THREE.BoxGeometry(0.5, 0.025, 0.5).rotateY(0.4), '#ffd23d', { y: 0.03, ol: 0.08 }));
      h.add(part(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 20), '#8a4a2a', { y: -0.03, ol: 0.06 }));
      h.add(part(new THREE.CylinderGeometry(0.3, 0.27, 0.1, 20), '#e8a64a', { y: -0.13, ol: 0.06 }));
      h.rotation.x = 0.35; g.add(h);
      return { obj: g, tick: (t) => { const q = Math.sin(t * 3) * 0.04; h.scale.set(1 + q, 1 - q, 1 + q); h.position.y = Math.sin(t * 2) * 0.05; h.rotation.y = t * 0.6; } };
    },
    // Capitán: balsa de troncos con vela blanca y su sol; se mece como en el mar.
    avcapitan(part) {
      const g = new THREE.Group(), r = new THREE.Group();
      for (let k = 0; k < 5; k++) r.add(part(new THREE.CylinderGeometry(0.05, 0.05, 0.56, 10).rotateZ(Math.PI / 2), '#c98a3a', { y: -0.22, z: -0.2 + k * 0.1, ol: 0.1 }));
      r.add(part(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8), '#86481a', { y: 0.08, ol: 0.2 }));
      const sail = new THREE.Group(); sail.position.y = 0.1;
      sail.add(part(new THREE.SphereGeometry(0.24, 16, 10, 0, Math.PI, 0, Math.PI).scale(0.3, 1, 1).rotateY(Math.PI / 2), '#fffdf7', { z: 0.01, ol: 0.05 }));
      sail.add(part(new THREE.SphereGeometry(0.07, 14, 10).scale(1, 1, 0.3), '#ffd23d', { x: 0.04, y: 0.02, ol: 0.15 }));
      r.add(sail);
      r.add(part(new THREE.BoxGeometry(0.14, 0.08, 0.002), '#e8434f', { x: 0.07, y: 0.39, ol: 0.3 }));
      r.rotation.y = -0.6; g.add(r);
      return { obj: g, tick: (t) => { r.rotation.z = Math.sin(t * 1.8) * 0.12; r.rotation.x = Math.sin(t * 1.4 + 1) * 0.08; r.position.y = Math.sin(t * 1.8) * 0.04; sail.scale.z = 1 + Math.sin(t * 2.6) * 0.1; } };
    },
    // Kiko: nube dorada esponjosa, siempre lista para volar.
    avkiko(part) {
      const g = new THREE.Group(), n = new THREE.Group();
      const puffs = [[0, 0, 0.2], [-0.2, -0.03, 0.15], [0.2, -0.02, 0.16], [-0.08, 0.1, 0.14], [0.1, 0.1, 0.13], [-0.34, -0.06, 0.1], [0.36, -0.06, 0.09]].map(([x, y, r]) => { const p = part(new THREE.SphereGeometry(r, 18, 12), '#ffe066', { x, y, ol: 0.06 }); n.add(p); return p; });
      const trail = [0, 1, 2].map((k) => { const p = part(new THREE.SphereGeometry(0.06 - k * 0.015, 10, 8), '#ffe066', { x: -0.48 - k * 0.1, y: -0.08, ol: 0.15 }); n.add(p); return p; });
      n.scale.setScalar(0.85); n.position.x = 0.08; g.add(n);
      return { obj: g, tick: (t) => { n.position.y = Math.sin(t * 2.4) * 0.05; n.rotation.z = Math.sin(t * 1.4) * 0.08; puffs.forEach((p, k) => p.scale.setScalar(1 + Math.sin(t * 3 + k) * 0.05)); trail.forEach((p, k) => (p.position.y = -0.08 + Math.sin(t * 4 - k) * 0.03)); n.rotation.y = Math.sin(t * 0.7) * 0.4; } };
    },
    // Luna Estelar: broche dorado con media luna y alitas blancas.
    avluna(part) {
      const g = new THREE.Group(), b = new THREE.Group();
      b.add(part(new THREE.CylinderGeometry(0.22, 0.22, 0.07, 32).rotateX(Math.PI / 2), '#ffd23d', { ol: 0.06 }));
      b.add(part(new THREE.TorusGeometry(0.13, 0.04, 10, 24, Math.PI * 1.3), '#fff6c8', { z: 0.04, rz: Math.PI * 0.55, ol: 0.15 }));
      b.add(part(new THREE.OctahedronGeometry(0.04), '#ff7ab8', { x: 0.06, y: 0.04, z: 0.05, ol: 0.2 }));
      const ws = [-1, 1].map((sx) => { const w = new THREE.Group(); for (let k = 0; k < 3; k++) w.add(part(new THREE.SphereGeometry(0.08, 10, 6).scale(1.6, 0.5, 0.15), '#fffdf7', { x: sx * (0.1 + k * 0.05), y: 0.05 - k * 0.05, rz: sx * (0.3 - k * 0.25), ol: 0.12 })); w.position.x = sx * 0.2; b.add(w); return w; });
      b.add(part(new THREE.ConeGeometry(0.05, 0.12, 8).rotateZ(Math.PI), '#ff7ab8', { y: -0.26, ol: 0.15 }));
      g.add(b);
      return { obj: g, tick: (t) => { ws[0].rotation.y = Math.sin(t * 7) * 0.5; ws[1].rotation.y = -Math.sin(t * 7) * 0.5; b.position.y = Math.sin(t * 2) * 0.05; b.rotation.y = Math.sin(t * 0.8) * 0.4; } };
    },
    // Estrella Pop: micrófono que flota con su rejilla y un halo de luz.
    avestrellapop(part) {
      const g = new THREE.Group(), m = new THREE.Group();
      m.add(part(new THREE.SphereGeometry(0.15, 20, 14), '#d9dde8', { y: 0.2, ol: 0.07 }));
      m.add(part(new THREE.TorusGeometry(0.15, 0.025, 8, 24).rotateX(Math.PI / 2), '#e86ac8', { y: 0.12, ol: 0.15 }));
      m.add(part(new THREE.CylinderGeometry(0.06, 0.045, 0.4, 14), '#4a4270', { y: -0.1, ol: 0.1 }));
      m.add(part(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 14), '#e86ac8', { y: 0.05, ol: 0.15 }));
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.015, 6, 36).rotateX(Math.PI / 2), glow('#ffd23d', 0.9)); halo.position.y = 0.2; m.add(halo);
      m.rotation.z = -0.35; g.add(m);
      return { obj: g, tick: (t) => { halo.rotation.z = t * 2; halo.scale.setScalar(1 + Math.sin(t * 4) * 0.08); m.position.y = Math.sin(t * 2.2) * 0.05; m.rotation.y = t * 0.8; } };
    },
    // Rocky: guitarra eléctrica roja que vuela; sus cuerdas vibran.
    avrocky(part) {
      const g = new THREE.Group(), gt = new THREE.Group();
      gt.add(part(extrude([[-0.16, -0.05], [-0.1, -0.2], [0.08, -0.22], [0.16, -0.1], [0.12, 0.02], [0.17, 0.12], [0.06, 0.08], [-0.06, 0.12], [-0.17, 0.06]], 0.06, 0.015), '#e8434f', { y: -0.12, ol: 0.06 }));
      gt.add(part(new THREE.BoxGeometry(0.06, 0.42, 0.04), '#8a4a2a', { y: 0.2, ol: 0.1 }));
      gt.add(part(new THREE.BoxGeometry(0.1, 0.1, 0.04), '#2a2a40', { y: 0.45, ol: 0.15 }));
      gt.add(part(new THREE.BoxGeometry(0.12, 0.05, 0.02), '#fffdf7', { y: -0.13, z: 0.05, ol: 0.1 }));
      const strings = new THREE.Group(); for (const x of [-0.015, 0, 0.015]) strings.add(part(new THREE.CylinderGeometry(0.003, 0.003, 0.62, 4), '#fff6c8', { x, y: 0.12, z: 0.04, ol: 0 })); gt.add(strings);
      gt.rotation.set(0.1, -0.3, -0.6); g.add(gt);
      return { obj: g, tick: (t) => { strings.position.x = Math.sin(t * 60) * 0.003; gt.position.y = Math.sin(t * 2.4) * 0.05; gt.rotation.z = -0.6 + Math.sin(t * 1.5) * 0.12; } };
    },
    // Mina: varita de luz con corazón que brilla y cambia de color.
    avmina(part) {
      const g = new THREE.Group(), v = new THREE.Group();
      v.add(part(new THREE.CylinderGeometry(0.045, 0.05, 0.42, 14), '#fffdf7', { y: -0.18, ol: 0.1 }));
      v.add(part(new THREE.TorusGeometry(0.05, 0.015, 6, 14).rotateX(Math.PI / 2), '#b48cff', { y: -0.1, ol: 0.2 }));
      v.add(part(new THREE.SphereGeometry(0.17, 22, 16), '#ffd6f0', { y: 0.16, ol: 0.06 }));
      const hs = new THREE.Shape(); hs.moveTo(0, -0.07); hs.bezierCurveTo(-0.12, 0.02, -0.06, 0.1, 0, 0.04); hs.bezierCurveTo(0.06, 0.1, 0.12, 0.02, 0, -0.07);
      const heart = part(new THREE.ExtrudeGeometry(hs, { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012 }), '#ff5f9e', { y: 0.16, z: 0.13, ol: 0.15 });
      v.add(heart);
      const glowB = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), glow('#ff9cc8', 0.25)); glowB.position.y = 0.16; v.add(glowB);
      v.rotation.z = -0.3; g.add(v);
      return { obj: g, tick: (t) => { glowB.scale.setScalar(1 + Math.sin(t * 5) * 0.12); glowB.material.color.setHSL(((t * 0.08) % 1), 0.8, 0.75); v.position.y = Math.sin(t * 2.2) * 0.05; v.rotation.y = Math.sin(t * 1.4) * 0.6; } };
    },
    // MC Beat: bocina grande con sus dos altavoces que retumban al ritmo.
    avmcbeat(part) {
      const g = new THREE.Group(), b = new THREE.Group();
      b.add(part(new THREE.BoxGeometry(0.62, 0.32, 0.18), '#2a2a40', { ol: 0.05 }));
      b.add(part(new THREE.TorusGeometry(0.17, 0.022, 8, 20, Math.PI), '#8aa0bf', { y: 0.16, ol: 0.15 }));
      const cones = [-0.17, 0.17].map((x) => { b.add(part(new THREE.TorusGeometry(0.1, 0.02, 8, 20), '#2fb6a0', { x, z: 0.09, ol: 0.15 })); const c = part(new THREE.CylinderGeometry(0.035, 0.09, 0.04, 18).rotateX(Math.PI / 2), '#4a4a6a', { x, z: 0.09, ol: 0 }); b.add(c); return c; });
      b.add(part(new THREE.BoxGeometry(0.1, 0.06, 0.02), '#2fb6a0', { y: 0.06, z: 0.1, ol: 0.1 }));
      b.rotation.y = -0.4; g.add(b);
      return { obj: g, tick: (t) => { const beat = Math.pow(Math.max(0, Math.sin(t * 6)), 6); cones.forEach((c) => (c.scale.z = 1 + beat * 0.8)); b.scale.setScalar(1 + beat * 0.04); b.position.y = Math.sin(t * 2) * 0.04; } };
    },
  };
}
