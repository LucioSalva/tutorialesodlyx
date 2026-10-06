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
 * así se escriben los «ejemplos resueltos» de los temas de concepto). `extra` admite { codigo, tabla, figura, pistas }.
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
/**
 * Diagrama de una topología, ya calculado como líneas y nodos (PHP y JS solo lo pintan).
 * forma: 'estrella' | 'estrella-extendida' | 'malla' | 'malla-parcial' | 'bus' | 'anillo' | 'punto-a-punto'.
 * El texto alternativo describe las conexiones sin nombrar la topología, para poder preguntarla.
 */
export function topo(forma, n = 5) {
  const W = 320, H = 200, cx = W / 2, cy = H / 2;
  const r2 = (v) => Math.round(v * 10) / 10;
  const circulo = (k, radio, cuantos = n, et = (i) => `${k === 'rt' ? 'R' : 'PC'}${i + 1}`) => Array.from({ length: cuantos }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / cuantos;
    return { x: r2(cx + radio * 1.45 * Math.cos(a)), y: r2(cy + radio * Math.sin(a)), k, et: et(i) };
  });
  const une = (a, b) => [a.x, a.y, b.x, b.y];
  let nodos = [], lineas = [], alt = '';
  if (forma === 'estrella') {
    const pcs = circulo('pc', 72), sw = { x: cx, y: cy, k: 'sw', et: 'SW' };
    nodos = [...pcs, sw]; lineas = pcs.map((x) => une(x, sw));
    alt = `${n} computadoras, cada una con un cable propio hacia un único equipo central.`;
  } else if (forma === 'estrella-extendida') {
    const nucleo = { x: cx, y: 30, k: 'sw', et: 'SW0' };
    const sws = [60, 160, 260].map((x, i) => ({ x, y: 96, k: 'sw', et: `SW${i + 1}` }));
    const pcs = sws.flatMap((s, i) => [-28, 28].map((d, j) => ({ x: s.x + d, y: 168, k: 'pc', et: `PC${i * 2 + j + 1}`, sw: s })));
    lineas = [...sws.map((s) => une(s, nucleo)), ...pcs.map((x) => une(x, x.sw))];
    nodos = [...pcs.map(({ sw, ...x }) => x), ...sws, nucleo];
    alt = 'Un switch central unido a tres switches; de cada uno de esos tres cuelgan dos computadoras.';
  } else if (forma === 'malla' || forma === 'malla-parcial' || forma === 'anillo') {
    nodos = circulo(forma === 'anillo' ? 'pc' : 'rt', 74);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const vecinos = j === i + 1 || (i === 0 && j === n - 1);
      if (forma === 'malla' || vecinos || (forma === 'malla-parcial' && i === 0 && j === 2)) lineas.push(une(nodos[i], nodos[j]));
    }
    alt = forma === 'malla' ? `${n} routers; cada uno tiene un enlace directo con todos los demás.`
      : forma === 'anillo' ? `${n} equipos en círculo; cada uno está unido solo con sus dos vecinos.`
      : `${n} routers; todos tienen al menos dos enlaces, pero no todos están unidos entre sí directamente.`;
  } else if (forma === 'bus') {
    const paso = 240 / (n - 1);
    nodos = Array.from({ length: n }, (_, i) => ({ x: r2(40 + i * paso), y: i % 2 ? 160 : 40, k: 'pc', et: `PC${i + 1}` }));
    lineas = [[18, cy, W - 18, cy], [18, cy - 7, 18, cy + 7], [W - 18, cy - 7, W - 18, cy + 7], ...nodos.map((x) => [x.x, x.y, x.x, cy])];
    alt = `Un solo cable largo con un terminador en cada extremo; ${n} computadoras se conectan a ese mismo cable.`;
  } else if (forma === 'punto-a-punto') {
    nodos = [{ x: 70, y: cy, k: 'rt', et: 'R1' }, { x: 250, y: cy, k: 'rt', et: 'R2' }];
    lineas = [une(nodos[0], nodos[1])];
    alt = 'Dos routers unidos por un único enlace directo.';
  } else throw new Error('Topología desconocida: ' + forma);
  return { ancho: W, alto: H, lineas, nodos, alt };
}
/** Varios diagramas en cuadrícula: items = [[figura, pie], …]. */
export const figuras = (...items) => ({ t: 'figuras', items: items.map(([f, pie]) => ({ ...f, pie })) });
/** Bloque de lección con un diagrama. */
export const figura = (f, pie = '') => ({ t: 'figura', ...f, ...(pie ? { pie } : {}) });
/** Atajos de los tipos más usados. */
export const an = (ip, pr) => ({ tipo: 'analizar', ip, p: pr });
export const td = (ip, pr) => ({ tipo: 'tipo-direccion', ip, p: pr });
export const ms = (a, b, pr) => ({ tipo: 'misma-subred', a, b, p: pr });
