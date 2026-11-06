// Motor de reglas: el estado de una partida y las acciones posibles.
// Es la única fuente de reglas: lo usan el juego, el solucionador, el bot y las pruebas.
//
// Estado: { rem: bool[], stock: carta[], top: carta, streak, plays, actions, boom: id[], turbo, cut: [] }
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
//   comet     cometa: carta especial sin número; si la destapas antes de `comet` acciones, vuela a la racha y le suma
//             lo que falta para el siguiente premio (de 3 a 5, ver cometWish); si no, se va (sin castigo)
//   turbo     cohete turbo (en el tablero o en el mazo): al jugarlo o robarlo, las TURBO jugadas siguientes suman 2 a la
//             racha (s.turbo = las que quedan). Robar otra carta lo apaga
//   half      boleto partido: dos números, `rank` arriba y `half` abajo. Se juega con cualquiera de las dos mitades;
//             la otra se queda en su lugar (sigue tapando) para jugarla después (s.cut[id] = 1: se jugó la de arriba,
//             2: la de abajo)
//   live      carta viva (+1 / -1): su número cambia con cada acción (jugar o robar)
//   neb       nebulosa: la carta está en un tramo escondido que sale cuando ya se vaciaron `neb` tramos, cualesquiera
//             (level.neb = ids de cada tramo)
import { hash } from './rng.js';

export const mod13 = (n) => ((n % 13) + 13) % 13;
export const BURN = 3; // cartas que quema una bomba
export const TURBO = 3; // jugadas que valen doble tras un cohete turbo

export function initState(level, extra = {}) {
  return {
    rem: new Array(level.cards.length).fill(false),
    stock: level.stock.map((c) => ({ ...c })),
    top: { ...level.waste0 },
    streak: 0,
    plays: 0,
    actions: 0,
    boom: [],
    turbo: 0,
    cut: [],
    ...extra,
  };
}

// (Partidas guardadas antes del boleto partido no traen cut.)
export const cloneState = (s) => ({ ...s, rem: s.rem.slice(), stock: s.stock.slice(), boom: s.boom.slice(), cut: (s.cut || []).slice() });

// Mitad del boleto partido que ya se jugó (0 = está entero, 1 = la de arriba, 2 = la de abajo).
export const cutOf = (c, s) => (c.half != null && s.cut?.[c.id]) || 0;

// Número que muestra ahora una carta (la carta viva cambia con las acciones; del boleto partido, la mitad que queda).
export const rankOf = (c, s) => (c.live ? mod13(c.rank + c.live * s.actions) : cutOf(c, s) === 1 ? c.half : c.rank);

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

// Tramos de la nebulosa ya vaciados.
export const nebOut = (level, s) => (level.neb ? level.neb.reduce((n, t) => n + t.every((j) => s.rem[j]), 0) : 0);
export const isFree = (c, s, level) => c.coveredBy.every((j) => s.rem[j]) && (!c.neb || nebOut(level, s) >= c.neb);
export const curtainOpen = (level, c, s) => c.curtain == null || !!s.rem[level.curtains[c.curtain]];
export const lockOpen = (level, c, s) => c.lock == null || !!s.rem[level.keys[c.lock]];
export const iceLeft = (c, s) => (c.ice ? Math.max(0, c.ice - s.plays) : 0);
export const bombLeft = (c, s) => (c.bomb && !s.rem[c.id] ? c.bomb - s.actions : null);
export const cometLeft = (c, s) => (c.comet && !s.rem[c.id] ? c.comet - s.actions : null);

// Cartas especiales sin número (no se juegan, se activan al destaparse): regalo, bomba y cometa.
export const special = (c) => !!(c.pack || c.bomb || c.comet);

// Boca arriba: libre y sin cortina cerrada.
export const faceUp = (level, c, s) => !s.rem[c.id] && !special(c) && isFree(c, s, level) && curtainOpen(level, c, s);

// ¿Se puede tocar ya (sin mirar el número)?
export const isOpen = (level, c, s) => faceUp(level, c, s) && lockOpen(level, c, s) && !iceLeft(c, s);

