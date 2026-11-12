// Disfraces 3D, tanda F (10 nov 2026): exclusivos de eventos — Tamalito, Taquito, Arbolito, Piñatita, Clavelito,
// Bigotón, Michi atigrado, Dálmata y Chaneque. Ver js/avatar3d.js: export default (H) => ({ clave: { name, moves,
// sleeve, hood | wig, build } }). Cabeza de radio ~0.27 en el origen de head; el gorro (hoodCap) mide 0.305 y deja
// libre la cara hasta y ≈ 0.11 en la frente; el torso arranca en y ≈ -0.25.
export default (H) => {
  const { THREE, TAU, flat, shirt, hoodCap, onCap, belly, neckRing } = H;
  const INK = '#2a1f5c', Z = new THREE.Vector3(0, 0, 1);
  // Pega una pieza a la superficie (radio r) en la dirección (x, y, z), mirando hacia afuera; spin la gira en su plano.
  const on = (obj, x, y, z, r, spin = 0) => {
    const d = new THREE.Vector3(x, y, z).normalize();
    obj.position.copy(d).multiplyScalar(r);
    obj.quaternion.setFromUnitVectors(Z, d);
    if (spin) obj.rotateZ(spin);
    return obj;
  };
  // Dirección sobre la orilla del gorro alrededor de la cara (φ = 0 lado derecho, π/2 frente, π izquierdo); inset la
  // mete un poco hacia el gorro. Para holanes, hojas o pétalos que enmarcan la cara.
  const AX = new THREE.Vector3(0, Math.cos(-0.75), Math.sin(-0.75)), V = new THREE.Vector3(1, 0, 0).cross(AX); // V = (0, 0.68, 0.73): hacia la frente
  const rim = (phi, inset = 0.12) => { const th = Math.PI * 0.62 - inset; return AX.clone().multiplyScalar(Math.cos(th)).add(new THREE.Vector3(Math.cos(phi), 0, 0).addScaledVector(V, Math.sin(phi)).multiplyScalar(Math.sin(th))); };
  // Hoja plana y puntiaguda (totomoxtle, hojas del chaneque, pétalos): esfera aplastada.
  const leaf = (part, color, w, h, ol = 0.1) => part(new THREE.SphereGeometry(0.06, 12, 8), color, { ol, s: [w, h, 0.22] });
  // Corazón plano (tazón de papá).
  const heartGeo = (s) => {
    const sh = new THREE.Shape();
    sh.moveTo(0, -s); sh.bezierCurveTo(-s * 1.6, s * 0.1, -s * 0.7, s * 1.2, 0, s * 0.45); sh.bezierCurveTo(s * 0.7, s * 1.2, s * 1.6, s * 0.1, 0, -s);
    return new THREE.ExtrudeGeometry(sh, { depth: 0.01, bevelEnabled: false }).translate(0, 0, -0.005);
  };

  return {
    // Tamalito: la hoja de maíz es la capucha (con sus vetas y la punta amarrada arriba); por dentro, masa.
    tamalito: {
      name: 'Tamalito', hood: true, moves: ['cachetes', 'risa', 'timido'], sleeve: '#e3d47e',
      build(part, head, torso, k, toon) {
        const HUSK = this.sleeve, HUSK2 = '#c9cf72', VEIN = '#8f8a3a', MASA = '#fff1c4';
        shirt(part, torso, HUSK, k.skin);
        belly(part, torso, MASA, 1.1);
        hoodCap(part, head, HUSK, toon);
        // Hojas que envuelven la cara (como el totomoxtle doblado), con su veta al centro, apuntando hacia arriba.
        const leaves = [];
        [0.1, 0.55, 1.05, 1.57, 2.09, 2.59, 3.04].forEach((phi, i) => {
          const g = new THREE.Group();
          g.add(leaf(part, i % 2 ? HUSK2 : HUSK, 0.95, 2.2, 0.08));
          const vein = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.2, 0.004), flat(VEIN)); vein.position.z = 0.016; g.add(vein);
          const d = rim(phi, 0.18);
          on(g, d.x, d.y, d.z, 0.318, Math.atan2(-d.x, d.y) * 0.5);
          head.add(g); leaves.push(g);
        });
        // Punta torcida y amarrada con un listón de hoja verde.
        const tip = new THREE.Group(); tip.position.set(0, 0.28, -0.06);
        tip.add(part(new THREE.ConeGeometry(0.06, 0.14, 10), HUSK, { y: 0.07, rz: 0.15, ol: 0.12 }));
        tip.add(part(new THREE.TorusGeometry(0.035, 0.012, 6, 16), '#6a9a3a', { y: 0.025, rx: Math.PI / 2, ol: 0.2 }));
        head.add(tip);
        return [(f, t) => {
          tip.rotation.z = Math.sin(t * 2.1) * 0.12 + (f.laugh ? Math.sin(t * 12) * 0.12 : 0);
          leaves.forEach((l, i) => (l.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.025 + (f.puff ? 0.05 : 0))));
        }];
      },
    },
    // Taquito: tortilla doradita de capucha (con sus manchitas tostadas) y cilantro y cebolla encima; carne en la panza.
    taquito: {
      name: 'Taquito', hood: true, moves: ['lengua', 'risa', 'asiente'], sleeve: '#f4d98e',
      build(part, head, torso, k, toon) {
        const T = this.sleeve, TOAST = '#c98a3a';
        shirt(part, torso, T, k.skin);
        belly(part, torso, '#a8643a', 1.05);
        // Salsita roja sobre la carne.
        torso.add(part(new THREE.SphereGeometry(0.035, 10, 8), '#e8455a', { x: 0.04, y: -0.37, z: 0.215, ol: 0.15, s: [1.4, 0.8, 0.35] }));
        hoodCap(part, head, T, toon);
        // Manchitas tostadas de la tortilla.
        [[-0.45, 0.8, 0.35], [0.4, 0.75, 0.45], [0.05, 0.95, 0.25], [0.85, 0.45, 0.1], [-0.85, 0.4, 0.05], [-0.15, 0.85, 0.5]].forEach(([x, y, z], i) =>
          head.add(on(part(new THREE.CircleGeometry(0.022 + (i % 3) * 0.007, 10), TOAST, { ol: 0, mat: flat(TOAST) }), x, y, z, 0.309)));
        // Orilla doblada de la tortilla alrededor de la cara.
        // (un rollito liso y tostado: con bolitas parecía pelo rizado). Tubo centrado para que su contorno no se mueva.
        const ep = Array.from({ length: 11 }, (_, i) => rim(-0.05 + (i / 10) * 3.24, 0.03).multiplyScalar(0.312));
        const ec = ep.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / ep.length);
        const edge = part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ep.map((p) => p.clone().sub(ec))), 40, 0.02, 8), '#e2ad55', { ol: 0.1 });
        edge.position.copy(ec); head.add(edge);
        // Relleno arriba: cilantro (hojitas verdes) y cebolla (cuadritos blancos), que rebotan.
        const top = new THREE.Group(); top.position.set(0, 0.27, 0.02); top.scale.setScalar(1.25); head.add(top);
        [[-0.08, 0.02, 0.04], [0.06, 0.03, 0.06], [0, 0.05, -0.04], [-0.1, 0.0, -0.06], [0.11, 0.0, -0.02]].forEach(([x, y, z], i) =>
          top.add(part(new THREE.SphereGeometry(0.035, 8, 6), i % 2 ? '#5fbf5a' : '#3f9a46', { x, y, z, rz: i, ol: 0.14, s: [1.3, 0.55, 1] })));
        [[-0.03, 0.05, 0.07], [0.09, 0.05, 0.02], [-0.07, 0.06, -0.02], [0.03, 0.08, -0.06]].forEach(([x, y, z], i) =>
          top.add(part(new THREE.BoxGeometry(0.03, 0.03, 0.03), '#fffdf7', { x, y, z, rx: i, ry: i * 0.7, ol: 0.18 })));
        return [(f, t) => {
          top.position.y = 0.27 + Math.abs(Math.sin(t * (f.laugh ? 12 : 2.4))) * (f.laugh ? 0.025 : 0.01);
          top.rotation.y = Math.sin(t * 1.3) * 0.15;
        }];
      },
    },
    // Arbolito: copa de árbol (bolitas de follaje) sobre gorro verde, con una florecita; tronco café de playera.
    arbolito: {
      name: 'Arbolito', hood: true, moves: ['saludo', 'timido', 'asiente'], sleeve: '#a8764a',
      build(part, head, torso, k, toon) {
        const G1 = '#5fbf5a', G2 = '#3f9a46', BARK = '#7a4a2a';
        shirt(part, torso, this.sleeve, k.skin);
        // Vetas de la corteza en la playera.
        [[-0.08, -0.38], [0.02, -0.42], [0.1, -0.36]].forEach(([x, y]) => torso.add(part(new THREE.CapsuleGeometry(0.008, 0.07, 3, 6), BARK, { x, y, z: 0.205, rx: -0.3, ol: 0 })));
        hoodCap(part, head, G2, toon);
        // Copa: bolitas de follaje arriba y a los lados, que respiran con el viento.
        const blobs = [];
        [[0, 1, -0.1, 0.1], [-0.55, 0.8, 0.05, 0.085], [0.55, 0.8, 0.05, 0.085], [-0.35, 0.85, -0.55, 0.08], [0.35, 0.85, -0.55, 0.08], [-0.9, 0.35, -0.2, 0.075], [0.9, 0.35, -0.2, 0.075], [0, 0.75, 0.45, 0.07]].forEach(([x, y, z, r], i) => {
          const b = part(new THREE.SphereGeometry(r, 14, 10), i % 2 ? G1 : G2, { ...onCap(x, y, z, 0.3), ol: 0.08 });
          head.add(b); blobs.push(b);
        });
        // Florecita rosa con centro amarillo, de lado.
        const flower = new THREE.Group();
        for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; flower.add(part(new THREE.SphereGeometry(0.022, 8, 6), '#ff9cc8', { x: Math.cos(a) * 0.026, y: Math.sin(a) * 0.026, ol: 0.15, s: [1, 1, 0.5] })); }
        flower.add(part(new THREE.SphereGeometry(0.016, 8, 6), '#ffc83d', { z: 0.01, ol: 0.15 }));
        on(flower, 0.55, 0.62, 0.45, 0.37);
        head.add(flower);
        return [(f, t) => {
          blobs.forEach((b, i) => b.scale.setScalar(1 + Math.sin(t * 1.8 + i * 0.9) * 0.05));
          flower.rotation.z = t * 0.6;
        }];
      },
    },
    // Piñatita: piñata de estrella con picos de colores y tiras que cuelgan; playera de papel picado en franjas.
    pinatita: {
      name: 'Piñatita', hood: true, moves: ['risa', 'sorpresa', 'saludo'], sleeve: '#ff5fa8',
      build(part, head, torso, k, toon) {
        const P = this.sleeve, COLS = ['#ffc83d', '#4aa8de', '#5fbf5a', '#8a5cf0', '#ff9c2b'];
        shirt(part, torso, P, k.skin);
        // Franjas de papel en la playera.
        [['#ffc83d', -0.33], ['#4aa8de', -0.39], ['#5fbf5a', -0.45]].forEach(([c, y]) => torso.add(part(new THREE.TorusGeometry(0.255, 0.014, 6, 30, Math.PI * 0.7), c, { y, z: 0.02, rx: Math.PI / 2 - 0.2, rz: Math.PI * 0.15, ol: 0, s: [1.13, 0.75, 1] })));
        hoodCap(part, head, P, toon);
        // Picos: conos de colores con punta de otro color y una tira colgando.
        const spikes = [];
        [[0, 1, -0.15], [-0.85, 0.55, -0.1], [0.85, 0.55, -0.1], [-0.5, 0.45, -0.75], [0.5, 0.45, -0.75]].forEach(([x, y, z], i) => {
          const g = new THREE.Group();
          g.add(part(new THREE.ConeGeometry(0.055, 0.13, 12), COLS[i], { y: 0.065, ol: 0.1 }));
          g.add(part(new THREE.SphereGeometry(0.018, 8, 6), '#fffdf7', { y: 0.135, ol: 0.2 }));
          const tas = new THREE.Group(); tas.position.y = 0.13;
          [0, 1].forEach((j) => tas.add(part(new THREE.CapsuleGeometry(0.008, 0.07, 3, 6), COLS[(i + 2 + j) % 5], { x: (j - 0.5) * 0.014, y: -0.04, ol: 0 })));
          g.add(tas);
          const d = new THREE.Vector3(x, y, z).normalize();
          g.position.copy(d).multiplyScalar(0.29);
          g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
          head.add(g); spikes.push({ g, tas });
        });
        return [(f, t) => {
          spikes.forEach(({ g, tas }, i) => {
            g.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.04 + (f.laugh ? Math.abs(Math.sin(t * 12 + i)) * 0.08 : 0));
            tas.rotation.z = Math.sin(t * 2.6 + i * 1.3) * 0.5;
          });
        }];
      },
    },
    // Clavelito: gorro de pétalos de clavel rojo (holanes alrededor de la cara y una corona arriba) y cáliz verde al cuello.
    clavelito: {
      name: 'Clavelito', hood: true, moves: ['timido', 'guino', 'asiente'], sleeve: '#5fae5a',
      build(part, head, torso, k, toon) {
        const R = '#e8435f', R2 = '#ff6f8e';
        shirt(part, torso, this.sleeve, k.skin);
        // Cáliz: hojitas verdes en punta alrededor del cuello.
        for (let i = 0; i < 7; i++) { const a = -0.95 + (i / 6) * 1.9; torso.add(part(new THREE.ConeGeometry(0.035, 0.09, 6), '#3f9a46', { x: Math.sin(a) * 0.13, y: -0.24, z: Math.cos(a) * 0.1, rz: -Math.sin(a) * 0.5, rx: Math.PI + 0.4, ol: 0.15, s: [1, 1, 0.5] })); }
        hoodCap(part, head, R, toon);
        // Holanes: pétalos ondulados por todo el gorro (dos tonos) y una corona de pétalos arriba que respira.
        const petals = [];
        for (let i = 0; i < 11; i++) {
          const d = rim(-0.05 + (i / 10) * 3.24, 0.06);
          const p = part(new THREE.SphereGeometry(0.062, 12, 8), i % 2 ? R2 : R, { ol: 0.07, s: [1.1, 0.85, 0.35] });
          on(p, d.x, d.y, d.z, 0.318, i * 0.7);
          head.add(p); petals.push(p);
        }
        // Segunda fila de holanes más arriba.
        for (let i = 0; i < 7; i++) { const d = rim(0.25 + (i / 6) * 2.64, 0.5); const p = part(new THREE.SphereGeometry(0.06, 12, 8), i % 2 ? R : R2, { ol: 0.07, s: [1.15, 0.8, 0.35] }); on(p, d.x, d.y, d.z, 0.314, i); head.add(p); petals.push(p); }
        const crown = new THREE.Group(); crown.position.set(0, 0.28, -0.04); crown.scale.setScalar(1.25); head.add(crown);
        for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; crown.add(part(new THREE.SphereGeometry(0.05, 10, 8), i % 2 ? R : R2, { x: Math.cos(a) * 0.06, z: Math.sin(a) * 0.06, y: 0.02, rx: Math.sin(a) * 0.6, rz: -Math.cos(a) * 0.6, ol: 0.1, s: [1, 0.6, 1] })); }
        crown.add(part(new THREE.SphereGeometry(0.04, 10, 8), R2, { y: 0.05, ol: 0.12 }));
        return [(f, t) => {
          crown.scale.setScalar(1.25 + Math.sin(t * 2.2) * 0.07 + (f.blush ? 0.08 : 0));
          crown.rotation.y = t * 0.3;
          petals.forEach((p, i) => (p.scale.z = 0.35 + Math.sin(t * 2 + i) * 0.05));
        }];
      },
    },
    // Bigotón: bigotote postizo caído arriba de la boca (no la tapa), camisa azul con corbata y el tazón de papá con su
    // corazón y vapor. Se ve tu peinado.
    bigoton: {
      name: 'Bigotón', moves: ['risa', 'guino', 'asiente'], sleeve: '#4a7ad8',
      build(part, head, torso, k, toon) {
        const S = this.sleeve, M = '#3a2418';
        shirt(part, torso, S, k.skin);
        // Cuello blanco y corbata roja.
        for (const sx of [-1, 1]) torso.add(part(new THREE.ConeGeometry(0.05, 0.08, 3), '#fffdf7', { x: sx * 0.05, y: -0.27, z: 0.15, rz: sx * 2.0, rx: -0.3, ol: 0.15, s: [1, 1, 0.4] }));
        torso.add(part(new THREE.SphereGeometry(0.022, 8, 6), '#e8455a', { y: -0.29, z: 0.17, ol: 0.18, s: [1.2, 1, 0.6] }));
        const tie = part(new THREE.ConeGeometry(0.035, 0.12, 4), '#e8455a', { y: -0.36, z: 0.19, rx: Math.PI - 0.35, ol: 0.14, s: [1, 1, 0.35] });
        torso.add(tie);
        // Tazón con corazón y vapor.
        const mug = new THREE.Group(); mug.position.set(0.13, -0.355, 0.2); mug.rotation.x = -0.2;
        mug.add(part(new THREE.CylinderGeometry(0.045, 0.04, 0.09, 16), '#fffdf7', { ol: 0.1 }));
        mug.add(part(new THREE.TorusGeometry(0.025, 0.009, 6, 12), '#fffdf7', { x: 0.05, rz: 0.2, ol: 0.2 }));
        const heart = new THREE.Mesh(heartGeo(0.016), flat('#e8455a')); heart.position.set(0, 0, 0.046); mug.add(heart);
        const steam = [0, 1, 2].map((i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), flat('#ffffff', 0.7)); mug.add(s); return s; });
        torso.add(mug);
        // Bigotote caído: tubo curvo sobre la cara (centrado para que su contorno no se mueva).
        const pts = [[-0.08, -0.108], [-0.068, -0.086], [-0.04, -0.07], [-0.012, -0.072], [0, -0.078], [0.012, -0.072], [0.04, -0.07], [0.068, -0.086], [0.08, -0.108]]
          .map(([x, y]) => new THREE.Vector3(x, y, 0.96 * Math.sqrt(Math.max(0, 0.0729 - x * x - (y / 0.96) ** 2)) + 0.014));
        const c = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / pts.length);
        const curve = new THREE.CatmullRomCurve3(pts.map((p) => p.clone().sub(c)));
        const stache = part(new THREE.TubeGeometry(curve, 24, 0.017, 8), M, { ol: 0.12 });
        for (const sx of [-1, 1]) stache.add(part(new THREE.SphereGeometry(0.024, 10, 8), M, { x: sx * 0.03, y: 0.006, z: 0.002, ol: 0.12, s: [1.3, 0.8, 0.6] }));
        stache.position.copy(c);
        head.add(stache);
        return [(f, t) => {
          // El bigote brinca al reír y se le ladea al guiñar; el vapor sube.
          stache.scale.y = 1 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.2 : 0);
          stache.rotation.z = f.wink ? 0.08 : Math.sin(t * 1.4) * 0.02;
          tie.rotation.z = Math.sin(t * 2) * 0.08;
          steam.forEach((s, i) => { const u = (t * 0.6 + i / 3) % 1; s.position.set(Math.sin(u * 6 + i) * 0.012, 0.06 + u * 0.08, 0); s.scale.setScalar(1 - u * 0.6); s.material.opacity = 0.7 * (1 - u); });
        }];
      },
    },
    // Michi atigrado: gorro de gato gris con la "M" de atigrado en la frente y rayas a los lados, orejas con interior
    // rosa, panza blanca y collar azul con cascabel (distinto del Gatito naranja).
    atigrado: {
      name: 'Michi atigrado', hood: true, moves: ['cachetes', 'timido', 'asiente'], sleeve: '#9aa0b8',
      build(part, head, torso, k, toon) {
        const G = this.sleeve, D = '#4a4f6a';
        shirt(part, torso, G, k.skin);
        belly(part, torso, '#f6f4ff');
        // Rayas en los hombros.
        for (const sx of [-1, 1]) for (const y of [-0.36, -0.42]) torso.add(part(new THREE.CapsuleGeometry(0.012, 0.06, 3, 6), D, { x: sx * 0.27, y, z: 0.08, rz: sx * 0.4, ol: 0 }));
        hoodCap(part, head, G, toon);
        // "M" en la frente: cuatro trazos.
        [[-0.075, -0.25], [-0.028, 0.35], [0.028, -0.35], [0.075, 0.25]].forEach(([x, rz]) => head.add(part(new THREE.CapsuleGeometry(0.011, 0.045, 3, 6), D, { ...onCap(x, 0.42, 0.9, 0.31), rx: -0.45, rz, ol: 0 })));
        // Rayas a los lados del gorro.
        for (const sx of [-1, 1]) for (const y of [0.15, 0.4]) head.add(on(part(new THREE.CapsuleGeometry(0.013, 0.07, 3, 6), D, { ol: 0 }), sx, y, -0.15, 0.31, sx * 1.3));
        const ears = [-1, 1].map((sx) => {
          const e = new THREE.Group();
          e.add(part(new THREE.ConeGeometry(0.1, 0.18, 4), G, { ol: 0.1, s: [1, 1, 0.55] }));
          e.add(part(new THREE.ConeGeometry(0.06, 0.12, 4), '#ffb3d1', { y: -0.01, z: 0.035, ol: 0, s: [1, 1, 0.3] }));
          e.add(part(new THREE.CapsuleGeometry(0.01, 0.05, 3, 6), D, { x: 0, y: 0.02, z: -0.03, ol: 0 }));
          e.position.set(sx * 0.155, 0.25, 0.04); e.rotation.z = -sx * 0.35;
          head.add(e); return e;
        });
        torso.add(neckRing(part, '#4aa8de'));
        const bell = part(new THREE.SphereGeometry(0.035, 12, 10), '#ffc83d', { y: -0.29, z: 0.135, ol: 0.15 });
        const slit = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.006, 0.01), flat(INK)); slit.position.set(0, -0.006, 0.035); bell.add(slit);
        torso.add(bell);
        return [(f, t) => {
          // Orejas que se agachan cuando se pone tímido; el cascabel se mece.
          const down = f.blush ? 0.35 : 0;
          ears.forEach((e, i) => (e.rotation.z = (i ? -1 : 1) * (0.35 + down + Math.sin(t * 2 + i) * 0.04)));
          bell.rotation.z = Math.sin(t * 3) * 0.3;
        }];
      },
    },
    // Dálmata: gorro blanco con manchas negras y orejas negras caídas; playera manchada y collar azul con placa redonda.
    dalmata: {
      name: 'Dálmata', hood: true, moves: ['saludo', 'lengua', 'sorpresa'], sleeve: '#f6f4ff',
      build(part, head, torso, k, toon) {
        const W = this.sleeve, B = '#2a2a3a';
        shirt(part, torso, W, k.skin);
        // Manchas en la playera, pegadas a su superficie (elipsoide del torso: centro y -0.44, semiejes 0.345 · 0.225 · 0.225).
        [[-0.15, -0.37, 0.03], [0.11, -0.42, 0.026], [0.22, -0.33, 0.02], [-0.03, -0.3, 0.018], [-0.24, -0.43, 0.02]].forEach(([x, y, r]) => {
          const z = 0.225 * Math.sqrt(Math.max(0, 1 - (x / 0.345) ** 2 - ((y + 0.44) / 0.225) ** 2)) + 0.004;
          const sp = on(part(new THREE.CircleGeometry(r, 12), B, { ol: 0, mat: flat(B) }), x / 0.345, (y + 0.44) / 0.225, z / 0.225, 1);
          sp.position.set(x, y, z); torso.add(sp);
        });
        hoodCap(part, head, W, toon);
        // Manchas negras planas sobre el gorro.
        [[-0.45, 0.8, 0.35, 0.032], [0.4, 0.75, 0.45, 0.026], [0.8, 0.5, 0.05, 0.03], [-0.85, 0.4, 0.0, 0.026], [0.05, 0.98, 0.1, 0.022], [-0.1, 0.8, 0.55, 0.018], [0.05, 0.6, -0.8, 0.03]].forEach(([x, y, z, r]) =>
          head.add(on(part(new THREE.CircleGeometry(r, 12), B, { ol: 0, mat: flat(B) }), x, y, z, 0.309)));
        const ears = [-1, 1].map((sx) => {
          const e = new THREE.Group(); e.position.set(sx * 0.25, 0.15, -0.01);
          e.add(part(new THREE.CapsuleGeometry(0.052, 0.13, 4, 10), B, { y: -0.1, ol: 0.1, s: [1, 1, 0.5] }));
          e.rotation.z = sx * 0.28;
          head.add(e); return e;
        });
        torso.add(neckRing(part, '#2f6fd8'));
        const tag = part(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 16), '#ffc83d', { y: -0.3, z: 0.135, rx: Math.PI / 2 - 0.2, ol: 0.18 });
        torso.add(tag);
        return [(f, t) => {
          // Orejas que se levantan con la sorpresa y se mecen; la placa se balancea.
          const up = f.back ? 0.35 : 0;
          ears.forEach((e, i) => (e.rotation.z = (i ? 1 : -1) * (0.28 + up + Math.sin(t * 2.6 + i) * 0.05)));
          tag.rotation.z = Math.sin(t * 2.5) * 0.25;
        }];
      },
    },
    // Chaneque: duende travieso de la selva: gorro de hojas grandes, orejas puntiagudas (de tu color de piel) que
    // asoman a los lados, una moradita encima y túnica de hojas.
    chaneque: {
      name: 'Chaneque', hood: true, moves: ['guino', 'lengua', 'pensando'], sleeve: '#7a8a3a',
      build(part, head, torso, k, toon) {
        const L1 = '#4f9a3a', L2 = '#6fbf4a', L3 = '#2f7a2a';
        shirt(part, torso, this.sleeve, k.skin);
        // Cuello de hojas en punta.
        for (let i = 0; i < 6; i++) { const a = -0.9 + (i / 5) * 1.8; torso.add(part(new THREE.SphereGeometry(0.05, 10, 6), i % 2 ? L2 : L1, { x: Math.sin(a) * 0.14, y: -0.29, z: Math.cos(a) * 0.12, rz: Math.sin(a) * 0.4, rx: -0.5, ol: 0.12, s: [0.8, 1.6, 0.3] })); }
        hoodCap(part, head, L3, toon);
        // Hojas grandes que forman el gorro, de puntas hacia arriba.
        const leaves = [];
        [[0, 1, -0.2], [-0.6, 0.75, -0.1], [0.6, 0.75, -0.1], [-0.4, 0.6, 0.4], [0.4, 0.6, 0.4], [-0.9, 0.3, -0.4], [0.9, 0.3, -0.4], [0, 0.6, -0.8]].forEach(([x, y, z], i) => {
          const l = leaf(part, i % 2 ? L2 : L1, 1.05, 2.0, 0.08);
          on(l, x, y, z, 0.32, Math.atan2(-x, y) * 0.6);
          head.add(l); leaves.push(l);
        });
        // Orejas puntiagudas de duende (del color de tu piel), asomando a los lados.
        const ears = [-1, 1].map((sx) => {
          const e = part(new THREE.ConeGeometry(0.045, 0.16, 8), k.skin, { x: sx * 0.29, y: 0.0, z: 0.02, rz: -sx * 1.15, ol: 0.12, s: [1, 1, 0.5] });
          head.add(e); return e;
        });
        // Moradita (baya) arriba con su hojita.
        const berry = new THREE.Group(); berry.position.set(0.05, 0.31, -0.02);
        berry.add(part(new THREE.SphereGeometry(0.035, 10, 8), '#8a3ab8', { ol: 0.14 }));
        berry.add(part(new THREE.SphereGeometry(0.03, 8, 6), L2, { x: 0.03, y: 0.03, rz: -0.6, ol: 0.14, s: [1.4, 0.5, 0.6] }));
        head.add(berry);
        return [(f, t) => {
          ears.forEach((e, i) => (e.rotation.z = (i ? -1 : 1) * 1.15 + Math.sin(t * 3 + i) * 0.06 + (f.wink ? (i ? -0.12 : 0) : 0)));
          leaves.forEach((l, i) => (l.scale.y = 2.0 + Math.sin(t * 1.7 + i) * 0.08));
          berry.rotation.z = Math.sin(t * 2.4) * 0.2;
        }];
      },
    },
  };
};
