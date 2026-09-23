<?php
/**
 * Sumario del tutorial. Se renderiza dos veces —desplegable en móvil y
 * columna fija en escritorio— desde la misma fuente de datos, de modo que
 * el índice no puede desincronizarse entre versiones.
 *
 * @var array  $sections  [['anchor'=>…, 'label'=>…, 'badge'=>…], …]
 * @var string $variant   'mobile' | 'desktop'
 */
$sections = $sections ?? [];
$variant  = ($variant ?? 'desktop') === 'mobile' ? 'mobile' : 'desktop';

if ($sections === []) {
    return;
}

$list  = '';
$grupo = null; // capítulo actual, para no repetir el encabezado en cada entrada

foreach ($sections as $s) {
    $anchor = (string) ($s['anchor'] ?? '');
    if ($anchor === '' || !preg_match('/^[A-Za-z][\w\-]*$/', $anchor)) {
        continue; // ancla no válida: se omite en lugar de generar HTML roto
    }
    $badge = trim((string) ($s['badge'] ?? ''));

    // Agrupación opcional en capítulos. Un tutorial que no defina `group`
    // (o cuya base de datos aún no tenga la columna) obtiene la lista plana
    // de siempre: el índice nunca depende de que este campo exista.
    $grupoActual = trim((string) ($s['group'] ?? ''));
    if ($grupoActual !== '' && $grupoActual !== $grupo) {
        $grupo = $grupoActual;
        $list .= '<li class="tut-toc__group" aria-hidden="true">' . e($grupo) . '</li>';
    }

    $list .= '<li><a class="tut-toc__link" data-toc-link href="#' . e($anchor) . '">'
           . ($badge !== ''
                ? '<span class="tut-toc__num" aria-hidden="true">' . e($badge) . '</span>'
                : '<span class="tut-toc__num" aria-hidden="true">·</span>')
           . '<span>' . e($s['label'] ?? $anchor) . '</span>'
           . '</a></li>';
}
?>
<?php if ($variant === 'mobile'): ?>
  <details class="tut-toc__mobile">
    <summary>Índice del tutorial</summary>
    <ul class="tut-toc__list"><?= $list ?></ul>
  </details>
<?php else: ?>
  <nav class="tut-toc tut-toc__desktop" aria-label="Índice del tutorial">
    <p class="tut-toc__title">Contenido</p>
    <ul class="tut-toc__list"><?= $list ?></ul>
  </nav>
<?php endif; ?>
