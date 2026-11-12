// Eventos (Fase 6): la racha diaria, la colección semanal y el evento del mes.
// Racha: cuenta las estrellas de victorias seguidas en niveles nuevos (desde el 7 nov 2026; antes 1 por victoria). Perder o abandonar uno nuevo, o rendirse
// en uno repetido, la regresa a 0. A medianoche (hora del teléfono) empieza otra. Siempre es la racha cohete (cambiar
// de temática cada día confundía, porque la colección también tiene temáticas). Los premios se reclaman a mano:
// los reclamados son tuyos; los que no, se pierden si la racha se reinicia o si pasa la medianoche.
import { save, persist } from './storage.js';
import { constUp } from './economy.js';
import { EVENT_LEVELS, EVENT_PER_PLANET, EVENT_PLANETS, FESTIVAL_LEVELS, FESTIVAL_PER_PLANET, FESTIVAL_PLANETS } from './levels.js';

// Los eventos se abren poco a poco, según los niveles ganados (save.next): primero la racha, luego la colección
// y al final el evento del mes (el más difícil: pide comodines). Cada uno se presenta una vez (save.intro).
// col2: al nivel 100 se suman las colecciones nuevas y hay colección 3 semanas al mes (ver weekInfo).
// col3: al nivel 150 se suman 3 más (arte, música y cine) y hay colección todas las semanas.
// fiesta2: al nivel 200 se suman las festividades de leyendas mexicanas (local: true).
// fiesta: festividades de 24 h (ver más abajo).
// 8 nov 2026: separados a 10 niveles o más de las cartas y mesas que estrenan (antes racha 20, mis 30, logros 40, col 50,
// mes 80, col2 100, fiesta 120, col3 150, fiesta2 200). Los números de los comentarios de abajo son los de antes.
// 10 nov 2026 (pedido del usuario): fiesta3 = fiestas mexicanas nuevas (se ven en el nivel 389), fiesta4 = fiestas de
// América (nivel 461).
export const UNLOCK = { racha: 30, mis: 40, logros: 70, col: 90, mes: 130, col2: 159, fiesta: 180, col3: 230, fiesta2: 290, fiesta3: 388, fiesta4: 460 };
export const isOn = (k) => (save.next || 0) >= UNLOCK[k];

// En estrellas (7 nov 2026: llegaba a 30 victorias sin problema porque contaba cualquiera): cada victoria suma sus
// estrellas. Primera fila: 15/30/60/90/150/240 (= 5, 10, 20, 30, 50 y 80 niveles con 3★). Luego una fila sin fin
// cada 150 (150, 300, 450…): se turnan comodín y deshacer, con monedas que suben poco a poco.
export const STREAK_GOALS = [
  { n: 15, coins: 20 },
  { n: 30, coins: 30 },
  { n: 60, coins: 40, undo: 1 },
  { n: 90, coins: 50 },
  { n: 150, coins: 60 },
  { n: 240, coins: 80, wild: 1 },
];
export const STREAK_STEP = 150;
// Premio i (índice global): los primeros son la fila de arriba; del 6 en adelante, la fila de 50 en 50.
export function streakGoal(i) {
  if (i < STREAK_GOALS.length) return STREAK_GOALS[i];
  const j = i - STREAK_GOALS.length;
  return { n: STREAK_STEP * (j + 1), coins: 100 + 20 * j, ...(j % 2 ? { undo: 1 } : { wild: 1 }) };
}
// Índice del primer premio que todavía no alcanza esa racha.
export const goalIndex = (n) => (n < STREAK_GOALS[STREAK_GOALS.length - 1].n ? STREAK_GOALS.findIndex((g) => g.n > n) : STREAK_GOALS.length + Math.floor(n / STREAK_STEP));
// Nombre, icono y color de la ventana.
const STREAK_THEME = { key: 'cohete', name: 'Racha cohete', ico: 'rocket', color: 'pink' };

// Día local (cambia a medianoche). save.devDay solo lo mueve el modo dev ("otro día").
const today = () => {
  const d = new Date();
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5) + (save.devDay || 0);
};
export function dailyStreak() {
  const day = today();
  if (save.racha?.day !== day) {
    // Lo que no se reclamó ayer se pierde (como el regalo diario): se avisa al llegar al mapa.
    save.racha = { day, n: 0, got: [], pend: [], miss: [], ...(save.racha?.pend?.length ? { expired: true } : {}) };
    persist();
  }
  return save.racha;
}
export const streakTheme = () => STREAK_THEME;
export const streakReady = () => dailyStreak().pend.length > 0;
// Siguiente premio por ganar: tras un reinicio se salta los que ya alcanzó ese día.
export const nextIndex = (r) => {
  let i = goalIndex(r.n);
  while (r.got.includes(i)) i++;
  return i;
};
export const nextGoal = () => streakGoal(nextIndex(dailyStreak()));
// "En llamas": le falta muy poco para el siguiente premio (1 victoria; 2 si el tramo es largo).
export function streakHot() {
  const r = dailyStreak(), i = nextIndex(r);
  const from = i ? streakGoal(i - 1).n : 0, left = streakGoal(i).n - r.n;
  // En la fila sin fin arde solo en las últimas 2 victorias perfectas (6 estrellas).
  return left <= (i >= STREAK_GOALS.length ? 6 : Math.max(3, Math.ceil((streakGoal(i).n - from) * 0.2)));
}
export const msToMidnight = () => {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d - Date.now();
};

// Ganó un nivel nuevo: suma sus estrellas y cobra los premios que alcanzó.
// 10 nov 2026 (pedido del usuario): se cobran solos, como misiones y logros. Se suman al momento y esperan en save.feats
// para festejarlos en la portada (playFeats en main.js). r.pend se queda vacío (guardados viejos: rachaClaim).
export function streakWin(stars = 1) {
  if (!isOn('racha')) return null;
  const r = dailyStreak();
  r.n += stars;
  let any = false;
  for (let i = 0; i < goalIndex(r.n); i++) {
    if (r.got.includes(i)) continue;
    const g = streakGoal(i);
    r.got.push(i);
    save.coins += g.coins;
    save.wild += g.wild || 0;
    save.undo += g.undo || 0;
    (save.feats ||= []).push({ t: 'racha', n: g.n, coins: g.coins, wild: g.wild || 0, undo: g.undo || 0 });
    any = true;
  }
  persist();
  if (any && typeof dispatchEvent === 'function') dispatchEvent(new Event('feats'));
  return r.n;
}
// Perdió o abandonó un nivel nuevo (o se rindió en uno repetido): vuelve a 0 y los premios sin reclamar se pierden
// (se avisa al volver al mapa). Los que ya alcanzó ese día no se reinician: no se vuelven a ganar (si llegó al 3.º,
// para otro premio tiene que pasar del 3.º).
export function streakLose() {
  if (!isOn('racha')) return;
  const r = dailyStreak();
  if (!r.n) return;
  r.lost = r.n;
  r.n = 0;
  r.miss = [...(r.miss || []), ...r.pend]; // perdidos sin reclamar: en la ventana se ven tachados
  r.pend = [];
  persist();
}
// Guardados de antes (cuando se reclamaban a mano): lo pendiente se cobra solo y va a la cola del festejo.
export function streakPendToFeats() {
  const r = dailyStreak();
  if (!r.pend?.length) return false;
  for (const i of r.pend) {
    const g = streakGoal(i);
    save.coins += g.coins;
    save.wild += g.wild || 0;
    save.undo += g.undo || 0;
    (save.feats ||= []).push({ t: 'racha', n: g.n, coins: g.coins, wild: g.wild || 0, undo: g.undo || 0 });
  }
  r.pend = [];
  persist();
  return true;
}
// Junta los premios pendientes y los quita de la lista.
export function streakClaim() {
  const r = dailyStreak(), p = { coins: 0, wild: 0, undo: 0 };
  for (const i of r.pend) {
    const g = streakGoal(i);
    p.coins += g.coins;
    p.wild += g.wild || 0;
    p.undo += g.undo || 0;
  }
  r.pend = [];
  persist();
  return p;
}

