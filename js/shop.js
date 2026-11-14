// Tienda: solo cosas para verse bonito (nada ayuda a ganar). Catálogo, compras y lo que el jugador usa.
// El guardado: save.owned = { 'seccion:clave': 1 } (lo comprado) · save.equip = { seccion: clave } (lo que usa).
// El avatar es aparte: save.look = 'letter' | 'char' y save.char = clave del personaje.
import { save, persist } from './storage.js';
import { icon } from './art.js';
import { themeItems, TRAVELER_VARIANTS } from './themes.js';
import { SETS, setItems, SET_PRICE } from './sets.js';
import { FESTIVALS } from './events.js';
import { festivalItems, festivalTitleIcons } from './festival-art.js';
import { passItems } from './passport.js';
import { starItems } from './starshower.js';
import { rainItems } from './rains.js';

// Las secciones van en 3 grupos para que las pestañas quepan en un teléfono.
export const GROUPS = [
  { k: 'yo', name: 'Tú', ico: 'user', secs: ['avatar', 'ring', 'title'] },
  { k: 'cartas', name: 'Cartas', ico: 'card', secs: ['back', 'face'] },
  { k: 'mundo', name: 'Viaje', ico: 'rocket', secs: ['traveler', 'space', 'frame'] },
];
export const SECTIONS = [
  { k: 'avatar', name: 'Disfraces' }, // 10 nov 2026: los avatares ahora son disfraces de tu personaje
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
    // 8 nov 2026: personajes nuevos (propios).
    { k: 'ninja', name: 'Kage', text: 'Ninja', price: 1100, need: 30 },
    { k: 'voltio', name: 'Voltio', text: 'Ratoncito eléctrico', price: 1300, need: 45 },
    { k: 'tic', name: 'Tic', text: 'Viajero del tiempo', price: 1500, need: 55 },
    { k: 'guardian', name: 'Bruno', text: 'Guardián del anillo', price: 1700, need: 65 },
    { k: 'mago', name: 'Zafiro', text: 'Mago de las estrellas', price: 2000, need: 75 },
    { k: 'caballero', name: 'Sir Galleta', text: 'Caballero', price: 2500, need: 95 },
    // 9 nov 2026: inspirados en personajes famosos, sin copiarlos (market de avatares).
    { k: 'cora', name: 'Cora', text: 'Arqueóloga del templo', price: 1300, need: 35 },
    { k: 'turbo', name: 'Turbo', text: 'Chico de la patineta flotante', price: 1400, need: 40 },
    { k: 'papaya', name: 'Papaya', text: 'Piloto de carreras', price: 1500, need: 45 },
    { k: 'profe', name: 'Profe Voltaje', text: 'Científico del tiempo', price: 1600, need: 50 },
    // Segunda tanda (9 nov 2026): anime, caricaturas y cantantes, sin copiar.
    { k: 'pip', name: 'Pip', text: 'Aventurero del gorro de oso', price: 1200, need: 30 },
    { k: 'gatobot', name: 'Gatobot', text: 'Gato robot del futuro', price: 1300, need: 35 },
    { k: 'esponjita', name: 'Esponjita', text: 'Esponja del fondo del mar', price: 1300, need: 40 },
    { k: 'capitan', name: 'Capitán Sombrero', text: 'Pirata del sombrero de paja', price: 1500, need: 45 },
    { k: 'kiko', name: 'Kiko', text: 'Guerrero de las nubes', price: 1600, need: 50 },
    { k: 'luna', name: 'Luna Estelar', text: 'Chica mágica de las coletas', price: 1600, need: 55 },
    { k: 'estrellapop', name: 'Estrella Pop', text: 'Cantante de lentejuelas', price: 1700, need: 60 },
    { k: 'rocky', name: 'Rocky', text: 'Rockero de la guitarra', price: 1700, need: 65 },
    { k: 'mina', name: 'Mina', text: 'Idol del K-pop', price: 1800, need: 70 },
    { k: 'mcbeat', name: 'MC Beat', text: 'Rapero de los audífonos', price: 1800, need: 75 },
    // Exclusivos de la colección (ev).
    { k: 'cangrejo', name: 'Pinzas', text: 'Cangrejo', ev: 'mar' },
    { k: 'topo', name: 'Topacio', text: 'Topo minero', ev: 'gemas' },
    { k: 'ardilla', name: 'Avellana', text: 'Ardilla', ev: 'bosque' },
    { k: 'osito', name: 'Gomi', text: 'Osito de gomita', ev: 'dulces' },
    { k: 'triceratops', name: 'Trici', text: 'Triceratops', ev: 'dinos' },
    { k: 'robodog', name: 'Rufo', text: 'Perro robot', ev: 'robots' },
    { k: 'pulpopintor', name: 'Pincelín', text: 'Pulpo pintor', ev: 'arte' },
    { k: 'ranita', name: 'Ranita', text: 'Toca la guitarra', ev: 'musica' },
    { k: 'mapache', name: 'Mapache director', text: 'Con su megáfono', ev: 'cine' },
    { k: 'tamalito', name: 'Tamalito', text: 'Envuelto en su hoja de maíz', ev: 'candelaria', mes: 1 },
    { k: 'taquito', name: 'Taquito', text: 'Con todo y cilantro', ev: 'taco', mes: 1 },
    { k: 'arbolito', name: 'Arbolito', text: 'Con su florecita', ev: 'tierra', mes: 1 },
    { k: 'pinatita', name: 'Piñatita', text: 'Llena de dulces', ev: 'nino', mes: 1 },
    { k: 'clavelito', name: 'Clavelito', text: 'Para mamá', ev: 'madres', mes: 1 },
    { k: 'bigoton', name: 'Bigotón', text: 'El tazón favorito de papá', ev: 'padre', mes: 1 },
    { k: 'atigrado', name: 'Michi atigrado', text: 'Con su cascabel', ev: 'gato', mes: 1 },
    { k: 'dalmata', name: 'Manchitas', text: 'Dálmata con su placa', ev: 'perro', mes: 1 },
    { k: 'chaneque', name: 'Chaneque', text: 'Duende travieso de la selva', ev: 'nahual', mes: 1 },
    { k: 'xologuia', name: 'Xolo guía', text: 'Con su farolito', ev: 'xolo', mes: 1 },
    { k: 'lloronita', name: 'Lloronita', text: 'Con su rebozo y su velita', ev: 'llorona', mes: 1 },
    { k: 'catrinita', name: 'Catrinita', text: 'Con su sombrero de flores', ev: 'catrina', mes: 1 },
    { k: 'revolucionario', name: 'Revolucionario', text: 'Con su sombrero y su bigotote', ev: 'revolucion', mes: 1 },
    { k: 'audifonos', name: 'Gamer pro', text: 'Con sus audífonos', ev: 'gamer', mes: 1 },
    { k: 'bichito', name: 'Bichito', text: 'El bug más simpático', ev: 'programador', mes: 1 },
    { k: 'bufoncito', name: 'Bufoncito', text: 'Con su gorro de cascabeles', ev: 'inocentes', mes: 1 },
    { k: 'uvita', name: 'Uvita', text: 'Una de las doce uvas', ev: 'anionuevo', mes: 1 },
    // Exclusivos del evento del mes (mes: la temática que lo da).
    { k: 'xolo', name: 'Xólotl', text: 'Xoloitzcuintle', ev: 'muertos', mes: 1 },
    { k: 'reno', name: 'Reno', text: 'Con su nariz roja', ev: 'navidad', mes: 1 },
    { k: 'reymago', name: 'Rey Mago', text: 'Con su corona y su capa', ev: 'reyes', mes: 1 },
    { k: 'cupido', name: 'Cupido', text: 'Con sus alitas', ev: 'amor', mes: 1 },
    { k: 'catarina', name: 'Catarina', text: 'Con sus puntitos', ev: 'primavera', mes: 1 },
    { k: 'foca', name: 'Foca playera', text: 'Con sus lentes de sol', ev: 'verano', mes: 1 },
    { k: 'chihuahua', name: 'Chihuahua charro', text: 'Con su sombrero y su sarape', ev: 'patrias', mes: 1 },
    { k: 'gatobruja', name: 'Gato brujo', text: 'Con su sombrero de bruja', ev: 'halloween', mes: 1 },
    // Exclusivos de los códigos de regalo (code): temática Tesoro escondido. Solo salen al canjear su código.
    { k: 'loro', name: 'Capitán Pico', text: 'Loro cazatesoros', ev: 'tesoro', code: 1 },
    // Exclusivos de la lluvia de meteoritos (met): muy rara vez, por ganar con 3★ mientras cae (ver meteor.js).
    { k: 'meteorin', name: 'Meteorín', text: 'Piedrita espacial con pelo de fuego', ev: 'meteoro', met: 1 },
    { k: 'custodio', name: 'Guardián secreto', text: 'Cuida la estrella de los niveles secretos', ev: 'secretos', secreto: 1 },
    { k: 'viajerogalactico', name: 'Explorador galáctico/Exploradora galáctica', text: 'Lleva su pasaporte a todos los planetas', ev: 'pasaporte', pase: 1 },
  ],
  ring: [
    { k: 'sencillo', name: 'Sencillo', price: 0 },
    { k: 'destello', name: 'Destello', price: 0 }, // el otro gratis: el que se puede elegir al crear el jugador
    { k: 'dorado', name: 'Dorado', price: 400 },
    { k: 'dulce', name: 'Corazones', price: 600 },
    { k: 'estrellas', name: 'Estrellas', price: 600, need: 5 },
    { k: 'orbita', name: 'Órbita', price: 1000, need: 10 },
    { k: 'arcoiris', name: 'Arcoíris', price: 1500, need: 20 },
    // 8 nov 2026: marcos nuevos.
    { k: 'petalos', name: 'Pétalos', price: 800, need: 12 },
    { k: 'rayos', name: 'Rayos', price: 1200, need: 30 },
    { k: 'relojes', name: 'Manecillas', price: 1500, need: 45 },
    { k: 'runas', name: 'Anillo de oro', price: 2400, need: 70 },
    { k: 'burbujas', name: 'Burbujas', ev: 'mar' },
    { k: 'gemas', name: 'Gemas', ev: 'gemas' },
    { k: 'hojas', name: 'Hojas', ev: 'bosque' },
    { k: 'caramelos', name: 'Caramelos', ev: 'dulces' },
    { k: 'huesitos', name: 'Huesitos', ev: 'dinos' },
    { k: 'tuercas', name: 'Tuercas', ev: 'robots' },
    { k: 'pinceles', name: 'Paleta de pintor', ev: 'arte' },
    { k: 'pentagrama', name: 'Pentagrama', ev: 'musica' },
    { k: 'rollo', name: 'Rollo de película', ev: 'cine' },
    { k: 'tamalitos', name: 'Tamalitos', ev: 'candelaria', mes: 1 },
    { k: 'salsas', name: 'Salsas', ev: 'taco', mes: 1 },
    { k: 'brotes', name: 'Brotes', ev: 'tierra', mes: 1 },
    { k: 'globitos', name: 'Globitos', ev: 'nino', mes: 1 },
    { k: 'claveles', name: 'Claveles', ev: 'madres', mes: 1 },
    { k: 'corbatas', name: 'Corbatas', ev: 'padre', mes: 1 },
    { k: 'estambres', name: 'Estambres', ev: 'gato', mes: 1 },
    { k: 'huesos', name: 'Huesos', ev: 'perro', mes: 1 },
    { k: 'enredadera', name: 'Enredadera', ev: 'nahual', mes: 1 },
    { k: 'collarxolo', name: 'Huellitas', ev: 'xolo', mes: 1 },
    { k: 'velitas', name: 'Velitas del río', ev: 'llorona', mes: 1 },
    { k: 'dalias', name: 'Dalias', ev: 'catrina', mes: 1 },
    { k: 'vias', name: 'Vías del tren', ev: 'revolucion', mes: 1 },
    { k: 'pixelado', name: 'Pixelado', ev: 'gamer', mes: 1 },
    { k: 'llavecitas', name: 'Llaves de código', ev: 'programador', mes: 1 },
    { k: 'cascabeles', name: 'Cascabeles', ev: 'inocentes', mes: 1 },
    { k: 'chispas', name: 'Chispitas', ev: 'anionuevo', mes: 1 },
    { k: 'cempasuchil', name: 'Cempasúchil', ev: 'muertos', mes: 1 },
    { k: 'acebo', name: 'Acebo', ev: 'navidad', mes: 1 },
    { k: 'corona', name: 'Corona real', ev: 'reyes', mes: 1 },
    { k: 'cupido', name: 'Flecha de Cupido', ev: 'amor', mes: 1 },
    { k: 'mariposas', name: 'Mariposas', ev: 'primavera', mes: 1 },
    { k: 'salvavidas', name: 'Salvavidas', ev: 'verano', mes: 1 },
    { k: 'tricolor', name: 'Listón tricolor', ev: 'patrias', mes: 1 },
    { k: 'telarana', name: 'Telaraña', ev: 'halloween', mes: 1 },
    { k: 'doblones', name: 'Doblones', ev: 'tesoro', code: 1 },
  ],
  title: [
    { k: 'novato', name: 'Novato', price: 0 },
    // Títulos de logros (7 nov 2026): el oro de algunos logros los da; no se compran ni se venden.
    { k: 'perfeccionista', name: 'Perfeccionista', ev: 'logro', logro: 1 },
    { k: 'imparable', name: 'Imparable', ev: 'logro', logro: 1 },
    { k: 'artificiero', name: 'Artificiero', ev: 'logro', logro: 1 },
    { k: 'cazafantasmas', name: 'Cazafantasmas', ev: 'logro', logro: 1 },
    { k: 'cumplidor', name: 'Cumplidor', ev: 'logro', logro: 1 },
    { k: 'explorador_secreto', name: 'Explorador secreto', ev: 'logro', logro: 1 },
    { k: 'explorador', name: 'Explorador', price: 250 },
    { k: 'cazacometas', name: 'Cazacometas', price: 400 },
    { k: 'maestro', name: 'Maestro de picos', price: 600, need: 5 },
    { k: 'viajero', name: 'Viajero estelar', price: 900, need: 10 },
    { k: 'bombas', name: 'Domador de bombas', price: 1200, need: 20 },
    { k: 'leyenda', name: 'Leyenda del cosmos', price: 3000, need: 40 },
    // 8 nov 2026: títulos nuevos.
    { k: 'chispa', name: 'Pura chispa', price: 500, need: 3 },
    { k: 'estratega', name: 'Gran estratega', price: 800, need: 15 },
    { k: 'cronista', name: 'Viajero del tiempo', price: 1100, need: 25 },
    { k: 'guardiananillo', name: 'Guardián del anillo', price: 1500, need: 35 },
    { k: 'magocartas', name: 'Mago de las cartas', price: 2000, need: 50 },
    { k: 'invencible', name: 'Invencible', price: 4000, need: 70 },
    { k: 'buscaconchas', name: 'Buscador de conchas', ev: 'mar' },
    { k: 'cazagemas', name: 'Cazador de gemas', ev: 'gemas' },
    { k: 'guardabosques', name: 'Guardián del bosque', ev: 'bosque' },
    { k: 'golosito', name: 'Amo de los dulces', ev: 'dulces' },
    { k: 'paleontologo', name: 'Paleontólogo', ev: 'dinos' },
    { k: 'inventor', name: 'Inventor', ev: 'robots' },
    { k: 'artista', name: 'Gran artista', ev: 'arte' },
    { k: 'estrellarock', name: 'Estrella de la música', ev: 'musica' },
    { k: 'director', name: 'Gran director', ev: 'cine' },
    { k: 'tamalero', name: 'Tamalero', ev: 'candelaria', mes: 1 },
    { k: 'taquero', name: 'Taquero', ev: 'taco', mes: 1 },
    { k: 'heroeverde', name: 'Héroe verde', ev: 'tierra', mes: 1 },
    { k: 'jugueton', name: 'Juguetón', ev: 'nino', mes: 1 },
    { k: 'consentido', name: 'Consentido', ev: 'madres', mes: 1 },
    { k: 'orgullo', name: 'Orgullo de papá', ev: 'padre', mes: 1 },
    { k: 'amigomichi', name: 'Amigo de los michis', ev: 'gato', mes: 1 },
    { k: 'mejoramigo', name: 'Mejor amigo', ev: 'perro', mes: 1 },
    { k: 'nahual', name: 'Nahual', ev: 'nahual', mes: 1 },
    { k: 'guiaalmas', name: 'Guía de las mascotas', ev: 'xolo', mes: 1 },
    { k: 'almadelrio', name: 'Alma del río', ev: 'llorona', mes: 1 },
    { k: 'elegancia', name: 'Muy elegante', ev: 'catrina', mes: 1 },
    { k: 'valiente', name: 'Valiente de la Revolución', ev: 'revolucion', mes: 1 },
    { k: 'jefefinal', name: 'Vencedor del jefe final', ev: 'gamer', mes: 1 },
    { k: 'cerobugs', name: 'Cero bugs', ev: 'programador', mes: 1 },
    { k: 'bromista', name: 'Gran bromista', ev: 'inocentes', mes: 1 },
    { k: 'propositos', name: 'Lleno de propósitos', ev: 'anionuevo', mes: 1 },
    { k: 'catrin', name: 'Catrín del Mictlán', ev: 'muertos', mes: 1 },
    { k: 'duende', name: 'Duende del Polo Norte', ev: 'navidad', mes: 1 },
    { k: 'buscador', name: 'Buscador de la Estrella', ev: 'reyes', mes: 1 },
    { k: 'flechazo', name: 'Cupido', ev: 'amor', mes: 1 },
    { k: 'jardinero', name: 'Jardinero de primavera', ev: 'primavera', mes: 1 },
    { k: 'olas', name: 'Rey de las olas', ev: 'verano', mes: 1 },
    { k: 'mariachi', name: 'Mariachi', ev: 'patrias', mes: 1 },
    { k: 'hechicero', name: 'Hechicero', ev: 'halloween', mes: 1 },
    { k: 'cazatesoros', name: 'Cazatesoros', ev: 'tesoro', code: 1 },
    { k: 'cazaestrellas', name: 'Cazaestrellas', ev: 'meteoro', met: 1 },
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
    { k: 'huellas', name: 'Huellas de dino', ev: 'dinos' },
    { k: 'circuitos', name: 'Circuitos', ev: 'robots' },
    { k: 'lienzo', name: 'Caballete', ev: 'arte' },
    { k: 'partitura', name: 'Tocadiscos', ev: 'musica' },
    { k: 'peliculas', name: 'Noche de estreno', ev: 'cine' },
    { k: 'tamales', name: 'Tamales', ev: 'candelaria', mes: 1 },
    { k: 'tacos', name: 'Tacos', ev: 'taco', mes: 1 },
    { k: 'planetaverde', name: 'Planeta verde', ev: 'tierra', mes: 1 },
    { k: 'pinata', name: 'Piñata', ev: 'nino', mes: 1 },
    { k: 'regalos', name: 'Regalos', ev: 'madres', mes: 1 },
    { k: 'bigotes', name: 'Bigotes', ev: 'padre', mes: 1 },
    { k: 'michis', name: 'Michis', ev: 'gato', mes: 1 },
    { k: 'cachorros', name: 'Cachorros', ev: 'perro', mes: 1 },
    { k: 'jaguar', name: 'Piel de jaguar', ev: 'nahual', mes: 1 },
    { k: 'xolos', name: 'Farolitos', ev: 'xolo', mes: 1 },
    { k: 'rebozos', name: 'Rebozo', ev: 'llorona', mes: 1 },
    { k: 'elegante', name: 'Retrato elegante', ev: 'catrina', mes: 1 },
    { k: 'locomotora', name: 'Locomotora', ev: 'revolucion', mes: 1 },
    { k: 'controles', name: 'Controles', ev: 'gamer', mes: 1 },
    { k: 'binario', name: 'Binario', ev: 'programador', mes: 1 },
    { k: 'arlequin', name: 'Arlequín', ev: 'inocentes', mes: 1 },
    { k: 'medianoche', name: 'Medianoche', ev: 'anionuevo', mes: 1 },
    { k: 'calaverita', name: 'Calaverita', ev: 'muertos', mes: 1 },
    { k: 'esferas', name: 'Esferas', ev: 'navidad', mes: 1 },
    { k: 'rosca', name: 'Rosca de Reyes', ev: 'reyes', mes: 1 },
    { k: 'cartas', name: 'Carta de amor', ev: 'amor', mes: 1 },
    { k: 'tulipanes', name: 'Tulipanes', ev: 'primavera', mes: 1 },
    { k: 'sandias', name: 'Sandía de playa', ev: 'verano', mes: 1 },
    { k: 'vivamexico', name: '¡Viva México!', ev: 'patrias', mes: 1 },
    { k: 'calabazas', name: 'Calabazas', ev: 'halloween', mes: 1 },
    { k: 'mapatesoro', name: 'Mapa del tesoro', ev: 'tesoro', code: 1 },
    { k: 'lluvia', name: 'Lluvia de estrellas', ev: 'meteoro', met: 1 },
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
    { k: 'arena', name: 'Arena de isla', ev: 'tesoro', code: 1 },
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
    { k: 'ptero', name: 'Pterodáctilo', text: 'Aletea con sus alas de piel', ev: 'dinos' },
    { k: 'robotin', name: 'Robot volador', text: 'Vuela con su hélice y saluda', ev: 'robots' },
    { k: 'paletapintor', name: 'Paleta voladora', text: 'Su pincel pinta en el aire', ev: 'arte' },
    { k: 'tocadiscos', name: 'Tocadiscos', text: 'Gira su disco y suelta notas', ev: 'musica' },
    { k: 'proyector', name: 'Proyector', text: 'Giran sus rollos y alumbra', ev: 'cine' },
    { k: 'olla', name: 'Olla tamalera', text: 'Echa vapor al volar', ev: 'candelaria', mes: 1 },
    { k: 'trompo', name: 'Trompo al pastor', text: 'Gira con su piña arriba', ev: 'taco', mes: 1 },
    { k: 'regadera', name: 'Regadera', text: 'Riega gotitas al volar', ev: 'tierra', mes: 1 },
    { k: 'papalote', name: 'Papalote', text: 'Mece su cola de moñitos', ev: 'nino', mes: 1 },
    { k: 'regalito', name: 'Regalito', text: 'Se abre y suelta corazones', ev: 'madres', mes: 1 },
    { k: 'asador', name: 'Asador', text: 'Echa humito y brinca su salchicha', ev: 'padre', mes: 1 },
    { k: 'cajamichi', name: 'Caja con michi', text: 'El michi se asoma al volar', ev: 'gato', mes: 1 },
    { k: 'frisbee', name: 'Disco volador', text: 'Con su perrito de lengua de fuera', ev: 'perro', mes: 1 },
    { k: 'nahualito', name: 'Nahual jaguar', text: 'Brinca entre la neblina', ev: 'nahual', mes: 1 },
    { k: 'xolovuela', name: 'Xolo volador', text: 'Flota moviendo las orejas', ev: 'xolo', mes: 1 },
    { k: 'trajinera', name: 'Trajinera', text: 'Navega con sus velitas', ev: 'llorona', mes: 1 },
    { k: 'sombrerote', name: 'Sombrero de Catrina', text: 'Vuela con sus flores y su pluma', ev: 'catrina', mes: 1 },
    { k: 'tren', name: 'Tren', text: 'Echa humo y gira sus ruedas', ev: 'revolucion', mes: 1 },
    { k: 'maquinita', name: 'Maquinita', text: 'Su pantalla brilla al volar', ev: 'gamer', mes: 1 },
    { k: 'laptop', name: 'Laptop voladora', text: 'Teclea mientras vuela', ev: 'programador', mes: 1 },
    { k: 'sorpresa', name: 'Caja de sorpresas', text: 'Salta el payasito al volar', ev: 'inocentes', mes: 1 },
    { k: 'bolaluz', name: 'Bola de medianoche', text: 'Brilla y suelta chispas', ev: 'anionuevo', mes: 1 },
    { k: 'alebrije', name: 'Alebrije', text: 'Vuela con sus alas de colores', ev: 'muertos', mes: 1 },
    { k: 'trineo', name: 'Trineo', text: 'Lleva su costal de regalos', ev: 'navidad', mes: 1 },
    { k: 'camello', name: 'Camello', text: 'Carga los regalos de los Reyes', ev: 'reyes', mes: 1 },
    { k: 'alado', name: 'Corazón', text: 'Flota y late', ev: 'amor', mes: 1 },
    { k: 'mariposa', name: 'Mariposa', text: 'Revolotea con sus alas', ev: 'primavera', mes: 1 },
    { k: 'patito', name: 'Patito inflable', text: 'Flota meciéndose en las olas', ev: 'verano', mes: 1 },
    { k: 'sombrero', name: 'Sombrero de charro', text: 'Vuela girando como platillo', ev: 'patrias', mes: 1 },
    { k: 'escoba', name: 'Escoba voladora', text: 'Deja chispitas al volar', ev: 'halloween', mes: 1 },
    { k: 'cofre', name: 'Cofre volador', text: 'Aletea y suelta monedas', ev: 'tesoro', code: 1 },
    { k: 'meteoro', name: 'Meteoro', text: 'Cruza el cielo con su cola de fuego', ev: 'meteoro', met: 1 },
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
    { k: 'volcan', name: 'Noche de volcanes', ev: 'dinos' },
    { k: 'taller', name: 'Taller de chispas', ev: 'robots' },
    { k: 'manchas', name: 'Cielo de acuarela', ev: 'arte' },
    { k: 'concierto', name: 'Noche de concierto', ev: 'musica' },
    { k: 'estreno', name: 'Alfombra roja', ev: 'cine' },
    { k: 'candelaria', name: 'Noche de la Candelaria', ev: 'candelaria', mes: 1 },
    { k: 'taquera', name: 'Noche taquera', ev: 'taco', mes: 1 },
    { k: 'tierra', name: 'Noche de la Tierra', ev: 'tierra', mes: 1 },
    { k: 'juguetes', name: 'Noche de juguetes', ev: 'nino', mes: 1 },
    { k: 'jardinmama', name: 'Jardín de mamá', ev: 'madres', mes: 1 },
    { k: 'nochepapa', name: 'Noche de pesca', ev: 'padre', mes: 1 },
    { k: 'tejados', name: 'Noche de tejados', ev: 'gato', mes: 1 },
    { k: 'parque', name: 'Noche en el parque', ev: 'perro', mes: 1 },
    { k: 'lunallena', name: 'Luna llena de otoño', ev: 'nahual', mes: 1 },
    { k: 'sendero', name: 'Sendero de luz', ev: 'xolo', mes: 1 },
    { k: 'riodeluna', name: 'Río de luna', ev: 'llorona', mes: 1 },
    { k: 'paseo', name: 'Paseo de noche', ev: 'catrina', mes: 1 },
    { k: 'llanura', name: 'Atardecer en el llano', ev: 'revolucion', mes: 1 },
    { k: 'arcade', name: 'Noche arcade', ev: 'gamer', mes: 1 },
    { k: 'codigo', name: 'Lluvia de código', ev: 'programador', mes: 1 },
    { k: 'bromas', name: 'Noche de bromas', ev: 'inocentes', mes: 1 },
    { k: 'brindis', name: 'Noche de brindis', ev: 'anionuevo', mes: 1 },
    { k: 'ofrenda', name: 'Noche de ofrenda', ev: 'muertos', mes: 1 },
    { k: 'nevada', name: 'Noche nevada', ev: 'navidad', mes: 1 },
    { k: 'oriente', name: 'Estrella de Oriente', ev: 'reyes', mes: 1 },
    { k: 'corazones', name: 'Cielo de corazones', ev: 'amor', mes: 1 },
    { k: 'petalos', name: 'Lluvia de pétalos', ev: 'primavera', mes: 1 },
    { k: 'playa', name: 'Atardecer en la playa', ev: 'verano', mes: 1 },
    { k: 'grito', name: 'Noche del Grito', ev: 'patrias', mes: 1 },
    { k: 'embrujada', name: 'Noche embrujada', ev: 'halloween', mes: 1 },
    { k: 'isla', name: 'Isla del tesoro', ev: 'tesoro', code: 1 },
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
    { k: 'dinos', name: 'Dinosaurios', ev: 'dinos' },
    { k: 'robots', name: 'Taller', ev: 'robots' },
    { k: 'arte', name: 'Galería', ev: 'arte' },
    { k: 'musica', name: 'Partitura', ev: 'musica' },
    { k: 'cine', name: 'Película', ev: 'cine' },
    { k: 'candelaria', name: 'Hoja de maíz', ev: 'candelaria', mes: 1 },
    { k: 'taco', name: 'Taquería', ev: 'taco', mes: 1 },
    { k: 'tierra', name: 'Hojas verdes', ev: 'tierra', mes: 1 },
    { k: 'confeti', name: 'Confeti', ev: 'nino', mes: 1 },
    { k: 'mama', name: 'Para mamá', ev: 'madres', mes: 1 },
    { k: 'papa', name: 'Para papá', ev: 'padre', mes: 1 },
    { k: 'gatitos', name: 'Gatitos', ev: 'gato', mes: 1 },
    { k: 'patitas', name: 'Patitas', ev: 'perro', mes: 1 },
    { k: 'selva', name: 'Selva', ev: 'nahual', mes: 1 },
    { k: 'farolitos', name: 'Farolitos', ev: 'xolo', mes: 1 },
    { k: 'rebozo', name: 'Rebozo', ev: 'llorona', mes: 1 },
    { k: 'catrina', name: 'Elegancia', ev: 'catrina', mes: 1 },
    { k: 'boleto', name: 'Boleto de tren', ev: 'revolucion', mes: 1 },
    { k: 'pixeles', name: 'Píxeles', ev: 'gamer', mes: 1 },
    { k: 'terminal', name: 'Terminal', ev: 'programador', mes: 1 },
    { k: 'inocente', name: '¡Inocente palomita!', ev: 'inocentes', mes: 1 },
    { k: 'felizano', name: 'Feliz Año', ev: 'anionuevo', mes: 1 },
    { k: 'muertos', name: 'Papel picado', ev: 'muertos', mes: 1 },
    { k: 'navidad', name: 'Bastón de caramelo', ev: 'navidad', mes: 1 },
    { k: 'reyes', name: 'Tesoro real', ev: 'reyes', mes: 1 },
    { k: 'amor', name: 'Encaje de corazones', ev: 'amor', mes: 1 },
    { k: 'primavera', name: 'Enredadera', ev: 'primavera', mes: 1 },
    { k: 'verano', name: 'Toalla de playa', ev: 'verano', mes: 1 },
    { k: 'patrias', name: 'Sarape', ev: 'patrias', mes: 1 },
    { k: 'halloween', name: 'Dulce o truco', ev: 'halloween', mes: 1 },
    { k: 'mapa', name: 'Mapa del tesoro', ev: 'tesoro', code: 1 },
    { k: 'meteoros', name: 'Cielo de meteoros', ev: 'meteoro', met: 1 },
  ],
};

