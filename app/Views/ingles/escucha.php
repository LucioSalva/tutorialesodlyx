<?php
/** Comprensión auditiva. @var array $p @var ?array $unidadRel */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
$voces = [];
foreach ((array) $p['hablantes'] as $h) {
    $voces[$h['nombre']] = $h['voz'] ?? 'a';
}
?>
<?= in_cabecera($p['titulo'], 'Escucha primero sin leer. La transcripción y la traducción se desbloquean cuando hayas escuchado el audio e intentado responder.',
    in_migas(['Práctica' => url('ingles/practica'), 'Escucha' => url('ingles/practica#escucha'), $p['titulo'] => null]),
    'Comprensión auditiva · ' . ($p['nivel'] ?? '') . ($unidadRel ? ' · tras la unidad ' . (int) $unidadRel['numero'] . ': ' . $unidadRel['titulo'] : '')) ?>
<?= in_subnav('practica') ?>

<div class="container in-contenido">
  <section class="in-reproductor" aria-labelledby="t-audio">
    <h2 class="in-h3" id="t-audio" style="margin:0">Situación</h2>
    <p style="margin:0"><?= in_md($p['contexto'] ?? '') ?></p>
    <p class="in-nota-pie" style="margin:0">Hablan: <?= e(implode(', ', array_keys($voces))) ?>. Cada persona tiene su propia voz.</p>
    <div data-reproductor data-tipo="escucha" data-slug="<?= e($p['slug']) ?>">
      <noscript><p class="in-nota-pie">El reproductor necesita JavaScript.</p></noscript>
    </div>
    <p class="in-reproductor__estado" data-estado-audio aria-live="polite">Todavía no lo has escuchado. Para bajar la velocidad, elige 0,75×.</p>
    <details class="in-detalle">
      <summary>Palabras útiles antes de escuchar</summary>
      <ul class="in-glosario" style="margin-top:10px">
        <?php foreach ((array) $p['vocabulario'] as $v): ?><li><b lang="en"><?= e($v['en']) ?></b> <?= in_oir((string) $v['en'], false) ?> — <?= e($v['es']) ?></li><?php endforeach; ?>
      </ul>
    </details>
  </section>

  <section class="in-ejercicios" id="ejercicios" aria-labelledby="t-ej">
    <h2 class="in-h2" id="t-ej">Preguntas</h2>
    <p class="in-bajada">Empieza por las generales (quién, dónde, de qué hablan) y escucha otra vez para los detalles.</p>
    <p class="in-ejercicios__marcador" data-marcador-practica aria-live="polite"></p>
    <?php foreach ((array) $p['preguntas'] as $i => $q): ?><?= in_ejercicio((array) $q, $i + 1) ?><?php endforeach; ?>
  </section>

  <section class="in-caja" aria-labelledby="t-trans">
    <h2 class="in-h3" id="t-trans">Transcripción y traducción</h2>
    <p class="in-bloqueado" data-transcripcion-bloqueada>Se desbloquea cuando hayas escuchado el audio al menos una vez y hayas comprobado alguna respuesta.</p>
    <div data-transcripcion hidden>
      <?= in_dialogo(array_map(static fn ($l) => $l, (array) $p['lineas'])) ?>
    </div>
  </section>
</div>
<?= in_config(['vista' => 'escucha', 'clave' => 'escucha:' . $p['slug'], 'titulo' => $p['titulo'], 'ejercicios' => $p['preguntas']]) ?>
