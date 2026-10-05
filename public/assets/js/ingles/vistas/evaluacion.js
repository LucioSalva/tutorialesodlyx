/**
 * Vista: evaluación de unidad y examen de bloque (mismo motor).
 * Sin pistas ni soluciones hasta corregir. Al corregir: porcentaje,
 * desglose por habilidad y por tema, cada pregunta explicada y la lista
 * concreta de lecciones o unidades que conviene repasar.
 */
import { montarEjercicio, el } from '../ejercicios.js';
import { canonica } from '../texto.js';

const HABILIDADES = { gramatica: 'Gramática', vocabulario: 'Vocabulario', comprension: 'Comprensión', interpretacion: 'Interpretación', produccion: 'Producción' };

/** ¿El estudiante ha contestado algo en esta pregunta? */
function respondida(ej, r) {
  if (r === null || r === undefined) return false;
  if (typeof r === 'number') return r >= 0;
  if (typeof r === 'string') return canonica(r) !== '';
  if (Array.isArray(r)) return r.some(v => canonica(v) !== '');
  if (ej.tipo === 'corregir') return !!r.seleccion;
  if (ej.tipo === 'relacionar') return Object.values(r).some(Boolean);
  return false;
}

export function montar(cfg, { progreso, anunciar }) {
  progreso.visitar({ url: location.pathname, titulo: cfg.titulo, tipo: cfg.vista });
  const preguntas = cfg.preguntas || [];
  const porId = new Map(preguntas.map(q => [q.id, q]));
  const montados = [];
  document.querySelectorAll('[data-ej]').forEach(nodo => {
    const ej = porId.get(nodo.dataset.ej);
    if (!ej) return;
    montados.push({ nodo, ej, api: montarEjercicio(nodo, ej, { modo: 'examen' }) });
  });

  const cuenta = document.querySelector('[data-eval-cuenta]');
  const barra = document.querySelector('[data-eval-barra]');
  const btnTerminar = document.querySelector('[data-eval-terminar]');
  const contar = () => montados.filter(m => respondida(m.ej, m.api.respuesta())).length;
  const pintarCuenta = () => { cuenta.textContent = `${contar()} de ${montados.length} respondidas`; };
  ['input', 'change', 'click'].forEach(t => document.querySelector('.in-eval__lista')?.addEventListener(t, () => setTimeout(pintarCuenta, 0)));
  pintarCuenta();

  let confirmando = false;
  btnTerminar.addEventListener('click', () => {
    const faltan = montados.length - contar();
    if (faltan > 0 && !confirmando) {
      confirmando = true;
      cuenta.textContent = `Te faltan ${faltan} preguntas sin responder: contarán como incorrectas. Pulsa otra vez para corregir igualmente.`;
      btnTerminar.textContent = 'Corregir igualmente';
      return;
    }
    corregir();
  });

  function corregir() {
    const filas = montados.map(m => {
      const res = m.api.corregir();
      const ok = res.correcto === true;
      m.api.marcar(res);
      m.api.mostrarSolucion();
      m.nodo.classList.add(ok ? 'es-correcta-final' : 'es-incorrecta-final');
      const estado = m.nodo.querySelector('[data-ej-estado]');
      if (estado) {
        estado.textContent = ok ? 'Correcta' : (respondida(m.ej, m.api.respuesta()) ? 'Incorrecta' : 'Sin responder');
        estado.className = 'in-ej__estado ' + (ok ? 'es-ok' : 'es-mal-final');
      }
      if (!ok && res.mensaje && respondida(m.ej, m.api.respuesta())) {
        const caja = m.nodo.querySelector('.in-ej__feedback');
        if (caja) { caja.className = 'in-ej__feedback in-ej__feedback--mal'; caja.textContent = res.mensaje; }
      }
      return { ej: m.ej, ok };
    });

    const aciertos = filas.filter(f => f.ok).length;
    const pct = filas.length ? Math.round((aciertos / filas.length) * 100) : 0;
    const aprobado = pct >= (cfg.aprobado || 70);

    const agrupar = (clave) => {
      const g = {};
      for (const f of filas) {
        const k = f.ej[clave] || 'otro';
        g[k] = g[k] || { total: 0, ok: 0 };
        g[k].total++;
        if (f.ok) g[k].ok++;
      }
      return g;
    };
    const porHabilidad = agrupar('habilidad');
    const porTema = agrupar(cfg.campoTema);
    const repasar = Object.entries(porTema).filter(([, v]) => v.ok / v.total < 0.75).map(([k]) => k);

    progreso.registrarEvaluacion(cfg.id, { porcentaje: pct, aprobado, repasar });
    barra.hidden = true;
    document.querySelector('[data-eval-intro]')?.remove();

    const caja = document.querySelector('[data-resultado]');
    caja.hidden = false;
    caja.textContent = '';
    const r = el('section', { clase: 'in-resultado', 'aria-labelledby': 't-resultado', tabindex: '-1' });
    r.append(
      el('h2', { clase: 'in-h2', id: 't-resultado', texto: 'Resultado' }),
      el('div', { clase: 'in-resultado__nota' },
        el('span', { clase: 'in-resultado__pct ' + (aprobado ? 'es-ok' : 'es-mal'), texto: pct + ' %' }),
        el('span', { texto: `${aciertos} de ${filas.length} correctas · ${aprobado ? 'Aprobada' : `Para aprobar hace falta el ${cfg.aprobado} %`}` })),
    );

    const desglose = (titulo, grupos, nombre) => {
      const lista = el('ul', { clase: 'in-resultado__desglose' });
      for (const [k, v] of Object.entries(grupos)) {
        const p = Math.round((v.ok / v.total) * 100);
        const barraP = el('span', { clase: 'in-barra', 'aria-hidden': 'true' }, el('span', { clase: 'in-barra__relleno', style: `width:${p}%` }));
        lista.append(el('li', { clase: 'in-resultado__fila' }, el('span', { texto: nombre(k) }), barraP, el('span', { texto: `${v.ok}/${v.total}` })));
      }
      return el('div', {}, el('p', { clase: 'in-etiqueta', texto: titulo }), lista);
    };
    r.append(desglose('Por habilidad', porHabilidad, k => HABILIDADES[k] || k));
    r.append(desglose(cfg.campoTema === 'unidad' ? 'Por unidad' : 'Por lección', porTema, k => cfg.temas?.[k]?.titulo || k));

    if (repasar.length) {
      r.append(el('p', { clase: 'in-etiqueta', texto: 'Conviene repasar' }),
        el('ul', { clase: 'in-repasar' }, ...repasar.map(k => {
          const t = cfg.temas?.[k];
          return el('li', {}, t?.url ? el('a', { clase: 'in-enlace', href: t.url, texto: t.titulo }) : (t?.titulo || k));
        })));
    } else {
      r.append(el('p', { texto: 'No hay ningún tema por debajo del 75 %. Buen momento para pasar a lo siguiente.' }));
    }

    const soloMal = el('button', { type: 'button', clase: 'in-btn in-btn--fino', 'aria-pressed': 'false', texto: 'Ver solo las incorrectas' });
    soloMal.addEventListener('click', () => {
      const activo = soloMal.getAttribute('aria-pressed') !== 'true';
      soloMal.setAttribute('aria-pressed', String(activo));
      soloMal.textContent = activo ? 'Ver todas las preguntas' : 'Ver solo las incorrectas';
      montados.forEach(m => { m.nodo.hidden = activo && m.nodo.classList.contains('es-correcta-final'); });
    });
    r.append(el('div', { clase: 'in-ej__acciones' },
      el('button', { type: 'button', clase: 'in-btn in-btn--primario in-btn--fino', texto: 'Repetir la evaluación', onclick: () => location.reload() }),
      soloMal,
      el('a', { clase: 'in-btn in-btn--fino', href: cfg.unidadUrl, texto: 'Volver' })));
    r.append(el('p', { clase: 'in-nota-pie', html: 'Debajo tienes cada pregunta corregida, con la respuesta correcta y su explicación.' }));
    caja.append(r);
    r.focus();
    r.scrollIntoView({ behavior: 'smooth', block: 'start' });
    anunciar(`Resultado: ${pct} %. ${aprobado ? 'Aprobada.' : 'Repasa los temas indicados y vuelve a intentarlo.'}`, aprobado ? 'ok' : 'aviso');
  }
}
