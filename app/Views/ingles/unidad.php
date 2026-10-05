<?php
/**
 * Una unidad: objetivos, lecciones, evaluación y recursos relacionados.
 * @var array $meta @var array $unidad @var ?array $bloque @var array $prerrequisitos @var array $temas
 */
use App\Models\InglesRepository as Ingles;

require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');

$relacionados = [];
foreach (['lecturas' => 'Lectura', 'escucha' => 'Escucha', 'conversaciones' => 'Conversación', 'escritura' => 'Escritura'] as $tipo => $nombre) {
    foreach (Ingles::practicas($tipo) as $p) {
        if (($p['unidad'] ?? '') === $meta['slug']) {
            $relacionados[] = ['tipo' => $tipo, 'nombre' => $nombre, 'p' => $p];
        }
    }
}
$cifras = (array) ($meta['cifras'] ?? []);
?>
<?= in_cabecera(
    'Unidad ' . $meta['numero'] . ': ' . $meta['titulo'],
    (string) $meta['resumen'],
    in_migas(['Bloque ' . ($bloque['numero'] ?? '') . ': ' . ($bloque['titulo'] ?? '') => url('ingles#bloque-' . ($bloque['slug'] ?? '')), 'Unidad ' . $meta['numero'] => null]),
    'Bloque ' . ($bloque['numero'] ?? '') . ' · Nivel orientativo ' . $meta['nivel'] . ' · ' . (int) ($cifras['minutos'] ?? 0) . ' min aprox.'
) ?>
<?= in_subnav('') ?>

<div class="container in-contenido in-contenido--unidad">
  <div class="in-unidad-rejilla">
    <div>
      <section class="in-caja" aria-labelledby="t-intro">
        <h2 class="in-h2" id="t-intro">Qué vas a poder hacer</h2>
        <?= in_parrafos((string) ($unidad['introduccion'] ?? '')) ?>
        <ul class="in-objetivos">
          <?php foreach ($meta['objetivos'] as $o): ?><li><?= in_md($o) ?></li><?php endforeach; ?>
        </ul>
      </section>

      <section class="in-caja" aria-labelledby="t-lecciones">
        <h2 class="in-h2" id="t-lecciones">Lecciones</h2>
        <ol class="in-lecciones">
          <?php foreach ($unidad['lecciones'] as $i => $l):
              $m = $meta['lecciones'][$i] ?? [];
              $ejs = count($l['ejercicios'] ?? []);
          ?>
            <li class="in-leccion-item" data-leccion-item="<?= e($l['slug']) ?>">
              <a href="<?= e(url('ingles/leccion/' . $l['slug'])) ?>">
                <span class="in-leccion-item__num"><?= $i + 1 ?></span>
                <span class="in-leccion-item__texto">
                  <span class="in-leccion-item__titulo"><?= e($l['titulo']) ?></span>
                  <span class="in-leccion-item__resumen"><?= in_md($m['resumen'] ?? '') ?></span>
                  <span class="in-leccion-item__pie"><?= count($l['conceptos'] ?? []) ?> conceptos · <?= $ejs ?> ejercicios · <?= (int) ($l['minutos'] ?? 0) ?> min</span>
                </span>
                <span class="in-leccion-item__estado" data-leccion-estado="<?= e($l['slug']) ?>" data-leccion-total="<?= $ejs ?>"></span>
              </a>
            </li>
          <?php endforeach; ?>
        </ol>
      </section>

      <section class="in-caja in-caja--evaluacion" aria-labelledby="t-eval">
        <h2 class="in-h2" id="t-eval">Evaluación de la unidad</h2>
        <p><?= count($unidad['evaluacion']['preguntas'] ?? []) ?> preguntas nuevas sobre todas las lecciones. Al terminar verás cada respuesta explicada, tu porcentaje y qué lecciones conviene repasar. Se aprueba con el <?= (int) ($unidad['evaluacion']['aprobado'] ?? 70) ?> %.</p>
        <p class="in-caja__estado" data-evaluacion-estado="<?= e($meta['slug'] . '.eval') ?>"></p>
        <a class="in-btn in-btn--primario" href="<?= e(url('ingles/unidad/' . $meta['slug'] . '/evaluacion')) ?>">Hacer la evaluación</a>
      </section>
    </div>

    <aside class="in-lateral" aria-label="Relacionado con esta unidad">
      <?php if ($prerrequisitos !== []): ?>
        <section class="in-caja in-caja--fina">
          <h2 class="in-h3">Conviene haber estudiado</h2>
          <ul class="in-lista-enlaces">
            <?php foreach ($prerrequisitos as $p): ?>
              <li><a href="<?= e(url('ingles/unidad/' . $p['slug'])) ?>">Unidad <?= (int) $p['numero'] ?>: <?= e($p['titulo']) ?></a></li>
            <?php endforeach; ?>
          </ul>
        </section>
      <?php endif; ?>

      <?php if ($temas !== []): ?>
        <section class="in-caja in-caja--fina">
          <h2 class="in-h3">Vocabulario de la unidad</h2>
          <ul class="in-lista-enlaces">
            <?php foreach ($temas as $t): ?>
              <li><a href="<?= e(url('ingles/vocabulario/' . $t['slug'])) ?>"><span aria-hidden="true"><?= e($t['icono'] ?? '') ?></span> <?= e($t['nombre']) ?> <small>(<?= (int) $t['total'] ?>)</small></a></li>
            <?php endforeach; ?>
          </ul>
          <a class="in-enlace" href="<?= e(url('ingles/tarjetas?tema=' . $temas[0]['slug'])) ?>">Practicar con tarjetas →</a>
        </section>
      <?php endif; ?>

      <?php if ($relacionados !== []): ?>
        <section class="in-caja in-caja--fina">
          <h2 class="in-h3">Practica esta unidad</h2>
          <ul class="in-lista-enlaces">
            <?php foreach ($relacionados as $r): ?>
              <li><a href="<?= e(url('ingles/' . $r['tipo'] . '/' . $r['p']['slug'])) ?>"><small><?= e($r['nombre']) ?>:</small> <?= e($r['p']['titulo']) ?></a></li>
            <?php endforeach; ?>
          </ul>
        </section>
      <?php endif; ?>
    </aside>
  </div>
</div>

<?= in_config(['vista' => 'unidad', 'unidad' => $meta['slug'],
    'lecciones' => array_map(static fn ($l) => ['slug' => $l['slug'], 'ejercicios' => array_column($l['ejercicios'] ?? [], 'id')], $unidad['lecciones'])]) ?>
