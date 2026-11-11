// Economía: boletos de entrada y monedas por estrellas.
import { difficulty, LEVELS_PER_WORLD } from './levels.js';

// Precio de un boleto normal (7 nov 2026: antes 40; el usuario: "homologar todos los precios").
export const TICKET_PRICE = 250;
// Boosters: el comodín, el pack de 3 deshacer y +5 cartas suben con el avance, en los mismos escalones que los boletos
// (1, 2 o 3 boletos por nivel). Subidos el 7 nov 2026 (antes 250/350/450, 50/75/100 y 100/150/200): el usuario
// gastaba +5 "a granel" y le seguían sobrando monedas; que duela.
const TIERS = { wild: [500, 650, 800], undo: [150, 200, 250], extra: [300, 400, 500], reloj: [300, 400, 500], ver2: [150, 200, 250], ver3: [250, 325, 400], llave: [2000, 2500, 3000], laser: [250, 325, 400], escudo: [250, 325, 400] };
// Mazo de ayudas (7 nov 2026): la carta dorada del tablero abre el comodín y estas. save.helps = clave -> cuántas.
// Las que no tienen precio solo se ganan (ver 4 y 5 s; la de 5 casi solo en eventos). La llave maestra es cara a propósito.
export const HELPS = {
  reloj: { name: 'Reloj de arena', ico: 'arena', text: 'Congela <b>3 turnos</b> todo lo que cuenta: bombas, cometas y cartas vivas. No toca tu racha.' },
  ver2: { name: 'Ver cartas', secs: 2, ico: 'ojo', text: 'Voltea <b>todas</b> las cartas del tablero por <b>2 segundos</b>.' },
  ver3: { name: 'Ver cartas', secs: 3, ico: 'ojo', text: 'Voltea <b>todas</b> las cartas del tablero por <b>3 segundos</b>.' },
  ver4: { name: 'Ver cartas', secs: 4, ico: 'ojo', text: 'Voltea <b>todas</b> las cartas del tablero por <b>4 segundos</b>.' },
  ver5: { name: 'Ver cartas', secs: 5, ico: 'ojo', text: 'Voltea <b>todas</b> las cartas del tablero por <b>5 segundos</b>.' },
  llave: { name: 'Llave maestra', ico: 'llaveMaestra', text: 'Abre <b>todos</b> los candados y cortinas del tablero.' },
  // 10 nov 2026: contraparte del cinturón de asteroides.
  laser: { name: 'Láser', ico: 'laser', text: 'Rompe <b>todas</b> las piedras de los asteroides que tapan cartas.' },
  // 11 nov 2026 (pedido del usuario): el escudo ya no es carta del tablero; es ayuda contra la nave ladrona.
  escudo: { name: 'Escudo', ico: 'escudito', text: 'La <b>nave ladrona</b> ya no te roba en <b>todo el nivel</b>.' },
};
export const buyable = (k) => !!TIERS[k];

// Boletos para entrar a un nivel: por tercios del universo (52 constelaciones de 10 mundos):
// constelaciones 1-17 → 1 boleto, 18-35 → 2, 36-52 → 3. Ganar el nivel por primera vez los devuelve
// (ticketRefund): solo se pierden al perder o abandonar.
export function ticketCost(g) {
  const r = Math.floor(g / LEVELS_PER_WORLD / 10);
  return r < 17 ? 1 : r < 35 ? 2 : 3;
}
export const ticketRefund = ticketCost;

// Monedas que vale un nivel con 3 estrellas. Sube con la dificultad y un poquito con cada constelación (que no se
// note); los jefes dan +50%. 7 nov 2026: más o menos a la mitad (antes 45 + 75·d: con 3★ en todo alcanzaba para la
// tienda entera en el mundo 68).
export function levelReward(g) {
  const boss = g % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1;
  const c = Math.floor(g / (LEVELS_PER_WORLD * 10));
  const base = Math.max(5, Math.round((20 + 35 * difficulty(g) + 0.4 * c) / 5) * 5);
  return boss ? Math.round((base * 1.5) / 5) * 5 : base;
}
// Ajuste por jugador (7 nov 2026): si va corto de monedas para lo que lleva, los niveles pagan más (×1.25, o ×1.5 si
// tiene menos de la mitad). Nunca paga menos de lo normal. Lo normal para su avance: lo que cuestan un comodín y un +5
// ahí, y sube con cada constelación.
export function poorBoost(coins, g) {
  const ref = price('wild', g) + price('extra', g) + 25 * Math.floor(g / (LEVELS_PER_WORLD * 10));
  return coins < ref / 2 ? 1.5 : coins < ref ? 1.25 : 1;
}
export const boosted = (n, coins, g) => Math.round((n * poorBoost(coins, g)) / 5) * 5 || n;

