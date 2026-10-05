/**
 * Academia de Inglés · Tarjeta de memorización (compartida por Tarjetas y
 * Repaso). Una tarjeta = frente → (respuesta escrita opcional) → reverso →
 * autocalificación en cuatro niveles que alimenta el SM-2 de progreso.js.
 *
 * Modalidades de vocabulario:
 *   en-es      frente: palabra inglesa (con audio)       → significado
 *   es-en      frente: significado                        → palabra inglesa
 *   audio      frente: solo audio                         → palabra
 *   imagen     frente: imagen (emoji)                     → palabra
 *   completar  frente: el ejemplo con la palabra tapada   → palabra
 * Gramática: frente y reverso redactados en la lección.
 */
import { el, fmt, botonOir } from './ejercicios.js';
import { coincide } from './texto.js';
import { decir } from './voz.js';
import { programar } from './progreso.js';

const DIA = 86400000;

/** Texto legible del intervalo que produciría cada nota (se muestra en el botón). */
export function vistaPrevia(tarjeta, nota) {
  const t = tarjeta || { rep: 0, ef: 2.5, intervalo: 0 };
  const { espera } = programar(t, nota);
  if (espera < DIA) return `${Math.round(espera / 60000)} min`;
  const d = Math.round(espera / DIA);
  return d === 1 ? '1 día' : d < 31 ? `${d} días` : `${Math.round(d / 30)} mes${d >= 60 ? 'es' : ''}`;
}

