/**
 * Academia de Inglés · Ejercicios interactivos
 * ---------------------------------------------------------------------
 * Monta la parte interactiva de cada <article data-ej> a partir de su
 * objeto JSON. Once tipos, un solo flujo:
 *
 *     responder → Comprobar → (fallo: mensaje razonado) → Pista 1 → 2 → 3
 *               → Ver solución (respuesta + explicación + dónde fallaste)
 *
 * La corrección NO vive aquí: todo pasa por evaluar() de evaluador.js.
 * El texto de los datos se inserta con textContent o con fmt(), que escapa
 * y solo reconoce el marcado mínimo del curso. Nunca innerHTML con texto
 * del estudiante.
 */

import { evaluar, esAutocorregible, comprobarEscritura, respuestaLegible } from './evaluador.js';
import { diferencias, masCercana, contarPalabras, limpiar } from './texto.js';
import { decir, explicarError } from './voz.js';
import { fraseInglesa, completarFrase, audioSolucion, asignarRoles, pareceIngles } from './audio-textos.js';
import { Grabadora, puedeGrabar, puedeReconocer, consentido, consentir, reconocer, compararReconocido, explicarErrorMicro } from './microfono.js';

/* ------------------------------------------------------------ utilidades */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

const ROLES = ['sujeto', 'verbo', 'auxiliar', 'negacion', 'complemento', 'interrogativo', 'tiempo', 'otro'];

/** Marcado mínimo del curso, sobre texto ya escapado (espejo de in_md en PHP). */
export function fmt(texto) {
  return esc(texto)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[\[(.+?)\]\]/g, '<span class="in-en" lang="en">$1</span>')
    .replace(new RegExp(`\\{\\{(${ROLES.join('|')}):(.+?)\\}\\}`, 'g'), '<span class="in-rol in-rol--$1" lang="en">$2</span>');
}

export function el(tag, props = {}, ...hijos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'clase') n.className = v;
    else if (k === 'texto') n.textContent = v;
    else if (k === 'html') n.innerHTML = v; // solo con fmt()/esc() o marcado propio
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const h of hijos.flat()) {
    if (h === null || h === undefined || h === false) continue;
    n.append(h.nodeType ? h : document.createTextNode(String(h)));
  }
  return n;
}

export const barajar = (lista) => {
  const c = lista.slice();
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
};

/** Botón de escuchar creado desde JS (mismo marcado que in_oir en PHP). */
export function botonOir(texto, { lento = false, etiqueta = '', rol = 'n', navegador = false } = {}) {
  const b = el('button', {
    type: 'button', clase: 'in-oir' + (lento ? ' in-oir--lento' : ''), 'data-decir': texto,
    'aria-label': (lento ? 'Escuchar despacio: ' : 'Escuchar: ') + texto, title: lento ? 'Escuchar despacio (0,75×)' : 'Escuchar',
  });
  if (lento) b.setAttribute('data-lento', '');
  if (rol !== 'n') b.dataset.rol = rol;
  // Solo para texto del propio estudiante: no existe audio pregenerado.
  if (navegador) { b.setAttribute('data-navegador', ''); b.title = 'Leer con la voz del navegador'; }
  b.innerHTML = lento
    ? '<svg class="in-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 12h4"/></svg><span>lento</span>'
    : '<svg class="in-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  if (etiqueta) b.append(el('span', { texto: etiqueta }));
  return b;
}

/* --------------------------------------------------- montaje de un ejercicio */

/**
 * @param {HTMLElement} nodo  <article data-ej>
 * @param {object} ej         datos del ejercicio
 * @param {object} op         { modo: 'practica'|'examen', alResolver(id, resultado, info), alSolucion(id), progreso }
 * @returns {{ respuesta(): any, corregir(): object, bloquear(): void, mostrarSolucion(r): void }}
 */
