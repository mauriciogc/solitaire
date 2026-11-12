// Disfraces 3D, tanda C (10 nov 2026): Papaya, Arqueólogo, Pip, Gatobot, Esponjita y Capitán Sombrero. Inspirados en
// personajes famosos sin copiarlos. Ver js/avatar3d.js: export default (H) => ({ clave: { name, moves, sleeve, hood |
// wig, build } }). Cabeza de radio ~0.27 en el origen de head; el torso arranca en y ≈ -0.25.
export default (H) => {
  const { THREE, TAU, flat, shirt, starGeo, cap, fringe, hoodCap, onCap, belly, neckRing, KID_HAIRS } = H;
  const INK = '#2a1f5c', Z = new THREE.Vector3(0, 0, 1);
  // Pega una pieza plana a la superficie mirando hacia afuera en la dirección d.
  const stick = (obj, d) => (obj.quaternion.setFromUnitVectors(Z, new THREE.Vector3(d.x, d.y, d.z).normalize()), obj);
  // Banda del gorro (misma inclinación que hoodCap): entre los ángulos t0 y t1 desde arriba (fracciones de π).
  const band = (part, head, color, toon, t0, t1, r = 0.31, ph = [0, TAU]) => {
    const g = new THREE.SphereGeometry(r, 28, 4, ph[0], ph[1], Math.PI * t0, Math.PI * (t1 - t0));
    const b = part(g, color, { rx: -0.75, ol: 0.04, mat: toon({ color, side: THREE.DoubleSide }) });
    head.add(b); return b;
  };
  // Rayo plano (cascos de carreras).
  const boltGeo = () => {
    const s = new THREE.Shape();
    [[0.022, 0.075], [-0.032, 0.002], [0, 0.002], [-0.022, -0.075], [0.034, 0.012], [0.004, 0.012]].forEach(([x, y], i) => s[i ? 'lineTo' : 'moveTo'](x, y));
    return new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false }).translate(0, 0, -0.006);
  };
  // Sombrero de ala: ala, copa y cinta. y = altura del ala.
  const hat = (part, head, { y, brim, crown, h, color, band: bc, tilt = -0.18 }) => {
    const g = new THREE.Group(); g.position.y = y; g.rotation.x = tilt;
    g.add(part(new THREE.CylinderGeometry(brim, brim, 0.022, 32), color, { ol: 0.06 }));
    g.add(part(new THREE.CylinderGeometry(crown * 0.88, crown, h, 24), color, { y: h / 2 + 0.008, ol: 0.07 }));
    g.add(part(new THREE.CylinderGeometry(crown * 1.02, crown * 1.02, 0.035, 24, 1, true), bc, { y: 0.03, ol: 0.08 }));
    head.add(g); return g;
  };

  return {
    // Papaya: casco de piloto color papaya con franja blanca, visera levantada y rayos a los lados; traje de carreras
    // con parches.
    papaya: {
      name: 'Papaya', hood: true, moves: ['saludo', 'asiente', 'risa'], sleeve: '#f2690f', // papaya fuerte: el fondo de inicio también es naranja
      build(part, head, torso, k, toon) {
        const P = this.sleeve, BL = '#2f5fb8';
        shirt(part, torso, P, k.skin);
        torso.add(neckRing(part, BL, 0.024));
        // Parches: un círculo blanco con estrella y un rectángulo azul.
        const patch = part(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 18), '#fffdf7', { x: -0.11, y: -0.36, z: 0.2, rx: Math.PI / 2 - 0.35, ol: 0.15 });
        torso.add(patch);
        torso.add(part(starGeo(0.028, 0.012), '#ffc83d', { x: -0.11, y: -0.355, z: 0.213, rx: -0.35, ol: 0.2 }));
        torso.add(part(new THREE.BoxGeometry(0.09, 0.045, 0.012), BL, { x: 0.11, y: -0.36, z: 0.2, rx: -0.35, ol: 0.15 }));
        hoodCap(part, head, P, toon);
        band(part, head, '#fffdf7', toon, 0.36, 0.42, 0.309);
        // Franja azul de carreras por el centro del casco (de la frente a la nuca): lo separa del fondo naranja.
        for (const ph of [Math.PI / 2, -Math.PI / 2]) band(part, head, '#2f4a8a', toon, 0, 0.47, 0.311, [ph - 0.2, 0.4]);
        // Visera levantada sobre la frente: azul oscuro con un brillo.
        const visor = band(part, head, '#2f4a8a', toon, 0.47, 0.585, 0.322, [Math.PI / 2 - 0.85, 1.7]);
        const shine = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.006), flat('#bfe8ff'));
        const sp = onCap(-0.08, 0.27, 0.2, 0.335); shine.position.set(sp.x, sp.y, sp.z); shine.rotation.set(-0.95, 0, 0.15);
        head.add(shine);
        // Rayos amarillos a los lados del casco.
        const boltM = flat('#ffd23d');
        const bolts = [-1, 1].map((sx) => {
          const d = onCap(sx * 0.8, 0.25, 0.45, 0.312);
          const b = part(boltGeo(), null, { x: d.x, y: d.y, z: d.z, ol: 0.12, mat: boltM });
          stick(b, d); if (sx < 0) b.scale.x = -1;
          head.add(b); return b;
        });
        const a = new THREE.Color('#ffd23d'), w = new THREE.Color('#fff7c4');
        return [(f, t) => {
          boltM.color.copy(a).lerp(w, Math.max(0, Math.sin(t * 5)) * 0.8);
          // La visera se levanta un poquito más al asentir o reír.
          visor.rotation.x = -0.75 - (f.nod || f.laugh ? Math.abs(Math.sin(t * 6)) * 0.06 : 0);
          bolts.forEach((b, i) => b.scale.setScalar(1 + Math.sin(t * 4 + i) * 0.04));
        }];
      },
    },
    // Arqueólogo: sombrero de explorador café con su lamparita, peluca de cola de caballo (del color de tu pelo),
    // blusa verde agua con chaleco caqui y correas.
    cora: {
      name: 'Arqueólogo', wig: true, moves: ['pensando', 'sorpresa', 'guino'], sleeve: '#3f8a7a',
      build(part, head, torso, k) {
        const HAIR = KID_HAIRS[k.hair] || '#7a4a2a', V = '#d9b48a', BR = '#7a4a2a';
        shirt(part, torso, this.sleeve, k.skin);
        // Chaleco abierto (dos mitades) y dos correas cruzadas.
        for (const sx of [-1, 1]) torso.add(part(new THREE.SphereGeometry(0.15, 14, 10), V, { x: sx * 0.15, y: -0.42, z: 0.12, ol: 0.06, s: [0.9, 1, 0.55] }));
        for (const sx of [-1, 1]) torso.add(part(new THREE.BoxGeometry(0.03, 0.2, 0.02), BR, { x: sx * 0.06, y: -0.36, z: 0.205, rx: -0.35, rz: sx * 0.35, ol: 0.15 }));
        // Peluca: casco de pelo, fleco de lado y cola de caballo con liga.
        cap(part, head, HAIR);
        fringe(part, head, HAIR, [[-0.12, 0.15, 0.19, 0.5], [-0.02, 0.17, 0.21, 0.25], [0.1, 0.15, 0.2, -0.1]], [1.25, 0.55, 0.7]);
        for (const sx of [-1, 1]) head.add(part(new THREE.CapsuleGeometry(0.045, 0.1, 4, 8), HAIR, { x: sx * 0.24, y: -0.05, z: 0.05, rz: sx * 0.12, ol: 0.1 }));
        const tail = new THREE.Group(); tail.position.set(0, 0.1, -0.27);
        tail.add(part(new THREE.SphereGeometry(0.035, 10, 8), '#e8455a', { ol: 0.18 }));
        tail.add(part(new THREE.CapsuleGeometry(0.06, 0.2, 4, 10), HAIR, { y: -0.13, z: -0.03, rx: 0.25, ol: 0.1 }));
        head.add(tail);
        // Sombrero de explorador con lamparita al frente.
        const h = hat(part, head, { y: 0.215, brim: 0.34, crown: 0.23, h: 0.12, color: '#c99a5a', band: '#5a331b', tilt: -0.1 });
        const lampM = flat('#fff4c7');
        const lamp = new THREE.Group(); lamp.position.set(0, 0.05, 0.235);
        lamp.add(part(new THREE.CylinderGeometry(0.028, 0.032, 0.035, 12), '#8a8fa8', { rx: Math.PI / 2, ol: 0.15 }));
        lamp.add(part(new THREE.CircleGeometry(0.022, 12), null, { z: 0.019, ol: 0, mat: lampM }));
        h.add(lamp);
        const on = new THREE.Color('#fff4c7'), dim = new THREE.Color('#ffd27a');
        return [(f, t) => {
          tail.rotation.z = Math.sin(t * 2.4) * 0.18 + (f.back ? Math.sin(t * 14) * 0.1 : 0);
          tail.rotation.x = Math.sin(t * 1.7) * 0.08;
          lampM.color.copy(on).lerp(dim, (Math.sin(t * 7) + 1) * 0.25);
          h.rotation.z = Math.sin(t * 1.3) * 0.03;
        }];
      },
    },
    // Pip: gorro blanco de oso con orejitas y tiras largas a los lados, camisa azul y mochila verde.
    pip: {
      name: 'Pip', hood: true, moves: ['saludo', 'risa', 'asiente'], sleeve: '#5fc7e8',
      build(part, head, torso, k, toon) {
        const W = '#fffdf7', G = '#5fbf5a';
        // Mochila detrás de los hombros (antes que la camisa) y sus correas al frente.
        torso.add(part(new THREE.SphereGeometry(0.22, 16, 12), G, { y: -0.36, z: -0.14, ol: 0.05, s: [1.1, 0.9, 0.6] }));
        shirt(part, torso, this.sleeve, k.skin);
        for (const sx of [-1, 1]) torso.add(part(new THREE.BoxGeometry(0.035, 0.2, 0.02), '#3f9a46', { x: sx * 0.15, y: -0.36, z: 0.19, rx: -0.35, rz: sx * -0.12, ol: 0.15 }));
        hoodCap(part, head, W, toon);
        // Orejitas redondas con centro rosa.
        const ears = [-1, 1].map((sx) => {
          const e = new THREE.Group(); const p = onCap(sx * 0.62, 0.8, 0.05, 0.3); e.position.set(p.x, p.y, p.z);
          e.add(part(new THREE.SphereGeometry(0.065, 14, 10), W, { ol: 0.1, s: [1, 1, 0.6] }));
          e.add(part(new THREE.SphereGeometry(0.035, 10, 8), '#ffd6e6', { z: 0.02, ol: 0, s: [1, 1, 0.4] }));
          head.add(e); return e;
        });
        // Tiras largas del gorro que cuelgan a los lados de la cara.
        const flaps = [-1, 1].map((sx) => {
          const g = new THREE.Group(); g.position.set(sx * 0.27, -0.06, 0.06);
          g.add(part(new THREE.CapsuleGeometry(0.045, 0.13, 4, 10), W, { y: -0.09, ol: 0.1, s: [1, 1, 0.7] }));
          head.add(g); return g;
        });
        return [(f, t) => {
          ears.forEach((e, i) => e.scale.setScalar(1 + Math.sin(t * 3 + i * 1.6) * 0.05));
          flaps.forEach((g, i) => (g.rotation.z = (i ? 1 : -1) * (0.05 + Math.sin(t * 2.2 + i) * 0.08 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.12 : 0))));
        }];
      },
    },
    // Gatobot: casco azul redondo de gato robot con cara blanca alrededor de la tuya, orejitas y bigotes; traje azul con
    // panza blanca y bolsa mágica (a veces sale una estrellita) y collar rojo con cascabel dorado.
    gatobot: {
      name: 'Gatobot', hood: true, moves: ['risa', 'sorpresa', 'saludo'], sleeve: '#3f8ee0',
      build(part, head, torso, k, toon) {
        const B = this.sleeve, W = '#fffdf7';
        shirt(part, torso, B, k.skin);
        belly(part, torso, W, 1.15);
        // Bolsa: media luna con orilla de tinta.
        const pocket = new THREE.Mesh(new THREE.CircleGeometry(0.055, 18, Math.PI, Math.PI), flat(W));
        pocket.position.set(0, -0.41, 0.225); pocket.rotation.x = -0.35; torso.add(pocket);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.006, 4, 18, Math.PI), flat(INK));
        rim.position.copy(pocket.position); rim.rotation.set(-0.35, 0, Math.PI); torso.add(rim);
        const star = part(starGeo(0.025, 0.011), '#ffd23d', { y: -0.41, z: 0.23, ol: 0.2 });
        torso.add(star);
        torso.add(neckRing(part, '#e8455a', 0.022));
        const bell = part(new THREE.SphereGeometry(0.036, 12, 10), '#ffc83d', { y: -0.29, z: 0.135, ol: 0.15 });
        const slit = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.006, 0.01), flat(INK)); slit.position.set(0, -0.006, 0.035); bell.add(slit);
        torso.add(bell);
        hoodCap(part, head, B, toon);
        // Cara blanca: la orilla del casco alrededor de tu cara.
        band(part, head, W, toon, 0.56, 0.622, 0.308);
        // Bigotes pintados en los cachetes (tres por lado, hacia afuera).
        for (const sx of [-1, 1]) [0.22, 0, -0.22].forEach((r, i) => {
          const w = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.008, 0.004), flat(INK));
          w.position.set(sx * 0.215, -0.085 - i * 0.022 + 0.022, 0.175); w.rotation.set(0, sx * 0.75, sx * r);
          head.add(w);
        });
        // Orejitas de gato chiquitas.
        const ears = [-1, 1].map((sx) => {
          const p = onCap(sx * 0.5, 0.85, 0.05, 0.29);
          const e = part(new THREE.ConeGeometry(0.06, 0.1, 4), B, { x: p.x, y: p.y, z: p.z, rz: -sx * 0.45, ol: 0.12, s: [1, 1, 0.55] });
          head.add(e); return e;
        });
        let pop = -1;
        return [(f, t) => {
          bell.rotation.z = Math.sin(t * 3) * 0.3;
          ears[1].rotation.z = -0.45 - (t % 3.1 < 0.22 ? Math.sin((t % 3.1) * 28) * 0.2 : 0);
          // Cada ~4 s se asoma una estrellita de la bolsa, sube y se esconde.
          const c = t % 4.2;
          pop = c < 1.2 ? Math.sin((c / 1.2) * Math.PI) : 0;
          star.position.y = -0.41 + pop * 0.06; star.scale.setScalar(Math.max(0.001, pop)); star.rotation.z = c * 3;
        }];
      },
    },
    // Esponjita: marco cuadrado de esponja rosa con agujeritos (tu cara en el centro), camisa blanca con corbata roja y
    // burbujas que suben.
    esponjita: {
      name: 'Esponjita', hood: true, moves: ['risa', 'lengua', 'saludo'], sleeve: '#fffdf7',
      build(part, head, torso, k, toon) {
        const PK = '#ff9cc8', HOLE = '#e86aa6';
        shirt(part, torso, this.sleeve, k.skin);
        // Cuellito y corbata roja.
        for (const sx of [-1, 1]) torso.add(part(new THREE.ConeGeometry(0.04, 0.07, 3), '#fffdf7', { x: sx * 0.05, y: -0.27, z: 0.15, rz: sx * 2.2, rx: -0.4, ol: 0.15 }));
        torso.add(part(new THREE.BoxGeometry(0.035, 0.025, 0.02), '#e8434f', { y: -0.29, z: 0.17, rx: -0.35, ol: 0.18 }));
        torso.add(part(new THREE.ConeGeometry(0.03, 0.1, 4), '#e8434f', { y: -0.35, z: 0.19, rx: -0.35, rz: Math.PI, ol: 0.15 }));
        // Marco de esponja: arriba, dos lados y atrás. La cara sale por el centro.
        const box = new THREE.Group();
        const mat = toon({ color: PK });
        box.add(part(new THREE.BoxGeometry(0.58, 0.11, 0.46), PK, { y: 0.23, z: -0.04, ol: 0.04, mat }));
        for (const sx of [-1, 1]) box.add(part(new THREE.BoxGeometry(0.075, 0.44, 0.46), PK, { x: sx * 0.255, y: 0.02, z: -0.04, ol: 0.05, mat }));
        box.add(part(new THREE.BoxGeometry(0.58, 0.49, 0.07), PK, { y: 0.0, z: -0.24, ol: 0.04, mat }));
        // Agujeritos al frente del marco.
        const holes = flat(HOLE);
        [[-0.2, 0.245, 0.016], [-0.06, 0.215, 0.012], [0.09, 0.25, 0.018], [0.22, 0.22, 0.012], [-0.255, 0.12, 0.014], [-0.255, -0.1, 0.017], [0.255, 0.05, 0.016], [0.255, -0.15, 0.012]].forEach(([x, y, r]) => {
          const hm = new THREE.Mesh(new THREE.CircleGeometry(r, 10), holes); hm.position.set(x, y, 0.191); box.add(hm);
        });
        head.add(box);
        // Burbujas que suben junto al hombro.
        const bubM = new THREE.MeshBasicMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.7, depthWrite: false });
        const bubs = [0, 1, 2].map((i) => {
          const b = new THREE.Mesh(new THREE.SphereGeometry(0.022 + i * 0.008, 10, 8), bubM);
          const r = new THREE.Mesh(new THREE.TorusGeometry(0.022 + i * 0.008, 0.004, 4, 14), flat(INK)); b.add(r);
          torso.add(b); return b;
        });
        return [(f, t) => {
          box.scale.set(1 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.03 : 0), 1 - (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.03 : 0), 1);
          bubs.forEach((b, i) => {
            const c = ((t * 0.45 + i / 3) % 1);
            b.position.set(0.3 + Math.sin(t * 3 + i) * 0.02, -0.3 + c * 0.5, 0.12);
            b.scale.setScalar(c < 0.85 ? 1 : Math.max(0.001, (1 - c) / 0.15));
          });
        }];
      },
    },
    // Capitán Sombrero: sombrero de paja con cinta roja encima de tu pelo, chaleco rojo abierto y curita en el cachete.
    capitan: {
      name: 'Capitán Sombrero', moves: ['risa', 'saludo', 'cachetes'], sleeve: '#e8434f',
      build(part, head, torso, k) {
        shirt(part, torso, this.sleeve, k.skin);
        // Chaleco abierto: se ve el pecho en V.
        torso.add(part(new THREE.SphereGeometry(0.11, 14, 10), k.skin, { y: -0.33, z: 0.16, ol: 0.06, s: [0.6, 1.1, 0.4] }));
        // Curita en el cachete izquierdo.
        const band = part(new THREE.CapsuleGeometry(0.014, 0.05, 3, 8), '#f2c99a', { x: -0.155, y: -0.075, z: 0.225, rz: Math.PI / 2 + 0.4, ry: -0.6, ol: 0.25 });
        head.add(band);
        // Sombrero de paja alto, para que quepa sobre cualquier peinado.
        const h = hat(part, head, { y: 0.25, brim: 0.34, crown: 0.235, h: 0.13, color: '#f2d16b', band: '#e8434f', tilt: -0.1 });
        return [(f, t) => {
          // Al reír el sombrero brinca un poco.
          h.position.y = 0.25 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.015 : 0);
          h.rotation.z = Math.sin(t * 1.2) * 0.04;
        }];
      },
    },
  };
};
