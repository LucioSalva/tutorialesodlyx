/**
 * Vista: repaso espaciado. Una sesión = tarjetas vencidas (las más
 * difíciles primero) + unas pocas nuevas, sin pasar del límite diario.
 * Las que se fallan vuelven al final de la misma sesión (10 minutos).
 */
import { mostrarTarjeta } from '../mazo.js';
import { el } from '../ejercicios.js';

export async function montar(cfg, { progreso, base, anunciar }) {
  progreso.visitar({ url: location.pathname, titulo: 'Repaso espaciado', tipo: 'repaso' });
  const caja = document.querySelector('[data-mazo]');
  const resumen = document.querySelector('[data-repaso-resumen]');
  const [vocab, gram] = await Promise.all([
    fetch(`${base}/assets/ingles/data/vocabulario.json`).then(r => r.json()).catch(() => ({ palabras: [] })),
    fetch(`${base}/assets/ingles/data/tarjetas-gramatica.json`).then(r => r.json()).catch(() => ({ tarjetas: [] })),
  ]);
  const palabras = new Map((vocab.palabras || []).map(p => ['v:' + p.id, p]));
  const gramatica = new Map((gram.tarjetas || []).map(t => [t.id, t]));
  const existe = (id) => palabras.has(id) || gramatica.has(id);

  // Límite de nuevas por día
  const sel = document.querySelector('[data-nuevas-dia]');
  if (sel) {
    sel.value = String(progreso.datos.preferencias.nuevasPorDia || 15);
    sel.addEventListener('change', () => { progreso.datos.preferencias.nuevasPorDia = Number(sel.value); progreso.guardar(); pintarResumen(); });
  }

  const pintarDificiles = () => {
    const lista = document.querySelector('[data-dificiles]');
    const dif = progreso.dificiles(12).filter(t => existe(t.id));
    lista.textContent = '';
    if (!dif.length) { lista.append(el('li', { texto: 'Todavía no hay ninguna.' })); return; }
    for (const t of dif) {
      const p = palabras.get(t.id);
      const g = gramatica.get(t.id);
      lista.append(el('li', {},
        p ? el('span', {}, el('b', { lang: 'en', texto: p.en }), ` — ${p.es}`) : el('span', { texto: g.frente.replace(/\*\*|\[\[|\]\]/g, '') }),
        el('small', { texto: ` · ${t.fallos} fallos, ${t.aciertos} aciertos` })));
    }
  };

  function sesion() {
    const vencidas = progreso.pendientes({ limite: 200 }).filter(t => existe(t.id));
    const nuevas = progreso.sinEstudiar().filter(t => existe(t.id)).slice(0, progreso.nuevasPermitidasHoy());
    return { vencidas, nuevas };
  }

  function pintarResumen() {
    const { vencidas, nuevas } = sesion();
    const total = Object.keys(progreso.datos.tarjetas).filter(existe).length;
    resumen.textContent = '';
    resumen.append(el('p', { html: `<b>${vencidas.length}</b> tarjetas para repasar ahora · <b>${nuevas.length}</b> nuevas disponibles hoy · <b>${total}</b> en tu mazo` }));
    return { vencidas, nuevas, total };
  }

  async function empezar() {
    const { vencidas, nuevas } = sesion();
    const cola = [...vencidas, ...nuevas];
    let hechas = 0; let bien = 0;
    while (cola.length) {
      const t = cola.shift();
      const p = palabras.get(t.id);
      const g = gramatica.get(t.id);
      const estado = progreso.datos.tarjetas[t.id];
      // Vocabulario ya aprendido se pregunta al revés (español → inglés), que cuesta más.
      const modo = p && estado?.rep >= 2 ? 'es-en' : 'en-es';
      const nota = await mostrarTarjeta(caja, {
        tipo: p ? 'v' : 'g', modo, palabra: p, gramatica: g, estado,
        posicion: `Quedan ${cola.length + 1} · ${hechas} repasadas`,
      });
      progreso.calificar(t.id, nota, p ? 'v' : 'g');
      hechas++;
      if (nota >= 2) bien++;
      else cola.push({ id: t.id }); // la fallada vuelve al final de esta sesión
      if (hechas > 400) break;
    }
    pintarResumen();
    pintarDificiles();
    caja.textContent = '';
    caja.append(el('div', { clase: 'in-final' },
      el('p', { clase: 'in-final__icono', 'aria-hidden': 'true', texto: '✅' }),
      el('h3', { texto: hechas ? 'Repaso del día terminado' : 'No hay nada que repasar ahora' }),
      el('p', { texto: hechas ? `${hechas} repasos, ${bien} recordadas a la primera o tras volver a verlas.` : 'Vuelve más tarde o añade vocabulario nuevo.' })));
    if (hechas) anunciar('Repaso terminado.', 'ok');
  }

  const { vencidas, nuevas, total } = pintarResumen();
  pintarDificiles();
  caja.textContent = '';
  if (!total) {
    caja.append(el('div', { clase: 'in-final' },
      el('p', { clase: 'in-final__icono', 'aria-hidden': 'true', texto: '🗂️' }),
      el('h3', { texto: 'Tu mazo está vacío' }),
      el('p', { texto: 'Completa una lección (sus tarjetas de gramática entran solas) o estudia un tema de vocabulario.' }),
      el('div', { clase: 'in-final__acciones' },
        el('a', { clase: 'in-btn in-btn--primario', href: `${base}/ingles/vocabulario`, texto: 'Elegir vocabulario' }),
        el('a', { clase: 'in-btn', href: `${base}/ingles`, texto: 'Ir al curso' }))));
    return;
  }
  const b = el('button', { type: 'button', clase: 'in-btn in-btn--primario', texto: vencidas.length + nuevas.length ? `Empezar el repaso (${vencidas.length + nuevas.length})` : 'No hay tarjetas pendientes ahora' });
  b.disabled = !(vencidas.length + nuevas.length);
  b.addEventListener('click', empezar);
  caja.append(el('div', { clase: 'in-final' }, b));
}
