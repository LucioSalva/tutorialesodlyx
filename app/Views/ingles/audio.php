<?php
/** Audio: acento, velocidad y cómo funciona. */
require_once \App\Core\Config::basePath('app/Views/components/ingles-ui.php');
$voces = in_voces();
?>
<?= in_cabecera('Audio y voces', 'Todo el audio de la academia son archivos que se descargan desde este sitio: no necesitas instalar voces ni programas. Aquí eliges el acento y la velocidad.', in_migas(['Audio' => null])) ?>
<?= in_subnav('audio') ?>

<div class="container in-contenido">
  <section class="in-caja" aria-labelledby="t-voz">
    <h2 class="in-h2" id="t-voz">Acento y velocidad</h2>
    <form class="in-mazo__controles" data-voz-form>
      <label>Acento
        <select class="in-select" name="acento">
          <?php foreach ((array) ($voces['acentos'] ?? []) as $clave => $a): ?>
            <option value="<?= e($clave) ?>"><?= e($a['nombre'] ?? $clave) ?></option>
          <?php endforeach; ?>
        </select>
      </label>
      <label>Velocidad
        <select class="in-select" name="velocidad">
          <option value="0.75">0,75× (despacio)</option>
          <option value="0.9">0,9×</option>
          <option value="1">1× (natural)</option>
          <option value="1.25">1,25×</option>
        </select>
      </label>
    </form>
    <p class="in-nota-pie" data-voz-estado aria-live="polite"></p>
    <p class="in-etiqueta">Pruébalo</p>
    <ul class="in-pron">
      <?php foreach (['Hello! My name is Sam. I\'m from Chicago, and I\'m learning Spanish.', 'I thought about the world on Wednesday.', 'Three, thirteen, thirty.', 'Does your brother work at a hospital?'] as $frase): ?>
        <li class="in-pron__item"><div class="in-pron__cabeza"><span class="in-pron__texto" lang="en"><?= e($frase) ?></span><?= in_oir($frase) ?></div></li>
      <?php endforeach; ?>
    </ul>
    <p class="in-nota-pie">Tu elección se guarda en este navegador y se aplica a todo el curso: botones, lecturas, diálogos, tarjetas y juegos. «Lento» siempre reproduce a 0,75×.</p>
  </section>

  <section class="in-caja" aria-labelledby="t-como">
    <h2 class="in-h2" id="t-como">Cómo está hecho el audio</h2>
    <ul class="in-objetivos">
      <li><b>Archivos, no síntesis en tu equipo.</b> Cada palabra, frase, diálogo y lectura del curso tiene su archivo MP3, generado de antemano y alojado en este sitio. Funciona igual en cualquier navegador y dispositivo, sin voces instaladas.</li>
      <li><b>Voces neuronales.</b> Se generaron con <b>Kokoro-82M</b>, un modelo abierto de síntesis de voz (licencia Apache 2.0), con voces de inglés estadounidense y británico. Cada personaje de un diálogo tiene su voz.</li>
      <li><b>Es una voz sintética de buena calidad, no una grabación humana.</b> Se comprobó automáticamente que cada audio dice exactamente su texto (con un reconocedor de voz) y que la pronunciación de los sonidos difíciles es correcta, pero puede haber alguna entonación mejorable. Cuando una lección explica un detalle de pronunciación, el texto de la lección manda.</li>
      <li><b>Velocidad sin distorsión.</b> Cambiar la velocidad no cambia el tono de la voz.</li>
      <li><b>Lecturas y audios de escucha</b> tienen un reproductor con pausa, ±5 segundos, velocidad, acento y «Repetir frase». En las lecturas se resalta la frase que suena.</li>
      <li><b>Tu propio texto.</b> Lo que escribes tú (en escritura o en la práctica comunicativa) no puede tener un audio preparado: el botón «voz del navegador» lo lee con la voz que tenga tu sistema, si tiene alguna. Es opcional y no afecta al audio del curso.</li>
      <li><b>Micrófono.</b> «Grabarme» guarda tu voz solo en esta pestaña para compararla con el modelo; no se envía a ninguna parte.</li>
    </ul>
  </section>
</div>
<?= in_config(['vista' => 'audio']) ?>
