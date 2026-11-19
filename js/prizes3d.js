// Cápsulas y cofres 3D (18 nov 2026, pedido del usuario): lo que se abre al dar un premio.
// - Píldora de gemas: regalo chico (exclusivo de lluvias, códigos…).
// - Esfera de gemas: regalo grande (completar un planeta del evento o de una festividad). También va en el mapa.
// - Cofre planeta: monedas y ayudas (jefes, carrera). El metal dice qué tan bueno es: oro, plata, bronce o cobre.
// Mismo estilo que los viajeros: material toon con contorno de tinta. En lo chico (botones, listas) va su icono 2D.
import * as THREE from 'three';
import { INK, icon } from './art.js';
import { toonMaker } from './travelers.js';

const TAU = Math.PI * 2;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const METALS = { oro: '#ffc83d', plata: '#e4ebf5', bronce: '#eaa565', cobre: '#d77a5c' };
const GEMS = ['#ff5f7e', '#7dea8c', '#5fc7e8', '#b47dff', '#ff9c2b'];
const NAVY = '#3b3f8f', NAVY_D = '#2c2f70', GOLD = '#ffc83d';
// Ya cobrado (la esfera del mapa): todo en grises claros, como el castillo apagado.
const GREY = { navy: '#cfc8e2', navyD: '#bdb4d6', gold: '#e9e4f2', gem: '#e9e4f2' };

function kit(toon) {
  const ink = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  return (geo, color, { ol = 0.06, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, mat } = {}) => {
    const g = new THREE.Group(), m = mat || toon({ color });
    g.add(new THREE.Mesh(geo, m));
    if (ol) { const o = new THREE.Mesh(geo, ink); o.scale.setScalar(1 + ol); g.add(o); }
    g.position.set(x, y, z); g.rotation.set(rx, ry, rz);
    g.userData.mat = m;
    return g;
  };
}
const canvasTex = (w, h, draw) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

// Gema con aro dorado, mirando hacia «out». Devuelve su material para que brille.
function gemOn(part, toon, into, pos, out, col, size, gold) {
  const gm = new THREE.MeshToonMaterial({ color: col, emissive: col, emissiveIntensity: 0 });
  const h = new THREE.Group(); h.position.copy(pos); h.lookAt(pos.clone().add(out));
  h.add(part(new THREE.SphereGeometry(size, 14, 10), null, { mat: gm, ol: 0.25 }), part(new THREE.TorusGeometry(size * 1.15, size * 0.38, 8, 20), null, { mat: toon({ color: gold }), ol: 0.2 }));
  into.add(h);
  return gm;
}
// Brillo en ronda: cada gema se enciende un poco después de la anterior.
const twinkle = (gems, t) => gems.forEach((m, i) => (m.emissiveIntensity = 0.3 + 0.4 * Math.max(0, Math.sin(t * 3 - i * 0.7))));