// ---------- Colección ----------
// Dos semanas al mes (las que empiezan el 1.º y el 3.er lunes): de lunes 00:00 a domingo 23:59, hora del teléfono.
// Desde el nivel 100 (col2) son tres (también la del 4.º lunes) y se turnan también las temáticas nuevas (plus).
// Cada estrella nueva que ganas da 1 ficha, como las monedas: si sacas 2★ y luego 3★, la segunda vez da 1.
// Las fichas se cambian en su tienda temporal; al terminar la semana, las que sobren se pierden.
// Lo exclusivo de cada temática (7 cosméticos) es tuyo para siempre. No alcanza para todo en una semana:
// la temática vuelve cada 2 meses y ahí se completa.
export const COLLECTIONS = [
  { key: 'mar', name: 'Tesoros del mar', token: 'concha', tokens: 'conchas', color: 'blue',
    ex: { back: 'arrecife', title: 'buscaconchas', avatar: 'cangrejo', ring: 'burbujas', traveler: 'tortuga', frame: 'mar', space: 'marino' } },
  { key: 'gemas', name: 'Cueva de gemas', token: 'gema', tokens: 'gemas', color: 'violet',
    ex: { back: 'cristales', title: 'cazagemas', avatar: 'topo', ring: 'gemas', traveler: 'cristal', frame: 'gemas', space: 'cueva' } },
  { key: 'bosque', name: 'Bosque encantado', token: 'bellota', tokens: 'bellotas', color: 'green',
    ex: { back: 'hojas', title: 'guardabosques', avatar: 'ardilla', ring: 'hojas', traveler: 'hoja', frame: 'bosque', space: 'bosque' } },
  { key: 'dulces', name: 'Feria de dulces', token: 'caramelo', tokens: 'caramelos', color: 'pink',
    ex: { back: 'caramelos', title: 'golosito', avatar: 'osito', ring: 'caramelos', traveler: 'paleta', frame: 'dulces', space: 'algodon' } },
  // Desde el nivel 100. one: la ficha escrita (si no es igual a su icono) · m: es masculina (los fósiles) · ready: ya tiene sus dibujos (las que no, todavía no salen).
  { key: 'dinos', name: 'Valle de los dinosaurios', token: 'fosil', one: 'fósil', tokens: 'fósiles', m: 1, color: 'orange', plus: true, ready: true,
    ex: { back: 'huellas', title: 'paleontologo', avatar: 'triceratops', ring: 'huesitos', traveler: 'ptero', frame: 'dinos', space: 'volcan' } },
  { key: 'robots', name: 'Taller de robots', token: 'tuerca', tokens: 'tuercas', color: 'gray', plus: true, ready: true,
    ex: { back: 'circuitos', title: 'inventor', avatar: 'robodog', ring: 'tuercas', traveler: 'robotin', frame: 'robots', space: 'taller' } },
  // Desde el nivel 150 (plus: 2): las de hacer arte, música y cine.
  { key: 'arte', name: 'Taller de arte', token: 'gota', one: 'gota de pintura', tokens: 'gotas de pintura', color: 'red', plus: 2, ready: true,
    ex: { back: 'lienzo', title: 'artista', avatar: 'pulpopintor', ring: 'pinceles', traveler: 'paletapintor', frame: 'arte', space: 'manchas' } },
  { key: 'musica', name: 'Banda musical', token: 'nota', tokens: 'notas', color: 'violet', plus: 2, ready: true,
    ex: { back: 'partitura', title: 'estrellarock', avatar: 'ranita', ring: 'pentagrama', traveler: 'tocadiscos', frame: 'musica', space: 'concierto' } },
  { key: 'cine', name: 'Estudio de cine', token: 'claqueta', tokens: 'claquetas', color: 'gold', plus: 2, ready: true,
    ex: { back: 'peliculas', title: 'director', avatar: 'mapache', ring: 'rollo', traveler: 'proyector', frame: 'cine', space: 'estreno' } },
];
// Precio en fichas de cada exclusivo (igual en todas las temáticas). Suman 560: más de lo que se junta en una semana.
// 7 nov 2026: todo 60% más caro (COL_UP; primero 25%, luego más: son de los pocos lugares donde se consiguen ayudas y exclusivos).
const COL_UP = 1.6;
const HELP_UP = 4;
const EX_PRICE = Object.fromEntries(Object.entries({ title: 40, frame: 50, space: 60, ring: 70, avatar: 90, back: 110, traveler: 140 }).map(([k, v]) => [k, Math.round((v * COL_UP) / 5) * 5]));
const DAY = 864e5;
// Lunes de esta semana (en días locales) y si esa semana hay colección.
const mondayOf = (day) => day - ((day + 3) % 7); // el día 0 (1 ene 1970) fue jueves
// Sin plus: 2 semanas al mes y las 4 de siempre (cada una vuelve cada 2 meses).
// Con plus: 3 semanas al mes y las 6 (también cada 2 meses).
// Desde el nivel 150: todas las semanas, y las 9 se van turnando una tras otra.
const BASE_COL = COLLECTIONS.filter((c) => !c.plus);
const PLUS_COL = COLLECTIONS.filter((c) => !c.plus || (c.plus === true && c.ready));
const ALL_COL = COLLECTIONS.filter((c) => !c.plus || c.ready);
const weekInfo = (monday, plus = isOn('col2'), all = isOn('col3')) => {
  if (all) return { on: true, theme: ALL_COL[Math.floor(monday / 7) % ALL_COL.length] };
  const d = new Date(monday * DAY), dom = d.getUTCDate(), m = d.getUTCFullYear() * 12 + d.getUTCMonth();
  const slot = dom <= 7 ? 0 : dom >= 15 && dom <= 21 ? 1 : plus && dom >= 22 && dom <= 28 ? 2 : -1;
  const list = plus ? PLUS_COL : BASE_COL;
  return { on: slot >= 0, theme: list[(m * (plus ? 3 : 2) + slot) % list.length] };
};
// La colección activa (o null). Al cambiar de semana se empieza de cero: las fichas viejas se pierden.
// La temática se guarda al empezar la semana: si llega al nivel 100 a media semana, no cambia.
export function col() {
  if (!isOn('col')) return null;
  const monday = mondayOf(today()), w = weekInfo(monday);
  if (save.col?.id === monday) {
    const theme = COLLECTIONS.find((c) => c.key === save.col.key) || weekInfo(monday, false, false).theme;
    return { ...theme, state: save.col, monday };
  }
  if (!w.on) return null;
  save.col = { id: monday, key: w.theme.key, n: 0, bought: {} };
  persist();
  return { ...w.theme, state: save.col, monday };
}
// Las temáticas nuevas que se suman en el nivel 100 (tier 1) o en el 150 (tier 2), para su aviso.
export const plusCols = (tier = 1) => COLLECTIONS.filter((c) => c.ready && (tier === 2 ? c.plus === 2 : c.plus === true));
// Cuánto falta para que termine (domingo a medianoche).
export const colLeft = () => {
  const c = col();
  if (!c) return 0;
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d - Date.now() + (c.monday + 6 - today()) * DAY;
};
// Días que faltan para la siguiente semana con colección (modo dev: saltar a ella).
export function daysToNextCol() {
  const day = today();
  for (let k = 7 - ((day + 3) % 7); k < 70; k += 7) if (weekInfo(mondayOf(day + k)).on) return k;
  return 0;
}
// Ganó un nivel: 1 ficha por cada estrella nueva (respecto a su mejor resultado).
// mult: apuesta del nivel (las fichas también se multiplican).
export function colWin(stars, prev, mult = 1) {
  const c = col(), n = Math.max(0, stars - prev) * mult;
  if (!c || !n) return 0;
  c.state.n += n;
  persist();
  return n;
}
// Tienda temporal: los 7 exclusivos de la temática y ayudas sin límite, todo del más barato al más caro.
// tier = boletos que cuesta el siguiente nivel (1-3): las ayudas cuestan más con el avance; lo que dan es siempre igual.
export function colOffers(tier = 1) {
  const c = col();
  if (!c) return [];
  const ex = Object.entries(EX_PRICE).map(([sec, price]) => ({ k: sec, sec, item: c.ex[sec], price }));
  // Ayudas (8 nov 2026): ×HELP_UP más, para que cuesten como un exclusivo de en medio o más (el usuario: "deben ser
  // nivel medio/difícil de comprar"; antes el comodín costaba 19 fichas y un título 65).
  // 8 nov 2026: y 5% más por cada constelación abierta (igual que en los niveles, constUp en economy.js).
  const hp = (n) => Math.round((n * tier * COL_UP * HELP_UP * constUp(Math.floor((save.open || 0) / 10))) / 5) * 5;
  return [
    ...ex,
    { k: 'wild', prize: { wild: 1 }, price: hp(12) },
    { k: 'undo', prize: { undo: 3 }, price: hp(8) },
    { k: 'tickets', prize: { tickets: 2 }, price: hp(5) },
    // Ayudas del mazo de ayudas (7 nov 2026): de los pocos lugares donde se consiguen sin comprarlas.
    { k: 'reloj', prize: { helps: { reloj: 1 } }, price: hp(9) },
    { k: 'ver3', prize: { helps: { ver3: 1 } }, price: hp(6) },
    { k: 'llave', prize: { helps: { llave: 1 } }, price: hp(60) },
  ].sort((a, b) => a.price - b.price);
}
// Cambia fichas por una oferta. Devuelve la oferta (para entregar el premio) o null si no alcanza o ya es tuya.
export function colBuy(o) {
  const c = col();
  if (!c || c.state.n < o.price || (o.sec && save.owned[`${o.sec}:${o.item}`])) return null;
  c.state.n -= o.price;
  c.state.bought[o.k] = (c.state.bought[o.k] || 0) + 1;
  if (o.sec) {
    save.owned[`${o.sec}:${o.item}`] = 1; // no se pone solo: se cambia en el perfil
  }
  persist();
  return o;
}

