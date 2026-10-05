<?php
/**
 * Academia de Redes · índice de un módulo.
 * @var array $modulo
 */
require_once \App\Core\Config::basePath('app/Views/components/redes-ui.php');
$base = 'redes/' . $modulo['slug'];
$lecciones = $modulo['lecciones'] ?? [];
?>
<?= rd_cabecera((string) $modulo['titulo'], (string) $modulo['descripcion'],
    ['Biblioteca' => url('/'), 'Academia de Redes' => url('redes'), (string) $modulo['titulo'] => null],
    'Academia de Redes · ' . ($modulo['capa'] ?? '')) ?>
<?= rd_subnav($modulo, '') ?>

<div class="container rd-contenido rd-dos">
  <section aria-labelledby="t-lecciones">
    <h2 class="rd-h2" id="t-lecciones">Lecciones</h2>
    <p class="rd-bajada">Van en orden: cada una usa lo que explicó la anterior. Una lección queda completa cuando resuelves todos sus ejercicios.</p>
    <ol class="rd-lecciones">
      <?php foreach ($lecciones as $i => $l): ?>
        <li class="rd-leccion" data-leccion="<?= e($l['slug']) ?>" data-total="<?= (int) ($l['ejercicios'] ?? 0) ?>">
          <span class="rd-leccion__num" aria-hidden="true"><?= $i + 1 ?></span>
          <div class="rd-leccion__cuerpo">
            <h3><a href="<?= e(url($base . '/leccion/' . $l['slug'])) ?>"><?= e($l['titulo']) ?></a></h3>
            <p><?= e($l['resumen']) ?></p>
            <p class="rd-leccion__meta">
              <span class="rd-nivel rd-nivel--<?= e($l['nivel']) ?>"><?= e(RD_NIVELES[$l['nivel']] ?? '') ?></span>
              <span><?= (int) ($l['ejemplos'] ?? 0) ?> ejemplos resueltos</span>
              <span><?= (int) ($l['ejercicios'] ?? 0) ?> ejercicios</span>
              <span class="rd-leccion__avance" data-avance></span>
            </p>
          </div>
        </li>
      <?php endforeach; ?>
    </ol>
  </section>

  <aside class="rd-lateral" aria-label="Práctica y examen">
    <section class="rd-caja">
      <h2 class="rd-h3">Práctica por niveles</h2>
      <p>Ejercicios generados al momento. No se acaban.</p>
      <ol class="rd-niveles">
        <?php foreach ($modulo['niveles'] ?? [] as $nv): ?>
          <li>
            <a href="<?= e(url($base . '/practica')) ?>?nivel=<?= (int) $nv['n'] ?>">
              <b>Nivel <?= (int) $nv['n'] ?> · <?= e($nv['nombre']) ?></b>
              <span><?= e($nv['resumen']) ?></span>
              <span class="rd-niveles__marca" data-nivel="<?= (int) $nv['n'] ?>"></span>
            </a>
          </li>
        <?php endforeach; ?>
      </ol>
    </section>
    <section class="rd-caja">
      <h2 class="rd-h3">Examen</h2>
      <p>Sin pistas y con calificación. Al terminar se revisa cada respuesta paso a paso.</p>
      <a class="rd-btn" href="<?= e(url($base . '/examen')) ?>">Hacer un examen</a>
    </section>
    <?php if (!empty($modulo['herramientas'])): ?>
    <section class="rd-caja">
      <h2 class="rd-h3">Herramientas</h2>
      <p>Calculadora visual, divisor de redes, planificador VLSM y tabla de prefijos.</p>
      <a class="rd-btn" href="<?= e(url($base . '/herramientas')) ?>">Abrir herramientas</a>
    </section>
    <?php endif; ?>
  </aside>
</div>
<?= rd_config(['vista' => 'modulo', 'modulo' => $modulo['slug']]) ?>
