/**
 * Academia de Comandos · Cimientos comunes de los videojuegos
 * ---------------------------------------------------------------------
 * Los juegos NO implementan su propio intérprete de comandos: reutilizan
 * el mismo motor que la terminal de práctica y las misiones. Aquí vive lo
 * que todos comparten: cargar datos, montar un escenario, pintar el HUD,
 * dar pistas y guardar el progreso.
 *
 * Phaser se carga solo cuando un juego lo necesita de verdad (y una sola
 * vez por página), así que las pantallas que son HTML no pagan 1,3 MB.
 */

import { montarEscenario, reiniciarEscenario, Terminal, ArbolVisual } from './terminal.js';
import { registroLinux } from './shell-linux.js';
import { Progreso } from './progreso.js';
import { Mision, evaluar } from './misiones.js';

let cacheDatos = null;
let promesaPhaser = null;

export const RUTA_DATOS = (base) => `${base}/assets/academia/data`;

/** Carga y cachea los JSON del módulo. */
export async function cargarDatos(base) {
  if (cacheDatos) return cacheDatos;
  const ruta = RUTA_DATOS(base);
  const [comandosLinux, escenarios, misiones, juegos] = await Promise.all([
    fetch(`${ruta}/comandos-linux.json`).then(r => r.json()).catch(() => ({ comandos: [] })),
    fetch(`${ruta}/escenarios.json`).then(r => r.json()).catch(() => ({ escenarios: [] })),
    fetch(`${ruta}/misiones.json`).then(r => r.json()).catch(() => ({ misiones: [] })),
    fetch(`${ruta}/juegos.json`).then(r => r.json()).catch(() => ({ juegos: [] })),
  ]);
  cacheDatos = { comandosLinux, escenarios: escenarios.escenarios || [], misiones: misiones.misiones || [], juegos: juegos.juegos || [] };
  return cacheDatos;
}

/** Registro de comandos del shell pedido; los de Windows se cargan a demanda. */
export async function registroDe(os) {
  if (os === 'linux') return registroLinux();
  if (os === 'cmd') {
    const m = await import('./shell-cmd.js');
    return m.registroCmd();
  }
  const m = await import('./shell-powershell.js');
  return m.registroPs();
}

/** Monta el escenario indicado y devuelve {vfs, shell}. */
export async function prepararEscenario(escenarios, id, osPorDefecto = 'linux') {
  const escenario = escenarios.find(e => e.id === id)
    || escenarios.find(e => e.os === osPorDefecto)
    || escenarios[0];
  if (!escenario) throw new Error('No hay escenarios disponibles');
  const registro = await registroDe(escenario.os);
  return { escenario, ...montarEscenario(escenario, registro) };
}

