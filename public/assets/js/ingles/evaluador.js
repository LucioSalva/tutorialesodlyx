/**
 * Academia de Inglés · Motor de evaluación
 * ---------------------------------------------------------------------
 * UNA sola función decide si una respuesta es correcta, para todas las
 * lecciones, evaluaciones, exámenes, lecturas y juegos. Ninguna vista
 * compara cadenas por su cuenta.
 *
 *   evaluar(ejercicio, respuesta) → {
 *     correcto:  boolean,
 *     parcial:   [boolean]        (huecos o pares, cuando aplica)
 *     mensaje:   string           explicación del acierto o del fallo
 *     casi:      boolean          ortografía a 1–2 letras de una respuesta válida
 *   }
 *
 * El mensaje de fallo NUNCA revela la respuesta: para eso están las pistas
 * y el botón «Ver solución». Sí explica el porqué cuando el fallo es uno
 * de los previstos (errores_tipicos o el «porque» de cada opción).
 *
 * Módulo puro (sin DOM).
 */

import { canonica, coincide, distancia, limpiar } from './texto.js';

const opcionesTexto = (ej) => ({ literal: ej.literal === true, mayusculas: ej.mayusculas === true });

/** Busca la explicación prevista para una respuesta incorrecta concreta. */
function errorTipico(ej, respuesta) {
  const mapa = ej.errores_tipicos;
  if (!mapa || typeof mapa !== 'object') return null;
  const r = canonica(respuesta, opcionesTexto(ej));
  for (const [clave, mensaje] of Object.entries(mapa)) {
    if (canonica(clave, opcionesTexto(ej)) === r) return mensaje;
  }
  return null;
}

/** ¿Está a una o dos letras de alguna respuesta aceptada? */
function esCasi(respuesta, aceptadas, ej) {
  const r = canonica(respuesta, opcionesTexto(ej));
  if (r.length < 3) return false;
  return (aceptadas || []).some(a => {
    const c = canonica(a, opcionesTexto(ej));
    const d = distancia(r, c);
    return d > 0 && d <= (c.length > 12 ? 2 : 1);
  });
}

function fallo(ej, respuesta, aceptadas, generico) {
  const previsto = errorTipico(ej, respuesta);
  if (previsto) return { correcto: false, mensaje: previsto, casi: false };
  if (!canonica(respuesta)) return { correcto: false, mensaje: 'Escribe una respuesta antes de comprobar.', casi: false, vacio: true };
  if (esCasi(respuesta, aceptadas, ej)) {
    return { correcto: false, casi: true, mensaje: 'Casi: la estructura va bien, pero hay una palabra mal escrita. Revisa letra por letra.' };
  }
  return { correcto: false, casi: false, mensaje: generico };
}

const MENSAJE = {
  texto: 'Todavía no. Relee el enunciado, fíjate en el sujeto y en el tiempo verbal, y usa las pistas si lo necesitas.',
  ordenar: 'Ese orden no forma una oración correcta. Empieza por localizar el sujeto (o el auxiliar, si es una pregunta).',
};

