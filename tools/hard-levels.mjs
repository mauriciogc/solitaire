// Arma los niveles que piden ayudas:
// - camino → js/path-data.js: los 1,118 niveles del camino normal marcados en hardHelp (ver levels.js).
// - especiales → js/special-data.js: los 1,000 tableros para eventos exclusivos (specialHelp: 1, 2, 3 o 4 ayudas).
// Cada uno se endurece con tools/harden.mjs; si un tablero no se deja, se prueba otro (t).
// Camino: si con sus ayudas no se logra, se guarda con una menos (h). Especiales: siempre las suyas (es su etiqueta),
// así que se prueban más tableros. Reparte el trabajo en todos los núcleos.
// Uso: node tools/hard-levels.mjs [camino|especiales] [--fix]   (--fix: solo rehace lo que dejó de valer)
// Tarda unos minutos (los de 4 ayudas son los más lentos).
import { writeFileSync } from 'node:fs';
import { fork } from 'node:child_process';
import { cpus } from 'node:os';
import { buildLevel, hardHelp, hardData, specialBase, specialHelp, SPECIAL_COUNT, TOTAL_LEVELS } from '../js/levels.js';
import { harden, needs } from './harden.mjs';
import { HARD_DATA } from '../js/path-data.js';
import { SPECIAL_DATA } from '../js/special-data.js';

const enc = (t, s, h) => `${t}:${s.map((x) => x.toString(13)).join('')}${h ? `:${h}` : ''}`;
// Trabajos: [clave, ayudas pedidas, tablero(t), lo guardado, intentos, ¿solo con las suyas?]
const PATH = [...Array(TOTAL_LEVELS).keys()].filter(hardHelp).map((g) => [g, hardHelp(g), (t) => buildLevel(g, null, t), HARD_DATA[g], 400]);
const SPEC = [...Array(SPECIAL_COUNT).keys()].map((i) => [i, specialHelp(i), (t) => specialBase(i, t), SPECIAL_DATA[i], 2000, true]);

function make([, W, base, , tries, exact]) {
  for (let h = W; h > (exact ? W - 1 : 0); h--)
    for (let t = 0; t < tries; t++) {
      const s = harden(base(t), h);
      if (s) return enc(t, s, h < W && h);
    }
  return '';
}
function valid([, W, base, old, , exact]) {
  const d = hardData(old);
  return !!d?.s && !(exact && d.h) && needs(base(d.t), d.s, d.h ?? W);
}

if (process.env.SHARD) {
  // Proceso hijo: hace los trabajos k, k+n, k+2n… y regresa lo hecho.
  const [k, n] = process.env.SHARD.split('/').map(Number);
  const jobs = process.env.WHAT === 'camino' ? PATH : SPEC;
  const fix = !!process.env.FIX, out = {};
  for (let j = k; j < jobs.length; j += n) {
    const job = jobs[j];
    out[job[0]] = fix && valid(job) ? job[3] : make(job);
    if (!out[job[0]]) console.log(`sin lograr: ${process.env.WHAT} ${job[0]}`);
  }
  process.send(out, () => process.exit(0));
} else {
  const args = process.argv.slice(2), fix = args.includes('--fix');
  const what = ['camino', 'especiales'].filter((w) => !args.length || args.includes(w) || (args.length === 1 && fix));
  const hard = { ...HARD_DATA }, spec = SPECIAL_DATA.slice();
  for (const w of what) {
    const n = Math.max(1, cpus().length - 1), t0 = Date.now();
    const parts = await Promise.all(
      [...Array(n).keys()].map(
        (k) => new Promise((ok) => fork(new URL(import.meta.url).pathname, [], { env: { ...process.env, SHARD: `${k}/${n}`, WHAT: w, FIX: fix ? '1' : '' } }).on('message', ok)),
      ),
    );
    for (const p of parts) for (const [key, v] of Object.entries(p)) w === 'camino' ? (hard[key] = v) : (spec[key] = v);
    console.log(`${w}: listo en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  const head = `// Hecho con tools/hard-levels.mjs: no editar a mano. Cada nivel: "t:mazo[:h]" (t = tablero, mazo = un carácter
// por carta en base 13, h = ayudas si se lograron menos de las pedidas).`;
  if (what.includes('camino')) {
    const keys = Object.keys(hard).map(Number).filter(hardHelp).sort((a, b) => a - b); // sin los que ya no piden ayudas
    writeFileSync(new URL('../js/path-data.js', import.meta.url), `${head} Niveles del camino que piden ayudas (ver hardHelp en levels.js).
export const HARD_DATA = {${keys.map((g) => `${g}:${JSON.stringify(hard[g])}`).join(',')}};
`);
  }
  if (what.includes('especiales'))
    writeFileSync(new URL('../js/special-data.js', import.meta.url), `${head} Tableros especiales (ver specialHelp en levels.js).
export const SPECIAL_DATA = ${JSON.stringify(spec)};
`);
}
