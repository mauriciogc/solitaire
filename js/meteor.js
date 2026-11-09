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
export const MET_FROM = 45;
export const MET_MIN = 30; // minutos que dura
// Premio de las 3 estrellas (provisional, se revisa con la economía): exclusivo, comodín y si no, deshacer.
export const MET_ODDS = { item: 0.08, wild: 0.3 };
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
    return { id: `${day}-${m}`, at, end: at + MET_MIN * MIN };
  });
}
// La lluvia que cae ahora (o null): { id, end (hora real), left() }.
export function meteor() {
  const real = Date.now();
  // Modo dev: "Que caiga ya" (save.devMet = cuándo empezó, hora real).
  if (save.devMet && real - save.devMet < MET_MIN * MIN) return at({ id: `dev-${save.devMet}`, end: save.devMet + MET_MIN * MIN });
  if ((save.next || 0) < MET_FROM) return null;
  const t = real + shift(), wk = Math.floor(localDay(t) / 7);
  const s = weekShowers(wk).find((x) => x.at <= t && t < x.end && x.id !== save.devMetOff);
  return s ? at({ id: s.id, end: s.end - shift() }) : null;
}
const at = (m) => {
  if (save.met?.id !== m.id) {
    save.met = { id: m.id, intro: false, prize: false };
    persist();
  }
  return { ...m, state: save.met, left: () => Math.max(0, m.end - Date.now()) };
};
// Las siguientes lluvias desde ahora (para el modo dev): [{ at, end }] con la hora del teléfono.
export function nextShowers(n = 4) {
  const t = Date.now() + shift(), wk = Math.floor(localDay(t) / 7), out = [];
  for (let k = 0; out.length < n; k++) out.push(...weekShowers(wk + k).filter((x) => x.end > t));
  return out.slice(0, n);
}

// Exclusivos de meteoro (`met` en shop.js) que todavía no tiene: [{ sec, k }].
export const metItems = () => SECTIONS.flatMap(({ k: sec }) => ITEMS[sec].filter((it) => it.met).map((it) => ({ sec, k: it.k })));
const missing = () => metItems().filter((x) => !owns(x.sec, x.k));

// Ganó un nivel. id: la lluvia en que empezó el nivel (o la de ahora). Devuelve lo que da la lluvia o null:
// { x2: true, prize? } — las monedas ya las dobla quien llama (ver metCoins); el premio ya queda en el guardado.
export function metWin(id, stars) {
  if (!id || save.met?.id !== id) return null;
  const out = { x2: true };
  if (stars >= 3 && !save.met.prize) {
    save.met.prize = true;
    const r = Math.random(), left = missing();
    // Modo dev ("Que el premio sea un exclusivo"): esta vez sale uno seguro.
    const force = save.devMetItem && left.length;
    delete save.devMetItem;
    if (left.length && (force || r < MET_ODDS.item)) {
      const it = left[Math.floor(Math.random() * left.length)];
      save.owned[`${it.sec}:${it.k}`] = 1;
      out.prize = { items: [it] };
    } else if (r < MET_ODDS.item + MET_ODDS.wild) {
      save.wild++;
      out.prize = { wild: 1 };
    } else {
      save.undo++;
      out.prize = { undo: 1 };
    }
    persist();
  }
  return out;
}
// Monedas de un nivel ganado durante la lluvia.
export const metCoins = (n, met) => (met ? n * 2 : n);
