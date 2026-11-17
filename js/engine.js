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
//   bolt      rayo (1-3; 11 nov 2026): al jugarla, las `bolt` cartas más enterradas se van del tablero al final del mazo
//             de robo (ya no cuentan para ganar). Antes (10 nov) sacaba una libre encima de las demás (s.lift) y tapaba
//   (escudo: desde el 11 nov 2026 ya no es carta; es la ayuda Escudo, useShield: s.shield = la nave ya no roba)
//   cst       constelación (10 nov 2026): estrellita. Jugar todas las del nivel seguidas (sin robar ni jugar otra en
//             medio) da un premio (lo da el juego). s.cst = cuántas van (0 sin empezar, -1 perdida, level.cst lograda)
//   vine      enredadera (13 nov 2026): su lugar en el orden en que crece (level.vine = { n0, n }). Empiezan tapadas
//             las n0 primeras y cada VINE_EVERY acciones crece a la siguiente (el reloj de arena la detiene). No se
//             juega mientras la tenga (ver vineOn)
//   fire      fuego: al jugarla quema todas las enredaderas para siempre (s.burnt) y derrite el hielo
//   magnet    imán (13 nov 2026): al jugarlo, tu siguiente robo saca del mazo la carta que da la racha más larga (ver
//             magnetPick) y ese robo no corta la racha. Si ninguna sirve, robo normal y el imán sigue esperando.
//             s.magnet = está esperando el robo
//   rainbow   arcoíris: al jugarlo, las RAINBOW jugadas siguientes pueden ser ±2 (s.top.rb = las que quedan; robar
//             lo apaga porque el descarte cambia)
//   sleep     carta dormida (2-4): no se juega hasta que la racha llegue a `sleep`; entonces despierta y se queda
//             despierta (s.awake = ids)
//   twin      cartas gemelas (14 nov 2026): id de su pareja (atadas con un lazo). Al jugar una, la otra sale de donde
//             esté (aunque esté tapada) y cae al descarte encima: se sigue desde ella. Suma su punto de racha
//   wand      varita (15 nov 2026): al jugarla, puedes tocar una carta libre de número fijo y subirle o bajarle hasta
//             WAND_MAX (useWand; no es jugada ni robo). s.wand = está esperando; se pierde con tu siguiente jugada o
//             robo. s.shift[id] = lo que se le sumó a esa carta (rankOf lo aplica)
//   lasso     lazo (15 nov 2026): al jugarlo, escoges cualquier carta del tablero (libre, tapada o especial) y va directo
//             al descarte (pull: es una jugada de esa carta; las especiales hacen lo suyo y el descarte no cambia).
//             s.lasso = está esperando; se pierde con tu siguiente jugada o robo
//   scope     telescopio (14 nov 2026): al jugarlo se ven todas las cartas del tablero SCOPE_TURNS acciones (s.scope =
//             las que quedan; solo es para ver: no cambia qué se puede jugar). La ayuda Telescopio da SCOPE_HELP
//
// Astronauta (14 nov 2026): level.astro (o la ayuda, s.astroOn). Guarda una carta libre (hold: sale del tablero, no es
// jugada ni robo) y luego la mandas al descarte cuando conecte (astroSend: es una jugada). Después se va (s.astroGone).
// s.hold = id de la carta que guarda y s.holdRank su número. Mientras guarde una, no se gana.
//
// Mesas del nivel: level.rocks = { n } cinturón de asteroides (10 nov 2026, ver dropRocks).
// level.foe = { kind, hp, r } jefe de constelación (15 nov 2026): una criatura que juega contra ti (ver bossStep). Tiene
// vida (s.hp): cada carta que juegas con racha de 2 o más le quita 1; en 0 se va y regresa lo que tenía.
import { hash } from './rng.js';

export const mod13 = (n) => ((n % 13) + 13) % 13;
export const BURN = 3; // cartas que quema una bomba
export const TURBO = 3; // jugadas que valen doble tras un cohete turbo
export const CLOCK_TURNS = 3; // turnos que congela el reloj de arena

// Una acción (jugar o robar) avanza el reloj de las cuentas (bomba, cometa, carta viva), salvo con el reloj de arena.
function tick(s) {
  if (s.scope > 0) s.scope--;
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
// Láser (10 nov 2026): rompe todas las piedras de los asteroides.
export const useLaser = (s0) => ({ ...cloneState(s0), rock: {} });
// Ayuda Escudo: la nave ladrona ya no se lleva nada en lo que queda del nivel.
export const useShield = (s0) => ({ ...cloneState(s0), shield: true });
// Ayuda imán (13 nov 2026): lo mismo que jugar la carta imán.
export const useMagnet = (s0) => ({ ...cloneState(s0), magnet: true });
// Ayuda Varita (15 nov 2026): como jugar la carta varita: tocas una carta libre y le cambias el número.
export const useWandHelp = (s0) => ({ ...cloneState(s0), wand: true });
// Telescopio (14 nov 2026): la carta deja ver todo SCOPE_TURNS acciones; la ayuda, SCOPE_HELP.
export const SCOPE_TURNS = 3, SCOPE_HELP = 5;
export const useScope = (s0) => ({ ...cloneState(s0), scope: Math.max(s0.scope || 0, SCOPE_HELP) });
// Ayuda Astronauta (14 nov 2026): llega al nivel para guardarte una carta.
export const useAstro = (s0) => ({ ...cloneState(s0), astroOn: true, astroGone: false });

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
    // Asteroides: robos desde la última caída y piedras en el tablero (id -> jugadas que les quedan).
    ...(level.rocks && { rq: 0, rock: {} }),
    // Jefe de constelación: su vida y lo que tiene agarrado (ver bossStep).
    ...(level.foe && { hp: level.foe.hp, ash: [], melt: [], ink: [], tickle: 0, belly: [], ontop: {}, under: {}, zap: [], zd: 0, zt: 0 }),
    ...extra,
  };
}

// (Partidas guardadas antes del boleto partido no traen cut.)
export const cloneState = (s) => ({ ...s, rem: s.rem.slice(), stock: s.stock.slice(), boom: s.boom.slice(), cut: (s.cut || []).slice(), ...(s.awake && { awake: s.awake.slice() }), ...(s.open && { open: s.open.slice() }), ...(s.lift && { lift: s.lift.slice() }), ...(s.rock && { rock: { ...s.rock } }), ...(s.scrGone && { scrGone: s.scrGone.slice() }), ...(s.shift && { shift: { ...s.shift } }), ...(s.ash && { ash: s.ash.slice(), melt: (s.melt || []).slice(), ink: (s.ink || []).map((t) => ({ ...t, ids: t.ids.slice() })), belly: s.belly.map((b) => ({ ...b })), ontop: { ...s.ontop }, under: { ...s.under }, zap: (s.zap || []).slice() }), ...(s.suit && { suit: { ...s.suit } }) });

// Mitad del boleto partido que ya se jugó (0 = está entero, 1 = la de arriba, 2 = la de abajo).
export const cutOf = (c, s) => (c.half != null && s.cut?.[c.id]) || 0;

