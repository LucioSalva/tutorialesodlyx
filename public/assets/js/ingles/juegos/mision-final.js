/** Juego 10 · Misión final: una historia por capítulos que mezcla todo el curso. */
import { jugarRondas, jugarReto, el, fmt, botonOir } from './base.js';

export function iniciar(contenedor, { juego, nivel, progreso, alSiguienteNivel }) {
  const rondas = nivel.capitulos.flatMap((c, ci) => c.retos.map((r, ri) => ({ ...r, cap: c, ci, ri, titulo_repaso: `${c.titulo}: ${r.pregunta}` })));
  return jugarRondas(contenedor, {
    juego, nivel, progreso, alSiguienteNivel, rondas,
    async pintar(r, { area }) {
      area.append(el('p', { clase: 'in-etiqueta', style: 'margin:0', texto: `Capítulo ${r.ci + 1} de ${nivel.capitulos.length} · ${r.cap.titulo}` }));
      if (r.ri === 0) {
        const trad = el('p', { clase: 'in-es', texto: r.cap.es, hidden: true });
        const b = el('button', { type: 'button', clase: 'in-btn in-btn--fino in-btn--suave', texto: 'Ver traducción' });
        b.addEventListener('click', () => { trad.hidden = !trad.hidden; b.textContent = trad.hidden ? 'Ver traducción' : 'Ocultar traducción'; });
        area.append(el('div', { clase: 'in-narracion' }, el('p', { clase: 'in-narracion__en', lang: 'en', html: fmt(r.cap.narracion) }), el('p', {}, botonOir(r.cap.narracion, { etiqueta: 'Escuchar' }), ' ', b), trad));
      }
      return jugarReto(area, r);
    },
  });
}
