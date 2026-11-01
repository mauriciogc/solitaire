// Comprueba que todos los niveles se pueden ganar y muestra estadísticas.
// Primero sigue la solución con la que se generó cada nivel (robando cuando hace falta) con el motor
// de reglas real, que aplica premios de racha, cartas regalo, bombas, etc. Si esa ruta no alcanza,
// prueba con el solucionador. Uso: node tests/verify-levels.mjs
import { generateLevel, eventLevel, EVENT_LEVELS, TOTAL_LEVELS, WORLD_COUNT, overlaps, MECHANICS } from '../js/levels.js';
import { initState, playRank, play, draw, won, solve } from '../js/engine.js';

let fails = 0;
let bySolver = 0;
const stats = { cards: [], stock: [], tpl: {}, mechs: {} };

function reference(L) {
  let s = initState(L);
  for (const id of L.solution) {
    if (s.rem[id]) continue;
    while (playRank(L, L.cards[id], s) == null) {
      if (!s.stock.length) return false;
      s = draw(L, s).s;
    }
    s = play(L, s, id).s;
  }
  return won(s);
}

// Los 5,200 niveles normales, los 520 secretos (uno por mundo) y una muestra del evento del mes:
// 3 años de ediciones (8 meses cada uno) × jugadores en distintos mundos × sus 25 niveles.
const ALL = TOTAL_LEVELS + WORLD_COUNT;
const EVENT_MONTHS = [0, 1, 3, 6, 8, 9, 10, 11];
const EVENTS = [];
for (let y = 2026; y < 2029; y++) for (const m of EVENT_MONTHS) for (const w of [0, 3, 12, 20, 30, 80, 250, 519]) EVENTS.push([y * 12 + m, w]);
const N = ALL + EVENTS.length * EVENT_LEVELS;
let evCount = 0;
for (let g = 0; g < N; g++) {
  const isEv = g >= ALL, e = isEv && EVENTS[Math.floor((g - ALL) / EVENT_LEVELS)];
  const L = isEv ? eventLevel(e[0], (g - ALL) % EVENT_LEVELS, e[1]) : generateLevel(g);
  if (isEv) evCount++;
  let ok = true;

  // Las capas deben ser coherentes: cartas que se solapan nunca comparten capa.
  for (const a of L.cards)
    for (const b of L.cards)
      if (a.id < b.id && a.group === b.group && a.z === b.z && overlaps(a, b)) { ok = false; console.log('misma capa', g, L.template, a.id, b.id); }

  if (ok && !reference(L)) {
    bySolver++;
    ok = !!solve(L, initState(L));
  }
  if (!ok) {
    fails++;
    if (fails < 10) console.log('FALLA nivel', isEv ? `evento ${e[0]} (mundo ${e[1] + 1}) nivel ${L.k + 1}` : L.secret ? `secreto del mundo ${L.world + 1}` : g + 1, L.template, L.meta.mechs.join(','));
  }
  stats.cards.push(L.cards.length);
  stats.stock.push(L.stock.length);
  stats.tpl[L.template] = (stats.tpl[L.template] || 0) + 1;
  for (const m of L.meta.mechs) stats.mechs[m] = (stats.mechs[m] || 0) + 1;
  if (L.meta.pack) stats.short = (stats.short || 0) + (L.stock.length <= 3 ? 1 : 0);
}

const sum = (a) => a.reduce((x, y) => x + y, 0);
const fmt = (a) => `min ${Math.min(...a)} · media ${(sum(a) / a.length).toFixed(1)} · max ${Math.max(...a)}`;
console.log(`Niveles: ${TOTAL_LEVELS} + ${WORLD_COUNT} secretos + ${evCount} del evento · fallidos: ${fails} · resueltos con el solucionador: ${bySolver}`);
console.log('Cartas en tablero:', fmt(stats.cards));
console.log('Cartas en mazo:   ', fmt(stats.stock));
console.log('Plantillas:', stats.tpl);
console.log('Niveles por mecánica:', Object.fromEntries(MECHANICS.map((m) => [m, stats.mechs[m] || 0])));
console.log('Con carta regalo y mazo de 3 o menos:', stats.short || 0);
process.exit(fails ? 1 : 0);
