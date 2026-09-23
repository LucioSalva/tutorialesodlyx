/**
 * Academia de Comandos · Juego 4 · «Guardián de permisos»
 * ---------------------------------------------------------------------
 * Una tabla con archivos rotos: una llave privada que puede leer todo el
 * mundo, un script sin permiso de ejecución, un directorio en el que no
 * se puede entrar. El jugador los arregla desde la terminal y ve la tabla
 * cambiar fila a fila.
 *
 * La victoria comprueba el ESTADO del sistema de archivos, así que vale
 * tanto `chmod 600` como `chmod u=rw,go=` : cualquier camino correcto.
 * El panel decodificador enseña de dónde salen los números.
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

/** 0o640 → "rw-r-----" (sin el tipo, que lo pone la tabla aparte). */
export function modoATexto(modo) {
  const letras = ['x', 'w', 'r'];
  let salida = '';
  for (let grupo = 2; grupo >= 0; grupo--) {
    for (let bit = 2; bit >= 0; bit--) {
      salida += (modo >> (grupo * 3 + bit)) & 1 ? letras[bit] : '-';
    }
  }
  return salida;
}

/** "rw-" → 6. Se usa en el decodificador interactivo. */
export function tripletaAOctal({ r = false, w = false, x = false }) {
  return (r ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0);
}

/** Explica en palabras qué permite un modo, que es lo que cuesta ver. */
export function explicarModo(modo, esDir = false) {
  const partes = [];
  const quien = ['el propietario', 'el grupo', 'los demás'];
  for (let g = 0; g < 3; g++) {
    const desplaz = (2 - g) * 3;
    const r = (modo >> (desplaz + 2)) & 1;
    const w = (modo >> (desplaz + 1)) & 1;
    const x = (modo >> desplaz) & 1;
    const puede = [];
    if (r) puede.push(esDir ? 'listar' : 'leer');
    if (w) puede.push(esDir ? 'crear y borrar dentro' : 'escribir');
    if (x) puede.push(esDir ? 'entrar' : 'ejecutar');
    partes.push(`${quien[g]}: ${puede.length ? puede.join(', ') : 'nada'}`);
  }
  return partes.join(' · ');
}

