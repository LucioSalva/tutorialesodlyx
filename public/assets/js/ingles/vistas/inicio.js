/**
 * Vista: portada. «Continuar donde lo dejaste», cifras reales del
 * estudiante y avance de cada unidad y examen.
 */
export function montar(cfg, { progreso }) {
  const r = progreso.resumen();
  const valores = {
    lecciones: r.leccionesCompletadas,
    ejercicios: r.ejerciciosResueltos,
    palabras: r.palabrasAprendidas,
    repasos: r.repasosPendientes,
  };
  document.querySelectorAll('[data-p]').forEach(n => {
    if (n.dataset.p in valores) n.textContent = String(valores[n.dataset.p]);
  });

  const u = progreso.datos.ultima;
  const caja = document.querySelector('[data-continuar-caja]');
  if (u && caja) {
    caja.hidden = false;
    const a = caja.querySelector('[data-continuar-enlace]');
    a.href = u.url;
    a.textContent = u.titulo + ' →';
    const boton = document.querySelector('[data-continuar]');
    if (boton) { boton.href = u.url; boton.textContent = 'Continuar donde lo dejé'; }
  }

  pintarUnidades(progreso);
  document.querySelectorAll('[data-examen-estado]').forEach(n => {
    const x = progreso.evaluacion(n.dataset.examenEstado);
    if (x) n.textContent = `Mejor resultado: ${x.mejor} %${x.aprobado ? ' · aprobado' : ''}`;
  });
}

/**
 * Avance por unidad: lecciones completadas / lecciones de la unidad. Las
 * listas de lecciones salen del propio marcado (data-unidad) y de lo que el
 * estudiante completó; no hay cifras inventadas.
 */
export function pintarUnidades(progreso, leccionesPorUnidad = null) {
  const completadas = new Set(Object.entries(progreso.datos.lecciones).filter(([, l]) => l.completada).map(([s]) => s));
  document.querySelectorAll('[data-unidad-barra]').forEach(barra => {
    const slug = barra.dataset.unidadBarra;
    const tarjeta = barra.closest('[data-unidad]');
    const total = Number(tarjeta?.querySelector('.in-unidad__pie')?.textContent.match(/^(\d+)/)?.[1] || 0);
    const lecciones = leccionesPorUnidad?.[slug];
    const hechas = lecciones ? lecciones.filter(l => completadas.has(l)).length : contarPorPrefijo(progreso, slug);
    const pct = total ? Math.round((hechas / total) * 100) : 0;
    barra.style.width = pct + '%';
    const estado = tarjeta?.querySelector('[data-unidad-estado]');
    const ev = progreso.evaluacion(slug + '.eval');
    if (estado) {
      const partes = [];
      if (hechas) partes.push(`${hechas}/${total} lecciones`);
      if (ev) partes.push(`evaluación: ${ev.mejor} %`);
      estado.textContent = partes.join(' · ');
    }
    if (total && hechas === total && ev?.aprobado) tarjeta?.classList.add('es-completada');
  });
}

/** Lecciones completadas de una unidad, deducidas por los ejercicios «<unidad>.<leccion>.nn». */
function contarPorPrefijo(progreso, unidad) {
  const lecciones = new Set();
  for (const id of Object.keys(progreso.datos.ejercicios)) {
    if (id.startsWith(unidad + '.')) lecciones.add(id.split('.')[1]);
  }
  return [...lecciones].filter(l => progreso.datos.lecciones[l]?.completada).length;
}
