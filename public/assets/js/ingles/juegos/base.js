/**
 * Academia de Inglés · Base común de los juegos
 * ---------------------------------------------------------------------
 * Los diez juegos comparten: HUD (nivel, ronda, puntos, vidas o reloj),
 * botón de pista por ronda, explicación razonada tras cada respuesta,
 * pantalla final con los fallos para repasar y guardado del nivel.
 * Ningún juego corrige por su cuenta: todos usan evaluar() / coincide().
 *
 * Sin Phaser ni dependencias: son juegos de lenguaje, y el DOM accesible
 * (botones reales, teclado, aria-live) es mejor herramienta que un lienzo.
 */
import { el, fmt, barajar, botonOir } from '../ejercicios.js';
import { evaluar } from '../evaluador.js';
import { asignarRoles } from '../audio-textos.js';

export { el, fmt, barajar, botonOir, evaluar };

export const PUNTOS = { limpio: 10, conPista: 6, fallo: 0 };

/**
 * Una sola partida viva por contenedor. Empezar otra (o repetir el nivel)
 * aborta la anterior: su reloj, sus teclas y su bucle de rondas. Sin esto,
 * dos partidas compartirían pantalla y el reloj viejo cortaría la nueva.
 */
let senal = null;
export function nuevaPartida(contenedor) {
  contenedor._partida?.abort();
  const ctrl = new AbortController();
  contenedor._partida = ctrl;
  senal = ctrl.signal;
  return ctrl.signal;
}
const abortada = (s) => new Promise(res => s.addEventListener('abort', () => res({ abortada: true }), { once: true }));

/**
 * Juega una serie de rondas.
 * @param {HTMLElement} contenedor
 * @param {object} op { juego, nivel, rondas, progreso, pintar(ronda, ctx) → Promise<{correcto, respuesta?}>,
 *                      segundos?: number (contrarreloj), vidas?: number, alSiguienteNivel?: fn }
 */
