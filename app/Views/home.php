<?php
/**
 * Portada: entrada a la biblioteca.
 *
 * @var array $tutorials
 * @var int   $countTotal
 * @var int   $countReady
 */
$usingDb = \App\Models\TutorialRepository::usingDatabase();
$showDbNotice = !$usingDb && !\App\Core\Config::isProduction();
?>
<section class="tl-hero">
  <div class="container">
    <p class="tl-eyebrow">CODLYX · Biblioteca técnica</p>
    <h1 class="tl-hero__title">Tutoriales <span class="tl-accent">Lucio</span></h1>
    <p class="tl-hero__lead">
      Laboratorios, apuntes y guías técnicas construidos mientras aprendo,
      experimento y documento tecnología. Cada tutorial se escribe sobre una
      máquina real y se puede seguir comando a comando.
    </p>
    <div class="tl-hero__meta">
      <span><b><?= (int) $countReady ?></b> disponible<?= $countReady === 1 ? '' : 's' ?></span>
      <span><b><?= (int) $countTotal ?></b> en la biblioteca</span>
      <span>Origen del catálogo: <b><?= $usingDb ? 'MySQL' : 'catálogo local' ?></b></span>
    </div>
  </div>
</section>

<section class="tl-library">
  <div class="container">

    <?php if ($showDbNotice): ?>
      <div class="tl-notice" role="status">
        <span aria-hidden="true">&#9432;</span>
        <span>
          MySQL no está configurado, así que la biblioteca se sirve desde
          <code>config/catalog.php</code>. El sitio funciona igual; para usar la
          base de datos copia <code>config/config.example.php</code> a
          <code>config/config.php</code> e importa <code>database/schema.sql</code>.
          Este aviso solo aparece en modo desarrollo.
        </span>
      </div>
    <?php endif; ?>

    <div class="tl-section-head">
      <h2>Biblioteca</h2>
      <p>Ordenada por área técnica. Los tutoriales marcados como próximamente aún no tienen contenido.</p>
    </div>

    <div class="tl-grid">
      <?php foreach ($tutorials as $tutorial): ?>
        <?= \App\Core\View::capture('components/tutorial-card', ['tutorial' => $tutorial]) ?>
      <?php endforeach; ?>
    </div>

  </div>
</section>
