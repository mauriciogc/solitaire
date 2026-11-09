// Motor de reglas: el estado de una partida y las acciones posibles.
// Es la única fuente de reglas: lo usan el juego, el solucionador, el bot y las pruebas.
//
// Estado: { rem: bool[], stock: carta[], top: carta, streak, plays, actions, boom: id[], turbo, cut: [] }
//   rem      cartas del tablero ya retiradas (incluye cartas regalo activadas)
//   plays    cartas jugadas del tablero (derrite el hielo)
//   actions  jugadas + robos (mueve la carta viva y la cuenta de la bomba y el cometa). Con el reloj de arena prendido
//            (freeze > 0) las acciones no avanzan el reloj: cada una gasta un turno congelado
//   freeze   turnos congelados que quedan (ayuda reloj de arena, CLOCK_TURNS)
//   master   llave maestra usada: todos los candados y cortinas abiertos
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
//   ghost     fantasma (1 o 2 = fase): aparece y desaparece cada 2 acciones; solo se juega cuando se ve (ghostShown)
//   ring      agujero negro (8 nov 2026; 9 nov: cada vez se traga otras): la carta muestra ring[giros % ring.length]
//             (su número en cada vuelta del agujero; cada HOLE_EVERY acciones da una vuelta). En cada vuelta solo
//             cambian las que se tragó esa vez, al azar de todo el tablero, sin marcar cuáles
//   belt      banda transportadora: su lugar en la vuelta (ver beltShown)
//   door      puertas (9 nov 2026): la carta está en la pila detrás de la puerta `door` (0, 1, 2) y sale cuando el
//             jugador abre esa puerta con una llave (openDoor). Cerrada no cuenta para ganar; abierta sí.
//   doorKey   carta llave: al jugarla te da una llave (s.keys) para abrir la puerta que tú escojas
//   neb       nebulosa: la carta está en un tramo escondido que sale cuando ya se vaciaron `neb` tramos, cualesquiera
//             (level.neb = ids de cada tramo)
import { hash } from './rng.js';

export const mod13 = (n) => ((n % 13) + 13) % 13;
export const BURN = 3; // cartas que quema una bomba
export const TURBO = 3; // jugadas que valen doble tras un cohete turbo
export const CLOCK_TURNS = 3; // turnos que congela el reloj de arena

// Una acción (jugar o robar) avanza el reloj de las cuentas (bomba, cometa, carta viva), salvo con el reloj de arena.
function tick(s) {
  if (s.freeze > 0) s.freeze--;
  else s.actions++;
}
// ---------- Nave ladrona (7 nov 2026) ----------
// Nivel con level.ship: la nave llega cada 3 a 5 robos (no se sabe cuándo; fijo por nivel) y se lleva del mazo una
// carta que te servía (la primera que conecta con alguna carta libre del tablero; si ninguna, la que sigue). Cada
// SHIP_STREAK de racha se asusta y te regresa la última que se llevó; si no se llevó nada, no pasa nada (8 nov 2026).
export const SHIP_STREAK = 4;
const shipGap = (level, n) => 3 + (hash(level.g * 911 + n * 37 + 5) % 3);
function steal(level, s) {
  if (!s.stock.length) return null;
  const open = level.cards.filter((c) => isOpen(level, c, s)).map((c) => rankOf(c, s));
  let i = s.stock.slice(0, 6).findIndex((x) => !x.wild && !x.reward && open.some((r) => follows({ rank: x.rank }, r)));
  if (i < 0) i = 0;
  const [card] = s.stock.splice(i, 1);
  s.stolen = [...(s.stolen || []), card];
  s.shipN = (s.shipN || 0) + 1;
  s.shipIn = shipGap(level, s.shipN);
  return { card, pos: i };
}
function giveBack(level, s, at) {
  if (!s.stolen?.length) return null;
  const card = s.stolen[s.stolen.length - 1];
  s.stolen = s.stolen.slice(0, -1);
  const h = hash(level.g * 577 + at * 13 + s.stock.length);
  const pos = s.stock.length < 3 ? s.stock.length : 3 + (h % (s.stock.length - 2));
  s.stock.splice(pos, 0, { ...card, back: true });
  return { pos, card };
}

