<?php
/** Índice de juegos. @var array $juegos */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
?>
<?= in_cabecera('Juegos', 'Diez juegos para memorizar y practicar lo aprendido. Todos tienen niveles, condiciones de éxito, pistas y la explicación de cada respuesta.', in_migas(['Juegos' => null])) ?>
<?= in_subnav('juegos') ?>

<div class="container in-contenido">
  <?php if ($juegos === []): ?>
    <p class="in-bajada">Los juegos todavía no están publicados.</p>
  <?php else: ?>
  <ul class="in-juegos">
    <?php foreach ($juegos as $j): ?>
      <li class="in-juego-tarjeta" data-juego-tarjeta="<?= e($j['slug']) ?>" data-niveles="<?= e(implode(',', array_column($j['niveles'], 'id'))) ?>">
        <a href="<?= e(url('ingles/juegos/' . $j['slug'])) ?>">
          <span class="in-juego-tarjeta__num">Juego <?= (int) $j['numero'] ?></span>
          <h2 class="in-juego-tarjeta__nombre"><?= e($j['nombre']) ?></h2>
          <p><?= in_md($j['resumen']) ?></p>
          <small><?= count($j['niveles']) ?> niveles · <span data-juego-avance></span></small>
        </a>
      </li>
    <?php endforeach; ?>
  </ul>
  <?php endif; ?>
</div>
<?= in_config(['vista' => 'juegos']) ?>
