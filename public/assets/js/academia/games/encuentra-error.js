/**
 * Academia de Comandos · Juego 11 · «Encuentra el error»
 * ---------------------------------------------------------------------
 * Un comando que parece correcto y no lo es. El jugador señala la pieza
 * que falla y escribe la versión buena. La corrección se EJECUTA en el
 * simulador: si funciona de verdad, el nivel da por válido el arreglo,
 * aunque no sea la redacción exacta que esperábamos.
 */

import { crearHud, pantallaVictoria, completarNivel, prepararEscenario, evaluar } from '../juego-base.js';

const el = (tag, props = {}, ...hijos) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'clase') n.className = v;
    else if (k === 'texto') n.textContent = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v === true ? '' : v);
  }
  for (const h of hijos.flat()) if (h !== null && h !== undefined && h !== false) {
    n.append(h.nodeType ? h : document.createTextNode(String(h)));
  }
  return n;
};

/* ------------------------------------------------------- lógica probable */

/** Trocea el comando en piezas señalables (respetando lo entrecomillado). */
export function trocear(comando) {
  return String(comando).match(/"[^"]*"|'[^']*'|\S+/g) || [];
}

/** Compara dos comandos ignorando espacios de más y comillas equivalentes. */
export function mismoComando(a, b) {
  const limpia = (t) => String(t ?? '').trim().replace(/\s+/g, ' ').replace(/["']/g, '"');
  return limpia(a) === limpia(b);
}

/**
 * ¿El arreglo del jugador es válido?
 * Primero se mira la lista de respuestas aceptadas; si no encaja, se
 * ejecuta en el simulador y se acepta si cumple el validador del reto.
 */
export function evaluarArreglo(texto, reto, ejecutar) {
  const aceptadas = [reto.correcto, ...(reto.acepta || [])];
  if (aceptadas.some(c => mismoComando(texto, c))) return { ok: true, via: 'texto' };
  if (reto.validador && typeof ejecutar === 'function') {
    const res = ejecutar(texto);
    if (res && res.ok) return { ok: true, via: 'ejecucion', salida: res.salida };
    return { ok: false, salida: res?.salida || [] };
  }
  return { ok: false, salida: [] };
}

/* --------------------------------------------------------------- el juego */
export async function iniciar(contenedor, opciones = {}) {
  const { juego, nivelId, datos = {}, progreso, alTerminar } = opciones;
  const niveles = juego.niveles || [];
  let nivel = niveles.find(n => String(n.id) === String(nivelId)) || niveles[0];
  let estado = null;

  function pantallaInicio() {
    contenedor.innerHTML = '';
    contenedor.append(el('div', { clase: 'ac-juego__inicio' },
      el('h3', { texto: juego.nombre }),
      el('p', { clase: 'ac-juego__resumen', texto: juego.resumen }),
      el('div', { clase: 'ac-juego__ficha' },
        el('p', {}, el('b', { texto: 'Cómo se juega: ' }), juego.mecanica),
        el('p', {}, el('b', { texto: 'Controles: ' }), juego.controles),
        el('p', {}, el('b', { texto: 'Nivel: ' }), `${nivel.nombre} · ${nivel.dificultad} · ${nivel.os}`),
        el('p', {}, el('b', { texto: 'Objetivo: ' }), nivel.objetivo),
      ),
      el('div', { clase: 'ac-juego__selector' },
        el('label', { clase: 'ac-juego__etiqueta', for: 'ac-err-nivel', texto: 'Elige nivel' }),
        el('select', { clase: 'ac-select', id: 'ac-err-nivel',
          onchange: (ev) => { nivel = niveles[Number(ev.target.value)] || nivel; pantallaInicio(); } },
          ...niveles.map((n, i) => el('option', { value: i, selected: n.id === nivel.id },
            `${n.nombre} · ${n.dificultad} · ${n.os}`))),
      ),
      el('button', { clase: 'ac-btn ac-btn--primario', texto: 'Empezar', onclick: jugar }),
    ));
    contenedor.querySelector('.ac-btn--primario').focus();
  }

  async function jugar() {
    contenedor.innerHTML = '';
    estado = {
      indice: 0, puntos: 0, pistas: 0, solucionVista: false,
      señalado: null, fallosRonda: 0, inicio: Date.now(), shell: null,
    };

    const hud = crearHud(contenedor, {
      juego, nivel, alReiniciar: jugar, alPista: darPista, alSolucion: verSolucion,
    });
    estado.hud = hud;

    if (nivel.escenario && datos.escenarios?.length) {
      try {
        const montado = await prepararEscenario(datos.escenarios, nivel.escenario, nivel.os);
        estado.shell = montado.shell;
        estado.vfs = montado.vfs;
      } catch { /* el nivel funciona igual sin ejecución real */ }
    }

    const caja = el('div', { clase: 'ac-err' });
    contenedor.append(caja);
    estado.refs = { caja };
    pintarReto();
  }

  function pintarReto() {
    const reto = (nivel.retos || [])[estado.indice];
    const { caja } = estado.refs;
    caja.innerHTML = '';
    if (!reto) return;

    estado.piezas = trocear(reto.comando);
    estado.señalado = null;

    caja.append(
      el('p', { clase: 'ac-err__progreso', texto: `Comando ${estado.indice + 1} de ${(nivel.retos || []).length}` }),
      el('p', { clase: 'ac-err__intencion' }, el('b', { texto: 'Lo que se quería hacer: ' }), reto.intencion),
    );

    const linea = el('div', { clase: 'ac-err__linea', role: 'group', 'aria-label': 'Señala la pieza equivocada' });
    estado.piezas.forEach((pieza, i) => {
      linea.append(el('button', {
        type: 'button', clase: 'ac-err__pieza', 'data-i': i,
        'aria-pressed': 'false',
        'aria-label': `Pieza ${i + 1}: ${pieza}. Púlsala si crees que es la equivocada.`,
        texto: pieza,
        onclick: () => señalar(i),
      }));
    });
    caja.append(el('div', { clase: 'ac-err__consola' },
      el('span', { clase: 'ac-err__prompt', 'aria-hidden': 'true',
        texto: reto.os === 'cmd' ? 'C:\\Users\\Alumno>' : reto.os === 'powershell' ? 'PS C:\\Users\\Alumno>' : 'alumno@academia:~$' }),
      linea));

    if (reto.salidaReal) {
      caja.append(el('pre', { clase: 'ac-err__salida', texto: reto.salidaReal }));
    }

    const form = el('form', { clase: 'ac-err__form', onsubmit: (e) => { e.preventDefault(); corregir(); } });
    form.append(
      el('label', { clase: 'ac-juego__etiqueta', for: 'ac-err-fix', texto: 'Escribe el comando corregido' }),
      el('input', { clase: 'ac-input', id: 'ac-err-fix', type: 'text', autocomplete: 'off', spellcheck: 'false', value: reto.comando }),
      el('button', { clase: 'ac-btn ac-btn--primario', type: 'submit', texto: 'Comprobar arreglo' }),
    );
    caja.append(form);
    estado.refs.form = form;
  }

  function señalar(i) {
    const reto = (nivel.retos || [])[estado.indice];
    estado.señalado = i;
    for (const btn of estado.refs.caja.querySelectorAll('.ac-err__pieza')) {
      const suyo = Number(btn.dataset.i) === i;
      btn.classList.toggle('es-sel', suyo);
      btn.setAttribute('aria-pressed', suyo ? 'true' : 'false');
    }
    if (i === reto.erroneo) {
      estado.hud.aviso(`<b>Ahí está el fallo:</b> ${reto.porque}`, 'ok');
    } else {
      estado.fallosRonda++;
      estado.hud.aviso(`Esa pieza está bien. <code>${estado.piezas[i]}</code> ${reto.porPieza?.[String(i)] || 'hace lo que debe en este comando.'}`, 'error');
    }
  }

  function corregir() {
    const reto = (nivel.retos || [])[estado.indice];
    const texto = estado.refs.form.querySelector('input').value;

    const ejecutar = estado.shell ? (linea) => {
      const resultado = estado.shell.ejecutar(linea);
      const ctx = {
        vfs: estado.vfs, shell: estado.shell,
        salida: resultado.lineas, historial: estado.shell.historial, ultimoComando: linea,
      };
      return { ok: evaluar(ctx, reto.validador), salida: resultado.lineas };
    } : null;

    const veredicto = evaluarArreglo(texto, reto, ejecutar);

    if (!veredicto.ok) {
      estado.fallosRonda++;
      const errores = (veredicto.salida || []).filter(l => l.clase === 'err').slice(0, 2).map(l => l.texto);
      estado.hud.aviso(
        `Ese arreglo todavía no funciona. ${errores.length ? 'La terminal responde: <code>' + errores.join(' / ') + '</code>. ' : ''}${reto.pista || ''}`,
        'error');
      return;
    }

    const puntos = Math.max(10, 30 - estado.fallosRonda * 5 - estado.pistas * 5);
    estado.puntos += puntos;
    estado.hud.puntos(estado.puntos);
    estado.hud.aviso(
      `<b>Arreglado</b>${veredicto.via === 'ejecucion' ? ' (comprobado ejecutándolo en el simulador)' : ''}: ${reto.explica}`,
      'ok');

    estado.indice++;
    estado.fallosRonda = 0;
    if (estado.indice >= (nivel.retos || []).length) ganar();
    else pintarReto();
  }

  function darPista() {
    const reto = (nivel.retos || [])[estado.indice];
    if (!reto) return;
    estado.pistas++;
    estado.hud.aviso(`<b>Pista:</b> ${reto.pista || 'Compara el comando con lo que se quería hacer: sobra o falta algo.'}`, 'pista');
  }

  function verSolucion() {
    const reto = (nivel.retos || [])[estado.indice];
    if (!reto) return;
    estado.solucionVista = true;
    estado.hud.aviso(`<b>Solución:</b> <code>${reto.correcto}</code><br>${reto.porque} ${reto.explica || ''}`, 'info');
  }

  function ganar() {
    const tiempo = Math.round((Date.now() - estado.inicio) / 1000);
    const xp = completarNivel(progreso, juego.slug, nivel, {
      puntos: estado.puntos, tiempo, pistas: estado.pistas, solucion: estado.solucionVista,
    });
    const i = niveles.indexOf(nivel);
    const siguiente = niveles[i + 1];
    pantallaVictoria(contenedor, {
      titulo: 'Comandos corregidos',
      texto: nivel.explica || 'Has encontrado el fallo y has escrito una versión que funciona.',
      puntos: estado.puntos, xp,
      siguienteNombre: siguiente?.nombre,
      alRepetir: jugar,
      alSiguiente: siguiente ? () => { nivel = siguiente; jugar(); } : null,
    });
    if (alTerminar) alTerminar({ juego: juego.slug, nivel: nivel.id, puntos: estado.puntos, xp });
  }

  pantallaInicio();

  return { destruir() { estado = null; contenedor.innerHTML = ''; } };
}
