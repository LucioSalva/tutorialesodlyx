/**
 * Juego 4 · Escape room de la terminal
 * ---------------------------------------------------------------------
 * Cuatro salas encadenadas. Cada una es un puzle que solo se resuelve
 * usando comandos de verdad contra el escenario virtual, y al resolverla
 * entrega un código que abre la siguiente. La última repasa todo lo que
 * hizo falta para salir.
 *
 * El candado es narrativo, no un castigo: si alguien llega con la sala
 * anterior sin terminar puede entrar igualmente, porque el objetivo es
 * aprender, no coleccionar llaves.
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

/** ¿Está resuelta la sala? Se pregunta al estado, no al texto tecleado. */
export function salaResuelta(ctx, sala) {
  return evaluar(ctx, sala.puzle.validador);
}

/** La sala anterior de la cadena, o null si es la primera. */
export function salaAnterior(niveles, nivel) {
  const i = niveles.findIndex(n => n.id === nivel.id);
  return i > 0 ? niveles[i - 1] : null;
}

/** Estado del candado: abierto, o cerrado con el motivo. */
export function estadoCandado(niveles, nivel, progreso) {
  const anterior = salaAnterior(niveles, nivel);
  if (!anterior) return { abierto: true, anterior: null };
  const hecha = progreso && progreso.datos && progreso.datos.juegos
    ? !!progreso.datos.juegos['escape-room']?.niveles?.[anterior.id]?.completado
    : false;
  return { abierto: hecha, anterior };
}

export function calcularPuntosEscape({ comandos = 0, optimo = 3, pistas = 0, solucion = false }) {
  let puntos = 120 - Math.max(0, comandos - optimo) * 5 - pistas * 15;
  if (solucion) puntos = Math.min(puntos, 30);
  return Math.max(15, Math.round(puntos));
}

/* ------------------------------------------------------------------ *
 * Escena Phaser: la sala y su puerta
 * ------------------------------------------------------------------ */