// ---------- Evento del mes ----------
// Solo algunos meses (ene, feb, abr, jul, sep, oct, nov y dic), cada uno con su temática, que vuelve cada año.
// 25 niveles difíciles en 5 planetas de 5 (ver eventLevel en levels.js): se juegan en orden y las estrellas no cuentan.
// Boleto temático: 1 para entrar; ganar lo devuelve, perder o abandonar lo gasta y el siguiente llega a las 24 h.
// No se compra. Al acabar el mes, el avance se pierde; los premios son tuyos para siempre.
// El 5.º nivel de cada planeta da su exclusivo; si ya lo tienes (de otro año), da ayudas o monedas.
// ready: la temática ya tiene sus dibujos (se hacen por tandas; un mes sin dibujos no tiene evento).
export const EVENTS = {
  10: {
    key: 'muertos', name: 'Día de Muertos', color: 'orange', ico: 'calavera', deco: 'cempasuchil', tk: 'tkMuertos', ready: true,
    planets: ['Campo de Cempasúchil', 'Cerro del Papel Picado', 'Valle de las Velas', 'Isla de los Alebrijes', 'Mictlán'],
    ex: [{ space: 'ofrenda' }, { frame: 'muertos' }, { ring: 'cempasuchil' }, { avatar: 'xolo', back: 'calaverita' }, { title: 'catrin', traveler: 'alebrije' }],
  },
  11: {
    key: 'navidad', name: 'Navidad', color: 'red', ico: 'esfera', deco: 'copo', tk: 'tkNavidad', ready: true,
    planets: ['Bosque de Pinos', 'Pueblo de Jengibre', 'Valle Nevado', 'Lago Congelado', 'Polo Norte'],
    ex: [{ space: 'nevada' }, { frame: 'navidad' }, { ring: 'acebo' }, { avatar: 'reno', back: 'esferas' }, { title: 'duende', traveler: 'trineo' }],
  },
  0: {
    key: 'reyes', name: 'Día de Reyes', color: 'violet', ico: 'rosca', deco: 'crown', tk: 'tkReyes', ready: true,
    planets: ['Desierto de las Estrellas', 'Oasis de los Camellos', 'Valle de la Rosca', 'Palacio de Oro', 'Estrella de Oriente'],
    ex: [{ space: 'oriente' }, { frame: 'reyes' }, { ring: 'corona' }, { avatar: 'reymago', back: 'rosca' }, { title: 'buscador', traveler: 'camello' }],
  },
  1: {
    key: 'amor', name: 'Amor y Amistad', color: 'pink', ico: 'corazon', deco: 'sobre', tk: 'tkAmor', ready: true,
    planets: ['Jardín de Rosas', 'Valle del Chocolate', 'Isla de las Cartas', 'Bosque de Cupido', 'Planeta Corazón'],
    ex: [{ space: 'corazones' }, { frame: 'amor' }, { ring: 'cupido' }, { avatar: 'cupido', back: 'cartas' }, { title: 'flechazo', traveler: 'alado' }],
  },
  3: {
    key: 'primavera', name: 'Primavera', color: 'green', ico: 'tulipan', deco: 'mariposa', tk: 'tkPrimavera', ready: true,
    planets: ['Prado de Tulipanes', 'Jardín de Mariposas', 'Valle del Arcoíris', 'Bosque en Flor', 'Planeta Primavera'],
    ex: [{ space: 'petalos' }, { frame: 'primavera' }, { ring: 'mariposas' }, { avatar: 'catarina', back: 'tulipanes' }, { title: 'jardinero', traveler: 'mariposa' }],
  },
  6: {
    key: 'verano', name: 'Verano', color: 'blue', ico: 'sandia', deco: 'sol', tk: 'tkVerano', ready: true,
    planets: ['Playa Dorada', 'Isla de las Palmeras', 'Bahía de las Olas', 'Costa de las Sandías', 'Planeta Verano'],
    ex: [{ space: 'playa' }, { frame: 'verano' }, { ring: 'salvavidas' }, { avatar: 'foca', back: 'sandias' }, { title: 'olas', traveler: 'patito' }],
  },
  8: {
    key: 'patrias', name: 'Fiestas Patrias', color: 'green', ico: 'sombrero', deco: 'chile', tk: 'tkPatrias', ready: true,
    planets: ['Valle del Maíz', 'Pueblo de las Banderas', 'Cerro de los Chiles', 'Plaza del Grito', 'Planeta Tricolor'],
    ex: [{ space: 'grito' }, { frame: 'patrias' }, { ring: 'tricolor' }, { avatar: 'chihuahua', back: 'vivamexico' }, { title: 'mariachi', traveler: 'sombrero' }],
  },
  9: {
    key: 'halloween', name: 'Halloween', color: 'violet', ico: 'calabaza', deco: 'murcielago', tk: 'tkHalloween', ready: true,
    planets: ['Huerto de Calabazas', 'Bosque Embrujado', 'Pantano de las Brujas', 'Castillo de los Murciélagos', 'Planeta Espantoso'],
    ex: [{ space: 'embrujada' }, { frame: 'halloween' }, { ring: 'telarana' }, { avatar: 'gatobruja', back: 'calabazas' }, { title: 'hechicero', traveler: 'escoba' }],
  },
};
// Monedas de los niveles 1-4 de cada planeta y lo que da el 5.º si ya tienes su exclusivo. Subidas 50% el
// 6 nov 2026 (antes 20-40 y 300/600), cuando sus niveles duros dejaron de pedir ayudas.
export const EV_COINS = [30, 40, 45, 55, 60];
export const EV_REPEAT = [{ coins: 450 }, { undo: 3 }, { wild: 1 }, { wild: 2, coins: 450 }, { wild: 3, coins: 900 }];
// El boleto que se pierde vuelve a las 48 h (7 nov 2026: antes 24 h; así comprarlo tienta más).
export const EV_TICKET_WAIT = 2 * DAY;
// Boletos que se pagan (7 nov 2026): el primero del evento del mes 1,000 y los siguientes (si no quieres esperar las
// 48 h) 500; la festividad 800 una vez. Si ya tienes todos los exclusivos de ese evento, 30% menos.
// La festividad se puede comprar antes (los días en que su botón sale con candado) con FI_PRE de descuento.
export const EV_FIRST = 1000, EV_AGAIN = 500, FEST_ENTRY = 800, ALL_EX_OFF = 0.3, FEST_PRE = 0.2;
const allEx = (e) => e.ex.every((x) => Object.entries(x).every(([sec, it]) => save.owned[`${sec}:${it}`]));
const tkPrice = (e, base) => Math.round((base * (allEx(e) ? 1 - ALL_EX_OFF : 1)) / 5) * 5;