export function montarEjercicio(nodo, ej, op = {}) {
  const modo = op.modo || 'practica';
  const cuerpo = nodo.querySelector('[data-ej-cuerpo]') || nodo;
  cuerpo.textContent = '';
  const estado = nodo.querySelector('[data-ej-estado]');

  const zona = el('div', { clase: 'in-ej__zona' });
  const feedback = el('div', { clase: 'in-ej__feedback', role: 'status', 'aria-live': 'polite' });
  const pistasCaja = el('ol', { clase: 'in-ej__pistas' });
  const solucionCaja = el('div', { clase: 'in-ej__solucion', hidden: true });
  const acciones = el('div', { clase: 'in-ej__acciones' });
  cuerpo.append(zona, feedback, pistasCaja, solucionCaja, acciones);

  let pistasVistas = 0;
  let resuelto = false;
  let solucionVista = false;
  let ultimaRespuesta = null;

  const tipo = TIPOS[ej.tipo];
  if (!tipo) { zona.textContent = 'Tipo de ejercicio no disponible.'; return null; }
  const control = tipo(zona, ej, { modo, feedback });

  const audioFrase = modo === 'practica' ? fraseInglesa(ej) : null;
  if (ej.audio && audioFrase) {
    zona.prepend(el('div', { clase: 'in-ej__oir' }, botonOir(audioFrase), botonOir(audioFrase, { lento: true })));
  }

  const pintarEstado = (texto, clase) => {
    if (!estado) return;
    estado.textContent = texto;
    estado.className = 'in-ej__estado ' + (clase || '');
  };

  const comprobar = () => {
    const r = control.respuesta();
    ultimaRespuesta = r;
    const res = evaluar(ej, r);
    if (res.vacio) { mostrarFeedback(res.mensaje, 'aviso'); return res; }
    control.marcar?.(res);
    if (res.correcto) {
      resuelto = true;
      const extra = ej.solucion?.explicacion ? ' ' + ej.solucion.explicacion : '';
      mostrarFeedback((res.mensaje ? res.mensaje + ' ' : '') + (extra && !res.mensaje ? extra : ''), 'ok', '¡Correcto!');
      pintarEstado(pistasVistas ? `Resuelto con ${pistasVistas} pista${pistasVistas > 1 ? 's' : ''}` : 'Resuelto', 'es-ok');
      nodo.classList.add('es-resuelto');
      nodo.classList.remove('es-fallado');
      control.bloquear?.();
      btnComprobar.hidden = true;
      btnSolucion.hidden = true;
      btnPista.hidden = true;
      // Siempre la forma modelo (la misma que tiene audio pregenerado).
      const oirla = audioSolucion(ej);
      if (oirla) feedback.append(el('p', { clase: 'in-ej__oirsol' }, 'Escúchalo: ', botonOir(oirla)));
    } else {
      nodo.classList.add('es-fallado');
      mostrarFeedback(res.mensaje, res.casi ? 'aviso' : 'mal', res.casi ? 'Casi' : 'Todavía no');
      if (res.paso === 'correccion') control.pasoCorreccion?.();
    }
    op.alResolver?.(ej.id, res, { pistas: pistasVistas, respuesta: r });
    return res;
  };

  const mostrarFeedback = (texto, tono, titulo = '') => {
    feedback.className = 'in-ej__feedback in-ej__feedback--' + tono;
    feedback.innerHTML = (titulo ? `<b>${esc(titulo)}.</b> ` : '') + fmt(texto || '');
  };

  const verPista = () => {
    const pistas = ej.pistas || [];
    if (pistasVistas >= pistas.length) return;
    pistasCaja.append(el('li', { clase: 'in-ej__pista', html: `<b>Pista ${pistasVistas + 1}:</b> ` + fmt(pistas[pistasVistas]) }));
    pistasVistas++;
    btnPista.textContent = pistasVistas < pistas.length ? `Pista ${pistasVistas + 1}` : 'Sin más pistas';
    btnPista.disabled = pistasVistas >= pistas.length;
    if (pistasVistas >= pistas.length) btnSolucion.classList.add('in-btn--resaltado');
  };

  const verSolucion = () => {
    solucionVista = true;
    solucionCaja.hidden = false;
    solucionCaja.textContent = '';
    const legible = respuestaLegible(ej);
    solucionCaja.append(el('p', { clase: 'in-ej__solucion-t' }, el('b', { texto: 'Solución: ' }),
      el('span', { lang: 'en', texto: ej.tipo === 'completar' ? completarFrase(ej, null) : legible })));
    const audio = audioSolucion(ej);
    if (audio) solucionCaja.firstChild.append(' ', botonOir(audio));
    if (ej.solucion?.explicacion) solucionCaja.append(el('p', { html: fmt(ej.solucion.explicacion) }));

    // Dónde estaba el fallo, palabra a palabra (solo tipos de texto libre).
    if (ultimaRespuesta && typeof ultimaRespuesta === 'string' && ['traducir', 'transformar', 'dictado', 'ordenar'].includes(ej.tipo) && limpiar(ultimaRespuesta)) {
      const aceptadas = ej.tipo === 'dictado' ? [ej.texto, ...(ej.respuestas || [])] : ej.respuestas;
      const { aceptada } = masCercana(ultimaRespuesta, aceptadas);
      const ops = diferencias(ultimaRespuesta, aceptada);
      if (ops.some(o => o.tipo !== 'igual')) {
        const linea = el('p', { clase: 'in-diff', lang: 'en' });
        for (const o of ops) linea.append(el('span', { clase: 'in-diff__' + o.tipo, texto: o.palabra, title: o.tipo === 'falta' ? 'Faltaba' : (o.tipo === 'sobra' ? 'Sobraba o estaba mal' : '') }), ' ');
        solucionCaja.append(el('p', { clase: 'in-etiqueta', texto: 'Tu respuesta comparada con la solución' }), linea,
          el('p', { clase: 'in-nota-pie', html: '<span class="in-diff__falta">verde</span> = faltaba · <span class="in-diff__sobra">tachado</span> = sobraba o era otra palabra' }));
      }
    }
    if (ej.tipo === 'traducir' && (ej.respuestas || []).length > 1) {
      solucionCaja.append(el('p', { clase: 'in-etiqueta', texto: 'También son correctas' }),
        el('ul', { clase: 'in-alternativas' }, ...ej.respuestas.slice(1).map(r => el('li', { lang: 'en', texto: r }))));
    }
    control.mostrarSolucion?.();
    control.bloquear?.();
    btnComprobar.hidden = true;
    btnPista.hidden = true;
    btnSolucion.hidden = true;
    if (!resuelto && modo === 'practica') {
      pintarEstado('Visto con solución', 'es-sol');
      btnReintentar.hidden = false;
      op.alSolucion?.(ej.id);
    }
  };

  const reintentar = () => {
    montarEjercicio(nodo, ej, op);
    op.alReintentar?.(ej.id);
  };

  const btnComprobar = el('button', { type: 'button', clase: 'in-btn in-btn--primario in-btn--fino', texto: 'Comprobar', onclick: comprobar });
  const btnPista = el('button', { type: 'button', clase: 'in-btn in-btn--fino', texto: 'Pista 1', onclick: verPista });
  const btnSolucion = el('button', { type: 'button', clase: 'in-btn in-btn--fino in-btn--suave', texto: 'Ver solución', onclick: verSolucion });
  const btnReintentar = el('button', { type: 'button', clase: 'in-btn in-btn--fino', texto: 'Intentarlo de nuevo', onclick: reintentar, hidden: true });

  if (modo === 'practica') {
    if (esAutocorregible(ej)) acciones.append(btnComprobar);
    if ((ej.pistas || []).length) acciones.append(btnPista);
    if (esAutocorregible(ej)) acciones.append(btnSolucion, btnReintentar);
  }
  nodo.classList.remove('es-resuelto', 'es-fallado');
  pintarEstado('', '');

  // Estado previo guardado
  const previo = op.progreso?.ejercicio(ej.id);
  if (modo === 'practica' && previo?.resuelto) pintarEstado('Resuelto antes', 'es-ok es-previo');

  return {
    respuesta: () => control.respuesta(),
    corregir: () => evaluar(ej, control.respuesta()),
    bloquear: () => control.bloquear?.(),
    marcar: (r) => control.marcar?.(r),
    mostrarSolucion: verSolucion,
    get resuelto() { return resuelto; },
    get solucionVista() { return solucionVista; },
  };
}

