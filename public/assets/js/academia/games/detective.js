/**
 * Academia de Comandos · Juego 3 · «Detective de la terminal»
 * ---------------------------------------------------------------------
 * Una terminal de verdad y una libreta. El escenario esconde respuestas
 * en sitios donde se esconden de verdad: archivos ocultos, registros,
 * permisos raros, procesos que no deberían estar ahí. El jugador
 * investiga con los comandos que ya conoce y anota lo que encuentra.
 *
 * Las evidencias se marcan solas cuando el jugador ejecuta el comando que
 * las descubre (se comprueba el ESTADO y la salida, no el texto tecleado),
 * así que valen todos los caminos: `cat`, `less`, `grep`…
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

/** Compara respuestas escritas sin castigar acentos, mayúsculas ni espacios. */
export function normalizar(texto) {
  return String(texto ?? '')
    .trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

/** ¿La respuesta del jugador vale para esta pregunta? */
export function respuestaValida(respuesta, pregunta) {
  const dada = normalizar(respuesta);
  if (!dada) return false;
  const validas = [pregunta.respuesta, ...(pregunta.acepta || [])].filter(Boolean).map(normalizar);
  return validas.some(v => v === dada || (v.length > 3 && dada.includes(v)));
}

/** Coloca en el escenario lo que este nivel necesita esconder. */
export function aplicarPreparacion(vfs, shell, preparar = {}) {
  for (const f of preparar.archivos || []) {
    const padre = f.ruta.replace(/[\\/][^\\/]*$/, '');
    try { if (padre) vfs.mkdir(padre, { padres: true }); } catch {}
    try {
      vfs.escribir(f.ruta, f.contenido ?? '');
      const nodo = vfs.nodo(f.ruta);
      if (nodo) {
        if (f.modo !== undefined) nodo.modo = typeof f.modo === 'string' ? parseInt(f.modo, 8) : f.modo;
        if (f.propietario) nodo.propietario = f.propietario;
        if (f.grupo) nodo.grupo = f.grupo;
        if (f.mtime) nodo.mtime = f.mtime;
      }
    } catch {}
  }
  for (const d of preparar.directorios || []) {
    try { vfs.mkdir(d.ruta ?? d, { padres: true }); } catch {}
  }
  if (preparar.procesos) shell.procesos = (shell.procesos || []).concat(JSON.parse(JSON.stringify(preparar.procesos)));
  if (preparar.servicios) shell.servicios = Object.assign(shell.servicios || {}, JSON.parse(JSON.stringify(preparar.servicios)));
  if (preparar.puertos) shell.puertos = (shell.puertos || []).concat(JSON.parse(JSON.stringify(preparar.puertos)));
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
        el('p', {}, el('b', { texto: 'Caso: ' }), nivel.nombre),
        el('p', {}, el('b', { texto: 'Objetivo: ' }), nivel.objetivo),
      ),
      el('div', { clase: 'ac-juego__selector' },
        el('label', { clase: 'ac-juego__etiqueta', for: 'ac-det-nivel', texto: 'Elige caso' }),
        el('select', { clase: 'ac-select', id: 'ac-det-nivel',
          onchange: (ev) => { nivel = niveles[Number(ev.target.value)] || nivel; pantallaInicio(); } },
          ...niveles.map((n, i) => el('option', { value: i, selected: n.id === nivel.id },
            `${n.nombre} · ${n.dificultad} · ${n.os}`))),
      ),
      el('button', { clase: 'ac-btn ac-btn--primario', texto: 'Abrir el caso', onclick: jugar }),
    ));
    contenedor.querySelector('.ac-btn--primario').focus();
  }

  async function jugar() {
    contenedor.innerHTML = '';
    estado = {
      evidencias: new Set(), respuestas: {}, pistas: 0, solucionVista: false,
      fallos: 0, inicio: Date.now(),
    };

    const hud = crearHud(contenedor, {
      juego, nivel,
      alReiniciar: jugar,
      alPista: darPista,
      alSolucion: verSolucion,
    });
    estado.hud = hud;

    const montado = await prepararEscenario(datos.escenarios || [], nivel.escenario, nivel.os);
    estado.vfs = montado.vfs;
    estado.shell = montado.shell;
    aplicarPreparacion(estado.vfs, estado.shell, nivel.preparar || {});

    const zona = el('div', { clase: 'ac-det' });
    const izquierda = el('div', { clase: 'ac-det__terminal' });
    const derecha = el('div', { clase: 'ac-det__libreta' });
    zona.append(izquierda, derecha);
    contenedor.append(
      el('div', { clase: 'ac-det__intro' },
        el('p', { html: '<b>Informe del caso:</b> ' + (nivel.intro || nivel.objetivo) })),
      zona,
    );

    const cajaTerminal = el('div');
    izquierda.append(cajaTerminal);
    estado.terminal = new Terminal(cajaTerminal, {
      shell: estado.shell,
      bienvenida: [{ texto: 'Escribe «help» para ver los comandos disponibles. Investiga a tu ritmo.', clase: 'dim' }],
      alEjecutar: (linea, resultado) => revisarEvidencias(linea, resultado),
    });
    cajaTerminal.addEventListener('reiniciar-escenario', jugar);

    const cajaArbol = el('div');
    izquierda.append(cajaArbol);
    estado.arbol = new ArbolVisual(cajaArbol, estado.vfs, {
      desde: nivel.arbolDesde || null,
      titulo: 'Lo que ves del sistema',
    });

    pintarLibreta(derecha);
    estado.terminal.enfocar();
  }

  function pintarLibreta(caja) {
    caja.innerHTML = '';
    const evidencias = nivel.evidencias || [];
    const preguntas = nivel.preguntas || [];

    caja.append(el('h4', { clase: 'ac-det__titulo', texto: 'Libreta del caso' }));

    if (evidencias.length) {
      caja.append(el('p', { clase: 'ac-det__sub', texto: 'Evidencias (se marcan solas al encontrarlas)' }));
      const lista = el('ul', { clase: 'ac-det__evidencias' });
      for (const ev of evidencias) {
        const hecha = estado.evidencias.has(ev.id);
        lista.append(el('li', { clase: 'ac-det__evidencia' + (hecha ? ' es-hecha' : '') },
          el('span', { clase: 'ac-det__check', 'aria-hidden': 'true', texto: hecha ? '✔' : '○' }),
          el('span', { texto: hecha ? ev.texto : (ev.oculta || 'Pista sin descubrir') }),
          hecha ? el('span', { clase: 'visually-hidden', texto: ' (encontrada)' }) : null,
        ));
      }
      caja.append(lista);
    }

    caja.append(el('p', { clase: 'ac-det__sub', texto: 'Conclusiones' }));
    const form = el('form', { clase: 'ac-det__preguntas', onsubmit: (e) => { e.preventDefault(); responder(); } });
    preguntas.forEach((p, i) => {
      const resuelta = estado.respuestas[p.id]?.ok;
      const bloque = el('div', { clase: 'ac-det__pregunta' + (resuelta ? ' es-ok' : '') });
      const idCampo = `ac-det-p${i}`;
      bloque.append(el('label', { clase: 'ac-det__label', for: idCampo, texto: `${i + 1}. ${p.pregunta}` }));

      if (p.tipo === 'opciones') {
        const sel = el('select', { clase: 'ac-select', id: idCampo, name: p.id, disabled: resuelta ? true : false },
          el('option', { value: '', texto: 'Elige una respuesta' }),
          ...(p.opciones || []).map(o => el('option', { value: o, texto: o, selected: estado.respuestas[p.id]?.valor === o })));
        bloque.append(sel);
      } else {
        bloque.append(el('input', {
          clase: 'ac-input', id: idCampo, name: p.id, type: 'text',
          autocomplete: 'off', placeholder: p.ejemplo || 'Escribe tu respuesta',
          value: estado.respuestas[p.id]?.valor || '',
          disabled: resuelta ? true : false,
        }));
      }
      if (resuelta) bloque.append(el('p', { clase: 'ac-det__ok', html: '✔ ' + (p.explica || 'Correcto.') }));
      form.append(bloque);
    });

    form.append(el('button', { clase: 'ac-btn ac-btn--primario', type: 'submit', texto: 'Entregar conclusiones' }));
    caja.append(form);
    estado.refs = { libreta: caja };
  }

  function revisarEvidencias(linea, resultado) {
    if (!resultado) return;
    const ctx = {
      vfs: estado.vfs, shell: estado.shell,
      salida: resultado.lineas || [],
      historial: estado.shell.historial,
      ultimoComando: linea,
    };
    let nuevas = 0;
    for (const ev of nivel.evidencias || []) {
      if (estado.evidencias.has(ev.id)) continue;
      if (ev.validador && evaluar(ctx, ev.validador)) {
        estado.evidencias.add(ev.id);
        nuevas++;
        estado.hud.aviso(`<b>Evidencia anotada:</b> ${ev.texto}`, 'ok');
      }
    }
    estado.arbol.pintar();
    if (nuevas) {
      const caja = estado.refs.libreta;
      pintarLibreta(caja);
      estado.hud.puntos(estado.evidencias.size * 15);
    }
  }

  function responder() {
    const preguntas = nivel.preguntas || [];
    let correctas = 0;
    for (const p of preguntas) {
      const campo = estado.refs.libreta.querySelector(`[name="${CSS.escape(p.id)}"]`);
      const valor = campo ? campo.value : '';
      const ok = estado.respuestas[p.id]?.ok || respuestaValida(valor, p);
      estado.respuestas[p.id] = { valor, ok };
      if (ok) correctas++;
    }

    pintarLibreta(estado.refs.libreta);

    if (correctas === preguntas.length) {
      ganar();
      return;
    }
    estado.fallos++;
    const fallada = preguntas.find(p => !estado.respuestas[p.id]?.ok);
    estado.hud.aviso(
      `Aún no cuadra la pregunta «${fallada.pregunta}». ${fallada.orientacion || 'Vuelve a la terminal: la respuesta está en el escenario, no hay que adivinarla.'}`,
      'error');
  }

  function darPista() {
    const pistas = nivel.pistas || [];
    if (estado.pistas >= pistas.length) {
      estado.hud.aviso('No quedan pistas. «Ver solución» explica el caso entero.', 'info');
      return;
    }
    estado.hud.aviso(`<b>Pista ${estado.pistas + 1}:</b> ${pistas[estado.pistas]}`, 'pista');
    estado.pistas++;
  }

  function verSolucion() {
    estado.solucionVista = true;
    const filas = (nivel.preguntas || []).map(p => `<li>${p.pregunta} → <b>${p.respuesta}</b>. ${p.explica || ''}</li>`).join('');
    estado.hud.aviso(`<b>Resolución del caso:</b><ul class="ac-lista">${filas}</ul>` +
      (nivel.comandosClave ? `<p>Comandos que lo resuelven: <code>${nivel.comandosClave.join('</code> · <code>')}</code></p>` : ''), 'info');
  }

  function ganar() {
    const tiempo = Math.round((Date.now() - estado.inicio) / 1000);
    const puntos = Math.max(20, estado.evidencias.size * 15 + 60 - estado.fallos * 10 - estado.pistas * 15);
    const xp = completarNivel(progreso, juego.slug, nivel, {
      puntos, tiempo, pistas: estado.pistas, solucion: estado.solucionVista,
    });
    const i = niveles.indexOf(nivel);
    const siguiente = niveles[i + 1];
    pantallaVictoria(contenedor, {
      titulo: 'Caso resuelto',
      texto: nivel.explica || 'Has llegado a la conclusión a partir de lo que había en el sistema.',
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
      estado = null;
      contenedor.innerHTML = '';
    },
  };
}
