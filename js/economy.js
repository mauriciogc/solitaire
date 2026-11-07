// Economía: boletos de entrada y monedas por estrellas.
import { difficulty, LEVELS_PER_WORLD } from './levels.js';

export const TICKET_PRICE = 40; // monedas por boleto
// Boosters: el comodín, el pack de 3 deshacer y +5 cartas suben con el avance, en los mismos escalones que los boletos
// (1, 2 o 3 boletos por nivel).
const TIERS = { wild: [250, 350, 450], undo: [50, 75, 100], extra: [100, 150, 200] };

// Boletos para entrar a un nivel: por tercios del universo (52 constelaciones de 10 mundos):
// constelaciones 1-17 → 1 boleto, 18-35 → 2, 36-52 → 3. Ganar el nivel por primera vez los devuelve
// (ticketRefund): solo se pierden al perder o abandonar.
export function ticketCost(g) {
  const r = Math.floor(g / LEVELS_PER_WORLD / 10);
  return r < 17 ? 1 : r < 35 ? 2 : 3;
}
export const ticketRefund = ticketCost;

// Monedas que vale un nivel con 3 estrellas. Sube con la dificultad; los jefes dan +50%.
export function levelReward(g) {
  const boss = g % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1;
  const base = Math.round((45 + 75 * difficulty(g)) / 5) * 5;
  return boss ? Math.round((base * 1.5) / 5) * 5 : base;
}

const part = (g, stars) => Math.round((levelReward(g) * stars) / 3);

// Solo se paga lo que falta respecto al mejor resultado anterior (con 3★ ya no se paga más).
export const coinsFor = (g, stars, prev = 0) => Math.max(0, part(g, stars) - part(g, prev));

// Precio de un booster según el avance (`g` = nivel de referencia: el que se juega o el primero sin completar).
export function price(kind, g) {
  return TIERS[kind][ticketCost(g) - 1];
}
// Dentro del nivel, las ayudas cuestan distinto según dónde se juega: en el evento del mes y en las festividades,
// 30% más caras (comodín, deshacer y +5); durante la lluvia de meteoritos, comodín y deshacer 30% menos (se ve como
// descuento). La tienda tiene 10% menos mientras cae la lluvia.
export const EV_MARKUP = 0.3;
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

// ---------- Cofre del jefe ----------
// Al ganar el jefe por primera vez: premio según el % de estrellas del mundo (tope 100% = 30/30).
const CHEST = [
  [1, { coins: 50, undo: 2, wild: 1 }, 'oro'],
  [0.9, { coins: 40, undo: 2 }, 'plata'],
  [0.75, { coins: 30, undo: 1 }, 'bronce'],
  [0.5, { coins: 20, undo: 1 }, 'sello'],
  [0, { coins: 10 }, 'sello'],
];
export function bossChest(worldStars) {
  const pct = worldStars / (LEVELS_PER_WORLD * 3);
  const [, prize, tier] = CHEST.find(([min]) => pct >= min);
  return { ...prize, tier, pct };
}

// Nivel secreto: paga el doble que el jefe de su mundo (según estrellas). La primera vez con 3★ regala además
// 1 comodín y 2 deshacer; con menos estrellas, solo monedas.
export const SECRET_MULT = 2;
export const SECRET_PRIZE = { wild: 1, undo: 2 };
