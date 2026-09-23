/**
 * Academia de Comandos · Arranque de las páginas
 * ---------------------------------------------------------------------
 * Cada vista del módulo trae su configuración en un <script type="application/json">
 * que escribe PHP. Aquí se lee, se monta lo que toque (terminal, misiones,
 * repaso, juego, panel) y se conecta con el progreso guardado.
 *
 * Nada de lo que escribe el estudiante sale del navegador ni se evalúa:
 * el simulador vive en esta misma pestaña y solo toca su propio VFS.
 */

import { Progreso, LOGROS } from './progreso.js';
import { Terminal, ArbolVisual, montarEscenario, reiniciarEscenario } from './terminal.js';
import { Mision, evaluar } from './misiones.js';
import { registroLinux } from './shell-linux.js';

const progreso = new Progreso();
const BASE = document.body.dataset.base || '';

function configuracion() {
  const nodo = document.querySelector('script[data-academia-config]');
  if (!nodo) return null;
  try { return JSON.parse(nodo.textContent); } catch { return null; }
}

async function registroDe(os) {
  if (os === 'linux') return registroLinux();
  if (os === 'cmd') return (await import('./shell-cmd.js')).registroCmd();
  return (await import('./shell-powershell.js')).registroPs();
}

function catalogoDe(fichas) {
  return new Set((fichas || []).map(f => String(f.nombre || '').toLowerCase().split(' ')[0]));
}

/* ------------------------------------------------------------------ utilidades */
function el(etiqueta, clase, texto) {
  const n = document.createElement(etiqueta);
  if (clase) n.className = clase;
  if (texto !== undefined) n.textContent = texto;
  return n;
}

function pintarProgresoGlobal() {
  const resumen = progreso.resumen();
  const nivel = resumen.nivel;
  document.querySelectorAll('[data-progreso]').forEach(nodo => {
    const clave = nodo.dataset.progreso;
    const valores = {
      xp: resumen.xp, nivel: nivel.nivel, comandos: resumen.comandosVistos,
      aprendidos: resumen.comandosAprendidos, misiones: resumen.misiones,
      niveles: resumen.nivelesJuego, logros: resumen.logros, repasos: resumen.repasos,
    };
    if (clave in valores) nodo.textContent = String(valores[clave]);
  });
  document.querySelectorAll('[data-barra-nivel]').forEach(barra => {
    barra.style.width = nivel.porcentaje + '%';
    barra.setAttribute('aria-valuenow', String(nivel.porcentaje));
  });
  document.querySelectorAll('[data-nivel-texto]').forEach(n => {
    n.textContent = `Nivel ${nivel.nivel} · ${nivel.xp} XP · faltan ${nivel.restante} para el siguiente`;
  });
  // Marcas de completado en tarjetas de misión, comando o nivel de juego.
  document.querySelectorAll('[data-mision-id]').forEach(tarjeta => {
    if (progreso.misionCompletada(tarjeta.dataset.misionId)) tarjeta.classList.add('es-completada');
  });
  document.querySelectorAll('[data-comando-id]').forEach(tarjeta => {
    const ficha = progreso.datos.comandos[tarjeta.dataset.comandoId];
    if (ficha?.aprendido) tarjeta.classList.add('es-aprendido');
    else if (progreso.datos.lecciones[tarjeta.dataset.comandoId]?.vista) tarjeta.classList.add('es-visto');
  });
}

function anunciar(texto, tono = 'info') {
  let region = document.querySelector('[data-anuncios]');
  if (!region) {
    region = el('div', 'ac-anuncios');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.dataset.anuncios = '';
    document.body.append(region);
  }
  const caja = el('div', 'ac-anuncio ac-anuncio--' + tono);
  caja.innerHTML = texto;
  region.append(caja);
  setTimeout(() => caja.classList.add('se-va'), 3600);
  setTimeout(() => caja.remove(), 4200);
}

