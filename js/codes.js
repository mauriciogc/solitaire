// Códigos de regalo: un texto como "K7QM-3XPA-W9ZD" que da monedas, comodines, deshacer, boletos o una cosa del Tesoro
// escondido (lo que solo sale con código: `code` en shop.js). Nada de lo que hay en la tienda se regala con código.
// No hay servidor: cada código lleva adentro lo que da, un número al azar (así no hay dos iguales) y una firma; el juego
// la revisa, así no sirve inventarse uno. Se canjea una sola vez: los usados quedan en el guardado (viajan en el respaldo y
// no se borran al reiniciar el perfil) y en el dispositivo. Otro teléfono no sabe qué códigos ya se usaron en este.
// Se hacen en el menú dev (lote o uno suelto).
import { save, prefs, persist } from './storage.js';
import { ITEMS, SECTIONS, owns, item } from './shop.js';

const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 letras, sin I, O, 0 ni 1 (se confunden)
const SALT = 'mundos·2026·regalo';
// Lo que puede dar un código (kind). Las cosas del tesoro llevan su sección y su clave (value).
export const KINDS = [
  { k: 'coins', name: 'Monedas', one: 'moneda' },
  { k: 'wild', name: 'Comodines', one: 'comodín' },
  { k: 'undo', name: 'Deshacer', one: 'deshacer' },
  { k: 'tickets', name: 'Boletos', one: 'boleto' },
  { k: 'item', name: 'Tesoro escondido' },
];

// Hash de 53 bits (cyrb53): para la firma y para tapar lo que da el código.
function cyrb(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// Cada cosa del tesoro se nombra con 16 bits: sección (3) + 13 de su clave. No depende del orden del catálogo,
// así agregar o mover cosas no rompe los códigos que ya se dieron. Solo cuentan las de código: un código de algo de la
// tienda (de antes, cuando se podía) ya no sirve.
const itemId = (s, k) => (s << 13) | (cyrb(`${SECTIONS[s].k}:${k}`) & 0x1fff);
const BY_ID = new Map();
SECTIONS.forEach(({ k: sec }, s) => ITEMS[sec].filter((it) => it.code).forEach((it) => {
  const id = itemId(s, it.k);
  if (BY_ID.has(id)) console.error(`Códigos: ${sec}:${it.k} choca con ${BY_ID.get(id).sec}:${BY_ID.get(id).k}`);
  BY_ID.set(id, { sec, k: it.k });
}));

// 60 bits = 12 letras: número al azar (20) · firma (21) · lo que da (19 = kind 3 + value 16), tapado con el número
// al azar para que dos códigos del mismo premio no se parezcan.
const sign = (nonce, pay) => cyrb(`${SALT}|${nonce}|${pay}`) % 2097152;
const mask = (nonce) => cyrb(`${SALT}#${nonce}`, 7) % 524288;
function pack(kind, value, nonce) {
  const pay = kind * 65536 + value;
  const n = BigInt(nonce) * 2n ** 40n + BigInt(sign(nonce, pay)) * 2n ** 19n + BigInt(pay ^ mask(nonce));
  let s = '';
  for (let i = 11; i >= 0; i--) s += ABC[Number((n >> BigInt(i * 5)) & 31n)];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}
// Lo que trae un texto escrito a mano (sin guiones, minúsculas, espacios): { key, reward } o null.
export function readGift(text) {
  const s = String(text).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length !== 12) return null;
  let n = 0n;
  for (const c of s) {
    const v = ABC.indexOf(c);
    if (v < 0) return null;
    n = n * 32n + BigInt(v);
  }
  const nonce = Number(n >> 40n), sig = Number((n >> 19n) & 0x1fffffn), pay = Number(n & 0x7ffffn) ^ mask(nonce);
  if (sign(nonce, pay) !== sig) return null;
  const kind = KINDS[pay >> 16], value = pay & 0xffff;
  if (!kind) return null;
  if (kind.k !== 'item') return value ? { key: s, reward: { [kind.k]: kind.k === 'coins' ? value * 10 : value } } : null;
  const it = BY_ID.get(value);
  return it ? { key: s, reward: { item: it } } : null;
}

