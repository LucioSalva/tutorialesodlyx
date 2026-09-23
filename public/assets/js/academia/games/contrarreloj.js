/**
 * Juego 3 · Terminal contrarreloj
 * ---------------------------------------------------------------------
 * Una ronda son varios micro-retos encadenados. Cada reto se valida con
 * los validadores declarativos del motor de misiones, así que cualquier
 * camino correcto cuenta: no hay una cadena de texto «buena».
 *
 * El reloj PUNTÚA, no bloquea. Antes de empezar se elige modo, y si se
 * agota el tiempo la ronda continúa sin cronómetro para poder terminar de
 * aprender: perder puntos sí, quedarse sin ejercicio no.
 */

import {
  cargarPhaser, PALETA, crearHud, pantallaVictoria, completarNivel,
  prepararEscenario, Terminal, reiniciarEscenario,
} from '../juego-base.js';
import { evaluar } from '../misiones.js';
import { aplicarPreparacion, verbosDe, ajustarLienzo } from './laberinto.js';

/* ------------------------------------------------------------------ *
 * Lógica pura
 * ------------------------------------------------------------------ */

/**
 * Puntos de un reto. Sin cronómetro se cobra la base completa: el modo
 * tranquilo no es un modo de segunda.
 */
export function puntuarReto({ base = 20, conTiempo = false, segundosRestantes = 0, segundosTotales = 1, pistas = 0 }) {
  const bonus = conTiempo ? Math.round(base * 0.5 * Math.max(0, segundosRestantes) / Math.max(1, segundosTotales)) : 0;
  const castigo = pistas * Math.round(base * 0.25);
  return Math.max(Math.round(base * 0.25), base + bonus - castigo);
}

/** Resumen final de la ronda, con lo que hay que repasar. */
export function resumenRonda(retos = [], resultados = []) {
  const hechos = resultados.filter(r => r && r.superado).length;
  const conAyuda = resultados.filter(r => r && r.superado && r.pistas > 0).map((r, i) => retos[i]?.etiqueta).filter(Boolean);
  return {
    hechos,
    total: retos.length,
    puntos: resultados.reduce((s, r) => s + (r ? r.puntos : 0), 0),
    repasar: conAyuda,
    perfecto: hechos === retos.length && conAyuda.length === 0,
  };
}

/** Siguiente reto pendiente (permite saltar uno y volver después). */
export function siguientePendiente(resultados = [], total = 0, desde = 0) {
  for (let i = desde; i < total; i++) if (!resultados[i] || !resultados[i].superado) return i;
  for (let i = 0; i < desde; i++) if (!resultados[i] || !resultados[i].superado) return i;
  return -1;
}

/* ------------------------------------------------------------------ *
 * Escena Phaser: la pista de retos
 * ------------------------------------------------------------------ */

function crearEscenaPista(Phaser) {
  return class EscenaPista extends Phaser.Scene {
    constructor() { super('pista'); }

    init(datos) {
      this.total = datos.total;
      this.indice = 0;
      this.resultados = [];
      this.conTiempo = datos.conTiempo;
      this.hitos = [];
    }

    create() {
      this.cameras.main.setBackgroundColor(PALETA.fondo);

      this.add.text(20, 14, 'Ronda de retos', {
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#8FA0AE',
      });

      // Pista horizontal con un hito por reto.
      const anchoUtil = 680;
      const paso = this.total > 1 ? anchoUtil / (this.total - 1) : 0;
      this.add.rectangle(20 + anchoUtil / 2, 78, anchoUtil, 4, PALETA.linea).setOrigin(0.5);

      for (let i = 0; i < this.total; i++) {
        const x = 20 + i * paso;
        const circulo = this.add.circle(x, 78, 13, PALETA.panel).setStrokeStyle(2, PALETA.linea);
        const numero = this.add.text(x, 78, String(i + 1), {
          fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#8FA0AE',
        }).setOrigin(0.5);
        this.hitos.push({ circulo, numero, x });
      }

      this.corredor = this.add.circle(20, 78, 9, PALETA.acento).setStrokeStyle(2, 0xffffff, 0.6);

      this.textoReto = this.add.text(20, 122, '', {
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: '15px', color: '#E3EBF1',
        wordWrap: { width: 680 }, lineSpacing: 4,
      });
      this.textoAyuda = this.add.text(20, 196, '', {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#8FA0AE',
        wordWrap: { width: 680 },
      });

      // Barra de tiempo: solo existe si el jugador eligió cronómetro.
      if (this.conTiempo) {
        this.add.rectangle(20, 250, 680, 8, 0x1a222c).setOrigin(0, 0.5);
        this.barra = this.add.rectangle(20, 250, 680, 8, PALETA.acento).setOrigin(0, 0.5);
      }
      this.marcador = this.add.text(20, 268, '', {
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#19E6A4',
      });
    }

    mostrarReto(indice, reto, ayuda) {
      this.indice = indice;
      this.textoReto.setText(`${indice + 1}. ${reto.enunciado}`);
      this.textoAyuda.setText(ayuda || '');
      const hito = this.hitos[indice];
      if (hito) this.tweens.add({ targets: this.corredor, x: hito.x, duration: 260, ease: 'Cubic.easeOut' });
      this.hitos.forEach((h, i) => {
        h.circulo.setStrokeStyle(2, i === indice ? PALETA.acento : PALETA.linea);
      });
    }

    marcarSuperado(indice) {
      const hito = this.hitos[indice];
      if (!hito) return;
      hito.circulo.setFillStyle(0x123027).setStrokeStyle(2, PALETA.acento);
      hito.numero.setText('✔').setColor('#19E6A4');
      this.tweens.add({ targets: hito.circulo, scale: 1.4, duration: 180, yoyo: true });
    }

    tiempo(fraccion) {
      if (!this.barra) return;
      this.barra.width = Math.max(0, 680 * fraccion);
      this.barra.setFillStyle(fraccion > 0.5 ? PALETA.acento : (fraccion > 0.2 ? PALETA.aviso : PALETA.error));
    }

    puntos(valor, extra = '') {
      this.marcador.setText(`${valor} puntos${extra}`);
    }
  };
}

