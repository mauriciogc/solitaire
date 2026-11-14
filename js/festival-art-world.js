// Fiestas de Europa (nivel 381) y de Oriente (nivel 431) (14 nov 2026, pedido del usuario). Mismo trazo y mismas
// piezas que festival-art.js, que las junta con las de México y América: sus colores (WORLD_LOOK, igual que
// FESTIVAL_LOOK) y sus dibujos (iconos, marcos del avatar y reversos). Lo que se juega está en FESTIVALS de events.js.

// ---------- Datos ----------
// sky: [noche, medio, abajo, brillo 1, brillo 2] · frame: [fondo, banda] · tc: título [arriba, abajo, tinta, orilla].
export const WORLD_LOOK = {
  uphellyaa: { ico: 'cascovikingo', deco: 'antorchavik', sky: ['#0a0e24', '#1a1a3a', '#3a1a1a', '#ff9c3d', '#8fd6ff'], frame: ['#f2f4fa', '#c22c3c'], tc: ['#ff8a6a', '#e8434f', '#6a1010', '#ffc83d'],
    names: { space: 'Noche de antorchas', frame: 'Escudos vikingos', ring: 'Escuditos vikingos', back: 'Barco vikingo', avatar: ['Vikinguito/Vikinguita', 'Con su casco de cuernos'], title: 'Jefe vikingo', traveler: ['Barco vikingo', 'Navega entre las estrellas'] } },
  patricio: { ico: 'trebolsuerte', deco: 'olladeoro', sky: ['#06200e', '#0e3a1a', '#1a5a2a', '#ffd84a', '#7fd36a'], frame: ['#f2fff2', '#2f9e5c'], tc: ['#9be08a', '#3f9a46', '#0e3a1a', '#ffd84a'],
    names: { space: 'Cielo esmeralda', frame: 'Tréboles', ring: 'Tréboles de la suerte', back: 'Olla de oro', avatar: ['Duendecito/Duendecita', 'Con su sombrero verde'], title: 'Con suerte', traveler: ['Olla de oro', 'Vuela sobre su arcoíris'] } },
  fallas: { ico: 'ninot', deco: 'peineta', sky: ['#1a0a14', '#3a1420', '#6a2a1a', '#ffc83d', '#ff5f7e'], frame: ['#fff6ec', '#e2753a'], tc: ['#ffc27a', '#ff9c3d', '#7a3010', '#4aa8de'],
    names: { space: 'Noche de las Fallas', frame: 'Fallera', ring: 'Ninots de cartón', back: 'Ninot gigante', avatar: ['Ninotito', 'Muñeco de cartón sonriente'], title: 'Fallero de corazón', traveler: ['Ninot volador', 'Gigante de cartón'] } },
  santjordi: { ico: 'rosaroja', deco: 'librojordi', sky: ['#1a0610', '#3a0e1e', '#5a1a2a', '#ff5f7e', '#ffd84a'], frame: ['#fff4f4', '#c22c3c'], tc: ['#ff8a8f', '#e8434f', '#6a0a1a', '#ffd84a'],
    names: { space: 'Noche de rosas y libros', frame: 'Rosas', ring: 'Rosal', back: 'Dragón de la rosa', avatar: ['Dragoncito de Sant Jordi', 'Con una rosa en la mano'], title: 'Gran lector', traveler: ['Libro volador', 'Pasa sus hojas al volar'] } },
  koningsdag: { ico: 'coronanaranja', deco: 'molino', sky: ['#0a1430', '#1a2a4a', '#3a2a2a', '#ff9c3d', '#8fd6ff'], frame: ['#fff6ec', '#ff9c3d'], tc: ['#ffc27a', '#ff9c3d', '#7a3a06', '#4aa8de'],
    names: { space: 'Noche naranja', frame: 'Molinitos', ring: 'Zuequitos', back: 'Molinos de viento', avatar: ['Holandesito/Holandesita', 'Con su gorrito y sus zuecos'], title: 'Todo naranja', traveler: ['Zueco volador', 'Un zueco con alas de molino'] } },
  midsommar: { ico: 'coronaflores', deco: 'fresa', sky: ['#14204a', '#2a4a7a', '#4a7aa8', '#ffe27a', '#ff9cc8'], frame: ['#fffdf0', '#ffc83d'], tc: ['#fff08a', '#ffc83d', '#7a5a06', '#4aa8de'],
    names: { space: 'Sol de medianoche', frame: 'Flores del verano', ring: 'Coronitas de flores', back: 'Palo de flores', avatar: ['Corona de flores', 'Flores del verano en la cabeza'], title: 'Noche más clara', traveler: ['Palo de flores', 'Gira con sus guirnaldas'] } },
  globosbristol: { ico: 'globoaire', deco: 'nubeglobo', sky: ['#0a2040', '#1a3a6a', '#3a6aa0', '#ff9c5b', '#ffd84a'], frame: ['#f0f8ff', '#4aa8de'], tc: ['#8fd6ff', '#4aa8de', '#1f4a7a', '#ff5f7e'],
    names: { space: 'Cielo de globos', frame: 'Globos de aire', ring: 'Canastitas', back: 'Globo aerostático', avatar: ['Globín', 'Un globo de colores'], title: 'Aeronauta', traveler: ['Racimo de globos', 'Tres globos y una canasta'] } },
  alfombraflor: { ico: 'begonia', deco: 'petalosflor', sky: ['#1a0a1a', '#3a1430', '#5a2040', '#ff7ab8', '#ffc83d'], frame: ['#fff6fa', '#e8559a'], tc: ['#ffb8d6', '#ff7ab8', '#7a1a4a', '#ffc83d'],
    names: { space: 'Noche de flores', frame: 'Mosaico de flores', ring: 'Begonias', back: 'Alfombra de pétalos', avatar: ['Begonito/Begonita', 'Con su gorro de pétalos'], title: 'Florista', traveler: ['Regadera voladora', 'Riega flores al pasar'] } },
  regata: { ico: 'gondola', deco: 'remo', sky: ['#061430', '#0e2a52', '#1a4a6e', '#ffd27a', '#5fd1f0'], frame: ['#eefaff', '#2f86c0'], tc: ['#8fd6ff', '#4aa8de', '#1f3a6a', '#e8434f'],
    names: { space: 'Noche en la laguna', frame: 'Canales', ring: 'Gondolitas', back: 'Góndolas', avatar: ['Gondolerito/Gondolerita', 'Con su sombrero de paja'], title: 'Gran gondolero', traveler: ['Góndola voladora', 'Rema entre las estrellas'] } },
  vacas: { ico: 'cencerro', deco: 'edelweiss', sky: ['#0a1a2a', '#14304a', '#2a5a5a', '#fffdf7', '#9be08a'], frame: ['#f4fff4', '#3f9a46'], tc: ['#9be08a', '#5fbf5a', '#1f4a1a', '#ffd84a'],
    names: { space: 'Noche en los Alpes', frame: 'Flores alpinas', ring: 'Cencerros', back: 'Vaquitas con flores', avatar: ['Vaquita alpina', 'Con su corona de flores y su cencerro'], title: 'Pastor de los Alpes', traveler: ['Cencerro volador', 'Suena tolón tolón'] } },
  harbin: { ico: 'castillohielo', deco: 'cristalhielo', sky: ['#06102a', '#0e2048', '#1a3a6a', '#5ff0ff', '#ff7ab8'], frame: ['#f0faff', '#5fb6e0'], tc: ['#bfe8ff', '#5fb6e0', '#14406a', '#ff7ab8'],
    names: { space: 'Noche de hielo', frame: 'Escarcha', ring: 'Castillitos de hielo', back: 'Palacio de hielo', avatar: ['Muñequito de hielo', 'Brilla como cristal'], title: 'Escultor de hielo', traveler: ['Trineo de hielo', 'Se desliza por el cielo'] } },
  pongal: { ico: 'ollapongal', deco: 'kolam', sky: ['#1a0a06', '#3a1a0a', '#5a2a10', '#ffc83d', '#ff5f7e'], frame: ['#fff6e8', '#d2694e'], tc: ['#ffc27a', '#ff9c3d', '#6a2a06', '#ff5f7e'],
    names: { space: 'Noche de cosecha', frame: 'Kolams', ring: 'Cañitas de azúcar', back: 'Olla que se desborda', avatar: ['Ollita de Pongal', 'Desbordada de arroz dulce'], title: 'Buena cosecha', traveler: ['Olla voladora', 'Echa espuma de arroz'] } },
  songkran: { ico: 'pistolagua', deco: 'jazmin', sky: ['#04203a', '#0a3a5a', '#14607a', '#5ff0ff', '#ffd84a'], frame: ['#eefcff', '#2fa8d8'], tc: ['#8fe8ff', '#2fa8d8', '#0a3a5a', '#ff5f7e'],
    names: { space: 'Noche de agua', frame: 'Chapuzones', ring: 'Gotas de agua', back: 'Elefantes de agua', avatar: ['Elefantito', 'Echa agua con su trompa'], title: 'Todo remojado', traveler: ['Elefante volador', 'Lanza chorritos de agua'] } },
  kodomo: { ico: 'koinobori', deco: 'kabuto', sky: ['#06142e', '#10284e', '#1f4a7a', '#ff5f7e', '#ffd84a'], frame: ['#f0f6ff', '#2f6aa8'], tc: ['#8fd6ff', '#4aa8de', '#14306a', '#e8434f'],
    names: { space: 'Cielo de carpas', frame: 'Koinobori', ring: 'Carpitas', back: 'Carpas al viento', avatar: ['Carpita', 'Una carpa de tela que ondea'], title: 'Fuerte como carpa', traveler: ['Koinobori', 'Nada en el viento'] } },
  pahiyas: { ico: 'kiping', deco: 'salakot', sky: ['#0a1a0e', '#143a1a', '#2a5a2a', '#ff5f7e', '#ffd84a'], frame: ['#f6fff0', '#5fbf5a'], tc: ['#b8f08a', '#5fbf5a', '#1f4a1a', '#ff5f7e'],
    names: { space: 'Noche de Pahiyas', frame: 'Kipings', ring: 'Hojitas de arroz', back: 'Casitas de colores', avatar: ['Niño del salakot/Niña del salakot', 'Con su sombrero de palma'], title: 'Gran decorador', traveler: ['Casita de colores', 'Adornada de hojas de arroz'] } },
  tanabata: { ico: 'tanzaku', deco: 'estrellasdeseo', sky: ['#0a0628', '#1a1048', '#2a1a6a', '#ff9cc8', '#8fd6ff'], frame: ['#f8f2ff', '#8a5cf0'], tc: ['#c9a6ff', '#8a5cf0', '#2a1060', '#ff9cc8'],
    names: { space: 'Río de estrellas', frame: 'Papelitos de deseos', ring: 'Deseitos', back: 'Bambú de los deseos', avatar: ['Estrellita de los deseos', 'Cumple un deseo'], title: 'Pide un deseo', traveler: ['Rama de bambú', 'Lleva deseos colgando'] } },
  naadam: { ico: 'yurta', deco: 'arcomongol', sky: ['#0a1430', '#1a2a4a', '#4a3a2a', '#ffc83d', '#4aa8de'], frame: ['#fffaf0', '#e89a17'], tc: ['#ffe58a', '#ffc83d', '#6a4a06', '#4aa8de'],
    names: { space: 'Noche en la estepa', frame: 'Nudos mongoles', ring: 'Arquitos', back: 'Yurtas', avatar: ['Jinetito/Jinetita', 'Con su gorro de la estepa'], title: 'Gran arquero', traveler: ['Yurta voladora', 'Una casita redonda con humito'] } },
  lodo: { ico: 'charco', deco: 'cubetalodo', sky: ['#140c06', '#2a1a0e', '#4a2e1a', '#4aa8de', '#ffc83d'], frame: ['#fbf4ec', '#a8764a'], tc: ['#e8c49a', '#c9925a', '#4a2a10', '#4aa8de'],
    names: { space: 'Noche de lodo', frame: 'Salpicaduras', ring: 'Charquitos', back: 'Guerra de lodo', avatar: ['Lodito', 'Lleno de lodo y feliz'], title: 'Rey del chapoteo', traveler: ['Cubeta voladora', 'Salpica lodo al volar'] } },
  otono: { ico: 'pastelluna', deco: 'conejoluna', sky: ['#0a0a24', '#1a1a40', '#2a2050', '#fff3c4', '#ff9c3d'], frame: ['#fffbea', '#d49a4a'], tc: ['#ffe58a', '#e8a35a', '#5a3a06', '#e8434f'],
    names: { space: 'Luna llena de otoño', frame: 'Pastelitos de luna', ring: 'Lunitas', back: 'Conejo de jade', avatar: ['Conejito de la luna', 'Vive en la luna llena'], title: 'Guardián de la luna', traveler: ['Farol de conejo', 'Brilla como la luna'] } },
  monos: { ico: 'monito', deco: 'platanos', sky: ['#140e04', '#2a2008', '#4a3a10', '#ffd84a', '#7fd36a'], frame: ['#fffbe8', '#c9a24a'], tc: ['#ffe58a', '#ffc83d', '#5a4006', '#7fd36a'],
    names: { space: 'Noche del banquete', frame: 'Frutitas', ring: 'Platanitos', back: 'Monitos traviesos', avatar: ['Changuito', 'Travieso y comelón'], title: 'Gran comelón', traveler: ['Plátano volador', 'Se pela al volar'] } },
  hornbill: { ico: 'calao', deco: 'tamborcalao', sky: ['#0a1a0e', '#14301a', '#2a3a1a', '#ffc83d', '#e8434f'], frame: ['#fff6ee', '#c22c3c'], tc: ['#ff8a8f', '#e8434f', '#5a0a10', '#ffc83d'],
    names: { space: 'Noche del cálao', frame: 'Chales tejidos', ring: 'Plumas de cálao', back: 'Cálaos', avatar: ['Calaíto', 'Con su gran pico de colores'], title: 'Gran tamborilero', traveler: ['Cálao volador', 'Aletea con su pico grande'] } },
};

