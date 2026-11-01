// Motor de reglas: el estado de una partida y las acciones posibles.
// Es la única fuente de reglas: lo usan el juego, el solucionador, el bot y las pruebas.
//
// Estado: { rem: bool[], stock: carta[], top: carta, streak, plays, actions, boom: id[] }
//   rem      cartas del tablero ya retiradas (incluye cartas regalo activadas)
//   plays    cartas jugadas del tablero (derrite el hielo)
//   actions  jugadas + robos (mueve la carta viva y la cuenta de la bomba)
//   boom     bombas que ya explotaron
//
// Mecánicas de carta (campos en level.cards):
//   lock/key  candado y su llave (level.keys[i] = id de la llave del candado i)
//   pack      carta regalo: se activa sola al destaparse y manda sus cartas al final del mazo
//   ice       hielo: no se puede jugar hasta llevar `ice` cartas jugadas del tablero
//   alt       carta doble: es `rank` y `alt` a la vez (en el tablero y como carta base del descarte)
//   arrow     flecha (+1 / -1): la siguiente jugada debe ser justo un número arriba / abajo
//   curtain   cortina i: boca abajo hasta retirar su carta llave (level.curtains[i])
//   bomb      bomba: carta especial sin número; si no la destapas antes de `bomb` acciones, explota y quema 3 cartas del mazo
//   live      carta viva (+1 / -1): su número cambia con cada acción (jugar o robar)
import { hash } from './rng.js';

export const mod13 = (n) => ((n % 13) + 13) % 13;
export const BURN = 3; // cartas que quema una bomba

export function initState(level, extra = {}) {
  return {
    rem: new Array(level.cards.length).fill(false),
    stock: level.stock.map((c) => ({ ...c })),
    top: { ...level.waste0 },
    streak: 0,
    plays: 0,
    actions: 0,
    boom: [],
    ...extra,
  };
}

export const cloneState = (s) => ({ ...s, rem: s.rem.slice(), stock: s.stock.slice(), boom: s.boom.slice() });

// Número que muestra ahora una carta (la carta viva cambia con las acciones).
export const rankOf = (c, s) => (c.live ? mod13(c.rank + c.live * s.actions) : c.rank);

// ¿Vale el rango r sobre el descarte? A y K se conectan. Una flecha en el descarte obliga a una dirección.
// Una carta doble en el descarte abre dos caminos (vale seguir desde cualquiera de sus dos números).
const near = (a, b) => {
  const d = Math.abs(a - b);
  return d === 1 || d === 12;
};
export function follows(top, r) {
  if (!top || r == null) return false;
  if (top.wild) return true;
  if (top.arrow) return r === mod13(top.rank + top.arrow);
  return near(top.rank, r) || (top.alt != null && near(top.alt, r));
}

export const isFree = (c, s) => c.coveredBy.every((j) => s.rem[j]);
export const curtainOpen = (level, c, s) => c.curtain == null || !!s.rem[level.curtains[c.curtain]];
export const lockOpen = (level, c, s) => c.lock == null || !!s.rem[level.keys[c.lock]];
export const iceLeft = (c, s) => (c.ice ? Math.max(0, c.ice - s.plays) : 0);
export const bombLeft = (c, s) => (c.bomb && !s.rem[c.id] ? c.bomb - s.actions : null);

// Cartas especiales sin número (no se juegan, se activan al destaparse): regalo y bomba.
export const special = (c) => !!(c.pack || c.bomb);

// Boca arriba: libre y sin cortina cerrada.
export const faceUp = (level, c, s) => !s.rem[c.id] && !special(c) && isFree(c, s) && curtainOpen(level, c, s);

// ¿Se puede tocar ya (sin mirar el número)?
export const isOpen = (level, c, s) => faceUp(level, c, s) && lockOpen(level, c, s) && !iceLeft(c, s);

// Con qué número se jugaría (la carta doble prueba sus dos números). null = no se puede.
export function playRank(level, c, s) {
  if (!isOpen(level, c, s)) return null;
  const r = rankOf(c, s);
  if (follows(s.top, r)) return r;
  if (c.alt != null && follows(s.top, c.alt)) return c.alt;
  return null;
}

export const legal = (level, s) => level.cards.filter((c) => playRank(level, c, s) != null);
export const won = (s) => s.rem.every(Boolean);

// ---------- Premios de racha ----------
// Racha 6: +1 carta útil al mazo · 9: un comodín al mazo · 12: +1 comodín al inventario
// · después, cada 3: +1 carta útil. Las cartas de premio entran en un lugar "al azar" del mazo, nunca entre las 3 primeras
// (determinista según el estado, para que juego, solucionador y bot coincidan).
// Los premios solo añaden cartas.
export function streakReward(streak) {
  if (streak === 6) return 'card';
  if (streak === 9) return 'wild';
  if (streak === 12) return 'bank';
  if (streak > 12 && streak % 3 === 0) return 'card';
  return null;
}

export function nextReward(streak) {
  for (let s = streak + 1; ; s++) {
    const kind = streakReward(s);
    if (kind) return { at: s, kind };
  }
}

