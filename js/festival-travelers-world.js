// Naves 3D de las fiestas de Europa y de Oriente (14 nov 2026; datos en festival-art-world.js y FESTIVALS de
// events.js). Mismo estilo que festival-travelers.js, que las junta: material toon con contorno de tinta, ~1 de alto,
// centradas en el origen. Cada una: { obj, tick(t) }.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const glow = (color, opacity = 0.85) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
// Gotitas o chispas que caen y se apagan (agua, lodo, pétalos).
function drops(g, colors, n = 6, size = 0.035, fall = 0.45) {
  const out = Array.from({ length: n }, (_, k) => { const m = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 6), glow(colors[k % colors.length], 0.95)); g.add(m); return m; });
  return (t, x0 = 0, y0 = -0.3, spread = 0.25) => out.forEach((m, k) => {
    const p = (t * 0.6 + k / n) % 1;
    m.position.set(x0 + Math.sin(k * 2.3) * spread * p, y0 - p * fall, Math.cos(k * 1.7) * 0.12 * p);
    m.material.opacity = 0.95 * (1 - p);
  });
}
// Bolitas de humo o vapor que suben y crecen.
function puffs(g, color = '#f4f1ff', n = 4) {
  const out = Array.from({ length: n }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), glow(color, 0.8)); g.add(m); return m; });
  return (t, x0 = 0, y0 = 0.3) => out.forEach((m, k) => { const p = (t * 0.45 + k / n) % 1; m.position.set(x0 + Math.sin(p * 6 + k) * 0.06, y0 + p * 0.45, 0); m.scale.setScalar(0.6 + p); m.material.opacity = 0.8 * (1 - p); });
}
// Florecita de 5 bolitas con su centro, mirando hacia +z.
function flower(part, c, r = 0.04) {
  const f = new THREE.Group();
  for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; f.add(part(new THREE.SphereGeometry(r, 8, 6), c, { x: Math.cos(a) * r * 1.2, y: Math.sin(a) * r * 1.2, ol: 0.15 })); }
  f.add(part(new THREE.SphereGeometry(r * 0.8, 8, 6), '#ffd23d', { z: r * 0.4, ol: 0 }));
  return f;
}

