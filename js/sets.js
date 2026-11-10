// Colecciones de personaje (market de avatares, 9 nov 2026): cada avatar de la tienda trae marco, título y nave
// (de cajón) y los más llamativos una pieza extra: cartas (reverso y cara), espacio o postal. Nada repite un premio
// de eventos ni algo de la tienda (pedido del usuario). Plan con todos en dev/market-avatares.html.
// Los dibujos van en art.js (iconos, marcos RINGS, reversos BACKS, avatares) y las naves en travelers.js, con la
// misma clave. Aquí: nombres, colores y el CSS de caras, títulos, espacios y postales (setCSS, al arrancar).
//
// av: avatar · ring/title/trav: [clave, nombre(, icono del título | texto de la nave)] · tc: colores del título
// [arriba, abajo, tinta, orilla] · back: [clave, nombre] · face: marco de la carta (main), sombrita (light), números
// negros (ink) y rojos (red) y una figura por palo en el orden de SUITS de game.js (picas, corazones, diamantes,
// tréboles) · space: cielo [noche, medio, abajo, brillo 1, brillo 2] y figuras sueltas · frame: fondo, banda, figura
// de la orilla y las 2 de las esquinas.
export const SETS = [
  { av: 'nino', ring: ['avnino', 'Brújulas'], title: ['avnino', 'El trotamundos', 'brujula'], tc: ['#7fc8f0', '#4aa8de', '#2f6f9e', '#ffc83d'], trav: ['avnino', 'Brújula voladora', 'Su aguja nunca se pierde'] },
  { av: 'nina', ring: ['avnina', 'Tréboles'], title: ['avnina', 'La exploradora curiosa', 'trebol'], tc: ['#c9a6ff', '#9a6cf0', '#5a3d99', '#7fd36a'], trav: ['avnina', 'Diente de león', 'Suelta semillitas al viento'] },
  { av: 'gato', ring: ['avgato', 'Pescaditos'], title: ['avgato', 'El rey del sillón', 'cojin'], tc: ['#ffb27a', '#ff8a3d', '#b8562a', '#8a5cf0'], trav: ['avgato', 'Cojín volador', 'Flota con sus borlas'],
    back: ['avgato', 'Ratoncito de juguete'], face: { k: 'avgato', name: 'Michi', main: '#ff9c5b', light: '#ffe8d6', ink: '#3a2f6a', red: '#e8455a', figs: ['cojin', 'pescado', 'ratoncito', 'leche'] } },
  { av: 'ajolote', ring: ['avajolote', 'Burbujas de ajolote'], title: ['avajolote', 'El ajolote sonriente', 'burbuja'], tc: ['#ffb8d6', '#ff7ab8', '#c2407e', '#5fd1c5'], trav: ['avajolote', 'Pecera con hélice', 'Con su pececito adentro'],
    space: { k: 'avajolote', name: 'Laguna de noche', sky: ['#0a2a30', '#0f4a4a', '#1f6a5a', '#ff9cc8', '#5fd1c5'], motif: ['nenufar', 'burbuja'] } },
  { av: 'conejo', ring: ['zanahorias', 'Zanahorias'], title: ['conejillo', 'El conejillo de indias', 'zanahoria'], tc: ['#ffad66', '#ff8a3d', '#c4501f', '#5fbf5a'], trav: ['zanahoria', 'Zanahoria cohete', 'Despega moviendo sus hojas'],
    back: ['huerto', 'Huerto'], face: { k: 'huerto', name: 'Huerto', main: '#ff8a3d', light: '#ffe6d0', ink: '#2f6a2a', red: '#e2552a', figs: ['lechuga', 'zanahoria', 'rabano', 'elote'] } },
  { av: 'perrito', ring: ['avperrito', 'Pelotas de tenis'], title: ['avperrito', 'El perrito travieso', 'tenis'], tc: ['#d9b48a', '#b8865a', '#6a4028', '#c8e85a'], trav: ['avperrito', 'Casita voladora', 'Su casita con alas'],
    frame: { k: 'avperrito', name: 'Manta de pelotas', bg: '#fff1dc', band: '#c99a68', tile: 'tenis', corners: ['tenis', 'collar'] } },
  { av: 'zorro', ring: ['avzorro', 'Moras'], title: ['avzorro', 'La zorrita astuta', 'mora'], tc: ['#ff9c5b', '#e2652a', '#8a3a10', '#c9406a'], trav: ['avzorro', 'Bufanda voladora', 'Ondea como alfombra mágica'],
    frame: { k: 'avzorro', name: 'Mantelito de moras', bg: '#fff0f2', band: '#c9406a', tile: 'mora', corners: ['mora', 'frambuesa'] } },
  { av: 'pinguino', ring: ['avpinguino', 'Cubitos de hielo'], title: ['avpinguino', 'El rey del hielo', 'cubohielo'], tc: ['#bfe8ff', '#7fc8f0', '#2f6f9e', '#fff'], trav: ['avpinguino', 'Iglú volador', 'Con su chimenea de hielo'],
    space: { k: 'avpinguino', name: 'Polo sur', sky: ['#081a36', '#123a66', '#2a6a96', '#bfe8ff', '#8fffe0'], motif: ['cubohielo', 'pescado'] } },
  { av: 'panda', ring: ['avpanda', 'Bambú'], title: ['avpanda', 'El panda zen', 'bambu'], tc: ['#9be08a', '#5fbf5a', '#2f6a2a', '#2a1f5c'], trav: ['avpanda', 'Bambú con hélice', 'Sus hojas giran despacio'],
    frame: { k: 'avpanda', name: 'Tallos de bambú', bg: '#f0fbe6', band: '#5fae5a', tile: 'bambu', corners: ['bambu', 'onigiri'] } },
  { av: 'tortuga', ring: ['avtortuga', 'Estrellas de mar'], title: ['avtortuga', 'La tortuga sin prisa', 'estrellamar'], tc: ['#7fe0c8', '#2fbf9a', '#1f7a62', '#ffd27a'], trav: ['avtortuga', 'Isla flotante', 'Con su palmerita'],
    frame: { k: 'avtortuga', name: 'Playa de tortuguitas', bg: '#fff3d6', band: '#2fbf9a', tile: 'tortuguita', corners: ['estrellamar', 'tortuguita'] } },
  { av: 'robot', ring: ['avrobot', 'Foquitos'], title: ['avrobot', 'El robot amigable', 'foco'], tc: ['#c9c4e8', '#9a92c4', '#4a4280', '#5ff0ff'], trav: ['avrobot', 'Lavadora voladora', 'Da vueltas su ropita'] },
  { av: 'pulpo', ring: ['avpulpo', 'Tentáculos'], title: ['avpulpo', 'El pulpo de ocho brazos', 'tentaculo'], tc: ['#b48cff', '#8a5cf0', '#4a2a99', '#ff9cc8'], trav: ['avpulpo', 'Submarino de burbujas', 'Con periscopio y burbujas'],
    space: { k: 'avpulpo', name: 'Abismo de luces', sky: ['#050a24', '#0c1a4a', '#1a2a66', '#5ff0ff', '#b48cff'], motif: ['lucecita', 'pescado'] } },
  { av: 'abeja', ring: ['avabeja', 'Panal con miel'], title: ['avabeja', 'La reina del panal', 'panal'], tc: ['#ffe066', '#ffc83d', '#a86a00', '#2a1f5c'], trav: ['avabeja', 'Girasol volador', 'Gira sus pétalos'],
    back: ['avabeja', 'Panal dorado'], face: { k: 'avabeja', name: 'Miel', main: '#ffc83d', light: '#fff1c4', ink: '#4a3000', red: '#e2652a', figs: ['colmena', 'miel', 'margarita', 'panal'] } },
  { av: 'capibara', ring: ['avcapibara', 'Naranjitas'], title: ['avcapibara', 'El capibara tranquilo', 'naranja'], tc: ['#e8c48a', '#c99a68', '#6a4028', '#ff9c2b'], trav: ['avcapibara', 'Naranja con flotador', 'Flota sin prisa'],
    back: ['avcapibara', 'Naranja tranquila'], face: { k: 'avcapibara', name: 'Capi', main: '#c99a68', light: '#f6ead8', ink: '#3a2a1a', red: '#ff7a1a', figs: ['onda', 'naranja', 'lirio', 'flotador'] } },
  { av: 'astro', ring: ['avastro', 'Órbitas de cadete'], title: ['avastro', 'El cadete espacial', 'casco'], tc: ['#6a5ad8', '#3a2a99', '#1a1250', '#ff5f7e'], trav: ['avastro', 'Cápsula espacial', 'Con paracaídas de colores'],
    space: { k: 'avastro', name: 'Estación espacial', sky: ['#0a0a2a', '#1a1a4a', '#2a2a6a', '#8fe8ff', '#ff9c5b'], motif: ['estacion', 'astronautita'] } },
  { av: 'alien', ring: ['avalien', 'Antenas'], title: ['avalien', 'La visitante de Marte', 'antena'], tc: ['#c8f08a', '#9be86a', '#3a7a1a', '#b48cff'], trav: ['avalien', 'Burbuja marciana', 'Con su plantita de Marte'],
    space: { k: 'avalien', name: 'Cielo de Marte', sky: ['#2a0a10', '#5a1a1a', '#8a3a1a', '#ff8a3d', '#9be86a'], motif: ['roca', 'antena'] } },
  { av: 'dino', ring: ['avdino', 'Huevos de dino'], title: ['avdino', 'El dino glotón', 'pastel'], tc: ['#9be08a', '#5fbf5a', '#2f6a2a', '#ff7ab8'], trav: ['avdino', 'Helecho volador', 'Se dobla con el viento'],
    back: ['avdino', 'Pastel de dino'], face: { k: 'avdino', name: 'Pepo', main: '#5fbf5a', light: '#e6f8d8', ink: '#1f4a1a', red: '#e8455a', figs: ['helecho', 'pastel', 'manzana', 'huevo'] } },
  { av: 'fantasma', ring: ['avfantasma', 'Linternas'], title: ['avfantasma', 'El fantasma miedoso', 'linterna'], tc: ['#e3dcff', '#c9bff0', '#5a4a99', '#ffd27a'], trav: ['avfantasma', 'Sábana voladora', 'Ondea y se asusta sola'],
    frame: { k: 'avfantasma', name: 'Sábana con parches', bg: '#f6f2ff', band: '#c9bff0', tile: 'parche', corners: ['linterna', 'parche'] } },
  { av: 'estrella', ring: ['avestrella', 'Lunitas'], title: ['avestrella', 'La estrella fugaz', 'lunita'], tc: ['#ffe58a', '#ffc83d', '#a86a00', '#8a5cf0'], trav: ['avestrella', 'Columpio de luna', 'Se mece entre estrellas'],
    frame: { k: 'avestrella', name: 'Deseo a una estrella', bg: '#2a1f66', band: '#ffc83d', tile: 'lunita', corners: ['lunita', 'deseo'] } },
  { av: 'buho', ring: ['avbuho', 'Libros'], title: ['avbuho', 'El búho sabio', 'libro'], tc: ['#d9b48a', '#a87650', '#4a2a10', '#4aa8de'], trav: ['avbuho', 'Libro volador', 'Aletea con sus hojas'],
    frame: { k: 'avbuho', name: 'Página de libro viejo', bg: '#f6e8c8', band: '#a87650', tile: 'libro', corners: ['libro', 'lentes'] } },
  { av: 'sirena', ring: ['avsirena', 'Perlas'], title: ['avsirena', 'La sirena del arrecife', 'perla'], tc: ['#9ff0e6', '#5fd1c5', '#1f7a72', '#ff9cc8'], trav: ['avsirena', 'Caracol gigante', 'Navega en espiral'],
    space: { k: 'avsirena', name: 'Mar de medusas', sky: ['#061a36', '#0a3a5e', '#126a7e', '#ff9cc8', '#8fffe0'], motif: ['medusita', 'perla'] } },
  { av: 'vampiro', ring: ['avvampiro', 'Murciélagos'], title: ['avvampiro', 'El conde de la noche', 'colmillo'], tc: ['#c2405e', '#8a1f3a', '#3a0a1a', '#ffd27a'], trav: ['avvampiro', 'Ataúd volador', 'Se abre y se cierra'],
    back: ['avvampiro', 'Luna del conde'], face: { k: 'avvampiro', name: 'Vladi', main: '#8a1f3a', light: '#f6dce2', ink: '#2a0a1a', red: '#d6203f', figs: ['murci', 'rosa', 'colmillo', 'capa'] } },
  { av: 'dragoncito', ring: ['avdragoncito', 'Llamitas'], title: ['avdragoncito', 'El dragón chispeante', 'llama'], tc: ['#ff9c5b', '#ff6b3d', '#8a2a10', '#ffc83d'], trav: ['avdragoncito', 'Huevo de dragón con alas', 'Sus alitas lo levantan'],
    back: ['avdragoncito', 'Huevo de dragón'], face: { k: 'avdragoncito', name: 'Chispa', main: '#ff6b3d', light: '#ffe2d6', ink: '#3a1a10', red: '#d6203f', figs: ['escama', 'llama', 'huevodrago', 'oro'] } },
  { av: 'unicornio', ring: ['avunicornio', 'Nubecitas'], title: ['avunicornio', 'La unicornio de arcoíris', 'cuerno'], tc: ['#ffc2dc', '#ff9cc8', '#c2407e', '#b48cff'], trav: ['avunicornio', 'Carroza de cristal', 'Brilla al volar'],
    space: { k: 'avunicornio', name: 'Cielo de nubes rosas', sky: ['#2a1040', '#5a2a6a', '#8a4a8a', '#ffc2dc', '#c9a6ff'], motif: ['nubecita', 'cuerno'] } },
  { av: 'ninja', ring: ['avninja', 'Estrellas ninja'], title: ['avninja', 'La sombra silenciosa', 'shuriken'], tc: ['#5a5a7a', '#2a2a40', '#0a0a1a', '#ff5f7e'], trav: ['avninja', 'Nube de humo ninja', 'Aparece y desaparece'],
    back: ['avninja', 'Estrella ninja'], face: { k: 'avninja', name: 'Kage', main: '#2a2a40', light: '#ecebf2', ink: '#1a1a2a', red: '#e8455a', figs: ['shuriken', 'sakura', 'abanico', 'mascara'] } },
  { av: 'voltio', ring: ['avvoltio', 'Pilas'], title: ['avvoltio', 'El ratón de alto voltaje', 'pila'], tc: ['#fff08a', '#ffd23d', '#8a6a00', '#4aa8de'], trav: ['avvoltio', 'Esfera eléctrica', 'Se abre con un chispazo'],
    back: ['avvoltio', 'Queso con chispas'], face: { k: 'avvoltio', name: 'Voltio', main: '#ffd23d', light: '#fff6c4', ink: '#2a2a6a', red: '#e2652a', figs: ['pila', 'queso', 'rayito', 'enchufe'] } },
  { av: 'tic', ring: ['avtic', 'Engranes'], title: ['avtic', 'El dueño del tiempo', 'engrane'], tc: ['#e8b86a', '#c4900f', '#5a3a00', '#2fb6a0'], trav: ['avtic', 'Reloj de bolsillo', 'Su tapa se abre y cierra'],
    frame: { k: 'avtic', name: 'Engranes de bronce', bg: '#fbf0d8', band: '#c4900f', tile: 'engrane', corners: ['engrane', 'arenita'] } },
  { av: 'guardian', ring: ['avguardian', 'Escudos'], title: ['avguardian', 'El escudo de hierro', 'escudo'], tc: ['#8fd47a', '#56b83a', '#245a1a', '#ffc83d'], trav: ['avguardian', 'Escudo volador', 'Gira despacio'] },
  { av: 'mago', ring: ['avmago', 'Chispas mágicas'], title: ['avmago', 'El sabio de las estrellas', 'varita'], tc: ['#7fc8f0', '#2f86c0', '#1a3a6a', '#ffc83d'], trav: ['avmago', 'Bola de cristal', 'Con estrellas que giran adentro'],
    space: { k: 'avmago', name: 'Cielo encantado', sky: ['#0a0a30', '#1a1a5a', '#2a3a8a', '#8fd6ff', '#ffd27a'], motif: ['varita', 'pocion'] } },
  { av: 'caballero', ring: ['avcaballero', 'Galletas'], title: ['avcaballero', 'El caballero de la galleta', 'galleta'], tc: ['#ff7a8a', '#c22c49', '#5a0a1a', '#ffc83d'], trav: ['avcaballero', 'Caballo de galleta', 'Galopa por el aire'],
    back: ['avcaballero', 'Galleta real'], face: { k: 'avcaballero', name: 'Sir Galleta', main: '#c22c49', light: '#fbe0e4', ink: '#2a1f5c', red: '#d6203f', figs: ['espada', 'galleta', 'escudo', 'yelmo'] } },
  // Nuevos (9 nov 2026): inspirados en personajes famosos sin copiarlos (sin nombres, marcas ni diseños exactos).
  { av: 'profe', ring: ['avprofe', 'Bobinas'], title: ['avprofe', 'El genio despeinado', 'relampago'], tc: ['#c9d6e8', '#8aa0bf', '#2a3a5a', '#ffd23d'], trav: ['avprofe', 'Auto del tiempo', 'Deja rastro de fuego'],
    back: ['avprofe', 'Torre del reloj'], face: { k: 'avprofe', name: 'Profe Voltaje', main: '#6a7f9a', light: '#e6ecf4', ink: '#1a2a4a', red: '#e2552a', figs: ['bobina', 'relampago', 'llantafuego', 'relojtorre'] } },
  { av: 'turbo', ring: ['avturbo', 'Huellas de fuego'], title: ['avturbo', 'El que llegó del futuro', 'patineta'], tc: ['#ff8a8a', '#ff5f6a', '#8a1a2a', '#5ff0ff'], trav: ['avturbo', 'Patineta flotante', 'Flota sin llantas'],
    space: { k: 'avturbo', name: 'Ciudad del futuro', sky: ['#120a30', '#2a1a5a', '#5a2a7a', '#ff5fd1', '#5ff0ff'], motif: ['autito', 'patineta'] } },
  { av: 'papaya', ring: ['avpapaya', 'Banderas a cuadros'], title: ['avpapaya', 'El rey de la pista', 'bandera'], tc: ['#ffb066', '#ff8a1a', '#8a3a00', '#2a1f5c'], trav: ['avpapaya', 'Auto de carreras', 'Con su alerón'],
    back: ['avpapaya', 'Casco de carreras'], face: { k: 'avpapaya', name: 'Papaya', main: '#ff8a1a', light: '#ffe8d0', ink: '#1a1a3a', red: '#e2552a', figs: ['llanta', 'cascocarrera', 'copa', 'bandera'] } },
  { av: 'cora', ring: ['avcora', 'Antorchas'], title: ['avcora', 'La arqueóloga sin miedo', 'antorcha'], tc: ['#e8c07a', '#c98a3a', '#5a3a10', '#2fb6a0'], trav: ['avcora', 'Carrito de mina', 'Vuela sobre sus rieles'],
    frame: { k: 'avcora', name: 'Jeroglíficos', bg: '#f3dca6', band: '#c98a3a', tile: 'jeroglifico', corners: ['antorcha', 'jeroglifico'] } },
  // 9 nov 2026, segunda tanda (el usuario: "más de esos": anime, caricaturas y cantantes), igual: sin copiar.
  { av: 'pip', ring: ['avpip', 'Aventuras'], title: ['avpip', 'El héroe del gorro', 'gorrooso'], tc: ['#9fd8ff', '#4aa8de', '#1f4f8a', '#7fd36a'], trav: ['avpip', 'Mochila voladora', 'Con hélice y todo'],
    frame: { k: 'avpip', name: 'Mapa de aventuras', bg: '#f3e6c4', band: '#4aa8de', tile: 'gorrooso', corners: ['mochila', 'espadita'] } },
  { av: 'gatobot', ring: ['avgatobot', 'Cascabeles del futuro'], title: ['avgatobot', 'El gato de los inventos', 'campanita'], tc: ['#8fd6ff', '#2f9ee0', '#1a4a8a', '#e8434f'], trav: ['avgatobot', 'Gorrito hélice', 'Gira y gira sin parar'],
    space: { k: 'avgatobot', name: 'Cielo de inventos', sky: ['#0a1a40', '#1a3a7a', '#2f6aa8', '#8fd6ff', '#ffd23d'], motif: ['campanita', 'gorrohelice'] } },
  { av: 'esponjita', ring: ['avesponjita', 'Burbujas del mar'], title: ['avesponjita', 'La esponja más alegre', 'pina'], tc: ['#ffc2d0', '#ff9cb4', '#a83a5a', '#4aa8de'], trav: ['avesponjita', 'Hamburguesa voladora', 'Con todo y queso'],
    back: ['avesponjita', 'Casa de piña'], face: { k: 'avesponjita', name: 'Esponjita', main: '#ffd23d', light: '#fff6c4', ink: '#1f4f8a', red: '#e8434f', figs: ['redmedusa', 'hamburguesa', 'pina', 'burbuja'] } },
  { av: 'capitan', ring: ['avcapitan', 'Cuerda de barco'], title: ['avcapitan', 'El capitán risueño', 'sombreropaja'], tc: ['#ffe08a', '#e8b84a', '#7a4a10', '#e8434f'], trav: ['avcapitan', 'Balsa con vela', 'Su vela lleva un sol'],
    back: ['avcapitan', 'Balsa en el mar'], face: { k: 'avcapitan', name: 'Capitán', main: '#e8434f', light: '#ffe0e4', ink: '#1a2a5a', red: '#d6203f', figs: ['ancla', 'sombreropaja', 'carne', 'timon'] } },
  { av: 'kiko', ring: ['avkiko', 'Aura de energía'], title: ['avkiko', 'El guerrero de las nubes', 'nubedorada'], tc: ['#ffb066', '#ff8a1a', '#8a3a00', '#4aa8de'], trav: ['avkiko', 'Nube dorada', 'Siempre lista para volar'],
    space: { k: 'avkiko', name: 'Torneo en las nubes', sky: ['#3a1a10', '#8a3a1a', '#d97a2a', '#ffd23d', '#8fd6ff'], motif: ['nubedorada', 'energia'] } },
  { av: 'luna', ring: ['avluna', 'Lunas y listones'], title: ['avluna', 'La guardiana de la luna', 'brochelunar'], tc: ['#ffd6e6', '#ff9cc8', '#a8306a', '#ffd23d'], trav: ['avluna', 'Broche lunar', 'Vuela con sus alitas'],
    space: { k: 'avluna', name: 'Reino de la luna', sky: ['#120a36', '#2a1a6a', '#5a3a9a', '#ffc2dc', '#ffe58a'], motif: ['brochelunar', 'corazonestrella'] } },
  { av: 'estrellapop', ring: ['avestrellapop', 'Lentejuelas'], title: ['avestrellapop', 'La estrella del escenario', 'micro'], tc: ['#ffb8e6', '#e86ac8', '#7a1a6a', '#ffd23d'], trav: ['avestrellapop', 'Micrófono volador', 'Brilla con su luz'],
    frame: { k: 'avestrellapop', name: 'Luces de concierto', bg: '#2a1a4a', band: '#e86ac8', tile: 'lentejuela', corners: ['micro', 'discooro'] } },
  { av: 'rocky', ring: ['avrocky', 'Púas de guitarra'], title: ['avrocky', 'El rey del rock', 'guitarra'], tc: ['#6a6a8a', '#2a2a40', '#0a0a1a', '#e8434f'], trav: ['avrocky', 'Guitarra voladora', 'Suenan sus cuerdas'],
    back: ['avrocky', 'Escenario de rock'], face: { k: 'avrocky', name: 'Rocky', main: '#2a2a40', light: '#ecebf2', ink: '#1a1a2a', red: '#e8434f', figs: ['manorock', 'guitarra', 'pua', 'ampli'] } },
  { av: 'mina', ring: ['avmina', 'Corazones de idol'], title: ['avmina', 'La idol de corazón', 'varaluz'], tc: ['#e6c8ff', '#b48cff', '#5a3d99', '#ff9cc8'], trav: ['avmina', 'Varita de luz', 'Brilla al ritmo'],
    back: ['avmina', 'Concierto de corazones'], face: { k: 'avmina', name: 'Mina', main: '#b48cff', light: '#f3eaff', ink: '#3a2a6a', red: '#ff5f9e', figs: ['casete', 'dedocorazon', 'lazo', 'varaluz'] } },
  { av: 'mcbeat', ring: ['avmcbeat', 'Bocinas'], title: ['avmcbeat', 'El rey del ritmo', 'vinilo'], tc: ['#7fe0c8', '#2fb6a0', '#0f5a4a', '#ffd23d'], trav: ['avmcbeat', 'Bocina voladora', 'Retumba con el ritmo'],
    frame: { k: 'avmcbeat', name: 'Grafiti', bg: '#e6e6f0', band: '#2fb6a0', tile: 'vinilo', corners: ['bocina', 'gorra'] } },
];
// Cada pieza con su lugar en la tienda: { sec, k, name, text?, set } (precio y candado salen del avatar en shop.js).
// Lo que cuesta cada pieza contra su avatar (los que son gratis cuentan como uno de 300).
// "Llevarte todo" en la ficha del personaje: lo que le falta de su colección, con esto de descuento.
export const SET_DEAL = 0.25;
export const SET_PRICE = { ring: 1.25, title: 0.85, traveler: 2.8, back: 2.1, face: 1.8, space: 2, frame: 1.25 };
export function setItems() {
  const out = [];
  for (const s of SETS) {
    out.push({ sec: 'ring', k: s.ring[0], name: s.ring[1], set: s.av });
    out.push({ sec: 'title', k: s.title[0], name: s.title[1], set: s.av });
    out.push({ sec: 'traveler', k: s.trav[0], name: s.trav[1], text: s.trav[2], set: s.av });
    if (s.back) out.push({ sec: 'back', k: s.back[0], name: s.back[1], set: s.av });
    if (s.face) out.push({ sec: 'face', k: s.face.k, name: s.face.name, set: s.av });
    if (s.space) out.push({ sec: 'space', k: s.space.k, name: s.space.name, set: s.av });
    if (s.frame) out.push({ sec: 'frame', k: s.frame.k, name: s.frame.name, set: s.av });
  }
  return out;
}
export const setOf = (av) => SETS.find((s) => s.av === av);

