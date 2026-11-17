// Tragamonedas galáctico (14 nov 2026, pedido del usuario): una tirada de la suerte para entrar al evento del mes o a una
// festividad. Sale los días de la preventa (3 días antes) y el mero día (festividad: su día; evento del mes: del 1 al 5),
// si todavía no compras la entrada (traigas lo que traigas: 14 nov 2026, el usuario: que no salgan perdiendo los que
// ahorraron; si traes más del doble, la tabla es más chica). Se cobra una vez por edición
// (save.spins[id]); sola en el mapa sale mientras no la jales (no se puede saltar) y luego abre su ventana de compra.
// Si dos ediciones están abiertas a la vez, una sola tirada cuenta para las dos y paga el doble.
// Premio: se escoge primero y luego los planetas que lo forman. Si te falta para la entrada, te da lo que falta más un
// extra al azar de 90 a 540 (para que no se note exacto). El jackpot (2%) puede salir siempre.
import { save, persist } from './storage.js';
import { ev, evSoon, evPreOwned, evPrePrice, evTicketPrice, festival, festivalSoon, festPre, festPaid, festPrice, EV_LATE_DAYS } from './events.js';
import { miniPlanet, coin } from './art.js';
import { money, reduced, flyToWallet, sparkle, confetti, popPrize, updateCoins, buzz } from './ui.js';

// [monedas, probabilidad %]. El último es el jackpot: 4 agujeros negros.
export const SLOT_PAY = [[230, 17], [345, 30], [460, 33], [690, 14], [1150, 4], [2300, 2]];
// Si trae más del doble de la entrada (14 nov 2026, el usuario: amortiguar): la misma tabla, más chica. El jackpot igual.
export const SLOT_PAY_RICH = [[115, 17], [175, 30], [290, 33], [460, 14], [920, 4]];
const JACKPOT = 2300, HOLE = 5;
// Los mismos planetitas del regalo diario.
const PLANETS = [['#ff9c5b', '#e2753a', '#ffd27a'], ['#5ab0ff', '#2f86c8', '#9fe6ff'], ['#86cf5c', '#4d9f45', '#2f86c8'], ['#ff7aa2', '#d64f7c', '#ffd0e0'], ['#a37bff', '#7c55e0', '#e0d0ff']];
const K = '#2a1f5c';
const hole = () => `<svg class="ico sx-hole" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#8a5cf0" stroke="${K}" stroke-width="2.2"/><path d="M16 4.6a11.4 11.4 0 0 1 11.4 11.4M16 27.4A11.4 11.4 0 0 1 4.6 16" stroke="#ff9c3d" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M27.4 16A11.4 11.4 0 0 1 16 27.4M4.6 16A11.4 11.4 0 0 1 16 4.6" stroke="#5ab0ff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/><circle cx="16" cy="16" r="6" fill="#05030f" stroke="#ffd27a" stroke-width="1.4"/></svg>`;
const sym = (i) => `<span>${i === HOLE ? hole() : miniPlanet(PLANETS[i])}</span>`;
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Las ediciones que tienen tirada ahora: preventas sin comprar, el día de la festividad y los días 1 al 5 del evento del
// mes sin pagar. buy: qué ventana de compra se abre después ('fiesta' preventa o entrada · 'mesPre' · 'mes').
export const SLOT_MONTH_DAYS = EV_LATE_DAYS;
function editions() {
  const out = [];
  const add = (x, price, buy) => x && !save.spins?.[x.id] && !out.some((o) => o.id === x.id) && out.push({ id: x.id, name: x.name, price, buy });
  const f = festival();
  if (f && (f.soon ? !festPre(f) : !festPaid(f))) add(f, festPrice(f), 'fiesta');
  const f2 = festivalSoon();
  if (f2 && !festPre(f2)) add(f2, festPrice(f2), 'fiesta');
  const n = evSoon();
  if (n && !evPreOwned(n)) add(n, evPrePrice(n), 'mesPre');
  const e = ev(), d = new Date(Date.now() + (save.devDay || 0) * 864e5);
  // Del 1 al 5, o cualquier día si es su primer evento y lo abrió tarde (subiendo de nivel; e.state.late).
  if (e && !e.state.paid && (d.getDate() <= SLOT_MONTH_DAYS || e.state.late)) add(e, evTicketPrice(e), 'mes');
  return out.slice(0, 2);
}
// La tirada de hoy: { eds, total, mult } o null (no hay).
export function slotOffer() {
  const eds = editions();
  if (!eds.length) return null;
  return { eds, total: eds.reduce((n, x) => n + x.price, 0), mult: eds.length };
}
// Para el modo dev: si hoy hay tirada y, si no, por qué.
export function slotWhy() {
  const eds = editions(), fmt = (n) => n.toLocaleString('es-MX');
  if (!eds.length) return 'Hoy no hay: ninguna preventa ni día de fiesta abierto (o ya cobraste su tirada).';
  const total = eds.reduce((n, x) => n + x.price, 0), names = eds.map((x) => x.name).join(' y ');
  const tier = save.coins < total ? `le faltan ${fmt(total - save.coins)}: lo que falta + ${SLOT_EXTRA[0]} a ${SLOT_EXTRA[1]}` : save.coins <= total * 2 ? 'hasta el doble: tabla normal' : `más del doble (${fmt(total * 2)}): tabla chica`;
  return `Hoy sí sale${eds.length > 1 ? ' ×2' : ''}: ${names} · entrada ${fmt(total)} · traes ${fmt(save.coins)} → ${tier}.`;
}
// Sale sola en el mapa mientras haya tirada sin jalar (no se puede saltar).
export const slotDue = () => !!slotOffer();

