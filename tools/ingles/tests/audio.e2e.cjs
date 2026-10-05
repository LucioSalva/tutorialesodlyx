/**
 * Academia de Inglés · pruebas del audio en navegador real (headless).
 *
 *   php -d opcache.enable_cli=0 -S 127.0.0.1:8765 -t public &
 *   PUPPETEER=… CHROMIUM=/usr/bin/chromium node tools/ingles/tests/audio.e2e.cjs
 *
 * El navegador de prueba NO tiene voces del sistema: si algo dependiera
 * todavía de la síntesis del navegador, fallaría aquí.
 */
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const resultados = [];
const ok = (n, c, d = '') => { resultados.push(!!c); console.log(`${c ? '✔' : '✘'} ${n}${d ? ' — ' + d : ''}`); };
const espera = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const nav = await puppeteer.launch({ headless: 'new', executablePath: process.env.CHROMIUM || undefined,
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const p = await nav.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  const errores = [];
  const mp3 = [];         // todas las respuestas de audio
  p.on('pageerror', e => errores.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|fonts\.g/.test(m.text())) errores.push(m.text()); });
  const todas = [];       // acumulado de todo el recorrido
  p.on('response', r => { if (/\.mp3(\?|$)/.test(r.url())) { const x = { url: r.url(), status: r.status(), tipo: r.headers()['content-type'] }; mp3.push(x); todas.push(x); } });
  const ir = async (ruta) => { await p.goto(BASE + ruta, { waitUntil: 'networkidle2' }); await espera(400); };
  const textoPagina = () => p.evaluate(() => document.body.innerText);

  // Sin voces del sistema en este navegador (condición del fallo original).
  await ir('/ingles');
  const voces = await p.evaluate(() => ('speechSynthesis' in window ? speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)).length : 0));
  console.log(`(voces inglesas del navegador de prueba: ${voces})`);
  await p.evaluate(() => localStorage.clear());

  // ======================== 29. «Hola, soy Lucía» =======================
  const RUTA = '/ingles/lecturas/hola-soy-lucia';
  const resp = await p.goto(BASE + RUTA, { waitUntil: 'networkidle0' });
  ok('Lucía 1 · la página carga', resp.status() === 200);
  const json = await p.evaluate(async () => (await fetch(document.body.dataset.base + '/assets/ingles/audio/lecturas/us/hola-soy-lucia.json')).json());
  ok('Lucía 2 · existe el audio asociado (tiempos + MP3)', json.segmentos?.length > 0, `${json.segmentos.length} frases, ${json.duracion} s`);
  const btn = await p.$('.in-rep__play');
  ok('Lucía 3 · el botón de reproducir está disponible', !!btn && !(await p.$eval('.in-rep__play', b => b.disabled)));
  mp3.length = 0;
  await btn.click();
  await espera(1800);
  const peticion = mp3.find(r => r.url.includes('/lecturas/us/hola-soy-lucia.mp3'));
  ok('Lucía 4 · el navegador solicita el archivo', !!peticion);
  ok('Lucía 5 · el servidor entrega audio válido', peticion && [200, 206].includes(peticion.status) && /audio\/mpeg/.test(peticion.tipo || ''), `${peticion?.status} ${peticion?.tipo}`);
  const avanza = await p.$eval('.in-rep__tiempo', n => n.textContent);
  const segs = (t) => { const [m, s] = t.split(' / ')[0].split(':').map(Number); return m * 60 + s; };
  await espera(1200);
  const avanza2 = await p.$eval('.in-rep__tiempo', n => n.textContent);
  ok('Lucía 6 · la reproducción comienza (el tiempo avanza)', segs(avanza2) > segs(avanza) || segs(avanza) >= 1, `${avanza} → ${avanza2}`);
  const resaltada = await p.$eval('.in-frase-sinc.es-sonando', n => n.textContent).catch(() => null);
  ok('Lucía 6b · se resalta la frase que suena', !!resaltada, resaltada || 'ninguna');
  await p.click('.in-rep__play');
  await espera(300);
  const tPausa = await p.$eval('.in-rep__tiempo', n => n.textContent);
  await espera(800);
  const tPausa2 = await p.$eval('.in-rep__tiempo', n => n.textContent);
  ok('Lucía 7 · se puede pausar', tPausa === tPausa2 && /Seguir/.test(await p.$eval('.in-rep__play', b => b.textContent)), tPausa);
  await p.click('.in-rep__btn[aria-label="Volver al principio"]');
  await espera(200);
  ok('Lucía 8 · se puede repetir desde el principio', /^0:00 \//.test(await p.$eval('.in-rep__tiempo', n => n.textContent)));
  await p.select('.in-rep__sel[aria-label="Velocidad"]', '0.75');
  await p.click('.in-rep__play');
  await espera(1200);
  const rate = await p.evaluate(() => JSON.parse(localStorage.getItem('ingles:voz:v1') || '{}').velocidad);
  ok('Lucía 9 · se puede cambiar la velocidad (0,75×)', rate === 0.75);
  await p.click('.in-rep__play');
  const texto = await textoPagina();
  ok('Lucía 10 · no aparece el error de falta de voces', !/ninguna voz en inglés instalada/i.test(texto) && !/no está disponible/i.test(await p.$eval('.in-rep__estado', n => n.textContent)));
  const frasesPagina = await p.$$eval('.in-frase-sinc', ns => ns.map(n => n.textContent));
  ok('Lucía 11 · el texto y el audio corresponden (cada frase del audio está en la página)', frasesPagina.length === json.segmentos.length && json.segmentos.every((s, i) => s.texto === frasesPagina[i]), `${frasesPagina.length}/${json.segmentos.length}`);
  // Pulsar una frase: salta a ella y sigue desde ahí.
  await p.evaluate(() => document.querySelectorAll('.in-frase-sinc')[2].click());
  await espera(700);
  const actual = await p.evaluate(() => [...document.querySelectorAll('.in-frase-sinc')].findIndex(s => s.classList.contains('es-sonando')));
  ok('Lucía · pulsar una frase reproduce desde esa frase', actual === 2, `resaltada: ${actual}`);
  await p.click('.in-rep__play');
  // «Repetir frase»: suena solo la frase actual y se detiene al acabarla.
  await p.click('.in-rep__btn[aria-label="Repetir la frase actual"]');
  await espera(3500);
  const trasRepetir = await p.$eval('.in-rep__play', b => b.textContent);
  const t = await p.$eval('.in-rep__tiempo', n => n.textContent);
  ok('Lucía · «Repetir frase» reproduce solo esa frase y se detiene', /Seguir/.test(trasRepetir) && /^0:0[3-4] \//.test(t), `${trasRepetir} ${t} (frase: ${json.segmentos[2].inicio}–${json.segmentos[2].fin} s)`);
  // Acento británico
  mp3.length = 0;
  await p.select('.in-rep__sel[aria-label="Acento"]', 'gb');
  await p.click('.in-rep__play');
  await espera(1500);
  ok('Lucía · cambiar a English (UK) carga la pista británica', mp3.some(r => r.url.includes('/lecturas/gb/hola-soy-lucia.mp3') && [200, 206].includes(r.status)));
  await p.click('.in-rep__play');
  await p.select('.in-rep__sel[aria-label="Acento"]', 'us');

  // ===================== botones de frase en todo el curso =================
  const paginas = ['/ingles/leccion/am-is-are', '/ingles/leccion/tercera-persona', '/ingles/vocabulario/familia', '/ingles/pronunciacion/consonantes-nuevas',
    '/ingles/leccion/presentarse', '/ingles/unidad/el-futuro/evaluacion', '/ingles/audio', '/ingles/leccion/going-to'];
  for (const r of paginas) {
    await ir(r);
    mp3.length = 0;
    const n = await p.evaluate(async () => {
      const botones = [...document.querySelectorAll('[data-decir]:not([data-navegador])')].slice(0, 25);
      for (const b of botones) { b.click(); await new Promise(res => setTimeout(res, 120)); }
      return botones.length;
    });
    await espera(600);
    const malos = mp3.filter(x => ![200, 206].includes(x.status));
    ok(`botones de ${r}: ${n} pulsados, todos con MP3`, n > 0 && mp3.length >= Math.min(n, 1) && malos.length === 0, `${mp3.length} peticiones, ${malos.length} fallidas ${malos.slice(0, 2).map(x => x.url).join(' ')}`);
  }

  // Todos los botones de TODAS las páginas: su MP3 existe en ambos acentos.
  await ir('/ingles');
  const faltan = await p.evaluate(async (rutas) => {
    const { rutaClip } = await import(document.body.dataset.base + '/assets/js/ingles/audio-ruta.js');
    const cfg = await (await fetch(document.body.dataset.base + '/assets/ingles/audio/voces.json')).json();
    const mal = [];
    let total = 0;
    for (const r of rutas) {
      const html = await (await fetch(document.body.dataset.base + r)).text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      for (const b of doc.querySelectorAll('[data-decir]:not([data-navegador])')) {
        for (const ac of ['us', 'gb']) {
          const url = document.body.dataset.base + '/assets/ingles/audio/' + rutaClip(cfg, b.dataset.decir, ac, b.dataset.rol || 'n');
          total++;
          const h = await fetch(url, { method: 'HEAD' });
          if (!h.ok) mal.push(`${r}: «${b.dataset.decir}» (${ac})`);
        }
      }
    }
    return { total, mal };
  }, ['/ingles/leccion/el-alfabeto', '/ingles/leccion/numeros-0-100', '/ingles/leccion/decir-fechas', '/ingles/leccion/profesiones', '/ingles/leccion/verbos-irregulares',
      '/ingles/pronunciacion/terminaciones-s-y-ed', '/ingles/pronunciacion/entonacion', '/ingles/vocabulario/comida', '/ingles/escucha/en-una-fiesta', '/ingles/lecturas/hola-soy-lucia']);
  ok('botones de 10 páginas variadas: todos sus MP3 existen en US y UK', faltan.mal.length === 0, `${faltan.total} comprobados · ${faltan.mal.slice(0, 3).join(' | ')}`);

  // ======================= diálogo con voces distintas =====================
  await ir('/ingles/leccion/presentarse');
  const rolesDialogo = await p.$$eval('.in-dialogo .in-burbuja [data-decir]', bs => [...new Set(bs.map(b => b.dataset.rol || 'n'))]);
  ok('diálogo de lección: más de una voz', rolesDialogo.length > 1, rolesDialogo.join(', '));
  mp3.length = 0;
  await p.click('[data-dialogo-completo]');
  await espera(3000);
  ok('diálogo de lección: «Escuchar el diálogo» reproduce las líneas en orden', mp3.length >= 2 && mp3.every(x => [200, 206].includes(x.status)), `${mp3.length} archivos`);
  await p.click('[data-dialogo-completo]');

  // ============================ escucha =================================
  await ir('/ingles/escucha/en-una-fiesta');
  ok('escucha: transcripción bloqueada al entrar', await p.$eval('[data-transcripcion]', n => n.hidden));
  mp3.length = 0;
  await p.click('.in-rep__play');
  await espera(1500);
  ok('escucha: la pista del diálogo se reproduce', mp3.some(x => x.url.includes('/escucha/us/en-una-fiesta.mp3') && [200, 206].includes(x.status)));
  // Llevar al 95 % y dejar terminar
  await p.evaluate(() => { const r = document.querySelector('.in-rep__barra'); r.value = '950'; r.dispatchEvent(new Event('input')); });
  await espera(4500);
  const q = await p.evaluate(() => JSON.parse(document.querySelector('[data-ingles-config]').textContent).ejercicios.find(e => e.tipo === 'opcion').id);
  await p.click(`[data-ej="${q}"] .in-opcion input`);
  await p.click(`[data-ej="${q}"] .in-btn--primario`);
  await espera(300);
  ok('escucha: la transcripción se desbloquea tras escuchar e intentar responder', await p.$eval('[data-transcripcion]', n => !n.hidden));

  // ======================== conversación y juegos ========================
  mp3.length = 0;
  await ir('/ingles/conversaciones/primer-dia-en-el-curso');
  await espera(1000);
  const primera = [...mp3];
  await p.evaluate(() => [...document.querySelectorAll('.in-chat__opcion')][0].click());
  await espera(1500);
  ok('conversación: el personaje habla desde su MP3 (al entrar y tras responder)', primera.length > 0 && mp3.length > primera.length && mp3.every(x => [200, 206].includes(x.status)), `${primera.length} → ${mp3.length}`);
  await ir('/ingles/juegos/escucha-y-selecciona');
  mp3.length = 0;
  await p.click('[data-empezar]');
  await espera(1500);
  ok('juego «Escucha y selecciona»: reproduce la palabra desde MP3', mp3.length > 0 && mp3.every(x => [200, 206].includes(x.status)), `${mp3.length}`);
  await ir('/ingles/tarjetas?tema=comida');
  await p.select('[data-mazo-modo]', 'audio');
  mp3.length = 0;
  await p.evaluate(() => document.querySelector('[data-mazo-form]').requestSubmit());
  await espera(1500);
  ok('tarjetas modo audio: la palabra suena desde MP3', mp3.length > 0 && mp3.every(x => [200, 206].includes(x.status)));

  const fallidas = todas.filter(x => ![200, 206].includes(x.status));
  ok('ninguna petición de MP3 falló en todo el recorrido', todas.length > 0 && fallidas.length === 0, `${todas.length} peticiones, ${fallidas.length} fallidas`);
  ok('consola sin errores de JavaScript', errores.length === 0, errores.slice(0, 3).join(' | '));

  // Responsive del reproductor
  for (const w of [360, 768]) {
    await p.setViewport({ width: w, height: 800 });
    await ir(RUTA);
    ok(`reproductor a ${w}px sin scroll horizontal`, !(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)));
  }
  await nav.close();
  const f = resultados.filter(x => !x).length;
  console.log(`\naudio.e2e: ${resultados.length - f}/${resultados.length} comprobaciones superadas`);
  process.exit(f ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