/* ------------------------------------------------------------- los tipos */

/** Opciones como botones de radio accesibles. */
function tipoOpcion(zona, ej, { modo }) {
  if (ej.tipo === 'conversacion') {
    zona.append(el('p', { clase: 'in-ej__contexto', html: fmt(ej.contexto || '') }));
    const lista = el('ol', { clase: 'in-dialogo__lineas in-dialogo__lineas--mini' });
    const roles = asignarRoles((ej.lineas || []).map(l => l.quien));
    (ej.lineas || []).forEach((l, i) => {
      lista.append(el('li', { clase: 'in-burbuja in-burbuja--' + (i % 2 ? 'b' : 'a') },
        el('span', { clase: 'in-burbuja__quien', texto: l.quien }),
        el('span', { clase: 'in-burbuja__en', lang: 'en', texto: l.en }),
        pareceIngles(l.en) ? botonOir(l.en, { rol: roles.get(l.quien) }) : ''));
    });
    zona.append(lista);
  }
  if (ej.pregunta) zona.append(el('p', { clase: 'in-ej__pregunta', html: fmt(ej.pregunta).replace(/___/g, '<span class="in-hueco-fijo">____</span>') }));

  const nombre = 'op-' + ej.id.replace(/[^a-z0-9]/gi, '-') + '-' + Math.random().toString(36).slice(2, 6);
  const orden = modo === 'examen' ? barajar(ej.opciones.map((o, i) => i)) : ej.opciones.map((o, i) => i);
  const lista = el('div', { clase: 'in-opciones', role: 'radiogroup', 'aria-label': 'Opciones' });
  const entradas = [];
  orden.forEach((i) => {
    const o = ej.opciones[i];
    const input = el('input', { type: 'radio', name: nombre, value: String(i), clase: 'in-opcion__radio' });
    const lbl = el('label', { clase: 'in-opcion' }, input, el('span', { clase: 'in-opcion__texto', html: fmt(o.texto) }));
    entradas.push({ input, lbl, i });
    lista.append(lbl);
  });
  zona.append(lista);
  return {
    respuesta: () => {
      const s = entradas.find(x => x.input.checked);
      return s ? s.i : -1;
    },
    marcar: (res) => {
      const s = entradas.find(x => x.input.checked);
      entradas.forEach(x => x.lbl.classList.remove('es-ok', 'es-mal'));
      if (s) s.lbl.classList.add(res.correcto ? 'es-ok' : 'es-mal');
    },
    bloquear: () => entradas.forEach(x => { x.input.disabled = true; }),
    mostrarSolucion: () => {
      entradas.forEach(x => {
        const o = ej.opciones[x.i];
        if (o.correcta) x.lbl.classList.add('es-ok');
        if (!x.lbl.querySelector('.in-opcion__porque')) x.lbl.append(el('span', { clase: 'in-opcion__porque', html: fmt(o.porque || '') }));
      });
    },
  };
}