/** ¿Está la fila arreglada? Usa los validadores compartidos del motor. */
export function filaResuelta(ctx, objetivo) {
  const comprobaciones = [];
  if (objetivo.modo !== undefined) comprobaciones.push({ tipo: 'permisos', ruta: objetivo.ruta, modo: objetivo.modo });
  if (objetivo.propietario) comprobaciones.push({ tipo: 'propietario', ruta: objetivo.ruta, usuario: objetivo.propietario, grupo: objetivo.grupo });
  if (objetivo.validador) comprobaciones.push(objetivo.validador);
  return comprobaciones.every(v => evaluar(ctx, v));
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
        el('label', { clase: 'ac-juego__etiqueta', for: 'ac-perm-nivel', texto: 'Elige nivel' }),
        el('select', { clase: 'ac-select', id: 'ac-perm-nivel',
          onchange: (ev) => { nivel = niveles[Number(ev.target.value)] || nivel; pantallaInicio(); } },
          ...niveles.map((n, i) => el('option', { value: i, selected: n.id === nivel.id },
            `${n.nombre} · ${n.dificultad} · ${n.os}`))),
      ),
      el('button', { clase: 'ac-btn ac-btn--primario', texto: 'Empezar la guardia', onclick: jugar }),
    ));
    contenedor.querySelector('.ac-btn--primario').focus();
  }

  async function jugar() {
    contenedor.innerHTML = '';
    estado = { pistas: 0, solucionVista: false, intentos: 0, inicio: Date.now(), respuestas: {} };

    const hud = crearHud(contenedor, {
      juego, nivel, alReiniciar: jugar, alPista: darPista, alSolucion: verSolucion,
    });
    estado.hud = hud;

    const montado = await prepararEscenario(datos.escenarios || [], nivel.escenario, nivel.os);
    estado.vfs = montado.vfs;
    estado.shell = montado.shell;
    aplicarPreparacion(estado.vfs, estado.shell, nivel.preparar || {});

    const zona = el('div', { clase: 'ac-perm' });
    const tabla = el('div', { clase: 'ac-perm__tabla', 'aria-live': 'polite' });
    const lateral = el('div', { clase: 'ac-perm__lateral' });
    zona.append(tabla, lateral);

    contenedor.append(
      el('p', { clase: 'ac-perm__intro', html: '<b>Parte de incidencias:</b> ' + (nivel.intro || nivel.objetivo) }),
      zona,
    );

    const cajaTerminal = el('div');
    lateral.append(cajaTerminal);
    estado.terminal = new Terminal(cajaTerminal, {
      shell: estado.shell,
      bienvenida: [{ texto: nivel.os === 'linux'
        ? 'Usa chmod y chown. Con «ls -l» compruebas cómo queda cada archivo.'
        : 'Usa attrib para los atributos de Windows y dir /A para verlos.', clase: 'dim' }],
      alEjecutar: () => revisar(),
    });
    cajaTerminal.addEventListener('reiniciar-escenario', jugar);

    if (nivel.decodificador !== false) lateral.append(panelDecodificador());

    estado.refs = { tabla };
    pintarTabla();
    revisar(true);
    estado.terminal.enfocar();
  }

  /** Copia lo que el nivel necesita romper, sin tocar el escenario base. */
  function aplicarPreparacion(vfs, shell, preparar) {
    for (const f of preparar.archivos || []) {
      const padre = f.ruta.replace(/[\\/][^\\/]*$/, '');
      try { if (padre) vfs.mkdir(padre, { padres: true }); } catch {}
      try {
        if (!vfs.existe(f.ruta)) vfs.escribir(f.ruta, f.contenido ?? '');
        const nodo = vfs.nodo(f.ruta);
        if (nodo) {
          if (f.modo !== undefined) nodo.modo = typeof f.modo === 'string' ? parseInt(f.modo, 8) : f.modo;
          if (f.propietario) nodo.propietario = f.propietario;
          if (f.grupo) nodo.grupo = f.grupo;
        }
      } catch {}
    }
    for (const d of preparar.directorios || []) {
      const ruta = d.ruta ?? d;
      try { vfs.mkdir(ruta, { padres: true }); } catch {}
      const nodo = vfs.nodo(ruta);
      if (nodo && d.modo !== undefined) nodo.modo = typeof d.modo === 'string' ? parseInt(d.modo, 8) : d.modo;
      if (nodo && d.propietario) nodo.propietario = d.propietario;
    }
  }

  function panelDecodificador() {
    const caja = el('div', { clase: 'ac-perm__deco' });
    const estadoBits = { u: { r: true, w: true, x: false }, g: { r: false, w: false, x: false }, o: { r: false, w: false, x: false } };
    const salida = el('p', { clase: 'ac-perm__deco-salida', 'aria-live': 'polite' });

    const actualizar = () => {
      const octal = `${tripletaAOctal(estadoBits.u)}${tripletaAOctal(estadoBits.g)}${tripletaAOctal(estadoBits.o)}`;
      const modo = parseInt(octal, 8);
      salida.innerHTML = `<b>chmod ${octal}</b> → <code>${modoATexto(modo)}</code><br><span class="ac-perm__deco-frase">${explicarModo(modo)}</span>`;
    };

    const grupos = [['u', 'propietario'], ['g', 'grupo'], ['o', 'otros']];
    const rejilla = el('div', { clase: 'ac-perm__deco-rejilla' });
    for (const [clave, nombre] of grupos) {
      const fila = el('div', { clase: 'ac-perm__deco-fila' }, el('span', { clase: 'ac-perm__deco-quien', texto: nombre }));
      for (const bit of ['r', 'w', 'x']) {
        const id = `ac-deco-${clave}${bit}`;
        fila.append(el('label', { clase: 'ac-perm__deco-bit', for: id },
          el('input', {
            type: 'checkbox', id, checked: estadoBits[clave][bit] ? true : false,
            onchange: (ev) => { estadoBits[clave][bit] = ev.target.checked; actualizar(); },
          }),
          el('span', { texto: `${bit} (${bit === 'r' ? 4 : bit === 'w' ? 2 : 1})` })));
      }
      rejilla.append(fila);
    }

    caja.append(
      el('h4', { clase: 'ac-perm__deco-titulo', texto: 'Decodificador: de rwx a número' }),
      el('p', { clase: 'ac-perm__deco-ayuda', texto: 'Marca permisos y mira el número que sale. r vale 4, w vale 2 y x vale 1: se suman por cada grupo.' }),
      rejilla, salida,
    );
    actualizar();
    return caja;
  }

  function pintarTabla() {
    const { tabla } = estado.refs;
    tabla.innerHTML = '';
    tabla.append(el('h4', { clase: 'ac-perm__titulo', texto: 'Archivos bajo tu guardia' }));

    const cabecera = el('div', { clase: 'ac-perm__fila ac-perm__fila--cabecera' },
      el('span', { texto: 'Archivo' }), el('span', { texto: 'Ahora' }),
      el('span', { texto: 'Debe quedar' }), el('span', { texto: 'Estado' }));
    tabla.append(cabecera);

    const ctx = contexto();
    for (const objetivo of nivel.objetivos || []) {
      const nodo = estado.vfs.nodo(objetivo.ruta);
      const ok = filaResuelta(ctx, objetivo);
      const modoActual = nodo ? (nodo.modo & 0o777) : null;
      const fila = el('div', { clase: 'ac-perm__fila' + (ok ? ' es-ok' : '') },
        el('span', { clase: 'ac-perm__ruta' },
          el('code', { texto: objetivo.ruta.split(/[\\/]/).pop() }),
          el('span', { clase: 'ac-perm__dir', texto: objetivo.ruta })),
        el('span', { clase: 'ac-perm__modo' },
          nodo
            ? el('code', { texto: `${modoATexto(modoActual)} (${modoActual.toString(8).padStart(3, '0')})` })
            : el('em', { texto: 'no existe' }),
          nodo ? el('span', { clase: 'ac-perm__duenyo', texto: `${nodo.propietario}:${nodo.grupo}` }) : null),
        el('span', { clase: 'ac-perm__meta' },
          objetivo.modo !== undefined ? el('code', { texto: `${modoATexto(parseInt(String(objetivo.modo), 8))} (${objetivo.modo})` }) : null,
          objetivo.propietario ? el('span', { clase: 'ac-perm__duenyo', texto: `${objetivo.propietario}${objetivo.grupo ? ':' + objetivo.grupo : ''}` }) : null,
          el('span', { clase: 'ac-perm__porque', texto: objetivo.porque || '' })),
        el('span', { clase: 'ac-perm__estado' },
          el('span', { clase: 'ac-perm__marca', 'aria-hidden': 'true', texto: ok ? '✔' : '⌛' }),
          el('span', { texto: ok ? 'Correcto' : 'Pendiente' })),
      );
      tabla.append(fila);
    }

    if (nivel.preguntas?.length) {
      const form = el('form', { clase: 'ac-perm__preguntas', onsubmit: (e) => { e.preventDefault(); responderPreguntas(); } });
      form.append(el('h4', { clase: 'ac-perm__titulo', texto: 'Interpreta lo que ves' }));
      nivel.preguntas.forEach((p, i) => {
        const id = `ac-perm-p${i}`;
        const ok = estado.respuestas[p.id]?.ok;
        form.append(el('div', { clase: 'ac-perm__pregunta' + (ok ? ' es-ok' : '') },
          el('label', { clase: 'ac-det__label', for: id, texto: `${i + 1}. ${p.pregunta}` }),
          el('select', { clase: 'ac-select', id, name: p.id, disabled: ok ? true : false },
            el('option', { value: '', texto: 'Elige una respuesta' }),
            ...(p.opciones || []).map(o => el('option', { value: o, texto: o, selected: estado.respuestas[p.id]?.valor === o }))),
          ok ? el('p', { clase: 'ac-det__ok', html: '✔ ' + (p.explica || '') }) : null));
      });
      form.append(el('button', { clase: 'ac-btn', type: 'submit', texto: 'Comprobar respuestas' }));
      tabla.append(form);
    }
  }

  function contexto() {
    return {
      vfs: estado.vfs, shell: estado.shell,
      salida: [], historial: estado.shell.historial, ultimoComando: '',
    };
  }

  function responderPreguntas() {
    let todas = true;
    for (const p of nivel.preguntas || []) {
      const campo = estado.refs.tabla.querySelector(`[name="${CSS.escape(p.id)}"]`);
      const valor = campo ? campo.value : '';
      const ok = estado.respuestas[p.id]?.ok || (valor && valor === p.respuesta);
      estado.respuestas[p.id] = { valor, ok };
      if (!ok) {
        todas = false;
        estado.hud.aviso(`Todavía no: ${p.orientacion || 'mira otra vez la fila de la tabla y qué significa cada dígito.'}`, 'error');
      }
    }
    pintarTabla();
    if (todas) revisar();
  }

  function revisar(silencioso = false) {
    pintarTabla();
    const ctx = contexto();
    const objetivos = nivel.objetivos || [];
    const resueltos = objetivos.filter(o => filaResuelta(ctx, o)).length;
    const preguntasOk = (nivel.preguntas || []).every(p => estado.respuestas[p.id]?.ok);
    estado.hud.puntos(resueltos * 25);

    if (!silencioso) {
      estado.intentos++;
      const ultimo = estado.shell.historial[estado.shell.historial.length - 1] || '';
      if (/chmod\s+777/.test(ultimo)) {
        estado.hud.aviso('Cuidado: <code>chmod 777</code> da permiso de escritura a todo el mundo. Arregla el acceso concreto que falta, no abras el archivo entero.', 'error');
      }
    }

    if (resueltos === objetivos.length && preguntasOk && objetivos.length) ganar(resueltos);
  }

  function darPista() {
    const pistas = nivel.pistas || [];
    if (estado.pistas >= pistas.length) {
      const ctx = contexto();
      const pendiente = (nivel.objetivos || []).find(o => !filaResuelta(ctx, o));
      estado.hud.aviso(pendiente
        ? `Queda <code>${pendiente.ruta}</code>: ${pendiente.porque || 'revisa qué permiso le sobra o le falta.'}`
        : 'No quedan pistas.', 'pista');
      return;
    }
    estado.hud.aviso(`<b>Pista ${estado.pistas + 1}:</b> ${pistas[estado.pistas]}`, 'pista');
    estado.pistas++;
  }

  function verSolucion() {
    estado.solucionVista = true;
    const lineas = (nivel.solucion || []).map(c => `<code>${c}</code>`).join('<br>');
    estado.hud.aviso(`<b>Solución:</b><br>${lineas}<br>${nivel.explica || ''}`, 'info');
  }

  function ganar(resueltos) {
    const tiempo = Math.round((Date.now() - estado.inicio) / 1000);
    const puntos = Math.max(20, resueltos * 25 - estado.pistas * 15);
    const xp = completarNivel(progreso, juego.slug, nivel, {
      puntos, tiempo, pistas: estado.pistas, solucion: estado.solucionVista,
    });
    const i = niveles.indexOf(nivel);
    const siguiente = niveles[i + 1];
    pantallaVictoria(contenedor, {
      titulo: 'Permisos en orden',
      texto: nivel.explica || 'Cada archivo tiene ahora el permiso mínimo que necesita, ni más ni menos.',
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
