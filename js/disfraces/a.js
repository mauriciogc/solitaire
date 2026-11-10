// Disfraces 3D, tanda A (10 nov 2026): estrella fugaz, búho, sirena, vampiro, dragoncito, unicornio y ninja.
// Ver js/avatar3d.js: export default (H) => ({ clave: { name, moves, sleeve, hood | wig, build } }).
// hood: gorro (tu pelo no se dibuja) · wig: peluca (el disfraz pone su pelo) · sin ninguno: se ve tu peinado.
const INK = '#2a1f5c';

export default (H) => {
  const { THREE, TAU, flat, shirt, starGeo, cap, fringe, hoodCap, onCap, belly, neckRing } = H;
  // Estrella de 4 picos plana (estrella ninja, brillitos).
  const star4 = (R, r, depth = 0.012) => {
    const sh = new THREE.Shape();
    for (let i = 0; i < 8; i++) { const a = Math.PI / 2 + (i * Math.PI) / 4, q = i % 2 ? r : R; sh[i ? 'lineTo' : 'moveTo'](Math.cos(a) * q, Math.sin(a) * q); }
    return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false }).translate(0, 0, -depth / 2);
  };
  // Algo plano pegado a la superficie de la cabeza en la dirección (x, y, z), a radio r, mirando hacia afuera.
  const Z = new THREE.Vector3(0, 0, 1);
  const stick = (obj, x, y, z, r) => { const d = new THREE.Vector3(x, y, z).normalize(); obj.position.copy(d).multiplyScalar(r); obj.quaternion.setFromUnitVectors(Z, d); return obj; };

  return {
    // Estrella fugaz (Estelita): diadema dorada con una estrella grande que brilla y gira despacio (se ve tu pelo),
    // playera azul noche con estrellitas y una lunita de broche.
    estrella: {
      name: 'Estrella fugaz', moves: ['guino', 'risa', 'saludo'], sleeve: '#2f3f9e',
      build(part, head, torso, k) {
        const N = this.sleeve, Y = '#ffc83d';
        shirt(part, torso, N, k.skin);
        // Estrellitas en la playera.
        [[-0.17, -0.42, 0.17, 0.4], [0.19, -0.45, 0.15, -0.3], [-0.05, -0.5, 0.21, 0.1]].forEach(([x, y, z, rz]) => torso.add(part(starGeo(0.018, 0.008), '#fff1a8', { x, y, z, rx: -0.3, rz, ol: 0 })));
        // Lunita de broche.
        const moon = part(new THREE.TorusGeometry(0.03, 0.013, 6, 14, Math.PI * 1.25), Y, { x: 0.1, y: -0.35, z: 0.215, rx: -0.35, rz: 1.2, ol: 0.2 });
        torso.add(moon);
        // Diadema por encima del pelo y la estrella grande arriba al frente.
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.318, 0.016, 6, 28, Math.PI), flat(Y));
        band.position.set(0, 0.02, 0); band.rotation.x = -0.25; head.add(band);
        const glow = H.flat('#ffe066');
        const st = new THREE.Group(); st.position.set(0, 0.33, 0.1); st.rotation.x = -0.25;
        const big = part(starGeo(0.085, 0.038), null, { ol: 0.14, mat: glow });
        st.add(big);
        const shine = new THREE.Mesh(starGeo(0.035, 0.016), flat('#fffbe0')); shine.position.set(-0.012, 0.012, 0.009); big.add(shine);
        head.add(st);
        const a = new THREE.Color('#ffd23d'), b = new THREE.Color('#fff6b0');
        return [(f, t) => {
          big.rotation.z = Math.sin(t * 0.7) * 0.35;
          const s = 1 + Math.sin(t * 3) * 0.06 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.08 : 0);
          st.scale.setScalar(s);
          glow.color.copy(a).lerp(b, (Math.sin(t * 3) + 1) / 2);
          moon.rotation.z = 1.2 + Math.sin(t * 1.4) * 0.15;
        }];
      },
    },
    // Búho (Ulises): gorro café de búho con orejitas de pluma, lentes redondos alrededor de los ojos (no los tapan),
    // capa de plumas y un librito.
    buho: {
      name: 'Búho', hood: true, moves: ['pensando', 'asiente', 'sorpresa'], sleeve: '#a8764a',
      build(part, head, torso, k, toon) {
        const B = this.sleeve, L = '#e8c89a', D = '#6a4028';
        shirt(part, torso, B, k.skin);
        // Plumas de la capa: escamitas claras en el pecho.
        [[-0.12, -0.38], [0, -0.39], [0.12, -0.38], [-0.06, -0.46], [0.06, -0.46]].forEach(([x, y]) => torso.add(part(new THREE.SphereGeometry(0.045, 10, 8), L, { x, y, z: 0.2, rx: -0.3, ol: 0.12, s: [1, 0.8, 0.35] })));
        hoodCap(part, head, B, toon);
        // Frente más clara en "V" (cara de búho) sobre el gorro.
        for (const sx of [-1, 1]) head.add(part(new THREE.SphereGeometry(0.06, 10, 8), L, { ...onCap(sx * 0.08, 0.2, 0.22, 0.31), rx: -0.8, rz: sx * 0.6, ol: 0.12, s: [1.4, 0.7, 0.3] }));
        // Orejitas de pluma: dos copetes de tres plumas.
        const tufts = [-1, 1].map((sx) => {
          const g = new THREE.Group(); g.position.set(sx * 0.17, 0.23, 0.03);
          [-0.35, 0, 0.35].forEach((a, i) => g.add(part(new THREE.ConeGeometry(0.03, 0.12 - Math.abs(a) * 0.08, 6), i === 1 ? D : B, { x: a * 0.06, y: 0.05, rz: -sx * 0.4 + a * 0.6, ol: 0.15, s: [1, 1, 0.5] })));
          head.add(g); return g;
        });
        // Lentes: aros dorados alrededor de los ojos y su puente.
        const glasses = new THREE.Group();
        for (const sx of [-1, 1]) glasses.add(part(new THREE.TorusGeometry(0.058, 0.009, 6, 22), '#ffc83d', { x: sx * 0.095, y: -0.02, z: 0.252, ry: sx * 0.35, ol: 0.35 }));
        glasses.add(part(new THREE.CylinderGeometry(0.007, 0.007, 0.04, 6), '#ffc83d', { y: 0.005, z: 0.27, rz: Math.PI / 2, ol: 0.3 }));
        head.add(glasses);
        // Librito azul con sus hojas.
        const book = new THREE.Group(); book.position.set(0.14, -0.4, 0.2); book.rotation.set(-0.35, -0.2, -0.25);
        book.add(part(new THREE.BoxGeometry(0.1, 0.075, 0.025), '#4a6ad8', { ol: 0.12 }));
        book.add(part(new THREE.BoxGeometry(0.09, 0.065, 0.027), '#fff6e6', { x: 0.006, ol: 0 }));
        torso.add(book);
        return [(f, t) => {
          tufts.forEach((g, i) => (g.rotation.z = (i ? -1 : 1) * (Math.sin(t * 2 + i) * 0.06 + (f.back ? 0.12 : 0))));
          book.rotation.z = -0.25 + Math.sin(t * 1.3) * 0.05;
        }];
      },
    },
    // Sirena o Tritón (Marina): peluca turquesa larga y ondulada con tiara de conchas, top de escamas y collar de perlas.
    sirena: {
      name: 'Sirena', wig: true, moves: ['saludo', 'guino', 'risa'], sleeve: '#2fbfae',
      build(part, head, torso, k) {
        const T = '#4fd8c8', TD = '#2aa89a', S = this.sleeve;
        shirt(part, torso, S, k.skin);
        // Escamas: medias bolitas claras en el top.
        for (let r = 0; r < 2; r++) for (let i = -2; i <= 2; i++) torso.add(part(new THREE.SphereGeometry(0.03, 8, 6, 0, TAU, 0, Math.PI / 2), '#8ff0e0', { x: i * 0.07 + (r ? 0.035 : 0), y: -0.38 - r * 0.06, z: 0.2 - r * 0.005, rx: Math.PI / 2 - 0.3, ol: 0 }));
        // Collar de perlas.
        for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + (i / 8) * 0.7); torso.add(part(new THREE.SphereGeometry(0.016, 8, 6), '#fff6f0', { x: Math.cos(a) * 0.11, y: -0.27 - Math.sin(a) * 0.035, z: 0.08 + Math.sin(a) * 0.075, ol: 0.2 })); }
        // Peluca: casco, fleco, pelo largo atrás hasta los hombros y ondas a los lados.
        cap(part, head, T);
        fringe(part, head, T, [[-0.13, 0.15, 0.19, 0.5], [-0.03, 0.17, 0.22, 0.25], [0.09, 0.16, 0.21, -0.1]], [1.25, 0.55, 0.7]);
        head.add(part(new THREE.SphereGeometry(0.3, 20, 14), T, { y: -0.15, z: -0.08, s: [1.1, 1.15, 0.75], ol: 0.04 }));
        const waves = [-1, 1].map((sx) => {
          const g = new THREE.Group(); g.position.set(sx * 0.24, -0.02, 0.05);
          [0, 1, 2].forEach((i) => g.add(part(new THREE.SphereGeometry(0.06 - i * 0.004, 12, 8), i % 2 ? TD : T, { x: sx * (i % 2 ? 0.02 : -0.005), y: -0.07 * i, ol: 0.1 })));
          head.add(g); return g;
        });
        // Tiara de conchas: tres abanicos rosados con una perlita.
        const tiara = new THREE.Group();
        [[-0.12, 0.9, 0.42, 0.8], [0, 1, 0.45, 1], [0.12, 0.9, 0.42, 0.8]].forEach(([x, y, z, s]) => {
          const sh = stick(new THREE.Group(), x, y, z, 0.3);
          sh.add(part(new THREE.SphereGeometry(0.045 * s, 10, 6, 0, TAU, 0, Math.PI / 2), '#ffb3d1', { rx: Math.PI / 2, ol: 0.15, s: [1, 1, 0.45] }));
          sh.add(part(new THREE.SphereGeometry(0.012, 6, 5), '#fff6f0', { z: 0.02, ol: 0.2 }));
          tiara.add(sh);
        });
        head.add(tiara);
        return [(f, t) => waves.forEach((g, i) => (g.rotation.z = (i ? -1 : 1) * (Math.sin(t * 2 + i) * 0.06 + (f.laugh ? Math.sin(t * 12) * 0.06 : 0))))];
      },
    },
    // Vampiro o Vampira (Vladi): peluca negra peinada para atrás con pico en la frente, capa negra de cuello alto rojo,
    // camisa blanca con broche rojo y colmillitos que se ven cuando abre la boca.
    vampiro: {
      name: 'Vampiro', wig: true, moves: ['risa', 'guino', 'sorpresa'], sleeve: '#2a2236',
      build(part, head, torso, k, toon) {
        const K = '#2a2236', R = '#c22c49';
        shirt(part, torso, K, k.skin);
        belly(part, torso, '#fff6f0', 0.8);
        torso.add(part(new THREE.OctahedronGeometry(0.03, 0), R, { y: -0.31, z: 0.165, ol: 0.2, s: [1, 1.3, 0.6] }));
        // Cuello alto de la capa: negro por fuera y rojo por dentro, por detrás de la cabeza.
        // (Abierto al frente: de frente se ven las dos puntas rojas a los lados de la cara.)
        const collar = new THREE.Group(); collar.position.set(0, -0.09, -0.03);
        const cg = new THREE.CylinderGeometry(0.36, 0.16, 0.32, 24, 1, true, Math.PI * 0.4, Math.PI * 1.2);
        collar.add(part(cg, K, { ol: 0, mat: toon({ color: K, side: THREE.FrontSide }) }));
        collar.add(part(cg, R, { ol: 0, s: [0.97, 1, 0.97], mat: toon({ color: R, side: THREE.BackSide }) }));
        torso.add(collar);
        // Peluca: casco negro brillante, peinado para atrás, con su pico en la frente.
        cap(part, head, K, 0.288);
        head.add(part(new THREE.ConeGeometry(0.05, 0.09, 4), K, { ...onCap(0, 0.42, 1, 0.255), rx: Math.PI + 0.55, ol: 0.1, s: [1.4, 1, 0.5] }));
        for (const sx of [-1, 1]) head.add(part(new THREE.SphereGeometry(0.08, 10, 8), K, { ...onCap(sx * 0.75, 0.55, 0.5, 0.25), ol: 0.08, s: [0.9, 1.1, 0.6] }));
        head.add(part(new THREE.SphereGeometry(0.035, 8, 6), '#5a4a7a', { ...onCap(-0.35, 0.85, 0.4, 0.29), ol: 0, s: [1.6, 0.5, 0.4] })); // brillo
        // Colmillitos: en la orilla de arriba de la boca abierta; solo se ven cuando ríe o se sorprende.
        const fangs = new THREE.Group(); fangs.position.set(0, -0.083, 0.24); fangs.rotation.x = -0.38;
        for (const sx of [-1, 1]) fangs.add(part(new THREE.ConeGeometry(0.009, 0.022, 6), '#ffffff', { x: sx * 0.024, y: -0.009, rz: Math.PI, ol: 0.25 }));
        head.add(fangs);
        return [(f, t) => {
          fangs.visible = f.mouth === 'open';
          collar.rotation.y = Math.sin(t * 1.2) * 0.04;
        }];
      },
    },
    // Dragoncito (Chispa): gorro rojo con cuernitos y cresta amarilla, mameluco con panza amarilla y alitas que aletean;
    // al inflar los cachetes le sale humito.
    dragoncito: {
      name: 'Dragoncito', hood: true, moves: ['risa', 'cachetes', 'sorpresa'], sleeve: '#ff5a3d',
      build(part, head, torso, k, toon) {
        const R = this.sleeve, Y = '#ffc83d', C = '#fff1d0';
        // Alitas detrás de los hombros (se agregan antes que la playera).
        const wings = [-1, 1].map((sx) => {
          const w = new THREE.Group(); w.position.set(sx * 0.22, -0.27, -0.1);
          const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(sx * 0.1, 0.16, sx * 0.2, 0.15); sh.lineTo(sx * 0.16, 0.08); sh.lineTo(sx * 0.19, 0.03); sh.lineTo(sx * 0.12, 0.01); sh.lineTo(sx * 0.13, -0.05); sh.closePath();
          w.add(part(new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false }), '#c22c49', { z: -0.01, ol: 0.08 }));
          torso.add(w); return w;
        });
        shirt(part, torso, R, k.skin);
        belly(part, torso, Y, 1.05);
        hoodCap(part, head, R, toon);
        // Cuernitos color crema y cresta amarilla por el centro.
        for (const sx of [-1, 1]) head.add(part(new THREE.ConeGeometry(0.04, 0.12, 8), C, { ...onCap(sx * 0.42, 0.85, 0.25, 0.3), rz: -sx * 0.5, rx: -0.2, ol: 0.15 }));
        [[0.95, 0.3, 0.055], [0.75, -0.55, 0.05], [0.3, -0.95, 0.045]].forEach(([a, b, h]) => {
          const d = new THREE.Vector3(0, a, b).normalize();
          const s = part(new THREE.ConeGeometry(h, h * 1.4, 4), Y, { ol: 0.12, s: [1, 1, 0.35] });
          s.position.copy(d).multiplyScalar(0.31); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
          head.add(s);
        });
        // Fosas de la nariz del dragón en la orilla del gorro (dos puntitos).
        for (const sx of [-1, 1]) head.add(part(new THREE.SphereGeometry(0.012, 6, 5), '#8a1f2a', { ...onCap(sx * 0.12, 0.42, 1, 0.307), ol: 0 }));
        // Humito: bolitas grises que salen a los lados cuando infla los cachetes.
        const smoke = [0, 1, 2, 3].map((i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.026 + (i % 2) * 0.008, 10, 8), flat('#e6e0f0', 0.85)); head.add(m); return m; });
        return [(f, t) => {
          wings.forEach((w, i) => (w.rotation.y = (i ? -1 : 1) * (0.25 + Math.sin(t * 7) * 0.3)));
          smoke.forEach((m, i) => {
            const u = (t * 0.9 + i / 4) % 1, sx = i % 2 ? 1 : -1;
            m.visible = !!f.puff;
            m.position.set(sx * (0.13 + u * 0.09), -0.09 + u * 0.1, 0.22 - u * 0.05);
            m.scale.setScalar(Math.min(1, u * 5, (1 - u) * 4) * (0.7 + u * 0.6));
            m.material.opacity = 0.85 * (1 - u * 0.6);
          });
        }];
      },
    },
    // Unicornio (Brisa): gorro blanco con cuerno dorado, orejitas y crin de arcoíris, mameluco blanco y brillitos.
    unicornio: {
      name: 'Unicornio', hood: true, moves: ['timido', 'guino', 'risa'], sleeve: '#f6f2ff',
      build(part, head, torso, k, toon) {
        const W = this.sleeve, G = '#ffc83d';
        shirt(part, torso, W, k.skin);
        belly(part, torso, '#ffe0f0', 0.95);
        hoodCap(part, head, W, toon);
        // Cuerno dorado con espiral (aros) apuntando arriba y un poco al frente.
        const horn = new THREE.Group(); horn.position.set(0, 0.27, 0.14); horn.rotation.x = 0.5;
        horn.add(part(new THREE.ConeGeometry(0.042, 0.14, 12), G, { y: 0.07, ol: 0.14 }));
        [0.025, 0.06, 0.095].forEach((y, i) => horn.add(part(new THREE.TorusGeometry(0.036 - i * 0.009, 0.006, 5, 12), '#e8a417', { y, rx: Math.PI / 2 + 0.25, ol: 0 })));
        head.add(horn);
        for (const sx of [-1, 1]) head.add(part(new THREE.ConeGeometry(0.045, 0.1, 6), W, { ...onCap(sx * 0.55, 0.75, 0.15, 0.3), rz: -sx * 0.6, ol: 0.15, s: [1, 1, 0.55] }));
        // Crin de arcoíris: bolitas que caen por un lado del gorro, de arriba hacia la oreja (de frente se ve).
        const RB = ['#ff7a9a', '#ffad5c', '#ffe066', '#7fd36a', '#5fc7e8', '#b48cff'];
        const mane = RB.map((c, i) => {
          const d = new THREE.Vector3(0.25 + i * 0.13, 0.95 - i * 0.3, -0.15 - (i % 2) * 0.08).normalize(); // cae por un lado del gorro
          const m = part(new THREE.SphereGeometry(0.048, 10, 8), c, { ol: 0.12, s: [1, 1, 0.8] });
          m.position.copy(d).multiplyScalar(0.31); head.add(m); return m;
        });
        // Brillitos que titilan alrededor.
        const sp = [[-0.26, 0.26], [0.28, 0.16], [-0.3, -0.04]].map(([x, y]) => { const s = new THREE.Mesh(star4(0.03, 0.009), flat('#fff1a8')); s.position.set(x, y, 0.15); head.add(s); return s; });
        return [(f, t) => {
          horn.rotation.z = Math.sin(t * 1.5) * 0.05;
          mane.forEach((m, i) => m.scale.setScalar(1 + Math.sin(t * 3 + i * 0.8) * 0.08));
          sp.forEach((s, i) => { const u = (Math.sin(t * 2.4 + i * 2.1) + 1) / 2; s.scale.setScalar(0.3 + u * 0.8); s.rotation.z = t * 0.8 + i; });
        }];
      },
    },
    // Ninja (Kage): capucha azul noche con banda roja anudada en la frente (cara descubierta), traje del mismo color
    // y una estrella ninja en el pecho.
    ninja: {
      name: 'Ninja', hood: true, moves: ['guino', 'pensando', 'asiente'], sleeve: '#2f3550',
      build(part, head, torso, k, toon) {
        const N = this.sleeve, R = '#e8434f';
        shirt(part, torso, N, k.skin);
        // Cinta cruzada del traje.
        torso.add(part(new THREE.BoxGeometry(0.05, 0.3, 0.02), '#1f2440', { x: 0.03, y: -0.4, z: 0.19, rx: -0.3, rz: -0.6, ol: 0.1 }));
        hoodCap(part, head, N, toon);
        // Banda roja alrededor de la frente, sobre la capucha.
        const band = part(new THREE.TorusGeometry(0.272, 0.032, 8, 36), R, { y: 0.14, rx: Math.PI / 2, ol: 0.08, s: [1, 0.95, 1] });
        head.add(band);
        // Nudo a un lado con sus dos colitas que ondean.
        const knot = new THREE.Group(); knot.position.set(0.25, 0.15, -0.08);
        knot.add(part(new THREE.SphereGeometry(0.035, 10, 8), R, { ol: 0.15 }));
        const tails = [0, 1].map((i) => { const t = part(new THREE.CapsuleGeometry(0.018, 0.09, 3, 8), R, { x: 0.04, y: -0.04 - i * 0.03, rz: -1.1 - i * 0.4, ol: 0.15, s: [1, 1, 0.5] }); knot.add(t); return t; });
        head.add(knot);
        // Estrella ninja gris en el pecho.
        const shur = part(star4(0.05, 0.016), '#c9cfe0', { x: -0.11, y: -0.37, z: 0.21, rx: -0.3, ol: 0.15 });
        const hole = new THREE.Mesh(new THREE.CircleGeometry(0.009, 10), flat(INK)); hole.position.z = 0.008; shur.add(hole);
        torso.add(shur);
        return [(f, t) => {
          tails.forEach((s, i) => (s.rotation.z = -1.1 - i * 0.4 + Math.sin(t * 4 + i) * 0.18));
          shur.rotation.z = Math.sin(t * 0.8) * 0.4;
        }];
      },
    },
  };
};
