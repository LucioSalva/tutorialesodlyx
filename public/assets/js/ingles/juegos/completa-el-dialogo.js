/** Juego 5 · Completa el diálogo: elegir la réplica adecuada en una conversación. */
import { jugarRondas, elegirOpcion, el, fmt, barajar, botonOir } from './base.js';
import { asignarRoles } from '../audio-textos.js';

export function iniciar(contenedor, { juego, nivel, progreso, alSiguienteNivel }) {
  return jugarRondas(contenedor, {
    juego, nivel, progreso, alSiguienteNivel,
    rondas: nivel.rondas.map(r => ({ ...r, titulo_repaso: r.opciones.find(o => o.correcta)?.texto, explicacion: r.explicacion || '' })),
    async pintar(r, { area }) {
      area.append(el('p', { clase: 'in-nota-pie', html: fmt(r.contexto) }));
      const lista = el('ol', { clase: 'in-dialogo__lineas' });
      const roles = asignarRoles(r.lineas.filter(l => l.en !== '___').map(l => l.quien));
      r.lineas.forEach((l, i) => {
        const hueco = l.en === '___';
        lista.append(el('li', { clase: `in-burbuja in-burbuja--${i % 2 ? 'b' : 'a'}`, style: 'max-width:100%' },
          el('span', { clase: 'in-burbuja__quien', texto: l.quien }),
          hueco ? el('span', { clase: 'in-burbuja__en', texto: '¿…?' }) : el('span', { clase: 'in-burbuja__en', lang: 'en', texto: l.en }),
          hueco ? '' : botonOir(l.en, { rol: roles.get(l.quien) })));
      });
      area.append(lista, el('p', { clase: 'in-reto__enunciado', texto: '¿Qué dices?' }));
      const orden = barajar(r.opciones.map((o, i) => i));
      const { indice, boton, botones } = await elegirOpcion(area, orden.map(i => r.opciones[i]));
      const op = r.opciones[orden[indice]];
      boton.classList.add(op.correcta ? 'es-ok' : 'es-mal');
      botones.forEach((b, k) => { if (r.opciones[orden[k]].correcta) b.classList.add('es-ok'); });
      area.append(el('p', { clase: 'in-nota-pie', html: fmt(op.porque) }));
      return { correcto: !!op.correcta, respuesta: op.texto, explicacion: op.porque };
    },
  });
}
