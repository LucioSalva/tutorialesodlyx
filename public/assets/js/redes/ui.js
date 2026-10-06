/**
 * Academia de Redes · Interfaz de ejercicios
 * ---------------------------------------------------------------------
 * Pinta enunciados, reglas de bits, tablas y pasos con el MISMO HTML que
 * app/Views/components/redes-ui.php, y monta un ejercicio interactivo.
 *
 * Seguridad: fmt() escapa antes de aplicar el marcado, y lo que escribe el
 * estudiante solo se lee de input.value; nunca se inserta como HTML.
 */
import { resolver, evaluarCampo, respuestaDe } from './motor.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
export const fmt = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code class="rd-c">$1</code>');

/**
 * Regla de bits. filas = [{ et, ip, p, p0?, pulsable? }]. Con `pulsable`,
 * cada bit es un botón (data-bit = posición 0–31, data-fila = índice).
 */
export function htmlBits(filas, pie = '') {
  let html = '<figure class="rd-bits">';
  let haySub = false;
  filas.forEach((f, k) => {
    const p0 = f.p0 ?? f.p;
    haySub ||= p0 < f.p;
    html += `<div class="rd-bits__fila"><span class="rd-bits__et">${esc(f.et)}</span><span class="rd-bits__dir">`;
    String(f.ip).split('.').map(Number).forEach((o, i) => {
      html += `<span class="rd-bits__oct"><span class="rd-bits__celdas"${f.pulsable ? '' : ' aria-hidden="true"'}>`;
      o.toString(2).padStart(8, '0').split('').forEach((bit, j) => {
        const n = i * 8 + j;
        const clase = `rd-bit rd-bit--${n < p0 ? 'red' : n < f.p ? 'sub' : 'host'}${n === f.p - 1 && f.p < 32 ? ' rd-bit--corte' : ''}`;
        html += f.pulsable
          ? `<button type="button" class="${clase}" data-fila="${k}" data-bit="${n}" aria-label="${esc(f.et)}, bit ${n + 1}: ${bit}">${bit}</button>`
          : `<span class="${clase}">${bit}</span>`;
      });
      html += `</span><span class="rd-bits__dec">${o}</span></span>`;
    });
    html += '</span></div>';
  });
  const u = filas[filas.length - 1];
  const p0 = u.p0 ?? u.p;
  html += `<figcaption class="rd-bits__ley"><span class="rd-ley rd-ley--red">red · ${p0} bits</span>`;
  if (haySub) html += `<span class="rd-ley rd-ley--sub">subred · ${u.p - p0} bits</span>`;
  html += `<span class="rd-ley rd-ley--host">host · ${32 - u.p} bits</span>`;
  if (pie) html += `<span class="rd-bits__pie">${fmt(pie)}</span>`;
  return html + '</figcaption></figure>';
}

export function htmlTabla(t) {
  const cab = t.cab.map((c) => `<th scope="col">${fmt(c)}</th>`).join('');
  const filas = t.filas.map((f) => '<tr>' + f.map((c, i) => (i === 0 ? `<th scope="row">${fmt(c)}</th>` : `<td>${fmt(c)}</td>`)).join('') + '</tr>').join('');
  return `<div class="rd-tabla-caja"><table class="rd-tabla"><thead><tr>${cab}</tr></thead><tbody>${filas}</tbody></table></div>`
    + (t.pie ? `<p class="rd-tabla-pie">${fmt(t.pie)}</p>` : '');
}

export function htmlPasos(pasos) {
  return '<ol class="rd-pasos">' + pasos.map((p) => `<li><p>${fmt(p.t)}</p>${p.bits ? htmlBits(p.bits) : ''}${p.tabla ? htmlTabla(p.tabla) : ''}</li>`).join('') + '</ol>';
}

const MARCADOR = { ip: '0.0.0.0', red: '0.0.0.0/0', prefijo: '/0', numero: '0', binario: '00000000', comando: 'escribe el comando', texto: 'escribe la respuesta', ipv6: '2001:db8::1', red6: '2001:db8::/64', mac: '00:1a:2b:3c:4d:5e', hex: 'ff' };
const ANCHOS = new Set(['opcion', 'multi', 'comando', 'texto', 'ipv6', 'red6']);

/**
 * Diagrama de red: f = { ancho, alto, lineas: [[x1, y1, x2, y2]], nodos: [{ x, y, k, et }], alt, pie? }.
 * k: 'pc' (cuadro), 'sw' (rectángulo) o 'rt' (círculo). Mismo SVG que rd_figura() en PHP.
 */
