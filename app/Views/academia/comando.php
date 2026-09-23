<?php
/**
 * Ficha completa de un comando: el ciclo explicar → mostrar → señalar →
 * practicar → resolver → interpretar, aplicado a una sola orden.
 *
 * @var string $os @var array $meta @var array $comando
 * @var array|null $anterior @var array|null $siguiente @var array|null $escenario
 */
require_once \App\Core\Config::basePath('app/Views/components/academia-ui.php');

$slug     = (string) ($comando['slug'] ?? '');
$nombre   = (string) ($comando['nombre'] ?? $slug);
$concepto = ($comando['tipo'] ?? '') === 'concepto';
$simulado = !empty($comando['simulado']);
?>
<?= ac_cabecera(
    $nombre,
    (string) ($comando['resumen'] ?? ''),
    ['Academia' => url('academia'), $meta['nombre'] => url('academia/' . $os), $nombre => null],
    '<span class="ac-chip ac-chip--' . e($comando['dificultad'] ?? 'basico') . '">' . e(ucfirst((string) ($comando['dificultad'] ?? ''))) . '</span>'
    . ($concepto
        ? '<span class="ac-chip ac-chip--concepto">Técnica del shell</span>'
        : ($simulado
            ? '<span class="ac-chip ac-chip--sim">Practicable en el simulador</span>'
            : '<span class="ac-chip ac-chip--nosim">Ficha explicativa</span>'))
) ?>