// ---------- Dibujos ----------
// k: las piezas de festival-art.js (tshape, círculo, elipse, línea con tinta, punto, brillo, puntos en círculo, estrella,
// y las de marcos y reversos).
export function worldArt(k) {
  const { T, C, E, L, dot, shine, pts, starPath, K, band, stitch, put, many, studs, twinkle, back, stripes, dots } = k;
  const rot = (a, cx, cy, s) => `<g transform="rotate(${a} ${cx} ${cy})">${s}</g>`;
  const f1 = (n) => +n.toFixed(1);
  // Florecita de 5 pétalos redondos con su centro.
  const flower = (x, y, r, c, sh, mid = '#ffd23d') => pts(x, y, r * 0.75, 5).map(([px, py]) => T(C(f1(px), f1(py), f1(r * 0.55)), c, sh, '', 1.2)).join('') + T(C(x, y, f1(r * 0.42)), mid, '#ec9a17', '', 1);
  // Pétalos alargados alrededor de (x, y), cada uno mirando hacia afuera.
  const petals = (x, y, r, n, rx, ry, c, sh, w = 1.5, off = -90) => pts(x, y, r, n, off).map(([px, py, a]) => rot(((a * 180) / Math.PI + 90).toFixed(0), f1(px), f1(py), T(E(f1(px), f1(py), rx, ry), c, sh, '', w))).join('');
  // Gota con la punta arriba (centro de la parte redonda en x, y).
  const drop = (x, y, r) => `M${x} ${f1(y - r * 2)}c${f1(r * 0.9)} ${f1(r * 1.1)} ${r} ${f1(r * 1.7)} ${r} ${f1(r * 2)}a${r} ${r} 0 0 1-${f1(r * 2)} 0c0-.3.1-.9 ${r}-${f1(r * 2)}z`;
  const blush = (x, y) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#ff8a8f" opacity=".6"/>`;
  const smile = (x, y, w = 3.4) => `<path d="M${x - w / 2} ${y}q${w / 2} ${w * 0.9} ${w} 0" stroke="${K}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  const st = (cx, cy, R, c, w = 1.8) => `<path d="${starPath(cx, cy, R, R * 0.43)}" fill="${c}" stroke="${K}" stroke-width="${w}" stroke-linejoin="round"/>`;

  const icons = {
    // Up Helly Aa: casco vikingo con sus cuernos y la antorcha del desfile.
    cascovikingo: () => T('M9.4 15.4C4.4 14.6 1.6 9.4 3.2 4.4c1.2 3.8 3.8 6 7.4 6.8z', '#fff6e6', '#e6d8b8', '', 1.8) + T('M22.6 15.4c5-.8 7.8-6 6.2-11-1.2 3.8-3.8 6-7.4 6.8z', '#fff6e6', '#e6d8b8', '', 1.8)
      + T('M6 22c0-7.4 4.4-12.4 10-12.4S26 14.6 26 22z', '#b8c0d8', '#8f98b8', `<path d="M16 9.6V22" stroke="#d8deec" stroke-width="2"/>${shine(11, 14)}`, 2)
      + T('M4.6 20.6h22.8v4.6H4.6z', '#ffc83d', '#ec9a17', [8, 12, 20, 24].map((x) => dot(x, 22.9, 1, '#a86a1a')).join(''), 1.8)
      + T('M14.4 25.2h3.2v4.4L16 31l-1.6-1.4z', '#b8c0d8', '#8f98b8', '', 1.4),
    antorchavik: () => `<circle cx="16" cy="9" r="7.4" fill="#ffd84a" opacity=".3"/>`
      + T('M16 1.6c4 4 6.4 7 6.4 9.6a6.4 6.4 0 0 1-12.8 0c0-2.6 2.4-5.6 6.4-9.6z', '#ff9c3d', '#e2753a', `<path d="M16 6.4c2 2.2 3 3.8 3 5.2a3 3 0 0 1-6 0c0-1.4 1-3 3-5.2z" fill="#ffe27a"/>`, 1.8)
      + T('M13.6 15.4h4.8l-1.2 15h-2.4z', '#a86a3a', '#83501a', '', 1.6)
      + T('M12.4 13.4h7.2V17h-7.2z', '#8f88c0', '#6e66a3', `<path d="M12.4 15.2h7.2" stroke="#b8b0e0" stroke-width="1"/>`, 1.6),
    // San Patricio: trébol de tres hojas y la olla de oro.
    trebolsuerte: () => L('M16 16q1.4 8 5 14', '#3f9a46', 2.2)
      + [0, 120, 240].map((a) => rot(a, 16, 16, T('M16 16c-5.4-2.6-8-6-8-9 0-2.4 1.8-4 4-4 1.8 0 3.2 1 4 2.6.8-1.6 2.2-2.6 4-2.6 2.2 0 4 1.6 4 4 0 3-2.6 6.4-8 9z', '#5fbf5a', '#3f9a46', '<path d="M16 14.6V7.4" stroke="#8fdc6a" stroke-width="1.2"/>', 1.6))).join(''),
    olladeoro: () => [[10.6, 10.4], [21.4, 10.4], [16, 8]].map(([x, y]) => T(C(x, y, 3.6), '#ffd84a', '#ec9a17', `<path d="M${x} ${y - 1.6}v3.2" stroke="#c98a1a" stroke-width="1.2"/>`, 1.4)).join('')
      + T('M8.6 27.4h3v3.2h-3zM20.4 27.4h3v3.2h-3z', '#3a3550', '#2a2540', '', 1.2)
      + T('M6.4 15h19.2l-.6 8.4a6 6 0 0 1-6 5.6h-6a6 6 0 0 1-6-5.6z', '#3a3550', '#2a2540', shine(10.4, 19), 2)
      + T('M4.4 12.6h23.2v3.6H4.4z', '#4a4560', '#3a3550', '', 1.8),
    // Las Fallas: el ninot (muñeco gigante de cartón) en su base y la peineta de la fallera.
    ninot: () => T('M7 25.6h18l-1.6 4.8H8.6z', '#ff9c3d', '#e2753a', '<path d="M8 28h16" stroke="#ffd27a" stroke-width="1.2"/>', 1.8)
      + T('M9.6 26c0-4.4 2.8-7.4 6.4-7.4s6.4 3 6.4 7.4z', '#4aa8de', '#2f86c0', dot(16, 22.4, 1, '#ffd23d') + dot(16, 24.6, 1, '#ffd23d'), 1.8)
      + T(C(16, 12.4, 7.6), '#ffe0c4', '#f0c0a0', `${dot(13.2, 11.4, 1.3)}${dot(18.8, 11.4, 1.3)}${smile(16, 15.2, 6.4)}<circle cx="16" cy="13.2" r="1.6" fill="#ff7a6a"/>${blush(11, 14.8)}${blush(21, 14.8)}`, 2)
      + T('M7.6 7.8c2-4 14.8-4 16.8 0l-2 1.6H9.6z', '#e8434f', '#c22c3c', '', 1.6)
      + T('M11 7.4c0-3 2.4-5.4 5-5.4s5 2.4 5 5.4z', '#e8434f', '#c22c3c', '<path d="M11 6.2h10" stroke="#ffc83d" stroke-width="1.4"/>', 1.6),
    peineta: () => T('M7 19.6h18l-1 8.4H8z', '#ffd84a', '#ec9a17', [10, 13, 16, 19, 22].map((x) => `<path d="M${x} 20.4v7.6" stroke="#a8701a" stroke-width="1.2"/>`).join(''), 1.6)
      + T('M5 20.6C5 12.2 10 6.4 16 6.4s11 5.8 11 14.2z', '#ffd84a', '#ec9a17', [[11, 15.4], [16, 12], [21, 15.4], [13.4, 18.4], [18.6, 18.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#c98a1a"/>`).join('') + shine(9.4, 13), 2)
      + flower(23.6, 8.4, 4, '#e8434f', '#c22c3c'),
    // Sant Jordi: la rosa roja y el libro abierto.
    rosaroja: () => L('M16 30V17', '#3f9a46', 2.2)
      + T('M16 25c-4.6.4-8-2-8.6-5.4 3.8-.6 7.4 1.4 8.6 5.4z', '#5fbf5a', '#3f9a46', '', 1.4) + T('M16 22.2c3.6-.2 6.6-2.4 7-5.4-3.2-.2-6 1.8-7 5.4z', '#5fbf5a', '#3f9a46', '', 1.4)
      + T('M8.6 9.4c0-4 3.2-6.6 7.4-6.6s7.4 2.6 7.4 6.6c0 5-3.4 8.6-7.4 8.6s-7.4-3.6-7.4-8.6z', '#e8434f', '#c22c3c', '<path d="M16 6.4c-2.6 0-4 1.6-3.4 3.6.6 2 4 2.4 5.4.6 1.2-1.6 0-3.2-1.6-3.2M10 10q2 6 6 6t6-6" stroke="#a01a2a" stroke-width="1.2" fill="none" stroke-linecap="round"/>', 2)
      + T('M10.6 15.4 16 19l5.4-3.6-1.4 3.4L16 21l-4-2.2z', '#5fbf5a', '#3f9a46', '', 1.2),
    librojordi: () => T('M1.6 11.6v16.6c5.4-1.8 10.4-1 14.4 1.6 4-2.6 9-3.4 14.4-1.6V11.6z', '#e8434f', '#c22c3c', '', 1.8)
      + T('M3 8.6c4.8-1.6 9.6-1 13 1.8v17c-3.4-2.4-8.2-3-13-1.6z', '#fffdf7', '#e6e0d6', '<path d="M5.6 13.4q4-1 8 .8M5.6 17q4-1 8 .8M5.6 20.6q4-1 8 .8" stroke="#b8b0d0" stroke-width="1.1" fill="none"/>', 1.6)
      + T('M29 8.6c-4.8-1.6-9.6-1-13 1.8v17c3.4-2.4 8.2-3 13-1.6z', '#fffdf7', '#e6e0d6', '<path d="M26.4 13.4q-4-1-8 .8M26.4 17q-4-1-8 .8M26.4 20.6q-4-1-8 .8" stroke="#b8b0d0" stroke-width="1.1" fill="none"/>', 1.6)
      + T('M19.6 9.4h3v8.6l-1.5-1.4-1.5 1.4z', '#ffc83d', '#ec9a17', '', 1.2),
    // Día del Rey: la corona naranja y el molino de viento.
    coronanaranja: () => T('M4.4 23.4 3 9.4l7.4 6.2L16 6.4l5.6 9.2L29 9.4l-1.4 14z', '#ff9c3d', '#e2753a', '', 2)
      + [[3, 9.4], [16, 6.4], [29, 9.4]].map(([x, y]) => T(C(x, y, 2.2), '#ffc83d', '#ec9a17', '', 1.4)).join('')
      + T('M4 22.4h24v5.2H4z', '#ffc83d', '#ec9a17', `${dot(9, 25, 1.6, '#4aa8de')}${dot(16, 25, 1.8, '#e8434f')}${dot(23, 25, 1.6, '#4aa8de')}`, 1.8),
    molino: () => T('M10.6 30.4 12.8 14h6.4l2.2 16.4z', '#c98a4b', '#a86a3a', `<path d="M14.4 30.4v-4.4a1.6 1.6 0 0 1 3.2 0v4.4" fill="#5a3218"/>${dot(16, 19.6, 1.4, '#8fd6ff')}`, 2)
      + T('M11.6 14.6 16 9.4l4.4 5.2z', '#e8434f', '#c22c3c', '', 1.6)
      + [45, 135, 225, 315].map((a) => rot(a, 16, 12, T('M15.3 1.4h1.4V12h-1.4z', '#a86a3a', '#83501a', '', 1) + T('M16.7 1.4h3.6V10h-3.6z', '#fffdf7', '#e6e0d6', '<path d="M16.7 4.2h3.6M16.7 7h3.6M18.5 1.4V10" stroke="#c9b8a0" stroke-width=".8"/>', 1.3))).join('')
      + T(C(16, 12, 1.8), '#ffc83d', '#ec9a17', '', 1.2),
    // Midsommar: la corona de flores y la fresa.
    coronaflores: () => `<ellipse cx="16" cy="19" rx="12.4" ry="6.4" fill="none" stroke="${K}" stroke-width="5"/><ellipse cx="16" cy="19" rx="12.4" ry="6.4" fill="none" stroke="#5fbf5a" stroke-width="2.6"/>`
      + [[4.6, 16.6, '#ff5f7e', '#e0407e'], [9.4, 13.4, '#ffd84a', '#ec9a17'], [16, 12.6, '#b36bff', '#8a4ad8'], [22.6, 13.4, '#fffdf7', '#e6e0d6'], [27.4, 16.6, '#4aa8de', '#2f86c0'], [7.4, 23.6, '#ffd84a', '#ec9a17'], [16, 25.4, '#ff5f7e', '#e0407e'], [24.6, 23.6, '#b36bff', '#8a4ad8']].map(([x, y, c, s]) => flower(x, y, 3.2, c, s)).join(''),
    fresa: () => T('M16 29.4C9.4 26 5.4 20 6 13.4c.6-3 4.6-4.4 10-4.4s9.4 1.4 10 4.4c.6 6.6-3.4 12.6-10 16z', '#e8434f', '#c22c3c', [[11, 14], [16, 13], [21, 14], [10, 19], [15, 18], [20, 19], [13, 23], [18, 23], [16, 27]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx=".7" ry="1" fill="#ffe27a"/>`).join('') + shine(10, 15), 2)
      + T('M8.4 10.4l3-4 2.4 2.6L16 4.4l2.2 4.6 2.4-2.6 3 4-7.6 2z', '#5fbf5a', '#3f9a46', '', 1.6) + L('M16 5V1.6', '#3f9a46', 1.4),
    // Fiesta de los Globos: el globo aerostático de rayas y una nube.
    globoaire: () => L('M10.4 21.6l2.2 4.4M21.6 21.6l-2.2 4.4', '#a86a3a', 1)
      + T('M16 1.6C9 1.6 4.6 6.6 4.6 12.2c0 4.4 3.2 7.8 6.4 10.2h10c3.2-2.4 6.4-5.8 6.4-10.2C27.4 6.6 23 1.6 16 1.6z', '#ff5f7e', '#e0407e', `<path d="M16 1.6c-3.6 3-5 7-5 10.6s1.6 7.6 3 10.2h4c1.4-2.6 3-6.6 3-10.2S19.6 4.6 16 1.6z" fill="#ffd84a"/><path d="M16 1.6c-1.4 3-2 7-2 10.6s.6 7.6 1 10.2h2c.4-2.6 1-6.6 1-10.2s-.6-7.6-2-10.6z" fill="#4aa8de"/><path d="M5 12h22" stroke="#fff" stroke-width="1.2" opacity=".6"/>${shine(9, 7)}`, 2)
      + T('M11.6 25.6h8.8l-1 4.8h-6.8z', '#c98a4b', '#a86a3a', '<path d="M12 27.8h8" stroke="#83501a" stroke-width="1"/>', 1.6),
    nubeglobo: () => T('M7.4 25a5.6 5.6 0 0 1-.6-11.2 7.4 7.4 0 0 1 14-3.2 6.4 6.4 0 0 1 4.2 14.4z', '#fffdf7', '#d8e2f4', shine(10, 17), 2),
    // Alfombra de Flores: la begonia y unos pétalos sueltos.
    begonia: () => T('M4 27c1-5 5-7 9-6-1 4-5 7-9 6z', '#5fbf5a', '#3f9a46', '', 1.4) + T('M28 27c-1-5-5-7-9-6 1 4 5 7 9 6z', '#5fbf5a', '#3f9a46', '', 1.4)
      + petals(16, 14.4, 6.2, 4, 5.6, 6.4, '#ff6a5a', '#e0443a', 1.6, -45)
      + T(C(16, 14.4, 4), '#ffd23d', '#f0a81a', [[14.6, 13.4], [17.4, 13.4], [16, 15.8], [14.4, 15.6], [17.6, 15.6]].map(([x, y]) => dot(x, y, 0.8, '#d8901a')).join(''), 1.4),
    petalosflor: () => [[9, 10, '#ff5f7e', '#e0407e', -30], [22, 12, '#ffc83d', '#ec9a17', 40], [15, 24, '#ff9c3d', '#e2753a', 10]].map(([x, y, c, s, a]) => rot(a, x, y, T(`M${x} ${y - 7}c4 3 5 7 0 11-5-4-4-8 0-11z`, c, s, '', 1.6))).join(''),
    // Regata Histórica: la góndola sobre el agua y su remo.
    gondola: () => L('M2 27.4q3.4-2 6.8 0t6.8 0 6.8 0 6.8 0', '#4aa8de', 1.8)
      + T('M13 16.4h7.4V13H13z', '#e8434f', '#c22c3c', '', 1.4)
      + T('M1.6 16c6 6.4 18 6.4 25.4-1.6l2.2-1c.6 3.4-.6 6.4-3.4 8.6-7.4 5.4-18 4.2-24.2-3z', '#2a2540', '#1a1530', '<path d="M4 18.4q11 6 22-2.4" stroke="#ffc83d" stroke-width="1.2" fill="none"/>', 2)
      + T('M26 5h2.8v9.4H26z', '#e6e0f0', '#b8b0d0', '<path d="M26 7.4h2.8M26 9.6h2.8M26 11.8h2.8" stroke="#8f88c0" stroke-width=".9"/>', 1.4),
    remo: () => rot(-35, 16, 16, T('M15 1.6h2v18h-2z', '#c98a4b', '#a86a3a', '', 1.4) + T(E(16, 24.6, 3.8, 6.4), '#c98a4b', '#a86a3a', '<path d="M16 19v11" stroke="#a86a3a" stroke-width="1"/>', 1.8) + T('M14.4 1.4h3.2v3h-3.2z', '#e8434f', '#c22c3c', '', 1.2)),
    // Bajada de las vacas: el cencerro con su correa y la flor edelweiss.
    cencerro: () => L('M11.4 9.4c0-6.4 9.2-6.4 9.2 0', '#e8434f', 2.6) + T(C(16, 27, 2.4), '#8f88c0', '#6e66a3', '', 1.4)
      + T('M9.4 8.6h13.2l3.2 17.4H6.2z', '#d8b04a', '#b8902a', `<path d="M7.6 21h16.8" stroke="#a8802a" stroke-width="1.4"/>${shine(11.4, 12)}`, 2)
      + petals(16, 15, 2.2, 6, 1.2, 2.2, '#fffdf7', '#e0e6ea', 1) + T(C(16, 15, 1.2), '#e6e8a0', '#c8cc6a', '', 0.8),
    edelweiss: () => petals(16, 16, 7.4, 8, 2.6, 5.6, '#fffdf7', '#e0e6ea', 1.4)
      + T(C(16, 16, 4.2), '#e6e8a0', '#c8cc6a', [[14.6, 14.8], [17.4, 14.8], [16, 17.6], [14.4, 17.4], [17.6, 17.4], [16, 14.2]].map(([x, y]) => dot(x, y, 0.9, '#a8ac3a')).join(''), 1.4),
    // Festival de Hielo: el castillo de hielo y un cristal.
    castillohielo: () => T('M3.6 30.4V11.6H10v18.8z', '#bfe8ff', '#8fcbea', dot(6.8, 17, 1.1, '#5fb6e0'), 1.8) + T('M22 30.4V11.6h6.4v18.8z', '#bfe8ff', '#8fcbea', dot(25.2, 17, 1.1, '#5fb6e0'), 1.8)
      + T('M3 12 6.8 3.4l3.8 8.6z', '#e6f7ff', '#bfe0f0', '', 1.6) + T('M21.4 12l3.8-8.6L29 12z', '#e6f7ff', '#bfe0f0', '', 1.6)
      + T('M9 30.4V15.6h14v14.8z', '#d6f2ff', '#a8d8f0', `<path d="M13.6 30.4V25a2.4 2.4 0 0 1 4.8 0v5.4" fill="#5fb6e0"/>${dot(12, 19, 1.2, '#5fb6e0')}${dot(20, 19, 1.2, '#5fb6e0')}${shine(11, 17.4)}`, 1.8)
      + T('M8.4 16 16 6.4l7.6 9.6z', '#e6f7ff', '#bfe0f0', '', 1.8) + T(C(16, 5.6, 1.8), '#ff7ab8', '#e0559a', '', 1.1),
    cristalhielo: () => `<circle cx="16" cy="16" r="13" fill="#bfe8ff" opacity=".25"/>` + T('M16 2l9 6v16l-9 6-9-6V8z', '#bfe8ff', '#8fcbea', `<path d="M7 8l9 5.4L25 8M16 13.4V30" stroke="#e6f7ff" stroke-width="1.2" fill="none"/>${shine(11, 11)}`, 2),
    // Pongal: la olla de barro que se desborda de arroz dulce y el kolam de colores.
    ollapongal: () => T('M6.6 18c0-3.4 4.2-5.6 9.4-5.6s9.4 2.2 9.4 5.6c0 7-4.2 11.6-9.4 11.6S6.6 25 6.6 18z', '#d2694e', '#a84a36', `<path d="M7.4 20.4q8.6 3 17.2 0" stroke="#fffdf7" stroke-width="1.4" fill="none" stroke-dasharray="1.6 1.6"/>${dot(12, 24, 1, '#ffd23d')}${dot(16, 25, 1, '#ffd23d')}${dot(20, 24, 1, '#ffd23d')}`, 2)
      + T('M7.6 13.6c-.6-2.4 1.4-4 3.4-3.4.6-2.6 3.6-3.6 5.4-1.8 1.8-1.8 5.2-.8 5.6 1.8 2.2-.4 3.8 1.4 2.8 3.4-2.4 1.6-14.6 1.6-17.2 0z', '#fffdf7', '#e6e0d6', '', 1.8)
      + T('M9.4 13.6c0 2.4-1.4 3.4-1.4 5a.8.8 0 0 0 1.6 0c0-1.2-.2-2.6 1.4-4.6z', '#fffdf7', '#e6e0d6', '', 1.2),
    kolam: () => T(C(16, 16, 13.4), '#ffc83d', '#ec9a17', '', 2)
      + pts(16, 16, 7.6, 8).map(([x, y], i) => T(C(f1(x), f1(y), 3), i % 2 ? '#ff5f7e' : '#4aa8de', i % 2 ? '#e0407e' : '#2f86c0', '', 1.2)).join('')
      + T(C(16, 16, 4.4), '#fffdf7', '#e6e0d6', dot(16, 16, 1.4, '#e8434f'), 1.4)
      + pts(16, 16, 11.6, 8, -67.5).map(([x, y]) => dot(f1(x), f1(y), 0.9, '#fffdf7')).join(''),
    // Songkran: la pistola de agua y la flor de jazmín.
    pistolagua: () => T(C(17, 8.4, 4.6), '#ffc83d', '#ec9a17', shine(15.6, 6.8), 1.8) + L('M15.4 18.4q-.4 3 1.6 4', '#ff9c3d', 1.4)
      + T('M17 16h6.4L21 28.4h-5.4z', '#ff5f7e', '#e0407e', '', 1.8)
      + T('M5 11.6h22.4a2 2 0 0 1 2 2v2.8a2 2 0 0 1-2 2H5z', '#4aa8de', '#2f86c0', '<path d="M8 15h14" stroke="#8fd6ff" stroke-width="1.4"/>', 1.8)
      + T('M2 12.8h3.4v4.4H2z', '#ff9c3d', '#e2753a', '', 1.4)
      + [[4, 24, 2.2], [9, 28, 1.6]].map(([x, y, r]) => T(drop(x, y, r), '#8fd6ff', '#4aa8de', '', 1.2)).join(''),
    jazmin: () => T('M21.4 27c0-2.6 2-4.6 4.6-4.6 0 2.6-2 4.6-4.6 4.6z', '#5fbf5a', '#3f9a46', '', 1.2) + T('M6 27.4c.4-2.6 2.8-4.2 5.4-3.6-.4 2.6-2.8 4.2-5.4 3.6z', '#5fbf5a', '#3f9a46', '', 1.2)
      + petals(16, 14.6, 5.8, 5, 3.6, 5.4, '#fffdf7', '#e6e8f0') + T(C(16, 14.6, 2.6), '#ffe27a', '#ec9a17', '', 1.2),
    // Kodomo no Hi: la carpa de tela (koinobori) y el casco de papel (kabuto).
    koinobori: () => T('M3 16c0-5 4-8.4 9.4-8.4h10.4l6.6-4L27 16l2.4 12.4-6.6-4H12.4C7 24.4 3 21 3 16z', '#e8434f', '#c22c3c', `<path d="M11.6 9q-2 7 0 14" stroke="#ffd0d4" stroke-width="1.4" fill="none"/>${[[15, 12], [19.4, 12], [17.2, 16.2], [21.6, 16.2], [15, 20.4], [19.4, 20.4]].map(([x, y]) => `<path d="M${x - 2} ${y}a2 2 0 0 0 4 0" stroke="#ffb0b6" stroke-width="1.2" fill="none"/>`).join('')}<path d="M24 9.6 27 16l-3 6.4" stroke="#fffdf7" stroke-width="1.2" fill="none"/>`, 2)
      + T(C(8, 13.4, 3.2), '#fffdf7', '#e6e0d6', dot(8.6, 13.4, 1.6), 1.4) + `<ellipse cx="3.4" cy="16" rx="1.2" ry="3" fill="#ffc83d" stroke="${K}" stroke-width="1.4"/>`,
    kabuto: () => L('M10 12.6Q5 7 7.6 2M22 12.6Q27 7 24.4 2', '#ffc83d', 2.2)
      + T('M3.4 21.6 16 5.4l12.6 16.2z', '#4aa8de', '#2f86c0', '<path d="M16 5.4v16.2M9.6 13.4 16 21.6l6.4-8.2" stroke="#8fd6ff" stroke-width="1.2" fill="none"/>', 2)
      + T('M2 21h28l-3.4 6.4H5.4z', '#2f6aa8', '#1f4a7a', '<path d="M16 21v6.4" stroke="#4aa8de" stroke-width="1.2"/>', 1.8),
    // Pahiyas: hojitas de arroz de colores (kiping) y el sombrero salakot.
    kiping: () => [['#ffd84a', '#ec9a17', -32], ['#7fd36a', '#56b83a', 32], ['#ff5f7e', '#e0407e', 0]].map(([c, s, a]) => rot(a, 16, 28, T('M16 28C9.6 22 9 11 16 3c7 8 6.4 19 0 25z', c, s, '<path d="M16 26V6M16 12l-3-3M16 12l3-3M16 18l-3.4-3M16 18l3.4-3" stroke="#fff" stroke-width="1" opacity=".7" fill="none"/>', 1.6))).join(''),
    salakot: () => L('M7 21.4q9 8 18 0', '#a86a3a', 1)
      + T('M1.6 20.6 16 6.4l14.4 14.2c-4.6 2.8-24.2 2.8-28.8 0z', '#e8c48a', '#c9a46a', '<path d="M16 6.4 8 20.6M16 6.4l-3.6 16M16 6.4v16.4M16 6.4l3.6 16M16 6.4l8 14.2" stroke="#b8925a" stroke-width="1"/><path d="M6 17.4q10 3 20 0" stroke="#e8434f" stroke-width="1.6" fill="none"/>', 2)
      + T(C(16, 6, 2.2), '#a86a3a', '#83501a', '', 1.4),
    // Tanabata: la rama de bambú con papelitos de deseos y las dos estrellas que se encuentran.
    tanzaku: () => T('M14.4 1.6h3.2v28.8h-3.2z', '#7fd36a', '#56b83a', '<path d="M14.4 9h3.2M14.4 17h3.2M14.4 25h3.2" stroke="#3f9a46" stroke-width="1.2"/>', 1.6)
      + rot(-30, 12, 8, T(E(9, 8, 4.6, 1.8), '#5fbf5a', '#3f9a46', '', 1.2)) + rot(30, 20, 14, T(E(23, 14, 4.6, 1.8), '#5fbf5a', '#3f9a46', '', 1.2))
      + [[5.4, 12, '#ff9cc8', '#ff7ab8'], [21.6, 17, '#ffe27a', '#ffc83d'], [6.6, 20.6, '#8fd6ff', '#4aa8de']].map(([x, y, c, s]) => L(`M${x + 2} ${y}v-2`, '#fffdf7', 0.8) + T(`M${x} ${y}h4v9.4h-4z`, c, s, `<path d="M${x + 1} ${y + 3}h2M${x + 1} ${y + 5}h2" stroke="${K}" stroke-width=".8" opacity=".5"/>`, 1.3)).join(''),
    estrellasdeseo: () => [[6, 26], [9, 22.4], [12.6, 19.6], [16, 16], [19.4, 12.4], [23, 9.6], [26, 6]].map(([x, y], i) => dot(x, y, 0.9 + (i % 2) * 0.4, '#c9a6ff')).join('')
      + st(8.4, 9.4, 7.4, '#ff9cc8') + st(23.6, 22.6, 7.4, '#8fd6ff') + dot(8.4, 9.8, 1.6, '#fff') + dot(23.6, 23, 1.6, '#fff'),
    // Naadam: la yurta y el arco con su flecha.
    yurta: () => T('M4 18.4h24v11.2H4z', '#fffdf7', '#e6dcc8', '<path d="M4 21.4h24" stroke="#e8434f" stroke-width="1.8"/><path d="M4 23.4l2-1.4 2 1.4 2-1.4 2 1.4 2-1.4 2 1.4 2-1.4 2 1.4 2-1.4 2 1.4 2-1.4 2 1.4" stroke="#4aa8de" stroke-width="1" fill="none"/>', 2)
      + T('M13 29.6v-7.4h6v7.4z', '#ff9c3d', '#e2753a', '<path d="M16 22.2v7.4" stroke="#c9502a" stroke-width="1"/>', 1.4)
      + T('M2.6 19C6 11.4 10.6 8 16 8s10 3.4 13.4 11z', '#fffdf7', '#e6dcc8', '<path d="M8 15.4q8-4 16 0" stroke="#e8434f" stroke-width="1.4" fill="none"/>', 2)
      + T('M13.4 8.4 16 4.4l2.6 4z', '#e8434f', '#c22c3c', '', 1.4),
    arcomongol: () => L('M9.4 3.4v25.2', '#fffdf7', 1) + L('M9.4 3.4q15 12.6 0 25.2', '#a86a3a', 2.6) + L('M5 16h20', '#c98a4b', 1.6)
      + T('M24.6 12.8 30.4 16l-5.8 3.2z', '#8f88c0', '#6e66a3', '', 1.4) + T('M2.4 12.6 6.4 16l-4 3.4 1.6-3.4z', '#e8434f', '#c22c3c', '', 1.2),
    // Festival del Lodo: el charco que salpica y la cubeta llena de lodo.
    charco: () => T(E(16, 24, 13.4, 5.4), '#a8764a', '#7a4a2a', `<ellipse cx="16" cy="24" rx="7" ry="2.4" fill="none" stroke="#c99a6a" stroke-width="1.2"/>${shine(9, 22.6)}`, 2)
      + [[7, 13, 2.2, -24], [16, 9, 2.8, 0], [25, 13, 2.2, 24]].map(([x, y, r, a]) => rot(a, x, y, T(drop(x, y, r), '#a8764a', '#7a4a2a', '', 1.4))).join('')
      + L('M10.4 18.6l-1.2-2.2M21.6 18.6l1.2-2.2M16 17.6v-2.4', '#a8764a', 1.2),
    cubetalodo: () => L('M7.6 12q8.4-12 16.8 0', '#8f88c0', 1.8)
      + T('M6.4 11.4h19.2l-2.4 17.4H8.8z', '#4aa8de', '#2f86c0', `<path d="M7.4 16.4h17.2M8 23h16" stroke="#2f86c0" stroke-width="1.4"/>${shine(10, 19)}`, 2)
      + T(E(16, 11.4, 9.6, 2.6), '#a8764a', '#7a4a2a', '', 1.6) + T('M19.6 12.4c0 3 1.6 4 1.6 5.4a1.6 1.6 0 0 1-3.2 0c0-1.2.2-2 0-5z', '#a8764a', '#7a4a2a', '', 1.2),
    // Medio Otoño: el pastel de luna y el conejito de jade sobre la luna llena.
    pastelluna: () => pts(16, 16, 12, 12).map(([x, y]) => T(C(f1(x), f1(y), 2.4), '#e8a35a', '#c9822a', '', 1.2)).join('')
      + T(C(16, 16, 11.6), '#f0b86a', '#d49a4a', `<circle cx="16" cy="16" r="7.4" fill="none" stroke="#c9822a" stroke-width="1.4"/>${pts(16, 16, 4.2, 6).map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" fill="none" stroke="#c9822a" stroke-width="1.1"/>`).join('')}<circle cx="16" cy="16" r="1.4" fill="#c9822a"/>${shine(10, 10)}`, 2),
    conejoluna: () => T(C(16, 16, 13.6), '#fff3c4', '#f0d890', `${dot(24, 9, 2, '#f0d890')}${dot(8, 25, 1.6, '#f0d890')}${dot(26, 21, 1.3, '#f0d890')}`, 2)
      + rot(-14, 12, 12, T(E(11.4, 8.6, 1.8, 5), '#fffdf7', '#e6e0f0', '<ellipse cx="11.4" cy="8.6" rx=".8" ry="3.4" fill="#ffb8c6"/>', 1.4))
      + rot(12, 14, 12, T(E(14.6, 8.2, 1.8, 5), '#fffdf7', '#e6e0f0', '<ellipse cx="14.6" cy="8.2" rx=".8" ry="3.4" fill="#ffb8c6"/>', 1.4))
      + T(E(18, 21.4, 6.4, 4.8), '#fffdf7', '#e6e0f0', '', 1.6) + T(C(24, 22.8, 1.8), '#fffdf7', '#e6e0f0', '', 1.2)
      + T(C(12.6, 16.4, 4), '#fffdf7', '#e6e0f0', `${dot(11.4, 16, 1)}<circle cx="13.8" cy="18" r="1" fill="#ff8a8f" opacity=".7"/>`, 1.6),
    // Banquete de los Monos: la carita del monito y el racimo de plátanos.
    monito: () => T(C(5.6, 15, 4), '#a8764a', '#7a4a2a', dot(5.6, 15, 2, '#f0c8a0'), 1.6) + T(C(26.4, 15, 4), '#a8764a', '#7a4a2a', dot(26.4, 15, 2, '#f0c8a0'), 1.6)
      + T(C(16, 15.4, 10.4), '#a8764a', '#7a4a2a', '', 2) + T('M14 5.4c1-2 3-2 4 0-1 1.4-3 1.4-4 0z', '#a8764a', '#7a4a2a', '', 1.2)
      + T('M16 10.8c2-2.4 6.6-2 7 1.6.4 2.4-.6 3.8-.4 6 .4 4.6-3 7.6-6.6 7.6s-7-3-6.6-7.6c.2-2.2-.8-3.6-.4-6 .4-3.6 5-4 7-1.6z', '#f0c8a0', '#e0a880', `${dot(12.6, 14.8, 1.4)}${dot(19.4, 14.8, 1.4)}${smile(16, 20.4, 6.8)}${dot(15, 18, 0.7)}${dot(17, 18, 0.7)}`, 1.6),
    platanos: () => [[-18, '#ffd84a'], [18, '#ffd84a'], [0, '#ffe27a']].map(([a, c]) => rot(a, 16, 6, T('M15 6c-4 6-4 16 2 22 1.4 1.4 3 .6 2.4-1-4-6-4-14-1.8-20z', c, '#ec9a17', '<path d="M17.4 26.4l1.6 1.4" stroke="#7a4a2a" stroke-width="1.4"/>', 1.6))).join('')
      + T('M13.4 2.4h5.2v4.2h-5.2z', '#7a8a3a', '#5a6a2a', '', 1.4),
    // Festival del Cálao: el cálao con su gran pico y el tambor.
    calao: () => T('M3 30c0-9 2.6-15 8.4-15.6 4.4-.4 6.6 2.6 6.6 6.6 0 4.6-3.4 9-6 9z', '#2a2540', '#1a1530', '', 2)
      + T('M6 24.4c2-2 6-2 8 0-2 3-6 3-8 0z', '#fffdf7', '#e6e0d6', '', 1.2)
      + T(C(11.4, 15.6, 5.4), '#2a2540', '#1a1530', `<circle cx="13" cy="14.6" r="2.4" fill="#fffdf7"/>${dot(13.4, 14.6, 1.2)}`, 1.8)
      + T('M14.6 11.4c3.4-4.6 10.8-5 15 1.2-5.6-1.6-10.4-.8-14 1.6z', '#e8434f', '#c22c3c', '', 1.6)
      + T('M16.4 12.4c5-1.4 10.6.2 14.2 5.4-5 1.6-10.4 1.6-14.6-.4z', '#ffc83d', '#ec9a17', '<path d="M17 15.4q6 .4 12.4 2" stroke="#e2753a" stroke-width="1" fill="none"/>', 1.8),
    tamborcalao: () => T(E(16, 24.6, 10, 3), '#c22c3c', '#a01a2a', '', 1.6)
      + T('M6 9.4h20v15.2H6z', '#e8434f', '#c22c3c', '<path d="M6 12.4l3.4 4.6 3.4-4.6 3.2 4.6 3.4-4.6 3.2 4.6 3.4-4.6" stroke="#fffdf7" stroke-width="1.4" fill="none"/><path d="M6 21.6h20" stroke="#2a2540" stroke-width="2"/>', 2)
      + T(E(16, 9.4, 10, 3), '#f6e0b0', '#e0c890', '', 1.8) + L('M22 3l-4.6 6', '#a86a3a', 1.6) + T(C(22.6, 2.6, 1.6), '#fffdf7', '#e6e0d6', '', 1),
  };

  // ---------- Marcos (lienzo de 140×140; ver set-art.js) ----------
  const rings = {
    escuditos: () => band('#c22c3c') + stitch('#ffd0d0') + many('cascovikingo', [-90], 54, 0.75, 'r-bob') + many('antorchavik', [-150, -30, 150, 30], 56, 0.44, 'r-tw') + studs('#b8c0d8', 8, 22.5, 55, 2.4),
    trebolitos: () => band('#2f9e5c') + stitch('#c8f0a8') + many('trebolsuerte', [-150, -110, -70, -30, 30, 150], 56, 0.4, 'r-sway') + put('olladeoro', 90, 54, 0.62, 'r-bob'),
    ninots: () => band('#ff9c3d') + stitch('#ffe6cc') + many('ninot', [-140, -40], 56, 0.5, 'r-hop') + put('peineta', -90, 54, 0.6, 'r-sway') + twinkle([150, 30, 90], 56, '#ffe27a'),
    rosaljordi: () => band('#c22c3c') + stitch('#ffd0d6') + many('rosaroja', [-150, -110, -70, -30], 56, 0.42, 'r-sway') + put('librojordi', 90, 54, 0.6, 'r-bob'),
    zuecos: () => band('#ff9c3d', 7) + stitch('#fff0dc') + many('molino', [-140, -40], 56, 0.5, 'r-sway') + put('coronanaranja', -90, 54, 0.6, 'r-bob') + studs('#4aa8de', 6, 30, 55, 2.2),
    coronitas: () => band('#5fbf5a') + [[-150, '#ff5f7e', '#e0407e'], [-110, '#ffd84a', '#ec9a17'], [-70, '#b36bff', '#8a4ad8'], [-30, '#fffdf7', '#e6e0d6'], [30, '#4aa8de', '#2f86c0'], [150, '#ff9cc8', '#ff7ab8']].map(([d, c, s], i) => { const [x, y] = k.at(d, 55); return `<g class="r-tw" style="animation-delay:${(i * 0.3).toFixed(1)}s">${flower(f1(x), f1(y), 7, c, s)}</g>`; }).join('') + put('fresa', 90, 54, 0.58, 'r-bob'),
    canastitas: () => band('#4aa8de') + stitch() + many('globoaire', [-150, -90, -30], 56, 0.5, 'r-bob') + many('nubeglobo', [150, 30], 56, 0.44, 'r-sway') + twinkle([90], 56, '#ffe27a'),
    begonias: () => band('#e8559a') + stitch('#ffe0ee') + many('begonia', [-150, -90, -30], 56, 0.46, 'r-tw') + many('petalosflor', [150, 90, 30], 56, 0.4, 'r-sway'),
    gondolitas: () => band('#2f86c0') + stitch('#d8f2ff') + put('gondola', 90, 54, 0.66, 'r-bob') + many('remo', [-150, -30], 56, 0.44, 'r-sway') + twinkle([-110, -70], 56, '#ffd27a'),
    cencerros: () => band('#3f9a46') + stitch('#d8f8d0') + many('cencerro', [-140, -40], 56, 0.48, 'r-sway') + many('edelweiss', [-90, 150, 30], 56, 0.4, 'r-tw') + put('edelweiss', 90, 54, 0.52, 'r-bob'),
    castillitos: () => band('#5fb6e0') + stitch('#e6f7ff') + put('castillohielo', -90, 54, 0.7, 'r-bob') + many('cristalhielo', [-150, -30, 150, 30], 56, 0.42, 'r-tw') + twinkle([90], 56, '#ff9cc8'),
    canitas: () => band('#d2694e') + stitch('#ffe6d8') + many('kolam', [-150, -90, -30], 56, 0.44, 'r-tw') + put('ollapongal', 90, 54, 0.62, 'r-bob') + studs('#ffc83d', 6, 15, 55, 2.2),
    gotasagua: () => band('#2fa8d8') + stitch('#e6fbff') + many('jazmin', [-150, -90, -30], 56, 0.42, 'r-tw') + put('pistolagua', 90, 54, 0.62, 'r-sway') + studs('#8fe8ff', 6, 30, 55, 2.4),
    carpitas: () => band('#2f6aa8') + stitch() + many('koinobori', [-130, -50], 56, 0.5, 'r-sway') + put('kabuto', 90, 54, 0.6, 'r-bob') + twinkle([-90, 150, 30], 56, '#ffd84a'),
    hojitasarroz: () => band('#5fbf5a') + many('kiping', [-150, -110, -70, -30], 56, 0.42, 'r-sway') + put('salakot', 90, 54, 0.62, 'r-bob') + studs('#ff5f7e', 4, 45, 55, 2.4),
    deseitos: () => band('#8a5cf0') + stitch('#efe6ff') + put('tanzaku', -90, 54, 0.66, 'r-sway') + many('estrellasdeseo', [150, 30], 56, 0.44, 'r-tw') + twinkle([-150, -30, 90], 57, '#ff9cc8'),
    arquitos: () => band('#e89a17') + stitch('#fff3cc') + many('arcomongol', [-150, -30], 56, 0.46, 'r-sway') + put('yurta', 90, 54, 0.62, 'r-bob') + studs('#4aa8de', 6, 0, 55, 2.2),
    charquitos: () => band('#a8764a', 7) + stitch('#f0dcc4') + many('charco', [-150, -90, -30], 56, 0.44, 'r-hop') + put('cubetalodo', 90, 54, 0.6, 'r-sway'),
    lunitas: () => band('#d49a4a') + stitch('#fff3c4') + put('conejoluna', -90, 54, 0.7, 'r-bob') + many('pastelluna', [150, 30], 56, 0.44, 'r-hop') + twinkle([-150, -30, 90], 57, '#fff3c4'),
    platanitos: () => band('#c9a24a') + stitch('#fff3cc') + many('platanos', [-150, -110, -70, -30], 56, 0.42, 'r-sway') + put('monito', 90, 54, 0.62, 'r-hop'),
    plumascalao: () => band('#c22c3c') + stitch('#ffd0d0') + put('calao', -90, 54, 0.7, 'r-bob') + many('tamborcalao', [150, 30], 56, 0.44, 'r-hop') + studs('#ffc83d', 8, 22.5, 55, 2.2),
  };

  // ---------- Reversos (lienzo de 100×140) ----------
  const backs = {
    drakkares: back('#e6e8f6', '#c22c3c', 'cascovikingo', 'antorchavik', stripes('#d8dcef', 6)),
    ollasoro: back('#e2f8e6', '#2f9e5c', 'olladeoro', 'trebolsuerte', `<path d="M8 60q42-40 84 0" stroke="#ff5f7e" stroke-width="4" fill="none" opacity=".6"/><path d="M8 66q42-40 84 0" stroke="#ffd84a" stroke-width="4" fill="none" opacity=".6"/><path d="M8 72q42-40 84 0" stroke="#4aa8de" stroke-width="4" fill="none" opacity=".6"/>`),
    ninotgigante: back('#ffeedd', '#e2753a', 'ninot', 'peineta', dots('#ffd8b8')),
    dragonrosa: back('#ffe2e6', '#c22c3c', 'rosaroja', 'librojordi', dots('#ffc6cc')),
    molinos: back('#ffeedd', '#ff9c3d', 'molino', 'coronanaranja', stripes('#ffe0c0', 6)),
    palomayo: back('#fff8d8', '#5fbf5a', 'coronaflores', 'fresa', `<circle cx="50" cy="38" r="22" fill="#fff0a8"/>`),
    globoaerostatico: back('#dff0ff', '#4aa8de', 'globoaire', 'nubeglobo', `<circle cx="26" cy="40" r="10" fill="#fff" opacity=".7"/><circle cx="74" cy="56" r="8" fill="#fff" opacity=".6"/>`),
    alfombrapetalos: back('#ffe6f2', '#e8559a', 'begonia', 'petalosflor', dots('#ffd0e6')),
    gondolas: back('#d8f2ff', '#2f86c0', 'gondola', 'remo', `<circle cx="70" cy="34" r="12" fill="#ffd27a" opacity=".8"/>`),
    vaquitas: back('#e6f8e2', '#3f9a46', 'cencerro', 'edelweiss', `<path d="M8 96l22-34 18 24 16-30 28 40v10H8z" fill="#cfe8d0"/><path d="M52 60l12-24 12 22z" fill="#fffdf7" opacity=".8"/>`),
    palaciohielo: back('#e6f7ff', '#5fb6e0', 'castillohielo', 'cristalhielo', dots('#cdeefc')),
    ollasdulces: back('#ffeee2', '#d2694e', 'ollapongal', 'kolam', stripes('#ffe0cc', 5)),
    elefantes: back('#e0f8ff', '#2fa8d8', 'pistolagua', 'jazmin', dots('#c8f0fc')),
    carpasviento: back('#e2eeff', '#2f6aa8', 'koinobori', 'kabuto', stripes('#d4e4fa', 6)),
    casitaspahiyas: back('#eefae2', '#5fbf5a', 'kiping', 'salakot', dots('#dcf2c8')),
    bambudeseos: back('#2a1a5a', '#8a5cf0', 'tanzaku', 'estrellasdeseo', dots('#3a2a70')),
    yurtas: back('#fff6dc', '#e89a17', 'yurta', 'arcomongol', `<circle cx="72" cy="32" r="12" fill="#ffd84a" opacity=".7"/>`),
    lodo: back('#f4e8dc', '#a8764a', 'charco', 'cubetalodo', dots('#e8d4c0')),
    conejojade: back('#1a1a40', '#d49a4a', 'conejoluna', 'pastelluna', dots('#2a2a5a')),
    monos: back('#fff8dc', '#c9a24a', 'monito', 'platanos', stripes('#fff0c0', 5)),
    calaos: back('#ffeae6', '#c22c3c', 'calao', 'tamborcalao', stripes('#ffd8d0', 5)),
  };

  // Disfraces 3D (costumes/l.js): solo las claves.
  const avatars = ['vikinguito', 'duendecito', 'ninotito', 'dragonjordi', 'holandesito', 'coronadaflor', 'globin', 'begonito', 'gondolerito', 'vaquita', 'heladito', 'ollita', 'elefantito', 'carpita', 'salakotito', 'estrelladeseo', 'jinetito', 'lodito', 'conejitoluna', 'changuito', 'calaito'];
  return { icons, rings, backs, avatars };
}