/** Huecos: escribir o elegir del banco. */
function tipoCompletar(zona, ej) {
  const partes = String(ej.frase || '').split('___');
  const frase = el('p', { clase: 'in-ej__frase', lang: 'en' });
  const entradas = [];
  partes.forEach((p, i) => {
    frase.append(p);
    if (i < partes.length - 1) {
      // Ancho fijo que crece al escribir: medirlo con la respuesta la delataría.
      const ancho = 9;
      let campo;
      if (ej.banco && partes.length === 2) {
        campo = el('select', { clase: 'in-hueco in-hueco--select', 'aria-label': `Hueco ${i + 1}` },
          el('option', { value: '', texto: '—' }), ...barajar(ej.banco).map(b => el('option', { value: b, texto: b })));
      } else {
        campo = el('input', { type: 'text', clase: 'in-hueco', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': `Hueco ${i + 1}`, size: String(ancho), style: `width:${ancho + 1}ch` });
      }
      if (campo.tagName === 'INPUT') campo.addEventListener('input', () => { campo.style.width = Math.max(ancho + 1, campo.value.length + 2) + 'ch'; });
      entradas.push(campo);
      frase.append(campo);
    }
  });
  zona.append(frase);
  if (ej.banco && partes.length > 2) {
    zona.append(el('p', { clase: 'in-banco' }, el('span', { clase: 'in-etiqueta', texto: 'Banco de palabras: ' }), ...ej.banco.map(b => el('span', { clase: 'in-banco__p', lang: 'en', texto: b }))));
  }
  if (ej.traduccion) zona.append(el('p', { clase: 'in-es', texto: ej.traduccion }));
  entradas.forEach((c, i) => c.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); (entradas[i + 1] || zona.closest('[data-ej]')?.querySelector('.in-btn--primario'))?.focus?.(); if (!entradas[i + 1]) zona.closest('[data-ej]')?.querySelector('.in-btn--primario')?.click(); }
  }));
  return {
    respuesta: () => entradas.map(c => c.value),
    marcar: (res) => entradas.forEach((c, i) => {
      c.classList.remove('es-ok', 'es-mal');
      if (res.parcial) c.classList.add(res.parcial[i] ? 'es-ok' : 'es-mal');
    }),
    bloquear: () => entradas.forEach(c => { c.disabled = true; }),
  };
}

