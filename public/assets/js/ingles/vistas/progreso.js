/** Vista: panel de progreso, actividad, tabla por unidad y datos. */
const minutos = (s) => {
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

export function montar(cfg, { progreso, anunciar }) {
  const pintar = () => {
    const r = progreso.resumen();
    const valores = { ...r, tiempo: minutos(r.segundos), tiempoHoy: minutos(r.segundosHoy) };
    document.querySelectorAll('[data-v]').forEach(n => {
      if (n.dataset.v in valores) n.textContent = String(valores[n.dataset.v]);
    });

    // Actividad de 28 días
    const caja = document.querySelector('[data-actividad]');
    caja.textContent = '';
    const dias = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dias.push({ k, s: progreso.datos.tiempo[k] || 0 });
    }
    const max = Math.max(60, ...dias.map(d => d.s));
    for (const d of dias) {
      const barra = document.createElement('span');
      barra.title = `${d.k}: ${minutos(d.s)}`;
      if (!d.s) barra.className = 'es-vacio';
      else barra.style.height = Math.max(6, Math.round((d.s / max) * 100)) + '%';
      caja.append(barra);
    }
    const activos = dias.filter(d => d.s >= 60).length;
    document.querySelector('[data-actividad-texto]').textContent = `${activos} de los últimos 28 días con al menos un minuto de estudio.`;

    // Por unidad
    document.querySelectorAll('[data-fila-unidad]').forEach(tr => {
      const slug = tr.dataset.filaUnidad;
      const lecciones = tr.dataset.lecciones.split(',');
      const hechas = lecciones.filter(l => progreso.leccion(l)?.completada).length;
      const resueltos = Object.entries(progreso.datos.ejercicios).filter(([id, e]) => e.resuelto && id.startsWith(slug + '.') && !id.startsWith(slug + '.eval.')).length;
      tr.querySelector('[data-c="lecciones"]').textContent = `${hechas}/${lecciones.length}`;
      tr.querySelector('[data-c="ejercicios"]').textContent = `${resueltos}/${tr.dataset.totalEj}`;
      const ev = progreso.evaluacion(slug + '.eval');
      tr.querySelector('[data-c="eval"]').textContent = ev ? `${ev.mejor} %${ev.aprobado ? ' ✓' : ''} (${ev.intentos})` : '—';
    });
    document.querySelectorAll('[data-examen]').forEach(n => {
      const x = progreso.evaluacion(n.dataset.examen);
      n.querySelector('span').textContent = x ? `${x.mejor} %${x.aprobado ? ' ✓' : ''}` : '—';
    });
  };
  pintar();

  const estado = document.querySelector('[data-datos-estado]');
  document.querySelector('[data-exportar]').addEventListener('click', () => {
    const blob = new Blob([progreso.exportar()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `academia-ingles-progreso-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    estado.textContent = 'Archivo de progreso descargado.';
  });

  document.querySelector('[data-importar]').addEventListener('change', async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (archivo.size > 5_000_000) { estado.textContent = 'El archivo es demasiado grande para ser un progreso.'; return; }
    const r = progreso.importar(await archivo.text(), { fusionar: true });
    estado.textContent = r.mensaje;
    if (r.ok) { pintar(); anunciar(r.mensaje, 'ok'); }
  });

  // Borrado en dos pasos, sin diálogos del navegador.
  const borrar = document.querySelector('[data-borrar]');
  let armado = false;
  borrar.addEventListener('click', () => {
    if (!armado) {
      armado = true;
      borrar.textContent = 'Pulsa otra vez para borrar TODO (no se puede deshacer)';
      estado.textContent = 'Consejo: exporta primero tu progreso si quieres conservarlo.';
      setTimeout(() => { armado = false; borrar.textContent = 'Borrar mi progreso'; }, 6000);
      return;
    }
    progreso.borrarTodo();
    armado = false;
    borrar.textContent = 'Borrar mi progreso';
    estado.textContent = 'Progreso borrado.';
    pintar();
  });
}