function celebrarLogros(ids) {
  for (const id of ids) {
    if (progreso.otorgar(id)) {
      const logro = LOGROS.find(l => l.id === id);
      if (logro) anunciar(`${logro.icono} <b>Logro:</b> ${logro.nombre} — ${logro.descripcion}`, 'logro');
    }
  }
}

/* --------------------------------------------------- terminal + escenario */
async function montarTerminal(contenedor, { escenario, fichas, alEjecutar, bienvenida }) {
  const registro = await registroDe(escenario.os);
  const { vfs, shell } = montarEscenario(escenario, registro, catalogoDe(fichas));
  shell.fichas = Object.fromEntries((fichas || []).map(f => [String(f.nombre || '').split(' ')[0], f]));

  const zonaTerm = contenedor.querySelector('[data-terminal]') || contenedor;
  const zonaArbol = contenedor.querySelector('[data-arbol]');

  const terminal = new Terminal(zonaTerm, {
    shell,
    bienvenida: bienvenida || [
      { texto: escenario.nombre + ' — terminal simulada. Nada de lo que escribas sale de tu navegador.', clase: 'dim' },
      { texto: 'Escribe «help» para ver los comandos implementados y «ayuda» para las teclas.', clase: 'dim' },
    ],
    alEjecutar: (linea, resultado) => {
      if (arbol) arbol.pintar();
      celebrarLogros(['primer-comando']);
      if (alEjecutar) alEjecutar(linea, resultado, { vfs, shell, terminal });
    },
  });

  const arbol = zonaArbol ? new ArbolVisual(zonaArbol, vfs, { desde: escenario.inicio, titulo: 'Escenario' }) : null;

  contenedor.addEventListener('reiniciar-escenario', () => {
    reiniciarEscenario(shell);
    terminal.limpiar();
    terminal.escribir('Escenario reiniciado: todo vuelve a su estado inicial.', 'dim');
    terminal.pintarPrompt();
    if (arbol) arbol.pintar();
  });

  return { vfs, shell, terminal, arbol };
}

/* ------------------------------------------------------------ vista: comando */
async function vistaComando(cfg) {
  progreso.marcarLeccionVista(cfg.os + ':' + cfg.comando.slug);

  const zona = document.querySelector('[data-practica-comando]');
  if (!zona || !cfg.escenario) return;

  const { shell, terminal } = await montarTerminal(zona, {
    escenario: cfg.escenario,
    fichas: [cfg.comando],
    bienvenida: [{ texto: `Practica «${cfg.comando.nombre}» aquí mismo. El escenario es de mentira: no hay nada que romper.`, clase: 'dim' }],
    alEjecutar: (linea, resultado, ctx) => {
      const ejercicio = cfg.comando.ejercicio;
      if (!ejercicio || !ejercicio.validador) return;
      const ok = evaluar({
        vfs: ctx.vfs, shell: ctx.shell, salida: resultado.lineas,
        historial: ctx.shell.historial, ultimoComando: linea,
      }, ejercicio.validador);
      if (ok && !zona.dataset.resuelto) {
        zona.dataset.resuelto = '1';
        terminal.escribirHtml('✅ <b>Correcto.</b> ' + (ejercicio.explicacion || ''), 'ok');
        progreso.practicarComando(cfg.os + ':' + cfg.comando.slug, true, cfg.os);
        anunciar('Ejercicio resuelto: <b>+4 XP</b>', 'ok');
        pintarProgresoGlobal();
      }
    },
  });

  // Botones «probar este ejemplo» repartidos por la ficha.
  document.querySelectorAll('[data-probar]').forEach(boton => {
    boton.addEventListener('click', () => {
      zona.scrollIntoView({ behavior: 'smooth', block: 'center' });
      terminal.ejecutar(boton.dataset.probar);
      terminal.enfocar();
    });
  });

  // Autoevaluación de la pregunta de repaso.
  const form = document.querySelector('[data-repaso-comando]');
  if (form) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const entrada = form.querySelector('input');
      const respuesta = entrada.value.trim();
      const acepta = (cfg.comando.pregunta_repaso?.acepta || [cfg.comando.pregunta_repaso?.respuesta || '']).map(s => s.toLowerCase().replace(/\s+/g, ' ').trim());
      const ok = acepta.includes(respuesta.toLowerCase().replace(/\s+/g, ' ').trim());
      const salida = form.querySelector('[data-resultado]');
      salida.className = 'ac-respuesta ' + (ok ? 'es-ok' : 'es-mal');
      salida.innerHTML = ok
        ? '✅ Correcto. ' + (cfg.comando.pregunta_repaso?.porque || '')
        : '❌ Todavía no. ' + (cfg.comando.pregunta_repaso?.porque || '') + ' La respuesta esperada era <code>' + (cfg.comando.pregunta_repaso?.respuesta || '') + '</code>.';
      progreso.practicarComando(cfg.os + ':' + cfg.comando.slug, ok, cfg.os);
      pintarProgresoGlobal();
    });
  }
}

