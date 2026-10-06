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
/**
 * Preguntas escritas a mano. `porque` es un párrafo, o un arreglo de pasos (razonamiento por pasos:
 * así se escriben los «ejemplos resueltos» de los temas de concepto). `extra` admite { codigo, tabla, pistas }.
 */
const expl = (porque) => (Array.isArray(porque) ? { pasos: porque } : { porque });
/** Opción múltiple (correcta = índice). */
export const op = (pregunta, opciones, correcta, porque, extra = {}) => ({ tipo: 'opcion', pregunta, opciones, correcta, ...expl(porque), ...extra });
/** Varias respuestas («elige dos»): correctas = índices. */
export const vs = (pregunta, opciones, correctas, porque, extra = {}) => ({ tipo: 'varias', pregunta, opciones, correctas, ...expl(porque), ...extra });
/** Relacionar: pares = [[concepto, respuesta], …]; sobran = respuestas distractoras. */
export const rel = (pregunta, pares, porque, sobran = [], extra = {}) => ({ tipo: 'relacionar', pregunta, pares, ...(sobran.length ? { extra: sobran } : {}), ...expl(porque), ...extra });
/** Ordenar: orden = elementos en el orden correcto. */
export const ord = (pregunta, orden, porque, extra = {}) => ({ tipo: 'ordenar', pregunta, orden, ...expl(porque), ...extra });
/** Atajos de los tipos más usados. */
export const an = (ip, pr) => ({ tipo: 'analizar', ip, p: pr });
export const td = (ip, pr) => ({ tipo: 'tipo-direccion', ip, p: pr });
export const ms = (a, b, pr) => ({ tipo: 'misma-subred', a, b, p: pr });
