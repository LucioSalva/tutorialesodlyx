<?php
/**
 * Tutorial: SSH — de la primera conexión al despliegue profesional
 * ---------------------------------------------------------------------
 * v1.4.0 — primera versión publicada del curso de SSH en la biblioteca.
 * Diez partes y 88 secciones: fundamentos, trabajo en el servidor,
 * llaves, el cliente a fondo, archivos, servidor y seguridad, túneles y
 * Git, despliegues, diagnóstico y referencia. Veinte ejercicios.
 *
 * Escrito desde la primera línea siguiendo docs/TUTORIAL_STANDARD.md:
 * explicar → mostrar → señalar → practicar → resolver → interpretar.
 *
 * Rigor técnico
 *   · Las opciones se contrastaron con la documentación local de OpenSSH
 *     10.5p1 (man ssh, ssh_config, sshd_config, ssh-keygen, ssh-add) y con
 *     la versión 10.0p2 del laboratorio.
 *   · Todo lo rotulado «salida real» / «Captura real de laboratorio» salió
 *     de un laboratorio de cuatro contenedores propios (laptop, servidor,
 *     bastion e interno) en redes Docker privadas: 192.168.56.0/24 y una
 *     red interna 10.10.0.0/24 sin salida. Texto literal: solo se recorta,
 *     y cuando se omiten líneas en medio se indica con «[… N líneas …]».
 *   · El usuario del laboratorio se llama «alumno» de verdad; las
 *     contraseñas y passphrases del laboratorio nunca aparecen porque la
 *     terminal no las muestra. Ninguna llave privada aparece en el curso.
 *   · Los diagramas rotulados «Ejemplo ilustrativo» explican conceptos y lo
 *     dicen en la propia figura.
 *   · No se tocó el sshd del equipo anfitrión, ni su firewall, ni las
 *     claves personales de nadie. El laboratorio se destruyó al terminar.
 *
 * Privacidad: sin credenciales, sin IP públicas, sin dominios reales. Las
 * direcciones de ejemplo son privadas (RFC 1918) o de documentación
 * (RFC 5737: 192.0.2.0/24) y los dominios son .ejemplo, .lab o .invalid.
 *
 * Enfoque de seguridad: administración legítima, infraestructura propia o
 * autorizada, Blue Team y hardening. No se enseña acceso no autorizado,
 * robo de llaves, cracking, evasión, persistencia ni pivoting ofensivo.
 */
require_once \App\Core\Config::basePath('app/Views/components/icons.php');
require_once \App\Core\Config::basePath('app/Views/components/blocks.php');

if (!function_exists('ssh_term')) {
    /**
     * Terminal a partir de texto LITERAL (normalmente un nowdoc copiado de
     * la transcripción del laboratorio). Todo se escapa aquí: el autor pega
     * la salida tal cual, con sus <, > y &, sin marcarla a mano.
     *
     * Los prompts conocidos se envuelven en <span class="p">, así que el
     * botón Copiar los descarta; una línea que empieza por «# » se pinta
     * como comentario.
     */
    function ssh_term(string $texto, string $etiqueta = 'bash'): string
    {
        static $prompts = [
            'alumno@laptop:~/proyecto$ ', 'alumno@laptop:~/web$ ', 'alumno@laptop:~$ ',
            'alumno@servidor:~/public_html$ ', 'alumno@servidor:~$ ', 'alumno@bastion:~$ ',
            'root@servidor:~# ', 'root@bastion:~# ', 'sftp> ', '$ ',
        ];

        $filas = [];
        foreach (explode("\n", rtrim($texto, "\n")) as $linea) {
            foreach ($prompts as $p) {
                if (str_starts_with($linea, $p)) {
                    $filas[] = '<span class="p">' . e(rtrim($p)) . '</span> ' . e(substr($linea, strlen($p)));
                    continue 2;
                }
            }
            $filas[] = str_starts_with(ltrim($linea), '# ')
                ? '<span class="c">' . e($linea) . '</span>'
                : e($linea);
        }

        return term(implode("\n", $filas), $etiqueta);
    }
}

if (!function_exists('ssh_tree')) {
    /**
     * Árbol de directorios o fichero de configuración para LEER, no para
     * pegar: misma tipografía que una terminal, sin botón de copiar.
     */
    function ssh_tree(string $texto, string $etiqueta = 'árbol'): string
    {
        return '<div class="term term--plain">'
             . '<div class="term__bar"><span class="term__label">' . e($etiqueta) . '</span></div>'
             . '<pre><code>' . e(rtrim($texto, "\n")) . '</code></pre>'
             . '</div>';
    }
}

if (!function_exists('ssh_parte')) {
    /** Separador de parte: reutiliza chapter() tal cual. */
    function ssh_parte(string $numero, string $titulo, string $bajada, string $nivel): string
    {
        return chapter($numero, $titulo, $bajada, $nivel);
    }
}

if (!function_exists('ssh_ejercicio')) {
    /**
     * Ejercicio con el formato fijo del curso de SSH:
     * Misión · Escenario · Preparación · Paso 1 · Paso 2… · Qué debes
     * observar · Captura/diagrama · Preguntas · Pista 1 · Pista 2 ·
     * Solución · Por qué · Error común · Qué aprendiste.
     *
     * Las pistas usan hints() y la solución el mismo <details> que
     * solution(): funcionan sin JavaScript y no enseñan nada hasta que se
     * abren. Todo el HTML es de autor.
     *
     * @param array{num:string,titulo:string,nivel:string,objetivo:string,
     *   mision:string,escenario:string,preparacion:string,pasos:list<string>,
     *   observar:string,visual?:string,preguntas:list<string>,pistas:list<string>,
     *   solucion:string,porque:string,error:string,aprendiste:string} $e
     */
    function ssh_ejercicio(array $e): string
    {
        $pasos = '';
        foreach ($e['pasos'] as $i => $paso) {
            $pasos .= '<div class="ssh-ej__paso"><span class="ssh-ej__k">Paso ' . ($i + 1) . '</span>'
                    . '<div class="ssh-ej__v">' . $paso . '</div></div>';
        }

        $preguntas = '';
        foreach ($e['preguntas'] as $p) {
            $preguntas .= '<li>' . $p . '</li>';
        }

        $visual = ($e['visual'] ?? '') !== ''
            ? '<span class="ssh-ej__k">Captura / diagrama</span>' . $e['visual']
            : '';

        return '<div class="lab ssh-ej" id="ej' . e($e['num']) . '">'
             . lab_head($e['num'], $e['titulo'], $e['nivel'], $e['objetivo'])
             . '<dl class="ssh-ej__ficha">'
             . '<div><dt>Misión</dt><dd>' . $e['mision'] . '</dd></div>'
             . '<div><dt>Escenario</dt><dd>' . $e['escenario'] . '</dd></div>'
             . '<div><dt>Preparación</dt><dd>' . $e['preparacion'] . '</dd></div>'
             . '</dl>'
             . $pasos
             . '<span class="ssh-ej__k">Qué debes observar</span><div class="ssh-ej__v">' . $e['observar'] . '</div>'
             . $visual
             . '<span class="ssh-ej__k">Preguntas</span><ol class="ssh-ej__preg">' . $preguntas . '</ol>'
             . hints($e['pistas'])
             . '<details class="reveal reveal--sol"><summary>Ver solución razonada</summary><div class="reveal__body">'
             . '<p class="sol__answer">' . $e['solucion'] . '</p>'
             . '<h5 class="ssh-ej__h">Por qué</h5>' . $e['porque']
             . '<h5 class="ssh-ej__h">Error común</h5>' . $e['error']
             . '<p class="sol__learned"><b>Qué aprendiste:</b> ' . $e['aprendiste'] . '</p>'
             . '</div></details>'
             . '</div>';
    }
}

if (!function_exists('ssh_cierre')) {
    /**
     * Cierre de capítulo con los cinco bloques del curso: Qué aprendiste ·
     * Comandos esenciales · Qué debes recordar · Error que debes evitar ·
     * Comprueba que entendiste. Reutiliza el marcado de recap(), pitfall()
     * y quiz(); no añade estilos nuevos.
     */
    function ssh_cierre(string $titulo, array $aprendiste, array $comandos, array $recordar, string $evitar, array $preguntas): string
    {
        $lista = static function (array $items, string $clase = ''): string {
            $html = '';
            foreach ($items as $i) {
                $html .= '<li>' . $i . '</li>';
            }
            return '<ul' . ($clase !== '' ? ' class="' . $clase . '"' : '') . '>' . $html . '</ul>';
        };

        return '<div class="recap">'
             . '<div class="recap__head"><span class="recap__tag">Resumen</span><h3>' . e($titulo) . '</h3></div>'
             . '<div class="recap__grid">'
             . '<div><h4>Qué aprendiste</h4>' . $lista($aprendiste) . '</div>'
             . '<div><h4>Comandos esenciales</h4>' . $lista($comandos, 'recap__mono') . '</div>'
             . '<div><h4>Qué debes recordar</h4>' . $lista($recordar) . '</div>'
             . '</div></div>'
             . pitfall($evitar, 'Error que debes evitar')
             . quiz($preguntas, 'Comprueba que entendiste');
    }
}
?>

<p class="tl-eyebrow">Curso práctico · OpenSSH 10 · laboratorio propio y hosting compartido</p>
<p class="tut-lead">
  SSH es la puerta por la que se administra casi todo lo que no tienes delante: un servidor
  web, una Raspberry Pi, un contenedor o la cuenta de hosting donde vive tu sitio. En todos se
  trabaja igual, escribiendo en una terminal que en realidad está en otra máquina.
</p>
<p class="tut-lead">
  Este curso va de cero a un uso profesional. Empieza por qué es una conexión SSH y qué ocurre
  por debajo cuando pulsas Enter, sigue por moverte en el servidor, autenticarte con llaves,
  configurar el cliente y mover archivos, y termina en seguridad, túneles, despliegues y
  diagnóstico. Cada tema sigue el mismo ciclo: <strong>explicar, mostrar, señalar, practicar,
  resolver e interpretar</strong>.
</p>

<div class="tut-search" role="search">
  <label class="visually-hidden" for="tut-q">Buscar en este tutorial</label>
  <input type="search" id="tut-q" class="tut-search__input" data-tut-search
         placeholder="Buscar: known_hosts, authorized_keys, rsync, publickey, ProxyJump…"
         autocomplete="off" spellcheck="false">
  <p class="tut-search__status" data-tut-search-status role="status" aria-live="polite"></p>
</div>

<?= note('El laboratorio de este curso',
    '<p>Todas las salidas rotuladas <strong>«salida real»</strong> salieron de cuatro
    contenedores propios, creados para escribir este material y destruidos al terminar:</p>
    <ul>
      <li><code>laptop</code> (192.168.56.10): el cliente, con el usuario <code>alumno</code>.</li>
      <li><code>servidor</code> (192.168.56.20): un servidor con <code>sshd</code>, una web en <code>public_html</code> y un repositorio Git.</li>
      <li><code>bastion</code> (192.168.56.30 y 10.10.0.30): el único equipo con pata en la red interna.</li>
      <li><code>interno</code> (10.10.0.40): un servidor sin salida, solo alcanzable a través del bastión.</li>
    </ul>
    <p>Puedes montar algo equivalente con máquinas virtuales o contenedores propios, o seguir el
    curso contra tu cuenta de hosting. Nunca contra una máquina ajena: entrar sin autorización no
    es un ejercicio, es un delito en casi cualquier jurisdicción.</p>', 'info') ?>

<?= ssh_parte('01', 'Fundamentos',
    'Qué es SSH, qué ocurre cuando te conectas y cómo compruebas que hablas con el servidor correcto.',
    'fundamentos') ?>

<!-- ============================== QUÉ ES ============================= -->
<section id="que-es">
  <h2>Qué es SSH y qué problema resuelve</h2>
  <p class="tut-sub">Secure Shell: una terminal en otra máquina, por un canal que nadie puede leer ni alterar.</p>

  <p><strong>SSH</strong> significa <em>Secure Shell</em>. Es a la vez un protocolo y un
  conjunto de programas que permiten <strong>abrir una terminal en un ordenador remoto</strong>
  —y, sobre esa misma conexión, copiar archivos o transportar otras conexiones— sin que nadie
  en el camino pueda leer ni modificar lo que ocurre.</p>

  <p>La versión corta: <strong>escribes en tu teclado y los comandos se ejecutan en otra
  máquina</strong>. Lo que ves en pantalla es la respuesta de esa máquina, que puede estar en la
  mesa de al lado o en otro continente.</p>

  <h3>El mundo antes de SSH: Telnet</h3>

  <p>Antes se usaban <strong>Telnet</strong>, <code>rlogin</code>, <code>rsh</code> o
  <code>ftp</code>. Hacían su trabajo, con un defecto que hoy parece increíble:
  <strong>todo viajaba en texto legible</strong>. Usuario, contraseña, comandos y resultados.
  Cualquiera capaz de ver el tráfico —quien administra la red, el proveedor, alguien en el mismo
  wifi— lo leía sin romper nada, simplemente mirando. Y nada comprobaba que la máquina del otro
  lado fuera la que decía ser.</p>

  <?= shot('ssh/01-telnet-vs-ssh.svg',
      'Comparación en dos columnas: con Telnet el login, la contraseña y los comandos viajan '
      . 'legibles; con SSH el mismo diálogo viaja como bytes cifrados y además se garantiza '
      . 'confidencialidad, integridad y autenticación.',
      '<b>Dónde mirar:</b> los dos recuadros de «lo que ve alguien en medio del camino». '
      . 'Telnet no está «mal configurado»: se diseñó para una red en la que se confiaba.') ?>

  <h3>Tres garantías distintas</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Las tres garantías de SSH</caption>
      <thead><tr><th scope="col">Garantía</th><th scope="col">Qué significa</th><th scope="col">Sin ella</th></tr></thead>
      <tbody>
        <tr><td class="f">Confidencialidad</td><td class="d">Nadie en el camino puede leer la sesión.</td><td class="d">Tu contraseña la ve quien esté escuchando.</td></tr>
        <tr><td class="f">Integridad</td><td class="d">Nadie puede modificar lo que viaja sin que se detecte.</td><td class="d">Alguien podría cambiar un comando en tránsito.</td></tr>
        <tr><td class="f">Autenticación</td><td class="d">Tu cliente comprueba al servidor y el servidor te comprueba a ti.</td><td class="d">Podrías estar escribiendo tu contraseña en la máquina de otro.</td></tr>
      </tbody>
    </table>
  </div>

  <p>La tercera es la que más se pasa por alto. Cifrar es relativamente fácil; lo difícil es
  saber <em>con quién</em> estás cifrando. Buena parte de esta primera parte —huellas,
  <code>known_hosts</code>, host keys— trata exactamente de eso.</p>

  <?= note('Una analogía que se sostiene: el tubo blindado',
      '<p>Imagina un tubo blindado entre tu escritorio y el del servidor. Lo que metes por un
      extremo sale por el otro sin que nadie del pasillo pueda verlo ni cambiarlo.</p>
      <p>Pero un tubo blindado conectado al escritorio equivocado no sirve de nada. Por eso, antes
      de meter nada, SSH te enseña una <strong>huella</strong> del otro extremo y te pregunta si es
      el sitio correcto. Esa pregunta —que casi todo el mundo responde sin leer— es el único punto
      en el que el blindaje depende de ti.</p>', 'info') ?>

  <h3>Qué <em>no</em> es SSH</h3>
  <ul>
    <li><strong>No es una VPN.</strong> No une dos redes enteras: abre una sesión con una máquina.
    Puede transportar conexiones concretas (lo verás en túneles), pero es otra cosa.</li>
    <li><strong>No es un gestor de archivos.</strong> Copiar se hace con herramientas que van
    <em>sobre</em> SSH: <code>scp</code>, <code>sftp</code> y <code>rsync</code>.</li>
    <li><strong>No te protege de ti mismo.</strong> Un comando destructivo por SSH se ejecuta
    cifrado y perfectamente. El canal es seguro; el comando es cosa tuya.</li>
    <li><strong>No sustituye al control de acceso.</strong> Lo que hace seguro un servidor es
    <em>quién</em> puede entrar y <em>cómo</em>: eso se ve en la parte de seguridad.</li>
  </ul>

  <?= pitfall('<p>Pensar «SSH está cifrado, luego mi servidor es seguro». El cifrado resuelve que
      no lo lean; no resuelve quién puede entrar. Un servidor con SSH y una contraseña de seis
      letras es un servidor cifrado y perfectamente accesible para cualquiera con paciencia.</p>') ?>
</section>

<!-- ========================= CLIENTE Y SERVIDOR ====================== -->
<section id="cliente-servidor">
  <h2>Cliente y servidor: <code>ssh</code> frente a <code>sshd</code></h2>
  <p class="tut-sub">Dos programas, dos máquinas, dos archivos de configuración distintos.</p>

  <p>Toda conexión SSH tiene dos lados y cada uno ejecuta un programa diferente. Confundirlos es
  el malentendido más frecuente al empezar, y produce horas perdidas editando el archivo que no
  era.</p>

  <?= shot('ssh/02-cliente-servidor.svg',
      'A la izquierda tu equipo ejecuta el cliente ssh, configurado en ~/.ssh/config; a la '
      . 'derecha el servidor ejecuta el demonio sshd, configurado en /etc/ssh/sshd_config; los '
      . 'une una conexión cifrada por TCP al puerto 22.',
      '<b>Dónde mirar:</b> la <b>d</b> final. <code>sshd</code> es «SSH daemon»: un programa que '
      . 'no se lanza cuando quieres, sino que está siempre esperando conexiones.') ?>

  <?= callouts([
      ['ssh · el cliente', 'Lo ejecutas tú cuando quieres conectarte. Arranca, hace su trabajo y termina al cerrar la sesión. Se configura en <code>~/.ssh/config</code>, en tu carpeta personal.'],
      ['sshd · el servidor', 'Corre permanentemente en la máquina remota escuchando en un puerto. Arranca con el sistema, se configura en <code>/etc/ssh/sshd_config</code> y tocarlo requiere ser administrador.'],
  ]) ?>

  <p>Una misma máquina puede ser las dos cosas: tu portátil ejecuta <code>ssh</code> para salir y
  puede tener <code>sshd</code> activo para que entren. Son independientes. Tener el cliente
  instalado —lo normal en Linux o macOS— <strong>no</strong> significa que se pueda entrar en tu
  equipo. Así lo muestra el equipo en el que se escribió este curso:</p>

  <?= ssh_term(<<<'TXT'
$ systemctl status sshd
○ sshd.service - OpenSSH Daemon
     Loaded: loaded (/usr/lib/systemd/system/sshd.service; disabled; preset: disabled)
     Active: inactive (dead)
       Docs: man:sshd(8)
             man:sshd_config(5)

$ systemctl is-active sshd
inactive
TXT, 'salida real · equipo del autor') ?>

  <p>Ese <code>inactive (dead)</code> y ese <code>disabled</code> son la situación normal en un
  portátil: el cliente existe para salir, pero el servidor no está arrancado ni se arranca con el
  sistema. Nadie puede entrar por SSH. Activarlo sería una decisión de administración —abrir una
  puerta en tu equipo—, no un paso rutinario.</p>

  <?= compare(
      ['~/.ssh/config', 'Cliente · cómo salgo yo',
       '<ul>
          <li>Vive en <strong>tu</strong> carpeta personal.</li>
          <li>Lo editas sin permisos especiales.</li>
          <li>Dice <em>a qué servidores me conecto y cómo</em>.</li>
          <li>Lo leen también <code>scp</code>, <code>sftp</code>, <code>rsync</code> y <code>git</code>.</li>
        </ul>'],
      ['/etc/ssh/sshd_config', 'Servidor · quién puede entrar',
       '<ul>
          <li>Vive en la máquina remota, en <code>/etc</code>.</li>
          <li>Hace falta <code>sudo</code>.</li>
          <li>Dice <em>quién entra y con qué métodos</em>.</li>
          <li>Un error aquí puede dejar fuera a todo el mundo.</li>
        </ul>'],
      'Si algo «no hace caso» a tu configuración, pregúntate primero: ¿estoy editando el archivo del lado correcto?') ?>

  <?= pitfall('<p>Editar <code>~/.ssh/config</code> esperando cambiar quién puede entrar en tu
      máquina, o <code>/etc/ssh/sshd_config</code> esperando cambiar cómo sales tú. No da error:
      simplemente se aplica al otro lado, y parece que el cambio «no funcionó».</p>') ?>
</section>

<!-- ============================== PUERTO ============================= -->
<section id="puerto">
  <h2>El puerto 22</h2>
  <p class="tut-sub">La dirección IP lleva a la máquina; el puerto lleva al servicio.</p>

  <p>Una máquina tiene una dirección, pero ofrece muchos servicios a la vez. Los distingue el
  <strong>puerto</strong>, un número entre 1 y 65535 que funciona como el número de puerta dentro
  del edificio. SSH usa por convenio el <strong>22</strong>.</p>

  <?= shot('ssh/03-puertos.svg',
      'Un servidor con la dirección 192.168.56.20 y varios servicios: 22 SSH resaltado, 80 HTTP, '
      . '443 HTTPS, 3306 MySQL y 25 SMTP; a la derecha, la opción -p para usar otro puerto.',
      '<b>Dónde mirar:</b> el 22 resaltado. Es el valor por defecto, no una obligación: si el '
      . 'servidor escucha en otro puerto se lo dices al cliente con <code>-p</code>.') ?>

  <?= anatomy(
      '<b>ssh</b> <u>-p 2222</u> alumno@servidor',
      [
          ['-p 2222', 'Puerto del servidor. Solo hace falta si <strong>no</strong> es el 22. En <code>ssh</code> es <code>-p</code> minúscula; en <code>scp</code> la misma idea es <code>-P</code> mayúscula.'],
      ],
      'La opción de puerto') ?>

  <p>Si pides un puerto donde no escucha nadie, la conexión se detiene muy pronto. En el
  laboratorio, el servidor solo tiene SSH en el 22:</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh -p 2222 srv
ssh: connect to host servidor port 2222: Connection refused
TXT, 'salida real · laboratorio') ?>

  <?= evidence(
      '<p>Un servidor no responde en el puerto 22 pero sí en el 2222.</p>',
      '<p>Quien lo administra movió SSH a otro puerto, algo bastante habitual.</p>',
      '<p>Que eso lo haga más seguro. Cambiar el puerto reduce el <em>ruido</em> en los logs: los
      barridos automáticos prueban el 22 y siguen de largo. Pero cualquiera que examine ese equipo
      a conciencia encuentra el 2222 en segundos. Es higiene, no control de acceso; el control de
      acceso son las llaves y la configuración de <code>sshd</code>.</p>') ?>
</section>

<!-- ============================= ANATOMÍA =========================== -->
<section id="anatomia">
  <h2>Anatomía del comando</h2>
  <p class="tut-sub">Pocas piezas, y una que casi todo el mundo interpreta mal.</p>

  <?= ssh_term(<<<'TXT'
$ ssh alumno@192.168.56.20
TXT, 'bash') ?>

  <?= shot('ssh/04-anatomia-comando.svg',
      'El comando ssh -p 2222 alumno@192.168.56.20 dividido en piezas de colores: el programa, '
      . 'el puerto, el usuario remoto, la arroba y la dirección del servidor, cada una con su '
      . 'significado.',
      '<b>Dónde mirar:</b> la pieza <code>alumno</code>. Es el usuario <em>del servidor</em>, no '
      . 'el tuyo.') ?>

  <?= anatomy(
      '<b>ssh</b> <i>alumno</i>@<u>192.168.56.20</u>',
      [
          ['ssh', 'El programa cliente.'],
          ['alumno', 'Con qué cuenta entras <strong>en el servidor</strong>. Esa cuenta tiene que existir allí; no tiene por qué llamarse como tu usuario local.'],
          ['@', 'Separa el usuario de la máquina.'],
          ['192.168.56.20', 'A qué máquina: una IP o un nombre que se pueda resolver (en el laboratorio, <code>servidor</code>).'],
      ]) ?>

  <p>Si omites <code>usuario@</code>, <code>ssh</code> usa <strong>tu nombre de usuario
  local</strong> como usuario remoto (salvo que <code>~/.ssh/config</code> diga otra cosa). En tu
  red puede funcionar por casualidad; en un servidor ajeno casi nunca, y el síntoma es un
  <code>Permission denied</code> que parece de llaves y en realidad es de usuario.</p>

  <?= pitfall('<p>Leer <code>alumno@192.168.56.20</code> como un correo y pensar que
      <code>alumno</code> es «tu cuenta». Es la cuenta <em>que existe en esa máquina</em>: en un
      hosting compartido, el nombre que te asignó el proveedor; en un servidor propio, el que
      creaste.</p>') ?>
</section>

<!-- ============================== FLUJO ============================= -->
<section id="flujo">
  <h2>Qué ocurre cuando pulsas Enter</h2>
  <p class="tut-sub">Siete pasos en orden. Saber cuál es cuál convierte cualquier error en un diagnóstico.</p>

  <p>Entre el comando y el prompt del servidor pasan bastantes cosas. No hace falta memorizarlas,
  pero sí saber su orden: cuando algo falla, <strong>el mensaje de error dice en qué paso se
  detuvo</strong>, y eso descarta de golpe todas las causas de los pasos anteriores.</p>

  <?= shot('ssh/05-flujo-conexion.svg',
      'Los siete pasos de una conexión SSH en vertical: resolver el nombre, abrir TCP, negociar '
      . 'SSH, verificar al servidor, autenticar al usuario, abrir el canal y entregar el shell; '
      . 'a la derecha, el error que aparece si la conexión se detiene en cada paso.',
      '<b>Dónde mirar:</b> la columna derecha. Cada error de SSH pertenece a un paso concreto, y '
      . 'eso es lo que lo hace diagnosticable.') ?>

  <?= callouts([
      ['Resolver el nombre', 'Si escribiste un nombre, se traduce a IP con DNS o <code>/etc/hosts</code>. Aún no ha salido nada hacia el servidor. Si falla: <code>Could not resolve hostname</code>.'],
      ['Abrir la conexión TCP', 'Una conexión de red normal contra el puerto 22. Si falla: <code>Connection refused</code>, <code>timed out</code> o <code>No route to host</code>.'],
      ['Negociar SSH', 'Los dos lados acuerdan versión y algoritmos y generan las claves de sesión.'],
      ['Verificar al servidor', 'El servidor presenta su <em>host key</em> y tu cliente la compara con <code>~/.ssh/known_hosts</code>. Aquí aparece la pregunta de la huella o el aviso de clave cambiada.'],
      ['Autenticarte a ti', 'Ahora al revés: demuestras quién eres con una llave o una contraseña. Si falla: <code>Permission denied</code>.'],
      ['Abrir el canal', 'La sesión queda establecida; todo lo que sigue va protegido.'],
      ['Entregar el shell', 'El servidor lanza tu intérprete y ves su prompt.'],
  ]) ?>

  <?= note('La idea que hace útil este capítulo',
      '<p>Los pasos 4 y 5 son <strong>dos autenticaciones distintas y en direcciones
      opuestas</strong>: primero tu cliente comprueba al servidor, después el servidor te comprueba
      a ti. Quien solo conoce la segunda cree que los avisos de host key son ruido. Son la mitad de
      la seguridad de SSH.</p>', 'info') ?>
</section>

<!-- ============================= PRIMERA ============================ -->
<section id="primera">
  <h2>Tu primera conexión</h2>
  <p class="tut-sub">Qué necesitas saber antes de teclear, y dónde practicar sin riesgo.</p>

  <h3>Los datos que necesitas</h3>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Datos necesarios para conectar</caption>
      <thead><tr><th scope="col">Dato</th><th scope="col">De dónde sale</th><th scope="col">Si no lo tienes</th></tr></thead>
      <tbody>
        <tr><td class="f">Dirección o nombre</td><td class="d">Quien administra el servidor o el panel del proveedor.</td><td class="d">No hay conexión posible.</td></tr>
        <tr><td class="f">Usuario remoto</td><td class="d">La cuenta creada en esa máquina.</td><td class="d">Se usará tu usuario local y fallará la autenticación.</td></tr>
        <tr><td class="f">Puerto</td><td class="d">22, salvo que te digan otro.</td><td class="d"><code>Connection refused</code> o espera sin respuesta.</td></tr>
        <tr><td class="f">Método de autenticación</td><td class="d">Contraseña al principio; llave en cuanto puedas.</td><td class="d">Llegas a la autenticación y te quedas ahí.</td></tr>
        <tr><td class="f">La huella esperada</td><td class="d">El panel del proveedor o quien administra.</td><td class="d">Puedes conectar, pero aceptando a ciegas.</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Dónde practicar</h3>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Entornos válidos para practicar</caption>
      <thead><tr><th scope="col">Entorno</th><th scope="col">¿Vale?</th><th scope="col">Por qué</th></tr></thead>
      <tbody>
        <tr><td class="f">Tu equipo (<code>localhost</code>)</td><td class="d">Sí, si activas <code>sshd</code> a conciencia</td><td class="d">El tráfico no sale de la máquina.</td></tr>
        <tr><td class="f">Una VM tuya</td><td class="d">Sí, la mejor opción</td><td class="d">Puedes romperla y rehacerla.</td></tr>
        <tr><td class="f">Un contenedor tuyo</td><td class="d">Sí</td><td class="d">Es lo que usa este curso: se crea y se destruye en segundos.</td></tr>
        <tr><td class="f">Tu cuenta de hosting</td><td class="d">Sí, es tuya</td><td class="d">Y probablemente es tu caso real.</td></tr>
        <tr><td class="f">El servidor del trabajo</td><td class="d">Solo con autorización explícita</td><td class="d">Tener la contraseña no es tener permiso para practicar.</td></tr>
        <tr><td class="f">Cualquier máquina ajena</td><td class="d">No</td><td class="d">No es tuya. No hay matiz.</td></tr>
      </tbody>
    </table>
  </div>

  <h3>La primera conexión, paso a paso</h3>
  <?= steps([
      'Comprueba la versión de tu cliente con <code>ssh -V</code>.',
      'Consigue la <strong>huella esperada</strong> del servidor por un canal distinto (panel, administrador, consola).',
      'Ejecuta <code>ssh usuario@servidor</code>.',
      'Compara la huella que aparece con la esperada <strong>antes</strong> de responder.',
      'Responde con la huella (o <code>yes</code> si ya la has comparado) e introduce tu contraseña: no se verá al teclear.',
  ]) ?>

  <p>Así fue la primera conexión del laptop al servidor del laboratorio:</p>

  <?= shot('ssh/06-primera-conexion.svg',
      'Salida real de la primera conexión SSH al servidor del laboratorio: el aviso de que la '
      . 'autenticidad no puede establecerse, la huella ED25519, la pregunta respondida con yes, el '
      . 'aviso de que se añadió a known hosts y la petición de contraseña.',
      '<b>Qué estás viendo:</b> el inicio literal de la sesión. <b>Dónde mirar:</b> la línea 1, la '
      . 'huella; todo lo demás depende de haberla comprobado.',
      'real') ?>

  <?= callouts([
      ['La huella ED25519', 'El resumen de la host key que presenta el servidor: <code>SHA256:f/kLSUc2Jy9xR2JFOx4z932HIl6YXzi56MXyvqZuEYY</code>.'],
      ['La pregunta', '<code>yes/no/[fingerprint]</code>: aceptar, rechazar o pegar la huella esperada para que SSH la compare.'],
      ['Permanently added', 'La clave se guardó en <code>~/.ssh/known_hosts</code>. La próxima vez no preguntará.'],
      ['La contraseña', 'Solo después de verificar al servidor llega tu autenticación. La contraseña no se muestra al teclear.'],
  ]) ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh alumno@servidor
The authenticity of host 'servidor (192.168.56.20)' can't be established.
ED25519 key fingerprint is SHA256:f/kLSUc2Jy9xR2JFOx4z932HIl6YXzi56MXyvqZuEYY.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'servidor' (ED25519) to the list of known hosts.
alumno@servidor's password:
TXT, 'salida real · laboratorio') ?>

  <p><strong>Qué significa:</strong> los pasos 1 a 4 del flujo ya ocurrieron —nombre resuelto a
  192.168.56.20, TCP abierto, negociación hecha, servidor presentado— y la sesión espera el paso
  5. Tras la contraseña, el prompt cambia a <code>alumno@servidor:~$</code>: ya estás dentro. La
  parte «En el servidor» empieza justo ahí.</p>

  <?= pitfall('<p>Pensar que la pregunta de la huella es un error o una formalidad. Es el paso 4
      funcionando: SSH no conoce ese servidor y te pide que decidas si es el correcto.</p>') ?>
</section>

<!-- =========================== FINGERPRINT ========================== -->
<section id="fingerprint">
  <h2>La huella (fingerprint)</h2>
  <p class="tut-sub">La pregunta que casi todo el mundo responde sin leer, y el único punto débil de la cadena.</p>

  <p>El servidor tiene su propio par de llaves. Su llave pública podría enseñártela entera, pero
  son decenas de caracteres imposibles de comparar a ojo. En su lugar, SSH calcula un
  <strong>resumen criptográfico</strong> —la huella— que cabe en un renglón y que cambia por
  completo si la llave cambia en un solo bit.</p>

  <?= anatomy(
      'ED25519 key fingerprint is <b>SHA256:</b><u>f/kLSUc2Jy9xR2JFOx4z932HIl6YXzi56MXyvqZuEYY</u>',
      [
          ['ED25519', 'El tipo de host key que presentó el servidor.'],
          ['SHA256:', 'El algoritmo de resumen con el que se calculó la huella.'],
          ['f/kLSUc2…uEYY', 'El resumen en base64. Es lo que hay que comparar, carácter a carácter.'],
      ],
      'Una línea de huella') ?>

  <h3>Comprobarla por otro camino</h3>
  <p>La huella correcta se obtiene <strong>en el propio servidor</strong> (o de quien lo
  administra) y se compara con la que muestra tu cliente. En el laboratorio, desde la consola del
  servidor:</p>

  <?= ssh_term(<<<'TXT'
root@servidor:~# ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
256 SHA256:f/kLSUc2Jy9xR2JFOx4z932HIl6YXzi56MXyvqZuEYY root@buildkitsandbox (ED25519)
TXT, 'salida real · laboratorio') ?>

  <p>El texto final <code>root@buildkitsandbox</code> es solo el comentario de la llave: se generó
  al construir la imagen del laboratorio. No forma parte de la huella ni de la comparación.</p>

  <?= shot('ssh/07-huella-zoom.svg',
      'Zoom de dos salidas reales: arriba la huella que mostró el cliente al conectar, en medio '
      . 'la huella calculada en el servidor con ssh-keygen -lf, y abajo el valor SHA256 que '
      . 'coincide en ambas.',
      '<b>Dónde mirar:</b> el valor tras <code>SHA256:</code> en ① y en ②. Coinciden: el laptop '
      . 'hablaba con el servidor correcto.',
      'real') ?>

  <?= callouts([
      ['Lo que ve el cliente', 'La huella que el servidor presentó durante la conexión.'],
      ['Lo que dice el servidor', 'La huella calculada sobre su archivo de host key, por un canal que no es la conexión dudosa.'],
      ['Coinciden', 'Solo ahora tiene sentido aceptar.'],
  ]) ?>

  <h3>Qué pasa según lo que respondas</h3>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Respuestas posibles</caption>
      <thead><tr><th scope="col">Escribes</th><th scope="col">Qué ocurre</th></tr></thead>
      <tbody>
        <tr><td class="f">yes</td><td class="d">Guarda la clave en <code>~/.ssh/known_hosts</code> y continúa. Correcto solo si ya has comparado la huella.</td></tr>
        <tr><td class="f">no</td><td class="d">Cancela y no guarda nada.</td></tr>
        <tr><td class="f">SHA256:…</td><td class="d">Pegas la huella que te dieron; SSH la compara con la recibida y solo continúa si coinciden. La mejor respuesta cuando la tienes por otra vía.</td></tr>
      </tbody>
    </table>
  </div>

  <?= evidence(
      '<p>SSH muestra una huella y dice que la autenticidad del host no puede establecerse.</p>',
      '<p>Es la primera vez que tu cliente ve ese servidor (o ese nombre). Casi siempre es solo
      eso.</p>',
      '<p>Que sea seguro aceptar. Si alguien estuviera suplantando el servidor, el mensaje sería
      <strong>idéntico</strong>. La única diferencia la pone comparar con una huella obtenida por
      un canal distinto.</p>') ?>

  <?= pitfall('<p>Responder <code>yes</code> por reflejo en una red que no controlas —el wifi de
      un hotel, una conferencia—. Ese es justo el escenario para el que existe la pregunta.</p>') ?>

  <?= quiz([
      [
          'q' => '¿Qué te pregunta exactamente el mensaje de la primera conexión?',
          'opts' => ['A' => 'Si tu contraseña es correcta', 'B' => 'Si confías en que esa huella es la del servidor al que querías conectar', 'C' => 'Si quieres cifrar la conexión', 'D' => 'Si el servidor está actualizado'],
          'ok' => 'B',
          'why' => 'El cifrado ya se negoció y tu contraseña aún no ha entrado en juego. Lo único que SSH no puede decidir solo es si el interlocutor es el correcto.',
      ],
      [
          'q' => 'Vuelves a conectar a un servidor conocido y NO te pregunta nada. ¿Qué significa?',
          'opts' => ['A' => 'Que SSH dejó de comprobar', 'B' => 'Que la clave recibida coincide con la guardada', 'C' => 'Que la conexión no está cifrada', 'D' => 'Que el servidor no tiene host key'],
          'ok' => 'B',
          'why' => 'El silencio es la comprobación: SSH comparó con <code>known_hosts</code> y coincidió. Si algún día vuelve a hablar, es porque dejaron de coincidir.',
      ],
  ]) ?>
</section>

<!-- ============================= HOST KEY =========================== -->
<section id="host-key">
  <h2>Host key y user key: dos identidades</h2>
  <p class="tut-sub">Ambas son pares de llaves; sirven para cosas opuestas y viven en sitios distintos.</p>

  <p>SSH usa criptografía de llave pública en dos puntos de la misma conexión. Mezclarlos genera
  confusiones que duran meses:</p>

  <?= shot('ssh/08-host-vs-user-key.svg',
      'Dos columnas: la host key identifica al servidor, la genera el servidor y tu cliente guarda '
      . 'su pública en known_hosts; la user key te identifica a ti, la generas tú y el servidor '
      . 'guarda su pública en authorized_keys.',
      '<b>Dónde mirar:</b> la última fila de cada columna. La host key te protege a ti; la user '
      . 'key protege al servidor.') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Host key frente a user key</caption>
      <thead><tr><th scope="col"></th><th scope="col">Host key</th><th scope="col">User key</th></tr></thead>
      <tbody>
        <tr><td class="f">¿Quién la genera?</td><td class="d">El servidor, al instalarse</td><td class="d">Tú, con <code>ssh-keygen</code></td></tr>
        <tr><td class="f">¿Qué demuestra?</td><td class="d">«Soy este servidor»</td><td class="d">«Soy este usuario»</td></tr>
        <tr><td class="f">La privada vive en</td><td class="d"><code>/etc/ssh/ssh_host_*_key</code></td><td class="d"><code>~/.ssh/id_ed25519</code> de tu equipo</td></tr>
        <tr><td class="f">La pública se registra en</td><td class="d">Tu <code>~/.ssh/known_hosts</code></td><td class="d">El <code>~/.ssh/authorized_keys</code> del servidor</td></tr>
        <tr><td class="f">Si cambia</td><td class="d">Aviso grande al conectar</td><td class="d">Dejas de poder entrar</td></tr>
      </tbody>
    </table>
  </div>

  <p>El servidor del laboratorio tiene varias host keys, una por tipo de algoritmo:</p>

  <?= ssh_term(<<<'TXT'
root@servidor:~# ls /etc/ssh/
moduli
ssh_config
ssh_config.d
ssh_host_ecdsa_key
ssh_host_ecdsa_key.pub
ssh_host_ed25519_key
ssh_host_ed25519_key.pub
ssh_host_rsa_key
ssh_host_rsa_key.pub
sshd_config
sshd_config.d
TXT, 'salida real · laboratorio') ?>

  <?= pitfall('<p>Intentar arreglar un <code>Permission denied</code> —que es de <em>tu</em>
      llave— borrando <code>known_hosts</code>, que guarda la <em>del servidor</em>. Son
      problemas de pasos distintos: el 5 y el 4.</p>') ?>
</section>

<!-- =========================== KNOWN HOSTS ========================== -->
<section id="known-hosts">
  <h2><code>known_hosts</code>: la memoria del cliente</h2>
  <p class="tut-sub">Un archivo de texto con las host keys de los servidores que ya aceptaste.</p>

  <?= shot('ssh/09-known-hosts-ciclo.svg',
      'Ciclo de known_hosts: primera vez, ves la huella, aceptas, se guarda una línea; a partir de '
      . 'la segunda conexión SSH compara en silencio y entra si coincide o se detiene si no.',
      '<b>Dónde mirar:</b> el bloque 5. Que SSH no diga nada no es que no compruebe: comprobó y '
      . 'coincidió.') ?>

  <h3>Qué hay dentro</h3>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ cat ~/.ssh/known_hosts
servidor ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDUpckdORUwXfeJBXJCay2Dvzkekx4VnQvLskcl7g5DM
servidor ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQD7B4hCx3hNsy025Edl4Ec6QDPgHfTMbFMVe6U548XeULjl[…]
servidor ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBIm2PHjTJbwAzmlB7GKudUhE6zhWnRGJqM0fIra89R4tGlkyfSUNM6HP3Fs+R5UGC32I1SfmuopEv5mIhsovcIQ=
TXT, 'salida real · laboratorio (línea RSA recortada)') ?>

  <?= anatomy(
      '<b>servidor</b> <i>ssh-ed25519</i> <u>AAAAC3NzaC1lZDI1NTE5AAAAIDUp…</u>',
      [
          ['servidor', 'A qué máquina corresponde, tal como la escribiste. Si el puerto no es 22 aparece entre corchetes: <code>[servidor]:2222</code>.'],
          ['ssh-ed25519', 'El tipo de llave.'],
          ['AAAAC3Nza…', 'La llave pública del servidor en base64. Es lo que se compara en cada conexión.'],
      ],
      'Una línea de known_hosts') ?>

  <?= note('¿Por qué tres líneas si solo aceptaste una vez?',
      '<p>Aceptaste la ED25519. Una vez autenticado, el servidor anunció sus otras host keys (RSA y
      ECDSA) y el cliente las añadió. Es la opción <code>UpdateHostKeys</code> de
      <code>ssh_config</code>: según su manual, solo acepta llaves adicionales si la usada para
      autenticar al servidor ya era de confianza o la aceptaste explícitamente, y sirve para rotar
      claves con suavidad. Por eso apareció también un <code>known_hosts.old</code>.</p>', 'info') ?>

  <h3>Consultar y limpiar sin borrar el archivo</h3>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh-keygen -lF servidor
# Host servidor found: line 1
servidor ED25519 SHA256:f/kLSUc2Jy9xR2JFOx4z932HIl6YXzi56MXyvqZuEYY
# Host servidor found: line 2
servidor RSA SHA256:zrN3Apg/QhMlGDGMtXEVbbOPz8zL2b2QhpgLabugVKY
# Host servidor found: line 3
servidor ECDSA SHA256:v+p5/tquhzW+ON4EyQ8yujulU66CNPj2mIXUzZGOkNY
TXT, 'salida real · laboratorio') ?>

  <?= anatomy(
      '<b>ssh-keygen</b> <u>-F</u> servidor · <b>ssh-keygen</b> <u>-lF</u> servidor · <b>ssh-keygen</b> <u>-R</u> servidor',
      [
          ['-F', 'Busca las entradas de ese host en <code>known_hosts</code> y las muestra.'],
          ['-lF', 'Lo mismo, pero mostrando huellas en lugar de llaves: ideal para comparar.'],
          ['-R', 'Elimina <strong>solo</strong> las entradas de ese host y guarda copia en <code>known_hosts.old</code>.'],
      ],
      'Tres operaciones útiles') ?>

  <?= note('Por qué algunos known_hosts parecen ilegibles',
      '<p>Si ves líneas que empiezan por <code>|1|</code>, está activo <code>HashKnownHosts</code>:
      los nombres se guardan resumidos. Así, quien lea tu archivo no obtiene la lista de máquinas a
      las que te conectas. <code>ssh-keygen -F</code> y <code>-R</code> funcionan igual.</p>', 'info') ?>
</section>

<!-- ========================== HOST CAMBIADO ========================= -->
<section id="host-cambiado">
  <h2>Cuando la host key cambia</h2>
  <p class="tut-sub">El aviso más aparatoso de SSH, y por qué no se arregla borrando el archivo.</p>

  <p>En el laboratorio se regeneraron las host keys del servidor, como ocurriría tras una
  reinstalación. El siguiente <code>ssh srv hostname</code> produjo esto:</p>

  <?= shot('ssh/10-host-cambiado.svg',
      'Salida real del aviso REMOTE HOST IDENTIFICATION HAS CHANGED tras regenerar las host keys '
      . 'del servidor: advertencia de posible intermediario, la línea que dice que la clave puede '
      . 'haber cambiado sin más, la huella nueva, la línea de known_hosts afectada y la negativa a '
      . 'conectar.',
      '<b>Dónde mirar:</b> la línea ②. Explica la mayoría de los casos, y casi nadie la lee. SSH '
      . 'no puede distinguir una reinstalación de un intermediario, así que se niega a continuar.',
      'real') ?>

  <?= callouts([
      ['El aviso', 'La clave presentada no coincide con la guardada para ese nombre.'],
      ['La explicación benigna', '«It is also possible that a host key has just been changed»: reinstalación, migración o rotación.'],
      ['La huella nueva', '<code>SHA256:KjYa/RXk2+RjRJdxHjmo1z9EW6ZEIGBcQ4vU81R0UTc</code>: lo que hay que verificar.'],
      ['La línea afectada', '<code>Offending ECDSA key in /home/alumno/.ssh/known_hosts:3</code>: dónde está la clave antigua.'],
      ['La negativa', '<code>Host key verification failed.</code> No se envió ninguna credencial.'],
  ]) ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh srv hostname
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
Someone could be eavesdropping on you right now (man-in-the-middle attack)!
It is also possible that a host key has just been changed.
The fingerprint for the ED25519 key sent by the remote host is
SHA256:KjYa/RXk2+RjRJdxHjmo1z9EW6ZEIGBcQ4vU81R0UTc.
Please contact your system administrator.
Add correct host key in /home/alumno/.ssh/known_hosts to get rid of this message.
Offending ECDSA key in /home/alumno/.ssh/known_hosts:3
Host key for servidor has changed and you have requested strict checking.
Host key verification failed.
TXT, 'salida real · laboratorio') ?>

  <h3>Causas posibles</h3>
  <?= compare(
      ['Legítimas', 'lo habitual',
       '<ul><li>Reinstalación del sistema.</li><li>Migración a otra máquina con la misma IP o nombre.</li><li>Rotación deliberada de claves.</li><li>El nombre apunta ahora a otro servidor.</li></ul>'],
      ['De seguridad', 'poco frecuente, pero la razón del aviso',
       '<ul><li>Alguien se interpone entre tú y el servidor (DNS falseado, red hostil).</li><li>Un equipo distinto responde en esa dirección.</li></ul>'],
      'No se decide por intuición: se decide comparando la huella nueva por un canal independiente.') ?>

  <h3>El procedimiento correcto</h3>
  <?= steps([
      '<strong>No borres nada todavía.</strong> El archivo guarda la prueba de lo que había antes.',
      '<strong>Pregunta qué cambió:</strong> reinstalación, migración, rotación. Casi siempre alguien lo sabe.',
      '<strong>Mira lo que tenías guardado</strong> con <code>ssh-keygen -lF servidor</code>.',
      '<strong>Consigue la huella nueva por otra vía</strong>: consola del servidor, panel del proveedor, administrador.',
      '<strong>Compárala</strong> con la del aviso. Solo si coincide, elimina la entrada antigua con <code>ssh-keygen -R</code>.',
      '<strong>Reconecta pegando la huella</strong> en lugar de escribir <code>yes</code>. Si no coincide o nadie explica el cambio: no te conectes y avisa.',
  ]) ?>

  <p>Así se hizo en el laboratorio. Primero, lo que había y lo que presenta ahora el servidor:</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh-keygen -lF servidor
# Host servidor found: line 1
servidor ED25519 SHA256:f/kLSUc2Jy9xR2JFOx4z932HIl6YXzi56MXyvqZuEYY
# Host servidor found: line 2
servidor RSA SHA256:zrN3Apg/QhMlGDGMtXEVbbOPz8zL2b2QhpgLabugVKY
# Host servidor found: line 3
servidor ECDSA SHA256:v+p5/tquhzW+ON4EyQ8yujulU66CNPj2mIXUzZGOkNY
alumno@laptop:~$ ssh-keyscan -t ed25519 servidor 2>/dev/null | ssh-keygen -lf -
256 SHA256:KjYa/RXk2+RjRJdxHjmo1z9EW6ZEIGBcQ4vU81R0UTc servidor (ED25519)
TXT, 'salida real · laboratorio') ?>

  <?= pitfall('<p>Tomar <code>ssh-keyscan</code> como verificación. Pregunta al servidor por la
      <strong>misma red</strong> que genera la duda: si hubiera un intermediario, te devolvería su
      clave. Solo te dice qué se está presentando; no quién lo presenta.</p>') ?>

  <p>El canal independiente fue la consola del propio servidor:</p>

  <?= ssh_term(<<<'TXT'
root@servidor:~# ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
256 SHA256:KjYa/RXk2+RjRJdxHjmo1z9EW6ZEIGBcQ4vU81R0UTc root@servidor (ED25519)
TXT, 'salida real · laboratorio') ?>

  <p>Coincide con la huella del aviso. Ahora sí se limpia la entrada antigua y se reconecta
  pegando la huella verificada:</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh-keygen -R servidor
# Host servidor found: line 1
# Host servidor found: line 2
# Host servidor found: line 3
/home/alumno/.ssh/known_hosts updated.
Original contents retained as /home/alumno/.ssh/known_hosts.old
alumno@laptop:~$ ssh srv hostname
The authenticity of host 'servidor (192.168.56.20)' can't be established.
ED25519 key fingerprint is SHA256:KjYa/RXk2+RjRJdxHjmo1z9EW6ZEIGBcQ4vU81R0UTc.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? SHA256:KjYa/RXk2+RjRJdxHjmo1z9EW6ZEIGBcQ4vU81R0UTc
Warning: Permanently added 'servidor' (ED25519) to the list of known hosts.
servidor
TXT, 'salida real · laboratorio') ?>

  <p>Fíjate en dos detalles: <code>-R</code> quitó las tres líneas del host y guardó copia en
  <code>known_hosts.old</code>; y la respuesta no fue <code>yes</code> sino la huella, así que SSH
  la comparó por ti.</p>

  <?= pitfall('<p>La receta de internet: <code>rm ~/.ssh/known_hosts</code>. El aviso desaparece
      y parece que «funciona», pero borras la memoria de <em>todos</em> tus servidores y aceptas
      el nuevo sin comprobar nada. Si el aviso estaba justificado, acabas de aceptar exactamente lo
      que SSH intentaba evitar.</p>') ?>

  <?= evidence(
      '<p>Aparece <code>REMOTE HOST IDENTIFICATION HAS CHANGED</code> el mismo día que tu proveedor
      te avisó por correo de una migración.</p>',
      '<p>La coincidencia apunta a que la máquina es nueva y su clave también.</p>',
      '<p>Que sea seguro aceptar solo por la coincidencia: un correo no es verificación. Lo que
      cierra el caso es comparar la huella con la publicada en el panel del proveedor, un canal
      distinto y autenticado.</p>') ?>
</section>

<!-- ============================ PRÁCTICA ============================= -->
<section id="practica-fundamentos">
  <h2>Práctica: fundamentos</h2>
  <p class="tut-sub">Cuatro ejercicios para fijar cliente, servidor, huellas y known_hosts.</p>

  <?= ssh_ejercicio([
      'num' => '01',
      'titulo' => 'Identificar cliente y servidor',
      'nivel' => 'basico',
      'objetivo' => 'Objetivo: construir el comando correcto y saber qué programa corre en cada máquina.',
      'mision' => '<p>Deducir el comando de conexión y señalar dónde se ejecuta <code>ssh</code> y dónde <code>sshd</code>.</p>',
      'escenario' => '<p>Laptop: <code>192.168.56.10</code>. Servidor: <code>192.168.56.20</code>. Usuario remoto: <code>alumno</code>. SSH en el puerto por defecto.</p>',
      'preparacion' => '<p>Ninguna: es un ejercicio de lectura. Ten a mano las figuras 02 y 04.</p>',
      'pasos' => [
          '<p>Escribe en un papel el comando que lanzarías <strong>desde el laptop</strong>.</p>',
          '<p>Marca junto a cada máquina qué programa SSH ejecuta y qué archivo de configuración le corresponde.</p>',
      ],
      'observar' => '<p>Qué dato del escenario va delante de la arroba y cuál detrás, y si hace falta <code>-p</code>.</p>',
      'visual' => ssh_tree("Laptop   192.168.56.10   (¿ssh o sshd?)\n   │\n   │  conexión cifrada · puerto 22\n   ▼\nServidor 192.168.56.20   (¿ssh o sshd?)\nUsuario remoto: alumno", 'escenario'),
      'preguntas' => [
          '¿Cuál es el comando exacto?',
          '¿Qué programa se ejecuta en el laptop y cuál en el servidor?',
          '¿Qué ocurriría si omites <code>alumno@</code> y tu usuario local se llama distinto?',
      ],
      'pistas' => [
          '<p>Una conexión tiene un lado que llama y un lado que espera.</p>',
          '<p>Mira la figura 04: delante de <code>@</code> va el usuario <em>del servidor</em>.</p>',
          '<p>El puerto es el 22, así que <code>-p</code> sobra.</p>',
      ],
      'solucion' => '<code>ssh alumno@192.168.56.20</code>, lanzado en el laptop (cliente <code>ssh</code>) contra el servidor (demonio <code>sshd</code>).',
      'porque' => '<p>El usuario es la cuenta que existe en el servidor y la IP identifica la máquina. El laptop inicia la conexión, así que ejecuta el cliente y se configura en <code>~/.ssh/config</code>; el servidor escucha con <code>sshd</code>, configurado en <code>/etc/ssh/sshd_config</code>. Sin <code>alumno@</code> se usaría el usuario local y, si no existe en el servidor, la autenticación fallaría.</p>',
      'error' => '<p>Poner la IP del laptop en el comando o creer que <code>alumno</code> es «tu» usuario local.</p>',
      'aprendiste' => 'quién ejecuta qué y cómo se lee usuario@máquina.',
  ]) ?>

  <?= ssh_ejercicio([
      'num' => '02',
      'titulo' => 'Tu primera conexión',
      'nivel' => 'basico',
      'objetivo' => 'Objetivo: conectar a un servidor propio y reconocer cada paso del flujo en la salida.',
      'mision' => '<p>Entrar por primera vez en tu servidor de práctica y localizar los pasos 4 y 5.</p>',
      'escenario' => '<p>Una VM, contenedor o cuenta de hosting tuya a la que nunca te has conectado.</p>',
      'preparacion' => '<p>Conoce la dirección, el usuario y el puerto. Consigue la huella esperada desde la consola del servidor con <code>ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub</code> o del panel del proveedor.</p>',
      'pasos' => [
          ssh_term("\$ ssh -V\n\$ ssh usuario@<IP-LAB>", 'bash'),
          '<p>No respondas aún. Compara la huella mostrada con la esperada; responde pegando la huella y después introduce la contraseña. Al entrar, ejecuta <code>hostname</code> y sal con <code>exit</code>.</p>',
      ],
      'observar' => '<p>La línea <code>key fingerprint is</code>, la línea <code>Permanently added</code> y el cambio de prompt tras la contraseña.</p>',
      'visual' => '<p>Compara tu salida con la figura 06.</p>',
      'preguntas' => [
          '¿En qué momento se verificó al servidor y en cuál te autenticaste tú?',
          '¿Qué archivo se modificó en tu equipo?',
          '¿Qué verás la segunda vez que te conectes?',
      ],
      'pistas' => [
          '<p>Hay dos autenticaciones en direcciones opuestas.</p>',
          '<p>Busca la línea que menciona «list of known hosts».</p>',
          '<p>Ejecuta <code>ssh-keygen -lF &lt;IP-LAB&gt;</code> tras la conexión.</p>',
      ],
      'solucion' => 'La huella corresponde al paso 4 (servidor verificado); la contraseña al paso 5 (tú autenticado); se añadió una entrada a <code>~/.ssh/known_hosts</code>.',
      'porque' => '<p>La pregunta de la huella aparece antes de pedir credenciales porque el cliente necesita saber con quién habla antes de entregar nada. <code>Permanently added</code> confirma la escritura en <code>known_hosts</code>; por eso la segunda conexión no pregunta: compara en silencio y coincide.</p>',
      'error' => '<p>Escribir <code>yes</code> sin comparar, o pensar que la contraseña «no se escribe» porque el teclado falla: simplemente no se muestra.</p>',
      'aprendiste' => 'a reconocer en la salida real la verificación del servidor y tu autenticación.',
  ]) ?>

  <?= ssh_ejercicio([
      'num' => '03',
      'titulo' => 'Verificar la huella',
      'nivel' => 'intermedio',
      'objetivo' => 'Objetivo: decidir con evidencia si una huella pertenece al servidor correcto.',
      'mision' => '<p>Comparar la huella vista por el cliente con la calculada en el servidor.</p>',
      'escenario' => '<p>Las figuras 06 y 07 del laboratorio, o tu propio servidor.</p>',
      'preparacion' => '<p>Acceso a la consola del servidor (o a quien lo administra) y a la salida de la primera conexión.</p>',
      'pasos' => [
          '<p>Copia la huella de la línea <code>ED25519 key fingerprint is</code> del cliente.</p>',
          ssh_term("\$ ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub", 'bash · en el servidor'),
      ],
      'observar' => '<p>El valor tras <code>SHA256:</code> en ambas salidas y el tipo de llave (ED25519) de cada una.</p>',
      'visual' => '<p>Figura 07, paneles ① y ②.</p>',
      'preguntas' => [
          '¿Coinciden las huellas? ¿Qué parte debes comparar y cuál no importa?',
          '¿Por qué no sirve comparar con la huella que te enseña la propia conexión dudosa?',
          '¿Qué responderías a la pregunta de SSH si tienes la huella verificada?',
      ],
      'pistas' => [
          '<p>La comparación solo vale si los dos datos llegan por caminos distintos.</p>',
          '<p>El comentario final (<code>root@buildkitsandbox</code>) no es parte de la huella.</p>',
          '<p>La pregunta admite <code>[fingerprint]</code> como respuesta.</p>',
      ],
      'solucion' => 'Coinciden (<code>SHA256:f/kLSUc2Jy9xR2JFOx4z932HIl6YXzi56MXyvqZuEYY</code>, ED25519): el cliente habla con ese servidor; se puede responder pegando la huella.',
      'porque' => '<p>El panel ① procede de la conexión; el ② del archivo de host key leído en el servidor. Si un intermediario hubiera presentado su clave, ① sería distinto de ②. Se compara el algoritmo y el resumen; el comentario es texto libre de la llave.</p>',
      'error' => '<p>Comparar solo los primeros caracteres, o comparar huellas de tipos distintos (ECDSA contra ED25519).</p>',
      'aprendiste' => 'que verificar es comparar por un canal independiente, no leer y aceptar.',
  ]) ?>

  <?= ssh_ejercicio([
      'num' => '04',
      'titulo' => 'known_hosts y una clave que cambia',
      'nivel' => 'intermedio',
      'objetivo' => 'Objetivo: interpretar el aviso de host key cambiada y resolverlo sin borrar known_hosts.',
      'mision' => '<p>Leer la figura 10, separar evidencia de hipótesis y decidir los pasos.</p>',
      'escenario' => '<p>Te conectas a <code>srv</code> y aparece <code>REMOTE HOST IDENTIFICATION HAS CHANGED</code>.</p>',
      'preparacion' => '<p>La figura 10 y las salidas reales de esta sección.</p>',
      'pasos' => [
          '<p>Localiza en la figura la huella nueva y la línea de <code>known_hosts</code> afectada.</p>',
          ssh_term("\$ ssh-keygen -lF servidor", 'bash'),
      ],
      'observar' => '<p>La línea «It is also possible that a host key has just been changed», el número tras <code>known_hosts:</code> y la huella nueva.</p>',
      'visual' => '<p>Figura 10, marcas ② a ⑤.</p>',
      'preguntas' => [
          '¿Qué puedes afirmar con la salida en la mano y qué no?',
          '¿Qué dato necesitas antes de ejecutar <code>ssh-keygen -R</code>?',
          '¿Por qué <code>ssh-keyscan</code> no resuelve la duda?',
      ],
      'pistas' => [
          '<p>Separa evidencia (lo que dice la salida) de interpretación (por qué pasó).</p>',
          '<p>La huella del aviso hay que confirmarla en el servidor o con su administrador.</p>',
          '<p>Piensa por qué red viaja la respuesta de <code>ssh-keyscan</code>.</p>',
      ],
      'solucion' => 'Evidencia: la clave presentada no coincide con la guardada. No se puede afirmar ni ataque ni reinstalación hasta comparar la huella nueva por un canal independiente; si coincide, <code>ssh-keygen -R servidor</code> y reconectar pegando la huella.',
      'porque' => '<p>El mensaje es idéntico en los dos escenarios. En el laboratorio se regeneraron las claves y la consola del servidor mostró <code>SHA256:KjYa/RXk2+RjRJdxHjmo1z9EW6ZEIGBcQ4vU81R0UTc</code>, igual que el aviso: cambio legítimo. <code>ssh-keyscan</code> consulta por la misma red dudosa, así que no aporta independencia.</p>',
      'error' => '<p>Borrar <code>~/.ssh/known_hosts</code> entero o escribir <code>yes</code> sin haber comparado.</p>',
      'aprendiste' => 'a tratar el aviso como una discrepancia que se explica con evidencia.',
  ]) ?>

  <?= evidence(
      '<p><code>Host key verification failed.</code> al final del aviso.</p>',
      '<p>La conexión se detuvo en el paso 4: TCP y negociación funcionaron y el cliente se negó a
      seguir.</p>',
      '<p>Que el servidor esté caído ni que tu llave o contraseña fallen: la autenticación del
      usuario ni siquiera empezó.</p>') ?>

  <?= ssh_cierre('Fundamentos',
      [
          'SSH aporta confidencialidad, integridad y autenticación en <strong>las dos direcciones</strong>.',
          '<code>ssh</code> es el cliente en tu equipo; <code>sshd</code> el servidor en la máquina remota.',
          'Una conexión son siete pasos y el error indica en cuál se detuvo.',
          'La huella se verifica comparándola por un canal independiente.',
          '<code>known_hosts</code> guarda las host keys aceptadas y se gestiona con <code>ssh-keygen -F/-lF/-R</code>.',
      ],
      [
          'ssh usuario@servidor',
          'ssh -p 2222 usuario@servidor',
          'ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub',
          'ssh-keygen -lF servidor',
          'ssh-keygen -R servidor',
      ],
      [
          'Que SSH no pregunte nada significa que comprobó y coincidió.',
          'Host key identifica al servidor; user key te identifica a ti.',
          'Un aviso de clave cambiada suele ser una reinstalación, pero se comprueba siempre.',
          'Cambiar el puerto reduce ruido; no controla el acceso.',
      ],
      '<p>Borrar <code>~/.ssh/known_hosts</code> para quitar un aviso. Elimina tu memoria de todos
      los servidores y acepta el nuevo sin verificar. Lo correcto es verificar la huella y usar
      <code>ssh-keygen -R</code> solo para ese host.</p>',
      [
          [
              'q' => 'Recibes el aviso de host key cambiada. ¿Cuál es el primer paso?',
              'opts' => ['A' => 'Borrar ~/.ssh/known_hosts', 'B' => 'Averiguar qué cambió y conseguir la huella nueva por otra vía', 'C' => 'Reintentar hasta que funcione', 'D' => 'Cambiar tu contraseña'],
              'ok' => 'B',
              'why' => 'A y C hacen desaparecer el aviso sin responder a su pregunta. Solo la huella comparada por un canal independiente distingue una reinstalación de una suplantación.',
          ],
          [
              'q' => '¿Dónde se guarda la llave pública del SERVIDOR que ya aceptaste?',
              'opts' => ['A' => 'En authorized_keys del servidor', 'B' => 'En tu ~/.ssh/known_hosts', 'C' => 'En tu id_ed25519.pub', 'D' => 'En /etc/ssh/sshd_config'],
              'ok' => 'B',
              'why' => '<code>known_hosts</code> es el registro de servidores conocidos del cliente. <code>authorized_keys</code> es el registro del servidor con las llaves de usuarios que puede dejar entrar.',
          ],
          [
              'q' => '<code>ssh -p 2222 srv</code> responde <code>Connection refused</code>. ¿En qué paso se detuvo?',
              'opts' => ['A' => 'Resolver el nombre', 'B' => 'Abrir la conexión TCP', 'C' => 'Verificar la host key', 'D' => 'Autenticarte'],
              'ok' => 'B',
              'why' => 'El nombre se resolvió (la salida muestra <code>servidor port 2222</code>) y la máquina respondió con una negativa: nadie escucha en ese puerto o un firewall rechaza activamente.',
          ],
          [
              'q' => '¿Qué garantiza responder a la pregunta de la huella pegando la huella en vez de «yes»?',
              'opts' => ['A' => 'Que la conexión vaya más rápida', 'B' => 'Que SSH compare la huella recibida con la que tú verificaste', 'C' => 'Que no se guarde en known_hosts', 'D' => 'Que no haga falta contraseña'],
              'ok' => 'B',
              'why' => 'Con la huella, la comparación la hace SSH carácter a carácter y solo continúa si coincide; con <code>yes</code> dependes de haber comparado bien a ojo.',
          ],
      ]) ?>
</section>

<?= ssh_parte('02', 'En el servidor',
    'Moverse, crear, copiar y borrar con cuidado, saber quién eres y qué corre.',
    'fundamentos') ?>

<!-- =============================== NAVEGAR ============================= -->
<section id="navegar">
  <h2>Navegar: <code>pwd</code>, <code>ls</code> y <code>cd</code></h2>
  <p class="tut-sub">Lo primero al entrar: saber en qué máquina estás, dónde estás y qué hay alrededor.</p>

  <p>Cuando la conexión termina, SSH no te enseña ningún escritorio: te deja delante de un
  <strong>prompt</strong> que espera órdenes. Todo lo que escribas a partir de ahí se ejecuta
  <strong>en el servidor</strong>, no en tu equipo. Por eso las tres primeras órdenes de
  cualquier sesión responden siempre a lo mismo: <em>¿quién soy?, ¿dónde estoy? y ¿qué hay
  aquí?</em></p>

  <?= note('Una analogía que ayuda',
      '<p>Entrar por SSH es como que te dejen a oscuras en un edificio que no conoces. Antes de
      mover nada enciendes la luz: <code>hostname</code> te dice en qué edificio estás,
      <code>pwd</code> en qué habitación y <code>ls</code> qué muebles hay. Mover muebles a
      oscuras es como se rompen las cosas.</p>', 'info') ?>

  <h3>El prompt cambia de máquina</h3>

  <p>Mira las dos primeras palabras de cada línea. Antes de conectar pone
  <code>alumno@laptop</code>; después, <code>alumno@servidor</code>. Es la señal más rápida
  de dónde se va a ejecutar lo que teclees. El formato habitual es
  <code>usuario@máquina:directorio$</code>, y <code>~</code> abrevia tu carpeta personal.</p>

  <?= anatomy(
      '<b>alumno</b>@<i>servidor</i>:<u>~/public_html</u>$',
      [
          ['alumno', 'El usuario con el que estás trabajando <strong>en esa máquina</strong>.'],
          ['servidor', 'El nombre de la máquina donde se ejecutan tus órdenes. Si pone <code>laptop</code>, sigues en tu equipo.'],
          ['~/public_html', 'El directorio actual. <code>~</code> es tu home: aquí, <code>/home/alumno</code>.'],
          ['$', 'Fin del prompt. Por convención, <code>$</code> para un usuario normal y <code>#</code> para root.'],
      ],
      'Leer el prompt') ?>

  <?= shot('ssh/11-primera-sesion.svg',
      'Terminal real dentro del servidor del laboratorio: whoami responde alumno, id muestra uid 1000, '
      . 'hostname responde servidor, pwd responde /home/alumno, ls lista backups, logs y public_html, '
      . 'y ls -la muestra los permisos y propietarios de cada carpeta.',
      '<b>Dónde mirar:</b> las respuestas de <code>hostname</code> y <code>pwd</code>. Son las dos '
      . 'comprobaciones que evitan la mayoría de los desastres: estás en la máquina que crees y en '
      . 'el directorio que crees.',
      'real') ?>

  <?= callouts([
      ['whoami', 'Con qué usuario estás trabajando. Aquí, <code>alumno</code>.'],
      ['hostname', 'En qué máquina estás. Aquí, <code>servidor</code>: confirmado que ya no es tu equipo.'],
      ['pwd', '<em>print working directory</em>: la ruta completa del directorio actual. Al entrar, tu home.'],
      ['ls -la', 'Lista <strong>todo</strong> (<code>-a</code>, también lo oculto) en formato largo (<code>-l</code>): permisos, dueño, tamaño y fecha.'],
  ]) ?>

  <h3>Las tres órdenes, una a una</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Órdenes básicas de navegación</caption>
      <thead><tr><th scope="col">Orden</th><th scope="col">Qué hace</th><th scope="col">Cuándo usarla</th></tr></thead>
      <tbody>
        <tr><td class="f">pwd</td><td class="d">Imprime la ruta absoluta del directorio actual.</td><td class="d">Antes de copiar, mover o borrar. Siempre.</td></tr>
        <tr><td class="f">ls</td><td class="d">Lista el contenido del directorio actual (o del que indiques).</td><td class="d">Para ver qué hay antes de actuar.</td></tr>
        <tr><td class="f">ls -la</td><td class="d">Lista todo, ocultos incluidos, con permisos, dueño, tamaño y fecha.</td><td class="d">Cuando importa quién es el dueño o qué permisos tiene algo.</td></tr>
        <tr><td class="f">cd carpeta</td><td class="d">Entra en <code>carpeta</code>.</td><td class="d">Para moverte.</td></tr>
        <tr><td class="f">cd ..</td><td class="d">Sube al directorio padre.</td><td class="d">Para volver un nivel atrás.</td></tr>
        <tr><td class="f">cd</td><td class="d">Sin argumentos, vuelve a tu home.</td><td class="d">Cuando te has perdido.</td></tr>
      </tbody>
    </table>
  </div>

  <p>Así se ve moverse dentro de la web del laboratorio. Fíjate en que el prompt refleja el
  directorio en cada paso:</p>

  <?= ssh_term(<<<'TXT'
alumno@servidor:~$ cd public_html
alumno@servidor:~/public_html$ pwd
/home/alumno/public_html
alumno@servidor:~/public_html$ ls -la
total 16
drwxr-sr-x 3 alumno alumno 4096 Sep 14 18:03 .
drwxr-sr-x 1 alumno alumno 4096 Sep 14 18:03 ..
drwxr-sr-x 2 alumno alumno 4096 Sep 14 18:03 assets
-rw-r--r-- 1 alumno alumno   19 Sep 14 18:03 index.php
alumno@servidor:~/public_html$ cd ..
alumno@servidor:~$ ls -la ~/public_html/assets
total 12
drwxr-sr-x 2 alumno alumno 4096 Sep 14 18:03 .
drwxr-sr-x 3 alumno alumno 4096 Sep 14 18:03 ..
-rw-r--r-- 1 alumno alumno   15 Sep 14 18:03 app.css
TXT, 'salida real · laboratorio') ?>

  <?= anatomy(
      '<b>drwxr-sr-x</b> <i>3</i> <u>alumno alumno</u> 4096 Sep 14 18:03 <b>assets</b>',
      [
          ['drwxr-sr-x', 'Tipo y permisos. La <code>d</code> inicial dice que es un directorio; una <code>-</code> sería un archivo. Lo verás a fondo en «Permisos Linux».'],
          ['3', 'Número de enlaces. Para empezar, puedes ignorarlo.'],
          ['alumno alumno', 'Propietario y grupo.'],
          ['4096 Sep 14 18:03', 'Tamaño en bytes y fecha de la última modificación.'],
          ['assets', 'El nombre. <code>.</code> es el propio directorio y <code>..</code> el padre: por eso aparecen en todo <code>ls -a</code>.'],
      ],
      'Una línea de ls -la') ?>

  <?= pitfall('<p>Dar por hecho que sigues en tu equipo, o en el servidor, sin mirar el prompt.
      Con dos terminales abiertas —una local y otra por SSH— es facilísimo ejecutar un
      <code>rm</code> en la ventana equivocada. La costumbre profesional es sencilla: antes de
      cualquier orden que cambie algo, <code>hostname</code> y <code>pwd</code>.</p>') ?>
</section>

<!-- ================================ RUTAS ============================== -->
<section id="rutas">
  <h2>Rutas absolutas y relativas</h2>
  <p class="tut-sub">Dos formas de decir dónde está algo: desde la raíz o desde donde estás.</p>

  <p>Todo en Linux cuelga de un único árbol cuya raíz es <code>/</code>. Una ruta es el camino
  por ese árbol hasta un archivo o directorio, y se puede escribir de dos maneras:</p>

  <ul>
    <li><strong>Absoluta</strong>: empieza por <code>/</code> y describe el camino completo
    desde la raíz. <code>/home/alumno/public_html/assets</code> significa lo mismo estés donde
    estés.</li>
    <li><strong>Relativa</strong>: no empieza por <code>/</code> y se interpreta <em>desde el
    directorio actual</em>. <code>assets</code> solo apunta a la carpeta correcta si estás en
    <code>public_html</code>.</li>
  </ul>

  <?= shot('ssh/12-arbol-rutas.svg',
      'Árbol del home del alumno con backups, logs y public_html, que contiene assets e index.php. '
      . 'A la derecha, la carpeta assets alcanzada con la ruta absoluta y con dos rutas relativas '
      . 'desde public_html y desde logs.',
      '<b>Dónde mirar:</b> las tres cajas de la derecha llevan <strong>al mismo sitio</strong>. '
      . 'Lo único que cambia es desde dónde se empieza a contar.') ?>

  <?= ssh_tree(<<<'TXT'
/home/alumno/
├── backups/
├── logs/
│   └── app.log
└── public_html/
    ├── assets/
    │   └── app.css
    └── index.php
TXT, 'el home del laboratorio') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Símbolos de las rutas</caption>
      <thead><tr><th scope="col">Símbolo</th><th scope="col">Significa</th><th scope="col">Ejemplo</th></tr></thead>
      <tbody>
        <tr><td class="f">/</td><td class="d">La raíz del sistema (al principio de la ruta).</td><td class="d"><code>/etc/ssh</code></td></tr>
        <tr><td class="f">~</td><td class="d">Tu home. Lo expande la shell.</td><td class="d"><code>~/logs</code> = <code>/home/alumno/logs</code></td></tr>
        <tr><td class="f">.</td><td class="d">El directorio actual.</td><td class="d"><code>./index.php</code></td></tr>
        <tr><td class="f">..</td><td class="d">El directorio padre.</td><td class="d"><code>../logs</code> desde <code>public_html</code></td></tr>
      </tbody>
    </table>
  </div>

  <?= compare(
      ['Ruta absoluta', 'empieza por /',
       '<ul>
          <li>Significa lo mismo desde cualquier directorio.</li>
          <li>Ideal en scripts, cron y comandos remotos.</li>
          <li>Más larga de escribir.</li>
          <li>Un error de tecleo apunta a otro sitio real.</li>
        </ul>'],
      ['Ruta relativa', 'depende de dónde estés',
       '<ul>
          <li>Corta y cómoda en una sesión interactiva.</li>
          <li>Su significado cambia al hacer <code>cd</code>.</li>
          <li>Peligrosa si no sabes dónde estás.</li>
          <li>Por eso <code>pwd</code> antes de usarla.</li>
        </ul>'],
      'En una sesión interactiva usa lo que quieras, pero comprueba con <code>pwd</code>. En un
       script o en una orden que borra, prefiere la ruta absoluta.') ?>

  <?= pitfall('<p>Escribir <code>cd public_html/assets</code> desde <code>~/logs</code> y
      recibir <code>No such file or directory</code>. La carpeta existe; lo que no existe es
      <code>~/logs/public_html</code>. Una ruta relativa siempre se lee desde el directorio
      actual, no desde el home.</p>') ?>
</section>

<!-- =============================== FICHEROS ============================ -->
<section id="ficheros">
  <h2>Crear, copiar y mover: <code>mkdir</code>, <code>cp</code> y <code>mv</code></h2>
  <p class="tut-sub">Tres órdenes que cambian cosas. Úsalas sabiendo dónde estás.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Órdenes para archivos y directorios</caption>
      <thead><tr><th scope="col">Orden</th><th scope="col">Qué hace</th><th scope="col">Detalle que importa</th></tr></thead>
      <tbody>
        <tr><td class="f">mkdir pruebas</td><td class="d">Crea el directorio <code>pruebas</code>.</td><td class="d"><code>mkdir -p a/b/c</code> crea también los intermedios y no falla si ya existen.</td></tr>
        <tr><td class="f">cp origen destino</td><td class="d">Copia un archivo.</td><td class="d">Si el destino existe, <strong>lo sobrescribe sin preguntar</strong>. Para directorios, <code>cp -r</code>.</td></tr>
        <tr><td class="f">mv origen destino</td><td class="d">Mueve o renombra.</td><td class="d">Renombrar es mover al mismo directorio con otro nombre. También sobrescribe.</td></tr>
      </tbody>
    </table>
  </div>

  <p>Así se hizo en el servidor del laboratorio: una carpeta de pruebas, una copia de
  <code>index.php</code> y un cambio de nombre. Todo dentro de algo que acabamos de crear.</p>

  <?= ssh_term(<<<'TXT'
alumno@servidor:~$ mkdir pruebas
alumno@servidor:~$ cp public_html/index.php pruebas/
alumno@servidor:~$ ls pruebas
index.php
alumno@servidor:~$ mv pruebas/index.php pruebas/copia.php
alumno@servidor:~$ ls pruebas
copia.php
TXT, 'salida real · laboratorio') ?>

  <?= anatomy(
      '<b>cp</b> <i>public_html/index.php</i> <u>pruebas/</u>',
      [
          ['cp', 'Copiar. El original no se toca.'],
          ['public_html/index.php', 'Origen: ruta relativa desde el home, que es donde estábamos.'],
          ['pruebas/', 'Destino. La barra final deja claro que es un directorio: el archivo entra dentro con su nombre.'],
      ]) ?>

  <p><strong>Qué observar:</strong> ni <code>mkdir</code>, ni <code>cp</code>, ni
  <code>mv</code> dicen nada cuando funcionan. En Linux, el silencio significa éxito. Por eso
  después de cada cambio hay un <code>ls</code> que lo confirma.</p>

  <?= note('Antes de tocar un archivo que ya funciona',
      '<p>Si vas a editar algo en producción, primero una copia con fecha junto al original:</p>
      <p><code>cp index.php index.php.bak-20260914</code></p>
      <p>Cuesta dos segundos y convierte un error en un <code>mv</code> de vuelta. En la parte
      de despliegues verás cómo hacerlo de forma sistemática.</p>') ?>

  <?= pitfall('<p>Pensar que <code>cp</code> o <code>mv</code> avisan antes de pisar un archivo
      existente. Por defecto no lo hacen: <code>cp nuevo.php index.php</code> reemplaza
      <code>index.php</code> en silencio. Si dudas, <code>ls</code> del destino primero, o usa
      <code>-i</code> para que pregunten.</p>') ?>
</section>

<!-- ================================== RM =============================== -->
<section id="rm">
  <h2><code>rm</code> no tiene papelera</h2>
  <p class="tut-sub">La orden más útil y la más peligrosa de una sesión remota.</p>

  <p><code>rm</code> elimina archivos. No los mueve a ninguna papelera: el espacio queda libre
  y el archivo desaparece. En una sesión SSH <strong>no existe una papelera universal</strong>
  ni un «deshacer»; lo único que devuelve un archivo borrado es una copia de seguridad.</p>

  <?= shot('ssh/13-rm-sin-papelera.svg',
      'Comparación: en un escritorio gráfico, borrar manda el archivo a la papelera y se puede '
      . 'restaurar; en una sesión SSH, rm lo elimina y solo un backup lo devuelve.',
      '<b>Dónde mirar:</b> la tercera línea de cada lado. En el escritorio hay «Restaurar»; en la '
      . 'terminal, solo el backup que hicieras antes.') ?>

  <h3>Borrar un archivo y borrar un directorio</h3>

  <?= ssh_term(<<<'TXT'
alumno@servidor:~$ rm pruebas
rm: cannot remove 'pruebas': Is a directory
alumno@servidor:~$ rm pruebas/copia.php
alumno@servidor:~$ rm -r pruebas
alumno@servidor:~$ ls
backups  demo-con-barra  demo-sin-barra  informe.txt  logs  public_html  repos
TXT, 'salida real · laboratorio') ?>

  <?= callouts([
      ['rm pruebas', '<code>rm</code> a secas se niega con los directorios. Ese error es una protección, no un fallo.'],
      ['rm pruebas/copia.php', 'Borra un archivo concreto. Sin mensaje: ya no está.'],
      ['rm -r pruebas', '<code>-r</code> (recursivo) borra el directorio y <strong>todo lo que contenga</strong>. Aquí estaba vacío; si no, se iría también su contenido.'],
  ]) ?>

  <?= anatomy(
      '<b>rm</b> <i>-r</i> <u>pruebas</u>',
      [
          ['rm', 'Eliminar. Sin confirmación.'],
          ['-r', 'Recursivo: entra en el directorio y borra todo su árbol.'],
          ['pruebas', 'Qué se borra, relativo al directorio actual. Por eso importa tanto <code>pwd</code>.'],
      ]) ?>

  <h3>Hábitos que evitan desastres</h3>

  <?= steps([
      '<strong><code>hostname</code> y <code>pwd</code></strong>: estás en la máquina y el directorio que crees.',
      '<strong><code>ls</code> de exactamente lo que vas a borrar</strong>, con la misma ruta que usarás en <code>rm</code>.',
      '<strong>Rutas entre comillas</strong> si tienen espacios: <code>rm "copia vieja.php"</code>. Sin comillas, <code>rm</code> recibe dos nombres distintos.',
      '<strong><code>rm -i</code></strong> cuando no estés seguro: pregunta antes de cada archivo.',
      '<strong>Nunca</strong> <code>rm -r</code> sobre una ruta construida con variables que no has comprobado, ni desde un directorio que no has mirado.',
  ]) ?>

  <?= evidence(
      '<p>Tras un <code>rm -r</code>, el directorio ya no aparece en <code>ls</code>.</p>',
      '<p>El borrado se completó. Linux no guarda una papelera para las órdenes de terminal.</p>',
      '<p>Que se pueda recuperar «de algún sitio». Quizá el proveedor de hosting tenga copias,
      o quizá no, y restaurarlas puede tardar o costar. Lo único con lo que puedes contar es
      con el backup que <em>tú</em> hiciste antes.</p>') ?>

  <?= pitfall('<p>Copiar de internet una orden con <code>rm -rf</code> «para limpiar» sin
      entender qué ruta borra. <code>-f</code> suprime incluso los avisos que te habrían
      salvado. Si no sabes exactamente qué borra una orden, no la ejecutes en un servidor.</p>') ?>
</section>

<!-- =============================== USUARIOS ============================ -->
<section id="usuarios">
  <h2>Quién eres: <code>whoami</code>, <code>id</code> y <code>groups</code></h2>
  <p class="tut-sub">En el servidor no eres «tú»: eres una cuenta con un número, unos grupos y unos permisos.</p>

  <p>Todo lo que haces por SSH lo hace un <strong>usuario del servidor</strong>. De ese usuario
  dependen los archivos que puedes leer, los que puedes cambiar y si puedes administrar el
  sistema. Saber quién eres no es burocracia: explica la mitad de los
  <code>Permission denied</code> que verás.</p>

  <?= ssh_term(<<<'TXT'
alumno@servidor:~$ whoami
alumno
alumno@servidor:~$ id
uid=1000(alumno) gid=1000(alumno) groups=1000(alumno)
alumno@servidor:~$ groups
alumno
TXT, 'salida real · laboratorio') ?>

  <?= anatomy(
      '<b>uid=1000(alumno)</b> <i>gid=1000(alumno)</i> <u>groups=1000(alumno)</u>',
      [
          ['uid=1000(alumno)', 'El identificador numérico del usuario. El sistema trabaja con el número; el nombre es para las personas. <code>uid=0</code> es root.'],
          ['gid=1000(alumno)', 'El grupo principal: el que reciben por defecto los archivos que creas.'],
          ['groups=…', 'Todos los grupos a los que perteneces. Pertenecer a un grupo da los permisos de «grupo» de sus archivos.'],
      ],
      'La salida de id') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Diferencias entre whoami, id y groups</caption>
      <thead><tr><th scope="col">Orden</th><th scope="col">Responde a</th><th scope="col">Úsala cuando</th></tr></thead>
      <tbody>
        <tr><td class="f">whoami</td><td class="d">¿Con qué usuario estoy ejecutando?</td><td class="d">Dudas de si entraste con la cuenta correcta o si estás en una shell de root.</td></tr>
        <tr><td class="f">id</td><td class="d">Usuario, grupo principal y grupos, con sus números.</td><td class="d">Investigas un problema de permisos.</td></tr>
        <tr><td class="f">groups</td><td class="d">Solo los nombres de los grupos.</td><td class="d">Quieres saber rápido si estás, por ejemplo, en <code>www-data</code> o <code>wheel</code>.</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('En un hosting compartido',
      '<p>Tu usuario suele ser el nombre de la cuenta que te asignó el proveedor, y no
      pertenecerás a grupos de administración. Es normal: administras <em>tu</em> cuenta, no el
      servidor. Si una orden necesita privilegios que no tienes, la respuesta es el panel o el
      soporte del proveedor, no buscar la forma de saltárselo.</p>', 'info') ?>

  <?= pitfall('<p>Suponer que el usuario remoto es el mismo que el local porque «se llama
      igual». Son cuentas de máquinas distintas: pueden tener números, grupos y permisos
      totalmente diferentes. <code>id</code> en el servidor es la única respuesta fiable.</p>') ?>
</section>

<!-- =============================== ROOT SUDO =========================== -->
<section id="root-sudo">
  <h2>root y <code>sudo</code></h2>
  <p class="tut-sub">El usuario que lo puede todo, y la forma responsable de pedirle un favor.</p>

  <p><strong>root</strong> es el administrador de un sistema Linux: el usuario con
  <code>uid=0</code>, al que no se le aplican las comprobaciones de permisos. Puede leer
  cualquier archivo, cambiar cualquier configuración… y borrar el sistema entero sin que nadie
  le pregunte si está seguro.</p>

  <?= shot('ssh/14-root-sudo.svg',
      'Tres columnas: el usuario normal con prompt terminado en dólar, sudo que concede privilegio '
      . 'de root para un solo comando tras pedir la contraseña del usuario, y la shell de root con '
      . 'prompt terminado en almohadilla.',
      '<b>Dónde mirar:</b> la flecha del centro. <code>sudo</code> es un privilegio '
      . '<strong>temporal y registrado</strong> para una orden; después vuelves a ser tú.') ?>

  <h3>El prompt: <code>$</code> y <code>#</code></h3>

  <p>Por convención, el prompt de un usuario normal termina en <code>$</code> y el de root en
  <code>#</code>. Es una pista muy útil, pero <strong>no una garantía</strong>: el prompt es
  configurable. Si necesitas estar seguro, <code>whoami</code>.</p>

  <h3>Cómo funciona <code>sudo</code></h3>

  <?= ssh_term(<<<'TXT'
alumno@servidor:~$ sudo whoami

We trust you have received the usual lecture from the local System
Administrator. It usually boils down to these three things:

    #1) Respect the privacy of others.
    #2) Think before you type.
    #3) With great power comes great responsibility.

For security reasons, the password you type will not be visible.

[sudo] password for alumno:
root
TXT, 'salida real · laboratorio') ?>

  <?= callouts([
      ['El aviso', 'Aparece la primera vez que un usuario usa <code>sudo</code>. Resume bien la actitud correcta.'],
      ['password for alumno', 'Pide la contraseña <strong>de alumno</strong>, no la de root. <code>sudo</code> comprueba que eres tú y que tienes permiso para usarlo.'],
      ['root', 'La orden <code>whoami</code> se ejecutó como root. La siguiente orden sin <code>sudo</code> vuelve a ser de alumno.'],
  ]) ?>

  <?= anatomy(
      '<b>sudo</b> <i>whoami</i>',
      [
          ['sudo', 'Ejecuta la orden siguiente con privilegios de root, si la configuración de sudo lo permite para tu usuario. Queda registrado.'],
          ['whoami', 'La orden que se eleva. Solo esa.'],
      ]) ?>

  <?= compare(
      ['Trabajar con sudo', 'privilegio por orden',
       '<ul>
          <li>Eres un usuario normal casi todo el tiempo.</li>
          <li>Cada orden privilegiada es una decisión consciente.</li>
          <li>Queda rastro de quién hizo qué.</li>
          <li>Un error de tecleo sin <code>sudo</code> no destruye el sistema.</li>
        </ul>'],
      ['Trabajar como root', 'privilegio permanente',
       '<ul>
          <li>Todas las órdenes tienen poder total.</li>
          <li>No hay pausa antes de lo peligroso.</li>
          <li>Se pierde el rastro individual.</li>
          <li>Un <code>rm</code> en el directorio equivocado no tiene freno.</li>
        </ul>'],
      'Entra como tu usuario y usa <code>sudo</code> solo para la orden que lo necesita. Abrir una
       shell de root «para no escribir sudo cada vez» no es un atajo: es quitarte el cinturón.') ?>

  <?= pitfall('<p>Responder a cualquier <code>Permission denied</code> repitiendo la orden con
      <code>sudo</code>. A veces es lo correcto, pero muchas veces el error te está diciendo que
      estás tocando algo que no es tuyo, o que el archivo está en otro sitio. Primero entiende
      por qué se deniega; después decide si hace falta privilegio.</p>') ?>
</section>

<!-- ============================ PERMISOS LINUX ========================= -->
<section id="permisos-linux">
  <h2>Permisos Linux</h2>
  <p class="tut-sub">Diez caracteres que deciden quién lee, quién escribe y quién entra. SSH depende de ellos.</p>

  <p>Cada archivo y directorio tiene un <strong>propietario</strong>, un <strong>grupo</strong>
  y tres juegos de permisos: uno para el propietario, otro para el grupo y otro para todos los
  demás. Entenderlo no es opcional en este curso: OpenSSH se niega a usar una llave privada o
  un <code>authorized_keys</code> con permisos demasiado abiertos, y lo verás en la parte de
  llaves.</p>

  <?= shot('ssh/15-permisos-rwx.svg',
      'La cadena de permisos -rw------- dividida en tipo, propietario, grupo y otros; debajo, '
      . 'r vale 4, w vale 2 y x vale 1, y los ejemplos 600, 644 y 700.',
      '<b>Dónde mirar:</b> los tres bloques de tres letras. Siempre en el mismo orden: '
      . '<strong>propietario, grupo, otros</strong>.') ?>

  <h3>Las tres letras</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Significado de r, w y x</caption>
      <thead><tr><th scope="col">Letra</th><th scope="col">Valor</th><th scope="col">En un archivo</th><th scope="col">En un directorio</th></tr></thead>
      <tbody>
        <tr><td class="f">r</td><td class="d">4</td><td class="d">Leer el contenido.</td><td class="d">Listar los nombres que contiene.</td></tr>
        <tr><td class="f">w</td><td class="d">2</td><td class="d">Modificarlo.</td><td class="d">Crear, borrar o renombrar lo que hay dentro.</td></tr>
        <tr><td class="f">x</td><td class="d">1</td><td class="d">Ejecutarlo como programa.</td><td class="d">Entrar en él (<code>cd</code>) y acceder a lo de dentro.</td></tr>
        <tr><td class="f">-</td><td class="d">0</td><td class="d">Ese permiso no está.</td><td class="d">Ese permiso no está.</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Del texto al número</h3>

  <p>Cada bloque se suma: <code>rw-</code> = 4 + 2 + 0 = <strong>6</strong>; <code>r--</code>
  = <strong>4</strong>; <code>rwx</code> = <strong>7</strong>; <code>---</code> =
  <strong>0</strong>. Tres bloques, tres cifras.</p>

  <?= anatomy(
      '<b>-</b><i>rw-</i><u>r--</u>r--',
      [
          ['-', 'Tipo: archivo normal. Una <code>d</code> sería directorio y una <code>l</code> un enlace simbólico.'],
          ['rw-', 'Propietario: lee y escribe → 6.'],
          ['r--', 'Grupo: solo lee → 4.'],
          ['r--', 'Otros: solo leen → 4. En total, <code>644</code>.'],
      ],
      'Leer -rw-r--r--') ?>

  <p>En el servidor del laboratorio, la web y la carpeta de llaves tienen permisos muy
  distintos, y por buenas razones:</p>

  <?= ssh_term(<<<'TXT'
alumno@servidor:~$ ls -ld public_html ~/.ssh ~/.ssh/authorized_keys
drwx--S--- 2 alumno alumno 4096 Sep 14 18:05 /home/alumno/.ssh
-rw------- 1 alumno alumno   95 Sep 14 18:05 /home/alumno/.ssh/authorized_keys
drwxr-sr-x 3 alumno alumno 4096 Sep 14 18:08 public_html
TXT, 'salida real · laboratorio') ?>

  <?= callouts([
      ['~/.ssh → drwx--S---', 'Directorio (<code>d</code>) donde solo alumno lee, escribe y entra (<code>rwx</code>). Grupo y otros no tienen nada: en la práctica, <code>700</code>.'],
      ['authorized_keys → -rw-------', 'Archivo que solo alumno puede leer y escribir: <code>600</code>. Si otro usuario pudiera escribirlo, podría añadir su llave y entrar como alumno.'],
      ['public_html → drwxr-sr-x', 'Todos pueden entrar y listar (<code>r-x</code>), solo alumno modifica. Es lo razonable para lo que sirve una web.'],
  ]) ?>

  <?= note('¿Y esa s y esa S en el lugar del grupo?',
      '<p>En el laboratorio (Alpine Linux) los directorios del home tienen activado el bit
      <strong>setgid</strong>, que se muestra en la posición de la <code>x</code> del grupo: los
      archivos creados dentro heredan el grupo del directorio. Una <code>s</code> minúscula
      significa setgid <em>con</em> <code>x</code> para el grupo; una <code>S</code> mayúscula,
      setgid <em>sin</em> <code>x</code>. No cambia lo que importa aquí: en <code>~/.ssh</code> el
      grupo sigue sin poder entrar. En tu distribución puede no aparecer, y es normal.</p>', 'info') ?>

  <h3>Cambiar permisos con <code>chmod</code></h3>

  <?= ssh_term(<<<'TXT'
$ chmod 700 ~/.ssh
$ chmod 600 ~/.ssh/authorized_keys
$ ls -ld ~/.ssh ~/.ssh/authorized_keys
TXT, 'bash') ?>

  <?= anatomy(
      '<b>chmod</b> <i>600</i> <u>~/.ssh/authorized_keys</u>',
      [
          ['chmod', '<em>change mode</em>: cambia los permisos. Solo el propietario (o root) puede hacerlo.'],
          ['600', 'Propietario 6 (<code>rw-</code>), grupo 0, otros 0.'],
          ['~/.ssh/authorized_keys', 'El archivo al que se aplica. Comprueba después con <code>ls -l</code>.'],
      ]) ?>

  <?= evidence(
      '<p>Un archivo muestra <code>-rw-rw-rw-</code> (666) en el servidor.</p>',
      '<p>Cualquier usuario de esa máquina puede modificarlo. Si es un archivo de configuración,
      una clave o un script que se ejecuta, es un problema de seguridad que hay que corregir.</p>',
      '<p>Que alguien lo haya modificado. Los permisos dicen quién <em>podría</em>, no quién
      <em>lo hizo</em>. Para eso hacen falta fechas, logs o una copia con la que comparar.</p>') ?>

  <?= pitfall('<p>Arreglar un problema de permisos con <code>chmod 777</code> «para que
      funcione». Funciona porque le da todo a todos, que es exactamente lo contrario de lo que
      quieres en un servidor. Y en SSH ni siquiera funciona: OpenSSH rechaza llaves y
      <code>authorized_keys</code> demasiado abiertos.</p>') ?>
</section>

<!-- =============================== PROCESOS ============================ -->
<section id="procesos">
  <h2>Procesos: <code>ps</code> y <code>top</code></h2>
  <p class="tut-sub">Qué está corriendo en el servidor, quién lo lanzó y cuánto consume.</p>

  <p>Un <strong>proceso</strong> es un programa en ejecución. En un servidor hay muchos: el
  servidor web, la base de datos, <code>sshd</code> y, mientras estás conectado, tu propia
  shell. Cuando algo va lento o un servicio «no responde», lo primero es mirar qué corre.</p>

  <h3>Tus procesos y todos los procesos</h3>

  <?= ssh_term(<<<'TXT'
alumno@servidor:~$ ps
    PID TTY          TIME CMD
    226 pts/0    00:00:00 bash
    237 pts/0    00:00:00 ps
alumno@servidor:~$ ps aux
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.0   7128  2532 ?        Ss   18:03   0:00 sleep infinit
root          14  0.0  0.0      0     0 ?        Zs   18:03   0:00 [sshd] <defun
root          15  0.0  0.1   6752  3844 ?        S    18:03   0:00 sshd: /usr/sb
root          23  0.0  0.4  23212 16260 ?        S    18:03   0:00 python3 -m ht
root         223  0.0  0.1   7220  5404 ?        Ss   18:08   0:00 sshd-session:
alumno       225  0.3  0.1   7516  4620 ?        S    18:08   0:00 sshd-session:
alumno       226  0.0  0.0   2596  2328 pts/0    Ss   18:08   0:00 -bash
alumno       238  0.0  0.0   2860  1968 pts/0    R+   18:09   0:00 ps aux
TXT, 'salida real · laboratorio') ?>

  <?= callouts([
      ['ps', 'Solo los procesos de tu terminal actual: tu <code>bash</code> y el propio <code>ps</code>.'],
      ['ps aux', 'Todos los procesos del sistema, de todos los usuarios. Las columnas <code>COMMAND</code> aparecen recortadas al ancho de la terminal.'],
      ['sshd: /usr/sb… (root)', 'El demonio <code>sshd</code> que escucha conexiones nuevas. Corre como root.'],
      ['sshd-session: (root y alumno)', 'Tu propia conexión SSH: una parte privilegiada y otra que ya corre como alumno. Existe mientras estés conectado.'],
      ['-bash', 'Tu shell. El guion delante indica una shell de inicio de sesión.'],
  ]) ?>

  <?= anatomy(
      '<b>ps</b> <i>aux</i>',
      [
          ['a', 'Procesos de todos los usuarios, no solo los tuyos.'],
          ['u', 'Formato orientado a usuario: columnas USER, %CPU, %MEM.'],
          ['x', 'Incluye los procesos sin terminal asociada, como los demonios (TTY <code>?</code>).'],
      ],
      'Las letras de ps aux') ?>

  <p>El laboratorio es un contenedor, así que la lista es muy corta. En un servidor real verás
  decenas o cientos de líneas; lo habitual es filtrar: <code>ps aux | grep sshd</code>.</p>

  <h3>Una foto en movimiento: <code>top</code></h3>

  <?= ssh_term(<<<'TXT'
alumno@servidor:~$ top -b -n 1 | head -12
top - 18:09:04 up  3:17,  0 user,  load average: 0.16, 0.03, 0.01
Tasks:   9 total,   1 running,   7 sleeping,   0 stopped,   1 zombie
%Cpu(s):  0.0 us,  0.0 sy,  0.0 ni,100.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   3741.3 total,   1900.8 free,   1138.6 used,    982.0 buff/cache
MiB Swap:   1024.0 total,   1024.0 free,      0.0 used.   2602.8 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
      1 root      20   0    7128   2532   1888 S   0.0   0.1   0:00.01 sleep
     14 root      20   0       0      0      0 Z   0.0   0.0   0:00.00 sshd
     15 root      20   0    6752   3844   2728 S   0.0   0.1   0:00.04 sshd
     23 root      20   0   23212  16260   6716 S   0.0   0.4   0:00.10 python3
    223 root      20   0    7220   5404   4320 S   0.0   0.1   0:00.01 sshd-se+
TXT, 'salida real · laboratorio') ?>

  <?= anatomy(
      '<b>top</b> <i>-b -n 1</i> | <u>head -12</u>',
      [
          ['top', 'Monitor de procesos. Normalmente es interactivo y se refresca solo; se sale con <kbd>q</kbd>.'],
          ['-b -n 1', 'Modo por lotes (<code>-b</code>) y una sola iteración (<code>-n 1</code>): imprime una foto y termina. Útil para copiarla o guardarla.'],
          ['head -12', 'Solo las 12 primeras líneas: el resumen y los primeros procesos.'],
      ]) ?>

  <?= callouts([
      ['load average', 'Carga media del último minuto, 5 y 15 minutos. Compárala con el número de CPU del servidor.'],
      ['Tasks … 1 zombie', 'Un proceso terminado cuyo padre aún no ha recogido su estado. Uno aislado no suele ser grave; muchos creciendo, sí.'],
      ['%Cpu(s) · id', '<code>id</code> es el porcentaje de CPU ociosa. 100 = sin trabajo.'],
      ['MiB Mem', 'Memoria total, libre, usada y en caché. «avail Mem» es la que realmente queda disponible.'],
  ]) ?>

  <?= note('top, htop y SSH',
      '<p><code>top</code> sin opciones y <code>htop</code> —una versión más visual, instalada en
      el laboratorio pero que no reproducimos aquí— son <strong>interactivos</strong>: necesitan
      una terminal. Funcionan en una sesión SSH normal; si los lanzas como orden remota
      (<code>ssh servidor top</code>) hay que pedir terminal con <code>ssh -t servidor top</code>.
      Para salir de ambos, <kbd>q</kbd>. En un hosting compartido <code>htop</code> puede no estar
      instalado, y solo verás tus propios procesos.</p>', 'info') ?>

  <?= evidence(
      '<p><code>ps aux</code> muestra un proceso que no reconoces consumiendo mucha CPU.</p>',
      '<p>Merece investigarse: qué usuario lo lanzó (<code>USER</code>), desde cuándo
      (<code>START</code>) y qué es (<code>COMMAND</code> completo con <code>ps -fp PID</code>).</p>',
      '<p>Que sea malicioso. Muchas tareas legítimas consumen CPU a ratos: copias de seguridad,
      indexadores, actualizaciones. Y matar un proceso sin saber qué es puede tumbar un
      servicio. Primero identificar, después decidir.</p>') ?>

  <?= pitfall('<p>Ver la columna <code>COMMAND</code> cortada —<code>sshd: /usr/sb</code>— y
      creer que ese es el nombre real del proceso. <code>ps</code> recorta al ancho de la
      terminal. Para ver la orden completa, <code>ps auxww</code> o <code>ps -fp PID</code>.</p>') ?>
</section>

<!-- ============================ PRÁCTICA LINUX ========================= -->
<section id="practica-linux">
  <h2>Práctica: en el servidor</h2>
  <p class="tut-sub">Moverse, crear y borrar solo lo tuyo, sabiendo en todo momento dónde estás.</p>

  <p>Este ejercicio se hace sobre tu propio laboratorio, una máquina virtual tuya o tu cuenta
  de hosting. Todo lo que crees y borres estará dentro de una carpeta de pruebas nueva: nada
  de lo que ya existía se toca.</p>

  <?= ssh_ejercicio([
      'num'       => '05',
      'titulo'    => 'Moverse por el servidor sin romper nada',
      'nivel'     => 'basico',
      'objetivo'  => 'Objetivo: navegar con rutas absolutas y relativas y crear, copiar, mover y borrar solo lo que creas tú.',
      'mision'    => '<p>Entra en el servidor, confirma dónde estás, crea una carpeta de pruebas con una copia de un archivo, renómbrala y deja el servidor exactamente como estaba.</p>',
      'escenario' => '<p>Tienes acceso por SSH a un servidor de laboratorio (o a tu hosting) con una web en <code>~/public_html</code>. Quieres practicar antes de tocar nada importante.</p>',
      'preparacion' => '<p>Una sesión abierta: <code>ssh &lt;USUARIO&gt;@&lt;IP-LAB&gt;</code>. Si tu servidor no tiene <code>public_html</code>, usa cualquier archivo pequeño de tu home.</p>',
      'pasos'     => [
          '<p>Confirma máquina, usuario y directorio:</p>'
          . ssh_term("$ hostname\n$ whoami\n$ pwd", 'bash'),
          '<p>Crea la carpeta de pruebas y copia un archivo dentro usando una ruta <strong>relativa</strong>:</p>'
          . ssh_term("$ mkdir pruebas\n$ cp public_html/index.php pruebas/\n$ ls pruebas", 'bash'),
          '<p>Renómbrala dentro de la misma carpeta y compruébalo con una ruta <strong>absoluta</strong>:</p>'
          . ssh_term("$ mv pruebas/index.php pruebas/copia.php\n$ ls -l ~/pruebas", 'bash'),
          '<p>Intenta borrar la carpeta con <code>rm</code> a secas, lee el error y después bórrala correctamente:</p>'
          . ssh_term("$ rm pruebas\n$ rm pruebas/copia.php\n$ rm -r pruebas\n$ ls", 'bash'),
      ],
      'observar'  => '<p>Que <code>mkdir</code>, <code>cp</code> y <code>mv</code> no imprimen nada al funcionar; que <code>rm pruebas</code> sí imprime un error; y que el <code>ls</code> final muestra lo mismo que había antes de empezar.</p>',
      'visual'    => ssh_term(<<<'TXT'
alumno@servidor:~$ rm pruebas
rm: cannot remove 'pruebas': Is a directory
alumno@servidor:~$ rm pruebas/copia.php
alumno@servidor:~$ rm -r pruebas
TXT, 'salida real · laboratorio'),
      'preguntas' => [
          '¿Qué ruta absoluta equivale a <code>pruebas/copia.php</code> si <code>pwd</code> devuelve <code>/home/alumno</code>?',
          'El mensaje <code>rm: cannot remove \'pruebas\': Is a directory</code>, ¿indica que algo se ha roto?',
          '¿Por qué conviene ejecutar <code>pwd</code> antes de <code>rm -r pruebas</code> y no después?',
      ],
      'pistas'    => [
          '<p>Una ruta relativa se lee desde el directorio actual; una absoluta, desde <code>/</code>.</p>',
          '<p>Fíjate en la última palabra del error y en qué borró —o no— esa orden.</p>',
          '<p><code>rm</code> sin <code>-r</code> no borra directorios a propósito; <code>rm -r</code> interpreta la ruta desde donde estés.</p>',
      ],
      'solucion'  => '<code>/home/alumno/pruebas/copia.php</code>; el error es una protección, no una avería; y <code>pwd</code> va antes porque <code>rm</code> no se puede deshacer.',
      'porque'    => '<p>La ruta relativa <code>pruebas/copia.php</code> se suma al directorio actual, <code>/home/alumno</code>, y da la absoluta. El error <code>Is a directory</code> sale porque <code>rm</code> sin <code>-r</code> se niega a borrar directorios: la orden no hizo nada, y el <code>ls</code> lo confirma. Por último, <code>rm -r pruebas</code> borraría <em>cualquier</em> carpeta llamada <code>pruebas</code> en el directorio actual; si estuvieras en otro sitio, borraría otra cosa. Comprobarlo después ya no sirve.</p>',
      'error'     => '<p>Ver el error de <code>rm</code> y «arreglarlo» con <code>rm -rf</code> sin mirar qué contiene la carpeta. El error te estaba avisando de que ibas a borrar un árbol entero.</p>',
      'aprendiste' => 'el silencio en Linux significa éxito, un error de rm puede ser una protección, y dónde estás decide qué borra una ruta relativa.',
  ]) ?>

  <?= ssh_cierre('En el servidor',
      [
          'Leer el prompt para saber en qué máquina y directorio se ejecuta cada orden.',
          'Moverte con <code>pwd</code>, <code>ls</code> y <code>cd</code>, y distinguir rutas absolutas de relativas.',
          'Crear, copiar y mover con <code>mkdir</code>, <code>cp</code> y <code>mv</code>, sabiendo que sobrescriben sin avisar.',
          'Que <code>rm</code> no tiene papelera y cómo borrar con hábitos seguros.',
          'Quién eres (<code>whoami</code>, <code>id</code>), qué es root y por qué se usa <code>sudo</code> por orden.',
          'Leer permisos <code>rwx</code> y sus números, y mirar procesos con <code>ps</code> y <code>top</code>.',
      ],
      [
          'hostname · whoami · pwd',
          'ls -la',
          'cd ruta · cd .. · cd',
          'mkdir -p · cp · mv',
          'rm archivo · rm -r carpeta · rm -i',
          'id · groups · sudo orden',
          'chmod 600 archivo · ls -ld',
          'ps aux · top (q para salir)',
      ],
      [
          '<code>hostname</code> y <code>pwd</code> antes de cualquier orden que cambie algo.',
          'El <code>$</code> y el <code>#</code> son convención; <code>whoami</code> es la prueba.',
          'Los permisos van en orden propietario, grupo, otros, y r=4, w=2, x=1.',
          'Un error de <code>rm</code> sin <code>-r</code> te protege; léelo antes de forzar.',
      ],
      '<p>Resolver problemas con <code>chmod 777</code>, <code>rm -rf</code> o trabajando
      permanentemente como root. Los tres «funcionan» quitando las protecciones que evitan los
      desastres, y en SSH el primero ni siquiera funciona.</p>',
      [
          [
              'q'    => 'Estás en /home/alumno/logs. ¿A dónde apunta la ruta ../public_html/index.php?',
              'opts' => ['A' => '/home/alumno/logs/public_html/index.php', 'B' => '/home/alumno/public_html/index.php', 'C' => '/public_html/index.php', 'D' => 'A ningún sitio: las rutas relativas no admiten ..'],
              'ok'   => 'B',
              'why'  => '<code>..</code> sube de <code>logs</code> a su padre, <code>/home/alumno</code>, y desde ahí se entra en <code>public_html</code>. La opción A olvida el <code>..</code>; la C confunde la ruta relativa con una absoluta.',
          ],
          [
              'q'    => '¿Qué permisos numéricos corresponden a -rw-r--r--?',
              'opts' => ['A' => '600', 'B' => '755', 'C' => '644', 'D' => '466'],
              'ok'   => 'C',
              'why'  => 'Propietario <code>rw-</code> = 4+2 = 6; grupo <code>r--</code> = 4; otros <code>r--</code> = 4. El orden siempre es propietario, grupo, otros, por eso D está al revés.',
          ],
          [
              'q'    => 'Ejecutas sudo whoami y te pide contraseña. ¿Qué contraseña es?',
              'opts' => ['A' => 'La de root', 'B' => 'La de tu propio usuario', 'C' => 'La passphrase de tu llave SSH', 'D' => 'La del panel del hosting'],
              'ok'   => 'B',
              'why'  => 'La salida real lo dice: <code>[sudo] password for alumno</code>. <code>sudo</code> comprueba que eres tú y que tu usuario tiene permiso para elevar; no necesita conocer la contraseña de root.',
          ],
          [
              'q'    => 'rm pruebas responde «Is a directory». ¿Qué ha pasado con la carpeta?',
              'opts' => ['A' => 'Se borró solo su contenido', 'B' => 'Se borró entera', 'C' => 'Nada: rm sin -r no borra directorios', 'D' => 'Quedó dañada'],
              'ok'   => 'C',
              'why'  => 'Es una negativa, no un borrado parcial. El <code>ls</code> posterior sigue mostrando la carpeta. Para borrar un directorio hace falta <code>-r</code>, y precisamente por eso se pide de forma explícita.',
          ],
      ]) ?>
</section>

<?= ssh_parte('03', 'Llaves SSH',
    'Autenticarte sin contraseñas adivinables y sin que el secreto salga de tu equipo.',
    'intermedio') ?>

<!-- ========================= CONTRASEÑA VS LLAVE ===================== -->
<section id="password-vs-llave">
  <h2>Contraseña frente a llave SSH</h2>
  <p class="tut-sub">Las dos te autentican. Solo una mantiene el secreto en tu equipo.</p>

  <p><strong>La idea sencilla:</strong> con una contraseña demuestras quién eres
  <em>diciendo</em> un secreto. Con una llave lo demuestras <em>haciendo</em> algo que solo
  puede hacer quien tiene el secreto, sin decirlo nunca.</p>

  <p><strong>La explicación técnica:</strong> con contraseña, el cliente envía la contraseña al
  servidor. Viaja cifrada dentro del canal SSH, así que nadie en el camino la lee, pero
  <strong>el servidor la recibe entera</strong>. Con llave, el servidor propone un reto ligado a
  esa sesión, el cliente lo <strong>firma</strong> con la llave privada y el servidor comprueba
  la firma con la llave pública que tiene guardada. La privada no sale de tu equipo.</p>

  <?= shot('ssh/16-password-vs-llave.svg',
      'Tabla comparativa entre contraseña y llave SSH en seis aspectos: si viaja el secreto, '
      . 'fuerza bruta, servidor suplantado, automatización, revocación y robo del archivo.',
      '<b>Dónde mirar:</b> la fila «Si el servidor está suplantado». Es la diferencia que no se '
      . 've a simple vista: con contraseña, un impostor se queda con ella; con llave, solo con '
      . 'una firma que no le sirve para entrar en ningún otro sitio.') ?>

  <?= note('Una analogía que se sostiene',
      '<p>La contraseña es decirle al portero la palabra clave: si el portero es falso, ya la
      sabe. La llave es firmar delante del portero con un sello que nunca sueltas: el portero
      comprueba la firma con una copia pública de tu sello, pero no puede fabricar tu sello a
      partir de ella.</p>', 'info') ?>

  <h3>Qué significa en la práctica</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Consecuencias prácticas de cada método</caption>
      <thead><tr><th scope="col">Situación</th><th scope="col">Con contraseña</th><th scope="col">Con llave</th></tr></thead>
      <tbody>
        <tr><td class="f">Bots probando combinaciones</td><td class="d">Riesgo real si es corta, común o repetida.</td><td class="d">No hay nada que adivinar por teclado.</td></tr>
        <tr><td class="f">Aceptaste una huella falsa</td><td class="d">El impostor recibe tu contraseña.</td><td class="d">El impostor no obtiene tu llave privada.</td></tr>
        <tr><td class="f">Un script de despliegue</td><td class="d">Tendrías que guardarla en claro: mala idea.</td><td class="d">Llave dedicada, sin secretos en el script.</td></tr>
        <tr><td class="f">Retirar el acceso a un portátil</td><td class="d">Cambiar la contraseña afecta a todos.</td><td class="d">Borras una línea de <code>authorized_keys</code>.</td></tr>
      </tbody>
    </table>
  </div>

  <?= pitfall('<p>Pensar que la llave «es más segura porque es más larga». La longitud ayuda,
      pero la diferencia de fondo es otra: <strong>el secreto no se transmite</strong>. Y la
      llave tampoco es magia: si alguien copia tu archivo de llave privada sin passphrase, entra
      como tú. Por eso existen la passphrase y los permisos, que verás en esta parte.</p>') ?>

  <?= evidence(
      '<p>Un servidor acepta llaves y contraseñas, y en sus logs aparecen cientos de intentos
      <code>Failed password</code> desde direcciones distintas.</p>',
      '<p>Hay bots probando contraseñas contra el puerto SSH, algo muy habitual en cualquier
      máquina expuesta a internet.</p>',
      '<p>Que alguien haya entrado, ni que ese servidor esté siendo atacado de forma dirigida. Los
      intentos fallidos son ruido de fondo; lo que hay que buscar son los <code>Accepted</code>
      que no reconoces. Y usar llaves no hace desaparecer los intentos: los deja sin
      posibilidades.</p>') ?>
</section>

<!-- ========================= LLAVE PÚBLICA Y PRIVADA ================= -->
<section id="llave-publica">
  <h2>Llave pública y llave privada</h2>
  <p class="tut-sub">Un par de archivos que nacen juntos y hacen trabajos opuestos.</p>

  <p>Cuando generas una llave SSH obtienes <strong>dos archivos</strong> matemáticamente
  emparejados:</p>

  <ul>
    <li><strong>La privada</strong> (<code>id_ed25519</code>): sirve para <em>firmar</em>. Es el
    secreto. Se queda en tu equipo.</li>
    <li><strong>La pública</strong> (<code>id_ed25519.pub</code>): sirve para <em>comprobar</em>
    firmas. No es secreta. Se copia a cada servidor en el que quieras entrar.</li>
  </ul>

  <p>Lo que hace funcionar el sistema es una asimetría: con la pública se verifica lo que firma
  la privada, pero <strong>con la pública no se puede reconstruir la privada</strong>. Por eso la
  pública se puede entregar a cualquiera sin perder nada.</p>

  <?= shot('ssh/17-publica-privada.svg',
      'En tu equipo, id_ed25519 es la llave privada y no sale nunca; id_ed25519.pub es la '
      . 'pública y se copia al archivo authorized_keys del servidor. Una flecha tachada impide '
      . 'que la privada viaje.',
      '<b>Dónde mirar:</b> la flecha tachada. Todo el modelo depende de que esa flecha no exista '
      . 'jamás: lo único que viaja al servidor es el archivo que termina en <code>.pub</code>.') ?>

  <?= callouts([
      ['id_ed25519 · privada', 'Firma. Quien la tiene puede autenticarse como tú en todos los servidores que la acepten. No se envía, no se sube, no se pega en ningún formulario.'],
      ['id_ed25519.pub · pública', 'Verifica. Leerla no da acceso a nada. Es lo que añades al <code>authorized_keys</code> del servidor y lo que pegas en el panel de un proveedor Git.'],
      ['authorized_keys · en el servidor', 'La lista de llaves públicas autorizadas para esa cuenta. Una línea por llave.'],
  ]) ?>

  <?= note('La regla que no tiene excepciones',
      '<p><strong>La llave privada NUNCA se copia al servidor.</strong> Si una guía, un compañero o
      un proveedor te pide el archivo sin <code>.pub</code>, algo va mal. Lo que se comparte
      termina siempre en <code>.pub</code>.</p>') ?>

  <?= pitfall('<p>Copiar <code>id_ed25519</code> al servidor «para que funcione en los dos
      sentidos», o pegar la privada en <code>authorized_keys</code>. No solo no hace falta: deja
      tu secreto en una máquina que administra otra persona y que puede tener backups, otros
      administradores o fallos. Si alguna vez ocurrió, esa llave se considera comprometida: se
      genera una nueva y se retira la antigua de todos los servidores.</p>') ?>
</section>

<!-- ============================== SSH-KEYGEN ========================== -->
<section id="ssh-keygen">
  <h2><code>ssh-keygen</code>: generar tu par de llaves</h2>
  <p class="tut-sub">Un comando, tres preguntas y dos archivos.</p>

  <p><code>ssh-keygen</code> crea el par de llaves en tu equipo. No se conecta a ningún sitio:
  todo ocurre en local.</p>

  <?= ssh_term(<<<'TXT'
$ ssh-keygen -t ed25519 -C "alumno@laptop"
TXT, 'bash') ?>

  <?= anatomy(
      '<b>ssh-keygen</b> <u>-t ed25519</u> <i>-C "alumno@laptop"</i>',
      [
          ['ssh-keygen', 'El programa que genera y gestiona llaves. No abre conexiones.'],
          ['-t ed25519', 'El tipo de llave. Ed25519 es corta, rápida y robusta: la recomendación actual para llaves de usuario.'],
          ['-C "alumno@laptop"', 'Un comentario que se añade al final de la llave pública. Solo sirve para que TÚ reconozcas la llave dentro de <code>authorized_keys</code>. No afecta a la seguridad.'],
      ],
      'Desglose del comando') ?>

  <?= note('¿Y RSA?',
      '<p>Ed25519 funciona en cualquier OpenSSH moderno. Si tienes que entrar en un sistema
      antiguo que no la acepta, la alternativa es <code>ssh-keygen -t rsa -b 3072</code> (3072
      bits o más). No generes RSA «por costumbre» si Ed25519 funciona.</p>', 'info') ?>

  <h3>Qué ocurre, paso a paso</h3>

  <?= shot('ssh/18-ssh-keygen.svg',
      'Salida real de ssh-keygen generando una llave Ed25519: pregunta dónde guardarla, pide la '
      . 'passphrase dos veces sin mostrarla, y guarda la privada en id_ed25519 y la pública en '
      . 'id_ed25519.pub; termina con la huella y el randomart.',
      '<b>Qué estás viendo:</b> la sesión literal del laboratorio. <b>Dónde mirar:</b> las líneas '
      . '3 y 4: dos archivos distintos, uno con <code>.pub</code> y otro sin él.',
      'real') ?>

  <?= callouts([
      ['Dónde guardarla', 'Enter acepta la ruta propuesta (<code>/home/alumno/.ssh/id_ed25519</code>). Si ya existiera una llave con ese nombre, ssh-keygen pregunta antes de sobrescribir: responde <code>n</code> salvo que sepas lo que haces.'],
      ['La passphrase', 'Se pide dos veces y <strong>no se ve mientras escribes</strong>: la terminal no muestra ni asteriscos. Es normal.'],
      ['Privada guardada', '<code>Your identification</code> es la llave privada. Es el archivo que nunca sale de aquí.'],
      ['Pública guardada', 'El mismo nombre con <code>.pub</code>. Es la que se copia a los servidores.'],
      ['La huella', 'Un resumen de la llave: sirve para reconocerla sin comparar la llave entera. El randomart de debajo es otra representación de lo mismo, pensada para la vista.'],
  ]) ?>

  <h3>Los archivos que quedaron en <code>~/.ssh</code></h3>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ls -la ~/.ssh
total 24
drwx--S--- 2 alumno alumno 4096 Sep 14 18:05 .
drwxr-sr-x 1 alumno alumno 4096 Sep 14 18:05 ..
-rw------- 1 alumno alumno  444 Sep 14 18:05 id_ed25519
-rw-r--r-- 1 alumno alumno   95 Sep 14 18:05 id_ed25519.pub
-rw------- 1 alumno alumno  822 Sep 14 18:05 known_hosts
-rw-r--r-- 1 alumno alumno   90 Sep 14 18:05 known_hosts.old
alumno@laptop:~$ stat -c '%a %A %n' ~/.ssh ~/.ssh/id_ed25519 ~/.ssh/id_ed25519.pub
2700 drwx--S--- /home/alumno/.ssh
600 -rw------- /home/alumno/.ssh/id_ed25519
644 -rw-r--r-- /home/alumno/.ssh/id_ed25519.pub
TXT, 'salida real · laboratorio') ?>

  <?= ssh_tree(<<<'TXT'
~/.ssh/
├── id_ed25519       ← PRIVADA  · 600 · ❌ no se comparte nunca
└── id_ed25519.pub   ← PÚBLICA  · 644 · ✅ se copia al servidor
TXT, 'qué es cada uno') ?>

  <p><strong>Qué observar:</strong> ssh-keygen ya dejó la privada en <code>600</code> (solo tú
  lees y escribes) y la pública en <code>644</code>. No tuviste que hacer nada: los permisos
  correctos vienen de fábrica. El problema aparece cuando alguien los cambia después.</p>

  <?= note('¿Y ese known_hosts.old?',
      '<p>No lo creó ssh-keygen. En la primera conexión, el servidor anunció sus otras host keys
      (RSA y ECDSA) y el cliente las añadió a <code>known_hosts</code> guardando antes una copia
      <code>.old</code>. Es la opción <code>UpdateHostKeys</code> del cliente, pensada para que un
      servidor pueda rotar sus llaves sin sustos. Nada que ver con tus llaves de usuario.</p>', 'info') ?>

  <h3>La llave pública, pieza a pieza</h3>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ cat ~/.ssh/id_ed25519.pub
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDUNMcg/mJ3yREIt64o766rUO/itmxtCglJ27aeSKzpJ alumno@laptop
TXT, 'salida real · laboratorio') ?>

  <?= anatomy(
      '<b>ssh-ed25519</b> <i>AAAAC3NzaC1lZDI1NTE5AAAAIDUNMcg/…</i> <u>alumno@laptop</u>',
      [
          ['ssh-ed25519', 'El tipo de llave.'],
          ['AAAAC3Nza…', 'La llave pública en base64. Es lo que el servidor usa para verificar tus firmas.'],
          ['alumno@laptop', 'El comentario que pusiste con <code>-C</code>. Solo es una etiqueta para humanos.'],
      ],
      'Una llave pública') ?>

  <h3>Tres usos más de ssh-keygen sobre llaves que ya existen</h3>

  <?= ssh_term(<<<'TXT'
# ver la huella de una llave (sirve con la pública)
$ ssh-keygen -l -f ~/.ssh/id_ed25519.pub

# añadir o cambiar la passphrase de una llave existente, sin regenerarla
$ ssh-keygen -p -f ~/.ssh/id_ed25519

# generar una llave con otro nombre, por ejemplo para un uso concreto
$ ssh-keygen -t ed25519 -C "deploy@laptop" -f ~/.ssh/llave_deploy
TXT, 'bash') ?>

  <?= pitfall('<p>Ejecutar <code>ssh-keygen -t ed25519</code> otra vez «para asegurarse» y
      responder <code>y</code> a la pregunta de sobrescribir. La llave antigua desaparece y todos
      los servidores que tenían su pública dejan de aceptarte. Si solo querías ponerle
      passphrase, era <code>ssh-keygen -p</code>.</p>') ?>
</section>

<!-- ============================== PASSPHRASE ========================= -->
<section id="passphrase">
  <h2>La passphrase</h2>
  <p class="tut-sub">Protege el archivo de la llave. No es la contraseña del servidor.</p>

  <p><strong>Qué es:</strong> una frase con la que ssh-keygen <strong>cifra el archivo de la llave
  privada en tu disco</strong>. Para usar la llave, primero hay que descifrarla, y para eso hace
  falta la passphrase.</p>

  <?= shot('ssh/19-passphrase.svg',
      'La llave privada es la llave física y la passphrase es la caja fuerte donde se guarda. '
      . 'Columna izquierda: lo que la passphrase protege. Columna derecha: lo que no protege.',
      '<b>Dónde mirar:</b> la columna «No protege». La passphrase actúa sobre el archivo en '
      . 'reposo; una vez descifrada la llave en memoria, ya no interviene.') ?>

  <?= note('La analogía',
      '<p>La llave privada es la llave física de la puerta. <strong>La passphrase es la caja
      fuerte donde la guardas</strong>: si alguien se lleva la caja —una copia del archivo, un
      backup, un disco perdido— todavía tiene que abrirla antes de poder usar la llave.</p>', 'info') ?>

  <?= compare(
      ['Passphrase', 'Tu equipo · protege el archivo',
       '<ul>
          <li>La eliges tú al crear la llave (o luego con <code>ssh-keygen -p</code>).</li>
          <li>Nunca viaja al servidor.</li>
          <li>El servidor no sabe si tu llave tiene passphrase o no.</li>
          <li>Se pide como <code>Enter passphrase for key …</code>.</li>
        </ul>'],
      ['Contraseña del usuario remoto', 'Servidor · protege la cuenta',
       '<ul>
          <li>La define quien administra el servidor.</li>
          <li>Se envía al servidor (cifrada en el canal) si se usa para entrar.</li>
          <li>Sigue haciendo falta, por ejemplo, para <code>sudo</code>.</li>
          <li>Se pide como <code>alumno@servidor\'s password:</code>.</li>
        </ul>'],
      'Mira el texto del prompt: «passphrase for key» es tu llave local; «password:» es la cuenta del servidor.') ?>

  <?= pitfall('<p>Dejar la llave sin passphrase «porque es un fastidio escribirla». La solución a
      ese fastidio no es quitarla: es <code>ssh-agent</code>, que la pide una vez por sesión. Una
      llave sin passphrase en un portátil que se pierde es un acceso libre a cada servidor que la
      acepte.</p>') ?>

  <?= evidence(
      '<p>Te roban una copia del archivo <code>id_ed25519</code>, que tenía una passphrase larga.</p>',
      '<p>El atacante tiene el archivo, pero cifrado: necesita la passphrase para usarlo.</p>',
      '<p>Que estés a salvo sin hacer nada. Una passphrase débil puede probarse sin límite fuera
      de línea, porque nadie le pone un contador de intentos a tu archivo. La respuesta correcta
      es la misma que con cualquier llave expuesta: generar una nueva y retirar la antigua de los
      servidores.</p>') ?>
</section>

<!-- ============================== SSH-COPY-ID ======================== -->
<section id="ssh-copy-id">
  <h2><code>ssh-copy-id</code>: instalar tu llave pública</h2>
  <p class="tut-sub">Usas la contraseña una última vez para no volver a necesitarla.</p>

  <p>Tener la llave no basta: el servidor tiene que saber que la aceptas como tuya. Eso se hace
  añadiendo tu llave <strong>pública</strong> al archivo <code>~/.ssh/authorized_keys</code> de tu
  cuenta en el servidor. <code>ssh-copy-id</code> lo hace por ti, en un servidor en el que
  <strong>ya puedes entrar</strong> de otra forma (normalmente, con contraseña).</p>

  <?= ssh_term(<<<'TXT'
$ ssh-copy-id alumno@servidor
TXT, 'bash') ?>

  <?= shot('ssh/20-ssh-copy-id.svg',
      'ssh-copy-id toma id_ed25519.pub del equipo local, entra en el servidor con la '
      . 'autenticación que ya funciona, crea ~/.ssh si falta y añade la línea a authorized_keys '
      . 'con permisos restrictivos.',
      '<b>Dónde mirar:</b> el paso 4 y el «>>» de la derecha. ssh-copy-id <em>añade</em> una línea; '
      . 'no borra las llaves que ya había.') ?>

  <h3>La ejecución real</h3>

  <?= shot('ssh/21-ssh-copy-id.svg',
      'Salida real de ssh-copy-id: identifica la llave pública, comprueba si ya estaba instalada, '
      . 'pide la contraseña una última vez y confirma que añadió una llave. Después, ssh ya no pide '
      . 'contraseña sino la passphrase de la llave.',
      '<b>Qué estás viendo:</b> la sesión literal del laboratorio. <b>Dónde mirar:</b> el cambio '
      . 'entre la marca 2 y la 4: antes el servidor pedía <em>su</em> contraseña; ahora el que pide '
      . 'algo es tu cliente, y lo que pide es la passphrase de <em>tu</em> llave.',
      'real') ?>

  <?= callouts([
      ['Llave detectada', 'ssh-copy-id busca tu llave pública por defecto. Con <code>-i archivo.pub</code> eliges otra.'],
      ['Última contraseña', 'Entra con lo que ya funciona para poder escribir en tu <code>authorized_keys</code>.'],
      ['Number of key(s) added: 1', 'La confirmación. Si la llave ya estaba, lo dice y no la duplica.'],
      ['Ahora pide la passphrase', 'La autenticación ya es por llave. El prompt lo delata: <code>Enter passphrase for key</code>.'],
  ]) ?>

  <?= evidence(
      '<p>Después de <code>ssh-copy-id</code>, la conexión pide <code>Enter passphrase for key
      \'/home/alumno/.ssh/id_ed25519\'</code> en lugar de <code>alumno@servidor\'s password</code>.</p>',
      '<p>El servidor aceptó la llave pública y te pidió una firma; tu cliente necesita descifrar
      la privada para firmar.</p>',
      '<p>Que el servidor ya no acepte contraseñas. Siguen permitidas mientras
      <code>PasswordAuthentication</code> no se desactive en <code>sshd_config</code>. Que tú uses
      llave no impide que otros sigan probando contraseñas.</p>') ?>

  <h3>Si no tienes ssh-copy-id</h3>

  <p>Algunos sistemas no lo traen. El equivalente manual hace lo mismo, paso a paso:</p>

  <?= ssh_term(<<<'TXT'
$ cat ~/.ssh/id_ed25519.pub | ssh alumno@servidor 'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
TXT, 'bash') ?>

  <?= pitfall('<p>Escribir <code>&gt;</code> en lugar de <code>&gt;&gt;</code>. Con un solo
      <code>&gt;</code> el archivo se <strong>sustituye</strong>: se borran todas las llaves que
      había y, si alguna era la única forma de entrar de otra persona (o tuya desde otro equipo),
      acabas de retirarle el acceso. En un hosting, el panel suele gestionar ese mismo archivo:
      compruébalo antes de reescribirlo.</p>') ?>
</section>

<!-- ============================ AUTHORIZED_KEYS ====================== -->
<section id="authorized-keys">
  <h2><code>authorized_keys</code>: quién puede entrar en tu cuenta</h2>
  <p class="tut-sub">Vive en el servidor. Una línea, una llave autorizada.</p>

  <p><code>~/.ssh/authorized_keys</code> es el archivo que <code>sshd</code> consulta cuando alguien
  intenta entrar en tu cuenta con una llave. Si la llave pública que corresponde a la firma está
  en ese archivo, entra. Si no, no.</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh alumno@servidor 'ls -la ~/.ssh; cat ~/.ssh/authorized_keys'
Enter passphrase for key '/home/alumno/.ssh/id_ed25519':
total 12
drwx--S--- 2 alumno alumno 4096 Sep 14 18:05 .
drwxr-sr-x 1 alumno alumno 4096 Sep 14 18:05 ..
-rw------- 1 alumno alumno   95 Sep 14 18:05 authorized_keys
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDUNMcg/mJ3yREIt64o766rUO/itmxtCglJ27aeSKzpJ alumno@laptop
TXT, 'salida real · laboratorio') ?>

  <p><strong>Qué observar:</strong> la línea de <code>authorized_keys</code> es <em>idéntica</em> a
  tu <code>id_ed25519.pub</code>. No hay magia ni transformación: es una copia de la pública. Y
  ssh-copy-id dejó el directorio en <code>700</code> y el archivo en <code>600</code>.</p>

  <h3>Opciones al principio de una línea</h3>

  <p>Una línea puede empezar con opciones que <strong>restringen</strong> lo que esa llave puede
  hacer. Son una herramienta defensiva muy útil para llaves de automatización. Algunas, según
  <code>man sshd</code> (sección <em>AUTHORIZED_KEYS FILE FORMAT</em>):</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Opciones de authorized_keys</caption>
      <thead><tr><th scope="col">Opción</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">from="192.168.56.10"</td><td class="d">La llave solo se acepta si la conexión viene de esas direcciones o nombres.</td></tr>
        <tr><td class="f">command="…"</td><td class="d">Con esa llave solo se ejecuta ese comando, pida lo que pida el cliente.</td></tr>
        <tr><td class="f">restrict</td><td class="d">Desactiva de golpe reenvío de puertos, de agente, X11 y asignación de terminal.</td></tr>
      </tbody>
    </table>
  </div>

  <?= ssh_tree(<<<'TXT'
# ejemplo ilustrativo: una llave de copias de seguridad, muy restringida
restrict,from="192.168.56.10",command="/usr/local/bin/backup.sh" ssh-ed25519 AAAA… backup@laptop
TXT, 'authorized_keys · ejemplo ilustrativo') ?>

  <?= evidence(
      '<p>Al revisar el <code>authorized_keys</code> de una cuenta aparece una línea con un
      comentario que nadie reconoce.</p>',
      '<p>Hay una llave autorizada que no está documentada: puede ser de un antiguo compañero,
      de una herramienta o haberse añadido sin permiso.</p>',
      '<p>Que sea maliciosa: el comentario lo escribe quien genera la llave y puede ser cualquier
      cosa. Tampoco que no se haya usado: eso lo dicen los logs (<code>Accepted publickey</code>
      con su huella). Lo correcto es averiguar su origen y, si nadie la reclama, retirarla.</p>') ?>

  <?= pitfall('<p>Confundir <code>authorized_keys</code> con <code>known_hosts</code>. Van en
      direcciones opuestas: <code>authorized_keys</code> vive en el <strong>servidor</strong> y dice
      qué <em>usuarios</em> pueden entrar; <code>known_hosts</code> vive en tu <strong>equipo</strong>
      y dice qué <em>servidores</em> reconoces.</p>') ?>
</section>

<!-- ============================== PERMISOS SSH ======================= -->
<section id="permisos-ssh">
  <h2>Los permisos que exige OpenSSH</h2>
  <p class="tut-sub">Si otro usuario puede leer tu secreto o escribir tu lista de acceso, OpenSSH se niega a usarlos.</p>

  <p>OpenSSH comprueba permisos en los <strong>dos lados</strong>:</p>
  <ul>
    <li><strong>El cliente</strong> se niega a usar una llave privada que otros usuarios del
    equipo pueden leer.</li>
    <li><strong>El servidor</strong>, con <code>StrictModes yes</code> (el valor por defecto en
    <code>sshd_config</code>), ignora <code>authorized_keys</code> si el archivo, el directorio
    <code>~/.ssh</code> o tu home pueden ser modificados por otros usuarios.</li>
  </ul>

  <?= shot('ssh/22-permisos-ssh.svg',
      'Tabla con el archivo, el permiso recomendado, cómo se ve en ls -l, dónde vive y qué pasa '
      . 'si es demasiado abierto: directorio .ssh 700, llave privada 600, pública 644, config '
      . '600, authorized_keys 600 y home no escribible por otros.',
      '<b>Dónde mirar:</b> la columna «Por qué». Cada modo responde a una pregunta concreta: '
      . '¿alguien más puede leer el secreto? ¿alguien más puede cambiar quién entra?') ?>

  <?= ssh_term(<<<'TXT'
$ chmod 700 ~/.ssh
$ chmod 600 ~/.ssh/id_ed25519
$ chmod 600 ~/.ssh/authorized_keys
TXT, 'bash') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Significado de cada modo</caption>
      <thead><tr><th scope="col">Modo</th><th scope="col">Dueño</th><th scope="col">Grupo</th><th scope="col">Otros</th><th scope="col">Traducción</th></tr></thead>
      <tbody>
        <tr><td class="f">700</td><td class="d">rwx (7 = 4+2+1)</td><td class="d">— (0)</td><td class="d">— (0)</td><td class="d">Solo tú entras en el directorio y ves qué hay.</td></tr>
        <tr><td class="f">600</td><td class="d">rw- (6 = 4+2)</td><td class="d">— (0)</td><td class="d">— (0)</td><td class="d">Solo tú lees y escribes el archivo.</td></tr>
        <tr><td class="f">644</td><td class="d">rw- (6)</td><td class="d">r-- (4)</td><td class="d">r-- (4)</td><td class="d">Tú escribes, todos pueden leer. Válido para la pública.</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('Recomendaciones, no dogmas',
      '<p>Lo que OpenSSH comprueba de verdad es «¿puede otro usuario leer mi secreto?» y «¿puede
      otro usuario escribir lo que decide quién entra?». Por eso hay margen: un
      <code>~/.ssh/config</code> en <code>644</code> funciona, porque leerlo no da acceso; lo que
      no puede ser es escribible por otros. Los modos de la tabla son la forma más sencilla de
      responder «no» a las dos preguntas.</p>', 'info') ?>

  <h3>Qué pasa cuando se rompen: la prueba real</h3>

  <?= shot('ssh/23-permisos-mal.svg',
      'Salida real: con la llave privada en modo 644, OpenSSH muestra WARNING UNPROTECTED '
      . 'PRIVATE KEY FILE, ignora la llave y la conexión termina en Permission denied. Tras '
      . 'chmod 600 y chmod 700, ls -ld muestra los permisos correctos.',
      '<b>Qué estás viendo:</b> la llave del laboratorio puesta a propósito en 644. '
      . '<b>Dónde mirar:</b> la marca 2 antes que la 3. El <code>Permission denied</code> es la '
      . 'consecuencia; la causa está unas líneas más arriba.',
      'real') ?>

  <?= callouts([
      ['Permissions 0644 … are too open', 'El cliente detecta que otros usuarios podrían leer la privada.'],
      ['This private key will be ignored', 'No es un aviso decorativo: la llave no se usa en absoluto.'],
      ['Permission denied', 'Sin llave (y sin contraseña en esa prueba) no queda ningún método. Parece un problema del servidor y no lo es.'],
      ['-rw------- tras chmod 600', 'Con el modo corregido, la llave vuelve a ser utilizable.'],
  ]) ?>

  <?= evidence(
      '<p><code>Permission denied (publickey,password,keyboard-interactive)</code> al conectar.</p>',
      '<p>El servidor no aceptó ninguna autenticación. Si más arriba aparece <code>bad
      permissions</code>, la causa está en tu equipo: la llave ni siquiera se ofreció.</p>',
      '<p>Que la llave no esté en <code>authorized_keys</code> ni que el servidor tenga un
      problema. Sin leer las líneas anteriores (o <code>ssh -v</code>) no se sabe si la llave se
      ofreció y se rechazó o si nunca llegó a ofrecerse.</p>') ?>

  <?= pitfall('<p>Arreglar el problema con <code>chmod 777</code> «para que funcione». Es exactamente
      lo contrario: con permisos abiertos OpenSSH rechaza la llave en el cliente y, en el
      servidor, deja de confiar en <code>authorized_keys</code>. Los permisos SSH se arreglan
      <em>cerrando</em>, nunca abriendo.</p>') ?>
</section>

<!-- ============================== SSH-AGENT ========================== -->
<section id="ssh-agent">
  <h2><code>ssh-agent</code> y <code>ssh-add</code></h2>
  <p class="tut-sub">La passphrase una vez por sesión, no en cada conexión.</p>

  <p><strong>El problema:</strong> tienes una llave con passphrase —bien hecho— y cada
  <code>ssh</code>, <code>scp</code>, <code>rsync</code> o <code>git push</code> te la pide. Al
  tercer despliegue la tentación es quitarla.</p>

  <p><strong>La solución:</strong> <code>ssh-agent</code> es un proceso que guarda la llave
  <strong>ya descifrada en memoria</strong> y firma en nombre de los clientes que se lo piden. Le
  das la passphrase una vez con <code>ssh-add</code> y el resto de la sesión no la vuelves a
  escribir.</p>

  <?= shot('ssh/24-ssh-agent.svg',
      'Sin ssh-agent, cada conexión pide la passphrase. Con ssh-agent, se escribe una vez con '
      . 'ssh-add; el agente guarda la llave descifrada en memoria y firma por los clientes ssh, '
      . 'scp, rsync y git.',
      '<b>Dónde mirar:</b> el recuadro «llave descifrada en memoria». El archivo del disco sigue '
      . 'cifrado; lo que cambia es que hay una copia usable mientras dura la sesión.') ?>

  <h3>La secuencia real</h3>

  <?= shot('ssh/25-ssh-agent.svg',
      'Salida real: se arranca el agente, ssh-add -l indica que no tiene identidades, ssh-add '
      . 'pide la passphrase una vez, ssh-add -l muestra la huella cargada y la conexión posterior '
      . 'entra sin pedir nada.',
      '<b>Qué estás viendo:</b> una sesión literal del laboratorio. <b>Dónde mirar:</b> la última '
      . 'línea. Es la misma orden que antes pedía passphrase y ahora devuelve directamente '
      . '<code>servidor</code>.',
      'real') ?>

  <?= callouts([
      ['The agent has no identities', 'El agente está en marcha pero vacío: todavía no le has dado ninguna llave.'],
      ['Enter passphrase (una vez)', '<code>ssh-add</code> descifra la llave y la entrega al agente.'],
      ['256 SHA256:… (ED25519)', '<code>ssh-add -l</code> lista las huellas cargadas, nunca las llaves.'],
      ['Conecta sin pedir nada', 'ssh pide la firma al agente. La passphrase no vuelve a aparecer.'],
  ]) ?>

  <?= ssh_term(<<<'TXT'
# arrancar un agente en esta terminal (en muchos escritorios ya viene arrancado)
$ eval "$(ssh-agent -s)"

# cargar la llave por defecto; pide la passphrase una vez
$ ssh-add

# ver qué llaves hay cargadas (huellas) y sus públicas
$ ssh-add -l
$ ssh-add -L

# cargar una llave solo durante una hora
$ ssh-add -t 3600 ~/.ssh/id_ed25519

# vaciar el agente al terminar
$ ssh-add -D
TXT, 'bash') ?>

  <?= anatomy(
      '<b>eval</b> "<u>$(ssh-agent -s)</u>"',
      [
          ['ssh-agent -s', 'Arranca el agente y escribe en pantalla las variables que necesitan los clientes para encontrarlo (<code>SSH_AUTH_SOCK</code> y el PID).'],
          ['$( … )', 'Captura esas líneas en lugar de mostrarlas.'],
          ['eval', 'Las ejecuta en tu shell actual, así las variables quedan definidas en esta terminal.'],
      ],
      'Por qué eval') ?>

  <?= note('Cargar la llave al primer uso',
      '<p>En <code>~/.ssh/config</code> puedes añadir <code>AddKeysToAgent yes</code>: la primera
      vez que ssh descifra la llave, la entrega también al agente. Lo verás en la parte del
      cliente.</p>', 'info') ?>

  <?= note('ForwardAgent: con cuidado',
      '<p>Reenviar el agente (<code>ssh -A</code> o <code>ForwardAgent yes</code>) permite que un
      servidor remoto pida firmas a tu agente mientras estás conectado. Cualquiera con privilegios
      suficientes en ese servidor podría usarlo en ese tiempo. Actívalo solo si de verdad lo
      necesitas y en servidores de total confianza. Para llegar a una máquina interna a través de
      otra, la opción adecuada es <code>ProxyJump</code>, que no expone tu agente.</p>') ?>

  <?= pitfall('<p>Creer que el agente «guarda la passphrase en algún archivo». No escribe nada en
      disco: guarda la llave descifrada en memoria y desaparece al cerrar la sesión o con
      <code>ssh-add -D</code>. Tampoco hace que la llave «no necesite passphrase»: el archivo sigue
      cifrado y la pedirá de nuevo en la próxima sesión.</p>') ?>
</section>

<!-- ============================ PRÁCTICA LLAVES ====================== -->
<section id="practica-llaves">
  <h2>Práctica: llaves</h2>
  <p class="tut-sub">Cuatro ejercicios, de crear la llave a trabajar una sesión entera con el agente.</p>

  <?= note('Dónde se practican',
      '<p>En tu propio equipo y en un servidor tuyo: una VM, un contenedor o tu cuenta de hosting.
      Si ya tienes una llave <code>id_ed25519</code> que usas a diario, en el ejercicio 06 genera la
      nueva con otro nombre (<code>-f ~/.ssh/llave_lab</code>) para no sobrescribirla.</p>', 'info') ?>

  <?= ssh_ejercicio([
      'num' => '06',
      'titulo' => 'Crear tu llave Ed25519',
      'nivel' => 'basico',
      'objetivo' => 'Objetivo: generar un par de llaves con passphrase e identificar cada archivo.',
      'mision' => 'Tener una llave Ed25519 propia, protegida con passphrase, y saber qué archivo es cada cosa.',
      'escenario' => 'Vas a empezar a administrar un servidor de laboratorio y quieres dejar de depender de la contraseña.',
      'preparacion' => 'Una terminal en tu equipo. Comprueba antes con <code>ls ~/.ssh</code> si ya existe <code>id_ed25519</code>.',
      'pasos' => [
          'Ejecuta <code>ssh-keygen -t ed25519 -C "tu_usuario@tu_equipo"</code> (añade <code>-f ~/.ssh/llave_lab</code> si ya tenías una).',
          'Pon una passphrase y confírmala. Observa que no se ve mientras escribes.',
          'Ejecuta <code>ls -l ~/.ssh</code> y <code>ssh-keygen -l -f</code> sobre la llave pública.',
      ],
      'observar' => '<p>Dos archivos con el mismo nombre, uno terminado en <code>.pub</code>, con modos distintos, y una huella <code>SHA256:…</code> que coincide con la que mostró ssh-keygen al terminar.</p>',
      'visual' => shot('ssh/18-ssh-keygen.svg', 'Salida real de ssh-keygen generando una llave Ed25519.', '<b>Compara:</b> tu salida debe tener las mismas cinco marcas, con tus rutas y tu huella.', 'real'),
      'preguntas' => [
          '¿Qué archivo copiarías a un servidor y cuál no debe salir nunca de tu equipo?',
          '¿Qué modo tiene cada uno y por qué no son iguales?',
          '¿Para qué sirve el texto que pusiste con <code>-C</code>?',
      ],
      'pistas' => [
          '<p>Piensa en qué hace cada llave: una firma y otra comprueba firmas.</p>',
          '<p>Mira la terminación del nombre y la primera columna de <code>ls -l</code>.</p>',
          '<p><code>-rw-------</code> es 600; <code>-rw-r--r--</code> es 644.</p>',
      ],
      'solucion' => 'Se copia <code>id_ed25519.pub</code> (644); <code>id_ed25519</code> (600) no sale nunca.',
      'porque' => '<p>La pública solo verifica firmas y no permite reconstruir la privada, así que leerla no da acceso: por eso puede ser 644. La privada firma en tu nombre: si otro usuario del equipo pudiera leerla, podría suplantarte, y por eso ssh-keygen la crea en 600. El comentario de <code>-C</code> es una etiqueta para reconocer la llave en <code>authorized_keys</code>; no interviene en la autenticación.</p>',
      'error' => '<p>Responder <code>y</code> cuando ssh-keygen pregunta si sobrescribir una llave existente. La antigua desaparece y dejas de poder entrar donde la usabas.</p>',
      'aprendiste' => 'a generar la llave, a distinguir privada y pública por nombre y permisos, y a sacar su huella.',
  ]) ?>

  <?= ssh_ejercicio([
      'num' => '07',
      'titulo' => 'Instalar tu llave pública',
      'nivel' => 'basico',
      'objetivo' => 'Objetivo: pasar de entrar con contraseña a entrar con llave en un servidor propio.',
      'mision' => 'Que tu servidor de laboratorio acepte tu llave y comprobar, por el propio prompt, que ya no usas la contraseña.',
      'escenario' => 'Tu VM responde en <code>192.168.56.20</code> con el usuario <code>alumno</code> y hoy entras con contraseña.',
      'preparacion' => 'La llave del ejercicio 06 y acceso por contraseña a tu servidor. Si tu llave no es la de por defecto, usa <code>-i ~/.ssh/llave_lab.pub</code>.',
      'pasos' => [
          'Ejecuta <code>ssh-copy-id alumno@192.168.56.20</code> y escribe la contraseña del servidor.',
          'Conéctate con <code>ssh alumno@192.168.56.20 hostname</code> y lee con atención qué te pide.',
          'Dentro del servidor, ejecuta <code>ls -la ~/.ssh</code> y <code>cat ~/.ssh/authorized_keys</code>.',
      ],
      'observar' => '<p>El mensaje <code>Number of key(s) added: 1</code>, el cambio de <code>password:</code> a <code>Enter passphrase for key</code> y una línea en <code>authorized_keys</code> igual a tu <code>.pub</code>.</p>',
      'visual' => shot('ssh/21-ssh-copy-id.svg', 'Salida real de ssh-copy-id y de la primera entrada con llave.', '<b>Compara</b> tu prompt final con la marca 4.', 'real'),
      'preguntas' => [
          '¿Qué secreto escribiste en el paso 1 y cuál en el paso 2? ¿Dónde vive cada uno?',
          '¿Qué archivo modificó ssh-copy-id y en qué máquina?',
          '¿Ha dejado el servidor de aceptar contraseñas?',
      ],
      'pistas' => [
          '<p>Lee literalmente el texto antes de los dos puntos en cada petición.</p>',
          '<p>«password» pertenece a la cuenta del servidor; «passphrase for key» a un archivo de tu equipo.</p>',
      ],
      'solucion' => 'Paso 1: contraseña de la cuenta en el servidor. Paso 2: passphrase de tu llave local. El servidor sigue aceptando contraseñas.',
      'porque' => '<p>ssh-copy-id necesita entrar una vez para escribir en <code>~/.ssh/authorized_keys</code> del servidor, y usa lo que ya funciona: la contraseña. Desde ese momento el servidor ofrece autenticación por llave, tu cliente tiene que firmar y, para firmar, descifra la privada: por eso pide la passphrase. Nada de esto cambia <code>sshd_config</code>, así que <code>PasswordAuthentication</code> sigue como estaba.</p>',
      'error' => '<p>Dar por hecho que el servidor ya está «blindado» porque tú entras con llave. Desactivar las contraseñas es una decisión aparte, en el servidor, y se hace con el procedimiento seguro de la parte de seguridad.</p>',
      'aprendiste' => 'a instalar una llave pública y a reconocer por el prompt qué método de autenticación se está usando.',
  ]) ?>

  <?= ssh_ejercicio([
      'num' => '08',
      'titulo' => 'Permisos que rompen la autenticación',
      'nivel' => 'intermedio',
      'objetivo' => 'Objetivo: leer una salida de error completa y separar causa de consecuencia.',
      'mision' => 'Explicar, solo con la salida, por qué falló la conexión y cómo se arregla sin empeorarlo.',
      'escenario' => 'Un compañero copió su carpeta <code>.ssh</code> desde un USB y ahora «SSH dice Permission denied». Te pasa esta salida del laboratorio.',
      'preparacion' => 'No hace falta ejecutar nada: es un ejercicio de interpretación. Si quieres reproducirlo, hazlo con una llave de prueba, nunca con la de uso diario.',
      'pasos' => [
          'Observa la figura y localiza la línea que dice qué modo tiene la llave.',
          'Busca qué decidió hacer el cliente con esa llave.',
          'Relaciona eso con el <code>Permission denied</code> final y con los comandos que vienen después.',
      ],
      'observar' => '<p>El orden de las líneas: el aviso de permisos, <code>This private key will be ignored</code>, <code>bad permissions</code> y, solo al final, <code>Permission denied</code>.</p>',
      'visual' => shot('ssh/23-permisos-mal.svg', 'Salida real de una llave privada con permisos 644 y su corrección.', '<b>Pregúntate:</b> ¿llegó la llave a ofrecerse al servidor?', 'real'),
      'preguntas' => [
          '¿El problema está en el cliente o en el servidor?',
          '¿Por qué copiar desde un USB puede provocar exactamente esto?',
          '¿Qué comando lo arregla y qué comando lo empeoraría?',
      ],
      'pistas' => [
          '<p>La palabra <code>ignored</code> es la clave: ¿quién ignora y qué?</p>',
          '<p>Muchos sistemas de archivos de USB no guardan permisos Unix, y al copiar los archivos quedan con modos abiertos.</p>',
          '<p>Los permisos SSH se arreglan cerrando.</p>',
      ],
      'solucion' => 'El problema está en el cliente: la privada en 644 se ignora. Se arregla con <code>chmod 600</code> en la llave y <code>chmod 700</code> en <code>~/.ssh</code>.',
      'porque' => '<p>El cliente comprobó el archivo antes de conectar, vio que otros usuarios podían leerlo y decidió no usarlo (<code>This private key will be ignored</code>). Sin llave, y con la contraseña desactivada en esa prueba, no quedaba ningún método, y el servidor respondió <code>Permission denied</code>. El servidor no llegó a ver la llave. Tras <code>chmod 600</code>, <code>ls -ld</code> muestra <code>-rw-------</code> y la llave vuelve a ser utilizable. Un <code>chmod 777</code> lo empeoraría en los dos lados.</p>',
      'error' => '<p>Leer solo la última línea y ponerse a revisar <code>authorized_keys</code> en el servidor. La causa estaba cuatro líneas más arriba y en el propio equipo.</p>',
      'aprendiste' => 'que <code>Permission denied</code> es un síntoma, y que las líneas anteriores dicen si la llave se llegó a ofrecer.',
  ]) ?>

  <?= ssh_ejercicio([
      'num' => '09',
      'titulo' => 'ssh-agent: una passphrase por sesión',
      'nivel' => 'intermedio',
      'objetivo' => 'Objetivo: cargar la llave en el agente, comprobarlo y vaciarlo al terminar.',
      'mision' => 'Hacer tres conexiones seguidas a tu servidor escribiendo la passphrase una sola vez, y dejar el agente vacío al acabar.',
      'escenario' => 'Vas a pasar la tarde administrando tu servidor de laboratorio con muchos comandos cortos.',
      'preparacion' => 'La llave con passphrase ya instalada en el servidor (ejercicios 06 y 07).',
      'pasos' => [
          'Ejecuta <code>ssh-add -l</code>. Si dice que no puede conectar con el agente, arráncalo con <code>eval "$(ssh-agent -s)"</code>.',
          'Carga la llave con <code>ssh-add</code> y comprueba con <code>ssh-add -l</code> qué huella quedó cargada.',
          'Ejecuta <code>ssh alumno@192.168.56.20 hostname</code> tres veces y, al terminar, <code>ssh-add -D</code> y otra vez <code>ssh-add -l</code>.',
      ],
      'observar' => '<p>La passphrase aparece una única vez (en <code>ssh-add</code>). Las conexiones no piden nada. Tras <code>-D</code>, el agente vuelve a no tener identidades.</p>',
      'visual' => shot('ssh/25-ssh-agent.svg', 'Salida real de ssh-agent y ssh-add en una sesión.', '<b>Compara</b> la huella de <code>ssh-add -l</code> con la de tu ejercicio 06.', 'real'),
      'preguntas' => [
          '¿La huella de <code>ssh-add -l</code> es la misma que te dio ssh-keygen? ¿Qué demuestra eso?',
          '¿Qué ocurre con la llave del disco mientras el agente la tiene cargada?',
          'Si cierras la terminal y abres otra, ¿sigue cargada?',
      ],
      'pistas' => [
          '<p>La huella identifica la llave, no el archivo ni la sesión.</p>',
          '<p>El agente trabaja en memoria y se localiza con la variable <code>SSH_AUTH_SOCK</code> de esa terminal.</p>',
      ],
      'solucion' => 'La huella coincide: es la misma llave. El archivo sigue cifrado en disco. En otra terminal depende de si comparte agente: con <code>eval</code> en una terminal concreta, no.',
      'porque' => '<p><code>ssh-add -l</code> muestra huellas, y una huella solo depende de la llave, por eso coincide con la de ssh-keygen. El agente guarda una copia descifrada en memoria; el archivo del disco no se toca y seguirá pidiendo passphrase fuera del agente. <code>eval "$(ssh-agent -s)"</code> define <code>SSH_AUTH_SOCK</code> solo en esa shell: otra terminal no lo conoce, salvo que tu escritorio arranque un agente común para toda la sesión, que es lo habitual en muchos entornos gráficos.</p>',
      'error' => '<p>Arrancar un agente nuevo en cada terminal y acabar con varios procesos <code>ssh-agent</code> olvidados, cada uno con la llave cargada. Comprueba primero con <code>ssh-add -l</code> si ya hay uno.</p>',
      'aprendiste' => 'a trabajar con passphrase sin fricción y a limpiar el agente cuando terminas.',
  ]) ?>

  <?= ssh_cierre('Llaves SSH',
      [
          'Con contraseña el secreto llega al servidor; con llave el cliente firma y la privada no sale de tu equipo.',
          '<code>id_ed25519</code> es la privada (600, nunca se comparte); <code>id_ed25519.pub</code> es la pública (644, se copia).',
          'La passphrase cifra el archivo de la llave; la contraseña del usuario remoto protege la cuenta. Son cosas distintas.',
          '<code>authorized_keys</code> vive en el servidor y decide qué llaves entran en la cuenta.',
          'OpenSSH rechaza llaves legibles por otros y <code>authorized_keys</code> escribibles por otros.',
      ],
      [
          'ssh-keygen -t ed25519 -C "usuario@equipo"',
          'ssh-keygen -l -f ~/.ssh/id_ed25519.pub',
          'ssh-keygen -p -f ~/.ssh/id_ed25519',
          'ssh-copy-id usuario@servidor',
          'chmod 700 ~/.ssh ; chmod 600 ~/.ssh/id_ed25519',
          'eval "$(ssh-agent -s)" ; ssh-add ; ssh-add -l ; ssh-add -D',
      ],
      [
          'El prompt te dice qué se pide: <code>password:</code> es el servidor, <code>passphrase for key</code> es tu llave.',
          '<code>Permission denied</code> es una consecuencia: busca la causa en las líneas anteriores.',
          'Instalar tu llave no desactiva las contraseñas del servidor.',
          'El agente guarda la llave descifrada en memoria, no en disco. <code>ForwardAgent</code> se usa con cuidado.',
      ],
      '<p>Quitar la passphrase por comodidad o «arreglar» permisos con <code>chmod 777</code>. Lo
      primero se resuelve con <code>ssh-agent</code>; lo segundo, cerrando permisos:
      <code>700</code> para <code>~/.ssh</code> y <code>600</code> para la privada y
      <code>authorized_keys</code>.</p>',
      [
          [
              'q' => '¿Dónde debe permanecer la llave privada?',
              'opts' => ['A' => 'En el servidor', 'B' => 'En tu equipo', 'C' => 'En el DNS', 'D' => 'En authorized_keys'],
              'ok' => 'B',
              'why' => 'La privada es la que firma: solo tiene sentido donde estás tú. Al servidor le basta la pública para verificar, y la pública es lo que va a <code>authorized_keys</code>.',
          ],
          [
              'q' => 'Tras ssh-copy-id, la conexión pide «Enter passphrase for key». ¿Qué significa?',
              'opts' => ['A' => 'Que la contraseña del servidor ha cambiado', 'B' => 'Que el cliente necesita descifrar tu llave para firmar', 'C' => 'Que la llave no se instaló', 'D' => 'Que el servidor ha desactivado las contraseñas'],
              'ok' => 'B',
              'why' => 'El servidor aceptó ofrecerte autenticación por llave y pidió una firma. La passphrase la pide tu cliente para descifrar el archivo local. El servidor no sabe nada de ella, y sus contraseñas siguen como estaban.',
          ],
          [
              'q' => 'ssh muestra «Permissions 0644 for id_ed25519 are too open». ¿Qué haces?',
              'opts' => ['A' => 'chmod 777 ~/.ssh/id_ed25519', 'B' => 'Borrar known_hosts', 'C' => 'chmod 600 ~/.ssh/id_ed25519', 'D' => 'Regenerar las host keys del servidor'],
              'ok' => 'C',
              'why' => 'La llave es legible por otros usuarios y el cliente la ignora. Hay que cerrar el permiso para que solo el dueño la lea y escriba. <code>known_hosts</code> y las host keys pertenecen a otro problema: la identidad del servidor.',
          ],
          [
              'q' => '¿Qué hace exactamente ssh-add?',
              'opts' => ['A' => 'Copia tu llave pública al servidor', 'B' => 'Guarda la passphrase en un archivo', 'C' => 'Entrega la llave descifrada al agente, que la mantiene en memoria', 'D' => 'Quita la passphrase de la llave'],
              'ok' => 'C',
              'why' => 'ssh-add descifra la llave (por eso pide la passphrase) y la entrega a ssh-agent, que la guarda en memoria y firma cuando un cliente lo necesita. El archivo del disco sigue cifrado; quitar la passphrase sería <code>ssh-keygen -p</code>, y copiar la pública, <code>ssh-copy-id</code>.',
          ],
      ]) ?>
</section>

<?= ssh_parte('04', 'El cliente a fondo',
    'Comandos remotos, el fichero config, leer ssh -v y mantener conexiones sanas.',
    'intermedio') ?>

<!-- ========================= COMANDOS REMOTOS ======================== -->
<section id="comandos-remotos">
  <h2>Comandos remotos</h2>
  <p class="tut-sub">No siempre hace falta «entrar»: ssh puede ejecutar una orden y volver.</p>

  <p>Hasta ahora has usado <code>ssh</code> para abrir una sesión: el prompt cambia de máquina y
  trabajas dentro hasta escribir <code>exit</code>. Pero si añades una orden al final del
  comando, ssh hace otra cosa: <strong>conecta, ejecuta esa orden en el servidor, te devuelve su
  salida y termina</strong>. Tu prompt nunca deja de ser el tuyo.</p>

  <?= shot('ssh/26-remoto-vs-interactivo.svg',
      'A la izquierda, ssh srv abre un shell y el prompt pasa a ser el del servidor hasta escribir exit. '
      . 'A la derecha, ssh srv hostname ejecuta una sola orden, devuelve la salida y vuelve al laptop.',
      '<b>Dónde mirar:</b> el prompt. En la sesión interactiva cambia a <code>alumno@servidor</code>; '
      . 'con un comando remoto sigue siendo <code>alumno@laptop</code> de principio a fin.') ?>

  <?= compare(
      ['ssh srv', 'Sesión interactiva',
       '<ul>
          <li>Te deja dentro del servidor.</li>
          <li>El servidor te asigna una terminal (tty).</li>
          <li>Ideal para explorar, editar o diagnosticar.</li>
          <li>Termina con <code>exit</code> o <kbd>Ctrl</kbd>+<kbd>D</kbd>.</li>
        </ul>'],
      ['ssh srv hostname', 'Comando remoto',
       '<ul>
          <li>Ejecuta una orden y vuelve.</li>
          <li>Por defecto <strong>no</strong> asigna terminal.</li>
          <li>Ideal para consultas rápidas y scripts.</li>
          <li>Termina solo, cuando termina la orden.</li>
        </ul>'],
      'Lo que escribes después del destino es una orden para el servidor, no una opción de ssh.') ?>

  <h3>Mostrar: tres consultas sin entrar</h3>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh alumno@servidor hostname
servidor
alumno@laptop:~$ ssh alumno@servidor uptime
 18:07:35 up  3:16,  0 user,  load average: 0.00, 0.00, 0.00
alumno@laptop:~$ ssh alumno@servidor 'df -h /home'
Filesystem      Size  Used Avail Use% Mounted on
overlay         757G   14G  706G   2% /
TXT, 'salida real · laboratorio') ?>

  <?= anatomy(
      '<b>ssh</b> <i>alumno@servidor</i> <u>\'df -h /home\'</u>',
      [
          ['ssh', 'El cliente, como siempre.'],
          ['alumno@servidor', 'A qué máquina y con qué usuario. Hasta aquí es idéntico a abrir una sesión.'],
          ['\'df -h /home\'', 'La orden que se ejecuta <strong>en el servidor</strong>. Las comillas la mantienen como una sola pieza; enseguida verás que además deciden <em>dónde</em> se interpretan las variables.'],
      ],
      'Comando remoto') ?>

  <p><strong>Qué observar:</strong> en ningún momento aparece el prompt del servidor. La salida
  de <code>uptime</code> dice <code>0 user</code> porque no hay nadie con una sesión interactiva
  abierta: la orden se ejecutó sin terminal.</p>

  <h3>El código de salida viaja de vuelta</h3>

  <p>ssh termina con el <strong>código de salida de la orden remota</strong>: si
  <code>test -f</code> falla en el servidor, ssh falla en tu equipo. El manual lo dice así:
  <em>«ssh exits with the exit status of the remote command or with 255 if an error
  occurred»</em>. Por eso se puede encadenar en scripts:</p>

  <?= ssh_term(<<<'TXT'
# si el fichero no existe en el servidor, no se ejecuta lo de después
$ ssh srv 'test -f public_html/index.php' && echo "está publicado"
TXT, 'bash') ?>

  <?= note('Un matiz del 255',
      '<p>Un código <code>255</code> suele significar que falló <em>ssh</em> (no resolvió, no
      conectó, no autenticó), no la orden. Si un script distingue «el servidor dijo que no» de
      «ni siquiera llegué», esa es la pista.</p>', 'info') ?>

  <h3>Cuando la orden necesita una terminal: <code>-t</code></h3>

  <p>Algunos programas necesitan una terminal para funcionar: <code>top</code>,
  <code>htop</code>, un editor o <code>sudo</code> cuando pide contraseña. Como un comando remoto
  no recibe terminal por defecto, se le pide con <code>-t</code> («force pseudo-terminal
  allocation», según <code>man ssh</code>):</p>

  <?= ssh_term(<<<'TXT'
$ ssh -t srv top
$ ssh -t srv 'sudo systemctl status sshd'
TXT, 'bash') ?>

  <?= pitfall('<p>Lanzar <code>ssh srv top</code> sin <code>-t</code> y pensar que el servidor
      está roto porque la pantalla sale rara o el programa se niega a arrancar. No es el
      servidor: es que el programa esperaba una terminal y no la tenía.</p>') ?>
</section>

<!-- ============================= QUOTING ============================= -->
<section id="quoting">
  <h2>Comillas: ¿se expande en local o en remoto?</h2>
  <p class="tut-sub">La misma variable puede valer una cosa en tu equipo y otra en el servidor. Las comillas deciden cuál.</p>

  <p>Antes de que ssh envíe la orden, <strong>tu shell local la lee primero</strong>. Si ve una
  variable como <code>$HOSTNAME</code> sin protección, la sustituye por su valor
  <em>local</em> y lo que viaja al servidor ya es el resultado. Con comillas simples, tu shell
  no toca nada y la variable llega literal: la expande el shell del servidor.</p>

  <?= shot('ssh/27-quoting.svg',
      'Salida real: echo $HOSTNAME en el laptop da laptop; ssh con comillas dobles también imprime laptop; '
      . 'ssh con comillas simples imprime servidor.',
      '<b>Dónde mirar:</b> las líneas marcadas. La orden es la misma; lo único que cambia es el tipo de '
      . 'comillas, y con él la máquina que sustituye la variable.', 'real') ?>

  <?= callouts([
      ['Comillas dobles', '<code>"echo $HOSTNAME"</code>: tu shell expande <code>$HOSTNAME</code> <strong>en el laptop</strong> antes de enviar. Al servidor le llega <code>echo laptop</code>, e imprime <code>laptop</code>.'],
      ['Comillas simples', '<code>\'echo $HOSTNAME\'</code>: tu shell no toca nada. Al servidor le llega <code>echo $HOSTNAME</code>, lo expande él, e imprime <code>servidor</code>.'],
  ]) ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ echo $HOSTNAME
laptop
alumno@laptop:~$ ssh alumno@servidor "echo $HOSTNAME"
laptop
alumno@laptop:~$ ssh alumno@servidor 'echo $HOSTNAME'
servidor
TXT, 'salida real · laboratorio') ?>

  <h3>Tuberías y la tilde</h3>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh alumno@servidor 'ls ~/public_html | wc -l'
2
alumno@laptop:~$ ssh alumno@servidor ls ~/public_html
assets
index.php
TXT, 'salida real · laboratorio') ?>

  <p>Las dos funcionan, pero por razones distintas, y conviene saberlo:</p>

  <ul>
    <li><strong>Con comillas simples</strong>, la tubería <code>| wc -l</code> y la tilde viajan
    enteras y se ejecutan en el servidor. Se cuentan los ficheros <em>del servidor</em>.</li>
    <li><strong>Sin comillas</strong>, tu shell expande <code>~/public_html</code> en el laptop a
    <code>/home/alumno/public_html</code> antes de enviar. Funcionó por casualidad: en el
    laboratorio el usuario se llama igual en las dos máquinas. Con un usuario local distinto,
    habría llegado una ruta que no existe en el servidor.</li>
  </ul>

  <?= evidence(
      '<p><code>ssh alumno@servidor ls ~/public_html</code> devolvió el contenido correcto.</p>',
      '<p>La ruta que llegó al servidor existía allí, así que la orden funcionó.</p>',
      '<p>Que la tilde se interpretara en el servidor. Se interpretó en el laptop. Y si
      hubieras escrito <code>ssh srv ls ~/public_html | wc -l</code> sin comillas, la tubería
      se habría ejecutado en <strong>tu</strong> equipo sobre la salida recibida: el resultado
      puede coincidir y el lugar de ejecución no.</p>') ?>

  <?= pitfall('<p>Regla práctica para no pensar cada vez: <strong>comillas simples alrededor de
      toda la orden remota</strong>. Usa dobles solo cuando quieras a propósito meter un valor
      de tu equipo en la orden, y sabiendo que lo haces.</p>') ?>
</section>

<!-- ============================ SSH CONFIG =========================== -->
<section id="ssh-config">
  <h2><code>~/.ssh/config</code>: dejar de teclear lo mismo</h2>
  <p class="tut-sub">Un fichero de texto en tu equipo que convierte cuatro datos en un nombre corto.</p>

  <p>Cada servidor tiene su dirección, su usuario, a veces su puerto y su llave. Escribirlo todo
  en cada orden es lento y propenso a errores. El fichero <code>~/.ssh/config</code> los guarda
  bajo un alias. Es configuración <strong>del cliente</strong>: vive en tu carpeta, lo editas
  sin <code>sudo</code> y solo afecta a tus conexiones.</p>

  <?= shot('ssh/28-config-antes-despues.svg',
      'Arriba, comandos largos con puerto, llave, usuario y dominio. En medio, el bloque Host del fichero config. '
      . 'Abajo, los mismos comandos con solo el alias.',
      '<b>Dónde mirar:</b> la columna «Después». Todas las herramientas —ssh, scp, sftp, rsync— '
      . 'aceptan el alias porque leen el mismo fichero.') ?>

  <h3>El fichero del laboratorio, línea a línea</h3>

  <?= ssh_tree(<<<'TXT'
Host srv
    HostName servidor
    User alumno
    IdentityFile ~/.ssh/id_ed25519
TXT, '~/.ssh/config') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Directivas básicas de ~/.ssh/config</caption>
      <thead><tr><th scope="col">Línea</th><th scope="col">Qué significa</th></tr></thead>
      <tbody>
        <tr><td class="f">Host srv</td><td class="d">El alias. Lo que escribirás en la orden. No tiene que existir en DNS.</td></tr>
        <tr><td class="f">HostName servidor</td><td class="d">La máquina real: un nombre resoluble o una IP. Si falta, ssh usa el propio alias como nombre.</td></tr>
        <tr><td class="f">User alumno</td><td class="d">El usuario del servidor. Sustituye al <code>alumno@</code> de la orden.</td></tr>
        <tr><td class="f">Port 2222</td><td class="d">Solo si no es el 22. En el laboratorio no hace falta y por eso no está.</td></tr>
        <tr><td class="f">IdentityFile ~/.ssh/id_ed25519</td><td class="d">Qué llave privada usar con este servidor.</td></tr>
      </tbody>
    </table>
  </div>

  <p>La sangría no es obligatoria, pero ayuda a leer: todo lo que va debajo de un
  <code>Host</code> pertenece a ese bloque hasta el siguiente <code>Host</code>.</p>

  <h3>Mostrar: el alias y lo que ssh entiende de él</h3>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ cat ~/.ssh/config
Host srv
    HostName servidor
    User alumno
    IdentityFile ~/.ssh/id_ed25519
alumno@laptop:~$ ssh srv hostname
servidor
alumno@laptop:~$ ssh -G srv | grep -E '^(user|hostname|port|identityfile) '
user alumno
hostname servidor
port 22
identityfile ~/.ssh/id_ed25519
TXT, 'salida real · laboratorio') ?>

  <?= anatomy(
      '<b>ssh -G</b> <i>srv</i>',
      [
          ['-G', 'No conecta. Imprime la configuración <strong>final</strong> que usaría para ese destino, después de aplicar el fichero y los valores por defecto.'],
          ['srv', 'El alias que quieres comprobar.'],
          ['| grep …', 'La salida completa tiene decenas de líneas; aquí solo interesan cuatro.'],
      ],
      'Comprobar la configuración') ?>

  <p><strong>Qué significa:</strong> <code>port 22</code> no está en el fichero, y aun así
  aparece. <code>ssh -G</code> enseña lo que se aplicará de verdad, incluidos los valores por
  defecto. Es la forma de dejar de adivinar.</p>

  <?= note('También existe un fichero global',
      '<p><code>/etc/ssh/ssh_config</code> es la configuración de cliente para todos los usuarios
      del equipo. Se lee <strong>después</strong> de tu <code>~/.ssh/config</code>, así que lo
      tuyo tiene preferencia. No lo confundas con <code>/etc/ssh/sshd_config</code>, que es del
      servidor.</p>', 'info') ?>

  <?= pitfall('<p>Poner en <code>~/.ssh/config</code> directivas del servidor como
      <code>PasswordAuthentication no</code> esperando proteger tu máquina. En el cliente esa
      directiva existe pero significa otra cosa: «yo no intentaré contraseñas». No cambia quién
      puede entrar en tu equipo.</p>') ?>
</section>

<!-- ======================= CONFIG PROGRESIVA ========================= -->
<section id="config-progresiva">
  <h2>Configuración progresiva</h2>
  <p class="tut-sub">Añadir opciones cuando resuelven un problema concreto, no por si acaso.</p>

  <p>Un buen <code>~/.ssh/config</code> crece a medida que aparecen necesidades. Este es el
  fichero completo del laboratorio al final del curso; cada bloque existe por un motivo que se
  explica en su capítulo.</p>

  <?= ssh_tree(<<<'TXT'
Host srv
    HostName servidor
    User alumno
    IdentityFile ~/.ssh/id_ed25519

Host srv-mux
    HostName servidor
    User alumno
    ControlMaster auto
    ControlPath ~/.ssh/cm-%C
    ControlPersist 5m

Host bastion
    HostName 192.168.56.30
    User alumno
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes

Host interno
    HostName 10.10.0.40
    User alumno
    ProxyJump bastion

Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
TXT, '~/.ssh/config · laboratorio') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Motivo de cada bloque del fichero config</caption>
      <thead><tr><th scope="col">Bloque</th><th scope="col">Qué problema resuelve</th><th scope="col">Dónde se explica</th></tr></thead>
      <tbody>
        <tr><td class="f">srv</td><td class="d">No teclear usuario ni llave.</td><td class="d">Esta sección</td></tr>
        <tr><td class="f">srv-mux</td><td class="d">Reutilizar una conexión cuando lanzas muchas órdenes seguidas.</td><td class="d">Multiplexing</td></tr>
        <tr><td class="f">bastion · IdentitiesOnly yes</td><td class="d">Ofrecer solo esa llave, no todas las del agente.</td><td class="d">Too many authentication failures</td></tr>
        <tr><td class="f">interno · ProxyJump</td><td class="d">Llegar a un servidor que solo se alcanza a través del bastión.</td><td class="d">ProxyJump</td></tr>
        <tr><td class="f">Host *</td><td class="d">Detectar conexiones muertas en redes inestables.</td><td class="d">Keepalive</td></tr>
      </tbody>
    </table>
  </div>

  <?= before_after(
      '<p><code>ssh -o IdentitiesOnly=yes -i ~/.ssh/id_ed25519 alumno@192.168.56.30</code></p>',
      '<p>Un bloque <code>Host bastion</code> con <code>HostName</code>, <code>User</code>,
      <code>IdentityFile</code> e <code>IdentitiesOnly yes</code>.</p>',
      '<p><code>ssh bastion</code> — y lo mismo para <code>scp</code>, <code>rsync</code> o
      <code>git</code>.</p>') ?>

  <?= pitfall('<p>Copiar un <code>config</code> de internet con veinte opciones
      «recomendadas». Cada opción que no entiendes es algo que no sabrás diagnosticar cuando
      falle. Si no puedes decir qué problema resuelve una línea, no la pongas.</p>') ?>
</section>

<!-- ============================ WILDCARDS ============================ -->
<section id="wildcards">
  <h2>Wildcards y precedencia</h2>
  <p class="tut-sub">Un bloque puede aplicarse a muchos servidores. Y cuando varios coinciden, gana el primer valor.</p>

  <p><code>Host</code> admite patrones: <code>*</code> sustituye a cualquier secuencia de
  caracteres y <code>?</code> a uno solo. Así se escribe una configuración común a una familia de
  servidores:</p>

  <?= ssh_tree(<<<'TXT'
Host app.empresa.lab
    User deploy

Host *.empresa.lab
    User admin
    Port 2222

Host *
    User alumno
    ServerAliveInterval 60
TXT, '~/.ssh/config · ejemplo') ?>

  <p>Si ejecutas <code>ssh app.empresa.lab</code>, <strong>los tres bloques coinciden</strong>.
  ¿Qué usuario se usa? La regla la da <code>man ssh_config</code>: <em>«Since the first obtained
  value for each directive is used, more host-specific declarations should be given near the
  beginning of the file, and general defaults at the end.»</em></p>

  <?= shot('ssh/29-precedencia.svg',
      'Tres bloques que coinciden con app.empresa.lab. User se toma del primero (deploy), Port del segundo (2222) '
      . 'y ServerAliveInterval del tercero (60); los valores posteriores de User se ignoran.',
      '<b>Dónde mirar:</b> las marcas «se aplica» e «ignorado». Cada directiva se resuelve por separado: '
      . 'gana el primer bloque que la define, no el bloque «más parecido».') ?>

  <?= callouts([
      ['User deploy', 'Viene del primer bloque que coincide. Los <code>User</code> de los bloques siguientes ya no cuentan.'],
      ['Port 2222', 'El primer bloque no define puerto, así que se toma del segundo.'],
      ['ServerAliveInterval 60', 'Solo lo define <code>Host *</code>, y se aplica.'],
  ]) ?>

  <?= ssh_term(<<<'TXT'
# compruébalo en tu equipo con tu propio fichero: -G no conecta
$ ssh -G app.empresa.lab | grep -E '^(user|port|serveraliveinterval) '
TXT, 'bash') ?>

  <?= pitfall('<p>Poner <code>Host *</code> <strong>al principio</strong> del fichero. Como el
      primer valor gana, su <code>User</code> se aplicaría a todos los servidores y ningún
      bloque específico podría cambiarlo después. Lo concreto va arriba; lo general, al
      final.</p>') ?>
</section>

<!-- ============================== DEBUG ============================== -->
<section id="debug">
  <h2>Debug: <code>-v</code>, <code>-vv</code>, <code>-vvv</code></h2>
  <p class="tut-sub">Cuando algo falla, ssh puede contarte qué está haciendo paso a paso.</p>

  <p>Un error como <code>Permission denied</code> dice <em>dónde</em> se detuvo la conexión, pero
  no <em>por qué</em>. La opción <code>-v</code> (verbose) hace que el cliente narre cada paso:
  qué ficheros de configuración lee, a qué dirección conecta, qué host key recibe, qué llaves
  ofrece y qué responde el servidor.</p>

  <?= ssh_term(<<<'TXT'
$ ssh -v srv
$ ssh -vv srv
$ ssh -vvv srv
TXT, 'bash') ?>

  <h3>Cuánto cambia cada nivel</h3>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh -v srv exit 2>&1 | wc -l
72
alumno@laptop:~$ ssh -vv srv exit 2>&1 | wc -l
144
alumno@laptop:~$ ssh -vvv srv exit 2>&1 | wc -l
222
TXT, 'salida real · laboratorio') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Niveles de verbosidad de ssh</caption>
      <thead><tr><th scope="col">Nivel</th><th scope="col">Líneas en el laboratorio</th><th scope="col">Cuándo usarlo</th></tr></thead>
      <tbody>
        <tr><td class="f">-v</td><td class="d">72</td><td class="d">Siempre primero. Muestra las etapas y basta para casi todo.</td></tr>
        <tr><td class="f">-vv</td><td class="d">144</td><td class="d">Si con <code>-v</code> no ves dónde se tuerce: añade detalle de negociación.</td></tr>
        <tr><td class="f">-vvv</td><td class="d">222</td><td class="d">Para comparar con alguien que sabe o para un informe. Rara vez para empezar.</td></tr>
      </tbody>
    </table>
  </div>

  <p><strong>Por qué <code>2&gt;&amp;1</code>:</strong> los mensajes <code>debug1:</code> salen por
  el canal de errores (stderr). Para filtrarlos con <code>grep</code> o contarlos con
  <code>wc</code> hay que redirigirlos a la salida normal.</p>

  <h3>Cómo no ahogarse en la salida</h3>

  <?= steps([
      '<strong>No leas de arriba abajo.</strong> Busca la <em>última</em> línea que fue bien y la primera que no.',
      '<strong>Busca palabras clave:</strong> <code>Connecting to</code>, <code>Connection established</code>, <code>Server host key</code>, <code>Authentications that can continue</code>, <code>Offering public key</code>, <code>Server accepts key</code>.',
      '<strong>Filtra si hace falta:</strong> <code>ssh -v srv exit 2&gt;&amp;1 | grep -E \'Offering|accepts|denied\'</code>.',
      '<strong>Compara con una conexión que funciona.</strong> La diferencia entre las dos salidas suele ser la respuesta.',
  ]) ?>

  <?= pitfall('<p>Pegar una salida de <code>-vvv</code> en un foro sin mirarla. Contiene nombres
      de host, usuarios y rutas. Revísala antes de compartirla y, sobre todo, empieza tú por
      <code>-v</code>: casi siempre la respuesta está en diez líneas.</p>') ?>
</section>

<!-- ============================ DEBUG REAL =========================== -->
<section id="debug-real">
  <h2>Leer un <code>ssh -v</code> real</h2>
  <p class="tut-sub">Una conexión que funciona, contada por el propio cliente, etapa por etapa.</p>

  <p>Esta es la salida de <code>ssh -v srv exit</code> en el laboratorio, recortada a las líneas
  que marcan cada etapa. Donde se omiten líneas, lo dice la propia figura. Compárala con los siete
  pasos de la Parte 01: son los mismos, ahora con su texto real.</p>

  <?= shot('ssh/30-debug-anotado.svg',
      'Tramos reales de ssh -v srv exit con siete marcas: aplicación del bloque Host srv, conexión TCP establecida, '
      . 'host key conocida y coincidente, métodos de autenticación disponibles, oferta de la llave, aceptación y código de salida 0.',
      '<b>Dónde mirar:</b> las siete filas marcadas, en orden. Si una conexión falla, la última marca '
      . 'que llegas a ver te dice en qué etapa se detuvo.', 'real') ?>

  <?= callouts([
      ['Applying options for srv', 'El cliente leyó <code>~/.ssh/config</code> y encontró el bloque. Si esta línea no aparece, el alias no coincide con ningún <code>Host</code>.'],
      ['Connection established', 'TCP conectó con el puerto 22. Todo lo anterior (nombre, ruta, puerto) funcionó.'],
      ['Host \'servidor\' is known and matches', 'La host key coincide con la guardada en <code>known_hosts</code>. Por eso no hubo pregunta.'],
      ['Authentications that can continue', 'El servidor anuncia qué métodos acepta: <code>publickey,password,keyboard-interactive</code>.'],
      ['Offering public key', 'El cliente ofrece una llave pública. Ofrecer no es firmar: solo pregunta si esa llave serviría.'],
      ['Server accepts key', 'El servidor la tiene en <code>authorized_keys</code>. El cliente firma el reto y queda autenticado.'],
      ['Exit status 0', 'La orden remota (<code>exit</code>) terminó bien y ssh devuelve ese mismo código.'],
  ]) ?>

  <h3>Zoom sobre la autenticación</h3>

  <?= shot('ssh/31-debug-zoom.svg',
      'Zoom de tres líneas reales: Offering public key con la ruta y huella de id_ed25519, Server accepts key con la misma huella, '
      . 'y Authenticated to servidor using publickey.',
      '<b>Dónde mirar:</b> la huella <code>SHA256:naRfLqw1…</code>. Es la misma en las dos primeras líneas: '
      . 'la llave ofrecida es la que aceptó el servidor. La palabra <code>agent</code> indica que firmó el agente.', 'real') ?>

  <?= ssh_term(<<<'TXT'
debug1: Offering public key: /home/alumno/.ssh/id_ed25519 ED25519 SHA256:naRfLqw1lzl4RNzMfQ/a0lJ2FAIuCHwbE6H7hQnqjHI explicit agent
debug1: Server accepts key: /home/alumno/.ssh/id_ed25519 ED25519 SHA256:naRfLqw1lzl4RNzMfQ/a0lJ2FAIuCHwbE6H7hQnqjHI explicit agent
Authenticated to servidor ([192.168.56.20]:22) using "publickey".
TXT, 'salida real · laboratorio') ?>

  <?= anatomy(
      '<b>Offering public key:</b> <i>/home/alumno/.ssh/id_ed25519</i> ED25519 <u>SHA256:naRfLqw1…</u> explicit agent',
      [
          ['/home/alumno/.ssh/id_ed25519', 'De qué fichero sale la llave. Confirma que ssh usa la que crees.'],
          ['ED25519', 'Tipo de llave.'],
          ['SHA256:naRfLqw1…', 'Huella de la llave. Se puede comparar con <code>ssh-add -l</code> o <code>ssh-keygen -lf</code>.'],
          ['explicit', 'La llave viene de una <code>IdentityFile</code> configurada (el bloque <code>srv</code>).'],
          ['agent', 'La firma la hará <code>ssh-agent</code>, que ya la tiene descifrada.'],
      ],
      'Una línea de -v') ?>

  <?= evidence(
      '<p>La conexión muestra <code>Server accepts key</code> para <code>id_ed25519</code> y
      termina con <code>Authenticated … using "publickey"</code>.</p>',
      '<p>El servidor tiene esa llave pública autorizada para <code>alumno</code> y la
      autenticación se hizo con ella, no con contraseña.</p>',
      '<p>Que esa sea la <em>única</em> llave autorizada, ni que el servidor no acepte
      contraseñas: la línea <code>Authentications that can continue</code> sigue listando
      <code>password</code>. <code>-v</code> cuenta lo que ocurrió en esta conexión, no todo lo
      que el servidor permitiría. Para eso hace falta mirar su configuración.</p>') ?>
</section>

<!-- ============================ KEEPALIVE ============================ -->
<section id="keepalive">
  <h2>Keepalive: conexiones que no se quedan colgadas</h2>
  <p class="tut-sub">Tres mecanismos con nombres parecidos, en lados distintos y con garantías distintas.</p>

  <p>Una sesión SSH abierta sin actividad puede «morir» sin que nadie se entere: un router con NAT
  olvida la conexión, el wifi cambia, el portátil se suspende. El síntoma típico es una terminal
  congelada que no responde ni a <kbd>Enter</kbd>. Los keepalive son mensajes periódicos para
  detectarlo.</p>

  <?= shot('ssh/32-keepalive.svg',
      'Tres tarjetas: ServerAliveInterval lo envía el cliente dentro del canal cifrado; ClientAliveInterval lo envía el servidor '
      . 'dentro del canal cifrado; TCPKeepAlive es de la capa TCP, fuera del cifrado.',
      '<b>Dónde mirar:</b> la segunda línea de cada tarjeta. Dos viven <em>dentro</em> del canal cifrado; '
      . 'el tercero, no. Esa es la diferencia que importa.') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Comparación de mecanismos keepalive</caption>
      <thead><tr><th scope="col">Opción</th><th scope="col">Dónde se configura</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">ServerAliveInterval</td><td class="d">Cliente · <code>~/.ssh/config</code></td><td class="d">Cada N segundos sin datos, el cliente pregunta al servidor por el canal cifrado. Por defecto 0: desactivado.</td></tr>
        <tr><td class="f">ServerAliveCountMax</td><td class="d">Cliente</td><td class="d">Cuántas preguntas sin respuesta tolera antes de cortar. Por defecto 3.</td></tr>
        <tr><td class="f">ClientAliveInterval</td><td class="d">Servidor · <code>sshd_config</code></td><td class="d">Lo mismo en sentido contrario: el servidor pregunta al cliente. Por defecto 0.</td></tr>
        <tr><td class="f">ClientAliveCountMax</td><td class="d">Servidor</td><td class="d">Cuántas sin respuesta antes de cerrar la sesión.</td></tr>
        <tr><td class="f">TCPKeepAlive</td><td class="d">Cliente y servidor</td><td class="d">Keepalive del sistema operativo, fuera del canal cifrado. Activo por defecto.</td></tr>
      </tbody>
    </table>
  </div>

  <p>Con el bloque <code>Host *</code> del laboratorio (<code>ServerAliveInterval 60</code> y
  <code>ServerAliveCountMax 3</code>), el cliente corta una sesión tras unos tres minutos sin
  ninguna respuesta del servidor, en lugar de quedarse colgado indefinidamente.</p>

  <?= note('Lo que dice el manual, y por qué importa',
      '<p><code>man ssh_config</code> lo deja claro: los mensajes de <em>server alive</em> viajan
      por el canal cifrado y <em>«will not be spoofable»</em>, mientras que el keepalive de
      <code>TCPKeepAlive</code> <em>«is spoofable»</em>. No son intercambiables: uno es una
      pregunta autenticada, el otro un paquete de red que un tercero podría fabricar.</p>', 'info') ?>

  <?= pitfall('<p>Pensar que <code>ServerAliveInterval</code> «mantiene viva la sesión para
      siempre». Lo que hace es <strong>detectar</strong> que está muerta y cortarla. Si la red
      cae de verdad, la sesión se cierra igual; solo que te enteras en minutos y no en
      horas.</p>') ?>
</section>

<!-- =========================== MULTIPLEXING ========================== -->
<section id="multiplexing">
  <h2>Multiplexing: una conexión, muchas sesiones</h2>
  <p class="tut-sub">Opcional y avanzado: reutilizar una conexión ya autenticada para las siguientes.</p>

  <p>Cada <code>ssh</code> normal repite todo el trabajo: TCP, negociación, verificación de la
  host key y autenticación. Si un script lanza cincuenta órdenes al mismo servidor, lo repite
  cincuenta veces. Con <strong>multiplexing</strong>, la primera conexión se queda como «maestra»
  y deja un socket local; las siguientes viajan por ella sin repetir nada.</p>

  <?= shot('ssh/33-multiplexing.svg',
      'A la izquierda, tres ssh abren tres conexiones independientes contra sshd. A la derecha, tres ssh pasan por un socket '
      . 'local y comparten una única conexión con sshd.',
      '<b>Dónde mirar:</b> el número de flechas que llegan a <code>sshd</code>. Sin multiplexing, tres; con '
      . 'ControlMaster, una.') ?>

  <?= ssh_tree(<<<'TXT'
Host srv-mux
    HostName servidor
    User alumno
    ControlMaster auto
    ControlPath ~/.ssh/cm-%C
    ControlPersist 5m
TXT, '~/.ssh/config') ?>

  <?= anatomy(
      '<b>ControlMaster</b> auto · <i>ControlPath</i> ~/.ssh/cm-%C · <u>ControlPersist</u> 5m',
      [
          ['ControlMaster auto', 'Si ya hay una conexión maestra, úsala; si no, conviértete en maestra.'],
          ['ControlPath ~/.ssh/cm-%C', 'Dónde vive el socket. <code>%C</code> es un hash de usuario, host, puerto y salto, así que cada destino tiene su socket sin mezclarse.'],
          ['ControlPersist 5m', 'La maestra sigue viva en segundo plano cinco minutos después de cerrar la última sesión.'],
      ],
      'Tres directivas') ?>

  <h3>Mostrar: la diferencia medida</h3>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ time ssh srv true

real	0m0.119s
user	0m0.009s
sys	0m0.001s
alumno@laptop:~$ time ssh srv-mux true

real	0m0.117s
user	0m0.009s
sys	0m0.001s
alumno@laptop:~$ time ssh srv-mux true

real	0m0.005s
user	0m0.003s
sys	0m0.000s
alumno@laptop:~$ ssh -O check srv-mux
Master running (pid=297)
alumno@laptop:~$ ls -l ~/.ssh | grep cm-
srw------- 1 alumno alumno    0 Sep 14 18:41 cm-6c1e202c234cb78fe031983c73b39ab2ab2f5113
alumno@laptop:~$ ssh -O exit srv-mux
Exit request sent.
TXT, 'salida real · laboratorio') ?>

  <p><strong>Qué observar:</strong> la primera conexión a <code>srv-mux</code> tarda lo mismo que
  una normal (0,117 s): es la que establece la maestra. La segunda baja a 0,005 s porque no
  negocia ni autentica. La <code>s</code> inicial de <code>srw-------</code> indica que es un
  socket, y los permisos son solo del propietario.</p>

  <p><strong>Qué significa:</strong> en un laboratorio local la diferencia son milésimas. Contra
  un servidor lejano, con latencia real, cada conexión ahorrada son fracciones de segundo que se
  multiplican por cada orden del script.</p>

  <?= evidence(
      '<p><code>ssh -O check srv-mux</code> responde <code>Master running</code> y existe el
      socket <code>cm-6c1e…</code> en <code>~/.ssh</code>.</p>',
      '<p>Hay una conexión autenticada viva, y cualquier <code>ssh srv-mux</code> que se lance
      desde esta cuenta la reutilizará sin pedir nada.</p>',
      '<p>Que esa reutilización sea inocua en cualquier máquina. Mientras el socket existe, quien
      pueda usarlo abre sesiones en el servidor <strong>sin volver a autenticarse</strong>. En
      tu portátil personal es aceptable; en un equipo compartido o con más usuarios con
      privilegios, no.</p>') ?>

  <?= note('Cuándo no activarlo',
      '<ul>
        <li>En máquinas compartidas o de salto donde otros administradores tienen root.</li>
        <li>Si el socket queda en un directorio escribible por otros: el manual pide que no lo sea.</li>
        <li>Cuando necesitas que cada conexión se autentique de nuevo por auditoría.</li>
      </ul>
      <p>Si una maestra queda en un estado raro, <code>ssh -O exit alias</code> la cierra.</p>') ?>
</section>

<!-- ========================= PRÁCTICA CLIENTE ======================== -->
<section id="practica-cliente">
  <h2>Práctica: el cliente</h2>
  <p class="tut-sub">Dos ejercicios: escribir un config desde cero y leer un -v como un diagnóstico.</p>

  <?= ssh_ejercicio([
      'num' => '10',
      'titulo' => 'Tu primer ~/.ssh/config',
      'nivel' => 'basico',
      'objetivo' => 'Objetivo: pasar de un comando con usuario y llave a un alias y comprobarlo con ssh -G.',
      'mision' => '<p>Crear un alias <code>lab</code> que conecte con el servidor de tu laboratorio sin escribir usuario ni llave.</p>',
      'escenario' => ssh_tree(<<<'TXT'
Laptop:          192.168.56.10
Servidor:        192.168.56.20
Usuario remoto:  alumno
Llave:           ~/.ssh/id_ed25519
Puerto:          22
TXT, 'datos del laboratorio'),
      'preparacion' => '<p>Una VM, contenedor o servidor propio con tu llave ya instalada (Parte 03). Si ya tienes un <code>~/.ssh/config</code>, haz antes una copia: <code>cp ~/.ssh/config ~/.ssh/config.bak</code>.</p>',
      'pasos' => [
          '<p>Escribe primero el comando completo, sin alias, y comprueba que funciona:</p>'
          . ssh_term(<<<'TXT'
$ ssh -i ~/.ssh/id_ed25519 alumno@192.168.56.20 hostname
TXT, 'bash'),
          '<p>Traduce ese comando a un bloque <code>Host lab</code> en <code>~/.ssh/config</code> y deja el fichero con permisos <code>600</code>.</p>',
          '<p>Comprueba sin conectar lo que ssh aplicará, y después conecta con el alias:</p>'
          . ssh_term(<<<'TXT'
$ ssh -G lab | grep -E '^(user|hostname|port|identityfile) '
$ ssh lab hostname
TXT, 'bash'),
      ],
      'observar' => '<p>Que <code>ssh -G lab</code> muestre tus cuatro valores (incluido <code>port 22</code>, aunque no lo escribas) y que <code>ssh lab hostname</code> devuelva lo mismo que el comando largo.</p>',
      'visual' => shot('ssh/28-config-antes-despues.svg',
          'Comandos largos arriba, bloque Host en medio y comandos cortos con el alias abajo.',
          '<b>Dónde mirar:</b> cómo cada opción del comando largo se convierte en una línea del bloque.'),
      'preguntas' => [
          '¿Qué línea del bloque sustituye a <code>alumno@</code>? ¿Y a <code>-i</code>?',
          '¿Por qué no hace falta escribir <code>Port 22</code>?',
          'Si mañana el servidor pasa al puerto 2222, ¿cuántos sitios tienes que cambiar?',
      ],
      'pistas' => [
          '<p>Cada opción del comando largo tiene una directiva equivalente. Piensa qué dato aporta cada pieza.</p>',
          '<p>Mira la tabla de «Línea a línea» de esta parte: <code>HostName</code>, <code>User</code>, <code>IdentityFile</code>.</p>',
      ],
      'solucion' => 'Un bloque de cuatro líneas: Host lab, HostName 192.168.56.20, User alumno, IdentityFile ~/.ssh/id_ed25519.',
      'porque' => ssh_tree(<<<'TXT'
Host lab
    HostName 192.168.56.20
    User alumno
    IdentityFile ~/.ssh/id_ed25519
TXT, '~/.ssh/config')
          . '<p><code>User</code> sustituye a <code>alumno@</code> e <code>IdentityFile</code> a <code>-i</code>.
          <code>Port</code> no hace falta porque 22 es el valor por defecto, y <code>ssh -G</code> lo
          demuestra al imprimirlo aunque no esté en el fichero. Si el puerto cambia, se toca
          <strong>una</strong> línea y todas las herramientas —ssh, scp, sftp, rsync, git— lo heredan.</p>',
      'error' => '<p>Escribir <code>Host 192.168.56.20</code> y <code>HostName lab</code> al revés. <code>Host</code> es el nombre que tú tecleas; <code>HostName</code>, la máquina real. Con el orden invertido, <code>ssh lab</code> no coincide con ningún bloque y ssh intenta resolver «lab» como nombre de máquina.</p>',
      'aprendiste' => 'traducir un comando a un bloque Host y verificar con ssh -G antes de conectar.',
  ]) ?>

  <?= ssh_ejercicio([
      'num' => '11',
      'titulo' => 'Leer un ssh -v',
      'nivel' => 'intermedio',
      'objetivo' => 'Objetivo: localizar en una salida real las etapas de la conexión y la línea que prueba qué llave se usó.',
      'mision' => '<p>Demostrar, solo con la salida de <code>ssh -v</code>, con qué llave te autenticaste y en qué etapa se habría detenido la conexión si hubiera fallado la host key.</p>',
      'escenario' => '<p>Tienes un alias que funciona (el del ejercicio 10 sirve) y quieres entender qué hace por dentro antes de que falle, no después.</p>',
      'preparacion' => '<p>Tu laboratorio propio y un alias funcional. No hace falta tocar el servidor.</p>',
      'pasos' => [
          '<p>Lanza una conexión que termina sola y guarda el debug en un fichero para leerlo con calma:</p>'
          . ssh_term(<<<'TXT'
$ ssh -v lab exit 2> debug.txt
$ wc -l debug.txt
TXT, 'bash'),
          '<p>Filtra las líneas de las etapas clave:</p>'
          . ssh_term(<<<'TXT'
$ grep -E 'Connection established|Server host key|is known and matches|Authentications that can continue|Offering|accepts|Authenticated' debug.txt
TXT, 'bash'),
          '<p>Compara la huella de la línea <code>Offering public key</code> con la de tu llave: <code>ssh-keygen -lf ~/.ssh/id_ed25519.pub</code>.</p>',
      ],
      'observar' => '<p>El orden de las etapas: conexión → host key → métodos disponibles → oferta → aceptación → autenticado. Y que la huella de la oferta coincide con la de tu fichero <code>.pub</code>.</p>',
      'visual' => shot('ssh/30-debug-anotado.svg',
          'Salida real de ssh -v con siete etapas marcadas.',
          '<b>Dónde mirar:</b> las marcas 3, 5 y 6.', 'real'),
      'preguntas' => [
          '¿Qué línea prueba qué llave se usó para autenticar? ¿Por qué no basta con <code>Offering public key</code>?',
          'Si la host key del servidor no coincidiera con <code>known_hosts</code>, ¿verías alguna línea <code>Offering</code>?',
          '¿Qué te dice la palabra <code>agent</code> al final de la línea?',
      ],
      'pistas' => [
          '<p>Ofrecer y aceptar son pasos distintos: el cliente puede ofrecer varias llaves y el servidor rechazarlas todas.</p>',
          '<p>Recuerda el orden de los siete pasos: la host key se verifica <em>antes</em> de autenticarte.</p>',
      ],
      'solucion' => 'La prueba es «Server accepts key» (seguida de «Authenticated … using "publickey"»), no «Offering public key».',
      'porque' => '<p>En la salida del laboratorio aparecen, en este orden:</p>'
          . ssh_term(<<<'TXT'
debug1: Offering public key: /home/alumno/.ssh/id_ed25519 ED25519 SHA256:naRfLqw1lzl4RNzMfQ/a0lJ2FAIuCHwbE6H7hQnqjHI explicit agent
debug1: Server accepts key: /home/alumno/.ssh/id_ed25519 ED25519 SHA256:naRfLqw1lzl4RNzMfQ/a0lJ2FAIuCHwbE6H7hQnqjHI explicit agent
Authenticated to servidor ([192.168.56.20]:22) using "publickey".
TXT, 'salida real · laboratorio')
          . '<p><code>Offering</code> solo significa «¿te sirve esta?»; con varias llaves verías varias
          ofertas. <code>Server accepts key</code> identifica la que el servidor aceptó, y la huella
          lo confirma sin ambigüedad. Si la host key no coincidiera, la conexión se detendría en el
          paso de verificación y <strong>nunca</strong> llegarías a ofrecer llaves. La palabra
          <code>agent</code> indica que firmó <code>ssh-agent</code>, por eso no se pidió la
          passphrase.</p>',
      'error' => '<p>Ver una línea <code>Offering public key</code> y concluir «usa esta llave». Si después aparece <code>Authentications that can continue</code> otra vez en lugar de <code>accepts</code>, esa llave fue rechazada y el cliente pasó a la siguiente.</p>',
      'aprendiste' => 'a leer ssh -v buscando etapas y a distinguir ofrecer, aceptar y autenticar.',
  ]) ?>

  <?= ssh_cierre('El cliente a fondo', [
      'Una orden al final de <code>ssh</code> se ejecuta en el servidor y ssh devuelve su código de salida (255 si falla ssh).',
      'Las comillas simples envían la orden literal; las dobles dejan que tu shell expanda variables antes de enviar.',
      '<code>~/.ssh/config</code> guarda alias con <code>HostName</code>, <code>User</code>, <code>Port</code> e <code>IdentityFile</code>, y lo leen todas las herramientas.',
      'Con varios bloques que coinciden, gana el primer valor obtenido para cada directiva: lo concreto arriba, <code>Host *</code> al final.',
      '<code>ssh -v</code> narra la conexión por etapas; <code>ServerAliveInterval</code> detecta sesiones muertas y ControlMaster reutiliza conexiones.',
  ], [
      'ssh srv \'orden\'',
      'ssh -t srv top',
      'ssh -G srv',
      'ssh -v srv exit 2>&1 | grep Offering',
      'ssh -O check srv-mux',
      'ssh -O exit srv-mux',
  ], [
      '<code>ssh -G</code> enseña la configuración final, incluidos valores por defecto.',
      'Ofrecer una llave no es que la acepten: busca <code>Server accepts key</code>.',
      'TCPKeepAlive va fuera del canal cifrado; ServerAliveInterval, dentro.',
      'Un socket de ControlMaster permite abrir sesiones sin reautenticar mientras vive.',
  ],
      '<p>Poner <code>Host *</code> al principio de <code>~/.ssh/config</code>. Sus valores se
      aplican primero a todos los servidores y ningún bloque posterior puede cambiarlos. Y, en
      segundo lugar, usar comillas dobles por costumbre en órdenes remotas: la variable se expande
      en tu equipo y el servidor recibe un valor que no es el suyo.</p>',
  [
      [
          'q' => 'Ejecutas ssh srv "echo $HOSTNAME" desde tu laptop. ¿Qué imprime?',
          'opts' => ['A' => 'El nombre del servidor', 'B' => 'El nombre de tu laptop', 'C' => 'La cadena literal $HOSTNAME', 'D' => 'Nada: da error'],
          'ok' => 'B',
          'why' => 'Con comillas dobles, tu shell sustituye <code>$HOSTNAME</code> antes de que ssh envíe nada. Al servidor le llega <code>echo laptop</code>. En el laboratorio, la salida real fue exactamente <code>laptop</code>.',
      ],
      [
          'q' => 'En tu config, Host * (con User alumno) está ANTES que Host srv (con User deploy). ¿Con qué usuario conecta ssh srv?',
          'opts' => ['A' => 'deploy, porque es más específico', 'B' => 'alumno, porque es el primer valor obtenido', 'C' => 'Pregunta cuál usar', 'D' => 'Tu usuario local'],
          'ok' => 'B',
          'why' => 'ssh_config no busca el bloque «más parecido»: para cada directiva usa el primer valor que encuentra entre los bloques que coinciden. <code>Host *</code> coincide con todo y está antes. <code>ssh -G srv</code> lo habría mostrado sin conectar.',
      ],
      [
          'q' => '¿Qué línea de ssh -v prueba que el servidor aceptó una llave concreta?',
          'opts' => ['A' => 'Offering public key', 'B' => 'identity file … type 3', 'C' => 'Server accepts key', 'D' => 'Connection established'],
          'ok' => 'C',
          'why' => '<code>Offering</code> es solo la pregunta del cliente y <code>identity file</code> indica que el fichero existe. <code>Server accepts key</code>, con su huella, dice qué llave aceptó el servidor.',
      ],
      [
          'q' => '¿Cuál de estos mecanismos viaja FUERA del canal cifrado y puede falsificarse?',
          'opts' => ['A' => 'ServerAliveInterval', 'B' => 'ClientAliveInterval', 'C' => 'TCPKeepAlive', 'D' => 'ControlPersist'],
          'ok' => 'C',
          'why' => '<code>man ssh_config</code> explica que los mensajes de server alive van por el canal cifrado y no son falsificables, mientras que el keepalive de TCP sí lo es. ControlPersist no es un keepalive: mantiene viva la conexión maestra.',
      ],
  ]) ?>
</section>

<?= ssh_parte('05', 'Mover archivos',
    'scp, sftp y rsync sobre la misma conexión, y cómo no borrar lo que no querías.',
    'intermedio') ?>

<!-- ============================== TRANSFERIR ========================== -->
<section id="transferir">
  <h2>SSH, SCP, SFTP y rsync: cuatro herramientas, una conexión</h2>
  <p class="tut-sub">No son cuatro protocolos que aprender desde cero: son cuatro formas de usar el mismo canal cifrado.</p>

  <p>Hasta ahora has usado SSH para <strong>ejecutar</strong> cosas en el servidor. Mover
  archivos es la otra mitad del trabajo diario: subir una web, bajar un log, hacer una copia de
  seguridad. Para eso no hace falta abrir otro puerto ni otro servicio: las herramientas de
  transferencia viajan <strong>dentro de la misma conexión SSH</strong>, con el mismo usuario,
  la misma llave y el mismo <code>~/.ssh/config</code>.</p>

  <?= shot('ssh/34-herramientas.svg',
      'Tu equipo y el servidor unidos por cuatro herramientas que comparten la conexión SSH: '
      . 'ssh para shell y comandos, scp para copiar, sftp para explorar y transferir a mano, '
      . 'rsync para sincronizar solo lo que cambió.',
      '<b>Dónde mirar:</b> las cuatro cajas salen del mismo equipo y llegan al mismo '
      . '<code>sshd</code>. Si <code>ssh srv</code> funciona, las otras tres también pueden '
      . 'funcionar con <code>srv</code>.', 'ilustrativo') ?>

  <h3>Una analogía para no mezclarlas</h3>
  <?= note('La misma carretera, cuatro vehículos',
      '<p>La conexión SSH es una carretera privada y vigilada entre tu casa y la oficina.
      <strong>ssh</strong> es ir tú en persona a trabajar allí. <strong>scp</strong> es mandar un
      paquete concreto. <strong>sftp</strong> es ir con una carretilla y decidir en el momento qué
      llevas y qué traes. <strong>rsync</strong> es una mudanza inteligente: compara las dos casas
      y solo transporta lo que falta o cambió.</p>', 'info') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Comparación de las herramientas de transferencia</caption>
      <thead><tr><th scope="col">Herramienta</th><th scope="col">Qué hace</th><th scope="col">Cuándo la eliges</th><th scope="col">Qué no hace</th></tr></thead>
      <tbody>
        <tr><td class="f">ssh</td><td class="d">Shell remoto y comandos</td><td class="d">Administrar, mirar, ejecutar</td><td class="d">No copia archivos por sí mismo</td></tr>
        <tr><td class="f">scp</td><td class="d">Copia origen → destino en un comando</td><td class="d">Un archivo o carpeta puntual</td><td class="d">No compara: copia todo cada vez</td></tr>
        <tr><td class="f">sftp</td><td class="d">Sesión interactiva de archivos</td><td class="d">Explorar antes de decidir</td><td class="d">No es cómodo para automatizar</td></tr>
        <tr><td class="f">rsync</td><td class="d">Sincroniza enviando solo diferencias</td><td class="d">Proyectos, backups, despliegues</td><td class="d">No perdona una barra de más ni un <code>--delete</code> sin ensayo</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Qué hay por debajo</h3>
  <p><strong>SFTP</strong> no es «FTP con S»: es un protocolo propio que corre como
  <em>subsistema</em> de SSH. En el servidor lo atiende un programa, <code>sftp-server</code>,
  que <code>sshd</code> lanza cuando un cliente lo pide (en el laboratorio es la línea
  <code>Subsystem sftp</code> de <code>sshd_config</code>). <strong>SCP</strong> nació como un
  protocolo más antiguo y simple; en OpenSSH moderno, el programa <code>scp</code> usa por
  defecto el protocolo SFTP por debajo, y solo con <code>-O</code> vuelve al SCP clásico
  (<code>man scp</code>: «Use the legacy SCP protocol for file transfers instead of the SFTP
  protocol»). <strong>rsync</strong> es un programa aparte que se ejecuta en los dos extremos y
  usa SSH como transporte: por eso tiene que estar instalado también en el servidor.</p>

  <?= pitfall('<p>Pensar que «SFTP» y «FTPS» son lo mismo. FTPS es FTP con TLS, otro servicio
      en otros puertos y con otro login. SFTP es SSH: mismo puerto 22, mismo usuario, misma llave.
      Si tu proveedor te da acceso SSH, ya tienes SFTP; no necesitas «activar FTP seguro».</p>') ?>
</section>

<!-- ================================= SCP ============================== -->
<section id="scp">
  <h2>scp: copiar en una línea</h2>
  <p class="tut-sub">Origen primero, destino después. El lado que lleva «:» es el remoto.</p>

  <p><code>scp</code> se lee igual que <code>cp</code>: <strong>qué copio</strong> y <strong>a
  dónde</strong>. La única novedad es cómo se escribe «un archivo que está en otra máquina»:
  <code>servidor:ruta</code>. Los dos puntos son los que marcan cuál de los dos lados es el
  remoto, y por tanto la dirección de la copia.</p>

  <?= shot('ssh/35-scp-direcciones.svg',
      'Dos franjas. Subir: scp informe.txt srv:/home/alumno/ copia del laptop al servidor. '
      . 'Bajar: scp srv:/home/alumno/logs/app.log . copia del servidor al directorio actual del laptop.',
      '<b>Dónde mirar:</b> la posición de <code>srv:</code>. Si va en el segundo argumento, '
      . 'subes; si va en el primero, bajas. El punto final <code>.</code> significa «aquí, en mi '
      . 'directorio actual».', 'ilustrativo') ?>

  <h3>Subir: local → remoto</h3>
  <?= anatomy('<b>scp</b> <i>informe.txt</i> <u>srv:/home/alumno/</u>', [
      ['scp', 'El programa. Usa la configuración de <code>~/.ssh/config</code>: <code>srv</code> ya lleva usuario, host y llave.'],
      ['informe.txt', 'Origen, <strong>local</strong>: no lleva «:». Ruta relativa a tu directorio actual.'],
      ['srv:', 'El host remoto. Sin los dos puntos, <code>scp</code> crearía un archivo local llamado «srv».'],
      ['/home/alumno/', 'Destino dentro del servidor. La barra final dice «dentro de esta carpeta».'],
  ], 'Subir un archivo') ?>

  <h3>Bajar: remoto → local</h3>
  <?= anatomy('<b>scp</b> <u>srv:/home/alumno/logs/app.log</u> <i>.</i>', [
      ['srv:/home/alumno/logs/app.log', 'Origen, <strong>remoto</strong>: ahora es el primer argumento el que lleva «:».'],
      ['.', 'Destino local: el directorio en el que estás. Podrías poner otra ruta o un nombre nuevo.'],
  ], 'Bajar un archivo') ?>

  <h3>Carpetas: -r</h3>
  <p>Sin <code>-r</code> (recursivo), <code>scp</code> se niega a copiar un directorio. Con
  <code>-r</code> copia la carpeta entera, con todo lo que tenga dentro. Y «todo» es literal.</p>

  <?= shot('ssh/36-scp-real.svg',
      'Salida real: scp sube informe.txt con su barra de progreso al cien por cien; baja app.log '
      . 'del servidor; copia la carpeta proyecto con -r archivo a archivo, incluidos .env y HEAD '
      . 'de .git; ls -la en el servidor confirma que llegó todo.',
      '<b>Dónde mirar:</b> la lista de archivos del <code>scp -r</code>. Entre ellos van '
      . '<code>.env</code> y el contenido de <code>.git</code>: <code>scp</code> no sabe qué es '
      . 'un secreto.', 'real') ?>
  <?= callouts([
      ['Subir', '<code>scp informe.txt srv:/home/alumno/</code>: una línea de progreso por archivo, con tamaño, velocidad y tiempo.'],
      ['Bajar', '<code>scp srv:/home/alumno/logs/app.log .</code>: el archivo aparece en tu directorio actual.'],
      ['Carpeta con -r', 'Recorre la carpeta y copia cada archivo, uno por línea.'],
      ['.env también viaja', 'La copia incluyó el archivo de variables con la contraseña de base de datos local. Copiar «la carpeta» es copiar sus secretos.'],
  ]) ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ scp srv:/home/alumno/logs/app.log .
app.log                                                           100%   22    45.1KB/s   00:00
alumno@laptop:~$ ls -l app.log
-rw-r--r-- 1 alumno alumno 22 Sep 14 18:47 app.log
alumno@laptop:~$ cat app.log
[2026-09-14 10:00] OK
TXT, 'salida real · laboratorio') ?>

  <h3>El puerto: -P mayúscula</h3>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Opciones de scp que se confunden</caption>
      <thead><tr><th scope="col">Opción</th><th scope="col">En scp significa</th><th scope="col">Ojo</th></tr></thead>
      <tbody>
        <tr><td class="f">-P 2222</td><td class="d">Puerto del servidor</td><td class="d">En <code>ssh</code> el puerto es <code>-p</code> minúscula</td></tr>
        <tr><td class="f">-p</td><td class="d">Conserva fechas de modificación y acceso y los permisos</td><td class="d">No es el puerto: <code>scp -p 2222 …</code> intentará copiar un archivo llamado «2222»</td></tr>
        <tr><td class="f">-r</td><td class="d">Copia directorios de forma recursiva</td><td class="d">Copia también lo oculto (<code>.env</code>, <code>.git</code>)</td></tr>
        <tr><td class="f">-O</td><td class="d">Usa el protocolo SCP clásico en lugar de SFTP</td><td class="d">Solo para servidores antiguos que no tienen SFTP</td></tr>
      </tbody>
    </table>
  </div>

  <?= ssh_term(<<<'TXT'
$ scp -P 2222 informe.txt USUARIO@servidor.ejemplo.com:backups/
TXT, 'bash') ?>

  <p>Fíjate en <code>backups/</code> sin barra inicial: una ruta remota relativa se interpreta
  <strong>desde el home del usuario remoto</strong>. <code>srv:backups/</code> es
  <code>/home/alumno/backups/</code> en el laboratorio.</p>

  <?= pitfall('<p>Olvidar los dos puntos: <code>scp informe.txt srv</code> no sube nada al
      servidor, crea en tu equipo una copia llamada <code>srv</code>. No hay error, porque para
      <code>scp</code> es una copia local perfectamente válida.</p>') ?>
</section>

<!-- ================================= SFTP ============================= -->
<section id="sftp">
  <h2>sftp: una sesión para explorar y transferir</h2>
  <p class="tut-sub">Dos lados abiertos a la vez. Cada orden actúa en uno; la «l» delante significa local.</p>

  <p>Con <code>sftp</code> no das una orden y terminas: abres una <strong>sesión</strong> con un
  prompt propio, <code>sftp&gt;</code>, y desde ahí miras el servidor, eliges qué traer y qué
  llevar, y te vas con <code>bye</code>. Es la opción natural cuando todavía no sabes qué hay al
  otro lado.</p>

  <p>La clave para no perderse es que <strong>durante toda la sesión tienes dos directorios
  actuales</strong>: uno en el servidor y otro en tu equipo. Las órdenes normales
  (<code>pwd</code>, <code>ls</code>, <code>cd</code>, <code>mkdir</code>) actúan en el
  servidor; las mismas con una <code>l</code> delante (<code>lpwd</code>, <code>lls</code>,
  <code>lcd</code>, <code>lmkdir</code>) actúan en tu equipo.</p>

  <?= shot('ssh/37-sftp-local-remoto.svg',
      'Tabla de gemelas: pwd y lpwd, ls y lls, cd y lcd, mkdir y lmkdir; debajo, get trae del '
      . 'servidor a tu equipo y put lleva de tu equipo al servidor.',
      '<b>Dónde mirar:</b> las flechas de abajo. <code>get</code> siempre trae hacia ti; '
      . '<code>put</code> siempre lleva hacia el servidor. Da igual en qué directorio estés.',
      'ilustrativo') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Órdenes de sftp en el servidor y en el equipo local</caption>
      <thead><tr><th scope="col">En el SERVIDOR</th><th scope="col">En TU EQUIPO</th><th scope="col">Para qué</th></tr></thead>
      <tbody>
        <tr><td class="f">pwd</td><td class="f">lpwd</td><td class="d">¿En qué directorio estoy?</td></tr>
        <tr><td class="f">ls</td><td class="f">lls</td><td class="d">¿Qué hay aquí?</td></tr>
        <tr><td class="f">cd carpeta</td><td class="f">lcd carpeta</td><td class="d">Cambiar de directorio</td></tr>
        <tr><td class="f">mkdir nueva</td><td class="f">lmkdir nueva</td><td class="d">Crear un directorio</td></tr>
        <tr><td class="f">get archivo</td><td class="f">—</td><td class="d">Traer del servidor al directorio local actual</td></tr>
        <tr><td class="f">put archivo</td><td class="f">—</td><td class="d">Llevar del directorio local actual al servidor</td></tr>
        <tr><td class="f">bye / exit</td><td class="f">—</td><td class="d">Cerrar la sesión</td></tr>
      </tbody>
    </table>
  </div>

  <?= shot('ssh/38-sftp-real.svg',
      'Salida real de una sesión sftp srv: pwd y lpwd muestran /home/alumno en los dos lados; ls y '
      . 'lls listan cada uno; cd public_html y lcd proyecto cambian cada lado; put index.php sube; '
      . 'get assets/app.css app-del-servidor.css baja con otro nombre; mkdir y rmdir crean y quitan '
      . 'una carpeta remota; bye cierra.',
      '<b>Dónde mirar:</b> los mensajes <code>Uploading … to /home/alumno/public_html/index.php</code> '
      . 'y <code>Fetching /home/alumno/public_html/assets/app.css to app-del-servidor.css</code>: '
      . '<code>sftp</code> te dice la ruta completa de origen y de destino.', 'real') ?>
  <?= callouts([
      ['pwd', '«Remote working directory»: dónde estás en el servidor.'],
      ['lpwd', '«Local working directory»: dónde estás en tu equipo. Es la mitad que se olvida.'],
      ['put', 'Sube desde el directorio local actual (tras <code>lcd proyecto</code>) al remoto actual (tras <code>cd public_html</code>).'],
      ['get con nombre nuevo', 'El segundo argumento es el nombre local: así no pisas un archivo que ya tienes.'],
      ['bye', 'Cierra la sesión y vuelves al prompt de tu equipo.'],
  ]) ?>

  <?= ssh_term(<<<'TXT'
sftp> cd public_html
sftp> ls -l
drwxr-sr-x    ? alumno   alumno       4096 Sep 14 18:03 assets
-rw-r--r--    ? alumno   alumno         22 Sep 14 18:03 index.php
-rw-r--r--    ? alumno   alumno          0 Sep 14 18:10 viejo.html
sftp> lcd proyecto
sftp> put index.php
Uploading index.php to /home/alumno/public_html/index.php
index.php                                                         100%   22    78.2KB/s   00:00
TXT, 'salida real · laboratorio') ?>

  <?= evidence(
      '<p><code>put index.php</code> respondió <code>Uploading index.php to
      /home/alumno/public_html/index.php</code> y la línea de progreso llegó al 100%.</p>',
      '<p>El archivo se subió y <strong>sustituyó</strong> al <code>index.php</code> que ya
      había en <code>public_html</code>: el listado anterior mostraba uno de 22 bytes con fecha
      18:03.</p>',
      '<p>Que se subiera el <code>index.php</code> correcto. <code>put</code> toma el del
      directorio local actual; si <code>lcd</code> te dejó en otra carpeta con otro
      <code>index.php</code>, habrá subido ese. Por eso se mira <code>lpwd</code> antes, no
      después.</p>') ?>

  <?= pitfall('<p>Hacer <code>cd</code> cuando querías <code>lcd</code>. Cambias el directorio
      del servidor, el local sigue donde estaba, y el siguiente <code>put</code> no encuentra el
      archivo o sube otro con el mismo nombre. Si dudas, <code>pwd</code> y <code>lpwd</code>
      seguidos te dicen dónde está cada mitad.</p>') ?>
</section>

<!-- ================================= RSYNC ============================ -->
<section id="rsync">
  <h2>rsync sobre SSH: sincronizar, no copiar</h2>
  <p class="tut-sub">Compara origen y destino y envía solo lo que falta o cambió. Es la base de un despliegue serio.</p>

  <p><code>scp</code> copia todo cada vez. <code>rsync</code> primero <strong>compara</strong>:
  mira qué archivos existen en el destino, cuáles cambiaron de tamaño o fecha, y solo transfiere
  la diferencia. En un proyecto de cientos de archivos donde tocaste dos, la segunda
  sincronización tarda lo que tarda enviar esos dos.</p>

  <?= anatomy('<b>rsync</b> <i>-av</i> <u>proyecto/</u> srv:public_html/', [
      ['rsync', 'Tiene que estar instalado en los dos lados: en tu equipo y en el servidor.'],
      ['-a', '«Archive»: equivale a <code>-rlptgoD</code>. Recursivo, conserva enlaces simbólicos, permisos, fechas, grupo, propietario y dispositivos. Es lo que quieres casi siempre.'],
      ['-v', '«Verbose»: lista cada archivo que envía. Sin él no sabes qué pasó.'],
      ['proyecto/', 'Origen. La barra final importa muchísimo: la verás en la siguiente sección.'],
      ['srv:public_html/', 'Destino remoto, relativo al home del usuario. Los dos puntos, igual que en <code>scp</code>.'],
  ], 'La forma básica') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Opciones de rsync de uso diario</caption>
      <thead><tr><th scope="col">Opción</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">-a</td><td class="d">Modo archivo: recursivo y conserva metadatos (<code>-rlptgoD</code>)</td></tr>
        <tr><td class="f">-v</td><td class="d">Enumera lo que transfiere</td></tr>
        <tr><td class="f">-n, --dry-run</td><td class="d">Ensayo: dice qué haría sin cambiar nada</td></tr>
        <tr><td class="f">-z</td><td class="d">Comprime los datos durante la transferencia (útil en conexiones lentas)</td></tr>
        <tr><td class="f">--progress</td><td class="d">Muestra el progreso de cada archivo</td></tr>
        <tr><td class="f">--exclude=PATRÓN</td><td class="d">No envía lo que coincide con el patrón</td></tr>
        <tr><td class="f">--exclude-from=ARCHIVO</td><td class="d">Lee los patrones de exclusión de un archivo, uno por línea</td></tr>
        <tr><td class="f">-e 'ssh -p 2222'</td><td class="d">Cambia cómo se lanza el transporte SSH (puerto, opciones)</td></tr>
        <tr><td class="f">--delete</td><td class="d">Borra en el destino lo que no existe en el origen. Sección propia más abajo.</td></tr>
      </tbody>
    </table>
  </div>

  <?= ssh_term(<<<'TXT'
$ rsync -avz --progress -e 'ssh -p 2222' proyecto/ USUARIO@servidor.ejemplo.com:public_html/
TXT, 'bash') ?>

  <p>Con un alias en <code>~/.ssh/config</code> no necesitas <code>-e</code>: si
  <code>srv</code> ya lleva puerto y llave, <code>rsync -av proyecto/ srv:public_html/</code>
  los usa, porque <code>rsync</code> llama a <code>ssh</code> y <code>ssh</code> lee su
  configuración.</p>

  <h3>Incremental de verdad: la segunda pasada</h3>
  <?= shot('ssh/40-rsync-incremental.svg',
      'Salida real de tres ejecuciones seguidas: con exclusiones envía index.php y assets/app.css; '
      . 'repetida sin cambios, la lista de archivos queda vacía; con --delete y --dry-run anuncia '
      . 'deleting viejo.html y termina con (DRY RUN).',
      '<b>Dónde mirar:</b> la lista vacía de la segunda ejecución. No es un error: es '
      . '<code>rsync</code> diciendo «ya está todo igual, no hay nada que enviar».', 'real') ?>
  <?= callouts([
      ['Las exclusiones', '<code>.rsyncignore</code> lista lo que no debe salir de tu equipo: <code>.git/</code>, <code>.env</code>, <code>logs/</code>, notas y el propio script.'],
      ['Primera pasada', 'Solo viajan <code>index.php</code> y <code>assets/app.css</code>: todo lo demás está excluido.'],
      ['Segunda pasada', 'Lista vacía y <code>sent 143 bytes</code>: solo se habló de metadatos. Nada cambió, nada viaja.'],
      ['deleting viejo.html', 'Con <code>--delete</code>, <code>rsync</code> borraría ese archivo del servidor porque no existe en el origen.'],
      ['(DRY RUN)', 'Era un ensayo: <code>viejo.html</code> sigue en el servidor.'],
  ]) ?>

  <?= pitfall('<p>Dar por hecho que el servidor tiene <code>rsync</code>. Si no lo tiene, la
      conexión SSH funciona pero la sincronización falla al intentar arrancar el
      <code>rsync</code> remoto. En un hosting compartido, compruébalo antes con
      <code>ssh srv \'rsync --version\'</code>.</p>') ?>
</section>

<!-- ============================== BARRA FINAL ========================= -->
<section id="rsync-barra">
  <h2>La barra final de rsync</h2>
  <p class="tut-sub">Un carácter decide si copias el contenido de la carpeta o la carpeta entera.</p>

  <p>Es el error más frecuente con <code>rsync</code> y no da ningún aviso. La regla:</p>
  <ul>
    <li><code>proyecto/</code> <strong>con barra</strong> = «lo que hay <em>dentro</em> de proyecto».</li>
    <li><code>proyecto</code> <strong>sin barra</strong> = «la carpeta proyecto, con su nombre».</li>
  </ul>

  <?= compare(
      ['proyecto/', 'Con barra · el contenido',
       ssh_tree(<<<'TXT'
rsync -av proyecto/ srv:demo-con-barra/

demo-con-barra/
├── index.php
├── assets/
│   └── app.css
└── …
TXT, 'resultado')],
      ['proyecto', 'Sin barra · la carpeta dentro',
       ssh_tree(<<<'TXT'
rsync -av proyecto srv:demo-sin-barra/

demo-sin-barra/
└── proyecto/
    ├── index.php
    ├── assets/
    │   └── app.css
    └── …
TXT, 'resultado')],
      'Para desplegar una web en <code>public_html</code> casi siempre quieres la primera: el
       contenido de tu proyecto directamente en la raíz del sitio.') ?>

  <?= shot('ssh/39-rsync-barra.svg',
      'Salida real de tree en el servidor sobre los dos destinos: demo-con-barra contiene '
      . 'directamente .env, .git, assets, index.php y demás; demo-sin-barra contiene una única '
      . 'carpeta proyecto con todo dentro.',
      '<b>Dónde mirar:</b> el nivel extra <code>└── proyecto</code> bajo '
      . '<code>demo-sin-barra</code>. Si esto te pasa en <code>public_html</code>, tu web queda '
      . 'en <code>tudominio/proyecto/</code> en vez de en la raíz.', 'real') ?>
  <?= callouts([
      ['demo-con-barra', 'Recibió el contenido: los archivos del proyecto están en su primer nivel.'],
      ['demo-sin-barra', 'Recibió la carpeta, no su contenido.'],
      ['└── proyecto', 'El nivel de más. Es exactamente lo que añade quitar la barra del origen.'],
  ]) ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ rsync -av proyecto srv:demo-sin-barra/
sending incremental file list
created directory demo-sin-barra
proyecto/
proyecto/.env
proyecto/.rsyncignore
proyecto/deploy.sh
proyecto/index.php
proyecto/notas.txt
proyecto/.git/
proyecto/.git/HEAD
proyecto/assets/
proyecto/assets/app.css
proyecto/logs/
proyecto/logs/dev.log

sent 1,756 bytes  received 225 bytes  3,962.00 bytes/sec
total size is 1,032  speedup is 0.52
TXT, 'salida real · laboratorio') ?>

  <p>La propia salida ya lo avisa: todas las rutas empiezan por <code>proyecto/</code>. Leer la
  lista antes de dar por bueno un <code>rsync</code> es la costumbre que evita este error.</p>

  <?= pitfall('<p>Pensar que la barra del <strong>destino</strong> es la que cuenta. En
      <code>rsync</code> la que cambia el resultado es la del <strong>origen</strong>.
      <code>srv:public_html</code> y <code>srv:public_html/</code> apuntan al mismo sitio; en
      cambio <code>proyecto</code> y <code>proyecto/</code> no copian lo mismo.</p>') ?>
</section>

<!-- ================================ DRY RUN =========================== -->
<section id="dry-run">
  <h2>--dry-run: ensayar antes de tocar</h2>
  <p class="tut-sub">La misma orden, con un interruptor que la convierte en simulacro.</p>

  <p><code>--dry-run</code> (o <code>-n</code>) hace todo el trabajo de comparar y
  <strong>enseña la lista exacta</strong> de lo que enviaría o borraría, pero no cambia nada. Es
  gratis, tarda segundos y responde a la única pregunta que importa antes de un despliegue:
  «¿esto es lo que quiero?».</p>

  <?= before_after(
      '<p><code>rsync -av proyecto/ srv:public_html/</code> directamente, confiando en que solo
      subirá la web.</p>',
      '<p>La misma orden con <code>--dry-run</code>, y leer la lista.</p>',
      '<p>Descubres que habría publicado <code>.env</code>, <code>.git</code>, los logs y el
      script de despliegue. Añades exclusiones y vuelves a ensayar.</p>') ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ rsync -av --dry-run proyecto/ srv:public_html/
sending incremental file list
.env
.rsyncignore
deploy.sh
index.php
notas.txt
.git/
.git/HEAD
assets/
assets/app.css
logs/
logs/dev.log

sent 374 bytes  received 52 bytes  852.00 bytes/sec
total size is 1,032  speedup is 2.42 (DRY RUN)
TXT, 'salida real · laboratorio') ?>

  <?= evidence(
      '<p>El ensayo sin exclusiones lista <code>.env</code>, <code>.git/HEAD</code>,
      <code>logs/dev.log</code> y <code>deploy.sh</code>, y termina con <code>(DRY RUN)</code>.</p>',
      '<p>Si se hubiera ejecutado de verdad, el archivo con credenciales y el historial de Git
      habrían quedado dentro de la carpeta pública de la web.</p>',
      '<p>Que ya estén expuestos: era un ensayo y no se envió nada. Tampoco podemos afirmar que
      la lista con exclusiones sea correcta hasta volver a ensayarla: cada cambio en los patrones
      merece otro <code>--dry-run</code>.</p>') ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ cat proyecto/.rsyncignore
.git/
.env
logs/
notas.txt
.rsyncignore
deploy.sh
alumno@laptop:~$ rsync -av --exclude-from=proyecto/.rsyncignore proyecto/ srv:public_html/
sending incremental file list
index.php
assets/
assets/app.css

sent 300 bytes  received 74 bytes  748.00 bytes/sec
total size is 60  speedup is 0.16
TXT, 'salida real · laboratorio') ?>

  <?= pitfall('<p>Hacer el ensayo, ver una lista larga y no leerla. <code>--dry-run</code> no
      protege de nada por sí mismo: protege la lectura que haces de su salida. Busca en concreto
      archivos ocultos, secretos y cualquier línea <code>deleting</code>.</p>') ?>
</section>

<!-- ================================ DELETE ============================ -->
<section id="delete">
  <h2>--delete, con mucho cuidado</h2>
  <p class="tut-sub">Hace que el destino sea un espejo del origen. Incluido lo que el origen no tiene.</p>

  <?= note('⚠ Aviso: --delete borra archivos en el servidor',
      '<p><code>--delete</code> elimina del <strong>destino</strong> todo lo que no existe en el
      <strong>origen</strong>. No hay papelera ni confirmación. Si el destino es la carpeta
      equivocada, o te sobra o te falta una barra, puede vaciar un directorio entero.</p>
      <p>Regla sin excepciones: <strong>primero la misma orden con <code>--dry-run</code></strong>,
      lee cada línea <code>deleting</code>, y solo entonces quita <code>--dry-run</code>.</p>') ?>

  <p>¿Para qué existe, entonces? Porque sin él, lo que borras de tu proyecto se queda para siempre
  en el servidor: la página antigua que ya no enlazas sigue siendo accesible, la imagen renombrada
  ocupa espacio dos veces. <code>--delete</code> resuelve eso. El problema es que no distingue
  entre «basura que quité del proyecto» y «archivos que solo existen en el servidor y son
  valiosos».</p>

  <?= shot('ssh/41-delete-peligro.svg',
      'Origen con index.php y assets. Destino con index.php, assets, viejo.html, uploads/foto.jpg '
      . 'y .htaccess. Con --delete, los tres últimos quedan marcados como BORRADO.',
      '<b>Dónde mirar:</b> <code>uploads/foto.jpg</code> y <code>.htaccess</code>. No son '
      . 'restos de tu proyecto: los generó la web o el hosting. Para <code>--delete</code> son '
      . 'iguales que <code>viejo.html</code>.', 'ilustrativo') ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ rsync -av --delete --dry-run --exclude-from=proyecto/.rsyncignore proyecto/ srv:public_html/
sending incremental file list
deleting viejo.html

sent 227 bytes  received 34 bytes  522.00 bytes/sec
total size is 60  speedup is 0.23 (DRY RUN)
TXT, 'salida real · laboratorio') ?>

  <?= evidence(
      '<p>El ensayo con <code>--delete</code> muestra una sola línea <code>deleting viejo.html</code>
      y termina en <code>(DRY RUN)</code>.</p>',
      '<p>Si se ejecutara sin ensayo, <code>viejo.html</code> desaparecería de
      <code>public_html</code> y nada más, porque el resto coincide con el origen o está
      excluido.</p>',
      '<p>Que sea seguro en otra ocasión. Los archivos excluidos no se borran por defecto, pero
      <code>--delete-excluded</code> sí lo haría; y un destino con subidas de usuarios cambia la
      lista. Cada ejecución real necesita su propio ensayo.</p>') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Cuándo usar --delete</caption>
      <thead><tr><th scope="col">Situación</th><th scope="col">¿--delete?</th><th scope="col">Por qué</th></tr></thead>
      <tbody>
        <tr><td class="f">Web estática generada por completo desde tu proyecto</td><td class="d">Puede tener sentido, tras ensayo</td><td class="d">El destino no debería contener nada que no venga del origen</td></tr>
        <tr><td class="f">Web con subidas de usuarios (uploads/)</td><td class="d">No, salvo excluyendo esa carpeta</td><td class="d">Borrarías contenido que solo existe en el servidor</td></tr>
        <tr><td class="f">Hosting compartido con .htaccess o archivos del panel</td><td class="d">Con mucha precaución</td><td class="d">El proveedor pudo crear archivos que tu proyecto no tiene</td></tr>
        <tr><td class="f">Backup hacia un disco</td><td class="d">Depende de lo que quieras conservar</td><td class="d">Un espejo no guarda lo que borraste por error ayer</td></tr>
      </tbody>
    </table>
  </div>

  <?= pitfall('<p>Añadir <code>--delete</code> «por si acaso» a todos los <code>rsync</code>
      porque deja el servidor más limpio. Limpio y vacío se parecen demasiado: una orden con el
      destino mal escrito, repetida desde el historial, borra lo que no era tuyo.</p>') ?>
</section>

<!-- ================================ HOSTING =========================== -->
<section id="hosting">
  <h2>SSH en un hosting compartido</h2>
  <p class="tut-sub">Tu cuenta, no el servidor: tienes un home, una carpeta pública y ningún sudo.</p>

  <p>En un hosting compartido (los planes con cPanel de proveedores como HostGator y similares)
  no administras la máquina: administras <strong>tu cuenta</strong> dentro de una máquina que
  comparten muchos clientes. Si el plan incluye acceso SSH, todo lo de este capítulo funciona
  igual; cambia qué puedes tocar.</p>

  <?= shot('ssh/42-hosting.svg',
      'Tu equipo conectado por SSH a una cuenta de hosting compartido. Dentro, /home/USUARIO '
      . 'con public_html, que es lo que se sirve en la web, backups y logs no públicos, y '
      . '.ssh/authorized_keys con tus llaves.',
      '<b>Dónde mirar:</b> <code>public_html/</code>. Todo lo que dejes ahí dentro es accesible '
      . 'desde el navegador; todo lo que dejes fuera, no.', 'ilustrativo') ?>

  <h3>Los datos que te da el panel</h3>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Datos de conexión de un hosting compartido</caption>
      <thead><tr><th scope="col">Dato</th><th scope="col">Dónde suele estar</th><th scope="col">En este curso lo escribimos</th></tr></thead>
      <tbody>
        <tr><td class="f">Host</td><td class="d">Panel del proveedor, sección de acceso SSH o datos del servidor</td><td class="d"><code>servidor.ejemplo.com</code></td></tr>
        <tr><td class="f">Usuario</td><td class="d">El usuario de la cuenta del panel</td><td class="d"><code>USUARIO</code></td></tr>
        <tr><td class="f">Puerto</td><td class="d">Lo indica el proveedor: no siempre es 22</td><td class="d"><code>PUERTO</code></td></tr>
        <tr><td class="f">Huella del servidor</td><td class="d">Documentación o soporte del proveedor</td><td class="d">Compárala en la primera conexión</td></tr>
        <tr><td class="f">Llaves</td><td class="d">Algunos paneles permiten importar tu llave pública o gestionarla</td><td class="d">Solo la <code>.pub</code>, nunca la privada</td></tr>
      </tbody>
    </table>
  </div>

  <?= ssh_tree(<<<'TXT'
Host mihosting
    HostName servidor.ejemplo.com
    User USUARIO
    Port PUERTO
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
TXT, '~/.ssh/config · ejemplo con marcadores') ?>

  <?= ssh_term(<<<'TXT'
$ ssh mihosting 'pwd; ls'
$ rsync -av --dry-run --exclude-from=.rsyncignore ./ mihosting:public_html/
TXT, 'bash') ?>

  <h3>Lo que cambia respecto a un servidor propio</h3>
  <ul>
    <li><strong>No hay <code>sudo</code></strong> ni acceso a <code>/etc/ssh/sshd_config</code>:
    la configuración del servidor la decide el proveedor.</li>
    <li><strong>Rutas</strong>: tu home es algo como <code>/home/USUARIO</code> y la web vive en
    <code>/home/USUARIO/public_html</code>. Las rutas remotas relativas parten del home, así que
    <code>mihosting:public_html/</code> basta.</li>
    <li><strong>Límites</strong>: procesos largos, cron o conexiones simultáneas pueden estar
    limitados por el plan.</li>
    <li><strong>Herramientas</strong>: comprueba que exista <code>rsync</code> en el servidor
    antes de construir tu despliegue sobre él.</li>
  </ul>

  <?= evidence(
      '<p>Tras un <code>rsync</code> sin exclusiones, <code>ls -la public_html</code> en la cuenta
      de hosting muestra <code>.env</code> y <code>.git</code>.</p>',
      '<p>Esos archivos están dentro de la carpeta que el servidor web publica y podrían ser
      descargables desde el navegador.</p>',
      '<p>Que alguien los haya descargado ya, ni que sean accesibles de verdad: algunos hostings
      bloquean archivos ocultos con reglas propias. La única forma de saberlo es comprobar la
      configuración o probar la URL en tu propio sitio; lo prudente es retirarlos y rotar las
      credenciales que contuvieran.</p>') ?>

  <?= pitfall('<p>Subir el proyecto a <code>/home/USUARIO/</code> creyendo que es la web, o al
      revés, dejar copias de seguridad dentro de <code>public_html</code> «para tenerlas a mano».
      Lo que está en <code>public_html</code> se sirve; los backups, logs y configuraciones van
      fuera.</p>') ?>
</section>

<!-- =============================== PRÁCTICA =========================== -->
<section id="practica-archivos">
  <h2>Práctica: mover archivos</h2>
  <p class="tut-sub">Tres ejercicios sobre tu laboratorio, tu VM o tu cuenta de hosting. Nunca sobre una máquina ajena.</p>

  <?= ssh_ejercicio([
      'num' => '12',
      'titulo' => 'SCP en las dos direcciones',
      'nivel' => 'basico',
      'objetivo' => 'Objetivo: subir y bajar un archivo sabiendo en todo momento en qué máquina aparece.',
      'mision' => 'Subir un informe al servidor, bajar un log del servidor y comprobar cada copia en su lado.',
      'escenario' => '<p>Laptop <code>192.168.56.10</code>, servidor <code>192.168.56.20</code> con el usuario <code>alumno</code> y alias <code>srv</code> en <code>~/.ssh/config</code>. El servidor tiene <code>~/logs/app.log</code>.</p>',
      'preparacion' => '<p>Acceso con llave a tu servidor de laboratorio. En tu equipo, crea <code>informe.txt</code> con cualquier texto.</p>',
      'pasos' => [
          '<p>Sube el archivo al home remoto:</p>' . ssh_term(<<<'TXT'
$ scp informe.txt srv:/home/alumno/
$ ssh srv 'ls -l informe.txt'
TXT, 'bash'),
          '<p>Baja el log a tu directorio actual y compruébalo:</p>' . ssh_term(<<<'TXT'
$ scp srv:/home/alumno/logs/app.log .
$ ls -l app.log
TXT, 'bash'),
      ],
      'observar' => '<p>Una línea de progreso por archivo con <code>100%</code>, y que cada <code>ls</code> se ejecuta en el lado donde debe estar la copia: el primero dentro de <code>ssh srv</code>, el segundo en tu equipo.</p>',
      'visual' => shot('ssh/35-scp-direcciones.svg',
          'Diagrama de las dos direcciones de scp, subir y bajar.',
          '<b>Dónde mirar:</b> en qué argumento aparece <code>srv:</code>.', 'ilustrativo'),
      'preguntas' => [
          '¿Qué cambia entre los dos comandos para que la dirección se invierta?',
          'Si escribes <code>scp informe.txt srv</code> sin los dos puntos, ¿dónde aparece la copia?',
          'Tu servidor escucha en el 2222. ¿Qué opción añades y por qué no vale <code>-p</code>?',
      ],
      'pistas' => [
          '<p>En <code>scp</code> el orden es siempre origen → destino. Lo que decide qué lado es remoto es otra cosa.</p>',
          '<p>Mira qué argumento lleva <code>host:</code>. Un argumento sin «:» es una ruta local.</p>',
          '<p>Consulta <code>man scp</code> y busca <code>-P port</code> y <code>-p</code>.</p>',
      ],
      'solucion' => 'La dirección la marca qué argumento lleva «srv:»; sin «:» la copia es local; el puerto va con -P mayúscula.',
      'porque' => '<p>En <code>scp informe.txt srv:/home/alumno/</code> el destino lleva <code>srv:</code>, así que el archivo viaja al servidor; en <code>scp srv:/home/alumno/logs/app.log .</code> el <code>srv:</code> está en el origen, así que viaja hacia ti y aterriza en <code>.</code>, tu directorio actual. Sin los dos puntos no hay host remoto: <code>scp informe.txt srv</code> crea en tu equipo un archivo llamado <code>srv</code>. Y el puerto es <code>-P</code> porque, según <code>man scp</code>, <code>-p</code> ya está reservado para conservar fechas y permisos.</p>',
      'error' => '<p>Comprobar la subida con <code>ls</code> en tu propio equipo. Verías tu <code>informe.txt</code> original y creerías que confirma algo; la comprobación de una subida se hace en el servidor.</p>',
      'aprendiste' => 'origen primero, destino después, y los dos puntos señalan el lado remoto.',
  ]) ?>

  <?= ssh_ejercicio([
      'num' => '13',
      'titulo' => 'Una sesión SFTP sin perderse',
      'nivel' => 'basico',
      'objetivo' => 'Objetivo: distinguir en todo momento el directorio remoto del local dentro de sftp.',
      'mision' => 'Subir <code>index.php</code> de tu proyecto a <code>public_html</code> y bajar la hoja de estilos del servidor con otro nombre.',
      'escenario' => '<p>En tu equipo tienes <code>~/proyecto/index.php</code>. En el servidor, <code>~/public_html/</code> contiene <code>index.php</code> y <code>assets/app.css</code>.</p>',
      'preparacion' => '<p>Servidor propio con SFTP disponible (lo está si tienes SSH con OpenSSH). Copia de seguridad de <code>public_html</code> si no es un laboratorio.</p>',
      'pasos' => [
          '<p>Abre la sesión y sitúa las dos mitades:</p>' . ssh_term(<<<'TXT'
$ sftp srv
sftp> pwd
sftp> lpwd
sftp> cd public_html
sftp> lcd proyecto
TXT, 'bash'),
          '<p>Transfiere en los dos sentidos y cierra:</p>' . ssh_term(<<<'TXT'
sftp> put index.php
sftp> get assets/app.css app-del-servidor.css
sftp> lls
sftp> bye
TXT, 'bash'),
      ],
      'observar' => '<p>Los mensajes <code>Uploading … to …</code> y <code>Fetching … to …</code> con rutas completas, y que <code>app-del-servidor.css</code> aparece en <code>lls</code>, no en <code>ls</code>.</p>',
      'visual' => shot('ssh/38-sftp-real.svg',
          'Sesión sftp real del laboratorio con pwd, lpwd, put, get y bye.',
          '<b>Dónde mirar:</b> «Remote working directory» frente a «Local working directory».', 'real'),
      'preguntas' => [
          'Justo después de <code>lcd proyecto</code>, ¿qué devuelve <code>pwd</code>: el directorio del proyecto o <code>/home/alumno/public_html</code>?',
          '¿En qué directorio de tu equipo queda <code>app-del-servidor.css</code>?',
          'Si en vez de <code>lcd proyecto</code> hubieras escrito <code>cd proyecto</code>, ¿qué habría pasado con el <code>put</code>?',
      ],
      'pistas' => [
          '<p>Hay dos directorios actuales a la vez, y cada orden solo mueve uno.</p>',
          '<p>Las órdenes con <code>l</code> delante actúan en tu equipo; las demás, en el servidor.</p>',
          '<p><code>get</code> deja el archivo en el directorio que diga <code>lpwd</code>.</p>',
      ],
      'solucion' => 'pwd sigue siendo /home/alumno/public_html; el CSS queda en ~/proyecto; con cd proyecto el put habría fallado o subido otro archivo.',
      'porque' => '<p><code>lcd</code> solo cambia el directorio local, así que <code>pwd</code> sigue mostrando el remoto que fijó <code>cd public_html</code>. <code>get</code> escribe en el directorio local actual, que tras <code>lcd proyecto</code> es <code>~/proyecto</code> (en la captura real, <code>lls</code> muestra <code>app-del-servidor.css</code> junto a <code>deploy.sh</code> e <code>index.php</code>). <code>cd proyecto</code> habría intentado entrar en una carpeta <code>proyecto</code> <em>del servidor</em>; el directorio local seguiría siendo <code>~</code>, donde no hay <code>index.php</code>, y el <code>put</code> no lo encontraría.</p>',
      'error' => '<p>Leer <code>ls</code> tras un <code>get</code> y concluir que la descarga falló porque el archivo no aparece. <code>ls</code> lista el servidor; lo descargado está en el lado local y se ve con <code>lls</code>.</p>',
      'aprendiste' => 'en sftp cada orden pertenece a un lado, y pwd + lpwd te dicen dónde está cada uno.',
  ]) ?>

  <?= ssh_ejercicio([
      'num' => '14',
      'titulo' => 'rsync con barra, exclusiones y ensayo',
      'nivel' => 'intermedio',
      'objetivo' => 'Objetivo: publicar solo lo que debe publicarse, comprobándolo antes con --dry-run.',
      'mision' => 'Sincronizar tu proyecto con <code>public_html</code> sin subir secretos, sin crear un nivel de carpeta de más y sin borrar nada por sorpresa.',
      'escenario' => '<p><code>~/proyecto</code> contiene <code>index.php</code>, <code>assets/</code>, <code>.env</code>, <code>.git/</code>, <code>logs/</code>, <code>notas.txt</code> y <code>deploy.sh</code>. En el servidor, <code>public_html</code> tiene además un <code>viejo.html</code> que no está en el proyecto.</p>',
      'preparacion' => '<p><code>rsync</code> instalado en los dos lados. Un archivo <code>proyecto/.rsyncignore</code> con los patrones <code>.git/</code>, <code>.env</code>, <code>logs/</code>, <code>notas.txt</code>, <code>.rsyncignore</code> y <code>deploy.sh</code>.</p>',
      'pasos' => [
          '<p>Ensaya sin exclusiones y lee la lista:</p>' . ssh_term(<<<'TXT'
$ rsync -av --dry-run proyecto/ srv:public_html/
TXT, 'bash'),
          '<p>Ensaya con exclusiones, sincroniza y repite:</p>' . ssh_term(<<<'TXT'
$ rsync -av --dry-run --exclude-from=proyecto/.rsyncignore proyecto/ srv:public_html/
$ rsync -av --exclude-from=proyecto/.rsyncignore proyecto/ srv:public_html/
$ rsync -av --exclude-from=proyecto/.rsyncignore proyecto/ srv:public_html/
TXT, 'bash'),
          '<p>Solo ensaya el borrado:</p>' . ssh_term(<<<'TXT'
$ rsync -av --delete --dry-run --exclude-from=proyecto/.rsyncignore proyecto/ srv:public_html/
TXT, 'bash'),
      ],
      'observar' => '<p>Qué archivos desaparecen de la lista al añadir exclusiones, que la tercera ejecución no envía ningún archivo, y la línea <code>deleting</code> del último ensayo junto a <code>(DRY RUN)</code>.</p>',
      'visual' => shot('ssh/40-rsync-incremental.svg',
          'Tres ejecuciones reales de rsync: con exclusiones, repetida sin cambios y con --delete en seco.',
          '<b>Dónde mirar:</b> la lista vacía de la segunda pasada y <code>deleting viejo.html</code>.', 'real'),
      'preguntas' => [
          '¿Qué archivos habría publicado el primer ensayo que no deben estar en una web?',
          '¿Por qué la tercera ejecución no lista ningún archivo? ¿Es un error?',
          'Si quitas la barra de <code>proyecto/</code>, ¿dónde quedaría <code>index.php</code> en el servidor?',
          'Tras el último ensayo, ¿existe todavía <code>viejo.html</code> en el servidor?',
      ],
      'pistas' => [
          '<p><code>rsync</code> compara antes de enviar, y <code>--dry-run</code> enseña esa comparación sin actuar.</p>',
          '<p>Busca en la lista los nombres que empiezan por punto y la última palabra de la salida.</p>',
          '<p>Repasa la regla de la barra en el <strong>origen</strong> y la línea <code>total size … (DRY RUN)</code>.</p>',
      ],
      'solucion' => '.env, .git, logs, notas.txt y deploy.sh; la tercera no envía nada porque ya está igual; sin barra quedaría en public_html/proyecto/index.php; viejo.html sigue existiendo.',
      'porque' => '<p>El primer ensayo, sin exclusiones, lista <code>.env</code> y <code>.git/HEAD</code> entre otros: credenciales e historial dentro de la carpeta pública. Con <code>--exclude-from</code> solo quedan <code>index.php</code> y <code>assets/app.css</code>. La tercera ejecución llega a un destino idéntico al origen, así que la lista queda vacía y solo se intercambian metadatos (en la captura, <code>sent 143 bytes</code>): es el funcionamiento incremental, no un fallo. Sin la barra del origen, <code>rsync</code> copia la carpeta con su nombre y aparece el nivel <code>public_html/proyecto/</code>, como demostró <code>tree</code> en <code>demo-sin-barra</code>. Y el último comando lleva <code>--dry-run</code> y termina en <code>(DRY RUN)</code>: <code>deleting viejo.html</code> es lo que <em>haría</em>, no lo que hizo.</p>',
      'error' => '<p>Ver <code>deleting viejo.html</code>, decidir que está bien y quitar <code>--dry-run</code> sin mirar si en el destino hay carpetas como <code>uploads/</code> que solo existen en el servidor. El ensayo vale para la lista que enseña, no para la próxima vez.</p>',
      'aprendiste' => 'ensayar, leer la lista, excluir lo que no se publica y tratar --delete como una operación de borrado, no como una opción de sincronización.',
  ]) ?>

  <?= ssh_cierre('Mover archivos',
      [
          'scp, sftp y rsync usan la misma conexión SSH, el mismo usuario, la misma llave y el mismo <code>~/.ssh/config</code>.',
          'En <code>scp</code> y <code>rsync</code> el lado con «host:» es el remoto; el orden es siempre origen → destino.',
          'En <code>sftp</code> hay dos directorios actuales; las órdenes con <code>l</code> actúan en tu equipo.',
          '<code>rsync</code> solo envía diferencias, y la barra final del origen decide si copias el contenido o la carpeta.',
          '<code>--dry-run</code> antes de todo lo importante; <code>--delete</code> solo después de leer cada <code>deleting</code>.',
      ],
      [
          'scp archivo srv:ruta/',
          'scp srv:ruta/archivo .',
          'scp -r carpeta srv:ruta/',
          'scp -P 2222 archivo usuario@host:ruta/',
          'sftp srv   (pwd · lpwd · ls · lls · cd · lcd · get · put · bye)',
          'rsync -av origen/ srv:destino/',
          'rsync -av --dry-run --exclude-from=.rsyncignore ./ srv:public_html/',
          'rsync -av --delete --dry-run …',
      ],
      [
          '<code>-P</code> es el puerto en <code>scp</code>; <code>-p</code> conserva fechas y permisos.',
          '<code>scp -r</code> y un <code>rsync</code> sin exclusiones copian también <code>.env</code> y <code>.git</code>.',
          'Una lista vacía en un <code>rsync</code> repetido significa «ya está igual».',
          'En hosting compartido administras tu cuenta: sin sudo, con <code>public_html</code> como carpeta pública.',
      ],
      '<p>Lanzar un <code>rsync --delete</code> sin <code>--dry-run</code> hacia una ruta escrita de
      memoria. Una barra de más o un destino equivocado y el servidor queda como espejo de una
      carpeta que no era la que querías publicar.</p>',
      [
          [
              'q' => '¿Cuál de estos comandos BAJA app.log del servidor a tu directorio actual?',
              'opts' => ['A' => 'scp app.log srv:.', 'B' => 'scp srv:logs/app.log .', 'C' => 'scp srv app.log', 'D' => 'scp -r app.log srv'],
              'ok' => 'B',
              'why' => 'El origen es el que lleva <code>srv:</code>, así que el archivo sale del servidor, y el destino <code>.</code> es tu directorio actual. A sube, C crea una copia local llamada app.log a partir de un archivo local «srv», y D intenta subir.',
          ],
          [
              'q' => 'Dentro de sftp, ¿qué orden te dice en qué directorio de TU equipo dejará get los archivos?',
              'opts' => ['A' => 'pwd', 'B' => 'ls', 'C' => 'lpwd', 'D' => 'cd'],
              'ok' => 'C',
              'why' => '<code>lpwd</code> muestra el «Local working directory», que es donde escribe <code>get</code>. <code>pwd</code> muestra el directorio del servidor.',
          ],
          [
              'q' => 'rsync -av proyecto srv:public_html/ (sin barra en el origen). ¿Dónde queda index.php?',
              'opts' => ['A' => 'public_html/index.php', 'B' => 'public_html/proyecto/index.php', 'C' => 'proyecto/public_html/index.php', 'D' => 'No se copia nada'],
              'ok' => 'B',
              'why' => 'Sin barra, <code>rsync</code> copia la carpeta con su nombre dentro del destino. Es el nivel de más que se vio en <code>demo-sin-barra</code>; con <code>proyecto/</code> el resultado sería A.',
          ],
          [
              'q' => 'Un rsync --delete --dry-run muestra «deleting uploads/foto.jpg». ¿Qué ha pasado con la foto?',
              'opts' => ['A' => 'Se ha borrado', 'B' => 'Se ha movido a una papelera', 'C' => 'Sigue en el servidor: era un ensayo', 'D' => 'Se ha copiado a tu equipo'],
              'ok' => 'C',
              'why' => 'Con <code>--dry-run</code> no se cambia nada; la salida termina en <code>(DRY RUN)</code>. Esa línea es un aviso de lo que haría la ejecución real, y aquí indica que habría que excluir <code>uploads/</code> antes de usar <code>--delete</code>.',
          ],
      ]) ?>
</section>

<?= ssh_parte('06', 'Servidor y seguridad',
    'El lado del servidor: cambiar su configuración sin quedarte fuera y leer la evidencia.',
    'ciber') ?>

<!-- ================================ SSHD ============================= -->
<section id="sshd">
  <h2><code>sshd</code> y systemd</h2>
  <p class="tut-sub">Antes de tocar nada, averigua si el servicio existe, cómo se llama y en qué estado está.</p>

  <p>Hasta ahora has trabajado desde el cliente. Esta parte cruza al otro lado: el programa que
  <strong>acepta</strong> las conexiones. En casi cualquier Linux moderno ese programa lo arranca y
  vigila <strong>systemd</strong>, y la herramienta para preguntarle es <code>systemctl</code>.</p>

  <?= note('Antes de seguir: ¿tienes acceso de administrador?',
      '<p>Todo lo de esta parte requiere <code>sudo</code> en el servidor. En un
      <strong>hosting compartido</strong> normalmente no lo tienes: el proveedor administra
      <code>sshd</code> por ti. Lee la parte igualmente —entender cómo decide el servidor explica
      muchos errores del cliente—, pero practica solo en una máquina tuya o de laboratorio.</p>', 'info') ?>

  <h3>Preguntar el estado</h3>

  <?= ssh_term(<<<'TXT'
$ systemctl status sshd
○ sshd.service - OpenSSH Daemon
     Loaded: loaded (/usr/lib/systemd/system/sshd.service; disabled; preset: disabled)
     Active: inactive (dead)
       Docs: man:sshd(8)
             man:sshd_config(5)

$ systemctl is-active sshd
inactive
TXT, 'salida real · equipo del autor') ?>

  <?= anatomy(
      '<b>Loaded:</b> loaded (…sshd.service; <u>disabled</u>; …)  ·  <b>Active:</b> <i>inactive (dead)</i>',
      [
          ['loaded', 'systemd encontró el fichero del servicio: OpenSSH está instalado.'],
          ['disabled', 'No arranca solo al encender la máquina. <code>enabled</code> significaría que sí.'],
          ['inactive (dead)', 'Ahora mismo no está corriendo. Nadie puede entrar por SSH en este equipo.'],
      ],
      'Cómo leer systemctl status') ?>

  <p>Esa salida es de un portátil, y es exactamente lo esperable: tiene el <strong>cliente</strong>
  para salir, pero el <strong>servidor</strong> está apagado. En un servidor verías
  <code>active (running)</code> y <code>enabled</code>.</p>

  <?= shot('ssh/43-systemctl-estados.svg',
      'Tres tarjetas con los estados de un servicio en systemd: active running, inactive dead y failed, cada una con lo que significa para SSH.',
      '<b>Dónde mirar:</b> la diferencia entre <code>inactive</code> y <code>failed</code>. Uno está '
      . 'parado a propósito; el otro intentó arrancar y no pudo, casi siempre por un '
      . '<code>sshd_config</code> roto.') ?>

  <h3>El nombre cambia según la distribución</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Nombre del servicio SSH por distribución</caption>
      <thead><tr><th scope="col">Distribución</th><th scope="col">Servicio</th><th scope="col">Comprobar</th></tr></thead>
      <tbody>
        <tr><td class="f">Arch, CachyOS, Fedora, RHEL</td><td class="d"><code>sshd</code></td><td class="d"><code>systemctl status sshd</code></td></tr>
        <tr><td class="f">Debian, Ubuntu</td><td class="d"><code>ssh</code></td><td class="d"><code>systemctl status ssh</code></td></tr>
        <tr><td class="f">Alpine (el laboratorio)</td><td class="d">sin systemd</td><td class="d">el proceso se ve con <code>ps</code></td></tr>
      </tbody>
    </table>
  </div>

  <?= ssh_term(<<<'TXT'
# si no sabes cómo se llama, pregunta a systemd en vez de adivinar
$ systemctl list-units --type=service | grep -i ssh
TXT, 'bash') ?>

  <?= pitfall('<p>Escribir <code>systemctl restart sshd</code> en una Ubuntu, leer
      «Unit sshd.service not found» y concluir que SSH no está instalado. Solo se llama distinto.
      Y al revés: que <code>systemctl</code> no encuentre la unidad no demuestra que no haya un
      <code>sshd</code> corriendo lanzado de otra forma, como en los contenedores del
      laboratorio.</p>') ?>
</section>

<!-- ============================= SSHD_CONFIG ========================= -->
<section id="sshd-config">
  <h2><code>/etc/ssh/sshd_config</code></h2>
  <p class="tut-sub">El fichero que decide quién entra, cómo y por dónde. Se lee antes de tocarlo.</p>

  <p>Todo lo que el servidor permite o rechaza sale de aquí: en qué puerto escucha, si acepta
  contraseñas, si root puede entrar, qué usuarios están permitidos. Un error en este fichero no
  afecta solo a ti: afecta a <strong>todos</strong> los que necesitan entrar, empezando por ti
  mismo.</p>

  <h3>Cómo está escrito</h3>

  <p>Cada línea es <code>Palabra valor</code>. Las que empiezan por <code>#</code> son comentarios:
  en el fichero que instala OpenSSH, las opciones comentadas muestran el <strong>valor por
  defecto</strong>, no una opción activa. Esta es la primera orden que se ejecutó en el bastión
  del laboratorio antes de cambiar nada:</p>

  <?= ssh_term(<<<'TXT'
alumno@bastion:~$ grep -nE '^#?(PasswordAuthentication|KbdInteractiveAuthentication|PermitRootLogin)' /etc/ssh/sshd_config
36:#PermitRootLogin prohibit-password
61:#PasswordAuthentication yes
67:#KbdInteractiveAuthentication yes
TXT, 'salida real · laboratorio') ?>

  <?= callouts([
      ['línea 36', '<code>PermitRootLogin</code> comentado: rige el valor por defecto, <code>prohibit-password</code>.'],
      ['línea 61', '<code>PasswordAuthentication</code> comentado: rige <code>yes</code>, se aceptan contraseñas.'],
      ['línea 67', '<code>KbdInteractiveAuthentication</code> comentado: rige <code>yes</code>. Es otra vía para pedir contraseñas, y conviene no olvidarla.'],
  ]) ?>

  <h3>Dos reglas de lectura que evitan sustos</h3>

  <ul>
    <li><strong>El primer valor gana.</strong> El manual lo dice literalmente: para cada palabra
    clave se usa el primer valor obtenido. Si una opción aparece dos veces, la segunda no hace
    nada.</li>
    <li><strong>Puede haber más ficheros.</strong> Muchas distribuciones incluyen al principio una
    línea <code>Include /etc/ssh/sshd_config.d/*.conf</code>. Lo que haya en esos ficheros se lee
    antes que el resto, y por la regla anterior puede ganar a lo que escribas más abajo.</li>
  </ul>

  <?= ssh_tree(<<<'TXT'
# /etc/ssh/sshd_config (fragmento típico)
Include /etc/ssh/sshd_config.d/*.conf   ← se procesa aquí, en orden alfabético

#Port 22
#PermitRootLogin prohibit-password
#PasswordAuthentication yes
TXT, 'estructura habitual') ?>

  <p>Por eso nunca se da por buena una configuración leyendo el fichero a ojo. Se le pregunta al
  propio <code>sshd</code> qué valores va a usar de verdad, con <code>sshd -T</code>, que verás en
  la sección de validación.</p>

  <?= pitfall('<p>Descomentar <code>PasswordAuthentication no</code> al final del fichero y
      comprobar, sorprendido, que el servidor sigue aceptando contraseñas. La causa habitual: un
      fichero en <code>sshd_config.d/</code> —a veces lo pone la imagen del proveedor de nube—
      ya fijaba <code>yes</code> antes. No lo arregles repitiendo la línea: busca de dónde sale el
      valor.</p>') ?>
</section>

<!-- ========================= CONFIG VS CONFIG ======================== -->
<section id="config-vs-config">
  <h2><code>ssh_config</code> frente a <code>sshd_config</code></h2>
  <p class="tut-sub">Una letra de diferencia, dos máquinas distintas, dos preguntas distintas.</p>

  <?= shot('ssh/44-config-vs-sshdconfig.svg',
      'Dos columnas: ~/.ssh/config es del cliente y decide cómo me conecto; /etc/ssh/sshd_config es del servidor y decide cómo acepta conexiones.',
      '<b>Dónde mirar:</b> la última fila de cada columna. Un error en el tuyo te afecta a ti; un '
      . 'error en el del servidor afecta a todos.') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Diferencias entre la configuración del cliente y la del servidor</caption>
      <thead><tr><th scope="col">Archivo</th><th scope="col">Lado</th><th scope="col">Función</th><th scope="col">Si te equivocas</th></tr></thead>
      <tbody>
        <tr><td class="f">~/.ssh/config</td><td class="d">Cliente</td><td class="d">Cómo me conecto yo</td><td class="d">Fallan tus conexiones</td></tr>
        <tr><td class="f">/etc/ssh/ssh_config</td><td class="d">Cliente (todo el sistema)</td><td class="d">Valores por defecto para todos los usuarios que salen</td><td class="d">Fallan las conexiones salientes</td></tr>
        <tr><td class="f">/etc/ssh/sshd_config</td><td class="d">Servidor</td><td class="d">Cómo acepta conexiones</td><td class="d">Nadie puede entrar, tú incluido</td></tr>
      </tbody>
    </table>
  </div>

  <?= evidence(
      '<p>Añades <code>PasswordAuthentication no</code> a tu <code>~/.ssh/config</code> y el
      servidor sigue aceptando contraseñas de otras personas.</p>',
      '<p>Es lo esperado. En el cliente esa opción solo dice que <em>tú</em> no ofrecerás
      contraseña; el servidor sigue aceptándolas de quien sí las ofrezca.</p>',
      '<p>Que el servidor esté endurecido. Solo lo decide <code>sshd_config</code>, y la única
      comprobación fiable es <code>sshd -T</code> en el servidor más un intento real sin llave.</p>') ?>
</section>

<!-- ============================== VALIDAR ============================ -->
<section id="validar">
  <h2>Validar con <code>sshd -t</code> antes de aplicar</h2>
  <p class="tut-sub">Una errata en este fichero puede impedir que el servicio vuelva a arrancar. Se detecta en un segundo.</p>

  <p><code>sshd</code> tiene dos opciones de diagnóstico que no arrancan ningún servidor ni
  cortan ninguna sesión:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Opciones de prueba de sshd</caption>
      <thead><tr><th scope="col">Orden</th><th scope="col">Qué hace</th><th scope="col">Si todo va bien</th></tr></thead>
      <tbody>
        <tr><td class="f">sudo sshd -t</td><td class="d">Comprueba la sintaxis del fichero y que las claves de host se pueden usar</td><td class="d">No imprime nada y devuelve 0</td></tr>
        <tr><td class="f">sudo sshd -T</td><td class="d">Hace lo mismo y además imprime la configuración efectiva, ya resuelta</td><td class="d">Una lista <code>opción valor</code> en minúsculas</td></tr>
      </tbody>
    </table>
  </div>

  <h3>El error, provocado a propósito</h3>

  <p>En el bastión del laboratorio se hizo primero una copia de seguridad del fichero y después se
  cambió la línea 61 con una errata deliberada: <code>PasswordAuthentcation</code>, sin la
  <em>i</em>.</p>

  <?= ssh_term(<<<'TXT'
alumno@bastion:~$ sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
[… 8 líneas omitidas …]
[sudo] password for alumno:
alumno@bastion:~$ sudo sed -i 's/^#PasswordAuthentication yes/PasswordAuthentcation no/' /etc/ssh/sshd_config
alumno@bastion:~$ sudo sshd -t
/etc/ssh/sshd_config: line 61: Bad configuration option: PasswordAuthentcation
/etc/ssh/sshd_config: terminating, 1 bad configuration options
alumno@bastion:~$ echo $?
255
alumno@bastion:~$ sudo sed -i 's/^PasswordAuthentcation no/PasswordAuthentication no/' /etc/ssh/sshd_config
alumno@bastion:~$ sudo sed -i 's/^#KbdInteractiveAuthentication yes/KbdInteractiveAuthentication no/' /etc/ssh/sshd_config
alumno@bastion:~$ sudo sshd -t
alumno@bastion:~$ echo $?
0
alumno@bastion:~$ sudo sshd -T | grep -E '^(passwordauthentication|kbdinteractiveauthentication|permitrootlogin|pubkeyauthentication) '
permitrootlogin without-password
pubkeyauthentication yes
passwordauthentication no
kbdinteractiveauthentication no
TXT, 'salida real · laboratorio') ?>

  <?= shot('ssh/45-sshd-t.svg',
      'Salida real en el bastión: sshd -t detecta la opción mal escrita en la línea 61 y termina con código 255; tras corregirla no imprime nada y devuelve 0; sshd -T confirma passwordauthentication no.',
      '<b>Dónde mirar:</b> el silencio del segundo <code>sshd -t</code>. En esta herramienta, '
      . '<em>no decir nada</em> es la buena noticia.',
      'real') ?>

  <?= callouts([
      ['Bad configuration option · line 61', 'Te dice el fichero, la línea y la palabra que no reconoce. No hace falta adivinar.'],
      ['Código 255', 'El programa terminó con error. Un script puede comprobarlo antes de recargar nada.'],
      ['Sin salida y código 0', 'Tras corregir, la sintaxis es válida. Solo ahora tiene sentido aplicar el cambio.'],
      ['passwordauthentication no', '<code>sshd -T</code> confirma el valor que <em>usará</em> el servidor, con los Include ya resueltos.'],
  ]) ?>

  <p>Fíjate también en <code>permitrootlogin without-password</code>: es el nombre antiguo con el
  que esta versión imprime el valor por defecto <code>prohibit-password</code>. El manual lo
  documenta como alias obsoleto; significan lo mismo.</p>

  <?= evidence(
      '<p><code>sudo sshd -t</code> no imprime nada y <code>echo $?</code> devuelve 0.</p>',
      '<p>La sintaxis es correcta y las claves de host se pueden cargar.</p>',
      '<p>Que la configuración haga lo que quieres. <code>sshd -t</code> no sabe si dejaste fuera a
      tu usuario con <code>AllowUsers</code> o si la llave que vas a necesitar está instalada.
      Eso solo lo demuestra una conexión nueva, que es el siguiente paso.</p>') ?>

  <?= pitfall('<p>Editar <code>sshd_config</code> y recargar directamente «porque el cambio era
      pequeño». Una sola letra de más en una opción basta para que <code>sshd</code> se niegue a
      procesar el fichero. <code>sshd -t</code> tarda menos que leer esta frase.</p>') ?>
</section>

<!-- ========================== REINICIO SEGURO ======================== -->
<section id="reinicio-seguro">
  <h2>Aplicar cambios sin quedarte fuera</h2>
  <p class="tut-sub">El procedimiento de las dos terminales: la costumbre que separa un susto de un incidente.</p>

  <p>En un servidor remoto no hay teclado ni pantalla: SSH <em>es</em> tu forma de llegar. Si un
  cambio lo rompe y cierras tu única sesión, el siguiente paso es la consola de emergencia del
  proveedor —si existe— o alguien con acceso físico.</p>

  <?= shot('ssh/46-reinicio-seguro.svg',
      'Cinco pasos: dejar abierta la sesión actual, editar y validar con sshd -t, recargar el servicio, abrir una segunda terminal y comprobar que entra antes de cerrar la primera.',
      '<b>Dónde mirar:</b> la terminal 1 no se cierra en ningún momento. Es tu red de seguridad '
      . 'mientras la terminal 2 comprueba el cambio.') ?>

  <?= steps([
      '<strong>Mantén abierta la sesión actual.</strong> Todo lo que sigue se hace desde ella.',
      '<strong>Copia de seguridad del fichero:</strong> <code>sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak</code>.',
      '<strong>Edita y valida</strong> con <code>sudo sshd -t</code> hasta que no imprima nada.',
      '<strong>Aplica</strong> recargando el servicio. Recargar no corta las sesiones ya abiertas.',
      '<strong>Abre una SEGUNDA terminal</strong> y conéctate desde cero. Prueba también lo que debería fallar.',
      '<strong>Solo si la segunda entra</strong>, cierra la primera. Si no, restaura desde la primera y vuelve a validar.',
  ]) ?>

  <h3>Cómo se recarga</h3>

  <?= ssh_term(<<<'TXT'
# en un servidor con systemd (Arch, Fedora, RHEL)
$ sudo systemctl reload sshd
# en Debian o Ubuntu el servicio se llama ssh
$ sudo systemctl reload ssh
TXT, 'bash') ?>

  <p>Los contenedores del laboratorio no tienen systemd, así que la recarga se hizo con la señal
  que el propio manual de <code>sshd</code> documenta: al recibir <code>SIGHUP</code>, relee su
  fichero de configuración. Es lo que hace <code>reload</code> por debajo.</p>

  <h3>Las dos terminales, de verdad</h3>

  <?= ssh_term(<<<'TXT'
alumno@bastion:~$ sudo kill -HUP $(cat /var/run/sshd.pid)
alumno@bastion:~$ echo "sesión 1 sigue abierta mientras pruebo en otra terminal"; sleep 40
sesión 1 sigue abierta mientras pruebo en otra terminal
alumno@bastion:~$ hostname
bastion
alumno@bastion:~$ exit
logout
Connection to 192.168.56.30 closed.
TXT, 'salida real · terminal 1') ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh bastion hostname
bastion
alumno@laptop:~$ ssh -o PubkeyAuthentication=no alumno@bastion
alumno@192.168.56.30: Permission denied (publickey).
TXT, 'salida real · terminal 2') ?>

  <?= callouts([
      ['Terminal 1 sigue viva', 'Después de la recarga, <code>hostname</code> responde en la sesión que ya estaba abierta. La recarga no la tocó.'],
      ['Terminal 2: con llave entra', 'El cambio no dejó fuera al acceso legítimo. Esta es la comprobación que importa.'],
      ['Terminal 2: sin llave, rechazado', 'Forzando al cliente a no usar llave, el servidor ya solo ofrece <code>publickey</code>. El endurecimiento funciona.'],
  ]) ?>

  <?= evidence(
      '<p>La segunda terminal entra con llave y, sin llave, recibe
      <code>Permission denied (publickey)</code>. La primera sigue abierta.</p>',
      '<p>El cambio está aplicado y el acceso por llave funciona para ese usuario desde ese
      equipo.</p>',
      '<p>Que funcione para todos. Otro administrador que dependiera de contraseña acaba de
      quedarse fuera. Antes de cerrar la sesión de rescate, confirma que cada persona que necesita
      entrar tiene su llave instalada.</p>') ?>
</section>

<!-- ============================= SEGURIDAD =========================== -->
<section id="seguridad">
  <h2>Seguridad SSH por capas</h2>
  <p class="tut-sub">No hay un fichero mágico. Hay decisiones, cada una con su contexto y su forma de recuperarse.</p>

  <p>Endurecer SSH no es copiar una configuración de internet. Es contestar tres preguntas y
  decidir en consecuencia: <strong>quién</strong> tiene que entrar, <strong>desde dónde</strong> y
  <strong>cómo se recupera el acceso</strong> si algo sale mal.</p>

  <?= shot('ssh/47-capas-seguridad.svg',
      'Ocho capas apiladas: llaves con passphrase, contraseñas desactivadas, root sin acceso directo, solo usuarios autorizados, firewall, actualizaciones, logs revisados con Fail2Ban como complemento y MFA si la infraestructura lo soporta.',
      '<b>Dónde mirar:</b> ninguna capa sustituye a otra. Un firewall no arregla una contraseña '
      . 'débil, y una llave no arregla un OpenSSH sin actualizar.') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Capas de seguridad SSH y dónde se configuran</caption>
      <thead><tr><th scope="col">Capa</th><th scope="col">Dónde</th><th scope="col">Qué comprobar antes</th></tr></thead>
      <tbody>
        <tr><td class="f">Llaves con passphrase</td><td class="d">Cliente</td><td class="d">Que cada persona tenga la suya, no una compartida</td></tr>
        <tr><td class="f">PasswordAuthentication no</td><td class="d">sshd_config</td><td class="d">Llaves probadas y acceso de recuperación</td></tr>
        <tr><td class="f">PermitRootLogin no</td><td class="d">sshd_config</td><td class="d">Un usuario normal con <code>sudo</code> que funcione</td></tr>
        <tr><td class="f">AllowUsers / AllowGroups</td><td class="d">sshd_config</td><td class="d">Que tu propio usuario esté en la lista</td></tr>
        <tr><td class="f">MaxAuthTries</td><td class="d">sshd_config</td><td class="d">Por defecto 6; bajarlo afecta a quien tiene muchas llaves en el agente</td></tr>
        <tr><td class="f">LogLevel VERBOSE</td><td class="d">sshd_config</td><td class="d">Registra la huella de la llave usada en cada acceso</td></tr>
        <tr><td class="f">Firewall</td><td class="d">Servidor o red</td><td class="d">No cerrar el puerto por el que estás conectado</td></tr>
        <tr><td class="f">Actualizaciones</td><td class="d">Sistema</td><td class="d">Ventana de mantenimiento y sesión de rescate abierta</td></tr>
        <tr><td class="f">MFA</td><td class="d">sshd_config + infraestructura</td><td class="d">Que el entorno lo soporte (<code>AuthenticationMethods</code>, llaves FIDO <code>-sk</code>)</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Un hallazgo real del propio laboratorio</h3>

  <p>Al montar el laboratorio, los cuatro contenedores salieron de la misma imagen. Al conectar
  por primera vez al bastión, OpenSSH dijo algo inesperado:</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh alumno@192.168.56.30 hostname
The authenticity of host '192.168.56.30 (192.168.56.30)' can't be established.
ED25519 key fingerprint is SHA256:f/kLSUc2Jy9xR2JFOx4z932HIl6YXzi56MXyvqZuEYY.
This host key is known by the following other names/addresses:
    ~/.ssh/known_hosts:1: servidor
TXT, 'salida real · laboratorio') ?>

  <?= evidence(
      '<p>Una máquina nueva (192.168.56.30) presenta exactamente la misma huella que otra ya
      conocida (<code>servidor</code>). En el servidor, la clave llevaba el comentario
      <code>root@buildkitsandbox</code>.</p>',
      '<p>Las claves de host se generaron una sola vez, al construir la imagen, y todas las copias
      las heredaron. Tener la privada de una equivale a poder hacerse pasar por cualquiera de
      ellas.</p>',
      '<p>Que alguien las haya usado mal. Es un defecto de cómo se construyó la imagen, no
      evidencia de un ataque. Se corrigió borrando las claves de host de cada máquina y
      regenerándolas con <code>ssh-keygen -A</code>; desde entonces cada una tiene su propia
      huella.</p>') ?>

  <?= pitfall('<p>Clonar una máquina virtual o crear imágenes con las claves de host dentro y
      desplegarlas en diez servidores. SSH lo acepta sin error, pero ya no puedes distinguir un
      servidor de otro por su huella. Las plantillas deben regenerar las claves de host en el
      primer arranque.</p>') ?>
</section>

<!-- ========================== PASSWORD AUTH ========================== -->
<section id="password-auth">
  <h2><code>PasswordAuthentication</code></h2>
  <p class="tut-sub">Desactivar contraseñas es una buena práctica. Hacerlo antes de tener llaves probadas es la forma más rápida de perder un servidor.</p>

  <p>Con <code>PasswordAuthentication yes</code> —el valor por defecto—, cualquiera que llegue al
  puerto puede intentar contraseñas. Desactivarlo deja la puerta abierta solo a quien tenga una
  llave autorizada. Pero el orden importa más que la opción.</p>

  <?= before_after(
      '<p><code>#PasswordAuthentication yes</code> y <code>#KbdInteractiveAuthentication yes</code>
      comentadas: el servidor pide contraseña a quien no presente llave.</p>',
      '<p>Tras comprobar que <strong>tu llave entra</strong> y con una sesión de rescate abierta:
      <code>PasswordAuthentication no</code> y <code>KbdInteractiveAuthentication no</code>,
      <code>sshd -t</code>, recarga.</p>',
      '<p>Sin llave: <code>Permission denied (publickey)</code>. El servidor ya no ofrece otro
      método.</p>') ?>

  <h3>La lista de comprobación, en este orden</h3>

  <?= steps([
      'Has entrado <strong>con llave</strong> a ese servidor, con ese usuario, en los últimos minutos. <code>ssh -v</code> dice <code>Authenticated … using "publickey"</code>.',
      'Todas las personas y los scripts que entran tienen su llave instalada.',
      'Existe un acceso de recuperación que no depende de SSH: la consola web del proveedor, una VM con consola, alguien con acceso físico.',
      'Tienes una sesión abierta que no vas a cerrar hasta el final.',
      'Cambias <strong>las dos</strong> opciones: <code>PasswordAuthentication</code> y <code>KbdInteractiveAuthentication</code>. La segunda también puede pedir contraseñas.',
      'Validas, recargas y pruebas desde una segunda terminal, con y sin llave.',
  ]) ?>

  <?= note('Por qué dos opciones y no una',
      '<p>La autenticación <em>keyboard-interactive</em> es un mecanismo genérico de preguntas y
      respuestas. Según cómo esté integrado el servidor con el sistema (por ejemplo, con PAM), puede
      terminar pidiendo la misma contraseña. Si solo apagas <code>PasswordAuthentication</code>,
      el cliente puede seguir viendo un «Password:» por la otra vía. <code>sshd -T</code> muestra
      el valor de ambas.</p>', 'info') ?>

  <?= evidence(
      '<p>La lista de métodos del mensaje de error pasó de
      <code>(publickey,password,keyboard-interactive)</code> a <code>(publickey)</code>.</p>',
      '<p>El servidor ya no acepta contraseñas por ninguna de las dos vías.</p>',
      '<p>Que el servidor sea seguro. Solo has quitado un método. Quien tenga una llave autorizada
      —incluida una llave robada sin passphrase— sigue entrando.</p>') ?>
</section>

<!-- ============================ ROOT LOGIN =========================== -->
<section id="root-login">
  <h2><code>PermitRootLogin</code></h2>
  <p class="tut-sub">Entrar como usuario con nombre propio y elevar con sudo deja rastro de quién hizo qué.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Valores de PermitRootLogin</caption>
      <thead><tr><th scope="col">Valor</th><th scope="col">Qué permite a root</th><th scope="col">Comentario</th></tr></thead>
      <tbody>
        <tr><td class="f">yes</td><td class="d">Cualquier método, contraseña incluida</td><td class="d">La opción más expuesta</td></tr>
        <tr><td class="f">prohibit-password</td><td class="d">Solo llave; ni contraseña ni keyboard-interactive</td><td class="d">Valor por defecto. <code>without-password</code> es su alias obsoleto</td></tr>
        <tr><td class="f">forced-commands-only</td><td class="d">Solo llave y solo si esa llave tiene un comando forzado</td><td class="d">Para tareas automáticas muy concretas</td></tr>
        <tr><td class="f">no</td><td class="d">Nada</td><td class="d">Se entra como usuario normal y se usa <code>sudo</code></td></tr>
      </tbody>
    </table>
  </div>

  <p>El argumento a favor de <code>no</code> no es solo que <code>root</code> sea un nombre que
  todo el mundo conoce. Es la <strong>trazabilidad</strong>: si cinco personas entran como root,
  el log dice «root» cinco veces. Si entran como <code>ana</code>, <code>luis</code>… y usan
  <code>sudo</code>, el registro dice quién fue.</p>

  <?= before_after(
      '<p>Se entra directamente como <code>root</code> con una llave compartida por todo el
      equipo.</p>',
      '<p>Cada persona con su usuario y su llave, en el grupo con permiso de <code>sudo</code>. Tras
      comprobar que al menos uno eleva privilegios sin problema: <code>PermitRootLogin no</code>.</p>',
      '<p>Los logs identifican a personas, y revocar a alguien es borrar su llave, no cambiar la de
      todos.</p>') ?>

  <?= pitfall('<p>Poner <code>PermitRootLogin no</code> en un servidor donde <em>root era la única
      cuenta con acceso</em>. La validación de sintaxis pasa, la recarga funciona y la siguiente
      conexión ya no entra. Primero el usuario con sudo probado; después la opción.</p>') ?>
</section>

<!-- ================================ LOGS ============================= -->
<section id="logs">
  <h2>Logs de SSH</h2>
  <p class="tut-sub">Cuando algo falla o preocupa, la respuesta está escrita. Primero hay que saber dónde.</p>

  <p><code>sshd</code> anota cada conexión: quién, desde dónde, con qué método y cómo terminó. Pero
  <strong>dónde</strong> lo anota depende del sistema. No asumas una ruta: compruébala.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Dónde están los logs de SSH según el sistema</caption>
      <thead><tr><th scope="col">Sistema</th><th scope="col">Dónde mirar</th></tr></thead>
      <tbody>
        <tr><td class="f">Con systemd (casi todos)</td><td class="d"><code>journalctl -u sshd</code> o <code>journalctl -u ssh</code></td></tr>
        <tr><td class="f">Debian / Ubuntu con rsyslog</td><td class="d">además, <code>/var/log/auth.log</code></td></tr>
        <tr><td class="f">RHEL / Fedora con rsyslog</td><td class="d">además, <code>/var/log/secure</code></td></tr>
        <tr><td class="f">El laboratorio</td><td class="d"><code>/var/log/sshd.log</code>, porque sshd se lanzó con <code>-E</code></td></tr>
      </tbody>
    </table>
  </div>

  <p>Así se ve buscar en un equipo donde el servicio nunca estuvo activo y la distribución no usa
  esos ficheros de texto:</p>

  <?= ssh_term(<<<'TXT'
$ journalctl -u sshd --no-pager -n 5
-- No entries --

$ ls /var/log/auth.log /var/log/secure
ls: no se puede acceder a '/var/log/auth.log': No existe el fichero o el directorio
ls: no se puede acceder a '/var/log/secure': No existe el fichero o el directorio
TXT, 'salida real · equipo del autor') ?>

  <?= evidence(
      '<p><code>-- No entries --</code> y ningún fichero de autenticación.</p>',
      '<p>En ese equipo no hay registros de <code>sshd</code>: el servicio está inactivo y la
      distribución no escribe <code>auth.log</code>.</p>',
      '<p>Que «nadie lo haya intentado» en un servidor en marcha con esa misma salida. Si el
      servicio corriera y no hubiera registros, la pregunta sería otra: ¿está enviando los logs a
      otro sitio?</p>') ?>

  <h3>Leer un log real</h3>

  <?= ssh_term(<<<'TXT'
# en un servidor con systemd, las últimas líneas del servicio
$ sudo journalctl -u sshd -n 20 --no-pager
# y seguir en directo mientras pruebas desde otra terminal
$ sudo journalctl -u sshd -f
TXT, 'bash') ?>

  <?= ssh_term(<<<'TXT'
root@bastion:~# tail -n 12 /var/log/sshd.log
Accepted publickey for alumno from 192.168.56.10 port 43242 ssh2: ED25519 SHA256:naRfLqw1lzl4RNzMfQ/a0lJ2FAIuCHwbE6H7hQnqjHI
User child is on pid 109
Starting session: command for alumno from 192.168.56.10 port 43242 id 0
Close session: user alumno from 192.168.56.10 port 43242 id 0
Received disconnect from 192.168.56.10 port 43242:11: disconnected by user
Disconnected from user alumno 192.168.56.10 port 43242
Connection from 192.168.56.10 port 43254 on 192.168.56.30 port 22 rdomain ""
Connection closed by authenticating user alumno 192.168.56.10 port 43254 [preauth]
srclimit_penalise: ipv4: new 192.168.56.10/32 deferred penalty of 1 seconds for penalty: connections without attempting authentication
Close session: user alumno from 192.168.56.10 port 37654 id 0
Received disconnect from 192.168.56.10 port 37654:11: disconnected by user
Disconnected from user alumno 192.168.56.10 port 37654
TXT, 'salida real · laboratorio') ?>

  <?= shot('ssh/48-logs-sshd.svg',
      'Log real del bastión: una autenticación aceptada con llave y su huella, el inicio de la sesión, la desconexión, una conexión cerrada antes de autenticarse y una penalización temporal al origen.',
      '<b>Dónde mirar:</b> la huella al final de <code>Accepted publickey</code>. Con '
      . '<code>LogLevel VERBOSE</code> no solo sabes que entró alumno: sabes con <em>qué llave</em>.',
      'real') ?>

  <?= callouts([
      ['Accepted publickey … SHA256:naRf…', 'Quién (alumno), desde dónde (192.168.56.10, puerto de origen 43242), con qué método (publickey) y con qué llave (su huella). La huella coincide con la de <code>ssh-add -l</code> en el laptop.'],
      ['Starting session: command', 'Se ejecutó un comando remoto, no un shell interactivo. Coincide con <code>ssh bastion hostname</code>.'],
      ['Disconnected from user', 'La sesión terminó de forma normal, pedida por el cliente.'],
      ['Connection closed … [preauth]', 'Una conexión se cerró <em>antes</em> de completar la autenticación. <code>[preauth]</code> es la pista: nunca llegó a entrar.'],
      ['srclimit_penalise', 'El propio sshd anota una penalización breve a ese origen por conexiones que no intentan autenticarse. Lo controla <code>PerSourcePenalties</code> en <code>sshd_config</code>.'],
  ]) ?>

  <?= note('Una limitación de este log',
      '<p>Las líneas del laboratorio no llevan fecha ni hora: <code>sshd -E</code> escribe el mensaje
      tal cual. En <code>journalctl</code> o en <code>auth.log</code> cada línea viene con marca de
      tiempo, y sin ella no se puede reconstruir una secuencia ni correlacionar con otros
      registros.</p>', 'warn') ?>
</section>

<!-- ============================== INTENTOS =========================== -->
<section id="intentos">
  <h2>Intentos fallidos</h2>
  <p class="tut-sub">Separar lo que dice el log de lo que te imaginas que significa.</p>

  <p>Para este apartado se provocaron fallos a propósito contra el servidor del laboratorio: un
  usuario que no existe (<code>admin</code>) con tres contraseñas incorrectas, y dos intentos con
  una llave que el servidor no reconocía.</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh -o PubkeyAuthentication=no admin@servidor
admin@servidor's password:
Permission denied, please try again.
admin@servidor's password:
Permission denied, please try again.
admin@servidor's password:
admin@servidor: Permission denied (publickey,password,keyboard-interactive).
TXT, 'salida real · lo que ve el cliente') ?>

  <?= ssh_term(<<<'TXT'
root@servidor:~# grep -E "admin|Invalid|Failed|Connection closed by invalid" /var/log/sshd.log
Failed publickey for alumno from 192.168.56.10 port 53702 ssh2: ED25519 SHA256:naRfLqw1lzl4RNzMfQ/a0lJ2FAIuCHwbE6H7hQnqjHI
Failed publickey for alumno from 192.168.56.10 port 53718 ssh2: ED25519 SHA256:naRfLqw1lzl4RNzMfQ/a0lJ2FAIuCHwbE6H7hQnqjHI
Invalid user admin from 192.168.56.10 port 50058
Failed password for invalid user admin from 192.168.56.10 port 50058 ssh2
Failed password for invalid user admin from 192.168.56.10 port 50058 ssh2
Failed password for invalid user admin from 192.168.56.10 port 50058 ssh2
Connection closed by invalid user admin 192.168.56.10 port 50058 [preauth]
TXT, 'salida real · lo que ve el servidor') ?>

  <?= shot('ssh/49-intentos-fallidos.svg',
      'Log real del servidor con dos fallos de llave para alumno y un usuario inexistente admin con tres contraseñas fallidas desde la misma IP y el mismo puerto de origen.',
      '<b>Dónde mirar:</b> el puerto de origen 50058 se repite en las cinco líneas de admin: fue '
      . '<em>una sola conexión</em> con tres intentos, no tres conexiones.',
      'real') ?>

  <?= callouts([
      ['Failed publickey for alumno', 'El usuario existe; la llave ofrecida no estaba en su <code>authorized_keys</code> en ese momento.'],
      ['Invalid user admin', 'Alguien pidió entrar con un usuario que no existe en el servidor.'],
      ['Failed password for invalid user admin', 'Tres contraseñas probadas en la misma conexión (mismo puerto de origen).'],
      ['Connection closed by invalid user … [preauth]', 'La conexión terminó sin llegar a autenticarse.'],
  ]) ?>

  <h3>Qué leer en cada línea</h3>

  <?= anatomy(
      '<b>Failed password</b> for <i>invalid user admin</i> from <u>192.168.56.10</u> port 50058 ssh2',
      [
          ['Failed password', 'El método y el resultado: contraseña, fallida.'],
          ['invalid user admin', 'El usuario pedido, y que no existe en el sistema.'],
          ['192.168.56.10', 'La IP de origen <em>tal como la vio el servidor</em>.'],
          ['port 50058', 'Puerto de origen del cliente. Sirve para agrupar líneas de la misma conexión.'],
          ['(hora)', 'Aquí falta: el log del laboratorio no la registra. En un servidor real, es imprescindible.'],
      ],
      'Una línea de fallo') ?>

  <?= evidence(
      '<p>Tres <code>Failed password for invalid user admin</code> desde 192.168.56.10, en una sola
      conexión.</p>',
      '<p>Alguien en el equipo 192.168.56.10 probó contraseñas para un usuario inexistente. En este
      caso sabemos que fue el propio laboratorio.</p>',
      '<p>Que sea un ataque, ni quién estaba detrás. Una IP privada de tu red puede ser tu
      compañero equivocándose de usuario. Una IP pública puede ser un NAT compartido por cientos de
      personas o un proxy. Y sin hora no se puede saber si fueron tres intentos en un segundo o en
      una semana.</p>') ?>

  <?= pitfall('<p>Ver cientos de <code>Invalid user</code> en un servidor expuesto a internet y
      concluir «me están atacando a mí». Casi siempre es ruido automatizado que prueba nombres
      comunes en cualquier IP. No se ignora, pero la respuesta es la de las capas: llaves,
      contraseñas desactivadas, root sin acceso. Una línea en el log es evidencia de un intento,
      no de un compromiso.</p>') ?>
</section>

<!-- ============================== FAIL2BAN =========================== -->
<section id="fail2ban">
  <h2>Fail2Ban</h2>
  <p class="tut-sub">Un complemento útil contra el ruido. No un sustituto de la autenticación segura.</p>

  <p><strong>Fail2Ban</strong> es una herramienta aparte, no forma parte de OpenSSH. Lee los logs,
  busca patrones como los <code>Failed password</code> de la sección anterior y, si una IP supera
  un umbral, añade una regla de firewall que la bloquea durante un tiempo.</p>

  <?= compare(
      ['Lo que SÍ mitiga', 'ruido y fuerza bruta',
       '<ul>
          <li>Reduce miles de intentos repetidos desde la misma IP.</li>
          <li>Deja los logs más legibles.</li>
          <li>Ahorra algo de trabajo al servidor.</li>
        </ul>'],
      ['Lo que NO resuelve', 'la autenticación débil',
       '<ul>
          <li>Una contraseña adivinable sigue siéndolo, solo que más despacio.</li>
          <li>Intentos distribuidos desde muchas IP pasan por debajo del umbral.</li>
          <li>No hace nada contra una llave robada.</li>
        </ul>'],
      'Si el servidor ya solo acepta llaves, Fail2Ban es higiene. Si todavía acepta contraseñas débiles, es una tirita.') ?>

  <p>Ten también en cuenta que OpenSSH moderno trae su propio mecanismo parecido: la línea
  <code>srclimit_penalise</code> del log del bastión la produjo <code>PerSourcePenalties</code>,
  que penaliza temporalmente a orígenes con comportamientos sospechosos. Antes de añadir
  herramientas, mira qué hace ya tu versión con <code>sshd -T</code>.</p>

  <?= pitfall('<p>Instalar Fail2Ban y equivocarse de contraseña tres veces desde la IP de la
      oficina. La regla bloquea la IP entera, con todos sus compañeros detrás. Antes de activarlo,
      decide qué orígenes nunca se bloquean y cómo se levanta un bloqueo sin SSH.</p>') ?>
</section>

<!-- ========================== PRÁCTICA SSHD ========================== -->
<section id="practica-sshd">
  <h2>Práctica: servidor</h2>
  <p class="tut-sub">El procedimiento completo, en una máquina tuya, con red de seguridad.</p>

  <?= note('Dónde se hace este ejercicio',
      '<p>En una <strong>VM o contenedor propio</strong> con <code>sshd</code> activo y un usuario con
      <code>sudo</code>. No en un servidor de producción, ni en un hosting compartido, ni en una
      máquina a la que solo llegas por SSH si no tienes consola de recuperación.</p>', 'info') ?>

  <?= ssh_ejercicio([
      'num' => '15',
      'titulo' => 'Endurecer el acceso sin quedarte fuera',
      'nivel' => 'avanzado',
      'objetivo' => 'Objetivo: desactivar las contraseñas en sshd siguiendo el procedimiento de dos terminales y demostrar el resultado.',
      'mision' => 'Dejar un servidor de laboratorio que solo acepte llaves, sin perder en ningún momento el acceso.',
      'escenario' => '<p>Tu VM <code>lab</code> acepta contraseñas (valor por defecto). Ya tienes tu
          llave instalada para el usuario <code>alumno</code>. Quieres cerrar la vía de las
          contraseñas.</p>',
      'preparacion' => '<p>Una llave que entra: <code>ssh -v lab exit 2>&1 | grep Authenticated</code>
          debe decir <code>using "publickey"</code>. Acceso a la consola de la VM por si todo
          falla.</p>',
      'pasos' => [
          '<p><strong>Terminal 1</strong>: entra en <code>lab</code> y no la cierres. Haz la copia:
          <code>sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak</code>. Mira los valores de
          partida con <code>grep -nE</code> y con <code>sudo sshd -T</code>.</p>',
          '<p>Cambia <code>PasswordAuthentication</code> y <code>KbdInteractiveAuthentication</code> a
          <code>no</code>. Ejecuta <code>sudo sshd -t</code> y <code>echo $?</code> hasta obtener
          silencio y 0. Confirma con <code>sudo sshd -T</code>.</p>',
          '<p>Recarga el servicio (<code>sudo systemctl reload sshd</code>, o <code>ssh</code> en
          Debian/Ubuntu). Sin cerrar la terminal 1, abre la <strong>terminal 2</strong>.</p>',
          '<p>Desde la terminal 2: <code>ssh lab hostname</code> y después
          <code>ssh -o PubkeyAuthentication=no alumno@lab</code>. Solo si la primera entra y la
          segunda es rechazada, cierra la terminal 1.</p>',
      ],
      'observar' => '<p>La lista entre paréntesis del mensaje de rechazo antes y después del cambio, el
          código de salida de <code>sshd -t</code> y que la terminal 1 sigue respondiendo tras la
          recarga.</p>',
      'visual' => shot('ssh/46-reinicio-seguro.svg',
          'Cinco pasos del procedimiento de dos terminales para aplicar cambios en sshd.',
          '<b>Dónde mirar:</b> la terminal 1 queda abierta hasta que la 2 confirma.'),
      'preguntas' => [
          '¿Qué lista de métodos esperas ver en el rechazo de la terminal 2, y por qué no debería aparecer <code>password</code>?',
          'Si <code>sshd -t</code> hubiera devuelto 255, ¿qué harías antes de recargar?',
          'Si la terminal 2 no entra <em>ni con llave</em>, ¿desde dónde lo arreglas?',
      ],
      'pistas' => [
          '<p>Piensa en qué pregunta responde cada terminal: la 1 es tu salvavidas; la 2 es la prueba de que otros podrán entrar.</p>',
          '<p>El mensaje <code>Permission denied (…)</code> lista los métodos que el servidor está dispuesto a aceptar, no los que probaste.</p>',
          '<p>Busca en tu sesión real de laboratorio la diferencia entre <code>(publickey,password,keyboard-interactive)</code> y <code>(publickey)</code>.</p>',
      ],
      'solucion' => 'Rechazo esperado: <code>Permission denied (publickey).</code>, con la terminal 1 viva y la 2 entrando con llave.',
      'porque' => '<p>El paréntesis del rechazo refleja lo que el servidor ofrece. Con las dos
          opciones a <code>no</code>, solo queda <code>publickey</code>; si viera <code>password</code>
          o <code>keyboard-interactive</code>, el cambio no se aplicó (falta recargar, un Include lo
          pisa o solo cambiaste una de las dos). Con código 255 no se recarga: se lee la línea que
          indica el error, se corrige y se vuelve a validar. Si la terminal 2 no entra ni con llave,
          se corrige desde la terminal 1 —por eso sigue abierta— restaurando
          <code>sshd_config.bak</code>, validando y recargando.</p>',
      'error' => '<p>Probar desde la misma terminal que ya estaba conectada y dar el cambio por bueno.
          Una sesión abierta antes de la recarga no vuelve a autenticarse: no demuestra nada sobre
          las conexiones nuevas.</p>',
      'aprendiste' => 'validar, recargar y comprobar desde una conexión nueva, con una sesión de rescate abierta durante todo el cambio.',
  ]) ?>

  <?= ssh_cierre('Servidor y seguridad',
      [
          '<code>sshd</code> es el servidor; su estado se consulta con <code>systemctl status</code>, y el nombre del servicio cambia según la distribución.',
          '<code>/etc/ssh/sshd_config</code> decide quién entra; el primer valor obtenido gana y los <code>Include</code> se leen donde aparecen.',
          '<code>sshd -t</code> valida la sintaxis y <code>sshd -T</code> muestra la configuración efectiva.',
          'Los cambios se aplican con una sesión de rescate abierta y se comprueban desde una segunda terminal.',
          'Los logs dicen quién, desde dónde, con qué método y con qué llave; su ubicación depende del sistema.',
      ],
      [
          'systemctl status sshd',
          'sudo sshd -t',
          'sudo sshd -T',
          'sudo systemctl reload sshd',
          'sudo journalctl -u sshd -f',
      ],
      [
          'Desactivar contraseñas exige llaves probadas, recuperación y las dos opciones: <code>PasswordAuthentication</code> y <code>KbdInteractiveAuthentication</code>.',
          '<code>PermitRootLogin</code> vale <code>prohibit-password</code> por defecto; <code>no</code> obliga a entrar con nombre propio.',
          'Un log de fallos es evidencia de intentos, no de un compromiso ni de quién fue.',
          'Fail2Ban complementa; no sustituye a la autenticación con llave.',
      ],
      '<p>Cerrar la única sesión abierta justo después de recargar <code>sshd</code> sin haber
      entrado desde una segunda terminal. Si el cambio estaba mal, no hay forma de volver por
      SSH.</p>',
      [
          [
              'q' => 'sudo sshd -t no imprime nada. ¿Qué significa?',
              'opts' => ['A' => 'Que el servicio está parado', 'B' => 'Que la sintaxis es válida', 'C' => 'Que el cambio ya está aplicado', 'D' => 'Que no tienes permisos'],
              'ok' => 'B',
              'why' => 'En <code>sshd -t</code> el silencio es la respuesta correcta: la sintaxis se procesó y las claves de host se pueden cargar. No aplica nada: para eso hay que recargar, y después comprobar con una conexión nueva.',
          ],
          [
              'q' => 'Tras desactivar contraseñas, un intento sin llave muestra «Permission denied (publickey,keyboard-interactive)». ¿Qué ha pasado?',
              'opts' => ['A' => 'Todo está correcto', 'B' => 'Sigue activa la vía keyboard-interactive, que puede pedir contraseñas', 'C' => 'La llave del cliente está mal', 'D' => 'El firewall bloquea la conexión'],
              'ok' => 'B',
              'why' => 'La lista del paréntesis son los métodos que el servidor ofrece. Si aparece <code>keyboard-interactive</code>, esa opción sigue en <code>yes</code>. Un firewall habría impedido llegar a la autenticación.',
          ],
          [
              'q' => '¿Cuál es el valor por defecto de PermitRootLogin en OpenSSH?',
              'opts' => ['A' => 'yes', 'B' => 'no', 'C' => 'prohibit-password', 'D' => 'forced-commands-only'],
              'ok' => 'C',
              'why' => 'Por defecto root solo puede entrar con llave. El laboratorio lo imprimió como <code>without-password</code>, su alias antiguo.',
          ],
          [
              'q' => 'Ves tres «Failed password for invalid user admin» desde una IP de tu red. ¿Qué puedes afirmar?',
              'opts' => ['A' => 'Que te están atacando', 'B' => 'Que hubo intentos de contraseña para un usuario inexistente desde esa IP', 'C' => 'Que la cuenta admin fue comprometida', 'D' => 'Que hay que bloquear toda la red'],
              'ok' => 'B',
              'why' => 'Eso es exactamente lo que dice el log, y nada más. <code>admin</code> no existe, así que no pudo comprometerse; la intención y la persona detrás son hipótesis que requieren más evidencia.',
          ],
      ]) ?>
</section>

<?= ssh_parte('07', 'Túneles, ProxyJump y Git',
    'Usar una conexión autorizada para llegar a un servicio concreto, entrar por un bastión y hablar con Git.',
    'avanzado') ?>

<!-- ============================== TÚNELES =========================== -->
<section id="tuneles">
  <h2>Qué es un túnel SSH</h2>
  <p class="tut-sub">Una conexión que ya tienes permitida, usada como tubo para otra conexión concreta.</p>

  <p>Hasta ahora SSH te ha servido para dos cosas: abrir un shell y mover ficheros. Tiene una
  tercera que al principio suena a truco y en realidad es de lo más cotidiano en
  administración: <strong>transportar otra conexión dentro de la conexión SSH</strong>.</p>

  <p>El caso típico: en el servidor hay un panel de administración, una base de datos o una
  página de estado que <strong>solo escucha en <code>127.0.0.1</code></strong>. Está hecho a
  propósito: así nadie de fuera puede llegar a él. Pero tú sí puedes entrar al servidor por
  SSH. Un túnel aprovecha eso: tu tráfico hacia el panel viaja cifrado por la conexión SSH y
  el servidor lo entrega en su propio loopback, como si la petición hubiera nacido allí.</p>

  <?= shot('ssh/50-tunel-idea.svg',
      'Tu equipo y el servidor SSH unidos por una conexión cifrada en el puerto 22; dentro de '
      . 'ella viaja una conexión HTTP que el servidor entrega a un servicio en su 127.0.0.1:8000.',
      '<b>Dónde mirar:</b> la flecha amarilla va <em>dentro</em> del tubo verde. No se abre '
      . 'ningún puerto nuevo hacia internet: todo entra por el 22 que ya usabas.',
      'ilustrativo') ?>

  <h3>Explicación sencilla y explicación técnica</h3>

  <?= compare(
      ['Sencilla', 'la analogía del tubo neumático',
       '<p>Entre tu mesa y la del servidor ya hay un tubo neumático blindado (la sesión SSH).
       En vez de mandar solo notas para el servidor, metes un sobre dirigido «al panel del
       tercer piso». El servidor lo recibe por el tubo y lo sube él mismo. El panel cree que
       el sobre viene de dentro del edificio.</p>'],
      ['Técnica', 'reenvío de puertos (port forwarding)',
       '<p>Uno de los dos extremos abre un <em>socket</em> que escucha. Cada conexión que
       entra en él se transporta por un <strong>canal</strong> del protocolo SSH y el otro
       extremo abre una conexión TCP normal hacia el destino indicado. El destino ve una
       conexión que llega desde la máquina que la abrió, no desde ti.</p>'],
      'El túnel no crea permisos nuevos: solo alcanza lo que el extremo que abre la conexión
       final ya podría alcanzar.') ?>

  <h3>Los tres sabores, en una frase cada uno</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Tipos de túnel SSH</caption>
      <thead><tr><th scope="col">Opción</th><th scope="col">Dónde se abre el puerto que escucha</th><th scope="col">Para qué</th></tr></thead>
      <tbody>
        <tr><td class="f">-L</td><td class="d">En tu equipo</td><td class="d">Llegar tú a un servicio que solo ve el servidor.</td></tr>
        <tr><td class="f">-R</td><td class="d">En el servidor</td><td class="d">Que en el servidor se pueda llegar a algo que corre en tu equipo.</td></tr>
        <tr><td class="f">-D</td><td class="d">En tu equipo, como proxy SOCKS</td><td class="d">Que varias aplicaciones salgan por el servidor hacia destinos que eligen ellas.</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('Antes de usar un túnel, una pregunta',
      '<p>¿Estoy autorizado a usar ese servicio? Un túnel sirve para llegar de forma segura a
      algo que <strong>ya es tuyo o para lo que tienes permiso</strong>: el panel de tu propio
      servidor, la base de datos de tu proyecto, la red de gestión que administras. No es una
      forma de saltarse un firewall ni una política de la organización. Si la política dice
      que un servicio no se usa desde fuera, un túnel no la cambia: la incumple.</p>', 'warn') ?>

  <?= pitfall('<p>Pensar que un túnel «abre» el servicio a internet. Con las opciones por
      defecto no: el puerto nuevo escucha solo en el loopback del extremo que lo abre. Lo que
      sí conviene saber es que <em>cualquier proceso de esa máquina</em> puede usarlo mientras
      el túnel esté vivo, así que no dejes túneles abiertos que no necesitas.</p>') ?>
</section>

<!-- =========================== LOCAL -L ============================= -->
<section id="local-forward">
  <h2>Local forwarding: <code>ssh -L</code></h2>
  <p class="tut-sub">Abres un puerto en tu equipo y lo que entra ahí sale por el servidor.</p>

  <p>El escenario del laboratorio: en <code>servidor</code> corre un panel interno que escucha
  en <code>127.0.0.1:8000</code>. Desde el laptop no se ve. Con <code>-L</code> abrimos el
  8080 del laptop y lo conectamos, a través de SSH, con ese 8000.</p>

  <?= shot('ssh/51-tunel-L.svg',
      'Diagrama de ssh -L 8080:127.0.0.1:8000 srv: el puerto 8080 se abre en tu equipo, la '
      . 'conexión viaja por SSH hasta el servidor y este la entrega a su propio 127.0.0.1:8000.',
      '<b>Dónde mirar:</b> el recuadro «127.0.0.1 · visto DESDE el servidor». Es la pieza que '
      . 'casi todo el mundo interpreta al revés.',
      'ilustrativo') ?>

  <?= anatomy(
      '<b>ssh</b> <u>-L 8080</u>:<i>127.0.0.1</i>:<u>8000</u> <b>srv</b>',
      [
          ['-L', 'Local forwarding: el puerto que escucha se abre en el lado del cliente.'],
          ['8080', 'Puerto local. Puedes elegir cualquiera libre; por encima de 1024 no necesitas privilegios.'],
          ['127.0.0.1', 'El destino, <strong>resuelto e interpretado desde el servidor SSH</strong>. Aquí significa «el loopback del servidor», no el tuyo.'],
          ['8000', 'Puerto del destino.'],
          ['srv', 'El servidor SSH que hace de puente (alias de <code>~/.ssh/config</code>).'],
      ],
      'Desglose de -L') ?>

  <p>La forma completa, según <code>man ssh</code>, es
  <code>-L [bind_address:]port:host:hostport</code>. El <code>bind_address</code> opcional
  decide en qué dirección local escucha; si lo omites, escucha solo en loopback, que es lo
  que quieres casi siempre.</p>

  <h3>Dos opciones que acompañan a casi todo túnel</h3>

  <?= anatomy(
      '<b>ssh</b> <u>-f</u> <u>-N</u> -L 8080:127.0.0.1:8000 srv',
      [
          ['-N', 'No ejecutar ningún comando remoto: la conexión solo sirve para reenviar puertos. Sin él abrirías además un shell.'],
          ['-f', 'Pasar a segundo plano después de autenticarse. Te devuelve el prompt con el túnel vivo.'],
      ],
      'Túnel sin shell y en segundo plano') ?>

  <h3>Mostrar: el túnel en el laboratorio</h3>

  <?= shot('ssh/52-tunel-L-real.svg',
      'Salida real: sin túnel, curl no puede conectar con servidor:8000; tras ssh -f -N -L, '
      . 'curl a 127.0.0.1:8080 devuelve el panel interno y ss muestra el 8080 escuchando en '
      . '127.0.0.1 y en ::1.',
      '<b>Dónde mirar:</b> las dos líneas <code>LISTEN</code>. El 8080 escucha en '
      . '<code>127.0.0.1</code> y en <code>[::1]</code>: solo se alcanza desde el propio laptop.',
      'real') ?>

  <?= callouts([
      ['Sin túnel no conecta', 'El panel escucha en el loopback del servidor. Desde fuera, <code>servidor:8000</code> no responde, y es justo lo que se pretende.'],
      ['ssh -f -N -L', 'No imprime nada: se autentica, pasa a segundo plano y te devuelve el prompt. El silencio es la señal de éxito.'],
      ['La respuesta del panel', 'Pides <code>127.0.0.1:8080</code> en el laptop y responde el panel que vive en el <code>127.0.0.1:8000</code> del servidor.'],
      ['ss: 127.0.0.1:8080 LISTEN', 'El puerto nuevo existe en el laptop y solo en loopback. Nadie de la red puede usarlo.'],
  ]) ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ curl -sS -m 3 http://servidor:8000/
curl: (7) Failed to connect to servidor port 8000 after 2 ms: Could not connect to server
alumno@laptop:~$ ssh -f -N -L 8080:127.0.0.1:8000 srv
alumno@laptop:~$ curl -sS http://127.0.0.1:8080/
<h1>Panel interno (solo 127.0.0.1)</h1>
alumno@laptop:~$ ss -tln | grep 8080
LISTEN 0      128        127.0.0.1:8080       0.0.0.0:*
LISTEN 0      128            [::1]:8080          [::]:*
alumno@laptop:~$ pkill -f 'ssh -f -N -L'
TXT, 'salida real · laboratorio') ?>

  <h3>Cómo se cierra</h3>

  <p>Un túnel con <code>-f</code> es un proceso <code>ssh</code> en segundo plano: vive hasta
  que lo terminas. En el laboratorio se cerró con <code>pkill</code> filtrando por la orden
  exacta. En el uso normal tienes tres opciones:</p>

  <ul>
    <li>Sin <code>-f</code>: el túnel dura lo que la orden. <kbd>Ctrl</kbd>+<kbd>C</kbd> lo cierra.</li>
    <li>Con <code>-f</code>: localiza el proceso (<code>pgrep -af 'ssh -f'</code>) y termínalo.</li>
    <li>Si usas multiplexing (Parte 04), <code>ssh -O exit alias</code> cierra la conexión maestra y con ella sus reenvíos.</li>
  </ul>

  <?= evidence(
      '<p><code>curl http://127.0.0.1:8080/</code> en el laptop devuelve
      <code>&lt;h1&gt;Panel interno (solo 127.0.0.1)&lt;/h1&gt;</code>.</p>',
      '<p>El túnel funciona: la petición salió por SSH y el servidor la entregó a su propio
      loopback.</p>',
      '<p>Que el panel sea accesible para otros. Solo lo es para procesos del laptop mientras
      el túnel viva. Tampoco demuestra que el panel sea seguro: el túnel cifra el camino, no
      corrige lo que haya detrás.</p>') ?>

  <?= pitfall('<p>Escribir <code>-L 8080:127.0.0.1:8000</code> pensando que «127.0.0.1» es tu
      equipo y sorprenderse de que conecte con otra cosa. El tercer campo siempre se
      interpreta <strong>desde el servidor SSH</strong>. Si el panel estuviera en otra máquina
      de la red del servidor, pondrías su dirección ahí: <code>-L 8080:10.10.0.40:8000</code>
      funcionaría desde el bastión, que sí ve esa red.</p>') ?>
</section>

<!-- =========================== REMOTE -R ============================ -->
<section id="remote-forward">
  <h2>Remote forwarding: <code>ssh -R</code></h2>
  <p class="tut-sub">El mismo tubo en sentido contrario: el puerto se abre en el servidor.</p>

  <p>Ahora el servicio está en <strong>tu equipo</strong> y quien lo necesita está en el
  servidor. Ejemplo legítimo: estás desarrollando una página en el laptop y quieres probarla
  desde el servidor, que es donde vive el resto de la aplicación. <code>-R</code> abre un
  puerto en el servidor que desemboca en tu equipo.</p>

  <?= shot('ssh/53-tunel-R.svg',
      'Diagrama de ssh -R 9000:127.0.0.1:9000 srv: el puerto 9000 se abre en el servidor y lo '
      . 'que entra ahí viaja por SSH hasta el 127.0.0.1:9000 del laptop.',
      '<b>Dónde mirar:</b> las flechas van de derecha a izquierda. El puerto que escucha está '
      . 'en el servidor; el destino, en tu equipo.',
      'ilustrativo') ?>

  <?= anatomy(
      '<b>ssh</b> <u>-R 9000</u>:<i>127.0.0.1</i>:<u>9000</u> <b>srv</b>',
      [
          ['-R', 'Remote forwarding: el puerto que escucha se abre en el servidor.'],
          ['9000', 'Puerto que se abre en el servidor.'],
          ['127.0.0.1', 'El destino, <strong>interpretado desde tu equipo</strong>: aquí, tu propio loopback.'],
          ['9000', 'Puerto del destino en tu equipo.'],
          ['srv', 'El servidor donde aparecerá el puerto.'],
      ],
      'Desglose de -R') ?>

  <h3>Mostrar: una demo local vista desde el servidor</h3>

  <p>En el laptop se arrancó un servidor web mínimo en <code>127.0.0.1:9000</code>. Antes del
  túnel, el servidor no puede alcanzarlo; después, sí:</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ cd demo-local && (python3 -m http.server 9000 --bind 127.0.0.1 >/dev/null 2>&1 &) ; cd ~
alumno@laptop:~$ ssh srv 'curl -sS -m 3 http://127.0.0.1:9000/'
curl: (7) Failed to connect to 127.0.0.1 port 9000 after 0 ms: Could not connect to server
alumno@laptop:~$ ssh -f -N -R 9000:127.0.0.1:9000 srv
alumno@laptop:~$ ssh srv 'curl -sS http://127.0.0.1:9000/'
<h1>Demo que corre en el laptop</h1>
alumno@laptop:~$ pkill -f 'ssh -f -N -R'
TXT, 'salida real · laboratorio') ?>

  <p>Fíjate en que los dos <code>curl</code> se ejecutan <em>en el servidor</em> (van dentro
  de <code>ssh srv '…'</code>) contra <em>su</em> <code>127.0.0.1:9000</code>. El primero
  falla porque ahí no hay nada; el segundo recibe la página del laptop.</p>

  <h3>Quién puede usar ese puerto en el servidor</h3>

  <p>Por defecto, <code>sshd</code> ata los reenvíos remotos a la dirección de loopback del
  servidor: solo procesos del propio servidor pueden usarlos. Lo controla la directiva de
  servidor <code>GatewayPorts</code>, cuyo comportamiento por defecto documenta
  <code>man sshd_config</code> precisamente para impedir que otros equipos se conecten.</p>

  <?= note('Solo en administración legítima',
      '<p><code>-R</code> publica en otra máquina algo que corre en la tuya. Eso es una decisión
      que debe estar permitida en ese servidor y en tu organización. Usos razonables: probar un
      desarrollo, dar soporte puntual en un equipo tuyo, una demo en tu laboratorio. No se
      utiliza para dejar accesos permanentes ni para eludir controles de la red.</p>', 'warn') ?>

  <?= pitfall('<p>Esperar que <code>-R 9000:…</code> deje el 9000 accesible desde toda la red
      del servidor. Con <code>GatewayPorts</code> por defecto solo escucha en loopback. Si ves
      que un reenvío remoto está expuesto hacia fuera, alguien cambió esa directiva: es un
      hallazgo que conviene revisar, no un comportamiento normal.</p>') ?>
</section>

<!-- ========================== DYNAMIC -D ============================ -->
<section id="dynamic-forward">
  <h2>Dynamic forwarding: <code>ssh -D</code></h2>
  <p class="tut-sub">Un proxy SOCKS en tu equipo: cada aplicación decide a dónde va.</p>

  <p>Con <code>-L</code> fijas un destino por túnel. Si administras una red interna con varios
  paneles (monitorización, wiki, un switch gestionable), abrir un <code>-L</code> por cada uno
  es tedioso. <code>-D</code> abre en tu equipo un <strong>proxy SOCKS</strong>: las
  aplicaciones configuradas para usarlo le dicen en cada conexión a qué destino quieren ir, y
  el servidor SSH abre esa conexión.</p>

  <?= shot('ssh/54-tunel-D.svg',
      'Diagrama de ssh -D 1080 bastion: tu equipo abre un proxy SOCKS en el puerto 1080; las '
      . 'conexiones viajan por SSH al bastión y este las abre hacia varios destinos internos.',
      '<b>Dónde mirar:</b> un solo túnel y tres flechas de salida. El destino no está en la '
      . 'orden: lo elige la aplicación.',
      'ilustrativo') ?>

  <?= anatomy(
      '<b>ssh</b> <u>-D 1080</u> <b>bastion</b>',
      [
          ['-D 1080', 'Proxy SOCKS escuchando en el 1080 de tu equipo (forma completa: <code>-D [bind_address:]port</code>).'],
          ['bastion', 'El servidor desde el que saldrán las conexiones. Solo alcanzarán lo que el bastión alcance.'],
      ],
      'Desglose de -D') ?>

  <h3>Mostrar: la wiki de la red interna</h3>

  <p><code>interno</code> vive en <code>10.10.0.0/24</code>, una red sin salida que el laptop
  no ve. El bastión tiene pata en ambas redes:</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ curl -sS -m 5 http://10.10.0.40:8000/
curl: (28) Connection timed out after 5002 milliseconds
alumno@laptop:~$ ssh -f -N -D 1080 bastion
alumno@laptop:~$ curl -sS --socks5-hostname 127.0.0.1:1080 http://10.10.0.40:8000/
<h1>Wiki interna</h1>
alumno@laptop:~$ pkill -f 'ssh -f -N -D'
TXT, 'salida real · laboratorio') ?>

  <?= anatomy(
      'curl <u>--socks5-hostname 127.0.0.1:1080</u> http://10.10.0.40:8000/',
      [
          ['--socks5-hostname', 'Opción de <code>curl</code>: usar ese proxy SOCKS5 y dejar que el nombre del destino lo resuelva el otro extremo (el bastión), no tu equipo.'],
          ['127.0.0.1:1080', 'El proxy que abrió <code>ssh -D</code>.'],
      ],
      'La aplicación elige el destino') ?>

  <p>En un navegador se configura igual: proxy SOCKS <code>127.0.0.1</code>, puerto
  <code>1080</code>. Mientras el proxy esté activo, <em>todo</em> lo que ese navegador pida
  saldrá por el bastión, así que lo sensato es usar un perfil del navegador dedicado a la
  administración.</p>

  <?= evidence(
      '<p>Directo: <code>Connection timed out</code>. Por el proxy: <code>&lt;h1&gt;Wiki
      interna&lt;/h1&gt;</code>.</p>',
      '<p>El bastión alcanza <code>10.10.0.40:8000</code> y el laptop no; el proxy SOCKS lleva
      la petición hasta él.</p>',
      '<p>Que el tráfico «desaparezca». En el bastión y en la red interna la conexión es
      perfectamente visible, con el bastión como origen, y sus logs registran tu sesión SSH.
      <code>-D</code> es una comodidad de administración, no un mecanismo de anonimato.</p>') ?>

  <?= pitfall('<p>Usar <code>--socks5</code> en lugar de <code>--socks5-hostname</code> con
      destinos que son nombres internos. Con el primero, el nombre lo resuelve tu equipo, que
      no conoce el DNS interno, y el fallo parece del túnel cuando es de resolución.</p>') ?>
</section>

<!-- ======================= COMPARAR TÚNELES ========================= -->
<section id="comparar-tuneles">
  <h2><code>-L</code> frente a <code>-R</code> frente a <code>-D</code></h2>
  <p class="tut-sub">Una sola pregunta los separa: ¿en qué máquina se abre el puerto que escucha?</p>

  <?= shot('ssh/55-LRD-comparacion.svg',
      'Tabla comparativa de -L, -R y -D: dónde se abre el puerto, destino, sintaxis, uso típico '
      . 'y regla mnemotécnica.',
      '<b>Dónde mirar:</b> la primera fila. Si sabes dónde escucha el puerto, el resto de la '
      . 'orden se deduce.',
      'ilustrativo') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Resumen de las tres formas de reenvío con ejemplos del laboratorio</caption>
      <thead><tr><th scope="col">Orden del laboratorio</th><th scope="col">Escucha en</th><th scope="col">Llega a</th><th scope="col">Lo prueba</th></tr></thead>
      <tbody>
        <tr><td class="f">ssh -f -N -L 8080:127.0.0.1:8000 srv</td><td class="d">laptop 127.0.0.1:8080</td><td class="d">panel en el loopback de servidor</td><td class="d"><code>curl 127.0.0.1:8080</code> en el laptop</td></tr>
        <tr><td class="f">ssh -f -N -R 9000:127.0.0.1:9000 srv</td><td class="d">servidor 127.0.0.1:9000</td><td class="d">demo en el loopback del laptop</td><td class="d"><code>curl 127.0.0.1:9000</code> en el servidor</td></tr>
        <tr><td class="f">ssh -f -N -D 1080 bastion</td><td class="d">laptop 127.0.0.1:1080 (SOCKS)</td><td class="d">lo que pida cada aplicación, desde el bastión</td><td class="d"><code>curl --socks5-hostname …</code></td></tr>
      </tbody>
    </table>
  </div>

  <h3>El lado del servidor también decide</h3>

  <p>Todo esto requiere que <code>sshd</code> lo permita. Las directivas relevantes de
  <code>sshd_config</code>:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Directivas de servidor que controlan los reenvíos</caption>
      <thead><tr><th scope="col">Directiva</th><th scope="col">Qué controla</th></tr></thead>
      <tbody>
        <tr><td class="f">AllowTcpForwarding</td><td class="d">Si se permite el reenvío TCP: <code>yes</code> (valor por defecto de OpenSSH), <code>no</code>, <code>local</code> o <code>remote</code>.</td></tr>
        <tr><td class="f">GatewayPorts</td><td class="d">Si los reenvíos remotos (<code>-R</code>) pueden escuchar fuera del loopback del servidor.</td></tr>
        <tr><td class="f">PermitOpen</td><td class="d">A qué destinos <code>host:puerto</code> se permite reenviar.</td></tr>
        <tr><td class="f">PermitListen</td><td class="d">En qué direcciones y puertos puede escuchar un reenvío remoto.</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('Un hallazgo real del laboratorio',
      '<p>La imagen de Alpine usada para los contenedores trae en su <code>sshd_config</code>
      <code>AllowTcpForwarding no</code>, distinto del valor por defecto de OpenSSH
      (<code>yes</code>). Para estas prácticas hubo que cambiarlo a <code>yes</code> en
      <code>servidor</code>, <code>bastion</code> e <code>interno</code>.</p>
      <p>Lección práctica: si un túnel falla y el cliente no da ningún error de
      autenticación, mira la configuración real del servidor (<code>sudo sshd -T</code>), no la
      documentación genérica. Y como recuerda el propio manual, desactivar el reenvío solo
      mejora la seguridad si además esos usuarios no tienen shell, porque con shell podrían
      montar su propio reenviador.</p>', 'info') ?>

  <?= pitfall('<p>Confundir el sentido de la flecha y abrir <code>-R</code> cuando querías
      <code>-L</code>. El síntoma: el comando no da error, pero el puerto aparece en la otra
      máquina. Compruébalo siempre con <code>ss -tln</code> en el equipo donde esperas que
      escuche.</p>') ?>
</section>

<!-- ============================ PROXYJUMP =========================== -->
<section id="proxyjump">
  <h2>ProxyJump: entrar por un bastión</h2>
  <p class="tut-sub">Un único equipo expuesto y endurecido, y detrás los servidores que no deben ver internet.</p>

  <p>En una infraestructura bien diseñada, los servidores internos no tienen el puerto 22
  abierto hacia fuera. Hay un <strong>bastión</strong> (o <em>jump host</em>): la única
  máquina a la que se entra desde fuera, con su acceso controlado y sus logs vigilados. Desde
  ahí se salta a lo demás.</p>

  <?= shot('ssh/56-proxyjump.svg',
      'Tu equipo se conecta al bastión, que tiene pata en las dos redes; desde el bastión se '
      . 'abre la conexión al servidor interno 10.10.0.40. Una línea discontinua indica que la '
      . 'sesión cifrada es de extremo a extremo con el interno.',
      '<b>Dónde mirar:</b> la línea discontinua de abajo. El bastión reenvía bytes cifrados; la '
      . 'autenticación y la sesión son entre tu equipo y el interno.',
      'ilustrativo') ?>

  <h3>Qué hace exactamente <code>-J</code></h3>

  <p>Según <code>man ssh</code>, <code>-J destino</code> primero abre una conexión SSH al
  bastión y después establece desde ahí un reenvío TCP hasta el destino final. Por ese
  reenvío tu cliente habla SSH directamente con el interno. Consecuencias:</p>

  <ul>
    <li>Te autenticas <strong>dos veces</strong>, con tu equipo: una en el bastión y otra en el interno.</li>
    <li>Tus llaves privadas no salen del laptop. El bastión no puede usarlas.</li>
    <li>La huella del interno se verifica igual que la de cualquier servidor: en tu <code>known_hosts</code>.</li>
  </ul>

  <?= compare(
      ['ProxyJump (-J)', 'lo recomendado',
       '<ul>
          <li>El bastión solo reenvía una conexión cifrada.</li>
          <li>Las llaves se quedan en tu equipo.</li>
          <li>Funciona con <code>scp</code>, <code>sftp</code>, <code>rsync</code> y <code>git</code> si está en el config.</li>
        </ul>'],
      ['ForwardAgent', 'con cautela',
       '<ul>
          <li>Entras al bastión y desde su shell haces <code>ssh interno</code>.</li>
          <li>El bastión puede pedir firmas a tu agente mientras estés conectado.</li>
          <li>Quien controle el bastión podría usar tu identidad en ese rato. Por defecto está en <code>no</code>.</li>
        </ul>'],
      'Para saltar a otro servidor, ProxyJump. El reenvío de agente solo en máquinas en las que
       confías tanto como en tu propio equipo.') ?>

  <h3>Mostrar: directo falla, por el bastión entra</h3>

  <?= shot('ssh/57-proxyjump-real.svg',
      'Salida real: la conexión directa a 10.10.0.40 termina en Operation timed out; con ssh -J '
      . 'bastion aparece la huella del interno con «no hostip for proxy command», se acepta, y '
      . 'el interno responde; ssh -G interno muestra proxyjump bastion.',
      '<b>Dónde mirar:</b> la línea de autenticidad. Aunque entres por el bastión, la huella que '
      . 'se pregunta es la del <em>interno</em>.',
      'real') ?>

  <?= callouts([
      ['Conexión directa: Operation timed out', 'El laptop no tiene ruta a <code>10.10.0.0/24</code>. No es un fallo: es el diseño.'],
      ['ssh -J bastion', 'El salto se hace con el alias <code>bastion</code> del config, así que usa su usuario, su IP y su llave.'],
      ['«&lt;no hostip for proxy command&gt;»', 'El cliente no abrió la conexión TCP hacia el interno (la abrió el bastión), así que no tiene una IP propia que mostrar ni registrar junto al nombre. Solo informa de eso.'],
      ['Responde el interno', '<code>hostname</code> y el contenido de <code>LEEME.txt</code> salen de <code>interno</code>.'],
      ['ssh -G: proxyjump bastion', 'La configuración efectiva confirma que el alias <code>interno</code> salta por el bastión sin escribir <code>-J</code>.'],
  ]) ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh -o ConnectTimeout=5 alumno@10.10.0.40 hostname
ssh: connect to host 10.10.0.40 port 22: Operation timed out
alumno@laptop:~$ ssh -J bastion alumno@10.10.0.40 hostname
The authenticity of host '10.10.0.40 (<no hostip for proxy command>)' can't be established.
ED25519 key fingerprint is SHA256:PTd7h/qIHoYoitrIu7HUZo/5Xqkjomm7BhTJEtfokSw.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '10.10.0.40' (ED25519) to the list of known hosts.
interno
alumno@laptop:~$ ssh interno 'hostname; cat LEEME.txt'
interno
servidor interno
alumno@laptop:~$ ssh -G interno | grep -E '^(hostname|user|proxyjump) '
user alumno
hostname 10.10.0.40
proxyjump bastion
TXT, 'salida real · laboratorio') ?>

  <p>La huella que mostró el cliente, <code>SHA256:PTd7h/qI…fokSw</code>, es la que calcula
  <code>ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub</code> dentro de
  <code>interno</code>:</p>

  <?= ssh_term(<<<'TXT'
256 SHA256:PTd7h/qIHoYoitrIu7HUZo/5Xqkjomm7BhTJEtfokSw root@interno (ED25519)
TXT, 'salida real · en interno') ?>

  <h3><code>~/.ssh/config</code> + ProxyJump</h3>

  <p>Escribir <code>-J</code> cada vez sobra. En el config del laptop hay dos bloques que lo
  resuelven: el bastión con su llave, y el interno diciendo por dónde se llega.</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ cat ~/.ssh/config
[… 12 líneas omitidas …]
Host bastion
    HostName 192.168.56.30
    User alumno
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes

Host interno
    HostName 10.10.0.40
    User alumno
    ProxyJump bastion
[… 4 líneas omitidas …]
TXT, 'salida real · laboratorio') ?>

  <?= anatomy(
      '<b>Host</b> interno · <b>HostName</b> 10.10.0.40 · <b>ProxyJump</b> <u>bastion</u>',
      [
          ['HostName 10.10.0.40', 'La dirección del interno <strong>vista desde el bastión</strong>: el laptop nunca la contacta directamente.'],
          ['ProxyJump bastion', 'Usa el bloque <code>Host bastion</code> para el primer salto. Admite varios saltos separados por comas.'],
      ],
      'El bloque del interno') ?>

  <p>Con eso, <code>ssh interno</code>, <code>scp fichero interno:</code> y
  <code>rsync -av web/ interno:web/</code> saltan solos por el bastión.</p>

  <?= pitfall('<p>Conectarse por primera vez al bastión o al interno respondiendo
      <code>yes</code> sin mirar, «porque es del laboratorio» o «porque ya entré por el
      bastión». Son dos máquinas y dos huellas. La primera conexión real al bastión mostró su
      propia huella, distinta:</p>') ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh bastion hostname
The authenticity of host '192.168.56.30 (192.168.56.30)' can't be established.
ED25519 key fingerprint is SHA256:lC8aRBNzw60lHXF8DyBoaOKMceysqR+h4bYkN0tsSog.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '192.168.56.30' (ED25519) to the list of known hosts.
bastion
TXT, 'salida real · laboratorio') ?>

  <?= evidence(
      '<p>Con <code>-J bastion</code>, el interno responde <code>interno</code>; directo,
      <code>Operation timed out</code>.</p>',
      '<p>El diseño funciona: el interno solo es accesible a través del bastión.</p>',
      '<p>Que el interno sea inaccesible para cualquiera. Quien comprometa el bastión o tenga
      una cuenta en él parte con ventaja: por eso el bastión se endurece más que ningún otro
      equipo (Parte 06) y se vigilan sus logs.</p>') ?>
</section>

<!-- ============================= GIT SSH ============================ -->
<section id="git-ssh">
  <h2>Git sobre SSH</h2>
  <p class="tut-sub">Git decide qué enviar; SSH decide cómo llega y quién eres.</p>

  <p>Cuando haces <code>git clone</code>, <code>git pull</code> o <code>git push</code> contra
  una URL SSH, Git no implementa ninguna conexión propia: <strong>ejecuta <code>ssh</code></strong>
  y habla con el programa Git del otro lado por ese canal. Todo lo que ya sabes vale igual:
  huellas, llaves, agente, <code>~/.ssh/config</code> y <code>ssh -v</code>.</p>

  <?= shot('ssh/58-git-ssh.svg',
      'git push invoca a ssh, ssh se autentica con la llave contra el servidor Git y por ese '
      . 'canal se intercambian los objetos de repos/proyecto.git.',
      '<b>Dónde mirar:</b> la URL de abajo. Tiene la misma forma que un destino de '
      . '<code>scp</code>: usuario, máquina, dos puntos y ruta.',
      'ilustrativo') ?>

  <?= compare(
      ['Git', 'el QUÉ',
       '<ul>
          <li>Commits, ramas, objetos.</li>
          <li>Qué hay que enviar o recibir.</li>
          <li>Errores como <code>rejected</code> o <code>non-fast-forward</code>.</li>
        </ul>'],
      ['SSH', 'el CÓMO y el QUIÉN',
       '<ul>
          <li>La conexión cifrada y la huella del servidor.</li>
          <li>Tu llave y tu agente.</li>
          <li>Errores como <code>Permission denied (publickey)</code> o <code>Host key verification failed</code>.</li>
        </ul>'],
      'Ante un fallo de Git, lee el mensaje: si habla de llaves o de host, es SSH y se
       diagnostica como SSH.') ?>

  <h3>Anatomía de una URL SSH de Git</h3>

  <?= anatomy(
      'git clone <i>srv</i>:<u>repos/proyecto.git</u> web',
      [
          ['srv', 'Alias de <code>~/.ssh/config</code>: aporta HostName, User e IdentityFile. Sin alias sería <code>alumno@servidor</code>.'],
          [':', 'Separa máquina y ruta, igual que en <code>scp</code>. Sin barra inicial, la ruta es relativa al home del usuario remoto.'],
          ['repos/proyecto.git', 'Repositorio en el servidor. Aquí, un repositorio <em>bare</em> creado en <code>/home/alumno/repos</code>.'],
          ['web', 'Directorio local donde se clona.'],
      ],
      'URL de estilo scp') ?>

  <h3>Mostrar: clonar el repositorio del laboratorio</h3>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ git clone srv:repos/proyecto.git web
Cloning into 'web'...
warning: You appear to have cloned an empty repository.
hint: Using 'master' as the name for the initial branch. This default branch name
hint: is subject to change. To configure the initial branch name to use in all
hint: of your new repositories, which will suppress this warning, call:
hint:
hint: 	git config --global init.defaultBranch <name>
hint:
hint: Names commonly chosen instead of 'master' are 'main', 'trunk' and
hint: 'development'. The just-created branch can be renamed via this command:
hint:
hint: 	git branch -m <name>
TXT, 'salida real · laboratorio') ?>

  <p>No pidió contraseña ni huella: la huella de <code>servidor</code> ya estaba en
  <code>known_hosts</code> y la llave estaba cargada en el agente. El <code>warning</code> es
  de Git (el repositorio aún no tenía commits) y los <code>hint</code> también; nada de eso es
  un problema de SSH.</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~/web$ git remote -v
origin	srv:repos/proyecto.git (fetch)
origin	srv:repos/proyecto.git (push)
TXT, 'salida real · laboratorio') ?>

  <h3>Ver la parte SSH de Git</h3>

  <p>Git respeta la variable <code>GIT_SSH_COMMAND</code>: la orden que usará en lugar de
  <code>ssh</code>. Poniendo <code>ssh -v</code> ves la autenticación exactamente como en la
  Parte 04:</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~/web$ GIT_SSH_COMMAND="ssh -v" git ls-remote origin 2>&1 | grep -E "Authenticating|Offering|Server accepts|Authenticated|refs/heads"
debug1: Authenticating to servidor:22 as 'alumno'
debug1: Offering public key: /home/alumno/.ssh/id_ed25519 ED25519 SHA256:naRfLqw1lzl4RNzMfQ/a0lJ2FAIuCHwbE6H7hQnqjHI explicit agent
debug1: Server accepts key: /home/alumno/.ssh/id_ed25519 ED25519 SHA256:naRfLqw1lzl4RNzMfQ/a0lJ2FAIuCHwbE6H7hQnqjHI explicit agent
Authenticated to servidor ([192.168.56.20]:22) using "publickey".
TXT, 'salida real · laboratorio') ?>

  <p>No aparece ninguna línea <code>refs/heads</code> porque el repositorio todavía no tenía
  ramas en ese momento: la parte SSH funcionó y Git no tenía nada que listar.</p>

  <?= anatomy(
      '<u>GIT_SSH_COMMAND</u>="ssh -v" git ls-remote origin',
      [
          ['GIT_SSH_COMMAND', 'Variable de entorno: solo afecta a esa orden. Útil para depurar o para forzar una llave: <code>GIT_SSH_COMMAND="ssh -i ~/.ssh/llave_deploy -o IdentitiesOnly=yes"</code>.'],
          ['core.sshCommand', 'El equivalente persistente por repositorio: <code>git config core.sshCommand "ssh -i ~/.ssh/llave_deploy -o IdentitiesOnly=yes"</code>.'],
      ],
      'Controlar qué ssh usa Git') ?>

  <h3>Primer push</h3>

  <p>Con un commit en la rama <code>main</code>, se publica en el servidor:</p>

<?= ssh_term(<<<'TXT'
alumno@laptop:~$ cd web
alumno@laptop:~/web$ git branch -m master main
alumno@laptop:~/web$ git push -u origin main
Enumerating objects: 3, done.
Counting objects: 100% (3/3), done.
Writing objects: 100% (3/3), 231 bytes | 231.00 KiB/s, done.
Total 3 (delta 0), reused 0 (delta 0), pack-reused 0 (from 0)
To srv:repos/proyecto.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
TXT, 'salida real · laboratorio') ?>

  <h3>Git con un proveedor (GitHub, GitLab, Gitea…)</h3>

  <p>Con un proveedor alojado la idea es la misma, con dos diferencias prácticas:</p>

  <ul>
    <li><strong>El usuario suele ser <code>git</code> para todo el mundo.</strong> La URL es del
    tipo <code>git@proveedor.ejemplo:organizacion/proyecto.git</code>. No te identifica el
    nombre de usuario, sino <strong>qué llave pública</strong> registraste en tu cuenta.</li>
    <li><strong>No hay shell.</strong> Para probar la autenticación se usa <code>-T</code> (no
    pedir terminal); cada proveedor responde con su propio mensaje de bienvenida o de
    rechazo.</li>
  </ul>

  <?= ssh_term(<<<'TXT'
# Comprobar la autenticación con un proveedor (nombre de ejemplo)
$ ssh -T git@proveedor.ejemplo

# Si falla, la misma prueba con detalle
$ ssh -vT git@proveedor.ejemplo
TXT, 'bash') ?>

  <p>Antes de aceptar su huella la primera vez, compárala con la que el proveedor publica en
  su documentación oficial. Es exactamente el mismo razonamiento que con tu servidor.</p>

  <?= note('Llaves de despliegue',
      '<p>Un servidor que solo necesita <em>descargar</em> el código no debería usar tu llave
      personal. Los proveedores permiten registrar en un repositorio concreto una
      <strong>llave de despliegue</strong>, normalmente de solo lectura: si alguien la roba del
      servidor, solo puede leer ese repositorio, no actuar como tú en todos los demás. Se
      combina con <code>core.sshCommand</code> o con un bloque <code>Host</code> propio con
      <code>IdentitiesOnly yes</code>.</p>', 'info') ?>

  <?= pitfall('<p>Ver <code>Permission denied (publickey)</code> en un <code>git push</code> y
      buscar el fallo en Git: credenciales, ramas, permisos del repositorio. Ese mensaje lo
      emite SSH antes de que Git intercambie nada. Se diagnostica con
      <code>GIT_SSH_COMMAND="ssh -v"</code> o con <code>ssh -vT</code>, mirando qué llave se
      ofrece.</p>') ?>
</section>

<!-- ======================= PRÁCTICA TÚNELES ========================= -->
<section id="practica-tuneles">
  <h2>Práctica: túneles y Git</h2>
  <p class="tut-sub">Dos ejercicios en tu laboratorio: un panel que solo escucha en loopback y un repositorio propio.</p>

  <?= ssh_ejercicio([
      'num' => '16',
      'titulo' => 'Un túnel local hacia un panel interno',
      'nivel' => 'intermedio',
      'objetivo' => 'Objetivo: llegar con -L a un servicio que solo escucha en el loopback del servidor y demostrar dónde escucha el túnel.',
      'mision' => 'Ver en tu equipo un panel que en el servidor solo escucha en <code>127.0.0.1:8000</code>, sin abrir ningún puerto nuevo en el servidor.',
      'escenario' => 'Tu servidor de laboratorio <code>srv</code> tiene un panel de administración que, por diseño, solo acepta conexiones locales. Tú tienes acceso SSH autorizado a ese servidor.',
      'preparacion' => 'Un servidor propio o VM con <code>sshd</code>. En él, un servicio de prueba solo en loopback: <code>python3 -m http.server 8000 --bind 127.0.0.1</code>. En tu equipo, el alias <code>srv</code> en <code>~/.ssh/config</code>.',
      'pasos' => [
          '<p>Comprueba que desde tu equipo no llegas al panel:</p>'
          . ssh_term(<<<'TXT'
$ curl -sS -m 3 http://srv-o-su-ip:8000/
TXT, 'bash'),
          '<p>Abre el túnel sin shell y en segundo plano, y pide el panel en tu puerto local:</p>'
          . ssh_term(<<<'TXT'
$ ssh -f -N -L 8080:127.0.0.1:8000 srv
$ curl -sS http://127.0.0.1:8080/
TXT, 'bash'),
          '<p>Comprueba dónde escucha el 8080 y después cierra el túnel:</p>'
          . ssh_term(<<<'TXT'
$ ss -tln | grep 8080
$ pkill -f 'ssh -f -N -L'
TXT, 'bash'),
      ],
      'observar' => '<p>Que el primer <code>curl</code> falle, que <code>ssh -f -N -L</code> no imprima nada y que <code>ss</code> muestre el 8080 en <code>127.0.0.1</code> (y quizá en <code>[::1]</code>), nunca en <code>0.0.0.0</code>.</p>',
      'visual' => shot('ssh/52-tunel-L-real.svg',
          'Salida real del laboratorio con el curl fallido, el túnel -L, la respuesta del panel y el puerto 8080 en escucha.',
          '<b>Referencia:</b> así se vio en el laboratorio del curso.', 'real'),
      'preguntas' => [
          'En <code>-L 8080:127.0.0.1:8000</code>, ¿qué máquina es «127.0.0.1»?',
          '¿Por qué el túnel no expone el panel a otros equipos de tu red?',
          'Si el panel estuviera en otra máquina de la red del servidor, ¿qué cambiarías en la orden?',
      ],
      'pistas' => [
          '<p>El tercer campo de <code>-L</code> lo resuelve quien abre la conexión final. ¿Quién la abre?</p>',
          '<p>Mira la columna de dirección local de <code>ss -tln</code>. ¿En qué interfaz escucha el 8080?</p>',
      ],
      'solucion' => '«127.0.0.1» es el servidor; el túnel escucha solo en el loopback de tu equipo; para otra máquina cambias el tercer campo por su dirección.',
      'porque' => '<p>Con <code>-L</code> el cliente abre el puerto que escucha y el <strong>servidor SSH</strong> abre la conexión hacia <code>host:hostport</code>, así que <code>127.0.0.1</code> es su loopback. Sin <code>bind_address</code> el cliente escucha solo en loopback, y lo confirma <code>ss</code> con <code>127.0.0.1:8080</code>. Para un panel en <code>10.0.0.5:8000</code> accesible desde el servidor, la orden sería <code>ssh -f -N -L 8080:10.0.0.5:8000 srv</code>.</p>',
      'error' => '<p>Poner la IP pública del servidor en el tercer campo «para asegurarse». El servidor intentaría conectar consigo mismo por su interfaz externa, donde el panel no escucha, y el túnel parecería roto.</p>',
      'aprendiste' => 'con -L el puerto se abre en tu equipo y el destino se interpreta desde el servidor.',
  ]) ?>

  <?= ssh_ejercicio([
      'num' => '17',
      'titulo' => 'Git sobre SSH con tu llave',
      'nivel' => 'intermedio',
      'objetivo' => 'Objetivo: clonar y publicar un repositorio por SSH y separar qué parte hace Git y qué parte hace SSH.',
      'mision' => 'Crear un repositorio en tu servidor, clonarlo con un alias del config, publicar un primer commit y comprobar con qué llave te autenticaste.',
      'escenario' => 'Quieres versionar tu web y guardar el repositorio en tu propio servidor, sin proveedor externo, usando la llave que ya tienes instalada.',
      'preparacion' => 'Acceso SSH con llave a tu servidor (alias <code>srv</code>) y Git instalado en ambos lados.',
      'pasos' => [
          '<p>En el servidor, crea un repositorio vacío (bare):</p>'
          . ssh_term(<<<'TXT'
$ ssh srv 'mkdir -p repos && git init --bare -b main repos/proyecto.git'
TXT, 'bash'),
          '<p>En tu equipo, clónalo, crea un commit y publícalo:</p>'
          . ssh_term(<<<'TXT'
$ git clone srv:repos/proyecto.git web
$ cd web
$ echo '# Web del laboratorio' > README.md
$ git add README.md
$ git commit -m 'Primer commit'
$ git branch -m main
$ git push -u origin main
TXT, 'bash'),
          '<p>Mira la parte SSH de la operación:</p>'
          . ssh_term(<<<'TXT'
$ GIT_SSH_COMMAND="ssh -v" git ls-remote origin 2>&1 | grep -E "Offering|Server accepts|Authenticated|refs/heads"
TXT, 'bash'),
      ],
      'observar' => '<p>Que el clon no pida contraseña (llave y agente), que el <code>warning</code> del repositorio vacío venga de Git, y que en el último paso aparezcan las líneas <code>Offering public key</code>, <code>Server accepts key</code>, <code>Authenticated … using "publickey"</code> y, tras el push, una línea con <code>refs/heads/main</code>.</p>',
      'visual' => shot('ssh/58-git-ssh.svg',
          'Git invoca a ssh, ssh autentica con la llave y transporta los objetos al servidor Git.',
          '<b>Referencia:</b> Git decide qué enviar; SSH, cómo y quién.', 'ilustrativo'),
      'preguntas' => [
          '¿Qué datos de conexión aporta el alias <code>srv</code> a la URL <code>srv:repos/proyecto.git</code>?',
          'Si ves <code>Permission denied (publickey)</code> al hacer push, ¿es un problema de Git o de SSH?',
          '¿Qué ganarías usando una llave de despliegue de solo lectura en un servidor que solo hace <code>git pull</code>?',
      ],
      'pistas' => [
          '<p>Ejecuta <code>ssh -G srv</code> y busca <code>user</code>, <code>hostname</code> e <code>identityfile</code>.</p>',
          '<p>Piensa en qué momento se emite el mensaje: ¿antes o después de que Git pueda intercambiar objetos?</p>',
      ],
      'solucion' => 'El alias aporta usuario, máquina y llave; <code>Permission denied (publickey)</code> es de SSH; la llave de solo lectura limita el daño si se roba.',
      'porque' => '<p>Git ejecuta <code>ssh</code> con el destino <code>srv</code>, y <code>ssh</code> lee el bloque <code>Host srv</code> como para cualquier otra orden. La autenticación ocurre antes de que Git hable con el otro lado, así que un rechazo de llave es siempre de SSH y se ve con <code>GIT_SSH_COMMAND="ssh -v"</code>. Una llave de despliegue solo de lectura, registrada en un único repositorio, convierte un robo en el servidor en «pueden leer este repositorio» en lugar de «pueden actuar como yo».</p>',
      'error' => '<p>Usar la llave personal, con acceso a todo, en un servidor de producción que solo necesita descargar código. Si ese servidor se compromete, la llave abre mucho más de lo que ese servidor necesitaba.</p>',
      'aprendiste' => 'Git sobre SSH hereda huellas, llaves, agente y config, y sus fallos de autenticación se diagnostican como SSH.',
  ]) ?>

  <?= ssh_cierre('Túneles, ProxyJump y Git',
      [
          'Un túnel transporta una conexión concreta dentro de una sesión SSH autorizada; no crea permisos nuevos.',
          '<code>-L</code> abre el puerto en tu equipo, <code>-R</code> en el servidor y <code>-D</code> abre un proxy SOCKS en tu equipo.',
          'Por defecto los puertos reenviados escuchan solo en loopback.',
          'ProxyJump entra por un bastión sin sacar tus llaves del equipo y verificando la huella de cada servidor.',
          'Git usa <code>ssh</code> por debajo: config, llaves y <code>ssh -v</code> valen igual.',
      ],
      [
          'ssh -f -N -L 8080:127.0.0.1:8000 srv',
          'ssh -f -N -R 9000:127.0.0.1:9000 srv',
          'ssh -f -N -D 1080 bastion',
          'ssh -J bastion alumno@10.10.0.40',
          'ProxyJump bastion',
          'git clone srv:repos/proyecto.git',
          'GIT_SSH_COMMAND="ssh -v" git ls-remote origin',
          'ssh -T git@proveedor.ejemplo',
      ],
      [
          'La pregunta que separa los túneles: ¿en qué máquina escucha el puerto?',
          'El destino de <code>-L</code> se interpreta desde el servidor SSH.',
          'El servidor también decide: <code>AllowTcpForwarding</code>, <code>GatewayPorts</code>, <code>PermitOpen</code>, <code>PermitListen</code>.',
          'Prefiere ProxyJump al reenvío de agente para saltar entre servidores.',
      ],
      '<p>Dejar túneles abiertos «por si acaso» o usarlos para llegar a servicios que la
      política no permite usar desde fuera. Un túnel es una herramienta puntual de
      administración: se abre para una tarea, se comprueba con <code>ss</code> dónde escucha y
      se cierra al terminar.</p>',
      [
          [
              'q' => 'Ejecutas ssh -L 8080:127.0.0.1:5432 srv. ¿Dónde está la base de datos a la que llegas?',
              'opts' => ['A' => 'En el puerto 5432 de tu equipo', 'B' => 'En el puerto 5432 del loopback de srv', 'C' => 'En el puerto 8080 de srv', 'D' => 'En cualquier equipo de la red'],
              'ok' => 'B',
              'why' => 'Con <code>-L</code>, el tercer y cuarto campo los interpreta el servidor SSH: <code>127.0.0.1:5432</code> es el loopback de <code>srv</code>. El 8080 es el puerto que se abre en tu equipo.',
          ],
          [
              'q' => '¿Qué opción abre un proxy SOCKS en tu equipo?',
              'opts' => ['A' => '-L', 'B' => '-R', 'C' => '-D', 'D' => '-J'],
              'ok' => 'C',
              'why' => '<code>-D [bind_address:]port</code> abre un reenvío dinámico: cada aplicación que use el proxy elige su destino. <code>-J</code> es para saltar por un bastión, no un proxy de aplicaciones.',
          ],
          [
              'q' => 'Con ssh -J bastion interno, ¿dónde se usan tus llaves privadas?',
              'opts' => ['A' => 'Se copian al bastión', 'B' => 'Solo en tu equipo', 'C' => 'En el interno', 'D' => 'En el bastión y en el interno'],
              'ok' => 'B',
              'why' => 'ProxyJump solo pide al bastión un reenvío TCP; la autenticación con ambos servidores la hace tu cliente. Las llaves no salen de tu equipo, a diferencia de lo que ocurre al reenviar el agente.',
          ],
          [
              'q' => 'git push responde Permission denied (publickey). ¿Por dónde empiezas?',
              'opts' => ['A' => 'Revisando las ramas', 'B' => 'Con GIT_SSH_COMMAND="ssh -v" o ssh -vT para ver qué llave se ofrece', 'C' => 'Borrando el repositorio local', 'D' => 'Cambiando la contraseña de Git'],
              'ok' => 'B',
              'why' => 'El mensaje lo emite SSH durante la autenticación, antes de que Git intercambie nada. Hay que ver qué llave se ofreció y qué respondió el servidor.',
          ],
      ]) ?>
</section>

<?= ssh_parte('08', 'Despliegues con SSH',
    'De subir a mano a un script con backup, ensayo y verificación.',
    'avanzado') ?>

<!-- ============================ NIVELES ============================ -->
<section id="deploy-niveles">
  <h2>Seis niveles de despliegue</h2>
  <p class="tut-sub">No hay que llegar al último: hay que saber en cuál estás y qué te falta.</p>

  <p><strong>Desplegar</strong> es llevar una versión de tu proyecto desde tu equipo hasta el
  servidor donde la gente la usa. Todo lo que has aprendido hasta ahora —conexión, llaves,
  <code>~/.ssh/config</code>, <code>scp</code>, <code>sftp</code>, <code>rsync</code>— confluye
  aquí.</p>

  <p>La explicación sencilla: <strong>cuanto más alto el nivel, menos depende el resultado de
  que ese día estés atento</strong>. La explicación técnica: cada nivel añade una garantía
  —cifrado, repetibilidad, transferencia incremental, historial, verificación— que el anterior
  no tenía.</p>

  <?= shot('ssh/59-deploy-niveles.svg',
      'Escalera de seis niveles de despliegue: subir a mano, SFTP, SCP, rsync, Git sobre SSH y '
      . 'script de despliegue, cada uno con lo que hace y su principal limitación o ventaja.',
      '<b>Dónde mirar:</b> la columna de la derecha. Cada salto de nivel resuelve el problema '
      . 'concreto del anterior; el salto grande está entre el 3 y el 4.') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Qué aporta cada nivel de despliegue</caption>
      <thead><tr><th scope="col">Nivel</th><th scope="col">Qué gana</th><th scope="col">Qué le falta</th><th scope="col">Basta cuando…</th></tr></thead>
      <tbody>
        <tr><td class="f">1 · A mano</td><td class="d">Nada que aprender</td><td class="d">No sabes qué cambió ni cómo volver</td><td class="d">Nunca en algo que importe</td></tr>
        <tr><td class="f">2 · SFTP</td><td class="d">Cifrado</td><td class="d">Sigue siendo manual y olvidadizo</td><td class="d">Un cambio puntual en un archivo</td></tr>
        <tr><td class="f">3 · SCP</td><td class="d">Un comando repetible</td><td class="d">Copia todo siempre, también lo que no debe</td><td class="d">Subir un archivo concreto</td></tr>
        <tr><td class="f">4 · rsync</td><td class="d">Solo lo que cambió, exclusiones, <code>--dry-run</code></td><td class="d">Backup y verificación dependen de ti</td><td class="d">Web en hosting compartido</td></tr>
        <tr><td class="f">5 · Git sobre SSH</td><td class="d">Historial y vuelta atrás a una versión exacta</td><td class="d">El servidor necesita Git y acceso al repositorio</td><td class="d">Servidor propio con Git</td></tr>
        <tr><td class="f">6 · Script</td><td class="d">Backup + subida + verificación, siempre igual</td><td class="d">Hay que mantener el script</td><td class="d">Despliegas a menudo o varias personas</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('La analogía de la mudanza',
      '<p>Subir a mano es llevar las cajas en brazos sin lista. rsync es un camión que solo carga
      lo que no está ya en la casa nueva y te enseña la lista antes de salir. El script es la
      empresa de mudanzas: hace foto del estado anterior, carga, descarga y comprueba que todo
      llegó. Los tres mueven cajas; solo uno te deja volver atrás si algo se rompe.</p>', 'info') ?>

  <?= pitfall('<p>Pensar que «profesional» significa «el nivel 6 o nada». En una cuenta de
      hosting compartido, <strong>rsync con exclusiones, <code>--dry-run</code> y un backup
      previo</strong> ya es un despliegue serio. Lo que no es serio es arrastrar carpetas en el
      administrador de archivos y confiar en acordarse de lo que cambió.</p>') ?>
</section>

<!-- ============================ RSYNC ============================== -->
<section id="deploy-rsync">
  <h2>Deploy con rsync</h2>
  <p class="tut-sub">El nivel 4: el que usarás casi siempre en un hosting.</p>

  <p>La idea es sincronizar la carpeta del proyecto con la carpeta que sirve la web, subiendo
  solo las diferencias y dejando fuera lo que no debe estar en producción.</p>

  <?= ssh_tree(<<<'TXT'
PROYECTO LOCAL                         SERVIDOR (cuenta de hosting)
~/proyecto/                            /home/USUARIO/public_html/
├── index.php        ── rsync ──►      ├── index.php
├── assets/app.css   ── rsync ──►      └── assets/app.css
├── .env             ✗ excluido
├── .git/            ✗ excluido
└── logs/            ✗ excluido
TXT, 'el flujo') ?>

  <h3>El comando, pieza a pieza</h3>

  <?= ssh_term(<<<'TXT'
$ rsync -av --dry-run --exclude-from=.rsyncignore ./ USUARIO@servidor.ejemplo.com:public_html/
TXT, 'bash') ?>

  <?= anatomy(
      '<b>rsync</b> <i>-av</i> <u>--dry-run</u> --exclude-from=.rsyncignore <b>./</b> USUARIO@servidor.ejemplo.com:<i>public_html/</i>',
      [
          ['-a', 'Modo archivo: recursivo y conservando permisos, fechas y enlaces. Lo que quieres para una web.'],
          ['-v', 'Enumera qué archivos transfiere. Es tu lista de cambios.'],
          ['--dry-run', 'Ensayo: calcula y enseña qué haría <strong>sin tocar nada</strong>. Siempre primero.'],
          ['--exclude-from=.rsyncignore', 'Lee de un archivo los patrones que no deben viajar: <code>.env</code>, <code>.git/</code>, logs…'],
          ['./', 'El <strong>contenido</strong> de la carpeta actual. La barra final importa: sin ella se crearía <code>public_html/proyecto/</code>.'],
          ['USUARIO@servidor.ejemplo.com:public_html/', 'Destino remoto, relativo al home de la cuenta. En el laboratorio es simplemente el alias <code>srv</code>.'],
      ]) ?>

  <p>En el laboratorio, con el alias del <code>~/.ssh/config</code>, la primera pasada con
  exclusiones subió solo lo que correspondía, y la segunda —sin cambios— no envió ningún
  archivo:</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ rsync -av --exclude-from=proyecto/.rsyncignore proyecto/ srv:public_html/
sending incremental file list
index.php
assets/
assets/app.css

sent 300 bytes  received 74 bytes  748.00 bytes/sec
total size is 60  speedup is 0.16
alumno@laptop:~$ rsync -av --exclude-from=proyecto/.rsyncignore proyecto/ srv:public_html/
sending incremental file list

sent 143 bytes  received 13 bytes  312.00 bytes/sec
total size is 60  speedup is 0.38
TXT, 'salida real · laboratorio') ?>

  <?= evidence(
      '<p>La segunda ejecución muestra <code>sending incremental file list</code> seguido de una
      lista vacía.</p>',
      '<p>rsync comparó origen y destino y no encontró diferencias: no había nada que subir.</p>',
      '<p>Que la web funcione. rsync garantiza que los archivos son iguales, no que el código sea
      correcto ni que el servidor lo sirva bien. Eso es el paso de verificación.</p>') ?>

  <?= pitfall('<p>Usar <code>--delete</code> en el primer deploy «para dejarlo limpio». En un
      hosting, <code>public_html</code> suele contener cosas que no están en tu proyecto: un
      <code>.htaccess</code> del proveedor, subidas de usuarios, verificaciones de dominio.
      <code>--delete</code> las borraría. Si alguna vez lo necesitas, primero con
      <code>--dry-run</code> y leyendo cada línea <code>deleting</code>.</p>') ?>
</section>

<!-- =========================== NO SUBIR ============================ -->
<section id="no-subir">
  <h2>Lo que no se sube</h2>
  <p class="tut-sub">La lista de exclusiones es una medida de seguridad, no de orden.</p>

  <p>Una carpeta de proyecto contiene mucho más que la web: historial de Git, variables con
  contraseñas, registros de depuración, notas. Si el destino es <code>public_html</code>, todo
  lo que subas <strong>puede acabar descargable desde internet</strong>.</p>

  <h3>La evidencia: un ensayo sin exclusiones</h3>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ rsync -av --dry-run proyecto/ srv:public_html/
sending incremental file list
.env
.rsyncignore
deploy.sh
index.php
notas.txt
.git/
.git/HEAD
assets/
assets/app.css
logs/
logs/dev.log

sent 374 bytes  received 52 bytes  852.00 bytes/sec
total size is 1,032  speedup is 2.42 (DRY RUN)
TXT, 'salida real · laboratorio') ?>

  <?= evidence(
      '<p>Sin exclusiones, el ensayo lista <code>.env</code>, <code>.git/HEAD</code>,
      <code>logs/dev.log</code>, <code>notas.txt</code> y el propio <code>deploy.sh</code>.</p>',
      '<p>Un deploy real con ese comando habría publicado el archivo de variables, parte del
      repositorio y los registros de desarrollo dentro de la carpeta web.</p>',
      '<p>Que ya estén expuestos: era <code>--dry-run</code> y no se transfirió nada. Tampoco que
      el servidor los sirviera necesariamente —depende de su configuración—; justamente por eso
      no se confía en ella y se excluyen en origen.</p>') ?>

  <h3>La lista de exclusiones del laboratorio</h3>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ cat proyecto/.rsyncignore
.git/
.env
logs/
notas.txt
.rsyncignore
deploy.sh
TXT, 'salida real · laboratorio') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Archivos que no deben desplegarse y por qué</caption>
      <thead><tr><th scope="col">Qué</th><th scope="col">Ejemplo</th><th scope="col">Por qué no</th></tr></thead>
      <tbody>
        <tr><td class="f">.git/</td><td class="d">historial completo</td><td class="d">Permite reconstruir todo el código, incluidos secretos borrados hace meses.</td></tr>
        <tr><td class="f">.env</td><td class="d">DB_PASS=…</td><td class="d">Credenciales. En producción se crean aparte, nunca se copian desde tu equipo.</td></tr>
        <tr><td class="f">logs/</td><td class="d">dev.log</td><td class="d">Rutas, errores y a veces datos personales de pruebas.</td></tr>
        <tr><td class="f">backups y *.sql</td><td class="d">copia.sql, web.zip</td><td class="d">Una base de datos entera descargable.</td></tr>
        <tr><td class="f">temporales</td><td class="d">*.swp, .DS_Store, cache/</td><td class="d">Ruido y, en editores, fragmentos de archivos.</td></tr>
        <tr><td class="f">llaves</td><td class="d">id_ed25519, *.pem, *.key</td><td class="d">Una llave privada publicada es una llave comprometida.</td></tr>
        <tr><td class="f">desarrollo</td><td class="d">notas.txt, deploy.sh, tests/</td><td class="d">No aportan a la web y describen tu infraestructura.</td></tr>
      </tbody>
    </table>
  </div>

  <?= pitfall('<p>Confiar en que un <code>.htaccess</code> «protege» <code>.env</code> o
      <code>.git</code> dentro de <code>public_html</code>. Puede hacerlo, hasta que alguien
      cambia de servidor web, de proveedor o de configuración. Lo que no está en la carpeta
      pública no se puede servir por error.</p>') ?>
</section>

<!-- ============================ BACKUP ============================= -->
<section id="backup">
  <h2>Backup antes de desplegar</h2>
  <p class="tut-sub">Sin una foto de lo que funcionaba, un despliegue fallido no tiene vuelta atrás.</p>

  <p>rsync sobrescribe. Si subes un <code>index.php</code> roto, el bueno desaparece. El backup
  previo es lo que convierte un error en un susto de dos minutos.</p>

  <?= shot('ssh/60-deploy-flujo.svg',
      'Cuatro pasos en línea: producción actual, backup con fecha, despliegue con rsync y '
      . 'verificación; una flecha de retorno desde la verificación al backup indica restaurar si falla.',
      '<b>Dónde mirar:</b> la flecha roja discontinua. Solo existe si el segundo paso se hizo; '
      . 'y solo sabes que tienes que usarla si hiciste el cuarto.') ?>

  <h3>Un backup con fecha, hecho en el servidor</h3>

  <?= ssh_term(<<<'TXT'
$ ssh srv "tar -czf backups/public_html-$(date +%Y%m%d-%H%M%S).tar.gz -C ~ public_html"
TXT, 'bash') ?>

  <?= anatomy(
      'ssh srv "<b>tar -czf</b> <i>backups/public_html-FECHA.tar.gz</i> <u>-C ~</u> public_html"',
      [
          ['tar -czf', 'Crea (<code>c</code>) un archivo comprimido con gzip (<code>z</code>) con el nombre indicado (<code>f</code>).'],
          ['backups/…-FECHA.tar.gz', 'Fuera de <code>public_html</code>: el backup no debe poder descargarse desde la web.'],
          ['-C ~', 'Se sitúa en el home antes de empaquetar, para que dentro del archivo la ruta sea <code>public_html/…</code> y no <code>/home/…</code>.'],
          ['$(date …)', 'Ojo a las comillas dobles: aquí la fecha la calcula <strong>tu equipo</strong> antes de enviar el comando. Es intencionado; el sello coincide con el de tu terminal.'],
      ]) ?>

  <h3>Restaurar: primero mirar, después sustituir</h3>

  <p>Restaurar no es descomprimir encima a ciegas. El orden prudente es:</p>

  <?= steps([
      '<strong>Listar</strong> qué contiene el backup: <code>tar -tzf backups/public_html-FECHA.tar.gz</code>.',
      '<strong>Extraer en un directorio de prueba</strong>, no encima de producción: <code>mkdir -p ~/restaurar && tar -xzf backups/public_html-FECHA.tar.gz -C ~/restaurar</code>.',
      '<strong>Comprobar</strong> que es la versión buena (abrir el archivo que falla, comparar).',
      '<strong>Sustituir</strong> solo lo necesario —a menudo, un archivo— con <code>cp</code> o con rsync desde <code>~/restaurar/public_html/</code> hacia <code>public_html/</code>, primero con <code>--dry-run</code>.',
  ]) ?>

  <?= pitfall('<p>Guardar los backups dentro de <code>public_html</code> «para tenerlos a mano».
      Un <code>public_html.tar.gz</code> accesible desde el navegador es el código completo,
      configuración incluida, a un clic de cualquiera que adivine el nombre.</p>') ?>
</section>

<!-- ============================ ATÓMICO ============================ -->
<section id="atomico">
  <h2>Deploy atómico</h2>
  <p class="tut-sub">Que el servidor nunca vea una versión a medio copiar.</p>

  <p>Durante un rsync, hay unos segundos en los que <code>public_html</code> contiene archivos
  nuevos y viejos mezclados. En una web pequeña nadie lo nota. En una aplicación con muchas
  visitas, alguien puede recibir un <code>index.php</code> nuevo que incluye un archivo que aún no
  ha llegado.</p>

  <p>La solución clásica: <strong>cada versión en su carpeta</strong> y un enlace simbólico
  <code>current</code> que apunta a la activa. El servidor web sirve <code>current</code>.
  Publicar es mover el enlace; volver atrás, moverlo otra vez.</p>

  <?= shot('ssh/62-releases.svg',
      'Directorio app con releases que contiene dos versiones fechadas y un enlace current que '
      . 'apunta a la más reciente; a la derecha, los comandos para publicar y para volver atrás.',
      '<b>Dónde mirar:</b> la línea <code>current →</code>. Todo el despliegue se reduce a '
      . 'cambiar a dónde apunta esa flecha.') ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh srv 'mkdir -p app/releases/20260914-1000 app/releases/20260914-1200 && ln -sfn releases/20260914-1000 app/current && ls -l app'
total 4
lrwxrwxrwx 1 alumno alumno   22 Sep 14 18:42 current -> releases/20260914-1000
drwxr-sr-x 4 alumno alumno 4096 Sep 14 18:42 releases
alumno@laptop:~$ ssh srv 'ln -sfn releases/20260914-1200 app/current && ls -l app && readlink app/current'
total 4
lrwxrwxrwx 1 alumno alumno   22 Sep 14 18:42 current -> releases/20260914-1200
drwxr-sr-x 4 alumno alumno 4096 Sep 14 18:42 releases
releases/20260914-1200
TXT, 'salida real · laboratorio') ?>

  <?= anatomy(
      '<b>ln</b> <i>-sfn</i> releases/20260914-1200 <u>app/current</u>',
      [
          ['-s', 'Enlace simbólico: <code>current</code> no contiene archivos, apunta a una carpeta.'],
          ['-f', 'Si <code>current</code> ya existe, lo sustituye.'],
          ['-n', 'Trata el <code>current</code> existente como el enlace en sí, sin entrar en la carpeta a la que apunta. Sin él, se crearía un enlace <em>dentro</em> de la release anterior.'],
          ['releases/…', 'Ruta relativa a <code>app/</code>: el enlace sigue funcionando si mueves <code>app</code> entero.'],
      ],
      'Cambiar la versión activa') ?>

  <p>Por qué se considera atómico <em>en la práctica</em>: la carpeta nueva se sube completa
  antes; el único cambio visible es el enlace, que pasa de una versión entera a otra en una
  operación muy breve. Nadie ve la mitad de una copia.</p>

  <?= note('Cuándo no merece la pena',
      '<p>En un hosting compartido sencillo, este esquema obliga a cambiar la raíz del dominio
      para que apunte a <code>app/current</code>, algo que no todos los paneles permiten. Si tu
      web es pequeña, <strong>rsync + backup + verificación</strong> es suficiente. Entiende la
      idea; aplícala cuando el problema exista.</p>
      <p>Las releases viejas se acumulan. Límpialas listando primero
      (<code>ls -1 app/releases</code>) y borrando por nombre las que ya no necesitas, nunca con un
      <code>rm -r</code> sobre un patrón que no has comprobado, y jamás la que apunta
      <code>current</code>.</p>', 'info') ?>

  <?= pitfall('<p>Olvidar <code>-n</code>. Con <code>ln -sf releases/nueva app/current</code> y un
      <code>current</code> que ya apunta a un directorio, el enlace nuevo se crea dentro de la
      release antigua y la web sigue sirviendo la versión anterior. Comprueba siempre con
      <code>readlink</code>, como en la salida de arriba.</p>') ?>
</section>

<!-- ========================= AUTOMATIZAR =========================== -->
<section id="automatizar">
  <h2>Script de despliegue</h2>
  <p class="tut-sub">El nivel 6: los mismos pasos, en el mismo orden, cada vez.</p>

  <p>Un script no es más listo que tú: es más constante. No se olvida del backup un viernes a
  última hora ni sube <code>.env</code> porque tenía prisa. Este es el script real que se ejecutó
  en el laboratorio:</p>

  <?= ssh_tree(<<<'TXT'
#!/usr/bin/env bash
# deploy.sh — publica el proyecto en el servidor de laboratorio.
# Uso:  ./deploy.sh --dry-run   (enseña qué haría, no toca nada)
#       ./deploy.sh             (backup + subida + verificación)
set -euo pipefail

DESTINO="srv"                 # alias de ~/.ssh/config: nada de contraseñas aquí
RUTA="public_html"
SELLO="$(date +%Y%m%d-%H%M%S)"

if [[ "${1:-}" == "--dry-run" ]]; then
    rsync -av --dry-run --exclude-from=.rsyncignore ./ "$DESTINO:$RUTA/"
    exit 0
fi

echo "==> 1/3 Backup de lo que hay en producción"
ssh "$DESTINO" "tar -czf backups/public_html-$SELLO.tar.gz -C ~ $RUTA"

echo "==> 2/3 Subida"
rsync -av --exclude-from=.rsyncignore ./ "$DESTINO:$RUTA/"

echo "==> 3/3 Verificación"
ssh "$DESTINO" "test -f $RUTA/index.php && ls -l $RUTA/index.php backups/public_html-$SELLO.tar.gz"
echo "Deploy $SELLO terminado."
TXT, 'deploy.sh · laboratorio') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Qué hace cada parte del script</caption>
      <thead><tr><th scope="col">Línea</th><th scope="col">Qué hace</th><th scope="col">Por qué importa</th></tr></thead>
      <tbody>
        <tr><td class="f">set -euo pipefail</td><td class="d">Detiene el script al primer error, variable sin definir o fallo en una tubería.</td><td class="d">Si el backup falla, <strong>no se sube nada</strong>. Sin esta línea seguiría adelante.</td></tr>
        <tr><td class="f">DESTINO="srv"</td><td class="d">Usa el alias del <code>~/.ssh/config</code>.</td><td class="d">Host, usuario y llave viven en la configuración, no en el script.</td></tr>
        <tr><td class="f">SELLO=…date…</td><td class="d">Calcula la fecha una sola vez.</td><td class="d">El backup y la verificación hablan del mismo archivo.</td></tr>
        <tr><td class="f">--dry-run</td><td class="d">Rama de ensayo que termina con <code>exit 0</code>.</td><td class="d">El mismo comando que después se ejecutará de verdad.</td></tr>
        <tr><td class="f">1/3 · tar</td><td class="d">Backup en el servidor, fuera de la web.</td><td class="d">La vuelta atrás existe antes de tocar nada.</td></tr>
        <tr><td class="f">2/3 · rsync</td><td class="d">Subida incremental con exclusiones.</td><td class="d">Solo cambios, nunca secretos.</td></tr>
        <tr><td class="f">3/3 · test -f</td><td class="d">Comprueba que el archivo publicado y el backup existen.</td><td class="d">Si falla, el script termina con error y lo ves.</td></tr>
      </tbody>
    </table>
  </div>

  <h3>La ejecución real: ensayo y despliegue</h3>

  <?= shot('ssh/61-deploy-real.svg',
      'Salida real del script: primero el modo --dry-run lista index.php como cambio sin tocar '
      . 'nada; después el despliegue real en tres pasos con backup fechado, subida con rsync y '
      . 'verificación con ls del archivo publicado y del backup.',
      '<b>Qué estás viendo:</b> el script ejecutado en el laboratorio tras cambiar '
      . '<code>index.php</code>. <b>Dónde mirar:</b> la lista del ensayo y la de la subida '
      . 'real son la misma; eso es exactamente lo que se busca.',
      'real') ?>

  <?= callouts([
      ['--dry-run', 'El ensayo enumera <code>./</code> e <code>index.php</code> y termina en <code>(DRY RUN)</code>: no se ha transferido nada.'],
      ['1/3 Backup', 'Empaqueta <code>public_html</code> tal y como estaba antes del cambio.'],
      ['2/3 Subida', 'rsync envía solo <code>index.php</code>, el único archivo modificado.'],
      ['3/3 Verificación', '<code>ls -l</code> muestra el archivo publicado y el backup recién creado, con su tamaño y hora.'],
      ['terminado', 'La última línea solo se imprime si todos los pasos anteriores terminaron bien, gracias a <code>set -e</code>.'],
  ]) ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~/proyecto$ echo '<?php echo "Hola v3";' > index.php
alumno@laptop:~/proyecto$ ./deploy.sh --dry-run
sending incremental file list
./
index.php

sent 157 bytes  received 23 bytes  360.00 bytes/sec
total size is 60  speedup is 0.33 (DRY RUN)
alumno@laptop:~/proyecto$ ./deploy.sh
==> 1/3 Backup de lo que hay en producción
==> 2/3 Subida
sending incremental file list
./
index.php

sent 219 bytes  received 45 bytes  528.00 bytes/sec
total size is 60  speedup is 0.23
==> 3/3 Verificación
-rw-r--r-- 1 alumno alumno 286 Sep 14 18:57 backups/public_html-20260914-185720.tar.gz
-rw-r--r-- 1 alumno alumno  22 Sep 14 18:57 public_html/index.php
Deploy 20260914-185720 terminado.
TXT, 'salida real · laboratorio') ?>

  <?= evidence(
      '<p>La verificación lista <code>public_html/index.php</code> con fecha 18:57 y el backup
      <code>public_html-20260914-185720.tar.gz</code>.</p>',
      '<p>El archivo nuevo está en su sitio y existe una copia de lo que había antes.</p>',
      '<p>Que la web muestre «Hola v3». <code>test -f</code> comprueba que el archivo existe, no
      que el servidor web lo interprete bien. En un proyecto real, la verificación debería
      incluir una petición a la web (por ejemplo, con <code>curl</code>) y revisar el
      resultado.</p>') ?>

  <?= pitfall('<p>Convertir el script en un monstruo con cincuenta opciones antes de haber
      desplegado dos veces con él. Empieza con los tres pasos, úsalo, y añade solo lo que un
      problema real te pida.</p>') ?>
</section>

<!-- ======================= SCRIPTS SEGUROS ========================= -->
<section id="scripts-seguros">
  <h2>SSH en scripts</h2>
  <p class="tut-sub">Automatizar no puede significar dejar la puerta abierta.</p>

  <p>Un script se ejecuta sin nadie delante: a veces desde tu equipo, a veces desde un servidor
  de integración continua. Lo que sea que use para autenticarse queda guardado en algún sitio.
  La pregunta es <em>qué</em> y <em>con qué alcance</em>.</p>

  <?= compare(
      ['Inseguro', 'lo que no se hace',
       '<ul>
          <li>Contraseñas escritas en el script o en variables.</li>
          <li>Herramientas que las inyectan en el prompt de ssh.</li>
          <li>La llave personal del administrador, válida para todo.</li>
          <li>Entrar como <code>root</code> para desplegar.</li>
          <li>Un script que se queda colgado esperando que alguien escriba <code>yes</code>.</li>
        </ul>'],
      ['Razonable', 'lo que sí',
       '<ul>
          <li>Una <strong>llave dedicada</strong> solo para desplegar.</li>
          <li>Un <strong>usuario dedicado</strong> con permisos sobre la web y nada más.</li>
          <li><code>IdentitiesOnly yes</code> e <code>IdentityFile</code> explícitos.</li>
          <li><code>BatchMode yes</code>: si algo pide interacción, falla.</li>
          <li>Restricciones en la línea de <code>authorized_keys</code>.</li>
        </ul>'],
      'Si esa llave se filtra, ¿qué puede hacer quien la tenga? La respuesta debe ser «desplegar
       en esa carpeta», no «administrar el servidor».') ?>

  <h3>Llave y usuario dedicados</h3>

  <p>En el laboratorio existe un usuario <code>deploy</code> en el servidor cuyo
  <code>authorized_keys</code> solo contiene la llave <code>llave_deploy</code>, generada para
  ese uso. Así se conecta de forma inequívoca:</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh -o IdentitiesOnly=yes -i ~/.ssh/llave_deploy deploy@servidor hostname
servidor
TXT, 'salida real · laboratorio') ?>

  <p>Y en el <code>~/.ssh/config</code> de la máquina que despliega, con las opciones que un
  script necesita:</p>

  <?= ssh_tree(<<<'TXT'
Host deploy-web
    HostName servidor.ejemplo.com
    User deploy
    IdentityFile ~/.ssh/llave_deploy
    IdentitiesOnly yes
    BatchMode yes
TXT, 'ejemplo ilustrativo · ~/.ssh/config') ?>

  <?= anatomy(
      '<b>BatchMode</b> <i>yes</i>',
      [
          ['BatchMode yes', 'Desactiva las preguntas interactivas: petición de contraseña y confirmación de host key. Si la huella del servidor no está en <code>known_hosts</code> o la llave no sirve, ssh <strong>falla</strong> en lugar de quedarse esperando.'],
          ['por qué en scripts', 'Un proceso sin terminal esperando un <code>yes</code> que nunca llegará es un deploy «colgado» sin mensaje de error. Falla rápido y claro es mejor.'],
      ],
      'Opción de ssh_config') ?>

  <h3>Restringir lo que puede hacer una llave</h3>

  <p>Una línea de <code>authorized_keys</code> puede llevar opciones delante de la llave. Son un
  control del <strong>servidor</strong>, no del cliente: aunque la llave se filtre, las
  restricciones siguen aplicándose.</p>

  <?= ssh_tree(<<<'TXT'
restrict,from="192.0.2.10" ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA… deploy@ci
TXT, 'ejemplo ilustrativo · authorized_keys') ?>

  <?= anatomy(
      '<b>restrict</b>,<i>from="192.0.2.10"</i> ssh-ed25519 AAAA… deploy@ci',
      [
          ['restrict', 'Desactiva de golpe reenvío de puertos, de agente y X11 y la asignación de terminal. Se reactiva solo lo que haga falta.'],
          ['from="…"', 'La llave solo se acepta si la conexión viene de esas direcciones (aquí, una de documentación).'],
          ['command="…"', 'Opción adicional posible: fuerza a que la llave solo pueda ejecutar un comando concreto. Útil para tareas muy acotadas; con rsync requiere un envoltorio específico, así que no se improvisa.'],
      ],
      'Opciones de authorized_keys (man sshd)') ?>

  <?= note('Agentes, CI y revocación',
      '<ul>
        <li><strong>En integración continua</strong>, guarda la llave privada en el almacén de
        secretos de la plataforma, nunca en el repositorio, y cárgala solo en el paso de
        despliegue.</li>
        <li><strong>No reenvíes tu agente</strong> personal a servidores de CI ni de despliegue:
        quien controle ese servidor podría usarlo mientras dure la sesión.</li>
        <li><strong>Permisos 600</strong> en la llave, también en la máquina que despliega.</li>
        <li><strong>Revocar</strong> es borrar su línea de <code>authorized_keys</code>. Rotar es
        generar una llave nueva, instalarla, probarla y después borrar la vieja.</li>
      </ul>', 'info') ?>

  <?= evidence(
      '<p>Un script de despliegue usa una llave sin passphrase guardada en el servidor de
      CI.</p>',
      '<p>Es habitual y puede ser aceptable si la llave es dedicada, el usuario solo tiene
      permisos sobre la web y la línea en <code>authorized_keys</code> está restringida.</p>',
      '<p>Que sea seguro por defecto. Sin passphrase, quien obtenga el archivo obtiene el acceso;
      toda la protección está en lo poco que esa llave permite hacer y en lo rápido que se
      puede revocar.</p>') ?>

  <?= pitfall('<p>Resolver el «el script se queda esperando» añadiendo
      <code>StrictHostKeyChecking no</code>. Eso no arregla nada: desactiva la comprobación de
      identidad del servidor, justo lo que protege de desplegar tu web en la máquina de otro.
      Lo correcto es añadir la huella verificada al <code>known_hosts</code> de la máquina que
      despliega.</p>') ?>
</section>

<!-- =========================== PRÁCTICA ============================ -->
<section id="practica-deploy">
  <h2>Práctica: despliegue</h2>
  <p class="tut-sub">Un ejercicio completo que junta rsync, backup, ensayo y verificación.</p>

  <?= ssh_ejercicio([
      'num'       => '18',
      'titulo'    => 'Un despliegue con backup, ensayo y verificación',
      'nivel'     => 'avanzado',
      'objetivo'  => 'Objetivo: publicar un cambio sin subir secretos y con vuelta atrás garantizada.',
      'mision'    => '<p>Publicar una versión nueva de <code>index.php</code> en el servidor de tu
                      laboratorio con un script que haga backup, ensaye, suba y verifique.</p>',
      'escenario' => '<p>Tu proyecto tiene <code>index.php</code>, <code>assets/</code>, un
                      <code>.env</code> con una contraseña de pruebas, una carpeta
                      <code>.git/</code> y <code>logs/</code>. El destino es
                      <code>public_html</code> de tu VM, contenedor o cuenta de hosting
                      propia.</p>',
      'preparacion' => '<p>Acceso por llave funcionando y un alias en <code>~/.ssh/config</code>
                      (por ejemplo <code>srv</code>). Una carpeta <code>backups/</code> en el home
                      remoto, fuera de <code>public_html</code>.</p>',
      'pasos'     => [
          '<p>Ejecuta un ensayo <strong>sin exclusiones</strong> y anota qué archivos se subirían:</p>'
          . ssh_term(<<<'TXT'
$ rsync -av --dry-run proyecto/ srv:public_html/
TXT, 'bash'),
          '<p>Crea <code>.rsyncignore</code> con lo que no debe viajar y repite el ensayo con
          <code>--exclude-from=.rsyncignore</code> hasta que la lista solo contenga la web.</p>',
          '<p>Escribe (o adapta) <code>deploy.sh</code> con los tres pasos: backup con fecha,
          rsync con exclusiones y verificación. Dale permisos de ejecución.</p>',
          '<p>Cambia <code>index.php</code>, ejecuta <code>./deploy.sh --dry-run</code> y después
          <code>./deploy.sh</code>.</p>',
      ],
      'observar'  => '<p>Que la lista del ensayo y la de la subida real coincidan; que el backup
                      aparezca en la verificación con el mismo sello que el despliegue; que
                      <code>.env</code> y <code>.git/</code> no aparezcan en ninguna lista.</p>',
      'visual'    => shot('ssh/61-deploy-real.svg',
          'Salida real de deploy.sh en modo ensayo y en despliegue real con backup, subida y verificación.',
          '<b>Referencia:</b> así debe verse tu ejecución, con tus nombres de archivo y tus fechas.',
          'real'),
      'preguntas' => [
          '¿Qué archivos habría publicado el primer ensayo sin exclusiones?',
          'Si el paso de backup falla, ¿se ejecuta la subida? ¿Qué línea del script lo decide?',
          '¿Qué demuestra la verificación y qué no demuestra?',
          '¿Cómo recuperarías el <code>index.php</code> anterior sin sobrescribir toda la web?',
      ],
      'pistas'    => [
          '<p>Piensa en el orden: una copia de seguridad solo sirve si existe <em>antes</em> de
          cambiar nada, y un fallo a mitad debe detener todo lo que viene después.</p>',
          '<p>Mira la primera línea útil del script y la salida del ensayo sin exclusiones:
          ahí están la respuesta a la segunda y a la primera pregunta.</p>',
          '<p><code>set -euo pipefail</code>, <code>tar -tzf</code> para listar el backup y
          <code>tar -xzf … -C ~/restaurar</code> para extraerlo aparte.</p>',
      ],
      'solucion'  => 'Sin exclusiones se habrían subido .env, .git/, logs/ y archivos de desarrollo; con set -e un backup fallido detiene la subida.',
      'porque'    => '<p>El ensayo sin exclusiones del laboratorio listó <code>.env</code>,
                      <code>.git/HEAD</code>, <code>logs/dev.log</code>, <code>notas.txt</code> y
                      <code>deploy.sh</code>: esa es la evidencia de por qué existe
                      <code>.rsyncignore</code>. <code>set -euo pipefail</code> hace que cualquier
                      comando con código de salida distinto de cero termine el script, así que un
                      <code>tar</code> fallido impide llegar al rsync. La verificación demuestra
                      que el archivo publicado y el backup existen; no demuestra que la web
                      funcione. Para recuperar un solo archivo se lista el backup, se extrae en
                      <code>~/restaurar</code> y se copia únicamente ese archivo.</p>',
      'error'     => '<p>Dar el despliegue por bueno porque el script dijo «terminado» sin abrir
                      la web, o restaurar descomprimiendo el backup directamente encima de
                      <code>public_html</code> sin haber mirado qué contenía.</p>',
      'aprendiste'=> 'un despliegue serio es ensayo, backup, subida y verificación, en ese orden y con lo que no debe publicarse excluido en origen.',
  ]) ?>

  <?= ssh_cierre('Despliegues con SSH', [
      'Cada nivel de despliegue añade una garantía; en hosting compartido, rsync con backup y ensayo ya es un despliegue serio.',
      'La lista de exclusiones es seguridad: <code>.env</code>, <code>.git</code>, logs, backups y llaves no se suben nunca.',
      'El backup se hace <strong>antes</strong>, fuera de <code>public_html</code>, y se restaura primero en un directorio aparte.',
      'Un deploy atómico cambia un enlace <code>current</code> entre releases completas; útil cuando el problema existe.',
      'Los scripts usan llaves y usuarios dedicados, <code>BatchMode</code> e <code>IdentitiesOnly</code>, nunca contraseñas.',
  ], [
      'rsync -av --dry-run --exclude-from=.rsyncignore ./ srv:public_html/',
      'ssh srv "tar -czf backups/web-FECHA.tar.gz -C ~ public_html"',
      'tar -tzf backup.tar.gz',
      'ln -sfn releases/VERSION app/current',
      'readlink app/current',
      'ssh -o BatchMode=yes -o IdentitiesOnly=yes -i llave deploy@host',
  ], [
      'El ensayo y la subida real deben listar lo mismo.',
      '«Terminado» significa que los comandos no fallaron, no que la web funcione.',
      'Una llave de despliegue debe poder hacer poco y revocarse en un minuto.',
  ], '<p>Desplegar sin <code>--dry-run</code> y sin backup «porque es un cambio pequeño». Los
      cambios pequeños son los que se hacen con prisa, y la prisa es cuando se sube el
      <code>.env</code> o se pisa el archivo que funcionaba.</p>', [
      [
          'q' => '¿Por qué el script empieza con set -euo pipefail?',
          'opts' => ['A' => 'Para que rsync vaya más rápido', 'B' => 'Para que un fallo, como un backup que no se crea, detenga el resto del despliegue', 'C' => 'Para cifrar la conexión', 'D' => 'Para no pedir la passphrase'],
          'ok' => 'B',
          'why' => 'Sin esa línea, Bash sigue ejecutando aunque un comando falle. El despliegue subiría archivos nuevos sin tener copia de los viejos. Con <code>-e</code>, el primer error termina el script.',
      ],
      [
          'q' => 'Un ensayo sin exclusiones lista .env y .git/HEAD. ¿Qué haces?',
          'opts' => ['A' => 'Subir igualmente: el .htaccess los protege', 'B' => 'Añadirlos a la lista de exclusiones y repetir el ensayo hasta que no aparezcan', 'C' => 'Usar --delete', 'D' => 'Cambiar a scp -r'],
          'ok' => 'B',
          'why' => 'Lo que no llega a la carpeta pública no se puede servir por error. <code>scp -r</code> copiaría exactamente lo mismo y <code>--delete</code> no tiene nada que ver con qué se sube.',
      ],
      [
          'q' => '¿Qué aporta BatchMode yes en un script?',
          'opts' => ['A' => 'Desactiva la verificación de host key', 'B' => 'Hace que ssh falle en lugar de quedarse esperando una contraseña o una confirmación', 'C' => 'Permite varias conexiones a la vez', 'D' => 'Guarda la contraseña'],
          'ok' => 'B',
          'why' => 'Según <code>man ssh_config</code>, desactiva las preguntas interactivas. No acepta huellas nuevas por ti: si la huella no es conocida, la conexión falla, que es justo lo que debe pasar sin nadie delante.',
      ],
      [
          'q' => 'En releases/ con current, ¿cómo vuelves a la versión anterior?',
          'opts' => ['A' => 'Borrando la release nueva con rm -r', 'B' => 'Apuntando current a la release anterior con ln -sfn y comprobando con readlink', 'C' => 'Restaurando la base de datos', 'D' => 'Reinstalando el servidor'],
          'ok' => 'B',
          'why' => 'La release anterior sigue completa en su carpeta. Volver atrás es mover el enlace; borrar la nueva no es necesario y, si te equivocas de nombre, es irreversible.',
      ],
  ]) ?>
</section>

<?= ssh_parte('09', 'Diagnóstico y troubleshooting',
    'Leer cada error como una pista del paso en que se detuvo la conexión, y buscar la causa en los dos lados.',
    'avanzado') ?>

<!-- ============================== ÁRBOL ============================== -->
<section id="arbol">
  <h2>Árbol de diagnóstico</h2>
  <p class="tut-sub">Cinco preguntas en orden. Cada respuesta descarta una capa entera.</p>

  <p>Cuando SSH falla, la tentación es probar cosas al azar: reiniciar, borrar
  <code>known_hosts</code>, regenerar llaves. Casi siempre es tiempo perdido. Una conexión SSH
  recorre <a href="#flujo">siete pasos</a> en un orden fijo, y el mensaje de error dice
  <strong>en cuál se detuvo</strong>. Si sabes leerlo, sabes por dónde no tienes que buscar.</p>

  <?= note('La idea en una frase',
      '<p>Un error de SSH no es un «no funciona»: es una coordenada. «Could not resolve» y
      «Permission denied» están en extremos opuestos del camino, y confundirlos es buscar la
      avería en el piso equivocado del edificio.</p>', 'info') ?>

  <?= shot('ssh/63-arbol-diagnostico.svg',
      'Árbol de cinco preguntas en orden: si se resuelve el nombre, si hay ruta, si contesta '
      . 'alguien en el puerto, si el servidor es el conocido y si te acepta. Para cada una, el '
      . 'error que indica que la respuesta es no y dónde buscar.',
      '<b>Dónde mirar:</b> la columna «NO →». Localiza tu mensaje de error ahí y empieza a '
      . 'investigar en esa fila, no antes ni después.') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Mensaje de error y capa donde se detuvo</caption>
      <thead><tr><th scope="col">Mensaje</th><th scope="col">Se detuvo en</th><th scope="col">Ya sabes que…</th><th scope="col">Sección</th></tr></thead>
      <tbody>
        <tr><td class="f">Could not resolve hostname</td><td class="d">1 · nombre</td><td class="d">no salió ni un paquete hacia el servidor</td><td class="d"><a href="#resolve">resolve</a></td></tr>
        <tr><td class="f">Host is unreachable / No route to host</td><td class="d">2 · ruta</td><td class="d">el nombre se resolvió; la red no llega</td><td class="d"><a href="#timeout">timeout</a></td></tr>
        <tr><td class="f">Connection timed out</td><td class="d">2 · TCP</td><td class="d">nadie contestó: descarte silencioso o equipo inexistente</td><td class="d"><a href="#timeout">timeout</a></td></tr>
        <tr><td class="f">Connection refused</td><td class="d">2 · TCP</td><td class="d">la máquina existe y contestó que no</td><td class="d"><a href="#refused">refused</a></td></tr>
        <tr><td class="f">Host key verification failed</td><td class="d">4 · host key</td><td class="d">hay conexión SSH; el servidor no es el que recuerdas</td><td class="d"><a href="#hostkey-failed">hostkey-failed</a></td></tr>
        <tr><td class="f">Permission denied (publickey)</td><td class="d">5 · autenticación</td><td class="d">red, puerto, sshd y host key funcionan</td><td class="d"><a href="#publickey">publickey</a></td></tr>
        <tr><td class="f">Too many authentication failures</td><td class="d">5 · autenticación</td><td class="d">el servidor cortó tras demasiados intentos</td><td class="d"><a href="#too-many">too-many</a></td></tr>
      </tbody>
    </table>
  </div>

  <h3>Las herramientas del diagnóstico, por capa</h3>

  <?= ssh_term(<<<'TXT'
$ getent hosts servidor                 # 1 · ¿qué IP da el nombre?
$ ssh -G servidor | grep -E '^(hostname|port|user) '   # ¿qué va a usar ssh de verdad?
$ nc -zv servidor 22                    # 2-3 · ¿contesta alguien en ese puerto?
$ ssh -v servidor                       # 3-5 · ¿en qué etapa se detiene?
TXT, 'bash') ?>

  <?= anatomy(
      '<b>nc</b> <u>-zv</u> servidor 22',
      [
          ['nc', 'netcat: abre una conexión TCP a mano, sin hablar SSH.'],
          ['-z', 'solo comprueba si el puerto acepta la conexión; no envía datos.'],
          ['-v', 'dice qué ha pasado. Sin -v, el éxito es silencioso.'],
      ], 'Comprobar un puerto') ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ nc -zv -w 3 servidor 22
servidor (192.168.56.20:22) open
alumno@laptop:~$ nc -zv -w 3 servidor 2222
TXT, 'salida real · laboratorio') ?>

  <p>El primer comando confirma las capas 1 a 3 de golpe: el nombre se resolvió a
  <code>192.168.56.20</code> y hay alguien escuchando en el 22. El segundo no imprimió nada: la
  versión de <code>nc</code> del laboratorio (BusyBox) no anuncia el fallo, y por eso
  <code>ssh</code> sigue siendo la prueba más clara. Las variantes de <code>nc</code> cambian
  según el sistema; interpreta el silencio con cuidado.</p>

  <?= evidence(
      '<p><code>nc -zv servidor 22</code> responde <code>open</code>.</p>',
      '<p>Resolución, ruta y puerto están bien. Si SSH sigue fallando, el problema está en la
      host key o en la autenticación.</p>',
      '<p>Que lo que escucha en el 22 sea <code>sshd</code> ni que vaya a aceptarte. Un puerto
      abierto solo prueba que alguien acepta conexiones TCP.</p>') ?>

  <?= pitfall('<p>Empezar por el final: regenerar llaves o tocar <code>sshd_config</code> ante un
      <code>Could not resolve hostname</code>. Si el nombre no se resuelve, el servidor ni
      siquiera se ha enterado de que existes; nada de lo que cambies allí puede arreglarlo.</p>') ?>
</section>

<!-- ============================= REFUSED ============================= -->
<section id="refused">
  <h2>Connection refused</h2>
  <p class="tut-sub">La máquina existe, contestó, y dijo que no.</p>

  <p><strong>Explicación sencilla:</strong> llamas a una puerta y alguien grita desde dentro
  «aquí no es». No te abrieron, pero ya sabes que el edificio existe y que tu mensaje llegó.</p>

  <p><strong>Explicación técnica:</strong> el cliente envió el primer paquete TCP (SYN) y
  recibió un RST. El sistema operativo del servidor responde así cuando ningún programa escucha
  en ese puerto, o cuando un firewall está configurado para <em>rechazar</em> (REJECT) en lugar
  de descartar en silencio.</p>

  <?= shot('ssh/65-errores-conexion.svg',
      'Salida real de cuatro fallos de conexión: Connection refused en el puerto 2222, Could not '
      . 'resolve hostname con servidor.invalid, Host is unreachable con 192.168.56.99 y Operation '
      . 'timed out con 192.0.2.10.',
      '<b>Dónde mirar:</b> los cuatro mensajes empiezan igual («ssh: …») pero cada uno está en '
      . 'una capa distinta. Esta sección trata el ①; los demás, en las dos siguientes.',
      'real') ?>

  <?= callouts([
      ['Connection refused', 'Puerto 2222 del servidor: la máquina respondió al instante que nadie escucha ahí.'],
      ['Could not resolve hostname', 'El nombre no existe en DNS ni en /etc/hosts. Ver <a href="#resolve">resolve</a>.'],
      ['Host is unreachable', 'Una IP de la red del laboratorio donde no hay ningún equipo. Ver <a href="#timeout">timeout</a>.'],
      ['Operation timed out', 'Una IP de documentación que nadie contesta. Ver <a href="#timeout">timeout</a>.'],
  ]) ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh -p 2222 srv
ssh: connect to host servidor port 2222: Connection refused
TXT, 'salida real · laboratorio') ?>

  <?= anatomy(
      'ssh: connect to host <b>servidor</b> port <u>2222</u>: <i>Connection refused</i>',
      [
          ['servidor', 'El nombre se resolvió: si no, el mensaje sería otro. Capa 1 descartada.'],
          ['port 2222', 'El puerto al que se intentó llegar. Compáralo con el que esperabas.'],
          ['Connection refused', 'Respuesta activa de la máquina: nadie escucha, o un firewall rechaza.'],
      ], 'Leer el mensaje') ?>

  <h3>Causas posibles y cómo comprobar cada una</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Causas de Connection refused</caption>
      <thead><tr><th scope="col">Causa</th><th scope="col">Dónde comprobar</th><th scope="col">Qué ver</th></tr></thead>
      <tbody>
        <tr><td class="f">Puerto equivocado</td><td class="d">Tu equipo: <code>ssh -G host | grep ^port</code></td><td class="d">Un <code>Port</code> heredado de <code>~/.ssh/config</code> que no esperabas.</td></tr>
        <tr><td class="f">sshd detenido</td><td class="d">Servidor: <code>systemctl status sshd</code> (o <code>ssh</code> en Debian/Ubuntu)</td><td class="d"><code>inactive (dead)</code> o <code>failed</code>.</td></tr>
        <tr><td class="f">Escucha en otro puerto</td><td class="d">Servidor: <code>sudo ss -tlnp</code></td><td class="d">El proceso <code>sshd</code> y su puerto real.</td></tr>
        <tr><td class="f">Escucha en otra interfaz</td><td class="d">Servidor: <code>sudo ss -tlnp</code></td><td class="d"><code>127.0.0.1:22</code> no acepta conexiones desde fuera.</td></tr>
        <tr><td class="f">Firewall con REJECT</td><td class="d">Servidor o red: reglas del firewall</td><td class="d">Una regla que rechaza el puerto desde tu origen.</td></tr>
      </tbody>
    </table>
  </div>

  <?= ssh_term(<<<'TXT'
$ ssh -G srv | grep -E '^(hostname|port) '   # en tu equipo: ¿a qué puerto voy?
$ systemctl status sshd                      # en el servidor (en Debian/Ubuntu: ssh)
$ sudo ss -tlnp | grep ssh                    # en el servidor: ¿dónde escucha?
TXT, 'bash') ?>

  <?= evidence(
      '<p><code>Connection refused</code> al conectar a <code>servidor</code> en el puerto 2222.</p>',
      '<p>La máquina está viva y alcanzable. En ese puerto no hay servicio, o un firewall rechaza
      activamente.</p>',
      '<p>Que sshd esté caído. Puede estar perfectamente activo en el 22 —en el laboratorio lo
      estaba— y el error venir solo del puerto elegido. Tampoco puedes afirmar que sea un
      firewall sin mirar las reglas.</p>') ?>

  <?= pitfall('<p>Leer «refused» como «me han bloqueado por seguridad» y ponerse a revisar llaves.
      En este punto el servidor todavía no ha visto ninguna llave: la conexión TCP ni siquiera se
      estableció.</p>') ?>
</section>

<!-- ============================= TIMEOUT ============================= -->
<section id="timeout">
  <h2>Connection timed out y No route to host</h2>
  <p class="tut-sub">Refused es un «no»; timeout es el silencio. Son problemas distintos.</p>

  <?= shot('ssh/64-refused-vs-timeout.svg',
      'Comparación: con Connection refused el cliente recibe una respuesta inmediata RST; con '
      . 'Connection timed out el paquete no obtiene respuesta y el cliente se cansa de esperar.',
      '<b>Dónde mirar:</b> la flecha de vuelta. En <em>refused</em> existe; en <em>timeout</em> '
      . 'es una línea discontinua que no llega. Y el tiempo: milisegundos frente a segundos.') ?>

  <?= compare(
      ['REFUSED', 'Llegué al host pero rechazó',
       '<ul>
          <li>Respuesta inmediata.</li>
          <li>La máquina existe y contesta.</li>
          <li>Nadie escucha, o un firewall hace REJECT.</li>
          <li>Buscar en el <strong>servidor</strong>: servicio y puerto.</li>
        </ul>'],
      ['TIMEOUT', 'No obtuve respuesta suficiente',
       '<ul>
          <li>Tarda segundos o minutos.</li>
          <li>Algo descarta en silencio (DROP), la IP no existe o no hay ruta.</li>
          <li>Buscar en la <strong>red</strong>: IP, VPN, firewall intermedio.</li>
        </ul>'],
      'El tiempo que tarda el error ya es una pista: un «no» rápido viene del servidor; un
       silencio largo, casi siempre del camino.') ?>

  <h3>Los mensajes reales</h3>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh alumno@192.168.56.99
ssh: connect to host 192.168.56.99 port 22: Host is unreachable
alumno@laptop:~$ ssh -o ConnectTimeout=8 alumno@192.0.2.10
ssh: connect to host 192.0.2.10 port 22: Operation timed out
TXT, 'salida real · laboratorio') ?>

  <?= callouts([
      ['Host is unreachable', '<code>192.168.56.99</code> está en la misma red del laboratorio, pero no hay ningún equipo con esa IP: nadie contesta a la pregunta «¿quién tiene esta dirección?» y el sistema lo da por inalcanzable. En otros sistemas el mismo caso aparece como <code>No route to host</code>; el texto exacto depende del sistema y de su biblioteca C.'],
      ['Operation timed out', '<code>192.0.2.10</code> es un rango reservado para documentación: los paquetes salen y nunca vuelve nada. Con <code>ConnectTimeout=8</code> ssh se rinde a los 8 segundos en lugar de esperar el tiempo por defecto del sistema. En otros sistemas lo verás como <code>Connection timed out</code>.'],
  ]) ?>

  <p>Y el caso más útil de todo el laboratorio, porque no es un error de configuración sino de
  <strong>arquitectura</strong>: el servidor <code>interno</code> vive en una red a la que el
  laptop no tiene acceso.</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh -o ConnectTimeout=5 alumno@10.10.0.40 hostname
ssh: connect to host 10.10.0.40 port 22: Operation timed out
TXT, 'salida real · laboratorio') ?>

  <p>Desde el bastión, la misma máquina responde al instante (lo viste en
  <a href="#proxyjump">ProxyJump</a>). El servidor no está caído: <strong>no hay camino</strong>
  desde donde estás.</p>

  <?= anatomy(
      'ssh <b>-o ConnectTimeout=5</b> alumno@10.10.0.40 hostname',
      [
          ['-o ConnectTimeout=5', 'Tiempo máximo, en segundos, para establecer la conexión. Útil para no quedarse esperando en scripts y en diagnóstico. Verificado en <code>man ssh_config</code>.'],
      ], 'Acortar la espera') ?>

  <h3>Qué revisar, en orden</h3>
  <?= steps([
      '<strong>La IP.</strong> <code>ssh -G host | grep ^hostname</code>: ¿es la que crees? Un <code>HostName</code> antiguo en el config es una causa clásica.',
      '<strong>La red.</strong> ¿Estás en la red correcta, con la VPN conectada si hace falta?',
      '<strong>Otro servicio del mismo equipo.</strong> Si responde a otro puerto o a <code>ping</code> (cuando ICMP está permitido), la máquina existe y el problema es el puerto 22.',
      '<strong>El firewall.</strong> Un DROP en el servidor o en un equipo intermedio produce exactamente este silencio.',
  ]) ?>

  <?= evidence(
      '<p><code>ssh alumno@10.10.0.40</code> termina en <code>Operation timed out</code> desde el
      laptop.</p>',
      '<p>Entre el laptop y esa dirección no hay ruta, o algo descarta los paquetes en silencio.</p>',
      '<p>Que el servidor esté apagado. En el laboratorio estaba encendido y accesible desde el
      bastión. Un timeout describe lo que ve <em>tu</em> punto de observación, no el estado del
      destino.</p>') ?>

  <?= pitfall('<p>Subir el <code>ConnectTimeout</code> a 300 «por si el servidor es lento». Un
      servidor SSH sano acepta la conexión TCP en milisegundos; si no contesta en unos segundos,
      esperar más no lo arregla: solo retrasa el diagnóstico.</p>') ?>
</section>

<!-- ============================= RESOLVE ============================= -->
<section id="resolve">
  <h2>Could not resolve hostname</h2>
  <p class="tut-sub">El fallo más temprano de todos: ni un paquete ha salido hacia el servidor.</p>

  <p>Antes de conectar, <code>ssh</code> necesita traducir el nombre a una dirección IP. Si esa
  traducción falla, se detiene en el paso 1. El servidor puede estar perfecto: nunca llegó a
  saber que lo buscabas.</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh alumno@servidor.invalid
ssh: Could not resolve hostname servidor.invalid: Name does not resolve
TXT, 'salida real · laboratorio') ?>

  <?= anatomy(
      'ssh: Could not resolve hostname <b>servidor.invalid</b>: <u>Name does not resolve</u>',
      [
          ['servidor.invalid', 'El nombre exacto que se intentó resolver. Léelo letra a letra: la errata es la causa número uno. El dominio <code>.invalid</code> está reservado precisamente para que nunca resuelva.'],
          ['Name does not resolve', 'El texto del sistema de resolución. Varía según la distribución (en otras verás <code>Name or service not known</code>), pero significa lo mismo.'],
      ], 'Leer el mensaje') ?>

  <h3>Dónde puede estar el problema</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Causas de Could not resolve hostname</caption>
      <thead><tr><th scope="col">Causa</th><th scope="col">Comprobación</th></tr></thead>
      <tbody>
        <tr><td class="f">Errata en el nombre</td><td class="d">Léelo en el propio mensaje de error.</td></tr>
        <tr><td class="f">Alias que no existe en tu config</td><td class="d"><code>ssh -G alias | grep ^hostname</code>: si devuelve el alias tal cual, ssh no encontró ningún bloque <code>Host</code> y lo trata como nombre real.</td></tr>
        <tr><td class="f">DNS no responde o no conoce el nombre</td><td class="d"><code>getent hosts nombre</code> usa la misma resolución que el sistema.</td></tr>
        <tr><td class="f">Nombre interno fuera de su red</td><td class="d">¿Ese nombre solo existe en la VPN o en la red de la empresa?</td></tr>
        <tr><td class="f">Entrada local en /etc/hosts</td><td class="d">Revisa si hay una línea con ese nombre y una IP distinta u obsoleta.</td></tr>
      </tbody>
    </table>
  </div>

  <?= ssh_term(<<<'TXT'
$ getent hosts servidor.ejemplo.com
$ ssh -G mi-alias | grep -E '^hostname '
TXT, 'bash') ?>

  <?= evidence(
      '<p><code>Could not resolve hostname servidor.invalid</code>.</p>',
      '<p>El problema está en tu lado o en tu DNS: el nombre no se tradujo a ninguna IP.</p>',
      '<p>Nada sobre el servidor. Ni que exista, ni que esté caído, ni que su SSH funcione: la
      conexión no llegó a intentarse.</p>') ?>

  <?= pitfall('<p>Escribir en la terminal un alias del <code>~/.ssh/config</code> con una letra
      cambiada. <code>ssh srv</code> funciona; <code>ssh svr</code> no encuentra bloque, intenta
      resolver «svr» como nombre real y falla en DNS. El error parece de red y es de
      tecleo.</p>') ?>
</section>

<!-- ============================ PUBLICKEY ============================ -->
<section id="publickey">
  <h2>Permission denied (publickey)</h2>
  <p class="tut-sub">El error más frecuente, y a la vez una buena noticia: todo lo anterior funciona.</p>

  <p>Si ves este mensaje, la conexión recorrió cuatro de los siete pasos: se resolvió el nombre,
  hubo TCP, se negoció SSH y la host key coincidió. Se detuvo en el paso 5,
  <strong>autenticarte a ti</strong>. El texto entre paréntesis es la lista de métodos que el
  servidor sigue aceptando: <code>(publickey)</code> significa que ya solo admite llaves.</p>

  <h3>Dos caminos reales al mismo mensaje</h3>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh -o PubkeyAuthentication=no alumno@bastion
alumno@192.168.56.30: Permission denied (publickey).
TXT, 'salida real · laboratorio') ?>

  <p>El bastión solo acepta llaves (lo endureciste en <a href="#reinicio-seguro">la parte de
  seguridad</a>) y este cliente no ofreció ninguna. Mismo mensaje, causa distinta, en el caso de
  una llave privada con permisos demasiado abiertos:</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh -o IdentityAgent=none -o PasswordAuthentication=no -o KbdInteractiveAuthentication=no alumno@servidor hostname
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0644 for '/home/alumno/.ssh/id_ed25519' are too open.
It is required that your private key files are NOT accessible by others.
This private key will be ignored.
Load key "/home/alumno/.ssh/id_ed25519": bad permissions
alumno@servidor: Permission denied (publickey,password,keyboard-interactive).
TXT, 'salida real · laboratorio') ?>

  <p>Aquí el cliente <strong>descartó su propia llave</strong> antes de ofrecerla. El servidor
  nunca la vio. La lista entre paréntesis es más larga porque ese servidor todavía acepta
  contraseña, aunque en esta prueba se desactivó en el cliente.</p>

  <?= note('El mismo mensaje, muchas causas',
      '<p>«Permission denied» describe el <em>resultado</em>, no la causa. Puede ser usuario
      equivocado, llave equivocada, llave ignorada por permisos, <code>authorized_keys</code> sin
      tu llave, permisos del servidor, o una política de <code>sshd_config</code>. El
      procedimiento de abajo las recorre en orden, de lo más barato de comprobar a lo más
      caro.</p>', 'info') ?>

  <h3>Laboratorio de diagnóstico en seis pasos</h3>

  <?= steps([
      '<strong>Usuario correcto.</strong> ¿Con qué usuario estás entrando de verdad? <code>ssh -G host | grep ^user</code>. Sin <code>usuario@</code> ni <code>User</code> en el config, ssh usa tu usuario local.',
      '<strong>Llave correcta.</strong> ¿Cuál es la llave que el servidor tiene autorizada? Compara huellas: <code>ssh-keygen -lf ~/.ssh/id_ed25519.pub</code> en tu equipo frente a la línea de <code>authorized_keys</code>.',
      '<strong>IdentityFile.</strong> <code>ssh -G host | grep ^identityfile</code> muestra qué ficheros va a intentar. Una ruta con errata no da error: simplemente no se usa.',
      '<strong>ssh -v.</strong> Busca <code>Offering public key</code> (qué ofrece), <code>Server accepts key</code> (si alguna vale) y avisos como <code>bad permissions</code>.',
      '<strong>authorized_keys en el servidor.</strong> Con otra vía de acceso (consola del proveedor, otra cuenta autorizada): ¿está tu línea pública en <code>~/.ssh/authorized_keys</code> del usuario correcto?',
      '<strong>Permisos y log del servidor.</strong> <code>ls -ld ~ ~/.ssh ~/.ssh/authorized_keys</code> y el log de sshd. Aquí suele estar el porqué que el cliente no puede ver.',
  ]) ?>

  <?= ssh_term(<<<'TXT'
$ ssh -G bastion | grep -E '^(user|hostname|identityfile|identitiesonly) '
$ ssh -v bastion 2>&1 | grep -E 'Offering|Server accepts|Authentications that|bad permissions'
TXT, 'bash') ?>

  <p>El paso 6 es tan importante que tiene sección propia: <a href="#dos-lados">cliente y
  servidor a la vez</a>, con una captura real donde el cliente no sabe por qué le rechazan y el
  servidor sí lo dice.</p>

  <?= evidence(
      '<p><code>Permission denied (publickey)</code> al conectar al bastión.</p>',
      '<p>La red, el puerto, sshd y la host key funcionan. La autenticación falló, y el servidor
      solo acepta llaves.</p>',
      '<p>Que el servidor esté caído, que tu llave esté «rota» o que te hayan bloqueado. Con solo
      este mensaje no se distingue un usuario equivocado de una llave ausente o de un
      <code>~/.ssh</code> con permisos incorrectos en el servidor.</p>') ?>

  <?= pitfall('<p>Borrar <code>known_hosts</code> para arreglar un <code>Permission denied</code>.
      <code>known_hosts</code> guarda la identidad <em>del servidor</em>, que en este punto ya se
      verificó correctamente. El problema es tu identidad, no la suya.</p>') ?>
</section>

<!-- ============================ TOO MANY ============================= -->
<section id="too-many">
  <h2>Too many authentication failures</h2>
  <p class="tut-sub">Tenías la llave buena, pero llegó demasiado tarde a la cola.</p>

  <p><strong>Explicación sencilla:</strong> un portero te deja probar seis llaves. Llevas un
  llavero con ocho y la buena es la última. Antes de llegar a ella, te echa.</p>

  <p><strong>Explicación técnica:</strong> el cliente ofrece las llaves de una en una: primero
  las de sus ficheros de identidad, después las del agente. Cada llave rechazada cuenta como un
  intento fallido. El servidor corta la conexión al alcanzar <code>MaxAuthTries</code>, que por
  defecto vale 6 (<code>man sshd_config</code>).</p>

  <?= shot('ssh/66-too-many.svg',
      'Salida real: con ocho llaves cargadas en el agente, la conexión como deploy termina en Too '
      . 'many authentication failures; ssh -v muestra seis llaves ofrecidas antes del corte; con '
      . 'IdentitiesOnly y la llave concreta entra a la primera.',
      '<b>Dónde mirar:</b> cuenta las líneas «Offering public key» del ③: seis. La llave '
      . '<code>deploy@laptop</code> era la octava del agente y nunca se llegó a ofrecer.',
      'real') ?>

  <?= callouts([
      ['ssh-add -l', 'El agente tiene ocho llaves: la personal, seis de prueba y, al final, <code>deploy@laptop</code>, la única que el usuario <code>deploy</code> tiene autorizada.'],
      ['Too many authentication failures', 'El servidor corta. Fíjate en que el mensaje viene del servidor («Received disconnect from 192.168.56.20»).'],
      ['Offering public key', 'Seis ofertas, seis rechazos. Con la sexta se alcanza <code>MaxAuthTries</code>.'],
      ['IdentitiesOnly=yes', 'Ofreciendo solo la llave indicada con <code>-i</code>, entra a la primera.'],
  ]) ?>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh deploy@servidor hostname
Received disconnect from 192.168.56.20 port 22:2: Too many authentication failures
Disconnected from 192.168.56.20 port 22
alumno@laptop:~$ ssh -v deploy@servidor hostname 2>&1 | grep -E 'Offering public key|Received disconnect|Too many'
debug1: Offering public key: /home/alumno/.ssh/id_ed25519 ED25519 SHA256:naRfLqw1lzl4RNzMfQ/a0lJ2FAIuCHwbE6H7hQnqjHI agent
debug1: Offering public key: extra1 ED25519 SHA256:bRpBcn1V3jplQQstzyn4hSe38jamZysiXfhWoiAmwUE agent
debug1: Offering public key: extra2 ED25519 SHA256:pVXRnr/m1boTNrPEva43wJ3vbGLNQr1loUQMpN5cchU agent
debug1: Offering public key: extra3 ED25519 SHA256:ARWteJr7lLDF4XDT9fBQbusiOPRtH7NDm9qpUo5xAuw agent
debug1: Offering public key: extra4 ED25519 SHA256:2EFQNaqaS/u5KBA7b05B0iwDIPg7DgwOxq4HkVqB+HE agent
debug1: Offering public key: extra5 ED25519 SHA256:GtL1zZzXQgGQYl2hNBcLQUHhCsqA8YuvsNOvaxLSnG8 agent
Received disconnect from 192.168.56.20 port 22:2: Too many authentication failures
alumno@laptop:~$ ssh -o IdentitiesOnly=yes -i ~/.ssh/llave_deploy deploy@servidor hostname
servidor
TXT, 'salida real · laboratorio') ?>

  <?= anatomy(
      'ssh <b>-o IdentitiesOnly=yes</b> <u>-i ~/.ssh/llave_deploy</u> deploy@servidor hostname',
      [
          ['-o IdentitiesOnly=yes', 'Usa solo las identidades configuradas (<code>-i</code> o <code>IdentityFile</code>), aunque el agente tenga más. El agente sigue firmando si tiene esa llave; lo que cambia es qué se ofrece.'],
          ['-i ~/.ssh/llave_deploy', 'La llave concreta para este servidor y este usuario.'],
      ], 'La solución puntual') ?>

  <h3>La solución permanente: un bloque Host</h3>

  <?= ssh_tree(<<<'TXT'
Host deploy-srv
    HostName servidor
    User deploy
    IdentityFile ~/.ssh/llave_deploy
    IdentitiesOnly yes
TXT, '~/.ssh/config') ?>

  <p>Con eso, <code>ssh deploy-srv</code> ofrece exactamente una llave. Es además más seguro:
  no enseñas a cada servidor la lista de todas tus llaves públicas.</p>

  <?= evidence(
      '<p><code>Too many authentication failures</code> con ocho llaves en el agente.</p>',
      '<p>El cliente agotó los intentos del servidor antes de ofrecer la llave válida.</p>',
      '<p>Que la llave correcta no esté autorizada. Con <code>IdentitiesOnly</code> se comprobó
      que sí lo estaba: el problema era el orden, no la autorización.</p>') ?>

  <?= pitfall('<p>Subir <code>MaxAuthTries</code> en el servidor para que «quepan» todas las llaves.
      Arreglas tu síntoma a costa de conceder más intentos a cualquiera que pruebe credenciales
      contra ese servidor. La corrección va en el cliente.</p>') ?>
</section>

<!-- ========================== HOSTKEY FAILED ========================= -->
<section id="hostkey-failed">
  <h2>Host key verification failed</h2>
  <p class="tut-sub">SSH se niega a continuar porque el servidor no es el que recuerdas.</p>

  <p>Este mensaje cierra el aviso grande de clave cambiada. La conexión llegó al paso 4: hay red,
  hay SSH, pero la host key que presenta el servidor no coincide con la de
  <code>known_hosts</code>. SSH se detiene antes de enviar nada tuyo.</p>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh srv hostname
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
[… 7 líneas omitidas …]
Offending ECDSA key in /home/alumno/.ssh/known_hosts:3
Host key for servidor has changed and you have requested strict checking.
Host key verification failed.
TXT, 'salida real · laboratorio') ?>

  <p>Aquí no hay atajos que enseñar: el procedimiento correcto —no borrar nada todavía, averiguar
  qué cambió, conseguir la huella por un canal distinto, compararla y solo entonces usar
  <code>ssh-keygen -R</code>— está completo, con capturas reales, en
  <a href="#host-cambiado">Host key cambiada</a>.</p>

  <?= evidence(
      '<p><code>Host key verification failed</code> tras el aviso de identificación cambiada.</p>',
      '<p>El servidor presenta una host key distinta de la guardada. En el laboratorio se debía a
      que se regeneraron sus llaves, lo mismo que ocurre en una reinstalación.</p>',
      '<p>Que sea un ataque, ni que sea inofensivo. Solo la comparación con la huella obtenida por
      otro canal lo decide.</p>') ?>

  <?= pitfall('<p>Resolverlo con <code>StrictHostKeyChecking no</code> «para que no moleste». Esa
      opción desactiva justo la comprobación que te protege de hablar con el servidor
      equivocado, en todas las conexiones futuras.</p>') ?>
</section>

<!-- ============================ DOS LADOS ============================ -->
<section id="dos-lados">
  <h2>Cliente y servidor a la vez</h2>
  <p class="tut-sub">El cliente cuenta el síntoma; el servidor, la causa. Hacen falta los dos.</p>

  <p>Por diseño, un servidor SSH no le explica al cliente <em>por qué</em> lo rechaza: dar
  detalles ayudaría a quien prueba credenciales ajenas. Así que el lado cliente, por mucho
  <code>-vvv</code> que uses, a veces solo puede decirte <strong>qué intentó</strong>. La razón
  está en el log de <code>sshd</code>.</p>

  <?= shot('ssh/67-dos-lados.svg',
      'Dos salidas reales del mismo fallo. Arriba, el cliente con ssh -v ofrece su llave y termina '
      . 'en Permission denied (publickey). Abajo, en el bastión, el directorio .ssh se había vuelto '
      . 'escribible por el grupo y el log de sshd dice Authentication refused, bad ownership or '
      . 'modes; tras volver a 700 queda correcto.',
      '<b>Dónde mirar:</b> el ① y el ⑤. El cliente ofreció la llave correcta; el servidor la '
      . 'rechazó sin mirarla porque el directorio que la contiene no era de fiar.',
      'real') ?>

  <?= callouts([
      ['Offering public key', 'El cliente ofrece <code>id_ed25519</code>, la llave que el bastión tiene autorizada.'],
      ['No more authentication methods', 'El servidor la rechazó y no quedan métodos.'],
      ['Permission denied (publickey)', 'Lo único que el cliente llega a saber.'],
      ['drwxrwsr-x', 'En el servidor, <code>~/.ssh</code> tiene escritura para el grupo: la avería provocada para la prueba.'],
      ['Authentication refused: bad ownership or modes', 'La causa, escrita en el log de sshd. Es <code>StrictModes yes</code>, el valor por defecto, haciendo su trabajo.'],
      ['Failed publickey', 'El intento fallido queda registrado con la huella de la llave y la IP de origen.'],
      ['drwx--S---', 'Tras <code>chmod 700</code> el directorio vuelve a ser privado.'],
  ]) ?>

  <h3>El lado cliente: <code>ssh -v</code></h3>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ ssh -o BatchMode=yes -v bastion hostname 2>&1 | grep -E 'Authenticating to|Offering public key|Authentications that can continue|No more authentication|Permission denied'
debug1: Authenticating to 192.168.56.30:22 as 'alumno'
debug1: Authentications that can continue: publickey
debug1: Offering public key: /home/alumno/.ssh/id_ed25519 ED25519 SHA256:naRfLqw1lzl4RNzMfQ/a0lJ2FAIuCHwbE6H7hQnqjHI explicit
debug1: Authentications that can continue: publickey
debug1: No more authentication methods to try.
alumno@192.168.56.30: Permission denied (publickey).
TXT, 'salida real · laboratorio') ?>

  <p>Solo con esto ya se descarta mucho: el usuario es <code>alumno</code>, el servidor es el
  192.168.56.30 y se ofreció la llave esperada. Pero no dice por qué no valió.
  <code>BatchMode=yes</code> evita que ssh se quede preguntando nada, útil en pruebas y
  scripts.</p>

  <h3>El lado servidor: permisos y log</h3>

  <?= ssh_term(<<<'TXT'
root@bastion:~# ls -ld /home/alumno/.ssh
drwxrwsr-x 2 alumno alumno 4096 Sep 14 18:06 /home/alumno/.ssh
root@bastion:~# grep -E "Authentication refused|Failed publickey" /var/log/sshd.log | tail -n 2
Authentication refused: bad ownership or modes for directory /home/alumno/.ssh
Failed publickey for alumno from 192.168.56.10 port 35746 ssh2: ED25519 SHA256:naRfLqw1lzl4RNzMfQ/a0lJ2FAIuCHwbE6H7hQnqjHI
root@bastion:~# chmod 700 /home/alumno/.ssh
root@bastion:~# ls -ld /home/alumno/.ssh
drwx--S--- 2 alumno alumno 4096 Sep 14 18:06 /home/alumno/.ssh
TXT, 'salida real · laboratorio') ?>

  <p>En el laboratorio el log está en <code>/var/log/sshd.log</code> porque sshd se arrancó con
  <code>-E</code>. En un servidor real <strong>no lo asumas</strong>: depende de la
  distribución.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Dónde están los logs de sshd</caption>
      <thead><tr><th scope="col">Sistema</th><th scope="col">Dónde mirar</th></tr></thead>
      <tbody>
        <tr><td class="f">Con systemd (casi todos)</td><td class="d"><code>journalctl -u sshd</code> — en Debian/Ubuntu la unidad se llama <code>ssh</code></td></tr>
        <tr><td class="f">Debian / Ubuntu con rsyslog</td><td class="d"><code>/var/log/auth.log</code></td></tr>
        <tr><td class="f">RHEL / Fedora con rsyslog</td><td class="d"><code>/var/log/secure</code></td></tr>
        <tr><td class="f">Arch / CachyOS</td><td class="d">solo el journal: en el equipo del autor no existen ni auth.log ni secure</td></tr>
        <tr><td class="f">Hosting compartido</td><td class="d">normalmente no tienes acceso: pide los detalles al proveedor</td></tr>
      </tbody>
    </table>
  </div>

  <?= ssh_term(<<<'TXT'
$ ssh -vvv usuario@servidor                          # cliente: todo el detalle
$ sudo journalctl -u sshd --since "10 min ago"        # servidor con systemd (ssh en Debian/Ubuntu)
TXT, 'bash') ?>

  <?= note('Más detalle en el servidor, con cabeza',
      '<p><code>LogLevel VERBOSE</code> en <code>sshd_config</code> añade la huella de cada llave
      aceptada o rechazada, lo que permite saber <em>qué</em> llave se usó. Los niveles
      <code>DEBUG</code> dan aún más, pero <code>man sshd_config</code> advierte que violan la
      privacidad de los usuarios y no se recomiendan en producción.</p>', 'info') ?>

  <?= evidence(
      '<p>Cliente: <code>Permission denied (publickey)</code> tras ofrecer la llave esperada.
      Servidor: <code>Authentication refused: bad ownership or modes for directory
      /home/alumno/.ssh</code> y el directorio en <code>drwxrwsr-x</code>.</p>',
      '<p>La llave era correcta; sshd la rechazó porque <code>StrictModes</code> no confía en un
      <code>~/.ssh</code> escribible por el grupo. Tras <code>chmod 700</code> la causa
      desaparece.</p>',
      '<p>Nada de esto a partir del lado cliente solo. Y la línea <code>Failed publickey</code>
      del servidor, leída sin la anterior, parecería «llave no autorizada»: una conclusión
      equivocada.</p>') ?>

  <?= pitfall('<p>Repetir <code>ssh -vvv</code> una y otra vez esperando que el cliente acabe
      explicando el rechazo. No lo hará: esa información solo existe en el servidor. Si no tienes
      acceso a sus logs, el siguiente paso es pedirlos a quien lo administra.</p>') ?>
</section>

<!-- ======================= PRÁCTICA DIAGNÓSTICO ====================== -->
<section id="practica-diagnostico">
  <h2>Práctica: diagnóstico</h2>
  <p class="tut-sub">Dos casos con evidencia real: uno de autenticación y un mini incidente.</p>

  <?= ssh_ejercicio([
      'num' => '19',
      'titulo' => 'Diagnosticar Permission denied (publickey)',
      'nivel' => 'intermedio',
      'objetivo' => 'Objetivo: localizar la causa de un rechazo de llave usando la evidencia de los dos lados y separar lo que dice cada uno.',
      'mision' => '<p>Un compañero no puede entrar al bastión con la llave que siempre le funcionó y
        te pasa su error. Tú tienes acceso de administración al bastión.</p>',
      'escenario' => '<p>Laptop <code>192.168.56.10</code>, bastión <code>192.168.56.30</code>,
        usuario <code>alumno</code>. El bastión solo acepta llaves. Nadie ha tocado la llave del
        cliente.</p>',
      'preparacion' => '<p>En tu laboratorio propio: una máquina con sshd que solo acepte llaves y
        una llave ya instalada que funcione. Para reproducir el caso, como administrador,
        haz temporalmente escribible por el grupo el <code>~/.ssh</code> del usuario; al terminar,
        déjalo otra vez en 700.</p>',
      'pasos' => [
          '<p>Desde el cliente, recoge la versión detallada del error:</p>'
          . ssh_term(<<<'TXT'
$ ssh -o BatchMode=yes -v bastion hostname 2>&1 | grep -E 'Authenticating to|Offering public key|Authentications that can continue|No more authentication|Permission denied'
TXT, 'bash'),
          '<p>En el servidor, revisa permisos y el log de sshd (en tu sistema puede ser
          <code>journalctl -u sshd</code>):</p>'
          . ssh_term(<<<'TXT'
$ ls -ld /home/alumno/.ssh
$ sudo grep -E "Authentication refused|Failed publickey" /var/log/sshd.log | tail -n 2
TXT, 'bash'),
          '<p>Corrige la causa que encuentres y vuelve a probar desde el cliente.</p>',
      ],
      'observar' => '<p>En el cliente: qué usuario, qué servidor y qué llave aparecen en las
        líneas <code>debug1</code>. En el servidor: la línea que empieza por
        <code>Authentication refused</code> y el modo del directorio.</p>',
      'visual' => shot('ssh/67-dos-lados.svg',
          'La misma captura real de dos lados: cliente con Permission denied y servidor con '
          . 'Authentication refused por permisos del directorio .ssh.',
          '<b>Dónde mirar:</b> compara el ① del cliente con el ⑤ del servidor.', 'real'),
      'preguntas' => [
          '¿Qué puedes afirmar mirando <strong>solo</strong> la salida del cliente?',
          '¿Indica <code>Permission denied (publickey)</code> que el servidor está caído?',
          '¿Qué línea del servidor explica el rechazo, y por qué la línea <code>Failed publickey</code> sola podría engañarte?',
          '¿Qué comando lo corrige y cómo compruebas que quedó bien?',
      ],
      'pistas' => [
          '<p>Piensa en qué paso de la conexión está este error y qué pasos anteriores quedan demostrados.</p>',
          '<p>El cliente dice qué llave ofreció; el porqué del rechazo solo lo escribe sshd en su log.</p>',
          '<p>Mira la tabla de <a href="#permisos-ssh">permisos que exige OpenSSH</a> y compárala con <code>drwxrwsr-x</code>.</p>',
      ],
      'solucion' => 'El <code>~/.ssh</code> del bastión era escribible por el grupo; sshd (StrictModes) rechazó la llave. Se corrige con <code>chmod 700 /home/alumno/.ssh</code>.',
      'porque' => '<p>Desde el cliente solo puede afirmarse que nombre, red, puerto y host key
        funcionan, que el usuario es <code>alumno</code> y que se ofreció
        <code>id_ed25519</code>. <strong>No</strong> indica que el servidor esté caído: un servidor
        caído no llega a negociar autenticación, y aquí incluso anunció los métodos que acepta.</p>
        <p>La causa aparece en el servidor: <code>Authentication refused: bad ownership or modes
        for directory /home/alumno/.ssh</code>, coherente con el modo <code>drwxrwsr-x</code>. La
        línea <code>Failed publickey</code>, leída sola, sugeriría que la llave no está autorizada;
        leída junto a la anterior, se ve que ni siquiera se consultó. Tras <code>chmod 700</code>,
        <code>ls -ld</code> muestra <code>drwx--S---</code> y una nueva conexión debe entrar.</p>',
      'error' => '<p>Regenerar la llave del cliente o volver a ejecutar <code>ssh-copy-id</code>.
        No arregla nada, porque la llave nunca fue el problema, y deja una llave pública más en
        <code>authorized_keys</code> sin necesidad.</p>',
      'aprendiste' => 'el cliente muestra el síntoma y el servidor la causa; un diagnóstico de autenticación serio necesita los dos lados.',
  ]) ?>

  <?= ssh_ejercicio([
      'num' => '20',
      'titulo' => 'Mini incidente: ¿ataque o error propio?',
      'nivel' => 'avanzado',
      'objetivo' => 'Objetivo: interpretar un log de sshd con intentos fallidos separando evidencia, interpretación y límites antes de sacar conclusiones.',
      'mision' => '<p>Revisando el servidor encuentras varias líneas de intentos fallidos y alguien
        del equipo dice «nos están atacando». Tu trabajo es decidir qué se puede afirmar con lo que
        hay y qué harías después.</p>',
      'escenario' => '<p>Servidor <code>192.168.56.20</code> en una red de laboratorio. Estas son las
        líneas del log de sshd filtradas:</p>'
        . ssh_term(<<<'TXT'
root@servidor:~# grep -E "admin|Invalid|Failed|Connection closed by invalid" /var/log/sshd.log
Failed publickey for alumno from 192.168.56.10 port 53702 ssh2: ED25519 SHA256:naRfLqw1lzl4RNzMfQ/a0lJ2FAIuCHwbE6H7hQnqjHI
Failed publickey for alumno from 192.168.56.10 port 53718 ssh2: ED25519 SHA256:naRfLqw1lzl4RNzMfQ/a0lJ2FAIuCHwbE6H7hQnqjHI
Invalid user admin from 192.168.56.10 port 50058
Failed password for invalid user admin from 192.168.56.10 port 50058 ssh2
Failed password for invalid user admin from 192.168.56.10 port 50058 ssh2
Failed password for invalid user admin from 192.168.56.10 port 50058 ssh2
Connection closed by invalid user admin 192.168.56.10 port 50058 [preauth]
TXT, 'salida real · laboratorio'),
      'preparacion' => '<p>No hace falta ejecutar nada: es un ejercicio de interpretación. Si
        quieres reproducirlo, en tu propio laboratorio intenta entrar con un usuario inexistente y
        una contraseña incorrecta y luego lee el log de tu sshd.</p>',
      'pasos' => [
          '<p>Clasifica cada línea: ¿qué usuario, qué IP de origen, qué puerto, qué método
          (<code>publickey</code> o <code>password</code>)?</p>',
          '<p>Busca qué información <strong>falta</strong> en estas líneas para reconstruir una
          línea temporal.</p>',
          '<p>Compara con la figura de <a href="#intentos">intentos fallidos</a> y con la de
          <a href="#too-many">demasiadas llaves</a>: ¿hay otra explicación para los
          <code>Failed publickey</code>?</p>',
      ],
      'observar' => '<p>La IP de origen de todas las líneas, el usuario <code>admin</code> marcado
        como <code>invalid</code>, que los tres fallos de contraseña comparten puerto de origen, y
        que las líneas no llevan fecha ni hora.</p>',
      'visual' => shot('ssh/49-intentos-fallidos.svg',
          'Salida real filtrada del log de sshd con dos llaves rechazadas para alumno y un intento '
          . 'contra el usuario inexistente admin.',
          '<b>Dónde mirar:</b> el origen de cada línea y el método.', 'real'),
      'preguntas' => [
          '¿Cuántas conexiones distintas se ven en el intento contra <code>admin</code>? ¿En qué te basas?',
          '¿Existe el usuario <code>admin</code> en el servidor? ¿Qué implica para el riesgo de ese intento?',
          '¿Qué dato te falta para afirmar cuándo ocurrió y si fue repetido en el tiempo?',
          'Con esta evidencia, ¿puedes afirmar que es un ataque? ¿Qué harías después?',
      ],
      'pistas' => [
          '<p>Separa los tres niveles: lo que el log dice literalmente, lo que puede significar y lo que todavía no sabes.</p>',
          '<p>El puerto de origen identifica la conexión TCP: mismo puerto, misma conexión. Y <code>192.168.56.10</code> es una dirección que ya conoces del laboratorio.</p>',
          '<p>Este sshd escribe con <code>-E</code> sin marca temporal. En un sistema con journal, <code>journalctl -u sshd</code> añadiría fecha y hora a cada línea.</p>',
      ],
      'solucion' => 'No se puede afirmar un ataque: todo sale del laptop del propio laboratorio, contra un usuario inexistente, en una única conexión, y sin marca temporal para ver repetición.',
      'porque' => '<p><strong>Evidencia:</strong> dos <code>Failed publickey</code> para
        <code>alumno</code>; un intento contra <code>admin</code>, que sshd marca como
        <code>Invalid user</code> (no existe), con tres contraseñas fallidas en el mismo puerto de
        origen 50058 —una sola conexión— cerrada en <code>[preauth]</code>. Todo desde
        <code>192.168.56.10</code>.</p>
        <p><strong>Interpretación:</strong> <code>192.168.56.10</code> es el laptop del
        laboratorio; los rechazos de llave son compatibles con las pruebas de permisos y de
        llaves que tú mismo hiciste, y el intento contra <code>admin</code> con una prueba manual.
        Un usuario inexistente no puede entrar por muchas contraseñas que se prueben.</p>
        <p><strong>Límites:</strong> sin fecha ni hora no hay línea temporal; no sabes si fue
        hace un minuto o hace un mes, ni con qué frecuencia. Tampoco sabes qué hubo antes de que
        empezara este log.</p>
        <p><strong>Siguiente paso:</strong> confirmar con quien usa el laptop si hizo esas
        pruebas, revisar el log completo con marca temporal (journal), comprobar que no hay
        ningún <code>Accepted</code> inesperado y, si fuera un origen desconocido, revisar el
        firewall y que las contraseñas estén desactivadas donde corresponda.</p>',
      'error' => '<p>Declarar un incidente por un único indicador («hay Failed password, nos
        atacan») o, al contrario, descartarlo sin comprobar nada. Ninguna de las dos es una
        conclusión: son hipótesis a la espera de evidencia.</p>',
      'aprendiste' => 'un log es evidencia de lo que ocurrió desde el punto de vista de sshd; atribuir intención exige contexto, línea temporal y descartar las explicaciones propias.',
  ]) ?>

  <?= ssh_cierre('Diagnóstico',
      [
          'Cada error de SSH pertenece a un paso concreto y descarta todos los anteriores.',
          '<strong>Refused</strong> es un «no» rápido de la máquina; <strong>timeout</strong> es silencio en el camino.',
          '<strong>Could not resolve</strong> ocurre antes de enviar un solo paquete al servidor.',
          '<code>Permission denied (publickey)</code> prueba que red, puerto y host key funcionan.',
          '<code>Too many authentication failures</code> se corrige en el cliente con <code>IdentitiesOnly</code>.',
          'El cliente muestra el síntoma; el log de sshd, la causa.',
      ],
      [
          'getent hosts servidor',
          'nc -zv servidor 22',
          'ssh -G host',
          'ssh -v / -vvv host',
          'ssh -o IdentitiesOnly=yes -i llave host',
          'sudo ss -tlnp',
          'journalctl -u sshd',
      ],
      [
          'Lee el error completo antes de tocar nada: dice en qué capa buscar.',
          'Un timeout describe tu punto de observación, no el estado del servidor.',
          'Los logs de sshd dependen de la distribución: no asumas <code>auth.log</code>.',
          'Evidencia, interpretación y límites se escriben por separado.',
      ],
      '<p>Aplicar «soluciones universales» sin diagnóstico: borrar <code>known_hosts</code>,
      desactivar <code>StrictHostKeyChecking</code>, subir <code>MaxAuthTries</code> o regenerar
      llaves. Cada una tapa un síntoma y abre un problema nuevo.</p>',
      [
          [
              'q' => 'ssh devuelve Connection refused al instante. ¿Qué queda demostrado?',
              'opts' => ['A' => 'Que el nombre no se resolvió', 'B' => 'Que la máquina existe y contestó, pero nadie acepta en ese puerto', 'C' => 'Que la llave es incorrecta', 'D' => 'Que el servidor está apagado'],
              'ok' => 'B',
              'why' => 'Un RST inmediato solo puede venir de un equipo vivo que recibió el paquete. Si no se hubiera resuelto el nombre, el error sería otro; y la llave ni siquiera ha entrado en juego porque no hubo conexión TCP.',
          ],
          [
              'q' => '¿Permission denied (publickey) indica necesariamente que el servidor está caído?',
              'opts' => ['A' => 'Sí, no respondió', 'B' => 'No: la conexión llegó hasta la autenticación', 'C' => 'Sí, si es la primera vez', 'D' => 'Depende del puerto'],
              'ok' => 'B',
              'why' => 'Para llegar a ese mensaje hizo falta resolver el nombre, abrir TCP, negociar SSH y verificar la host key. Un servidor caído no negocia autenticación ni anuncia qué métodos acepta.',
          ],
          [
              'q' => 'Tienes muchas llaves en el agente y aparece Too many authentication failures. ¿Cuál es la corrección adecuada?',
              'opts' => ['A' => 'Subir MaxAuthTries en el servidor', 'B' => 'Borrar known_hosts', 'C' => 'IdentityFile + IdentitiesOnly yes en el bloque Host de ese servidor', 'D' => 'Desactivar el agente para siempre'],
              'ok' => 'C',
              'why' => 'El problema es que el cliente ofrece demasiadas llaves antes de la buena. Limitarlo en el cliente lo resuelve sin dar más intentos a nadie en el servidor; known_hosts no tiene relación con tu autenticación.',
          ],
          [
              'q' => 'El cliente muestra Offering public key con la llave correcta y luego Permission denied. ¿Dónde buscas la causa?',
              'opts' => ['A' => 'En más niveles de -v', 'B' => 'En el log de sshd y los permisos del servidor', 'C' => 'En el DNS', 'D' => 'En el puerto'],
              'ok' => 'B',
              'why' => 'El servidor no explica al cliente por qué lo rechaza. La razón —por ejemplo «Authentication refused: bad ownership or modes»— solo queda escrita en el log de sshd.',
          ],
      ]) ?>
</section>

<?= ssh_parte('10', 'Referencia',
    'Decidir qué herramienta usar, la chuleta de todos los días y el vocabulario del curso.',
    'practica') ?>

<!-- ============================ DECISIÓN ============================ -->
<section id="decision">
  <h2>¿Qué herramienta uso?</h2>
  <p class="tut-sub">Una necesidad, una herramienta. Si dudas, empieza por la pregunta, no por el comando.</p>

  <p>Después de diez partes es normal tener la sensación de que hay demasiadas piezas:
  <code>ssh</code>, <code>scp</code>, <code>sftp</code>, <code>rsync</code>, llaves, agente,
  túneles, bastiones… Todas usan <strong>la misma conexión SSH</strong> y la misma
  autenticación; lo que cambia es el trabajo que hacen. El árbol de abajo parte de lo que
  quieres conseguir y termina en la herramienta adecuada.</p>

  <?= shot('ssh/68-decision.svg',
      'Árbol de decisión: a la izquierda once necesidades (entrar en un servidor, ejecutar un '
      . 'comando, copiar un fichero, explorar, sincronizar, no teclear datos, autenticarse, no '
      . 'teclear la passphrase, llegar a un servicio interno, entrar por un bastión, algo falla) '
      . 'y a la derecha la herramienta que corresponde a cada una.',
      '<b>Dónde mirar:</b> la columna izquierda. Lee primero qué quieres hacer y solo después '
      . 'la herramienta: casi todos los atascos empiezan por elegir el comando antes que el '
      . 'objetivo.',
      'ilustrativo') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Necesidad, herramienta y sección donde se explica</caption>
      <thead><tr><th scope="col">Quiero…</th><th scope="col">Herramienta</th><th scope="col">Dónde se explica</th></tr></thead>
      <tbody>
        <tr><td class="d">Entrar en un servidor</td><td class="f">ssh usuario@host</td><td class="d"><a href="#primera">Primera conexión</a></td></tr>
        <tr><td class="d">Ejecutar un comando y volver</td><td class="f">ssh srv 'comando'</td><td class="d"><a href="#comandos-remotos">Comandos remotos</a></td></tr>
        <tr><td class="d">No teclear usuario, puerto y llave cada vez</td><td class="f">~/.ssh/config</td><td class="d"><a href="#ssh-config">~/.ssh/config</a></td></tr>
        <tr><td class="d">Copiar un fichero o una carpeta puntual</td><td class="f">scp</td><td class="d"><a href="#scp">SCP</a></td></tr>
        <tr><td class="d">Explorar el servidor y transferir a mano</td><td class="f">sftp</td><td class="d"><a href="#sftp">SFTP</a></td></tr>
        <tr><td class="d">Sincronizar un proyecto o desplegar</td><td class="f">rsync -av --dry-run</td><td class="d"><a href="#rsync">rsync sobre SSH</a></td></tr>
        <tr><td class="d">Autenticarme sin contraseña y con seguridad</td><td class="f">ssh-keygen + ssh-copy-id</td><td class="d"><a href="#ssh-keygen">ssh-keygen</a></td></tr>
        <tr><td class="d">No teclear la passphrase en cada conexión</td><td class="f">ssh-agent + ssh-add</td><td class="d"><a href="#ssh-agent">ssh-agent</a></td></tr>
        <tr><td class="d">Llegar a un servicio que solo escucha en el servidor</td><td class="f">ssh -L</td><td class="d"><a href="#local-forward">Local forwarding</a></td></tr>
        <tr><td class="d">Entrar a un servidor interno a través de un bastión</td><td class="f">ssh -J / ProxyJump</td><td class="d"><a href="#proxyjump">ProxyJump</a></td></tr>
        <tr><td class="d">Entender por qué falla</td><td class="f">ssh -v + log de sshd</td><td class="d"><a href="#debug">Debug</a> · <a href="#logs">Logs</a> · <a href="#arbol">Árbol de diagnóstico</a></td></tr>
      </tbody>
    </table>
  </div>

  <?= note('Tres atajos de criterio',
      '<p><strong>¿Una vez o muchas?</strong> Si lo vas a repetir, no uses <code>scp</code> ni
      <code>sftp</code>: usa <code>rsync</code> y, mejor aún, un script.</p>
      <p><strong>¿Tecleas lo mismo dos veces?</strong> Eso va a <code>~/.ssh/config</code>.</p>
      <p><strong>¿No sabes qué pasa?</strong> No cambies nada todavía: <code>ssh -v</code> primero y
      el log del servidor después.</p>', 'info') ?>
</section>

<!-- ============================= CHULETA ============================ -->
<section id="chuleta">
  <h2>Chuleta de SSH</h2>
  <p class="tut-sub">Lo de uso diario, por bloques. Sin opciones oscuras: todo lo que aparece se explicó y se probó en el curso.</p>

  <h3>Conexión</h3>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Comandos de conexión</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">ssh usuario@host</td><td class="d">Abre una sesión interactiva en <code>host</code> como <code>usuario</code></td></tr>
        <tr><td class="f">ssh srv</td><td class="d">Lo mismo usando el alias <code>srv</code> de <code>~/.ssh/config</code></td></tr>
        <tr><td class="f">ssh srv 'comando'</td><td class="d">Ejecuta un comando remoto y vuelve; comillas simples para que se expanda en el servidor</td></tr>
        <tr><td class="f">exit</td><td class="d">Cierra la sesión remota (también <kbd>Ctrl</kbd>+<kbd>D</kbd>)</td></tr>
        <tr><td class="f">ssh -V</td><td class="d">Versión del cliente OpenSSH</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Puerto</h3>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Indicar un puerto distinto del 22</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">ssh -p 2222 usuario@host</td><td class="d">Conecta al puerto 2222 (p minúscula)</td></tr>
        <tr><td class="f">scp -P 2222 fichero usuario@host:ruta/</td><td class="d">En <code>scp</code> el puerto es <strong>P mayúscula</strong></td></tr>
        <tr><td class="f">sftp -P 2222 usuario@host</td><td class="d">En <code>sftp</code>, también P mayúscula</td></tr>
        <tr><td class="f">rsync -av -e 'ssh -p 2222' origen/ usuario@host:destino/</td><td class="d"><code>rsync</code> recibe el puerto dentro del comando ssh que usa como transporte</td></tr>
        <tr><td class="f">Port 2222</td><td class="d">En <code>~/.ssh/config</code>: y ninguno de los cuatro necesita la opción</td></tr>
      </tbody>
    </table>
  </div>

  <?= pitfall('<p><code>ssh -p</code> y <code>scp -P</code> no son un error tipográfico del
      curso: son así. En <code>scp</code>, la <code>-p</code> minúscula significa «conservar fechas
      y permisos», así que <code>scp -p 2222 fichero host:</code> no cambia el puerto e intenta
      copiar un fichero llamado <code>2222</code>. La forma de no volver a pensarlo es poner
      <code>Port</code> en <code>~/.ssh/config</code>.</p>', 'Error común: -p frente a -P') ?>

  <h3>Debug</h3>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Comandos de depuración del cliente</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">ssh -v srv</td><td class="d">Enseña las etapas de la conexión; empieza siempre por aquí</td></tr>
        <tr><td class="f">ssh -vv srv</td><td class="d">Más detalle (en el laboratorio: 144 líneas frente a 72)</td></tr>
        <tr><td class="f">ssh -vvv srv</td><td class="d">Máximo detalle (222 líneas); rara vez hace falta</td></tr>
        <tr><td class="f">ssh -G srv</td><td class="d">Muestra la configuración final que aplicaría, sin conectar</td></tr>
        <tr><td class="f">ssh -G srv | grep -E '^(user|hostname|port|identityfile) '</td><td class="d">Solo las cuatro opciones que más se equivocan</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Llaves</h3>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Gestión de llaves y del agente</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">ssh-keygen -t ed25519 -C "alumno@laptop"</td><td class="d">Genera un par de llaves Ed25519 con un comentario identificativo</td></tr>
        <tr><td class="f">ssh-keygen -p -f ~/.ssh/id_ed25519</td><td class="d">Cambia (o pone) la passphrase de una llave existente</td></tr>
        <tr><td class="f">ssh-keygen -lf ~/.ssh/id_ed25519.pub</td><td class="d">Huella de una llave pública</td></tr>
        <tr><td class="f">ssh-copy-id usuario@host</td><td class="d">Añade tu llave pública al <code>authorized_keys</code> del servidor</td></tr>
        <tr><td class="f">ssh-copy-id -i ~/.ssh/llave_deploy.pub usuario@host</td><td class="d">Lo mismo con una llave concreta</td></tr>
        <tr><td class="f">eval "$(ssh-agent -s)"</td><td class="d">Arranca un agente en esta terminal (si el escritorio no trae uno)</td></tr>
        <tr><td class="f">ssh-add</td><td class="d">Carga la llave por defecto en el agente; pide la passphrase una vez</td></tr>
        <tr><td class="f">ssh-add -l</td><td class="d">Lista las huellas de las llaves cargadas</td></tr>
        <tr><td class="f">ssh-add -D</td><td class="d">Descarga todas las llaves del agente</td></tr>
        <tr><td class="f">chmod 700 ~/.ssh &amp;&amp; chmod 600 ~/.ssh/id_ed25519</td><td class="d">Permisos que OpenSSH exige a la carpeta y a la privada</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Known hosts</h3>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Consultar y limpiar known_hosts</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">ssh-keygen -F servidor</td><td class="d">¿Está registrado este host? Muestra sus líneas</td></tr>
        <tr><td class="f">ssh-keygen -lF servidor</td><td class="d">Lo mismo, pero con las huellas en lugar de las llaves</td></tr>
        <tr><td class="f">ssh-keygen -R servidor</td><td class="d">Borra SOLO las líneas de ese host y guarda <code>known_hosts.old</code></td></tr>
        <tr><td class="f">sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub</td><td class="d">En el servidor: la huella que tus clientes deberían ver</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Archivos</h3>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Transferencia de archivos</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">scp informe.txt srv:/home/alumno/</td><td class="d">Sube un fichero (el lado con <code>:</code> es el remoto)</td></tr>
        <tr><td class="f">scp srv:/home/alumno/logs/app.log .</td><td class="d">Baja un fichero al directorio actual</td></tr>
        <tr><td class="f">scp -r proyecto srv:backups/</td><td class="d">Copia una carpeta entera</td></tr>
        <tr><td class="f">sftp srv</td><td class="d">Sesión interactiva de ficheros</td></tr>
        <tr><td class="f">pwd · ls · cd  /  lpwd · lls · lcd</td><td class="d">Dentro de sftp: servidor / tu equipo (l = local)</td></tr>
        <tr><td class="f">get fichero · put fichero · bye</td><td class="d">Traer, llevar y salir</td></tr>
        <tr><td class="f">rsync -av proyecto/ srv:public_html/</td><td class="d">Sincroniza el CONTENIDO de <code>proyecto</code> (con barra final)</td></tr>
        <tr><td class="f">rsync -av --dry-run proyecto/ srv:public_html/</td><td class="d">Enseña qué haría sin tocar nada</td></tr>
        <tr><td class="f">rsync -av --exclude-from=.rsyncignore ./ srv:public_html/</td><td class="d">Excluye lo que liste el fichero (<code>.git/</code>, <code>.env</code>, <code>logs/</code>…)</td></tr>
        <tr><td class="f">rsync -av --delete --dry-run origen/ srv:destino/</td><td class="d">Anuncia qué BORRARÍA en el destino; léelo antes de quitar <code>--dry-run</code></td></tr>
      </tbody>
    </table>
  </div>

  <?= pitfall('<p><code>--delete</code> borra en el destino todo lo que no existe en el origen:
      uploads de usuarios, un <code>.htaccess</code> del hosting, backups guardados junto a la web.
      Un destino equivocado o una barra de más convierten un despliegue en un directorio vacío, y
      por SSH no hay papelera. Regla fija: <strong>primero <code>--dry-run</code>, lee cada línea
      <code>deleting</code>, y solo entonces lo ejecutas de verdad</strong>.</p>',
      'Error que debes evitar: --delete a ciegas') ?>

  <h3>Configuración del cliente</h3>
  <p>El bloque mínimo que resuelve el 90 % de los casos. Se lee de arriba abajo y, para cada
  opción, gana el primer valor que coincida: lo concreto arriba y <code>Host *</code> al final.</p>

  <?= ssh_tree(<<<'TXT'
Host srv
    HostName servidor.ejemplo.lab
    User alumno
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes

Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
TXT, '~/.ssh/config') ?>

  <h3>Servidor</h3>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Administración del servidor SSH</caption>
      <thead><tr><th scope="col">Comando o fichero</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">/etc/ssh/sshd_config</td><td class="d">Configuración del servidor: quién entra y cómo</td></tr>
        <tr><td class="f">sudo sshd -t</td><td class="d">Valida la sintaxis; sin salida y código 0 = correcta</td></tr>
        <tr><td class="f">sudo sshd -T</td><td class="d">Configuración efectiva completa (útil con <code>grep</code>)</td></tr>
        <tr><td class="f">systemctl status sshd</td><td class="d">Estado del servicio; en Debian/Ubuntu el servicio se llama <code>ssh</code></td></tr>
        <tr><td class="f">sudo systemctl reload sshd</td><td class="d">Aplica cambios sin cortar las sesiones abiertas</td></tr>
        <tr><td class="f">journalctl -u sshd</td><td class="d">Log del servicio en sistemas con systemd (<code>-u ssh</code> en Debian/Ubuntu)</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('Antes de recargar sshd',
      '<p>Mantén una sesión abierta, valida con <code>sudo sshd -t</code>, recarga y comprueba desde
      una <strong>segunda</strong> terminal. Solo cuando la segunda entra, cierra la primera. Está
      explicado paso a paso en <a href="#reinicio-seguro">Aplicar cambios sin quedarte fuera</a>.</p>') ?>

  <h3>Túneles</h3>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Reenvío de puertos y saltos</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">ssh -L 8080:127.0.0.1:8000 srv</td><td class="d">Abre 8080 en TU equipo y lo entrega en el 127.0.0.1:8000 del servidor</td></tr>
        <tr><td class="f">ssh -R 9000:127.0.0.1:9000 srv</td><td class="d">Abre 9000 en el SERVIDOR y lo entrega en tu 127.0.0.1:9000</td></tr>
        <tr><td class="f">ssh -D 1080 bastion</td><td class="d">Proxy SOCKS en tu puerto 1080 para redes de gestión autorizadas</td></tr>
        <tr><td class="f">ssh -J bastion alumno@10.10.0.40</td><td class="d">Entra en un servidor interno saltando por el bastión</td></tr>
        <tr><td class="f">ProxyJump bastion</td><td class="d">Lo mismo, fijado en <code>~/.ssh/config</code></td></tr>
        <tr><td class="f">ssh -f -N -L …</td><td class="d"><code>-N</code>: sin comando remoto; <code>-f</code>: pasa a segundo plano tras autenticarse</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Diagnóstico</h3>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Comandos de diagnóstico</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué responde</th></tr></thead>
      <tbody>
        <tr><td class="f">ssh -v srv</td><td class="d">¿En qué etapa se detiene? ¿Qué llave ofrece? ¿Qué métodos acepta el servidor?</td></tr>
        <tr><td class="f">nc -zv servidor 22</td><td class="d">¿Hay alguien escuchando en el puerto? (en el laboratorio: <code>servidor (192.168.56.20:22) open</code>)</td></tr>
        <tr><td class="f">ssh-keygen -F servidor</td><td class="d">¿Qué host key tengo guardada para ese nombre?</td></tr>
        <tr><td class="f">ls -ld ~/.ssh ~/.ssh/authorized_keys</td><td class="d">¿Son los permisos que exige StrictModes?</td></tr>
        <tr><td class="f">sudo tail -n 20 /var/log/auth.log</td><td class="d">Log de sshd en Debian/Ubuntu; <code>/var/log/secure</code> en RHEL; <code>journalctl -u sshd</code> con systemd</td></tr>
      </tbody>
    </table>
  </div>

  <?= ssh_term(<<<'TXT'
alumno@laptop:~$ nc -zv -w 3 servidor 22
servidor (192.168.56.20:22) open
TXT, 'salida real') ?>

  <p>Si <code>nc</code> responde <code>open</code> y aun así no entras, la red y el puerto quedan
  descartados: el problema está en la host key, en la autenticación o en los permisos. Sigue el
  <a href="#arbol">árbol de diagnóstico</a> desde ahí, no desde el principio.</p>
</section>

<!-- ============================= GLOSARIO =========================== -->
<section id="glosario">
  <h2>Glosario</h2>
  <p class="tut-sub">El vocabulario del curso, en una línea cada término. El enlace lleva a la sección donde se explica a fondo.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Glosario de términos SSH</caption>
      <thead><tr><th scope="col">Término</th><th scope="col">Definición</th></tr></thead>
      <tbody>
        <tr><td class="f"><a href="#que-es">SSH</a></td><td class="d">Secure Shell: protocolo y programas para abrir sesiones remotas y transportar datos con confidencialidad, integridad y autenticación de ambos extremos.</td></tr>
        <tr><td class="f"><a href="#cliente-servidor">sshd</a></td><td class="d">SSH daemon: el programa servidor, siempre en marcha, que escucha conexiones y decide quién entra según <code>sshd_config</code>.</td></tr>
        <tr><td class="f"><a href="#cliente-servidor">Cliente</a></td><td class="d">El lado que inicia la conexión: el programa <code>ssh</code> (y <code>scp</code>, <code>sftp</code>, <code>rsync</code>, <code>git</code> sobre él), configurado en <code>~/.ssh/config</code>.</td></tr>
        <tr><td class="f"><a href="#cliente-servidor">Servidor</a></td><td class="d">La máquina que acepta la conexión y ejecuta <code>sshd</code>.</td></tr>
        <tr><td class="f"><a href="#anatomia">Host</a></td><td class="d">Cualquier máquina direccionable por IP o nombre. En <code>~/.ssh/config</code>, <code>Host</code> es además el patrón o alias al que se aplican opciones.</td></tr>
        <tr><td class="f"><a href="#puerto">Puerto</a></td><td class="d">Número que identifica el servicio dentro de una máquina. SSH usa el 22 por convenio, no por obligación.</td></tr>
        <tr><td class="f"><a href="#fingerprint">Fingerprint (huella)</a></td><td class="d">Resumen criptográfico corto (<code>SHA256:…</code>) de una llave pública; sirve para comparar llaves a ojo.</td></tr>
        <tr><td class="f"><a href="#host-key">Host key</a></td><td class="d">Par de llaves que identifica al servidor. Su pública queda en tu <code>known_hosts</code> y te protege de hablar con el servidor equivocado.</td></tr>
        <tr><td class="f"><a href="#host-key">User key</a></td><td class="d">Par de llaves que te identifica a ti. Su pública queda en el <code>authorized_keys</code> del servidor.</td></tr>
        <tr><td class="f"><a href="#llave-publica">Llave privada</a></td><td class="d">La mitad secreta del par (<code>id_ed25519</code>). Firma los retos de autenticación y nunca sale de tu equipo.</td></tr>
        <tr><td class="f"><a href="#llave-publica">Llave pública</a></td><td class="d">La mitad compartible (<code>id_ed25519.pub</code>). Permite verificar firmas, no producirlas.</td></tr>
        <tr><td class="f"><a href="#passphrase">Passphrase</a></td><td class="d">Contraseña que cifra la llave privada en disco. No es la contraseña de tu usuario en el servidor y nunca viaja por la red.</td></tr>
        <tr><td class="f"><a href="#authorized-keys">authorized_keys</a></td><td class="d">Fichero del servidor (<code>~/.ssh/authorized_keys</code>) con una llave pública autorizada por línea para esa cuenta.</td></tr>
        <tr><td class="f"><a href="#known-hosts">known_hosts</a></td><td class="d">Fichero del cliente (<code>~/.ssh/known_hosts</code>) con las host keys de los servidores ya aceptados.</td></tr>
        <tr><td class="f"><a href="#ssh-agent">ssh-agent</a></td><td class="d">Proceso que guarda llaves descifradas en memoria y firma por los clientes, para no teclear la passphrase en cada conexión.</td></tr>
        <tr><td class="f"><a href="#sftp">SFTP</a></td><td class="d">Protocolo de transferencia de ficheros que funciona dentro de SSH; el programa <code>sftp</code> ofrece una sesión interactiva.</td></tr>
        <tr><td class="f"><a href="#scp">SCP</a></td><td class="d">Copia de ficheros sobre SSH con un solo comando, con la sintaxis <code>scp origen destino</code>.</td></tr>
        <tr><td class="f"><a href="#rsync">rsync</a></td><td class="d">Herramienta de sincronización que, usando SSH como transporte, solo envía lo que cambió y admite exclusiones y <code>--dry-run</code>.</td></tr>
        <tr><td class="f"><a href="#tuneles">Túnel (port forwarding)</a></td><td class="d">Uso de una conexión SSH ya autorizada para transportar otra conexión TCP: <code>-L</code>, <code>-R</code> o <code>-D</code>.</td></tr>
        <tr><td class="f"><a href="#proxyjump">Bastión</a></td><td class="d">Equipo único y endurecido expuesto a la red, a través del cual se accede a los servidores internos.</td></tr>
        <tr><td class="f"><a href="#proxyjump">ProxyJump</a></td><td class="d">Opción (<code>-J</code> o <code>ProxyJump</code>) que conecta con el destino saltando por uno o varios bastiones, con autenticación de extremo a extremo.</td></tr>
        <tr><td class="f"><a href="#permisos-ssh">StrictModes</a></td><td class="d">Opción de <code>sshd</code>, activa por defecto, que rechaza la autenticación si el home, <code>~/.ssh</code> o <code>authorized_keys</code> tienen permisos demasiado abiertos.</td></tr>
        <tr><td class="f"><a href="#multiplexing">Multiplexing (ControlMaster)</a></td><td class="d">Reutilizar una conexión SSH ya abierta para nuevas sesiones al mismo host, a través de un socket de control.</td></tr>
      </tbody>
    </table>
  </div>

  <?= quiz([
      [
          'q' => '¿Dónde debe permanecer la private key?',
          'opts' => ['A' => 'En el servidor', 'B' => 'En tu equipo', 'C' => 'En el DNS', 'D' => 'En authorized_keys'],
          'ok' => 'B',
          'why' => 'La privada firma; la pública verifica. Al servidor solo le hace falta verificar, así que en su <code>authorized_keys</code> va la <strong>pública</strong>. Si la privada estuviera en el servidor, cualquiera con acceso a ese servidor podría hacerse pasar por ti en todos los demás sitios donde esa llave está autorizada.',
      ],
      [
          'q' => 'Aparece «Permission denied (publickey).» ¿Indica necesariamente que el servidor está caído?',
          'opts' => ['A' => 'Sí: no contestó', 'B' => 'No: la conexión llegó hasta la autenticación', 'C' => 'Sí: el puerto 22 está cerrado', 'D' => 'No se puede saber nada'],
          'ok' => 'B',
          'why' => 'Para rechazar tu llave, el servidor tuvo que resolverse, aceptar la conexión TCP, negociar SSH y superar la verificación de host key. Todo eso funcionó. Además, el paréntesis dice qué métodos ofrece el servidor: aquí solo <code>publickey</code>. El problema está en usuario, llave, <code>authorized_keys</code> o permisos, no en la red.',
      ],
      [
          'q' => 'Quieres copiar un proyecto al servidor cada día sin reenviar lo que no cambió. ¿Qué usas?',
          'opts' => ['A' => 'scp -r', 'B' => 'sftp con put', 'C' => 'rsync -av con --dry-run antes', 'D' => 'ssh -L'],
          'ok' => 'C',
          'why' => '<code>scp -r</code> copia todo cada vez y <code>sftp</code> es manual. <code>rsync</code> compara origen y destino y solo envía diferencias; en el laboratorio, la segunda pasada sin cambios no transfirió ningún fichero. <code>--dry-run</code> te enseña qué va a hacer antes de hacerlo.',
      ],
      [
          'q' => '¿Qué diferencia hay entre ~/.ssh/config y /etc/ssh/sshd_config?',
          'opts' => ['A' => 'Ninguna, uno es copia del otro', 'B' => 'El primero configura el cliente; el segundo, el servidor', 'C' => 'El primero es de root; el segundo, del usuario', 'D' => 'Los dos configuran el servidor'],
          'ok' => 'B',
          'why' => '<code>~/.ssh/config</code> decide cómo te conectas tú (usuario, puerto, llave, saltos) y no requiere sudo. <code>sshd_config</code> decide quién puede entrar en esa máquina y con qué métodos, requiere sudo, se valida con <code>sshd -t</code> y se aplica recargando el servicio. Una letra de diferencia: la <code>d</code> de daemon.',
      ],
      [
          'q' => 'Tras una migración aparece REMOTE HOST IDENTIFICATION HAS CHANGED. ¿Cuál es el orden correcto?',
          'opts' => ['A' => 'Borrar ~/.ssh/known_hosts y reconectar', 'B' => 'Conseguir la huella nueva por otra vía, compararla y después ssh-keygen -R host', 'C' => 'Añadir StrictHostKeyChecking no', 'D' => 'Regenerar tu llave con ssh-keygen'],
          'ok' => 'B',
          'why' => 'El aviso es una discrepancia que hay que explicar, no un error que quitar. Primero se obtiene la huella correcta por un canal distinto (panel del proveedor, sesión ya abierta, administrador) y se compara. Si coincide, <code>ssh-keygen -R</code> elimina solo la entrada vieja. Borrar el fichero entero o desactivar la comprobación aceptaría a ciegas justo lo que SSH intentaba evitar; y tu llave de usuario no tiene nada que ver.',
      ],
  ], 'Repaso final del curso') ?>
</section>

