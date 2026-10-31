// Eventos (Fase 6). Por ahora: la racha diaria.
// Racha: cuenta victorias seguidas de niveles nuevos (cualquier estrella). Perder o abandonar uno nuevo la regresa a 0.
// A medianoche (hora del teléfono) empieza otra, con otra temática. Los premios se reclaman a mano;
// los que se ganaron y no se reclamaron se guardan aunque la racha se reinicie.
import { save, persist } from './storage.js';

export const RACHA_GOALS = [
  { n: 3, coins: 40 },
  { n: 5, coins: 80 },
  { n: 10, coins: 150, wild: 1 },
  { n: 15, coins: 250 },
  { n: 20, coins: 400, wild: 2 },
  { n: 30, coins: 700, wild: 3 },
];
// Temáticas que se turnan cada día: nombre, icono y color de la ventana.
export const RACHA_THEMES = [
  { key: 'fuego', name: 'Racha de fuego', ico: 'flame', color: 'orange' },
  { key: 'estelar', name: 'Racha estelar', ico: 'star', color: 'gold' },
  { key: 'cohete', name: 'Racha cohete', ico: 'rocket', color: 'pink' },
  { key: 'real', name: 'Racha real', ico: 'crown', color: 'violet' },
  { key: 'planeta', name: 'Racha planetaria', ico: 'planet', color: 'blue' },
];

// Día local (cambia a medianoche). save.devDay solo lo mueve el modo dev ("otro día").
const today = () => {
  const d = new Date();
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5) + (save.devDay || 0);
};
export function racha() {
  const day = today();
  if (save.racha?.day !== day) {
    save.racha = { day, n: 0, got: [], pend: save.racha?.pend || [] };
    persist();
  }
  return save.racha;
}
export const rachaTheme = () => RACHA_THEMES[racha().day % RACHA_THEMES.length];
export const rachaReady = () => racha().pend.length > 0;
export const nextGoal = () => RACHA_GOALS.find((g) => g.n > racha().n) || null;
// "En llamas": le falta muy poco para el siguiente premio (1 victoria; 2 si el tramo es largo).
export function rachaHot() {
  const r = racha(), i = RACHA_GOALS.findIndex((g) => g.n > r.n);
  if (i < 0) return false;
  const from = i ? RACHA_GOALS[i - 1].n : 0, left = RACHA_GOALS[i].n - r.n;
  return left <= Math.max(1, Math.ceil((RACHA_GOALS[i].n - from) * 0.2));
}
export const msToMidnight = () => {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d - Date.now();
};

// Ganó un nivel nuevo: suma 1 y aparta los premios que alcanzó.
export function rachaWin() {
  const r = racha();
  r.n++;
  RACHA_GOALS.forEach((g, i) => {
    if (r.n >= g.n && !r.got.includes(i)) r.got.push(i), r.pend.push(i);
  });
  persist();
  return r.n;
}
// Perdió o abandonó un nivel nuevo: vuelve a 0 (y se avisa al volver al mapa).
export function rachaLose() {
  const r = racha();
  if (!r.n) return;
  r.lost = r.n;
  r.n = 0;
  r.got = [];
  persist();
}
// Junta los premios pendientes y los quita de la lista.
export function rachaClaim() {
  const r = racha(), p = { coins: 0, wild: 0 };
  for (const i of r.pend) (p.coins += RACHA_GOALS[i].coins), (p.wild += RACHA_GOALS[i].wild || 0);
  r.pend = [];
  persist();
  return p;
}
