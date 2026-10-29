import { save, persist } from './storage.js';
import { openModal, toast, confetti, updateCoins, starsHTML } from './ui.js';
import { worldInfo, canFollow, packGroups, solve } from './levels.js';
import { cardBack, svgUrl, icon, star, coin, placeIcon, lockIcon, keyIcon } from './lowpoly.js';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const COST = { extra: 150, wild: 250, undo: 50 };
const STREAK_REWARD = 10; // cada 10 de racha: +1 comodín
const LOCK_HUES = [350, 45, 200]; // color de cada pareja candado/llave
const FLY_MS = 400;
const FLY_EASE = 'cubic-bezier(0.33, 0.6, 0.35, 1)';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const buzz = () => navigator.vibrate?.(30);

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
    this.modalOpen = false;

    this.el = this.build();
    root.append(this.el);
    this.onResize = () => this.layout();
    window.addEventListener('resize', this.onResize);
    this.onKey = (e) => this.key(e);
    window.addEventListener('keydown', this.onKey);
    this.layout();
    this.cards.forEach((c, i) => this.makeCardEl(c, i));
    this.renderPiles();
    this.updateCounts();
    setTimeout(() => this.refresh(), 300 + this.cards.length * 18);
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKey);
    this.done = true;
  }

  // Teclado (PC): espacio roba, Z deshace, C comodín, Esc sale.
  key(e) {
    if (this.done || e.repeat || e.metaKey || e.ctrlKey || document.querySelector('.modal-back')) return;
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
      <div class="progress"><div class="bar"></div></div>
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
    // Cartas y mazo responden al apoyar el dedo, no al soltarlo.
    el.addEventListener('pointerdown', (e) => {
      if (this.done || e.button > 0) return;
      const cardEl = e.target.closest('.board .card');
      if (cardEl) return this.tapCard(+cardEl.dataset.id);
      if (e.target.closest('.stock')) this.draw();
    });
    el.addEventListener('click', (e) => {
      if (this.done) return;
      const a = e.target.closest('button[data-a]')?.dataset.a;
      const actions = {
        exit: () => this.exit(),
        undo: () => this.undo(),
        wild: () => this.useWild(),
      };
      actions[a]?.();
    });
    return el;
  }

  // ---------- Render ----------
  makeCardEl(c, dealIndex) {
    const d = document.createElement('div');
    d.className = 'card';
    d.dataset.id = c.id;
    d.innerHTML = inner(c) + marks(c);
    d.style.zIndex = c.z * 100 + c.id;
    if (dealIndex != null) {
      d.classList.add('deal');
      d.style.animationDelay = `${dealIndex * 18}ms`;
      d.addEventListener('animationend', () => d.classList.remove('deal'), { once: true });
    }
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
    for (const c of this.cards) {
      if (c.removed || !c.el) continue;
      c.el.classList.toggle('up', this.isFree(c));
      if (c.lock != null) {
        c.el.classList.toggle('unlocked', !this.isLocked(c));
      }
    }
    const gone = this.cards.filter((c) => c.removed).length;
    this.el.querySelector('.bar').style.width = `${(gone / this.cards.length) * 100}%`;
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
    els.forEach((d, i) => (d.style.left = `${right - (n - 1 - i) * step}px`));
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

  showStreak() {
    if (this.streak < 2) return;
    this.streakEl.textContent = `Racha ×${this.streak}`;
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
    const h = { t: 'play', id: c.id, streak: this.streak, bonus: this.bonus, granted: false };
    c.removed = true;
    this.waste.push({ rank: c.rank, suit: c.suit });
    this.streak++;
    this.best = Math.max(this.best, this.streak);
    this.bonus += this.streak;
    if (this.streak % STREAK_REWARD === 0) {
      save.wild++;
      persist();
      h.granted = true;
      toast(`¡Racha ×${this.streak}! +1 comodín ★`);
      this.updateCounts();
    }
    this.history.push(h);
    this.showStreak();

    const el = c.el;
    c.el = null;
    // Vuela de centro a centro en arco y aterriza con rebote.
    el.classList.remove('deal', 'shake');
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
    this.checkEnd();
  }

  draw() {
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
    this.waste.push(c);
    this.flyFromStock(c);
    if (missed.length) setTimeout(() => this.warnMissed(missed), FLY_MS);
    this.checkEnd();
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
    toss(f, {}, { x1: b.left - a.left, y1: b.top - a.top }, 0).then(() => {
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
    toss(el, { x0: ax - bx, y0: ay - by, s0: from.width / this.u }, { r1: c.rot }).then(() => {
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
    toss(f, {}, { x1: b.right - a.width - a.left, y1: b.top - a.top }, 0).then(() => {
      f.remove();
      this.renderStock();
      squash(this.stockTop());
    });
  }

  undo() {
    if (!this.history.length) return toast('Nada que deshacer');
    if (save.undo <= 0) return this.offerBuy('undo');
    if (!this.opts.dev?.infinite) save.undo--;
    const h = this.history.pop();
    if (h.t === 'play') {
      const c = this.cards[h.id];
      c.removed = false;
      this.returnToBoard(c);
      if (h.granted) save.wild = Math.max(0, save.wild - 1);
    } else if (h.t === 'draw') {
      this.returnToStock();
    } else if (h.t === 'wild') {
      this.waste.pop();
      this.renderWaste();
      save.wild++;
    }
    this.streak = h.streak;
    this.bonus = h.bonus;
    persist();
    this.refresh();
    this.updateCounts();
  }

  useWild() {
    if (this.waste[this.waste.length - 1]?.wild) return toast('Ya tienes un comodín en juego');
    if (save.wild <= 0) return this.offerBuy('wild');
    if (!this.opts.dev?.infinite) save.wild--;
    persist();
    this.history.push({ t: 'wild', streak: this.streak, bonus: this.bonus });
    this.waste.push({ wild: true });
    const a = this.el.querySelector('.wild-card').getBoundingClientRect();
    const b = this.wasteEl.getBoundingClientRect();
    const f = this.flyer({ wild: true }, { left: a.left + (a.width - b.width) / 2, top: a.top + (a.height - b.height) / 2, width: b.width }, true);
    toss(f, {}, { x1: b.left - a.left - (a.width - b.width) / 2, y1: b.top - a.top - (a.height - b.height) / 2 }).then(() => {
      f.remove();
      this.landWaste();
    });
    this.updateCounts();
  }

  playable() {
    return this.cards.filter((c) => !c.removed && this.isFree(c) && !this.isLocked(c) && this.canPlay(c));
  }

  hasMove() {
    return this.playable().length > 0;
  }

  hint(quiet = false) {
    const c = this.playable()[0];
    const target = c ? c.el : this.stock.length ? this.stockTop() : null;
    if (!target) return quiet || toast('Sin jugadas: usa un comodín o compra cartas');
    target.classList.remove('hint');
    void target.offsetWidth;
    target.classList.add('hint');
    setTimeout(() => target.classList.remove('hint'), 1300);
  }

  offerBuy(kind) {
    const price = COST[kind];
    const label = kind === 'wild' ? '1 comodín ★' : '3 deshacer ↶';
    this.modalOpen = true;
    openModal({
      title: kind === 'wild' ? 'Sin comodines' : 'Sin deshacer',
      body: `<p>¿Comprar ${label} por ${coin()} ${price}?</p>`,
      onClose: () => (this.modalOpen = false),
      buttons: [
        {
          label: `Comprar · ${coin()} ${price}`,
          disabled: save.coins < price,
          onClick: () => {
            save.coins -= price;
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
    openModal({
      title: '¡Sin movimientos!',
      body: `<p>Quedan <b>${left}</b> cartas en el tablero.</p>`,
      onClose: () => (this.modalOpen = false),
      buttons: [
        {
          label: `+5 cartas · ${coin()} ${COST.extra}`,
          disabled: save.coins < COST.extra,
          onClick: () => {
            save.coins -= COST.extra;
            persist();
            updateCoins();
            this.addExtra();
          },
        },
        save.wild > 0 && { label: `${star(true)} Usar comodín (${save.wild})`, onClick: () => this.useWild() },
        this.history.length && save.undo > 0 && { label: `Deshacer ↶ (${save.undo})`, cls: 'ghost', onClick: () => this.undo() },
        { label: 'Reintentar', cls: 'ghost', onClick: () => this.opts.onRetry() },
        { label: 'Salir', cls: 'ghost', onClick: () => this.opts.onExit() },
      ].filter(Boolean),
    });
  }

  win() {
    this.done = true;
    const left = this.stock.length;
    // 3★ = terminar con el margen que da el nivel (máximo 2 cartas); los jefes dan menos margen.
    const full = Math.min(2, this.level.meta.spares);
    let stars = left >= full ? 3 : left >= 1 ? 2 : 1;
    if (this.extras) stars = 1;
    const coins = 20 + left * 10 + Math.floor(this.bonus / 3) + (this.level.boss ? 30 : 0);
    const prev = save.stars[this.level.g] || 0;
    this.opts.onWin(stars, coins);
    setTimeout(() => {
      confetti();
      openModal({
        title: this.level.boss ? `¡Jefe derrotado! ${icon('crown', '#ffe46b', '#f5a712')}` : '¡Nivel completado!',
        body: `<div class="big-stars">${starsHTML(stars)}</div>
          <ul class="summary">
            <li><span>Cartas sobrantes</span><b>${left} × 10</b></li>
            <li><span>Racha máxima</span><b>×${this.best}</b></li>
            <li class="total"><span>Monedas</span><b>+${coin()} ${coins}</b></li>
          </ul>${stars > prev && prev ? '<p class="note">¡Nuevo récord de estrellas!</p>' : ''}`,
        buttons: [
          { label: 'Siguiente ▶', onClick: () => this.opts.onNext() },
          { label: 'Repetir', cls: 'ghost', onClick: () => this.opts.onRetry() },
          { label: 'Mapa', cls: 'ghost', onClick: () => this.opts.onExit() },
        ],
      });
    }, 450);
  }

  exit() {
    if (!this.history.length) return this.opts.onExit();
    openModal({
      title: '¿Salir del nivel?',
      body: '<p>Perderás el progreso de esta partida.</p>',
      buttons: [
        { label: 'Salir', onClick: () => this.opts.onExit() },
        { label: 'Seguir jugando', cls: 'ghost' },
      ],
    });
  }

  // ---------- Modo dev (ver js/dev.js) ----------
  solveHere() {
    return solve(this.level, this.cards.map((c) => c.removed), this.stock, this.waste[this.waste.length - 1]);
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
