// Pasaporte galáctico y premios de secretos (11 nov 2026, pedido del usuario).
// Pasaporte: cuenta los niveles distintos que has ganado (camino, secretos y los de eventos y festividades, que no se
// repiten). 12 nov 2026 (el usuario: pocos sellos): uno de gancho a los 200 y luego cada 500 hasta los 6,000 (13
// sellos; el camino y los secretos dan 5,720, lo demás sale de los eventos). Monedas que suben hasta 6,000 y un
// exclusivo en los primeros 11.
// Secretos: el primer premio a los 10 y luego cada 50 hasta los 500 (11 premios): monedas y, en los primeros 8, un
// exclusivo.
// Se cobran solos al cumplirse (como los logros: van a save.feats y se festejan en la portada).
import { save } from './storage.js';

export const PASS_MAX = 13, SECRET_MAX = 11;
// Niveles distintos que pide el sello n (desde 1): 200, 500, 1,000, 1,500… 6,000.
export const passGoal = (n) => (n <= 1 ? 200 : (n - 1) * 500);
// Secretos que pide el premio m (desde 1): 10, 50, 100… 500.
export const secretGoal = (m) => (m <= 1 ? 10 : (m - 1) * 50);
// Marcos del pasaporte: [clave, nombre, fondo, banda, icono, adorno].
export const PASS_FRAMES = [
  ['pase1', 'Sello explorador', '#e6f2ff', '#4aa8de', 'planet', 'flag'],
  ['pase2', 'Sello navegante', '#e8fff4', '#2fae6a', 'rocket', 'star'],
  ['pase3', 'Sello cometa', '#fff1e0', '#ff8a3d', 'comet', 'meteoro'],
  ['pase4', 'Sello galaxia', '#f0e8ff', '#8a5cf0', 'starSecret', 'planet'],
  ['pase5', 'Sello leyenda', '#fff6d6', '#e89a17', 'crown', 'trophy'],
];
// Exclusivos del sello 6 al 11 (los 5 primeros son los marcos de postal): título, fondo, reverso, viajero 3D, disfraz
// 3D y marco de avatar.
export const PASS_EXTRA = [['title', 'trotamundos'], ['space', 'pasaporte'], ['back', 'pasaporte'], ['traveler', 'pasaporte'], ['avatar', 'viajerogalactico'], ['ring', 'sellos']];
// Sello n (desde 1): monedas 1,000, 1,500, 2,000… con tope de 6,000 y su exclusivo si hay.
export const passPrize = (n) => {
  const item = PASS_FRAMES[n - 1] ? ['frame', PASS_FRAMES[n - 1][0]] : PASS_EXTRA[n - 1 - PASS_FRAMES.length];
  return { coins: Math.min(6000, 500 + 500 * n), ...(item && { item }) };
};
// Premio de secretos m (desde 1): 10, 50, 100… 500 secretos; los 8 primeros con su exclusivo.
export const SECRET_PRIZES = [
  { coins: 2000, item: ['title', 'cazasecretos'] },
  { coins: 3000, item: ['frame', 'secreto'] },
  { coins: 4000, item: ['space', 'secreto'] },
  { coins: 5000, item: ['back', 'secreto'] },
  { coins: 8000, item: ['avatar', 'custodio'] },
  { coins: 6000, item: ['traveler', 'estrellasecreta'] },
  { coins: 6500, item: ['ring', 'secreto'] },
  { coins: 7000, item: ['face', 'secreto'] },
  { coins: 7500 },
  { coins: 8000 },
  { coins: 10000 },
];
export const secretPrize = (m) => SECRET_PRIZES[m - 1] || { coins: 5000 };

// save.devPass / save.devSec: lo que suma el modo dev para probar (llegar al siguiente sello o premio).
export const secretCount = () => Object.values(save.secret || {}).filter((s) => s > 0).length + (save.devSec || 0);
export const passCount = () => Object.values(save.stars || {}).filter((s) => s > 0).length + secretCount() + (save.stats?.event || 0) + (save.devPass || 0);
// Cuántas metas se alcanzan con n (goal crece con el número de meta), sin pasar de max.
const reached = (n, goal, max) => { let k = 0; while (k < max && n >= goal(k + 1)) k++; return k; };
export const passStamps = () => reached(passCount(), passGoal, PASS_MAX);
export const secretSteps = () => reached(secretCount(), secretGoal, SECRET_MAX);

// Cobra lo que ya se cumplió y lo deja en la cola de festejos q. save.pass = { s: sellos cobrados, x: premios de
// secretos, at: { s: [], x: [] } el nivel en que iba al ganar cada uno (para Tu camino) }.
export function passClaim(q) {
  const p = (save.pass ||= { s: 0, x: 0 });
  const at = (p.at ||= { s: [], x: [] }), lvl = Math.max(1, save.next || 0);
  const give = (pr) => {
    save.coins += pr.coins || 0;
    if (pr.item) save.owned[`${pr.item[0]}:${pr.item[1]}`] = 1;
  };
  for (const top = passStamps(); p.s < top; ) {
    const n = ++p.s, pr = passPrize(n);
    give(pr);
    at.s[n - 1] = lvl;
    q.push({ t: 'pase', n, coins: pr.coins, item: pr.item });
  }
  for (const top = secretSteps(); p.x < top; ) {
    const m = ++p.x, pr = secretPrize(m);
    give(pr);
    at.x[m - 1] = lvl;
  q.push({ t: 'secreto', n: secretGoal(m), coins: pr.coins, item: pr.item });
  }
}

