// Misiones del día y logros (7 nov 2026).
// Misiones: cada día (medianoche, hora del teléfono) tocan 3 de una lista de ~25, escogidas con la fecha (iguales en
// todo el día). Solo las que ya puedes hacer (las de cartas especiales, cuando ya llegaste a su mundo). Cada una da
// monedas al reclamarla y las 3 juntas dan un cofre extra. Lo que no se reclama se pierde a medianoche.
// Logros: para siempre. Cada uno tiene 3 escalones (bronce, plata y oro) con monedas; el oro da además un título.
// Los dos se alimentan de lo mismo: track(stats) al terminar cada nivel (y al tronar burbujas o globos).
import { save, persist } from './storage.js';
import { MECH_INTRO, LEVELS_PER_WORLD } from './levels.js';
import { mulberry32, hash } from './rng.js';

export const MIS_FROM = 30; // nivel en que se abren (save.next); igual que UNLOCK en events.js
export const LOGROS_FROM = 40;
const DAY = 864e5;
const today = () => {
  const d = new Date();
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / DAY) + (save.devDay || 0);
};
const round5 = (n) => Math.round(n / 5) * 5;
// Monedas: suben poquito con cada constelación (como los niveles).
const constK = () => 1 + 0.03 * Math.floor((save.open || 0) / 10);

