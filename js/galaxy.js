// Mapa 3D: una región (10 mundos) como planetitas; al tocar uno, la cámara hace zoom
// y el camino de 10 niveles aparece sobre el mismo planeta.
import * as THREE from 'three';
import { BIOMES, LOCKED, biomeKey } from './biomes.js';
import { INK, icon, star } from './art.js';
import { makeTraveler, mapCovered } from './travelers.js';

const K = INK;
const TAU = Math.PI * 2;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- ruido de gradiente (formas orgánicas) ----------
const hash3 = (x, y, z, s) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1442695041) ^ Math.imul(s, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const GR = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
const q5 = (t) => t * t * t * (t * (t * 6 - 15) + 10);
function noise(x, y, z, s) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = q5(xf), v = q5(yf), w = q5(zf), L = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => { const g = GR[Math.floor(hash3(xi + dx, yi + dy, zi + dz, s) * 12)]; return g[0] * (xf - dx) + g[1] * (yf - dy) + g[2] * (zf - dz); };
  return 0.5 + 0.5 * L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
const fbm = (x, y, z, s) => { let a = 0, f = 1, w = 0.5; for (let o = 0; o < 4; o++) { a += w * noise(x * f, y * f, z * f, s + o); f *= 2.03; w *= 0.5; } return a / 0.9375; };

// Camino de niveles en el planeta (espacio local): rodea el planeta de oeste a este.
// El índice 10 es el nivel secreto (aparece con 30/30 estrellas), pasando el castillo del jefe.
const LAT = [18, 28, 33, 26, 16, 14, 22, 31, 34, 26, 4], LON = [...LAT.slice(0, 10).map((_, i) => -99 + 22 * i), 128];
const dirOf = (lat, lon) => { const a = (lat * Math.PI) / 180, b = (lon * Math.PI) / 180; return new THREE.Vector3(Math.sin(b) * Math.cos(a), Math.sin(a), Math.cos(b) * Math.cos(a)); };
const NODE_DIRS = LAT.map((lat, i) => dirOf(lat, LON[i]));
const spline = new THREE.CatmullRomCurve3(NODE_DIRS.slice(0, 10), false, 'centripetal');
const PATH_DIRS = [];
for (let k = 0; k <= 160; k++) PATH_DIRS.push(spline.getPoint(k / 160).normalize());
// Hacia dónde mira la cámara para ver el nivel i.
const faceAt = (i) => (-LON[i] * Math.PI) / 180 - 0.12;
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Cómo se ve un viajero: derecho y un poco girado hacia la cámara.
const UPRIGHT = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.12, -0.35, 0));

