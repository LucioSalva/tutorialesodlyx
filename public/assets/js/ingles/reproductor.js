/**
 * Academia de Inglés · Reproductor de pistas completas
 * ---------------------------------------------------------------------
 * Un solo componente para las lecturas y los audios de escucha:
 *
 *   assets/ingles/audio/<tipo>/<acento>/<slug>.mp3   la pista
 *   assets/ingles/audio/<tipo>/<acento>/<slug>.json  duración y segmentos
 *
 * Los segmentos traen tiempos EXACTOS (la pista se montó concatenando el
 * audio de cada frase con pausas fijas), así que el resaltado de la frase
 * que suena corresponde de verdad al audio. Si el .json no carga, el
 * reproductor funciona igual pero sin resaltado ni «Repetir frase».
 *
 * Nunca empieza solo: el audio no se descarga hasta que se pulsa ▶.
 */
import { preferencias, fijarPreferencias, VELOCIDADES, cargarConfig, callar } from './voz.js';
import { el } from './ejercicios.js';

const fmtTiempo = (s) => {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

/**
 * @param {HTMLElement} caja
 * @param {{tipo:'lecturas'|'escucha', slug:string, base:string, titulo:string,
 *          alSegmento?:(i:number, seg:object|null)=>void, alEscuchar?:(fraccion:number)=>void,
 *          alError?:(msg:string)=>void}} op
 */
export async function montarReproductor(caja, op) {
  const config = await cargarConfig().catch(() => null);
  const acentos = Object.entries(config?.acentos || { us: { nombre: 'English (US)' } });
  const raiz = `${op.base}/assets/ingles/audio/${op.tipo}/`;

  const audio = new Audio();
  audio.preload = 'none';
  audio.preservesPitch = true;
  let meta = null;           // duracion + segmentos del acento actual
  let acentoCargado = null;
  let segActual = -1;
  let finRepeticion = null;  // al repetir una frase, dónde parar
  let maxEscuchado = 0;

  // ------------------------------------------------------------ interfaz
  const b = (texto, etiqueta, extra = {}) => el('button', { type: 'button', clase: 'in-btn in-btn--fino in-rep__btn', 'aria-label': etiqueta, title: etiqueta, texto, ...extra });
  const btnPlay = b('▶ Escuchar', `Escuchar ${op.titulo}`, { clase: 'in-btn in-btn--primario in-rep__play' });
  const btnReiniciar = b('⏮', 'Volver al principio');
  const btnAtras = b('−5 s', 'Retroceder 5 segundos');
  const btnAdelante = b('+5 s', 'Avanzar 5 segundos');
  const btnRepetir = b('↻ Repetir frase', 'Repetir la frase actual', { disabled: true });
  const barra = el('input', { type: 'range', clase: 'in-rep__barra', min: '0', max: '1000', value: '0', step: '1', 'aria-label': 'Posición en el audio', disabled: true });
  const tiempo = el('span', { clase: 'in-rep__tiempo', 'aria-live': 'off', texto: '0:00 / –:––' });
  const selVel = el('select', { clase: 'in-select in-rep__sel', 'aria-label': 'Velocidad' },
    ...VELOCIDADES.map(v => el('option', { value: String(v), texto: `${String(v).replace('.', ',')}×` })));
  const selAcento = el('select', { clase: 'in-select in-rep__sel', 'aria-label': 'Acento' },
    ...acentos.map(([k, a]) => el('option', { value: k, texto: a.nombre })));
  const estado = el('p', { clase: 'in-rep__estado', role: 'status', 'aria-live': 'polite' });

  caja.textContent = '';
  caja.classList.add('in-rep');
  caja.append(
    el('div', { clase: 'in-rep__fila' }, btnPlay, btnReiniciar, btnAtras, btnAdelante, btnRepetir),
    el('div', { clase: 'in-rep__fila in-rep__fila--barra' }, barra, tiempo),
    el('div', { clase: 'in-rep__fila' },
      el('label', { clase: 'in-rep__etiqueta' }, 'Velocidad ', selVel),
      el('label', { clase: 'in-rep__etiqueta' }, 'Acento ', selAcento)),
    estado,
  );
  const pref = preferencias();
  selVel.value = String(pref.velocidad);
  selAcento.value = acentos.some(([k]) => k === pref.acento) ? pref.acento : acentos[0][0];

  // ------------------------------------------------------------- carga
  async function cargar(acento, { conservarSegmento = false } = {}) {
    const segPrevio = segActual;
    const eraPlay = !audio.paused;
    audio.pause();
    meta = null;
    try {
      const r = await fetch(`${raiz}${acento}/${op.slug}.json`);
      if (r.ok) meta = await r.json();
    } catch { meta = null; }
    audio.src = `${raiz}${acento}/${op.slug}.mp3`;
    audio.playbackRate = Number(selVel.value);
    acentoCargado = acento;
    btnRepetir.disabled = !meta?.segmentos?.length;
    if (conservarSegmento && meta?.segmentos?.[segPrevio]) {
      await new Promise(res => { audio.addEventListener('loadedmetadata', res, { once: true }); audio.load(); });
      audio.currentTime = meta.segmentos[segPrevio].inicio;
    }
    pintar();
    if (eraPlay) reproducir();
  }

  let sonandoPropio = false;
  document.addEventListener('ingles:callar', () => { if (!sonandoPropio) audio.pause(); });

  async function reproducir() {
    sonandoPropio = true;
    callar(); // detiene cualquier otro audio de la página (y no a sí mismo)
    sonandoPropio = false;
    if (acentoCargado !== selAcento.value) await cargar(selAcento.value);
    audio.playbackRate = Number(selVel.value);
    try {
      await audio.play();
      estado.textContent = '';
    } catch (e) {
      if (e?.name !== 'AbortError') fallo();
    }
  }

  function fallo() {
    const msg = 'El audio de este recurso no está disponible en este momento. El resto del curso funciona con normalidad.';
    estado.textContent = msg;
    op.alError?.(msg);
  }

  // -------------------------------------------------------------- estado
  function segmentoEn(t) {
    const s = meta?.segmentos;
    if (!s) return -1;
    for (let i = s.length - 1; i >= 0; i--) if (t >= s[i].inicio - 0.02) return t <= s[i].fin + 0.5 || i === s.length - 1 ? i : -1;
    return -1;
  }

  function pintar() {
    const dur = audio.duration || meta?.duracion || 0;
    const t = audio.currentTime || 0;
    tiempo.textContent = `${fmtTiempo(t)} / ${dur ? fmtTiempo(dur) : '–:––'}`;
    barra.disabled = !dur;
    if (document.activeElement !== barra) barra.value = dur ? String(Math.round((t / dur) * 1000)) : '0';
    barra.setAttribute('aria-valuetext', `${fmtTiempo(t)} de ${fmtTiempo(dur)}`);
    btnPlay.textContent = audio.paused ? (t > 0 ? '▶ Seguir' : '▶ Escuchar') : '❚❚ Pausa';
    btnPlay.setAttribute('aria-label', audio.paused ? `Escuchar ${op.titulo}` : 'Pausar');
    const i = segmentoEn(t);
    if (i !== segActual) {
      segActual = i;
      op.alSegmento?.(i, i >= 0 ? meta.segmentos[i] : null);
    }
    if (dur) {
      maxEscuchado = Math.max(maxEscuchado, t / dur);
      op.alEscuchar?.(maxEscuchado);
    }
  }

  let raf = null;
  const bucle = () => {
    pintar();
    if (finRepeticion !== null && audio.currentTime >= finRepeticion) { audio.pause(); finRepeticion = null; }
    if (!audio.paused) raf = requestAnimationFrame(bucle);
  };

  // ------------------------------------------------------------ eventos
  audio.addEventListener('play', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(bucle); });
  audio.addEventListener('pause', pintar);
  audio.addEventListener('loadedmetadata', pintar);
  audio.addEventListener('ended', () => { maxEscuchado = 1; pintar(); op.alSegmento?.(-1, null); segActual = -1; });
  audio.addEventListener('error', () => { if (audio.src) fallo(); });
  audio.addEventListener('waiting', () => { estado.textContent = 'Cargando…'; });
  audio.addEventListener('playing', () => { if (estado.textContent === 'Cargando…') estado.textContent = ''; });

  btnPlay.addEventListener('click', () => (audio.paused ? reproducir() : audio.pause()));
  btnReiniciar.addEventListener('click', () => { finRepeticion = null; audio.currentTime = 0; pintar(); });
  btnAtras.addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime - 5); pintar(); });
  btnAdelante.addEventListener('click', () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5); pintar(); });
  btnRepetir.addEventListener('click', () => {
    const s = meta?.segmentos;
    if (!s?.length) return;
    const i = segActual >= 0 ? segActual : Math.max(0, segmentoEn(audio.currentTime));
    irASegmento(i, { soloEse: true });
  });
  barra.addEventListener('input', () => {
    const dur = audio.duration || meta?.duracion || 0;
    if (dur) { audio.currentTime = (Number(barra.value) / 1000) * dur; finRepeticion = null; pintar(); }
  });
  selVel.addEventListener('change', () => {
    audio.playbackRate = Number(selVel.value);
    fijarPreferencias({ velocidad: Number(selVel.value) });
  });
  selAcento.addEventListener('change', () => {
    fijarPreferencias({ acento: selAcento.value });
    if (acentoCargado) cargar(selAcento.value, { conservarSegmento: true });
  });
  document.addEventListener('ingles:voz-cambiada', (e) => {
    if (e.detail?.velocidad && String(e.detail.velocidad) !== selVel.value) { selVel.value = String(e.detail.velocidad); audio.playbackRate = e.detail.velocidad; }
  });

  /** Salta al principio de un segmento; soloEse = reproducir solo esa frase. */
  async function irASegmento(i, { soloEse = false } = {}) {
    if (acentoCargado !== selAcento.value) await cargar(selAcento.value);
    const s = meta?.segmentos?.[i];
    if (!s) return;
    if (!audio.duration) await new Promise(res => { audio.addEventListener('loadedmetadata', res, { once: true }); audio.load(); });
    audio.currentTime = s.inicio;
    finRepeticion = soloEse ? s.fin + 0.05 : null;
    reproducir();
  }

  // Tiempos del acento elegido desde el principio (unos KB): permiten
  // envolver las frases y saltar a una antes de pulsar ▶. El MP3 no se
  // descarga hasta que se reproduce.
  try {
    const r = await fetch(`${raiz}${selAcento.value}/${op.slug}.json`);
    if (r.ok) { meta = await r.json(); btnRepetir.disabled = !meta?.segmentos?.length; pintar(); }
    else estado.textContent = 'El audio de este recurso no está disponible en este momento.';
  } catch { /* sin red: se intentará al pulsar ▶ */ }

  return { irASegmento, get segmentos() { return meta?.segmentos || null; }, pausar: () => audio.pause(), audio };
}