// Con qué número se jugaría (la carta doble prueba sus dos números; el boleto entero, sus dos mitades). null = no se puede.
// low: del boleto entero, la mitad de abajo si las dos conectan (la que tocó el jugador).
export function playRank(level, c, s, low = false) {
  if (!isOpen(level, c, s)) return null;
  const r = rankOf(c, s);
  const both = c.half != null && !cutOf(c, s);
  if (both && low && follows(s.top, c.half)) return c.half;
  if (follows(s.top, r)) return r;
  if (c.alt != null && follows(s.top, c.alt)) return c.alt;
  if (both && follows(s.top, c.half)) return c.half;
  return null;
}

export const legal = (level, s) => level.cards.filter((c) => playRank(level, c, s) != null);
export const won = (s) => s.rem.every(Boolean);

// ---------- Premios de racha ----------
// Racha 6: +1 carta útil al mazo · 13: un comodín al mazo · 18 y 23: +1 carta útil · 31: +1 comodín al inventario
// · después, cada 3: +1 carta útil. Las cartas de premio entran en un lugar "al azar" del mazo, nunca entre las 3 primeras
// (determinista según el estado, para que juego, solucionador y bot coincidan).
// Los premios solo añaden cartas.
// step: cada cuántas cartas cuenta un paso (level.rewardStep): 1 normal, 2 = premios al doble de distancia
// (evento del mes), 0 = sin premios.
const REWARDS = { 6: 'card', 13: 'wild', 18: 'card', 23: 'card', 31: 'bank' };
const LAST_REWARD = 31;
export function streakReward(streak, step = 1) {
  if (!step || streak % step) return null;
  streak /= step;
  if (REWARDS[streak]) return REWARDS[streak];
  if (streak > LAST_REWARD && (streak - LAST_REWARD) % 3 === 0) return 'card';
  return null;
}

// Premio anterior (0 si no hay): de ahí empiezan los puntos de racha del tablero.
export function prevReward(at, step = 1) {
  for (let s = at - 1; s > 0; s--) if (streakReward(s, step)) return s;
  return 0;
}

export function nextReward(streak, step = 1) {
  if (!step) return null;
  for (let s = streak + 1; ; s++) {
    const kind = streakReward(s, step);
    if (kind) return { at: s, kind };
  }
}

// Lo que suma un cometa a la racha que llevas: lo que te falta para el siguiente premio, de 3 a 5
// (si te faltan 4, suma 4 y te lo llevas). Para mostrarlo en la carta: cometWish(level, { streak: racha + 1 }).
export function cometWish(level, s) {
  const next = nextReward(s.streak, level.rewardStep ?? 1);
  return next ? Math.min(5, Math.max(3, next.at - s.streak)) : 4;
}

// La carta útil es vecina (+1) de la primera carta jugable del tablero, por id.
function rewardCard(level, s, kind) {
  if (kind === 'wild') return { wild: true, reward: true };
  const c = level.cards.find((c) => isOpen(level, c, s)) || level.cards.find((c) => !s.rem[c.id] && !special(c));
  return { rank: c ? mod13(rankOf(c, s) + 1) : 0, suit: c ? (c.id + 1) % 4 : 0, reward: true };
}

// at: racha del premio (el cometa suma varios puntos de golpe y cada uno puede traer el suyo).
function applyReward(level, s, at = s.streak) {
  const kind = streakReward(at, level.rewardStep ?? 1);
  if (!kind) return null;
  let pos = -1;
  if (kind !== 'bank') {
    const gone = s.rem.reduce((a, b) => a + (b ? 1 : 0), 0);
    const h = hash(level.g * 131 + at * 17 + gone * 7 + s.stock.length);
    pos = s.stock.length < 3 ? s.stock.length : 3 + (h % (s.stock.length - 2));
    s.stock.splice(pos, 0, rewardCard(level, s, kind));
  }
  return { kind, pos };
}

