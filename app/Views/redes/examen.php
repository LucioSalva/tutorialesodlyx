<?php
/**
 * Academia de Redes · examen.
 * @var array $modulo
 */
require_once \App\Core\Config::basePath('app/Views/components/redes-ui.php');
$base = 'redes/' . $modulo['slug'];
?>
<?= rd_cabecera('Examen de ' . $modulo['titulo'], 'Sin pistas ni soluciones hasta entregar. Al terminar verás tu calificación y el procedimiento de cada pregunta.',
    ['Biblioteca' => url('/'), 'Redes' => url('redes'), (string) $modulo['titulo'] => url($base), 'Examen' => null], $modulo['titulo'] . ' · Examen') ?>
<?= rd_subnav($modulo, 'examen') ?>

<div class="container rd-contenido">
  <?= rd_examen_zona($modulo['examenes'] ?? []) ?>
</div>
<?= rd_config(['vista' => 'examen', 'modulo' => $modulo['slug'], 'examenes' => $modulo['examenes'] ?? [], 'bancos' => rd_bancos([$modulo])]) ?>
