<?php
/** Un juego. @var array $juego */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
$niveles = (array) ($juego['niveles'] ?? []);
$dif = ['facil' => 'fácil', 'media' => 'media', 'dificil' => 'difícil'];
?>
<?= in_cabecera((string) $juego['nombre'], (string) $juego['resumen'], in_migas(['Juegos' => url('ingles/juegos'), $juego['nombre'] => null]), 'Juego ' . (int) $juego['numero'] . ' de 10') ?>
<?= in_subnav('juegos') ?>

<div class="container in-contenido">
  <section class="in-juego">
    <div class="in-juego__barra">
      <label class="in-etiqueta" for="in-nivel" style="margin:0">Nivel</label>
      <select id="in-nivel" class="in-select" data-selector-nivel>
        <?php foreach ($niveles as $n): ?>
          <option value="<?= e($n['id']) ?>"><?= e($n['nombre']) ?> · <?= e($dif[$n['dificultad']] ?? $n['dificultad']) ?></option>
        <?php endforeach; ?>
      </select>
      <button type="button" class="in-btn in-btn--primario in-btn--fino" data-empezar>Jugar este nivel</button>
      <span class="in-nota-pie" data-nivel-estado style="margin:0"></span>
    </div>
    <div class="in-juego__lienzo" data-juego aria-live="polite">
      <p class="in-bajada" data-juego-intro><?= in_md($juego['mecanica'] ?? '') ?></p>
    </div>
  </section>

  <section class="in-caja" aria-labelledby="t-como">
    <h2 class="in-h3" id="t-como">Cómo se juega</h2>
    <p><?= in_md($juego['mecanica'] ?? '') ?></p>
    <p class="in-nota-pie"><b>Controles:</b> <?= in_md($juego['controles'] ?? '') ?></p>
    <?php if (!empty($juego['aprende'])): ?>
      <p class="in-nota-pie"><b>Practicas:</b> <?= e(implode(' · ', (array) $juego['aprende'])) ?></p>
    <?php endif; ?>
  </section>
</div>
<?= in_config(['vista' => 'juego', 'juego' => $juego]) ?>
