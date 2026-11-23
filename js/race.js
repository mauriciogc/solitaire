// Carrera de 7 (18 nov 2026, idea de Royal Match; reglas del usuario). Desde el nivel 61 (UNLOCK.carrera).
// - Tú le das «Empezar». Corres contra 4 viajeros de mentira (simulados aquí, sin servidor).
// - Cada nivel NUEVO del camino que ganas al primer intento es un escalón. Perderlo, rendirte o abandonarlo te saca.
//   Las ayudas sí se valen. Repetir niveles ganados no cuenta. Sin tiempo límite.
// - Los viajeros suben contigo, escalón por escalón, o se caen. Todo se sortea al empezar (recargar no cambia nada).
// - Al llegar al 7: lugar por estrellas entre los que llegaron (21★ = 1.º; si empatas, el lugar es tuyo). Cofre con
//   el metal del lugar: oro, plata, bronce, cobre. Si te caes: cofre chico de cobre por los escalones que llevabas.
// - Siempre se da algo. Al terminar, 1 hora para la siguiente (23 nov 2026; eran 30 minutos).
// Los premios se guardan en cuanto se deciden (aunque cierres antes de ver la ventana); la ventana va en main.js.
import { save, persist } from './storage.js';
import { track } from './missions.js';

export const RACE_STEPS = 7;
export const RACE_BOTS = 4;
// 23 nov 2026 (el usuario): una carrera cada hora (eran 30 minutos).
export const RACE_WAIT = 60 * 60 * 1000;
// Bolsa de monedas que se reparte por lugar (1.º a 4.º); con un 5.º lugar (los 4 te ganaron) va el del 4.º.
// 20 nov 2026 (el usuario): cofres −35% (bolsa 3,000 → 1,950; si te caes 30+40 → 20+26 por escalón).
// 21 nov 2026 (el usuario): otro −17% (bolsa 1,950 → 1,620; si te caes 20+26 → 17+22 por escalón) y luego −3%
// (bolsa 1,570; si te caes 16+21). 23 nov 2026 (el usuario): otro −10% (bolsa 1,415; si te caes 8+10.5 → 7.2+9.45).
export const RACE_POT = 1415;
export const RACE_SPLIT = [0.5, 0.25, 0.15, 0.1];
// 21 nov 2026 (el usuario): al 1.º se le quitan un deshacer, el reloj y el ojo (ver 3); al 2.º, un deshacer.
export const RACE_HELPS = [
  { wild: 2, undo: 2 },
  { wild: 1, undo: 1, helps: { ver3: 1 } },
  { undo: 2, helps: { reloj: 1 } },
  { undo: 1 },
];
export const RACE_METAL = ['oro', 'plata', 'bronce', 'cobre'];
// Si te caes: monedas por escalón (con 0 escalones también hay algo).
// 21 nov 2026 (el usuario): si te caes, 50% menos (16 + 21 → 8 + 10.5).
export const RACE_LOSE = { base: 7.2, step: 9.45 };
// Mejora con las constelaciones (el usuario: «conforme avanzan las galaxias»): +10% por constelación, tope ×3.
export const raceK = () => Math.min(3, 1 + 0.1 * Math.floor((save.open || 0) / 10));
// Viajeros: cuántos pasan cada nivel y cuántas estrellas sacan (en promedio ~2.4 por nivel).
const SURVIVE = 0.86;
const STARS = [[3, 0.55], [2, 0.33], [1, 0.12]];
const NAMES = ['Luna', 'Tito', 'Nova', 'Peter', 'Sofi', 'Leo', 'Valen', 'Kai', 'Mía', 'Bruno', 'Emi', 'Zoe', 'Teo', 'Lía', 'Max', 'Ana', 'Pau', 'Gael', 'Ixchel', 'Nico', 'Inti', 'Coco', 'Rubi', 'Santi'];

const round5 = (n) => Math.round(n / 5) * 5;
const sum = (a) => a.reduce((n, x) => n + x, 0);
// 18 nov 2026 (el usuario): Mateo ahora se llama Peter (también en una carrera que ya iba).
export const race = () => { save.race?.bots?.forEach((b) => b.name === 'Mateo' && (b.name = 'Peter')); return save.race || null; };
// La carrera va (empezada y sin terminar).
export const raceOn = () => !!race()?.on && !race().out && !race().done;
// Milisegundos para poder empezar otra (0 = ya se puede).
export const raceWaitLeft = (now = Date.now()) => (race()?.on ? 0 : Math.max(0, (race()?.next || 0) - now));
export const raceReady = () => !race()?.on && !raceWaitLeft();

