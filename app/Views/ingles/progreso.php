<?php
/** Panel de progreso. @var array $unidades @var array $bloques @var array $estadisticas */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
$publicadas = array_values(array_filter($unidades, static fn ($u) => $u['disponible']));
?>
<?= in_cabecera('Mi progreso', 'Todo lo que aparece aquí sale de lo que has hecho en este navegador: nada se estima ni se inventa.', in_migas(['Progreso' => null])) ?>
<?= in_subnav('progreso') ?>

<div class="container in-contenido">
  <section aria-labelledby="t-resumen">
    <h2 class="in-h2" id="t-resumen">Resumen</h2>
    <ul class="in-panel" data-panel>
      <li><b data-v="leccionesCompletadas">0</b><span>lecciones completadas</span><small>de <?= (int) $estadisticas['lecciones'] ?> publicadas · <span data-v="leccionesVistas">0</span> abiertas</small></li>
      <li><b data-v="ejerciciosResueltos">0</b><span>ejercicios resueltos</span><small><span data-v="ejerciciosPrimera">0</span> a la primera · <span data-v="ejerciciosConSolucion">0</span> vistos con solución</small></li>
      <li><b data-v="palabrasAprendidas">0</b><span>palabras aprendidas</span><small><span data-v="palabrasDominadas">0</span> dominadas · <span data-v="palabrasEnRepaso">0</span> en repaso</small></li>
      <li><b data-v="repasosPendientes">0</b><span>repasos pendientes</span><small><span data-v="gramaticaEnRepaso">0</span> tarjetas de gramática en el mazo</small></li>
      <li><b data-v="evaluaciones">0</b><span>evaluaciones hechas</span><small><span data-v="evaluacionesAprobadas">0</span> aprobadas</small></li>
      <li><b data-v="nivelesSuperados">0</b><span>niveles de juego superados</span><small>de <?= (int) $estadisticas['niveles'] ?></small></li>
      <li><b data-v="practicas">0</b><span>prácticas completadas</span><small>lecturas, audios, conversaciones y escritura</small></li>
      <li><b data-v="tiempo">0 min</b><span>tiempo de estudio</span><small>hoy: <span data-v="tiempoHoy">0 min</span> · <span data-v="diasEstudiados">0</span> días</small></li>
    </ul>
    <p class="in-nota-pie">El tiempo solo cuenta mientras la pestaña está visible y has interactuado en el último minuto y medio.</p>
  </section>

  <section class="in-caja" aria-labelledby="t-act">
    <h2 class="in-h3" id="t-act">Minutos de estudio · últimos 28 días</h2>
    <div class="in-actividad" data-actividad role="img" aria-label="Gráfico de minutos de estudio por día"></div>
    <p class="in-nota-pie" data-actividad-texto></p>
  </section>

  <section class="in-caja" aria-labelledby="t-unidades">
    <h2 class="in-h3" id="t-unidades">Por unidad</h2>
    <div class="in-tabla">
      <table class="in-tabla-progreso">
        <thead><tr><th scope="col">Unidad</th><th scope="col">Lecciones</th><th scope="col">Ejercicios</th><th scope="col">Evaluación</th></tr></thead>
        <tbody>
          <?php foreach ($publicadas as $u): ?>
            <tr data-fila-unidad="<?= e($u['slug']) ?>" data-lecciones="<?= e(implode(',', array_column($u['lecciones'], 'slug'))) ?>" data-total-ej="<?= (int) ($u['cifras']['ejercicios'] ?? 0) ?>">
              <td><a class="in-enlace" href="<?= e(url('ingles/unidad/' . $u['slug'])) ?>"><?= (int) $u['numero'] ?>. <?= e($u['titulo']) ?></a></td>
              <td data-c="lecciones">0/<?= count($u['lecciones']) ?></td>
              <td data-c="ejercicios">0/<?= (int) ($u['cifras']['ejercicios'] ?? 0) ?></td>
              <td data-c="eval">—</td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <p class="in-nota-pie">Exámenes de bloque:
      <?php foreach ($bloques as $i => $b): ?><?= $i ? ' · ' : '' ?><span data-examen="<?= e($b['examen']) ?>">B<?= (int) $b['numero'] ?>: <span>—</span></span><?php endforeach; ?>
    </p>
  </section>

  <section class="in-caja" aria-labelledby="t-datos">
    <h2 class="in-h3" id="t-datos">Tus datos</h2>
    <p>El progreso se guarda solo en este navegador (no hay cuentas ni se envía a ningún servidor). Si cambias de equipo o de navegador, expórtalo e impórtalo allí.</p>
    <div class="in-progreso__acciones">
      <button type="button" class="in-btn in-btn--fino" data-exportar>Exportar progreso</button>
      <label class="in-btn in-btn--fino in-archivo">Importar progreso
        <input type="file" accept="application/json,.json" data-importar hidden>
      </label>
      <button type="button" class="in-btn in-btn--fino in-btn--peligro" data-borrar>Borrar mi progreso</button>
    </div>
    <p class="in-nota-pie" data-datos-estado role="status" aria-live="polite"></p>
  </section>
</div>
<?= in_config(['vista' => 'progreso']) ?>
