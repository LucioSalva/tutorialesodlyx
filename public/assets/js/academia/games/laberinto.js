/**
 * Juego 1 · Laberinto de directorios
 * ---------------------------------------------------------------------
 * El mapa NO es un decorado: se construye leyendo el árbol real del
 * escenario virtual. Cada directorio es una sala, y el personaje se mueve
 * cuando el jugador escribe `cd`. El juego no interpreta comandos: los
 * ejecuta el mismo shell simulado que la terminal de práctica, y después
 * relee el sistema de archivos para repintar.
 */

import {
  cargarPhaser, PALETA, crearHud, pantallaVictoria, completarNivel,
  prepararEscenario, Terminal, reiniciarEscenario,
} from '../juego-base.js';
import { evaluar } from '../misiones.js';

/* ------------------------------------------------------------------ *
 * Lógica pura (exportada para poder probarla sin navegador)
 * ------------------------------------------------------------------ */

/**
 * Recorre el VFS y devuelve las salas del mapa con su posición.
 * Columna = profundidad; fila = orden de recorrido en profundidad.
 * @returns {{salas: Array, porRuta: Object, ancho: number, alto: number}}
 */
export function construirMapa(vfs, rutaRaiz, profundidadMax = 3) {
  const segsRaiz = vfs.segmentos(rutaRaiz);
  const raiz = vfs.nodo(segsRaiz);
  const salas = [];
  const porRuta = {};
  let fila = 0;

  const recorrer = (nodo, segs, profundidad) => {
    const ruta = vfs.texto(segs);
    const sala = {
      ruta,
      nombre: nodo.nombre || (vfs.estilo === 'windows' ? 'C:' : '/'),
      profundidad,
      fila: fila++,
      hijos: [],
      ficheros: [...nodo.hijos.values()].filter(h => !h.esDir).map(h => h.nombre),
      padre: profundidad === 0 ? null : vfs.texto(segs.slice(0, -1)),
    };
    salas.push(sala);
    porRuta[ruta] = sala;

    if (profundidad >= profundidadMax) return sala;
    const subdirs = [...nodo.hijos.values()]
      .filter(h => h.esDir)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    for (const hijo of subdirs) {
      const sub = recorrer(hijo, segs.concat(hijo.nombre), profundidad + 1);
      sala.hijos.push(sub.ruta);
    }
    return sala;
  };

  if (raiz && raiz.esDir) recorrer(raiz, segsRaiz, 0);

  const profundidades = salas.map(s => s.profundidad);
  return {
    salas,
    porRuta,
    ancho: (Math.max(0, ...profundidades) + 1),
    alto: salas.length,
  };
}

/** Coordenadas de una sala dentro del lienzo. */
export function posicionSala(sala, { anchoSala = 148, altoSala = 46, margenX = 24, margenY = 22, separacionX = 178, separacionY = 58 } = {}) {
  return {
    x: margenX + sala.profundidad * separacionX,
    y: margenY + sala.fila * separacionY,
    ancho: anchoSala,
    alto: altoSala,
  };
}

/**
 * Puntuación: premia llegar con pocos comandos y sin ayuda, pero nunca
 * baja de 10 puntos — equivocarse no puede dejar el marcador en cero.
 */
export function calcularPuntos({ comandos = 0, optimo = 3, pistas = 0, solucion = false }) {
  const exceso = Math.max(0, comandos - optimo);
  let puntos = 100 - exceso * 6 - pistas * 12;
  if (solucion) puntos = Math.min(puntos, 25);
  return Math.max(10, Math.round(puntos));
}

/** Salidas disponibles desde el directorio actual (para los botones táctiles). */
export function salidasDe(vfs) {
  const actual = vfs.nodo(vfs.cwd);
  const salidas = [];
  if (vfs.cwd.length > 0) salidas.push({ etiqueta: '..', destino: '..' });
  if (actual && actual.esDir) {
    for (const hijo of [...actual.hijos.values()].filter(h => h.esDir).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))) {
      salidas.push({ etiqueta: hijo.nombre, destino: hijo.nombre });
    }
  }
  return salidas;
}