// k: dato que cuenta (ver track) · goals: metas posibles (se escoge una) · tier: 1 fácil, 2 media, 3 difícil
// mech: carta especial que necesita (por su mundo) · ev: solo si hay evento del mes pagado.
// best: cuenta el mejor de un nivel (no se suma). text(n): cómo se dice.
export const MISSIONS = [
  { id: 'win', k: 'win', goals: [3, 5], tier: 1, ico: 'flag', text: (n) => `Gana ${n} niveles` },
  { id: 'stars', k: 'stars', goals: [8, 12], tier: 1, ico: 'star', text: (n) => `Consigue ${n} estrellas` },
  { id: 'three', k: 'three', goals: [2, 3], tier: 2, ico: 'crown', text: (n) => `Gana ${n} niveles con 3 estrellas` },
  { id: 'cards', k: 'cards', goals: [200, 300], tier: 2, ico: 'card', text: (n) => `Juega ${n} cartas` },
  { id: 'streak', k: 'streak', goals: [15, 20, 25], tier: 2, best: true, ico: 'flame', text: (n) => `Haz una racha de ${n} en un nivel` },
  { id: 'noundo', k: 'noundo', goals: [2, 3], tier: 2, ico: 'undo', text: (n) => `Gana ${n} niveles sin usar deshacer` },
  { id: 'noextra', k: 'noextra', goals: [3, 4], tier: 1, ico: 'cards', text: (n) => `Gana ${n} niveles sin comprar +5 cartas` },
  { id: 'nowild', k: 'nowild', goals: [2, 3], tier: 2, ico: 'wild', text: (n) => `Gana ${n} niveles sin usar comodín` },
  { id: 'left', k: 'left', goals: [4, 6], tier: 3, best: true, ico: 'cards', text: (n) => `Gana un nivel con ${n} cartas o más en tu mazo` },
  { id: 'rewards', k: 'rewards', goals: [4, 6], tier: 2, ico: 'gift', text: (n) => `Gana ${n} premios de racha` },
  { id: 'boss', k: 'boss', goals: [1], tier: 2, ico: 'trophy', text: () => 'Derrota a un jefe' },
  { id: 'coins', k: 'coins', goals: [300, 500], tier: 1, ico: 'coin', text: (n) => `Junta ${n} monedas jugando` },
  { id: 'bubbles', k: 'burbuja', goals: [10, 15], tier: 1, ico: 'gift', text: (n) => `Truena ${n} burbujas de premio` },
  { id: 'balloons', k: 'globo', goals: [4, 6], tier: 2, ico: 'globo', text: (n) => `Truena ${n} globos` },
  { id: 'locks', k: 'locks', goals: [3, 5], tier: 1, mech: 'lock', ico: 'lock', text: (n) => `Abre ${n} candados` },
  { id: 'packs', k: 'packs', goals: [2, 3], tier: 1, mech: 'pack', ico: 'gift', text: (n) => `Abre ${n} cartas regalo` },
  { id: 'ice', k: 'ice', goals: [3, 5], tier: 1, mech: 'ice', ico: 'ice', text: (n) => `Derrite ${n} hielos` },
  { id: 'bombs', k: 'bombs', goals: [2, 3], tier: 2, mech: 'bomb', ico: 'bomb', text: (n) => `Desactiva ${n} bombas` },
  { id: 'comets', k: 'comets', goals: [1, 2], tier: 2, mech: 'comet', ico: 'comet', text: (n) => `Atrapa ${n} cometa${n > 1 ? 's' : ''}` },
  { id: 'turbo', k: 'turbo', goals: [1, 2], tier: 2, mech: 'turbo', ico: 'rocket', text: (n) => `Usa ${n} cohete${n > 1 ? 's' : ''} turbo` },
  { id: 'tickets', k: 'halves', goals: [2, 3], tier: 2, mech: 'ticket', ico: 'ticket', text: (n) => `Parte ${n} boletos` },
  { id: 'coincards', k: 'coincards', goals: [2, 4], tier: 1, mech: 'coin', ico: 'monedas', text: (n) => `Juega ${n} cartas moneda` },
  { id: 'ghosts', k: 'ghosts', goals: [2, 3], tier: 2, mech: 'ghost', ico: 'ghost', text: (n) => `Juega ${n} fantasmas` },
  { id: 'cham', k: 'cham', goals: [2, 3], tier: 2, mech: 'cham', ico: 'camaleon', text: (n) => `Juega ${n} camaleones` },
  { id: 'event', k: 'event', goals: [1, 2], tier: 3, ev: true, ico: 'star', text: (n) => `Gana ${n} nivel${n > 1 ? 'es' : ''} del evento del mes` },
  // 8 nov 2026: 25 más (más difíciles y de las cartas que faltaban). Una misma cosa (k) no sale dos veces el mismo día.
  { id: 'win8', k: 'win', goals: [8, 10], tier: 3, ico: 'flag', text: (n) => `Gana ${n} niveles` },
  { id: 'stars20', k: 'stars', goals: [20, 25], tier: 3, ico: 'star', text: (n) => `Consigue ${n} estrellas` },
  { id: 'three5', k: 'three', goals: [4, 5], tier: 3, ico: 'crown', text: (n) => `Gana ${n} niveles con 3 estrellas` },
  { id: 'cards450', k: 'cards', goals: [450, 600], tier: 3, ico: 'card', text: (n) => `Juega ${n} cartas` },
  { id: 'streak28', k: 'streak', goals: [28, 32], tier: 3, best: true, ico: 'flame', text: (n) => `Haz una racha de ${n} en un nivel` },
  { id: 'boss3', k: 'boss3', goals: [1], tier: 3, ico: 'trophy', text: () => 'Derrota a un jefe con 3 estrellas' },
  { id: 'pure', k: 'pure', goals: [1, 2], tier: 3, ico: 'crown', text: (n) => `Gana ${n} nivel${n > 1 ? 'es' : ''} con 3 estrellas sin ayudas` },
  { id: 'brooms', k: 'brooms', goals: [1, 2], tier: 3, ico: 'escoba', text: (n) => `Gana ${n} escoba${n > 1 ? 's' : ''} de racha` },
  { id: 'rewards8', k: 'rewards', goals: [8, 10], tier: 3, ico: 'gift', text: (n) => `Gana ${n} premios de racha` },
  { id: 'left8', k: 'left', goals: [8, 10], tier: 3, best: true, ico: 'deck', text: (n) => `Gana un nivel con ${n} cartas o más en tu mazo` },
  { id: 'coins800', k: 'coins', goals: [800, 1000], tier: 2, ico: 'coin', text: (n) => `Junta ${n} monedas jugando` },
  { id: 'noundo4', k: 'noundo', goals: [4, 5], tier: 3, ico: 'undo', text: (n) => `Gana ${n} niveles sin usar deshacer` },
  { id: 'nowild4', k: 'nowild', goals: [4, 5], tier: 3, ico: 'wild', text: (n) => `Gana ${n} niveles sin usar comodín` },
  { id: 'bubbles25', k: 'burbuja', goals: [25, 30], tier: 2, ico: 'gift', text: (n) => `Truena ${n} burbujas de premio` },
  { id: 'balloons10', k: 'globo', goals: [10, 12], tier: 3, ico: 'globo', text: (n) => `Truena ${n} globos` },
  { id: 'arrows', k: 'arrows', goals: [3, 5], tier: 1, mech: 'arrow', ico: 'next', text: (n) => `Juega ${n} cartas con flecha` },
  { id: 'doubles', k: 'doubles', goals: [3, 5], tier: 1, mech: 'double', ico: 'deck', text: (n) => `Juega ${n} cartas dobles` },
  { id: 'curtains', k: 'curtains', goals: [3, 5], tier: 1, mech: 'curtain', ico: 'door', text: (n) => `Juega ${n} cartas de cortina` },
  { id: 'lives', k: 'lives', goals: [2, 3], tier: 2, mech: 'live', ico: 'replay', text: (n) => `Juega ${n} cartas vivas` },
  { id: 'locks8', k: 'locks', goals: [8, 10], tier: 2, mech: 'lock', ico: 'lock', text: (n) => `Abre ${n} candados` },
  { id: 'bombs4', k: 'bombs', goals: [4, 5], tier: 3, mech: 'bomb', ico: 'bomb', text: (n) => `Desactiva ${n} bombas` },
  { id: 'ghosts4', k: 'ghosts', goals: [4, 6], tier: 3, mech: 'ghost', ico: 'ghost', text: (n) => `Juega ${n} fantasmas` },
  { id: 'cham4', k: 'cham', goals: [4, 6], tier: 3, mech: 'cham', ico: 'camaleon', text: (n) => `Juega ${n} camaleones` },
  { id: 'coincards6', k: 'coincards', goals: [6, 8], tier: 2, mech: 'coin', ico: 'monedas', text: (n) => `Juega ${n} cartas moneda` },
  { id: 'turbo3', k: 'turbo', goals: [3], tier: 3, mech: 'turbo', ico: 'rocket', text: (n) => `Usa ${n} cohetes turbo` },
];
const MIS_COINS = [0, 60, 100, 150];
// Cofre de las 3: monedas y, por probabilidad, un comodín (si no, 2 deshacer). 8 nov 2026: la probabilidad depende de
// qué tan difíciles tocaron (suma de escalones, de 4 a 9): fáciles 21%, difíciles hasta 51%. Se dice en la ventana.
export const MIS_BONUS = { coins: 200, undo: 2 };
export const misWildOdds = (s = missions()) => Math.min(0.55, 0.15 + 0.06 * Math.max(0, s.list.reduce((n, x) => n + (misDef(x.id)?.tier || 1), 0) - 3));