// open(v, t): v = qué tan abierto (0 a 1, con rebote se pasa un poco), t = segundos (para lo que brilla o gira).
const MODELS = {
  // Píldora acostada: azul noche, aros de oro y gemas en las puntas (la banda donde se abre va lisa).
  pill(part, toon) {
    const g = new THREE.Group(), inner = new THREE.Group(), top = new THREE.Group(), bot = new THREE.Group(), gems = [];
    let n = 0;
    for (const [h, s] of [[top, 1], [bot, -1]]) {
      h.add(part(new THREE.CylinderGeometry(0.33, 0.33, 0.17, 32), NAVY_D, { y: s * 0.085 }));
      h.add(part(new THREE.CylinderGeometry(0.37, 0.37, 0.08, 32), GOLD, { y: s * 0.2 }));
      const dome = part(new THREE.SphereGeometry(0.32, 32, 16, 0, TAU, 0, Math.PI / 2), NAVY, { y: s * 0.235, rx: s < 0 ? Math.PI : 0 });
      dome.scale.y = 1.15; h.add(dome);
      gems.push(gemOn(part, toon, h, new THREE.Vector3(0, s * (0.235 + 0.32 * 1.15), 0), new THREE.Vector3(0, s, 0), GEMS[n++ % 5], 0.065, GOLD));
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * TAU + 0.3, out = new THREE.Vector3(Math.sin(a) * 0.75, s * 0.66, Math.cos(a) * 0.75).normalize();
        gems.push(gemOn(part, toon, h, new THREE.Vector3(out.x * 0.32, s * 0.235 + out.y * 0.32 * 1.15, out.z * 0.32), out, GEMS[n++ % 5], 0.04, GOLD));
      }
    }
    inner.add(top, bot); inner.rotation.z = -Math.PI / 2; g.add(inner);
    return { obj: g, glowY: 0, open: (v, t) => { top.position.y = v * 0.28; top.rotation.z = v * 0.3; bot.position.y = -v * 0.04; twinkle(gems, t); } };
  },
  // Esfera: banda de oro al centro, gemas por todos lados; la tapa se abre como bisagra.
  sphere(part, toon, { grey } = {}) {
    const C = grey ? { navy: GREY.navy, navyD: GREY.navyD, gold: GREY.gold } : { navy: NAVY, navyD: '#1c1850', gold: GOLD };
    const g = new THREE.Group(), hinge = new THREE.Group(), top = new THREE.Group(), bot = new THREE.Group(), R = 0.4, gems = [];
    top.add(part(new THREE.SphereGeometry(R, 32, 16, 0, TAU, 0, Math.PI / 2), C.navy));
    bot.add(part(new THREE.SphereGeometry(R, 32, 16, 0, TAU, Math.PI / 2, Math.PI / 2), C.navy));
    bot.add(part(new THREE.CircleGeometry(R * 0.98, 32), C.navyD, { ol: 0, rx: -Math.PI / 2, y: 0.001 }));
    bot.add(part(new THREE.TorusGeometry(R + 0.01, 0.05, 10, 40), C.gold, { rx: Math.PI / 2 }));
    [[0.5, 0], [0.5, 1.6], [0.5, 3.2], [0.5, 4.7], [-0.55, 0.8], [-0.55, 2.4], [-0.55, 4], [-0.55, 5.6], [1.3, 0]].forEach(([lat, lon], i) => {
      const p = new THREE.Vector3().setFromSphericalCoords(R, Math.PI / 2 - lat, lon);
      gems.push(gemOn(part, toon, lat > 0 ? top : bot, p, p.clone(), grey ? GREY.gem : GEMS[i % 5], 0.055, C.gold));
    });
    hinge.position.z = -R; top.position.z = R; hinge.add(top);
    g.add(hinge, bot);
    return { obj: g, glowY: 0, open: (v, t) => { hinge.rotation.x = -v * 1.45; if (!grey) twinkle(gems, t); } };
  },
  // Cofre planeta: cielo con estrellas, correas y candado de metal, antena que parpadea. La tapa gira hacia atrás.
  // body: color del cofre (el del jefe en su cofre) · metal: oro/plata/bronce/cobre · emblem: SVG para el candado.
  chest(part, toon, { body = '#2b4fa8', metal = 'oro', emblem } = {}) {
    const g = new THREE.Group(), W = 0.8, D = 0.56, H = 0.42, by = -0.2, mc = METALS[metal] || METALS.oro;
    const lidCol = new THREE.Color(body).offsetHSL(0, 0, 0.07).getStyle();
    const sky = canvasTex(128, 64, (c, w, h) => { c.fillStyle = body; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; [[20, 14], [50, 40], [90, 20], [110, 50], [70, 54], [34, 52]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); }); });
    g.add(part(new THREE.BoxGeometry(W, H, D), null, { y: by, mat: toon({ color: '#ffffff', map: sky }) }));
    // 18 nov 2026 (el usuario escogió la C en dev/cofres-metales.html): para que el metal se note, correas anchas,
    // aro abajo y en las orillas de la tapa, candado grande, y el metal brilla un poco.
    const mm = () => toon({ color: mc, emissive: mc, emissiveIntensity: 0.18 });
    for (const s of [-1, 1]) g.add(part(new THREE.BoxGeometry(0.14, H + 0.02, D + 0.03), null, { x: s * 0.24, y: by, mat: mm() }));
    g.add(part(new THREE.BoxGeometry(W + 0.03, 0.07, D + 0.03), null, { y: by - H / 2 + 0.035, mat: mm() }));
    g.add(part(new THREE.BoxGeometry(0.24, 0.24, 0.04), null, { y: by + 0.06, z: D / 2 + 0.02, mat: mm() }));
    if (emblem) {
      // El dibujo del jefe en el candado (SVG → imagen → textura, cuando cargue).
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.15), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
      plate.position.set(0, by + 0.06, D / 2 + 0.045); g.add(plate);
      const img = new Image();
      img.onload = () => { const t = canvasTex(128, 128, (c) => c.drawImage(img, 8, 8, 112, 112)); plate.material.map = t; plate.material.opacity = 1; plate.material.needsUpdate = true; };
      // Su etiqueta <svg> con tamaño fijo y xmlns (algunos ya traen width/height).
      const i = emblem.indexOf('>'), head = emblem.slice(0, i).replace(/\s(width|height|xmlns)="[^"]*"/g, '');
      img.src = `data:image/svg+xml,${encodeURIComponent(`${head} xmlns="http://www.w3.org/2000/svg" width="128" height="128"${emblem.slice(i)}`)}`;
    } else g.add(part(new THREE.SphereGeometry(0.057, 12, 10), '#ff9c2b', { y: by + 0.06, z: D / 2 + 0.05, ol: 0.2 }));
    const hinge = new THREE.Group(), lid = new THREE.Group();
    hinge.position.set(0, by + H / 2, -D / 2); lid.position.z = D / 2; hinge.add(lid);
    const half = (r, w) => new THREE.CylinderGeometry(r, r, w, 28, 1, false, 0, Math.PI);
    const l1 = part(half(D / 2, W), lidCol, { rz: Math.PI / 2 }); l1.scale.set(0.75, 1, 1); lid.add(l1);
    for (const s of [-1, 1]) { const b = part(half(D / 2 + 0.015, 0.14), null, { rz: Math.PI / 2, x: s * 0.24, mat: mm() }); b.scale.set(0.77, 1, 1); lid.add(b); }
    for (const s of [-1, 1]) { const r = part(half(D / 2 + 0.012, 0.05), null, { rz: Math.PI / 2, x: s * (W / 2 - 0.02), mat: mm() }); r.scale.set(0.77, 1, 1); lid.add(r); }
    lid.add(part(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), INK, { y: (D / 2) * 0.75 + 0.08, ol: 0 }));
    const bulb = new THREE.MeshToonMaterial({ color: '#ff5f7e', emissive: '#ff5f7e', emissiveIntensity: 0 });
    lid.add(part(new THREE.SphereGeometry(0.05, 12, 10), null, { mat: bulb, y: (D / 2) * 0.75 + 0.17, ol: 0.2 }));
    g.add(hinge);
    return { obj: g, glowY: by + H / 2, open: (v, t) => { hinge.rotation.x = -v * 1.9; bulb.emissiveIntensity = Math.floor(t * 2) % 2 ? 0.8 : 0; } };
  },
};
// Para otros dibujantes (el mapa): el modelo con su material toon.
export function prizeModel(kind, toon, opts = {}) {
  return MODELS[kind](kit(toon), toon, opts);
}

