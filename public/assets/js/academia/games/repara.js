/**
 * Academia de Comandos · Juego 7 · «Repara el servidor»
 * ---------------------------------------------------------------------
 * Algo no funciona y solo hay un síntoma. El jugador investiga con las
 * herramientas reales (registros, procesos, puertos, servicios), dice
 * cuál cree que es la causa y lo arregla.
 *
 * La victoria NO comprueba que haya tecleado un comando concreto: exige
 * que el sistema quede arreglado de verdad (el servicio activo, el puerto
 * libre, el archivo en su sitio). Cualquier camino correcto vale.
 */

import { crearHud, pantallaVictoria, completarNivel, prepararEscenario, Terminal, evaluar } from '../juego-base.js';

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

/** Aplica la avería del nivel sobre el escenario base. */
export function aplicarAveria(vfs, shell, averia = {}) {
  for (const f of averia.archivos || []) {
    const padre = f.ruta.replace(/[\\/][^\\/]*$/, '');
    try { if (padre) vfs.mkdir(padre, { padres: true }); } catch {}
    try { vfs.escribir(f.ruta, f.contenido ?? ''); } catch {}
    const nodo = vfs.nodo(f.ruta);
    if (nodo && f.modo !== undefined) nodo.modo = typeof f.modo === 'string' ? parseInt(f.modo, 8) : f.modo;
    if (nodo && f.propietario) nodo.propietario = f.propietario;
  }
  for (const r of averia.borrar || []) {
    try { vfs.borrar(r, { recursivo: true }); } catch {}
  }
  if (averia.procesos) shell.procesos = (shell.procesos || []).concat(JSON.parse(JSON.stringify(averia.procesos)));
  if (averia.puertos) shell.puertos = (shell.puertos || []).concat(JSON.parse(JSON.stringify(averia.puertos)));
  for (const [nombre, cambios] of Object.entries(averia.servicios || {})) {
    shell.servicios = shell.servicios || {};
    shell.servicios[nombre] = Object.assign(shell.servicios[nombre] || {}, JSON.parse(JSON.stringify(cambios)));
  }
  if (averia.registros) shell.registros = (shell.registros || []).concat(averia.registros);
}

