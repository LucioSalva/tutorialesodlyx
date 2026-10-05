<?php
/**
 * Una lección completa.
 * @var array $unidad @var array $meta @var ?array $bloque @var array $leccion
 * @var int $indice @var int $total @var ?array $anterior @var ?array $siguiente
 */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
$l = $leccion;
$conceptos = (array) ($l['conceptos'] ?? []);
$ejercicios = (array) ($l['ejercicios'] ?? []);
$practica = (array) ($l['practica_comunicativa'] ?? []);
?>
<?= in_cabecera(
    $l['titulo'],
    (string) ($meta['lecciones'][$indice]['resumen'] ?? ''),
    in_migas([
        'Bloque ' . ($bloque['numero'] ?? '') => url('ingles#bloque-' . ($bloque['slug'] ?? '')),
        'Unidad ' . $meta['numero'] . ': ' . $meta['titulo'] => url('ingles/unidad/' . $meta['slug']),
        'Lección ' . ($indice + 1) => null,
    ]),
    'Bloque ' . ($bloque['numero'] ?? '') . ' · Unidad ' . $meta['numero'] . ' · Lección ' . ($indice + 1) . ' de ' . $total . ' · ' . (int) ($l['minutos'] ?? 0) . ' min'
) ?>
<?= in_subnav('') ?>

