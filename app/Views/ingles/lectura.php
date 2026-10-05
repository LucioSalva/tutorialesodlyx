<?php
/** Una lectura graduada. @var array $p @var ?array $unidadRel */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
$texto = implode("\n\n", array_map(static fn ($x) => (string) $x['en'], (array) $p['parrafos']));
$palabras = str_word_count(preg_replace("/[^A-Za-z' ]+/", ' ', $texto) ?? '');
?>
<?= in_cabecera($p['titulo'], (string) ($p['resumen'] ?? ''), in_migas(['Práctica' => url('ingles/practica'), 'Lecturas' => url('ingles/practica#lecturas'), $p['titulo'] => null]),
    'Lectura · ' . ($p['nivel'] ?? '') . ' · ' . $palabras . ' palabras' . ($unidadRel ? ' · tras la unidad ' . (int) $unidadRel['numero'] . ': ' . $unidadRel['titulo'] : '')) ?>
<?= in_subnav('practica') ?>

<div class="container in-contenido">
  <section class="in-caja in-caja--fina">
    <p class="in-etiqueta" style="margin-top:0">Antes de leer</p>
    <?= in_parrafos((string) ($p['antes_de_leer'] ?? '')) ?>
  </section>

  <section class="in-caja" aria-labelledby="t-texto">
    <div class="in-cabecera__acciones" style="margin:0 0 12px">
      <h2 class="in-h2" id="t-texto" style="margin:0 auto 0 0">Texto</h2>
      <button type="button" class="in-btn in-btn--fino" data-traduccion-lectura aria-pressed="false">Mostrar traducción</button>
    </div>
    <div class="in-rep-caja" aria-label="Escuchar lectura completa">
      <p class="in-etiqueta" style="margin-top:0">Escuchar lectura completa</p>
      <div data-reproductor data-tipo="lecturas" data-slug="<?= e($p['slug']) ?>">
        <noscript><p class="in-nota-pie">El reproductor necesita JavaScript.</p></noscript>
      </div>
      <p class="in-nota-pie" data-sinc-nota hidden>Mientras suena, la frase que se oye aparece resaltada. Pulsa cualquier frase para escucharla desde ahí.</p>
    </div>
    <div class="in-lectura" lang="en" data-lectura>
      <?php foreach ((array) $p['parrafos'] as $x): ?>
        <p data-parrafo><?= e($x['en']) ?> <?= in_oir((string) $x['en'], false) ?></p>
        <p class="in-lectura__es" lang="es" hidden data-parrafo-es><?= e($x['es']) ?></p>
      <?php endforeach; ?>
    </div>
  </section>

  <div class="in-unidad-rejilla">
    <section class="in-caja" aria-labelledby="t-vocab">
      <h2 class="in-h3" id="t-vocab">Vocabulario del texto</h2>
      <ul class="in-glosario">
        <?php foreach ((array) $p['vocabulario'] as $v): ?>
          <li><b lang="en"><?= e($v['en']) ?></b> <?= in_oir((string) $v['en'], false) ?> — <?= e($v['es']) ?><?php if (!empty($v['nota'])): ?><br><small><?= in_md($v['nota']) ?></small><?php endif; ?></li>
        <?php endforeach; ?>
      </ul>
    </section>
    <section class="in-caja" aria-labelledby="t-gram">
      <h2 class="in-h3" id="t-gram">Gramática en el texto</h2>
      <?php foreach ((array) $p['gramatica'] as $g): ?>
        <p><b><?= in_md($g['titulo'] ?? '') ?></b><br><?= in_md($g['texto'] ?? '') ?><?php if (!empty($g['ejemplo'])): ?><br><span lang="en" class="in-en"><?= e($g['ejemplo']) ?></span><?php endif; ?></p>
      <?php endforeach; ?>
    </section>
  </div>

  <section class="in-ejercicios" id="ejercicios" aria-labelledby="t-ej">
    <h2 class="in-h2" id="t-ej">Preguntas</h2>
    <p class="in-ejercicios__marcador" data-marcador-practica aria-live="polite"></p>
    <?php foreach ((array) $p['preguntas'] as $i => $q): ?><?= in_ejercicio((array) $q, $i + 1) ?><?php endforeach; ?>
  </section>
</div>
<?= in_config(['vista' => 'lectura', 'clave' => 'lecturas:' . $p['slug'], 'titulo' => $p['titulo'], 'ejercicios' => $p['preguntas']]) ?>
