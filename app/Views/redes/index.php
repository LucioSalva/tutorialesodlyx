<?php
/**
 * Academia de Redes · portada.
 * @var array $modulos @var array|null $cert
 */
require_once \App\Core\Config::basePath('app/Views/components/redes-ui.php');
?>
<header class="rd-hero">
  <div class="container">
    <nav aria-label="Ruta de navegación"><ol class="rd-migas"><li><a href="<?= e(url('/')) ?>">Biblioteca</a></li><li><span aria-current="page">Academia de Redes</span></li></ol></nav>
    <p class="rd-ante">Tutoriales Lucio · Academia de Redes</p>
    <h1 class="rd-hero__titulo">Una dirección IP son 32 bits. <em>Mueve la frontera</em> y mira qué cambia.</h1>
    <p class="rd-hero__lead">
      Subnetear es decidir cuántos de esos bits nombran a la red y cuántos quedan para los equipos.
      Arrastra el prefijo o pulsa cualquier bit: la red, el broadcast y el número de hosts se recalculan al momento.
    </p>

    <div class="rd-regla" data-regla data-ip="192.168.10.77" data-prefijo="26">
      <?= rd_bits([['et' => 'IP', 'ip' => '192.168.10.77', 'p' => 26], ['et' => 'Máscara', 'ip' => '255.255.255.192', 'p' => 26]]) ?>
      <dl class="rd-regla__datos">
        <div><dt>Red</dt><dd>192.168.10.64/26</dd></div>
        <div><dt>Rango asignable</dt><dd>192.168.10.65 – 192.168.10.126</dd></div>
        <div><dt>Broadcast</dt><dd>192.168.10.127</dd></div>
        <div><dt>Hosts</dt><dd>62</dd></div>
      </dl>
    </div>

    <div class="rd-acciones">
      <a class="rd-btn rd-btn--primario" href="<?= e(url('redes/subneteo')) ?>" data-continuar>Empezar con subneteo</a>
      <a class="rd-btn" href="<?= e(url('redes/subneteo/practica')) ?>">Ir directo a practicar</a>
    </div>
  </div>
</header>

<div class="container rd-contenido">

  <?php if (!empty($cert)): ?>
  <section class="rd-cert-banda" aria-labelledby="t-cert">
    <div>
      <h2 id="t-cert">Prepárate para la certificación <?= e($cert['corto']) ?></h2>
      <p><?= e($cert['resumen']) ?></p>
    </div>
    <div class="rd-acciones">
      <a class="rd-btn rd-btn--primario" href="<?= e(url('redes/certificacion')) ?>">Ver la guía del examen</a>
      <a class="rd-btn" href="<?= e(url('redes/certificacion/simulador')) ?>">Hacer un simulacro</a>
    </div>
  </section>
  <?php endif; ?>

  <section aria-labelledby="t-modulos">
    <h2 class="rd-h2" id="t-modulos">Módulos</h2>
    <p class="rd-bajada">Cada módulo va de lo más básico a problemas de diseño completos. Se estudian en este orden.</p>
    <div class="rd-modulos">
      <?php foreach ($modulos as $m):
          $listo = ($m['estado'] ?? '') === 'disponible';
          $n = count($m['lecciones'] ?? []);
          $ej = array_sum(array_map(static fn ($l) => (int) ($l['ejercicios'] ?? 0), $m['lecciones'] ?? []));
      ?>
        <article class="rd-modulo rd-modulo--<?= e($m['slug']) ?><?= $listo ? '' : ' rd-modulo--pronto' ?>" data-modulo="<?= e($m['slug']) ?>">
          <p class="rd-modulo__capa"><?= e($m['capa'] ?? '') ?></p>
          <h3 class="rd-modulo__titulo">
            <?php if ($listo): ?><a href="<?= e(url('redes/' . $m['slug'])) ?>"><?= e($m['titulo']) ?></a><?php else: ?><?= e($m['titulo']) ?><?php endif; ?>
          </h3>
          <p class="rd-modulo__resumen"><?= e($m['resumen']) ?></p>
          <?php if ($listo): ?>
            <ul class="rd-modulo__cifras">
              <li><b><?= $n ?></b> lecciones</li>
              <li><b><?= $ej ?></b> ejercicios guiados</li>
              <li><b><?= count($m['niveles'] ?? []) ?></b> niveles de práctica ilimitada</li>
            </ul>
            <p class="rd-modulo__avance" data-avance hidden></p>
          <?php else: ?>
            <p class="rd-modulo__estado">En preparación</p>
          <?php endif; ?>
        </article>
      <?php endforeach; ?>
    </div>
  </section>

  <section aria-labelledby="t-metodo">
    <h2 class="rd-h2" id="t-metodo">Cómo se estudia</h2>
    <div class="rd-metodo">
      <div><h3>Primero, el porqué</h3><p>Cada lección explica el concepto en español claro y lo muestra sobre los 32 bits, con los de red, subred y host siempre del mismo color.</p></div>
      <div><h3>Después, ejemplos resueltos</h3><p>De fácil a experto, paso a paso y con todas las cuentas a la vista. Ninguna respuesta aparece «porque sí».</p></div>
      <div><h3>Luego, tus ejercicios</h3><p>Se corrigen campo por campo. Si te atoras hay tres pistas, y la solución completa se abre cuando la pidas.</p></div>
      <div><h3>Y práctica sin fin</h3><p>Los ejercicios de práctica se generan al momento: nunca se acaban ni se repiten, y cada nivel sube la dificultad.</p></div>
    </div>
  </section>

</div>
<?= rd_config(['vista' => 'inicio', 'modulos' => array_map(static fn ($m) => ['slug' => $m['slug'], 'lecciones' => array_map(static fn ($l) => ['slug' => $l['slug'], 'ejercicios' => $l['ejercicios'] ?? 0, 'titulo' => $l['titulo']], $m['lecciones'] ?? [])], $modulos)]) ?>
