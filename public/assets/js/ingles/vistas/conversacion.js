/**
 * Vista: conversación interactiva ramificada.
 * El personaje habla; el estudiante elige o escribe. Cada intervención
 * explica qué significa la pregunta, qué estructura usa, por qué una
 * respuesta es adecuada o no, y qué alternativas había.
 */
import { el, fmt, botonOir } from '../ejercicios.js';
import { asignarRoles } from '../audio-textos.js';
import { evaluar } from '../evaluador.js';
import { decir, cargarConfig } from '../voz.js';

export async function montar(cfg, { progreso, anunciar }) {
  const s = cfg.escenario;
  try { await cargarConfig(); } catch { /* sin config: los botones avisarán al pulsarse */ }
  // Voces: el personaje y «Tú», repartidos como en cualquier diálogo.
  const roles = asignarRoles([...s.nodos.map(n => n.quien), 'Tú']);
  progreso.visitar({ url: location.pathname, titulo: 'Conversación: ' + s.titulo, tipo: 'conversacion' });
  const nodos = new Map(s.nodos.map(n => [n.id, n]));
  const chat = document.querySelector('[data-chat]');
  chat.textContent = '';

  let vozAuto = true;
  let fallos = 0;
  let turnos = 0;
  const historial = el('ol', { clase: 'in-chat__historial in-dialogo__lineas' });
  const zona = el('div', { clase: 'in-chat__zona' });
  const auto = el('label', { clase: 'in-nota-pie' }, el('input', { type: 'checkbox', checked: true }), ' Leer en voz alta cada frase del personaje');
  auto.querySelector('input').addEventListener('change', (e) => { vozAuto = e.target.checked; });
  chat.append(auto, historial, zona);

  const burbuja = (lado, quien, en, es, extra = null, audio = en) => {
    const li = el('li', { clase: `in-burbuja in-burbuja--${lado}` },
      el('span', { clase: 'in-burbuja__quien', texto: quien }),
      el('span', { clase: 'in-burbuja__en', lang: 'en', texto: en }),
      audio ? botonOir(audio, { rol: roles.get(quien) || 'n' }) : '',
      es ? el('span', { clase: 'in-burbuja__es', texto: es }) : '');
    if (extra) li.append(extra);
    historial.append(li);
    return li;
  };

  function mostrar(id) {
    const n = nodos.get(id);
    if (!n) return;
    zona.textContent = '';
    if (n.fin) {
      if (n.en) burbuja('a', n.quien || s.personaje.split(/[,(]/)[0], n.en, n.es);
      zona.append(el('div', { clase: 'in-chat__fin' },
        el('p', { html: '<b>Conversación completada.</b> ' + fmt(n.resumen || '') }),
        el('p', { clase: 'in-nota-pie', texto: `${turnos} intervenciones · ${fallos} respuesta${fallos === 1 ? '' : 's'} a corregir por el camino.` }),
        el('div', { clase: 'in-ej__acciones' },
          el('button', { type: 'button', clase: 'in-btn in-btn--primario in-btn--fino', texto: 'Empezar de nuevo', onclick: () => { historial.textContent = ''; fallos = 0; turnos = 0; mostrar(s.inicio); } }))));
      progreso.registrarPractica(cfg.clave, { aciertos: turnos, total: turnos + fallos });
      anunciar('Conversación completada.', 'ok');
      return;
    }

    const li = burbuja('a', n.quien, n.en, n.es);
    li.classList.add('con-traduccion-oculta');
    if (vozAuto) decir(n.en, { rol: roles.get(n.quien) || 'n' }).catch(() => {});

    const ayuda = el('div', { clase: 'in-chat__ayuda', hidden: true },
      el('p', { html: '<b>Qué te pregunta:</b> ' + fmt(n.significa || '') }),
      el('p', { html: '<b>Estructura:</b> ' + fmt(n.estructura || '') }),
      el('p', { html: '<b>Traducción:</b> ' + fmt(n.es || '') }));
    const btnAyuda = el('button', { type: 'button', clase: 'in-btn in-btn--fino in-btn--suave', 'aria-expanded': 'false', texto: '¿Qué significa?' });
    btnAyuda.addEventListener('click', () => {
      ayuda.hidden = !ayuda.hidden;
      btnAyuda.setAttribute('aria-expanded', String(!ayuda.hidden));
    });

    const explica = el('p', { clase: 'in-reto__explica', role: 'status' });
    const opciones = el('div', { clase: 'in-chat__opciones', role: 'group', 'aria-label': 'Tus posibles respuestas' });
    n.respuestas.forEach((r, i) => {
      const b = el('button', { type: 'button', clase: 'in-btn in-chat__opcion', lang: 'en', texto: r.texto });
      b.addEventListener('click', () => {
        if (!r.correcta) {
          fallos++;
          b.classList.add('es-mal');
          b.disabled = true;
          explica.innerHTML = '<b>Esa no encaja.</b> ' + fmt(r.porque);
          return;
        }
        turnos++;
        const otras = n.respuestas.filter((x, k) => x.correcta && k !== i).map(x => x.texto);
        const nota = el('span', { clase: 'in-burbuja__es', html: '✓ ' + fmt(r.porque) + (otras.length ? '<br>También podías decir: ' + otras.map(o => `<span lang="en">«${fmt(o)}»</span>`).join(', ') : '') });
        nota.style.display = 'block';
        burbuja('b', 'Tú', r.texto, '', nota);
        mostrar(r.siguiente);
      });
      opciones.append(b);
    });

    zona.append(el('div', { clase: 'in-ej__acciones' }, btnAyuda), ayuda, el('p', { clase: 'in-etiqueta', texto: '¿Qué respondes?' }), opciones, explica);

    if (n.escribir) {
      const campo = el('input', { type: 'text', clase: 'in-input', lang: 'en', autocomplete: 'off', spellcheck: 'false', placeholder: 'O escribe tu respuesta en inglés…', 'aria-label': 'Escribe tu respuesta' });
      const form = el('form', { clase: 'in-mazo__responder' }, campo, el('button', { type: 'submit', clase: 'in-btn in-btn--fino', texto: 'Responder escribiendo' }));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const res = evaluar({ tipo: 'traducir', respuestas: n.escribir.respuestas }, campo.value);
        if (res.vacio) return;
        if (res.correcto) {
          turnos++;
          const nota = el('span', { clase: 'in-burbuja__es', html: '✓ Correcto. Otras formas válidas: ' + n.escribir.respuestas.slice(0, 3).map(o => `<span lang="en">«${fmt(o)}»</span>`).join(', ') + '. El audio reproduce la primera.' });
          nota.style.display = 'block';
          // Lo tecleado no tiene audio propio: se escucha la forma modelo.
          burbuja('b', 'Tú', campo.value, '', nota, n.escribir.respuestas[0]);
          mostrar(n.escribir.siguiente);
        } else {
          fallos++;
          explica.innerHTML = res.casi
            ? '<b>Casi:</b> hay una palabra mal escrita.'
            : '<b>Así no funciona aquí.</b> Revisa la estructura (pulsa «¿Qué significa?») o fíjate en las respuestas de arriba: alguna encaja.';
        }
      });
      zona.append(el('p', { clase: 'in-etiqueta', texto: 'Si prefieres, escríbela tú' }), form);
    }
    zona.querySelector('button.in-chat__opcion')?.focus({ preventScroll: true });
    zona.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  mostrar(s.inicio);
}
