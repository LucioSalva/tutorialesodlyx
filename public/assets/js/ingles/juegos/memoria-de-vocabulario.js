/**
 * Juego 4 · Memoria de vocabulario: parejas imagen ↔ palabra o inglés ↔
 * español. Cada carta es un <button> con texto (nunca solo color) y cada
 * intento se anuncia por aria-live.
 */
import { el, barajar, botonOir } from './base.js';
import { decir } from '../voz.js';

export async function iniciar(contenedor, { juego, nivel, progreso, base, alSiguienteNivel }) {
  const vocab = await fetch(`${base}/assets/ingles/data/vocabulario.json`).then(r => r.json());
  const jugar = () => {
    // Una partida por contenedor: los temporizadores de la anterior no deben
    // tocar este tablero.
    contenedor._partida?.abort();
    const ctrl = new AbortController();
    contenedor._partida = ctrl;
    const tarde = (fn, ms) => { const t = setTimeout(() => { if (!ctrl.signal.aborted) fn(); }, ms); ctrl.signal.addEventListener('abort', () => clearTimeout(t)); };
    contenedor.textContent = '';
    const candidatas = vocab.palabras.filter(p => nivel.temas.includes(p.tema) && (nivel.modo !== 'imagen' || p.emoji));
    const unicas = [...new Map(candidatas.map(p => [p.en.toLowerCase(), p])).values()];
    const elegidas = barajar(unicas).slice(0, nivel.parejas || 6);
    const cartas = barajar(elegidas.flatMap((p, i) => [
      { pareja: i, cara: 'en', texto: p.en, lang: 'en' },
      nivel.modo === 'imagen' ? { pareja: i, cara: 'img', texto: p.emoji, emoji: true, alt: 'imagen' } : { pareja: i, cara: 'es', texto: p.es, lang: 'es' },
    ]));
    let abiertas = []; let hechas = 0; let fallos = 0; let pistas = 0;
    const estado = el('p', { clase: 'in-reto__explica', role: 'status', 'aria-live': 'polite', texto: 'Destapa dos cartas que signifiquen lo mismo.' });
    const marcador = el('p', { clase: 'in-hud__datos' });
    const pintarMarcador = () => { marcador.textContent = `Parejas ${hechas}/${elegidas.length} · Fallos ${fallos}`; };
    const tablero = el('div', { clase: 'in-memoria', role: 'grid', 'aria-label': 'Tablero de memoria' });
    const btnPista = el('button', { type: 'button', clase: 'in-btn in-btn--fino', texto: 'Pista: ver todas 2 s' });
    btnPista.addEventListener('click', () => {
      pistas++; fallos++;
      botones.forEach(b => { if (!b.classList.contains('es-pareja')) b.setAttribute('aria-pressed', 'true'); });
      tarde(() => botones.forEach(b => { if (!b.classList.contains('es-pareja') && !abiertas.includes(b)) b.setAttribute('aria-pressed', 'false'); }), 2000);
      pintarMarcador();
    });
    const botones = cartas.map((c, i) => {
      const b = el('button', { type: 'button', clase: 'in-carta' + (c.emoji ? ' es-emoji' : ''), 'aria-pressed': 'false', 'aria-label': `Carta ${i + 1}, tapada` },
        el('span', { clase: 'in-carta__cara', lang: c.lang || null, texto: c.texto }));
      b.addEventListener('click', () => {
        if (b.getAttribute('aria-pressed') === 'true' || abiertas.length === 2) return;
        b.setAttribute('aria-pressed', 'true');
        b.setAttribute('aria-label', `Carta ${i + 1}: ${c.emoji ? 'imagen de ' + elegidas[c.pareja].es : c.texto}`);
        if (c.cara === 'en') decir(c.texto).catch(() => {});
        abiertas.push(b);
        if (abiertas.length < 2) return;
        const [x, y] = abiertas.map(a => cartas[botones.indexOf(a)]);
        if (x.pareja === y.pareja && x.cara !== y.cara) {
          abiertas.forEach(a => a.classList.add('es-pareja'));
          hechas++;
          const p = elegidas[x.pareja];
          estado.textContent = `✓ «${p.en}» = ${p.es}.`;
          abiertas = [];
          pintarMarcador();
          if (hechas === elegidas.length) terminar();
        } else {
          fallos++;
          abiertas.forEach(a => a.classList.add('es-fallo'));
          estado.textContent = '✗ No son pareja. Memoriza dónde estaban.';
          pintarMarcador();
          tarde(() => {
            abiertas.forEach(a => { a.classList.remove('es-fallo'); a.setAttribute('aria-pressed', 'false'); a.setAttribute('aria-label', 'Carta tapada'); });
            abiertas = [];
          }, 1100);
        }
      });
      return b;
    });
    tablero.append(...botones);
    contenedor.append(el('div', { clase: 'in-hud' }, el('p', { clase: 'in-etiqueta', style: 'margin:0;width:100%', texto: `${juego.nombre} · ${nivel.nombre}` }), marcador, el('div', { clase: 'in-hud__acciones' }, btnPista)),
      el('p', { clase: 'in-nota-pie', style: 'margin:0', texto: nivel.objetivo }), tablero, estado);
    pintarMarcador();

    function terminar() {
      const pct = Math.round((elegidas.length / (elegidas.length + fallos)) * 100);
      const minimo = nivel.exito?.minimo ?? 60;
      const superado = pct >= minimo;
      progreso.registrarNivel(juego.slug, nivel.id, { superado, puntos: Math.max(0, elegidas.length * 10 - fallos * 3) });
      progreso.anadirTarjetas(elegidas.map(p => 'v:' + p.id), 'v');
      tarde(() => {
        contenedor.textContent = '';
        const lista = el('ul', { clase: 'in-repasar' }, ...elegidas.map(p => el('li', {}, p.emoji ? p.emoji + ' ' : '', el('b', { lang: 'en', texto: p.en }), ' ', botonOir(p.en), ` — ${p.es} · `, el('span', { lang: 'en', texto: p.ejemplo.en }))));
        const botonesFin = el('div', { clase: 'in-final__acciones' }, el('button', { type: 'button', clase: 'in-btn', texto: 'Jugar otra vez', onclick: jugar }));
        if (alSiguienteNivel) botonesFin.append(el('button', { type: 'button', clase: 'in-btn in-btn--primario', texto: 'Siguiente nivel', onclick: alSiguienteNivel }));
        contenedor.append(el('div', { clase: 'in-final' },
          el('p', { clase: 'in-final__icono', 'aria-hidden': 'true', texto: superado ? '🏆' : '🔁' }),
          el('h3', { texto: superado ? '¡Nivel superado!' : 'Todas las parejas, pero con muchos fallos' }),
          el('p', { texto: `Precisión ${pct} % (hace falta ${minimo} %) · ${fallos} fallos · ${pistas} pistas. Estas palabras ya están en tu repaso.` }),
          el('div', { clase: 'in-final__repaso' }, el('p', { clase: 'in-etiqueta', texto: 'Las palabras de esta partida' }), lista), botonesFin));
      }, 700);
    }
  };
  jugar();
}
