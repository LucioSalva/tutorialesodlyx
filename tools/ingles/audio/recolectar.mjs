/**
 * Academia de Inglés · recolector de frases con audio (desarrollo)
 * ---------------------------------------------------------------------
 * Construye el inventario EXACTO de lo que la academia hace sonar:
 *
 *   1. Recorre todas las páginas de /ingles en un servidor local y recoge
 *      cada botón [data-decir] que pinta PHP (con su data-rol).
 *   2. Aplica a los JSON las mismas reglas que usa la interfaz para los
 *      botones creados con JavaScript (public/assets/js/ingles/audio-textos.js).
 *   3. Define las pistas completas de lecturas y de escucha, frase a frase.
 *
 * Salida: tools/ingles/audio/corpus.json  → lo consume generar.py.
 *
 *   php -S 127.0.0.1:8765 -t public &
 *   node tools/ingles/audio/recolectar.mjs [http://127.0.0.1:8765]
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { textosEjercicio, asignarRoles, fijarPersonajes } from '../../../public/assets/js/ingles/audio-textos.js';
import { normalizar, rutaClip } from '../../../public/assets/js/ingles/audio-ruta.js';

const RAIZ = new URL('../../../', import.meta.url);
const DATOS = new URL('public/assets/ingles/data/', RAIZ);
const leer = (n) => JSON.parse(readFileSync(new URL(n, DATOS), 'utf8'));
const BASE = process.argv[2] || 'http://127.0.0.1:8765';
const config = JSON.parse(readFileSync(new URL('public/assets/ingles/audio/voces.json', RAIZ), 'utf8'));
fijarPersonajes(config);

const curso = leer('curso.json');
const unidades = readdirSync(new URL('unidades/', DATOS)).filter(f => f.endsWith('.json')).map(f => leer('unidades/' + f));
const vocab = leer('vocabulario.json');
const lecturas = leer('lecturas.json').lecturas;
const escucha = leer('escucha.json').audios;
const conversaciones = leer('conversaciones.json').escenarios;
const escritura = leer('escritura.json').tareas;
const juegos = leer('juegos.json').juegos;
const examenes = leer('examenes.json').examenes;
const pron = leer('pronunciacion.json');

/** clave = rol + texto normalizado; se guardan también las fuentes. */
const clips = new Map();
const anadir = (texto, rol, fuente) => {
  const t = normalizar(texto);
  if (!t || !/[a-z]/i.test(t)) return;
  const clave = rol + '|' + t;
  if (!clips.has(clave)) clips.set(clave, { texto: t, rol, fuentes: new Set() });
  clips.get(clave).fuentes.add(fuente);
};

// ------------------------------------------------ 1. páginas renderizadas
const paginas = ['/ingles', '/ingles/vocabulario', '/ingles/tarjetas', '/ingles/repaso', '/ingles/pronunciacion', '/ingles/practica', '/ingles/juegos', '/ingles/progreso', '/ingles/audio'];
for (const u of curso.unidades) {
  paginas.push(`/ingles/unidad/${u.slug}`, `/ingles/unidad/${u.slug}/evaluacion`);
  u.lecciones.forEach(l => paginas.push(`/ingles/leccion/${l.slug}`));
}
examenes.forEach(x => paginas.push(`/ingles/examen/${x.slug}`));
vocab.temas.forEach(t => paginas.push(`/ingles/vocabulario/${t.slug}`));
pron.secciones.forEach(s => paginas.push(`/ingles/pronunciacion/${s.slug}`));
lecturas.forEach(x => paginas.push(`/ingles/lecturas/${x.slug}`));
escucha.forEach(x => paginas.push(`/ingles/escucha/${x.slug}`));
conversaciones.forEach(x => paginas.push(`/ingles/conversaciones/${x.slug}`));
escritura.forEach(x => paginas.push(`/ingles/escritura/${x.slug}`));
juegos.forEach(x => paginas.push(`/ingles/juegos/${x.slug}`));

const entidades = (s) => s.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
let botones = 0;
for (const p of paginas) {
  const r = await fetch(BASE + p);
  if (r.status !== 200) throw new Error(`${p} → ${r.status}`);
  const html = await r.text();
  for (const m of html.matchAll(/<button[^>]*\sdata-decir="([^"]*)"[^>]*>/g)) {
    const etiqueta = m[0];
    if (/data-navegador/.test(etiqueta)) continue;
    const rol = (etiqueta.match(/data-rol="([^"]+)"/) || [, 'n'])[1];
    anadir(entidades(m[1]), rol, 'página ' + p);
    botones++;
  }
}

// ----------------------------------------------- 2. reglas de JavaScript
const ejercicios = [
  ...unidades.flatMap(u => [...u.lecciones.flatMap(l => l.ejercicios), ...u.evaluacion.preguntas]),
  ...examenes.flatMap(x => x.preguntas),
  ...lecturas.flatMap(x => x.preguntas),
  ...escucha.flatMap(x => x.preguntas),
  ...pron.secciones.flatMap(s => s.practica),
  ...escritura.map(t => ({ ...t, id: 'escritura.' + t.slug, tipo: 'escritura' })),
];
for (const ej of ejercicios) for (const { texto, rol } of textosEjercicio(ej)) anadir(texto, rol, 'ejercicio ' + ej.id);