export function evaluar(ej, respuesta) {
  switch (ej.tipo) {
    case 'opcion':
    case 'conversacion': {
      const op = (ej.opciones || [])[respuesta];
      if (!op) return { correcto: false, mensaje: 'Elige una opción.', vacio: true };
      return { correcto: !!op.correcta, mensaje: op.porque || '' };
    }

    case 'completar': {
      const valores = Array.isArray(respuesta) ? respuesta : [respuesta];
      if (valores.every(v => !canonica(v))) return { correcto: false, mensaje: 'Rellena los huecos antes de comprobar.', vacio: true };
      const parcial = (ej.respuestas || []).map((lista, i) => coincide(valores[i] ?? '', lista, opcionesTexto(ej)));
      const correcto = parcial.length > 0 && parcial.every(Boolean);
      if (correcto) return { correcto, parcial, mensaje: '' };
      const unida = valores.map(v => limpiar(v)).join(' | ');
      const previsto = errorTipico(ej, unida);
      if (previsto) return { correcto: false, parcial, mensaje: previsto };
      const casi = valores.some((v, i) => !parcial[i] && esCasi(v, ej.respuestas[i], ej));
      const malos = parcial.filter(x => !x).length;
      return {
        correcto: false, parcial, casi,
        mensaje: casi
          ? 'Casi: hay una palabra mal escrita. Revisa la ortografía del hueco marcado.'
          : (parcial.length > 1
            ? `${malos === 1 ? 'Un hueco no es correcto' : `${malos} huecos no son correctos`}: están marcados. Los demás están bien.`
            : MENSAJE.texto),
      };
    }

    case 'ordenar':
      if (coincide(respuesta, ej.respuestas, opcionesTexto(ej))) return { correcto: true, mensaje: '' };
      return fallo(ej, respuesta, ej.respuestas, MENSAJE.ordenar);

    case 'traducir':
    case 'transformar':
      if (coincide(respuesta, ej.respuestas, opcionesTexto(ej))) return { correcto: true, mensaje: '' };
      return fallo(ej, respuesta, ej.respuestas, MENSAJE.texto);

    case 'dictado': {
      const aceptadas = [ej.texto, ...(ej.respuestas || [])];
      if (coincide(respuesta, aceptadas, opcionesTexto(ej))) return { correcto: true, mensaje: '' };
      return fallo(ej, respuesta, aceptadas, 'No coincide con lo que se dice. Escúchalo otra vez, más lento si hace falta, y escribe palabra por palabra.');
    }

    case 'relacionar': {
      // respuesta: { [a]: b } con los textos tal cual aparecen en pares
      const pares = ej.pares || [];
      const parcial = pares.map(p => (respuesta || {})[p.a] === p.b);
      const correcto = parcial.length > 0 && parcial.every(Boolean);
      const malos = parcial.filter(x => !x).length;
      return {
        correcto, parcial,
        mensaje: correcto ? '' : `${malos === 1 ? 'Una pareja no es correcta' : `${malos} parejas no son correctas`}. Las marcadas en rojo deben cambiar.`,
      };
    }

    case 'corregir': {
      // respuesta: { seleccion: 'texto señalado', correccion: 'texto escrito' }
      const r = respuesta || {};
      const señalado = canonica(r.seleccion || '', { literal: true }) === canonica(ej.error, { literal: true });
      if (!señalado) {
        return { correcto: false, paso: 'seleccion', mensaje: 'Esa parte es correcta. El error está en otra palabra: lee la oración entera y comprueba el sujeto, el verbo y el orden.' };
      }
      const okCorreccion = coincide(r.correccion || '', ej.correcciones, opcionesTexto(ej))
        || coincide(r.correccion || '', [ej.frase_correcta], opcionesTexto(ej));
      if (okCorreccion) return { correcto: true, mensaje: '' };
      if (!canonica(r.correccion || '')) return { correcto: false, paso: 'correccion', mensaje: 'Bien localizado. Ahora escribe cómo debería ser.', vacio: true };
      const f = fallo(ej, r.correccion, ej.correcciones, 'Bien localizado, pero la corrección no es esa. Piensa qué regla se está incumpliendo.');
      return { ...f, paso: 'correccion' };
    }

    default:
      // escritura y pronunciacion no tienen corrección automática
      return { correcto: null, mensaje: '' };
  }
}

/** ¿Este ejercicio se corrige automáticamente? */
export function esAutocorregible(ej) {
  return !['escritura', 'pronunciacion'].includes(ej.tipo);
}

/**
 * Comprobaciones de PRESENCIA de estructuras en escritura libre. No dicen
 * si el texto es correcto: solo si contiene lo que la tarea pide.
 */
export function comprobarEscritura(ej, texto) {
  const resultados = (ej.comprobaciones || []).map(c => {
    let ok = false;
    try { ok = new RegExp(c.patron, 'iu').test(String(texto || '').replace(/[‘’]/g, "'")); }
    catch { ok = false; }
    return { descripcion: c.descripcion, ok };
  });
  return resultados;
}

/** Respuesta correcta en forma legible, para la solución. */
export function respuestaLegible(ej) {
  switch (ej.tipo) {
    case 'opcion':
    case 'conversacion':
      return (ej.opciones || []).filter(o => o.correcta).map(o => o.texto).join(' / ');
    case 'completar':
      return (ej.respuestas || []).map(l => l[0]).join(' … ');
    case 'ordenar':
    case 'traducir':
    case 'transformar':
      return (ej.respuestas || [])[0] || '';
    case 'dictado':
      return ej.texto || '';
    case 'corregir':
      return ej.frase_correcta || '';
    case 'relacionar':
      return (ej.pares || []).map(p => `${p.a} → ${p.b}`).join(' · ');
    default:
      return ej.solucion?.respuesta || '';
  }
}
