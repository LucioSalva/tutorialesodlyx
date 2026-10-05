/**
 * Academia de Redes · Arranque de las páginas
 * ---------------------------------------------------------------------
 * Cada vista trae su configuración en <script type="application/json"
 * data-redes-config> (JSON que el navegador NO ejecuta). Se carga solo el
 * módulo de la vista actual, tomado de un mapa cerrado.
 */
const VISTAS = {
  inicio: () => import('./vistas/inicio.js'),
  modulo: () => import('./vistas/modulo.js'),
  leccion: () => import('./vistas/leccion.js'),
  practica: () => import('./vistas/practica.js'),
  examen: () => import('./vistas/examen.js'),
  herramientas: () => import('./vistas/herramientas.js'),
};

function configuracion() {
  const nodo = document.querySelector('script[data-redes-config]');
  if (!nodo) return {};
  try { return JSON.parse(nodo.textContent) || {}; } catch { return {}; }
}

const config = configuracion();
const cargar = Object.hasOwn(VISTAS, config.vista) ? VISTAS[config.vista] : null;
if (cargar) {
  cargar()
    .then((m) => m.iniciar(config, document.body.dataset.base || ''))
    .catch((e) => console.error('[Redes] No se pudo iniciar la vista:', e));
}
