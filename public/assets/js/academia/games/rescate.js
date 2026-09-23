/**
 * Juego 2 · Rescate de archivos
 * ---------------------------------------------------------------------
 * Hay archivos en carpetas equivocadas y el jugador los coloca con
 * comandos reales (mkdir/cp/mv, copy/move, Copy-Item/Move-Item). La
 * escena se repinta leyendo el VFS después de cada orden: lo que se ve en
 * pantalla siempre es el estado verdadero del sistema de archivos.
 *
 * El nivel 2 existe para enseñar una diferencia que cuesta cara: copiar
 * conserva el original y mover no. Si el jugador mueve cuando había que
 * copiar, el juego lo explica y deja reintentar en lugar de castigar.
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
 * Estado de cada encargo leyendo el VFS.
 * @returns {Array<{archivo,destino,modo,enSitio,originalPresente,resuelto,perdido}>}
 */
export function analizarObjetivos(vfs, objetivos = []) {
  return objetivos.map(o => {
    const rutaDestino = o.destino.replace(/[\\/]+$/, '') + (vfs.estilo === 'windows' ? '\\' : '/') + o.archivo;
    const enSitio = vfs.existe(rutaDestino);
    const originalPresente = vfs.existe(o.origen);
    const copia = o.modo === 'copiar';
    return {
      ...o,
      enSitio,
      originalPresente,
      // Copiar exige las dos; mover exige que el original ya NO esté.
      resuelto: copia ? (enSitio && originalPresente) : (enSitio && !originalPresente),
      // Se ha perdido el original de algo que había que copiar.
      perdido: copia && enSitio && !originalPresente,
    };
  });
}

/** Cuántos encargos están resueltos, para la barra de progreso. */
export function progresoDe(estado = []) {
  const hechos = estado.filter(e => e.resuelto).length;
  return { hechos, total: estado.length, porcentaje: estado.length ? Math.round((hechos / estado.length) * 100) : 0 };
}

/** ¿Alguien movió algo que había que copiar? Es el error que enseña. */
export function detectarMovimientoIndebido(estado = []) {
  return estado.find(e => e.perdido) || null;
}

export function calcularPuntosRescate({ comandos = 0, optimo = 2, pistas = 0, solucion = false, errores = 0 }) {
  let puntos = 100 - Math.max(0, comandos - optimo) * 5 - pistas * 12 - errores * 4;
  if (solucion) puntos = Math.min(puntos, 25);
  return Math.max(10, Math.round(puntos));
}

/* ------------------------------------------------------------------ *
 * Escena Phaser
 * ------------------------------------------------------------------ */

