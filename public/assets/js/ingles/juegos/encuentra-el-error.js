/** Juego 2 · Encuentra el error: señalar la palabra incorrecta y escribir la corrección. */
import { jugarRondas, escribir, el, evaluar, botonOir } from './base.js';
import { limpiar } from '../texto.js';

export function iniciar(contenedor, { juego, nivel, progreso, alSiguienteNivel }) {
  return jugarRondas(contenedor, {
    juego, nivel, progreso, alSiguienteNivel,
    rondas: nivel.rondas.map(r => ({ ...r, titulo_repaso: r.frase + ' → ' + r.correccion })),
    async pintar(r, { area }) {
      area.append(el('p', { clase: 'in-nota-pie', texto: 'Pulsa la palabra (o el grupo) que está mal.' }));
      const palabras = r.frase.split(/\s+/);
      const n = r.error.split(/\s+/).length;
      const linea = el('p', { clase: 'in-reto__enunciado in-corregir', lang: 'en' });
      const elegido = await new Promise(resolve => {
        palabras.forEach((p, i) => {
          const b = el('button', { type: 'button', clase: 'in-token', texto: p });
          b.addEventListener('click', () => {
            [...linea.querySelectorAll('.in-token')].forEach(x => { x.disabled = true; });
            resolve({ i, texto: palabras.slice(i, i + n).join(' ') });
          });
          linea.append(b, ' ');
        });
        area.append(linea);
        linea.querySelector('.in-token')?.focus({ preventScroll: true });
      });
      const tokens = [...linea.querySelectorAll('.in-token')];
      const esError = limpiar(elegido.texto) === limpiar(r.error);
      tokens.forEach((b, k) => {
        if (limpiar(palabras.slice(k, k + n).join(' ')) === limpiar(r.error)) tokens.slice(k, k + n).forEach(x => x.classList.add('es-localizado'));
      });
      if (!esError) {
        tokens[elegido.i].classList.add('es-mal');
        area.append(el('p', { clase: 'in-es', texto: r.es }));
        return { correcto: false, respuesta: elegido.texto, correcta: `${r.error} → ${r.correccion}` };
      }
      area.append(el('p', { clase: 'in-nota-pie', texto: '¡Bien localizado! Ahora escribe la forma correcta de esa parte.' }));
      const escrito = await escribir(area, { placeholder: 'Corrección…' });
      const res = evaluar({ tipo: 'traducir', respuestas: [r.correccion, ...(r.alternativas || [])] }, escrito);
      const correcta = r.frase.replace(r.error, r.correccion);
      area.append(el('p', {}, el('span', { lang: 'en', clase: 'in-en', texto: correcta }), ' ', botonOir(correcta)), el('p', { clase: 'in-es', texto: r.es }));
      return { correcto: !!res.correcto, respuesta: escrito, correcta: r.correccion };
    },
  });
}
