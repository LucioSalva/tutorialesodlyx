<?php
/**
 * Layout base — envuelve todas las páginas.
 *
 * @var string      $content     HTML de la vista interior (ya renderizado)
 * @var string      $pageTitle
 * @var string      $metaDesc
 * @var string      $bodyClass
 * @var string|null $activeSlug  slug del tutorial activo, para la navegación
 * @var array       $tutorials   catálogo, para el selector de la barra
 * @var bool        $withTutorialAssets
 */
$pageTitle  = $pageTitle  ?? 'Tutoriales Lucio';
$metaDesc   = $metaDesc   ?? '';
$bodyClass  = $bodyClass  ?? '';
$activeSlug = $activeSlug ?? null;
$tutorials  = $tutorials  ?? [];
$withTutorialAssets = $withTutorialAssets ?? false;
$withAcademiaAssets = $withAcademiaAssets ?? false;
$enAcademia         = $enAcademia ?? false;
$canonical  = \App\Core\Config::baseUrl() . ($_SERVER['REQUEST_URI'] ?? '/');
$canonical  = strtok($canonical, '?');
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0A0E14">

<title><?= e($pageTitle) ?></title>
<meta name="description" content="<?= e($metaDesc) ?>">
<meta name="author" content="CODLYX">
<link rel="canonical" href="<?= e($canonical) ?>">

<meta property="og:type" content="website">
<meta property="og:site_name" content="Tutoriales Lucio">
<meta property="og:locale" content="es_MX">
<meta property="og:title" content="<?= e($pageTitle) ?>">
<meta property="og:description" content="<?= e($metaDesc) ?>">
<meta property="og:url" content="<?= e($canonical) ?>">

<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="<?= e($pageTitle) ?>">
<meta name="twitter:description" content="<?= e($metaDesc) ?>">

<link rel="icon" type="image/svg+xml" href="<?= e(asset('assets/img/favicon.svg')) ?>">

<script src="<?= e(asset('assets/js/theme-init.js')) ?>"></script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap">

<link rel="stylesheet" href="<?= e(asset('vendor/bootstrap-grid.min.css')) ?>">
<link rel="stylesheet" href="<?= e(asset('assets/css/app.css')) ?>">
<?php if ($withTutorialAssets): ?>
<link rel="stylesheet" href="<?= e(asset('assets/css/tutorial.css')) ?>">
<?php
    // Hoja específica del tutorial, opcional: si existe
    // public/assets/css/tutorial-<slug>.css se carga después de la genérica.
    // Sirve para diagramas propios de un tutorial sin engordar la hoja común.
    $slugCss = 'assets/css/tutorial-' . (string) $activeSlug . '.css';
    if ($activeSlug !== null && is_file(\App\Core\Config::basePath('public/' . $slugCss))):
?>
<link rel="stylesheet" href="<?= e(asset($slugCss)) ?>">
<?php endif; ?>
<?php endif; ?>
<?php if ($withAcademiaAssets): ?>
<link rel="stylesheet" href="<?= e(asset('assets/css/academia.css')) ?>">
<?php endif; ?>
</head>
<body class="<?= e($bodyClass) ?>" data-base="<?= e(rtrim(url('/'), '/')) ?>">

<a class="tl-skip" href="#contenido">Saltar al contenido</a>

<div class="tl-shell">

<?= \App\Core\View::capture('components/navbar', [
        'tutorials'  => $tutorials,
        'activeSlug' => $activeSlug,
        'enAcademia' => $enAcademia,
    ]) ?>

<main class="tl-main" id="contenido">
<?= $content ?>
</main>

<?= \App\Core\View::capture('components/footer') ?>

</div>

<script src="<?= e(asset('assets/js/app.js')) ?>" defer></script>
<?php if ($withTutorialAssets): ?>
<script src="<?= e(asset('assets/js/tutorial.js')) ?>" defer></script>
<?php
    // Mismo criterio que la hoja: JavaScript propio del tutorial solo si existe.
    $slugJs = 'assets/js/tutorial-' . (string) $activeSlug . '.js';
    if ($activeSlug !== null && is_file(\App\Core\Config::basePath('public/' . $slugJs))):
?>
<script src="<?= e(asset($slugJs)) ?>" defer></script>
<?php endif; ?>
<?php endif; ?>
<?php if ($withAcademiaAssets): ?>
<script type="module" src="<?= e(asset('assets/js/academia/academia.js')) ?>"></script>
<?php endif; ?>
</body>
</html>
