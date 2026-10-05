<?php
/**
 * Academia de Inglés · portada y ruta académica.
 * @var array $curso @var array $bloques @var array $estadisticas @var array $juegos @var array $temas
 */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
$s = $estadisticas;
?>
<header class="in-hero">
  <div class="container">
    <nav aria-label="Ruta de navegación"><ol class="in-migas"><li><a href="<?= e(url('/')) ?>">Biblioteca</a></li><li><span aria-current="page">Academia de Inglés</span></li></ol></nav>
    <div class="in-hero__rejilla">
      <div>
        <p class="in-cabecera__ante">Tutoriales Lucio · Academia de Inglés</p>
        <h1 class="in-hero__titulo">Aprende inglés viendo cómo se <em>construye</em>.</h1>
        <p class="in-hero__lead">
          Un curso original desde cero. Cada frase se desmonta pieza a pieza, se escucha, se practica y
          se corrige con explicaciones. Gramática, vocabulario, pronunciación, escucha, lectura,
          escritura y conversación, con repaso espaciado para que no se olvide.
        </p>
        <div class="in-hero__acciones">
          <a class="in-btn in-btn--primario" href="<?= e(url('ingles/leccion/como-suena-el-ingles')) ?>" data-continuar>Empezar por la lección 1</a>
          <a class="in-btn" href="#ruta">Ver la ruta completa</a>
        </div>
      </div>
      <figure class="in-hero__tira" aria-label="Ejemplo de tira de oración">
        <?= in_tira([['t' => 'Does', 'rol' => 'auxiliar'], ['t' => 'your brother', 'rol' => 'sujeto'], ['t' => 'work', 'rol' => 'verbo'], ['t' => 'at a hospital', 'rol' => 'complemento']], true, 'in-tira--grande') ?>
        <figcaption>
          <?= in_oir('Does your brother work at a hospital?') ?>
          <span class="in-es">¿Tu hermano trabaja en un hospital?</span>
          <span class="in-hero__explica">El auxiliar <b>does</b> se lleva la -s: por eso el verbo vuelve a <b lang="en">work</b>.
          Así se señala cada frase del curso: un color por función.</span>
        </figcaption>
      </figure>
    </div>
  </div>
</header>

<?= in_subnav('') ?>

