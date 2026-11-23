// Tripulación lunar (19 nov 2026, pedido del usuario: «me gusta, pero temática lunar… que se vea como la carrera de 7,
// pero orientado a las cajas»). Desde el nivel 111 (UNLOCK.tripulacion).
// - Cada semana (de lunes a domingo) tú y 4 viajeros de mentira (simulados aquí, sin servidor) juntan estrellas.
// - Te inscribes con su boleto (gratis; hasta inscribirte no ves cuánto llevan). Tus estrellas: las nuevas que ganes en el camino desde que te uniste (también mejorar un
//   nivel). Los viajeros suman un poco cada día, sorteado con la semana (recargar no cambia nada).
// - La meta tiene 3 bases: bronce, plata y oro (CREW_GOALS, estrellas de todos juntos). Te llevas UN cofre, el de la base
//   más alta a la que lleguen (19 nov 2026, el usuario: «¿ganan los tres cofres? ¿no es mejor solo al que llegaron?»):
//   si llegan al oro, al momento; si no, al cerrar la semana (sale el lunes al entrar).
// - Si llegan al oro antes, sale su cofre y se bloquea: el boleto dice en cuánto empieza la siguiente.
// - El domingo a medianoche se acaba y el lunes empieza otra (otra vez con el boleto para inscribirse).
import { save, persist } from './storage.js';

export const CREW_BOTS = 4;
// Estrellas de todos juntos para cada base (bronce, plata, oro). Los viajeros juntan ~100 en la semana: el bronce casi
// sale con ellos; la plata y el oro piden que tú ayudes (~40 y ~100 tuyas).
// 21 nov 2026 (el usuario): +15 estrellas a cada base (90/150/210 → 105/165/225).
// 23 nov 2026 (el usuario): +20% (105/165/225 → 126/198/270).
export const CREW_GOALS = [126, 198, 270];
export const CREW_METAL = ['bronce', 'plata', 'oro'];
// 20 nov 2026 (el usuario): premios −25% (300/600/1,200 → 225/450/900). 21 nov 2026: −3% (220/435/875).
export const CREW_PRIZE = [
  { coins: 220, undo: 1 },
  { coins: 435, wild: 1, undo: 1 },
  { coins: 875, wild: 2, undo: 2, helps: { reloj: 1, ver3: 1 } },
];
// Mejora con las constelaciones, como la carrera: +10% por constelación, tope ×3.
export const crewK = () => Math.min(3, 1 + 0.1 * Math.floor((save.open || 0) / 10));
const NAMES = ['Luna', 'Tito', 'Nova', 'Peter', 'Sofi', 'Leo', 'Valen', 'Kai', 'Mía', 'Bruno', 'Emi', 'Zoe', 'Teo', 'Lía', 'Max', 'Ana', 'Pau', 'Gael', 'Ixchel', 'Nico', 'Inti', 'Coco', 'Rubi', 'Santi'];
const round5 = (n) => Math.round(n / 5) * 5;
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// Hoy (día local; save.devDay lo mueve el modo dev) y la semana (empieza el lunes: el 1 de enero de 1970 fue jueves).
const nowMs = () => Date.now() + (save.devDay || 0) * 864e5;
const dayNum = (ms = nowMs()) => Math.floor((ms - new Date(ms).getTimezoneOffset() * 6e4) / 864e5);
export const crewWeek = () => Math.floor((dayNum() + 3) / 7);
// Día de la semana (0 = lunes) y qué tanto va del día (0 a 1).
export const crewDay = () => (dayNum() + 3) % 7;
const dayPart = () => { const d = new Date(nowMs()); return (d.getHours() * 60 + d.getMinutes()) / 1440; };
// Milisegundos para que se acabe la semana (domingo a medianoche).
export function crewLeft() {
  const d = new Date(nowMs());
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (7 - crewDay()));
  return Math.max(0, end - d);
}

// La de esta semana (si la del guardado es de otra, empieza una nueva sin unirte).
export function crew() {
  const w = crewWeek();
  if (save.crew?.w !== w) {
    // 19 nov 2026 (el usuario: «¿qué pasa si llegan a plata el domingo y entro hasta el lunes?»): antes de empezar la
    // nueva, la anterior se cierra con los viajeros completos (los 7 días); las bases que alcanzaron y no se habían
    // cobrado se cobran ahora y sus cofres salen al volver al mapa (save.crewOwed), antes del boleto nuevo.
    const old = save.crew;
    if (old?.on) {
      for (const k of old.pending || []) (save.crewOwed ||= []).push(k);
      // Si no llegaron al oro, el cofre de la base más alta (con los viajeros completos, los 7 días).
      const n = reached(old.mine + old.bots.reduce((a, b) => a + b.days.reduce((x, y) => x + y, 0), 0));
      if (!old.paid && n > 0) {
        pay(crewPrize(n - 1));
        (save.crewOwed ||= []).push(n - 1);
      }
    }
    const r = rng(w * 7919 + 13);
    const names = [...NAMES].sort(() => r() - 0.5).slice(0, CREW_BOTS);
    // Cada viajero, sus estrellas por día (2-6; ~4 de promedio).
    const bots = names.map((name, i) => ({ name, av: (i * 3 + Math.floor(r() * 8)) % 8, days: Array.from({ length: 7 }, () => 2 + Math.floor(r() * 5)) }));
    save.crew = { w, on: false, mine: 0, got: 0, bots, pending: [] };
    persist();
  }
  return save.crew;
}
// Estrellas de un viajero hasta ahorita (los días pasados completos y lo que va de hoy).
export const botStars = (b) => b.days.slice(0, crewDay()).reduce((a, x) => a + x, 0) + Math.floor(b.days[crewDay()] * dayPart());
// Llegaron al oro: se bloquea hasta la semana que sigue.
export const crewDone = (c = crew()) => !!c.paid;
// Cuántas bases alcanzan t estrellas.
const reached = (t) => CREW_GOALS.filter((g) => t >= g).length;
export const crewTotal = (c = crew()) => c.mine + c.bots.reduce((a, b) => a + botStars(b), 0);
export const crewPrize = (k) => { const p = CREW_PRIZE[k]; return { ...structuredClone(p), coins: round5(p.coins * crewK()), metal: CREW_METAL[k] }; };

export function crewJoin() {
  const c = crew();
  c.on = true;
  persist();
  crewCheck();
  return c;
}
// Ganaste estrellas nuevas en el camino.
export function crewAdd(n) {
  const c = crew();
  if (!c.on || n <= 0) return;
  c.mine += n;
  crewCheck();
  persist();
}
// ¿Hasta qué base llegaron? (c.got, para enseñarlo). Solo el oro se cobra al momento (los demás, al cerrar la semana).
export function crewCheck() {
  const c = crew();
  if (!c.on) return [];
  const n = reached(crewTotal(c)), out = [];
  if (n > c.got) c.got = n;
  if (n === CREW_GOALS.length && !c.paid) {
    pay(crewPrize(n - 1));
    c.paid = true;
    c.pending.push(n - 1);
    out.push(n - 1);
  }
  persist();
  return out;
}
function pay(p) {
  save.coins += p.coins || 0;
  save.wild += p.wild || 0;
  save.undo += p.undo || 0;
  for (const [k, n] of Object.entries(p.helps || {})) save.helps[k] = (save.helps[k] || 0) + n;
}
