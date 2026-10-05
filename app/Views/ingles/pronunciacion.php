<?php
/** Pronunciación: introducción, AFI y secciones. @var array $pron */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
$afi = (array) ($pron['afi'] ?? []);
$secciones = (array) ($pron['secciones'] ?? []);
?>
<?= in_cabecera('Pronunciación', 'Aprender a hablar, no solo a escribir: cómo suena el inglés, qué sonidos no existen en español y cómo leer el Alfabeto Fonético Internacional sin saber fonética.', in_migas(['Pronunciación' => null])) ?>
<?= in_subnav('pronunciacion') ?>

<div class="container in-contenido">
  <section class="in-caja" aria-labelledby="t-intro">
    <h2 class="in-h2" id="t-intro">Por qué el inglés no se lee como se escribe</h2>
    <?= in_parrafos((string) ($pron['introduccion'] ?? '')) ?>
  </section>

  <section class="in-caja" id="afi" aria-labelledby="t-afi">
    <h2 class="in-h2" id="t-afi">Cómo leer el AFI (los símbolos entre barras)</h2>
    <?= in_parrafos((string) ($afi['que_es'] ?? '')) ?>
    <ol class="in-objetivos">
      <?php foreach ((array) ($afi['como_leer'] ?? []) as $x): ?><li><?= in_md($x) ?></li><?php endforeach; ?>
    </ol>
    <?php if (!empty($afi['simbolos_extra'])): ?>
      <div class="in-tabla" style="margin-top:16px">
        <table>
          <thead><tr><th scope="col">Símbolo</th><th scope="col">Qué significa</th></tr></thead>
          <tbody>
            <?php foreach ((array) $afi['simbolos_extra'] as $s): ?>
              <tr><td><span class="in-ipa"><?= e($s['simbolo'] ?? '') ?></span></td><td><?= in_md($s['significa'] ?? '') ?></td></tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </section>

  <section aria-labelledby="t-secciones">
    <h2 class="in-h2" id="t-secciones">Recorrido</h2>
    <p class="in-bajada">Doce secciones, de los sonidos sueltos a la melodía de la frase. Cada una termina con práctica de escuchar, repetir y grabarte.</p>
    <ol class="in-lista-tarjetas">
      <?php foreach ($secciones as $i => $s): ?>
        <li><a href="<?= e(url('ingles/pronunciacion/' . $s['slug'])) ?>" data-seccion="<?= e($s['slug']) ?>">
          <small><?= $i + 1 ?> · <?= count($s['practica'] ?? []) ?> ejercicios</small>
          <b><?= e($s['titulo']) ?></b>
          <span><?= in_md($s['resumen'] ?? '') ?></span>
        </a></li>
      <?php endforeach; ?>
    </ol>
  </section>

  <?= in_nota(['titulo' => 'Sobre el audio', 'texto' => "Los sonidos se generan con la voz inglesa de tu navegador. Suenan bien para practicar, pero no son una grabación humana y varían entre navegadores. En **Voz** (arriba a la derecha) puedes elegir entre inglés estadounidense y británico y ajustar la velocidad.\n\nGrabarte es opcional y tu voz no sale de este navegador."]) ?>
</div>
<?= in_config(['vista' => 'pronunciacion', 'secciones' => array_map(static fn ($s) => ['slug' => $s['slug'], 'ejercicios' => array_column(array_filter($s['practica'] ?? [], static fn ($e) => !in_array($e['tipo'] ?? '', ['pronunciacion', 'escritura'], true)), 'id')], $secciones)]) ?>
