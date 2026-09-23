<?php
/**
 * Barra superior fija: marca, selector de tutoriales y conmutador de tema.
 *
 * @var array       $tutorials
 * @var string|null $activeSlug
 */
require_once \App\Core\Config::basePath('app/Views/components/icons.php');
$tutorials  = $tutorials  ?? [];
$activeSlug = $activeSlug ?? null;
$enAcademia = $enAcademia ?? false;
?>
<header class="tl-navbar">
  <div class="container">
    <div class="tl-navbar__inner">

      <a class="tl-brand" href="<?= e(url('/')) ?>">
        <svg class="tl-brand__mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <rect x="1.5" y="1.5" width="29" height="29" rx="7"
                fill="none" stroke="var(--dv-accent)" stroke-width="1.6"/>
          <path d="M7 20.5 12 9l4 14 3.5-9.5 2 3.5H25"
                fill="none" stroke="var(--dv-accent)" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="tl-brand__text">
          <span class="tl-brand__name">Tutoriales Lucio</span>
          <span class="tl-brand__sub">CODLYX</span>
        </span>
      </a>

      <button type="button" class="tl-nav__toggle" data-nav-toggle
              aria-expanded="false" aria-controls="tl-nav" aria-label="Abrir menú de navegación">
        <?= icon('menu', 20) ?>
      </button>

      <nav class="tl-nav" id="tl-nav" aria-label="Tutoriales">
        <a class="tl-nav__link" href="<?= e(url('/')) ?>"
           <?= $activeSlug === null ? 'aria-current="page"' : '' ?>>Biblioteca</a>

        <?php foreach ($tutorials as $t):
            $slug      = (string) ($t['slug'] ?? '');
            $available = ($t['status'] ?? '') === 'available';
        ?>
          <?php if ($available): ?>
            <a class="tl-nav__link" href="<?= e(url('tutoriales/' . $slug)) ?>"
               <?= $activeSlug === $slug ? 'aria-current="page"' : '' ?>>
              <span class="tl-nav__dot" aria-hidden="true"></span><?= e($t['name'] ?? $slug) ?>
            </a>
          <?php else: ?>
            <span class="tl-nav__link is-disabled">
              <?= e($t['name'] ?? $slug) ?>
              <span class="visually-hidden"> — próximamente, todavía sin contenido</span>
            </span>
          <?php endif; ?>
        <?php endforeach; ?>

        <a class="tl-nav__link tl-nav__link--academia" href="<?= e(url('academia')) ?>"
           <?= $enAcademia ? 'aria-current="page"' : '' ?>>
          <span class="tl-nav__dot tl-nav__dot--academia" aria-hidden="true"></span>Academia
        </a>

        <button type="button" class="tl-nav__link" data-theme-toggle
                aria-pressed="false" aria-label="Cambiar a tema claro"
                style="background:transparent;cursor:pointer">
          <span class="tl-theme-icon" aria-hidden="true"><?= icon('sun', 17) ?></span>
          <span class="visually-hidden">Cambiar tema</span>
        </button>
      </nav>

    </div>
  </div>
</header>