/** Puntuación: premia diagnosticar bien antes de tocar nada. */
export function puntuarReparacion({ evidencias = 0, diagnosticoOk = false, intentosDiagnostico = 1, pistas = 0 }) {
  const base = 40 + evidencias * 12 + (diagnosticoOk ? 30 : 0);
  return Math.max(15, Math.round(base - (intentosDiagnostico - 1) * 12 - pistas * 15));
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
        el('p', {}, el('b', { texto: 'Aviso recibido: ' }), nivel.sintoma || nivel.objetivo),
      ),
      el('div', { clase: 'ac-juego__selector' },
        el('label', { clase: 'ac-juego__etiqueta', for: 'ac-rep-nivel', texto: 'Elige incidencia' }),
        el('select', { clase: 'ac-select', id: 'ac-rep-nivel',
          onchange: (ev) => { nivel = niveles[Number(ev.target.value)] || nivel; pantallaInicio(); } },
          ...niveles.map((n, i) => el('option', { value: i, selected: n.id === nivel.id },
            `${n.nombre} · ${n.dificultad} · ${n.os}`))),
      ),
      el('button', { clase: 'ac-btn ac-btn--primario', texto: 'Entrar de guardia', onclick: jugar }),
    ));
    contenedor.querySelector('.ac-btn--primario').focus();
  }

  async function jugar() {
    contenedor.innerHTML = '';
    estado = {
      evidencias: new Set(), diagnosticoOk: false, intentosDiagnostico: 0,
      pistas: 0, solucionVista: false, reparado: false, inicio: Date.now(),
    };

    const hud = crearHud(contenedor, {
      juego, nivel, alReiniciar: jugar, alPista: darPista, alSolucion: verSolucion,
    });
    estado.hud = hud;

    const montado = await prepararEscenario(datos.escenarios || [], nivel.escenario, nivel.os);
    estado.vfs = montado.vfs;
    estado.shell = montado.shell;
    aplicarAveria(estado.vfs, estado.shell, nivel.averia || {});

    const zona = el('div', { clase: 'ac-rep' });
    const izquierda = el('div', { clase: 'ac-rep__terminal' });
    const derecha = el('div', { clase: 'ac-rep__parte' });
    zona.append(izquierda, derecha);

    contenedor.append(
      el('div', { clase: 'ac-rep__aviso' },
        el('p', { html: '<b>Aviso:</b> ' + (nivel.sintoma || nivel.objetivo) }),
        nivel.contexto ? el('p', { clase: 'ac-rep__contexto', texto: nivel.contexto }) : null),
      zona,
    );

    const cajaTerminal = el('div');
    izquierda.append(cajaTerminal);
    estado.terminal = new Terminal(cajaTerminal, {
      shell: estado.shell,
      bienvenida: [{ texto: nivel.ayudaInicial || 'Investiga antes de tocar nada: registros, procesos, puertos y estado de los servicios.', clase: 'dim' }],
      alEjecutar: (linea, resultado) => trasComando(linea, resultado),
    });
    cajaTerminal.addEventListener('reiniciar-escenario', jugar);

    estado.refs = { parte: derecha };
    pintarParte();
    estado.terminal.enfocar();
  }

  function pintarParte() {
    const caja = estado.refs.parte;
    caja.innerHTML = '';
    caja.append(el('h4', { clase: 'ac-rep__titulo', texto: 'Parte de incidencia' }));

    // Evidencias recogidas
    const evidencias = nivel.evidencias || [];
    if (evidencias.length) {
      const lista = el('ul', { clase: 'ac-rep__evidencias' });
      for (const ev of evidencias) {
        const hecha = estado.evidencias.has(ev.id);
        lista.append(el('li', { clase: 'ac-rep__evidencia' + (hecha ? ' es-hecha' : '') },
          el('span', { clase: 'ac-rep__check', 'aria-hidden': 'true', texto: hecha ? '✔' : '○' }),
          el('span', { texto: hecha ? ev.texto : (ev.oculta || 'Dato por comprobar') })));
      }
      caja.append(el('p', { clase: 'ac-rep__sub', texto: `Datos comprobados (${estado.evidencias.size}/${evidencias.length})` }), lista);
    }

    // Diagnóstico
    const d = nivel.diagnostico;
    if (d && !estado.diagnosticoOk) {
      const form = el('form', { clase: 'ac-rep__diagnostico', onsubmit: (e) => { e.preventDefault(); responderDiagnostico(); } });
      form.append(el('p', { clase: 'ac-rep__sub', texto: 'Tu diagnóstico' }),
        el('p', { clase: 'ac-rep__pregunta', texto: d.pregunta }));
      (d.opciones || []).forEach((o, i) => {
        const id = `ac-rep-d${i}`;
        form.append(el('label', { clase: 'ac-rep__opcion', for: id },
          el('input', { type: 'radio', name: 'diagnostico', id, value: String(i) }),
          el('span', { texto: o.texto })));
      });
      form.append(el('button', { clase: 'ac-btn', type: 'submit', texto: 'Enviar diagnóstico' }));
      caja.append(form);
    } else if (d) {
      caja.append(el('p', { clase: 'ac-rep__sub', texto: 'Tu diagnóstico' }),
        el('p', { clase: 'ac-det__ok', html: '✔ ' + (d.opciones.find(o => o.correcta)?.porque || 'Diagnóstico correcto.') }));
    }

    // Estado de la reparación
    caja.append(
      el('p', { clase: 'ac-rep__sub', texto: 'Estado del servicio' }),
      el('p', { clase: 'ac-rep__estado' + (estado.reparado ? ' es-ok' : ''),
        texto: estado.reparado ? 'Arreglado: el sistema responde como debe.' : (nivel.estadoPendiente || 'Sigue sin funcionar.') }),
    );
  }

  function trasComando(linea, resultado) {
    const ctx = {
      vfs: estado.vfs, shell: estado.shell,
      salida: resultado?.lineas || [],
      historial: estado.shell.historial,
      ultimoComando: linea,
    };

    for (const ev of nivel.evidencias || []) {
      if (estado.evidencias.has(ev.id)) continue;
      if (ev.validador && evaluar(ctx, ev.validador)) {
        estado.evidencias.add(ev.id);
        estado.hud.aviso(`<b>Anotado:</b> ${ev.texto}`, 'ok');
      }
    }

    const reparado = nivel.exito ? evaluar(ctx, nivel.exito) : false;
    if (reparado && !estado.reparado) {
      estado.reparado = true;
      estado.hud.aviso('El sistema vuelve a responder. Comprueba el parte antes de cerrar la incidencia.', 'ok');
    } else if (!reparado && estado.reparado) {
      estado.reparado = false;
    }

    // Avisos que enseñan cuando se dispara sin diagnosticar.
    if (!estado.diagnosticoOk && /(^|\s)(rm|del|remove-item)\s/i.test(linea)) {
      estado.hud.aviso('Antes de borrar nada, asegúrate de la causa: en una guardia real, borrar es la acción menos reversible.', 'error');
    }

    pintarParte();
    estado.hud.puntos(puntuarReparacion({
      evidencias: estado.evidencias.size,
      diagnosticoOk: estado.diagnosticoOk,
      intentosDiagnostico: Math.max(1, estado.intentosDiagnostico),
      pistas: estado.pistas,
    }));

    if (estado.reparado && (!nivel.diagnostico || estado.diagnosticoOk)) ganar();
  }

  function responderDiagnostico() {
    const d = nivel.diagnostico;
    const marcada = estado.refs.parte.querySelector('input[name="diagnostico"]:checked');
    if (!marcada) {
      estado.hud.aviso('Elige una de las causas antes de enviar el diagnóstico.', 'info');
      return;
    }
    estado.intentosDiagnostico++;
    const opcion = d.opciones[Number(marcada.value)];
    if (opcion?.correcta) {
      estado.diagnosticoOk = true;
      estado.hud.aviso(`<b>Diagnóstico correcto:</b> ${opcion.porque}`, 'ok');
      pintarParte();
      if (estado.reparado) ganar();
    } else {
      estado.hud.aviso(`Esa no es la causa. ${opcion?.porque || 'Vuelve a los registros y a los puertos: la pista está ahí.'}`, 'error');
    }
  }

  function darPista() {
    const pistas = nivel.pistas || [];
    if (estado.pistas >= pistas.length) {
      estado.hud.aviso('No quedan pistas. «Ver solución» enseña los comandos que cierran la incidencia.', 'info');
      return;
    }
    estado.hud.aviso(`<b>Pista ${estado.pistas + 1}:</b> ${pistas[estado.pistas]}`, 'pista');
    estado.pistas++;
  }

  function verSolucion() {
    estado.solucionVista = true;
    const pasos = (nivel.solucion || []).map(c => `<li><code>${c}</code></li>`).join('');
    estado.hud.aviso(`<b>Cómo se cierra esta incidencia:</b><ol class="ac-lista">${pasos}</ol>${nivel.explica || ''}`, 'info');
  }

  function ganar() {
    const tiempo = Math.round((Date.now() - estado.inicio) / 1000);
    const puntos = puntuarReparacion({
      evidencias: estado.evidencias.size,
      diagnosticoOk: estado.diagnosticoOk,
      intentosDiagnostico: Math.max(1, estado.intentosDiagnostico),
      pistas: estado.pistas,
    });
    const xp = completarNivel(progreso, juego.slug, nivel, {
      puntos, tiempo, pistas: estado.pistas, solucion: estado.solucionVista,
    });
    const i = niveles.indexOf(nivel);
    const siguiente = niveles[i + 1];
    pantallaVictoria(contenedor, {
      titulo: 'Incidencia cerrada',
      texto: nivel.explica || 'Diagnosticaste la causa con evidencias y la arreglaste.',
      puntos, xp,
      siguienteNombre: siguiente?.nombre,
      alRepetir: jugar,
      alSiguiente: siguiente ? () => { nivel = siguiente; jugar(); } : null,
    });
    if (alTerminar) alTerminar({ juego: juego.slug, nivel: nivel.id, puntos, xp });
  }

  pantallaInicio();

  return {
    destruir() { estado = null; contenedor.innerHTML = ''; },
  };
}
