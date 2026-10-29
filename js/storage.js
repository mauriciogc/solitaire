const KEY = 'solitario-mundos-v1';

const DEFAULTS = {
  coins: 300,
  wild: 3,
  undo: 5,
  stars: {}, // índice global de nivel -> estrellas (1..3)
  next: 0, // primer nivel sin completar
  tutorial: false,
  gift: '',
};

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export const save = load();

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* modo privado o sin espacio: el juego sigue sin guardar */
  }
}
