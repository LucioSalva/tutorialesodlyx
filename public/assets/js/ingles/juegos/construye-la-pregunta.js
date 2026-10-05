/** Juego 7 · Construye la pregunta: transformar una afirmación en la pregunta pedida. */
import { jugarRondas, escribir, evaluar, el, fmt, botonOir } from './base.js';

export function iniciar(contenedor, { juego, nivel, progreso, alSiguienteNivel }) {
  return jugarRondas(contenedor, {
    juego, nivel, progreso, alSiguienteNivel,
    rondas: nivel.rondas.map(r => ({ ...r, titulo_repaso: r.afirmacion + ' → ' + r.respuestas[0] })),
    async pintar(r, { area }) {
      area.append(el('p', { clase: 'in-reto__enunciado' }, el('span', { lang: 'en', texto: r.afirmacion }), ' ', botonOir(r.afirmacion)),
        el('p', { html: '<b>Objetivo:</b> ' + fmt(r.objetivo) }));
      const escrito = await escribir(area, { placeholder: 'Escribe la pregunta…' });
      const res = evaluar({ tipo: 'transformar', respuestas: r.respuestas }, escrito);
      area.append(el('p', {}, el('span', { lang: 'en', clase: 'in-en', texto: r.respuestas[0] }), ' ', botonOir(r.respuestas[0])));
      if (!res.correcto && res.casi) area.append(el('p', { clase: 'in-nota-pie', texto: 'Casi: una palabra mal escrita.' }));
      return { correcto: !!res.correcto, respuesta: escrito, correcta: r.respuestas[0] };
    },
  });
}
