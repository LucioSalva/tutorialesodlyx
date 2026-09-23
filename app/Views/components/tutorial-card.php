<?php
/**
 * Tarjeta de un tutorial en la biblioteca.
 *
 * @var array $tutorial  fila del catálogo (MySQL o config/catalog.php)
 */
require_once \App\Core\Config::basePath('app/Views/components/icons.php');

$slug      = (string) ($tutorial['slug'] ?? '');
$name      = (string) ($tutorial['name'] ?? $slug);
$available = ($tutorial['status'] ?? '') === 'available';
$desc      = trim((string) ($tutorial['description'] ?? ''));
?>
<article class="tl-card <?= $available ? 'tl-card--ready' : 'tl-card--soon' ?>">

  <div class="tl-card__top">
    <span class="tl-card__icon"><?= icon((string) ($tutorial['icon'] ?? 'default'), 22) ?></span>
    <?php if ($available): ?>
      <span class="tl-badge tl-badge--ready">Disponible</span>
    <?php else: ?>
      <span class="tl-badge tl-badge--soon">Próximamente</span>
    <?php endif; ?>
  </div>

  <h3 class="tl-card__title"><?= e($name) ?></h3>
  <p class="tl-card__tagline"><?= e($tutorial['tagline'] ?? '') ?></p>

  <?php if ($desc !== ''): ?>
    <p class="tl-card__desc"><?= e($desc) ?></p>
  <?php else: ?>
    <p class="tl-card__desc" style="color:var(--dv-text-muted)">
      Todavía sin contenido. Se publicará en cuanto el laboratorio esté escrito.
    </p>
  <?php endif; ?>

  <div class="tl-card__foot">
    <span class="tl-card__cat"><?= e($tutorial['category'] ?? '') ?></span>
    <?php if ($available): ?>
      <a class="tl-card__go tl-card__link" href="<?= e(url('tutoriales/' . $slug)) ?>">
        Abrir laboratorio
        <span class="tl-arrow" aria-hidden="true"><?= icon('arrow', 15) ?></span>
        <span class="visually-hidden"> de <?= e($name) ?></span>
      </a>
    <?php else: ?>
      <span class="tl-card__cat" style="opacity:.7">En preparación</span>
    <?php endif; ?>
  </div>

</article>
