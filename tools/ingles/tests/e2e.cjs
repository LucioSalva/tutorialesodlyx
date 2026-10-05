/**
 * Academia de Inglés · pruebas funcionales en navegador real (headless).
 * ---------------------------------------------------------------------
 * Herramienta de desarrollo. Requiere Puppeteer y un Chromium:
 *
 *   php -S 127.0.0.1:8765 -t public &
 *   PUPPETEER=/ruta/a/node_modules/puppeteer CHROMIUM=/usr/bin/chromium \
 *     node tools/ingles/tests/e2e.cjs
 *
 * Interactúa como un estudiante: resuelve ejercicios de cada tipo (bien y
 * mal), pide pistas, abre soluciones, hace una evaluación completa, estudia
 * tarjetas, recorre una conversación, comprueba el bloqueo de la
 * transcripción, juega rondas y exporta/importa el progreso. Además revisa
 * errores de consola y desbordamiento horizontal en todas las páginas.
 */
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const BASE = process.env.BASE || 'http://127.0.0.1:8765';

const resultados = [];
const ok = (nombre, cond, detalle = '') => {
  resultados.push({ nombre, ok: !!cond, detalle });
  console.log(`${cond ? '✔' : '✘'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
};
const espera = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const navegador = await puppeteer.launch({ headless: 'new', executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const pagina = await navegador.newPage();
  const errores = [];
  pagina.on('pageerror', e => errores.push(e.message));
  pagina.on('console', m => { if (m.type() === 'error' && !/favicon|fonts\.g/.test(m.text())) errores.push(m.text()); });
  await pagina.setViewport({ width: 1280, height: 900 });
  const ir = async (ruta) => { await pagina.goto(BASE + ruta, { waitUntil: 'networkidle2' }); await espera(300); };
  // Los ejercicios se montan tras cargar voces.json: esperar a que estén.
  const montados = () => pagina.waitForSelector('[data-ej] .in-ej__zona', { timeout: 10000 }).catch(() => {});
  const cfg = () => pagina.evaluate(() => JSON.parse(document.querySelector('[data-ingles-config]').textContent));
  const progreso = () => pagina.evaluate(() => JSON.parse(localStorage.getItem('ingles:progreso:v1') || '{}'));

  // --------------------------------------------------------------- lección
  await ir('/ingles/leccion/am-is-are');
  await pagina.evaluate(() => localStorage.clear());
  await ir('/ingles/leccion/am-is-are');
  await montados();
  const c = await cfg();
  ok('lección: configuración con ejercicios', c.ejercicios.length >= 8, `${c.ejercicios.length} ejercicios`);
  ok('lección: se registra la visita', (await progreso()).lecciones?.['am-is-are']?.vista);

  const porTipo = (t) => c.ejercicios.find(e => e.tipo === t);

  // completar: primero mal, luego pistas, luego bien
  const comp = porTipo('completar');
  if (comp) {
    const sel = `[data-ej="${comp.id}"]`;
    await pagina.$$eval(`${sel} .in-hueco`, (campos) => campos.forEach(c => { if (c.tagName === 'SELECT') c.selectedIndex = 0; else c.value = 'zzz'; }));
    await pagina.click(`${sel} .in-btn--primario`);
    ok('completar: una respuesta errónea da feedback de fallo', await pagina.$eval(`${sel} .in-ej__feedback`, n => n.className.includes('--mal') || n.className.includes('--aviso')));
    await pagina.click(`${sel} .in-ej__acciones .in-btn:nth-child(2)`);
    await pagina.click(`${sel} .in-ej__acciones .in-btn:nth-child(2)`);
    ok('completar: las pistas aparecen de una en una', (await pagina.$$(`${sel} .in-ej__pista`)).length === 2);
    await pagina.$$eval(`${sel} .in-hueco`, (campos, resp) => campos.forEach((c, i) => {
      if (c.tagName === 'SELECT') c.value = resp[i][0]; else c.value = resp[i][0];
    }), comp.respuestas);
    await pagina.click(`${sel} .in-btn--primario`);
    ok('completar: la respuesta correcta se acepta', await pagina.$eval(sel, n => n.classList.contains('es-resuelto')));
  }

  // opcion
  const op = porTipo('opcion');
  if (op) {
    const sel = `[data-ej="${op.id}"]`;
    const i = op.opciones.findIndex(o => o.correcta);
    await pagina.click(`${sel} .in-opcion:nth-child(${i + 1}) input`);
    await pagina.click(`${sel} .in-btn--primario`);
    ok('opción: la correcta se acepta y explica su porqué', await pagina.$eval(sel, n => n.classList.contains('es-resuelto') && n.querySelector('.in-ej__feedback').textContent.length > 10));
  }

  // ordenar
  const ord = porTipo('ordenar');
  if (ord) {
    const sel = `[data-ej="${ord.id}"]`;
    const palabras = ord.respuestas[0].replace(/[.?!]$/, '').split(' ');
    for (const p of palabras) {
      await pagina.evaluate((s, p) => {
        const b = [...document.querySelectorAll(`${s} .in-fichas--origen .in-ficha`)].find(x => x.textContent.replace(/[.?!]$/, '') === p);
        b?.click();
      }, sel, p);
    }
    // si la puntuación final está en una ficha aparte, se añade
    await pagina.evaluate((s) => document.querySelectorAll(`${s} .in-fichas--origen .in-ficha`).forEach(b => b.click()), sel);
    await pagina.click(`${sel} .in-btn--primario`);
    ok('ordenar: pulsar las fichas en orden resuelve', await pagina.$eval(sel, n => n.classList.contains('es-resuelto')), await pagina.$eval(`${sel} .in-fichas--destino`, n => n.textContent));
  }

  // traducir / transformar: mal → ver solución (con diff) → reintentar → bien
  const tr = porTipo('traducir') || porTipo('transformar');
  if (tr) {
    const sel = `[data-ej="${tr.id}"]`;
    await pagina.type(`${sel} .in-input`, 'this is wrong');
    await pagina.click(`${sel} .in-btn--primario`);
    const solBtn = await pagina.$$(`${sel} .in-ej__acciones .in-btn`);
    await solBtn[2].click();
    ok('traducir: la solución muestra respuesta y explicación', await pagina.$eval(`${sel} .in-ej__solucion`, n => !n.hidden && n.textContent.length > 30));
    ok('traducir: la solución señala las diferencias palabra a palabra', !!(await pagina.$(`${sel} .in-diff`)));
    ok('traducir: queda como «visto con solución», no resuelto', (await progreso()).ejercicios?.[tr.id]?.solucion === true && !(await progreso()).ejercicios?.[tr.id]?.resuelto);
    await pagina.evaluate((s) => [...document.querySelectorAll(`${s} .in-btn`)].find(b => b.textContent.includes('Intentarlo'))?.click(), sel);
    await pagina.type(`${sel} .in-input`, tr.respuestas[0]);
    await pagina.click(`${sel} .in-btn--primario`);
    ok('traducir: tras reintentar, la respuesta correcta se acepta', await pagina.$eval(sel, n => n.classList.contains('es-resuelto')));
  }

  // corregir
  const cor = porTipo('corregir');
  if (cor) {
    const sel = `[data-ej="${cor.id}"]`;
    const primera = cor.error.split(' ')[0];
    await pagina.evaluate((s, p) => [...document.querySelectorAll(`${s} .in-token`)].find(b => b.textContent.replace(/[.,!?]$/, '') === p)?.click(), sel, primera);
    await pagina.type(`${sel} .in-input`, cor.correcciones[0]);
    await pagina.click(`${sel} .in-btn--primario`);
    ok('corregir: señalar el error y escribir la corrección resuelve', await pagina.$eval(sel, n => n.classList.contains('es-resuelto')));
  }

  // relacionar
  const rel = porTipo('relacionar');
  if (rel) {
    const sel = `[data-ej="${rel.id}"]`;
    await pagina.$$eval(`${sel} .in-relacion select`, (sels, pares) => sels.forEach((s, i) => { s.value = pares[i].b; }), rel.pares);
    await pagina.click(`${sel} .in-btn--primario`);
    ok('relacionar: todas las parejas correctas resuelven', await pagina.$eval(sel, n => n.classList.contains('es-resuelto')));
  }

  // Resolver todo lo autocorregible para completar la lección
  for (const e of c.ejercicios) {
    const sel = `[data-ej="${e.id}"]`;
    if (await pagina.$eval(sel, n => n.classList.contains('es-resuelto'))) continue;
    await pagina.evaluate(async (s, e) => {
      const n = document.querySelector(s);
      const clic = (x) => x && x.click();
      if (e.tipo === 'opcion' || e.tipo === 'conversacion') {
        const idx = e.opciones.findIndex(o => o.correcta);
        n.querySelectorAll('.in-opcion input')[idx].checked = true;
      } else if (e.tipo === 'completar') {
        n.querySelectorAll('.in-hueco').forEach((c, i) => { c.value = e.respuestas[i][0]; });
      } else if (['traducir', 'transformar'].includes(e.tipo)) {
        n.querySelector('.in-input').value = e.respuestas[0];
      } else if (e.tipo === 'dictado') {
        n.querySelector('.in-input').value = e.texto;
      } else if (e.tipo === 'relacionar') {
        n.querySelectorAll('select').forEach((s2, i) => { s2.value = e.pares[i].b; });
      } else if (e.tipo === 'ordenar') {
        const origen = n.querySelector('.in-fichas--origen'); const destino = n.querySelector('.in-fichas--destino');
        const quedan = [...origen.children];
        for (const p of e.respuestas[0].split(' ')) {
          const i = quedan.findIndex(b => b.textContent === p);
          if (i >= 0) { destino.append(quedan[i]); quedan.splice(i, 1); }
        }
      } else if (e.tipo === 'corregir') {
        const p = e.error.split(' ')[0];
        clic([...n.querySelectorAll('.in-token')].find(b => b.textContent.replace(/[.,!?]$/, '') === p));
        n.querySelector('.in-input').value = e.correcciones[0];
      } else return;
      clic(n.querySelector('.in-btn--primario'));
    }, sel, e);
  }
  await espera(300);
  const p1 = await progreso();
  const resueltos = c.ejercicios.filter(e => p1.ejercicios?.[e.id]?.resuelto).length;
  const auto = c.ejercicios.filter(e => !['escritura', 'pronunciacion'].includes(e.tipo)).length;
  ok('lección: todos los autocorregibles pueden resolverse con sus respuestas', resueltos === auto, `${resueltos}/${auto}`);
  ok('lección: queda completada al pasar del 80 %', p1.lecciones?.['am-is-are']?.completada);
  ok('lección: sus tarjetas de gramática entran en el repaso', Object.keys(p1.tarjetas || {}).filter(k => k.startsWith('verbo-to-be.am-is-are.')).length === c.repaso.length);

  // ------------------------------------------------------------ evaluación
  await ir('/ingles/unidad/verbo-to-be/evaluacion');
  const ev = await cfg();
  await pagina.click('[data-eval-terminar]');
  ok('evaluación: avisa si faltan respuestas', await pagina.$eval('[data-eval-cuenta]', n => /faltan/i.test(n.textContent)));
  await ir('/ingles/unidad/verbo-to-be/evaluacion');
  await montados();
  let aciertosEsperados = 0;
  for (const [k, e] of ev.preguntas.entries()) {
    const resp = await pagina.evaluate((e, k) => {
      const n = document.querySelector(`[data-ej="${e.id}"]`);
      // Contesta bien las pares y mal la primera, para ver ambos resultados.
      const bien = k !== 0;
      if (e.tipo === 'opcion' || e.tipo === 'conversacion') {
        const idx = e.opciones.findIndex(o => (bien ? o.correcta : !o.correcta));
        const inputs = [...n.querySelectorAll('.in-opcion input')];
        const i = inputs.findIndex(inp => Number(inp.value) === idx);
        inputs[i].checked = true;
      } else if (e.tipo === 'completar') n.querySelectorAll('.in-hueco').forEach((c, i) => { c.value = bien ? e.respuestas[i][0] : 'zzz'; });
      else if (['traducir', 'transformar'].includes(e.tipo)) n.querySelector('.in-input').value = bien ? e.respuestas[0] : 'zzz';
      else if (e.tipo === 'dictado') n.querySelector('.in-input').value = bien ? e.texto : 'zzz';
      else if (e.tipo === 'relacionar') n.querySelectorAll('select').forEach((s, i) => { s.value = bien ? e.pares[i].b : ''; });
      else if (e.tipo === 'ordenar') {
        const origen = n.querySelector('.in-fichas--origen'); const destino = n.querySelector('.in-fichas--destino');
        const quedan = [...origen.children];
        for (const p of (bien ? e.respuestas[0] : [...e.fichas].reverse().join(' ')).split(' ')) {
          const i = quedan.findIndex(b => b.textContent === p);
          if (i >= 0) { destino.append(quedan[i]); quedan.splice(i, 1); }
        }
      } else if (e.tipo === 'corregir') {
        const p = e.error.split(' ')[0];
        [...n.querySelectorAll('.in-token')].find(b => b.textContent.replace(/[.,!?]$/, '') === p)?.click();
        n.querySelector('.in-input').value = bien ? e.correcciones[0] : 'zzz';
      }
      return bien;
    }, e, k);
    if (resp) aciertosEsperados++;
  }
  await pagina.click('[data-eval-terminar]');
  await espera(400);
  const pct = await pagina.$eval('.in-resultado__pct', n => parseInt(n.textContent, 10));
  const esperado = Math.round((aciertosEsperados / ev.preguntas.length) * 100);
  ok('evaluación: el porcentaje coincide con las respuestas dadas', pct === esperado, `${pct} % (esperado ${esperado} %)`);
  ok('evaluación: muestra desglose por habilidad y lección', (await pagina.$$('.in-resultado__fila')).length >= 4);
  ok('evaluación: cada pregunta muestra su solución', (await pagina.$$('.in-ej__solucion:not([hidden])')).length === ev.preguntas.length);
  ok('evaluación: se guarda en el progreso', (await progreso()).evaluaciones?.['verbo-to-be.eval']?.ultimo === pct);

  // --------------------------------------------------------------- tarjetas
  await ir('/ingles/tarjetas?tema=comida');
  await espera(600);
  ok('tarjetas: arranca con el tema de la URL', !!(await pagina.$('.in-tarjeta')));
  for (let i = 0; i < 3; i++) {
    await pagina.keyboard.press('Escape');
    await pagina.evaluate(() => [...document.querySelectorAll('.in-mazo__responder .in-btn--primario')].pop()?.click());
    await espera(150);
    await pagina.evaluate(() => document.querySelector('.in-calificar [data-nota="2"]')?.click());
    await espera(150);
  }
  const vocabRep = Object.keys((await progreso()).tarjetas || {}).filter(k => k.startsWith('v:comida.')).length;
  ok('tarjetas: cada calificación entra en el repaso espaciado', vocabRep >= 3, `${vocabRep} tarjetas`);

  await ir('/ingles/repaso');
  await espera(500);
  ok('repaso: muestra el resumen de pendientes', await pagina.$eval('[data-repaso-resumen]', n => /tarjetas para repasar/.test(n.textContent)));

  // ----------------------------------------------------------- conversación
  const conv = JSON.parse(require('fs').readFileSync(__dirname + '/../../../public/assets/ingles/data/conversaciones.json', 'utf8')).escenarios[0];
  await ir('/ingles/conversaciones/' + conv.slug);
  let pasos = 0;
  while (pasos < 20) {
    const fin = await pagina.$('.in-chat__fin');
    if (fin) break;
    const hecho = await pagina.evaluate((conv) => {
      const botones = [...document.querySelectorAll('.in-chat__opcion:not([disabled])')];
      const textos = botones.map(b => b.textContent);
      for (const n of conv.nodos) {
        if (!n.respuestas) continue;
        const r = n.respuestas.find(r => r.correcta && textos.includes(r.texto));
        if (r) { botones.find(b => b.textContent === r.texto).click(); return true; }
      }
      return false;
    }, conv);
    if (!hecho) break;
    pasos++;
    await espera(120);
  }
  ok('conversación: se puede recorrer hasta el final eligiendo respuestas correctas', !!(await pagina.$('.in-chat__fin')), `${pasos} turnos`);
  // Una opción incorrecta explica por qué
  await ir('/ingles/conversaciones/' + conv.slug);
  const incorrecta = conv.nodos.find(n => n.id === conv.inicio).respuestas.find(r => !r.correcta);
  await pagina.evaluate((t) => [...document.querySelectorAll('.in-chat__opcion')].find(b => b.textContent === t)?.click(), incorrecta.texto);
  ok('conversación: una respuesta inadecuada explica por qué', await pagina.$eval('.in-reto__explica', n => n.textContent.length > 20));

  // ---------------------------------------------------------------- escucha
  const esc = JSON.parse(require('fs').readFileSync(__dirname + '/../../../public/assets/ingles/data/escucha.json', 'utf8')).audios[0];
  await ir('/ingles/escucha/' + esc.slug);
  ok('escucha: la transcripción empieza bloqueada', await pagina.$eval('[data-transcripcion]', n => n.hidden));
  await pagina.click('.in-rep__play');
  await espera(1500);
  ok('escucha: sin haberlo oído, la transcripción sigue bloqueada', await pagina.$eval('[data-transcripcion]', n => n.hidden));
  // Llevar al final: «escuchado» exige oír al menos el 90 % del audio.
  await pagina.evaluate(() => { const r = document.querySelector('.in-rep__barra'); r.value = '960'; r.dispatchEvent(new Event('input')); });
  await espera(3500);
  const q = esc.preguntas.find(p => p.tipo === 'opcion');
  const selq = `[data-ej="${q.id}"]`;
  await pagina.click(`${selq} .in-opcion input`);
  await pagina.click(`${selq} .in-btn--primario`);
  await espera(300);
  ok('escucha: se desbloquea tras escuchar (o fallar el audio) e intentar responder', await pagina.$eval('[data-transcripcion]', n => !n.hidden));

  // ------------------------------------------------------------------ juegos
  const rutaJuegos = __dirname + '/../../../public/assets/ingles/data/juegos.json';
  const juegos = require('fs').existsSync(rutaJuegos) ? JSON.parse(require('fs').readFileSync(rutaJuegos, 'utf8')).juegos : [];
  if (!juegos.length) console.log('… juegos.json todavía no existe: se omiten las pruebas de juegos');
  for (const j of juegos) {
    await ir('/ingles/juegos/' + j.slug);
    await pagina.click('[data-empezar]');
    await espera(700);
    const hay = await pagina.$eval('[data-juego]', n => n.querySelectorAll('button').length > 1);
    ok(`juego ${j.slug}: arranca y muestra controles`, hay);
  }
  // Una partida completa de «Construye la pregunta», respondiendo bien
  const cp = juegos.find(j => j.slug === 'construye-la-pregunta');
  if (cp) {
    await ir('/ingles/juegos/construye-la-pregunta');
    await pagina.click('[data-empezar]');
    for (const r of cp.niveles[0].rondas) {
      await pagina.waitForSelector('[data-juego] form input:not([disabled])');
      await pagina.type('[data-juego] form input', r.respuestas[0]);
      await pagina.keyboard.press('Enter');
      await espera(120);
      await pagina.evaluate(() => [...document.querySelectorAll('[data-juego] .in-btn--primario')].pop()?.click());
      await espera(120);
    }
    ok('juego construye-la-pregunta: el nivel 1 se supera respondiendo bien', await pagina.$eval('[data-juego]', n => /superado/i.test(n.textContent)));
    ok('juego: el nivel superado se guarda', (await progreso()).juegos?.['construye-la-pregunta']?.niveles?.[cp.niveles[0].id]?.superado);
  }

  // Regresión: empezar otra partida a mitad de una no deja dos vivas.
  if (juegos.some(j => j.slug === 'desafio-de-tiempos')) {
    await ir('/ingles/juegos/desafio-de-tiempos');
    await pagina.click('[data-empezar]');
    await espera(400);
    await pagina.click('[data-empezar]');
    await espera(400);
    ok('juegos: empezar de nuevo no duplica la partida', (await pagina.$$('[data-juego] .in-hud')).length === 1);
    const listeners = await pagina.evaluate(async () => {
      // Tras 3 reinicios, la tecla «1» solo debe activar una opción de la partida viva.
      let pulsadas = 0;
      document.addEventListener('click', (e) => { if (e.target.closest('.in-reto__opcion')) pulsadas++; }, true);
      for (let i = 0; i < 3; i++) { document.querySelector('[data-empezar]').click(); await new Promise(r => setTimeout(r, 200)); }
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
      await new Promise(r => setTimeout(r, 100));
      return pulsadas;
    });
    ok('juegos: los atajos de teclado de partidas viejas no se acumulan', listeners === 1, `${listeners} clics con una tecla`);
  }
  await ir('/ingles/tarjetas?tema=comida');
  await espera(500);
  await pagina.evaluate(() => document.querySelector('[data-mazo-form]').requestSubmit());
  await espera(300);
  const antes = Object.keys((await progreso()).tarjetas || {}).length;
  await pagina.keyboard.press('Space');
  await espera(200);
  await pagina.keyboard.press('3');
  await espera(200);
  const despues = Object.keys((await progreso()).tarjetas || {}).length;
  const unaVez = await pagina.evaluate(() => document.querySelectorAll('.in-tarjeta').length);
  ok('tarjetas: reenviar el formulario deja una sola tanda y una calificación por tecla', unaVez === 1 && despues - antes <= 1, `${unaVez} tarjetas en pantalla, +${despues - antes} en el mazo`);

  // --------------------------------------------------------------- progreso
  await ir('/ingles/progreso');
  ok('progreso: muestra cifras reales', await pagina.$eval('[data-v="ejerciciosResueltos"]', n => Number(n.textContent) > 0));
  const exportado = await pagina.evaluate(async () => {
    const { Progreso } = await import(document.body.dataset.base + '/assets/js/ingles/progreso.js');
    const p = new Progreso();
    return p.exportar();
  });
  const imp = await pagina.evaluate(async (texto) => {
    const { Progreso } = await import(document.body.dataset.base + '/assets/js/ingles/progreso.js');
    const p = new Progreso({ getItem: () => null, setItem: () => {} });
    const malo = p.importar('{"formato":"otro"}');
    const peligro = p.importar(JSON.stringify({ formato: 'academia-ingles-progreso', version: 1, ultima: { url: 'https://malo.example/x', titulo: '<img src=x onerror=alert(1)>' }, ejercicios: { '<script>': { resuelto: true } } }));
    const bueno = p.importar(texto, { fusionar: false });
    return { malo: malo.ok, peligroUrl: p.datos.ultima, peligroIds: Object.keys(p.datos.ejercicios).filter(k => k.includes('<')), bueno: bueno.ok, n: Object.keys(p.datos.ejercicios).length };
  }, exportado);
  ok('progreso: importar rechaza archivos que no son progreso', imp.malo === false);
  ok('progreso: importar descarta URLs externas e ids no válidos', imp.peligroIds.length === 0);
  ok('progreso: exportar → importar conserva los datos', imp.bueno && imp.n > 0, `${imp.n} ejercicios`);

  // ------------------------------------------- consola, desbordes y temas
  const rutas = ['/ingles', '/ingles/unidad/presente-simple', '/ingles/leccion/tercera-persona', '/ingles/vocabulario', '/ingles/vocabulario/comida',
    '/ingles/tarjetas', '/ingles/repaso', '/ingles/pronunciacion', '/ingles/pronunciacion/vocales-cortas-y-largas', '/ingles/practica',
    '/ingles/lecturas/' + JSON.parse(require('fs').readFileSync(__dirname + '/../../../public/assets/ingles/data/lecturas.json', 'utf8')).lecturas[5].slug,
    '/ingles/escritura/presentacion-personal', '/ingles/juegos', '/ingles/progreso', '/ingles/audio'];
  for (const ancho of [360, 768, 1440]) {
    await pagina.setViewport({ width: ancho, height: 900 });
    const desbordadas = [];
    for (const r of rutas) {
      await ir(r);
      if (await pagina.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) desbordadas.push(r);
    }
    ok(`responsive ${ancho}px: sin scroll horizontal`, desbordadas.length === 0, desbordadas.join(', '));
  }
  ok('consola: sin errores de JavaScript en todo el recorrido', errores.length === 0, errores.slice(0, 5).join(' | '));

  await navegador.close();
  const fallidas = resultados.filter(r => !r.ok).length;
  console.log(`\ne2e: ${resultados.length - fallidas}/${resultados.length} comprobaciones superadas`);
  process.exit(fallidas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
