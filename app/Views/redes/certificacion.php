<?php
/**
 * Academia de Redes · guía de la certificación.
 * @var array $cert @var array $modulos
 */
require_once \App\Core\Config::basePath('app/Views/components/redes-ui.php');
$porSlug = [];
foreach ($modulos as $m) {
    $porSlug[$m['slug']] = $m;
}
$contador = 0;
?>
<?= rd_cabecera((string) $cert['titulo'], (string) $cert['bajada'],
    ['Biblioteca' => url('/'), 'Academia de Redes' => url('redes'), 'Certificación' => null], 'Academia de Redes · Certificación') ?>
<nav class="rd-subnav" aria-label="Secciones de la certificación"><div class="container"><ul>
  <li><a href="<?= e(url('redes/certificacion')) ?>" aria-current="page">Guía del examen</a></li>
  <li><a href="<?= e(url('redes/certificacion/simulador')) ?>">Simulador</a></li>
</ul></div></nav>

<div class="container rd-contenido rd-cert">
  <section aria-labelledby="t-ficha">
    <h2 class="rd-h2" id="t-ficha">El examen de un vistazo</h2>
    <dl class="rd-ficha">
      <?php foreach ($cert['ficha'] as [$et, $valor]): ?>
        <div><dt><?= e($et) ?></dt><dd><?= rd_md($valor) ?></dd></div>
      <?php endforeach; ?>
    </dl>
    <?php foreach ($cert['bloques'] as $b): ?><?= rd_bloque($b, $contador) ?><?php endforeach; ?>
  </section>

  <section aria-labelledby="t-ruta">
    <h2 class="rd-h2" id="t-ruta">Ruta de estudio</h2>
    <p class="rd-bajada">Los módulos en el orden recomendado. Cada uno tiene lecciones, práctica por niveles y examen propio.</p>
    <ol class="rd-ruta">
      <?php foreach ($cert['ruta'] as $i => $paso):
          $m = $porSlug[$paso['modulo']] ?? null;
          if ($m === null) { continue; }
          $ej = array_sum(array_map(static fn ($l) => (int) ($l['ejercicios'] ?? 0), $m['lecciones'] ?? []));
      ?>
        <li class="rd-ruta__paso" data-modulo="<?= e($m['slug']) ?>">
          <span class="rd-leccion__num" aria-hidden="true"><?= $i + 1 ?></span>
          <div>
            <h3><a href="<?= e(url('redes/' . $m['slug'])) ?>"><?= e($m['titulo']) ?></a></h3>
            <p><?= rd_md($paso['texto']) ?></p>
            <p class="rd-leccion__meta"><span><?= count($m['lecciones'] ?? []) ?> lecciones</span><span><?= $ej ?> ejercicios</span><span><?= e($paso['dominios']) ?></span><span class="rd-modulo__avance" data-avance hidden></span></p>
          </div>
        </li>
      <?php endforeach; ?>
    </ol>
  </section>

  <section aria-labelledby="t-objetivos">
    <h2 class="rd-h2" id="t-objetivos">Los objetivos del examen y dónde se estudian</h2>
    <p class="rd-bajada">El temario oficial tiene seis dominios. Debajo de cada objetivo están las lecciones que lo cubren.</p>
    <?php foreach ($cert['dominios'] as $d): ?>
      <section class="rd-dominio" aria-labelledby="t-dom-<?= (int) $d['n'] ?>">
        <h3 class="rd-h3" id="t-dom-<?= (int) $d['n'] ?>"><span class="rd-dominio__n"><?= (int) $d['n'] ?>.0</span> <?= e($d['nombre']) ?></h3>
        <p class="rd-bajada"><?= rd_md($d['resumen']) ?></p>
        <ul class="rd-objetivos-lista">
          <?php foreach ($d['objetivos'] as $o): ?>
            <li>
              <p class="rd-objetivo__texto"><b><?= e($o['id']) ?></b> <?= rd_md($o['texto']) ?></p>
              <?php if (!empty($o['detalle'])): ?><p class="rd-objetivo__detalle"><?= rd_md($o['detalle']) ?></p><?php endif; ?>
              <ul class="rd-objetivo__lecciones">
                <?php foreach ($o['lecciones'] as $l): ?>
                  <li><a href="<?= e(url('redes/' . $l['modulo'] . '/leccion/' . $l['slug'])) ?>"><?= e($l['titulo']) ?></a></li>
                <?php endforeach; ?>
              </ul>
            </li>
          <?php endforeach; ?>
        </ul>
      </section>
    <?php endforeach; ?>
  </section>

  <section aria-labelledby="t-plan">
    <h2 class="rd-h2" id="t-plan">Cómo prepararte</h2>
    <?php foreach ($cert['plan'] as $b): ?><?= rd_bloque($b, $contador) ?><?php endforeach; ?>
    <div class="rd-acciones">
      <a class="rd-btn rd-btn--primario" href="<?= e(url('redes/certificacion/simulador')) ?>">Abrir el simulador</a>
      <a class="rd-btn" href="<?= e(url('redes')) ?>">Ver todos los módulos</a>
    </div>
  </section>
</div>
<?= rd_config(['vista' => 'inicio', 'modulos' => array_map(static fn ($m) => ['slug' => $m['slug'], 'lecciones' => array_map(static fn ($l) => ['slug' => $l['slug'], 'ejercicios' => $l['ejercicios'] ?? 0, 'titulo' => $l['titulo']], $m['lecciones'] ?? [])], $modulos)]) ?>
