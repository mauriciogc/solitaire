import { save } from './storage.js';
import { star, icon, coin } from './art.js';

// Monedero: hasta 9,999 completo; después abreviado para que quepa (12.5K, 250K, 1.2M).
export function money(n) {
  if (n < 1e4) return n.toLocaleString('es-MX');
  const [d, u] = n < 1e6 ? [1e3, 'K'] : [1e6, 'M'];
  const v = n / d;
  return `${v < 100 ? Math.floor(v * 10) / 10 : Math.floor(v)}${u}`;
}
export function updateCoins() {
  document.querySelectorAll('[data-coins]').forEach((e) => (e.textContent = money(save.coins)));
  document.querySelectorAll('[data-tickets]').forEach((e) => (e.textContent = save.tickets));
}

// Para texto que escribe el jugador (nombres) dentro de HTML.
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Solo se respeta "reducir movimiento" del sistema: el juego no tiene un ajuste propio (decisión del usuario: lo bonito es lo animado).
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const buzz = (ms = 30) => navigator.vibrate?.(ms);
export const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));

// Colores de cabecera por tipo de ventana.
const HEADS = {
  violet: ['#8a5cf0', '#6c3fd4'], blue: ['#4aa8de', '#2f86c0'], green: ['#47c27a', '#2f9e5c'], orange: ['#ff9c5b', '#e2753a'],
  gold: ['#ffc83d', '#e89a17'], pink: ['#ff5f7e', '#d63d5f'], red: ['#e8434f', '#c22c3c'], gray: ['#9188c0', '#6e66a3'],
};

