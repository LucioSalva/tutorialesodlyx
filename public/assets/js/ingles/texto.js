/**
 * Academia de Inglés · Normalización de respuestas
 * ---------------------------------------------------------------------
 * Compara lo que escribe el estudiante con las respuestas aceptadas sin
 * castigar diferencias que no cambian la respuesta:
 *
 *   · mayúsculas y minúsculas                "she is" = "She is"
 *   · puntuación y espacios                  "Yes, I am." = "yes i am"
 *   · apóstrofos tipográficos                "I’m" = "I'm"
 *   · contracciones                          "She isn't" = "She is not" = "She's not"
 *
 * Y sin aceptar lo que SÍ cambia la respuesta: una palabra distinta, un
 * orden distinto o una -s que falta siguen siendo errores. Por eso no hay
 * «parecido suficiente»: la distancia de edición solo se usa para decir
 * «casi, revisa la ortografía», nunca para dar por buena una respuesta.
 *
 * Módulo puro (sin DOM): se prueba con Node en tools/ingles/tests/.
 */

/** Contracciones negativas y de auxiliares → forma completa. */
const CONTRACCIONES = new Map([
  ["isn't", 'is not'], ["aren't", 'are not'], ["wasn't", 'was not'], ["weren't", 'were not'],
  ["don't", 'do not'], ["doesn't", 'does not'], ["didn't", 'did not'],
  ["haven't", 'have not'], ["hasn't", 'has not'], ["hadn't", 'had not'],
  ["can't", 'can not'], ['cannot', 'can not'], ["couldn't", 'could not'],
  ["won't", 'will not'], ["wouldn't", 'would not'], ["shouldn't", 'should not'],
  ["mustn't", 'must not'], ["ain't", "ain't"],
  ["i'm", 'i am'], ["you're", 'you are'], ["we're", 'we are'], ["they're", 'they are'],
]);

/**
 * Sujetos tras los que 's es is/has y no un genitivo. «Anna's phone» NO se
 * toca: ahí 's es posesión y expandirlo convertiría un acierto en otro.
 */
const SUJETOS_S = new Set(['he', 'she', 'it', 'there', 'here', 'that', 'what', 'where', 'who', 'how', 'when', 'why', 'this']);

/**
 * Pasa a forma comparable, SIN tocar las contracciones.
 * @param {boolean} mayusculas  true = respeta mayúsculas (ejercicios cuyo
 *        objetivo es escribir Mexican, Monday, English… con mayúscula).
 */
