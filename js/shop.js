// Tienda: solo cosas para verse bonito (nada ayuda a ganar). Catálogo, compras y lo que el jugador usa.
// El guardado: save.owned = { 'seccion:clave': 1 } (lo comprado) · save.equip = { seccion: clave } (lo que usa).
// El avatar es aparte: save.look = 'letter' | 'char' y save.char = clave del personaje.
import { save, persist } from './storage.js';
import { icon } from './art.js';

// Las secciones van en 3 grupos para que las pestañas quepan en un teléfono.
export const GROUPS = [
  { k: 'yo', name: 'Tú', ico: 'user', secs: ['avatar', 'ring', 'title'] },
  { k: 'cartas', name: 'Cartas', ico: 'card', secs: ['back', 'face'] },
  { k: 'mundo', name: 'Viaje', ico: 'rocket', secs: ['traveler', 'space', 'frame'] },
];
export const SECTIONS = [
  { k: 'avatar', name: 'Avatares' },
  { k: 'ring', name: 'Marcos' },
  { k: 'title', name: 'Títulos' },
  { k: 'back', name: 'Reversos' },
  { k: 'face', name: 'Caras' },
  { k: 'traveler', name: 'Viajeros' },
  { k: 'space', name: 'Espacio' },
  { k: 'frame', name: 'Postales' },
];
export const groupOf = (sec) => GROUPS.find((g) => g.secs.includes(sec));

