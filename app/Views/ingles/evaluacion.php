<?php
/**
 * Evaluación de unidad.
 * @var array $meta @var ?array $bloque @var array $evaluacion @var array $titulosLecciones
 */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
$preguntas = (array) ($evaluacion['preguntas'] ?? []);
$enlaces = [];
foreach ($titulosLecciones as $slug => $t) {
    $enlaces[$slug] = ['titulo' => $t, 'url' => url('ingles/leccion/' . $slug)];
}
?>
<?= in_cabecera(
    (string) ($evaluacion['titulo'] ?? 'Evaluación'),
    count($preguntas) . ' preguntas sobre todas las lecciones de la unidad. Responde todas y pulsa «Terminar y corregir»: verás cada respuesta explicada y qué conviene repasar.',
    in_migas([
        'Unidad ' . $meta['numero'] . ': ' . $meta['titulo'] => url('ingles/unidad/' . $meta['slug']),
        'Evaluación' => null,
    ]),
    'Bloque ' . ($bloque['numero'] ?? '') . ' · Unidad ' . $meta['numero'] . ' · Se aprueba con el ' . (int) ($evaluacion['aprobado'] ?? 70) . ' %'
) ?>
<?= in_subnav('') ?>

<div class="container in-contenido">
  <div data-resultado hidden></div>

  <section class="in-caja in-eval__intro" data-eval-intro>
    <p>Durante la evaluación no hay pistas ni soluciones: es para comprobar lo que ya sabes. Al corregir se muestran todas, con su explicación.</p>
    <p class="in-nota-pie">El resultado se guarda en este navegador. Puedes repetirla tantas veces como quieras; el orden de las opciones cambia en cada intento.</p>
  </section>

  <section class="in-eval__lista" aria-label="Preguntas">
    <?php foreach ($preguntas as $i => $q):
        $meta2 = '<span class="in-eval__meta">' . e(IN_HABILIDADES[$q['habilidad'] ?? ''] ?? '') . ' · ' . e($titulosLecciones[$q['leccion'] ?? ''] ?? '') . '</span>';
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
    'vista'     => 'evaluacion',
    'id'        => $meta['slug'] . '.eval',
    'titulo'    => $evaluacion['titulo'] ?? '',
    'aprobado'  => (int) ($evaluacion['aprobado'] ?? 70),
    'preguntas' => $preguntas,
    'temas'     => $enlaces,
    'campoTema' => 'leccion',
    'unidadUrl' => url('ingles/unidad/' . $meta['slug']),
]) ?>
