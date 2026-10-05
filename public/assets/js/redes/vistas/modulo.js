/** Índice de un módulo: avance de cada lección y marcador de cada nivel. */
import { resueltos, nivel } from '../progreso.js';

export function iniciar(config) {
  document.querySelectorAll('[data-leccion]').forEach((li) => {
    const total = Number(li.dataset.total);
    const hechos = Math.min(total, resueltos(config.modulo, li.dataset.leccion).length);
    if (hechos === 0) return;
    const marca = li.querySelector('[data-avance]');
    marca.textContent = hechos >= total ? 'Completa' : `${hechos} de ${total} resueltos`;
    li.classList.toggle('es-completa', hechos >= total);
    li.classList.toggle('es-empezada', hechos < total);
  });
  document.querySelectorAll('[data-nivel]').forEach((marca) => {
    const x = nivel(config.modulo, Number(marca.dataset.nivel));
    if (x.ok > 0) marca.textContent = `${x.ok} resueltos · mejor racha ${x.mejor}`;
  });
}