/** Ordenar fichas: pulsar para mover (sin arrastrar obligatorio) y arrastrar opcional. */
function tipoOrdenar(zona, ej) {
  const destino = el('div', { clase: 'in-fichas in-fichas--destino', 'aria-label': 'Tu oración', role: 'list' });
  const origen = el('div', { clase: 'in-fichas in-fichas--origen', 'aria-label': 'Fichas disponibles', role: 'list' });
  const fichas = barajar(ej.fichas.map((t, i) => ({ t, i })));
  // Evita que el barajado deje ya la frase correcta.
  if (fichas.map(f => f.t).join(' ') === ej.fichas.join(' ') && fichas.length > 2) fichas.push(fichas.shift());
  const botones = fichas.map(f => {
    const b = el('button', { type: 'button', clase: 'in-ficha', lang: 'en', texto: f.t, draggable: 'true', role: 'listitem' });
    b.addEventListener('click', () => {
      if (b.disabled) return;
      (b.parentElement === origen ? destino : origen).append(b);
      b.focus();
    });
    b.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', ''); zona._arrastrando = b; });
    return b;
  });
  botones.forEach(b => origen.append(b));
  [origen, destino].forEach(caja => {
    caja.addEventListener('dragover', (e) => e.preventDefault());
    caja.addEventListener('drop', (e) => {
      e.preventDefault();
      const b = zona._arrastrando;
      if (!b) return;
      const antes = e.target.closest('.in-ficha');
      if (antes && antes !== b && antes.parentElement === caja) caja.insertBefore(b, antes); else caja.append(b);
      zona._arrastrando = null;
    });
  });
  zona.append(el('p', { clase: 'in-etiqueta', texto: 'Pulsa las fichas en orden (o arrástralas). Pulsa una ficha de tu oración para devolverla.' }), destino, origen);
  if (ej.traduccion) zona.append(el('p', { clase: 'in-es', texto: ej.traduccion }));
  return {
    respuesta: () => [...destino.children].map(b => b.textContent).join(' '),
    marcar: (res) => { destino.classList.toggle('es-ok', res.correcto); destino.classList.toggle('es-mal', !res.correcto); },
    bloquear: () => botones.forEach(b => { b.disabled = true; b.draggable = false; }),
  };
}

/** Relacionar: elegir en cada fila la pareja correcta (accesible con teclado y lector). */
function tipoRelacionar(zona, ej) {
  const opcionesB = barajar(ej.pares.map(p => p.b));
  const filas = ej.pares.map((p, i) => {
    const sel = el('select', { clase: 'in-select', 'aria-label': `Pareja de «${p.a}»` },
      el('option', { value: '', texto: 'Elige…' }), ...opcionesB.map(b => el('option', { value: b, texto: b })));
    const fila = el('li', { clase: 'in-relacion' }, el('span', { clase: 'in-relacion__a', lang: 'en', texto: p.a }), el('span', { clase: 'in-relacion__flecha', 'aria-hidden': 'true', texto: '→' }), sel);
    if (pareceIngles(p.a)) fila.insertBefore(botonOir(p.a), fila.children[1]);
    return { p, sel, fila };
  });
  zona.append(el('ul', { clase: 'in-relaciones' }, ...filas.map(f => f.fila)));
  return {
    respuesta: () => Object.fromEntries(filas.map(f => [f.p.a, f.sel.value])),
    marcar: (res) => filas.forEach((f, i) => { f.fila.classList.remove('es-ok', 'es-mal'); f.fila.classList.add(res.parcial[i] ? 'es-ok' : 'es-mal'); }),
    bloquear: () => filas.forEach(f => { f.sel.disabled = true; }),
    mostrarSolucion: () => filas.forEach(f => { f.sel.value = f.p.b; f.fila.classList.remove('es-mal'); f.fila.classList.add('es-ok'); }),
  };
}

/** Texto libre de una línea: traducir, transformar, dictado. */
function tipoTexto(zona, ej) {
  if (ej.tipo === 'traducir') {
    zona.append(el('p', { clase: 'in-ej__origen' }, el('span', { clase: 'in-etiqueta', texto: 'En español: ' }), el('span', { texto: ej.es })));
  } else if (ej.tipo === 'transformar') {
    zona.append(el('p', { clase: 'in-ej__origen' }, el('span', { lang: 'en', clase: 'in-frase', texto: ej.origen }), ' ', botonOir(ej.origen)),
      el('p', { clase: 'in-ej__instruccion' }, el('span', { clase: 'in-etiqueta', texto: 'Transforma a: ' }), el('b', { texto: ej.instruccion })));
  } else if (ej.tipo === 'dictado') {
    zona.append(el('div', { clase: 'in-ej__oir in-ej__oir--dictado' },
      botonOir(ej.texto, { etiqueta: 'Escuchar' }), botonOir(ej.texto, { lento: true })));
  }
  const id = 'txt-' + ej.id.replace(/[^a-z0-9]/gi, '-');
  const campo = el('input', { type: 'text', id, clase: 'in-input', lang: 'en', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: ej.tipo === 'dictado' ? 'Escribe lo que oyes…' : 'Escribe en inglés…' });
  campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); zona.closest('[data-ej]')?.querySelector('.in-btn--primario')?.click(); } });
  zona.append(el('label', { class: 'visually-hidden', for: id, texto: 'Tu respuesta' }), campo);
  return {
    respuesta: () => campo.value,
    marcar: (res) => { campo.classList.remove('es-ok', 'es-mal'); campo.classList.add(res.correcto ? 'es-ok' : 'es-mal'); },
    bloquear: () => { campo.disabled = true; },
  };
}

