<?php
/** Repaso espaciado. @var array $fichas */
require_once \App\Core\Config::basePath('app/Views/components/academia-ui.php');
?>
<?= ac_cabecera(
    'Repasar mis comandos',
    'Repetición espaciada: lo que fallas vuelve pronto y lo que dominas se espacia. Se escribe el comando, no se elige de una lista.',
    ['Academia' => url('academia'), 'Repaso' => null]
) ?>

<div class="container ac-contenido">
  <?= ac_panel_progreso(false) ?>

  <section class="ac-bloque" data-repaso>
    <div class="ac-repaso__cabecera">
      <h2 class="ac-bloque__titulo">Tanda de hoy</h2>
      <span class="ac-repaso__marcador" data-marcador></span>
    </div>
    <div class="ac-repaso__tarjeta" data-tarjeta></div>

    <h3 class="ac-subtitulo">Mis comandos difíciles</h3>
    <ul class="ac-dificiles" data-dificiles>
      <li class="ac-vacio">Cargando…</li>
    </ul>
  </section>

  <?= note('Cómo se decide qué repasar', '
    <p>Cada comando guarda cuántas veces lo acertaste y cuántas lo fallaste. Al acertar, el siguiente
    repaso se aleja (1 día, 3, 7, 16, 35, 90). Al fallar, vuelve al día siguiente. Es el mismo principio
    que usan las tarjetas de memoria, aplicado a la línea de comandos.</p>', 'info') ?>
</div>

<?= ac_config(['vista' => 'repaso', 'fichas' => $fichas]) ?>
