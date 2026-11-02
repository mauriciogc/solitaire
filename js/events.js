// Eventos (Fase 6): la racha diaria, la colección semanal y el evento del mes.
// Racha: cuenta victorias seguidas de niveles nuevos (cualquier estrella). Perder o abandonar uno nuevo, o rendirse
// en uno repetido, la regresa a 0. A medianoche (hora del teléfono) empieza otra. Siempre es la racha cohete (cambiar
// de temática cada día confundía, porque la colección también tiene temáticas). Los premios se reclaman a mano:
// los reclamados son tuyos; los que no, se pierden si la racha se reinicia o si pasa la medianoche.
import { save, persist } from './storage.js';
import { equip } from './shop.js';
import { EVENT_LEVELS, EVENT_PER_PLANET, EVENT_PLANETS } from './levels.js';

// Los eventos se abren poco a poco, según los niveles ganados (save.next): primero la racha, luego la colección
// y al final el evento del mes (el más difícil: pide comodines). Cada uno se presenta una vez (save.intro).
export const UNLOCK = { racha: 20, col: 50, mes: 80 };
export const isOn = (k) => (save.next || 0) >= UNLOCK[k];

export const RACHA_GOALS = [
  { n: 3, coins: 40 },
  { n: 5, coins: 80 },
  { n: 10, coins: 150, wild: 1 },
  { n: 15, coins: 250 },
  { n: 20, coins: 400, wild: 2 },
  { n: 30, coins: 700, wild: 3 },
];
// Nombre, icono y color de la ventana.
const RACHA_THEME = { key: 'cohete', name: 'Racha cohete', ico: 'rocket', color: 'pink' };

// Día local (cambia a medianoche). save.devDay solo lo mueve el modo dev ("otro día").
const today = () => {
  const d = new Date();
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5) + (save.devDay || 0);
};
export function racha() {
  const day = today();
  if (save.racha?.day !== day) {
    // Lo que no se reclamó ayer se pierde (como el regalo diario): se avisa al llegar al mapa.
    save.racha = { day, n: 0, got: [], pend: [], ...(save.racha?.pend?.length ? { expired: true } : {}) };
    persist();
  }
  return save.racha;
}
export const rachaTheme = () => RACHA_THEME;
export const rachaReady = () => racha().pend.length > 0;
export const nextGoal = () => RACHA_GOALS.find((g) => g.n > racha().n) || null;
// "En llamas": le falta muy poco para el siguiente premio (1 victoria; 2 si el tramo es largo).
export function rachaHot() {
  const r = racha(), i = RACHA_GOALS.findIndex((g) => g.n > r.n);
  if (i < 0) return false;
  const from = i ? RACHA_GOALS[i - 1].n : 0, left = RACHA_GOALS[i].n - r.n;
  return left <= Math.max(1, Math.ceil((RACHA_GOALS[i].n - from) * 0.2));
}
export const msToMidnight = () => {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d - Date.now();
};

// Ganó un nivel nuevo: suma 1 y aparta los premios que alcanzó.
export function rachaWin() {
  if (!isOn('racha')) return null;
  const r = racha();
  r.n++;
  RACHA_GOALS.forEach((g, i) => {
    if (r.n >= g.n && !r.got.includes(i)) r.got.push(i), r.pend.push(i);
  });
  persist();
  return r.n;
}
// Perdió o abandonó un nivel nuevo (o se rindió en uno repetido): vuelve a 0 y los premios sin reclamar se pierden
// (se avisa al volver al mapa).
export function rachaLose() {
  if (!isOn('racha')) return;
  const r = racha();
  if (!r.n) return;
  r.lost = r.n;
  r.n = 0;
  r.got = [];
  r.pend = [];
  persist();
}
// Junta los premios pendientes y los quita de la lista.
export function rachaClaim() {
  const r = racha(), p = { coins: 0, wild: 0 };
  for (const i of r.pend) (p.coins += RACHA_GOALS[i].coins), (p.wild += RACHA_GOALS[i].wild || 0);
  r.pend = [];
  persist();
  return p;
}

