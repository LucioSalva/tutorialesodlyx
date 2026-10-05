/** Vista: unidad. Estado de cada lección y de la evaluación. */
export function montar(cfg, { progreso }) {
  for (const l of cfg.lecciones || []) {
    const item = document.querySelector(`[data-leccion-item="${CSS.escape(l.slug)}"]`);
    const estado = document.querySelector(`[data-leccion-estado="${CSS.escape(l.slug)}"]`);
    if (!item || !estado) continue;
    const resueltos = l.ejercicios.filter(id => progreso.ejercicio(id)?.resuelto).length;
    const datos = progreso.leccion(l.slug);
    if (datos?.completada) {
      item.classList.add('es-completada');
      estado.textContent = '✓ Completada';
    } else if (resueltos || datos?.vista) {
      estado.textContent = `${resueltos}/${l.ejercicios.length}`;
      estado.title = `${resueltos} de ${l.ejercicios.length} ejercicios resueltos`;
    }
  }
  const ev = document.querySelector('[data-evaluacion-estado]');
  const x = ev && progreso.evaluacion(ev.dataset.evaluacionEstado);
  if (x) ev.textContent = `Último resultado: ${x.ultimo} % · mejor: ${x.mejor} % · ${x.intentos} intento${x.intentos > 1 ? 's' : ''}${x.aprobado ? ' · aprobada' : ''}`;
}
