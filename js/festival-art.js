// Festividades nuevas (10 nov 2026, pedido del usuario): fiestas de México (nivel 389: Bandera, Equinoccio y Posadas) y
// de América (nivel 461). Aquí sus dibujos (iconos, marcos del avatar, reversos y avatares 2D), con el mismo trazo que
// art.js y set-art.js, y sus datos: colores del fondo del espacio, la postal y el título, y lo que va a la tienda
// (fiestaCSS y fiestaItems, como setCSS en sets.js). Las naves van en festival-travelers.js y los disfraces 3D en
// js/costumes/i.js, con la misma clave. Lo que se juega (fechas, planetas, premios) está en FIESTAS de events.js.

// ---------- Datos ----------
// sky: [noche, medio, abajo, brillo 1, brillo 2] · motif: las 2 figuras sueltas del espacio · frame: [fondo, banda,
// figura de la orilla, esquina 1, esquina 2] · tc: título [arriba, abajo, tinta, orilla] · nombres de cada pieza.
export const FESTIVAL_LOOK = {
  bandera: { ico: 'banderita', deco: 'escarapela', sky: ['#0a2a1a', '#14402a', '#1f5a3a', '#e8434f', '#5ad68c'], frame: ['#f2fff4', '#2f9e5c'], tc: ['#5ad68c', '#2f9e5c', '#1a5a3a', '#e8434f'],
    names: { space: 'Cielo tricolor', frame: 'Banderines', ring: 'Banderines tricolor', back: 'Tricolor', avatar: ['Abanderado/Abanderada', 'Con su banda tricolor'], title: 'De la escolta', traveler: ['Tambor de la escolta', 'Suena al volar'] } },
  equinoccio: { ico: 'piramide', deco: 'serpiente', sky: ['#1a1206', '#3a2a10', '#6a4a1a', '#ffc83d', '#5ad68c'], frame: ['#fff3d6', '#c98a3a'], tc: ['#ffe58a', '#ffc83d', '#8a5a0a', '#3f9a46'],
    names: { space: 'Noche de Kukulcán', frame: 'Grecas mayas', ring: 'Plumaje de quetzal', back: 'Pirámide del sol', avatar: ['Serpiente emplumada', 'Con su penacho de plumas'], title: 'Guardián del sol', traveler: ['Serpiente de luz', 'Ondula entre las estrellas'] } },
  posadas: { ico: 'pinatestrella', deco: 'ponche', sky: ['#1a0a1a', '#3a1028', '#5a1a30', '#ffc83d', '#ff5f7e'], frame: ['#fff6ee', '#e8434f'], tc: ['#ff8a8f', '#e8434f', '#7a1020', '#ffc83d'],
    names: { space: 'Noche de posada', frame: 'Papel picado', ring: 'Farolitos de posada', back: 'Piñata de siete picos', avatar: ['Piñatín', 'Piñata de siete picos'], title: 'Peregrino', traveler: ['Piñata voladora', 'Gira con sus siete picos'] } },
  alasitas: { ico: 'miniatura', deco: 'billetito', sky: ['#1a1030', '#3a1a4a', '#6a2a4a', '#ffb13d', '#ff7ab8'], frame: ['#fff6e6', '#e2753a'], tc: ['#ffc27a', '#ff9c3d', '#8a3a10', '#8a5cf0'],
    names: { space: 'Feria de los deseos', frame: 'Deseos chiquitos', ring: 'Casitas de deseo', back: 'Mundo en miniatura', avatar: ['Ekekito', 'Cargado de deseos chiquitos'], title: 'Gran soñador', traveler: ['Casita de deseos', 'Una casita chiquita que vuela'] } },
  tapati: { ico: 'moai', deco: 'hibisco', sky: ['#06142e', '#0c2a52', '#14466e', '#ff9cc8', '#5ff0ff'], frame: ['#eefaff', '#2f86c0'], tc: ['#8fd6ff', '#4aa8de', '#1f4a7a', '#ff7ab8'],
    names: { space: 'Noche de Rapa Nui', frame: 'Tapati', ring: 'Collar de hibiscos', back: 'Moáis', avatar: ['Moaicito', 'Callado y sonriente'], title: 'Isleño del Pacífico', traveler: ['Canoa polinesia', 'Rema entre las olas'] } },
  carnaval: { ico: 'antifaz', deco: 'serpentina', sky: ['#1a0a3a', '#3a1a6a', '#5a2a8a', '#ffc83d', '#5ff0ff'], frame: ['#fbf4ff', '#8a5cf0'], tc: ['#c9a6ff', '#8a5cf0', '#3a1a7a', '#ffc83d'],
    names: { space: 'Noche de carnaval', frame: 'Comparsa', ring: 'Serpentinas', back: 'Antifaz de plumas', avatar: ['Carnavalito', 'Con su antifaz y sus plumas'], title: 'Rey del carnaval', traveler: ['Carroza de carnaval', 'Desfila echando confeti'] } },
  boyero: { ico: 'ruedacarreta', deco: 'buey', sky: ['#1a0a0a', '#3a1410', '#5a2a1a', '#ffc83d', '#5fbf5a'], frame: ['#fff3e6', '#c22c3c'], tc: ['#ff8a8f', '#e8434f', '#7a1020', '#ffc83d'],
    names: { space: 'Noche del cafetal', frame: 'Carreta pintada', ring: 'Ruedas pintadas', back: 'Carreta de colores', avatar: ['Boyerito/Boyerita', 'Con su sombrero y su pañuelo'], title: 'Gran boyero', traveler: ['Carreta voladora', 'Giran sus ruedas pintadas'] } },
  guelaguetza: { ico: 'flordepina', deco: 'canasta', sky: ['#2a0a2a', '#4a1440', '#6a1f52', '#ff9cc8', '#ffc83d'], frame: ['#fff8fb', '#e8559a'], tc: ['#ffb8d6', '#ff7ab8', '#8a1a4a', '#ffc83d'],
    names: { space: 'Noche oaxaqueña', frame: 'Bordado oaxaqueño', ring: 'Listones de colores', back: 'Flor de piña', avatar: ['Danzante de Flor de Piña', 'Con su piña y sus listones'], title: 'Gran danzante', traveler: ['Canasta de flores', 'Flota llena de flores'] } },
  papalotes: { ico: 'volantin', deco: 'carrete', sky: ['#0a2040', '#14386a', '#1f5a90', '#ffc83d', '#ff5f7e'], frame: ['#f0f8ff', '#4aa8de'], tc: ['#8fd6ff', '#4aa8de', '#1f4a7a', '#ffc83d'],
    names: { space: 'Cielo de papalotes', frame: 'Volantines', ring: 'Colas de papalote', back: 'Barrilete gigante', avatar: ['Volantín', 'Vuela con su colita'], title: 'Rey del viento', traveler: ['Barrilete', 'Ondea su cola de colores'] } },
  dulcedeleche: { ico: 'frasco', deco: 'alfajor', sky: ['#1a0e06', '#3a2010', '#5a3418', '#ffd27a', '#ff9c5b'], frame: ['#fff6e8', '#a86a3a'], tc: ['#ffd9a8', '#e8a35a', '#6a3a10', '#fff6e8'],
    names: { space: 'Noche dulce', frame: 'Alfajores', ring: 'Alfajorcitos', back: 'Frasco de dulce de leche', avatar: ['Alfajorcito', 'Relleno de dulce de leche'], title: 'Gran dulcero', traveler: ['Frasco volador', 'Con su cuchara de hélice'] } },
  pupusa: { ico: 'pupusa', deco: 'curtido', sky: ['#0a1a0e', '#14301a', '#1f4a26', '#ffc83d', '#ff9c5b'], frame: ['#fbf6e8', '#3f9a46'], tc: ['#9be08a', '#5fbf5a', '#1f4a1a', '#ffc83d'],
    names: { space: 'Noche de comal', frame: 'Comal', ring: 'Pupusitas', back: 'Pupusas en el comal', avatar: ['Pupusita', 'Recién salida del comal'], title: 'Gran pupusero', traveler: ['Comal volador', 'Echa vapor rico'] } },
  velitas: { ico: 'farolpapel', deco: 'vela', sky: ['#0a0a24', '#1a1a40', '#2a2a5a', '#ffc83d', '#ff7ab8'], frame: ['#fffbe8', '#ec9a17'], tc: ['#fff08a', '#ffc83d', '#8a5a0a', '#ff7ab8'],
    names: { space: 'Noche de velitas', frame: 'Faroles', ring: 'Velitas encendidas', back: 'Faroles de papel', avatar: ['Farolín', 'Brilla de colores'], title: 'Luz de diciembre', traveler: ['Farol volador', 'Sube con su lucecita'] } },
  anioviejo: { ico: 'monigote', deco: 'bengala', sky: ['#0a0620', '#1a1040', '#2a1a5a', '#ffc83d', '#ff5f7e'], frame: ['#f6f2ff', '#6c3fd4'], tc: ['#c9a6ff', '#6c3fd4', '#2a1060', '#ffc83d'],
    names: { space: 'Última noche del año', frame: 'Monigotes', ring: 'Chispas de fin de año', back: 'Año Viejo', avatar: ['Monigote', 'Se despide del año'], title: 'Adiós año viejo', traveler: ['Monigote volador', 'Chispea como bengala'] } },
};