export function limpiar(texto, mayusculas = false) {
  const t = String(texto ?? '')
    .normalize('NFC')
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”]/g, '"');
  return (mayusculas ? t : t.toLowerCase())
    // guiones y barras separan palabras: twenty-one = twenty one
    .replace(/[-‐-―/]/g, ' ')
    // puntuación que no cambia la respuesta
    .replace(/[.,!?¿¡;:"()[\]…]/g, ' ')
    // apóstrofo usado como comilla simple. Se conserva el de «parents'»,
    // que es gramática (genitivo plural), no puntuación.
    .replace(/(^|\s)'+/g, '$1')
    .replace(/([^s\s])'+(?=\s|$)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Expande contracciones sobre un texto ya limpiado. */
export function expandir(limpio) {
  const palabras = limpio.split(' ').filter(Boolean);
  const min = (p) => p.toLowerCase();
  const salida = [];
  for (let i = 0; i < palabras.length; i++) {
    const p = palabras[i];
    if (CONTRACCIONES.has(min(p))) { salida.push(conCapital(p, CONTRACCIONES.get(min(p)))); continue; }

    let m = p.match(/^([a-z]+)'(ve|ll|d|re)$/i);
    if (m) {
      const aux = { ve: 'have', ll: 'will', d: 'would', re: 'are' }[m[2]];
      salida.push(m[1], aux);
      continue;
    }

    m = p.match(/^([a-z]+)'s$/i);
    // «Priya's not…»: tras cualquier sustantivo, 's + not solo puede ser «is not»
    // (un genitivo nunca va seguido de not), así que se expande sin riesgo.
    if (m && !SUJETOS_S.has(min(m[1])) && min(palabras[i + 1] || '') === 'not') {
      salida.push(m[1], 'is');
      continue;
    }
    if (m && SUJETOS_S.has(min(m[1]))) {
      // «she's got» = «she has got»; en cualquier otro caso 's = is.
      const siguiente = palabras[i + 1];
      salida.push(m[1], siguiente === 'got' ? 'has' : 'is');
      continue;
    }
    salida.push(p);
  }
  return salida.join(' ');
}

/** «Isn't» → «Is not»: la expansión conserva la mayúscula inicial. */
function conCapital(original, expandida) {
  return /^[A-Z]/.test(original) ? expandida[0].toUpperCase() + expandida.slice(1) : expandida;
}

/**
 * Forma canónica para comparar.
 * @param {string} texto
 * @param {{literal?: boolean, mayusculas?: boolean}} opciones
 *        literal=true no expande contracciones (el objetivo ES la contracción);
 *        mayusculas=true distingue mayúsculas (el objetivo ES la mayúscula).
 */
export function canonica(texto, { literal = false, mayusculas = false } = {}) {
  const l = limpiar(texto, mayusculas);
  return literal ? l : expandir(l);
}

/** ¿La respuesta coincide con alguna de las aceptadas? */
export function coincide(respuesta, aceptadas, opciones = {}) {
  const lecturas = lecturasDe(respuesta, opciones);
  if (!lecturas.size || lecturas.has('')) return false;
  return (aceptadas || []).some(a => lecturas.has(canonica(a, opciones)));
}

/**
 * Lecturas posibles de lo que escribe el ESTUDIANTE. Tras un sustantivo,
 * «'s» puede ser genitivo (Anna's phone), is (My brother's tall) o has
 * (Tom's got a car). Se prueban las tres, pero SOLO en la respuesta del
 * estudiante: si se expandiera también la respuesta aceptada, «Anna is
 * phone» valdría por «Anna's phone». Las aceptadas se escriben completas.
 */
export function lecturasDe(texto, opciones = {}) {
  const base = canonica(texto, opciones);
  const salida = new Set([base]);
  if (opciones.literal) return salida;
  // Cada palabra aporta sus alternativas; se combinan de izquierda a derecha
  // (como mucho 4 «'s» ambiguos: 3^4 lecturas).
  const palabras = base.split(' ');
  let actuales = [[]];
  let ambiguas = 0;
  palabras.forEach((p, i) => {
    let opciones = [[p]];
    if (/^[a-z]+'s$/i.test(p) && ambiguas++ < 4) {
      const raiz = p.slice(0, -2);
      opciones = [[p], [raiz, 'is']];
      if (palabras[i + 1]?.toLowerCase() === 'got') opciones.push([raiz, 'has']);
    }
    actuales = actuales.flatMap(pref => opciones.map(o => [...pref, ...o]));
  });
  actuales.forEach(ps => salida.add(ps.join(' ')));
  return salida;
}

/** Distancia de Levenshtein (solo para el mensaje «casi»). */
export function distancia(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let previa = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const actual = [i];
    for (let j = 1; j <= b.length; j++) {
      actual[j] = Math.min(
        previa[j] + 1,
        actual[j - 1] + 1,
        previa[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previa = actual;
  }
  return previa[b.length];
}

/**
 * Diferencia palabra a palabra entre la respuesta y la aceptada más
 * cercana (LCS). Devuelve [{tipo:'igual'|'falta'|'sobra', palabra}].
 * Se usa AL MOSTRAR LA SOLUCIÓN, para señalar exactamente dónde estaba el
 * fallo, nunca antes (sería regalar la respuesta).
 */
export function diferencias(respuesta, aceptada) {
  const a = limpiar(respuesta).split(' ').filter(Boolean);
  const b = limpiar(aceptada).split(' ').filter(Boolean);
  const t = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      t[i][j] = a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { ops.push({ tipo: 'igual', palabra: b[j] }); i++; j++; }
    else if (t[i + 1][j] >= t[i][j + 1]) { ops.push({ tipo: 'sobra', palabra: a[i] }); i++; }
    else { ops.push({ tipo: 'falta', palabra: b[j] }); j++; }
  }
  while (i < a.length) ops.push({ tipo: 'sobra', palabra: a[i++] });
  while (j < b.length) ops.push({ tipo: 'falta', palabra: b[j++] });
  return ops;
}

/** La aceptada más parecida a la respuesta (para el diff de la solución). */
export function masCercana(respuesta, aceptadas, opciones = {}) {
  const r = canonica(respuesta, opciones);
  let mejor = aceptadas?.[0] ?? '';
  let min = Infinity;
  for (const a of aceptadas || []) {
    const d = distancia(r, canonica(a, opciones));
    if (d < min) { min = d; mejor = a; }
  }
  return { aceptada: mejor, distancia: min };
}

/** Cuenta palabras inglesas de un texto libre. */
export function contarPalabras(texto) {
  return (String(texto ?? '').match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || []).length;
}
