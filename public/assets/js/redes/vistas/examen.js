/** Examen: preguntas generadas, sin pistas; se califica todo al entregar. */
import { azar, generar } from '../motor.js';
import { montarEjercicio } from '../ui.js';
import { mejorExamen, registrarExamen } from '../progreso.js';

const APROBADO = 80;

export function iniciar(config) {
  const inicio = document.querySelector('[data-inicio]');
  const zona = document.querySelector('[data-examen-zona]');
  const preguntas = document.querySelector('[data-preguntas]');
  const resultado = document.querySelector('[data-nota-final]');
  const entregar = document.querySelector('[data-entregar]');
  const otro = document.querySelector('[data-otro]');
  let montados = [];
  let actual = null;
  let reloj = null;

  function mejores() {
    document.querySelectorAll('[data-mejor]').forEach((s) => {
      const nota = mejorExamen(config.modulo, s.dataset.mejor);
      s.textContent = nota === null ? '' : `Tu mejor nota: ${nota}`;
    });
  }

  function empezar(def) {
    actual = def;
    const rng = azar(Math.floor(Math.random() * 4294967295));
    montados = [];
    preguntas.replaceChildren();
    // Las preguntas se reparten entre los niveles del examen, de menor a mayor.
    for (let i = 0; i < def.preguntas; i++) {
      const nivel = def.niveles[Math.floor((i * def.niveles.length) / def.preguntas)];
      const nodo = document.createElement('article');
      preguntas.append(nodo);
      montados.push(montarEjercicio(nodo, generar(config.modulo, nivel, rng), { numero: i + 1, modo: 'examen' }));
    }
    document.querySelector('[data-examen-titulo]').textContent = `Examen ${def.nombre.toLowerCase()} · ${def.preguntas} preguntas`;
    inicio.hidden = true;
    zona.hidden = false;
    resultado.hidden = true;
    entregar.hidden = false;
    otro.hidden = true;
    const t0 = Date.now();
    clearInterval(reloj);
    const tic = () => {
      const s = Math.floor((Date.now() - t0) / 1000);
      document.querySelector('[data-reloj]').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };
    tic();
    reloj = setInterval(tic, 1000);
    zona.scrollIntoView({ block: 'start' });
  }

  entregar.addEventListener('click', () => {
    clearInterval(reloj);
    const puntos = montados.map((m) => m.calificar());
    const nota = Math.round((puntos.reduce((a, b) => a + b, 0) / puntos.length) * 100);
    const perfectas = puntos.filter((x) => x === 1).length;
    registrarExamen(config.modulo, actual.id, nota);
    resultado.innerHTML = '';
    const h = document.createElement('h2');
    h.className = 'rd-nota-final__cifra';
    h.textContent = `${nota} / 100`;
    const p = document.createElement('p');
    p.textContent = `${perfectas} de ${puntos.length} preguntas completamente correctas en ${document.querySelector('[data-reloj]').textContent}. `
      + (nota >= APROBADO ? 'Aprobado: dominas este nivel.' : `Se aprueba con ${APROBADO}. Abre el procedimiento de las preguntas falladas y vuelve a intentarlo.`);
    resultado.append(h, p);
    resultado.classList.toggle('es-aprobado', nota >= APROBADO);
    resultado.hidden = false;
    entregar.hidden = true;
    otro.hidden = false;
    resultado.scrollIntoView({ block: 'center' });
    mejores();
  });

  otro.addEventListener('click', () => { zona.hidden = true; inicio.hidden = false; inicio.scrollIntoView({ block: 'start' }); });
  document.querySelectorAll('[data-examen]').forEach((b) => b.addEventListener('click', () => {
    const def = (config.examenes ?? []).find((x) => x.id === b.dataset.examen);
    if (def) empezar(def);
  }));
  mejores();
}
