import { save, persist } from './storage.js';
import { openModal, toast, confetti, updateCoins, starsHTML } from './ui.js';
import { worldInfo, packGroups, MECH_NAMES } from './levels.js';
import * as E from './engine.js';
import { price } from './economy.js';
import { cardBack, svgUrl, icon, star, coin, placeIcon, lockIcon, keyIcon } from './lowpoly.js';
import { Coach } from './coach.js';

const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const LOCK_HUES = [350, 45, 200]; // color de cada pareja candado/llave
const FLY_MS = 400;
const FLY_EASE = 'cubic-bezier(0.33, 0.6, 0.35, 1)';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const buzz = () => navigator.vibrate?.(30);
const REWARD_TEXT = { card: '+1 carta al mazo', wild: 'comodín al mazo', bank: '+1 comodín' };
const ARROW = { 1: '↑', '-1': '↓' };
// Explicación de cada mecánica la primera vez que aparece (modo jugador).
const TIPS = {
  lock: 'Esta carta tiene <b>candado</b>: no se puede jugar hasta que juegues la carta con la <b>llave</b> del mismo color.',
  pack: 'La <b>carta regalo</b> no se juega: cuando la destapes por completo, mete cartas extra al final de tu mazo.',
  ice: 'Carta de <b>hielo</b>: cada carta que juegas del tablero le quita 1. Cuando llega a 0 se derrite y ya la puedes jugar.',
  double: 'La <b>carta doble</b> es dos números a la vez. Puedes jugarla si conecta con cualquiera de los dos, y cuando queda abajo puedes seguir desde cualquiera de sus dos números.',
  arrow: 'Después de jugar una carta con <b>flecha</b>, la siguiente tiene que ser justo un número arriba (↑) o abajo (↓).',
  curtain: 'Estas cartas tienen <b>cortina</b>: siguen boca abajo hasta que juegues la carta con el telón.',
  bomb: 'La <b>bomba</b> no se juega: tienes que <b>destaparla</b> antes de que su cuenta llegue a 0 (baja con cada jugada o robo). Si no, explota y quema 3 cartas de tu mazo.',
  live: 'La <b>carta viva</b> cambia de número cada vez que juegas o robas: sube (↑) o baja (↓). Juégala cuando encaje.',
};
const MECH_FIELD = { lock: 'lock', pack: 'pack', ice: 'ice', double: 'alt', arrow: 'arrow', curtain: 'curtain', bomb: 'bomb', live: 'live' };

// Asentarse al aterrizar: un aplastón leve, el protagonismo es el vuelo.
function squash(el) {
  if (!el || reduced()) return;
  el.animate([{ transform: 'scale(1.06, 0.94)' }, { transform: 'scale(0.98, 1.02)', offset: 0.5 }, { transform: 'none' }], {
    duration: 240,
    easing: 'ease-out',
  });
}

// Lanzamiento: la carta se levanta, gira en el aire y cae en su destino.
// spin = grados de giro (360 = una vuelta; 0 = solo un ladeo leve).
// Las coordenadas son desplazamientos (px) respecto a donde está el elemento.
function toss(el, { x0 = 0, y0 = 0, s0 = 1, r0 = 0 }, { x1 = 0, y1 = 0, s1 = 1, r1 = 0 }, spin = 0) {
  const dir = x1 - x0 >= 0 ? 1 : -1;
  const lift = Math.min(50, 18 + Math.hypot(x1 - x0, y1 - y0) * 0.1);
  // Propiedades separadas (translate, rotate, scale): así el desplazamiento no gira con la carta
  // y el giro es sobre su propio centro. Con transform: translate() + rotate el camino salía en espiral.
  const k = (x, y, sc, r, offset) => ({ translate: `${x}px ${y}px`, scale: `${sc}`, rotate: `${r}deg`, ...(offset != null && { offset }) });
  const mid = spin ? spin / 2 : 14;
  const frames = [
    k(x0, y0, s0, r0),
    k(x0, y0 - 6, s0 * 1.06, r0 - 4 * dir, 0.12),
    k((x0 + x1) / 2, (y0 + y1) / 2 - lift, Math.max(s0, s1) * 1.1, (r0 + r1) / 2 + mid * dir, 0.55),
    k(x1, y1, s1, r1 + spin * dir),
  ];
  return el.animate(frames, { duration: reduced() ? 1 : spin ? FLY_MS + 80 : FLY_MS, easing: FLY_EASE, fill: 'forwards' }).finished;
}

const center = (r) => [r.left + r.width / 2, r.top + r.height / 2];

// rank: número a mostrar (la carta viva cambia); si no se da, el de la carta.
export function faceHTML(c, rank = c.rank) {
  if (c.wild) return `<div class="face front wild">${star(true)}</div>`;
  if (rank == null) return '';
  const s = SUITS[c.suit];
  const red = c.suit === 1 || c.suit === 2 ? ' red' : '';
  const arrow = c.arrow ? `<span class="arrow-badge">${ARROW[c.arrow]}</span>` : '';
  const live = c.live ? `<span class="live-badge">${ARROW[c.live]}</span>` : '';
  // Carta doble: los dos números partidos en grande ("5/8"), palos más chicos.
  if (c.alt != null)
    return `<div class="face front double${red}"><span class="dbl"><b>${RANKS[c.rank]}</b><i></i><b>${RANKS[c.alt]}</b></span><span class="st">${s}</span><span class="big">${s}</span></div>`;
  return `<div class="face front${red}${c.live ? ' live' : ''}"><span class="rk">${RANKS[rank]}</span><span class="st">${s}</span><span class="big">${s}</span>${arrow}${live}</div>`;
}
const inner = (c) => `<div class="inner">${faceHTML(c)}<div class="face back"></div></div>`;
// Marcas que se ven aunque la carta esté boca abajo, para poder planear.
const marks = (c) =>
  (c.ice ? `<span class="ice-ov"><b></b></span>` : '') +
  (c.curtainKey != null ? `<span class="curtain-mark"></span>` : '') +
  (c.key != null ? `<span class="key-mark">${keyIcon(LOCK_HUES[c.key])}</span>` : '') +
  (c.lock != null ? `<span class="lock-ov">${lockIcon(LOCK_HUES[c.lock])}</span>` : '');

