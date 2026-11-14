// Disfraces 3D, tanda L (14 nov 2026): exclusivos de las fiestas de Europa y de Oriente. Como la tanda I: los de
// personas (vikingo, duende, holandés, corona de flores, gondolero, salakot, jinete) dejan tu peinado y le ponen
// sombrero o tocado; los de "cosa" o animal son gorro completo (hood).
// Ver js/avatar3d.js: export default (H) => ({ clave: { name, moves, sleeve, hood | wig, build } }). Cabeza de radio
// ~0.27 en el origen de head; el torso arranca en y ≈ -0.25.
export default (H) => {
  const { THREE, TAU, flat, shirt, starGeo, hoodCap, onCap, belly, neckRing } = H;
  // Sombrero de ala sobre tu pelo: ala, copa y cinta (como el de i.js).
  const hat = (part, head, { y = 0.27, brim, crown, top = crown * 0.88, h, color, band, tilt = -0.12 }) => {
    const g = new THREE.Group(); g.position.y = y; g.rotation.x = tilt;
    g.add(part(new THREE.CylinderGeometry(brim, brim, 0.022, 32), color, { ol: 0.06 }));
    g.add(part(new THREE.CylinderGeometry(top, crown, h, 24), color, { y: h / 2 + 0.008, ol: 0.07 }));
    if (band) g.add(part(new THREE.CylinderGeometry(crown * 1.01, crown * 1.02, 0.035, 24, 1, true), band, { y: 0.03, ol: 0.08 }));
    head.add(g); return g;
  };
  // Pieza pegada al gorro mirando hacia afuera.
  const stud = (part, head, geo, color, x, y, z, r = 0.31, o = {}) => { const p = onCap(x, y, z, r); const m = part(geo, color, { ...o, x: p.x, y: p.y, z: p.z }); m.lookAt(p.x * 3, p.y * 3, p.z * 3); head.add(m); return m; };
  // Florecita de 5 bolitas (para coronas y prendedores).
  const flower = (part, c, r = 0.022) => {
    const f = new THREE.Group();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; f.add(part(new THREE.SphereGeometry(r, 8, 6), c, { x: Math.cos(a) * r * 1.2, y: Math.sin(a) * r * 1.2, ol: 0.15 })); }
    f.add(part(new THREE.SphereGeometry(r * 0.8, 8, 6), '#ffd23d', { z: r * 0.4, ol: 0 }));
    return f;
  };
  // Orejas en el gorro (pieza, color de adentro opcional), una a cada lado.
  const ears = (part, head, geo, color, inner, x, y, z, innerGeo) => [-1, 1].map((sx) => {
    const g = new THREE.Group(); g.add(part(geo, color, { ol: 0.08 }));
    if (inner) g.add(part(innerGeo || geo.clone().scale(0.6, 0.7, 0.6), inner, { z: 0.012, ol: 0 }));
    g.position.set(sx * x, y, z); g.rotation.z = -sx * 0.3; head.add(g); return g;
  });
  return {
    // Vikinguito (Up Helly Aa): túnica café con cinturón dorado y casco de cuernos sobre tu pelo.
    vikinguito: {
      name: 'Vikinguito/Vikinguita', moves: ['risa', 'saludo', 'asiente'], sleeve: '#8a5a3a',
      build(part, head, torso, k, toon) {
        shirt(part, torso, this.sleeve, k.skin);
        torso.add(part(new THREE.TorusGeometry(0.2, 0.025, 8, 24), '#ffc83d', { y: -0.5, rx: Math.PI / 2, ol: 0.1 }));
        const h = new THREE.Group();
        h.add(part(new THREE.SphereGeometry(0.3, 26, 12, 0, TAU, 0, Math.PI * 0.5), '#b8c0d8', { ol: 0.035, mat: toon({ color: '#b8c0d8', side: THREE.DoubleSide }) }));
        h.add(part(new THREE.TorusGeometry(0.3, 0.03, 8, 30), '#ffc83d', { rx: Math.PI / 2, ol: 0.08 }));
        h.add(part(new THREE.BoxGeometry(0.03, 0.3, 0.03), '#ffc83d', { y: 0.16, z: 0.13, rx: 0.5, ol: 0.1 }));
        const horns = [-1, 1].map((sx) => { const c = part(new THREE.ConeGeometry(0.05, 0.22, 10), '#fff6e6', { x: sx * 0.3, y: 0.12, rz: -sx * 0.8, ol: 0.1 }); h.add(c); return c; });
        h.position.y = 0.06; h.rotation.x = -0.15; head.add(h);
        return [(f, t) => horns.forEach((c, i) => (c.rotation.z = (i ? -0.8 : 0.8) + (f.laugh ? Math.sin(t * 12 + i) * 0.1 : 0)))];
      },
    },
    // Duendecito (San Patricio): saco verde, sombrero alto verde con hebilla dorada y un trébol en el pecho.
    duendecito: {
      name: 'Duendecito/Duendecita', moves: ['guino', 'risa', 'saludo'], sleeve: '#2f9e5c',
      build(part, head, torso, k) {
        shirt(part, torso, this.sleeve, k.skin);
        const clover = new THREE.Group();
        [0, 1, 2].forEach((i) => { const a = (i / 3) * TAU + Math.PI / 2; clover.add(part(new THREE.SphereGeometry(0.028, 8, 6), '#7fd36a', { x: Math.cos(a) * 0.026, y: Math.sin(a) * 0.026, ol: 0.15 })); });
        clover.position.set(0.12, -0.34, 0.2); torso.add(clover);
        const g = hat(part, head, { y: 0.26, brim: 0.32, crown: 0.17, top: 0.2, h: 0.26, color: '#2f9e5c', band: '#2a2540', tilt: -0.14 });
        g.add(part(new THREE.BoxGeometry(0.08, 0.06, 0.02), '#ffc83d', { y: 0.03, z: 0.18, ol: 0.12 }));
        return [(f, t) => { g.rotation.z = Math.sin(t * 1.4) * 0.06; clover.rotation.z = t * 0.8; }];
      },
    },
    // Ninotito (Fallas): gorro de cartón naranja con manchas de pintura y un sombrerito rojo encima.
    ninotito: {
      name: 'Ninotito', hood: true, moves: ['risa', 'cachetes', 'saludo'], sleeve: '#ff9c3d',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#4aa8de', k.skin);
        torso.add(neckRing(part, '#ffc83d', 0.025));
        hoodCap(part, head, this.sleeve, toon);
        [[-0.2, 0.7, 0.4, '#ff5f7e'], [0.2, 0.6, 0.5, '#7fd36a'], [0, 0.5, -0.6, '#ffd84a'], [-0.35, 0.4, -0.1, '#4aa8de'], [0.35, 0.4, 0, '#b36bff']].forEach(([x, y, z, c]) => stud(part, head, new THREE.CircleGeometry(0.035, 12), c, x, y, z, 0.309, { ol: 0, mat: flat(c) }));
        const top = new THREE.Group();
        top.add(part(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 20), '#e8434f', { ol: 0.08 }));
        top.add(part(new THREE.CylinderGeometry(0.08, 0.09, 0.12, 16), '#e8434f', { y: 0.07, ol: 0.08 }));
        top.add(part(new THREE.CylinderGeometry(0.092, 0.092, 0.025, 16), '#ffc83d', { y: 0.03, ol: 0 }));
        top.position.set(0, 0.32, -0.02); top.rotation.z = 0.2; head.add(top);
        return [(f, t) => { top.rotation.z = 0.2 + Math.sin(t * 2) * 0.08 + (f.laugh ? Math.sin(t * 12) * 0.08 : 0); }];
      },
    },
    // Dragoncito de Sant Jordi: gorro de dragón verde con su cresta de picos amarillos y una rosa en el pecho.
    dragonjordi: {
      name: 'Dragoncito de Sant Jordi', hood: true, moves: ['lengua', 'risa', 'guino'], sleeve: '#5fbf5a',
      build(part, head, torso, k, toon) {
        shirt(part, torso, this.sleeve, k.skin);
        belly(part, torso, '#c8f0a8');
        hoodCap(part, head, this.sleeve, toon);
        const spikes = [0.6, 0.85, 0.9, 0.7, 0.4].map((y, i) => { const z = 0.5 - i * 0.28, p = onCap(0, y, z, 0.3); const c = part(new THREE.ConeGeometry(0.04, 0.1, 8), '#ffd23d', { x: p.x, y: p.y, z: p.z, ol: 0.12 }); c.lookAt(0, p.y * 3, p.z * 3); c.rotateX(Math.PI / 2); head.add(c); return c; });
        for (const sx of [-1, 1]) stud(part, head, new THREE.ConeGeometry(0.03, 0.08, 8).rotateX(Math.PI / 2), '#fff6e6', sx * 0.3, 0.7, 0.3, 0.3, { ol: 0.15 });
        const rose = new THREE.Group();
        rose.add(part(new THREE.SphereGeometry(0.04, 10, 8).scale(1, 1.15, 1), '#e8434f', { ol: 0.12 }));
        rose.add(part(new THREE.SphereGeometry(0.02, 8, 6).scale(1.6, 0.5, 0.6), '#5fbf5a', { x: -0.04, y: -0.03, rz: 0.5, ol: 0.15 }));
        rose.position.set(0.12, -0.33, 0.21); torso.add(rose);
        return [(f, t) => spikes.forEach((c, i) => (c.scale.y = 1 + Math.sin(t * 3 + i) * 0.1))];
      },
    },
    // Holandesito (Día del Rey): suéter naranja, gorrita azul con su pompón y una coronita en el pecho.
    holandesito: {
      name: 'Holandesito/Holandesita', moves: ['saludo', 'risa', 'asiente'], sleeve: '#ff9c3d',
      build(part, head, torso, k) {
        shirt(part, torso, this.sleeve, k.skin);
        torso.add(neckRing(part, '#fffdf7', 0.025));
        const crown = new THREE.Group();
        crown.add(part(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12, 1, true), '#ffc83d', { ol: 0.12 }));
        for (let i = 0; i < 3; i++) crown.add(part(new THREE.ConeGeometry(0.014, 0.035, 6), '#ffc83d', { x: (i - 1) * 0.03, y: 0.03, ol: 0.15 }));
        crown.position.set(0.12, -0.33, 0.2); torso.add(crown);
        const cap = new THREE.Group();
        cap.add(part(new THREE.SphereGeometry(0.3, 24, 10, 0, TAU, 0, Math.PI * 0.42).scale(1.05, 0.8, 1.05), '#2f6aa8', { ol: 0.04 }));
        cap.add(part(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 20, 1, false, -0.9, 1.8), '#1f4a7a', { y: 0.02, z: 0.16, ol: 0.08 }));
        const pom = part(new THREE.SphereGeometry(0.05, 12, 10), '#ff9c3d', { y: 0.25, ol: 0.1 }); cap.add(pom);
        cap.position.y = 0.04; cap.rotation.x = -0.15; head.add(cap);
        return [(f, t) => { pom.position.y = 0.25 + Math.abs(Math.sin(t * 3)) * 0.015; }];
      },
    },
    // Corona de flores (Midsommar): camisa blanca con bordado y una corona de hojas y flores de colores.
    coronadaflor: {
      name: 'Corona de flores', moves: ['timido', 'risa', 'saludo'], sleeve: '#fffdf7',
      build(part, head, torso, k) {
        shirt(part, torso, this.sleeve, k.skin);
        ['#4aa8de', '#ffd84a', '#4aa8de', '#ffd84a', '#4aa8de'].forEach((c, i) => torso.add(part(new THREE.SphereGeometry(0.02, 8, 6), c, { x: -0.1 + i * 0.05, y: -0.31, z: 0.2, ol: 0.15 })));
        const crown = new THREE.Group();
        crown.add(part(new THREE.TorusGeometry(0.27, 0.025, 8, 32), '#3f9a46', { rx: Math.PI / 2, ol: 0.1 }));
        const fl = ['#ff5f7e', '#ffd84a', '#b36bff', '#fffdf7', '#4aa8de', '#ff9cc8', '#ffd84a'].map((c, i) => {
          const a = Math.PI / 2 - Math.PI * 0.6 + (i / 6) * Math.PI * 1.2, f = flower(part, c, 0.028);
          f.position.set(Math.cos(a) * 0.27, 0.02, Math.sin(a) * 0.27); f.lookAt(Math.cos(a) * 2, 0.4, Math.sin(a) * 2); crown.add(f); return f;
        });
        crown.position.y = 0.2; crown.rotation.x = -0.2; head.add(crown);
        return [(f, t) => fl.forEach((m, i) => (m.position.y = 0.02 + Math.sin(t * 2.4 + i) * 0.008))];
      },
    },
    // Globín (Fiesta de los Globos): gorro de globo con gajos de colores y una canastita colgando en el pecho.
    globin: {
      name: 'Globín', hood: true, moves: ['sorpresa', 'risa', 'saludo'], sleeve: '#ff5f7e',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#4aa8de', k.skin);
        hoodCap(part, head, this.sleeve, toon);
        for (const [a, c] of [[0, '#ffd84a'], [Math.PI / 2, '#4aa8de'], [Math.PI / 4, '#7fd36a'], [-Math.PI / 4, '#7fd36a']]) head.add(part(new THREE.TorusGeometry(0.308, 0.02, 6, 30, Math.PI * 0.6), c, { ry: a, rz: Math.PI * 0.2, rx: -0.75 + Math.PI / 2, ol: 0 }));
        const basket = part(new THREE.BoxGeometry(0.08, 0.06, 0.05), '#c98a4b', { y: -0.4, z: 0.2, ol: 0.12 }); torso.add(basket);
        return [(f, t) => { basket.rotation.z = Math.sin(t * 2) * 0.15; }];
      },
    },
    // Begonito (Alfombra de Flores): gorro amarillo con pétalos de begonia alrededor de la cara.
    begonito: {
      name: 'Begonito/Begonita', hood: true, moves: ['timido', 'risa', 'guino'], sleeve: '#ffd23d',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#5fbf5a', k.skin);
        hoodCap(part, head, this.sleeve, toon);
        const pet = Array.from({ length: 8 }, (_, i) => {
          const a = (i / 7) * Math.PI * 1.3 - Math.PI * 0.15, p = new THREE.Vector3(Math.cos(a) * 0.3, Math.sin(a) * 0.3 + 0.02, 0.08);
          const m = part(new THREE.SphereGeometry(0.09, 12, 10).scale(0.6, 1, 0.3), i % 2 ? '#ff6a5a' : '#ff8a6a', { x: p.x, y: p.y, z: p.z, rz: a - Math.PI / 2, ol: 0.08 }); head.add(m); return m;
        });
        return [(f, t) => pet.forEach((m, i) => m.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.05))];
      },
    },
    // Gondolerito (Regata): camiseta de rayas azules y sombrero de paja con cinta roja.
    gondolerito: {
      name: 'Gondolerito/Gondolerita', moves: ['saludo', 'asiente', 'risa'], sleeve: '#fffdf7',
      build(part, head, torso, k) {
        shirt(part, torso, this.sleeve, k.skin);
        for (const y of [-0.34, -0.42, -0.5]) torso.add(part(new THREE.CylinderGeometry(0.205, 0.215, 0.03, 24, 1, true), '#1f4a7a', { y, ol: 0 }));
        const g = hat(part, head, { y: 0.26, brim: 0.38, crown: 0.19, top: 0.19, h: 0.1, color: '#f2d58a', band: '#e8434f', tilt: -0.1 });
        const tails = [-1, 1].map((sx) => { const r = part(new THREE.BoxGeometry(0.03, 0.12, 0.01), '#e8434f', { x: sx * 0.03, y: -0.04, z: -0.2, ol: 0.12 }); g.add(r); return r; });
        return [(f, t) => tails.forEach((r, i) => (r.rotation.z = Math.sin(t * 2.4 + i) * 0.25))];
      },
    },
    // Vaquita alpina (Bajada de las vacas): gorro blanco con manchas, cuernitos, orejas, corona de flores y su cencerro.
    vaquita: {
      name: 'Vaquita alpina', hood: true, moves: ['cachetes', 'asiente', 'timido'], sleeve: '#fffdf7',
      build(part, head, torso, k, toon) {
        shirt(part, torso, this.sleeve, k.skin);
        hoodCap(part, head, this.sleeve, toon);
        [[-0.2, 0.7, 0.3, 0.06], [0.25, 0.5, -0.4, 0.07], [0, 0.6, -0.7, 0.05]].forEach(([x, y, z, r]) => stud(part, head, new THREE.CircleGeometry(r, 14), '#2a2540', x, y, z, 0.309, { ol: 0, mat: flat('#2a2540') }));
        for (const sx of [-1, 1]) stud(part, head, new THREE.ConeGeometry(0.03, 0.08, 8).rotateX(Math.PI / 2), '#fff6e6', sx * 0.22, 0.85, 0.1, 0.3, { ol: 0.15 });
        ears(part, head, new THREE.SphereGeometry(0.06, 10, 8).scale(1.6, 0.6, 0.4), '#fffdf7', '#ffb8c6', 0.31, 0.12, -0.02);
        ['#ff5f7e', '#ffd84a', '#fffdf7', '#b36bff'].forEach((c, i) => { const f = flower(part, c, 0.022), p = onCap(-0.24 + i * 0.16, 0.85, 0.35, 0.31); f.position.set(p.x, p.y, p.z); f.lookAt(p.x * 3, p.y * 3, p.z * 3); head.add(f); });
        const bell = new THREE.Group();
        bell.add(part(new THREE.CylinderGeometry(0.035, 0.055, 0.08, 4).rotateY(Math.PI / 4), '#d8b04a', { y: -0.04, ol: 0.12 }));
        bell.position.set(0, -0.3, 0.2); torso.add(bell);
        torso.add(neckRing(part, '#e8434f', 0.02));
        return [(f, t) => { bell.rotation.z = Math.sin(t * 3) * 0.25; }];
      },
    },
    // Muñequito de hielo (Festival de Hielo): gorro azul hielo con cristales que brillan encima.
    heladito: {
      name: 'Muñequito de hielo', hood: true, moves: ['sorpresa', 'risa', 'bostezo'], sleeve: '#bfe8ff',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#5fb6e0', k.skin);
        hoodCap(part, head, this.sleeve, toon);
        const gems = [[0, 1, 0.1, 0.1], [-0.4, 0.8, 0.1, 0.07], [0.4, 0.8, 0.1, 0.07], [0, 0.7, -0.6, 0.06]].map(([x, y, z, h]) => {
          const p = onCap(x, y, z, 0.3), m = part(new THREE.OctahedronGeometry(0.04, 0).scale(1, h / 0.04, 1), '#e6f7ff', { x: p.x, y: p.y + h * 0.5, z: p.z, ol: 0.12 }); head.add(m); return m;
        });
        const glowM = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), new THREE.MeshBasicMaterial({ color: '#e6f7ff', transparent: true, opacity: 0.14, depthWrite: false }));
        head.add(glowM);
        return [(f, t) => { gems.forEach((m, i) => (m.rotation.y = t * 1.2 + i)); glowM.material.opacity = 0.1 + Math.sin(t * 3) * 0.04; }];
      },
    },
    // Ollita de Pongal: gorro de barro con su franja blanca y la espuma de arroz dulce que se sale por arriba.
    ollita: {
      name: 'Ollita de Pongal', hood: true, moves: ['cachetes', 'risa', 'sorpresa'], sleeve: '#d2694e',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#ffc83d', k.skin);
        hoodCap(part, head, this.sleeve, toon);
        head.add(part(new THREE.TorusGeometry(0.29, 0.018, 6, 30), '#fffdf7', { y: 0.06, rx: Math.PI / 2 - 0.75, ol: 0 }));
        const foam = [[0, 0.32, -0.02, 0.09], [-0.1, 0.3, 0.05, 0.065], [0.1, 0.3, -0.06, 0.07], [0.05, 0.36, 0.06, 0.055]].map(([x, y, z, r]) => { const m = part(new THREE.SphereGeometry(r, 10, 8), '#fffdf7', { x, y, z, ol: 0.1 }); head.add(m); return m; });
        return [(f, t) => foam.forEach((m, i) => m.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.08))];
      },
    },
    // Elefantito (Songkran): gorro gris con orejotas rosas que se agitan y una trompita arriba.
    elefantito: {
      name: 'Elefantito', hood: true, moves: ['risa', 'sorpresa', 'saludo'], sleeve: '#b8c4e0',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#2fa8d8', k.skin);
        hoodCap(part, head, this.sleeve, toon);
        const e = [-1, 1].map((sx) => { const g = new THREE.Group(); g.add(part(new THREE.SphereGeometry(0.14, 14, 10).scale(0.25, 1, 1), '#b8c4e0', { ol: 0.06 })); g.add(part(new THREE.SphereGeometry(0.1, 12, 8).scale(0.2, 1, 1), '#ffb8c6', { x: sx * 0.015, ol: 0 })); g.position.set(sx * 0.33, 0.04, -0.04); head.add(g); return [g, sx]; });
        const trunk = [0, 1, 2].map((i) => { const m = part(new THREE.SphereGeometry(0.04 - i * 0.006, 10, 8), '#b8c4e0', { ol: 0.12 }); head.add(m); return m; });
        torso.add(part(new THREE.TorusGeometry(0.2, 0.02, 6, 24), '#ffc83d', { y: -0.36, rx: Math.PI / 2 - 0.3, ol: 0.1 }));
        return [(f, t) => {
          e.forEach(([g, sx]) => (g.rotation.y = sx * Math.sin(t * 4) * 0.25));
          trunk.forEach((m, i) => m.position.set(0, 0.27 + i * 0.05, 0.2 - i * 0.02 + Math.sin(t * 2 - i) * 0.015 * i));
        }];
      },
    },
    // Carpita (Kodomo no Hi): gorro rojo de carpa con escamas, ojos grandes arriba y su colita atrás.
    carpita: {
      name: 'Carpita', hood: true, moves: ['sorpresa', 'risa', 'cachetes'], sleeve: '#e8434f',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#2f6aa8', k.skin);
        hoodCap(part, head, this.sleeve, toon);
        [[-0.15, 0.6, -0.5], [0.15, 0.6, -0.5], [0, 0.8, -0.3], [-0.3, 0.4, -0.5], [0.3, 0.4, -0.5]].forEach(([x, y, z]) => stud(part, head, new THREE.TorusGeometry(0.035, 0.008, 6, 12, Math.PI), '#ffb0b6', x, y, z, 0.309, { ol: 0 }));
        for (const sx of [-1, 1]) {
          stud(part, head, new THREE.SphereGeometry(0.055, 12, 10), '#fffdf7', sx * 0.18, 0.8, 0.45, 0.3, { ol: 0.1 });
          stud(part, head, new THREE.SphereGeometry(0.028, 10, 8), '#2a1f5c', sx * 0.18, 0.8, 0.5, 0.35, { ol: 0 });
        }
        const tail = new THREE.Group();
        for (const sy of [-1, 1]) tail.add(part(new THREE.ConeGeometry(0.05, 0.14, 4).rotateZ(sy * Math.PI * 0.35), '#ff5f7e', { y: sy * 0.03, ol: 0.1 }));
        tail.position.set(0, 0.05, -0.34); tail.rotation.y = Math.PI / 2; head.add(tail);
        return [(f, t) => { tail.rotation.x = Math.sin(t * 3) * 0.4; }];
      },
    },
    // Niño del salakot (Pahiyas): sombrero de palma en cono y collar de hojas de arroz de colores.
    salakotito: {
      name: 'Niño del salakot/Niña del salakot', moves: ['saludo', 'risa', 'asiente'], sleeve: '#fffdf7',
      build(part, head, torso, k) {
        shirt(part, torso, this.sleeve, k.skin);
        const leaves = ['#ff5f7e', '#ffd84a', '#7fd36a', '#4aa8de', '#b36bff', '#ff9c3d'].map((c, i) => { const a = -Math.PI * 0.85 + (i / 5) * Math.PI * 0.7; const m = part(new THREE.SphereGeometry(0.03, 8, 6).scale(0.6, 1.5, 0.3), c, { x: Math.sin(a) * 0.15, y: -0.3 + Math.cos(a) * 0.03, z: 0.14 + Math.cos(a) * 0.05, ol: 0.15 }); torso.add(m); return m; });
        const s = new THREE.Group();
        s.add(part(new THREE.ConeGeometry(0.42, 0.2, 28), '#e8c48a', { ol: 0.05 }));
        s.add(part(new THREE.TorusGeometry(0.3, 0.012, 6, 28), '#e8434f', { y: -0.04, rx: Math.PI / 2, ol: 0 }));
        s.add(part(new THREE.SphereGeometry(0.04, 10, 8), '#a86a3a', { y: 0.1, ol: 0.12 }));
        s.position.y = 0.33; s.rotation.x = -0.12; head.add(s);
        return [(f, t) => leaves.forEach((m, i) => (m.rotation.z = Math.sin(t * 2 + i) * 0.2))];
      },
    },
    // Estrellita de los deseos (Tanabata): gorro violeta con una estrella grande arriba y papelitos de deseos.
    estrelladeseo: {
      name: 'Estrellita de los deseos', hood: true, moves: ['guino', 'risa', 'timido'], sleeve: '#8a5cf0',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#c9a6ff', k.skin);
        hoodCap(part, head, this.sleeve, toon);
        const star = part(starGeo(0.1, 0.045), '#ffd84a', { y: 0.38, ol: 0.1 }); head.add(star);
        const notes = [['#ff9cc8', -1], ['#8fd6ff', 1]].map(([c, sx]) => { const n = part(new THREE.BoxGeometry(0.04, 0.12, 0.01), c, { x: sx * 0.31, y: -0.02, z: 0.02, ol: 0.12 }); head.add(n); return n; });
        return [(f, t) => { star.rotation.y = Math.sin(t * 1.5) * 0.6; notes.forEach((n, i) => (n.rotation.z = Math.sin(t * 2.4 + i * 2) * 0.25)); }];
      },
    },
    // Jinetito (Naadam): deel azul con faja amarilla y gorro de punta rojo con orilla de piel y borla.
    jinetito: {
      name: 'Jinetito/Jinetita', moves: ['saludo', 'asiente', 'risa'], sleeve: '#2f6aa8',
      build(part, head, torso, k) {
        shirt(part, torso, this.sleeve, k.skin);
        torso.add(part(new THREE.CylinderGeometry(0.21, 0.215, 0.06, 24, 1, true), '#ffc83d', { y: -0.48, ol: 0 }));
        torso.add(part(new THREE.BoxGeometry(0.02, 0.24, 0.012), '#ffc83d', { x: 0.06, y: -0.38, z: 0.2, rz: 0.4, ol: 0.1 }));
        const h = new THREE.Group();
        h.add(part(new THREE.TorusGeometry(0.27, 0.05, 10, 30), '#a8764a', { rx: Math.PI / 2, ol: 0.06 }));
        h.add(part(new THREE.ConeGeometry(0.26, 0.32, 24), '#e8434f', { y: 0.16, ol: 0.05 }));
        const tassel = part(new THREE.SphereGeometry(0.04, 10, 8).scale(1, 1.5, 1), '#ffc83d', { y: 0.34, ol: 0.12 }); h.add(tassel);
        h.position.y = 0.2; h.rotation.x = -0.12; head.add(h);
        return [(f, t) => { tassel.rotation.z = Math.sin(t * 2.4) * 0.3; }];
      },
    },
    // Lodito (Festival del Lodo): gorro de lodo café que escurre y camiseta salpicada.
    lodito: {
      name: 'Lodito', hood: true, moves: ['risa', 'lengua', 'cachetes'], sleeve: '#a8764a',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#fffdf7', k.skin);
        [[-0.1, -0.36, 0.035], [0.08, -0.44, 0.03], [0.14, -0.32, 0.02], [-0.06, -0.5, 0.025]].forEach(([x, y, r]) => torso.add(part(new THREE.SphereGeometry(r, 10, 8).scale(1, 1, 0.3), '#a8764a', { x, y, z: 0.2, ol: 0 })));
        hoodCap(part, head, this.sleeve, toon);
        const dripsM = [-0.22, -0.08, 0.1, 0.24].map((x, i) => { const m = part(new THREE.SphereGeometry(0.03, 8, 6).scale(1, 2, 1), '#a8764a', { x, y: 0.16 - (i % 2) * 0.02, z: 0.22, ol: 0.12 }); head.add(m); return m; });
        stud(part, head, new THREE.SphereGeometry(0.05, 10, 8).scale(1, 0.6, 1), '#c99a6a', 0.1, 1, 0.2, 0.3, { ol: 0.1 });
        return [(f, t) => dripsM.forEach((m, i) => (m.scale.y = 1 + Math.abs(Math.sin(t * 1.5 + i)) * 0.4))];
      },
    },
    // Conejito de la luna (Medio Otoño): gorro blanco con orejas largas y una lunita en el pecho.
    conejitoluna: {
      name: 'Conejito de la luna', hood: true, moves: ['timido', 'cachetes', 'guino'], sleeve: '#fffdf7',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#ffc83d', k.skin);
        hoodCap(part, head, this.sleeve, toon);
        const e = [-1, 1].map((sx) => { const g = new THREE.Group(); g.add(part(new THREE.SphereGeometry(0.06, 12, 10).scale(0.7, 2.6, 0.5), '#fffdf7', { y: 0.12, ol: 0.07 })); g.add(part(new THREE.SphereGeometry(0.035, 10, 8).scale(0.6, 2.6, 0.3), '#ffb8c6', { y: 0.12, z: 0.025, ol: 0 })); g.position.set(sx * 0.1, 0.24, 0); g.rotation.z = -sx * 0.25; head.add(g); return [g, sx]; });
        const moon = part(new THREE.TorusGeometry(0.04, 0.018, 8, 16, Math.PI * 1.3), '#ffd84a', { x: 0.12, y: -0.34, z: 0.21, rz: 0.6, ol: 0.15 }); torso.add(moon);
        return [(f, t) => e.forEach(([g, sx], i) => (g.rotation.z = -sx * 0.25 + Math.sin(t * 2 + i) * 0.08 + (f.laugh ? Math.sin(t * 12 + i) * 0.1 : 0)))];
      },
    },
    // Changuito (Banquete de los Monos): gorro café con orejas redondas y un platanito en el pecho.
    changuito: {
      name: 'Changuito', hood: true, moves: ['risa', 'lengua', 'guino'], sleeve: '#a8764a',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#ffc83d', k.skin);
        hoodCap(part, head, this.sleeve, toon);
        const e = ears(part, head, new THREE.SphereGeometry(0.08, 12, 10).scale(1, 1, 0.4), '#a8764a', '#f0c8a0', 0.31, 0.06, 0);
        stud(part, head, new THREE.SphereGeometry(0.04, 10, 8).scale(1, 1.4, 1), '#a8764a', 0, 1, 0.3, 0.3, { ol: 0.1 });
        const ban = part(new THREE.TorusGeometry(0.05, 0.016, 8, 14, Math.PI * 0.7), '#ffd84a', { x: 0.12, y: -0.34, z: 0.21, rz: 2.4, ol: 0.15 }); torso.add(ban);
        return [(f, t) => e.forEach((g, i) => (g.rotation.y = Math.sin(t * 2.4 + i) * 0.15))];
      },
    },
    // Calaíto (Festival del Cálao): gorro negro con el gran pico amarillo, su casco rojo y plumas blancas.
    calaito: {
      name: 'Calaíto', hood: true, moves: ['sorpresa', 'asiente', 'saludo'], sleeve: '#2a2540',
      build(part, head, torso, k, toon) {
        shirt(part, torso, '#fffdf7', k.skin);
        hoodCap(part, head, this.sleeve, toon);
        const beak = new THREE.Group();
        beak.add(part(new THREE.ConeGeometry(0.06, 0.26, 12).rotateX(Math.PI / 2), '#ffc83d', { z: 0.13, ol: 0.08 }));
        beak.add(part(new THREE.SphereGeometry(0.05, 10, 8).scale(0.8, 0.8, 2), '#e8434f', { y: 0.06, z: 0.07, ol: 0.1 }));
        beak.position.set(0, 0.27, 0.12); beak.rotation.x = -0.25; head.add(beak);
        const fea = [-1, 1].map((sx) => { const m = part(new THREE.SphereGeometry(0.05, 10, 8).scale(0.5, 1.6, 0.4), '#fffdf7', { x: sx * 0.27, y: 0.12, z: -0.1, rz: -sx * 0.5, ol: 0.1 }); head.add(m); return m; });
        return [(f, t) => { beak.rotation.x = -0.25 + Math.sin(t * 1.6) * 0.05; fea.forEach((m, i) => (m.rotation.z = (i ? -0.5 : 0.5) + Math.sin(t * 3 + i) * 0.1)); }];
      },
    },
  };
};
