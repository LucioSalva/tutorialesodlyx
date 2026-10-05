/**
 * Academia de Inglés · Dónde está el audio de cada frase (módulo puro)
 * ---------------------------------------------------------------------
 * Cada frase tiene un archivo estable y predecible:
 *
 *   assets/ingles/audio/<acento>/<voz>/<h0h1>/<hash16>.mp3
 *
 * donde hash16 son los 16 primeros hex del SHA-1 del texto NORMALIZADO.
 * El mismo cálculo lo hacen el navegador (para pedir el archivo) y el
 * generador (tools/ingles/audio/, para crearlo), así que:
 *
 *   · la misma frase en dos páginas usa UN solo archivo;
 *   · si el texto cambia, cambia el hash y el recolector lo marca como
 *     pendiente (no se reproduce un audio viejo que ya no coincide);
 *   · si se cambia la voz de un rol en voces.json, cambia la carpeta y el
 *     audio anterior deja de usarse sin sobrescribirse.
 *
 * SHA-1 aquí es solo un nombre de archivo, no seguridad. Implementación
 * propia para no depender de crypto.subtle (que exige contexto seguro).
 */

/** Espacios, comillas tipográficas y forma Unicode: nada más. */
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFC')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sha1(mensaje) {
  const datos = new TextEncoder().encode(mensaje);
  const largo = datos.length;
  const total = ((largo + 9 + 63) >> 6) << 6;
  const b = new Uint8Array(total);
  b.set(datos);
  b[largo] = 0x80;
  const bits = largo * 8;
  const vista = new DataView(b.buffer);
  vista.setUint32(total - 4, bits >>> 0);
  vista.setUint32(total - 8, Math.floor(bits / 0x100000000));
  let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
  const w = new Uint32Array(80);
  const rotl = (x, n) => (x << n) | (x >>> (32 - n));
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = vista.getUint32(off + i * 4);
    for (let i = 16; i < 80; i++) w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    let a = h0, bb = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) {
      let f, k;
      if (i < 20) { f = (bb & c) | (~bb & d); k = 0x5A827999; }
      else if (i < 40) { f = bb ^ c ^ d; k = 0x6ED9EBA1; }
      else if (i < 60) { f = (bb & c) | (bb & d) | (c & d); k = 0x8F1BBCDC; }
      else { f = bb ^ c ^ d; k = 0xCA62C1D6; }
      const t = (rotl(a, 5) + f + e + k + w[i]) >>> 0;
      e = d; d = c; c = rotl(bb, 30) >>> 0; bb = a; a = t;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + bb) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }
  return [h0, h1, h2, h3, h4].map(x => x.toString(16).padStart(8, '0')).join('');
}

/** Voz de Kokoro para un acento y un rol, según voces.json. */
export function vozDe(config, acento, rol = 'n') {
  const roles = config?.acentos?.[acento]?.roles || {};
  return roles[rol] || roles.n || null;
}

/** Ruta relativa a assets/ingles/audio/ del clip de una frase. */
export function rutaClip(config, texto, acento, rol = 'n') {
  const voz = vozDe(config, acento, rol);
  if (!voz) return null;
  const h = sha1(normalizar(texto)).slice(0, 16);
  return `${acento}/${voz}/${h.slice(0, 2)}/${h}.mp3`;
}

/** Pistas completas (lecturas y escucha): una por recurso y acento. */
export function rutaPista(tipo, slug, acento) {
  return `${tipo}/${acento}/${slug}`; // + .mp3 y .json
}
