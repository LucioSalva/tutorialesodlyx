/** Vistas: índice de vocabulario y tema. Estado real de cada palabra en el repaso. */
export function montar(cfg, { progreso, anunciar }) {
  const tarjetas = progreso.datos.tarjetas;
  const estado = (id) => {
    const t = tarjetas['v:' + id];
    if (!t) return '';
    if (t.intervalo >= 21) return 'dominada';
    if (t.rep >= 2) return 'aprendida';
    return 'en repaso';
  };

  if (cfg.vista === 'vocabulario') {
    // Cuántas palabras de cada tema están aprendidas (el id empieza por «tema.»).
    const cuenta = {};
    for (const [id, t] of Object.entries(tarjetas)) {
      if (!id.startsWith('v:') || t.rep < 2) continue;
      const tema = id.slice(2).split('.')[0];
      cuenta[tema] = (cuenta[tema] || 0) + 1;
    }
    document.querySelectorAll('[data-tema-aprendidas]').forEach(n => {
      const c = cuenta[n.dataset.temaAprendidas];
      if (c) n.textContent = `· ${c} aprendidas`;
    });
    return;
  }

  progreso.visitar({ url: location.pathname, titulo: 'Vocabulario: ' + document.title.split(' · ')[0].replace('Vocabulario: ', ''), tipo: 'vocabulario' });

  const pintar = () => document.querySelectorAll('[data-palabra]').forEach(li => {
    const e = estado(li.dataset.palabra);
    li.querySelector('[data-palabra-estado]').textContent = e ? '● ' + e : '';
    li.classList.toggle('es-aprendida', e === 'aprendida' || e === 'dominada');
  });
  pintar();

  document.querySelector('[data-anadir-tema]')?.addEventListener('click', () => {
    const n = progreso.anadirTarjetas(cfg.palabras.map(id => 'v:' + id), 'v');
    anunciar(n ? `${n} palabras añadidas a tu repaso. Aparecerán como nuevas en la sesión de repaso.` : 'Todas las palabras de este tema ya estaban en tu repaso.', 'ok');
    pintar();
  });

  const filtro = document.querySelector('[data-filtro]');
  const cuenta = document.querySelector('[data-filtro-cuenta]');
  const normal = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  filtro?.addEventListener('input', () => {
    const q = normal(filtro.value.trim());
    let visibles = 0;
    document.querySelectorAll('[data-palabra]').forEach(li => {
      const ok = !q || normal(li.dataset.buscar).includes(q);
      li.hidden = !ok;
      if (ok) visibles++;
    });
    cuenta.textContent = q ? `${visibles} palabras` : '';
  });
}