export function worldModels() {
  return {
    // Up Helly Aa: barco vikingo con cabeza de dragón, vela de rayas, escudos al lado y remos que reman.
    drakkar(part) {
      const g = new THREE.Group(), b = new THREE.Group();
      b.add(part(new THREE.CapsuleGeometry(0.13, 0.56, 6, 16).rotateZ(Math.PI / 2).scale(1, 0.7, 1), '#a86a3a', { ol: 0.06 }));
      b.add(part(new THREE.BoxGeometry(0.66, 0.03, 0.22), '#c98a4b', { y: 0.07, ol: 0.08 }));
      const neck = [[0.38, 0.1], [0.44, 0.2], [0.46, 0.3]].map(([x, y], i) => part(new THREE.SphereGeometry(0.055 - i * 0.004, 10, 8), '#5fbf5a', { x, y, ol: 0.12 }));
      neck.forEach((m) => b.add(m));
      const head = new THREE.Group();
      head.add(part(new THREE.SphereGeometry(0.07, 12, 10).scale(1.4, 1, 1), '#5fbf5a', { ol: 0.1 }));
      for (const sz of [-1, 1]) head.add(part(new THREE.SphereGeometry(0.014, 6, 6), '#ffc83d', { x: 0.03, y: 0.03, z: sz * 0.05, ol: 0 }));
      head.add(part(new THREE.ConeGeometry(0.02, 0.07, 6), '#ffc83d', { x: -0.02, y: 0.08, rz: 0.3, ol: 0.15 }));
      head.position.set(0.5, 0.38, 0); b.add(head);
      b.add(part(new THREE.SphereGeometry(0.04, 8, 6).scale(1, 2.4, 1), '#5fbf5a', { x: -0.4, y: 0.2, rz: 0.5, ol: 0.12 }));
      b.add(part(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), '#83501a', { y: 0.36, ol: 0.2 }));
      const sail = new THREE.Group();
      [0, 1, 2, 3].forEach((i) => sail.add(part(new THREE.BoxGeometry(0.42, 0.08, 0.012), i % 2 ? '#fffdf7' : '#e8434f', { y: 0.12 - i * 0.08, ol: i ? 0 : 0.05 })));
      sail.position.set(0, 0.4, 0.02); b.add(sail);
      for (let i = 0; i < 4; i++) for (const sz of [-1, 1]) b.add(part(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 14).rotateX(Math.PI / 2), ['#ffc83d', '#4aa8de', '#e8434f', '#fffdf7'][(i + (sz > 0 ? 1 : 0)) % 4], { x: -0.22 + i * 0.15, y: 0.04, z: sz * 0.135, ol: 0.12 }));
      const oars = [-0.15, 0.15].flatMap((x) => [-1, 1].map((sz) => { const o = new THREE.Group(); o.add(part(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 6), '#c98a4b', { y: -0.15, ol: 0.25 })); o.position.set(x, 0, sz * 0.14); o.rotation.x = sz * 0.9; b.add(o); return [o, sz]; }));
      g.add(b);
      return { obj: g, tick: (t) => {
        oars.forEach(([o, sz], i) => (o.rotation.z = Math.sin(t * 3.6 + i * 0.3) * 0.5, o.rotation.x = sz * (0.9 + Math.cos(t * 3.6) * 0.15)));
        b.position.y = Math.sin(t * 1.8) * 0.04; b.rotation.x = Math.sin(t * 1.3) * 0.06; b.rotation.y = Math.sin(t * 0.6) * 0.5; sail.scale.z = 1 + Math.sin(t * 2) * 0.4;
      } };
    },
    // San Patricio: olla de oro con monedas y su arcoíris que la sigue.
    ollavuela(part) {
      const g = new THREE.Group(), p = new THREE.Group();
      p.add(part(new THREE.SphereGeometry(0.22, 18, 14, 0, TAU, Math.PI * 0.3, Math.PI * 0.7), '#3a3550', { ol: 0.06 }));
      p.add(part(new THREE.TorusGeometry(0.19, 0.035, 8, 24), '#4a4560', { y: 0.12, rx: Math.PI / 2, ol: 0.08 }));
      const coins = [[0, 0.16, 0], [-0.08, 0.15, 0.05], [0.08, 0.15, -0.04], [0.03, 0.2, 0.06], [-0.05, 0.2, -0.05]].map(([x, y, z], i) => { const c = part(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 14), '#ffd84a', { x, y, z, rx: 0.4 + i * 0.3, rz: i * 0.5, ol: 0.15 }); p.add(c); return c; });
      const rb = new THREE.Group();
      ['#ff5f7e', '#ffc83d', '#7fd36a', '#4aa8de', '#b36bff'].forEach((c, i) => rb.add(part(new THREE.TorusGeometry(0.4 - i * 0.04, 0.02, 6, 30, Math.PI), c, { ol: 0 })));
      rb.position.set(-0.05, 0.05, -0.18); p.add(rb);
      g.add(p);
      return { obj: g, tick: (t) => { p.position.y = Math.sin(t * 1.8) * 0.05 - 0.05; p.rotation.y = Math.sin(t * 0.6) * 0.5; coins.forEach((c, i) => (c.position.y = 0.16 + (i > 2 ? 0.04 : 0) + Math.abs(Math.sin(t * 3 + i)) * 0.02)); } };
    },
    // Las Fallas: ninot (muñeco de cartón cabezón) sobre su base, que se balancea.
    ninotvuela(part) {
      const g = new THREE.Group(), n = new THREE.Group();
      n.add(part(new THREE.CylinderGeometry(0.2, 0.24, 0.1, 18), '#ff9c3d', { y: -0.38, ol: 0.06 }));
      n.add(part(new THREE.CylinderGeometry(0.1, 0.15, 0.24, 14), '#4aa8de', { y: -0.22, ol: 0.07 }));
      n.add(part(new THREE.SphereGeometry(0.22, 18, 14), '#ffe0c4', { y: 0.08, ol: 0.06 }));
      for (const sx of [-1, 1]) n.add(part(new THREE.SphereGeometry(0.025, 8, 6), '#2a1f5c', { x: sx * 0.07, y: 0.12, z: 0.2, ol: 0 }));
      n.add(part(new THREE.SphereGeometry(0.045, 10, 8), '#ff7a6a', { y: 0.07, z: 0.22, ol: 0.1 }));
      n.add(part(new THREE.TorusGeometry(0.07, 0.014, 6, 14, Math.PI), '#2a1f5c', { y: 0.0, z: 0.2, rz: Math.PI, ol: 0 }));
      for (const sx of [-1, 1]) n.add(part(new THREE.SphereGeometry(0.035, 8, 6), '#ff8a8f', { x: sx * 0.13, y: 0.03, z: 0.17, ol: 0 }));
      n.add(part(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 22), '#e8434f', { y: 0.27, ol: 0.08 }));
      n.add(part(new THREE.CylinderGeometry(0.12, 0.14, 0.14, 16), '#e8434f', { y: 0.35, ol: 0.08 }));
      n.add(part(new THREE.CylinderGeometry(0.142, 0.142, 0.03, 16), '#ffc83d', { y: 0.31, ol: 0 }));
      const arms = [-1, 1].map((sx) => { const a = part(new THREE.CapsuleGeometry(0.035, 0.14, 4, 8), '#4aa8de', { x: sx * 0.15, y: -0.2, rz: sx * 0.9, ol: 0.12 }); n.add(a); return a; });
      g.add(n);
      return { obj: g, tick: (t) => { n.rotation.z = Math.sin(t * 1.6) * 0.1; n.position.y = Math.sin(t * 2) * 0.04; n.rotation.y = Math.sin(t * 0.6) * 0.5; arms.forEach((a, i) => (a.rotation.z = (i ? 1 : -1) * (0.9 + Math.sin(t * 3 + i) * 0.3))); } };
    },
    // Sant Jordi: libro abierto que aletea con sus tapas y una rosa de separador.
    librovuela(part) {
      const g = new THREE.Group(), b = new THREE.Group();
      b.add(part(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), '#c22c3c', { rx: Math.PI / 2, ol: 0.1 }));
      const halves = [-1, 1].map((sx) => {
        const h = new THREE.Group();
        h.add(part(new THREE.BoxGeometry(0.3, 0.02, 0.42), '#e8434f', { x: sx * 0.15, ol: 0.06 }));
        h.add(part(new THREE.BoxGeometry(0.28, 0.04, 0.38), '#fffdf7', { x: sx * 0.15, y: 0.03, ol: 0.04 }));
        b.add(h); return [h, sx];
      });
      const rose = new THREE.Group();
      rose.add(part(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6), '#3f9a46', { y: 0.1, ol: 0.2 }));
      rose.add(part(new THREE.SphereGeometry(0.06, 12, 10).scale(1, 1.15, 1), '#e8434f', { y: 0.22, ol: 0.1 }));
      rose.add(part(new THREE.SphereGeometry(0.03, 8, 6).scale(1.6, 0.5, 0.8), '#5fbf5a', { x: 0.03, y: 0.1, rz: -0.5, ol: 0.15 }));
      rose.position.set(0, 0.05, 0.05); b.add(rose);
      b.rotation.x = 0.5; g.add(b);
      return { obj: g, tick: (t) => { halves.forEach(([h, sx]) => (h.rotation.z = sx * (0.25 + Math.sin(t * 4) * 0.25))); b.position.y = Math.sin(t * 2) * 0.05; b.rotation.y = Math.sin(t * 0.7) * 0.5; } };
    },
    // Día del Rey: zueco de madera naranja con aspas de molino que giran arriba.
    zuecovuela(part) {
      const g = new THREE.Group(), z = new THREE.Group();
      z.add(part(new THREE.CapsuleGeometry(0.13, 0.36, 6, 14).rotateZ(Math.PI / 2).scale(1, 0.8, 0.9), '#ff9c3d', { ol: 0.06 }));
      z.add(part(new THREE.SphereGeometry(0.1, 14, 10).scale(1.2, 0.5, 1), '#5a3218', { x: -0.08, y: 0.09, ol: 0.05 }));
      z.add(part(new THREE.SphereGeometry(0.04, 10, 8).scale(1, 0.6, 1), '#ffc83d', { x: 0.2, y: 0.09, ol: 0.12 }));
      z.add(part(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), '#a86a3a', { x: 0.05, y: 0.2, ol: 0.2 }));
      const blades = new THREE.Group();
      for (let k = 0; k < 4; k++) blades.add(part(new THREE.BoxGeometry(0.05, 0.2, 0.01), '#fffdf7', { x: Math.cos((k / 4) * TAU) * 0.1, y: Math.sin((k / 4) * TAU) * 0.1, rz: (k / 4) * TAU - Math.PI / 2, ol: 0.1 }));
      blades.position.set(0.05, 0.31, 0.02); z.add(blades);
      g.add(z);
      return { obj: g, tick: (t) => { blades.rotation.z = -t * 3; z.position.y = Math.sin(t * 1.8) * 0.05; z.rotation.y = Math.sin(t * 0.6) * 0.6; z.rotation.z = Math.sin(t * 1.4) * 0.08; } };
    },
    // Midsommar: palo de flores con sus dos coronas de hojas y listones que giran.
    palovuela(part) {
      const g = new THREE.Group(), p = new THREE.Group();
      p.add(part(new THREE.CylinderGeometry(0.025, 0.03, 0.8, 8), '#5fbf5a', { ol: 0.12 }));
      p.add(part(new THREE.CylinderGeometry(0.02, 0.02, 0.44, 8).rotateZ(Math.PI / 2), '#5fbf5a', { y: 0.2, ol: 0.15 }));
      for (const sx of [-1, 1]) {
        p.add(part(new THREE.TorusGeometry(0.08, 0.02, 8, 18), '#3f9a46', { x: sx * 0.2, y: 0.12, ol: 0.12 }));
        const f = flower(part, sx > 0 ? '#ff9cc8' : '#ffd84a', 0.025); f.position.set(sx * 0.2, 0.04, 0.03); p.add(f);
      }
      const top = flower(part, '#fffdf7', 0.035); top.position.set(0, 0.42, 0.02); p.add(top);
      const ribbons = ['#ff5f7e', '#ffd84a', '#4aa8de'].map((c, i) => { const r = part(new THREE.BoxGeometry(0.02, 0.32, 0.008), c, { ol: 0.12 }); p.add(r); return r; });
      p.add(part(new THREE.CylinderGeometry(0.1, 0.13, 0.04, 14), '#a86a3a', { y: -0.41, ol: 0.1 }));
      g.add(p);
      return { obj: g, tick: (t) => {
        ribbons.forEach((r, i) => { const a = t * 1.4 + (i / 3) * TAU; r.position.set(Math.cos(a) * 0.08, 0.22, Math.sin(a) * 0.08); r.rotation.z = Math.cos(a) * 0.4; r.rotation.x = -Math.sin(a) * 0.4; });
        p.rotation.y = t * 0.4; p.position.y = Math.sin(t * 1.6) * 0.04;
      } };
    },
    // Fiesta de los Globos (14 nov 2026, el usuario escogió el racimo: el de un globo repetía al «Globo» de la tienda):
    // tres globitos de gajos de distintos colores amarrados a una sola canasta, cada uno meciéndose a su ritmo.
    globoaerovuela(part, toon) {
      const g = new THREE.Group(), all = new THREE.Group();
      const ink = new THREE.MeshBasicMaterial({ color: '#2a1f5c', side: THREE.BackSide });
      const sets = [[-0.2, 0.2, 0.15, ['#ff5f7e', '#fff6e6']], [0, 0.34, 0.18, ['#ffd84a', '#4aa8de']], [0.2, 0.18, 0.14, ['#7fd36a', '#b36bff']]];
      const balloons = sets.map(([x, y, r, cols]) => {
        const sw = new THREE.Group(), bl = new THREE.Group();
        const o = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14).scale(1, 1.15, 1), ink); o.scale.setScalar(1.07); bl.add(o);
        for (let k = 0; k < 6; k++) bl.add(new THREE.Mesh(new THREE.SphereGeometry(r, 5, 14, (k / 6) * TAU, TAU / 6).scale(1, 1.15, 1), toon({ color: cols[k % 2] })));
        bl.add(part(new THREE.ConeGeometry(r * 0.45, r * 0.5, 12, 1, true).rotateX(Math.PI), cols[0], { y: -r * 1.2, ol: 0.06, mat: toon({ color: cols[0], side: THREE.DoubleSide }) }));
        // Cada uno gira desde la canasta (y = -0.3), así su cuerda nunca se despega.
        bl.position.set(x, y + 0.3, 0); sw.position.y = -0.3;
        const from = new THREE.Vector3(x, y + 0.3 - r * 1.4, 0), to = new THREE.Vector3(0, 0, 0), len = from.distanceTo(to);
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len, 4), new THREE.MeshBasicMaterial({ color: '#83501a' }));
        rope.position.copy(from).add(to).multiplyScalar(0.5); rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), from.clone().sub(to).normalize());
        sw.add(rope, bl); all.add(sw); return sw;
      });
      all.add(part(new THREE.CylinderGeometry(0.09, 0.07, 0.1, 14), '#c98a4b', { y: -0.35, ol: 0.12 }));
      all.add(part(new THREE.TorusGeometry(0.09, 0.015, 6, 16).rotateX(Math.PI / 2), '#a86a3a', { y: -0.3, ol: 0 }));
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 10), glow('#ffb13d', 0.9)); flame.position.y = -0.25; all.add(flame);
      g.add(all);
      return { obj: g, tick: (t) => {
        balloons.forEach((sw, i) => { sw.rotation.z = Math.sin(t * 1.3 + i * 2.1) * 0.08; sw.scale.y = 1 + Math.sin(t * 1.7 + i * 1.3) * 0.03; });
        all.position.y = Math.sin(t * 1.1) * 0.05; all.rotation.y = Math.sin(t * 0.5) * 0.5; flame.scale.set(1, 0.8 + Math.abs(Math.sin(t * 9)) * 0.5, 1);
      } };
    },
    // Alfombra de Flores: regadera que riega pétalos de colores.
    regaderavuela(part) {
      const g = new THREE.Group(), r = new THREE.Group();
      r.add(part(new THREE.CylinderGeometry(0.16, 0.18, 0.28, 18), '#4aa8de', { ol: 0.06 }));
      r.add(part(new THREE.CylinderGeometry(0.03, 0.04, 0.32, 10), '#4aa8de', { x: 0.24, y: 0.08, rz: -1, ol: 0.1 }));
      r.add(part(new THREE.CylinderGeometry(0.06, 0.035, 0.04, 12), '#2f86c0', { x: 0.37, y: 0.17, rz: -1, ol: 0.1 }));
      r.add(part(new THREE.TorusGeometry(0.1, 0.022, 8, 16, Math.PI), '#2f86c0', { x: -0.08, y: 0.14, rz: 0.3, ol: 0.12 }));
      const f = flower(part, '#ff7ab8', 0.03); f.position.set(0, 0, 0.18); r.add(f);
      const pet = drops(g, ['#ff7ab8', '#ffc83d', '#ff6a5a', '#b36bff'], 6, 0.028, 0.4);
      r.rotation.z = 0.25; g.add(r);
      return { obj: g, tick: (t) => { r.position.y = Math.sin(t * 1.8) * 0.04; r.rotation.y = Math.sin(t * 0.6) * 0.4; pet(t, 0.42, 0.08, 0.12); } };
    },
    // Regata Histórica: góndola negra con su proa de metal y un remo que rema.
    gondolavuela(part) {
      const g = new THREE.Group(), b = new THREE.Group();
      b.add(part(new THREE.CapsuleGeometry(0.08, 0.62, 6, 14).rotateZ(Math.PI / 2).scale(1, 0.75, 1), '#2a2540', { ol: 0.06 }));
      for (const sx of [-1, 1]) b.add(part(new THREE.SphereGeometry(0.05, 10, 8).scale(1, 2, 0.8), '#2a2540', { x: sx * 0.38, y: 0.08, rz: -sx * 0.5, ol: 0.1 }));
      b.add(part(new THREE.BoxGeometry(0.03, 0.14, 0.06), '#e6e0f0', { x: 0.43, y: 0.19, ol: 0.12 }));
      b.add(part(new THREE.TorusGeometry(0.1, 0.008, 6, 20, Math.PI), '#ffc83d', { y: 0.02, rx: Math.PI / 2, ol: 0 }));
      b.add(part(new THREE.BoxGeometry(0.14, 0.08, 0.1), '#e8434f', { y: 0.06, ol: 0.08 }));
      const oar = new THREE.Group();
      oar.add(part(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), '#c98a4b', { y: -0.1, ol: 0.25 }));
      oar.add(part(new THREE.BoxGeometry(0.06, 0.12, 0.012), '#c98a4b', { y: -0.36, ol: 0.15 }));
      oar.position.set(-0.22, 0.2, 0.1); b.add(oar);
      g.add(b);
      return { obj: g, tick: (t) => { oar.rotation.z = Math.sin(t * 2.4) * 0.5; oar.rotation.x = 0.3 + Math.cos(t * 2.4) * 0.15; b.position.y = Math.sin(t * 1.6) * 0.04; b.rotation.x = Math.sin(t * 1.1) * 0.06; b.rotation.y = Math.sin(t * 0.5) * 0.5; } };
    },
    // Bajada de las vacas: cencerro dorado con su correa roja, flores y el badajo que suena.
    cencerrovuela(part) {
      const g = new THREE.Group(), c = new THREE.Group();
      c.add(part(new THREE.CylinderGeometry(0.14, 0.22, 0.36, 4).rotateY(Math.PI / 4).scale(1, 1, 0.7), '#d8b04a', { ol: 0.06 }));
      c.add(part(new THREE.TorusGeometry(0.12, 0.03, 8, 20, Math.PI), '#e8434f', { y: 0.18, ol: 0.1 }));
      const f1 = flower(part, '#fffdf7', 0.03); f1.position.set(0, 0.02, 0.135); c.add(f1);
      const f2 = flower(part, '#ff7ab8', 0.025); f2.position.set(-0.1, 0.24, 0.02); c.add(f2);
      const clap = new THREE.Group();
      clap.add(part(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6), '#6e66a3', { y: -0.1, ol: 0.2 }));
      clap.add(part(new THREE.SphereGeometry(0.045, 10, 8), '#8f88c0', { y: -0.22, ol: 0.12 }));
      clap.position.y = 0.05; c.add(clap);
      c.scale.setScalar(1.5); g.add(c);
      return { obj: g, tick: (t) => { c.rotation.z = Math.sin(t * 3) * 0.2; clap.rotation.z = Math.sin(t * 3 - 0.8) * 0.4; c.position.y = Math.sin(t * 1.6) * 0.04; c.rotation.y = Math.sin(t * 0.6) * 0.4; } };
    },
    // Festival de Hielo: trineo de hielo con sus patines curvos y cristales que brillan.
    trineohielo(part) {
      const g = new THREE.Group(), s = new THREE.Group();
      s.add(part(new THREE.BoxGeometry(0.5, 0.12, 0.3), '#bfe8ff', { y: 0.02, ol: 0.06 }));
      s.add(part(new THREE.BoxGeometry(0.06, 0.2, 0.3), '#d6f2ff', { x: -0.22, y: 0.14, ol: 0.07 }));
      for (const sz of [-1, 1]) {
        s.add(part(new THREE.BoxGeometry(0.56, 0.02, 0.025), '#5fb6e0', { x: 0.02, y: -0.12, z: sz * 0.13, ol: 0.15 }));
        s.add(part(new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI), '#5fb6e0', { x: 0.3, y: -0.06, z: sz * 0.13, rz: -Math.PI / 2, ol: 0.15 }));
        for (const x of [-0.12, 0.12]) s.add(part(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6), '#5fb6e0', { x, y: -0.07, z: sz * 0.13, ol: 0.2 }));
      }
      const gems = [[-0.08, 0.15, 0], [0.08, 0.16, 0.06], [0.14, 0.14, -0.05]].map(([x, y, z], i) => { const m = part(new THREE.OctahedronGeometry(0.05, 0).scale(1, 1.6, 1), ['#bfe8ff', '#ff9cc8', '#e6f7ff'][i], { x, y, z, ol: 0.12 }); s.add(m); return m; });
      const shine = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), glow('#e6f7ff', 0.15)); s.add(shine);
      g.add(s);
      return { obj: g, tick: (t) => { s.position.y = Math.sin(t * 1.8) * 0.04; s.rotation.y = Math.sin(t * 0.6) * 0.6; s.rotation.z = Math.sin(t * 1.2) * 0.06; gems.forEach((m, i) => (m.rotation.y = t * 1.5 + i)); shine.material.opacity = 0.12 + Math.sin(t * 3) * 0.04; } };
    },
    // Pongal: olla de barro con su espuma de arroz dulce que se desborda.
    ollapongalvuela(part) {
      const g = new THREE.Group(), o = new THREE.Group();
      o.add(part(new THREE.SphereGeometry(0.22, 18, 14).scale(1, 0.85, 1), '#d2694e', { ol: 0.06 }));
      o.add(part(new THREE.TorusGeometry(0.22, 0.012, 6, 28), '#fffdf7', { y: -0.02, rx: Math.PI / 2, ol: 0 }));
      o.add(part(new THREE.CylinderGeometry(0.13, 0.11, 0.06, 16), '#a84a36', { y: 0.19, ol: 0.08 }));
      const foam = [[0, 0.25, 0, 0.09], [-0.08, 0.23, 0.04, 0.06], [0.08, 0.23, -0.03, 0.065], [0.03, 0.27, 0.07, 0.05]].map(([x, y, z, r]) => { const m = part(new THREE.SphereGeometry(r, 10, 8), '#fffdf7', { x, y, z, ol: 0.1 }); o.add(m); return m; });
      const drip = part(new THREE.SphereGeometry(0.03, 8, 6).scale(1, 1.8, 1), '#fffdf7', { x: 0.13, y: 0.14, z: 0.06, ol: 0.15 }); o.add(drip);
      for (const sx of [-1, 1]) o.add(part(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), '#7fae5a', { x: sx * 0.26, y: 0.05, rz: sx * 0.2, ol: 0.15 }));
      const steam = puffs(g);
      g.add(o);
      return { obj: g, tick: (t) => { foam.forEach((m, i) => m.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.1)); drip.position.y = 0.14 - ((t * 0.3) % 1) * 0.1; o.position.y = Math.sin(t * 1.8) * 0.04 - 0.05; o.rotation.y = Math.sin(t * 0.6) * 0.4; steam(t, 0, 0.3); } };
    },
    // Songkran: elefantito que vuela agitando sus orejas y echa agua con la trompa.
    elefantevuela(part) {
      const g = new THREE.Group(), e = new THREE.Group();
      e.add(part(new THREE.SphereGeometry(0.2, 18, 14).scale(1.2, 1, 1), '#a8b4d0', { ol: 0.06 }));
      const head = new THREE.Group();
      head.add(part(new THREE.SphereGeometry(0.15, 16, 12), '#b8c4e0', { ol: 0.07 }));
      for (const sz of [-1, 1]) head.add(part(new THREE.SphereGeometry(0.02, 8, 6), '#2a1f5c', { x: 0.12, y: 0.05, z: sz * 0.06, ol: 0 }));
      const ears = [-1, 1].map((sz) => { const ear = part(new THREE.SphereGeometry(0.11, 12, 10).scale(0.3, 1, 1), '#ffb8c6', { x: -0.02, y: 0.03, z: sz * 0.15, ol: 0.08 }); head.add(ear); return [ear, sz]; });
      const trunk = [0, 1, 2, 3].map((i) => { const m = part(new THREE.SphereGeometry(0.045 - i * 0.006, 10, 8), '#b8c4e0', { ol: 0.12 }); head.add(m); return m; });
      head.add(part(new THREE.TorusGeometry(0.04, 0.012, 6, 12), '#ffc83d', { x: 0.03, y: 0.15, rx: Math.PI / 2, ol: 0.1 }));
      head.position.set(0.24, 0.08, 0); e.add(head);
      for (const [x, z] of [[-0.12, -0.1], [-0.12, 0.1], [0.12, -0.1], [0.12, 0.1]]) e.add(part(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 10), '#a8b4d0', { x, y: -0.2, z, ol: 0.1 }));
      e.add(part(new THREE.BoxGeometry(0.24, 0.02, 0.3), '#e8434f', { y: 0.2, ol: 0.08 }));
      const water = drops(g, ['#8fd6ff', '#5ff0ff', '#fff'], 7, 0.025, 0.5);
      g.add(e);
      return { obj: g, tick: (t) => {
        ears.forEach(([ear, sz]) => (ear.rotation.y = sz * Math.sin(t * 5) * 0.4));
        trunk.forEach((m, i) => m.position.set(0.15 + i * 0.03, -0.04 + i * 0.05 + Math.sin(t * 3 - i * 0.6) * 0.02 * i, 0));
        e.position.y = Math.sin(t * 1.8) * 0.04; e.rotation.y = Math.sin(t * 0.6) * 0.4; water(t, 0.46, 0.3, 0.2);
      } };
    },
    // Kodomo no Hi: koinobori (carpa de tela) que ondea en el viento.
    koinoborivuela(part) {
      const g = new THREE.Group(), segs = [];
      const cols = ['#e8434f', '#e8434f', '#ff5f7e', '#e8434f', '#ff5f7e', '#e8434f'];
      cols.forEach((c, k) => { const s = part(new THREE.CylinderGeometry(0.13 - k * 0.012, 0.13 - (k + 1) * 0.012, 0.1, 16, 1, true).rotateZ(Math.PI / 2), c, { ol: 0.06 }); g.add(s); segs.push(s); });
      const head = new THREE.Group();
      head.add(part(new THREE.TorusGeometry(0.13, 0.02, 8, 20).rotateY(Math.PI / 2), '#ffc83d', { ol: 0.1 }));
      for (const sz of [-1, 1]) {
        head.add(part(new THREE.SphereGeometry(0.045, 10, 8), '#fffdf7', { x: -0.04, y: 0.04, z: sz * 0.11, ol: 0.1 }));
        head.add(part(new THREE.SphereGeometry(0.022, 8, 6), '#2a1f5c', { x: -0.04, y: 0.04, z: sz * 0.14, ol: 0 }));
      }
      g.add(head);
      const tail = new THREE.Group();
      for (const sy of [-1, 1]) tail.add(part(new THREE.ConeGeometry(0.06, 0.16, 4).rotateZ(sy * Math.PI * 0.35), '#ff5f7e', { y: sy * 0.04, ol: 0.1 }));
      g.add(tail);
      return { obj: g, tick: (t) => {
        segs.forEach((s, k) => { s.position.set(-0.26 + k * 0.1, Math.sin(t * 4 - k * 0.7) * 0.03 * k * 0.4, 0); s.rotation.y = Math.sin(t * 4 - k * 0.7) * 0.1; });
        head.position.set(-0.32, 0, 0); tail.position.set(0.36, Math.sin(t * 4 - 4.2) * 0.07, 0); tail.rotation.z = Math.sin(t * 4 - 4.2) * 0.3;
        g.rotation.y = Math.sin(t * 0.5) * 0.4 + Math.PI; g.position.y = Math.sin(t * 1.4) * 0.05;
      } };
    },
    // Pahiyas: casita adornada con hojas de arroz de colores y frutas colgando.
    casitapahiyas(part) {
      const g = new THREE.Group(), h = new THREE.Group();
      h.add(part(new THREE.BoxGeometry(0.4, 0.3, 0.32), '#e8c48a', { y: -0.12, ol: 0.06 }));
      h.add(part(new THREE.ConeGeometry(0.34, 0.24, 4), '#a86a3a', { y: 0.15, ry: Math.PI / 4, ol: 0.06 }));
      h.add(part(new THREE.BoxGeometry(0.1, 0.16, 0.02), '#83501a', { y: -0.19, z: 0.17, ol: 0.1 }));
      const leaves = ['#ff5f7e', '#ffd84a', '#7fd36a', '#4aa8de', '#b36bff', '#ff9c3d'].map((c, i) => { const m = part(new THREE.SphereGeometry(0.035, 8, 6).scale(0.6, 1.5, 0.3), c, { x: -0.16 + i * 0.064, y: 0.02, z: 0.17, ol: 0.12 }); h.add(m); return m; });
      for (const [x, c] of [[-0.12, '#ff9c3d'], [0.12, '#ffd84a']]) h.add(part(new THREE.SphereGeometry(0.04, 10, 8), c, { x, y: -0.06, z: 0.19, ol: 0.12 }));
      g.add(h);
      return { obj: g, tick: (t) => { leaves.forEach((m, i) => (m.rotation.z = Math.sin(t * 2.4 + i) * 0.3)); h.position.y = Math.sin(t * 1.6) * 0.05; h.rotation.y = Math.sin(t * 0.6) * 0.5; } };
    },
    // Tanabata: rama de bambú con papelitos de deseos que se mecen y una estrellita arriba.
    bambuvuela(part) {
      const g = new THREE.Group(), b = new THREE.Group();
      b.add(part(new THREE.CylinderGeometry(0.03, 0.035, 0.8, 8), '#7fd36a', { rz: 0.15, ol: 0.12 }));
      for (const y of [-0.2, 0, 0.2]) b.add(part(new THREE.TorusGeometry(0.034, 0.008, 6, 12), '#3f9a46', { y, x: -y * 0.15, rx: Math.PI / 2, ol: 0 }));
      [[0.1, 0.25, -0.6], [-0.1, 0.1, 0.6], [0.1, -0.05, -0.5]].forEach(([x, y, rz]) => b.add(part(new THREE.SphereGeometry(0.05, 8, 6).scale(2.2, 0.5, 0.4), '#5fbf5a', { x, y, rz, ol: 0.12 })));
      const notes = [[0.14, 0.16, '#ff9cc8'], [-0.16, 0.02, '#ffe27a'], [0.16, -0.12, '#8fd6ff'], [-0.12, -0.22, '#b36bff']].map(([x, y, c]) => { const n = new THREE.Group(); n.add(part(new THREE.BoxGeometry(0.06, 0.14, 0.01), c, { y: -0.07, ol: 0.12 })); n.position.set(x, y, 0.02); b.add(n); return n; });
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), glow('#ffe27a', 0.95)); star.position.set(-0.05, 0.44, 0); b.add(star);
      g.add(b);
      return { obj: g, tick: (t) => { notes.forEach((n, i) => (n.rotation.z = Math.sin(t * 2.2 + i) * 0.25)); star.rotation.y = t * 2; b.position.y = Math.sin(t * 1.6) * 0.05; b.rotation.y = Math.sin(t * 0.5) * 0.6; } };
    },
    // Naadam: yurta blanca con su puerta naranja, franja roja y humito que sale arriba.
    yurtavuela(part) {
      const g = new THREE.Group(), y = new THREE.Group();
      y.add(part(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 24), '#fffdf7', { y: -0.1, ol: 0.06 }));
      y.add(part(new THREE.CylinderGeometry(0.285, 0.285, 0.04, 24), '#e8434f', { y: -0.04, ol: 0 }));
      y.add(part(new THREE.ConeGeometry(0.33, 0.18, 24), '#fffdf7', { y: 0.1, ol: 0.06 }));
      y.add(part(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12), '#e8434f', { y: 0.2, ol: 0.1 }));
      y.add(part(new THREE.BoxGeometry(0.1, 0.16, 0.02), '#ff9c3d', { y: -0.12, z: 0.28, ol: 0.1 }));
      const smoke = puffs(g);
      g.add(y);
      return { obj: g, tick: (t) => { y.position.y = Math.sin(t * 1.6) * 0.05 - 0.05; y.rotation.y = Math.sin(t * 0.6) * 0.6; smoke(t, 0, 0.2); } };
    },
    // Festival del Lodo: cubeta azul llena de lodo que salpica.
    cubetavuela(part) {
      const g = new THREE.Group(), c = new THREE.Group();
      c.add(part(new THREE.CylinderGeometry(0.22, 0.17, 0.32, 20, 1, true), '#4aa8de', { ol: 0.06, mat: new THREE.MeshToonMaterial({ color: '#4aa8de', side: THREE.DoubleSide }) }));
      c.add(part(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20), '#2f86c0', { y: -0.16, ol: 0 }));
      c.add(part(new THREE.CylinderGeometry(0.21, 0.21, 0.04, 20), '#a8764a', { y: 0.12, ol: 0 }));
      c.add(part(new THREE.TorusGeometry(0.22, 0.012, 6, 24, Math.PI), '#8f88c0', { y: 0.16, ol: 0.15 }));
      const blobs = [[0.08, 0.15, 0.06], [-0.1, 0.14, -0.04]].map(([x, y, z]) => { const m = part(new THREE.SphereGeometry(0.05, 10, 8), '#a8764a', { x, y, z, ol: 0.1 }); c.add(m); return m; });
      const mud = drops(g, ['#a8764a', '#7a4a2a', '#c99a6a'], 6, 0.035, 0.45);
      c.rotation.z = 0.3; g.add(c);
      return { obj: g, tick: (t) => { blobs.forEach((m, i) => m.scale.set(1 + Math.sin(t * 3 + i) * 0.15, 1 - Math.sin(t * 3 + i) * 0.15, 1)); c.position.y = Math.sin(t * 1.8) * 0.04; c.rotation.y = Math.sin(t * 0.6) * 0.5; mud(t, -0.1, 0.05, 0.3); } };
    },
    // Medio Otoño: farol de conejo blanco con su lucecita rosa, como los que llevan los niños.
    farolconejo(part) {
      const g = new THREE.Group(), r = new THREE.Group();
      r.add(part(new THREE.SphereGeometry(0.2, 18, 14).scale(1.25, 0.9, 0.9), '#fffdf7', { ol: 0.06 }));
      r.add(part(new THREE.SphereGeometry(0.12, 16, 12), '#fffdf7', { x: 0.2, y: 0.1, ol: 0.07 }));
      for (const sz of [-1, 1]) {
        r.add(part(new THREE.SphereGeometry(0.045, 10, 8).scale(0.6, 2.4, 0.5), '#fffdf7', { x: 0.18, y: 0.27, z: sz * 0.05, rz: 0.2, ol: 0.1 }));
        r.add(part(new THREE.SphereGeometry(0.018, 8, 6), '#e8434f', { x: 0.29, y: 0.13, z: sz * 0.06, ol: 0 }));
      }
      r.add(part(new THREE.SphereGeometry(0.05, 10, 8), '#fffdf7', { x: -0.26, y: 0.04, ol: 0.12 }));
      for (const [x, c] of [[-0.08, '#ff7ab8'], [0.06, '#ffc83d']]) r.add(part(new THREE.SphereGeometry(0.06, 10, 8).scale(1, 1, 0.3), c, { x, y: 0, z: 0.17, ol: 0.1 }));
      for (const x of [-0.12, 0.12]) r.add(part(new THREE.TorusGeometry(0.05, 0.015, 6, 14), '#e8434f', { x, y: -0.19, z: 0.1, ol: 0.12 }));
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), glow('#ffb8d6', 0.2)); r.add(light);
      g.add(r);
      return { obj: g, tick: (t) => { r.position.y = Math.sin(t * 1.5) * 0.05; r.rotation.y = Math.sin(t * 0.6) * 0.6; light.material.opacity = 0.16 + Math.sin(t * 4) * 0.05; } };
    },
    // Banquete de los Monos (rehecho 14 nov 2026: el de antes se veía raro): plátano parado y medio pelado, con su
    // carita en la cáscara; arriba la fruta y tres tiras de cáscara colgando hacia afuera que se mecen.
    platanovuela(part) {
      const g = new THREE.Group(), b = new THREE.Group();
      b.add(part(new THREE.CapsuleGeometry(0.085, 0.16, 6, 14), '#fff3c4', { y: 0.2, ol: 0.07 }));
      b.add(part(new THREE.CapsuleGeometry(0.1, 0.2, 6, 16), '#ffd84a', { y: -0.1, ol: 0.06 }));
      b.add(part(new THREE.CylinderGeometry(0.03, 0.04, 0.08, 8), '#7a5a2a', { y: -0.33, ol: 0.15 }));
      for (const sx of [-1, 1]) b.add(part(new THREE.SphereGeometry(0.018, 8, 6), '#2a1f5c', { x: sx * 0.04, y: -0.07, z: 0.095, ol: 0 }));
      b.add(part(new THREE.TorusGeometry(0.03, 0.009, 6, 12, Math.PI), '#2a1f5c', { y: -0.12, z: 0.096, rz: Math.PI, ol: 0 }));
      for (const sx of [-1, 1]) b.add(part(new THREE.SphereGeometry(0.018, 8, 6), '#ff9c5b', { x: sx * 0.07, y: -0.11, z: 0.08, ol: 0 }));
      const flaps = [0, 1, 2].map((i) => {
        const pivot = new THREE.Group(), hinge = new THREE.Group();
        hinge.add(part(new THREE.SphereGeometry(0.06, 12, 8).scale(1, 2, 0.35), '#ffd84a', { y: -0.1, ol: 0.08 }));
        hinge.add(part(new THREE.SphereGeometry(0.018, 6, 6), '#7a5a2a', { y: -0.21, ol: 0 }));
        hinge.position.z = 0.085; pivot.add(hinge); pivot.rotation.y = (i / 3) * TAU + 0.5; pivot.position.y = 0.08; b.add(pivot);
        return hinge;
      });
      b.rotation.z = 0.18; g.add(b);
      return { obj: g, tick: (t) => { flaps.forEach((h, i) => (h.rotation.x = -0.7 - Math.sin(t * 2.4 + i * 2) * 0.2)); b.position.y = Math.sin(t * 1.8) * 0.05; b.rotation.y = Math.sin(t * 0.7) * 0.6; } };
    },
    // Festival del Cálao: cálao negro con su gran pico amarillo y rojo que aletea.
    calaovuela(part) {
      const g = new THREE.Group(), bird = new THREE.Group();
      bird.add(part(new THREE.SphereGeometry(0.17, 16, 12).scale(1.3, 1, 1), '#2a2540', { ol: 0.06 }));
      bird.add(part(new THREE.SphereGeometry(0.09, 12, 8).scale(1.6, 0.6, 1), '#fffdf7', { x: -0.24, y: -0.02, ol: 0.1 }));
      const head = new THREE.Group();
      head.add(part(new THREE.SphereGeometry(0.11, 14, 12), '#2a2540', { ol: 0.07 }));
      for (const sz of [-1, 1]) {
        head.add(part(new THREE.SphereGeometry(0.03, 8, 6), '#fffdf7', { x: 0.04, y: 0.03, z: sz * 0.09, ol: 0 }));
        head.add(part(new THREE.SphereGeometry(0.016, 8, 6), '#2a1f5c', { x: 0.05, y: 0.03, z: sz * 0.11, ol: 0 }));
      }
      head.add(part(new THREE.ConeGeometry(0.06, 0.28, 12).rotateZ(-Math.PI / 2), '#ffc83d', { x: 0.2, y: -0.02, ol: 0.08 }));
      head.add(part(new THREE.SphereGeometry(0.05, 10, 8).scale(2, 0.8, 0.7), '#e8434f', { x: 0.13, y: 0.07, ol: 0.1 }));
      head.position.set(0.2, 0.1, 0); bird.add(head);
      const wings = [-1, 1].map((sz) => { const w = new THREE.Group(); w.add(part(new THREE.SphereGeometry(0.12, 12, 8).scale(1.2, 0.25, 1), '#2a2540', { z: sz * 0.1, ol: 0.08 })); w.add(part(new THREE.SphereGeometry(0.06, 10, 6).scale(1.2, 0.3, 1), '#fffdf7', { x: -0.06, z: sz * 0.17, ol: 0.1 })); w.position.set(0, 0.06, sz * 0.12); bird.add(w); return [w, sz]; });
      g.add(bird);
      return { obj: g, tick: (t) => { wings.forEach(([w, sz]) => (w.rotation.x = sz * Math.sin(t * 6) * 0.6)); bird.position.y = Math.sin(t * 3) * 0.04; bird.rotation.y = Math.sin(t * 0.6) * 0.5; head.rotation.z = Math.sin(t * 1.5) * 0.08; } };
    },
  };
}
