/** Juego 1 · Ordena la oración: construir la frase con fichas (pulsar o arrastrar). */
import { jugarRondas, ordenarFichas, evaluar, el, fmt, botonOir } from './base.js';

export function iniciar(contenedor, { juego, nivel, progreso, alSiguienteNivel }) {
  return jugarRondas(contenedor, {
    juego, nivel, progreso, alSiguienteNivel,
    rondas: nivel.rondas.map(r => ({ ...r, titulo_repaso: r.respuesta })),
    async pintar(r, { area }) {
      const final = (r.respuesta.match(/[.?!]+$/) || [''])[0];
      const palabras = r.respuesta.replace(/[.?!]+$/, '').split(/\s+/);
      area.append(el('p', { clase: 'in-reto__enunciado', texto: r.es }),
        el('p', { clase: 'in-nota-pie', html: `Construye la oración en inglés${final ? ` (termina en «${fmt(final)}»)` : ''}.` }));
      const dada = await ordenarFichas(area, palabras, { distractores: r.distractores || [] });
      const res = evaluar({ tipo: 'ordenar', respuestas: [r.respuesta, ...(r.alternativas || [])] }, dada);
      area.append(el('p', {}, el('span', { lang: 'en', clase: 'in-en', texto: r.respuesta }), ' ', botonOir(r.respuesta)));
      return { correcto: !!res.correcto, respuesta: dada, correcta: r.respuesta };
    },
  });
}
