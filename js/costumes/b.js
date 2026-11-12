// Disfraces 3D, tanda B (10 nov 2026): ratón eléctrico, viajero del tiempo, guardián, mago, caballero, Profe Voltaje y
// Turbo. Ver js/avatar3d.js: export default (H) => ({ clave: { name, moves, sleeve, hood | wig, build } }).
// Cabeza de radio 0.27 en el origen de head: ojos en y −0.02, cejas en 0.06, boca en −0.1; el gorro (hoodCap) llega a la
// frente hasta y ≈ 0.11. El torso (shirt) va en y −0.44. Sin hood ni wig se ve tu peinado.
const INK = '#2a1f5c';

export default ({ THREE, TAU, flat, shirt, starGeo, cap, hoodCap, onCap, belly, neckRing }) => {
  // Algo cilíndrico (lente, botón) pegado a la cabeza mirando hacia afuera en la dirección (x, y, z), a radio r.
  const stick = (obj, x, y, z, r) => {
    const n = new THREE.Vector3(x, y, z).normalize();
    obj.position.copy(n.clone().multiplyScalar(r));
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    return obj;
  };
  // Rayo plano (frente del ratón).
  const boltGeo = (s) => {
    const sh = new THREE.Shape();
    [[0.2, 1], [-0.45, 0.05], [0, 0.05], [-0.2, -1], [0.45, -0.05], [0, -0.05]].forEach(([x, y], i) => sh[i ? 'lineTo' : 'moveTo'](x * s, y * s));
    return new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false }).translate(0, 0, -0.006);
  };
  // Goggles en la frente: correa alrededor de la cabeza y dos lentes; inside(lente) dibuja lo de adentro.
  const goggles = (part, head, { strap, rim, y = 0.2, r = 0.3, inside }) => {
    const g = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(r - 0.005, 0.016, 6, 40), flat(strap));
    band.rotation.x = Math.PI / 2 - 0.55; band.position.y = y - 0.08; g.add(band);
    const lenses = [-1, 1].map((sx) => {
      const l = new THREE.Group();
      l.add(part(new THREE.CylinderGeometry(0.058, 0.058, 0.035, 18), rim, { ol: 0.12 }));
      const glass = new THREE.Mesh(new THREE.CircleGeometry(0.042, 18), flat('#bfe8ff'));
      glass.rotation.x = -Math.PI / 2; glass.position.y = 0.019; l.add(glass);
      inside?.(l);
      stick(l, sx * 0.075, y, 0.22, r);
      g.add(l); return l;
    });
    head.add(g);
    return lenses;
  };

  return {
    // Ratón eléctrico (Voltio): gorro amarillo de ratón con orejas redondas y un rayo azul en la frente, mameluco
    // amarillo con panza clara; al inflar los cachetes le salen chispitas.
    voltio: {
      name: 'Ratón eléctrico', hood: true, moves: ['cachetes', 'risa', 'saludo'], sleeve: '#ffd23d',
      build(part, head, torso, k, toon) {
        const Y = this.sleeve, IN = '#ff9c2b';
        shirt(part, torso, Y, k.skin);
        belly(part, torso, '#fff1b0');
        hoodCap(part, head, Y, toon);
        const ears = [-1, 1].map((sx) => {
          const e = new THREE.Group();
          e.add(part(new THREE.SphereGeometry(0.11, 18, 14), Y, { ol: 0.08, s: [1, 1, 0.45] }));
          e.add(part(new THREE.SphereGeometry(0.065, 14, 10), IN, { z: 0.035, ol: 0, s: [1, 1, 0.3] }));
          e.position.set(sx * 0.2, 0.24, -0.02); e.rotation.z = -sx * 0.35;
          head.add(e); return e;
        });
        const bolt = part(boltGeo(0.06), '#4aa8de', { ...onCap(0, 0.42, 0.9, 0.312), rx: -0.42, ol: 0.2 });
        head.add(bolt);
        // Chispitas junto a los cachetes: salen al inflarlos.
        const sparks = [-1, 1].map((sx) => {
          const s = new THREE.Group(); s.position.set(sx * 0.3, -0.08, 0.12);
          const zig = new THREE.Mesh(boltGeo(0.035), flat('#4aa8de')); zig.rotation.z = sx * 0.6; s.add(zig);
          const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), flat('#fff4c7')); dot.position.set(sx * 0.03, 0.04, 0); s.add(dot);
          head.add(s); return s;
        });
        return [(f, t) => {
          ears.forEach((e, i) => (e.rotation.z = (i ? -0.35 : 0.35) + Math.sin(t * 2.2 + i) * 0.05 + (f.laugh ? Math.sin(t * 12) * 0.08 : 0)));
          const on = f.mouth === 'puff' ? 1 : 0;
          sparks.forEach((s, i) => { s.visible = on && (t * 12 + i * 3) % 4 < 3; s.scale.setScalar(0.8 + Math.abs(Math.sin(t * 18 + i)) * 0.5); });
          bolt.scale.setScalar(1 + (on ? Math.abs(Math.sin(t * 20)) * 0.15 : 0));
        }];
      },
    },
    // Viajero del tiempo (Tic): goggles de reloj en la frente (encima de tu pelo), chaleco verde agua con moño naranja
    // y reloj de bolsillo colgando. Se ve tu peinado.
    tic: {
      name: 'Viajero del tiempo', moves: ['pensando', 'sorpresa', 'guino'], sleeve: '#f6efe0',
      build(part, head, torso, k) {
        const V = '#2fb6a0';
        shirt(part, torso, this.sleeve, k.skin);
        // Chaleco: dos mitades verdes al frente, abiertas en medio.
        for (const sx of [-1, 1]) torso.add(part(new THREE.SphereGeometry(0.17, 16, 10), V, { x: sx * 0.12, y: -0.42, z: 0.12, rz: sx * 0.15, ol: 0.05, s: [0.85, 1, 0.55] }));
        const bow = new THREE.Group(); bow.position.set(0, -0.27, 0.16); bow.rotation.x = -0.4;
        for (const sx of [-1, 1]) bow.add(part(new THREE.ConeGeometry(0.035, 0.06, 4), '#ff9c5b', { x: sx * 0.028, rz: sx * Math.PI / 2, ol: 0.15, s: [1, 1, 0.5] }));
        bow.add(part(new THREE.SphereGeometry(0.018, 8, 6), '#e2753a', { ol: 0.2 }));
        torso.add(bow);
        // Reloj de bolsillo con su cadenita.
        const watch = new THREE.Group(); watch.position.set(0.13, -0.4, 0.215); watch.rotation.x = -0.35;
        watch.add(part(new THREE.CylinderGeometry(0.04, 0.04, 0.018, 18), '#ffc83d', { rx: Math.PI / 2, ol: 0.16 }));
        const face = new THREE.Mesh(new THREE.CircleGeometry(0.03, 18), flat('#fff6e6')); face.position.z = 0.011; watch.add(face);
        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.024, 0.002), flat(INK)); hand.geometry.translate(0, 0.012, 0); hand.position.z = 0.013; watch.add(hand);
        torso.add(watch);
        const chain = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.005, 4, 14, Math.PI * 0.8), flat('#ffc83d'));
        chain.position.set(0.08, -0.37, 0.205); chain.rotation.set(-0.35, 0, Math.PI * 1.05); torso.add(chain);
        // Goggles con carátula de reloj en cada lente.
        const hands = [];
        goggles(part, head, { strap: '#6a4028', rim: '#d9a441', y: 0.19, r: 0.305, inside: (l) => {
          const h = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.002, 0.03), flat(INK)); h.geometry.translate(0, 0, 0.015); h.position.y = 0.021; l.add(h); hands.push(h);
          const c = new THREE.Mesh(new THREE.CircleGeometry(0.008, 8), flat(INK)); c.rotation.x = -Math.PI / 2; c.position.y = 0.022; l.add(c);
        } });
        return [(f, t) => {
          hands.forEach((h, i) => (h.rotation.y = -t * (i ? 1.2 : 0.4) * (f.back ? 6 : 1)));
          hand.rotation.z = -t * 0.8;
          watch.rotation.z = Math.sin(t * 2.2) * 0.15;
        }];
      },
    },
    // Guardián (Bruno): capucha verde de viajero con su orilla, capa verde sobre los hombros y el anillo dorado colgando.
    guardian: {
      name: 'Guardián', hood: true, moves: ['timido', 'asiente', 'sorpresa'], sleeve: '#5aa85f',
      build(part, head, torso, k, toon) {
        const G = this.sleeve, D = '#3f8a4a';
        shirt(part, torso, '#c9a46a', k.skin);
        // Capa: cae de los hombros, más oscura, con su broche.
        for (const sx of [-1, 1]) torso.add(part(new THREE.SphereGeometry(0.2, 16, 10), D, { x: sx * 0.2, y: -0.4, z: 0.02, rz: sx * 0.35, ol: 0.05, s: [0.75, 1, 0.75] }));
        torso.add(part(new THREE.SphereGeometry(0.022, 10, 8), '#ffc83d', { x: 0.1, y: -0.27, z: 0.15, ol: 0.2 }));
        hoodCap(part, head, G, toon);
        // Punta de la capucha caída atrás.
        head.add(part(new THREE.ConeGeometry(0.1, 0.22, 12), G, { y: 0.12, z: -0.28, rx: -2.2, ol: 0.1 }));
        // Anillo dorado en su cordón.
        const ring = new THREE.Group(); ring.position.set(0, -0.36, 0.2); ring.rotation.x = -0.35;
        ring.add(part(new THREE.TorusGeometry(0.03, 0.011, 8, 18), '#ffc83d', { ol: 0.25 }));
        torso.add(ring);
        const cord = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.006, 4, 16, Math.PI), flat('#6a4028'));
        cord.position.set(0, -0.27, 0.17); cord.rotation.set(-0.7, 0, Math.PI); torso.add(cord);
        return [(f, t) => {
          ring.rotation.z = Math.sin(t * 2) * 0.25;
          ring.children[0].rotation.y = t * 1.5;
        }];
      },
    },
    // Mago (Zafiro): capucha y túnica azul, sombrero alto con estrellas, barba blanca postiza abajo de la boca y su varita
    // con estrella que brilla.
    mago: {
      name: 'Mago', hood: true, moves: ['pensando', 'guino', 'asiente'], sleeve: '#4a5ad8',
      build(part, head, torso, k, toon) {
        const B = this.sleeve, D = '#2a3a9a', Y = '#ffc83d';
        shirt(part, torso, B, k.skin);
        hoodCap(part, head, B, toon);
        // Sombrero: ala ancha y cono alto con la punta doblada.
        // (Bajito: alto se salía del círculo.)
        const hat = new THREE.Group(); hat.position.set(0, 0.18, -0.03); hat.rotation.x = -0.12;
        hat.add(part(new THREE.CylinderGeometry(0.27, 0.27, 0.022, 28), D, { ol: 0.05 }));
        hat.add(part(new THREE.CylinderGeometry(0.065, 0.18, 0.16, 20), B, { y: 0.08, ol: 0.06 }));
        const tip = new THREE.Group(); tip.position.y = 0.16;
        tip.add(part(new THREE.ConeGeometry(0.065, 0.1, 12), B, { y: 0.04, ol: 0.1 }));
        hat.add(tip);
        [[0.05, 0.05, 0.14, 0.03], [-0.06, 0.1, 0.09, 0.022]].forEach(([x, y, z, r]) => hat.add(part(starGeo(r, r * 0.45), Y, { x, y, z, rx: -0.3, ol: 0.15 })));
        head.add(hat);
        // Barba: abajo de la boca (no la tapa) y con unas ondas.
        const beard = new THREE.Group(); beard.position.set(0, -0.24, 0.13);
        beard.add(part(new THREE.SphereGeometry(0.13, 18, 12), '#f4f1ff', { s: [1.05, 0.95, 0.65], ol: 0.06 }));
        beard.add(part(new THREE.ConeGeometry(0.08, 0.14, 12), '#f4f1ff', { y: -0.14, rz: Math.PI, ol: 0.08, s: [1, 1, 0.65] }));
        head.add(beard);
        // Varita junto al hombro con su estrella.
        const wand = new THREE.Group(); wand.position.set(0.19, -0.32, 0.18); wand.rotation.z = -0.25;
        wand.add(part(new THREE.CylinderGeometry(0.01, 0.012, 0.2, 6), '#6a4028', { y: 0.1, ol: 0.25 }));
        const star = part(starGeo(0.04, 0.018), Y, { y: 0.22, ol: 0.18 });
        wand.add(star);
        torso.add(wand);
        return [(f, t) => {
          tip.rotation.z = -0.6 + Math.sin(t * 1.6) * 0.15;
          star.rotation.z = t * 1.2;
          star.scale.setScalar(1 + Math.sin(t * 5) * 0.12);
          wand.rotation.z = -0.25 + Math.sin(t * 1.4) * 0.08;
          beard.rotation.z = Math.sin(t * 1.1) * 0.03;
        }];
      },
    },
    // Caballero (Sir Galleta): casco plateado con la visera levantada y penacho rojo, armadura y escudo de galleta.
    caballero: {
      name: 'Caballero', hood: true, moves: ['asiente', 'saludo', 'risa'], sleeve: '#c8d0e6',
      build(part, head, torso, k, toon) {
        const M = this.sleeve, D = '#8f9cc4';
        shirt(part, torso, M, k.skin);
        belly(part, torso, '#e3e8f6', 1.15);
        hoodCap(part, head, M, toon);
        // Visera levantada: una franja curva arriba de la frente, con sus rendijas.
        const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.325, 0.325, 0.07, 28, 1, true, -0.9, 1.8), toon({ color: D, side: THREE.DoubleSide }));
        visor.position.y = 0.17; visor.rotation.x = -0.35; head.add(visor);
        [-0.08, 0, 0.08].forEach((x) => head.add(part(new THREE.BoxGeometry(0.045, 0.01, 0.01), INK, { ...onCap(x, 0.5, 0.95, 0.335), rx: -0.45, ol: 0 })));
        // Penacho rojo de plumas que se mece.
        const plume = new THREE.Group(); const pp = onCap(0, 1, -0.25, 0.3); plume.position.set(pp.x, pp.y, pp.z);
        [-0.35, 0, 0.35].forEach((rz) => plume.add(part(new THREE.CapsuleGeometry(0.035, 0.12, 4, 8), '#e8434f', { y: 0.08, rz, ol: 0.12 })));
        head.add(plume);
        // Escudo de galleta con chispas de chocolate.
        const shield = new THREE.Group(); shield.position.set(-0.2, -0.34, 0.19); shield.rotation.set(-0.3, -0.3, 0.15);
        shield.add(part(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 20), '#d9a056', { rx: Math.PI / 2, ol: 0.1 }));
        [[-0.04, 0.03], [0.04, 0.04], [0.01, -0.02], [-0.05, -0.05], [0.05, -0.04]].forEach(([x, y]) => shield.add(part(new THREE.SphereGeometry(0.013, 6, 5), '#5a331b', { x, y, z: 0.016, ol: 0, s: [1, 1, 0.5] })));
        torso.add(shield);
        return [(f, t) => {
          plume.rotation.z = Math.sin(t * 2) * 0.12 + (f.laugh ? Math.sin(t * 12) * 0.15 : 0);
          plume.rotation.x = f.nod ? Math.sin(t * 9) * 0.2 : 0;
        }];
      },
    },
    // Profe Voltaje: peluca blanca despeinada que se mueve (tapa tu pelo), goggles en la frente y bata de laboratorio
    // con corbata roja.
    profe: {
      name: 'Profe Voltaje', wig: true, moves: ['sorpresa', 'pensando', 'risa'], sleeve: '#f6f4ff',
      build(part, head, torso, k) {
        const W = this.sleeve, HAIR = '#eef0f6';
        shirt(part, torso, W, k.skin);
        // Camisa azul y corbata en el hueco de la bata.
        torso.add(part(new THREE.SphereGeometry(0.1, 12, 8), '#9fc8f0', { y: -0.33, z: 0.17, ol: 0.08, s: [0.8, 1, 0.4] }));
        torso.add(part(new THREE.ConeGeometry(0.03, 0.11, 4), '#e8455a', { y: -0.36, z: 0.215, rz: Math.PI, rx: 0.35, ol: 0.2, s: [1, 1, 0.4] }));
        for (const sx of [-1, 1]) torso.add(part(new THREE.BoxGeometry(0.05, 0.14, 0.02), W, { x: sx * 0.075, y: -0.34, z: 0.2, rz: sx * 0.35, rx: -0.35, ol: 0.15 }));
        // Peluca: casquito y mechones despeinados para los lados y atrás, que se mueven.
        cap(part, head, HAIR, 0.28);
        const tufts = [[-0.27, 0.06, -0.02, 1.9], [0.27, 0.06, -0.02, -1.9], [-0.24, 0.17, -0.08, 1.2], [0.24, 0.17, -0.08, -1.2], [-0.12, 0.27, -0.1, 0.6], [0.12, 0.27, -0.1, -0.6], [0, 0.22, -0.2, 0.05], [-0.24, -0.05, -0.08, 2.4], [0.24, -0.05, -0.08, -2.4]]
          .map(([x, y, z, rz]) => { const g = part(new THREE.SphereGeometry(0.065, 10, 8), HAIR, { x, y, z, rz, ol: 0.1, s: [1, 1.7, 1] }); head.add(g); return g; });
        const lenses = goggles(part, head, { strap: '#5a5a7a', rim: '#7f86a8', y: 0.2, r: 0.29 });
        return [(f, t) => {
          tufts.forEach((g, i) => (g.scale.y = 1 + Math.sin(t * 3 + i * 1.7) * 0.08 + (f.back ? Math.abs(Math.sin(t * 16 + i)) * 0.25 : 0)));
          lenses.forEach((l, i) => l.children[1].material.color.set(f.back && (t * 8 + i) % 2 < 1 ? '#fff4c7' : '#bfe8ff'));
        }];
      },
    },
    // Turbo: gorra roja al revés encima de tu pelo, chaleco inflable rojo sobre playera de mezclilla y reloj del futuro
    // con números que brillan. Se ve tu peinado.
    turbo: {
      name: 'Turbo', moves: ['saludo', 'guino', 'risa'], sleeve: '#6a8fd0',
      build(part, head, torso, k, toon) {
        const R = '#e8434f', RD = '#b52a3a';
        shirt(part, torso, this.sleeve, k.skin);
        // Chaleco inflable: dos mitades rojas acolchadas, abiertas en medio.
        for (const sx of [-1, 1]) {
          torso.add(part(new THREE.SphereGeometry(0.18, 16, 10), R, { x: sx * 0.13, y: -0.43, z: 0.11, rz: sx * 0.12, ol: 0.05, s: [0.8, 1, 0.6] }));
          torso.add(part(new THREE.TorusGeometry(0.1, 0.008, 4, 16, Math.PI * 0.7), RD, { x: sx * 0.13, y: -0.43, z: 0.215, rx: -0.35, rz: Math.PI * 1.15, ol: 0 }));
        }
        // Gorra al revés: copa encima del pelo y la visera atrás.
        const capG = new THREE.Group(); capG.position.set(0, 0.06, -0.01); capG.rotation.x = -0.25;
        capG.add(part(new THREE.SphereGeometry(0.3, 26, 12, 0, TAU, 0, Math.PI * 0.42), R, { ol: 0.04, mat: toon({ color: R, side: THREE.DoubleSide }) }));
        // Visera atrás, levantada para que se asome por arriba.
        capG.add(part(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 20, 1, false, 0, Math.PI), R, { y: 0.12, z: -0.25, rx: -0.7, ry: Math.PI / 2, ol: 0.1, s: [1, 1, 1.1] }));
        // Al frente, el hueco de atrás de la gorra con su correa.
        capG.add(part(new THREE.TorusGeometry(0.06, 0.012, 6, 16, Math.PI), RD, { y: 0.135, z: 0.265, rx: -0.5, ol: 0.2 }));
        capG.add(part(new THREE.SphereGeometry(0.025, 8, 6), RD, { y: 0.3, ol: 0.2 }));
        head.add(capG);
        // Reloj del futuro en el chaleco: pantallita que parpadea.
        const watch = new THREE.Group(); watch.position.set(-0.13, -0.37, 0.235); watch.rotation.x = -0.35;
        watch.add(part(new THREE.BoxGeometry(0.075, 0.05, 0.02), '#5a5a7a', { ol: 0.15 }));
        const scr = flat('#5ff0ff'); const digits = new THREE.Mesh(new THREE.PlaneGeometry(0.055, 0.03), scr); digits.position.z = 0.011; watch.add(digits);
        torso.add(watch);
        const a = new THREE.Color('#5ff0ff'), b = new THREE.Color('#c8fff9');
        return [(f, t) => {
          scr.color.copy(Math.floor(t * 2) % 2 ? a : b);
          capG.rotation.z = Math.sin(t * 1.3) * 0.03 + (f.laugh ? Math.sin(t * 12) * 0.05 : 0);
        }];
      },
    },
  };
};
