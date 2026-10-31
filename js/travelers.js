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
