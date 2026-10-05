<?php
/** Conversación interactiva ramificada. @var array $p @var ?array $unidadRel */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
?>
<?= in_cabecera($p['titulo'], (string) ($p['contexto'] ?? ''), in_migas(['Práctica' => url('ingles/practica'), 'Conversación' => url('ingles/practica#conversaciones'), $p['titulo'] => null]),
    'Conversación · ' . ($p['nivel'] ?? '') . ($unidadRel ? ' · tras la unidad ' . (int) $unidadRel['numero'] . ': ' . $unidadRel['titulo'] : '')) ?>
<?= in_subnav('practica') ?>

<div class="container in-contenido">
  <section class="in-caja in-caja--fina">
    <p style="margin:0"><b>Hablas con:</b> <?= in_md($p['personaje'] ?? '') ?><br><b>Tu papel:</b> <?= in_md($p['tu_papel'] ?? '') ?></p>
  </section>
  <section class="in-chat" data-chat aria-live="polite">
    <noscript><p class="in-nota in-nota--info">La conversación interactiva necesita JavaScript.</p></noscript>
  </section>
</div>
<?= in_config(['vista' => 'conversacion', 'clave' => 'conversaciones:' . $p['slug'], 'titulo' => $p['titulo'], 'escenario' => $p]) ?>
