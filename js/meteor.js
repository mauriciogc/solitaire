// Lluvia de meteoritos (Fase 8): 2 o 3 veces por semana cae una lluvia de 30 minutos, a cualquier hora y sin aviso
// antes. Si no abriste el juego en esa media hora, te la perdiste. Mientras cae, las monedas de cada nivel ganado
// valen el doble; y el primer nivel que ganes con 3 estrellas da un premio (uno por lluvia): casi siempre un
// deshacer, a veces un comodín y muy rara vez un exclusivo de meteoro (si ya los tienes todos, solo lo de siempre).
// Solo en el camino (niveles normales y secretos): el evento del mes y las festividades no cuentan.
// No hay servidor: el horario sale de la semana con una semilla, así es igual en todos los teléfonos.
// Un nivel empezado durante la lluvia cuenta aunque se gane cuando ya terminó.
import { save, persist } from './storage.js';
import { hash, mulberry32, randInt, shuffle } from './rng.js';
import { SECTIONS, ITEMS, owns } from './shop.js';

// Niveles ganados para que empiece a caer (8 nov 2026: con ventana de desbloqueo, UNLOCK_INFO.meteoro en main.js).
// 45 y no 40: en 40 se abren los logros y salían dos ventanas seguidas (ver el recuento del modo dev).
export const MET_FROM = 80; // 8 nov 2026: a 10 niveles de logros (70) y colecciones (90)
export const MET_MIN = 30; // minutos que dura
// Premio de las 3 estrellas (provisional, se revisa con la economía): exclusivo, comodín y si no, deshacer.
export const MET_ODDS = { item: 0.08, wild: 0.3 };
// Lluvia de estrellas (11 nov 2026, pedido del usuario): la misma dinámica, más corta y da más. 2 o 3 por semana
// (12 nov 2026; antes 1), 15 minutos, desde STAR_FROM niveles ganados, en días sin lluvia de meteoritos. Monedas ×3,
// tienda −25%, comodín −35%, +5 −20%, deshacer y las demás ayudas −50% y hasta 3 premios (uno por cada nivel con
// 3 estrellas), con más suerte de exclusivo.
export const STAR_FROM = 250;
export const STAR_MIN = 15;
// Lo que cambia de cada lluvia. x: monedas · shop: descuento de la tienda · help: de las ayudas (por clave; all: las
// que no se nombran) · prizes: premios por lluvia · odds del premio.
export const SHOWERS = {
  met: { kind: 'met', name: 'Lluvia de meteoritos', ico: 'meteoro', sky: 'meteoro', x: 2, help: { all: 0.3, extra: 0 }, shop: 0.1, prizes: 1, odds: MET_ODDS, min: MET_MIN },
  star: { kind: 'star', name: 'Lluvia de estrellas', ico: 'starFall', sky: 'starDot', x: 3, help: { all: 0.5, wild: 0.35, extra: 0.2 }, shop: 0.25, prizes: 3, odds: { item: 0.15, wild: 0.5 }, min: STAR_MIN },
};
const MIN = 6e4, DAY = 864e5;

