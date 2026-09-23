<?php
/** Índice de videojuegos. @var array $juegos */
require_once \App\Core\Config::basePath('app/Views/components/academia-ui.php');
?>
<?= ac_cabecera(
    'Videojuegos',
    'Doce mecánicas distintas que exigen escribir comandos de verdad. El motor es el mismo que el de la terminal de práctica.',
    ['Academia' => url('academia'), 'Videojuegos' => null]
) ?>

<div class="container ac-contenido">
  <?= ac_panel_progreso(false) ?>
  <section class="ac-bloque">
    <ul class="ac-juegos ac-juegos--grande">
      <?php foreach ($juegos as $j): $slug = (string) ($j['slug'] ?? ''); ?>
        <li class="ac-juego">
          <a href="<?= e(url('academia/juegos/' . $slug)) ?>">
            <span class="ac-juego__numero"><?= e(str_pad((string) ($j['numero'] ?? '0'), 2, '0', STR_PAD_LEFT)) ?></span>
            <h2 class="ac-juego__nombre"><?= e($j['nombre'] ?? $slug) ?></h2>
            <p class="ac-juego__resumen"><?= e($j['resumen'] ?? '') ?></p>
            <?php if (!empty($j['aprende'])): ?>
              <p class="ac-juego__aprende">Practicas: <?= e(implode(' · ', array_slice((array) $j['aprende'], 0, 4))) ?></p>
            <?php endif; ?>
            <p class="ac-juego__pie">
              <span class="ac-chip ac-chip--<?= e($j['motor'] ?? 'dom') ?>"><?= e(($j['motor'] ?? '') === 'phaser' ? 'Phaser' : 'Interactivo') ?></span>
              <span class="ac-chip"><?= (int) count($j['niveles'] ?? []) ?> niveles</span>
              <?php foreach ((array) ($j['os'] ?? []) as $sistema): ?>
                <span class="ac-chip ac-chip--os"><?= e($sistema) ?></span>
              <?php endforeach; ?>
            </p>
          </a>
        </li>
      <?php endforeach; ?>
    </ul>
  </section>
</div>
