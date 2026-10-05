/** Juego 9 · Desafío de tiempos verbales: contrarreloj; la señal del contexto decide. */
import { jugarRondas, elegirOpcion, el, barajar, botonOir } from './base.js';
import { esc } from '../ejercicios.js';

export function iniciar(contenedor, { juego, nivel, progreso, alSiguienteNivel }) {
  return jugarRondas(contenedor, {
    juego, nivel, progreso, alSiguienteNivel,
    segundos: nivel.segundos || 90,
    minRondas: Math.min(8, nivel.rondas.length),
    rondas: barajar(nivel.rondas).map(r => ({ ...r, titulo_repaso: r.frase.replace('___', r.correcta) })),
    async pintar(r, { area }) {
      area.append(el('p', { clase: 'in-reto__enunciado', lang: 'en', html: esc(r.frase).replace('___', '<span class="in-hueco-fijo">_____</span>') }));
      const opciones = barajar(r.opciones);
      const { indice, boton, botones } = await elegirOpcion(area, opciones);
      const ok = opciones[indice] === r.correcta;
      boton.classList.add(ok ? 'es-ok' : 'es-mal');
      botones.forEach((b, k) => { if (opciones[k] === r.correcta) b.classList.add('es-ok'); });
      const completa = r.frase.replace('___', r.correcta);
      const i = completa.indexOf(r.senal);
      area.append(el('p', { lang: 'en', html: i >= 0 ? esc(completa.slice(0, i)) + `<mark class="in-rol in-rol--tiempo">${esc(r.senal)}</mark>` + esc(completa.slice(i + r.senal.length)) : esc(completa) }, ' ', botonOir(completa)),
        el('p', { clase: 'in-es', texto: r.es }));
      return { correcto: ok, respuesta: opciones[indice], correcta: r.correcta };
    },
  });
}
