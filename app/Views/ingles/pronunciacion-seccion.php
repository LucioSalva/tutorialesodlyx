<?php
/** Una sección de pronunciación. @var array $seccion @var array $secciones @var array $afi */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
$s = $seccion;
$i = (int) array_search($s['slug'], array_column($secciones, 'slug'), true);
$ant = $secciones[$i - 1] ?? null;
$sig = $secciones[$i + 1] ?? null;
?>
<?= in_cabecera($s['titulo'], (string) ($s['resumen'] ?? ''), in_migas(['Pronunciación' => url('ingles/pronunciacion'), $s['titulo'] => null]), 'Pronunciación · sección ' . ($i + 1) . ' de ' . count($secciones)) ?>
<?= in_subnav('pronunciacion') ?>

<div class="container in-contenido">
  <section class="in-concepto" aria-labelledby="t-exp">
    <div class="in-faceta" data-fase="explicar"><h2 class="in-faceta__t" id="t-exp">Qué es y por qué cuesta</h2><?= in_parrafos((string) ($s['explicacion'] ?? '')) ?></div>

    <?php if (!empty($s['sonidos'])): ?>
      <div class="in-faceta" data-fase="mostrar">
        <h3 class="in-faceta__t">Los sonidos</h3>
        <ul class="in-sonidos">
          <?php foreach ((array) $s['sonidos'] as $x): ?>
            <li class="in-sonido">
              <span class="in-sonido__simbolo">/<?= e($x['simbolo'] ?? '') ?>/</span>
              <b><?= e($x['nombre'] ?? '') ?></b>
              <span class="in-sonido__ejemplos">
                <?php foreach ((array) ($x['ejemplos'] ?? []) as $k => $ej): ?>
                  <span><span lang="en" class="in-en"><?= e($ej) ?></span> <?= in_oir((string) $ej, false) ?><?php if (!empty($x['ipa_ejemplos'][$k])): ?> <span class="in-ipa"><?= e($x['ipa_ejemplos'][$k]) ?></span><?php endif; ?></span>
                <?php endforeach; ?>
              </span>
              <p><b>Cómo:</b> <?= in_md($x['como'] ?? '') ?></p>
              <p><b>Frente al español:</b> <?= in_md($x['espanol'] ?? '') ?></p>
            </li>
          <?php endforeach; ?>
        </ul>
      </div>
    <?php endif; ?>

    <?php foreach ((array) ($s['puntos'] ?? []) as $p): ?>
      <div class="in-faceta" data-fase="senalar">
        <h3 class="in-faceta__t"><?= in_md($p['titulo'] ?? '') ?></h3>
        <?= in_parrafos((string) ($p['texto'] ?? '')) ?>
        <?php if (!empty($p['ejemplos'])): ?>
          <ul class="in-pron">
            <?php foreach ((array) $p['ejemplos'] as $x): ?>
              <li class="in-pron__item"><div class="in-pron__cabeza">
                <span class="in-pron__texto" lang="en"><?= e($x['en'] ?? '') ?></span>
                <?php if (!empty($x['ipa'])): ?><span class="in-ipa"><?= e($x['ipa']) ?></span><?php endif; ?>
                <?= in_oir(str_replace(' / ', '. ', (string) ($x['en'] ?? ''))) ?>
              </div><?php if (!empty($x['es'])): ?><p class="in-pron__consejo"><?= e($x['es']) ?></p><?php endif; ?></li>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>
      </div>
    <?php endforeach; ?>

    <?php if (!empty($s['pares_minimos'])): ?>
      <div class="in-faceta" data-fase="practicar">
        <h3 class="in-faceta__t">Pares mínimos</h3>
        <p>Dos palabras que solo se distinguen por UN sonido. Escucha las dos y después ponte a prueba: el botón «¿Cuál suena?» dice una al azar y tú eliges.</p>
        <div class="in-pares" data-pares>
          <?php foreach ((array) $s['pares_minimos'] as $k => $par): ?>
            <div class="in-par" data-par="<?= $k ?>">
              <div class="in-par__lado"><b lang="en"><?= e($par['a']) ?></b><span class="in-ipa"><?= e($par['ipa_a']) ?></span><small><?= e($par['es_a']) ?></small><?= in_oir((string) $par['a'], false) ?></div>
              <button type="button" class="in-btn in-btn--fino" data-cual="<?= $k ?>">¿Cuál suena?</button>
              <div class="in-par__lado"><b lang="en"><?= e($par['b']) ?></b><span class="in-ipa"><?= e($par['ipa_b']) ?></span><small><?= e($par['es_b']) ?></small><?= in_oir((string) $par['b'], false) ?></div>
            </div>
          <?php endforeach; ?>
        </div>
        <p class="in-nota-pie" data-pares-marcador aria-live="polite"></p>
      </div>
    <?php endif; ?>
  </section>

  <section class="in-ejercicios" id="ejercicios" aria-labelledby="t-ej">
    <header><h2 class="in-h2" id="t-ej">Práctica</h2><p class="in-bajada">Escucha, lee, repite y, si quieres, grábate para compararte con el modelo.</p></header>
    <?php foreach ((array) ($s['practica'] ?? []) as $k => $ej): ?>
      <?= in_ejercicio((array) $ej, $k + 1) ?>
    <?php endforeach; ?>
  </section>

  <nav class="in-vecinas" aria-label="Secciones anterior y siguiente">
    <?php if ($ant): ?><a class="in-vecina in-vecina--ant" href="<?= e(url('ingles/pronunciacion/' . $ant['slug'])) ?>"><small>Anterior</small><span><?= e($ant['titulo']) ?></span></a><?php else: ?><span></span><?php endif; ?>
    <?php if ($sig): ?><a class="in-vecina in-vecina--sig" href="<?= e(url('ingles/pronunciacion/' . $sig['slug'])) ?>"><small>Siguiente</small><span><?= e($sig['titulo']) ?></span></a><?php endif; ?>
  </nav>
</div>
<?= in_config(['vista' => 'pronunciacion', 'seccion' => $s['slug'], 'titulo' => $s['titulo'], 'ejercicios' => $s['practica'] ?? [], 'pares' => $s['pares_minimos'] ?? []]) ?>