// Tienda a lo largo de todo el universo (7 nov 2026): los candados se reparten por las 52 constelaciones (need × 5:
// antes todo se abría en el mundo 101 y se compraba completo hacia el planeta 110) y el precio sube un poco según la
// constelación donde se abre (+2% por constelación: el del mundo 500 cuesta el doble). Así siempre hay algo que comprar.
// Temáticas (8 nov 2026, themes.js): un reverso, una cara, un fondo y un marco de cada una; y los viajeros de otros
// colores. Se agregan antes del ×5 de abajo, como todo lo de la tienda.
{
  const tm = themeItems();
  for (const sec in tm) ITEMS[sec].push(...tm[sec].filter((it) => !ITEMS[sec].some((x) => x.k === it.k)));
  ITEMS.traveler.push(...TRAVELER_VARIANTS.map(({ k, name, text, price, need }) => ({ k, name, text, price, need })));
  // Exclusivos de las festividades nuevas (10 nov 2026, festival-art.js).
  const fi = festivalItems(FESTIVALS);
  for (const sec in fi) ITEMS[sec].push(...fi[sec]);
  // Exclusivos del pasaporte y de los secretos (11 nov 2026, passport.js): se ganan, no se compran.
  const pi = passItems();
  for (const sec in pi) ITEMS[sec].push(...pi[sec]);
  // Exclusivos de la lluvia de estrellas (12 nov 2026, starshower.js): premio de 3★ mientras cae.
  const si = starItems();
  for (const sec in si) ITEMS[sec].push(...si[sec]);
  // Exclusivos de las lluvias de cometas, aurora y cristales (14 nov 2026, rains.js).
  const ri = rainItems();
  for (const sec in ri) ITEMS[sec].push(...ri[sec]);
  // Colecciones de personaje (sets.js): cada pieza cuesta según su avatar y se abre en el mismo mundo que él.
  for (const { sec, ...it } of setItems()) {
    const av = ITEMS.avatar.find((x) => x.k === it.set), base = av.price || 300;
    ITEMS[sec].push({ ...it, price: Math.round((base * SET_PRICE[sec]) / 50) * 50, ...(av.need && { need: av.need }) });
  }
}
// Un solo nombre por avatar (10 nov 2026): ahora todos son disfraces de tu personaje (avatar3d.js), así que se llaman
// por lo que son (antes llevaban dos: «Michi · Gatito»). Con «/» el nombre cambia según tu personaje: niño / niña.
// Plan con todos en dev/disfraces.html.
const ONE_NAME = {
  nino: 'Ropa de inicio', nina: 'Ropa de inicio', gato: 'Gatito', ajolote: 'Ajolote', conejo: 'Conejo', perrito: 'Perrito', zorro: 'Zorro/Zorrita', pinguino: 'Pingüino', panda: 'Panda', tortuga: 'Tortuga', robot: 'Robot', pulpo: 'Pulpo', abeja: 'Abeja', capibara: 'Capibara', astro: 'Astronauta', alien: 'Marciano/Marciana', dino: 'Dinosaurio', fantasma: 'Fantasmita', estrella: 'Estrella fugaz', buho: 'Búho', sirena: 'Tritón/Sirena', vampiro: 'Vampiro/Vampira', dragoncito: 'Dragoncito', unicornio: 'Unicornio', ninja: 'Ninja', voltio: 'Ratón eléctrico', tic: 'Viajero/Viajera del tiempo', guardian: 'Guardián/Guardiana', mago: 'Mago/Maga', caballero: 'Caballero/Caballera', profe: 'Profe Voltaje', turbo: 'Turbo', papaya: 'Papaya', cora: 'Arqueólogo/Arqueóloga', pip: 'Pip', gatobot: 'Gatobot', esponjita: 'Esponjita', capitan: 'Capitán/Capitana Sombrero', kiko: 'Kiko', luna: 'Luna Estelar', estrellapop: 'Estrella Pop', rocky: 'Rocky', mina: 'Idol', mcbeat: 'MC Beat',
  // Exclusivos de eventos.
  cangrejo: 'Cangrejo', topo: 'Topo minero', ardilla: 'Ardilla', osito: 'Osito de gomita', triceratops: 'Triceratops', robodog: 'Perro robot', pulpopintor: 'Pulpo pintor', ranita: 'Ranita rockera', mapache: 'Mapache director/Mapache directora', tamalito: 'Tamalito', taquito: 'Taquito', arbolito: 'Arbolito', pinatita: 'Piñatita', clavelito: 'Clavelito', bigoton: 'Bigotón', atigrado: 'Michi atigrado', dalmata: 'Dálmata', chaneque: 'Chaneque', xologuia: 'Xolo guía', lloronita: 'Lloronita', catrinita: 'Catrín/Catrina', revolucionario: 'Revolucionario/Revolucionaria', audifonos: 'Gamer pro', bichito: 'Bichito', bufoncito: 'Bufoncito', uvita: 'Uvita', xolo: 'Xólotl', reno: 'Reno', reymago: 'Rey Mago/Reina Maga', cupido: 'Cupido', catarina: 'Catarina', foca: 'Foca playera', chihuahua: 'Chihuahua charro', gatobruja: 'Gato brujo/Gata bruja', loro: 'Loro pirata', meteorin: 'Meteorín',
};
// Avatares de las festividades nuevas: su nombre ya viene en festival-art.js (con «/» si cambia para niña).
for (const it of ITEMS.avatar) if (FESTIVALS.some((f) => f.grp && f.key === it.ev)) ONE_NAME[it.k] = it.name;
// El del pasaporte cambia con niño / niña (12 nov 2026).
ONE_NAME.viajerogalactico = 'Explorador galáctico/Exploradora galáctica';
ONE_NAME.auroral = 'Guardián de la aurora/Guardiana de la aurora';
ONE_NAME.cristalino = 'Mago de cristal/Maga de cristal';
for (const it of ITEMS.avatar) {
  const n = ONE_NAME[it.k];
  if (!n) continue;
  delete it.text;
  const [boy, girl = boy] = n.split('/');
  Object.defineProperty(it, 'name', { get: () => (save.kid?.base === 'nina' ? girl : boy), enumerable: true, configurable: true });
}
export const NEED_X = 5, PRICE_UP = 0.02;
const round5 = (n) => Math.round(n / 5) * 5;
for (const list of Object.values(ITEMS))
  for (const it of list) {
    if (!it.need) continue;
    it.need *= NEED_X;
    it.price = round5(it.price * (1 + PRICE_UP * Math.floor(it.need / 10)));
  }
