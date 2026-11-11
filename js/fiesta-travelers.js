// Naves 3D de las festividades nuevas (10 nov 2026; datos en fiesta-art.js y FIESTAS de events.js). Mismo estilo que
// travelers.js: material toon con contorno de tinta, ~1 de alto, centradas en el origen. Cada una: { obj, tick(t) }.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const glow = (color, opacity = 0.85) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
// Hélice de 2 aspas (gira en tick).
function propeller(part, color = '#ff5f7e', r = 0.18) {
  const p = new THREE.Group();
  p.add(part(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 8), '#8f88c0', { y: -0.04, ol: 0.2 }));
  for (const a of [0, Math.PI]) p.add(part(new THREE.SphereGeometry(r / 2, 10, 6).scale(1, 0.12, 0.35), color, { x: (Math.cos(a) * r) / 2, z: (Math.sin(a) * r) / 2, ry: -a, ol: 0.15 }));
  return p;
}
// Confeti o chispas que salen y se apagan (k piezas, colores), para las que echan algo al volar.
function sparks(g, colors, n = 6, size = 0.035) {
  const out = Array.from({ length: n }, (_, k) => { const m = new THREE.Mesh(new THREE.BoxGeometry(size, size * 0.6, size * 0.2), glow(colors[k % colors.length], 0.95)); g.add(m); return m; });
  return (t, x0 = 0, y0 = -0.3) => out.forEach((m, k) => {
    const p = (t * 0.5 + k / n) % 1;
    m.position.set(x0 + Math.sin(k * 2.3) * 0.25 * p, y0 - p * 0.45, Math.cos(k * 1.7) * 0.15 * p);
    m.rotation.set(t * 3 + k, t * 2, 0);
    m.material.opacity = 0.95 * (1 - p);
  });
}