// La carta útil es vecina (+1) de la primera carta jugable del tablero, por id.
function rewardCard(level, s, kind) {
  if (kind === 'wild') return { wild: true, reward: true };
  const c = level.cards.find((c) => isOpen(level, c, s)) || level.cards.find((c) => !s.rem[c.id] && !special(c));
  return { rank: c ? mod13(rankOf(c, s) + 1) : 0, suit: c ? (c.id + 1) % 4 : 0, reward: true };
}

function applyReward(level, s) {
  const kind = streakReward(s.streak);
  if (!kind) return null;
  let pos = -1;
  if (kind !== 'bank') {
    const gone = s.rem.reduce((a, b) => a + (b ? 1 : 0), 0);
    const h = hash(level.g * 131 + s.streak * 17 + gone * 7 + s.stock.length);
    pos = s.stock.length < 3 ? s.stock.length : 3 + (h % (s.stock.length - 2));
    s.stock.splice(pos, 0, rewardCard(level, s, kind));
  }
  return { kind, pos };
}

// Cartas especiales que quedaron destapadas: la carta regalo manda su contenido al final del mazo
// y la bomba se desactiva. Las dos se quitan del tablero.
function activate(level, s) {
  const packs = [];
  const defused = [];
  for (const c of level.cards) {
    if (!special(c) || s.rem[c.id] || !isFree(c, s)) continue;
    s.rem[c.id] = true;
    if (c.pack) {
      s.stock.push(...c.pack.map((x) => ({ ...x })));
      packs.push(c.id);
    } else defused.push(c.id);
  }
  return { packs, defused };
}

// Bombas tapadas cuya cuenta llegó a 0: explotan, salen del tablero y queman las primeras cartas del mazo.
function checkBombs(level, s) {
  const out = [];
  for (const c of level.cards) {
    if (!c.bomb || s.rem[c.id] || s.actions < c.bomb) continue;
    s.rem[c.id] = true;
    s.boom.push(c.id);
    out.push({ id: c.id, burned: s.stock.splice(0, BURN) });
  }
  return out;
}

// ---------- Acciones (devuelven un estado nuevo y lo que pasó, para animarlo) ----------
export function play(level, s0, id) {
  const c = level.cards[id];
  const r = playRank(level, c, s0);
  const s = cloneState(s0);
  s.rem[id] = true;
  // La carta doble llega al descarte con sus dos números; la flecha, con su obligación.
  s.top = c.alt != null ? { rank: c.rank, alt: c.alt, suit: c.suit } : { rank: r, suit: c.suit, ...(c.arrow && { arrow: c.arrow }) };
  s.plays++;
  s.actions++;
  s.streak++;
  const { packs, defused } = activate(level, s);
  const reward = applyReward(level, s);
  const boom = checkBombs(level, s);
  return { s, ev: { t: 'play', id, rank: r, packs, defused, reward, boom } };
}

export function draw(level, s0) {
  const s = cloneState(s0);
  const card = s.stock.shift();
  s.top = card;
  s.actions++;
  s.streak = 0;
  const boom = checkBombs(level, s);
  return { s, ev: { t: 'draw', card, boom } };
}

// ---------- Solucionador y bot ----------
const sig = (c) => (c.wild ? 'w' : `${c.rank}${c.alt != null ? `/${c.alt}` : ''}${c.arrow ? (c.arrow > 0 ? '+' : '-') : ''}`);

// Busca una solución desde un estado (profundidad primero, con memoria). Devuelve [id | 'draw', …] o null.
export function solve(level, s0, limit = 250000) {
  const timed = level.cards.some((c) => c.live || c.bomb);
  const seen = new Set();
  const path = [];
  let nodes = 0;
  const dfs = (s) => {
    if (won(s)) return true;
    if (++nodes > limit) return false;
    const key = `${s.rem.map((b) => (b ? 1 : 0)).join('')}|${s.stock.map(sig).join(',')}|${sig(s.top)}|${Math.min(s.streak, 13 + (s.streak % 3))}${timed ? `|${s.actions}|${s.boom}` : ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    for (const c of legal(level, s)) {
      path.push(c.id);
      if (dfs(play(level, s, c.id).s)) return true;
      path.pop();
    }
    if (s.stock.length) {
      path.push('draw');
      if (dfs(draw(level, s).s)) return true;
      path.pop();
    }
    return false;
  };
  return dfs(s0) ? path : null;
}

// Jugador casual: juega cualquier carta válida al azar; si no hay, roba. Sin boosters, con premios de racha.
export function playCasual(level, r = Math.random) {
  let s = initState(level);
  for (;;) {
    const moves = legal(level, s);
    if (moves.length) s = play(level, s, moves[Math.floor(r() * moves.length)].id).s;
    else if (s.stock.length) s = draw(level, s).s;
    else return false;
    if (won(s)) return true;
  }
}

// Estrellas al ganar: cartas que quedan en el mazo contra las del mazo inicial (las de cartas regalo no cuentan:
// contarlas castigaba de más esos niveles). 3★ = te queda la mitad o más (los premios de racha suman),
// 2★ = al menos un cuarto, 1★ = menos. Comprar +5 cartas siempre deja 1★ (se decide en el juego).
export function starsFor(level, left) {
  const total = level.stock.length;
  return left >= Math.ceil(total / 2) ? 3 : left >= Math.ceil(total / 4) ? 2 : 1;
}
