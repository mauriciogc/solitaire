<p align="center">
  <img src="docs/img/logo.png" width="360" alt="Solitaire">
</p>

<p align="center">
  <b>Un solitario TriPeaks que viaja por el espacio.</b><br>
  Cientos de planetas, cartas con poderes, mesas que se mueven, jefes y fiestas de todo el mundo.<br>
  Se juega en el navegador, en <b>PC</b> o en el <b>celular</b> (de preferencia acostado), y se instala como app.
</p>

<p align="center">
  <img src="docs/img/i/i-planeta.png" width="28" alt="">&nbsp; <b>5,200 niveles</b> &nbsp;·&nbsp; <img src="docs/img/i/c-carta-doble.png" width="28" alt="">&nbsp; <b>35 cartas especiales</b> &nbsp;·&nbsp; <img src="docs/img/i/m-gravedad.png" width="28" alt="">&nbsp; <b>17 mesas</b> &nbsp;·&nbsp; <img src="docs/img/i/j-kraken.png" width="28" alt="">&nbsp; <b>8 jefes</b> &nbsp;·&nbsp; <img src="docs/img/i/e-festividades-de-un-dia.png" width="28" alt="">&nbsp; <b>51 fiestas</b>
</p>

<p align="center">
  <img src="docs/img/jugando.gif" width="300" alt="Partida jugando: cartas que vuelan al descarte y la racha sube">
</p>

