// Arma el tablero de un jefe de constelación sin trabar la pantalla (15 nov 2026; ver bossPick en levels.js).
import { bossPick, arenaPick } from './levels.js';

// Arena de jefes (20 nov 2026): si llega un objeto, es la pelea de la arena ({ kind, base, diff, seed }).
self.onmessage = (e) => self.postMessage(typeof e.data === 'object' ? { arena: true, p: arenaPick(e.data) } : { g: e.data, p: bossPick(e.data) });
