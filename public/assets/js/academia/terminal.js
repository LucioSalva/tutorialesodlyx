/**
 * Academia de Comandos · Terminal virtual (interfaz)
 * ---------------------------------------------------------------------
 * Pinta la terminal y habla con el motor. Todo el texto que escribe el
 * estudiante se inserta con textContent (nunca innerHTML), así que ni
 * siquiera un comando con <script> puede convertirse en HTML.
 *
 * Accesible a propósito: es un <textarea>/<input> real dentro de un
 * formulario, la salida vive en una región con aria-live y el foco se
 * mantiene donde el usuario espera. Funciona con teclado y con dedo.
 */

import { VFS } from './vfs.js';
import { Shell } from './shell.js';

export class Terminal {
  /**
   * @param {HTMLElement} raiz  contenedor vacío
   * @param {object} opciones   {shell, alEjecutar, bienvenida, maxLineas}
   */
  constructor(raiz, { shell, alEjecutar = null, bienvenida = [], maxLineas = 800 } = {}) {
    this.raiz = raiz;
    this.shell = shell;
    this.alEjecutar = alEjecutar;
    this.maxLineas = maxLineas;
    this.historialIndice = -1;
    this.borrador = '';
    this._construir();
    for (const linea of bienvenida) this.escribir(linea.texto ?? linea, linea.clase ?? 'dim');
    this.pintarPrompt();
  }

