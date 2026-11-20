// Guarida del jefe (Arena de jefes, 20 nov 2026, el usuario: «un castillo o algo más pro y grande… que se sienta como
// un jefe»). Fortaleza de piedra oscura arriba del planeta de la arena: muralla con almenas, dos torres con techos de
// picos del color del jefe, la torre del centro con la corona que flota, banderas que ondean y en el portón dos ojos
// que brillan y parpadean. Toon con contorno de tinta, como lo demás del mapa. Se usa como la estación del planeta
// (makePlanet en galaxy.js): { obj, h, tick, sto }.
import * as THREE from 'three';
import { INK } from './art.js';

const STONE = '#4a3f6b', STONE2 = '#3a3058', DARK = '#120c2e', GOLD = '#ffc83d';

export function makeLair(toon, color) {
  const obj = new THREE.Group(), ink = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  const part = (geo, c, x, y, z, { ol = 0.06, mat, parent = obj, rx = 0, ry = 0, rz = 0 } = {}) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, mat || toon({ color: c })));
    if (ol) { const o = new THREE.Mesh(geo, ink); o.scale.setScalar(1 + ol); g.add(o); }
    g.position.set(x, y, z);
    g.rotation.set(rx, ry, rz);
    parent.add(g);
    return g;
  };
  // Peñasco de base y muralla.
  part(new THREE.CylinderGeometry(0.5, 0.58, 0.12, 9), STONE2, 0, 0.04, 0, { ol: 0.05 });
  part(new THREE.BoxGeometry(0.62, 0.36, 0.36), STONE, 0, 0.27, 0.02);
  for (let i = 0; i < 5; i++) part(new THREE.BoxGeometry(0.08, 0.08, 0.08), STONE, -0.24 + i * 0.12, 0.49, 0.17, { ol: 0.1 });
  // Portón con arco y los ojos del jefe.
  part(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16, 1, false, 0, Math.PI), DARK, 0, 0.27, 0.2, { ol: 0.12, rx: Math.PI / 2, rz: Math.PI });
  part(new THREE.BoxGeometry(0.24, 0.17, 0.04), DARK, 0, 0.18, 0.2, { ol: 0.08 });
  const eyes = new THREE.Group();
  eyes.position.set(0, 0.24, 0.225);
  obj.add(eyes);
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#fff27a' });
  for (const x of [-0.05, 0.05]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 8), eyeMat);
    e.position.x = x;
    e.scale.set(1.3, 0.7, 0.5);
    e.rotation.z = x < 0 ? -0.35 : 0.35;
    eyes.add(e);
  }
  // Picos en la muralla.
  for (const x of [-0.2, 0.2]) part(new THREE.ConeGeometry(0.035, 0.12, 6), '#d9d2ee', x, 0.32, 0.22, { ol: 0.15, rx: Math.PI / 2 });
  // Torres de los lados con techo de picos.
  const tower = (x, z, r, h, roofH) => {
    part(new THREE.CylinderGeometry(r, r * 1.1, h, 12), STONE, x, h / 2, z);
    part(new THREE.CylinderGeometry(r * 1.25, r * 1.25, 0.06, 12), STONE2, x, h, z, { ol: 0.08 });
    part(new THREE.ConeGeometry(r * 1.3, roofH, 12), color, x, h + 0.03 + roofH / 2, z);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      part(new THREE.ConeGeometry(0.025, 0.09, 5), color, x + Math.cos(a) * r * 1.25, h + 0.04, z + Math.sin(a) * r * 1.25, { ol: 0.15, rz: -Math.cos(a) * 0.9, rx: Math.sin(a) * 0.9 });
    }
    return h + 0.03 + roofH;
  };
  const flags = [];
  const flag = (x, y, z) => {
    part(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 5), '#d9d2ee', x, y + 0.08, z, { ol: 0.3 });
    const f = new THREE.Group();
    f.position.set(x, y + 0.13, z);
    obj.add(f);
    part(new THREE.BoxGeometry(0.1, 0.06, 0.008), color, 0.05, 0, 0, { ol: 0.15, parent: f });
    flags.push(f);
  };
  flag(-0.34, tower(-0.34, 0.02, 0.11, 0.62, 0.24), 0.02);
  flag(0.34, tower(0.34, 0.02, 0.11, 0.62, 0.24), 0.02);
  const top = tower(0, -0.12, 0.15, 0.86, 0.3);
  // La corona del jefe, flotando arriba de la torre del centro.
  const crown = new THREE.Group();
  crown.position.set(0, top + 0.12, -0.12);
  obj.add(crown);
  part(new THREE.CylinderGeometry(0.1, 0.11, 0.06, 14), GOLD, 0, 0, 0, { ol: 0.12, parent: crown });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    part(new THREE.ConeGeometry(0.028, 0.08, 6), GOLD, Math.cos(a) * 0.09, 0.06, Math.sin(a) * 0.09, { ol: 0.15, parent: crown });
    part(new THREE.SphereGeometry(0.018, 8, 6), '#ff5f7e', Math.cos(a) * 0.105, 0, Math.sin(a) * 0.105, { ol: 0, parent: crown });
  }
  const h = top + 0.25;
  const tick = (t) => {
    crown.position.y = top + 0.12 + Math.sin(t * 2) * 0.03;
    crown.rotation.y = t * 0.8;
    // Parpadea cada ~3.5 s.
    eyes.scale.y = t % 3.5 < 0.14 ? 0.15 : 1;
    flags.forEach((f, i) => (f.rotation.y = Math.sin(t * 3 + i * 1.7) * 0.5));
  };
  return { obj, h, tick, sto: { play: false }, lair: true };
}
