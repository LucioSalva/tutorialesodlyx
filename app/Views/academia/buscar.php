<?php
/** Buscador de comandos. @var string $consulta @var ?string $osFiltro @var array $resultados */
require_once \App\Core\Config::basePath('app/Views/components/academia-ui.php');
$etiquetas = ['linux' => 'Linux', 'cmd' => 'CMD', 'powershell' => 'PowerShell'];
?>
<?= ac_cabecera(
    'Buscar comandos',
    'Busca por nombre o por lo que quieres hacer («copiar archivo», «ver procesos») en los tres sistemas a la vez.',
    ['Academia' => url('academia'), 'Buscar' => null]
) ?>

<div class="container ac-contenido">
  <section class="ac-bloque">
    <form class="ac-buscador" method="get" action="<?= e(url('academia/buscar')) ?>" role="search">
      <label class="visually-hidden" for="ac-q">Qué quieres hacer</label>
      <input id="ac-q" type="search" name="q" class="ac-input" value="<?= e($consulta) ?>"
             placeholder="copiar archivo, ver procesos, permisos…" autocomplete="off">
      <label class="visually-hidden" for="ac-os">Sistema</label>
      <select id="ac-os" name="os" class="ac-select">
        <option value="">Los tres sistemas</option>
        <?php foreach ($etiquetas as $clave => $texto): ?>
          <option value="<?= e($clave) ?>" <?= $osFiltro === $clave ? 'selected' : '' ?>><?= e($texto) ?></option>
        <?php endforeach; ?>
      </select>
      <button type="submit" class="ac-btn ac-btn--primario">Buscar</button>
    </form>

    <?php if ($consulta !== ''): ?>
      <p class="ac-buscador__resumen">
        <?= count($resultados) ?> resultado(s) para «<?= e($consulta) ?>»<?= $osFiltro ? ' en ' . e($etiquetas[$osFiltro]) : '' ?>.
      </p>
    <?php endif; ?>

    <?php if ($resultados !== []): ?>
      <ul class="ac-resultados">
        <?php foreach ($resultados as $r): $c = $r['comando']; ?>
          <li class="ac-resultado">
            <a href="<?= e(url('academia/' . $r['os'] . '/comando/' . ($c['slug'] ?? ''))) ?>">
              <span class="ac-chip ac-chip--os"><?= e($etiquetas[$r['os']] ?? $r['os']) ?></span>
              <b><?= e($c['nombre'] ?? '') ?></b>
              <span class="ac-resultado__resumen"><?= e($c['resumen'] ?? '') ?></span>
            </a>
          </li>
        <?php endforeach; ?>
      </ul>
    <?php elseif ($consulta !== ''): ?>
      <p class="ac-vacio">Nada coincide con esa búsqueda. Prueba con una palabra más corta, o mira el
        <a class="ac-enlace" href="<?= e(url('academia')) ?>">temario completo</a>.</p>
    <?php endif; ?>
  </section>
</div>
