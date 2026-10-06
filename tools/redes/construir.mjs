// Academia de Redes · construye public/assets/redes/data/ desde tools/redes/contenido/.
//   node tools/redes/construir.mjs                 construye todo
//   node tools/redes/construir.mjs --solo medios   valida un módulo (lecciones y banco) sin escribir nada
// Los ejemplos resueltos se calculan con el motor del navegador (js/redes/motor.js) y cada
// ejercicio de lección se resuelve aquí una vez: si un dato no es válido, la construcción falla.
import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolver, respuestaDe, NIVELES } from '../../public/assets/js/redes/motor.js';

const DESTINO = fileURLToPath(new URL('../../public/assets/redes/data/', import.meta.url));
const ORIGEN = fileURLToPath(new URL('./contenido/', import.meta.url));
// En el orden en que se estudian.
const TODOS = ['fundamentos', 'medios', 'subneteo', 'direccionamiento', 'infraestructura', 'vlans', 'diagnostico', 'seguridad'];
const solo = process.argv.includes('--solo') ? process.argv[process.argv.indexOf('--solo') + 1] : null;
if (solo && !TODOS.includes(solo)) { console.error('Módulo desconocido: ' + solo); process.exit(1); }
const MODULOS = solo ? [solo] : TODOS;
const MIN_BANCO = 8;   // preguntas mínimas por nivel que usa el banco
const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const errores = [];
const curso = { modulos: [] };

/** Resuelve un ejercicio escrito a mano y comprueba que esté bien formado. */
function validar(spec) {
  const e = resolver(spec);
  if (!e.campos.length) throw new Error('sin campos');
  if (!e.pasos.length || e.pasos.some((x) => !x.t)) throw new Error('sin explicación (porque o pasos)');
  if (spec.tipo === 'opcion' && !(Number.isInteger(spec.correcta) && spec.correcta >= 0 && spec.correcta < spec.opciones.length)) throw new Error('índice de respuesta fuera de rango');
  if (spec.tipo === 'opcion' && new Set(spec.opciones).size !== spec.opciones.length) throw new Error('opciones repetidas');
  if (spec.tipo === 'varias') {
    if (new Set(spec.opciones).size !== spec.opciones.length) throw new Error('opciones repetidas');
    if (spec.correctas.length < 2 || spec.correctas.length >= spec.opciones.length || new Set(spec.correctas).size !== spec.correctas.length
      || spec.correctas.some((c) => !(Number.isInteger(c) && c >= 0 && c < spec.opciones.length))) throw new Error('correctas no válidas');
  }
  if (spec.tipo === 'relacionar' && new Set(spec.pares.map(([i]) => i)).size !== spec.pares.length) throw new Error('conceptos repetidos');
  if (spec.tipo === 'ordenar' && new Set(spec.orden).size !== spec.orden.length) throw new Error('elementos repetidos');
  if (/undefined|NaN|\[object/.test(JSON.stringify(e))) throw new Error('texto roto');
  return e;
}

/**
 * Las preguntas de lección no se barajan al mostrarse, así que aquí se reparte la posición de la
 * respuesta correcta: una permutación fija por enunciado (la misma en cada construcción).
 * Se respetan las listas ordenadas de números (/24, /25, /26…) y las marcadas con `fijas`.
 */
function repartir(spec) {
  if ((spec.tipo !== 'opcion' && spec.tipo !== 'varias') || spec.fijas) return spec;
  const num = spec.opciones.map((o) => Number(String(o).replace(/[^0-9.]/g, '')));
  const numerica = spec.opciones.every((o) => /^[^a-záéíóúñ]*$/i.test(String(o).replace(/\b(mbps|gbps|mb|gb|ms|bits?|w|m|s|ghz|mhz|hosts?)\b/gi, '')));
  if (numerica && (num.every((x, i) => i === 0 || x > num[i - 1]) || num.every((x, i) => i === 0 || x < num[i - 1]))) return spec;
  let h = [...spec.pregunta, ...spec.opciones.join('|')].reduce((a, c) => (Math.imul(a, 31) + c.codePointAt(0)) >>> 0, 7);
  const rng = () => { h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9E3779B9) >>> 0; return h / 4294967296; };
  const orden = spec.opciones.map((_, i) => i);
  for (let i = orden.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [orden[i], orden[j]] = [orden[j], orden[i]]; }
  const opciones = orden.map((i) => spec.opciones[i]);
  return spec.tipo === 'opcion' ? { ...spec, opciones, correcta: orden.indexOf(spec.correcta) }
    : { ...spec, opciones, correctas: spec.correctas.map((c) => orden.indexOf(c)).sort((x, y) => x - y) };
}

