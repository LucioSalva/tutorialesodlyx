/**
 * Tutoriales Lucio · CODLYX — comportamiento de las páginas de tutorial
 * ---------------------------------------------------------------------
 * Se carga SOLO en /tutoriales/{slug}. Es genérico a propósito: opera
 * sobre las clases del armazón (.tut-*, .term, .filter), no sobre nada
 * específico de Wireshark, así que el próximo tutorial lo hereda sin
 * escribir una línea. Si algún día un tutorial necesita lógica propia,
 * se añade un tutorial-<slug>.js aparte y este fichero no se toca.
 *
 * Funciones:
 *   · barra de progreso de lectura (solo scroll, no guarda nada)
 *   · resaltado de la sección activa en el sumario (IntersectionObserver)
 *   · botón copiar en bloques de terminal y chips de filtro
 *   · botón volver arriba
 *   · lupa de figuras (lightbox) — v1.3.0
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------- Barra de progreso de lectura --------------- */
  var bar = document.querySelector('[data-progress-bar]');
  if (bar) {
    var ticking = false;

    var updateProgress = function () {
      var doc     = document.documentElement;
      var scroll  = window.scrollY || doc.scrollTop || 0;
      var height  = doc.scrollHeight - window.innerHeight;
      var percent = height > 0 ? Math.min(100, Math.max(0, (scroll / height) * 100)) : 0;
      bar.style.width = percent.toFixed(2) + '%';
      ticking = false;
    };

    var requestProgress = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener('scroll', requestProgress, { passive: true });
    window.addEventListener('resize', requestProgress);
  }

  /* --------------------- Sección activa (scrollspy) --------------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('[data-toc-link]'));

  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    var targets = [];

    tocLinks.forEach(function (link) {
      var id = (link.getAttribute('href') || '').replace(/^#/, '');
      if (!id) { return; }
      var section = document.getElementById(id);
      if (!section) { return; }
      // Varios enlaces apuntan al mismo id (el sumario se renderiza dos veces:
      // desplegable en móvil y columna fija en escritorio). byId agrupa todos
      // los enlaces de una sección, pero `targets` debe contener cada sección
      // UNA sola vez y en orden de documento: el bucle de `recalcular` se
      // detiene en la primera que no ha pasado la línea, y un duplicado al
      // final volvería a empezar por la primera sección.
      (byId[id] = byId[id] || []).push(link);
      if (targets.indexOf(section) === -1) { targets.push(section); }
    });

    var activoActual = null;

    // Con un índice de decenas de entradas, la activa puede quedar fuera de
    // la parte visible de la columna. Se arrastra el contenedor del sumario
    // —no la página— para que siempre se vea dónde estás.
    var revelarEnSumario = function (link) {
      var caja = link.closest('.tut-toc__desktop');
      if (!caja || caja.scrollHeight <= caja.clientHeight) { return; }

      var rBox = caja.getBoundingClientRect();
      var rLink = link.getBoundingClientRect();
      var margen = 24;

      if (rLink.top < rBox.top + margen) {
        caja.scrollTop -= (rBox.top + margen) - rLink.top;
      } else if (rLink.bottom > rBox.bottom - margen) {
        caja.scrollTop += rLink.bottom - (rBox.bottom - margen);
      }
    };

    var setActive = function (id) {
      if (id === activoActual) { return; }   // nada que repintar
      activoActual = id;

      tocLinks.forEach(function (link) {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      });

      (byId[id] || []).forEach(function (link) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'true');
        revelarEnSumario(link);
      });
    };

    // La sección activa se decide por POSICIÓN, no por «la primera visible».
    // Una sección larga que ya has dejado atrás sigue intersecando la banda de
    // observación, y elegir la primera visible dejaba el resaltado una sección
    // por detrás. La regla correcta es: la última sección cuyo borde superior
    // ya ha pasado la línea de lectura; si ninguna ha pasado aún, la primera.
    // Línea de lectura: por debajo de la barra fija y con holgura suficiente
    // sobre el punto donde html{scroll-padding-top} deja el destino de un
    // ancla (altura de la barra + 24 px), para que saltar a una sección la
    // marque como activa de inmediato.
    var LINEA = 140;

    var recalcular = function () {
      var elegida = targets[0];

      for (var i = 0; i < targets.length; i++) {
        if (targets[i].getBoundingClientRect().top <= LINEA) {
          elegida = targets[i];
        } else {
          break; // están en orden de documento: en cuanto una no pasa, ninguna pasa
        }
      }

      // Al final del documento gana la última sección aunque su borde superior
      // no haya alcanzado la línea: si no, las últimas nunca se marcarían.
      var doc = document.documentElement;
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) {
        elegida = targets[targets.length - 1];
      }

      if (elegida) { setActive(elegida.id); }
    };

    var pendiente = false;
    var pedirRecalculo = function () {
      if (pendiente) { return; }
      pendiente = true;
      window.requestAnimationFrame(function () {
        pendiente = false;
        recalcular();
      });
    };

    // IntersectionObserver actúa solo como disparador barato: evita calcular
    // rectángulos en cada píxel de scroll cuando no hay nada cerca del borde.
    var observer = new IntersectionObserver(pedirRecalculo, {
      rootMargin: '-80px 0px -40% 0px',
      threshold: 0
    });

    // El scroll también recalcula: dentro de una sección muy alta el observer
    // puede no emitir ningún evento durante cientos de píxeles.
    window.addEventListener('scroll', pedirRecalculo, { passive: true });
    window.addEventListener('resize', pedirRecalculo);
    recalcular();

    targets.forEach(function (section) { observer.observe(section); });
  }

  /* ---------------------------- Copiar ---------------------------- */
  function flash(button, label) {
    var original = button.getAttribute('data-label-idle') || button.textContent;
    button.classList.add('is-done');
    if (button.hasAttribute('data-label-idle')) {
      button.textContent = label;
    }
    button.setAttribute('aria-label', label);

    window.setTimeout(function () {
      button.classList.remove('is-done');
      if (button.hasAttribute('data-label-idle')) {
        button.textContent = original;
      }
      button.setAttribute('aria-label', button.getAttribute('data-label-aria') || 'Copiar');
    }, 1600);
  }

  /**
   * Copia por el método antiguo: un <textarea> temporal fuera de la vista.
   * Funciona en http:// sin TLS y cuando el documento no tiene el foco, dos
   * casos en los que la Clipboard API rechaza.
   */
  function copyLegacy(text) {
    var helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.top = '0';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    helper.setSelectionRange(0, text.length);

    var copiado = false;
    try {
      copiado = document.execCommand('copy');
    } catch (err) {
      copiado = false;
    }
    document.body.removeChild(helper);
    return copiado;
  }

  function copyText(text, button) {
    var done = function () { flash(button, 'Copiado'); };
    var fail = function () { flash(button, 'Error'); };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        // La API puede rechazar por falta de permiso o de foco (por ejemplo
        // dentro de un iframe). En vez de rendirse, se intenta la reserva.
        copyLegacy(text) ? done() : fail();
      });
      return;
    }

    copyLegacy(text) ? done() : fail();
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest ? event.target.closest('[data-copy]') : null;
    if (!button) { return; }

    var source = document.getElementById(button.getAttribute('data-copy'));
    if (!source) { return; }

    // El prompt "$ " es del atrezo visual, no del comando: se elimina para
    // que lo copiado se pueda pegar directamente en una terminal.
    //
    // Se trabaja sobre un CLON: los <span class="p"> pueden estar anidados a
    // cualquier profundidad (en los bloques de terminal cuelgan de un <code>),
    // así que recorrer solo los hijos directos no basta. Clonar y borrar deja
    // el DOM real intacto.
    var clone = source.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('.p'), function (prompt) {
      prompt.parentNode.removeChild(prompt);
    });

    var text = clone.textContent
      .replace(/[ \t]+\n/g, '\n')   // espacios sobrantes al final de línea
      .replace(/^ (?=\S)/gm, '')      // el espacio que seguía al prompt eliminado
      .trim();                        // la sangría real de continuación se conserva

    copyText(text, button);
  });

  /* ------------------------- Volver arriba ------------------------ */
  var topButton = document.querySelector('[data-scroll-top]');
  if (topButton) {
    var syncTop = function () {
      topButton.classList.toggle('is-visible', window.scrollY > 700);
    };
    syncTop();
    window.addEventListener('scroll', syncTop, { passive: true });

    topButton.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* --------------------------- Lightbox --------------------------- */
  /* El tutorial es material visual y algunas figuras traen tablas de
     paquetes: en un portátil se leen, en un móvil hay que ampliarlas.

     Progresivo a propósito: blocks.php envuelve cada figura en un <a>
     que apunta a la imagen, así que sin este script —o si falla— el clic
     sigue abriendo la figura a tamaño completo. Aquí solo se intercepta
     ese enlace para mostrarla encima de la página.

     Sin librerías: son unas cuarenta líneas y una <div>. */
  var zooms = document.querySelectorAll('[data-lightbox]');

  if (zooms.length) {
    var caja = null;
    var imagen = null;
    var pie = null;
    var cerrar = null;
    var origen = null;   // el enlace desde el que se abrió, para devolver el foco

    var construir = function () {
      caja = document.createElement('div');
      caja.className = 'lbox';
      caja.setAttribute('role', 'dialog');
      caja.setAttribute('aria-modal', 'true');
      caja.setAttribute('aria-label', 'Figura ampliada');
      caja.hidden = true;

      cerrar = document.createElement('button');
      cerrar.type = 'button';
      cerrar.className = 'lbox__close';
      cerrar.setAttribute('aria-label', 'Cerrar figura ampliada');
      cerrar.innerHTML = '&times;';

      imagen = document.createElement('img');
      imagen.className = 'lbox__img';
      imagen.alt = '';

      pie = document.createElement('p');
      pie.className = 'lbox__cap';

      caja.appendChild(cerrar);
      caja.appendChild(imagen);
      caja.appendChild(pie);
      document.body.appendChild(caja);

      cerrar.addEventListener('click', ocultar);

      // Clic en el fondo (no en la imagen) también cierra.
      caja.addEventListener('click', function (event) {
        if (event.target === caja) { ocultar(); }
      });

      // Foco atrapado: con una sola parada, Tab siempre vuelve a la X.
      caja.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          ocultar();
        } else if (event.key === 'Tab') {
          event.preventDefault();
          cerrar.focus();
        }
      });
    };

    function ocultar() {
      if (!caja || caja.hidden) { return; }
      caja.hidden = true;
      document.body.classList.remove('has-lbox');
      imagen.removeAttribute('src');
      if (origen) { origen.focus(); origen = null; }
    }

    var mostrar = function (enlace) {
      if (!caja) { construir(); }

      var img = enlace.querySelector('img');
      origen = enlace;

      imagen.src = enlace.getAttribute('href');
      imagen.alt = img ? (img.getAttribute('alt') || '') : '';

      var texto = enlace.closest('figure');
      texto = texto ? texto.querySelector('figcaption') : null;
      pie.textContent = texto ? texto.textContent.trim() : '';

      caja.hidden = false;
      document.body.classList.add('has-lbox');
      cerrar.focus();
    };

    Array.prototype.forEach.call(zooms, function (enlace) {
      enlace.addEventListener('click', function (event) {
        // Respeta abrir en pestaña nueva: Ctrl/Cmd/Shift y el botón central.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
          return;
        }
        event.preventDefault();
        mostrar(enlace);
      });
    });
  }

  /* --------------------------- Buscador --------------------------- */
  /* Filtra las secciones del tutorial sobre el contenido YA cargado: sin
     índice previo, sin peticiones y sin dependencias. En un documento de
     este tamaño buscar a mano es inviable, y un buscador de servidor sería
     desproporcionado para algo que el navegador ya tiene en memoria. */
  var buscador = document.querySelector('[data-tut-search]');

  if (buscador) {
    var estado    = document.querySelector('[data-tut-search-status]');
    var secciones = Array.prototype.slice.call(
      document.querySelectorAll('.tut-body > section[id]')
    );

    // El texto de cada sección se normaliza una sola vez: sin acentos y en
    // minúsculas, para que «retransmision» encuentre «retransmisión».
    var normalizar = function (texto) {
      return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };

    var indice = secciones.map(function (seccion) {
      var titulo = seccion.querySelector('h2');
      return {
        el: seccion,
        titulo: titulo ? titulo.textContent.trim() : seccion.id,
        texto: normalizar(seccion.textContent || '')
      };
    });

    // Los enlaces del sumario, agrupados por ancla, para ocultar también
    // las entradas del índice que no coinciden.
    var enlacesPorId = {};
    Array.prototype.forEach.call(document.querySelectorAll('[data-toc-link]'), function (a) {
      var id = (a.getAttribute('href') || '').replace(/^#/, '');
      if (id) { (enlacesPorId[id] = enlacesPorId[id] || []).push(a.parentNode); }
    });

    var restaurar = function () {
      indice.forEach(function (item) { item.el.removeAttribute('data-search-hidden'); });
      Object.keys(enlacesPorId).forEach(function (id) {
        enlacesPorId[id].forEach(function (li) { li.style.display = ''; });
      });
      document.querySelectorAll('.tut-toc__group').forEach(function (g) { g.style.display = ''; });
      if (estado) { estado.textContent = ''; }
    };

    var buscar = function () {
      var consulta = normalizar(buscador.value.trim());

      if (consulta.length < 2) {
        restaurar();
        return;
      }

      // Varias palabras: han de aparecer todas en la misma sección.
      var terminos = consulta.split(/\s+/);
      var encontradas = [];

      indice.forEach(function (item) {
        var coincide = terminos.every(function (t) {
          return item.texto.indexOf(t) !== -1;
        });

        if (coincide) {
          item.el.removeAttribute('data-search-hidden');
          encontradas.push(item);
        } else {
          item.el.setAttribute('data-search-hidden', '');
        }
      });

      // El sumario refleja el mismo filtro; los encabezados de capítulo se
      // ocultan porque sin sus secciones no significan nada.
      Object.keys(enlacesPorId).forEach(function (id) {
        var visible = encontradas.some(function (item) { return item.el.id === id; });
        enlacesPorId[id].forEach(function (li) { li.style.display = visible ? '' : 'none'; });
      });
      document.querySelectorAll('.tut-toc__group').forEach(function (g) { g.style.display = 'none'; });

      if (estado) {
        if (encontradas.length === 0) {
          estado.textContent = 'Sin resultados para «' + buscador.value.trim() + '».';
        } else {
          estado.textContent = encontradas.length +
            (encontradas.length === 1 ? ' sección: ' : ' secciones: ') +
            encontradas.slice(0, 6).map(function (i) { return i.titulo; }).join(' · ') +
            (encontradas.length > 6 ? ' …' : '');
        }
      }
    };

    // Rebote corto: teclear no debe recorrer 43 secciones en cada pulsación.
    var reloj = null;
    buscador.addEventListener('input', function () {
      window.clearTimeout(reloj);
      reloj = window.setTimeout(buscar, 140);
    });

    buscador.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        buscador.value = '';
        restaurar();
      }
    });

    // Un enlace del sumario debe poder navegar aunque haya búsqueda activa.
    document.addEventListener('click', function (event) {
      var enlace = event.target.closest ? event.target.closest('[data-toc-link]') : null;
      if (enlace && buscador.value !== '') {
        buscador.value = '';
        restaurar();
      }
    });
  }
})();
