/**
 * Vista: tarjetas de memorización. Carga el vocabulario (solo en esta
 * página), arma un mazo según tema y modalidad y registra cada
 * calificación en el repaso espaciado.
 */
import { mostrarTarjeta, aptaPara } from '../mazo.js';
import { el, barajar } from '../ejercicios.js';

export async function montar(cfg, { progreso, base, anunciar }) {
  progreso.visitar({ url: location.pathname, titulo: 'Tarjetas de vocabulario', tipo: 'tarjetas' });
  const caja = document.querySelector('[data-mazo]');
  const form = document.querySelector('[data-mazo-form]');
  let vocab;
  try {
    vocab = await fetch(`${base}/assets/ingles/data/vocabulario.json`).then(r => r.json());
  } catch {
    caja.textContent = 'No se pudo cargar el vocabulario.';
    return;
  }
  const palabras = vocab.palabras || [];

  let tanda = null;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Una sola tanda viva: la anterior se cancela y su tarjeta no califica.
    tanda?.abort();
    const ctrl = new AbortController();
    tanda = ctrl;
    const tema = form.tema.value;
    const modo = form.modo.value;
    const cuantas = Number(form.cuantas.value) || 20;
    let lista = palabras.filter(p => (!tema || p.tema === tema) && aptaPara(modo, p));
    if (!lista.length) {
      caja.textContent = '';
      caja.append(el('p', { clase: 'in-bajada', texto: modo === 'imagen'
        ? 'Este tema no tiene palabras con imagen. Prueba con comida, ropa, transporte u hogar, o elige otra modalidad.'
        : 'No hay palabras que encajen con esta combinación.' }));
      return;
    }
    // Primero las que menos dominas: sin estudiar o con facilidad baja.
    lista = barajar(lista).sort((a, b) => (progreso.datos.tarjetas['v:' + a.id]?.ef ?? 2.4) - (progreso.datos.tarjetas['v:' + b.id]?.ef ?? 2.4)).slice(0, cuantas);

    let bien = 0;
    for (let i = 0; i < lista.length; i++) {
      const p = lista[i];
      const id = 'v:' + p.id;
      const nota = await mostrarTarjeta(caja, { tipo: 'v', modo, palabra: p, estado: progreso.datos.tarjetas[id], posicion: `Tarjeta ${i + 1} de ${lista.length}` }, ctrl.signal);
      if (nota === null || ctrl.signal.aborted) return;
      progreso.calificar(id, nota, 'v');
      if (nota >= 2) bien++;
    }
    caja.textContent = '';
    caja.append(el('div', { clase: 'in-final' },
      el('p', { clase: 'in-final__icono', 'aria-hidden': 'true', texto: bien / lista.length >= 0.8 ? '🎉' : '📚' }),
      el('h3', { texto: `Recordaste ${bien} de ${lista.length}` }),
      el('p', { texto: 'Todas estas palabras ya están en tu repaso espaciado. Las que no recordaste volverán en unos minutos.' }),
      el('div', { clase: 'in-final__acciones' },
        el('button', { type: 'button', clase: 'in-btn in-btn--primario', texto: 'Otra tanda', onclick: () => form.requestSubmit() }),
        el('a', { clase: 'in-btn', href: `${base}/ingles/repaso`, texto: 'Ir al repaso' }))));
    anunciar(`Tanda terminada: ${bien} de ${lista.length}.`, 'ok');
  });

  if (cfg.tema) form.requestSubmit();
}
