<?php
/**
 * Armazón común a todas las páginas de tutorial.
 *
 * Aporta cabecera, migas de pan, barra de progreso, sumario y pie; el
 * contenido concreto lo pone la vista indicada en $tutorialView. Un
 * tutorial nuevo solo tiene que aportar esa vista.
 *
 * @var array  $tutorial
 * @var array  $sections
 * @var string $tutorialView  p. ej. 'tutorials/wireshark'
 */
require_once \App\Core\Config::basePath('app/Views/components/icons.php');
require_once \App\Core\Config::basePath('app/Views/components/blocks.php');

$sections = $sections ?? [];
$name     = (string) ($tutorial['name'] ?? '');
$desc     = trim((string) ($tutorial['description'] ?? ''));
?>
<div class="tut-progress" aria-hidden="true"><div class="tut-progress__bar" data-progress-bar></div></div>

<header class="tut-head">
  <div class="container">
    <nav aria-label="Ruta de navegación">
      <ol class="tut-breadcrumb">
        <li><a href="<?= e(url('/')) ?>">Biblioteca</a></li>
        <li><span aria-current="page"><?= e($name) ?></span></li>
      </ol>
    </nav>

    <h1 class="tut-head__title"><?= e($name) ?></h1>
    <p class="tut-head__tagline"><?= e($tutorial['tagline'] ?? '') ?></p>
    <?php if ($desc !== ''): ?>
      <p class="tut-head__desc"><?= e($desc) ?></p>
    <?php endif; ?>

    <?php
    // Punto de extensión opcional: si un tutorial aporta
    // components/tutorial-meta-<slug>.php, se inserta aquí (por ejemplo la
    // ficha de la máquina de Wireshark). Si no existe, no pasa nada.
    $metaView = 'components/tutorial-meta-' . (string) ($tutorial['slug'] ?? '');
    if (\App\Core\View::exists($metaView)) {
        echo \App\Core\View::capture($metaView);
    }
    ?>
  </div>
</header>

<div class="container">
  <div class="tut-layout">

    <?= \App\Core\View::capture('components/tutorial-toc', ['sections' => $sections, 'variant' => 'desktop']) ?>

    <article class="tut-body">
      <?= \App\Core\View::capture('components/tutorial-toc', ['sections' => $sections, 'variant' => 'mobile']) ?>

      <?= \App\Core\View::capture($tutorialView) ?>

      <div class="tut-foot">
        <a href="<?= e(url('/')) ?>">&larr; Volver a la biblioteca</a>
        <span>Tutoriales Lucio · CODLYX</span>
      </div>
    </article>

  </div>
</div>

<button type="button" class="tut-top" data-scroll-top aria-label="Volver arriba">
  <?= icon('up', 19) ?>
</button>