export function raceStart(r = Math.random) {
  // 21 nov 2026 (el usuario): en la primera carrera (al abrirse) siempre va Peter, con otros 3 al azar.
  const first = !race();
  const names = [...NAMES].filter((n) => !first || n !== 'Peter').sort(() => r() - 0.5).slice(0, RACE_BOTS - first);
  if (first) names.splice(Math.floor(r() * RACE_BOTS), 0, 'Peter');
  const bots = names.map((name, i) => {
    let fall = RACE_STEPS;
    for (let k = 0; k < RACE_STEPS; k++) if (r() > SURVIVE) { fall = k; break; }
    const stars = Array.from({ length: RACE_STEPS }, () => { let x = r(); return STARS.find(([, p]) => (x -= p) < 0)?.[0] || 1; });
    return { name, av: (i * 3 + Math.floor(r() * 8)) % 8, fall, stars };
  });
  save.race = { n: (race()?.n || 0) + 1, on: true, step: 0, seen: 0, stars: [], lv: null, bots, out: false, done: false, prize: null, pending: false };
  persist();
  return save.race;
}
// Al empezar un nivel nuevo del camino. resume: es el mismo intento (se cerró la app o Guardar y salir).
// Si ese nivel ya se había empezado en la carrera y no es continuar, es otro intento: te caes.
export function raceBegin(g, resume = false) {
  const r = race();
  if (!raceOn()) return;
  if (r.lv === g && !resume) return raceLose(g);
  r.lv = g;
  persist();
}
// Ganaste el nivel g (nuevo) con estas estrellas. Devuelve true si contó.
export function raceWin(g, stars) {
  const r = race();
  if (!raceOn() || r.lv !== g) return false;
  r.step++;
  r.stars.push(stars);
  r.lv = null;
  r.pending = true;
  if (r.step >= RACE_STEPS) {
    r.done = true;
    r.place = racePlace(r);
    pay(r, racePrize(r.place));
    // Logros «Corredor espacial» y «Campeón de carreras».
    track({ races: 1, raceWins: r.place === 1 ? 1 : 0 });
  }
  persist();
  return true;
}
// Perdiste, te rendiste o abandonaste el nivel g de la carrera.
export function raceLose(g) {
  const r = race();
  if (!raceOn() || r.lv !== g) return false;
  r.out = true;
  r.lv = null;
  r.pending = true;
  pay(r, raceLosePrize(r.step));
  persist();
  return true;
}
function pay(r, p) {
  r.prize = p;
  save.coins += p.coins || 0;
  save.wild += p.wild || 0;
  save.undo += p.undo || 0;
  for (const [k, n] of Object.entries(p.helps || {})) save.helps[k] = (save.helps[k] || 0) + n;
}
// Cerró la ventana final: se acaba y empieza la espera.
export function raceClose() {
  const r = race();
  if (!r?.on || !(r.out || r.done)) return;
  r.on = false;
  r.pending = false;
  r.next = Date.now() + RACE_WAIT;
  persist();
}
export const racePrize = (place) => ({ coins: round5(RACE_POT * RACE_SPLIT[place - 1] * raceK()), metal: RACE_METAL[place - 1], ...structuredClone(RACE_HELPS[place - 1]) });
export const raceLosePrize = (step) => ({ coins: round5((RACE_LOSE.base + RACE_LOSE.step * step) * raceK()), metal: 'cobre', small: true });
// Cómo va un viajero cuando tú llevas s escalones: dónde está, si ya se cayó y sus estrellas.
export function botAt(b, s) {
  const at = Math.min(s, b.fall);
  return { at, out: b.fall < s, stars: sum(b.stars.slice(0, at)) };
}
export const myStars = (r = race()) => sum(r?.stars || []);
// Tu lugar al terminar: 1 + los viajeros que llegaron con más estrellas (empates para ti). Tope: 4.º.
export function racePlace(r = race()) {
  const mine = myStars(r);
  return Math.min(4, 1 + r.bots.filter((b) => b.fall >= RACE_STEPS && sum(b.stars) > mine).length);
}
