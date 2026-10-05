<?php
/** Tarjetas de memorización. @var array $temas */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
$temaInicial = isset($_GET['tema']) && is_string($_GET['tema']) ? $_GET['tema'] : '';
$slugs = array_column($temas, 'slug');
if (!in_array($temaInicial, $slugs, true)) {
    $temaInicial = '';
}
?>
<?= in_cabecera('Tarjetas de memorización', 'Mira la tarjeta, intenta recordar (o escribe tu respuesta) y dale la vuelta. Después di con sinceridad si la recordaste: eso decide cuándo vuelve a salir en tu repaso.', in_migas(['Tarjetas' => null])) ?>
<?= in_subnav('tarjetas') ?>

<div class="container in-contenido">
  <section class="in-caja in-caja--fina">
    <form class="in-mazo__controles" data-mazo-form>
      <label>Tema
        <select class="in-select" name="tema" data-mazo-tema>
          <option value="">Todos los temas</option>
          <?php foreach ($temas as $t): ?>
            <option value="<?= e($t['slug']) ?>"<?= $temaInicial === $t['slug'] ? ' selected' : '' ?>><?= e(($t['icono'] ?? '') . ' ' . $t['nombre']) ?> (<?= (int) $t['total'] ?>)</option>
          <?php endforeach; ?>
        </select>
      </label>
      <label>Modalidad
        <select class="in-select" name="modo" data-mazo-modo>
          <option value="en-es">Inglés → español</option>
          <option value="es-en">Español → inglés</option>
          <option value="audio">Audio → palabra</option>
          <option value="imagen">Imagen → palabra</option>
          <option value="completar">Completar la oración</option>
        </select>
      </label>
      <label>Tarjetas
        <select class="in-select" name="cuantas" data-mazo-cuantas>
          <option value="10">10</option><option value="20" selected>20</option><option value="40">40</option>
        </select>
      </label>
      <button type="submit" class="in-btn in-btn--primario in-btn--fino">Empezar</button>
    </form>
  </section>

  <section class="in-mazo" data-mazo aria-live="polite">
    <p class="in-bajada">Elige un tema y una modalidad y pulsa «Empezar».</p>
  </section>

  <?= in_nota(['titulo' => 'Cómo usarlas bien', 'texto' => "Intenta recordar ANTES de girar la tarjeta; si solo la miras, parece que te la sabes y no es así.\n\nCada calificación alimenta tu repaso espaciado: «Otra vez» la trae de vuelta en unos minutos, «Fácil» la aleja varios días. Teclas: espacio para girar, 1–4 para calificar."]) ?>
</div>
<?= in_config(['vista' => 'tarjetas', 'tema' => $temaInicial]) ?>