/** Carga Phaser desde el vendor local. Nunca desde una CDN. */
export function cargarPhaser(base) {
  if (window.Phaser) return Promise.resolve(window.Phaser);
  if (promesaPhaser) return promesaPhaser;
  promesaPhaser = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${base}/assets/vendor/phaser/phaser-4.2.1.min.js`;
    script.onload = () => resolve(window.Phaser);
    script.onerror = () => reject(new Error('No se pudo cargar Phaser'));
    document.head.append(script);
  });
  return promesaPhaser;
}

/** Paleta CODLYX para que los juegos no desentonen con el sitio. */
export const PALETA = {
  fondo: 0x0b1017, panel: 0x111925, linea: 0x22303c,
  acento: 0x19e6a4, acento2: 0x38bdf8, aviso: 0xfbbf24,
  error: 0xf87171, violeta: 0xa78bfa, texto: 0xe3ebf1, tenue: 0x8fa0ae,
};
export const PALETA_CSS = {
  fondo: '#0B1017', panel: '#111925', acento: '#19E6A4', acento2: '#38BDF8',
  aviso: '#FBBF24', error: '#F87171', violeta: '#A78BFA', texto: '#E3EBF1', tenue: '#8FA0AE',
};

/**
 * HUD común: marcador, nivel, tiempo, botones de pista/solución/reinicio.
 * Devuelve la API que usa el juego para actualizarlo.
 */
export function crearHud(contenedor, { juego, nivel, alReiniciar, alPista, alSolucion, conTiempo = false }) {
  const hud = document.createElement('div');
  hud.className = 'ac-hud';
  hud.innerHTML = `
    <div class="ac-hud__datos">
      <span class="ac-hud__dato"><b data-hud-nivel>${nivel?.nombre || ''}</b></span>
      <span class="ac-hud__dato">Puntos <b data-hud-puntos>0</b></span>
      ${conTiempo ? '<span class="ac-hud__dato">Tiempo <b data-hud-tiempo>0:00</b></span>' : ''}
    </div>
    <div class="ac-hud__acciones">
      <button type="button" class="ac-btn ac-btn--fino" data-hud-pista>Pista</button>
      <button type="button" class="ac-btn ac-btn--fino" data-hud-solucion>Ver solución</button>
      <button type="button" class="ac-btn ac-btn--fino" data-hud-reinicio>Reiniciar</button>
    </div>`;
  contenedor.prepend(hud);

  const avisos = document.createElement('div');
  avisos.className = 'ac-hud__avisos';
  avisos.setAttribute('role', 'status');
  avisos.setAttribute('aria-live', 'polite');
  hud.after(avisos);

  const refs = {
    puntos: hud.querySelector('[data-hud-puntos]'),
    tiempo: hud.querySelector('[data-hud-tiempo]'),
    nivel: hud.querySelector('[data-hud-nivel]'),
  };
  hud.querySelector('[data-hud-pista]').addEventListener('click', () => alPista && alPista());
  hud.querySelector('[data-hud-solucion]').addEventListener('click', () => alSolucion && alSolucion());
  hud.querySelector('[data-hud-reinicio]').addEventListener('click', () => alReiniciar && alReiniciar());

  return {
    elemento: hud,
    puntos(valor) { if (refs.puntos) refs.puntos.textContent = String(valor); },
    tiempo(segundos) {
      if (!refs.tiempo) return;
      const m = Math.floor(segundos / 60);
      const s = String(Math.floor(segundos % 60)).padStart(2, '0');
      refs.tiempo.textContent = `${m}:${s}`;
    },
    nivel(texto) { if (refs.nivel) refs.nivel.textContent = texto; },
    aviso(html, tono = 'info') {
      const caja = document.createElement('div');
      caja.className = 'ac-aviso ac-aviso--' + tono;
      caja.innerHTML = html;
      avisos.prepend(caja);
      while (avisos.childElementCount > 4) avisos.lastElementChild.remove();
      return caja;
    },
    limpiarAvisos() { avisos.innerHTML = ''; },
  };
}

/** Pantalla de victoria común, con el resumen de lo aprendido. */
export function pantallaVictoria(contenedor, { titulo, texto, puntos, xp, alSiguiente, alRepetir, siguienteNombre }) {
  const caja = document.createElement('div');
  caja.className = 'ac-victoria';
  caja.setAttribute('role', 'dialog');
  caja.setAttribute('aria-label', 'Nivel superado');
  caja.innerHTML = `
    <div class="ac-victoria__panel">
      <p class="ac-victoria__icono" aria-hidden="true">🏆</p>
      <h3>${titulo}</h3>
      <p class="ac-victoria__texto">${texto}</p>
      <p class="ac-victoria__marcador"><b>${puntos}</b> puntos · <b>+${xp}</b> XP</p>
      <div class="ac-victoria__acciones">
        <button type="button" class="ac-btn" data-repetir>Repetir</button>
        ${alSiguiente ? `<button type="button" class="ac-btn ac-btn--primario" data-siguiente>Siguiente: ${siguienteNombre || 'nivel'}</button>` : ''}
      </div>
    </div>`;
  contenedor.append(caja);
  caja.querySelector('[data-repetir]').addEventListener('click', () => { caja.remove(); alRepetir && alRepetir(); });
  const btn = caja.querySelector('[data-siguiente]');
  if (btn) btn.addEventListener('click', () => { caja.remove(); alSiguiente(); });
  requestAnimationFrame(() => (btn || caja.querySelector('[data-repetir]')).focus());
  return caja;
}

/** Guarda el nivel y devuelve el XP concedido (menos si hubo ayuda). */
export function completarNivel(progreso, juegoSlug, nivel, { puntos = 0, tiempo = 0, pistas = 0, solucion = false }) {
  const base = nivel.xp || 25;
  const xp = solucion ? Math.round(base * 0.25) : Math.max(5, Math.round(base * (1 - Math.min(pistas * 0.2, 0.6))));
  progreso.registrarNivel(juegoSlug, nivel.id, { completado: true, puntos, tiempo });
  progreso.sumarXp(xp);
  return xp;
}

export { montarEscenario, reiniciarEscenario, Terminal, ArbolVisual, Progreso, Mision, evaluar };
