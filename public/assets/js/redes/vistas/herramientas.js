/** Herramientas de subneteo: calculadora visual, divisor de redes y planificador VLSM. */
import { aEntero, aTexto, analizar, red, tamano, vlsm, miles, mascara } from '../ip.js';
import { montarRegla } from '../regla.js';
import { htmlTabla } from '../ui.js';

const MAX_FILAS = 256;

/** "192.168.1.0/24" → { d, p } o null. */
function leerRed(texto) {
  const m = /^\s*([\d.\s]+?)\s*\/\s*(\d{1,2})\s*$/.exec(texto);
  const d = m ? aEntero(m[1]) : null;
  const p = m ? Number(m[2]) : -1;
  return d === null || p < 0 || p > 32 ? null : { d: red(d, p), p };
}

function aviso(caja, texto) {
  const p = document.createElement('p');
  p.className = 'rd-aviso';
  p.textContent = texto;
  caja.replaceChildren(p);
}

export function iniciar() {
  document.querySelectorAll('[data-regla]').forEach(montarRegla);

  const divisor = document.querySelector('[data-divisor]');
  const salidaDiv = document.querySelector('[data-divisor-salida]');
  divisor.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const base = leerRed(divisor.base.value);
    const p1 = Number(divisor.prefijo.value);
    if (!base) return aviso(salidaDiv, 'Escribe la red base como dirección/prefijo, por ejemplo 192.168.1.0/24.');
    if (!Number.isInteger(p1) || p1 < base.p || p1 > 32) return aviso(salidaDiv, `El nuevo prefijo debe estar entre /${base.p} y /32.`);
    const total = 2 ** (p1 - base.p);
    const filas = [];
    for (let i = 0; i < Math.min(total, MAX_FILAS); i++) {
      const a = analizar(base.d + i * tamano(p1), p1);
      filas.push([String(i + 1), `${aTexto(a.red)}/${p1}`, p1 >= 31 ? '—' : `${aTexto(a.primero)} – ${aTexto(a.ultimo)}`, p1 >= 31 ? '—' : aTexto(a.broadcast)]);
    }
    salidaDiv.innerHTML = htmlTabla({
      cab: ['N.º', 'Subred', 'Rango asignable', 'Broadcast'], filas,
      pie: `${miles(total)} subredes /${p1} (máscara ${aTexto(mascara(p1))}), ${miles(analizar(base.d, p1).hosts)} hosts cada una.`
        + (total > MAX_FILAS ? ` Se muestran las primeras ${MAX_FILAS}.` : ''),
    });
  });

  const plan = document.querySelector('[data-vlsm]');
  const salidaPlan = document.querySelector('[data-vlsm-salida]');
  plan.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const base = leerRed(plan.base.value);
    if (!base) return aviso(salidaPlan, 'Escribe la red base como dirección/prefijo, por ejemplo 192.168.50.0/24.');
    const reqs = [];
    for (const linea of plan.reqs.value.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 64)) {
      const m = /^(.{1,40}?)\s*[:=,;\t]\s*(\d{1,8})$/.exec(linea);
      if (!m || Number(m[2]) < 1) return aviso(salidaPlan, `No entiendo la línea «${linea}». Usa el formato Nombre: hosts.`);
      reqs.push({ nombre: m[1], hosts: Number(m[2]) });
    }
    if (reqs.length === 0) return aviso(salidaPlan, 'Añade al menos una subred.');
    const r = vlsm(base.d, base.p, reqs);
    if (!r) return aviso(salidaPlan, `Esas subredes no caben en ${aTexto(base.d)}/${base.p}. Usa una red base más grande o reduce los hosts.`);
    // Los nombres los escribió el usuario: htmlTabla los escapa antes de pintarlos.
    salidaPlan.innerHTML = htmlTabla({
      cab: ['Subred', 'Hosts pedidos', 'Red', 'Máscara', 'Rango asignable', 'Broadcast', 'Hosts que ofrece'],
      filas: r.filas.map((f) => [f.nombre.replace(/[*`]/g, ''), miles(f.pedidos), `${aTexto(f.red)}/${f.p}`, aTexto(f.mascara), `${aTexto(f.primero)} – ${aTexto(f.ultimo)}`, aTexto(f.broadcast), miles(f.hosts)]),
      pie: r.sobran > 0 ? `Quedan ${miles(r.sobran)} direcciones libres a partir de ${aTexto(r.libre)}.` : 'No queda espacio libre en la red base.',
    });
  });

  divisor.requestSubmit();
  plan.requestSubmit();
}
