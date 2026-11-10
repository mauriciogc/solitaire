// Disfraces 3D, tanda G (10 nov 2026): exclusivos de eventos y festividades. Xolo guía, Lloronita, Catrín, Revolucionario,
// Gamer pro, Bichito, Bufoncito, Uvita y Xólotl. Con cariño a las fiestas mexicanas, tiernos, nada de miedo ni burla.
// Ver js/avatar3d.js: export default (H) => ({ clave: { name, moves, sleeve, hood | wig, build } }). Cabeza de radio
// ~0.27 en el origen de head; el torso arranca en y ≈ -0.25.
export default (H) => {
  const { THREE, TAU, flat, shirt, hoodCap, onCap, belly, neckRing } = H;
  const INK = '#2a1f5c', Z = new THREE.Vector3(0, 0, 1);
  // Pega una pieza plana a la superficie mirando hacia afuera en la dirección d.
  const stick = (obj, d) => (obj.quaternion.setFromUnitVectors(Z, new THREE.Vector3(d.x, d.y, d.z).normalize()), obj);
  // Banda del gorro (misma inclinación que hoodCap): entre los ángulos t0 y t1 desde arriba (fracciones de π).
  const band = (part, head, color, toon, t0, t1, r = 0.31, ph = [0, TAU]) => {
    // Con bandas anchas, más renglones: si no, la cuerda queda dentro del gorro y se ve a rayas.
    const g = new THREE.SphereGeometry(r, 28, Math.max(4, Math.ceil((t1 - t0) * 30)), ph[0], ph[1], Math.PI * t0, Math.PI * (t1 - t0));
    const b = part(g, color, { rx: -0.75, ol: 0.04, mat: toon({ color, side: THREE.DoubleSide }) });
    head.add(b); return b;
  };
  // Sombrero de ala sobre tu pelo (alto, para que quepa con los 6 peinados): ala, copa (top: radio de arriba) y cinta.
  const hat = (part, head, { y, brim, crown, top = crown * 0.88, h, color, band: bc, tilt = -0.12 }) => {
    const g = new THREE.Group(); g.position.y = y; g.rotation.x = tilt;
    g.add(part(new THREE.CylinderGeometry(brim, brim, 0.022, 32), color, { ol: 0.06 }));
    g.add(part(new THREE.CylinderGeometry(top, crown, h, 24), color, { y: h / 2 + 0.008, ol: 0.07 }));
    g.add(part(new THREE.CylinderGeometry(crown * 1.01, crown * 1.02, 0.035, 24, 1, true), bc, { y: 0.03, ol: 0.08 }));
    head.add(g); return g;
  };
  // Orejas largas y paradas de xoloitzcuintle (con su interior rosita).
  const xoloEars = (part, head, color, inner) => [-1, 1].map((sx) => {
    const e = new THREE.Group();
    e.add(part(new THREE.ConeGeometry(0.085, 0.21, 10), color, { y: 0.09, ol: 0.08, s: [1, 1, 0.5] }));
    e.add(part(new THREE.ConeGeometry(0.05, 0.14, 8), inner, { y: 0.07, z: 0.025, ol: 0, s: [1, 1, 0.3] }));
    e.position.set(sx * 0.15, 0.21, -0.02); e.rotation.z = -sx * 0.38;
    head.add(e); return e;
  });
  // Llama de vela o farolito: dos conos de luz que titilan.
  const flame = (scale = 1) => {
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.ConeGeometry(0.018 * scale, 0.05 * scale, 10), flat('#ffb02e'));
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.009 * scale, 0.028 * scale, 8), flat('#fff4c7'));
    b.position.y = -0.004 * scale; g.add(a, b); return g;
  };

  return {
    // Xolo guía (Día de Muertos): gorro gris de xoloitzcuintle con orejas grandes paradas y copetito, bufanda de
    // cempasúchil y su farolito rosa que alumbra el camino.
    xologuia: {
      name: 'Xolo guía', hood: true, moves: ['asiente', 'sorpresa', 'saludo'], sleeve: '#6a4fc0',
      build(part, head, torso, k, toon) {
        const G = '#7d8496', MARI = '#ffb000';
        shirt(part, torso, this.sleeve, k.skin);
        hoodCap(part, head, G, toon);
        const ears = xoloEars(part, head, G, '#d9a3b4');
        // Copetito de pelo entre las orejas (los xolos lo tienen).
        [[-0.04, 0.3, 0.06], [0.02, 0.31, 0.03], [0.07, 0.29, 0.06]].forEach(([x, y, z]) => head.add(part(new THREE.SphereGeometry(0.032, 8, 6), '#4a4f5c', { ...onCap(x, y, z, 0.315), ol: 0.15 })));
        // Bufanda de cempasúchil con una flor.
        torso.add(neckRing(part, MARI, 0.03));
        const flower = new THREE.Group();
        for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; flower.add(part(new THREE.SphereGeometry(0.022, 8, 6), '#ff8a1a', { x: Math.cos(a) * 0.024, y: Math.sin(a) * 0.024, ol: 0.15 })); }
        flower.add(part(new THREE.SphereGeometry(0.018, 8, 6), MARI, { z: 0.01, ol: 0 }));
        flower.position.set(-0.08, -0.29, 0.15); torso.add(flower);
        // Farolito de papel rosa con su luz.
        const lamp = new THREE.Group();
        const glow = toon({ color: '#ff7ab8', emissive: '#000000' });
        lamp.add(part(new THREE.SphereGeometry(0.05, 14, 10), null, { ol: 0.12, s: [1, 1.15, 1], mat: glow }));
        for (const y of [-0.058, 0.058]) lamp.add(part(new THREE.CylinderGeometry(0.022, 0.022, 0.014, 12), '#3a2f4a', { y, ol: 0.2 }));
        const fl = flame(1.2); lamp.add(fl);
        lamp.add(part(new THREE.TorusGeometry(0.02, 0.005, 5, 12, Math.PI), '#3a2f4a', { y: 0.068, ol: 0 }));
        lamp.position.set(0.13, -0.34, 0.21); lamp.scale.setScalar(1.25);
        torso.add(lamp);
        const lit = new THREE.Color('#5a2a40');
        return [(f, t) => {
          ears.forEach((e, i) => (e.rotation.z = (i ? -0.38 : 0.38) + Math.sin(t * 2 + i) * 0.04 + (f.back ? (i ? -0.12 : 0.12) : 0)));
          const k = 0.5 + Math.sin(t * 9) * 0.25 + Math.sin(t * 23) * 0.15;
          glow.emissive.copy(lit).multiplyScalar(k);
          fl.scale.set(1, 0.85 + k * 0.3, 1);
          lamp.rotation.z = Math.sin(t * 1.6) * 0.18;
        }];
      },
    },
    // Lloronita: rebozo azul con rayitas sobre la cabeza y los hombros, blusa blanca bordada de flores y su velita.
    // Tierna: la velita titila y el rebozo se mece.
    lloronita: {
      name: 'Lloronita', hood: true, moves: ['timido', 'pensando', 'asiente'], sleeve: '#fff6ec',
      build(part, head, torso, k, toon) {
        const R = '#3f63c4', S = '#fff6ec';
        shirt(part, torso, S, k.skin);
        // Bordado de florecitas en la blusa.
        [[-0.1, -0.33, '#e8455a'], [0, -0.35, '#ffc83d'], [0.1, -0.33, '#2fbf9a']].forEach(([x, y, c]) => torso.add(part(new THREE.SphereGeometry(0.018, 8, 6), c, { x, y, z: 0.205, ol: 0.2 })));
        // Rebozo en la cabeza (el gorro) con rayas blancas, y caído en los hombros (abierto al frente).
        hoodCap(part, head, R, toon);
        band(part, head, '#bfe8ff', toon, 0.5, 0.53, 0.309);
        band(part, head, '#bfe8ff', toon, 0.58, 0.6, 0.309);
        const drape = part(new THREE.SphereGeometry(0.31, 24, 10, Math.PI / 2 + 0.55, TAU - 1.1, 0, Math.PI * 0.45), R, { y: -0.44, s: [1.2, 0.8, 0.8], ol: 0.04, mat: toon({ color: R, side: THREE.DoubleSide }) });
        torso.add(drape);
        // Flequitos del rebozo en los hombros.
        const fringe = [];
        for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
          const fr = part(new THREE.CapsuleGeometry(0.008, 0.035, 2, 4), '#bfe8ff', { x: sx * (0.17 + i * 0.03), y: -0.34 - i * 0.012, z: 0.14 - i * 0.03, ol: 0.25 });
          torso.add(fr); fringe.push(fr);
        }
        // Velita en la mano: vela crema con su llama.
        const candle = new THREE.Group();
        candle.add(part(new THREE.CylinderGeometry(0.024, 0.026, 0.09, 12), '#ffd27a', { ol: 0.15 }));
        candle.add(part(new THREE.CylinderGeometry(0.04, 0.04, 0.012, 14), '#d9a441', { y: -0.048, ol: 0.15 }));
        const fl = flame(1.3); fl.position.y = 0.075; candle.add(fl);
        candle.position.set(-0.12, -0.33, 0.21); candle.scale.setScalar(1.2);
        torso.add(candle);
        return [(f, t) => {
          const k = Math.sin(t * 11) * 0.15 + Math.sin(t * 27) * 0.08;
          fl.scale.set(1 - k * 0.3, 1 + k, 1); fl.rotation.z = Math.sin(t * 3) * 0.12;
          drape.rotation.y = Math.sin(t * 1.3) * 0.03;
          fringe.forEach((fr, i) => (fr.rotation.z = Math.sin(t * 2.4 + i) * 0.25));
        }];
      },
    },
    // Catrín / Catrina: sombrero negro de ala con flores de colores (encima de tu pelo), la cara pintada suave
    // alrededor de los ojos (sin tapar los gestos), una florecita en la frente y saco morado con moño.
    catrinita: {
      name: 'Catrín', moves: ['guino', 'risa', 'saludo'], sleeve: '#6a3fa8',
      build(part, head, torso, k) {
        shirt(part, torso, this.sleeve, k.skin);
        // Cuello de holán blanco y moño magenta.
        torso.add(neckRing(part, '#fff6ec', 0.03));
        for (const sx of [-1, 1]) torso.add(part(new THREE.SphereGeometry(0.035, 10, 8), '#e8457e', { x: sx * 0.04, y: -0.3, z: 0.15, rz: sx * 0.4, ol: 0.15, s: [1.3, 0.8, 0.5] }));
        torso.add(part(new THREE.SphereGeometry(0.02, 8, 6), '#e8457e', { y: -0.3, z: 0.16, ol: 0.2 }));
        // Pintura de catrina: aro de color alrededor de cada ojo con puntitos, flor en la frente.
        [['#ff7ab8', -1], ['#2fbfa0', 1]].forEach(([c, sx]) => {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.007, 6, 20), flat(c));
          ring.position.set(sx * 0.095, -0.018, 0.236); ring.rotation.y = sx * 0.35; ring.scale.y = 1.15;
          head.add(ring);
          for (let i = 0; i < 4; i++) {
            const a = Math.PI * (0.15 + i * 0.23) * (sx < 0 ? 1 : -1) + (sx < 0 ? 0 : Math.PI);
            const d = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), flat(c));
            d.position.set(sx * 0.095 + Math.cos(a) * 0.078, -0.018 + Math.sin(a) * 0.085, 0.226 - Math.abs(Math.cos(a)) * 0.02);
            head.add(d);
          }
        });
        const fore = new THREE.Group();
        for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; const p = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), flat('#ff5f7e')); p.position.set(Math.cos(a) * 0.014, Math.sin(a) * 0.014, 0); fore.add(p); }
        const c0 = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), flat('#ffc83d')); c0.position.z = 0.004; fore.add(c0);
        fore.position.set(0, 0.075, 0.262); fore.rotation.x = -0.25; head.add(fore);
        // Sombrero negro con cinta magenta y flores (cempasúchil, rosa y morada) en la cinta.
        const h = hat(part, head, { y: 0.25, brim: 0.33, crown: 0.2, h: 0.11, color: '#2a2238', band: '#e8457e', tilt: -0.14 });
        const fl = [];
        [[-0.17, '#ff8a1a'], [-0.08, '#ff7ab8'], [0.02, '#b48cff'], [0.11, '#ffc83d']].forEach(([x, c], i) => {
          const g = new THREE.Group(); const zz = Math.sqrt(Math.max(0, 0.2 * 0.2 - x * x)) + 0.005;
          for (let j = 0; j < 5; j++) { const a = (j / 5) * TAU; g.add(part(new THREE.SphereGeometry(0.02, 8, 6), c, { x: Math.cos(a) * 0.02, y: Math.sin(a) * 0.02, ol: 0.15 })); }
          g.add(part(new THREE.SphereGeometry(0.014, 8, 6), '#fff6ec', { z: 0.01, ol: 0 }));
          g.position.set(x, 0.04 + (i % 2) * 0.012, zz); h.add(g); fl.push(g);
        });
        return [(f, t) => {
          h.position.y = 0.25 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.012 : 0);
          h.rotation.z = Math.sin(t * 1.1) * 0.04;
          fl.forEach((g, i) => g.scale.setScalar(1 + Math.sin(t * 2.5 + i * 1.3) * 0.08));
        }];
      },
    },
    // Revolucionario: sombrero de ala ancha color paja con cinta roja (encima de tu pelo), bigotote arriba de la boca,
    // camisa de manta y dos cananas cruzadas con puntitos dorados.
    revolucionario: {
      name: 'Revolucionario', moves: ['asiente', 'risa', 'pensando'], sleeve: '#f4ead2',
      build(part, head, torso, k) {
        shirt(part, torso, this.sleeve, k.skin);
        // Cananas cruzadas (cuero café con puntitos dorados).
        for (const sx of [-1, 1]) {
          const b = new THREE.Group();
          b.add(part(new THREE.BoxGeometry(0.05, 0.34, 0.02), '#7a4a2a', { ol: 0.12 }));
          for (let i = 0; i < 5; i++) b.add(part(new THREE.SphereGeometry(0.011, 6, 4), '#ffc83d', { y: -0.12 + i * 0.06, z: 0.013, ol: 0 }));
          b.position.set(0, -0.39, 0.2); b.rotation.set(-0.35, 0, sx * 0.62);
          torso.add(b);
        }
        // Bigotote café arriba de la boca (no la tapa) con las puntas hacia arriba.
        const MU = '#3a2418', mus = new THREE.Group();
        for (const sx of [-1, 1]) {
          mus.add(part(new THREE.CapsuleGeometry(0.019, 0.055, 4, 8), MU, { x: sx * 0.04, rz: sx * (Math.PI / 2 - 0.3), ol: 0.15 }));
          mus.add(part(new THREE.SphereGeometry(0.014, 8, 6), MU, { x: sx * 0.085, y: 0.012, ol: 0.15 }));
        }
        mus.position.set(0, -0.058, 0.258); mus.rotation.x = -0.3;
        head.add(mus);
        // Sombrero de ala ancha y copa alta en punta redondeada.
        const h = hat(part, head, { y: 0.24, brim: 0.32, crown: 0.17, top: 0.09, h: 0.16, color: '#d9b06a', band: '#c22c49', tilt: -0.12 });
        h.add(part(new THREE.TorusGeometry(0.315, 0.014, 6, 36), '#c4924a', { y: 0.012, rx: Math.PI / 2, ol: 0.12 }));
        return [(f, t) => {
          mus.scale.set(1 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.08 : 0), 1, 1);
          mus.rotation.z = Math.sin(t * 1.7) * 0.03;
          h.position.y = 0.24 + (f.nod ? Math.abs(Math.sin(t * 9)) * 0.01 : 0);
          h.rotation.z = Math.sin(t * 0.9) * 0.035;
        }];
      },
    },
    // Gamer pro: diadema de audífonos gamer negros con luces que cambian de color y micrófono; se ve tu pelo.
    // Sudadera oscura con cierre verde neón.
    audifonos: {
      name: 'Gamer pro', moves: ['guino', 'sorpresa', 'risa'], sleeve: '#2f3540',
      build(part, head, torso, k) {
        const D = '#2a2f3a';
        shirt(part, torso, this.sleeve, k.skin);
        torso.add(part(new THREE.BoxGeometry(0.014, 0.22, 0.012), '#5fff9e', { y: -0.38, z: 0.215, rx: -0.35, ol: 0.2 }));
        torso.add(neckRing(part, '#3a4150', 0.026));
        // Diadema por encima del pelo y orejeras con aro de luz.
        head.add(part(new THREE.TorusGeometry(0.315, 0.02, 8, 30, Math.PI), D, { y: 0.0, z: -0.02, ol: 0.12 }));
        const leds = [];
        for (const sx of [-1, 1]) {
          head.add(part(new THREE.CylinderGeometry(0.085, 0.085, 0.06, 20), D, { x: sx * 0.29, y: -0.01, rz: Math.PI / 2, ol: 0.1 }));
          const m = flat('#5fff9e');
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 6, 20), m);
          ring.position.set(sx * 0.322, -0.01, 0); ring.rotation.y = Math.PI / 2;
          head.add(ring); leds.push(m);
          // Lucecita de frente en la orejera (el aro mira de lado y casi no se ve).
          const dot = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.05, 3, 6), m); dot.position.set(sx * 0.3, -0.01, 0.07); head.add(dot);
        }
        // Micrófono: brazo delgado desde la orejera izquierda hasta cerca de la boca.
        const arm = part(new THREE.CapsuleGeometry(0.008, 0.17, 3, 6), D, { x: -0.23, y: -0.1, z: 0.13, rz: 1.05, ry: -0.75, ol: 0.25 });
        head.add(arm);
        const mic = part(new THREE.SphereGeometry(0.022, 10, 8), '#3a4150', { x: -0.14, y: -0.14, z: 0.22, ol: 0.18 });
        head.add(mic);
        const cols = ['#5fff9e', '#5ff0ff', '#ff5fd2', '#ffd23d'].map((c) => new THREE.Color(c)), tmp = new THREE.Color();
        return [(f, t) => {
          const x = (t * 0.8) % cols.length, i = Math.floor(x);
          tmp.copy(cols[i]).lerp(cols[(i + 1) % cols.length], x - i);
          leds.forEach((m) => m.color.copy(tmp));
          mic.scale.setScalar(1 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.15 : 0));
        }];
      },
    },
    // Bichito (Día del Programador): gorro verde de escarabajo con la raya del caparazón y manchitas, antenas de
    // bolita que se mueven y patitas en los hombros.
    bichito: {
      name: 'Bichito', hood: true, moves: ['lengua', 'cachetes', 'risa'], sleeve: '#4fb848',
      build(part, head, torso, k, toon) {
        const G = '#6fd35a', D = '#2f7a2a';
        shirt(part, torso, this.sleeve, k.skin);
        belly(part, torso, '#c8f08a');
        hoodCap(part, head, G, toon);
        // Raya del caparazón por el centro y manchitas.
        band(part, head, D, toon, 0, 0.46, 0.311, [Math.PI / 2 - 0.08, 0.16]);
        band(part, head, D, toon, 0, 0.46, 0.311, [-Math.PI / 2 - 0.08, 0.16]);
        [[-0.17, 0.24, 0.0], [0.17, 0.24, 0.0], [-0.11, 0.2, -0.2], [0.11, 0.2, -0.2]].forEach(([x, y, z]) => head.add(part(new THREE.SphereGeometry(0.034, 10, 8), D, { ...onCap(x, y, z, 0.31), ol: 0.12, s: [1, 1, 0.4] })));
        // Antenas curvas con bolita.
        const ants = [-1, 1].map((sx) => {
          const a = new THREE.Group();
          a.add(part(new THREE.CapsuleGeometry(0.01, 0.12, 3, 6), D, { y: 0.06, ol: 0.2 }));
          a.add(part(new THREE.SphereGeometry(0.03, 10, 8), '#ffd23d', { y: 0.14, ol: 0.15 }));
          a.position.set(sx * 0.07, 0.27, 0.1); a.rotation.z = -sx * 0.45;
          head.add(a); return a;
        });
        // Patitas en los hombros.
        const legs = [];
        for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) {
          const l = part(new THREE.CapsuleGeometry(0.013, 0.06, 3, 6), D, { x: sx * (0.26 + i * 0.02), y: -0.33 - i * 0.05, z: 0.04, rz: sx * (1.0 + i * 0.3), ol: 0.2 });
          torso.add(l); legs.push(l);
        }
        return [(f, t) => {
          ants.forEach((a, i) => (a.rotation.z = (i ? -0.45 : 0.45) + Math.sin(t * 3.2 + i * 1.7) * 0.15 + (f.laugh ? Math.sin(t * 12 + i) * 0.12 : 0)));
          legs.forEach((l, i) => (l.rotation.x = Math.sin(t * 6 + i) * 0.2));
        }];
      },
    },
    // Bufoncito (Día de los Inocentes): gorro de bufón mitad rojo y mitad amarillo con picos que cuelgan y cascabeles,
    // cuello de picos y blusón con rombos.
    bufoncito: {
      name: 'Bufoncito', hood: true, moves: ['risa', 'guino', 'lengua'], sleeve: '#8a5cf0',
      build(part, head, torso, k, toon) {
        const R = '#e8434f', Y = '#ffc83d';
        shirt(part, torso, this.sleeve, k.skin);
        // Rombos amarillos en el blusón.
        [[-0.1, -0.38], [0.1, -0.38], [0, -0.45]].forEach(([x, y]) => torso.add(part(new THREE.BoxGeometry(0.045, 0.045, 0.012), Y, { x, y, z: 0.2, rx: -0.35, rz: Math.PI / 4, ol: 0.15 })));
        // Cuello de picos alternados.
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * TAU;
          torso.add(part(new THREE.ConeGeometry(0.03, 0.07, 4), i % 2 ? R : Y, { x: Math.sin(a) * 0.12, y: -0.29, z: Math.cos(a) * 0.1 + 0.02, rx: Math.PI + Math.cos(a) * 0.5, rz: -Math.sin(a) * 0.5, ol: 0.15 }));
        }
        // Gorro: rojo y la mitad derecha amarilla.
        hoodCap(part, head, R, toon);
        band(part, head, Y, toon, 0, 0.62, 0.311, [Math.PI / 2, Math.PI]);
        // Picos que cuelgan hacia los lados con cascabel, y uno chiquito atrás hacia arriba.
        const tips = [[-1, Y], [1, R]].map(([sx, c]) => {
          const g = new THREE.Group();
          g.add(part(new THREE.ConeGeometry(0.07, 0.18, 12), c, { y: 0.09, ol: 0.08 }));
          const bell = part(new THREE.SphereGeometry(0.028, 10, 8), '#ffe066', { y: 0.19, ol: 0.15 });
          g.add(bell);
          g.position.set(sx * 0.2, 0.2, -0.04); g.rotation.z = -sx * 1.9; // cuelgan hacia los lados
          head.add(g); return { g, bell, sx };
        });
        const back = new THREE.Group();
        back.add(part(new THREE.ConeGeometry(0.055, 0.11, 12), Y, { y: 0.055, ol: 0.08 }));
        const bb = part(new THREE.SphereGeometry(0.022, 10, 8), '#ffe066', { y: 0.12, ol: 0.15 }); back.add(bb);
        back.position.set(0, 0.24, -0.12); back.rotation.x = -0.8; head.add(back);
        return [(f, t) => {
          const jig = f.laugh ? Math.sin(t * 12) * 0.12 : 0;
          tips.forEach(({ g, bell, sx }, i) => { g.rotation.z = -sx * 1.9 + Math.sin(t * 2.2 + i * 1.4) * 0.08 + jig; bell.rotation.z = Math.sin(t * 7 + i) * 0.5; });
          back.rotation.x = -0.8 + Math.sin(t * 1.8) * 0.06 + jig * 0.5;
        }];
      },
    },
    // Uvita (Año Nuevo): disfraz de uva morada con uvitas en el gorro y en la panza, ramita café y hoja verde arriba.
    uvita: {
      name: 'Uvita', hood: true, moves: ['cachetes', 'risa', 'asiente'], sleeve: '#7a3fa8',
      build(part, head, torso, k, toon) {
        const P = '#7a3fa8', L = '#a46ad8';
        shirt(part, torso, P, k.skin);
        hoodCap(part, head, P, toon);
        // Uvitas pegadas al gorro (con brillito) y a la panza.
        const grape = (parent, x, y, z, r) => { parent.add(part(new THREE.SphereGeometry(r, 12, 10), L, { x, y, z, ol: 0.1 })); const hi = new THREE.Mesh(new THREE.SphereGeometry(r * 0.28, 6, 4), flat('#e6d0ff')); hi.position.set(x - r * 0.35, y + r * 0.4, z + r * 0.7); parent.add(hi); };
        [[-0.2, 0.18, 0.08], [0.2, 0.18, 0.08], [-0.1, 0.26, 0.1], [0.1, 0.26, 0.1], [0, 0.29, -0.02], [-0.22, 0.12, -0.12], [0.22, 0.12, -0.12], [-0.14, 0.24, -0.14], [0.14, 0.24, -0.14]]
          .forEach(([x, y, z]) => { const p = onCap(x, y, z, 0.3); grape(head, p.x, p.y, p.z, 0.045); });
        [[-0.07, -0.34], [0.07, -0.34], [0, -0.41], [-0.13, -0.42], [0.13, -0.42]].forEach(([x, y]) => grape(torso, x, y, 0.205, 0.04));
        // Ramita y hoja arriba.
        const top = new THREE.Group();
        top.add(part(new THREE.CylinderGeometry(0.014, 0.018, 0.08, 8), '#7a4a2a', { y: 0.04, rz: 0.15, ol: 0.2 }));
        const leaf = part(new THREE.SphereGeometry(0.05, 10, 8), '#5fbf5a', { x: 0.05, y: 0.06, rz: -0.5, ol: 0.12, s: [1.3, 0.45, 0.8] });
        top.add(leaf);
        const p = onCap(0, 1, -0.05, 0.33); top.position.set(p.x, p.y - 0.01, p.z);
        head.add(top);
        return [(f, t) => {
          top.rotation.z = Math.sin(t * 2) * 0.12 + (f.laugh ? Math.sin(t * 12) * 0.1 : 0);
          leaf.rotation.z = -0.5 + Math.sin(t * 3 + 1) * 0.12;
        }];
      },
    },
    // Xólotl: gorro negro azulado de xoloitzcuintle con orejas paradas, diadema de jade con puntitos dorados y marcas
    // rojas en el gorro; túnica roja con collar dorado y su colgante de jade (estilo prehispánico).
    xolo: {
      name: 'Xólotl', hood: true, moves: ['pensando', 'guino', 'asiente'], sleeve: '#a8343a',
      build(part, head, torso, k, toon) {
        const B = '#3a3f52', JADE = '#2fbfa0', GOLD = '#ffc83d';
        shirt(part, torso, this.sleeve, k.skin);
        // Collar dorado ancho y colgante de jade.
        torso.add(neckRing(part, GOLD, 0.034));
        const pend = part(new THREE.SphereGeometry(0.032, 12, 10), JADE, { y: -0.31, z: 0.15, ol: 0.15, s: [1, 1.2, 0.6] });
        torso.add(pend);
        // Grecas doradas en la túnica.
        for (let i = 0; i < 5; i++) torso.add(part(new THREE.BoxGeometry(0.028, 0.028, 0.01), GOLD, { x: -0.12 + i * 0.06, y: -0.42, z: 0.205, rx: -0.35, rz: Math.PI / 4, ol: 0.15 }));
        hoodCap(part, head, B, toon);
        const ears = xoloEars(part, head, B, '#c97a8a');
        // Diadema de jade en la orilla del gorro, con puntitos dorados.
        band(part, head, JADE, toon, 0.53, 0.585, 0.312, [Math.PI / 2 - 1.1, 2.2]);
        for (let i = 0; i < 5; i++) {
          const a = Math.PI / 2 - 0.8 + i * 0.4, th = Math.PI * 0.557;
          const v = new THREE.Vector3(-Math.cos(a) * Math.sin(th), Math.cos(th), Math.sin(a) * Math.sin(th)).multiplyScalar(0.322).applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.75);
          head.add(part(new THREE.SphereGeometry(0.014, 8, 6), GOLD, { x: v.x, y: v.y, z: v.z, ol: 0.2 }));
        }
        // Marcas rojas a los lados del gorro.
        for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) {
          const d = onCap(sx * 0.9, 0.2 - i * 0.12, 0.25, 0.31);
          const m = part(new THREE.BoxGeometry(0.05, 0.016, 0.01), '#e8434f', { x: d.x, y: d.y, z: d.z, ol: 0.2 });
          stick(m, d); head.add(m);
        }
        return [(f, t) => {
          ears.forEach((e, i) => (e.rotation.z = (i ? -0.38 : 0.38) + Math.sin(t * 1.7 + i * 2) * 0.03 + (f.nod ? Math.sin(t * 9) * 0.05 : 0)));
          pend.rotation.z = Math.sin(t * 2.2) * 0.25;
        }];
      },
    },
  };
};
