// Arma el tablero de un jefe de constelación sin trabar la pantalla (15 nov 2026; ver bossPick en levels.js).
import { bossPick } from './levels.js';

self.onmessage = (e) => self.postMessage({ g: e.data, p: bossPick(e.data) });
