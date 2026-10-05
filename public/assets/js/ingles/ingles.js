/**
 * Academia de Inglés · Arranque de las páginas
 * ---------------------------------------------------------------------
 * Cada vista trae su configuración en <script type="application/json"
 * data-ingles-config> (JSON que el navegador NO ejecuta). Aquí se lee, se
 * activan las piezas comunes (audio, diálogos, tiempo de estudio, contador
 * de repasos) y se carga SOLO el módulo de la vista actual: una lección no
 * descarga el código de los juegos ni el de las tarjetas.
 */

import { Progreso } from './progreso.js';
import { activarBotones, decirSecuencia, callar, explicarError, cargarConfig, preferencias } from './voz.js';

const progreso = new Progreso();
const BASE = document.body.dataset.base || '';

function configuracion() {
  const nodo = document.querySelector('script[data-ingles-config]');
  if (!nodo) return {};
  try { return JSON.parse(nodo.textContent) || {}; } catch { return {}; }
}

/** Avisos breves accesibles (región aria-live). */
export function anunciar(texto, tono = 'info') {
  let region = document.querySelector('[data-in-anuncios]');
  if (!region) {
    region = document.createElement('div');
    region.className = 'in-anuncios';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.dataset.inAnuncios = '';
    document.body.append(region);
  }
  const caja = document.createElement('div');
  caja.className = 'in-anuncio in-anuncio--' + tono;
  caja.textContent = texto;
  region.append(caja);
  setTimeout(() => caja.classList.add('se-va'), 4200);
  setTimeout(() => caja.remove(), 4800);
}

/* ------------------------------------------------------------- diálogos */
function activarDialogos() {
  document.addEventListener('click', async (ev) => {
    const completo = ev.target.closest('[data-dialogo-completo]');
    if (completo) {
      const dialogo = completo.closest('.in-dialogo');
      const lineas = [...dialogo.querySelectorAll('.in-burbuja')];
      const items = lineas.map(li => {
        const b = li.querySelector('[data-decir]');
        return { texto: b?.dataset.decir || '', rol: b?.dataset.rol || 'n' };
      }).filter(x => x.texto);
      if (completo.classList.contains('es-sonando')) { callar(); return; }
      completo.classList.add('es-sonando');
      try {
        await decirSecuencia(items, (i) => lineas.forEach((li, k) => li.classList.toggle('es-sonando', k === i)));
      } catch (e) { anunciar(explicarError(e), 'aviso'); }
      completo.classList.remove('es-sonando');
      return;
    }
    const trad = ev.target.closest('[data-traducciones]');
    if (trad) {
      const dialogo = trad.closest('.in-dialogo');
      const visible = dialogo.classList.toggle('con-traduccion');
      trad.setAttribute('aria-pressed', String(visible));
      trad.textContent = visible ? 'Ocultar traducción' : 'Mostrar traducción';
    }
  });
}

/* ----------------------------------------------------- tiempo de estudio */
/**
 * Cuenta segundos solo si la pestaña está visible Y hubo actividad (tecla,
 * clic, desplazamiento, toque o audio) en los últimos 90 segundos. Una
 * pestaña olvidada no suma tiempo.
 */
function medirTiempo() {
  let ultimaActividad = Date.now();
  const marcar = () => { ultimaActividad = Date.now(); };
  ['keydown', 'pointerdown', 'scroll', 'touchstart', 'input'].forEach(t => window.addEventListener(t, marcar, { passive: true }));
  const PASO = 15;
  setInterval(() => {
    if (document.visibilityState === 'visible' && Date.now() - ultimaActividad < 90000) {
      progreso.sumarTiempo(PASO);
    }
  }, PASO * 1000);
}

function pintarRepasosPendientes() {
  const n = progreso.pendientes({ limite: 999 }).length;
  document.querySelectorAll('[data-repasos-pendientes]').forEach(nodo => {
    nodo.hidden = n === 0;
    nodo.textContent = String(n);
    nodo.setAttribute('aria-label', `${n} repasos pendientes`);
  });
}

/* --------------------------------------------------------------- vistas */
const VISTAS = {
  inicio: () => import('./vistas/inicio.js'),
  unidad: () => import('./vistas/unidad.js'),
  leccion: () => import('./vistas/leccion.js'),
  evaluacion: () => import('./vistas/evaluacion.js'),
  examen: () => import('./vistas/evaluacion.js'),
  vocabulario: () => import('./vistas/vocabulario.js'),
  tema: () => import('./vistas/vocabulario.js'),
  tarjetas: () => import('./vistas/tarjetas.js'),
  repaso: () => import('./vistas/repaso.js'),
  pronunciacion: () => import('./vistas/pronunciacion.js'),
  lectura: () => import('./vistas/practicas.js'),
  escucha: () => import('./vistas/practicas.js'),
  escritura: () => import('./vistas/practicas.js'),
  conversacion: () => import('./vistas/conversacion.js'),
  practica: () => import('./vistas/practicas.js'),
  juegos: () => import('./vistas/juegos.js'),
  juego: () => import('./vistas/juegos.js'),
  progreso: () => import('./vistas/progreso.js'),
  audio: () => import('./vistas/audio.js'),
};

async function arrancar() {
  const cfg = configuracion();
  activarBotones(document, (m) => anunciar(m, 'aviso'));
  activarDialogos();
  medirTiempo();
  pintarRepasosPendientes();
  progreso.alCambiar(pintarRepasosPendientes);

  // voces.json: quién habla con qué voz. Antes de montar la vista para que
  // diálogos y juegos repartan bien las voces.
  try {
    const c = await cargarConfig();
    const resumen = () => {
      const p = preferencias();
      document.querySelectorAll('[data-voz-resumen]').forEach(n => {
        n.textContent = `· ${p.acento === 'gb' ? 'UK' : 'US'} ${String(p.velocidad).replace('.', ',')}×`;
        n.title = `${c.acentos[p.acento]?.nombre || ''} a ${p.velocidad}×`;
      });
    };
    resumen();
    document.addEventListener('ingles:voz-cambiada', resumen);
  } catch { /* los botones avisarán si falta */ }

  const cargar = VISTAS[cfg.vista];
  if (!cargar) return;
  try {
    const modulo = await cargar();
    await modulo.montar(cfg, { progreso, anunciar, base: BASE });
  } catch (e) {
    console.error('[Inglés]', e);
    anunciar('Algo falló al cargar la parte interactiva de esta página. El contenido sigue disponible.', 'aviso');
  }
}

arrancar();