// Une vértices repetidos (para normales suaves) sin depender de los ejemplos de Three.
function merge(g) {
  const pos = g.attributes.position, map = new Map(), verts = [], idx = [];
  for (let i = 0; i < pos.count; i++) {
    const k = `${pos.getX(i).toFixed(5)},${pos.getY(i).toFixed(5)},${pos.getZ(i).toFixed(5)}`;
    let j = map.get(k);
    if (j == null) { j = verts.length / 3; map.set(k, j); verts.push(pos.getX(i), pos.getY(i), pos.getZ(i)); }
    idx.push(j);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  out.setIndex(idx);
  return out;
}

const texCache = {};

// Modo dev: ver con colores los planetas cerrados (sección Planetas del menú dev).
export const peek = { on: false };

export class Galaxy {
  // worlds: [{ w, state: 'done'|'current'|'gate'|'locked', stars, done, need, pin, levels: [{ kind, stars, paused }], secret: { open, stars, fresh } }]
  // on: { planet(w), level(w, i), mode(m, w), relayout(), region(±1) } · player: { traveler } (el viajero 3D que marca dónde vas)
  // celebrate: { w, i, kind, stars } = cómo estaba el nivel i ANTES de ganarlo (para animar el avance al volver).
  constructor(host, labelsEl, { worlds, player, on, start = null, celebrate = null }) {
    this.host = host; this.labelsEl = labelsEl; this.worlds = worlds; this.on = on; this.player = player; this.celebrate = celebrate;
    const W = host.clientWidth, H = host.clientHeight;
    this.port = W / H < 1;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    this.renderer.setSize(W, H, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.append(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
    this.fit(W, H);
    this.scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x3a2470, 1.2));
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.6);
    sun.position.set(-6, 5, 7);
    this.scene.add(sun);
    const grad = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
    grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
    this.toon = (o) => new THREE.MeshToonMaterial({ gradientMap: grad, ...o });
    this.geo = {};
    this.layout();
    this.objs = worlds.map((wd, i) => this.makePlanet(wd, this.spots[i], i));
    this.buildTrail();
    // Viajero sobre el planeta actual (en la vista de constelación); en el planeta hay otro en el camino.
    this.trav = makeTraveler(this.player.traveler, this.toon);
    this.travG = new THREE.Group(); this.travG.add(this.trav.obj); this.travG.visible = false;
    this.scene.add(this.travG);
    this.mode = 'galaxy'; this.sel = null; this.anim = null; this.look = 0; this.down = null; this.vel = 0; this.tw = [];
    const cur = this.objs.findIndex((o) => o.wd.state === 'current' || o.wd.state === 'gate');
    this.cam = this.camClamp(this.spots[start != null ? Math.max(0, this.objs.findIndex((o) => o.wd.w === start)) : Math.max(0, cur)].u);
    this.drawLabels();
    this.bind();
    if (start != null) { const o = this.objs.find((q) => q.wd.w === start); if (o) this.zoomTo(o, true); }
    this.last = performance.now();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  // Tamaño de la vista en unidades 3D: en horizontal se ve una franja de planetas que se recorre
  // a izquierda y derecha; en vertical, una columna que se recorre hacia arriba y abajo.
  fit(W, H) {
    const aspect = W / H;
    if (this.port) { this.hw = 3.1; this.hh = this.hw / aspect; } else { this.hh = 4; this.hw = this.hh * aspect; }
    this.camera.aspect = aspect;
    this.camera.position.z = this.hh / Math.tan((15 * Math.PI) / 180);
    this.camera.updateProjectionMatrix();
    this.zoom = this.port ? { x: 0, y: -this.hh * 0.12, s: this.hw * 0.92 } : { x: 0, y: -this.hh * 0.57, s: this.hh * 1.02 };
  }
  // Tamaño y lugar de cada planeta: tamaños variados (fijos por mundo) y separados según su tamaño, así nunca se enciman.
  layout() {
    let u = 0;
    this.spots = this.worlds.map((wd, i) => {
      const r = rng(wd.w * 7 + 1);
      const locked = wd.state === 'locked' || wd.state === 'gate';
      const s = wd.state === 'current' ? 0.95 : locked ? 0.5 + r() * 0.2 : 0.62 + r() * 0.26;
      if (i) u += this.spots_prev + s + (this.port ? 0.75 : 0.95) + r() * 0.3;
      this.spots_prev = s;
      const c = Math.sin(i * 1.3 + (wd.w % 7)) * (this.port ? 0.95 : 1.15) + (r() - 0.5) * 0.3;
      return { u, c, s };
    });
    delete this.spots_prev;
  }
  // Coordenadas 3D de un punto del recorrido (u = a lo largo, c = de lado).
  at(u, c) { return this.port ? [c + 0.4, -u + 0.35] : [u, c - 0.25]; }  // en vertical la columna va a la derecha: a la izquierda están los botones
  half() { return this.port ? this.hh : this.hw; }
  // Hasta dónde se puede recorrer: el primer y el último planeta quedan dentro de la pantalla
  // (en vertical, debajo del título y arriba del botón de jugar).
  camClamp(u) {
    const a = this.spots[0].u, b = this.spots.at(-1).u, H = this.half();
    // Márgenes: arriba/izquierda el título; abajo el botón de jugar; a la izquierda la columna de botones.
    const lo = a + (this.port ? H * 0.42 : H * 0.6), hi = b - (this.port ? H * 0.3 : H * 0.42);
    return lo > hi ? (a + b) / 2 : clamp(u, lo, hi);
  }
  setCam() { this.camera.position.x = this.port ? 0 : this.cam; this.camera.position.y = this.port ? 0.6 - this.cam : 0; this.camera.updateMatrixWorld(); }

  // Los planetas del evento se ven con su temática aunque estén cerrados (apagados y con candado).
  // En el modo dev (peek) los cerrados también se ven con sus colores, para revisar cada tipo de planeta.
  theme(wd) { return wd.theme || (!peek.on && (wd.state === 'locked' || wd.state === 'gate') ? LOCKED : BIOMES[biomeKey(wd.place)].planet); }
  // Evento del mes: planetas de 5 niveles. nodes = en qué puntos del camino van sus insignias (el último es el jefe).
  nodes(o) { return o.wd.nodes || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; }
  dirOf(o, i) { return NODE_DIRS[i >= this.nodes(o).length ? 10 : this.nodes(o)[i]]; }
  faceOf(o, i) { return faceAt(i >= this.nodes(o).length ? 10 : this.nodes(o)[i]); }
  lastOf(o) { return this.nodes(o).length - 1; }

  hAt(t, seed, v) {
    let h = fbm(v.x * t.freq + 10, v.y * t.freq + 10, v.z * t.freq + 10, seed);
    if (t === LOCKED) h -= Math.max(0, noise(v.x * 4 + 3, v.y * 4, v.z * 4, 77 + (seed % 5)) - 0.62) * 1.4;
    return h;
  }
  rAt(t, seed, v) {
    const h = this.hAt(t, seed, v);
    const above = t.sea < 0 ? h - 0.3 : Math.log1p(Math.exp((h - t.sea) * 18)) / 18; // costa suave
    return 1 + above * t.amp * (t.sea < 0 ? 0.8 : 2.2);
  }
  planetGeo(t, seed, detail) {
    const ck = `${seed}:${detail}:${t.sea}`;
    if (this.geo[ck]) return this.geo[ck];
    let g = merge(new THREE.IcosahedronGeometry(1, detail));
    const pos = g.attributes.position, hg = new Float32Array(pos.count), land = [], v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      const h = this.hAt(t, seed, v), r = this.rAt(t, seed, v);
      pos.setXYZ(i, v.x * r, v.y * r, v.z * r);
      hg[i] = h;
      if (t.sea >= 0 && h > t.sea + 0.04 && h < t.sea + 0.32 && !PATH_DIRS.some((p) => p.dot(v) > 0.992)) land.push(i);
      else if (t.sea < 0 && h > 0.5 && !PATH_DIRS.some((p) => p.dot(v) > 0.992)) land.push(i);
    }
    g.setAttribute('hgt', new THREE.BufferAttribute(hg, 1));
    g.computeVertexNormals();
    return (this.geo[ck] = { g, land });
  }
  // Franjas de color por píxel con la altura interpolada: bordes curvos.
  bandMat(t, alive) {
    const b = t.bands, m = this.toon({});
    m.onBeforeCompile = (sh) => {
      sh.uniforms.bStop = { value: [...b.map((x) => x[0]), ...Array(8 - b.length).fill(9)] };
      sh.uniforms.bCol = { value: [...b.map((x) => new THREE.Color(x[1])), ...Array(8 - b.length).fill(new THREE.Color())] };
      sh.uniforms.alive = { value: alive };
      sh.vertexShader = 'attribute float hgt;\nvarying float vH;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvH = hgt;');
      sh.fragmentShader = 'uniform float bStop[8];\nuniform vec3 bCol[8];\nuniform float alive;\nvarying float vH;\n' + sh.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );',
        'vec3 bc = bCol[0];\nfor (int i = 1; i < 8; i++) { if (vH >= bStop[i]) bc = bCol[i]; }\nfloat lum = dot(bc, vec3(0.3, 0.59, 0.11));\nbc = mix(vec3(lum), bc, 0.35 + 0.65 * alive);\nvec4 diffuseColor = vec4(bc, opacity);');
    };
    m.customProgramCacheKey = () => 'band' + b.map((x) => x[1]).join() + alive;
    return m;
  }
  glowMat(color) {
    return new THREE.ShaderMaterial({
      uniforms: { c: { value: new THREE.Color(color) } },
      vertexShader: 'varying vec3 n; void main(){ n = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 c; varying vec3 n; void main(){ float i = pow(max(0.0, 0.62 - dot(n, vec3(0.0,0.0,1.0))), 4.0); gl_FragColor = vec4(c, min(1.0, i * 0.45)); }',
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    });
  }
  desat(c, alive) { const l = c.r * 0.3 + c.g * 0.59 + c.b * 0.11, k = 0.35 + 0.65 * alive; c.r = l + (c.r - l) * k; c.g = l + (c.g - l) * k; c.b = l + (c.b - l) * k; return c; }

  props(group, t, seed, land, geo, alive) {
    if (!land.length || !t.prop) return;
    const r = rng(seed * 31), UP = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), m4 = new THREE.Matrix4(), sc = new THREE.Vector3(), pv = new THREE.Vector3();
    const n = Math.round(60 * (t.dense || 1) * alive);
    if (!n) return;
    let trunkG, crownG, crownC, trunkC = '#8a5a3a';
    if (t.prop === 'round') { trunkG = new THREE.CylinderGeometry(0.12, 0.16, 0.8, 6); crownG = new THREE.SphereGeometry(0.62, 10, 8); crownC = t.bands[Math.min(4, t.bands.length - 1)][1]; }
    if (t.prop === 'palm') { trunkG = new THREE.CylinderGeometry(0.08, 0.13, 1.4, 6); crownG = new THREE.SphereGeometry(0.62, 10, 6).scale(1.3, 0.45, 1.3); crownC = '#58b94e'; }
    if (t.prop === 'pine') { trunkG = new THREE.CylinderGeometry(0.1, 0.12, 0.5, 6); crownG = new THREE.ConeGeometry(0.5, 1.5, 8); crownC = '#2f7d68'; }
    if (t.prop === 'cactus') { trunkG = new THREE.CylinderGeometry(0.2, 0.22, 0.9, 8); crownG = new THREE.SphereGeometry(0.2, 8, 6); crownC = '#4fa04a'; trunkC = '#4fa04a'; }
    if (t.prop === 'crystal') { trunkG = new THREE.OctahedronGeometry(0.35); crownG = new THREE.OctahedronGeometry(0.22); crownC = '#ff7ab8'; trunkC = '#b48cff'; }
    // Vela de ofrenda: cirio color crema y su llamita.
    if (t.prop === 'candle') { trunkG = new THREE.CylinderGeometry(0.16, 0.18, 0.8, 8); crownG = new THREE.SphereGeometry(0.16, 8, 6).scale(1, 1.6, 1); crownC = '#ffb13d'; trunkC = '#fff1d6'; }
    // Casita (pueblo, granja): paredes crema y techo de teja.
    if (t.prop === 'house') { trunkG = new THREE.BoxGeometry(0.7, 0.8, 0.7); crownG = new THREE.ConeGeometry(0.62, 0.6, 4).rotateY(Math.PI / 4); crownC = '#e2603a'; trunkC = '#fff1d6'; }
    // Torre de castillo: piedra con techo picudo.
    if (t.prop === 'tower') { trunkG = new THREE.CylinderGeometry(0.26, 0.3, 1.3, 8); crownG = new THREE.ConeGeometry(0.38, 0.75, 8); crownC = '#8a5cf0'; trunkC = '#c9c4d8'; }
    // Edificio de ciudad: bloque alto con su azotea iluminada.
    if (t.prop === 'building') { trunkG = new THREE.BoxGeometry(0.5, 1.7, 0.5); crownG = new THREE.BoxGeometry(0.34, 0.22, 0.34); crownC = '#ffd36b'; trunkC = '#8fa3c8'; }
    // Flor grande (jardín): tallo y su botón.
    if (t.prop === 'flower') { trunkG = new THREE.CylinderGeometry(0.06, 0.08, 0.9, 6); crownG = new THREE.SphereGeometry(0.4, 10, 8).scale(1, 0.7, 1); crownC = '#ff7ab8'; trunkC = '#4fa04a'; }
    // Paleta de feria: palito blanco y dulce redondo.
    if (t.prop === 'lollipop') { trunkG = new THREE.CylinderGeometry(0.05, 0.05, 1, 6); crownG = new THREE.SphereGeometry(0.36, 10, 8); crownC = '#ff5fa8'; trunkC = '#fff6ee'; }
    // Espiga de trigo (granja): tallo dorado y espiga alargada.
    if (t.prop === 'wheat') { trunkG = new THREE.CylinderGeometry(0.05, 0.07, 0.9, 5); crownG = new THREE.SphereGeometry(0.2, 8, 6).scale(1, 2.2, 1); crownC = '#ffc83d'; trunkC = '#d9a23a'; }
    // Pirámide (desierto antiguo): bloque dorado y su punta clara.
    if (t.prop === 'pyramid') { trunkG = new THREE.ConeGeometry(0.75, 0.9, 4).rotateY(Math.PI / 4); crownG = new THREE.ConeGeometry(0.2, 0.24, 4).rotateY(Math.PI / 4); crownC = '#fff3b0'; trunkC = '#e8b04a'; }
    // Coral (bahía): rama rosa con su bolita.
    if (t.prop === 'coral') { trunkG = new THREE.CylinderGeometry(0.1, 0.16, 0.8, 6); crownG = new THREE.IcosahedronGeometry(0.34); crownC = '#ff7a9a'; trunkC = '#ff9cb4'; }
    // Hongo (arboleda): tallo blanco y sombrero rojo.
    if (t.prop === 'mushroom') { trunkG = new THREE.CylinderGeometry(0.14, 0.18, 0.7, 8); crownG = new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.75, 1); crownC = '#e8434f'; trunkC = '#fff6ee'; }
    // Bambú: caña alta verde con un penacho de hojas.
    if (t.prop === 'bamboo') { trunkG = new THREE.CylinderGeometry(0.07, 0.08, 1.8, 6); crownG = new THREE.SphereGeometry(0.3, 8, 6).scale(1.2, 0.5, 1.2); crownC = '#6fc25a'; trunkC = '#a8d45a'; }
    // Muñeco de nieve (tundra): dos bolas.
    if (t.prop === 'snowman') { trunkG = new THREE.SphereGeometry(0.4, 10, 8); crownG = new THREE.SphereGeometry(0.27, 10, 8); crownC = '#ffffff'; trunkC = '#f4fbff'; }
    // Acacia (sabana): tronco delgado y copa plana y ancha.
    if (t.prop === 'acacia') { trunkG = new THREE.CylinderGeometry(0.07, 0.11, 1.1, 6); crownG = new THREE.SphereGeometry(0.62, 10, 6).scale(1.5, 0.3, 1.5); crownC = '#8fae3a'; trunkC = '#7a5030'; }
    // Roca (luna): piedras grises sueltas.
    if (t.prop === 'rock') { trunkG = new THREE.DodecahedronGeometry(0.38); crownG = new THREE.DodecahedronGeometry(0.18); crownC = '#c9c6d8'; trunkC = '#a7a3b8'; }
    if (t.crown) crownC = t.crown;
    if (t.trunk) trunkC = t.trunk;
    trunkG.translate(0, { cactus: 0.45, tower: 0.6, building: 0.85, flower: 0.45, lollipop: 0.5, wheat: 0.45, pyramid: 0.4, bamboo: 0.9, snowman: 0.36, acacia: 0.55, rock: 0.2 }[t.prop] ?? 0.4, 0);
    crownG.translate(0, { palm: 1.4, pine: 1.2, cactus: 0.9, crystal: 0.75, candle: 1.05, house: 1.1, tower: 1.6, building: 1.8, flower: 0.95, lollipop: 1.1, wheat: 1.2, pyramid: 0.9, coral: 0.95, mushroom: 0.7, bamboo: 1.8, snowman: 0.95, acacia: 1.15, rock: 0.25 }[t.prop] ?? 1.05, 0);
    const C = new THREE.Color();
    const trunks = new THREE.InstancedMesh(trunkG, this.toon({ color: this.desat(C.set(trunkC), alive).clone() }), n);
    const crowns = new THREE.InstancedMesh(crownG, this.toon({ color: this.desat(C.set(crownC), alive).clone() }), n);
    let tips;
    if (t.prop === 'pine') { const tg = new THREE.ConeGeometry(0.3, 0.6, 8); tg.translate(0, 1.72, 0); tips = new THREE.InstancedMesh(tg, this.toon({ color: '#ffffff' }), n); }
    const pos = geo.attributes.position;
    for (let k = 0; k < n; k++) {
      pv.fromBufferAttribute(pos, land[Math.floor(r() * land.length)]);
      q.setFromUnitVectors(UP, pv.clone().normalize());
      const s = 0.06 + r() * 0.035;
      m4.compose(pv, q, sc.set(s, s * (0.9 + r() * 0.3), s));
      trunks.setMatrixAt(k, m4); crowns.setMatrixAt(k, m4); tips?.setMatrixAt(k, m4);
    }
    group.add(trunks, crowns); if (tips) group.add(tips);
  }
  clouds(holder, n, seed, color = '#ffffff') {
    const r = rng(seed), orbit = new THREE.Group(), mat = this.toon({ color });
    for (let k = 0; k < n; k++) {
      const puff = new THREE.Group();
      for (let j = 0; j < 3; j++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.09 + (j % 2) * 0.03, 10, 8), mat); s.position.set((j - 1) * 0.1, j === 1 ? 0.03 : 0, 0); puff.add(s); }
      const a = r() * TAU, b = (r() - 0.5) * 1.6;
      puff.position.set(Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)).multiplyScalar(1.2);
      puff.lookAt(0, 0, 0);
      orbit.add(puff);
    }
    orbit.rotation.z = 0.3;
    holder.add(orbit);
    return orbit;
  }
  // Anillo tipo Saturno (algunos planetas, para que no se vean todos iguales).
  ring(holder, color, r) {
    const g = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.09, 6, 64), this.toon({ color }));
    const ol = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.125, 6, 64), new THREE.MeshBasicMaterial({ color: K, side: THREE.BackSide }));
    band.scale.z = ol.scale.z = 0.25;
    g.add(band, ol);
    g.rotation.set(Math.PI / 2 - 0.35, 0, 0.25 + r * 0.4);
    holder.add(g);
    return g;
  }
  orient(obj, dir, r) { obj.position.copy(dir).multiplyScalar(r); obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); }

  makePlanet(wd, spot, i) {
    const t = this.theme(wd), locked = t === LOCKED;
    // Los planetas del evento comparten semilla: es el mismo planeta con más o menos agua.
    const seed = locked ? 5 + (wd.w % 9) * 3 : wd.theme ? t.seed : t.seed + wd.w * 13;
    const alive = wd.theme ? 1 : wd.state === 'current' ? Math.max(0.2, wd.done / 10) : 1;
    const br = spot.s;
    const [bx, by] = this.at(spot.u, spot.c);
    const { g, land } = this.planetGeo(t, seed, locked ? 20 : 24);
    const holder = new THREE.Group(); holder.position.set(bx, by, 0); holder.scale.setScalar(br);
    const spin = new THREE.Group(); spin.rotation.x = 0.35; spin.rotation.y = rng(wd.w + 1)() * 6;
    const body = new THREE.Mesh(g, this.bandMat(t, alive));
    const outline = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: t.outline, side: THREE.BackSide }));
    outline.scale.setScalar(1.035);
    spin.add(body, outline);
    if (!locked) this.props(spin, t, seed, land, g, alive);
    if (t.volcano) {
      const v = new THREE.Group(), dir = new THREE.Vector3(-0.3, 0.9, -0.3).normalize();
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.2, 0.22, 12), this.toon({ color: '#4a3b52' })); cone.position.y = 0.1;
      const lava = new THREE.Mesh(new THREE.CircleGeometry(0.055, 12), new THREE.MeshBasicMaterial({ color: '#ffb340' })); lava.rotation.x = -Math.PI / 2; lava.position.y = 0.212;
      v.add(cone, lava); this.orient(v, dir, this.rAt(t, seed, dir) - 0.02); spin.add(v);
    }
    holder.add(spin);
    let orbit = null, ring = null;
    const rr = rng(wd.w * 31 + 5);
    if (!locked) orbit = this.clouds(holder, t.clouds ?? (wd.state === 'current' ? 3 : t.volcano ? 3 : 5), wd.w * 97 + 3, t.volcano ? '#8d8296' : '#ffffff');
    if (rr() < 0.3) ring = this.ring(holder, locked ? '#a7a3b8' : t.bands.at(-2)[1], rr());
    if (t.glow) holder.add(new THREE.Mesh(new THREE.SphereGeometry(1.16, 32, 24), this.glowMat(t.glow)));
    this.scene.add(holder);
    return { wd, t, seed, holder, spin, body, outline, orbit, ring, path: null, base: { x: bx, y: by, s: br }, sq: undefined, vel: 0, wig: 0, wv: 0, ph: i * 1.3 };
  }

  // ---------- guía entre planetas: una línea continua y suave por detrás (lo recorrido brilla) ----------
  buildTrail() {
    if (this.trail) { this.scene.remove(this.trail); this.trail.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); }); }
    const trail = new THREE.Group(), n = this.objs.length;
    if (n < 2) return;
    const pts = this.objs.map((o) => new THREE.Vector3(o.base.x, o.base.y, -0.9));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const lit = this.objs.findIndex((o) => o.wd.state !== 'done');
    const upTo = lit < 0 ? n - 1 : lit;
    const tube = (from, to, r, color, opacity) => {
      if (to <= from) return;
      const sub = [];
      for (let k = 0; k <= 60; k++) sub.push(curve.getPoint((from + ((to - from) * k) / 60) / (n - 1)));
      const c = new THREE.CatmullRomCurve3(sub);
      const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
      const ink = new THREE.MeshBasicMaterial({ color: K, transparent: true, opacity, side: THREE.BackSide });
      trail.add(new THREE.Mesh(new THREE.TubeGeometry(c, 120, r * 1.8, 8), ink), new THREE.Mesh(new THREE.TubeGeometry(c, 120, r, 8), m));
    };
    tube(0, upTo, 0.05, '#ffe7a3', 1);
    tube(upTo, n - 1, 0.035, '#a59be0', 0.8);
    this.trail = trail;
    this.scene.add(trail);
  }

  // ---------- camino de niveles (solo con zoom) ----------
  // Si el nivel acaba de ganarse, se dibuja como estaba antes (celebrate) y luego se anima el cambio.
  levelsFor(o) {
    const lv = o.wd.levels.map((x) => ({ ...x }));
    const c = this.celebrate;
    if (c && c.w === o.wd.w && !c.used && c.i < lv.length) {
      if (c.kind === 'cur') { lv[c.i] = { kind: 'cur', stars: 0 }; if (c.i + 1 < lv.length) lv[c.i + 1] = { ...lv[c.i + 1], kind: 'lock' }; }
      else lv[c.i] = { kind: 'done', stars: c.stars };
    }
    return lv;
  }
  buildPath(o) {
    if (o.path) return;
    const { t, seed, wd } = o, path = new THREE.Group();
    const pts = PATH_DIRS.map((d) => d.clone().multiplyScalar(Math.max(this.rAt(t, seed, d), 1) + 0.006));
    const curve = new THREE.CatmullRomCurve3(pts);
    path.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 220, 0.016, 6), this.toon({ color: t.path || '#fff3d6' })),
      new THREE.Mesh(new THREE.TubeGeometry(curve, 220, 0.024, 6), new THREE.MeshBasicMaterial({ color: K, side: THREE.BackSide })));
    if (wd.gift) this.giftBox(path, o, wd.levels.at(-1).kind === 'done');
    else this.castle(path, o, wd.levels[9].kind !== 'lock');
    o.sprites = []; o.badges = [];
    const lv = this.levelsFor(o);
    lv.forEach((l, i) => {
      const sp = this.badge(o, i, l);
      path.add(sp); o.sprites.push(sp); o.badges[i] = sp;
      if (l.kind === 'cur') this.addAvatar(o, path, i);
    });
    if (wd.secret?.open) this.secretNode(o, path, !wd.secret.fresh);
    path.visible = false;
    o.spin.add(path);
    o.path = path;
  }
  badge(o, i, l) {
    const d = this.dirOf(o, i), boss = i === this.lastOf(o), secret = i === 10;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.badgeTex(i + 1, l, boss, secret, o.wd.gift && o.wd.badgeIco), transparent: true }));
    const s = (l.kind === 'cur' ? 0.25 : 0.2) * (boss || secret ? 1.1 : 1);
    sp.center.set(0.5, 0.42);
    sp.userData = { s: [s, s * 1.4], level: i, kind: l.kind };
    sp.scale.set(s, s * 1.4, 1);
    sp.position.copy(d).multiplyScalar(this.rAt(o.t, o.seed, d) + (boss || secret ? 0.1 : 0.07));
    return sp;
  }
  retex(o, i, l) {
    const sp = o.badges[i];
    sp.material.map.dispose();
    sp.material.map = this.badgeTex(i + 1, l, i === this.lastOf(o), i === 10, o.wd.gift && o.wd.badgeIco);
    sp.material.needsUpdate = true;
    const s = (l.kind === 'cur' ? 0.25 : 0.2) * (i >= this.lastOf(o) ? 1.1 : 1);
    sp.userData.s = [s, s * 1.4]; sp.userData.kind = l.kind; sp.userData.pop = 1;
  }
  // El viajero del jugador flota sobre su nivel actual, siempre derecho y de tres cuartos hacia la cámara.
  addAvatar(o, path, i) {
    const t = makeTraveler(this.player.traveler, this.toon), av = new THREE.Group();
    av.add(t.obj);
    av.userData = { s: 0.2, dir: this.dirOf(o, i).clone(), hop: 0, tick: t.tick };
    av.scale.setScalar(0.2);
    path.add(av); o.avatar = av;
    this.placeAvatar(o);
  }
  placeAvatar(o, bob = 0) {
    const av = o.avatar, u = av.userData;
    av.parent.updateWorldMatrix(true, false);
    const q = av.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    av.position.copy(u.dir).multiplyScalar(this.rAt(o.t, o.seed, u.dir) + 0.06 + u.hop + bob).addScaledVector(up, 0.19);
    av.quaternion.copy(q).multiply(UPRIGHT);
  }
  // Nivel secreto: un rastro de puntitos desde el castillo hasta una insignia violeta.
  secretNode(o, path, shown) {
    const a = NODE_DIRS[9].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.16), b = NODE_DIRS[10];
    const dots = [], mat = this.toon({ color: '#d9b8ff' });
    for (let k = 1; k <= 5; k++) {
      const d = a.clone().lerp(b, k / 6).normalize();
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), mat);
      m.position.copy(d).multiplyScalar(this.rAt(o.t, o.seed, d) + 0.012);
      m.scale.setScalar(shown ? 1 : 0.0001);
      path.add(m); dots.push(m);
    }
    const c = this.celebrate, before = c && c.w === o.wd.w && c.i === 10 && !c.used;
    const l = before ? { kind: c.kind, stars: c.stars } : { kind: o.wd.secret.stars ? 'done' : 'cur', stars: o.wd.secret.stars || 0 };
    const sp = this.badge(o, 10, l);
    if (!shown) sp.scale.set(0.0001, 0.0001, 1);
    sp.userData.hidden = !shown;
    path.add(sp); o.sprites.push(sp); o.badges[10] = sp; o.secretDots = dots;
  }
  castle(path, o, lit) {
    const g = new THREE.Group(), wall = this.toon({ color: lit ? '#fff3d6' : '#cfc8e2' }), roof = this.toon({ color: lit ? '#ff5f7e' : '#a79ec4' });
    const ol = new THREE.MeshBasicMaterial({ color: K, side: THREE.BackSide });
    const add = (geo, mat, x, y) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, 0); const s = new THREE.Mesh(geo, ol); s.position.copy(m.position); s.scale.setScalar(1.12); g.add(m, s); };
    add(new THREE.BoxGeometry(0.5, 0.36, 0.34), wall, 0, 0.18);
    add(new THREE.CylinderGeometry(0.12, 0.12, 0.62, 10), wall, -0.3, 0.31);
    add(new THREE.CylinderGeometry(0.12, 0.12, 0.62, 10), wall, 0.3, 0.31);
    add(new THREE.ConeGeometry(0.17, 0.3, 10), roof, -0.3, 0.77);
    add(new THREE.ConeGeometry(0.17, 0.3, 10), roof, 0.3, 0.77);
    add(new THREE.ConeGeometry(0.22, 0.3, 4), roof, 0, 0.5);
    g.scale.setScalar(0.13);
    const d = NODE_DIRS[9].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.16);
    this.orient(g, d, this.rAt(o.t, o.seed, d) - 0.005);
    path.add(g);
  }
  // Evento: en vez del castillo, la caja de regalo del planeta (gris y abierta cuando ya se cobró).
  giftBox(path, o, got) {
    const g = new THREE.Group(), box = this.toon({ color: got ? '#cfc8e2' : '#47c27a' }), rib = this.toon({ color: got ? '#e9e4f2' : '#ffc83d' });
    const ol = new THREE.MeshBasicMaterial({ color: K, side: THREE.BackSide });
    const add = (geo, mat, x, y, z = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.z = rz; const s = new THREE.Mesh(geo, ol); s.position.copy(m.position); s.rotation.copy(m.rotation); s.scale.setScalar(1.12); g.add(m, s); };
    add(new THREE.BoxGeometry(0.5, 0.4, 0.5), box, 0, 0.2);
    add(new THREE.BoxGeometry(0.58, 0.14, 0.58), box, got ? 0.18 : 0, got ? 0.56 : 0.46, 0, got ? -0.5 : 0);
    add(new THREE.BoxGeometry(0.12, 0.42, 0.52), rib, 0, 0.2);
    if (!got) for (const s of [-1, 1]) add(new THREE.TorusGeometry(0.1, 0.04, 6, 12), rib, s * 0.1, 0.62, 0, s * 0.5);
    g.scale.setScalar(0.14);
    const d = NODE_DIRS[9].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.16);
    this.orient(g, d, this.rAt(o.t, o.seed, d) - 0.005);
    path.add(g);
  }
  // Insignia de nivel: estrellas ARRIBA del círculo para que no se pierdan contra el planeta.
  badgeTex(n, lv, boss, secret, gift) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 180;
    const g = c.getContext('2d'), cx = 64, cy = 110, R = 42;
    const col = { done: ['#4aa8de', '#2f86c0'], cur: ['#ff5f7e', '#d63d5f'], lock: ['#e9e4f2', '#c9c1dc'] }[lv.kind];
    const fill = secret ? ['#b36bff', '#8a3fe0'] : boss && lv.kind === 'done' ? ['#ffc83d', '#ec9a17'] : col;
    g.lineJoin = 'round';
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip();
    g.fillStyle = fill[1]; g.fillRect(0, 0, 128, 180);
    g.fillStyle = fill[0]; g.beginPath(); g.arc(cx - 3, cy - 7, R, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(cx - 16, cy - 22, 11, 6, -0.6, 0, 7); g.fill();
    g.restore();
    g.strokeStyle = K; g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
    const star = (sx, sy, R1, on, fillOn = '#ffc83d') => {
      g.beginPath();
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? R1 * 0.46 : R1; g.lineTo(sx + rr * Math.cos(a), sy + rr * Math.sin(a)); }
      g.closePath(); g.fillStyle = on ? fillOn : '#ddd3c0'; g.fill(); g.lineWidth = 5; g.strokeStyle = K; g.stroke();
    };
    // Evento: sin estrellas; el jefe lleva encima el ícono del evento (gift = imagen ya cargada; apagado si ya se ganó).
    if (gift) { if (boss && gift.complete) { g.save(); if (lv.kind === 'done') g.globalAlpha = 0.55; g.drawImage(gift, cx - 31, cy - 104, 62, 62); g.restore(); } }
    // Solo las estrellas ganadas (las apagadas no se distinguían contra el planeta), en arco y más grandes si son menos.
    else if (lv.kind === 'done') {
      const at = { 1: [[0, 38, 19]], 2: [[-17, 42, 17], [17, 42, 17]], 3: [[-30, 46, 15], [0, 36, 18], [30, 46, 15]] }[Math.min(3, lv.stars)] || [];
      for (const [x, y, r] of at) star(cx + x, y, r, true);
    }
    else if (boss) { // corona del jefe
      g.beginPath(); g.moveTo(cx - 24, cy - 34); g.lineTo(cx - 28, cy - 62); g.lineTo(cx - 12, cy - 46); g.lineTo(cx, cy - 68); g.lineTo(cx + 12, cy - 46); g.lineTo(cx + 28, cy - 62); g.lineTo(cx + 24, cy - 34); g.closePath();
      g.fillStyle = lv.kind === 'lock' ? '#d9d2ea' : '#ffc83d'; g.fill(); g.lineWidth = 6; g.stroke();
    }
    g.font = `${n > 9 ? 46 : 54}px "Lilita One"`; g.textAlign = 'center'; g.textBaseline = 'middle';
    // Secreto: estrella blanca mientras falta; dorada (y las 3 estrellitas arriba) cuando ya se hizo.
    if (secret) star(cx, cy + 2, 26, true, lv.kind === 'done' ? '#ffc83d' : '#fff6e6');
    else if (lv.paused) { g.fillStyle = '#fff'; g.strokeStyle = K; g.lineWidth = 4; for (const x of [-12, 4]) { g.beginPath(); g.roundRect(cx + x, cy - 16, 9, 32, 3); g.fill(); g.stroke(); } }
    else if (lv.kind === 'lock') { g.fillStyle = '#a79ec4'; g.fillText(String(n), cx, cy + 3); }
    else { g.lineWidth = 10; g.strokeStyle = K; g.strokeText(String(n), cx, cy + 3); g.fillStyle = '#fff'; g.fillText(String(n), cx, cy + 3); }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    return tex;
  }
  // ---------- etiquetas HTML (siguen a la cámara al recorrer la galaxia) ----------
  proj(x, y, z = 0) {
    const v = new THREE.Vector3(x, y, z).project(this.camera), r = this.host.getBoundingClientRect();
    return [((v.x + 1) / 2) * r.width, ((1 - v.y) / 2) * r.height];
  }
  chipHTML(wd) {
    if (wd.chip) return wd.chip;
    return { done: `<span class="chip info">${wd.secret?.stars ? icon('starSecret') : star(true)}${wd.stars + (wd.secret?.stars || 0)}/30</span>`, current: `<span class="chip info">${icon('flag')}${wd.done + 1}/10</span>`, gate: `<span class="chip info opening">${icon('gold')}${star(true)}${wd.need}</span>`, locked: `<span class="lk">${icon('lock')}</span>` }[wd.state];
  }
  drawLabels() {
    this.labelsEl.innerHTML = '';
    this.labels = this.objs.map((o) => {
      const el = document.createElement('div');
      el.className = 'plabel';
      el.innerHTML = this.chipHTML(o.wd);
      this.labelsEl.append(el);
      return el;
    });
    const cur = this.objs.find((o) => o.wd.state === 'current');
    this.pin = cur?.wd.pin ? { o: cur, from: null } : null;
    this.placeLabels(performance.now());
  }
  placeLabels(now) {
    this.setCam();
    this.objs.forEach((o, i) => {
      const p = o.holder.position, s = o.holder.scale.x;
      const [x, y] = this.proj(p.x, p.y - s * 1.06);
      this.labels[i].style.left = `${x}px`;
      this.labels[i].style.top = `${y}px`;
    });
    // El viajero flota sobre el planeta en el que vas; al abrir un mundo salta al nuevo en arco.
    const pin = this.pin;
    if (pin) {
      const top = (o) => [o.holder.position.x, o.holder.position.y + o.holder.scale.x * 1.05 + 0.5];
      let [x, y] = top(pin.o);
      if (pin.from) {
        const k = clamp((now - pin.t0) / 900, 0, 1), e = ease(k), [fx, fy] = top(pin.from);
        x = fx + (x - fx) * e; y = fy + (y - fy) * e + Math.sin(k * Math.PI) * 0.9;
        if (k >= 1) pin.from = null;
      }
      this.travG.position.set(x, y, 0.6);
    }
  }

  // Dónde se ve en pantalla un planeta o la insignia de un nivel (para el recorrido de primera vez).
  screenOf(kind, i) {
    if (kind === 'planet') { const o = this.objs[i]; return o && this.proj(o.holder.position.x, o.holder.position.y); }
    const sp = this.sel?.badges?.[i];
    if (!sp) return null;
    const p = sp.getWorldPosition(new THREE.Vector3());
    return this.proj(p.x, p.y, p.z);
  }

  // ---------- zoom ----------
  face(o) { return this.faceOf(o, Math.min(o.wd.done, this.lastOf(o))); }
  snap() { return this.objs.map((o) => ({ x: o.holder.position.x, y: o.holder.position.y, s: o.holder.scale.x, ry: o.spin.rotation.y, rx: o.spin.rotation.x })); }
  zoomTo(o, instant) {
    if (this.anim) return;
    this.sel = o; this.mode = 'planet'; o.sq = undefined; this.vel = 0;
    if (!o.hi) { o.hi = this.planetGeo(o.t, o.seed, 72).g; o.lo = o.body.geometry; }
    o.body.geometry = o.outline.geometry = o.hi;
    this.buildPath(o);
    const cel = this.celebrate;
    this.look = cel && cel.w === o.wd.w && !cel.used ? this.faceOf(o, cel.i) : this.face(o);
    const from = this.snap(), cx = this.camera.position.x, cy = this.camera.position.y;
    const to = this.objs.map((q) => {
      if (q === o) return { x: cx + this.zoom.x, y: cy + this.zoom.y, s: this.zoom.s, ry: Math.round(q.spin.rotation.y / TAU) * TAU + this.look, rx: 0 };
      const dx = q.base.x - o.base.x, dy = q.base.y - o.base.y;
      return { x: cx + dx * 2.4 + (this.port ? 0 : Math.sign(dx) * 6), y: cy + dy * 2.4 + (this.port ? Math.sign(dy) * 8 : 0), s: 0.0001, ry: q.spin.rotation.y, rx: 0.35 };
    });
    this.anim = { from, to, t0: performance.now(), dur: instant || reduced() ? 0 : 1250, dir: 1 };
    this.on.mode?.('planet', o.wd.w);
  }
  zoomOut() {
    if (!this.sel || this.anim) return Promise.resolve();
    this.mode = 'galaxy';
    this.anim = { from: this.snap(), to: this.objs.map((o) => ({ x: o.base.x, y: o.base.y, s: o.base.s, ry: o.spin.rotation.y, rx: 0.35 })), t0: performance.now(), dur: reduced() ? 0 : 1050, dir: -1 };
    this.on.mode?.('galaxy');
    return new Promise((ok) => (this.anim.done = ok));
  }
  applyAnim(now) {
    const a = this.anim, k = a.dur ? Math.min(1, (now - a.t0) / a.dur) : 1, e = ease(k);
    this.objs.forEach((o, i) => {
      const f = a.from[i], t = a.to[i];
      o.holder.position.set(f.x + (t.x - f.x) * e, f.y + (t.y - f.y) * e, 0);
      o.holder.scale.setScalar(f.s + (t.s - f.s) * e);
      o.spin.rotation.y = f.ry + (t.ry - f.ry) * e; o.spin.rotation.x = f.rx + (t.rx - f.rx) * e;
    });
    const sel = this.sel, show = a.dir > 0 ? Math.max(0, (k - 0.55) / 0.45) : Math.max(0, 1 - k / 0.35);
    if (sel?.path) { sel.path.visible = show > 0; for (const sp of sel.sprites) if (!sp.userData.hidden) sp.scale.set(sp.userData.s[0] * show, sp.userData.s[1] * show, 1); sel.avatar?.scale.setScalar(sel.avatar.userData.s * show); }
    this.pinShow = a.dir > 0 ? Math.max(0, 1 - k / 0.3) : Math.max(0, (k - 0.7) / 0.3);
    const cloudsOn = a.dir < 0 ? k > 0.6 : k < 0.25;
    if (sel?.orbit) sel.orbit.visible = cloudsOn;
    if (sel?.ring) sel.ring.visible = cloudsOn;
    // La guía entre planetas se desvanece al acercarse a uno.
    const tv = a.dir > 0 ? 1 - Math.min(1, k / 0.3) : Math.max(0, (k - 0.6) / 0.4);
    if (this.trail) { this.trail.visible = tv > 0; this.trail.traverse((m) => m.material && (m.material.opacity = (m.material.userData.op ??= m.material.opacity) * tv)); }
    if (k >= 1) {
      if (a.dir < 0) { if (sel?.path) sel.path.visible = false; if (sel?.lo) sel.body.geometry = sel.outline.geometry = sel.lo; this.sel = null; }
      this.anim = null;
      a.done?.();
    }
  }

  // ---------- animaciones de avance (las pide main.js) ----------
  tween(dur, fn) {
    if (reduced()) { fn(1); return Promise.resolve(); }
    return new Promise((ok) => this.tw.push({ t0: performance.now(), dur, fn, ok }));
  }
  // Al volver de ganar un nivel: las estrellas aparecen en su insignia, el avatar camina al siguiente
  // y la insignia del siguiente se enciende.
  async playCelebrate() {
    const c = this.celebrate, o = this.sel;
    if (!c || !o || o.wd.w !== c.w) return;
    c.used = true;
    const real = [...o.wd.levels, { kind: 'done', stars: o.wd.secret?.stars || 0 }];
    await new Promise((ok) => setTimeout(ok, 250));
    this.retex(o, c.i, real[c.i]);
    if (c.kind !== 'cur' || c.i >= this.lastOf(o) || !o.avatar) return;
    await new Promise((ok) => setTimeout(ok, 450));
    const a = this.dirOf(o, c.i).clone(), b = this.dirOf(o, c.i + 1).clone(), u = o.avatar.userData, l0 = this.look, l1 = this.faceOf(o, c.i + 1);
    await this.tween(900, (k) => {
      const e = ease(k);
      u.dir.copy(a).lerp(b, e).normalize();
      u.hop = Math.sin(k * Math.PI) * 0.12;
      this.look = l0 + (l1 - l0) * e;
      this.placeAvatar(o);
    });
    u.hop = 0;
    this.retex(o, c.i + 1, real[c.i + 1]);
  }
  // El nivel secreto se revela: el planeta gira hasta él, aparecen los puntitos y la insignia salta.
  async revealSecret() {
    const o = this.sel;
    if (!o?.badges?.[10]?.userData.hidden) return;
    const l0 = this.look, l1 = faceAt(10);
    await this.tween(900, (k) => (this.look = l0 + (l1 - l0) * ease(k)));
    for (const [k, d] of o.secretDots.entries()) { await new Promise((ok) => setTimeout(ok, 110)); d.scale.setScalar(1); d.userData.pop = 1; }
    const sp = o.badges[10];
    sp.userData.hidden = false;
    sp.userData.pop = 1;
    sp.scale.set(...sp.userData.s, 1);
    const p = sp.getWorldPosition(new THREE.Vector3());
    return this.proj(p.x, p.y, p.z);
  }
  // Abrir el mundo w: el candado tiembla y se rompe, el planeta se pinta de su color y el avatar salta hacia él.
  async unlock(w, wd) {
    const i = this.objs.findIndex((o) => o.wd.w === w);
    if (i < 0) return;
    const old = this.objs[i];
    const c0 = this.cam, c1 = this.camClamp(this.spots[i].u);
    await this.tween(700, (k) => (this.cam = c0 + (c1 - c0) * ease(k)));
    const lk = this.labels[i].querySelector('.lk, .chip');
    lk?.animate([{ rotate: '0deg' }, { rotate: '-14deg' }, { rotate: '12deg' }, { rotate: '-8deg' }, { rotate: '0deg' }], { duration: 500, iterations: 2 });
    old.wv = 10;
    await new Promise((ok) => setTimeout(ok, 900));
    // El candado se parte en dos mitades que salen volando.
    const lab = this.labels[i], ico = lab.querySelector('.ico');
    if (ico && !reduced()) {
      const r = ico.getBoundingClientRect(), h = this.labelsEl.getBoundingClientRect();
      [-1, 1].forEach((side) => {
        const half = ico.cloneNode(true);
        half.style.cssText = `position:absolute;left:${r.left - h.left}px;top:${r.top - h.top}px;width:${r.width}px;height:${r.height}px;clip-path:inset(0 ${side < 0 ? 50 : 0}% 0 ${side < 0 ? 0 : 50}%)`;
        this.labelsEl.append(half);
        half.animate([{ translate: '0 0', rotate: '0deg', opacity: 1 }, { translate: `${side * 26}px -20px`, rotate: `${side * 35}deg`, opacity: 1, offset: 0.35 }, { translate: `${side * 60}px 70px`, rotate: `${side * 90}deg`, opacity: 0 }], { duration: 800, easing: 'cubic-bezier(0.3, 0, 0.7, 1)' }).finished.then(() => half.remove());
      });
    }
    lab.style.visibility = 'hidden';
    // Destello y cambio de planeta.
    const flash = new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 16), new THREE.MeshBasicMaterial({ color: '#fff6d6', transparent: true, opacity: 0.95 }));
    flash.position.copy(old.holder.position); flash.scale.setScalar(old.base.s);
    this.scene.add(flash);
    this.spots[i].s = 0.95;
    const fresh = this.makePlanet(wd, this.spots[i], i);
    fresh.holder.scale.setScalar(0.0001);
    this.scene.remove(old.holder);
    this.objs[i] = fresh;
    await this.tween(650, (k) => {
      flash.scale.setScalar(old.base.s * (1 + k * 1.2));
      flash.material.opacity = 0.95 * (1 - k);
      const s = fresh.base.s * (k < 0.6 ? (k / 0.6) * 1.15 : 1.15 - ((k - 0.6) / 0.4) * 0.15);
      fresh.holder.scale.setScalar(Math.max(0.0001, s));
    });
    this.scene.remove(flash); flash.geometry.dispose(); flash.material.dispose();
    fresh.sq = 0.12; fresh.vel = 0;
    lab.style.visibility = '';
    this.labels[i].innerHTML = this.chipHTML(wd);
    this.labels[i].animate([{ scale: 0 }, { scale: 1.2, offset: 0.6 }, { scale: 1 }], { duration: 420, easing: 'ease-out' });
    this.buildTrail();
    // El avatar salta desde donde estaba (o desde el planeta anterior) hasta el mundo nuevo.
    if (!this.pin && wd.pin) this.pin = { o: this.objs[i - 1] || fresh };
    if (this.pin) { this.pin.from = this.pin.o; this.pin.o = fresh; this.pin.t0 = performance.now(); }
    await new Promise((ok) => setTimeout(ok, 950));
  }

  // ---------- tocar / arrastrar ----------
  bind() {
    const el = this.renderer.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    el.style.touchAction = 'none';
    const at = (e) => { const r = el.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, this.camera); };
    // Unidades 3D por píxel, en el eje del recorrido.
    const perPx = () => (this.port ? (2 * this.hh) / el.clientHeight : (2 * this.hw) / el.clientWidth);
    el.addEventListener('pointerdown', (e) => { this.down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now() }; this.vel = 0; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => {
      const d = this.down;
      // Durante el recorrido de primera vez no se arrastra ni se gira: solo se toca lo que sigue.
      if (!d || this.anim || this.guide) return;
      const dx = e.clientX - d.lx, dy = e.clientY - d.ly, dt = Math.max(1, performance.now() - d.t);
      d.lx = e.clientX; d.ly = e.clientY; d.t = performance.now();
      if (this.mode === 'planet') {
        // Giro libre por todo el camino (del nivel 1 al último visible).
        const last = this.sel?.badges?.[10] && !this.sel.badges[10].userData.hidden ? 10 : this.lastOf(this.sel);
        this.look = clamp(this.look + (dx / el.clientWidth) * (this.port ? 5 : 3.2), this.faceOf(this.sel, last) + 0.3, faceAt(0) + 0.05);
        return;
      }
      const du = (this.port ? -dy : -dx) * perPx();
      const lo = this.camClamp(-1e9), hi = this.camClamp(1e9);
      this.cam = clamp(this.cam + du, Math.min(lo, hi) - 0.8, Math.max(lo, hi) + 0.8);
      this.vel = (du / dt) * 1000;
    });
    el.addEventListener('pointerup', (e) => {
      const moved = this.down && Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 8; this.down = null;
      if (moved || this.anim || this.busy) return;
      this.vel = 0;
      at(e);
      if (this.mode === 'planet') {
        const hit = ray.intersectObjects(this.sel.sprites.filter((s) => s.userData.level != null && !s.userData.hidden))[0];
        if (hit && this.guide && !this.guide('level', hit.object.userData.level)) return;
        if (hit) { const sp = hit.object; sp.userData.pop = 1; this.on.level?.(this.sel.wd.w, sp.userData.level); }
        return;
      }
      const hit = ray.intersectObjects(this.objs.map((o) => o.body))[0];
      if (!hit) return;
      const o = this.objs.find((q) => q.body === hit.object);
      if (this.guide && !this.guide('planet', this.objs.indexOf(o))) return;
      if (o.wd.state === 'locked') { o.wv = 9; navigator.vibrate?.(20); this.on.locked?.(o.wd.w); return; }
      o.sq = 0.16; o.vel = 0;
      if (o.wd.state === 'gate') return this.on.planet?.(o.wd.w);
      setTimeout(() => this.zoomTo(o), 140);
    });
    el.addEventListener('wheel', (e) => {
      if (this.mode !== 'galaxy' || this.anim || this.guide) return;
      e.preventDefault();
      this.cam = this.camClamp(this.cam + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * perPx());
    }, { passive: false });
    this.onVis = () => (this.visible = !document.hidden);
    document.addEventListener('visibilitychange', this.onVis);
    this.visible = !document.hidden;
    this.onResize = () => {
      const W = this.host.clientWidth, H = this.host.clientHeight;
      if (!W || !H) return;
      if (W / H < 1 !== this.port) return requestAnimationFrame(() => !this.dead && this.on.relayout?.());
      this.renderer.setSize(W, H, false);
      this.fit(W, H);
      if (this.sel && this.mode === 'planet' && !this.anim) { const p = this.sel.holder; p.position.set(this.camera.position.x + this.zoom.x, this.camera.position.y + this.zoom.y, 0); p.scale.setScalar(this.zoom.s); }
    };
    // Se mide el propio mapa (no la ventana): al girar el teléfono, iOS avisa del cambio antes de
    // reacomodar la página y el tamaño leído aún era el viejo, así que el dibujo quedaba estirado.
    this.ro = new ResizeObserver(this.onResize);
    this.ro.observe(this.host);
  }

  frame(now) {
    if (this.dead) return;
    const dt = Math.min(0.05, (now - this.last) / 1000), calm = reduced(); this.last = now;
    if (this.visible && !mapCovered()) {
      if (this.anim) this.applyAnim(now);
      this.tw = this.tw.filter((t) => { const k = Math.min(1, (now - t.t0) / t.dur); t.fn(k); if (k >= 1) t.ok(); return k < 1; });
      // Inercia al soltar y regreso suave si se pasó de la orilla.
      if (this.mode === 'galaxy' && !this.down && !this.anim) {
        if (Math.abs(this.vel) > 0.01) { this.cam += this.vel * dt; this.vel *= Math.pow(0.04, dt); }
        const c = this.camClamp(this.cam);
        if (c !== this.cam) { this.cam += (c - this.cam) * Math.min(1, dt * 10); if (Math.abs(c - this.cam) < 0.001) this.cam = c; }
      }
      for (const o of this.objs) {
        if (!calm && this.mode === 'galaxy' && !this.anim) {
          o.spin.rotation.y += dt * (o.t === LOCKED ? 0.08 : 0.22);
          o.holder.position.y = o.base.y + Math.sin((now / 1000) * 0.9 + o.ph) * 0.05;
        }
        if (o.orbit && !calm) o.orbit.rotation.y += dt * 0.35;
        if (o.sq !== undefined) {
          o.vel += (-180 * o.sq - 9 * o.vel) * dt; o.sq += o.vel * dt;
          const s = o.base.s;
          if (!this.anim && this.mode === 'galaxy') o.holder.scale.set(s * (1 - o.sq * 0.5), s * (1 + o.sq), s * (1 - o.sq * 0.5));
          if (Math.abs(o.sq) < 0.001 && Math.abs(o.vel) < 0.01) o.sq = undefined;
        }
        if (o.wv || o.wig) { o.wv += (-260 * o.wig - 8 * o.wv) * dt; o.wig += o.wv * dt; o.holder.rotation.z = o.wig * 0.25; if (Math.abs(o.wig) < 0.001 && Math.abs(o.wv) < 0.01) { o.wig = o.wv = 0; o.holder.rotation.z = 0; } }
      }
      const sel = this.sel;
      if (this.mode === 'planet' && sel && !this.anim) {
        sel.spin.rotation.y = Math.round((sel.spin.rotation.y - this.look) / TAU) * TAU + this.look + (calm ? 0 : Math.sin(now / 2600) * 0.04);
        for (const sp of sel.sprites) {
          if (sp.userData.pop && !sp.userData.hidden) { sp.userData.pop = Math.max(0, sp.userData.pop - dt * 3); const k = 1 + Math.sin(sp.userData.pop * Math.PI) * 0.35; sp.scale.set(sp.userData.s[0] * k, sp.userData.s[1] * k, 1); }
        }
        for (const d of sel.secretDots || []) if (d.userData.pop) { d.userData.pop = Math.max(0, d.userData.pop - dt * 4); d.scale.setScalar(1 + Math.sin(d.userData.pop * Math.PI) * 0.8); }
      }
      if (this.mode === 'galaxy' || this.anim) this.placeLabels(now);
      else this.setCam();
      // Viajeros: el de la constelación se encoge al hacer zoom; el del camino se acomoda al girar el planeta.
      const show = this.anim ? this.pinShow ?? 1 : this.mode === 'galaxy' ? 1 : 0;
      this.travG.visible = !!this.pin && show > 0;
      if (this.travG.visible) { this.travG.scale.setScalar((this.port ? 0.78 : 0.66) * show); this.trav.tick(now / 1000); }
      if (sel?.avatar && sel.path?.visible) { this.placeAvatar(sel); sel.avatar.userData.tick(now / 1000); }
      this.renderer.render(this.scene, this.camera);
    }
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  dispose() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    document.removeEventListener('visibilitychange', this.onVis);
    this.ro.disconnect();
    this.scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => { m.map?.dispose(); m.dispose(); }); });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}