for (const nombre of MODULOS) {
  if (!existsSync(`${ORIGEN}${nombre}.mjs`)) { console.log(`${nombre}: sin contenido todavía`); continue; }
  const { default: m } = await import(`./contenido/${nombre}.mjs`);
  const { lecciones = [], ...meta } = m;
  const salida = {};
  const indice = [];
  for (const l of lecciones) {
    let ejemplos = 0, practicos = 0;
    const ids = new Set();
    const bloques = l.bloques.map((b) => {
      const donde = `${nombre}/${l.slug}`;
      if (b.t === 'h') {
        let id = slug(b.texto);
        while (ids.has(id)) id += '-2';
        ids.add(id);
        return { ...b, id };
      }
      if (b.t === 'ejemplo') {
        ejemplos++;
        try {
          const e = validar(b.spec);
          return { t: 'ejemplo', nivel: b.nivel, titulo: b.titulo, enunciado: e.enunciado, ...(e.figura ? { figura: e.figura } : {}), ...(e.codigo ? { codigo: e.codigo } : {}), ...(e.tabla ? { tabla: e.tabla } : {}), pasos: e.pasos,
            respuesta: e.campos.map((c) => [c.etiqueta, respuestaDe(c)]), ...(b.cierre ? { cierre: b.cierre } : {}) };
        } catch (e) { errores.push(`${donde}: ejemplo «${b.titulo}»: ${e.message}`); return b; }
      }
      if (b.t === 'ejercicios') {
        b = { ...b, items: b.items.map(repartir) };
        b.items.forEach((spec, i) => {
          practicos++;
          try {
            validar(spec);
          } catch (e) { errores.push(`${donde}: ejercicio ${i + 1} de «${b.titulo}» ${JSON.stringify(spec).slice(0, 90)}: ${e.message}`); }
        });
      }
      return b;
    });
    if (salida[l.slug]) errores.push(`${nombre}: slug de lección repetido ${l.slug}`);
    salida[l.slug] = { titulo: l.titulo, objetivos: l.objetivos ?? [], bloques };
    indice.push({ slug: l.slug, titulo: l.titulo, resumen: l.resumen, nivel: l.nivel, ejemplos, ejercicios: practicos });
  }
  // Banco de preguntas tipo examen (opcional): { nivel: [spec, …] }.
  let banco = null;
  if (existsSync(`${ORIGEN}banco-${nombre}.mjs`)) {
    banco = (await import(`./contenido/banco-${nombre}.mjs`)).default;
    const vistas = new Set();
    for (const [nivel, lista] of Object.entries(banco)) lista.forEach((spec, i) => {
      try {
        validar(spec);
        if (!['opcion', 'varias', 'relacionar', 'ordenar'].includes(spec.tipo)) throw new Error('el banco solo admite opcion, varias, relacionar y ordenar');
        if (vistas.has(spec.pregunta)) throw new Error('pregunta repetida en el banco');
        vistas.add(spec.pregunta);
      } catch (e) { errores.push(`banco-${nombre} nivel ${nivel}, pregunta ${i + 1} «${String(spec.pregunta).slice(0, 60)}»: ${e.message}`); }
    });
  }
  for (const nv of NIVELES[nombre] ?? []) {
    const usa = nv.tipos.some(([t]) => t === 'banco');
    const hay = banco?.[nv.n]?.length ?? 0;
    if (usa && hay < MIN_BANCO) errores.push(`${nombre}: el nivel ${nv.n} usa el banco y solo hay ${hay} preguntas (mínimo ${MIN_BANCO})`);
    if (!usa && hay) errores.push(`${nombre}: el banco tiene preguntas de nivel ${nv.n}, pero ese nivel no incluye ['banco', peso]`);
  }
  for (const x of meta.examenes ?? []) for (const n of x.niveles) if (!(NIVELES[nombre] ?? []).some((nv) => nv.n === n)) errores.push(`${nombre}: el examen ${x.id} usa el nivel ${n}, que no existe`);
  if (lecciones.length && !(NIVELES[nombre] ?? []).length) errores.push(`${nombre}: faltan los niveles de práctica (niveles() en tipos-${nombre}.js)`);
  const enBanco = banco ? Object.values(banco).reduce((s, l) => s + l.length, 0) : 0;
  if (banco && !solo) writeFileSync(`${DESTINO}banco-${nombre}.json`, JSON.stringify(banco));
  curso.modulos.push({ ...meta, ...(banco ? { banco: true, preguntas: enBanco } : {}), estado: lecciones.length ? 'disponible' : 'proximamente',
    niveles: (NIVELES[nombre] ?? []).map(({ n, nombre: nom, resumen }) => ({ n, nombre: nom, resumen })), lecciones: indice });
  if (lecciones.length && !solo) writeFileSync(`${DESTINO}${nombre}.json`, JSON.stringify({ lecciones: salida }));
  const ej = indice.reduce((s, x) => s + x.ejercicios, 0), ex = indice.reduce((s, x) => s + x.ejemplos, 0);
  console.log(`${nombre}: ${indice.length} lecciones, ${ex} ejemplos resueltos, ${ej} ejercicios, ${enBanco} preguntas de banco`);
}

// Guía de la certificación: cada objetivo apunta a lecciones que deben existir.
if (!solo && existsSync(`${ORIGEN}certificacion.mjs`)) {
  const { default: cert } = await import('./contenido/certificacion.mjs');
  const mod = (s) => curso.modulos.find((x) => x.slug === s);
  for (const d of cert.dominios) for (const o of d.objetivos) {
    o.lecciones = o.lecciones.map(([m, s]) => {
      const l = mod(m)?.lecciones.find((x) => x.slug === s);
      if (!l) errores.push(`certificación ${o.id}: no existe la lección ${m}/${s}`);
      return { modulo: m, slug: s, titulo: l ? `${mod(m).titulo}: ${l.titulo}` : s };
    });
  }
  for (const r of cert.ruta) if (!mod(r.modulo)) errores.push(`certificación: la ruta nombra el módulo ${r.modulo}, que no existe`);
  for (const x of cert.examenes) for (const parte of x.partes) for (const n of parte.niveles) {
    if (!(NIVELES[parte.modulo] ?? []).some((nv) => nv.n === n)) errores.push(`certificación: el simulacro ${x.id} usa ${parte.modulo} nivel ${n}, que no existe`);
  }
  curso.certificacion = cert;
}

if (errores.length) { console.error('\nERRORES:\n' + errores.join('\n')); process.exit(1); }
if (solo) { console.log('Validación correcta (no se escribió nada).'); process.exit(0); }
writeFileSync(`${DESTINO}curso.json`, JSON.stringify(curso));
console.log('curso.json escrito.');