// Ventana con cabecera de color, botón de cerrar y botones abajo.
// Cada botón cierra la ventana antes de ejecutar su acción. closable: false = sin "×" (decisión obligada).
// buttons: { label, cls ('', 'ghost', 'danger', 'pink', 'green', 'sq'), onClick, disabled, title, keep }
export function openModal({ title, body = '', buttons = [], onClose, color = 'violet', ico, closable = true, wide = false, cls = '' }) {
  const [hc, hd] = HEADS[color] || HEADS.violet;
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<section class="modal ${wide ? 'wide' : ''} ${cls}" role="dialog" aria-modal="true" aria-label="${title ? title.replace(/<[^>]+>/g, '') : 'Ventana'}">
    <header class="mhead" style="--hc:${hc};--hd:${hd}">${ico ? icon(ico) : ''}<h2 class="outl">${title || ''}</h2>${closable ? `<button class="x" aria-label="Cerrar">${icon('close')}</button>` : ''}</header>
    <div class="mbody">${body}</div><div class="mbtns"></div></section>`;
  const box = back.querySelector('.mbtns');
  let closed = false;
  const modal = back.querySelector('.modal');
  // Salir con vida: un pequeño impulso hacia arriba y se encoge cayendo. Las acciones corren ya; solo la animación espera.
  const close = () => {
    if (closed) return;
    closed = true;
    back.style.pointerEvents = 'none';
    onClose?.();
    if (reduced()) return back.remove();
    back.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, delay: 60, easing: 'ease-in', fill: 'forwards' });
    modal
      .animate(
        [{ scale: 1, translate: '0 0', rotate: '0deg', opacity: 1 }, { scale: 1.04, translate: '0 -6px', rotate: '-1deg', opacity: 1, offset: 0.3 }, { scale: 0.72, translate: '0 40px', rotate: '2deg', opacity: 0 }],
        { duration: 260, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'forwards' },
      )
      .finished.then(() => back.remove(), () => back.remove());
  };
  back.querySelector('.x')?.addEventListener('click', close);
  if (closable) back.addEventListener('pointerdown', (e) => e.target === back && close());
  buttons.forEach((b) => {
    const btn = document.createElement('button');
    btn.className = `btn ${b.cls || 'gold'}`;
    btn.innerHTML = b.label;
    btn.disabled = !!b.disabled;
    if (b.title) btn.setAttribute('aria-label', b.title), (btn.title = b.title);
    // keep: el botón no cierra la ventana (p. ej. abrir la caja sorpresa dentro de ella).
    btn.onclick = () => {
      if (!b.keep) close();
      b.onClick?.(btn);
    };
    box.append(btn);
  });
  if (!buttons.length) box.remove();
  document.getElementById('modal-root').append(back);
  enter(back, modal);
  return { close, el: back };
}

// Entrar con vida: la ventana cae con rebote, la cabecera llega un instante después
// y el contenido aparece en cascada.
function enter(back, modal) {
  back.classList.add('show');
  if (reduced()) return;
  back.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
  modal.animate(
    [
      { scale: 0.6, translate: '0 60px', rotate: '-3deg', opacity: 0 },
      { scale: 1.05, translate: '0 -6px', rotate: '1deg', opacity: 1, offset: 0.55 },
      { scale: 0.98, translate: '0 2px', rotate: '0deg', offset: 0.8 },
      { scale: 1, translate: '0 0', rotate: '0deg', opacity: 1 },
    ],
    { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  );
  modal.querySelector('.mhead')?.animate(
    [{ translate: '0 -18px', scale: '1.08 0.9' }, { translate: '0 3px', scale: '0.97 1.04', offset: 0.6 }, { translate: '0 0', scale: '1 1' }],
    { duration: 480, delay: 90, easing: 'ease-out', fill: 'backwards' },
  );
  const items = [...modal.querySelectorAll('.mbody > *, .mbtns > *')].slice(0, 12);
  items.forEach((el, i) =>
    el.animate([{ opacity: 0, translate: '0 12px' }, { opacity: 1, translate: '0 0' }], { duration: 300, delay: 160 + i * 45, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }),
  );
}

// ---------- Premios que vuelan al monedero ----------
// Cuenta de a poco hasta el valor real del monedero (el número salta al llegar cada pieza).
const counters = { coins: '[data-coins]', tickets: '[data-tickets]' };
export function bumpPill(kind) {
  const el = document.querySelector(counters[kind])?.closest('.pill');
  el?.animate([{ scale: 1 }, { scale: 1.18 }, { scale: 1 }], { duration: 260, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' });
}
function rollTo(kind, from, to, ms) {
  const els = document.querySelectorAll(counters[kind]);
  if (!els.length) return;
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    const v = Math.round(from + (to - from) * k);
    els.forEach((e) => (e.textContent = money(v)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
// Lanza `n` piezas (monedas o boletos) desde un punto de la pantalla hasta su píldora del monedero.
// `from` = valor que muestra el monedero antes (el guardado ya tiene el nuevo). Devuelve una promesa al terminar.
export function flyToWallet(kind, { x, y }, amount, from) {
  const target = document.querySelector(counters[kind])?.closest('.pill');
  const to = kind === 'coins' ? save.coins : save.tickets;
  if (!target || reduced() || !amount) {
    updateCoins();
    return Promise.resolve();
  }
  const r = target.querySelector('.ico').getBoundingClientRect();
  const n = Math.min(kind === 'coins' ? 10 : 6, Math.max(1, kind === 'coins' ? Math.ceil(amount / 10) : amount));
  const html = kind === 'coins' ? coin() : icon('ticket');
  const runs = [];
  for (let i = 0; i < n; i++) {
    const f = document.createElement('div');
    f.className = 'fly-prize';
    f.innerHTML = html;
    f.style.cssText = `left:${x}px;top:${y}px`;
    document.body.append(f);
    const sx = (Math.random() - 0.5) * 110, sy = -30 - Math.random() * 60;
    const dx = r.left + r.width / 2 - x, dy = r.top + r.height / 2 - y;
    const a = f.animate(
      [
        { translate: '0 0', scale: 0.3, opacity: 0 },
        { translate: `${sx}px ${sy}px`, scale: 1.25, opacity: 1, offset: 0.3, easing: 'cubic-bezier(0.5, 0, 0.6, 1)' },
        { translate: `${dx}px ${dy}px`, scale: 0.7, opacity: 1 },
      ],
      { duration: 820, delay: i * 70, easing: 'linear', fill: 'backwards' },
    );
    runs.push(
      a.finished.then(() => {
        f.remove();
        bumpPill(kind);
      }),
    );
  }
  setTimeout(() => rollTo(kind, from ?? to - amount, to, n * 70 + 120), 820);
  return Promise.all(runs).then(() => wait(160)).then(updateCoins);
}

// Gasto: las piezas salen del monedero (que cuenta hacia abajo) y vuelan hasta lo que se compró.
// El guardado ya tiene el valor nuevo. Devuelve una promesa al terminar.
export function spendFromWallet(kind, { x, y }, amount) {
  const pill = document.querySelector(counters[kind])?.closest('.pill');
  const now = kind === 'coins' ? save.coins : save.tickets;
  if (!pill || reduced() || !amount) {
    updateCoins();
    return Promise.resolve();
  }
  const r = pill.querySelector('.ico').getBoundingClientRect();
  const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
  const n = Math.min(8, Math.max(3, Math.ceil(amount / 25)));
  const html = kind === 'coins' ? coin() : icon('ticket');
  rollTo(kind, now + amount, now, n * 60 + 200);
  bumpPill(kind);
  const runs = [];
  for (let i = 0; i < n; i++) {
    const f = document.createElement('div');
    f.className = 'fly-prize';
    f.innerHTML = html;
    f.style.cssText = `left:${x0}px;top:${y0}px`;
    document.body.append(f);
    const dx = x - x0, dy = y - y0, bx = dx * 0.5 + (Math.random() - 0.5) * 80, by = Math.min(dy, 0) * 0.5 - 40 - Math.random() * 40;
    runs.push(
      f
        .animate(
          [
            { translate: '0 0', scale: 0.6, opacity: 0 },
            { translate: '0 6px', scale: 1.1, opacity: 1, offset: 0.12 },
            { translate: `${bx}px ${by}px`, scale: 1, opacity: 1, offset: 0.55 },
            { translate: `${dx}px ${dy}px`, scale: 0.4, opacity: 0.2 },
          ],
          { duration: 640, delay: i * 60, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'backwards' },
        )
        .finished.then(() => f.remove()),
    );
  }
  return Promise.all(runs).then(() => {
    updateCoins();
    sparkle({ x, y }, 8);
  });
}

// Chispas que salen de un punto (al revelar algo).
export function sparkle({ x, y }, n = 14) {
  if (reduced()) return;
  const colors = ['#ffc83d', '#fff6e6', '#b36bff', '#5fc7e8', '#ff5f7e'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    s.className = 'spark';
    s.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]}`;
    document.body.append(s);
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, d = 50 + Math.random() * 60;
    s.animate([{ translate: '0 0', scale: 1, opacity: 1 }, { translate: `${Math.cos(a) * d}px ${Math.sin(a) * d}px`, scale: 0.2, opacity: 0 }], { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' }).finished.then(() => s.remove());
  }
}

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 2000);
}