// Fecha del teléfono (el modo dev la mueve con save.devDay).
const now = () => new Date(Date.now() + (save.devDay || 0) * DAY);
const eventOf = (d) => {
  const e = EVENTS[d.getMonth()];
  return e?.ready ? { ...e, month: d.getMonth(), id: d.getFullYear() * 12 + d.getMonth() } : null;
};
// El evento activo (o null). Al cambiar de mes se empieza de cero.
// world: hasta qué mundo llegabas al empezar (fija las mecánicas de sus niveles todo el mes).
export function ev() {
  if (!isOn('mes')) return null;
  const e = eventOf(now());
  if (!e) return null;
  if (save.ev?.id !== e.id) {
    evRecord();
    // Preventa (9 nov 2026): si compró la entrada en los días de antes, ya empieza pagado y con su boleto.
    const pre = save.evPre === e.id;
    save.ev = { id: e.id, k: 0, world: save.open || 0, tk: pre ? 1 : 0, at: 0, paid: pre, run: null, tries: {} };
    persist();
  }
  const s = save.ev;
  // Ediciones empezadas antes del boleto pagado: ya entraron gratis.
  if (s.paid == null) s.paid = true;
  // El boleto que se gastó vuelve a las 48 h.
  if (!s.tk && s.at && Date.now() - s.at >= EV_TICKET_WAIT) {
    s.tk = 1;
    s.at = 0;
    persist();
  }
  return { ...e, state: s, done: s.k >= EVENT_LEVELS };
}
// El evento del mes que viene, desde EV_SOON días antes (9 nov 2026; antes solo el último día): su botón sale junto al
// del mes que termina, gris y con candado, y su entrada se puede comprar antes con FI_PRE de descuento (save.evPre).
// inDays: días que faltan. null si no.
export const EV_SOON = 3;
export function evSoon() {
  if (!isOn('mes')) return null;
  const d = now(), t = new Date(d.getFullYear(), d.getMonth() + 1, 1), ms = t - d;
  if (ms > EV_SOON * DAY) return null;
  const e = eventOf(t);
  return e ? { ...e, soon: true, inDays: Math.ceil(ms / DAY) } : null;
}
// Preventa del mes que viene: la entrada (su primer boleto) con FI_PRE menos. pre = false: el precio de siempre.
export const evPrePrice = (e, pre = true) => tkPrice(e, EV_FIRST * (pre ? 1 - FEST_PRE : 1));
export const evPreOwned = (e) => !!e && save.evPre === e.id;
export function evPreBuy() {
  const n = evSoon();
  if (!n || evPreOwned(n)) return false;
  const p = evPrePrice(n);
  if (save.coins < p) return false;
  save.coins -= p;
  save.evPre = n.id;
  persist();
  return p;
}
// Precio del boleto del evento ahora: el primero de la edición o uno para no esperar.
export const evTicketPrice = (e) => tkPrice(e, e.state.paid ? EV_AGAIN : EV_FIRST);
// Comprar el boleto (el primero o para no esperar las 48 h). false si no alcanzan las monedas.
export function evBuyTicket() {
  const e = ev();
  if (!e || e.state.tk) return false;
  const p = evTicketPrice(e);
  if (save.coins < p) return false;
  save.coins -= p;
  Object.assign(e.state, { tk: 1, at: 0, paid: true });
  persist();
  return p;
}
// Cuánto falta para el siguiente boleto (0 = ya tienes; también 0 si aún no se compra el primero).
export const evTicketLeft = () => {
  const e = ev();
  return !e || e.state.tk || !e.state.paid ? 0 : Math.max(0, e.state.at + EV_TICKET_WAIT - Date.now());
};
// Cuánto falta para que termine el mes.
export const evLeft = () => {
  const d = now(), end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return end - d;
};
// Días para el siguiente mes con evento (modo dev: saltar a él).
export function daysToNextEvent() {
  const d = now();
  for (let m = 1; m <= 12; m++) {
    const t = new Date(d.getFullYear(), d.getMonth() + m, 1);
    if (eventOf(t)) return Math.ceil((t - d) / DAY);
  }
  return 0;
}
// El siguiente evento (para decir cuándo llega): { name, ico, days } o null.
export function nextEvent() {
  const d = now();
  for (let m = 1; m <= 12; m++) {
    const t = new Date(d.getFullYear(), d.getMonth() + m, 1), e = eventOf(t);
    if (e) return { ...e, days: Math.ceil((t - d) / DAY) };
  }
  return null;
}
// Premio del nivel k (0..24): monedas en los niveles 1-4; en el 5.º, los exclusivos del planeta
// (o EV_REPEAT si ya los tienes todos). Devuelve { coins?, undo?, wild?, items: [{ sec, k }] }.
export function evPrize(e, k, stars = 3) {
  const p = Math.floor(k / EVENT_PER_PLANET);
  if (k % EVENT_PER_PLANET !== EVENT_PER_PLANET - 1) return { coins: EV_COINS[p], items: [] };
  return lastPrize(e.ex[p], EV_REPEAT[p], EV_COINS[p] * 3, stars);
}
// Premio del último nivel de un planeta (evento del mes y festividades; 7 nov 2026). Antes daba todos los exclusivos
// del planeta juntos: ahora puede salir UNO que aún no tienes (nunca dos a la vez; así no salen todos en un año).
// Van en el orden de siempre, del más fácil al más difícil (fondo, marco, anillo, avatar, reverso, título, viajero):
// cada uno tiene su probabilidad (EX_ODDS) y las estrellas del nivel la multiplican (STAR_K: 1★ menos de la mitad).
// Si no sale, da el premio de repetido (rep) con sus ayudas por probabilidad: HELP_ODDS[0] cada una si trae
// una sola, HELP_ODDS[1] si trae varias. Si al final no queda nada, `least` monedas. Se sortea al ganar.
export const EX_ODDS = { space: 0.5, frame: 0.45, ring: 0.4, avatar: 0.3, back: 0.3, title: 0.25, traveler: 0.15 };
export const STAR_K = [0.4, 0.4, 0.7, 1];
const EX_ORDER = Object.keys(EX_ODDS);
export const HELP_ODDS = [0.4, 0.2];
// Ayudas que pueden caer en ese premio, en orden (se toma la primera que salga): ver 5 s 5%, ver 4 s 12%, reloj 20%.
const HELP_DROP = [['ver5', 0.05], ['ver4', 0.12], ['reloj', 0.2]];
function lastPrize(ex, rep, least, stars = 3, r = Math.random) {
  const left = Object.entries(ex).filter(([sec, it]) => !save.owned[`${sec}:${it}`]).sort((a, b) => EX_ORDER.indexOf(a[0]) - EX_ORDER.indexOf(b[0]));
  if (left.length && r() < EX_ODDS[left[0][0]] * STAR_K[Math.max(0, Math.min(3, stars))]) {
    const [sec, it] = left[0];
    return { items: [{ sec, k: it }] };
  }
  const odds = HELP_ODDS[(rep.wild || 0) + (rep.undo || 0) > 1 ? 1 : 0];
  const roll = (n = 0) => Array.from({ length: n }).reduce((a) => a + (r() < odds), 0);
  const out = { coins: rep.coins || 0, wild: roll(rep.wild), undo: roll(rep.undo), items: [], repeat: !left.length };
  // Ayudas del mazo de ayudas, raras (HELP_DROP): ver cartas 5 s casi solo sale aquí.
  const drop = HELP_DROP.find(([, p]) => r() < p);
  if (drop) out.helps = { [drop[0]]: 1 };
  if (!out.coins && !out.wild && !out.undo && !out.helps) out.coins = least;
  return out;
}
// Entrar a un nivel: gasta el boleto (si es partida nueva). Devuelve false si no hay boleto.
export function evEnter() {
  const e = ev();
  if (!e || e.done) return false;
  if (e.state.run) return true;
  if (!e.state.tk) return false;
  e.state.tk = 0;
  e.state.run = { k: e.state.k, v: e.state.tries[e.state.k] || 0, state: null };
  e.state.tries[e.state.k] = e.state.run.v + 1;
  persist();
  return true;
}
// Ganó el nivel: el boleto vuelve, se avanza y se entrega el premio (los exclusivos no se ponen solos: se cambian en el perfil).
export function evWin(stars = 3) {
  const e = ev();
  if (!e?.state.run) return null;
  const k = e.state.run.k, prize = evPrize(e, k, stars);
  e.state.run = null;
  e.state.tk = 1;
  e.state.at = 0;
  e.state.k = k + 1;
  evRecord();
  save.coins += prize.coins || 0;
  save.undo += prize.undo || 0;
  save.wild += prize.wild || 0;
  for (const [k, n] of Object.entries(prize.helps || {})) save.helps[k] = (save.helps[k] || 0) + n;
  for (const it of prize.items) {
    save.owned[`${it.sec}:${it.k}`] = 1;
  }
  persist();
  return { ...prize, k, planet: Math.floor(k / EVENT_PER_PLANET), last: k === EVENT_LEVELS - 1 };
}
// Álbum: ganar el evento completo (los 25 niveles) deja su postal para siempre, con el año en el sello
// (save.evAlbum: id del evento = año·12 + mes → 1).
function evRecord() {
  const s = save.ev;
  if (s?.id && s.k >= EVENT_LEVELS) save.evAlbum[s.id] = 1;
}
// Las postales de eventos, de la más nueva a la más vieja: [{ id, year, e }].
export function evAlbum() {
  evRecord(); // eventos ganados antes de que existiera el álbum
  return Object.keys(save.evAlbum)
    .map((id) => ({ id: +id, year: Math.floor(id / 12), e: EVENTS[id % 12] }))
    .filter((x) => x.e?.ready)
    .sort((a, b) => b.id - a.id);
}
// Perdió, abandonó o pidió reintentar: el boleto ya se gastó; el siguiente llega en 24 h.
export function evLose() {
  const e = ev();
  if (!e?.state.run) return;
  e.state.run = null;
  e.state.at = Date.now();
  persist();
}
export { EVENT_PLANETS, EVENT_PER_PLANET, EVENT_LEVELS };