// ---------- Canjear ----------
// Los usados: en el guardado (se juega en la caja de pruebas del modo dev) y, fuera del modo dev, también en el
// dispositivo, por si después carga un respaldo de antes de canjearlo.
const used = (key) => !!save.codes?.[key] || (!prefs.dev && !!prefs.codes?.[key]);
// { ok, reward } o { err: 'malo' | 'usado' | 'tienes' }. Si ya tiene la cosa, el código no se gasta.
export function redeem(text) {
  const g = readGift(text);
  if (!g) return { err: 'malo' };
  if (used(g.key)) return { err: 'usado' };
  const { reward: r } = g;
  if (r.item && owns(r.item.sec, r.item.k)) return { err: 'tienes', reward: r };
  if (r.item) save.owned[`${r.item.sec}:${r.item.k}`] = 1;
  else for (const k of ['coins', 'wild', 'undo', 'tickets']) save[k] += r[k] || 0;
  (save.codes ||= {})[g.key] = Date.now();
  if (!prefs.dev) (prefs.codes ||= {})[g.key] = 1;
  persist();
  return { ok: true, reward: r };
}

// ---------- Hacer códigos (menú dev) ----------
// Los lotes de antes traían cosas de la tienda: esos códigos ya no sirven y se quitan de la lista.
if (prefs.codeLot?.some((c) => !readGift(c.code))) {
  prefs.codeLot = prefs.codeLot.filter((c) => readGift(c.code));
  persist();
}
const rand20 = () => crypto.getRandomValues(new Uint32Array(1))[0] % 1048576;
// Un código de lo que diga r: { coins: 250 } · { wild: 2 } · { item: { sec, k } }.
export function makeCode(r, avoid = new Set()) {
  let nonce;
  do nonce = rand20(); while (avoid.has(nonce));
  avoid.add(nonce);
  if (r.item) return pack(4, itemId(SECTIONS.findIndex((s) => s.k === r.item.sec), r.item.k), nonce);
  const kind = KINDS.findIndex((x) => r[x.k]);
  const v = r[KINDS[kind].k];
  return pack(kind, kind === 0 ? Math.round(v / 10) : v, nonce);
}
// Las cosas del tesoro, para el lote y el código suelto.
export const TREASURE = SECTIONS.flatMap(({ k: sec }) => ITEMS[sec].filter((it) => it.code).map((it) => ({ sec, k: it.k })));
// Cómo se dice lo que da un código.
export function rewardName(r) {
  if (r.item) return `${item(r.item.sec, r.item.k).name} · ${SECTIONS.find((s) => s.k === r.item.sec).name.toLowerCase()}`;
  const kind = KINDS.find((x) => r[x.k]), n = r[kind.k];
  return n === 1 ? `1 ${kind.one}` : `${n.toLocaleString('es-MX')} ${kind.name.toLowerCase()}`;
}
// Lote para repartir: 1 de cada cosa del Tesoro escondido, 20 de monedas (de 100 a 500), comodines, deshacer y
// boletos. Todos distintos.
export function makeLot() {
  const avoid = new Set(), out = [];
  const add = (group, r) => out.push({ group, name: rewardName(r), code: makeCode(r, avoid), r });
  // Primero lo que solo sale con código (Tesoro escondido): uno de cada uno.
  TREASURE.forEach((it) => add('Tesoro escondido', { item: it }));
  for (let i = 0; i < 20; i++) add('Monedas', { coins: Math.round((100 + (400 * i) / 19) / 10) * 10 });
  [1, 1, 1, 1, 2, 2, 2, 3, 3, 5].forEach((n) => add('Comodines', { wild: n }));
  [3, 3, 3, 5, 5, 5, 10, 10].forEach((n) => add('Deshacer', { undo: n }));
  [2, 2, 3, 3, 5, 5].forEach((n) => add('Boletos', { tickets: n }));
  prefs.codeLot = out.map(({ group, name, code }) => ({ group, name, code }));
  persist();
  return prefs.codeLot;
}
// El lote como texto para compartir (notas, WhatsApp): por grupos, cada código con lo que da.
export const lotText = (lot = prefs.codeLot || []) => {
  let last = '', s = 'Solitaire · códigos de regalo (cada uno sirve una vez)\n';
  for (const c of lot) {
    if (c.group !== last) s += `\n${(last = c.group).toUpperCase()}\n`;
    s += `${c.code}  ${c.name}\n`;
  }
  return s;
};
// ¿Ya se canjeó este código en este dispositivo?
export const usedHere = (code) => {
  const g = readGift(code);
  return !!g && used(g.key);
};
// El número al azar de cada código del lote (para no repetirlo en uno suelto).
export const lotNonces = () => {
  const s = new Set();
  for (const c of prefs.codeLot || []) {
    const t = c.code.replace(/-/g, '');
    let n = 0n;
    for (const ch of t) n = n * 32n + BigInt(ABC.indexOf(ch));
    s.add(Number(n >> 40n));
  }
  return s;
};