// opts: onExit, onAbandon, onRetry, onNext, onWin(stars) → { coins, tickets, prev }, onSave(state)?,
//       resume (estado guardado), saved (la partida se guarda al salir), tutorial, nextCost, dev
export class Game {
  constructor(root, level, opts) {
    this.level = level;
    this.opts = opts;
    this.info = worldInfo(level.world);
    this.cards = level.cards.map((c) => ({ ...c, removed: false, el: null }));
    this.st = E.initState(level); // estado de reglas (js/engine.js): la única fuente de verdad
    this.history = []; // { t, before: estado anterior, ev: lo que pasó (para animar el deshacer), best, bonus }
    this.best = 0;
    this.bonus = 0;
    this.extras = 0;
    this.done = false;
    this.busy = true; // mientras hay una animación que bloquea (barajeo, carta regalo) no se puede tocar
    this.dealing = true; // durante el barajeo las cartas no se voltean
    this.modalOpen = false;
    if (opts.resume?.st) this.restore(opts.resume); // partidas guardadas con el formato viejo se empiezan de nuevo
    this.sync();

    this.el = this.build();
    root.append(this.el);
    this.onResize = () => this.layout();
    window.addEventListener('resize', this.onResize);
    this.onKey = (e) => this.key(e);
    window.addEventListener('keydown', this.onKey);
    this.layout();
    this.cards.forEach((c) => !c.removed && this.makeCardEl(c));
    this.renderPiles();
    this.updateCounts();
    this.showCombo();
    this.intro()
      .then(() => {
        if (this.done) return;
        this.dealing = false;
        this.refresh();
        return this.presentBombs();
      })
      .then(() => {
        if (this.done) return;
        this.busy = false;

        if (opts.tutorial) this.coach = new Coach(this);
        else this.tips();
      });
  }

  // Atajos de lectura del estado.
  get stock() {
    return this.st.stock;
  }
  get streak() {
    return this.st.streak;
  }
  get top() {
    return this.st.top;
  }
  sync() {
    this.cards.forEach((c, i) => (c.removed = this.st.rem[i]));
  }