const can = (m, evOn) => (!m.mech || (save.open || 0) >= MECH_INTRO[m.mech]) && (!m.ev || evOn);
// Las misiones de hoy: { day, list: [{ id, goal, n, coins, got }], bonus: false | true (reclamado) }.
// evOn: hay evento del mes pagado (para la misión del evento).
export function missions(evOn = false) {
  const day = today();
  if (save.mis?.day !== day) {
    const r = mulberry32(hash(day * 31 + 7 + (save.misSeed || 0) * 977)); // misSeed: solo el modo dev ("otras misiones")
    // Una de cada escalón cuando se puede (1 fácil, 1 media, 1 cualquiera), sin repetir.
    const pool = MISSIONS.filter((m) => can(m, evOn));
    const take = (ok) => {
      const c = pool.filter((m) => ok(m) && !list.some((x) => x.id === m.id || misDef(x.id).k === m.k));
      if (!c.length) return;
      const m = c[Math.floor(r() * c.length)], goal = m.goals[Math.floor(r() * m.goals.length)];
      list.push({ id: m.id, goal, n: 0, coins: round5(MIS_COINS[m.tier] * constK() * (goal === m.goals.at(-1) && m.goals.length > 1 ? 1.25 : 1)), got: false });
    };
    const list = [];
    take((m) => m.tier === 1);
    take((m) => m.tier === 2);
    take(() => true);
    save.mis = { day, list, bonus: false, old: save.mis?.list?.some((x) => x.n >= x.goal && !x.got) || false };
    persist();
  }
  return save.mis;
}
export const misDef = (id) => MISSIONS.find((m) => m.id === id);
export const misBonusCoins = () => round5(MIS_BONUS.coins * constK());
export const misDone = (x) => x.n >= x.goal;
// ¿Hay algo que reclamar?
export const misReady = () => isMisOn() && (missions().list.some((x) => misDone(x) && !x.got) || misBonusReady());
export const misBonusReady = () => { const s = missions(); return !s.bonus && s.list.length && s.list.every((x) => x.got); };
// Ya no queda nada hoy: las 3 reclamadas y el cofre abierto.
export const misAllDone = () => { const s = missions(); return !!s.bonus && s.list.every((x) => x.got); };
export const isMisOn = () => (save.next || 0) >= MIS_FROM;
export const isLogrosOn = () => (save.next || 0) >= LOGROS_FROM;
// Reclamar una misión: devuelve el premio (monedas), ya sumado.
export function misClaim(i) {
  const x = missions().list[i];
  if (!x || x.got || !misDone(x)) return null;
  x.got = true;
  save.coins += x.coins;
  persist();
  return { coins: x.coins };
}
// Las 3 reclamadas: el cofre del día.
export function misBonus(r = Math.random) {
  const s = missions();
  if (!misBonusReady()) return null;
  s.bonus = true;
  const p = { coins: round5(MIS_BONUS.coins * constK()), ...(r() < misWildOdds(s) ? { wild: 1 } : { undo: MIS_BONUS.undo }) };
  save.coins += p.coins;
  save.wild += p.wild || 0;
  save.undo += p.undo || 0;
  persist();
  return p;
}