// Cartas especiales que quedaron destapadas: la carta regalo manda su contenido al final del mazo,
// la bomba se desactiva y el cometa suma a la racha. Se quitan del tablero.
// Se repite mientras salga alguna: una especial que se va puede destapar otra que tenía debajo.
function activate(level, s, out = { packs: [], defused: [], wished: [] }) {
  let more = true;
  while (more) {
    more = false;
    for (const c of level.cards) {
      if (!special(c) || s.rem[c.id] || !isFree(c, s, level)) continue;
      s.rem[c.id] = true;
      more = true;
      if (c.pack) {
        s.stock.push(...c.pack.map((x) => ({ ...x })));
        out.packs.push(c.id);
      } else if (c.comet) {
        s.streak += cometWish(level, s);
        out.wished.push(c.id);
      } else out.defused.push(c.id);
    }
  }
  return out;
}

// Después de explotar bombas o irse cometas: lo que destaparon se activa ya (no hasta la siguiente acción).
// Los premios que alcance un cometa destapado así también caen.
function activateAfter(level, s, act, wishes) {
  const from = s.streak;
  const n = act.wished.length;
  activate(level, s, act);
  if (act.wished.length === n) return;
  for (let k = from + 1; k <= s.streak; k++) {
    const w = applyReward(level, s, k);
    if (w) wishes.push({ ...w, at: k });
  }
}

