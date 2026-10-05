<?php
/** Vocabulario por temas. @var array $temas @var int $total */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
?>
<?= in_cabecera('Vocabulario', $total . ' palabras agrupadas en ' . count($temas) . ' temas. Cada una con pronunciación, audio, un ejemplo en contexto y su relación con las unidades del curso.', in_migas(['Vocabulario' => null])) ?>
<?= in_subnav('vocabulario') ?>

<div class="container in-contenido">
  <section aria-labelledby="t-temas">
    <h2 class="in-h2" id="t-temas">Temas</h2>
    <p class="in-bajada">No se trata de memorizar listas: cada tema acompaña a unas unidades concretas. Estudia el tema cuando llegues a su unidad y mándalo al repaso espaciado.</p>
    <ul class="in-temas">
      <?php foreach ($temas as $t): ?>
        <li class="in-tema" data-tema="<?= e($t['slug']) ?>">
          <a href="<?= e(url('ingles/vocabulario/' . $t['slug'])) ?>">
            <span class="in-tema__icono" aria-hidden="true"><?= e($t['icono'] ?? '') ?></span>
            <span class="in-tema__nombre"><?= e($t['nombre']) ?></span>
            <span class="in-tema__desc"><?= e($t['descripcion'] ?? '') ?></span>
            <span class="in-tema__pie"><?= (int) $t['total'] ?> palabras <span data-tema-aprendidas="<?= e($t['slug']) ?>"></span></span>
          </a>
        </li>
      <?php endforeach; ?>
    </ul>
  </section>
  <section class="in-caja">
    <h2 class="in-h3">Tres maneras de estudiarlo</h2>
    <ul class="in-lista-enlaces">
      <li><b>Leer y escuchar</b>: abre un tema, escucha cada palabra y su ejemplo.</li>
      <li><b><a class="in-enlace" href="<?= e(url('ingles/tarjetas')) ?>">Tarjetas</a></b>: cinco modalidades para comprobar si la recuerdas.</li>
      <li><b><a class="in-enlace" href="<?= e(url('ingles/repaso')) ?>">Repaso espaciado</a></b>: las que fallas vuelven antes; las que dominas, cada vez más tarde.</li>
    </ul>
  </section>
</div>
<?= in_config(['vista' => 'vocabulario']) ?>
