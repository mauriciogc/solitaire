// Viajeros 3D (tienda): lo que recorre el mapa en lugar del marcador del avatar.
// Mismo estilo que los planetas: material toon con contorno de tinta. Miden ~1 de alto, centrados en el origen.
import * as THREE from 'three';
import { INK } from './art.js';

const TAU = Math.PI * 2;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let grad = null;
export function toonMaker() {
  if (!grad) {
    grad = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
    grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
  }
  return (o) => new THREE.MeshToonMaterial({ gradientMap: grad, ...o });
}

// Pieza con contorno: la misma forma un poco más grande, de tinta y por dentro.
function kit(toon) {
  const ink = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  return (geo, color, { ol = 0.08, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, mat } = {}) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, mat || toon({ color })));
    if (ol) { const o = new THREE.Mesh(geo, ink); o.scale.setScalar(1 + ol); g.add(o); }
    g.position.set(x, y, z); g.rotation.set(rx, ry, rz);
    return g;
  };
}
const glow = (color, opacity = 0.85) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });

const MODELS = {
  // Cohete: cuerpo crema, punta y aletas rojas, ventanita y llama que parpadea.
  cohete(part) {
    const g = new THREE.Group(), body = new THREE.Group();
    const prof = [[0, -0.36], [0.2, -0.34], [0.25, -0.1], [0.24, 0.12], [0.17, 0.3], [0, 0.44]].map(([x, y]) => new THREE.Vector2(x, y));
    body.add(part(new THREE.LatheGeometry(prof, 20), '#fff6e6', { ol: 0.07 }));
    body.add(part(new THREE.ConeGeometry(0.17, 0.2, 20), '#ff5f7e', { y: 0.38, ol: 0.1 }));
    body.add(part(new THREE.SphereGeometry(0.09, 16, 12), '#5fc7e8', { y: 0.08, z: 0.21, ol: 0.25 }));
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * TAU, f = new THREE.Group();
      f.add(part(new THREE.BoxGeometry(0.035, 0.22, 0.16), '#ff5f7e', { y: -0.26, z: 0.25, rx: 0.25, ol: 0.18 }));
      f.rotation.y = a + 0.5; body.add(f);
    }
    const flame = new THREE.Group();
    const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 14), glow('#ff9c2b', 0.95)); f1.rotation.x = Math.PI; f1.position.y = -0.5;
    const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 12), glow('#fff4c7', 1)); f2.rotation.x = Math.PI; f2.position.y = -0.45;
    flame.add(f1, f2); body.add(flame);
    body.rotation.z = -0.25;
    g.add(body);
    return { obj: g, tick: (t) => { const k = 1 + Math.sin(t * 31) * 0.12 + Math.sin(t * 17) * 0.08; flame.scale.set(1, k, 1); body.rotation.y = Math.sin(t * 0.9) * 0.5; body.position.y = Math.sin(t * 2.2) * 0.04; } };
  },
  // Ovni: platillo lila con cúpula, luces que se encienden en ronda y un rayo suave abajo.
  ovni(part, toon) {
    const g = new THREE.Group(), ship = new THREE.Group();
    ship.add(part(new THREE.SphereGeometry(0.42, 28, 14).scale(1, 0.28, 1), '#b9b1dc', { ol: 0.06 }));
    ship.add(part(new THREE.SphereGeometry(0.2, 20, 14, 0, TAU, 0, Math.PI / 2), '#8fe8ff', { y: 0.06, ol: 0.1 }));
    ship.add(part(new THREE.CylinderGeometry(0.16, 0.2, 0.06, 20), '#8f88c0', { y: -0.1, ol: 0.12 }));
    const lights = [];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU, m = toon({ color: '#ffc83d', emissive: '#000000' });
      const l = part(new THREE.SphereGeometry(0.035, 10, 8), null, { x: Math.cos(a) * 0.36, z: Math.sin(a) * 0.36, ol: 0.3, mat: m });
      ship.add(l); lights.push(m);
    }
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.42, 20, 1, true), glow('#fff4c7', 0.28));
    beam.position.y = -0.33; ship.add(beam);
    ship.rotation.x = 0.28;
    g.add(ship);
    const on = new THREE.Color('#fff4c7'), off = new THREE.Color('#ff7ab8');
    return { obj: g, tick: (t) => { ship.rotation.y = t * 1.6; ship.position.y = Math.sin(t * 2) * 0.05; lights.forEach((m, k) => m.color.copy((Math.floor(t * 6) + k) % 4 === 0 ? on : off)); beam.material.opacity = 0.2 + Math.sin(t * 4) * 0.08; } };
  },
  // Cometa: núcleo de hielo y una cola de bolitas que se va haciendo chica y titila.
  cometa(part) {
    const g = new THREE.Group(), all = new THREE.Group();
    all.add(part(new THREE.IcosahedronGeometry(0.22, 1), '#d8f0ff', { ol: 0.1 }));
    all.add(part(new THREE.IcosahedronGeometry(0.1, 0), '#ffffff', { x: -0.06, y: 0.08, z: 0.14, ol: 0 }));
    const tail = [];
    for (let k = 0; k < 7; k++) {
      const r = 0.16 * (1 - k / 8);
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), glow(k % 2 ? '#8fe8ff' : '#d8f0ff', 0.9 - k * 0.1));
      m.position.set(0.18 + k * 0.1, 0.1 + k * 0.05, -0.04 * k);
      all.add(m); tail.push(m);
    }
    all.rotation.z = 0.15;
    g.add(all);
    return { obj: g, tick: (t) => { tail.forEach((m, k) => { m.scale.setScalar(1 + Math.sin(t * 6 - k) * 0.18); m.position.y = 0.1 + k * 0.05 + Math.sin(t * 3 - k * 0.8) * 0.02 * k; }); all.position.y = Math.sin(t * 2) * 0.04; } };
  },
  // Meteorito: roca con cráteres que rueda, envuelta en una estela de fuego.
  meteorito(part) {
    const g = new THREE.Group();
    const geo = new THREE.IcosahedronGeometry(0.26, 2), pos = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const n = 1 + Math.sin(v.x * 17) * 0.05 + Math.sin(v.y * 13 + 1) * 0.06 + Math.cos(v.z * 11) * 0.05; v.multiplyScalar(n); pos.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals();
    const rock = part(geo, '#9a7b6a', { ol: 0.07 });
    [[0.12, 0.14, 0.18], [-0.16, 0.02, 0.18], [0.02, -0.16, 0.2]].forEach(([x, y, z]) => rock.add(part(new THREE.SphereGeometry(0.055, 10, 8).scale(1, 1, 0.4), '#6e5446', { x, y, z, ol: 0 })));
    rock.children.slice(2).forEach((c) => c.lookAt(c.position.clone().multiplyScalar(2)));
    const fire = new THREE.Group(), flames = [];
    [['#ff6a3d', 0.24, 0.85], ['#ff9c2b', 0.18, 0.68], ['#ffd85a', 0.11, 0.5]].forEach(([c, r, h], k) => {
      // La punta de la llama apunta hacia atrás y arriba (de donde viene).
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 16).translate(0, h / 2, 0), glow(c, 0.9)); m.rotation.z = -Math.PI / 2 + 0.5; m.position.set(0.04 + k * 0.02, 0.02 + k * 0.01, -0.06 + k * 0.03); fire.add(m); flames.push(m);
    });
    g.add(fire, rock);
    return { obj: g, tick: (t) => { rock.rotation.x = t * 1.4; rock.rotation.y = t * 0.8; flames.forEach((m, k) => m.scale.set(1 + Math.sin(t * 20 + k * 2) * 0.1, 1 + Math.sin(t * 25 + k) * 0.15, 1)); g.position.y = Math.sin(t * 2.4) * 0.04; } };
  },
  // Ajolote: rosa, con branquias que se mueven y cola que nada.
  ajolote(part) {
    const g = new THREE.Group(), swim = new THREE.Group();
    swim.add(part(new THREE.CapsuleGeometry(0.15, 0.32, 8, 16).rotateZ(Math.PI / 2), '#ffc2dc', { x: 0.1, ol: 0.07 }));
    swim.add(part(new THREE.SphereGeometry(0.22, 20, 16).scale(1, 0.85, 0.95), '#ffc2dc', { x: -0.24, y: 0.06, ol: 0.07 }));
    const tail = new THREE.Group();
    tail.add(part(new THREE.SphereGeometry(0.2, 16, 10).scale(1.2, 0.7, 0.18), '#ffb3d1', { x: 0.2, ol: 0.1 }));
    tail.position.x = 0.32; swim.add(tail);
    const gills = [];
    for (const side of [-1, 1]) for (let k = 0; k < 3; k++) {
      const gl = new THREE.Group();
      gl.add(part(new THREE.CapsuleGeometry(0.032, 0.16, 4, 8), '#ff4f8b', { y: 0.1, ol: 0.25 }));
      gl.position.set(-0.16, 0.12 + (1 - k) * 0.04, side * 0.15); gl.rotation.set(side * (0.6 + k * 0.45), 0, -0.5);
      swim.add(gl); gills.push(gl);
    }
    for (const z of [-0.1, 0.1]) swim.add(part(new THREE.SphereGeometry(0.04, 10, 8), '#2a1f5c', { x: -0.42, y: 0.12, z, ol: 0 }));
    swim.add(part(new THREE.TorusGeometry(0.06, 0.012, 6, 16, Math.PI).rotateY(Math.PI / 2).rotateX(Math.PI), '#2a1f5c', { x: -0.45, y: 0.03, ol: 0 }));
    for (const [x, z] of [[-0.12, 0.16], [0.18, 0.16], [-0.12, -0.16], [0.18, -0.16]]) swim.add(part(new THREE.CapsuleGeometry(0.035, 0.08, 4, 8), '#ffb3d1', { x, y: -0.15, z, rx: z > 0 ? 0.6 : -0.6, ol: 0.2 }));
    swim.rotation.y = 0.9;
    g.add(swim);
    return { obj: g, tick: (t) => { tail.rotation.y = Math.sin(t * 5) * 0.5; gills.forEach((q, k) => (q.scale.y = 1 + Math.sin(t * 4 + k) * 0.15)); swim.position.y = Math.sin(t * 2.2) * 0.05; swim.rotation.z = Math.sin(t * 2.2 + 1) * 0.12; } };
  },
  // Ballena: azul con panza crema, aletas y un chorro de estrellitas.
  ballena(part) {
    const g = new THREE.Group(), whale = new THREE.Group();
    const geo = new THREE.SphereGeometry(0.3, 24, 18).scale(1.35, 0.85, 0.85);
    whale.add(part(geo, '#4aa8de', { ol: 0.06 }));
    whale.add(part(new THREE.SphereGeometry(0.24, 20, 14).scale(1.3, 0.6, 0.8), '#fff6e6', { y: -0.1, x: -0.03, ol: 0 }));
    const tail = new THREE.Group();
    tail.add(part(new THREE.ConeGeometry(0.1, 0.3, 12).rotateZ(Math.PI / 2), '#4aa8de', { x: 0.12, ol: 0.1 }));
    tail.add(part(new THREE.SphereGeometry(0.16, 14, 10).scale(0.5, 0.25, 1.3), '#3d95cc', { x: 0.28, y: 0.05, ol: 0.12 }));
    tail.position.x = 0.36; whale.add(tail);
    for (const z of [-1, 1]) whale.add(part(new THREE.SphereGeometry(0.1, 12, 8).scale(1.4, 0.3, 0.8), '#3d95cc', { x: -0.1, y: -0.12, z: z * 0.24, rx: z * 0.5, ol: 0.15 }));
    for (const z of [-0.2, 0.2]) whale.add(part(new THREE.SphereGeometry(0.038, 10, 8), '#2a1f5c', { x: -0.27, y: 0.03, z, ol: 0 }));
    const spout = [];
    for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), glow(k % 2 ? '#ffc83d' : '#d8f0ff', 1)); whale.add(s); spout.push(s); }
    whale.rotation.y = -0.55;
    g.add(whale);
    return { obj: g, tick: (t) => {
      tail.rotation.z = Math.sin(t * 2.6) * 0.35; whale.position.y = Math.sin(t * 1.6) * 0.05; whale.rotation.z = Math.sin(t * 1.6 + 1) * 0.08;
      spout.forEach((s, k) => { const p = (t * 0.9 + k / 5) % 1, a = (k - 2) * 0.5; s.position.set(-0.12 + Math.sin(a) * p * 0.15, 0.24 + p * 0.3, Math.cos(a) * p * 0.06); s.scale.setScalar(Math.sin(p * Math.PI) * 1.2 + 0.01); s.rotation.y = t * 3; });
    } };
  },
  // Globo aerostático: gajos de colores, canasta de mimbre y cuerdas. Se mece colgado.
  globo(part, toon) {
    const g = new THREE.Group(), sway = new THREE.Group();
    const cols = ['#ff5f7e', '#ffc83d', '#4aa8de', '#fff6e6'];
    const ink = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18).scale(1, 1.12, 1), new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
    ink.scale.setScalar(1.06); ink.position.y = 0.14; sway.add(ink);
    for (let k = 0; k < 8; k++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 18, (k / 8) * TAU, TAU / 8).scale(1, 1.12, 1), toon({ color: cols[k % 4] }));
      m.position.y = 0.14; sway.add(m);
    }
    sway.add(part(new THREE.CylinderGeometry(0.1, 0.08, 0.1, 14), '#b8865a', { y: -0.36, ol: 0.15 }));
    sway.add(part(new THREE.TorusGeometry(0.1, 0.018, 6, 16).rotateX(Math.PI / 2), '#8a5a3a', { y: -0.31, ol: 0 }));
    for (const [x, z] of [[0.08, 0.06], [-0.08, 0.06], [0.08, -0.06], [-0.08, -0.06]]) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 4), new THREE.MeshBasicMaterial({ color: INK }));
      r.position.set(x * 1.3, -0.22, z * 1.3); r.rotation.set(-z * 1.2, 0, x * 1.2); sway.add(r);
    }
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 10), glow('#ff9c2b', 0.95)); fire.position.y = -0.26; sway.add(fire);
    g.add(sway);
    return { obj: g, tick: (t) => { sway.rotation.z = Math.sin(t * 1.4) * 0.12; sway.rotation.y = t * 0.4; sway.position.y = Math.sin(t * 1.1) * 0.05; fire.scale.y = 1 + Math.sin(t * 23) * 0.3; } };
  },
  // Medusa: sombrero rosa que late y tentáculos que ondulan.
  medusa(part) {
    const g = new THREE.Group(), body = new THREE.Group();
    const bell = part(new THREE.SphereGeometry(0.28, 24, 14, 0, TAU, 0, Math.PI / 2).scale(1, 0.85, 1), '#ff9cc8', { y: 0.06, ol: 0.07 });
    body.add(bell);
    body.add(part(new THREE.TorusGeometry(0.26, 0.04, 8, 24).rotateX(Math.PI / 2), '#ff7ab8', { y: 0.06, ol: 0.12 }));
    for (const x of [-0.09, 0.09]) body.add(part(new THREE.SphereGeometry(0.035, 10, 8), INK, { x, y: 0.16, z: 0.22, ol: 0 }));
    body.add(part(new THREE.SphereGeometry(0.06, 10, 8).scale(1, 0.4, 0.4), '#ff5f9e', { x: -0.17, y: 0.11, z: 0.18, ol: 0 }));
    body.add(part(new THREE.SphereGeometry(0.06, 10, 8).scale(1, 0.4, 0.4), '#ff5f9e', { x: 0.17, y: 0.11, z: 0.18, ol: 0 }));
    const tents = [];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU, chain = [];
      let parent = body;
      for (let j = 0; j < 4; j++) {
        const seg = part(new THREE.CapsuleGeometry(0.03 - j * 0.005, 0.08, 4, 8), k % 2 ? '#c9a6ff' : '#ffc2dc', { ol: 0.2 });
        seg.position.set(j ? 0 : Math.cos(a) * 0.17, j ? -0.1 : 0.02, j ? 0 : Math.sin(a) * 0.17);
        parent.add(seg); chain.push(seg); parent = seg;
      }
      tents.push(chain);
    }
    g.add(body);
    return { obj: g, tick: (t) => {
      const p = Math.sin(t * 3);
      bell.scale.set(1 + p * 0.06, 1 - p * 0.08, 1 + p * 0.06);
      tents.forEach((c, k) => c.forEach((s, j) => (s.rotation.z = Math.sin(t * 3 - j * 0.9 + k) * 0.35)));
      body.position.y = 0.08 + Math.sin(t * 1.5) * 0.06; body.rotation.y = t * 0.3;
    } };
  },
  // ---------- Exclusivos de la colección ----------
  // Tortuga marina: caparazón con placas, cabeza y aletas que reman.
  tortuga(part) {
    const g = new THREE.Group(), body = new THREE.Group();
    body.add(part(new THREE.SphereGeometry(0.3, 24, 14, 0, TAU, 0, Math.PI / 2).scale(1, 0.7, 1.15), '#4fae6a', { ol: 0.06 }));
    for (const [x, z, r] of [[0, 0, 0.1], [0.14, 0.12, 0.07], [-0.14, 0.12, 0.07], [0.14, -0.13, 0.07], [-0.14, -0.13, 0.07]])
      body.add(part(new THREE.SphereGeometry(r, 12, 8).scale(1, 0.35, 1), '#8fd46a', { x, z, y: Math.sqrt(Math.max(0, 0.06 - x * x * 0.5 - z * z * 0.4)) + 0.04, ol: 0.15 }));
    body.add(part(new THREE.CylinderGeometry(0.31, 0.33, 0.06, 24).scale(1, 1, 1.15), '#f0d79a', { y: -0.01, ol: 0.08 }));
    const head = part(new THREE.SphereGeometry(0.12, 16, 12), '#9be08a', { z: 0.38, y: 0.04, ol: 0.1 });
    for (const x of [-0.05, 0.05]) head.add(part(new THREE.SphereGeometry(0.022, 8, 6), INK, { x, y: 0.04, z: 0.1, ol: 0 }));
    body.add(head);
    const fins = [];
    for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const f = new THREE.Group();
      f.add(part(new THREE.SphereGeometry(0.12, 12, 8).scale(1.4, 0.25, 0.6), '#9be08a', { x: x * 0.12, ol: 0.12 }));
      f.position.set(x * 0.28, -0.02, z * 0.2); body.add(f); fins.push([f, x, z]);
    }
    body.rotation.x = 0.35; g.add(body);
    return { obj: g, tick: (t) => {
      fins.forEach(([f, x, z]) => (f.rotation.z = x * Math.sin(t * 3 + (z > 0 ? 0 : 1.2)) * 0.45));
      head.position.y = 0.04 + Math.sin(t * 1.5) * 0.02;
      body.position.y = Math.sin(t * 1.4) * 0.06; body.rotation.y = Math.sin(t * 0.6) * 0.5;
    } };
  },
  // Cristal: una gema grande que gira y tres chiquitas en órbita.
  cristal(part) {
    const g = new THREE.Group(), gem = new THREE.Group();
    gem.add(part(new THREE.OctahedronGeometry(0.3, 0).scale(1, 1.35, 1), '#7fe0ff', { ol: 0.07, mat: new THREE.MeshToonMaterial({ color: '#7fe0ff', flatShading: true }) }));
    gem.add(part(new THREE.OctahedronGeometry(0.1, 0).scale(1, 1.3, 1), '#ffffff', { x: -0.08, y: 0.12, z: 0.12, ol: 0 }));
    g.add(gem);
    const orb = new THREE.Group(), cols = ['#ff7ab8', '#b36bff', '#ffc83d'];
    cols.forEach((c, k) => {
      const a = (k / 3) * TAU;
      orb.add(part(new THREE.OctahedronGeometry(0.07, 0), c, { x: Math.cos(a) * 0.45, z: Math.sin(a) * 0.45, ol: 0.15, mat: new THREE.MeshToonMaterial({ color: c, flatShading: true }) }));
    });
    orb.rotation.x = 0.35; g.add(orb);
    return { obj: g, tick: (t) => { gem.rotation.y = t * 1.2; gem.position.y = Math.sin(t * 2) * 0.05; orb.rotation.y = -t * 1.6; } };
  },
  // Hoja viajera: una hoja grande que se mece como al caer, con una mariquita encima.
  hoja(part) {
    const g = new THREE.Group(), leaf = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.45); shape.quadraticCurveTo(0.42, -0.05, 0, 0.45); shape.quadraticCurveTo(-0.42, -0.05, 0, -0.45);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false }).rotateX(-Math.PI / 2);
    leaf.add(part(geo, '#8fd46a', { ol: 0.05 }));
    leaf.add(part(new THREE.CylinderGeometry(0.012, 0.012, 0.85, 6).rotateX(Math.PI / 2), '#4f9a3a', { y: 0.035, ol: 0 }));
    const bug = new THREE.Group();
    bug.add(part(new THREE.SphereGeometry(0.1, 16, 10, 0, TAU, 0, Math.PI / 2), '#ff5f7e', { ol: 0.12 }));
    for (const [x, z] of [[0.05, 0.02], [-0.05, 0.02], [0.03, -0.05], [-0.03, -0.05]]) bug.add(part(new THREE.SphereGeometry(0.018, 8, 6), INK, { x, y: 0.075, z, ol: 0 }));
    bug.add(part(new THREE.SphereGeometry(0.05, 12, 8), INK, { z: 0.1, y: 0.02, ol: 0 }));
    bug.position.set(0, 0.04, 0.05); leaf.add(bug);
    leaf.rotation.x = 1.05; g.add(leaf);
    return { obj: g, tick: (t) => { leaf.rotation.z = Math.sin(t * 1.6) * 0.35; leaf.position.x = Math.sin(t * 1.6) * 0.08; leaf.position.y = Math.sin(t * 3.2) * 0.04; leaf.rotation.y = t * 0.3; bug.rotation.y = Math.sin(t * 2) * 0.4; } };
  },
  // Paleta: disco de anillos de colores que da vueltas sobre su palito.
  paleta(part) {
    const g = new THREE.Group(), pop = new THREE.Group();
    pop.add(part(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), '#fff6e6', { y: -0.4, ol: 0.2 }));
    const disc = new THREE.Group();
    ['#ff5f7e', '#fff6e6', '#ff9cc8', '#fff6e6', '#ff5f7e'].forEach((c, k) => {
      const r = 0.32 - k * 0.065;
      disc.add(part(new THREE.CylinderGeometry(r, r, 0.08 + k * 0.004, 28).rotateX(Math.PI / 2), c, { ol: k ? 0 : 0.05 }));
    });
    disc.add(part(new THREE.SphereGeometry(0.05, 10, 8), '#ffffff', { x: -0.14, y: 0.14, z: 0.05, ol: 0 }));
    disc.position.y = 0.05; pop.add(disc); g.add(pop);
    return { obj: g, tick: (t) => { pop.rotation.y = t * 1.4; disc.rotation.z = -t * 2; pop.position.y = Math.sin(t * 2) * 0.05; pop.rotation.z = Math.sin(t * 1.3) * 0.12; } };
  },
  // Pterodáctilo (Valle de los dinosaurios): cuerpo naranja, pico largo, cresta roja y alas de piel que aletean.
  ptero(part) {
    const g = new THREE.Group(), bird = new THREE.Group();
    bird.add(part(new THREE.CapsuleGeometry(0.1, 0.26, 6, 12).rotateX(Math.PI / 2), '#ff9c5b', { ol: 0.08 }));
    bird.add(part(new THREE.SphereGeometry(0.08, 12, 8).scale(1, 0.8, 1.6), '#ffd2a8', { y: -0.05, z: 0.04, ol: 0 }));
    bird.add(part(new THREE.ConeGeometry(0.05, 0.3, 8).rotateX(-Math.PI / 2), '#ff9c5b', { z: -0.3, ol: 0.12 }));
    const head = new THREE.Group();
    head.add(part(new THREE.SphereGeometry(0.11, 16, 12), '#ff9c5b', { ol: 0.1 }));
    head.add(part(new THREE.ConeGeometry(0.05, 0.3, 10).rotateX(Math.PI / 2), '#ffd23d', { z: 0.2, y: -0.02, ol: 0.12 }));
    head.add(part(new THREE.ConeGeometry(0.045, 0.24, 8).rotateX(-1.05), '#e8434f', { y: 0.1, z: -0.1, ol: 0.12 }));
    for (const x of [-0.065, 0.065]) {
      head.add(part(new THREE.SphereGeometry(0.026, 10, 8), INK, { x, y: 0.035, z: 0.075, ol: 0 }));
      head.add(part(new THREE.SphereGeometry(0.009, 6, 4), '#ffffff', { x: x - 0.006, y: 0.045, z: 0.1, ol: 0 }));
    }
    head.position.set(0, 0.08, 0.27);
    bird.add(head);
    const wings = [];
    for (const sx of [-1, 1]) {
      const sh = new THREE.Shape();
      sh.moveTo(0, -0.1); sh.lineTo(sx * 0.62, 0.02); sh.quadraticCurveTo(sx * 0.3, 0.06, sx * 0.18, 0.2); sh.quadraticCurveTo(sx * 0.08, 0.1, 0, 0.14);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false }).rotateX(-Math.PI / 2);
      const w = new THREE.Group();
      w.add(part(geo, '#ffc08a', { ol: 0.04 }));
      w.position.set(sx * 0.07, 0.02, 0.02); bird.add(w); wings.push([w, sx]);
    }
    bird.rotation.set(0.45, -0.5, 0);
    g.add(bird);
    return { obj: g, tick: (t) => {
      const f = Math.sin(t * 5);
      wings.forEach(([w, sx]) => (w.rotation.z = sx * f * 0.5));
      bird.position.y = Math.sin(t * 2.5) * 0.05 - f * 0.03;
      head.rotation.y = Math.sin(t * 1.1) * 0.3;
    } };
  },
  // Robot volador (Taller de robots): cuerpo de metal, pantalla con ojos de luz, hélice en la cabeza y bracitos que saludan.
  robotin(part) {
    const g = new THREE.Group(), bot = new THREE.Group();
    bot.add(part(new THREE.BoxGeometry(0.42, 0.36, 0.34), '#c9d2ea', { ol: 0.06 }));
    bot.add(part(new THREE.BoxGeometry(0.32, 0.2, 0.02), '#24305e', { z: 0.175, y: 0.02, ol: 0 }));
    const eyes = [];
    for (const x of [-0.07, 0.07]) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), glow('#5ff0ff', 1)); m.position.set(x, 0.03, 0.19); bot.add(m); eyes.push(m); }
    bot.add(part(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12).rotateX(Math.PI / 2), '#ff9c5b', { y: -0.12, z: 0.175, ol: 0.15 }));
    bot.add(part(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8), '#7f8ab8', { y: 0.24, ol: 0.2 }));
    const prop = new THREE.Group();
    for (const a of [0, Math.PI]) prop.add(part(new THREE.BoxGeometry(0.36, 0.015, 0.07), '#ff5f7e', { x: Math.cos(a) * 0.18, ry: a, ol: 0.12 }));
    prop.add(part(new THREE.SphereGeometry(0.035, 10, 8), '#ffc83d', { ol: 0.15 }));
    prop.position.y = 0.31; bot.add(prop);
    const arms = [];
    for (const sx of [-1, 1]) {
      const arm = new THREE.Group();
      arm.add(part(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8), '#7f8ab8', { y: -0.1, ol: 0.15 }));
      arm.add(part(new THREE.SphereGeometry(0.05, 10, 8), '#ff9c5b', { y: -0.21, ol: 0.12 }));
      arm.position.set(sx * 0.23, 0.06, 0); bot.add(arm); arms.push([arm, sx]);
    }
    bot.add(part(new THREE.ConeGeometry(0.1, 0.14, 12).rotateX(Math.PI), '#9aa7cf', { y: -0.24, ol: 0.1 }));
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 10).rotateX(Math.PI), glow('#ffc83d', 0.9));
    flame.position.y = -0.38; bot.add(flame);
    bot.rotation.set(0.25, -0.45, 0);
    g.add(bot);
    return { obj: g, tick: (t) => {
      prop.rotation.y = t * 14;
      arms.forEach(([a, sx]) => (a.rotation.z = sx * (0.35 + (sx > 0 ? Math.max(0, Math.sin(t * 3)) * 1.6 : 0.15))));
      bot.position.y = Math.sin(t * 2.2) * 0.05; bot.rotation.z = Math.sin(t * 1.6) * 0.08;
      flame.scale.y = 0.8 + Math.sin(t * 20) * 0.25;
      const blink = (t % 3.2) < 0.12 ? 0.15 : 1; eyes.forEach((e) => (e.scale.y = blink));
    } };
  },
  // Olla tamalera (Candelaria): olla de barro con asas, tamales asomando y vapor que sube.
  olla(part) {
    const g = new THREE.Group(), pot = new THREE.Group();
    const prof = [[0, -0.2], [0.2, -0.2], [0.3, -0.1], [0.33, 0.02], [0.3, 0.13], [0.24, 0.19], [0.25, 0.22], [0.27, 0.24]].map(([x, y]) => new THREE.Vector2(x, y));
    pot.add(part(new THREE.LatheGeometry(prof, 28), '#d9783f', { ol: 0.05 }));
    pot.add(part(new THREE.TorusGeometry(0.32, 0.018, 8, 32).rotateX(Math.PI / 2), '#fff1d6', { y: 0.04, ol: 0 }));
    pot.add(part(new THREE.TorusGeometry(0.31, 0.012, 6, 32).rotateX(Math.PI / 2), '#fff1d6', { y: -0.03, ol: 0 }));
    for (const sx of [-1, 1]) pot.add(part(new THREE.TorusGeometry(0.07, 0.022, 8, 16), '#b85a28', { x: sx * 0.33, y: 0.08, ry: Math.PI / 2, ol: 0.15 }));
    pot.add(part(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 24), '#7a4a2a', { y: 0.2, ol: 0 }));
    for (const [x, z, rz, rx] of [[-0.08, 0, 0.25, 0.1], [0.07, 0.04, -0.2, -0.1], [0, -0.08, 0.05, -0.25]]) {
      const t = new THREE.Group();
      t.add(part(new THREE.ConeGeometry(0.075, 0.26, 10), '#c8d86a', { ol: 0.1 }));
      t.add(part(new THREE.SphereGeometry(0.05, 10, 8).scale(1, 1.3, 1), '#ffe7a0', { y: -0.02, z: 0.04, ol: 0 }));
      t.position.set(x, 0.3, z); t.rotation.set(rx, 0, rz); pot.add(t);
    }
    const steam = [];
    for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), glow('#f4f1ff', 0.8)); pot.add(m); steam.push(m); }
    pot.rotation.x = 0.3;
    g.add(pot);
    return { obj: g, tick: (t) => {
      pot.position.y = Math.sin(t * 2) * 0.05; pot.rotation.z = Math.sin(t * 1.5) * 0.1; pot.rotation.y = Math.sin(t * 0.6) * 0.4;
      steam.forEach((m, k) => { const p = (t * 0.45 + k / 4) % 1; m.position.set(Math.sin(p * 6 + k) * 0.08, 0.42 + p * 0.45, Math.cos(k * 2) * 0.06); m.scale.setScalar(0.6 + p * 1.2); m.material.opacity = 0.8 * (1 - p); });
    } };
  },
  // Trompo al pastor (Día del Taco): carne en capas que gira en su varilla, con la piña arriba.
  trompo(part) {
    const g = new THREE.Group(), tr = new THREE.Group();
    tr.add(part(new THREE.CylinderGeometry(0.018, 0.018, 1.15, 8), '#9aa7cf', { ol: 0.2 }));
    tr.add(part(new THREE.CylinderGeometry(0.14, 0.14, 0.025, 20), '#9aa7cf', { y: -0.42, ol: 0.1 }));
    const layers = 7;
    for (let k = 0; k < layers; k++) {
      const r0 = 0.11 + Math.sin(((k + 0.5) / layers) * Math.PI) * 0.1, r1 = 0.11 + Math.sin(((k + 1.5) / layers) * Math.PI) * 0.1;
      tr.add(part(new THREE.CylinderGeometry(r1, r0, 0.115, 16), k % 2 ? '#d9542a' : '#e8743a', { y: -0.36 + k * 0.11, ol: 0.04, mat: new THREE.MeshToonMaterial({ color: k % 2 ? '#d9542a' : '#e8743a', flatShading: true }) }));
    }
    const pina = new THREE.Group();
    pina.add(part(new THREE.SphereGeometry(0.1, 12, 10).scale(1, 1.25, 1), '#ffd23d', { ol: 0.1 }));
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; pina.add(part(new THREE.ConeGeometry(0.03, 0.16, 6), '#4fa84a', { x: Math.cos(a) * 0.035, y: 0.17, z: Math.sin(a) * 0.035, rx: Math.sin(a) * 0.4, rz: -Math.cos(a) * 0.4, ol: 0.15 })); }
    pina.position.y = 0.46; tr.add(pina);
    tr.rotation.x = 0.25;
    g.add(tr);
    return { obj: g, tick: (t) => { tr.rotation.y = t * 1.6; tr.position.y = Math.sin(t * 2) * 0.05; tr.rotation.z = Math.sin(t * 1.3) * 0.08; pina.rotation.y = -t * 0.6; } };
  },
  // Regadera (Día de la Tierra): regadera verde con su asa que vuela inclinada y echa gotitas por la flor.
  regadera(part) {
    const g = new THREE.Group(), can = new THREE.Group();
    can.add(part(new THREE.CylinderGeometry(0.22, 0.25, 0.4, 24), '#47c27a', { ol: 0.05 }));
    can.add(part(new THREE.TorusGeometry(0.225, 0.02, 8, 28).rotateX(Math.PI / 2), '#2f9e5c', { y: 0.2, ol: 0 }));
    can.add(part(new THREE.TorusGeometry(0.16, 0.035, 8, 20, Math.PI), '#2f9e5c', { x: -0.08, y: 0.22, ry: Math.PI / 2, ol: 0.12 }));
    can.add(part(new THREE.CylinderGeometry(0.035, 0.05, 0.42, 10).rotateZ(-0.9), '#47c27a', { x: 0.33, y: 0.12, ol: 0.12 }));
    can.add(part(new THREE.CylinderGeometry(0.08, 0.045, 0.06, 14).rotateZ(-0.9), '#ffc83d', { x: 0.5, y: 0.25, ol: 0.15 }));
    can.add(part(new THREE.SphereGeometry(0.05, 10, 8), '#ff9cc8', { x: -0.12, y: 0.02, z: 0.24, ol: 0.15 }));
    can.add(part(new THREE.SphereGeometry(0.025, 8, 6), '#ffc83d', { x: -0.12, y: 0.02, z: 0.28, ol: 0 }));
    const drops = [];
    for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6).scale(1, 1.4, 1), glow('#7fd6ff', 1)); can.add(m); drops.push(m); }
    can.rotation.set(0.3, -0.5, 0.25);
    g.add(can);
    return { obj: g, tick: (t) => {
      can.position.y = Math.sin(t * 2) * 0.05; can.rotation.z = 0.25 + Math.sin(t * 1.4) * 0.12;
      drops.forEach((m, k) => { const p = (t * 0.9 + k / 6) % 1; m.position.set(0.56 + p * 0.2, 0.24 - p * 0.55, (k % 3 - 1) * 0.05); m.scale.setScalar(Math.sin(p * Math.PI) + 0.01); });
    } };
  },
  // Papalote (Día del Niño): rombo de cuatro colores con su cola de moñitos que se mece.
  papalote(part) {
    const g = new THREE.Group(), kite = new THREE.Group();
    const T4 = [[[0, 0.42], [0.3, 0.06]], [[0.3, 0.06], [0, -0.5]], [[0, -0.5], [-0.3, 0.06]], [[-0.3, 0.06], [0, 0.42]]];
    ['#ff5f7e', '#ffc83d', '#4aa8de', '#47c27a'].forEach((c, i) => {
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(...T4[i][0]); sh.lineTo(...T4[i][1]); sh.lineTo(0, 0);
      kite.add(part(new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false }), c, { ol: 0.03 }));
    });
    kite.add(part(new THREE.CylinderGeometry(0.008, 0.008, 0.92, 6), '#7a4a2a', { y: -0.04, z: 0.025, ol: 0 }));
    kite.add(part(new THREE.CylinderGeometry(0.008, 0.008, 0.6, 6).rotateZ(Math.PI / 2), '#7a4a2a', { y: 0.06, z: 0.025, ol: 0 }));
    const tail = [];
    for (let k = 0; k < 5; k++) {
      const b = new THREE.Group();
      for (const s of [-1, 1]) b.add(part(new THREE.ConeGeometry(0.04, 0.08, 6).rotateZ(s * Math.PI / 2), ['#ff5f7e', '#b36bff', '#ffc83d', '#47c27a', '#4aa8de'][k], { x: s * 0.04, ol: 0.15 }));
      kite.add(b); tail.push(b);
    }
    kite.rotation.set(-0.35, -0.4, 0.3);
    g.add(kite);
    return { obj: g, tick: (t) => {
      kite.position.y = Math.sin(t * 1.8) * 0.06; kite.rotation.z = 0.3 + Math.sin(t * 1.3) * 0.15;
      tail.forEach((b, k) => { b.position.set(Math.sin(t * 3 - k * 0.8) * 0.06 * (k + 1) * 0.5, -0.56 - k * 0.11, 0.02); b.rotation.z = Math.sin(t * 3 - k * 0.8) * 0.4; });
    } };
  },
  // Regalito (Día de las Madres): caja rosa con listón dorado; la tapa con su moño se levanta y salen corazoncitos.
  regalito(part) {
    const g = new THREE.Group(), box = new THREE.Group(), lid = new THREE.Group();
    box.add(part(new THREE.BoxGeometry(0.5, 0.4, 0.5), '#ff7ab8', { ol: 0.05 }));
    box.add(part(new THREE.BoxGeometry(0.1, 0.405, 0.505), '#ffc83d', { ol: 0 }));
    box.add(part(new THREE.BoxGeometry(0.505, 0.405, 0.1), '#ffc83d', { ol: 0 }));
    lid.add(part(new THREE.BoxGeometry(0.58, 0.12, 0.58), '#ff9cc8', { ol: 0.05 }));
    lid.add(part(new THREE.BoxGeometry(0.1, 0.125, 0.585), '#ffc83d', { ol: 0 }));
    lid.add(part(new THREE.BoxGeometry(0.585, 0.125, 0.1), '#ffc83d', { ol: 0 }));
    for (const s of [-1, 1]) lid.add(part(new THREE.TorusGeometry(0.08, 0.035, 8, 16), '#ffc83d', { x: s * 0.08, y: 0.12, rz: s * 0.5, ol: 0.12 }));
    lid.add(part(new THREE.SphereGeometry(0.045, 10, 8), '#ec9a17', { y: 0.1, ol: 0.15 }));
    lid.position.y = 0.26; box.add(lid);
    const sh = new THREE.Shape();
    sh.moveTo(0, -0.28); sh.bezierCurveTo(-0.34, -0.06, -0.34, 0.2, -0.17, 0.24); sh.bezierCurveTo(-0.07, 0.26, 0, 0.18, 0, 0.12);
    sh.bezierCurveTo(0, 0.18, 0.07, 0.26, 0.17, 0.24); sh.bezierCurveTo(0.34, 0.2, 0.34, -0.06, 0, -0.28);
    const hg = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: false, curveSegments: 12 }).center().scale(0.45, 0.45, 0.45);
    const hearts = [];
    for (let k = 0; k < 3; k++) { const h = part(hg, ['#ff4f6e', '#ff7aa6', '#ff4f6e'][k], { ol: 0.08 }); box.add(h); hearts.push(h); }
    box.rotation.set(0.25, -0.6, 0);
    g.add(box);
    return { obj: g, tick: (t) => {
      box.position.y = Math.sin(t * 2) * 0.05; box.rotation.z = Math.sin(t * 1.3) * 0.08;
      const o = Math.max(0, Math.sin(t * 1.2)); lid.position.y = 0.26 + o * 0.16; lid.rotation.x = -o * 0.35;
      hearts.forEach((h, k) => { const p = (t * 0.6 + k / 3) % 1; h.position.set((k - 1) * 0.16, 0.25 + p * 0.7, 0); h.rotation.y = 0.6 + Math.sin(t * 2 + k) * 0.4; h.scale.setScalar(o * Math.sin(p * Math.PI) + 0.001); });
    } };
  },
  // ---------- Exclusivos del evento del mes ----------
  // Alebrije (Día de Muertos): jaguar-dragón de colores con manchas, alas de mariposa y cola enroscada.
  // Asador (Día del Padre): asador de bola con sus patas; la tapa se levanta, la salchicha brinca y sale humito.
  asador(part) {
    const g = new THREE.Group(), grill = new THREE.Group(), lid = new THREE.Group();
    grill.add(part(new THREE.SphereGeometry(0.3, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), '#3a3f5a', { ol: 0.05 }));
    grill.add(part(new THREE.TorusGeometry(0.3, 0.02, 8, 32).rotateX(Math.PI / 2), '#9aa7cf', { ol: 0 }));
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      grill.add(part(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 6), '#9aa7cf', { x: Math.cos(a) * 0.17, z: Math.sin(a) * 0.17, y: -0.38, rx: -Math.sin(a) * 0.35, rz: Math.cos(a) * 0.35, ol: 0.2 }));
    }
    for (const x of [-0.12, 0, 0.12]) grill.add(part(new THREE.CylinderGeometry(0.008, 0.008, 0.56, 6).rotateX(Math.PI / 2), '#cfd8e8', { x, y: 0.01, ol: 0 }));
    lid.add(part(new THREE.SphereGeometry(0.31, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), '#3f8ad8', { ol: 0.05 }));
    lid.add(part(new THREE.CylinderGeometry(0.035, 0.05, 0.06, 12), '#c98a3a', { y: 0.33, ol: 0.15 }));
    lid.position.set(0, 0.02, -0.3); grill.add(lid);
    const sausage = part(new THREE.CapsuleGeometry(0.045, 0.2, 6, 12).rotateZ(Math.PI / 2), '#d9583a', { ol: 0.12 });
    grill.add(sausage);
    const smoke = [];
    for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), glow('#e6e9f5', 0.7)); grill.add(m); smoke.push(m); }
    grill.rotation.x = 0.35;
    g.add(grill);
    return { obj: g, tick: (t) => {
      grill.position.y = Math.sin(t * 2) * 0.05; grill.rotation.z = Math.sin(t * 1.4) * 0.08; grill.rotation.y = Math.sin(t * 0.6) * 0.4;
      const o = Math.max(0, Math.sin(t * 1.1)); lid.position.z = -0.3 * o; lid.position.y = 0.02 + o * 0.1; lid.rotation.x = -o * 1.3;
      const j = (t * 1.1) % (Math.PI * 2), hop = Math.max(0, Math.sin(j * 2)) * o;
      sausage.position.set(0, 0.06 + hop * 0.22, 0.02); sausage.rotation.x = hop * Math.PI;
      smoke.forEach((m, k) => { const p = (t * 0.45 + k / 4) % 1; m.position.set(Math.sin(p * 6 + k) * 0.08, 0.12 + p * 0.6, Math.cos(k * 2) * 0.06); m.scale.setScalar((0.5 + p * 1.3) * (0.3 + o * 0.7)); m.material.opacity = 0.7 * (1 - p); });
    } };
  },
  // Caja con michi (Día del Gato): caja de cartón con las tapas abiertas; el gatito gris se asoma, mueve las orejas y la cola.
  cajamichi(part) {
    const g = new THREE.Group(), box = new THREE.Group(), cat = new THREE.Group(), ears = [];
    box.add(part(new THREE.BoxGeometry(0.5, 0.36, 0.42), '#c98a5a', { ol: 0.05 }));
    box.add(part(new THREE.BoxGeometry(0.505, 0.05, 0.425), '#e0a878', { y: -0.06, ol: 0 }));
    for (const [x, z, rz, rx, w, d] of [[-0.3, 0, 0.9, 0, 0.12, 0.42], [0.3, 0, -0.9, 0, 0.12, 0.42], [0, 0.26, 0, -0.9, 0.5, 0.12]])
      box.add(part(new THREE.BoxGeometry(w, 0.012, d), '#d9996a', { x, y: 0.2, z, rx, rz, ol: 0.12 }));
    cat.add(part(new THREE.SphereGeometry(0.17, 20, 14).scale(1.1, 0.95, 1), '#a9b0c8', { ol: 0.06 }));
    for (const s of [-1, 1]) {
      const ear = part(new THREE.ConeGeometry(0.06, 0.12, 4), '#a9b0c8', { x: s * 0.1, y: 0.16, rz: -s * 0.3, ol: 0.15 });
      cat.add(ear); ears.push(ear);
      cat.add(part(new THREE.SphereGeometry(0.03, 10, 8), '#2a1f5c', { x: s * 0.065, y: 0.02, z: 0.155, ol: 0 }));
      cat.add(part(new THREE.SphereGeometry(0.035, 8, 6).scale(1.3, 0.8, 1), '#ff9cb4', { x: s * 0.11, y: -0.05, z: 0.14, ol: 0 }));
    }
    cat.add(part(new THREE.SphereGeometry(0.018, 8, 6), '#ff7a9a', { y: -0.03, z: 0.17, ol: 0 }));
    for (const [y, rx] of [[0.15, 0.2], [0.12, -0.3]]) cat.add(part(new THREE.SphereGeometry(0.02, 8, 6).scale(1, 2.2, 1), '#6e7690', { y: y, z: 0.12, rx, ol: 0 }));
    box.add(cat);
    const tail = new THREE.Group();
    tail.add(part(new THREE.CylinderGeometry(0.025, 0.03, 0.34, 8), '#a9b0c8', { y: 0.17, ol: 0.15 }));
    tail.position.set(0.18, 0.12, -0.2); box.add(tail);
    box.rotation.set(0.3, -0.5, 0);
    g.add(box);
    return { obj: g, tick: (t) => {
      box.position.y = Math.sin(t * 2) * 0.05; box.rotation.z = Math.sin(t * 1.4) * 0.08;
      const peek = (Math.sin(t * 1.2) + 1) / 2; cat.position.y = 0.04 + peek * 0.2; cat.rotation.z = Math.sin(t * 2.4) * 0.12 * peek;
      ears.forEach((e, k) => (e.rotation.x = Math.max(0, Math.sin(t * 6 + k * 2)) * 0.5));
      tail.rotation.z = Math.sin(t * 2.6) * 0.5; tail.rotation.x = -0.3 + Math.sin(t * 1.3) * 0.2;
    } };
  },
  // Disco volador (Día del Perro): disco rojo que gira; encima, un perrito con la lengua de fuera y las orejas al viento.
  frisbee(part) {
    const g = new THREE.Group(), all = new THREE.Group(), disc = new THREE.Group(), dog = new THREE.Group(), ears = [];
    disc.add(part(new THREE.CylinderGeometry(0.34, 0.3, 0.06, 32), '#e8434f', { ol: 0.04 }));
    disc.add(part(new THREE.TorusGeometry(0.24, 0.012, 6, 32).rotateX(Math.PI / 2), '#fff6e6', { y: 0.032, ol: 0 }));
    disc.add(part(new THREE.TorusGeometry(0.14, 0.012, 6, 32).rotateX(Math.PI / 2), '#fff6e6', { y: 0.032, ol: 0 }));
    all.add(disc);
    dog.add(part(new THREE.SphereGeometry(0.15, 18, 14).scale(1, 0.75, 1), '#f6d4a0', { y: 0.08, ol: 0.07 }));
    dog.add(part(new THREE.SphereGeometry(0.15, 20, 14), '#f6d4a0', { y: 0.27, z: 0.06, ol: 0.06 }));
    dog.add(part(new THREE.SphereGeometry(0.07, 12, 10).scale(1, 0.8, 1), '#fff6e6', { y: 0.23, z: 0.19, ol: 0.1 }));
    dog.add(part(new THREE.SphereGeometry(0.03, 10, 8), '#2a1f5c', { y: 0.26, z: 0.26, ol: 0 }));
    dog.add(part(new THREE.BoxGeometry(0.05, 0.08, 0.012), '#ff7a9a', { y: 0.17, z: 0.24, rx: 0.4, ol: 0.15 }));
    for (const s of [-1, 1]) {
      dog.add(part(new THREE.SphereGeometry(0.025, 10, 8), '#2a1f5c', { x: s * 0.06, y: 0.32, z: 0.18, ol: 0 }));
      const ear = new THREE.Group();
      ear.add(part(new THREE.SphereGeometry(0.06, 10, 8).scale(0.5, 1.4, 0.9), '#8a5a3a', { y: -0.06, ol: 0.12 }));
      ear.position.set(s * 0.13, 0.34, 0.02); dog.add(ear); ears.push(ear);
    }
    const tail = part(new THREE.CylinderGeometry(0.018, 0.028, 0.14, 8).translate(0, 0.07, 0), '#f6d4a0', { ol: 0.15 });
    tail.position.set(0, 0.1, -0.13); dog.add(tail);
    dog.position.y = 0.03; all.add(dog);
    all.rotation.set(0.35, -0.5, 0);
    g.add(all);
    return { obj: g, tick: (t) => {
      all.position.y = Math.sin(t * 2) * 0.05; all.rotation.z = Math.sin(t * 1.3) * 0.1;
      disc.rotation.y = t * 4;
      ears.forEach((e, k) => { e.rotation.z = (k ? 1 : -1) * (1.1 + Math.sin(t * 9 + k) * 0.25); e.rotation.x = -0.6; });
      tail.rotation.x = -0.7; tail.rotation.z = Math.sin(t * 14) * 0.6;
    } };
  },
  alebrije(part) {
    const g = new THREE.Group(), body = new THREE.Group();
    body.add(part(new THREE.SphereGeometry(0.2, 20, 14).scale(1, 0.85, 1.35), '#ff5fa8', { ol: 0.07 }));
    for (const [x, y, z, c] of [[0.12, 0.1, 0.05, '#ffc83d'], [-0.13, 0.08, -0.08, '#5fd1c5'], [0.02, 0.16, -0.14, '#ffc83d'], [-0.08, 0.13, 0.14, '#5fd1c5'], [0.15, 0.02, -0.15, '#b36bff']])
      body.add(part(new THREE.SphereGeometry(0.045, 10, 8), c, { x, y, z, ol: 0.18 }));
    const head = new THREE.Group();
    head.add(part(new THREE.SphereGeometry(0.15, 18, 12), '#5fd1c5', { ol: 0.08 }));
    head.add(part(new THREE.SphereGeometry(0.08, 12, 10).scale(1.1, 0.8, 1), '#ffc83d', { z: 0.12, y: -0.03, ol: 0.12 }));
    for (const x of [-0.06, 0.06]) {
      head.add(part(new THREE.SphereGeometry(0.035, 10, 8), '#fff6e6', { x, y: 0.05, z: 0.12, ol: 0.15 }));
      head.add(part(new THREE.SphereGeometry(0.02, 8, 6), INK, { x: x * 1.05, y: 0.05, z: 0.15, ol: 0 }));
      head.add(part(new THREE.ConeGeometry(0.04, 0.14, 8), '#b36bff', { x: x * 1.4, y: 0.15, z: -0.02, rz: -x * 4, ol: 0.15 }));
    }
    head.position.set(0, 0.12, 0.28); body.add(head);
    const wings = [];
    for (const side of [-1, 1]) {
      const w = new THREE.Group();
      w.add(part(new THREE.SphereGeometry(0.2, 16, 10).scale(1.2, 0.1, 0.8), '#ffb13d', { x: side * 0.2, z: 0.04, ol: 0.1 }));
      w.add(part(new THREE.SphereGeometry(0.13, 14, 8).scale(1.1, 0.1, 0.8), '#b36bff', { x: side * 0.17, z: -0.16, ol: 0.12 }));
      w.add(part(new THREE.SphereGeometry(0.06, 10, 6).scale(1, 0.25, 1), '#5fd1c5', { x: side * 0.24, y: 0.02, z: 0.06, ol: 0.15 }));
      w.position.set(side * 0.06, 0.14, 0); body.add(w); wings.push([w, side]);
    }
    const tail = [];
    let parent = body;
    for (let k = 0; k < 4; k++) {
      const seg = part(new THREE.SphereGeometry(0.06 - k * 0.01, 10, 8), k % 2 ? '#ffc83d' : '#ff5fa8', { ol: 0.15 });
      seg.position.set(0, k ? 0.03 : 0.02, k ? -0.08 : -0.3);
      parent.add(seg); tail.push(seg); parent = seg;
    }
    body.rotation.set(0.2, 0.5, 0);
    g.add(body);
    return { obj: g, tick: (t) => {
      wings.forEach(([w, s]) => (w.rotation.z = s * (0.25 + Math.sin(t * 5) * 0.45)));
      tail.forEach((sg, k) => (sg.rotation.x = Math.sin(t * 2.4 - k) * 0.5));
      body.position.y = Math.sin(t * 2.5) * 0.06; head.rotation.y = Math.sin(t * 0.9) * 0.3;
    } };
  },
  // Trineo (Navidad): rojo con patines dorados que se enroscan al frente y su costal de regalos.
  trineo(part) {
    const g = new THREE.Group(), sled = new THREE.Group();
    sled.add(part(new THREE.BoxGeometry(0.34, 0.16, 0.5), '#e8434f', { y: 0.12, ol: 0.06 }));
    sled.add(part(new THREE.BoxGeometry(0.34, 0.2, 0.1), '#c22c3c', { y: 0.26, z: -0.22, ol: 0.07 }));
    sled.add(part(new THREE.BoxGeometry(0.36, 0.035, 0.52), '#ffc83d', { y: 0.215, ol: 0.08 }));
    for (const x of [-0.15, 0.15]) {
      sled.add(part(new THREE.BoxGeometry(0.035, 0.035, 0.62), '#ffc83d', { x, y: -0.02, ol: 0.15 }));
      sled.add(part(new THREE.TorusGeometry(0.07, 0.018, 6, 14, Math.PI * 1.3), '#ffc83d', { x, y: 0.05, z: 0.31, ry: Math.PI / 2, rz: -Math.PI / 2, ol: 0.15 }));
      for (const z of [-0.14, 0.14]) sled.add(part(new THREE.BoxGeometry(0.025, 0.1, 0.025), '#ffc83d', { x, y: 0.03, z, ol: 0.2 }));
    }
    const sack = new THREE.Group();
    sack.add(part(new THREE.SphereGeometry(0.16, 16, 12).scale(1, 1.1, 0.9), '#a8693a', { ol: 0.07 }));
    sack.add(part(new THREE.CylinderGeometry(0.05, 0.07, 0.06, 10), '#e8434f', { y: 0.17, ol: 0.12 }));
    sack.position.set(0, 0.34, -0.1); sled.add(sack);
    sled.add(part(new THREE.BoxGeometry(0.1, 0.1, 0.1), '#3fa0e0', { x: 0.1, y: 0.28, z: 0.1, ry: 0.4, ol: 0.12 }));
    sled.add(part(new THREE.BoxGeometry(0.08, 0.08, 0.08), '#4fb85e', { x: -0.1, y: 0.27, z: 0.13, ry: -0.3, ol: 0.12 }));
    sled.add(part(new THREE.BoxGeometry(0.11, 0.015, 0.02), '#ffc83d', { x: 0.1, y: 0.33, z: 0.1, ry: 0.4, ol: 0 }));
    sled.rotation.y = 0.6; sled.position.y = -0.2; sled.scale.setScalar(1.25);
    g.add(sled);
    return { obj: g, tick: (t) => { sled.position.y = -0.2 + Math.sin(t * 2) * 0.06; sled.rotation.x = Math.sin(t * 2 - 0.8) * 0.12; sack.rotation.z = Math.sin(t * 2.6) * 0.1; } };
  },
  // Camello (Día de Reyes): dos jorobas, manta morada con borde dorado y un regalo; camina moviendo las patas.
  camello(part) {
    const g = new THREE.Group(), body = new THREE.Group(), tan = '#d9a564', dark = '#b8834a';
    body.add(part(new THREE.SphereGeometry(0.22, 20, 14).scale(0.85, 0.8, 1.35), tan, { ol: 0.06 }));
    for (const z of [-0.12, 0.1]) body.add(part(new THREE.SphereGeometry(0.12, 16, 12).scale(1, 1.1, 1), tan, { y: 0.17, z, ol: 0.08 }));
    body.add(part(new THREE.BoxGeometry(0.4, 0.03, 0.18), '#8a5cf0', { y: 0.13, ol: 0.08 }));
    for (const x of [-0.2, 0.2]) body.add(part(new THREE.BoxGeometry(0.03, 0.12, 0.18), '#8a5cf0', { x, y: 0.07, ol: 0.1 }), part(new THREE.BoxGeometry(0.035, 0.02, 0.19), '#ffc83d', { x, y: 0.01, ol: 0.1 }));
    body.add(part(new THREE.BoxGeometry(0.09, 0.09, 0.09), '#e8434f', { y: 0.33, z: -0.12, ry: 0.4, ol: 0.12 }), part(new THREE.BoxGeometry(0.1, 0.015, 0.02), '#ffc83d', { y: 0.38, z: -0.12, ry: 0.4, ol: 0 }));
    const neck = new THREE.Group();
    neck.add(part(new THREE.CapsuleGeometry(0.055, 0.22, 6, 10), tan, { y: 0.12, ol: 0.1 }));
    const head = new THREE.Group();
    head.add(part(new THREE.SphereGeometry(0.08, 14, 10).scale(1, 0.9, 1.5), tan, { ol: 0.1 }));
    head.add(part(new THREE.SphereGeometry(0.05, 10, 8), dark, { z: 0.1, y: -0.02, ol: 0.12 }));
    for (const x of [-0.05, 0.05]) {
      head.add(part(new THREE.SphereGeometry(0.018, 8, 6), INK, { x, y: 0.03, z: 0.05, ol: 0 }));
      head.add(part(new THREE.SphereGeometry(0.025, 8, 6).scale(0.6, 1.2, 0.6), dark, { x: x * 1.3, y: 0.07, z: -0.04, ol: 0.15 }));
    }
    head.position.set(0, 0.26, 0.05); neck.add(head);
    neck.position.set(0, 0.06, 0.26); neck.rotation.x = 0.45; body.add(neck);
    const legs = [];
    for (const [x, z] of [[-0.09, 0.15], [0.09, 0.15], [-0.09, -0.15], [0.09, -0.15]]) {
      const l = new THREE.Group();
      l.add(part(new THREE.CapsuleGeometry(0.035, 0.2, 4, 8), tan, { y: -0.12, ol: 0.15 }));
      l.position.set(x, -0.1, z); body.add(l); legs.push(l);
    }
    body.rotation.y = 0.7; body.scale.setScalar(1.3); body.position.y = 0.05;
    g.add(body);
    return { obj: g, tick: (t) => {
      legs.forEach((l, k) => (l.rotation.x = Math.sin(t * 4 + (k === 0 || k === 3 ? 0 : Math.PI)) * 0.35));
      body.position.y = 0.05 + Math.abs(Math.sin(t * 4)) * 0.03; neck.rotation.x = 0.45 + Math.sin(t * 4) * 0.08;
    } };
  },
  // Corazón (Amor y Amistad): corazón rojo inflado que flota, gira y late.
  alado(part) {
    const g = new THREE.Group(), heart = new THREE.Group();
    const sh = new THREE.Shape();
    sh.moveTo(0, -0.28); sh.bezierCurveTo(-0.34, -0.06, -0.34, 0.2, -0.17, 0.24); sh.bezierCurveTo(-0.07, 0.26, 0, 0.18, 0, 0.12);
    sh.bezierCurveTo(0, 0.18, 0.07, 0.26, 0.17, 0.24); sh.bezierCurveTo(0.34, 0.2, 0.34, -0.06, 0, -0.28);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 4, curveSegments: 20 }).center();
    heart.add(part(geo, '#ff4f6e', { ol: 0.06 }));
    heart.add(part(new THREE.SphereGeometry(0.045, 10, 8).scale(1.4, 0.8, 0.5), '#ffc2dc', { x: -0.11, y: 0.1, z: 0.1, ol: 0 }));
    heart.scale.setScalar(1.4);
    g.add(heart);
    return { obj: g, tick: (t) => {
      heart.position.y = Math.sin(t * 2.4) * 0.07; heart.rotation.y = -1.07 + Math.sin(t * 0.9) * 0.35;
      const b = 1 + Math.max(0, Math.sin(t * 5)) * 0.06; heart.scale.setScalar(1.4 * b);
    } };
  },
  // Mariposa (Primavera): alas lila y rosa con puntos, cuerpo oscuro y antenas; aletea y revolotea.
  mariposa(part) {
    const g = new THREE.Group(), fly = new THREE.Group();
    fly.add(part(new THREE.CapsuleGeometry(0.035, 0.3, 6, 10).rotateX(Math.PI / 2), '#3a3550', { ol: 0.15 }));
    fly.add(part(new THREE.SphereGeometry(0.05, 10, 8), '#3a3550', { z: 0.2, ol: 0.15 }));
    for (const x of [-0.03, 0.03]) fly.add(part(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 5), '#3a3550', { x: x * 2, y: 0.06, z: 0.27, rx: 0.9, rz: -x * 8, ol: 0 }), part(new THREE.SphereGeometry(0.018, 8, 6), '#3a3550', { x: x * 4.2, y: 0.12, z: 0.33, ol: 0 }));
    const wings = [];
    for (const side of [-1, 1]) {
      const w = new THREE.Group();
      w.add(part(new THREE.SphereGeometry(0.2, 16, 10).scale(1, 0.06, 0.85), '#b36bff', { x: side * 0.18, z: 0.08, ol: 0.08 }));
      w.add(part(new THREE.SphereGeometry(0.14, 14, 8).scale(1, 0.06, 0.9), '#ff7ab8', { x: side * 0.13, z: -0.15, ol: 0.1 }));
      w.add(part(new THREE.SphereGeometry(0.045, 10, 6).scale(1, 0.4, 1), '#fff6ee', { x: side * 0.24, y: 0.015, z: 0.12, ol: 0 }));
      w.add(part(new THREE.SphereGeometry(0.03, 10, 6).scale(1, 0.4, 1), '#ffc83d', { x: side * 0.15, y: 0.015, z: -0.17, ol: 0 }));
      fly.add(w); wings.push([w, side]);
    }
    fly.rotation.set(-1.2, 0.25, 0); fly.scale.setScalar(1.5);
    g.add(fly);
    return { obj: g, tick: (t) => {
      wings.forEach(([w, s]) => (w.rotation.z = s * Math.sin(t * 9) * 0.8));
      fly.position.y = Math.sin(t * 2.2) * 0.08 + Math.sin(t * 9) * 0.015; fly.rotation.y = 0.25 + Math.sin(t * 0.8) * 0.3;
    } };
  },
  // Patito inflable (Verano): flotador amarillo con cabeza de pato, pico naranja y franja; se mece como en las olas.
  patito(part) {
    const g = new THREE.Group(), duck = new THREE.Group();
    duck.add(part(new THREE.TorusGeometry(0.27, 0.12, 14, 32).rotateX(Math.PI / 2), '#ffd23d', { ol: 0.08 }));
    duck.add(part(new THREE.TorusGeometry(0.27, 0.123, 8, 32, Math.PI * 0.5).rotateX(Math.PI / 2), '#ff7a6a', { ry: Math.PI * 0.75, ol: 0 }));
    const head = new THREE.Group();
    head.add(part(new THREE.CapsuleGeometry(0.08, 0.14, 6, 12), '#ffd23d', { y: 0.06, ol: 0.12 }));
    head.add(part(new THREE.SphereGeometry(0.15, 18, 14), '#ffd23d', { y: 0.24, ol: 0.08 }));
    head.add(part(new THREE.SphereGeometry(0.09, 14, 10).scale(1, 0.45, 1.25), '#ff9c2b', { y: 0.2, z: 0.15, ol: 0.15 }));
    for (const x of [-0.065, 0.065]) {
      head.add(part(new THREE.SphereGeometry(0.03, 10, 8), INK, { x, y: 0.29, z: 0.12, ol: 0 }));
      head.add(part(new THREE.SphereGeometry(0.01, 6, 4), '#ffffff', { x: x - 0.008, y: 0.3, z: 0.148, ol: 0 }));
    }
    head.position.set(0, 0.05, 0.27);
    duck.add(head);
    duck.add(part(new THREE.ConeGeometry(0.07, 0.14, 10).rotateX(-Math.PI / 2 - 0.6), '#ffd23d', { y: 0.1, z: -0.33, ol: 0.15 }));
    duck.rotation.set(0.45, -0.5, 0);
    g.add(duck);
    return { obj: g, tick: (t) => { duck.position.y = Math.sin(t * 2) * 0.05; duck.rotation.z = Math.sin(t * 2 + 0.6) * 0.12; duck.rotation.x = 0.45 + Math.sin(t * 1.7) * 0.06; head.rotation.y = Math.sin(t * 0.9) * 0.35; } };
  },
  // Sombrero de charro (Fiestas Patrias): ala ancha que se levanta en la orilla, copa alta con listón rojo
  // y verde y botoncitos dorados; vuela girando despacio como platillo y se ladea.
  sombrero(part) {
    const g = new THREE.Group(), hat = new THREE.Group();
    const brim = [[0, 0], [0.2, 0], [0.34, 0.01], [0.44, 0.04], [0.5, 0.09], [0.52, 0.13], [0.5, 0.135], [0.43, 0.075], [0.33, 0.04], [0.2, 0.03], [0, 0.03]].map(([x, y]) => new THREE.Vector2(x, y - 0.1));
    hat.add(part(new THREE.LatheGeometry(brim, 40), '#f2d38a', { ol: 0.04 }));
    hat.add(part(new THREE.TorusGeometry(0.5, 0.018, 8, 48).rotateX(Math.PI / 2), '#e8434f', { y: 0.03, ol: 0 }));
    hat.add(part(new THREE.TorusGeometry(0.38, 0.012, 6, 48).rotateX(Math.PI / 2), '#2f9e5c', { y: -0.055, ol: 0 }));
    const crown = [[0, 0], [0.17, 0], [0.165, 0.12], [0.145, 0.24], [0.11, 0.31], [0.06, 0.34], [0, 0.345]].map(([x, y]) => new THREE.Vector2(x, y - 0.08));
    hat.add(part(new THREE.LatheGeometry(crown, 32), '#f2d38a', { ol: 0.06 }));
    hat.add(part(new THREE.CylinderGeometry(0.172, 0.174, 0.07, 32, 1, true), '#e8434f', { y: -0.03, ol: 0 }));
    hat.add(part(new THREE.CylinderGeometry(0.168, 0.17, 0.025, 32, 1, true), '#2f9e5c', { y: 0.02, ol: 0 }));
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      hat.add(part(new THREE.SphereGeometry(0.02, 8, 6), '#ffc83d', { x: Math.cos(a) * 0.176, y: -0.03, z: Math.sin(a) * 0.176, ol: 0.3 }));
    }
    hat.rotation.x = 0.35;
    hat.scale.setScalar(1.15);
    g.add(hat);
    return { obj: g, tick: (t) => { hat.rotation.y = t * 0.9; hat.rotation.z = Math.sin(t * 1.6) * 0.12; hat.position.y = Math.sin(t * 2.1) * 0.05; } };
  },
  // Escoba voladora (Halloween): palo de madera, paja dorada amarrada con listón morado y chispitas verdes detrás.
  escoba(part) {
    const g = new THREE.Group(), broom = new THREE.Group();
    broom.add(part(new THREE.CylinderGeometry(0.03, 0.035, 0.9, 10).rotateZ(Math.PI / 2), '#9a5a32', { x: -0.12, ol: 0.15 }));
    broom.add(part(new THREE.ConeGeometry(0.16, 0.36, 16).rotateZ(Math.PI / 2), '#e8b84a', { x: 0.42, ol: 0.08 }));
    broom.add(part(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 14).rotateZ(Math.PI / 2), '#8a5cf0', { x: 0.27, ol: 0.15 }));
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; broom.add(part(new THREE.CylinderGeometry(0.006, 0.006, 0.3, 4).rotateZ(Math.PI / 2), '#c9893a', { x: 0.44, y: Math.cos(a) * 0.08, z: Math.sin(a) * 0.08, ol: 0 })); }
    broom.add(part(new THREE.SphereGeometry(0.04, 10, 8), '#9a5a32', { x: -0.57, ol: 0.15 }));
    const sparks = [];
    for (let k = 0; k < 5; k++) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.03), glow(k % 2 ? '#b8f0a0' : '#ffd23d', 1)); broom.add(m); sparks.push(m); }
    broom.rotation.set(0.25, -0.5, 0.2);
    g.add(broom);
    return { obj: g, tick: (t) => {
      broom.position.y = Math.sin(t * 2.2) * 0.06; broom.rotation.z = 0.2 + Math.sin(t * 2.2 + 1) * 0.1;
      sparks.forEach((m, k) => { const p = (t * 0.7 + k / 5) % 1; m.position.set(0.6 + p * 0.35, Math.sin(p * 9 + k) * 0.06, Math.cos(k * 2) * 0.06); m.scale.setScalar(Math.sin(p * Math.PI) * 1.3 + 0.01); m.rotation.y = t * 4; });
    } };
  },
  // Mantarraya: aletas que aletean despacio y cola larga.
  mantarraya(part) {
    const g = new THREE.Group(), ray = new THREE.Group();
    ray.add(part(new THREE.SphereGeometry(0.2, 20, 12).scale(1, 0.32, 1.2), '#6f5fd8', { ol: 0.08 }));
    ray.add(part(new THREE.SphereGeometry(0.17, 18, 10).scale(1, 0.2, 1.1), '#e3d8ff', { y: -0.03, ol: 0 }));
    const wings = [];
    for (const side of [-1, 1]) {
      const w = new THREE.Group();
      w.add(part(new THREE.SphereGeometry(0.22, 16, 10).scale(1.3, 0.14, 0.8), '#6f5fd8', { x: side * 0.24, ol: 0.1 }));
      w.position.x = side * 0.08; ray.add(w); wings.push([w, side]);
    }
    for (const x of [-0.08, 0.08]) ray.add(part(new THREE.SphereGeometry(0.032, 10, 8), INK, { x, y: 0.06, z: 0.18, ol: 0 }));
    ray.add(part(new THREE.CylinderGeometry(0.012, 0.03, 0.5, 6).rotateX(Math.PI / 2), '#5a4bc0', { z: -0.45, ol: 0.2 }));
    for (const [x, z] of [[-0.06, 0], [0.07, -0.08], [0, 0.1]]) ray.add(part(new THREE.SphereGeometry(0.025, 8, 6), '#ffc83d', { x, y: 0.065, z, ol: 0 }));
    ray.rotation.set(0.5, -0.6, 0);
    g.add(ray);
    return { obj: g, tick: (t) => { wings.forEach(([w, s]) => (w.rotation.z = s * Math.sin(t * 2.6) * 0.45)); ray.position.y = Math.sin(t * 2.6 - 1) * 0.05; } };
  },
  // Satélite: cuerpo dorado, dos paneles solares, antena con plato y una luz que parpadea.
  satelite(part, toon) {
    const g = new THREE.Group(), sat = new THREE.Group();
    sat.add(part(new THREE.BoxGeometry(0.2, 0.24, 0.2), '#ffc83d', { ol: 0.08 }));
    for (const s of [-1, 1]) {
      sat.add(part(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 6).rotateZ(Math.PI / 2), '#b9c4e0', { x: s * 0.15, ol: 0.3 }));
      const panel = part(new THREE.BoxGeometry(0.3, 0.18, 0.02), '#4a6fde', { x: s * 0.35, ol: 0.08 });
      for (let k = -1; k <= 1; k++) panel.add(part(new THREE.BoxGeometry(0.008, 0.18, 0.025), '#9ad9ff', { x: k * 0.075, ol: 0 }));
      sat.add(panel);
    }
    sat.add(part(new THREE.SphereGeometry(0.12, 18, 10, 0, TAU, 0, Math.PI / 2.6).rotateX(Math.PI), '#f4f1ff', { y: 0.26, ol: 0.08 }));
    sat.add(part(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6), '#b9c4e0', { y: 0.17, ol: 0 }));
    const m = toon({ color: '#ff5f7e' });
    sat.add(part(new THREE.SphereGeometry(0.03, 10, 8), null, { y: 0.32, ol: 0.3, mat: m }));
    sat.rotation.set(0.3, 0, 0.25);
    g.add(sat);
    const a = new THREE.Color('#ff5f7e'), b = new THREE.Color('#fff4c7');
    return { obj: g, tick: (t) => { sat.rotation.y = t * 0.6; sat.position.y = Math.sin(t * 1.8) * 0.04; m.color.copy(Math.floor(t * 2.5) % 2 ? a : b); } };
  },
  // Barco pirata volador: casco de madera, vela que se infla y banderita.
  barco(part, toon) {
    const g = new THREE.Group(), ship = new THREE.Group();
    const sh = new THREE.Shape();
    sh.moveTo(-0.36, 0.08); sh.lineTo(0.4, 0.08); sh.quadraticCurveTo(0.36, -0.12, 0.2, -0.14); sh.lineTo(-0.28, -0.14); sh.quadraticCurveTo(-0.38, -0.08, -0.36, 0.08);
    const hull = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }).translate(0, 0, -0.11);
    ship.add(part(hull, '#a8703f', { ol: 0.06 }));
    ship.add(part(new THREE.BoxGeometry(0.72, 0.03, 0.26), '#ffc83d', { y: 0.02, ol: 0 }));
    ship.add(part(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), '#6a4028', { y: 0.32, ol: 0.2 }));
    const sail = part(new THREE.BoxGeometry(0.03, 0.3, 0.36), '#fff6e6', { x: 0.02, y: 0.34, ol: 0.08 });
    sail.add(part(new THREE.SphereGeometry(0.05, 10, 8).scale(0.3, 1, 1), '#2a2440', { x: 0.02, ol: 0 }));
    ship.add(sail);
    const flag = part(new THREE.BoxGeometry(0.12, 0.07, 0.01), '#2a2440', { x: 0.07, y: 0.6, ol: 0.15 });
    flag.add(part(new THREE.SphereGeometry(0.018, 8, 6), '#fff', { z: 0.01, ol: 0 }));
    ship.add(flag);
    for (const x of [-0.18, 0, 0.18]) ship.add(part(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 10).rotateX(Math.PI / 2), '#2a2440', { x, y: -0.03, z: 0.14, ol: 0 }));
    ship.rotation.y = -0.95; // de tres cuartos, para que se vea la vela
    g.add(ship);
    return { obj: g, tick: (t) => { ship.rotation.z = Math.sin(t * 1.6) * 0.12; ship.rotation.x = Math.sin(t * 1.1) * 0.08; ship.position.y = Math.sin(t * 1.6 + 1) * 0.05; sail.scale.x = 1 + Math.sin(t * 2.4) * 0.8; flag.rotation.y = Math.sin(t * 6) * 0.4; } };
  },
  // Dragón chino: cuerpo rojo en bolitas que ondula, panza dorada, cuernos y bigotes.
  dragon(part) {
    const g = new THREE.Group(), all = new THREE.Group(), segs = [];
    for (let k = 0; k < 9; k++) {
      const r = 0.1 - k * 0.006, seg = part(new THREE.SphereGeometry(r, 14, 10), k % 2 ? '#e8435f' : '#ff5f5f', { ol: 0.1 });
      if (k % 2 === 0) seg.add(part(new THREE.ConeGeometry(0.03, 0.07, 6), '#ffc83d', { y: r, ol: 0.2 }));
      all.add(seg); segs.push(seg);
    }
    const head = new THREE.Group();
    head.add(part(new THREE.SphereGeometry(0.15, 18, 14).scale(1.15, 0.95, 1), '#ff5f5f', { ol: 0.08 }));
    head.add(part(new THREE.SphereGeometry(0.1, 14, 10).scale(1, 0.6, 0.9), '#ffc83d', { x: -0.12, y: -0.04, ol: 0.1 }));
    for (const z of [-1, 1]) {
      head.add(part(new THREE.ConeGeometry(0.03, 0.16, 8), '#ffe58a', { x: 0.05, y: 0.15, z: z * 0.06, rz: 0.5, rx: z * 0.3, ol: 0.2 }));
      head.add(part(new THREE.SphereGeometry(0.03, 10, 8), INK, { x: -0.1, y: 0.06, z: z * 0.09, ol: 0 }));
      head.add(part(new THREE.CylinderGeometry(0.008, 0.004, 0.24, 4), '#ffc83d', { x: -0.22, y: -0.05, z: z * 0.08, rz: 1.2, rx: z * 0.5, ol: 0 }));
    }
    all.add(head);
    all.rotation.y = 0.35; all.scale.setScalar(1.35);
    g.add(all);
    return { obj: g, tick: (t) => {
      segs.forEach((s, k) => s.position.set(0.02 + k * 0.08, Math.sin(t * 3.5 - k * 0.7) * 0.08 - 0.02, Math.cos(t * 3.5 - k * 0.7) * 0.05));
      head.position.set(-0.1, Math.sin(t * 3.5 + 0.7) * 0.08 + 0.02, Math.cos(t * 3.5 + 0.7) * 0.05);
      all.position.x = -0.35;
    } };
  },
  // Avión de papel: alas dobladas que planea en ondas.
  avion(part) {
    const g = new THREE.Group(), plane = new THREE.Group();
    const wing = (s) => {
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.55, 0); sh.lineTo(0.5, s * 0.24); sh.lineTo(0, 0);
      return new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false }).rotateX(Math.PI / 2);
    };
    const wl = part(wing(1), '#fff6e6', { ol: 0.04, rx: -0.12 }), wr = part(wing(-1), '#f0eaff', { ol: 0.04, rx: 0.12 });
    const keel = new THREE.Shape(); keel.moveTo(0, 0); keel.lineTo(0.55, 0); keel.lineTo(0.48, -0.1); keel.lineTo(0, 0);
    plane.add(wl, wr, part(new THREE.ExtrudeGeometry(keel, { depth: 0.012, bevelEnabled: false }), '#d3cdea', { ol: 0.04 }));
    plane.add(part(new THREE.BoxGeometry(0.5, 0.004, 0.006), '#ff9cc8', { x: 0.27, y: 0.006, ol: 0 }));
    plane.position.x = -0.27;
    const hold = new THREE.Group(); hold.add(plane); hold.scale.setScalar(1.5);
    g.add(hold);
    return { obj: g, tick: (t) => { hold.position.y = Math.sin(t * 1.8) * 0.08; hold.rotation.set(0.7 + Math.sin(t * 0.9) * 0.15, 2.6, 0.25 + Math.cos(t * 1.8) * 0.18); } };
  },
  // Nube con arcoíris: nube esponjosa que flota sobre su arco de colores.
  nube(part) {
    const g = new THREE.Group(), all = new THREE.Group();
    ['#ff5f7e', '#ff9c5b', '#ffc83d', '#6fd36a', '#4aa8de', '#8a5cf0'].forEach((c, k) => all.add(part(new THREE.TorusGeometry(0.34 - k * 0.04, 0.022, 8, 28, Math.PI), c, { y: -0.12, ol: k === 0 || k === 5 ? 0.2 : 0 })));
    const cloud = new THREE.Group();
    for (const [x, y, r] of [[-0.24, 0.06, 0.12], [-0.1, 0.12, 0.16], [0.08, 0.14, 0.15], [0.24, 0.06, 0.12], [0, 0.02, 0.15]]) cloud.add(part(new THREE.SphereGeometry(r, 16, 12), '#ffffff', { x, y, ol: 0.08 }));
    for (const x of [-0.06, 0.08]) cloud.add(part(new THREE.SphereGeometry(0.025, 10, 8), INK, { x, y: 0.1, z: 0.15, ol: 0 }));
    cloud.add(part(new THREE.TorusGeometry(0.03, 0.01, 6, 12, Math.PI).rotateX(Math.PI), INK, { x: 0.01, y: 0.05, z: 0.16, ol: 0 }));
    cloud.position.y = -0.1; all.add(cloud);
    all.scale.setScalar(1.3);
    g.add(all);
    return { obj: g, tick: (t) => { all.position.y = Math.sin(t * 1.5) * 0.05; cloud.scale.set(1 + Math.sin(t * 2.4) * 0.03, 1 - Math.sin(t * 2.4) * 0.03, 1); all.rotation.y = -0.3 + Math.sin(t * 0.8) * 0.25; } };
  },
};
export const TRAVELERS = Object.keys(MODELS);

