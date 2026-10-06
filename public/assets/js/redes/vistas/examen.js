/**
 * Examen: preguntas generadas, sin pistas; se califica todo al entregar.
 *
 * Un examen de módulo es { id, nombre, niveles, preguntas }. Un simulacro de
 * certificación es { id, nombre, minutos, aprobado, partes: [{ nombre, modulo,
 * niveles, preguntas }] }: mezcla módulos, corre con cuenta atrás y al final
 * desglosa la nota por parte.
 */
import { azar, generar, cargarBancos } from '../motor.js';
import { montarEjercicio, esc } from '../ui.js';
import { mejorExamen, registrarExamen } from '../progreso.js';

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export async function iniciar(config) {
  const inicio = document.querySelector('[data-inicio]');
  const zona = document.querySelector('[data-examen-zona]');
  const preguntas = document.querySelector('[data-preguntas]');
  const resultado = document.querySelector('[data-nota-final]');
  const entregar = document.querySelector('[data-entregar]');
  const otro = document.querySelector('[data-otro]');
  const relojNodo = document.querySelector('[data-reloj]');
  let montados = [];
  let actual = null;
  let reloj = null;
  let transcurrido = 0;

  function mejores() {
    document.querySelectorAll('[data-mejor]').forEach((s) => {
      const nota = mejorExamen(config.modulo, s.dataset.mejor);
      s.textContent = nota === null ? '' : `Tu mejor nota: ${nota}`;
    });
  }

  /** Lista de { modulo, nivel, parte } del examen, repartiendo cada parte entre sus niveles de menor a mayor. */
  function plan(def) {
    const partes = def.partes ?? [{ nombre: def.nombre, modulo: config.modulo, niveles: def.niveles, preguntas: def.preguntas }];
    return partes.flatMap((parte, k) => Array.from({ length: parte.preguntas }, (_, i) => ({
      modulo: parte.modulo, nivel: parte.niveles[Math.floor((i * parte.niveles.length) / parte.preguntas)], parte: k, nombre: parte.nombre,
    })));
  }

  function empezar(def) {
    actual = def;
    const rng = azar(Math.floor(Math.random() * 4294967295));
    const lista = plan(def);
    if (def.partes) for (let i = lista.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [lista[i], lista[j]] = [lista[j], lista[i]]; }
    const vistas = new Set();
    montados = [];
    preguntas.replaceChildren();
    lista.forEach((q, i) => {
      // Sin repetidas: se vuelve a sortear si la pregunta ya salió en este examen.
      let spec = generar(q.modulo, q.nivel, rng);
      for (let k = 0; k < 20 && vistas.has(spec.pregunta ?? JSON.stringify(spec)); k++) spec = generar(q.modulo, q.nivel, rng);
      vistas.add(spec.pregunta ?? JSON.stringify(spec));
      const nodo = document.createElement('article');
      nodo.__spec = spec;
      preguntas.append(nodo);
      montados.push({ ...q, ...montarEjercicio(nodo, spec, { numero: i + 1, modo: 'examen' }) });
    });
    document.querySelector('[data-examen-titulo]').textContent = `${def.partes ? '' : 'Examen '}${def.partes ? def.nombre : def.nombre.toLowerCase()} · ${lista.length} preguntas`;
    inicio.hidden = true;
    zona.hidden = false;
    resultado.hidden = true;
    entregar.hidden = false;
    otro.hidden = true;
    const t0 = Date.now();
    const limite = def.minutos ? def.minutos * 60 : 0;
    clearInterval(reloj);
    const tic = () => {
      transcurrido = Math.floor((Date.now() - t0) / 1000);
      const queda = limite - transcurrido;
      relojNodo.textContent = limite ? mmss(Math.max(0, queda)) : mmss(transcurrido);
      relojNodo.parentElement.classList.toggle('es-poco', limite > 0 && queda <= 300);
      if (limite && queda <= 0) calificar(true);
    };
    relojNodo.parentElement.setAttribute('aria-label', limite ? 'Tiempo restante' : 'Tiempo transcurrido');
    tic();
    reloj = setInterval(tic, 1000);
    zona.scrollIntoView({ block: 'start' });
  }

  function calificar(agotado = false) {
    if (!actual || !entregar || entregar.hidden) return;
    clearInterval(reloj);
    const aprobado = actual.aprobado ?? 80;
    const puntos = montados.map((m) => m.calificar());
    const media = (lista) => Math.round((lista.reduce((a, b) => a + b, 0) / Math.max(1, lista.length)) * 100);
    const nota = media(puntos);
    const perfectas = puntos.filter((x) => x === 1).length;
    registrarExamen(config.modulo, actual.id, nota);
    resultado.innerHTML = '';
    const h = document.createElement('h2');
    h.className = 'rd-nota-final__cifra';
    h.textContent = `${nota} / 100`;
    const p = document.createElement('p');
    p.textContent = (agotado ? 'Se acabó el tiempo. ' : '')
      + `${perfectas} de ${puntos.length} preguntas completamente correctas en ${mmss(transcurrido)}. `
      + (nota >= aprobado ? (actual.partes ? 'Aprobado: vas bien encaminado al examen real.' : 'Aprobado: dominas este nivel.')
        : `Se aprueba con ${aprobado}. Abre el procedimiento de las preguntas falladas y vuelve a intentarlo.`);
    resultado.append(h, p);
    if (actual.partes) {
      // Desglose por dominio: dice dónde hay que repasar.
      const nombres = [...new Set(actual.partes.map((x) => x.nombre))];
      const filas = nombres.length < 2 ? '' : nombres.map((nombre) => {
        const mias = puntos.filter((_, i) => montados[i].nombre === nombre);
        const n = media(mias);
        return `<tr><th scope="row">${esc(nombre)}</th><td>${mias.filter((x) => x === 1).length} de ${mias.length}</td><td class="${n >= aprobado ? 'es-ok' : 'es-mal'}">${n} %</td></tr>`;
      }).join('');
      const caja = document.createElement('div');
      caja.className = 'rd-tabla-caja';
      caja.innerHTML = `<table class="rd-tabla rd-desglose"><thead><tr><th scope="col">Dominio</th><th scope="col">Correctas</th><th scope="col">Nota</th></tr></thead><tbody>${filas}</tbody></table>`;
      if (filas) resultado.append(caja);
    }
    resultado.classList.toggle('es-aprobado', nota >= aprobado);
    resultado.hidden = false;
    entregar.hidden = true;
    otro.hidden = false;
    resultado.scrollIntoView({ block: 'center' });
    mejores();
  }

  entregar.addEventListener('click', () => calificar(false));
  otro.addEventListener('click', () => { zona.hidden = true; inicio.hidden = false; inicio.scrollIntoView({ block: 'start' }); });
  mejores();
  try { await cargarBancos(config.bancos); } catch (e) {
    inicio.insertAdjacentHTML('beforeend', '<p class="rd-aviso">No se pudieron cargar las preguntas. Recarga la página.</p>');
    throw e;
  }
  document.querySelectorAll('[data-examen]').forEach((b) => b.addEventListener('click', () => {
    const def = (config.examenes ?? []).find((x) => x.id === b.dataset.examen);
    if (def) empezar(def);
  }));
}