const glowTex = () => canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,248,200,1)'); r.addColorStop(0.4, 'rgba(255,230,140,.6)'); r.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });

// Lo que se abre en una ventana: su lienzo dentro de «el» (que le da el tamaño). Se deshace solo al cerrar la ventana.
// await stage.shake(veces, fuerza) → tiembla; await stage.open() → se abre con rebote, luz y una lluvia de
// monedas y gemas (cofre) o papelitos (cápsulas); termina cuando ya se ve abierto (para soltar las burbujas).
export class PrizeStage {
  constructor(el, kind, opts = {}) {
    this.kind = kind;
    const c = document.createElement('canvas');
    c.className = 'p3d-c';
    el.append(c);
    this.canvas = c;
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
    } catch {
      // Sin 3D: su icono 2D, quieto.
      this.dead = true;
      c.remove();
      el.insertAdjacentHTML('beforeend', icon({ chest: 'cofrePlaneta', sphere: 'esfera', pill: 'capsula' }[kind]));
      return;
    }
    const px = Math.max(120, Math.round((c.clientWidth || (el.clientWidth || 120) * 2.4) * Math.min(2, devicePixelRatio || 1)));
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(px, px, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = (this.scene = new THREE.Scene());
    scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x3a2470, 1.3));
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.6); sun.position.set(-4, 5, 7); scene.add(sun);
    // El lienzo es 2.4 veces su lugar (styles.css) para que nada se corte al abrirse; la cámara se aleja en proporción.
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20); this.camera.position.set(0, 0.78, 4.5); this.camera.lookAt(0, -0.02, 0);
    this.toon = toonMaker();
    this.part = kit(this.toon);
    this.m = prizeModel(kind, this.toon, opts);
    this.turn = new THREE.Group(); this.turn.add(this.m.obj); scene.add(this.turn);
    if (kind === 'sphere') this.m.obj.position.y = -0.14;
    if (kind === 'pill' || kind === 'sphere') this.m.obj.scale.setScalar(0.9); // 10% más chicas (el usuario)
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.glow.position.set(0, this.m.glowY, -0.1); this.glow.scale.setScalar(0.001); scene.add(this.glow);
    this.val = 0; this.vel = 0; this.target = 0; this.sh = null; this.bits = [];
    this.calm = calm();
    if (this.calm) this.val = this.target = 0;
    this.t0 = performance.now(); this.prev = this.t0;
    this.raf = requestAnimationFrame((n) => this.loop(n));
  }
  shake(times = 2, amp = 0.12) {
    if (this.dead || this.calm) return Promise.resolve();
    const dur = 360 * times;
    this.sh = { t0: performance.now(), dur, amp };
    return new Promise((r) => setTimeout(r, dur));
  }
  open() {
    if (this.dead) return Promise.resolve();
    this.target = 1;
    if (this.calm) { this.val = 1; return Promise.resolve(); }
    this.burst();
    return new Promise((r) => setTimeout(r, 260));
  }
  burst() {
    const chest = this.kind === 'chest';
    const geos = chest ? [new THREE.CylinderGeometry(0.06, 0.06, 0.02, 18), new THREE.OctahedronGeometry(0.05, 0)] : [new THREE.BoxGeometry(0.05, 0.05, 0.05)];
    for (let i = 0; i < 16; i++) {
      const coin = chest && i % 3;
      const b = this.part(geos[chest ? (coin ? 0 : 1) : 0], coin ? GOLD : GEMS[i % 5], { ol: 0.15, y: this.m.glowY });
      const a = Math.random() * TAU;
      b.userData = { vel: new THREE.Vector3(Math.cos(a) * 0.9, 2.1 + Math.random() * 1.2, Math.sin(a) * 0.5 + 0.4), spin: new THREE.Vector3(Math.random() * 9, Math.random() * 9, 0), life: 0 };
      this.scene.add(b); this.bits.push(b);
    }
  }
  loop(now) {
    if (this.dead) return;
    if (!this.canvas.isConnected) return this.dispose(); // se cerró la ventana
    const dt = Math.min(0.05, (now - this.prev) / 1000), t = (now - this.t0) / 1000;
    this.prev = now;
    // Resorte: se pasa un poco y regresa (se abre con rebote).
    if (!this.calm) { this.vel += (this.target - this.val) * 170 * dt; this.vel *= Math.pow(0.0009, dt); this.val += this.vel * dt; }
    let z = 0;
    if (this.sh) {
      const k = (now - this.sh.t0) / this.sh.dur;
      if (k >= 1) this.sh = null;
      else z = Math.sin(k * this.sh.dur * 0.035) * this.sh.amp * (0.5 + k);
    }
    this.turn.rotation.set(0, this.calm ? 0.45 : 0.45 + Math.sin(t * 0.7) * 0.4, z);
    this.turn.position.y = this.calm ? 0 : Math.sin(t * 2) * 0.03;
    this.m.open(Math.max(-0.2, this.val), t);
    this.glow.scale.setScalar(Math.max(0.001, this.val * 1.15 + Math.sin(t * 5) * 0.04 * this.val));
    this.bits = this.bits.filter((b) => {
      const u = b.userData;
      u.life += dt; u.vel.y -= 4.5 * dt;
      b.position.addScaledVector(u.vel, dt); b.rotation.x += u.spin.x * dt; b.rotation.y += u.spin.y * dt;
      const left = u.life < 1.6;
      // Se desvanecen al final de su vida o al bajar mucho (antes de llegar a la orilla del lienzo y cortarse).
      b.scale.setScalar(left ? Math.max(0, Math.min(1, (1.6 - u.life) * 3, (b.position.y + 0.95) * 2.5)) : 0);
      if (!left) this.scene.remove(b);
      return left;
    });
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame((n) => this.loop(n));
  }
  dispose() {
    if (this.dead) return;
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => { m.map?.dispose(); m.dispose(); }); });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