// ---------- Un planeta solo, para la postal (gira solo y se puede guardar como foto) ----------
// Usa el mismo dibujo que la galaxia (mismas funciones), en su propio lienzo.
export class PlanetView {
  // wd: { w, place } · host: caja donde va el lienzo.
  constructor(host, wd) {
    this.host = host;
    const W = host.clientWidth || 300, H = host.clientHeight || 300;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    this.renderer.setSize(W, H, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.append(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 50);
    this.camera.position.z = 1.9 / Math.tan((15 * Math.PI) / 180) / Math.min(1, W / H);
    this.scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x3a2470, 1.2));
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.6);
    sun.position.set(-6, 5, 7);
    this.scene.add(sun);
    const grad = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
    grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
    this.toon = (o) => new THREE.MeshToonMaterial({ gradientMap: grad, ...o });
    this.geo = {};
    const o = (this.o = this.makePlanet({ ...wd, state: 'done', done: 10 }, { u: 0, c: 0, s: 1 }, 0));
    o.holder.position.set(0, 0, 0);
    o.body.geometry = o.outline.geometry = this.planetGeo(o.t, o.seed, 72).g;
    // Gira solo, despacio (sin arrastre: así pesa menos).
    this.last = performance.now();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }
  at() { return [0, 0]; }
  frame(now) {
    if (this.dead) return;
    const dt = Math.min(0.05, (now - this.last) / 1000), o = this.o; this.last = now;
    o.spin.rotation.y += 0.35 * dt;
    if (o.orbit) o.orbit.rotation.y += dt * 0.35;
    // Siempre se dibuja: la postal se abre encima del álbum, que sí pausa el mapa (mapCovered).
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }
  // El lienzo con el planeta tal como se ve ahora (para la foto).
  snapshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement;
  }
  dispose() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.scene.traverse((q) => { q.geometry?.dispose(); [].concat(q.material || []).forEach((m) => { m.map?.dispose(); m.dispose(); }); });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