function crearEscenaRescate(Phaser) {
  return class EscenaRescate extends Phaser.Scene {
    constructor() { super('rescate'); }

    init(datos) {
      this.estado = datos.estado;
      this.zonas = new Map();
      this.chips = new Map();
    }

    create() {
      this.cameras.main.setBackgroundColor(PALETA.fondo);
      this.add.text(18, 12, 'Carpetas de destino', {
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#8FA0AE',
      });

      const destinos = [...new Set(this.estado.map(e => e.destino))];
      destinos.forEach((destino, i) => {
        const x = 18 + (i % 3) * 232;
        const y = 38 + Math.floor(i / 3) * 132;
        const caja = this.add.rectangle(x + 108, y + 52, 216, 104, PALETA.panel).setStrokeStyle(1.5, PALETA.linea);
        const titulo = this.add.text(x + 12, y + 10, this._corto(destino), {
          fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', color: '#38BDF8',
        });
        this.zonas.set(destino, { x, y, caja, titulo });
      });

      this.add.text(18, 300, 'Sueltos / fuera de sitio', {
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#8FA0AE',
      });
      this.zonaSuelto = { x: 18, y: 322 };
      this.add.rectangle(360, 356, 684, 76, 0x0e141c).setStrokeStyle(1.5, PALETA.linea);

      for (const encargo of this.estado) this._crearChip(encargo);
      this.actualizar(this.estado);
    }

    _corto(ruta) {
      const piezas = ruta.split(/[\\/]/).filter(Boolean);
      return (piezas.length > 2 ? '…/' : '') + piezas.slice(-2).join('/') + '/';
    }

    _crearChip(encargo) {
      const fondo = this.add.rectangle(0, 0, 150, 26, 0x1a222c).setStrokeStyle(1.2, PALETA.tenue);
      const texto = this.add.text(0, 0, encargo.archivo, {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#E3EBF1',
      }).setOrigin(0.5);
      const marca = this.add.text(0, 0, '', { fontFamily: 'Inter', fontSize: '13px' }).setOrigin(0.5);
      const grupo = this.add.container(0, 0, [fondo, texto, marca]);
      marca.setPosition(62, 0);
      this.chips.set(encargo.archivo, { grupo, fondo, texto, marca });
    }

    /** Repinta desde el estado real del VFS. */
    actualizar(estado) {
      this.estado = estado;
      const contadorZona = new Map();
      let sueltos = 0;

      for (const encargo of estado) {
        const chip = this.chips.get(encargo.archivo);
        if (!chip) continue;

        let destinoX, destinoY;
        if (encargo.enSitio) {
          const zona = this.zonas.get(encargo.destino);
          const n = contadorZona.get(encargo.destino) || 0;
          contadorZona.set(encargo.destino, n + 1);
          destinoX = (zona ? zona.x : 18) + 84;
          destinoY = (zona ? zona.y : 40) + 42 + n * 30;
        } else {
          destinoX = this.zonaSuelto.x + 84 + (sueltos % 4) * 160;
          destinoY = this.zonaSuelto.y + 22 + Math.floor(sueltos / 4) * 30;
          sueltos++;
        }

        this.tweens.add({ targets: chip.grupo, x: destinoX, y: destinoY, duration: 260, ease: 'Cubic.easeOut' });

        if (encargo.resuelto) {
          chip.fondo.setStrokeStyle(1.6, PALETA.acento);
          chip.fondo.setFillStyle(0x123027);
          chip.marca.setText('✔').setColor('#19E6A4');
        } else if (encargo.perdido) {
          chip.fondo.setStrokeStyle(1.6, PALETA.aviso);
          chip.fondo.setFillStyle(0x2a2313);
          chip.marca.setText('!').setColor('#FBBF24');
        } else {
          chip.fondo.setStrokeStyle(1.2, PALETA.tenue);
          chip.fondo.setFillStyle(0x1a222c);
          chip.marca.setText('');
        }
      }
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
  let juegoPhaser = null;
  let destruido = false;

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
    <button type="button" class="ac-btn ac-btn--primario" data-empezar>Empezar</button>`;
  contenedor.append(portada);
  portada.querySelector('[data-empezar]').focus();
  portada.querySelector('[data-empezar]').addEventListener('click', () => { portada.remove(); jugar(); }, { once: true });

  async function jugar() {
    const { escenario, vfs, shell } = await prepararEscenario(datos.escenarios, nivel.escenario, nivel.os || 'linux');
    aplicarPreparacion(vfs, nivel.preparar);
    const verbos = verbosDe(shell.estilo);

    let pistasUsadas = 0, solucionVista = false, comandos = 0, errores = 0, terminado = false;
    let avisoPerdida = false;
    const inicio = Date.now();

    const tablero = document.createElement('div');
    tablero.className = 'ac-juego__zona';
    tablero.innerHTML = `
      <div class="ac-juego__tablero">
        <div class="ac-juego__lienzo" data-lienzo></div>
        <aside class="ac-juego__estado" aria-live="polite">
          <h4>Encargos</h4>
          <ul class="ac-juego__encargos" data-encargos></ul>
          <p class="ac-juego__ruta">Estás en <b data-ruta></b></p>
        </aside>
      </div>
      <div class="ac-juego__atajos" data-atajos role="group" aria-label="Atajos de comandos"></div>
      <div class="ac-juego__terminal" data-terminal></div>`;
    contenedor.append(tablero);

    const hud = crearHud(contenedor, {
      juego, nivel, conTiempo: false,
      alReiniciar: () => reiniciar(),
      alPista: () => mostrarPista(),
      alSolucion: () => mostrarSolucion(),
    });
    hud.puntos(100);

    const terminal = new Terminal(tablero.querySelector('[data-terminal]'), {
      shell,
      bienvenida: [
        { texto: `${escenario.nombre} · coloca cada archivo en su carpeta`, clase: 'dim' },
        { texto: `Recuerda: copiar conserva el original, mover no.`, clase: 'dim' },
      ],
      alEjecutar: (texto, resultado) => alComando(texto, resultado),
    });
    terminal.enfocar();

    let estado = analizarObjetivos(vfs, nivel.objetivos);

    const Phaser = await cargarPhaser(base);
    if (destruido) return;
    const Escena = crearEscenaRescate(Phaser);
    juegoPhaser = new Phaser.Game({
      type: Phaser.AUTO, width: 720, height: 400,
      parent: tablero.querySelector('[data-lienzo]'),
      backgroundColor: '#0B1017',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [Escena],
    });
    juegoPhaser.scene.start('rescate', { estado });
    ajustarLienzo(tablero, 'Carpetas de destino y archivos por colocar. La lista de encargos aparece en texto al lado.');

    pintarEstado();

    function alComando(texto, resultado) {
      if (terminado || !resultado) return;
      comandos++;

      const salida = resultado.lineas || [];
      const fallos = salida.filter(l => l.clase === 'err');
      if (fallos.length) { errores++; explicarError(texto, fallos); }

      estado = analizarObjetivos(vfs, nivel.objetivos);
      const escena = juegoPhaser?.scene?.getScene('rescate');
      if (escena) escena.actualizar(estado);
      pintarEstado();

      // El error que enseña: movió algo que había que copiar.
      const perdido = detectarMovimientoIndebido(estado);
      if (perdido && !avisoPerdida) {
        avisoPerdida = true;
        hud.aviso(
          `Has llevado <code>${perdido.archivo}</code> a su sitio, pero el original ha <b>desaparecido</b> de ` +
          `<code>${perdido.origen}</code>. Eso lo hace <code>${verbos.mover}</code>: <b>mueve</b>. ` +
          `Este encargo pedía una <b>copia</b>, que se hace con <code>${verbos.copiar}</code> y deja el original donde estaba.<br>` +
          `Puedes devolverlo con <code>${verbos.mover} ${perdido.destino}/${perdido.archivo} ${perdido.origen}</code> y repetir con ` +
          `<code>${verbos.copiar}</code>, o pulsar «Reiniciar».`, 'aviso');
      }

      const ctx = { vfs, shell, salida, historial: shell.historial, ultimoComando: texto };
      if (evaluar(ctx, nivel.meta)) ganar();
    }

    function explicarError(texto, fallos) {
      const mensaje = fallos[0].texto;
      let consejo = '';
      if (/No existe el archivo o el directorio|no puede encontrar|porque no existe/i.test(mensaje)) {
        consejo = `Comprueba la ruta: mira con <code>${verbos.listar}</code> dónde está de verdad el archivo. Si la carpeta de destino no existe todavía, créala con <code>${verbos.crear}</code>.`;
      } else if (/Es un directorio|se omite el directorio|rechaza/i.test(mensaje)) {
        consejo = `Para copiar una carpeta entera hace falta la opción recursiva: <code>${verbos.copiarDir}</code>.`;
      } else if (/orden no encontrada|no se reconoce/i.test(mensaje)) {
        consejo = `En este sistema se copia con <code>${verbos.copiar}</code> y se mueve con <code>${verbos.mover}</code>.`;
      }
      if (consejo) hud.aviso(consejo, 'info');
    }

    function pintarEstado() {
      tablero.querySelector('[data-ruta]').textContent = vfs.cwdTexto();
      const lista = tablero.querySelector('[data-encargos]');
      lista.innerHTML = '';
      for (const e of estado) {
        const li = document.createElement('li');
        li.className = 'ac-encargo' + (e.resuelto ? ' es-hecho' : '') + (e.perdido ? ' es-aviso' : '');
        const verbo = e.modo === 'copiar' ? 'Copia' : 'Mueve';
        li.innerHTML = `<span class="ac-encargo__marca" aria-hidden="true">${e.resuelto ? '✔' : (e.perdido ? '!' : '○')}</span>` +
          `<span>${verbo} <code>${e.archivo}</code> a <code>${e.destino}</code>` +
          `${e.modo === 'copiar' ? ' <b>conservando el original</b>' : ''}</span>` +
          `<span class="visually-hidden">${e.resuelto ? 'Hecho' : 'Pendiente'}</span>`;
        lista.append(li);
      }
      const p = progresoDe(estado);
      hud.nivel(`${nivel.nombre} · ${p.hechos}/${p.total}`);
      pintarAtajos();
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
      anadir(verbos.listar, verbos.listar);
      anadir(`${verbos.listar} (todo)`, shell.estilo === 'posix' ? 'ls -la' : (shell.estilo === 'cmd' ? 'dir /A' : 'Get-ChildItem -Force'));
      for (const e of estado.filter(x => !x.resuelto).slice(0, 3)) {
        const verbo = e.modo === 'copiar' ? verbos.copiar : verbos.mover;
        anadir(`${verbo} ${e.archivo}`, `${verbo} ${e.origen} ${e.destino}`);
      }
    }

    function mostrarPista() {
      const pistas = nivel.pistas || [];
      if (pistasUsadas >= pistas.length) { hud.aviso('No quedan pistas; «Ver solución» explica el camino completo.', 'aviso'); return; }
      hud.aviso(`<b>Pista ${pistasUsadas + 1}:</b> ${pistas[pistasUsadas]}`, 'pista');
      pistasUsadas++;
      hud.puntos(calcularPuntosRescate({ comandos, optimo: nivel.optimo ?? 2, pistas: pistasUsadas, errores }));
    }

    function mostrarSolucion() {
      solucionVista = true;
      hud.aviso(`<b>Solución:</b> <code>${(nivel.solucion || []).join('</code><br><code>')}</code><br>${nivel.explicacion || ''}`, 'solucion');
      hud.puntos(calcularPuntosRescate({ comandos, optimo: nivel.optimo ?? 2, pistas: pistasUsadas, solucion: true, errores }));
    }

    function ganar() {
      if (terminado) return;
      terminado = true;
      const tiempo = Math.round((Date.now() - inicio) / 1000);
      const puntos = calcularPuntosRescate({ comandos, optimo: nivel.optimo ?? 2, pistas: pistasUsadas, solucion: solucionVista, errores });
      hud.puntos(puntos);
      const xp = completarNivel(progreso, juego.slug, nivel, { puntos, tiempo, pistas: pistasUsadas, solucion: solucionVista });
      const siguiente = niveles[niveles.indexOf(nivel) + 1];
      pantallaVictoria(contenedor, {
        titulo: 'Todo en su sitio',
        texto: nivel.explicacion || 'Has colocado cada archivo donde tocaba.',
        puntos, xp, siguienteNombre: siguiente?.nombre,
        alRepetir: () => reiniciar(),
        alSiguiente: siguiente ? () => alTerminar && alTerminar({ siguiente: siguiente.id }) : null,
      });
      if (alTerminar) alTerminar({ completado: true, nivel: nivel.id, puntos, xp, tiempo });
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
