// Arma los tableros del evento del mes y los guarda en js/event-data.js.
// Cada nivel pide EVENT_HELP ayudas (ver tools/harden.mjs).
// Si un tablero no se deja, se prueba otro (t). Tarda: node tools/event-levels.mjs [mes …]
import { writeFileSync, readFileSync } from 'node:fs';
import { eventBase, EVENT_LEVELS, EVENT_WORLDS } from '../js/levels.js';
import { solveHelp, solve, initState } from '../js/engine.js';
import { harden } from './harden.mjs';
import { EVENT_DATA } from '../js/event-data.js';

const MONTHS = [0, 1, 3, 6, 8, 9, 10, 11];
const OUT = new URL('../js/event-data.js', import.meta.url);
const TRIES = +process.env.TRIES || 30;
// Tope por nivel (CAP ms, 150 s por cada número de ayudas): un tablero terco no traba la corrida.
const CAP = +process.env.CAP || 150e3;

if (process.argv[2] === '--merge') {
  const all = {};
  for (const f of process.argv.slice(3)) Object.assign(all, JSON.parse(readFileSync(f, 'utf8')));
  write(all);
  process.exit(0);
}
// ¿Sigue valiendo lo guardado? (sin ayudas: que tenga solución; con ayudas: lo mismo que pide la prueba)
function valid(m, k, g, d) {
  if (!d) return false;
  const L = eventBase(m, k, g, d.t);
  if (!L.help) return !!solve(L, initState(L));
  if (!d.s) return false;
  const H = { ...L, stock: L.stock.map((c, i) => ({ ...c, rank: d.s[i] })) }, W = d.h ?? L.help;
  const less = solveHelp(H, W - 1);
  return solveHelp(H, W).ok && solveHelp(H, 0, W).ok && !less.ok && !less.cut;
}
// --fix [mes …]: revisa lo que ya está en event-data.js y solo rehace lo que dejó de valer.
const fix = process.argv[2] === '--fix';
const months = process.argv.slice(fix ? 3 : 2).map(Number);
const data = {};
for (const m of months.length ? months : MONTHS) {
  for (let g = 0; g < EVENT_WORLDS.length; g++) {
    const list = [];
    for (let k = 0; k < EVENT_LEVELS; k++) {
      const old = EVENT_DATA[`${m}.${g}`]?.[k];
      if (fix && valid(m, k, g, old)) {
        list.push(old);
        continue;
      }
      if (fix) console.log(`rehaciendo: mes ${m + 1} grupo ${g} nivel ${k + 1}`);
      let entry = null, t0 = Date.now();
      for (let t = 0; t < TRIES && !entry && Date.now() - t0 < CAP; t++) {
        const L = eventBase(m, k, g, t);
        if (!L.help) entry = solve(L, initState(L)) ? { t } : null;
        else {
          const s = harden(L, L.help);
          if (s) entry = { t, s };
        }
      }
      // Si con su mesa especial no se logró, sin ella (intentos desde 500).
      t0 = Date.now();
      if (!entry && eventBase(m, k, g).scroll)
        for (let t = 500; t < 500 + TRIES && !entry && Date.now() - t0 < CAP; t++) {
          const s = harden(eventBase(m, k, g, t), eventBase(m, k, g).help);
          if (s) entry = { t, s };
        }
      // Si con sus ayudas no se logró, con una menos (h guarda cuántas pide entonces).
      t0 = Date.now();
      for (let h = eventBase(m, k, g).help - 1; h > 0 && !entry; h--, t0 = Date.now())
        for (let t = 0; t < TRIES && !entry && Date.now() - t0 < CAP; t++) {
          const s = harden(eventBase(m, k, g, t), h);
          if (s) entry = { t, s, h };
        }
      if (!entry) console.log(`sin lograr: mes ${m + 1} grupo ${g} nivel ${k + 1}`);
      list.push(entry || { t: 0 });
    }
    data[`${m}.${g}`] = list;
    console.log(`mes ${m + 1} grupo ${g} listo`);
  }
}
// PART=archivo: solo guarda lo hecho en ese archivo (para correr un proceso por mes y luego juntar con --merge).
if (process.env.PART) writeFileSync(process.env.PART, JSON.stringify(data));
else write(data);
function write(d) {
  writeFileSync(OUT, `// Hecho con tools/event-levels.mjs: no editar a mano. "mes.grupo" → 25 niveles { t: intento, s: números del mazo, h: ayudas si son menos que EVENT_HELP }.\nexport const EVENT_DATA = ${JSON.stringify(d)};\n`);
}