// ---------- Logros ----------
// Cuentan para siempre (save.stats). 8 nov 2026: 5 escalones (bronce, plata, oro, platino y diamante), metas más
// altas y mejores premios (platino y diamante traen comodines y deshacer). El oro de algunos da un título exclusivo
// (sección title de la tienda, ev: 'logro'). Los que ya se reclamaron (save.logros = escalones) se respetan.
export const LOGROS = [
  { id: 'wins', k: 'win', name: 'Viajero incansable', ico: 'flag', steps: [100, 500, 1500, 3000, 5000], text: (n) => `Gana ${fmtN(n)} niveles` },
  { id: 'stars', k: 'stars', name: 'Cazaestrellas', ico: 'star', steps: [300, 1500, 4000, 8000, 14000], text: (n) => `Junta ${fmtN(n)} estrellas` },
  { id: 'three', k: 'three', name: 'Perfeccionista', ico: 'crown', steps: [50, 300, 1000, 2000, 3500], text: (n) => `Gana ${fmtN(n)} niveles con 3 estrellas`, title: 'perfeccionista' },
  { id: 'cards', k: 'cards', name: 'Mano rápida', ico: 'card', steps: [5000, 25000, 80000, 200000, 400000], text: (n) => `Juega ${fmtN(n)} cartas` },
  { id: 'streak', k: 'streak', best: true, name: 'Imparable', ico: 'flame', steps: [20, 28, 35, 42, 50], text: (n) => `Haz una racha de ${n} en un nivel`, title: 'imparable' },
  { id: 'bosses', k: 'boss', name: 'Domador de jefes', ico: 'trophy', steps: [10, 50, 150, 300, 500], text: (n) => `Derrota ${n} jefes` },
  { id: 'boss3', k: 'boss3', name: 'Jefe perfecto', ico: 'trophy', steps: [5, 25, 100, 200, 400], text: (n) => `Derrota ${n} jefes con 3 estrellas` },
  { id: 'pure', k: 'pure', name: 'Impecable', ico: 'crown', steps: [20, 100, 400, 1000, 2000], text: (n) => `Gana ${fmtN(n)} niveles con 3 estrellas sin deshacer, comodín ni +5` },
  { id: 'noundo', k: 'noundo', name: 'Sin mirar atrás', ico: 'undo', steps: [30, 150, 500, 1200, 2500], text: (n) => `Gana ${fmtN(n)} niveles sin usar deshacer` },
  { id: 'nowild', k: 'nowild', name: 'Sin trucos', ico: 'wild', steps: [30, 150, 500, 1200, 2500], text: (n) => `Gana ${fmtN(n)} niveles sin usar comodín` },
  { id: 'rewards', k: 'rewards', name: 'Premiado', ico: 'gift', steps: [100, 500, 2000, 5000, 10000], text: (n) => `Gana ${fmtN(n)} premios de racha` },
  { id: 'brooms', k: 'brooms', name: 'Barrendero', ico: 'escoba', steps: [10, 50, 200, 500, 1000], text: (n) => `Gana ${fmtN(n)} escobas de racha` },
  { id: 'left', k: 'left', best: true, name: 'Ahorrador', ico: 'deck', steps: [8, 11, 14, 17, 20], text: (n) => `Gana un nivel con ${n} cartas o más en tu mazo` },
  { id: 'coins', k: 'coins', name: 'Millonario', ico: 'coin', steps: [5000, 25000, 100000, 250000, 500000], text: (n) => `Junta ${fmtN(n)} monedas jugando` },
  { id: 'locks', k: 'locks', mech: 'lock', name: 'Cerrajero', ico: 'lock', steps: [100, 500, 1500, 3000, 6000], text: (n) => `Abre ${fmtN(n)} candados` },
  { id: 'packs', k: 'packs', mech: 'pack', name: 'Abrerregalos', ico: 'gift', steps: [40, 200, 600, 1200, 2500], text: (n) => `Abre ${fmtN(n)} cartas regalo` },
  { id: 'ice', k: 'ice', mech: 'ice', name: 'Rompehielos', ico: 'ice', steps: [60, 300, 1000, 2000, 4000], text: (n) => `Derrite ${fmtN(n)} hielos` },
  { id: 'doubles', k: 'doubles', mech: 'double', name: 'Doble o nada', ico: 'deck', steps: [50, 250, 800, 1600, 3000], text: (n) => `Juega ${fmtN(n)} cartas dobles` },
  { id: 'arrows', k: 'arrows', mech: 'arrow', name: 'Arquero', ico: 'next', steps: [50, 250, 800, 1600, 3000], text: (n) => `Juega ${fmtN(n)} cartas con flecha` },
  { id: 'curtains', k: 'curtains', mech: 'curtain', name: 'Telonero', ico: 'door', steps: [50, 250, 800, 1600, 3000], text: (n) => `Juega ${fmtN(n)} cartas de cortina` },
  { id: 'bombs', k: 'bombs', mech: 'bomb', name: 'Artificiero', ico: 'bomb', steps: [30, 150, 500, 1000, 2000], text: (n) => `Desactiva ${fmtN(n)} bombas`, title: 'artificiero' },
  { id: 'tickets', k: 'halves', mech: 'ticket', name: 'Taquillero', ico: 'ticket', steps: [30, 150, 500, 1000, 2000], text: (n) => `Parte ${fmtN(n)} boletos` },
  { id: 'lives', k: 'lives', mech: 'live', name: 'Domador de cartas vivas', ico: 'replay', steps: [30, 150, 500, 1000, 2000], text: (n) => `Juega ${fmtN(n)} cartas vivas` },
  { id: 'comets', k: 'comets', mech: 'comet', name: 'Atrapacometas', ico: 'comet', steps: [15, 75, 250, 500, 1000], text: (n) => `Atrapa ${fmtN(n)} cometas` },
  { id: 'turbo', k: 'turbo', mech: 'turbo', name: 'Piloto turbo', ico: 'rocket', steps: [15, 75, 250, 500, 1000], text: (n) => `Usa ${fmtN(n)} cohetes turbo` },
  { id: 'coincards', k: 'coincards', mech: 'coin', name: 'Alcancía', ico: 'monedas', steps: [30, 150, 500, 1000, 2000], text: (n) => `Juega ${fmtN(n)} cartas moneda` },
  { id: 'ghosts', k: 'ghosts', mech: 'ghost', name: 'Cazafantasmas', ico: 'ghost', steps: [20, 100, 300, 700, 1500], text: (n) => `Juega ${fmtN(n)} fantasmas`, title: 'cazafantasmas' },
  { id: 'cham', k: 'cham', mech: 'cham', name: 'Domador de camaleones', ico: 'camaleon', steps: [20, 100, 300, 700, 1500], text: (n) => `Juega ${fmtN(n)} camaleones` },
  { id: 'bubbles', k: 'burbuja', name: 'Revientaburbujas', ico: 'gift', steps: [200, 1000, 3000, 6000, 12000], text: (n) => `Truena ${fmtN(n)} burbujas` },
  { id: 'balloons', k: 'globo', name: 'Globero', ico: 'globo', steps: [50, 250, 800, 1600, 3000], text: (n) => `Truena ${fmtN(n)} globos` },
  { id: 'meteors', k: 'meteoro', name: 'Cazameteoros', ico: 'meteoro', steps: [25, 100, 300, 700, 1500], text: (n) => `Truena ${fmtN(n)} meteoros en el cielo` },
  { id: 'missions', k: 'missions', name: 'Cumplidor', ico: 'check', steps: [30, 150, 365, 700, 1200], text: (n) => `Completa ${fmtN(n)} misiones del día`, title: 'cumplidor' },
  { id: 'events', k: 'event', name: 'Fiestero', ico: 'calavera', steps: [15, 75, 200, 400, 750], text: (n) => `Gana ${n} niveles de eventos` },
  { id: 'secrets', k: 'secret', name: 'Explorador secreto', ico: 'starSecret', steps: [5, 25, 100, 250, 520], text: (n) => `Gana ${n} niveles secretos`, title: 'explorador_secreto' },
];
// Premio de cada escalón (bronce → diamante).
export const LOGRO_PRIZES = [{ coins: 200 }, { coins: 600 }, { coins: 1500 }, { coins: 3000, wild: 1 }, { coins: 6000, wild: 2, undo: 3 }];
export const LOGRO_COINS = LOGRO_PRIZES.map((p) => p.coins);
export const LOGRO_MEDAL = ['Bronce', 'Plata', 'Oro', 'Platino', 'Diamante'];
export const LOGRO_TOP = LOGRO_MEDAL.length;
const fmtN = (n) => n.toLocaleString('es-MX');
const stat = (l) => (save.stats || {})[l.best ? `${l.k}Best` : l.k] || 0;
// Escalón alcanzado (0-5) y reclamado.
export const logroAt = (l) => l.steps.filter((n) => stat(l) >= n).length;
export const logroGot = (l) => Math.min(LOGRO_TOP, (save.logros || {})[l.id] || 0);
export const logroStat = stat;
export const logrosVisible = () => LOGROS.filter((l) => !l.mech || (save.open || 0) >= MECH_INTRO[l.mech]);
export const logrosReady = () => isLogrosOn() && logrosVisible().some((l) => logroAt(l) > logroGot(l));
export function logroClaim(id) {
  const l = LOGROS.find((x) => x.id === id);
  const got = logroGot(l);
  if (!l || logroAt(l) <= got) return null;
  (save.logros ||= {})[id] = got + 1;
  const p = { ...LOGRO_PRIZES[got] };
  save.coins += p.coins;
  save.wild += p.wild || 0;
  save.undo += p.undo || 0;
  if (got === 2 && l.title) {
    save.owned[`title:${l.title}`] = 1;
    p.title = l.title;
  }
  persist();
  return p;
}