// Boleto triple (13 nov 2026, pedido del usuario): 3 talones, arriba c.rank, en medio c.tri[0] y abajo c.tri[1]. Se
// arranca el de una punta (arriba o abajo) cuando conecta; el de en medio solo cuando ya quedó de punta (se fue alguno
// de los otros). Se queda en el tablero (y sigue tapando) hasta el último. s.cut[id] = talones ya jugados (bits:
// 1 arriba, 2 en medio, 4 abajo).
export const TRI_ALL = 7;
export const triOf = (c, s) => (c.tri && s.cut?.[c.id]) || 0;
export const triRank = (c, k) => (k === 0 ? c.rank : c.tri[k - 1]);
// Talones que se pueden arrancar ahora (0 arriba, 1 en medio, 2 abajo).
export const triEnds = (c, s) => {
  const m = triOf(c, s), out = [];
  if (!(m & 1)) out.push(0);
  if (!(m & 4)) out.push(2);
  if (!(m & 2) && m & 5) out.push(1);
  return out;
};
// El talón que se jugaría: el que tocó el jugador (want) si conecta; si no, el primero que conecte. null = ninguno.
export const triPick = (c, s, want = null) => {
  const ok = triEnds(c, s).filter((k) => follows(s.top, triRank(c, k)));
  return ok.includes(want) ? want : ok.length ? ok[0] : null;
};

// Mesa que se voltea (13 nov 2026, pedido del usuario): columnas como la gravedad; cada FLIP_EVERY jugadas o robos da
// media vuelta y se juega la otra punta (a cada carta la tapa la de encima: c.flipBy). El reloj de arena la detiene.
// Raspadita (13 nov 2026, pedido del usuario): su número no se ve; cada carta pegada a ella (c.scr) que juegas le abre
// una de sus SCR_WIN ventanitas. Si la juegas antes de verla toda, da monedas: entre más ventanitas cerradas, más
// (SCR_PAY). Si la tocas y no conecta (sin verla toda), cuenta como un robo: se corta la racha (miss).
// 14 nov 2026 (el usuario): al fallarle además se destapa (s.scrGone) y ya no da monedas; no se deshace.
export const SCR_WIN = 4;
export const SCR_PAY = [0, 12, 35, 70];
// Ventanitas abiertas: en proporción a las pegadas que ya jugaste (con todas, se ve completa).
export const scrOpen = (c, s) => (c.scr && !s.scrGone?.includes(c.id) ? Math.floor((SCR_WIN * c.scr.filter((j) => s.rem[j]).length) / c.scr.length) : SCR_WIN);
export const scrPay = (c, s) => SCR_PAY[Math.min(3, SCR_WIN - scrOpen(c, s))];
export function miss(level, s0, id) {
  const s = cloneState(s0);
  if (id != null) s.scrGone = [...(s.scrGone || []), id];
  s.streak = 0;
  s.turbo = 0;
  tick(s);
  return { s, ev: { t: 'miss' } };
}

export const FLIP_EVERY = 5;
export const flipped = (level, s) => !!level?.flip && Math.floor(s.actions / FLIP_EVERY) % 2 === 1;
export const flipLeft = (s) => FLIP_EVERY - (s.actions % FLIP_EVERY);

// Agujero negro (8 nov 2026): cada HOLE_EVERY jugadas o robos se traga sus cartas y las escupe con los números
// revueltos (cada una toma el de la siguiente del giro). El reloj de arena lo detiene (las acciones no avanzan).
export const HOLE_EVERY = 4;
export const holeTurn = (s) => Math.floor(s.actions / HOLE_EVERY);
export const holeLeft = (s) => HOLE_EVERY - (s.actions % HOLE_EVERY);
// ¿Se la tragó en la vuelta t (cambió de número)?
export const holeTook = (c, t) => !!c.ring && t > 0 && c.ring[t % c.ring.length] !== c.ring[(t - 1) % c.ring.length];

// Número que muestra ahora una carta (la carta viva cambia con las acciones; del boleto partido, la mitad que queda;
// la del agujero negro, la que le toca en el giro).
export const rankOf = (c, s) => (s.shift?.[c.id] ? mod13(rank0(c, s) + s.shift[c.id]) : rank0(c, s));
const rank0 = (c, s) => (c.ring ? c.ring[holeTurn(s) % c.ring.length] : c.live ? mod13(c.rank + c.live * s.actions) : cutOf(c, s) === 1 ? c.half : c.tri && triOf(c, s) & 1 ? triRank(c, triEnds(c, s)[0] ?? 0) : c.rank);

// ¿Vale el rango r sobre el descarte? A y K se conectan. Una flecha en el descarte obliga a una dirección.
// Una carta doble en el descarte abre dos caminos (vale seguir desde cualquiera de sus dos números).
const near = (a, b) => {
  const d = Math.abs(a - b);
  return d === 1 || d === 12;
};
// Arcoíris: con top.rb > 0 también vale saltar dos (±2; A y Q, 2 y K también se conectan).
const near2 = (a, b) => {
  const d = Math.abs(a - b);
  return d === 2 || d === 11;
};
export function follows(top, r) {
  if (!top || r == null) return false;
  if (top.wild) return true;
  if (top.arrow) return r === mod13(top.rank + top.arrow);
  if (top.rb > 0 && (near2(top.rank, r) || (top.alt != null && near2(top.alt, r)))) return true;
  return near(top.rank, r) || (top.alt != null && near(top.alt, r));
}
export const RAINBOW = 3;
// Carta dormida: ¿sigue dormida? Cuántas le faltan (con la racha de ahora).
export const asleep = (c, s) => !!c.sleep && !s.awake?.includes(c.id);
export const sleepLeft = (c, s) => (asleep(c, s) ? Math.max(0, c.sleep - s.streak) : 0);
// Despierta las que ya alcanzó la racha (y se quedan despiertas).
function wakeUp(level, s) {
  for (const c of level.cards) if (c.sleep && !s.rem[c.id] && s.streak >= c.sleep && !s.awake?.includes(c.id)) s.awake = [...(s.awake || []), c.id];
}
// Imán (13 nov 2026, pedido del usuario: que mire hacia adelante): de las cartas del mazo que dejan jugar algo, la que
// da la racha más larga sin robar (empate: la que deja jugar más ahorita; luego, la de más arriba). Devuelve su lugar en
// el mazo y la primera carta del tablero de esa racha (la que conviene jugar), o null si ninguna sirve.
const MAGNET_LOOK = 60; // jugadas que prueba por cada carta (para que el solucionador no se alente)
function longestRun(level, s, budget) {
  let best = 0, first = null;
  const go = (st, depth, root) => {
    if (depth > best) (best = depth), (first = root);
    for (const c of legal(level, st)) {
      if (budget.n-- <= 0) return;
      go(play(level, st, c.id).s, depth + 1, root ?? c.id);
    }
  };
  go(s, 0, null);
  return { run: best, first };
}
function magnetPick(level, s) {
  let pick = null;
  s.stock.forEach((x, i) => {
    const t = { ...s, top: x, stock: s.stock.filter((_, j) => j !== i), magnet: false };
    const now = legal(level, t).length;
    if (!now) return;
    const { run, first } = longestRun(level, t, { n: MAGNET_LOOK });
    if (!pick || run > pick.run || (run === pick.run && now > pick.now)) pick = { i, aim: first, run, now };
  });
  return pick;
}

