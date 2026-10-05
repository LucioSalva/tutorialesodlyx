/**
 * Vista: lección. Monta los ejercicios, registra cada intento y, al llegar
 * al 80 % de ejercicios resueltos, da la lección por completada y mete sus
 * tarjetas de gramática en el repaso espaciado.
 */
import { montarEjercicio } from '../ejercicios.js';
import { esAutocorregible } from '../evaluador.js';
import { decirNavegador, explicarError } from '../voz.js';

export function montar(cfg, { progreso, anunciar }) {
  progreso.visitar({ url: location.pathname, titulo: `Unidad ${cfg.unidadNum} · ${cfg.titulo}`, tipo: 'leccion', leccion: cfg.leccion });

  const porId = new Map((cfg.ejercicios || []).map(e => [e.id, e]));
  const autocorregibles = (cfg.ejercicios || []).filter(esAutocorregible).map(e => e.id);
  const marcador = document.querySelector('[data-marcador-leccion]');
  const cuentaIndice = document.querySelector('[data-cuenta-ejercicios]');
  const estadoLeccion = document.querySelector('[data-estado-leccion]');

  const pintar = () => {
    const resueltos = autocorregibles.filter(id => progreso.ejercicio(id)?.resuelto).length;
    const total = autocorregibles.length;
    if (marcador) marcador.textContent = `${resueltos} de ${total} ejercicios resueltos · la lección se completa al llegar al 80 %`;
    if (cuentaIndice) cuentaIndice.textContent = `${resueltos}/${total}`;
    const l = progreso.leccion(cfg.leccion);
    if (estadoLeccion) {
      estadoLeccion.textContent = l?.completada
        ? '✓ Lección completada. Sus tarjetas ya están en tu repaso.'
        : `Te faltan ${Math.max(0, Math.ceil(total * 0.8) - resueltos)} ejercicios resueltos para completar la lección.`;
    }
  };

  const revisarCompletada = () => {
    if (progreso.revisarLeccion(cfg.leccion, autocorregibles)) {
      const nuevas = progreso.anadirTarjetas((cfg.repaso || []).map(r => r.id), 'g');
      anunciar(`Lección completada. ${nuevas} tarjetas de gramática añadidas a tu repaso.`, 'ok');
    }
    // Si se completó en otra visita pero faltaban tarjetas (por ejemplo, tras importar), se añaden.
    if (progreso.leccion(cfg.leccion)?.completada) progreso.anadirTarjetas((cfg.repaso || []).map(r => r.id), 'g');
    pintar();
  };

  document.querySelectorAll('[data-ej]').forEach(nodo => {
    const ej = porId.get(nodo.dataset.ej);
    if (!ej) return;
    montarEjercicio(nodo, ej, {
      modo: 'practica',
      progreso,
      alResolver: (id, res, info) => {
        progreso.intento(id, esAutocorregible(ej) ? !!res.correcto : null, { pistas: info.pistas });
        revisarCompletada();
      },
      alSolucion: (id) => { progreso.verSolucion(id); pintar(); },
      alReintentar: (id) => { progreso.reiniciarEjercicio(id); pintar(); },
    });
  });
  revisarCompletada();

  // Práctica comunicativa
  const turno = document.querySelector('[data-turno]');
  if (turno) {
    const texto = turno.querySelector('[data-turno-texto]');
    const btnModelo = turno.querySelector('[data-turno-modelo]');
    const modelo = turno.querySelector('#turno-modelo');
    btnModelo?.addEventListener('click', () => {
      modelo.hidden = !modelo.hidden;
      btnModelo.setAttribute('aria-expanded', String(!modelo.hidden));
      btnModelo.textContent = modelo.hidden ? 'Ver una respuesta modelo' : 'Ocultar la respuesta modelo';
    });
    turno.querySelector('[data-turno-oir]')?.addEventListener('click', async () => {
      if (!texto.value.trim()) { anunciar('Escribe primero tu respuesta.', 'aviso'); return; }
      // Texto propio del estudiante: no puede tener audio pregenerado.
      try { await decirNavegador(texto.value); } catch (e) { anunciar(explicarError(e), 'aviso'); }
    });
  }

  // Índice activo según la sección visible
  const enlaces = [...document.querySelectorAll('[data-indice] a')];
  const secciones = enlaces.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && secciones.length) {
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach(en => {
        if (!en.isIntersecting) return;
        enlaces.forEach(a => a.classList.toggle('es-activo', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    secciones.forEach(s => obs.observe(s));
  }

  // Estado de las otras lecciones de la unidad en el índice lateral
  document.querySelectorAll('[data-leccion-enlace]').forEach(a => {
    if (progreso.leccion(a.dataset.leccionEnlace)?.completada) a.classList.add('es-completada');
  });
}