/** Corregir: 1) señalar la parte incorrecta; 2) escribir la corrección. */
function tipoCorregir(zona, ej) {
  const palabras = String(ej.frase).split(/\s+/);
  const nErr = String(ej.error).split(/\s+/).length;
  const frase = el('p', { clase: 'in-ej__frase in-corregir', lang: 'en' });
  let seleccion = '';
  const botones = palabras.map((p, i) => {
    const b = el('button', { type: 'button', clase: 'in-token', texto: p, 'aria-pressed': 'false' });
    b.addEventListener('click', () => {
      botones.forEach(x => { x.classList.remove('es-elegido'); x.setAttribute('aria-pressed', 'false'); });
      // Selecciona tantas palabras como tiene el error, empezando por la pulsada.
      const grupo = botones.slice(i, i + nErr);
      grupo.forEach(x => { x.classList.add('es-elegido'); x.setAttribute('aria-pressed', 'true'); });
      seleccion = palabras.slice(i, i + nErr).join(' ').replace(/[.,!?]+$/, '');
    });
    return b;
  });
  botones.forEach((b, i) => { frase.append(b); if (i < botones.length - 1) frase.append(' '); });
  const campo = el('input', { type: 'text', clase: 'in-input', lang: 'en', autocomplete: 'off', spellcheck: 'false', placeholder: 'Escribe la forma correcta…', 'aria-label': 'Corrección' });
  campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); zona.closest('[data-ej]')?.querySelector('.in-btn--primario')?.click(); } });
  const paso2 = el('div', { clase: 'in-corregir__paso2' }, el('span', { clase: 'in-etiqueta', texto: '2 · Escribe cómo debería ser esa parte:' }), campo);
  zona.append(el('p', { clase: 'in-etiqueta', texto: '1 · Pulsa la palabra (o el grupo de palabras) incorrecta:' }), frase, paso2);
  return {
    respuesta: () => ({ seleccion, correccion: campo.value }),
    pasoCorreccion: () => campo.focus(),
    marcar: (res) => {
      const elegidos = botones.filter(b => b.classList.contains('es-elegido'));
      elegidos.forEach(b => b.classList.toggle('es-mal', res.paso === 'seleccion'));
      if (res.paso !== 'seleccion') elegidos.forEach(b => b.classList.add('es-localizado'));
      campo.classList.toggle('es-ok', !!res.correcto);
      campo.classList.toggle('es-mal', res.paso === 'correccion');
    },
    bloquear: () => { botones.forEach(b => { b.disabled = true; }); campo.disabled = true; },
    mostrarSolucion: () => {
      const err = limpiar(ej.error);
      botones.forEach((b, i) => {
        const grupo = limpiar(palabras.slice(i, i + nErr).join(' '));
        if (grupo === err) botones.slice(i, i + nErr).forEach(x => x.classList.add('es-localizado'));
      });
    },
  };
}