// Ayudas del mazo de ayudas (7 nov 2026). No son acciones: no tocan la racha ni las cuentas.
// Reloj de arena: congela CLOCK_TURNS turnos todo lo que cuenta (bomba, cometa, carta viva…).
export const useClock = (s0) => ({ ...cloneState(s0), freeze: (s0.freeze || 0) + CLOCK_TURNS });
// Llave maestra: abre todos los candados y cortinas del tablero.
export const useMaster = (s0) => ({ ...cloneState(s0), master: true });

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
    // Nave ladrona: robos que faltan para que llegue, cuántas veces ha llegado y lo que se llevó.
    ...(level.ship && { shipIn: shipGap(level, 0), shipN: 0, stolen: [] }),
    // Marea: tq sube 1 por robo y baja 1 por jugada; el agua es tq / 3 (ver setTide).
    ...(level.tide && { tq: 0, tide: 0 }),
    // Puertas: llaves en la mano y puertas abiertas.
    ...(level.doors && { keys: 0, open: [] }),
    ...extra,
  };
}

// (Partidas guardadas antes del boleto partido no traen cut.)
export const cloneState = (s) => ({ ...s, rem: s.rem.slice(), stock: s.stock.slice(), boom: s.boom.slice(), cut: (s.cut || []).slice(), ...(s.open && { open: s.open.slice() }) });

// Mitad del boleto partido que ya se jugó (0 = está entero, 1 = la de arriba, 2 = la de abajo).
export const cutOf = (c, s) => (c.half != null && s.cut?.[c.id]) || 0;

// Agujero negro (8 nov 2026): cada HOLE_EVERY jugadas o robos se traga sus cartas y las escupe con los números
// revueltos (cada una toma el de la siguiente del giro). El reloj de arena lo detiene (las acciones no avanzan).
export const HOLE_EVERY = 4;
export const holeTurn = (s) => Math.floor(s.actions / HOLE_EVERY);
export const holeLeft = (s) => HOLE_EVERY - (s.actions % HOLE_EVERY);
// ¿Se la tragó en la vuelta t (cambió de número)?
export const holeTook = (c, t) => !!c.ring && t > 0 && c.ring[t % c.ring.length] !== c.ring[(t - 1) % c.ring.length];

// Número que muestra ahora una carta (la carta viva cambia con las acciones; del boleto partido, la mitad que queda;
// la del agujero negro, la que le toca en el giro).
export const rankOf = (c, s) => (c.ring ? c.ring[holeTurn(s) % c.ring.length] : c.live ? mod13(c.rank + c.live * s.actions) : cutOf(c, s) === 1 ? c.half : c.rank);

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
// Puertas (9 nov 2026): pilas chicas a la orilla del tablero, cada una tras su puerta (level.doors[d] = { n, prize,
// coins? }). Hay menos llaves que puertas: cada carta llave da una llave y el jugador escoge qué puerta abrir. Al abrirse
// su premio se activa (moneda, cometa o cohete) y sus cartas salen al tablero y cuentan para ganar. Si nunca la abre,
// sus cartas no cuentan. La llave maestra no las abre (abrir es decisión del jugador).
export const doorOpen = (level, d, s) => !!s.open?.[d];
// ¿Cuenta para ganar? Las cartas tras una puerta cerrada no.
export const counts = (level, c, s) => c.door == null || doorOpen(level, c.door, s);
export const isFree = (c, s, level) => c.coveredBy.every((j) => s.rem[j]) && (!c.neb || nebOut(level, s) >= c.neb) && (c.door == null || doorOpen(level, c.door, s));
export const curtainOpen = (level, c, s) => c.curtain == null || !!s.master || !!s.rem[level.curtains[c.curtain]];
export const lockOpen = (level, c, s) => c.lock == null || !!s.master || !!s.rem[level.keys[c.lock]];
export const iceLeft = (c, s) => (c.ice ? Math.max(0, c.ice - s.plays) : 0);
export const bombLeft = (c, s) => (c.bomb && !s.rem[c.id] ? c.bomb - s.actions : null);
export const cometLeft = (c, s) => (c.comet && !s.rem[c.id] ? c.comet - s.actions : null);

