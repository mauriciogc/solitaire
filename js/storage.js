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
  tries: {}, // intentos por nivel (cambia las cartas de cada intento)
  run: null, // partida en curso de un nivel nuevo (se retoma al volver)
  tutorial: false,
  named: false, // la primera vez se le pide el nombre
  gift: '',
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