// Cometas tapados cuya cuenta llegó a 0: se van del tablero sin hacer nada.
function checkComets(level, s) {
  const out = [];
  for (const c of level.cards) {
    if (!c.comet || s.rem[c.id] || s.actions < c.comet) continue;
    s.rem[c.id] = true;
    out.push(c.id);
  }
  return out;
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
export function play(level, s0, id, low = false) {
  const c = level.cards[id];
  const r = playRank(level, c, s0, low);
  const s = cloneState(s0);
  // Boleto entero: se parte y la otra mitad se queda en el tablero.
  const split = c.half != null && !cutOf(c, s0) ? (r === c.rank && !(low && r === c.half) ? 1 : 2) : 0;
  if (split) s.cut[id] = split;
  else s.rem[id] = true;
  // La carta doble llega al descarte con sus dos números; la flecha, con su obligación.
  s.top = c.alt != null ? { rank: c.rank, alt: c.alt, suit: c.suit } : { rank: r, suit: c.suit, ...(c.arrow && { arrow: c.arrow }) };
  s.plays++;
  s.actions++;
  s.streak++;
  const at = s.streak;
  // Turbo: esta jugada suma un punto más (y su premio, si toca).
  const boosted = s0.turbo > 0;
  if (boosted) s.streak++;
  s.turbo = c.turbo ? TURBO : boosted ? s0.turbo - 1 : 0;
  const act = activate(level, s);
  const { packs, defused, wished } = act;
  const reward = applyReward(level, s, at);
  const boost = boosted ? applyReward(level, s, at + 1) : null;
  // Puntos que sumó el cometa: cada premio que alcanza también cae (en orden).
  const wishes = [];
  for (let k = at + (boosted ? 2 : 1); k <= s.streak; k++) {
    const w = applyReward(level, s, k);
    if (w) wishes.push({ ...w, at: k });
  }
  const boom = checkBombs(level, s);
  const gone = checkComets(level, s);
  if (boom.length || gone.length) activateAfter(level, s, act, wishes);
  return { s, ev: { t: 'play', id, rank: r, packs, defused, reward, boost, boom, wished, wishes, gone, ...(c.turbo && { turbo: true }), ...(split && { split }) } };
}

export function draw(level, s0) {
  const s = cloneState(s0);
  const card = s.stock.shift();
  s.top = card;
  s.actions++;
  s.streak = 0;
  s.turbo = card.turbo ? TURBO : 0;
  const boom = checkBombs(level, s);
  const gone = checkComets(level, s);
  const act = { packs: [], defused: [], wished: [] };
  const wishes = [];
  if (boom.length || gone.length) activateAfter(level, s, act, wishes);
  return { s, ev: { t: 'draw', card, boom, gone, ...act, wishes, ...(card.turbo && { turbo: true }) } };
}

// ---------- Solucionador y bot ----------
const sig = (c) => (c.wild ? 'w' : `${c.rank}${c.alt != null ? `/${c.alt}` : ''}${c.arrow ? (c.arrow > 0 ? '+' : '-') : ''}${c.turbo ? 't' : ''}`);
// Niveles con cohete turbo: el turbo que queda también es parte del estado.
const hasTurbo = (level) => level.cards.some((c) => c.turbo) || level.stock.some((c) => c.turbo);

// Busca una solución desde un estado (profundidad primero, con memoria). Devuelve [id | 'draw' | 'wild', …] o null.
// wilds: comodines que puede usar (como en el juego, solo al quedarse sin jugadas).
export function solve(level, s0, limit = 250000, wilds = 0) {
  const timed = level.cards.some((c) => c.live || c.bomb || c.comet);
  const turbo = hasTurbo(level);
  const seen = new Set();
  const path = [];
  let nodes = 0;
  const dfs = (s, w = wilds) => {
    if (won(s)) return true;
    if (++nodes > limit) return false;
    const key = `${w}|${s.rem.map((b, i) => (b ? 1 : s.cut?.[i] ? s.cut[i] + 1 : 0)).join('')}|${s.stock.map(sig).join(',')}|${sig(s.top)}|${Math.min(s.streak, 13 + (s.streak % 3))}${timed ? `|${s.actions}|${s.boom}` : ''}${turbo ? `|${s.turbo}` : ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    const moves = legal(level, s);
    for (const c of moves) {
      path.push(c.id);
      if (dfs(play(level, s, c.id).s, w)) return true;
      path.pop();
    }
    if (s.stock.length) {
      path.push('draw');
      if (dfs(draw(level, s).s, w)) return true;
      path.pop();
    }
    if (!moves.length && w > 0 && !s.top.wild) {
      path.push('wild');
      if (dfs({ ...cloneState(s), top: { wild: true } }, w - 1)) return true;
      path.pop();
    }
    return false;
  };
  return dfs(s0) ? path : null;
}

// Solucionador con ayudas: wilds = comodines y five = compras de +5 cartas que se pueden usar.
// Como en el juego, el comodín se usa al atorarse (sin jugadas) y el +5 solo con el mazo vacío
// (llegan 5 cartas vecinas de las que están libres). Devuelve { ok, cut }: cut = se acabó el límite
// sin terminar de buscar (entonces un "no" no está comprobado).
export function solveHelp(level, wilds = 0, five = 0, limit = 60000) {
  const timed = level.cards.some((c) => c.live || c.bomb || c.comet);
  const turbo = hasTurbo(level);
  const seen = new Set();
  let nodes = 0, cut = false;
  const dfs = (s, w, f) => {
    if (won(s)) return true;
    if (++nodes > limit) return !(cut = true);
    const key = `${w}${f}|${s.rem.map((b, i) => (b ? 1 : s.cut?.[i] ? s.cut[i] + 1 : 0)).join('')}|${s.stock.map(sig).join(',')}|${sig(s.top)}|${Math.min(s.streak, 13 + (s.streak % 3))}${timed ? `|${s.actions}|${s.boom}` : ''}${turbo ? `|${s.turbo}` : ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    const moves = legal(level, s);
    for (const c of moves) if (dfs(play(level, s, c.id).s, w, f)) return true;
    if (s.stock.length && dfs(draw(level, s).s, w, f)) return true;
    if (moves.length) return false;
    if (w > 0 && !s.top.wild && dfs({ ...cloneState(s), top: { wild: true } }, w - 1, f)) return true;
    if (f > 0 && !s.stock.length) {
      const free = level.cards.filter((c) => isOpen(level, c, s)), t = cloneState(s);
      for (let i = 0; i < 5; i++) {
        const c = free[i % Math.max(1, free.length)];
        t.stock.push({ rank: c ? mod13(rankOf(c, s) + (i % 2 ? -1 : 1)) : 0, suit: i % 4 });
      }
      if (dfs(t, w, f - 1)) return true;
    }
    return false;
  };
  const ok = dfs(initState(level), wilds, five);
  return { ok, cut: !ok && cut };
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