// El premio (sin multiplicar): { c: monedas, row: su renglón de la tabla (0 todos distintos … 4 cuatro planetas, 5 jackpot) }.
// need: lo que te falta (ya dividido entre mult) · rich: trae más del doble · force: 'jackpot' para el modo dev.
// Tres escalones: le falta → lo que falta + SLOT_EXTRA · hasta el doble → SLOT_PAY · más del doble → SLOT_PAY_RICH.
export const SLOT_EXTRA = [105, 620];
function prize(need, rich, force) {
  if (force === 'jackpot' || Math.random() * 100 < SLOT_PAY.at(-1)[1]) return { c: JACKPOT, row: 5 };
  if (need > 0) {
    const c = Math.round((need + SLOT_EXTRA[0] + Math.random() * (SLOT_EXTRA[1] - SLOT_EXTRA[0])) / 10) * 10;
    return { c, row: c >= 1150 ? 4 : c >= 690 ? 3 : c >= 460 ? 2 : c >= 345 ? 1 : 0 };
  }
  const T = rich ? SLOT_PAY_RICH : SLOT_PAY.slice(0, -1);
  let r = Math.random() * (100 - SLOT_PAY.at(-1)[1]);
  for (let i = 0; i < T.length; i++) if ((r -= T[i][1]) < 0) return { c: T[i][0], row: i };
  return { c: T[0][0], row: 0 };
}
// Los 4 símbolos de cada renglón: 4 agujeros (jackpot) · 4 planetas iguales · 3 iguales · dos pares · un par · todos distintos.
function face(row) {
  if (row === 5) return [HOLE, HOLE, HOLE, HOLE];
  const [a, b, c, d] = shuffle([0, 1, 2, 3, 4, HOLE]), pl = shuffle([0, 1, 2, 3, 4])[0];
  return shuffle([[a, b, c, d], [a, a, b, c], [a, a, b, b], [a, a, a, b], [pl, pl, pl, pl]][row]);
}