  _construir() {
    this.raiz.classList.add('ac-term');
    this.raiz.innerHTML = '';

    const barra = document.createElement('div');
    barra.className = 'ac-term__barra';
    const luces = document.createElement('span');
    luces.className = 'ac-term__luces';
    luces.setAttribute('aria-hidden', 'true');
    luces.innerHTML = '<i></i><i></i><i></i>';
    const titulo = document.createElement('span');
    titulo.className = 'ac-term__titulo';
    titulo.textContent = this._tituloVentana();
    barra.append(luces, titulo);

    this.botonReinicio = document.createElement('button');
    this.botonReinicio.type = 'button';
    this.botonReinicio.className = 'ac-term__accion';
    this.botonReinicio.textContent = 'Reiniciar escenario';
    barra.append(this.botonReinicio);

    this.salida = document.createElement('div');
    this.salida.className = 'ac-term__salida';
    this.salida.setAttribute('role', 'log');
    this.salida.setAttribute('aria-live', 'polite');
    this.salida.setAttribute('aria-label', 'Salida de la terminal');
    this.salida.tabIndex = 0;

    const fila = document.createElement('form');
    fila.className = 'ac-term__fila';
    fila.setAttribute('autocomplete', 'off');

    this.etiquetaPrompt = document.createElement('label');
    this.etiquetaPrompt.className = 'ac-term__prompt';
    this.etiquetaPrompt.setAttribute('for', 'ac-term-entrada-' + Math.random().toString(36).slice(2, 8));

    this.entrada = document.createElement('input');
    this.entrada.type = 'text';
    this.entrada.className = 'ac-term__entrada';
    this.entrada.id = this.etiquetaPrompt.getAttribute('for');
    this.entrada.autocapitalize = 'off';
    this.entrada.autocorrect = 'off';
    this.entrada.spellcheck = false;
    this.entrada.setAttribute('aria-label', 'Escribe un comando');

    fila.append(this.etiquetaPrompt, this.entrada);
    this.raiz.append(barra, this.salida, fila);

    fila.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const linea = this.entrada.value;
      this.entrada.value = '';
      this.historialIndice = -1;
      this.ejecutar(linea);
    });

    this.entrada.addEventListener('keydown', (ev) => this._teclas(ev));
    this.salida.addEventListener('click', (ev) => {
      if (window.getSelection().toString() === '') this.entrada.focus();
    });
    this.botonReinicio.addEventListener('click', () => {
      this.raiz.dispatchEvent(new CustomEvent('reiniciar-escenario', { bubbles: true }));
    });
  }

  _tituloVentana() {
    if (this.shell.estilo === 'cmd') return 'Símbolo del sistema — simulador';
    if (this.shell.estilo === 'powershell') return 'Windows PowerShell — simulador';
    return 'alumno@academia: terminal simulada';
  }

  _teclas(ev) {
    const historial = this.shell.historial;
    if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      if (!historial.length) return;
      if (this.historialIndice === -1) { this.borrador = this.entrada.value; this.historialIndice = historial.length; }
      this.historialIndice = Math.max(0, this.historialIndice - 1);
      this.entrada.value = historial[this.historialIndice] || '';
      this._alFinal();
    } else if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      if (this.historialIndice === -1) return;
      this.historialIndice++;
      if (this.historialIndice >= historial.length) {
        this.historialIndice = -1;
        this.entrada.value = this.borrador;
      } else {
        this.entrada.value = historial[this.historialIndice];
      }
      this._alFinal();
    } else if (ev.key === 'Tab') {
      ev.preventDefault();
      this._completar();
    } else if (ev.key === 'l' && ev.ctrlKey) {
      ev.preventDefault();
      this.limpiar();
    } else if (ev.key === 'c' && ev.ctrlKey && !window.getSelection().toString()) {
      ev.preventDefault();
      this.escribir(this.shell.prompt + ' ' + this.entrada.value + '^C', 'cmd');
      this.entrada.value = '';
    }
  }

  _alFinal() {
    requestAnimationFrame(() => this.entrada.setSelectionRange(this.entrada.value.length, this.entrada.value.length));
  }

  /** Completado con Tab: comandos al principio, rutas después. */
  _completar() {
    const valor = this.entrada.value;
    const piezas = valor.split(/\s+/);
    const ultima = piezas[piezas.length - 1];

    let candidatos;
    if (piezas.length === 1) {
      candidatos = [...new Set(this.shell.registro.keys())].filter(n => n.startsWith(ultima.toLowerCase()));
    } else {
      const sep = this.shell.vfs.sep;
      const corte = Math.max(ultima.lastIndexOf('/'), ultima.lastIndexOf('\\'));
      const prefijo = corte >= 0 ? ultima.slice(0, corte + 1) : '';
      const parcial = corte >= 0 ? ultima.slice(corte + 1) : ultima;
      const dir = this.shell.vfs.nodo(prefijo === '' ? this.shell.vfs.cwd : this.shell.vfs.segmentos(prefijo));
      if (!dir || !dir.esDir) return;
      candidatos = [...dir.hijos.values()]
        .filter(h => h.nombre.toLowerCase().startsWith(parcial.toLowerCase()))
        .map(h => prefijo + h.nombre + (h.esDir ? sep : ''));
    }

    if (!candidatos.length) return;
    if (candidatos.length === 1) {
      piezas[piezas.length - 1] = candidatos[0];
      this.entrada.value = piezas.join(' ');
      this._alFinal();
      return;
    }
    // Prefijo común y, si no avanza, se listan las opciones.
    const comun = candidatos.reduce((a, b) => {
      let i = 0;
      while (i < a.length && i < b.length && a[i].toLowerCase() === b[i].toLowerCase()) i++;
      return a.slice(0, i);
    });
    if (comun.length > ultima.length) {
      piezas[piezas.length - 1] = comun;
      this.entrada.value = piezas.join(' ');
      this._alFinal();
    } else {
      this.escribir(this.shell.prompt + ' ' + valor, 'cmd');
      this.escribir(candidatos.join('   '), 'dim');
      this.pintarPrompt();
    }
  }

  escribir(texto, clase = 'out') {
    const linea = document.createElement('div');
    linea.className = 'ac-term__linea ac-term__linea--' + clase;
    linea.textContent = texto === '' ? ' ' : texto;   // textContent: nada se interpreta como HTML
    this.salida.append(linea);
    while (this.salida.childElementCount > this.maxLineas) this.salida.firstElementChild.remove();
    this.salida.scrollTop = this.salida.scrollHeight;
    return linea;
  }

  escribirHtml(html, clase = 'aviso') {
    const linea = document.createElement('div');
    linea.className = 'ac-term__linea ac-term__linea--' + clase;
    linea.innerHTML = html;      // solo para textos del propio curso, nunca del usuario
    this.salida.append(linea);
    this.salida.scrollTop = this.salida.scrollHeight;
    return linea;
  }

  pintarPrompt() {
    this.etiquetaPrompt.textContent = this.shell.prompt;
  }

  limpiar() {
    this.salida.innerHTML = '';
  }

  /** Ejecuta una línea como si la hubiera escrito el estudiante. */
  ejecutar(linea) {
    const texto = String(linea);
    this.escribir(this.shell.prompt + ' ' + texto, 'cmd');

    if (texto.trim() === '') { this.pintarPrompt(); return null; }

    if (texto.trim() === 'ayuda') {
      this.escribirHtml('Teclas de la terminal: <b>↑ ↓</b> historial · <b>Tab</b> completar · <b>Ctrl+L</b> limpiar · <b>Ctrl+C</b> cancelar la línea.<br>Escribe <b>help</b> para ver los comandos implementados.');
      this.pintarPrompt();
      return null;
    }

    const resultado = this.shell.ejecutar(texto);
    let limpiarPantalla = false;

    for (const l of resultado.lineas) {
      if (l.limpiar) { limpiarPantalla = true; continue; }
      this.escribir(l.texto, l.clase);
    }
    // `clear` y `cls` devuelven una marca en lugar de texto.
    if (resultado.lineas.length === 0 && /^(clear|cls|clear-host)\b/i.test(texto.trim())) limpiarPantalla = true;
    if (limpiarPantalla) this.limpiar();

    this.pintarPrompt();
    if (this.alEjecutar) this.alEjecutar(texto, resultado);
    return resultado;
  }

  enfocar() { this.entrada.focus(); }
}

