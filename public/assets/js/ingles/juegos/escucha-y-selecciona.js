/**
 * Juego 3 · Escucha y selecciona. Tres modos:
 *   significado   se oye una palabra → elegir su significado (4 opciones)
 *   palabra       se oye una palabra → elegir cómo se escribe (4 opciones)
 *   pares_minimos se oye UNA de dos palabras casi iguales → elegir cuál fue
 */
import { jugarRondas, elegirOpcion, el, barajar, botonOir } from './base.js';
import { decir } from '../voz.js';

export async function iniciar(contenedor, { juego, nivel, progreso, base, alSiguienteNivel }) {
  let rondas;
  if (nivel.modo === 'pares_minimos') {
    rondas = barajar(nivel.pares).map(p => {
      const cual = Math.random() < 0.5 ? 'a' : 'b';
      const otra = cual === 'a' ? 'b' : 'a';
      return {
        oir: p[cual], correcta: p[cual], opciones: [p.a, p.b], es: { [p.a]: p.es_a, [p.b]: p.es_b },
        pista: p.pista, titulo_repaso: `${p.a} / ${p.b}`,
        explicacion: `Sonó «${p[cual]}» (${p['es_' + cual]}), no «${p[otra]}» (${p['es_' + otra]}). ${p.pista}`,
      };
    });
  } else {
    const vocab = await fetch(`${base}/assets/ingles/data/vocabulario.json`).then(r => r.json());
    // En el modo «palabra» se descartan expresiones de varias palabras: se elige cómo se escribe UNA palabra.
    const candidatas = vocab.palabras.filter(p => nivel.temas.includes(p.tema) && (nivel.modo === 'significado' || !/\s/.test(p.en.trim())));
    const unicas = [...new Map(candidatas.map(p => [p.en.toLowerCase(), p])).values()];
    rondas = barajar(unicas).slice(0, nivel.rondas || 10).map(p => {
      const otras = barajar(unicas.filter(x => x.en !== p.en && x.es !== p.es)).slice(0, 3);
      const modoPalabra = nivel.modo === 'palabra';
      const opciones = barajar([p, ...otras]).map(x => (modoPalabra ? x.en : x.es));
      return {
        oir: p.en, correcta: modoPalabra ? p.en : p.es, opciones, palabra: p,
        pista: modoPalabra ? `Tiene ${p.en.length} letras y empieza por «${p.en[0]}».` : `Es del tema «${p.tema.replace(/-/g, ' ')}». ${p.emoji ? 'Imagen: ' + p.emoji : ''}`,
        titulo_repaso: `${p.en} — ${p.es}`,
        explicacion: `«${p.en}» ${p.ipa} significa «${p.es}». Ejemplo: ${p.ejemplo.en} (${p.ejemplo.es})`,
      };
    });
  }
  return jugarRondas(contenedor, {
    juego, nivel, progreso, alSiguienteNivel, rondas,
    async pintar(r, { area }) {
      area.append(el('p', { clase: 'in-reto__enunciado', texto: nivel.modo === 'palabra' ? '¿Qué palabra oíste?' : (nivel.modo === 'pares_minimos' ? '¿Cuál de las dos oíste?' : '¿Qué significa lo que oíste?') }),
        el('p', {}, botonOir(r.oir, { etiqueta: 'Escuchar otra vez' }), ' ', botonOir(r.oir, { lento: true })));
      setTimeout(() => decir(r.oir).catch(() => {}), 200);
      const lang = nivel.modo === 'significado' ? 'es' : 'en';
      const { indice, boton, botones } = await elegirOpcion(area, r.opciones, { textoDe: (o) => (nivel.modo === 'pares_minimos' ? `${o} · ${r.es[o]}` : o), lang });
      const ok = r.opciones[indice] === r.correcta;
      boton.classList.add(ok ? 'es-ok' : 'es-mal');
      botones.forEach((b, k) => { if (r.opciones[k] === r.correcta) b.classList.add('es-ok'); });
      return { correcto: ok, respuesta: r.opciones[indice], correcta: r.correcta };
    },
  });
}
