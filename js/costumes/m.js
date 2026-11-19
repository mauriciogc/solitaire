// Disfraces 3D, tanda M (19 nov 2026): exclusivos de Construir (al construir una constelación completa). Astronauta
// lunar y Astrónomo dejan tu cara y tu pelo con casco o boina encima; el Caballero galáctico es casco completo (hood).
// Ver js/avatar3d.js: export default (H) => ({ clave: { name, moves, sleeve, hood | wig, build } }). Cabeza de radio
// ~0.27 en el origen de head; el torso arranca en y ≈ -0.25.
export default (H) => {
  const { THREE, TAU, flat, shirt, starGeo, hoodCap, onCap, belly, neckRing } = H;
  // Lo que sobresale de tu pelo arriba (remolino, chongos) se esconde para que quepa el casco o la boina.
  const hideTop = (head, y = 0.2) => { for (const c of head.children) if (c.position.y > y) c.visible = false; };
  return {
    // Astronauta lunar: traje blanco con chaleco naranja de obra, casco amarillo con su lámpara que se prende y apaga,
    // y un parche de luna en el hombro.
    astrolunar: {
      name: 'Astronauta lunar', moves: ['saludo', 'asiente', 'risa'], sleeve: '#eef0fa',
      build(part, head, torso, k, toon) {
        shirt(part, torso, this.sleeve, k.skin);
        // Chaleco de obra: dos tirantes naranjas con su franja que brilla.
        for (const sx of [-1, 1]) {
          torso.add(part(new THREE.BoxGeometry(0.06, 0.2, 0.03), '#ff8a3d', { x: sx * 0.1, y: -0.4, z: 0.19, rx: -0.35, rz: sx * 0.12, ol: 0.12 }));
          torso.add(part(new THREE.BoxGeometry(0.062, 0.025, 0.032), '#fff6a0', { x: sx * 0.1, y: -0.42, z: 0.2, rx: -0.35, rz: sx * 0.12, ol: 0 }));
        }
        torso.add(neckRing(part, '#b9bfd6', 0.03));
        torso.add(part(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 16), '#d9dbe8', { x: -0.24, y: -0.36, z: 0.12, rx: Math.PI / 2, ry: -0.9, ol: 0.2 }));
        hideTop(head);
        const hat = new THREE.Group(); hat.position.y = 0.1; hat.rotation.x = -0.12;
        hat.add(part(new THREE.SphereGeometry(0.29, 26, 12, 0, TAU, 0, Math.PI / 2).scale(1, 0.82, 1.02), '#ffc83d', { ol: 0.04 }));
        hat.add(part(new THREE.CylinderGeometry(0.33, 0.33, 0.022, 28), '#ffc83d', { z: 0.03, ol: 0.06 }));
        hat.add(part(new THREE.BoxGeometry(0.05, 0.03, 0.42), '#ffb31a', { y: 0.225, ol: 0.1 }));
        const lamp = new THREE.Group(), lp = onCap(0, 0.42, 1, 0.285); lamp.position.set(lp.x, lp.y, lp.z); lamp.rotation.x = -0.4;
        lamp.add(part(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 14).rotateX(Math.PI / 2), '#3a3550', { ol: 0.15 }));
        const bulb = toon({ color: '#fff3a0', emissive: '#ffd84a', emissiveIntensity: 0.4 });
        lamp.add(part(new THREE.CircleGeometry(0.036, 16), null, { z: 0.027, ol: 0, mat: bulb }));
        hat.add(lamp);
        head.add(hat);
        return [(f, t) => {
          bulb.emissiveIntensity = 0.3 + Math.max(0, Math.sin(t * 2.2)) * 0.7;
          hat.position.y = 0.1 + (f.laugh ? Math.abs(Math.sin(t * 12)) * 0.015 : 0);
        }];
      },
    },
    // Astrónomo: capa azul noche con estrellitas doradas, boina con broche de estrella y un telescopio chiquito que
    // flota a un lado y busca estrellas.
    astronomo: {
      name: 'Astrónomo/Astrónoma', moves: ['pensando', 'sorpresa', 'guino'], sleeve: '#2a3a8a',
      build(part, head, torso, k) {
        torso.add(part(new THREE.SphereGeometry(0.3, 20, 12), '#121a4a', { y: -0.46, z: -0.08, ol: 0.04, s: [1.25, 0.8, 0.7] }));
        shirt(part, torso, this.sleeve, k.skin);
        torso.add(neckRing(part, '#ffc83d', 0.022));
        const stars = [[-0.12, -0.36, 0.2, 0.02], [0.1, -0.42, 0.21, 0.026], [-0.02, -0.5, 0.2, 0.016], [0.17, -0.33, 0.17, 0.016]].map(([x, y, z, r]) => {
          const s = part(starGeo(r, r * 0.45), '#ffc83d', { x, y, z, ol: 0.2 }); torso.add(s); return s;
        });
        hideTop(head);
        const beret = new THREE.Group(); beret.position.set(0.03, 0.22, -0.01); beret.rotation.set(-0.25, 0, -0.2);
        beret.add(part(new THREE.SphereGeometry(0.25, 24, 12).scale(1, 0.32, 1), '#2a3a8a', { ol: 0.05 }));
        beret.add(part(new THREE.CylinderGeometry(0.015, 0.02, 0.05, 8), '#2a3a8a', { y: 0.08, ol: 0.2 }));
        beret.add(part(starGeo(0.045, 0.02), '#ffc83d', { x: 0.12, y: 0.03, z: 0.18, ry: 0.5, ol: 0.18 }));
        head.add(beret);
        const scope = new THREE.Group(); scope.position.set(0.34, 0.06, 0.06);
        const tube = new THREE.Group(); tube.rotation.z = 0.8;
        tube.add(part(new THREE.CylinderGeometry(0.03, 0.04, 0.2, 14), '#e0a82a', { ol: 0.1 }));
        tube.add(part(new THREE.CylinderGeometry(0.046, 0.046, 0.03, 14), '#2a3a8a', { y: 0.1, ol: 0.12 }));
        tube.add(part(new THREE.CircleGeometry(0.035, 14).rotateX(-Math.PI / 2), '#8fe8ff', { y: 0.116, ol: 0 }));
        scope.add(tube);
        const spark = part(starGeo(0.018, 0.008), null, { ol: 0, mat: flat('#fff3a0') }); scope.add(spark);
        head.add(scope);
        return [(f, t) => {
          scope.position.y = 0.06 + Math.sin(t * 1.8) * 0.02;
          tube.rotation.z = 0.8 + Math.sin(t * 0.9) * 0.18;
          const q = (t * 0.6) % 1; spark.position.set(-0.08 - q * 0.1, 0.1 + q * 0.12, 0.02); spark.scale.setScalar(1 - q * 0.6);
          stars.forEach((s, i) => s.scale.setScalar(1 + Math.max(0, Math.sin(t * 2.4 - i * 1.3)) * 0.35));
          beret.rotation.z = -0.2 + (f.laugh ? Math.sin(t * 12) * 0.06 : 0);
        }];
      },
    },
    // Caballero galáctico: armadura plateada con hombreras moradas, casco con visera violeta y una estrella que brilla
    // de penacho; escudo morado con un cometa.
    caballerogalactico: {
      name: 'Caballero galáctico/Caballera galáctica', hood: true, moves: ['asiente', 'saludo', 'sorpresa'], sleeve: '#c9cfe6',
      build(part, head, torso, k, toon) {
        const S = this.sleeve, V = '#8a5cf0';
        shirt(part, torso, S, k.skin);
        belly(part, torso, '#e6e9f6', 1.15);
        torso.add(part(starGeo(0.04, 0.018), V, { y: -0.4, z: 0.225, ol: 0.18 }));
        for (const sx of [-1, 1]) torso.add(part(new THREE.SphereGeometry(0.11, 14, 10, 0, TAU, 0, Math.PI / 2), V, { x: sx * 0.24, y: -0.33, rz: -sx * 0.5, ol: 0.08 }));
        hoodCap(part, head, S, toon);
        const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.325, 0.325, 0.065, 28, 1, true, -0.9, 1.8), toon({ color: V, side: THREE.DoubleSide }));
        visor.position.y = 0.17; visor.rotation.x = -0.35; head.add(visor);
        const crest = new THREE.Group(), cp = onCap(0, 1, -0.1, 0.31); crest.position.set(cp.x, cp.y, cp.z);
        crest.add(part(new THREE.CylinderGeometry(0.012, 0.018, 0.08, 6), S, { y: 0.03, ol: 0.2 }));
        const glowM = toon({ color: '#ffe066', emissive: '#ffc83d', emissiveIntensity: 0.3 });
        const star = part(starGeo(0.075, 0.034), null, { y: 0.13, ol: 0.15, mat: glowM });
        crest.add(star); head.add(crest);
        const shield = new THREE.Group(); shield.position.set(-0.2, -0.34, 0.19); shield.rotation.set(-0.3, -0.3, 0.15);
        shield.add(part(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 20), V, { rx: Math.PI / 2, ol: 0.1 }));
        shield.add(part(new THREE.CylinderGeometry(0.012, 0.022, 0.1, 8), '#ffffff', { x: 0.015, y: 0.015, z: 0.018, rz: -0.8, ol: 0 }));
        shield.add(part(starGeo(0.03, 0.013), '#ffc83d', { x: -0.035, y: -0.035, z: 0.02, ol: 0.2 }));
        torso.add(shield);
        return [(f, t) => {
          star.rotation.y = Math.sin(t * 1.5) * 0.5;
          glowM.emissiveIntensity = 0.3 + Math.max(0, Math.sin(t * 2.6)) * 0.5;
          crest.rotation.z = Math.sin(t * 2) * 0.08 + (f.laugh ? Math.sin(t * 12) * 0.15 : 0);
        }];
      },
    },
  };
};