export async function jugarRondas(contenedor, op) {
  const { juego, nivel, rondas, progreso, pintar } = op;
  const sig = nuevaPartida(contenedor);
  contenedor.textContent = '';
  let puntos = 0; let aciertos = 0; let vidas = op.vidas || 0;
  const fallos = [];
  let tiempo = op.segundos || 0;
  let reloj = null;
  let agotado = false;

  const hud = el('div', { clase: 'in-hud' });
  const datos = el('div', { clase: 'in-hud__datos' });
  const dRonda = el('b'); const dPuntos = el('b', { texto: '0' });
  const dVidas = el('b', { clase: 'in-vidas' }); const dReloj = el('b', { clase: 'in-reloj' });
  datos.append(el('span', {}, 'Ronda ', dRonda), el('span', {}, 'Puntos ', dPuntos));
  if (op.vidas) datos.append(el('span', {}, 'Vidas ', dVidas));
  if (op.segundos) datos.append(el('span', {}, 'Tiempo ', dReloj));
  const acciones = el('div', { clase: 'in-hud__acciones' });
  const btnPista = el('button', { type: 'button', clase: 'in-btn in-btn--fino', texto: 'Pista (P)' });
  const btnSalir = el('button', { type: 'button', clase: 'in-btn in-btn--fino in-btn--suave', texto: 'Reiniciar nivel' });
  acciones.append(btnPista, btnSalir);
  const barra = el('span', { clase: 'in-barra in-hud__progreso', 'aria-hidden': 'true' }, el('span', { clase: 'in-barra__relleno' }));
  hud.append(el('p', { clase: 'in-etiqueta', style: 'margin:0;width:100%', texto: `${juego.nombre} · ${nivel.nombre}` }), datos, acciones, barra);
  const area = el('div', { clase: 'in-reto' });
  const explica = el('div', { clase: 'in-reto__explica', role: 'status', 'aria-live': 'polite' });
  const pie = el('div', { clase: 'in-ej__acciones' });
  contenedor.append(hud, el('p', { clase: 'in-nota-pie', style: 'margin:0', html: fmt(nivel.objetivo || '') }), area, explica, pie);

  const pintarHud = (i) => {
    dRonda.textContent = `${Math.min(i + 1, rondas.length)}/${rondas.length}`;
    dPuntos.textContent = String(puntos);
    dVidas.textContent = '♥'.repeat(Math.max(0, vidas)) + '♡'.repeat(Math.max(0, (op.vidas || 0) - vidas));
    dVidas.setAttribute('aria-label', `${vidas} vidas`);
    barra.firstChild.style.width = Math.round((i / rondas.length) * 100) + '%';
  };
  const pintarReloj = () => {
    dReloj.textContent = `${Math.floor(tiempo / 60)}:${String(tiempo % 60).padStart(2, '0')}`;
    dReloj.classList.toggle('es-poco', tiempo <= 10);
  };

  btnSalir.addEventListener('click', () => jugarRondas(contenedor, op));
  sig.addEventListener('abort', () => clearInterval(reloj), { once: true });

  if (op.segundos) {
    pintarReloj();
    reloj = setInterval(() => {
      tiempo = Math.max(0, tiempo - 1);
      pintarReloj();
      if (tiempo === 0) { agotado = true; clearInterval(reloj); contenedor.dispatchEvent(new CustomEvent('tiempo-agotado')); }
    }, 1000);
  }

  let jugadas = 0;
  for (let i = 0; i < rondas.length; i++) {
    if (sig.aborted) return;
    if (agotado) break;
    if (op.vidas && vidas <= 0) break;
    pintarHud(i);
    const ronda = rondas[i];
    area.textContent = ''; explica.textContent = ''; pie.textContent = '';
    let pistaUsada = false;
    btnPista.disabled = !ronda.pista;
    btnPista.onclick = () => {
      if (!ronda.pista || pistaUsada) return;
      pistaUsada = true;
      explica.innerHTML = '<b>Pista:</b> ' + fmt(ronda.pista);
    };
    const teclaPista = (e) => { if ((e.key === 'p' || e.key === 'P') && !(e.target instanceof Element && e.target.matches('input, textarea'))) btnPista.onclick(); };
    document.addEventListener('keydown', teclaPista, { signal: sig });

    const resultado = await Promise.race([
      pintar(ronda, { area, explica, i }),
      new Promise(res => contenedor.addEventListener('tiempo-agotado', () => res({ agotado: true }), { once: true, signal: sig })),
      abortada(sig),
    ]);
    document.removeEventListener('keydown', teclaPista);
    if (sig.aborted || resultado?.abortada) return;
    if (resultado?.agotado) break;
    jugadas++;

    if (resultado.correcto) {
      aciertos++;
      puntos += pistaUsada ? PUNTOS.conPista : PUNTOS.limpio;
      if (op.segundos) tiempo += 4; // cada acierto da unos segundos extra
    } else {
      if (op.vidas) vidas--;
      fallos.push({ ronda, respuesta: resultado.respuesta });
    }
    pintarHud(i + 1);
    explica.innerHTML = (resultado.correcto ? '<b>✓ Correcto.</b> ' : `<b>✗ No es correcto.</b> ${resultado.correcta ? 'La respuesta es <span lang="en" class="in-en">' + fmt(resultado.correcta) + '</span>. ' : ''}`)
      + fmt(ronda.explicacion || resultado.explicacion || '');
    if (!op.segundos || resultado.correcto === false) {
      const siguiente = await Promise.race([abortada(sig), new Promise(res => {
        const b = el('button', { type: 'button', clase: 'in-btn in-btn--primario in-btn--fino', texto: i + 1 < rondas.length ? 'Siguiente (Enter)' : 'Ver resultado' });
        b.addEventListener('click', res, { once: true });
        pie.append(b);
        b.focus({ preventScroll: true });
      })]);
      if (siguiente?.abortada) return;
    } else {
      await new Promise(r => setTimeout(r, 1100));
    }
  }
  clearInterval(reloj);
  if (sig.aborted) return;

  // --------------------------------------------------------------- final
  const total = op.segundos ? Math.max(jugadas, 1) : rondas.length;
  const pct = Math.round((aciertos / total) * 100);
  const minimo = nivel.exito?.minimo ?? 70;
  const sinVidas = op.vidas && vidas <= 0;
  const superado = !sinVidas && pct >= minimo && (!op.segundos || jugadas >= Math.min(rondas.length, op.minRondas || 6));
  progreso?.registrarNivel(juego.slug, nivel.id, { superado, puntos });

  contenedor.textContent = '';
  const final = el('div', { clase: 'in-final' },
    el('p', { clase: 'in-final__icono', 'aria-hidden': 'true', texto: superado ? '🏆' : '🔁' }),
    el('h3', { texto: superado ? '¡Nivel superado!' : (sinVidas ? 'Te quedaste sin vidas' : (agotado ? 'Se acabó el tiempo' : 'Casi: repite el nivel')) }),
    el('p', { texto: `${aciertos} de ${total} aciertos (${pct} %) · ${puntos} puntos · hace falta el ${minimo} %${op.segundos ? ` y al menos ${Math.min(rondas.length, op.minRondas || 6)} rondas` : ''}.` }));
  if (fallos.length) {
    const lista = el('ul', { clase: 'in-repasar' });
    for (const f of fallos) {
      lista.append(el('li', { html: `<span lang="en" class="in-en">${fmt(f.ronda.titulo_repaso || f.ronda.respuesta || f.ronda.frase || f.ronda.afirmacion || f.ronda.pregunta || '')}</span> — ${fmt(f.ronda.explicacion || '')}` }));
    }
    final.append(el('div', { clase: 'in-final__repaso' }, el('p', { clase: 'in-etiqueta', texto: 'Para repasar' }), lista));
  }
  const botones = el('div', { clase: 'in-final__acciones' },
    el('button', { type: 'button', clase: 'in-btn', texto: 'Repetir el nivel', onclick: () => jugarRondas(contenedor, op) }));
  if (op.alSiguienteNivel) botones.append(el('button', { type: 'button', clase: 'in-btn in-btn--primario', texto: 'Siguiente nivel', onclick: op.alSiguienteNivel }));
  final.append(botones);
  contenedor.append(final);
  (botones.lastChild).focus({ preventScroll: true });
}

