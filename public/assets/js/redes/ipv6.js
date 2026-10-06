/**
 * Academia de Redes · Direcciones IPv6 y MAC
 * ---------------------------------------------------------------------
 * Funciones puras, sin DOM, igual que ip.js. Una dirección IPv6 es siempre
 * un arreglo de 8 grupos (enteros de 16 bits) y una MAC, uno de 6 bytes.
 */

const HEX4 = /^[0-9a-f]{1,4}$/i;

/** "2001:db8::1" → [0x2001, 0xdb8, 0, 0, 0, 0, 0, 1], o null si no es una IPv6 válida. */
export function grupos(texto) {
  const t = String(texto ?? '').trim().toLowerCase();
  if (t === '' || /[^0-9a-f:]/.test(t)) return null;
  const partes = t.split('::');
  if (partes.length > 2) return null;
  const lado = (s) => (s === '' ? [] : s.split(':'));
  const izq = lado(partes[0]);
  const der = partes.length === 2 ? lado(partes[1]) : [];
  if (![...izq, ...der].every((g) => HEX4.test(g))) return null;
  if (partes.length === 1) return izq.length === 8 ? izq.map((g) => parseInt(g, 16)) : null;
  const faltan = 8 - izq.length - der.length;
  if (faltan < 1) return null;
  return [...izq, ...Array(faltan).fill('0'), ...der].map((g) => parseInt(g, 16));
}

/** Acepta texto o grupos y devuelve grupos (lanza si el texto no es válido). */
export function ip6(v) {
  if (Array.isArray(v)) return v;
  const g = grupos(v);
  if (!g) throw new Error('IPv6 no válida: ' + v);
  return g;
}

/** Forma completa: 8 grupos de 4 dígitos. */
export const larga = (g) => g.map((x) => x.toString(16).padStart(4, '0')).join(':');

/** Solo sin ceros a la izquierda (regla 1), sin usar «::». */
export const sinCeros = (g) => g.map((x) => x.toString(16)).join(':');

/** La racha de grupos en cero más larga (de 2 o más): { i, n } o null. Si empatan, la primera. */
export function rachaDeCeros(g) {
  let mejor = null;
  for (let i = 0; i < 8; i++) {
    if (g[i] !== 0) continue;
    let n = 0;
    while (i + n < 8 && g[i + n] === 0) n++;
    if (n >= 2 && (!mejor || n > mejor.n)) mejor = { i, n };
    i += n;
  }
  return mejor;
}

/** Forma abreviada canónica (RFC 5952): minúsculas, sin ceros a la izquierda y «::» en la racha más larga. */
export function corta(g) {
  const r = rachaDeCeros(g);
  const hex = g.map((x) => x.toString(16));
  if (!r) return hex.join(':');
  return hex.slice(0, r.i).join(':') + '::' + hex.slice(r.i + r.n).join(':');
}

/** Texto → forma abreviada canónica, o null. */
export const canon = (texto) => { const g = grupos(texto); return g ? corta(g) : null; };

/** Deja en cero los bits que quedan fuera del prefijo p (0–128). */
export function prefijo6(g, p) {
  return g.map((x, i) => {
    const bits = Math.max(0, Math.min(16, p - i * 16));
    return bits === 0 ? 0 : (x & ((0xFFFF << (16 - bits)) & 0xFFFF));
  });
}

/**
 * Tipo de dirección por sus primeros bits:
 * 'sin-especificar' (::), 'loopback' (::1), 'link-local' (fe80::/10), 'unica-local' (fc00::/7),
 * 'multicast' (ff00::/8), 'documentacion' (2001:db8::/32), 'global' (2000::/3) u 'otra'.
 */
export function tipo6(g) {
  if (g.every((x) => x === 0)) return 'sin-especificar';
  if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return 'loopback';
  if ((g[0] & 0xFFC0) === 0xFE80) return 'link-local';
  if ((g[0] & 0xFE00) === 0xFC00) return 'unica-local';
  if ((g[0] & 0xFF00) === 0xFF00) return 'multicast';
  if (g[0] === 0x2001 && g[1] === 0x0DB8) return 'documentacion';
  if ((g[0] & 0xE000) === 0x2000) return 'global';
  return 'otra';
}

/** "00:1A:2b:3c:4d:5e", "00-1a-…" o "001a.2b3c.4d5e" → 6 bytes, o null. */
export function mac(texto) {
  const t = String(texto ?? '').trim().toLowerCase();
  if (!/^([0-9a-f]{2}([:-]?)){5}[0-9a-f]{2}$/.test(t) && !/^[0-9a-f]{4}\.[0-9a-f]{4}\.[0-9a-f]{4}$/.test(t)) return null;
  const hex = t.replace(/[^0-9a-f]/g, '');
  return hex.length === 12 ? hex.match(/../g).map((b) => parseInt(b, 16)) : null;
}

const h2 = (b) => b.toString(16).padStart(2, '0');
/** Bytes → texto. estilo: ':' (00:1a:2b:3c:4d:5e), '-' (00-1A-2B-3C-4D-5E, Windows) o '.' (001a.2b3c.4d5e, Cisco). */
export function macTexto(bytes, estilo = ':') {
  if (estilo === '.') return [0, 2, 4].map((i) => h2(bytes[i]) + h2(bytes[i + 1])).join('.');
  if (estilo === '-') return bytes.map(h2).join('-').toUpperCase();
  return bytes.map(h2).join(':');
}

/** ID de interfaz EUI-64 a partir de una MAC: inserta ff:fe en medio e invierte el bit U/L. Devuelve 4 grupos. */
export function eui64(bytes) {
  const b = [bytes[0] ^ 0x02, bytes[1], bytes[2], 0xFF, 0xFE, bytes[3], bytes[4], bytes[5]];
  return [0, 2, 4, 6].map((i) => (b[i] << 8) | b[i + 1]);
}
