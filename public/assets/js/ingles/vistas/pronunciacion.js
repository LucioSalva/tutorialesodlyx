/**
 * Vista: pronunciación (índice y sección). En la sección: ejercicios de
 * práctica y el juego rápido de pares mínimos «¿Cuál suena?».
 */
import { montarEjercicio } from '../ejercicios.js';
import { esAutocorregible } from '../evaluador.js';
import { decir, explicarError } from '../voz.js';

export function montar(cfg, { progreso, anunciar }) {
  if (!cfg.seccion) {
    // Índice: marca las secciones con toda su práctica autocorregible resuelta
    // (la de repetir en voz alta no se puede corregir, así que no cuenta).
    for (const s of cfg.secciones || []) {
      const hecha = s.ejercicios.length > 0 && s.ejercicios.every(id => progreso.ejercicio(id)?.resuelto);
      if (hecha) document.querySelector(`[data-seccion="${CSS.escape(s.slug)}"]`)?.classList.add('es-hecho');
    }
    return;
  }

  progreso.visitar({ url: location.pathname, titulo: 'Pronunciación: ' + cfg.titulo, tipo: 'pronunciacion' });
  const porId = new Map((cfg.ejercicios || []).map(e => [e.id, e]));
  document.querySelectorAll('[data-ej]').forEach(nodo => {
    const ej = porId.get(nodo.dataset.ej);
    if (!ej) return;
    montarEjercicio(nodo, ej, {
      modo: 'practica', progreso,
      alResolver: (id, res, info) => progreso.intento(id, esAutocorregible(ej) ? !!res.correcto : null, { pistas: info.pistas }),
      alSolucion: (id) => progreso.verSolucion(id),
      alReintentar: (id) => progreso.reiniciarEjercicio(id),
    });
  });

  // «¿Cuál suena?»: se dice una palabra del par al azar y el estudiante elige.
  const marcador = document.querySelector('[data-pares-marcador]');
  let aciertos = 0; let intentos = 0;
  document.querySelectorAll('[data-cual]').forEach(boton => {
    const par = cfg.pares[Number(boton.dataset.cual)];
    const fila = boton.closest('[data-par]');
    boton.addEventListener('click', async () => {
      const cual = Math.random() < 0.5 ? 'a' : 'b';
      fila.dataset.suena = cual;
      fila.querySelectorAll('.in-par__lado').forEach(l => l.classList.remove('es-ok', 'es-mal'));
      boton.textContent = 'Escuchando… elige la palabra';
      try { await decir(par[cual]); } catch (e) { anunciar(explicarError(e), 'aviso'); }
      boton.textContent = 'Otra vez';
    });
    fila.querySelectorAll('.in-par__lado').forEach((lado, k) => {
      lado.style.cursor = 'pointer';
      lado.setAttribute('tabindex', '0');
      lado.setAttribute('role', 'button');
      lado.setAttribute('aria-label', `Elegir «${par[k ? 'b' : 'a']}»`);
      const elegir = (ev) => {
        if (ev.target.closest('[data-decir]') || !fila.dataset.suena) return;
        const ok = (k ? 'b' : 'a') === fila.dataset.suena;
        intentos++; if (ok) aciertos++;
        lado.classList.add(ok ? 'es-ok' : 'es-mal');
        marcador.textContent = `${ok ? '✓ Correcto' : `✗ Sonó «${par[fila.dataset.suena]}»`} · llevas ${aciertos} de ${intentos}`;
        delete fila.dataset.suena;
      };
      lado.addEventListener('click', elegir);
      lado.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); elegir(ev); } });
    });
  });
}
