// Exclusivos de Construir (19 nov 2026, pedido del usuario): al terminar las 10 estaciones de una constelación sale el
// siguiente de BUILD_PRIZES (station.js), intercalados con los 5 títulos de construir: 3 disfraces 3D, 3 marcos del
// avatar, 2 reversos y 2 naves 3D. Aquí lo que se dibuja con CSS (la ventana del perfil con cada marco); los reversos y
// los marcos están en art.js (BACKS.faroluz, RINGS.cupulacristal…), los disfraces en costumes/m.js y las naves en
// travelers.js. Sin importar nada: shop.js los agrega a ITEMS.
export const buildItems = () => ({
  avatar: [
    { k: 'astrolunar', name: 'Astronauta lunar', text: 'Con su casco de obra y su lámpara', ev: 'construir', obra: 1 },
    { k: 'astronomo', name: 'Astrónomo/Astrónoma', text: 'Con su capa de estrellas y su telescopio', ev: 'construir', obra: 1 },
    { k: 'caballerogalactico', name: 'Caballero galáctico/Caballera galáctica', text: 'Armadura de estrellas y escudo de cometa', ev: 'construir', obra: 1 },
  ],
  ring: [
    { k: 'cupulacristal', name: 'Cúpula de cristal', ev: 'construir', obra: 1 },
    { k: 'minacristales', name: 'Mina de cristales', ev: 'construir', obra: 1 },
    { k: 'templodorado', name: 'Templo dorado', ev: 'construir', obra: 1 },
  ],
  back: [
    { k: 'faroluz', name: 'Faro estelar', ev: 'construir', obra: 1 },
    { k: 'carrusel', name: 'Carrusel', ev: 'construir', obra: 1 },
  ],
  traveler: [
    { k: 'tractorvolador', name: 'Tractor volador', text: 'Ara las nubes con sus llantas', ev: 'construir', obra: 1 },
    { k: 'transbordador', name: 'Transbordador', text: 'Despega con sus dos cohetes', ev: 'construir', obra: 1 },
  ],
});

const svgURL = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
// inner(icono): el dibujo sin <svg> (iconInner de art.js). La ventana del perfil con cada marco (.modal.mr-*).
export function buildCSS(inner) {
  const one = (ico) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${inner(ico)}</svg>`;
  return [
    ['cupulacristal', '#4aa8de', 'linear-gradient(100deg, #2f86c0, #7fd0ff 55%, #2f86c0)', '#1e5f8a', '#bfeaff', 'rocket'],
    ['minacristales', '#b48cff', 'linear-gradient(100deg, #c9a6ff, #5fe0c8 35%, #ff7ab8 65%, #ffd36b)', '#6a3fb0', '#5fe0c8', 'gema'],
    ['templodorado', '#e0a82a', 'linear-gradient(100deg, #c98a12, #ffd56a 55%, #c98a12)', '#8a5a0a', '#ffe58a', 'sol'],
  ].map(([k, mr, mrh, mrd, dot, ico]) => `.modal.mr-${k} { --mr: ${mr}; --mrh: ${mrh}; --mrd: ${mrd}; background: radial-gradient(2px 2px at 30% 30%, ${dot}, transparent) 0 0 / 38px 38px, var(--cream); }
.modal.mr-${k} > .mhead::before { content: ''; position: absolute; left: 12px; top: 6px; z-index: 4; width: 38px; height: 38px; pointer-events: none; background: ${svgURL(one(ico))} center / contain no-repeat; rotate: -14deg; animation: mr-sticker 2.6s ease-in-out infinite; }`).join('\n');
}