/** El comando de listar y el de leer cambian según el shell. */
export function verbosDe(estilo) {
  if (estilo === 'cmd') {
    return { listar: 'dir', leer: 'type', ir: 'cd', donde: 'cd',
             copiar: 'copy', mover: 'move', crear: 'mkdir', copiarDir: 'xcopy /E /I', borrar: 'del' };
  }
  if (estilo === 'powershell') {
    return { listar: 'Get-ChildItem', leer: 'Get-Content', ir: 'Set-Location', donde: 'Get-Location',
             copiar: 'Copy-Item', mover: 'Move-Item', crear: 'New-Item -ItemType Directory',
             copiarDir: 'Copy-Item -Recurse', borrar: 'Remove-Item' };
  }
  return { listar: 'ls', leer: 'cat', ir: 'cd', donde: 'pwd',
           copiar: 'cp', mover: 'mv', crear: 'mkdir', copiarDir: 'cp -r', borrar: 'rm' };
}


/**
 * Deja el lienzo listo: descripción para lectores de pantalla y límites de
 * ancho propios. Phaser escala el canvas al contenedor, pero el contenedor
 * no debe poder ensanchar la página en un móvil.
 */
export function ajustarLienzo(tablero, descripcion) {
  const lienzo = tablero.querySelector('[data-lienzo]');
  if (lienzo) {
    lienzo.style.maxWidth = '100%';
    lienzo.style.overflow = 'hidden';
  }
  const aplicar = () => {
    const c = tablero.querySelector('canvas');
    if (!c) return;
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', descripcion);
    c.style.maxWidth = '100%';
    c.style.height = 'auto';
  };
  setTimeout(aplicar, 120);
  setTimeout(aplicar, 600);
}

/* ------------------------------------------------------------------ *
 * Escena Phaser (se define al vuelo, cuando Phaser ya está cargado)
 * ------------------------------------------------------------------ */

