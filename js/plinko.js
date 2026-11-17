// Plinko antes del jefe (17 nov 2026, pedido del usuario; escogido en dev/plinko.html): en lugar de «Preparando al
// jefe…», la primera vez que entras al nivel de un jefe de constelación sueltas un meteorito que rebota y cae en un
// premio. Genérico (mismo tablero, letrero y colores para todos los jefes, por si llegan más). Un solo meteorito.
// El lanzador va y viene y tocas para soltarlo. El hueco lo sortea el juego (PLINKO_ODDS): apuntar a la orilla no
// regala el comodín (el usuario: «eso es trampa»). Para que el meteorito caiga justo ahí, se prueba la caída antes
// (física fija con semilla, con un empujoncito que no se nota) hasta dar con una que llegue, y luego se enseña esa.
import { icon, coin } from './art.js';
import { reduced, wait, buzz, sparkle } from './ui.js';
import { HELPS } from './economy.js';

const INK = '#2a1f5c';
// Los 7 huecos: lo bueno en las orillas (sale menos), monedas al centro (sale más).
// 17 nov 2026 (el usuario): las monedas, con un cero más.
export const PLINKO_SLOTS = [{ wild: 1 }, { coins: 1500 }, { undo: 2 }, { coins: 500 }, { helps: { reloj: 1 } }, { coins: 1500 }, { helps: { ver3: 1 } }];
export const PLINKO_ODDS = [6, 16, 14, 30, 14, 14, 6];
const pickSlot = () => {
  let u = Math.random() * 100;
  for (let j = 0; j < 7; j++) if ((u -= PLINKO_ODDS[j]) < 0) return j;
  return 3;
};
// Tablero en medidas propias (se escala a la pantalla).
const W = 332, H = 400, R = 10, PR = 5, G = 1800, SLOT_H = 52;
const PEGS = [];
for (let r = 0; r < 9; r++) {
  const n = r % 2 ? 8 : 9, dx = W / 9, x0 = r % 2 ? dx : dx / 2;
  for (let i = 0; i < n; i++) PEGS.push({ x: x0 + i * dx, y: 78 + r * 32 });
}
const rng = (s) => () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)), (s ^= s >>> 16) >>> 0) / 4294967296;
// Una caída completa: posiciones por cuadro (60 por segundo), clavitos que toca y en qué hueco cae.
function fall(x0, seed, tgt) {
  const rnd = rng(seed * 7919 + 13), tx = (tgt + 0.5) * (W / 7), path = [], hits = [];
  let x = x0, y = 22, vx = (rnd() - 0.5) * 40, vy = 0;
  const last = new Map();
  for (let f = 0; f < 600; f++) {
    for (let k = 0; k < 3; k++) {
      const h = 1 / 180;
      vy += G * h;
      // Empujoncito hacia su hueco: crece conforme baja.
      vx += (tx - x) * 40 * Math.max(0, (y - 60) / (H - 60)) * h;
      vx *= 1 - 0.8 * h;
      x += vx * h;
      y += vy * h;
      if (x < R) (x = R), (vx = Math.abs(vx) * 0.6);
      if (x > W - R) (x = W - R), (vx = -Math.abs(vx) * 0.6);
      PEGS.forEach((p, i) => {
        const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy), m = R + PR;
        if (d >= m || !d) return;
        const nx = dx / d, ny = dy / d, vn = vx * nx + vy * ny;
        x = p.x + nx * m;
        y = p.y + ny * m;
        if (vn < 0) {
          vx -= 1.45 * vn * nx;
          vy -= 1.45 * vn * ny;
          vx += (rnd() - 0.5) * 60;
          if (Math.abs(vx) < 25) vx += (rnd() < 0.5 ? -1 : 1) * 35;
          if (vy < -110) vy = -110;
        }
        if (!(f - last.get(i) < 12)) last.set(i, f), hits.push([f, i]);
      });
      // Paredes de los huecos.
      if (y > H - SLOT_H - 8) for (let j = 1; j < 7; j++) {
        const wx = (j * W) / 7;
        if (Math.abs(x - wx) < R + 1.5) (x = wx + Math.sign(x - wx || 1) * (R + 1.5)), (vx = -vx * 0.4);
      }
    }
    vx = Math.max(-260, Math.min(260, vx));
    path.push([x, y]);
    if (y > H - 22) return { slot: Math.max(0, Math.min(6, Math.floor(x / (W / 7)))), path, hits };
  }
  return { slot: -1, path, hits };
}
// La caída que llega al hueco sorteado (a lo más unas 15 pruebas; si no, la más cercana).
function aimFall(x0, tgt) {
  let best = null;
  for (let n = 0; n < 60; n++) {
    const r = fall(x0, Math.floor(Math.random() * 1e9), tgt);
    if (r.slot === tgt) return r;
    if (r.slot >= 0 && (!best || Math.abs(r.slot - tgt) < Math.abs(best.slot - tgt))) best = r;
  }
  return best;
}
const LAUNCH = `<svg viewBox="0 0 44 30"><path d="M4 4h36l-8 22H12z" fill="#ffc83d" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M10 9h24" stroke="#fff1a0" stroke-width="3" stroke-linecap="round"/></svg>`;
const slotIcon = (p) => (p.coins ? coin() : p.wild ? icon('wild') : p.undo ? icon('undo') : icon(HELPS[Object.keys(p.helps)[0]].ico));
const slotText = (p) => (p.coins ? p.coins.toLocaleString('es-MX') : `×${p.wild || p.undo || Object.values(p.helps)[0]}`);

