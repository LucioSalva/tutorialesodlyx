/**
 * Academia de Comandos · Juego 12 · «Misión final»
 * ---------------------------------------------------------------------
 * El examen práctico: una cadena de tareas que toca todo lo aprendido —
 * moverse, crear, copiar, filtrar texto, permisos y procesos— en un solo
 * escenario y con una terminal de verdad.
 *
 * Cada tarea se valida por el ESTADO del sistema, así que el alumno puede
 * llegar por donde quiera. Hay una versión por sistema: Linux, CMD y
 * PowerShell, porque el examen no debería premiar traducir comandos de
 * memoria sino resolver el problema en el shell que toca.
 */

import { crearHud, pantallaVictoria, completarNivel, prepararEscenario, Terminal, ArbolVisual, evaluar } from '../juego-base.js';

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

/** Marca como hechas las tareas cuyo validador ya se cumple. */
export function revisarTareas(tareas, ctx, evaluarFn = evaluar) {
  return tareas.map(t => ({ ...t, hecha: !!t.exito && evaluarFn(ctx, t.exito) }));
}

export function puntuarMision({ hechas, total, pistas = 0, solucion = false }) {
  if (!total) return 0;
  const base = Math.round((hechas / total) * 120);
  return Math.max(10, base - pistas * 12 - (solucion ? 40 : 0));
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
        el('p', {}, el('b', { texto: 'Examen: ' }), `${nivel.nombre} · ${nivel.dificultad} · ${nivel.os}`),
        el('p', {}, el('b', { texto: 'Objetivo: ' }), nivel.objetivo),
        el('p', { clase: 'ac-juego__nota', texto: `Son ${(nivel.tareas || []).length} tareas encadenadas. Puedes reiniciar el escenario cuando quieras.` }),
      ),
      el('div', { clase: 'ac-juego__selector' },
        el('label', { clase: 'ac-juego__etiqueta', for: 'ac-fin-nivel', texto: 'Elige examen' }),
        el('select', { clase: 'ac-select', id: 'ac-fin-nivel',
          onchange: (ev) => { nivel = niveles[Number(ev.target.value)] || nivel; pantallaInicio(); } },
          ...niveles.map((n, i) => el('option', { value: i, selected: n.id === nivel.id },
            `${n.nombre} · ${n.os}`))),
      ),
      el('button', { clase: 'ac-btn ac-btn--primario', texto: 'Empezar el examen', onclick: jugar }),
    ));
    contenedor.querySelector('.ac-btn--primario').focus();
  }

  async function jugar() {
    contenedor.innerHTML = '';
    estado = { pistas: 0, solucionVista: false, hechas: 0, inicio: Date.now(), tareas: [] };

    const hud = crearHud(contenedor, {
      juego, nivel, conTiempo: true,
      alReiniciar: jugar, alPista: darPista, alSolucion: verSolucion,
    });
    estado.hud = hud;
    estado.reloj = setInterval(() => hud.tiempo((Date.now() - estado.inicio) / 1000), 1000);

    const montado = await prepararEscenario(datos.escenarios || [], nivel.escenario, nivel.os);
    estado.vfs = montado.vfs;
    estado.shell = montado.shell;

    const zona = el('div', { clase: 'ac-fin' });
    const izq = el('div', { clase: 'ac-fin__terminal' });
    const der = el('div', { clase: 'ac-fin__tareas' });
    zona.append(izq, der);
    contenedor.append(
      el('p', { clase: 'ac-fin__intro', html: '<b>Encargo:</b> ' + (nivel.contexto || nivel.objetivo) }),
      zona,
    );

    const cajaTerminal = el('div');
    izq.append(cajaTerminal);
    estado.terminal = new Terminal(cajaTerminal, {
      shell: estado.shell,
      bienvenida: [{ texto: 'Ve tachando tareas. Se marcan solas en cuanto el sistema queda como pide cada una.', clase: 'dim' }],
      alEjecutar: () => revisar(),
    });
    cajaTerminal.addEventListener('reiniciar-escenario', jugar);

    const cajaArbol = el('div');
    izq.append(cajaArbol);
    estado.arbol = new ArbolVisual(cajaArbol, estado.vfs, { desde: nivel.arbolDesde || null, titulo: 'Estado del sistema' });

    estado.refs = { der };
    revisar(true);
    estado.terminal.enfocar();
  }

  function contexto() {
    return { vfs: estado.vfs, shell: estado.shell, salida: [], historial: estado.shell.historial, ultimoComando: '' };
  }

  function pintarTareas() {
    const { der } = estado.refs;
    der.innerHTML = '';
    der.append(el('h4', { clase: 'ac-fin__titulo', texto: `Tareas (${estado.hechas}/${estado.tareas.length})` }));
    const lista = el('ol', { clase: 'ac-fin__lista' });
    estado.tareas.forEach((t, i) => {
      lista.append(el('li', { clase: 'ac-fin__tarea' + (t.hecha ? ' es-hecha' : '') },
        el('span', { clase: 'ac-fin__check', 'aria-hidden': 'true', texto: t.hecha ? '✔' : String(i + 1) }),
        el('span', {},
          el('span', { clase: 'ac-fin__texto', texto: t.texto }),
          t.hecha ? el('span', { clase: 'visually-hidden', texto: ' (completada)' }) : null,
          t.hecha && t.explica ? el('span', { clase: 'ac-fin__explica', texto: t.explica }) : null)));
    });
    der.append(lista);
  }

  function revisar(silencioso = false) {
    const antes = estado.hechas;
    estado.tareas = revisarTareas(nivel.tareas || [], contexto());
    estado.hechas = estado.tareas.filter(t => t.hecha).length;
    pintarTareas();
    if (estado.arbol) estado.arbol.pintar();

    const puntos = puntuarMision({ hechas: estado.hechas, total: estado.tareas.length, pistas: estado.pistas, solucion: estado.solucionVista });
    estado.hud.puntos(puntos);

    if (!silencioso && estado.hechas > antes) {
      const nueva = estado.tareas.find((t, i) => t.hecha && i === estado.hechas - 1);
      estado.hud.aviso(`<b>Tarea completada:</b> ${nueva?.texto || ''}`, 'ok');
    }
    if (estado.hechas === estado.tareas.length && estado.tareas.length) ganar(puntos);
  }

  function darPista() {
    const pendiente = estado.tareas.find(t => !t.hecha);
    if (!pendiente) return;
    estado.pistas++;
    estado.hud.aviso(`<b>Pista:</b> ${pendiente.pista || `Céntrate en: ${pendiente.texto}`}`, 'pista');
  }

  function verSolucion() {
    estado.solucionVista = true;
    const pasos = (nivel.solucion || []).map(c => `<li><code>${c}</code></li>`).join('');
    estado.hud.aviso(`<b>Un camino posible:</b><ol class="ac-lista">${pasos}</ol>` +
      '<p>No es el único: cualquier secuencia que deje el sistema igual cuenta como válida.</p>', 'info');
  }

  function ganar(puntos) {
    clearInterval(estado.reloj);
    const tiempo = Math.round((Date.now() - estado.inicio) / 1000);
    const xp = completarNivel(progreso, juego.slug, nivel, {
      puntos, tiempo, pistas: estado.pistas, solucion: estado.solucionVista,
    });
    const i = niveles.indexOf(nivel);
    const siguiente = niveles[i + 1];
    pantallaVictoria(contenedor, {
      titulo: 'Misión final superada',
      texto: nivel.explica || `Has encadenado ${estado.tareas.length} tareas en ${tiempo} segundos usando lo aprendido en todo el temario.`,
      puntos, xp,
      siguienteNombre: siguiente?.nombre,
      alRepetir: jugar,
      alSiguiente: siguiente ? () => { nivel = siguiente; jugar(); } : null,
    });
    if (alTerminar) alTerminar({ juego: juego.slug, nivel: nivel.id, puntos, xp });
  }

  pantallaInicio();

  return {
    destruir() {
      if (estado?.reloj) clearInterval(estado.reloj);
      estado = null;
      contenedor.innerHTML = '';
    },
  };
}
