// Comprueba que todos los niveles se pueden ganar siguiendo la solución con la que se generaron
// y muestra estadísticas de tamaño. Uso: node tests/verify-levels.mjs
import { generateLevel, TOTAL_LEVELS, canFollow, overlaps } from '../js/levels.js';

let fails = 0;
const stats = { cards: [], stock: [], left: [], tpl: {} };

for (let g = 0; g < TOTAL_LEVELS; g++) {
  const L = generateLevel(g);
  const removed = new Set();
  const stock = [...L.stock];
  let top = L.waste0;
  let ok = true;

  // Las capas deben ser coherentes: cartas que se solapan nunca comparten capa.
  for (const a of L.cards)
    for (const b of L.cards)
      if (a.id < b.id && a.group === b.group && a.z === b.z && overlaps(a, b)) { ok = false; console.log('misma capa', g, L.template, a.id, b.id); }

  for (const id of L.solution) {
    const c = L.cards[id];
    if (!c.coveredBy.every((j) => removed.has(j))) { ok = false; break; }
    if (c.lock != null && !removed.has(L.keys[c.lock])) { ok = false; break; }
    while (!canFollow(top, c.rank)) {
      if (!stock.length) { ok = false; break; }
      top = stock.shift();
    }
    if (!ok) break;
    removed.add(id);
    top = c;
  }
  if (!ok) {
    fails++;
    if (fails < 10) console.log('FALLA nivel', g, L.template);
  }
  stats.cards.push(L.cards.length);
  stats.stock.push(L.stock.length);
  stats.left.push(stock.length);
  stats.tpl[L.template] = (stats.tpl[L.template] || 0) + 1;
  stats.locks = (stats.locks || 0) + (L.keys.length ? 1 : 0);
}

const sum = (a) => a.reduce((x, y) => x + y, 0);
const fmt = (a) => `min ${Math.min(...a)} · media ${(sum(a) / a.length).toFixed(1)} · max ${Math.max(...a)}`;
console.log(`Niveles: ${TOTAL_LEVELS} · fallidos: ${fails}`);
console.log('Cartas en tablero:', fmt(stats.cards));
console.log('Cartas en mazo:   ', fmt(stats.stock));
console.log('Sobrantes (ideal):', fmt(stats.left));
console.log('Plantillas:', stats.tpl);
console.log('Niveles con candado:', stats.locks);
process.exit(fails ? 1 : 0);
