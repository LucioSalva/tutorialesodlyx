<?php
/**
 * Academia de Redes · simulador de la certificación (simulacros cronometrados).
 * @var array $cert @var array $modulos
 */
require_once \App\Core\Config::basePath('app/Views/components/redes-ui.php');
?>
<?= rd_cabecera('Simulador ' . $cert['corto'], 'Preguntas de los seis dominios mezcladas y con cuenta atrás, como el examen real. Al entregar verás tu nota por dominio y el razonamiento de cada pregunta.',
    ['Biblioteca' => url('/'), 'Redes' => url('redes'), 'Certificación' => url('redes/certificacion'), 'Simulador' => null], 'Certificación · Simulador') ?>
<nav class="rd-subnav" aria-label="Secciones de la certificación"><div class="container"><ul>
  <li><a href="<?= e(url('redes/certificacion')) ?>">Guía del examen</a></li>
  <li><a href="<?= e(url('redes/certificacion/simulador')) ?>" aria-current="page">Simulador</a></li>
</ul></div></nav>

<div class="container rd-contenido">
  <?= rd_examen_zona($cert['examenes'], 'Elige un simulacro') ?>
</div>
<?= rd_config(['vista' => 'examen', 'modulo' => 'ccst', 'examenes' => $cert['examenes'], 'bancos' => rd_bancos($modulos)]) ?>
