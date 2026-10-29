// Tutorial guiado del primer nivel: señala qué tocar y no deja tocar otra cosa
// hasta que el jugador entiende la dinámica. Después suelta el control.
import { RANKS } from './game.js';

const GUIDED = 10; // jugadas guiadas antes de dejarlo solo

export class Coach {
  constructor(game) {
    this.game = game;
    this.steps = 0;
    this.bubble = document.createElement('div');
    this.bubble.className = 'coach-bubble';
    this.ring = document.createElement('div');
    this.ring.className = 'coach-ring';
    // La burbuja va en el flujo, entre el encabezado y el tablero: el tablero se encoge para dejarle sitio.
    game.wrapEl.before(this.bubble);
    game.el.append(this.ring);
    game.layout();
    this.update();
  }

  target() {
    const g = this.game;
    const c = g.playable()[0];
    if (c) return { card: c, el: c.el };
    if (g.stock.length) return { stock: true, el: g.stockTop() };
    return null;
  }

  // ¿Se puede tocar esto ahora? (una carta o 'stock')
  allows(x) {
    const t = this.target();
    const ok = !t || (x === 'stock' ? t.stock : t.card === x);
    if (!ok) {
      this.ring.classList.remove('nudge');
      void this.ring.offsetWidth;
      this.ring.classList.add('nudge');
    }
    return ok;
  }

  after() {
    this.steps++;
    this.ring.style.opacity = 0;
    clearTimeout(this.t);
    this.t = setTimeout(() => this.update(), 480);
  }

  update() {
    const g = this.game;
    if (!this.bubble.isConnected || g.done) return;
    if (this.steps >= GUIDED) return this.finish();
    const t = this.target();
    if (!t) return this.end();
    const top = g.waste[g.waste.length - 1];
    let msg;
    if (t.stock) {
      msg = 'No hay jugadas: toca el <b>mazo</b> para sacar otra carta. Ojo: robar corta tu racha.';
    } else {
      const r = RANKS[t.card.rank];
      const tr = RANKS[top.rank];
      if (this.steps === 0) msg = `Toca una carta que sea <b>uno más o uno menos</b> que la de abajo. La <b>${r}</b> va sobre la <b>${tr}</b>.`;
      else if (Math.abs(t.card.rank - top.rank) === 12) msg = `La <b>A</b> y la <b>K</b> se conectan: toca la <b>${r}</b>.`;
      else if (g.streak >= 3) msg = `¡Racha ×${g.streak}! Si llegas a 6 seguidas te regalan una carta. Sigue con la <b>${r}</b>.`;
      else msg = `¡Eso! Ahora la <b>${r}</b> va sobre la <b>${tr}</b>.`;
    }
    this.bubble.innerHTML = `<span>${msg}</span>`;
    this.bubble.classList.add('show');
    const gr = g.el.getBoundingClientRect();
    const r = t.el.getBoundingClientRect();
    Object.assign(this.ring.style, {
      left: `${r.left - gr.left + r.width / 2}px`,
      top: `${r.top - gr.top + r.height / 2}px`,
      width: `${Math.max(r.width, r.height) + 18}px`,
      height: `${Math.max(r.width, r.height) + 18}px`,
      opacity: 1,
    });
  }

  finish() {
    this.ring.remove();
    this.bubble.innerHTML = '<span>¡Ya le agarraste! Termina el nivel tú solo. Si te equivocas, <b>deshacer</b> regresa la jugada.</span>';
    this.game.coach = null;
    setTimeout(() => {
      this.bubble.remove();
      if (!this.game.done) this.game.layout();
    }, 4000);
  }

  end() {
    clearTimeout(this.t);
    this.ring.remove();
    this.bubble.remove();
    if (this.game.coach === this) this.game.coach = null;
    if (!this.game.done) this.game.layout();
  }
}
