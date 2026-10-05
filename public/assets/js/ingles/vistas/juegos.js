/**
 * Vistas: índice de juegos y partida. Los módulos de juego se cargan bajo
 * demanda desde una lista cerrada: el slug nunca se concatena a una ruta
 * sin estar en ella.
 */
const MODULOS = {
  'ordena-la-oracion': () => import('../juegos/ordena-la-oracion.js'),
  'encuentra-el-error': () => import('../juegos/encuentra-el-error.js'),
  'escucha-y-selecciona': () => import('../juegos/escucha-y-selecciona.js'),
  'memoria-de-vocabulario': () => import('../juegos/memoria-de-vocabulario.js'),
  'completa-el-dialogo': () => import('../juegos/completa-el-dialogo.js'),
  'detective-gramatical': () => import('../juegos/detective-gramatical.js'),
  'construye-la-pregunta': () => import('../juegos/construye-la-pregunta.js'),
  'viaje-interactivo': () => import('../juegos/viaje-interactivo.js'),
  'desafio-de-tiempos': () => import('../juegos/desafio-de-tiempos.js'),
  'mision-final': () => import('../juegos/mision-final.js'),
};

export async function montar(cfg, { progreso, base, anunciar }) {
  if (cfg.vista === 'juegos') {
    document.querySelectorAll('[data-juego-tarjeta]').forEach(li => {
      const niveles = li.dataset.niveles.split(',');
      const j = progreso.datos.juegos[li.dataset.juegoTarjeta];
      const hechos = j ? niveles.filter(n => j.niveles[n]?.superado).length : 0;
      li.querySelector('[data-juego-avance]').textContent = `${hechos} superados`;
    });
    return;
  }

  const juego = cfg.juego;
  progreso.visitar({ url: location.pathname, titulo: 'Juego: ' + juego.nombre, tipo: 'juego' });
  const cargar = MODULOS[juego.slug];
  if (!cargar) return;
  const modulo = await cargar();
  const lienzo = document.querySelector('[data-juego]');
  const selector = document.querySelector('[data-selector-nivel]');
  const estado = document.querySelector('[data-nivel-estado]');

  const pintarEstado = () => {
    const n = progreso.datos.juegos[juego.slug]?.niveles?.[selector.value];
    estado.textContent = n ? (n.superado ? `✓ Superado · mejor: ${n.mejor} puntos` : `Intentado · mejor: ${n.mejor} puntos`) : '';
  };
  // Empieza en el primer nivel no superado.
  const primero = juego.niveles.find(n => !progreso.datos.juegos[juego.slug]?.niveles?.[n.id]?.superado);
  if (primero) selector.value = primero.id;
  pintarEstado();
  selector.addEventListener('change', pintarEstado);

  const jugar = async (id) => {
    const i = juego.niveles.findIndex(n => String(n.id) === String(id));
    const nivel = juego.niveles[i];
    if (!nivel) return;
    selector.value = nivel.id;
    const siguiente = juego.niveles[i + 1];
    lienzo._partida?.abort(); // corta cualquier partida anterior (también la de memoria)
    try {
      await modulo.iniciar(lienzo, {
        juego, nivel, progreso, base,
        alSiguienteNivel: siguiente ? () => jugar(siguiente.id) : null,
      });
    } catch (e) {
      console.error(e);
      anunciar('No se pudo iniciar el juego.', 'aviso');
    }
    pintarEstado();
  };
  document.querySelector('[data-empezar]').addEventListener('click', () => jugar(selector.value));
}
