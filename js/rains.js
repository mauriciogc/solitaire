// Exclusivos de las lluvias nuevas (14 nov 2026, pedido del usuario): cometas (reverso, postal y fondo), aurora
// (título, disfraz 3D y fondo) y cristales (nave 3D, disfraz 3D y marco del avatar). Salen como premio de un nivel con
// 3★ mientras cae su lluvia (metWin en meteor.js, odds.item). Aquí lo que se dibuja con CSS (postal, fondos y título);
// el reverso y el marco del avatar están en art.js (BACKS.cometasuerte, RINGS.cristales), los disfraces en
// costumes/k.js y la nave en travelers.js. Sin importar nada: shop.js los agrega a ITEMS.
export const rainItems = () => ({
  back: [{ k: 'cometasuerte', name: 'Cometa de la suerte', ev: 'cometas', rain: 'comet' }],
  frame: [{ k: 'pasocometas', name: 'Paso de cometas', ev: 'cometas', rain: 'comet' }],
  space: [
    { k: 'cielocometas', name: 'Cielo de cometas', ev: 'cometas', rain: 'comet' },
    { k: 'auroraboreal', name: 'Aurora boreal', ev: 'aurora', rain: 'aurora' },
  ],
  title: [{ k: 'luzdelnorte', name: 'Luz del norte', ev: 'aurora', rain: 'aurora' }],
  avatar: [
    { k: 'auroral', name: 'Guardián de la aurora/Guardiana de la aurora', text: 'Lleva la luz del norte en su capa', ev: 'aurora', rain: 'aurora' },
    { k: 'cristalino', name: 'Mago de cristal/Maga de cristal', text: 'Su corona de cristales brilla al moverse', ev: 'cristales', rain: 'crystal' },
  ],
  traveler: [{ k: 'navecristal', name: 'Nave de cristal', text: 'Una gema que vuela y destella', ev: 'cristales', rain: 'crystal' }],
  ring: [{ k: 'cristales', name: 'Corona de cristales', ev: 'cristales', rain: 'crystal' }],
});