function crearEscenaSala(Phaser) {
  return class EscenaSala extends Phaser.Scene {
    constructor() { super('sala'); }

    init(datos) {
      this.indice = datos.indice;
      this.total = datos.total;
      this.titulo = datos.titulo;
      this.codigo = datos.codigo;
      this.abierta = false;
    }

    create() {
      this.cameras.main.setBackgroundColor(PALETA.fondo);

      // Cadena de salas arriba: se ve de un vistazo dónde estás.
      for (let i = 0; i < this.total; i++) {
        const x = 30 + i * 46;
        const hecha = i < this.indice;
        const actual = i === this.indice;
        const c = this.add.circle(x, 26, 11, actual ? 0x123027 : PALETA.panel)
          .setStrokeStyle(2, actual ? PALETA.acento : (hecha ? PALETA.acento2 : PALETA.linea));
        this.add.text(x, 26, hecha ? '✔' : String(i + 1), {
          fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
          color: actual ? '#19E6A4' : (hecha ? '#38BDF8' : '#8FA0AE'),
        }).setOrigin(0.5);
        if (i < this.total - 1) this.add.rectangle(x + 23, 26, 20, 2, PALETA.linea);
      }

      // La sala.
      this.add.rectangle(360, 190, 640, 240, 0x0e141c).setStrokeStyle(1.5, PALETA.linea);
      this.add.text(40, 86, this.titulo, {
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: '17px', color: '#E3EBF1',
      });

      // Puerta cerrada con su candado.
      this.puerta = this.add.rectangle(600, 200, 92, 170, 0x16202c).setStrokeStyle(2, PALETA.tenue);
      this.candado = this.add.text(600, 200, '🔒', { fontSize: '30px' }).setOrigin(0.5);
      this.hueco = this.add.rectangle(600, 200, 92, 170, 0x05231a).setStrokeStyle(2, PALETA.acento).setAlpha(0);

      this.placa = this.add.text(40, 130, 'Código de salida: — — —', {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: '#8FA0AE',
      });
      this.estado = this.add.text(40, 160, 'Puzle sin resolver', {
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#8FA0AE',
        wordWrap: { width: 480 }, lineSpacing: 3,
      });
    }

    pista(texto) {
      this.estado.setText(texto).setColor('#FBBF24');
    }

    /** Abre la puerta y revela el código: la recompensa visible del puzle. */
    abrir(codigo) {
      if (this.abierta) return;
      this.abierta = true;
      this.tweens.add({ targets: this.candado, alpha: 0, y: 230, duration: 380 });
      this.tweens.add({ targets: this.puerta, alpha: 0.15, duration: 420 });
      this.tweens.add({ targets: this.hueco, alpha: 1, duration: 420 });
      this.placa.setText(`Código de salida: ${codigo}`).setColor('#19E6A4');
      this.estado.setText('Puzle resuelto. La puerta está abierta.').setColor('#19E6A4');
      this.tweens.add({ targets: this.placa, scale: 1.08, duration: 200, yoyo: true });
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
  let juegoPhaser = null, destruido = false;

  contenedor.innerHTML = '';
  contenedor.classList.add('ac-juego');

  const candado = estadoCandado(niveles, nivel, progreso);
  const avisoCadena = candado.abierto ? '' : `
    <p class="ac-portada__candado">🔒 Esta sala se abre con el código de <b>${candado.anterior.nombre}</b>.
    Puedes entrar igualmente si prefieres practicar este puzle primero.</p>`;

  const portada = document.createElement('div');
  portada.className = 'ac-portada';
  portada.innerHTML = `
    <h3 class="ac-portada__titulo">${juego.nombre} · ${nivel.nombre}</h3>
    <p class="ac-portada__objetivo"><b>Objetivo:</b> ${nivel.objetivo}</p>
    ${nivel.historia ? `<p class="ac-portada__historia">${nivel.historia}</p>` : ''}
    ${avisoCadena}
    <div class="ac-portada__cols">
      <div><h4>Cómo se juega</h4><p>${juego.mecanica}</p><p class="ac-portada__nota">${juego.controles}</p></div>
      <div><h4>Lo que practicas</h4><ul>${(juego.aprende || []).map(a => `<li><code>${a}</code></li>`).join('')}</ul></div>
    </div>
    <button type="button" class="ac-btn ac-btn--primario" data-empezar>${candado.abierto ? 'Entrar en la sala' : 'Entrar de todas formas'}</button>`;
  contenedor.append(portada);
  portada.querySelector('[data-empezar]').focus();
  portada.querySelector('[data-empezar]').addEventListener('click', () => { portada.remove(); jugar(); }, { once: true });

  async function jugar() {
    const { escenario, vfs, shell } = await prepararEscenario(datos.escenarios, nivel.escenario, nivel.os || 'linux');
    aplicarPreparacion(vfs, nivel.preparar);
    const verbos = verbosDe(shell.estilo);

    let pistasUsadas = 0, solucionVista = false, comandos = 0, terminado = false;
    const inicio = Date.now();
    const indice = niveles.findIndex(n => n.id === nivel.id);

    const tablero = document.createElement('div');
    tablero.className = 'ac-juego__zona';
    tablero.innerHTML = `
      <div class="ac-juego__tablero">
        <div class="ac-juego__lienzo" data-lienzo></div>
        <aside class="ac-juego__estado" aria-live="polite">
          <h4>El puzle</h4>
          <p data-puzle>${nivel.puzle.enunciado}</p>
          <h4>Estado</h4>
          <p data-estado>Cerrado. Resuelve el puzle para abrir la puerta.</p>
          <p class="ac-juego__ruta">Estás en <b data-ruta></b></p>
        </aside>
      </div>
      <div class="ac-juego__atajos" data-atajos role="group" aria-label="Atajos"></div>
      <div class="ac-juego__terminal" data-terminal></div>`;
    contenedor.append(tablero);

    const hud = crearHud(contenedor, {
      juego, nivel, conTiempo: false,
      alReiniciar: () => reiniciar(),
      alPista: () => mostrarPista(),
      alSolucion: () => mostrarSolucion(),
    });
    hud.puntos(120);

    const terminal = new Terminal(tablero.querySelector('[data-terminal]'), {
      shell,
      bienvenida: [
        { texto: `${nivel.nombre} — ${escenario.nombre}`, clase: 'dim' },
        { texto: nivel.puzle.enunciado, clase: 'dim' },
      ],
      alEjecutar: (texto, resultado) => alComando(texto, resultado),
    });
    terminal.enfocar();

    const Phaser = await cargarPhaser(base);
    if (destruido) return;
    const Escena = crearEscenaSala(Phaser);
    juegoPhaser = new Phaser.Game({
      type: Phaser.AUTO, width: 720, height: 320,
      parent: tablero.querySelector('[data-lienzo]'),
      backgroundColor: '#0B1017',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [Escena],
    });
    juegoPhaser.scene.start('sala', {
      indice: Math.max(0, indice), total: niveles.length,
      titulo: nivel.nombre, codigo: nivel.codigo,
    });
    ajustarLienzo(tablero, `Sala ${indice + 1} de ${niveles.length} con la puerta cerrada. El puzle y su estado están descritos en texto al lado.`);

    pintarEstado();
    pintarAtajos();

    function alComando(texto, resultado) {
      if (terminado || !resultado) return;
      comandos++;
      pintarEstado();

      const salida = resultado.lineas || [];
      const ctx = { vfs, shell, salida, historial: shell.historial, ultimoComando: texto };

      const fallos = salida.filter(l => l.clase === 'err');
      if (fallos.length) explicarError(fallos[0].texto);

      if (salaResuelta(ctx, nivel)) abrirPuerta();
    }

    function explicarError(mensaje) {
      let consejo = '';
      if (/No existe el archivo o el directorio|no puede encontrar/i.test(mensaje)) {
        consejo = `Esa ruta no existe desde aquí. Mira primero con <code>${verbos.listar}</code>; en Linux lo que empieza por punto solo aparece con <code>ls -a</code>.`;
      } else if (/Es un directorio/i.test(mensaje)) {
        consejo = `Eso es una carpeta: para ver lo que contiene usa <code>${verbos.listar}</code>, y para leer un archivo <code>${verbos.leer}</code>.`;
      } else if (/Operación no permitida|no permitida/i.test(mensaje)) {
        consejo = 'Ese proceso está protegido por el escenario. Mira con <code>ps aux</code> cuál es el que sobra de verdad.';
      } else if (/orden no encontrada|no se reconoce/i.test(mensaje)) {
        consejo = `Ese comando no existe en este shell. Escribe <code>help</code> para ver los que sí.`;
      }
      if (consejo) hud.aviso(consejo, 'info');
    }

    function pintarEstado() {
      tablero.querySelector('[data-ruta]').textContent = vfs.cwdTexto();
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
      for (const s of (nivel.puzle.sugerencias || [])) anadir(s, s);
    }

    function abrirPuerta() {
      if (terminado) return;
      terminado = true;
      const escena = juegoPhaser?.scene?.getScene('sala');
      if (escena) escena.abrir(nivel.codigo);
      tablero.querySelector('[data-estado]').innerHTML =
        `<b>Abierta.</b> Código de salida: <code>${nivel.codigo}</code>`;

      const tiempo = Math.round((Date.now() - inicio) / 1000);
      const puntos = calcularPuntosEscape({ comandos, optimo: nivel.optimo ?? 3, pistas: pistasUsadas, solucion: solucionVista });
      hud.puntos(puntos);
      const xp = completarNivel(progreso, juego.slug, nivel, { puntos, tiempo, pistas: pistasUsadas, solucion: solucionVista });

      const siguiente = niveles[indice + 1];
      const resumen = nivel.resumen_final
        ? `<br><br>${nivel.resumen_final}`
        : '';
      pantallaVictoria(contenedor, {
        titulo: siguiente ? `Sala superada · código ${nivel.codigo}` : '¡Has salido!',
        texto: `${nivel.puzle.explicacion || ''}${resumen}`,
        puntos, xp,
        siguienteNombre: siguiente?.nombre,
        alRepetir: () => reiniciar(),
        alSiguiente: siguiente ? () => alTerminar && alTerminar({ siguiente: siguiente.id }) : null,
      });
      if (alTerminar) alTerminar({ completado: true, nivel: nivel.id, puntos, xp, tiempo, codigo: nivel.codigo });
    }

    function mostrarPista() {
      const pistas = nivel.puzle.pistas || [];
      if (pistasUsadas >= pistas.length) { hud.aviso('No quedan pistas; «Ver solución» explica el puzle entero.', 'aviso'); return; }
      const texto = pistas[pistasUsadas];
      hud.aviso(`<b>Pista ${pistasUsadas + 1}:</b> ${texto}`, 'pista');
      const escena = juegoPhaser?.scene?.getScene('sala');
      if (escena) escena.pista(`Pista: ${texto.replace(/<[^>]+>/g, '')}`);
      pistasUsadas++;
      hud.puntos(calcularPuntosEscape({ comandos, optimo: nivel.optimo ?? 3, pistas: pistasUsadas }));
    }

    function mostrarSolucion() {
      solucionVista = true;
      hud.aviso(`<b>Solución:</b> <code>${(nivel.puzle.solucion || []).join('</code><br><code>')}</code><br>${nivel.puzle.explicacion || ''}`, 'solucion');
      hud.puntos(calcularPuntosEscape({ comandos, optimo: nivel.optimo ?? 3, pistas: pistasUsadas, solucion: true }));
    }

    function reiniciar() {
      reiniciarEscenario(shell);
      limpiarPartida();
      jugar();
    }

    function limpiarPartida() {
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
      while (limpieza.length) { const fn = limpieza.pop(); try { fn(); } catch {} }
      if (juegoPhaser) { juegoPhaser.destroy(true); juegoPhaser = null; }
      contenedor.innerHTML = '';
    },
  };
}