/* ----------------------------------------------------------- vista: práctica */
async function vistaPractica(cfg) {
  const zona = document.querySelector('[data-practica-libre]');
  if (!zona) return;

  const selector = document.querySelector('[data-selector-escenario]');
  let actual = cfg.escenarios[0];
  let montaje = await montarTerminal(zona, { escenario: actual, fichas: cfg.fichas });

  if (selector) {
    selector.addEventListener('change', async () => {
      const elegido = cfg.escenarios.find(e => e.id === selector.value);
      if (!elegido) return;
      actual = elegido;
      zona.querySelector('[data-terminal]').innerHTML = '';
      if (zona.querySelector('[data-arbol]')) zona.querySelector('[data-arbol]').innerHTML = '';
      montaje = await montarTerminal(zona, { escenario: actual, fichas: cfg.fichas });
      anunciar('Escenario cargado: <b>' + actual.nombre + '</b>');
    });
  }

  document.querySelectorAll('[data-insertar]').forEach(boton => {
    boton.addEventListener('click', () => {
      montaje.terminal.entrada.value = boton.dataset.insertar;
      montaje.terminal.enfocar();
    });
  });
}

/* ---------------------------------------------------------- vista: misiones */
async function vistaMisiones(cfg) {
  const lista = document.querySelector('[data-lista-misiones]');
  const panel = document.querySelector('[data-panel-mision]');
  if (!panel) return;

  let activa = null;

  async function abrir(datos) {
    const escenario = cfg.escenarios.find(e => e.id === datos.escenario) || cfg.escenarios[0];
    panel.innerHTML = '';
    panel.classList.add('esta-abierto');

    const cabecera = el('div', 'ac-mision__cabecera');
    cabecera.innerHTML = `
      <p class="ac-mision__nivel">${datos.nivel}</p>
      <h3>${datos.titulo}</h3>
      <p class="ac-mision__objetivo">${datos.objetivo}</p>
      <p class="ac-mision__contexto">${datos.contexto || ''}</p>`;
    const pasos = el('ol', 'ac-mision__pasos');
    for (const inst of datos.instrucciones || []) pasos.append(el('li', null, inst));

    const zonaTerm = el('div', 'ac-mision__terminal');
    zonaTerm.innerHTML = '<div data-terminal></div><div class="ac-mision__lateral"><div data-arbol></div><div class="ac-mision__avance" data-avance></div></div>';

    const acciones = el('div', 'ac-mision__acciones');
    const btnPista = el('button', 'ac-btn ac-btn--fino', 'Pista');
    const btnSolucion = el('button', 'ac-btn ac-btn--fino', 'Ver solución');
    const btnCerrar = el('button', 'ac-btn ac-btn--fino', 'Cerrar');
    acciones.append(btnPista, btnSolucion, btnCerrar);
    const ayuda = el('div', 'ac-mision__ayuda');

    panel.append(cabecera, pasos, zonaTerm, acciones, ayuda);

    const montaje = await montarTerminal(zonaTerm, {
      escenario, fichas: cfg.fichas,
      bienvenida: [{ texto: datos.titulo + ' — escribe tus comandos aquí.', clase: 'dim' }],
      alEjecutar: (linea, resultado, ctx) => comprobar(linea, resultado, ctx),
    });

    activa = new Mision(datos, { vfs: montaje.vfs, shell: montaje.shell });

    function pintarAvance(avance) {
      const caja = zonaTerm.querySelector('[data-avance]');
      caja.innerHTML = '<p class="ac-avance__titulo">Progreso</p>';
      for (const paso of avance || []) {
        const fila = el('p', 'ac-avance__paso' + (paso.hecho ? ' esta-hecho' : ''));
        fila.textContent = (paso.hecho ? '✔ ' : '○ ') + paso.texto;
        caja.append(fila);
      }
    }

    function comprobar(linea, resultado, ctx) {
      const veredicto = activa.comprobar(resultado.lineas, linea);
      pintarAvance(veredicto.avance);

      if (veredicto.estado === 'completada') {
        const xp = veredicto.xp;
        progreso.registrarMision(datos.id, { intentos: activa.intentos, pistas: activa.pistasVistas, xp, tiempo: Math.round((Date.now() - activa.inicio) / 1000) });
        montaje.terminal.escribirHtml(`🏆 <b>${veredicto.titulo}</b> ${veredicto.mensaje} <b>+${xp} XP</b>`, 'ok');
        anunciar(`Misión completada: <b>${datos.titulo}</b> · +${xp} XP`, 'ok');
        const logros = ['primera-mision'];
        if (activa.pistasVistas === 0 && !activa.solucionVista) logros.push('sin-pistas');
        if ((datos.etiquetas || []).includes('combinaciones')) logros.push('tuberia');
        if (progreso.resumen().misiones >= 5) logros.push('cinco-misiones');
        if (progreso.resumen().misiones >= 15) logros.push('quince-misiones');
        celebrarLogros(logros);
        pintarProgresoGlobal();
        const tarjeta = document.querySelector(`[data-mision-id="${datos.id}"]`);
        if (tarjeta) tarjeta.classList.add('es-completada');
      } else if (veredicto.estado === 'desvio') {
        montaje.terminal.escribirHtml('💡 ' + veredicto.mensaje, 'aviso');
      }
    }

    btnPista.addEventListener('click', () => {
      const pista = activa.siguientePista();
      if (!pista) { ayuda.innerHTML = '<p class="ac-ayuda__vacio">No quedan más pistas. Si te has atascado, mira la solución razonada.</p>'; return; }
      const caja = el('p', 'ac-ayuda__pista');
      caja.innerHTML = `<b>Pista ${activa.pistasVistas}:</b> ${pista}`;
      ayuda.append(caja);
    });

    btnSolucion.addEventListener('click', () => {
      const { solucion, explicacion } = activa.verSolucion();
      const caja = el('div', 'ac-ayuda__solucion');
      caja.innerHTML = `<p><b>Solución</b></p><pre><code></code></pre><p>${explicacion || ''}</p>`;
      caja.querySelector('code').textContent = solucion || '';
      ayuda.append(caja);
    });

    btnCerrar.addEventListener('click', () => {
      panel.innerHTML = '';
      panel.classList.remove('esta-abierto');
      if (lista) lista.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    pintarAvance((datos.pasos || []).map(p => ({ texto: p.texto, hecho: false })));
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    montaje.terminal.enfocar();
  }

  document.querySelectorAll('[data-abrir-mision]').forEach(boton => {
    boton.addEventListener('click', () => {
      const datos = cfg.misiones.find(m => m.id === boton.dataset.abrirMision);
      if (datos) abrir(datos);
    });
  });

  // ?mision=id abre directamente esa misión (enlaces desde otras páginas).
  const pedida = new URLSearchParams(location.search).get('mision');
  if (pedida) {
    const datos = cfg.misiones.find(m => m.id === pedida);
    if (datos) abrir(datos);
  }
}

/* ------------------------------------------------------------ vista: repaso */
function vistaRepaso(cfg) {
  const zona = document.querySelector('[data-repaso]');
  if (!zona) return;

  const pendientes = progreso.repasosPendientes(null, 20);
  const dificiles = progreso.comandosDificiles(12);
  const porId = new Map(cfg.fichas.map(f => [f.id, f]));

  let cola = pendientes.map(p => porId.get(p.id)).filter(Boolean);
  if (!cola.length) cola = cfg.fichas.slice(0, 10);   // primera visita: empieza por el principio
  let indice = 0;
  let aciertos = 0;

  const tarjeta = zona.querySelector('[data-tarjeta]');
  const marcador = zona.querySelector('[data-marcador]');

  function pintar() {
    if (indice >= cola.length) {
      tarjeta.innerHTML = `<p class="ac-repaso__fin">Tanda terminada: <b>${aciertos}</b> de <b>${cola.length}</b> correctas.</p>
        <p>Lo que has fallado volverá antes; lo que dominas se espaciará.</p>
        <button type="button" class="ac-btn ac-btn--primario" data-otra>Otra tanda</button>`;
      tarjeta.querySelector('[data-otra]').addEventListener('click', () => {
        cola = progreso.repasosPendientes(null, 20).map(p => porId.get(p.id)).filter(Boolean);
        if (!cola.length) cola = cfg.fichas.slice(0, 10);
        indice = 0; aciertos = 0; pintar();
      });
      celebrarLogros(['repaso-diario']);
      pintarProgresoGlobal();
      return;
    }

    const ficha = cola[indice];
    const pregunta = ficha.pregunta?.pregunta || `¿Qué comando de ${ficha.os} hace esto: ${ficha.resumen}?`;
    tarjeta.innerHTML = `
      <p class="ac-repaso__sistema">${ficha.os}</p>
      <p class="ac-repaso__pregunta">${pregunta}</p>
      <form class="ac-repaso__form" autocomplete="off">
        <label class="visually-hidden" for="ac-resp">Tu respuesta</label>
        <input id="ac-resp" type="text" class="ac-input" placeholder="Escribe el comando…" spellcheck="false" autocapitalize="off">
        <button type="submit" class="ac-btn ac-btn--primario">Comprobar</button>
      </form>
      <div class="ac-repaso__resultado" data-resultado role="status" aria-live="polite"></div>`;

    const form = tarjeta.querySelector('form');
    const input = tarjeta.querySelector('input');
    input.focus();

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const dada = input.value.trim().toLowerCase().replace(/\s+/g, ' ');
      const acepta = (ficha.pregunta?.acepta || [ficha.pregunta?.respuesta || ficha.nombre])
        .map(s => String(s).toLowerCase().replace(/\s+/g, ' ').trim());
      const ok = acepta.some(a => a === dada);
      if (ok) aciertos++;
      progreso.practicarComando(ficha.id, ok, ficha.os);

      const res = tarjeta.querySelector('[data-resultado]');
      res.className = 'ac-repaso__resultado ' + (ok ? 'es-ok' : 'es-mal');
      res.innerHTML = ok
        ? `✅ Correcto. ${ficha.pregunta?.porque || ''}`
        : `❌ La respuesta era <code>${ficha.pregunta?.respuesta || ficha.nombre}</code>. ${ficha.pregunta?.porque || ''}`;
      const seguir = el('button', 'ac-btn', 'Siguiente');
      seguir.type = 'button';
      res.append(seguir);
      seguir.focus();
      seguir.addEventListener('click', () => { indice++; pintar(); });
      marcador.textContent = `${indice + 1} de ${cola.length}`;
      pintarProgresoGlobal();
    });
    marcador.textContent = `${indice + 1} de ${cola.length}`;
  }

  const listaDificiles = zona.querySelector('[data-dificiles]');
  if (listaDificiles) {
    if (!dificiles.length) {
      listaDificiles.innerHTML = '<p class="ac-vacio">Todavía no hay comandos difíciles: practica unos cuantos y aquí aparecerán los que más se te resistan.</p>';
    } else {
      listaDificiles.innerHTML = '';
      for (const d of dificiles) {
        const f = porId.get(d.id);
        const fila = el('li', 'ac-dificil');
        fila.innerHTML = `<b>${f ? f.nombre : d.id}</b> <span>${d.fallos} fallo(s) · ${d.aciertos} acierto(s)</span>`;
        listaDificiles.append(fila);
      }
    }
  }

  pintar();
}

