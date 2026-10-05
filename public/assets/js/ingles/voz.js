/**
 * Academia de Inglés · Audio
 * ---------------------------------------------------------------------
 * Fuente PRINCIPAL: archivos MP3 pregenerados (voces neuronales Kokoro-82M,
 * ver docs/INGLES_AUDIO.md) que sirve el propio hosting. El estudiante no
 * necesita voces instaladas, cuentas ni complementos: el navegador recibe
 * un archivo y lo reproduce con <audio>.
 *
 *   texto + acento + rol  →  audio-ruta.js  →  assets/ingles/audio/…/hash.mp3
 *
 * Velocidad: playbackRate del propio <audio> con el tono preservado (no hay
 * copias por velocidad). «Lento» = 0,75×.
 *
 * Fuente SECUNDARIA (solo donde no puede existir un archivo, porque el texto
 * lo escribe el estudiante): la síntesis del navegador, con decirNavegador().
 * Se presenta siempre como «voz del navegador» y nunca sustituye en silencio
 * a un archivo que falta.
 */

import { rutaClip } from './audio-ruta.js';
import { fijarPersonajes } from './audio-textos.js';

const PREF = 'ingles:voz:v1';
export const VELOCIDADES = [0.75, 0.9, 1, 1.25];

const base = () => (typeof document !== 'undefined' ? document.body?.dataset.base || '' : '');
const raizAudio = () => `${base()}/assets/ingles/audio/`;

let config = null;
let promesaConfig = null;

/** Carga voces.json (una vez por página; lo cachea el navegador). */
export function cargarConfig() {
  if (config) return Promise.resolve(config);
  if (!promesaConfig) {
    promesaConfig = fetch(raizAudio() + 'voces.json')
      .then(r => { if (!r.ok) throw new Error('sin-config'); return r.json(); })
      .then(c => { config = c; fijarPersonajes(c); return c; })
      .catch(e => { promesaConfig = null; throw e; });
  }
  return promesaConfig;
}

const leerPref = () => { try { return JSON.parse(localStorage.getItem(PREF) || '{}') || {}; } catch { return {}; } };

export function preferencias() {
  const p = leerPref();
  return {
    acento: p.acento === 'gb' ? 'gb' : 'us',
    velocidad: VELOCIDADES.includes(p.velocidad) ? p.velocidad : 1,
  };
}

export function fijarPreferencias(cambios) {
  const p = { ...preferencias(), ...cambios };
  try { localStorage.setItem(PREF, JSON.stringify(p)); } catch { /* sin persistencia */ }
  document.dispatchEvent(new CustomEvent('ingles:voz-cambiada', { detail: p }));
  return p;
}

/** URL absoluta del clip de una frase para el acento elegido. */
export async function urlClip(texto, rol = 'n', acento = preferencias().acento) {
  const c = await cargarConfig();
  const rel = rutaClip(c, texto, acento, rol);
  return rel ? raizAudio() + rel : null;
}

/* ----------------------------------------------------- reproducción */

let turno = 0;
let actual = null;

export function callar() {
  turno++;
  // Los reproductores de pistas completas escuchan este aviso y se pausan.
  if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('ingles:callar'));
  if (actual) { actual.pause(); actual = null; }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  document.querySelectorAll('.in-oir.es-sonando').forEach(b => b.classList.remove('es-sonando'));
}

/** Reproduce una URL de audio. Resuelve al terminar; rechaza si no se puede cargar. */
export function reproducirUrl(url, { velocidad = preferencias().velocidad } = {}) {
  return new Promise((resolve, reject) => {
    const a = new Audio();
    a.preload = 'auto';
    a.preservesPitch = true;
    a.src = url;
    a.playbackRate = velocidad;
    actual = a;
    a.onended = () => resolve();
    a.onerror = () => reject(new Error('audio-no-disponible'));
    a.play().catch(err => reject(err?.name === 'NotAllowedError' ? err : new Error('audio-no-disponible')));
  });
}

