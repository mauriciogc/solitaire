// Guardado del jugador: uno solo por dispositivo.
// `save` es el mismo objeto toda la vida de la página (al reiniciar o cargar un código se vacía y se rellena),
// así los módulos que lo importan no se quedan con uno viejo.
const KEY = 'solitario-mundos-v3';
const OLD = ['solitario-mundos-v2', 'solitario-mundos-v1']; // v2: { active, profiles, prefs } · v1: una partida con prefs adentro

// tickets: el que usa el nivel 1 y uno de regalo (7 nov 2026; antes 5).
export const START = { coins: 300, wild: 3, undo: 5, tickets: 2 };

const fresh = (name, avatar = 0) => ({
  name,
  avatar,
  ...START,
  stars: {}, // índice global de nivel -> mejores estrellas (1..3)
  next: 0, // primer nivel sin completar
  open: 0, // último mundo abierto (para pasar de mundo hace falta boleto dorado y estrellas)
  gold: 0, // boletos dorados (los da cada jefe la primera vez)
  cgold: 0, // boletos de constelación (8 nov 2026): los da el jefe del último mundo de cada constelación y abren la siguiente
  tries: {}, // intentos por nivel (cambia las cartas de cada intento)
  run: null, // partida en curso de un nivel nuevo (se retoma al volver)
  tutorial: false,
  named: false, // la primera vez se le pide el nombre
  onboard: 'intro', // primera vez: 'intro' (presentación) → 'perfil' (nombre y avatar) → 'done'. Obligatorio y se retoma al volver.
  intro: {}, // eventos ya presentados al desbloquearse (racha, col, mes)
  daily: { day: 0, last: '' }, // camino del regalo diario: día siguiente a reclamar y fecha del último
  seen: {}, // mecánicas que ya se le explicaron
  secret: {}, // mundo -> mejores estrellas en su nivel secreto
  secretSeen: {}, // mundos cuyo nivel secreto ya se mostró (la revelación se anima una sola vez)
  pops: {}, // globos y burbujas truenados: tipo -> { n: cuenta desde el último premio, lvl: premios dados } (ver countPop en ui.js)
  evAlbum: {}, // eventos del mes ganados completos (id = año·12 + mes -> 1): su postal en el álbum, con el año
  fiAlbum: {}, // festividades ganadas completas ('clave-año' -> 1): su postal en el álbum (pestaña Especiales)
  look: 'letter', // avatar: 'letter' = su inicial · 'char' = un personaje (char)
  char: 'nino', // Nico y Lila son gratis
  owned: {}, // tienda: 'seccion:clave' -> 1 (ver shop.js)
  equip: {}, // tienda: seccion -> clave que usa
  soonSeen: {}, // eventos anunciados cuya ventana ya abrió (dejan de salir como nuevos en la botonera)
  helps: {}, // mazo de ayudas: clave -> cuántas (reloj, ver2…ver5, llave; ver HELPS en economy.js). El comodín sigue en wild.
  codes: {}, // códigos de regalo ya canjeados (ver codes.js): no se borran al reiniciar el perfil
});

const read = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null');
  } catch {
    return null; // guardado roto: empezamos de cero
  }
};
// { player, prefs }. Si no hay guardado nuevo, trae el de antes (y luego se borra).
function load() {
  const raw = read(KEY);
  if (raw?.player) return raw;
  const v2 = read(OLD[0]);
  if (v2?.profiles) return { player: v2.profiles[v2.active] || {}, prefs: v2.prefs || {} };
  const { dev, devInfinite, sound, ...rest } = read(OLD[1]) || {};
  return { player: { ...fresh('Jugador 1'), ...rest }, prefs: { dev: !!dev, devInfinite: !!devInfinite } };
}

const root = load();
root.prefs ||= {};
const p0 = root.player;
// Guardados de antes del boleto dorado: el mundo en el que ya estaba queda abierto.
if (p0.open == null) p0.open = Math.floor((p0.next || 0) / 10);
// Quien ya tenía nombre (guardados de antes de la presentación) no la vuelve a ver.
const fixOnboard = (p) => {
  if (p.onboard == null) p.onboard = p.named ? 'done' : 'intro';
  return p;
};
fixOnboard(p0);
// Astro era gratis antes de Nico y Lila: quien ya lo usaba se lo queda.
if (p0.look === 'char' && p0.char === 'astro') (p0.owned ||= {})['avatar:astro'] = 1;

// Preferencias del dispositivo (no del jugador): modo dev.
export const prefs = root.prefs;
export const save = {};
Object.assign(save, fresh(''), p0);
// Boleto de constelación (8 nov 2026): quien ya venció al jefe del último mundo de una constelación y no ha abierto la
// siguiente tiene un boleto dorado de ese jefe; se vuelve de constelación (es el que ahora pide la puerta).
function fixConst(p) {
  if (p.cgFix) return;
  p.cgFix = 1;
  if (p.open % 10 === 9 && (p.next || 0) > p.open * 10 + 9 && p.gold > 0) (p.gold--, (p.cgold = (p.cgold || 0) + 1));
}
fixConst(save);

export function persist() {
  root.player = { ...save };
  try {
    localStorage.setItem(KEY, JSON.stringify(root));
    OLD.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* modo privado o sin espacio: el juego sigue sin guardar */
  }
}
persist();

// Cambia todo el avance por el de p.
function replaceWith(p) {
  for (const k of Object.keys(save)) delete save[k];
  Object.assign(save, fresh(''), p);
  fixConst(save);
  persist();
}

// Borra todo el avance del jugador (también lo comprado), conserva nombre y avatar. Lo que ya se le enseñó no se
// repite (ya lo hizo): tutorial del tablero, recorridos del mapa y de los botones, mecánicas y presentaciones de eventos.
export function resetProfile() {
  const { name, avatar, named, look, onboard, tutorial, mapTour, sideTour, seen, intro, codes } = save;
  const learned = { tutorial, seen, intro, codes, ...(mapTour ? { mapTour } : {}), ...(sideTour ? { sideTour } : {}) };
  // Un personaje gratis (Nico o Lila) se conserva; uno comprado se pierde y vuelve a la inicial.
  const free = look === 'char' && ['nino', 'nina'].includes(save.char);
  replaceWith({ ...fresh(name, avatar), named, onboard, ...learned, ...(free ? { look, char: save.char } : {}) });
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
// Devuelve el avance que trae el código, o null si el código no sirve.
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
  replaceWith({ ...fresh(p.name || 'Jugador 1'), ...fixOnboard({ ...p }) });
}

// Modo dev = caja de pruebas: al prenderlo se copia tu partida; todo lo que hagas en dev (monedas, niveles,
// compras, eventos) se juega sobre esa copia, y al apagarlo tu partida vuelve tal como estaba.
const BACKUP = 'solitario-mundos-respaldo-dev';
export const hasBackup = () => !!localStorage.getItem(BACKUP);
// Lo que se guardó de tu partida real (para enseñarlo en el menú dev): nivel, mundo abierto y monedas.
export function backupInfo() {
  try {
    const b = JSON.parse(localStorage.getItem(BACKUP) || 'null');
    const p = b?.v ? b.p : b;
    return p ? { next: p.next || 0, open: p.open || 0, coins: p.coins || 0 } : null;
  } catch {
    return null;
  }
}
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
  replaceWith(b.v ? b.p : b);
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
