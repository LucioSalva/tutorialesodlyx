/**
 * Academia de Inglés · Grabarte y (opcionalmente) reconocimiento de voz
 * ---------------------------------------------------------------------
 * 1) GRABAR Y ESCUCHARTE — MediaRecorder. La grabación se queda en la
 *    memoria de esta pestaña (un Blob), se reproduce desde ahí y se descarta
 *    al grabar otra o al salir. Nunca se envía a ningún servidor. El
 *    micrófono se pide solo al pulsar «Grabarme» y se libera al parar.
 *
 * 2) RECONOCIMIENTO DE VOZ — Web Speech API (SpeechRecognition). OPCIONAL y
 *    con consentimiento explícito, porque en Chrome y Edge el audio se envía
 *    a los servidores del fabricante del navegador para transcribirlo.
 *    Firefox no lo ofrece. Lo que devuelve es QUÉ ENTENDIÓ el reconocedor,
 *    no una evaluación fonética: un reconocedor adivina palabras probables
 *    (y a veces «corrige» una mala pronunciación) o falla con una buena
 *    por ruido o acento. Se presenta así, siempre.
 */

import { canonica, diferencias } from './texto.js';

const CONSENTIMIENTO = 'ingles:reconocimiento:consentido';

export function puedeGrabar() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
}

export function puedeReconocer() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function consentido() {
  try { return sessionStorage.getItem(CONSENTIMIENTO) === 'si'; } catch { return false; }
}

export function consentir(si) {
  try { si ? sessionStorage.setItem(CONSENTIMIENTO, 'si') : sessionStorage.removeItem(CONSENTIMIENTO); } catch { /* solo esta página */ }
}

/** Grabadora local. */
export class Grabadora {
  constructor() { this.url = null; this.rec = null; this.stream = null; }

  async empezar() {
    this.descartar();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const trozos = [];
    try {
      this.rec = new MediaRecorder(this.stream);
    } catch (e) {
      this.descartar(); // no dejar el micrófono encendido si la grabadora no arranca
      throw e;
    }
    this.rec.ondataavailable = (e) => { if (e.data.size) trozos.push(e.data); };
    const terminado = new Promise(resolve => {
      this.rec.onstop = () => {
        this.stream?.getTracks().forEach(t => t.stop());
        this.stream = null;
        this.url = URL.createObjectURL(new Blob(trozos, { type: this.rec.mimeType || 'audio/webm' }));
        resolve(this.url);
      };
    });
    this.rec.start();
    // Tope de seguridad: 20 s por grabación.
    this.tope = setTimeout(() => this.parar(), 20000);
    return terminado;
  }

  parar() {
    clearTimeout(this.tope);
    if (this.rec && this.rec.state !== 'inactive') this.rec.stop();
  }

  reproducir() {
    if (!this.url) return Promise.resolve();
    return new Promise(resolve => {
      const a = new Audio(this.url);
      a.onended = a.onerror = () => resolve();
      a.play().catch(() => resolve());
    });
  }

  descartar() {
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = null;
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }
}

/** Escucha una vez y devuelve las transcripciones candidatas. */
export function reconocer({ acento = 'us', segundos = 8 } = {}) {
  return new Promise((resolve, reject) => {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!R) { reject(new Error('sin-reconocimiento')); return; }
    const r = new R();
    r.lang = acento === 'gb' ? 'en-GB' : 'en-US';
    r.interimResults = false;
    r.maxAlternatives = 3;
    const tope = setTimeout(() => r.stop(), segundos * 1000);
    r.onresult = (e) => {
      const alt = [];
      for (let i = 0; i < e.results[0].length; i++) alt.push(e.results[0][i].transcript);
      clearTimeout(tope);
      resolve(alt);
    };
    r.onerror = (e) => { clearTimeout(tope); reject(new Error(e.error || 'error')); };
    r.onend = () => { clearTimeout(tope); resolve([]); };
    r.start();
  });
}

/**
 * Compara lo reconocido con el texto objetivo, palabra a palabra. Devuelve
 * cuántas palabras del objetivo aparecen y cuáles no: un indicio, no una nota.
 */
export function compararReconocido(objetivo, candidatos) {
  const obj = canonica(objetivo).split(' ').filter(Boolean);
  let mejor = { texto: candidatos[0] || '', coinciden: 0, faltan: obj };
  for (const c of candidatos) {
    const ops = diferencias(c, objetivo);
    const coinciden = ops.filter(o => o.tipo === 'igual').length;
    if (coinciden > mejor.coinciden) {
      mejor = { texto: c, coinciden, faltan: ops.filter(o => o.tipo === 'falta').map(o => o.palabra) };
    }
  }
  return { ...mejor, total: obj.length };
}

export function explicarErrorMicro(error) {
  const e = error?.message || error?.name || '';
  if (e === 'NotAllowedError' || e === 'not-allowed') return 'No hay permiso para usar el micrófono. Puedes concederlo en la barra de direcciones; la práctica funciona igual sin grabarte.';
  if (e === 'NotFoundError' || e === 'audio-capture') return 'No se encontró ningún micrófono.';
  if (e === 'no-speech') return 'No se oyó nada. Acércate al micrófono e inténtalo otra vez.';
  if (e === 'network') return 'El reconocimiento necesita conexión con el servicio del navegador y no respondió.';
  if (e === 'sin-reconocimiento') return 'Este navegador no ofrece reconocimiento de voz (Firefox, por ejemplo). Usa «Grabarme» para escucharte y compararte.';
  return 'No se pudo usar el micrófono.';
}