for (const k of ['theme', 'hAt', 'rAt', 'planetGeo', 'bandMat', 'glowMat', 'desat', 'props', 'clouds', 'ring', 'orient', 'makePlanet']) PlanetView.prototype[k] = Galaxy.prototype[k];

// ---------- Universo: las 52 constelaciones en fila, en 3D ----------
// Cada constelación es un grupo de 10 estrellas-planeta unidas por líneas, sobre su nebulosa de color.
// Se recorre arrastrando (de lado en horizontal, hacia abajo en vertical) y al tocar una se hace zoom hacia ella.
// regions: [{ r, name, hue, state: 'done'|'current'|'locked', stars, worlds: ['done'|'cur'|'lock' ×10], hues: [10] }]
// on: { open(r), relayout() } · start: constelación en la que empieza la cámara · fromZoom: entra haciendo zoom hacia atrás.
export class Universe {
  constructor(host, labelsEl, { regions, on, start = 0, fromZoom = false, traveler = null }) {
    this.host = host; this.labelsEl = labelsEl; this.regions = regions; this.on = on;
    const W = host.clientWidth, H = host.clientHeight;
    this.port = W / H < 1;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    this.renderer.setSize(W, H, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.append(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
    this.fit(W, H);
    this.scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x3a2470, 1.3));
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.4);
    sun.position.set(-6, 5, 7);
    this.scene.add(sun);
    const grad = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
    grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
    this.toon = (o) => new THREE.MeshToonMaterial({ gradientMap: grad, ...o });
    // Materiales compartidos (por color): 52 constelaciones × 10 mundos no crean 500 materiales.
    const mats = {};
    this.mat = (key, make) => (mats[key] ||= make());
    const sp = this.port ? 4 : 5.2;
    this.sp = sp;
    this.spots = regions.map((g, i) => ({ u: i * sp, c: Math.sin(i * 1.15) * (this.port ? 0.7 : 0.9) }));
    this.objs = regions.map((g, i) => this.cluster(g, this.spots[i]));
    this.trail();
    if (traveler) {
      this.trav = makeTraveler(traveler, this.toon);
      this.travG = new THREE.Group(); this.travG.add(this.trav.obj); this.travG.quaternion.copy(UPRIGHT);
      this.scene.add(this.travG);
    }
    this.drawLabels();
    this.cam = this.clampCam(this.spots[start]?.u ?? 0);
    this.zoomK = fromZoom && !reduced() ? 0 : 1; // 0 = pegado a la constelación, 1 = vista normal
    this.zoomAt = start;
    this.vel = 0; this.down = null; this.tw = [];
    this.bind();
    if (this.zoomK < 1) this.tween(900, (k) => (this.zoomK = ease(k)));
    this.last = performance.now();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }
  fit(W, H) {
    const aspect = W / H;
    if (this.port) { this.hw = 3.1; this.hh = this.hw / aspect; } else { this.hh = 4; this.hw = this.hh * aspect; }
    this.camera.aspect = aspect;
    this.z0 = this.hh / Math.tan((15 * Math.PI) / 180);
    this.camera.updateProjectionMatrix();
  }
  at(u, c) { return this.port ? [c - 0.35, -u - 0.5] : [u, c - 0.75]; }
  half() { return this.port ? this.hh : this.hw; }
  clampCam(u) {
    const a = this.spots[0].u, b = this.spots.at(-1).u, H = this.half();
    const lo = a + H * (this.port ? 0.42 : 0.45), hi = b - H * (this.port ? 0.3 : 0.45);
    return lo > hi ? (a + b) / 2 : clamp(u, lo, hi);
  }
  nebulaTex(hue, locked) {
    const k = `neb${hue}${locked}`;
    if (texCache[k]) return texCache[k];
    const c = document.createElement('canvas'), S = 128, g = c.getContext('2d');
    c.width = c.height = S;
    const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    const col = locked ? '140 136 160' : `${hue} 80% 62%`;
    const css = (a) => (locked ? `rgb(${col} / ${a})` : `hsl(${col} / ${a})`);
    gr.addColorStop(0, css(0.55)); gr.addColorStop(0.5, css(0.22)); gr.addColorStop(1, css(0));
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return (texCache[k] = t);
  }
  cluster(reg, spot) {
    const g = new THREE.Group(), [x, y] = this.at(spot.u, spot.c), locked = reg.state === 'locked';
    g.position.set(x, y, 0);
    const neb = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.nebulaTex(Math.round(reg.hue), locked), transparent: true, depthWrite: false }));
    neb.scale.set(4.8, 4.8, 1);
    neb.position.z = -0.6;
    g.add(neb);
    // Forma de la constelación (fija por número): un paseo al azar que no se sale del círculo.
    const r = rng(reg.r * 131 + 17), pts = [];
    let p = new THREE.Vector3((r() - 0.5) * 1.2, (r() - 0.5) * 1.2, 0), a = r() * TAU;
    for (let i = 0; i < 10; i++) {
      pts.push(p.clone());
      a += (r() - 0.5) * 2.2;
      p.add(new THREE.Vector3(Math.cos(a), Math.sin(a), 0).multiplyScalar(0.42 + r() * 0.16));
      if (p.length() > 1.35) { p.multiplyScalar(0.8); a += Math.PI * 0.7; }
      p.z = (r() - 0.5) * 1.1;
    }
    // Ladeada y girando sobre sí misma: así se nota que es 3D.
    const spin = new THREE.Group();
    spin.rotation.x = 0.45;
    g.add(spin);
    for (let i = 0; i < 9; i++) {
      const lit = reg.worlds[i] === 'done' && reg.worlds[i + 1] !== 'lock';
      const c = new THREE.LineCurve3(pts[i], pts[i + 1]);
      spin.add(new THREE.Mesh(new THREE.TubeGeometry(c, 1, lit ? 0.03 : 0.02, 5), this.mat(`line${lit}`, () => new THREE.MeshBasicMaterial({ color: lit ? '#ffe7a3' : '#a59be0', transparent: true, opacity: lit ? 1 : 0.6 }))));
    }
    const ball = new THREE.SphereGeometry(1, 16, 12);
    pts.forEach((q, i) => {
      const st = reg.worlds[i], s = st === 'lock' ? 0.1 : st === 'cur' ? 0.22 : 0.17;
      const col = st === 'lock' ? '#8f8aa6' : st === 'cur' ? '#ffffff' : `hsl(${reg.hues[i]}, 70%, 62%)`;
      const m = new THREE.Mesh(ball, this.mat(col, () => this.toon({ color: col })));
      const o = new THREE.Mesh(ball, this.mat('ink', () => new THREE.MeshBasicMaterial({ color: K, side: THREE.BackSide })));
      m.scale.setScalar(s); o.scale.setScalar(s * 1.3);
      m.position.copy(q); o.position.copy(q);
      spin.add(o, m);
    });
    const hit = new THREE.Mesh(new THREE.SphereGeometry(1.75, 12, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    g.add(hit);
    this.scene.add(g);
    return { reg, g, spin, hit, ph: reg.r * 0.9, base: { x, y }, u: spot.u, sq: 0, sv: 0 };
  }
  trail() {
    const pts = this.objs.map((o) => new THREE.Vector3(o.base.x, o.base.y, -0.9));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), n = pts.length;
    const upTo = Math.max(0, this.regions.findIndex((g) => g.state !== 'done'));
    const tube = (from, to, r, color, op) => {
      if (to <= from) return;
      const sub = [];
      for (let k = 0; k <= 40 * (to - from); k++) sub.push(curve.getPoint((from + k / 40) / (n - 1)));
      const c = new THREE.CatmullRomCurve3(sub);
      this.scene.add(new THREE.Mesh(new THREE.TubeGeometry(c, 30 * (to - from), r * 1.8, 6), new THREE.MeshBasicMaterial({ color: K, transparent: true, opacity: op, side: THREE.BackSide })),
        new THREE.Mesh(new THREE.TubeGeometry(c, 30 * (to - from), r, 6), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op })));
    };
    tube(0, upTo, 0.05, '#ffe7a3', 1);
    tube(upTo, n - 1, 0.035, '#a59be0', 0.7);
  }
  drawLabels() {
    this.labelsEl.innerHTML = '';
    this.labels = this.objs.map(({ reg }) => {
      const el = document.createElement('div');
      el.className = `ulabel ${reg.state}`;
      el.innerHTML = `<b class="outl">${reg.state === 'locked' ? icon('lock') : ''}${reg.name}</b><small class="info">${reg.r + 1} de ${this.regions.length}${reg.state === 'locked' ? '' : ` · ${star(true)}${reg.stars}/300`}</small>`;
      this.labelsEl.append(el);
      return el;
    });
    const cur = this.objs.find((o) => o.reg.state === 'current');
    this.pin = cur && this.travG ? { o: cur } : null;
    if (this.travG) this.travG.visible = !!this.pin;
  }
  proj(x, y, z = 0) {
    const v = new THREE.Vector3(x, y, z).project(this.camera), r = this.host.getBoundingClientRect();
    return [((v.x + 1) / 2) * r.width, ((1 - v.y) / 2) * r.height];
  }
  setCam() {
    // Zoom: la cámara se acerca a la constelación zoomAt (k = 0 pegada, 1 normal).
    const k = this.zoomK, t = this.objs[this.zoomAt]?.base || { x: 0, y: 0 };
    const nx = this.port ? 0 : this.cam, ny = this.port ? -this.cam : 0;
    this.camera.position.set(t.x + (nx - t.x) * k, t.y + (ny - t.y) * k, this.z0 * (0.12 + 0.88 * k));
    this.camera.updateMatrixWorld();
  }
  placeLabels() {
    this.setCam();
    const fade = Math.max(0, (this.zoomK - 0.6) / 0.4);
    this.labelsEl.style.opacity = fade;
    this.objs.forEach((o, i) => {
      const [x, y] = this.proj(o.g.position.x, o.g.position.y - 1.6);
      this.labels[i].style.left = `${x}px`;
      this.labels[i].style.top = `${y}px`;
    });
    if (this.pin) {
      const p = this.pin.o.g.position;
      if (this.port) this.travG.position.set(p.x - 1.3, p.y + 0.9, 0.5); else this.travG.position.set(p.x, p.y + 1.65, 0.5);
      this.travG.scale.setScalar(0.85 * Math.max(0.0001, fade));
      this.trav.tick(performance.now() / 1000);
    }
  }
  tween(dur, fn) {
    if (reduced()) { fn(1); return Promise.resolve(); }
    return new Promise((ok) => this.tw.push({ t0: performance.now(), dur, fn, ok }));
  }
  screenOf(kind, i) { const o = this.objs[i]; return o && this.proj(o.g.position.x, o.g.position.y); }
  // Zoom hacia una constelación (antes de entrar a ella).
  async zoomInto(i) {
    this.busy = true;
    this.zoomAt = i;
    const c0 = this.cam, c1 = this.clampCam(this.spots[i].u);
    this.objs[i].sq = 0.15;
    await this.tween(750, (k) => { const e = ease(k); this.cam = c0 + (c1 - c0) * Math.min(1, e * 1.5); this.zoomK = 1 - e; });
  }
  bind() {
    const el = this.renderer.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    el.style.touchAction = 'none';
    const perPx = () => (this.port ? (2 * this.hh) / el.clientHeight : (2 * this.hw) / el.clientWidth);
    el.addEventListener('pointerdown', (e) => { this.down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now() }; this.vel = 0; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => {
      const d = this.down;
      if (!d || this.busy || this.guide) return;
      const dx = e.clientX - d.lx, dy = e.clientY - d.ly, dt = Math.max(1, performance.now() - d.t);
      d.lx = e.clientX; d.ly = e.clientY; d.t = performance.now();
      const du = (this.port ? -dy : -dx) * perPx();
      this.cam = clamp(this.cam + du, this.clampCam(-1e9) - 0.8, this.clampCam(1e9) + 0.8);
      this.vel = (du / dt) * 1000;
    });
    el.addEventListener('pointerup', (e) => {
      const moved = this.down && Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 8;
      this.down = null;
      if (moved || this.busy) return;
      this.vel = 0;
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, this.camera);
      const hit = ray.intersectObjects(this.objs.map((o) => o.hit))[0];
      if (!hit) return;
      const i = this.objs.findIndex((o) => o.hit === hit.object);
      if (this.guide && !this.guide('region', i)) return;
      this.on.open?.(i);
    });
    el.addEventListener('wheel', (e) => {
      if (this.busy || this.guide) return;
      e.preventDefault();
      this.cam = this.clampCam(this.cam + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * perPx());
    }, { passive: false });
    this.onResize = () => {
      const W = this.host.clientWidth, H = this.host.clientHeight;
      if (!W || !H) return;
      if (W / H < 1 !== this.port) return requestAnimationFrame(() => !this.dead && this.on.relayout?.());
      this.renderer.setSize(W, H, false);
      this.fit(W, H);
    };
    // Se mide el propio mapa (no la ventana): al girar el teléfono, iOS avisa del cambio antes de
    // reacomodar la página y el tamaño leído aún era el viejo, así que el dibujo quedaba estirado.
    this.ro = new ResizeObserver(this.onResize);
    this.ro.observe(this.host);
  }
  frame(now) {
    if (this.dead) return;
    const dt = Math.min(0.05, (now - this.last) / 1000), calm = reduced(); this.last = now;
    if (!document.hidden && !mapCovered()) {
      this.tw = this.tw.filter((t) => { const k = Math.min(1, (now - t.t0) / t.dur); t.fn(k); if (k >= 1) t.ok(); return k < 1; });
      if (!this.down && !this.busy) {
        if (Math.abs(this.vel) > 0.01) { this.cam += this.vel * dt; this.vel *= Math.pow(0.04, dt); }
        const c = this.clampCam(this.cam);
        if (c !== this.cam) this.cam += (c - this.cam) * Math.min(1, dt * 10);
      }
      // Solo se mueven y dibujan las constelaciones cerca de la cámara (las demás quedan quietas y ocultas).
      const far = this.half() + this.sp * 1.2;
      for (const o of this.objs) {
        o.g.visible = Math.abs(o.u - this.cam) < far || this.zoomK < 1;
        this.labels[o.reg.r].style.visibility = o.g.visible ? '' : 'hidden';
        if (!o.g.visible) continue;
        if (!calm) { o.spin.rotation.y += dt * 0.25 * (o.reg.r % 2 ? 1 : -1); o.g.position.y = o.base.y + Math.sin(now / 1100 + o.ph) * 0.06; }
        if (o.sq || o.sv) { o.sv += (-180 * o.sq - 9 * o.sv) * dt; o.sq += o.sv * dt; o.g.scale.setScalar(1 + o.sq); if (Math.abs(o.sq) < 0.001 && Math.abs(o.sv) < 0.01) { o.sq = o.sv = 0; o.g.scale.setScalar(1); } }
      }
      this.placeLabels();
      this.renderer.render(this.scene, this.camera);
    }
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }
  dispose() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => m.dispose()); });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
