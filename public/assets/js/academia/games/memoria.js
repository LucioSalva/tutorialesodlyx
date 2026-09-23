/**
 * Academia de Comandos · Juego 8 · «Memoria de comandos»
 * ---------------------------------------------------------------------
 * Parejas clásicas, pero las cartas no son dibujos: son comandos reales y
 * lo que hacen. En los niveles altos la pareja no es comando ↔ función,
 * sino comando ↔ sintaxis o comando ↔ salida, que es justo lo que cuesta
 * recordar cuando uno lleva pocas semanas en la terminal.
 *
 * Tablero accesible: cada carta es un <button> con texto (nunca solo
 * color), navegable con el tabulador, y el resultado de cada intento se
 * anuncia por una región aria-live.
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

/**
 * Convierte las parejas del nivel en cartas barajadas.
 * Cada pareja da dos cartas con el mismo `pareja`: una con el comando y
 * otra con lo que se empareja (función, sintaxis o salida).
 */
export function generarTablero(parejas, rnd = Math.random) {
  const cartas = [];
  parejas.forEach((p, i) => {
    cartas.push({ id: `c${i}`, pareja: i, cara: 'comando', texto: p.comando, ayuda: p.comando });
    cartas.push({ id: `p${i}`, pareja: i, cara: 'par', texto: p.par, ayuda: p.par });
  });
  return barajar(cartas, rnd);
}

/** Dos cartas hacen pareja si comparten índice y no son la misma carta. */
export function esPareja(a, b) {
  return !!a && !!b && a.id !== b.id && a.pareja === b.pareja;
}

/** Puntuación: parte de 100 y baja con los fallos; nunca por debajo de 10. */
export function puntuar({ aciertos, fallos, pistas = 0 }) {
  return Math.max(10, Math.round(aciertos * 20 - fallos * 6 - pistas * 15));
}