export function confetti(n = 70) {
  if (reduced()) return;
  const box = document.createElement('div');
  box.className = 'confetti';
  const colors = ['#ff5f7e', '#ffc83d', '#5ad68c', '#4aa8de', '#8a5cf0', '#fff6e6'];
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

// ---------- Túnel de estrellas (viaje entre constelaciones y planetas) ----------
// Las estrellas se estiran desde el centro (out: hacia el centro, al salir), la pantalla se llena del túnel,
// a la mitad se cambia de vista (swap) y el túnel se abre dejando ver la nueva. Es un lienzo 2D: no pesa.
let warping = false;
export function warp(swap, { out = false } = {}) {
  if (warping) return Promise.resolve();
  if (reduced()) {
    swap();
    return Promise.resolve();
  }
  warping = true;
  const c = document.createElement('canvas');
  c.className = 'warp';
  const W = (c.width = innerWidth * Math.min(2, devicePixelRatio)), H = (c.height = innerHeight * Math.min(2, devicePixelRatio));
  document.body.append(c);
  const g = c.getContext('2d'), cx = W / 2, cy = H / 2, R = Math.hypot(cx, cy);
  const cols = ['#ffffff', '#ffe7a3', '#b9a4ff', '#7fd8ff', '#ff9ad0'];
  const stars = Array.from({ length: 220 }, (_, i) => ({ a: Math.random() * Math.PI * 2, d: Math.random(), w: 1 + Math.random() * 2.5, c: cols[i % cols.length] }));
  const DUR = 1050, MID = 480, t0 = performance.now();
  let swapped = false;
  return new Promise((done) => {
    const step = (now) => {
      const t = now - t0, k = Math.min(1, t / DUR);
      // Velocidad: sube hasta la mitad y luego baja. Fondo: se cierra hasta la mitad y se abre después.
      const speed = Math.sin(Math.min(1, t / DUR) * Math.PI);
      const cover = t < MID ? Math.min(1, t / MID) : Math.max(0, 1 - (t - MID) / (DUR - MID));
      g.clearRect(0, 0, W, H);
      const bg = g.createRadialGradient(cx, cy, 0, cx, cy, R);
      bg.addColorStop(0, `rgba(255,240,210,${0.55 * cover})`);
      bg.addColorStop(0.25, `rgba(60,30,130,${0.9 * cover})`);
      bg.addColorStop(1, `rgba(11,6,42,${cover})`);
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);
      g.lineCap = 'round';
      for (const s of stars) {
        s.d += (0.004 + speed * 0.05) * (out ? -1 : 1) * (0.4 + s.d);
        if (s.d > 1.1) s.d = 0.02;
        if (s.d < 0.02) s.d = 1.1;
        const r = s.d * s.d * R, len = speed * 0.35 * R * s.d;
        const x0 = cx + Math.cos(s.a) * r, y0 = cy + Math.sin(s.a) * r;
        const x1 = cx + Math.cos(s.a) * (r + len), y1 = cy + Math.sin(s.a) * (r + len);
        g.strokeStyle = s.c;
        g.globalAlpha = Math.min(1, s.d * 2) * (0.3 + 0.7 * Math.max(cover, speed));
        g.lineWidth = s.w * (1 + s.d * 2);
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x1 + 0.1, y1);
        g.stroke();
      }
      g.globalAlpha = 1;
      if (!swapped && t >= MID) {
        swapped = true;
        swap();
      }
      if (k < 1) requestAnimationFrame(step);
      else {
        c.remove();
        warping = false;
        done();
      }
    };
    requestAnimationFrame(step);
  });
}