export function htmlFigura(f) {
  const lineas = f.lineas.map(([a, b, c, d]) => `<line x1="${+a}" y1="${+b}" x2="${+c}" y2="${+d}"/>`).join('');
  const nodos = f.nodos.map((n) => {
    const x = +n.x, y = +n.y;
    const forma = n.k === 'rt' ? `<circle cx="${x}" cy="${y}" r="15"/>` : n.k === 'sw' ? `<rect x="${x - 22}" y="${y - 12}" width="44" height="24" rx="5"/>` : `<rect x="${x - 17}" y="${y - 12}" width="34" height="24" rx="3"/>`;
    return `<g class="rd-figura__nodo rd-figura__nodo--${n.k === 'rt' || n.k === 'sw' ? n.k : 'pc'}">${forma}<text x="${x}" y="${y + 4}" text-anchor="middle">${esc(n.et)}</text></g>`;
  }).join('');
  return `<figure class="rd-figura"><svg viewBox="0 0 ${+f.ancho} ${+f.alto}" role="img" aria-label="${esc(f.alt || 'Diagrama de red')}"><g class="rd-figura__lineas">${lineas}</g>${nodos}</svg>`
    + (f.pie ? `<figcaption>${fmt(f.pie)}</figcaption>` : '') + '</figure>';
}

/** Salida de consola que acompaña a un enunciado. */
export const htmlCodigo = (texto) => `<figure class="rd-codigo"><pre tabindex="0"><code>${esc(texto)}</code></pre></figure>`;
let serie = 0;

/**
 * Monta un ejercicio en `nodo`.
 *   op.numero      número visible
 *   op.modo        'guiado' (pistas y solución) | 'examen' (nada hasta corregir desde fuera)
 *   op.hecho       ya estaba resuelto de antes
 *   op.alTerminar  ({ correcto, intentos, pistas, revelado }) al acertar o al ver la solución
 * Devuelve { corregir(), cerrar(), ejercicio }.
 */
export function montarEjercicio(nodo, spec, op = {}) {
  const ej = resolver(spec);
  const id = 'rd-ej-' + (++serie);
  const examen = op.modo === 'examen';
  let intentos = 0;
  let pistas = 0;
  let terminado = false;

  nodo.classList.add('rd-ej');
  nodo.dataset.estado = op.hecho ? 'hecho' : 'pendiente';
  nodo.innerHTML = `
    <header class="rd-ej__cab">
      <span class="rd-ej__num">${examen ? 'Pregunta' : 'Ejercicio'} ${op.numero ?? ''}</span>
      <span class="rd-ej__tipo">${esc(ej.nombre)}</span>
      <span class="rd-ej__marca" data-marca>${op.hecho ? 'Resuelto' : ''}</span>
    </header>
    <div class="rd-ej__enunciado"><p>${fmt(ej.enunciado)}</p>${ej.figura ? htmlFigura(ej.figura) : ''}${ej.codigo ? htmlCodigo(ej.codigo) : ''}${ej.tabla ? htmlTabla(ej.tabla) : ''}</div>
    <form class="rd-ej__campos" novalidate>
      ${ej.campos.map((c, i) => htmlCampo(c, `${id}-${i}`)).join('')}
      <div class="rd-ej__acciones">
        ${examen ? '' : `<button type="submit" class="rd-btn rd-btn--primario">Comprobar</button>
        ${ej.pistas.length ? `<button type="button" class="rd-btn" data-pista>Pista (0/${ej.pistas.length})</button>` : ''}
        <button type="button" class="rd-btn rd-btn--texto" data-revelar>Ver solución</button>`}
      </div>
    </form>
    <ol class="rd-ej__pistas" data-pistas hidden></ol>
    <p class="rd-ej__resultado" data-resultado role="status" aria-live="polite"></p>
    <div class="rd-ej__solucion" data-solucion hidden></div>`;

  const form = nodo.querySelector('form');
  const resultado = nodo.querySelector('[data-resultado]');
  const cajas = [...nodo.querySelectorAll('[data-campo]')];

  const valor = (i) => {
    const c = ej.campos[i];
    if (c.tipo === 'multi') return [...cajas[i].querySelectorAll('input:checked')].map((x) => x.value).join(',');
    if (c.tipo === 'opcion') return c.desplegable ? cajas[i].querySelector('select').value : form.querySelector(`input[name="${id}-${i}"]:checked`)?.value ?? '';
    return cajas[i].querySelector('input').value;
  };

  function corregir() {
    let bien = 0;
    ej.campos.forEach((c, i) => {
      const v = valor(i);
      const ok = evaluarCampo(c, v);
      bien += ok ? 1 : 0;
      cajas[i].classList.toggle('es-ok', ok);
      cajas[i].classList.toggle('es-mal', !ok);
      cajas[i].querySelector('[data-veredicto]').textContent = ok ? 'Correcto' : String(v).trim() === '' ? 'Sin responder' : 'Incorrecto';
      cajas[i].querySelectorAll('input, select').forEach((x) => x.setAttribute('aria-invalid', ok ? 'false' : 'true'));
    });
    return { bien, total: ej.campos.length };
  }

  function mostrarSolucion(conRespuestas) {
    if (conRespuestas) {
      ej.campos.forEach((c, i) => {
        if (cajas[i].classList.contains('es-ok')) return;
        const s = cajas[i].querySelector('[data-correcta]');
        s.textContent = 'Respuesta: ' + respuestaDe(c);
        s.hidden = false;
      });
    }
    const sol = nodo.querySelector('[data-solucion]');
    sol.innerHTML = `<details ${examen ? '' : 'open'}><summary>Procedimiento paso a paso</summary>${htmlPasos(ej.pasos)}</details>`;
    sol.hidden = false;
  }

  function cerrar(correcto, revelado) {
    if (terminado) return;
    terminado = true;
    form.querySelectorAll('input, select, button[type="submit"], [data-pista], [data-revelar]').forEach((x) => { x.disabled = true; });
    nodo.dataset.estado = correcto ? 'hecho' : 'revelado';
    if (correcto) nodo.querySelector('[data-marca]').textContent = 'Resuelto';
    mostrarSolucion(!correcto);
    op.alTerminar?.({ correcto, intentos, pistas, revelado, tipo: ej.tipo });
  }

  if (!examen) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (terminado) return;
      intentos++;
      const { bien, total } = corregir();
      if (bien === total) {
        resultado.className = 'rd-ej__resultado es-ok';
        resultado.textContent = intentos === 1 && pistas === 0 ? '¡Correcto a la primera!' : '¡Correcto!';
        cerrar(true, false);
      } else {
        resultado.className = 'rd-ej__resultado es-mal';
        resultado.textContent = total === 1 ? 'Todavía no. Revísalo o pide una pista.' : `${bien} de ${total} campos correctos. Corrige los marcados en rojo.`;
        form.querySelector('.es-mal :is(input, select)')?.focus();
      }
    });
    nodo.querySelector('[data-pista]')?.addEventListener('click', (ev) => {
      if (pistas >= ej.pistas.length) return;
      const lista = nodo.querySelector('[data-pistas]');
      const li = document.createElement('li');
      li.innerHTML = fmt(ej.pistas[pistas++]);
      lista.append(li);
      lista.hidden = false;
      ev.currentTarget.textContent = `Pista (${pistas}/${ej.pistas.length})`;
      if (pistas >= ej.pistas.length) ev.currentTarget.disabled = true;
    });
    nodo.querySelector('[data-revelar]').addEventListener('click', () => {
      corregir();
      resultado.className = 'rd-ej__resultado';
      resultado.textContent = 'Solución mostrada. Repasa el procedimiento e intenta uno parecido.';
      cerrar(false, true);
    });
  } else {
    form.addEventListener('submit', (ev) => ev.preventDefault());
  }

  return {
    ejercicio: ej,
    /** Modo examen: corrige, bloquea y devuelve la fracción de campos acertados. */
    calificar() {
      const { bien, total } = corregir();
      terminado = true;
      form.querySelectorAll('input, select').forEach((x) => { x.disabled = true; });
      nodo.dataset.estado = bien === total ? 'hecho' : 'revelado';
      resultado.className = 'rd-ej__resultado ' + (bien === total ? 'es-ok' : 'es-mal');
      resultado.textContent = bien === total ? 'Correcta.' : `${bien} de ${total} campos correctos.`;
      mostrarSolucion(true);
      return bien / total;
    },
  };
}

