/** Juego 6 · Detective gramatical: descubrir qué regla explica la palabra resaltada. */
import { jugarRondas, elegirOpcion, el, fmt, barajar, botonOir, } from './base.js';
import { esc } from '../ejercicios.js';

export function iniciar(contenedor, { juego, nivel, progreso, alSiguienteNivel }) {
  return jugarRondas(contenedor, {
    juego, nivel, progreso, alSiguienteNivel,
    rondas: nivel.rondas.map(r => ({ ...r, titulo_repaso: r.frase, explicacion: r.explicacion || '' })),
    async pintar(r, { area }) {
      const i = r.frase.indexOf(r.resaltar);
      const html = esc(r.frase.slice(0, i)) + `<mark class="in-rol in-rol--auxiliar">${esc(r.resaltar)}</mark>` + esc(r.frase.slice(i + r.resaltar.length));
      area.append(el('p', { clase: 'in-reto__enunciado', lang: 'en', html }), el('p', {}, botonOir(r.frase), ' ', el('span', { clase: 'in-es', texto: r.es })),
        el('p', { html: '<b>🔎 ' + fmt(r.pregunta) + '</b>' }));
      const orden = barajar(r.opciones.map((o, k) => k));
      const { indice, boton, botones } = await elegirOpcion(area, orden.map(k => r.opciones[k]), { lang: 'es' });
      const op = r.opciones[orden[indice]];
      boton.classList.add(op.correcta ? 'es-ok' : 'es-mal');
      botones.forEach((b, k) => { if (r.opciones[orden[k]].correcta) b.classList.add('es-ok'); });
      area.append(el('p', { clase: 'in-nota-pie', html: fmt(op.porque) }));
      return { correcto: !!op.correcta, respuesta: op.texto };
    },
  });
}
