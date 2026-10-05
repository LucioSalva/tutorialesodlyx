/** Portada: regla de bits interactiva y avance por módulo. */
import { montarRegla } from '../regla.js';
import { resueltos } from '../progreso.js';

export function iniciar(config, base) {
  document.querySelectorAll('[data-regla]').forEach(montarRegla);

  for (const m of config.modulos ?? []) {
    const total = m.lecciones.reduce((s, l) => s + l.ejercicios, 0);
    const hechos = m.lecciones.reduce((s, l) => s + Math.min(l.ejercicios, resueltos(m.slug, l.slug).length), 0);
    const nodo = document.querySelector(`[data-modulo="${m.slug}"] [data-avance]`);
    if (!nodo || hechos === 0) continue;
    nodo.textContent = `Llevas ${hechos} de ${total} ejercicios guiados.`;
    nodo.hidden = false;
    // «Continuar»: la primera lección con ejercicios pendientes.
    const pendiente = m.lecciones.find((l) => resueltos(m.slug, l.slug).length < l.ejercicios);
    const boton = document.querySelector('[data-continuar]');
    if (pendiente && boton && m.slug === 'subneteo') {
      boton.href = `${base}/redes/${m.slug}/leccion/${pendiente.slug}`;
      boton.textContent = 'Continuar: ' + pendiente.titulo;
    }
  }
}