export function fiestaModels() {
  return {
    // Día de la Bandera (11 nov 2026, pedido del usuario: usar la bandera así puede ser problema): tambor de la escolta
    // que vuela (cuerpo verde, parches blancos y aros rojos) con sus dos baquetas que tocan. Sin bandera ni escudo.
    astabandera(part) {
      const g = new THREE.Group(), d = new THREE.Group();
      d.add(part(new THREE.CylinderGeometry(0.26, 0.26, 0.3, 28), '#2f9e5c', { ol: 0.06 }));
      for (const y of [-0.155, 0.155]) {
        d.add(part(new THREE.CylinderGeometry(0.275, 0.275, 0.05, 28), '#e8434f', { y, ol: 0.08 }));
        d.add(part(new THREE.CylinderGeometry(0.245, 0.245, 0.02, 28), '#fffdf7', { y: y * 1.18, ol: 0 }));
      }
      // Cordones en zigzag alrededor del cuerpo.
      for (let k = 0; k < 8; k++) d.add(part(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 4), '#ffc83d', { x: Math.cos((k / 8) * TAU) * 0.262, z: Math.sin((k / 8) * TAU) * 0.262, rx: Math.sin((k / 8) * TAU) * 0.5, rz: -Math.cos((k / 8) * TAU) * 0.5, ol: 0 }));
      d.rotation.x = 0.35;
      g.add(d);
      const sticks = [-1, 1].map((sx) => {
        const st = new THREE.Group();
        st.add(part(new THREE.CylinderGeometry(0.014, 0.018, 0.34, 8), '#c98a4a', { y: 0.17, ol: 0.15 }));
        st.add(part(new THREE.SphereGeometry(0.035, 10, 8), '#fffdf7', { y: 0.35, ol: 0.15 }));
        st.position.set(sx * 0.12, 0.32, 0.12); g.add(st); return st;
      });
      return { obj: g, tick: (t) => {
        sticks.forEach((st, i) => (st.rotation.x = -0.6 + Math.max(0, Math.sin(t * 6 + i * Math.PI)) * 0.7));
        d.position.y = Math.sin(t * 1.6) * 0.04; g.rotation.y = Math.sin(t * 0.6) * 0.35;
      } };
    },
    // Equinoccio: serpiente emplumada de luz que ondula (cuerpo de bolitas verdes y su penacho).
    serpientevuela(part) {
      const g = new THREE.Group(), segs = [];
      for (let k = 0; k < 9; k++) { const s = part(new THREE.SphereGeometry(0.075 - k * 0.004, 12, 10), k % 2 ? '#3f9a46' : '#5fbf5a', { ol: 0.08 }); g.add(s); segs.push(s); }
      const head = new THREE.Group();
      head.add(part(new THREE.SphereGeometry(0.11, 14, 12).scale(1.2, 0.9, 1), '#5fbf5a', { ol: 0.08 }));
      for (const sx of [-1, 1]) head.add(part(new THREE.SphereGeometry(0.025, 8, 6), '#2a1f5c', { x: 0.08, y: 0.04, z: sx * 0.06, ol: 0 }));
      ['#e8434f', '#2fbf9a', '#ffc83d', '#2fbf9a', '#e8434f'].forEach((c, i) => head.add(part(new THREE.SphereGeometry(0.03, 8, 6).scale(1, 2.6, 0.5), c, { x: -0.04, y: 0.12, z: -0.08 + i * 0.04, rx: (i - 2) * 0.35, ol: 0.15 })));
      g.add(head);
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), glow('#fff3a8', 0.18)); g.add(light);
      return { obj: g, tick: (t) => {
        segs.forEach((s, k) => s.position.set(-0.36 + k * 0.08, Math.sin(t * 3 - k * 0.7) * 0.08, Math.cos(t * 3 - k * 0.7) * 0.05));
        head.position.set(0.38, Math.sin(t * 3 + 0.7) * 0.08, Math.cos(t * 3 + 0.7) * 0.05); head.rotation.z = Math.sin(t * 3) * 0.2;
        light.material.opacity = 0.14 + Math.sin(t * 2) * 0.06; g.rotation.y = Math.sin(t * 0.5) * 0.4;
      } };
    },
    // Las Posadas: piñata de siete picos que gira colgando de su cuerda.
    pinatavuela(part) {
      const g = new THREE.Group(), p = new THREE.Group();
      p.add(part(new THREE.SphereGeometry(0.2, 18, 14), '#ff5fa8', { ol: 0.06 }));
      p.add(part(new THREE.TorusGeometry(0.2, 0.018, 8, 28), '#ffe27a', { rx: Math.PI / 2, ol: 0.1 }));
      const cols = ['#ffc83d', '#ff5f7e', '#4aa8de', '#7fd36a', '#b36bff', '#ff9c3d', '#5fd1f0'];
      cols.forEach((c, i) => {
        const a = (i / 7) * TAU, d = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.9, Math.sin(a * 2) * 0.35).normalize();
        const cone = part(new THREE.ConeGeometry(0.06, 0.28, 10), c, { ol: 0.1 });
        cone.position.copy(d.clone().multiplyScalar(0.3)); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); p.add(cone);
        const fr = part(new THREE.SphereGeometry(0.03, 8, 6), '#ff5f7e', { ol: 0.2 }); fr.position.copy(d.clone().multiplyScalar(0.46)); p.add(fr);
      });
      g.add(part(new THREE.CylinderGeometry(0.008, 0.008, 0.4, 6), '#fff6e6', { y: 0.45, ol: 0.3 }));
      g.add(p);
      return { obj: g, tick: (t) => { p.rotation.y = t * 0.9; p.rotation.z = Math.sin(t * 1.6) * 0.15; g.position.y = Math.sin(t * 1.8) * 0.04; } };
    },
    // Alasitas: casita chiquita con techo rojo y un globo que la sube.
    casitavuela(part) {
      const g = new THREE.Group(), h = new THREE.Group();
      h.add(part(new THREE.BoxGeometry(0.4, 0.3, 0.32), '#ffd27a', { y: -0.2, ol: 0.06 }));
      h.add(part(new THREE.ConeGeometry(0.34, 0.24, 4), '#e8434f', { y: 0.07, ry: Math.PI / 4, ol: 0.06 }));
      h.add(part(new THREE.BoxGeometry(0.1, 0.16, 0.02), '#a86a3a', { y: -0.27, z: 0.17, ol: 0.1 }));
      for (const sx of [-1, 1]) h.add(part(new THREE.BoxGeometry(0.08, 0.08, 0.02), '#8fd6ff', { x: sx * 0.12, y: -0.16, z: 0.17, ol: 0.15 }));
      h.add(part(new THREE.CylinderGeometry(0.006, 0.006, 0.3, 6), '#fff6e6', { y: 0.32, ol: 0.3 }));
      const b = part(new THREE.SphereGeometry(0.15, 16, 12).scale(1, 1.15, 1), '#7fd36a', { y: 0.55, ol: 0.08 }); h.add(b);
      h.position.y = -0.05; g.add(h);
      return { obj: g, tick: (t) => { h.position.y = -0.05 + Math.sin(t * 1.6) * 0.06; h.rotation.y = Math.sin(t * 0.7) * 0.4; h.rotation.z = Math.sin(t * 1.3) * 0.06; } };
    },
    // Tapati Rapa Nui: canoa polinesia con su flotador lateral y dos remos que reman.
    canoa(part) {
      const g = new THREE.Group(), c = new THREE.Group();
      c.add(part(new THREE.CapsuleGeometry(0.1, 0.6, 6, 14).rotateZ(Math.PI / 2).scale(1, 0.7, 0.9), '#c98a4b', { ol: 0.06 }));
      c.add(part(new THREE.CapsuleGeometry(0.04, 0.4, 4, 10).rotateZ(Math.PI / 2), '#e8c48a', { z: 0.3, y: -0.03, ol: 0.1 }));
      for (const x of [-0.12, 0.12]) c.add(part(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6).rotateX(Math.PI / 2), '#a86a3a', { x, z: 0.15, ol: 0.25 }));
      const oars = [-0.15, 0.15].map((x) => { const o = new THREE.Group(); o.add(part(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), '#a86a3a', { y: -0.1, ol: 0.25 })); o.add(part(new THREE.BoxGeometry(0.06, 0.1, 0.012), '#ff5f7e', { y: -0.28, ol: 0.15 })); o.position.set(x, 0.12, -0.12); c.add(o); return o; });
      c.add(part(new THREE.SphereGeometry(0.06, 10, 8), '#ff5f7e', { x: 0.36, y: 0.05, ol: 0.15 }));
      g.add(c);
      return { obj: g, tick: (t) => { oars.forEach((o, i) => (o.rotation.z = Math.sin(t * 4 + i) * 0.6)); c.position.y = Math.sin(t * 2) * 0.05; c.rotation.x = Math.sin(t * 1.5) * 0.08; c.rotation.y = Math.sin(t * 0.6) * 0.5; } };
    },
    // Carnaval: carroza de colores con su antifaz al frente que echa confeti.
    carroza(part) {
      const g = new THREE.Group(), c = new THREE.Group();
      c.add(part(new THREE.BoxGeometry(0.62, 0.18, 0.34), '#8a5cf0', { y: -0.14, ol: 0.06 }));
      c.add(part(new THREE.BoxGeometry(0.66, 0.04, 0.38), '#ffc83d', { y: -0.04, ol: 0.08 }));
      const wheels = [-0.22, 0.22].flatMap((x) => [-0.18, 0.18].map((z) => { const w = part(new THREE.TorusGeometry(0.07, 0.025, 8, 16), '#ff5f7e', { x, y: -0.24, z, ol: 0.12 }); c.add(w); return w; }));
      const mask = new THREE.Group();
      mask.add(part(new THREE.SphereGeometry(0.2, 18, 12).scale(1.2, 0.55, 0.4), '#8a5cf0', { ol: 0.08 }));
      for (const sx of [-1, 1]) mask.add(part(new THREE.SphereGeometry(0.05, 10, 8).scale(1.2, 0.8, 0.4), '#2a1f5c', { x: sx * 0.1, z: 0.07, ol: 0 }));
      ['#ffc83d', '#ff5f7e', '#5fd1f0'].forEach((col, i) => mask.add(part(new THREE.SphereGeometry(0.04, 8, 6).scale(1, 3, 0.4), col, { x: -0.1 + i * 0.1, y: 0.18, rz: (1 - i) * 0.4, ol: 0.15 })));
      mask.position.set(0, 0.16, 0.05); c.add(mask);
      const conf = sparks(g, ['#ffc83d', '#ff5f7e', '#5fd1f0', '#7fd36a'], 8);
      g.add(c);
      return { obj: g, tick: (t) => { c.position.y = Math.sin(t * 2) * 0.04; c.rotation.y = Math.sin(t * 0.6) * 0.5; wheels.forEach((w) => (w.rotation.z = -t * 3)); mask.rotation.z = Math.sin(t * 2.4) * 0.12; conf(t, 0, 0.3); } };
    },
    // Día del Boyero: carreta roja pintada con sus dos ruedas que giran.
    carretavuela(part) {
      const g = new THREE.Group(), c = new THREE.Group();
      c.add(part(new THREE.BoxGeometry(0.5, 0.2, 0.3), '#e8434f', { y: 0, ol: 0.06 }));
      c.add(part(new THREE.BoxGeometry(0.52, 0.03, 0.32), '#ffc83d', { y: 0.1, ol: 0.08 }));
      c.add(part(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6).rotateZ(Math.PI / 2), '#a86a3a', { x: 0.45, y: -0.05, ol: 0.25 }));
      const wheels = [-1, 1].map((sz) => {
        const w = new THREE.Group();
        w.add(part(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 24).rotateX(Math.PI / 2), '#e8434f', { ol: 0.06 }));
        for (let k = 0; k < 8; k++) w.add(part(new THREE.BoxGeometry(0.02, 0.16, 0.045), k % 2 ? '#ffc83d' : '#fff6e6', { rz: (k / 8) * TAU, ol: 0 }));
        w.add(part(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 12).rotateX(Math.PI / 2), '#ffc83d', { ol: 0.15 }));
        w.position.set(0, -0.12, sz * 0.18); c.add(w); return w;
      });
      g.add(c);
      return { obj: g, tick: (t) => { wheels.forEach((w) => (w.rotation.z = -t * 2.5)); c.position.y = Math.sin(t * 2) * 0.04; c.rotation.y = Math.sin(t * 0.6) * 0.5; } };
    },
    // Guelaguetza: canasta de flores con su asa que flota meciéndose.
    canastavuela(part) {
      const g = new THREE.Group(), b = new THREE.Group();
      b.add(part(new THREE.CylinderGeometry(0.28, 0.2, 0.22, 20), '#e8b06a', { y: -0.12, ol: 0.06 }));
      for (let k = 0; k < 3; k++) b.add(part(new THREE.TorusGeometry(0.21 + k * 0.03, 0.012, 6, 24), '#c98a3a', { y: -0.2 + k * 0.07, rx: Math.PI / 2, ol: 0 }));
      b.add(part(new THREE.TorusGeometry(0.24, 0.02, 8, 24, Math.PI), '#c98a3a', { y: 0.02, ol: 0.15 }));
      ['#ff5f7e', '#ffc83d', '#b36bff', '#5fd1f0', '#ff9c3d'].forEach((c, i) => {
        const a = (i / 5) * TAU;
        b.add(part(new THREE.SphereGeometry(0.07, 10, 8), c, { x: Math.cos(a) * 0.14, y: 0.02, z: Math.sin(a) * 0.14, ol: 0.12 }));
        b.add(part(new THREE.SphereGeometry(0.025, 8, 6), '#fff6c8', { x: Math.cos(a) * 0.14, y: 0.08, z: Math.sin(a) * 0.14, ol: 0 }));
      });
      g.add(b);
      return { obj: g, tick: (t) => { b.rotation.z = Math.sin(t * 1.6) * 0.15; b.position.y = Math.sin(t * 2) * 0.05; b.rotation.y = t * 0.4; } };
    },
    // Papalotes: barrilete de colores con su cola de moños que ondea.
    barrilete(part) {
      const g = new THREE.Group(), k = new THREE.Group();
      const kite = new THREE.Shape([new THREE.Vector2(0, 0.38), new THREE.Vector2(0.3, 0.08), new THREE.Vector2(0, -0.38), new THREE.Vector2(-0.3, 0.08)]);
      k.add(part(new THREE.ShapeGeometry(kite), '#ff5f7e', { ol: 0.05, mat: new THREE.MeshToonMaterial({ color: '#ff5f7e', side: THREE.DoubleSide }) }));
      k.add(part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0.38), new THREE.Vector2(0.3, 0.08), new THREE.Vector2(0, 0.08)])), '#ffc83d', { z: 0.005, ol: 0, mat: new THREE.MeshToonMaterial({ color: '#ffc83d', side: THREE.DoubleSide }) }));
      k.add(part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, -0.38), new THREE.Vector2(-0.3, 0.08), new THREE.Vector2(0, 0.08)])), '#4aa8de', { z: 0.005, ol: 0, mat: new THREE.MeshToonMaterial({ color: '#4aa8de', side: THREE.DoubleSide }) }));
      const tail = ['#7fd36a', '#b36bff', '#ffc83d', '#ff5f7e'].map((c) => { const m = part(new THREE.SphereGeometry(0.035, 8, 6).scale(1.6, 0.8, 0.4), c, { ol: 0.15 }); k.add(m); return m; });
      g.add(k);
      return { obj: g, tick: (t) => {
        tail.forEach((m, i) => m.position.set(Math.sin(t * 3 - i * 0.8) * 0.06 * (i + 1), -0.46 - i * 0.1, 0));
        k.rotation.z = Math.sin(t * 1.2) * 0.2; k.rotation.y = Math.sin(t * 0.8) * 0.5; k.position.y = Math.sin(t * 1.7) * 0.05 + 0.1;
      } };
    },
    // Dulce de leche: frasco con su tapa azul y una cuchara de hélice arriba.
    frascovuela(part) {
      const g = new THREE.Group(), j = new THREE.Group();
      j.add(part(new THREE.CylinderGeometry(0.2, 0.2, 0.36, 20), '#c98a3a', { ol: 0.06 }));
      j.add(part(new THREE.CylinderGeometry(0.205, 0.205, 0.12, 20, 1, true), '#fff6dc', { y: -0.02, ol: 0, mat: new THREE.MeshToonMaterial({ color: '#fff6dc', side: THREE.DoubleSide }) }));
      j.add(part(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 20), '#4aa8de', { y: 0.22, ol: 0.08 }));
      const spoon = new THREE.Group();
      spoon.add(part(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6), '#e6e0f0', { y: 0.1, ol: 0.25 }));
      for (const a of [0, Math.PI]) spoon.add(part(new THREE.SphereGeometry(0.07, 10, 6).scale(1.4, 0.2, 0.7), '#e6e0f0', { x: Math.cos(a) * 0.1, y: 0.2, z: Math.sin(a) * 0.1, ry: -a, ol: 0.12 }));
      spoon.position.y = 0.25; j.add(spoon);
      g.add(j);
      return { obj: g, tick: (t) => { spoon.rotation.y = t * 10; j.position.y = Math.sin(t * 2) * 0.05 - 0.05; j.rotation.z = Math.sin(t * 1.3) * 0.08; } };
    },
    // Día de la Pupusa: comal redondo con dos pupusas y su vaporcito.
    comalvuela(part) {
      const g = new THREE.Group(), c = new THREE.Group();
      c.add(part(new THREE.CylinderGeometry(0.4, 0.36, 0.06, 28), '#4a4560', { ol: 0.05 }));
      for (const [x, z] of [[-0.14, 0.04], [0.14, -0.04]]) c.add(part(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 20), '#f6dca0', { x, y: 0.06, z, ol: 0.1 }));
      for (const sx of [-1, 1]) c.add(part(new THREE.TorusGeometry(0.05, 0.015, 6, 12, Math.PI), '#4a4560', { x: sx * 0.42, ry: Math.PI / 2, ol: 0.2 }));
      const steam = Array.from({ length: 4 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), glow('#f4f1ff', 0.8)); c.add(m); return m; });
      c.rotation.x = 0.35; g.add(c);
      return { obj: g, tick: (t) => {
        c.position.y = Math.sin(t * 2) * 0.05; c.rotation.y = Math.sin(t * 0.6) * 0.5;
        steam.forEach((m, k) => { const p = (t * 0.45 + k / 4) % 1; m.position.set(Math.sin(p * 6 + k) * 0.08 + (k % 2 ? 0.14 : -0.14), 0.1 + p * 0.45, 0); m.scale.setScalar(0.6 + p); m.material.opacity = 0.8 * (1 - p); });
      } };
    },
    // Día de las Velitas: farol de papel rosa que sube con su lucecita adentro.
    farolvuela(part) {
      const g = new THREE.Group(), f = new THREE.Group();
      f.add(part(new THREE.SphereGeometry(0.24, 18, 14).scale(1, 1.2, 1), '#ff7ab8', { ol: 0.06 }));
      for (let k = 0; k < 6; k++) f.add(part(new THREE.TorusGeometry(0.245, 0.006, 4, 24).scale(1, 1.2, 1), '#ffd0e6', { ry: (k / 6) * Math.PI, ol: 0 }));
      for (const y of [0.3, -0.3]) f.add(part(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16), '#ffc83d', { y, ol: 0.12 }));
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), glow('#ffe58a', 0.22)); f.add(light);
      g.add(f);
      return { obj: g, tick: (t) => { f.position.y = Math.sin(t * 1.4) * 0.07; f.rotation.y = t * 0.5; light.material.opacity = 0.18 + Math.sin(t * 5) * 0.05; } };
    },
    // Año Viejo: monigote de trapo con sombrero que vuela echando chispas como bengala.
    monigotevuela(part) {
      const g = new THREE.Group(), m = new THREE.Group();
      m.add(part(new THREE.CylinderGeometry(0.16, 0.2, 0.32, 14), '#6a8ac8', { y: -0.2, ol: 0.06 }));
      m.add(part(new THREE.SphereGeometry(0.16, 16, 12), '#ffe6c8', { y: 0.08, ol: 0.06 }));
      for (const sx of [-1, 1]) m.add(part(new THREE.SphereGeometry(0.02, 8, 6), '#2a1f5c', { x: sx * 0.06, y: 0.11, z: 0.14, ol: 0 }));
      m.add(part(new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI), '#2a1f5c', { y: 0.05, z: 0.14, rz: Math.PI, ol: 0 }));
      m.add(part(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 20), '#2a2540', { y: 0.22, ol: 0.1 }));
      m.add(part(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 16), '#2a2540', { y: 0.32, ol: 0.1 }));
      m.add(part(new THREE.CylinderGeometry(0.122, 0.122, 0.04, 16), '#e8434f', { y: 0.26, ol: 0 }));
      for (const sx of [-1, 1]) m.add(part(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 6), '#f0d070', { x: sx * 0.22, y: -0.16, rz: sx * 0.9, ol: 0.15 }));
      const sp = sparks(g, ['#ffe27a', '#ffc83d', '#fff6c8'], 8, 0.03);
      g.add(m);
      return { obj: g, tick: (t) => { m.position.y = Math.sin(t * 2) * 0.05; m.rotation.y = Math.sin(t * 0.7) * 0.5; m.rotation.z = Math.sin(t * 1.4) * 0.1; sp(t, 0, -0.35); } };
    },
  };
}