// Los exclusivos para la tienda (shop.js los agrega a ITEMS; no se compran, se ganan aquí).
export const passItems = () => ({
  frame: [...PASS_FRAMES.map(([k, name]) => ({ k, name, ev: 'pasaporte', pase: 1 })), { k: 'secreto', name: 'Bóveda secreta', ev: 'secretos', secreto: 1 }],
  title: [{ k: 'cazasecretos', name: 'Cazador de secretos', ev: 'secretos', secreto: 1 }, { k: 'trotamundos', name: 'Trotamundos', ev: 'pasaporte', pase: 1 }],
  space: [{ k: 'secreto', name: 'Cielo secreto', ev: 'secretos', secreto: 1 }, { k: 'pasaporte', name: 'Ruta del pasaporte', ev: 'pasaporte', pase: 1 }],
  back: [{ k: 'secreto', name: 'Estrella secreta', ev: 'secretos', secreto: 1 }, { k: 'pasaporte', name: 'Pasaporte galáctico', ev: 'pasaporte', pase: 1 }],
  traveler: [{ k: 'pasaporte', name: 'Pasaporte volador', ev: 'pasaporte', pase: 1 }, { k: 'estrellasecreta', name: 'Estrella guardiana', ev: 'secretos', secreto: 1 }],
  ring: [{ k: 'sellos', name: 'Ruta de sellos', ev: 'pasaporte', pase: 1 }, { k: 'secreto', name: 'Constelación secreta', ev: 'secretos', secreto: 1 }],
  face: [{ k: 'secreto', name: 'Bóveda de estrellas', ev: 'secretos', secreto: 1 }],
});

