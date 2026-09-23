<?php
/**
 * Ruta de aprendizaje de un sistema.
 * @var string $os @var array $meta @var array $categorias @var array $misiones @var array $escenarios
 */
require_once \App\Core\Config::basePath('app/Views/components/academia-ui.php');
$totalComandos = array_sum(array_map(static fn ($c) => count($c['comandos'] ?? []), $categorias));
?>
<?= ac_cabecera(
    (string) $meta['nombre'],
    (string) ($meta['resumen'] ?? ''),
    ['Biblioteca' => url('/'), 'Academia' => url('academia'), $meta['nombre'] => null],
    '<a class="ac-btn ac-btn--primario" href="' . e(url('academia/' . $os . '/practica')) . '">Abrir terminal de práctica</a>'
    . '<a class="ac-btn" href="' . e(url('academia/' . $os . '/misiones')) . '">Misiones</a>'
    . '<a class="ac-btn" href="' . e(url('academia/' . $os . '/combinaciones')) . '">Laboratorio de combinaciones</a>'
) ?>

<div class="container ac-contenido">

  <?= ac_panel_progreso(false) ?>

  <?php if (!empty($meta['notas'])): ?>
    <?= note('Sobre este temario', '<p>' . e((string) $meta['notas']) . '</p>', 'info') ?>
  <?php endif; ?>

  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Temario · <?= (int) $totalComandos ?> comandos</h2>
    <p class="ac-bloque__bajada">En orden: cada bloque se apoya en el anterior. Los marcados como
      <span class="ac-chip ac-chip--sim">Practicable</span> se pueden ejecutar en la terminal simulada.</p>

    <?php foreach ($categorias as $cat): if (empty($cat['comandos'])) continue; ?>
      <div class="ac-categoria">
        <h3 class="ac-categoria__titulo"><?= e($cat['nombre'] ?? '') ?></h3>
        <p class="ac-categoria__desc"><?= e($cat['descripcion'] ?? '') ?></p>
        <ul class="ac-comandos">
          <?php foreach ($cat['comandos'] as $comando): ?>
            <?= ac_tarjeta_comando($os, $comando) ?>
          <?php endforeach; ?>
        </ul>
      </div>
    <?php endforeach; ?>
  </section>

  <?php if ($misiones !== []): ?>
  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Misiones · <?= count($misiones) ?></h2>
    <p class="ac-bloque__bajada">Ejercicios con escenario, pistas progresivas y solución razonada.</p>
    <ol class="ac-misiones">
      <?php foreach (array_slice($misiones, 0, 6) as $m): ?>
        <li class="ac-mision-item" data-mision-id="<?= e($m['id'] ?? '') ?>">
          <a href="<?= e(url('academia/' . $os . '/misiones') . '?mision=' . urlencode((string) ($m['id'] ?? ''))) ?>">
            <span class="ac-chip ac-chip--<?= e($m['nivel'] ?? 'basico') ?>"><?= e(ucfirst((string) ($m['nivel'] ?? ''))) ?></span>
            <b><?= e($m['titulo'] ?? '') ?></b>
            <span class="ac-mision-item__obj"><?= e($m['objetivo'] ?? '') ?></span>
          </a>
        </li>
      <?php endforeach; ?>
    </ol>
    <p class="ac-nota"><a class="ac-enlace" href="<?= e(url('academia/' . $os . '/misiones')) ?>">Ver las <?= count($misiones) ?> misiones →</a></p>
  </section>
  <?php endif; ?>

  <?php if ($escenarios !== []): ?>
  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Escenarios disponibles</h2>
    <ul class="ac-escenarios">
      <?php foreach ($escenarios as $esc): ?>
        <li class="ac-escenario">
          <b><?= e($esc['nombre'] ?? '') ?></b>
          <span><?= e($esc['descripcion'] ?? '') ?></span>
        </li>
      <?php endforeach; ?>
    </ul>
  </section>
  <?php endif; ?>
</div>