/** Escritura libre: comprobaciones de presencia + autoevaluación con criterios. */
function tipoEscritura(zona, ej) {
  zona.append(el('p', { html: fmt(ej.instrucciones || '') }));
  const info = el('div', { clase: 'in-escritura__apoyo' });
  if (ej.vocabulario_apoyo?.length) info.append(el('p', {}, el('span', { clase: 'in-etiqueta', texto: 'Vocabulario de apoyo: ' }), ...ej.vocabulario_apoyo.flatMap((v, i) => [i ? ' · ' : '', el('span', { lang: 'en', texto: v })])));
  if (ej.estructuras?.length) info.append(el('p', { clase: 'in-etiqueta', texto: 'Estructuras que necesitas' }), el('ul', { clase: 'in-estructuras-lista' }, ...ej.estructuras.map(s => el('li', { lang: 'en', html: fmt(s) }))));
  if (ej.ejemplo) info.append(el('details', { clase: 'in-detalle' }, el('summary', { texto: 'Ver un ejemplo de otro tema parecido' }), el('p', { lang: 'en', texto: ej.ejemplo })));
  zona.append(info);
  const id = 'esc-' + ej.id.replace(/[^a-z0-9]/gi, '-');
  const area = el('textarea', { id, clase: 'in-textarea', rows: '6', lang: 'en', spellcheck: 'false', placeholder: 'Escribe tu texto en inglés…' });
  const contador = el('p', { clase: 'in-escritura__contador', 'aria-live': 'polite' });
  const pintarContador = () => {
    const n = contarPalabras(area.value);
    contador.textContent = `${n} palabra${n === 1 ? '' : 's'}` + (ej.min_palabras ? ` · mínimo ${ej.min_palabras}` : '');
    contador.classList.toggle('es-ok', !ej.min_palabras || n >= ej.min_palabras);
  };
  area.addEventListener('input', pintarContador);
  pintarContador();

  // Borrador guardado solo en este navegador.
  const claveBorrador = 'ingles:borrador:' + ej.id;
  try { area.value = localStorage.getItem(claveBorrador) || ''; pintarContador(); } catch { /* sin persistencia */ }
  area.addEventListener('input', () => { try { localStorage.setItem(claveBorrador, area.value.slice(0, 5000)); } catch { /* lleno */ } });

  zona.append(el('label', { class: 'visually-hidden', for: id, texto: 'Tu texto' }), area, contador);

  const resultado = el('div', { clase: 'in-escritura__resultado', hidden: true });
  const revisar = el('button', { type: 'button', clase: 'in-btn in-btn--primario in-btn--fino', texto: 'Revisar mi texto' });
  revisar.addEventListener('click', () => {
    resultado.hidden = false;
    resultado.textContent = '';
    const checks = comprobarEscritura(ej, area.value);
    if (checks.length) {
      resultado.append(el('p', { clase: 'in-etiqueta', texto: 'Comprobación automática de estructuras' }),
        el('ul', { clase: 'in-checks' }, ...checks.map(c => el('li', { clase: c.ok ? 'es-ok' : 'es-mal' }, el('span', { 'aria-hidden': 'true', texto: c.ok ? '✓ ' : '✗ ' }), el('span', { html: fmt(c.descripcion) }), el('span', { class: 'visually-hidden', texto: c.ok ? ' (presente)' : ' (no encontrada)' })))),
        el('p', { clase: 'in-nota-pie', texto: 'Esta comprobación solo mira si aparecen las estructuras pedidas. No sabe si están bien usadas: eso lo revisas tú con los criterios y el modelo.' }));
    }
    resultado.append(el('p', { clase: 'in-etiqueta', texto: 'Revisa tu texto con estos criterios' }),
      el('ul', { clase: 'in-criterios' }, ...(ej.criterios || []).map((c, i) => el('li', {}, el('label', {}, el('input', { type: 'checkbox', 'data-criterio': String(i) }), ' ', el('span', { html: fmt(c) }))))));
    const modelo = el('details', { clase: 'in-detalle in-detalle--modelo' }, el('summary', { texto: 'Ver la respuesta modelo y su explicación' }),
      el('p', { clase: 'in-modelo', lang: 'en', texto: ej.modelo }), el('p', {}, botonOir(ej.modelo, { etiqueta: 'Escuchar el modelo' })),
      el('div', { html: fmt(ej.explicacion || '').replace(/\n\n/g, '</p><p>') }));
    if (ej.errores_comunes?.length) modelo.append(el('p', { clase: 'in-etiqueta', texto: 'Errores comunes' }), el('ul', {}, ...ej.errores_comunes.map(x => el('li', { html: fmt(x) }))));
    resultado.append(modelo);
    zona.closest('[data-ej]')?.dispatchEvent(new CustomEvent('escritura-revisada', { bubbles: true }));
  });
  zona.append(el('div', { clase: 'in-ej__acciones' }, revisar, botonOir('', { etiqueta: 'Escuchar mi texto (voz del navegador)', navegador: true })), resultado);
  // el botón «escuchar mi texto» lee lo que haya en el área en ese momento
  const oirMio = zona.querySelector('.in-ej__acciones .in-oir');
  oirMio.addEventListener('click', () => { oirMio.dataset.decir = area.value || ' '; }, true);
  return { respuesta: () => area.value };
}