// CSS de los marcos, el fondo y el título (se agrega al arrancar, como fiestaCSS). inner(icono): el dibujo sin <svg>.
const svgURL = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
export function passCSS(inner) {
  const one = (ico) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${inner(ico)}</svg>`;
  const frame = (k, bg, band, ico, deco) => {
    // Orilla de estampilla: puntitos de la banda y el adorno chiquito en cada cuadro.
    const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><rect width="26" height="26" fill="${bg}"/>${[[0, 0], [26, 26], [26, 0], [0, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${band}"/>`).join('')}<svg x="5" y="5" width="16" height="16" viewBox="0 0 32 32">${inner(deco)}</svg></svg>`;
    return [
      `.postcard.fr-${k} { padding: 20px 22px 18px 18px; box-shadow: inset 0 0 0 14px ${bg}, inset 0 0 0 16px ${band}, 0 4px 0 var(--ink); }`,
      `.postcard.fr-${k}::after { content: ''; position: absolute; inset: 3px; border-radius: 11px; padding: 9px; pointer-events: none; z-index: 1; -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; background: ${svgURL(tile)} 0 0 / 26px 26px; }`,
      `.postcard.fr-${k}::before { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 2; background: ${svgURL(one(ico))} left 2px top 2px / 36px no-repeat, ${svgURL(one(deco))} right 2px bottom 2px / 36px no-repeat; }`,
    ];
  };
  const css = PASS_FRAMES.flatMap(([k, , bg, band, ico, deco]) => frame(k, bg, band, ico, deco));
  css.push(...frame('secreto', '#2a1f66', '#b48cff', 'starSecret', 'starSecret'));
  // Cielo secreto: violeta muy oscuro con estrellas secretas (la estrella morada, como en el mapa).
  const dots = [[41, 54, 1.1], [109, 216, 0.8], [197, 102, 1.3], [265, 36, 0.8], [299, 192, 1], [150, 270, 0.8], [20, 156, 1], [224, 246, 0.8], [420, 400, 1.1], [600, 120, 0.9], [560, 480, 1.2], [330, 560, 0.8]];
  const figs = [[132, 122, 'starSecret'], [502, 312, 'starSecret'], [232, 452, 'starSecret'], [452, 72, 'starSecret'], [592, 527, 'starSecret'], [60, 330, 'starSecret']];
  const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="600">${dots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('')}${figs.map(([x, y, i], n) => `<svg x="${x}" y="${y}" width="34" height="34" viewBox="0 0 32 32"><g transform="rotate(${(n % 3) * 14 - 14} 16 16)">${inner(i)}</g></svg>`).join('')}</svg>`;
  css.push(`.space-secreto { --sky: radial-gradient(60% 45% at 20% 105%, #ffc83d30, transparent 70%), radial-gradient(50% 40% at 85% 0%, #b48cff38, transparent 70%), linear-gradient(180deg, #0b0626 0%, #1e1250 55%, #3a1f7a 100%); }`);
  css.push(`.space-secreto .space:not(:is(.space-prev, .pf-hero):not(.space-secreto) .space)::after, .space.space-secreto::after { opacity: .85; background-size: 680px 600px; background-image: ${svgURL(tile)}; }`);
  // Ruta del pasaporte: azul de pasaporte con los sellos flotando (planeta, cohete, cometa, corona, libreta, bandera).
  const figs2 = [[132, 122, 'planet'], [502, 312, 'rocket'], [232, 452, 'comet'], [452, 72, 'crown'], [592, 527, 'pasaporte'], [60, 330, 'flag']];
  const tile2 = `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="600">${dots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('')}${figs2.map(([x, y, i], n) => `<svg x="${x}" y="${y}" width="34" height="34" viewBox="0 0 32 32"><g transform="rotate(${(n % 3) * 14 - 14} 16 16)">${inner(i)}</g></svg>`).join('')}</svg>`;
  css.push(`.space-pasaporte { --sky: radial-gradient(60% 45% at 20% 105%, #ffc83d30, transparent 70%), radial-gradient(50% 40% at 85% 0%, #4aa8de38, transparent 70%), linear-gradient(180deg, #0a1240 0%, #1e2a7a 55%, #3a4fc0 100%); }`);
  css.push(`.space-pasaporte .space:not(:is(.space-prev, .pf-hero):not(.space-pasaporte) .space)::after, .space.space-pasaporte::after { opacity: .85; background-size: 680px 600px; background-image: ${svgURL(tile2)}; }`);
  css.push(`.title-chip.t-trotamundos { --tc: #ffd85a; --td: #1e2a7a; background: linear-gradient(#4a5fd4, #2a3a9a); font-family: 'Lilita One'; font-weight: 400; text-shadow: 0 1.5px 0 #1e2a7a; box-shadow: inset 0 -3px 0 #ffc83d; } .title-chip.t-trotamundos span { -webkit-text-stroke: 3px var(--td); paint-order: stroke fill; }`);
  // La ventana del perfil con cada marco (.modal.mr-*, como los demás marcos): cabecera, orilla, fondo y sticker.
  const mr = (k, head, line, style, dark, bg, sticker) => [
    `.modal.mr-${k} { --mr: ${line}; --mrh: ${head}; --mrd: ${dark}; outline-style: ${style}; ${style === 'solid' ? '' : 'outline-width: 5px;'} background: ${bg}, var(--cream); }`,
    `.modal.mr-${k} > .mhead::before { content: ''; position: absolute; left: 12px; top: 6px; z-index: 4; width: 38px; height: 38px; pointer-events: none; background: ${svgURL(one(sticker))} center / contain no-repeat; rotate: -14deg; animation: mr-sticker 2.6s ease-in-out infinite; }`,
  ];
  css.push(...mr('sellos', 'linear-gradient(#4a5fd4, #2a3a9a)', '#ffc83d', 'dashed', '#1e2a7a', 'radial-gradient(circle at 12px 12px, #dfe8ff 4px, transparent 5px) 0 0 / 36px 36px', 'pasaporte'));
  css.push(...mr('secreto', 'linear-gradient(#4a2a9a, #1e1250)', '#b48cff', 'solid', '#140a30', 'radial-gradient(2px 2px at 30% 30%, #b48cff, transparent) 0 0 / 40px 40px', 'starSecret'));
  // Caras «Bóveda de estrellas»: marco violeta y una figura por palo (estrella secreta, gema, cofre, luna).
  const fs = '.face-secreto .front:not(.face-prev:not(.face-secreto) .front)';
  css.push(`${fs}:not(.wild):not(.arrowed):not(.live) { color: #2a1f66; background: #fffdf7; box-shadow: inset 0 0 0 2px var(--ink), inset 0 0 0 calc(var(--cw) * 0.06) #8a5cf0, inset 0 0 0 calc(var(--cw) * 0.075) #fff, inset 0 calc(var(--cw) * -0.12) 0 #f0e8ff, 2px 4px 0 #0b062a33, 4px 9px 12px #0b062a40; }`);
  css.push(`${fs}.red:not(.arrowed):not(.live) { color: #d6307a; }`);
  ['starSecret', 'gema', 'cofre', 'lunita'].forEach((ico, i) => css.push(`${fs} .cs.s${i}:not(.coin-cs) { background: ${svgURL(one(ico))} center / contain no-repeat; scale: 1.25; } ${fs} .cs.s${i}:not(.coin-cs) .suit { visibility: hidden; }`));
  css.push(`.title-chip.t-cazasecretos { --tc: #ffe066; --td: #140a30; background: linear-gradient(#3a1f7a, #1e1250); font-family: 'Lilita One'; font-weight: 400; text-shadow: 0 1.5px 0 #140a30; box-shadow: inset 0 -3px 0 #ffc83d; } .title-chip.t-cazasecretos span { -webkit-text-stroke: 3px var(--td); paint-order: stroke fill; }`);
  return css.join('\n');
}
