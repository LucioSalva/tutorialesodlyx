/** Lección: monta los ejercicios guiados y guarda cuáles se resolvieron. */
import { montarEjercicio } from '../ui.js';
import { resueltos, marcarResuelto } from '../progreso.js';

export function iniciar(config) {
  const lista = config.ejercicios ?? [];
  const hechos = new Set(resueltos(config.modulo, config.leccion));
  const contador = document.querySelector('[data-avance-leccion]');
  const pintar = () => {
    if (!contador) return;
    const n = [...hechos].filter((i) => i < lista.length).length;
    contador.querySelector('b').textContent = String(n);
    contador.classList.toggle('es-completa', n >= lista.length);
  };
  pintar();

  document.querySelectorAll('article[data-ej]').forEach((nodo) => {
    const i = Number(nodo.dataset.ej);
    if (!lista[i]) return;
    try {
      montarEjercicio(nodo, lista[i], {
        numero: i + 1,
        hecho: hechos.has(i),
        // Solo cuenta si se resolvió sin abrir la solución.
        alTerminar: (r) => { if (r.correcto) { hechos.add(i); marcarResuelto(config.modulo, config.leccion, i); pintar(); } },
      });
    } catch (e) {
      console.error('[Redes] Ejercicio ' + (i + 1), e);
      nodo.textContent = 'Este ejercicio no se pudo cargar.';
    }
  });
}