const part = (g, stars) => Math.round((levelReward(g) * stars) / 3);

// Solo se paga lo que falta respecto al mejor resultado anterior (con 3★ ya no se paga más).
export const coinsFor = (g, stars, prev = 0) => Math.max(0, part(g, stars) - part(g, prev));

// Precio de un booster según el avance (`g` = nivel de referencia: el que se juega o el primero sin completar).
// 8 nov 2026: además suben CONST_UP (5%) cada CONST_EVERY (2) constelaciones abiertas, hasta CONST_MAX (×2.5). Cuenta
// lo más lejos que has llegado (prog), no el nivel que juegas: si regresas a la constelación 1, ya cuesta lo de ahora.
export const CONST_UP = 0.05, CONST_EVERY = 2, CONST_MAX = 2.5;
export const constUp = (r) => Math.min(CONST_MAX, 1 + CONST_UP * Math.floor(r / CONST_EVERY));
// prog: nivel de referencia de tu avance (por omisión, g).
export function price(kind, g, prog = g) {
  return Math.round((TIERS[kind][ticketCost(g) - 1] * constUp(Math.floor(prog / (LEVELS_PER_WORLD * 10)))) / 5) * 5;
}
// ---------- Apuesta (8 nov 2026, propuesta del usuario; 9 nov: desde la constelación 2 y hasta ×10) ----------
// En niveles nuevos del camino se puede apostar: ×2 desde la constelación 2 (nivel 101, antes del evento del mes, para
// no encimar avisos), ×3 desde la 3, ×5 desde la 4 y ×10 desde la 5 (siempre se puede jugar ×1; BET_STEPS son las que se pueden escoger). Cuesta boletos × apuesta y una cuota chica
// (9 nov 2026, pedido del usuario: BET_FEE monedas por cada punto extra: ×2 = 10, ×3 = 20, ×5 = 40, ×10 = 90;
// × el boleto de entrada de ese nivel, que sube de 1 a 3 muy adelante). Ganando, todo lo que da el nivel × apuesta: monedas, boletos,
// fichas, y monedas, comodines y deshacer del cofre del jefe y de la lluvia de meteoritos. Perdiendo se pierde lo
// apostado. Las ayudas de ese nivel cuestan × apuesta. Las estrellas no se multiplican. Nunca en los eventos.
export const BET_STEPS = [1, 2, 3, 5, 10], BET_FROM = 1, BET_FEE = 10;
export const BET_MAX = BET_STEPS[BET_STEPS.length - 1];
export const maxBet = (g) => BET_STEPS[Math.max(0, Math.min(BET_STEPS.length - 1, Math.floor(g / (LEVELS_PER_WORLD * 10)) - BET_FROM + 1))];
export const betSteps = (g) => BET_STEPS.filter((m) => m <= maxBet(g));
// Jefes (9 nov 2026): su cofre trae comodines y deshacer, así que la cuota es más alta: ×2 = 200, ×3 = 400, ×5 = 800,
// ×10 = 1600 (× el boleto de entrada).
export const BET_BOSS_FEE = { 2: 200, 3: 400, 5: 800, 10: 1600 };
export const betFee = (g, m) => (m < 2 ? 0 : (g % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1 ? BET_BOSS_FEE[m] : BET_FEE * (m - 1)) * ticketCost(g));
// Dentro del nivel, las ayudas cuestan distinto según dónde se juega: en el evento del mes y en las festividades,
// 15% más caras (comodín, deshacer y +5); durante la lluvia de meteoritos, comodín y deshacer 30% menos (se ve como
// descuento). La tienda tiene 10% menos mientras cae la lluvia.
export const EV_MARKUP = 0.15;
export const MET_OFF = { help: 0.3, shop: 0.1 };
export const round5 = (n) => Math.round(n / 5) * 5;
export const metShopPrice = (p, met) => (met && p ? round5(p * (1 - MET_OFF.shop)) : p);

// ---------- Regalo diario: camino de 28 días ----------
// Premios modestos para que dure semanas. Si un día no se reclama, se vuelve al día 1.
// El día 7 de cada semana es una caja sorpresa: se sabe qué trae hasta abrirla (`openSurprise`).
const c = (coins) => ({ coins });
export const DAILY_PATH = [
  c(20), c(25), { tickets: 1 }, c(30), c(30), c(40), { surprise: 1 },
  c(30), c(35), { tickets: 1 }, c(40), c(40), c(50), { surprise: 2 },
  c(35), c(40), { tickets: 1 }, c(45), c(45), c(55), { surprise: 3 },
  c(40), c(45), { tickets: 2 }, c(50), c(50), c(60), { surprise: 4 },
];
// Contenido de la caja sorpresa: monedas que crecen con la semana más 1 extra al azar (2 extras la semana 4).
export function openSurprise(tier, r = Math.random) {
  const p = { coins: 40 + tier * 20 + Math.floor(r() * 4) * 10 };
  const extras = [{ tickets: tier > 2 ? 2 : 1 }, { undo: 2 + Math.floor(tier / 2) }, { wild: 1 }];
  for (let k = tier >= 4 ? 2 : 1; k > 0; k--) Object.assign(p, extras.splice(Math.floor(r() * extras.length), 1)[0]);
  return p;
}

