// Disfraces 3D, tanda H (10 nov 2026): exclusivos de eventos y festividades. Reno, Rey Mago, Cupido, Catarina, Foca
// playera, Chihuahua charro, Gato brujo, Loro pirata y Meteorín. Ver js/avatar3d.js: export default (H) => ({ clave:
// { name, moves, sleeve, hood | wig, build } }). Cabeza de radio ~0.27 en el origen de head; el torso arranca en y ≈ -0.25.
export default (H) => {
  const { THREE, TAU, flat, shirt, starGeo, hoodCap, onCap, belly, neckRing } = H;
  const INK = '#2a1f5c', Z = new THREE.Vector3(0, 0, 1);
  // Pega una pieza plana a la superficie mirando hacia afuera en la dirección d.
  const stick = (obj, d) => (obj.quaternion.setFromUnitVectors(Z, new THREE.Vector3(d.x, d.y, d.z).normalize()), obj);
  // Banda del gorro (misma inclinación que hoodCap): entre los ángulos t0 y t1 desde arriba (fracciones de π).
  const band = (part, head, color, toon, t0, t1, r = 0.31, ph = [0, TAU]) => {
    const g = new THREE.SphereGeometry(r, 28, 4, ph[0], ph[1], Math.PI * t0, Math.PI * (t1 - t0));
    const b = part(g, color, { rx: -0.75, ol: 0.04, mat: toon({ color, side: THREE.DoubleSide }) });
    head.add(b); return b;
  };
  // Franjas de la playera: bandas de la misma esfera del torso (como el chaleco de la abeja).
  const stripe = (part, torso, color, a, b) => torso.add(part(new THREE.SphereGeometry(0.303, 24, 4, 0, TAU, Math.PI * a, Math.PI * b), color, { y: -0.44, s: [1.15, 0.75, 0.75], ol: 0 }));
  const heartGeo = (s) => {
    const sh = new THREE.Shape();
    sh.moveTo(0, -0.9 * s);
    sh.bezierCurveTo(-1.3 * s, -0.1 * s, -0.9 * s, 0.9 * s, 0, 0.35 * s);
    sh.bezierCurveTo(0.9 * s, 0.9 * s, 1.3 * s, -0.1 * s, 0, -0.9 * s);
    return new THREE.ExtrudeGeometry(sh, { depth: 0.014, bevelEnabled: false }).translate(0, 0, -0.007);
  };
  // Orejas de cono sobre el gorro (gato, chihuahua): exterior del color del gorro, interior rosa.
  const ears = (part, head, color, inner, { x, y, z = 0.04, rz, r = 0.1, h = 0.18 }) => [-1, 1].map((sx) => {
    const e = new THREE.Group();
    e.add(part(new THREE.ConeGeometry(r, h, 4), color, { ol: 0.1, s: [1, 1, 0.55] }));
    e.add(part(new THREE.ConeGeometry(r * 0.6, h * 0.66, 4), inner, { y: -0.01, z: 0.035, ol: 0, s: [1, 1, 0.3] }));
    e.position.set(sx * x, y, z); e.rotation.z = -sx * rz;
    head.add(e); return e;
  });
  // Lo que sobresale de tu peinado arriba se esconde para que la corona o la diadema asiente limpio.
  const flatTop = (head, y = 0.2) => { for (const c of head.children) if (c.position.y > y) c.visible = false; };

  return {
    // Reno (Navidad): gorro café con cuernos claros y orejitas, nariz roja que brilla sobre tu nariz y bufanda verde.
    reno: {
      name: 'Reno', hood: true, moves: ['risa', 'asiente', 'saludo'], sleeve: '#a8703f',
      build(part, head, torso, k, toon) {
        const B = this.sleeve, HORN = '#f0d9a8';
        shirt(part, torso, B, k.skin);
        belly(part, torso, '#f2dcb8');
        torso.add(neckRing(part, '#2fae6a', 0.026));
        // Pompón blanco de la bufanda.
        torso.add(part(new THREE.SphereGeometry(0.032, 10, 8), '#fffdf7', { x: 0.08, y: -0.3, z: 0.15, ol: 0.15 }));
        hoodCap(part, head, B, toon);
        // Cuernos: rama principal y dos puntas, hacia afuera.
        const horns = [-1, 1].map((sx) => {
          const g = new THREE.Group(); g.position.set(sx * 0.12, 0.25, -0.02); g.rotation.z = -sx * 0.4;
          g.add(part(new THREE.CapsuleGeometry(0.022, 0.13, 4, 8), HORN, { y: 0.08, ol: 0.14 }));
          g.add(part(new THREE.CapsuleGeometry(0.017, 0.06, 4, 8), HORN, { x: sx * 0.035, y: 0.1, rz: -sx * 1.0, ol: 0.16 }));
          g.add(part(new THREE.CapsuleGeometry(0.017, 0.05, 4, 8), HORN, { x: -sx * 0.03, y: 0.15, rz: sx * 0.9, ol: 0.16 }));
          head.add(g); return g;
        });
        // Orejitas a los lados, hacia afuera.
        const lugs = [-1, 1].map((sx) => {
          const e = part(new THREE.SphereGeometry(0.05, 10, 8), B, { x: sx * 0.27, y: 0.14, z: 0.02, rz: -sx * 1.1, ol: 0.12, s: [0.55, 1.3, 0.5] });
          head.add(e); return e;
        });
        // Nariz roja sobre tu nariz, con brillito; late despacio.
        const noseM = flat('#e8343f');
        const nose = part(new THREE.SphereGeometry(0.026, 14, 10), null, { y: -0.05, z: 0.264, ol: 0.18, mat: noseM });
        const hi = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), flat('#ffffff')); hi.position.set(-0.008, 0.01, 0.022); nose.add(hi);
        head.add(nose);
        const red = new THREE.Color('#e8343f'), glow = new THREE.Color('#ff8a8a');
        return [(f, t) => {
          noseM.color.copy(red).lerp(glow, (Math.sin(t * 3) + 1) * 0.3);
          nose.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
          horns.forEach((g, i) => (g.rotation.z = (i ? -0.4 : 0.4) + Math.sin(t * 1.6 + i) * 0.03 + (f.nod ? Math.sin(t * 9) * 0.04 : 0)));
          lugs.forEach((e, i) => (e.rotation.z = (i ? -1.1 : 1.1) + Math.sin(t * 2.4 + i * 2) * 0.12));
        }];
      },
    },

    // Rey Mago (Reyes): corona dorada con picos y joyas sobre tu pelo, capa roja con cuello de armiño y un cofrecito.
    reymago: {
      name: 'Rey Mago', moves: ['asiente', 'saludo', 'guino'], sleeve: '#7a3fc0',
      build(part, head, torso, k, toon) {
        const GOLD = '#ffc83d', RED = '#c22c49';
        // Capa detrás: más ancha que la túnica, se asoma por los hombros.
        torso.add(part(new THREE.SphereGeometry(0.31, 20, 12), RED, { y: -0.47, z: -0.07, ol: 0.04, s: [1.28, 0.8, 0.7] }));
        shirt(part, torso, this.sleeve, k.skin);
        // Cuello de armiño: blanco con puntitos.
        torso.add(neckRing(part, '#fffdf7', 0.034));
        [-0.06, 0.06].forEach((x) => torso.add(part(new THREE.SphereGeometry(0.009, 6, 4), INK, { x, y: -0.27, z: 0.125, ol: 0 })));
        // Broche con joya y cofrecito dorado.
        torso.add(part(new THREE.SphereGeometry(0.03, 12, 10), '#4aa8de', { y: -0.36, z: 0.215, ol: 0.18 }));
        const box = new THREE.Group(); box.position.set(0.15, -0.4, 0.19); box.rotation.set(-0.3, -0.3, 0);
        box.add(part(new THREE.BoxGeometry(0.075, 0.05, 0.05), '#a86a22', { ol: 0.12 }));
        box.add(part(new THREE.BoxGeometry(0.08, 0.02, 0.055), GOLD, { y: 0.03, ol: 0.14 }));
        torso.add(box);
        // Corona: se asienta sobre el casco del pelo (lo que sobresale arriba se esconde).
        flatTop(head);
        const crown = new THREE.Group(); crown.position.set(0, 0.2, -0.01); crown.rotation.x = -0.18;
        crown.add(part(new THREE.CylinderGeometry(0.205, 0.2, 0.07, 28, 1, true), GOLD, { ol: 0.06, mat: toon({ color: GOLD, side: THREE.DoubleSide }) }));
        const gems = ['#e8343f', '#4aa8de', '#5fbf5a', '#e8343f', '#4aa8de'];
        const spikes = [];
        for (let i = 0; i < 5; i++) {
          const a = Math.PI / 2 + (i - 2) * 0.62; // de frente y hacia los lados
          const x = Math.cos(a) * 0.2, z = Math.sin(a) * 0.2;
          const s = part(new THREE.ConeGeometry(0.035, 0.08, 4), GOLD, { x, y: 0.07, z, ol: 0.12 });
          s.add(part(new THREE.SphereGeometry(0.012, 8, 6), '#fff6c8', { y: 0.045, ol: 0.2 }));
          crown.add(s); spikes.push(s);
          crown.add(part(new THREE.SphereGeometry(0.018, 10, 8), gems[i], { x: x * 1.04, y: 0.0, z: z * 1.04, ol: 0.18, s: [1, 1, 0.6] }));
        }
        head.add(crown);
        return [(f, t) => {
          crown.rotation.z = Math.sin(t * 1.3) * 0.04;
          spikes.forEach((s, i) => (s.children[2].scale.y = 1 + Math.max(0, Math.sin(t * 2 - i * 0.6)) * 0.25));
          box.rotation.z = Math.sin(t * 1.8) * 0.08;
        }];
      },
    },

    // Cupido (amor): diadema rosa con corazón sobre tu pelo, alitas blancas que aletean, túnica clara con banda dorada
    // y su arquito.
    cupido: {
      name: 'Cupido', moves: ['timido', 'guino', 'risa'], sleeve: '#ffd6e6',
      build(part, head, torso, k) {
        const PINK = '#ff5f8e', GOLD = '#ffc83d';
        // Alitas detrás de los hombros: tres plumas por lado.
        const wings = [-1, 1].map((sx) => {
          const w = new THREE.Group(); w.position.set(sx * 0.17, -0.27, -0.12);
          [[0.09, 0.08, 0.1], [0.11, 0.02, 0.085], [0.1, -0.04, 0.07]].forEach(([x, y, r]) => w.add(part(new THREE.SphereGeometry(r, 12, 8), '#fffdf7', { x: sx * x, y, ol: 0.1, s: [1.25, 0.6, 0.3] })));
          torso.add(w); return w;
        });
        shirt(part, torso, this.sleeve, k.skin);
        // Banda dorada en diagonal.
        torso.add(part(new THREE.CapsuleGeometry(0.018, 0.3, 4, 8), GOLD, { y: -0.4, z: 0.19, rx: -0.35, rz: 0.9, ol: 0.14 }));
        // Arquito al lado: arco dorado con su cuerda.
        const bow = new THREE.Group(); bow.position.set(-0.17, -0.38, 0.18); bow.rotation.set(-0.3, 0.3, 0.2);
        bow.add(part(new THREE.TorusGeometry(0.06, 0.008, 6, 16, Math.PI), GOLD, { rz: -Math.PI / 2, ol: 0.25 }));
        const string = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.12, 4), flat(INK)); bow.add(string);
        torso.add(bow);
        // Diadema por encima del pelo y un corazón arriba que late.
        flatTop(head, 0.24);
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.315, 0.017, 6, 28, Math.PI), flat(PINK));
        band.position.set(0, 0.02, 0); band.rotation.x = -0.2; head.add(band);
        const heart = part(heartGeo(0.06), PINK, { y: 0.34, z: 0.06, rx: -0.2, ol: 0.15 });
        head.add(heart);
        return [(f, t) => {
          wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * (0.15 + Math.abs(Math.sin(t * 7)) * 0.25)));
          heart.scale.setScalar(1 + Math.abs(Math.sin(t * 4)) * 0.12 + (f.blush ? 0.08 : 0));
          bow.rotation.z = 0.2 + Math.sin(t * 1.5) * 0.06;
        }];
      },
    },

    // Catarina (primavera): gorro rojo con puntitos negros, frente negra y antenas de bolita; playera roja con puntos.
    catarina: {
      name: 'Catarina', hood: true, moves: ['timido', 'risa', 'cachetes'], sleeve: '#e8343f',
      build(part, head, torso, k, toon) {
        const R = this.sleeve, K2 = '#2e2a3a';
        shirt(part, torso, R, k.skin);
        [[-0.13, -0.38, 0.19], [0.12, -0.42, 0.19], [0.0, -0.46, 0.21]].forEach(([x, y, z]) => torso.add(part(new THREE.SphereGeometry(0.03, 10, 8), K2, { x, y, z, ol: 0, s: [1, 1, 0.4] })));
        torso.add(neckRing(part, K2, 0.022));
        hoodCap(part, head, R, toon);
        // Frente negra (la "cabecita" de la catarina) en la orilla del gorro y la raya del caparazón.
        band(part, head, K2, toon, 0.55, 0.62, 0.309, [Math.PI / 2 - 0.9, 1.8]);
        for (const ph of [Math.PI / 2, -Math.PI / 2]) band(part, head, K2, toon, 0, 0.55, 0.311, [ph - 0.05, 0.1]);
        // Puntitos negros del gorro.
        [[-0.13, 0.26, 0.15], [0.13, 0.26, 0.15], [-0.25, 0.12, 0.08], [0.25, 0.12, 0.08], [-0.12, 0.3, -0.05], [0.12, 0.3, -0.05]].forEach(([x, y, z]) => {
          const p = onCap(x, y, z, 0.312);
          head.add(stick(part(new THREE.CylinderGeometry(0.038, 0.038, 0.012, 14), K2, { ...p, ol: 0 }), p));
          head.children.at(-1).rotateX(Math.PI / 2);
        });
        const ants = [-1, 1].map((sx) => {
          const g = new THREE.Group(); const p = onCap(sx * 0.3, 1, 0.25, 0.3); g.position.set(p.x, p.y, p.z);
          g.add(part(new THREE.CylinderGeometry(0.009, 0.009, 0.1, 6), K2, { y: 0.05, ol: 0.25 }));
          g.add(part(new THREE.SphereGeometry(0.03, 10, 8), K2, { y: 0.11, ol: 0.18 }));
          g.rotation.set(0.2, 0, -sx * 0.45);
          head.add(g); return g;
        });
        return [(f, t) => ants.forEach((g, i) => {
          const sx = i ? 1 : -1;
          g.rotation.z = -sx * (0.45 + Math.sin(t * 2.6 + i) * 0.12 + (f.laugh ? Math.sin(t * 12) * 0.1 : 0));
        })];
      },
    },

    // Foca playera (verano): gorro gris de foca con bigotitos y naricita, lentes de sol rosas en la frente, aletas en
    // los hombros que saludan y collar de flores.
    foca: {
      name: 'Foca playera', hood: true, moves: ['risa', 'saludo', 'bostezo'], sleeve: '#9aa8bc',
      build(part, head, torso, k, toon) {
        const G = this.sleeve, D = '#6f7d93';
        shirt(part, torso, G, k.skin);
        belly(part, torso, '#d8e0ea');
        // Collar de flores (lei).
        const lei = ['#ff5f7e', '#ffc83d', '#ff9cc8', '#5fd1c5', '#ff9c5b', '#b48cff'];
        for (let i = 0; i < 9; i++) {
          const u = (i / 8) * 2 - 1; // de un hombro al otro, en U sobre el pecho
          torso.add(part(new THREE.SphereGeometry(0.028, 8, 6), lei[i % lei.length], { x: u * 0.15, y: -0.3 - (1 - u * u) * 0.06, z: 0.17 + (1 - u * u) * 0.04, ol: 0.15 }));
        }
        // Aletas en los hombros.
        const flips = [-1, 1].map((sx) => {
          const g = new THREE.Group(); g.position.set(sx * 0.27, -0.33, 0.06);
          g.add(part(new THREE.SphereGeometry(0.06, 12, 8), D, { y: -0.05, ol: 0.12, s: [0.7, 1.3, 0.4] }));
          torso.add(g); return g;
        });
        hoodCap(part, head, G, toon);
        // Carita de foca arriba del gorro: ojitos, naricita y bigotes.
        for (const sx of [-1, 1]) {
          const p = onCap(sx * 0.1, 0.3, 0.12, 0.31);
          head.add(part(new THREE.SphereGeometry(0.02, 8, 6), INK, { ...p, ol: 0 }));
        }
        const np = onCap(0, 0.25, 0.2, 0.312);
        head.add(part(new THREE.SphereGeometry(0.026, 10, 8), INK, { ...np, ol: 0, s: [1.3, 0.9, 0.7] }));
        // Lentes de sol en la frente, sobre el gorro: dos micas oscuras con armazón rosa.
        const shades = new THREE.Group();
        const sp = onCap(0, 0.17, 0.24, 0.318); shades.position.set(sp.x, sp.y, sp.z); shades.rotation.x = -0.6;
        for (const sx of [-1, 1]) {
          shades.add(part(new THREE.CylinderGeometry(0.048, 0.048, 0.012, 18), '#ff5f7e', { x: sx * 0.06, rx: Math.PI / 2, ol: 0.12 }));
          const lens = new THREE.Mesh(new THREE.CircleGeometry(0.036, 18), flat('#2e2a5a')); lens.position.set(sx * 0.06, 0, 0.008); shades.add(lens);
          const glint = new THREE.Mesh(new THREE.CircleGeometry(0.009, 8), flat('#bfe8ff')); glint.position.set(sx * 0.06 - 0.015, 0.014, 0.01); shades.add(glint);
        }
        shades.add(part(new THREE.BoxGeometry(0.03, 0.01, 0.01), '#ff5f7e', { ol: 0.2 }));
        head.add(shades);
        return [(f, t) => {
          // Las aletas aplauden un poquito (más al reír).
          flips.forEach((g, i) => (g.rotation.z = (i ? -1 : 1) * (0.2 + Math.sin(t * (f.laugh ? 12 : 3)) * (f.laugh ? 0.25 : 0.1))));
          shades.rotation.z = Math.sin(t * 1.4) * 0.05;
        }];
      },
    },

    // Chihuahua charro (fiestas patrias): gorro beige de chihuahua con orejotas, sombrero charro con galón dorado y
    // sarape de rayas.
    chihuahua: {
      name: 'Chihuahua charro', hood: true, moves: ['sorpresa', 'asiente', 'lengua'], sleeve: '#c98a4a',
      build(part, head, torso, k, toon) {
        const T = this.sleeve, HAT = '#3a2a4a', GOLD = '#ffc83d';
        shirt(part, torso, T, k.skin);
        // Sarape: franjas de colores sobre la playera.
        [['#e8343f', 0.2, 0.06], ['#ffc83d', 0.27, 0.04], ['#2fae6a', 0.32, 0.05], ['#ff5fae', 0.38, 0.04]].forEach(([c, a, b]) => stripe(part, torso, c, a, b));
        hoodCap(part, head, T, toon);
        // Orejotas hacia los lados, debajo del ala.
        const er = ears(part, head, T, '#ffb3d1', { x: 0.28, y: 0.12, z: 0.02, rz: 1.15, r: 0.12, h: 0.24 });
        // Sombrero charro: ala ancha con orilla dorada y copa alta.
        const hat = new THREE.Group(); hat.position.y = 0.24; hat.rotation.x = -0.12;
        hat.add(part(new THREE.CylinderGeometry(0.3, 0.29, 0.022, 36), HAT, { ol: 0.05 }));
        hat.add(part(new THREE.TorusGeometry(0.295, 0.012, 6, 36), GOLD, { rx: Math.PI / 2, ol: 0.15 }));
        hat.add(part(new THREE.CylinderGeometry(0.1, 0.16, 0.16, 24), HAT, { y: 0.09, ol: 0.07 }));
        hat.add(part(new THREE.CylinderGeometry(0.162, 0.162, 0.03, 24, 1, true), GOLD, { y: 0.03, ol: 0.1 }));
        for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; hat.add(part(new THREE.SphereGeometry(0.012, 6, 4), GOLD, { x: Math.cos(a) * 0.23, y: 0.014, z: Math.sin(a) * 0.23, ol: 0.2 })); }
        head.add(hat);
        return [(f, t) => {
          er.forEach((e, i) => (e.rotation.z = (i ? -1 : 1) * (1.15 + Math.sin(t * 2.3 + i) * 0.08 + (f.back ? 0.2 : 0))));
          hat.rotation.z = Math.sin(t * 1.1) * 0.04;
          hat.position.y = 0.24 + (f.back ? 0.015 : 0);
        }];
      },
    },

    // Gato brujo (Halloween): gorro de gato negro con orejas y sombrero de bruja morado de punta doblada, con hebilla;
    // collar naranja con lunita.
    gatobruja: {
      name: 'Gato brujo', hood: true, moves: ['guino', 'lengua', 'sorpresa'], sleeve: '#3a3450',
      build(part, head, torso, k, toon) {
        const B = this.sleeve, P = '#7a4ad8', OR = '#ff9c2b';
        shirt(part, torso, '#6a3fa0', k.skin);
        torso.add(neckRing(part, OR, 0.022));
        const moon = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.01, 6, 14, Math.PI * 1.3), flat('#ffd23d'));
        moon.position.set(0, -0.31, 0.15); moon.rotation.z = 0.6; torso.add(moon);
        hoodCap(part, head, B, toon);
        const er = ears(part, head, B, '#ffb3d1', { x: 0.24, y: 0.19, z: 0.04, rz: 0.85, r: 0.09, h: 0.17 });
        // Sombrero de bruja: ala, cono con punta doblada y cinta con hebilla dorada.
        const hat = new THREE.Group(); hat.position.set(0, 0.25, -0.01); hat.rotation.x = -0.14;
        hat.add(part(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 32), P, { ol: 0.06 }));
        hat.add(part(new THREE.CylinderGeometry(0.06, 0.15, 0.15, 20), P, { y: 0.085, ol: 0.07 }));
        const tip = new THREE.Group(); tip.position.y = 0.16;
        tip.add(part(new THREE.ConeGeometry(0.06, 0.1, 16), P, { y: 0.04, ol: 0.09 }));
        hat.add(tip);
        hat.add(part(new THREE.CylinderGeometry(0.152, 0.152, 0.03, 20, 1, true), OR, { y: 0.03, ol: 0.1 }));
        hat.add(part(new THREE.BoxGeometry(0.04, 0.034, 0.01), '#ffd23d', { y: 0.03, z: 0.153, ol: 0.15 }));
        head.add(hat);
        return [(f, t) => {
          tip.rotation.z = -0.7 + Math.sin(t * 1.8) * 0.12;
          er.forEach((e, i) => (e.rotation.z = (i ? -1 : 1) * 0.85 - (i && t % 4.1 < 0.25 ? Math.sin((t % 4.1) * 25) * 0.2 : 0)));
          moon.rotation.z = 0.6 + Math.sin(t * 2) * 0.2;
        }];
      },
    },

    // Loro pirata: gorro verde de loro con pico amarillo y ojitos, plumas de colores en los hombros y sombrero pirata
    // negro con orilla dorada y calaverita.
    loro: {
      name: 'Loro pirata', hood: true, moves: ['risa', 'lengua', 'guino'], sleeve: '#2fae4a',
      build(part, head, torso, k, toon) {
        const G = this.sleeve, Y = '#ffd23d', HAT = '#2e2a3a', GOLD = '#ffc83d';
        // Plumas de colores detrás de los hombros (como alas).
        const wings = [-1, 1].map((sx) => {
          const w = new THREE.Group(); w.position.set(sx * 0.18, -0.29, -0.1);
          [['#e8343f', 0.07, 0.05], ['#ffd23d', 0.1, 0.0], ['#4aa8de', 0.11, -0.05]].forEach(([c, x, y]) => w.add(part(new THREE.CapsuleGeometry(0.022, 0.08, 4, 8), c, { x: sx * x, y, rz: sx * 1.2, ol: 0.14 })));
          torso.add(w); return w;
        });
        shirt(part, torso, G, k.skin);
        belly(part, torso, '#ffe066');
        hoodCap(part, head, G, toon);
        // Pico curvo amarillo sobre la frente del gorro y ojitos a los lados.
        const bp = onCap(0, 0.2, 0.24, 0.31);
        const beak = new THREE.Group(); beak.position.set(bp.x, bp.y + 0.01, bp.z); beak.rotation.x = 0.35;
        beak.add(part(new THREE.SphereGeometry(0.045, 14, 10), Y, { ol: 0.12, s: [1, 0.8, 1.1] }));
        beak.add(part(new THREE.ConeGeometry(0.03, 0.06, 10), '#ff9c2b', { y: -0.035, z: 0.03, rx: Math.PI + 0.6, ol: 0.14 }));
        head.add(beak);
        for (const sx of [-1, 1]) {
          const p = onCap(sx * 0.13, 0.24, 0.17, 0.31);
          const e = part(new THREE.SphereGeometry(0.03, 10, 8), '#fffdf7', { ...p, ol: 0.15, s: [1, 1, 0.5] });
          e.add(new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), flat(INK))); e.children.at(-1).position.z = 0.025;
          head.add(e);
        }
        // Sombrero pirata (bicornio): silueta de media luna de frente, orilla dorada y calaverita al centro.
        const hat = new THREE.Group(); hat.position.set(0, 0.24, 0.0); hat.rotation.x = -0.2;
        const sh = new THREE.Shape();
        sh.moveTo(-0.27, 0); sh.quadraticCurveTo(-0.2, 0.2, 0, 0.19); sh.quadraticCurveTo(0.2, 0.2, 0.27, 0); sh.quadraticCurveTo(0, 0.07, -0.27, 0);
        hat.add(part(new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: false }).translate(0, 0, -0.035), HAT, { ol: 0.05 }));
        const trim = new THREE.Shape();
        trim.moveTo(-0.27, 0); trim.quadraticCurveTo(0, 0.07, 0.27, 0); trim.lineTo(0.25, 0.03); trim.quadraticCurveTo(0, 0.1, -0.25, 0.03);
        hat.add(part(new THREE.ExtrudeGeometry(trim, { depth: 0.074, bevelEnabled: false }).translate(0, 0, -0.037), GOLD, { ol: 0 }));
        const skull = part(new THREE.SphereGeometry(0.03, 12, 10), '#fffdf7', { y: 0.12, z: 0.04, ol: 0.15, s: [1, 1, 0.5] });
        for (const sx of [-1, 1]) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), flat(INK)); d.position.set(sx * 0.011, 0.004, 0.026); skull.add(d); }
        for (const r of [0.6, -0.6]) hat.add(part(new THREE.CapsuleGeometry(0.008, 0.06, 3, 6), '#fffdf7', { y: 0.12, z: 0.035, rz: r, ol: 0.2 }));
        hat.add(skull);
        head.add(hat);
        return [(f, t) => {
          wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * (0.1 + Math.abs(Math.sin(t * (f.laugh ? 14 : 4))) * 0.2)));
          beak.rotation.x = 0.35 + (f.mouth === 'open' || f.mouth === 'tongue' ? Math.abs(Math.sin(t * 10)) * 0.15 : 0);
          hat.rotation.z = Math.sin(t * 1.2) * 0.05;
        }];
      },
    },

    // Meteorín (lluvia de meteoritos): casco de roca espacial con cráteres y una melena de llamas que titila arriba;
    // traje oscuro con grietas que brillan.
    meteorin: {
      name: 'Meteorín', hood: true, moves: ['sorpresa', 'cachetes', 'risa'], sleeve: '#4a3f5e',
      build(part, head, torso, k, toon) {
        const S = this.sleeve, ROCK = '#8a7b8f', CR = '#6a5c70';
        shirt(part, torso, S, k.skin);
        // Grietas que brillan en el pecho.
        const crackM = flat('#ff9c2b');
        [[-0.08, -0.37, 0.6], [0.05, -0.4, -0.5], [0.12, -0.35, 0.3]].forEach(([x, y, rz]) => torso.add(part(new THREE.BoxGeometry(0.07, 0.012, 0.01), null, { x, y, z: 0.205, rx: -0.35, rz, ol: 0, mat: crackM })));
        hoodCap(part, head, ROCK, toon);
        // Cráteres del casco.
        [[-0.17, 0.2, 0.12, 0.04], [0.15, 0.25, 0.06, 0.03], [0.21, 0.08, -0.08, 0.035], [-0.2, 0.06, -0.12, 0.03]].forEach(([x, y, z, r]) => {
          const p = onCap(x, y, z, 0.308);
          const c = stick(part(new THREE.CylinderGeometry(r, r * 0.8, 0.012, 14), CR, { ...p, ol: 0.15 }), p);
          c.rotateX(Math.PI / 2); head.add(c);
        });
        // Bultos de roca (el casco no es un gorro liso).
        [[-0.1, 0.27, 0.12, 0.05], [0.2, 0.18, 0.05, 0.045], [-0.24, 0.12, 0.0, 0.04], [0.08, 0.22, 0.2, 0.035]].forEach(([x, y, z, r]) => head.add(part(new THREE.IcosahedronGeometry(r, 0), ROCK, { ...onCap(x, y, z, 0.3), ol: 0.12, s: [1, 0.8, 0.7] })));
        // Melena de llamas: conos naranjas con su corazón amarillo, de la coronilla hacia atrás y a los lados.
        const flames = [[0, 0.27, -0.03, 0.09, 0.15, 0], [-0.1, 0.26, -0.05, 0.075, 0.14, 0.5], [0.1, 0.26, -0.05, 0.075, 0.14, -0.5], [-0.19, 0.2, -0.08, 0.06, 0.11, 0.95], [0.19, 0.2, -0.08, 0.06, 0.11, -0.95], [-0.06, 0.24, -0.16, 0.07, 0.13, 0.25], [0.06, 0.24, -0.16, 0.07, 0.13, -0.25]].map(([x, y, z, r, h, rz]) => {
          const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(-0.3, 0, rz);
          g.add(part(new THREE.ConeGeometry(r, h, 14), null, { y: h / 2, ol: 0.1, mat: flat('#ff6a1a') }));
          g.add(part(new THREE.ConeGeometry(r * 0.6, h * 0.65, 12), null, { y: h * 0.33, z: r * 0.5, ol: 0, mat: flat('#ffe066') }));
          head.add(g); return g;
        });
        return [(f, t) => {
          flames.forEach((g, i) => {
            g.scale.y = 1 + Math.sin(t * 9 + i * 1.7) * 0.12 + Math.sin(t * 23 + i) * 0.05 + (f.puff ? 0.15 : 0);
            g.scale.x = g.scale.z = 1 + Math.sin(t * 11 + i) * 0.05;
          });
          crackM.color.setHSL(0.08, 1, 0.55 + Math.sin(t * 4) * 0.08);
        }];
      },
    },
  };
};