function crearEscenaMapa(Phaser) {
  return class EscenaMapa extends Phaser.Scene {
    constructor() { super('mapa'); }

    init(datos) {
      // Estado por partida: aquí, nunca en el constructor (la escena se reutiliza).
      this.juego = datos.juego;
      this.mapa = datos.mapa;
      this.rutaActual = datos.rutaActual;
      this.rutaObjetivo = datos.rutaObjetivo;
      this.visitadas = new Set([datos.rutaActual]);
      this.reveladas = new Set();
      this.graficos = new Map();
    }

    create() {
      this.cameras.main.setBackgroundColor(PALETA.fondo);
      this.capaLineas = this.add.graphics();
      this.contenedor = this.add.container(0, 0);

      for (const sala of this.mapa.salas) this._dibujarSala(sala);
      this._dibujarConexiones();

      // Marcador del jugador: un círculo con estela, dibujado encima.
      const pos = this._centro(this.rutaActual);
      this.jugador = this.add.circle(pos.x, pos.y, 11, PALETA.acento);
      this.jugador.setStrokeStyle(2, 0xffffff, 0.65);
      this.pulso = this.tweens.add({
        targets: this.jugador, scale: 1.25, duration: 720,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });

      const alto = this.mapa.salas.length * 58 + 60;
      this.cameras.main.setBounds(0, 0, Math.max(720, this.mapa.ancho * 178 + 60), Math.max(420, alto));
      this._encuadrar(pos, true);
      this._repintar();
    }

    _dibujarSala(sala) {
      const p = posicionSala(sala);
      const caja = this.add.rectangle(p.x + p.ancho / 2, p.y + p.alto / 2, p.ancho, p.alto, PALETA.panel);
      caja.setStrokeStyle(1.5, PALETA.linea);

      const etiqueta = this.add.text(p.x + 12, p.y + 8, sala.nombre + '/', {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#E3EBF1',
      });
      const detalle = this.add.text(p.x + 12, p.y + 26, '', {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#8FA0AE',
      });

      this.graficos.set(sala.ruta, { caja, etiqueta, detalle, sala });
    }

    _dibujarConexiones() {
      this.capaLineas.clear();
      this.capaLineas.lineStyle(1.5, PALETA.linea, 0.9);
      for (const sala of this.mapa.salas) {
        const p = posicionSala(sala);
        for (const rutaHijo of sala.hijos) {
          const hijo = this.mapa.porRuta[rutaHijo];
          if (!hijo) continue;
          const ph = posicionSala(hijo);
          this.capaLineas.beginPath();
          this.capaLineas.moveTo(p.x + p.ancho, p.y + p.alto / 2);
          this.capaLineas.lineTo(ph.x, ph.y + ph.alto / 2);
          this.capaLineas.strokePath();
        }
      }
    }

    _centro(ruta) {
      const sala = this.mapa.porRuta[ruta];
      if (!sala) return { x: 100, y: 60 };
      const p = posicionSala(sala);
      return { x: p.x + p.ancho / 2, y: p.y + p.alto / 2 };
    }

    _encuadrar(pos, inmediato = false) {
      const cam = this.cameras.main;
      const x = pos.x - cam.width / 2;
      const y = pos.y - cam.height / 2;
      if (inmediato) cam.setScroll(x, y);
      else this.tweens.add({ targets: cam, scrollX: x, scrollY: y, duration: 320, ease: 'Sine.easeOut' });
    }

    /** La escena solo pinta: el estado siempre viene del VFS real. */
    actualizar({ rutaActual, reveladas }) {
      const cambio = rutaActual !== this.rutaActual;
      this.rutaActual = rutaActual;
      this.visitadas.add(rutaActual);
      if (reveladas) this.reveladas = reveladas;

      const destino = this._centro(rutaActual);
      if (cambio) {
        this.tweens.add({ targets: this.jugador, x: destino.x, y: destino.y, duration: 280, ease: 'Cubic.easeOut' });
        this._encuadrar(destino);
      }
      this._repintar();
    }

    _repintar() {
      for (const [ruta, g] of this.graficos) {
        const esActual = ruta === this.rutaActual;
        const esObjetivo = ruta === this.rutaObjetivo;
        const visitada = this.visitadas.has(ruta);

        let color = PALETA.panel;
        let borde = PALETA.linea;
        if (esObjetivo) { borde = PALETA.aviso; }
        if (visitada) { color = 0x16202c; }
        if (esActual) { color = 0x123027; borde = PALETA.acento; }

        g.caja.setFillStyle(color);
        g.caja.setStrokeStyle(esActual ? 2.5 : 1.5, borde);
        g.etiqueta.setColor(esActual ? '#19E6A4' : (esObjetivo ? '#FBBF24' : '#E3EBF1'));

        // Los archivos solo aparecen cuando el jugador ha listado la sala:
        // ver el contenido es consecuencia de usar ls/dir, no un regalo.
        if (this.reveladas.has(ruta) && g.sala.ficheros.length) {
          const lista = g.sala.ficheros.slice(0, 3).join(' · ');
          g.detalle.setText(lista + (g.sala.ficheros.length > 3 ? ' …' : ''));
        } else if (this.reveladas.has(ruta)) {
          g.detalle.setText('(vacío)');
        } else {
          g.detalle.setText(esObjetivo ? '★ objetivo' : '');
          if (esObjetivo) g.detalle.setColor('#FBBF24');
        }
      }
    }
  };
}

