// Misiones del día y logros (7 nov 2026).
// Misiones: cada día (medianoche, hora del teléfono) tocan 3 de una lista de ~25, escogidas con la fecha (iguales en
// todo el día). Solo las que ya puedes hacer (las de cartas especiales, cuando ya llegaste a su mundo). Cada una da
// monedas y las 3 juntas un cofre extra; desde el 10 nov 2026 se cobran solas al cumplirse (autoClaim).
// Logros: para siempre. Cada uno tiene 5 escalones (bronce → diamante), cada uno desde cero, con monedas; el oro de
// algunos da además un título.
// Los dos se alimentan de lo mismo: track(stats) al terminar cada nivel (y al tronar burbujas o globos).
import { save, persist } from './storage.js';
import { MECH_INTRO, LEVELS_PER_WORLD } from './levels.js';
import { maxBet } from './economy.js';
import { passClaim } from './passport.js';
import { mulberry32, hash } from './rng.js';

export const MISSIONS_FROM = 40; // nivel en que se abren (save.next); igual que UNLOCK en events.js
export const ACHIEVEMENTS_FROM = 70;
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
const MISSION_COINS = [0, 60, 100, 150];
// Cofre de las 3: monedas y, por probabilidad, un comodín (si no, 2 deshacer). 8 nov 2026: la probabilidad depende de
// qué tan difíciles tocaron (suma de escalones, de 4 a 9): fáciles 21%, difíciles hasta 51%. Se dice en la ventana.
export const MISSION_BONUS = { coins: 200, undo: 2 };
export const missionWildOdds = (s = missions()) => Math.min(0.55, 0.15 + 0.06 * Math.max(0, s.list.reduce((n, x) => n + (missionDef(x.id)?.tier || 1), 0) - 3));

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
      const c = pool.filter((m) => ok(m) && !list.some((x) => x.id === m.id || missionDef(x.id).k === m.k));
      if (!c.length) return;
      const m = c[Math.floor(r() * c.length)], goal = m.goals[Math.floor(r() * m.goals.length)];
      list.push({ id: m.id, goal, n: 0, coins: round5(MISSION_COINS[m.tier] * constK() * (goal === m.goals.at(-1) && m.goals.length > 1 ? 1.25 : 1)), got: false });
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
export const missionDef = (id) => MISSIONS.find((m) => m.id === id);
export const missionBonusCoins = () => round5(MISSION_BONUS.coins * constK());
export const missionDone = (x) => x.n >= x.goal;
// ¿Hay algo que reclamar?
export const missionReady = () => isMisOn() && (missions().list.some((x) => missionDone(x) && !x.got) || missionBonusReady());
export const missionBonusReady = () => { const s = missions(); return !s.bonus && s.list.length && s.list.every((x) => x.got); };
// Ya no queda nada hoy: las 3 reclamadas y el cofre abierto.
export const missionsAllDone = () => { const s = missions(); return !!s.bonus && s.list.every((x) => x.got); };
export const isMisOn = () => (save.next || 0) >= MISSIONS_FROM;
export const isAchievementsOn = () => (save.next || 0) >= ACHIEVEMENTS_FROM;
// Reclamar una misión: devuelve el premio (monedas), ya sumado.
export function missionClaim(i) {
  const x = missions().list[i];
  if (!x || x.got || !missionDone(x)) return null;
  x.got = true;
  save.coins += x.coins;
  persist();
  return { coins: x.coins };
}
// Las 3 reclamadas: el cofre del día.
export function missionBonus(r = Math.random) {
  const s = missions();
  if (!missionBonusReady()) return null;
  s.bonus = true;
  const p = { coins: round5(MISSION_BONUS.coins * constK()), ...(r() < missionWildOdds(s) ? { wild: 1 } : { undo: MISSION_BONUS.undo }) };
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
export const ACHIEVEMENTS = [
  { id: 'wins', k: 'win', name: 'Viajero incansable', ico: 'flag', steps: [100, 500, 1500, 3000, 5000], text: (n) => `Gana ${fmtN(n)} niveles` },
  { id: 'stars', k: 'stars', name: 'Cazaestrellas', ico: 'star', steps: [300, 1500, 4000, 8000, 14000], text: (n) => `Junta ${fmtN(n)} estrellas` },
  { id: 'three', k: 'three', name: 'Perfeccionista', ico: 'crown', steps: [50, 300, 1000, 2000, 3500], text: (n) => `Gana ${fmtN(n)} niveles con 3 estrellas`, title: 'perfeccionista' },
  { id: 'cards', k: 'cards', name: 'Mano rápida', ico: 'card', steps: [5000, 25000, 80000, 200000, 400000], text: (n) => `Juega ${fmtN(n)} cartas` },
  { id: 'streak', k: 'streak', best: true, name: 'Imparable', ico: 'flame', steps: [25, 33, 40, 48, 56], text: (n) => `Haz una racha de ${n} en un nivel`, title: 'imparable' },
  { id: 'bosses', k: 'boss', name: 'Domador de jefes', ico: 'trophy', steps: [10, 50, 150, 300, 500], text: (n) => `Derrota ${n} jefes` },
  { id: 'boss3', k: 'boss3', name: 'Jefe perfecto', ico: 'trophy', steps: [5, 25, 100, 200, 400], text: (n) => `Derrota ${n} jefes con 3 estrellas` },
  { id: 'pure', k: 'pure', name: 'Impecable', ico: 'crown', steps: [20, 100, 400, 1000, 2000], text: (n) => `Gana ${fmtN(n)} niveles con 3 estrellas sin deshacer, comodín ni +5` },
  { id: 'noundo', k: 'noundo', name: 'Sin mirar atrás', ico: 'undo', steps: [30, 150, 500, 1200, 2500], text: (n) => `Gana ${fmtN(n)} niveles sin usar deshacer` },
  { id: 'nowild', k: 'nowild', name: 'Sin trucos', ico: 'wild', steps: [30, 150, 500, 1200, 2500], text: (n) => `Gana ${fmtN(n)} niveles sin usar comodín` },
  { id: 'rewards', k: 'rewards', name: 'Premiado', ico: 'gift', steps: [100, 500, 2000, 5000, 10000], text: (n) => `Gana ${fmtN(n)} premios de racha` },
  // Regalo diario (13 nov 2026, pedido del usuario): metas tal cual (raw).
  { id: 'dailies', k: 'dailies', raw: true, name: 'Constante', ico: 'gift', steps: [7, 30, 90, 180, 365], text: (n) => `Reclama ${fmtN(n)} regalos diarios` },
  { id: 'planets', k: 'planets', raw: true, name: 'Constructor de planetas', ico: 'planet', steps: [1, 3, 6, 12, 24], text: (n) => `Arma ${fmtN(n)} planeta${n > 1 ? 's' : ''} del regalo diario` },
  { id: 'brooms', k: 'brooms', name: 'Barrendero', ico: 'escoba', steps: [5, 25, 100, 250, 500], text: (n) => `Gana ${fmtN(n)} escobas de racha` },
  { id: 'left', k: 'left', best: true, name: 'Ahorrador', ico: 'deck', steps: [12, 16, 20, 24, 28], text: (n) => `Gana un nivel con ${n} cartas o más en tu mazo` },
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
  // 12 nov 2026 (el usuario): las estrellas fugaces de la lluvia de estrellas, desde que cae (STAR_FROM en meteor.js).
  { id: 'shootingstars', k: 'estrella', from: 250, name: 'Pide deseos', ico: 'starFall', steps: [25, 100, 300, 700, 1500], text: (n) => `Truena ${fmtN(n)} estrellas fugaces en el cielo` },
  { id: 'missions', k: 'missions', name: 'Cumplidor', ico: 'check', steps: [30, 150, 365, 700, 1200], text: (n) => `Completa ${fmtN(n)} misiones del día`, title: 'cumplidor' },
  { id: 'events', k: 'event', name: 'Fiestero', ico: 'calavera', steps: [15, 75, 200, 400, 750], text: (n) => `Gana ${n} niveles de eventos` },
  // 10 nov 2026 (pedido del usuario): uno por cada apuesta (×2, ×3, ×5, ×10), niveles ganados apostando eso. Cada uno
  // sale cuando ya se puede apostar tanto. Sus metas van tal cual (raw: sin LOGRO_UP). Antes era uno solo, «Apostador»,
  // de apuestas seguidas (betrow) con cualquier ×N.
  ...[[2, [20, 40, 80, 150, 300]], [3, [15, 30, 60, 120, 240]], [5, [10, 20, 40, 80, 160]], [10, [5, 10, 20, 40, 80]]].map(([m, steps]) =>
    ({ id: `bet${m}`, k: `bet${m}`, bet: m, raw: true, name: `Apostador ×${m}`, ico: 'coin', steps, text: (n) => `Gana ${fmtN(n)} niveles apostando ×${m}` })),
  { id: 'secrets', k: 'secret', name: 'Explorador secreto', ico: 'starSecret', steps: [5, 25, 100, 250, 520], text: (n) => `Gana ${n} niveles secretos`, title: 'explorador_secreto' },
];
// 8 nov 2026: los logros pedían poco (el usuario: "no están tan complicados"): todas las metas ×LOGRO_UP desde el
// principio, redondeadas bonito. Las de "mejor de un nivel" (racha, cartas en el mazo) no: se subieron a mano (Ahorrador
// era muy fácil: antes 8/11/14/17/20 cartas; Imparable antes 20/28/35/42/50).
export const ACHIEVEMENT_UP = 1.7;
const nice = (n) => {
  const v = n * ACHIEVEMENT_UP, s = v < 50 ? 1 : v < 200 ? 5 : v < 1000 ? 10 : v < 10000 ? 50 : 500;
  return Math.round(v / s) * s;
};
for (const l of ACHIEVEMENTS) if (!l.best && !l.raw) l.steps = l.steps.map(nice);
// Premio de cada escalón (bronce → diamante).
// 8 nov 2026: 10% menos monedas (el usuario: endurecer los logros, no dar más dinero). Antes 200/600/1,500/3,000/6,000.
export const ACHIEVEMENT_PRIZES = [{ coins: 180 }, { coins: 540 }, { coins: 1350 }, { coins: 2700, wild: 1 }, { coins: 5400, wild: 2, undo: 3 }];
export const ACHIEVEMENT_COINS = ACHIEVEMENT_PRIZES.map((p) => p.coins);
export const ACHIEVEMENT_MEDAL = ['Bronce', 'Plata', 'Oro', 'Platino', 'Diamante'];
export const ACHIEVEMENT_TOP = ACHIEVEMENT_MEDAL.length;
const fmtN = (n) => n.toLocaleString('es-MX');
const stat = (l) => (save.stats || {})[l.best ? `${l.k}Best` : l.k] || 0;
export const achievementGot = (l) => Math.min(ACHIEVEMENT_TOP, (save.logros || {})[l.id] || 0);
// 10 nov 2026 (pedido del usuario): cada medalla empieza desde cero. Lo que se suma (niveles, cartas, estrellas…) cuenta
// desde que se cobró la anterior (save.logroBase = lo que llevaba entonces); para plata hay que juntar su meta completa
// otra vez. Los de mejor de un nivel (racha, cartas en el mazo) ya se hacen de nuevo en cada nivel. Las partidas de
// antes: las medallas ya cobradas se respetan y la siguiente cuenta desde hoy.
const base = (l) => {
  if (l.best) return 0;
  const b = (save.logroBase ||= {});
  if (b[l.id] == null) b[l.id] = achievementGot(l) ? stat(l) : 0;
  return b[l.id];
};
// Lo que lleva hacia la medalla que sigue y lo que pide (la absoluta, para el modo dev).
export const achievementProgress = (l) => stat(l) - base(l);
export const achievementNeed = (l) => base(l) + l.steps[Math.min(achievementGot(l), ACHIEVEMENT_TOP - 1)];
// Escalón alcanzado: el siguiente, si ya juntó su meta.
export const achievementAt = (l) => { const got = achievementGot(l); return got < ACHIEVEMENT_TOP && achievementProgress(l) >= l.steps[got] ? got + 1 : got; };
export const achievementsVisible = () => ACHIEVEMENTS.filter((l) => (!l.mech || (save.open || 0) >= MECH_INTRO[l.mech]) && (!l.bet || maxBet(save.next || 0) >= l.bet) && (!l.from || (save.next || 0) >= l.from));
export const achievementsReady = () => isAchievementsOn() && achievementsVisible().some((l) => achievementAt(l) > achievementGot(l));
export function achievementClaim(id) {
  const l = ACHIEVEMENTS.find((x) => x.id === id);
  const got = achievementGot(l);
  if (!l || achievementAt(l) <= got) return null;
  (save.logros ||= {})[id] = got + 1;
  if (!l.best) save.logroBase[id] = stat(l);
  const p = { ...ACHIEVEMENT_PRIZES[got] };
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
// Los que guardan el mejor (no se suman): racha de un nivel y cartas en el mazo.
// achieve = false: nivel ya ganado que se repite (12 nov 2026, el usuario): los logros solo cuentan niveles únicos, así
// que no se suma a save.stats; las misiones del día sí avanzan.
const BEST = ['streak', 'left'];
export function track(stats, achieve = true) {
  const st = (save.stats ||= {});
  for (const [k, v] of Object.entries(stats)) {
    if (!v || !achieve) continue;
    if (BEST.includes(k)) st[`${k}Best`] = Math.max(st[`${k}Best`] || 0, v);
    else st[k] = (st[k] || 0) + v;
  }
  const done = [];
  if (isMisOn()) {
    for (const x of missions().list) {
      const m = missionDef(x.id), v = stats[m.k];
      if (!v || missionDone(x)) continue;
      x.n = m.best ? Math.max(x.n, v) : x.n + v;
      if (missionDone(x)) {
        x.n = x.goal;
        done.push(x);
        st.missions = (st.missions || 0) + 1;
      }
    }
  }
  autoClaim();
  persist();
  return done;
}
// ---------- Se cobran solos (10 nov 2026, pedido del usuario) ----------
// Al cumplir una misión, las 3 (cofre del día) o un escalón de logro, el premio se suma al momento: si cierra la app ya
// lo tiene. Lo cobrado espera en save.feats para festejarlo en la portada (playFeats en main.js): mientras tanto el
// monedero lo enseña sin esas monedas (shownCoins en ui.js) y al festejar vuelan a él.
export const featCoins = () => (save.feats || []).reduce((n, f) => n + (f.coins || 0), 0);
export function autoClaim() {
  const q = (save.feats ||= []), n0 = q.length;
  if (isMisOn()) {
    missions().list.forEach((x, i) => {
      if (!missionDone(x) || x.got) return;
      const p = missionClaim(i);
      q.push({ t: 'mis', id: x.id, goal: x.goal, coins: p.coins });
    });
    if (missionBonusReady()) q.push({ t: 'bonus', ...missionBonus() });
  }
  if (isAchievementsOn()) {
    for (const l of achievementsVisible()) {
      while (achievementAt(l) > achievementGot(l)) q.push({ t: 'logro', id: l.id, step: achievementGot(l), ...achievementClaim(l.id) });
    }
  }
  // Sellos del pasaporte y premios de secretos (11 nov 2026, passport.js).
  passClaim(q);
  if (q.length === n0) return false;
  persist();
  if (typeof dispatchEvent === 'function') dispatchEvent(new Event('feats'));
  return true;
}
// Para el modo dev: las misiones de hoy otra vez.
export const missionReset = () => { save.mis = null; persist(); };
export { LEVELS_PER_WORLD };