// Caras quitadas (9 nov 2026, el usuario: su fondo dibujado no se apreciaba). Quien la tenía recupera lo que pagó y,
// si la usaba, vuelve a la clásica. Las caras nuevas van con cada personaje (dev/market-avatares.md).
const GONE_FACES = ['luna', 'dorada', 'tmcorazones', 'tmglobos', 'tmgatitos', 'tmperritos'];
for (const k of GONE_FACES) {
  const i = ITEMS.face.findIndex((x) => x.k === k);
  if (i < 0) continue;
  const [it] = ITEMS.face.splice(i, 1);
  if (!save.owned?.[`face:${k}`]) continue;
  delete save.owned[`face:${k}`];
  save.coins = (save.coins || 0) + it.price;
  if (save.equip?.face === k) delete save.equip.face;
  persist();
}
// Lo quitado de la tienda (9 nov 2026): quien lo tenía recupera lo que costaba y, si lo usaba, vuelve al de siempre.
// Naves de otro color (las nuevas van con cada personaje) y reversos muy simples (de Hongos a Perritos: se rehacen).
const GONE = {
  traveler: { cohetementa: 935, ovnidorado: 1830, ovniverde: 1210, globorayas: 1480, satelitedorado: 2175, mantadorada: 3310, avioncielo: 1060 },
  back: { hongos: 650, olas: 840, rayo: 1610, reloj: 2010, anillo: 3610, tmcorazones: 625, tmmariposas: 770, tmverano: 945, tminvierno: 1115, tmtropical: 1320, tmplumas: 1520, tmglobos: 1750, tmlimonada: 1975, tmjardin: 2240, tmgatitos: 2490, tmperritos: 2785 },
};
for (const sec in GONE)
  for (const [k, p] of Object.entries(GONE[sec])) {
    if (!save.owned?.[`${sec}:${k}`]) continue;
    delete save.owned[`${sec}:${k}`];
    save.coins = (save.coins || 0) + p;
    if (save.equip?.[sec] === k) delete save.equip[sec];
    persist();
  }
