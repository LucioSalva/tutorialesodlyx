/**
 * Academia de Inglés · Qué texto suena en cada sitio (módulo puro)
 * ---------------------------------------------------------------------
 * Una sola definición de «qué frase inglesa se escucha» en ejercicios,
 * soluciones y diálogos. La usan la interfaz (ejercicios.js, juegos,
 * conversaciones) y el recolector que prepara la generación de audio
 * (tools/ingles/audio/recolectar.mjs). Así el audio generado y el botón
 * que lo pide no pueden desalinearse: si una regla cambia aquí, el
 * recolector detecta los audios nuevos que faltan.
 *
 * También reparte las voces de un diálogo (asignarRoles), con la misma
 * regla que PHP (in_roles_dialogo en ingles-ui.php).
 */

import { respuestaLegible } from './evaluador.js';

/** Frase inglesa del enunciado que se puede escuchar (con huecos como pausa). */
export function fraseInglesa(ej) {
  switch (ej.tipo) {
    case 'completar': return (ej.frase || '').replace(/___/g, '…');
    case 'transformar': return ej.origen;
    case 'corregir': return null; // una frase incorrecta no se lee en voz alta
    case 'opcion': return /[a-z]/i.test(ej.pregunta || '') && !/[áéíóúñ¿]/i.test(ej.pregunta || '') ? ej.pregunta.replace(/___/g, '…') : null;
    default: return null;
  }
}

/** Frase de «completar» con los huecos rellenos con la PRIMERA respuesta válida. */
export function completarFrase(ej, valores = null) {
  let i = 0;
  return (ej.frase || '').replace(/___/g, () => {
    const v = valores?.[i] ?? ej.respuestas?.[i]?.[0] ?? '…';
    i++;
    return v;
  });
}

/** Lo que se escucha al acertar o al ver la solución (siempre la forma modelo). */
export function audioSolucion(ej) {
  if (['opcion', 'conversacion', 'relacionar', 'escritura', 'pronunciacion'].includes(ej.tipo)) return null;
  const t = ej.tipo === 'completar' ? completarFrase(ej) : (ej.tipo === 'corregir' ? ej.frase_correcta : respuestaLegible(ej));
  return t && /[a-z]/i.test(t) ? t : null;
}

let espanol = new Set();

/**
 * ¿Es un texto en español? Se ignoran la transcripción AFI (/…/) y las
 * aclaraciones entre paréntesis; cuenta como español una palabra de la
 * lista de voces.json o una palabra en minúscula con tilde o ñ (los nombres
 * propios con tilde, como Lucía, no cuentan). Español = al menos la mitad.
 * Misma regla que in_es_espanol() en ingles-ui.php.
 */
export function esEspanol(t) {
  const limpio = String(t || '').replace(/\/[^/]*\//g, ' ').replace(/\([^)]*\)/g, ' ');
  if (/[¿¡]/.test(limpio)) return true;
  const palabras = limpio.match(/[A-Za-zÀ-ÿ]+/g) || [];
  if (!palabras.length) return true;
  // una letra mayúscula suelta (la «O» o la «Y» del alfabeto) no es español
  const es = palabras.filter(p => !/^[A-Z]$/.test(p) && espanol.has(p.toLowerCase()) || (/^[a-zà-ÿ]+$/.test(p) && /[áéíóúñü]/.test(p))).length;
  return es * 2 >= palabras.length;
}

/** ¿Tiene pinta de ser inglés (y no una etiqueta en español)? */
export const pareceIngles = (t) => /[a-z]/i.test(t || '') && !esEspanol(t);

/**
 * Todos los textos que un ejercicio puede hacer sonar, con su rol de voz.
 * @returns {{texto:string, rol:string}[]}
 */
export function textosEjercicio(ej) {
  const salida = [];
  const mas = (texto, rol = 'n') => { if (texto && pareceIngles(texto)) salida.push({ texto, rol }); };
  if (ej.audio) mas(fraseInglesa(ej));
  if (ej.tipo === 'conversacion') {
    const roles = asignarRoles((ej.lineas || []).map(l => l.quien));
    (ej.lineas || []).forEach(l => { if (pareceIngles(l.en)) mas(l.en, roles.get(l.quien)); });
  }
  if (ej.tipo === 'relacionar') (ej.pares || []).forEach(p => { if (pareceIngles(p.a)) mas(p.a); });
  if (ej.tipo === 'transformar') mas(ej.origen);
  if (ej.tipo === 'dictado' || ej.tipo === 'pronunciacion') mas(ej.texto);
  if (ej.tipo === 'escritura') mas(ej.modelo);
  mas(audioSolucion(ej));
  return salida;
}

/* ------------------------------------------------------------ voces */

let personajes = { f: new Set(), m: new Set() };

/** Carga la lista de personajes por voz (de audio/voces.json). */
export function fijarPersonajes(config) {
  personajes = { f: new Set(config?.personajes?.f || []), m: new Set(config?.personajes?.m || []) };
  espanol = new Set(config?.espanol || []);
}

/**
 * Reparte voces entre los hablantes de un diálogo, en orden de aparición:
 * femeninos → n, f; masculinos → m, m2; sin género conocido («Tú»…) → la
 * primera voz libre del género contrario al del primer hablante conocido.
 * @param {string[]} quienes  hablantes en el orden de las líneas
 * @returns {Map<string,string>} hablante → rol
 */
export function asignarRoles(quienes) {
  const orden = [...new Set(quienes.filter(Boolean))];
  const libres = { f: ['n', 'f'], m: ['m', 'm2'] };
  const roles = new Map();
  const genero = (q) => (personajes.f.has(q) ? 'f' : (personajes.m.has(q) ? 'm' : null));
  const primero = orden.map(genero).find(Boolean) || 'm';
  for (const q of orden) {
    const g = genero(q);
    if (g) roles.set(q, libres[g].shift() || (g === 'f' ? 'n' : 'm'));
  }
  const contrario = primero === 'f' ? 'm' : 'f';
  for (const q of orden) {
    if (roles.has(q)) continue;
    roles.set(q, libres[contrario].shift() || libres[primero].shift() || 'n');
  }
  return roles;
}
