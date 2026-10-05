<?php
/**
 * Examen acumulativo de un bloque.
 * @var array $examen @var ?array $bloque @var array $titulosUnidades
 */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
$preguntas = (array) ($examen['preguntas'] ?? []);
$enlaces = [];
foreach ($titulosUnidades as $slug => $u) {
    $enlaces[$slug] = ['titulo' => 'Unidad ' . $u['numero'] . ': ' . $u['titulo'], 'url' => $u['disponible'] ? url('ingles/unidad/' . $slug) : ''];
}
$bloqueUnidades = (array) ($bloque['unidades'] ?? []);
$anteriores = count(array_filter($preguntas, static fn ($q) => !in_array($q['unidad'] ?? '', $bloqueUnidades, true)));
?>
<?= in_cabecera(
    (string) $examen['titulo'],
    count($preguntas) . ' preguntas de todas las unidades del bloque' . ($anteriores ? ', y ' . $anteriores . ' de bloques anteriores para comprobar que no se ha olvidado' : '') . '.',
    in_migas(['Bloque ' . ($bloque['numero'] ?? '') . ': ' . ($bloque['titulo'] ?? '') => url('ingles#bloque-' . ($bloque['slug'] ?? '')), 'Examen' => null]),
    'Examen acumulativo · Bloque ' . ($bloque['numero'] ?? '') . ' · Se aprueba con el ' . (int) ($examen['aprobado'] ?? 70) . ' %'
) ?>
<?= in_subnav('') ?>

<div class="container in-contenido">
  <div data-resultado hidden></div>

  <section class="in-caja in-eval__intro" data-eval-intro>
    <p>Un examen de bloque mezcla todo lo estudiado en él. Sin pistas ni soluciones hasta que corrijas; después verás cada respuesta explicada y las unidades que conviene repasar.</p>
  </section>

  <section class="in-eval__lista" aria-label="Preguntas">
    <?php foreach ($preguntas as $i => $q):
        $u = $titulosUnidades[$q['unidad'] ?? ''] ?? null;
        $previa = !in_array($q['unidad'] ?? '', $bloqueUnidades, true);
        $meta2 = '<span class="in-eval__meta">' . e(IN_HABILIDADES[$q['habilidad'] ?? ''] ?? '') . ' · Unidad ' . e((string) ($u['numero'] ?? '')) . ($previa ? ' · repaso de un bloque anterior' : '') . '</span>';
    ?>
      <?= in_ejercicio((array) $q, $i + 1, $meta2) ?>
    <?php endforeach; ?>
  </section>

  <div class="in-eval__barra" data-eval-barra>
    <span data-eval-cuenta aria-live="polite">0 de <?= count($preguntas) ?> respondidas</span>
    <button type="button" class="in-btn in-btn--primario" data-eval-terminar>Terminar y corregir</button>
  </div>
</div>

<?= in_config([
    'vista'     => 'examen',
    'id'        => $examen['slug'],
    'titulo'    => $examen['titulo'],
    'aprobado'  => (int) ($examen['aprobado'] ?? 70),
    'preguntas' => $preguntas,
    'temas'     => $enlaces,
    'campoTema' => 'unidad',
    'unidadUrl' => url('ingles#bloque-' . ($bloque['slug'] ?? '')),
]) ?>