<div class="container in-contenido">

  <section class="in-panel-inicio" aria-label="Tu avance" data-panel-inicio>
    <div class="in-panel-inicio__continuar" data-continuar-caja hidden>
      <p class="in-etiqueta">Continuar donde lo dejaste</p>
      <a class="in-panel-inicio__enlace" data-continuar-enlace href="#"></a>
    </div>
    <ul class="in-cifras-mini">
      <li><b data-p="lecciones">0</b><span>lecciones estudiadas</span></li>
      <li><b data-p="ejercicios">0</b><span>ejercicios resueltos</span></li>
      <li><b data-p="palabras">0</b><span>palabras aprendidas</span></li>
      <li><b data-p="repasos">0</b><span>repasos pendientes hoy</span></li>
    </ul>
    <a class="in-enlace" href="<?= e(url('ingles/progreso')) ?>">Ver todo mi progreso →</a>
  </section>

  <section class="in-bloque-info" aria-labelledby="t-metodo">
    <h2 class="in-h2" id="t-metodo">Cómo se estudia cada lección</h2>
    <ol class="in-ciclo">
      <li><b>Explicar</b><span>Qué es, para qué sirve y cómo funciona, en español claro.</span></li>
      <li><b>Mostrar</b><span>La fórmula de la estructura y cómo suena.</span></li>
      <li><b>Señalar</b><span>Ejemplos anotados: dónde mirar en cada frase.</span></li>
      <li><b>Practicar</b><span>Ejercicios de once tipos, de fácil a difícil.</span></li>
      <li><b>Resolver</b><span>Tres pistas progresivas y la solución razonada.</span></li>
      <li><b>Interpretar</b><span>Errores frecuentes y práctica en una conversación real.</span></li>
    </ol>
  </section>

  <section id="ruta" class="in-ruta" aria-labelledby="t-ruta">
    <h2 class="in-h2" id="t-ruta">Ruta académica</h2>
    <p class="in-bajada">
      <?= (int) $s['unidades'] ?> de <?= (int) $s['unidades_total'] ?> unidades publicadas.
      <?= e($curso['referencia_nivel'] ?? '') ?>
    </p>

    <?php foreach ($bloques as $b): ?>
      <section class="in-bloque" id="bloque-<?= e($b['slug']) ?>" aria-labelledby="t-bloque-<?= e($b['slug']) ?>">
        <header class="in-bloque__cab">
          <p class="in-bloque__num">Bloque <?= (int) $b['numero'] ?> · <?= e($b['nivel']) ?></p>
          <h3 class="in-bloque__titulo" id="t-bloque-<?= e($b['slug']) ?>"><?= e($b['titulo']) ?></h3>
          <p class="in-bloque__resumen"><?= e($b['resumen']) ?></p>
        </header>
        <ol class="in-unidades">
          <?php foreach ($b['unidades_meta'] as $u): ?>
            <?= in_tarjeta_unidad($u) ?>
          <?php endforeach; ?>
        </ol>
        <?php if (!empty($b['examen_disponible'])): ?>
          <p class="in-bloque__examen">
            <a class="in-btn in-btn--fino" href="<?= e(url('ingles/examen/' . $b['examen'])) ?>">Examen del bloque <?= (int) $b['numero'] ?></a>
            <span class="in-bloque__examen-estado" data-examen-estado="<?= e($b['examen']) ?>"></span>
          </p>
        <?php endif; ?>
      </section>
    <?php endforeach; ?>
  </section>

  <section class="in-recursos" aria-labelledby="t-recursos">
    <h2 class="in-h2" id="t-recursos">Practica fuera de las lecciones</h2>
    <ul class="in-recursos__lista">
      <li><a href="<?= e(url('ingles/vocabulario')) ?>"><b>Vocabulario</b><span><?= (int) $s['palabras'] ?> palabras en <?= count($temas) ?> temas, con audio, ejemplos y pronunciación.</span></a></li>
      <li><a href="<?= e(url('ingles/tarjetas')) ?>"><b>Tarjetas</b><span>Cinco modalidades: inglés → español, español → inglés, audio, imagen y completar.</span></a></li>
      <li><a href="<?= e(url('ingles/repaso')) ?>"><b>Repaso espaciado</b><span>Vocabulario y gramática: lo difícil vuelve antes, lo fácil se espacia.</span></a></li>
      <li><a href="<?= e(url('ingles/pronunciacion')) ?>"><b>Pronunciación</b><span>Sonidos, AFI, acento, ritmo y entonación, con práctica de escuchar y repetir.</span></a></li>
      <li><a href="<?= e(url('ingles/practica')) ?>"><b>Práctica de habilidades</b><span><?= (int) $s['lecturas'] ?> lecturas, <?= (int) $s['audios'] ?> audios, <?= (int) $s['conversaciones'] ?> conversaciones y <?= (int) $s['escritura'] ?> tareas de escritura.</span></a></li>
      <li><a href="<?= e(url('ingles/juegos')) ?>"><b>Juegos</b><span><?= (int) $s['juegos'] ?> juegos con <?= (int) $s['niveles'] ?> niveles, pistas y soluciones.</span></a></li>
    </ul>
  </section>

  <section class="in-cifras" aria-labelledby="t-cifras">
    <h2 class="in-h2" id="t-cifras">Qué hay dentro ahora mismo</h2>
    <ul class="in-cifras__lista">
      <li><b><?= (int) $s['lecciones'] ?></b><span>lecciones completas</span></li>
      <li><b><?= (int) $s['ejercicios'] ?></b><span>ejercicios con solución razonada</span></li>
      <li><b><?= (int) $s['preguntas'] ?></b><span>preguntas de evaluación de unidad</span></li>
      <li><b><?= (int) $s['examenes'] ?></b><span>exámenes acumulativos</span></li>
      <li><b><?= (int) $s['palabras'] ?></b><span>palabras de vocabulario</span></li>
    </ul>
    <p class="in-nota-pie">Las cifras se calculan a partir del contenido publicado; nada se cuenta dos veces ni se estima.</p>
  </section>
</div>

<?= in_config(['vista' => 'inicio']) ?>
