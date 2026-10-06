<?php
/**
 * Academia de Redes · práctica por niveles (ejercicios generados en el navegador).
 * @var array $modulo
 */
require_once \App\Core\Config::basePath('app/Views/components/redes-ui.php');
$base = 'redes/' . $modulo['slug'];
?>
<?= rd_cabecera('Práctica de ' . $modulo['titulo'], 'Elige un nivel. Cada ejercicio se genera al momento, se corrige campo por campo y trae su solución paso a paso.',
    ['Biblioteca' => url('/'), 'Redes' => url('redes'), (string) $modulo['titulo'] => url($base), 'Práctica' => null], $modulo['titulo'] . ' · Práctica') ?>
<?= rd_subnav($modulo, 'practica') ?>

<div class="container rd-contenido">
  <section class="rd-selector" aria-label="Nivel">
    <div class="rd-selector__niveles" role="group" aria-label="Nivel de dificultad">
      <?php foreach ($modulo['niveles'] ?? [] as $nv): ?>
        <button type="button" class="rd-nivel-btn" data-nivel="<?= (int) $nv['n'] ?>" aria-pressed="false">
          <b><?= (int) $nv['n'] ?></b><span><?= e($nv['nombre']) ?></span>
        </button>
      <?php endforeach; ?>
    </div>
    <p class="rd-selector__resumen" data-resumen></p>
    <div class="rd-selector__fila">
      <label>Tipo de ejercicio
        <select data-tipo><option value="">Todos los del nivel</option></select>
      </label>
      <ul class="rd-marcador" aria-label="Tu marcador en este nivel">
        <li><b data-m="ok">0</b><span>resueltos</span></li>
        <li><b data-m="racha">0</b><span>racha actual</span></li>
        <li><b data-m="mejor">0</b><span>mejor racha</span></li>
      </ul>
    </div>
  </section>

  <section aria-live="polite" data-zona>
    <noscript><p class="rd-aviso">La práctica necesita JavaScript: los ejercicios se generan y se corrigen en tu navegador.</p></noscript>
  </section>

  <div class="rd-acciones">
    <button type="button" class="rd-btn rd-btn--primario" data-siguiente>Otro ejercicio</button>
    <a class="rd-btn" href="<?= e(url($base)) ?>">Volver a las lecciones</a>
  </div>
</div>
<?= rd_config(['vista' => 'practica', 'modulo' => $modulo['slug'], 'bancos' => rd_bancos([$modulo])]) ?>
