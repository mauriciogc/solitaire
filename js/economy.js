// Economía: boletos de entrada y monedas por estrellas.
import { difficulty, LEVELS_PER_WORLD } from './levels.js';

export const TICKET_PRICE = 40; // monedas por boleto
export const DAILY = { coins: 150, tickets: 3 }; // regalo diario
// Boosters: el comodín y el pack de 3 deshacer suben con el avance, en los mismos escalones que los boletos.
// +5 cartas tiene precio fijo.
const TIERS = { wild: [250, 350, 450], undo: [50, 75, 100] };
const EXTRA = 150;

// Boletos para entrar a un nivel: suben con el avance, con tope de 3.
export function ticketCost(g) {
  const w = Math.floor(g / LEVELS_PER_WORLD);
  return w < 5 ? 1 : w < 20 ? 2 : 3;
}

// Monedas que vale un nivel con 3 estrellas. Sube con la dificultad; los jefes dan +50%.
export function levelReward(g) {
  const boss = g % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1;
  const base = Math.round((45 + 75 * difficulty(g)) / 5) * 5;
  return boss ? Math.round((base * 1.5) / 5) * 5 : base;
}

const part = (g, stars) => Math.round((levelReward(g) * stars) / 3);

// Solo se paga lo que falta respecto al mejor resultado anterior (con 3★ ya no se paga más).
export const coinsFor = (g, stars, prev = 0) => Math.max(0, part(g, stars) - part(g, prev));

// Precio de un booster según el avance del jugador (`next` = primer nivel sin completar).
export function price(kind, next) {
  if (kind === 'extra') return EXTRA;
  return TIERS[kind][ticketCost(next) - 1];
}