> [!NOTE]
> <img src="docs/img/mascota.svg" width="44" align="left" alt="Mascotita de Claude">
> **Este proyecto se hizo 100% con [Claude](https://claude.com/claude-code).** Todo el código, el arte (dibujado con código: SVG, CSS y Three.js), las reglas, los niveles y las pruebas los escribió Claude a partir de las ideas, las pruebas en el iPhone y los «así no, mejor así» de Mau. Ni una línea a mano. La mascotita es la firma de Claude. 🧡

<table align="center"><tr>
<td align="center"><a href="#como-se-juega"><img src="docs/img/i/i-cards.png" width="40" alt=""><br><sub><b>Cómo se juega</b></sub></a></td>
<td align="center"><a href="#camino"><img src="docs/img/i/i-camino.png" width="40" alt=""><br><sub><b>Tu camino</b></sub></a></td>
<td align="center"><a href="#cartas"><img src="docs/img/i/c-carta-doble.png" width="40" alt=""><br><sub><b>Cartas</b></sub></a></td>
<td align="center"><a href="#mesas"><img src="docs/img/i/m-gravedad.png" width="40" alt=""><br><sub><b>Mesas</b></sub></a></td>
<td align="center"><a href="#jefes"><img src="docs/img/i/j-fenix-estelar.png" width="40" alt=""><br><sub><b>Jefes</b></sub></a></td>
<td align="center"><a href="#eventos"><img src="docs/img/i/e-eventos-del-mes.png" width="40" alt=""><br><sub><b>Eventos</b></sub></a></td>
<td align="center"><a href="#tienda"><img src="docs/img/i/i-tienda.png" width="40" alt=""><br><sub><b>Tienda</b></sub></a></td>
<td align="center"><a href="#dev"><img src="docs/img/i/i-gear.png" width="40" alt=""><br><sub><b>Modo dev</b></sub></a></td>
</tr></table>

---

<a id="como-se-juega"></a>

## <img src="docs/img/i/i-cards.png" width="30" alt=""> Cómo se juega

Es un **TriPeaks**: hay cartas acomodadas en la mesa y un mazo abajo.

| | |
|:-:|---|
| **1** | Toca una carta de la mesa que sea **un número arriba o uno abajo** de la del descarte (sobre un 7 va un 6 o un 8). **La A y la K se conectan.** |
| **2** | La carta vuela al descarte y ahora sigues desde ella. |
| **3** | ¿Sin jugada? Toca el **mazo**: sale otra carta, pero se corta tu **racha**. |
| **4** | **Ganas** cuando limpias la mesa. **Pierdes** si se acaba el mazo y ya no hay jugadas. |

Solo se juegan las cartas **libres** (las que nada tapa). Al quitar las de encima, las de abajo se voltean.

<img src="docs/img/i/i-estrella.png" width="22" alt=""> **Estrellas.** Al ganar te llevas de 1 a 3 según cuántas cartas te sobren: con la mitad del mazo o más, 3 ★.<br>
<img src="docs/img/i/i-fuego.png" width="22" alt=""> **Racha.** Cada carta seguida sin robar suma. La barra de arriba regala cartas extra, un comodín y, a los 30, la **escoba** <img src="docs/img/i/i-escoba.png" width="20" alt="">, que se lleva toda la capa de hasta abajo.<br>
📱 **Dónde jugar.** En el **celular**, de preferencia **acostado**; vibra cuando algo no se puede. En la **PC**, con mouse o teclado: **Espacio**/**Enter** roba, **Z**/**Retroceso** deshace y **Esc** pausa.

### <img src="docs/img/i/i-ayudas.png" width="26" alt=""> Ayudas

El botón dorado de abajo guarda tus ayudas. Solo salen las que sirven en ese tablero.

<table>
<tr><td align="center" width="20%"><img src="docs/img/i/i-comodin.png" width="40" alt=""><br><sub><b>Comodín</b><br>Vale cualquier número</sub></td><td align="center" width="20%"><img src="docs/img/i/i-deshacer.png" width="40" alt=""><br><sub><b>Deshacer</b><br>Regresa la última jugada</sub></td><td align="center" width="20%"><img src="docs/img/i/i-mas5.png" width="40" alt=""><br><sub><b>+5 cartas</b><br>Cinco cartas más al mazo cuando ya no te quedan</sub></td><td align="center" width="20%"><img src="docs/img/i/i-reloj.png" width="40" alt=""><br><sub><b>Reloj de arena</b><br>Congela 3 turnos todo lo que lleva cuenta (bombas, cometas, jefes…)</sub></td><td align="center" width="20%"><img src="docs/img/i/i-ver.png" width="40" alt=""><br><sub><b>Ver cartas</b><br>Voltea un momento todas las tapadas</sub></td></tr>
<tr><td align="center" width="20%"><img src="docs/img/i/i-llave.png" width="40" alt=""><br><sub><b>Llave maestra</b><br>Abre todos los candados y cortinas</sub></td><td align="center" width="20%"><img src="docs/img/i/i-tele.png" width="40" alt=""><br><sub><b>Telescopio</b><br>Deja ver todo el tablero 5 turnos</sub></td><td align="center" width="20%"><img src="docs/img/i/i-iman.png" width="40" alt=""><br><sub><b>Imán</b><br>Tu siguiente robo saca la carta que más te sirve</sub></td><td align="center" width="20%"><img src="docs/img/i/i-varita.png" width="40" alt=""><br><sub><b>Varita</b><br>Súbele o bájale hasta 3 a una carta</sub></td><td align="center" width="20%"><img src="docs/img/i/i-burbuja.png" width="40" alt=""><br><sub><b>Burbuja</b><br>Tu siguiente robo no corta la racha</sub></td></tr>
<tr><td align="center" width="20%"><img src="docs/img/i/i-astro.png" width="40" alt=""><br><sub><b>Astronauta</b><br>Peter guarda una carta y la lleva al descarte cuando conecte</sub></td><td align="center" width="20%"><img src="docs/img/i/i-laser.png" width="40" alt=""><br><sub><b>Láser</b><br>Rompe las piedras de los asteroides</sub></td><td align="center" width="20%"><img src="docs/img/i/i-escudo.png" width="40" alt=""><br><sub><b>Escudo</b><br>La nave ladrona ya no te roba</sub></td></tr>
</table>

> [!TIP]
> Todos los niveles se pueden ganar **sin ayudas**: el juego arma cada tablero al momento y comprueba con un solucionador que tenga salida.

---

## <img src="docs/img/i/i-planeta.png" width="30" alt=""> El viaje: universo, constelaciones y planetas

<p align="center">
  <img src="docs/img/mapa.png" width="620" alt="Mapa 3D de constelaciones y la ventana Tu camino">
</p>

| | |
|:-:|---|
| <img src="docs/img/i/i-planeta.png" width="30" alt=""> | El universo tiene **52 constelaciones**, cada una con **10 planetas** de **10 niveles**: **5,200 niveles** |
| <img src="docs/img/i/i-rocket.png" width="30" alt=""> | El mapa es **3D** (Three.js, estilo caricatura). Tu **viajero** (un cohete o la nave que escojas) flota sobre donde vas |
| <img src="docs/img/i/i-boleto.png" width="30" alt=""> | Entrar a un nivel nuevo cuesta **boletos**; ganarlo te los devuelve |
| <img src="docs/img/i/i-dorado.png" width="30" alt=""> | Cada constelación termina en un **jefe** que te da el **boleto dorado** para abrir el siguiente mundo |
| <img src="docs/img/i/i-secreto.png" width="30" alt=""> | Con **30 de 30 estrellas** en un planeta se abre su **nivel secreto** |
| <img src="docs/img/i/i-album.png" width="30" alt=""> | Cada planeta tiene su **mesa** (madera, hielo, metal…) y su postal para el **álbum** |

---

<a id="camino"></a>

## <img src="docs/img/i/i-camino.png" width="30" alt=""> Tu camino

Todo llega en niveles que terminan en 1 (los jefes, en los que terminan en 00), para que cada avance se sienta. Es la misma lista que el **Recuento** del modo dev. Toca cada tramo para abrirlo.

<sub>🃏 Carta especial · 🟪 Mesa · 👾 Jefe · 🎉 Evento — pasa el mouse sobre los iconitos para ver su nombre y fecha.</sub>

<details open>
<summary><b>Niveles 1–100</b> · Constelación 1 · aprendes lo básico &nbsp;<img src="docs/img/i/c-candado.png" width="22" alt=""><img src="docs/img/i/c-carta-regalo.png" width="22" alt=""><img src="docs/img/i/m-mesa-enrollada.png" width="22" alt=""><img src="docs/img/i/c-hielo.png" width="22" alt=""><img src="docs/img/i/c-telescopio.png" width="22" alt=""><img src="docs/img/i/j-fenix-estelar.png" width="22" alt=""></summary>

<table>
<tr><th></th><th>Nivel</th><th>Tipo</th><th align="left">Qué llega</th></tr>
<tr><td align="center"><img src="docs/img/i/c-candado.png" width="40" alt=""></td><td align="center"><b>11</b></td><td nowrap>🃏 Carta</td><td><b>Candado</b><br><sub>No se juega hasta que juegues la carta con la <b>llave</b> de su color</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-construir-con-estrellas.png" width="36" alt=""></td><td align="center"><b>21</b></td><td nowrap>🎉 Evento</td><td><b>Construir con estrellas</b><br><sub>Cada estrella nueva es un <b>bloque</b>: arma una estación de 5 piezas en cada planeta</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-carta-regalo.png" width="40" alt=""></td><td align="center"><b>21</b></td><td nowrap>🃏 Carta</td><td><b>Carta regalo</b><br><sub>Destápala y mete cartas extra a tu mazo</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-racha-cohete.png" width="36" alt=""></td><td align="center"><b>31</b></td><td nowrap>🎉 Evento</td><td><b>Racha cohete</b><br><sub>Gana niveles seguidos y junta premios cada vez más grandes</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-misiones-del-dia.png" width="36" alt=""></td><td align="center"><b>41</b></td><td nowrap>🎉 Evento</td><td><b>Misiones del día</b><br><sub>3 misiones al día con su cofre; cambian a medianoche</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-logros.png" width="36" alt=""></td><td align="center"><b>51</b></td><td nowrap>🎉 Evento</td><td><b>Logros</b><br><sub>Para siempre, con medallas de bronce a diamante</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/m-mesa-enrollada.png" width="36" alt=""></td><td align="center"><b>51</b></td><td nowrap>🟪 Mesa</td><td><b>Mesa enrollada</b><br><sub>Llega enrollada: limpia las primeras cartas y salen más del rollo</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-carrera-de-7.png" width="36" alt=""></td><td align="center"><b>61</b></td><td nowrap>🎉 Evento</td><td><b>Carrera de 7</b><br><sub>Gana 7 niveles nuevos seguidos contra 4 viajeros; el podio va por estrellas</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-hielo.png" width="40" alt=""></td><td align="center"><b>71</b></td><td nowrap>🃏 Carta</td><td><b>Hielo</b><br><sub>Se derrite: cada carta que juegas le quita 1</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-lluvia-de-meteoritos.png" width="36" alt=""></td><td align="center"><b>81</b></td><td nowrap>🎉 Evento</td><td><b>Lluvia de meteoritos</b><br><sub>2 o 3 veces por semana, 30 min sin aviso: boletos a mitad y premios propios</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-telescopio.png" width="40" alt=""></td><td align="center"><b>81</b></td><td nowrap>🃏 Carta</td><td><b>Telescopio</b><br><sub>Por 3 turnos se ven todas las cartas, también las tapadas</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-colecciones.png" width="36" alt=""></td><td align="center"><b>91</b></td><td nowrap>🎉 Evento</td><td><b>Colecciones</b><br><sub>Semanas temáticas: juntas fichas y las cambias por exclusivos (2 semanas al mes)</sub><br><img src="docs/img/i/s-tesoros-del-mar.png" width="24" title="Tesoros del mar" alt="Tesoros del mar"> <img src="docs/img/i/s-cueva-de-gemas.png" width="24" title="Cueva de gemas" alt="Cueva de gemas"> <img src="docs/img/i/s-bosque-encantado.png" width="24" title="Bosque encantado" alt="Bosque encantado"> <img src="docs/img/i/s-feria-de-dulces.png" width="24" title="Feria de dulces" alt="Feria de dulces"></td></tr>
<tr><td align="center"><img src="docs/img/i/j-fenix-estelar.png" width="36" alt=""></td><td align="center"><b>100</b></td><td nowrap>👾 Jefe</td><td><b>Fénix estelar</b><br><sub>Cae fuego sobre las libres y tapa sus números</sub></td></tr>
</table>

</details>

<details open>
<summary><b>Niveles 101–200</b> · Constelación 2 · llegan los eventos &nbsp;<img src="docs/img/i/m-gravedad.png" width="22" alt=""><img src="docs/img/i/c-cartas-gemelas.png" width="22" alt=""><img src="docs/img/i/c-carta-doble.png" width="22" alt=""><img src="docs/img/i/m-nebulosa.png" width="22" alt=""><img src="docs/img/i/c-astronauta.png" width="22" alt=""><img src="docs/img/i/c-flecha.png" width="22" alt=""></summary>

<table>
<tr><th></th><th>Nivel</th><th>Tipo</th><th align="left">Qué llega</th></tr>
<tr><td align="center"><img src="docs/img/i/e-apuesta-hasta-2.png" width="36" alt=""></td><td align="center"><b>101</b></td><td nowrap>🎉 Evento</td><td><b>Apuesta hasta ×2</b><br><sub>Apuesta tus boletos para ganar más</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/m-gravedad.png" width="36" alt=""></td><td align="center"><b>101</b></td><td nowrap>🟪 Mesa</td><td><b>Gravedad</b><br><sub>Cartas en columnas: solo juegas la de abajo y la columna cae</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-tripulacion-lunar.png" width="36" alt=""></td><td align="center"><b>111</b></td><td nowrap>🎉 Evento</td><td><b>Tripulación lunar</b><br><sub>Cada semana juntas estrellas con 4 viajeros para 3 bases con cofre</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-lluvia-de-estrellas.png" width="36" alt=""></td><td align="center"><b>121</b></td><td nowrap>🎉 Evento</td><td><b>Lluvia de estrellas</b><br><sub>15 min sin aviso: monedas ×3 y hasta 3 premios</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-cartas-gemelas.png" width="40" alt=""></td><td align="center"><b>121</b></td><td nowrap>🃏 Carta</td><td><b>Cartas gemelas</b><br><sub>Atadas con lazo: al jugar una, la otra cae al descarte</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-eventos-del-mes.png" width="36" alt=""></td><td align="center"><b>131</b></td><td nowrap>🎉 Evento</td><td><b>Eventos del mes</b><br><sub>25 niveles en 5 planetas con la temática del mes</sub><br><img src="docs/img/i/s-dia-de-reyes.png" width="24" title="Día de Reyes · ene" alt="Día de Reyes"> <img src="docs/img/i/s-amor-y-amistad.png" width="24" title="Amor y Amistad · feb" alt="Amor y Amistad"> <img src="docs/img/i/s-primavera.png" width="24" title="Primavera · abr" alt="Primavera"> <img src="docs/img/i/s-verano.png" width="24" title="Verano · jul" alt="Verano"> <img src="docs/img/i/s-fiestas-patrias.png" width="24" title="Fiestas Patrias · sep" alt="Fiestas Patrias"> <img src="docs/img/i/s-halloween.png" width="24" title="Halloween · oct" alt="Halloween"> <img src="docs/img/i/s-dia-de-muertos.png" width="24" title="Día de Muertos · nov" alt="Día de Muertos"> <img src="docs/img/i/s-navidad.png" width="24" title="Navidad · dic" alt="Navidad"></td></tr>
<tr><td align="center"><img src="docs/img/i/c-carta-doble.png" width="40" alt=""></td><td align="center"><b>131</b></td><td nowrap>🃏 Carta</td><td><b>Carta doble</b><br><sub>Vale dos números: entra con cualquiera</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-colecciones-nuevas-y-3-semana.png" width="36" alt=""></td><td align="center"><b>141</b></td><td nowrap>🎉 Evento</td><td><b>Colecciones nuevas y 3.ª semana</b><br><sub>Llegan dinosaurios y robots: colección 3 semanas al mes</sub><br><img src="docs/img/i/s-valle-de-los-dinosaurios.png" width="24" title="Valle de los dinosaurios" alt="Valle de los dinosaurios"> <img src="docs/img/i/s-taller-de-robots.png" width="24" title="Taller de robots" alt="Taller de robots"></td></tr>
<tr><td align="center"><img src="docs/img/i/m-nebulosa.png" width="36" alt=""></td><td align="center"><b>151</b></td><td nowrap>🟪 Mesa</td><td><b>Nebulosa</b><br><sub>Solo ves 3 grupos; vacía uno y de la nebulosa sale otro</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-lluvia-de-cometas.png" width="36" alt=""></td><td align="center"><b>161</b></td><td nowrap>🎉 Evento</td><td><b>Lluvia de cometas</b><br><sub>20 min: jugar no gasta boletos y cada victoria da 1 más</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-astronauta.png" width="40" alt=""></td><td align="center"><b>171</b></td><td nowrap>🃏 Carta</td><td><b>Astronauta</b><br><sub>Peter te guarda una carta y la manda al descarte cuando conecte</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-festividades-de-un-dia.png" width="36" alt=""></td><td align="center"><b>181</b></td><td nowrap>🎉 Evento</td><td><b>Festividades de un día</b><br><sub>Fiestas de un día, cada una con su arte y sus niveles</sub><br><img src="docs/img/i/s-ano-nuevo.png" width="24" title="Año Nuevo · 1 ene" alt="Año Nuevo"> <img src="docs/img/i/s-dia-de-la-candelaria.png" width="24" title="Día de la Candelaria · 2 feb" alt="Día de la Candelaria"> <img src="docs/img/i/s-dia-del-taco.png" width="24" title="Día del Taco · 31 mar" alt="Día del Taco"> <img src="docs/img/i/s-dia-de-la-tierra.png" width="24" title="Día de la Tierra · 22 abr" alt="Día de la Tierra"> <img src="docs/img/i/s-dia-del-nino.png" width="24" title="Día del Niño · 30 abr" alt="Día del Niño"> <img src="docs/img/i/s-dia-de-las-madres.png" width="24" title="Día de las Madres · 10 may" alt="Día de las Madres"> <img src="docs/img/i/s-dia-del-padre.png" width="24" title="Día del Padre · 21 jun" alt="Día del Padre"> <img src="docs/img/i/s-dia-del-gato.png" width="24" title="Día del Gato · 8 ago" alt="Día del Gato"> <img src="docs/img/i/s-dia-del-perro.png" width="24" title="Día del Perro · 26 ago" alt="Día del Perro"> <img src="docs/img/i/s-dia-del-gamer.png" width="24" title="Día del Gamer · 29 ago" alt="Día del Gamer"> <img src="docs/img/i/s-dia-del-programador.png" width="24" title="Día del Programador · 13 sep" alt="Día del Programador"> <img src="docs/img/i/s-dia-de-los-inocentes.png" width="24" title="Día de los Inocentes · 28 dic" alt="Día de los Inocentes"></td></tr>
<tr><td align="center"><img src="docs/img/i/c-flecha.png" width="40" alt=""></td><td align="center"><b>181</b></td><td nowrap>🃏 Carta</td><td><b>Flecha</b><br><sub>La siguiente jugada tiene que ser uno más (↑) o uno menos (↓)</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-colecciones-de-arte-musica-y-cine.png" width="36" alt=""></td><td align="center"><b>191</b></td><td nowrap>🎉 Evento</td><td><b>Colecciones de Arte, Música y Cine</b><br><sub>Arte, música y cine: ya hay colección todas las semanas</sub><br><img src="docs/img/i/s-taller-de-arte.png" width="24" title="Taller de arte" alt="Taller de arte"> <img src="docs/img/i/s-banda-musical.png" width="24" title="Banda musical" alt="Banda musical"> <img src="docs/img/i/s-estudio-de-cine.png" width="24" title="Estudio de cine" alt="Estudio de cine"></td></tr>
<tr><td align="center"><img src="docs/img/i/j-el-ilusionista.png" width="36" alt=""></td><td align="center"><b>200</b></td><td nowrap>👾 Jefe</td><td><b>El Ilusionista</b><br><sub>Cambia el número de todas las cartas boca arriba</sub></td></tr>
</table>

</details>

<details>
<summary><b>Niveles 201–300</b> · jefe: Medusa de plasma &nbsp;<img src="docs/img/i/m-hangar.png" width="22" alt=""><img src="docs/img/i/c-cometa.png" width="22" alt=""><img src="docs/img/i/c-cortina.png" width="22" alt=""><img src="docs/img/i/m-bitacora.png" width="22" alt=""><img src="docs/img/i/c-cohete-turbo.png" width="22" alt=""><img src="docs/img/i/c-bomba.png" width="22" alt=""></summary>

<table>
<tr><th></th><th>Nivel</th><th>Tipo</th><th align="left">Qué llega</th></tr>
<tr><td align="center"><img src="docs/img/i/e-aurora.png" width="36" alt=""></td><td align="center"><b>201</b></td><td nowrap>🎉 Evento</td><td><b>Aurora</b><br><sub>20 min con colección abierta: fichas ×2 y hasta 2 premios</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-apuesta-hasta-3.png" width="36" alt=""></td><td align="center"><b>201</b></td><td nowrap>🎉 Evento</td><td><b>Apuesta hasta ×3</b><br><sub>Ahora puedes apostar hasta ×3</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/m-hangar.png" width="36" alt=""></td><td align="center"><b>201</b></td><td nowrap>🟪 Mesa</td><td><b>Hangar</b><br><sub>Columnas que salen de un hangar; al vaciar una, se recorren</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-cometa.png" width="40" alt=""></td><td align="center"><b>221</b></td><td nowrap>🃏 Carta</td><td><b>Cometa</b><br><sub>Destápalo antes de que su cuenta llegue a 0 y suma racha</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-festividades-de-leyendas-mexicanas.png" width="36" alt=""></td><td align="center"><b>231</b></td><td nowrap>🎉 Evento</td><td><b>Festividades de leyendas mexicanas</b><br><sub>Leyendas: nahuales, chaneques, la Llorona, la Catrina…</sub><br><img src="docs/img/i/s-nahual-y-chaneques.png" width="24" title="Nahual y Chaneques · 21 sep · 3 días" alt="Nahual y Chaneques"> <img src="docs/img/i/s-dia-del-xoloitzcuintle.png" width="24" title="Día del Xoloitzcuintle · 27 oct" alt="Día del Xoloitzcuintle"> <img src="docs/img/i/s-la-llorona.png" width="24" title="La Llorona · 1 nov" alt="La Llorona"> <img src="docs/img/i/s-la-catrina.png" width="24" title="La Catrina · 2 nov" alt="La Catrina"> <img src="docs/img/i/s-dia-de-la-revolucion.png" width="24" title="Día de la Revolución · 20 nov" alt="Día de la Revolución"></td></tr>
<tr><td align="center"><img src="docs/img/i/c-cortina.png" width="40" alt=""></td><td align="center"><b>231</b></td><td nowrap>🃏 Carta</td><td><b>Cortina</b><br><sub>Sigue boca abajo hasta que juegues la carta del telón</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-lluvia-de-cristales.png" width="36" alt=""></td><td align="center"><b>241</b></td><td nowrap>🎉 Evento</td><td><b>Lluvia de cristales</b><br><sub>10 min cada dos semanas: cada victoria puede dar una ayuda</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/m-bitacora.png" width="36" alt=""></td><td align="center"><b>251</b></td><td nowrap>🟪 Mesa</td><td><b>Bitácora</b><br><sub>Hojas encimadas; por las escotillas se juega la de abajo</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-cohete-turbo.png" width="40" alt=""></td><td align="center"><b>271</b></td><td nowrap>🃏 Carta</td><td><b>Cohete turbo</b><br><sub>Tus 3 jugadas siguientes valen doble en la racha</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-fiestas-de-mexico.png" width="36" alt=""></td><td align="center"><b>281</b></td><td nowrap>🎉 Evento</td><td><b>Fiestas de México</b><br><sub>Bandera, equinoccio en las pirámides y las posadas</sub><br><img src="docs/img/i/s-dia-de-la-bandera.png" width="24" title="Día de la Bandera · 24 feb" alt="Día de la Bandera"> <img src="docs/img/i/s-equinoccio-de-primavera.png" width="24" title="Equinoccio de Primavera · 21 mar" alt="Equinoccio de Primavera"> <img src="docs/img/i/s-las-posadas.png" width="24" title="Las Posadas · 16 dic · 9 días" alt="Las Posadas"></td></tr>
<tr><td align="center"><img src="docs/img/i/c-bomba.png" width="40" alt=""></td><td align="center"><b>281</b></td><td nowrap>🃏 Carta</td><td><b>Bomba</b><br><sub>Destápala antes de 0 o quema 3 cartas de tu mazo</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/j-medusa-de-plasma.png" width="36" alt=""></td><td align="center"><b>300</b></td><td nowrap>👾 Jefe</td><td><b>Medusa de plasma</b><br><sub>Chispas: esas cartas solo entran sobre una de su color</sub></td></tr>
</table>

</details>

<details>
<summary><b>Niveles 301–400</b> · jefe: Viento solar &nbsp;<img src="docs/img/i/m-marea.png" width="22" alt=""><img src="docs/img/i/c-boleto-partido.png" width="22" alt=""><img src="docs/img/i/c-carta-viva.png" width="22" alt=""><img src="docs/img/i/m-agujero-negro.png" width="22" alt=""><img src="docs/img/i/c-carta-moneda.png" width="22" alt=""><img src="docs/img/i/c-fantasma.png" width="22" alt=""></summary>

<table>
<tr><th></th><th>Nivel</th><th>Tipo</th><th align="left">Qué llega</th></tr>
<tr><td align="center"><img src="docs/img/i/e-apuesta-hasta-5.png" width="36" alt=""></td><td align="center"><b>301</b></td><td nowrap>🎉 Evento</td><td><b>Apuesta hasta ×5</b><br><sub>Ahora puedes apostar hasta ×5</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/m-marea.png" width="36" alt=""></td><td align="center"><b>301</b></td><td nowrap>🟪 Mesa</td><td><b>Marea</b><br><sub>Si robas mucho sube el agua y tapa las de abajo</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-boleto-partido.png" width="40" alt=""></td><td align="center"><b>321</b></td><td nowrap>🃏 Carta</td><td><b>Boleto partido</b><br><sub>Dos mitades: juega una y la otra se queda</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-fiestas-de-america.png" width="36" alt=""></td><td align="center"><b>331</b></td><td nowrap>🎉 Evento</td><td><b>Fiestas de América</b><br><sub>De Bolivia a Rapa Nui, de Oaxaca a Colombia</sub><br><img src="docs/img/i/s-alasitas.png" width="24" title="Alasitas · 24 ene" alt="Alasitas"> <img src="docs/img/i/s-tapati-rapa-nui.png" width="24" title="Tapati Rapa Nui · 1 feb" alt="Tapati Rapa Nui"> <img src="docs/img/i/s-carnaval.png" width="24" title="Carnaval · 14 feb · 4 días" alt="Carnaval"> <img src="docs/img/i/s-dia-del-boyero.png" width="24" title="Día del Boyero · 8 mar" alt="Día del Boyero"> <img src="docs/img/i/s-guelaguetza.png" width="24" title="Guelaguetza · 20 jul" alt="Guelaguetza"> <img src="docs/img/i/s-dia-de-los-papalotes.png" width="24" title="Día de los Papalotes · 18 sep" alt="Día de los Papalotes"> <img src="docs/img/i/s-dia-del-dulce-de-leche.png" width="24" title="Día del Dulce de Leche · 11 oct" alt="Día del Dulce de Leche"> <img src="docs/img/i/s-dia-de-la-pupusa.png" width="24" title="Día de la Pupusa · 8 nov" alt="Día de la Pupusa"> <img src="docs/img/i/s-dia-de-las-velitas.png" width="24" title="Día de las Velitas · 7 dic" alt="Día de las Velitas"> <img src="docs/img/i/s-ano-viejo.png" width="24" title="Año Viejo · 31 dic" alt="Año Viejo"></td></tr>
<tr><td align="center"><img src="docs/img/i/c-carta-viva.png" width="40" alt=""></td><td align="center"><b>331</b></td><td nowrap>🃏 Carta</td><td><b>Carta viva</b><br><sub>Su número sube o baja con cada turno</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/m-agujero-negro.png" width="36" alt=""></td><td align="center"><b>351</b></td><td nowrap>🟪 Mesa</td><td><b>Agujero negro</b><br><sub>Se traga las cartas y las escupe con los números revueltos</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-carta-moneda.png" width="40" alt=""></td><td align="center"><b>371</b></td><td nowrap>🃏 Carta</td><td><b>Carta moneda</b><br><sub>Se juega normal y te da monedas</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-fiestas-de-europa.png" width="36" alt=""></td><td align="center"><b>381</b></td><td nowrap>🎉 Evento</td><td><b>Fiestas de Europa</b><br><sub>Vikingos, Las Fallas, San Patricio, Midsommar…</sub><br><img src="docs/img/i/s-up-helly-aa.png" width="24" title="Up Helly Aa · 27 ene" alt="Up Helly Aa"> <img src="docs/img/i/s-san-patricio.png" width="24" title="San Patricio · 17 mar" alt="San Patricio"> <img src="docs/img/i/s-las-fallas.png" width="24" title="Las Fallas · 19 mar" alt="Las Fallas"> <img src="docs/img/i/s-sant-jordi.png" width="24" title="Sant Jordi · 23 abr" alt="Sant Jordi"> <img src="docs/img/i/s-dia-del-rey.png" width="24" title="Día del Rey · 27 abr" alt="Día del Rey"> <img src="docs/img/i/s-midsommar.png" width="24" title="Midsommar · 19 jun" alt="Midsommar"> <img src="docs/img/i/s-fiesta-de-los-globos.png" width="24" title="Fiesta de los Globos · 10 ago · 4 días" alt="Fiesta de los Globos"> <img src="docs/img/i/s-alfombra-de-flores.png" width="24" title="Alfombra de Flores · 15 ago" alt="Alfombra de Flores"> <img src="docs/img/i/s-regata-historica.png" width="24" title="Regata Histórica · 6 sep" alt="Regata Histórica"> <img src="docs/img/i/s-bajada-de-las-vacas.png" width="24" title="Bajada de las Vacas · 3 oct" alt="Bajada de las Vacas"></td></tr>
<tr><td align="center"><img src="docs/img/i/c-fantasma.png" width="40" alt=""></td><td align="center"><b>381</b></td><td nowrap>🃏 Carta</td><td><b>Fantasma</b><br><sub>Aparece y desaparece; solo se juega cuando se ve</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/j-viento-solar.png" width="36" alt=""></td><td align="center"><b>400</b></td><td nowrap>👾 Jefe</td><td><b>Viento solar</b><br><sub>Sopla y se lleva cartas de tu descarte</sub></td></tr>
</table>

</details>

<details>
<summary><b>Niveles 401–500</b> · jefe: Mano alien &nbsp;<img src="docs/img/i/m-puertas.png" width="22" alt=""><img src="docs/img/i/c-camaleon.png" width="22" alt=""><img src="docs/img/i/c-nave-ladrona.png" width="22" alt=""><img src="docs/img/i/m-banda-transportadora.png" width="22" alt=""><img src="docs/img/i/c-rayo.png" width="22" alt=""><img src="docs/img/i/c-constelacion.png" width="22" alt=""></summary>

<table>
<tr><th></th><th>Nivel</th><th>Tipo</th><th align="left">Qué llega</th></tr>
<tr><td align="center"><img src="docs/img/i/e-apuesta-hasta-7.png" width="36" alt=""></td><td align="center"><b>401</b></td><td nowrap>🎉 Evento</td><td><b>Apuesta hasta ×7</b><br><sub>Ahora puedes apostar hasta ×7</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/m-puertas.png" width="36" alt=""></td><td align="center"><b>401</b></td><td nowrap>🟪 Mesa</td><td><b>Puertas</b><br><sub>Juega una carta llave y escoge qué puerta abrir</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-camaleon.png" width="40" alt=""></td><td align="center"><b>421</b></td><td nowrap>🃏 Carta</td><td><b>Camaleón</b><br><sub>Cada 3 turnos se vuelve comodín</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/e-fiestas-de-oriente.png" width="36" alt=""></td><td align="center"><b>431</b></td><td nowrap>🎉 Evento</td><td><b>Fiestas de Oriente</b><br><sub>Songkran, Tanabata, Naadam, el banquete de los monos…</sub><br><img src="docs/img/i/s-festival-de-hielo.png" width="24" title="Festival de Hielo · 5 ene" alt="Festival de Hielo"> <img src="docs/img/i/s-pongal.png" width="24" title="Pongal · 14 ene" alt="Pongal"> <img src="docs/img/i/s-songkran.png" width="24" title="Songkran · 13 abr · 3 días" alt="Songkran"> <img src="docs/img/i/s-kodomo-no-hi.png" width="24" title="Kodomo no Hi · 5 may" alt="Kodomo no Hi"> <img src="docs/img/i/s-pahiyas.png" width="24" title="Pahiyas · 15 may" alt="Pahiyas"> <img src="docs/img/i/s-tanabata.png" width="24" title="Tanabata · 7 jul" alt="Tanabata"> <img src="docs/img/i/s-naadam.png" width="24" title="Naadam · 11 jul" alt="Naadam"> <img src="docs/img/i/s-festival-del-lodo.png" width="24" title="Festival del Lodo · 18 jul" alt="Festival del Lodo"> <img src="docs/img/i/s-medio-otono.png" width="24" title="Medio Otoño · 17 sep" alt="Medio Otoño"> <img src="docs/img/i/s-banquete-de-los-monos.png" width="24" title="Banquete de los Monos · 29 nov" alt="Banquete de los Monos"> <img src="docs/img/i/s-festival-del-calao.png" width="24" title="Festival del Cálao · 1 dic" alt="Festival del Cálao"></td></tr>
<tr><td align="center"><img src="docs/img/i/c-nave-ladrona.png" width="40" alt=""></td><td align="center"><b>431</b></td><td nowrap>🃏 Carta</td><td><b>Nave ladrona</b><br><sub>Se lleva cartas de tu mazo; con racha de 4 te regresa la última</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/m-banda-transportadora.png" width="36" alt=""></td><td align="center"><b>451</b></td><td nowrap>🟪 Mesa</td><td><b>Banda transportadora</b><br><sub>Las cartas dan vueltas: ¡atrápalas cuando pasen!</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-rayo.png" width="40" alt=""></td><td align="center"><b>471</b></td><td nowrap>🃏 Carta</td><td><b>Rayo</b><br><sub>Manda de 1 a 3 cartas enterradas a tu mazo</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-constelacion.png" width="40" alt=""></td><td align="center"><b>481</b></td><td nowrap>🃏 Carta</td><td><b>Constelación</b><br><sub>Juega todas las de estrellita seguidas y ganas premio</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/j-mano-alien.png" width="36" alt=""></td><td align="center"><b>500</b></td><td nowrap>👾 Jefe</td><td><b>Mano alien</b><br><sub>Se lleva cartas de arriba de tu mazo</sub></td></tr>
</table>

</details>

<details>
<summary><b>Niveles 501–600</b> · jefe: Kraken &nbsp;<img src="docs/img/i/m-asteroides.png" width="22" alt=""><img src="docs/img/i/c-enredadera.png" width="22" alt=""><img src="docs/img/i/c-iman.png" width="22" alt=""><img src="docs/img/i/m-grua-de-feria.png" width="22" alt=""><img src="docs/img/i/c-arcoiris.png" width="22" alt=""><img src="docs/img/i/c-carta-dormida.png" width="22" alt=""></summary>

<table>
<tr><th></th><th>Nivel</th><th>Tipo</th><th align="left">Qué llega</th></tr>
<tr><td align="center"><img src="docs/img/i/e-apuesta-hasta-10.png" width="36" alt=""></td><td align="center"><b>501</b></td><td nowrap>🎉 Evento</td><td><b>Apuesta hasta ×10</b><br><sub>Ahora puedes apostar hasta ×10</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/m-asteroides.png" width="36" alt=""></td><td align="center"><b>501</b></td><td nowrap>🟪 Mesa</td><td><b>Asteroides</b><br><sub>Cada 4 robos caen piedras que tapan cartas</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-enredadera.png" width="40" alt=""></td><td align="center"><b>521</b></td><td nowrap>🃏 Carta</td><td><b>Enredadera</b><br><sub>Crece y tapa cartas; la carta de fuego la quema</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-iman.png" width="40" alt=""></td><td align="center"><b>531</b></td><td nowrap>🃏 Carta</td><td><b>Imán</b><br><sub>Tu siguiente robo saca la carta que más te sirve</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/m-grua-de-feria.png" width="36" alt=""></td><td align="center"><b>551</b></td><td nowrap>🟪 Mesa</td><td><b>Grúa de feria</b><br><sub>Las grúas jalan columnas: juegas la de hasta arriba</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-arcoiris.png" width="40" alt=""></td><td align="center"><b>571</b></td><td nowrap>🃏 Carta</td><td><b>Arcoíris</b><br><sub>Tus 3 jugadas siguientes pueden saltar dos (del 6 al 8)</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-carta-dormida.png" width="40" alt=""></td><td align="center"><b>581</b></td><td nowrap>🃏 Carta</td><td><b>Carta dormida</b><br><sub>Despierta cuando llevas su número de cartas seguidas</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/j-kraken.png" width="36" alt=""></td><td align="center"><b>600</b></td><td nowrap>👾 Jefe</td><td><b>Kraken</b><br><sub>Salpica tinta y bloquea cartas</sub></td></tr>
</table>

</details>

<details>
<summary><b>Niveles 601–700</b> · jefe: Ballena glotona &nbsp;<img src="docs/img/i/m-mesa-que-se-voltea.png" width="22" alt=""><img src="docs/img/i/c-domino.png" width="22" alt=""><img src="docs/img/i/c-boleto-triple.png" width="22" alt=""><img src="docs/img/i/m-cohete.png" width="22" alt=""><img src="docs/img/i/c-lazo.png" width="22" alt=""><img src="docs/img/i/c-varita.png" width="22" alt=""></summary>

<table>
<tr><th></th><th>Nivel</th><th>Tipo</th><th align="left">Qué llega</th></tr>
<tr><td align="center"><img src="docs/img/i/e-apuesta-hasta-13.png" width="36" alt=""></td><td align="center"><b>601</b></td><td nowrap>🎉 Evento</td><td><b>Apuesta hasta ×13</b><br><sub>Ahora puedes apostar hasta ×13</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/m-mesa-que-se-voltea.png" width="36" alt=""></td><td align="center"><b>601</b></td><td nowrap>🟪 Mesa</td><td><b>Mesa que se voltea</b><br><sub>Una cápsula que da media vuelta cada 5 turnos</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-domino.png" width="40" alt=""></td><td align="center"><b>621</b></td><td nowrap>🃏 Carta</td><td><b>Dominó</b><br><sub>Dos números: entra por uno y queda el otro</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-boleto-triple.png" width="40" alt=""></td><td align="center"><b>631</b></td><td nowrap>🃏 Carta</td><td><b>Boleto triple</b><br><sub>Tres talones que se arrancan por las puntas</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/m-cohete.png" width="36" alt=""></td><td align="center"><b>651</b></td><td nowrap>🟪 Mesa</td><td><b>Cohete</b><br><sub>Un cohete larguísimo; cada tramo vacío regala monedas</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-lazo.png" width="40" alt=""></td><td align="center"><b>671</b></td><td nowrap>🃏 Carta</td><td><b>Lazo</b><br><sub>Escoge cualquier carta y va directo al descarte</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-varita.png" width="40" alt=""></td><td align="center"><b>681</b></td><td nowrap>🃏 Carta</td><td><b>Varita</b><br><sub>Súbele o bájale hasta 3 a una carta libre</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/j-ballena-glotona.png" width="36" alt=""></td><td align="center"><b>700</b></td><td nowrap>👾 Jefe</td><td><b>Ballena glotona</b><br><sub>Se traga cartas y luego las escupe encima de otras</sub></td></tr>
</table>

</details>

<details>
<summary><b>Niveles 701–800</b> · jefe: Reloj del vacío &nbsp;<img src="docs/img/i/m-gravedad-cero.png" width="22" alt=""><img src="docs/img/i/c-candado-de-palo.png" width="22" alt=""><img src="docs/img/i/c-pintura.png" width="22" alt=""><img src="docs/img/i/m-planetas-en-orbita.png" width="22" alt=""><img src="docs/img/i/c-cartas-con-cable.png" width="22" alt=""><img src="docs/img/i/c-espejo.png" width="22" alt=""></summary>

<table>
<tr><th></th><th>Nivel</th><th>Tipo</th><th align="left">Qué llega</th></tr>
<tr><td align="center"><img src="docs/img/i/e-apuesta-hasta-15.png" width="36" alt=""></td><td align="center"><b>701</b></td><td nowrap>🎉 Evento</td><td><b>Apuesta hasta ×15</b><br><sub>Ahora puedes apostar hasta ×15</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/m-gravedad-cero.png" width="36" alt=""></td><td align="center"><b>701</b></td><td nowrap>🟪 Mesa</td><td><b>Gravedad cero</b><br><sub>Las cartas flotan y caen encima de otras</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-candado-de-palo.png" width="40" alt=""></td><td align="center"><b>721</b></td><td nowrap>🃏 Carta</td><td><b>Candado de palo</b><br><sub>Cada carta de su palo rompe una cadena</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-pintura.png" width="40" alt=""></td><td align="center"><b>731</b></td><td nowrap>🃏 Carta</td><td><b>Pintura</b><br><sub>3 seguidas del mismo color y la brocha pinta otra</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/m-planetas-en-orbita.png" width="36" alt=""></td><td align="center"><b>751</b></td><td nowrap>🟪 Mesa</td><td><b>Planetas en órbita</b><br><sub>Los planetas giran y tapan cartas</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-cartas-con-cable.png" width="40" alt=""></td><td align="center"><b>771</b></td><td nowrap>🃏 Carta</td><td><b>Cartas con cable</b><br><sub>Al jugar una, el cable jala a la otra</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-espejo.png" width="40" alt=""></td><td align="center"><b>781</b></td><td nowrap>🃏 Carta</td><td><b>Espejo</b><br><sub>En el descarte vale su opuesto: A↔K, 2↔Q…</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/j-reloj-del-vacio.png" width="36" alt=""></td><td align="center"><b>800</b></td><td nowrap>👾 Jefe</td><td><b>Reloj del vacío</b><br><sub>Rebobina: tus últimas cartas vuelven a la mesa congeladas</sub></td></tr>
</table>

</details>

<details>
<summary><b>Niveles 801–900</b> &nbsp;<img src="docs/img/i/m-meteoro-fugaz.png" width="22" alt=""><img src="docs/img/i/c-eco.png" width="22" alt=""><img src="docs/img/i/c-burbuja-de-racha.png" width="22" alt=""><img src="docs/img/i/m-cartas-al-vuelo.png" width="22" alt=""><img src="docs/img/i/c-clon.png" width="22" alt=""></summary>

<table>
<tr><th></th><th>Nivel</th><th>Tipo</th><th align="left">Qué llega</th></tr>
<tr><td align="center"><img src="docs/img/i/m-meteoro-fugaz.png" width="36" alt=""></td><td align="center"><b>801</b></td><td nowrap>🟪 Mesa</td><td><b>Meteoro fugaz</b><br><sub>Cruza un meteoro y voltea el orden de las cartas</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-eco.png" width="40" alt=""></td><td align="center"><b>821</b></td><td nowrap>🃏 Carta</td><td><b>Eco</b><br><sub>La siguiente jugada también puede ser del mismo número</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-burbuja-de-racha.png" width="40" alt=""></td><td align="center"><b>831</b></td><td nowrap>🃏 Carta</td><td><b>Burbuja de racha</b><br><sub>Tu siguiente robo revienta la burbuja y no tu racha</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/m-cartas-al-vuelo.png" width="36" alt=""></td><td align="center"><b>851</b></td><td nowrap>🟪 Mesa</td><td><b>Cartas al vuelo</b><br><sub>Cada hueco esconde una pila que llega volando</sub></td></tr>
<tr><td align="center"><img src="docs/img/i/c-clon.png" width="40" alt=""></td><td align="center"><b>871</b></td><td nowrap>🃏 Carta</td><td><b>Clon</b><br><sub>Copia a la carta de al lado</sub></td></tr>
</table>

</details>

Después del 900 todo se sigue mezclando, los jefes se turnan y cada vuelta vuelven con más vida.

---

<a id="cartas"></a>

## <img src="docs/img/i/c-carta-doble.png" width="30" alt=""> Cartas especiales

Llegan de dos en dos entre cada mesa y se presentan con su ventana la primera vez.

#### 🔒 Se abren después

<table>
<tr><td align="center" width="16%"><img src="docs/img/i/c-candado.png" width="44" alt=""><br><sub><b>Candado</b><br>nivel 11</sub></td><td align="center" width="16%"><img src="docs/img/i/c-hielo.png" width="44" alt=""><br><sub><b>Hielo</b><br>nivel 71</sub></td><td align="center" width="16%"><img src="docs/img/i/c-cortina.png" width="44" alt=""><br><sub><b>Cortina</b><br>nivel 231</sub></td><td align="center" width="16%"><img src="docs/img/i/c-enredadera.png" width="44" alt=""><br><sub><b>Enredadera</b><br>nivel 521</sub></td><td align="center" width="16%"><img src="docs/img/i/c-carta-dormida.png" width="44" alt=""><br><sub><b>Carta dormida</b><br>nivel 581</sub></td><td align="center" width="16%"><img src="docs/img/i/c-candado-de-palo.png" width="44" alt=""><br><sub><b>Candado de palo</b><br>nivel 721</sub></td></tr>
</table>

#### 🔄 Cambian con los turnos

<table>
<tr><td align="center" width="16%"><img src="docs/img/i/c-carta-viva.png" width="44" alt=""><br><sub><b>Carta viva</b><br>nivel 331</sub></td><td align="center" width="16%"><img src="docs/img/i/c-fantasma.png" width="44" alt=""><br><sub><b>Fantasma</b><br>nivel 381</sub></td><td align="center" width="16%"><img src="docs/img/i/c-camaleon.png" width="44" alt=""><br><sub><b>Camaleón</b><br>nivel 421</sub></td><td align="center" width="16%"><img src="docs/img/i/c-clon.png" width="44" alt=""><br><sub><b>Clon</b><br>nivel 871</sub></td></tr>
</table>

#### 🎯 Cambian las reglas

<table>
<tr><td align="center" width="16%"><img src="docs/img/i/c-cartas-gemelas.png" width="44" alt=""><br><sub><b>Cartas gemelas</b><br>nivel 121</sub></td><td align="center" width="16%"><img src="docs/img/i/c-carta-doble.png" width="44" alt=""><br><sub><b>Carta doble</b><br>nivel 131</sub></td><td align="center" width="16%"><img src="docs/img/i/c-flecha.png" width="44" alt=""><br><sub><b>Flecha</b><br>nivel 181</sub></td><td align="center" width="16%"><img src="docs/img/i/c-boleto-partido.png" width="44" alt=""><br><sub><b>Boleto partido</b><br>nivel 321</sub></td><td align="center" width="16%"><img src="docs/img/i/c-domino.png" width="44" alt=""><br><sub><b>Dominó</b><br>nivel 621</sub></td><td align="center" width="16%"><img src="docs/img/i/c-boleto-triple.png" width="44" alt=""><br><sub><b>Boleto triple</b><br>nivel 631</sub></td></tr>
<tr><td align="center" width="16%"><img src="docs/img/i/c-cartas-con-cable.png" width="44" alt=""><br><sub><b>Cartas con cable</b><br>nivel 771</sub></td><td align="center" width="16%"><img src="docs/img/i/c-espejo.png" width="44" alt=""><br><sub><b>Espejo</b><br>nivel 781</sub></td><td align="center" width="16%"><img src="docs/img/i/c-eco.png" width="44" alt=""><br><sub><b>Eco</b><br>nivel 821</sub></td></tr>
</table>

#### ⏳ No se juegan

<table>
<tr><td align="center" width="16%"><img src="docs/img/i/c-carta-regalo.png" width="44" alt=""><br><sub><b>Carta regalo</b><br>nivel 21</sub></td><td align="center" width="16%"><img src="docs/img/i/c-cometa.png" width="44" alt=""><br><sub><b>Cometa</b><br>nivel 221</sub></td><td align="center" width="16%"><img src="docs/img/i/c-bomba.png" width="44" alt=""><br><sub><b>Bomba</b><br>nivel 281</sub></td></tr>
</table>

#### ✨ Te ayudan

<table>
<tr><td align="center" width="16%"><img src="docs/img/i/c-telescopio.png" width="44" alt=""><br><sub><b>Telescopio</b><br>nivel 81</sub></td><td align="center" width="16%"><img src="docs/img/i/c-cohete-turbo.png" width="44" alt=""><br><sub><b>Cohete turbo</b><br>nivel 271</sub></td><td align="center" width="16%"><img src="docs/img/i/c-carta-moneda.png" width="44" alt=""><br><sub><b>Carta moneda</b><br>nivel 371</sub></td><td align="center" width="16%"><img src="docs/img/i/c-rayo.png" width="44" alt=""><br><sub><b>Rayo</b><br>nivel 471</sub></td><td align="center" width="16%"><img src="docs/img/i/c-constelacion.png" width="44" alt=""><br><sub><b>Constelación</b><br>nivel 481</sub></td><td align="center" width="16%"><img src="docs/img/i/c-iman.png" width="44" alt=""><br><sub><b>Imán</b><br>nivel 531</sub></td></tr>
<tr><td align="center" width="16%"><img src="docs/img/i/c-arcoiris.png" width="44" alt=""><br><sub><b>Arcoíris</b><br>nivel 571</sub></td><td align="center" width="16%"><img src="docs/img/i/c-lazo.png" width="44" alt=""><br><sub><b>Lazo</b><br>nivel 671</sub></td><td align="center" width="16%"><img src="docs/img/i/c-varita.png" width="44" alt=""><br><sub><b>Varita</b><br>nivel 681</sub></td><td align="center" width="16%"><img src="docs/img/i/c-pintura.png" width="44" alt=""><br><sub><b>Pintura</b><br>nivel 731</sub></td><td align="center" width="16%"><img src="docs/img/i/c-burbuja-de-racha.png" width="44" alt=""><br><sub><b>Burbuja de racha</b><br>nivel 831</sub></td></tr>
</table>

#### 🚀 Visitas

<table>
<tr><td align="center" width="16%"><img src="docs/img/i/c-astronauta.png" width="44" alt=""><br><sub><b>Astronauta</b><br>nivel 171</sub></td><td align="center" width="16%"><img src="docs/img/i/c-nave-ladrona.png" width="44" alt=""><br><sub><b>Nave ladrona</b><br>nivel 431</sub></td></tr>
</table>

👉 Qué hace cada una: **[docs/cartas-mesas-jefes.md](docs/cartas-mesas-jefes.md)**

---

<a id="mesas"></a>

## <img src="docs/img/i/m-gravedad.png" width="30" alt=""> Mesas

Cada 50 niveles cambia la forma de jugar.

<p align="center">
  <img src="docs/img/mesas.png" width="860" alt="Mesas: gravedad, marea, grúa de feria y planetas en órbita">
</p>

<table>
<tr><td align="center" width="16%"><img src="docs/img/i/m-mesa-enrollada.png" width="44" alt=""><br><sub><b>Mesa enrollada</b><br>nivel 51</sub></td><td align="center" width="16%"><img src="docs/img/i/m-gravedad.png" width="44" alt=""><br><sub><b>Gravedad</b><br>nivel 101</sub></td><td align="center" width="16%"><img src="docs/img/i/m-nebulosa.png" width="44" alt=""><br><sub><b>Nebulosa</b><br>nivel 151</sub></td><td align="center" width="16%"><img src="docs/img/i/m-hangar.png" width="44" alt=""><br><sub><b>Hangar</b><br>nivel 201</sub></td><td align="center" width="16%"><img src="docs/img/i/m-bitacora.png" width="44" alt=""><br><sub><b>Bitácora</b><br>nivel 251</sub></td><td align="center" width="16%"><img src="docs/img/i/m-marea.png" width="44" alt=""><br><sub><b>Marea</b><br>nivel 301</sub></td></tr>
<tr><td align="center" width="16%"><img src="docs/img/i/m-agujero-negro.png" width="44" alt=""><br><sub><b>Agujero negro</b><br>nivel 351</sub></td><td align="center" width="16%"><img src="docs/img/i/m-puertas.png" width="44" alt=""><br><sub><b>Puertas</b><br>nivel 401</sub></td><td align="center" width="16%"><img src="docs/img/i/m-banda-transportadora.png" width="44" alt=""><br><sub><b>Banda transportadora</b><br>nivel 451</sub></td><td align="center" width="16%"><img src="docs/img/i/m-asteroides.png" width="44" alt=""><br><sub><b>Asteroides</b><br>nivel 501</sub></td><td align="center" width="16%"><img src="docs/img/i/m-grua-de-feria.png" width="44" alt=""><br><sub><b>Grúa de feria</b><br>nivel 551</sub></td><td align="center" width="16%"><img src="docs/img/i/m-mesa-que-se-voltea.png" width="44" alt=""><br><sub><b>Mesa que se voltea</b><br>nivel 601</sub></td></tr>
<tr><td align="center" width="16%"><img src="docs/img/i/m-cohete.png" width="44" alt=""><br><sub><b>Cohete</b><br>nivel 651</sub></td><td align="center" width="16%"><img src="docs/img/i/m-gravedad-cero.png" width="44" alt=""><br><sub><b>Gravedad cero</b><br>nivel 701</sub></td><td align="center" width="16%"><img src="docs/img/i/m-planetas-en-orbita.png" width="44" alt=""><br><sub><b>Planetas en órbita</b><br>nivel 751</sub></td><td align="center" width="16%"><img src="docs/img/i/m-meteoro-fugaz.png" width="44" alt=""><br><sub><b>Meteoro fugaz</b><br>nivel 801</sub></td><td align="center" width="16%"><img src="docs/img/i/m-cartas-al-vuelo.png" width="44" alt=""><br><sub><b>Cartas al vuelo</b><br>nivel 851</sub></td></tr>
</table>

---

<a id="jefes"></a>

## <img src="docs/img/i/j-fenix-estelar.png" width="30" alt=""> Jefes

El nivel 100 de cada constelación trae una criatura que juega contra ti. **Nunca la ves: solo lo que hace.** Antes de atacar algo **tiembla** para avisarte. Cada carta que juegas en racha le baja **vida** (la barra rosa); si se la acabas, te deja un cofre más grande.

<p align="center">
  <img src="docs/img/jefe.png" width="640" alt="Plinko antes del jefe, la Medusa de plasma y su tablero con barra de vida">
</p>
<p align="center"><sub>Antes de pelear sueltas un meteorito en un <b>plinko</b> para ganarte algo</sub></p>

<h3><img src="docs/img/i/j-fenix-estelar.png" width="34" alt=""> Fénix estelar <sub>· nivel 100</sub></h3>

<p align="center"><img src="docs/img/jefes/fenix.svg" width="600" alt="Fénix estelar en acción"></p>

|  |  |
|---|---|
| 💥 **Qué hace** | Cae fuego sobre las cartas libres y tapa sus números por partes. |
| 🛡️ **Cómo le ganas** | Las sigues pudiendo jugar. Con racha de 5 el fuego baja. |

<h3><img src="docs/img/i/j-el-ilusionista.png" width="34" alt=""> El Ilusionista <sub>· nivel 200</sub></h3>

<p align="center"><img src="docs/img/jefes/ilus.svg" width="600" alt="El Ilusionista en acción"></p>

|  |  |
|---|---|
| 💥 **Qué hace** | Cambia ±1 o ±2 el número de todas las cartas boca arriba. |
| 🛡️ **Cómo le ganas** | Juega antes las que te sirven. |

<h3><img src="docs/img/i/j-medusa-de-plasma.png" width="34" alt=""> Medusa de plasma <sub>· nivel 300</sub></h3>

<p align="center"><img src="docs/img/jefes/medusa.svg" width="600" alt="Medusa de plasma en acción"></p>

|  |  |
|---|---|
| 💥 **Qué hace** | Pone chispas: esas cartas solo entran sobre una de su mismo color. |
| 🛡️ **Cómo le ganas** | Con 4 seguidas se apaga una chispa. |

<h3><img src="docs/img/i/j-viento-solar.png" width="34" alt=""> Viento solar <sub>· nivel 400</sub></h3>

<p align="center"><img src="docs/img/jefes/wind.svg" width="600" alt="Viento solar en acción"></p>

|  |  |
|---|---|
| 💥 **Qué hace** | Sopla y se lleva cartas de tu descarte. |
| 🛡️ **Cómo le ganas** | Con 3 seguidas tu descarte pesa: no se lleva nada y pierde vida. |

<h3><img src="docs/img/i/j-mano-alien.png" width="34" alt=""> Mano alien <sub>· nivel 500</sub></h3>

<p align="center"><img src="docs/img/jefes/hand.svg" width="600" alt="Mano alien en acción"></p>

|  |  |
|---|---|
| 💥 **Qué hace** | Sale de la orilla y se lleva 3 cartas de arriba de tu mazo. |
| 🛡️ **Cómo le ganas** | Con 5 seguidas sin robar te las regresa. Si robas mucho, ¡las avienta al espacio! |

<h3><img src="docs/img/i/j-kraken.png" width="34" alt=""> Kraken <sub>· nivel 600</sub></h3>

<p align="center"><img src="docs/img/jefes/kraken.svg" width="600" alt="Kraken en acción"></p>

|  |  |
|---|---|
| 💥 **Qué hace** | Salpica tinta y bloquea cartas. |
| 🛡️ **Cómo le ganas** | Con 3 seguidas lavas la mancha más vieja. |

<h3><img src="docs/img/i/j-ballena-glotona.png" width="34" alt=""> Ballena glotona <sub>· nivel 700</sub></h3>

<p align="center"><img src="docs/img/jefes/whale.svg" width="600" alt="Ballena glotona en acción"></p>

|  |  |
|---|---|
| 💥 **Qué hace** | Se traga cartas y 3 turnos después las escupe encima de otras. |
| 🛡️ **Cómo le ganas** | Juega las escupidas para destapar las de abajo. |

<h3><img src="docs/img/i/j-reloj-del-vacio.png" width="34" alt=""> Reloj del vacío <sub>· nivel 800</sub></h3>

<p align="center"><img src="docs/img/jefes/clock.svg" width="600" alt="Reloj del vacío en acción"></p>

|  |  |
|---|---|
| 💥 **Qué hace** | Rebobina: tus últimas cartas regresan a la mesa, congeladas. |
| 🛡️ **Cómo le ganas** | Con 4 seguidas sellas tu descarte y se le traba la cinta. |

<img src="docs/img/i/i-corona.png" width="26" alt=""> **Arena de jefes** (desde el 100): la corona del mapa te deja volver a pelear contra los que ya venciste, en Tranquilo, Normal o Furioso, con tablero nuevo cada vez.

Después del 800 vuelven a empezar, cada vuelta con más vida.

---

<a id="eventos"></a>

## <img src="docs/img/i/e-eventos-del-mes.png" width="30" alt=""> Eventos y premios

<p align="center">
  <img src="docs/img/eventos.png" width="940" alt="Carrera de 7, colección Banda musical y Tripulación lunar">
</p>
<p align="center"><sub>Carrera de 7 · Colección de la semana · Tripulación lunar</sub></p>

| | Evento | De qué se trata | Desde |
|:-:|---|---|:-:|
| <img src="docs/img/i/i-codigo.png" width="36" alt=""> | **Regalo diario** | Un planeta por día; cada semana completa da una pieza de planeta y con 4 piezas un **escudo** que te salva un día que no entraste | 1 |
| <img src="docs/img/i/e-racha-cohete.png" width="36" alt=""> | **Racha cohete** | Gana niveles seguidos y junta estrellas para premios cada vez más grandes | 31 |
| <img src="docs/img/i/e-misiones-del-dia.png" width="36" alt=""> | **Misiones y logros** | 3 misiones al día con su cofre; logros para siempre con medallas de bronce a diamante | 41 |
| <img src="docs/img/i/e-carrera-de-7.png" width="36" alt=""> | **Carrera de 7** | Gana 7 niveles nuevos seguidos contra 4 viajeros. El lugar se decide por estrellas: cofre de oro, plata, bronce o cobre | 61 |
| <img src="docs/img/i/e-tripulacion-lunar.png" width="36" alt=""> | **Tripulación lunar** | Cada semana juntas estrellas con 4 viajeros para llegar a la base de bronce, plata u oro | 111 |
| <img src="docs/img/i/e-construir-con-estrellas.png" width="36" alt=""> | **Construir** | Cada estrella nueva da un bloque; con bloques armas una estación de 5 piezas en cada planeta. Cada constelación tiene su estilo | 21 |
| <img src="docs/img/i/e-colecciones.png" width="36" alt=""> | **Colecciones** | Semanas temáticas: ganas fichas jugando y las cambias por exclusivos | 91 |
| <img src="docs/img/i/e-eventos-del-mes.png" width="36" alt=""> | **Evento del mes** | 25 niveles en 5 planetas con temática (Reyes, Halloween, Día de Muertos, Navidad…) | 131 |
| <img src="docs/img/i/e-festividades-de-un-dia.png" width="36" alt=""> | **Festividades** | Fiestas de un día de México, América, Europa y Oriente, cada una con su arte | 181 |
| <img src="docs/img/i/e-lluvia-de-meteoritos.png" width="36" alt=""> | **Lluvias** | Meteoritos, estrellas, cometas, aurora y cristales: caen sin aviso unos minutos y dan más premio | 81 |
| <img src="docs/img/i/e-apuesta-hasta-2.png" width="36" alt=""> | **Apuesta** | Apuesta ×2 hasta ×15 tus boletos en un nivel para ganar más | 101 |
| <img src="docs/img/i/i-tragamonedas.png" width="36" alt=""> | **Y más** | Tragamonedas galáctico para entrar a eventos, nave de rescate si te quedas sin boletos, pasaporte con sellos, códigos de regalo | — |

### <img src="docs/img/i/i-meteoro.png" width="26" alt=""> Lluvias

<table>
<tr><td align="center" width="20%"><img src="docs/img/i/e-lluvia-de-meteoritos.png" width="44" alt=""><br><sub><b>Lluvia de meteoritos</b><br>2 o 3 veces por semana, 30 min sin aviso: boletos a mitad y premios propios</sub></td><td align="center" width="20%"><img src="docs/img/i/e-lluvia-de-estrellas.png" width="44" alt=""><br><sub><b>Lluvia de estrellas</b><br>15 min sin aviso: monedas ×3 y hasta 3 premios</sub></td><td align="center" width="20%"><img src="docs/img/i/e-lluvia-de-cometas.png" width="44" alt=""><br><sub><b>Lluvia de cometas</b><br>20 min: jugar no gasta boletos y cada victoria da 1 más</sub></td><td align="center" width="20%"><img src="docs/img/i/e-aurora.png" width="44" alt=""><br><sub><b>Aurora</b><br>20 min con colección abierta: fichas ×2 y hasta 2 premios</sub></td><td align="center" width="20%"><img src="docs/img/i/e-lluvia-de-cristales.png" width="44" alt=""><br><sub><b>Lluvia de cristales</b><br>10 min cada dos semanas: cada victoria puede dar una ayuda</sub></td></tr>
</table>

### <img src="docs/img/i/e-colecciones.png" width="26" alt=""> Colecciones

Cada semana con colección juntas su ficha jugando y la cambias por premios exclusivos.

<table>
<tr><td align="center" width="20%"><img src="docs/img/i/s-tesoros-del-mar.png" width="44" alt=""><br><sub><b>Tesoros del mar</b><br>desde el 91</sub></td><td align="center" width="20%"><img src="docs/img/i/s-cueva-de-gemas.png" width="44" alt=""><br><sub><b>Cueva de gemas</b><br>desde el 91</sub></td><td align="center" width="20%"><img src="docs/img/i/s-bosque-encantado.png" width="44" alt=""><br><sub><b>Bosque encantado</b><br>desde el 91</sub></td><td align="center" width="20%"><img src="docs/img/i/s-feria-de-dulces.png" width="44" alt=""><br><sub><b>Feria de dulces</b><br>desde el 91</sub></td><td align="center" width="20%"><img src="docs/img/i/s-valle-de-los-dinosaurios.png" width="44" alt=""><br><sub><b>Valle de los dinosaurios</b><br>desde el 141</sub></td></tr>
<tr><td align="center" width="20%"><img src="docs/img/i/s-taller-de-robots.png" width="44" alt=""><br><sub><b>Taller de robots</b><br>desde el 141</sub></td><td align="center" width="20%"><img src="docs/img/i/s-taller-de-arte.png" width="44" alt=""><br><sub><b>Taller de arte</b><br>desde el 191</sub></td><td align="center" width="20%"><img src="docs/img/i/s-banda-musical.png" width="44" alt=""><br><sub><b>Banda musical</b><br>desde el 191</sub></td><td align="center" width="20%"><img src="docs/img/i/s-estudio-de-cine.png" width="44" alt=""><br><sub><b>Estudio de cine</b><br>desde el 191</sub></td></tr>
</table>

### 📅 Calendario del año

El **evento del mes** se abre en el nivel 131 y las **festividades** de cada región van llegando del 181 al 431.

| Mes | Evento del mes | Festividades |
|---|---|---|
| **Enero** | <img src="docs/img/i/s-dia-de-reyes.png" width="30" alt=""> **Día de Reyes** | <img src="docs/img/i/s-ano-nuevo.png" width="26" alt=""> Año Nuevo <sub>1 ene</sub><br><img src="docs/img/i/s-festival-de-hielo.png" width="26" alt=""> Festival de Hielo <sub>5 ene</sub><br><img src="docs/img/i/s-pongal.png" width="26" alt=""> Pongal <sub>14 ene</sub><br><img src="docs/img/i/s-alasitas.png" width="26" alt=""> Alasitas <sub>24 ene</sub><br><img src="docs/img/i/s-up-helly-aa.png" width="26" alt=""> Up Helly Aa <sub>27 ene</sub> |
| **Febrero** | <img src="docs/img/i/s-amor-y-amistad.png" width="30" alt=""> **Amor y Amistad** | <img src="docs/img/i/s-tapati-rapa-nui.png" width="26" alt=""> Tapati Rapa Nui <sub>1 feb</sub><br><img src="docs/img/i/s-dia-de-la-candelaria.png" width="26" alt=""> Día de la Candelaria <sub>2 feb</sub><br><img src="docs/img/i/s-carnaval.png" width="26" alt=""> Carnaval <sub>14 feb, 4 días</sub><br><img src="docs/img/i/s-dia-de-la-bandera.png" width="26" alt=""> Día de la Bandera <sub>24 feb</sub> |
| **Marzo** | <sub>—</sub> | <img src="docs/img/i/s-dia-del-boyero.png" width="26" alt=""> Día del Boyero <sub>8 mar</sub><br><img src="docs/img/i/s-san-patricio.png" width="26" alt=""> San Patricio <sub>17 mar</sub><br><img src="docs/img/i/s-las-fallas.png" width="26" alt=""> Las Fallas <sub>19 mar</sub><br><img src="docs/img/i/s-equinoccio-de-primavera.png" width="26" alt=""> Equinoccio de Primavera <sub>21 mar</sub><br><img src="docs/img/i/s-dia-del-taco.png" width="26" alt=""> Día del Taco <sub>31 mar</sub> |
| **Abril** | <img src="docs/img/i/s-primavera.png" width="30" alt=""> **Primavera** | <img src="docs/img/i/s-songkran.png" width="26" alt=""> Songkran <sub>13 abr, 3 días</sub><br><img src="docs/img/i/s-dia-de-la-tierra.png" width="26" alt=""> Día de la Tierra <sub>22 abr</sub><br><img src="docs/img/i/s-sant-jordi.png" width="26" alt=""> Sant Jordi <sub>23 abr</sub><br><img src="docs/img/i/s-dia-del-rey.png" width="26" alt=""> Día del Rey <sub>27 abr</sub><br><img src="docs/img/i/s-dia-del-nino.png" width="26" alt=""> Día del Niño <sub>30 abr</sub> |
| **Mayo** | <sub>—</sub> | <img src="docs/img/i/s-kodomo-no-hi.png" width="26" alt=""> Kodomo no Hi <sub>5 may</sub><br><img src="docs/img/i/s-dia-de-las-madres.png" width="26" alt=""> Día de las Madres <sub>10 may</sub><br><img src="docs/img/i/s-pahiyas.png" width="26" alt=""> Pahiyas <sub>15 may</sub> |
| **Junio** | <sub>—</sub> | <img src="docs/img/i/s-midsommar.png" width="26" alt=""> Midsommar <sub>19 jun</sub><br><img src="docs/img/i/s-dia-del-padre.png" width="26" alt=""> Día del Padre <sub>21 jun</sub> |
| **Julio** | <img src="docs/img/i/s-verano.png" width="30" alt=""> **Verano** | <img src="docs/img/i/s-tanabata.png" width="26" alt=""> Tanabata <sub>7 jul</sub><br><img src="docs/img/i/s-naadam.png" width="26" alt=""> Naadam <sub>11 jul</sub><br><img src="docs/img/i/s-festival-del-lodo.png" width="26" alt=""> Festival del Lodo <sub>18 jul</sub><br><img src="docs/img/i/s-guelaguetza.png" width="26" alt=""> Guelaguetza <sub>20 jul</sub> |
| **Agosto** | <sub>—</sub> | <img src="docs/img/i/s-dia-del-gato.png" width="26" alt=""> Día del Gato <sub>8 ago</sub><br><img src="docs/img/i/s-fiesta-de-los-globos.png" width="26" alt=""> Fiesta de los Globos <sub>10 ago, 4 días</sub><br><img src="docs/img/i/s-alfombra-de-flores.png" width="26" alt=""> Alfombra de Flores <sub>15 ago</sub><br><img src="docs/img/i/s-dia-del-perro.png" width="26" alt=""> Día del Perro <sub>26 ago</sub><br><img src="docs/img/i/s-dia-del-gamer.png" width="26" alt=""> Día del Gamer <sub>29 ago</sub> |
| **Septiembre** | <img src="docs/img/i/s-fiestas-patrias.png" width="30" alt=""> **Fiestas Patrias** | <img src="docs/img/i/s-regata-historica.png" width="26" alt=""> Regata Histórica <sub>6 sep</sub><br><img src="docs/img/i/s-dia-del-programador.png" width="26" alt=""> Día del Programador <sub>13 sep</sub><br><img src="docs/img/i/s-medio-otono.png" width="26" alt=""> Medio Otoño <sub>17 sep</sub><br><img src="docs/img/i/s-dia-de-los-papalotes.png" width="26" alt=""> Día de los Papalotes <sub>18 sep</sub><br><img src="docs/img/i/s-nahual-y-chaneques.png" width="26" alt=""> Nahual y Chaneques <sub>21 sep, 3 días</sub> |
| **Octubre** | <img src="docs/img/i/s-halloween.png" width="30" alt=""> **Halloween** | <img src="docs/img/i/s-bajada-de-las-vacas.png" width="26" alt=""> Bajada de las Vacas <sub>3 oct</sub><br><img src="docs/img/i/s-dia-del-dulce-de-leche.png" width="26" alt=""> Día del Dulce de Leche <sub>11 oct</sub><br><img src="docs/img/i/s-dia-del-xoloitzcuintle.png" width="26" alt=""> Día del Xoloitzcuintle <sub>27 oct</sub> |
| **Noviembre** | <img src="docs/img/i/s-dia-de-muertos.png" width="30" alt=""> **Día de Muertos** | <img src="docs/img/i/s-la-llorona.png" width="26" alt=""> La Llorona <sub>1 nov</sub><br><img src="docs/img/i/s-la-catrina.png" width="26" alt=""> La Catrina <sub>2 nov</sub><br><img src="docs/img/i/s-dia-de-la-pupusa.png" width="26" alt=""> Día de la Pupusa <sub>8 nov</sub><br><img src="docs/img/i/s-dia-de-la-revolucion.png" width="26" alt=""> Día de la Revolución <sub>20 nov</sub><br><img src="docs/img/i/s-banquete-de-los-monos.png" width="26" alt=""> Banquete de los Monos <sub>29 nov</sub> |
| **Diciembre** | <img src="docs/img/i/s-navidad.png" width="30" alt=""> **Navidad** | <img src="docs/img/i/s-festival-del-calao.png" width="26" alt=""> Festival del Cálao <sub>1 dic</sub><br><img src="docs/img/i/s-dia-de-las-velitas.png" width="26" alt=""> Día de las Velitas <sub>7 dic</sub><br><img src="docs/img/i/s-las-posadas.png" width="26" alt=""> Las Posadas <sub>16 dic, 9 días</sub><br><img src="docs/img/i/s-dia-de-los-inocentes.png" width="26" alt=""> Día de los Inocentes <sub>28 dic</sub><br><img src="docs/img/i/s-ano-viejo.png" width="26" alt=""> Año Viejo <sub>31 dic</sub> |

Todo premio sale en **burbujas** o en **cofres y cápsulas 3D**, y todo lleva animación. Todo funciona **sin servidor**: los rivales de la carrera y la tripulación los simula el teléfono, y los códigos de regalo se revisan con una firma, sin internet.

---

<a id="tienda"></a>

## <img src="docs/img/i/i-tienda.png" width="30" alt=""> Tienda

<p align="center">
  <img src="docs/img/tienda.png" width="620" alt="Tienda con disfraces y el perfil del jugador">
</p>

Con las monedas <img src="docs/img/i/i-moneda.png" width="20" alt=""> que ganas jugando compras cosas para verte distinto:

| | Grupo | Qué hay |
|:-:|---|---|
| <img src="docs/img/i/i-disfraz.png" width="34" alt=""> | **Tú** | Tu personaje 3D (niño o niña, con piel, pelo y peinado), sus **disfraces**, **marcos** del avatar y **títulos** |
| <img src="docs/img/i/i-cards.png" width="34" alt=""> | **Cartas** | **Reversos** y **caras** de las cartas, con 14 temáticas (gatitos, perritos, globos, tropical, realeza…) |
| <img src="docs/img/i/i-nave.png" width="34" alt=""> | **Viaje** | **Viajeros** 3D que te llevan por el mapa, **fondos del espacio** y **marcos de postal** |

Hay piezas que no se venden: salen de eventos, festividades, colecciones, lluvias, el pasaporte <img src="docs/img/i/i-pasaporte.png" width="20" alt="">, los secretos y el **tesoro escondido** de los códigos. De vez en cuando sale un **descuentazo** <img src="docs/img/i/i-boletoDesc.png" width="20" alt=""> para toda la tienda por 24 horas.

---

<a id="dev"></a>

## <img src="docs/img/i/i-gear.png" width="30" alt=""> Modo dev

<img src="docs/img/dev.png" width="220" align="right" alt="Menú del modo dev">

El modo dev es para **probar el juego sin romper tu partida**. Al prenderlo, todo lo que haces es una **copia de prueba**: al salir, tu partida vuelve tal como estaba.

**Cómo se prende:** en el **Perfil**, toca **8 veces seguidas** el título «Perfil». Salen dos botones: **vista de dificultad** (en el tablero, abajo a la izquierda, dice qué % de veces gana un bot «casual») y **modo dev**. Otros 8 toques los esconden y los apagan.

- 🖼️ **Galería de niveles** y **de planetas**: ver cualquier tablero o mundo sin llegar hasta él.
- 🎯 **Ir al tablero**: escribes un número de nivel y lo juegas gratis.
- 🧩 **Solucionador paso a paso**: cómo se gana el nivel, jugada por jugada.
- ℹ️ **Info por nivel**: qué mesa y qué cartas trae, y qué tan difícil es.
- ⏩ **Adelantar el tiempo**: monedas o ayudas, la tienda completa, otro día del regalo diario, ganar la carrera, hacer caer una lluvia, ir al jefe de un evento…
- 🔁 **Volver a ver** las ventanas de explicación, los avisos y el recorrido de botones.
- 📊 **Recuento y Reglas**: todo lo que da el camino (la lista de arriba), la tienda y cómo suben los jefes.
- 📏 **Medidas de pantalla**: que todo quepa en cada iPhone.

Así Mau probaba cada idea en su teléfono antes de subirla.

<br clear="right">

---

## 💻 Correrlo en tu compu

No hace falta instalar nada: es HTML, CSS y JavaScript puro, sin compilar.

```bash
npm start          # abre http://localhost:5173
```

`npm start` también muestra la dirección para abrirlo en el **celular por Wi-Fi**. Se puede instalar como app (PWA) y funciona sin conexión.

```bash
npm test                     # comprueba que todos los niveles se ganan sin ayudas
node tests/difficulty.mjs    # curva de dificultad
```

> [!IMPORTANT]
> Los módulos ES no funcionan abriendo el archivo directo (`file://`): usa `npm start`.

---

## 🛠️ Por dentro

| Archivo | Qué hace |
|---|---|
| `js/engine.js` | Las reglas. Lo usan el juego, el solucionador, el bot y las pruebas: una sola fuente |
| `js/levels.js` | Arma los niveles al momento (sin archivos de datos) y revisa que se puedan ganar |
| `js/game.js` | El tablero, las animaciones y cada mecánica |
| `js/main.js` | Pantallas, ventanas, eventos y el flujo del juego |
| `js/galaxy.js`, `js/travelers.js`, `js/avatar3d.js` | Mapa, viajeros y personajes en 3D (Three.js) |
| `js/art.js`, `js/biomes.js`, `js/themes.js` | Iconos, cartas, mesas y temáticas dibujados con código |
| `js/economy.js`, `js/shop.js` | Precios, premios y la tienda |
| `js/events.js`, `js/race.js`, `js/crew.js`, `js/meteor.js`… | Eventos, carrera, tripulación, lluvias y demás |

Three.js y las letras vienen dentro del proyecto (`vendor/`, `fonts/`) para que funcione sin internet. Los iconos de este README son los mismos del juego, sacados del Recuento del modo dev; las tiras de los jefes son SVG animados.

---

<p align="center">
  <img src="docs/img/mascota.svg" width="60" alt=""><br>
  <sub>Hecho con 🧡 por Claude, con ideas, pruebas y paciencia de Mau.</sub>
</p>