// ---------- Lo que cuenta ----------
// stats: { win, stars, three, cards, streak, noundo, noextra, nowild, left, rewards, boss, coins, locks, packs, ice,
// bombs, comets, turbo, halves, coincards, ghosts, cham, event, secret, burbuja, globo, meteoro, arrows, doubles, lives,
// curtains, brooms, boss3, pure }. Los "best" (streak, left) se
// comparan; lo demás se suma. Devuelve las misiones que se acaban de completar (para avisar).
export function track(stats) {
  const st = (save.stats ||= {});
  for (const [k, v] of Object.entries(stats)) {
    if (!v) continue;
    if (k === 'streak' || k === 'left') st[`${k}Best`] = Math.max(st[`${k}Best`] || 0, v);
    else st[k] = (st[k] || 0) + v;
  }
  const done = [];
  if (isMisOn()) {
    for (const x of missions().list) {
      const m = misDef(x.id), v = stats[m.k];
      if (!v || misDone(x)) continue;
      x.n = m.best ? Math.max(x.n, v) : x.n + v;
      if (misDone(x)) {
        x.n = x.goal;
        done.push(x);
        st.missions = (st.missions || 0) + 1;
      }
    }
  }
  persist();
  return done;
}
// Para el modo dev: las misiones de hoy otra vez.
export const misReset = () => { save.mis = null; persist(); };
export { LEVELS_PER_WORLD };