  // La primera vez que aparece una mecánica se explica (solo en modo jugador; en dev se ve en la galería).
  tips() {
    const next = (this.level.meta.mechs || []).find((m) => TIPS[m] && !save.seen[m]);
    if (!next) return;
    save.seen[next] = true;
    persist();
    const c = this.cards.find((x) => !x.removed && x.el && x[MECH_FIELD[next]] != null);
    this.modalOpen = true;
    openModal({
      title: `Nuevo: ${MECH_NAMES[next]}`,
      body: `<p>${TIPS[next]}</p>`,
      onClose: () => {
        this.modalOpen = false;
        if (c?.el) {
          c.el.classList.remove('hint');
          void c.el.offsetWidth;
          c.el.classList.add('hint');
          setTimeout(() => c.el?.classList.remove('hint'), 1600);
        }
        setTimeout(() => this.tips(), 300);
      },
      buttons: [{ label: '¡Entendido!' }],
    });
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKey);
    this.coach?.end();
    this.done = true;
  }

  // ---------- Guardar y retomar ----------
  snapshot() {
    return { st: this.st, history: this.history, best: this.best, bonus: this.bonus, extras: this.extras, stockMax: this.stockMax };
  }

  restore(s) {
    Object.assign(this, { st: s.st, history: s.history, best: s.best, bonus: s.bonus, extras: s.extras, stockMax: s.stockMax });
  }

  // Se llama tras cada acción. Solo guarda si el nivel es nuevo (ver main.js).
  save() {
    if (!this.done) this.opts.onSave?.(this.snapshot());
  }

  // Teclado (PC): espacio roba, Z deshace, C comodín, Esc sale.
  key(e) {
    if (this.done || this.busy || e.repeat || e.metaKey || e.ctrlKey || document.querySelector('.modal-back')) return;
    const k = e.key.toLowerCase();
    const act = { ' ': () => this.draw(), enter: () => this.draw(), z: () => this.undo(), backspace: () => this.undo(), c: () => this.useWild(), escape: () => this.exit() }[k];
    if (!act) return;
    e.preventDefault();
    act();
  }

  build() {
    const { level, info } = this;
    const el = document.createElement('div');
    el.className = 'screen game';
    el.style.setProperty('--hue', info.hue);
    this.back = svgUrl(cardBack(info.hue));
    el.style.setProperty('--back', this.back);
    el.innerHTML = `
      <header class="hud">
        <button class="icon-btn" data-a="exit" aria-label="Salir">${icon('close')}</button>
        <div class="hud-title"><b>${placeIcon(info.place)} Mundo ${level.world + 1}</b><small>Nivel ${level.index + 1}${level.boss ? ` · ${icon('crown', '#ffe46b', '#f5a712')} Jefe` : ''}</small></div>
        <div class="pill coins">${coin()}<span data-coins>${save.coins}</span></div>
      </header>
      <div class="progress-row"><div class="combo"></div></div>
      <div class="board-wrap"><div class="board"></div><div class="streak"></div></div>
      <footer class="tray">
        <div class="stock" data-a="draw" role="button" aria-label="Mazo"></div>
        <div class="pile waste"></div>
        <button class="undo-btn" data-a="undo" aria-label="Deshacer">${icon('undo')}<b class="badge" data-n="undo"></b></button>
        <span class="tray-space"></span>
        <button class="wild-card" data-a="wild" aria-label="Comodín">${star(true)}<span>COMODÍN</span><b class="badge" data-n="wild"></b></button>
      </footer>`;
    this.boardEl = el.querySelector('.board');
    this.wrapEl = el.querySelector('.board-wrap');
    this.stockEl = el.querySelector('.stock');
    this.wasteEl = el.querySelector('.waste');
    this.streakEl = el.querySelector('.streak');
    this.comboEl = el.querySelector('.combo');
    // Cartas y mazo responden al apoyar el dedo, no al soltarlo.
    el.addEventListener('pointerdown', (e) => {
      if (this.done || this.busy || e.button > 0) return;
      const cardEl = e.target.closest('.board .card');
      if (cardEl) return this.tapCard(+cardEl.dataset.id);
      if (e.target.closest('.stock')) this.draw();
    });
    el.addEventListener('click', (e) => {
      if (this.done) return;
      const a = e.target.closest('button[data-a]')?.dataset.a;
      if (a === 'exit') return this.exit();
      if (this.busy) return;
      const actions = {
        undo: () => this.undo(),
        wild: () => this.useWild(),
      };
      actions[a]?.();
    });
    return el;
  }

  // ---------- Entrada: barajar y repartir ----------
  // Todas las cartas empiezan juntas en el centro como un mazo, se barajan dos veces
  // (se parten en dos y se vuelven a juntar) y salen volando a su lugar una tras otra.
  intro() {
    // Las bombas no se reparten: se presentan aparte al final (presentBombs).
    for (const c of this.cards) if (c.bomb && c.el && !reduced()) c.el.style.opacity = 0;
    const live = this.cards.filter((c) => c.el && !c.bomb);
    if (reduced() || !live.length) return Promise.resolve();
    const cx = (parseFloat(this.boardEl.style.width) - this.u) / 2;
    const cy = (parseFloat(this.boardEl.style.height) - this.u * 1.4) / 2;
    const order = live.slice().sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x);
    const SHUF = 720;
    const FLY = 420;
    const step = Math.min(30, 900 / order.length);
    const cw = this.u;
    let last;
    order.forEach((c, i) => {
      const el = c.el;
      const dx = cx - parseFloat(el.style.left);
      const dy = cy - parseFloat(el.style.top);
      const side = i % 2 ? 1 : -1;
      const wait = SHUF + i * step;
      const total = wait + FLY;
      const at = (ms) => ms / total;
      const stackY = -i * 0.6; // el mazo se ve con algo de grosor
      const k = (x, y, r, offset, easing = 'ease-in-out') => ({ translate: `${x}px ${y}px`, rotate: `${r}deg`, offset, easing });
      const frames = [
        k(dx, dy + stackY, 0, 0),
        k(dx + side * cw * 0.62, dy + stackY - 4, side * 7, at(SHUF * 0.2)),
        k(dx, dy + stackY, 0, at(SHUF * 0.42)),
        k(dx + side * cw * 0.62, dy + stackY - 4, side * 7, at(SHUF * 0.62)),
        k(dx, dy + stackY, 0, at(SHUF * 0.84)),
        k(dx, dy + stackY, 0, at(wait), 'cubic-bezier(0.25, 0.8, 0.3, 1.12)'),
        { translate: '0px 0px', rotate: `${c.rot}deg`, offset: 1 },
      ];
      last = el.animate(frames, { duration: total, fill: 'backwards' });
    });
    return last.finished.catch(() => {});
  }

  // Al armarse el tablero, cada bomba aparece grande al frente con su cuenta y luego vuela a su lugar,
  // una tras otra: así se ve dónde cae cada una y cuántas jugadas tiene.
  presentBombs() {
    const bombs = this.cards.filter((c) => c.bomb && c.el && !c.removed);
    if (!bombs.length || reduced()) return Promise.resolve();
    const w = parseFloat(this.boardEl.style.width);
    const h = parseFloat(this.boardEl.style.height);
    // Grandes, pero que quepan todas en el ancho de la pantalla.
    const avail = this.wrapEl.getBoundingClientRect().width * 0.9;
    const big = Math.min(2.2, avail / (bombs.length * this.u * 1.15));
    const gap = this.u * big * 1.15;
    const runs = bombs.map((c, i) => {
      const el = c.el;
      const x = parseFloat(el.style.left);
      const y = parseFloat(el.style.top);
      const cx = w / 2 - this.u / 2 + (i - (bombs.length - 1) / 2) * gap;
      const cy = h / 2 - (this.u * 1.4) / 2;
      el.style.zIndex = 9800 + i;
      el.style.opacity = '';
      const k = (tx, ty, sc, rot, offset, easing) => ({ translate: `${tx}px ${ty}px`, scale: sc, rotate: `${rot}deg`, offset, easing });
      const a = el.animate(
        [
          { ...k(cx - x, cy - y, 0.2, -20, 0, 'cubic-bezier(0.34, 1.45, 0.64, 1)'), opacity: 0 },
          { ...k(cx - x, cy - y, big * 0.9, -4, 0.15, 'cubic-bezier(0.34, 1.45, 0.64, 1)'), opacity: 1 },
          k(cx - x, cy - y, big, 0, 0.25, 'linear'),
          k(cx - x, cy - y, big, 0, 0.55 + i * 0.05, 'cubic-bezier(0.5, 0, 0.3, 1)'),
          k(0, 0, 1, c.rot, 1),
        ],
        { duration: 1500 + i * 350, fill: 'backwards' },
      );
      return a.finished.then(() => {
        el.style.zIndex = c.z * 100 + c.id;
        squash(el);
      });
    });
    return Promise.all(runs);
  }

  // ---------- Render ----------
  makeCardEl(c) {
    const d = document.createElement('div');
    d.className = c.pack ? 'card pack-card' : c.bomb ? 'card bomb-card' : 'card';
    d.dataset.id = c.id;
    // La carta regalo se ve igual tapada o destapada: violeta con su "+n".
    // Las cartas especiales (regalo y bomba) se ven igual tapadas o destapadas.
    d.innerHTML = c.pack
      ? `<div class="inner"><div class="face front"></div><div class="face back"></div></div><span class="pack-num">+${c.pack.length}</span>`
      : c.bomb
        ? `<div class="inner"><div class="face front"></div><div class="face back"></div></div><span class="bomb-face"><i></i><b></b></span>`
        : `<div class="inner">${faceHTML(c, E.rankOf(c, this.st))}<div class="face back"></div></div>` + marks(c);
    if (c.curtain != null) d.classList.add('curtain');
    d.style.zIndex = c.z * 100 + c.id;
    this.boardEl.append(d);
    c.el = d;
    this.place(c);
  }

  place(c) {
    const o = this.offsets[c.group];
    c.el.style.left = `${(o.x + c.x) * this.u}px`;
    c.el.style.top = `${(o.y + c.y) * this.u}px`;
    c.el.style.rotate = `${c.rot}deg`;
  }

  layout() {
    const r = this.wrapEl.getBoundingClientRect();
    if (!r.width) return;
    const { u, bw, bh, offsets } = packGroups(this.level.groups, r.width - 10, r.height - 10);
    this.u = Math.max(18, u);
    this.offsets = offsets;
    this.boardEl.style.width = `${bw * this.u}px`;
    this.boardEl.style.height = `${bh * this.u}px`;
    this.boardEl.style.setProperty('--cw', `${this.u}px`);
    this.cards.forEach((c) => c.el && this.place(c));
    this.renderStock();
    this.coach?.update();
  }

  // Pinta lo que depende del estado: boca arriba, candados, cortinas, hielo, bomba y carta viva.
  refresh() {
    const { level, st } = this;
    for (const c of this.cards) {
      if (c.removed || !c.el) continue;
      const el = c.el;
      if (!this.dealing) el.classList.toggle('up', E.faceUp(level, c, st));
      if (c.lock != null) el.classList.toggle('unlocked', E.lockOpen(level, c, st));
      if (c.curtain != null) el.classList.toggle('curtain-open', E.curtainOpen(level, c, st));
      if (c.ice) {
        const left = E.iceLeft(c, st);
        el.querySelector('.ice-ov b').textContent = left || '';
        el.classList.toggle('melted', !left);
      }
      if (c.bomb) {
        const left = E.bombLeft(c, st);
        el.querySelector('.bomb-face b').textContent = left == null ? '' : left;
        el.classList.toggle('bomb-hot', left != null && left <= 2);

      }
      if (c.live) {
        const r = E.rankOf(c, st);
        if (el.dataset.rank !== String(r)) {
          const old = el.dataset.rank;
          el.dataset.rank = r;
          // Solo cambia el número (la carta no se mueve): el viejo sale y el nuevo entra.
          const rk = el.querySelector('.front .rk');
          rk.textContent = RANKS[r];
          if (old != null && !reduced()) {
            const up = c.live > 0 ? 1 : -1;
            rk.animate([{ translate: `0 ${up * 40}%`, opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: 240, easing: 'ease-out' });
          }
        }
      }
    }
  }

  renderPiles() {
    this.renderStock();
    this.renderWaste();
  }

  // Mazo en abanico alineado a la derecha: la carta de la derecha es la siguiente que sale.
  // El ancho es fijo (según el mazo más grande que ha tenido), así robar no empuja la bandeja;
  // lo que se recorre es el manojo.
  renderStock() {
    const n = this.stock.length;
    const cw = this.stockEl.offsetHeight / 1.4 || 56;
    this.stockMax = Math.max(this.stockMax || 0, n, 1);
    const m = this.stockMax;
    const step = m > 1 ? Math.min(cw * 0.16, (cw * 1.6) / (m - 1)) : 0;
    const right = step * (m - 1);
    this.stockEl.style.width = `${cw + right}px`;
    const els = (this.stockEls ||= []);
    while (els.length > n) els.pop().remove();
    while (els.length < n) {
      const d = document.createElement('div');
      d.className = 'card';
      d.style.left = `${right}px`;
      d.innerHTML = inner({});
      this.stockEl.append(d);
      els.push(d);
    }
    // els[i] es stock[n - 1 - i]. Premios de racha: carta con reverso violeta, comodín dorado.
    els.forEach((d, i) => {
      const c = this.stock[n - 1 - i];
      d.style.left = `${right - (n - 1 - i) * step}px`;
      d.classList.toggle('gift-card', !!c?.reward && !c.wild);
      d.classList.toggle('gift-wild', !!c?.reward && !!c.wild);
    });
    this.stockEl.querySelector('.count, .empty-slot')?.remove();
    this.stockEl.insertAdjacentHTML('beforeend', n ? `<span class="badge count">${n}</span>` : `<div class="empty-slot">+5</div>`);
  }

  stockTop() {
    return this.stockEls?.[this.stockEls.length - 1] || this.stockEl;
  }

  // Carta suelta que vuela por encima de todo (del mazo, del comodín, de regreso al mazo).
  flyer(c, rect, up) {
    const f = document.createElement('div');
    f.className = `card flyer${up ? ' up' : ''}`;
    f.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;--cw:${rect.width}px;z-index:9999;pointer-events:none`;
    f.style.setProperty('--back', this.back);
    f.innerHTML = inner(c);
    document.body.append(f);
    return f;
  }

  renderWaste() {
    const top = this.st.top;
    this.wasteEl.innerHTML = top ? `<div class="card up">${inner({ ...top, arrow: top.arrow })}</div>` : '';
    this.wasteEl.classList.toggle('arrowed', !!top?.arrow);
  }

  landWaste() {
    this.renderWaste();
    squash(this.wasteEl.firstElementChild);
  }

  updateCounts() {
    this.el.querySelector('[data-n="undo"]').textContent = save.undo;
    this.el.querySelector('[data-n="wild"]').textContent = save.wild;
    updateCoins();
  }

  // Indicador de racha por puntos: del 1 al 6, luego hasta 9 y luego hasta 12 (después, tramos de 3).
  // Al final de los puntos se dibuja el premio del tramo (carta violeta, comodín dorado o estrella al inventario).
  showCombo() {
    const { at, kind } = E.nextReward(this.streak);
    const from = at <= 12 ? 0 : at - 3;
    let dots = '';
    for (let i = from + 1; i < at; i++) dots += `<i class="${i <= this.streak ? 'on' : ''}"></i>`;
    const prize = kind === 'bank' ? `<span class="prize bank">${star(true)}</span>` : `<span class="prize mini ${kind === 'wild' ? 'gift-wild' : 'gift-card'}"></span>`;
    this.comboEl.innerHTML = `<span class="dots">${from ? `<b>×${from}</b>` : ''}${dots}${prize}</span><small>${REWARD_TEXT[kind]}</small>`;
    this.comboEl.classList.toggle('hot', at - this.streak <= 1 && this.streak > 0);
  }

  showStreak(text) {
    this.showCombo();
    if (!text && this.streak < 2) return;
    this.streakEl.textContent = text || `Racha ×${this.streak}`;
    this.streakEl.classList.toggle('reward', !!text);
    this.streakEl.classList.remove('pop');
    void this.streakEl.offsetWidth;
    this.streakEl.classList.add('pop');
  }

  shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  }

  // ---------- Acciones ----------
  tapCard(id) {
    const c = this.cards[id];
    if (!c || c.removed) return;
    const { level, st } = this;
    if (c.pack || c.bomb) {
      buzz();
      if (c.pack) this.tell('pack', 'Destápala por completo y te regala cartas');
      else this.tell('bomb', 'Destápala antes de que llegue a 0 para desactivarla');
      return this.shake(c.el);
    }
    if (this.coach && !this.coach.allows(c)) return;
    if (E.playRank(level, c, st) == null) {
      buzz();
      if (E.faceUp(level, c, st)) {
        if (!E.lockOpen(level, c, st)) this.tell('lock', 'Juega la carta con la llave del mismo color');
        else if (E.iceLeft(c, st)) this.tell('ice', `Juega ${E.iceLeft(c, st)} carta(s) más para derretir el hielo`);
        else if (st.top?.arrow) this.tell('arrow', `La flecha pide un ${RANKS[E.mod13(st.top.rank + st.top.arrow)]}`);
      }
      return this.shake(c.el);
    }
    this.play(c);
  }

  // Avisos cortos, una vez por partida cada uno.
  tell(key, msg) {
    this.told ||= {};
    if (this.told[key]) return;
    this.told[key] = true;
    toast(msg);
  }

  play(c) {
    const before = this.st;
    const { s, ev } = E.play(this.level, before, c.id);
    const burnRects = this.burnRects(ev.boom);
    this.history.push({ t: 'play', before, ev, best: this.best, bonus: this.bonus });
    this.st = s;
    this.sync();
    this.best = Math.max(this.best, s.streak);
    this.bonus += s.streak;

    // Vuela de centro a centro dando una vuelta y se asienta al caer.
    const el = c.el;
    c.el = null;
    el.classList.remove('shake');
    el.getAnimations().forEach((a) => a.cancel());
    const [ax, ay] = center(el.getBoundingClientRect());
    const b = this.wasteEl.getBoundingClientRect();
    const [bx, by] = center(b);
    el.classList.add('up', 'flying');
    el.style.zIndex = 9999;
    el.style.rotate = '0deg';
    toss(el, { r0: c.rot }, { x1: bx - ax, y1: by - ay, s1: b.width / this.u }, 360).then(() => {
      el.remove();
      this.landWaste();
    });

    // Cartas regalo que quedaron destapadas, premio de racha y bombas.
    this.renderStock();
    for (const id of ev.packs) this.flyPack(this.cards[id]);
    for (const id of ev.defused) this.defuse(this.cards[id]);
    this.giveReward(ev.reward);
    this.burn(ev.boom, burnRects);

    this.refresh();
    this.save();
    this.checkEnd();
    this.coach?.after();
  }

  // Premio por racha (ver streakReward en engine.js). Deshacer la jugada lo quita.
  giveReward(r) {
    if (!r) return this.showStreak();
    if (r.kind === 'bank') {
      save.wild++;
      persist();
      this.updateCounts();
      squash(this.el.querySelector('.wild-card'));
    } else {
      this.flyReward(r.kind, this.stockEls[this.stockEls.length - 1 - r.pos]);
    }
    this.showStreak(`¡Racha ×${this.streak}! ${REWARD_TEXT[r.kind]}`);
  }

  // Dónde están ahora las cartas que una bomba va a quemar (las primeras del mazo, a la derecha).
  // skip: cartas de la derecha que ya no cuentan (al robar, la que se acaba de robar).
  burnRects(boom, skip = 0) {
    if (!boom?.length) return [];
    const n = boom.reduce((a, b) => a + b.burned.length, 0);
    const els = this.stockEls || [];
    return els.slice(Math.max(0, els.length - skip - n), els.length - skip).map((e) => e.getBoundingClientRect());
  }

  // Bomba destapada a tiempo: la mecha se apaga y la carta se encoge y desaparece.
  defuse(c) {
    const el = c.el;
    c.el = null;
    if (!el) return;
    el.classList.add('defused');
    toast('¡Bomba desactivada!');
    el.animate([{ scale: 1, opacity: 1 }, { scale: 1.15, opacity: 1, offset: 0.35 }, { scale: 0.3, opacity: 0 }], { duration: 520, easing: 'ease-in', fill: 'forwards' }).finished.then(() => el.remove());
  }

  // La bomba explota: baja volando hasta el mazo, estalla (destello y temblor) y las primeras cartas del mazo salen ardiendo.
  // `rects` son las posiciones de las cartas quemadas antes de quitarlas: se dejan "fantasmas" ahí hasta que estalla.
  burn(boom, rects) {
    if (!boom?.length) return;
    const ghosts = rects.map((a) => this.flyer({}, a, false));
    const target = this.stockEl.getBoundingClientRect();
    const [tx, ty] = center(target);
    const flights = boom.map((b) => {
      const c = this.cards[b.id];
      const el = c.el;
      c.el = null;
        if (!el || reduced()) {
        el?.remove();
        return Promise.resolve();
      }
      const [ax, ay] = center(el.getBoundingClientRect());
      el.style.zIndex = 9999;
      el.style.rotate = '0deg';
      return toss(el, { r0: c.rot }, { x1: tx - ax, y1: ty - ay - 20, s1: 1.2 }, 0).then(() => el.remove());
    });
    Promise.all(flights).then(() => {
      if (!reduced()) {
        const flash = document.createElement('div');
        flash.className = 'boom-flash';
        flash.style.cssText = `left:${tx}px;top:${ty}px`;
        document.body.append(flash);
        flash.animate([{ scale: 0.2, opacity: 1 }, { scale: 3.2, opacity: 0 }], { duration: 650, easing: 'ease-out', fill: 'forwards' }).finished.then(() => flash.remove());
        this.el.animate(
          [{ translate: '0 0' }, { translate: '-8px 4px' }, { translate: '7px -5px' }, { translate: '-5px 3px' }, { translate: '3px -2px' }, { translate: '0 0' }],
          { duration: 420, easing: 'ease-out' },
        );
      }
      buzz();
      toast(`¡Bum! La bomba quemó ${rects.length} carta${rects.length === 1 ? '' : 's'} de tu mazo`);
      ghosts.forEach((f, k) => {
        f.classList.add('burning');
        if (reduced()) return f.remove();
        f.animate(
          [
            { translate: '0 0', rotate: '0deg', scale: 1, opacity: 1 },
            { translate: `${(k - 1) * 20}px -40px`, rotate: `${(k - 1) * 15}deg`, scale: 1.25, opacity: 1, offset: 0.35 },
            { translate: `${(k - 1) * 60}px -170px`, rotate: `${(k - 1) * 45}deg`, scale: 0.6, opacity: 0 },
          ],
          { duration: 1000, easing: 'ease-out', fill: 'forwards', delay: k * 80 },
        ).finished.then(() => f.remove());
      });
    });
  }

  // Vuela a un hueco del mazo: la carta voladora llega justo encima de su lugar y ahí la releva
  // la carta real del mazo, que baja en su capa: así se ve cómo se mete detrás de las de enfrente.
  intoSlot(f, slot, x, y, spin) {
    const lift = (this.stockEl.offsetHeight || 60) * 0.75;
    return toss(f, {}, { x1: x, y1: y - lift }, spin).then(() => {
      f.remove();
      slot.style.opacity = '';
      return slot.animate([{ translate: `0 ${-lift}px` }, { translate: '0 0' }], { duration: 230, easing: 'cubic-bezier(0.5, 0, 0.75, 0)' }).finished;
    });
  }

  // El premio sale de los puntos de racha, se presume un momento y se mete en su hueco del mazo.
  flyReward(kind, slot) {
    if (!slot || reduced()) return squash(slot);
    const to = slot.getBoundingClientRect();
    const [px, py] = center((this.comboEl.querySelector('.prize') || this.comboEl).getBoundingClientRect());
    const f = this.flyer({}, { left: px - to.width / 2, top: py - (to.width * 1.4) / 2 + 30, width: to.width }, false);
    f.classList.add(kind === 'wild' ? 'gift-wild' : 'gift-card');
    slot.style.opacity = 0;
    f.animate(
      [
        { scale: 0.2, rotate: '-20deg', opacity: 0 },
        { scale: 1.5, rotate: '6deg', opacity: 1, offset: 0.6 },
        { scale: 1.35, rotate: '0deg', opacity: 1 },
      ],
      { duration: 380, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'forwards' },
    )
      .finished.then(() => new Promise((ok) => setTimeout(ok, 260)))
      .then(() => {
        const t = slot.getBoundingClientRect();
        return this.intoSlot(f, slot, t.left - parseFloat(f.style.left), t.top - parseFloat(f.style.top), 0);
      })
      .then(() => {
        squash(slot);
        const st = this.stockEl;
        st.animate([{ scale: 1 }, { scale: 1.06 }, { scale: 1 }], { duration: 260, easing: 'ease-out' });
      });
  }

  // Carta regalo: resalta en su sitio, sus cartas vuelan una por una al final del mazo y se desvanece.
  flyPack(c) {
    const el = c.el;
    c.el = null;
    const n = c.pack.length;
    this.renderStock();
    const slots = this.stockEls.slice(0, n); // las de la izquierda son el final del mazo
    if (reduced() || !el) {
      el?.remove();
      return slots.forEach((e) => squash(e));
    }
    slots.forEach((e) => (e.style.opacity = 0));
    this.busy = true;
    el.style.zIndex = 9000;
    // Se endereza y se levanta un poco antes de repartir.
    el.animate(
      [
        { rotate: `${c.rot}deg`, scale: 1, translate: '0 0' },
        { rotate: `${-6 * Math.sign(c.rot || 1)}deg`, scale: 1.32, translate: '0 -8px', offset: 0.55 },
        { rotate: '0deg', scale: 1.2, translate: '0 -6px' },
      ],
      { duration: 380, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)', fill: 'forwards' },
    );
    const from = () => el.getBoundingClientRect();
    const one = (k) => {
      const a = from();
      const slot = slots[n - 1 - k]; // la primera en salir queda más adentro del mazo
      const to = slot.getBoundingClientRect();
      const left = a.left + a.width / 2 - to.width / 2;
      const top = a.top + a.height / 2 - (to.width * 1.4) / 2;
      const f = this.flyer({}, { left, top, width: to.width }, false);
      return this.intoSlot(f, slot, to.left - left, to.top - top, 360).then(() => squash(slot));
    };
    const runs = slots.map((_, k) => new Promise((ok) => setTimeout(() => one(k).then(ok), 400 + k * 180)));
    Promise.all(runs).then(() => {
      el.animate([{ rotate: '0deg', scale: 1.2, opacity: 1 }, { rotate: '0deg', scale: 0.4, opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).finished.then(() => el.remove());
      if (!this.done) this.busy = false;
    });
  }

  // Deshacer una carta regalo: sus cartas salen del final del mazo y regresan a ella, que reaparece.
  // `rects` son las posiciones de esas cartas en el mazo antes de deshacer (el estado ya está restaurado).
  unflyPack(c, rects) {
    this.makeCardEl(c);
    const el = c.el;
    if (reduced()) return;
    el.style.opacity = 0;
    const b = el.getBoundingClientRect();
    const runs = rects.map((a, k) => {
      const f = this.flyer({}, a, false);
      return new Promise((ok) => setTimeout(ok, k * 90))
        .then(() => toss(f, {}, { x1: b.left + b.width / 2 - a.left - a.width / 2, y1: b.top + b.height / 2 - a.top - a.height / 2, s1: b.width / a.width }, 360))
        .then(() => f.remove());
    });
    Promise.all(runs).then(() => {
      el.style.opacity = '';
      el.animate([{ scale: 0.6 }, { scale: 1.2, offset: 0.6 }, { scale: 1 }], { duration: 320, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' });
    });
  }

  // Deshacer un premio de racha: la carta sale de su hueco del mazo y regresa a los puntos de racha.
  unflyReward(a, kind) {
    if (!a || reduced()) return;
    const f = this.flyer({}, a, false);
    f.classList.add(kind === 'wild' ? 'gift-wild' : 'gift-card');
    const [px, py] = center((this.comboEl.querySelector('.prize') || this.comboEl).getBoundingClientRect());
    toss(f, {}, { x1: px - a.left - a.width / 2, y1: py - a.top - a.height / 2, s1: 0.4 }, 360).then(() => f.remove());
  }

  // Deshacer una explosión: las cartas quemadas caen de vuelta al principio del mazo.
  unburn(boom) {
    const n = (boom || []).reduce((a, b) => a + b.burned.length, 0);
    if (!n || reduced()) return;
    this.stockEls.slice(-n).forEach((e, k) =>
      e.animate([{ translate: '0 -70px', opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: 320, delay: k * 70, easing: 'ease-in', fill: 'backwards' }),
    );
  }

  draw() {
    if (this.coach && !this.coach.allows('stock')) return;
    if (!this.stock.length) {
      if (this.hasMove()) {
        toast('¡Aún tienes jugadas!');
        return this.hint();
      }
      return this.stuck();
    }
    const missed = this.playable();
    const before = this.st;
    const { s, ev } = E.draw(this.level, before);
    this.history.push({ t: 'draw', before, ev, best: this.best, bonus: this.bonus });
    const a = this.stockTop().getBoundingClientRect();
    const burnRects = this.burnRects(ev.boom, 1);
    this.st = s;
    this.showCombo();
    this.flyFromStock(ev.card, a);
    this.burn(ev.boom, burnRects);
    this.refresh();
    if (missed.length) setTimeout(() => this.warnMissed(missed), FLY_MS);
    this.save();
    this.checkEnd();
    this.coach?.after();
  }

  // Robaste teniendo jugada: tiemblan las cartas que podías jugar y late el botón de deshacer.
  warnMissed(missed) {
    if (this.done) return;
    const els = missed.filter((c) => !c.removed && c.el).map((c) => c.el);
    if (!els.length) return;
    for (const el of els) {
      this.shake(el);
    }
    const u = this.el.querySelector('.undo-btn');
    u.classList.remove('nudge');
    void u.offsetWidth;
    u.classList.add('nudge');
  }

  flyFromStock(c, a) {
    const b = this.wasteEl.getBoundingClientRect();
    const f = this.flyer(c, { left: a.left, top: a.top, width: b.width }, false);
    // Quita la carta del mazo ya, pero deja el descarte viejo hasta que aterrice.
    this.renderStock();
    f.getBoundingClientRect();
    f.classList.add('up');
    toss(f, {}, { x1: b.left - a.left, y1: b.top - a.top }, 360).then(() => {
      f.remove();
      this.landWaste();
    });
  }

  // Deshacer una jugada: la carta sale del descarte y regresa volando a su lugar.
  returnToBoard(c, from) {
    this.makeCardEl(c);
    c.el.classList.add('up');
    const [ax, ay] = center(from);
    const [bx, by] = center(c.el.getBoundingClientRect());
    const el = c.el;
    el.style.rotate = '0deg';
    el.style.zIndex = 9999;
    toss(el, { x0: ax - bx, y0: ay - by, s0: from.width / this.u }, { r1: c.rot }, 360).then(() => {
      el.style.rotate = `${c.rot}deg`;
      el.style.zIndex = c.z * 100 + c.id;
      el.getAnimations().forEach((x) => x.cancel());
      squash(el);
    });
  }

  // Deshacer un robo: la carta regresa al mazo y se voltea.
  returnToStock(c, a) {
    const slot = this.stockTop();
    slot.style.opacity = 0;
    const f = this.flyer(c, a, true);
    const b = slot.getBoundingClientRect();
    f.getBoundingClientRect();
    f.classList.remove('up');
    toss(f, {}, { x1: b.left - a.left, y1: b.top - a.top }, 360).then(() => {
      f.remove();
      slot.style.opacity = '';
      squash(slot);
    });
  }

  // Deshacer el comodín: sale del descarte y regresa girando a su botón.
  returnWild(a) {
    const btn = this.el.querySelector('.wild-card');
    const b = btn.getBoundingClientRect();
    const f = this.flyer({ wild: true }, a, true);
    toss(f, {}, { x1: b.left + b.width / 2 - a.left - a.width / 2, y1: b.top + b.height / 2 - a.top - a.height / 2, s1: b.width / a.width }, 360).then(() => {
      f.remove();
      squash(btn);
    });
  }

  // Deshacer: se restaura el estado anterior completo y se anima al revés lo que pasó.
  undo() {
    if (this.coach) return;
    if (!this.history.length) return toast('Nada que deshacer');
    const inf = this.opts.dev?.infinite;
    if (save.undo <= 0 && !inf) return this.offerBuy('undo');
    if (!inf) save.undo--;
    const h = this.history.pop();
    const ev = h.ev || {};
    // Posiciones actuales (antes de restaurar) de lo que va a regresar.
    const wasteRect = this.wasteEl.getBoundingClientRect();
    const els = this.stockEls || [];
    const packRects = [];
    let left = 0;
    for (const id of ev.packs || []) {
      const n = this.cards[id].pack.length;
      packRects.push(els.slice(left, left + n).map((e) => e.getBoundingClientRect()));
      left += n;
    }
    const rewardRect = ev.reward && ev.reward.kind !== 'bank' ? els[els.length - 1 - ev.reward.pos]?.getBoundingClientRect() : null;

    this.st = h.before;
    this.best = h.best;
    this.bonus = h.bonus;
    this.sync();
    this.renderStock();
    this.renderWaste();

    if (h.t === 'play') {
      if (ev.reward?.kind === 'bank') save.wild = Math.max(0, save.wild - 1);
      this.unflyReward(rewardRect, ev.reward?.kind);
      (ev.packs || []).forEach((id, i) => this.unflyPack(this.cards[id], packRects[i]));
      this.returnToBoard(this.cards[ev.id], wasteRect);
    } else if (h.t === 'draw') {
      this.returnToStock(ev.card, wasteRect);
    } else if (h.t === 'wild') {
      this.returnWild(wasteRect);
      if (!inf) save.wild++;
    }
    // Bombas que se desactivaron o explotaron con esa acción vuelven al tablero.
    for (const id of [...(ev.defused || []), ...(ev.boom || []).map((b) => b.id)]) {
      const c = this.cards[id];
      if (c.el || c.removed) continue;
      this.makeCardEl(c);
      if (!reduced()) c.el.animate([{ scale: 0.4, opacity: 0 }, { scale: 1.15, opacity: 1, offset: 0.6 }, { scale: 1 }], { duration: 360, easing: 'ease-out' });
    }
    this.unburn(ev.boom);
    this.showCombo();
    persist();
    this.refresh();
    this.updateCounts();
    this.save();
  }

  useWild() {
    if (this.coach) return;
    if (this.st.top?.wild) return toast('Ya tienes un comodín en juego');
    if (save.wild <= 0 && !this.opts.dev?.infinite) return this.offerBuy('wild');
    if (!this.opts.dev?.infinite) save.wild--;
    persist();
    this.history.push({ t: 'wild', before: this.st, best: this.best, bonus: this.bonus });
    this.st = { ...E.cloneState(this.st), top: { wild: true } };
    const a = this.el.querySelector('.wild-card').getBoundingClientRect();
    const b = this.wasteEl.getBoundingClientRect();
    const f = this.flyer({ wild: true }, { left: a.left + (a.width - b.width) / 2, top: a.top + (a.height - b.height) / 2, width: b.width }, true);
    toss(f, {}, { x1: b.left - a.left - (a.width - b.width) / 2, y1: b.top - a.top - (a.height - b.height) / 2 }, 360).then(() => {
      f.remove();
      this.landWaste();
    });
    this.updateCounts();
    this.save();
  }

  playable() {
    return E.legal(this.level, this.st).map((c) => this.cards[c.id]);
  }

  hasMove() {
    return this.playable().length > 0;
  }

  hint() {
    const c = this.playable()[0];
    const target = c ? c.el : this.stock.length ? this.stockTop() : null;
    if (!target) return toast('Sin jugadas: usa un comodín o compra cartas');
    target.classList.remove('hint');
    void target.offsetWidth;
    target.classList.add('hint');
    setTimeout(() => target.classList.remove('hint'), 1300);
  }

  offerBuy(kind) {
    const cost = price(kind, save.next);
    const label = kind === 'wild' ? '1 comodín ★' : '3 deshacer ↶';
    this.modalOpen = true;
    openModal({
      title: kind === 'wild' ? 'Sin comodines' : 'Sin deshacer',
      body: `<p>¿Comprar ${label} por ${coin()} ${cost}?</p>`,
      onClose: () => (this.modalOpen = false),
      buttons: [
        {
          label: `Comprar · ${coin()} ${cost}`,
          disabled: save.coins < cost,
          onClick: () => {
            save.coins -= cost;
            if (kind === 'wild') save.wild += 1;
            else save.undo += 3;
            persist();
            this.updateCounts();
          },
        },
        { label: 'Ahora no', cls: 'ghost' },
      ],
    });
  }

  // +5 cartas compradas: van al final del mazo y también a los estados guardados para deshacer
  // (deshacer nunca quita lo que se compró).
  addExtra() {
    this.extras++;
    const free = this.cards.filter((c) => E.isOpen(this.level, c, this.st));
    const add = [];
    for (let i = 0; i < 5; i++) {
      const f = free[i % Math.max(1, free.length)];
      const rank = f ? (E.rankOf(f, this.st) + (Math.random() < 0.5 ? 1 : 12)) % 13 : Math.floor(Math.random() * 13);
      add.push({ rank, suit: Math.floor(Math.random() * 4) });
    }
    this.st = E.cloneState(this.st);
    this.st.stock.push(...add);
    for (const h of this.history) h.before = { ...h.before, stock: [...h.before.stock, ...add] };
    this.renderPiles();
    this.save();
    toast('+5 cartas al mazo');
  }

  checkEnd() {
    if (E.won(this.st)) return this.win();
    if (!this.stock.length && !this.hasMove()) setTimeout(() => this.stuck(), 450);
  }

  stuck() {
    if (this.done || this.modalOpen || this.stock.length || this.hasMove()) return;
    this.modalOpen = true;
    const left = this.cards.filter((c) => !c.removed).length;
    const inf = this.opts.dev?.infinite;
    openModal({
      title: '¡Sin movimientos!',
      body: `<p>Quedan <b>${left}</b> cartas en el tablero.</p>`,
      onClose: () => (this.modalOpen = false),
      buttons: [
        {
          label: `+5 cartas · ${coin()} ${price('extra')}`,
          disabled: save.coins < price('extra') && !inf,
          onClick: () => {
            if (!inf) save.coins -= price('extra');
            persist();
            updateCoins();
            this.addExtra();
          },
        },
        (save.wild > 0 || inf) && { label: `${star(true)} Usar comodín (${save.wild})`, onClick: () => this.useWild() },
        this.history.length && (save.undo > 0 || inf) && { label: `Deshacer ↶ (${save.undo})`, cls: 'ghost', onClick: () => this.undo() },
        { label: this.opts.free ? 'Reintentar' : 'Reintentar (nuevo boleto)', cls: 'ghost', onClick: () => this.opts.onRetry() },
        { label: 'Abandonar', cls: 'ghost', onClick: () => this.opts.onAbandon() },
      ].filter(Boolean),
    });
  }

  win() {
    this.done = true;
    this.coach?.end();
    const left = this.stock.length;
    // 3★ = terminar con el margen que da el nivel (máximo 2 cartas); los jefes dan menos margen.
    const full = Math.min(2, this.level.meta.spares);
    let stars = left >= full ? 3 : left >= 1 ? 2 : 1;
    if (this.extras) stars = 1;
    const { coins, tickets, prev, gold } = this.opts.onWin(stars);
    const cost = this.opts.nextCost;
    setTimeout(() => {
      confetti();
      openModal({
        title: this.level.boss ? `¡Jefe derrotado! ${icon('crown', '#ffe46b', '#f5a712')}` : '¡Nivel completado!',
        body: `<div class="big-stars">${starsHTML(stars)}</div>
          <ul class="summary">
            <li><span>Cartas sobrantes</span><b>${left}</b></li>
            <li><span>Racha máxima</span><b>×${this.best}</b></li>
            ${tickets ? `<li><span>Boleto de regalo</span><b>+${tickets} ${icon('ticket', '#ffd0e6', '#ff7fb6')}</b></li>` : ''}
            ${gold ? `<li class="gold"><span>Boleto dorado</span><b>+1 ${icon('ticket', '#ffe680', '#f5a91c')}</b></li>` : ''}
            <li class="total"><span>Monedas</span><b>${coins ? `+${coin()} ${coins}` : '—'}</b></li>
          </ul>${!coins && prev >= 3 ? '<p class="note">Ya cobraste las 3 estrellas de este nivel.</p>' : stars > prev && prev ? '<p class="note">¡Nuevo récord de estrellas!</p>' : ''}`,
        buttons: [
          { label: `Siguiente ▶${cost ? ` · ${cost} ${icon('ticket', '#7a4a00', '#5a3500')}` : ''}`, onClick: () => this.opts.onNext() },
          { label: 'Repetir', cls: 'ghost', onClick: () => this.opts.onRetry() },
          { label: 'Mapa', cls: 'ghost', onClick: () => this.opts.onExit() },
        ],
      });
    }, 450);
  }

  // Nivel nuevo: salir guarda la partida (al volver sigues donde ibas) o la abandonas.
  // Repetición: salir pierde el intento.
  exit() {
    if (this.modalOpen) return;
    const lost = this.opts.free ? '<p>Se pierde este intento.</p>' : '<p>Pierdes el boleto y lo que gastaste en este intento.</p>';
    if (this.opts.saved) {
      openModal({
        title: 'Pausa',
        body: '<p>Tu partida se guarda: al volver sigues donde te quedaste. Mientras, no puedes jugar otros niveles.</p>',
        buttons: [
          { label: 'Seguir jugando' },
          { label: 'Guardar y salir', cls: 'ghost', onClick: () => this.opts.onExit() },
          {
            label: 'Abandonar nivel',
            cls: 'ghost danger',
            onClick: () =>
              openModal({
                title: '¿Abandonar?',
                body: lost,
                buttons: [{ label: 'Seguir jugando' }, { label: 'Abandonar', cls: 'ghost danger', onClick: () => this.opts.onAbandon() }],
              }),
          },
        ],
      });
      return;
    }
    if (!this.history.length && !this.opts.dev) return this.opts.onAbandon();
    openModal({
      title: '¿Salir del nivel?',
      body: lost,
      buttons: [
        { label: 'Seguir jugando' },
        { label: 'Salir', cls: 'ghost danger', onClick: () => this.opts.onAbandon() },
      ],
    });
  }

  // ---------- Modo dev (ver js/dev.js) ----------
  solveHere() {
    return E.solve(this.level, this.st);
  }

  devReveal(on) {
    this.boardEl.classList.toggle('reveal', on);
  }

  // Numera las cartas en el orden de una solución desde el estado actual.
  devSolution() {
    this.boardEl.querySelectorAll('.dev-num').forEach((e) => e.remove());
    const path = this.solveHere();
    if (!path) return toast('Sin solución desde aquí: deshaz algo');
    let k = 0;
    for (const m of path) if (m !== 'draw') this.cards[m].el?.insertAdjacentHTML('beforeend', `<span class="dev-num">${++k}</span>`);
    toast(`Solución: ${k} jugadas y ${path.length - k} robos`);
  }

  devStep() {
    if (this.done) return false;
    if (this.busy) return true; // animación en curso (barajeo o carta regalo): esperar

    const path = this.solveHere();
    if (!path) {
      toast('Sin solución desde aquí: deshaz algo');
      return false;
    }
    this.boardEl.querySelectorAll('.dev-num').forEach((e) => e.remove());
    if (path[0] === 'draw') this.draw();
    else this.play(this.cards[path[0]]);
    return true;
  }

  async devAuto() {
    if (this.autoplay) return (this.autoplay = false);
    this.autoplay = true;
    while (this.autoplay && !this.done && this.devStep()) await new Promise((r) => setTimeout(r, 220));
    this.autoplay = false;
  }

  devWin() {
    this.st = { ...E.cloneState(this.st), rem: this.st.rem.map(() => true) };
    for (const c of this.cards) {
        c.removed = true;
      c.el?.remove();
      c.el = null;
    }
    this.refresh();
    this.win();
  }
}