/* ------------------------------------------------------------- vista: juego */
async function vistaJuego(cfg) {
  const zona = document.querySelector('[data-juego]');
  if (!zona || !cfg.juego) return;

  const selector = document.querySelector('[data-selector-nivel]');
  let instancia = null;

  async function lanzar(nivelId) {
    if (instancia && instancia.destruir) { try { instancia.destruir(); } catch {} }
    zona.innerHTML = '<p class="ac-cargando">Cargando el juego…</p>';
    try {
      const modulo = await import(`./games/${cfg.juego.archivo}`);
      zona.innerHTML = '';
      instancia = await modulo.iniciar(zona, {
        juego: cfg.juego,
        nivelId,
        base: BASE,
        datos: { escenarios: cfg.escenarios, misiones: cfg.misiones, comandos: cfg.fichas },
        progreso,
        alTerminar: (resultado) => {
          pintarProgresoGlobal();
          if (resultado && resultado.completado) {
            celebrarLogros(['juego-completo'].filter(() =>
              progreso.nivelesCompletados(cfg.juego.slug) >= (cfg.juego.niveles || []).length));
          }
        },
      });
    } catch (error) {
      console.error(error);
      zona.innerHTML = `<div class="ac-error"><p><b>No se pudo cargar este juego.</b></p>
        <p>El resto de la academia sigue funcionando. Detalle técnico: ${String(error.message || error)}</p></div>`;
    }
  }

  if (selector) selector.addEventListener('change', () => lanzar(selector.value));
  const primero = (cfg.juego.niveles || [])[0];
  lanzar(selector ? selector.value : (primero ? primero.id : '1'));
}

