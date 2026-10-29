import { save, persist } from './storage.js';
import { openModal, toast, confetti, updateCoins, starsHTML } from './ui.js';
import { worldInfo, canFollow, packGroups, solve, applyReward, nextReward, activatePacks } from './levels.js';
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

export function faceHTML(c) {
  if (c.wild) return `<div class="face front wild">${star(true)}</div>`;
  if (c.rank == null) return '';
  const s = SUITS[c.suit];
  const red = c.suit === 1 || c.suit === 2 ? ' red' : '';
  return `<div class="face front${red}"><span class="rk">${RANKS[c.rank]}</span><span class="st">${s}</span><span class="big">${s}</span></div>`;
}
const inner = (c) => `<div class="inner">${faceHTML(c)}<div class="face back"></div></div>`;
// Marcas que se ven aunque la carta esté boca abajo, para poder planear.
const marks = (c) =>
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
    this.stock = level.stock.map((c) => ({ ...c }));
    this.waste = [{ ...level.waste0 }];
    this.history = [];
    this.streak = 0;
    this.best = 0;
    this.bonus = 0;
    this.extras = 0;
    this.done = false;
    this.busy = true; // mientras hay una animación que bloquea (barajeo, carta regalo) no se puede tocar
    this.dealing = true; // durante el barajeo las cartas no se voltean
    this.modalOpen = false;
    if (opts.resume) this.restore(opts.resume);

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
    this.intro().then(() => {
      if (this.done) return;
      this.busy = false;
      this.dealing = false;
      this.refresh();
      if (opts.tutorial) this.coach = new Coach(this);
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
    return {
      removed: this.cards.map((c) => c.removed),
      stock: this.stock,
      waste: this.waste,
      history: this.history,
      streak: this.streak,
      best: this.best,
      bonus: this.bonus,
      extras: this.extras,
      stockMax: this.stockMax,
    };
  }

  restore(s) {
    s.removed.forEach((r, i) => (this.cards[i].removed = r));
    Object.assign(this, {
      stock: s.stock,
      waste: s.waste,
      history: s.history,
      streak: s.streak,
      best: s.best,
      bonus: s.bonus,
      extras: s.extras,
      stockMax: s.stockMax,
    });
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
    const live = this.cards.filter((c) => c.el);
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

  // ---------- Render ----------
  makeCardEl(c) {
    const d = document.createElement('div');
    d.className = c.pack ? 'card pack-card' : 'card';
    d.dataset.id = c.id;
    // La carta regalo se ve igual tapada o destapada: violeta con su "+n".
    d.innerHTML = c.pack ? `<div class="inner"><div class="face front"></div><div class="face back"></div></div><span class="pack-num">+${c.pack.length}</span>` : inner(c) + marks(c);
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

  isFree(c) {
    return c.coveredBy.every((j) => this.cards[j].removed);
  }

  isLocked(c) {
    return c.lock != null && !this.cards[this.level.keys[c.lock]].removed;
  }

  canPlay(c) {
    const top = this.waste[this.waste.length - 1];
    return !!top && canFollow(top, c.rank);
  }

  refresh() {
    if (!this.dealing) {
      for (const c of this.cards) {
        if (c.removed || !c.el) continue;
        c.el.classList.toggle('up', this.isFree(c));
        if (c.lock != null) c.el.classList.toggle('unlocked', !this.isLocked(c));
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
    const top = this.waste[this.waste.length - 1];
    this.wasteEl.innerHTML = top ? `<div class="card up">${inner(top)}</div>` : '';
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
    const { at, kind } = nextReward(this.streak);
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
    if (c.pack) {
      buzz();
      if (!this.packTold) {
        this.packTold = true;
        toast('Destápala por completo y te regala cartas');
      }
      return this.shake(c.el);
    }
    if (this.coach && !this.coach.allows(c)) return;
    if (!this.isFree(c) || !this.canPlay(c) || this.isLocked(c)) {
      buzz();
      if (this.isFree(c) && this.isLocked(c) && !this.lockTold) {
        this.lockTold = true;
        toast('Juega la carta con la llave del mismo color');
      }
      return this.shake(c.el);
    }
    this.play(c);
  }

  play(c) {
    const h = { t: 'play', id: c.id, streak: this.streak, bonus: this.bonus, reward: null };
    c.removed = true;
    this.waste.push({ rank: c.rank, suit: c.suit });
    this.streak++;
    this.best = Math.max(this.best, this.streak);
    this.bonus += this.streak;
    this.history.push(h);
    // Cartas regalo que quedaron destapadas: se activan solas y mandan sus cartas al final del mazo
    // (antes del premio de racha, igual que en el solucionador).
    const rm = this.cards.map((x) => x.removed);
    h.packs = activatePacks(this.level, rm, this.stock);
    for (const id of h.packs) this.cards[id].removed = true;
    this.giveReward(h);
    for (const id of h.packs) this.flyPack(this.cards[id]);

    const el = c.el;
    c.el = null;
    // Vuela de centro a centro dando una vuelta y se asienta al caer.
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

    this.refresh();
    this.save();
    this.checkEnd();
    this.coach?.after();
  }

  // Premio por racha (ver streakReward en levels.js). Deshacer la jugada lo quita.
  giveReward(h) {
    const r = applyReward(this.level, this.cards.map((c) => c.removed), this.stock, this.streak);
    if (!r) return this.showStreak();
    h.reward = r.kind;
    h.rewardAt = r.pos;
    if (r.kind === 'bank') {
      save.wild++;
      persist();
      this.updateCounts();
      squash(this.el.querySelector('.wild-card'));
    } else {
      this.renderStock();
      this.flyReward(r.kind, this.stockEls[this.stockEls.length - 1 - r.pos]);
    }
    this.showStreak(`¡Racha ×${this.streak}! ${REWARD_TEXT[r.kind]}`);
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
  unflyPack(c) {
    const n = c.pack.length;
    const slots = this.stockEls.slice(0, n).map((e) => e.getBoundingClientRect());
    this.stock.splice(this.stock.length - n, n);
    c.removed = false;
    this.makeCardEl(c);
    this.renderStock();
    const el = c.el;
    if (reduced()) return;
    el.style.opacity = 0;
    const b = el.getBoundingClientRect();
    const runs = slots.map((a, k) => {
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
  unflyReward(pos) {
    const slot = this.stockEls[this.stockEls.length - 1 - pos];
    const a = slot?.getBoundingClientRect();
    const kind = this.stock[pos]?.wild ? 'gift-wild' : 'gift-card';
    this.stock.splice(pos, 1);
    this.renderStock();
    if (!a || reduced()) return;
    const f = this.flyer({}, a, false);
    f.classList.add(kind);
    const [px, py] = center((this.comboEl.querySelector('.prize') || this.comboEl).getBoundingClientRect());
    toss(f, {}, { x1: px - a.left - a.width / 2, y1: py - a.top - a.height / 2, s1: 0.4 }, 360).then(() => f.remove());
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
    const c = this.stock.shift();
    this.history.push({ t: 'draw', streak: this.streak, bonus: this.bonus });
    this.streak = 0;
    this.showCombo();
    this.waste.push(c);
    this.flyFromStock(c);
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

  flyFromStock(c) {
    const a = this.stockTop().getBoundingClientRect();
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
  returnToBoard(c) {
    const from = this.wasteEl.getBoundingClientRect();
    this.waste.pop();
    this.renderWaste();
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
  returnToStock() {
    const c = this.waste.pop();
    const a = this.wasteEl.getBoundingClientRect();
    this.renderWaste();
    this.stock.unshift(c);
    const f = this.flyer(c, a, true);
    const b = this.stockEl.getBoundingClientRect();
    f.getBoundingClientRect();
    f.classList.remove('up');
    toss(f, {}, { x1: b.right - a.width - a.left, y1: b.top - a.top }, 360).then(() => {
      f.remove();
      this.renderStock();
      squash(this.stockTop());
    });
  }

  // Deshacer el comodín: sale del descarte y regresa girando a su botón.
  returnWild() {
    const a = this.wasteEl.getBoundingClientRect();
    this.waste.pop();
    this.renderWaste();
    const btn = this.el.querySelector('.wild-card');
    const b = btn.getBoundingClientRect();
    const f = this.flyer({ wild: true }, a, true);
    toss(f, {}, { x1: b.left + b.width / 2 - a.left - a.width / 2, y1: b.top + b.height / 2 - a.top - a.height / 2, s1: b.width / a.width }, 360).then(() => {
      f.remove();
      squash(btn);
    });
  }

  undo() {
    if (this.coach) return;
    if (!this.history.length) return toast('Nada que deshacer');
    if (save.undo <= 0 && !this.opts.dev?.infinite) return this.offerBuy('undo');
    if (!this.opts.dev?.infinite) save.undo--;
    const h = this.history.pop();
    if (h.t === 'play') {
      // El premio de esa jugada se devuelve. Si era carta sigue en el mismo lugar del mazo:
      // el historial es una pila, así que los robos posteriores ya se deshicieron.
      if (h.reward === 'bank') save.wild = Math.max(0, save.wild - 1);
      else if (h.reward) this.unflyReward(h.rewardAt ?? 0);
      for (const id of (h.packs || []).slice().reverse()) this.unflyPack(this.cards[id]);
      const c = this.cards[h.id];
      c.removed = false;
      this.returnToBoard(c);
      this.renderStock();
    } else if (h.t === 'draw') {
      this.returnToStock();
    } else if (h.t === 'wild') {
      this.returnWild();
      if (!this.opts.dev?.infinite) save.wild++;
    }
    this.streak = h.streak;
    this.bonus = h.bonus;
    this.showCombo();
    persist();
    this.refresh();
    this.updateCounts();
    this.save();
  }

  useWild() {
    if (this.coach) return;
    if (this.waste[this.waste.length - 1]?.wild) return toast('Ya tienes un comodín en juego');
    if (save.wild <= 0 && !this.opts.dev?.infinite) return this.offerBuy('wild');
    if (!this.opts.dev?.infinite) save.wild--;
    persist();
    this.history.push({ t: 'wild', streak: this.streak, bonus: this.bonus });
    this.waste.push({ wild: true });
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
    return this.cards.filter((c) => !c.removed && !c.pack && this.isFree(c) && !this.isLocked(c) && this.canPlay(c));
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

  addExtra() {
    this.extras++;
    const free = this.cards.filter((c) => !c.removed && this.isFree(c) && !this.isLocked(c));
    for (let i = 0; i < 5; i++) {
      const f = free[i % Math.max(1, free.length)];
      const rank = f ? (f.rank + (Math.random() < 0.5 ? 1 : 12)) % 13 : Math.floor(Math.random() * 13);
      this.stock.push({ rank, suit: Math.floor(Math.random() * 4) });
    }
    this.renderPiles();
    this.save();
    toast('+5 cartas al mazo');
  }

  checkEnd() {
    if (this.cards.every((c) => c.removed)) return this.win();
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
    const { coins, tickets, prev } = this.opts.onWin(stars);
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
    return solve(this.level, this.cards.map((c) => c.removed), this.stock, this.waste[this.waste.length - 1], this.streak);
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
    for (const c of this.cards) {
      if (c.removed) continue;
      c.removed = true;
      c.el?.remove();
      c.el = null;
    }
    this.refresh();
    this.win();
  }
}