/**
 * Pronuncia una frase con su archivo pregenerado.
 * @param {string} texto
 * @param {{lento?: boolean, rol?: string, seguir?: boolean}} op
 */
export async function decir(texto, { lento = false, rol = 'n', seguir = false } = {}) {
  if (!seguir) callar();
  const mio = turno;
  const url = await urlClip(texto, rol);
  if (mio !== turno) return;
  if (!url) throw new Error('audio-no-disponible');
  const velocidad = lento ? 0.75 : preferencias().velocidad;
  await reproducirUrl(url, { velocidad });
}

/**
 * Reproduce varias frases seguidas (un diálogo). alCambiar(i) recibe la
 * línea que suena (-1 al acabar). Cualquier otro audio la interrumpe.
 */
export async function decirSecuencia(items, alCambiar = null, pausaMs = 280) {
  callar();
  const mio = turno;
  try {
    for (let i = 0; i < items.length; i++) {
      if (mio !== turno) return;
      alCambiar?.(i);
      await decir(items[i].texto, { rol: items[i].rol || 'n', lento: !!items[i].lento, seguir: true });
      if (mio !== turno) return;
      await new Promise(r => setTimeout(r, pausaMs));
    }
  } finally {
    alCambiar?.(-1);
  }
}

/* ------------------------------------ alternativa: voz del navegador */

export function hayVozNavegador() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    && window.speechSynthesis.getVoices().some(v => /^en([-_]|$)/i.test(v.lang));
}

/**
 * SOLO para texto escrito por el estudiante (no puede tener un archivo
 * pregenerado). Usa una voz inglesa del sistema si existe.
 */
export function decirNavegador(texto) {
  callar();
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) { reject(new Error('sin-voz-navegador')); return; }
    const voces = window.speechSynthesis.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang));
    if (!voces.length) { reject(new Error('sin-voz-navegador')); return; }
    const u = new SpeechSynthesisUtterance(String(texto).slice(0, 1500));
    const pref = preferencias().acento === 'gb' ? /GB/i : /US/i;
    u.voice = voces.find(v => pref.test(v.lang)) || voces[0];
    u.lang = u.voice.lang;
    u.rate = preferencias().velocidad;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

/** Mensaje claro para cada error (sin pedir que se instale nada para audios del curso). */
export function explicarError(error) {
  const e = error?.message || error?.name || '';
  if (e === 'NotAllowedError') return 'El navegador bloqueó el audio. Pulsa de nuevo el botón para escucharlo.';
  if (e === 'sin-config') return 'No se pudo cargar la configuración del audio. Revisa tu conexión y recarga la página.';
  if (e === 'sin-voz-navegador') return 'Tu texto no tiene audio pregenerado y este navegador no ofrece una voz inglesa para leerlo. El audio del curso no se ve afectado.';
  return 'El audio de esta frase no está disponible. El resto del audio del curso funciona con normalidad.';
}

/**
 * Activa todos los botones [data-decir] de la página (delegación: sirve
 * también para los que se creen después). data-rol elige la voz.
 */
export function activarBotones(raiz = document, alError = null) {
  raiz.addEventListener('click', async (ev) => {
    const boton = ev.target.closest('[data-decir]');
    if (!boton) return;
    ev.preventDefault();
    if (boton.classList.contains('es-sonando')) { callar(); return; }
    boton.classList.add('es-sonando');
    try {
      if (boton.hasAttribute('data-navegador')) await decirNavegador(boton.dataset.decir);
      else await decir(boton.dataset.decir, { lento: boton.hasAttribute('data-lento'), rol: boton.dataset.rol || 'n' });
    } catch (e) {
      boton.classList.add('es-sin-audio');
      alError?.(explicarError(e));
    } finally {
      boton.classList.remove('es-sonando');
    }
  });
}
