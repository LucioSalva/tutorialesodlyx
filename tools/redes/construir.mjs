// Academia de Redes · construye public/assets/redes/data/ desde tools/redes/contenido/.
//   node tools/redes/construir.mjs
// Los ejemplos resueltos se calculan con el motor del navegador (js/redes/motor.js) y cada
// ejercicio de lección se resuelve aquí una vez: si un dato no es válido, la construcción falla.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolver, respuestaDe, NIVELES } from '../../public/assets/js/redes/motor.js';

const DESTINO = fileURLToPath(new URL('../../public/assets/redes/data/', import.meta.url));
const MODULOS = ['subneteo', 'vlans'];
const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const errores = [];
const curso = { modulos: [] };

for (const nombre of MODULOS) {
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
          const e = resolver(b.spec);
          return { t: 'ejemplo', nivel: b.nivel, titulo: b.titulo, enunciado: e.enunciado, ...(e.tabla ? { tabla: e.tabla } : {}), pasos: e.pasos,
            respuesta: e.campos.map((c) => [c.etiqueta, respuestaDe(c)]), ...(b.cierre ? { cierre: b.cierre } : {}) };
        } catch (e) { errores.push(`${donde}: ejemplo «${b.titulo}»: ${e.message}`); return b; }
      }
      if (b.t === 'ejercicios') {
        b.items.forEach((spec, i) => {
          practicos++;
          try {
            const e = resolver(spec);
            if (spec.tipo === 'opcion' && !(spec.correcta >= 0 && spec.correcta < spec.opciones.length)) throw new Error('índice de respuesta fuera de rango');
            if (!e.campos.length) throw new Error('sin campos');
          } catch (e) { errores.push(`${donde}: ejercicio ${i + 1} de «${b.titulo}» ${JSON.stringify(spec).slice(0, 90)}: ${e.message}`); }
        });
      }
      return b;
    });
    if (salida[l.slug]) errores.push(`${nombre}: slug de lección repetido ${l.slug}`);
    salida[l.slug] = { titulo: l.titulo, objetivos: l.objetivos ?? [], bloques };
    indice.push({ slug: l.slug, titulo: l.titulo, resumen: l.resumen, nivel: l.nivel, ejemplos, ejercicios: practicos });
  }
  curso.modulos.push({ ...meta, estado: lecciones.length ? 'disponible' : 'proximamente',
    niveles: (NIVELES[nombre] ?? []).map(({ n, nombre: nom, resumen }) => ({ n, nombre: nom, resumen })), lecciones: indice });
  if (lecciones.length) writeFileSync(`${DESTINO}${nombre}.json`, JSON.stringify({ lecciones: salida }));
  const ej = indice.reduce((s, x) => s + x.ejercicios, 0), ex = indice.reduce((s, x) => s + x.ejemplos, 0);
  console.log(`${nombre}: ${indice.length} lecciones, ${ex} ejemplos resueltos, ${ej} ejercicios`);
}

if (errores.length) { console.error('\nERRORES:\n' + errores.join('\n')); process.exit(1); }
writeFileSync(`${DESTINO}curso.json`, JSON.stringify(curso));
console.log('curso.json escrito.');
