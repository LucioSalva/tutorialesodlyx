/**
 * Tutoriales Lucio · CODLYX — comportamiento global
 * ---------------------------------------------------------------------
 * Se carga en todas las páginas. Responsabilidades:
 *   · menú de navegación en móvil
 *   · estado "scrolled" de la barra superior
 *   · conmutador de tema claro/oscuro, con la preferencia del sistema
 *     como valor inicial y localStorage solo como recuerdo local
 *
 * Vanilla JS, sin dependencias. Se sirve con `defer`, así que el DOM ya
 * está construido cuando se ejecuta.
 */
(function () {
  'use strict';

  /* ------------------------------ Tema ---------------------------- */
  var STORAGE_KEY = 'tl-theme';

  function storedTheme() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      // Modo privado o cookies bloqueadas: seguimos con el tema del sistema.
      return null;
    }
  }

  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    var toggle = document.querySelector('[data-theme-toggle]');
    if (!toggle) { return; }

    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    toggle.setAttribute('aria-pressed', String(isLight));
    toggle.setAttribute('aria-label', isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
  }

  function currentTheme() {
    var attr = document.documentElement.getAttribute('data-theme');
    if (attr) { return attr; }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  applyTheme(storedTheme());

  var themeToggle = document.querySelector('[data-theme-toggle]');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = currentTheme() === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch (err) { /* sin persistencia; el tema sigue aplicado en esta pestaña */ }
    });
  }

  /* --------------------------- Navegación ------------------------- */
  var navToggle = document.querySelector('[data-nav-toggle]');
  var nav       = document.getElementById('tl-nav');

  if (navToggle && nav) {
    var closeNav = function () {
      nav.hidden = true;
      navToggle.setAttribute('aria-expanded', 'false');
    };

    var isMobile = function () {
      return window.matchMedia('(max-width: 860px)').matches;
    };

    // Estado inicial coherente con el ancho de partida.
    if (isMobile()) { closeNav(); }

    navToggle.addEventListener('click', function () {
      var open = nav.hidden;
      nav.hidden = !open;
      navToggle.setAttribute('aria-expanded', String(open));
    });

    // Al pasar a escritorio el menú debe volver a ser visible siempre.
    window.addEventListener('resize', function () {
      if (!isMobile()) {
        nav.hidden = false;
        navToggle.setAttribute('aria-expanded', 'false');
      } else if (navToggle.getAttribute('aria-expanded') !== 'true') {
        nav.hidden = true;
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isMobile() && !nav.hidden) {
        closeNav();
        navToggle.focus();
      }
    });
  }

  /* ------------------- Sombra de la barra al hacer scroll --------- */
  var navbar = document.querySelector('.tl-navbar');
  if (navbar) {
    var syncNavbar = function () {
      navbar.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    syncNavbar();
    window.addEventListener('scroll', syncNavbar, { passive: true });
  }
})();