/* --------------------------------------------------------------- el juego */
export async function iniciar(contenedor, opciones = {}) {
  const { juego, nivelId, progreso, alTerminar } = opciones;
  const niveles = juego.niveles || [];
  let nivel = niveles.find(n => String(n.id) === String(nivelId)) || niveles[0];

  let estado = null;
  let reloj = null;
  const temporizadores = new Set();

  const esperar = (ms) => new Promise(res => {
    const t = setTimeout(() => { temporizadores.delete(t); res(); }, ms);
    temporizadores.add(t);
  });

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
        el('label', { clase: 'ac-juego__etiqueta', for: 'ac-mem-nivel', texto: 'Elige nivel' }),
        el('select', { clase: 'ac-select', id: 'ac-mem-nivel',
          onchange: (ev) => { nivel = niveles[Number(ev.target.value)] || nivel; pantallaInicio(); } },
          ...niveles.map((n, i) => el('option', { value: i, selected: n.id === nivel.id },
            `${n.nombre} · ${n.dificultad} · ${n.os}`))),
      ),
      el('button', { clase: 'ac-btn ac-btn--primario', texto: 'Empezar', onclick: jugar }),
    ));
    contenedor.querySelector('.ac-btn--primario').focus();
  }

  function jugar() {
    contenedor.innerHTML = '';
    clearInterval(reloj);

    estado = {
      cartas: generarTablero(nivel.parejas || []),
      volteadas: [],
      resueltas: new Set(),
      aciertos: 0, fallos: 0, pistas: 0, solucionVista: false,
      bloqueado: false,
      inicio: Date.now(),
    };

    const hud = crearHud(contenedor, {
      juego, nivel, conTiempo: true,
      alReiniciar: jugar,
      alPista: darPista,
      alSolucion: verSolucion,
    });
    estado.hud = hud;
    reloj = setInterval(() => hud.tiempo((Date.now() - estado.inicio) / 1000), 500);

    const tablero = el('div', {
      clase: 'ac-mem', role: 'grid',
      'aria-label': `Tablero de memoria con ${estado.cartas.length} cartas`,
    });
    estado.tablero = tablero;

    contenedor.append(
      el('p', { clase: 'ac-mem__objetivo' }, el('b', { texto: 'Objetivo: ' }), nivel.objetivo),
      tablero,
      el('p', { clase: 'ac-mem__marcador' },
        el('span', { 'data-marcador': 'parejas', texto: `Parejas: 0 / ${(nivel.parejas || []).length}` }),
        ' · ',
        el('span', { 'data-marcador': 'fallos', texto: 'Intentos fallidos: 0' })),
    );
    estado.refs = {
      parejas: contenedor.querySelector('[data-marcador="parejas"]'),
      fallos: contenedor.querySelector('[data-marcador="fallos"]'),
    };
    pintar();
  }

  function pintar() {
    const { tablero } = estado;
    tablero.innerHTML = '';
    estado.cartas.forEach((carta, i) => {
      const abierta = estado.volteadas.includes(i) || estado.resueltas.has(carta.pareja);
      const resuelta = estado.resueltas.has(carta.pareja);
      const btn = el('button', {
        type: 'button',
        clase: 'ac-mem__carta'
             + (abierta ? ' es-abierta' : '')
             + (resuelta ? ' es-resuelta' : '')
             + (carta.cara === 'comando' ? ' es-comando' : ' es-par'),
        role: 'gridcell',
        'aria-label': abierta
          ? `${carta.texto}${resuelta ? '. Pareja resuelta' : ''}`
          : `Carta ${i + 1} boca abajo`,
        'aria-pressed': abierta ? 'true' : 'false',
        disabled: resuelta || estado.bloqueado ? true : false,
        onclick: () => voltear(i),
      });
      if (abierta) {
        btn.append(
          el('span', { clase: 'ac-mem__tipo', texto: carta.cara === 'comando' ? 'comando' : (nivel.tipo || 'función') }),
          el('span', { clase: 'ac-mem__texto', texto: carta.texto }),
          resuelta ? el('span', { clase: 'ac-mem__marca', texto: '✔ pareja' }) : null,
        );
      } else {
        btn.append(el('span', { clase: 'ac-mem__dorso', 'aria-hidden': 'true', texto: '?' }));
      }
      tablero.append(btn);
    });

    estado.refs.parejas.textContent = `Parejas: ${estado.resueltas.size} / ${(nivel.parejas || []).length}`;
    estado.refs.fallos.textContent = `Intentos fallidos: ${estado.fallos}`;
  }

  async function voltear(i) {
    if (estado.bloqueado) return;
    const carta = estado.cartas[i];
    if (estado.resueltas.has(carta.pareja) || estado.volteadas.includes(i)) return;

    estado.volteadas.push(i);
    pintar();
    estado.tablero.children[i]?.focus();

    if (estado.volteadas.length < 2) return;

    const [a, b] = estado.volteadas.map(idx => estado.cartas[idx]);
    const info = (nivel.parejas || [])[a.pareja] || {};

    if (esPareja(a, b)) {
      estado.resueltas.add(a.pareja);
      estado.aciertos++;
      estado.volteadas = [];
      estado.hud.aviso(`<b>${info.comando}</b> — ${info.par}${info.explica ? '. ' + info.explica : ''}`, 'ok');
      estado.hud.puntos(puntuar(estado));
      pintar();
      if (estado.resueltas.size === (nivel.parejas || []).length) ganar();
      return;
    }

    estado.fallos++;
    estado.bloqueado = true;
    pintar();
    const infoB = (nivel.parejas || [])[b.pareja] || {};
    estado.hud.aviso(
      `Esas dos no van juntas: <b>${a.texto}</b> se empareja con «${(nivel.parejas || [])[a.pareja]?.par}», ` +
      `y <b>${b.texto}</b> con «${infoB.par ?? infoB.comando}».`, 'error');
    await esperar(1400);
    estado.volteadas = [];
    estado.bloqueado = false;
    pintar();
  }

  function darPista() {
    // La pista abre la pareja más «barata»: la primera sin resolver.
    const pendiente = (nivel.parejas || []).findIndex((_, i) => !estado.resueltas.has(i));
    if (pendiente < 0) return;
    estado.pistas++;
    const p = nivel.parejas[pendiente];
    estado.hud.aviso(`<b>Pista:</b> busca <code>${p.comando}</code> y su pareja «${p.par}».`, 'pista');
    estado.hud.puntos(puntuar(estado));
  }

  function verSolucion() {
    estado.solucionVista = true;
    const lista = (nivel.parejas || []).map(p => `<li><code>${p.comando}</code> → ${p.par}</li>`).join('');
    estado.hud.aviso(`<b>Todas las parejas:</b><ul class="ac-lista">${lista}</ul>`, 'info');
  }

  function ganar() {
    clearInterval(reloj);
    const tiempo = Math.round((Date.now() - estado.inicio) / 1000);
    const puntos = puntuar(estado);
    const xp = completarNivel(progreso, juego.slug, nivel, {
      puntos, tiempo, pistas: estado.pistas, solucion: estado.solucionVista,
    });
    const i = niveles.indexOf(nivel);
    const siguiente = niveles[i + 1];
    pantallaVictoria(contenedor, {
      titulo: 'Tablero despejado',
      texto: nivel.explica || `Has emparejado ${estado.resueltas.size} comandos con lo que hacen, en ${tiempo} segundos.`,
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
      clearInterval(reloj);
      for (const t of temporizadores) clearTimeout(t);
      temporizadores.clear();
      estado = null;
      contenedor.innerHTML = '';
    },
  };
}
