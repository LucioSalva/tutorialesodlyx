<?php
/** Una tarea de escritura. @var array $p @var ?array $unidadRel */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
$ej = $p + ['id' => 'escritura.' . $p['slug'], 'tipo' => 'escritura', 'dificultad' => 2];
?>
<?= in_cabecera($p['titulo'], (string) ($p['objetivo'] ?? ''), in_migas(['Práctica' => url('ingles/practica'), 'Escritura' => url('ingles/practica#escritura'), $p['titulo'] => null]),
    'Escritura · ' . ($p['nivel'] ?? '') . ' · mínimo ' . (int) ($p['min_palabras'] ?? 0) . ' palabras' . ($unidadRel ? ' · tras la unidad ' . (int) $unidadRel['numero'] . ': ' . $unidadRel['titulo'] : '')) ?>
<?= in_subnav('practica') ?>

<div class="container in-contenido">
  <?= in_ejercicio($ej, 1) ?>
  <?= in_nota(['titulo' => 'Cómo se revisa un texto libre', 'texto' => "No existe un corrector automático fiable para textos libres en inglés, así que esta página no te pone una nota inventada. Hace tres cosas honestas:\n\n**1.** Comprueba automáticamente si aparecen las estructuras que pide la tarea (solo si aparecen, no si están bien usadas).\n**2.** Te da criterios concretos para revisar tu texto frase por frase.\n**3.** Te enseña una respuesta modelo con la explicación de cada estructura.\n\nTu borrador se guarda en este navegador mientras escribes."]) ?>
</div>
<?= in_config(['vista' => 'escritura', 'clave' => 'escritura:' . $p['slug'], 'titulo' => $p['titulo'], 'ejercicios' => [$ej]]) ?>
