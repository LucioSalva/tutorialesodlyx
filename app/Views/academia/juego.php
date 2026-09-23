<?php
/** Un videojuego. @var array $juego @var array $escenarios */
require_once \App\Core\Config::basePath('app/Views/components/academia-ui.php');
$niveles  = (array) ($juego['niveles'] ?? []);
$misiones = \App\Models\AcademiaRepository::misiones();
$fichas   = [];
foreach (\App\Models\AcademiaRepository::SISTEMAS as $sistema) {
    foreach (\App\Models\AcademiaRepository::comandos($sistema) as $c) {
        $fichas[] = ['os' => $sistema] + $c;
    }
}
?>
<?= ac_cabecera(
    (string) ($juego['nombre'] ?? ''),
    (string) ($juego['resumen'] ?? ''),
    ['Academia' => url('academia'), 'Videojuegos' => url('academia/juegos'), $juego['nombre'] ?? '' => null]
) ?>

<div class="container ac-contenido">
  <section class="ac-bloque">
    <div class="ac-juego__barra">
      <?php if (count($niveles) > 1): ?>
        <label class="ac-etiqueta" for="ac-nivel">Nivel</label>
        <select id="ac-nivel" class="ac-select" data-selector-nivel>
          <?php foreach ($niveles as $n): ?>
            <option value="<?= e($n['id'] ?? '') ?>">
              <?= e($n['nombre'] ?? ('Nivel ' . ($n['id'] ?? ''))) ?> · <?= e($n['dificultad'] ?? '') ?> · <?= e($n['os'] ?? '') ?>
            </option>
          <?php endforeach; ?>
        </select>
      <?php endif; ?>
    </div>

    <div class="ac-juego__lienzo" data-juego aria-label="<?= e('Juego: ' . ($juego['nombre'] ?? '')) ?>">
      <p class="ac-cargando">Cargando el juego…</p>
    </div>
  </section>

  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Cómo se juega</h2>
    <p><?= e($juego['mecanica'] ?? '') ?></p>
    <?php if (!empty($juego['controles'])): ?>
      <p class="ac-nota"><b>Controles:</b> <?= e($juego['controles']) ?></p>
    <?php endif; ?>
    <?php if (!empty($juego['aprende'])): ?>
      <p class="ac-nota"><b>Lo que practicas:</b> <?= e(implode(' · ', (array) $juego['aprende'])) ?></p>
    <?php endif; ?>
  </section>
</div>

<?= ac_config([
    'vista'      => 'juego',
    'juego'      => $juego,
    'escenarios' => $escenarios,
    'misiones'   => $misiones,
    'fichas'     => $fichas,
]) ?>
