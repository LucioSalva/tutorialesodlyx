/**
 * Academia de Comandos · Juego 10 · «Linux vs Windows»
 * ---------------------------------------------------------------------
 * La misma tarea, tres sistemas. Cada ronda pide resolverla en el shell
 * que toque y explica en qué se PARECEN y en qué NO: aquí no se enseña
 * que `dir` «es» `ls`, sino qué hace cada uno y dónde dejan de coincidir.
 */

import { crearHud, pantallaVictoria, completarNivel } from '../juego-base.js';

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

export const NOMBRE_SISTEMA = { linux: 'Linux (Bash)', cmd: 'Windows CMD', powershell: 'PowerShell' };

/** Compara un comando escrito a mano con el esperado, sin ser quisquilloso. */
export function comandoEquivale(escrito, ronda) {
  const limpia = (t) => String(t ?? '').trim().toLowerCase()
    .replace(/["']/g, '').replace(/\s+/g, ' ');
  const dado = limpia(escrito);
  if (!dado) return false;
  const validos = [ronda.correcta, ...(ronda.acepta || [])].map(limpia);
  return validos.includes(dado);
}

/** Prepara las rondas: baraja opciones para que no se memorice la posición. */
export function prepararRondas(rondas, rnd = Math.random) {
  return rondas.map(r => ({
    ...r,
    opcionesBarajadas: r.opciones ? barajar(r.opciones, rnd) : null,
  }));
}

export function puntuarRonda({ acertadaAlPrimer, pistas = 0 }) {
  return Math.max(5, (acertadaAlPrimer ? 25 : 12) - pistas * 5);
}

/* --------------------------------------------------------------- el juego */
export async function iniciar(contenedor, opciones = {}) {
  const { juego, nivelId, progreso, alTerminar } = opciones;
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
        el('p', {}, el('b', { texto: 'Nivel: ' }), `${nivel.nombre} · ${nivel.dificultad}`),
        el('p', {}, el('b', { texto: 'Objetivo: ' }), nivel.objetivo),
      ),
      el('div', { clase: 'ac-juego__selector' },
        el('label', { clase: 'ac-juego__etiqueta', for: 'ac-lvw-nivel', texto: 'Elige nivel' }),
        el('select', { clase: 'ac-select', id: 'ac-lvw-nivel',
          onchange: (ev) => { nivel = niveles[Number(ev.target.value)] || nivel; pantallaInicio(); } },
          ...niveles.map((n, i) => el('option', { value: i, selected: n.id === nivel.id },
            `${n.nombre} · ${n.dificultad}`))),
      ),
      el('button', { clase: 'ac-btn ac-btn--primario', texto: 'Empezar', onclick: jugar }),
    ));
    contenedor.querySelector('.ac-btn--primario').focus();
  }

  function jugar() {
    contenedor.innerHTML = '';
    estado = {
      rondas: prepararRondas(nivel.rondas || []),
      indice: 0, puntos: 0, pistas: 0, solucionVista: false,
      intentosRonda: 0, inicio: Date.now(),
    };

    const hud = crearHud(contenedor, {
      juego, nivel, alReiniciar: jugar, alPista: darPista, alSolucion: verSolucion,
    });
    estado.hud = hud;

    const caja = el('div', { clase: 'ac-lvw' });
    contenedor.append(caja);
    estado.refs = { caja };
    pintarRonda();
  }

  function pintarRonda() {
    const { caja } = estado.refs;
    const ronda = estado.rondas[estado.indice];
    caja.innerHTML = '';
    if (!ronda) return;

    caja.append(
      el('p', { clase: 'ac-lvw__progreso', texto: `Ronda ${estado.indice + 1} de ${estado.rondas.length}` }),
      el('div', { clase: 'ac-lvw__tarea' },
        el('p', { clase: 'ac-lvw__etiqueta', texto: 'Tarea' }),
        el('p', { clase: 'ac-lvw__texto', texto: ronda.tarea })),
      el('div', { clase: 'ac-lvw__sistema ac-lvw__sistema--' + ronda.sistema },
        el('span', { clase: 'ac-lvw__chip', texto: NOMBRE_SISTEMA[ronda.sistema] || ronda.sistema }),
        el('span', { clase: 'ac-lvw__prompt', texto: ronda.sistema === 'linux' ? 'alumno@academia:~$'
          : ronda.sistema === 'cmd' ? 'C:\\Users\\Alumno>' : 'PS C:\\Users\\Alumno>' })),
    );

    if (ronda.opcionesBarajadas) {
      const lista = el('div', { clase: 'ac-lvw__opciones', role: 'group', 'aria-label': 'Elige el comando correcto' });
      for (const op of ronda.opcionesBarajadas) {
        lista.append(el('button', {
          type: 'button', clase: 'ac-lvw__opcion',
          onclick: () => responder(op),
        }, el('code', { texto: op })));
      }
      caja.append(lista);
    } else {
      const form = el('form', { clase: 'ac-lvw__form', onsubmit: (e) => { e.preventDefault(); responder(form.querySelector('input').value); } });
      form.append(
        el('label', { clase: 'ac-juego__etiqueta', for: 'ac-lvw-resp', texto: 'Escribe el comando' }),
        el('input', { clase: 'ac-input', id: 'ac-lvw-resp', type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder: 'comando…' }),
        el('button', { clase: 'ac-btn ac-btn--primario', type: 'submit', texto: 'Responder' }),
      );
      caja.append(form);
      form.querySelector('input').focus();
    }
  }

  function responder(valor) {
    const ronda = estado.rondas[estado.indice];
    estado.intentosRonda++;
    const ok = ronda.opcionesBarajadas
      ? String(valor).trim() === String(ronda.correcta).trim()
      : comandoEquivale(valor, ronda);

    if (!ok) {
      const porque = (ronda.porOpcion && ronda.porOpcion[String(valor).trim()])
        || ronda.pistaFallo
        || `En ${NOMBRE_SISTEMA[ronda.sistema]} ese comando no resuelve la tarea. Fíjate en el sistema que pide la ronda: los nombres no se comparten entre shells.`;
      estado.hud.aviso(porque, 'error');
      return;
    }

    const puntos = puntuarRonda({ acertadaAlPrimer: estado.intentosRonda === 1, pistas: estado.pistas });
    estado.puntos += puntos;
    estado.hud.puntos(estado.puntos);
    estado.hud.aviso(
      `<b>Correcto:</b> <code>${ronda.correcta}</code>. ${ronda.explica || ''}` +
      (ronda.diferencias ? `<br><b>Ojo con las diferencias:</b> ${ronda.diferencias}` : ''), 'ok');

    estado.indice++;
    estado.intentosRonda = 0;
    if (estado.indice >= estado.rondas.length) ganar();
    else pintarRonda();
  }

  function darPista() {
    const ronda = estado.rondas[estado.indice];
    if (!ronda) return;
    estado.pistas++;
    estado.hud.aviso(`<b>Pista:</b> ${ronda.pista || `Piensa en qué herramienta hace eso en ${NOMBRE_SISTEMA[ronda.sistema]}.`}`, 'pista');
  }

  function verSolucion() {
    const ronda = estado.rondas[estado.indice];
    if (!ronda) return;
    estado.solucionVista = true;
    estado.hud.aviso(`<b>Solución:</b> <code>${ronda.correcta}</code>. ${ronda.explica || ''}`, 'info');
  }

  function ganar() {
    const tiempo = Math.round((Date.now() - estado.inicio) / 1000);
    const xp = completarNivel(progreso, juego.slug, nivel, {
      puntos: estado.puntos, tiempo, pistas: estado.pistas, solucion: estado.solucionVista,
    });
    const i = niveles.indexOf(nivel);
    const siguiente = niveles[i + 1];
    pantallaVictoria(contenedor, {
      titulo: 'Rondas superadas',
      texto: nivel.explica || 'Has resuelto la misma tarea en sistemas distintos sin confundir sus comandos.',
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