// ---------- La pantalla ----------
// No se puede saltar (14 nov 2026, el usuario): no hay cerrar ni «Ahora no»; se sale jalando la palanca. Al girar el
// teléfono la pantalla del mapa se vuelve a dibujar: la tirada se pasa a la nueva y sigue donde iba (como los festejos).
// Al terminar se cierra sola (o tocando). test: el modo dev la abre aunque no haya tirada (no da ni marca nada).
let open = null;
export function openSlot({ test = false, force = null } = {}) {
  if (open) return open;
  const off = slotOffer() || (test ? { eds: [{ id: 'dev', name: 'Prueba', price: 800 }], total: 800, mult: 1 } : null);
  if (!off) return Promise.resolve(false);
  const { eds, mult } = off;
  // Focos en la orilla: 6 arriba, 3 a la derecha, 6 abajo y 3 a la izquierda (en un óvalo se veían chuecos).
  const edge = [...[0, 1, 2, 3, 4, 5].map((i) => [8 + i * 16.8, 0]), ...[1, 2, 3].map((i) => [100, i * 25]), ...[5, 4, 3, 2, 1, 0].map((i) => [8 + i * 16.8, 100]), ...[3, 2, 1].map((i) => [0, i * 25])];
  const bulbs = edge.map(([x, y], i) => `<i style="left:${x.toFixed(1)}%;top:${y}%;--i:${i}"></i>`).join('');
  const back = document.createElement('div');
  back.className = 'slotx';
  back.innerHTML = `<div class="sx-sky"></div><div class="sx-rays"></div>
    <div class="sx-stage">
      <div class="sx-head"><div class="sx-title"><b>¡Estás de suerte!</b><small>Es momento de ganar</small></div></div>
      <div class="sx-machine">
        <div class="sx-bulbs">${bulbs}</div>
        ${mult > 1 ? '<i class="sx-x2">×2</i>' : ''}
        <div class="sx-reels">${[1, 3, 0, 4].map((s) => `<div class="sx-win"><div class="sx-strip">${sym(s)}</div></div>`).join('')}</div>
        <div class="sx-jack">${hole()}${hole()}${hole()}${hole()}<b>= ${coin()} ${money(JACKPOT * mult)}</b></div>
        <div class="sx-lever" role="button" aria-label="Jalar la palanca"><i class="sx-track"></i><i class="sx-arm"></i><b class="sx-knob"><em class="sx-tap">¡Jala!</em></b><i class="sx-pivot"></i></div>
      </div>
      <div class="sx-out"><b class="sx-amt"></b></div>
    </div>`;
  const q = (s) => back.querySelector(s);
  // Va dentro de la pantalla (que aísla sus capas) para que el monedero quede encima; si la pantalla cambia, se muda.
  let res = null;
  const attach = () => {
    const screen = document.querySelector('#app .screen.galaxy');
    if (!screen) return;
    if (back.parentNode !== screen) screen.append(back);
    const r = screen.querySelector('.res');
    // Encima para ver llegar las monedas, pero bloqueado: no se puede abrir el perfil ni nada mientras está la tirada.
    if (r !== res) res?.classList.remove('feat-lift', 'sx-lock'), (res = r), r?.classList.add('feat-lift', 'sx-lock');
  };
  attach();
  if (!back.parentNode) document.body.append(back);
  const keep = setInterval(attach, 300);
  if (!reduced()) back.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240 }), q('.sx-machine').animate([{ scale: 0.5, opacity: 0 }, { scale: 1.08, opacity: 1, offset: 0.7 }, { scale: 1 }], { duration: 460, easing: 'ease-out' }), q('.sx-title').animate([{ scale: 0, rotate: '-8deg' }, { scale: 1.2, rotate: '3deg', offset: 0.65 }, { scale: 1, rotate: '0deg' }], { duration: 520, delay: 160, easing: 'ease-out', fill: 'backwards' });
  open = new Promise((done) => {
    let state = 'ready';
    const close = async () => {
      if (state !== 'won') return;
      state = 'gone';
      clearInterval(keep);
      if (!reduced()) await back.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220 }).finished;
      back.remove();
      res?.classList.remove('feat-lift', 'sx-lock');
      open = null;
      done(test ? true : eds);
    };
    back.addEventListener('click', (ev) => !ev.target.closest('.sx-lever') && close());
    const pull = async () => {
      if (state !== 'ready') return close();
      state = 'spin';
      q('.sx-tap').remove();
      // Se cobra al jalar (si cierra la app a la mitad, ya lo tiene).
      const pz = prize(Math.ceil((off.total - save.coins) / mult), save.coins > off.total * 2, force), p = pz.c, pay = p * mult, f = face(pz.row);
      if (!test) {
        save.spins ||= {};
        for (const x of eds) save.spins[x.id] = 1;
        const keys = Object.keys(save.spins);
        for (const k of keys.slice(0, Math.max(0, keys.length - 30))) delete save.spins[k];
        save.coins += pay;
        persist();
      }
      // La palanca baja de arriba hacia abajo (el brazo gira hacia ti: se encoge, pasa el eje y sale por abajo) y regresa.
      buzz(15);
      if (!reduced()) {
        // La bola baja dos veces el largo del brazo (de arriba del eje a abajo), se queda un momento y regresa.
        const L = q('.sx-arm').offsetHeight, o = { duration: 680, easing: 'cubic-bezier(0.3, 0, 0.3, 1)' };
        const at = (a, b) => [{ offset: 0, transform: a }, { offset: 0.42, transform: b }, { offset: 0.62, transform: b }, { offset: 1, transform: a }];
        q('.sx-arm').animate(at('scaleY(1)', 'scaleY(-1)'), o);
        await q('.sx-knob').animate(at('translateY(0)', `translateY(${2 * L}px)`), o).finished;
      }
      const wins = [...back.querySelectorAll('.sx-win')];
      await Promise.all(wins.map((w, k) => {
        const strip = w.querySelector('.sx-strip'), n = 18 + k * 5;
        strip.innerHTML = Array.from({ length: n }, (_, i) => sym(i === n - 1 ? f[k] : Math.floor(Math.random() * 6))).join('');
        // La altura exacta de una casilla (offsetHeight la redondea y el error se juntaba: la tira paraba chueca).
        const h = strip.firstElementChild.getBoundingClientRect().height, to = -(n - 1) * h;
        if (reduced()) return (strip.style.transform = `translateY(${to}px)`), null;
        w.classList.add('spin');
        return strip.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${to - h * 0.22}px)`, offset: 0.92 }, { transform: `translateY(${to}px)` }], { duration: 1100 + k * 420, easing: 'cubic-bezier(0.15, 0.6, 0.3, 1)', fill: 'forwards' }).finished
          .then(() => { w.classList.remove('spin'); buzz(8); return w.animate([{ scale: 1 }, { scale: 1.1 }, { scale: 1 }], { duration: 180 }).finished; });
      }));
      // Brillan las que se repiten.
      wins.forEach((w, k) => f.filter((x) => x === f[k]).length > 1 && w.classList.add('hit'));
      const jack = p === JACKPOT;
      if (jack) {
        back.classList.add('jack');
        q('.sx-machine').animate([{ translate: '0 0' }, { translate: '-6px 2px' }, { translate: '6px -2px' }, { translate: '-4px 0' }, { translate: '0 0' }], { duration: 420, iterations: 2 });
        const t = document.createElement('div');
        t.className = 'sx-jackpot';
        t.innerHTML = '<b>¡JACKPOT!</b><small>4 agujeros negros</small>';
        // Flota encima del título (sin ocupar lugar): antes lo empujaba y la máquina se movía.
        q('.sx-head').append(t);
        if (!reduced()) t.animate([{ scale: 0, rotate: '-12deg' }, { scale: 1.25, rotate: '4deg', offset: 0.6 }, { scale: 1, rotate: '0deg' }], { duration: 600, easing: 'ease-out' });
        confetti(160);
        coinRain(back, 36);
        buzz([30, 40, 30, 40, 60]);
      } else if (p >= 600) confetti(60);
      const out = q('.sx-out'), amt = q('.sx-amt');
      out.classList.add('on');
      if (!reduced()) out.animate([{ scale: 0.3, opacity: 0 }, { scale: 1.2, opacity: 1, offset: 0.6 }, { scale: 1 }], { duration: 380, easing: 'ease-out' });
      await countUp(amt, pay);
      const r = amt.getBoundingClientRect(), at = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      sparkle(at, jack ? 40 : p >= 600 ? 26 : 14);
      if (!test) await flyToWallet('coins', at, pay);
      updateCoins();
      state = 'won';
      // Se va sola (o tocando en cualquier lado).
      setTimeout(close, jack ? 2600 : 1400);
    };
    q('.sx-lever').addEventListener('click', pull);
  });
  return open;
}
// El número sube de 0 al premio con sus monedas sonando.
function countUp(el, n) {
  if (reduced()) return (el.innerHTML = `${coin()} +${money(n)}`), Promise.resolve();
  return new Promise((ok) => {
    const t0 = performance.now(), D = n >= 2000 ? 1400 : 700;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / D);
      el.innerHTML = `${coin()} +${money(Math.round(n * (1 - (1 - k) ** 3)))}`;
      if (k < 1 && el.isConnected) requestAnimationFrame(step);
      else ok();
    };
    requestAnimationFrame(step);
  });
}
// Lluvia de monedas del jackpot.
function coinRain(root, n) {
  if (reduced()) return;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.className = 'sx-coin';
    c.innerHTML = coin();
    c.style.left = `${Math.random() * 100}%`;
    root.append(c);
    c.animate([{ transform: `translateY(-10vh) rotate(0deg)` }, { transform: `translateY(110vh) rotate(${(Math.random() - 0.5) * 720}deg)` }], { duration: 1400 + Math.random() * 1200, delay: Math.random() * 900, easing: 'cubic-bezier(0.4, 0, 0.8, 0.6)', fill: 'both' }).finished.then(() => c.remove());
  }
}
