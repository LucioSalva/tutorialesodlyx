<?php
/**
 * Academia de Redes · lección.
 * @var array $modulo @var array $meta @var array $leccion @var int $numero
 * @var array|null $anterior @var array|null $siguiente
 */
require_once \App\Core\Config::basePath('app/Views/components/redes-ui.php');
$base = 'redes/' . $modulo['slug'];
$total = count($modulo['lecciones'] ?? []);
$ejercicios = [];
foreach ($leccion['bloques'] as $b) {
    if (($b['t'] ?? '') === 'ejercicios') {
        array_push($ejercicios, ...$b['items']);
    }
}
$indice = array_values(array_filter($leccion['bloques'], static fn ($b) => ($b['t'] ?? '') === 'h' && !empty($b['id'])));
$contador = 0;
?>
<?= rd_cabecera((string) $meta['titulo'], (string) $meta['resumen'],
    ['Biblioteca' => url('/'), 'Redes' => url('redes'), (string) $modulo['titulo'] => url($base), 'Lección ' . $numero => null],
    $modulo['titulo'] . ' · Lección ' . $numero . ' de ' . $total . ' · ' . (RD_NIVELES[$meta['nivel']] ?? '')) ?>
<?= rd_subnav($modulo, '') ?>

<div class="container rd-contenido rd-leccion-pag">
  <aside class="rd-indice" aria-label="En esta lección">
    <p class="rd-etiqueta">En esta lección</p>
    <ol>
      <?php foreach ($indice as $h): ?>
        <li><a href="#<?= e($h['id']) ?>"><?= e(strip_tags(rd_md($h['texto']))) ?></a></li>
      <?php endforeach; ?>
    </ol>
    <?php if ($ejercicios !== []): ?>
      <p class="rd-indice__avance" data-avance-leccion><b>0</b> de <?= count($ejercicios) ?> ejercicios resueltos</p>
    <?php endif; ?>
  </aside>

  <article class="rd-articulo">
    <?php if (!empty($leccion['objetivos'])): ?>
      <section class="rd-objetivos" aria-label="Objetivos">
        <p class="rd-etiqueta">Al terminar sabrás</p>
        <ul><?php foreach ($leccion['objetivos'] as $o): ?><li><?= rd_md($o) ?></li><?php endforeach; ?></ul>
      </section>
    <?php endif; ?>

    <?php foreach ($leccion['bloques'] as $b): ?>
      <?= rd_bloque($b, $contador) ?>
    <?php endforeach; ?>

    <nav class="rd-pasar" aria-label="Lección anterior y siguiente">
      <?php if ($anterior): ?>
        <a class="rd-pasar__ant" href="<?= e(url($base . '/leccion/' . $anterior['slug'])) ?>"><span>Anterior</span><b><?= e($anterior['titulo']) ?></b></a>
      <?php else: ?><span></span><?php endif; ?>
      <?php if ($siguiente): ?>
        <a class="rd-pasar__sig" href="<?= e(url($base . '/leccion/' . $siguiente['slug'])) ?>"><span>Siguiente</span><b><?= e($siguiente['titulo']) ?></b></a>
      <?php else: ?>
        <a class="rd-pasar__sig" href="<?= e(url($base . '/practica')) ?>"><span>Siguiente</span><b>Práctica por niveles</b></a>
      <?php endif; ?>
    </nav>
  </article>
</div>
<?= rd_config(['vista' => 'leccion', 'modulo' => $modulo['slug'], 'leccion' => $meta['slug'], 'ejercicios' => $ejercicios]) ?>