// Lo que va a la tienda de cada festividad (claves de FIESTAS[].ex): { avatar: [...], ring: [...], … } como ITEMS.
export function festivalItems(FESTIVALS) {
  const out = { avatar: [], ring: [], title: [], back: [], traveler: [], space: [], frame: [] };
  for (const f of FESTIVALS) {
    const L = FESTIVAL_LOOK[f.key];
    if (!L) continue;
    for (const g of f.ex) for (const [sec, k] of Object.entries(g)) {
      const n = L.names[sec], [name, text] = Array.isArray(n) ? n : [n];
      out[sec].push({ k, name, ...(text && { text }), ev: f.key, mes: 1 });
    }
  }
  return out;
}
// Icono de cada título nuevo (TITLE_ICO de shop.js).
export const festivalTitleIcons = (FESTIVALS) => Object.fromEntries(FESTIVALS.filter((f) => FESTIVAL_LOOK[f.key]).map((f) => [f.ex.find((g) => g.title).title, FESTIVAL_LOOK[f.key].ico]));

const svgURL = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
// CSS de fondos del espacio, postales y títulos (se agrega al arrancar, como setCSS).
export function festivalCSS(FESTIVALS, inner) {
  const css = [];
  const one = (ico) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${inner(ico)}</svg>`;
  for (const f of FESTIVALS) {
    const L = FESTIVAL_LOOK[f.key];
    if (!L) continue;
    const ex = Object.assign({}, ...f.ex);
    const [n, m, lo, g1, g2] = L.sky;
    css.push(`.space-${ex.space} { --sky: radial-gradient(60% 45% at 20% 105%, ${g1}38, transparent 70%), radial-gradient(50% 40% at 85% 0%, ${g2}30, transparent 70%), linear-gradient(180deg, ${n} 0%, ${m} 55%, ${lo} 100%); }`);
    const dots = [[41, 54, 1.1], [109, 216, 0.8], [197, 102, 1.3], [265, 36, 0.8], [299, 192, 1], [150, 270, 0.8], [20, 156, 1], [224, 246, 0.8], [420, 400, 1.1], [600, 120, 0.9], [560, 480, 1.2], [330, 560, 0.8]];
    const figs = [[132, 122, L.ico], [502, 312, L.deco], [232, 452, L.ico], [452, 72, L.deco], [592, 527, L.ico], [60, 330, L.deco]];
    const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="600">${dots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('')}${figs.map(([x, y, i], k) => `<svg x="${x}" y="${y}" width="34" height="34" viewBox="0 0 32 32"><g transform="rotate(${(k % 3) * 14 - 14} 16 16)">${inner(i)}</g></svg>`).join('')}</svg>`;
    css.push(`.space-${ex.space} .space:not(:is(.space-prev, .pf-hero):not(.space-${ex.space}) .space)::after, .space.space-${ex.space}::after { opacity: .85; background-size: 680px 600px; background-image: ${svgURL(tile)}; }`);
    const [bg, band] = L.frame, fr = ex.frame;
    const ftile = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><rect width="26" height="26" fill="${bg}"/>${[[0, 0], [26, 26], [26, 0], [0, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="${band}"/>`).join('')}<svg x="5" y="5" width="16" height="16" viewBox="0 0 32 32">${inner(L.deco)}</svg></svg>`;
    css.push(`.postcard.fr-${fr} { padding: 20px 22px 18px 18px; box-shadow: inset 0 0 0 14px ${bg}, inset 0 0 0 16px ${band}, 0 4px 0 var(--ink); }`);
    css.push(`.postcard.fr-${fr}::after { content: ''; position: absolute; inset: 3px; border-radius: 11px; padding: 9px; pointer-events: none; z-index: 1; -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; background: ${svgURL(ftile)} 0 0 / 26px 26px; }`);
    css.push(`.postcard.fr-${fr}::before { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 2; background: ${svgURL(one(L.ico))} left 2px top 2px / 36px no-repeat, ${svgURL(one(L.deco))} right 2px bottom 2px / 36px no-repeat; }`);
    const [a, b, d, o] = L.tc, t = `.title-chip.t-${ex.title}`;
    css.push(`${t} { --tc: #fff; --td: ${d}; background: linear-gradient(${a}, ${b}); font-family: 'Lilita One'; font-weight: 400; text-shadow: 0 1.5px 0 ${d}; box-shadow: inset 0 -3px 0 ${o}; } ${t} span { -webkit-text-stroke: 3px var(--td); paint-order: stroke fill; }`);
  }
  return css.join('\n');
}

// ---------- Dibujos ----------
export function festivalArt({ tshape: T, CIRCLE: C, starPath, K, ICONS }) {
  const E = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`;
  const L = (d, c, w = 2.4) => `<path d="${d}" fill="none" stroke="${K}" stroke-width="${w + 2.6}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const dot = (x, y, r = 1.2, c = K) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
  const shine = (x, y, rx = 2.2, ry = 1.3, a = -35) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".7" transform="rotate(${a} ${x} ${y})"/>`;
  const pts = (cx, cy, r, n, off = -90) => Array.from({ length: n }, (_, i) => { const a = ((off + (360 / n) * i) * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a), a]; });

  const icons = {
    // Día de la Bandera: banderita verde, blanco y rojo ondeando en su asta (sin escudo) y la escarapela tricolor.
    banderita: () => L('M7 5v25', '#a86a3a', 2.2)
      + T('M8.4 5q5-2 9.6 0t9.6 0v13q-5 2-9.6 0t-9.6 0z', '#fffdf7', '#e6e0d6', `<path d="M8 3h6.6v18H8z" fill="#2f9e5c"/><path d="M21.6 3H30v18h-8.4z" fill="#e8434f"/>`, 2.2)
      + T(C(7, 4.4, 2), '#ffc83d', '#ec9a17', '', 1.4),
    escarapela: () => T('M12.4 18 8.6 29l3.6-2 2.2 3 2-11z', '#2f9e5c', '#1f7a42', '', 1.6) + T('M19.6 18l3.8 11-3.6-2-2.2 3-2-11z', '#e8434f', '#c22c3c', '', 1.6)
      + T(C(16, 13.6, 11.2), '#2f9e5c', '#1f7a42', `<circle cx="16" cy="13.6" r="7.6" fill="#fffdf7"/><circle cx="16" cy="13.6" r="4.2" fill="#e8434f"/>${pts(16, 13.6, 9.4, 12).map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r=".9" fill="#bfe8c8"/>`).join('')}`, 2),
    // Equinoccio: la pirámide escalonada con su templo y la serpiente de luz bajando por la escalera; la cabeza de
    // la serpiente emplumada.
    piramide: () => T('M2 28h28l-2.6-5h-1.8l-2.6-5h-1.6l-2.4-5H17.4V7h-2.8v6H13l-2.4 5H9l-2.6 5H4.6z', '#f2c24a', '#d49a2a', `<path d="M13.6 28V13h4.8v15" fill="#e0a83a"/><path d="M4.6 23h22.8M7.4 18h17.2M10.6 13h10.8" stroke="#b8862a" stroke-width="1.2"/><path d="M19.4 27l1.6-2.4-1.4-2 1.6-2.4-1.4-2 1.4-2.2" stroke="#fff6c4" stroke-width="1.8" fill="none" stroke-linecap="round"/>`, 2)
      + T('M11.6 7.4h8.8V3h-8.8z', '#e8b04a', '#c48a2a', `<path d="M15 7.4V5h2v2.4" fill="#6a4a1a"/>`, 1.6),
    serpiente: () => [['#3f9a46', -60], ['#2fbf9a', -30], ['#e8434f', 0], ['#2fbf9a', 30], ['#3f9a46', 60]].map(([c, a]) => `<g transform="rotate(${a} 16 18)">${T(E(16, 6.4, 2.6, 5.6), c, '#1f6a3a', '', 1.4)}</g>`).join('')
      + T('M4 19c0-6.6 5.4-11 12-11s12 4.4 12 10l-3.4 3H7.4z', '#5fbf5a', '#3f9a46', `<path d="M7 15q9-4 18 0" stroke="#8fdc6a" stroke-width="1.6" fill="none"/>`, 2)
      + T('M7.6 21h16.8l-3.4 6.4H11z', '#5fbf5a', '#3f9a46', `<path d="M9 21.4l1.2 2.6 1.4-2.6 1.4 2.6 1.4-2.6 1.4 2.6 1.4-2.6 1.4 2.6 1.4-2.6 1.4 2.6 1.4-2.6" fill="#fffdf7"/>`, 2)
      + T(C(11.4, 15.6, 2.6), '#fffdf7', '#e6dcc8', '', 1.4) + T(C(20.6, 15.6, 2.6), '#fffdf7', '#e6dcc8', '', 1.4) + dot(11.8, 15.8, 1.3) + dot(21, 15.8, 1.3)
      + L('M16 27.4q0 2.4-2 3M16 27.4q0 2.4 2 3', '#ff5f7e', 1.2),
    // Posadas: la piñata de siete picos y el jarrito de ponche con su canela.
    pinatestrella: () => pts(16, 17, 6.6, 7).map(([x, y, a], i) => {
      const c = ['#ffc83d', '#ff5f7e', '#4aa8de', '#7fd36a', '#b36bff', '#ff9c3d', '#5fd1f0'][i], sh = ['#ec9a17', '#d63d5f', '#2f86c0', '#56b83a', '#8a4ad8', '#e2753a', '#2fb6c8'][i];
      const tip = [16 + Math.cos(a) * 15, 17 + Math.sin(a) * 15], l = [x + Math.cos(a + 1.57) * 2.8, y + Math.sin(a + 1.57) * 2.8], r = [x + Math.cos(a - 1.57) * 2.8, y + Math.sin(a - 1.57) * 2.8];
      return T(`M${l[0].toFixed(1)} ${l[1].toFixed(1)}L${tip[0].toFixed(1)} ${tip[1].toFixed(1)}L${r[0].toFixed(1)} ${r[1].toFixed(1)}z`, c, sh, '', 1.4);
    }).join('') + T(C(16, 17, 7.2), '#ff5fa8', '#e0408a', `<path d="M9 15h14M9 19h14" stroke="#ffe27a" stroke-width="1.6"/>`, 1.8),
    ponche: () => L('M20.4 3.6 17.6 14', '#a8643a', 2.2) + L('M22.6 4.6 19.8 14.4', '#c98a4b', 1.8)
      + T('M6 12.4h17v9.4a6.4 6.4 0 0 1-6.4 6.4h-4.2A6.4 6.4 0 0 1 6 21.8z', '#c96a3a', '#a8502a', `<path d="M7 17q8 3 15 0" stroke="#e8946a" stroke-width="1.6" fill="none"/>${dot(10, 23, 1, '#e8946a')}${dot(15, 24.4, 1, '#e8946a')}`, 2.2)
      + `<path d="M22.6 15.4q5.4 0 4.4 4.6t-5 3.2" fill="none" stroke="${K}" stroke-width="4.4" stroke-linecap="round"/><path d="M22.6 15.4q5.4 0 4.4 4.6t-5 3.2" fill="none" stroke="#c96a3a" stroke-width="2" stroke-linecap="round"/>`
      + T(E(14.5, 12.6, 8.4, 2.4), '#e8743a', '#c9502a', `${dot(11, 12.4, 1.6, '#ffd23d')}${dot(16.6, 12, 1.4, '#ffe8a8')}`, 1.6),
    // Alasitas: la casita en miniatura y el billetito de los deseos.
    miniatura: () => T('M7 16.4 16 8.6l9 7.8V28H7z', '#ffd27a', '#f0b04a', `<path d="M13.6 28v-6.6h4.8V28" fill="#a86a3a"/><path d="M9.6 18.4h3v3h-3zM19.4 18.4h3v3h-3z" fill="#8fd6ff" stroke="${K}" stroke-width="1"/>`, 2)
      + T('M3.4 17.4 16 6l12.6 11.4-2.2 2.2L16 10.2 5.6 19.6z', '#e8434f', '#c22c3c', '', 1.8) + T('M20.4 6h3.2v5.6l-3.2-2.8z', '#a86a3a', '#83501a', '', 1.4),
    billetito: () => `<g transform="rotate(-12 16 16)">${T('M3 9.6h26v13H3z', '#7fd36a', '#56b83a', `<rect x="5.6" y="12" width="20.8" height="8.2" rx="2" fill="none" stroke="#3f9a46" stroke-width="1.4"/><circle cx="16" cy="16.1" r="3" fill="#ffd84a" stroke="#3f9a46" stroke-width="1.2"/><path d="M16 14.6v3" stroke="#3f9a46" stroke-width="1.2"/>`, 2)}</g>`,
    // Tapati Rapa Nui: el moái (con su sombrerito rojo) y la flor de hibisco.
    moai: () => T('M8.6 30V13c0-5.4 3.2-9.2 7.4-9.2s7.4 3.8 7.4 9.2v17z', '#a8a0b8', '#857c99', `<path d="M10 13.4h12" stroke="#6a6280" stroke-width="2.2" stroke-linecap="round"/><path d="M15 13.6l-1.4 9h4.8l-1.4-9" fill="#958cab"/><path d="M12.4 25.4h7.2" stroke="#6a6280" stroke-width="2" stroke-linecap="round"/>${dot(12.2, 16.6, 1.4)}${dot(19.8, 16.6, 1.4)}`, 2.2)
      + T('M10.4 6.6h11.2V3.2H10.4z', '#d2694e', '#a84a36', '', 1.6),
    hibisco: () => pts(16, 16, 7.4, 5).map(([x, y, a]) => `<g transform="rotate(${((a * 180) / Math.PI + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})">${T(E(+x.toFixed(1), +y.toFixed(1), 6, 7.4), '#ff5f7e', '#e0407e', '', 1.6)}</g>`).join('')
      + T(C(16, 16, 3.6), '#c22c5c', '#a01a46', '', 1.4) + L('M16 16l5-7', '#ffd23d', 1.4) + dot(21.4, 8.4, 1.6, '#ffd23d'),
    // Carnaval: el antifaz con plumas y una serpentina enroscada con confeti.
    antifaz: () => `<g transform="rotate(-24 11 10)">${T(E(11, 8, 2.4, 7), '#ff5f7e', '#d63d5f', '', 1.4)}</g><g transform="rotate(20 21 10)">${T(E(21, 8, 2.4, 7), '#5fd1f0', '#2fb6c8', '', 1.4)}</g>`
      + T('M2.6 15c0-3.2 3.8-4.6 7.4-3.4l6 2 6-2c3.6-1.2 7.4.2 7.4 3.4 0 5.2-4.2 8.4-7.8 7.4L16 20.6l-5.6 1.8C6.8 23.4 2.6 20.2 2.6 15z', '#8a5cf0', '#6c3fd4', `<ellipse cx="9.6" cy="16" rx="3.2" ry="2.2" fill="${K}"/><ellipse cx="22.4" cy="16" rx="3.2" ry="2.2" fill="${K}"/>${dot(4.6, 17, 1, '#ffd23d')}${dot(27.4, 17, 1, '#ffd23d')}${dot(16, 18.4, 1, '#ffd23d')}`, 2),
    serpentina: () => L('M4 27c4-6 10 1 12-5s-6-8-2-12.4 10 2.4 12.4-4', '#ff5f7e', 2.6)
      + [[7, 8, '#ffc83d', 20], [24, 22, '#5fd1f0', -30], [12, 18, '#7fd36a', 50], [26, 13, '#b36bff', 10]].map(([x, y, c, a]) => `<rect x="${x}" y="${y}" width="4" height="2.4" fill="${c}" stroke="${K}" stroke-width=".9" transform="rotate(${a} ${x + 2} ${y + 1.2})"/>`).join(''),
    // Día del Boyero: la rueda de carreta pintada y la carita del buey.
    ruedacarreta: () => T(C(16, 16, 13.4), '#e8434f', '#c22c3c', pts(16, 16, 7.6, 8).map(([x, y], i) => `<path d="M16 16L${(16 + (x - 16) * 1.6).toFixed(1)} ${(16 + (y - 16) * 1.6).toFixed(1)}" stroke="${i % 2 ? '#ffc83d' : '#fff6e6'}" stroke-width="2.4"/>`).join('') + `<circle cx="16" cy="16" r="8" fill="none" stroke="#ffc83d" stroke-width="1.6"/>${pts(16, 16, 10.6, 8, -67).map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.4" fill="${['#4aa8de', '#7fd36a'][i % 2]}"/>`).join('')}`, 2.2)
      + T(C(16, 16, 3.6), '#ffc83d', '#ec9a17', dot(16, 16, 1.2, '#a86a3a'), 1.6),
    buey: () => T('M9.2 11.4C5 11.6 2.4 8.4 3 4.6c2 2.6 4 3.6 6.6 3.6z', '#fff6dc', '#e6d8b8', '', 1.6) + T('M22.8 11.4c4.2.2 6.8-3 6.2-6.8-2 2.6-4 3.6-6.6 3.6z', '#fff6dc', '#e6d8b8', '', 1.6)
      + T('M8 11c0-4 3.6-6.4 8-6.4S24 7 24 11v7.6c0 5.4-3.6 9-8 9s-8-3.6-8-9z', '#fffdf7', '#e6dcc8', `<path d="M8 11c3 0 5 2 5 5s-2 5-5 5z" fill="#a8764a"/><path d="M21 6c2 3 3 6 3 9" stroke="#a8764a" stroke-width="3" fill="none"/>`, 2)
      + T(E(16, 22.6, 5.4, 3.6), '#ffb8c6', '#f08aa0', `${dot(14, 22.6, 1)}${dot(18, 22.6, 1)}`, 1.6) + dot(12.4, 15, 1.5) + dot(19.6, 15, 1.5),
    // Guelaguetza: la piña de la danza Flor de Piña y la canasta de flores.
    flordepina: () => [-36, -12, 12, 36].map((a) => `<g transform="rotate(${a} 16 11)">${T(E(16, 6, 1.8, 5.6), '#5fbf5a', '#3f9a46', '', 1.4)}</g>`).join('')
      + T(E(16, 20, 8.4, 9.6), '#ffd23d', '#f0a81a', `<path d="M9 15l14 10M9 21l10 7M13 11l10 8M23 15 9 25M23 21l-10 7M19 11 9 19" stroke="#d8901a" stroke-width="1.1"/>`, 2)
      + T(C(23.4, 23.4, 3), '#ff7ab8', '#e0559a', dot(23.4, 23.4, 1.2, '#ffd23d'), 1.4),
    canasta: () => `<path d="M7 15q9-14 18 0" fill="none" stroke="${K}" stroke-width="4.4"/><path d="M7 15q9-14 18 0" fill="none" stroke="#c98a3a" stroke-width="2"/>`
      + [[10, 13, '#ff5f7e'], [16, 11, '#ffc83d'], [22, 13, '#b36bff'], [13, 14, '#5fd1f0']].map(([x, y, c]) => T(C(x, y, 3), c, '#0002', dot(x, y, 1, '#fff6c8'), 1.4)).join('')
      + T('M4 15h24l-3 13H7z', '#e8b06a', '#c98a3a', `<path d="M5 19h22M6 23h20M10 15l1 13M16 15v13M22 15l-1 13" stroke="#b8763a" stroke-width="1.2"/>`, 2),
    // Papalotes: el volantín de cuatro colores con su cola de moños y el carrete de hilo.
    volantin: () => L('M16 27q-4 2 0 3.4t1 2', '#fffdf7', 1.2) + T('M16 2.4 27 13 16 27.6 5 13z', '#ff5f7e', '#e0407e', `<path d="M16 2.4 27 13H16z" fill="#ffc83d"/><path d="M16 27.6 5 13h11z" fill="#4aa8de"/><path d="M16 2.4v25.2M5 13h22" stroke="${K}" stroke-width="1.2"/>`, 2)
      + [[13.4, 29], [18.6, 31]].map(([x, y], i) => T(`M${x - 2.4} ${y - 1.6}l2.4 1.6 2.4-1.6v3.2l-2.4-1.6-2.4 1.6z`, i ? '#7fd36a' : '#b36bff', '#0002', '', 1)).join(''),
    carrete: () => L('M22 16q6-6 8-14', '#fffdf7', 1.2) + T('M7 5h18v4H7z', '#c98a4b', '#a86a3a', '', 1.6) + T('M7 23h18v4H7z', '#c98a4b', '#a86a3a', '', 1.6)
      + T('M10 9h12v14H10z', '#fff6e6', '#e6dcc8', `<path d="M10 11.6h12M10 14.4h12M10 17.2h12M10 20h12" stroke="#ff5f7e" stroke-width="1.4"/>`, 1.6),
    // Dulce de leche: el frasco con su tapa y el alfajor de chocolate.
    frasco: () => T('M7.6 10.6h16.8v15.6a3 3 0 0 1-3 3H10.6a3 3 0 0 1-3-3z', '#c98a3a', '#a86a2a', `<path d="M7.6 13.4h16.8" stroke="#e8b06a" stroke-width="1.6"/><rect x="10.4" y="16" width="11.2" height="7.4" rx="1.4" fill="#fff6dc"/><path d="M12.6 19.7h6.8" stroke="#c98a3a" stroke-width="1.4"/>${shine(10, 25)}`, 2)
      + T('M6.4 6.4h19.2v4.4H6.4z', '#4aa8de', '#2f86c0', `<path d="M8 8.6h16" stroke="#8fd6ff" stroke-width="1" stroke-dasharray="1.4 1.4"/>`, 1.8),
    alfajor: () => T(E(16, 21.4, 12.4, 4.6), '#f0d0a0', '#d8b07a', '', 2) + T('M4 18.6h24v2.8H4z', '#c98a3a', '#a86a2a', '', 1.4)
      + T(E(16, 15.4, 12.4, 5.2), '#7a4a2a', '#5a3218', `<path d="M8 13q8-3 16 0" stroke="#a8764a" stroke-width="1.4" fill="none"/>`, 2),
    // Día de la Pupusa: la pupusa doradita con su queso y el frasco de curtido.
    pupusa: () => T(E(16, 17.4, 13.4, 10), '#f6dca0', '#e0b870', `${[[10, 13, 1.6], [20, 12, 1.2], [23, 19, 1.6], [12, 21, 1.3], [17, 17, 1]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#c98a3a"/>`).join('')}<path d="M5 19q2 3 5 2" stroke="#fff6dc" stroke-width="2.4" fill="none" stroke-linecap="round"/>`, 2.2),
    curtido: () => T('M8.6 9.4h14.8v16.6a3 3 0 0 1-3 3h-8.8a3 3 0 0 1-3-3z', '#e6f7ff', '#bfe0f0', `<path d="M8.6 14h14.8v15H8.6z" fill="#b8e08a"/>${[[11, 17, '#ff9c3d'], [16, 20, '#ff9c3d'], [20, 16.6, '#fff6dc'], [13, 24, '#fff6dc'], [19, 25, '#ff9c3d']].map(([x, y, c], i) => `<path d="M${x} ${y}l3 ${i % 2 ? 1 : -1}" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`).join('')}${shine(11, 12)}`, 2)
      + T('M7.6 5.4h16.8v4H7.6z', '#e8434f', '#c22c3c', '', 1.6),
    // Día de las Velitas: el farol de papel de colores y la velita.
    farolpapel: () => `<circle cx="16" cy="17" r="13" fill="#ffd84a" opacity=".25"/>` + T(E(16, 17, 9.4, 11), '#ff7ab8', '#e0559a', `<path d="M16 6v22M11 7q-3 10 0 20M21 7q3 10 0 20" stroke="#ffd0e6" stroke-width="1.4" fill="none"/><ellipse cx="16" cy="18" rx="3.4" ry="5" fill="#fff3a8" opacity=".75"/>`, 2)
      + T('M11.4 4h9.2v3h-9.2zM11.4 27h9.2v3h-9.2z', '#ffc83d', '#ec9a17', '', 1.4),
    vela: () => `<circle cx="16" cy="9" r="7" fill="#ffd84a" opacity=".3"/>` + T('M11.6 13h8.8v16h-8.8z', '#fff6dc', '#e6d8b8', `<path d="M11.6 13h8.8v3q-1.6 0-1.6 3t-1.6-1-1.6-1-1.6 2-2.4-1z" fill="#fffdf7"/>`, 2)
      + T('M16 2.6c3 4 4 6.4 4 8.4a4 4 0 0 1-8 0c0-2 1-4.4 4-8.4z', '#ffc83d', '#ff8a1a', `<path d="M16 7c1.4 2 1.8 3 1.8 4a1.8 1.8 0 0 1-3.6 0c0-1 .4-2 1.8-4z" fill="#fff6c4"/>`, 1.8),
    // Año Viejo: el monigote de trapo con su sombrero y la bengala chispeando.
    monigote: () => T('M7 30c0-6 3.6-9.4 9-9.4s9 3.4 9 9.4z', '#6a8ac8', '#4a6aa8', `<path d="M16 21v9M10 25h3M19 25h3" stroke="#fff6dc" stroke-width="1.4"/>`, 2)
      + [[-1, 0], [1, 0]].map(([sx]) => L(`M${16 + sx * 8} 23l${sx * 4} -3`, '#f0d070', 1.4)).join('')
      + T(C(16, 14.6, 7.4), '#ffe6c8', '#f0c8a0', `${dot(13.4, 13.6, 1.2)}${dot(18.6, 13.6, 1.2)}<path d="M12.6 17q3.4 3 6.8 0" stroke="${K}" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="11.6" cy="16.4" r="1.4" fill="#ff8a8f" opacity=".6"/><circle cx="20.4" cy="16.4" r="1.4" fill="#ff8a8f" opacity=".6"/>`, 1.8)
      + T('M8.4 9.4h15.2l-1 2.2H9.4z', '#2a2540', '#1a1530', '', 1.4) + T('M11 9.6V3.4h10v6.2z', '#2a2540', '#1a1530', `<path d="M11 7.4h10" stroke="#e8434f" stroke-width="1.6"/>`, 1.4),
    bengala: () => L('M6 28 17 15', '#8f88c0', 1.6) + `<path d="${starPath(20, 11, 9, 3.4)}" fill="#ffe27a" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>` + `<circle cx="20" cy="11" r="3" fill="#fff"/>`
      + [[28, 4], [29, 15], [12, 5], [24, 22]].map(([x, y]) => `<path d="${starPath(x, y, 2.2, 0.9)}" fill="#ffc83d"/>`).join(''),
  };

  // ---------- Marcos (lienzo de 140×140; ver set-art.js) ----------
  const at = (deg, r) => [70 + r * Math.cos((deg * Math.PI) / 180), 70 + r * Math.sin((deg * Math.PI) / 180)];
  const band = (c, w = 6, r = 55) => `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${K}" stroke-width="${w + 5}"/><circle cx="70" cy="70" r="${r}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
  const stitch = (c = '#fff', r = 55, dash = '2 9') => `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="${dash}" stroke-linecap="round" opacity=".85"/>`;
  const put = (ico, deg, r, k0, cls = '', i = 0, rot = 0) => { const [x, y] = at(deg, r), k = k0 * 1.2; return `<g${cls ? ` class="${cls}" style="animation-delay:${(i * 0.27).toFixed(2)}s"` : ''}><g transform="translate(${(x - 16 * k).toFixed(1)} ${(y - 16 * k).toFixed(1)}) rotate(${rot} ${16 * k} ${16 * k}) scale(${k})">${ICONS[ico]()}</g></g>`; };
  const many = (ico, degs, r, k, cls) => degs.map((d, i) => put(ico, d, r, k, cls, i)).join('');
  const studs = (c, n, off = 0, r = 55, rr = 2.6) => Array.from({ length: n }, (_, i) => { const [x, y] = at((360 / n) * i + off, r); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr}" fill="${c}" stroke="${K}" stroke-width="1.4"/>`; }).join('');
  const twinkle = (degs, r, c = '#fff6c8', R = 4) => degs.map((d, i) => { const [x, y] = at(d, r); return `<path class="r-tw" style="animation-delay:${(i * 0.4).toFixed(1)}s" d="${starPath(x, y, R, R * 0.45)}" fill="${c}" stroke="${K}" stroke-width="1.2" stroke-linejoin="round"/>`; }).join('');
  // Tricolor del marco de la Bandera: tres tramos de la banda.
  const arc3 = (cols, r = 55, w = 7) => cols.map((c, i) => { const a0 = -90 + i * 120, a1 = a0 + 120, [x0, y0] = at(a0, r), [x1, y1] = at(a1, r); return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${c}" stroke-width="${w}"/>`; }).join('');
  const rings = {
    banderines: () => band('#fff', 7) + arc3(['#2f9e5c', '#fffdf7', '#e8434f']) + many('banderita', [-140, -40], 56, 0.5, 'r-sway') + put('escarapela', 90, 54, 0.7, 'r-bob'),
    plumaje: () => band('#3f9a46') + stitch('#c8f0a8') + many('serpiente', [-90], 54, 0.8, 'r-sway') + studs('#ffc83d', 8, 22.5) + twinkle([-150, -30, 150, 30], 57, '#ffe58a'),
    farolitos7: () => band('#e8434f') + stitch('#ffe2e2') + many('pinatestrella', [-90], 54, 0.75, 'r-sway') + many('ponche', [150, 30], 56, 0.48, 'r-hop') + twinkle([-150, -30, 90], 57),
    casitas: () => band('#ff9c3d') + stitch('#ffe6cc') + many('miniatura', [-140, -40, 90], 56, 0.5, 'r-hop') + many('billetito', [160, 20], 56, 0.42, 'r-sway'),
    hibiscos: () => band('#5fd1f0') + many('hibisco', [-150, -110, -70, -30, 30, 70, 110, 150], 55, 0.4, 'r-tw') + put('moai', 90, 52, 0.62, 'r-bob'),
    serpentinas: () => band('#8a5cf0') + stitch('#efe6ff') + put('antifaz', -90, 54, 0.75, 'r-sway') + many('serpentina', [-150, -30, 150, 30], 56, 0.44, 'r-hop') + studs('#ffc83d', 6, 0, 55, 2.2),
    ruedas: () => band('#e8434f') + stitch('#ffe2e2') + many('ruedacarreta', [-130, -50, 50, 130], 56, 0.46, 'r-spin') + put('buey', 90, 54, 0.6, 'r-bob'),
    listones: () => band('#ff7ab8') + [['#ffc83d', -150], ['#5fd1f0', -110], ['#7fd36a', -70], ['#b36bff', -30]].map(([c, d], i) => { const [x, y] = at(d, 55); return `<path class="r-sway" style="animation-delay:${(i * 0.3).toFixed(1)}s" d="M${x.toFixed(1)} ${y.toFixed(1)}q-4 12 2 22" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`; }).join('') + put('flordepina', 90, 54, 0.7, 'r-bob') + many('canasta', [150, 30], 56, 0.42, 'r-hop'),
    colitas: () => band('#4aa8de') + stitch() + many('volantin', [-150, -90, -30], 56, 0.5, 'r-sway') + put('carrete', 90, 54, 0.55, 'r-bob') + twinkle([150, 30], 56),
    alfajorcitos: () => band('#a86a3a', 7) + stitch('#ffe8c8') + many('alfajor', [-150, -110, -70, -30], 56, 0.42, 'r-hop') + put('frasco', 90, 54, 0.65, 'r-bob'),
    pupusitas: () => band('#3f9a46') + stitch('#e6f8d8') + many('pupusa', [-150, -90, -30], 56, 0.46, 'r-hop') + put('curtido', 90, 54, 0.6, 'r-bob'),
    velas: () => band('#ec9a17') + many('vela', [-150, -110, -70, -30], 56, 0.42, 'r-tw') + put('farolpapel', 90, 54, 0.65, 'r-sway') + twinkle([150, 30], 56, '#fff3a8'),
    chispasviejo: () => band('#6c3fd4') + stitch('#efe6ff') + many('bengala', [-150, -90, -30], 56, 0.46, 'r-tw') + put('monigote', 90, 54, 0.62, 'r-bob') + twinkle([150, 30], 56, '#ffe27a'),
  };

  // ---------- Reversos (lienzo de 100×140, el dibujo dentro del marco de 84×124) ----------
  const at2 = (ico, x, y, k = 1, rot = 0) => `<g transform="translate(${x - 16 * k} ${y - 16 * k}) rotate(${rot} ${16 * k} ${16 * k}) scale(${k})">${ICONS[ico]()}</g>`;
  // Un dibujo grande al centro, dos chiquitos y un suelo de su color (el usuario: "temática, no todo un paisaje").
  const back = (a, ground, ico, deco, pattern = '') => ({ a, b: a, flat: true, nodots: true,
    bg: () => pattern + `<path d="M8 112Q50 100 92 112V132H8z" fill="${ground}"/>`,
    art: () => at2(ico, 50, 70, 2.2) + at2(deco, 22, 116, 0.62, -12) + at2(deco, 80, 118, 0.55, 14) + at2(deco, 78, 28, 0.42, 20) });
  const stripes = (c, w = 10) => Array.from({ length: 6 }, (_, i) => `<path d="M${8 + i * 18} 8v124" stroke="${c}" stroke-width="${w}"/>`).join('');
  const dots = (c) => Array.from({ length: 24 }, (_, i) => `<circle cx="${14 + (i % 4) * 24 + (Math.floor(i / 4) % 2) * 12}" cy="${16 + Math.floor(i / 4) * 20}" r="3" fill="${c}"/>`).join('');
  const backs = {
    tricolorb: back('#fffdf7', '#2f9e5c', 'banderita', 'escarapela', `<path d="M8 8h28v124H8z" fill="#bfe8c8"/><path d="M64 8h28v124H64z" fill="#ffc6c6"/>`),
    piramides: back('#ffe9b0', '#c98a3a', 'piramide', 'serpiente', `<circle cx="50" cy="40" r="26" fill="#fff3c4"/>${stripes('#ffdf90', 4)}`),
    pinatas7: back('#ffe2e6', '#e8434f', 'pinatestrella', 'ponche', dots('#ffc6cc')),
    miniaturas: back('#ffeedd', '#e2753a', 'miniatura', 'billetito', dots('#ffd8b8')),
    moais: back('#d8f2ff', '#2f86c0', 'moai', 'hibisco', `<circle cx="70" cy="34" r="14" fill="#ffd27a" opacity=".8"/>`),
    mascaras: back('#efe2ff', '#8a5cf0', 'antifaz', 'serpentina', dots('#ddc8ff')),
    carretas: back('#ffe6e2', '#c22c3c', 'ruedacarreta', 'buey', stripes('#ffd2cc', 6)),
    bordados: back('#ffe6f2', '#e8559a', 'flordepina', 'canasta', stripes('#ffd0e6', 5)),
    barriletes: back('#dff0ff', '#4aa8de', 'volantin', 'carrete', `<circle cx="28" cy="36" r="10" fill="#fff" opacity=".7"/><circle cx="72" cy="52" r="8" fill="#fff" opacity=".6"/>`),
    frascos: back('#ffeed8', '#a86a3a', 'frasco', 'alfajor', dots('#ffdcb0')),
    pupusas: back('#f6eed8', '#3f9a46', 'pupusa', 'curtido', stripes('#ece0c0', 6)),
    farolespapel: back('#2a2a5a', '#ec9a17', 'farolpapel', 'vela', dots('#3a3a70')),
    anioviejo: back('#e6dcff', '#6c3fd4', 'monigote', 'bengala', dots('#d6c8ff')),
  };

  // Disfraces de las festividades: solo las claves (12 nov 2026, ya no hay dibujo 2D; son 3D en costumes/i.js).
  const avatars = ['abanderado', 'serpientita', 'pinatin', 'ekekito', 'moaisito', 'carnavalito', 'boyerito', 'chinita', 'volantinito', 'alfajorcito', 'pupusita', 'farolin', 'monigotito'];
  return { icons, rings, backs, avatars };
}
