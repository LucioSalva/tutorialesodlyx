/**
 * Academia de Redes · Regla de bits interactiva
 * ---------------------------------------------------------------------
 * La pieza central del módulo: 32 bits con la frontera red | host móvil.
 * Se monta sobre un <div data-regla data-ip data-prefijo> que el servidor
 * ya pintó en estático; aquí se vuelve manipulable.
 *   · escribir otra IP        · mover el prefijo (deslizador o − / +)
 *   · pulsar un bit de la IP para invertirlo
 *   · pulsar un bit de la máscara para llevar ahí la frontera
 */
import { aEntero, aTexto, analizar, mascara, clase, ambito, miles, octetoInteresante } from './ip.js';
import { htmlBits, esc } from './ui.js';

const AMBITO = { privada: 'privada (RFC 1918)', publica: 'pública', loopback: 'loopback', apipa: 'enlace local (APIPA)' };

export function montarRegla(caja) {
  let d = aEntero(caja.dataset.ip) ?? aEntero('192.168.1.10');
  let p = Math.min(32, Math.max(0, Number(caja.dataset.prefijo) || 24));
  const completa = 'completa' in caja.dataset;
  const uid = 'rd-regla-' + Math.random().toString(36).slice(2, 8);

  caja.innerHTML = `
    <div class="rd-regla__controles">
      <label for="${uid}-ip">Dirección IP</label>
      <input id="${uid}-ip" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-ip-campo>
      <label for="${uid}-p">Prefijo</label>
      <div class="rd-regla__prefijo">
        <button type="button" class="rd-btn rd-btn--mini" data-menos aria-label="Un bit menos de red">−</button>
        <input id="${uid}-p" type="range" min="0" max="32" step="1" data-p-campo>
        <button type="button" class="rd-btn rd-btn--mini" data-mas aria-label="Un bit más de red">+</button>
        <output for="${uid}-p" data-p-texto></output>
      </div>
      <p class="rd-regla__error" data-error role="alert" hidden>Eso no es una dirección IPv4 válida (cuatro números de 0 a 255 separados por puntos).</p>
    </div>
    <div data-bits></div>
    <dl class="rd-regla__datos" data-datos aria-live="polite"></dl>`;

  const campoIp = caja.querySelector('[data-ip-campo]');
  const campoP = caja.querySelector('[data-p-campo]');
  const zonaBits = caja.querySelector('[data-bits]');
  campoIp.value = aTexto(d);

  function pintar(foco) {
    const a = analizar(d, p);
    campoP.value = String(p);
    caja.querySelector('[data-p-texto]').textContent = '/' + p;
    const filas = [
      { et: 'IP', ip: aTexto(d), p, pulsable: true },
      { et: 'Máscara', ip: aTexto(a.mascara), p, pulsable: true },
    ];
    if (completa) filas.push({ et: 'Red', ip: aTexto(a.red), p }, { et: 'Broadcast', ip: aTexto(a.broadcast), p });
    zonaBits.innerHTML = htmlBits(filas);
    if (foco) zonaBits.querySelector(`[data-fila="${foco.fila}"][data-bit="${foco.bit}"]`)?.focus();

    const o = octetoInteresante(p);
    const datos = [
      ['Red', `${aTexto(a.red)}/${p}`],
      ['Máscara', aTexto(a.mascara)],
      ['Rango asignable', p >= 31 ? (p === 31 ? `${aTexto(a.red)} – ${aTexto(a.broadcast)} (punto a punto)` : 'un solo equipo') : `${aTexto(a.primero)} – ${aTexto(a.ultimo)}`],
      ['Broadcast', p >= 31 ? 'no tiene' : aTexto(a.broadcast)],
      ['Hosts', miles(a.hosts)],
    ];
    if (completa) {
      datos.push(['Direcciones', miles(a.total)], ['Wildcard', aTexto(a.wildcard)],
        ['Número mágico', o ? `${o.bloque} en el octeto ${o.i + 1}` : 'no hace falta: el corte cae entre octetos'],
        ['Clase y ámbito', `clase ${clase(d)}, ${AMBITO[ambito(d)]}`]);
    }
    caja.querySelector('[data-datos]').innerHTML = datos.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  }

  campoIp.addEventListener('input', () => {
    const n = aEntero(campoIp.value);
    caja.querySelector('[data-error]').hidden = n !== null || campoIp.value.trim() === '';
    if (n !== null) { d = n; pintar(); }
  });
  campoP.addEventListener('input', () => { p = Number(campoP.value); pintar(); });
  caja.querySelector('[data-menos]').addEventListener('click', () => { p = Math.max(0, p - 1); pintar(); });
  caja.querySelector('[data-mas]').addEventListener('click', () => { p = Math.min(32, p + 1); pintar(); });
  zonaBits.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-bit]');
    if (!b) return;
    const bit = Number(b.dataset.bit);
    const fila = Number(b.dataset.fila);
    if (fila === 0) {
      d = (d ^ (1 << (31 - bit))) >>> 0;
      campoIp.value = aTexto(d);
      caja.querySelector('[data-error]').hidden = true;
    } else {
      // En la máscara: pulsar un 0 extiende la red hasta ese bit; pulsar un 1 la recorta justo antes.
      p = (mascara(p) >>> (31 - bit)) & 1 ? bit : bit + 1;
    }
    pintar({ fila, bit });
  });

  pintar();
}
