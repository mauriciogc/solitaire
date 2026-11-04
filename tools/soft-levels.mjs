// Suaviza los niveles sin ayudas que salen demasiado duros antes del nivel 2500: si el bot casual gana menos
// del 15%, se prueban otros tableros del mismo nivel (t) y se guarda el que quede más cerca del 30%.
// → js/soft-data.js ({ nivel: t }). No editar a mano. Rehacer si cambias buildLevel o las reglas del motor.
// Uso: node tools/soft-levels.mjs
import { writeFileSync } from 'node:fs';
import { buildLevel, hardHelp } from '../js/levels.js';
import { playCasual } from '../js/engine.js';
import { mulberry32 } from '../js/rng.js';

export const SOFT_UNTIL = 2500, SOFT_LOW = 15, SOFT_AIM = 30;
const GAMES = 80;
// Mismo cálculo que la galería dev (casualRate): semilla fija por nivel para que el resultado no cambie.
export function rate(L, games = GAMES) {
  const r = mulberry32(L.g + 1);
  let w = 0;
  for (let i = 0; i < games; i++) w += playCasual(L, r);
  return Math.round((w / games) * 100);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = {};
  let n = 0;
  for (let g = 10; g < SOFT_UNTIL; g++) {
    if (hardHelp(g) || rate(buildLevel(g)) >= SOFT_LOW) continue;
    let best = null;
    for (let t = 1; t <= 80; t++) {
      const p = rate(buildLevel(g, null, t));
      if (!best || Math.abs(p - SOFT_AIM) < Math.abs(best.p - SOFT_AIM)) best = { t, p };
      if (p >= 25 && p <= 38) break;
    }
    out[g] = best.t;
    n++;
    console.log(`nivel ${g + 1}: tablero ${best.t} → bot ${best.p}%`);
  }
  writeFileSync(
    new URL('../js/soft-data.js', import.meta.url),
    `// Hecho con tools/soft-levels.mjs: no editar a mano. Niveles sin ayudas (antes del ${SOFT_UNTIL}) que salían muy duros\n` +
      `// (bot casual < ${SOFT_LOW}%): { nivel (desde 0): tablero t } con el que el bot gana cerca del ${SOFT_AIM}%.\n` +
      `export const SOFT_DATA = ${JSON.stringify(out)};\n`,
  );
  console.log(`${n} niveles suavizados`);
}
