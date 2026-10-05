// Pruebas de navegador de la Academia de Redes (Puppeteer + Chromium).
//   node tools/redes/tests/e2e.cjs [http://127.0.0.1:8765] [carpeta-de-capturas]
const puppeteer = require(process.env.PUPPETEER || require('os').homedir() + '/.local/lib/node_modules/puppeteer');
const BASE = process.argv[2] || 'http://127.0.0.1:8765';
const CAPTURAS = process.argv[3] || null;
let ok = 0, mal = 0;
const comprobar = (cond, msg) => { if (cond) ok++; else { mal++; console.error('FALLO:', msg); } };

(async () => {
  const navegador = await puppeteer.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const pag = await navegador.newPage();
  const errores = [];
  pag.on('pageerror', (e) => errores.push(e.message));
  pag.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  pag.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('favicon')) errores.push(r.status() + ' ' + r.url()); });
  const ir = async (ruta, ancho = 1280) => { await pag.setViewport({ width: ancho, height: 900 }); await pag.goto(BASE + ruta, { waitUntil: 'networkidle0' }); };
  const foto = async (nombre) => { if (CAPTURAS) await pag.screenshot({ path: `${CAPTURAS}/${nombre}.png`, fullPage: false }); };
  const sinDesborde = async (donde) => comprobar(await pag.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'desborde horizontal en ' + donde);

  // Responde un ejercicio con las respuestas correctas, calculadas por el motor dentro de la página.
  const responder = (selector, acertar = true) => pag.evaluate(async (sel, bien) => {
    const { resolver, respuestaDe } = await import('/assets/js/redes/motor.js');
    const cfg = JSON.parse(document.querySelector('[data-redes-config]').textContent);
    const nodo = document.querySelector(sel);
    const spec = nodo.__spec || cfg.ejercicios?.[Number(nodo.dataset.ej)];
    if (!spec) return 'sin spec';
    const ej = resolver(spec);
    const cajas = [...nodo.querySelectorAll('[data-campo]')];
    ej.campos.forEach((c, i) => {
      if (c.tipo === 'opcion') { const r = cajas[i].querySelectorAll('input[type=radio]'); r[bien ? c.valor : (c.valor + 1) % r.length].checked = true; }
      else cajas[i].querySelector('input').value = bien ? respuestaDe(c) : '1';
    });
    nodo.querySelector('button[type=submit]')?.click();
    return nodo.dataset.estado + '|' + nodo.querySelector('[data-resultado]').textContent;
  }, selector, acertar);

  // --- Portada
  await ir('/redes');
  comprobar((await pag.$$('.rd-regla button.rd-bit')).length === 64, 'la regla de la portada tiene 64 bits pulsables');
  const antes = await pag.$eval('.rd-regla__datos', (e) => e.textContent);
  comprobar(antes.includes('192.168.10.64/26') && antes.includes('192.168.10.127'), 'regla: datos iniciales');
  await pag.click('.rd-regla [data-mas]');
  comprobar((await pag.$eval('.rd-regla__datos', (e) => e.textContent)).includes('192.168.10.64/27'), 'regla: + mueve el prefijo a /27');
  await pag.click('.rd-regla button[data-fila="0"][data-bit="31"]');
  comprobar(await pag.$eval('.rd-regla [data-ip-campo]', (e) => e.value) === '192.168.10.76', 'regla: pulsar un bit lo invierte');
  await pag.click('.rd-regla button[data-fila="1"][data-bit="23"]');
  comprobar((await pag.$eval('.rd-regla [data-p-texto]', (e) => e.textContent)) === '/23', 'regla: pulsar un 1 de la máscara recorta el prefijo');
  await pag.$eval('.rd-regla [data-ip-campo]', (e) => { e.value = '300.1.1.1'; e.dispatchEvent(new Event('input')); });
  comprobar(!(await pag.$eval('.rd-regla [data-error]', (e) => e.hidden)), 'regla: avisa de IP inválida');
  await ir('/redes'); await foto('01-portada'); await sinDesborde('portada');
  await ir('/redes', 375); await foto('02-portada-movil'); await sinDesborde('portada móvil');

  // --- Módulos
  const lecciones = [];
  for (const [mod, total] of [['subneteo', 13], ['vlans', 7]]) {
    await ir('/redes/' + mod);
    comprobar((await pag.$$('.rd-leccion')).length === total, `${mod} lista ${total} lecciones`);
    lecciones.push(...await pag.$$eval('.rd-leccion a', (as) => as.map((a) => new URL(a.href).pathname)));
    await sinDesborde('módulo ' + mod);
  }
  await ir('/redes/subneteo'); await foto('03-modulo');
  await ir('/redes/vlans'); await foto('03b-modulo-vlans');

  // --- Lecciones: todas cargan y montan sus ejercicios
  for (const ruta of lecciones) {
    await ir(ruta);
    const r = await pag.evaluate(() => ({ ej: document.querySelectorAll('article[data-ej]').length, montados: document.querySelectorAll('article[data-ej] form').length, ejemplos: document.querySelectorAll('.rd-ejemplo').length }));
    comprobar(r.ej > 0 && r.ej === r.montados && r.ejemplos >= 3, `${ruta}: ${r.montados}/${r.ej} ejercicios montados, ${r.ejemplos} ejemplos`);
    await sinDesborde(ruta);
  }
  await ir('/redes/subneteo/leccion/el-numero-magico'); await foto('04-leccion');
  await pag.evaluate(() => document.querySelector('.rd-ejemplo').scrollIntoView()); await foto('05-ejemplo');
  // Fallar, pedir pista, acertar
  const mala = await responder('article[data-ej="0"]', false);
  comprobar(mala.startsWith('pendiente') && /0 de 6/.test(mala), 'respuesta incorrecta: ' + mala);
  await pag.click('article[data-ej="0"] [data-pista]');
  comprobar((await pag.$$('article[data-ej="0"] [data-pistas] li')).length === 1, 'la pista aparece');
  const buena = await responder('article[data-ej="0"]', true);
  comprobar(buena.startsWith('hecho'), 'respuesta correcta: ' + buena);
  comprobar(await pag.$eval('[data-avance-leccion] b', (e) => e.textContent) === '1', 'el contador de la lección sube a 1');
  comprobar(!!(await pag.$('article[data-ej="0"] .rd-pasos')), 'tras acertar se muestra el procedimiento');
  await pag.evaluate(() => document.querySelector('article[data-ej="0"]').scrollIntoView()); await foto('06-ejercicio-resuelto');
  await pag.click('article[data-ej="1"] [data-revelar]');
  comprobar(await pag.$eval('article[data-ej="1"]', (e) => e.dataset.estado) === 'revelado', 'ver solución marca el ejercicio como revelado');
  await pag.reload({ waitUntil: 'networkidle0' });
  comprobar(await pag.$eval('article[data-ej="0"]', (e) => e.dataset.estado) === 'hecho', 'el progreso se conserva al recargar');
  comprobar(await pag.$eval('article[data-ej="1"]', (e) => e.dataset.estado) === 'pendiente', 'un ejercicio revelado no cuenta como resuelto');
  await ir('/redes/subneteo/leccion/el-numero-magico', 375); await sinDesborde('lección móvil');
  await pag.evaluate(() => document.querySelector('.rd-ejemplo').scrollIntoView()); await foto('07-leccion-movil');
  await ir('/redes/subneteo/leccion/vlsm', 375); await sinDesborde('VLSM móvil');
  await ir('/redes/subneteo');
  comprobar((await pag.$eval('[data-leccion="el-numero-magico"] [data-avance]', (e) => e.textContent)).includes('1 de'), 'el índice muestra el avance de la lección');

  // --- Práctica: los 6 niveles generan, se corrigen y cambian
  for (const mod of ['subneteo', 'vlans']) for (let n = 1; n <= 6; n++) {
    await ir(`/redes/${mod}/practica?nivel=${n}&s=${1234 + n}`);
    const e1 = await pag.$eval('[data-zona] .rd-ej__enunciado', (e) => e.textContent);
    await pag.reload({ waitUntil: 'networkidle0' });
    comprobar(e1 === await pag.$eval('[data-zona] .rd-ej__enunciado', (e) => e.textContent), `${mod} nivel ${n}: la misma semilla da el mismo ejercicio`);
    for (let i = 0; i < 6; i++) {
      const r = await pag.evaluate(async (modulo) => {
        const { resolver, respuestaDe, generar, azar } = await import('/assets/js/redes/motor.js');
        const u = new URL(location.href);
        const ej = resolver(generar(modulo, Number(u.searchParams.get('nivel')), azar(Number(u.searchParams.get('s')))));
        const nodo = document.querySelector('[data-zona] article');
        const cajas = [...nodo.querySelectorAll('[data-campo]')];
        if (cajas.length !== ej.campos.length) return 'campos distintos';
        ej.campos.forEach((c, k) => { if (c.tipo === 'opcion') cajas[k].querySelectorAll('input')[c.valor].checked = true; else cajas[k].querySelector('input').value = respuestaDe(c); });
        nodo.querySelector('button[type=submit]').click();
        return nodo.dataset.estado;
      }, mod);
      comprobar(r === 'hecho', `${mod} nivel ${n}, ejercicio ${i + 1}: ${r}`);
      await pag.click('[data-siguiente]');
    }
    comprobar(await pag.$eval('[data-m="ok"]', (e) => e.textContent) === '6', `${mod} nivel ${n}: el marcador cuenta 6`);
    await sinDesborde(`práctica ${mod} nivel ${n}`);
  }
  await ir('/redes/subneteo/practica?nivel=5&s=77'); await foto('08-practica');
  await ir('/redes/subneteo/practica?nivel=6&s=99', 375); await sinDesborde('práctica móvil'); await foto('09-practica-movil');

  // --- VLAN: comandos abreviados y lección con bloques de consola
  await ir('/redes/vlans/leccion/crear-vlan-y-puertos-de-acceso');
  comprobar((await pag.$$('.rd-codigo pre')).length >= 4, 'la lección de VLAN muestra bloques de configuración');
  await pag.type('article[data-ej="4"] input', 'sw mo acc');
  await pag.click('article[data-ej="4"] button[type=submit]');
  comprobar(await pag.$eval('article[data-ej="4"]', (e) => e.dataset.estado) === 'hecho', 'acepta el comando abreviado «sw mo acc»');
  await pag.type('article[data-ej="5"] input', 'switchport access vlan 11');
  await pag.click('article[data-ej="5"] button[type=submit]');
  comprobar(await pag.$eval('article[data-ej="5"]', (e) => e.dataset.estado) === 'pendiente', 'rechaza un comando con la VLAN equivocada');
  await pag.evaluate(() => document.querySelector('.rd-codigo').scrollIntoView()); await foto('12-vlan-leccion');
  await ir('/redes/vlans/leccion/crear-vlan-y-puertos-de-acceso', 375); await sinDesborde('lección VLAN móvil');
  await ir('/redes/vlans/practica?nivel=6&s=5'); await foto('13-vlan-practica');
  await ir('/redes/vlans/examen'); await pag.click('[data-examen="completo"]');
  comprobar((await pag.$$('[data-preguntas] article')).length === 12, 'el examen completo de VLAN tiene 12 preguntas');

  // --- Examen
  await ir('/redes/subneteo/examen');
  await pag.click('[data-examen="basico"]');
  comprobar((await pag.$$('[data-preguntas] article')).length === 10, 'el examen básico tiene 10 preguntas');
  comprobar((await pag.$$('[data-preguntas] [data-pista], [data-preguntas] [data-revelar]')).length === 0, 'el examen no ofrece pistas ni solución');
  await pag.click('[data-entregar]');
  comprobar((await pag.$eval('[data-nota-final]', (e) => e.textContent)).includes('0 / 100'), 'examen en blanco: nota 0');
  comprobar((await pag.$$('[data-preguntas] .rd-pasos')).length === 10, 'tras entregar se ve el procedimiento de las 10');
  await foto('10-examen'); await sinDesborde('examen');

  // --- Herramientas
  await ir('/redes/subneteo/herramientas');
  comprobar((await pag.$$('[data-divisor-salida] tbody tr')).length === 8, 'divisor: /24 en /27 da 8 subredes');
  comprobar((await pag.$eval('[data-vlsm-salida]', (e) => e.textContent)).includes('192.168.50.0/26'), 'VLSM: primera subred /26');
  await pag.$eval('[data-vlsm] textarea', (e) => { e.value = '<img src=x onerror=alert(1)>: 500'; });
  await pag.click('[data-vlsm] button');
  comprobar((await pag.$$('[data-vlsm-salida] img')).length === 0, 'VLSM: el nombre escrito por el usuario no se interpreta como HTML');
  await ir('/redes/subneteo/herramientas'); await foto('11-herramientas'); await sinDesborde('herramientas');
  await ir('/redes/subneteo/herramientas', 375); await sinDesborde('herramientas móvil');

  // --- 404 y resto del sitio
  for (const [ruta, codigo] of [['/redes/vlans/herramientas', 404], ['/redes/subneteo/leccion/no-existe', 404], ['/', 200], ['/ingles', 200], ['/academia', 200], ['/tutoriales/nmap', 200]]) {
    const r = await pag.goto(BASE + ruta, { waitUntil: 'domcontentloaded' });
    comprobar(r.status() === codigo, `${ruta} responde ${r.status()} (esperado ${codigo})`);
  }
  const reales = errores.filter((e) => !/404|Failed to load resource/.test(e));
  comprobar(reales.length === 0, 'errores de consola: ' + reales.slice(0, 5).join(' | '));

  await navegador.close();
  console.log(`${ok}/${ok + mal} comprobaciones de navegador correctas`);
  process.exit(mal ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
