/**
 * Academia de Comandos · Juego 5 · «Constructor de comandos»
 * ---------------------------------------------------------------------
 * Se dan piezas sueltas (el comando, sus opciones, rutas, una tubería…) y
 * hay que ordenarlas hasta formar una orden válida. Cuando la secuencia
 * es correcta, el comando se EJECUTA de verdad en el simulador: el premio
 * no es un «bien», es ver la salida real de lo que acabas de construir.
 *
 * Accesible por diseño: además de arrastrar con el ratón, cada pieza es
 * un <button> que se coloca pulsando Intro, y las piezas ya colocadas se
 * mueven con dos botones de flecha. Sin ratón se juega igual de bien.
 */

import { crearHud, pantallaVictoria, completarNivel, prepararEscenario, PALETA_CSS } from '../juego-base.js';

/* ------------------------------------------------------------------ util */
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

const barajar = (lista, rnd = Math.random) => {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

/* ------------------------------------------------------- lógica probable */

/** Une las piezas como lo haría la terminal: separadas por un espacio. */
export function montarLinea(piezas) {
  return piezas.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * ¿La secuencia construida resuelve el nivel?
 * Se acepta la solución canónica y cualquier alternativa declarada, y se
 * comparan las piezas ya normalizadas para que «-l -a» y «-la» convivan
 * solo cuando el nivel lo permita explícitamente.
 */
export function comprobarSecuencia(piezas, nivel) {
  const construida = montarLinea(piezas);
  const validas = [nivel.solucion, ...(nivel.alternativas || [])].map(s => montarLinea(Array.isArray(s) ? s : [s]));
  return { correcta: validas.includes(construida), linea: construida, validas };
}

/**
 * Cuando la secuencia no es válida, explica POR QUÉ en términos del
 * concepto, no con un «incorrecto». Devuelve null si no hay nada
 * específico que decir y toca dar el mensaje genérico.
 */
export function explicarFallo(piezas, nivel) {
  const solucion = Array.isArray(nivel.solucion) ? nivel.solucion : [nivel.solucion];
  const linea = montarLinea(piezas);

  if (!piezas.length) return 'Todavía no has colocado ninguna pieza. Empieza por el nombre del comando.';

  if (piezas[0] !== solucion[0] && solucion.includes(piezas[0]) === false && nivel.piezas.includes(solucion[0])) {
    return `Toda orden empieza por el <b>nombre del comando</b>. Aquí el primero debe ser <code>${solucion[0]}</code>: lo demás son sus opciones y sus argumentos.`;
  }
  if (piezas[0] !== solucion[0]) {
    return `La primera pieza debería ser <code>${solucion[0]}</code>. El shell lee la línea de izquierda a derecha y lo primero que busca es qué programa ejecutar.`;
  }

  const faltan = solucion.filter(p => !piezas.includes(p));
  if (faltan.length === 1) {
    return `Falta la pieza <code>${faltan[0]}</code>. ${nivel.porFalta?.[faltan[0]] || 'Sin ella el comando no hace lo que pide el objetivo.'}`;
  }
  if (faltan.length > 1) {
    return `Faltan piezas por colocar: <code>${faltan.join('</code>, <code>')}</code>.`;
  }

  const sobran = piezas.filter(p => !solucion.includes(p));
  if (sobran.length) {
    return `Sobra <code>${sobran[0]}</code>. ${nivel.porSobra?.[sobran[0]] || 'Esa pieza no hace falta para este objetivo y cambia lo que hace la orden.'}`;
  }

  if (linea.includes('|') && solucion.join(' ').includes('|')) {
    return 'Las piezas son las correctas, pero el orden alrededor de la tubería importa: a la izquierda va el comando que <b>produce</b> el texto y a la derecha el que lo <b>filtra</b>.';
  }
  return 'Están todas las piezas, pero el orden no es válido: revisa qué va antes y qué después.';
}

/* --------------------------------------------------------------- el juego */
export async function iniciar(contenedor, opciones = {}) {
  const { juego, nivelId, datos = {}, progreso, alTerminar } = opciones;
  const niveles = juego.niveles || [];
  let nivel = niveles.find(n => String(n.id) === String(nivelId)) || niveles[0];

  const escuchas = [];
  const escuchar = (nodo, evento, fn) => { nodo.addEventListener(evento, fn); escuchas.push([nodo, evento, fn]); };

  let estado = null;    // {colocadas, banco, seleccion, pistas, solucionVista, puntos, shell}

  function limpiar() {
    contenedor.innerHTML = '';
  }

  /* ------------------------------------------------------ pantalla inicial */
  function pantallaInicio() {
    limpiar();
    const caja = el('div', { clase: 'ac-juego__inicio' },
      el('h3', { texto: juego.nombre }),
      el('p', { clase: 'ac-juego__resumen', texto: juego.resumen }),
      el('div', { clase: 'ac-juego__ficha' },
        el('p', {}, el('b', { texto: 'Cómo se juega: ' }), juego.mecanica),
        el('p', {}, el('b', { texto: 'Controles: ' }), juego.controles),
        el('p', {}, el('b', { texto: 'Nivel: ' }), `${nivel.nombre} · ${nivel.dificultad} · ${nivel.os}`),
        el('p', {}, el('b', { texto: 'Objetivo: ' }), nivel.objetivo),
      ),
      el('div', { clase: 'ac-juego__selector' },
        el('label', { clase: 'ac-juego__etiqueta', for: 'ac-cons-nivel', texto: 'Elige nivel' }),
        el('select', { clase: 'ac-select', id: 'ac-cons-nivel',
          onchange: (ev) => { nivel = niveles[Number(ev.target.value)] || nivel; pantallaInicio(); } },
          ...niveles.map((n, i) => el('option', { value: i, selected: n.id === nivel.id },
            `${n.nombre} · ${n.dificultad} · ${n.os}`))),
      ),
      el('button', { clase: 'ac-btn ac-btn--primario', texto: 'Empezar', onclick: jugar }),
    );
    contenedor.append(caja);
    caja.querySelector('.ac-btn--primario').focus();
  }

  /* ------------------------------------------------------------- partida */
  async function jugar() {
    limpiar();
    estado = { colocadas: [], seleccion: null, pistas: 0, solucionVista: false, puntos: 0, shell: null, vfs: null };

    const hud = crearHud(contenedor, {
      juego, nivel,
      alReiniciar: () => jugar(),
      alPista: darPista,
      alSolucion: verSolucion,
    });
    estado.hud = hud;

    const tablero = el('div', { clase: 'ac-cons' });
    contenedor.append(tablero);

    tablero.append(
      el('p', { clase: 'ac-cons__objetivo' }, el('b', { texto: 'Objetivo: ' }), nivel.objetivo),
    );

    // Línea en construcción
    const linea = el('div', {
      clase: 'ac-cons__linea', 'data-zona': 'linea',
      role: 'list', 'aria-label': 'Comando en construcción',
    });
    const prompt = el('span', { clase: 'ac-cons__prompt', 'aria-hidden': 'true',
      texto: nivel.os === 'linux' ? 'alumno@academia:~$' : (nivel.os === 'cmd' ? 'C:\\Users\\Alumno>' : 'PS C:\\Users\\Alumno>') });
    tablero.append(el('div', { clase: 'ac-cons__consola' }, prompt, linea));

    // Banco de piezas
    const banco = el('div', { clase: 'ac-cons__banco', role: 'list', 'aria-label': 'Piezas disponibles' });
    tablero.append(
      el('p', { clase: 'ac-cons__ayuda', texto: 'Pulsa una pieza para colocarla (o arrástrala). Las piezas colocadas se mueven con ← →, y se quitan con Supr o pulsándolas.' }),
      banco,
    );

    const acciones = el('div', { clase: 'ac-cons__acciones' },
      el('button', { clase: 'ac-btn ac-btn--primario', texto: 'Comprobar', onclick: comprobar }),
      el('button', { clase: 'ac-btn', texto: 'Vaciar línea', onclick: () => { estado.colocadas = []; pintar(); } }),
    );
    tablero.append(acciones);

    const salida = el('div', { clase: 'ac-cons__salida', 'aria-live': 'polite' });
    tablero.append(salida);
    estado.refs = { linea, banco, salida, tablero };

    // El escenario permite EJECUTAR lo construido cuando acierta.
    if (nivel.escenario && datos.escenarios?.length) {
      try {
        const montado = await prepararEscenario(datos.escenarios, nivel.escenario, nivel.os);
        estado.shell = montado.shell;
        estado.vfs = montado.vfs;
      } catch { /* sin escenario, el nivel sigue siendo jugable */ }
    }

    pintar();
  }

  function pintar() {
    const { linea, banco } = estado.refs;
    linea.innerHTML = '';
    banco.innerHTML = '';

    estado.colocadas.forEach((pieza, i) => {
      const seleccionada = estado.seleccion === i;
      const btn = el('button', {
        type: 'button',
        clase: 'ac-pieza ac-pieza--puesta' + (seleccionada ? ' es-sel' : ''),
        role: 'listitem',
        draggable: 'true',
        'aria-label': `${pieza}, posición ${i + 1} de ${estado.colocadas.length}. Pulsa para quitarla.`,
        'aria-pressed': seleccionada ? 'true' : 'false',
        texto: pieza,
        onclick: () => { estado.colocadas.splice(i, 1); estado.seleccion = null; pintar(); },
        onfocus: () => { estado.seleccion = i; },
        onkeydown: (ev) => moverConTeclado(ev, i),
        ondragstart: (ev) => { ev.dataTransfer.setData('text/plain', 'puesta:' + i); },
      });
      linea.append(btn);
    });

    if (!estado.colocadas.length) {
      linea.append(el('span', { clase: 'ac-cons__vacio', texto: '(línea vacía: coloca la primera pieza)' }));
    }

    const usadas = estado.colocadas.slice();
    for (const pieza of estado.piezasBarajadas || (estado.piezasBarajadas = barajar(nivel.piezas))) {
      const quedan = estado.piezasBarajadas.filter(p => p === pieza).length
                   - usadas.filter(p => p === pieza).length;
      const yaPuestas = banco.querySelectorAll(`[data-pieza="${CSS.escape(pieza)}"]`).length;
      if (yaPuestas >= quedan) continue;
      banco.append(el('button', {
        type: 'button',
        clase: 'ac-pieza',
        role: 'listitem',
        draggable: 'true',
        'data-pieza': pieza,
        'aria-label': `Colocar la pieza ${pieza}`,
        texto: pieza,
        onclick: () => { estado.colocadas.push(pieza); estado.seleccion = null; pintar(); },
        ondragstart: (ev) => { ev.dataTransfer.setData('text/plain', 'banco:' + pieza); },
      }));
    }

    if (!banco.childElementCount) {
      banco.append(el('span', { clase: 'ac-cons__vacio', texto: '(todas las piezas están en la línea)' }));
    }
  }

  function moverConTeclado(ev, i) {
    if (ev.key === 'ArrowLeft' && i > 0) {
      ev.preventDefault();
      [estado.colocadas[i - 1], estado.colocadas[i]] = [estado.colocadas[i], estado.colocadas[i - 1]];
      estado.seleccion = i - 1;
      pintar();
      estado.refs.linea.children[i - 1]?.focus();
    } else if (ev.key === 'ArrowRight' && i < estado.colocadas.length - 1) {
      ev.preventDefault();
      [estado.colocadas[i + 1], estado.colocadas[i]] = [estado.colocadas[i], estado.colocadas[i + 1]];
      estado.seleccion = i + 1;
      pintar();
      estado.refs.linea.children[i + 1]?.focus();
    } else if (ev.key === 'Delete' || ev.key === 'Backspace') {
      ev.preventDefault();
      estado.colocadas.splice(i, 1);
      pintar();
    }
  }

  function comprobar() {
    const veredicto = comprobarSecuencia(estado.colocadas, nivel);
    const { salida } = estado.refs;
    salida.innerHTML = '';

    if (!veredicto.correcta) {
      estado.puntos = Math.max(0, estado.puntos - 5);
      estado.hud.puntos(estado.puntos);
      estado.hud.aviso(explicarFallo(estado.colocadas, nivel) || 'Revisa el orden de las piezas.', 'error');
      return;
    }

    estado.hud.aviso('Secuencia correcta. Así se lee la orden que acabas de montar:', 'ok');
    salida.append(el('p', { clase: 'ac-cons__explica', html: nivel.explica || '' }));

    // Se ejecuta de verdad: la prueba de que el comando es válido.
    if (estado.shell) {
      const resultado = estado.shell.ejecutar(veredicto.linea);
      const pre = el('pre', { clase: 'ac-cons__consola-salida' });
      pre.append(el('span', { clase: 'ac-cons__eco', texto: estado.shell.prompt + ' ' + veredicto.linea + '\n' }));
      for (const l of resultado.lineas.slice(0, 14)) {
        pre.append(el('span', { clase: 'ac-cons__l ac-cons__l--' + l.clase, texto: (l.texto || '') + '\n' }));
      }
      salida.append(el('p', { clase: 'ac-cons__pie', texto: 'Ejecutado en el simulador:' }), pre);
    }

    const puntos = Math.max(20, 100 - estado.pistas * 20 - (estado.solucionVista ? 50 : 0));
    estado.puntos = puntos;
    estado.hud.puntos(puntos);
    ganar(puntos);
  }

  function darPista() {
    const pistas = nivel.pistas || [];
    if (estado.pistas >= pistas.length) {
      estado.hud.aviso('No quedan más pistas. Queda «Ver solución», que explica la respuesta entera.', 'info');
      return;
    }
    estado.hud.aviso(`<b>Pista ${estado.pistas + 1}:</b> ${pistas[estado.pistas]}`, 'pista');
    estado.pistas++;
  }

  function verSolucion() {
    estado.solucionVista = true;
    const solucion = Array.isArray(nivel.solucion) ? nivel.solucion : [nivel.solucion];
    estado.hud.aviso(`<b>Solución:</b> <code>${montarLinea(solucion)}</code><br>${nivel.explica || ''}`, 'info');
    estado.colocadas = solucion.slice();
    pintar();
  }

  function ganar(puntos) {
    const xp = completarNivel(progreso, juego.slug, nivel, {
      puntos, pistas: estado.pistas, solucion: estado.solucionVista,
    });
    const i = niveles.indexOf(nivel);
    const siguiente = niveles[i + 1];
    pantallaVictoria(contenedor, {
      titulo: 'Comando construido',
      texto: nivel.explica || 'Has montado una orden válida y la has visto funcionar.',
      puntos, xp,
      siguienteNombre: siguiente?.nombre,
      alRepetir: () => jugar(),
      alSiguiente: siguiente ? () => { nivel = siguiente; jugar(); } : null,
    });
    if (alTerminar) alTerminar({ juego: juego.slug, nivel: nivel.id, puntos, xp });
  }

  /* ------------------------------------------------ arrastrar con el ratón */
  escuchar(contenedor, 'dragover', (ev) => {
    if (ev.target.closest('[data-zona="linea"]') || ev.target.closest('.ac-cons__banco')) ev.preventDefault();
  });
  escuchar(contenedor, 'drop', (ev) => {
    const carga = ev.dataTransfer?.getData('text/plain') || '';
    if (!carga || !estado) return;
    ev.preventDefault();
    const enLinea = !!ev.target.closest('[data-zona="linea"]');
    if (carga.startsWith('banco:') && enLinea) {
      estado.colocadas.push(carga.slice(6));
      pintar();
    } else if (carga.startsWith('puesta:') && !enLinea) {
      estado.colocadas.splice(Number(carga.slice(7)), 1);
      pintar();
    }
  });

  pantallaInicio();

  return {
    destruir() {
      for (const [nodo, evento, fn] of escuchas) nodo.removeEventListener(evento, fn);
      escuchas.length = 0;
      estado = null;
      contenedor.innerHTML = '';
    },
  };
}
