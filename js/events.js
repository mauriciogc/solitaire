// Eventos (Fase 6): la racha diaria y la colección semanal.
// Racha: cuenta victorias seguidas de niveles nuevos (cualquier estrella). Perder o abandonar uno nuevo la regresa a 0.
// A medianoche (hora del teléfono) empieza otra. Siempre es la racha cohete (cambiar de temática cada día confundía,
// porque la colección también tiene temáticas). Los premios se reclaman a mano;
// los que se ganaron y no se reclamaron se guardan aunque la racha se reinicie.
import { save, persist } from './storage.js';
import { equip } from './shop.js';

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
    save.racha = { day, n: 0, got: [], pend: save.racha?.pend || [] };
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
  const r = racha();
  r.n++;
  RACHA_GOALS.forEach((g, i) => {
    if (r.n >= g.n && !r.got.includes(i)) r.got.push(i), r.pend.push(i);
  });
  persist();
  return r.n;
}
// Perdió o abandonó un nivel nuevo: vuelve a 0 (y se avisa al volver al mapa).
export function rachaLose() {
  const r = racha();
  if (!r.n) return;
  r.lost = r.n;
  r.n = 0;
  r.got = [];
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
