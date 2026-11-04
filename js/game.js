import { save, persist } from './storage.js';
import { openModal, toast, confetti, updateCoins, money, starsHTML, reduced, buzz, sparkle, wait, spendFromWallet, balloons, lootBubbles, rachaWarnHTML } from './ui.js';
import { worldInfo, packGroups, MECH_NAMES, LEVELS_PER_WORLD, scrollStrip, scrollSpan, scrollCover, SCROLL_VIEW, NEB_SLOTS, GRAV_SHOWN, W } from './levels.js';
import * as E from './engine.js';
import { price } from './economy.js';
import { cardBackURL, icon, star, coin, lockIcon, keyIcon, arrowIcon, curtainIcon, suitSVG, avatarHTML } from './art.js';
import { tableHTML } from './biomes.js';
import { Coach } from './coach.js';

const SUITS = ['s', 'h', 'd', 'c'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const LOCK_HUES = [350, 45, 200]; // color de cada pareja candado/llave
const FLY_MS = 400;
const FLY_EASE = 'cubic-bezier(0.33, 0.6, 0.35, 1)';
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
// Cara: número en la esquina, palo arriba a la derecha y el número grande al centro.
export function faceHTML(c, rank = c.rank) {
  if (c.wild) return `<div class="face front wild">${icon('wild')}</div>`;
  if (rank == null) return '';
  const s = suitSVG(SUITS[c.suit]);
  const red = c.suit === 1 || c.suit === 2 ? ' red' : '';
  const arrow = c.arrow ? `<span class="arrow-badge">${arrowIcon(c.arrow > 0)}</span>` : '';
  // Carta doble: los dos números ("5/8").
  if (c.alt != null) return `<div class="face front double${red}"><span class="cs">${s}</span><span class="dbl"><b>${RANKS[c.rank]}</b><i></i><b>${RANKS[c.alt]}</b></span></div>`;
  const r = RANKS[rank];
  // Carta viva: en la esquina va la flecha de hacia dónde cambia (el número está al centro).
  const corner = c.live ? `<span class="rk dir">${LIVE_DIR[c.live > 0 ? 'up' : 'down']}</span>` : `<span class="rk">${r}</span>`;
  const kind = c.live ? ' live' : c.arrow ? ' arrowed' : '';
  return `<div class="face front${red}${kind}">${corner}<span class="cs">${s}</span><span class="big${r === '10' ? ' ten' : ''}">${r}</span>${arrow}</div>`;
}
const LIVE_DIR = {
  up: '<svg viewBox="0 0 24 24"><path d="M12 20V5M5 11.5 12 4.5l7 7" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 4v15M5 12.5l7 7 7-7" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
// Reverso. La cortina es un telón de verdad (dos cortinas y su galería) que se recoge al abrirse.
export const backHTML = (c) => `<div class="face back">${c.curtain != null ? '<i class="drape l"></i><i class="drape r"></i><i class="valance"></i>' : ''}</div>`;
const inner = (c) => `<div class="inner">${faceHTML(c)}${backHTML(c)}</div>`;
// Marcas que se ven aunque la carta esté boca abajo, para poder planear.
const marks = (c) =>
  (c.ice ? `<span class="ice-ov"><b></b></span>` : '') +
  (c.curtainKey != null ? `<span class="curtain-mark">${curtainIcon()}</span>` : '') +
  (c.key != null ? `<span class="key-mark">${keyIcon(LOCK_HUES[c.key])}</span>` : '') +
  (c.lock != null ? `<span class="lock-ov">${lockIcon(LOCK_HUES[c.lock])}</span>` : '');

// opts: onExit, onAbandon(gaveUp), onRetry, onReplay, rachaRisk() → { n, pend } | null, onWin(stars) → { coins, tickets, prev, gold, wild, chest }, onDone(res), onSave(state)?,
//       resume (estado guardado), saved (la partida se guarda al salir), tutorial, dev
//       event: { ico, table } = nivel del evento del mes (table = la mesa de su temática) (sin estrellas; perder gasta su boleto y no se reintenta)
export class Game {
  constructor(root, level, opts) {
    // Mesa enrollada: copia propia, porque sus tapas cambian si en la pantalla cabe más tira (scrollView).
    this.level = level.scroll === 'mesa' ? { ...level, cards: level.cards.map((c) => ({ ...c })) } : level;
    level = this.level;
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
    // Se vigila el propio tablero y no la ventana: en iOS, al girar, el aviso de la ventana llega con el tamaño viejo.
    this.wrapSize = '';
    this.resizer = new ResizeObserver(([e]) => {
      const size = `${Math.round(e.contentRect.width)}x${Math.round(e.contentRect.height)}`;
      if (size !== this.wrapSize) this.layout();
    });
    this.resizer.observe(this.wrapEl);
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
    if (this.level.scroll === 'mesa' && !save.seen.mesa) {
      save.seen.mesa = true;
      persist();
      this.modalOpen = true;
      return openModal({
        title: 'Nuevo: mesa enrollada',
        color: 'blue',
        closable: false,
        body: `<p class="lead">Esta mesa llega <b>enrollada</b>. Cuando limpias las primeras cartas, la mesa avanza y salen más cartas del rollo.</p>`,
        onClose: () => {
          this.modalOpen = false;
          if (!reduced()) this.rollEl?.animate([{ scale: 1 }, { scale: 1.15 }, { scale: 1 }], { duration: 500, iterations: 2 });
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    if (this.level.scroll === 'gravedad' && !save.seen.gravedad) {
      save.seen.gravedad = true;
      persist();
      this.modalOpen = true;
      return openModal({
        title: 'Nuevo: gravedad',
        color: 'blue',
        closable: false,
        body: `<p class="lead">Las cartas van en <b>columnas</b>. Solo juegas la de <b>abajo</b>; la de encima te deja ver la que sigue. Al quitar una, la columna <b>cae</b>.</p>`,
        onClose: () => {
          this.modalOpen = false;
          if (!reduced()) for (const c of this.cards) if (c.el && c.gPos?.k === 0) c.el.animate([{ translate: '0 0' }, { translate: `0 ${-this.u * 0.25}px` }, { translate: '0 0' }], { duration: 420, easing: 'ease-in-out', iterations: 2 });
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    if (this.level.scroll === 'nebulosa' && !save.seen.nebulosa) {
      save.seen.nebulosa = true;
      persist();
      this.modalOpen = true;
      return openModal({
        title: 'Nuevo: nebulosa',
        color: 'blue',
        closable: false,
        body: `<p class="lead">Aquí solo ves <b>3 grupos</b> de cartas. Cuando vacías <b>cualquiera</b>, los demás se recorren y de la <b>nebulosa</b> sale otro.</p>`,
        onClose: () => {
          this.modalOpen = false;
          if (!reduced()) this.nebEl?.animate([{ scale: 1 }, { scale: 1.2 }, { scale: 1 }], { duration: 500, iterations: 2 });
          setTimeout(() => this.tips(), 300);
        },
        buttons: [{ label: '¡Entendido!', cls: 'green' }],
      });
    }
    const next = (this.level.meta.mechs || []).find((m) => TIPS[m] && !save.seen[m]);
    if (!next) return;
    save.seen[next] = true;
    persist();
    const c = this.cards.find((x) => !x.removed && x.el && x[MECH_FIELD[next]] != null);
    this.modalOpen = true;
    openModal({
      title: `Nuevo: ${MECH_NAMES[next].toLowerCase()}`,
      color: 'blue',
      closable: false,
      body: `<p class="lead">${TIPS[next]}</p>`,
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
      buttons: [{ label: '¡Entendido!', cls: 'green' }],
    });
  }

  destroy() {
    this.resizer.disconnect();
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
    this.back = cardBackURL();
    el.style.setProperty('--back', this.back);
    el.innerHTML = `${tableHTML(level.world, this.opts.event?.table)}
      <header class="hud">
        <button class="tb hbtn" data-a="exit" aria-label="Pausa" title="Pausa">${icon('pause')}</button>
        <div class="hud-mid"><div class="combo info"></div></div>
        <div class="hud-r">${this.opts.racha ? `<div class="pill info racha-pill ${this.opts.racha.hot ? 'hot' : ''}" aria-label="Racha">${this.opts.racha.hot ? `<span class="fire">${icon('flame')}</span>` : ''}${icon(this.opts.racha.ico)}<span>${this.opts.racha.n}</span></div>` : ''}<div class="pill info">${coin()}<span data-coins>${money(save.coins)}</span></div>${avatarHTML(save, 'hud-av')}</div>
      </header>
      <div class="board-wrap"><div class="board"></div><div class="streak"></div></div>
      <footer class="tray">
        <button class="end-btn tb" data-a="end" aria-label="Finalizar nivel">${icon('door')}<span>Finalizar nivel</span></button>
        <button class="tool tb undo-btn" data-a="undo" aria-label="Deshacer" title="Deshacer">${icon('undo')}<b class="badge" data-n="undo"></b></button>
        <div class="stock" data-a="draw" role="button" aria-label="Mazo"></div>
        <div class="pile waste"></div>
        <button class="tool tb wild-card" data-a="wild" aria-label="Comodín" title="Comodín">${icon('wild')}<b class="badge" data-n="wild"></b></button>
      </footer>`;
    this.boardEl = el.querySelector('.board');
    this.wrapEl = el.querySelector('.board-wrap');
    // Mesa enrollada: encima de la mesa del planeta va una alfombra de su color (--rug) que se desenrolla.
    if (level.scroll === 'mesa') {
      el.classList.add('scroll-mesa');
      const tbl = el.querySelector('.table');
      this.boardEl.insertAdjacentHTML('afterbegin', `<div class="rug" style="${tbl.getAttribute('style')}"></div><div class="strip"></div><div class="roll" style="${tbl.getAttribute('style')}"><i></i></div>`);
      this.rugEl = this.boardEl.querySelector('.rug');
      this.rollEl = this.boardEl.querySelector('.roll');
      // Las cartas de la tira van en su propia capa, cortada en la orilla del rollo (un solo corte fijo: al avanzar
      // las cartas solo se deslizan y el rollo se las traga o las suelta).
      this.stripEl = this.boardEl.querySelector('.strip');
    }
    // Nebulosa: nube que gira donde esperan los tramos que faltan.
    if (level.scroll === 'nebulosa') {
      el.classList.add('scroll-neb');
      this.boardEl.insertAdjacentHTML('afterbegin', `<div class="nebula"><div class="neb-in"><i></i><i></i><i></i></div></div>`);
      this.nebEl = this.boardEl.querySelector('.nebula');
    }
    // Gravedad: cada columna en su riel, sobre la mesa del planeta.
    if (level.scroll === 'gravedad') {
      el.classList.add('scroll-grav');
      this.boardEl.insertAdjacentHTML('afterbegin', level.cols.map(() => `<div class="g-rail"><b class="g-n"></b></div>`).join(''));
      this.railEls = [...this.boardEl.querySelectorAll('.g-rail')];
    }
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
        end: () => this.endLevel(),
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
    const live = this.cards.filter((c) => c.el && !c.bomb && !c.nebPos?.hid);
    if (reduced() || !live.length) return Promise.resolve();
    if (this.level.scroll === 'mesa') return this.unroll(live);
    if (this.nebEl) this.nebEl.animate([{ scale: 0, opacity: 0, rotate: '-180deg' }, { scale: 1, opacity: 1, rotate: '0deg' }], { duration: 900, delay: 500, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'backwards' });
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
        ? `<div class="inner"><div class="face front"></div><div class="face back"></div></div><span class="bomb-face">${icon('bomb')}<b></b></span>`
        : `<div class="inner">${faceHTML(c, E.rankOf(c, this.st))}${backHTML(c)}</div>` + marks(c);
    if (c.curtain != null) d.classList.add('curtain');
    if (c.alt != null) d.classList.add('dbl-card');
    d.style.zIndex = c.z * 100 + c.id;
    (this.stripEl || this.boardEl).append(d);
    c.el = d;
    this.place(c);
  }

  place(c) {
    if (this.level.scroll === 'mesa') return this.placeScroll(c);
    if (this.level.scroll === 'gravedad') return this.placeGrav(c);
    if (this.level.scroll) return this.placeNeb(c);
    const o = this.offsets[c.group];
    c.el.style.left = `${(o.x + c.x) * this.u}px`;
    c.el.style.top = `${(o.y + c.y) * this.u}px`;
    c.el.style.rotate = `${c.rot}deg`;
  }

  layout() {
    const r = this.wrapEl.getBoundingClientRect();
    if (!r.width) return;
    this.wrapSize = `${Math.round(r.width)}x${Math.round(r.height)}`;
    if (this.level.scroll === 'mesa') return this.layoutScroll(r);
    if (this.level.scroll === 'gravedad') return this.layoutGrav(r);
    if (this.level.scroll) return this.layoutNeb(r);
    // La carta doble se ve 10% más grande: se deja un poco de aire para que no se salga del tablero.
    const room = this.cards.some((c) => c.alt != null) ? 0.93 : 1;
    const { u, bw, bh, offsets } = packGroups(this.level.groups, (r.width - 10) * room, (r.height - 10) * room);
    this.u = Math.max(18, u);
    this.offsets = offsets;
    this.boardEl.style.width = `${bw * this.u}px`;
    this.boardEl.style.height = `${bh * this.u}px`;
    this.boardEl.style.setProperty('--cw', `${this.u}px`);
    this.cards.forEach((c) => c.el && this.place(c));
    this.renderStock();
    this.coach?.update();
  }

  // ---------- Mesa enrollada ----------
  // La tira (scrollStrip en levels.js) corre siempre hacia la izquierda con el rollo a la derecha, también con el
  // teléfono parado (ahí sale más chica). Se ve una ventana de this.view (lo que cabe; ver layoutScroll); las cartas
  // salen del rollo de una en una, cortadas en la orilla del rollo aunque estén giradas. Fuera del rollo valen las
  // tapas de siempre: una carta que asoma pero tiene otra encima sigue boca abajo.
  scrollO() {
    const { S } = this.scrollBase();
    let o = Infinity;
    for (const c of this.cards) if (!c.removed) o = Math.min(o, scrollSpan(c, S.at)[0]);
    return o === Infinity ? (this.scrollAt ?? 0) : o;
  }

  // Medidas fijas de la tira, en unidades de carta.
  scrollBase() {
    if (this.sBase) return this.sBase;
    const gs = this.level.groups;
    return (this.sBase = { S: scrollStrip(gs), pad: 0.25, rollT: 0.8, cross: Math.max(...gs.map((g) => g.h)) + 0.5 });
  }

  // Lo que depende de la ventana (this.view: cuánta tira se ve) y de cuánto avanzó (o).
  scrollGeo(o = this.scrollAt, view = this.view) {
    const B = this.scrollBase();
    const rollAt = B.pad + view; // donde empieza el rollo; las cartas se cortan a la mitad del rollo
    const cutAt = rollAt + B.rollT / 2;
    // Cuánto de la carta sigue dentro del rollo (0 = afuera completa, 1 = escondida).
    const cut = (c) => {
      const [l, r] = scrollSpan(c, B.S.at);
      return Math.max(0, Math.min(1, (B.pad + r - o - cutAt) / (r - l)));
    };
    return { ...B, o, rollAt, cutAt, along: rollAt + B.rollT + 0.1, cut, left: Math.max(0, B.S.end - o - view) };
  }

  // El tamaño de carta es el que deja la tira con la ventana mínima (SCROLL_VIEW); si con ese tamaño cabe más tira
  // (teléfono acostado, pantalla grande), se ven más cartas. La ventana nunca se achica en la partida (al girar,
  // mejor se achican las cartas): así nada que ya se podía jugar se vuelve a enrollar. Con más ventana cambian las
  // tapas (scrollCover) y se repinta.
  layoutScroll(r) {
    this.scrollAt ??= this.scrollO();
    const B = this.scrollBase(), along = r.width - 10, extra = B.pad + B.rollT + 0.1;
    let u = Math.min((r.height - 10) / B.cross, along / (extra + Math.max(SCROLL_VIEW, this.view || 0)), 120);
    const view = Math.max(SCROLL_VIEW, this.view || 0, along / u - extra);
    if (view > (this.view || 0) + 1e-6) {
      const grew = this.view != null;
      this.view = view;
      const cov = scrollCover(this.level, view);
      this.level.cards.forEach((c, i) => (c.coveredBy = this.cards[i].coveredBy = cov[i]));
      if (grew) queueMicrotask(() => this.refresh());
    }
    this.u = u = Math.max(18, u);
    const G = this.scrollGeo();
    this.boardEl.style.width = `${G.along * u}px`;
    this.boardEl.style.height = `${G.cross * u}px`;
    this.boardEl.style.setProperty('--cw', `${u}px`);
    this.cards.forEach((c) => c.el && this.place(c));
    this.paintRoll();
    this.renderStock();
    this.coach?.update();
  }

  placeScroll(c) {
    const B = this.scrollBase();
    c.el.style.left = `${(B.pad + B.S.at[c.group] + c.x - this.scrollAt) * this.u}px`;
    c.el.style.top = `${((B.cross - this.level.groups[c.group].h) / 2 + c.y) * this.u}px`;
    c.el.style.rotate = `${c.rot}deg`;
  }

  // La alfombra empieza un poco antes de la primera carta y llega hasta el rollo: al avanzar, su inicio se corre
  // con las cartas y se sale de la pantalla (que la recorta). El rollo se adelgaza mientras menos le queda adentro.
  rugBox(o = this.scrollAt) {
    const G = this.scrollGeo(o), u = this.u, left = (G.pad - 0.2 - o) * u;
    return { left: `${left}px`, width: `${G.cutAt * u - left}px` };
  }

  paintRoll() {
    if (!this.rollEl) return;
    const G = this.scrollGeo(), u = this.u;
    const t = G.rollT * u * (G.left > 0 ? 0.55 + 0.45 * Math.min(1, G.left / 8) : 0.35);
    const mid = G.cutAt * u;
    Object.assign(this.rugEl.style, { ...this.rugBox(), top: 0, height: '100%' });
    this.stripEl.style.clipPath = `inset(-100vh ${(G.along - G.cutAt) * u}px -100vh -100vw)`;
    Object.assign(this.rollEl.style, { left: `${mid - t / 2}px`, top: `${-u * 0.12}px`, width: `${t}px`, height: `calc(100% + ${u * 0.24}px)` });
    this.rollEl.classList.toggle('empty', G.left <= 0);
  }

  // Al empezar: el rollo sale gordo desde el inicio de la alfombra y rueda hasta su lugar desenrollándola; luego se
  // ponen las cartas encima, de izquierda a derecha, ya como van (sin voltearse).
  async unroll(live) {
    const u = this.u, rug = this.rugEl, roll = this.rollEl;
    const from = parseFloat(rug.style.left) - parseFloat(roll.style.left); // del inicio de la alfombra a su lugar
    const D = 1000, ease = 'cubic-bezier(.3,.1,.25,1)';
    const G = this.scrollGeo(), shown = live.filter((c) => G.cut(c) < 1);
    for (const c of live) c.el.style.opacity = 0;
    rug.animate([{ clipPath: 'inset(-40px 100% -60px -40px)' }, { clipPath: 'inset(-40px 0px -60px -40px)' }], { duration: D, easing: ease });
    roll.animate([{ translate: `${from}px 0`, scale: '1.5 1' }, { translate: '0 0', scale: 1 }], { duration: D, easing: ease });
    roll.querySelector('i').animate([{ backgroundPosition: `${-from}px 0` }, { backgroundPosition: '0 0' }], { duration: D, easing: ease });
    buzz(12);
    await wait(D - 150);
    for (const c of live) {
      c.el.style.opacity = '';
      c.el.classList.add('noflip');
      c.el.classList.toggle('up', this.shownUp(c));
    }
    shown.sort((a, b) => parseFloat(a.el.style.left) - parseFloat(b.el.style.left) || a.z - b.z);
    const step = Math.min(35, 1100 / shown.length);
    const anims = shown.map((c, i) =>
      c.el.animate([{ translate: `0 ${-u * 0.6}px`, scale: 1.25, opacity: 0 }, { translate: '0 0', scale: 1, opacity: 1 }], { duration: 300, delay: i * step, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' }),
    );
    await Promise.all(anims.map((a) => a.finished.catch(() => {})));
    for (const c of live) c.el.classList.remove('noflip');
  }

  // ---------- Gravedad ----------
  // Columnas en rieles: abajo la carta que se juega, encima la que sigue (boca arriba, para planear) y arriba de
  // todo la pila con las demás boca abajo (se ven hasta 5 de canto; el número dice cuántas quedan).
  layoutGrav(r) {
    const n = this.level.cols.length, gap = 0.42, pad = 0.2;
    const G = { gap, pad, pile: 0.45, row1: 0.45 + 1.4 + 0.3 };
    G.row0 = G.row1 + 1.4 + 0.16;
    G.bw = n + (n - 1) * gap + pad * 2;
    G.bh = G.row0 + 1.4 + 0.32;
    this.u = Math.max(18, Math.min((r.width - 10) / G.bw, (r.height - 10) / G.bh, 120));
    this.gravG = G;
    const u = this.u;
    this.boardEl.style.width = `${G.bw * u}px`;
    this.boardEl.style.height = `${G.bh * u}px`;
    this.boardEl.style.setProperty('--cw', `${u}px`);
    this.railEls.forEach((el, i) => Object.assign(el.style, { left: `${(pad + i * (1 + gap) - 0.12) * u}px`, width: `${1.24 * u}px`, top: 0, height: `${G.bh * u}px` }));
    this.cards.forEach((c) => c.el && this.place(c));
    this.paintGrav();
    this.renderStock();
    this.coach?.update();
  }

  // Lugar de la carta en su columna: 0 = abajo (la que se juega), 1 = la que sigue, 2+ = en la pila.
  gravIndex(c) {
    const col = this.level.cols[c.group];
    let k = 0;
    for (const id of col) {
      if (id === c.id) return k;
      if (!this.st.rem[id]) k++;
    }
    return k;
  }

  placeGrav(c) {
    const G = this.gravG;
    if (!G) return;
    const k = this.gravIndex(c), j = k - 2, u = this.u;
    const y = k === 0 ? G.row0 : k === 1 ? G.row1 : G.pile - Math.min(j, 4) * 0.09;
    c.el.style.left = `${(G.pad + c.group * (1 + G.gap)) * u}px`;
    c.el.style.top = `${y * u}px`;
    c.el.style.rotate = '0deg';
    c.el.style.zIndex = k === 0 ? 900 : k === 1 ? 800 : 700 - j;
    c.el.classList.toggle('g-next', k === 1);
    c.el.classList.toggle('g-deep', j > 4);
    c.gPos = { y, k };
  }

  // Cuántas quedan en la pila de cada columna.
  paintGrav() {
    this.railEls?.forEach((el, i) => {
      const left = this.level.cols[i].filter((id) => !this.st.rem[id]).length - 2;
      const b = el.querySelector('.g-n');
      b.textContent = left > 0 ? left : '';
      b.classList.toggle('on', left > 0);
    });
  }

  // Al quitar la de abajo, la columna cae un lugar y rebota al llegar; al deshacer, sube de regreso.
  gravUpdate() {
    const u = this.u;
    let fell = 0;
    for (const c of this.cards) {
      if (!c.el || !c.gPos) continue;
      const p = c.gPos;
      this.placeGrav(c);
      const dy = (p.y - c.gPos.y) * u;
      if (reduced() || Math.abs(dy) < 0.5) continue;
      if (dy < 0) {
        fell++;
        c.el.animate(
          [
            { translate: `0 ${dy}px`, scale: 1, easing: 'cubic-bezier(.5,0,.9,.6)' },
            { translate: '0 0', scale: '1.05 .93', offset: 0.62, easing: 'cubic-bezier(.2,.8,.3,1)' },
            { translate: `0 ${-u * 0.07}px`, scale: '.98 1.03', offset: 0.82 },
            { translate: '0 0', scale: 1 },
          ],
          { duration: 470 + c.gPos.k * 30, delay: Math.min(c.gPos.k, 3) * 25 },
        );
      } else c.el.animate([{ translate: `0 ${dy}px` }, { translate: '0 0' }], { duration: 420, easing: 'cubic-bezier(.3,1.2,.5,1)' });
    }
    if (fell) setTimeout(() => buzz(8), 300);
    this.paintGrav();
  }

  // ---------- Nebulosa ----------
  // Se ven NEB_SLOTS lugares en fila (o en columna con el teléfono parado, si así salen más grandes las cartas) y al
  // final la nebulosa. Cada lugar mide lo del tramo más grande. En qué lugar va cada tramo sale del estado: los que
  // ya salieron y siguen con cartas, en orden; así deshacer los regresa solos.
  layoutNeb(r) {
    const gs = this.level.groups, gap = 0.35, ND = 1.9, n = NEB_SLOTS;
    const SW = Math.max(...gs.map((g) => g.w)), SH = Math.max(...gs.map((g) => g.h));
    const W = r.width - 10, H = r.height - 10;
    const row = { bw: n * (SW + gap) + ND, bh: Math.max(SH, ND) }, col = { bw: Math.max(SW, ND), bh: n * (SH + gap) + ND };
    const fit = (o) => Math.min(W / o.bw, H / o.bh, 120);
    const across = fit(row) >= fit(col);
    const o = across ? row : col;
    this.u = Math.max(18, fit(o));
    this.nebG = { across, SW, SH, gap, ND, ...o, nx: across ? n * (SW + gap) + ND / 2 : o.bw / 2, ny: across ? o.bh / 2 : n * (SH + gap) + ND / 2 };
    this.boardEl.style.width = `${o.bw * this.u}px`;
    this.boardEl.style.height = `${o.bh * this.u}px`;
    this.boardEl.style.setProperty('--cw', `${this.u}px`);
    this.paintNeb();
    this.cards.forEach((c) => c.el && this.place(c));
    this.renderStock();
    this.coach?.update();
  }

  // Lugar de cada tramo (-1 = sigue en la nebulosa) y cuántos faltan por salir.
  nebSlots() {
    const out = E.nebOut(this.level, this.st), slot = [];
    let k = 0;
    this.level.neb.forEach((t, gi) => (slot[gi] = gi >= NEB_SLOTS + out ? -1 : t.every((j) => this.st.rem[j]) ? null : k++));
    return { slot, left: Math.max(0, this.level.neb.length - NEB_SLOTS - out) };
  }

  placeNeb(c) {
    if (!this.nebG) return; // el tablero aún no tiene tamaño: lo acomoda layoutNeb
    const G = this.nebG, u = this.u, g = this.level.groups[c.group];
    const k = this.nebSlots().slot[c.group];
    let x, y;
    if (k < 0) [x, y] = [G.nx - 0.5, G.ny - 0.7];
    else if (G.across) [x, y] = [k * (G.SW + G.gap) + (G.SW - g.w) / 2 + c.x, (G.bh - g.h) / 2 + c.y];
    else [x, y] = [(G.bw - g.w) / 2 + c.x, k * (G.SH + G.gap) + (G.SH - g.h) / 2 + c.y];
    c.el.style.left = `${x * u}px`;
    c.el.style.top = `${y * u}px`;
    c.el.style.rotate = `${k < 0 ? c.rot + ((c.id * 47) % 90) - 45 : c.rot}deg`;
    c.el.classList.toggle('neb-hid', k < 0);
    c.nebPos = { x, y, hid: k < 0 };
  }

  // La nebulosa se achica mientras menos tramos le quedan y se apaga al soltar el último.
  paintNeb() {
    if (!this.nebEl || !this.nebG) return;
    const G = this.nebG, u = this.u, { left } = this.nebSlots();
    Object.assign(this.nebEl.style, { left: `${(G.nx - G.ND / 2) * u}px`, top: `${(G.ny - G.ND / 2) * u}px`, width: `${G.ND * u}px`, height: `${G.ND * u}px` });
    this.nebEl.style.setProperty('--k', left ? 0.6 + 0.4 * Math.min(1, left / 4) : 0.25);
    this.nebEl.classList.toggle('empty', !left);
  }

  // Tras cada jugada (o deshacer): los tramos se recorren a su nuevo lugar, el que sale gira desde la nebulosa y,
  // al deshacer, el último que salió regresa a ella.
  nebUpdate() {
    const D = reduced() ? 0 : 520, ease = 'cubic-bezier(.45,0,.2,1)', u = this.u;
    let born = 0;
    for (const c of this.cards) {
      if (!c.el || !c.nebPos) continue;
      const p = c.nebPos;
      this.placeNeb(c);
      const q = c.nebPos;
      if (!D || (p.x === q.x && p.y === q.y && p.hid === q.hid)) continue;
      const tr = `${(p.x - q.x) * u}px ${(p.y - q.y) * u}px`;
      if (p.hid && !q.hid) {
        c.el.animate([{ translate: tr, scale: 0.15, opacity: 0, rotate: `${c.rot - 200}deg` }, { translate: '0 0', scale: 1, opacity: 1, rotate: `${c.rot}deg` }],
          { duration: 650, delay: 180 + born++ * 45, easing: 'cubic-bezier(.3,1.25,.5,1)', fill: 'backwards' });
      } else if (!p.hid && q.hid) {
        c.el.animate([{ translate: tr, scale: 1, opacity: 1, rotate: `${c.rot}deg` }, { translate: '0 0', scale: 0.15, opacity: 0, rotate: `${c.rot + 200}deg` }], { duration: 480, easing: 'ease-in' });
      } else c.el.animate([{ translate: tr }, { translate: '0 0' }], { duration: D, easing: ease });
    }
    if (born && this.nebEl) {
      this.nebEl.animate([{ scale: 1 }, { scale: 1.25 }, { scale: 1 }], { duration: 600, easing: 'ease-out' });
      buzz(12);
    }
    setTimeout(() => this.paintNeb(), born ? 300 : 0);
  }

  // Avanza (o regresa, al deshacer) la mesa: todo se corre hacia el inicio y las cartas salen del rollo.
  scrollUpdate() {
    const o = this.scrollO();
    if (this.scrollAt == null || Math.abs(o - this.scrollAt) < 1e-6) return;
    const before = this.scrollAt;
    const B = this.scrollGeo(before), from = new Map(this.cards.filter((c) => c.el).map((c) => [c, [parseFloat(c.el.style.left), B.cut(c)]]));
    this.scrollAt = o;
    const G = this.scrollGeo();
    const D = reduced() ? 0 : Math.min(900, 380 + Math.abs(o - before) * 160);
    const ease = 'cubic-bezier(.45,0,.2,1)';
    for (const c of this.cards) {
      if (!c.el) continue;
      const [x0, f0] = from.get(c);
      this.place(c);
      if (D && (f0 < 1 || G.cut(c) < 1)) c.el.animate([{ translate: `${x0 - parseFloat(c.el.style.left)}px 0` }, { translate: '0 0' }], { duration: D, easing: ease });
    }
    // La alfombra entera (con su orilla) se corre con las cartas y el rollo gira.
    const d = (o - before) * this.u;
    if (D && d) {
      const tr = `${-d}px 0`;
      const rug0 = this.rugBox(before);
      Object.assign(this.rugEl.style, this.rugBox());
      this.rugEl.animate([rug0, this.rugBox()], { duration: D, easing: ease });
      this.rollEl.querySelector('i').animate([{ backgroundPosition: '0 0' }, { backgroundPosition: tr }], { duration: D, easing: ease });
      this.rollEl.animate([{ scale: 1 }, { scale: '1.1 1' }, { scale: 1 }], { duration: D, easing: 'ease-in-out' });
    }
    setTimeout(() => this.paintRoll(), D * 0.6);
    if (d > 0) buzz(12);
  }

  // ¿Se ve boca arriba? En la mesa enrollada el rollo no voltea cartas: salen como van (solo cuentan las tapas de
  // otras cartas); una que asoma poco ya se ve, pero hasta que asoma media carta no se puede jugar.
  shownUp(c) {
    if (this.level.scroll === 'gravedad') return E.faceUp(this.level, this.gravIndex(c) < GRAV_SHOWN ? { ...c, coveredBy: [] } : c, this.st);
    return E.faceUp(this.level, this.level.scroll === 'mesa' ? { ...c, coveredBy: c.under } : c, this.st);
  }

  // Pinta lo que depende del estado: boca arriba, candados, cortinas, hielo, bomba y carta viva.
  refresh() {
    const { level, st } = this;
    if (level.scroll === 'mesa') this.scrollUpdate();
    else if (level.scroll === 'gravedad') this.gravUpdate();
    else if (level.scroll) this.nebUpdate();
    this.updateStuck(true);
    for (const c of this.cards) {
      if (c.removed || !c.el) continue;
      const el = c.el;
      if (!this.dealing) el.classList.toggle('up', this.shownUp(c));
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
          // Solo cambia el número grande (la carta no se mueve): el viejo sale y el nuevo entra hacia donde apunta.
          const big = el.querySelector('.front .big');
          big.textContent = RANKS[r];
          big.classList.toggle('ten', RANKS[r] === '10');
          if (old != null && !reduced()) {
            const up = c.live > 0 ? 1 : -1;
            big.animate(
              [{ translate: `0 ${up * 45}%`, scale: 0.6, opacity: 0 }, { translate: `0 ${-up * 6}%`, scale: 1.15, opacity: 1, offset: 0.6 }, { translate: '0 0', scale: 1, opacity: 1 }],
              { duration: 340, easing: 'ease-out' },
            );
            el.querySelector('.front .dir')?.animate([{ translate: '0 0' }, { translate: `0 ${-up * 25}%` }, { translate: '0 0' }], { duration: 340, easing: 'ease-out' });
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
    // Mazo vacío: queda un hueco punteado con "+5"; al tocarlo sale la ventana de compra.
    this.stockEl.querySelector('.buy5')?.remove();
    if (n) this.stockEl.insertAdjacentHTML('beforeend', `<span class="badge count">${n}</span>`);
    else {
      this.stockEl.insertAdjacentHTML('beforeend', `<div class="buy5"><b>+5</b></div>`);
    }
  }
  extraCost() {
    return this.opts.dev?.infinite ? 0 : this.priceOf('extra');
  }

  stockTop() {
    return this.stockEls?.[this.stockEls.length - 1] || this.stockEl;
  }

  // Carta suelta que vuela por encima del tablero (del mazo, del comodín, de regreso al mazo).
  flyer(c, rect, up) {
    const f = document.createElement('div');
    f.className = `card flyer${up ? ' up' : ''}`;
    f.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;--cw:${rect.width}px;z-index:9999;pointer-events:none`;
    f.style.setProperty('--back', this.back);
    f.innerHTML = inner(c);
    // Dentro de la pantalla del juego (capa aislada): así nunca pasa por encima de una ventana.
    this.el.append(f);
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

  // Indicador de racha por puntos: del premio anterior al siguiente (1-6, 7-13, 14-18, 19-23, 24-31 y luego tramos de 3).
  // Al final de los puntos se dibuja el premio del tramo (carta violeta, comodín dorado o estrella al inventario).
  // En el evento del mes los premios van al doble de distancia (level.rewardStep = 2).
  showCombo() {
    const step = this.level.rewardStep ?? 1;
    const { at, kind } = E.nextReward(this.streak, step);
    const from = E.prevReward(at, step);
    let dots = '';
    // Faltan 1 o 2: el siguiente punto late, el premio se mueve y abajo sale "¡Falta n!".
    const left = at - this.streak, near = this.streak > 0 && left <= 2;
    for (let i = from + 1; i < at; i++) dots += `<i class="${i <= this.streak ? 'on' : near && i === this.streak + 1 ? 'next' : ''}"></i>`;
    const prize = kind === 'bank' ? `<span class="prize bank">${icon('wild')}</span>` : `<span class="prize mini ${kind === 'wild' ? 'gift-wild' : 'gift-card'}"></span>`;
    this.comboEl.innerHTML = `<span class="dots">${from ? `<b>×${from}</b>` : ''}${dots}${prize}</span>${near ? `<em class="need outl">¡Falta ${left}!</em>` : ''}`;
    this.comboEl.classList.toggle('near', near);
    this.comboEl.classList.toggle('hot', near && left === 1);
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
    if (this.stripEl) this.boardEl.append(el); // sale de la tira: el corte del rollo no la tapa al volar
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
    this.showStreak(`¡Racha ×${this.streak}!`);
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
        this.el.append(flash);
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
        { scale: 1.12, rotate: '6deg', opacity: 1, offset: 0.6 },
        { scale: 1, rotate: '0deg', opacity: 1 },
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
      return this.buyExtra();
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
      if (this.level.scroll === 'gravedad' && c.el === el) this.placeGrav(c);
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
    if (save.undo <= 0 && !inf) return save.coins < this.priceOf('undo') ? this.noWayOut('undo') : this.offerBuy('undo');
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
    if (save.wild <= 0 && !this.opts.dev?.infinite) return save.coins < this.priceOf('wild') ? this.noWayOut('wild') : this.offerBuy('wild');
    if (!this.opts.dev?.infinite) save.wild--;
    persist();
    this.history.push({ t: 'wild', before: this.st, best: this.best, bonus: this.bonus });
    this.st = { ...E.cloneState(this.st), top: { wild: true } };
    this.updateStuck(); // con el comodín arriba ya hay jugada: se quita el aviso de atorado
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

  // Precio de los boosters según el nivel que se juega (mismos escalones que los boletos).
  priceOf(kind) {
    return price(kind, this.level.world * LEVELS_PER_WORLD);
  }

  // kind: 'wild' (1 comodín), 'undo' (3 deshacer) o 'extra' (+5 cartas al mazo, solo atascado).
  offerBuy(kind) {
    const cost = kind === 'extra' ? this.extraCost() : this.priceOf(kind);
    const n = { wild: 1, undo: 3, extra: 5 }[kind];
    this.modalOpen = true;
    // Lo que se compra se ve en grande, flotando con rayos detrás.
    const hero = {
      wild: '<div class="hero-card wild"></div>',
      undo: `<div class="hero-undo">${[0, 1, 2].map((k) => `<span style="--k:${k}">${icon('undo')}</span>`).join('')}</div>`,
      extra: `<div class="hero-fan">${[0, 1, 2, 3, 4].map((k) => `<i style="--k:${k}"></i>`).join('')}</div>`,
    }[kind];
    const text = {
      wild: 'El <b>comodín</b> vale cualquier número: úsalo cuando te atores.',
      undo: 'Con <b>deshacer</b> regresas tu última jugada o robo.',
      extra: 'Llegan <b>5 cartas</b> a tu mazo. Con +5 siempre te llevas al menos 1 estrella.',
    }[kind];
    openModal({
      title: { wild: '¡Te quedaste sin comodines!', undo: '¡Te quedaste sin deshacer!', extra: '¿Comprar +5 cartas?' }[kind],
      color: { wild: 'gold', undo: 'green', extra: 'violet' }[kind],
      cls: 'buy-modal',
      body: `<div class="buy-hero"><div class="rays"></div>${hero}<b class="qty outl">${kind === 'extra' ? '+5' : `×${n}`}</b></div>
        <p class="lead">${text}</p>
        ${save.coins < cost ? '<p class="note">No te alcanzan las monedas.</p>' : ''}`,
      onClose: () => (this.modalOpen = false),
      buttons: [
        { label: 'Ahora no', cls: 'ghost grow' },
        {
          label: `Comprar ${coin()} ${cost}`,
          cls: 'green grow',
          disabled: save.coins < cost,
          onClick: () => {
            if (kind === 'extra') return this.payExtra(cost);
            save.coins -= cost;
            save[kind] += n;
            persist();
            this.buyFx(kind, cost, n);
          },
        },
      ],
    });
  }

  // Compra con animación: las monedas salen del monedero hacia el botón y luego llega lo comprado, que rebota en su sitio.
  async buyFx(kind, cost, n) {
    const btn = this.el.querySelector(kind === 'wild' ? '.wild-card' : '.undo-btn');
    const r = btn.getBoundingClientRect();
    const to = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    const counter = btn.querySelector('.badge');
    counter.textContent = save[kind] - n;
    await spendFromWallet('coins', to, cost);
    if (reduced()) return this.updateCounts();
    for (let i = 0; i < n; i++) {
      const f = document.createElement('div');
      f.className = 'fly-prize gain';
      f.innerHTML = icon(kind === 'wild' ? 'wild' : 'undo');
      f.style.cssText = `left:${innerWidth / 2}px;top:${innerHeight * 0.42}px`;
      this.el.append(f);
      const dx = to.x - innerWidth / 2, dy = to.y - innerHeight * 0.42;
      await f.animate(
        [
          { translate: '0 0', scale: 0, rotate: '-20deg' },
          { translate: '0 -10px', scale: 2.2, rotate: '8deg', offset: 0.3 },
          { translate: '0 -10px', scale: 2, rotate: '0deg', offset: 0.5 },
          { translate: `${dx}px ${dy}px`, scale: 0.8, rotate: '0deg' },
        ],
        { duration: 760, delay: i * 120, easing: 'cubic-bezier(0.5, 0, 0.5, 1)', fill: 'backwards' },
      ).finished;
      f.remove();
      counter.textContent = save[kind] - n + i + 1;
      squash(btn);
      sparkle(to, 8);
      buzz(12);
    }
  }

  // +5 cartas compradas: van al final del mazo y también a los estados guardados para deshacer
  // (deshacer nunca quita lo que se compró). Las monedas salen hacia el mazo y las cartas llegan volando una por una.
  async addExtra(cost) {
    this.extras++;
    const free = this.cards.filter((c) => E.isOpen(this.level, c, this.st));
    const add = [];
    for (let i = 0; i < 5; i++) {
      const f = free[i % Math.max(1, free.length)];
      const rank = f ? (E.rankOf(f, this.st) + (Math.random() < 0.5 ? 1 : 12)) % 13 : Math.floor(Math.random() * 13);
      add.push({ rank, suit: Math.floor(Math.random() * 4) });
    }
    this.busy = true;
    const sr = this.stockEl.getBoundingClientRect();
    if (cost) await spendFromWallet('coins', { x: sr.left + sr.width / 2, y: sr.top + sr.height / 2 }, cost);
    this.st = E.cloneState(this.st);
    this.st.stock.push(...add);
    for (const h of this.history) h.before = { ...h.before, stock: [...h.before.stock, ...add] };
    this.renderPiles();
    this.save();
    const slots = this.stockEls.slice(0, 5).reverse();
    if (!reduced()) {
      slots.forEach((e) => (e.style.opacity = 0));
      const w = this.stockEl.offsetHeight / 1.4;
      const x0 = innerWidth / 2 - w / 2, y0 = innerHeight * 0.38;
      await Promise.all(
        slots.map((slot, i) =>
          wait(i * 140).then(async () => {
            // Aparece al centro con un salto y luego se mete en su hueco del mazo.
            const f = this.flyer({}, { left: x0, top: y0, width: w }, false);
            await f.animate([{ scale: 0.2, rotate: '-25deg', opacity: 0 }, { scale: 1.15, rotate: '6deg', opacity: 1, offset: 0.7 }, { scale: 1, rotate: '0deg', opacity: 1 }], { duration: 260, easing: 'ease-out' }).finished;
            const t = slot.getBoundingClientRect();
            await this.intoSlot(f, slot, t.left - x0, t.top - y0, 0);
            squash(slot);
          }),
        ),
      );
    }
    this.busy = false;
    toast('+5 cartas al mazo');
    this.updateStuck();
  }

  checkEnd() {
    if (E.won(this.st)) return this.win();
  }

  // Sin mazo y sin jugadas: la carta +5 y "Finalizar nivel" saltan para que se vean (sin ventana).
  updateStuck(announce) {
    const stuck = this.isStuck();
    const was = this.el.classList.contains('no-moves');
    this.el.classList.toggle('no-moves', stuck);
    if (!stuck || was || !announce) return;
    setTimeout(() => {
      // Se revisa de nuevo: pudo usar un comodín en este rato (y ya tener jugada).
      if (!this.isStuck()) return this.updateStuck();
      if (this.broke()) return this.noWayOut();
      toast('Sin jugadas: compra +5 cartas o finaliza el nivel');
      if (reduced()) return;
      const pop = [{ scale: 0.4, opacity: 0 }, { scale: 1.15, opacity: 1, offset: 0.6 }, { scale: 1, opacity: 1 }];
      this.el.querySelector('.end-btn')?.animate(pop, { duration: 420, easing: 'ease-out' });
      this.stockEl.querySelector('.buy5')?.animate([{ rotate: '0deg' }, { rotate: '-8deg' }, { rotate: '7deg' }, { rotate: '-4deg' }, { rotate: '0deg' }], { duration: 600, delay: 200 });
    }, 350);
  }

  // Atorado y sin con qué salir: sin comodines y sin monedas para +5 ni para un comodín.
  broke() {
    return !this.opts.dev?.infinite && save.wild <= 0 && save.coins < Math.min(this.extraCost(), this.priceOf('wild'));
  }
  // Le dice qué hacer en vez de dejarlo atorado: esperar el regalo diario, o abandonar este nivel para juntar
  // monedas en otros (jugar otro nivel pide abandonar el que está a medias). Con los botones de la pausa.
  // kind: 'stuck' (sin jugadas) · 'wild' o 'undo' (tocó uno que tiene en 0 y no le alcanza para comprarlo).
  noWayOut(kind = 'stuck') {
    if (this.done || this.modalOpen) return;
    this.modalOpen = true;
    const left = this.cards.filter((c) => !c.removed).length, have = `(tienes ${save.coins})`;
    const lead = {
      stuck: `Te ${left === 1 ? 'falta 1 carta' : `faltan ${left} cartas`}, pero ya no tienes <b>comodines</b> y para <b>+5 cartas</b> necesitas ${coin()} ${Math.min(this.extraCost(), this.priceOf('wild'))} ${have}.`,
      wild: `Ya no tienes <b>comodines</b> y uno cuesta ${coin()} ${this.priceOf('wild')} ${have}.`,
      undo: `Ya no tienes <b>deshacer</b> y 3 cuestan ${coin()} ${this.priceOf('undo')} ${have}.`,
    }[kind];
    const m = openModal({
      title: { stuck: '¡Te quedaste sin ayudas!', wild: '¡Sin comodines ni monedas!', undo: '¡Sin deshacer ni monedas!' }[kind],
      color: 'violet',
      cls: 'ev-intro broke-modal',
      body: `<div class="evi-hero"><div class="rays"></div><span class="evi-ico">${icon(kind === 'undo' ? 'undo' : 'wild', 0, 0, 'big')}</span></div>
        <p class="lead">${lead}</p>
        <ul class="evi-rules">
          <li>${icon('gift')}<span>Reclama tu <b>regalo diario</b>: trae monedas y a veces comodines.${this.opts.saved ? ' <b>Guarda y sal</b>: tu partida te espera.' : ''}</span></li>
          <li>${icon('star')}<span>${this.opts.saved ? 'Para juntar monedas en <b>otros niveles</b> tienes que <b>abandonar</b> este.' : 'Junta monedas en <b>otros niveles</b>: cada estrella nueva paga.'}</span></li>
        </ul>`,
      onClose: () => (this.modalOpen = false),
      buttons: this.pauseButtons(),
    });
    if (!reduced()) m.el.querySelectorAll('.evi-rules li').forEach((el, i) => el.animate([{ opacity: 0, translate: '-14px 0' }, { opacity: 1, translate: '0 0' }], { duration: 320, delay: 300 + i * 120, easing: 'ease-out', fill: 'backwards' }));
  }

  isStuck() {
    return !this.done && !this.stock.length && !this.hasMove();
  }

  // Comprar +5 cartas tocando la carta +5 (solo si estás atascado y te alcanza).
  // Tocar el hueco +5 del mazo: abre la ventana de compra (como comodín y deshacer).
  buyExtra() {
    if (this.done || this.busy || this.modalOpen) return;
    if (this.broke() && this.isStuck()) return this.noWayOut();
    this.offerBuy('extra');
  }
  payExtra(cost) {
    save.coins -= cost;
    persist();
    this.el.classList.remove('no-moves');
    this.addExtra(cost);
  }


  // "Finalizar nivel": reintentar con boleto nuevo, rendirse o seguir jugando (para usar comodín o deshacer).
  endLevel() {
    if (this.done || this.modalOpen) return;
    this.modalOpen = true;
    const left = this.cards.filter((c) => !c.removed).length;
    const cost = this.extraCost(), short = save.coins < cost;
    const fan = [0, 1, 2, 3, 4].map((k) => `<div class="card mini-back" style="left:${6 + k * 9}px;rotate:${-14 + k * 7}deg"></div>`).join('');
    const m = openModal({
      title: '¿Finalizar el nivel?',
      color: 'pink',
      // El cuadro grande es el botón de comprar +5: dice el precio y se toca para gastar (gris si no alcanza).
      body: `<button class="offer buy press"${short ? ' disabled' : ''}><div class="fan">${fan}</div><div><b>Comprar +5 cartas</b><span>Quedan ${left} carta${left === 1 ? '' : 's'} en el tablero. ${this.opts.event ? 'Te pueden salvar el nivel.' : 'Con +5 siempre te llevas al menos 1 estrella.'}</span>
          <em class="cost${short ? ' short' : ''}">${coin()} ${cost || 'gratis'}${short ? ' · te faltan monedas' : ''}</em></div></button>${this.rachaWarn(true)}`,
      onClose: () => (this.modalOpen = false),
      buttons: [
        !this.opts.event && { label: this.opts.free ? 'Reintentar' : 'Reintentar · nuevo boleto', cls: 'ghost wide', onClick: () => this.opts.onRetry() },
        { label: 'Rendirse', cls: 'pink grow', onClick: () => this.opts.onAbandon(true) },
        { label: 'Seguir jugando', cls: 'ghost grow' },
      ].filter(Boolean),
    });
    m.el.querySelector('.offer.buy').addEventListener('click', () => {
      if (short) return;
      m.close();
      this.payExtra(cost);
    });
  }


  // Rendirse o abandonar (nivel nuevo o repetido) reinicia la racha: se avisa solo si hay algo que perder.
  rachaWarn(end) {
    const r = this.opts.rachaRisk?.();
    if (!r) return '';
    const when = !end ? 'Si abandonas' : r.isNew ? 'Si reintentas o te rindes' : 'Si te rindes';
    return rachaWarnHTML(r.n, r.pend, when);
  }

  win() {
    this.done = true;
    this.coach?.end();
    const left = this.stock.length;
    const stars = this.extras ? 1 : E.starsFor(this.level, left);
    const res = this.opts.onWin(stars);
    const { coins, tickets, prev, gold, wild, undo, col } = res;
    const ev = this.opts.event;
    const title = ev ? res.title : this.level.secret ? '¡Nivel secreto!' : this.level.boss ? '¡Jefe derrotado!' : '¡Nivel superado!';
    // Los premios son burbujas (icono + cantidad, sin texto) que salen de las estrellas y suben despacio; se pueden
    // tronar y cuentan para el premio de burbujas (countPop en ui.js).
    const bub = (ico, n) => `${ico}<b>+${n}</b>`;
    const loot = [
      coins && bub(coin(), coins),
      tickets && bub(icon('ticket'), tickets),
      gold && bub(icon('gold'), 1),
      wild && bub(icon('wild'), wild),
      undo && bub(icon('undo'), undo),
      col && bub(icon(col.ico), col.n),
      ev && res.items?.length && bub(icon('gift'), res.items.length),
    ].filter(Boolean);
    const note = ev ? (res.repeat ? '<p class="note">Ya tenías los exclusivos de este planeta: te tocan ayudas.</p>' : '')
      : !coins && prev >= 3
      ? '<p class="note">Ya cobraste las 3 estrellas de este nivel.</p>'
      : prev && stars <= prev
        ? `<p class="note">Tu récord aquí es de ${prev} estrella${prev > 1 ? 's' : ''}: solo se pagan las nuevas.</p>`
      : stars > prev && prev ? '<p class="note">¡Nuevo récord de estrellas!</p>' : '';
    setTimeout(() => {
      confetti();
      const m = openModal({
        title,
        color: 'gold',
        closable: false,
        cls: 'win',
        body: `<div class="win-top"><div class="rays"></div>${ev ? `<div class="ev-win">${icon(ev.ico, 0, 0, 'big')}</div>` : `<div class="big-stars">${starsHTML(stars)}</div>`}</div>${note}`,
        // Sin las 3 estrellas puede repetirlo ahí mismo (gratis: ya lo ganó). Se queda su mejor resultado.
        // Repetir es solo el ícono; Continuar ocupa el resto del renglón (o todo, si no hay Repetir).
        buttons: [
          res.replay && stars < 3 && { label: icon('replay'), cls: 'ghost sq', title: 'Repetir', onClick: () => this.opts.onReplay() },
          { label: `Continuar ${icon('next')}`, cls: `green ${res.replay && stars < 3 ? 'grow' : 'wide'}`, onClick: () => this.opts.onDone?.(res) },
        ].filter(Boolean),
      });
      // Jefe sin cofre (el del evento o uno ya ganado): los globos salen aquí. Si hay cofre, salen en su ventana.
      if (((this.level.boss && !this.level.secret) || ev?.boss) && !res.chest) balloons(m);
      // Las burbujas se colocan cuando la ventana ya terminó de entrar (si no, salen desfasadas), justo debajo de las estrellas.
      const top = m.el.querySelector('.win-top');
      const settled = () => Promise.all(m.el.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations !== Infinity && !a.effect.target?.closest?.('.balloons')).map((a) => a.finished.catch(() => {})));
      const launch = () => settled().then(() => m.el.isConnected && lootBubbles(m, loot, top, { lift: 40 - top.offsetHeight }));
      if (reduced()) return launch();
      // Cada estrella cae con su golpe; luego salen los premios.
      m.el.querySelectorAll('.big-stars .star').forEach((el, i) => {
        if (i >= stars) return;
        setTimeout(() => {
          buzz(15);
          const r = el.getBoundingClientRect();
          sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 8);
        }, 520 + i * 200);
      });
      setTimeout(launch, ev ? 700 : 600 + stars * 200);
    }, 450);
  }

  // Nivel nuevo: salir guarda la partida (al volver sigues donde ibas) o la abandonas.
  // Repetición: salir pierde el intento.
  // Los 3 botones de la pausa (seguir, guardar y salir, abandonar): también en la ventana de "sin ayudas".
  pauseButtons() {
    const free = () => (this.modalOpen = false);
    const confirmLeave = () =>
      openModal({
        title: '¿Abandonar el nivel?',
        color: 'pink',
        onClose: free,
        body: `<p class="lead">${this.opts.event ? 'Se gasta tu boleto del evento: el siguiente llega en 24 horas.' : this.opts.free ? 'Se pierde este intento.' : 'Pierdes los boletos y lo que gastaste en este intento.'}</p>${this.rachaWarn()}`,
        buttons: [{ label: 'Seguir jugando', cls: 'ghost' }, { label: 'Abandonar', cls: 'pink', onClick: () => this.opts.onAbandon(true) }],
      });
    return [
      { label: `${icon('play')} Continuar`, cls: 'green wide' },
      this.opts.saved && { label: `${icon('door')} Guardar y salir`, cls: 'ghost wide', onClick: () => this.opts.onExit() },
      { label: this.opts.saved ? 'Abandonar nivel' : `${icon('door')} Salir`, cls: 'pink wide', onClick: () => setTimeout(() => ((this.modalOpen = true), confirmLeave()), 0) },
    ].filter(Boolean);
  }

  exit() {
    if (this.modalOpen) return;
    this.modalOpen = true;
    const free = () => (this.modalOpen = false);
    // Sin haber jugado nada: sale directo y no cuenta como abandonar (la racha no se pierde).
    if (!this.opts.saved && !this.history.length && !this.opts.dev) return free(), this.opts.onAbandon(false);
    openModal({
      title: 'Pausa',
      color: 'gray',
      onClose: free,
      body: (this.opts.saved ? '<p class="note">Tu partida se guarda: al volver sigues donde te quedaste.</p>' : this.level.secret && this.opts.rachaRisk?.()?.isNew ? '<p class="note">Si sales del nivel secreto, se pierde este intento.</p>' : '<p class="note">Estás repitiendo un nivel: si sales, se pierde este intento.</p>')
        + (this.opts.saved ? '' : this.rachaWarn()),
      buttons: this.pauseButtons(),
      cls: 'pause',
    });
  }

  // ---------- Modo dev (ver js/dev.js) ----------
  // Si sin comodines no sale (niveles que piden ayuda), lo intenta con hasta 3.
  solveHere() {
    for (let w = 0; w <= 3; w++) {
      const path = E.solve(this.level, this.st, w ? 60000 : 250000, w);
      if (path) return path;
    }
    return null;
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
    const wilds = path.filter((m) => m === 'wild').length;
    for (const m of path) if (m !== 'draw' && m !== 'wild') this.cards[m].el?.insertAdjacentHTML('beforeend', `<span class="dev-num">${++k}</span>`);
    toast(`Solución: ${k} jugadas, ${path.length - k - wilds} robos${wilds ? ` y ${wilds} comodín${wilds > 1 ? 'es' : ''}` : ''}`);
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
    else if (path[0] === 'wild') {
      if (save.wild <= 0 && !this.opts.dev?.infinite) {
        toast('Aquí va un comodín y no tienes');
        return false;
      }
      this.useWild();
    } else this.play(this.cards[path[0]]);
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