// price 0 = gratis desde el inicio. El primero de cada sección es el que se usa si no has elegido otro.
// need = índice del mundo que hay que tener abierto para poder comprarlo (5 = mundo 6). Así no se compra
// todo en la primera constelación aunque sobren monedas.
export const ITEMS = {
  avatar: [
    { k: 'nino', name: 'Nico', text: 'Explorador', price: 0 },
    { k: 'nina', name: 'Lila', text: 'Exploradora', price: 0 },
    { k: 'gato', name: 'Michi', text: 'Gatito', price: 300 },
    { k: 'ajolote', name: 'Axo', text: 'Ajolote', price: 300 },
    { k: 'conejo', name: 'Copito', text: 'Conejo', price: 350 },
    { k: 'perrito', name: 'Toby', text: 'Perrito', price: 350 },
    { k: 'zorro', name: 'Canela', text: 'Zorrita', price: 450 },
    { k: 'pinguino', name: 'Pingo', text: 'Pingüino', price: 450, need: 2 },
    { k: 'panda', name: 'Bambú', text: 'Panda', price: 500, need: 5 },
    { k: 'tortuga', name: 'Tula', text: 'Tortuga', price: 500, need: 5 },
    { k: 'robot', name: 'Bip', text: 'Robot', price: 600, need: 8 },
    { k: 'pulpo', name: 'Tako', text: 'Pulpo', price: 600, need: 8 },
    { k: 'abeja', name: 'Miel', text: 'Abeja', price: 650, need: 12 },
    { k: 'capibara', name: 'Capi', text: 'Capibara', price: 700, need: 15 },
    { k: 'astro', name: 'Cosmo', text: 'Astronauta', price: 900, need: 20 },
    { k: 'alien', name: 'Zuli', text: 'Alien', price: 900, need: 20 },
    { k: 'dino', name: 'Pepo', text: 'Dinosaurio', price: 1000, need: 25 },
    { k: 'fantasma', name: 'Boo', text: 'Fantasmita', price: 1000, need: 30 },
    { k: 'estrella', name: 'Estelita', text: 'Estrella', price: 1100, need: 35 },
    { k: 'buho', name: 'Ulises', text: 'Búho', price: 1200, need: 40 },
    { k: 'sirena', name: 'Marina', text: 'Sirena', price: 1400, need: 50 },
    { k: 'vampiro', name: 'Vladi', text: 'Vampiro', price: 1400, need: 60 },
    { k: 'dragoncito', name: 'Chispa', text: 'Dragoncito', price: 1800, need: 80 },
    { k: 'unicornio', name: 'Brisa', text: 'Unicornio', price: 2200, need: 100 },
    // Exclusivos de la colección (ev).
    { k: 'cangrejo', name: 'Pinzas', text: 'Cangrejo', ev: 'mar' },
    { k: 'topo', name: 'Topacio', text: 'Topo minero', ev: 'gemas' },
    { k: 'ardilla', name: 'Avellana', text: 'Ardilla', ev: 'bosque' },
    { k: 'osito', name: 'Gomi', text: 'Osito de gomita', ev: 'dulces' },
  ],
  ring: [
    { k: 'sencillo', name: 'Sencillo', price: 0 },
    { k: 'dorado', name: 'Dorado', price: 400 },
    { k: 'dulce', name: 'Corazones', price: 600 },
    { k: 'estrellas', name: 'Estrellas', price: 600, need: 5 },
    { k: 'orbita', name: 'Órbita', price: 1000, need: 10 },
    { k: 'arcoiris', name: 'Arcoíris', price: 1500, need: 20 },
    { k: 'burbujas', name: 'Burbujas', ev: 'mar' },
    { k: 'gemas', name: 'Gemas', ev: 'gemas' },
    { k: 'hojas', name: 'Hojas', ev: 'bosque' },
    { k: 'caramelos', name: 'Caramelos', ev: 'dulces' },
  ],
  title: [
    { k: 'novato', name: 'Novato', price: 0 },
    { k: 'explorador', name: 'Explorador', price: 250 },
    { k: 'cazacometas', name: 'Cazacometas', price: 400 },
    { k: 'maestro', name: 'Maestro de picos', price: 600, need: 5 },
    { k: 'viajero', name: 'Viajero estelar', price: 900, need: 10 },
    { k: 'bombas', name: 'Domador de bombas', price: 1200, need: 20 },
    { k: 'leyenda', name: 'Leyenda del cosmos', price: 3000, need: 40 },
    { k: 'buscaconchas', name: 'Buscador de conchas', ev: 'mar' },
    { k: 'cazagemas', name: 'Cazador de gemas', ev: 'gemas' },
    { k: 'guardabosques', name: 'Guardián del bosque', ev: 'bosque' },
    { k: 'golosito', name: 'Amo de los dulces', ev: 'dulces' },
  ],
  back: [
    { k: 'clasico', name: 'Clásico', price: 0 },
    { k: 'coral', name: 'Luna coral', price: 400 },
    { k: 'menta', name: 'Anillo menta', price: 400 },
    { k: 'picnic', name: 'Picnic', price: 450, need: 2 },
    { k: 'sandia', name: 'Sandía', price: 500, need: 4 },
    { k: 'cielo', name: 'Cometa', price: 700, need: 6 },
    { k: 'flores', name: 'Flores', price: 700, need: 9 },
    { k: 'anillos', name: 'Planeta', price: 800, need: 12 },
    { k: 'cohete', name: 'Cohete', price: 800, need: 15 },
    { k: 'noche', name: 'Constelación', price: 1000, need: 18 },
    { k: 'ajedrez', name: 'Ajedrez', price: 1000, need: 22 },
    { k: 'papel', name: 'Papel picado', price: 1200, need: 28 },
    { k: 'galaxia', name: 'Galaxia', price: 1400, need: 35 },
    { k: 'eclipse', name: 'Eclipse', price: 1600, need: 45 },
    { k: 'fuegos', name: 'Fuegos artificiales', price: 1800, need: 55 },
    // Exclusivos de la colección (ev): solo se consiguen con fichas en su tienda temporal.
    { k: 'arrecife', name: 'Arrecife', ev: 'mar' },
    { k: 'cristales', name: 'Cristales', ev: 'gemas' },
    { k: 'hojas', name: 'Hojas', ev: 'bosque' },
    { k: 'caramelos', name: 'Caramelos', ev: 'dulces' },
  ],
  face: [
    { k: 'clasica', name: 'Clásica', price: 0 },
    { k: 'dulce', name: 'Dulce', price: 500 },
    { k: 'pastel', name: 'Pastel', price: 500, need: 3 },
    { k: 'luna', name: 'Luna', price: 700, need: 6 },
    { k: 'kraft', name: 'Kraft', price: 700, need: 10 },
    { k: 'pergamino', name: 'Pergamino', price: 800, need: 14 },
    { k: 'acuarela', name: 'Acuarela', price: 900, need: 18 },
    { k: 'noche', name: 'Noche', price: 1000, need: 24 },
    { k: 'pixel', name: 'Pixel', price: 1100, need: 30 },
    { k: 'cristal', name: 'Cristal', price: 1300, need: 40 },
    { k: 'neon', name: 'Neón', price: 1500, need: 50 },
    { k: 'dorada', name: 'Dorada', price: 2500, need: 70 },
  ],
  traveler: [
    { k: 'cohete', name: 'Cohete', price: 0, text: 'Despega con su llama' },
    { k: 'ovni', name: 'Ovni', price: 800, text: 'Gira con sus luces' },
    { k: 'avion', name: 'Avión de papel', price: 900, need: 3, text: 'Planea en ondas' },
    { k: 'globo', name: 'Globo', price: 1000, need: 6, text: 'Se mece con su fueguito' },
    { k: 'cometa', name: 'Cometa', price: 1200, need: 9, text: 'Deja una cola de hielo' },
    { k: 'nube', name: 'Nube arcoíris', price: 1200, need: 12, text: 'Flota sobre su arcoíris' },
    { k: 'meteorito', name: 'Meteorito', price: 1300, need: 16, text: 'Rueda envuelto en fuego' },
    { k: 'satelite', name: 'Satélite', price: 1400, need: 20, text: 'Gira con sus paneles' },
    { k: 'medusa', name: 'Medusa', price: 1600, need: 25, text: 'Late y ondula sus tentáculos' },
    { k: 'ajolote', name: 'Ajolote', price: 1800, need: 30, text: 'Nada entre las estrellas' },
    { k: 'mantarraya', name: 'Mantarraya', price: 2000, need: 40, text: 'Aletea despacio' },
    { k: 'barco', name: 'Barco pirata', price: 2400, need: 50, text: 'Navega entre planetas' },
    { k: 'ballena', name: 'Ballena', price: 2500, need: 60, text: 'Sopla polvo de estrellas' },
    { k: 'dragon', name: 'Dragón chino', price: 3000, need: 80, text: 'Ondula su cuerpo de fuego' },
    { k: 'tortuga', name: 'Tortuga marina', text: 'Nada con sus aletas', ev: 'mar' },
    { k: 'cristal', name: 'Cristal', text: 'Gira con sus gemas', ev: 'gemas' },
    { k: 'hoja', name: 'Hoja viajera', text: 'Se mece con su mariquita', ev: 'bosque' },
    { k: 'paleta', name: 'Paleta', text: 'Da vueltas de colores', ev: 'dulces' },
  ],
  space: [
    { k: 'nebulosa', name: 'Nebulosa', price: 0 },
    { k: 'aurora', name: 'Aurora', price: 600 },
    { k: 'atardecer', name: 'Atardecer', price: 600 },
    { k: 'oceano', name: 'Océano', price: 900, need: 5 },
    { k: 'rosa', name: 'Cosmos rosa', price: 1200, need: 10 },
    { k: 'marino', name: 'Fondo marino', ev: 'mar' },
    { k: 'cueva', name: 'Cueva de cristal', ev: 'gemas' },
    { k: 'bosque', name: 'Bosque nocturno', ev: 'bosque' },
    { k: 'algodon', name: 'Algodón de azúcar', ev: 'dulces' },
  ],
  frame: [
    { k: 'simple', name: 'Sencillo', price: 0 },
    { k: 'cinta', name: 'Con cinta', price: 250 },
    { k: 'estampilla', name: 'Estampilla', price: 400 },
    { k: 'estrellas', name: 'Estrellas', price: 600, need: 5 },
    { k: 'arcoiris', name: 'Arcoíris', price: 900, need: 10 },
    { k: 'mar', name: 'Mar', ev: 'mar' },
    { k: 'gemas', name: 'Gemas', ev: 'gemas' },
    { k: 'bosque', name: 'Bosque', ev: 'bosque' },
    { k: 'dulces', name: 'Dulces', ev: 'dulces' },
  ],
};