<div class="container ac-contenido ac-ficha">

  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Qué hace</h2>
    <p class="ac-ficha__sencilla"><?= e($comando['explicacion_sencilla'] ?? '') ?></p>
    <p class="ac-ficha__tecnica"><?= e($comando['explicacion_tecnica'] ?? '') ?></p>
    <?php if (!empty($comando['analogia'])): ?>
      <p class="ac-analogia"><span class="ac-analogia__etiqueta">Analogía</span><?= e($comando['analogia']) ?></p>
    <?php endif; ?>
  </section>

  <?php if (!empty($comando['nota_simulador'])): ?>
    <?= note('Hasta dónde llega el simulador', '<p>' . e((string) $comando['nota_simulador']) . '</p>', 'info') ?>
  <?php endif; ?>

  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Sintaxis y anatomía</h2>
    <p class="ac-sintaxis"><code><?= e($comando['sintaxis'] ?? '') ?></code></p>
    <?php if (!empty($comando['argumentos'])): ?>
      <dl class="ac-anatomia">
        <?php foreach ($comando['argumentos'] as $arg): ?>
          <div><dt><?= e($arg['pieza'] ?? '') ?></dt><dd><?= e($arg['significa'] ?? '') ?></dd></div>
        <?php endforeach; ?>
      </dl>
    <?php endif; ?>
  </section>

  <?php if (!empty($comando['opciones'])): ?>
  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Opciones que se usan de verdad</h2>
    <div class="ac-tabla">
      <table>
        <caption class="visually-hidden">Opciones de <?= e($nombre) ?></caption>
        <thead><tr><th scope="col">Opción</th><th scope="col">Qué hace</th><th scope="col">Ejemplo</th></tr></thead>
        <tbody>
          <?php foreach ($comando['opciones'] as $op): ?>
            <tr>
              <td class="f"><code><?= e($op['opcion'] ?? '') ?></code></td>
              <td><?= e($op['significa'] ?? '') ?></td>
              <td><?php if (!empty($op['ejemplo'])): ?>
                <button type="button" class="ac-probar" data-probar="<?= e($op['ejemplo']) ?>"><?= e($op['ejemplo']) ?></button>
              <?php endif; ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </section>
  <?php endif; ?>

  <?php if (!empty($comando['ejemplos'])): ?>
  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Ejemplos, de lo simple a lo útil</h2>
    <?php foreach ($comando['ejemplos'] as $i => $ej): ?>
      <article class="ac-ejemplo">
        <h3 class="ac-ejemplo__titulo"><?= e($ej['titulo'] ?? ('Ejemplo ' . ($i + 1))) ?></h3>
        <div class="ac-ejemplo__comando">
          <code><?= e($ej['comando'] ?? '') ?></code>
          <?php if ($simulado): ?>
            <button type="button" class="ac-btn ac-btn--fino" data-probar="<?= e($ej['comando'] ?? '') ?>">Probar aquí</button>
          <?php endif; ?>
        </div>
        <p class="ac-ejemplo__explica"><?= e($ej['explicacion'] ?? '') ?></p>
        <?php if (!empty($ej['salida'])): ?>
          <div class="ac-salida">
            <span class="ac-salida__etiqueta"><?= e(($ej['salida_tipo'] ?? '') === 'ilustrativa' ? 'Salida ilustrativa' : 'Salida del simulador') ?></span>
            <pre><code><?= e($ej['salida']) ?></code></pre>
          </div>
        <?php endif; ?>
      </article>
    <?php endforeach; ?>
  </section>
  <?php endif; ?>

  <?php if (!empty($comando['interpretacion'])): ?>
  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Cómo se lee la salida</h2>
    <?php if (!empty($comando['visual']['linea'])): ?>
      <p class="ac-visual"><code><?= e($comando['visual']['linea']) ?></code></p>
    <?php endif; ?>
    <dl class="ac-interpretacion">
      <?php foreach ($comando['interpretacion'] as $it): ?>
        <div><dt><?= e($it['parte'] ?? '') ?></dt><dd><?= e($it['significa'] ?? '') ?></dd></div>
      <?php endforeach; ?>
    </dl>
    <?php if (!empty($comando['que_esperar'])): ?>
      <p class="ac-nota"><b>Qué deberías ver:</b> <?= e($comando['que_esperar']) ?></p>
    <?php endif; ?>
  </section>
  <?php endif; ?>

  <?php if ($simulado && $escenario): ?>
  <section class="ac-bloque ac-bloque--practica">
    <h2 class="ac-bloque__titulo">Practícalo ahora</h2>
    <p class="ac-bloque__bajada">Terminal simulada, escenario de mentira y ningún riesgo. Pulsa «Probar aquí» en cualquier ejemplo o escribe tú.</p>
    <?= ac_terminal_zona('data-practica-comando') ?>
  </section>
  <?php endif; ?>

  <?php if (!empty($comando['combinaciones'])): ?>
  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Combinarlo con otros comandos</h2>
    <ul class="ac-combinaciones">
      <?php foreach ($comando['combinaciones'] as $comb): ?>
        <li>
          <code><?= e($comb['comando'] ?? '') ?></code>
          <span><?= e($comb['explica'] ?? '') ?></span>
          <?php if ($simulado): ?>
            <button type="button" class="ac-probar" data-probar="<?= e($comb['comando'] ?? '') ?>">Probar</button>
          <?php endif; ?>
        </li>
      <?php endforeach; ?>
    </ul>
  </section>
  <?php endif; ?>

  <?php if (!empty($comando['errores'])): ?>
  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Errores frecuentes</h2>
    <ul class="ac-errores">
      <?php foreach ($comando['errores'] as $err): ?>
        <li class="ac-error-item">
          <b><?= e($err['error'] ?? '') ?></b>
          <span class="ac-error-item__porque"><?= e($err['porque'] ?? '') ?></span>
          <span class="ac-error-item__arreglo"><?= e($err['arreglo'] ?? '') ?></span>
        </li>
      <?php endforeach; ?>
    </ul>
  </section>
  <?php endif; ?>

  <?php if (!empty($comando['ejercicio'])): $ej = $comando['ejercicio']; ?>
  <section class="ac-bloque ac-bloque--ejercicio">
    <h2 class="ac-bloque__titulo">Ejercicio</h2>
    <p class="ac-ejercicio__enunciado"><?= e($ej['enunciado'] ?? '') ?></p>
    <?php foreach (($ej['pistas'] ?? []) as $i => $pista): ?>
      <details class="ac-pista">
        <summary>Pista <?= (int) ($i + 1) ?></summary>
        <p><?= e($pista) ?></p>
      </details>
    <?php endforeach; ?>
    <details class="ac-solucion">
      <summary>Ver solución razonada</summary>
      <pre><code><?= e($ej['solucion'] ?? '') ?></code></pre>
      <p><?= e($ej['explicacion'] ?? '') ?></p>
    </details>
    <?php if ($simulado): ?>
      <p class="ac-nota">Resuélvelo en la terminal de arriba: en cuanto el escenario cumpla el objetivo, se marca como resuelto.</p>
    <?php endif; ?>
  </section>
  <?php endif; ?>

  <section class="ac-bloque ac-bloque--cierre">
    <h2 class="ac-bloque__titulo">Resumen</h2>
    <p class="ac-resumen"><?= e($comando['resumen_final'] ?? '') ?></p>

    <?php if (!empty($comando['pregunta_repaso'])): ?>
      <form class="ac-repaso-form" data-repaso-comando autocomplete="off">
        <label for="ac-pregunta"><?= e($comando['pregunta_repaso']['pregunta'] ?? '') ?></label>
        <div class="ac-repaso-form__fila">
          <input id="ac-pregunta" type="text" class="ac-input" placeholder="Escribe el comando…" spellcheck="false" autocapitalize="off">
          <button type="submit" class="ac-btn ac-btn--primario">Comprobar</button>
        </div>
        <div class="ac-respuesta" data-resultado role="status" aria-live="polite"></div>
      </form>
    <?php endif; ?>

    <?php if (!empty($comando['equivalentes'])): ?>
      <div class="ac-equivalentes">
        <h3>En los otros sistemas</h3>
        <ul>
          <?php foreach ($comando['equivalentes'] as $sistema => $equiv): ?>
            <li><b><?= e(ucfirst((string) $sistema)) ?>:</b> <code><?= e((string) $equiv) ?></code></li>
          <?php endforeach; ?>
        </ul>
        <p class="ac-nota"><a class="ac-enlace" href="<?= e(url('academia/comparar')) ?>">Ver las diferencias reales de comportamiento →</a></p>
      </div>
    <?php endif; ?>

    <?php if (!empty($comando['relacionados'])): ?>
      <p class="ac-relacionados"><b>Comandos relacionados:</b>
        <?php foreach ($comando['relacionados'] as $rel): ?>
          <a class="ac-enlace" href="<?= e(url('academia/' . $os . '/comando/' . strtolower((string) $rel))) ?>"><?= e($rel) ?></a>
        <?php endforeach; ?>
      </p>
    <?php endif; ?>
  </section>

  <nav class="ac-paginacion" aria-label="Navegación entre comandos">
    <?php if ($anterior): ?>
      <a class="ac-paginacion__prev" href="<?= e(url('academia/' . $os . '/comando/' . ($anterior['slug'] ?? ''))) ?>">← <?= e($anterior['nombre'] ?? '') ?></a>
    <?php endif; ?>
    <?php if ($siguiente): ?>
      <a class="ac-paginacion__next" href="<?= e(url('academia/' . $os . '/comando/' . ($siguiente['slug'] ?? ''))) ?>"><?= e($siguiente['nombre'] ?? '') ?> →</a>
    <?php endif; ?>
  </nav>
</div>

<?= ac_config([
    'vista'     => 'comando',
    'os'        => $os,
    'comando'   => $comando,
    'escenario' => $escenario,
]) ?>
