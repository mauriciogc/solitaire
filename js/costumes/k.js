// Disfraces 3D, tanda K (14 nov 2026): exclusivos de las lluvias nuevas. Guardián de la aurora (aurora) y Mago de
// cristal (cristales). Ver js/avatar3d.js: export default (H) => ({ clave: { name, moves, sleeve, hood | wig, build } }).
// Cabeza de radio ~0.27 en el origen de head; el torso arranca en y ≈ -0.25.
export default (H) => {
  const { THREE, flat, shirt, starGeo, hoodCap, onCap, neckRing } = H;
  // Cristal: octaedro estirado (punta arriba y abajo).
  const gem = (r, h) => new THREE.OctahedronGeometry(r, 0).scale(1, h / r, 1);
  return {
    // Guardián de la aurora: capucha azul noche con dos franjas de luz (verde y violeta) que cambian de color, capa
    // corta y una cortinita de aurora flotando sobre la cabeza que ondea.
    auroral: {
      name: 'Guardián de la aurora/Guardiana de la aurora', hood: true, moves: ['saludo', 'guino', 'sorpresa'], sleeve: '#1d2a5a',
      build(part, head, torso, k, toon) {
        const N = this.sleeve, G = '#5ff0b0', V = '#a785ff';
        // Capa detrás, verde oscuro, que se asoma por los hombros.
        torso.add(part(new THREE.SphereGeometry(0.3, 20, 12), '#14204a', { y: -0.46, z: -0.08, ol: 0.04, s: [1.25, 0.8, 0.7] }));
        shirt(part, torso, N, k.skin);
        torso.add(neckRing(part, G, 0.02));
        // Broche: estrellita clara sobre el pecho.
        const pin = part(starGeo(0.035, 0.016), '#fff6c8', { y: -0.36, z: 0.21, ol: 0.15 });
        torso.add(pin);
        hoodCap(part, head, N, toon);
        // Franjas de luz en la capucha (sus colores se mezclan despacio).
        const mg = flat(G), mv = flat(V);
        const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.018, 6, 30, Math.PI * 1.15), mg);
        r1.position.set(0, 0, 0.07); r1.rotation.set(-0.15, 0, -Math.PI * 0.075); head.add(r1);
        const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.012, 6, 30, Math.PI * 1.1), mv);
        r2.position.set(0, 0.02, 0.02); r2.rotation.set(-0.35, 0, -Math.PI * 0.05); head.add(r2);
        // La cortinita de aurora: tiras finas que suben y bajan como ola.
        const curtain = new THREE.Group(); curtain.position.set(0, 0.44, 0.02);
        const strips = Array.from({ length: 7 }, (_, i) => {
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.12, 0.012), flat(i % 2 ? V : G));
          m.position.x = (i - 3) * 0.032; curtain.add(m); return m;
        });
        head.add(curtain);
        const a = new THREE.Color(G), b = new THREE.Color(V);
        return [(f, t) => {
          strips.forEach((m, i) => { const w = Math.sin(t * 3 + i * 0.8); m.position.y = w * 0.025; m.scale.y = 1 + w * 0.3; });
          curtain.position.y = 0.44 + Math.sin(t * 1.6) * 0.012 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.02 : 0);
          const q = (Math.sin(t * 0.9) + 1) / 2;
          mg.color.copy(a).lerp(b, q);
          mv.color.copy(b).lerp(a, q);
          pin.rotation.z = t * 0.8;
        }];
      },
    },
    // Mago de cristal: túnica turquesa con cuello claro, una corona de cristales sobre tu pelo que brillan uno tras
    // otro, un cristal en el pecho y otro grande que flota y gira a un lado.
    cristalino: {
      name: 'Mago de cristal/Maga de cristal', moves: ['pensando', 'guino', 'saludo'], sleeve: '#2fb6c8',
      build(part, head, torso, k, toon) {
        const C = '#5fe6f0';
        shirt(part, torso, this.sleeve, k.skin);
        torso.add(neckRing(part, '#d6fdff', 0.03));
        const chest = part(gem(0.035, 0.06), C, { y: -0.37, z: 0.215, ol: 0.15 });
        torso.add(chest);
        // Corona: se asienta sobre tu pelo (lo que sobresale arriba se esconde, como la del Rey Mago); aro claro con 5
        // cristales de frente y a los lados.
        for (const c of head.children) if (c.position.y > 0.2) c.visible = false;
        const crown = new THREE.Group(); crown.position.set(0, 0.2, -0.01); crown.rotation.x = -0.18;
        crown.add(part(new THREE.TorusGeometry(0.2, 0.018, 8, 32), '#d6fdff', { rx: Math.PI / 2, ol: 0.1 }));
        const shine = [];
        for (let i = 0; i < 5; i++) {
          const a = Math.PI / 2 + (i - 2) * 0.62, mat = toon({ color: C, emissive: '#2fb6c8', emissiveIntensity: 0.15 });
          const g = part(gem(0.03, i === 2 ? 0.09 : 0.065), null, { x: Math.cos(a) * 0.2, y: 0.05, z: Math.sin(a) * 0.2, ol: 0.12, mat });
          crown.add(g); shine.push(mat);
        }
        head.add(crown);
        // El cristal grande que flota a un lado, con su brillo.
        const big = part(gem(0.06, 0.11), C, { ol: 0.1 });
        big.add(part(gem(0.03, 0.055), '#d6fdff', { z: 0.02, ol: 0 }));
        const orb = new THREE.Group(); orb.add(big); orb.position.set(0.32, 0.12, 0.05); head.add(orb);
        const sp = part(starGeo(0.016, 0.007), null, { ol: 0, mat: flat('#ffffff') }); orb.add(sp);
        return [(f, t) => {
          big.rotation.y = t * 1.4;
          orb.position.y = 0.12 + Math.sin(t * 2) * 0.02 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.02 : 0);
          sp.position.set(Math.cos(t * 3) * 0.08, Math.sin(t * 3) * 0.08, 0.03);
          shine.forEach((m, i) => (m.emissiveIntensity = 0.15 + Math.max(0, Math.sin(t * 2.4 - i * 0.9)) * 0.5));
          chest.rotation.y = t * 0.9;
          crown.rotation.z = Math.sin(t * 1.3) * 0.03;
        }];
      },
    },
  };
};
