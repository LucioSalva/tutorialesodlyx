<?php
/**
 * Academia de Redes · examen.
 * @var array $modulo
 */
require_once \App\Core\Config::basePath('app/Views/components/redes-ui.php');
$base = 'redes/' . $modulo['slug'];
?>
<?= rd_cabecera('Examen de ' . $modulo['titulo'], 'Sin pistas ni soluciones hasta entregar. Al terminar verás tu calificación y el procedimiento de cada pregunta.',
    ['Biblioteca' => url('/'), 'Redes' => url('redes'), (string) $modulo['titulo'] => url($base), 'Examen' => null], $modulo['titulo'] . ' · Examen') ?>
<?= rd_subnav($modulo, 'examen') ?>

<div class="container rd-contenido">
  <section class="rd-examenes" data-inicio>
    <h2 class="rd-h2">Elige un examen</h2>
    <div class="rd-examenes__lista">
      <?php foreach ($modulo['examenes'] ?? [] as $x): ?>
        <button type="button" class="rd-examen-btn" data-examen="<?= e($x['id']) ?>">
          <b><?= e($x['nombre']) ?></b>
          <span><?= e($x['resumen']) ?></span>
          <span class="rd-examen-btn__mejor" data-mejor="<?= e($x['id']) ?>"></span>
        </button>
      <?php endforeach; ?>
    </div>
    <noscript><p class="rd-aviso">El examen necesita JavaScript: las preguntas se generan y se corrigen en tu navegador.</p></noscript>
  </section>

  <section data-examen-zona hidden>
    <div class="rd-examen-cab">
      <h2 class="rd-h2" data-examen-titulo></h2>
      <p class="rd-examen-reloj" aria-label="Tiempo transcurrido"><span data-reloj>00:00</span></p>
    </div>
    <div data-preguntas></div>
    <div class="rd-acciones">
      <button type="button" class="rd-btn rd-btn--primario" data-entregar>Entregar examen</button>
      <button type="button" class="rd-btn" data-otro hidden>Hacer otro examen</button>
    </div>
    <section class="rd-nota-final" data-nota-final hidden aria-live="polite"></section>
  </section>
</div>
<?= rd_config(['vista' => 'examen', 'modulo' => $modulo['slug'], 'examenes' => $modulo['examenes'] ?? []]) ?>
