/**
 * Práctica: ejercicios generados al momento. La dirección de la página
 * guarda nivel y semilla (?nivel=3&s=12345), así un ejercicio concreto se
 * puede recargar o compartir.
 */
import { NIVELES, TIPOS, azar, generar } from '../motor.js';
import { montarEjercicio } from '../ui.js';
import { nivel as marcadorDe, registrarPractica } from '../progreso.js';

export function iniciar(config) {
  const niveles = NIVELES[config.modulo] ?? [];
  const zona = document.querySelector('[data-zona]');
  const selector = document.querySelector('[data-tipo]');
  const url = new URL(location.href);
  let n = niveles.some((x) => x.n === Number(url.searchParams.get('nivel'))) ? Number(url.searchParams.get('nivel')) : niveles[0]?.n;
  let semilla = /^\d{1,10}$/.test(url.searchParams.get('s') ?? '') ? Number(url.searchParams.get('s')) : null;
  let cuenta = 0;
  if (!n) return;

  const nuevaSemilla = () => Math.floor(Math.random() * 4294967295);

  function marcador() {
    const m = marcadorDe(config.modulo, n);
    for (const k of ['ok', 'racha', 'mejor']) document.querySelector(`[data-m="${k}"]`).textContent = String(m[k]);
  }

  function elegirNivel(nuevo, conservarSemilla = false) {
    n = nuevo;
    const def = niveles.find((x) => x.n === n);
    document.querySelectorAll('[data-nivel]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.nivel) === n)));
    document.querySelector('[data-resumen]').textContent = `Nivel ${n} · ${def.nombre}: ${def.resumen}`;
    selector.innerHTML = '<option value="">Todos los del nivel</option>'
      + def.tipos.map(([t]) => `<option value="${t}">${TIPOS[t].nombre}</option>`).join('');
    marcador();
    siguiente(conservarSemilla ? semilla : null);
  }

  function siguiente(fija = null) {
    semilla = fija ?? nuevaSemilla();
    const rng = azar(semilla);
    const tipo = selector.value;
    const spec = tipo && TIPOS[tipo] ? { tipo, ...TIPOS[tipo].crear(rng, n) } : generar(config.modulo, n, rng);
    url.searchParams.set('nivel', String(n));
    url.searchParams.set('s', String(semilla));
    history.replaceState(null, '', url);

    const nodo = document.createElement('article');
    zona.replaceChildren(nodo);
    montarEjercicio(nodo, spec, {
      numero: ++cuenta,
      alTerminar: (r) => { registrarPractica(config.modulo, n, r.correcto); marcador(); document.querySelector('[data-siguiente]').focus(); },
    });
  }

  document.querySelectorAll('[data-nivel]').forEach((b) => b.addEventListener('click', () => elegirNivel(Number(b.dataset.nivel))));
  selector.addEventListener('change', () => siguiente());
  document.querySelector('[data-siguiente]').addEventListener('click', () => { siguiente(); zona.scrollIntoView({ block: 'start', behavior: 'auto' }); });

  elegirNivel(n, semilla !== null);
}
