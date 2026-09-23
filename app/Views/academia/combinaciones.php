<?php
/**
 * Laboratorio de combinaciones: tuberías, filtros y redirecciones.
 * @var string $os @var array $meta @var array $misiones @var array $escenarios
 */
require_once \App\Core\Config::basePath('app/Views/components/academia-ui.php');
$comandos = \App\Models\AcademiaRepository::comandos($os);

$piezas = [
    'linux' => [
        ['ls -la | grep ".txt"', 'Lista todo y deja solo las líneas con .txt. Filtra TEXTO de la línea, no nombres de archivo: por eso también saldría «notas.txt.bak».'],
        ['grep ERROR /var/log/sistema.log | wc -l', 'Cuenta cuántas líneas contienen ERROR: grep filtra y wc -l cuenta.'],
        ['cut -d, -f1 lista.csv | sort | uniq', 'Extrae la primera columna, la ordena y quita repetidos. uniq solo colapsa repeticiones CONSECUTIVAS, por eso va detrás de sort.'],
        ['ps aux | grep python', 'Busca procesos de python. Recuerda que el propio grep aparece a veces en la lista.'],
    ],
    'cmd' => [
        ['dir /b | findstr ".txt"', 'dir /b da solo nombres y findstr filtra los que contienen .txt.'],
        ['tasklist | findstr chrome', 'Lista procesos y se queda con los de chrome.'],
        ['type lista.csv | sort', 'Vuelca el archivo y lo ordena alfabéticamente.'],
        ['ipconfig | findstr IPv4', 'Saca solo las líneas de direcciones IPv4.'],
    ],
    'powershell' => [
        ['Get-Process | Sort-Object CPU -Descending', 'Ordena OBJETOS por la propiedad CPU: no hay que recortar columnas de texto.'],
        ['Get-Process | Where-Object CPU -gt 10 | Select-Object Name,CPU', 'Filtra por propiedad y elige qué columnas mostrar.'],
        ['Get-ChildItem | Measure-Object Length -Sum', 'Suma el tamaño de los archivos usando su propiedad Length.'],
        ['Get-Service | Where-Object Status -eq "Running"', 'Filtra servicios por estado, comparando propiedades y no cadenas sueltas.'],
    ],
];
$ejemplos = $piezas[$os] ?? [];
?>
<?= ac_cabecera(
    'Laboratorio de combinaciones · ' . (string) $meta['nombre'],
    'Un comando resuelve una cosa. Encadenados resuelven un problema.',
    ['Academia' => url('academia'), $meta['nombre'] => url('academia/' . $os), 'Combinaciones' => null]
) ?>

<div class="container ac-contenido">
  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Cómo viaja la información</h2>
    <?php if ($os === 'powershell'): ?>
      <p>En PowerShell la tubería no lleva texto: lleva <b>objetos</b> con propiedades. Por eso
      <code>Where-Object CPU -gt 10</code> puede comparar un número sin recortar columnas, algo que en
      Bash o CMD exigiría <code>awk</code>, <code>cut</code> o <code>findstr</code>.</p>
    <?php else: ?>
      <p>La tubería <code>|</code> conecta la salida de un comando con la entrada del siguiente. Lo que
      viaja es <b>texto, línea a línea</b>: cada comando de la cadena solo ve caracteres, no archivos ni
      objetos. Esa es la diferencia esencial con el pipeline de PowerShell.</p>
    <?php endif; ?>
    <div class="ac-flujo" aria-hidden="true">
      <span class="ac-flujo__paso">comando 1</span><span class="ac-flujo__tubo">│</span>
      <span class="ac-flujo__paso">comando 2</span><span class="ac-flujo__tubo">│</span>
      <span class="ac-flujo__paso">comando 3</span><span class="ac-flujo__tubo">&gt;</span>
      <span class="ac-flujo__paso ac-flujo__paso--archivo">archivo</span>
    </div>
  </section>

  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Combinaciones para leer y probar</h2>
    <ul class="ac-combinaciones">
      <?php foreach ($ejemplos as [$cmd, $explica]): ?>
        <li>
          <code><?= e($cmd) ?></code>
          <span><?= e($explica) ?></span>
          <button type="button" class="ac-probar" data-insertar="<?= e($cmd) ?>">Escribir en la terminal</button>
        </li>
      <?php endforeach; ?>
    </ul>
    <?= ac_terminal_zona('data-practica-libre') ?>
  </section>

  <?php if ($misiones !== []): ?>
  <section class="ac-bloque">
    <h2 class="ac-bloque__titulo">Misiones de combinación</h2>
    <ol class="ac-misiones">
      <?php foreach ($misiones as $m): ?>
        <li class="ac-mision-item" data-mision-id="<?= e($m['id'] ?? '') ?>">
          <a href="<?= e(url('academia/' . $os . '/misiones') . '?mision=' . urlencode((string) ($m['id'] ?? ''))) ?>">
            <b><?= e($m['titulo'] ?? '') ?></b>
            <span class="ac-mision-item__obj"><?= e($m['objetivo'] ?? '') ?></span>
          </a>
        </li>
      <?php endforeach; ?>
    </ol>
  </section>
  <?php endif; ?>
</div>

<?= ac_config([
    'vista'      => 'combinaciones',
    'os'         => $os,
    'escenarios' => $escenarios,
    'fichas'     => $comandos,
]) ?>