/** Espera la elección de una opción (botones). Devuelve el índice elegido. */
export function elegirOpcion(area, opciones, { textoDe = (o) => o.texto ?? o, lang = 'en' } = {}) {
  return new Promise(resolve => {
    const caja = el('div', { clase: 'in-reto__opciones', role: 'group', 'aria-label': 'Opciones' });
    const botones = opciones.map((o, i) => {
      const b = el('button', { type: 'button', clase: 'in-btn in-reto__opcion', lang, html: fmt(textoDe(o)), 'data-atajo': String(i + 1) });
      b.addEventListener('click', () => {
        botones.forEach(x => { x.disabled = true; });
        document.removeEventListener('keydown', tecla);
        resolve({ indice: i, boton: b, botones });
      });
      return b;
    });
    const tecla = (e) => {
      if ((e.target instanceof Element && e.target.matches('input, textarea'))) return;
      const n = Number(e.key);
      if (n >= 1 && n <= botones.length) { e.preventDefault(); botones[n - 1].click(); }
    };
    document.addEventListener('keydown', tecla, senal ? { signal: senal } : undefined);
    caja.append(...botones);
    area.append(caja, el('p', { clase: 'in-nota-pie', texto: 'Teclas 1–' + botones.length + ' para elegir.' }));
    botones[0]?.focus({ preventScroll: true });
  });
}

/** Espera una respuesta escrita (Enter para enviar). */
export function escribir(area, { placeholder = 'Escribe en inglés…', etiqueta = 'Tu respuesta' } = {}) {
  return new Promise(resolve => {
    const campo = el('input', { type: 'text', clase: 'in-input', lang: 'en', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder, 'aria-label': etiqueta });
    const form = el('form', { clase: 'in-mazo__responder' }, campo, el('button', { type: 'submit', clase: 'in-btn in-btn--primario in-btn--fino', texto: 'Comprobar' }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!campo.value.trim()) return;
      campo.disabled = true;
      form.querySelector('button').disabled = true;
      resolve(campo.value);
    });
    area.append(form);
    campo.focus({ preventScroll: true });
  });
}

