<?php
/** Comparador de los tres sistemas. @var array $comparativas */
require_once \App\Core\Config::basePath('app/Views/components/academia-ui.php');
?>
<?= ac_cabecera(
    'Linux, CMD y PowerShell comparados',
    'La misma tarea en los tres sistemas, con las diferencias reales de sintaxis y de comportamiento.',
    ['Academia' => url('academia'), 'Comparar' => null]
) ?>

<div class="container ac-contenido">
  <?= note('Parecerse no es ser igual', '
    <p>Muchas tablas de equivalencias dan a entender que <code>dir</code> «es» <code>ls</code> o que
    <code>Copy-Item</code> «es» <code>cp</code>. Hacen un trabajo parecido, pero cambian las opciones, el
    formato de salida y, sobre todo, lo que viaja por la tubería. Aquí cada fila dice en qué se
    diferencian de verdad.</p>') ?>

  <?php foreach ($comparativas as $c): ?>
    <section class="ac-bloque ac-comparativa">
      <h2 class="ac-bloque__titulo"><?= e($c['tarea'] ?? '') ?></h2>
      <div class="ac-comparativa__rejilla">
        <?php foreach (['linux' => 'Linux · Bash', 'cmd' => 'Windows · CMD', 'powershell' => 'Windows · PowerShell'] as $clave => $titulo): ?>
          <div class="ac-comparativa__col">
            <h3><?= e($titulo) ?></h3>
            <code><?= e($c[$clave]['comando'] ?? '—') ?></code>
            <p><?= e($c[$clave]['nota'] ?? '') ?></p>
          </div>
        <?php endforeach; ?>
      </div>
      <?php if (!empty($c['diferencias'])): ?>
        <p class="ac-comparativa__dif"><b>La diferencia que importa:</b> <?= e($c['diferencias']) ?></p>
      <?php endif; ?>
    </section>
  <?php endforeach; ?>
</div>