// ---------- Festividades (eventos de 24 h) ----------
// Un día de fiesta (de 00:00 a 23:59, hora del teléfono): 3 planetas de 3 niveles con tableros especiales que piden
// 2, 2 y 3 ayudas (ver fiestaLevel). Sin boleto: perder o abandonar solo pide volver a intentarlo. El 3.º nivel de
// cada planeta da sus exclusivos (planeta 1: fondo y postal · 2: marco y reverso · 3: avatar, título y nave); si ya
// los tienes, da ayudas o monedas. Desde un día antes se ve su botón apagado con la cuenta regresiva.
// date(año) = el día de la fiesta. Si dos caen el mismo día, la segunda se recorre al día siguiente.
// ready: ya tiene sus dibujos (las que no, todavía no salen).
const nthSunday = (y, m, n) => { const d = new Date(y, m, 1); return new Date(y, m, 1 + ((7 - d.getDay()) % 7) + (n - 1) * 7); };
// Domingo de Pascua (algoritmo de Gauss/Meeus, calendario gregoriano). El Carnaval empieza el sábado antes del
// Miércoles de Ceniza (50 días antes de Pascua) y dura hasta el martes.
const easter = (y) => {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mo - 1, da);
};
// El primer lunes después del día d del mes m (Guelaguetza: el lunes después del 16 de julio).
const mondayAfter = (y, m, d) => { const x = new Date(y, m, d + 1); return new Date(y, m, d + 1 + ((8 - x.getDay()) % 7)); };
export const FESTIVALS = [
  { key: 'anionuevo', name: 'Año Nuevo', date: (y) => new Date(y, 0, 1), ready: true,
    ico: 'reloj', deco: 'uvas', color: 'gold',
    planets: ['Valle de las Uvas', 'Cielo de Cohetes', 'Planeta Medianoche'],
    ex: [{ space: 'brindis', frame: 'felizano' }, { ring: 'chispas', back: 'medianoche' }, { avatar: 'uvita', title: 'propositos', traveler: 'bolaluz' }] },
  { key: 'candelaria', name: 'Día de la Candelaria', date: (y) => new Date(y, 1, 2), ready: true,
    ico: 'tamal', deco: 'atole', color: 'gold',
    planets: ['Milpa Dorada', 'Valle del Atole', 'Cerro de los Tamales'],
    ex: [{ space: 'candelaria', frame: 'candelaria' }, { ring: 'tamalitos', back: 'tamales' }, { avatar: 'tamalito', title: 'tamalero', traveler: 'olla' }] },
  { key: 'taco', name: 'Día del Taco', date: (y) => new Date(y, 2, 31), ready: true,
    ico: 'taco', deco: 'limon', color: 'orange',
    planets: ['Valle del Pastor', 'Cerro de las Salsas', 'Planeta Taquero'],
    ex: [{ space: 'taquera', frame: 'taco' }, { ring: 'salsas', back: 'tacos' }, { avatar: 'taquito', title: 'taquero', traveler: 'trompo' }] },
  { key: 'tierra', name: 'Día de la Tierra', date: (y) => new Date(y, 3, 22), ready: true,
    ico: 'tierra', deco: 'brote', color: 'green',
    planets: ['Bosque Vivo', 'Océano Limpio', 'Planeta Verde'],
    ex: [{ space: 'tierra', frame: 'tierra' }, { ring: 'brotes', back: 'planetaverde' }, { avatar: 'arbolito', title: 'heroeverde', traveler: 'regadera' }] },
  { key: 'nino', name: 'Día del Niño', date: (y) => new Date(y, 3, 30), ready: true,
    ico: 'pinata', deco: 'globito', color: 'pink',
    planets: ['Isla de los Juguetes', 'Valle de los Globos', 'Planeta Piñata'],
    ex: [{ space: 'juguetes', frame: 'confeti' }, { ring: 'globitos', back: 'pinata' }, { avatar: 'pinatita', title: 'jugueton', traveler: 'papalote' }] },
  { key: 'madres', name: 'Día de las Madres', date: (y) => new Date(y, 4, 10), ready: true,
    ico: 'clavel', deco: 'regalito', color: 'red',
    planets: ['Jardín de Claveles', 'Valle de los Abrazos', 'Planeta Mamá'],
    ex: [{ space: 'jardinmama', frame: 'mama' }, { ring: 'claveles', back: 'regalos' }, { avatar: 'clavelito', title: 'consentido', traveler: 'regalito' }] },
  { key: 'padre', name: 'Día del Padre', date: (y) => nthSunday(y, 5, 3), ready: true,
    ico: 'corbata', deco: 'bigote', color: 'blue',
    planets: ['Lago de Pesca', 'Bosque del Asador', 'Planeta Papá'],
    ex: [{ space: 'nochepapa', frame: 'papa' }, { ring: 'corbatas', back: 'bigotes' }, { avatar: 'bigoton', title: 'orgullo', traveler: 'asador' }] },
  { key: 'gato', name: 'Día del Gato', date: (y) => new Date(y, 7, 8), ready: true,
    ico: 'gatito', deco: 'estambre', color: 'violet',
    planets: ['Tejados de la Luna', 'Valle del Estambre', 'Planeta Michi'],
    ex: [{ space: 'tejados', frame: 'gatitos' }, { ring: 'estambres', back: 'michis' }, { avatar: 'atigrado', title: 'amigomichi', traveler: 'cajamichi' }] },
  { key: 'perro', name: 'Día del Perro', date: (y) => new Date(y, 7, 26), ready: true,
    ico: 'cachorro', deco: 'hueso', color: 'orange',
    planets: ['Parque de los Huesos', 'Valle de las Pelotas', 'Planeta Lomito'],
    ex: [{ space: 'parque', frame: 'patitas' }, { ring: 'huesos', back: 'cachorros' }, { avatar: 'dalmata', title: 'mejoramigo', traveler: 'frisbee' }] },
  { key: 'gamer', name: 'Día del Gamer', date: (y) => new Date(y, 7, 29), ready: true,
    ico: 'control', deco: 'pixcora', color: 'pink',
    planets: ['Arcade de Neón', 'Valle de los Píxeles', 'Planeta Jefe Final'],
    ex: [{ space: 'arcade', frame: 'pixeles' }, { ring: 'pixelado', back: 'controles' }, { avatar: 'audifonos', title: 'jefefinal', traveler: 'maquinita' }] },
  // Día 256: 13 sep (12 en bisiesto).
  { key: 'programador', name: 'Día del Programador', date: (y) => new Date(y, 0, 256), ready: true,
    ico: 'laptop', deco: 'llaves', color: 'green',
    planets: ['Valle del Código', 'Nube de Datos', 'Planeta Binario'],
    ex: [{ space: 'codigo', frame: 'terminal' }, { ring: 'llavecitas', back: 'binario' }, { avatar: 'bichito', title: 'cerobugs', traveler: 'laptop' }] },
  // Desde el nivel 200 (local): leyendas y fechas mexicanas. days: cuántos días dura (si no, 1).
  // p y n: planetas y niveles por planeta si no son los de siempre (3 y 3). El Nahual dura 3 días: 4 planetas de 4.
  { key: 'nahual', name: 'Nahual y Chaneques', date: (y) => new Date(y, 8, 21), days: 3, p: 4, n: 4, ready: true, local: true,
    ico: 'nahual', deco: 'chaneque', color: 'green',
    planets: ['Selva de los Chaneques', 'Cueva del Nahual', 'Templo del Jaguar', 'Planeta de la Luna Llena'],
    ex: [{ space: 'lunallena', frame: 'selva' }, { ring: 'enredadera', back: 'jaguar' }, { title: 'nahual', traveler: 'nahualito' }, { avatar: 'chaneque' }] },
  { key: 'xolo', name: 'Día del Xoloitzcuintle', date: (y) => new Date(y, 9, 27), ready: true, local: true,
    ico: 'xolito', deco: 'farolito', color: 'orange',
    planets: ['Sendero de Cempasúchil', 'Valle de las Huellitas', 'Planeta Xólotl'],
    ex: [{ space: 'sendero', frame: 'farolitos' }, { ring: 'collarxolo', back: 'xolos' }, { avatar: 'xologuia', title: 'guiaalmas', traveler: 'xolovuela' }] },
  { key: 'llorona', name: 'La Llorona', date: (y) => new Date(y, 10, 1), ready: true, local: true,
    ico: 'llorona', deco: 'velita', color: 'violet',
    planets: ['Río de la Luna', 'Lago de las Velitas', 'Planeta del Rebozo'],
    ex: [{ space: 'riodeluna', frame: 'rebozo' }, { ring: 'velitas', back: 'rebozos' }, { avatar: 'lloronita', title: 'almadelrio', traveler: 'trajinera' }] },
  { key: 'catrina', name: 'La Catrina', date: (y) => new Date(y, 10, 2), ready: true, local: true,
    ico: 'catrina', deco: 'pluma', color: 'pink',
    planets: ['Paseo de las Catrinas', 'Jardín de Dalias', 'Planeta Garbancera'],
    ex: [{ space: 'paseo', frame: 'catrina' }, { ring: 'dalias', back: 'elegante' }, { avatar: 'catrinita', title: 'elegancia', traveler: 'sombrerote' }] },
  { key: 'revolucion', name: 'Día de la Revolución', date: (y) => new Date(y, 10, 20), ready: true, local: true,
    ico: 'locomotora', deco: 'herradura', color: 'red',
    planets: ['Vías del Norte', 'Llanos del Caballo', 'Planeta Adelita'],
    ex: [{ space: 'llanura', frame: 'boleto' }, { ring: 'vias', back: 'locomotora' }, { avatar: 'revolucionario', title: 'valiente', traveler: 'tren' }] },
  { key: 'inocentes', name: 'Día de los Inocentes', date: (y) => new Date(y, 11, 28), ready: true,
    ico: 'bufon', deco: 'palomita', color: 'red',
    planets: ['Valle de las Bromas', 'Carpa del Bufón', 'Planeta Palomita'],
    ex: [{ space: 'bromas', frame: 'inocente' }, { ring: 'cascabeles', back: 'arlequin' }, { avatar: 'bufoncito', title: 'bromista', traveler: 'sorpresa' }] },
];
// ---------- Festividades nuevas (10 nov 2026, pedido del usuario) ----------
// grp 3: fiestas mexicanas (nivel 389). grp 4: fiestas de América (nivel 461). zone: dónde se celebra (lo dice la
// entrada: «Celebrando en …»). Las de varios días van como el Nahual (4 planetas de 4).
FESTIVALS.push(
  { key: 'bandera', name: 'Día de la Bandera', date: (y) => new Date(y, 1, 24), grp: 3, ready: true, zone: 'México',
    ico: 'banderita', deco: 'escarapela', color: 'green',
    planets: ['Plaza de las Banderas', 'Valle Tricolor', 'Planeta Abanderado'],
    ex: [{ space: 'abanderado', frame: 'banderin' }, { ring: 'banderines', back: 'tricolorb' }, { avatar: 'abanderado', title: 'escolta', traveler: 'astabandera' }] },
  { key: 'equinoccio', name: 'Equinoccio de Primavera', date: (y) => new Date(y, 2, 21), grp: 3, ready: true, zone: 'México',
    ico: 'piramide', deco: 'serpiente', color: 'gold',
    planets: ['Cenote Sagrado', 'Escalinata del Sol', 'Planeta Serpiente de Luz'],
    ex: [{ space: 'kukulcan', frame: 'grecas' }, { ring: 'plumaje', back: 'piramides' }, { avatar: 'serpientita', title: 'guardiansol', traveler: 'serpientevuela' }] },
  { key: 'posadas', name: 'Las Posadas', date: (y) => new Date(y, 11, 16), days: 9, p: 4, n: 4, grp: 3, ready: true, zone: 'México',
    ico: 'pinatestrella', deco: 'ponche', color: 'red',
    planets: ['Calle de los Faroles', 'Patio de la Piñata', 'Pueblo del Ponche', 'Planeta Posada'],
    ex: [{ space: 'posada', frame: 'papelpicado' }, { ring: 'farolitos7', back: 'pinatas7' }, { title: 'peregrino', traveler: 'pinatavuela' }, { avatar: 'pinatin' }] },
  { key: 'alasitas', name: 'Alasitas', date: (y) => new Date(y, 0, 24), grp: 4, ready: true, zone: 'Bolivia',
    ico: 'miniatura', deco: 'billetito', color: 'orange',
    planets: ['Feria Miniatura', 'Valle de los Deseos', 'Planeta Chiquitito'],
    ex: [{ space: 'feriamini', frame: 'deseos' }, { ring: 'casitas', back: 'miniaturas' }, { avatar: 'ekekito', title: 'sonador', traveler: 'casitavuela' }] },
  { key: 'tapati', name: 'Tapati Rapa Nui', date: (y) => new Date(y, 1, 1), grp: 4, ready: true, zone: 'Rapa Nui, Chile',
    ico: 'moai', deco: 'hibisco', color: 'blue',
    planets: ['Costa de los Moáis', 'Volcán Rano Kau', 'Planeta Isla de Pascua'],
    ex: [{ space: 'rapanui', frame: 'tapati' }, { ring: 'hibiscos', back: 'moais' }, { avatar: 'moaisito', title: 'isleno', traveler: 'canoa' }] },
  { key: 'carnaval', name: 'Carnaval', date: (y) => { const e = easter(y); return new Date(y, e.getMonth(), e.getDate() - 50); }, days: 4, p: 4, n: 4, grp: 4, ready: true, zone: 'toda Latinoamérica',
    ico: 'antifaz', deco: 'serpentina', color: 'violet',
    planets: ['Desfile de Comparsas', 'Calle de los Tambores', 'Plaza de las Máscaras', 'Planeta Carnaval'],
    ex: [{ space: 'carnaval', frame: 'comparsa' }, { ring: 'serpentinas', back: 'mascaras' }, { title: 'reycarnaval', traveler: 'carroza' }, { avatar: 'carnavalito' }] },
  { key: 'boyero', name: 'Día del Boyero', date: (y) => nthSunday(y, 2, 2), grp: 4, ready: true, zone: 'Costa Rica',
    ico: 'ruedacarreta', deco: 'buey', color: 'red',
    planets: ['Camino de las Carretas', 'Valle del Café', 'Planeta Boyero'],
    ex: [{ space: 'cafetal', frame: 'carreta' }, { ring: 'ruedas', back: 'carretas' }, { avatar: 'boyerito', title: 'boyero', traveler: 'carretavuela' }] },
  { key: 'guelaguetza', name: 'Guelaguetza', date: (y) => mondayAfter(y, 6, 16), grp: 4, ready: true, zone: 'Oaxaca, México',
    ico: 'flordepina', deco: 'canasta', color: 'pink',
    planets: ['Cerro del Fortín', 'Valle de las Ocho Regiones', 'Planeta Guelaguetza'],
    ex: [{ space: 'oaxaca', frame: 'bordado' }, { ring: 'listones', back: 'bordados' }, { avatar: 'chinita', title: 'danzante', traveler: 'canastavuela' }] },
  { key: 'papalotes', name: 'Día de los Papalotes', date: (y) => new Date(y, 8, 18), grp: 4, ready: true, zone: 'Chile y Guatemala',
    ico: 'volantin', deco: 'carrete', color: 'blue',
    planets: ['Cerro de los Volantines', 'Cielo de Barriletes', 'Planeta Viento'],
    ex: [{ space: 'vientos', frame: 'volantines' }, { ring: 'colitas', back: 'barriletes' }, { avatar: 'volantinito', title: 'elevado', traveler: 'barrilete' }] },
  { key: 'dulcedeleche', name: 'Día del Dulce de Leche', date: (y) => new Date(y, 9, 11), grp: 4, ready: true, zone: 'Argentina',
    ico: 'frasco', deco: 'alfajor', color: 'orange',
    planets: ['Valle del Alfajor', 'Río de Cajeta', 'Planeta Dulcecito'],
    ex: [{ space: 'dulceria', frame: 'alfajores' }, { ring: 'alfajorcitos', back: 'frascos' }, { avatar: 'alfajorcito', title: 'dulcero', traveler: 'frascovuela' }] },
  { key: 'pupusa', name: 'Día de la Pupusa', date: (y) => nthSunday(y, 10, 2), grp: 4, ready: true, zone: 'El Salvador',
    ico: 'pupusa', deco: 'curtido', color: 'green',
    planets: ['Comal Gigante', 'Valle del Curtido', 'Planeta Pupusa'],
    ex: [{ space: 'pupuseria', frame: 'comal' }, { ring: 'pupusitas', back: 'pupusas' }, { avatar: 'pupusita', title: 'pupusero', traveler: 'comalvuela' }] },
  { key: 'velitas', name: 'Día de las Velitas', date: (y) => new Date(y, 11, 7), grp: 4, ready: true, zone: 'Colombia',
    ico: 'farolpapel', deco: 'vela', color: 'gold',
    planets: ['Calle de los Faroles', 'Balcón de las Velitas', 'Planeta Luz'],
    ex: [{ space: 'nochevelitas', frame: 'faroles' }, { ring: 'velas', back: 'farolespapel' }, { avatar: 'farolin', title: 'luminoso', traveler: 'farolvuela' }] },
  { key: 'anioviejo', name: 'Año Viejo', date: (y) => new Date(y, 11, 31), grp: 4, ready: true, zone: 'Ecuador y Colombia',
    ico: 'monigote', deco: 'bengala', color: 'violet',
    planets: ['Calle de los Monigotes', 'Plaza del Reloj', 'Planeta Último Día'],
    ex: [{ space: 'aniviejo', frame: 'monigotes' }, { ring: 'chispasviejo', back: 'anioviejo' }, { avatar: 'monigotito', title: 'despedida', traveler: 'monigotevuela' }] },
);
// Subidas 50% el 6 nov 2026 (antes 20-50 y 300/200/400), como las del evento del mes.
export const FEST_COINS = [30, 45, 60, 75];
export const FEST_REPEAT = [{ coins: 450, undo: 2 }, { wild: 1, coins: 300 }, { wild: 2, coins: 600 }];
// Planetas (P), niveles por planeta (N) y niveles en total (L) de una festividad.
export const festShape = (f) => { const P = f?.p || FESTIVAL_PLANETS, N = f?.n || FESTIVAL_PER_PLANET; return { P, N, L: P * N }; };
const dayOf = (d) => Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / DAY);
// Las fiestas listas de un año, con su día (local) ya recorrido si chocan: [{ f, day }].
// all: también las de leyendas aunque aún no se abran (para el modo dev).
export function festivalDays(y, all = false) {
  const out = [];
  for (const f of FESTIVALS.filter((x) => x.ready && (all || ((!x.local || isOn('fiesta2')) && (!x.grp || isOn(`fiesta${x.grp}`))))).map((x) => ({ f: x, day: dayOf(x.date(y)) })).sort((a, b) => a.day - b.day)) {
    // 10 nov 2026: con las de varios días se mira que no se encimen (antes solo el día de inicio). La que empieza
    // después se recorre hasta que quede libre (p. ej. el Carnaval de 2031 cae del 22 al 25 de feb: la Bandera pasa al 26).
    const len = (x) => x.f.days || 1;
    while (out.some((o) => f.day < o.day + len(o) && o.day < f.day + len(f))) f.day++;
    out.push(f);
  }
  return out;
}
// Días antes de la fiesta en que ya se ve su botón (gris, con candado y la cuenta regresiva).
export const FESTIVAL_SOON = 3;
// La fiesta de hoy o la que viene en los próximos FIESTA_SOON días (null si ninguna). soon = todavía no empieza; inDays = días que faltan.
function festivalNow() {
  const day = today(), y = new Date((day + FESTIVAL_SOON) * DAY).getUTCFullYear();
  const all = [...festivalDays(y - 1), ...festivalDays(y)];
  // Las de varios días (days) siguen abiertas hasta su último día; endIn = días que le quedan después de hoy.
  const todayFest = all.find((x) => day >= x.day && day < x.day + (x.f.days || 1));
  if (todayFest) return { ...todayFest, soon: false, inDays: 0, endIn: todayFest.day + (todayFest.f.days || 1) - 1 - day };
  const next = all.filter((x) => x.day > day && x.day <= day + FESTIVAL_SOON).sort((a, b) => a.day - b.day)[0];
  return next ? { ...next, soon: true, inDays: next.day - day } : null;
}
// La festividad activa (o la que viene, con soon). Su avance vive en save.fi y se empieza de cero en cada edición.
export function festival() {
  if (!isOn('fiesta')) return null;
  const x = festivalNow();
  if (!x) return null;
  const id = `${x.f.key}-${x.day}`, base = { ...x.f, id, day: x.day, year: new Date(x.day * DAY).getUTCFullYear(), soon: x.soon, inDays: x.inDays };
  if (x.soon) return base;
  if (save.fi?.id !== id) {
    festRecord(); // la de antes, si se ganó completa, se queda en el álbum
    // Si la compró antes (preventa), ya entra pagada.
    save.fi = { id, k: 0, world: save.open || 0, paid: save.festPre === id, run: null, tries: {} };
    persist();
  }
  return { ...base, state: save.fi, done: save.fi.k >= festShape(x.f).L };
}
// Cuánto falta para que empiece (si todavía no) o para que termine (hoy).
export const festivalLeft = () => { const x = festivalNow(); return msToMidnight() + (x?.soon ? Math.max(0, x.inDays - 1) : x?.endIn || 0) * DAY; };
// Festividades pegadas (9 nov 2026): mientras dura una, la siguiente que cae en los próximos FIESTA_SOON días ya sale
// en su propio botón (gris, con candado y su preventa). null si no hay o si hoy no hay fiesta (entonces la que viene
// ya es fiesta()).
export function festivalSoon() {
  if (!isOn('fiesta')) return null;
  const x = festivalNow();
  if (!x || x.soon) return null;
  const day = today(), y = new Date((day + FESTIVAL_SOON) * DAY).getUTCFullYear();
  const next = [...festivalDays(y - 1), ...festivalDays(y)].filter((o) => o.day > x.day + (x.f.days || 1) - 1 && o.day <= day + FESTIVAL_SOON).sort((a, b) => a.day - b.day)[0];
  if (!next) return null;
  return { ...next.f, id: `${next.f.key}-${next.day}`, day: next.day, year: new Date(next.day * DAY).getUTCFullYear(), soon: true, inDays: next.day - day };
}
// Lo que falta para que empiece una festividad que todavía no llega.
export const soonLeft = (f) => msToMidnight() + Math.max(0, f.inDays - 1) * DAY;
// Días para la siguiente fiesta (modo dev: saltar al día de antes).
export function daysToNextFestival() {
  const day = today(), y = new Date(day * DAY).getUTCFullYear();
  const next = [...festivalDays(y), ...festivalDays(y + 1)].find((x) => x.day > day);
  return next ? next.day - day : 0;
}
// Modo dev: cuántos días mover el reloj para caer en el día en que empieza esa festividad (la de este año).
export function daysToFestival(key) {
  const day = today(), y = new Date(day * DAY).getUTCFullYear(), f = FESTIVALS.find((x) => x.key === key);
  const at = festivalDays(y).find((x) => x.f === f)?.day ?? dayOf(f.date(y));
  return at - day;
}
// La siguiente festividad lista (para decir cuándo llega): { name, ico, days } o null.
// skip: días que se saltan (modo dev: con 1, si mañana hay fiesta, da la que sigue).
export function nextFestival(skip = 0) {
  const day = today(), y = new Date(day * DAY).getUTCFullYear();
  const next = [...festivalDays(y), ...festivalDays(y + 1)].find((x) => x.day > day + skip);
  return next ? { ...next.f, days: next.day - day } : null;
}
export function festPrize(f, k, stars = 3) {
  const { P, N } = festShape(f), p = Math.floor(k / N);
  if (k % N !== N - 1) return { coins: FEST_COINS[p], items: [] };
  // Repetida: el último planeta da el premio grande; los de en medio, el del 2.º.
  return lastPrize(f.ex[p], FEST_REPEAT[p === P - 1 ? 2 : Math.min(p, 1)], FEST_COINS[p] * 3, stars);
}
// Entrar al nivel que sigue (sin boleto): cada intento cambia las cartas.
// Entrada a la festividad: se paga una vez (FI_ENTRY) y luego se juega todo el día.
// Antes de que empiece (soon) cuesta FI_PRE menos; comprada así queda en save.fiPre.
export const festPrice = (f) => tkPrice(f, f.soon ? FEST_ENTRY * (1 - FEST_PRE) : FEST_ENTRY);
export const festPre = (f) => f?.soon && save.festPre === f.id;
export function festPaid(f) {
  // Festividades empezadas antes de la entrada pagada: ya entraron gratis.
  if (f.state.paid == null) f.state.paid = true;
  return f.state.paid;
}
export function festBuy(f = festival()) {
  if (!f || (f.soon ? festPre(f) : festPaid(f))) return false;
  const p = festPrice(f);
  if (save.coins < p) return false;
  save.coins -= p;
  if (f.soon) save.festPre = f.id;
  else f.state.paid = true;
  persist();
  return p;
}
export function festEnter() {
  const f = festival();
  if (!f || f.soon || f.done || !festPaid(f)) return false;
  if (f.state.run) return true;
  f.state.run = { k: f.state.k, v: f.state.tries[f.state.k] || 0, state: null };
  f.state.tries[f.state.k] = f.state.run.v + 1;
  persist();
  return true;
}
export function festWin(stars = 3) {
  const f = festival();
  if (!f?.state?.run) return null;
  const k = f.state.run.k, prize = festPrize(f, k, stars);
  f.state.run = null;
  f.state.k = k + 1;
  save.coins += prize.coins || 0;
  save.undo += prize.undo || 0;
  save.wild += prize.wild || 0;
  for (const [k, n] of Object.entries(prize.helps || {})) save.helps[k] = (save.helps[k] || 0) + n;
  for (const it of prize.items) {
    save.owned[`${it.sec}:${it.k}`] = 1;
  }
  festRecord();
  persist();
  const { N, L } = festShape(f);
  return { ...prize, k, planet: Math.floor(k / N), last: k === L - 1 };
}
// Álbum: ganar todos los niveles de una festividad deja su postal para siempre, con el año en el sello
// (save.fiAlbum: 'clave-año' → 1).
function festRecord() {
  const s = save.fi;
  if (!s?.id) return;
  const [key, day] = s.id.split('-');
  if (s.k < festShape(FESTIVALS.find((f) => f.key === key)).L) return;
  save.festAlbum[`${key}-${new Date(day * DAY).getUTCFullYear()}`] = 1;
}
// Las postales de festividades, de la más nueva a la más vieja: [{ id, year, e }].
export function festAlbum() {
  festRecord(); // festividades ganadas antes de que existiera su postal
  // Las ganadas antes de que hubiera álbum: si tiene el avatar del último jefe, la terminó (año de su última fecha).
  const day = today(), y = new Date(day * DAY).getUTCFullYear();
  for (const f of FESTIVALS) {
    if (!f.ready || !save.owned[`avatar:${f.ex.find((x) => x.avatar).avatar}`] || Object.keys(save.festAlbum).some((id) => id.startsWith(`${f.key}-`))) continue;
    const last = [...festivalDays(y - 1), ...festivalDays(y)].filter((x) => x.f === f && x.day <= day).pop();
    if (last) save.festAlbum[`${f.key}-${new Date(last.day * DAY).getUTCFullYear()}`] = 1;
  }
  const order = (x) => x.year * 100 + FESTIVALS.indexOf(x.e);
  return Object.keys(save.festAlbum)
    .map((id) => { const [key, year] = id.split('-'); return { id, year: +year, e: FESTIVALS.find((f) => f.key === key) }; })
    .filter((x) => x.e?.ready)
    .sort((a, b) => order(b) - order(a));
}
// Perdió, abandonó o pidió reintentar: solo se cierra la partida (se puede volver a entrar cuando quiera).
export function festLose() {
  const f = festival();
  if (!f?.state?.run) return;
  f.state.run = null;
  persist();
}
export { FESTIVAL_PLANETS, FESTIVAL_PER_PLANET, FESTIVAL_LEVELS };
