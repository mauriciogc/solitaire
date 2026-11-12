// Disfraces 3D, tanda E (10 nov 2026): exclusivos de eventos. Cangrejo, topo minero, ardilla, osito de gomita,
// triceratops, perro robot, pulpo pintor, ranita rockera y mapache director.
// Ver js/avatar3d.js: export default (H) => ({ clave: { name, moves, sleeve, hood | wig, build } }).
// hood: gorro (tu pelo no se dibuja) · wig: peluca (el disfraz pone su pelo) · sin ninguno: se ve tu peinado.
const INK = '#2a1f5c';

export default (H) => {
  const { THREE, TAU, flat, shirt, hoodCap, onCap, belly, neckRing } = H;
  const Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
  // Algo pegado a la cabeza en la dirección d (a radio r), con su eje y (conos, antenas) o z (cosas planas) hacia afuera.
  const point = (obj, x, y, z, r, axis = Y) => { const d = new THREE.Vector3(x, y, z).normalize(); obj.position.copy(d).multiplyScalar(r); obj.quaternion.setFromUnitVectors(axis, d); return obj; };
  // Ojo saltón de animal (cangrejo, rana): bola blanca con pupila de tinta y brillito. La pupila se mueve sola.
  const bigEye = (part, r) => {
    const g = new THREE.Group();
    g.add(part(new THREE.SphereGeometry(r, 14, 10), '#fffdf7', { ol: 0.1 }));
    const p = new THREE.Mesh(new THREE.SphereGeometry(r * 0.52, 10, 8), flat(INK)); p.position.z = r * 0.6; p.scale.z = 0.6;
    const hi = new THREE.Mesh(new THREE.SphereGeometry(r * 0.18, 6, 4), flat('#ffffff')); hi.position.set(-r * 0.18, r * 0.2, r * 0.42); p.add(hi);
    g.add(p);
    return { g, p };
  };
  // Concha de pala (paleta, gola): figura plana con grosor desde una lista de puntos.
  const slab = (pts, depth = 0.02) => {
    const sh = new THREE.Shape(); pts.forEach(([x, y], i) => sh[i ? 'lineTo' : 'moveTo'](x, y));
    return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false }).translate(0, 0, -depth / 2);
  };

  return {
    // Cangrejo (Pinzas): gorro rojo con manchitas, dos ojitos en antenas que miran para todos lados y pinzas en los
    // hombros que se abren y se cierran.
    cangrejo: {
      name: 'Cangrejo', hood: true, moves: ['risa', 'sorpresa', 'saludo'], sleeve: '#e8455a',
      build(part, head, torso, k, toon) {
        const R = this.sleeve, L = '#ffb3a0';
        shirt(part, torso, R, k.skin);
        belly(part, torso, L, 1.05);
        hoodCap(part, head, R, toon);
        [[-0.17, 0.2, 0.14], [0.17, 0.19, 0.12], [-0.06, 0.29, 0.02], [0.08, 0.27, -0.06]].forEach(([x, y, z]) => head.add(part(new THREE.SphereGeometry(0.028, 8, 6), L, { ...onCap(x, y, z, 0.306), ol: 0, s: [1, 1, 0.35] })));
        // Ojitos en antenas.
        const stalks = [-1, 1].map((sx) => {
          const g = new THREE.Group(); const b = onCap(sx * 0.11, 0.3, 0.08, 0.28); g.position.set(b.x, b.y, b.z); g.rotation.z = -sx * 0.22;
          g.add(part(new THREE.CylinderGeometry(0.013, 0.018, 0.1, 8), R, { y: 0.05, ol: 0.2 }));
          const e = bigEye(part, 0.038); e.g.position.y = 0.11; g.add(e.g);
          head.add(g); return { g, e, sx };
        });
        // Pinzas en los hombros: una bola y dos tenazas que se abren.
        const claws = [-1, 1].map((sx) => {
          const c = new THREE.Group(); c.position.set(sx * 0.25, -0.27, 0.07); c.rotation.z = -sx * 0.35;
          c.add(part(new THREE.SphereGeometry(0.058, 12, 10), R, { ol: 0.1, s: [1, 1.1, 0.8] }));
          const jaws = [-1, 1].map((j) => { const g = new THREE.Group(); g.position.y = 0.035; g.add(part(new THREE.ConeGeometry(0.026, 0.085, 8), R, { y: 0.042, x: j * 0.012, ol: 0.14 })); c.add(g); return { g, j }; });
          torso.add(c); return { c, jaws, sx };
        });
        return [(f, t) => {
          stalks.forEach(({ g, e, sx }) => {
            g.rotation.z = -sx * (0.22 + Math.sin(t * 2.1 + sx) * 0.08) + (f.back ? -sx * 0.15 : 0);
            e.p.position.x = Math.sin(t * 1.3 + sx * 2) * 0.012; e.p.position.y = Math.sin(t * 0.9 + sx) * 0.008;
          });
          const open = 0.12 + Math.max(0, Math.sin(t * 2.6)) * 0.35 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.25 : 0);
          claws.forEach(({ c, jaws, sx }) => {
            c.rotation.z = -sx * (0.35 + Math.sin(t * 1.6 + sx) * 0.06);
            jaws.forEach(({ g, j }) => (g.rotation.z = j * -open));
          });
        }];
      },
    },
    // Topo minero (Topacio): gorro gris de topo con orejitas, casco amarillo de minero con lámpara que titila, overol
    // café con tirantes y una gema que brilla.
    topo: {
      name: 'Topo minero', hood: true, moves: ['bostezo', 'sorpresa', 'asiente'], sleeve: '#8a6a4a',
      build(part, head, torso, k, toon) {
        const G = '#9d98ae', Yl = '#ffc83d';
        shirt(part, torso, this.sleeve, k.skin);
        for (const sx of [-1, 1]) torso.add(part(new THREE.BoxGeometry(0.035, 0.17, 0.02), '#5a3a22', { x: sx * 0.1, y: -0.34, z: 0.205, rx: -0.4, rz: sx * 0.08, ol: 0.15 }));
        const gemMat = flat('#5ff0ff');
        const gem = part(new THREE.OctahedronGeometry(0.045, 0), null, { x: -0.13, y: -0.4, z: 0.22, ol: 0.15, s: [0.8, 1.15, 0.8], mat: gemMat });
        torso.add(gem);
        hoodCap(part, head, G, toon);
        for (const sx of [-1, 1]) head.add(part(new THREE.SphereGeometry(0.045, 10, 8), G, { ...onCap(sx, 0.02, -0.08, 0.3), ol: 0.12, s: [0.5, 1, 1] }));
        // Casco: domo amarillo encima del gorro con su ala y la lámpara al frente.
        const helm = new THREE.Group(); helm.position.y = 0.03; helm.rotation.x = -0.25;
        helm.add(part(new THREE.SphereGeometry(0.318, 24, 10, 0, TAU, 0, Math.PI * 0.36), Yl, { ol: 0.04, mat: toon({ color: Yl, side: THREE.DoubleSide }) }));
        helm.add(part(new THREE.TorusGeometry(0.29, 0.022, 6, 30), Yl, { y: 0.135, rx: Math.PI / 2, ol: 0.14 }));
        helm.add(part(new THREE.TorusGeometry(0.2, 0.012, 6, 24, Math.PI), '#e8a417', { y: 0.2, rx: -0.2, ol: 0 }));
        const lamp = new THREE.Group(); point(lamp, 0, 0.62, 0.78, 0.31, Z);
        lamp.add(part(new THREE.CylinderGeometry(0.045, 0.05, 0.04, 16), '#8a8a9a', { rx: Math.PI / 2, ol: 0.14 }));
        const glow = flat('#fff4b0'); const disc = new THREE.Mesh(new THREE.CircleGeometry(0.034, 16), glow); disc.position.z = 0.022; lamp.add(disc);
        helm.add(lamp); head.add(helm);
        const a = new THREE.Color('#fff4b0'), b = new THREE.Color('#ffd23d'), g1 = new THREE.Color('#5ff0ff'), g2 = new THREE.Color('#d9b8ff');
        return [(f, t) => {
          glow.color.copy(a).lerp(b, (Math.sin(t * 7) + Math.sin(t * 13)) * 0.25 + 0.5);
          gem.rotation.y = t * 0.8;
          gemMat.color.copy(g1).lerp(g2, (Math.sin(t * 1.7) + 1) / 2);
          helm.rotation.z = Math.sin(t * 1.2) * 0.03 + (f.back ? 0.06 : 0);
        }];
      },
    },
    // Ardilla (Avellana): gorro café con orejas de punta y mechoncito, colota esponjada que sube por detrás y se mece,
    // panza crema y una bellota.
    ardilla: {
      name: 'Ardilla', hood: true, moves: ['cachetes', 'risa', 'guino'], sleeve: '#c47a3a',
      build(part, head, torso, k, toon) {
        const B = this.sleeve, C = '#ffe6c4', D = '#8a4a1f';
        shirt(part, torso, B, k.skin);
        belly(part, torso, C, 1);
        hoodCap(part, head, B, toon);
        head.add(part(new THREE.SphereGeometry(0.06, 12, 8), C, { ...onCap(0, 0.2, 0.25, 0.3), ol: 0, s: [1.6, 0.5, 0.3] }));
        const ears = [-1, 1].map((sx) => {
          const e = new THREE.Group(); point(e, sx * 0.17, 0.28, 0.0, 0.27);
          e.add(part(new THREE.ConeGeometry(0.05, 0.12, 10), B, { y: 0.06, ol: 0.12, s: [1, 1, 0.6] }));
          e.add(part(new THREE.ConeGeometry(0.02, 0.06, 6), D, { y: 0.13, ol: 0.15 }));
          head.add(e); return e;
        });
        // Cola: bolitas que suben por detrás del hombro y se enroscan junto a la cabeza.
        const tail = new THREE.Group(); tail.position.set(-0.2, -0.3, -0.1); torso.add(tail);
        const segs = [[0, 0, 0.08], [-0.04, 0.08, 0.088], [-0.07, 0.17, 0.088], [-0.075, 0.26, 0.082], [-0.05, 0.33, 0.072], [-0.01, 0.37, 0.06]].map(([x, y, r], i) => {
          const s = part(new THREE.SphereGeometry(r, 12, 10), i > 3 ? '#d98a4a' : B, { x, y, ol: 0.07 }); tail.add(s); return s;
        });
        const nut = new THREE.Group(); nut.position.set(0.12, -0.39, 0.215); nut.rotation.set(-0.3, 0, 0.3);
        nut.add(part(new THREE.SphereGeometry(0.035, 12, 10), '#d9a35a', { y: -0.015, ol: 0.14, s: [1, 1.2, 1] }));
        nut.add(part(new THREE.SphereGeometry(0.038, 12, 8, 0, TAU, 0, Math.PI / 2), '#6a4028', { y: 0.005, ol: 0.14 }));
        nut.add(part(new THREE.CylinderGeometry(0.006, 0.006, 0.025, 6), '#6a4028', { y: 0.045, ol: 0 }));
        torso.add(nut);
        return [(f, t) => {
          tail.rotation.z = Math.sin(t * 1.8) * 0.08 + (f.laugh ? Math.sin(t * 12) * 0.08 : 0);
          segs.forEach((s, i) => (s.position.x = [0, -0.04, -0.07, -0.075, -0.05, -0.01][i] + Math.sin(t * 2.4 - i * 0.6) * 0.012 * i));
          ears.forEach((e, i) => (e.children[1].rotation.z = Math.sin(t * 3 + i) * 0.25));
          nut.rotation.z = 0.3 + Math.sin(t * 1.5) * 0.1;
        }];
      },
    },
    // Osito de gomita (Gomi): gorro de gomita roja brillante con orejas redondas y destellos, que tiembla como gomita.
    osito: {
      name: 'Osito de gomita', hood: true, moves: ['risa', 'timido', 'asiente'], sleeve: '#ff3d5a',
      build(part, head, torso, k, toon) {
        const R = this.sleeve;
        const gum = toon({ color: R, emissive: new THREE.Color('#4a0010'), side: THREE.DoubleSide });
        shirt(part, torso, R, k.skin);
        belly(part, torso, '#ff8a9e', 0.95);
        head.add(part(new THREE.SphereGeometry(0.305, 28, 14, 0, TAU, 0, Math.PI * 0.62), R, { rx: -0.75, ol: 0.035, mat: gum }));
        const ears = [-1, 1].map((sx) => { const e = part(new THREE.SphereGeometry(0.075, 14, 10), R, { ...onCap(sx * 0.2, 0.25, -0.02, 0.29), ol: 0.08, mat: gum }); head.add(e); return e; });
        // Destellos de gomita: rayitas blancas.
        const shine = flat('#ffffff', 0.8);
        const s1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.07, 3, 6), shine); point(s1, -0.16, 0.24, 0.15, 0.31, Z); s1.rotateZ(0.7); head.add(s1);
        const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), shine); point(s2, -0.1, 0.3, 0.12, 0.312, Z); head.add(s2);
        for (const sx of [-1, 1]) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), shine); s.position.set(sx * 0.2 - 0.025, 0.28, 0.05); head.add(s); }
        const s3 = new THREE.Mesh(new THREE.CapsuleGeometry(0.01, 0.05, 3, 6), shine); s3.position.set(-0.14, -0.38, 0.215); s3.rotation.set(-0.3, 0, 0.6); torso.add(s3);
        return [(f, t) => {
          const glow = 0.18 + Math.sin(t * 2.2) * 0.1;
          gum.emissive.setRGB(glow, glow * 0.05, glow * 0.15);
          const j = Math.sin(t * 9) * 0.03 * (0.5 + 0.5 * Math.sin(t * 0.8)) + (f.laugh ? Math.sin(t * 14) * 0.06 : 0);
          ears.forEach((e, i) => e.scale.set(1 + j * (i ? 1 : -1), 1 - j, 1));
          shine.opacity = 0.6 + Math.sin(t * 2.2) * 0.25;
        }];
      },
    },
    // Triceratops (Trici): gorro verde agua con dos cuernos sobre las cejas y uno chiquito al frente, y una gola naranja
    // de orilla ondulada detrás de la cabeza (no es el dinosaurio: ese lleva cresta de placas).
    triceratops: {
      name: 'Triceratops', hood: true, moves: ['sorpresa', 'cachetes', 'risa'], sleeve: '#3fb8a0',
      build(part, head, torso, k, toon) {
        const G = this.sleeve, O = '#ffb02e', Cr = '#fff1d6';
        shirt(part, torso, G, k.skin);
        belly(part, torso, '#c8f0e0', 1.05);
        // Gola: abanico de orilla ondulada detrás de la cabeza, con pintitas.
        const pts = [];
        for (let i = 0; i <= 24; i++) { const a = -0.2 + (i / 24) * (Math.PI + 0.4), r = i % 2 ? 0.355 : 0.38; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
        pts.push([0, -0.05]);
        const frill = new THREE.Group(); frill.position.set(0, 0.02, -0.16); frill.rotation.x = -0.3;
        frill.add(part(slab(pts, 0.03), O, { ol: 0.04 }));
        for (let i = 0; i < 7; i++) { const a = -0.05 + (i / 6) * (Math.PI + 0.1); frill.add(part(new THREE.CircleGeometry(0.02, 10), '#e2752a', { x: Math.cos(a) * 0.32, y: Math.sin(a) * 0.32, z: 0.017, ol: 0 })); }
        head.add(frill);
        hoodCap(part, head, G, toon);
        const horns = [];
        for (const sx of [-1, 1]) { const h = part(new THREE.ConeGeometry(0.03, 0.12, 10), Cr, { ol: 0.14 }); point(h, sx * 0.12, 0.25, 0.2, 0.33); h.lookAt(h.position.clone().add(new THREE.Vector3(sx * 0.15, 0.55, 0.85))); h.rotateX(Math.PI / 2); head.add(h); horns.push(h); }
        const nose = part(new THREE.ConeGeometry(0.022, 0.06, 8), Cr, { ol: 0.16 }); point(nose, 0, 0.19, 0.27, 0.32); head.add(nose);
        return [(f, t) => {
          frill.rotation.z = Math.sin(t * 1.4) * 0.04;
          frill.scale.setScalar(1 + (f.back ? 0.05 : 0) + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.03 : 0));
          horns.forEach((h, i) => (h.scale.y = 1 + Math.sin(t * 2 + i) * 0.04));
        }];
      },
    },
    // Perro robot (Rufo): casco cobrizo con remaches, orejas de lámina que se doblan en su bisagra, una franja de luz
    // azul que barre de lado a lado, y un collar con su placa de hueso que brilla.
    robodog: {
      name: 'Perro robot', hood: true, moves: ['lengua', 'asiente', 'saludo'], sleeve: '#e09a4a',
      build(part, head, torso, k, toon) {
        const C = this.sleeve, D = '#a8642a', Bl = '#5ff0ff';
        shirt(part, torso, C, k.skin);
        torso.add(part(new THREE.BoxGeometry(0.16, 0.1, 0.03), '#8a8a9a', { y: -0.38, z: 0.205, rx: -0.35, ol: 0.1 }));
        const scr = flat('#3a4a8a');
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.06), scr); screen.position.set(0, -0.375, 0.225); screen.rotation.x = -0.35; torso.add(screen);
        const bone = new THREE.Group(); bone.position.set(0, -0.375, 0.228); bone.rotation.x = -0.35;
        const bm = flat(Bl);
        bone.add(new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.012), bm));
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const c = new THREE.Mesh(new THREE.CircleGeometry(0.009, 8), bm); c.position.set(sx * 0.027, sy * 0.008, 0.001); bone.add(c); }
        torso.add(bone);
        torso.add(neckRing(part, '#3a3a5a', 0.022));
        hoodCap(part, head, C, toon);
        // Franja de remaches y la luz que barre en la frente.
        for (let i = -3; i <= 3; i++) head.add(part(new THREE.SphereGeometry(0.012, 6, 4), D, { ...onCap(i * 0.07, 0.3, 0.02 - Math.abs(i) * 0.015, 0.308), ol: 0 }));
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.012), flat('#1a2a4a')); point(bar, 0, 0.2, 0.27, 0.305, Z); head.add(bar);
        const dot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.018, 0.014), flat(Bl)); bar.add(dot);
        // Orejas de lámina: cuelgan de una bisagra y se doblan.
        const ears = [-1, 1].map((sx) => {
          const e = new THREE.Group(); const p = onCap(sx * 0.2, 0.22, -0.02, 0.29); e.position.set(p.x, p.y, p.z);
          e.add(part(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 10), '#8a8a9a', { rz: Math.PI / 2, ol: 0.14 }));
          e.add(part(new THREE.BoxGeometry(0.09, 0.17, 0.022), D, { y: -0.09, x: sx * 0.03, ol: 0.1 }));
          e.add(part(new THREE.SphereGeometry(0.01, 6, 4), '#8a8a9a', { y: -0.14, x: sx * 0.03, z: 0.013, ol: 0 }));
          head.add(e); return { e, sx };
        });
        return [(f, t) => {
          dot.position.x = Math.sin(t * 2.5) * 0.06;
          bm.color.setHSL(0.52, 1, 0.6 + Math.sin(t * 4) * 0.1);
          ears.forEach(({ e, sx }, i) => (e.rotation.z = sx * (0.35 + Math.max(0, Math.sin(t * 1.5 + i * 1.3)) * 0.35 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.2 : 0) + (f.nod ? 0.15 : 0))));
        }];
      },
    },
    // Pulpo pintor (Pincelín): gorro coral de pulpo con tentáculos cortos enroscados, boina azul ladeada, bata blanca
    // con manchas de pintura y su paleta de colores (no es el Pulpo morado: ese lleva tentáculos largos).
    pulpopintor: {
      name: 'Pulpo pintor', hood: true, moves: ['pensando', 'guino', 'risa'], sleeve: '#fffdf7',
      build(part, head, torso, k, toon) {
        const P = '#ff7a8e', B = '#2f3f9e', paints = ['#ffc83d', '#4aa8de', '#5fbf5a', '#e8455a', '#9a6cf0'];
        shirt(part, torso, this.sleeve, k.skin);
        [[-0.17, -0.34, 0.17, 0], [0.18, -0.43, 0.17, 1], [0.05, -0.31, 0.2, 2], [-0.04, -0.5, 0.21, 3]].forEach(([x, y, z, i]) => torso.add(part(new THREE.SphereGeometry(0.022, 8, 6), paints[i], { x, y, z, ol: 0, s: [1.3, 1, 0.35] })));
        // Paleta con su hoyito y gotas de pintura, y un pincel.
        const pal = new THREE.Group(); pal.position.set(-0.13, -0.4, 0.22); pal.rotation.set(-0.35, 0, 0.35);
        const pp = []; for (let i = 0; i <= 20; i++) { const a = (i / 20) * TAU; pp.push([Math.cos(a) * 0.085, Math.sin(a) * 0.06]); }
        pal.add(part(slab(pp, 0.014), '#e8b878', { ol: 0.1 }));
        pal.add(part(new THREE.CircleGeometry(0.014, 10), '#c49058', { x: 0.045, y: -0.02, z: 0.0075, ol: 0 }));
        paints.forEach((c, i) => { const a = 1.9 + i * 0.75; pal.add(part(new THREE.CircleGeometry(0.016, 10), c, { x: Math.cos(a) * 0.055, y: Math.sin(a) * 0.035, z: 0.008, ol: 0 })); });
        torso.add(pal);
        const brush = new THREE.Group(); brush.position.set(0.15, -0.38, 0.22); brush.rotation.set(-0.3, 0, -0.5);
        brush.add(part(new THREE.CylinderGeometry(0.008, 0.008, 0.11, 6), '#c4501f', { ol: 0.2 }));
        brush.add(part(new THREE.ConeGeometry(0.014, 0.035, 8), '#4aa8de', { y: 0.07, ol: 0.2 }));
        torso.add(brush);
        hoodCap(part, head, P, toon);
        for (const sx of [-1, 1]) head.add(part(new THREE.SphereGeometry(0.02, 8, 6), INK, { ...onCap(sx * 0.08, 0.25, 0.2, 0.31), ol: 0, s: [1, 1.2, 0.5] }));
        // Tentáculos cortos enroscados, dos por lado.
        const curls = [];
        for (const sx of [-1, 1]) for (const [y, z] of [[-0.02, 0.05], [-0.08, -0.06]]) {
          const c = new THREE.Group(); c.position.set(sx * 0.27, y - 0.04, z + 0.04);
          c.add(part(new THREE.TorusGeometry(0.045, 0.024, 6, 12, Math.PI * 1.5), P, { rz: sx > 0 ? Math.PI : 0, ry: sx * 0.3, ol: 0.15 }));
          c.add(part(new THREE.SphereGeometry(0.011, 6, 4), '#ffd0d8', { x: sx * 0.045, y: 0, z: 0.02, ol: 0 }));
          head.add(c); curls.push({ c, sx });
        }
        // Boina ladeada con su colita.
        const beret = new THREE.Group(); beret.position.set(0.05, 0.27, 0.02); beret.rotation.set(-0.35, 0, -0.3);
        beret.add(part(new THREE.SphereGeometry(0.2, 22, 10), B, { s: [1, 0.25, 1], ol: 0.05 }));
        beret.add(part(new THREE.CylinderGeometry(0.008, 0.012, 0.04, 6), B, { y: 0.06, ol: 0.2 }));
        head.add(beret);
        return [(f, t) => {
          curls.forEach(({ c, sx }, i) => (c.rotation.z = sx * Math.sin(t * 2 + i) * 0.15 + (f.laugh ? Math.sin(t * 12 + i) * 0.12 : 0)));
          beret.rotation.z = -0.3 + Math.sin(t * 1.3) * 0.05;
          brush.rotation.z = -0.5 + Math.sin(t * 2.2) * 0.12;
        }];
      },
    },
    // Ranita rockera: gorro verde limón con ojos saltones que parpadean, panza clara y una guitarrita roja que rasguea.
    ranita: {
      name: 'Ranita rockera', hood: true, moves: ['risa', 'asiente', 'lengua'], sleeve: '#8fd94a',
      build(part, head, torso, k, toon) {
        const G = this.sleeve;
        shirt(part, torso, G, k.skin);
        belly(part, torso, '#e6f8b0', 1.05);
        hoodCap(part, head, G, toon);
        const eyes = [-1, 1].map((sx) => {
          const g = new THREE.Group(); const p = onCap(sx * 0.13, 0.3, 0.1, 0.27); g.position.set(p.x, p.y, p.z);
          g.add(part(new THREE.SphereGeometry(0.075, 14, 10), G, { ol: 0.08 }));
          const e = bigEye(part, 0.05); e.g.position.set(0, 0.025, 0.04); g.add(e.g);
          head.add(g); return { g, e, sx };
        });
        // Guitarrita cruzada en el pecho.
        const gui = new THREE.Group(); gui.position.set(0.04, -0.4, 0.23); gui.rotation.set(-0.35, 0, 0.75);
        gui.add(part(new THREE.SphereGeometry(0.05, 14, 10), '#ff6b3d', { y: -0.03, ol: 0.1, s: [1, 1, 0.4] }));
        gui.add(part(new THREE.SphereGeometry(0.038, 14, 10), '#ff6b3d', { y: 0.035, ol: 0.1, s: [1, 1, 0.4] }));
        gui.add(part(new THREE.CircleGeometry(0.014, 10), INK, { y: 0, z: 0.021, ol: 0 }));
        gui.add(part(new THREE.BoxGeometry(0.018, 0.13, 0.012), '#8a4a1f', { y: 0.13, ol: 0.15 }));
        gui.add(part(new THREE.BoxGeometry(0.03, 0.03, 0.014), '#6a3a18', { y: 0.2, ol: 0.15 }));
        torso.add(gui);
        return [(f, t) => {
          const strum = Math.sin(t * (f.laugh || f.nod ? 14 : 5)) * (f.laugh || f.nod ? 0.08 : 0.03);
          gui.rotation.z = 0.75 + strum;
          eyes.forEach(({ g, e, sx }, i) => {
            const blink = (t + i * 0.15) % 3.6 > 3.45 ? 0.15 : 1;
            e.g.scale.y = blink;
            e.p.position.x = Math.sin(t * 1.1) * 0.01;
            g.position.y = onCap(sx * 0.13, 0.3, 0.1, 0.27).y + (f.laugh ? Math.abs(Math.sin(t * 12 + i)) * 0.015 : 0);
          });
        }];
      },
    },
    // Mapache director: gorro gris con orejas redondas de centro oscuro, antifaz pintado alrededor de los ojos (los
    // ojos quedan encima, libres) y un megáfono rojo que levanta para dar indicaciones.
    mapache: {
      name: 'Mapache director', hood: true, moves: ['sorpresa', 'pensando', 'saludo'], sleeve: '#8c8ca0',
      build(part, head, torso, k, toon) {
        const G = '#a8a8ba', D = '#4e4e66';
        shirt(part, torso, this.sleeve, k.skin);
        belly(part, torso, '#e6e6f0', 1);
        hoodCap(part, head, G, toon);
        head.add(part(new THREE.SphereGeometry(0.06, 12, 8), '#f4f1ff', { ...onCap(0, 0.2, 0.25, 0.3), ol: 0, s: [2, 0.45, 0.3] }));
        for (const sx of [-1, 1]) {
          const e = new THREE.Group(); point(e, sx * 0.19, 0.25, -0.02, 0.28);
          e.add(part(new THREE.SphereGeometry(0.06, 12, 8), G, { y: 0.03, ol: 0.1, s: [1, 1, 0.55] }));
          e.add(part(new THREE.SphereGeometry(0.035, 10, 6), D, { y: 0.035, z: 0.018, ol: 0, s: [1, 1, 0.3] }));
          head.add(e);
        }
        // Antifaz: un óvalo oscuro bajo cada ojo, pegado a la cara.
        for (const sx of [-1, 1]) head.add(part(new THREE.SphereGeometry(0.06, 14, 10), D, { x: sx * 0.115, y: -0.035, z: 0.226, ry: sx * 0.4, rz: -sx * 0.35, ol: 0, s: [1.8, 0.85, 0.3] }));
        head.add(part(new THREE.SphereGeometry(0.03, 8, 6), D, { y: -0.005, z: 0.258, ol: 0, s: [1.6, 0.55, 0.3] }));
        // Megáfono.
        const meg = new THREE.Group(); meg.position.set(0.16, -0.37, 0.2); meg.rotation.set(-0.2, 0.3, -0.9);
        meg.add(part(new THREE.CylinderGeometry(0.05, 0.022, 0.12, 14, 1, true), '#e8455a', { y: 0.06, ol: 0.1, mat: toon({ color: '#e8455a', side: THREE.DoubleSide }) }));
        meg.add(part(new THREE.TorusGeometry(0.05, 0.008, 6, 16), '#fffdf7', { y: 0.12, rx: Math.PI / 2, ol: 0.2 }));
        meg.add(part(new THREE.CylinderGeometry(0.014, 0.014, 0.04, 8), INK, { y: -0.005, x: 0.02, rz: 0.5, ol: 0 }));
        torso.add(meg);
        return [(f, t) => {
          const lift = f.hand || f.back ? 0.25 : 0;
          meg.rotation.z = -0.9 + lift + Math.sin(t * 1.6) * 0.06;
          meg.scale.setScalar(1 + (f.mouth === 'o' ? Math.abs(Math.sin(t * 10)) * 0.08 : 0));
        }];
      },
    },
  };
};
