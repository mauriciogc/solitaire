import { save } from './storage.js';

let ctx;

function tone(freq, dur = 0.1, type = 'triangle', vol = 0.12, when = 0) {
  if (!save.sound) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur);
  } catch {
    /* sin audio */
  }
}

export const sfx = {
  play: (streak) => tone(392 * 2 ** (Math.min(streak, 24) / 12), 0.14),
  draw: () => tone(260, 0.07, 'sine', 0.1),
  bad: () => {
    tone(150, 0.12, 'square', 0.04);
    navigator.vibrate?.(30);
  },
  unlock: () => [0, 5, 9].forEach((s, i) => tone(523 * 2 ** (s / 12), 0.1, 'square', 0.05, i * 0.06)),
  wild: () => [0, 7, 12].forEach((s, i) => tone(660 * 2 ** (s / 12), 0.12, 'sine', 0.1, i * 0.05)),
  win: () => [0, 4, 7, 12, 16].forEach((s, i) => tone(523 * 2 ** (s / 12), 0.3, 'triangle', 0.13, i * 0.09)),
  lose: () => [0, -3, -7].forEach((s, i) => tone(330 * 2 ** (s / 12), 0.25, 'sine', 0.1, i * 0.12)),
};