const svgURL = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const DOTS = [[41, 54, 1.1], [109, 216, 0.8], [197, 102, 1.3], [265, 36, 0.8], [299, 192, 1], [150, 270, 0.8], [20, 156, 1], [224, 246, 0.8], [420, 400, 1.1], [600, 120, 0.9], [560, 480, 1.2], [330, 560, 0.8]];
// inner(icono): el dibujo sin <svg> (iconInner de art.js).
export function rainCSS(inner) {
  const one = (ico) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${inner(ico)}</svg>`;
  const css = [];
  const sky = (k, grad, figs, extra = '') => {
    const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="600">${extra}${DOTS.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('')}${figs.map(([x, y, i, s = 34, rot = 0]) => `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 32 32"><g transform="rotate(${rot} 16 16)">${inner(i)}</g></svg>`).join('')}</svg>`;
    css.push(`.space-${k} { --sky: ${grad}; }`);
    css.push(`.space-${k} .space:not(:is(.space-prev, .pf-hero):not(.space-${k}) .space)::after, .space.space-${k}::after { opacity: .9; background-size: 680px 600px; background-image: ${svgURL(tile)}; }`);
  };
  // Cielo de cometas: azul de noche con cometas de la suerte que cruzan y boletitos.
  sky('cielocometas', 'radial-gradient(60% 45% at 20% 105%, #5fb6e838, transparent 70%), radial-gradient(50% 40% at 85% 0%, #ffd85a30, transparent 70%), linear-gradient(180deg, #0a1a3a 0%, #163a7a 55%, #2f6ac0 100%)',
    [[132, 122, 'cometaLluvia', 40], [502, 312, 'ticket', 26, 20], [232, 452, 'cometaLluvia', 34], [452, 72, 'ticket', 22, -14], [592, 527, 'cometaLluvia', 36], [60, 330, 'ticket', 24, 8]]);
  // Aurora boreal: cortinas de luz verde y violeta que bajan del cielo de noche. Van en una sola pieza estirada a
  // todo lo ancho (dentro de --sky, sin repetirse; en el mosaico se cortaban en cada orilla); el mosaico solo lleva
  // las estrellitas (sin el icono de la aurora: el usuario no quiso el cuadrito).
  const curtains = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" preserveAspectRatio="none"><path d="M0 300Q180 80 380 210T760 150T1000 190V330Q800 280 620 350T220 360T0 420z" fill="#5ff0b0" opacity=".2"/><path d="M0 200Q200 40 430 140T820 70T1000 110V210Q840 180 640 250T200 260T0 310z" fill="#a785ff" opacity=".18"/><path d="M0 360Q240 200 470 300T1000 260V320Q760 330 520 380T0 430z" fill="#5ff0b0" opacity=".12"/></svg>`;
  sky('auroraboreal', `${svgURL(curtains)} center top / 100% 75% no-repeat, radial-gradient(70% 40% at 30% 20%, #5ff0b03a, transparent 70%), radial-gradient(60% 40% at 80% 35%, #a785ff30, transparent 70%), linear-gradient(180deg, #06122a 0%, #14204a 55%, #1d3a5a 100%)`,
    []);
  // Postal Paso de cometas: orilla azul con boletitos y un cometa en cada esquina.
  const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><rect width="26" height="26" fill="#163a7a"/><svg x="5" y="5" width="16" height="16" viewBox="0 0 32 32">${inner('ticket')}</svg><circle cx="2" cy="22" r="1.2" fill="#c9f0ff"/></svg>`;
  css.push(`.postcard.fr-pasocometas { padding: 20px 22px 18px 18px; box-shadow: inset 0 0 0 14px #163a7a, inset 0 0 0 16px #ffd85a, 0 4px 0 var(--ink); }`);
  css.push(`.postcard.fr-pasocometas::after { content: ''; position: absolute; inset: 3px; border-radius: 11px; padding: 9px; pointer-events: none; z-index: 1; -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; background: ${svgURL(tile)} 0 0 / 26px 26px; }`);
  css.push(`.postcard.fr-pasocometas::before { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 2; background: ${svgURL(one('cometaLluvia'))} right 2px top 2px / 38px no-repeat, ${svgURL(one('cometaLluvia'))} left 2px bottom 2px / 30px no-repeat; }`);
  // Título Luz del norte: verde aurora a violeta, que se mueve despacio como la luz.
  css.push(`.title-chip.t-luzdelnorte { --tc: #fff; --td: #14204a; background: linear-gradient(100deg, #2fbf8a, #5ff0b0 30%, #a785ff 65%, #5ff0b0) 0 0 / 300% 100%; font-family: 'Lilita One'; font-weight: 400; text-shadow: 0 1.5px 0 #14204a; box-shadow: inset 0 -3px 0 #14204a; animation: shimmer 6s linear infinite; } .title-chip.t-luzdelnorte span { -webkit-text-stroke: 3px var(--td); paint-order: stroke fill; }`);
  // La ventana del perfil con el marco Corona de cristales (.modal.mr-*, como los demás marcos).
  css.push(`.modal.mr-cristales { --mr: #5fe6f0; --mrh: linear-gradient(100deg, #1f8ea0, #5fe6f0 55%, #1f8ea0); --mrd: #0f5a66; background: radial-gradient(2px 2px at 30% 30%, #8ff2f8, transparent) 0 0 / 38px 38px, var(--cream); }`);
  css.push(`.modal.mr-cristales > .mhead::before { content: ''; position: absolute; left: 12px; top: 6px; z-index: 4; width: 38px; height: 38px; pointer-events: none; background: ${svgURL(one('cristal'))} center / contain no-repeat; rotate: -14deg; animation: mr-sticker 2.6s ease-in-out infinite; }`);
  // El sticker de Jugar (.go.met::before) con el icono de cada lluvia en vez del meteorito.
  for (const [k, ico] of [['comet', 'cometaLluvia'], ['aurora', 'aurora'], ['crystal', 'cristal']]) css.push(`.go.met.sh-${k}::before { background: ${svgURL(one(ico))} center / contain no-repeat; }`);
  return css.join('\n');
}
