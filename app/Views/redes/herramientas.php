<?php
/**
 * Academia de Redes · herramientas de subneteo.
 * @var array $modulo
 */
require_once \App\Core\Config::basePath('app/Views/components/redes-ui.php');
$base = 'redes/' . $modulo['slug'];
$valores = [128 => 1, 192 => 2, 224 => 3, 240 => 4, 248 => 5, 252 => 6, 254 => 7, 255 => 8];
?>
<?= rd_cabecera('Herramientas de subneteo', 'Para comprobar tus cuentas o explorar: todo se calcula en tu navegador, sin enviar nada.',
    ['Biblioteca' => url('/'), 'Redes' => url('redes'), (string) $modulo['titulo'] => url($base), 'Herramientas' => null], $modulo['titulo'] . ' · Herramientas') ?>
<?= rd_subnav($modulo, 'herramientas') ?>

<div class="container rd-contenido">

  <section aria-labelledby="t-calc">
    <h2 class="rd-h2" id="t-calc">Calculadora visual</h2>
    <p class="rd-bajada">Escribe una dirección, mueve el prefijo o pulsa un bit para cambiarlo.</p>
    <div class="rd-regla rd-regla--completa" data-regla data-ip="172.16.45.200" data-prefijo="20" data-completa>
      <?= rd_bits([['et' => 'IP', 'ip' => '172.16.45.200', 'p' => 20], ['et' => 'Máscara', 'ip' => '255.255.240.0', 'p' => 20]]) ?>
    </div>
  </section>

  <section aria-labelledby="t-div">
    <h2 class="rd-h2" id="t-div">Divisor de redes</h2>
    <p class="rd-bajada">Parte una red en subredes del mismo tamaño y lista cada una.</p>
    <form class="rd-form" data-divisor>
      <label>Red base <input type="text" name="base" value="192.168.1.0/24" inputmode="text" autocomplete="off" spellcheck="false"></label>
      <label>Nuevo prefijo <input type="number" name="prefijo" value="27" min="1" max="32"></label>
      <button class="rd-btn rd-btn--primario" type="submit">Dividir</button>
    </form>
    <div data-divisor-salida aria-live="polite"></div>
  </section>

  <section aria-labelledby="t-vlsm">
    <h2 class="rd-h2" id="t-vlsm">Planificador VLSM</h2>
    <p class="rd-bajada">Una subred por línea, con el formato <code class="rd-c">Nombre: hosts</code>. Se asignan de mayor a menor.</p>
    <form class="rd-form rd-form--vlsm" data-vlsm>
      <label>Red base <input type="text" name="base" value="192.168.50.0/24" autocomplete="off" spellcheck="false"></label>
      <label>Subredes necesarias
        <textarea name="reqs" rows="6" spellcheck="false">Ventas: 60
Soporte: 28
Dirección: 12
Enlace WAN 1: 2
Enlace WAN 2: 2</textarea>
      </label>
      <button class="rd-btn rd-btn--primario" type="submit">Planificar</button>
    </form>
    <div data-vlsm-salida aria-live="polite"></div>
  </section>

  <section aria-labelledby="t-tabla">
    <h2 class="rd-h2" id="t-tabla">Tabla de prefijos</h2>
    <p class="rd-bajada">De /8 a /32: máscara, wildcard, tamaño del bloque y hosts asignables.</p>
    <div class="rd-tabla-caja">
      <table class="rd-tabla rd-tabla--num">
        <thead><tr><th scope="col">Prefijo</th><th scope="col">Máscara</th><th scope="col">Wildcard</th><th scope="col">Direcciones</th><th scope="col">Hosts asignables</th><th scope="col">Número mágico</th></tr></thead>
        <tbody>
        <?php for ($p = 8; $p <= 32; $p++):
            $mask = $p === 0 ? 0 : (0xFFFFFFFF << (32 - $p)) & 0xFFFFFFFF;
            $total = 2 ** (32 - $p);
            $hosts = $p >= 31 ? ($p === 31 ? 2 : 1) : $total - 2;
            $oct = [($mask >> 24) & 255, ($mask >> 16) & 255, ($mask >> 8) & 255, $mask & 255];
            $parcial = $p % 8 === 0 ? null : $oct[intdiv($p, 8)];
        ?>
          <tr<?= $p % 8 === 0 ? ' class="rd-tabla__marca"' : '' ?>>
            <th scope="row">/<?= $p ?></th>
            <td><?= long2ip($mask) ?></td>
            <td><?= long2ip(~$mask & 0xFFFFFFFF) ?></td>
            <td><?= number_format($total) ?></td>
            <td><?= number_format($hosts) ?><?= $p === 31 ? ' *' : '' ?></td>
            <td><?= $parcial === null ? '—' : (256 - $parcial) . ' (octeto ' . (intdiv($p, 8) + 1) . ')' ?></td>
          </tr>
        <?php endfor; ?>
        </tbody>
      </table>
    </div>
    <p class="rd-tabla-pie">* /31 solo se usa en enlaces punto a punto entre routers (RFC 3021): sus 2 direcciones se asignan y no hay broadcast. /32 identifica un único equipo.</p>

    <h3 class="rd-h3">Los nueve valores posibles de un octeto de máscara</h3>
    <div class="rd-tabla-caja">
      <table class="rd-tabla rd-tabla--num">
        <thead><tr><th scope="col">Bits en 1</th><th scope="col">Binario</th><th scope="col">Decimal</th><th scope="col">Número mágico (256 − valor)</th></tr></thead>
        <tbody>
          <tr><th scope="row">0</th><td>00000000</td><td>0</td><td>—</td></tr>
          <?php foreach ($valores as $v => $bits): ?>
            <tr><th scope="row"><?= $bits ?></th><td><?= str_pad(decbin($v), 8, '0', STR_PAD_LEFT) ?></td><td><?= $v ?></td><td><?= $v === 255 ? '—' : 256 - $v ?></td></tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </section>
</div>
<?= rd_config(['vista' => 'herramientas', 'modulo' => $modulo['slug']]) ?>