// Lo que vale un exclusivo (no se compran en la tienda normal): vender da el 70%. Vendido, se recupera hasta que vuelve
// su evento (8 nov 2026: ya no hay tienda de exclusivos pasados).
export const EX_VALUE = { title: 1000, frame: 1300, space: 1600, ring: 2000, avatar: 2600, back: 3000, traveler: 4000, face: 3000 };
export const SELL = 0.7;
export const sellPrice = (sec, it) => round5((it.ev ? EX_VALUE[sec] || 1500 : it.price) * SELL);
// ¿Se puede vender? Lo que tienes y no es gratis ni de código de regalo.
// Los del pasaporte y los secretos tampoco: no vuelven a salir.
export const sellable = (sec, it) => !!it && owns(sec, it.k) && it.price !== 0 && !it.code && !it.logro && !it.pase && !it.secreto;
// Vender: lo quitas de lo tuyo (si lo traías puesto, vuelves al de siempre), te dan las monedas y regresa a su tienda
// (los exclusivos, a su evento).
export function sell(sec, k) {
  const it = item(sec, k);
  if (!sellable(sec, it)) return 0;
  const p = sellPrice(sec, it);
  delete save.owned[`${sec}:${k}`];
  if (sec === 'avatar' && save.char === k) save.look = 'letter';
  if (save.equip[sec] === k) delete save.equip[sec];
  save.coins += p;
  persist();
  return p;
}

