import { save, persist } from './storage.js';
import { openModal, toast, confetti, updateCoins, money, starsHTML, reduced, buzz, sparkle, wait, spendFromWallet, flyToWallet, balloons, lootBubbles, streakWarnHTML, betLoseHTML, shownCoins, popPrize } from './ui.js';
import { worldInfo, packGroups, MECH_NAMES, LEVELS_PER_WORLD, scrollStrip, scrollSpan, scrollCover, SCROLL_VIEW, SCROLL_SHOW, NEB_SLOTS, GRAV_SHOWN, W, H } from './levels.js';
import * as E from './engine.js';
import { price, EV_MARKUP, round5, HELPS, buyable } from './economy.js';
import { helpOff } from './meteor.js';
import { cardBackURL, icon, star, coin, lockIcon, keyIcon, arrowIcon, curtainIcon, suitSVG, avatarHTML } from './art.js';
import { tableHTML } from './biomes.js';
import { Coach } from './coach.js';
import { track, missionDef } from './missions.js';

const SUITS = ['s', 'h', 'd', 'c'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const LOCK_HUES = [350, 45, 200]; // color de cada pareja candado/llave
const FLY_MS = 400;
const FLY_EASE = 'cubic-bezier(0.33, 0.6, 0.35, 1)';
// Explicación de cada carta especial (11 nov 2026, homologadas a pedido del usuario: simples y por grupos). Es el
// mismo texto en su ventana al aparecer, en Tu camino y en Cómo jugar. Cada una: qué hace y, si hace falta, cuándo.
export const MECH_KINDS = [
  ['Se abren después', ['lock', 'curtain', 'ice']],
  ['Cambian con los turnos', ['live', 'ghost', 'cham']],
  ['Reglas al jugar', ['double', 'arrow', 'ticket']],
  ['No se juegan', ['pack', 'bomb', 'comet']],
  ['Te ayudan', ['coin', 'turbo', 'bolt', 'cst']],
];
// Dibujos que viven en main.js y dev.js (la carta de ejemplo y el icono de cada mesa): main.js los pone al arrancar.
export const ART = { mechCard: () => '', tableIcon: () => '' };
export const TIPS = {
  lock: 'No se juega hasta que juegues la carta con la <b>llave</b> del mismo color.',
  curtain: 'Sigue <b>boca abajo</b> hasta que juegues la carta con el <b>telón</b>.',
  ice: 'No se juega hasta que se <b>derrite</b>: cada carta que juegas del tablero le quita 1.',
  live: 'Su número <b>sube (↑) o baja (↓)</b> con cada jugada o robo. Juégala cuando encaje.',
  ghost: '<b>Aparece y desaparece</b> cada 2 jugadas o robos. Solo se juega cuando se ve.',
  cham: 'Cada 3 jugadas o robos se vuelve <b>comodín</b> y luego regresa a su número. Juégalo cuando esté dorado.',
  double: 'Vale <b>dos números</b>: juégala con cualquiera y sigue desde cualquiera.',
  arrow: 'Después de jugarla, la siguiente tiene que ser <b>uno más (↑)</b> o <b>uno menos (↓)</b>.',
  ticket: 'Tiene <b>dos mitades</b>: juega una y la otra se queda para después.',
  pack: 'No se juega: <b>destápala</b> y mete cartas extra a tu mazo.',
  bomb: 'No se juega: <b>destápala</b> antes de que su cuenta llegue a 0. Si no, explota y quema 3 cartas de tu mazo.',
  comet: 'No se juega: <b>destápalo</b> antes de que su cuenta llegue a 0 y suma puntos a tu racha. Si no, se va.',
  coin: 'Se juega normal y te da <b>monedas</b>.',
  turbo: 'Se juega normal y tus <b>3 jugadas siguientes</b> valen doble en la racha. Si robas, se apaga.',
  bolt: 'Se juega normal y manda de <b>1 a 3</b> cartas enterradas a tu mazo.',
  cst: 'Juega <b>todas</b> las de estrellita seguidas y ganas un premio. Si robas o juegas otra en medio, se apaga.',
};
// La ayuda que sirve contra cada carta (11 nov 2026, pedido del usuario): sale con su carta en la ventana de la primera
// carta que la necesite, una sola vez por ayuda (save.seen['ayuda-…']; el escudo usa save.seen.escudo).
export const TIP_HELP = {
  lock: ['llave', 'hllave', '<b>Llave maestra:</b> abre todos los candados y cortinas.'],
  curtain: ['llave', 'hllave', '<b>Llave maestra:</b> abre todos los candados y cortinas.'],
  comet: ['reloj', 'hreloj', '<b>Reloj de arena:</b> congela 3 turnos todo lo que cuenta.'],
  bomb: ['reloj', 'hreloj', '<b>Reloj de arena:</b> congela 3 turnos todo lo que cuenta.'],
  live: ['reloj', 'hreloj', '<b>Reloj de arena:</b> congela 3 turnos todo lo que cuenta.'],
  ghost: ['reloj', 'hreloj', '<b>Reloj de arena:</b> congela 3 turnos todo lo que cuenta.'],
};
const MECH_FIELD = { lock: 'lock', pack: 'pack', ice: 'ice', double: 'alt', arrow: 'arrow', curtain: 'curtain', bomb: 'bomb', live: 'live', ticket: 'half', comet: 'comet', turbo: 'turbo', ghost: 'ghost', ship: 'ship', coin: 'coin', cham: 'cham', bolt: 'bolt', cst: 'cst' };
// Constelación (10 nov 2026, pedido del usuario): al juntarla, CST_HELP de las veces una ayuda y si no monedas, de 50 a
// 200 (casi siempre de las bajas: el promedio queda en ~100, unas 2 veces lo que paga un nivel ahí).
const CST_HELP = 0.15;
const cstCoins = () => Math.round((50 + 150 * Math.random() ** 2) / 5) * 5;
// La ayuda que puede tocar (el láser solo donde hay asteroides).
const pickHelp = (level) => { const ks = ['reloj', 'ver2', 'ver3', ...(level.rocks ? ['laser', 'laser'] : []), ...(level.ship ? ['escudo'] : [])]; return ks[Math.floor(Math.random() * ks.length)]; };

// Asentarse al aterrizar: un aplastón leve, el protagonismo es el vuelo.
function squash(el) {
  if (!el || reduced()) return;
  el.animate([{ transform: 'scale(1.06, 0.94)' }, { transform: 'scale(0.98, 1.02)', offset: 0.5 }, { transform: 'none' }], {
    duration: 240,
    easing: 'ease-out',
  });
}

// Lanzamiento: la carta se levanta, gira en el aire y cae en su destino.
// spin = grados de giro (360 = una vuelta; 0 = solo un ladeo leve).
// Las coordenadas son desplazamientos (px) respecto a donde está el elemento.
function toss(el, { x0 = 0, y0 = 0, s0 = 1, r0 = 0 }, { x1 = 0, y1 = 0, s1 = 1, r1 = 0 }, spin = 0) {
  const dir = x1 - x0 >= 0 ? 1 : -1;
  const lift = Math.min(50, 18 + Math.hypot(x1 - x0, y1 - y0) * 0.1);
  // Propiedades separadas (translate, rotate, scale): así el desplazamiento no gira con la carta
  // y el giro es sobre su propio centro. Con transform: translate() + rotate el camino salía en espiral.
  const k = (x, y, sc, r, offset) => ({ translate: `${x}px ${y}px`, scale: `${sc}`, rotate: `${r}deg`, ...(offset != null && { offset }) });
  const mid = spin ? spin / 2 : 14;
  const frames = [
    k(x0, y0, s0, r0),
    k(x0, y0 - 6, s0 * 1.06, r0 - 4 * dir, 0.12),
    k((x0 + x1) / 2, (y0 + y1) / 2 - lift, Math.max(s0, s1) * 1.1, (r0 + r1) / 2 + mid * dir, 0.55),
    k(x1, y1, s1, r1 + spin * dir),
  ];
  return el.animate(frames, { duration: reduced() ? 1 : spin ? FLY_MS + 80 : FLY_MS, easing: FLY_EASE, fill: 'forwards' }).finished;
}

const center = (r) => [r.left + r.width / 2, r.top + r.height / 2];

// rank: número a mostrar (la carta viva cambia); si no se da, el de la carta.
// Cara: número en la esquina, palo arriba a la derecha y el número grande al centro.
export function faceHTML(c, rank = c.rank) {
  if (c.wild) return `<div class="face front wild">${icon('wild')}</div>`;
  if (rank == null) return '';
  const s = suitSVG(SUITS[c.suit]);
  // Cada palo con su clase (cs s0…s3): las caras de colección cambian el palo por su figura (sets.js).
  const cs = `cs s${c.suit}`;
  const red = c.suit === 1 || c.suit === 2 ? ' red' : '';
  const arrow = c.arrow ? `<span class="arrow-badge">${arrowIcon(c.arrow > 0)}</span>` : '';
  // Boleto partido: dos mitades con su número, separadas por una línea picada con muescas a los lados.
  if (c.half != null) return `<div class="face front ticket${red}">${[c.rank, c.half].map((x, i) => `<span class="tk ${i ? 'b' : 'a'}"><span class="${cs}">${s}</span><b${UL(RANKS[x])}>${RANKS[x]}</b></span>`).join('')}<i class="perf"></i></div>`;
  // Carta doble: los dos números ("5/8").
  if (c.alt != null) return `<div class="face front double${red}"><span class="${cs}">${s}</span><span class="dbl"><b${UL(RANKS[c.rank])}>${RANKS[c.rank]}</b><i></i><b${UL(RANKS[c.alt])}>${RANKS[c.alt]}</b></span></div>`;
  const r = RANKS[rank];
  // Carta viva: en la esquina va la flecha de hacia dónde cambia (el número está al centro).
  // Cohete turbo: en la esquina va el cohete (es el que despega al jugarla); por lo demás, carta normal.
  const corner = c.live ? `<span class="rk dir${c.live < 0 ? ' down' : ''}">${LIVE_DIR[c.live > 0 ? 'up' : 'down']}</span>` : c.turbo ? `<span class="rk tb-rk">${icon('rocket')}</span>` : `<span class="rk${SIXNINE(r)}">${r}</span>`;
  const kind = c.live ? ' live' : c.cham ? ' cham' : c.arrow ? ' arrowed' : c.lock != null ? ' locked' : c.key != null ? ' keyed' : '';
  // Candado y llave: carta del color de su pareja, con su dibujo dentro en el lugar del palo
  // (el palo sale cuando se abre el candado).
  const pair = c.lock ?? c.key;
  const tint = pair != null ? ` style="--kh:${LOCK_HUES[pair]}"` : '';
  const badge = c.lock != null ? `<span class="lk-badge">${lockIcon(LOCK_HUES[c.lock])}</span>` : c.key != null ? `<span class="lk-badge">${keyIcon(LOCK_HUES[c.key])}</span>` : '';
  // 11 nov 2026 (pedido del usuario: igual que el cohete turbo): rayo, fantasma y llave de puerta llevan su dibujo
  // arriba a la derecha, en el lugar del palo; la constelación, su estrellita abajo a la derecha, dentro de la carta.
  const mk = c.bolt ? 'rayo' : c.ghost ? 'ghost' : c.doorKey ? 'llavePuerta' : null;
  const suit = c.key != null ? '' : c.coin ? `<span class="cs coin-cs">${icon('monedas')}</span>` : mk ? `<span class="cs mk-cs">${icon(mk)}</span>` : `<span class="${cs}">${s}</span>`;
  return `<div class="face front${red}${kind}"${tint}>${corner}${suit}${badge}<span class="big${r === '10' ? ' ten' : ''}${SIXNINE(r)}">${r}</span>${arrow}${c.cst ? `<span class="cst-mk">${icon('star')}</span>` : ''}${c.cham ? `${CHAM_FACE('cham-eyes')}<span class="cham-ov">${CHAM_FACE('cham-face')}</span>` : ''}</div>`;
}
// Ayuda en una ventana de presentación (11 nov 2026): su carta y, al lado, para qué sirve, en su propio renglón.
// small: nota chiquita abajo (11 nov 2026, el usuario: «agrupar las ayudas en pequeño, o una nota»).
const helpTip = (back, text, small = false) => `<div class="help-tip${small ? ' small' : ''}"><span class="help-tip-card" style="background-image:${cardBackURL(back)}"></span><p>${text}</p></div>`;
// Ventanas de presentación de las mesas y del escudo (la primera vez que salen).
// Mesas (11 nov 2026, homologadas a pedido del usuario): a = qué es, b = cómo funciona. La ventana pone cada una en su
// renglón y Tu camino las dos juntas (MESA_TEXT). Todas azules, como las de las cartas.
export const TABLE_TEXT = {
  mesa: ['Esta mesa llega <b>enrollada</b>.', 'Limpia las primeras cartas y la mesa avanza: salen más del rollo.'],
  gravedad: ['Las cartas van en <b>columnas</b>.', 'Solo juegas la de <b>abajo</b>; al quitarla, la columna cae.'],
  nebulosa: ['Solo ves <b>3 grupos</b> de cartas.', 'Vacía <b>cualquiera</b> y de la nebulosa sale otro.'],
  plegable: ['Esta mesa llega <b>doblada</b>.', 'Limpia el panel de <b>en medio</b> y se desdobla: salen más cartas a los lados.'],
  marea: ['Aquí sube la <b>marea</b>.', 'Cada <b>3 robos</b> sube y tapa las cartas de abajo; cada <b>3 jugadas</b> baja. Bajo el agua no se juegan.'],
  puertas: ['Detrás de cada <b>puerta</b> hay cartas.', 'Juega una <b>carta llave</b> y escoge qué puerta abrir: sus cartas salen al tablero.'],
  banda: ['Estas cartas dan vueltas en una <b>banda</b>.', 'Solo ves <b>4</b> a la vez y avanza con cada jugada o robo. ¡Atrápalas cuando pasen!'],
  hoyo: ['Un <b>agujero negro</b> atrapó las cartas del tablero.', 'Cada <b>4 jugadas o robos</b> se las traga y las escupe con los números revueltos. Cuando está por tragárselas, gira más rápido.'],
  // La nave (11 nov 2026, pedido del usuario): no es carta, es mecánica: va como mesa.
  nave: ['Por aquí pasa una <b>nave ladrona</b>.', 'Cada pocos robos se lleva una carta de tu <b>mazo</b>. Con racha de 4 te regresa la última.'],
  rocas: ['Por aquí pasa un <b>cinturón de asteroides</b>.', 'Cada <b>4 robos</b> caen piedras que tapan cartas <b>3 turnos</b>.'],
};
const TABLE_NAME = { nave: 'Nave ladrona', mesa: 'Mesa enrollada', gravedad: 'Gravedad', nebulosa: 'Nebulosa', plegable: 'Mesa plegable', marea: 'Marea', puertas: 'Puertas', banda: 'Banda transportadora', hoyo: 'Agujero negro', rocas: 'Asteroides' };
const TABLE_HELP = { rocas: helpTip('hlaser', '<b>Láser:</b> rompe todas las piedras.', true), nave: helpTip('hescudo', '<b>Escudo:</b> la nave ya no te roba en todo el nivel.', true) };
// Ventana con el formato de las cartas (11 nov 2026): dibujo a la izquierda y, al lado, su nombre y su texto.
const tipCard = (pic, name, text, cls = '') => `<div class="tip-card"><span class="tip-pic${cls}">${pic}</span><p><b>${name}</b>${text}</p></div>`;
const helpPic = (back) => `<span class="help-tip-card" style="background-image:${cardBackURL(back)}"></span>`;
// Ventanas de presentación de las mesas, del escudo y de ver cartas (la primera vez que salen).
export const TABLE_INTRO = {
  // Mismo formato que las cartas: su icono (el de Tu camino; la nave, su nave), su nombre y su texto; la ayuda abajo.
  // body es un getter: el icono viene de dev.js (ART).
  ...Object.fromEntries(Object.entries(TABLE_TEXT).map(([k, [a, b]]) => [k, { title: `Nuevo: ${TABLE_NAME[k].toLowerCase()}`, color: 'blue', get body() { return tipCard(k === 'nave' ? icon('nave') : ART.tableIcon(k), TABLE_NAME[k], `${a} ${b}`, ' tip-ico') + (TABLE_HELP[k] || ''); } }])),
  // Mini guía de ayudas (11 nov 2026, pedido del usuario): una vez, en el nivel 2. Qué son, cuáles hay y dónde están.
  ayudas: { title: 'Nuevo: ayudas', color: 'blue', get body() { return `${tipCard(icon('ayudas'), 'Ayudas', 'Cartas que te sacan de apuros. Están en el <b>botón dorado</b> de abajo: toca una para usarla y abajo de cada una compras <b>+1</b>.', ' tip-ico')}<div class="help-list">${[['comodin', '<b>Comodín:</b> vale cualquier número.'], ['hreloj', '<b>Reloj de arena:</b> congela 3 turnos todo lo que cuenta.'], ['hver', '<b>Ver cartas:</b> voltea las cartas tapadas unos segundos.'], ['hllave', '<b>Llave maestra:</b> abre todos los candados y cortinas.']].map(([b, t]) => helpTip(b, t, true)).join('')}</div><p class="note">Solo salen las que sirven en cada nivel.</p>`; } },
  // Ver cartas: una vez, en un tablero grande.
  ver: { title: 'Ayuda: ver cartas', color: 'blue', body: tipCard(helpPic('hver'), 'Ver cartas', 'Voltea todas las cartas del tablero unos segundos. En tableros grandes como este te ayuda a planear.', ' tip-help') },
  escudo: { title: 'Nuevo: escudo', color: 'blue', body: tipCard(helpPic('hescudo'), 'Escudo', 'La <b>nave ladrona</b> ya no te roba en <b>todo el nivel</b>. Lo compras en tus ayudas, como las demás.', ' tip-help') },
};
// La ayuda de una carta en su ventana (TIP_HELP), una sola vez por ayuda.
function tipHelp(m) {
  const h = TIP_HELP[m], key = h && `ayuda-${h[0]}`;
  if (!h || save.seen[key]) return '';
  save.seen[key] = true;
  persist();
  return helpTip(h[1], h[2], true);
}
// Camaleón: carita de dos puntitos y una sonrisa chiquita (sutil de carta normal; sobre el comodín, cuando se convierte).
const CHAM_FACE = (cls) => `<span class="${cls}"><i></i><i></i><b></b></span>`;
// Giro equivalente entre -90° y 90° (una carta girada 180° se ve igual, pero derecha).
const upright = (r) => {
  let x = ((r % 360) + 360) % 360;
  if (x > 180) x -= 360;
  return x > 90 ? x - 180 : x < -90 ? x + 180 : x;
};
// El 6 y el 9 llevan rayita abajo: con las cartas giradas se confundían.
const SIXNINE = (r) => (r === '6' || r === '9' ? ' uline' : '');
const UL = (r) => (SIXNINE(r) ? ' class="uline"' : '');
// Boleto partido: recorte en zigzag por la línea picada. keep = mitad que se ve (1 = la de abajo, 2 = la de arriba;
// igual que s.cut: 1 = ya se jugó la de arriba). open de 0 (solo esa mitad) a 1 (la carta entera), para animarlo.
function tearClip(keep, open = 0) {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const y = 50 + (i % 2 ? 3 : -3);
    pts.push(`${(-8 + i * 11.6).toFixed(1)}% ${keep === 1 ? y - open * 60 : y + open * 60}%`);
  }
  // Un poco más ancho que la carta: así no se recorta su sombra.
  return `polygon(${keep === 1 ? `${pts.join(',')}, 108% 115%, -8% 115%` : `-8% -8%, 108% -8%, ${pts.reverse().join(',')}`})`;
}
const LIVE_DIR = {
  up: '<svg viewBox="0 0 24 24"><path d="M12 20V5M5 11.5 12 4.5l7 7" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 4v15M5 12.5l7 7 7-7" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
// Reverso. La cortina es un telón de verdad (dos cortinas y su galería) que se recoge al abrirse.
// Cohete turbo: boca abajo (en el tablero o en el mazo) lleva el cohete al centro y la orilla naranja.
// Boleto partido: el reverso de siempre con la línea picada y las muescas del boleto.
// Candado: la orilla del color de su pareja y el candado al centro. La llave no se ve tapada: hay que buscarla.
const pairColor = (h) => `hsl(${h},75%,60%)`;
// 11 nov 2026: igual que el turbo, el rayo (morado), la constelación (dorada), el fantasma (lila) y la carta llave de
// las puertas (madera): la orilla de su color y su dibujo al centro. Así se reconocen boca abajo.
const BACK_MARK = (c) =>
  c.turbo ? ['#ff8a3d', 'tb-ico', icon('rocket')]
  : c.lock != null ? [pairColor(LOCK_HUES[c.lock]), 'lk-ico', lockIcon(LOCK_HUES[c.lock])]
  : c.bolt ? ['#7a6ae8', 'tb-ico mk-bolt', icon('rayo')]
  : c.cst ? ['#ffc83d', 'tb-ico mk-cst', icon('star')]
  : c.ghost ? ['#b9aef0', 'tb-ico mk-ghost', icon('ghost')]
  : c.doorKey ? ['#c9893a', 'tb-ico mk-door', icon('llavePuerta')]
  : null;
export const backHTML = (c) => {
  const m = BACK_MARK(c);
  return `<div class="face back"${m ? ` style="--back:${cardBackURL(undefined, m[0])}${c.lock != null ? `;--kh:${LOCK_HUES[c.lock]}` : ''}"` : ''}>${c.curtain != null ? '<i class="drape l"></i><i class="drape r"></i><i class="valance"></i>' : ''}${m ? `<span class="${m[1]}">${m[2]}</span>` : ''}${c.half != null ? '<i class="perf"></i>' : ''}</div>`;
};
const inner = (c) => `<div class="inner">${faceHTML(c)}${backHTML(c)}</div>`;
// Marcas que se ven aunque la carta esté boca abajo, para poder planear.
const marks = (c) =>
  (c.ice ? `<span class="ice-ov"><b></b></span>` : '') +
  (c.curtainKey != null ? `<span class="curtain-mark">${curtainIcon()}</span>` : '') +
  (c.wet ? '<span class="tide-ov"><i></i></span>' : '') +
  // (11 nov 2026: la carta llave, el rayo y la constelación ya no llevan marca encima, que tapaba las de atrás: van en
  // su cara y en su reverso, como el turbo.)
  '';

// opts: onExit, onAbandon(gaveUp), onReplay, rachaRisk() → { n, pend } | null, onWin(stars) → { coins, tickets, prev, gold, wild, chest }, onDone(res), onSave(state)?,
//       resume (estado guardado), saved (la partida se guarda al salir), tutorial, dev
//       meteor: la lluvia que caía al empezar (SHOWERS de meteor.js: la ficha de monedas lleva su ×N y su reloj)
//       event: { ico, table } = nivel del evento del mes (table = la mesa de su temática) (sin estrellas; perder gasta su boleto y no se reintenta)
export class Game {
  constructor(root, level, opts) {
    // Mesa enrollada: copia propia, porque sus tapas cambian si en la pantalla cabe más tira (scrollView).
    this.level = level.scroll === 'mesa' ? { ...level, cards: level.cards.map((c) => ({ ...c })) } : level;
    // Banda: copia propia de su lado (acostada o parada) y de los grupos, porque se escoge al acomodar (layout).
    if (level.belt) this.level = { ...this.level, belt: { ...level.belt }, groups: level.groups.slice() };
    level = this.level;
    this.opts = opts;
    this.info = worldInfo(level.world);
    // Ninguna carta de cabeza: girada media vuelta tiene la misma silueta (tapa lo mismo) y el número queda derecho.
    this.cards = level.cards.map((c) => ({ ...c, rot: upright(c.rot || 0), removed: false, el: null }));
    this.st = E.initState(level); // estado de reglas (js/engine.js): la única fuente de verdad
    this.history = []; // { t, before: estado anterior, ev: lo que pasó (para animar el deshacer), best, bonus }
    this.best = 0;
    this.bonus = 0;
    this.extras = 0;
    this.done = false;
    this.busy = true; // mientras hay una animación que bloquea (barajeo, carta regalo) no se puede tocar
    this.dealing = true; // durante el barajeo las cartas no se voltean
    this.modalOpen = false;
    if (opts.resume?.st) this.restore(opts.resume); // partidas guardadas con el formato viejo se empiezan de nuevo
    this.sync();

    this.el = this.build();
    root.append(this.el);
    // Se vigila el propio tablero y no la ventana: en iOS, al girar, el aviso de la ventana llega con el tamaño viejo.
    this.wrapSize = '';
    this.resizer = new ResizeObserver(([e]) => {
      const size = `${Math.round(e.contentRect.width)}x${Math.round(e.contentRect.height)}`;
      if (size === this.wrapSize) return;
      // Mesa enrollada: al girar, el teléfono pasa por tamaños intermedios; se acomoda con el tamaño final.
      if (this.level.scroll !== 'mesa' || !this.view) return this.layout();
      clearTimeout(this.layoutT);
      this.layoutT = setTimeout(() => this.layout(), 220);
    });
    this.resizer.observe(this.wrapEl);
    this.onKey = (e) => this.key(e);
    window.addEventListener('keydown', this.onKey);
    this.layout();
    this.cards.forEach((c) => !c.removed && this.makeCardEl(c));
    this.makeHole();
    this.makeRocks();
    this.makeDoors();
    this.makeBelt();
    this.renderPiles();
    this.updateCounts();
    this.showCombo();
    this.intro()
      .then(() => {
        if (this.done) return;
        this.dealing = false;
        this.refresh();
        return this.presentBombs();
      })
      .then(() => {
        if (this.done) return;
        this.busy = false;

        if (opts.tutorial) this.coach = new Coach(this);
        else this.tips();
      });
  }

  // Atajos de lectura del estado.
  get stock() {
    return this.st.stock;
  }
  get streak() {
    return this.st.streak;
  }
  get top() {
    return this.st.top;
  }
  sync() {
    this.cards.forEach((c, i) => (c.removed = this.st.rem[i]));
  }

  // La primera vez que aparece una mecánica se explica (solo en modo jugador; en dev se ve en la galería).
  tips() {
    if (this.level.scroll === 'mesa' && !save.seen.mesa) {
      save.seen.mesa = true;
      persist();
      this.modalOpen = true;
      return openModal({
        ...TABLE_INTRO.mesa,
        closable: false,
        onClose: () => {
          this.modalOpen = false;
          if (!reduced()) this.rollEl?.animate([{ scale: 1 }, { scale: 1.15 }, { scale: 1 }], { duration: 500, iterations: 2 });
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    if (this.level.scroll === 'gravedad' && !save.seen.gravedad) {
      save.seen.gravedad = true;
      persist();
      this.modalOpen = true;
      return openModal({
        ...TABLE_INTRO.gravedad,
        closable: false,
        onClose: () => {
          this.modalOpen = false;
          if (!reduced()) for (const c of this.cards) if (c.el && c.gPos?.k === 0) c.el.animate([{ translate: '0 0' }, { translate: `0 ${-this.u * 0.25}px` }, { translate: '0 0' }], { duration: 420, easing: 'ease-in-out', iterations: 2 });
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    if (this.level.scroll === 'plegable' && !save.seen.plegable) {
      save.seen.plegable = true;
      persist();
      this.modalOpen = true;
      return openModal({
        ...TABLE_INTRO.plegable,
        closable: false,
        onClose: () => {
          this.modalOpen = false;
          if (!reduced()) this.foldMid?.animate([{ scale: 1 }, { scale: 1.06 }, { scale: 1 }], { duration: 450, iterations: 2 });
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    if (this.level.tide && !save.seen.marea) {
      save.seen.marea = true;
      persist();
      this.modalOpen = true;
      return openModal({
        ...TABLE_INTRO.marea,
        closable: false,
        onClose: () => {
          this.modalOpen = false;
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    if (this.level.belt && !save.seen.banda) {
      save.seen.banda = true;
      persist();
      this.modalOpen = true;
      return openModal({
        ...TABLE_INTRO.banda,
        closable: false,
        onClose: () => {
          this.modalOpen = false;
          if (!reduced()) this.beltEl?.animate([{ scale: 1 }, { scale: 1.05 }, { scale: 1 }], { duration: 450, iterations: 2 });
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    if (this.level.doors && !save.seen.puertas) {
      save.seen.puertas = true;
      persist();
      this.modalOpen = true;
      return openModal({
        ...TABLE_INTRO.puertas,
        closable: false,
        onClose: () => {
          this.modalOpen = false;
          if (!reduced()) this.doorEls?.forEach((d) => d?.animate([{ scale: 1 }, { scale: 1.12 }, { scale: 1 }], { duration: 450, iterations: 2 }));
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    if (this.level.hole && !save.seen.hoyo) {
      save.seen.hoyo = true;
      persist();
      this.modalOpen = true;
      return openModal({
        ...TABLE_INTRO.hoyo,
        closable: false,
        onClose: () => {
          this.modalOpen = false;
          if (!reduced()) this.holeEl?.animate([{ scale: 1 }, { scale: 1.3 }, { scale: 1 }], { duration: 500, iterations: 2 });
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    if (this.level.rocks && !save.seen.rocas) {
      save.seen.rocas = true;
      persist();
      this.modalOpen = true;
      return openModal({
        ...TABLE_INTRO.rocas,
        closable: false,
        onClose: () => {
          this.modalOpen = false;
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    if (this.level.scroll === 'nebulosa' && !save.seen.nebulosa) {
      save.seen.nebulosa = true;
      persist();
      this.modalOpen = true;
      return openModal({
        ...TABLE_INTRO.nebulosa,
        closable: false,
        onClose: () => {
          this.modalOpen = false;
          if (!reduced()) this.nebEl?.animate([{ scale: 1 }, { scale: 1.2 }, { scale: 1 }], { duration: 500, iterations: 2 });
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    // Ayudas: una vez, desde el nivel 2 (no en eventos). Al cerrar brilla su botón.
    if (!save.seen.ayudas && (this.level.g ?? 0) >= 1 && !this.level.event && !this.opts.event && !this.opts.tutorial) {
      save.seen.ayudas = true;
      persist();
      this.modalOpen = true;
      return openModal({
        ...TABLE_INTRO.ayudas,
        closable: false,
        onClose: () => {
          this.modalOpen = false;
          const btn = this.el.querySelector('.wild-card');
          if (btn && !reduced()) btn.animate([{ scale: 1 }, { scale: 1.25, rotate: '-8deg' }, { scale: 1 }], { duration: 500, iterations: 3 });
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    // Nave ladrona (11 nov 2026): se presenta como mesa, con la ayuda Escudo abajo.
    if (this.level.ship && !save.seen.ship) {
      save.seen.ship = save.seen.escudo = true;
      persist();
      this.modalOpen = true;
      return openModal({
        ...TABLE_INTRO.nave,
        closable: false,
        onClose: () => {
          this.modalOpen = false;
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    const next = (this.level.meta.mechs || []).find((m) => TIPS[m] && !save.seen[m]);
    // Escudo (11 nov 2026: ayuda, ya no carta): se presenta una vez, en un nivel con nave que no sea el primero (ahí
    // ya sale la nave).
    this.shipKnown ??= !!save.seen.ship;
    if (!next && this.level.ship && this.shipKnown && !save.seen.escudo) {
      save.seen.escudo = true;
      persist();
      this.modalOpen = true;
      return openModal({
        ...TABLE_INTRO.escudo,
        closable: false,
        onClose: () => {
          this.modalOpen = false;
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    if (!next && !save.seen['ayuda-ver'] && this.cards.length >= 32 && (this.level.g || 0) >= 60) {
      save.seen['ayuda-ver'] = true;
      persist();
      this.modalOpen = true;
      return openModal({
        ...TABLE_INTRO.ver,
        closable: false,
        onClose: () => {
          this.modalOpen = false;
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    // Nave ladrona: cada vez que empieza el nivel se avisa (sin decir cuándo llega).
    if (!next && this.level.ship && !this.shipTold) {
      this.shipTold = true;
      this.shipBanner();
    }
    if (!next) return;
    save.seen[next] = true;
    persist();
    const c = this.cards.find((x) => !x.removed && x.el && x[MECH_FIELD[next]] != null);
    this.modalOpen = true;
    openModal({
      title: `Nuevo: ${MECH_NAMES[next].toLowerCase()}`,
      color: 'blue',
      closable: false,
      // 11 nov 2026 (pedido del usuario): como en Cómo jugar, su carta y al lado su nombre y su texto; la ayuda, abajo
      // en chiquito.
      body: `<div class="tip-card"><span class="tip-pic">${ART.mechCard(next)}</span><p><b>${MECH_NAMES[next]}</b>${TIPS[next]}</p></div>${tipHelp(next)}`,
      onClose: () => {
        this.modalOpen = false;
        if (c?.el) {
          c.el.classList.remove('hint');
          void c.el.offsetWidth;
          c.el.classList.add('hint');
          setTimeout(() => c.el?.classList.remove('hint'), 1600);
        }
        setTimeout(() => this.tips(), 300);
      },
      buttons: [{ label: '¡Entendido!', cls: 'green' }],
    });
  }

  destroy() {
    this.resizer.disconnect();
    clearTimeout(this.layoutT);
    window.removeEventListener('keydown', this.onKey);
    this.coach?.end();
    this.done = true;
  }

  // ---------- Guardar y retomar ----------
  snapshot() {
    return { st: this.st, history: this.history, best: this.best, bonus: this.bonus, extras: this.extras, stockMax: this.stockMax };
  }

  restore(s) {
    Object.assign(this, { st: s.st, history: s.history, best: s.best, bonus: s.bonus, extras: s.extras, stockMax: s.stockMax });
  }

  // Se llama tras cada acción. Solo guarda si el nivel es nuevo (ver main.js).
  save() {
    if (!this.done) this.opts.onSave?.(this.snapshot());
  }

  // Teclado (PC): espacio roba, Z deshace, Esc sale. El comodín se usa desde el grupo de ayudas (11 nov 2026: sin la C).
  key(e) {
    if (this.done || this.busy || e.repeat || e.metaKey || e.ctrlKey || document.querySelector('.modal-back')) return;
    const k = e.key.toLowerCase();
    const act = { ' ': () => this.draw(), enter: () => this.draw(), z: () => this.undo(), backspace: () => this.undo(), escape: () => this.exit() }[k];
    if (!act) return;
    e.preventDefault();
    act();
  }

  build() {
    const { level, info } = this;
    const el = document.createElement('div');
    el.className = 'screen game';
    el.style.setProperty('--hue', info.hue);
    this.back = cardBackURL();
    el.style.setProperty('--back', this.back);
    el.innerHTML = `${tableHTML(level.world, this.opts.event?.table)}
      <header class="hud">
        <button class="tb hbtn" data-a="exit" aria-label="Pausa" title="Pausa">${icon('pause')}</button>
        <div class="hud-mid"><div class="combo info"></div></div>
        <div class="hud-r">${level.doors ? `<div class="pill info key-pill" aria-label="Llaves" title="Llaves: abre la puerta que quieras">${icon('door')}<b>0</b></div>` : ''}${this.opts.bet > 1 ? `<div class="pill info bet-pill b${this.opts.bet}" aria-label="Apuesta ×${this.opts.bet}" title="Apuesta: premios y ayudas ×${this.opts.bet}">×${this.opts.bet}</div>` : ''}${this.opts.racha ? `<div class="pill info racha-pill ${this.opts.racha.hot ? 'hot' : ''}" aria-label="Racha">${this.opts.racha.hot ? `<span class="fire">${icon('flame')}</span>` : ''}${icon(this.opts.racha.ico)}<span>${this.opts.racha.n}</span></div>` : ''}<div class="pill info${this.opts.meteor ? ` met-pill sh-${this.opts.meteor.kind}` : ''}">${coin()}<span data-coins>${money(shownCoins())}</span>${this.opts.meteor ? `<i class="x2">×${this.opts.meteor.x}</i><small class="met-clock"></small>` : ''}</div>${avatarHTML(save, 'hud-av')}</div>
      </header>
      <div class="board-wrap"><div class="board"></div><div class="streak"></div></div>
      <footer class="tray">
        <button class="end-btn tb" data-a="end" aria-label="Finalizar nivel">${icon('door')}<span>Finalizar nivel</span></button>
        <button class="tool tb undo-btn" data-a="undo" aria-label="Deshacer" title="Deshacer">${icon('undo')}<b class="badge" data-n="undo"></b></button>
        <div class="stock" data-a="draw" role="button" aria-label="Mazo"></div>
        <div class="pile waste"></div>
        <button class="tool tb wild-card" data-a="wild" aria-label="Ayudas" title="Ayudas">${icon('ayudas')}<b class="badge" data-n="wild"></b></button>
      </footer>`;
    this.boardEl = el.querySelector('.board');
    this.wrapEl = el.querySelector('.board-wrap');
    // Mesa enrollada: encima de la mesa del planeta va una alfombra de su color (--rug) que se desenrolla.
    if (level.scroll === 'mesa') {
      el.classList.add('scroll-mesa');
      const tbl = el.querySelector('.table');
      this.boardEl.insertAdjacentHTML('afterbegin', `<div class="rug" style="${tbl.getAttribute('style')}"></div><div class="strip"></div><div class="roll" style="${tbl.getAttribute('style')}"><i></i></div>`);
      this.rugEl = this.boardEl.querySelector('.rug');
      this.rollEl = this.boardEl.querySelector('.roll');
      // Las cartas de la tira van en su propia capa, cortada en la orilla del rollo (un solo corte fijo: al avanzar
      // las cartas solo se deslizan y el rollo se las traga o las suelta).
      this.stripEl = this.boardEl.querySelector('.strip');
    }
    // Nebulosa: nube que gira donde esperan los tramos que faltan.
    if (level.scroll === 'nebulosa') {
      el.classList.add('scroll-neb');
      this.boardEl.insertAdjacentHTML('afterbegin', `<div class="nebula"><div class="neb-in"><i></i><i></i><i></i></div></div>`);
      this.nebEl = this.boardEl.querySelector('.nebula');
    }
    // Plegable: tres tapetes del color de la mesa. Los de los lados son capas propias (sus cartas van adentro) para
    // girar sobre la bisagra; empiezan doblados debajo del de en medio.
    if (level.scroll === 'plegable') {
      el.classList.add('scroll-fold');
      const st = el.querySelector('.table').getAttribute('style');
      this.boardEl.insertAdjacentHTML('afterbegin', `<div class="fold-panel side" data-g="1" style="${st}"></div><div class="fold-panel side" data-g="2" style="${st}"></div><div class="fold-panel mid" style="${st}"></div>${'<i class="fold-hinge"></i>'.repeat(4)}`);
      this.foldEls = { 1: this.boardEl.querySelector('[data-g="1"]'), 2: this.boardEl.querySelector('[data-g="2"]') };
      this.foldMid = this.boardEl.querySelector('.fold-panel.mid');
      this.hingeEls = [...this.boardEl.querySelectorAll('.fold-hinge')];
    }
    // Gravedad: cada columna en su riel, sobre la mesa del planeta.
    if (level.scroll === 'gravedad') {
      el.classList.add('scroll-grav');
      this.boardEl.insertAdjacentHTML('afterbegin', level.cols.map(() => `<div class="g-rail"><b class="g-n"></b></div>`).join(''));
      this.railEls = [...this.boardEl.querySelectorAll('.g-rail')];
    }
    this.stockEl = el.querySelector('.stock');
    this.wasteEl = el.querySelector('.waste');
    this.streakEl = el.querySelector('.streak');
    this.comboEl = el.querySelector('.combo');
    // Cartas y mazo responden al apoyar el dedo, no al soltarlo.
    el.addEventListener('pointerdown', (e) => {
      if (this.done || this.busy || e.button > 0) return;
      const cardEl = e.target.closest('.board .card');
      if (cardEl) return this.tapCard(+cardEl.dataset.id, e);
      if (e.target.closest('.stock')) this.draw();
    });
    el.addEventListener('click', (e) => {
      if (this.done) return;
      const a = e.target.closest('button[data-a]')?.dataset.a;
      if (a === 'exit') return this.exit();
      if (this.busy) return;
      const actions = {
        undo: () => this.undo(),
        wild: () => this.openHelps(),
        end: () => this.endLevel(),
      };
      actions[a]?.();
    });
    return el;
  }

  // ---------- Entrada: barajar y repartir ----------
  // Todas las cartas empiezan juntas en el centro como un mazo, se barajan dos veces
  // (se parten en dos y se vuelven a juntar) y salen volando a su lugar una tras otra.
  intro() {
    // Las bombas y los cometas no se reparten: se presentan aparte al final (presentBombs).
    for (const c of this.cards) if ((c.bomb || c.comet) && c.el && !reduced()) c.el.style.opacity = 0;
    const live = this.cards.filter((c) => c.el && !c.bomb && !c.comet && !c.nebPos?.hid && !this.inDoor(c));
    if (reduced() || !live.length) return Promise.resolve();
    if (this.level.scroll === 'mesa') return this.unroll(live);
    // Plegable: las de los lados no se reparten (esperan dobladas).
    if (this.foldEls) live.splice(0, live.length, ...live.filter((c) => !c.group));
    if (this.nebEl) this.nebEl.animate([{ scale: 0, opacity: 0, rotate: '-180deg' }, { scale: 1, opacity: 1, rotate: '0deg' }], { duration: 900, delay: 500, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'backwards' });
    const cx = (parseFloat(this.boardEl.style.width) - this.u) / 2;
    const cy = (parseFloat(this.boardEl.style.height) - this.u * 1.4) / 2;
    const order = live.slice().sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x);
    const SHUF = 720;
    const FLY = 420;
    const step = Math.min(30, 900 / order.length);
    const cw = this.u;
    let last;
    order.forEach((c, i) => {
      const el = c.el;
      const dx = cx - parseFloat(el.style.left);
      const dy = cy - parseFloat(el.style.top);
      const side = i % 2 ? 1 : -1;
      const wait = SHUF + i * step;
      const total = wait + FLY;
      const at = (ms) => ms / total;
      const stackY = -i * 0.6; // el mazo se ve con algo de grosor
      const k = (x, y, r, offset, easing = 'ease-in-out') => ({ translate: `${x}px ${y}px`, rotate: `${r}deg`, offset, easing });
      const frames = [
        k(dx, dy + stackY, 0, 0),
        k(dx + side * cw * 0.62, dy + stackY - 4, side * 7, at(SHUF * 0.2)),
        k(dx, dy + stackY, 0, at(SHUF * 0.42)),
        k(dx + side * cw * 0.62, dy + stackY - 4, side * 7, at(SHUF * 0.62)),
        k(dx, dy + stackY, 0, at(SHUF * 0.84)),
        k(dx, dy + stackY, 0, at(wait), 'cubic-bezier(0.25, 0.8, 0.3, 1.12)'),
        { translate: '0px 0px', rotate: `${c.rot}deg`, offset: 1 },
      ];
      last = el.animate(frames, { duration: total, fill: 'backwards' });
    });
    return last.finished.catch(() => {});
  }

  // Al armarse el tablero, cada bomba (y cada cometa) aparece grande al frente con su cuenta y luego vuela a su
  // lugar, una tras otra: así se ve dónde cae cada una y cuántas jugadas tiene.
  presentBombs() {
    const bombs = this.cards.filter((c) => (c.bomb || c.comet) && c.el && !c.removed);
    if (!bombs.length || reduced()) return Promise.resolve();
    const w = parseFloat(this.boardEl.style.width);
    const h = parseFloat(this.boardEl.style.height);
    // Grandes, pero que quepan todas en el ancho de la pantalla.
    const avail = this.wrapEl.getBoundingClientRect().width * 0.9;
    const big = Math.min(2.2, avail / (bombs.length * this.u * 1.15));
    const gap = this.u * big * 1.15;
    const runs = bombs.map((c, i) => {
      const el = c.el;
      const x = parseFloat(el.style.left);
      const y = parseFloat(el.style.top);
      const cx = w / 2 - this.u / 2 + (i - (bombs.length - 1) / 2) * gap;
      const cy = h / 2 - (this.u * 1.4) / 2;
      el.style.zIndex = 9800 + i;
      el.style.opacity = '';
      const k = (tx, ty, sc, rot, offset, easing) => ({ translate: `${tx}px ${ty}px`, scale: sc, rotate: `${rot}deg`, offset, easing });
      const a = el.animate(
        [
          { ...k(cx - x, cy - y, 0.2, -20, 0, 'cubic-bezier(0.34, 1.45, 0.64, 1)'), opacity: 0 },
          { ...k(cx - x, cy - y, big * 0.9, -4, 0.15, 'cubic-bezier(0.34, 1.45, 0.64, 1)'), opacity: 1 },
          k(cx - x, cy - y, big, 0, 0.25, 'linear'),
          k(cx - x, cy - y, big, 0, 0.55 + i * 0.05, 'cubic-bezier(0.5, 0, 0.3, 1)'),
          k(0, 0, 1, c.rot, 1),
        ],
        { duration: 1500 + i * 350, fill: 'backwards' },
      );
      return a.finished.then(() => {
        el.style.zIndex = c.z * 100 + c.id;
        squash(el);
      });
    });
    return Promise.all(runs);
  }

  // ---------- Render ----------
  makeCardEl(c) {
    const d = document.createElement('div');
    d.className = c.pack ? 'card pack-card' : c.bomb ? 'card bomb-card' : c.comet ? 'card comet-card' : 'card';
    d.dataset.id = c.id;
    // La carta regalo se ve igual tapada o destapada: violeta con su "+n".
    // Las cartas especiales (regalo y bomba) se ven igual tapadas o destapadas.
    d.innerHTML = c.pack
      ? `<div class="inner"><div class="face front"></div><div class="face back"></div></div><span class="pack-num">+${c.pack.length}</span>`
      : c.bomb
        ? `<div class="inner"><div class="face front"></div><div class="face back"></div></div><span class="bomb-face">${icon('bomb')}<b></b></span>`
        : c.comet
          ? `<div class="inner"><div class="face front"></div><div class="face back"></div></div><span class="comet-face">${icon('comet')}<b></b><em></em></span>`
          : `<div class="inner">${faceHTML(c, E.rankOf(c, this.st))}${backHTML(c)}</div>` + marks(c);
    if (c.curtain != null) d.classList.add('curtain');
    if (c.alt != null) d.classList.add('dbl-card');
    if (this.inDoor(c)) d.classList.add('in-door');
    const cut = E.cutOf(c, this.st);
    if (cut) d.style.clipPath = tearClip(cut);
    d.style.zIndex = c.z * 100 + c.id;
    (this.foldEls?.[c.group] || this.stripEl || this.boardEl).append(d);
    c.el = d;
    this.place(c);
  }

  place(c) {
    if (this.level.scroll === 'mesa') return this.placeScroll(c);
    if (this.level.scroll === 'gravedad') return this.placeGrav(c);
    if (this.level.scroll === 'plegable') return this.placeFold(c);
    if (this.level.scroll) return this.placeNeb(c);
    if (c.belt && this.level.belt) return this.placeBelt(c);
    const o = this.offsets[c.group];
    c.el.style.left = `${(o.x + c.x) * this.u}px`;
    c.el.style.top = `${(o.y + c.y) * this.u}px`;
    c.el.style.rotate = `${c.rot}deg`;
  }

  layout() {
    const r = this.wrapEl.getBoundingClientRect();
    if (!r.width) return;
    this.wrapSize = `${Math.round(r.width)}x${Math.round(r.height)}`;
    if (this.level.scroll === 'mesa') return this.layoutScroll(r);
    if (this.level.scroll === 'gravedad') return this.layoutGrav(r);
    if (this.level.scroll === 'plegable') return this.layoutFold(r);
    if (this.level.scroll) return this.layoutNeb(r);
    // La carta doble se ve 10% más grande: se deja un poco de aire para que no se salga del tablero.
    const room = this.cards.some((c) => c.alt != null) ? 0.93 : 1;
    if (this.level.belt) this.beltSide((r.width - 10) * room, (r.height - 10) * room);
    const { u, bw, bh, offsets } = this.railItems().length ? this.packRail((r.width - 10) * room, (r.height - 10) * room) : packGroups(this.level.groups, (r.width - 10) * room, (r.height - 10) * room);
    this.u = Math.max(18, u);
    this.offsets = offsets;
    this.boardEl.style.width = `${bw * this.u}px`;
    this.boardEl.style.height = `${bh * this.u}px`;
    this.boardEl.style.setProperty('--cw', `${this.u}px`);
    this.cards.forEach((c) => c.el && this.place(c));
    this.placeHole();
    this.placeDoors();
    this.placeBeltBox();
    this.renderStock();
    this.coach?.update();
  }

  // ---------- Banda transportadora (8 nov 2026) ----------
  // La ventana de la banda (BELT_W lugares) entre dos cajas de la máquina. Las cartas que no están en la ventana van
  // adentro de la máquina (escondidas): las que acaban de salir, del lado de salida; las que vienen, del de entrada.
  makeBelt() {
    const B = this.level.belt;
    if (!B) return;
    const b = document.createElement('div');
    b.className = `belt belt-${B.dir}`;
    b.innerHTML = '<i class="belt-track"></i><i class="belt-box in"></i><i class="belt-box out"></i>';
    this.boardEl.append(b);
    this.beltEl = b;
    this.placeBeltBox();
  }
  // 11 nov 2026 (el usuario: «¿no es mejor parada, por espacio?»): la banda va acostada o parada según donde las
  // cartas salgan más grandes en esta pantalla (antes se sorteaba al armar el nivel). Empate: como venía.
  beltSide(W0, H0) {
    const B = this.level.belt, G = this.level.groups;
    const dims = { h: { w: B.W * 1.08 - 0.08, h: 1.4 }, v: { w: 1, h: B.W * 1.55 - 0.15 } };
    const uOf = (d) => packGroups(G.map((x, i) => (i === B.g ? dims[d] : x)), W0, H0).u;
    const other = B.dir === 'h' ? 'v' : 'h';
    if (uOf(other) > uOf(B.dir) * 1.03) B.dir = other;
    G[B.g] = dims[B.dir];
    if (this.beltEl && !this.beltEl.classList.contains(`belt-${B.dir}`)) this.beltEl.className = `belt belt-${B.dir}`;
  }
  placeBeltBox() {
    const B = this.level.belt, o = B && this.offsets?.[B.g];
    if (!this.beltEl || !o) return;
    const g = this.level.groups[B.g];
    Object.assign(this.beltEl.style, { left: `${o.x * this.u}px`, top: `${o.y * this.u}px`, width: `${g.w * this.u}px`, height: `${g.h * this.u}px` });
  }
  placeBelt(c) {
    const B = this.level.belt, o = this.offsets[B.g], el = c.el;
    const p = E.beltPos(this.level, c, this.st), shown = p < B.W;
    // Escondida: del lado de salida si acaba de irse (mitad final de la vuelta), si no del de entrada.
    const at = shown ? p : p >= (B.K + B.W) / 2 ? -1 : B.W;
    const step = B.dir === 'h' ? 1.08 : 1.55;
    const wasShown = el.dataset.belt === '1';
    // De escondida a escondida (por dentro de la máquina) no se anima: brincaría por encima de la ventana.
    el.style.transition = !shown && !wasShown ? 'none' : '';
    el.dataset.belt = shown ? '1' : '0';
    el.classList.toggle('belt-out', !shown);
    el.style.left = `${(o.x + (B.dir === 'h' ? at * step : 0)) * this.u}px`;
    el.style.top = `${(o.y + (B.dir === 'v' ? at * step : 0)) * this.u}px`;
    el.style.rotate = '0deg';
  }

  // ---------- Riel de la orilla (9 nov 2026) ----------
  // El agujero negro y las puertas van en una franja a la orilla del tablero (abajo o a un lado, donde las cartas
  // salgan más grandes): nunca tapan cartas. railItems: lo que va en la franja, en unidades de carta.
  railItems() {
    // Puertas (9 nov 2026, pedido del usuario): en fila, todas del alto de la pila más alta (alineadas arriba aunque
    // traigan distintas cartas). En columna van juntas (del alto de una carta, hc) y la que se abre crece hasta su pila
    // y recorre a las de abajo; ext = lo que crece una pila al abrirse (para apartar lugar).
    if (this.level.doors) {
      const h = Math.max(...this.level.doors.map((x) => x.h));
      return this.level.doors.map((x, d) => ({ w: W, h, g: x.g, hc: E.doorOpen(this.level, d, this.st) ? x.h : H, ext: x.h - H }));
    }
    if (this.level.hole) return [{ w: 1.9, h: 1.45 }];
    return [];
  }
  // Acomoda los grupos del tablero y la franja. Devuelve lo mismo que packGroups (con los grupos de las puertas en su
  // lugar de la franja) y this.railBox = dónde quedó cada cosa de la franja.
  packRail(W0, H0) {
    const items = this.railItems(), G = this.level.groups;
    const inRail = new Set(items.map((x) => x.g).filter((g) => g != null));
    const main = G.map((_, i) => i).filter((i) => !inRail.has(i));
    const pk = packGroups(main.map((i) => G[i]), W0, H0);
    const gap = 0.7, sp = 0.45;
    const rowW = items.reduce((a, x) => a + x.w, 0) + sp * (items.length - 1), rowH = Math.max(...items.map((x) => x.h));
    // En columna se aparta lugar para las pilas que se pueden abrir (tantas como llaves hay), así las cartas no
    // cambian de tamaño al abrir una.
    const keys = this.level.cards.filter((c) => c.doorKey).length;
    const ext = items.map((x) => x.ext || 0).sort((a, b) => b - a).slice(0, keys).reduce((a, b) => a + b, 0);
    const colW = Math.max(...items.map((x) => x.w)), colH = items.reduce((a, x) => a + (x.ext != null ? H : x.h), 0) + sp * (items.length - 1) + ext;
    const uB = Math.min(W0 / Math.max(pk.bw, rowW), H0 / (pk.bh + gap + rowH), 120);
    const uS = Math.min(W0 / (pk.bw + gap + colW), H0 / Math.max(pk.bh, colH), 120);
    const side = uS > uB;
    const bw = side ? pk.bw + gap + colW : Math.max(pk.bw, rowW), bh = side ? Math.max(pk.bh, colH) : pk.bh + gap + rowH;
    const offsets = [];
    const mx = side ? 0 : (bw - pk.bw) / 2, my = side ? (bh - pk.bh) / 2 : 0;
    main.forEach((i, k) => (offsets[i] = { x: pk.offsets[k].x + mx, y: pk.offsets[k].y + my }));
    // La franja, centrada: en renglón debajo del tablero o en columna a su derecha.
    let at = side ? (bh - colH) / 2 : (bw - rowW) / 2;
    this.railBox = items.map((x) => {
      const hh = side ? x.hc ?? x.h : x.h;
      const box = side ? { x: pk.bw + gap + (colW - x.w) / 2, y: at, w: x.w, h: hh } : { x: at, y: pk.bh + gap + (rowH - x.h) / 2, w: x.w, h: x.h };
      at += (side ? hh : x.w) + sp;
      if (x.g != null) offsets[x.g] = { x: box.x, y: box.y };
      return box;
    });
    this.railSide = side;
    return { u: side ? uS : uB, bw, bh, offsets };
  }

  // ---------- Puertas (9 nov 2026) ----------
  // Puertitas del tamaño de una carta en la franja de la orilla, cada una con su premio pintado (moneda, cometa o
  // cohete); no se ve cuántas cartas trae (9 nov 2026: el grosor de la pila se salía de la puerta). Las cartas llave dan llaves (la ficha de llaves del marcador); con una llave
  // en la mano las puertas brillan y tocar una la abre: la llave vuela a la cerradura, las hojas se abren, se activa su
  // premio y las cartas salen volando a su pila. Abrir una puerta no se deshace (ni lo que se jugó antes).
  makeDoors() {
    const D = this.level.doors;
    if (!D) return;
    this.doorEls = D.map((x, d) => {
      const el = document.createElement('div');
      el.className = 'door';
      el.dataset.door = d;
      el.style.setProperty('--n', x.n);
      el.innerHTML = `<i class="door-frame"></i><i class="leaf l"></i><i class="leaf r"></i><span class="door-prize">${x.prize === 'coin' ? coin() : icon(x.prize === 'comet' ? 'comet' : 'rocket')}</span><span class="door-hole"></span>`;
      el.addEventListener('pointerdown', (e) => (e.stopPropagation(), this.tapDoor(d)));
      this.boardEl.append(el);
      return el;
    });
    this.placeDoors();
    this.doorUpdate(true);
  }
  placeDoors() {
    if (!this.doorEls || !this.offsets) return;
    this.doorEls.forEach((el, d) => {
      const o = this.offsets[this.level.doors[d].g];
      if (o) Object.assign(el.style, { left: `${o.x * this.u}px`, top: `${o.y * this.u}px` });
    });
  }
  inDoor(c) {
    return c.door != null && !E.doorOpen(this.level, c.door, this.st);
  }
  tapDoor(d) {
    if (this.done || this.busy || this.modalOpen) return;
    const el = this.doorEls[d];
    if (E.doorOpen(this.level, d, this.st)) return;
    if (!E.canOpen(this.level, this.st, d)) {
      buzz();
      this.tell('door', 'Juega una carta llave para abrir una puerta');
      return this.shake(el);
    }
    const before = this.st;
    const { s, ev } = E.openDoor(this.level, before, d);
    this.history.push({ t: 'door', before, ev, best: this.best, bonus: this.bonus });
    this.st = s;
    this.sync();
    this.best = Math.max(this.best, s.streak);
    buzz(18);
    // La llave vuela de su ficha a la cerradura; luego se abre.
    const pill = this.el.querySelector('.key-pill');
    const go = () => {
      const x = this.level.doors[d];
      if (x.prize === 'coin') {
        save.coins += x.coins;
        persist();
        const [cx, cy] = center(el.getBoundingClientRect());
        flyToWallet('coins', { x: cx, y: cy }, x.coins, shownCoins() - x.coins);
        this.showStreak(`+${x.coins} monedas`);
      } else if (x.prize === 'turbo') {
        this.showCombo();
        this.showStreak('¡Turbo ×2!');
      } else {
        this.renderStock();
        const slots = this.rewardSlots(ev.wishes);
        ev.wishes.forEach((w, i) => (w.kind === 'bank' ? (save.wild++, persist(), squash(this.el.querySelector('.wild-card'))) : w.kind === 'broom' ? this.sweep(w.ids) : this.flyReward(w.kind, slots[i])));
        this.showCombo();
        this.showStreak(`¡Cometa +${s.streak - before.streak}!`);
      }
      this.renderStock();
      this.refresh();
      this.updateCounts();
      this.save();
      this.checkEnd();
    };
    if (reduced() || !pill) return go();
    const k = document.createElement('div');
    k.className = 'key-fly';
    k.innerHTML = icon('door');
    const [ax, ay] = center(pill.getBoundingClientRect()), [bx, by] = center(el.getBoundingClientRect());
    k.style.cssText = `left:${ax}px;top:${ay}px`;
    this.el.append(k);
    this.paintKeys();
    this.busy = true;
    k.animate([{ translate: '-50% -50%', scale: 0.6 }, { translate: `calc(-50% + ${(bx - ax) / 2}px) calc(-50% + ${(by - ay) / 2 - 40}px)`, scale: 1.4, offset: 0.5 }, { translate: `calc(-50% + ${bx - ax}px) calc(-50% + ${by - ay}px)`, scale: 0.7 }], { duration: 520, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' })
      .finished.catch(() => {})
      .then(() => {
        k.remove();
        this.busy = false;
        go();
      });
  }
  // Abre o cierra (al deshacer) cada puerta según el estado. Al abrirse, sus cartas salen de la puerta a su pila una
  // tras otra; al cerrarse, regresan adentro. first: al armar el tablero (sin animar).
  doorUpdate(first = false) {
    if (!this.doorEls) return;
    const keys = this.st.keys || 0;
    // En columna, abrir (o cerrar) una puerta recorre a las de abajo: se vuelve a acomodar y lo que se movió se desliza.
    const moved = !first && this.railSide && this.doorEls.some((el, d) => E.doorOpen(this.level, d, this.st) !== el.classList.contains('open'));
    if (moved) {
      const els = [...this.doorEls, ...this.cards.filter((c) => c.door != null && c.el && !c.removed).map((c) => c.el)];
      const before = els.map((e) => [parseFloat(e.style.left) || 0, parseFloat(e.style.top) || 0]);
      this.layout();
      if (!reduced()) els.forEach((e, i) => {
        const dx = before[i][0] - (parseFloat(e.style.left) || 0), dy = before[i][1] - (parseFloat(e.style.top) || 0);
        if (Math.abs(dx) + Math.abs(dy) > 1 && !e.classList.contains('in-door')) e.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], { duration: 420, easing: 'cubic-bezier(0.34, 1.2, 0.64, 1)' });
      });
    }
    this.doorEls.forEach((el, d) => {
      const open = E.doorOpen(this.level, d, this.st), was = el.classList.contains('open');
      el.classList.toggle('open', open);
      el.classList.toggle('can', !open && keys > 0);
      if (open === was && !first) return;
      const cards = this.cards.filter((c) => c.door === d && c.el && !c.removed);
      const [dx, dy] = [parseFloat(el.style.left) || 0, parseFloat(el.style.top) || 0];
      cards.forEach((c, j) => {
        c.el.classList.toggle('in-door', !open);
        if (first || reduced() || this.dealing) return;
        const tx = dx - parseFloat(c.el.style.left), ty = dy - parseFloat(c.el.style.top);
        const k = [{ translate: `${tx}px ${ty}px`, scale: 0.3, opacity: 0 }, { translate: `${tx}px ${ty - this.u * 0.6}px`, scale: 1.15, opacity: 1, offset: 0.45 }, { translate: '0 0', scale: 1, opacity: 1 }];
        c.el.animate(open ? k : k.slice().reverse(), { duration: 520, delay: open ? 260 + j * 110 : 0, easing: 'cubic-bezier(0.34, 1.3, 0.64, 1)', fill: 'backwards' });
      });
      if (!first && open && !reduced()) {
        const [x, y] = center(el.getBoundingClientRect());
        sparkle({ x, y }, 18);
      }
    });
    this.paintKeys();
  }
  // Ficha de llaves del marcador: cuántas tienes (se apaga sin llaves).
  paintKeys() {
    const p = this.el.querySelector('.key-pill');
    if (!p) return;
    const n = this.st.keys || 0, b = p.querySelector('b');
    if (b.textContent !== String(n)) {
      b.textContent = n;
      if (!reduced()) p.animate([{ scale: 1 }, { scale: 1.3 }, { scale: 1 }], { duration: 380, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' });
    }
    p.classList.toggle('on', n > 0);
  }
  // Carta llave jugada: una llave sale del descarte y vuela a su ficha.
  gainKey() {
    const p = this.el.querySelector('.key-pill');
    if (!p || reduced()) return this.paintKeys();
    const k = document.createElement('div');
    k.className = 'key-fly';
    k.innerHTML = icon('door');
    const [ax, ay] = center(this.wasteEl.getBoundingClientRect()), [bx, by] = center(p.getBoundingClientRect());
    k.style.cssText = `left:${ax}px;top:${ay}px`;
    this.el.append(k);
    k.animate([{ translate: '-50% -50%', scale: 0.4 }, { translate: `calc(-50% + ${(bx - ax) / 2}px) calc(-50% + ${(by - ay) / 2 - 50}px)`, scale: 1.6, offset: 0.45 }, { translate: `calc(-50% + ${bx - ax}px) calc(-50% + ${by - ay}px)`, scale: 0.6 }], { duration: 700, delay: FLY_MS, easing: 'cubic-bezier(0.5, 0, 0.3, 1)', fill: 'backwards' })
      .finished.catch(() => {})
      .then(() => {
        k.remove();
        this.paintKeys();
        sparkle({ x: bx, y: by }, 10);
        // Las puertas brillan: ya puedes escoger una.
        if (!reduced()) this.doorEls?.forEach((d) => d.classList.contains('can') && d.animate([{ scale: 1 }, { scale: 1.12 }, { scale: 1 }], { duration: 420, easing: 'ease-out' }));
      });
  }

  // ---------- Agujero negro (8 nov 2026; 9 nov: en la orilla y como la foto que mandó el usuario) ----------
  // Un ojo de luz: el disco de fuego rosa y naranja girando de lado, el anillo de luz alrededor y adentro la sombra azul
  // oscuro con su orilla blanca. Sin número (11 nov 2026): cuando faltan 2 jugadas o robos para que se trague sus cartas
  // gira más rápido, y con 1 todavía más (no se marca cuáles: se ven volar al remolino). Va en la franja de la orilla.
  makeHole() {
    if (!this.level.hole) return;
    const h = document.createElement('div');
    h.className = 'hole';
    // 9 nov 2026: dibujo con contorno de tinta como el resto del juego (el de capas de CSS se veía feo): brillo, disco de
    // atrás, halo de fuego, la sombra azul con su orilla blanca y la mitad de enfrente del disco; sus rayas giran.
    const disk = (cls) => `<g class="${cls}"><ellipse cx="60" cy="42" rx="55" ry="12" fill="url(#hdk)" stroke="#2a1f5c" stroke-width="3"/><ellipse class="hd-streak" cx="60" cy="42" rx="44" ry="8" fill="none" stroke="#fff6e0" stroke-width="2.2" stroke-dasharray="10 14" stroke-linecap="round"/><ellipse class="hd-streak b" cx="60" cy="42" rx="32" ry="5.5" fill="none" stroke="#ffe08a" stroke-width="1.8" stroke-dasharray="6 10" stroke-linecap="round"/></g>`;
    h.innerHTML = `<svg viewBox="0 0 120 84" aria-hidden="true"><defs>
      <radialGradient id="hgl"><stop offset="0" stop-color="#ff8fb0" stop-opacity=".9"/><stop offset=".6" stop-color="#ff7a59" stop-opacity=".35"/><stop offset="1" stop-color="#ff7a59" stop-opacity="0"/></radialGradient>
      <linearGradient id="hdk" x1="0" x2="1"><stop offset="0" stop-color="#ff5f7e"/><stop offset=".3" stop-color="#ffb06a"/><stop offset=".5" stop-color="#fff1d6"/><stop offset=".7" stop-color="#ffb06a"/><stop offset="1" stop-color="#ff5f7e"/></linearGradient>
      <radialGradient id="hcr" cx=".45" cy=".4"><stop offset="0" stop-color="#050b26"/><stop offset=".6" stop-color="#0e2f78"/><stop offset=".92" stop-color="#3f8fe6"/><stop offset="1" stop-color="#bfe6ff"/></radialGradient>
      <clipPath id="hfr"><rect x="0" y="42" width="120" height="42"/></clipPath></defs>
      <ellipse class="hd-glow" cx="60" cy="42" rx="60" ry="40" fill="url(#hgl)"/>
      ${disk('hd-back')}
      <circle cx="60" cy="40" r="27" fill="none" stroke="#2a1f5c" stroke-width="10"/><circle class="hd-halo" cx="60" cy="40" r="27" fill="none" stroke="#ff9a6a" stroke-width="5"/>
      <circle cx="60" cy="40" r="21" fill="url(#hcr)" stroke="#2a1f5c" stroke-width="3"/><circle cx="60" cy="40" r="18.5" fill="none" stroke="#ffffff" stroke-width="2" opacity=".9"/>
      <g clip-path="url(#hfr)">${disk('hd-front')}</g></svg>`;
    this.boardEl.append(h);
    this.holeEl = h;
    this.holeTurn = E.holeTurn(this.st);
    this.placeHole();
  }
  placeHole() {
    const b = this.railBox?.[0];
    if (!this.holeEl || !b) return;
    Object.assign(this.holeEl.style, { left: `${b.x * this.u}px`, top: `${b.y * this.u}px`, width: `${b.w * this.u}px`, height: `${b.h * this.u}px` });
  }
  // ---------- Cinturón de asteroides (10 nov 2026) ----------
  // En la orilla, una franja de piedras que flotan; encima, cuántos robos faltan para que caigan (ROCK_EVERY). Las
  // piedras que tapan cartas van en cada carta (.rock-ov, con las jugadas que les quedan; ver refresh).
  // 11 nov 2026 (pedido del usuario: estorbaba y no servía, ya saben que es cada 4 robos, como la nave o la marea): sin
  // franja ni cuenta en la orilla; las piedras caen desde arriba del tablero.
  makeRocks() {}
  // Piedras en las cartas: caen girando desde arriba (las nuevas) y se rompen en pedacitos al llegar a 0.
  paintRocks() {
    // 11 nov 2026 (pedido del usuario): caen de arriba con su fuego, de grandes a chicas; el láser las rompe con un rayo
    // y las que ya cumplieron sus jugadas se van volando hacia arriba.
    const st = this.st, laser = this.laserHit;
    this.laserHit = false;
    let k = 0;
    for (const c of this.cards) {
      if (!c.el || c.removed) continue;
      const n = st.rock?.[c.id], ov = c.el.querySelector('.rock-ov');
      c.el.classList.toggle('rocked', !!n);
      if (n && !ov) {
        const o = document.createElement('span');
        o.className = 'rock-ov';
        o.innerHTML = `<i class="rock-fire"></i>${icon('asteroide')}<b class="outl">${n}</b>`;
        c.el.append(o);
        if (!this.dealing && !reduced()) {
          const [, y] = center(c.el.getBoundingClientRect()), dy = -(y + 120), dx = -dy * 0.18, t = { duration: 700, delay: k++ * 120, easing: 'cubic-bezier(0.45, 0, 0.9, 0.55)', fill: 'backwards' };
          o.animate([{ translate: `${dx}px ${dy}px`, rotate: '-120deg', scale: 2.4 }, { translate: '0 0', rotate: '0deg', scale: 1.1, offset: 0.85 }, { translate: '0 0', scale: 1 }], t);
          o.querySelector('.rock-fire').animate([{ opacity: 1, scale: '1 1.3' }, { opacity: 1, scale: '1 1', offset: 0.8 }, { opacity: 0, scale: '1 0.4' }], { ...t, fill: 'both' });
          setTimeout(() => this.shake(c.el), t.delay + 600);
        }
      } else if (n) {
        const t = ov.querySelector('b');
        if (t.textContent !== String(n)) {
          t.textContent = n;
          if (!reduced()) ov.animate([{ scale: 1 }, { scale: 0.85, rotate: '-8deg' }, { scale: 1 }], { duration: 260 });
        }
      } else if (ov && !ov.classList.contains('crumble')) {
        ov.classList.add('crumble');
        if (reduced()) ov.remove();
        else if (laser) this.laserBreak(ov, k++);
        else ov.animate([{ translate: '0 0', scale: 1, rotate: '0deg', opacity: 1 }, { translate: `${this.u * 0.3}px ${-this.u * 0.5}px`, scale: 1.1, rotate: '40deg', opacity: 1, offset: 0.3 }, { translate: `${this.u * 1.2}px ${-innerHeight}px`, scale: 0.4, rotate: '200deg', opacity: 0 }], { duration: 700, easing: 'cubic-bezier(0.5, 0, 0.8, 0.4)' }).finished.then(() => ov.remove());
      }
    }
  }
  // Láser: un rayo rosa baja de arriba hasta la piedra y la rompe en chispas.
  laserBreak(ov, k) {
    const [x, y] = center(ov.getBoundingClientRect());
    const beam = document.createElement('i');
    beam.className = 'laser-beam';
    Object.assign(beam.style, { left: `${x}px`, height: `${y}px` });
    document.body.append(beam);
    const d = k * 110;
    beam.animate([{ scale: '1 0', opacity: 1 }, { scale: '1 1', opacity: 1, offset: 0.4 }, { scale: '1 1', opacity: 0 }], { duration: 420, delay: d, easing: 'ease-out', fill: 'backwards' }).finished.then(() => beam.remove());
    setTimeout(() => sparkle({ x, y }, 12), d + 170);
    ov.animate([{ scale: 1, opacity: 1, filter: 'brightness(1)' }, { scale: 1.15, opacity: 1, filter: 'brightness(2.2)', offset: 0.45 }, { scale: 1.6, opacity: 0, rotate: '30deg', filter: 'brightness(2.2) blur(3px)' }], { duration: 480, delay: d, easing: 'ease-out', fill: 'backwards' }).finished.then(() => ov.remove());
  }
  // Rayo (11 nov 2026, pedido del usuario: la carta liberada tapaba a las de atrás): a cada carta enterrada le cae un
  // relámpago y vuela boca abajo al final de tu mazo (las de la izquierda).
  boltFx(ids) {
    toast(`${icon('rayo')} ¡Rayo! ${ids.length === 1 ? 'Una carta de abajo se va' : `${ids.length} cartas de abajo se van`} a tu mazo`);
    buzz(25);
    const slots = this.stockEls.slice(0, ids.length);
    ids.forEach((id, k) => {
      const c = this.cards[id], el = c.el, slot = slots[ids.length - 1 - k];
      c.el = null;
      if (!el) return;
      if (reduced() || !slot) return el.remove();
      slot.style.opacity = 0;
      el.style.zIndex = 9000;
      const f0 = document.createElement('span');
      f0.className = 'bolt-fx';
      f0.innerHTML = icon('rayo');
      el.append(f0);
      el.animate([{ scale: 1 }, { scale: 1.15, offset: 0.5 }, { scale: 1 }], { duration: 360, delay: k * 150, easing: 'ease-out' });
      setTimeout(() => {
        const a = el.getBoundingClientRect(), to = slot.getBoundingClientRect();
        el.remove();
        const left = a.left + a.width / 2 - to.width / 2, top = a.top + a.height / 2 - (to.width * 1.4) / 2;
        const f = this.flyer({}, { left, top, width: to.width }, false);
        this.intoSlot(f, slot, to.left - left, to.top - top, 360).then(() => squash(slot));
      }, 380 + k * 150);
    });
  }
  // Escudo: una burbuja cubre el mazo; la nave ya no se lleva nada.
  shieldFx() {
    toast(`${icon('escudito')} ¡Escudo! La nave ya no te puede robar`);
    buzz(20);
    if (reduced()) return;
    this.stockEl.querySelector('.shield-on')?.animate([{ scale: 0.2, opacity: 0 }, { scale: 1.25, opacity: 1, offset: 0.6 }, { scale: 1 }], { duration: 520, easing: 'ease-out' });
  }
  // Constelación: cuenta cuántas lleva; al juntarlas, sus lugares se unen con líneas de luz y cae el premio. Si se
  // apaga, las estrellitas que quedan se ponen grises.
  cstFx(ev, at) {
    const L = this.level.cst;
    if (ev.cst === 'on') {
      (this.cstPts ||= []).push(at);
      this.showStreak(`${icon('star')} Constelación ${this.st.cst}/${L}`);
      return;
    }
    if (ev.cst === 'lost') {
      this.cstPts = [];
      return toast(`${icon('star')} Se apagó la constelación`);
    }
    (this.cstPts ||= []).push(at);
    const pts = this.cstPts.slice();
    this.cstPts = [];
    const p = Math.random() < CST_HELP ? { help: pickHelp(this.level) } : { coins: cstCoins() };
    if (p.coins) save.coins += p.coins;
    else save.helps[p.help] = (save.helps[p.help] || 0) + 1;
    persist();
    const h = this.history[this.history.length - 1];
    if (h) h.cstPrize = p;
    buzz([20, 40, 20]);
    const [x, y] = center(this.wasteEl.getBoundingClientRect());
    if (!reduced() && pts.length > 1) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'cst-lines');
      svg.innerHTML = `<polyline points="${pts.map(([a, b]) => `${a},${b}`).join(' ')}"/>${pts.map(([a, b]) => `<circle cx="${a}" cy="${b}" r="7"/>`).join('')}`;
      document.body.append(svg);
      setTimeout(() => svg.remove(), 1700);
      pts.forEach((q, i) => setTimeout(() => sparkle({ x: q[0], y: q[1] }, 8), 150 * i));
    }
    setTimeout(() => {
      if (p.coins) {
        flyToWallet('coins', { x, y }, p.coins, shownCoins() - p.coins);
        this.showStreak(`¡Constelación! +${p.coins} monedas`);
      } else {
        popPrize(icon(HELPS[p.help].ico), '+1', { x, y });
        this.showStreak(`¡Constelación! ${HELPS[p.help].name}`);
        this.updateCounts();
      }
    }, reduced() ? 0 : 600);
  }

  // Se las traga: cada carta que se tragó en esta vuelta (cambia de número) vuela al remolino girando y regresa.
  // Al deshacer (vuelta para atrás) vuelan las de la vuelta que se deshizo.
  holeSpin(turn) {
    const t = Math.max(turn, this.holeTurn);
    const h = this.holeEl;
    if (!h) return;
    buzz(14);
    if (reduced()) return;
    h.animate([{ scale: 1 }, { scale: 1.3, rotate: '-12deg' }, { scale: 1, rotate: '0deg' }], { duration: 760, easing: 'ease-in-out' });
    const hr = h.getBoundingClientRect(), [hx, hy] = center(hr);
    let k = 0;
    for (const c of this.cards) {
      if (!E.holeTook(c, t) || c.removed || !c.el) continue;
      const [x, y] = center(c.el.getBoundingClientRect());
      c.el.animate(
        [
          { translate: '0 0', scale: 1, rotate: `${c.rot}deg` },
          { translate: `${(hx - x) * 0.9}px ${(hy - y) * 0.9}px`, scale: 0.15, rotate: `${c.rot + 260}deg`, offset: 0.45 },
          { translate: `${(hx - x) * 0.9}px ${(hy - y) * 0.9}px`, scale: 0.15, rotate: `${c.rot + 300}deg`, offset: 0.55 },
          { translate: '0 0', scale: 1, rotate: `${c.rot + 360}deg` },
        ],
        { duration: 760 + (k++ % 5) * 40, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' },
      );
    }
  }

  // ---------- Mesa enrollada ----------
  // La tira (scrollStrip en levels.js) corre siempre hacia la izquierda con el rollo a la derecha, también con el
  // teléfono parado (ahí sale más chica). Se ve una ventana de this.view (lo que cabe; ver layoutScroll); las cartas
  // salen del rollo de una en una, cortadas en la orilla del rollo aunque estén giradas. Fuera del rollo valen las
  // tapas de siempre: una carta que asoma pero tiene otra encima sigue boca abajo.
  scrollO() {
    const { S } = this.scrollBase();
    let o = Infinity;
    for (const c of this.cards) if (!c.removed) o = Math.min(o, scrollSpan(c, S.at)[0]);
    return o === Infinity ? (this.scrollAt ?? 0) : o;
  }

  // Medidas fijas de la tira, en unidades de carta.
  scrollBase() {
    if (this.sBase) return this.sBase;
    const gs = this.level.groups;
    return (this.sBase = { S: scrollStrip(gs), pad: 0.25, rollT: 0.8, cross: Math.max(...gs.map((g) => g.h)) + 0.5 });
  }

  // Lo que depende de la ventana (this.view: cuánta tira se ve) y de cuánto avanzó (o).
  scrollGeo(o = this.scrollAt, view = this.view) {
    const B = this.scrollBase();
    const rollAt = B.pad + view; // donde empieza el rollo; las cartas se cortan a la mitad del rollo
    const cutAt = rollAt + B.rollT / 2;
    // Cuánto de la carta sigue dentro del rollo (0 = afuera completa, 1 = escondida).
    const cut = (c) => {
      const [l, r] = scrollSpan(c, B.S.at);
      return Math.max(0, Math.min(1, (B.pad + r - o - cutAt) / (r - l)));
    };
    return { ...B, o, rollAt, cutAt, along: rollAt + B.rollT + 0.1, cut, left: Math.max(0, B.S.end - o - view) };
  }

  // El tamaño de carta es el que deja la tira con la ventana mínima (SCROLL_VIEW); si con ese tamaño cabe más tira
  // (teléfono acostado, pantalla grande), se ven más cartas. Al girar se vuelve a calcular con la pantalla nueva,
  // pero la ventana nunca queda tan corta que vuelva a enrollar una carta que ya salió (keepView). Con otra ventana
  // cambian las tapas (scrollCover; con view ≥ SCROLL_VIEW el nivel sigue teniendo solución) y se repinta.
  layoutScroll(r) {
    this.scrollAt ??= this.scrollO();
    const B = this.scrollBase(), along = r.width - 10, extra = B.pad + B.rollT + 0.1;
    const keep = this.view == null ? SCROLL_VIEW : Math.max(SCROLL_VIEW, this.keepView());
    let u = Math.min((r.height - 10) / B.cross, along / (extra + keep), 120);
    const view = Math.max(keep, along / u - extra);
    if (Math.abs(view - (this.view || 0)) > 1e-6) {
      const grew = this.view != null;
      this.view = view;
      const cov = scrollCover(this.level, view);
      this.level.cards.forEach((c, i) => (c.coveredBy = this.cards[i].coveredBy = cov[i]));
      if (grew) queueMicrotask(() => this.refresh());
    }
    this.u = u = Math.max(18, u);
    const G = this.scrollGeo();
    this.boardEl.style.width = `${G.along * u}px`;
    this.boardEl.style.height = `${G.cross * u}px`;
    this.boardEl.style.setProperty('--cw', `${u}px`);
    this.cards.forEach((c) => c.el && this.place(c));
    this.paintRoll();
    this.renderStock();
    this.coach?.update();
  }

  // Ventana más corta con la que todas las cartas que ya salieron del rollo siguen afuera: una carta sale cuando la
  // tira empieza (o) en su orilla izquierda + SCROLL_SHOW − ventana o más adelante.
  keepView() {
    const { S } = this.scrollBase(), o = this.scrollO();
    let need = 0;
    for (const c of this.cards) {
      if (c.removed) continue;
      const l = scrollSpan(c, S.at)[0];
      if (l + SCROLL_SHOW - this.view <= o + 1e-6) need = Math.max(need, l + SCROLL_SHOW - o);
    }
    return need;
  }

  placeScroll(c) {
    const B = this.scrollBase();
    c.el.style.left = `${(B.pad + B.S.at[c.group] + c.x - this.scrollAt) * this.u}px`;
    c.el.style.top = `${((B.cross - this.level.groups[c.group].h) / 2 + c.y) * this.u}px`;
    c.el.style.rotate = `${c.rot}deg`;
  }

  // La alfombra empieza un poco antes de la primera carta y llega hasta el rollo: al avanzar, su inicio se corre
  // con las cartas y se sale de la pantalla (que la recorta). El rollo se adelgaza mientras menos le queda adentro.
  rugBox(o = this.scrollAt) {
    const G = this.scrollGeo(o), u = this.u, left = (G.pad - 0.2 - o) * u;
    return { left: `${left}px`, width: `${G.cutAt * u - left}px` };
  }

  paintRoll() {
    if (!this.rollEl) return;
    const G = this.scrollGeo(), u = this.u;
    const t = G.rollT * u * (G.left > 0 ? 0.55 + 0.45 * Math.min(1, G.left / 8) : 0.35);
    const mid = G.cutAt * u;
    Object.assign(this.rugEl.style, { ...this.rugBox(), top: 0, height: '100%' });
    this.stripEl.style.clipPath = `inset(-100vh ${(G.along - G.cutAt) * u}px -100vh -100vw)`;
    Object.assign(this.rollEl.style, { left: `${mid - t / 2}px`, top: `${-u * 0.12}px`, width: `${t}px`, height: `calc(100% + ${u * 0.24}px)` });
    this.rollEl.classList.toggle('empty', G.left <= 0);
  }

  // Al empezar: el rollo sale gordo desde el inicio de la alfombra y rueda hasta su lugar desenrollándola; luego se
  // ponen las cartas encima, de izquierda a derecha, ya como van (sin voltearse).
  async unroll(live) {
    const u = this.u, rug = this.rugEl, roll = this.rollEl;
    const from = parseFloat(rug.style.left) - parseFloat(roll.style.left); // del inicio de la alfombra a su lugar
    const D = 1000, ease = 'cubic-bezier(.3,.1,.25,1)';
    const G = this.scrollGeo(), shown = live.filter((c) => G.cut(c) < 1);
    for (const c of live) c.el.style.opacity = 0;
    rug.animate([{ clipPath: 'inset(-40px 100% -60px -40px)' }, { clipPath: 'inset(-40px 0px -60px -40px)' }], { duration: D, easing: ease });
    roll.animate([{ translate: `${from}px 0`, scale: '1.5 1' }, { translate: '0 0', scale: 1 }], { duration: D, easing: ease });
    roll.querySelector('i').animate([{ backgroundPosition: `${-from}px 0` }, { backgroundPosition: '0 0' }], { duration: D, easing: ease });
    buzz(12);
    await wait(D - 150);
    for (const c of live) {
      c.el.style.opacity = '';
      c.el.classList.add('noflip');
      c.el.classList.toggle('up', this.shownUp(c));
    }
    shown.sort((a, b) => parseFloat(a.el.style.left) - parseFloat(b.el.style.left) || a.z - b.z);
    const step = Math.min(35, 1100 / shown.length);
    const anims = shown.map((c, i) =>
      c.el.animate([{ translate: `0 ${-u * 0.6}px`, scale: 1.25, opacity: 0 }, { translate: '0 0', scale: 1, opacity: 1 }], { duration: 300, delay: i * step, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' }),
    );
    await Promise.all(anims.map((a) => a.finished.catch(() => {})));
    for (const c of live) c.el.classList.remove('noflip');
  }

  // ---------- Gravedad ----------
  // Columnas en rieles: abajo la carta que se juega, encima la que sigue (boca arriba, para planear) y arriba de
  // todo la pila con las demás boca abajo (se ven hasta 5 de canto; el número dice cuántas quedan).
  layoutGrav(r) {
    const n = this.level.cols.length, gap = 0.42, pad = 0.2;
    const G = { gap, pad, pile: 0.45, row1: 0.45 + 1.4 + 0.3 };
    G.row0 = G.row1 + 1.4 + 0.16;
    G.bw = n + (n - 1) * gap + pad * 2;
    G.bh = G.row0 + 1.4 + 0.32;
    this.u = Math.max(18, Math.min((r.width - 10) / G.bw, (r.height - 10) / G.bh, 120));
    this.gravG = G;
    const u = this.u;
    this.boardEl.style.width = `${G.bw * u}px`;
    this.boardEl.style.height = `${G.bh * u}px`;
    this.boardEl.style.setProperty('--cw', `${u}px`);
    this.railEls.forEach((el, i) => Object.assign(el.style, { left: `${(pad + i * (1 + gap) - 0.12) * u}px`, width: `${1.24 * u}px`, top: 0, height: `${G.bh * u}px` }));
    this.cards.forEach((c) => c.el && this.place(c));
    this.paintGrav();
    this.renderStock();
    this.coach?.update();
  }

  // Lugar de la carta en su columna: 0 = abajo (la que se juega), 1 = la que sigue, 2+ = en la pila.
  gravIndex(c) {
    const col = this.level.cols[c.group];
    let k = 0;
    for (const id of col) {
      if (id === c.id) return k;
      if (!this.st.rem[id]) k++;
    }
    return k;
  }

  placeGrav(c) {
    const G = this.gravG;
    if (!G) return;
    const k = this.gravIndex(c), j = k - 2, u = this.u;
    const y = k === 0 ? G.row0 : k === 1 ? G.row1 : G.pile - Math.min(j, 4) * 0.09;
    c.el.style.left = `${(G.pad + c.group * (1 + G.gap)) * u}px`;
    c.el.style.top = `${y * u}px`;
    c.el.style.rotate = '0deg';
    c.el.style.zIndex = k === 0 ? 900 : k === 1 ? 800 : 700 - j;
    c.el.classList.toggle('g-next', k === 1);
    c.el.classList.toggle('g-deep', j > 4);
    c.gPos = { y, k };
  }

  // Cuántas quedan en la pila de cada columna.
  paintGrav() {
    this.railEls?.forEach((el, i) => {
      const left = this.level.cols[i].filter((id) => !this.st.rem[id]).length - 2;
      const b = el.querySelector('.g-n');
      b.textContent = left > 0 ? left : '';
      b.classList.toggle('on', left > 0);
    });
  }

  // Al quitar la de abajo, la columna cae un lugar y rebota al llegar; al deshacer, sube de regreso.
  gravUpdate() {
    const u = this.u;
    let fell = 0;
    for (const c of this.cards) {
      if (!c.el || !c.gPos) continue;
      const p = c.gPos;
      this.placeGrav(c);
      const dy = (p.y - c.gPos.y) * u;
      if (reduced() || Math.abs(dy) < 0.5) continue;
      if (dy < 0) {
        fell++;
        c.el.animate(
          [
            { translate: `0 ${dy}px`, scale: 1, easing: 'cubic-bezier(.5,0,.9,.6)' },
            { translate: '0 0', scale: '1.05 .93', offset: 0.62, easing: 'cubic-bezier(.2,.8,.3,1)' },
            { translate: `0 ${-u * 0.07}px`, scale: '.98 1.03', offset: 0.82 },
            { translate: '0 0', scale: 1 },
          ],
          { duration: 470 + c.gPos.k * 30, delay: Math.min(c.gPos.k, 3) * 25 },
        );
      } else c.el.animate([{ translate: `0 ${dy}px` }, { translate: '0 0' }], { duration: 420, easing: 'cubic-bezier(.3,1.2,.5,1)' });
    }
    if (fell) setTimeout(() => buzz(8), 300);
    this.paintGrav();
  }

  // ---------- Mesa plegable ----------
  // Tres tapetes en fila (o en columna con el teléfono parado, si así salen más grandes las cartas), todos del tamaño
  // del panel más grande, con bisagras entre ellos. El de en medio es el grupo 0; los lados, 1 y 2. Doblado, cada
  // lado está girado media vuelta sobre su bisagra y queda escondido debajo del de en medio.
  layoutFold(r) {
    const gs = this.level.groups, pad = 0.3, hinge = 0.16;
    const PW = Math.max(...gs.map((g) => g.w)) + 1 + pad * 2, PH = Math.max(...gs.map((g) => g.h)) + 1.4 + pad * 2;
    const W = r.width - 10, H = r.height - 10;
    const row = { bw: 3 * PW + 2 * hinge, bh: PH }, col = { bw: PW, bh: 3 * PH + 2 * hinge };
    const fit = (o) => Math.min(W / o.bw, H / o.bh, 120);
    const across = fit(row) >= fit(col);
    const o = across ? row : col;
    this.u = Math.max(18, fit(o));
    this.foldG = { across, PW, PH, pad, hinge };
    this.boardEl.style.width = `${o.bw * this.u}px`;
    this.boardEl.style.height = `${o.bh * this.u}px`;
    this.boardEl.style.setProperty('--cw', `${this.u}px`);
    this.paintFold();
    this.cards.forEach((c) => c.el && this.place(c));
    this.renderStock();
    this.coach?.update();
  }

  // Esquina de cada tapete (en unidades de carta). Lugar 0 = izquierda/arriba, 1 = en medio, 2 = derecha/abajo.
  foldBox(gi) {
    const G = this.foldG, k = [1, 0, 2][gi];
    return G.across ? { x: k * (G.PW + G.hinge), y: 0 } : { x: 0, y: k * (G.PH + G.hinge) };
  }

  // Giro de un lado (sobre la bisagra que lo une al de en medio): k = 1 doblado, 0 abierto.
  foldTurn(gi, k = 1) {
    const a = k * (gi === 1 ? 180 : -180);
    return `perspective(${this.u * 14}px) ${this.foldG.across ? `rotateY(${a}deg)` : `rotateX(${-a}deg)`}`;
  }

  paintFold() {
    const G = this.foldG, u = this.u;
    if (this.foldShown == null) this.foldShown = this.foldOpen = E.nebOut(this.level, this.st) >= 1;
    const box = (el, gi) => {
      const b = this.foldBox(gi);
      Object.assign(el.style, { left: `${b.x * u}px`, top: `${b.y * u}px`, width: `${G.PW * u}px`, height: `${G.PH * u}px` });
    };
    box(this.foldMid, 0);
    this.foldMid.classList.toggle('folded', !this.foldOpen);
    this.foldMid.classList.toggle('across', G.across);
    for (const gi of [1, 2]) {
      const el = this.foldEls[gi];
      box(el, gi);
      el.style.transformOrigin = G.across ? (gi === 1 ? 'right center' : 'left center') : gi === 1 ? 'center bottom' : 'center top';
      el.style.transform = this.foldOpen ? '' : this.foldTurn(gi);
    }
    // Dos bisagras en cada unión.
    const m = this.foldBox(0);
    this.hingeEls.forEach((h, i) => {
      const side = i < 2 ? -1 : 1, at = i % 2 ? 0.75 : 0.25;
      const [x, y] = G.across ? [m.x + (side < 0 ? -G.hinge / 2 : G.PW + G.hinge / 2), m.y + G.PH * at] : [m.x + G.PW * at, m.y + (side < 0 ? -G.hinge / 2 : G.PH + G.hinge / 2)];
      Object.assign(h.style, { left: `${x * u}px`, top: `${y * u}px` });
      h.classList.toggle('across', G.across);
      h.classList.toggle('shut', !this.foldOpen);
    });
  }

  // Las del panel de en medio van en el tablero; las de los lados, dentro de su tapete.
  placeFold(c) {
    const G = this.foldG;
    if (!G) return;
    const g = this.level.groups[c.group], b = c.group ? { x: 0, y: 0 } : this.foldBox(0);
    c.el.style.left = `${(b.x + (G.PW - g.w) / 2 + c.x) * this.u}px`;
    c.el.style.top = `${(b.y + (G.PH - g.h) / 2 + c.y) * this.u}px`;
    c.el.style.rotate = `${c.rot}deg`;
  }

  // Al vaciar el panel de en medio, los lados se despliegan uno tras otro y luego sus cartas se voltean.
  // Deshacer: las cartas se voltean boca abajo y los lados se vuelven a doblar.
  foldUpdate() {
    const open = E.nebOut(this.level, this.st) >= 1;
    if (!this.foldG || open === this.foldOpen) return;
    this.foldOpen = open;
    const D = reduced() ? 0 : 820;
    const sides = [1, 2].map((gi) => [gi, this.foldEls[gi]]);
    if (open) {
      this.foldMid.classList.remove('folded');
      sides.forEach(([gi, el], i) => {
        el.style.transform = '';
        if (D) el.animate([{ transform: this.foldTurn(gi) }, { transform: this.foldTurn(gi, 0) }], { duration: D, delay: i * 160, easing: 'cubic-bezier(.3,1.2,.45,1)', fill: 'backwards' });
      });
      this.hingeEls.forEach((h) => h.classList.remove('shut'));
      if (D) this.foldMid.animate([{ scale: 1 }, { scale: 1.03 }, { scale: 1 }], { duration: 300, easing: 'ease-out' });
      buzz(14);
      setTimeout(() => {
        if (!this.foldOpen) return;
        this.foldShown = true;
        this.refresh();
      }, D + 200);
    } else {
      this.foldShown = false;
      setTimeout(() => {
        if (this.foldOpen) return;
        sides.forEach(([gi, el]) => {
          el.style.transform = this.foldTurn(gi);
          if (D) el.animate([{ transform: this.foldTurn(gi, 0) }, { transform: this.foldTurn(gi) }], { duration: D * 0.7, easing: 'ease-in-out' });
        });
        this.foldMid.classList.add('folded');
        this.hingeEls.forEach((h) => h.classList.add('shut'));
      }, D ? 380 : 0);
    }
  }

  // ---------- Nebulosa ----------
  // Se ven NEB_SLOTS lugares en fila (o en columna con el teléfono parado, si así salen más grandes las cartas) y al
  // final la nebulosa. Cada lugar mide lo del tramo más grande. En qué lugar va cada tramo sale del estado: los que
  // ya salieron y siguen con cartas, en orden; así deshacer los regresa solos.
  layoutNeb(r) {
    const gs = this.level.groups, gap = 0.35, ND = 1.9, n = NEB_SLOTS;
    const SW = Math.max(...gs.map((g) => g.w)), SH = Math.max(...gs.map((g) => g.h));
    const W = r.width - 10, H = r.height - 10;
    const row = { bw: n * (SW + gap) + ND, bh: Math.max(SH, ND) }, col = { bw: Math.max(SW, ND), bh: n * (SH + gap) + ND };
    const fit = (o) => Math.min(W / o.bw, H / o.bh, 120);
    const across = fit(row) >= fit(col);
    const o = across ? row : col;
    this.u = Math.max(18, fit(o));
    this.nebG = { across, SW, SH, gap, ND, ...o, nx: across ? n * (SW + gap) + ND / 2 : o.bw / 2, ny: across ? o.bh / 2 : n * (SH + gap) + ND / 2 };
    this.boardEl.style.width = `${o.bw * this.u}px`;
    this.boardEl.style.height = `${o.bh * this.u}px`;
    this.boardEl.style.setProperty('--cw', `${this.u}px`);
    this.paintNeb();
    this.cards.forEach((c) => c.el && this.place(c));
    this.renderStock();
    this.coach?.update();
  }

  // Lugar de cada tramo (-1 = sigue en la nebulosa) y cuántos faltan por salir.
  nebSlots() {
    const out = E.nebOut(this.level, this.st), slot = [];
    let k = 0;
    this.level.neb.forEach((t, gi) => (slot[gi] = gi >= NEB_SLOTS + out ? -1 : t.every((j) => this.st.rem[j]) ? null : k++));
    return { slot, left: Math.max(0, this.level.neb.length - NEB_SLOTS - out) };
  }

  placeNeb(c) {
    if (!this.nebG) return; // el tablero aún no tiene tamaño: lo acomoda layoutNeb
    const G = this.nebG, u = this.u, g = this.level.groups[c.group];
    const k = this.nebSlots().slot[c.group];
    let x, y;
    if (k < 0) [x, y] = [G.nx - 0.5, G.ny - 0.7];
    else if (G.across) [x, y] = [k * (G.SW + G.gap) + (G.SW - g.w) / 2 + c.x, (G.bh - g.h) / 2 + c.y];
    else [x, y] = [(G.bw - g.w) / 2 + c.x, k * (G.SH + G.gap) + (G.SH - g.h) / 2 + c.y];
    c.el.style.left = `${x * u}px`;
    c.el.style.top = `${y * u}px`;
    c.el.style.rotate = `${k < 0 ? c.rot + ((c.id * 47) % 90) - 45 : c.rot}deg`;
    c.el.classList.toggle('neb-hid', k < 0);
    c.nebPos = { x, y, hid: k < 0 };
  }

  // La nebulosa se achica mientras menos tramos le quedan y se apaga al soltar el último.
  paintNeb() {
    if (!this.nebEl || !this.nebG) return;
    const G = this.nebG, u = this.u, { left } = this.nebSlots();
    Object.assign(this.nebEl.style, { left: `${(G.nx - G.ND / 2) * u}px`, top: `${(G.ny - G.ND / 2) * u}px`, width: `${G.ND * u}px`, height: `${G.ND * u}px` });
    this.nebEl.style.setProperty('--k', left ? 0.6 + 0.4 * Math.min(1, left / 4) : 0.25);
    this.nebEl.classList.toggle('empty', !left);
  }

  // Tras cada jugada (o deshacer): los tramos se recorren a su nuevo lugar, el que sale gira desde la nebulosa y,
  // al deshacer, el último que salió regresa a ella.
  nebUpdate() {
    const D = reduced() ? 0 : 520, ease = 'cubic-bezier(.45,0,.2,1)', u = this.u;
    let born = 0;
    for (const c of this.cards) {
      if (!c.el || !c.nebPos) continue;
      const p = c.nebPos;
      this.placeNeb(c);
      const q = c.nebPos;
      if (!D || (p.x === q.x && p.y === q.y && p.hid === q.hid)) continue;
      const tr = `${(p.x - q.x) * u}px ${(p.y - q.y) * u}px`;
      if (p.hid && !q.hid) {
        c.el.animate([{ translate: tr, scale: 0.15, opacity: 0, rotate: `${c.rot - 200}deg` }, { translate: '0 0', scale: 1, opacity: 1, rotate: `${c.rot}deg` }],
          { duration: 650, delay: 180 + born++ * 45, easing: 'cubic-bezier(.3,1.25,.5,1)', fill: 'backwards' });
      } else if (!p.hid && q.hid) {
        c.el.animate([{ translate: tr, scale: 1, opacity: 1, rotate: `${c.rot}deg` }, { translate: '0 0', scale: 0.15, opacity: 0, rotate: `${c.rot + 200}deg` }], { duration: 480, easing: 'ease-in' });
      } else c.el.animate([{ translate: tr }, { translate: '0 0' }], { duration: D, easing: ease });
    }
    if (born && this.nebEl) {
      this.nebEl.animate([{ scale: 1 }, { scale: 1.25 }, { scale: 1 }], { duration: 600, easing: 'ease-out' });
      buzz(12);
    }
    setTimeout(() => this.paintNeb(), born ? 300 : 0);
  }

  // Avanza (o regresa, al deshacer) la mesa: todo se corre hacia el inicio y las cartas salen del rollo.
  scrollUpdate() {
    const o = this.scrollO();
    if (this.scrollAt == null || Math.abs(o - this.scrollAt) < 1e-6) return;
    const before = this.scrollAt;
    const B = this.scrollGeo(before), from = new Map(this.cards.filter((c) => c.el).map((c) => [c, [parseFloat(c.el.style.left), B.cut(c)]]));
    this.scrollAt = o;
    const G = this.scrollGeo();
    const D = reduced() ? 0 : Math.min(900, 380 + Math.abs(o - before) * 160);
    const ease = 'cubic-bezier(.45,0,.2,1)';
    for (const c of this.cards) {
      if (!c.el) continue;
      const [x0, f0] = from.get(c);
      this.place(c);
      if (D && (f0 < 1 || G.cut(c) < 1)) c.el.animate([{ translate: `${x0 - parseFloat(c.el.style.left)}px 0` }, { translate: '0 0' }], { duration: D, easing: ease });
    }
    // La alfombra entera (con su orilla) se corre con las cartas y el rollo gira.
    const d = (o - before) * this.u;
    if (D && d) {
      const tr = `${-d}px 0`;
      const rug0 = this.rugBox(before);
      Object.assign(this.rugEl.style, this.rugBox());
      this.rugEl.animate([rug0, this.rugBox()], { duration: D, easing: ease });
      this.rollEl.querySelector('i').animate([{ backgroundPosition: '0 0' }, { backgroundPosition: tr }], { duration: D, easing: ease });
      this.rollEl.animate([{ scale: 1 }, { scale: '1.1 1' }, { scale: 1 }], { duration: D, easing: 'ease-in-out' });
    }
    setTimeout(() => this.paintRoll(), D * 0.6);
    if (d > 0) buzz(12);
  }

  // ¿Se ve boca arriba? En la mesa enrollada el rollo no voltea cartas: salen como van (solo cuentan las tapas de
  // otras cartas); una que asoma poco ya se ve, pero hasta que asoma media carta no se puede jugar.
  shownUp(c) {
    // Plegable: las de los lados se voltean cuando ya se desdoblaron.
    if (this.foldEls && c.group && !this.foldShown) return false;
    if (this.level.scroll === 'gravedad') return E.faceUp(this.level, this.gravIndex(c) < GRAV_SHOWN ? { ...c, coveredBy: [] } : c, this.st);
    return E.faceUp(this.level, this.level.scroll === 'mesa' ? { ...c, coveredBy: c.under } : c, this.st);
  }

  // Pinta lo que depende del estado: boca arriba, candados, cortinas, hielo, bomba y carta viva.
  refresh() {
    const { level, st } = this;
    if (level.scroll === 'mesa') this.scrollUpdate();
    else if (level.scroll === 'gravedad') this.gravUpdate();
    else if (level.scroll === 'plegable') this.foldUpdate();
    else if (level.scroll) this.nebUpdate();
    this.updateStuck(true);
    this.doorUpdate();
    // Banda: cada acción la mueve un lugar (y su cinta avanza).
    if (this.beltEl) {
      for (const c of this.cards) if (c.belt && c.el && !c.removed) this.placeBelt(c);
      const t = this.st.actions;
      if (t !== this.beltT && this.beltT != null && !reduced()) this.beltEl.querySelector('.belt-track').animate([{ backgroundPosition: '0 0' }, { backgroundPosition: this.level.belt.dir === 'h' ? '-24px 0' : '0 -24px' }], { duration: 350, easing: 'ease-out' });
      this.beltT = t;
      this.beltEl.classList.toggle('frozen', this.st.freeze > 0);
    }
    if (this.holeEl) {
      const turn = E.holeTurn(st);
      if (turn !== this.holeTurn && this.holeTurn != null) this.holeSpin(turn);
      this.holeTurn = turn;
      // 11 nov 2026 (pedido del usuario): sin número; a 2 de tragarse las cartas gira más rápido y a 1, todavía más.
      this.holeEl.classList.toggle('warm', E.holeLeft(st) === 2);
      this.holeEl.classList.toggle('hot', E.holeLeft(st) === 1);
      // A 1 de tragárselas, las cartas del tablero tiemblan como si las jalara (no con el reloj de arena).
      this.boardEl.classList.toggle('hole-pull', E.holeLeft(st) === 1 && !(st.freeze > 0));
      this.holeEl.classList.toggle('frozen', st.freeze > 0);
    }
    if (level.rocks) {
      this.paintRocks();
      // 11 nov 2026 (pedido del usuario): a 1 robo de que caigan piedras, las cartas tiemblan (como con el agujero negro).
      this.boardEl.classList.toggle('hole-pull', E.rockLeft(st) === 1 && !(st.freeze > 0));
    }
    // Escudo puesto: una burbuja con el escudo sobre el mazo.
    if (level.ship) {
      const on = !!st.shield, b = this.stockEl.querySelector('.shield-on');
      if (on && !b) this.stockEl.insertAdjacentHTML('beforeend', `<span class="shield-on">${icon('escudito')}</span>`);
      else if (!on && b) b.remove();
    }
    // Constelación apagada (11 nov 2026, pedido del usuario): sus cartas vuelven a ser normales, de frente y boca abajo
    // (sin estrellita ni orilla dorada). Al deshacer, regresan.
    if (level.cst && (st.cst === -1) !== !!this.cstOff) {
      this.cstOff = st.cst === -1;
      for (const c of this.cards) {
        const box = c.cst && c.el?.querySelector('.inner');
        const x = { ...c, cst: this.cstOff ? 0 : 1 };
        if (box) box.innerHTML = faceHTML(x, E.rankOf(c, st)) + backHTML(x);
      }
    }
    for (const c of this.cards) {
      if (c.removed || !c.el) continue;
      const el = c.el;
      if (!this.dealing) el.classList.toggle('up', this.shownUp(c));
      // Rayo: la carta liberada va por encima de las que la tapaban.
      const lifted = !!st.lift?.includes(c.id);
      if (lifted !== el.classList.contains('lifted')) {
        el.classList.toggle('lifted', lifted);
        el.style.zIndex = lifted ? 9000 + c.id : c.z * 100 + c.id;
      }
      if (c.lock != null) el.classList.toggle('unlocked', E.lockOpen(level, c, st));
      if (c.curtain != null) el.classList.toggle('curtain-open', E.curtainOpen(level, c, st));
      if (c.ice) {
        const left = E.iceLeft(c, st);
        el.querySelector('.ice-ov b').textContent = left || '';
        el.classList.toggle('melted', !left);
      }
      // Marea: bajo el agua la carta se cubre de ola (sube y baja animada).
      if (c.wet) el.classList.toggle('wet', E.underWater(c, st));
      // Fantasma: escondido se desvanece y solo queda su silueta punteada, sin decir qué carta es (sigue tapando).
      // Se va y vuelve con un desvanecido (sin ícono: se entiende al verlo aparecer y desaparecer).
      // 8 nov 2026: el desvanecido va en la cara de enfrente, no en .inner. La opacidad (o el desenfoque) en .inner
      // aplana el 3D y en iPhone dejaba ver el número a través del reverso al aparecer o esconderse.
      if (c.ghost) {
        const out = !E.ghostShown(c, st), was = el.classList.contains('ghost-out');
        el.classList.toggle('ghost-out', out);
        if (was !== out && !reduced() && el.classList.contains('up')) el.querySelector('.front')?.animate([{ opacity: out ? 1 : 0, filter: 'blur(3px)' }, { opacity: out ? 0 : 1, filter: 'blur(0)' }], { duration: 380, easing: 'ease-out' });
      }
      // Camaleón: cuando es comodín se cubre de dorado con su carita; al convertirse la carta se aguada y rebota
      // (como masa que cambia de forma) y la carita parpadea. De normal la carita es sutil.
      if (c.cham) {
        const w = E.chamWild(c, st), was = el.classList.contains('cham-wild');
        el.classList.toggle('cham-wild', w);
        if (was !== w && !reduced() && el.classList.contains('up')) {
          el.querySelector('.cham-ov')?.animate(w ? [{ opacity: 0, clipPath: 'circle(0% at 50% 60%)' }, { opacity: 1, clipPath: 'circle(80% at 50% 60%)' }] : [{ opacity: 1, clipPath: 'circle(80% at 50% 60%)' }, { opacity: 1, clipPath: 'circle(0% at 50% 60%)' }], { duration: 420, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' });
          el.querySelector('.inner')?.animate([{ scale: '1 1' }, { scale: '1.1 0.86', offset: 0.3 }, { scale: '0.93 1.08', offset: 0.6 }, { scale: '1.03 0.98', offset: 0.8 }, { scale: '1 1' }], { duration: 520, easing: 'ease-out' });
        }
      }
      // Agujero negro: el número cambia a la mitad del viaje al remolino (o de una vez si no hay animación).
      if (c.ring) {
        const r = E.rankOf(c, st), was = el.dataset.rank;
        if (was !== String(r)) {
          el.dataset.rank = r;
          const set = () => {
            for (const sel of ['.front .big', '.front .rk']) {
              const t = el.querySelector(sel);
              if (!t) continue;
              t.textContent = RANKS[r];
              t.classList.toggle('uline', RANKS[r] === '6' || RANKS[r] === '9');
              if (sel === '.front .big') t.classList.toggle('ten', RANKS[r] === '10');
            }
          };
          if (was == null || reduced() || !this.holeEl) set();
          else setTimeout(set, 340);
        }
      }
      // Reloj de arena: las cartas con cuenta se ven congeladas mientras dure.
      if (c.bomb || c.comet || c.live || c.ghost || c.cham || c.ring) el.classList.toggle('frozen', st.freeze > 0);
      if (c.bomb) {
        const left = E.bombLeft(c, st);
        el.querySelector('.bomb-face b').textContent = left == null ? '' : left;
        el.classList.toggle('bomb-hot', left != null && left <= 2);
      }
      // Cometa: su cuenta arriba y abajo lo que sumaría si lo destapas con la siguiente jugada.
      if (c.comet) {
        const left = E.cometLeft(c, st);
        el.querySelector('.comet-face b').textContent = left == null ? '' : left;
        el.querySelector('.comet-face em').textContent = `+${E.cometWish(level, { streak: st.streak + (st.turbo > 0 ? 2 : 1) })}`;
        el.classList.toggle('comet-hot', left != null && left <= 2);

      }
      if (c.live) {
        const r = E.rankOf(c, st);
        if (el.dataset.rank !== String(r)) {
          const old = el.dataset.rank;
          el.dataset.rank = r;
          // Solo cambia el número grande (la carta no se mueve): el viejo sale y el nuevo entra hacia donde apunta.
          const big = el.querySelector('.front .big');
          big.textContent = RANKS[r];
          big.classList.toggle('ten', RANKS[r] === '10');
          big.classList.toggle('uline', RANKS[r] === '6' || RANKS[r] === '9');
          if (old != null && !reduced()) {
            const up = c.live > 0 ? 1 : -1;
            big.animate(
              [{ translate: `0 ${up * 45}%`, scale: 0.6, opacity: 0 }, { translate: `0 ${-up * 6}%`, scale: 1.15, opacity: 1, offset: 0.6 }, { translate: '0 0', scale: 1, opacity: 1 }],
              { duration: 340, easing: 'ease-out' },
            );
            el.querySelector('.front .dir')?.animate([{ translate: '0 0' }, { translate: `0 ${-up * 25}%` }, { translate: '0 0' }], { duration: 340, easing: 'ease-out' });
          }
        }
      }
    }
  }

  renderPiles() {
    this.renderStock();
    this.renderWaste();
  }

  // Mazo en abanico alineado a la derecha: la carta de la derecha es la siguiente que sale.
  // El ancho es fijo (según el mazo más grande que ha tenido), así robar no empuja la bandeja;
  // lo que se recorre es el manojo.
  renderStock() {
    const n = this.stock.length;
    const cw = this.stockEl.offsetHeight / 1.4 || 56;
    // Contando de una vez lo que traen las cartas regalo: así el mazo no se ensancha (ni mueve la bandeja) al llegar.
    this.stockMax = Math.max(this.stockMax || 0, n, 1, this.level.stock.length + this.cards.reduce((t, c) => t + (c.pack?.length || 0), 0));
    const m = this.stockMax;
    const step = m > 1 ? Math.min(cw * 0.16, (cw * 1.6) / (m - 1)) : 0;
    const right = step * (m - 1);
    this.stockEl.style.width = `${cw + right}px`;
    const els = (this.stockEls ||= []);
    while (els.length > n) els.pop().remove();
    while (els.length < n) {
      const d = document.createElement('div');
      d.className = 'card';
      d.style.left = `${right}px`;
      d.innerHTML = inner({});
      this.stockEl.append(d);
      els.push(d);
    }
    // els[i] es stock[n - 1 - i]. Premios de racha: carta con reverso violeta, comodín dorado.
    els.forEach((d, i) => {
      const c = this.stock[n - 1 - i];
      d.style.left = `${right - (n - 1 - i) * step}px`;
      d.classList.toggle('gift-card', !!c?.reward && !c.wild);
      d.classList.toggle('gift-wild', !!c?.reward && !!c.wild);
      // Cohete turbo en el mazo: se ve en el reverso, para verlo venir.
      if (!!c?.turbo !== d.classList.contains('turbo')) {
        d.classList.toggle('turbo', !!c?.turbo);
        d.innerHTML = inner(c?.turbo ? { turbo: true } : {});
      }
    });
    this.stockEl.querySelector('.count, .empty-slot')?.remove();
    // Mazo vacío: queda un hueco punteado con "+5"; al tocarlo sale la ventana de compra.
    this.stockEl.querySelector('.buy5')?.remove();
    if (n) this.stockEl.insertAdjacentHTML('beforeend', `<span class="badge count">${n}</span>`);
    else {
      this.stockEl.insertAdjacentHTML('beforeend', `<div class="buy5"><b>+5</b></div>`);
    }
  }
  extraCost() {
    return this.opts.dev?.infinite ? 0 : this.priceOf('extra');
  }

  stockTop() {
    return this.stockEls?.[this.stockEls.length - 1] || this.stockEl;
  }

  // Carta suelta que vuela por encima del tablero (del mazo, del comodín, de regreso al mazo).
  flyer(c, rect, up) {
    const f = document.createElement('div');
    f.className = `card flyer${up ? ' up' : ''}`;
    f.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;--cw:${rect.width}px;z-index:9999;pointer-events:none`;
    f.style.setProperty('--back', this.back);
    f.innerHTML = inner(c);
    // Dentro de la pantalla del juego (capa aislada): así nunca pasa por encima de una ventana.
    this.el.append(f);
    return f;
  }

  renderWaste() {
    const top = this.st.top;
    // El cohete turbo ya despegó de la esquina: en el descarte se ve con su número.
    this.wasteEl.innerHTML = top ? `<div class="card up">${inner({ ...top, arrow: top.arrow, turbo: false })}</div>` : '';
    this.wasteEl.classList.toggle('arrowed', !!top?.arrow);
  }

  landWaste() {
    this.renderWaste();
    squash(this.wasteEl.firstElementChild);
  }

  updateCounts() {
    this.el.querySelector('[data-n="undo"]').textContent = save.undo;
    // El mazo de ayudas cuenta todo lo que traes: comodines y las demás ayudas.
    this.el.querySelector('[data-n="wild"]').textContent = save.wild + Object.values(save.helps || {}).reduce((t, n) => t + (n || 0), 0);
    updateCoins();
  }

  // Indicador de racha por puntos: del premio anterior al siguiente (1-6, 7-13, 14-18, 19-23, 24-31 y luego tramos de 3).
  // Al final de los puntos se dibuja el premio del tramo (carta violeta, comodín dorado o estrella al inventario).
  // En el evento del mes los premios van al doble de distancia (level.rewardStep = 2).
  showCombo() {
    const step = this.level.rewardStep ?? 1;
    // Mientras vuela un cometa, los puntos se quedan en la racha de antes (comboAt) y suben cuando llega.
    const streak = this.comboAt ?? this.streak;
    const { at, kind } = E.nextReward(streak, step);
    const from = E.prevReward(at, step);
    let dots = '';
    // Faltan 1 o 2: el siguiente punto late, el premio se mueve y abajo sale "¡Falta n!".
    const left = at - streak, near = streak > 0 && left <= 2;
    for (let i = from + 1; i < at; i++) dots += `<i class="${i <= streak ? 'on' : near && i === streak + 1 ? 'next' : ''}"></i>`;
    const prize = kind === 'bank' ? `<span class="prize bank">${icon('wild')}</span>` : E.BROOM[kind] ? `<span class="prize bank broom">${icon('escoba')}</span>` : `<span class="prize mini ${kind === 'wild' ? 'gift-wild' : 'gift-card'}"></span>`;
    // Turbo prendido: cohete con "×2" y cuántas jugadas dobles le quedan (aparece cuando el cohete llega).
    const tb = this.st.turbo > 0 && !this.turboHold;
    const cur = tb ? this.st.turbo : 0, prev = this.turboShown || 0;
    const oldChip = this.comboEl.querySelector('.turbo-chip'), oldRect = oldChip?.getBoundingClientRect();
    this.turboShown = cur;
    const pips = '<span class="tp"></span>'.repeat(cur);
    this.comboEl.classList.toggle('turbo', tb);
    this.comboEl.innerHTML = `${tb ? `<span class="turbo-chip">${icon('rocket')}<b>×2</b><span class="tps">${pips}</span></span>` : ''}<span class="dots">${from ? `<b>×${from}</b>` : ''}${dots}${prize}</span>${near ? `<em class="need outl">¡Falta ${left}!</em>` : ''}`;
    if (cur !== prev) this.turboFx(cur, prev, oldChip, oldRect);
    this.comboEl.classList.toggle('near', near);
    this.comboEl.classList.toggle('hot', near && left === 1);
  }

  // Animaciones del chip del turbo. Llega: entra de golpe. Se usa una jugada: el "×2" brinca y el puntito usado
  // revienta. Se acaban las 3: el chip da un brinco, suelta chispas y se encoge (la racha vuelve a la normal).
  // Robas (se pierde): el chip se apaga, se ladea y se cae.
  turboFx(cur, prev, oldChip, oldRect) {
    if (reduced()) return;
    const chip = this.comboEl.querySelector('.turbo-chip');
    const spring = 'cubic-bezier(0.34, 1.45, 0.64, 1)';
    if (chip && !prev) return chip.animate([{ scale: 0, rotate: '-30deg' }, { scale: 1.35, rotate: '8deg', offset: 0.6 }, { scale: 1, rotate: '0deg' }], { duration: 480, easing: spring });
    if (chip && cur < prev) {
      chip.querySelector('b').animate([{ scale: 1 }, { scale: 1.9, rotate: '-10deg', offset: 0.4 }, { scale: 1, rotate: '0deg' }], { duration: 460, easing: spring });
      const g = document.createElement('span');
      g.className = 'tp';
      chip.querySelector('.tps').append(g);
      g.animate([{ scale: 1, opacity: 1 }, { scale: 2.2, opacity: 0 }], { duration: 380, easing: 'ease-out', fill: 'forwards' }).finished.then(() => g.remove());
      return;
    }
    if (chip || !oldChip || !oldRect?.width) return;
    // Se fue el chip: un fantasma en su lugar hace la salida.
    const ghost = oldChip.cloneNode(true);
    ghost.querySelectorAll('.tp').forEach((p) => p.remove());
    ghost.style.cssText = `position:fixed;left:${oldRect.left}px;top:${oldRect.top}px;margin:0;z-index:10000;pointer-events:none;animation:none`;
    this.el.append(ghost);
    const lost = this.st.streak === 0;
    const run = lost
      ? ghost.animate(
          [
            { translate: '0 0', rotate: '0deg', opacity: 1, filter: 'grayscale(0)' },
            { translate: '0 -6px', rotate: '-12deg', opacity: 1, filter: 'grayscale(1)', offset: 0.3 },
            { translate: '6px 60px', rotate: '40deg', opacity: 0, filter: 'grayscale(1)' },
          ],
          { duration: 700, easing: 'cubic-bezier(0.5, 0, 0.8, 0.5)', fill: 'forwards' },
        )
      : ghost.animate(
          [
            { scale: 1, opacity: 1 },
            { scale: 1.45, opacity: 1, offset: 0.35 },
            { scale: 0, opacity: 0 },
          ],
          { duration: 560, easing: 'ease-in', fill: 'forwards' },
        );
    if (!lost) setTimeout(() => sparkle({ x: oldRect.left + oldRect.width / 2, y: oldRect.top + oldRect.height / 2 }, 12), 200);
    run.finished.then(() => ghost.remove());
  }

  showStreak(text) {
    this.showCombo();
    if (!text && this.streak < 2) return;
    // Con HTML (los textos son del juego): la constelación lleva su estrellita.
    this.streakEl.innerHTML = text || `Racha ×${this.streak}`;
    this.streakEl.classList.toggle('reward', !!text);
    this.streakEl.classList.remove('pop');
    void this.streakEl.offsetWidth;
    this.streakEl.classList.add('pop');
  }

  shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  }

  // ---------- Acciones ----------
  tapCard(id, e) {
    const c = this.cards[id];
    if (!c || c.removed) return;
    const { level, st } = this;
    if (c.pack || c.bomb || c.comet) {
      buzz();
      if (c.pack) this.tell('pack', 'Destápala por completo y te regala cartas');
      else if (c.comet) this.tell('comet', 'Destápalo antes de que llegue a 0 y suma a tu racha');
      else this.tell('bomb', 'Destápala antes de que llegue a 0 para desactivarla');
      return this.shake(c.el);
    }
    if (this.coach && !this.coach.allows(c)) return;
    if (E.playRank(level, c, st) == null) {
      buzz();
      if (E.faceUp(level, c, st)) {
        if (!E.lockOpen(level, c, st)) this.tell('lock', 'Juega la carta con la llave del mismo color');
        else if (E.iceLeft(c, st)) this.tell('ice', `Juega ${E.iceLeft(c, st)} carta(s) más para derretir el hielo`);
        else if (st.top?.arrow) this.tell('arrow', `La flecha pide un ${RANKS[E.mod13(st.top.rank + st.top.arrow)]}`);
      }
      return this.shake(c.el);
    }
    this.play(c, !!e && this.lowHalf(c, e));
  }

  // Boleto partido entero: ¿tocó la mitad de abajo? (se mide en el giro de la carta). Solo cuenta si las dos conectan.
  lowHalf(c, e) {
    if (c.half == null || E.cutOf(c, this.st)) return false;
    const [cx, cy] = center(c.el.getBoundingClientRect());
    const a = (c.rot * Math.PI) / 180;
    return -(e.clientX - cx) * Math.sin(a) + (e.clientY - cy) * Math.cos(a) > 0;
  }

  // Avisos cortos, una vez por partida cada uno.
  tell(key, msg) {
    this.told ||= {};
    if (this.told[key]) return;
    this.told[key] = true;
    toast(msg);
  }

  play(c, low = false) {
    const before = this.st;
    const { s, ev } = E.play(this.level, before, c.id, low);
    const burnRects = this.burnRects(ev.boom);
    this.history.push({ t: 'play', before, ev, best: this.best, bonus: this.bonus });
    this.st = s;
    this.sync();
    this.best = Math.max(this.best, s.streak);
    this.bonus += s.streak;

    // Dónde estaba (para dibujar la constelación).
    this.flewFrom = c.el ? center(c.el.getBoundingClientRect()) : null;
    // Vuela de centro a centro dando una vuelta y se asienta al caer.
    // Boleto partido: la primera vez solo se va la mitad jugada; la otra se queda.
    if (ev.split) this.splitTicket(c, ev);
    else this.flyToWaste(c, ev, E.cutOf(c, before));
    this.afterPlay(before, ev, burnRects);
  }

  // cut: del boleto partido, la mitad que ya se había jugado (la que queda se vuelve carta entera en el aire).
  flyToWaste(c, ev, cut) {
    const el = c.el;
    c.el = null;
    el.classList.remove('shake');
    el.getAnimations().forEach((a) => a.cancel());
    if (this.stripEl) this.boardEl.append(el); // sale de la tira: el corte del rollo no la tapa al volar
    const [ax, ay] = center(el.getBoundingClientRect());
    const b = this.wasteEl.getBoundingClientRect();
    const [bx, by] = center(b);
    el.classList.add('up', 'flying');
    el.style.zIndex = 9999;
    el.style.rotate = '0deg';
    // Última mitad de un boleto: en el aire se vuelve una carta entera con su número.
    if (cut) this.becomeCard(el, { rank: ev.rank, suit: c.suit }, cut);
    toss(el, { r0: c.rot }, { x1: bx - ax, y1: by - ay, s1: b.width / this.u }, 360).then(() => {
      el.remove();
      this.landWaste();
    });
  }

  // Boleto: la carta se sacude, la mitad jugada se arranca por la línea picada y vuela al descarte; en el aire se vuelve
  // una carta entera. La otra mitad se queda en su lugar, recortada en zigzag.
  splitTicket(c, ev) {
    const el = c.el;
    const keep = ev.split; // mitad que se queda (1 = la de abajo)
    const [cx, cy] = center(el.getBoundingClientRect());
    const u = this.u;
    const f = this.flyer(c, { left: cx - u / 2, top: cy - u * 0.7, width: u }, true);
    f.style.clipPath = tearClip(3 - keep);
    f.style.rotate = '0deg';
    el.style.clipPath = tearClip(keep);
    this.becomeCard(f, { rank: ev.rank, suit: c.suit }, 3 - keep, 120);
    buzz(10);
    if (!reduced()) {
      // Tirón: la mitad que se queda se jala hacia su lado y regresa.
      const pull = keep === 1 ? 7 : -7;
      el.animate([{ translate: '0 0' }, { translate: `0 ${pull}%`, offset: 0.35 }, { translate: '0 0' }], { duration: 280, easing: 'ease-out' });
      sparkle({ x: cx, y: cy }, 8);
    }
    const b = this.wasteEl.getBoundingClientRect();
    const [bx, by] = center(b);
    toss(f, { r0: c.rot, y0: keep === 1 ? -u * 0.08 : u * 0.08 }, { x1: bx - cx, y1: by - cy, s1: b.width / u }, 360).then(() => {
      f.remove();
      this.landWaste();
    });
  }

  // Lo que vuela de un boleto (una mitad) se vuelve en el aire la carta entera que cae al descarte: el recorte se abre
  // y la cara del boleto se funde con la de la carta. from = mitad que se ve al salir (como tearClip).
  becomeCard(el, card, from, delay = 0) {
    el.insertAdjacentHTML('beforeend', `<div class="inner become">${faceHTML(card)}</div>`);
    if (reduced()) return (el.style.clipPath = '');
    const t = { duration: FLY_MS, delay, easing: 'ease-in-out', fill: 'forwards' };
    el.animate([{ clipPath: tearClip(from) }, { clipPath: tearClip(from, 1) }], t);
    el.querySelector('.become').animate([{ opacity: 0 }, { opacity: 0, offset: 0.2 }, { opacity: 1 }], t);
  }

  // Deshacer la primera mitad de un boleto: la carta regresa del descarte, se vuelve mitad y se pega a su boleto.
  unsplitTicket(c, ev, from) {
    const el = c.el;
    if (!el) return;
    const keep = ev.split;
    const [cx, cy] = center(el.getBoundingClientRect());
    const u = this.u;
    const f = this.flyer({ rank: ev.rank, suit: c.suit }, { left: cx - u / 2, top: cy - u * 0.7, width: u }, true);
    f.insertAdjacentHTML('beforeend', `<div class="inner become">${faceHTML(c)}</div>`);
    const [ax, ay] = center(from);
    const t = { duration: FLY_MS, easing: 'ease-in-out', fill: 'forwards' };
    if (!reduced()) {
      f.animate([{ clipPath: tearClip(3 - keep, 1) }, { clipPath: tearClip(3 - keep) }], t);
      f.querySelector('.become').animate([{ opacity: 0 }, { opacity: 1, offset: 0.8 }, { opacity: 1 }], t);
    }
    toss(f, { x0: ax - cx, y0: ay - cy, s0: from.width / u }, { r1: c.rot }, 360).then(() => {
      f.remove();
      if (c.el !== el) return;
      el.style.clipPath = '';
      squash(el);
    });
  }

  afterPlay(before, ev, burnRects) {
    // Cartas regalo que quedaron destapadas, premio de racha y bombas.
    this.renderStock();
    for (const id of ev.packs) this.flyPack(this.cards[id]);
    for (const id of ev.defused) this.defuse(this.cards[id]);
    const slots = this.rewardSlots([ev.reward, ev.boost, ...(ev.wishes || [])]);
    const boosted = before.turbo > 0;
    this.giveReward(ev.reward, slots[0]);
    if (ev.boost) this.giveReward(ev.boost, slots[1]);
    else if (boosted && !ev.reward) this.showStreak(`¡Turbo! ×${before.streak + 2}`);
    // El cometa suma después de la jugada (y de su punto extra si había turbo).
    if (ev.wished?.length) this.flyComets(ev, before.streak + (boosted ? 2 : 1), slots.slice(2));
    this.caught = (this.caught || 0) + (ev.wished?.length || 0);
    if (ev.turbo) this.launchTurbo(ev);
    if (ev.key) this.gainKey();
    if (ev.shipBack) this.shipGives(ev.shipBack);
    if (ev.bolted) this.boltFx(ev.bolted);
    if (ev.cst) this.cstFx(ev, this.flewFrom || [0, 0]);
    if (this.cards[ev.id].coin && !ev.split) this.coinCard(this.cards[ev.id]);
    this.burn(ev.boom, burnRects);
    this.cometsGone(ev.gone);

    this.refresh();
    this.save();
    this.checkEnd();
    this.coach?.after();
  }

  // Premio por racha (ver streakReward en engine.js). Deshacer la jugada lo quita.
  giveReward(r, slot) {
    if (!r) return this.showStreak();
    if (r.kind === 'bank') {
      save.wild++;
      persist();
      this.updateCounts();
      squash(this.el.querySelector('.wild-card'));
    } else if (r.kind === 'broom') {
      this.sweep(r.ids);
    } else {
      this.flyReward(r.kind, slot ?? this.stockEls[this.stockEls.length - 1 - r.pos]);
    }
    this.showStreak(`¡Racha ×${this.comboAt ?? this.streak}!`);
  }

  // Huecos del mazo donde cayeron varios premios de una jugada (el del cometa entra después y puede recorrer
  // a los anteriores). null = premio al inventario o ninguno.
  rewardSlots(list) {
    const pos = list.map((r) => (r && r.pos >= 0 ? r.pos : null));
    pos.forEach((p, i) => {
      if (p == null) return;
      for (let j = 0; j < i; j++) if (pos[j] != null && pos[j] >= p) pos[j]++;
    });
    const els = this.stockEls || [];
    return pos.map((p) => (p == null ? null : els[els.length - 1 - p]));
  }

  // Cometa destapado a tiempo: se levanta, crece y sale disparado en arco hasta los puntos de racha dejando
  // estela. Al llegar, la racha sube de golpe y caen los premios que alcanzó (los comodines al inventario ya
  // se sumaron: así deshacer siempre los quita).
  flyComets(ev, at, slots) {
    const gain = this.streak - at;
    for (const w of ev.wishes) if (w.kind === 'bank') save.wild++;
    persist();
    slots.forEach((e) => e && (e.style.opacity = 0));
    this.comboAt = at;
    this.showCombo();
    const [tx, ty] = center(this.comboEl.getBoundingClientRect());
    const runs = ev.wished.map((id, k) => {
      const c = this.cards[id];
      const el = c.el;
      c.el = null;
      if (!el || reduced()) return el?.remove();
      el.getAnimations().forEach((a) => a.cancel());
      const [ax, ay] = center(el.getBoundingClientRect());
      el.style.zIndex = 9999;
      el.style.rotate = '0deg';
      const dx = tx - ax, dy = ty - ay;
      const trail = setInterval(() => this.cometTrail(el), 35);
      return el
        .animate(
          [
            { translate: '0 0', scale: 1, rotate: `${c.rot}deg` },
            { translate: `${-dx * 0.08}px ${-this.u * 0.25}px`, scale: 1.4, rotate: '-10deg', offset: 0.32, easing: 'cubic-bezier(0.55, 0, 0.8, 0.3)' },
            { translate: `${dx}px ${dy}px`, scale: 0.3, rotate: '25deg', opacity: 0.85 },
          ],
          { duration: 860 + k * 160, fill: 'forwards' },
        )
        .finished.catch(() => {})
        .then(() => {
          clearInterval(trail);
          el.remove();
        });
    });
    Promise.all(runs).then(() => {
      if (this.done || !this.history.some((h) => h.ev === ev)) return;
      this.comboAt = null;
      sparkle({ x: tx, y: ty }, 18);
      buzz(20);
      ev.wishes.forEach((w, i) => (w.kind === 'bank' ? squash(this.el.querySelector('.wild-card')) : w.kind === 'broom' ? this.sweep(w.ids) : this.flyReward(w.kind, slots[i])));
      this.updateCounts();
      this.showStreak(`¡Cometa +${gain}!`);
      if (!reduced()) this.comboEl.animate([{ scale: 1 }, { scale: 1.25 }, { scale: 1 }], { duration: 420, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' });
    });
  }

  // Cohete turbo: despega de la esquina de la carta del descarte echando fuego y vuela a los puntos de racha; al llegar
  // se prende el turbo (cohete con "×2" y sus 3 jugadas). Sale cuando la carta (jugada o robada) llega al descarte.
  launchTurbo(ev) {
    this.turboHold = true;
    this.showCombo();
    setTimeout(() => {
      if (this.done || !this.history.some((h) => h.ev === ev)) return;
      // Sale de la esquina de la carta, donde iba el cohetito.
      const w = this.wasteEl.getBoundingClientRect();
      const [ax, ay] = [w.left + w.width * 0.2, w.top + w.width * 0.2];
      const [tx, ty] = center(this.comboEl.getBoundingClientRect());
      const land = () => {
        if (this.done || !this.history.some((h) => h.ev === ev)) return;
        this.turboHold = false;
        this.showStreak('¡Turbo ×2!');
        buzz(20);
        sparkle({ x: tx, y: ty }, 14);
        if (!reduced()) this.comboEl.animate([{ scale: 1 }, { scale: 1.25 }, { scale: 1 }], { duration: 420, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' });
      };
      if (reduced()) return land();
      const f = document.createElement('div');
      f.className = 'turbo-fly';
      f.innerHTML = icon('rocket');
      f.style.cssText = `left:${ax}px;top:${ay}px`;
      this.el.append(f);
      // Hacia dónde apunta: el dibujo del cohete ya va inclinado 35° (hacia arriba a la derecha).
      const ang = (Math.atan2(ty - ay, tx - ax) * 180) / Math.PI + 90 - 35;
      const trail = setInterval(() => this.cometTrail(f, 'fire'), 30);
      f.animate(
        [
          { translate: '0 0', scale: 0.45, rotate: '0deg', opacity: 1 },
          { translate: '0 -18px', scale: 1.5, rotate: `${ang}deg`, opacity: 1, offset: 0.3, easing: 'cubic-bezier(0.6, 0, 0.8, 0.4)' },
          { translate: `${tx - ax}px ${ty - ay}px`, scale: 0.7, rotate: `${ang}deg`, opacity: 1 },
        ],
        { duration: 820, fill: 'forwards' },
      )
        .finished.catch(() => {})
        .then(() => {
          clearInterval(trail);
          f.remove();
          land();
        });
    }, FLY_MS);
  }

  // Chispa de la cola del cometa (o fuego del cohete turbo): sale de donde va y se apaga.
  cometTrail(el, kind = '') {
    if (!el.isConnected) return;
    const [x, y] = center(el.getBoundingClientRect());
    const t = document.createElement('i');
    t.className = `comet-trail ${kind}`;
    t.style.cssText = `left:${x}px;top:${y}px`;
    this.el.append(t);
    t.animate([{ scale: 2.4, opacity: 0.9 }, { scale: 0.3, opacity: 0 }], { duration: 520, easing: 'ease-out', fill: 'forwards' }).finished.then(() => t.remove());
  }

  // Cometas que no destapaste a tiempo: se apagan y se esfuman en su lugar, bajando un poco (no suben: eso es atraparlos).
  cometsGone(ids) {
    if (!ids?.length) return;
    for (const id of ids) {
      const c = this.cards[id];
      const el = c.el;
      c.el = null;
      if (!el) continue;
      if (reduced()) {
        el.remove();
        continue;
      }
      el.getAnimations().forEach((a) => a.cancel());
      el.animate(
        [
          { translate: '0 0', scale: 1, opacity: 1, filter: 'grayscale(0) blur(0px)' },
          { translate: '0 4px', scale: 0.96, opacity: 0.85, filter: 'grayscale(0.9) blur(0px)', offset: 0.35 },
          { translate: `0 ${this.u * 0.45}px`, scale: 0.7, opacity: 0, filter: 'grayscale(1) blur(6px)' },
        ],
        { duration: 900, easing: 'ease-in', fill: 'forwards' },
      )
        .finished.catch(() => {})
        .then(() => el.remove());
    }
    this.tell('comet-gone', '¡Se fue el cometa! Destápalo antes de que su cuenta llegue a 0');
  }

  // Dónde están ahora las cartas que una bomba va a quemar (las primeras del mazo, a la derecha).
  // skip: cartas de la derecha que ya no cuentan (al robar, la que se acaba de robar).
  burnRects(boom, skip = 0) {
    if (!boom?.length) return [];
    const n = boom.reduce((a, b) => a + b.burned.length, 0);
    const els = this.stockEls || [];
    return els.slice(Math.max(0, els.length - skip - n), els.length - skip).map((e) => e.getBoundingClientRect());
  }

  // Bomba destapada a tiempo: la mecha se apaga y la carta se encoge y desaparece.
  defuse(c) {
    const el = c.el;
    c.el = null;
    if (!el) return;
    el.classList.add('defused');
    toast('¡Bomba desactivada!');
    el.animate([{ scale: 1, opacity: 1 }, { scale: 1.15, opacity: 1, offset: 0.35 }, { scale: 0.3, opacity: 0 }], { duration: 520, easing: 'ease-in', fill: 'forwards' }).finished.then(() => el.remove());
  }

  // La bomba explota: baja volando hasta el mazo, estalla (destello y temblor) y las primeras cartas del mazo salen ardiendo.
  // `rects` son las posiciones de las cartas quemadas antes de quitarlas: se dejan "fantasmas" ahí hasta que estalla.
  burn(boom, rects) {
    if (!boom?.length) return;
    const ghosts = rects.map((a) => this.flyer({}, a, false));
    const target = this.stockEl.getBoundingClientRect();
    const [tx, ty] = center(target);
    const flights = boom.map((b) => {
      const c = this.cards[b.id];
      const el = c.el;
      c.el = null;
        if (!el || reduced()) {
        el?.remove();
        return Promise.resolve();
      }
      const [ax, ay] = center(el.getBoundingClientRect());
      el.style.zIndex = 9999;
      el.style.rotate = '0deg';
      return toss(el, { r0: c.rot }, { x1: tx - ax, y1: ty - ay - 20, s1: 1.2 }, 0).then(() => el.remove());
    });
    Promise.all(flights).then(() => {
      if (!reduced()) {
        const flash = document.createElement('div');
        flash.className = 'boom-flash';
        flash.style.cssText = `left:${tx}px;top:${ty}px`;
        this.el.append(flash);
        flash.animate([{ scale: 0.2, opacity: 1 }, { scale: 3.2, opacity: 0 }], { duration: 650, easing: 'ease-out', fill: 'forwards' }).finished.then(() => flash.remove());
        this.el.animate(
          [{ translate: '0 0' }, { translate: '-8px 4px' }, { translate: '7px -5px' }, { translate: '-5px 3px' }, { translate: '3px -2px' }, { translate: '0 0' }],
          { duration: 420, easing: 'ease-out' },
        );
      }
      buzz();
      toast(`¡Bum! La bomba quemó ${rects.length} carta${rects.length === 1 ? '' : 's'} de tu mazo`);
      ghosts.forEach((f, k) => {
        f.classList.add('burning');
        if (reduced()) return f.remove();
        f.animate(
          [
            { translate: '0 0', rotate: '0deg', scale: 1, opacity: 1 },
            { translate: `${(k - 1) * 20}px -40px`, rotate: `${(k - 1) * 15}deg`, scale: 1.25, opacity: 1, offset: 0.35 },
            { translate: `${(k - 1) * 60}px -170px`, rotate: `${(k - 1) * 45}deg`, scale: 0.6, opacity: 0 },
          ],
          { duration: 1000, easing: 'ease-out', fill: 'forwards', delay: k * 80 },
        ).finished.then(() => f.remove());
      });
    });
  }

  // Vuela a un hueco del mazo: la carta voladora llega justo encima de su lugar y ahí la releva
  // la carta real del mazo, que baja en su capa: así se ve cómo se mete detrás de las de enfrente.
  intoSlot(f, slot, x, y, spin) {
    const lift = (this.stockEl.offsetHeight || 60) * 0.75;
    return toss(f, {}, { x1: x, y1: y - lift }, spin).then(() => {
      f.remove();
      slot.style.opacity = '';
      return slot.animate([{ translate: `0 ${-lift}px` }, { translate: '0 0' }], { duration: 230, easing: 'cubic-bezier(0.5, 0, 0.75, 0)' }).finished;
    });
  }

  // El premio sale de los puntos de racha, se presume un momento y se mete en su hueco del mazo.
  flyReward(kind, slot) {
    if (!slot || reduced()) return squash(slot);
    const to = slot.getBoundingClientRect();
    const [px, py] = center((this.comboEl.querySelector('.prize') || this.comboEl).getBoundingClientRect());
    const f = this.flyer({}, { left: px - to.width / 2, top: py - (to.width * 1.4) / 2 + 30, width: to.width }, false);
    f.classList.add(kind === 'wild' ? 'gift-wild' : 'gift-card');
    slot.style.opacity = 0;
    f.animate(
      [
        { scale: 0.2, rotate: '-20deg', opacity: 0 },
        { scale: 1.12, rotate: '6deg', opacity: 1, offset: 0.6 },
        { scale: 1, rotate: '0deg', opacity: 1 },
      ],
      { duration: 380, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'forwards' },
    )
      .finished.then(() => new Promise((ok) => setTimeout(ok, 260)))
      .then(() => {
        const t = slot.getBoundingClientRect();
        return this.intoSlot(f, slot, t.left - parseFloat(f.style.left), t.top - parseFloat(f.style.top), 0);
      })
      .then(() => {
        squash(slot);
        const st = this.stockEl;
        st.animate([{ scale: 1 }, { scale: 1.06 }, { scale: 1 }], { duration: 260, easing: 'ease-out' });
      });
  }

  // Carta regalo: resalta en su sitio, sus cartas vuelan una por una al final del mazo y se desvanece.
  flyPack(c) {
    const el = c.el;
    c.el = null;
    const n = c.pack.length;
    this.renderStock();
    const slots = this.stockEls.slice(0, n); // las de la izquierda son el final del mazo
    if (reduced() || !el) {
      el?.remove();
      return slots.forEach((e) => squash(e));
    }
    slots.forEach((e) => (e.style.opacity = 0));
    this.busy = true;
    el.style.zIndex = 9000;
    // Se endereza y crece un poco, sin saltar (en iPhone el salto con rebote se veía como un brinco), y brilla.
    el.animate(
      [
        { rotate: `${c.rot}deg`, scale: 1 },
        { rotate: '0deg', scale: 1.2 },
      ],
      { duration: 340, easing: 'cubic-bezier(0.25, 0.8, 0.3, 1)', fill: 'forwards' },
    );
    el.animate([{ filter: 'drop-shadow(0 0 0 #ffd85a00)' }, { filter: 'drop-shadow(0 0 12px #ffd85a)' }], { duration: 340, fill: 'forwards' });
    const from = () => el.getBoundingClientRect();
    const one = (k) => {
      const a = from();
      const slot = slots[n - 1 - k]; // la primera en salir queda más adentro del mazo
      const to = slot.getBoundingClientRect();
      const left = a.left + a.width / 2 - to.width / 2;
      const top = a.top + a.height / 2 - (to.width * 1.4) / 2;
      const f = this.flyer({}, { left, top, width: to.width }, false);
      return this.intoSlot(f, slot, to.left - left, to.top - top, 360).then(() => squash(slot));
    };
    const runs = slots.map((_, k) => new Promise((ok) => setTimeout(() => one(k).then(ok), 400 + k * 180)));
    Promise.all(runs).then(() => {
      el.animate([{ rotate: '0deg', scale: 1.2, opacity: 1 }, { rotate: '0deg', scale: 0.4, opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).finished.then(() => el.remove());
      if (!this.done) this.busy = false;
    });
  }

  // Deshacer una carta regalo: sus cartas salen del final del mazo y regresan a ella, que reaparece.
  // `rects` son las posiciones de esas cartas en el mazo antes de deshacer (el estado ya está restaurado).
  unflyPack(c, rects) {
    this.makeCardEl(c);
    const el = c.el;
    if (reduced()) return;
    el.style.opacity = 0;
    const b = el.getBoundingClientRect();
    const runs = rects.map((a, k) => {
      const f = this.flyer({}, a, false);
      return new Promise((ok) => setTimeout(ok, k * 90))
        .then(() => toss(f, {}, { x1: b.left + b.width / 2 - a.left - a.width / 2, y1: b.top + b.height / 2 - a.top - a.height / 2, s1: b.width / a.width }, 360))
        .then(() => f.remove());
    });
    Promise.all(runs).then(() => {
      el.style.opacity = '';
      el.animate([{ scale: 0.6 }, { scale: 1.2, offset: 0.6 }, { scale: 1 }], { duration: 320, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' });
    });
  }

  // Carta moneda: al jugarla, sus monedas saltan al monedero.
  coinCard(c) {
    save.coins += c.coin;
    persist();
    const [x, y] = center(this.wasteEl.getBoundingClientRect());
    flyToWallet('coins', { x, y }, c.coin, shownCoins() - c.coin);
    this.showStreak(`+${c.coin} monedas`);
  }

  // ---------- Nave ladrona ----------
  // Aviso al empezar: la nave cruza el tablero con un letrero.
  shipBanner() {
    toast(`${icon('nave')} ¡Aquí pasan naves!`);
    if (reduced()) return;
    const b = this.boardEl.getBoundingClientRect();
    const sh = this.shipEl();
    sh.animate([{ translate: `${-90}px ${b.top + b.height * 0.3}px` }, { translate: `${innerWidth + 20}px ${b.top + b.height * 0.2}px` }], { duration: 1600, easing: 'ease-in-out' }).finished.then(() => sh.remove());
  }
  shipEl() {
    const sh = document.createElement('div');
    sh.className = 'ship-fly';
    sh.innerHTML = `${icon('nave')}<i class="beam"></i>`;
    this.el.append(sh);
    return sh;
  }
  // Llega, prende su rayo sobre el mazo, sube la carta y se va con ella.
  shipSteals(st, from) {
    toast(`${icon('nave')} ¡La nave se llevó una carta!`);
    buzz(30);
    if (reduced()) return;
    const [x, y] = center(from);
    const sh = this.shipEl();
    const c = this.flyer(st.card, { left: from.left, top: from.top, width: from.width }, true);
    c.style.opacity = 0;
    const stay = { translate: `${x - 40}px ${y - 130}px` };
    sh.animate([{ translate: `${-100}px ${y - 200}px` }, stay], { duration: 700, easing: 'ease-out', fill: 'forwards' }).finished.then(() => {
      sh.classList.add('on');
      c.style.opacity = 1;
      return c.animate([{ translate: '0 0', scale: 1 }, { translate: `0 ${-110}px`, scale: 0.4 }], { duration: 700, easing: 'ease-in', fill: 'forwards' }).finished;
    }).then(() => {
      c.remove();
      sh.classList.remove('on');
      return sh.animate([stay, { translate: `${innerWidth + 40}px ${y - 260}px` }], { duration: 700, easing: 'ease-in', fill: 'forwards' }).finished;
    }).then(() => sh.remove());
  }
  // Racha: la nave se asusta y regresa la última carta que se llevó; cae a su hueco del mazo.
  // msg: el aviso (deshacer el robo en que se llevó una carta también la regresa con la nave).
  shipGives(back, msg = '¡Racha! La nave te regresa una carta') {
    toast(`${icon('nave')} ${msg}`);
    this.renderStock();
    const slot = this.stockEls?.[this.stockEls.length - 1 - back.pos];
    if (!slot || reduced()) return squash(slot);
    const to = slot.getBoundingClientRect();
    const sh = this.shipEl();
    slot.style.opacity = 0;
    const [x, y] = center(to);
    sh.animate([{ translate: `${innerWidth + 40}px ${y - 220}px` }, { translate: `${x - 40}px ${y - 130}px` }], { duration: 600, easing: 'ease-out', fill: 'forwards' }).finished.then(() => {
      // Baja la carta del mazo misma (no una copia encima de todo): así entra por detrás de las que la tapan y no
      // brinca de adelante hacia atrás al llegar (8 nov 2026).
      slot.style.opacity = '';
      return slot.animate([{ translate: `0 ${y - 110 - to.top}px`, scale: 0.4, opacity: 0.6 }, { translate: '0 0', scale: 1, opacity: 1 }], { duration: 450, easing: 'ease-in' }).finished.then(() => {
        squash(slot);
        sh.classList.add('flee');
        return sh.animate([{ translate: `${x - 40}px ${y - 130}px` }, { translate: `${x + 120}px ${-120}px`, rotate: '25deg' }], { duration: 650, easing: 'ease-in', fill: 'forwards' }).finished;
      });
    }).then(() => sh.remove());
  }

  // Escoba (premio de racha 20 y 30): una escoba cruza el tablero y las cartas más enterradas salen barridas.
  sweep(ids) {
    toast(`${icon('escoba')} ¡Escoba!`);
    const els = ids.map((id) => {
      const c = this.cards[id], el = c.el;
      c.el = null;
      return el;
    }).filter(Boolean);
    if (reduced()) return els.forEach((el) => el.remove());
    const b = this.boardEl.getBoundingClientRect();
    const br = document.createElement('div');
    br.className = 'broom-fly';
    br.innerHTML = icon('escoba');
    this.el.appendChild(br);
    const y = els.length ? Math.min(...els.map((e) => e.getBoundingClientRect().top)) : b.top + b.height / 3;
    br.animate([{ translate: `${b.left - 80}px ${y}px`, rotate: '-20deg' }, { translate: `${b.right + 20}px ${y}px`, rotate: '15deg' }], { duration: 900, easing: 'ease-in-out', fill: 'forwards' }).finished.then(() => br.remove());
    els.forEach((el, i) => {
      el.style.zIndex = 9999;
      el.animate([{ translate: '0 0', rotate: '0deg', opacity: 1 }, { translate: `${this.u * 1.5}px ${-this.u * 0.6}px`, rotate: '40deg', opacity: 0 }], { duration: 520, delay: 250 + i * 220, easing: 'ease-in', fill: 'forwards' }).finished.then(() => el.remove());
    });
  }

  // Deshacer un premio de racha: la carta sale de su hueco del mazo y regresa a los puntos de racha.
  unflyReward(a, kind) {
    if (!a || reduced()) return;
    const f = this.flyer({}, a, false);
    f.classList.add(kind === 'wild' ? 'gift-wild' : 'gift-card');
    const [px, py] = center((this.comboEl.querySelector('.prize') || this.comboEl).getBoundingClientRect());
    toss(f, {}, { x1: px - a.left - a.width / 2, y1: py - a.top - a.height / 2, s1: 0.4 }, 360).then(() => f.remove());
  }

  // Deshacer una explosión: las cartas quemadas caen de vuelta al principio del mazo.
  unburn(boom) {
    const n = (boom || []).reduce((a, b) => a + b.burned.length, 0);
    if (!n || reduced()) return;
    this.stockEls.slice(-n).forEach((e, k) =>
      e.animate([{ translate: '0 -70px', opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: 320, delay: k * 70, easing: 'ease-in', fill: 'backwards' }),
    );
  }

  draw() {
    if (this.coach && !this.coach.allows('stock')) return;
    if (!this.stock.length) {
      if (this.hasMove()) {
        toast('¡Aún tienes jugadas!');
        return this.hint();
      }
      return this.buyExtra();
    }
    const missed = this.playable();
    const before = this.st;
    const { s, ev } = E.draw(this.level, before);
    this.history.push({ t: 'draw', before, ev, best: this.best, bonus: this.bonus });
    const a = this.stockTop().getBoundingClientRect();
    const burnRects = this.burnRects(ev.boom, 1);
    this.st = s;
    this.showCombo();
    this.flyFromStock(ev.card, a);
    if (ev.ship) this.shipSteals(ev.ship, a);
    this.burn(ev.boom, burnRects);
    this.cometsGone(ev.gone);
    // Lo que destapó la explosión (o el cometa que se fue) se activa ya.
    if (ev.packs.length) this.renderStock();
    for (const id of ev.packs) this.flyPack(this.cards[id]);
    for (const id of ev.defused) this.defuse(this.cards[id]);
    if (ev.wished.length) this.flyComets(ev, 0, this.rewardSlots(ev.wishes));
    this.caught = (this.caught || 0) + ev.wished.length;
    if (ev.turbo) this.launchTurbo(ev);
    if (ev.cst) this.cstFx(ev);
    if (ev.rocks) toast(`${icon('asteroide')} ¡Cayeron asteroides!`), buzz(30);
    this.refresh();
    if (missed.length) setTimeout(() => this.warnMissed(missed), FLY_MS);
    this.save();
    this.checkEnd();
    this.coach?.after();
  }

  // Robaste teniendo jugada: tiemblan las cartas que podías jugar y late el botón de deshacer.
  warnMissed(missed) {
    if (this.done) return;
    const els = missed.filter((c) => !c.removed && c.el).map((c) => c.el);
    if (!els.length) return;
    for (const el of els) {
      this.shake(el);
    }
    const u = this.el.querySelector('.undo-btn');
    u.classList.remove('nudge');
    void u.offsetWidth;
    u.classList.add('nudge');
  }

  flyFromStock(c, a) {
    const b = this.wasteEl.getBoundingClientRect();
    const f = this.flyer(c, { left: a.left, top: a.top, width: b.width }, false);
    // Quita la carta del mazo ya, pero deja el descarte viejo hasta que aterrice.
    this.renderStock();
    f.getBoundingClientRect();
    f.classList.add('up');
    toss(f, {}, { x1: b.left - a.left, y1: b.top - a.top }, 360).then(() => {
      f.remove();
      this.landWaste();
    });
  }

  // Deshacer una jugada: la carta sale del descarte y regresa volando a su lugar.
  returnToBoard(c, from) {
    this.makeCardEl(c);
    c.el.classList.add('up');
    const [ax, ay] = center(from);
    const [bx, by] = center(c.el.getBoundingClientRect());
    const el = c.el;
    el.style.rotate = '0deg';
    el.style.zIndex = 9999;
    toss(el, { x0: ax - bx, y0: ay - by, s0: from.width / this.u }, { r1: c.rot }, 360).then(() => {
      el.style.rotate = `${c.rot}deg`;
      el.style.zIndex = c.z * 100 + c.id;
      if (this.level.scroll === 'gravedad' && c.el === el) this.placeGrav(c);
      el.getAnimations().forEach((x) => x.cancel());
      squash(el);
    });
  }

  // Deshacer un robo: la carta regresa al mazo y se voltea.
  returnToStock(c, a) {
    const slot = this.stockTop();
    slot.style.opacity = 0;
    const f = this.flyer(c, a, true);
    const b = slot.getBoundingClientRect();
    f.getBoundingClientRect();
    f.classList.remove('up');
    toss(f, {}, { x1: b.left - a.left, y1: b.top - a.top }, 360).then(() => {
      f.remove();
      slot.style.opacity = '';
      squash(slot);
    });
  }

  // Deshacer el comodín: sale del descarte y regresa girando a su botón.
  returnWild(a) {
    const btn = this.el.querySelector('.wild-card');
    const b = btn.getBoundingClientRect();
    const f = this.flyer({ wild: true }, a, true);
    toss(f, {}, { x1: b.left + b.width / 2 - a.left - a.width / 2, y1: b.top + b.height / 2 - a.top - a.height / 2, s1: b.width / a.width }, 360).then(() => {
      f.remove();
      squash(btn);
    });
  }

  // Deshacer: se restaura el estado anterior completo y se anima al revés lo que pasó.
  undo() {
    if (this.coach) return;
    if (!this.history.length) return toast('Nada que deshacer');
    // Abrir una puerta no se deshace (9 nov 2026, pedido del usuario): ni eso ni lo de antes.
    if (this.history[this.history.length - 1].t === 'door') return toast('Abrir una puerta no se puede deshacer');
    const inf = this.opts.dev?.infinite;
    if (save.undo <= 0 && !inf) return save.coins < this.priceOf('undo') ? this.noWayOut('undo') : this.offerBuy('undo');
    if (!inf) save.undo--;
    const h = this.history.pop();
    const ev = h.ev || {};
    this.usedUndo = true;
    this.caught = Math.max(0, (this.caught || 0) - (ev.wished?.length || 0));
    // Posiciones actuales (antes de restaurar) de lo que va a regresar.
    const wasteRect = this.wasteEl.getBoundingClientRect();
    const els = this.stockEls || [];
    const packRects = [];
    let left = 0;
    for (const id of ev.packs || []) {
      const n = this.cards[id].pack.length;
      packRects.push(els.slice(left, left + n).map((e) => e.getBoundingClientRect()));
      left += n;
    }
    const rewards = [ev.reward, ev.boost, ...(ev.wishes || [])];
    const rewardRects = this.rewardSlots(rewards).map((e) => e?.getBoundingClientRect());
    this.comboAt = null;
    this.turboHold = false;

    this.st = h.before;
    this.best = h.best;
    this.bonus = h.bonus;
    this.sync();
    this.renderStock();
    this.renderWaste();

    rewards.forEach((r, i) => {
      if (r?.kind === 'bank') save.wild = Math.max(0, save.wild - 1);
      if (r && r.kind !== 'broom') this.unflyReward(rewardRects[i], r.kind);
    });
    (ev.packs || []).forEach((id, i) => this.unflyPack(this.cards[id], packRects[i]));
    // Constelación juntada: el premio se regresa.
    if (h.cstPrize) {
      if (h.cstPrize.coins) save.coins = Math.max(0, save.coins - h.cstPrize.coins);
      else save.helps[h.cstPrize.help] = Math.max(0, (save.helps[h.cstPrize.help] || 0) - 1);
      updateCoins();
    }
    this.cstPts = (this.cstPts || []).slice(0, Math.max(0, this.st.cst || 0));
    if (h.t === 'play') {
      // Carta moneda: se devuelven las monedas.
      const cc = this.cards[ev.id];
      if (cc.coin && !ev.split) (save.coins = Math.max(0, save.coins - cc.coin)), updateCoins();
      if (ev.split) this.unsplitTicket(this.cards[ev.id], ev, wasteRect);
      else this.returnToBoard(this.cards[ev.id], wasteRect);
    } else if (h.t === 'draw') {
      this.returnToStock(ev.card, wasteRect);
      // La nave se había llevado una carta en ese robo: la regresa a su lugar (debajo de la que vuelve arriba).
      if (ev.ship) setTimeout(() => this.shipGives({ pos: ev.ship.pos + 1 }, 'La nave te regresa la carta'), reduced() ? 0 : 200);
    } else if (h.t === 'wild') {
      this.returnWild(wasteRect);
      if (!inf) save.wild++;
    } else if (h.t === 'door') {
      // Puerta: se cierra (refresh regresa sus cartas adentro), vuelve la llave y, si era de monedas, las monedas.
      const x = this.level.doors[ev.d];
      if (x.prize === 'coin') (save.coins = Math.max(0, save.coins - x.coins)), updateCoins();
    } else if (h.t === 'help') {
      // Reloj de arena o llave maestra: vuelve a tu mazo de ayudas.
      if (!inf) save.helps[h.k] = (save.helps[h.k] || 0) + 1;
      squash(this.el.querySelector('.wild-card'));
    }
    // Bombas que se desactivaron o explotaron con esa acción vuelven al tablero (y los cometas, atrapados o idos).
    const swept = [...rewards.flatMap((r) => (r?.kind === 'broom' ? r.ids : [])), ...(ev.bolted || [])];
    for (const id of [...(ev.defused || []), ...(ev.boom || []).map((b) => b.id), ...(ev.wished || []), ...(ev.gone || []), ...swept]) {
      const c = this.cards[id];
      if (c.el || c.removed) continue;
      this.makeCardEl(c);
      if (!reduced()) c.el.animate([{ scale: 0.4, opacity: 0 }, { scale: 1.15, opacity: 1, offset: 0.6 }, { scale: 1 }], { duration: 360, easing: 'ease-out' });
    }
    this.unburn(ev.boom);
    this.showCombo();
    persist();
    this.refresh();
    this.updateCounts();
    this.save();
  }

  // ---------- Mazo de ayudas (7 nov 2026) ----------
  // 8 nov 2026: inventario. El botón dorado de la bandeja abre un panel morado como el cajón de los menús del mapa (no
  // un abanico flotante): cada ayuda es una carta de la
  // misma baraja que el comodín, con cuántas tienes; abajo su botón de comprar (+1 con un toque, sin otra ventana). Lo
  // comprado se suma a la carta y tú decides cuándo usarla: tocar la carta la usa y vuela al tablero. Sin tener, la carta
  // se ve apagada. Solo salen las que sirven en este tablero (reloj si hay algo con cuenta, llave si hay candados o
  // cortinas cerrados, ver si hay cartas boca abajo; ver 4 y 5 s solo si las tienes). Parado y en PC el panel va sobre la
  // bandeja; acostado, a la izquierda de la columna. Detrás, un velo separa la capa del tablero.
  helpKeys() {
    const { level, st } = this, left = (c) => !st.rem[c.id] && c.el;
    const useful = {
      reloj: this.cards.some((c) => left(c) && (c.bomb || c.comet || c.live || c.ghost || c.cham || c.ring || c.belt)) || !!level.rocks,
      laser: !!level.rocks,
      escudo: !!level.ship && !st.shield,
      llave: this.cards.some((c) => left(c) && ((c.lock != null && !E.lockOpen(level, c, st)) || (c.curtain != null && !E.curtainOpen(level, c, st)))),
      ver: this.cards.some((c) => left(c) && !this.shownUp(c)),
    };
    return ['wild', 'reloj', 'laser', 'escudo', 'ver2', 'ver3', 'ver4', 'ver5', 'llave'].filter((k) => k === 'wild' || ((buyable(k) || (save.helps[k] || 0) > 0) && useful[HELPS[k].secs ? 'ver' : k]));
  }
  helpName(k) {
    return k === 'wild' ? 'Comodín' : HELPS[k].secs ? `Ver ${HELPS[k].secs} s` : k === 'reloj' ? 'Reloj' : k === 'laser' ? 'Láser' : k === 'escudo' ? 'Escudo' : 'Llave';
  }
  helpBack(k) {
    return cardBackURL(k === 'wild' ? 'comodin' : k === 'reloj' ? 'hreloj' : k === 'llave' ? 'hllave' : k === 'laser' ? 'hlaser' : k === 'escudo' ? 'hescudo' : 'hver');
  }
  helpHave(k) {
    return k === 'wild' ? save.wild : save.helps[k] || 0;
  }
  openHelps() {
    if (this.coach) return;
    if (this.el.querySelector('.help-sheet')) return this.closeHelps();
    const keys = this.helpKeys();
    const scrim = document.createElement('div');
    scrim.className = 'help-scrim';
    const sheet = document.createElement('div');
    sheet.className = 'help-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-label', 'Ayudas');
    sheet.innerHTML = `<header class="hs-head"><b class="outl">Ayudas</b><button class="hs-x" aria-label="Cerrar">${icon('close')}</button></header>
      <div class="hs-grid">${keys.map((k) => `<div class="hs-item" data-k="${k}"><button class="hs-card" data-use="${k}" style="background-image:${this.helpBack(k)}"><b class="badge"></b><span class="hs-name">${this.helpName(k)}</span></button><button class="hs-buy" data-buy="${k}"></button></div>`).join('')}</div>`;
    this.el.append(scrim, sheet);
    this.paintHelps();
    // Tamaño: hasta 4 por renglón (7 caben en 2), del tamaño que quepa (más grandes en PC).
    const r = this.el.querySelector('.wild-card').getBoundingClientRect();
    const side = innerWidth > innerHeight && innerHeight <= 500; // acostado: la bandeja es una columna a la derecha
    const big = innerWidth >= 900 && innerHeight >= 700;
    const n = keys.length, cols = n <= 4 ? n : Math.ceil(n / 2), rows = Math.ceil(n / cols);
    const gap = 10, pad = 14, head = 44, below = 52; // below: botón de comprar y su espacio
    // Acostado: a la izquierda de toda la bandeja (no encima del mazo ni de deshacer).
    const trayL = side ? Math.min(r.left, this.el.querySelector('.tray')?.getBoundingClientRect().left ?? r.left) : r.left;
    const roomW = side ? trayL - 24 : Math.min(innerWidth - 16, big ? 560 : 460);
    const roomH = side ? innerHeight - 16 : r.top - 20;
    const cw = Math.floor(Math.max(54, Math.min(big ? 96 : 82, (roomW - pad * 2 - (cols - 1) * gap) / cols, ((roomH - head - pad - (rows - 1) * gap) / rows - below) / 1.4)));
    sheet.style.setProperty('--hw', `${cw}px`);
    sheet.style.setProperty('--cols', cols);
    const W = sheet.offsetWidth, H = sheet.offsetHeight;
    const left = side ? Math.max(8, trayL - 14 - W) : Math.max(8, Math.min(innerWidth - W - 8, r.left + r.width / 2 - W / 2));
    const top = side ? Math.max(8, Math.min(innerHeight - H - 8, r.top + r.height / 2 - H / 2)) : Math.max(8, r.top - H - 14);
    Object.assign(sheet.style, { left: `${left}px`, top: `${top}px` });
    if (!reduced()) {
      scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
      // Sale de la carta de la bandeja y las cartas llegan una tras otra.
      sheet.style.transformOrigin = side ? '100% 50%' : `${r.left + r.width / 2 - left}px 100%`;
      sheet.animate([{ scale: 0.4, opacity: 0, translate: side ? '30px 0' : '0 30px' }, { scale: 1, opacity: 1, translate: '0 0' }], { duration: 340, easing: 'cubic-bezier(0.34, 1.3, 0.64, 1)' });
      sheet.querySelectorAll('.hs-item').forEach((it, i) => it.animate([{ opacity: 0, translate: '0 18px', rotate: '-6deg' }, { opacity: 1, translate: '0 0', rotate: '0deg' }], { duration: 320, delay: 80 + i * 45, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'backwards' }));
    }
    sheet.addEventListener('click', (e) => {
      if (e.target.closest('.hs-x')) return this.closeHelps();
      const buy = e.target.closest('[data-buy]'), use = e.target.closest('[data-use]');
      if (buy) return this.buyHelp(buy.dataset.buy, buy);
      if (use) return this.tapHelp(use.dataset.use, use);
    });
    this.helpOutside = (e) => !e.target.closest('.help-sheet, .wild-card') && this.closeHelps();
    document.addEventListener('pointerdown', this.helpOutside, true);
    // Al girar el teléfono cambia dónde va: se cierra.
    this.helpTurn = () => this.closeHelps();
    addEventListener('orientationchange', this.helpTurn);
  }
  // Cuántas tienes y el botón de comprar de cada carta (gris si no te alcanza; ver 4 y 5 s no se compran).
  paintHelps() {
    const sheet = this.el.querySelector('.help-sheet');
    if (!sheet) return;
    const inf = this.opts.dev?.infinite;
    sheet.querySelectorAll('.hs-item').forEach((it) => {
      const k = it.dataset.k, n = this.helpHave(k), p = this.priceOf(k), off = -this.helpRate(k);
      it.classList.toggle('none', !n && !inf);
      it.querySelector('.badge').textContent = inf ? '∞' : n;
      it.querySelector('.hs-card').setAttribute('aria-label', `${this.helpName(k)}: tienes ${inf ? 'todas' : n}`);
      const b = it.querySelector('.hs-buy');
      b.classList.toggle('nobuy', k !== 'wild' && !buyable(k));
      b.classList.toggle('short', save.coins < p);
      b.innerHTML = `${coin()}${money(p)}${off > 0 ? `<i class="hs-off">−${Math.round(off * 100)}%</i>` : ''}`;
      b.setAttribute('aria-label', `Comprar 1 ${this.helpName(k)} por ${p} monedas`);
    });
  }
  // Comprar con un toque: las monedas salen del monedero a la carta y su número sube. No se usa: tú decides cuándo.
  async buyHelp(k, btn) {
    const p = this.priceOf(k), card = btn.previousElementSibling;
    if (save.coins < p) {
      if (!reduced()) btn.animate([{ translate: '0 0' }, { translate: '-5px 0' }, { translate: '5px 0' }, { translate: '-3px 0' }, { translate: '0 0' }], { duration: 260 });
      buzz(30);
      return toast(`Te faltan ${money(p - save.coins)} monedas`);
    }
    save.coins -= p;
    if (k === 'wild') save.wild++;
    else save.helps[k] = (save.helps[k] || 0) + 1;
    persist();
    const r = card.getBoundingClientRect();
    btn.parentElement.classList.add('got');
    await spendFromWallet('coins', { x: r.left + r.width / 2, y: r.top + r.height / 2 }, p);
    this.updateCounts();
    this.paintHelps();
    if (reduced()) return;
    squash(card);
    sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 10);
    card.querySelector('.badge').animate([{ scale: 1 }, { scale: 1.6 }, { scale: 1 }], { duration: 360, easing: 'cubic-bezier(0.34, 1.6, 0.64, 1)' });
  }
  // Tocar la carta la usa. Sin tener, la carta tiembla y su botón de comprar late.
  tapHelp(k, card) {
    if (!this.helpHave(k) && !this.opts.dev?.infinite) {
      const b = card.nextElementSibling;
      if (!reduced()) {
        card.animate([{ rotate: '0deg' }, { rotate: '-5deg' }, { rotate: '5deg' }, { rotate: '-3deg' }, { rotate: '0deg' }], { duration: 300 });
        b.animate([{ scale: 1 }, { scale: 1.12 }, { scale: 1 }], { duration: 300, delay: 120, easing: 'ease-out' });
      }
      return;
    }
    const why = this.helpUseless(k);
    if (why) return toast(why);
    const from = card.getBoundingClientRect();
    this.closeHelps();
    this.useHelp(k, from);
  }
  // El panel se encoge y se va; el velo se apaga.
  closeHelps() {
    const sheet = this.el.querySelector('.help-sheet'), scrim = this.el.querySelector('.help-scrim');
    document.removeEventListener('pointerdown', this.helpOutside, true);
    removeEventListener('orientationchange', this.helpTurn);
    if (scrim) reduced() ? scrim.remove() : scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).finished.then(() => scrim.remove());
    if (!sheet) return;
    sheet.classList.replace('help-sheet', 'help-sheet-out');
    if (reduced()) return sheet.remove();
    sheet.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.6 }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).finished.then(() => sheet.remove());
  }
  // Que no se gaste en balde.
  helpUseless(k) {
    if (k === 'wild') return this.st.top?.wild ? 'Ya tienes un comodín en juego' : null;
    const { level, st } = this, left = (c) => !st.rem[c.id] && c.el;
    if (k === 'reloj' && !level.rocks && !this.cards.some((c) => left(c) && (c.bomb || c.comet || c.live || c.ghost || c.cham || c.ring || c.belt))) return 'Aquí no hay cuentas que congelar';
    if (k === 'laser' && !Object.keys(st.rock || {}).length) return 'No hay piedras que romper';
    if (k === 'escudo') return !level.ship ? 'Aquí no pasa la nave ladrona' : st.shield ? 'Ya tienes el escudo puesto' : null;
    if (k === 'llave' && !this.cards.some((c) => left(c) && ((c.lock != null && !E.lockOpen(level, c, st)) || (c.curtain != null && !E.curtainOpen(level, c, st))))) return 'No hay candados ni cortinas cerrados';
    if (HELPS[k].secs && !this.cards.some((c) => left(c) && !this.shownUp(c))) return 'Ya ves todas las cartas';
    return null;
  }
  // from: la carta del panel (sale volando de ahí al tablero, crece, gira y se deshace en chispas antes de hacer efecto).
  async useHelp(k, from) {
    if (k === 'wild') return this.useWild(from);
    const why = this.helpUseless(k), inf = this.opts.dev?.infinite;
    if (why) return toast(why);
    if (!(save.helps[k] > 0) && !inf) return this.openHelps();
    if (!inf) save.helps[k]--;
    persist();
    this.updateCounts();
    this.busy = true;
    await this.helpFly(k, from);
    this.busy = false;
    // Ver cartas no cambia la partida (no se deshace): solo enseña.
    if (HELPS[k].secs) return this.peekAll(HELPS[k].secs);
    const st = this.st;
    this.history.push({ t: 'help', k, before: st, best: this.best, bonus: this.bonus });
    this.st = k === 'reloj' ? E.useClock(st) : k === 'laser' ? E.useLaser(st) : k === 'escudo' ? E.useShield(st) : E.useMaster(st);
    if (k === 'laser') this.laserHit = true;
    // (El escudo trae su propio aviso: shieldFx, con la burbuja sobre el mazo.)
    if (k !== 'escudo') toast(k === 'reloj' ? `${icon('arena')} ¡Todo congelado ${E.CLOCK_TURNS} turnos!` : k === 'laser' ? `${icon('laser')} ¡Piedras rotas!` : `${icon('llaveMaestra')} ¡Candados y cortinas abiertos!`);
    this.refresh();
    if (k === 'escudo') this.shieldFx();
    this.updateCounts();
    this.save();
  }
  // Ver cartas: todas las del tablero se voltean unos segundos (con cuenta grande) y regresan.
  peekAll(secs) {
    this.busy = true;
    const hidden = this.cards.filter((c) => !c.removed && c.el && !this.st.rem[c.id] && !this.shownUp(c));
    hidden.forEach((c, i) => setTimeout(() => c.el?.classList.add('up', 'peek-all'), reduced() ? 0 : i * 25));
    const big = document.createElement('div');
    big.className = 'peek-count outl';
    this.el.append(big);
    for (let i = 0; i < secs; i++) setTimeout(() => (big.textContent = secs - i), i * 1000);
    setTimeout(() => {
      big.remove();
      hidden.forEach((c) => c.el?.classList.remove('peek-all'));
      this.busy = false;
      this.refresh();
    }, secs * 1000);
  }
  helpFly(k, from) {
    const br = this.boardEl.getBoundingClientRect();
    const [bx, by] = center(br);
    if (reduced() || !from) return Promise.resolve(sparkle({ x: bx, y: by }, 18));
    const f = document.createElement('div');
    f.className = 'help-fly';
    f.style.cssText = `left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px;background-image:${this.helpBack(k)}`;
    document.body.append(f);
    const dx = bx - (from.left + from.width / 2), dy = by - (from.top + from.height / 2);
    return f
      .animate(
        [
          { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
          { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 40}px) rotate(-14deg) scale(1.25)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${dx}px, ${dy}px) rotate(8deg) scale(1.7)`, opacity: 1, offset: 0.75 },
          { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(2.3)`, opacity: 0, filter: 'brightness(2.2)' },
        ],
        { duration: 640, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)' },
      )
      .finished.then(() => {
        f.remove();
        sparkle({ x: bx, y: by }, 22);
      });
  }

  useWild(from) {
    if (this.coach) return;
    if (this.st.top?.wild) return toast('Ya tienes un comodín en juego');
    // Sin comodines no se llega aquí: el grupo de ayudas lo compra con un toque (11 nov 2026: ya no hay ventana).
    if (save.wild <= 0 && !this.opts.dev?.infinite) return;
    if (!this.opts.dev?.infinite) save.wild--;
    persist();
    this.usedWild = true;
    this.history.push({ t: 'wild', before: this.st, best: this.best, bonus: this.bonus });
    // Marea: el comodín cuenta como jugada (baja el agua).
    this.st = E.setTide(this.level, { ...E.cloneState(this.st), top: { wild: true } }, -1);
    // Constelación a la mitad: el comodín la apaga (es otra carta en medio).
    if (E.cstStep(this.level, this.st, false) === 'lost') this.cstFx({ cst: 'lost' });
    this.updateStuck(); // con el comodín arriba ya hay jugada: se quita el aviso de atorado
    const a = from || this.el.querySelector('.wild-card').getBoundingClientRect();
    const b = this.wasteEl.getBoundingClientRect();
    const f = this.flyer({ wild: true }, { left: a.left + (a.width - b.width) / 2, top: a.top + (a.height - b.height) / 2, width: b.width }, true);
    toss(f, {}, { x1: b.left - a.left - (a.width - b.width) / 2, y1: b.top - a.top - (a.height - b.height) / 2 }, 360).then(() => {
      f.remove();
      this.landWaste();
    });
    this.updateCounts();
    this.save();
  }

  playable() {
    return E.legal(this.level, this.st).map((c) => this.cards[c.id]);
  }

  hasMove() {
    return this.playable().length > 0;
  }

  hint() {
    const c = this.playable()[0];
    const target = c ? c.el : this.stock.length ? this.stockTop() : null;
    if (!target) return toast('Sin jugadas: usa un comodín o compra cartas');
    target.classList.remove('hint');
    void target.offsetWidth;
    target.classList.add('hint');
    setTimeout(() => target.classList.remove('hint'), 1300);
  }

  // Precio de los boosters según el nivel que se juega (mismos escalones que los boletos).
  // En el evento y las festividades todo cuesta 15% más (también +5); con la lluvia de meteoritos, comodín y
  // deshacer cuestan 30% menos.
  // Apuesta (8 nov 2026): con ×N las ayudas de este nivel cuestan ×N (no se dice en los textos de la apuesta).
  priceOf(kind) {
    const r = this.helpRate(kind), m = this.opts.bet || 1;
    return round5((r ? round5(this.basePrice(kind) * (1 + r)) : this.basePrice(kind)) * m);
  }
  basePrice(kind) {
    return price(kind, this.level.world * LEVELS_PER_WORLD, Math.max(this.level.world, save.open || 0) * LEVELS_PER_WORLD);
  }
  helpRate(kind) {
    return this.opts.event ? EV_MARKUP : this.opts.meteor ? -helpOff(this.opts.meteor, kind) : 0;
  }

  // kind: 'undo' (3 deshacer) o 'extra' (+5 cartas al mazo, solo atascado). El comodín se compra en el grupo de ayudas.
  offerBuy(kind) {
    const cost = kind === 'extra' ? this.extraCost() : this.priceOf(kind);
    const n = { undo: 3, extra: 5 }[kind];
    const onSale = this.helpRate(kind) < 0;
    this.modalOpen = true;
    // Lo que se compra se ve en grande, flotando con rayos detrás.
    const hero = {
      undo: `<div class="hero-undo">${[0, 1, 2].map((k) => `<span style="--k:${k}">${icon('undo')}</span>`).join('')}</div>`,
      extra: `<div class="hero-fan">${[0, 1, 2, 3, 4].map((k) => `<i style="--k:${k}"></i>`).join('')}</div>`,
    }[kind];
    const text = {
      undo: 'Con <b>deshacer</b> regresas tu última jugada o robo.',
      extra: `Llegan <b>5 cartas</b> a tu mazo. ${this.opts.event ? 'Te pueden salvar el nivel.' : 'Con +5 siempre te llevas al menos 1 estrella.'}`,
    }[kind];
    openModal({
      title: { undo: '¡Te quedaste sin deshacer!', extra: '¿Comprar +5 cartas?' }[kind],
      color: { undo: 'green', extra: 'violet' }[kind],
      cls: 'buy-modal',
      body: `<div class="buy-hero"><div class="rays"></div>${hero}<b class="qty outl">${kind === 'extra' ? '+5' : `×${n}`}</b></div>
        <p class="lead">${text}</p>
        ${onSale ? `<p class="met-sale">${icon(this.opts.meteor.ico)}${this.opts.meteor.name}: <b>−${Math.round(-this.helpRate(kind) * 100)}%</b></p>` : ''}
        ${save.coins < cost ? '<p class="note">No te alcanzan las monedas.</p>' : ''}`,
      onClose: () => (this.modalOpen = false),
      buttons: [
        {
          label: `Comprar ${coin()} ${onSale ? `<s>${this.basePrice(kind)}</s> ` : ''}${cost}`,
          cls: 'green grow',
          disabled: save.coins < cost,
          onClick: () => {
            if (kind === 'extra') return this.payExtra(cost);
            save.coins -= cost;
            save[kind] += n;
            persist();
            this.buyFx(kind, cost, n);
          },
        },
        { label: 'Ahora no', cls: 'later' },
      ],
    });
  }

  // Compra con animación: las monedas salen del monedero hacia el botón y luego llega lo comprado, que rebota en su sitio.
  async buyFx(kind, cost, n) {
    const btn = this.el.querySelector('.undo-btn');
    const r = btn.getBoundingClientRect();
    const to = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    const counter = btn.querySelector('.badge');
    counter.textContent = save[kind] - n;
    await spendFromWallet('coins', to, cost);
    if (reduced()) return this.updateCounts();
    // Salen casi juntos (uno tras otro, encimados) para que no se haga larga la espera.
    let got = 0;
    const one = async (i) => {
      const f = document.createElement('div');
      f.className = 'fly-prize gain';
      f.innerHTML = icon('undo');
      f.style.cssText = `left:${innerWidth / 2}px;top:${innerHeight * 0.42}px`;
      this.el.append(f);
      const dx = to.x - innerWidth / 2, dy = to.y - innerHeight * 0.42;
      await f.animate(
        [
          { translate: '0 0', scale: 0, rotate: '-20deg' },
          { translate: '0 -10px', scale: 2.2, rotate: '8deg', offset: 0.3 },
          { translate: '0 -10px', scale: 2, rotate: '0deg', offset: 0.45 },
          { translate: `${dx}px ${dy}px`, scale: 0.8, rotate: '0deg' },
        ],
        { duration: 480, delay: i * 110, easing: 'cubic-bezier(0.5, 0, 0.5, 1)', fill: 'backwards' },
      ).finished;
      f.remove();
      counter.textContent = save[kind] - n + ++got;
      squash(btn);
      sparkle(to, 8);
      buzz(12);
    };
    await Promise.all([...Array(n).keys()].map(one));
  }

  // +5 cartas compradas: van al final del mazo y también a los estados guardados para deshacer
  // (deshacer nunca quita lo que se compró). Las monedas salen hacia el mazo y las cartas llegan volando una por una.
  async addExtra(cost) {
    this.extras++;
    const free = this.cards.filter((c) => E.isOpen(this.level, c, this.st));
    const add = [];
    for (let i = 0; i < 5; i++) {
      const f = free[i % Math.max(1, free.length)];
      const rank = f ? (E.rankOf(f, this.st) + (Math.random() < 0.5 ? 1 : 12)) % 13 : Math.floor(Math.random() * 13);
      add.push({ rank, suit: Math.floor(Math.random() * 4) });
    }
    this.busy = true;
    const sr = this.stockEl.getBoundingClientRect();
    if (cost) await spendFromWallet('coins', { x: sr.left + sr.width / 2, y: sr.top + sr.height / 2 }, cost);
    this.st = E.cloneState(this.st);
    this.st.stock.push(...add);
    for (const h of this.history) h.before = { ...h.before, stock: [...h.before.stock, ...add] };
    this.renderPiles();
    this.save();
    const slots = this.stockEls.slice(0, 5).reverse();
    if (!reduced()) {
      slots.forEach((e) => (e.style.opacity = 0));
      const w = this.stockEl.offsetHeight / 1.4;
      const x0 = innerWidth / 2 - w / 2, y0 = innerHeight * 0.38;
      await Promise.all(
        slots.map((slot, i) =>
          wait(i * 140).then(async () => {
            // Aparece al centro con un salto y luego se mete en su hueco del mazo.
            const f = this.flyer({}, { left: x0, top: y0, width: w }, false);
            await f.animate([{ scale: 0.2, rotate: '-25deg', opacity: 0 }, { scale: 1.15, rotate: '6deg', opacity: 1, offset: 0.7 }, { scale: 1, rotate: '0deg', opacity: 1 }], { duration: 260, easing: 'ease-out' }).finished;
            const t = slot.getBoundingClientRect();
            await this.intoSlot(f, slot, t.left - x0, t.top - y0, 0);
            squash(slot);
          }),
        ),
      );
    }
    this.busy = false;
    toast('+5 cartas al mazo');
    this.updateStuck();
  }

  checkEnd() {
    if (E.won(this.st, this.level)) return this.win();
  }

  // Sin mazo y sin jugadas: la carta +5 y "Finalizar nivel" saltan para que se vean (sin ventana).
  updateStuck(announce) {
    const stuck = this.isStuck();
    const was = this.el.classList.contains('no-moves');
    this.el.classList.toggle('no-moves', stuck);
    if (!stuck || was || !announce) return;
    setTimeout(() => {
      // Se revisa de nuevo: pudo usar un comodín en este rato (y ya tener jugada).
      if (!this.isStuck()) return this.updateStuck();
      if (this.broke()) return this.noWayOut();
      toast('Sin jugadas: compra +5 cartas o finaliza el nivel');
      if (reduced()) return;
      const pop = [{ scale: 0.4, opacity: 0 }, { scale: 1.15, opacity: 1, offset: 0.6 }, { scale: 1, opacity: 1 }];
      this.el.querySelector('.end-btn')?.animate(pop, { duration: 420, easing: 'ease-out' });
      this.stockEl.querySelector('.buy5')?.animate([{ rotate: '0deg' }, { rotate: '-8deg' }, { rotate: '7deg' }, { rotate: '-4deg' }, { rotate: '0deg' }], { duration: 600, delay: 200 });
    }, 350);
  }

  // Atorado y sin con qué salir: sin comodines y sin monedas para +5 ni para un comodín.
  broke() {
    return !this.opts.dev?.infinite && save.wild <= 0 && save.coins < Math.min(this.extraCost(), this.priceOf('wild'));
  }
  // Le dice qué hacer en vez de dejarlo atorado: esperar el regalo diario, o abandonar este nivel para juntar
  // monedas en otros (jugar otro nivel pide abandonar el que está a medias). Con los botones de la pausa.
  // kind: 'stuck' (sin jugadas) · 'wild' o 'undo' (tocó uno que tiene en 0 y no le alcanza para comprarlo).
  noWayOut(kind = 'stuck') {
    if (this.done || this.modalOpen) return;
    this.modalOpen = true;
    const left = this.cards.filter((c) => !c.removed && !this.inDoor(c)).length, have = `(tienes ${save.coins})`;
    const lead = {
      stuck: `Te ${left === 1 ? 'falta 1 carta' : `faltan ${left} cartas`}, pero ya no tienes <b>comodines</b> y para <b>+5 cartas</b> necesitas ${coin()} ${Math.min(this.extraCost(), this.priceOf('wild'))} ${have}.`,
      undo: `Ya no tienes <b>deshacer</b> y 3 cuestan ${coin()} ${this.priceOf('undo')} ${have}.`,
    }[kind];
    const m = openModal({
      title: { stuck: '¡Te quedaste sin ayudas!', undo: '¡Sin deshacer ni monedas!' }[kind],
      color: 'violet',
      cls: 'ev-intro broke-modal',
      body: `<div class="evi-hero"><div class="rays"></div><span class="evi-ico">${icon(kind === 'undo' ? 'undo' : 'wild', 0, 0, 'big')}</span></div>
        <p class="lead">${lead}</p>
        <ul class="evi-rules">
          <li>${icon('gift')}<span>Reclama tu <b>regalo diario</b>: trae monedas y a veces comodines.${this.opts.saved && this.opts.canExit !== false ? ' <b>Guarda y sal</b>: tu partida te espera.' : ''}</span></li>
          <li>${this.opts.event ? icon(this.opts.event.ico) : icon('star')}<span>${this.opts.event ? 'Junta monedas en los niveles de <b>tu camino</b> y regresa con más.' : this.opts.saved ? 'Para juntar monedas en <b>otros niveles</b> tienes que <b>abandonar</b> este.' : 'Junta monedas en <b>otros niveles</b>: cada estrella nueva paga.'}</span></li>
        </ul>`,
      onClose: () => (this.modalOpen = false),
      buttons: this.pauseButtons(),
    });
    if (!reduced()) m.el.querySelectorAll('.evi-rules li').forEach((el, i) => el.animate([{ opacity: 0, translate: '-14px 0' }, { opacity: 1, translate: '0 0' }], { duration: 320, delay: 300 + i * 120, easing: 'ease-out', fill: 'backwards' }));
  }

  isStuck() {
    // Con una llave en la mano todavía puedes abrir una puerta.
    return !this.done && !this.stock.length && !this.hasMove() && !this.level.doors?.some((_, d) => E.canOpen(this.level, this.st, d));
  }

  // Comprar +5 cartas tocando la carta +5 (solo si estás atascado y te alcanza).
  // Tocar el hueco +5 del mazo: abre la ventana de compra (como deshacer).
  buyExtra() {
    if (this.done || this.busy || this.modalOpen) return;
    if (this.broke() && this.isStuck()) return this.noWayOut();
    this.offerBuy('extra');
  }
  payExtra(cost) {
    save.coins -= cost;
    persist();
    this.el.classList.remove('no-moves');
    this.addExtra(cost);
  }


  // "Finalizar nivel": rendirse o seguir jugando (para usar comodín o deshacer). 10 nov 2026: sin «Reintentar · nuevo
  // boleto» (acostado se veía mal; el usuario lo quitó): para reintentar se rinde y vuelve a entrar.
  endLevel() {
    if (this.done || this.modalOpen) return;
    this.modalOpen = true;
    const left = this.cards.filter((c) => !c.removed && !this.inDoor(c)).length;
    const cost = this.extraCost(), short = save.coins < cost;
    const fan = [0, 1, 2, 3, 4].map((k) => `<div class="card mini-back" style="left:${6 + k * 9}px;rotate:${-14 + k * 7}deg"></div>`).join('');
    const m = openModal({
      title: '¿Finalizar el nivel?',
      color: 'pink',
      // El cuadro grande es el botón de comprar +5: dice el precio y se toca para gastar (gris si no alcanza).
      body: `<button class="offer buy press"${short ? ' disabled' : ''}><div class="fan">${fan}</div><div><b>Comprar +5 cartas</b><span>Quedan ${left} carta${left === 1 ? '' : 's'} en el tablero. ${this.opts.event ? 'Te pueden salvar el nivel.' : 'Con +5 siempre te llevas al menos 1 estrella.'}</span>
          <em class="cost${short ? ' short' : ''}">${coin()} ${cost || 'gratis'}${short ? ' · te faltan monedas' : ''}</em></div></button>${this.opts.event || this.opts.free ? '' : betLoseHTML(this.opts.bet, this.opts.betPaid, 'si te rindes')}${this.streakWarn(true)}`,
      onClose: () => (this.modalOpen = false),
      buttons: [
        { label: 'Rendirse', cls: 'pink grow', onClick: () => (this.trackEnd(false), this.opts.onAbandon(true)) },
        { label: 'Seguir jugando', cls: 'ghost grow' },
      ],
    });
    m.el.querySelector('.offer.buy').addEventListener('click', () => {
      if (short) return;
      m.close();
      this.payExtra(cost);
    });
  }


  // Rendirse o abandonar (nivel nuevo o repetido) reinicia la racha: se avisa solo si hay algo que perder.
  streakWarn(end) {
    const r = this.opts.rachaRisk?.();
    if (!r) return '';
    const when = !end ? 'Si abandonas' : 'Si te rindes';
    return streakWarnHTML(r.n, r.pend, when);
  }

  // Misiones y logros (missions.js): lo que se hizo en el nivel, al terminarlo (no en la galería del modo dev).
  // Se cuenta del estado final (deshacer ya lo dejó como quedó); los cometas atrapados se llevan aparte.
  trackEnd(won, stars = 0, left = 0, coins = 0) {
    if (this.tracked || this.opts.noTrack) return;
    this.tracked = true;
    const { level, st } = this, gone = (f) => level.cards.filter((c) => c[f] != null && st.rem[c.id]).length;
    let rewards = 0, brooms = 0;
    for (let n = 1; n <= this.best; n++) {
      const r = E.streakReward(n, level.rewardStep ?? 1);
      if (r) rewards++;
      if (E.BROOM[r]) brooms++;
    }
    const turboLeft = st.stock.filter((c) => c.turbo).length;
    const stats = {
      cards: st.plays, streak: this.best, rewards, locks: gone('lock'), packs: gone('pack'), ice: gone('ice'),
      bombs: level.cards.filter((c) => c.bomb && st.rem[c.id] && !st.boom.includes(c.id)).length, comets: this.caught || 0,
      turbo: gone('turbo') + Math.max(0, level.stock.filter((c) => c.turbo).length - turboLeft), halves: gone('half'),
      coincards: gone('coin'), ghosts: gone('ghost'), cham: gone('cham'),
      arrows: gone('arrow'), doubles: gone('alt'), lives: gone('live'), curtains: gone('curtain'), brooms,
      ...(won && { win: 1, stars, three: +(stars === 3), noundo: +!this.usedUndo, noextra: +!this.extras, nowild: +!this.usedWild, left, boss: +!!(level.boss && !level.secret), event: +!!this.opts.event, secret: +!!level.secret, coins,
        boss3: +!!(level.boss && !level.secret && stars === 3), pure: +(stars === 3 && !this.usedUndo && !this.usedWild && !this.extras),
        // Logros Apostador ×N (10 nov 2026): niveles ganados con cada apuesta.
        ...(this.opts.bet > 1 && { [`bet${this.opts.bet}`]: 1 }) }),
    };
    const done = track(stats);
    done.forEach((x, i) => setTimeout(() => toast(`${icon('check')} ¡Misión cumplida! ${missionDef(x.id).text(x.goal)}`), 900 + i * 1600));
  }

  win() {
    this.done = true;
    this.coach?.end();
    const left = this.stock.length;
    const stars = this.extras ? 1 : E.starsFor(this.level, left);
    const shown = shownCoins();
    const res = this.opts.onWin(stars);
    this.trackEnd(true, stars, left, res.coins || 0);
    // Las monedas del nivel se suman al volver al mapa, volando al monedero: detrás de la ventana la ficha se queda
    // como estaba (onWin ya las guardó y las pintaba de golpe).
    const pill = this.el.querySelector('.hud-r [data-coins]');
    if (pill) pill.textContent = money(shown);
    const { coins, tickets, prev, gold, cgold, wild, undo, col } = res;
    const ev = this.opts.event;
    const title = ev ? res.title : this.level.secret ? '¡Nivel secreto!' : this.level.boss ? '¡Jefe derrotado!' : '¡Nivel superado!';
    // Los premios son burbujas (icono + cantidad, sin texto) que salen de las estrellas y suben despacio; se pueden
    // tronar y cuentan para el premio de burbujas (countPop en ui.js).
    // 9 nov 2026: las burbujas traen la cantidad ya multiplicada y SIN etiqueta ×N ni ×2 de la lluvia (parecía que se
    // ganaba eso ×N otra vez); el ×N de la apuesta va solo en el sello.
    const bet = res.bet > 1 ? res.bet : 0;
    const bub = (ico, n) => `${ico}<b>+${n}</b>`;
    const loot = [
      coins && bub(coin(), coins),
      tickets && bub(icon('ticket'), tickets),
      gold && bub(icon('gold'), 1),
      cgold && bub(icon('constTicket'), 1),
      wild && bub(icon('wild'), wild),
      undo && bub(icon('undo'), undo),
      col && bub(icon(col.ico), col.n),
      ev && res.items?.length && bub(icon('gift'), res.items.length),
      ...Object.entries(res.helps || {}).map(([k, n]) => bub(icon(HELPS[k].ico), n)),
    ].filter(Boolean);
    const note = ev ? (res.repeat ? '<p class="note">Ya tenías los exclusivos de este planeta: te tocan ayudas.</p>' : '')
      : !coins && prev >= 3
      ? '<p class="note">Ya cobraste las 3 estrellas de este nivel.</p>'
      : prev && stars <= prev
        ? `<p class="note">Tu récord aquí es de ${prev} estrella${prev > 1 ? 's' : ''}: solo se pagan las nuevas.</p>`
      : stars > prev && prev ? '<p class="note">¡Nuevo récord de estrellas!</p>' : '';
    setTimeout(() => {
      confetti();
      const m = openModal({
        title,
        color: 'gold',
        closable: false,
        cls: 'win',
        body: `<div class="win-top"><div class="rays"></div>${ev ? `<div class="ev-win${ev.boss ? ' boss' : ''}">${icon(ev.ico, 0, 0, 'big')}</div>` : `<div class="big-stars">${starsHTML(stars)}</div>`}${bet ? `<span class="win-bet b${bet}">×${bet}</span>` : ''}</div>${bet ? `<p class="note bet-note">¡Apostaste ×${bet}: todo lo que ganaste va multiplicado!</p>` : ''}${note}`,
        // Sin las 3 estrellas puede repetirlo ahí mismo (gratis: ya lo ganó). Se queda su mejor resultado.
        // Repetir es solo el ícono; Continuar ocupa el resto del renglón (o todo, si no hay Repetir).
        buttons: [
          !ev && res.replay && stars < 3 && { label: icon('replay'), cls: 'ghost sq', title: 'Repetir', onClick: () => this.opts.onReplay() },
          { label: `Continuar ${icon('next')}`, cls: `green ${!ev && res.replay && stars < 3 ? 'grow' : 'wide'}`, onClick: () => this.opts.onDone?.(res) },
        ].filter(Boolean),
      });
      // Jefe sin cofre (el del evento o uno ya ganado): los globos salen aquí. Si hay cofre, salen en su ventana.
      if (((this.level.boss && !this.level.secret) || ev?.boss) && !res.chest) balloons(m);
      // Las burbujas se colocan cuando la ventana ya terminó de entrar (si no, salen desfasadas), justo debajo de las estrellas.
      const top = m.el.querySelector('.win-top');
      const settled = () => Promise.all(m.el.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations !== Infinity && !a.effect.target?.closest?.('.balloons')).map((a) => a.finished.catch(() => {})));
      const launch = () => settled().then(() => m.el.isConnected && lootBubbles(m, loot, top, { lift: 40 - top.offsetHeight }));
      if (reduced()) return launch();
      // Cada estrella cae con su golpe; luego salen los premios.
      m.el.querySelectorAll('.big-stars .star').forEach((el, i) => {
        if (i >= stars) return;
        setTimeout(() => {
          buzz(15);
          const r = el.getBoundingClientRect();
          sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 8);
        }, 520 + i * 200);
      });
      setTimeout(launch, ev ? 700 : 600 + stars * 200);
    }, 450);
  }

  // Nivel nuevo: salir guarda la partida (al volver sigues donde ibas) o la abandonas.
  // Repetición: salir pierde el intento.
  // Los 3 botones de la pausa (seguir, guardar y salir, abandonar): también en la ventana de "sin ayudas".
  pauseButtons() {
    const free = () => (this.modalOpen = false);
    const confirmLeave = () =>
      openModal({
        title: '¿Abandonar el nivel?',
        color: 'pink',
        onClose: free,
        body: `<p class="lead">${this.opts.event ? (this.opts.event.tk ? 'Se gasta tu boleto del evento: el siguiente llega en 48 horas.' : 'Pierdes este intento; puedes volver a jugarlo.') : this.opts.free ? 'Se pierde este intento.' : 'Pierdes los boletos y lo que gastaste en este intento.'}</p>${this.opts.event || this.opts.free ? '' : betLoseHTML(this.opts.bet, this.opts.betPaid)}${this.streakWarn()}`,
        buttons: [{ label: 'Seguir jugando', cls: 'ghost' }, { label: 'Abandonar', cls: 'pink', onClick: () => (this.trackEnd(false), this.opts.onAbandon(true)) }],
      });
    return [
      { label: `${icon('play')} Continuar`, cls: 'green wide' },
      // Sin Guardar y salir (canExit: false) en eventos y desde la constelación 2 (7 nov 2026).
      this.opts.saved && this.opts.canExit !== false && { label: `${icon('door')} Guardar y salir`, cls: 'ghost wide', onClick: () => this.opts.onExit() },
      { label: this.opts.saved ? 'Abandonar nivel' : `${icon('door')} Salir`, cls: 'pink wide', onClick: () => setTimeout(() => ((this.modalOpen = true), confirmLeave()), 0) },
    ].filter(Boolean);
  }

  exit() {
    if (this.modalOpen) return;
    this.modalOpen = true;
    const free = () => (this.modalOpen = false);
    // Sin haber jugado nada: sale directo y no cuenta como abandonar (la racha no se pierde).
    if (!this.opts.saved && !this.history.length && !this.opts.dev) return free(), this.opts.onAbandon(false);
    openModal({
      title: 'Pausa',
      color: 'gray',
      onClose: free,
      body: (this.opts.saved ? (this.opts.canExit === false ? '<p class="note">Este nivel no se puede dejar a medias: termínalo o abandónalo. Si cierras el juego, tienes 30 minutos para volver.</p>' : '<p class="note">Tu partida se guarda: al volver sigues donde te quedaste.</p>') : this.level.secret && this.opts.rachaRisk?.()?.isNew ? '<p class="note">Si sales del nivel secreto, se pierde este intento.</p>' : '<p class="note">Estás repitiendo un nivel: si sales, se pierde este intento.</p>')
        + (this.opts.saved ? '' : this.streakWarn()),
      buttons: this.pauseButtons(),
      cls: 'pause',
    });
  }

  // ---------- Modo dev (ver js/dev.js) ----------
  // Si sin comodines no sale (niveles que piden ayuda), lo intenta con hasta 3.
  solveHere() {
    for (let w = 0; w <= 3; w++) {
      const path = E.solve(this.level, this.st, w ? 60000 : 250000, w);
      if (path) return path;
    }
    return null;
  }

  devReveal(on) {
    this.boardEl.classList.toggle('reveal', on);
  }

  // Numera las cartas en el orden de una solución desde el estado actual.
  devSolution() {
    this.boardEl.querySelectorAll('.dev-num').forEach((e) => e.remove());
    const path = this.solveHere();
    if (!path) return toast('Sin solución desde aquí: deshaz algo');
    let k = 0;
    const wilds = path.filter((m) => m === 'wild').length;
    for (const m of path) if (m !== 'draw' && m !== 'wild') this.cards[m].el?.insertAdjacentHTML('beforeend', `<span class="dev-num">${++k}</span>`);
    toast(`Solución: ${k} jugadas, ${path.length - k - wilds} robos${wilds ? ` y ${wilds} comodín${wilds > 1 ? 'es' : ''}` : ''}`);
  }

  devStep() {
    if (this.done) return false;
    if (this.busy) return true; // animación en curso (barajeo o carta regalo): esperar

    const path = this.solveHere();
    if (!path) {
      toast('Sin solución desde aquí: deshaz algo');
      return false;
    }
    this.boardEl.querySelectorAll('.dev-num').forEach((e) => e.remove());
    if (path[0] === 'draw') this.draw();
    else if (path[0] === 'wild') {
      if (save.wild <= 0 && !this.opts.dev?.infinite) {
        toast('Aquí va un comodín y no tienes');
        return false;
      }
      this.useWild();
    } else this.play(this.cards[path[0]]);
    return true;
  }

  async devAuto() {
    if (this.autoplay) return (this.autoplay = false);
    this.autoplay = true;
    while (this.autoplay && !this.done && this.devStep()) await new Promise((r) => setTimeout(r, 220));
    this.autoplay = false;
  }

  devWin() {
    this.st = { ...E.cloneState(this.st), rem: this.st.rem.map(() => true) };
    for (const c of this.cards) {
        c.removed = true;
      c.el?.remove();
      c.el = null;
    }
    this.refresh();
    this.win();
  }
}