// ---------- Globos del jefe ----------
// Suben por encima de la ventana meciéndose como burbujas; al tocarlos se truenan (pedacitos, "¡Pop!" y vibración).
// Siguen saliendo mientras la ventana esté abierta (máximo unos cuantos a la vez).
export const BALLOONS = [['#ff5f7e', '#d63d5f'], ['#ffc83d', '#e89a17'], ['#4aa8de', '#2f86c0'], ['#47c27a', '#2f9e5c'], ['#8a5cf0', '#6c3fd4'], ['#ff9c5b', '#e2753a']];
export const balloonSVG = (c, d) => `<svg class="bl-svg" viewBox="0 0 60 100" aria-hidden="true">
  <path d="M30 69c-5 6 5 10 0 16s4 8 0 13" fill="none" stroke="#2a1f5c" stroke-width="2" stroke-linecap="round"/>
  <path d="M26 63h8l-1.5 6h-5z" fill="${d}" stroke="#2a1f5c" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M30 4C14 4 6 17 6 30c0 17 13 29 24 34 11-5 24-17 24-34C54 17 46 4 30 4z" fill="${c}"/>
  <path d="M41 9c8 5 11 13 11 21 0 14-10 25-20 31 8-8 13-18 13-30 0-9-2-16-4-22z" fill="${d}"/>
  <path d="M30 4C14 4 6 17 6 30c0 17 13 29 24 34 11-5 24-17 24-34C54 17 46 4 30 4z" fill="none" stroke="#2a1f5c" stroke-width="3"/>
  <ellipse cx="19" cy="20" rx="4.5" ry="8" fill="#fff" opacity=".75" transform="rotate(25 19 20)"/>
</svg>`;
// Tronar un globo: se infla y desaparece, salen pedacitos de hule y un "¡Pop!" (todo encima de las ventanas).
export function popBalloon(b, [c, d], { remove = true } = {}) {
  if (b.popped) return false;
  b.popped = true;
  buzz(18);
  const svg = b.querySelector('.bl-svg') || b, r = svg.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.width / 2;
  svg.animate([{ scale: 1, opacity: 1 }, { scale: 1.3, opacity: 0 }], { duration: 130, easing: 'ease-out', fill: 'forwards' }).finished.then(() => remove && b.remove());
  if (reduced()) return true;
  for (let i = 0; i < 9; i++) {
    const s = document.createElement('i');
    s.className = 'shred';
    s.style.cssText = `left:${x}px;top:${y}px;background:${i % 3 ? c : d}`;
    document.body.append(s);
    const a = (i / 9) * Math.PI * 2 + Math.random() * 0.5, dist = 34 + Math.random() * 40;
    s.animate([{ translate: '0 0', rotate: '0deg', scale: 1, opacity: 1 }, { translate: `${Math.cos(a) * dist}px ${Math.sin(a) * dist + 30}px`, rotate: `${(Math.random() - 0.5) * 540}deg`, scale: 0.5, opacity: 0 }], { duration: 560 + Math.random() * 200, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)' }).finished.then(() => s.remove());
  }
  const t = document.createElement('b');
  t.className = 'pop-txt outl';
  t.textContent = '¡Pop!';
  t.style.cssText = `left:${x}px;top:${y}px;color:${c}`;
  document.body.append(t);
  t.animate([{ scale: 0.3, opacity: 0, translate: '-50% -50%' }, { scale: 1.15, opacity: 1, translate: '-50% -50%', offset: 0.35 }, { scale: 1, opacity: 0, translate: '-50% -110%' }], { duration: 620, easing: 'ease-out' }).finished.then(() => t.remove());
  return true;
}
export function balloons(m, { max = 7 } = {}) {
  if (reduced()) return;
  const layer = document.createElement('div');
  layer.className = 'balloons';
  m.el.append(layer);
  let k = 0;
  const spawn = () => {
    if (!layer.isConnected) return;
    if (layer.querySelectorAll('.balloon').length < max) {
      const col = BALLOONS[k++ % BALLOONS.length], s = 52 + Math.random() * 26;
      const b = document.createElement('button');
      b.className = 'balloon';
      b.setAttribute('aria-label', 'Tronar globo');
      b.style.cssText = `left:${2 + Math.random() * 84}%;--s:${s}px`;
      b.innerHTML = balloonSVG(...col);
      layer.append(b);
      // Sube lento con un poco de deriva; el dibujo se mece de lado a lado (como burbuja).
      const drift = (Math.random() - 0.5) * 140;
      b.animate([{ translate: '0 0' }, { translate: `${drift}px calc(-100dvh - ${s * 2}px)` }], { duration: 7500 + Math.random() * 4500, easing: 'cubic-bezier(0.3, 0, 0.7, 1)' }).finished.then(() => b.remove(), () => {});
      b.firstElementChild.animate([{ rotate: '-7deg', translate: '-7px 0' }, { rotate: '7deg', translate: '7px 0' }], { duration: 1300 + Math.random() * 900, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
      b.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        b.getAnimations({ subtree: true }).forEach((a) => a.pause());
        popBalloon(b, col);
      });
    }
    setTimeout(spawn, 500 + Math.random() * 800);
  };
  setTimeout(spawn, 500);
}