/** Fichas para ordenar (pulsar o arrastrar); resuelve con la frase construida. */
export function ordenarFichas(area, palabras, { distractores = [] } = {}) {
  return new Promise(resolve => {
    const destino = el('div', { clase: 'in-fichas in-fichas--destino', 'aria-label': 'Tu oración' });
    const origen = el('div', { clase: 'in-fichas in-fichas--origen', 'aria-label': 'Fichas' });
    let fichas = barajar([...palabras, ...distractores]);
    if (fichas.join(' ') === palabras.join(' ') && fichas.length > 2) fichas = [...fichas.slice(1), fichas[0]];
    const botones = fichas.map(t => {
      const b = el('button', { type: 'button', clase: 'in-ficha', lang: 'en', texto: t });
      b.addEventListener('click', () => { (b.parentElement === origen ? destino : origen).append(b); b.focus(); });
      return b;
    });
    origen.append(...botones);
    const listo = el('button', { type: 'button', clase: 'in-btn in-btn--primario in-btn--fino', texto: 'Comprobar' });
    listo.addEventListener('click', () => {
      if (!destino.children.length) return;
      botones.forEach(b => { b.disabled = true; });
      listo.disabled = true;
      resolve([...destino.children].map(b => b.textContent).join(' '));
    });
    area.append(el('p', { clase: 'in-nota-pie', texto: 'Pulsa las fichas en orden; pulsa una de tu oración para devolverla.' }), destino, origen, listo);
    botones[0]?.focus({ preventScroll: true });
  });
}

/**
 * Reto mixto (viaje interactivo y misión final): opcion | escribir | ordenar.
 * Devuelve {correcto, correcta, respuesta}.
 */
export async function jugarReto(area, reto) {
  if (reto.linea) {
    area.append(el('div', { clase: 'in-burbuja in-burbuja--a', style: 'max-width:100%' },
      el('span', { clase: 'in-burbuja__quien', texto: reto.linea.quien }),
      el('span', { clase: 'in-burbuja__en', lang: 'en', texto: reto.linea.en }), botonOir(reto.linea.en, { rol: asignarRoles([reto.linea.quien]).get(reto.linea.quien) }),
      el('span', { clase: 'in-burbuja__es', texto: reto.linea.es, style: 'display:block' })));
  }
  area.append(el('p', { clase: 'in-reto__enunciado', html: fmt(reto.pregunta) }));
  if (reto.tipo === 'opcion') {
    const orden = barajar(reto.opciones.map((o, i) => i));
    const { indice, boton, botones } = await elegirOpcion(area, orden.map(i => reto.opciones[i]));
    const op = reto.opciones[orden[indice]];
    boton.classList.add(op.correcta ? 'es-ok' : 'es-mal');
    if (!op.correcta) botones.forEach((b, k) => { if (reto.opciones[orden[k]].correcta) b.classList.add('es-ok'); });
    area.append(el('p', { clase: 'in-nota-pie', html: fmt(op.porque || '') }));
    return { correcto: !!op.correcta, respuesta: op.texto, correcta: reto.opciones.find(o => o.correcta)?.texto };
  }
  if (reto.tipo === 'escribir') {
    const r = await escribir(area);
    const res = evaluar({ tipo: 'traducir', respuestas: reto.respuestas }, r);
    return { correcto: !!res.correcto, respuesta: r, correcta: reto.respuestas[0] };
  }
  const palabras = reto.respuesta.replace(/[.?!]+$/, '').split(/\s+/);
  const r = await ordenarFichas(area, palabras, { distractores: reto.distractores || [] });
  const res = evaluar({ tipo: 'ordenar', respuestas: [reto.respuesta, ...(reto.alternativas || [])] }, r);
  return { correcto: !!res.correcto, respuesta: r, correcta: reto.respuesta };
}
