/** Juego 8 · Viaje interactivo: paradas con situaciones reales; cada fallo cuesta una vida. */
import { jugarRondas, jugarReto, el, fmt } from './base.js';

export function iniciar(contenedor, { juego, nivel, progreso, alSiguienteNivel }) {
  const rondas = nivel.paradas.flatMap((p, pi) => p.retos.map((r, ri) => ({ ...r, parada: p, pi, ri, titulo_repaso: `${p.lugar}: ${r.pregunta}` })));
  return jugarRondas(contenedor, {
    juego, nivel, progreso, alSiguienteNivel, vidas: nivel.vidas || 3, rondas,
    async pintar(r, { area }) {
      const mapa = el('ol', { clase: 'in-mapa-viaje', 'aria-label': 'Recorrido' });
      nivel.paradas.forEach((p, k) => mapa.append(el('li', { clase: k < r.pi ? 'es-hecho' : (k === r.pi ? 'es-actual' : '') }, el('span', { 'aria-hidden': 'true', texto: p.emoji }), p.lugar)));
      area.append(mapa);
      if (r.ri === 0) area.append(el('div', { clase: 'in-narracion' }, el('p', { html: `<b>${fmt(r.parada.emoji + ' ' + r.parada.lugar)}.</b> ` + fmt(r.parada.situacion) })));
      return jugarReto(area, r);
    },
  });
}