// Tramos de la nebulosa ya vaciados.
export const nebOut = (level, s) => (level.neb ? level.neb.reduce((n, t) => n + t.every((j) => playedOut(s, j)), 0) : 0);
// Puertas (9 nov 2026): pilas chicas a la orilla del tablero, cada una tras su puerta (level.doors[d] = { n, prize,
// coins? }). Hay menos llaves que puertas: cada carta llave da una llave y el jugador escoge qué puerta abrir. Al abrirse
// su premio se activa (moneda, cometa o cohete) y sus cartas salen al tablero y cuentan para ganar. Si nunca la abre,
// sus cartas no cuentan. La llave maestra no las abre (abrir es decisión del jugador).
export const doorOpen = (level, d, s) => !!s.open?.[d];
// ¿Cuenta para ganar? Las cartas tras una puerta cerrada no.
export const counts = (level, c, s) => c.door == null || doorOpen(level, c.door, s);
// El rayo de antes (s.lift, partidas guardadas del 10 nov) sacaba una carta de abajo: queda libre aunque sigan ahí.
// Ballena: la carta que escupió va encima de otra (s.ontop[id] = la de abajo, s.under al revés): ya no la tapa lo de
// su lugar de antes, ni ella tapa lo de ahí; la de abajo queda tapada mientras la escupida siga.
const moved = (s, j) => s.ontop?.[j] != null;
const topped = (c, s) => s.under?.[c.id] != null && !s.rem[s.under[c.id]];
export const isFree = (c, s, level) => (moved(s, c.id) || (flipped(level, s) ? c.flipBy : c.coveredBy).every((j) => s.rem[j] || moved(s, j)) || !!s.lift?.includes(c.id)) && !topped(c, s) && (!c.neb || nebOut(level, s) >= c.neb) && (c.door == null || doorOpen(level, c.door, s));
// Jugada de verdad: fuera del tablero y no en la panza de la Ballena (15 nov 2026, el usuario: se comió la llave y el
// candado se abrió). Lo que se abre al jugar una carta (candado, cortina, nebulosa) usa esto y no s.rem.
const playedOut = (s, j) => !!s.rem[j] && !s.belly?.some((b) => b.id === j);
export const curtainOpen = (level, c, s) => c.curtain == null || !!s.master || playedOut(s, level.curtains[c.curtain]);
export const lockOpen = (level, c, s) => c.lock == null || !!s.master || playedOut(s, level.keys[c.lock]);
// Fénix: el fuego que le cae a una carta le quita su hielo o su enredadera (s.melt).
export const iceLeft = (c, s) => (c.ice && !s.burnt && !s.melt?.includes(c.id) ? Math.max(0, c.ice - s.plays) : 0);
// Enredadera (13 nov 2026): cuántas tiene ya y si esta carta está tapada. El fuego (s.burnt) las quema todas.
export const VINE_EVERY = 5;
export const vineCount = (level, s) => (!level.vine || s.burnt ? 0 : Math.min(level.vine.n, level.vine.n0 + Math.floor(s.actions / VINE_EVERY)));
export const vineOn = (level, c, s) => c.vine != null && c.vine < vineCount(level, s) && !s.melt?.includes(c.id);
// Acciones que faltan para que crezca (null si ya no crece).
export const vineLeft = (level, s) => (vineCount(level, s) && vineCount(level, s) < level.vine.n ? VINE_EVERY - (s.actions % VINE_EVERY) : null);
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
export const isOpen = (level, c, s) => faceUp(level, c, s) && lockOpen(level, c, s) && !iceLeft(c, s) && ghostShown(c, s) && !underWater(c, s) && beltShown(level, c, s) && !rockOn(c, s) && !vineOn(level, c, s) && !asleep(c, s) && !inked(c, s);
// Kraken: carta con tinta (no se juega hasta que quede limpia del todo).
// Medusa (16 nov 2026): una carta con chispas solo entra sobre una de su mismo color (rojas: corazones y diamantes, palos
// 1 y 2). El comodín y lo que no tiene palo la dejan entrar.
export const redSuit = (k) => k === 1 || k === 2;
export const zapBad = (c, s) => !!s.zap?.includes(c.id) && !!s.top && !s.top.wild && s.top.suit != null && redSuit(s.top.suit) !== redSuit(s.suit?.[c.id] ?? c.suit);
export const inked = (c, s) => !!s.ink?.some((t) => t.ids.includes(c.id));
// Cinturón de asteroides (10 nov 2026, pedido del usuario): cada ROCK_EVERY robos caen level.rocks.n piedras (2 o 3)
// sobre cartas libres; cada una la tapa ROCK_PLAYS turnos (jugadas o robos; 11 nov 2026, antes solo jugadas) o hasta usar la ayuda Láser. Como la marea,
// tiene límite: nunca más de ROCK_MAX piedras a la vez y siempre deja ROCK_KEEP cartas libres sin piedra. El reloj de
// arena detiene la cuenta de robos. Dónde caen sale del estado (determinista: juego, solucionador y bot coinciden).
export const ROCK_EVERY = 4, ROCK_PLAYS = 3, ROCK_MAX = 3, ROCK_KEEP = 1;
export const rockOn = (c, s) => !!s.rock?.[c.id];
export const rockLeft = (s) => ROCK_EVERY - ((s.rq || 0) % ROCK_EVERY);
function dropRocks(level, s, frozen) {
  if (!level.rocks || frozen) return [];
  s.rq = (s.rq || 0) + 1;
  if (s.rq < ROCK_EVERY) return [];
  s.rq = 0;
  const free = level.cards.filter((c) => faceUp(level, c, s) && !rockOn(c, s) && counts(level, c, s));
  const room = Math.min(level.rocks.n, ROCK_MAX - Object.keys(s.rock).length, free.length - ROCK_KEEP);
  if (room <= 0) return [];
  const ids = free.map((c) => [c.id, hash(level.g * 7919 + s.actions * 131 + c.id * 17)]).sort((a, b) => a[1] - b[1]).slice(0, room).map(([id]) => id);
  for (const id of ids) s.rock[id] = ROCK_PLAYS;
  return ids;
}
// Cada jugada le quita 1 a cada piedra; las que llegan a 0 se rompen.
function wearRocks(s) {
  if (!s.rock) return [];
  const out = [];
  for (const id of Object.keys(s.rock)) if (--s.rock[id] <= 0) (delete s.rock[id]), out.push(+id);
  return out;
}
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
  if (!isOpen(level, c, s) || zapBad(c, s)) return null;
  const r = rankOf(c, s);
  if (chamWild(c, s)) return r;
  if (c.tri) {
    const k = triPick(c, s, typeof low === 'number' ? low : null);
    return k == null ? null : triRank(c, k);
  }
  // Dominó: se entra por cualquiera de sus dos números (low = el de abajo, si los dos conectan).
  if (c.dom != null) return low && follows(s.top, c.dom) ? c.dom : follows(s.top, r) ? r : follows(s.top, c.dom) ? c.dom : null;
  const both = c.half != null && !cutOf(c, s);
  if (both && low && follows(s.top, c.half)) return c.half;
  if (follows(s.top, r)) return r;
  if (c.alt != null && follows(s.top, c.alt)) return c.alt;
  if (both && follows(s.top, c.half)) return c.half;
  return null;
}

// Lo que juega la solución de referencia con esta carta (npm test y refLeft): del boleto partido entero, la mitad de
// arriba; del boleto triple, arriba, luego abajo y al final en medio (low = el talón).
export const refStep = (c, s) => (c.half != null && !cutOf(c, s) ? { rank: c.rank } : c.tri ? { low: !triOf(c, s) ? 0 : triOf(c, s) === 1 ? 2 : 1 } : {});
export const refReady = (level, c, s, w = refStep(c, s)) => (w.rank != null ? playRank(level, c, s) === w.rank : w.low != null ? isOpen(level, c, s) && triPick(c, s, w.low) === w.low : playRank(level, c, s) != null);

