// Atajos para escribir lecciones como datos. Marcado admitido en los textos: **negrita** y `mono`.
export const h = (texto) => ({ t: 'h', texto });
export const h3 = (texto) => ({ t: 'h3', texto });
export const p = (texto) => ({ t: 'p', texto });
export const lista = (...items) => ({ t: 'lista', items });
export const orden = (...items) => ({ t: 'lista', orden: true, items });
export const tabla = (cab, filas, pie) => ({ t: 'tabla', cab, filas, ...(pie ? { pie } : {}) });
export const nota = (tono, texto, titulo) => ({ t: 'nota', tono, texto, ...(titulo ? { titulo } : {}) });
export const formula = (expr, leyenda = [], texto = '') => ({ t: 'formula', expr, leyenda, texto });
/** Bloque de configuración o salida de consola, tal cual. */
export const codigo = (titulo, texto) => ({ t: 'codigo', titulo, texto });
/** Regla de bits: filas [etiqueta, ip, prefijo, prefijoOriginal?]. */
export const bits = (filas, pie = '') => ({ t: 'bits', filas: filas.map(([et, ip, pr, p0]) => ({ et, ip, p: pr, ...(p0 !== undefined ? { p0 } : {}) })), pie });
/** Ejemplo resuelto: los pasos los calcula el motor a partir de spec. */
export const ejemplo = (nivel, titulo, spec, cierre = '') => ({ t: 'ejemplo', nivel, titulo, spec, cierre });
export const ejercicios = (titulo, texto, items) => ({ t: 'ejercicios', titulo, texto, items });
/** Pregunta de concepto de opción múltiple (correcta = índice). */
export const op = (pregunta, opciones, correcta, porque) => ({ tipo: 'opcion', pregunta, opciones, correcta, porque });
/** Atajos de los tipos más usados. */
export const an = (ip, pr) => ({ tipo: 'analizar', ip, p: pr });
export const td = (ip, pr) => ({ tipo: 'tipo-direccion', ip, p: pr });
export const ms = (a, b, pr) => ({ tipo: 'misma-subred', a, b, p: pr });