const dayKey = (d) => d.toDateString();
// Estado del regalo hoy: qué día toca (0..27) y si ya se reclamó.
export function dailyState(daily, now = new Date()) {
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 864e5));
  if (daily.last === today) return { day: daily.day, claimed: true };
  if (daily.last === yesterday) return { day: daily.day % DAILY_PATH.length, claimed: false };
  return { day: 0, claimed: false, reset: !!daily.last }; // primera vez o se rompió la racha
}

// ---------- Pasar de mundo ----------
// Para abrir el mundo w (w ≥ 1) hace falta el boleto dorado del jefe anterior y un mínimo de estrellas:
// un % de todas las estrellas posibles en los mundos anteriores (0..w-1). El % sube con el avance.
const STAR_STEPS = [
  [10, 0.5], [25, 0.55], [60, 0.6], [120, 0.65], [250, 0.7], [Infinity, 0.75],
];
export function starsNeeded(w) {
  if (w < 1) return 0;
  const pct = STAR_STEPS.find(([until]) => w + 1 <= until)[1];
  return Math.ceil(w * LEVELS_PER_WORLD * 3 * pct);
}

// ---------- Constelaciones (7 nov 2026) ----------
// Terminar una constelación (el jefe del mundo 10 de cada una, primera vez) da CONST_PRIZE. Abrir la siguiente pide,
// además del boleto dorado y las estrellas, CONST_OPEN monedas.
export const CONST_PRIZE = { coins: 2000, wild: 1, undo: 1 };
export const CONST_OPEN = 1000;
export const openCost = (w) => (w > 0 && w % (LEVELS_PER_WORLD) === 0 ? CONST_OPEN : 0);

// ---------- Cofre del jefe ----------
// Al ganar el jefe por primera vez: premio según el % de estrellas del mundo (tope 100% = 30/30).
// 7 nov 2026: las monedas salen al azar entre un mínimo y un máximo, y los comodines y deshacer por probabilidad
// (odds); el comodín solo en el de oro. bossChest dice el sello (para la postal); rollChest sortea el premio al ganar.
const CHEST = [
  [1, { coins: [40, 80], undo: 2, wild: 1, odds: 0.5 }, 'oro'],
  [0.9, { coins: [30, 60], undo: 2, odds: 0.5 }, 'plata'],
  [0.75, { coins: [20, 45], undo: 1, odds: 0.5 }, 'bronce'],
  [0.5, { coins: [15, 30], undo: 1, odds: 0.3 }, 'sello'],
  [0, { coins: [5, 15] }, 'sello'],
];
const between = ([a, b], r) => Math.round((a + r() * (b - a)) / 5) * 5;
const chance = (n = 0, odds = 0, r) => Array.from({ length: n }).reduce((k) => k + (r() < odds), 0);
export function bossChest(worldStars) {
  const pct = worldStars / (LEVELS_PER_WORLD * 3);
  const [, prize, tier] = CHEST.find(([min]) => pct >= min);
  return { ...prize, tier, pct };
}
export function rollChest(worldStars, r = Math.random) {
  const c = bossChest(worldStars);
  return { tier: c.tier, pct: c.pct, coins: between(c.coins, r), undo: chance(c.undo, c.odds, r), wild: chance(c.wild, c.odds, r) };
}

// Nivel secreto: paga entre 1.5 y 2.5 veces lo del jefe de su mundo (según estrellas; antes justo el doble). La primera
// vez con 3★ puede dar además 1 comodín (40%) y hasta 2 deshacer (50% cada uno); antes siempre los daba.
export const SECRET_MULT = [1.5, 2.5];
export const SECRET_PRIZE = { wild: 1, undo: 2 };
export const SECRET_ODDS = { wild: 0.4, undo: 0.5 };
export const secretCoins = (n, r = Math.random) => Math.round((n * (SECRET_MULT[0] + r() * (SECRET_MULT[1] - SECRET_MULT[0]))) / 5) * 5;
export const rollSecret = (r = Math.random) => ({ wild: chance(SECRET_PRIZE.wild, SECRET_ODDS.wild, r), undo: chance(SECRET_PRIZE.undo, SECRET_ODDS.undo, r) });
