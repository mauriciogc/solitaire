// Disfraces 3D, tanda J (11 nov 2026): el Guardián secreto (premio de 200 niveles secretos) y, el 12 nov 2026, el
// Explorador galáctico (sello 10 del pasaporte, 4,500 niveles). Ver passport.js.
// Ver js/avatar3d.js: export default (H) => ({ clave: { name, moves, sleeve, hood | wig, build } }).
export default (H) => {
  const { THREE, flat, shirt, starGeo, hoodCap, onCap, neckRing } = H;
  return {
    // Guardián secreto: capucha violeta noche con orilla dorada, una cerradura de oro en el pecho y la estrella secreta
    // flotando arriba, girando, con dos chispitas que le dan vueltas.
    custodio: {
      name: 'Guardián secreto', hood: true, moves: ['guino', 'pensando', 'saludo'], sleeve: '#3a1f7a',
      build(part, head, torso, k, toon) {
        const V = this.sleeve, G = '#ffc83d';
        shirt(part, torso, V, k.skin);
        torso.add(neckRing(part, G, 0.018));
        // Cerradura dorada en el pecho: aro con su ojo de llave.
        const lock = new THREE.Group(); lock.position.set(0, -0.39, 0.205); lock.rotation.x = -0.35;
        lock.add(part(new THREE.CylinderGeometry(0.06, 0.06, 0.016, 20), G, { rx: Math.PI / 2, ol: 0.12 }));
        lock.add(part(new THREE.CylinderGeometry(0.016, 0.016, 0.01, 12), '#2a1f5c', { z: 0.01, y: 0.012, rx: Math.PI / 2, ol: 0 }));
        lock.add(part(new THREE.BoxGeometry(0.014, 0.03, 0.01), '#2a1f5c', { z: 0.01, y: -0.008, ol: 0 }));
        torso.add(lock);
        hoodCap(part, head, V, toon);
        // Orilla dorada de la capucha alrededor de la cara.
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.016, 6, 30, Math.PI * 1.15), flat(G));
        rim.position.set(0, 0.0, 0.07); rim.rotation.set(-0.15, 0, -Math.PI * 0.075); head.add(rim);
        // Estrellitas doradas sobre la capucha.
        [[-0.16, 0.22, 0.1], [0.18, 0.2, 0.06], [0.0, 0.28, -0.1]].forEach(([x, y, z]) => head.add(part(starGeo(0.026, 0.012), G, { ...onCap(x, y, z, 0.31), rx: -0.6, ol: 0.15 })));
        // La estrella secreta flotando: violeta clara con corazón dorado.
        const glow = flat('#ffe066');
        const st = new THREE.Group(); st.position.set(0, 0.42, 0.02);
        const big = part(starGeo(0.075, 0.034), '#b48cff', { ol: 0.14 });
        const core = new THREE.Mesh(starGeo(0.036, 0.016), glow); core.position.z = 0.01; big.add(core);
        st.add(big);
        const sparks = [0, 1].map((i) => { const s = part(starGeo(0.018, 0.008), null, { ol: 0, mat: flat('#fff6b0') }); st.add(s); return s; });
        head.add(st);
        const a = new THREE.Color('#ffd23d'), b = new THREE.Color('#fff6b0');
        return [(f, t) => {
          big.rotation.y = t * 1.2;
          st.position.y = 0.42 + Math.sin(t * 2) * 0.015 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.02 : 0);
          sparks.forEach((s, i) => { const ang = t * 2.2 + i * Math.PI; s.position.set(Math.cos(ang) * 0.11, Math.sin(ang * 2) * 0.02, Math.sin(ang) * 0.11); });
          glow.color.copy(a).lerp(b, (Math.sin(t * 3) + 1) / 2);
          lock.rotation.z = Math.sin(t * 1.3) * 0.08;
        }];
      },
    },
    // Explorador galáctico (sello 10 del pasaporte): capucha azul de pasaporte con orilla dorada, la libreta del
    // pasaporte en el pecho y un planetita con anillo que le da vueltas sobre la cabeza, con tres sellitos de colores.
    viajerogalactico: {
      name: 'Explorador galáctico/Exploradora galáctica', hood: true, moves: ['saludo', 'sorpresa', 'risa'], sleeve: '#3a4fc0',
      build(part, head, torso, k, toon) {
        const B = this.sleeve, G = '#ffc83d';
        shirt(part, torso, B, k.skin);
        torso.add(neckRing(part, G, 0.018));
        // La libreta en el pecho: tapa azul oscuro con el círculo dorado del pasaporte.
        const book = new THREE.Group(); book.position.set(0.07, -0.4, 0.2); book.rotation.set(-0.35, 0, -0.12);
        book.add(part(new THREE.BoxGeometry(0.1, 0.13, 0.02), '#2a3a9a', { ol: 0.1 }));
        book.add(part(new THREE.TorusGeometry(0.025, 0.006, 6, 16), G, { z: 0.012, y: 0.012, ol: 0 }));
        book.add(part(new THREE.BoxGeometry(0.05, 0.007, 0.004), G, { z: 0.012, y: -0.035, ol: 0 }));
        torso.add(book);
        hoodCap(part, head, B, toon);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.016, 6, 30, Math.PI * 1.15), flat(G));
        rim.position.set(0, 0.0, 0.07); rim.rotation.set(-0.15, 0, -Math.PI * 0.075); head.add(rim);
        // Sellitos de colores sobre la capucha (como los del pasaporte).
        [[-0.16, 0.22, 0.1, '#2fae6a'], [0.18, 0.2, 0.06, '#ff8a3d'], [0.02, 0.29, -0.08, '#8a5cf0']].forEach(([x, y, z, c]) => head.add(part(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 14), c, { ...onCap(x, y, z, 0.31), rx: Math.PI / 2 - 0.6, ol: 0.2 })));
        // Planetita con anillo que gira sobre la cabeza.
        const orb = new THREE.Group(); orb.position.set(0, 0.42, 0.02);
        const planet = part(new THREE.SphereGeometry(0.055, 16, 12), '#4aa8de', { ol: 0.12 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.009, 6, 28), flat(G)); ring.rotation.x = Math.PI / 2 - 0.4; planet.add(ring);
        orb.add(planet);
        const moon = part(new THREE.SphereGeometry(0.018, 10, 8), '#fff6e6', { ol: 0.2 }); orb.add(moon);
        head.add(orb);
        return [(f, t) => {
          planet.rotation.y = t * 1.1;
          orb.position.y = 0.42 + Math.sin(t * 2) * 0.015 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.02 : 0);
          const ang = t * 2; moon.position.set(Math.cos(ang) * 0.12, Math.sin(ang) * 0.03, Math.sin(ang) * 0.12);
          book.rotation.z = -0.12 + Math.sin(t * 1.3) * 0.06;
        }];
      },
    },
  };
};