/* ------------------------------------------------ progreso: exportar/importar */
function conectarProgresoUI() {
  const exportar = document.querySelector('[data-exportar-progreso]');
  if (exportar) {
    exportar.addEventListener('click', () => {
      const blob = new Blob([progreso.exportar()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `academia-progreso-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      anunciar('Progreso exportado: guarda el archivo donde quieras.', 'ok');
    });
  }

  const importar = document.querySelector('[data-importar-progreso]');
  if (importar) {
    importar.addEventListener('change', async () => {
      const archivo = importar.files && importar.files[0];
      if (!archivo) return;
      if (archivo.size > 2 * 1024 * 1024) { anunciar('Ese archivo es demasiado grande para ser un progreso.', 'mal'); return; }
      const texto = await archivo.text();
      const resultado = progreso.importar(texto, { fusionar: true });
      anunciar(resultado.mensaje, resultado.ok ? 'ok' : 'mal');
      if (resultado.ok) pintarProgresoGlobal();
      importar.value = '';
    });
  }

  const borrar = document.querySelector('[data-borrar-progreso]');
  if (borrar) {
    borrar.addEventListener('click', () => {
      if (!confirm('¿Seguro que quieres borrar todo tu progreso de la academia? Esto no se puede deshacer.')) return;
      progreso.borrarTodo();
      pintarProgresoGlobal();
      anunciar('Progreso borrado. Empiezas de cero.', 'info');
    });
  }
}

/* ---------------------------------------------------------------- arranque */
async function arrancar() {
  const cfg = configuracion();
  pintarProgresoGlobal();
  conectarProgresoUI();
  if (!cfg) return;

  try {
    switch (cfg.vista) {
      case 'comando':   await vistaComando(cfg); break;
      case 'practica':
      case 'combinaciones': await vistaPractica(cfg); break;
      case 'misiones':  await vistaMisiones(cfg); break;
      case 'repaso':    vistaRepaso(cfg); break;
      case 'juego':     await vistaJuego(cfg); break;
      default: break;
    }
  } catch (error) {
    console.error('[Academia]', error);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
else arrancar();

export { progreso };