/* ------------------------------------------------------------------ *
 * Montaje
 * ------------------------------------------------------------------ */

export async function iniciar(contenedor, opciones) {
  const { juego, nivelId, base, datos, progreso, alTerminar } = opciones;
  const niveles = juego.niveles || [];
  const nivel = niveles.find(n => String(n.id) === String(nivelId)) || niveles[0];
  if (!nivel) throw new Error('El juego no tiene niveles definidos');

  const limpieza = [];
  let juegoPhaser = null, destruido = false, cronometro = null;

  contenedor.innerHTML = '';
  contenedor.classList.add('ac-juego');

  const portada = document.createElement('div');
  portada.className = 'ac-portada';
  portada.innerHTML = `
    <h3 class="ac-portada__titulo">${juego.nombre} · ${nivel.nombre}</h3>
    <p class="ac-portada__objetivo"><b>Objetivo:</b> ${nivel.objetivo}</p>
    <div class="ac-portada__cols">
      <div><h4>Cómo se juega</h4><p>${juego.mecanica}</p><p class="ac-portada__nota">${juego.controles}</p></div>
      <div><h4>Lo que practicas</h4><ul>${(juego.aprende || []).map(a => `<li><code>${a}</code></li>`).join('')}</ul></div>
    </div>
    <fieldset class="ac-modo">
      <legend>Elige cómo quieres jugar</legend>
      <button type="button" class="ac-btn ac-btn--primario" data-modo="tranquilo">Sin tiempo</button>
      <button type="button" class="ac-btn" data-modo="reloj">Con cronómetro (${nivel.segundos || 180} s)</button>
      <p class="ac-modo__nota">El cronómetro solo añade puntos extra. Si se agota, la ronda sigue sin reloj: nunca te quedas sin terminar el ejercicio.</p>
    </fieldset>`;
  contenedor.append(portada);
  portada.querySelector('[data-modo="tranquilo"]').focus();
  portada.querySelectorAll('[data-modo]').forEach(b => {
    b.addEventListener('click', () => {
      const conTiempo = b.dataset.modo === 'reloj';
      portada.remove();
      jugar(conTiempo);
    }, { once: true });
  });

  async function jugar(conTiempo) {
    const { escenario, vfs, shell } = await prepararEscenario(datos.escenarios, nivel.escenario, nivel.os || 'linux');
    aplicarPreparacion(vfs, nivel.preparar);
    const verbos = verbosDe(shell.estilo);
    const retos = nivel.retos || [];

    const segundosTotales = nivel.segundos || 180;
    let segundosRestantes = segundosTotales;
    let indice = 0;
    let pistasReto = 0;
    let solucionVista = false;
    let terminado = false;
    let sinReloj = !conTiempo;
    const resultados = new Array(retos.length).fill(null);
    const inicio = Date.now();

    const tablero = document.createElement('div');
    tablero.className = 'ac-juego__zona';
    tablero.innerHTML = `
      <div class="ac-juego__tablero">
        <div class="ac-juego__lienzo" data-lienzo></div>
        <aside class="ac-juego__estado" aria-live="polite">
          <h4>Reto actual</h4>
          <p class="ac-juego__reto" data-reto></p>
          <h4>Progreso</h4>
          <ol class="ac-juego__retos" data-lista></ol>
        </aside>
      </div>
      <div class="ac-juego__atajos" data-atajos role="group" aria-label="Atajos"></div>
      <div class="ac-juego__terminal" data-terminal></div>`;
    contenedor.append(tablero);

    const hud = crearHud(contenedor, {
      juego, nivel, conTiempo,
      alReiniciar: () => reiniciar(),
      alPista: () => mostrarPista(),
      alSolucion: () => mostrarSolucion(),
    });

    const terminal = new Terminal(tablero.querySelector('[data-terminal]'), {
      shell,
      bienvenida: [
        { texto: `${escenario.nombre} · ${retos.length} retos`, clase: 'dim' },
        { texto: conTiempo ? `Modo cronómetro: ${segundosTotales} s para la ronda completa.` : 'Modo sin tiempo: tómate lo que necesites.', clase: 'dim' },
      ],
      alEjecutar: (texto, resultado) => alComando(texto, resultado),
    });
    terminal.enfocar();

    const Phaser = await cargarPhaser(base);
    if (destruido) return;
    const Escena = crearEscenaPista(Phaser);
    juegoPhaser = new Phaser.Game({
      type: Phaser.AUTO, width: 720, height: 300,
      parent: tablero.querySelector('[data-lienzo]'),
      backgroundColor: '#0B1017',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [Escena],
    });
    juegoPhaser.scene.start('pista', { total: retos.length, conTiempo });
    ajustarLienzo(tablero, 'Pista de retos. El reto actual y el progreso están escritos al lado en texto.');

    mostrarReto();

    if (conTiempo) {
      cronometro = setInterval(() => {
        segundosRestantes--;
        hud.tiempo(Math.max(0, segundosRestantes));
        const escena = juegoPhaser?.scene?.getScene('pista');
        if (escena) escena.tiempo(segundosRestantes / segundosTotales);
        if (segundosRestantes <= 0) agotarTiempo();
      }, 1000);
      limpieza.push(() => clearInterval(cronometro));
    }

    function retoActual() { return retos[indice]; }

    function mostrarReto() {
      const reto = retoActual();
      if (!reto) return;
      pistasReto = resultados[indice]?.pistas || 0;
      const escena = juegoPhaser?.scene?.getScene('pista');
      if (escena) escena.mostrarReto(indice, reto, reto.ayuda || '');
      tablero.querySelector('[data-reto]').innerHTML = `<b>${indice + 1}/${retos.length}.</b> ${reto.enunciado}`;
      hud.nivel(`${nivel.nombre} · reto ${indice + 1} de ${retos.length}`);
      pintarLista();
      pintarAtajos();
    }

    function pintarLista() {
      const lista = tablero.querySelector('[data-lista]');
      lista.innerHTML = '';
      retos.forEach((r, i) => {
        const li = document.createElement('li');
        const hecho = resultados[i]?.superado;
        li.className = 'ac-reto' + (hecho ? ' es-hecho' : '') + (i === indice ? ' es-actual' : '');
        li.innerHTML = `<span aria-hidden="true">${hecho ? '✔' : (i === indice ? '▸' : '○')}</span> ${r.etiqueta || r.enunciado}`;
        lista.append(li);
      });
    }

    function pintarAtajos() {
      const zona = tablero.querySelector('[data-atajos]');
      zona.innerHTML = '';
      const anadir = (etiqueta, comando) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'ac-chip'; b.textContent = etiqueta; b.title = comando;
        b.addEventListener('click', () => { terminal.ejecutar(comando); terminal.enfocar(); });
        zona.append(b);
      };
      anadir(verbos.donde, verbos.donde);
      anadir(verbos.listar, verbos.listar);
      for (const s of (retoActual()?.sugerencias || [])) anadir(s, s);
      const saltar = document.createElement('button');
      saltar.type = 'button';
      saltar.className = 'ac-chip ac-chip--secundario';
      saltar.textContent = 'Saltar reto';
      saltar.title = 'Pasa al siguiente y vuelve a este más tarde';
      saltar.addEventListener('click', () => {
        const siguiente = siguientePendiente(resultados, retos.length, indice + 1);
        if (siguiente >= 0 && siguiente !== indice) { indice = siguiente; mostrarReto(); }
      });
      zona.append(saltar);
    }

    function alComando(texto, resultado) {
      if (terminado || !resultado) return;
      const reto = retoActual();
      if (!reto) return;

      const salida = resultado.lineas || [];
      const ctx = { vfs, shell, salida, historial: shell.historial, ultimoComando: texto };

      const fallos = salida.filter(l => l.clase === 'err');
      if (fallos.length && /orden no encontrada|no se reconoce/i.test(fallos[0].texto)) {
        hud.aviso(`Ese comando no existe aquí. En este sistema se lista con <code>${verbos.listar}</code> y se lee con <code>${verbos.leer}</code>.`, 'info');
      }

      if (!evaluar(ctx, reto.validador)) return;

      const puntos = puntuarReto({
        base: reto.puntos || 20, conTiempo: conTiempo && !sinReloj,
        segundosRestantes, segundosTotales, pistas: pistasReto,
      });
      resultados[indice] = { superado: true, puntos, pistas: pistasReto };

      const escena = juegoPhaser?.scene?.getScene('pista');
      if (escena) { escena.marcarSuperado(indice); escena.puntos(resumenRonda(retos, resultados).puntos); }
      hud.puntos(resumenRonda(retos, resultados).puntos);
      hud.aviso(`<b>Reto ${indice + 1} superado.</b> ${reto.explicacion || ''}`, 'exito');

      const siguiente = siguientePendiente(resultados, retos.length, indice + 1);
      if (siguiente < 0) { ganar(); return; }
      indice = siguiente;
      pistasReto = 0;
      solucionVista = false;
      mostrarReto();
    }

    function mostrarPista() {
      const reto = retoActual();
      const pistas = (reto && reto.pistas) || [];
      if (pistasReto >= pistas.length) { hud.aviso('No quedan pistas para este reto; «Ver solución» lo explica entero.', 'aviso'); return; }
      hud.aviso(`<b>Pista ${pistasReto + 1}:</b> ${pistas[pistasReto]}`, 'pista');
      pistasReto++;
      resultados[indice] = { ...(resultados[indice] || { superado: false, puntos: 0 }), pistas: pistasReto };
    }

    function mostrarSolucion() {
      const reto = retoActual();
      if (!reto) return;
      solucionVista = true;
      pistasReto = Math.max(pistasReto, (reto.pistas || []).length);
      hud.aviso(`<b>Solución:</b> <code>${reto.solucion}</code><br>${reto.explicacion || ''}`, 'solucion');
    }

    /** El tiempo se acaba, el ejercicio no: se sigue jugando sin reloj. */
    function agotarTiempo() {
      clearInterval(cronometro);
      cronometro = null;
      sinReloj = true;
      const escena = juegoPhaser?.scene?.getScene('pista');
      if (escena) escena.tiempo(0);
      hud.aviso('Se acabó el cronómetro. La ronda <b>continúa sin reloj</b>: termina los retos que falten, que para eso están.', 'aviso');
    }

    function ganar() {
      if (terminado) return;
      terminado = true;
      if (cronometro) { clearInterval(cronometro); cronometro = null; }
      const tiempo = Math.round((Date.now() - inicio) / 1000);
      const resumen = resumenRonda(retos, resultados);
      const pistasTotales = resultados.reduce((s, r) => s + (r?.pistas || 0), 0);
      const xp = completarNivel(progreso, juego.slug, nivel, {
        puntos: resumen.puntos, tiempo, pistas: pistasTotales, solucion: solucionVista,
      });

      const siguiente = niveles[niveles.indexOf(nivel) + 1];
      const repaso = resumen.repasar.length
        ? `Para repasar: ${resumen.repasar.map(r => `<code>${r}</code>`).join(', ')}.`
        : 'Sin pistas en ningún reto.';
      pantallaVictoria(contenedor, {
        titulo: resumen.perfecto ? 'Ronda perfecta' : 'Ronda completada',
        texto: `${resumen.hechos} de ${resumen.total} retos. ${repaso}`,
        puntos: resumen.puntos, xp, siguienteNombre: siguiente?.nombre,
        alRepetir: () => reiniciar(),
        alSiguiente: siguiente ? () => alTerminar && alTerminar({ siguiente: siguiente.id }) : null,
      });
      if (alTerminar) alTerminar({ completado: true, nivel: nivel.id, puntos: resumen.puntos, xp, tiempo });
    }

    function reiniciar() {
      if (cronometro) { clearInterval(cronometro); cronometro = null; }
      reiniciarEscenario(shell);
      limpiarPartida();
      jugar(conTiempo);
    }

    function limpiarPartida() {
      if (cronometro) { clearInterval(cronometro); cronometro = null; }
      if (juegoPhaser) { juegoPhaser.destroy(true); juegoPhaser = null; }
      tablero.remove();
      hud.elemento.nextElementSibling?.remove();
      hud.elemento.remove();
      contenedor.querySelector('.ac-victoria')?.remove();
    }

    limpieza.push(limpiarPartida);
  }

  return {
    destruir() {
      destruido = true;
      if (cronometro) clearInterval(cronometro);
      while (limpieza.length) { const fn = limpieza.pop(); try { fn(); } catch {} }
      if (juegoPhaser) { juegoPhaser.destroy(true); juegoPhaser = null; }
      contenedor.innerHTML = '';
    },
  };
}