<div class="container in-contenido">
  <div class="in-leccion">
    <aside class="in-leccion__lateral" aria-label="Índice de la lección">
      <div class="in-leccion__pegajoso">
        <p class="in-etiqueta">En esta lección</p>
        <ol class="in-indice" data-indice>
          <?php if (!empty($l['situacion'])): ?><li><a href="#situacion">Situación</a></li><?php endif; ?>
          <?php foreach ($conceptos as $i => $c): ?>
            <li><a href="#c-<?= e($c['id'] ?? (string) ($i + 1)) ?>"><?= in_md($c['titulo'] ?? '') ?></a></li>
          <?php endforeach; ?>
          <li><a href="#ejercicios">Ejercicios <span class="in-indice__cuenta" data-cuenta-ejercicios>0/<?= count($ejercicios) ?></span></a></li>
          <li><a href="#practica">Práctica comunicativa</a></li>
          <li><a href="#resumen">Resumen</a></li>
        </ol>
        <p class="in-etiqueta">Unidad <?= (int) $meta['numero'] ?></p>
        <ol class="in-indice in-indice--unidad">
          <?php foreach ($meta['lecciones'] as $i => $ml): ?>
            <li<?= $i === $indice ? ' class="es-actual"' : '' ?>>
              <?php if ($i === $indice): ?>
                <span aria-current="page"><?= $i + 1 ?>. <?= e($ml['titulo']) ?></span>
              <?php else: ?>
                <a href="<?= e(url('ingles/leccion/' . $ml['slug'])) ?>" data-leccion-enlace="<?= e($ml['slug']) ?>"><?= $i + 1 ?>. <?= e($ml['titulo']) ?></a>
              <?php endif; ?>
            </li>
          <?php endforeach; ?>
          <li><a href="<?= e(url('ingles/unidad/' . $meta['slug'] . '/evaluacion')) ?>">Evaluación de la unidad</a></li>
        </ol>
      </div>
    </aside>

    <article class="in-leccion__cuerpo">
      <section class="in-caja in-caja--objetivos" aria-labelledby="t-obj">
        <h2 class="in-h3" id="t-obj">Al terminar podrás</h2>
        <ul class="in-objetivos">
          <?php foreach ((array) ($l['objetivos'] ?? []) as $o): ?><li><?= in_md($o) ?></li><?php endforeach; ?>
        </ul>
      </section>

      <?php if (!empty($l['situacion'])): $sit = (array) $l['situacion']; ?>
        <section class="in-situacion" id="situacion" aria-labelledby="t-sit">
          <p class="in-etiqueta">Situación</p>
          <h2 class="in-h2" id="t-sit"><?= in_md($sit['titulo'] ?? '') ?></h2>
          <?= in_parrafos((string) ($sit['texto'] ?? '')) ?>
          <?php if (!empty($sit['dialogo'])): ?><?= in_dialogo((array) $sit['dialogo']) ?><?php endif; ?>
        </section>
      <?php endif; ?>

      <?php foreach ($conceptos as $i => $c): ?>
        <?= in_concepto((array) $c, $i + 1) ?>
      <?php endforeach; ?>

      <section class="in-ejercicios" id="ejercicios" aria-labelledby="t-ej">
        <header class="in-ejercicios__cab">
          <h2 class="in-h2" id="t-ej">Ejercicios</h2>
          <p class="in-bajada">De más fácil a más difícil. Intenta cada uno antes de pedir pistas; la solución siempre explica el porqué.</p>
          <p class="in-ejercicios__marcador" data-marcador-leccion aria-live="polite"></p>
        </header>
        <?php foreach ($ejercicios as $i => $ej): ?>
          <?= in_ejercicio((array) $ej, $i + 1) ?>
        <?php endforeach; ?>
      </section>

      <?php if ($practica !== []): ?>
        <section class="in-practica" id="practica" aria-labelledby="t-pc">
          <p class="in-etiqueta">Práctica comunicativa</p>
          <h2 class="in-h2" id="t-pc"><?= in_md($practica['titulo'] ?? '') ?></h2>
          <p class="in-practica__contexto"><?= in_md($practica['contexto'] ?? '') ?></p>
          <?= in_dialogo((array) ($practica['dialogo'] ?? [])) ?>
          <div class="in-turno" data-turno>
            <p class="in-turno__tarea"><b>Tu turno:</b> <?= in_md($practica['tu_turno'] ?? '') ?></p>
            <label class="visually-hidden" for="turno-texto">Escribe tu respuesta en inglés</label>
            <textarea id="turno-texto" class="in-textarea" rows="3" lang="en" spellcheck="false" placeholder="Escribe aquí lo que dirías… (también puedes decirlo en voz alta)" data-turno-texto></textarea>
            <div class="in-turno__acciones">
              <button type="button" class="in-btn in-btn--fino" data-turno-oir>Escuchar lo que escribí</button>
              <button type="button" class="in-btn in-btn--fino" data-turno-modelo aria-expanded="false" aria-controls="turno-modelo">Ver una respuesta modelo</button>
            </div>
            <div class="in-turno__modelo" id="turno-modelo" hidden>
              <p class="in-turno__frase"><span lang="en"><?= e($practica['modelo'] ?? '') ?></span> <?= in_oir((string) ($practica['modelo'] ?? '')) ?></p>
              <?php if (!empty($practica['alternativas'])): ?>
                <p class="in-etiqueta">También vale</p>
                <ul class="in-alternativas">
                  <?php foreach ((array) $practica['alternativas'] as $a): ?><li><span lang="en"><?= e($a) ?></span> <?= in_oir((string) $a, false) ?></li><?php endforeach; ?>
                </ul>
              <?php endif; ?>
              <p class="in-etiqueta">Compruébalo tú: tu respuesta debería</p>
              <ul class="in-claves">
                <?php foreach ((array) ($practica['claves'] ?? []) as $k): ?><li><?= in_md($k) ?></li><?php endforeach; ?>
              </ul>
              <p class="in-nota-pie">Aquí no hay corrección automática: una respuesta libre admite muchas formas válidas y ningún corrector automático fiable las juzgaría todas. Compara con el modelo y con las claves.</p>
            </div>
          </div>
        </section>
      <?php endif; ?>

      <section class="in-resumen" id="resumen" aria-labelledby="t-res">
        <h2 class="in-h2" id="t-res">Resumen</h2>
        <div class="in-resumen__cols">
          <div>
            <p class="in-etiqueta">Lo esencial</p>
            <ul><?php foreach ((array) ($l['resumen']['esencial'] ?? []) as $x): ?><li><?= in_md($x) ?></li><?php endforeach; ?></ul>
          </div>
          <?php if (!empty($l['resumen']['recuerda'])): ?>
          <div>
            <p class="in-etiqueta">Recuerda</p>
            <ul><?php foreach ((array) $l['resumen']['recuerda'] as $x): ?><li><?= in_md($x) ?></li><?php endforeach; ?></ul>
          </div>
          <?php endif; ?>
        </div>
        <div class="in-resumen__repaso" data-caja-repaso>
          <p><?= count((array) ($l['repaso'] ?? [])) ?> tarjetas de gramática de esta lección entran en tu <a class="in-enlace" href="<?= e(url('ingles/repaso')) ?>">repaso espaciado</a> cuando la terminas.</p>
          <p class="in-resumen__estado" data-estado-leccion aria-live="polite"></p>
        </div>
      </section>

      <nav class="in-vecinas" aria-label="Lecciones anterior y siguiente">
        <?php if ($anterior): ?>
          <a class="in-vecina in-vecina--ant" href="<?= e(url('ingles/leccion/' . $anterior['slug'])) ?>"><small>Anterior</small><span><?= e($anterior['titulo']) ?></span></a>
        <?php else: ?><span></span><?php endif; ?>
        <?php if ($indice === $total - 1): ?>
          <a class="in-vecina in-vecina--sig" href="<?= e(url('ingles/unidad/' . $meta['slug'] . '/evaluacion')) ?>"><small>Siguiente</small><span>Evaluación de la unidad <?= (int) $meta['numero'] ?></span></a>
        <?php elseif ($siguiente): ?>
          <a class="in-vecina in-vecina--sig" href="<?= e(url('ingles/leccion/' . $siguiente['slug'])) ?>"><small>Siguiente</small><span><?= e($siguiente['titulo']) ?></span></a>
        <?php endif; ?>
      </nav>
    </article>
  </div>
</div>

<?= in_config([
    'vista'      => 'leccion',
    'leccion'    => $l['slug'],
    'titulo'     => $l['titulo'],
    'unidad'     => $meta['slug'],
    'unidadNum'  => $meta['numero'],
    'ejercicios' => $ejercicios,
    'repaso'     => array_map(static fn ($r) => $r + ['leccion' => $l['slug'], 'leccion_titulo' => $l['titulo'], 'unidad' => $meta['slug']], (array) ($l['repaso'] ?? [])),
]) ?>
