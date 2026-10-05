<?php
/** Un tema de vocabulario. @var array $tema @var array $palabras @var array $unidades @var array $temas */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
$tipos = ['sustantivo' => 'sustantivo', 'verbo' => 'verbo', 'adjetivo' => 'adjetivo', 'adverbio' => 'adverbio', 'preposicion' => 'preposición',
          'pronombre' => 'pronombre', 'expresion' => 'expresión', 'numero' => 'número', 'determinante' => 'determinante', 'conjuncion' => 'conjunción', 'interjeccion' => 'interjección'];
$formas = ['tercera' => '3.ª persona', 'ing' => '-ing', 'pasado' => 'pasado', 'participio' => 'participio'];
?>
<?= in_cabecera(
    ($tema['icono'] ?? '') . ' ' . $tema['nombre'],
    (string) ($tema['descripcion'] ?? ''),
    in_migas(['Vocabulario' => url('ingles/vocabulario'), $tema['nombre'] => null]),
    count($palabras) . ' palabras',
    '<a class="in-btn in-btn--primario in-btn--fino" href="' . e(url('ingles/tarjetas?tema=' . $tema['slug'])) . '">Practicar con tarjetas</a>'
    . '<button type="button" class="in-btn in-btn--fino" data-anadir-tema>Añadir el tema a mi repaso</button>'
) ?>
<?= in_subnav('vocabulario') ?>

<div class="container in-contenido">
  <?php if ($unidades !== []): ?>
    <p class="in-bajada">Se usa en:
      <?php foreach ($unidades as $i => $u): ?><?= $i ? ' · ' : '' ?><?php if ($u['disponible']): ?><a class="in-enlace" href="<?= e(url('ingles/unidad/' . $u['slug'])) ?>">Unidad <?= (int) $u['numero'] ?>: <?= e($u['titulo']) ?></a><?php else: ?>Unidad <?= (int) $u['numero'] ?>: <?= e($u['titulo']) ?><?php endif; ?><?php endforeach; ?>
    </p>
  <?php endif; ?>

  <div class="in-filtro">
    <label class="visually-hidden" for="filtro-palabras">Filtrar palabras</label>
    <input id="filtro-palabras" class="in-input" type="search" placeholder="Filtrar en inglés o en español…" data-filtro>
    <span class="in-nota-pie" data-filtro-cuenta aria-live="polite"></span>
  </div>

  <ul class="in-palabras">
    <?php foreach ($palabras as $p): ?>
      <li class="in-palabra" id="<?= e($p['id']) ?>" data-palabra="<?= e($p['id']) ?>" data-buscar="<?= e(mb_strtolower($p['en'] . ' ' . $p['es'])) ?>">
        <div class="in-palabra__cab">
          <?php if (!empty($p['emoji'])): ?><span class="in-palabra__emoji" aria-hidden="true"><?= e($p['emoji']) ?></span><?php endif; ?>
          <span class="in-palabra__en" lang="en"><?= e($p['en']) ?></span>
          <?= in_oir((string) $p['en']) ?>
          <span class="in-palabra__estado" data-palabra-estado></span>
        </div>
        <p class="in-palabra__tipo"><?= e($tipos[$p['tipo']] ?? $p['tipo']) ?> · <span class="in-ipa"><?= e($p['ipa'] ?? '') ?></span></p>
        <p class="in-palabra__es"><?= e($p['es']) ?></p>
        <p class="in-palabra__ej"><span lang="en"><?= e($p['ejemplo']['en'] ?? '') ?></span> <?= in_oir((string) ($p['ejemplo']['en'] ?? ''), false) ?><br><span class="in-es"><?= e($p['ejemplo']['es'] ?? '') ?></span></p>
        <?php
        $datos = [];
        if (!empty($p['plural'])) { $datos[] = ['plural', $p['plural']]; }
        foreach ((array) ($p['formas'] ?? []) as $k => $v) { $datos[] = [$formas[$k] ?? $k, $v]; }
        if (!empty($p['variantes']['us']) || !empty($p['variantes']['gb'])) {
            $datos[] = ['EE. UU. / R. U.', ($p['variantes']['us'] ?? '—') . ' / ' . ($p['variantes']['gb'] ?? '—')];
        }
        if (!empty($p['relacionadas'])) { $datos[] = ['relacionadas', implode(', ', (array) $p['relacionadas'])]; }
        ?>
        <?php if ($datos !== []): ?>
          <dl class="in-palabra__datos">
            <?php foreach ($datos as [$k, $v]): ?><div><dt><?= e($k) ?>:</dt> <dd lang="en"><?= e($v) ?></dd></div><?php endforeach; ?>
          </dl>
        <?php endif; ?>
        <?php if (!empty($p['nota'])): ?><p class="in-palabra__nota"><?= in_md($p['nota']) ?></p><?php endif; ?>
      </li>
    <?php endforeach; ?>
  </ul>

  <nav class="in-caja in-caja--fina" aria-label="Otros temas">
    <p class="in-etiqueta">Otros temas</p>
    <p><?php foreach ($temas as $i => $t): ?><?= $i ? ' · ' : '' ?><?php if ($t['slug'] === $tema['slug']): ?><b><?= e($t['nombre']) ?></b><?php else: ?><a class="in-enlace" href="<?= e(url('ingles/vocabulario/' . $t['slug'])) ?>"><?= e($t['nombre']) ?></a><?php endif; ?><?php endforeach; ?></p>
  </nav>
</div>
<?= in_config(['vista' => 'tema', 'tema' => $tema['slug'], 'palabras' => array_column($palabras, 'id')]) ?>