// Un viajero listo para ponerse en una escena: { obj, tick(segundos) }. Con "reducir movimiento" se queda quieto.
export function makeTraveler(kind, toon = toonMaker()) {
  const m = (MODELS[kind] || MODELS.cohete)(kit(toon), toon);
  const tick = m.tick;
  m.tick = (t) => (calm() ? tick(0.6) : tick(t));
  m.tick(0);
  return m;
}

// Vitrina de la tienda: varios viajeros girando, cada uno en su lienzo 2D, con un solo contexto WebGL.
export class TravelerShelf {
  constructor(slots) { // slots: [{ canvas, kind }]
    const S = 220;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(S, S, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x3a2470, 1.3));
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.6); sun.position.set(-6, 5, 7); this.scene.add(sun);
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20); this.camera.position.set(0, 0.15, 2.9); this.camera.lookAt(0, 0, 0);
    const toon = toonMaker();
    this.items = slots.map(({ canvas, kind }) => {
      canvas.width = canvas.height = S;
      const t = makeTraveler(kind, toon), turn = new THREE.Group();
      turn.add(t.obj); turn.visible = false; this.scene.add(turn);
      return { ctx: canvas.getContext('2d'), t, turn };
    });
    this.t0 = performance.now();
    const loop = (now) => {
      if (this.dead) return;
      if (!this.items.some((it) => it.ctx.canvas.isConnected)) return this.dispose(); // se cerró la ventana
      const s = (now - this.t0) / 1000;
      for (const it of this.items) {
        if (!it.ctx.canvas.isConnected) continue;
        this.items.forEach((o) => (o.turn.visible = o === it));
        it.t.tick(s);
        it.turn.rotation.y = calm() ? 0.4 : Math.sin(s * 0.7) * 0.6;
        this.renderer.render(this.scene, this.camera);
        it.ctx.clearRect(0, 0, S, S);
        it.ctx.drawImage(this.renderer.domElement, 0, 0);
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  dispose() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => m.dispose()); });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
