// Simula un jugador casual (juega cualquier carta válida al azar; si no hay, roba)
// y muestra el % de victorias por tramo de niveles, sin comodines ni deshacer.
// Uso: node tests/difficulty.mjs [partidas por nivel]
import { generateLevel, TOTAL_LEVELS } from '../js/levels.js';
import { playCasual } from '../js/engine.js';
import { mulberry32 } from '../js/rng.js';

const TRIES = +(process.argv[2] || 4);
// Al final se mide aparte una muestra de jefes (nivel 10 de cada mundo).
const BANDS = [[0, 10], [10, 50], [50, 150], [150, 500], [500, 1500], [1500, 3000], [3000, TOTAL_LEVELS]];

const r = mulberry32(42);
for (const [a, b] of BANDS) {
  let wins = 0;
  let n = 0;
  const step = Math.max(1, Math.floor((b - a) / 150));
  const tries = Math.max(TRIES, Math.ceil((600 * step) / (b - a)));
  for (let g = a; g < b; g += step) {
    const L = generateLevel(g);
    for (let t = 0; t < tries; t++, n++) wins += playCasual(L, r);
  }
  console.log(`niveles ${String(a + 1).padStart(4)}-${String(b).padEnd(4)}  victorias casual: ${((wins / n) * 100).toFixed(0)}%`);
}

let bw = 0, bn = 0;
for (let g = 9; g < TOTAL_LEVELS; g += 70) {
  const L = generateLevel(g);
  for (let t = 0; t < 6; t++, bn++) bw += playCasual(L, r);
}
console.log(`jefes (muestra)        victorias casual: ${((bw / bn) * 100).toFixed(0)}%`);
