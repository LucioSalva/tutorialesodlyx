/**
 * Vistas: índice de práctica, lectura, escucha y escritura.
 *
 * En la escucha, la transcripción y la traducción NO se muestran hasta que
 * el estudiante haya escuchado el audio y comprobado al menos una respuesta.
 */
import { montarEjercicio } from '../ejercicios.js';
import { esAutocorregible } from '../evaluador.js';
import { montarReproductor } from '../reproductor.js';

export function montar(cfg, ctx) {
  const { progreso } = ctx;
  if (cfg.vista === 'practica') {
    document.querySelectorAll('[data-practica]').forEach(a => {
      if (progreso.datos.practicas[a.dataset.practica]?.completada) a.classList.add('es-hecho');
    });
    return;
  }
  progreso.visitar({ url: location.pathname, titulo: cfg.titulo, tipo: cfg.vista });

  const ejercicios = cfg.ejercicios || [];
  const autocorregibles = ejercicios.filter(esAutocorregible).map(e => e.id);
  const marcador = document.querySelector('[data-marcador-practica]');
  let comprobadas = 0;

  const pintar = () => {
    if (!marcador) return;
    const bien = autocorregibles.filter(id => progreso.ejercicio(id)?.resuelto).length;
    marcador.textContent = `${bien} de ${autocorregibles.length} preguntas resueltas`;
    if (autocorregibles.length && bien === autocorregibles.length) {
      progreso.registrarPractica(cfg.clave, { aciertos: bien, total: autocorregibles.length });
    }
  };

  const porId = new Map(ejercicios.map(e => [e.id, e]));
  document.querySelectorAll('[data-ej]').forEach(nodo => {
    const ej = porId.get(nodo.dataset.ej);
    if (!ej) return;
    montarEjercicio(nodo, ej, {
      modo: 'practica', progreso,
      alResolver: (id, res, info) => {
        comprobadas++;
        progreso.intento(id, esAutocorregible(ej) ? !!res.correcto : null, { pistas: info.pistas });
        pintar();
        desbloquear();
      },
      alSolucion: (id) => { progreso.verSolucion(id); comprobadas++; desbloquear(); pintar(); },
      alReintentar: (id) => { progreso.reiniciarEjercicio(id); pintar(); },
    });
    if (cfg.vista === 'escritura') {
      nodo.addEventListener('escritura-revisada', () => progreso.registrarPractica(cfg.clave, { aciertos: 0, total: 0 }));
    }
  });
  pintar();

  if (cfg.vista === 'lectura') montarLectura(ctx);
  if (cfg.vista === 'escucha') montarEscucha(ctx);

  // ------------------------------------------------------------- escucha
  let escuchado = false;
  function desbloquear() {
    if (cfg.vista !== 'escucha' || !escuchado || comprobadas < 1) return;
    const bloqueo = document.querySelector('[data-transcripcion-bloqueada]');
    const trans = document.querySelector('[data-transcripcion]');
    if (trans?.hidden) {
      trans.hidden = false;
      bloqueo?.remove();
      ctx.anunciar('Transcripción desbloqueada.', 'ok');
    }
  }

  async function montarEscucha({ base }) {
    const caja = document.querySelector('[data-reproductor]');
    const estado = document.querySelector('[data-estado-audio]');
    if (!caja) return;
    const lineas = () => [...document.querySelectorAll('[data-transcripcion] .in-burbuja')];
    await montarReproductor(caja, {
      tipo: 'escucha', slug: caja.dataset.slug, base, titulo: cfg.titulo,
      // «Escuchado» = se oyó al menos el 90 % del audio (o hasta el final).
      alEscuchar: (fraccion) => {
        if (!escuchado && fraccion >= 0.9) {
          escuchado = true;
          estado.textContent = 'Audio escuchado. Responde las preguntas; puedes volver a escucharlo cuando quieras.';
          desbloquear();
        }
      },
      // La línea que suena se resalta solo si la transcripción ya está visible.
      alSegmento: (i) => lineas().forEach((li, k) => li.classList.toggle('es-sonando', k === i)),
      alError: () => {
        // Sin audio no se puede exigir escucharlo: la transcripción se libera al intentar responder.
        escuchado = true;
        estado.textContent = 'El audio de este ejercicio no está disponible ahora. La transcripción se desbloqueará cuando intentes responder.';
        desbloquear();
      },
    });
  }
}

async function montarLectura({ base, anunciar }) {
  const btnTrad = document.querySelector('[data-traduccion-lectura]');
  btnTrad?.addEventListener('click', () => {
    const mostrar = btnTrad.getAttribute('aria-pressed') !== 'true';
    btnTrad.setAttribute('aria-pressed', String(mostrar));
    btnTrad.textContent = mostrar ? 'Ocultar traducción' : 'Mostrar traducción';
    document.querySelectorAll('[data-parrafo-es]').forEach(p => { p.hidden = !mostrar; });
  });

  const caja = document.querySelector('[data-reproductor]');
  if (!caja) return;
  let frases = [];
  const rep = await montarReproductor(caja, {
    tipo: 'lecturas', slug: caja.dataset.slug, base, titulo: document.querySelector('h1')?.textContent || 'la lectura',
    alSegmento: (i) => frases.forEach((f, k) => f?.classList.toggle('es-sonando', k === i)),
    alError: (m) => anunciar(m, 'aviso'),
  });
  frases = envolverFrases(rep.segmentos || []);
  if (frases.some(Boolean)) {
    document.querySelector('[data-sinc-nota]')?.removeAttribute('hidden');
    frases.forEach((f, i) => {
      if (!f) return;
      f.tabIndex = 0;
      f.setAttribute('role', 'button');
      f.setAttribute('aria-label', 'Escuchar desde: ' + f.textContent);
      const ir = () => rep.irASegmento(i);
      f.addEventListener('click', ir);
      f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(); } });
    });
  }
}

/**
 * Envuelve cada frase de la lectura en un <span> usando los segmentos de la
 * pista (texto exacto + párrafo). Si una frase no se encuentra tal cual, no
 * se envuelve: nunca se resalta algo que no corresponde al audio.
 */
function envolverFrases(segmentos) {
  const parrafos = [...document.querySelectorAll('[data-parrafo]')];
  // Los segmentos son consecutivos: el texto anterior de cada párrafo ya está
  // envuelto, así que el primer nodo de texto que contiene la frase es el suyo.
  return segmentos.map((s) => {
    const p = parrafos[s.parrafo];
    const nodo = p && [...p.childNodes].find(n => n.nodeType === 3 && n.textContent.includes(s.texto));
    if (!nodo) return null;
    const frase = nodo.splitText(nodo.textContent.indexOf(s.texto));
    frase.splitText(s.texto.length);
    const span = document.createElement('span');
    span.className = 'in-frase-sinc';
    frase.replaceWith(span);
    span.append(frase);
    return span;
  });
}