/* ------------------------------------------------------------------ *
 * Montaje del juego
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

  /* --- 1. Pantalla inicial: qué es, cómo se juega y qué se aprende --- */
  const portada = document.createElement('div');
  portada.className = 'ac-portada';
  portada.innerHTML = `
    <h3 class="ac-portada__titulo">${juego.nombre} · ${nivel.nombre}</h3>
    <p class="ac-portada__objetivo"><b>Objetivo:</b> ${nivel.objetivo}</p>
    <div class="ac-portada__cols">
      <div>
        <h4>Cómo se juega</h4>
        <p>${juego.mecanica}</p>
        <p class="ac-portada__nota">${juego.controles}</p>
      </div>
      <div>
        <h4>Lo que practicas</h4>
        <ul>${(juego.aprende || []).map(a => `<li><code>${a}</code></li>`).join('')}</ul>
      </div>
    </div>
    <button type="button" class="ac-btn ac-btn--primario" data-empezar>Empezar</button>`;
  contenedor.append(portada);
  const btnEmpezar = portada.querySelector('[data-empezar]');
  btnEmpezar.focus();

  btnEmpezar.addEventListener('click', () => { portada.remove(); jugar(); }, { once: true });

  /* --- 2. La partida --- */
  async function jugar(reinicio = false) {
    const { escenario, vfs, shell } = await prepararEscenario(datos.escenarios, nivel.escenario, nivel.os || 'linux');
    aplicarPreparacion(vfs, nivel.preparar);
    if (nivel.preparar && nivel.preparar.cwd) vfs.cwd = vfs.segmentos(nivel.preparar.cwd);

    const verbos = verbosDe(shell.estilo);
    const mapa = construirMapa(vfs, nivel.mapa?.raiz || (shell.estilo === 'posix' ? '/home/alumno' : 'C:\\Users\\Alumno'), nivel.mapa?.profundidad ?? 3);
    const reveladas = new Set();

    let pistasUsadas = 0;
    let solucionVista = false;
    let comandos = 0;
    let terminado = false;
    const inicio = Date.now();

    /* Maquetación: lienzo + estado accesible + atajos + terminal */
    const tablero = document.createElement('div');
    tablero.className = 'ac-juego__zona';
    tablero.innerHTML = `
      <div class="ac-juego__tablero">
        <div class="ac-juego__lienzo" data-lienzo role="img"
             aria-label="Mapa del laberinto de directorios. El estado completo está descrito debajo en texto."></div>
        <aside class="ac-juego__estado" aria-live="polite">
          <h4>Dónde estás</h4>
          <p class="ac-juego__ruta" data-ruta></p>
          <h4>Salidas</h4>
          <ul class="ac-juego__salidas" data-salidas></ul>
          <h4>Objetivo</h4>
          <p class="ac-juego__objetivo">${nivel.objetivo}</p>
        </aside>
      </div>
      <div class="ac-juego__atajos" data-atajos role="group" aria-label="Atajos de comandos"></div>
      <div class="ac-juego__terminal" data-terminal></div>`;
    contenedor.append(tablero);

    const hud = crearHud(contenedor, {
      juego, nivel,
      conTiempo: false,
      alReiniciar: () => reiniciar(),
      alPista: () => mostrarPista(),
      alSolucion: () => mostrarSolucion(),
    });
    hud.puntos(100);

    /* Terminal real: el juego nunca interpreta el texto del jugador. */
    const terminal = new Terminal(tablero.querySelector('[data-terminal]'), {
      shell,
      bienvenida: [
        { texto: `${escenario.nombre} · escribe «${verbos.donde}» para saber dónde estás`, clase: 'dim' },
        { texto: `Usa «${verbos.listar}» para mirar y «${verbos.ir} nombre» para entrar. «ayuda» explica las teclas.`, clase: 'dim' },
      ],
      alEjecutar: (texto, resultado) => alComando(texto, resultado),
    });
    terminal.enfocar();

    /* Phaser: solo ahora, cuando de verdad hace falta. */
    const Phaser = await cargarPhaser(base);
    if (destruido) return;
    const EscenaMapa = crearEscenaMapa(Phaser);
    juegoPhaser = new Phaser.Game({
      type: Phaser.AUTO,
      width: 720,
      height: Math.max(300, Math.min(430, mapa.salas.length * 58 + 50)),
      parent: tablero.querySelector('[data-lienzo]'),
      backgroundColor: '#0B1017',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [EscenaMapa],
    });
    juegoPhaser.scene.start('mapa', {
      juego, mapa,
      rutaActual: vfs.cwdTexto(),
      rutaObjetivo: nivel.mapa?.objetivo || '',
    });

    ajustarLienzo(tablero, 'Mapa de salas del laberinto. Las salidas y tu posición están descritas en texto al lado.');

    pintarEstado();

    /* ---------------- reacciones ---------------- */

    function alComando(texto, resultado) {
      if (terminado || !resultado) return;
      comandos++;

      const esListado = new RegExp('^\\s*(ls|dir|get-childitem|gci)\\b', 'i').test(texto);
      if (esListado) reveladas.add(vfs.cwdTexto());

      const escena = juegoPhaser?.scene?.getScene('mapa');
      if (escena) escena.actualizar({ rutaActual: vfs.cwdTexto(), reveladas: new Set(reveladas) });
      pintarEstado();

      const ctx = { vfs, shell, salida: resultado.lineas || [], historial: shell.historial, ultimoComando: texto };

      // Un error no es un «incorrecto»: se explica el concepto detrás.
      const errores = (resultado.lineas || []).filter(l => l.clase === 'err');
      if (errores.length) explicarError(texto, errores);

      if (evaluar(ctx, nivel.meta)) ganar();
    }

    function explicarError(texto, errores) {
      const mensaje = errores[0].texto;
      let consejo = '';
      if (/No existe el archivo o el directorio|no puede encontrar|porque no existe/i.test(mensaje)) {
        consejo = `Esa ruta no existe <b>desde donde estás ahora</b>. Mira las salidas con <code>${verbos.listar}</code>, y recuerda que <code>..</code> sube un nivel.`;
      } else if (/No es un directorio|no es válido/i.test(mensaje)) {
        consejo = `Eso es un archivo, no una sala: no se puede entrar con <code>${verbos.ir}</code>. Léelo con <code>${verbos.leer} nombre</code>.`;
      } else if (/orden no encontrada|no se reconoce/i.test(mensaje)) {
        consejo = `Ese comando no existe en este shell. Aquí se navega con <code>${verbos.ir}</code>, se mira con <code>${verbos.listar}</code> y se lee con <code>${verbos.leer}</code>.`;
      }
      if (consejo) hud.aviso(consejo, 'info');
    }

    function pintarEstado() {
      const ruta = tablero.querySelector('[data-ruta]');
      ruta.textContent = vfs.cwdTexto();

      const lista = tablero.querySelector('[data-salidas]');
      lista.innerHTML = '';
      const salidas = salidasDe(vfs);
      if (!salidas.length) lista.innerHTML = '<li>No hay salidas desde aquí.</li>';
      for (const s of salidas) {
        const li = document.createElement('li');
        li.textContent = s.etiqueta === '..' ? '.. (subir un nivel)' : s.etiqueta + '/';
        lista.append(li);
      }
      pintarAtajos(salidas);
    }

    /** Botones táctiles: escriben el comando de verdad, no hacen trampa. */
    function pintarAtajos(salidas) {
      const zona = tablero.querySelector('[data-atajos]');
      zona.innerHTML = '';
      const anadir = (etiqueta, comando, titulo) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ac-chip';
        b.textContent = etiqueta;
        b.title = titulo || comando;
        b.addEventListener('click', () => { terminal.ejecutar(comando); terminal.enfocar(); });
        zona.append(b);
        return b;
      };
      anadir(verbos.donde, verbos.donde, 'Saber dónde estás');
      anadir(verbos.listar, verbos.listar, 'Ver qué hay aquí');
      for (const s of salidas.slice(0, 6)) {
        anadir(`${verbos.ir} ${s.etiqueta}`, `${verbos.ir} ${s.destino}`, s.etiqueta === '..' ? 'Subir un nivel' : 'Entrar en ' + s.etiqueta);
      }
      const actual = vfs.nodo(vfs.cwd);
      if (actual && actual.esDir) {
        for (const f of [...actual.hijos.values()].filter(h => !h.esDir).slice(0, 4)) {
          anadir(`${verbos.leer} ${f.nombre}`, `${verbos.leer} ${f.nombre}`, 'Leer ' + f.nombre);
        }
      }
    }

    function mostrarPista() {
      const pistas = nivel.pistas || [];
      if (pistasUsadas >= pistas.length) {
        hud.aviso('No quedan más pistas. El botón «Ver solución» explica el camino completo.', 'aviso');
        return;
      }
      hud.aviso(`<b>Pista ${pistasUsadas + 1}:</b> ${pistas[pistasUsadas]}`, 'pista');
      pistasUsadas++;
      hud.puntos(calcularPuntos({ comandos, optimo: nivel.optimo ?? 3, pistas: pistasUsadas, solucion: solucionVista }));
    }

    function mostrarSolucion() {
      solucionVista = true;
      hud.aviso(`<b>Solución:</b> <code>${(nivel.solucion || []).join('</code> → <code>')}</code><br>${nivel.explicacion || ''}`, 'solucion');
      hud.puntos(calcularPuntos({ comandos, optimo: nivel.optimo ?? 3, pistas: pistasUsadas, solucion: true }));
    }

    function ganar() {
      if (terminado) return;
      terminado = true;
      const tiempo = Math.round((Date.now() - inicio) / 1000);
      const puntos = calcularPuntos({ comandos, optimo: nivel.optimo ?? 3, pistas: pistasUsadas, solucion: solucionVista });
      hud.puntos(puntos);
      const xp = completarNivel(progreso, juego.slug, nivel, { puntos, tiempo, pistas: pistasUsadas, solucion: solucionVista });

      const siguiente = niveles[niveles.indexOf(nivel) + 1];
      pantallaVictoria(contenedor, {
        titulo: 'Sala encontrada',
        texto: nivel.explicacion || 'Has llegado al objetivo navegando con comandos.',
        puntos, xp,
        siguienteNombre: siguiente?.nombre,
        alRepetir: () => reiniciar(),
        alSiguiente: siguiente ? () => alTerminar && alTerminar({ siguiente: siguiente.id }) : null,
      });
      if (alTerminar) alTerminar({ completado: true, nivel: nivel.id, puntos, xp, tiempo });
    }

    function reiniciar() {
      reiniciarEscenario(shell);
      limpiarPartida();
      jugar(true);
    }

    function limpiarPartida() {
      if (juegoPhaser) { juegoPhaser.destroy(true); juegoPhaser = null; }
      tablero.remove();
      hud.elemento.nextElementSibling?.remove();   // zona de avisos
      hud.elemento.remove();
      contenedor.querySelector('.ac-victoria')?.remove();
    }

    limpieza.push(limpiarPartida);
  }

  return {
    destruir() {
      destruido = true;
      while (limpieza.length) {
        const fn = limpieza.pop();
        try { fn(); } catch { /* la vista ya estaba desmontada */ }
      }
      if (juegoPhaser) { juegoPhaser.destroy(true); juegoPhaser = null; }
      contenedor.innerHTML = '';
    },
  };
}

/**
 * Prepara el escenario del nivel: crea carpetas y archivos propios del
 * juego sin tocar los escenarios compartidos.
 */
export function aplicarPreparacion(vfs, preparar) {
  if (!preparar) return;
  for (const ruta of preparar.mkdir || []) {
    try { vfs.mkdir(ruta, { padres: true }); } catch { /* ya existía */ }
  }
  for (const f of preparar.escribir || []) {
    const segs = vfs.segmentos(f.ruta);
    const padre = segs.slice(0, -1);
    if (padre.length) { try { vfs.mkdir(vfs.texto(padre), { padres: true }); } catch {} }
    try { vfs.escribir(f.ruta, f.contenido); } catch {}
  }
  for (const ruta of preparar.borrar || []) {
    try { vfs.borrar(ruta, { recursivo: true }); } catch {}
  }
  for (const p of preparar.permisos || []) {
    try { vfs.chmod(p.ruta, parseInt(String(p.modo), 8)); } catch {}
  }
}