// Hora del teléfono (el modo dev la mueve de día con save.devDay).
const shift = () => (save.devDay || 0) * DAY;
const localDay = (t) => {
  const d = new Date(t);
  return Math.floor((t - d.getTimezoneOffset() * MIN) / DAY);
};
// Las lluvias de una semana (días locales 7·wk … 7·wk+6): [{ id, at, end }] con la hora del teléfono.
// Nunca cruzan la medianoche (empiezan a más tardar 23:30).
export function weekShowers(wk) {
  const r = mulberry32(hash(wk * 7919 + 13));
  const n = r() < 0.5 ? 2 : 3;
  const days = shuffle(r, [0, 1, 2, 3, 4, 5, 6]).slice(0, n).sort((a, b) => a - b);
  return days.map((d) => {
    const m = randInt(r, 0, 24 * 60 - MET_MIN);
    const day = wk * 7 + d, at = new Date(1970, 0, 1 + day, 0, m).getTime();
    return { id: `${day}-${m}`, day: d, at, end: at + MET_MIN * MIN };
  });
}
// Descuento de una ayuda en la lluvia K (0 si no rebaja).
export const helpOff = (K, kind) => K?.help[kind] ?? K?.help.all ?? 0;
// Las lluvias de estrellas de una semana: 2 o 3, en días sin lluvia de meteoritos, a cualquier hora.
export function weekStars(wk) {
  const r = mulberry32(hash(wk * 104729 + 71));
  const busy = new Set(weekShowers(wk).map((x) => x.day));
  const free = shuffle(r, [0, 1, 2, 3, 4, 5, 6].filter((d) => !busy.has(d)));
  return free.slice(0, r() < 0.5 ? 2 : 3).sort((a, b) => a - b).map((d) => {
    const m = randInt(r, 0, 24 * 60 - STAR_MIN);
    const day = wk * 7 + d, at = new Date(1970, 0, 1 + day, 0, m).getTime();
    return { id: `s${day}-${m}`, day: d, at, end: at + STAR_MIN * MIN };
  });
}
// La lluvia que cae ahora (o null): { id, end (hora real), left(), state, K (SHOWERS) }. La de estrellas va primero.
export function meteor() {
  const real = Date.now();
  // Modo dev: "Que caiga ya" (save.devStar / save.devMet = cuándo empezó, hora real).
  if (save.devStar && real - save.devStar < STAR_MIN * MIN) return at({ id: `devs-${save.devStar}`, end: save.devStar + STAR_MIN * MIN }, SHOWERS.star);
  if (save.devMet && real - save.devMet < MET_MIN * MIN) return at({ id: `dev-${save.devMet}`, end: save.devMet + MET_MIN * MIN }, SHOWERS.met);
  const n = save.next || 0;
  if (n < MET_FROM) return null;
  const t = real + shift(), wk = Math.floor(localDay(t) / 7);
  if (n >= STAR_FROM) {
    const s = weekStars(wk).find((x) => x.at <= t && t < x.end && x.id !== save.devMetOff);
    if (s) return at({ id: s.id, end: s.end - shift() }, SHOWERS.star);
  }
  const s = weekShowers(wk).find((x) => x.at <= t && t < x.end && x.id !== save.devMetOff);
  return s ? at({ id: s.id, end: s.end - shift() }, SHOWERS.met) : null;
}
// state.prize: premios ya dados en esta lluvia (antes true/false: true cuenta como 1).
const at = (m, K) => {
  if (save.met?.id !== m.id) {
    save.met = { id: m.id, intro: false, prize: 0 };
    persist();
  }
  return { ...m, K, state: save.met, left: () => Math.max(0, m.end - Date.now()) };
};
export const metPrizes = (st) => +(st?.prize || 0);
// Las siguientes lluvias desde ahora (para el modo dev): [{ at, end }] con la hora del teléfono. stars: las de estrellas.
export function nextShowers(n = 4, stars = false) {
  const t = Date.now() + shift(), wk = Math.floor(localDay(t) / 7), out = [];
  for (let k = 0; out.length < n; k++) out.push(...(stars ? weekStars(wk + k) : weekShowers(wk + k)).filter((x) => x.end > t));
  return out.slice(0, n);
}

// Exclusivos de cada lluvia: [{ sec, k }]. kind 'met' (`met` en shop.js) o 'star' (12 nov 2026: los suyos, `star`,
// starshower.js; antes la de estrellas daba los de meteoro).
export const metItems = (kind = 'met') => SECTIONS.flatMap(({ k: sec }) => ITEMS[sec].filter((it) => (kind === 'star' ? it.star : it.met)).map((it) => ({ sec, k: it.k })));
const missing = (kind) => metItems(kind).filter((x) => !owns(x.sec, x.k));

// Ganó un nivel. id: la lluvia en que empezó el nivel (o la de ahora). Devuelve lo que da la lluvia o null:
// { x2: true, prize? } — las monedas ya las dobla quien llama (ver metCoins); el premio ya queda en el guardado.
export function metWin(id, stars) {
  if (!id || save.met?.id !== id) return null;
  const K = id.startsWith('s') || id.startsWith('devs-') ? SHOWERS.star : SHOWERS.met, O = K.odds;
  const out = { x2: true, x: K.x, kind: K.kind };
  if (stars >= 3 && metPrizes(save.met) < K.prizes) {
    save.met.prize = metPrizes(save.met) + 1;
    const r = Math.random(), left = missing(K.kind);
    // Modo dev ("Que el premio sea un exclusivo"): esta vez sale uno seguro.
    const force = save.devMetItem && left.length;
    delete save.devMetItem;
    if (left.length && (force || r < O.item)) {
      const it = left[Math.floor(Math.random() * left.length)];
      save.owned[`${it.sec}:${it.k}`] = 1;
      out.prize = { items: [it] };
    } else if (r < O.item + O.wild) {
      save.wild++;
      out.prize = { wild: 1 };
    } else {
      // En la de estrellas, 3 deshacer (un paquete); en la de meteoritos, 1.
      const u = K.kind === 'star' ? 3 : 1;
      save.undo += u;
      out.prize = { undo: u };
    }
    persist();
  }
  return out;
}
// Monedas de un nivel ganado durante la lluvia.
export const metCoins = (n, met) => (met ? n * (met.x || 2) : n);