// screen: la pantalla donde va (encima del mapa, como la nave de rescate). pay(p): se cobra al soltar (si cierras la
// app a media caída, ya es tuyo). show(p, at): al caer, sus burbujas y monedas. Termina cuando se va el tablero.
export function plinko(screen, { pay, show }) {
  const fast = reduced(), tgt = pickSlot(), prize = PLINKO_SLOTS[tgt];
  const back = document.createElement('div');
  back.className = 'pl-back keep-turn';
  // Como la tragamonedas (17 nov 2026, el usuario): cielo, rayos que giran, la corona que se mece y el título que se
  // bambolea con un texto corto.
  back.innerHTML = `<div class="sx-sky"></div><div class="sx-rays"></div><div class="pl-head"><span class="pl-ico">${icon('crown')}</span><div class="sx-title"><b>¡Se acerca un jefe!</b><small>Gana algo para la pelea</small></div></div>
    <div class="pl-wrap"><div class="pl-board">
      <svg class="pl-pegs" viewBox="0 0 ${W} ${H}">${PEGS.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="${PR}"/>`).join('')}</svg>
      <div class="pl-slots">${PLINKO_SLOTS.map((p) => `<div class="pl-slot k-${p.coins ? 'coin' : p.wild ? 'wild' : p.undo ? 'undo' : Object.keys(p.helps)[0]}"><span class="pl-pz">${slotIcon(p)}</span><i>${slotText(p)}</i></div>`).join('')}</div>
      <div class="pl-launch">${LAUNCH}</div><div class="pl-hint">¡Toca para soltarlo!</div>
    </div></div>`;
  screen.append(back);
  const lift = (on) => document.querySelector('#app .screen .res')?.classList.toggle('feat-lift', on);
  lift(true);
  back.addEventListener('remount', () => lift(true));
  const wrap = back.querySelector('.pl-wrap'), board = back.querySelector('.pl-board'), head = back.querySelector('.pl-head');
  const pegEls = [...back.querySelectorAll('.pl-pegs circle')], slotEls = [...back.querySelectorAll('.pl-slot')];
  const lau = back.querySelector('.pl-launch'), hint = back.querySelector('.pl-hint');
  // Escala del tablero: lo que quepa (acostado, el letrero va a la izquierda).
  let k = 1;
  const layout = () => {
    const bw = back.clientWidth, bh = back.clientHeight, land = bw > bh;
    back.classList.toggle('land', land);
    // Arriba queda libre lo que ocupa la barra del monedero (17 nov 2026, el usuario: acostado en el teléfono el tablero
    // quedaba debajo de la barra y el letrero se salía por la izquierda).
    const bar = document.querySelector('#app .screen .res')?.getBoundingClientRect(), top = Math.max(14, bar ? bar.bottom - back.getBoundingClientRect().top + 8 : 14);
    back.style.paddingTop = `${top}px`;
    k = land ? Math.min((bh - top - 14) / H, (bw - head.offsetWidth - 60) / W) : Math.min((bw - 28) / W, (bh - top - head.offsetHeight - 40) / H);
    k = Math.max(0.4, Math.min(1.35, k));
    board.style.scale = k;
    Object.assign(wrap.style, { width: `${W * k}px`, height: `${H * k}px` });
  };
  layout();
  const ro = new ResizeObserver(layout);
  ro.observe(back);
  const anim = (node, kf, o) => (fast ? Promise.resolve() : node.animate(kf, { fill: 'forwards', ...o }).finished.catch(() => {}));
  return new Promise((done) => {
    anim(back, [{ opacity: 0 }, { opacity: 1 }], { duration: 350 });
    anim(head.querySelector('.sx-title'), [{ scale: 0, rotate: '-8deg' }, { scale: 1.2, rotate: '3deg', offset: 0.65 }, { scale: 1, rotate: '0deg' }], { duration: 520, delay: 160, easing: 'ease-out', fill: 'backwards' });
    anim(head.querySelector('.pl-ico'), [{ scale: 0, opacity: 0 }, { scale: 1.25, opacity: 1, offset: 0.6 }, { scale: 1, opacity: 1 }], { duration: 480, delay: 60, easing: 'ease-out', fill: 'backwards' });
    // El lanzador va y viene hasta que tocas.
    let lx = W / 2, swing = true;
    const t0 = performance.now();
    (function sw(now) {
      if (!swing || !back.isConnected) return;
      lx = W / 2 + Math.sin((now - t0) / 430) * (W / 2 - 44);
      lau.style.left = `${lx}px`;
      requestAnimationFrame(sw);
    })(t0);
    let dropped = false;
    const drop = async () => {
      if (dropped) return;
      dropped = true;
      swing = false;
      hint.remove();
      buzz(10);
      pay(prize);
      lau.animate([{ translate: '-50% 0' }, { translate: '-50% 6px' }, { translate: '-50% 0' }], { duration: 200 });
      const r = aimFall(lx, tgt);
      const ball = document.createElement('i');
      ball.className = 'pl-ball';
      board.append(ball);
      // Repite la caída cuadro por cuadro (con su estela y los clavitos que brillan al tocarlos).
      await new Promise((end) => {
        if (fast) return end();
        const s0 = performance.now();
        let hi = 0, tr = 0;
        (function step(now) {
          if (!back.isConnected) return end();
          const f = Math.max(0, Math.min(r.path.length - 1, Math.floor(((now - s0) / 1000) * 60)));
          const [x, y] = r.path[f];
          ball.style.translate = `${x}px ${y}px`;
          while (hi < r.hits.length && r.hits[hi][0] <= f) {
            const el = pegEls[r.hits[hi++][1]];
            el.classList.remove('hit');
            void el.getBBox();
            el.classList.add('hit');
          }
          if (++tr % 2 === 0) {
            const t = document.createElement('i');
            t.className = 'pl-trail';
            t.style.translate = `${x}px ${y}px`;
            board.append(t);
            t.animate([{ opacity: 0.9, scale: 1 }, { opacity: 0, scale: 0.2 }], { duration: 380 }).finished.then(() => t.remove());
          }
          if (f >= r.path.length - 1) return end();
          requestAnimationFrame(step);
        })(s0);
      });
      ball.remove();
      // El hueco brilla y salen sus burbujas (las monedas vuelan al monedero).
      const s = slotEls[tgt];
      s.classList.add('win');
      buzz(30);
      const sr = s.getBoundingClientRect(), at = { x: sr.left + sr.width / 2, y: sr.top + sr.height / 3 };
      sparkle(at, 22);
      show(prize, at);
      await wait(fast ? 300 : 1700);
      await anim(wrap, [{ opacity: 1, translate: '0 0', scale: 1 }, { opacity: 0, translate: '0 60px', scale: 0.85 }], { duration: 380, easing: 'ease-in' });
      anim(head, [{ opacity: 1 }, { opacity: 0 }], { duration: 250 });
      await anim(back, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
      ro.disconnect();
      back.remove();
      lift(false);
      done();
    };
    back.addEventListener('pointerdown', () => !dropped && performance.now() - t0 > 700 && drop());
  });
}
