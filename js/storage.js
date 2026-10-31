// Guardado del jugador. Hay un solo jugador por dispositivo; la estructura con `profiles`
// se conserva para no romper partidas guardadas.
// `save` es siempre el perfil activo: es el mismo objeto toda la vida de la página
// (al cambiar de perfil se vacía y se rellena), así los módulos que lo importan no se quedan con uno viejo.
const KEY = 'solitario-mundos-v2';
const OLD_KEY = 'solitario-mundos-v1';

export const START = { coins: 300, wild: 3, undo: 5, tickets: 5 };

const fresh = (name, avatar = 0) => ({
  name,
  avatar,
  ...START,
  stars: {}, // índice global de nivel -> mejores estrellas (1..3)
  next: 0, // primer nivel sin completar
  open: 0, // último mundo abierto (para pasar de mundo hace falta boleto dorado y estrellas)
  gold: 0, // boletos dorados (los da cada jefe la primera vez)
  tries: {}, // intentos por nivel (cambia las cartas de cada intento)
  run: null, // partida en curso de un nivel nuevo (se retoma al volver)
  tutorial: false,
  named: false, // la primera vez se le pide el nombre
  daily: { day: 0, last: '' }, // camino del regalo diario: día siguiente a reclamar y fecha del último
  seen: {}, // mecánicas que ya se le explicaron
  secret: {}, // mundo -> mejores estrellas en su nivel secreto
  secretSeen: {}, // mundos cuyo nivel secreto ya se mostró (la revelación se anima una sola vez)
  look: 'letter', // avatar: 'letter' = su inicial · 'char' = un personaje (char)
  char: 'nino', // Nico y Lila son gratis
  owned: {}, // tienda: 'seccion:clave' -> 1 (ver shop.js)
  equip: {}, // tienda: seccion -> clave que usa
});

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw?.profiles) return raw;
  } catch {
    /* guardado roto: empezamos de cero */
  }
  // Migra el guardado de una sola partida (v1) como primer perfil.
  let old = {};
  try {
    old = JSON.parse(localStorage.getItem(OLD_KEY) || '{}');
  } catch {
    /* nada */
  }
  const { dev, devInfinite, sound, ...rest } = old;
  return { active: 'p1', profiles: { p1: { ...fresh('Jugador 1'), ...rest } }, prefs: { dev: !!dev, devInfinite: !!devInfinite } };
}

const root = load();
root.prefs ||= {};
// Guardados de antes del boleto dorado: el mundo en el que ya estaba queda abierto.
for (const p of Object.values(root.profiles)) if (p.open == null) p.open = Math.floor((p.next || 0) / 10);
// Astro era gratis antes de Nico y Lila: quien ya lo usaba se lo queda.
for (const p of Object.values(root.profiles)) if (p.look === 'char' && p.char === 'astro') (p.owned ||= {})['avatar:astro'] = 1;

// Preferencias del dispositivo (no del jugador): modo dev.
export const prefs = root.prefs;
export const save = {};
Object.assign(save, fresh(''), root.profiles[root.active]);

export function persist() {
  root.profiles[root.active] = { ...save };
  try {
    localStorage.setItem(KEY, JSON.stringify(root));
  } catch {
    /* modo privado o sin espacio: el juego sigue sin guardar */
  }
}
persist();

function swapTo(id) {
  root.active = id;
  for (const k of Object.keys(save)) delete save[k];
  Object.assign(save, fresh(''), root.profiles[id]);
  persist();
}

// Borra todo el avance del jugador (también lo comprado), conserva nombre y avatar.
export function resetProfile() {
  const { name, avatar, named, look } = save;
  // Un personaje gratis (Nico o Lila) se conserva; uno comprado se pierde y vuelve a la inicial.
  const free = look === 'char' && ['nino', 'nina'].includes(save.char);
  root.profiles[root.active] = { ...fresh(name, avatar), named, ...(free ? { look, char: save.char } : {}) };
  swapTo(root.active);
}

// look: { look, char } del avatar (opcional).
export function renameProfile(name, avatar, look) {
  save.name = name;
  save.named = true;
  if (avatar != null) save.avatar = avatar;
  if (look) Object.assign(save, look);
  persist();
}

// Respaldo con código: el avance cabe en un texto que el jugador guarda donde quiera (notas, chat) y luego pega.
// Sirve para no perderlo si borra la app o para pasarlo a otro teléfono. Va comprimido: las estrellas de miles de niveles pesan.
const CODE = 'SM1.';
const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
export async function exportCode() {
  const json = new TextEncoder().encode(JSON.stringify(save));
  const bytes = await pipe(json, new CompressionStream('gzip'));
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return CODE + btoa(bin);
}
// Devuelve el perfil que trae el código, o null si el código no sirve.
export async function readCode(text) {
  try {
    const raw = text.replace(/\s+/g, '');
    if (!raw.startsWith(CODE)) return null;
    const bytes = Uint8Array.from(atob(raw.slice(CODE.length)), (c) => c.charCodeAt(0));
    const p = JSON.parse(new TextDecoder().decode(await pipe(bytes, new DecompressionStream('gzip'))));
    return p && typeof p === 'object' && typeof p.next === 'number' && typeof p.stars === 'object' ? p : null;
  } catch {
    return null;
  }
}
// Reemplaza el avance del jugador por el del código (ya leído con readCode).
export function loadProfile(p) {
  root.profiles[root.active] = { ...fresh(p.name || 'Jugador 1'), ...p };
  swapTo(root.active);
}

// Modo dev = caja de pruebas: al prenderlo se copia tu partida; todo lo que hagas en dev (monedas, niveles,
// compras, eventos) se juega sobre esa copia, y al apagarlo tu partida vuelve tal como estaba.
const BACKUP = 'solitario-mundos-respaldo-dev';
export const hasBackup = () => !!localStorage.getItem(BACKUP);
export function backupOnce() {
  if (hasBackup()) return;
  try {
    localStorage.setItem(BACKUP, JSON.stringify({ v: 2, p: save }));
  } catch {
    /* sin espacio */
  }
}
export function restoreBackup() {
  const raw = localStorage.getItem(BACKUP);
  if (!raw) return false;
  const b = JSON.parse(raw);
  root.profiles[root.active] = b.v ? b.p : b;
  swapTo(root.active);
  localStorage.removeItem(BACKUP);
  return true;
}
// Prender o apagar el modo dev con su caja de pruebas.
export function setDev(on) {
  prefs.dev = !!on;
  if (on) backupOnce();
  else restoreBackup();
  persist();
}
// Copias que quedaron de antes: sin dev, la partida de ahora es la real; con dev, la de ahora es el punto de partida.
{
  let b = null;
  try {
    b = JSON.parse(localStorage.getItem(BACKUP) || 'null');
  } catch {
    /* copia dañada */
  }
  if (b && (!prefs.dev || !b.v)) localStorage.removeItem(BACKUP);
  if (prefs.dev) backupOnce();
}
