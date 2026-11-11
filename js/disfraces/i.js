// Disfraces 3D, tanda I (10 nov 2026): exclusivos de las festividades nuevas (fiestas de México y de América). Con
// cariño a cada fiesta, tiernos. Los de personas (abanderado, ekekito, carnavalito, boyerito, danzante) dejan tu
// peinado y le ponen sombrero o tocado; los de "cosa" (piñata, moái, alfajor…) son gorro completo (hood).
// Ver js/avatar3d.js: export default (H) => ({ clave: { name, moves, sleeve, hood | wig, build } }). Cabeza de radio
// ~0.27 en el origen de head; el torso arranca en y ≈ -0.25.
export default (H) => {
  const { THREE, TAU, flat, shirt, hoodCap, onCap, belly, neckRing } = H;
  // Sombrero de ala sobre tu pelo: ala, copa y cinta (como el de g.js).
  const hat = (part, head, { y = 0.27, brim, crown, top = crown * 0.88, h, color, band, tilt = -0.12 }) => {
    const g = new THREE.Group(); g.position.y = y; g.rotation.x = tilt;
    g.add(part(new THREE.CylinderGeometry(brim, brim, 0.022, 32), color, { ol: 0.06 }));
    g.add(part(new THREE.CylinderGeometry(top, crown, h, 24), color, { y: h / 2 + 0.008, ol: 0.07 }));
    if (band) g.add(part(new THREE.CylinderGeometry(crown * 1.01, crown * 1.02, 0.035, 24, 1, true), band, { y: 0.03, ol: 0.08 }));
    head.add(g); return g;
  };
  // Pieza pegada al gorro mirando hacia afuera.
  const stud = (part, head, geo, color, x, y, z, r = 0.31, o = {}) => { const p = onCap(x, y, z, r); const m = part(geo, color, { ...o, x: p.x, y: p.y, z: p.z }); m.lookAt(p.x * 3, p.y * 3, p.z * 3); head.add(m); return m; };
  // Cuernitos o picos alrededor del gorro (para la piñata y el farol).
  const spikes = (part, head, colors, n, len = 0.16, r = 0.3, yMin = 0.1) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU, d = new THREE.Vector3(Math.cos(a), yMin + 0.5 * (i % 2), Math.sin(a) * 0.6 - 0.2).normalize();
    const g = new THREE.Group();
    g.add(part(new THREE.ConeGeometry(0.05, len, 10), colors[i % colors.length], { y: len / 2, ol: 0.1 }));
    g.position.copy(d.clone().multiplyScalar(r)); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); head.add(g); return g;
  });
  return {
    // Abanderado (Día de la Bandera): camisa blanca con banda tricolor cruzada, gorra de escolta verde.
    abanderado: {
      name: 'Abanderado', moves: ['saludo', 'asiente', 'risa'], sleeve: '#fffdf7',
      build(part, head, torso, k) {
        shirt(part, torso, this.sleeve, k.skin);
        ['#2f9e5c', '#fffdf7', '#e8434f'].forEach((c, i) => torso.add(part(new THREE.BoxGeometry(0.05, 0.42, 0.012), c, { x: -0.05 + i * 0.05, y: -0.42, z: 0.205, rz: 0.75, rx: -0.3, ol: 0.1 })));
        const g = hat(part, head, { y: 0.24, brim: 0.2, crown: 0.24, top: 0.26, h: 0.12, color: '#2f6a3a', band: '#ffc83d', tilt: -0.2 });
        g.add(part(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 24, 1, false, -0.9, 1.8), '#1f4a2a', { z: 0.08, ol: 0.08 }));
        const ros = new THREE.Group();
        ros.add(part(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 16).rotateX(Math.PI / 2), '#2f9e5c', { ol: 0.12 }));
        ros.add(part(new THREE.CylinderGeometry(0.03, 0.03, 0.014, 16).rotateX(Math.PI / 2), '#fffdf7', { ol: 0 }));
        ros.add(part(new THREE.CylinderGeometry(0.016, 0.016, 0.016, 12).rotateX(Math.PI / 2), '#e8434f', { ol: 0 }));
        ros.position.set(0.12, -0.33, 0.2); torso.add(ros);
        return [(f, t) => { ros.rotation.z = Math.sin(t * 2) * 0.15; }];
      },
    },
    // Serpiente emplumada (Equinoccio): gorro verde con escamas, colmillitos y penacho de plumas de quetzal.
    serpientita: {
      name: 'Serpiente emplumada', hood: true, moves: ['lengua', 'guino', 'asiente'], sleeve: '#5fbf5a',
      build(part, head, torso, k, toon) {
        shirt(part, torso, this.sleeve, k.skin);
        belly(part, torso, '#c8f0a8');
        hoodCap(part, head, this.sleeve, toon);
        [[-0.15, 0.6, 0.6], [0.15, 0.6, 0.6], [0, 0.85, 0.45], [-0.3, 0.4, 0.4], [0.3, 0.4, 0.4]].forEach(([x, y, z]) => stud(part, head, new THREE.SphereGeometry(0.03, 8, 6).scale(1.2, 1, 0.4), '#3f9a46', x, y, z, 0.31, { ol: 0.1 }));
        const crest = new THREE.Group();
        ['#3f9a46', '#2fbf9a', '#e8434f', '#2fbf9a', '#3f9a46'].forEach((c, i) => crest.add(part(new THREE.SphereGeometry(0.04, 10, 8).scale(0.6, 3, 0.4), c, { x: (i - 2) * 0.06, y: 0.12, rz: -(i - 2) * 0.28, ol: 0.12 })));
        const p = onCap(0, 1, -0.2, 0.3); crest.position.set(p.x, p.y, p.z); head.add(crest);
        for (const sx of [-1, 1]) head.add(part(new THREE.ConeGeometry(0.018, 0.05, 6), '#fffdf7', { x: sx * 0.12, y: 0.19, z: 0.22, rx: Math.PI, ol: 0.15 }));
        return [(f, t) => { crest.rotation.z = Math.sin(t * 2.2) * 0.12 + (f.laugh ? Math.sin(t * 12) * 0.1 : 0); }];
      },
    },
    // Piñatín (Posadas): gorro rosa con los siete picos de colores y sus flecos.
    pinatin: {
      name: 'Piñatín', hood: true, moves: ['risa', 'cachetes', 'saludo'], sleeve: '#ff5fa8',
      build(part, head, torso, k, toon) {
        shirt(part, torso, this.sleeve, k.skin);
        torso.add(part(new THREE.TorusGeometry(0.2, 0.02, 8, 24), '#ffe27a', { y: -0.4, rx: Math.PI / 2 - 0.3, ol: 0.1 }));
        hoodCap(part, head, this.sleeve, toon);
        const sp = spikes(part, head, ['#ffc83d', '#ff5f7e', '#4aa8de', '#7fd36a', '#b36bff', '#ff9c3d', '#5fd1f0'], 7, 0.17);
        return [(f, t) => sp.forEach((g, i) => (g.scale.y = 1 + Math.sin(t * 3 + i) * 0.06 + (f.laugh ? Math.sin(t * 12 + i) * 0.08 : 0)))];
      },
    },
    // Ekekito (Alasitas): chullo de colores con orejeras y pompón; poncho rojo con casitas y billetitos colgando.
    ekekito: {
      name: 'Ekekito', moves: ['saludo', 'risa', 'asiente'], sleeve: '#e8434f',
      build(part, head, torso, k, toon) {
        shirt(part, torso, this.sleeve, k.skin);
        torso.add(part(new THREE.TorusGeometry(0.22, 0.015, 6, 24), '#ffc83d', { y: -0.36, rx: Math.PI / 2 - 0.3, ol: 0.1 }));
        const chullo = new THREE.Group();
        chullo.add(part(new THREE.SphereGeometry(0.3, 26, 12, 0, TAU, 0, Math.PI * 0.52), '#4aa8de', { ol: 0.035, mat: toon({ color: '#4aa8de', side: THREE.DoubleSide }) }));
        [0.12, 0.2].forEach((y, i) => chullo.add(part(new THREE.TorusGeometry(Math.sqrt(0.09 - y * y), 0.015, 6, 28), i ? '#e8434f' : '#ffc83d', { y, rx: Math.PI / 2, ol: 0 })));
        for (const sx of [-1, 1]) chullo.add(part(new THREE.SphereGeometry(0.06, 10, 8).scale(0.6, 1.4, 0.6), '#4aa8de', { x: sx * 0.26, y: -0.1, ol: 0.1 }));
        const pom = part(new THREE.SphereGeometry(0.05, 12, 10), '#ff5f7e', { y: 0.31, ol: 0.1 }); chullo.add(pom);
        chullo.position.y = 0.02; chullo.rotation.x = -0.25; head.add(chullo);
        const goods = [[-0.14, '#ffd27a'], [0.14, '#7fd36a']].map(([x, c]) => { const m = part(new THREE.BoxGeometry(0.06, 0.05, 0.03), c, { x, y: -0.4, z: 0.22, ol: 0.15 }); torso.add(m); return m; });
        return [(f, t) => { pom.position.y = 0.31 + Math.abs(Math.sin(t * 3)) * 0.015; goods.forEach((m, i) => (m.rotation.z = Math.sin(t * 2 + i * 2) * 0.2)); }];
      },
    },
    // Moaicito (Tapati): gorro de piedra gris con su ceja, el sombrerito rojo (pukao) y collar de hibiscos.
    moaisito: {
      name: 'Moaicito', hood: true, moves: ['pensando', 'asiente', 'timido'], sleeve: '#a8a0b8',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#5fd1f0', k.skin);
        ['#ff5f7e', '#ffc83d', '#ff5f7e', '#ff9cc8', '#ff5f7e', '#ffc83d'].forEach((c, i) => { const a = -Math.PI * 0.85 + (i / 5) * Math.PI * 0.7; torso.add(part(new THREE.SphereGeometry(0.035, 10, 8), c, { x: Math.sin(a) * 0.14, y: -0.3 + Math.cos(a) * 0.03, z: 0.13 + Math.cos(a) * 0.05, ol: 0.15 })); });
        hoodCap(part, head, this.sleeve, toon);
        head.add(part(new THREE.BoxGeometry(0.34, 0.035, 0.05), '#857c99', { y: 0.16, z: 0.24, ol: 0.1 }));
        const pukao = part(new THREE.CylinderGeometry(0.13, 0.15, 0.1, 18), '#d2694e', { y: 0.32, z: -0.02, ol: 0.08 }); head.add(pukao);
        return [(f, t) => { pukao.rotation.y = Math.sin(t * 0.8) * 0.15; }];
      },
    },
    // Carnavalito (Carnaval): antifaz morado, corona de plumas de colores y collar de lentejuelas.
    carnavalito: {
      name: 'Carnavalito', moves: ['risa', 'guino', 'saludo'], sleeve: '#ffc83d',
      build(part, head, torso, k, toon) {
        shirt(part, torso, this.sleeve, k.skin);
        torso.add(neckRing(part, '#8a5cf0', 0.025));
        // Antifaz: una franja de esfera justo a la altura de los ojos, al frente.
        head.add(part(new THREE.SphereGeometry(0.285, 26, 6, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.42, Math.PI * 0.15), '#8a5cf0', { ol: 0.03, mat: toon({ color: '#8a5cf0', side: THREE.DoubleSide }) }));
        const plumes = ['#ff5f7e', '#ffc83d', '#5fd1f0', '#7fd36a', '#b36bff'].map((c, i) => {
          const g = new THREE.Group(); g.add(part(new THREE.SphereGeometry(0.035, 10, 8).scale(0.7, 4, 0.4), c, { y: 0.13, ol: 0.12 }));
          g.position.set((i - 2) * 0.07, 0.24, 0.02); g.rotation.z = -(i - 2) * 0.3; head.add(g); return g;
        });
        head.add(part(new THREE.TorusGeometry(0.2, 0.025, 8, 24, Math.PI), '#ffc83d', { y: 0.22, z: 0.02, ol: 0.1 }));
        return [(f, t) => plumes.forEach((g, i) => (g.rotation.z = -(i - 2) * 0.3 + Math.sin(t * 2.4 + i) * 0.08 + (f.laugh ? Math.sin(t * 12 + i) * 0.1 : 0)))];
      },
    },
    // Boyerito (Boyero): sombrero de paja con cinta roja y pañuelo rojo al cuello.
    boyerito: {
      name: 'Boyerito', moves: ['saludo', 'asiente', 'risa'], sleeve: '#fffdf7',
      build(part, head, torso, k) {
        shirt(part, torso, this.sleeve, k.skin);
        const knot = part(new THREE.ConeGeometry(0.09, 0.1, 3), '#e8434f', { y: -0.31, z: 0.15, rx: Math.PI + 0.3, ol: 0.12 }); torso.add(knot);
        torso.add(neckRing(part, '#e8434f', 0.022));
        hat(part, head, { y: 0.27, brim: 0.4, crown: 0.19, top: 0.16, h: 0.14, color: '#f2d58a', band: '#e8434f', tilt: -0.15 });
        return [(f, t) => { knot.rotation.z = Math.sin(t * 2) * 0.15; }];
      },
    },
    // Danzante de Flor de Piña (Guelaguetza): huipil con bordado de flores y tocado de listones de colores.
    chinita: {
      name: 'Danzante de Flor de Piña', moves: ['saludo', 'timido', 'risa'], sleeve: '#fffdf7',
      build(part, head, torso, k) {
        shirt(part, torso, this.sleeve, k.skin);
        ['#ff5f7e', '#ffc83d', '#b36bff', '#5fd1f0', '#7fd36a'].forEach((c, i) => torso.add(part(new THREE.SphereGeometry(0.03, 10, 8), c, { x: -0.12 + i * 0.06, y: -0.33 - (i % 2) * 0.02, z: 0.2, ol: 0.15 })));
        const crown = new THREE.Group();
        ['#ff5f7e', '#ffc83d', '#b36bff', '#5fd1f0'].forEach((c, i) => crown.add(part(new THREE.SphereGeometry(0.055, 12, 10), c, { x: (i - 1.5) * 0.1, y: 0.02, z: Math.cos((i - 1.5) * 0.5) * 0.04, ol: 0.12 })));
        crown.position.set(0, 0.25, 0.06); head.add(crown);
        const ribbons = ['#ff5f7e', '#ffc83d', '#5fd1f0'].map((c, i) => { const r = part(new THREE.BoxGeometry(0.03, 0.3, 0.01), c, { x: -0.06 + i * 0.06, y: -0.05, z: -0.27, ol: 0.1 }); head.add(r); return r; });
        return [(f, t) => ribbons.forEach((r, i) => (r.rotation.z = Math.sin(t * 2.5 + i) * 0.15))];
      },
    },
    // Volantín (Papalotes): gorro en rombo de cuatro colores con su cola de moños atrás.
    volantinito: {
      name: 'Volantín', hood: true, moves: ['risa', 'saludo', 'sorpresa'], sleeve: '#ff5f7e',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#4aa8de', k.skin);
        hoodCap(part, head, this.sleeve, toon);
        const tip = part(new THREE.ConeGeometry(0.07, 0.2, 4), '#ffc83d', { ol: 0.1 }); const p = onCap(0, 1, 0, 0.3); tip.position.set(p.x, p.y + 0.08, p.z); head.add(tip);
        const tail = ['#7fd36a', '#b36bff', '#ffc83d'].map((c, i) => { const m = part(new THREE.SphereGeometry(0.035, 8, 6).scale(1.6, 0.8, 0.4), c, { ol: 0.15 }); head.add(m); return m; });
        return [(f, t) => tail.forEach((m, i) => m.position.set(Math.sin(t * 3 - i) * 0.05, 0.1 - i * 0.12, -0.33 - i * 0.04))];
      },
    },
    // Alfajorcito (Dulce de leche): gorro de chocolate con la orilla de dulce de leche y coco.
    alfajorcito: {
      name: 'Alfajorcito', hood: true, moves: ['cachetes', 'risa', 'lengua'], sleeve: '#7a4a2a',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#f0d0a0', k.skin);
        belly(part, torso, '#c98a3a');
        hoodCap(part, head, this.sleeve, toon);
        head.add(part(new THREE.TorusGeometry(0.29, 0.03, 8, 30), '#c98a3a', { y: 0.06, rx: Math.PI / 2 - 0.75, ol: 0.08 }));
        [[-0.1, 0.8, 0.4], [0.12, 0.75, 0.45], [0, 0.95, 0.1], [-0.25, 0.6, 0.1], [0.25, 0.6, 0.15]].forEach(([x, y, z]) => stud(part, head, new THREE.SphereGeometry(0.014, 6, 4), '#fffdf7', x, y, z, 0.31, { ol: 0 }));
        return [];
      },
    },
    // Pupusita (Pupusa): gorro dorado de masa con sus manchitas tostadas y queso que se asoma.
    pupusita: {
      name: 'Pupusita', hood: true, moves: ['cachetes', 'asiente', 'risa'], sleeve: '#f6dca0',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#3f9a46', k.skin);
        hoodCap(part, head, this.sleeve, toon);
        [[-0.2, 0.7, 0.4], [0.2, 0.6, 0.5], [0, 0.9, 0.2], [-0.3, 0.5, -0.1], [0.3, 0.5, 0], [0.1, 0.8, -0.3]].forEach(([x, y, z], i) => stud(part, head, new THREE.CircleGeometry(0.025 + (i % 3) * 0.008, 10), '#c98a3a', x, y, z, 0.309, { ol: 0, mat: flat('#c98a3a') }));
        const cheese = part(new THREE.SphereGeometry(0.05, 10, 8).scale(1.6, 0.6, 0.5), '#fff6dc', { x: 0.2, y: 0.08, z: 0.22, ol: 0.1 }); head.add(cheese);
        return [(f, t) => { cheese.scale.y = 1 + Math.sin(t * 2) * 0.08; }];
      },
    },
    // Farolín (Velitas): gorro de farol rosa con sus pliegues, tapa dorada y lucecita adentro.
    farolin: {
      name: 'Farolín', hood: true, moves: ['sorpresa', 'risa', 'timido'], sleeve: '#ff7ab8',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#ffc83d', k.skin);
        hoodCap(part, head, this.sleeve, toon);
        for (let i = 0; i < 6; i++) head.add(part(new THREE.TorusGeometry(0.305, 0.006, 4, 24, Math.PI * 0.62), '#ffd0e6', { rx: -0.75 + Math.PI / 2, ry: (i / 6) * Math.PI, ol: 0 }));
        head.add(part(new THREE.CylinderGeometry(0.08, 0.1, 0.06, 16), '#ffc83d', { y: 0.31, ol: 0.1 }));
        const glowM = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffe58a', transparent: true, opacity: 0.15, depthWrite: false }));
        head.add(glowM);
        return [(f, t) => { glowM.material.opacity = 0.12 + Math.sin(t * 4) * 0.04; }];
      },
    },
    // Monigote (Año Viejo): ropa vieja de parches, sombrero negro de copa y pajita que se asoma.
    monigotito: {
      name: 'Monigote', moves: ['risa', 'guino', 'saludo'], sleeve: '#6a8ac8',
      build(part, head, torso, k) {
        shirt(part, torso, this.sleeve, k.skin);
        [[-0.1, -0.4, '#ffc83d'], [0.12, -0.46, '#e8434f']].forEach(([x, y, c]) => torso.add(part(new THREE.BoxGeometry(0.07, 0.06, 0.012), c, { x, y, z: 0.21, rx: -0.3, rz: 0.2, ol: 0.12 })));
        for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) torso.add(part(new THREE.CylinderGeometry(0.006, 0.006, 0.08, 4), '#f0d070', { x: sx * (0.3 + i * 0.01), y: -0.5 + i * 0.03, rz: sx * (0.4 + i * 0.2), ol: 0.3 }));
        const g = hat(part, head, { y: 0.28, brim: 0.26, crown: 0.16, top: 0.17, h: 0.24, color: '#2a2540', band: '#e8434f', tilt: -0.18 });
        return [(f, t) => { g.rotation.z = Math.sin(t * 1.6) * 0.05 + (f.laugh ? Math.sin(t * 12) * 0.08 : 0); }];
      },
    },
  };
};