function htmlCampo(c, nombre) {
  const pie = '<span class="rd-campo__veredicto" data-veredicto></span><span class="rd-campo__correcta" data-correcta hidden></span>';
  if (c.tipo === 'opcion' && c.desplegable) {
    return `<div class="rd-campo rd-campo--elegir" data-campo>
      <label for="${nombre}">${fmt(c.etiqueta)}</label>
      <select id="${nombre}"><option value="">Elige…</option>${c.opciones.map((o, i) => `<option value="${i}">${esc(String(o).replace(/\*\*|\`/g, ''))}</option>`).join('')}</select>
      ${pie}</div>`;
  }
  if (c.tipo === 'opcion' || c.tipo === 'multi') {
    const multi = c.tipo === 'multi';
    return `<fieldset class="rd-campo rd-campo--opcion${multi || c.lista ? ' rd-campo--lista' : ''}" data-campo>
      <legend>${esc(c.etiqueta)}</legend>
      <div class="rd-opciones">${c.opciones.map((o, i) => `<label class="rd-opcion"><input type="${multi ? 'checkbox' : 'radio'}" name="${nombre}" value="${i}"><span>${fmt(o)}</span></label>`).join('')}</div>
      ${pie}</fieldset>`;
  }
  const numerico = c.tipo === 'numero' || c.tipo === 'binario';
  const texto = ANCHOS.has(c.tipo) || c.tipo === 'mac' || c.tipo === 'hex';
  return `<div class="rd-campo rd-campo--${c.tipo}${ANCHOS.has(c.tipo) ? ' rd-campo--ancho' : ''}" data-campo>
    <label for="${nombre}">${esc(c.etiqueta)}</label>
    <input id="${nombre}" type="text" inputmode="${numerico ? 'numeric' : texto ? 'text' : 'decimal'}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${MARCADOR[c.tipo] ?? ''}">
    ${pie}</div>`;
}