/** Frase de ejemplo con la palabra tapada; null si la palabra no aparece tal cual. */
export function taparPalabra(frase, palabra) {
  const re = new RegExp(`\\b${palabra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return re.test(frase) ? frase.replace(re, '_____') : null;
}

/** ¿Esta palabra sirve para la modalidad pedida? */
export function aptaPara(modo, p) {
  if (modo === 'imagen') return !!p.emoji;
  if (modo === 'completar') return !!taparPalabra(p.ejemplo?.en || '', p.en);
  return true;
}

/**
 * Pinta una tarjeta y resuelve con la nota elegida (0–3).
 * @param {HTMLElement} caja
 * @param {{tipo:'v'|'g', modo?:string, palabra?:object, gramatica?:object, estado?:object, posicion?:string}} t
 */
export function mostrarTarjeta(caja, t, signal = null) {
  return new Promise(resolve => {
    // Si la tanda se cancela (empieza otra), esta tarjeta no califica nada.
    signal?.addEventListener('abort', () => { document.removeEventListener('keydown', teclas); resolve(null); }, { once: true });
    caja.textContent = '';
    const modo = t.tipo === 'g' ? 'gramatica' : (t.modo || 'en-es');
    const p = t.palabra || {};
    const g = t.gramatica || {};

    const tarjeta = el('div', { clase: 'in-tarjeta' });
    const caras = el('div', { clase: 'in-tarjeta__caras' });
    const frente = el('div', { clase: 'in-tarjeta__cara', 'aria-hidden': 'false' });
    const atras = el('div', { clase: 'in-tarjeta__cara in-tarjeta__cara--atras', 'aria-hidden': 'true' });
    caras.append(frente, atras);
    tarjeta.append(caras);

    // ----- frente
    const esperada = modo === 'gramatica' ? null : (modo === 'en-es' ? null : p.en);
    if (modo === 'gramatica') {
      frente.append(el('p', { clase: 'in-tarjeta__pista', texto: 'Gramática · ' + (g.leccion_titulo || '') }), el('p', { clase: 'in-tarjeta__frase', html: fmt(g.frente) }));
    } else if (modo === 'en-es') {
      frente.append(el('p', { clase: 'in-tarjeta__pista', texto: '¿Qué significa?' }), el('p', { clase: 'in-tarjeta__grande', lang: 'en', texto: p.en }), botonOir(p.en));
    } else if (modo === 'es-en') {
      frente.append(el('p', { clase: 'in-tarjeta__pista', texto: '¿Cómo se dice en inglés?' }), el('p', { clase: 'in-tarjeta__grande', texto: p.es }));
    } else if (modo === 'audio') {
      const b = botonOir(p.en, { etiqueta: 'Escuchar otra vez' });
      frente.append(el('p', { clase: 'in-tarjeta__pista', texto: 'Escucha y escribe la palabra' }), el('p', { clase: 'in-tarjeta__emoji', 'aria-hidden': 'true', texto: '🎧' }), b);
      setTimeout(() => decir(p.en).catch(() => {}), 150);
    } else if (modo === 'imagen') {
      frente.append(el('p', { clase: 'in-tarjeta__pista', texto: '¿Qué es en inglés?' }), el('p', { clase: 'in-tarjeta__emoji', role: 'img', 'aria-label': 'Imagen de la palabra (significado: ' + p.es + ')', texto: p.emoji }));
    } else if (modo === 'completar') {
      frente.append(el('p', { clase: 'in-tarjeta__pista', texto: 'Completa la oración' }), el('p', { clase: 'in-tarjeta__frase', lang: 'en', texto: taparPalabra(p.ejemplo.en, p.en) }), el('p', { clase: 'in-es', texto: p.ejemplo.es }));
    }

    // ----- reverso
    if (modo === 'gramatica') {
      atras.append(el('p', { clase: 'in-tarjeta__frase', html: fmt(g.reverso) }));
      if (g.nota) atras.append(el('p', { clase: 'in-tarjeta__pista', html: fmt(g.nota) }));
    } else {
      atras.append(
        p.emoji ? el('p', { clase: 'in-tarjeta__emoji', 'aria-hidden': 'true', texto: p.emoji }) : '',
        el('p', { clase: 'in-tarjeta__grande', lang: 'en', texto: p.en }),
        el('p', {}, el('span', { clase: 'in-ipa', texto: p.ipa || '' }), ' ', botonOir(p.en), botonOir(p.en, { lento: true })),
        el('p', { clase: 'in-palabra__es', texto: p.es }),
        p.ejemplo ? el('p', { clase: 'in-tarjeta__frase' }, el('span', { lang: 'en', texto: p.ejemplo.en }), ' ', botonOir(p.ejemplo.en)) : '',
        p.ejemplo ? el('p', { clase: 'in-es', texto: p.ejemplo.es }) : '',
      );
    }

    // ----- respuesta escrita opcional
    const responder = el('form', { clase: 'in-mazo__responder' });
    let resultadoEscrito = null;
    if (esperada) {
      const campo = el('input', { type: 'text', clase: 'in-input', lang: 'en', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Escribe tu respuesta (opcional) y pulsa Enter', 'aria-label': 'Tu respuesta' });
      const salida = el('p', { clase: 'in-nota-pie', 'aria-live': 'polite' });
      responder.append(campo, salida);
      responder.addEventListener('submit', (e) => {
        e.preventDefault();
        if (campo.value.trim()) {
          resultadoEscrito = coincide(campo.value, [p.en, ...(p.variantes ? [p.variantes.us, p.variantes.gb].filter(Boolean) : [])]);
          salida.textContent = resultadoEscrito ? '✓ Correcto.' : `✗ Escribiste «${campo.value}».`;
          salida.className = 'in-nota-pie ' + (resultadoEscrito ? 'es-ok' : 'es-mal');
        }
        girar();
      });
      setTimeout(() => campo.focus({ preventScroll: true }), 60);
    }

    const btnGirar = el('button', { type: 'button', clase: 'in-btn in-btn--primario', texto: 'Mostrar respuesta (espacio)' });
    const calificar = el('div', { clase: 'in-calificar', hidden: true, role: 'group', 'aria-label': '¿La recordaste?' });
    const notas = [
      ['Otra vez', 'No la recordé'],
      ['Difícil', 'Me costó mucho'],
      ['Bien', 'La recordé'],
      ['Fácil', 'Sin dudar'],
    ];
    notas.forEach(([nombre, desc], i) => {
      const b = el('button', { type: 'button', clase: 'in-btn in-btn--fino', 'data-nota': String(i) },
        el('span', { texto: `${i + 1} · ${nombre}` }), el('small', { texto: `${desc} · vuelve en ${vistaPrevia(t.estado, i)}` }));
      b.addEventListener('click', () => terminar(i));
      calificar.append(b);
    });

    function girar() {
      if (tarjeta.classList.contains('es-girada')) return;
      tarjeta.classList.add('es-girada');
      frente.setAttribute('aria-hidden', 'true');
      atras.setAttribute('aria-hidden', 'false');
      btnGirar.hidden = true;
      calificar.hidden = false;
      if (resultadoEscrito === false) calificar.querySelector('[data-nota="0"]').classList.add('in-btn--resaltado');
      if (modo !== 'gramatica' && modo !== 'en-es') decir(p.en).catch(() => {});
      (calificar.querySelector(resultadoEscrito === false ? '[data-nota="0"]' : '[data-nota="2"]'))?.focus({ preventScroll: true });
    }
    btnGirar.addEventListener('click', () => (esperada ? responder.requestSubmit() : girar()));

    const teclas = (e) => {
      if ((e.target instanceof Element && e.target.matches('input, textarea, select')) && e.key !== 'Enter') return;
      if (e.key === ' ' && !tarjeta.classList.contains('es-girada')) { e.preventDefault(); btnGirar.click(); }
      else if (/^[1-4]$/.test(e.key) && tarjeta.classList.contains('es-girada')) { e.preventDefault(); terminar(Number(e.key) - 1); }
    };
    document.addEventListener('keydown', teclas);

    function terminar(nota) {
      document.removeEventListener('keydown', teclas);
      resolve(nota);
    }

    caja.append(el('p', { clase: 'in-mazo__marcador', texto: t.posicion || '' }), tarjeta, esperada ? responder : '',
      el('div', { clase: 'in-mazo__responder' }, btnGirar), calificar);
  });
}