// Ventana del perfil por marco (9 nov 2026; el usuario: "antes estaban más personalizados"): cada uno con su receta
// como los de la tienda y eventos. [cabecera, orilla, estilo de orilla, sombra de la cabecera, fondo, sticker].
// El sticker es una figura del personaje en la esquina izquierda de la cabecera, dentro de la barra (10 nov 2026: antes
// se salía por arriba y en horizontal se encimaba).
const G = (a, b) => `linear-gradient(${a}, ${b})`;
const SH = (a, b) => `linear-gradient(100deg, ${a}, ${b} 50%, ${a})`;
const ST = (a, b, w = 12, deg = -45) => `repeating-linear-gradient(${deg}deg, ${a} 0 ${w}px, ${b} ${w}px ${2 * w}px)`;
const BANDS = (...cs) => `linear-gradient(90deg, ${cs.map((c, i) => `${c} ${(i * 100) / cs.length}% ${((i + 1) * 100) / cs.length}%`).join(', ')})`;
const DOT = (c, size = 34, r = 3.4) => `radial-gradient(circle at ${size / 3}px ${size / 3}px, ${c} ${r}px, transparent ${r + 1}px) 0 0 / ${size}px ${size}px`;
const LINES = (c, gap = 24, deg = 0, w = 2) => `repeating-linear-gradient(${deg}deg, #0000 0 ${gap}px, ${c} ${gap}px ${gap + w}px)`;
const GRID = (c, gap = 20) => `${LINES(c, gap - 1, 90, 1)}, ${LINES(c, gap - 1, 0, 1)}`;
const CHECK = (c, size = 26) => `conic-gradient(from 45deg, ${c} 25%, #0000 0 50%, ${c} 0 75%, #0000 0) 0 0 / ${size}px ${size}px`;
const RINGS = (c, gap = 22, at = '0 0') => `repeating-radial-gradient(circle at ${at}, #0000 0 ${gap}px, ${c} ${gap}px ${gap + 1.5}px)`;
const WAVES = (c) => `radial-gradient(circle at 50% 0, #0000 9px, ${c} 10px 11.5px, #0000 12.5px) 0 0 / 26px 16px`;
const MR = {
  avnino: [SH('#4aa8de', '#8fd6ff'), '#ffc83d', 'solid', '#2f6f9e', GRID('#dceefa', 24), 'brujula'],
  avnina: [G('#c9a6ff', '#8a5cf0'), '#7fd36a', 'dashed', '#5a3d99', DOT('#e6f6dc', 30), 'trebol'],
  avgato: [ST('#ff9c5b', '#ffb27a', 10, 90), '#8a5cf0', 'solid', '#b8562a', DOT('#ffe8d6', 36, 4), 'pescado'],
  avajolote: [SH('#ff7ab8', '#ffc2dc'), '#5fd1c5', 'solid', '#c2407e', `radial-gradient(circle at 10px 10px, #ffe0f0 5px, transparent 6px) 0 0 / 44px 44px, radial-gradient(circle at 30px 30px, #dff8f4 3px, transparent 4px) 0 0 / 44px 44px`, 'burbuja'],
  zanahorias: [G('#7fd36a', '#4fae5a'), '#ff8a3d', 'solid', '#2f7a3a', LINES('#e8f6dc', 18, 90, 6), 'zanahoria'],
  avperrito: [G('#d9b48a', '#a87650'), '#c8e85a', 'solid', '#6a4028', CHECK('#f6ead8', 30), 'tenis'],
  avzorro: [SH('#e2652a', '#ff9c5b'), '#c9406a', 'solid', '#8a3a10', DOT('#ffe0ea', 32, 3), 'mora'],
  avpinguino: [G('#bfe8ff', '#7fc8f0'), '#fff', 'solid', '#2f6f9e', `radial-gradient(2px 2px at 20% 30%, #9fd8ff, transparent), radial-gradient(2.4px 2.4px at 70% 70%, #bfe8ff, transparent) 0 0 / 50px 50px`, 'cubohielo'],
  avpanda: [ST('#5fbf5a', '#7fd36a', 16, 90), '#2a1f5c', 'solid', '#2f6a2a', LINES('#e6f6dc', 34, 90, 5), 'bambu'],
  avtortuga: [G('#7fe0c8', '#2fbf9a'), '#ffd27a', 'dashed', '#1f7a62', WAVES('#d6f6ee'), 'estrellamar'],
  avrobot: [G('#c9c4e8', '#8f88c0'), '#5ff0ff', 'dotted', '#4a4280', GRID('#e6eaf6', 18), 'foco'],
  avpulpo: [SH('#6c3fd4', '#b48cff'), '#ff9cc8', 'solid', '#3a1f7a', `radial-gradient(circle at 12px 12px, #f0e6ff 5px, transparent 6px) 0 0 / 30px 46px`, 'tentaculo'],
  avabeja: [ST('#ffc83d', '#2a2a40', 10, 0), '#ffc83d', 'solid', '#8a6a00', `conic-gradient(from 30deg, #fff1c4 33%, #0000 0 66%, #fff1c4 0) 0 0 / 22px 38px`, 'panal'],
  avcapibara: [G('#e8c48a', '#c99a68'), '#ff9c2b', 'solid', '#6a4028', WAVES('#e0f4ff'), 'naranja'],
  avastro: [G('#3a2a99', '#1a1250'), '#8fe8ff', 'dashed', '#0a0a3a', `radial-gradient(1.6px 1.6px at 20% 30%, #c9bff0, transparent), radial-gradient(2px 2px at 70% 60%, #ffd77a, transparent) 0 0 / 70px 70px`, 'casco'],
  avalien: [SH('#9be86a', '#d8ff9a'), '#b48cff', 'dotted', '#3a7a1a', RINGS('#ecffd8', 18, '100% 100%'), 'antena'],
  avdino: [G('#7fd36a', '#3f9a46'), '#ff9c5b', 'solid', '#1f4a1a', `radial-gradient(ellipse 5px 7px at 50% 50%, #e6f8d8 4px, transparent 5px) 0 0 / 32px 40px`, 'huevo'],
  avfantasma: [G('#e3dcff', '#b9a6ff'), '#ffd27a', 'dashed', '#5a4a99', `radial-gradient(3px 3px at 30% 30%, #fff6c8, transparent) 0 0 / 46px 46px`, 'linterna'],
  avestrella: [SH('#ffb31a', '#ffe58a'), '#8a5cf0', 'solid', '#a86a00', `radial-gradient(2px 2px at 30% 30%, #ffd77a, transparent), radial-gradient(1.4px 1.4px at 70% 80%, #c9bff0, transparent) 0 0 / 40px 40px`, 'lunita'],
  avbuho: [G('#a87650', '#6a4028'), '#4aa8de', 'solid', '#3a2410', LINES('#f2e6cc', 22, 0, 1.5), 'libro'],
  avsirena: [SH('#2fbfb0', '#9ff0e6'), '#ff9cc8', 'solid', '#1f7a72', `radial-gradient(circle at 50% 100%, #0000 8px, #d6f6f2 9px 10.5px, #0000 11.5px) 0 0 / 20px 12px`, 'perla'],
  avvampiro: [G('#5a1a3a', '#2a0a1a'), '#e8203f', 'solid', '#1a0010', DOT('#f6dce2', 40, 3), 'murci'],
  avdragoncito: [SH('#d6452a', '#ff9c5b'), '#ffc83d', 'solid', '#8a2a10', `radial-gradient(circle at 50% 100%, #0000 8px, #ffe2d6 9px 11px, #0000 12px) 0 0 / 22px 14px`, 'llama'],
  avunicornio: [BANDS('#ff9cc8', '#ffc2dc', '#c9a6ff', '#8fd6ff', '#fff0a8'), '#ff9cc8', 'solid', '#c2407e', `radial-gradient(4px 3px at 30% 30%, #ffe0f0, transparent), radial-gradient(4px 3px at 70% 70%, #e6e0ff, transparent) 0 0 / 50px 50px`, 'cuerno'],
  avninja: [G('#2a2a40', '#0a0a1a'), '#e8434f', 'solid', '#000', LINES('#ecebf2', 30, -45, 2), 'shuriken'],
  avvoltio: [ST('#ffd23d', '#ffe680', 12, -60), '#4aa8de', 'solid', '#8a6a00', `radial-gradient(circle at 12px 12px, #fff3a8 5px, transparent 6px) 0 0 / 34px 34px`, 'rayito'],
  avtic: [SH('#c4900f', '#e8c07a'), '#2fb6a0', 'dotted', '#5a3a00', RINGS('#f6e6c4', 20, '50% 50%'), 'engrane'],
  avguardian: [G('#56b83a', '#2f7a3a'), '#d9dde8', 'solid', '#1f4a1a', CHECK('#e6f8d8', 28), 'escudo'],
  avmago: [G('#2f86c0', '#1a3a6a'), '#ffc83d', 'dashed', '#0a2040', `radial-gradient(2px 2px at 25% 25%, #ffd77a, transparent), radial-gradient(1.6px 1.6px at 75% 60%, #8fd6ff, transparent) 0 0 / 54px 54px`, 'varita'],
  avcaballero: [ST('#c22c49', '#ffc83d', 18, 90), '#ffc83d', 'solid', '#5a0a1a', CHECK('#fbe0e4', 34), 'galleta'],
  avprofe: [G('#8aa0bf', '#4a5a7a'), '#ffd23d', 'dashed', '#2a3a5a', GRID('#e6ecf4', 22), 'relampago'],
  avturbo: [SH('#ff5f6a', '#ff5fd1'), '#5ff0ff', 'solid', '#8a1a2a', LINES('#ffe2ee', 14, -20, 2), 'patineta'],
  avpapaya: [`repeating-conic-gradient(#2a1f5c 0 25%, #fff 0 50%) 0 0 / 16px 16px`, '#ff8a1a', 'solid', '#8a3a00', LINES('#ffe8d0', 16, 70, 3), 'cascocarrera'],
  avcora: [G('#c98a3a', '#8a5a2a'), '#2fb6a0', 'solid', '#5a3a10', `${LINES('#f3dca6', 26, 0, 3)}, ${LINES('#f3dca6', 44, 90, 3)}`, 'antorcha'],
  avpip: [G('#7fc8f0', '#4aa8de'), '#7fd36a', 'solid', '#1f4f8a', DOT('#e0f2ff', 34, 4), 'mochila'],
  avgatobot: [G('#2f9ee0', '#1a6ab8'), '#e8434f', 'solid', '#1a4a8a', DOT('#dfefff', 30, 5), 'campanita'],
  avesponjita: [G('#ffc2d0', '#ff9cb4'), '#4aa8de', 'solid', '#a83a5a', `radial-gradient(circle at 8px 10px, #ffe0e8 3px, transparent 4px), radial-gradient(circle at 24px 26px, #ffe0e8 4px, transparent 5px) 0 0 / 36px 36px`, 'hamburguesa'],
  avcapitan: [ST('#e8434f', '#fff', 14, 0), '#c98a3a', 'dashed', '#8a1a24', WAVES('#dceefa'), 'sombreropaja'],
  avkiko: [SH('#ff8a1a', '#ffd23d'), '#4aa8de', 'solid', '#8a3a00', RINGS('#ffe8c4', 16, '50% 0'), 'nubedorada'],
  avluna: [G('#ff9cc8', '#e86aa8'), '#ffd23d', 'solid', '#a8306a', `radial-gradient(2px 2px at 30% 30%, #ffd77a, transparent), radial-gradient(3px 3px at 70% 70%, #ffd6ec, transparent) 0 0 / 46px 46px`, 'brochelunar'],
  avestrellapop: [`linear-gradient(100deg, #e86ac8, #ffb8e6 30%, #8a5cf0 60%, #e86ac8)`, '#ffd23d', 'dotted', '#7a1a6a', `radial-gradient(2px 2px at 30% 30%, #ffb8e6, transparent), radial-gradient(2.4px 2.4px at 70% 60%, #ffe58a, transparent) 0 0 / 34px 34px`, 'micro'],
  avrocky: [G('#2a2a40', '#0a0a1a'), '#e8434f', 'dashed', '#000', `repeating-linear-gradient(-30deg, #0000 0 20px, #f2e6ec 20px 22px, #0000 22px 26px, #f2e6ec 26px 27px)`, 'guitarra'],
  avmina: [BANDS('#c9a6ff', '#ff9cc8', '#8fd6ff', '#c9a6ff'), '#ff9cc8', 'solid', '#5a3d99', DOT('#f3eaff', 28, 3), 'varaluz'],
  avmcbeat: [G('#2fb6a0', '#1f7a6a'), '#ffd23d', 'solid', '#0f4a3a', `${LINES('#ddf6f0', 10, 0, 2)}, ${CHECK('#0000', 2)}`, 'vinilo'],
};
const svgURL = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
// Figuras sueltas del fondo del espacio: estrellitas y 6 figuras en un cuadro de 680×600, como los de eventos.
function spaceTile(sp, inner) {
  const dots = [[41, 54, 1.1], [109, 216, 0.8], [197, 102, 1.3], [265, 36, 0.8], [299, 192, 1], [150, 270, 0.8], [20, 156, 1], [224, 246, 0.8], [420, 400, 1.1], [600, 120, 0.9], [560, 480, 1.2], [330, 560, 0.8]];
  const figs = [[132, 122, 0], [502, 312, 1], [232, 452, 0], [452, 72, 1], [592, 527, 0], [60, 330, 1]];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="600">${dots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('')}${figs.map(([x, y, i], n) => `<svg x="${x}" y="${y}" width="34" height="34" viewBox="0 0 32 32"><g transform="rotate(${(n % 3) * 14 - 14} 16 16)">${inner(sp.motif[i])}</g></svg>`).join('')}</svg>`;
}
const one = (inner, ico, bg = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${bg}${inner(ico)}</svg>`;

// CSS de las colecciones (se agrega una vez al arrancar, como themeCSS). url(icono, opacidad) e inner(icono) vienen
// de art.js. Las caras sin fondo dibujado (pedido del usuario): se distinguen por el marco de color y sus figuras.
export function setCSS(url, inner) {
  const css = [];
  for (const s of SETS) {
    const [a, b, d, o] = s.tc, t = `.title-chip.t-${s.title[0]}`;
    // La ventana del perfil toma la personalidad del marco (como los de la tienda y eventos: .modal.mr-*): orilla de
    // su color, cabecera con el degradado de su título y su figura repetida, muy suave, de fondo.
    const mr = MR[s.ring[0]];
    if (mr) {
      const [head, line, style, dark, bg, sticker] = mr, sel = `.modal.mr-${s.ring[0]}`;
      css.push(`${sel} { --mr: ${line}; --mrh: ${head}; --mrd: ${dark}; outline-style: ${style}; ${style === 'solid' ? '' : 'outline-width: 5px;'} background: ${bg}, var(--cream); }`);
      css.push(`${sel} > .mhead::before { content: ''; position: absolute; left: 12px; top: 6px; z-index: 4; width: 38px; height: 38px; pointer-events: none; background: ${url(sticker, 1)} center / contain no-repeat; rotate: -14deg; animation: mr-sticker 2.6s ease-in-out infinite; }`);
    }
    css.push(`${t} { --tc: #fff; --td: ${d}; background: linear-gradient(${a}, ${b}); font-family: 'Lilita One'; font-weight: 400; text-shadow: 0 1.5px 0 ${d}; box-shadow: inset 0 -3px 0 ${o}; } ${t} span { -webkit-text-stroke: 3px var(--td); paint-order: stroke fill; }`);
    if (s.face) {
      const f = s.face, sel = `.face-${f.k} .front:not(.face-prev:not(.face-${f.k}) .front)`;
      css.push(`${sel}:not(.wild):not(.arrowed):not(.live) { color: ${f.ink}; background: #fffdf7; box-shadow: inset 0 0 0 2px var(--ink), inset 0 0 0 calc(var(--cw) * 0.06) ${f.main}, inset 0 0 0 calc(var(--cw) * 0.075) #fff, inset 0 calc(var(--cw) * -0.12) 0 ${f.light}, 2px 4px 0 #0b062a33, 4px 9px 12px #0b062a40; }`);
      css.push(`${sel}.red:not(.arrowed):not(.live) { color: ${f.red}; }`);
      f.figs.forEach((ico, i) => css.push(`${sel} .cs.s${i}:not(.coin-cs) { background: ${url(ico, 1)} center / contain no-repeat; scale: 1.25; } ${sel} .cs.s${i}:not(.coin-cs) .suit { visibility: hidden; }`));
    }
    if (s.space) {
      const p = s.space, [n, m, lo, g1, g2] = p.sky;
      css.push(`.space-${p.k} { --sky: radial-gradient(60% 45% at 20% 105%, ${g1}38, transparent 70%), radial-gradient(50% 40% at 85% 0%, ${g2}30, transparent 70%), linear-gradient(180deg, ${n} 0%, ${m} 55%, ${lo} 100%); }`);
      css.push(`.space-${p.k} .space:not(:is(.space-prev, .pf-hero):not(.space-${p.k}) .space)::after, .space.space-${p.k}::after { opacity: .85; background-size: 680px 600px; background-image: ${svgURL(spaceTile(p, inner))}; }`);
    }
    if (s.frame) {
      const f = s.frame;
      const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><rect width="26" height="26" fill="${f.bg}"/><circle cx="0" cy="0" r="2" fill="${f.band}"/><circle cx="26" cy="26" r="2" fill="${f.band}"/><circle cx="26" cy="0" r="2" fill="${f.band}"/><circle cx="0" cy="26" r="2" fill="${f.band}"/><svg x="5" y="5" width="16" height="16" viewBox="0 0 32 32">${inner(f.tile)}</svg></svg>`;
      css.push(`.postcard.fr-${f.k} { padding: 20px 22px 18px 18px; box-shadow: inset 0 0 0 14px ${f.bg}, inset 0 0 0 16px ${f.band}, 0 4px 0 var(--ink); }`);
      css.push(`.postcard.fr-${f.k}::after { content: ''; position: absolute; inset: 3px; border-radius: 11px; padding: 9px; pointer-events: none; z-index: 1; -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; --ring: 1; background: ${svgURL(tile)} 0 0 / 26px 26px; }`);
      css.push(`.postcard.fr-${f.k}::before { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 2; background: ${svgURL(one(inner, f.corners[0]))} left 2px top 2px / 36px no-repeat, ${svgURL(one(inner, f.corners[1]))} right 2px bottom 2px / 36px no-repeat; }`);
    }
  }
  return css.join('\n');
}
