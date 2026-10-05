<?php
/** Repaso espaciado. @var array $temas */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
?>
<?= in_cabecera('Repaso espaciado', 'Vocabulario y gramática que tocan hoy. Lo que fallas vuelve en minutos; lo que recuerdas, cada vez más tarde. Así se estudia lo que se está olvidando, no lo que ya sabes.', in_migas(['Repaso' => null])) ?>
<?= in_subnav('repaso') ?>

<div class="container in-contenido">
  <section class="in-caja in-caja--fina" data-repaso-resumen aria-live="polite"></section>
  <h2 class="visually-hidden">Sesión de repaso</h2>
  <section class="in-mazo" data-mazo></section>

  <section class="in-caja" aria-labelledby="t-dificiles">
    <h2 class="in-h3" id="t-dificiles">Mis tarjetas difíciles</h2>
    <p class="in-nota-pie">Las que más veces has fallado en proporción a tus aciertos.</p>
    <ul class="in-lista-enlaces" data-dificiles><li>Todavía no hay ninguna.</li></ul>
  </section>

  <section class="in-caja in-caja--fina">
    <h2 class="in-h3">Cómo entran las tarjetas en el repaso</h2>
    <ul class="in-lista-enlaces">
      <li><b>Gramática</b>: al completar una lección, sus tarjetas se añaden solas.</li>
      <li><b>Vocabulario</b>: al estudiar una palabra en <a class="in-enlace" href="<?= e(url('ingles/tarjetas')) ?>">Tarjetas</a> o al pulsar «Añadir el tema a mi repaso» en un <a class="in-enlace" href="<?= e(url('ingles/vocabulario')) ?>">tema</a>.</li>
      <li><b>Límite de nuevas</b>: como máximo <select class="in-select" data-nuevas-dia aria-label="Tarjetas nuevas por día"><option>5</option><option>10</option><option>15</option><option>20</option><option>30</option></select> tarjetas nuevas al día, para que el repaso no se acumule.</li>
    </ul>
    <p class="in-nota-pie">Algoritmo: SM-2, el mismo principio de SuperMemo. Las cuatro respuestas ajustan el intervalo y la «facilidad» de cada tarjeta.</p>
  </section>
</div>
<?= in_config(['vista' => 'repaso']) ?>
