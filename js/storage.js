// Guardado del jugador. Hay un solo jugador por dispositivo; la estructura con `profiles`
// se conserva para no romper partidas guardadas.
// `save` es siempre el perfil activo: es el mismo objeto toda la vida de la página
// (al cambiar de perfil se vacía y se rellena), así los módulos que lo importan no se quedan con uno viejo.
const KEY = 'solitario-mundos-v2';
const OLD_KEY = 'solitario-mundos-v1';

export const START = { coins: 300, wild: 3, undo: 5, tickets: 10 };

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

// Borra todo el avance del jugador, conserva nombre y avatar.
export function resetProfile() {
  const { name, avatar, named } = save;
  root.profiles[root.active] = { ...fresh(name, avatar), named };
  swapTo(root.active);
}

export function renameProfile(name, avatar) {
  save.name = name;
  save.named = true;
  if (avatar != null) save.avatar = avatar;
  persist();
}

// Copia del jugador antes de que el modo dev toque su avance; "Volver a mi partida" la regresa.
const BACKUP = 'solitario-mundos-respaldo-dev';
export const hasBackup = () => !!localStorage.getItem(BACKUP);
export function backupOnce() {
  if (hasBackup()) return;
  try {
    localStorage.setItem(BACKUP, JSON.stringify(save));
  } catch {
    /* sin espacio */
  }
}
export function restoreBackup() {
  const raw = localStorage.getItem(BACKUP);
  if (!raw) return false;
  root.profiles[root.active] = JSON.parse(raw);
  swapTo(root.active);
  localStorage.removeItem(BACKUP);
  return true;
}
