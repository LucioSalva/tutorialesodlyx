// Recorre TODO el contenido y pasa cada ejercicio por el evaluador real:
//   · toda respuesta declarada como válida debe ser aceptada;
//   · todo error típico declarado debe ser RECHAZADO (si no, la clave es una respuesta válida);
//   · el origen de un «transformar» no puede ser ya la respuesta;
//   · la frase de un «corregir» no puede ser ya correcta.
// Ejecutar: node tools/ingles/tests/datos.test.mjs [slug-de-unidad]
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { evaluar } from '../../../public/assets/js/ingles/evaluador.js';
import { coincide, canonica } from '../../../public/assets/js/ingles/texto.js';

const DATOS = new URL('../../../public/assets/ingles/data/', import.meta.url);
const leer = (n) => JSON.parse(readFileSync(new URL(n, DATOS), 'utf8'));
const filtro = process.argv[2] || null;

const errores = [];
let revisados = 0;
const mal = (id, msg) => errores.push(`${id}: ${msg}`);

function revisar(ej, donde) {
  const id = `${donde} ${ej.id || ''}`;
  revisados++;
  const lit = { literal: ej.literal === true };
  const tipicos = Object.keys(ej.errores_tipicos || {});
  switch (ej.tipo) {
    case 'opcion':
    case 'conversacion': {
      const i = (ej.opciones || []).findIndex(o => o.correcta);
      if (i < 0 || !evaluar(ej, i).correcto) mal(id, 'la opción correcta no se acepta');
      break;
    }
    case 'completar': {
      (ej.respuestas || []).forEach((lista, h) => lista.forEach(r => {
        const intento = ej.respuestas.map((l, k) => (k === h ? r : l[0]));
        if (!evaluar(ej, intento).correcto) mal(id, `respuesta «${r}» del hueco ${h} no se acepta`);
      }));
      for (const k of tipicos) {
        const partes = k.split(' | ');
        if (evaluar(ej, partes).correcto) mal(id, `el error típico «${k}» se acepta como correcto`);
      }
      if (ej.banco) {
        const n = (ej.respuestas || []).length;
        if (n === 1) {
          const buenas = ej.banco.filter(b => evaluar(ej, [b]).correcto);
          if (buenas.length === 0) mal(id, 'ninguna palabra del banco es correcta');
        }
      }
      break;
    }
    case 'ordenar':
      for (const r of ej.respuestas || []) if (!evaluar(ej, r).correcto) mal(id, `«${r}» no se acepta`);
      for (const k of tipicos) if (evaluar(ej, k).correcto) mal(id, `error típico «${k}» aceptado`);
      break;
    case 'traducir':
    case 'transformar':
      for (const r of ej.respuestas || []) if (!evaluar(ej, r).correcto) mal(id, `«${r}» no se acepta`);
      for (const k of tipicos) if (evaluar(ej, k).correcto) mal(id, `error típico «${k}» aceptado`);
      if (ej.tipo === 'transformar' && coincide(ej.origen, ej.respuestas, lit)) mal(id, 'el origen ya es una respuesta válida');
      break;
    case 'dictado':
      if (!evaluar(ej, ej.texto).correcto) mal(id, 'el propio texto no se acepta');
      break;
    case 'corregir': {
      if (!evaluar(ej, { seleccion: ej.error, correccion: ej.correcciones?.[0] }).correcto) mal(id, 'la corrección declarada no se acepta');
      if (canonica(ej.frase) === canonica(ej.frase_correcta)) mal(id, 'la frase «incorrecta» es igual a la correcta');
      // la frase corregida debe contener la corrección
      const fc = canonica(ej.frase_correcta);
      if (!ej.correcciones.some(c => fc.includes(canonica(c)))) mal(id, 'frase_correcta no contiene ninguna de las correcciones');
      break;
    }
    case 'relacionar': {
      const r = Object.fromEntries((ej.pares || []).map(p => [p.a, p.b]));
      if (!evaluar(ej, r).correcto) mal(id, 'las parejas no se aceptan');
      break;
    }
    default: break;
  }
}

// ----- unidades
const dirUnidades = new URL('unidades/', DATOS);
const archivos = existsSync(dirUnidades) ? readdirSync(dirUnidades).filter(f => f.endsWith('.json')) : [];
for (const f of archivos) {
  const u = JSON.parse(readFileSync(new URL(f, dirUnidades), 'utf8'));
  if (filtro && u.slug !== filtro) continue;
  for (const l of u.lecciones || []) for (const e of l.ejercicios || []) revisar(e, `${u.slug}/${l.slug}`);
  for (const e of u.evaluacion?.preguntas || []) revisar(e, `${u.slug}/evaluación`);
}

// ----- complementarios
if (!filtro) {
  const opcional = (n) => { try { return leer(n); } catch { return null; } };
  const lect = opcional('lecturas.json');
  for (const l of lect?.lecturas || []) for (const e of l.preguntas || []) revisar(e, `lectura/${l.slug}`);
  const esc = opcional('escucha.json');
  for (const a of esc?.audios || []) for (const e of a.preguntas || []) revisar(e, `escucha/${a.slug}`);
  const pron = opcional('pronunciacion.json');
  for (const s of pron?.secciones || []) for (const e of s.practica || []) revisar(e, `pronunciación/${s.slug}`);
  const ex = opcional('examenes.json');
  for (const x of ex?.examenes || []) for (const e of x.preguntas || []) revisar(e, `examen/${x.slug}`);

  const conv = opcional('conversaciones.json');
  for (const s of conv?.escenarios || []) for (const n of s.nodos || []) {
    if (n.escribir) {
      const ej = { tipo: 'traducir', respuestas: n.escribir.respuestas };
      for (const r of n.escribir.respuestas) if (!evaluar(ej, r).correcto) mal(`conversación/${s.slug}/${n.id}`, `«${r}» no se acepta`);
      for (const r of n.respuestas || []) {
        if (!r.correcta && coincide(r.texto, n.escribir.respuestas)) mal(`conversación/${s.slug}/${n.id}`, `la opción incorrecta «${r.texto}» coincide con una respuesta escrita válida`);
      }
    }
  }

  const juegos = opcional('juegos.json');
  for (const j of juegos?.juegos || []) for (const n of j.niveles || []) {
    const donde = `juego/${j.slug}/${n.id}`;
    for (const r of (Array.isArray(n.rondas) ? n.rondas : [])) {
      if (j.slug === 'construye-la-pregunta') {
        const ej = { tipo: 'transformar', origen: r.afirmacion, respuestas: r.respuestas };
        revisar(ej, donde);
      }
      if (j.slug === 'ordena-la-oracion') {
        const ej = { tipo: 'ordenar', respuestas: [r.respuesta, ...(r.alternativas || [])] };
        revisar(ej, donde);
      }
      if (j.slug === 'encuentra-el-error') {
        const fc = canonica(r.frase.replace(r.error, r.correccion));
        if (fc === canonica(r.frase)) mal(donde, 'la corrección no cambia la frase');
      }
    }
  }
}

if (errores.length) {
  console.log(errores.map(e => 'ERROR  ' + e).join('\n'));
}
console.log(`datos.test: ${revisados} ejercicios revisados · ${errores.length} errores`);
process.exit(errores.length ? 1 : 0);