// Cartas especiales sin número (no se juegan, se activan al destaparse): regalo, bomba y cometa.
export const special = (c) => !!(c.pack || c.bomb || c.comet);

// Boca arriba: libre y sin cortina cerrada.
export const faceUp = (level, c, s) => !s.rem[c.id] && !special(c) && isFree(c, s, level) && curtainOpen(level, c, s);

// ¿Se puede tocar ya (sin mirar el número)?
// Fantasma (7 nov 2026): se ve 2 acciones y se esconde 2 (el reloj de arena también lo detiene). Escondido sigue tapando.
export const ghostShown = (c, s) => !c.ghost || (Math.floor(s.actions / 2) + c.ghost) % 2 === 1;
// Camaleón (7 nov 2026): c.cham = fase (1 o 2). Cada CHAM_EVERY jugadas o robos cambia: un rato es comodín (se juega
// sobre cualquier carta y deja seguir con cualquiera, como el comodín) y otro rato es su número. El reloj lo detiene.
// 8 nov 2026: antes cambiaba con cada acción (una y una); el usuario pidió "cada ciertos movimientos".
export const CHAM_EVERY = 3;
export const chamWild = (c, s) => !!c.cham && (Math.floor(s.actions / CHAM_EVERY) + c.cham) % 2 === 1;
// Marea (7 nov 2026): c.wet = franja desde abajo (1 la más baja, 2 la de arriba; solo la mitad de abajo del tablero).
// Bajo el agua no se juega (sigue boca arriba y tapando). s.tide lo calcula setTide al final de cada acción.
export const TIDE_MAX = 2;
export const underWater = (c, s) => !!c.wet && (s.tide || 0) >= c.wet;
// Banda transportadora (8 nov 2026): c.belt = su lugar en la vuelta (desde 1). Con cada acción la banda avanza un lugar;
// la carta se ve (y se juega) cuando su lugar pasa por la ventana de level.belt.W lugares. El reloj de arena la detiene.
export const BELT_W = 4; // 8 nov 2026: con 3 el bot casual ganaba 30% (47% en uno normal)
export const beltPos = (level, c, s) => (((c.belt - 1 - s.actions) % level.belt.K) + level.belt.K) % level.belt.K;
export const beltShown = (level, c, s) => !c.belt || !level.belt || beltPos(level, c, s) < level.belt.W;
export const isOpen = (level, c, s) => faceUp(level, c, s) && lockOpen(level, c, s) && !iceLeft(c, s) && ghostShown(c, s) && !underWater(c, s) && beltShown(level, c, s);
// Sube 1 franja cada 3 robos y baja 1 cada 3 jugadas (tq entre 0 y 3·TIDE_MAX + 2; el comodín cuenta como jugada y el
// +5 no la mueve). Nunca deja sin cartas libres: si el agua taparía todas las que se ven, se queda una franja abajo.
export function setTide(level, s, d = 0) {
  if (!level.tide) return s;
  s.tq = Math.max(0, Math.min(3 * TIDE_MAX + 2, (s.tq || 0) + d));
  let t = Math.min(TIDE_MAX, Math.floor(s.tq / 3));
  while (t > 0 && !level.cards.some((c) => faceUp(level, c, s) && !special(c) && !(c.wet && t >= c.wet))) t--;
  s.tide = t;
  return s;
}

// Con qué número se jugaría (la carta doble prueba sus dos números; el boleto entero, sus dos mitades). null = no se puede.
// low: del boleto entero, la mitad de abajo si las dos conectan (la que tocó el jugador).
export function playRank(level, c, s, low = false) {
  if (!isOpen(level, c, s)) return null;
  const r = rankOf(c, s);
  if (chamWild(c, s)) return r;
  const both = c.half != null && !cutOf(c, s);
  if (both && low && follows(s.top, c.half)) return c.half;
  if (follows(s.top, r)) return r;
  if (c.alt != null && follows(s.top, c.alt)) return c.alt;
  if (both && follows(s.top, c.half)) return c.half;
  return null;
}

export const legal = (level, s) => level.cards.filter((c) => playRank(level, c, s) != null);
export const won = (s, level) => s.rem.every((r, i) => r || (level?.cards[i].door != null && !s.open?.[level.cards[i].door]));

