<?php
/**
 * Academia de Comandos · portada.
 * @var array $sistemas @var array $estadisticas @var array $juegos @var array $comparativas
 */
require_once \App\Core\Config::basePath('app/Views/components/academia-ui.php');
?>
<?= ac_cabecera(
    'Academia de Comandos',
    'Aprende, practica en una terminal simulada, juega y memoriza. Linux, CMD y PowerShell, desde cero.',
    ['Biblioteca' => url('/'), 'Academia' => null]
) ?>

<div class="container ac-contenido">

  <?= ac_panel_progreso() ?>

  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Elige tu modalidad</h2>
    <p class="ac-bloque__bajada">Cada una tiene su temario, su terminal, sus misiones y su progreso independiente.</p>
    <?= ac_selector_sistemas($sistemas) ?>
  </section>

  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Cómo funciona</h2>
    <ol class="ac-ciclo">
      <li><b>Aprende</b><span>La ficha del comando: qué hace, su sintaxis, sus opciones y cómo leer su salida.</span></li>
      <li><b>Practica</b><span>Una terminal simulada dentro de la página. Nada sale de tu navegador.</span></li>
      <li><b>Combina</b><span>Tuberías y redirecciones para resolver problemas reales.</span></li>
      <li><b>Juega</b><span>Doce juegos que exigen usar lo aprendido de verdad.</span></li>
      <li><b>Memoriza</b><span>Repaso espaciado: lo que fallas vuelve antes.</span></li>
    </ol>
  </section>

  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Videojuegos</h2>
    <p class="ac-bloque__bajada">Doce mecánicas distintas. Ninguna es un cuestionario disfrazado.</p>
    <ul class="ac-juegos">
      <?php foreach ($juegos as $j): $slug = (string) ($j['slug'] ?? ''); ?>
        <li class="ac-juego">
          <a href="<?= e(url('academia/juegos/' . $slug)) ?>">
            <span class="ac-juego__numero"><?= e(str_pad((string) ($j['numero'] ?? '0'), 2, '0', STR_PAD_LEFT)) ?></span>
            <h3 class="ac-juego__nombre"><?= e($j['nombre'] ?? $slug) ?></h3>
            <p class="ac-juego__resumen"><?= e($j['resumen'] ?? '') ?></p>
            <p class="ac-juego__pie">
              <span class="ac-chip ac-chip--<?= e($j['motor'] ?? 'dom') ?>"><?= e(($j['motor'] ?? '') === 'phaser' ? 'Phaser' : 'Interactivo') ?></span>
              <span class="ac-chip"><?= (int) count($j['niveles'] ?? []) ?> niveles</span>
            </p>
          </a>
        </li>
      <?php endforeach; ?>
    </ul>
  </section>

  <?php if ($comparativas !== []): ?>
  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">La misma tarea en los tres sistemas</h2>
    <div class="ac-tabla">
      <table>
        <caption class="visually-hidden">Equivalencias entre Linux, CMD y PowerShell</caption>
        <thead><tr><th scope="col">Tarea</th><th scope="col">Linux</th><th scope="col">CMD</th><th scope="col">PowerShell</th></tr></thead>
        <tbody>
          <?php foreach ($comparativas as $c): ?>
            <tr>
              <td class="f"><?= e($c['tarea'] ?? '') ?></td>
              <td><code><?= e($c['linux']['comando'] ?? '') ?></code></td>
              <td><code><?= e($c['cmd']['comando'] ?? '') ?></code></td>
              <td><code><?= e($c['powershell']['comando'] ?? '') ?></code></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <p class="ac-nota"><a class="ac-enlace" href="<?= e(url('academia/comparar')) ?>">Ver la comparación completa, con las diferencias de comportamiento →</a></p>
  </section>
  <?php endif; ?>

  <section class="ac-bloque ac-bloque--cifras">
    <h2 class="ac-bloque__titulo">Qué hay dentro ahora mismo</h2>
    <ul class="ac-cifras">
      <li><b><?= (int) ($estadisticas['comandos'] ?? 0) ?></b><span>fichas de comando</span></li>
      <li><b><?= (int) ($estadisticas['misiones'] ?? 0) ?></b><span>misiones con solución razonada</span></li>
      <li><b><?= (int) ($estadisticas['juegos'] ?? 0) ?></b><span>videojuegos</span></li>
      <li><b><?= (int) ($estadisticas['niveles'] ?? 0) ?></b><span>niveles jugables</span></li>
      <li><b><?= (int) ($estadisticas['escenarios'] ?? 0) ?></b><span>escenarios simulados</span></li>
    </ul>
    <p class="ac-nota">
      <a class="ac-enlace" href="<?= e(url('academia/repaso')) ?>">Repasar mis comandos difíciles</a> ·
      <a class="ac-enlace" href="<?= e(url('academia/buscar')) ?>">Buscar un comando</a>
    </p>
  </section>

  <?= note('La terminal de esta academia es una simulación', '
    <p>Todo lo que escribas se interpreta en tu propio navegador contra un sistema de archivos
    inventado. No hay ninguna conexión con el servidor que ejecute comandos, ni acceso a tus
    archivos reales. Puedes borrar lo que quieras: el botón «Reiniciar escenario» lo devuelve todo
    a su sitio.</p>', 'info') ?>
</div>
