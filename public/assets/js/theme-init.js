/**
 * Tutoriales Lucio · CODLYX — aplicación temprana del tema.
 *
 * Se carga de forma SÍNCRONA en el <head>, antes de pintar, para que una
 * preferencia guardada no produzca un parpadeo de tema oscuro→claro.
 * Fichero aparte (no inline) para no requerir 'unsafe-inline' en la CSP.
 */
(function () {
  try {
    var saved = window.localStorage.getItem('tl-theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (err) {
    /* Sin acceso a localStorage: se usa el tema oscuro por defecto. */
  }
})();