// ---------- Premios de racha ----------
// Racha 6: +1 carta útil al mazo · 13: un comodín al mazo · 18 y 23: +1 carta útil · 20 y 30: escoba (barre 1 y 2 de
// las cartas más enterradas del tablero; 7 nov 2026) · 31: +1 comodín al inventario · después, cada 3: +1 carta útil. Las cartas de premio entran en un lugar "al azar" del mazo, nunca entre las 3 primeras
// (determinista según el estado, para que juego, solucionador y bot coincidan).
// Los premios solo añaden cartas.
// step: cada cuántas cartas cuenta un paso (level.rewardStep): 1 normal, 2 = premios al doble de distancia
// (evento del mes), 0 = sin premios.
const REWARDS = { 6: 'card', 13: 'wild', 18: 'card', 20: 'broom', 23: 'card', 30: 'broom2', 31: 'bank' };
export const BROOM = { broom: 1, broom2: 2 };
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
  // Escoba: retira las cartas más enterradas (no cuentan como jugadas ni suman a la racha).
  if (BROOM[kind]) {
    const ids = buried(level, s, BROOM[kind]);
    for (const id of ids) s.rem[id] = true;
    return { kind: 'broom', ids, pos: -1 };
  }
  let pos = -1;
  if (kind !== 'bank') {
    const gone = s.rem.reduce((a, b) => a + (b ? 1 : 0), 0);
    const h = hash(level.g * 131 + at * 17 + gone * 7 + s.stock.length);
    pos = s.stock.length < 3 ? s.stock.length : 3 + (h % (s.stock.length - 2));
    s.stock.splice(pos, 0, rewardCard(level, s, kind));
  }
  return { kind, pos };
}

// Las n cartas más enterradas que quedan: las que tienen más cartas encima (contando las de encima de esas), sin las
// especiales ni los boletos partidos. Empates: la de id menor. Determinista, como todo el motor.
function buried(level, s, n) {
  const memo = new Map();
  const depth = (id) => {
    if (memo.has(id)) return memo.get(id);
    memo.set(id, 0);
    const d = level.cards[id].coveredBy.reduce((a, j) => (s.rem[j] ? a : a + 1 + depth(j)), 0);
    memo.set(id, d);
    return d;
  };
  return level.cards
    .filter((c) => !s.rem[c.id] && !special(c) && c.half == null && counts(level, c, s) && !isFree(c, s, level))
    .map((c) => [c.id, depth(c.id)])
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, n)
    .map(([id]) => id);
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
  s.top = chamWild(c, s0) ? { wild: true } : c.alt != null ? { rank: c.rank, alt: c.alt, suit: c.suit } : { rank: r, suit: c.suit, ...(c.arrow && { arrow: c.arrow }) };
  s.plays++;
  tick(s);
  s.streak++;
  // Carta llave: una llave más en la mano.
  if (c.doorKey) s.keys = (s.keys || 0) + 1;
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
  // Nave ladrona: cada SHIP_STREAK de racha regresa la última carta que se llevó (si no se llevó nada, nada).
  let shipBack = null;
  if (level.ship) for (let k = at; k <= s.streak; k++) if (k % SHIP_STREAK === 0) shipBack = giveBack(level, s, k) || shipBack;
  setTide(level, s, -1);
  return { s, ev: { t: 'play', id, rank: r, packs, defused, reward, boost, boom, wished, wishes, gone, ...(c.turbo && { turbo: true }), ...(split && { split }), ...(shipBack && { shipBack }), ...(c.doorKey && { key: true }) } };
}