export const item = (sec, k) => ITEMS[sec].find((x) => x.k === k);
export const owns = (sec, k) => !!item(sec, k) && (item(sec, k).price === 0 || !!save.owned[`${sec}:${k}`]);
// Lo que se ve en la tienda normal: los exclusivos de colección solo si ya son tuyos (para usarlos).
export const shopItems = (sec) => ITEMS[sec].filter((it) => !it.ev || owns(sec, it.k));
// ¿Todavía no se puede comprar? Devuelve el número de mundo que falta abrir (o 0 si ya se puede).
export const lockedUntil = (sec, k) => {
  const it = item(sec, k);
  return it?.need && !owns(sec, k) && save.open < it.need ? it.need + 1 : 0;
};
// Lo que usa en cada sección (si guardó algo que ya no existe, vuelve al primero).
export const equipped = (sec) => (owns(sec, save.equip[sec]) ? save.equip[sec] : ITEMS[sec][0].k);

export function equip(sec, k) {
  if (!owns(sec, k)) return false;
  if (sec === 'avatar') { save.look = 'char'; save.char = k; }
  else save.equip[sec] = k;
  persist();
  return true;
}
// Compra y lo deja puesto. Devuelve false si no alcanza o aún no se abre.
export function buy(sec, k) {
  const it = item(sec, k);
  if (!it || it.ev || owns(sec, k) || lockedUntil(sec, k) || save.coins < it.price) return false;
  save.coins -= it.price;
  save.owned[`${sec}:${k}`] = 1;
  equip(sec, k);
  return true;
}

// Cada título se ve distinto: color, icono y forma (los más caros, más vistosos).
const TITLE_ICO = { novato: 'star', explorador: 'flag', cazacometas: 'rocket', maestro: 'trophy', viajero: 'planet', bombas: 'bomb', leyenda: 'crown', buscaconchas: 'concha', cazagemas: 'gema', guardabosques: 'bellota', golosito: 'caramelo' };
export const titleName = (k = equipped('title')) => item('title', k).name;
export const titleHTML = (k = equipped('title'), cls = '', tag = 'span', attrs = '') =>
  `<${tag} class="title-chip t-${k} ${cls}" ${attrs}>${icon(TITLE_ICO[k] || 'star')}<span>${titleName(k)}</span></${tag}>`;
