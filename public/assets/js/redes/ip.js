/**
 * Academia de Redes · Aritmética IPv4
 * ---------------------------------------------------------------------
 * Funciones puras, sin DOM: las usan el navegador (ejercicios, calculadora)
 * y las herramientas de desarrollo (construcción de lecciones y pruebas).
 * Una dirección es siempre un entero sin signo de 32 bits; solo se pasa a
 * texto al mostrarla. Todo cálculo del módulo sale de aquí, así que una
 * lección y la corrección de su ejercicio no pueden discrepar.
 */

/** "192.168.1.10" → entero de 32 bits, o null si no es una IPv4 válida. */
export function aEntero(texto) {
  const m = /^\s*(\d{1,3})\s*\.\s*(\d{1,3})\s*\.\s*(\d{1,3})\s*\.\s*(\d{1,3})\s*$/.exec(String(texto ?? ''));
  if (!m) return null;
  const o = m.slice(1).map(Number);
  if (o.some((x) => x > 255)) return null;
  return ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
}

export const octetos = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
export const aTexto = (n) => octetos(n >>> 0).join('.');

/** Acepta entero o texto y devuelve entero (lanza si el texto no es una IP). */
export function ip(v) {
  if (typeof v === 'number') return v >>> 0;
  const n = aEntero(v);
  if (n === null) throw new Error('IP no válida: ' + v);
  return n;
}

export const mascara = (p) => (p <= 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0);
export const wildcard = (p) => (~mascara(p)) >>> 0;

/** Máscara (entero) → prefijo, o null si los unos no son contiguos. */
export function prefijoDe(m) {
  for (let p = 0; p <= 32; p++) if (mascara(p) === (m >>> 0)) return p;
  return null;
}

export const red = (d, p) => (d & mascara(p)) >>> 0;
export const broadcast = (d, p) => (red(d, p) | wildcard(p)) >>> 0;
/** Direcciones totales del bloque. */
export const tamano = (p) => 2 ** (32 - p);
/** Hosts asignables: /31 tiene 2 (enlaces punto a punto, RFC 3021) y /32 tiene 1. */
export const hostsUtiles = (p) => (p >= 31 ? (p === 31 ? 2 : 1) : tamano(p) - 2);

export const bin8 = (o) => o.toString(2).padStart(8, '0');
export const binario = (n) => octetos(n >>> 0).map(bin8).join('.');

/** Miles con coma, sin depender de la configuración regional del equipo. */
export const miles = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * Octeto «interesante»: el único donde la máscara no vale 0 ni 255.
 * Devuelve { i (0–3), valor de la máscara en ese octeto, bloque = 256 − valor }.
 * Si el prefijo cae justo en un límite de octeto no hay ninguno: null.
 */
export function octetoInteresante(p) {
  if (p % 8 === 0) return null;
  const i = Math.floor(p / 8);
  const valor = octetos(mascara(p))[i];
  return { i, valor, bloque: 256 - valor };
}

export function analizar(d, p) {
  const r = red(d, p);
  const b = broadcast(d, p);
  const normal = p <= 30;
  return {
    ip: d >>> 0, p, mascara: mascara(p), wildcard: wildcard(p), red: r, broadcast: b,
    primero: normal ? r + 1 : r, ultimo: normal ? b - 1 : b,
    total: tamano(p), hosts: hostsUtiles(p),
  };
}

/** Prefijo más largo (bloque más pequeño) que da al menos h hosts asignables. */
export function prefijoParaHosts(h) {
  let bits = 2;
  while (2 ** bits - 2 < h) bits++;
  return 32 - bits;
}

export function clase(d) {
  const o = d >>> 24;
  if (o < 128) return 'A';
  if (o < 192) return 'B';
  if (o < 224) return 'C';
  if (o < 240) return 'D';
  return 'E';
}

const dentro = (d, base, p) => red(d, p) === ip(base);

/** 'privada' | 'loopback' | 'apipa' | 'publica' (suficiente para el curso). */
export function ambito(d) {
  if (dentro(d, '10.0.0.0', 8) || dentro(d, '172.16.0.0', 12) || dentro(d, '192.168.0.0', 16)) return 'privada';
  if (dentro(d, '127.0.0.0', 8)) return 'loopback';
  if (dentro(d, '169.254.0.0', 16)) return 'apipa';
  return 'publica';
}

/** ¿El bloque a/pa contiene entero al bloque b/pb? */
export const contiene = (a, pa, b, pb) => pa <= pb && red(b, pa) === red(a, pa);

/**
 * VLSM: reparte base/p entre los requisitos [{ nombre, hosts }] de mayor a
 * menor (los empates conservan su orden). Devuelve { filas, libre, sobran }
 * o null si no caben.
 */
export function vlsm(base, p, requisitos) {
  const orden = requisitos.map((r, i) => ({ ...r, i })).sort((a, b) => b.hosts - a.hosts || a.i - b.i);
  const fin = red(base, p) + tamano(p);
  let cursor = red(base, p);
  const filas = [];
  for (const r of orden) {
    const pr = prefijoParaHosts(r.hosts);
    const t = tamano(pr);
    if (cursor + t > fin) return null;
    filas.push({ ...analizar(cursor, pr), nombre: r.nombre, pedidos: r.hosts, bloque: t });
    cursor += t;
  }
  return { filas, libre: cursor < fin ? cursor : null, sobran: fin - cursor };
}

/**
 * Ruta resumen: el bloque más pequeño que contiene todas las redes dadas.
 * `exacta` indica si el resumen cubre solo esas redes (sin direcciones de más).
 */
export function resumen(redes) {
  const lista = redes.map((r) => ({ red: red(ip(r.ip), r.p), p: r.p }));
  const min = Math.min(...lista.map((r) => r.red));
  const max = Math.max(...lista.map((r) => broadcast(r.red, r.p)));
  let p = Math.min(...lista.map((r) => r.p));
  while (p > 0 && red(min, p) !== red(max, p)) p--;
  const unicas = [...new Map(lista.map((r) => [r.red + '/' + r.p, r])).values()]
    .filter((r, _, todas) => !todas.some((o) => o !== r && contiene(o.red, o.p, r.red, r.p)));
  const cubierto = unicas.reduce((s, r) => s + tamano(r.p), 0);
  return { red: red(min, p), p, min, max, exacta: cubierto === tamano(p) };
}