// Abrir la puerta d con una llave. No es jugada ni robo: no mueve la racha ni las cuentas, salvo su premio
// (cometa: suma a la racha como el cometa del tablero, con los premios que alcance; cohete: turbo; moneda: la da el juego).
// null si no se puede (sin llaves o ya abierta).
export const canOpen = (level, s, d) => !!level.doors?.[d] && (s.keys || 0) > 0 && !doorOpen(level, d, s);
export function openDoor(level, s0, d) {
  if (!canOpen(level, s0, d)) return null;
  const s = cloneState(s0);
  s.keys--;
  s.open[d] = true;
  const prize = level.doors[d].prize || null, wishes = [];
  if (prize === 'comet') {
    const from = s.streak;
    s.streak += cometWish(level, s);
    for (let k = from + 1; k <= s.streak; k++) {
      const w = applyReward(level, s, k);
      if (w) wishes.push({ ...w, at: k });
    }
  } else if (prize === 'turbo') s.turbo = TURBO;
  return { s, ev: { t: 'door', d, prize, wishes, from: s0.streak } };
}

export function draw(level, s0) {
  const s = cloneState(s0);
  const card = s.stock.shift();
  s.top = card;
  tick(s);
  s.streak = 0;
  s.turbo = card.turbo ? TURBO : 0;
  const boom = checkBombs(level, s);
  const gone = checkComets(level, s);
  const act = { packs: [], defused: [], wished: [] };
  const wishes = [];
  if (boom.length || gone.length) activateAfter(level, s, act, wishes);
  // Nave ladrona: llega tras unos robos y se lleva una carta del mazo.
  const ship = level.ship && s.shipIn > 0 && --s.shipIn === 0 ? steal(level, s) : null;
  setTide(level, s, 1);
  return { s, ev: { t: 'draw', card, boom, gone, ...act, wishes, ...(card.turbo && { turbo: true }), ...(ship && { ship }) } };
}

// ---------- Solucionador y bot ----------
const sig = (c) => (c.wild ? 'w' : `${c.rank}${c.alt != null ? `/${c.alt}` : ''}${c.arrow ? (c.arrow > 0 ? '+' : '-') : ''}${c.turbo ? 't' : ''}`);
// Niveles con cohete turbo: el turbo que queda también es parte del estado.
const hasTurbo = (level) => level.cards.some((c) => c.turbo) || level.stock.some((c) => c.turbo);

// Busca una solución desde un estado (profundidad primero, con memoria). Devuelve [id | 'draw' | 'wild', …] o null.
// wilds: comodines que puede usar (como en el juego, solo al quedarse sin jugadas).
export function solve(level, s0, limit = 250000, wilds = 0) {
  const timed = level.cards.some((c) => c.live || c.bomb || c.comet || c.ghost || c.cham || c.ring || c.belt);
  const turbo = hasTurbo(level);
  const seen = new Set();
  const path = [];
  let nodes = 0;
  const dfs = (s, w = wilds) => {
    if (won(s, level)) return true;
    if (++nodes > limit) return false;
    const key = `${w}|${s.rem.map((b, i) => (b ? 1 : s.cut?.[i] ? s.cut[i] + 1 : 0)).join('')}|${s.stock.map(sig).join(',')}|${sig(s.top)}|${(s.streak <= LAST_REWARD ? s.streak : LAST_REWARD + 1 + ((s.streak - LAST_REWARD) % 3))}${timed ? `|${s.actions}|${s.boom}|${s.freeze || 0}` : ''}${level.ship ? `|${s.shipIn}|${s.stolen.map(sig).join('.')}` : ''}${level.tide ? `|${s.tq}` : ''}${s.master ? '|m' : ''}${turbo ? `|${s.turbo}` : ''}`;
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
      if (dfs(setTide(level, { ...cloneState(s), top: { wild: true } }, -1), w - 1)) return true;
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
    if (won(s, level)) return true;
  }
}

// Estrellas al ganar: cartas que quedan en el mazo contra las del mazo inicial (las de cartas regalo no cuentan:
// contarlas castigaba de más esos niveles). 3★ = te queda la mitad o más (los premios de racha suman),
// 2★ = al menos un cuarto, 1★ = menos. Comprar +5 cartas siempre deja 1★ (se decide en el juego).
export function starsFor(level, left) {
  // Niveles duros (level.stars = [para 2★, para 3★]): se miden contra lo que deja el camino acertado.
  if (level.stars) return left >= level.stars[1] ? 3 : left >= level.stars[0] ? 2 : 1;
  const total = level.stock.length;
  return left >= Math.ceil(total / 2) ? 3 : left >= Math.ceil(total / 4) ? 2 : 1;
}