export const legal = (level, s) => level.cards.filter((c) => playRank(level, c, s) != null);
export const won = (s, level) => s.hold == null && !s.belly?.length && s.rem.every((r, i) => r || (level?.cards[i].door != null && !s.open?.[level.cards[i].door]));

// ---------- Premios de racha ----------
// Racha 6: +1 carta útil al mazo · 13: un comodín al mazo · 18 y 23: +1 carta útil · 30: escoba (barre toda la capa
// del fondo del tablero, boca arriba o boca abajo; 13 nov 2026, antes en 20 y 30 se llevaba 1 y 2 de las más
// enterradas) · 31: +1 comodín al inventario · después, cada 3: +1 carta útil. Las cartas de premio entran en un lugar "al azar" del mazo, nunca entre las 3 primeras
// (determinista según el estado, para que juego, solucionador y bot coincidan).
// Los premios solo añaden cartas.
// step: cada cuántas cartas cuenta un paso (level.rewardStep): 1 normal, 2 = premios al doble de distancia
// (evento del mes), 0 = sin premios.
const REWARDS = { 6: 'card', 13: 'wild', 18: 'card', 23: 'card', 30: 'broom', 31: 'bank' };
export const BROOM = { broom: true };
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
  // Escoba: retira la capa del fondo (no cuentan como jugadas ni suman a la racha).
  if (BROOM[kind]) {
    const ids = deepLayer(level, s);
    for (const id of ids) s.rem[id] = true;
    if (level.cst && s.cst !== level.cst && ids.some((id) => level.cards[id].cst)) s.cst = -1;
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
function buried(level, s, n, ok = () => true) {
  const memo = new Map();
  const depth = (id) => {
    if (memo.has(id)) return memo.get(id);
    memo.set(id, 0);
    const d = level.cards[id].coveredBy.reduce((a, j) => (s.rem[j] ? a : a + 1 + depth(j)), 0);
    memo.set(id, d);
    return d;
  };
  return level.cards
    .filter((c) => !s.rem[c.id] && !special(c) && c.half == null && !c.tri && counts(level, c, s) && !isFree(c, s, level) && ok(c))
    .map((c) => [c.id, depth(c.id)])
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, n)
    .map(([id]) => id);
}