/** Pronunciación: escuchar, leer, repetir, grabarse, comparar; reconocimiento opcional. */
export function tipoPronunciacion(zona, ej) {
  const caja = el('div', { clase: 'in-repetir' });
  caja.append(el('p', { clase: 'in-repetir__texto' }, el('span', { lang: 'en', texto: ej.texto }), el('span', { clase: 'in-ipa', texto: ej.ipa || '' })));
  if (ej.es) caja.append(el('p', { clase: 'in-es', texto: ej.es }));
  if (ej.consejo) caja.append(el('p', { clase: 'in-repetir__consejo', html: fmt(ej.consejo) }));
  const pasos = el('ol', { clase: 'in-pasos' },
    el('li', {}, el('b', { texto: 'Escucha' }), ' ', botonOir(ej.texto), botonOir(ej.texto, { lento: true })),
    el('li', {}, el('b', { texto: 'Lee' }), ' la frase y fíjate en el AFI y en el consejo.'),
    el('li', {}, el('b', { texto: 'Repite' }), ' en voz alta, dos o tres veces.'));
  caja.append(pasos);

  const salida = el('div', { clase: 'in-repetir__salida', role: 'status', 'aria-live': 'polite' });
  const extras = el('div', { clase: 'in-repetir__extras' });
  if (puedeGrabar()) {
    const g = new Grabadora();
    const bGrabar = el('button', { type: 'button', clase: 'in-btn in-btn--fino', texto: '● Grabarme' });
    const bComparar = el('button', { type: 'button', clase: 'in-btn in-btn--fino', texto: 'Comparar: modelo y yo', disabled: true });
    let grabando = false;
    bGrabar.addEventListener('click', async () => {
      if (grabando) { g.parar(); return; }
      try {
        grabando = true;
        bGrabar.textContent = '■ Parar';
        bGrabar.classList.add('es-grabando');
        salida.textContent = 'Grabando… (máximo 20 segundos). Tu voz no sale de este navegador.';
        await g.empezar();
        salida.textContent = 'Grabación lista. Pulsa «Comparar» para oír el modelo y después tu voz.';
        bComparar.disabled = false;
      } catch (e) {
        salida.textContent = explicarErrorMicro(e);
      } finally {
        grabando = false;
        bGrabar.textContent = '● Grabarme otra vez';
        bGrabar.classList.remove('es-grabando');
      }
    });
    bComparar.addEventListener('click', async () => {
      salida.textContent = 'Modelo…';
      try { await decir(ej.texto); } catch (e) { salida.textContent = explicarError(e); }
      await new Promise(r => setTimeout(r, 400));
      salida.textContent = 'Tu voz…';
      await g.reproducir();
      salida.textContent = '¿Se parecen? Fíjate en la sílaba fuerte, en los sonidos finales y en la entonación.';
    });
    extras.append(el('li', {}, el('b', { texto: 'Grábate y compara' }), ' (opcional) ', bGrabar, ' ', bComparar));
  }
  if (puedeReconocer()) {
    const bRec = el('button', { type: 'button', clase: 'in-btn in-btn--fino in-btn--suave', texto: '¿Qué entendió el reconocedor?' });
    bRec.addEventListener('click', async () => {
      if (!consentido()) {
        salida.textContent = '';
        const aviso = el('div', { clase: 'in-consentimiento' },
          el('p', { html: '<b>Antes de usarlo:</b> en Chrome y Edge el reconocimiento de voz envía tu audio a los servidores del fabricante del navegador para transcribirlo. Es opcional; «Grabarme» funciona sin enviar nada.' }),
          el('p', { texto: 'Además, el resultado es solo lo que el reconocedor cree haber oído. No es una evaluación de tu pronunciación.' }));
        const si = el('button', { type: 'button', clase: 'in-btn in-btn--fino', texto: 'Entendido, usarlo en esta sesión' });
        const no = el('button', { type: 'button', clase: 'in-btn in-btn--fino in-btn--suave', texto: 'No, gracias' });
        si.addEventListener('click', () => { consentir(true); aviso.remove(); bRec.click(); });
        no.addEventListener('click', () => aviso.remove());
        aviso.append(si, ' ', no);
        salida.append(aviso);
        return;
      }
      salida.textContent = 'Escuchando… di la frase ahora.';
      try {
        const alt = await reconocer({});
        if (!alt.length) { salida.textContent = 'No se reconoció nada. Inténtalo de nuevo más cerca del micrófono.'; return; }
        const c = compararReconocido(ej.texto, alt);
        salida.textContent = '';
        salida.append(el('p', {}, 'El reconocedor entendió: ', el('q', { lang: 'en', texto: c.texto })),
          el('p', { texto: `Coinciden ${c.coinciden} de ${c.total} palabras.` + (c.faltan.length ? ` No reconoció: ${c.faltan.join(', ')}.` : '') }),
          el('p', { clase: 'in-nota-pie', texto: 'Úsalo como una pista, no como una nota: un reconocedor puede entender una pronunciación imperfecta o fallar con una buena.' }));
      } catch (e) { salida.textContent = explicarErrorMicro(e); }
    });
    extras.append(el('li', {}, el('b', { texto: 'Reconocimiento' }), ' (opcional, con aviso de privacidad) ', bRec));
  }
  if (extras.childElementCount) pasos.append(...extras.children);
  caja.append(salida);
  zona.append(caja);
  return { respuesta: () => null };
}

const TIPOS = {
  opcion: tipoOpcion,
  conversacion: tipoOpcion,
  completar: tipoCompletar,
  ordenar: tipoOrdenar,
  relacionar: tipoRelacionar,
  traducir: tipoTexto,
  transformar: tipoTexto,
  dictado: tipoTexto,
  corregir: tipoCorregir,
  escritura: tipoEscritura,
  pronunciacion: tipoPronunciacion,
};
