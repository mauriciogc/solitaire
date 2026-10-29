import { save } from './storage.js';
import { star } from './lowpoly.js';

export function updateCoins() {
  document.querySelectorAll('[data-coins]').forEach((e) => (e.textContent = save.coins));
  document.querySelectorAll('[data-tickets]').forEach((e) => (e.textContent = save.tickets));
}

// Para texto que escribe el jugador (nombres) dentro de HTML.
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Modal simple. Cada botón cierra el modal antes de ejecutar su acción.
export function openModal({ title, body = '', buttons = [], onClose }) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${title ? `<h2>${title}</h2>` : ''}<div class="mbody">${body}</div><div class="mbtns"></div></div>`;
  const box = back.querySelector('.mbtns');
  const close = () => {
    back.remove();
    onClose?.();
  };
  buttons.forEach((b) => {
    const btn = document.createElement('button');
    btn.className = `btn ${b.cls || ''}`;
    btn.innerHTML = b.label;
    btn.disabled = !!b.disabled;
    btn.onclick = () => {
      close();
      b.onClick?.();
    };
    box.append(btn);
  });
  document.getElementById('modal-root').append(back);
  requestAnimationFrame(() => back.classList.add('show'));
  return { close };
}

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 2000);
}

export function confetti(n = 70) {
  const box = document.createElement('div');
  box.className = 'confetti';
  const colors = ['#ff5a5a', '#ffcf3a', '#5cf28b', '#4ab8ff', '#b46bff', '#fff'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    s.style.cssText = `left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.4}s;animation-duration:${1.6 + Math.random() * 1.4}s;--dx:${(Math.random() - 0.5) * 240}px;--r:${Math.random() * 900}deg`;
    box.append(s);
  }
  document.body.append(box);
  setTimeout(() => box.remove(), 3500);
}

export function starsHTML(n, max = 3) {
  return Array.from({ length: max }, (_, i) => star(i < n)).join('');
}