export const item = (sec, k) => ITEMS[sec].find((x) => x.k === k);
export const owns = (sec, k) => !!item(sec, k) && (item(sec, k).price === 0 || !!save.owned[`${sec}:${k}`]);
// Lo que se ve en la tienda normal: los exclusivos de colección solo si ya son tuyos (para usarlos).
// La ropa de inicio es una sola ('nino'; la de Lila quedó dentro: cada base la suya), así que 'nina' ya no sale.
export const shopItems = (sec) => ITEMS[sec].filter((it) => (!it.ev || owns(sec, it.k)) && !(sec === 'avatar' && it.k === 'nina'));
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
// cost: lo que se cobra (con la lluvia de meteoritos sale más barato; ver metShopPrice).
export function buy(sec, k, cost = item(sec, k)?.price) {
  const it = item(sec, k);
  if (!it || it.ev || owns(sec, k) || lockedUntil(sec, k) || save.coins < cost) return false;
  save.coins -= cost;
  save.owned[`${sec}:${k}`] = 1;
  equip(sec, k);
  return true;
}

// Cada título se ve distinto: color, icono y forma (los más caros, más vistosos).
const TITLE_ICO = { novato: 'star', explorador: 'flag', cazacometas: 'rocket', maestro: 'trophy', viajero: 'planet', bombas: 'bomb', leyenda: 'crown', buscaconchas: 'concha', cazagemas: 'gema', guardabosques: 'bellota', golosito: 'caramelo', paleontologo: 'fosil', inventor: 'tuerca', tamalero: 'tamal', taquero: 'taco', heroeverde: 'tierra', jugueton: 'pinata', consentido: 'clavel', orgullo: 'corbata', amigomichi: 'gatito', mejoramigo: 'hueso', catrin: 'calavera', duende: 'esfera', buscador: 'rosca', flechazo: 'corazon', jardinero: 'tulipan', olas: 'sol', mariachi: 'sombrero', hechicero: 'calabaza', jefefinal: 'control', cerobugs: 'llaves', bromista: 'bufon', propositos: 'reloj', artista: 'gota', estrellarock: 'nota', director: 'claqueta', nahual: 'nahual', guiaalmas: 'xolito', almadelrio: 'velita', elegancia: 'catrina', valiente: 'locomotora', cazatesoros: 'cofre', cazaestrellas: 'meteoro', perfeccionista: 'crown', imparable: 'flame', artificiero: 'bomb', cazafantasmas: 'ghost', cumplidor: 'check', explorador_secreto: 'starSecret', chispa: 'flame', estratega: 'card', cronista: 'reloj', guardiananillo: 'gema', magocartas: 'wild', invencible: 'trophy' };
for (const s of SETS) TITLE_ICO[s.title[0]] = s.title[2];
Object.assign(TITLE_ICO, festivalTitleIcons(FESTIVALS));
TITLE_ICO.cazasecretos = 'starSecret';
TITLE_ICO.trotamundos = 'pasaporte';
TITLE_ICO.pidedeseo = 'starFall';
TITLE_ICO.luzdelnorte = 'aurora';
export const titleName = (k = equipped('title')) => item('title', k).name;
export const titleIcon = (k) => icon(TITLE_ICO[k] || 'star');
export const titleHTML = (k = equipped('title'), cls = '', tag = 'span', attrs = '') =>
  `<${tag} class="title-chip t-${k} ${cls}" ${attrs}>${icon(TITLE_ICO[k] || 'star')}<span>${titleName(k)}</span></${tag}>`;
