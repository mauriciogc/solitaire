// Endurecer un tablero: que pida exactamente W ayudas (comodines o compras de +5).
// Las cartas del mazo se cambian por cartas que no sirven y luego se regresan las buenas mientras
// siga sin haber solución con una ayuda menos (comprobado buscando todo, con premios de racha).
// Lo usan tools/event-levels.mjs y tools/hard-levels.mjs. Devuelve los números del mazo o null.
import { solveHelp } from '../js/engine.js';

export function harden(L, W) {
  const orig = L.stock;
  // Cartas que no sirven: los dos números con menos vecinos en el tablero.
  const cnt = new Array(13).fill(0);
  for (const c of L.cards) if (c.rank != null) cnt[c.rank]++, c.alt != null && cnt[c.alt]++;
  const junk = [...Array(13).keys()].sort((a, b) => cnt[(a + 1) % 13] + cnt[(a + 12) % 13] - cnt[(b + 1) % 13] - cnt[(b + 12) % 13]).slice(0, 2);
  let stock = orig.map((c, i) => ({ ...c, rank: junk[i % 2] }));
  const t = (st, w, f = 0) => solveHelp({ ...L, stock: st }, w, f);
  const none = (st) => { const z = t(st, W - 1); return !z.ok && !z.cut; };
  // 1) Que se pueda con W comodines (regresando cartas buenas desde arriba).
  for (let i = 0; !t(stock, W).ok; i++) {
    if (i >= orig.length) return null;
    stock[i] = orig[i];
  }
  if (!none(stock)) return null;
  // 2) Regresar las demás cartas buenas mientras siga sin solución con una ayuda menos.
  for (let i = 0; i < orig.length; i++) {
    if (stock[i].rank === orig[i].rank) continue;
    const c = stock.slice();
    c[i] = orig[i];
    if (t(c, W).ok && none(c)) stock = c;
  }
  // 3) También con +5 (si no tiene comodines, siempre puede comprar cartas).
  return t(stock, W).ok && none(stock) && t(stock, 0, W).ok ? stock.map((c) => c.rank) : null;
}

// ¿El mazo s pide exactamente W ayudas? (lo mismo que revisa npm test)
export function needs(L, s, W) {
  const H = { ...L, stock: L.stock.map((c, i) => ({ ...c, rank: s[i] })) };
  const less = solveHelp(H, W - 1);
  return solveHelp(H, W).ok && solveHelp(H, 0, W).ok && !less.ok && !less.cut;
}