/** Panel con el árbol del escenario, que se repinta tras cada comando. */
export class ArbolVisual {
  constructor(raiz, vfs, { desde = null, titulo = 'Escenario' } = {}) {
    this.raiz = raiz;
    this.vfs = vfs;
    this.desde = desde;
    this.titulo = titulo;
    this.raiz.classList.add('ac-arbol');
    this.pintar();
  }

  pintar(resaltar = null) {
    const datos = this.vfs.arbol(this.desde);
    this.raiz.innerHTML = '';
    const cabecera = document.createElement('div');
    cabecera.className = 'ac-arbol__cabecera';
    cabecera.textContent = this.titulo;
    const cuerpo = document.createElement('pre');
    cuerpo.className = 'ac-arbol__cuerpo';

    const lineas = [];
    const recorrer = (nodo, prefijo, esUltimo, esRaiz) => {
      const rama = esRaiz ? '' : (esUltimo ? '└── ' : '├── ');
      const marca = nodo.tipo === 'dir' ? '/' : '';
      lineas.push({ texto: prefijo + rama + nodo.nombre + marca, tipo: nodo.tipo, nombre: nodo.nombre });
      const hijos = nodo.hijos || [];
      hijos.forEach((h, i) => recorrer(h, prefijo + (esRaiz ? '' : (esUltimo ? '    ' : '│   ')), i === hijos.length - 1, false));
    };
    recorrer(datos, '', true, true);

    for (const l of lineas) {
      const fila = document.createElement('span');
      fila.className = 'ac-arbol__fila' + (l.tipo === 'dir' ? ' es-dir' : '');
      if (resaltar && l.nombre === resaltar) fila.classList.add('es-nuevo');
      fila.textContent = l.texto;
      cuerpo.append(fila, document.createTextNode('\n'));
    }

    this.raiz.append(cabecera, cuerpo);
  }
}

/** Crea shell + VFS a partir de un escenario declarativo (JSON). */
export function montarEscenario(escenario, registro, catalogo = new Set()) {
  const estilo = escenario.estilo || (escenario.os === 'linux' ? 'posix' : 'windows');
  const vfs = new VFS(escenario.arbol || {}, estilo, escenario.inicio || null);
  const shell = new Shell({
    vfs,
    estilo: escenario.os === 'linux' ? 'posix' : escenario.os,
    registro,
    catalogo,
    usuario: escenario.usuario || (escenario.os === 'linux' ? 'alumno' : 'Alumno'),
    host: escenario.host || 'academia',
  });
  shell.procesos = JSON.parse(JSON.stringify(escenario.procesos || []));
  shell.servicios = JSON.parse(JSON.stringify(escenario.servicios || {}));
  shell.red = JSON.parse(JSON.stringify(escenario.red || {}));
  shell.puertos = JSON.parse(JSON.stringify(escenario.puertos || []));
  shell.web = JSON.parse(JSON.stringify(escenario.web || {}));
  shell.registros = (escenario.registros || []).slice();
  shell.escenarioOriginal = escenario;
  return { vfs, shell };
}

/** Devuelve el escenario a su estado inicial sin recargar la página. */
export function reiniciarEscenario(shell) {
  const e = shell.escenarioOriginal || {};
  shell.vfs.reiniciar();
  shell.vfs.cwd = shell.vfs.segmentos(e.inicio || (shell.estilo === 'posix' ? '/home/alumno' : 'C:\\Users\\Alumno'));
  shell.procesos = JSON.parse(JSON.stringify(e.procesos || []));
  shell.servicios = JSON.parse(JSON.stringify(e.servicios || {}));
  shell.red = JSON.parse(JSON.stringify(e.red || {}));
  shell.puertos = JSON.parse(JSON.stringify(e.puertos || []));
  shell.historial.length = 0;
  shell.ultimoCodigo = 0;
}