// Escoba (13 nov 2026, pedido del usuario): toda la capa del fondo que queda, las más tapadas (la z más baja), estén
// boca arriba o boca abajo. Sin las especiales, los boletos partidos, la banda, las puertas, el fuego (sin él las
// enredaderas no se quitarían) ni lo que la nebulosa aún esconde.
export function deepLayer(level, s) {
  const ok = level.cards.filter((c) => !s.rem[c.id] && !special(c) && c.half == null && !c.tri && c.belt == null && c.door == null && !c.fire && (!c.neb || nebOut(level, s) >= c.neb));
  if (!ok.length) return [];
  // En algunas formas la capa más baja ya está libre (no la tapa nada): cuenta la más baja de las que siguen tapadas.
  const hid = ok.filter((c) => !isFree(c, s, level));
  const z = Math.min(...(hid.length ? hid : ok).map((c) => c.z));
  return ok.filter((c) => c.z === z).map((c) => c.id);
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
export function play(level, s0, id, low = false, forced = false) {
  const c = level.cards[id];
  const r = forced ? rankOf(c, s0) : playRank(level, c, s0, low);
  const s = cloneState(s0);
  // Boleto entero: se parte y la otra mitad se queda en el tablero.
  const split = c.half != null && !cutOf(c, s0) ? (r === c.rank && !(low && r === c.half) ? 1 : 2) : 0;
  // Boleto triple: se arranca un talón; la carta sale del tablero con el último.
  const stub = c.tri ? triPick(c, s0, typeof low === 'number' ? low : null) : null;
  if (split) s.cut[id] = split;
  else if (stub != null) {
    s.cut[id] = triOf(c, s0) | (1 << stub);
    if (s.cut[id] === TRI_ALL) s.rem[id] = true;
  } else s.rem[id] = true;
  const tri = stub != null ? { stub, left: s.cut[id] !== TRI_ALL } : null;
  // La carta doble llega al descarte con sus dos números; la flecha, con su obligación.
  // Dominó: en el descarte se queda el otro número (por el que no entraste).
  const exit = c.dom != null ? (r === c.rank ? c.dom : c.rank) : null;
  const suit = s0.suit?.[id] ?? c.suit;
  s.top = chamWild(c, s0) ? { wild: true } : c.alt != null ? { rank: c.rank, alt: c.alt, suit } : exit != null ? { rank: exit, suit } : { rank: r, suit, ...(c.arrow && { arrow: c.arrow }) };
  // Fénix: una carta con ceniza que se juega ya no la trae.
  if (s.ash?.length) s.ash = s.ash.filter((j) => j !== id);
  // Medusa: jugarla la descarga.
  const zapOff = !!s0.zap?.includes(id);
  if (zapOff) s.zap = s.zap.filter((j) => j !== id);
  // Arcoíris: el descarte lleva las jugadas ±2 que quedan.
  const rb = c.rainbow ? RAINBOW : Math.max(0, (s0.top?.rb || 0) - 1);
  if (rb && !s.top.wild) s.top.rb = rb;
  // Imán: espera tu siguiente robo.
  if (c.magnet) s.magnet = true;
  // Varita y lazo: esperan a que escojas carta; si no, se pierden con esta jugada.
  s.wand = !!c.wand;
  s.lasso = !!c.lasso;
  s.plays++;
  tick(s);
  // Telescopio: se ven todas las cartas las siguientes SCOPE_TURNS acciones.
  if (c.scope) s.scope = Math.max(s.scope || 0, SCOPE_TURNS);
  s.streak++;
  // Carta llave: una llave más en la mano.
  if (c.doorKey) s.keys = (s.keys || 0) + 1;
  // Constelación: suma si es estrellita; cualquier otra carta a la mitad la apaga.
  const cst = cstStep(level, s, !!c.cst && !split && !tri?.left);
  const at = s.streak;
  // Turbo: esta jugada suma un punto más (y su premio, si toca).
  const boosted = s0.turbo > 0;
  if (boosted) s.streak++;
  s.turbo = c.turbo ? TURBO : boosted ? s0.turbo - 1 : 0;
  // Gemelas: la pareja sale de donde esté y cae al descarte encima (suma su punto; su premio va en wishes).
  const twin = c.twin != null && !s.rem[c.twin] && !split && !tri?.left ? c.twin : null;
  if (twin != null) {
    const t = level.cards[twin];
    s.rem[twin] = true;
    s.top = { rank: t.rank, suit: t.suit };
    s.plays++;
    s.streak++;
  }
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
  wakeUp(level, s);
  const rockOff = wearRocks(s);
  // Fuego: quema las enredaderas que hay (las que ya crecieron) y ya no crecen.
  const burnt = c.fire && !s0.burnt ? level.cards.filter((x) => !s.rem[x.id] && vineOn(level, x, s0)).map((x) => x.id) : null;
  if (c.fire) s.burnt = true;
  // Rayo: las cartas más enterradas (1-3) se van al final del mazo de robo (después de todo lo demás de la jugada).
  // Ni la carta llave de las puertas ni las de la constelación (se perderían).
  const bolted = c.bolt ? buried(level, s, c.bolt, (x) => x.curtain == null && x.door == null && !x.doorKey && !x.cst && !x.fire && x.vine == null && x.dom == null && !x.tri) : [];
  for (const b of bolted) {
    const x = level.cards[b];
    s.rem[b] = true;
    s.stock.push({ rank: rankOf(x, s), suit: x.suit, ...(x.alt != null && { alt: x.alt }), ...(x.arrow && { arrow: x.arrow }) });
  }
  const boss = bossStep(level, s0, s, true);
  return { s, ev: { t: 'play', id, rank: r, ...(boss && { boss }), packs, defused, reward, boost, boom, wished, wishes, gone, ...(c.turbo && { turbo: true }), ...(twin != null && { twin }), ...(split && { split }), ...(tri && { tri }), ...(exit != null && { exit }), ...(shipBack && { shipBack }), ...(c.doorKey && { key: true }), ...(cst && { cst }), ...(rockOff.length && { rockOff }), ...(bolted.length && { bolted }), ...(burnt && { burnt }), ...(zapOff && { zapOff }) } };
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
  wakeUp(level, s);
  return { s, ev: { t: 'door', d, prize, wishes, from: s0.streak } };
}

// ---------- Astronauta (14 nov 2026) ----------
// Está si el nivel lo trae o usaste la ayuda, y hasta que manda su carta. Guarda solo cartas libres de un número fijo
// (ni boletos, dominó, gemelas, cartas vivas, fantasmas, camaleón, agujero negro ni raspadita). Las de la enredadera sí,
// si todavía no las tapa (14 nov 2026, el usuario: «¿por qué no deja las otras?»); la de constelación también.
export const astroHere = (level, s) => !!(level.astro || s.astroOn) && !s.astroGone;
export const canHold = (level, c, s) => astroHere(level, s) && s.hold == null && c.rank != null && isOpen(level, c, s) && !special(c) && c.half == null && !c.tri && c.dom == null && c.twin == null && !c.live && !c.ghost && !c.cham && !c.ring && !c.scr && !c.doorKey && !c.coin;
// Guardar: la carta sale del tablero (destapa lo de abajo). No es jugada ni robo: no toca racha ni cuentas.
export function hold(level, s0, id) {
  const c = level.cards[id];
  if (!canHold(level, c, s0)) return null;
  const s = cloneState(s0);
  s.rem[id] = true;
  s.hold = id;
  s.holdRank = rankOf(c, s0);
  return { s, ev: { t: 'hold', id } };
}
// Mandarla al descarte cuando conecta: es una jugada normal de esa carta (vuelve un instante a su lugar, que ya está
// libre) y el astronauta se va.
export const canSend = (s) => s.hold != null && follows(s.top, s.holdRank);
export function astroSend(level, s0) {
  if (!canSend(s0)) return null;
  const id = s0.hold, s1 = { ...cloneState(s0), hold: null, holdRank: null, astroGone: true };
  s1.rem[id] = false;
  // En las manos de Tito la enredadera ya no la alcanza: se juega como si no tuviera.
  const lv = level.cards[id].vine == null ? level : { ...level, cards: level.cards.map((x) => (x.id === id ? { ...x, vine: undefined } : x)) };
  const { s, ev } = play(lv, s1, id);
  return { s, ev: { ...ev, t: 'send' } };
}

// ---------- Jefes de constelación (15 nov 2026, pedido del usuario) ----------
// Cada uno ataca cada BOSS_EVERY acciones (el reloj de arena lo detiene: las acciones no avanzan) y avisa una acción
// antes (lo dibuja el juego: tiembla o se agita; no hay texto ni cuentas en el tablero). r = la vuelta (cada 4
// constelaciones vuelve el mismo jefe y es más fuerte).
//   fenix   no se ve (15 nov 2026): cae fuego en 1 a todas las cartas libres (s.ash) y se queda hasta jugarlas. El
//           fuego se mueve y deja ver el número por partes (lo dibuja el juego; con racha de 5, 10… baja un turno (fireLow) y
//           Ver cartas lo apaga esos segundos). Si tocas una que no conecta, cuenta como robo (blind).
//           También cae en libres con hielo o enredadera: se los quita (s.melt)
//   ilus    el Ilusionista cambia el número de todas las cartas boca arriba (s.shift, como la varita)
//   kraken  no se ve (15 nov 2026, pedido del usuario: antes eran tentáculos): salpica tinta en 2 a 4 cartas libres
//           juntas (s.ink, una mancha por ataque: no se juegan hasta que queden limpias del todo). Con KRAKEN_TICKLE
//           jugadas seguidas se lava la mancha más vieja (s.tickle; robar lo reinicia). Si pasan KRAKEN_SLAM robos con
//           tinta: manotazo, el 90% de las cartas sin tinta cambian de lugar (sus números y palos se revuelven: s.shift
//           y s.suit), con el golpe se limpia la mitad de las manchadas (al menos una; out.unink) y la cuenta de robos
//           vuelve a 0. Si todas las libres quedan con tinta (nada que jugar), la más vieja se limpia sola (bossStep)
//   whale   no se ve (15 nov 2026, pedido del usuario): jala 1-2 cartas volteadas (luego 2 y 2-3; siempre al menos
//           1, aunque sea la última; cualquier volteada menos las que ella escupió encima de otra) a su panza (s.belly; no cuentan como jugadas)
//           y WHALE_SPIT acciones después las escupe boca arriba encima de otras (s.ontop / s.under): la de abajo queda
//           tapada. Para ganar no puede quedar nada en su panza. Si ya no hay mazo ni nada que jugar, escupe todo ya
//   medusa  Medusa de plasma, no se ve (16 nov 2026, pedido del usuario): pone chispas en cartas libres (s.zap): 2-3 en las
//           dos primeras vueltas y 3 desde la 3.ª, hasta medusaMax a la vez. Una carta con chispas solo entra sobre una
//           de su mismo color (zapBad); jugarla la descarga. Con MEDUSA_CALM jugadas seguidas se apaga la más vieja
//           (s.zt; robar lo reinicia; como la limpieza del Kraken). Cada MEDUSA_HOP robos con chispas en la mesa (s.zd),
//           la más vieja se pasa a otra libre (se mueve, no se multiplica: el usuario quiso que castigue poco). Sin mazo
//           ni nada que jugar, se apagan todas
// Cada cuántas acciones ataca, por vuelta (la primera vez más espaciado; luego más seguido).
export const BOSS_EVERY = { fenix: [4, 4, 4, 3], ilus: [6, 5, 4, 3], medusa: [5, 5, 5, 4], kraken: [7, 6, 5, 4], whale: [5, 4, 4, 4] };
export const KRAKEN_TICKLE = 3, KRAKEN_SLAM = 3, WHALE_SPIT = 3, MEDUSA_HOP = 3, MEDUSA_CALM = 4;
// Medusa: cuántas chispas puede haber a la vez, por vuelta.
export const MEDUSA_MAX = [3, 3, 4, 4];
export const medusaMax = (r) => MEDUSA_MAX[Math.min(3, r)];
export const bossAlive = (level, s) => !!level.foe && s.hp > 0;
// Fénix: con racha de 5, 10, 15… el fuego baja un turno (se ve el número) y luego vuelve.
export const fireLow = (s) => s.streak > 0 && s.streak % 5 === 0;
export const bossEvery = (level) => (level.foe ? BOSS_EVERY[level.foe.kind][Math.min(3, level.foe.r)] : 0);
// ¿Ataca en la acción que sigue? (para que el juego avise: tiembla o se agita)
// El primer ataque llega BOSS_FIRST acciones antes de la cuenta (para que se vea pronto; luego cada bossEvery).
export const BOSS_FIRST = 2;
export const bossSoon = (level, s) => bossAlive(level, s) && !(s.freeze > 0) && (s.actions + 1 + BOSS_FIRST) % bossEvery(level) === 0;
const bossHash = (level, s, k = 0) => hash(level.g * 977 + s.actions * 131 + k * 31 + s.rem.reduce((a, b, i) => a + (b ? i + 1 : 0), 0));
// Ballena: lo que puede jalar (cualquier volteada, tenga la mecánica que tenga). isOpen ya sabe si tiene una escupida
// encima (s.under se queda con la de arriba aunque ya se haya jugado: no sirve para filtrar).
const whaleCan = (level, s) => level.cards.filter((c) => isOpen(level, c, s));
// Las que sí puede jalar: no las que ella misma escupió encima de otra (15 nov 2026, el usuario). El juego hace temblar
// estas antes de que jale.
export const whaleEatable = (level, s) => whaleCan(level, s).filter((c) => s.ontop[c.id] == null);
// Escupe lo que lleva WHALE_SPIT acciones en su panza (all: todo) encima de una volteada; si no hay, a su lugar.
function whaleSpit(level, s, all = false) {
  const spit = [];
  s.belly = s.belly.filter((b) => {
    if (!all && s.actions - b.at < WHALE_SPIT) return true;
    const free = whaleCan(level, s).filter((c) => c.id !== b.id);
    const t = free.length ? free[bossHash(level, s, b.id) % free.length] : null;
    s.rem[b.id] = false;
    if (t) (s.ontop[b.id] = t.id), (s.under[t.id] = b.id);
    spit.push([b.id, t ? t.id : null]);
    return false;
  });
  return spit;
}
// Cartas de número sin otra mecánica que hoy se pueden jugar (lo que los jefes tocan).
const bossKind = (c) => c.rank != null && !special(c) && c.half == null && !c.tri && c.dom == null && c.alt == null && !c.ring;
// Lo que tapan el fuego y la tinta (15 nov 2026, el usuario: «que todas las que tienen dinámica se comporten como una
// carta»): cualquier carta del tablero que no sea bomba, cometa ni paquete. Lo que cambia números (Ilusionista, manotazo)
// sigue solo con las de un número (bossKind).
const bossCover = (c) => c.rank != null && !special(c);
// Medusa: solo cartas de un número con palo (el camaleón ya entra sobre cualquiera).
const zapKind = (c) => bossKind(c) && !c.cham && c.suit != null;
export const medusaCan = (level, s) => level.cards.filter((c) => zapKind(c) && isOpen(level, c, s) && !s.zap?.includes(c.id));
// Kraken (15 nov 2026, el usuario se quedó atorado): si ya no queda ninguna carta para jugar porque todas las libres
// tienen tinta, la mancha más vieja se limpia sola (sin esto solo quedaba robar hasta perder).
function bossStep(level, s0, s, played) {
  const out = bossAct(level, s0, s, played);
  // Ballena: sin mazo y sin nada que jugar ya no pasarían acciones para que escupa: escupe todo ya.
  if (level.foe?.kind === 'whale' && s.belly?.length && !s.stock.length && !level.cards.some((c) => isOpen(level, c, s))) {
    const r = out || {};
    r.spit = [...(r.spit || []), ...whaleSpit(level, s, true)];
    return r;
  }
  // Medusa: sin mazo y sin nada que jugar por las chispas, se apagan todas (si no, solo quedaba perder).
  if (level.foe?.kind === 'medusa' && s.hp > 0 && s.zap?.length && !s.stock.length && !legal(level, s).length) {
    const r = out || {};
    r.unzap = s.zap;
    s.zap = [];
    s.zd = 0;
    s.zt = 0;
    return r;
  }
  if (level.foe?.kind !== 'kraken' || s.hp <= 0 || !s.ink?.length || out?.wash || level.cards.some((c) => isOpen(level, c, s))) return out;
  const r = out || {};
  r.wash = s.ink.shift().ids;
  s.tickle = 0;
  return r;
}
function bossAct(level, s0, s, played) {
  if (!level.foe || s0.hp <= 0) return null;
  const B = level.foe, out = {};
  if (played && s.streak >= 2) {
    s.hp--;
    out.hit = 1;
  }
  if (B.kind === 'kraken') s.ink ||= [];
  if (B.kind === 'medusa') (s.zap ||= []), (s.zd ||= 0), (s.zt ||= 0);
  if (B.kind === 'kraken' && s.ink.length) {
    if (played) {
      if (++s.tickle >= KRAKEN_TICKLE) {
        out.wash = s.ink.shift().ids;
        s.tickle = 0;
      }
    } else {
      s.tickle = 0;
      s.ink.forEach((t) => t.d++);
      if (s.ink.some((t) => t.d >= KRAKEN_SLAM)) {
        // Manotazo: revuelve el 90% de las que quedan en el tablero (sin tinta) y la cuenta vuelve a empezar.
        s.ink.forEach((t) => (t.d = 0));
        const ids = level.cards.filter((c) => !s.rem[c.id] && c.rank != null && !special(c) && c.half == null && !c.tri && c.dom == null && c.alt == null && !c.ring && !inked(c, s)).map((c) => c.id);
        const r0 = bossHash(level, s, 7), stay = new Set(ids.slice().sort((x, y) => hash(x * 37 + r0) - hash(y * 37 + r0)).slice(0, Math.max(1, Math.round(ids.length * 0.1))));
        const mov = ids.filter((j) => !stay.has(j));
        if (mov.length > 1) {
          const face = mov.map((j) => [rankOf(level.cards[j], s), s.suit?.[j] ?? level.cards[j].suit]);
          s.shift ||= {};
          s.suit ||= {};
          mov.forEach((j, i) => {
            const [rk, su] = face[(i + 1 + (r0 % (mov.length - 1))) % mov.length];
            s.shift[j] = mod13((s.shift[j] || 0) + rk - rankOf(level.cards[j], s));
            s.suit[j] = su;
          });
          out.slam = mov;
        }
        // Con el golpe se cae la tinta de la mitad de las cartas manchadas (al menos una; esas no se revolvieron).
        const all = s.ink.flatMap((t) => t.ids), off = new Set(all.slice().sort((x, y) => hash(x * 41 + r0) - hash(y * 41 + r0)).slice(0, Math.ceil(all.length / 2)));
        s.ink = s.ink.map((t) => ({ ...t, ids: t.ids.filter((i) => !off.has(i)) })).filter((t) => t.ids.length);
        out.unink = [...off];
      }
    }
  }
  // Medusa: con MEDUSA_CALM jugadas seguidas se apaga la más vieja; robar reinicia esa cuenta.
  if (B.kind === 'medusa' && s.zap.length && s.hp > 0) {
    if (!played) s.zt = 0;
    else if (++s.zt >= MEDUSA_CALM) {
      s.zt = 0;
      out.calm = s.zap.shift();
    }
  }
  // Medusa: cada MEDUSA_HOP robos con chispas en la mesa, la más vieja se pasa a otra libre.
  if (B.kind === 'medusa' && !played && s.zap.length && s.hp > 0 && ++s.zd >= MEDUSA_HOP) {
    s.zd = 0;
    const to = level.cards.filter((c) => zapKind(c) && isOpen(level, c, s) && !s.zap.includes(c.id));
    if (to.length) {
      const from = s.zap.shift(), t = to[bossHash(level, s, 5) % to.length].id;
      s.zap.push(t);
      out.hop = [from, t];
    }
  }
  if (s.hp <= 0) {
    // Se va: la ceniza se quita, la tinta se lava, las chispas se apagan y la ballena regresa a su lugar lo que se tragó.
    s.ash = [];
    s.ink = [];
    if (s.zap?.length) (out.unzap = s.zap), (s.zap = []);
    for (const b of s.belly) s.rem[b.id] = false;
    s.belly = [];
    out.gone = true;
    return out;
  }
  const every = bossEvery(level);
  if (B.kind === 'whale') {
    // Primero escupe lo que ya le toca.
    const spit = whaleSpit(level, s);
    if (spit.length) out.spit = spit;
  }
  if (s.actions === s0.actions || (s.actions + BOSS_FIRST) % every) return Object.keys(out).length ? out : null;
  const can = level.cards.filter((c) => bossCover(c) && isOpen(level, c, s));
  const h = bossHash(level, s);
  if (B.kind === 'fenix') {
    // También le puede caer a una libre con hielo o enredadera: se los quita (s.melt) y queda con fuego.
    const meltable = (c) => !s.rem[c.id] && (c.ice || c.vine != null) && !s.melt.includes(c.id) && !isOpen(level, c, s) && isOpen(level, c, { ...s, melt: [...s.melt, c.id] });
    const fresh = [...can, ...level.cards.filter((c) => bossCover(c) && meltable(c))].filter((c) => !s.ash.includes(c.id));
    if (fresh.length) {
      const k = Math.min(fresh.length, Math.max(1 + B.r, 1 + (h % fresh.length)));
      const pick = fresh.map((c) => c.id).sort((a, b) => hash(a * 53 + h) - hash(b * 53 + h)).slice(0, k);
      const melt = pick.filter((id) => meltable(level.cards[id]));
      s.ash.push(...pick);
      s.melt.push(...melt);
      out.ash = pick;
      if (melt.length) out.melt = melt;
    }
  } else if (B.kind === 'ilus') {
    const one = can.filter(bossKind);
    if (one.length) {
      s.shift ||= {};
      out.ilus = one.map((c) => {
        // Truco chico: cada una sube o baja 1 o 2 (al azar del todo rompía todas las cadenas: el bot pasaba de 98% a 0%).
        const k = hash(c.id * 61 + h) % 4, d = [1, 2, -1, -2][k];
        s.shift[c.id] = mod13((s.shift[c.id] || 0) + d);
        return c.id;
      });
    }
  } else if (B.kind === 'medusa') {
    // 2-3 nuevas en las dos primeras vueltas y 3 desde la 3.ª, sin pasar del tope (medusaMax).
    const free = can.filter((c) => zapKind(c) && !s.zap.includes(c.id));
    const n = Math.min(free.length, medusaMax(B.r) - s.zap.length, B.r >= 2 ? 3 : 2 + ((h >>> 2) % 2));
    if (n > 0) {
      const pick = free.map((c) => c.id).sort((a, b) => hash(a * 59 + h) - hash(b * 59 + h)).slice(0, n);
      s.zap.push(...pick);
      s.zd = 0;
      out.zap = pick;
    }
  } else if (B.kind === 'kraken') {
    const max = 1 + Math.min(2, B.r);
    const free = can.filter((c) => !inked(c, s));
    if (s.ink.length < max && free.length > 1) {
      const a = free[h % free.length];
      // Las de junto a la primera; si no hay, las libres más cercanas (2 o 3; desde la segunda vuelta, 3 o 4).
      const dist = (c) => Math.hypot(a.x - c.x, a.y - c.y) + (c.group === a.group ? 0 : 50);
      const ids = [a.id, ...free.filter((c) => c.id !== a.id).sort((x, y) => dist(x) - dist(y) || x.id - y.id).map((c) => c.id)].slice(0, 2 + ((h >>> 3) % 2) + Math.min(1, B.r));
      // Nunca mancha todas las libres: siempre deja al menos una.
      if (ids.length < free.length) {
        s.ink.push({ ids, d: 0 });
        s.tickle = 0;
        out.ink = ids;
      }
    }
  } else if (B.kind === 'whale') {
    // Cualquier volteada menos las que ella misma escupió encima de otra (whaleEatable). 1-2 la primera vez; luego 2 y
    // 2-3 (>>>: el hash pasa de 2^31).
    // Si no hay ninguna no jala (y el juego no las hizo temblar: solo tiemblan las de whaleEatable). Desde la vuelta 4
    // jala 2-3 como en la 3 (con 3-4 el bot casual ganaba el 1600 el 1%).
    const free = whaleEatable(level, s);
    const n = Math.min(free.length, [1, 2, 2, 2][Math.min(3, B.r)] + (B.r === 1 ? 0 : (h >>> 2) % 2));
    if (n > 0) {
      const eat = free.map((c) => c.id).sort((a, b) => hash(a * 71 + h) - hash(b * 71 + h)).slice(0, n);
      for (const id of eat) {
        s.rem[id] = true;
        if (s.ontop[id] != null) delete s.under[s.ontop[id]], delete s.ontop[id];
        s.belly.push({ id, at: s.actions });
      }
      out.eat = eat;
    }
  }
  return Object.keys(out).length ? out : null;
}
// Fénix: tocaste una carta con fuego que no conecta. Cuenta como robo: se corta la racha y pasa una acción.
export function blind(level, s0, id) {
  const s = cloneState(s0);
  s.streak = 0;
  s.turbo = 0;
  s.wand = s.lasso = false;
  tick(s);
  const boss = bossStep(level, s0, s, false);
  return { s, ev: { t: 'blind', id, ...(boss && { boss }) } };
}

// ---------- Varita (15 nov 2026) ----------
// Después de jugarla, una carta libre de número fijo sube o baja hasta WAND_MAX (d = −3…3, sin 0). No es jugada ni
// robo: no mueve la racha ni las cuentas.
export const WAND_MAX = 3;
const plain = (c) => c.rank != null && !special(c) && c.half == null && !c.tri && c.dom == null && c.alt == null && c.twin == null && !c.live && !c.ghost && !c.cham && !c.ring && !c.scr;
export const canWand = (level, c, s) => !!s.wand && !s.rem[c.id] && plain(c) && isOpen(level, c, s);
export function useWand(level, s0, id, d) {
  const c = level.cards[id];
  if (!canWand(level, c, s0) || !d || Math.abs(d) > WAND_MAX) return null;
  const s = { ...cloneState(s0), wand: false, shift: { ...s0.shift, [id]: mod13((s0.shift?.[id] || 0) + d) } };
  return { s, ev: { t: 'wand', id, d, from: rankOf(c, s0), to: rankOf(c, s) } };
}

// ---------- Lazo (15 nov 2026) ----------
// Después de jugarlo, cualquier carta que siga en el tablero: libre, tapada o especial (no las de una puerta cerrada,
// lo que la nebulosa o la banda esconden, ni boletos o dominó, que tienen dos números).
export const canLasso = (level, c, s) => !!s.lasso && !s.rem[c.id] && (c.door == null || doorOpen(level, c.door, s)) && (!c.neb || nebOut(level, s) >= c.neb) && beltShown(level, c, s) && c.half == null && !c.tri && c.dom == null;
export function pull(level, s0, id) {
  const c = level.cards[id];
  if (!canLasso(level, c, s0)) return null;
  // Especial: hace lo suyo (regalo suelta sus cartas, bomba se desactiva, cometa suma a la racha); el descarte no cambia.
  if (special(c)) {
    const s = { ...cloneState(s0), lasso: false }, out = { packs: [], defused: [], wished: [] }, wishes = [];
    s.rem[id] = true;
    if (c.pack) {
      s.stock.push(...c.pack.map((x) => ({ ...x })));
      out.packs.push(id);
    } else if (c.comet) {
      const from = s.streak;
      s.streak += cometWish(level, s);
      out.wished.push(id);
      for (let k = from + 1; k <= s.streak; k++) {
        const w = applyReward(level, s, k);
        if (w) wishes.push({ ...w, at: k });
      }
    } else out.defused.push(id);
    activate(level, s, out);
    return { s, ev: { t: 'pull', id, special: true, ...out, wishes, reward: null, boom: [], gone: [] } };
  }
  const { s, ev } = play(level, { ...s0, lasso: false }, id, false, true);
  return { s, ev: { ...ev, t: 'pull' } };
}

// Constelación: on = la carta es estrellita. Devuelve 'on' (sumó), 'done' (las juntó todas), 'lost' (se apagó) o null.
export function cstStep(level, s, on) {
  if (!level.cst || s.cst === -1 || s.cst === level.cst) return null;
  if (on) return (s.cst = (s.cst || 0) + 1) === level.cst ? 'done' : 'on';
  if (s.cst > 0) return (s.cst = -1), 'lost';
  return null;
}

export function draw(level, s0) {
  const s = cloneState(s0);
  // Imán: la carta que más sirve pasa al tope antes de robar (de dónde salió, para animarlo).
  // Si ninguna sirve, no se gasta: robas normal y sigue esperando el siguiente robo. Si sí, la carta jalada no corta la
  // racha (aim = la del tablero que conviene jugar, para señalarla).
  let pulled = null, aim = null;
  const pick = s.magnet ? magnetPick(level, s) : null;
  if (pick) {
    s.magnet = false;
    s.stock.unshift(...s.stock.splice(pick.i, 1));
    (pulled = pick.i), (aim = pick.aim);
  }
  const card = s.stock.shift();
  s.top = card;
  s.wand = s.lasso = false;
  tick(s);
  if (!pick) s.streak = 0;
  s.turbo = card.turbo ? TURBO : 0;
  const boom = checkBombs(level, s);
  const gone = checkComets(level, s);
  const act = { packs: [], defused: [], wished: [] };
  const wishes = [];
  if (boom.length || gone.length) activateAfter(level, s, act, wishes);
  // Nave ladrona: llega tras unos robos y se lleva una carta del mazo (con el escudo ya no).
  const ship = level.ship && !s.shield && s.shipIn > 0 && --s.shipIn === 0 ? steal(level, s) : null;
  setTide(level, s, 1);
  const cst = cstStep(level, s, false);
  // 11 nov 2026 (el usuario se quedó atorado: la única carta del tablero con piedra y robar no la quitaba): las piedras
  // también se gastan al robar. Primero se gastan las que ya estaban y luego caen las nuevas (con sus 3 turnos).
  const rockOff = wearRocks(s);
  const rocks = dropRocks(level, s, s0.freeze > 0);
  const boss = bossStep(level, s0, s, false);
  return { s, ev: { t: 'draw', card, ...(boss && { boss }), boom, gone, ...act, wishes, ...(card.turbo && { turbo: true }), ...(ship && { ship }), ...(cst && { cst }), ...(rockOff.length && { rockOff }), ...(rocks.length && { rocks }), ...(s0.magnet && { pulled, aim }) } };
}

// ---------- Solucionador y bot ----------
const sig = (c) => (c.wild ? 'w' : `${c.rank}${c.alt != null ? `/${c.alt}` : ''}${c.arrow ? (c.arrow > 0 ? '+' : '-') : ''}${c.turbo ? 't' : ''}${c.rb ? `r${c.rb}` : ''}`);
// Niveles con cohete turbo: el turbo que queda también es parte del estado.
const hasTurbo = (level) => level.cards.some((c) => c.turbo) || level.stock.some((c) => c.turbo);

// Busca una solución desde un estado (profundidad primero, con memoria). Devuelve [id | 'draw' | 'wild', …] o null.
// wilds: comodines que puede usar (como en el juego, solo al quedarse sin jugadas).
// kill: además de ganar, el jefe tiene que quedar vencido (s.hp en 0).
export function solve(level, s0, limit = 250000, wilds = 0, kill = false) {
  const timed = !!level.foe || !!level.vine || !!level.flip || level.cards.some((c) => c.live || c.bomb || c.comet || c.ghost || c.cham || c.ring || c.belt);
  const turbo = hasTurbo(level);
  const seen = new Set();
  const path = [];
  let nodes = 0;
  const dfs = (s, w = wilds) => {
    if (won(s, level)) return !kill || s.hp <= 0;
    if (++nodes > limit) return false;
    const key = `${w}|${s.rem.map((b, i) => (b ? 1 : s.cut?.[i] ? s.cut[i] + 1 : 0)).join('')}|${s.stock.map(sig).join(',')}|${sig(s.top)}|${(s.streak <= LAST_REWARD ? s.streak : LAST_REWARD + 1 + ((s.streak - LAST_REWARD) % 3))}${timed ? `|${s.actions}|${s.boom}|${s.freeze || 0}` : ''}${level.ship ? `|${s.shipIn}|${s.stolen.map(sig).join('.')}` : ''}${level.tide ? `|${s.tq}` : ''}${s.master ? '|m' : ''}${turbo ? `|${s.turbo}` : ''}${level.rocks ? `|${s.rq}|${Object.entries(s.rock).join(';')}` : ''}${s.lift ? `|${s.lift}` : ''}${s.shield ? '|S' : ''}${s.burnt ? '|B' : ''}${s.magnet ? '|M' : ''}${s.awake ? `|a${s.awake}` : ''}${s.shift ? `|w${Object.entries(s.shift).join(';')}` : ''}${level.foe ? `|b${s.hp}|${s.tickle}|${(s.ink || []).map((t) => `${t.ids}:${t.d}`).join('/')}|${s.belly.map((b) => `${b.id}:${b.at}`).join('/')}|${Object.entries(s.ontop).join('/')}|${s.ash}|${s.melt || ''}|z${s.zap || ''}:${s.zd || 0}:${s.zt || 0}` : ''}`;
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

// Jefes (16 nov 2026, el usuario: «el 300 no tiene suficientes cartas para matar al enemigo»): una partida del bot
// casual que también dice si venció al jefe en algún momento (aunque luego pierda).
export function casualRun(level, r = Math.random) {
  let s = initState(level), kill = false;
  for (;;) {
    const moves = legal(level, s);
    if (moves.length) s = play(level, s, moves[Math.floor(r() * moves.length)].id).s;
    else if (s.stock.length) s = draw(level, s).s;
    else return { win: false, kill };
    if (level.foe && s.hp <= 0) kill = true;
    if (won(s, level)) return { win: true, kill };
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