// ---------- Colección ----------
// Dos semanas al mes (las que empiezan el 1.º y el 3.er lunes): de lunes 00:00 a domingo 23:59, hora del teléfono.
// Cada estrella nueva que ganas da 1 ficha, como las monedas: si sacas 2★ y luego 3★, la segunda vez da 1.
// Las fichas se cambian en su tienda temporal; al terminar la semana, las que sobren se pierden.
// Lo exclusivo de cada temática (7 cosméticos) es tuyo para siempre. No alcanza para todo en una semana:
// la temática vuelve cada 2 meses y ahí se completa.
export const COLECCIONES = [
  { key: 'mar', name: 'Tesoros del mar', token: 'concha', tokens: 'conchas', color: 'blue',
    ex: { back: 'arrecife', title: 'buscaconchas', avatar: 'cangrejo', ring: 'burbujas', traveler: 'tortuga', frame: 'mar', space: 'marino' } },
  { key: 'gemas', name: 'Cueva de gemas', token: 'gema', tokens: 'gemas', color: 'violet',
    ex: { back: 'cristales', title: 'cazagemas', avatar: 'topo', ring: 'gemas', traveler: 'cristal', frame: 'gemas', space: 'cueva' } },
  { key: 'bosque', name: 'Bosque encantado', token: 'bellota', tokens: 'bellotas', color: 'green',
    ex: { back: 'hojas', title: 'guardabosques', avatar: 'ardilla', ring: 'hojas', traveler: 'hoja', frame: 'bosque', space: 'bosque' } },
  { key: 'dulces', name: 'Feria de dulces', token: 'caramelo', tokens: 'caramelos', color: 'pink',
    ex: { back: 'caramelos', title: 'golosito', avatar: 'osito', ring: 'caramelos', traveler: 'paleta', frame: 'dulces', space: 'algodon' } },
];
// Precio en fichas de cada exclusivo (igual en todas las temáticas). Suman 560: más de lo que se junta en una semana.
const EX_PRICE = { title: 40, frame: 50, space: 60, ring: 70, avatar: 90, back: 110, traveler: 140 };
const DAY = 864e5;
// Lunes de esta semana (en días locales) y si esa semana hay colección.
const mondayOf = (day) => day - ((day + 3) % 7); // el día 0 (1 ene 1970) fue jueves
const weekInfo = (monday) => {
  const d = new Date(monday * DAY), dom = d.getUTCDate();
  const on = dom <= 7 || (dom >= 15 && dom <= 21);
  return { on, theme: COLECCIONES[((d.getUTCFullYear() * 12 + d.getUTCMonth()) * 2 + (dom > 7 ? 1 : 0)) % COLECCIONES.length] };
};
// La colección activa (o null). Al cambiar de semana se empieza de cero: las fichas viejas se pierden.
export function col() {
  if (!isOn('col')) return null;
  const monday = mondayOf(today()), w = weekInfo(monday);
  if (!w.on) return null;
  if (save.col?.id !== monday) {
    save.col = { id: monday, n: 0, bought: {} };
    persist();
  }
  return { ...w.theme, state: save.col, monday };
}
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
export function colWin(stars, prev) {
  const c = col(), n = Math.max(0, stars - prev);
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
  return [
    ...ex,
    { k: 'wild', prize: { wild: 1 }, price: 12 * tier },
    { k: 'undo', prize: { undo: 3 }, price: 8 * tier },
    { k: 'tickets', prize: { tickets: 2 }, price: 5 * tier },
  ].sort((a, b) => a.price - b.price);
}
// Cambia fichas por una oferta. Devuelve la oferta (para entregar el premio) o null si no alcanza o ya es tuya.
export function colBuy(o) {
  const c = col();
  if (!c || c.state.n < o.price || (o.sec && save.owned[`${o.sec}:${o.item}`])) return null;
  c.state.n -= o.price;
  c.state.bought[o.k] = (c.state.bought[o.k] || 0) + 1;
  if (o.sec) {
    save.owned[`${o.sec}:${o.item}`] = 1;
    equip(o.sec, o.item);
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
export const EVENTOS = {
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
  6: { key: 'verano', name: 'Verano', color: 'blue', ready: false },
  8: { key: 'patrias', name: 'Fiestas Patrias', color: 'green', ready: false },
  9: { key: 'halloween', name: 'Halloween', color: 'violet', ready: false },
};
// Monedas de los niveles 1-4 de cada planeta (pocas) y lo que da el 5.º si ya tienes su exclusivo.
export const EV_COINS = [20, 25, 30, 35, 40];
export const EV_REPEAT = [{ coins: 300 }, { undo: 3 }, { wild: 1 }, { wild: 2, coins: 300 }, { wild: 3, coins: 600 }];
export const EV_TICKET_WAIT = DAY;

// Fecha del teléfono (el modo dev la mueve con save.devDay).
const now = () => new Date(Date.now() + (save.devDay || 0) * DAY);
const eventOf = (d) => {
  const e = EVENTOS[d.getMonth()];
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
    save.ev = { id: e.id, k: 0, world: save.open || 0, tk: 1, at: 0, run: null, tries: {} };
    persist();
  }
  const s = save.ev;
  // El boleto que se gastó vuelve a las 24 h.
  if (!s.tk && s.at && Date.now() - s.at >= EV_TICKET_WAIT) {
    s.tk = 1;
    s.at = 0;
    persist();
  }
  return { ...e, state: s, done: s.k >= EVENT_LEVELS };
}
// Cuánto falta para el siguiente boleto (0 = ya tienes).
export const evTicketLeft = () => {
  const e = ev();
  return !e || e.state.tk ? 0 : Math.max(0, e.state.at + EV_TICKET_WAIT - Date.now());
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
export function evPrize(e, k) {
  const p = Math.floor(k / EVENT_PER_PLANET);
  if (k % EVENT_PER_PLANET !== EVENT_PER_PLANET - 1) return { coins: EV_COINS[p], items: [] };
  const items = Object.entries(e.ex[p]).filter(([sec, it]) => !save.owned[`${sec}:${it}`]).map(([sec, it]) => ({ sec, k: it }));
  return items.length ? { items } : { ...EV_REPEAT[p], items: [], repeat: true };
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
// Ganó el nivel: el boleto vuelve, se avanza y se entrega el premio (los exclusivos quedan puestos).
export function evWin() {
  const e = ev();
  if (!e?.state.run) return null;
  const k = e.state.run.k, prize = evPrize(e, k);
  e.state.run = null;
  e.state.tk = 1;
  e.state.at = 0;
  e.state.k = k + 1;
  evRecord();
  save.coins += prize.coins || 0;
  save.undo += prize.undo || 0;
  save.wild += prize.wild || 0;
  for (const it of prize.items) {
    save.owned[`${it.sec}:${it.k}`] = 1;
    equip(it.sec, it.k);
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
    .map((id) => ({ id: +id, year: Math.floor(id / 12), e: EVENTOS[id % 12] }))
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
