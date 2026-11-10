// Disfraces 3D, tanda D (10 nov 2026): famosos sin ser famosos (anime, cantantes). Ver js/avatar3d.js:
// export default (H) => ({ clave: { name, moves, sleeve, hood | wig, build(part, head, torso, k, toon) => [ticks] } }).
// Los de peluca (wig) ponen su pelo y el tuyo no se dibuja; MC Beat no: su gorra tapa lo de arriba de tu peinado.
export default (H) => {
  const { THREE, TAU, flat, shirt, cap, fringe, onCap, neckRing } = H;
  // Corazón plano con grosor (moño de Idol y los corazoncitos que salen).
  const heartGeo = (s) => {
    const sh = new THREE.Shape();
    sh.moveTo(0, -0.9 * s);
    sh.bezierCurveTo(-1.3 * s, -0.1 * s, -0.9 * s, 0.9 * s, 0, 0.35 * s);
    sh.bezierCurveTo(0.9 * s, 0.9 * s, 1.3 * s, -0.1 * s, 0, -0.9 * s);
    return new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false }).translate(0, 0, -0.006);
  };
  // Lunita: arco grueso (media luna) de frente.
  const moon = (part, color, r = 0.032) => part(new THREE.TorusGeometry(r, r * 0.42, 8, 16, Math.PI * 1.25), color, { rz: Math.PI * 0.4, ol: 0.2 });
  return {
    // Kiko, guerrero de las nubes: peluca negra de picos, traje naranja con camiseta y cinta azules, y su nubecita.
    kiko: {
      name: 'Kiko', wig: true, moves: ['cachetes', 'asiente', 'saludo'], sleeve: '#ff8a3d',
      build(part, head, torso, k) {
        const HAIR = '#2a2236', BLUE = '#2f6fd8';
        cap(part, head, HAIR, 0.29);
        // Picos grandes hacia arriba y a los lados, y tres sobre la frente.
        const spikes = [[-0.2, 0.2, 0.02, 0.95], [-0.11, 0.27, 0.0, 0.45], [0.0, 0.3, -0.02, 0.0], [0.11, 0.27, 0.0, -0.45], [0.2, 0.2, 0.02, -0.95], [-0.25, 0.06, -0.04, 1.6], [0.25, 0.06, -0.04, -1.6]]
          .map(([x, y, z, rz]) => { const s = part(new THREE.ConeGeometry(0.075, 0.2, 10), HAIR, { x, y, z, rz, ol: 0.1 }); head.add(s); return s; });
        [[-0.11, 0.14, 0.2, 2.75], [0.02, 0.16, 0.22, 3.05], [0.13, 0.13, 0.2, -2.7]].forEach(([x, y, z, rz]) => head.add(part(new THREE.ConeGeometry(0.05, 0.13, 8), HAIR, { x, y, z, rz, rx: -0.45, ol: 0.12 })));
        shirt(part, torso, this.sleeve, k.skin);
        // Camiseta azul en V bajo el traje y la cinta azul.
        for (const sx of [-1, 1]) torso.add(part(new THREE.BoxGeometry(0.05, 0.14, 0.02), BLUE, { x: sx * 0.045, y: -0.31, z: 0.17, rz: sx * 0.45, rx: -0.4, ol: 0.15 }));
        torso.add(part(new THREE.TorusGeometry(0.33, 0.022, 6, 28, Math.PI), BLUE, { y: -0.56, z: 0.02, rx: -Math.PI / 2 + 0.25, rz: Math.PI, s: [1.03, 1, 0.68], ol: 0.12 }));
        // Nubecita dorada flotando junto al hombro.
        const cloud = new THREE.Group(); cloud.position.set(-0.26, -0.29, 0.16);
        [[0, 0, 0.045], [-0.045, -0.008, 0.033], [0.045, -0.008, 0.035], [0.015, 0.025, 0.03]].forEach(([x, y, r]) => cloud.add(part(new THREE.SphereGeometry(r, 10, 8), '#ffe58a', { x, y, ol: 0.14 })));
        torso.add(cloud);
        return [(f, t) => {
          spikes.forEach((s, i) => (s.scale.y = 1 + Math.sin(t * 2.6 + i) * 0.04 + (f.puff ? 0.1 : 0)));
          cloud.position.y = -0.29 + Math.sin(t * 2) * 0.015; cloud.rotation.z = Math.sin(t * 1.4) * 0.1;
        }];
      },
    },
    // Luna Estelar, chica mágica: peluca rubia de chongos y coletas largas, diadema con lunita, uniforme de marinerita
    // con moño rojo y broche lunar.
    luna: {
      name: 'Luna Estelar', wig: true, moves: ['guino', 'saludo', 'timido'], sleeve: '#f4f1ff',
      build(part, head, torso, k) {
        const HAIR = '#f6d25a', GOLD = '#ffc83d', NAVY = '#2f4fb8', RED = '#e8455a';
        cap(part, head, HAIR);
        fringe(part, head, HAIR, [[-0.13, 0.15, 0.19, 0.5], [-0.02, 0.17, 0.22, 0.1], [0.11, 0.15, 0.2, -0.4]], [1.2, 0.55, 0.7]);
        for (const sx of [-1, 1]) head.add(part(new THREE.SphereGeometry(0.085, 14, 10), HAIR, { x: sx * 0.17, y: 0.25, z: -0.03, ol: 0.08 }));
        const tails = [-1, 1].map((sx) => {
          const g = new THREE.Group(); g.position.set(sx * 0.2, 0.2, -0.1);
          g.add(part(new THREE.CapsuleGeometry(0.05, 0.36, 4, 10), HAIR, { x: sx * 0.06, y: -0.22, rz: sx * 0.12, ol: 0.08 }));
          head.add(g); return g;
        });
        // Diadema dorada con lunita al frente.
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.014, 6, 28, Math.PI), flat(GOLD));
        band.position.set(0, 0.03, 0.02); band.rotation.x = -0.3; head.add(band);
        const m = moon(part, GOLD); m.position.set(0, 0.215, 0.215); head.add(m);
        // Marinerita: blusa blanca, cuello azul marino en V y moño rojo con broche lunar.
        shirt(part, torso, this.sleeve, k.skin);
        for (const sx of [-1, 1]) torso.add(part(new THREE.BoxGeometry(0.11, 0.16, 0.02), NAVY, { x: sx * 0.07, y: -0.3, z: 0.165, rz: sx * 0.5, rx: -0.4, ol: 0.12 }));
        const bow = new THREE.Group(); bow.position.set(0, -0.35, 0.215); bow.rotation.x = -0.35;
        for (const sx of [-1, 1]) bow.add(part(new THREE.SphereGeometry(0.04, 10, 8), RED, { x: sx * 0.045, rz: -sx * 0.3, ol: 0.15, s: [1.3, 0.8, 0.5] }));
        bow.add(part(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 14), GOLD, { z: 0.015, rx: Math.PI / 2, ol: 0.2 }));
        torso.add(bow);
        return [(f, t) => {
          tails.forEach((g, i) => (g.rotation.z = (i ? 1 : -1) * (Math.sin(t * 2 + i) * 0.08 + (f.hand ? 0.06 : 0))));
          m.rotation.z = Math.PI * 0.4 + Math.sin(t * 1.6) * 0.15;
          bow.scale.setScalar(1 + Math.sin(t * 2.4) * 0.04);
        }];
      },
    },
    // Estrella Pop, cantante: peluca rosa ondulada, chaqueta fucsia de lentejuelas que brillan y micrófono de diadema.
    estrellapop: {
      name: 'Estrella Pop', wig: true, moves: ['guino', 'risa', 'saludo'], sleeve: '#c2409a',
      build(part, head, torso, k) {
        const HAIR = '#ff8ac8', INK2 = '#3a3346';
        cap(part, head, HAIR);
        fringe(part, head, HAIR, [[-0.14, 0.14, 0.19, 0.6], [-0.04, 0.17, 0.22, 0.35], [0.08, 0.17, 0.22, 0.15]], [1.25, 0.55, 0.7]);
        head.add(part(new THREE.SphereGeometry(0.3, 20, 14), HAIR, { y: -0.08, z: -0.08, s: [1.08, 1.05, 0.75], ol: 0.04 }));
        // Ondas: bolitas a los lados que bajan en zigzag hasta los hombros.
        const waves = [];
        for (const sx of [-1, 1]) [[0.25, -0.02], [0.28, -0.11], [0.25, -0.2], [0.27, -0.28]].forEach(([x, y], i) => {
          const w = part(new THREE.SphereGeometry(0.058, 12, 10), HAIR, { x: sx * x, y, z: 0.0, ol: 0.1 }); head.add(w); waves.push([w, i, sx]);
        });
        // Micrófono de diadema: arco oscuro, auricular y brazo hacia la boca (sin taparla).
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.012, 6, 24, Math.PI), flat(INK2));
        band.position.set(0, 0.0, -0.02); band.rotation.set(-0.1, 0, 0); head.add(band);
        head.add(part(new THREE.CylinderGeometry(0.05, 0.05, 0.035, 14), INK2, { x: -0.3, y: -0.01, rz: Math.PI / 2, ol: 0.15 }));
        const boom = new THREE.Group(); boom.position.set(-0.3, -0.02, 0.03);
        boom.add(part(new THREE.CylinderGeometry(0.007, 0.007, 0.2, 6), INK2, { x: 0.07, y: -0.04, z: 0.1, rx: Math.PI / 2, rz: 0.5, ry: -0.6, ol: 0 }));
        boom.add(part(new THREE.SphereGeometry(0.022, 10, 8), INK2, { x: 0.13, y: -0.085, z: 0.19, ol: 0.2 }));
        head.add(boom);
        // Chaqueta fucsia con lentejuelas que titilan.
        shirt(part, torso, this.sleeve, k.skin);
        torso.add(part(new THREE.SphereGeometry(0.06, 10, 8), '#fff6e6', { y: -0.29, z: 0.15, ol: 0.12, s: [1.3, 0.6, 0.5] }));
        const spark = [];
        for (let i = 0; i < 9; i++) {
          const a = -1.1 + (i / 8) * 2.2, mat = flat('#ffe58a');
          const d = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), mat);
          d.position.set(Math.sin(a) * 0.29, -0.42 + (i % 3) * 0.045 - Math.abs(a) * 0.04, Math.cos(a) * 0.2);
          torso.add(d); spark.push(mat);
        }
        const c1 = new THREE.Color('#ffe58a'), c2 = new THREE.Color('#ffffff'), c3 = new THREE.Color('#8fe8ff');
        return [(f, t) => {
          waves.forEach(([w, i, sx]) => (w.position.x = sx * ([0.25, 0.28, 0.25, 0.27][i] + Math.sin(t * 2.2 + i) * 0.008 + (f.laugh ? Math.sin(t * 12 + i) * 0.01 : 0))));
          spark.forEach((m, i) => { const p = (Math.floor(t * 5) + i) % 3; m.color.copy(p === 0 ? c2 : p === 1 ? c1 : c3); });
        }];
      },
    },
    // Rocky, rockero: peluca de copete con lentes oscuros encima, chaqueta de cuero con estoperoles y púa al cuello.
    rocky: {
      name: 'Rocky', wig: true, moves: ['lengua', 'risa', 'asiente'], sleeve: '#3a3346',
      build(part, head, torso, k) {
        const HAIR = '#2e2236', LEATHER = this.sleeve, STEEL = '#d3dbef';
        cap(part, head, HAIR);
        // Copete: un bulto grande al frente que sube y se va para atrás, y patillas.
        const quiff = part(new THREE.SphereGeometry(0.15, 18, 12), HAIR, { y: 0.22, z: 0.15, rx: 0.35, ol: 0.07, s: [1.2, 0.62, 1.15] });
        head.add(quiff);
        // Rizo del copete al frente y un brillo arriba.
        quiff.add(part(new THREE.SphereGeometry(0.07, 12, 10), HAIR, { y: 0.02, z: 0.13, ol: 0.1 }));
        quiff.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.09, 3, 6), flat('#6a5a8a')).rotateZ(Math.PI / 2).translateX(0.1).translateZ(0.05));
        for (const sx of [-1, 1]) head.add(part(new THREE.CapsuleGeometry(0.03, 0.08, 4, 8), HAIR, { x: sx * 0.255, y: -0.02, z: 0.07, ol: 0.12 }));
        // Lentes oscuros sobre el copete.
        const shades = new THREE.Group(); shades.position.set(0, 0.125, 0.262); shades.rotation.x = -0.3;
        for (const sx of [-1, 1]) shades.add(part(new THREE.CylinderGeometry(0.038, 0.038, 0.016, 16), '#5a4aa8', { x: sx * 0.062, rx: Math.PI / 2, s: [1.15, 1, 0.85], ol: 0.18 }));
        shades.add(part(new THREE.BoxGeometry(0.03, 0.01, 0.01), '#1f1a33', { y: 0.01, ol: 0 }));
        for (const sx of [-1, 1]) { const g = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 4), flat('#8fe8ff')); g.position.set(sx * 0.058 - 0.015, 0.012, 0.012); shades.add(g); }
        head.add(shades);
        // Chaqueta de cuero con solapas, camiseta roja y estoperoles en los hombros.
        shirt(part, torso, LEATHER, k.skin);
        torso.add(part(new THREE.SphereGeometry(0.09, 12, 8), '#e8455a', { y: -0.32, z: 0.15, ol: 0.1, s: [0.9, 1, 0.45] }));
        for (const sx of [-1, 1]) torso.add(part(new THREE.BoxGeometry(0.07, 0.17, 0.02), '#4f4660', { x: sx * 0.085, y: -0.33, z: 0.17, rz: sx * 0.35, rx: -0.38, ol: 0.12 }));
        for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
          const p = onCap(sx * (0.7 + i * 0.25), 0.55 - i * 0.18, 0.25, 0.3);
          torso.add(part(new THREE.SphereGeometry(0.014, 6, 5), STEEL, { x: p.x, y: -0.44 + p.y * 0.75, z: p.z * 0.75, ol: 0.25 }));
        }
        // Púa de guitarra roja colgando de un cordón.
        const pick = new THREE.Group(); pick.position.set(0, -0.31, 0.2);
        pick.add(part(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 3), '#ffc83d', { y: -0.03, rx: Math.PI / 2, rz: Math.PI / 2, ol: 0.2, s: [1, 1, 1.2] }));
        torso.add(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.006, 5, 16, Math.PI), flat('#1f1a33')).translateY(-0.26).translateZ(0.16).rotateX(-0.7).rotateZ(Math.PI));
        torso.add(pick);
        return [(f, t) => {
          quiff.rotation.x = 0.35 + Math.sin(t * 2.2) * 0.04 + (f.nod ? Math.sin(t * 14) * 0.08 : 0) + (f.laugh ? Math.sin(t * 12) * 0.06 : 0);
          pick.rotation.z = Math.sin(t * 1.8) * 0.2;
        }];
      },
    },
    // Idol: peluca oscura de fleco recto con mechones de colores, moño de corazón, chaqueta pastel y corazoncitos que
    // salen flotando.
    mina: {
      name: 'Idol', wig: true, moves: ['timido', 'guino', 'saludo'], sleeve: '#b8a6f0',
      build(part, head, torso, k) {
        const HAIR = '#2e2236', PINK = '#ff7ab8';
        cap(part, head, HAIR);
        head.add(part(new THREE.SphereGeometry(0.3, 20, 14), HAIR, { y: -0.1, z: -0.08, s: [1.06, 1.1, 0.75], ol: 0.04 }));
        // Fleco recto: una fila de mechones parejos.
        for (let i = 0; i < 5; i++) { const x = -0.16 + i * 0.08; head.add(part(new THREE.CapsuleGeometry(0.035, 0.05, 4, 8), HAIR, { x, y: 0.13 + (1 - Math.abs(x) * 4) * 0.012, z: 0.225 - Math.abs(x) * 0.25, ol: 0.1 })); }
        // Mechones largos a los lados: uno de color en cada lado (rosa y aqua).
        [[-1, HAIR], [1, HAIR]].forEach(([sx, c]) => head.add(part(new THREE.CapsuleGeometry(0.05, 0.2, 4, 10), c, { x: sx * 0.235, y: -0.12, z: 0.06, rz: sx * 0.08, ol: 0.1 })));
        const streaks = [[-1, PINK], [1, '#5fd1c5']].map(([sx, c]) => { const s = part(new THREE.CapsuleGeometry(0.026, 0.2, 4, 8), c, { x: sx * 0.24, y: -0.12, z: 0.11, rz: sx * 0.08, ol: 0.15 }); head.add(s); return s; });
        // Moño de corazón rosa a un lado.
        const bow = part(heartGeo(0.06), PINK, { x: 0.19, y: 0.2, z: 0.18, ry: 0.5, rz: -0.2, ol: 0.15 });
        head.add(bow);
        // Chaqueta lila con cuello blanco y una estrellita.
        shirt(part, torso, this.sleeve, k.skin);
        for (const sx of [-1, 1]) torso.add(part(new THREE.SphereGeometry(0.07, 12, 8), '#fff6e6', { x: sx * 0.065, y: -0.27, z: 0.15, rz: sx * 0.5, ol: 0.12, s: [1.2, 0.6, 0.5] }));
        // Corazoncitos que suben desde el hombro y se desvanecen.
        const hearts = [0, 1, 2].map((i) => {
          const mat = new THREE.MeshBasicMaterial({ color: i === 1 ? '#ff9cc8' : PINK, transparent: true, depthWrite: false });
          const h = new THREE.Mesh(heartGeo(0.03), mat); torso.add(h); return { h, mat, i };
        });
        return [(f, t) => {
          bow.rotation.z = -0.2 + Math.sin(t * 2) * 0.1;
          streaks.forEach((s, i) => (s.rotation.z = (i ? 0.08 : -0.08) + Math.sin(t * 2.2 + i) * 0.04));
          hearts.forEach(({ h, mat, i }) => {
            const p = ((t * 0.45 + i / 3) % 1);
            h.position.set(0.3 + Math.sin(p * 9 + i) * 0.03, -0.32 + p * 0.3, 0.12);
            h.scale.setScalar(0.6 + p * 0.6 + (f.blush ? 0.3 : 0));
            mat.opacity = Math.min(1, p * 5) * (1 - p);
          });
        }];
      },
    },
    // MC Beat, rapero: gorra plana y audífonos grandes sobre tu pelo (la gorra tapa lo de arriba de tu peinado),
    // sudadera azul con cordones y cadena dorada.
    mcbeat: {
      name: 'MC Beat', moves: ['asiente', 'guino', 'risa'], sleeve: '#4aa8de',
      build(part, head, torso, k) {
        const CAP = '#2a2236', RED = '#e8455a', GOLD = '#ffc83d';
        // La gorra va encima: lo alto de tu peinado (remolino, picos, chongos) queda escondido debajo.
        for (const c of head.children) if (c.position.y > 0.18) c.visible = false;
        head.add(part(new THREE.SphereGeometry(0.31, 24, 10, 0, TAU, 0, Math.PI * 0.42), RED, { y: 0.03, rx: -0.18, ol: 0.04 }));
        head.add(part(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 10), CAP, { y: 0.33, ol: 0.2 }));
        const brim = part(new THREE.CylinderGeometry(0.16, 0.16, 0.022, 22), CAP, { x: 0.05, y: 0.165, z: 0.25, rx: 0.12, ry: 0.4, s: [1, 1, 0.62], ol: 0.12 });
        head.add(brim);
        // Audífonos: arco por encima de la gorra y orejeras grandes.
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.022, 8, 26, Math.PI), flat('#3a3346'));
        band.position.set(0, 0.0, -0.04); band.rotation.x = -0.08; head.add(band);
        const cups = [-1, 1].map((sx) => {
          const g = new THREE.Group(); g.position.set(sx * 0.3, -0.01, 0);
          g.add(part(new THREE.CylinderGeometry(0.085, 0.085, 0.06, 18), '#ffc83d', { rz: Math.PI / 2, ol: 0.12 }));
          g.add(part(new THREE.CylinderGeometry(0.05, 0.05, 0.065, 14), '#3a3346', { rz: Math.PI / 2, ol: 0 }));
          head.add(g); return g;
        });
        // Sudadera azul con capucha atrás, cordones y cadena dorada con medalla.
        shirt(part, torso, this.sleeve, k.skin);
        torso.add(part(new THREE.TorusGeometry(0.12, 0.05, 8, 20), this.sleeve, { y: -0.25, z: -0.06, rx: Math.PI / 2 - 0.5, ol: 0.1 }));
        for (const sx of [-1, 1]) torso.add(part(new THREE.CapsuleGeometry(0.008, 0.07, 3, 5), '#fff6e6', { x: sx * 0.05, y: -0.33, z: 0.2, rx: -0.35, ol: 0.2 }));
        torso.add(neckRing(part, GOLD, 0.013));
        const medal = part(new THREE.CylinderGeometry(0.032, 0.032, 0.012, 16), GOLD, { y: -0.36, z: 0.2, rx: Math.PI / 2 - 0.35, ol: 0.18 });
        torso.add(medal);
        return [(f, t) => {
          const beat = Math.abs(Math.sin(t * 4.2));
          cups.forEach((g) => g.scale.setScalar(1 + beat * 0.05));
          medal.rotation.z = Math.sin(t * 2.1) * 0.25;
        }];
      },
    },
  };
};
