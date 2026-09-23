/**
 * Academia de Comandos · Analizador de líneas de comando
 * ---------------------------------------------------------------------
 * Convierte texto en una estructura que el simulador sabe ejecutar. NO se
 * usa eval() ni Function(): el texto del estudiante nunca se interpreta
 * como JavaScript, solo se trocea y se compara con un registro cerrado de
 * comandos implementados.
 *
 * Cubre lo que se enseña en el curso:
 *   · comillas simples y dobles          "hola mundo"  'literal'
 *   · tuberías                            a | b | c
 *   · redirecciones                       > >> <   (Linux/CMD)
 *   · operadores de secuencia             ;  &&  ||
 *   · variables                           $VAR  ${VAR}  %VAR%  $env:VAR
 */

/**
 * Trocea respetando comillas. Cada token recuerda SI venía entrecomillado,
 * porque en Bash eso cambia el resultado: 'texto' no expande variables y
 * "texto" no expande comodines. Sin ese dato, `find . -name "*.txt"` se
 * comportaría mal.
 * @returns {{tokens: Array<{t:string,q:null|'"'|"'"}>, comillaAbierta:string|null}}
 */
export function tokenizar(linea) {
  const tokens = [];
  let actual = '';
  let hay = false;
  let comilla = null;
  let comillaUsada = null;

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];

    if (comilla) {
      if (c === comilla) { comilla = null; continue; }
      actual += c; hay = true; continue;
    }
    if (c === '"' || c === "'") { comilla = c; comillaUsada = c; hay = true; continue; }
    if (/\s/.test(c)) {
      if (hay) { tokens.push({ t: actual, q: comillaUsada }); actual = ''; hay = false; comillaUsada = null; }
      continue;
    }
    // Operadores como token propio
    const dos = linea.slice(i, i + 2);
    if (dos === '&&' || dos === '||' || dos === '>>') {
      if (hay) { tokens.push({ t: actual, q: comillaUsada }); actual = ''; hay = false; comillaUsada = null; }
      tokens.push({ t: dos, q: null, op: true }); i++; continue;
    }
    if (c === '|' || c === '>' || c === '<' || c === ';') {
      if (hay) { tokens.push({ t: actual, q: comillaUsada }); actual = ''; hay = false; comillaUsada = null; }
      tokens.push({ t: c, q: null, op: true }); continue;
    }
    actual += c; hay = true;
  }
  if (hay) tokens.push({ t: actual, q: comillaUsada });
  return { tokens, comillaAbierta: comilla };
}

/**
 * Estructura resultante:
 * [{ operador:'&&'|'||'|';'|null, tuberia:[{ nombre, args, redir:{salida,anexar,entrada} }] }]
 */
export function parsear(linea) {
  const { tokens, comillaAbierta } = tokenizar(linea);
  if (comillaAbierta) return { error: 'comilla', secuencia: [] };

  const secuencia = [];
  let tuberia = [];
  let actual = null;
  let operadorPendiente = null;

  const cerrarComando = () => {
    if (actual && actual.nombre) tuberia.push(actual);
    actual = null;
  };
  const cerrarTuberia = (operador) => {
    cerrarComando();
    if (tuberia.length) secuencia.push({ operador: operadorPendiente, tuberia });
    tuberia = [];
    operadorPendiente = operador;
  };

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const t = tok.t;
    if (tok.op && t === '|') { cerrarComando(); continue; }
    if (tok.op && (t === ';' || t === '&&' || t === '||')) { cerrarTuberia(t === ';' ? null : t); continue; }
    if (tok.op && (t === '>' || t === '>>' || t === '<')) {
      const destino = tokens[++i];
      if (!actual) actual = { nombre: '', args: [], redir: {} };
      if (!destino) return { error: 'redir', secuencia: [] };
      if (t === '<') actual.redir.entrada = destino.t;
      else { actual.redir.salida = destino.t; actual.redir.anexar = (t === '>>'); }
      continue;
    }
    if (!actual) actual = { nombre: t, args: [], redir: {} };
    else actual.args.push({ texto: t, comillas: tok.q });
  }
  cerrarTuberia(null);
  return { error: null, secuencia };
}

/** Sustituye variables de entorno según el estilo del shell. */
export function expandirVariables(texto, entorno, estilo) {
  if (typeof texto !== 'string') return texto;
  if (estilo === 'cmd') {
    return texto.replace(/%([A-Za-z_][A-Za-z0-9_]*)%/g, (_, n) => entorno[n.toUpperCase()] ?? '');
  }
  if (estilo === 'powershell') {
    return texto
      .replace(/\$env:([A-Za-z_][A-Za-z0-9_]*)/g, (_, n) => entorno[n.toUpperCase()] ?? '')
      .replace(/\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g, (m, n) => (n in entorno ? entorno[n] : m));
  }
  return texto
    .replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, n) => entorno[n] ?? '')
    .replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, n) => entorno[n] ?? '')
    .replace(/\$\?/g, String(entorno.__codigo ?? 0));
}

/**
 * Expande comodines (globbing) contra el sistema de archivos virtual.
 * Solo *, ? y [abc]; suficiente para el temario y sin sorpresas.
 */
export function expandirComodines(patron, vfs) {
  if (!/[*?\[]/.test(patron)) return [patron];

  // El prefijo se conserva tal y como lo escribió el usuario: si pidió
  // «*.txt» la respuesta son nombres sueltos, y si pidió «docs/*.txt»
  // la respuesta mantiene «docs/».
  const sep = vfs.sep;
  const corte = Math.max(patron.lastIndexOf('/'), patron.lastIndexOf('\\'));
  const prefijo = corte >= 0 ? patron.slice(0, corte + 1) : '';
  const nombre = corte >= 0 ? patron.slice(corte + 1) : patron;

  const dir = vfs.nodo(prefijo === '' ? vfs.cwd : vfs.segmentos(prefijo));
  if (!dir || !dir.esDir) return [patron];

  const regex = new RegExp('^' + nombre
    .replace(/[.+^${}()|\\]/g, '\\$&')
    .replace(/\*/g, '[^/\\\\]*')
    .replace(/\?/g, '.') + '$');

  const coincidencias = [...dir.hijos.values()]
    .filter(h => regex.test(h.nombre))
    .filter(h => nombre.startsWith('.') || !h.nombre.startsWith('.'))
    .map(h => prefijo + h.nombre)
    .sort((a, b) => a.localeCompare(b, 'es'));

  return coincidencias.length ? coincidencias : [patron];
}

/** Separa opciones (-l, --all, /S) de operandos, según el estilo. */
export function separarOpciones(args, estilo = 'posix') {
  const opciones = [];
  const operandos = [];
  for (const a of args) {
    if (estilo === 'posix' && a.startsWith('-') && a.length > 1) opciones.push(a);
    else if (estilo !== 'posix' && (a.startsWith('/') && a.length <= 4 && /^\/[A-Za-z?]+$/.test(a))) opciones.push(a);
    else if (estilo === 'powershell' && a.startsWith('-')) opciones.push(a);
    else operandos.push(a);
  }
  return { opciones, operandos };
}

/** Banderas cortas agrupadas: ['-la','-h'] → Set{'l','a','h'} */
export function banderas(opciones) {
  const set = new Set();
  const largas = new Set();
  for (const o of opciones) {
    if (o.startsWith('--')) largas.add(o.slice(2).toLowerCase());
    else if (o.startsWith('-')) for (const ch of o.slice(1)) set.add(ch);
    else if (o.startsWith('/')) largas.add(o.slice(1).toLowerCase());
  }
  return { cortas: set, largas };
}