for (const p of vocab.palabras) { anadir(p.en, 'n', 'palabra ' + p.id); anadir(p.ejemplo?.en, 'n', 'ejemplo ' + p.id); }

for (const s of conversaciones) {
  const roles = asignarRoles([...s.nodos.map(n => n.quien), 'Tú']);
  for (const n of s.nodos) {
    // Mismo hablante que la interfaz (conversacion.js): en el final, el personaje.
    const quien = n.fin ? (n.quien || s.personaje.split(/[,(]/)[0]) : n.quien;
    if (n.en) anadir(n.en, roles.get(quien) || 'n', `conversación ${s.slug}/${n.id}`);
    for (const r of n.respuestas || []) if (r.correcta) anadir(r.texto, roles.get('Tú'), `conversación ${s.slug}/${n.id} (tú)`);
    if (n.escribir?.respuestas?.[0]) anadir(n.escribir.respuestas[0], roles.get('Tú'), `conversación ${s.slug}/${n.id} (tú, escrita)`);
  }
}

const reto = (r, fuente) => { if (r.linea) anadir(r.linea.en, asignarRoles([r.linea.quien]).get(r.linea.quien), fuente); };
for (const j of juegos) for (const n of j.niveles) {
  const f = `juego ${j.slug}/${n.id}`;
  for (const r of Array.isArray(n.rondas) ? n.rondas : []) {
    if (j.slug === 'ordena-la-oracion') anadir(r.respuesta, 'n', f);
    if (j.slug === 'encuentra-el-error') anadir(r.frase.replace(r.error, r.correccion), 'n', f);
    if (j.slug === 'detective-gramatical') anadir(r.frase, 'n', f);
    if (j.slug === 'construye-la-pregunta') { anadir(r.afirmacion, 'n', f); anadir(r.respuestas[0], 'n', f); }
    if (j.slug === 'desafio-de-tiempos') anadir(r.frase.replace('___', r.correcta), 'n', f);
    if (j.slug === 'completa-el-dialogo') {
      const roles = asignarRoles(r.lineas.filter(l => l.en !== '___').map(l => l.quien));
      r.lineas.forEach(l => { if (l.en !== '___') anadir(l.en, roles.get(l.quien), f); });
    }
  }
  for (const p of n.pares || []) { anadir(p.a, 'n', f); anadir(p.b, 'n', f); }
  for (const pa of n.paradas || []) for (const r of pa.retos) reto(r, f);
  for (const c of n.capitulos || []) { anadir(c.narracion, 'n', f); for (const r of c.retos) reto(r, f); }
}

// --------------------------------------------------- 3. pistas completas
/**
 * Frases de un párrafo, como subcadenas EXACTAS (para resaltarlas en la
 * página). No se corta tras Mr./Mrs./Ms./Dr./St. ni en «a.m.»/«p.m.».
 */
export function frases(parrafo) {
  const t = parrafo.trim();
  const salida = [];
  const re = /[.!?]+["')\]]*(?=\s+["'(]?[A-Z0-9])/g;
  let inicio = 0, m;
  while ((m = re.exec(t))) {
    const fin = m.index + m[0].length;
    const previo = t.slice(Math.max(0, m.index - 4), m.index + 1);
    if (/\b(Mr|Mrs|Ms|Dr|St|Jr|Sr)\.$|\b[ap]\.m\.$|\b[A-Z]\.$/.test(previo)) continue;
    salida.push(t.slice(inicio, fin).trim());
    inicio = fin;
  }
  if (inicio < t.length) salida.push(t.slice(inicio).trim());
  return salida.filter(Boolean);
}

const pistas = [];
for (const l of lecturas) {
  pistas.push({
    tipo: 'lecturas', slug: l.slug,
    segmentos: l.parrafos.flatMap((p, i) => frases(p.en).map(texto => ({ parrafo: i, texto, rol: 'n' }))),
  });
}
for (const a of escucha) {
  const roles = asignarRoles(a.lineas.map(x => x.quien));
  pistas.push({
    tipo: 'escucha', slug: a.slug,
    segmentos: a.lineas.map((x, i) => ({ linea: i, texto: x.en, rol: roles.get(x.quien) || 'n' })),
  });
}
for (const p of pistas) for (const s of p.segmentos) anadir(s.texto, s.rol, `pista ${p.tipo}/${p.slug}`);

// -------------------------------------------------------------- salida
const lista = [...clips.values()].map(c => ({
  texto: c.texto, rol: c.rol,
  rutas: Object.fromEntries(Object.keys(config.acentos).map(a => [a, rutaClip(config, c.texto, a, c.rol)])),
  fuentes: [...c.fuentes].slice(0, 5), usos: c.fuentes.size,
}));
const corpus = { generado: new Date().toISOString(), voces: config.acentos, clips: lista, pistas };
writeFileSync(new URL('corpus.json', import.meta.url), JSON.stringify(corpus, null, 1));
const caracteres = lista.reduce((s, c) => s + c.texto.length, 0);
const porRol = lista.reduce((o, c) => ({ ...o, [c.rol]: (o[c.rol] || 0) + 1 }), {});
console.log(`${paginas.length} páginas · ${botones} botones en HTML · ${lista.length} clips únicos (${caracteres} caracteres por acento) · por voz: ${JSON.stringify(porRol)} · ${pistas.length} pistas completas`);
