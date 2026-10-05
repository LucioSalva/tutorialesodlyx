<?php
/**
 * Práctica de habilidades: lecturas, escucha, conversación y escritura.
 * @var array $lecturas @var array $escucha @var array $conversaciones @var array $escritura @var array $unidadesPorSlug
 */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
$grupos = [
    ['lecturas', 'Comprensión lectora', 'Textos originales graduados, con vocabulario, notas de gramática, audio y preguntas.', $lecturas],
    ['escucha', 'Comprensión auditiva', 'Diálogos para escuchar sin ver el texto. La transcripción se desbloquea después de intentarlo.', $escucha],
    ['conversaciones', 'Conversación', 'Escenarios interactivos: tú respondes (eligiendo o escribiendo) y el diálogo avanza según lo que digas.', $conversaciones],
    ['escritura', 'Escritura', 'Tareas guiadas con estructuras, vocabulario de apoyo, criterios de revisión y una respuesta modelo.', $escritura],
];
?>
<?= in_cabecera('Práctica de habilidades', 'Leer, escuchar, conversar y escribir con lo aprendido en las unidades. Cada actividad indica qué unidad conviene haber estudiado antes.', in_migas(['Práctica' => null])) ?>
<?= in_subnav('practica') ?>

<div class="container in-contenido">
  <nav class="in-caja in-caja--fina" aria-label="Tipos de práctica">
    <p style="margin:0"><?php foreach ($grupos as $i => [$tipo, $titulo, , $lista]): ?><?= $i ? ' · ' : '' ?><a class="in-enlace" href="#<?= e($tipo) ?>"><?= e($titulo) ?> (<?= count($lista) ?>)</a><?php endforeach; ?></p>
  </nav>
  <?php foreach ($grupos as [$tipo, $titulo, $desc, $lista]): ?>
    <section id="<?= e($tipo) ?>" aria-labelledby="t-<?= e($tipo) ?>" style="scroll-margin-top:140px">
      <h2 class="in-h2" id="t-<?= e($tipo) ?>"><?= e($titulo) ?></h2>
      <p class="in-bajada"><?= e($desc) ?></p>
      <ul class="in-lista-tarjetas">
        <?php foreach ($lista as $p): $u = $unidadesPorSlug[$p['unidad'] ?? ''] ?? null; ?>
          <li><a href="<?= e(url('ingles/' . $tipo . '/' . $p['slug'])) ?>" data-practica="<?= e($tipo . ':' . $p['slug']) ?>">
            <small><?= e($p['nivel'] ?? '') ?><?= $u ? ' · tras la unidad ' . (int) $u['numero'] : '' ?></small>
            <b><?= e($p['titulo']) ?></b>
            <span><?= in_md((string) ($p['resumen'] ?? $p['contexto'] ?? $p['objetivo'] ?? '')) ?></span>
          </a></li>
        <?php endforeach; ?>
      </ul>
    </section>
  <?php endforeach; ?>
</div>
<?= in_config(['vista' => 'practica']) ?>
