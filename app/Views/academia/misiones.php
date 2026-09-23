<?php
/**
 * Lista de misiones de un sistema + panel donde se juegan.
 * @var string $os @var array $meta @var array $misiones
 */
require_once \App\Core\Config::basePath('app/Views/components/academia-ui.php');
$escenarios = \App\Models\AcademiaRepository::escenarios($os);
$comandos   = \App\Models\AcademiaRepository::comandos($os);
$porNivel   = ['basico' => [], 'intermedio' => [], 'avanzado' => []];
foreach ($misiones as $m) {
    $porNivel[$m['nivel'] ?? 'basico'][] = $m;
}
?>
<?= ac_cabecera(
    'Misiones · ' . (string) $meta['nombre'],
    'Cada misión tiene escenario, objetivo comprobable, pistas progresivas y solución razonada.',
    ['Academia' => url('academia'), $meta['nombre'] => url('academia/' . $os), 'Misiones' => null]
) ?>

<div class="container ac-contenido">
  <?= ac_panel_progreso(false) ?>

  <div class="ac-panel-mision" data-panel-mision></div>

  <section class="ac-bloque" data-lista-misiones>
    <?php foreach ($porNivel as $nivel => $lista): if (!$lista) continue; ?>
      <h2 class="ac-bloque__titulo"><?= e(ucfirst($nivel)) ?> · <?= count($lista) ?></h2>
      <ol class="ac-misiones">
        <?php foreach ($lista as $m): ?>
          <li class="ac-mision-item" data-mision-id="<?= e($m['id'] ?? '') ?>">
            <button type="button" class="ac-mision-item__boton" data-abrir-mision="<?= e($m['id'] ?? '') ?>">
              <span class="ac-chip ac-chip--<?= e($nivel) ?>"><?= e(ucfirst($nivel)) ?></span>
              <b><?= e($m['titulo'] ?? '') ?></b>
              <span class="ac-mision-item__obj"><?= e($m['objetivo'] ?? '') ?></span>
              <span class="ac-mision-item__xp">+<?= (int) ($m['recompensa']['xp'] ?? 20) ?> XP</span>
            </button>
          </li>
        <?php endforeach; ?>
      </ol>
    <?php endforeach; ?>
  </section>
</div>

<?= ac_config([
    'vista'      => 'misiones',
    'os'         => $os,
    'misiones'   => $misiones,
    'escenarios' => $escenarios,
    'fichas'     => $comandos,
]) ?>
