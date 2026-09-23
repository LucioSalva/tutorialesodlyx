<?php
/**
 * Terminal de práctica libre: sin misión, sin límite de intentos.
 * @var string $os @var array $meta @var array $escenarios @var array $comandos
 */
require_once \App\Core\Config::basePath('app/Views/components/academia-ui.php');
$practicables = array_values(array_filter($comandos, static fn ($c) => !empty($c['simulado'])));
?>
<?= ac_cabecera(
    'Práctica libre · ' . (string) $meta['nombre'],
    'Escribe lo que quieras. El escenario es virtual: se puede romper y se reinicia con un botón.',
    ['Academia' => url('academia'), $meta['nombre'] => url('academia/' . $os), 'Práctica libre' => null]
) ?>

<div class="container ac-contenido">
  <section class="ac-bloque">
    <div class="ac-practica__barra">
      <label class="ac-etiqueta" for="ac-escenario">Escenario</label>
      <select id="ac-escenario" class="ac-select" data-selector-escenario>
        <?php foreach ($escenarios as $esc): ?>
          <option value="<?= e($esc['id'] ?? '') ?>"><?= e($esc['nombre'] ?? '') ?></option>
        <?php endforeach; ?>
      </select>
      <p class="ac-practica__ayuda">Teclas: <kbd>↑</kbd><kbd>↓</kbd> historial · <kbd>Tab</kbd> completar · <kbd>Ctrl</kbd>+<kbd>L</kbd> limpiar</p>
    </div>
    <?= ac_terminal_zona('data-practica-libre') ?>
  </section>

  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Comandos que puedes ejecutar aquí</h2>
    <p class="ac-bloque__bajada">Pulsa uno para escribirlo en la terminal. Los que no están en esta lista se explican en el temario, pero el simulador todavía no los ejecuta.</p>
    <ul class="ac-atajos">
      <?php foreach ($practicables as $c): ?>
        <li><button type="button" class="ac-atajo" data-insertar="<?= e($c['nombre'] ?? '') ?> "><?= e($c['nombre'] ?? '') ?></button></li>
      <?php endforeach; ?>
    </ul>
  </section>
</div>

<?= ac_config([
    'vista'      => 'practica',
    'os'         => $os,
    'escenarios' => $escenarios,
    'fichas'     => $comandos,
]) ?>
