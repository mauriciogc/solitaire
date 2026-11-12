// Exclusivos de la lluvia de estrellas (12 nov 2026, pedido del usuario: que tenga los suyos y no comparta los de la
// lluvia de meteoritos). Salen como premio de un nivel con 3★ mientras cae (ver metWin en meteor.js, odds.item).
// Lo que se dibuja con CSS (título, postal, fondo y la ventana del marco) está aquí; el reverso y el marco del avatar
// están en art.js (BACKS.deseo, RINGS.fugaces). Sin importar nada: shop.js los agrega a ITEMS.
export const starItems = () => ({
  title: [{ k: 'pidedeseo', name: 'Pide un deseo', ev: 'estrellas', star: 1 }],
  back: [{ k: 'deseo', name: 'Deseo fugaz', ev: 'estrellas', star: 1 }],
  frame: [{ k: 'cielodeseos', name: 'Cielo de deseos', ev: 'estrellas', star: 1 }],
  space: [{ k: 'lluviadorada', name: 'Lluvia dorada', ev: 'estrellas', star: 1 }],
  ring: [{ k: 'fugaces', name: 'Estrellas fugaces', ev: 'estrellas', star: 1 }],
});

const svgURL = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
// inner(icono): el dibujo sin <svg> (iconInner de art.js).
export function starCSS(inner) {
  const one = (ico) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${inner(ico)}</svg>`;
  const css = [];
  // Título: violeta noche con una orilla dorada, como el cielo de la lluvia.
  css.push(`.title-chip.t-pidedeseo { --tc: #ffe58a; --td: #2a1f66; background: linear-gradient(100deg, #3a2a99, #a785ff 55%, #ff9cc8); font-family: 'Lilita One'; font-weight: 400; text-shadow: 0 1.5px 0 #2a1f66; box-shadow: inset 0 -3px 0 #ffc83d; } .title-chip.t-pidedeseo span { -webkit-text-stroke: 3px var(--td); paint-order: stroke fill; }`);
  // Postal: orilla violeta con estrellitas doradas y una estrella fugaz en cada esquina.
  const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><rect width="26" height="26" fill="#2a1f66"/><svg x="6" y="6" width="14" height="14" viewBox="0 0 32 32">${inner('starDot')}</svg><circle cx="2" cy="22" r="1.2" fill="#ffb3d9"/></svg>`;
  css.push(`.postcard.fr-cielodeseos { padding: 20px 22px 18px 18px; box-shadow: inset 0 0 0 14px #2a1f66, inset 0 0 0 16px #ffc83d, 0 4px 0 var(--ink); }`);
  css.push(`.postcard.fr-cielodeseos::after { content: ''; position: absolute; inset: 3px; border-radius: 11px; padding: 9px; pointer-events: none; z-index: 1; -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; background: ${svgURL(tile)} 0 0 / 26px 26px; }`);
  css.push(`.postcard.fr-cielodeseos::before { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 2; background: ${svgURL(one('starFall'))} right 2px top 2px / 38px no-repeat, ${svgURL(one('starFall'))} left 2px bottom 2px / 30px no-repeat; }`);
  // Fondo: noche violeta que se aclara a rosa abajo, con estrellas fugaces y estrellitas.
  const dots = [[41, 54, 1.1], [109, 216, 0.8], [197, 102, 1.3], [265, 36, 0.8], [299, 192, 1], [150, 270, 0.8], [20, 156, 1], [224, 246, 0.8], [420, 400, 1.1], [600, 120, 0.9], [560, 480, 1.2], [330, 560, 0.8]];
  const figs = [[132, 122, 'starFall'], [502, 312, 'starDot'], [232, 452, 'starFall'], [452, 72, 'starDot'], [592, 527, 'starFall'], [60, 330, 'starDot']];
  const sky = `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="600">${dots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('')}${figs.map(([x, y, i]) => `<svg x="${x}" y="${y}" width="${i === 'starDot' ? 22 : 36}" height="${i === 'starDot' ? 22 : 36}" viewBox="0 0 32 32">${inner(i)}</svg>`).join('')}</svg>`;
  css.push(`.space-lluviadorada { --sky: radial-gradient(60% 45% at 20% 105%, #ff9cc838, transparent 70%), radial-gradient(50% 40% at 85% 0%, #ffc83d30, transparent 70%), linear-gradient(180deg, #120a3a 0%, #2a1f66 55%, #6a3fa8 100%); }`);
  css.push(`.space-lluviadorada .space:not(:is(.space-prev, .pf-hero):not(.space-lluviadorada) .space)::after, .space.space-lluviadorada::after { opacity: .9; background-size: 680px 600px; background-image: ${svgURL(sky)}; }`);
  // La ventana del perfil con el marco Estrellas fugaces (.modal.mr-*, como los demás marcos).
  css.push(`.modal.mr-fugaces { --mr: #ffc83d; --mrh: linear-gradient(100deg, #3a2a99, #a785ff 55%, #3a2a99); --mrd: #1d1550; background: radial-gradient(2px 2px at 30% 30%, #c9a6ff, transparent) 0 0 / 38px 38px, var(--cream); }`);
  css.push(`.modal.mr-fugaces > .mhead::before { content: ''; position: absolute; left: 12px; top: 6px; z-index: 4; width: 38px; height: 38px; pointer-events: none; background: ${svgURL(one('starFall'))} center / contain no-repeat; rotate: -14deg; animation: mr-sticker 2.6s ease-in-out infinite; }`);
  return css.join('\n');
}
