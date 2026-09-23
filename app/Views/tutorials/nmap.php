<?php
/**
 * Tutorial: Nmap — de cero al uso profesional y defensivo
 * ---------------------------------------------------------------------
 * v1.2.0 — primera versión publicada del tutorial de Nmap en la
 * biblioteca. Diez niveles: fundamentos, descubrimiento, puertos,
 * servicios, sistema operativo, NSE, resultados, ciberseguridad
 * defensiva, análisis avanzado y práctica (15 laboratorios).
 *
 * Rigor técnico
 *   · Toda opción que aparece aquí se contrastó con la documentación
 *     local de Nmap 7.991 (paquete extra/nmap de Arch/CachyOS):
 *     `man nmap`, `nmap --help` y el índice de scripts
 *     /usr/share/nmap/scripts/script.db (categorías reales de cada NSE).
 *   · Las salidas marcadas «salida real» se obtuvieron ejecutando el
 *     comando contra 127.0.0.1. Las marcadas «salida ilustrativa»
 *     reproducen el formato exacto de Nmap sobre un laboratorio ficticio
 *     (192.168.56.0/24) y lo dicen explícitamente.
 *
 * Enfoque de seguridad: exclusivamente defensivo y autorizado. Se
 * explica qué hace cada técnica, qué evidencia produce y cómo se
 * reconoce desde el lado que la recibe. No se enseña evasión, ocultación
 * ni explotación.
 *
 * v1.3.0 — aplicación del estándar de enseñanza visual del proyecto
 * (docs/TUTORIAL_STANDARD.md). El contenido anterior se conserva íntegro;
 * lo que se añade es lo que faltaba para cumplir la norma:
 *   · 12 figuras con procedencia declarada, alt, pie y lupa;
 *   · el desglose anotado del primer comando;
 *   · seis bloques evidencia / interpretación / límite;
 *   · seis bloques de error común;
 *   · pistas progresivas antes de las soluciones de los 15 labs y D1;
 *   · los 18 ejercicios reclasificados a la escala global
 *     Básico / Intermedio / Avanzado;
 *   · resumen y quiz al cierre de los bloques de niveles.
 *
 * Procedencia del material visual
 *   · Las figuras rotuladas «salida real» reproducen la salida literal de
 *     Nmap 7.991 contra 127.0.0.1 en la máquina de laboratorio. El caso
 *     del puerto 8090 —que la tabla de servicios llama «opsmessaging» y
 *     que -sV identifica como Apache— es real y se usa a propósito.
 *   · Las demás son diagramas didácticos y lo dicen en la página.
 */
require_once \App\Core\Config::basePath('app/Views/components/icons.php');
require_once \App\Core\Config::basePath('app/Views/components/blocks.php');

if (!function_exists('nm_nivel')) {
    /**
     * Separador de nivel. Reutiliza el marcado y los estilos de chapter()
     * (blocks.php), pero rotula «Nivel N» en lugar de «Parte N»: el curso
     * de Nmap se organiza por niveles de dificultad, no por partes.
     */
    function nm_nivel(string $numero, string $titulo, string $bajada, string $nivel): string
    {
        return '<div class="chapter">'
             . '<div class="chapter__top">'
             . '<span class="chapter__num">Nivel ' . e($numero) . '</span>'
             . difficulty($nivel)
             . '</div>'
             . '<h2 class="chapter__title">' . e($titulo) . '</h2>'
             . '<p class="chapter__sub">' . e($bajada) . '</p>'
             . '</div>';
    }
}

if (!function_exists('nm_ficha')) {
    /**
     * Ficha didáctica de una opción: cuándo usarla, qué no significa, su
     * lectura defensiva, el error típico y una mini práctica. Misma forma
     * en todas las opciones para que se puedan comparar de un vistazo.
     *
     * @param array<string,string> $filas  etiqueta => HTML de autor
     */
    function nm_ficha(array $filas): string
    {
        $html = '';
        foreach ($filas as $etiqueta => $contenido) {
            $html .= '<div><dt>' . e((string) $etiqueta) . '</dt><dd>' . $contenido . '</dd></div>';
        }
        return '<dl class="nm-ficha">' . $html . '</dl>';
    }
}
?>

<p class="tl-eyebrow">Guía práctica · CachyOS · Nmap 7.991 · localhost y laboratorio propio</p>
<p class="tut-lead">
  Nmap responde a una pregunta aparentemente sencilla: <em>¿qué hay en esta red y qué
  ofrece cada equipo?</em> Aprender a hacer la pregunta es fácil; aprender a leer la
  respuesta sin engañarte es lo que separa a quien memoriza comandos de quien entiende
  su red.
</p>
<p class="tut-lead">
  Este curso va de cero a un uso profesional en diez niveles. Empieza contra tu propio
  equipo (<code>localhost</code>), pasa a un laboratorio de máquinas virtuales que tú
  controlas y termina en inventario, auditoría autorizada y análisis defensivo. Cada
  opción se explica igual: qué hace, cómo funciona, qué salida esperar, cómo
  interpretarla, cuándo usarla y qué <strong>no</strong> significa.
</p>

<div class="tut-search" role="search">
  <label class="visually-hidden" for="tut-q">Buscar en este tutorial</label>
  <input type="search" id="tut-q" class="tut-search__input" data-tut-search
         placeholder="Buscar: -sV, -sS, UDP, NSE, filtered, CIDR, firewall, output…"
         autocomplete="off" spellcheck="false">
  <p class="tut-search__status" data-tut-search-status role="status" aria-live="polite"></p>
</div>

<?= nm_nivel('0', 'Fundamentos', 'Qué es Nmap, en qué condiciones se usa, cómo razona y cómo se lee su salida. Antes de ningún escaneo de verdad.', 'fundamentos') ?>

<!-- ============================== QUÉ ES ============================= -->
<section id="que-es">
  <h2>Qué es Nmap y qué no es</h2>
  <p class="tut-sub">Network Mapper: un cartógrafo de redes, no un arma.</p>

  <p><strong>Nmap</strong> significa <em>Network Mapper</em>. Es un programa de línea de
  comandos, libre y veterano (su primera versión es de 1997), que envía paquetes
  cuidadosamente construidos a uno o varios equipos y <strong>deduce</strong>, a partir de
  cómo responden —o de cómo no responden—, qué equipos están activos, qué puertos aceptan
  conexiones, qué software parece haber detrás y, con cierta probabilidad, qué sistema
  operativo ejecutan.</p>

  <p>La palabra clave es <em>deduce</em>. Nmap no «entra» en ningún sitio ni lee la
  configuración del equipo: observa comportamiento de red desde fuera y lo interpreta.
  Todo lo que dice es una inferencia basada en evidencia, y así hay que tratarlo.</p>

  <h3>Para qué se usa legítimamente</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Usos legítimos de Nmap</caption>
      <thead><tr><th scope="col">Uso</th><th scope="col">Pregunta que responde</th></tr></thead>
      <tbody>
        <tr><td class="f">Descubrimiento de hosts</td><td class="d">¿Qué equipos están encendidos y alcanzables en este rango?</td></tr>
        <tr><td class="f">Inventario</td><td class="d">¿Qué hay realmente en mi red, y coincide con lo que creo que hay?</td></tr>
        <tr><td class="f">Identificación de puertos</td><td class="d">¿Qué puertos aceptan conexiones en este servidor?</td></tr>
        <tr><td class="f">Detección de servicios</td><td class="d">¿Qué programa y qué versión atiende en cada puerto?</td></tr>
        <tr><td class="f">SO aproximado</td><td class="d">¿Qué sistema operativo parece ejecutar este equipo?</td></tr>
        <tr><td class="f">Revisión de exposición</td><td class="d">¿Qué ve alguien que llega a este equipo desde otra red?</td></tr>
        <tr><td class="f">Troubleshooting</td><td class="d">¿El servicio no responde por el servidor o por un firewall en el camino?</td></tr>
        <tr><td class="f">Auditoría autorizada</td><td class="d">¿La configuración real cumple la política acordada?</td></tr>
        <tr><td class="f">Administración</td><td class="d">¿Sigue cerrado el puerto que cerré ayer? ¿Apareció algo nuevo?</td></tr>
        <tr><td class="f">Análisis defensivo</td><td class="d">¿Qué superficie ofrezco y qué debería reducir?</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Lo que Nmap <em>no</em> es</h3>

  <ul>
    <li><strong>No es un escáner de vulnerabilidades completo.</strong> Te dice que hay un
    OpenSSH en el puerto 22 y qué versión anuncia. Decidir si esa versión está afectada por
    algo, si el parche está aplicado por el distribuidor o si la configuración mitiga el
    problema es otro trabajo.</li>
    <li><strong>No es una herramienta de explotación.</strong> Encontrar una puerta no es
    abrirla. Este tutorial no cruza nunca esa línea.</li>
    <li><strong>No es un monitor continuo.</strong> Cada ejecución es una foto de un
    momento. Para vigilar cambios se repite y se compara (lo verás en el nivel 6).</li>
    <li><strong>No es infalible.</strong> Firewalls, NAT, balanceadores y servicios que
    mienten en sus banners pueden producir resultados engañosos. Tiene su propia sección.</li>
    <li><strong>No es un analizador de tráfico.</strong> Nmap provoca y resume; para ver los
    paquetes uno a uno se usa Wireshark. Combinar ambos es uno de los mejores ejercicios
    de este curso.</li>
  </ul>

  <?= note('La idea que vertebra todo el curso',
      '<p>Nmap descubre <strong>exposición</strong>: lo que un equipo ofrece a la red. El
      <strong>riesgo</strong> real necesita contexto que Nmap no tiene: quién debería
      acceder, qué datos hay detrás, qué controles existen. Un puerto abierto es un dato;
      una vulnerabilidad es una conclusión, y entre uno y otra hay trabajo de análisis.</p>', 'info') ?>
</section>

<!-- ============================ ALCANCE ============================== -->
<section id="alcance">
  <h2>Autorización y alcance</h2>
  <p class="tut-sub">La primera opción de Nmap no se escribe en la terminal: se pide por escrito.</p>

  <p>Nmap envía tráfico a equipos ajenos al tuyo. En tu portátil y en tus máquinas
  virtuales es tu decisión; en cualquier otra red es de su propietario. Escanear sin
  autorización puede violar la ley, el contrato con tu proveedor de Internet o la política
  de tu empresa, y aunque no «rompas» nada, genera alertas que alguien tendrá que
  investigar.</p>

  <h3>Dónde se practica en este tutorial</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Objetivos permitidos y no permitidos en este tutorial</caption>
      <thead><tr><th scope="col">Objetivo</th><th scope="col">¿Se usa aquí?</th><th scope="col">Por qué</th></tr></thead>
      <tbody>
        <tr><td class="f">localhost · 127.0.0.1</td><td class="d">Sí, desde el principio</td><td class="d">Es tu propio equipo; el tráfico nunca sale de él.</td></tr>
        <tr><td class="f">VM propia (VirtualBox, KVM)</td><td class="d">Sí, desde el nivel 1</td><td class="d">Red aislada que tú creas y controlas.</td></tr>
        <tr><td class="f">Contenedor Docker local</td><td class="d">Sí, como objetivo</td><td class="d">Servicio que tú levantas en tu máquina.</td></tr>
        <tr><td class="f">Red doméstica propia</td><td class="d">Solo si es tuya</td><td class="d">Y avisando a quien conviva contigo: sus equipos también están ahí.</td></tr>
        <tr><td class="f">Red del trabajo, escuela, cafetería</td><td class="d">No, salvo autorización escrita</td><td class="d">No es tuya. Aunque estés conectado, no tienes derecho a auditarla.</td></tr>
        <tr><td class="f">Servidores en Internet, IP públicas</td><td class="d">No</td><td class="d">Infraestructura de terceros. Incluido tu propio hosting compartido: el servidor es del proveedor.</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Qué debe contener una autorización</h3>

  <ul>
    <li><strong>Alcance exacto:</strong> IP, rangos CIDR o nombres. Lo que no está en la
    lista está fuera.</li>
    <li><strong>Exclusiones:</strong> equipos frágiles o críticos que no se tocan (una
    impresora vieja, un equipo médico, un controlador industrial).</li>
    <li><strong>Ventana horaria</strong> y persona de contacto si algo se comporta raro.</li>
    <li><strong>Técnicas permitidas:</strong> ¿solo descubrimiento y puertos? ¿versiones?
    ¿scripts NSE? ¿qué categorías?</li>
    <li><strong>Qué se hace con los resultados:</strong> dónde se guardan y quién los ve.
    Un inventario de servicios es información sensible.</li>
  </ul>

  <?= note('Regla práctica',
      '<p>Si dudas de si puedes escanear algo, no puedes. Todos los comandos de este curso
      funcionan contra <code>127.0.0.1</code> o contra una VM de laboratorio, y no pierdes
      nada de aprendizaje por limitarte a ellos.</p>') ?>
</section>

<!-- ============================ MODELO =============================== -->
<section id="modelo">
  <h2>El modelo mental</h2>
  <p class="tut-sub">Entender cómo razona Nmap antes de memorizar una sola opción.</p>

  <p>Casi todo lo que hace Nmap encaja en una escalera. Cada peldaño responde una pregunta
  y solo tiene sentido si el anterior dio una respuesta:</p>

  <ol class="nm-pipe" aria-label="Escalera de preguntas de Nmap">
    <li><b>Red</b><span>¿Qué rango analizo y estoy autorizado?</span></li>
    <li><b>Host</b><span>¿Qué equipos están activos?</span></li>
    <li><b>Puertos</b><span>¿Qué puertos aceptan conexiones?</span></li>
    <li><b>Servicios</b><span>¿Qué protocolo habla cada puerto?</span></li>
    <li><b>Versiones</b><span>¿Qué software y qué versión anuncia?</span></li>
    <li><b>Información adicional</b><span>SO, certificados, cabeceras, scripts NSE</span></li>
    <li><b>Interpretación</b><span>¿Debería estar ahí? ¿Qué riesgo supone?</span></li>
  </ol>

  <p>Las opciones de Nmap se ordenan igual. <code>-sL</code> y <code>-sn</code> trabajan en
  el peldaño Host; <code>-p</code>, <code>-sT</code>, <code>-sS</code> y <code>-sU</code> en
  Puertos; <code>-sV</code> en Servicios y Versiones; <code>-O</code> y los scripts NSE en
  Información adicional. El último peldaño, la interpretación, <strong>no lo hace
  Nmap</strong>: lo haces tú.</p>

  <h3>Qué hace Nmap cuando no le pides nada especial</h3>

  <p>Si escribes <code>nmap objetivo</code> sin más opciones, Nmap recorre los peldaños por
  su cuenta:</p>

  <?= steps([
      '<strong>Resuelve el objetivo:</strong> si es un nombre, lo traduce a IP con DNS.',
      '<strong>Descubre si está activo</strong> (host discovery) con unas sondas rápidas. Si no contesta a ninguna, lo da por apagado y se detiene ahí.',
      '<strong>Resuelve el nombre inverso</strong> (IP → nombre) de los que están activos.',
      '<strong>Escanea los 1000 puertos TCP más frecuentes</strong>, en orden aleatorio.',
      '<strong>Clasifica cada puerto</strong> en un estado (<code>open</code>, <code>closed</code>, <code>filtered</code>…) y le pone un nombre de servicio sacado de una tabla, <em>sin comprobarlo</em>.',
  ]) ?>

  <p>No detecta versiones, no ejecuta scripts, no intenta adivinar el sistema operativo ni
  mira UDP. Todo eso hay que pedirlo. Es un buen diseño: el comportamiento por defecto es
  el mínimo útil.</p>

  <?= note('La frase que conviene tatuarse',
      '<p><strong>Encontrar un puerto abierto no significa encontrar una vulnerabilidad.</strong>
      Significa que hay un programa aceptando conexiones. Puede ser exactamente lo que
      debe haber (el HTTPS de un servidor web), puede estar perfectamente actualizado y
      configurado, y puede estar protegido por controles que Nmap no ve. Lo que sí significa
      siempre es: <em>aquí hay algo que conviene conocer</em>.</p>') ?>
</section>

<!-- ============================ INSTALAR ============================= -->
<section id="instalar">
  <h2>Instalar y validar</h2>
  <p class="tut-sub">En Arch/CachyOS el paquete se llama simplemente nmap. Y trae su documentación.</p>

  <p>En Arch Linux y CachyOS, Nmap está en los repositorios oficiales con el nombre
  <code>nmap</code> (en CachyOS, además, recompilado para tu microarquitectura en
  <code>cachyos-extra-v3</code>). Comprueba primero qué versión ofrece tu repositorio:</p>

  <?= term('<span class="p">$</span> pacman -Si nmap <span class="c"># información del paquete, sin instalar</span>' . "\n"
         . '<span class="p">$</span> sudo pacman -S nmap') ?>

  <p>El paquete instala tres programas: <code>nmap</code>, <code>ncat</code> (una navaja
  suiza de conexiones TCP/UDP) y <code>nping</code> (generador de sondas). Este curso usa
  solo <code>nmap</code>. La herramienta <code>ndiff</code>, que compara escaneos, va en un
  paquete aparte del mismo nombre; la verás en el nivel 6.</p>

  <p>En otras distribuciones: <code>sudo apt install nmap</code> (Debian/Ubuntu) o
  <code>sudo dnf install nmap</code> (Fedora).</p>

  <h3>Tres comandos para saber con qué trabajas</h3>

  <?= term('<span class="p">$</span> nmap --version') ?>
  <?= term('Nmap version 7.991 ( https://nmap.org )' . "\n"
         . 'Platform: x86_64-pc-linux-gnu' . "\n"
         . 'Compiled with: liblua-5.4.8 openssl-3.6.4 libssh2-1.11.1 libz-1.3.2 libpcre2-10.48 libpcap-1.10.7 nmap-libdnet-1.18.0 ipv6' . "\n"
         . 'Compiled without:' . "\n"
         . 'Available nsock engines: epoll poll select', 'salida real') ?>

  <p><code>--version</code> (o <code>-V</code>) te da la versión exacta y, lo más útil, con
  qué se compiló: <code>liblua</code> significa que el motor de scripts NSE está disponible;
  <code>openssl</code>, que puede hablar TLS para detectar servicios cifrados;
  <code>libpcap</code>, que puede construir y capturar paquetes en bruto. Si alguna vez un
  tutorial describe una opción que tu Nmap no reconoce, empieza por aquí.</p>

  <?= term('<span class="p">$</span> nmap --help') ?>

  <p><code>--help</code> (o <code>-h</code>) imprime un resumen de una pantalla, agrupado
  por bloques: <em>TARGET SPECIFICATION, HOST DISCOVERY, SCAN TECHNIQUES, PORT
  SPECIFICATION, SERVICE/VERSION DETECTION, SCRIPT SCAN, OS DETECTION, TIMING, OUTPUT</em>.
  Es el mismo orden que sigue este curso. Úsalo como índice rápido cuando recuerdes que
  una opción existe pero no su letra.</p>

  <?= term('<span class="p">$</span> man nmap') ?>

  <p><code>man nmap</code> es el manual completo: unas dos mil cuatrocientas líneas con la
  explicación de cada opción. Dentro de <code>man</code>, pulsa <kbd>/</kbd> y escribe un
  término (por ejemplo <code>-sS</code>) para buscar, <kbd>n</kbd> para la siguiente
  coincidencia y <kbd>q</kbd> para salir. Es la fuente de verdad de tu versión instalada:
  cuando algo de este curso y el manual discrepen, gana el manual.</p>

  <h3>Dónde vive cada cosa</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Rutas de los archivos de Nmap en Arch/CachyOS</caption>
      <thead><tr><th scope="col">Ruta</th><th scope="col">Qué contiene</th></tr></thead>
      <tbody>
        <tr><td class="f">/usr/bin/nmap</td><td class="d">El programa</td></tr>
        <tr><td class="f">/usr/share/nmap/nmap-services</td><td class="d">Tabla puerto → nombre de servicio, con la frecuencia de cada puerto</td></tr>
        <tr><td class="f">/usr/share/nmap/nmap-service-probes</td><td class="d">Las sondas y firmas que usa <code>-sV</code> para reconocer software</td></tr>
        <tr><td class="f">/usr/share/nmap/nmap-os-db</td><td class="d">Huellas de sistemas operativos para <code>-O</code></td></tr>
        <tr><td class="f">/usr/share/nmap/nmap-mac-prefixes</td><td class="d">Fabricante asociado a cada prefijo de dirección MAC</td></tr>
        <tr><td class="f">/usr/share/nmap/scripts/</td><td class="d">Los scripts NSE (611 en la 7.991) y su índice <code>script.db</code></td></tr>
        <tr><td class="f">/usr/share/nmap/nselib/</td><td class="d">Bibliotecas Lua que usan los scripts</td></tr>
      </tbody>
    </table>
  </div>

  <?= nm_ficha([
      'Cuándo usarlo' => '<code>--version</code> al empezar en una máquina nueva; <code>--help</code> como chuleta; <code>man nmap</code> antes de usar una opción por primera vez.',
      'Qué NO significa' => 'Que una opción aparezca en un blog no significa que exista en tu versión, ni que signifique lo mismo. Contrasta siempre con <code>man nmap</code>.',
      'Ciberseguridad' => 'Anota la versión de Nmap en cada informe: las bases de firmas cambian entre versiones y un mismo servicio puede identificarse distinto.',
      'Error común' => 'Copiar comandos de tutoriales antiguos con opciones renombradas (por ejemplo, <code>-P0</code> y <code>-PN</code> son nombres viejos de <code>-Pn</code>).',
      'Mini práctica' => 'Ejecuta <code>man nmap</code>, busca <code>/PORT STATES</code> y lee los seis estados. Volverás a ellos en la sección 09.',
  ]) ?>
</section>

<!-- =========================== PRIVILEGIOS =========================== -->
<section id="privilegios">
  <h2>Privilegios: con y sin sudo</h2>
  <p class="tut-sub">Por qué algunos comandos piden root y otros no, y por qué no conviene usar sudo para todo.</p>

  <p>Para abrir una conexión TCP normal, cualquier programa le pide al sistema operativo
  que lo haga (la llamada <code>connect()</code>): así funcionan el navegador, <code>ssh</code>
  y <code>curl</code>. Nmap puede trabajar así, sin privilegios. Pero muchas de sus técnicas
  necesitan <strong>construir paquetes a mano</strong> y leer respuestas en bruto, y en
  Linux eso exige privilegios de administrador (sockets <em>raw</em>).</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Qué opciones de Nmap requieren privilegios</caption>
      <thead><tr><th scope="col">Opción</th><th scope="col">¿Root?</th><th scope="col">Qué ocurre sin él (Nmap 7.991)</th></tr></thead>
      <tbody>
        <tr><td class="f">nmap objetivo</td><td class="d">No</td><td class="d">Usa <code>-sT</code> (connect) en vez de <code>-sS</code>. Funciona.</td></tr>
        <tr><td class="f">-sT · -sV · -sC · -oA</td><td class="d">No</td><td class="d">Funcionan igual.</td></tr>
        <tr><td class="f">-sn</td><td class="d">No, pero cambia</td><td class="d">Sin root solo intenta conectar a 80 y 443; con root usa ICMP, ARP en la LAN y más sondas.</td></tr>
        <tr><td class="f">-sS</td><td class="d">Sí</td><td class="d"><code>You requested a scan type which requires root privileges. QUITTING!</code></td></tr>
        <tr><td class="f">-sU</td><td class="d">Sí</td><td class="d">El mismo mensaje.</td></tr>
        <tr><td class="f">-O</td><td class="d">Sí</td><td class="d"><code>TCP/IP fingerprinting (for OS scan) requires root privileges. QUITTING!</code></td></tr>
        <tr><td class="f">--traceroute</td><td class="d">Sí</td><td class="d"><code>Traceroute has to be run as root QUITTING!</code></td></tr>
        <tr><td class="f">-A</td><td class="d">Parcial</td><td class="d">Activa lo que puede; <code>-O</code> y traceroute solo si hay privilegios.</td></tr>
      </tbody>
    </table>
  </div>

  <p>Los mensajes de la tabla son los reales de la versión 7.991 al ejecutarla como usuario
  normal. Son útiles: si los ves, no es un fallo, es Nmap diciéndote qué técnica exige
  root.</p>

  <?= note('sudo solo cuando la técnica lo exige',
      '<p>Nmap es un programa grande que procesa respuestas de red, es decir, datos que
      controla otro equipo. Ejecutarlo como root cuando no hace falta amplía sin motivo lo
      que un fallo podría afectar. Regla del curso: empieza sin <code>sudo</code>; añádelo
      solo para <code>-sS</code>, <code>-sU</code>, <code>-O</code> y
      <code>--traceroute</code>, y sabiendo por qué.</p>') ?>

  <p>Un detalle que confunde al principio: <strong>el mismo comando da resultados
  distintos con y sin sudo</strong>. <code>nmap 192.168.56.10</code> sin privilegios hace
  un connect scan; con <code>sudo</code> hace un SYN scan. Normalmente los estados coinciden,
  pero la razón que da Nmap para cada uno cambia (<code>conn-refused</code> frente a
  <code>reset</code>) y el rastro en los registros del objetivo también. Por eso en este
  curso siempre escribiremos la técnica explícitamente.</p>
</section>

<!-- ============================= TCP/UDP ============================= -->
<section id="tcp-udp">
  <h2>TCP y UDP, lo justo para Nmap</h2>
  <p class="tut-sub">Los dos transportes se comportan distinto, y por eso sus escaneos también.</p>

  <p>Un <strong>puerto</strong> es un número de 0 a 65535 que identifica a qué programa va
  dirigido un paquete dentro de un equipo. La IP te lleva a la casa; el puerto, a la
  habitación. Hay 65536 puertos TCP y otros 65536 UDP, independientes entre sí: el 53/tcp y
  el 53/udp son dos puertas diferentes.</p>

  <div class="panes panes--2">
    <div>
      <p class="panes__name">TCP · con conexión</p>
      <p class="panes__text">Antes de enviar datos, los dos extremos se ponen de acuerdo con
      un <b>saludo en tres pasos</b>. Si nadie escucha en el puerto, el sistema operativo
      contesta con un <b>RST</b> («aquí no hay nadie»). Hay respuesta en casi todos los
      casos, así que Nmap puede distinguir bien abierto, cerrado y filtrado. Es fiable:
      confirma, ordena y retransmite. Web, SSH, correo y bases de datos van por TCP.</p>
    </div>
    <div>
      <p class="panes__name">UDP · sin conexión</p>
      <p class="panes__text">Se envía un datagrama y ya está: no hay saludo ni confirmación.
      Un servicio abierto <b>puede no contestar nada</b> si el paquete no le dice nada útil.
      Un puerto cerrado suele provocar un mensaje <b>ICMP «port unreachable»</b>, pero los
      sistemas limitan cuántos envían por segundo. Resultado: escanear UDP es lento y
      ambiguo. DNS, NTP, DHCP y SNMP van por UDP.</p>
    </div>
  </div>

  <h3>El saludo de tres vías</h3>

  <figure class="tut-figure">
    <svg viewBox="0 0 480 214" role="img"
         aria-label="Handshake TCP: el cliente envía SYN al puerto 22 del servidor, el servidor responde SYN/ACK y el cliente confirma con ACK; la conexión queda abierta.">
      <text x="58" y="18" font-family="JetBrains Mono, monospace" font-size="11" fill="var(--dv-text-primary)" text-anchor="middle">cliente</text>
      <text x="422" y="18" font-family="JetBrains Mono, monospace" font-size="11" fill="var(--dv-text-primary)" text-anchor="middle">servidor:22</text>
      <line x1="58" y1="28" x2="58" y2="204" stroke="var(--dv-border-strong)" stroke-width="1" stroke-dasharray="3 4"/>
      <line x1="422" y1="28" x2="422" y2="204" stroke="var(--dv-border-strong)" stroke-width="1" stroke-dasharray="3 4"/>
      <line x1="58" y1="62" x2="410" y2="62" stroke="var(--tl-l3)" stroke-width="1.7"/>
      <polygon points="422,62 408,57 408,67" fill="var(--tl-l3)"/>
      <text x="240" y="54" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700" fill="var(--tl-l3)" text-anchor="middle">SYN</text>
      <text x="240" y="78" font-family="JetBrains Mono, monospace" font-size="10" fill="var(--dv-text-muted)" text-anchor="middle">«¿hay alguien en el 22?»</text>
      <line x1="422" y1="120" x2="70" y2="120" stroke="var(--tl-l4)" stroke-width="1.7"/>
      <polygon points="58,120 72,115 72,125" fill="var(--tl-l4)"/>
      <text x="240" y="112" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700" fill="var(--tl-l4)" text-anchor="middle">SYN/ACK</text>
      <text x="240" y="136" font-family="JetBrains Mono, monospace" font-size="10" fill="var(--dv-text-muted)" text-anchor="middle">«sí, aquí estoy»</text>
      <line x1="58" y1="178" x2="410" y2="178" stroke="var(--tl-l7)" stroke-width="1.7"/>
      <polygon points="422,178 408,173 408,183" fill="var(--tl-l7)"/>
      <text x="240" y="170" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700" fill="var(--tl-l7)" text-anchor="middle">ACK</text>
      <text x="240" y="194" font-family="JetBrains Mono, monospace" font-size="10" fill="var(--dv-text-muted)" text-anchor="middle">conexión establecida</text>
    </svg>
    <figcaption>El SYN/ACK es la prueba de que alguien escucha. Nmap no necesita más.</figcaption>
  </figure>

  <p>Toda la detección de puertos TCP gira alrededor del segundo paquete. Si llega un
  SYN/ACK, hay un programa escuchando: <strong>abierto</strong>. Si llega un RST, el equipo
  existe pero nadie escucha: <strong>cerrado</strong>. Si no llega nada, algo se tragó el
  paquete por el camino: <strong>filtrado</strong>.</p>

  <h3>Qué puede pasar con un datagrama UDP</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Respuestas posibles a una sonda UDP y su interpretación</caption>
      <thead><tr><th scope="col">Respuesta a la sonda</th><th scope="col">Estado que asigna Nmap</th></tr></thead>
      <tbody>
        <tr><td class="d">El servicio contesta con UDP</td><td class="f">open</td></tr>
        <tr><td class="d">ICMP tipo 3, código 3 (port unreachable)</td><td class="f">closed</td></tr>
        <tr><td class="d">Otro ICMP «unreachable» (códigos 0, 1, 2, 9, 10 o 13)</td><td class="f">filtered</td></tr>
        <tr><td class="d">Nada, ni tras reintentar</td><td class="f">open|filtered</td></tr>
      </tbody>
    </table>
  </div>

  <p>La última fila es la clave de UDP: el silencio no se puede interpretar. Un servicio
  abierto que ignora un paquete que no entiende y un firewall que lo descarta producen
  exactamente lo mismo: nada.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Comparativa entre TCP y UDP desde el punto de vista de Nmap</caption>
      <thead><tr><th scope="col">Aspecto</th><th scope="col">TCP</th><th scope="col">UDP</th></tr></thead>
      <tbody>
        <tr><td class="f">Conexión</td><td class="d">Saludo de tres vías</td><td class="d">Ninguna</td></tr>
        <tr><td class="f">Respuesta de un puerto cerrado</td><td class="d">RST inmediato</td><td class="d">ICMP port unreachable, con límite de ritmo</td></tr>
        <tr><td class="f">Respuesta de un puerto abierto</td><td class="d">SYN/ACK siempre</td><td class="d">Solo si la sonda le dice algo al servicio</td></tr>
        <tr><td class="f">Tiempo de escaneo</td><td class="d">Segundos</td><td class="d">Minutos u horas</td></tr>
        <tr><td class="f">Ambigüedad</td><td class="d">Baja</td><td class="d">Alta: abundan los <code>open|filtered</code></td></tr>
      </tbody>
    </table>
  </div>
</section>

<!-- ============================ PRIMER =============================== -->
<section id="primer">
  <h2>Primer escaneo: tu propio equipo</h2>
  <p class="tut-sub">localhost: el único objetivo al que siempre tienes permiso y donde nada sale a la red.</p>

  <p><strong>Objetivo:</strong> <code>localhost</code> es el nombre que tu sistema da a sí
  mismo, y <code>127.0.0.1</code> su dirección IPv4 de bucle local (<em>loopback</em>).
  Los paquetes que envías ahí no tocan la tarjeta de red: el sistema se los entrega a sí
  mismo. Es el laboratorio perfecto para empezar.</p>

  <?= term('<span class="p">$</span> nmap localhost') ?>
  <?= term('Starting Nmap 7.991 ( https://nmap.org ) at 2026-09-10 16:24 -0600' . "\n"
         . 'Warning: Hostname localhost resolves to 2 IPs. Using 127.0.0.1.' . "\n"
         . 'Nmap scan report for localhost (127.0.0.1)' . "\n"
         . 'Host is up (0.000030s latency).' . "\n"
         . 'Other addresses for localhost (not scanned): ::1' . "\n"
         . 'Not shown: 998 closed tcp ports (conn-refused)' . "\n"
         . 'PORT     STATE SERVICE' . "\n"
         . '5432/tcp <span class="st-open">open</span>  postgresql' . "\n"
         . '8090/tcp <span class="st-open">open</span>  opsmessaging' . "\n\n"
         . 'Nmap done: 1 IP address (1 host up) scanned in 0.02 seconds', 'salida real · la tuya será distinta') ?>

  <p>Tu salida tendrá otros puertos: depende de lo que tengas instalado. Lo que importa es
  aprender a leerla, línea a línea:</p>

  <?= steps([
      '<code>Warning: Hostname localhost resolves to 2 IPs</code> — <code>localhost</code> tiene dirección IPv4 (<code>127.0.0.1</code>) e IPv6 (<code>::1</code>). Nmap escanea solo la primera de la familia en uso (IPv4 por defecto) y te lo avisa. La línea <code>Other addresses … (not scanned): ::1</code> repite la idea.',
      '<code>Nmap scan report for localhost (127.0.0.1)</code> — empieza el informe de un objetivo: nombre y, entre paréntesis, la IP realmente analizada.',
      '<code>Host is up (0.000030s latency)</code> — el descubrimiento de host obtuvo respuesta. La latencia es el tiempo de ida y vuelta: 30 microsegundos, porque no hay red de por medio.',
      '<code>Not shown: 998 closed tcp ports (conn-refused)</code> — de los 1000 puertos analizados, 998 están cerrados y no se listan para no llenar la pantalla. Entre paréntesis, la razón: la conexión fue rechazada (el equivalente al RST en un connect scan).',
      'La tabla <code>PORT STATE SERVICE</code> muestra solo lo interesante: dos puertos abiertos.',
      '<code>Nmap done: 1 IP address (1 host up) scanned in 0.02 seconds</code> — resumen: cuántas IP, cuántas activas y cuánto tardó.',
  ]) ?>

  <h3>La misma pregunta por IP</h3>

  <?= term('<span class="p">$</span> nmap 127.0.0.1') ?>

  <p>El resultado es el mismo, pero sin el aviso de las dos direcciones: al dar la IP no hay
  nada que resolver. Buena costumbre profesional: <strong>usa IP en los escaneos</strong> y
  deja los nombres para los informes. Un nombre puede resolver a otra IP mañana; una IP es
  inequívoca.</p>

  <?= note('¿Qué son esos puertos?',
      '<p>Nmap te dice que hay algo escuchando en el 5432, pero ¿qué programa exactamente?
      En tu propio equipo lo puedes preguntar al sistema, que sí lo sabe:</p>
      <p><code>ss -tlnp</code> lista los sockets TCP en escucha con el proceso dueño (con
      <code>sudo</code> verás también los procesos de otros usuarios). Comparar lo que ve
      Nmap desde fuera con lo que dice <code>ss</code> desde dentro es el primer ejercicio
      de administración que hace cualquiera.</p>', 'info') ?>

  <?= nm_ficha([
      'Cuándo usarlo' => 'Siempre como primera prueba en una máquina nueva: confirma que Nmap funciona y te enseña qué expone tu propio equipo.',
      'Qué NO significa' => 'Lo abierto en <code>127.0.0.1</code> no está necesariamente abierto hacia la red. Un servicio puede escuchar solo en loopback; para saber qué ve la LAN hay que escanear tu IP de red desde otra máquina.',
      'Ciberseguridad' => 'Un servicio que no reconoces escuchando en tu equipo merece una pregunta: ¿qué es, quién lo instaló, necesita estar ahí?',
      'Error común' => 'Asumir que la columna SERVICE es cierta. Aquí dice <code>opsmessaging</code> para el 8090, y en esta máquina es un Apache. Lo verás en la sección de puertos comunes.',
      'Mini práctica' => 'Ejecuta <code>nmap 127.0.0.1</code> y luego <code>ss -tlnp</code>. Empareja cada puerto abierto con su proceso.',
  ]) ?>

  <h3>Tu primer escaneo, en pantalla</h3>

  <?= shot('nmap/05-primer-escaneo.svg',
      'Terminal con la salida de nmap -sV 127.0.0.1: la cabecera de versión, Host is up, '
      . 'la línea Not shown con 998 puertos cerrados y dos puertos abiertos, 5432 con '
      . 'PostgreSQL y 8090 con Apache httpd 2.4.68.',
      '<b>Qué estás viendo:</b> la salida real de este laboratorio, sin retocar. '
      . '<b>Dónde mirar:</b> la línea <code>Not shown</code> — Nmap probó mil puertos y '
      . 'resume novecientos noventa y ocho en un renglón para que puedas leer los dos que '
      . 'importan.',
      'real') ?>

  <?= anatomy(
      '<b>nmap</b> <i>-sV</i> <u>-p 8090</u> 127.0.0.1',
      [
          ['nmap', 'El programa. Todo lo demás son opciones suyas.'],
          ['-sV', 'Qué quiero averiguar: no solo si el puerto responde, sino <em>qué</em> responde. Nmap abre la conexión y lee el saludo del servicio.'],
          ['-p 8090', 'Dónde quiero mirar. Sin <code>-p</code>, Nmap prueba los mil puertos más frecuentes — no los 65 535, que es la suposición habitual y es falsa.'],
          ['127.0.0.1', 'A quién se lo pregunto. Tu propio equipo: el tráfico no sale de la máquina.'],
      ],
      'Anatomía del comando') ?>

  <?= shot('nmap/01-anatomia-comando.svg',
      'El comando nmap -sV -p 8090 127.0.0.1 con cada una de sus cuatro piezas conectada '
      . 'por una línea a su explicación: el programa, qué averiguar, dónde mirar y contra quién.',
      '<b>Dónde mirar:</b> el orden. Un comando de Nmap siempre se lee igual — programa, '
      . 'técnica, puertos, objetivo — y una vez lo ves así, cualquier comando del manual '
      . 'se descompone solo.') ?>

</section>

<!-- ============================ SALIDA =============================== -->
<section id="salida">
  <h2>Anatomía de la salida</h2>
  <p class="tut-sub">Cuatro columnas que dicen más de lo que parece, y una que miente a menudo.</p>

  <?= term('PORT     STATE    SERVICE' . "\n"
         . '22/tcp   <span class="st-open">open</span>     ssh' . "\n"
         . '80/tcp   <span class="st-closed">closed</span>   http' . "\n"
         . '443/tcp  <span class="st-filt">filtered</span> https', 'salida ilustrativa') ?>

  <h3>PORT</h3>
  <p>El número de puerto: <code>22</code>, <code>80</code>, <code>443</code>. Identifica la
  «puerta» dentro del equipo. Los puertos 0–1023 se llaman <em>bien conocidos</em> y en
  Linux solo root puede abrirlos para escuchar; los 1024–49151, <em>registrados</em>; y los
  49152–65535, <em>dinámicos</em> o efímeros, los que usa tu equipo como origen de sus
  conexiones salientes.</p>

  <h3>Protocolo</h3>
  <p>Lo que va detrás de la barra: <code>/tcp</code> o <code>/udp</code> (o <code>/sctp</code>,
  raro fuera de telecomunicaciones). Nunca lo omitas al anotar un hallazgo: «el 53 está
  abierto» es ambiguo; «53/udp open» no.</p>

  <h3>STATE</h3>
  <p>La conclusión de Nmap sobre ese puerto a partir de la respuesta que obtuvo. Es la
  columna más importante y la que más se malinterpreta; tiene su propia sección a
  continuación.</p>

  <h3>SERVICE</h3>
  <p>Aquí está la trampa. <strong>Sin <code>-sV</code>, esta columna no es una
  detección</strong>: Nmap busca el número de puerto en su archivo
  <code>nmap-services</code> y escribe el nombre que suele usarse ahí. Si montas un servidor
  web en el 22, Nmap dirá <code>ssh</code>. Si tu Apache escucha en el 8090, dirá
  <code>opsmessaging</code>, porque así está registrado ese número. Con <code>-sV</code> la
  columna pasa a ser una deducción basada en lo que el servicio realmente contesta, y
  aparece una quinta columna, <code>VERSION</code>.</p>

  <h3>Las otras líneas del informe</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Líneas habituales del informe de Nmap</caption>
      <thead><tr><th scope="col">Línea</th><th scope="col">Qué dice</th></tr></thead>
      <tbody>
        <tr><td class="f">Host is up (0.00041s latency)</td><td class="d">El host respondió al descubrimiento, y cuánto tardó.</td></tr>
        <tr><td class="f">Not shown: 997 closed tcp ports (reset)</td><td class="d">Puertos agrupados por ser mayoría en un mismo estado, con su razón.</td></tr>
        <tr><td class="f">All 1000 scanned ports … are in ignored states.</td><td class="d">No hay nada que listar: todos cerrados o filtrados.</td></tr>
        <tr><td class="f">MAC Address: 08:00:27:… (Oracle VirtualBox virtual NIC)</td><td class="d">Solo en tu misma red local: la MAC y el fabricante deducido de su prefijo.</td></tr>
        <tr><td class="f">Service Info: OS: Linux; CPE: …</td><td class="d">Pistas de sistema operativo sacadas de los servicios (con <code>-sV</code>).</td></tr>
        <tr><td class="f">Note: Host seems down.</td><td class="d">El descubrimiento no obtuvo respuesta. No significa que esté apagado; ver <code>-Pn</code>.</td></tr>
      </tbody>
    </table>
  </div>

  <h3>La salida, bloque por bloque</h3>

  <?= shot('nmap/02-anatomia-salida.svg',
      'Salida real de Nmap contra 127.0.0.1 con cinco marcas numeradas: la cabecera de '
      . 'versión y hora, la línea del objetivo, el estado del host con su razón, la tabla '
      . 'de puertos y el resumen final.',
      '<b>Dónde mirar:</b> el bloque 4. Todo lo demás es contexto; la tabla de puertos es '
      . 'el 90 % de lo que vas a leer en tu vida.',
      'real') ?>

  <?= callouts([
      ['Versión y hora', 'Parece decoración y no lo es: en una auditoría esa línea fecha la prueba. Si alguien pregunta «¿cuándo estaba así ese servidor?», la respuesta está aquí.'],
      ['El objetivo', 'Nombre resuelto y dirección. Si solo aparece la IP, es que la resolución inversa no devolvió nada — dato en sí mismo.'],
      ['Estado del host y su razón', 'Con <code>--reason</code>, Nmap dice <em>por qué</em> cree que está vivo. <code>conn-refused</code> también demuestra que hay alguien: una negativa exige a alguien que la dé.'],
      ['La tabla de puertos', 'Una línea por puerto consultado. STATE es lo que te dice la verdad; SERVICE es una etiqueta sacada de un fichero.'],
      ['El resumen', 'Cuántos objetivos, cuántos vivos y cuánto tardó. Un escaneo que termina mucho antes de lo esperado suele haberse truncado.'],
  ]) ?>

  <?= pitfall('<p>Leer la columna <strong>SERVICE</strong> como si fuera una detección.
      No lo es: Nmap busca el número de puerto en <code>/usr/share/nmap/nmap-services</code>
      y escribe lo que pone ahí. En la salida real de arriba, el puerto 8090 aparece como
      <code>opsmessaging</code> — y lo que hay detrás es un servidor Apache. Para saber qué
      hay de verdad hace falta <code>-sV</code>.</p>') ?>

</section>

<!-- ============================ ESTADOS ============================== -->
<section id="estados">
  <h2>Los seis estados de puerto</h2>
  <p class="tut-sub">Nmap no ve el puerto: ve la respuesta a su sonda. El estado es lo que puede deducir de ella.</p>

  <div class="nm-states">
    <div class="nm-state nm-state--open">
      <code>open</code>
      <p>Un programa acepta conexiones (TCP) o datagramas (UDP) en ese puerto. Hubo una
      respuesta positiva: SYN/ACK en TCP o una respuesta UDP del servicio.</p>
    </div>
    <div class="nm-state nm-state--closed">
      <code>closed</code>
      <p>El puerto es alcanzable y el equipo contestó, pero nadie escucha. En TCP llegó un
      RST; en UDP, un ICMP port unreachable. Demuestra que el host está vivo.</p>
    </div>
    <div class="nm-state nm-state--filt">
      <code>filtered</code>
      <p>Algo impide que la sonda llegue o que vuelva la respuesta: no llegó nada tras
      varios intentos, o llegó un ICMP de «prohibido». Nmap no puede saber qué hay detrás.</p>
    </div>
    <div class="nm-state nm-state--unf">
      <code>unfiltered</code>
      <p>El puerto es alcanzable pero Nmap no puede decir si está abierto o cerrado. Solo lo
      produce el ACK scan (<code>-sA</code>), que sirve para estudiar reglas de firewall.</p>
    </div>
    <div class="nm-state nm-state--of">
      <code>open|filtered</code>
      <p>No hubo respuesta en una técnica en la que un puerto abierto <em>tampoco</em>
      responde. Típico de UDP: puede estar abierto o filtrado, y Nmap no puede decidir.</p>
    </div>
    <div class="nm-state nm-state--cf">
      <code>closed|filtered</code>
      <p>No se puede decidir entre cerrado y filtrado. Según el manual, solo aparece en el
      <em>idle scan</em>, una técnica fuera del alcance de este curso. No lo verás.</p>
    </div>
  </div>

  <h3>Tabla de interpretación</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Qué significa cada estado, qué no significa y causas posibles</caption>
      <thead><tr><th scope="col">Estado</th><th scope="col">Cómo lo sabe Nmap</th><th scope="col">Qué NO significa</th><th scope="col">Causas posibles</th></tr></thead>
      <tbody>
        <tr><td class="f">open</td><td class="d">Respuesta positiva del servicio (SYN/ACK, respuesta UDP)</td><td class="d">Que sea vulnerable, que sea accesible sin credenciales, ni que el servicio sea el que dice la columna SERVICE</td><td class="d">Servicio legítimo, servicio olvidado, software instalado sin saberlo, un redirector o balanceador que acepta en nombre de otro</td></tr>
        <tr><td class="f">closed</td><td class="d">RST (TCP) o ICMP port unreachable (UDP)</td><td class="d">Que el equipo esté protegido: un puerto cerrado responde, y eso ya revela que el host existe</td><td class="d">Nadie escucha; el servicio está parado; escucha solo en otra interfaz</td></tr>
        <tr><td class="f">filtered</td><td class="d">Silencio tras reintentos, o ICMP unreachable de tipo «prohibido»</td><td class="d">Que el puerto esté cerrado, ni que esté abierto. Tampoco que el equipo esté apagado</td><td class="d">Firewall local (nftables, firewalld), firewall de red, ACL de router, grupo de seguridad cloud, pérdida de paquetes, rate limiting</td></tr>
        <tr><td class="f">unfiltered</td><td class="d">RST en respuesta a un ACK (<code>-sA</code>)</td><td class="d">Que esté abierto</td><td class="d">El firewall deja pasar ese tráfico hacia ese puerto</td></tr>
        <tr><td class="f">open|filtered</td><td class="d">Silencio en técnicas donde lo abierto también calla (UDP)</td><td class="d">Que haya un servicio. Tampoco que haya firewall</td><td class="d">Servicio UDP que ignora la sonda, firewall que descarta, ICMP bloqueado a la vuelta</td></tr>
        <tr><td class="f">closed|filtered</td><td class="d">Ambigüedad propia del idle scan</td><td class="d">—</td><td class="d">Solo en esa técnica</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('closed y filtered no son lo mismo, y la diferencia importa',
      '<p>Un puerto <code>closed</code> te dice: «aquí hay un equipo y me ha contestado que no
      hay nada». Un puerto <code>filtered</code> te dice: «algo en el camino no me deja
      saberlo». Cuando configures un firewall en el nivel 7, verás un puerto pasar de
      <code>closed</code> a <code>filtered</code> sin que el servicio haya cambiado en
      absoluto. Es la señal de que la regla funciona.</p>') ?>

  <h3>La razón de cada estado</h3>

  <p>Nmap puede decirte <em>por qué</em> puso cada estado con <code>--reason</code>. Lo
  verás a fondo en el nivel 2, pero conviene conocerlo ya, porque convierte la tabla de
  arriba en algo que puedes comprobar:</p>

  <?= term('<span class="p">$</span> nmap --reason -p 22,53,80,443,5432,8090 127.0.0.1') ?>
  <?= term('Nmap scan report for localhost (127.0.0.1)' . "\n"
         . 'Host is up, received conn-refused (0.000022s latency).' . "\n\n"
         . 'PORT     STATE  SERVICE      REASON' . "\n"
         . '22/tcp   <span class="st-closed">closed</span> ssh          conn-refused' . "\n"
         . '53/tcp   <span class="st-closed">closed</span> domain       conn-refused' . "\n"
         . '80/tcp   <span class="st-closed">closed</span> http         conn-refused' . "\n"
         . '443/tcp  <span class="st-closed">closed</span> https        conn-refused' . "\n"
         . '5432/tcp <span class="st-open">open</span>   postgresql   syn-ack' . "\n"
         . '8090/tcp <span class="st-open">open</span>   opsmessaging syn-ack', 'salida real') ?>

  <p><code>syn-ack</code>: llegó el segundo paquete del saludo, luego hay alguien.
  <code>conn-refused</code>: el sistema rechazó la conexión, luego no hay nadie. Fíjate
  además en la primera línea: el host se da por activo <em>porque</em> un puerto cerrado
  contestó. Un puerto cerrado también es información.</p>

  <h3>Los seis estados, con su estímulo y su respuesta</h3>

  <?= shot('nmap/03-estados-puerto.svg',
      'Los seis estados que informa Nmap —open, closed, filtered, unfiltered, '
      . 'open|filtered y closed|filtered— cada uno con el paquete enviado, la respuesta '
      . 'recibida y lo que significa.',
      '<b>Dónde mirar:</b> la columna de respuestas. Los estados no son opiniones de Nmap: '
      . 'son la traducción directa de lo que llegó de vuelta — o de que no llegó nada.') ?>

  <?= evidence(
      '<p>Un puerto aparece como <code>filtered</code>.</p>',
      '<p>Algo descartó el paquete sin contestar: casi siempre un cortafuegos, en el
      objetivo o en el camino.</p>',
      '<p>Si hay un servicio escuchando detrás. <code>filtered</code> significa
      exactamente <em>«no obtuve respuesta»</em>, y ese silencio es idéntico tanto si hay un
      servidor detrás del filtro como si no hay absolutamente nada. Tampoco se puede afirmar
      <em>dónde</em> está el filtro: puede ser el propio equipo o cualquier salto
      intermedio.</p>') ?>

  <?= pitfall('<p>Tratar <code>filtered</code> como un fallo del escaneo o como «no
      concluyente, prueba otra vez». Es un resultado con contenido: dice que hay una
      decisión activa de no dejar pasar ese tráfico. En una auditoría de cortafuegos,
      <code>filtered</code> es justamente el resultado que querías.</p>') ?>

</section>

  <?= recap('Nivel 0 · Fundamentos', [
      'Nmap <strong>deduce</strong> desde fuera: observa cómo responde un equipo y lo interpreta. Nunca «entra» a comprobar nada.',
      'La autorización es la primera opción, y no se escribe en la terminal. Sin ella no se escanea.',
      'Un comando se lee siempre igual: programa, técnica, puertos, objetivo.',
      'Por defecto Nmap prueba los 1 000 puertos más frecuentes, no los 65 535.',
      'STATE dice lo que ocurrió; SERVICE es una etiqueta sacada de un fichero por el número de puerto.',
  ], [
      'nmap 127.0.0.1',
      'nmap --reason -p 22,80,443 127.0.0.1',
      'ss -tlnp',
  ], [
      'La diferencia entre <code>closed</code> (alguien dijo que no) y <code>filtered</code> (nadie dijo nada).',
      'La línea <code>Not shown</code>, que resume los puertos que no merecieron renglón propio.',
      'Que un puerto abierto es <em>exposición</em>, no una vulnerabilidad.',
  ]) ?>

  <?= quiz([
      [
          'q' => 'Nmap informa 8090/tcp open opsmessaging. ¿Qué has averiguado?',
          'opts' => ['A' => 'Que hay un servicio de mensajería escuchando', 'B' => 'Que hay algo escuchando en el 8090, sin saber qué', 'C' => 'Que el puerto está mal configurado', 'D' => 'Que el equipo es vulnerable'],
          'ok' => 'B',
          'why' => 'La columna SERVICE sale de una tabla de nombres habituales por número de puerto; no hubo ninguna comprobación. En la salida real de este tutorial, ese mismo puerto lo sirve un Apache. Para saber qué hay de verdad, <code>-sV</code>.',
      ],
      [
          'q' => 'Escaneas un equipo y todos los puertos salen filtered. ¿Qué puedes concluir?',
          'opts' => ['A' => 'Que el equipo está apagado', 'B' => 'Que no hay ningún servicio', 'C' => 'Que algo descarta tus paquetes, y nada más', 'D' => 'Que el escaneo falló'],
          'ok' => 'C',
          'why' => 'Es la conclusión exacta y la única sostenible. Un equipo apagado, un cortafuegos que descarta en silencio y un servidor lleno de servicios detrás de un filtro producen la misma evidencia: nada. Distinguirlos requiere otra vía —otro punto de observación, otra técnica o acceso al propio equipo—.',
      ],
      [
          'q' => 'Ejecutas nmap 192.168.56.10 sin ninguna opción más. ¿Cuántos puertos se han probado?',
          'opts' => ['A' => 'Los 65 535', 'B' => 'Los 1 000 más frecuentes', 'C' => 'Solo los 100 más frecuentes', 'D' => 'Solo 80 y 443'],
          'ok' => 'B',
          'why' => 'Es la suposición que más veces lleva a un falso «aquí no hay nada». Los mil más frecuentes cubren casi todo lo habitual, pero un servicio en un puerto raro no aparece. Para los 65 535 hay que pedirlo: <code>-p-</code>.',
      ],
  ]) ?>


<?= nm_nivel('1', 'Descubrimiento', 'Saber a qué rango apuntas, qué contiene y qué equipos están vivos, antes de tocar un solo puerto.', 'fundamentos') ?>

<!-- ============================== CIDR =============================== -->
<section id="cidr">
  <h2>CIDR, lo justo para Nmap</h2>
  <p class="tut-sub">Una barra y un número deciden si escaneas un equipo, doscientos cincuenta y seis o sesenta y cinco mil.</p>

  <p>Una dirección IPv4 son 32 bits, escritos como cuatro números de 0 a 255 separados por
  puntos. En la notación <strong>CIDR</strong>, el número tras la barra dice cuántos de esos
  32 bits, empezando por la izquierda, son fijos e identifican la <strong>red</strong>. Los
  que sobran identifican al <strong>host</strong> dentro de ella y pueden variar.</p>

  <figure class="nm-cidr">
    <div class="nm-cidr__row"><span class="nm-cidr__k">dirección</span><span>192.168.56.0/24</span></div>
    <div class="nm-cidr__row"><span class="nm-cidr__k">bits</span><span><span class="nm-cidr__net">11000000.10101000.00111000</span>.<span class="nm-cidr__host">00000000</span></span></div>
    <div class="nm-cidr__row"><span class="nm-cidr__k">máscara</span><span><span class="nm-cidr__net">255.255.255</span>.<span class="nm-cidr__host">0</span></span></div>
    <div class="nm-cidr__row"><span class="nm-cidr__k">rango</span><span><span class="nm-cidr__net">192.168.56</span>.<span class="nm-cidr__host">0 – 255</span></span></div>
    <figcaption>/24: los 24 primeros bits (azul) son la red; los 8 últimos (verde) varían. 2⁸ = 256 direcciones.</figcaption>
  </figure>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Prefijos CIDR habituales y cuántas direcciones cubren</caption>
      <thead><tr><th scope="col">Prefijo</th><th scope="col">Máscara</th><th scope="col">Direcciones</th><th scope="col">Hosts utilizables</th><th scope="col">Ejemplo y rango</th></tr></thead>
      <tbody>
        <tr><td class="f">/32</td><td class="d">255.255.255.255</td><td class="d">1</td><td class="d">1 (un solo equipo)</td><td class="d">192.168.56.10/32 → solo esa IP</td></tr>
        <tr><td class="f">/30</td><td class="d">255.255.255.252</td><td class="d">4</td><td class="d">2</td><td class="d">192.168.56.0/30 → .0 a .3</td></tr>
        <tr><td class="f">/28</td><td class="d">255.255.255.240</td><td class="d">16</td><td class="d">14</td><td class="d">192.168.56.16/28 → .16 a .31</td></tr>
        <tr><td class="f">/24</td><td class="d">255.255.255.0</td><td class="d">256</td><td class="d">254</td><td class="d">192.168.56.0/24 → .0 a .255</td></tr>
        <tr><td class="f">/16</td><td class="d">255.255.0.0</td><td class="d">65 536</td><td class="d">65 534</td><td class="d">172.16.0.0/16 → 172.16.0.0 a 172.16.255.255</td></tr>
      </tbody>
    </table>
  </div>

  <p>En una red <code>/24</code> la primera dirección (<code>.0</code>) identifica a la red y
  la última (<code>.255</code>) es la de broadcast; por eso quedan 254 para equipos. Nmap,
  sin embargo, <strong>incluye las 256 en el rango</strong>: verás «256 IP addresses» en el
  resumen.</p>

  <?= note('Por qué esto importa tanto',
      '<p>Confundir <code>/24</code> con <code>/16</code> multiplica el objetivo por 256. En
      el mejor caso el escaneo tarda horas; en el peor, analizas redes que no te
      pertenecen. Antes de lanzar un rango nuevo, compruébalo con el <em>list scan</em>
      (<code>-sL</code>), que verás dos secciones más abajo y no envía nada a los
      objetivos.</p>') ?>

  <h3>Redes privadas</h3>
  <p>Hay tres bloques reservados para redes internas, que no se enrutan por Internet:
  <code>10.0.0.0/8</code>, <code>172.16.0.0/12</code> y <code>192.168.0.0/16</code>. Casi
  todas las redes domésticas, de oficina y de laboratorio viven dentro de ellos. Que una IP
  sea privada no la hace tuya: la red del trabajo también usa estos rangos.</p>
</section>

<!-- ============================== MI RED ============================= -->
<section id="mi-red">
  <h2>Identificar tu red</h2>
  <p class="tut-sub">No escribas 192.168.1.0/24 porque lo viste en un tutorial. Mira cuál es la tuya.</p>

  <p>Dos comandos de Linux, que solo leen la configuración de tu equipo y no envían nada, te
  dan todo lo necesario:</p>

  <?= term('<span class="p">$</span> ip -brief addr') ?>
  <?= term('lo               UNKNOWN        127.0.0.1/8 ::1/128' . "\n"
         . 'enp8s0           DOWN' . "\n"
         . 'wlan0            UP             10.2.3.170/24 fe80::…/64' . "\n"
         . 'docker0          DOWN           172.17.0.1/16', 'salida real · máquina del tutorial') ?>

  <?= steps([
      '<strong>Interfaz:</strong> la primera columna. Busca la que está <code>UP</code> y tiene dirección: aquí <code>wlan0</code>. <code>lo</code> es el loopback y <code>docker0</code> el puente de Docker, sin contenedores activos.',
      '<strong>IP y prefijo:</strong> <code>10.2.3.170/24</code>. Tu equipo es el <code>.170</code> de una red <code>/24</code>.',
      '<strong>Red:</strong> pones a cero los bits de host. Con <code>/24</code> es tan fácil como cambiar el último número por 0: <code>10.2.3.0/24</code>.',
  ]) ?>

  <?= term('<span class="p">$</span> ip route') ?>
  <?= term('default via 10.2.3.1 dev wlan0 proto dhcp src 10.2.3.170 metric 600' . "\n"
         . '10.2.3.0/24 dev wlan0 proto kernel scope link src 10.2.3.170 metric 600' . "\n"
         . '172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1 linkdown', 'salida real · máquina del tutorial') ?>

  <?= steps([
      '<strong>Gateway:</strong> la línea <code>default via 10.2.3.1</code>. Es el router: todo lo que no es de tu red sale por él.',
      '<strong>Red conectada:</strong> la línea <code>10.2.3.0/24 dev wlan0 … scope link</code>. El sistema ya ha calculado la red por ti; ese es exactamente el rango CIDR que usarías.',
  ]) ?>

  <p>Si creas una red de laboratorio con VirtualBox (<em>host-only</em>), aparecerá una
  interfaz nueva, normalmente <code>vboxnet0</code> con <code>192.168.56.1/24</code>; con
  KVM/libvirt, <code>virbr0</code> con <code>192.168.122.1/24</code>. <strong>Esa es la red
  sobre la que practicarás</strong> a partir de aquí: tu equipo es el <code>.1</code> y tus
  máquinas virtuales, las demás.</p>

  <?= note('La red en la que estás no es necesariamente la tuya',
      '<p>Estar conectado a una wifi no te da permiso para auditarla. En el ejemplo, la red
      <code>10.2.3.0/24</code> es la de la máquina del tutorial y no se escanea en ningún
      ejercicio. Tus prácticas van contra <code>127.0.0.1</code> y contra la red de
      laboratorio que tú creas.</p>') ?>
</section>

<!-- ============================ OBJETIVOS ============================ -->
<section id="objetivos">
  <h2>Especificar objetivos</h2>
  <p class="tut-sub">IP sueltas, rangos, redes, listas en un archivo y exclusiones.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Formas de indicar objetivos a Nmap</caption>
      <thead><tr><th scope="col">Sintaxis</th><th scope="col">Qué analiza</th></tr></thead>
      <tbody>
        <tr><td class="f">192.168.56.10</td><td class="d">Una IP</td></tr>
        <tr><td class="f">192.168.56.10 192.168.56.20</td><td class="d">Varias, separadas por espacios</td></tr>
        <tr><td class="f">192.168.56.10-20</td><td class="d">Rango en el último octeto: de .10 a .20 (11 IP)</td></tr>
        <tr><td class="f">192.168.56.0/24</td><td class="d">Red completa en CIDR (256 IP)</td></tr>
        <tr><td class="f">lab-web.local</td><td class="d">Un nombre, que Nmap resuelve con DNS</td></tr>
        <tr><td class="f">-iL objetivos.txt</td><td class="d">Lee los objetivos de un archivo, uno por línea (admite todas las formas anteriores)</td></tr>
        <tr><td class="f">--exclude 192.168.56.1</td><td class="d">Quita equipos o redes del conjunto (separados por comas)</td></tr>
        <tr><td class="f">--excludefile excluir.txt</td><td class="d">Lo mismo, desde un archivo</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Listas de objetivos: el alcance escrito en un archivo</h3>

  <p>En una auditoría el alcance autorizado debería existir como archivo, no como algo que
  tecleas de memoria. <code>-iL</code> y <code>--excludefile</code> convierten el documento
  de autorización en la entrada literal de Nmap:</p>

  <?= term('<span class="p">$</span> cat alcance.txt' . "\n"
         . '192.168.56.10' . "\n"
         . '192.168.56.20' . "\n"
         . '192.168.56.32/28' . "\n"
         . '<span class="p">$</span> cat excluir.txt' . "\n"
         . '192.168.56.40   <span class="c"># impresora de pruebas: fuera de alcance</span>' . "\n"
         . '<span class="p">$</span> nmap -sL -n -iL alcance.txt --excludefile excluir.txt') ?>

  <h3>Excluir equipos</h3>

  <p><code>--exclude</code> es una herramienta de administración: sirve para respetar las
  exclusiones pactadas y para no molestar a equipos delicados. También para no escanearte a
  ti mismo cuando no hace falta:</p>

  <?= term('<span class="p">$</span> nmap -sn 192.168.56.0/24 --exclude 192.168.56.1') ?>

  <p>Comprobado con el list scan sobre un rango pequeño: <code>192.168.1.0/29</code> son
  ocho direcciones y, con <code>--exclude 192.168.1.1</code>, Nmap lista siete y dice
  <code>7 IP addresses</code>.</p>

  <?= nm_ficha([
      'Cuándo usarlo' => 'Siempre que el alcance tenga más de un par de IP: archivo de alcance con <code>-iL</code> y exclusiones con <code>--excludefile</code>.',
      'Qué NO significa' => 'Excluir un equipo no lo protege de nada; solo evita que <em>tu</em> escaneo lo toque.',
      'Ciberseguridad' => 'Guardar el archivo de alcance junto a los resultados deja constancia de qué se autorizó y qué se analizó realmente.',
      'Error común' => 'Poner un nombre DNS en el alcance: mañana puede resolver a otra IP. Para auditorías, IP o CIDR.',
      'Mini práctica' => 'Crea <code>alcance.txt</code> con <code>127.0.0.1</code> y ejecuta <code>nmap -iL alcance.txt</code>.',
  ]) ?>
</section>

<!-- ============================ LIST SCAN ============================ -->
<section id="list-scan">
  <h2>List scan: <code>-sL</code></h2>
  <p class="tut-sub">El ensayo general: qué objetivos incluirá el escaneo, sin enviarles nada.</p>

  <p><strong>Qué hace.</strong> Expande los objetivos que le das —rangos, CIDR, listas,
  exclusiones— y los imprime uno por uno. <strong>No envía ningún paquete a los
  objetivos.</strong> No descubre hosts, no escanea puertos y no puede combinarse con
  opciones que lo hagan.</p>

  <p><strong>Cómo funciona.</strong> Solo calcula. Con una salvedad: por defecto intenta
  resolver el nombre inverso (IP → nombre) de cada dirección preguntando a <em>tu</em>
  servidor DNS. Con <code>-n</code> desactivas también eso y el comando no genera ni una
  consulta.</p>

  <?= term('<span class="p">$</span> nmap -sL -n 192.168.1.0/30') ?>
  <?= term('Starting Nmap 7.991 ( https://nmap.org ) at 2026-09-10 16:25 -0600' . "\n"
         . 'Nmap scan report for 192.168.1.0' . "\n"
         . 'Nmap scan report for 192.168.1.1' . "\n"
         . 'Nmap scan report for 192.168.1.2' . "\n"
         . 'Nmap scan report for 192.168.1.3' . "\n"
         . 'Nmap done: 4 IP addresses (0 hosts up) scanned in 0.00 seconds', 'salida real') ?>

  <p><strong>Cómo interpretarlo.</strong> Cuatro direcciones: la <code>/30</code> cubre de
  <code>.0</code> a <code>.3</code>, como decía la tabla CIDR. <code>0 hosts up</code> no
  significa que estén apagados: significa que <strong>no se ha preguntado</strong>.</p>

  <?= nm_ficha([
      'Cuándo usarlo' => 'Antes de cualquier escaneo sobre un rango nuevo o una lista larga. Es gratis y evita el error más caro: analizar lo que no debías.',
      'Qué NO significa' => '«0 hosts up» no es un resultado de descubrimiento. <code>-sL</code> no sabe si hay alguien.',
      'Ciberseguridad' => 'Sin <code>-n</code> hace una consulta DNS inversa por IP. En un rango grande son muchas consultas a tu resolver; si tu DNS es externo, estás contando a un tercero qué redes miras.',
      'Error común' => 'Creer que <code>-sL</code> ha «escaneado» algo. No ha tocado ningún equipo.',
      'Mini práctica' => 'Compara el número de direcciones de <code>nmap -sL -n 192.168.56.0/24</code> y <code>nmap -sL -n 192.168.56.0/28</code>.',
  ]) ?>
</section>

<!-- ========================= DESCUBRIMIENTO ========================== -->
<section id="descubrimiento">
  <h2>Host discovery: <code>-sn</code></h2>
  <p class="tut-sub">¿Quién está vivo? Sin escanear puertos.</p>

  <p><strong>Qué hace.</strong> Envía unas pocas sondas a cada dirección del rango y lista
  las que responden. Después se detiene: <strong>no hace escaneo de puertos</strong>. Por
  eso a menudo se le llama <em>ping scan</em>, aunque usa bastante más que ping.</p>

  <h3>Qué sondas envía</h3>

  <p>Depende de dos cosas: si tienes privilegios y si el objetivo está en tu misma red
  local (según el manual de la 7.991):</p>

  <dl class="panes">
    <div>
      <dt>Sin privilegios</dt>
      <dd>Solo intenta <b>conectar a los puertos 80 y 443</b> con <code>connect()</code>. Si
      responde con SYN/ACK o con RST, el host existe.</dd>
    </div>
    <div>
      <dt>Root, red remota</dt>
      <dd><b>ICMP echo</b> (el ping de siempre), <b>TCP SYN al 443</b>, <b>TCP ACK al 80</b>
      e <b>ICMP timestamp</b>. Basta con que conteste a una.</dd>
    </div>
    <div>
      <dt>Root, misma red local</dt>
      <dd><b>ARP</b>: «¿quién tiene esta IP?». Un equipo encendido en tu segmento
      prácticamente no puede ignorarla, porque sin ARP no podría comunicarse con nadie.</dd>
    </div>
  </dl>

  <?= term('<span class="p">$</span> sudo nmap -sn 192.168.56.0/24 <span class="c"># sustituye por TU red de laboratorio</span>') ?>
  <?= term('Nmap scan report for 192.168.56.10' . "\n"
         . 'Host is up (0.00038s latency).' . "\n"
         . 'MAC Address: 08:00:27:3A:1B:2C (Oracle VirtualBox virtual NIC)' . "\n"
         . 'Nmap scan report for 192.168.56.20' . "\n"
         . 'Host is up (0.00041s latency).' . "\n"
         . 'MAC Address: 08:00:27:7D:44:91 (Oracle VirtualBox virtual NIC)' . "\n"
         . 'Nmap scan report for 192.168.56.1' . "\n"
         . 'Host is up.' . "\n"
         . 'Nmap done: 256 IP addresses (3 hosts up) scanned in 2.07 seconds', 'salida ilustrativa · laboratorio 192.168.56.0/24') ?>

  <p><strong>Cómo interpretarlo.</strong> Tres equipos: dos VM y tu propio equipo
  (<code>.1</code>, sin MAC ni latencia porque es local). La MAC y el fabricante solo
  aparecen porque están en tu mismo segmento: el prefijo <code>08:00:27</code> está
  asignado a las tarjetas virtuales de VirtualBox, y <code>52:54:00</code> a las de QEMU/KVM.
  Fuera de tu red local nunca verás la MAC del objetivo, solo la de tu router.</p>

  <h3>Por qué un equipo encendido puede parecer apagado</h3>

  <ul>
    <li><strong>Firewall local que descarta ICMP</strong> y no tiene nada en 80/443. Muchos
    sistemas de escritorio bloquean el ping por defecto.</li>
    <li><strong>Firewall de red</strong> entre tú y el objetivo que descarta las sondas o
    las respuestas.</li>
    <li><strong>Sin privilegios y en otra red:</strong> solo se prueban 80 y 443. Un servidor
    con solo SSH y el resto filtrado no responde a ninguna de las dos.</li>
    <li><strong>Pérdida puntual</strong> en redes wifi o saturadas.</li>
  </ul>

  <p>La excepción es ARP en tu propia red con root: es muy difícil que un equipo encendido
  no responda. Por eso, en un laboratorio local, <code>sudo nmap -sn</code> es un inventario
  de equipos bastante fiable.</p>

  <?= nm_ficha([
      'Cuándo usarlo' => 'Para contar equipos activos, mantener un inventario básico o decidir sobre qué hosts merece la pena escanear puertos después.',
      'Qué NO significa' => 'Un host que no aparece <strong>no está necesariamente apagado</strong>: puede estar filtrando las sondas.',
      'Ciberseguridad' => 'Un equipo nuevo en un <code>-sn</code> periódico de tu laboratorio o de tu red autorizada es el primer indicio de un dispositivo no inventariado.',
      'Error común' => 'Usarlo sin <code>sudo</code> en la LAN y concluir que hay menos equipos de los que hay: sin root no se usa ARP.',
      'Mini práctica' => 'Ejecuta <code>nmap -sn 127.0.0.1</code> y luego, con tu VM encendida, <code>sudo nmap -sn</code> sobre tu red de laboratorio. Apaga la VM y repite.',
  ]) ?>

  <h3>Qué manda Nmap para decidir si un equipo está vivo</h3>

  <?= shot('nmap/12-host-discovery.svg',
      'Las cuatro sondas que envía nmap -sn con privilegios: ICMP echo request, TCP SYN al '
      . '443, TCP ACK al 80 e ICMP timestamp, cada una con la razón de existir.',
      '<b>Dónde mirar:</b> por qué son cuatro y no una. Cada sonda sobrevive a un tipo de '
      . 'filtro distinto; basta con que <em>una</em> obtenga respuesta.') ?>

  <?= pitfall('<p>Leer «<code>Host seems down</code>» como «el equipo está apagado». Lo que
      significa es que ninguna de las sondas obtuvo respuesta, y eso es muy frecuente en
      equipos con cortafuegos restrictivo — el de Windows, sin ir más lejos, descarta el
      echo request por defecto. La frase correcta es «no respondió al descubrimiento»; si
      necesitas asegurarte, <code>-Pn</code> se lo salta y escanea de todas formas.</p>') ?>

</section>

<!-- =============================== -Pn =============================== -->
<section id="pn">
  <h2>Omitir el descubrimiento: <code>-Pn</code></h2>
  <p class="tut-sub">«No preguntes si está vivo: da por hecho que sí y analiza sus puertos».</p>

  <p><strong>Qué hace.</strong> Salta por completo la fase de descubrimiento. Nmap
  <strong>trata cada objetivo como activo</strong> y continúa directamente con el escaneo
  de puertos (y con lo demás que hayas pedido), conteste o no a las sondas de
  descubrimiento.</p>

  <p><strong>Por qué existe.</strong> Por defecto, si un host no responde al descubrimiento,
  Nmap lo da por caído y no escanea sus puertos. Con un servidor que filtra ICMP y los
  puertos 80/443 verías esto:</p>

  <?= term('Note: Host seems down. If it is really up, but blocking our ping probes, try -Pn' . "\n"
         . 'Nmap done: 1 IP address (0 hosts up) scanned in 3.04 seconds', 'salida ilustrativa') ?>

  <p>El propio Nmap sugiere la solución. Con <code>-Pn</code>:</p>

  <?= term('<span class="p">$</span> nmap -Pn -p 22,443 &lt;IP-LAB&gt;') ?>

  <p>Si el servidor tiene el 22 abierto, ahora aparecerá, porque el escaneo de puertos sí se
  ejecuta. El host estaba vivo; lo que fallaba era la pregunta de si lo estaba.</p>

  <?= nm_ficha([
      'Cuándo usarlo' => 'Sobre uno o pocos hosts que sabes que existen (un servidor propio que filtra ping) y que el descubrimiento da por caídos.',
      'Qué NO significa' => 'No «atraviesa» ningún firewall: los puertos filtrados seguirán saliendo <code>filtered</code>. Solo cambia la decisión de si escanear.',
      'Ciberseguridad' => 'Un servidor que no responde al descubrimiento pero tiene servicios abiertos no es invisible; solo es menos ruidoso. Configurar el firewall para no responder a ping no sustituye a cerrar servicios.',
      'Error común' => 'Usarlo sobre un <code>/24</code> entero: escaneará las 256 direcciones, incluidas las vacías, esperando el tiempo de espera en cada puerto de cada una. Lento y ruidoso. Descubre primero, y usa <code>-Pn</code> solo sobre los que sabes que existen.',
      'Mini práctica' => 'En tu VM, bloquea ICMP con su firewall y compara <code>nmap &lt;IP-LAB&gt;</code> con <code>nmap -Pn &lt;IP-LAB&gt;</code>.',
  ]) ?>

  <?= note('Un matiz del manual',
      '<p>En tu misma red local, con privilegios, Nmap sigue haciendo ARP aunque pongas
      <code>-Pn</code>, porque necesita las direcciones MAC para enviar tramas. Por eso en
      el laboratorio local rara vez lo necesitarás.</p>', 'info') ?>
</section>

<!-- =============================== DNS =============================== -->
<section id="dns">
  <h2>DNS y resolución de nombres</h2>
  <p class="tut-sub">Nombres para las personas, IP para las máquinas. Y el precio de traducir entre ambos.</p>

  <p>Nmap usa DNS en dos direcciones:</p>

  <ul>
    <li><strong>Directa (nombre → IP):</strong> si le das <code>lab-web.local</code>, necesita
    su IP para poder enviar paquetes. Esto siempre ocurre, con o sin opciones.</li>
    <li><strong>Inversa (IP → nombre):</strong> para cada host activo, pregunta su nombre
    (registro PTR) para mostrártelo: <code>Nmap scan report for localhost (127.0.0.1)</code>.
    Por defecto lo hace <em>a veces</em>: solo con los hosts que responden.</li>
  </ul>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Opciones de resolución DNS de Nmap</caption>
      <thead><tr><th scope="col">Opción</th><th scope="col">Efecto</th></tr></thead>
      <tbody>
        <tr><td class="f">(nada)</td><td class="d">Resolución inversa solo de los hosts activos</td></tr>
        <tr><td class="f">-n</td><td class="d">Nunca hace resolución inversa. Más rápido y sin consultas extra</td></tr>
        <tr><td class="f">-R</td><td class="d">Resolución inversa de todos los objetivos, también de los inactivos</td></tr>
        <tr><td class="f">--system-dns</td><td class="d">Usa el resolver del sistema en lugar del resolver paralelo propio de Nmap</td></tr>
        <tr><td class="f">--dns-servers 192.168.56.20</td><td class="d">Pregunta a servidores DNS concretos (por ejemplo, el DNS interno del laboratorio)</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Velocidad y claridad</h3>

  <p>En un laboratorio de máquinas virtuales nadie ha creado registros PTR, así que las
  consultas inversas no aportan nada y cuestan tiempo. En una red corporativa, en cambio,
  los nombres inversos pueden ser oro: <code>srv-backup-02</code> te dice más que
  <code>10.20.0.14</code>. Criterio:</p>

  <ul>
    <li>En laboratorio y en barridos grandes: <code>-n</code>.</li>
    <li>En inventario de una red con DNS interno bien mantenido: sin <code>-n</code>, o con
    <code>--dns-servers</code> apuntando a ese DNS interno.</li>
  </ul>

  <?= nm_ficha([
      'Cuándo usarlo' => '<code>-n</code> por defecto en laboratorio; resolución inversa cuando el DNS interno aporta contexto.',
      'Qué NO significa' => 'Que un nombre inverso sea cierto: el PTR lo configura quien administra esa zona y puede estar desactualizado.',
      'Ciberseguridad' => 'Las consultas inversas salen hacia tu resolver. Con un resolver público, le estás contando qué rangos analizas.',
      'Error común' => 'Pensar que <code>-n</code> impide resolver los nombres que tú das como objetivo. Esa resolución directa es imprescindible y se hace igual.',
      'Mini práctica' => 'Compara el tiempo de <code>nmap -sn 127.0.0.1</code> con y sin <code>-n</code>, y fíjate en si aparece el nombre <code>localhost</code>.',
  ]) ?>
</section>

<?= nm_nivel('2', 'Puertos', 'Qué puertos analizar, con qué técnica y cómo leer la razón de cada estado. TCP connect, SYN y UDP.', 'protocolos') ?>

<!-- ============================= PUERTOS ============================= -->
<section id="puertos">
  <h2>Seleccionar puertos: <code>-p</code></h2>
  <p class="tut-sub">Por defecto, los 1000 más comunes. Pero casi siempre sabes cuáles te interesan.</p>

  <p><strong>Qué hace.</strong> <code>-p</code> sustituye la lista por defecto (los 1000
  puertos más frecuentes de cada protocolo, según la tabla <code>nmap-services</code>) por
  la que tú indiques.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Sintaxis de selección de puertos</caption>
      <thead><tr><th scope="col">Sintaxis</th><th scope="col">Qué analiza</th><th scope="col">Nº de puertos</th></tr></thead>
      <tbody>
        <tr><td class="f">-p 22</td><td class="d">Solo el 22</td><td class="d">1</td></tr>
        <tr><td class="f">-p 22,80,443</td><td class="d">Una lista, separada por comas y sin espacios</td><td class="d">3</td></tr>
        <tr><td class="f">-p 1-1024</td><td class="d">Un rango</td><td class="d">1024</td></tr>
        <tr><td class="f">-p 22,80,8000-8100</td><td class="d">Lista y rangos mezclados</td><td class="d">103</td></tr>
        <tr><td class="f">-p-</td><td class="d">Todos: del 1 al 65535 (se omiten los extremos del rango)</td><td class="d">65 535</td></tr>
        <tr><td class="f">-p 8000-</td><td class="d">Del 8000 hasta el final</td><td class="d">57 536</td></tr>
        <tr><td class="f">--top-ports 20</td><td class="d">Los 20 más frecuentes según <code>nmap-services</code></td><td class="d">20</td></tr>
        <tr><td class="f">-F</td><td class="d">Modo rápido: los 100 más frecuentes en lugar de 1000</td><td class="d">100</td></tr>
        <tr><td class="f">(sin -p)</td><td class="d">Los 1000 más frecuentes</td><td class="d">1000</td></tr>
        <tr><td class="f">--exclude-ports 9100</td><td class="d">Quita puertos de la lista resultante</td><td class="d">—</td></tr>
      </tbody>
    </table>
  </div>

  <?= term('<span class="p">$</span> nmap -p 22 localhost' . "\n"
         . '<span class="p">$</span> nmap -p 22,80,443 localhost' . "\n"
         . '<span class="p">$</span> nmap -p 1-1000 localhost' . "\n"
         . '<span class="p">$</span> nmap -p- 127.0.0.1') ?>

  <p>El puerto 0 solo se analiza si lo pides expresamente. <code>-p-</code> con escaneos TCP
  cubre los 65535 puertos TCP; si añades <code>-sU</code>, la misma lista se aplica también a
  UDP (y eso, como verás, es muy lento).</p>

  <h3>Top ports: la estadística de Nmap</h3>

  <p>El archivo <code>nmap-services</code> no solo asocia nombres a puertos: guarda cuántas
  veces se ha visto cada uno abierto en grandes estudios de Internet. <code>--top-ports N</code>
  elige los N con más frecuencia. Los 10 primeros en TCP:</p>

  <?= term('<span class="p">$</span> nmap --top-ports 10 127.0.0.1') ?>
  <?= term('PORT     STATE  SERVICE' . "\n"
         . '21/tcp   <span class="st-closed">closed</span> ftp' . "\n"
         . '22/tcp   <span class="st-closed">closed</span> ssh' . "\n"
         . '23/tcp   <span class="st-closed">closed</span> telnet' . "\n"
         . '25/tcp   <span class="st-closed">closed</span> smtp' . "\n"
         . '80/tcp   <span class="st-closed">closed</span> http' . "\n"
         . '110/tcp  <span class="st-closed">closed</span> pop3' . "\n"
         . '139/tcp  <span class="st-closed">closed</span> netbios-ssn' . "\n"
         . '443/tcp  <span class="st-closed">closed</span> https' . "\n"
         . '445/tcp  <span class="st-closed">closed</span> microsoft-ds' . "\n"
         . '3389/tcp <span class="st-closed">closed</span> ms-wbt-server', 'salida real') ?>

  <p>Fíjate: aquí salen <strong>todos</strong> los puertos, también los cerrados. Cuando la
  lista es corta, Nmap no agrupa en <code>Not shown</code>. Y el 5432 de esta máquina,
  abierto, <em>no aparece</em>: no está entre los diez más frecuentes. La estadística habla
  de Internet en general, no de tu servidor.</p>

  <h3>Duración: el precio de cada puerto</h3>

  <p>Un puerto abierto o cerrado contesta al instante. Un puerto <strong>filtrado</strong>
  obliga a Nmap a esperar y reintentar antes de rendirse. Contra <code>127.0.0.1</code>,
  <code>-p-</code> termina en segundos porque todo contesta; contra un host remoto con
  firewall que descarta, 65535 puertos filtrados pueden llevar mucho tiempo. Regla: pide los
  puertos que necesitas, y reserva <code>-p-</code> para los hosts donde de verdad quieres
  descartar servicios en puertos no estándar.</p>

  <?= nm_ficha([
      'Cuándo usarlo' => 'Siempre que sepas qué buscas: comprobar un servicio concreto, validar una regla de firewall, verificar una política («solo 22 y 443»).',
      'Qué NO significa' => 'Que lo no escaneado esté cerrado. Un <code>--top-ports 100</code> limpio no dice nada del puerto 8443.',
      'Ciberseguridad' => 'Los servicios olvidados suelen vivir en puertos no estándar (paneles en 8080, 8443, 9090…). Un <code>-p-</code> periódico sobre tus servidores críticos los encuentra.',
      'Error común' => 'Escribir <code>-p 22, 80</code> con espacio: Nmap tomará <code>80</code> como un objetivo, no como un puerto.',
      'Mini práctica' => 'Ejecuta <code>nmap -p- 127.0.0.1</code> y compáralo con <code>nmap 127.0.0.1</code>. ¿Aparecen puertos nuevos? ¿Cuáles y por qué no estaban en el top 1000?',
  ]) ?>
</section>

<!-- ============================= COMUNES ============================= -->
<section id="comunes">
  <h2>Puertos comunes</h2>
  <p class="tut-sub">Una referencia útil, con una advertencia: el número sugiere; no garantiza.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Puertos habituales, su servicio y su lectura defensiva</caption>
      <thead><tr><th scope="col">Puerto</th><th scope="col">Servicio habitual</th><th scope="col">Lectura defensiva</th></tr></thead>
      <tbody>
        <tr><td class="f">21/tcp</td><td class="d">FTP</td><td class="d">Credenciales y datos sin cifrar. Hoy suele sustituirse por SFTP (sobre SSH).</td></tr>
        <tr><td class="f">22/tcp</td><td class="d">SSH</td><td class="d">Administración remota. Esperado en servidores; conviene limitar quién llega.</td></tr>
        <tr><td class="f">23/tcp</td><td class="d">Telnet</td><td class="d">Administración sin cifrar. Habitual en equipos de red viejos; no debería existir.</td></tr>
        <tr><td class="f">25/tcp</td><td class="d">SMTP</td><td class="d">Correo entre servidores. Solo en servidores de correo.</td></tr>
        <tr><td class="f">53/udp · 53/tcp</td><td class="d">DNS</td><td class="d">Resolución de nombres. Solo en servidores DNS; un resolver abierto a otras redes es un problema.</td></tr>
        <tr><td class="f">80/tcp</td><td class="d">HTTP</td><td class="d">Web sin cifrar. Hoy suele limitarse a redirigir a HTTPS.</td></tr>
        <tr><td class="f">110/tcp</td><td class="d">POP3</td><td class="d">Correo sin cifrar; su versión cifrada es 995.</td></tr>
        <tr><td class="f">123/udp</td><td class="d">NTP</td><td class="d">Hora de red. Esperado en servidores de tiempo.</td></tr>
        <tr><td class="f">143/tcp</td><td class="d">IMAP</td><td class="d">Correo sin cifrar; su versión cifrada es 993.</td></tr>
        <tr><td class="f">161/udp</td><td class="d">SNMP</td><td class="d">Gestión de equipos de red. Las versiones antiguas usan «comunidades» en claro.</td></tr>
        <tr><td class="f">443/tcp</td><td class="d">HTTPS</td><td class="d">Web cifrada. El servicio público por excelencia.</td></tr>
        <tr><td class="f">445/tcp</td><td class="d">SMB</td><td class="d">Compartición de archivos Windows/Samba. Nunca debe estar expuesto a Internet.</td></tr>
        <tr><td class="f">3306/tcp</td><td class="d">MySQL / MariaDB</td><td class="d">Base de datos. Normalmente solo para la aplicación, en localhost o red interna.</td></tr>
        <tr><td class="f">3389/tcp</td><td class="d">RDP</td><td class="d">Escritorio remoto de Windows. Administración: fuera de la red de gestión, sospechoso.</td></tr>
        <tr><td class="f">5432/tcp</td><td class="d">PostgreSQL</td><td class="d">Base de datos. Igual que MySQL: acceso limitado a quien la necesita.</td></tr>
        <tr><td class="f">5900/tcp</td><td class="d">VNC</td><td class="d">Escritorio remoto. Administración; a menudo con autenticación débil.</td></tr>
        <tr><td class="f">6379/tcp</td><td class="d">Redis</td><td class="d">Base de datos en memoria; pensada para red interna.</td></tr>
        <tr><td class="f">8080 · 8443/tcp</td><td class="d">HTTP/HTTPS alternativos</td><td class="d">Paneles, proxies, entornos de pruebas. Terreno típico de servicios olvidados.</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('El puerto sugiere; no garantiza',
      '<p>Un número de puerto indica el servicio <em>habitual</em>, no el real. Nada impide
      ejecutar SSH en el 443 o un servidor web en el 22. En la máquina del tutorial, Nmap
      bautiza el 8090 como <code>opsmessaging</code> y el 8025 como <code>ca-audit-da</code>
      porque así están registrados esos números; en realidad son dos servidores HTTP. Solo
      <code>-sV</code> pregunta de verdad qué hay detrás.</p>') ?>
</section>

<!-- ============================= CONNECT ============================= -->
<section id="connect">
  <h2>TCP connect: <code>-sT</code></h2>
  <p class="tut-sub">El escaneo que hace lo mismo que cualquier programa normal: conectar.</p>

  <p><strong>Qué hace.</strong> Para cada puerto, Nmap pide al sistema operativo que abra una
  conexión TCP completa con la llamada <code>connect()</code>, la misma que usan el
  navegador o <code>ssh</code>. Si el sistema consigue conectar, el puerto está abierto; si
  se lo rechazan, cerrado; si no pasa nada, filtrado.</p>

  <p><strong>Cómo funciona.</strong> Como la conexión la establece el sistema, el saludo
  de tres vías se completa. Nmap, en cuanto sabe lo que necesitaba, la corta con un RST.
  Esto es lo que se ve en el cable, capturado con <code>tshark</code> en la interfaz
  <code>lo</code> mientras se ejecutaba <code>nmap -sT -p 22,5432 127.0.0.1</code>:</p>

  <?= term('1  127.0.0.1 → 127.0.0.1  TCP  55082 → 22   [SYN]' . "\n"
         . '2  127.0.0.1 → 127.0.0.1  TCP  22 → 55082   [RST, ACK]' . "\n"
         . '3  127.0.0.1 → 127.0.0.1  TCP  35272 → 5432 [SYN]' . "\n"
         . '4  127.0.0.1 → 127.0.0.1  TCP  5432 → 35272 [SYN, ACK]' . "\n"
         . '5  127.0.0.1 → 127.0.0.1  TCP  35272 → 5432 [ACK]' . "\n"
         . '6  127.0.0.1 → 127.0.0.1  TCP  35272 → 5432 [RST, ACK]', 'captura real · tshark -i lo (resumida)') ?>

  <?= steps([
      'Paquetes 1–2: SYN al 22, y el sistema contesta RST/ACK. Nadie escucha: <strong>closed</strong> (razón <code>conn-refused</code>).',
      'Paquetes 3–5: SYN al 5432, SYN/ACK, ACK. <strong>Saludo completo</strong>: la conexión llegó a establecerse y PostgreSQL la aceptó.',
      'Paquete 6: Nmap aborta la conexión con RST. Ya tiene lo que quería: <strong>open</strong> (razón <code>syn-ack</code>).',
  ]) ?>

  <?= term('<span class="p">$</span> nmap -sT -p 22,5432 localhost') ?>
  <?= term('PORT     STATE  SERVICE' . "\n"
         . '22/tcp   <span class="st-closed">closed</span> ssh' . "\n"
         . '5432/tcp <span class="st-open">open</span>   postgresql', 'salida real') ?>

  <?= nm_ficha([
      'Cuándo usarlo' => 'Cuando no tienes privilegios (es el tipo por defecto sin root), para aprender y para pruebas en las que quieres que la aplicación vea una conexión real.',
      'Qué NO significa' => 'Que el servicio haya sido «usado»: solo se completó el saludo y se cortó. No se envió ni un byte de aplicación.',
      'Ciberseguridad' => 'Como la conexión llega a la aplicación, muchos servicios la registran (por ejemplo, SSH anota conexiones cerradas antes de autenticarse). En tus propios servidores, esos registros son una forma de ver que alguien escaneó.',
      'Error común' => 'Pensar que <code>-sT</code> es «más suave» por no usar root. Envía más paquetes por puerto abierto que <code>-sS</code> y deja más rastro en las aplicaciones.',
      'Mini práctica' => 'Captura <code>lo</code> con Wireshark mientras ejecutas <code>nmap -sT -p 22,5432 127.0.0.1</code> (usa un puerto que tengas abierto) y encuentra los seis paquetes.',
  ]) ?>
</section>

<!-- =============================== SYN =============================== -->
<section id="syn">
  <h2>SYN scan: <code>-sS</code></h2>
  <p class="tut-sub">Preguntar sin completar la conexión. El tipo por defecto cuando hay privilegios.</p>

  <p><strong>Qué hace.</strong> Nmap construye él mismo el paquete SYN (por eso necesita
  root), lo envía y mira qué vuelve. No le pide al sistema que conecte: solo necesita el
  segundo paquete del saludo para decidir. Se le llama <em>half-open</em> («medio
  abierto») porque la conexión nunca llega a establecerse.</p>

  <?= term('<span class="p">$</span> sudo nmap -sS &lt;IP-LAB&gt;') ?>

  <div class="nm-seq">
    <figure class="tut-figure">
      <svg viewBox="0 0 300 170" role="img" aria-label="Puerto abierto en SYN scan: Nmap envía SYN, el host responde SYN/ACK y el sistema de Nmap responde RST.">
        <text x="40" y="16" font-family="JetBrains Mono, monospace" font-size="10.5" fill="var(--dv-text-primary)" text-anchor="middle">Nmap</text>
        <text x="260" y="16" font-family="JetBrains Mono, monospace" font-size="10.5" fill="var(--dv-text-primary)" text-anchor="middle">Host</text>
        <line x1="40" y1="24" x2="40" y2="162" stroke="var(--dv-border-strong)" stroke-dasharray="3 4"/>
        <line x1="260" y1="24" x2="260" y2="162" stroke="var(--dv-border-strong)" stroke-dasharray="3 4"/>
        <line x1="40" y1="50" x2="250" y2="50" stroke="var(--tl-l3)" stroke-width="1.7"/>
        <polygon points="260,50 248,45 248,55" fill="var(--tl-l3)"/>
        <text x="150" y="43" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="var(--tl-l3)" text-anchor="middle">SYN</text>
        <line x1="260" y1="95" x2="50" y2="95" stroke="var(--tl-l4)" stroke-width="1.7"/>
        <polygon points="40,95 52,90 52,100" fill="var(--tl-l4)"/>
        <text x="150" y="88" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="var(--tl-l4)" text-anchor="middle">SYN/ACK</text>
        <line x1="40" y1="140" x2="250" y2="140" stroke="var(--tl-l7)" stroke-width="1.7"/>
        <polygon points="260,140 248,135 248,145" fill="var(--tl-l7)"/>
        <text x="150" y="133" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="var(--tl-l7)" text-anchor="middle">RST</text>
      </svg>
      <figcaption><b>open</b> · razón <code>syn-ack</code></figcaption>
    </figure>
    <figure class="tut-figure">
      <svg viewBox="0 0 300 170" role="img" aria-label="Puerto cerrado en SYN scan: Nmap envía SYN y el host responde RST/ACK.">
        <text x="40" y="16" font-family="JetBrains Mono, monospace" font-size="10.5" fill="var(--dv-text-primary)" text-anchor="middle">Nmap</text>
        <text x="260" y="16" font-family="JetBrains Mono, monospace" font-size="10.5" fill="var(--dv-text-primary)" text-anchor="middle">Host</text>
        <line x1="40" y1="24" x2="40" y2="162" stroke="var(--dv-border-strong)" stroke-dasharray="3 4"/>
        <line x1="260" y1="24" x2="260" y2="162" stroke="var(--dv-border-strong)" stroke-dasharray="3 4"/>
        <line x1="40" y1="50" x2="250" y2="50" stroke="var(--tl-l3)" stroke-width="1.7"/>
        <polygon points="260,50 248,45 248,55" fill="var(--tl-l3)"/>
        <text x="150" y="43" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="var(--tl-l3)" text-anchor="middle">SYN</text>
        <line x1="260" y1="95" x2="50" y2="95" stroke="var(--tl-l7)" stroke-width="1.7"/>
        <polygon points="40,95 52,90 52,100" fill="var(--tl-l7)"/>
        <text x="150" y="88" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="var(--tl-l7)" text-anchor="middle">RST/ACK</text>
        <text x="150" y="135" font-family="JetBrains Mono, monospace" font-size="10" fill="var(--dv-text-muted)" text-anchor="middle">fin: nadie escucha</text>
      </svg>
      <figcaption><b>closed</b> · razón <code>reset</code></figcaption>
    </figure>
    <figure class="tut-figure">
      <svg viewBox="0 0 300 170" role="img" aria-label="Puerto filtrado en SYN scan: Nmap envía SYN, no hay respuesta, reenvía SYN y sigue sin respuesta.">
        <text x="40" y="16" font-family="JetBrains Mono, monospace" font-size="10.5" fill="var(--dv-text-primary)" text-anchor="middle">Nmap</text>
        <text x="260" y="16" font-family="JetBrains Mono, monospace" font-size="10.5" fill="var(--dv-text-primary)" text-anchor="middle">Host</text>
        <line x1="40" y1="24" x2="40" y2="162" stroke="var(--dv-border-strong)" stroke-dasharray="3 4"/>
        <line x1="260" y1="24" x2="260" y2="162" stroke="var(--dv-border-strong)" stroke-dasharray="3 4"/>
        <line x1="40" y1="50" x2="160" y2="50" stroke="var(--tl-l3)" stroke-width="1.7"/>
        <text x="100" y="43" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="var(--tl-l3)" text-anchor="middle">SYN</text>
        <text x="172" y="54" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700" fill="var(--tl-l7)">✕</text>
        <line x1="40" y1="105" x2="160" y2="105" stroke="var(--tl-l3)" stroke-width="1.7"/>
        <text x="100" y="98" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="var(--tl-l3)" text-anchor="middle">SYN</text>
        <text x="172" y="109" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700" fill="var(--tl-l7)">✕</text>
        <text x="150" y="145" font-family="JetBrains Mono, monospace" font-size="10" fill="var(--dv-text-muted)" text-anchor="middle">silencio tras reintentar</text>
      </svg>
      <figcaption><b>filtered</b> · razón <code>no-response</code></figcaption>
    </figure>
  </div>

  <p><strong>Cómo interpretar cada caso</strong> (según el manual de la 7.991):</p>

  <ul>
    <li><strong>SYN/ACK →</strong> alguien escucha: <code>open</code>. El RST final no lo
    decide Nmap: lo envía el sistema operativo de tu equipo, que recibe un SYN/ACK de una
    conexión que él no abrió y la rechaza. Por eso la aplicación del objetivo nunca llega a
    ver una conexión completa.</li>
    <li><strong>RST →</strong> nadie escucha: <code>closed</code>.</li>
    <li><strong>Nada tras varios reintentos →</strong> <code>filtered</code>.</li>
    <li><strong>ICMP unreachable</strong> (tipo 3, códigos 0, 1, 2, 3, 9, 10 o 13) →
    <code>filtered</code>: un router o firewall avisó de que no deja pasar.</li>
  </ul>

  <?= note('Qué no es un SYN scan',
      '<p>Se repite a menudo que el SYN scan es «sigiloso». Es una idea de hace décadas y
      engañosa: cada SYN atraviesa firewalls, queda en sus contadores y registros, lo ve
      cualquier IDS y lo registra la tabla de conexiones del objetivo. Lo único que evita es
      que la <em>aplicación</em> vea una conexión completa. En este curso es simplemente la
      técnica TCP más eficiente y la que distingue mejor los tres estados.</p>') ?>

  <?= nm_ficha([
      'Cuándo usarlo' => 'Es el escaneo TCP por defecto con privilegios: rápido, fiable y con razones detalladas (<code>reset</code>, <code>no-response</code>, ICMP).',
      'Qué NO significa' => 'Que no se detecte. Deja una firma muy clara en la red; lo verás en el nivel 7.',
      'Ciberseguridad' => 'Desde el lado defensivo, muchos SYN desde un origen hacia muchos puertos con pocos saludos completos es exactamente el patrón de un escaneo.',
      'Error común' => 'Escribir <code>nmap -sS</code> sin <code>sudo</code> y leer <code>requires root privileges. QUITTING!</code> como un fallo.',
      'Mini práctica' => 'En tu VM de laboratorio: <code>sudo nmap -sS --reason -p 22,80,3306 &lt;IP-LAB&gt;</code>. Anota la razón de cada puerto.',
  ]) ?>
</section>

<!-- ============================ ST vs SS ============================= -->
<section id="st-vs-ss">
  <h2><code>-sT</code> frente a <code>-sS</code></h2>
  <p class="tut-sub">Misma pregunta, dos formas de hacerla.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Comparativa entre TCP connect scan y SYN scan</caption>
      <thead><tr><th scope="col">Característica</th><th scope="col"><code>-sT</code> connect</th><th scope="col"><code>-sS</code> SYN</th></tr></thead>
      <tbody>
        <tr><td class="f">Privilegios</td><td class="d">Ninguno. Es el defecto sin root</td><td class="d">Root (sockets raw). Es el defecto con root</td></tr>
        <tr><td class="f">Conexión completa</td><td class="d">Sí, en puertos abiertos: SYN, SYN/ACK, ACK y luego RST</td><td class="d">No: SYN, SYN/ACK y el RST de tu sistema</td></tr>
        <tr><td class="f">Funcionamiento</td><td class="d">Llamada <code>connect()</code> del sistema operativo</td><td class="d">Paquetes construidos y leídos por Nmap</td></tr>
        <tr><td class="f">Paquetes por puerto abierto</td><td class="d">Más (completa y corta)</td><td class="d">Menos</td></tr>
        <tr><td class="f">Velocidad</td><td class="d">Menor: depende del sistema</td><td class="d">Mayor: miles de puertos por segundo en red rápida</td></tr>
        <tr><td class="f">Razones (<code>--reason</code>)</td><td class="d"><code>syn-ack</code>, <code>conn-refused</code></td><td class="d"><code>syn-ack</code>, <code>reset</code>, <code>no-response</code>, ICMP</td></tr>
        <tr><td class="f">Registro en la aplicación</td><td class="d">Probable: la aplicación ve la conexión</td><td class="d">Improbable en la aplicación; visible en red, firewall e IDS</td></tr>
        <tr><td class="f">Uso educativo</td><td class="d">Ideal para empezar: se ve el saludo completo</td><td class="d">Ideal para entender qué necesita Nmap: solo el segundo paquete</td></tr>
      </tbody>
    </table>
  </div>

  <p>En la práctica, el estado de cada puerto coincide en ambos. Lo que cambia es el
  coste, los privilegios y el rastro. Ninguno de los dos es «el bueno»: elige el que
  necesitas y escríbelo explícitamente para que tu informe diga qué hiciste.</p>

  <h3>Los dos escaneos, paquete a paquete</h3>

  <?= shot('nmap/04-sT-vs-sS.svg',
      'Diagramas comparados: -sT completa el saludo de tres vías y después cierra con RST, '
      . 'cuatro paquetes en total; -sS corta tras recibir el SYN-ACK, tres paquetes, sin '
      . 'llegar a establecer la conexión.',
      '<b>Dónde mirar:</b> el tercer paquete. En <code>-sT</code> la conexión llega a '
      . 'existir y el servicio puede registrarla; en <code>-sS</code> no llega a '
      . 'completarse y muchas aplicaciones no la anotan.') ?>

  <?= pitfall('<p>Entender <code>-sS</code> como «escaneo sigiloso» en el sentido de
      invisible. No lo es. Que la <em>aplicación</em> no lo registre en su log no significa
      que nadie lo vea: el cortafuegos del equipo, el IDS de la red y cualquier captura de
      tráfico lo registran perfectamente. Se llamó «half-open» por cómo funciona, no por una
      promesa de ocultación — y este tutorial no enseña evasión.</p>') ?>

  <?= evidence(
      '<p>Ambos escaneos informan <code>22/tcp open</code>.</p>',
      '<p>Hay un servicio aceptando conexiones en el puerto 22 del objetivo.</p>',
      '<p>Que sea SSH, ni que esa exposición sea un problema. El estado <code>open</code>
      solo demuestra que algo completó —o inició— el saludo TCP. Qué programa hay detrás lo
      responde <code>-sV</code>; si <em>debería</em> estar ahí lo responde la política de esa
      red, no Nmap.</p>') ?>

</section>

<!-- =============================== UDP =============================== -->
<section id="udp">
  <h2>Escaneo UDP: <code>-sU</code></h2>
  <p class="tut-sub">El protocolo que muchos olvidan auditar, precisamente porque es lento y ambiguo.</p>

  <p><strong>Qué hace.</strong> Envía un datagrama UDP a cada puerto. Para puertos
  conocidos como el 53 (DNS) o el 161 (SNMP) envía una carga útil propia de ese protocolo,
  para provocar una respuesta; para el resto, el datagrama va vacío.</p>

  <?= term('<span class="p">$</span> sudo nmap -sU --top-ports 20 &lt;IP-LAB&gt;') ?>

  <h3>Por qué es lento y difícil</h3>

  <ul>
    <li><strong>Depende de ICMP.</strong> La única forma de saber que un puerto está cerrado
    es recibir un ICMP «port unreachable».</li>
    <li><strong>Ese ICMP está limitado.</strong> Los sistemas limitan el ritmo al que
    generan estos mensajes; el manual cita que Linux lo restringe a uno por segundo. Con
    1000 puertos, eso son más de un cuarto de hora por host.</li>
    <li><strong>El silencio es ambiguo.</strong> Un servicio abierto que no entiende la sonda
    no contesta; un firewall que descarta, tampoco. Resultado: <code>open|filtered</code>.</li>
    <li><strong>Los reintentos se acumulan.</strong> Nmap reenvía antes de rendirse, por si
    el paquete se perdió: UDP no garantiza nada.</li>
  </ul>

  <h3>Ejemplo razonado: DNS y NTP</h3>

  <p>Escenario de laboratorio: <code>192.168.56.20</code> es una VM que ofrece DNS (puerto 53)
  y hora de red, NTP (puerto 123). Queremos comprobar ambos:</p>

  <?= term('<span class="p">$</span> sudo nmap -sU --reason -p 53,123 192.168.56.20') ?>
  <?= term('PORT    STATE SERVICE REASON' . "\n"
         . '53/udp  <span class="st-open">open</span>  domain  udp-response ttl 64' . "\n"
         . '123/udp <span class="st-open">open</span>  ntp     udp-response ttl 64', 'salida ilustrativa') ?>

  <p>Ambos contestaron porque Nmap envió una consulta DNS real al 53 y una petición NTP real al
  123: <code>udp-response</code> es la prueba. Ahora el mismo comando contra la VM web
  (<code>.10</code>), que no ofrece ninguno de los dos, primero sin firewall y luego con un
  firewall que descarta todo salvo 22 y 443:</p>

  <?= term('PORT    STATE  SERVICE REASON' . "\n"
         . '53/udp  <span class="st-closed">closed</span> domain  port-unreach ttl 64' . "\n"
         . '123/udp <span class="st-closed">closed</span> ntp     port-unreach ttl 64', 'salida ilustrativa · sin firewall') ?>
  <?= term('PORT    STATE         SERVICE REASON' . "\n"
         . '53/udp  <span class="st-of">open|filtered</span> domain  no-response' . "\n"
         . '123/udp <span class="st-of">open|filtered</span> ntp     no-response', 'salida ilustrativa · con firewall que descarta') ?>

  <p>Con firewall, Nmap ya no puede distinguir nada: el firewall se traga el datagrama y el
  ICMP nunca se genera. Para salir de la duda, añade <code>-sV</code>: la detección de
  versiones envía sondas específicas de cada protocolo y, si un servicio contesta a alguna,
  el puerto pasa a <code>open</code>.</p>

  <?= nm_ficha([
      'Cuándo usarlo' => 'Sobre puertos UDP concretos que te importan (53, 123, 161, 500, 1900…) o con <code>--top-ports</code> pequeño. Nunca <code>-sU -p-</code> por costumbre.',
      'Qué NO significa' => '<code>open|filtered</code> no es «abierto». Es «no lo sé».',
      'Ciberseguridad' => 'SNMP, DNS y servicios de descubrimiento (SSDP en 1900) expuestos por UDP son hallazgos clásicos precisamente porque nadie los mira. Incluye UDP en tus auditorías, acotado.',
      'Error común' => 'Concluir que un host «no tiene nada en UDP» tras un escaneo lleno de <code>open|filtered</code>.',
      'Mini práctica' => 'En tu VM, instala un servidor NTP (chrony) y compara <code>sudo nmap -sU -p 123</code> antes y después de arrancarlo.',
  ]) ?>

  <h3>Por qué UDP tarda tanto y concluye tan poco</h3>

  <?= shot('nmap/06-udp.svg',
      'Cuatro casos de escaneo UDP: puerto abierto con servicio que contesta, puerto '
      . 'abierto con servicio que calla, puerto cerrado que responde con ICMP port '
      . 'unreachable y puerto filtrado; los casos segundo y cuarto producen la misma '
      . 'evidencia y el mismo estado open|filtered.',
      '<b>Dónde mirar:</b> los casos 2 y 4. Producen exactamente la misma evidencia —'
      . 'silencio— y por eso Nmap no se inventa una respuesta: devuelve '
      . '<code>open|filtered</code>.') ?>

  <?= pitfall('<p>Lanzar <code>-sU</code> sobre los 65 535 puertos y dejarlo corriendo.
      Como UDP no confirma nada, Nmap tiene que esperar el tiempo de espera completo en cada
      puerto que calla y reintentar; un barrido amplio puede tardar horas y aun así devolver
      <code>open|filtered</code> en casi todo. Se escanean <strong>pocos puertos UDP y
      elegidos</strong>: 53, 67, 123, 161, 500.</p>') ?>

</section>

<!-- ============================ COMBINADO ============================ -->
<section id="combinado">
  <h2>TCP y UDP en la misma ejecución</h2>
  <p class="tut-sub">Una técnica por protocolo y una lista de puertos con prefijos.</p>

  <p>Nmap puede analizar TCP y UDP a la vez si le das un tipo de escaneo para cada uno. Para
  no probar todos los puertos en ambos protocolos, la lista de <code>-p</code> admite
  <strong>calificadores</strong>: <code>T:</code> para TCP y <code>U:</code> para UDP.</p>

  <?= term('<span class="p">$</span> sudo nmap -sS -sU -p T:22,80,443,U:53,123 &lt;IP-LAB&gt;') ?>

  <?= steps([
      '<code>-sS</code> activa el escaneo TCP (SYN) y <code>-sU</code> el UDP. Según el manual, para analizar ambos hay que indicar <code>-sU</code> y al menos un tipo TCP.',
      '<code>T:22,80,443</code> son puertos TCP. El calificador dura hasta que aparece otro.',
      '<code>U:53,123</code> son puertos UDP.',
      'Si pones puertos sin calificador, Nmap los añade a <em>todos</em> los protocolos que estés escaneando.',
  ]) ?>

  <?= term('PORT    STATE  SERVICE' . "\n"
         . '22/tcp  <span class="st-open">open</span>   ssh' . "\n"
         . '80/tcp  <span class="st-open">open</span>   http' . "\n"
         . '443/tcp <span class="st-open">open</span>   https' . "\n"
         . '53/udp  <span class="st-closed">closed</span> domain' . "\n"
         . '123/udp <span class="st-closed">closed</span> ntp', 'salida ilustrativa') ?>

  <p>Por eso importa escribir siempre el protocolo junto al puerto: en la misma tabla
  conviven <code>53/udp</code> y, si lo hubieras pedido, <code>53/tcp</code>, que son
  servicios distintos.</p>
</section>

<!-- ============================= RAZONES ============================= -->
<section id="razones">
  <h2>Verbosidad y razones: <code>-v</code> y <code>--reason</code></h2>
  <p class="tut-sub">Las dos opciones que convierten a Nmap de oráculo en profesor.</p>

  <h3><code>-v</code>: ver el proceso</h3>

  <p>Sin <code>-v</code>, Nmap trabaja en silencio y al final te da el informe. Con
  <code>-v</code> te cuenta cada fase mientras ocurre y te enseña los puertos abiertos en
  cuanto los encuentra, sin esperar al final. Con <code>-vv</code>, más detalle aún.</p>

  <?= term('<span class="p">$</span> nmap -v -p 5432 127.0.0.1') ?>
  <?= term('Initiating Ping Scan at 16:26' . "\n"
         . 'Scanning 127.0.0.1 [2 ports]' . "\n"
         . 'Completed Ping Scan at 16:26, 0.00s elapsed (1 total hosts)' . "\n"
         . 'Initiating Parallel DNS resolution of 1 host. at 16:26' . "\n"
         . 'Completed Parallel DNS resolution of 1 host. at 16:26, 0.00s elapsed' . "\n"
         . 'Initiating Connect Scan at 16:26' . "\n"
         . 'Scanning localhost (127.0.0.1) [1 port]' . "\n"
         . 'Discovered open port 5432/tcp on 127.0.0.1' . "\n"
         . 'Completed Connect Scan at 16:26, 0.00s elapsed (1 total ports)', 'salida real (extracto)') ?>

  <p>Esta salida es el modelo mental en vivo: <em>Ping Scan</em> (descubrimiento, que sin
  root son conexiones a 2 puertos, 80 y 443), <em>DNS resolution</em> (resolución inversa),
  <em>Connect Scan</em> (puertos, con <code>-sT</code> porque no hay root). En escaneos
  largos, pulsar <kbd>Intro</kbd> mientras corre muestra el progreso estimado.</p>

  <h3><code>--reason</code>: la evidencia de cada estado</h3>

  <p>Ya la usaste en la sección de estados. Añade una columna <code>REASON</code> con el tipo
  de respuesta que decidió cada estado. Es la opción más didáctica de Nmap: te obliga a
  pensar en paquetes, no en etiquetas.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Razones habituales que muestra --reason</caption>
      <thead><tr><th scope="col">Razón</th><th scope="col">Qué ocurrió</th><th scope="col">Estado típico</th></tr></thead>
      <tbody>
        <tr><td class="f">syn-ack</td><td class="d">Llegó SYN/ACK</td><td class="d">open (TCP)</td></tr>
        <tr><td class="f">reset</td><td class="d">Llegó RST (escaneo SYN)</td><td class="d">closed</td></tr>
        <tr><td class="f">conn-refused</td><td class="d">El sistema rechazó la conexión (escaneo connect)</td><td class="d">closed</td></tr>
        <tr><td class="f">no-response</td><td class="d">Nada, tras los reintentos</td><td class="d">filtered · open|filtered</td></tr>
        <tr><td class="f">admin-prohibited</td><td class="d">ICMP «prohibido por el administrador»</td><td class="d">filtered</td></tr>
        <tr><td class="f">udp-response</td><td class="d">El servicio UDP contestó</td><td class="d">open (UDP)</td></tr>
        <tr><td class="f">port-unreach</td><td class="d">ICMP port unreachable</td><td class="d">closed (UDP)</td></tr>
      </tbody>
    </table>
  </div>

  <p>Con escaneos que usan paquetes en bruto (<code>-sS</code>, <code>-sU</code>) la razón
  incluye además el TTL de la respuesta (<code>syn-ack ttl 64</code>). Si en un mismo host
  unos puertos responden con TTL 64 y otros con TTL 63, puede que las respuestas vengan de
  equipos distintos: por ejemplo, un firewall intermedio que contesta en nombre del
  servidor.</p>

  <h3>Otras opciones de diagnóstico</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Opciones de diagnóstico de la salida</caption>
      <thead><tr><th scope="col">Opción</th><th scope="col">Para qué</th></tr></thead>
      <tbody>
        <tr><td class="f">--open</td><td class="d">Muestra solo puertos abiertos (o posiblemente abiertos). Informes más limpios</td></tr>
        <tr><td class="f">--packet-trace</td><td class="d">Imprime cada paquete enviado y recibido. Excelente para aprender; abrumador en rangos grandes</td></tr>
        <tr><td class="f">-d · -dd</td><td class="d">Depuración interna de Nmap. Más para diagnosticar Nmap que la red</td></tr>
        <tr><td class="f">--iflist</td><td class="d">Lista las interfaces y rutas que ve Nmap. Útil si no sabe por dónde salir</td></tr>
      </tbody>
    </table>
  </div>

  <?= nm_ficha([
      'Cuándo usarlo' => '<code>--reason</code> siempre que aprendas o investigues un resultado raro; <code>-v</code> en escaneos que duren más de unos segundos.',
      'Qué NO significa' => 'Más verbosidad no es más precisión: el escaneo es el mismo, solo te lo cuenta.',
      'Ciberseguridad' => 'Guardar las razones en el informe convierte «filtered» en evidencia verificable («no-response» frente a «admin-prohibited»).',
      'Error común' => 'Leer el estado sin su razón y discutir durante horas si «está abierto o no».',
      'Mini práctica' => 'Ejecuta <code>nmap --reason -p 1-100 127.0.0.1</code> y cuenta cuántas razones distintas aparecen. Repite en tu VM con <code>sudo</code>.',
  ]) ?>
</section>

  <?= recap('Niveles 1 y 2 · Descubrimiento y puertos', [
      'El descubrimiento es un paso aparte del escaneo, y puede equivocarse: <code>-Pn</code> se lo salta.',
      'CIDR no es notación decorativa: el prefijo dice cuántos bits identifican la red y, por tanto, cuántos equipos caben.',
      '<code>-sT</code> completa la conexión y es más registrable; <code>-sS</code> no la completa y necesita privilegios. Llegan a la misma conclusión.',
      'UDP no confirma nada, así que el silencio no distingue abierto de filtrado. De ahí <code>open|filtered</code> y la lentitud.',
      '<code>--reason</code> convierte cada estado en una afirmación verificable: dice qué paquete lo produjo.',
  ], [
      'sudo nmap -sn 192.168.56.0/24',
      'nmap -sT -p 22,80,443 127.0.0.1',
      'sudo nmap -sS -p- 192.168.56.10',
      'sudo nmap -sU -p 53,123,161 192.168.56.10',
      'nmap --reason -v 127.0.0.1',
  ], [
      'Un <code>closed</code> demuestra que el equipo está vivo; un <code>filtered</code> no demuestra nada sobre el servicio.',
      'Que un escaneo UDP amplio termine rápido suele significar que no terminó.',
      'La diferencia entre «no respondió» y «respondió que no».',
  ]) ?>

  <?= quiz([
      [
          'q' => 'Un escaneo UDP al puerto 161 devuelve open|filtered. ¿Qué significa?',
          'opts' => ['A' => 'El puerto está abierto', 'B' => 'El puerto está filtrado', 'C' => 'No hubo respuesta, y ese silencio no permite distinguir entre las dos cosas', 'D' => 'Nmap se quedó sin tiempo'],
          'ok' => 'C',
          'why' => 'Un servicio UDP abierto que no sabe qué hacer con la sonda y un cortafuegos que descarta el paquete generan la misma evidencia: nada. Nmap podría elegir una de las dos y acertaría la mitad de las veces; en lugar de eso informa de su propia incertidumbre, que es la respuesta honesta.',
      ],
      [
          'q' => '¿Cuál es la diferencia práctica real entre -sT y -sS?',
          'opts' => ['A' => '-sS detecta más puertos', 'B' => '-sS es indetectable', 'C' => '-sT completa la conexión, así que la aplicación puede registrarla; -sS no llega a completarla', 'D' => '-sT funciona con UDP'],
          'ok' => 'C',
          'why' => 'Ambos concluyen lo mismo sobre el puerto. Lo que cambia es el coste —<code>-sS</code> manda un paquete menos y no ocupa un descriptor— y el rastro en el <em>log de la aplicación</em>. En el cortafuegos y en cualquier captura de red, los dos se ven igual de bien.',
      ],
      [
          'q' => 'nmap -sn sobre un rango informa de 3 hosts up de 254. ¿Qué puedes afirmar?',
          'opts' => ['A' => 'Que solo hay 3 equipos en la red', 'B' => 'Que 3 respondieron a alguna de las sondas de descubrimiento', 'C' => 'Que los otros 251 están apagados', 'D' => 'Que la red está mal configurada'],
          'ok' => 'B',
          'why' => 'Es todo lo que demuestra el resultado. Un equipo con cortafuegos restrictivo no responde a ninguna de las cuatro sondas y sale como caído estando perfectamente encendido y sirviendo tráfico. Si el inventario importa, <code>-Pn</code> sobre el rango lo comprueba de otra manera — más lenta, pero sin ese sesgo.',
      ],
  ]) ?>


<?= nm_nivel('3', 'Servicios y versiones', 'Dejar de adivinar por el número de puerto y preguntar qué software hay realmente detrás.', 'intermedio') ?>

<!-- ============================ VERSIONES ============================ -->
<section id="versiones">
  <h2>Servicios y versiones: <code>-sV</code></h2>
  <p class="tut-sub">De «el 22 suele ser SSH» a «en el 22 hay un OpenSSH 9.2p1 de Debian».</p>

  <p><strong>Qué hace.</strong> Después del escaneo de puertos, para cada puerto abierto,
  Nmap se conecta y conversa con el servicio para averiguar qué protocolo habla, qué
  programa es y, si puede, qué versión.</p>

  <h3>Cómo funciona</h3>

  <?= steps([
      '<strong>Escucha primero.</strong> Muchos servicios se presentan nada más conectar: SSH, SMTP o FTP envían un saludo de texto, el <em>banner</em>. Nmap espera unos segundos a ver si llega algo.',
      '<strong>Pregunta después.</strong> Si el servicio calla, Nmap le envía <em>probes</em> (sondas): una petición HTTP, un saludo TLS, una consulta DNS… Están en <code>/usr/share/nmap/nmap-service-probes</code>, ordenadas por lo probable que es que funcionen.',
      '<strong>Compara.</strong> Cada respuesta se contrasta con miles de firmas (expresiones regulares) de ese mismo archivo. Esa comparación es el <em>fingerprinting</em> de servicios.',
      '<strong>Informa.</strong> Si una firma coincide, rellena SERVICE y VERSION. Si detecta TLS, abre la conexión cifrada y repite el proceso dentro.',
  ]) ?>

  <?= term('<span class="p">$</span> nmap -sV -p 22,80,443,3306 192.168.56.10') ?>
  <?= term('PORT     STATE SERVICE  VERSION' . "\n"
         . '22/tcp   <span class="st-open">open</span>  ssh      OpenSSH 9.2p1 Debian 2+deb12u3 (protocol 2.0)' . "\n"
         . '80/tcp   <span class="st-open">open</span>  http     nginx 1.22.1' . "\n"
         . '443/tcp  <span class="st-open">open</span>  ssl/http nginx 1.22.1' . "\n"
         . '3306/tcp <span class="st-open">open</span>  mysql    MySQL 8.0.39' . "\n"
         . 'Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel', 'salida ilustrativa') ?>

  <h3>Cómo leer una línea de versión</h3>

  <p>Tomemos <code>22/tcp open ssh OpenSSH 9.2p1 Debian 2+deb12u3 (protocol 2.0)</code>:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Desglose de una línea de detección de versión</caption>
      <thead><tr><th scope="col">Fragmento</th><th scope="col">Qué es</th><th scope="col">De dónde sale</th></tr></thead>
      <tbody>
        <tr><td class="f">ssh</td><td class="d">Protocolo detectado</td><td class="d">Ahora sí: por la respuesta, no por el número</td></tr>
        <tr><td class="f">OpenSSH</td><td class="d">Producto</td><td class="d">El banner que el propio servidor envía</td></tr>
        <tr><td class="f">9.2p1</td><td class="d">Versión de origen (upstream)</td><td class="d">Banner</td></tr>
        <tr><td class="f">Debian 2+deb12u3</td><td class="d">Revisión del paquete de la distribución</td><td class="d">Banner: aquí viene la información de parches</td></tr>
        <tr><td class="f">(protocol 2.0)</td><td class="d">Versión del protocolo SSH</td><td class="d">Banner</td></tr>
      </tbody>
    </table>
  </div>

  <p>Dos lecturas importantes. <strong>Primera:</strong> todo eso lo dice el servidor sobre
  sí mismo; Nmap solo lo reconoce y lo ordena. <strong>Segunda:</strong> las distribuciones
  corrigen fallos de seguridad sin cambiar el número de versión de origen (lo llaman
  <em>backporting</em>). Un «OpenSSH 9.2p1» de Debian con la revisión <code>deb12u3</code>
  puede tener parches que un 9.2p1 compilado a mano no tiene. Comparar solo el número con
  una lista de fallos conocidos produce falsos positivos.</p>

  <h3>Salidas que desconciertan</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Resultados especiales de la detección de versiones</caption>
      <thead><tr><th scope="col">Verás</th><th scope="col">Significa</th></tr></thead>
      <tbody>
        <tr><td class="f">tcpwrapped</td><td class="d">El servicio aceptó la conexión y la cerró sin decir nada. Suele indicar un control de acceso (solo habla con clientes concretos) o un protocolo que espera otra cosa. En la máquina del tutorial le pasa a KDE Connect (1716/tcp).</td></tr>
        <tr><td class="f">ssl/unknown</td><td class="d">Hay TLS, pero lo que va dentro no coincide con ninguna firma.</td></tr>
        <tr><td class="f">X services unrecognized despite returning data</td><td class="d">El servicio respondió, pero no hay firma. Nmap imprime una huella (<code>SF-Port…</code>) y te invita a enviarla.</td></tr>
        <tr><td class="f">http · Golang net/http server (…)</td><td class="d">Coincidencia genérica: sabe el lenguaje o el servidor, no la aplicación.</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('Antes de enviar una huella a nmap.org',
      '<p>La huella <code>SF-Port…</code> contiene fragmentos de las respuestas reales del
      servicio. En tu laboratorio, adelante. En una auditoría de un cliente, esas respuestas
      son información del cliente: no la envíes a terceros sin permiso.</p>') ?>

  <h3>Intensidad</h3>

  <p><code>--version-intensity</code> va de 0 a 9 (7 por defecto): cuántas sondas, de las
  menos probables, está dispuesto a probar Nmap. <code>--version-light</code> equivale a 2 y
  <code>--version-all</code> a 9. Más intensidad identifica servicios raros, pero tarda más y
  envía más tráfico. Un detalle de prudencia del propio Nmap: por defecto <strong>no
  sondea el puerto 9100</strong>, porque muchas impresoras imprimen cualquier cosa que
  reciben ahí.</p>

  <?= nm_ficha([
      'Cuándo usarlo' => 'Siempre que quieras saber qué hay, no qué suele haber. En inventario y auditoría es casi obligatorio.',
      'Qué NO significa' => 'Una versión detectada no demuestra una vulnerabilidad, y un banner puede ser falso o genérico.',
      'Ciberseguridad' => 'La versión es la puerta de entrada a la gestión de parches: te dice qué revisar, no qué está roto.',
      'Error común' => 'Tomarlo como instantáneo: en esta máquina, <code>-sV</code> sobre cuatro puertos tardó entre 20 y 30 segundos por los servicios que no se identifican a la primera.',
      'Mini práctica' => 'Ejecuta <code>nmap -sV 127.0.0.1</code>. Compara la columna SERVICE con la de <code>nmap 127.0.0.1</code>. ¿Cuántos nombres cambiaron?',
  ]) ?>

  <h3>La diferencia, en dos salidas reales</h3>

  <?= shot('nmap/07-service-vs-version.svg',
      'A la izquierda, nmap -p 8090 informa del servicio como opsmessaging; a la derecha, '
      . 'nmap -sV -p 8090 sobre el mismo puerto informa http y Apache httpd 2.4.68 '
      . '(Debian). Debajo, qué se puede y qué no se puede concluir.',
      '<b>Qué estás viendo:</b> el mismo puerto de la misma máquina, escaneado dos veces. '
      . '<b>Dónde mirar:</b> el cambio de <code>opsmessaging</code> a <code>Apache '
      . 'httpd</code> — la primera es una suposición leída de un fichero, la segunda es el '
      . 'resultado de preguntar.',
      'real') ?>

  <?= evidence(
      '<p><code>8090/tcp open http Apache httpd 2.4.68 ((Debian))</code></p>',
      '<p>En ese puerto hay algo que habla HTTP y se identifica como Apache 2.4.68 sobre
      Debian.</p>',
      '<p>Que sea realmente Apache, ni que esa versión tenga un problema explotable aquí.
      Un banner es texto que el servicio elige enviar y se puede cambiar en una línea de
      configuración. Y aunque fuese cierto: las distribuciones retroportan parches de
      seguridad sin cambiar el número de versión, así que «2.4.68» no dice si esa máquina
      está al día. Para eso hace falta preguntarle al sistema, no a la red.</p>') ?>

</section>

<!-- ========================= IMPORTA VERSIÓN ========================= -->
<section id="importa-version">
  <h2>¿Por qué importa la versión?</h2>
  <p class="tut-sub">Desde la defensa, la versión no es un trofeo: es una línea del inventario.</p>

  <ul>
    <li><strong>Inventario.</strong> Saber qué software ejecuta cada equipo, y en qué
    versión, es la base de cualquier programa de seguridad. No puedes proteger lo que no
    sabes que tienes.</li>
    <li><strong>Software viejo.</strong> Una versión muy antigua indica un sistema que nadie
    actualiza. El problema suele ser el proceso, no solo ese programa.</li>
    <li><strong>Servicios inesperados.</strong> Un MySQL en un servidor que solo debería
    servir web es un hallazgo aunque esté al día.</li>
    <li><strong>Superficie de exposición.</strong> Cada servicio con versión es una pieza que
    alguien puede investigar. Menos servicios, menos piezas.</li>
    <li><strong>Gestión de parches.</strong> Cruzar versiones con los avisos de seguridad de
    tu distribución te dice qué actualizar primero.</li>
  </ul>

  <?= note('Detectar una versión no demuestra una vulnerabilidad explotable',
      '<p>Entre «este servidor anuncia la versión X» y «este servidor es vulnerable a Y» hay
      preguntas que Nmap no responde: ¿el fallo afecta a la configuración usada? ¿La
      distribución aplicó el parche sin cambiar el número? ¿El banner dice la verdad? ¿La
      función afectada está habilitada? La versión abre una línea de investigación; no la
      cierra.</p>') ?>

  <?= reveal('Mini ejercicio: ¿hecho o conclusión?', '
    <p>Clasifica cada frase:</p>
    <ol>
      <li>«El puerto 22/tcp responde con el banner de OpenSSH 9.2p1 Debian 2+deb12u3.»</li>
      <li>«El servidor es vulnerable porque su OpenSSH no es la última versión.»</li>
      <li>«Conviene comprobar si el paquete openssh-server está actualizado según los avisos de Debian.»</li>
    </ol>
    <p><strong>Solución.</strong> La 1 es un <em>hecho</em> observado por Nmap. La 2 es una
    <em>conclusión</em> no soportada: «no es la última» no implica vulnerable, y el
    backporting de Debian puede haber corregido el fallo. La 3 es una <em>acción</em>
    razonable derivada del hecho. Un buen informe está hecho de frases del tipo 1 y 3.</p>') ?>
</section>

  <?= quiz([
      [
          'q' => 'nmap -sV informa «OpenSSH 8.4p1 Debian 5+deb11u1». Buscas y esa versión tiene un CVE. ¿Qué has demostrado?',
          'opts' => ['A' => 'Que el servidor es vulnerable', 'B' => 'Que hay un servicio cuyo banner coincide con una versión que tuvo un problema conocido', 'C' => 'Que hay que actualizar ya', 'D' => 'Que el servidor está comprometido'],
          'ok' => 'B',
          'why' => 'Dos motivos para frenar. Primero, el banner puede mentir. Segundo, y más importante en la práctica: Debian retroporta los parches de seguridad manteniendo el número de versión, así que ese «8.4p1» puede llevar el arreglo aplicado desde hace meses. La comprobación real se hace en el equipo, con el gestor de paquetes.',
      ],
      [
          'q' => '¿Por qué -sV tarda bastante más que un escaneo normal?',
          'opts' => ['A' => 'Prueba más puertos', 'B' => 'Abre conexión con cada puerto abierto, envía sondas y compara la respuesta con miles de huellas', 'C' => 'Resuelve nombres DNS', 'D' => 'Espera el tiempo de espera completo en cada puerto'],
          'ok' => 'B',
          'why' => 'Un escaneo normal solo mira si hay respuesta al saludo TCP. <code>-sV</code> además conversa: conecta, lee lo que el servicio dice al abrirse, y si eso no basta, prueba sondas específicas. Ese trabajo es el que convierte una suposición en evidencia, y cuesta tiempo.',
      ],
  ]) ?>


<?= nm_nivel('4', 'Sistema operativo y opciones compuestas', 'Huellas de TCP/IP, el camino hasta el objetivo, la opción -A desmontada pieza a pieza y el ritmo del escaneo.', 'intermedio') ?>

<!-- ================================ OS =============================== -->
<section id="os">
  <h2>Detección de sistema operativo: <code>-O</code></h2>
  <p class="tut-sub">Una estimación estadística a partir de cómo responde la pila TCP/IP. Nunca una certeza.</p>

  <p><strong>Qué hace.</strong> Intenta adivinar el sistema operativo del objetivo sin
  entrar en él, por la forma en que su pila TCP/IP responde a paquetes poco habituales.</p>

  <h3>Cómo funciona</h3>

  <p>Cada sistema implementa TCP/IP con pequeñas diferencias que el estándar permite: el
  <strong>TTL</strong> inicial de sus paquetes, el tamaño de ventana, el orden de las
  opciones TCP, cómo numera las secuencias, cómo responde a combinaciones raras de flags,
  qué hace con ciertas sondas ICMP. Nmap envía una batería de sondas TCP, UDP e ICMP,
  mide todo eso y compara el resultado con miles de huellas de
  <code>/usr/share/nmap/nmap-os-db</code>. Es <em>fingerprinting</em> de la pila, y es
  <strong>heurística</strong>: busca la huella más parecida, no una idéntica.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">TTL inicial típico por familia de sistema</caption>
      <thead><tr><th scope="col">TTL inicial típico</th><th scope="col">Suele indicar</th></tr></thead>
      <tbody>
        <tr><td class="f">64</td><td class="d">Linux, BSD, macOS, Android</td></tr>
        <tr><td class="f">128</td><td class="d">Windows</td></tr>
        <tr><td class="f">255</td><td class="d">Muchos equipos de red (routers, switches)</td></tr>
      </tbody>
    </table>
  </div>

  <p>El TTL baja uno por cada router atravesado: si recibes TTL 63, lo normal es que el
  origen empezara en 64 y haya un salto de por medio. Es una pista rápida, no una prueba:
  el TTL se puede cambiar con una línea de configuración.</p>

  <?= term('<span class="p">$</span> sudo nmap -O 192.168.56.10') ?>
  <?= term('Device type: general purpose' . "\n"
         . 'Running: Linux 5.X|6.X' . "\n"
         . 'OS CPE: cpe:/o:linux:linux_kernel:5 cpe:/o:linux:linux_kernel:6' . "\n"
         . 'OS details: Linux 5.0 - 6.2' . "\n"
         . 'Network Distance: 1 hop', 'salida ilustrativa') ?>

  <p><strong>Cómo interpretarlo.</strong> «Linux, con un kernel entre 5.0 y 6.2» — un
  rango, no un número. <code>Network Distance: 1 hop</code>: está en tu misma red. Cuando
  Nmap no está seguro, lo dice:</p>

  <?= term('No exact OS matches for host (test conditions non-ideal).' . "\n"
         . 'Aggressive OS guesses: Linux 5.0 - 5.14 (96%), Linux 4.15 - 5.19 (93%), …', 'salida ilustrativa') ?>

  <p>Los porcentajes son parecido a una huella conocida, no probabilidad de acierto.</p>

  <h3>Condiciones para que funcione bien</h3>

  <ul>
    <li><strong>Privilegios:</strong> sin root, Nmap se niega (<code>TCP/IP fingerprinting
    (for OS scan) requires root privileges</code>).</li>
    <li><strong>Al menos un puerto TCP abierto y uno cerrado.</strong> El manual lo dice
    expresamente: con todo filtrado, la precisión se desploma.
    <code>--osscan-limit</code> hace que ni lo intente en hosts que no cumplen eso.</li>
    <li><strong>Pocos intermediarios:</strong> cuanto más cerca, mejor.</li>
  </ul>

  <h3>Por qué puede equivocarse</h3>

  <ul>
    <li><strong>Firewalls, NAT y balanceadores</strong> responden en nombre del servidor o
    reescriben paquetes: puedes estar identificando el firewall.</li>
    <li><strong>Contenedores:</strong> un contenedor comparte el kernel del host. Escanear
    un contenedor Debian en un anfitrión Arch dará… el kernel del anfitrión.</li>
    <li><strong>Ajustes personalizados</strong> de la pila (TTL, ventanas) desplazan la
    huella.</li>
    <li><strong>Sistemas nuevos o raros</strong> sin huella en la base de datos.</li>
  </ul>

  <?= nm_ficha([
      'Cuándo usarlo' => 'En inventario, para clasificar equipos desconocidos («esto parece un Linux», «esto parece una impresora») y priorizar.',
      'Qué NO significa' => 'No es una certeza, ni identifica la distribución concreta ni su nivel de parches.',
      'Ciberseguridad' => 'Un «Windows» en una VLAN de servidores Linux, o un «dispositivo embebido» donde no esperabas ninguno, merece verificarse físicamente o en el inventario.',
      'Error común' => 'Copiar «OS details» a un informe como hecho. Escríbelo como «Nmap estima…».',
      'Mini práctica' => 'Ejecuta <code>sudo nmap -O</code> contra tu VM. Después contra un contenedor Docker propio en tu máquina y compara el resultado con la distribución real del contenedor.',
  ]) ?>
</section>

<!-- ============================ TRACEROUTE =========================== -->
<section id="traceroute">
  <h2>Camino hasta el objetivo: <code>--traceroute</code></h2>
  <p class="tut-sub">Qué routers atraviesan tus paquetes, calculado después del escaneo.</p>

  <p><strong>Qué hace.</strong> Terminado el escaneo, descubre los saltos (routers) entre tu
  equipo y cada objetivo. Aprovecha lo que ya sabe: elige el puerto y protocolo con más
  probabilidades de llegar y envía paquetes con TTL creciente. Cada router que agota el TTL
  devuelve un ICMP «time exceeded», y así se revela.</p>

  <?= term('<span class="p">$</span> sudo nmap --traceroute -p 22 192.168.56.10') ?>
  <?= term('TRACEROUTE' . "\n"
         . 'HOP RTT     ADDRESS' . "\n"
         . '1   0.41 ms 192.168.56.10', 'salida ilustrativa') ?>

  <p>En el laboratorio verás un solo salto: la VM está en tu misma red. Entre dos redes de
  laboratorio (por ejemplo, con una VM haciendo de router) verías el router en medio.</p>

  <?= nm_ficha([
      'Cuándo usarlo' => 'Para entender la topología de una red que administras: si hay un firewall o router entre segmentos, y dónde.',
      'Qué NO significa' => 'Un salto que no responde (<code>...</code>) no está caído: muchos routers no generan ICMP.',
      'Ciberseguridad' => 'Confirma si un servicio llega directo o a través de un equipo que podría estar filtrando o traduciendo (NAT).',
      'Error común' => 'Combinarlo con <code>-sT</code>: el manual indica que no funciona con connect scan. Y necesita root.',
      'Mini práctica' => 'Con <code>sudo</code>, ejecútalo contra tu VM y fíjate en el número de saltos y en la línea <code>Network Distance</code> si añades <code>-O</code>.',
  ]) ?>

  <?= note('Solo en redes que administras',
      '<p>El trazado revela la infraestructura intermedia. Hacerlo sobre redes ajenas es
      reconocimiento de infraestructura de terceros; en este curso se limita a tu
      laboratorio.</p>') ?>
</section>

<!-- ============================= AGRESIVO ============================ -->
<section id="agresivo">
  <h2>La opción <code>-A</code>, desmontada</h2>
  <p class="tut-sub">Cuatro opciones en una letra. Cómoda, y precisamente por eso conviene no usarla sin pensar.</p>

  <p>Según el manual de la 7.991, <code>-A</code> activa exactamente:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Qué opciones activa -A</caption>
      <thead><tr><th scope="col">Pieza</th><th scope="col">Equivale a</th><th scope="col">¿Requiere root?</th></tr></thead>
      <tbody>
        <tr><td class="f">Detección de SO</td><td class="d"><code>-O</code></td><td class="d">Sí; sin root se omite</td></tr>
        <tr><td class="f">Detección de versiones</td><td class="d"><code>-sV</code></td><td class="d">No</td></tr>
        <tr><td class="f">Scripts por defecto</td><td class="d"><code>-sC</code> (= <code>--script=default</code>, 127 scripts en la 7.991)</td><td class="d">No</td></tr>
        <tr><td class="f">Traceroute</td><td class="d"><code>--traceroute</code></td><td class="d">Sí; sin root se omite</td></tr>
      </tbody>
    </table>
  </div>

  <?= term('<span class="p">$</span> sudo nmap -A 192.168.56.10' . "\n"
         . '<span class="c"># es lo mismo que:</span>' . "\n"
         . '<span class="p">$</span> sudo nmap -O -sV -sC --traceroute 192.168.56.10') ?>

  <p>No activa ni el ritmo (<code>-T4</code>) ni la verbosidad (<code>-v</code>), ni cambia
  los puertos analizados (siguen siendo los 1000 por defecto).</p>

  <h3>Por qué no usar <code>-A</code> para todo</h3>

  <ul>
    <li><strong>Pides cosas que no necesitas.</strong> Si la pregunta es «¿sigue cerrado el
    3306?», <code>-p 3306</code> responde en milisegundos; <code>-A</code> tarda minutos.</li>
    <li><strong>Más tráfico y más registros</strong> en el objetivo: conexiones de versión,
    ejecución de 127 scripts, sondas de SO.</li>
    <li><strong>Salida más difícil de leer</strong> y de comparar entre dos fechas.</li>
    <li><strong>Pierdes el control:</strong> el manual advierte que, como incluye scripts,
    no debe usarse sobre redes sin permiso. Si no sabes qué scripts corrieron, no puedes
    explicarlo en un informe.</li>
  </ul>

  <?= note('Criterio profesional',
      '<p>Pide lo que necesitas saber: <code>-sV</code> si quieres versiones, <code>-O</code>
      si quieres el SO, scripts concretos si quieres un dato concreto. <code>-A</code> está
      bien en tu propio laboratorio para ver «todo junto» una vez; en una auditoría, cada
      opción debería poder justificarse.</p>', 'info') ?>
</section>

<!-- ============================== TIMING ============================= -->
<section id="timing">
  <h2>Timing y carga: <code>-T0</code> a <code>-T5</code></h2>
  <p class="tut-sub">Velocidad, fiabilidad y respeto por los equipos que analizas.</p>

  <p>Nmap ajusta solo muchos parámetros de ritmo: cuánto espera una respuesta, cuántas
  sondas manda en paralelo, cuántas veces reintenta. Las <strong>plantillas de
  timing</strong> le dicen cuánto margen tiene:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Plantillas de timing de Nmap</caption>
      <thead><tr><th scope="col">Plantilla</th><th scope="col">Nombre</th><th scope="col">Comportamiento</th><th scope="col">Uso en este curso</th></tr></thead>
      <tbody>
        <tr><td class="f">-T0 · -T1</td><td class="d">paranoid · sneaky</td><td class="d">Extremadamente lentos: una sonda cada varios minutos o segundos, en serie</td><td class="d">No. Pensados para escenarios fuera del alcance de este tutorial; en inventario solo alargan el trabajo</td></tr>
        <tr><td class="f">-T2</td><td class="d">polite</td><td class="d">Ralentiza para consumir menos ancho de banda y recursos del objetivo</td><td class="d">Equipos frágiles: impresoras, dispositivos embebidos, enlaces lentos</td></tr>
        <tr><td class="f">-T3</td><td class="d">normal</td><td class="d">El valor por defecto. Poner <code>-T3</code> no cambia nada</td><td class="d">Siempre, salvo razón concreta</td></tr>
        <tr><td class="f">-T4</td><td class="d">aggressive</td><td class="d">Asume una red rápida y fiable; espera menos</td><td class="d">Tu laboratorio local de VM, si tienes prisa</td></tr>
        <tr><td class="f">-T5</td><td class="d">insane</td><td class="d">Sacrifica precisión por velocidad: puede dar puertos por filtrados por no esperar bastante</td><td class="d">No: resultados menos fiables</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Qué se gana y qué se pierde</h3>

  <ul>
    <li><strong>Más rápido = más carga.</strong> Más sondas por segundo sobre el objetivo y
    sobre la red. Un servidor aguanta; un dispositivo embebido viejo o un enlace saturado,
    quizás no.</li>
    <li><strong>Más rápido = menos paciencia.</strong> Con tiempos de espera cortos, una
    respuesta tardía se pierde y un puerto abierto puede aparecer como filtrado.</li>
    <li><strong>Redes lentas</strong> (wifi saturada, VPN, enlaces lejanos): acelerar suele
    empeorar los resultados.</li>
  </ul>

  <h3>Límites finos, pensados para no molestar</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Opciones para limitar la carga de un escaneo</caption>
      <thead><tr><th scope="col">Opción</th><th scope="col">Efecto</th></tr></thead>
      <tbody>
        <tr><td class="f">--max-rate 50</td><td class="d">Nunca más de 50 paquetes por segundo. Techo de cortesía para equipos delicados</td></tr>
        <tr><td class="f">--host-timeout 10m</td><td class="d">Abandona un host si tarda más de 10 minutos: evita que uno solo bloquee todo el inventario</td></tr>
        <tr><td class="f">--max-retries 2</td><td class="d">Limita los reintentos por sonda</td></tr>
      </tbody>
    </table>
  </div>

  <?= term('<span class="p">$</span> sudo nmap -sS -T2 --max-rate 50 -p 22,80,443,9100 192.168.56.40 <span class="c"># impresora de laboratorio</span>') ?>

  <?= nm_ficha([
      'Cuándo usarlo' => 'Casi nunca hace falta tocarlo. <code>-T4</code> en tu laboratorio; <code>-T2</code> y <code>--max-rate</code> con dispositivos frágiles.',
      'Qué NO significa' => 'Ir más lento no hace el escaneo «invisible» ni más legítimo: la autorización es lo que lo hace legítimo.',
      'Ciberseguridad' => 'Un inventario que tumba una impresora o un equipo industrial es un incidente causado por el auditor. La cortesía de ritmo es parte del trabajo.',
      'Error común' => 'Poner <code>-T5</code> «para ir rápido» y reportar como filtrados puertos que simplemente respondieron tarde.',
      'Mini práctica' => 'Contra tu VM, compara el tiempo total y los resultados de <code>-T3</code> y <code>-T4</code> sobre <code>-p 1-1000</code>.',
  ]) ?>
</section>

<!-- ========================== FUERA ALCANCE ========================== -->
<section id="fuera-alcance">
  <h2>Lo que este tutorial no enseña</h2>
  <p class="tut-sub">Y por qué, desde el lado defensivo, conviene saber que existe.</p>

  <p>Si lees <code>nmap --help</code> entero verás un bloque titulado <em>FIREWALL/IDS
  EVASION AND SPOOFING</em>, además de tipos de escaneo TCP poco comunes y una técnica de
  escaneo indirecto. <strong>Nmap dispone de capacidades avanzadas fuera del alcance de
  este tutorial defensivo.</strong> Aquí no se explican ni se usan.</p>

  <p>Lo que sí importa a quien defiende es la consecuencia:</p>

  <ul>
    <li><strong>La ausencia de alertas no demuestra la ausencia de escaneos.</strong> Tu
    detección debe basarse en varias fuentes (firewall, flujos de red, registros de
    servicios), no en una sola regla.</li>
    <li><strong>La IP de origen que ves en un registro no siempre es el origen real</strong>
    de la actividad. Trátala como un indicio que hay que corroborar, no como una
    atribución.</li>
    <li><strong>La mejor defensa no depende del escáner:</strong> si un servicio no está
    expuesto, no hay técnica de escaneo que lo haga aparecer. Reducir superficie vence a
    detectar.</li>
  </ul>
</section>

<?= nm_nivel('5', 'NSE · Nmap Scripting Engine', 'El motor que convierte Nmap en una herramienta extensible. Usado con cabeza y con categorías seguras.', 'intermedio') ?>

<!-- ============================== NSE ================================ -->
<section id="nse">
  <h2>Qué es NSE</h2>
  <p class="tut-sub">Un intérprete de Lua dentro de Nmap, con 611 scripts listos en la 7.991.</p>

  <p>El <strong>Nmap Scripting Engine</strong> permite que Nmap ejecute pequeños programas
  escritos en <strong>Lua</strong> durante un escaneo. Cada script automatiza una tarea que
  antes harías a mano: leer el título de una web, mostrar el certificado TLS, listar los
  algoritmos que acepta un SSH, consultar la versión de un DNS. En la 7.991 vienen 611
  scripts en <code>/usr/share/nmap/scripts/</code>.</p>

  <h3>Cuándo se ejecuta un script</h3>

  <p>La mayoría son <em>host</em> o <em>service scripts</em>: corren después del escaneo de
  puertos y de la detección de versiones, sobre los puertos que encajan con cada script (uno
  de HTTP solo actúa sobre puertos donde hay HTTP). Por eso NSE se combina casi siempre con
  <code>-sV</code>: la detección de versiones es la que le dice a cada script dónde
  trabajar.</p>

  <h3>Dónde viven</h3>

  <?= term('<span class="p">$</span> ls /usr/share/nmap/scripts/ | head' . "\n"
         . '<span class="p">$</span> ls /usr/share/nmap/scripts/ | wc -l   <span class="c"># 611</span>' . "\n"
         . '<span class="p">$</span> ls /usr/share/nmap/scripts/http-*.nse | wc -l   <span class="c"># los de HTTP</span>') ?>

  <p>Cada script es un archivo <code>.nse</code>. El índice
  <code>/usr/share/nmap/scripts/script.db</code> asocia cada uno con sus categorías; es el
  archivo que Nmap consulta cuando pides una categoría en vez de un nombre.</p>

  <?= note('NSE es tan potente como peligroso si no lo lees',
      '<p>Un script puede limitarse a leer una cabecera… o intentar adivinar contraseñas,
      provocar una caída o modificar datos. La categoría de cada uno te dice de qué tipo es,
      y <code>--script-help</code> te lo explica <em>antes</em> de ejecutarlo. Este curso usa
      solo scripts de categorías no intrusivas.</p>') ?>
</section>

<!-- ========================= CATEGORÍAS NSE ========================== -->
<section id="nse-categorias">
  <h2>Categorías NSE</h2>
  <p class="tut-sub">La etiqueta que dice cuánto se atreve un script. Léela antes de ejecutar.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Categorías de scripts NSE y su seguridad</caption>
      <thead><tr><th scope="col">Categoría</th><th scope="col">Qué hacen</th><th scope="col">En este curso</th></tr></thead>
      <tbody>
        <tr><td class="f">safe</td><td class="d">Diseñados para no dañar ni sobrecargar: leen información, no fuerzan nada (352 scripts)</td><td class="d"><b>Sí</b></td></tr>
        <tr><td class="f">discovery</td><td class="d">Descubren información de la red y los servicios de forma no agresiva (315)</td><td class="d"><b>Sí</b>, los que además son <code>safe</code></td></tr>
        <tr><td class="f">default</td><td class="d">Los que ejecuta <code>-sC</code> y <code>-A</code>: útiles, rápidos y de bajo impacto (127)</td><td class="d"><b>Sí</b>, entendiendo cuáles corren</td></tr>
        <tr><td class="f">version</td><td class="d">Amplían la detección de versiones; corren con <code>-sV</code> (48)</td><td class="d"><b>Sí</b></td></tr>
        <tr><td class="f">auth</td><td class="d">Tratan con autenticación (sin fuerza bruta)</td><td class="d">Con criterio</td></tr>
        <tr><td class="f">intrusive</td><td class="d">Pueden sobrecargar, alterar o hacer caer un servicio (217)</td><td class="d">No</td></tr>
        <tr><td class="f">brute</td><td class="d">Prueban credenciales por fuerza bruta (75)</td><td class="d">No</td></tr>
        <tr><td class="f">exploit</td><td class="d">Intentan explotar vulnerabilidades (45)</td><td class="d">No</td></tr>
        <tr><td class="f">dos</td><td class="d">Pueden causar denegación de servicio (11)</td><td class="d">No</td></tr>
        <tr><td class="f">vuln</td><td class="d">Comprueban vulnerabilidades concretas; muchos son intrusivos (105)</td><td class="d">Solo con autorización expresa y sabiendo qué hace cada uno</td></tr>
        <tr><td class="f">malware</td><td class="d">Buscan señales de equipos comprometidos (10)</td><td class="d">Defensivo, con criterio</td></tr>
        <tr><td class="f">broadcast · external</td><td class="d">Emiten a toda la red / consultan servicios de terceros en Internet (47 · 33)</td><td class="d">No por defecto: ver aviso</td></tr>
      </tbody>
    </table>
  </div>

  <p>Un mismo script puede estar en varias categorías. <code>http-title</code>, por ejemplo,
  es <code>default</code>, <code>discovery</code> y <code>safe</code> a la vez. Los números
  salen de contar categorías en <code>script.db</code> de la 7.991.</p>

  <?= note('safe no siempre significa «se queda en tu red»',
      '<p>Dos categorías merecen cuidado aunque sean «safe»: <code>broadcast</code> emite a
      todo el segmento y <code>external</code> consulta servicios de terceros en Internet
      (por ejemplo, bases de datos de reputación). Un script puede ser <code>safe</code> y
      <code>external</code> a la vez: no daña el objetivo, pero envía datos sobre él a un
      tercero. Para quedarte en lo verdaderamente local, combina categorías como verás
      ahora.</p>') ?>
</section>

<!-- ========================= SCRIPT-HELP ============================= -->
<section id="script-help">
  <h2>Leer antes de ejecutar: <code>--script-help</code></h2>
  <p class="tut-sub">La costumbre que separa el uso responsable de NSE del «a ver qué pasa».</p>

  <p>Antes de ejecutar un script que no conoces, pídele que se explique. No envía nada a
  ningún objetivo: solo lee la documentación del script.</p>

  <?= term('<span class="p">$</span> nmap --script-help http-title') ?>
  <?= term('http-title' . "\n"
         . 'Categories: default discovery safe' . "\n"
         . 'https://nmap.org/nsedoc/scripts/http-title.html' . "\n"
         . '  Shows the title of the default page of a web server.' . "\n"
         . '  The script will follow up to 5 HTTP redirects, using the default rules in the' . "\n"
         . '  http library.', 'salida real') ?>

  <p>En tres líneas sabes lo esencial: <strong>qué hace</strong> (muestra el título),
  <strong>sus categorías</strong> (default, discovery, safe: sin sorpresas) y
  <strong>un comportamiento a tener en cuenta</strong> (sigue hasta 5 redirecciones). La URL
  lleva a la documentación completa, con los argumentos que acepta.</p>

  <p>Compáralo con un script intrusivo, para ver la diferencia en la primera línea:</p>

  <?= term('<span class="p">$</span> nmap --script-help ssl-enum-ciphers') ?>
  <?= term('ssl-enum-ciphers' . "\n"
         . 'Categories: discovery intrusive' . "\n"
         . 'https://nmap.org/nsedoc/scripts/ssl-enum-ciphers.html' . "\n"
         . '  This script repeatedly initiates SSLv3/TLS connections, each time trying a new' . "\n"
         . '  cipher or compressor while recording whether a host accepts or rejects it. …', 'salida real') ?>

  <p>La palabra <code>intrusive</code> y la frase «repeatedly initiates … connections» ya te
  avisan: abre muchas conexiones probando cifrados. Útil y muy usado, pero no es «safe», y
  eso hay que saberlo antes, no después.</p>

  <p><code>--script-help</code> también acepta categorías y comodines: <code>--script-help
  "http-* and safe"</code> lista todos los scripts de HTTP que son seguros.</p>

  <?= nm_ficha([
      'Cuándo usarlo' => 'Siempre, antes de ejecutar un script por primera vez. Es la lectura de la etiqueta antes de tomar el medicamento.',
      'Qué NO significa' => 'Que <code>--script-help</code> ejecute algo. No toca ningún objetivo; solo lee documentación local.',
      'Ciberseguridad' => 'En una auditoría, la salida de <code>--script-help</code> de cada script usado justifica en el informe por qué era apropiado.',
      'Error común' => 'Ejecutar un script encontrado en Internet por su nombre, sin comprobar categoría ni argumentos.',
      'Mini práctica' => 'Lee la ayuda de <code>ssh-hostkey</code>, <code>ssl-cert</code> y <code>dns-recursion</code>. Anota categoría y una línea de qué hace cada uno.',
  ]) ?>
</section>

<!-- ========================== SCRIPTS SEGUROS ======================== -->
<section id="nse-seguros">
  <h2>Ejecutar scripts seguros</h2>
  <p class="tut-sub">Por nombre, por lista o por categoría, siempre acotado a lo no intrusivo.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Formas de seleccionar scripts NSE</caption>
      <thead><tr><th scope="col">Forma</th><th scope="col">Qué ejecuta</th></tr></thead>
      <tbody>
        <tr><td class="f">-sC</td><td class="d">La categoría <code>default</code> (equivale a <code>--script=default</code>)</td></tr>
        <tr><td class="f">--script http-title</td><td class="d">Un script por su nombre</td></tr>
        <tr><td class="f">--script http-title,ssl-cert</td><td class="d">Varios, separados por comas</td></tr>
        <tr><td class="f">--script safe</td><td class="d">Todos los de una categoría</td></tr>
        <tr><td class="f">--script "http-* and safe"</td><td class="d">Expresión booleana con comodines: HTTP y además seguros</td></tr>
        <tr><td class="f">--script "safe and not (broadcast or external)"</td><td class="d">Seguros que además se quedan en tu red (281 en la 7.991)</td></tr>
      </tbody>
    </table>
  </div>

  <p>Esa última expresión es la más recomendable para practicar: <strong>seguros y sin
  emitir a la red ni consultar a terceros</strong>. Todas están comprobadas contra
  <code>script.db</code> de la 7.991: <code>safe</code> son 352 scripts, y al descartar
  <code>broadcast</code> y <code>external</code> quedan 281.</p>

  <?= term('<span class="p">$</span> nmap -sV --script "safe and not (broadcast or external)" -p 80,443 192.168.56.10') ?>

  <?= note('Empieza por un script, no por una categoría entera',
      '<p><code>--script safe</code> lanza cientos de scripts y puede tardar y generar mucho
      tráfico. Para aprender, ejecuta uno o dos concretos (<code>http-title</code>,
      <code>ssl-cert</code>) y observa su salida. Guarda las categorías completas para
      cuando sepas qué esperar de ellas.</p>', 'info') ?>

  <p><strong>Lo que este curso no ejecuta:</strong> nada de <code>exploit</code>,
  <code>brute</code>, <code>dos</code> ni, en general, <code>intrusive</code>. No se enseñan
  scripts para adivinar credenciales ni para aprovechar vulnerabilidades. El objetivo es
  <em>conocer</em> un servicio, no forzarlo.</p>
</section>

<!-- ============================ NSE HTTP ============================= -->
<section id="nse-http">
  <h2>NSE sobre HTTP</h2>
  <p class="tut-sub">Identificar un servidor web propio sin abrir el navegador.</p>

  <p>Contra un Apache que corre en la máquina del tutorial (puerto 8090), tres scripts
  seguros y muy usados. La salida es <strong>real</strong>, con una única modificación: el
  título de la página va <strong>redactado</strong>, porque identifica un proyecto privado
  de esta máquina. Redactar y decir que has redactado es exactamente lo que se hace con una
  evidencia que contiene datos que no deben publicarse.</p>

  <?= term('<span class="p">$</span> nmap -sV -p 8090 --script http-title,http-server-header,http-headers 127.0.0.1') ?>
  <?= term('PORT     STATE SERVICE VERSION' . "\n"
         . '8090/tcp <span class="st-open">open</span>  http    Apache httpd 2.4.68 ((Debian))' . "\n"
         . '| http-headers: ' . "\n"
         . '|   Server: Apache/2.4.68 (Debian)' . "\n"
         . '|   X-Content-Type-Options: nosniff' . "\n"
         . '|   X-Frame-Options: DENY' . "\n"
         . '|   Content-Security-Policy: default-src \'self\'; …' . "\n"
         . '|   Content-Type: text/html' . "\n"
         . '|_  (Request type: HEAD)' . "\n"
         . '|_http-server-header: Apache/2.4.68 (Debian)' . "\n"
         . '|_http-title: <span class="c">[redactado: título de la página]</span>', 'salida real · título redactado') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Scripts NSE seguros para HTTP</caption>
      <thead><tr><th scope="col">Script</th><th scope="col">Qué revela</th><th scope="col">Lectura defensiva</th></tr></thead>
      <tbody>
        <tr><td class="f">http-title</td><td class="d">El título de la página inicial</td><td class="d">Identifica de qué aplicación se trata sin abrir el navegador</td></tr>
        <tr><td class="f">http-server-header</td><td class="d">La cabecera <code>Server</code></td><td class="d">Producto y versión del servidor web</td></tr>
        <tr><td class="f">http-headers</td><td class="d">Todas las cabeceras de respuesta</td><td class="d">Permite ver si están las de seguridad (CSP, X-Frame-Options…)</td></tr>
        <tr><td class="f">http-security-headers</td><td class="d">Específicamente las cabeceras de seguridad</td><td class="d">Señala cuáles faltan</td></tr>
        <tr><td class="f">http-methods</td><td class="d">Métodos HTTP permitidos</td><td class="d">Detecta métodos peligrosos habilitados (PUT, DELETE)</td></tr>
      </tbody>
    </table>
  </div>

  <p>Este es un buen ejemplo de lectura defensiva: el escaneo muestra que este servidor
  <em>sí</em> envía <code>X-Content-Type-Options</code>, <code>X-Frame-Options</code> y
  <code>Content-Security-Policy</code>. Un servidor al que le faltaran sería un hallazgo de
  <em>hardening</em> concreto y accionable.</p>

  <?= note('El símbolo | de la salida',
      '<p>Las líneas que empiezan por <code>|</code> son resultados de scripts NSE
      colgando del puerto. La última de cada script usa <code>|_</code>. Es solo formato:
      agrupa visualmente lo que aportó cada script.</p>', 'info') ?>
</section>

<!-- ============================= NSE TLS ============================= -->
<section id="nse-tls">
  <h2>NSE sobre TLS</h2>
  <p class="tut-sub">Leer un certificado sin descifrar nada.</p>

  <p>El certificado de un servicio TLS es <strong>público</strong>: se entrega en claro al
  inicio de cada conexión, antes de cifrar. Leerlo no descifra nada. <code>ssl-cert</code>
  (categorías default, discovery, safe) lo muestra. Salida <strong>real</strong> contra un
  servicio TLS local (CoolerControl, puerto 11987):</p>

  <?= term('<span class="p">$</span> nmap -p 11987 --script ssl-cert,tls-alpn 127.0.0.1') ?>
  <?= term('| ssl-cert: Subject: commonName=CoolerControl self signed cert/organizationName=CoolerControl' . "\n"
         . '| Subject Alternative Name: DNS:localhost, IP Address:127.0.0.1, …' . "\n"
         . '| Issuer: commonName=CoolerControl self signed cert/organizationName=CoolerControl' . "\n"
         . '| Public Key type: ec' . "\n"
         . '| Public Key bits: 256' . "\n"
         . '| Signature Algorithm: ecdsa-with-SHA256' . "\n"
         . '| Not valid before: 1975-01-01T00:00:00' . "\n"
         . '|_Not valid after:  4096-01-01T00:00:00', 'salida real (resumida)') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Scripts NSE seguros para TLS y qué aportan a la defensa</caption>
      <thead><tr><th scope="col">Dato</th><th scope="col">Lectura defensiva</th></tr></thead>
      <tbody>
        <tr><td class="f">Subject / SAN</td><td class="d">Para qué nombres es válido el certificado. Un SAN que no cuadra con el servicio es señal de descuido</td></tr>
        <tr><td class="f">Issuer</td><td class="d">Quién lo emitió. <em>Self signed</em> es normal en interno; en un servicio público es un problema</td></tr>
        <tr><td class="f">Not valid after</td><td class="d">Caducidad. Un certificado caducado rompe el servicio; anticiparlo es puro <em>hardening</em></td></tr>
        <tr><td class="f">Public Key type / bits</td><td class="d">Fortaleza de la clave. Claves cortas o algoritmos viejos son deuda técnica</td></tr>
      </tbody>
    </table>
  </div>

  <p>Este certificado de ejemplo tiene fechas absurdas (válido desde 1975 hasta 4096): es un
  autofirmado de una aplicación de escritorio, no pensado para producción. Justo el tipo de
  detalle que un vistazo con <code>ssl-cert</code> revela de inmediato.</p>

  <?= note('ssl-cert (safe) frente a ssl-enum-ciphers (intrusive)',
      '<p>Leer el certificado es seguro: es un dato que el servidor entrega a cualquiera.
      Enumerar qué cifrados acepta (<code>ssl-enum-ciphers</code>) es otra cosa: abre muchas
      conexiones probando combinaciones, y por eso es <code>intrusive</code>. Da una nota de
      la A a la F muy útil para <em>hardening</em>, pero úsalo solo en tus servicios y
      sabiendo que genera bastante tráfico.</p>') ?>
</section>

<!-- ============================ NSE INFO ============================= -->
<section id="nse-info">
  <h2>NSE para SSH y DNS</h2>
  <p class="tut-sub">Más ejemplos de información, sin tocar credenciales.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Scripts NSE seguros de información para SSH y DNS</caption>
      <thead><tr><th scope="col">Script</th><th scope="col">Categorías</th><th scope="col">Qué muestra (sin autenticar)</th></tr></thead>
      <tbody>
        <tr><td class="f">ssh-hostkey</td><td class="d">default, discovery, safe</td><td class="d">Las huellas de las claves del servidor SSH. Sirven para verificar que te conectas al equipo correcto</td></tr>
        <tr><td class="f">ssh2-enum-algos</td><td class="d">discovery, safe</td><td class="d">Algoritmos de cifrado e intercambio de claves que ofrece. Detecta algoritmos viejos que convendría deshabilitar</td></tr>
        <tr><td class="f">dns-nsid</td><td class="d">default, discovery, safe</td><td class="d">El identificador y, si lo publica, la versión del servidor DNS</td></tr>
        <tr><td class="f">dns-recursion</td><td class="d">default, safe</td><td class="d">Si el servidor DNS resuelve consultas recursivas para cualquiera: un resolver abierto es un hallazgo defensivo clásico</td></tr>
      </tbody>
    </table>
  </div>

  <p>Todos leen lo que el servicio ofrece de forma normal. Ninguno intenta autenticarse,
  adivinar contraseñas ni extraer datos. Esa es la línea que este curso no cruza: <strong>NSE
  aquí sirve para <em>describir</em> un servicio, nunca para <em>vencer</em> su
  autenticación</strong>.</p>

  <?= reveal('¿Por qué ssh-hostkey es seguro y útil a la vez?', '
    <p>La clave pública del servidor SSH está pensada para entregarse a cualquier cliente
    que se conecta: es la mitad pública de un par de claves, y con ella no se puede
    suplantar al servidor (haría falta la privada, que nunca sale del equipo).</p>
    <p>Su utilidad defensiva es doble: te permite <strong>verificar</strong> que el servidor
    al que te conectas es el de siempre (si la huella cambia sin motivo, sospecha), y en un
    inventario permite <strong>detectar equipos duplicados o suplantados</strong> comparando
    huellas. Todo sin autenticarte ni tocar credenciales.</p>') ?>
</section>

<?= nm_nivel('6', 'Resultados y reporting', 'Guardar la evidencia, elegir el formato correcto y comparar dos escaneos para ver qué cambió.', 'intermedio') ?>

<!-- ============================= GUARDAR ============================= -->
<section id="guardar">
  <h2>Guardar resultados</h2>
  <p class="tut-sub">Un escaneo que no se guarda es una foto que no se reveló.</p>

  <p>Por defecto Nmap escribe en la pantalla y no guarda nada. Cuatro opciones cambian eso;
  todas funcionan sin privilegios:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Formatos de salida a fichero de Nmap</caption>
      <thead><tr><th scope="col">Opción</th><th scope="col">Formato</th><th scope="col">Para qué sirve</th></tr></thead>
      <tbody>
        <tr><td class="f">-oN archivo.txt</td><td class="d">Normal</td><td class="d">Lo mismo que ves en pantalla, guardado. Para leerlo una persona</td></tr>
        <tr><td class="f">-oX archivo.xml</td><td class="d">XML</td><td class="d">Estructurado, para programas: <code>ndiff</code>, informes, importadores</td></tr>
        <tr><td class="f">-oG archivo.gnmap</td><td class="d">Grepable</td><td class="d">Una línea por host, para <code>grep</code>/<code>awk</code>. El manual lo marca como obsoleto pero sigue siendo cómodo</td></tr>
        <tr><td class="f">-oA base</td><td class="d">Los tres a la vez</td><td class="d">Crea <code>base.nmap</code>, <code>base.xml</code> y <code>base.gnmap</code></td></tr>
      </tbody>
    </table>
  </div>

  <?= term('<span class="p">$</span> nmap -oN resultado.txt localhost' . "\n"
         . '<span class="p">$</span> nmap -oX resultado.xml localhost' . "\n"
         . '<span class="p">$</span> nmap -oG resultado.gnmap localhost' . "\n"
         . '<span class="p">$</span> nmap -oA auditoria localhost   <span class="c"># los tres: auditoria.{nmap,xml,gnmap}</span>') ?>

  <p>El formato normal (<code>-oN</code>) es casi idéntico a la pantalla, pero sin colores y
  con una cabecera con el comando exacto y la fecha. El grepable pone cada host en una línea:</p>

  <?= term('# Nmap 7.991 scan initiated Thu Sep 10 16:25:02 2026 as: nmap -p 5432,8090 -oA auditoria 127.0.0.1' . "\n"
         . 'Host: 127.0.0.1 (localhost)	Status: Up' . "\n"
         . 'Host: 127.0.0.1 (localhost)	Ports: 5432/open/tcp//postgresql///, 8090/open/tcp//opsmessaging///', 'salida real · auditoria.gnmap') ?>

  <p>Y el XML guarda todo con estructura, incluida la razón de cada estado
  (<code>reason="syn-ack"</code>): es el formato que leen las herramientas.</p>

  <?= note('El comando queda guardado dentro del archivo',
      '<p>Los tres formatos incluidos en la cabecera el comando completo y la fecha. Eso es
      trazabilidad gratis: dentro del propio resultado consta qué se ejecutó exactamente y
      cuándo. Añade <code>--append-output</code> si no quieres sobrescribir un archivo
      anterior.</p>', 'info') ?>

  <h3>Los tres ficheros de -oA</h3>

  <?= shot('nmap/08-guardar-resultados.svg',
      'Un solo comando con -oA produce tres ficheros: .nmap para leer, .gnmap para filtrar '
      . 'con grep y .xml para procesar con herramientas; debajo, el aviso de que un '
      . 'inventario de servicios es información sensible.',
      '<b>Dónde mirar:</b> para qué sirve cada uno. El <code>.xml</code> es el que permite '
      . 'comparar escaneos con <code>ndiff</code>, que es el uso más valioso de todos.') ?>

  <?= note('Un inventario es información sensible',
      '<p>Un fichero de resultados dice exactamente qué ofrece cada equipo de una red y con
      qué versión. Para quien quisiera atacarla, es el trabajo de reconocimiento ya hecho.
      Guárdalo como guardarías una contraseña: no en el escritorio, no en un repositorio
      público, no en un adjunto sin cifrar.</p>') ?>

</section>

<!-- ========================== QUÉ FORMATO =========================== -->
<section id="formatos">
  <h2>¿Qué formato usar?</h2>
  <p class="tut-sub">Depende de quién —o qué— vaya a leerlo después.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Comparativa de formatos de salida</caption>
      <thead><tr><th scope="col">Formato</th><th scope="col">Ventajas</th><th scope="col">Limitaciones</th><th scope="col">Úsalo si…</th></tr></thead>
      <tbody>
        <tr><td class="f">Normal (-oN)</td><td class="d">Legible por personas; idéntico a la pantalla</td><td class="d">Difícil de procesar con programas</td><td class="d">Vas a leerlo tú o adjuntarlo a un informe</td></tr>
        <tr><td class="f">XML (-oX)</td><td class="d">Estructurado, estándar, completo; lo leen muchas herramientas</td><td class="d">Incómodo de leer a ojo</td><td class="d">Vas a comparar con <code>ndiff</code> o importarlo</td></tr>
        <tr><td class="f">Grepable (-oG)</td><td class="d">Una línea por host; perfecto para <code>grep</code>/<code>awk</code></td><td class="d">Obsoleto; no guarda toda la información (por ejemplo, salida de NSE)</td><td class="d">Quieres una respuesta rápida en la terminal</td></tr>
        <tr><td class="f">Todos (-oA)</td><td class="d">No tienes que decidir; los tres a la vez</td><td class="d">Tres archivos por escaneo</td><td class="d">Es una auditoría: querrás leerlo, compararlo y buscar en él</td></tr>
      </tbody>
    </table>
  </div>

  <p>Regla práctica: en cualquier trabajo serio, <strong><code>-oA</code></strong>. Ocupa
  poco, no te obliga a elegir y te deja preparado tanto para leer como para comparar. El
  grepable resuelve preguntas rápidas: «¿qué hosts tienen el 22 abierto?» es un
  <code>grep '22/open' auditoria.gnmap</code>.</p>
</section>

<!-- =========================== COMPARAR ============================= -->
<section id="comparar">
  <h2>Comparar dos escaneos</h2>
  <p class="tut-sub">Lunes contra viernes: lo que cambió es lo que importa.</p>

  <p>Un escaneo aislado describe un momento. El valor defensivo aparece al
  <strong>comparar</strong>: un puerto que ayer no estaba, un servicio que desapareció, una
  versión distinta, un host nuevo. Nmap trae una herramienta para esto:
  <strong>ndiff</strong> (paquete <code>ndiff</code> en Arch/CachyOS), que compara dos
  ficheros XML.</p>

  <?= term('<span class="p">$</span> nmap -oX lunes.xml   -p 1-10000 192.168.56.10' . "\n"
         . '<span class="c"># … el viernes, el mismo comando …</span>' . "\n"
         . '<span class="p">$</span> nmap -oX viernes.xml -p 1-10000 192.168.56.10' . "\n"
         . '<span class="p">$</span> ndiff lunes.xml viernes.xml') ?>

  <p>La salida marca con <code>+</code> lo que aparece y con <code>-</code> lo que
  desaparece. Este es su formato, comparando dos escaneos de <code>127.0.0.1</code>: uno
  con el 5432 y otro con 5432 y 8090:</p>

  <?= term('<span class="d-del">-Nmap … as: nmap -p 5432 -oX lunes.xml 127.0.0.1</span>' . "\n"
         . '<span class="d-add">+Nmap … as: nmap -p 5432,8090 -oX viernes.xml 127.0.0.1</span>' . "\n\n"
         . ' localhost (127.0.0.1):' . "\n"
         . ' PORT     STATE SERVICE      VERSION' . "\n"
         . '<span class="d-add">+8090/tcp open  opsmessaging</span>', 'formato de ndiff · ilustrativo') ?>

  <p>El <code>+8090/tcp open</code> es exactamente lo que buscas en una auditoría de
  seguimiento: <strong>un puerto que antes no estaba abierto</strong>. En un servidor de
  producción, eso dispara una pregunta inmediata: ¿quién abrió ese servicio y estaba
  autorizado?</p>

  <h3>Sin ndiff: herramientas de siempre</h3>

  <p>Si prefieres no depender de <code>ndiff</code>, el formato grepable y <code>diff</code>
  bastan para lo esencial:</p>

  <?= term('<span class="p">$</span> nmap -oG - -p 1-10000 192.168.56.10 | grep Ports &gt; lunes.txt' . "\n"
         . '<span class="c"># … el viernes …</span>' . "\n"
         . '<span class="p">$</span> nmap -oG - -p 1-10000 192.168.56.10 | grep Ports &gt; viernes.txt' . "\n"
         . '<span class="p">$</span> diff lunes.txt viernes.txt') ?>

  <p>El <code>-oG -</code> escribe el grepable en la salida estándar (el guion) para poder
  encadenarlo. Es más tosco que <code>ndiff</code> —no entiende de puertos, solo compara
  texto— pero para «¿cambió algo?» sirve y no instala nada.</p>

  <p>Esto es lo que devuelve de verdad, con dos escaneos reales de este laboratorio
  —el primero solo al 5432, el segundo al 5432 y al 8090—:</p>

  <?= term('<span class="c"># 1c1</span>' . "\n"
         . '<span class="d-del">&lt; Ports: 5432/open/tcp//postgresql///</span>' . "\n"
         . '<span class="c">---</span>' . "\n"
         . '<span class="d-add">&gt; Ports: 5432/open/tcp//postgresql///, 8090/open/tcp//opsmessaging///</span>',
         'salida real') ?>

  <p><strong>Dónde mirar:</strong> la línea con <code>&gt;</code>. El
  <code>8090/open/tcp</code> que aparece en la segunda y no en la primera es exactamente el
  hallazgo que busca una auditoría de seguimiento. Fíjate también en que el grepable
  arrastra el mismo <code>opsmessaging</code> de la tabla de servicios: sigue siendo una
  suposición por número de puerto, no una detección.</p>

  <?= nm_ficha([
      'Cuándo usarlo' => 'En cualquier vigilancia periódica: servidores propios, red de laboratorio, comprobación tras un cambio de configuración.',
      'Qué NO significa' => 'Un cambio no es por sí mismo un incidente: puede ser un despliegue autorizado. Es una <em>pregunta</em>, no una alarma.',
      'Ciberseguridad' => 'Comparar contra una <strong>línea base</strong> aprobada es la forma más barata de detectar servicios nuevos no autorizados.',
      'Error común' => 'Comparar escaneos hechos con opciones distintas: si el lunes usaste <code>-p 1-1000</code> y el viernes <code>-p-</code>, casi todo parecerá «nuevo».',
      'Mini práctica' => 'Guarda <code>base.xml</code> de tu VM. Arranca un servicio nuevo (por ejemplo, un <code>python3 -m http.server</code>), reescanea y compara con <code>ndiff</code>.',
  ]) ?>

  <h3>Qué cambió desde la última vez</h3>

  <?= shot('nmap/09-comparar-escaneos.svg',
      'Dos inventarios del mismo equipo tomados en días distintos y el diff entre ambos: '
      . 'la única diferencia es una línea nueva, 8090/tcp open http.',
      '<b>Dónde mirar:</b> la línea con el signo más. Ese es el valor real de guardar los '
      . 'escaneos: no responder «¿qué hay?», sino <b>«¿qué ha cambiado, y quién lo '
      . 'cambió?»</b>.') ?>

  <?= evidence(
      '<p>El escaneo de hoy muestra un puerto 8090 abierto que ayer no estaba.</p>',
      '<p>Alguien levantó un servicio nuevo en ese equipo en las últimas veinticuatro
      horas.</p>',
      '<p>Quién lo hizo ni si estaba previsto. Un despliegue planificado, un contenedor que
      alguien arrancó para probar y una instalación no autorizada producen el mismo cambio
      en el inventario. La siguiente pregunta no es técnica: es preguntar al equipo
      responsable si ese servicio estaba en el plan.</p>') ?>

</section>

<!-- ============================ INVENTARIO ========================== -->
<section id="inventario">
  <h2>Caso práctico: inventario de red</h2>
  <p class="tut-sub">De administrador: qué hay activo y qué expone, de principio a fin.</p>

  <p><strong>Escenario.</strong> Administras una red de laboratorio
  <code>192.168.56.0/24</code> con varias máquinas virtuales y quieres un inventario: qué
  equipos hay, qué servicios ofrecen y guardar la evidencia como línea base.</p>

  <ol class="flow">
    <li><b>Definir e identificar el rango</b>
      <span class="flow__tool">ip -brief addr · ip route</span>
      <p>Confirma cuál es tu red de laboratorio. Aquí, la interfaz <code>vboxnet0</code> con
      <code>192.168.56.1/24</code>: tu equipo es el <code>.1</code>.</p></li>
    <li><b>Ensayo en seco</b>
      <span class="flow__tool">nmap -sL -n 192.168.56.0/24</span>
      <p>Comprueba que el rango es el que crees: 256 direcciones, ni una más. Sin tocar ningún equipo.</p></li>
    <li><b>Descubrir hosts activos</b>
      <span class="flow__tool">sudo nmap -sn 192.168.56.0/24 -oA lab-hosts</span>
      <p>En tu propia red y con root usa ARP: inventario de equipos fiable. Guarda el resultado.</p></li>
    <li><b>Seleccionar objetivos</b>
      <span class="flow__tool">grep 'Status: Up' lab-hosts.gnmap</span>
      <p>Quédate con los que respondieron. No tiene sentido escanear puertos de direcciones vacías.</p></li>
    <li><b>Puertos y servicios</b>
      <span class="flow__tool">sudo nmap -sS -sV -p- --reason -iL activos.txt -oA lab-servicios</span>
      <p>Sobre los hosts activos: todos los puertos TCP, con versión y razón. Guarda los tres formatos.</p></li>
    <li><b>Contexto</b>
      <span class="flow__tool">criterio humano</span>
      <p>Para cada servicio: ¿debería estar ahí? Un SSH en un servidor de administración, sí; un MySQL abierto a toda la red, a investigar.</p></li>
    <li><b>Documentar la línea base</b>
      <span class="flow__tool">lab-servicios.xml + informe</span>
      <p>Guarda el XML como referencia. La próxima vez, <code>ndiff</code> contra él te dirá qué cambió.</p></li>
  </ol>

  <?= note('El inventario es información sensible',
      '<p>Un documento que lista qué servicios y versiones expone cada equipo de tu red es
      justo lo que querría alguien que quisiera atacarla. Guárdalo con el mismo cuidado que
      cualquier otra información de seguridad: acceso restringido y no en carpetas
      compartidas abiertas.</p>') ?>
</section>

<?= nm_nivel('7', 'Ciberseguridad defensiva', 'Nmap desde el lado que defiende: superficie, servicios inesperados, hardening, validación de firewall y detección de escaneos.', 'ciber') ?>

<!-- ============================ SUPERFICIE ========================== -->
<section id="superficie">
  <h2>Superficie de ataque</h2>
  <p class="tut-sub">Nmap mide exposición. El riesgo lo pones tú, con el contexto.</p>

  <p>La <strong>superficie de ataque</strong> de un equipo es todo lo que ofrece a la red:
  cada puerto abierto, cada servicio, cada versión. Nmap la mide bien. Pero medir la
  superficie no es medir el riesgo; entre una cosa y otra hay una cadena de preguntas:</p>

  <ol class="nm-pipe" aria-label="De la exposición al riesgo">
    <li><b>Host</b><span>Existe y responde</span></li>
    <li><b>Puerto abierto</b><span>Acepta conexiones</span></li>
    <li><b>Servicio</b><span>Qué protocolo habla</span></li>
    <li><b>Versión</b><span>Qué software, qué revisión</span></li>
    <li><b>Configuración</b><span>Cómo está ajustado — Nmap ya casi no ve esto</span></li>
    <li><b>Riesgo</b><span>Depende de datos, accesos y controles — Nmap no lo ve</span></li>
  </ol>

  <p>Nmap llega con solvencia hasta la versión. La configuración la ve solo en parte (algunos
  scripts NSE seguros, como los de cabeceras HTTP). El riesgo real —qué datos hay detrás,
  quién debería acceder, qué controles existen— <strong>no está en ningún paquete</strong>.
  Por eso el trabajo del que defiende no termina cuando Nmap termina: ahí empieza.</p>

  <?= note('Reducir superficie vence a vigilarla',
      '<p>La conclusión práctica de todo este nivel: cada servicio que apagas es una rama
      entera de esa escalera que desaparece. Un puerto que no está abierto no necesita
      parches, ni monitorización, ni reglas de firewall. La medida de seguridad más barata
      y más eficaz que revela Nmap es casi siempre <em>«esto no debería estar aquí»</em>.</p>') ?>

  <?= evidence(
      '<p>Un servidor documentado como «solo web» expone 22, 80, 443, 3306 y 8080.</p>',
      '<p>Hay <strong>más superficie de la prevista</strong>. El 3306 llama especialmente la
      atención: una base de datos escuchando en la red, cuando la web la usaría por
      <code>localhost</code>.</p>',
      '<p>Que el servidor esté comprometido, ni que esos servicios sean vulnerables. Lo que
      hay es una discrepancia entre la documentación y la realidad, que es un hallazgo
      legítimo y accionable por sí mismo — y que se resuelve preguntando, no escaneando
      más.</p>') ?>

</section>

<!-- ========================= INESPERADOS ============================ -->
<section id="inesperados">
  <h2>Servicios inesperados</h2>
  <p class="tut-sub">El hallazgo defensivo más valioso no es un servicio vulnerable: es uno que no debería existir.</p>

  <p><strong>Escenario.</strong> Un servidor web que, según su documentación, solo debería
  ofrecer HTTPS (443) y administración por SSH (22). Lo escaneas:</p>

  <?= term('<span class="p">$</span> nmap -sV -p 22,80,443,3306 192.168.56.10') ?>
  <?= term('PORT     STATE SERVICE  VERSION' . "\n"
         . '22/tcp   <span class="st-open">open</span>   ssh      OpenSSH 9.2p1 Debian 2+deb12u3 (protocol 2.0)' . "\n"
         . '80/tcp   <span class="st-open">open</span>   http     nginx 1.22.1' . "\n"
         . '443/tcp  <span class="st-open">open</span>   ssl/http nginx 1.22.1' . "\n"
         . '3306/tcp <span class="st-open">open</span>   mysql    MySQL 8.0.39', 'salida ilustrativa') ?>

  <p>El <code>3306/tcp open mysql</code> no estaba en el guion. Antes de tocar nada, piensa
  como defensor:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Preguntas ante un servicio inesperado</caption>
      <thead><tr><th scope="col">Pregunta</th><th scope="col">Por qué importa</th></tr></thead>
      <tbody>
        <tr><td class="d">¿Debería MySQL estar expuesto a la red?</td><td class="d">Una base de datos normalmente solo la necesita la aplicación, en <code>localhost</code> o en red interna. Escuchando en todas las interfaces, la ve cualquiera que llegue al equipo</td></tr>
        <tr><td class="d">¿Quién necesita acceder a ese puerto?</td><td class="d">Si la respuesta es «solo la web, que está en este mismo equipo», entonces no necesita escuchar en la red en absoluto</td></tr>
        <tr><td class="d">¿Debe limitarse con firewall?</td><td class="d">Si algún cliente externo legítimo lo usa, restríngelo a esas IP; si no, ciérralo</td></tr>
        <tr><td class="d">¿Es un cambio autorizado?</td><td class="d">Quizá alguien lo abrió para depurar y lo olvidó. El registro de cambios debería decirlo; si no dice nada, es un problema en sí mismo</td></tr>
      </tbody>
    </table>
  </div>

  <p>Fíjate en lo que <strong>no</strong> hace un buen defensor: no concluye «el servidor
  está comprometido», ni «MySQL es vulnerable». Concluye «hay un servicio expuesto que no
  estaba previsto; hay que averiguar por qué y, casi seguro, restringirlo o cerrarlo». Ese
  es el pensamiento defensivo: del hecho a la acción, sin saltarse la investigación.</p>

  <?= reveal('¿Y si el 3306 estuviera filtered en lugar de open?', '
    <p>Cambiaría todo. <code>filtered</code> significaría que algo (probablemente un
    firewall) ya impide llegar al puerto: MySQL podría estar escuchando, pero no es
    accesible desde donde escaneas. Seguiría mereciendo una comprobación —¿por qué está el
    servicio ahí?— pero la <em>exposición</em> ya estaría controlada. La diferencia entre
    <code>open</code> y <code>filtered</code> es, muchas veces, la diferencia entre un
    incidente y un apunte.</p>') ?>
</section>

<!-- =========================== HARDENING ============================ -->
<section id="hardening">
  <h2>Inventario y hardening</h2>
  <p class="tut-sub">Nmap como termómetro del endurecimiento: antes y después.</p>

  <p><em>Hardening</em> (endurecimiento) es reducir la superficie de un equipo a lo
  imprescindible. Nmap es la forma de <strong>verificar</strong> que lo has conseguido,
  porque ve el equipo como lo ve la red, no como lo ves tú desde dentro.</p>

  <div class="nm-seq" style="grid-template-columns: 1fr auto 1fr;">
    <div class="tut-table" style="margin:0">
      <table>
        <caption class="visually-hidden">Antes del hardening</caption>
        <thead><tr><th scope="col">Antes</th><th scope="col">Estado</th></tr></thead>
        <tbody>
          <tr><td class="f">22/tcp ssh</td><td class="d">open</td></tr>
          <tr><td class="f">80/tcp http</td><td class="d">open</td></tr>
          <tr><td class="f">443/tcp https</td><td class="d">open</td></tr>
          <tr><td class="f">3306/tcp mysql</td><td class="d">open</td></tr>
        </tbody>
      </table>
    </div>
    <div style="display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--dv-accent)" aria-hidden="true">→</div>
    <div class="tut-table" style="margin:0">
      <table>
        <caption class="visually-hidden">Después del hardening</caption>
        <thead><tr><th scope="col">Después</th><th scope="col">Estado</th></tr></thead>
        <tbody>
          <tr><td class="f">22/tcp ssh</td><td class="d">open</td></tr>
          <tr><td class="f">443/tcp https</td><td class="d">open</td></tr>
          <tr><td class="f">80/tcp http</td><td class="d">filtered</td></tr>
          <tr><td class="f">3306/tcp mysql</td><td class="d">filtered</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <p>Qué ha pasado entre las dos fotos: el 3306 se ha restringido con firewall (o se ha hecho
  que MySQL escuche solo en <code>localhost</code>) y el 80 se ha limitado. Los servicios
  necesarios siguen abiertos; los demás ya no son accesibles desde la red.</p>

  <?= note('Cerrar todo no siempre es lo correcto',
      '<p>El objetivo no es «cero puertos abiertos»: un servidor web sin el 443 abierto no
      sirve para nada. El objetivo es que <strong>lo abierto sea exactamente lo necesario y
      nada más</strong>. Un puerto abierto que corresponde a un servicio previsto, actualizado
      y con acceso controlado no es un problema: es el equipo haciendo su trabajo.</p>') ?>

  <p>Nmap ayuda a verificar, punto por punto:</p>

  <ul>
    <li><strong>Puertos que creías cerrados</strong> y siguen abiertos.</li>
    <li><strong>Servicios innecesarios</strong> que nadie recordaba (un servidor de correo en
    una máquina que no envía correo).</li>
    <li><strong>Servicios de administración</strong> (SSH, RDP, VNC, paneles) expuestos más
    allá de la red de gestión.</li>
    <li><strong>Exposición externa:</strong> lo que se ve desde fuera puede diferir de lo que
    se ve desde dentro. Escanear desde el segmento correcto importa.</li>
    <li><strong>El resultado de un cambio de firewall</strong>, comparando antes y después.</li>
  </ul>

  <h3>Qué cambia de verdad un hardening, visto desde la red</h3>

  <p>El valor de Nmap aquí no está en la foto, sino en la diferencia entre dos fotos. Este
  es el caso más común en un servidor web: una base de datos que escucha en todas las
  interfaces cuando solo la necesita la aplicación que corre en la misma máquina.</p>

  <?= before_after(
      '<p>La base de datos acepta conexiones desde cualquier sitio:</p>
       <p><code>3306/tcp  open  mysql  MySQL 5.7.38</code></p>
       <p>Cualquiera que llegue a la red del servidor puede intentar autenticarse contra
       ella. El único control que queda es la contraseña.</p>',
      '<p>En <code>/etc/mysql/…</code>, <code>bind-address</code> pasa de
       <code>0.0.0.0</code> a <code>127.0.0.1</code>: el servicio deja de escuchar en la
       interfaz de red y solo atiende por loopback.</p>
       <p>La aplicación web, que corre en esa misma máquina, sigue conectando igual.</p>',
      '<p>El mismo escaneo, desde otro equipo:</p>
       <p><code>3306/tcp  closed  mysql</code></p>
       <p>La superficie de ataque se ha reducido sin tocar el firewall y sin que la
       aplicación se entere.</p>') ?>

  <?= evidence(
      '<p>El puerto 3306 pasa de <code>open</code> a <code>closed</code> entre el escaneo
      de antes y el de después.</p>',
      '<p>El cambio de <code>bind-address</code> surtió efecto: el servicio ya no acepta
      conexiones desde la red.</p>',
      '<p>Que el servicio sea ahora «seguro». Sigue escuchando en loopback, de modo que
      cualquiera con acceso a la máquina —o cualquier proceso comprometido en ella— lo
      alcanza igual. Lo que ha cambiado es <strong>desde dónde</strong> se puede llegar,
      que es exactamente lo que mide Nmap y nada más.</p>') ?>

  <?= pitfall('<p>Dar por hecho que <code>closed</code> desde tu equipo significa
      <code>closed</code> para todos. Estás midiendo desde <em>un</em> punto de la red. Un
      servicio puede seguir perfectamente accesible desde otra subred, desde una VPN o
      desde el propio centro de datos. La comprobación se repite desde cada sitio que
      importe.</p>') ?>
</section>

<!-- ========================== FIREWALL ============================== -->
<section id="firewall">
  <h2>Validar un firewall</h2>
  <p class="tut-sub">La prueba de que una regla funciona: un puerto que pasa de closed a filtered.</p>

  <p>Cuando configuras un firewall, Nmap te dice si la regla hace lo que crees. La señal
  clave es el cambio de estado del puerto afectado, <strong>sin que el servicio cambie</strong>:</p>

  <ol class="flow">
    <li><b>Identificar el servicio</b>
      <span class="flow__tool">nmap -sV -p 3306 &lt;IP-LAB&gt;</span>
      <p>Confirma qué hay y en qué estado. Punto de partida: <code>3306/tcp open mysql</code>.</p></li>
    <li><b>Configurar el firewall</b>
      <span class="flow__tool">fuera del alcance de este tutorial</span>
      <p>Con la herramienta de tu sistema (nftables, firewalld, ufw…) restringes o bloqueas el 3306. Este curso es de Nmap, no de firewalls: se asume que ya sabes hacerlo.</p></li>
    <li><b>Repetir el escaneo</b>
      <span class="flow__tool">nmap -sV --reason -p 3306 &lt;IP-LAB&gt;</span>
      <p>Exactamente el mismo comando de antes, con <code>--reason</code> para ver la evidencia.</p></li>
    <li><b>Comparar el resultado</b>
      <span class="flow__tool">closed → filtered</span>
      <p>Si pasó a <code>filtered</code> con razón <code>no-response</code> o
      <code>admin-prohibited</code>, la regla que descarta funciona.</p></li>
  </ol>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Qué te dice el estado tras configurar el firewall</caption>
      <thead><tr><th scope="col">Resultado tras la regla</th><th scope="col">Qué significa</th></tr></thead>
      <tbody>
        <tr><td class="f">open → filtered (no-response)</td><td class="d">El firewall <strong>descarta</strong> (DROP) el tráfico en silencio. El puerto ya no es accesible</td></tr>
        <tr><td class="f">open → filtered (admin-prohibited)</td><td class="d">El firewall <strong>rechaza</strong> (REJECT) y lo dice con un ICMP. También bloqueado, pero visible</td></tr>
        <tr><td class="f">open → closed</td><td class="d">No es firewall: <strong>paraste el servicio</strong>. El puerto responde «no hay nadie», luego el equipo es alcanzable</td></tr>
        <tr><td class="f">sigue open</td><td class="d">La regla no aplica a tu origen, o escaneas desde el lado equivocado del firewall</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('closed y filtered: la distinción que aquí lo es todo',
      '<p>Si tras aplicar una regla el puerto queda <code>closed</code>, no has filtrado
      nada: has parado (o nunca arrancó) el servicio, y el puerto sigue siendo alcanzable —
      tu equipo contesta «aquí no hay nadie». <code>filtered</code> es la prueba de que algo
      <em>impide llegar</em>. Por eso <code>--reason</code> es imprescindible al validar
      firewalls: distingue «no hay servicio» de «no se puede llegar al servicio».</p>') ?>
</section>

<!-- ========================== DETECCIÓN ============================= -->
<section id="deteccion">
  <h2>Detectar escaneos desde la defensa</h2>
  <p class="tut-sub">Qué firma deja un escaneo y cómo reconocerla. No cómo ocultarla.</p>

  <p>Un escaneo no se reconoce por un paquete: cada SYN es un SYN normal. Se reconoce por la
  <strong>forma del conjunto</strong>. Estos son los indicadores que un equipo defensivo
  vigila (y que tú mismo puedes observar escaneando tu laboratorio y mirando el tráfico con
  Wireshark):</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Indicadores de reconocimiento y cómo detectarlos</caption>
      <thead><tr><th scope="col">Indicador</th><th scope="col">Qué se observa</th><th scope="col">Dónde mirar</th></tr></thead>
      <tbody>
        <tr><td class="f">Un origen, muchos puertos</td><td class="d">Una IP contacta decenas o cientos de puertos del mismo host en poco tiempo</td><td class="d">Conteo de puertos destino por IP origen; Statistics → Conversations en Wireshark</td></tr>
        <tr><td class="f">Un origen, muchos hosts</td><td class="d">Una IP toca el mismo puerto en muchas direcciones: barrido de red</td><td class="d">Conteo de IP destino por IP origen</td></tr>
        <tr><td class="f">Muchos SYN</td><td class="d">Ráfaga de aperturas de conexión</td><td class="d"><code>tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0</code></td></tr>
        <tr><td class="f">Conexiones incompletas</td><td class="d">Muchos saludos que no se completan: la marca del SYN scan</td><td class="d"><code>tcp.completeness &lt; 7</code> en Wireshark</td></tr>
        <tr><td class="f">Concentración temporal</td><td class="d">Todo ocurre en una ventana corta, no repartido en el día</td><td class="d">I/O Graph: un pico compacto, no una curva suave</td></tr>
        <tr><td class="f">Muchos RST de vuelta</td><td class="d">El objetivo responde con muchos RST: puertos cerrados sondeados</td><td class="d"><code>tcp.flags.reset == 1</code></td></tr>
      </tbody>
    </table>
  </div>

  <p>Dónde se ve esto en la práctica: en los <strong>registros del firewall</strong> (muchas
  conexiones denegadas desde un origen), en herramientas de <strong>flujos de red</strong>
  (NetFlow), en un <strong>IDS</strong> si lo hay, y en los <strong>registros de las propias
  aplicaciones</strong> (SSH y otros anotan conexiones que se cierran sin autenticar,
  típicas de un <code>-sT</code>).</p>

  <?= note('Este apartado es defensivo, y punto',
      '<p>Aquí se explica <strong>qué indicadores produce un escaneo y cómo detectarlos</strong>,
      porque eso es lo que necesita quien defiende. No se explica —ni se explicará— cómo
      hacer que un escaneo no deje esos indicadores. Nmap tiene opciones orientadas a eso;
      quedan, como se dijo, fuera del alcance de este tutorial.</p>') ?>

  <h3>Antes de dar la alarma</h3>

  <p>No todo escaneo es hostil. Escanean legítimamente, y a diario:</p>

  <ul>
    <li>Los <strong>inventarios de activos</strong> de la propia organización.</li>
    <li>Los <strong>escáneres de vulnerabilidades</strong> del equipo de seguridad.</li>
    <li>Las <strong>sondas de monitorización</strong> que comprueban si un servicio sigue vivo.</li>
    <li>El <strong>descubrimiento de impresoras</strong> y dispositivos multimedia.</li>
  </ul>

  <p>Antes de escalar, comprueba si el origen es un equipo conocido con esa función. Un
  escaneo desde el servidor de inventario a las 3:00 probablemente <em>sea</em> el
  inventario. La diferencia entre un incidente y una falsa alarma es, otra vez, el contexto.</p>

  <?= evidence(
      '<p>Los registros muestran 412 intentos de conexión desde una misma dirección hacia
      61 puertos distintos del mismo equipo, en 40 segundos, con rechazo en 59 de ellos.</p>',
      '<p>Es la forma de un <strong>escaneo de puertos</strong>: alguien enumerando qué
      ofrece ese equipo.</p>',
      '<p>Quién lo hizo ni con qué intención. Un inventario autorizado, un monitor de
      disponibilidad, un escáner contratado por la propia organización o una prueba de
      laboratorio dan la misma firma exacta. Y la dirección de origen puede estar suplantada
      o pertenecer a un equipo intermedio. Lo que se afirma es <em>qué se observó y
      cuándo</em>; la atribución es otro trabajo.</p>') ?>

</section>

<!-- ============================ WIRESHARK =========================== -->
<section id="wireshark">
  <h2>Nmap + Wireshark</h2>
  <p class="tut-sub">Nmap dice qué; Wireshark muestra por qué. El mejor ejercicio del curso.</p>

  <p>Nmap resume una conclusión («5432 abierto, razón syn-ack»). Wireshark te enseña los
  paquetes que hay detrás de esa conclusión. Verlos a la vez es la forma más rápida de
  entender de verdad qué hace cada tipo de escaneo. Si has hecho el tutorial de Wireshark de
  esta biblioteca, ya tienes todo lo necesario.</p>

  <ol class="flow">
    <li><b>Inicia la captura</b>
      <span class="flow__tool">Wireshark → interfaz lo</span>
      <p>Captura en <code>lo</code> (loopback), porque escanearás <code>127.0.0.1</code>. Filtro de visualización: <code>tcp.port == 5432</code> (usa un puerto que tengas abierto).</p></li>
    <li><b>Lanza un escaneo seguro</b>
      <span class="flow__tool">nmap -sT -p 5432 127.0.0.1</span>
      <p>Contra tu propio equipo. Sin root, será un connect scan.</p></li>
    <li><b>Observa los paquetes</b>
      <span class="flow__tool">panel de paquetes</span>
      <p>Verás el saludo completo y el RST con el que Nmap corta. Exactamente lo que ya viste capturado en la sección de <code>-sT</code>.</p></li>
    <li><b>Compara técnicas</b>
      <span class="flow__tool">sudo nmap -sS -p 5432 127.0.0.1</span>
      <p>Repite con SYN scan (con <code>sudo</code>) y compara: en <code>-sS</code> falta el ACK que completa el saludo. Ahí está la diferencia entre «medio abierto» y «conexión completa».</p></li>
  </ol>

  <h3>Un puerto abierto en SYN scan, visto por los dos</h3>

  <div class="nm-seq" style="grid-template-columns: 1fr 1fr;">
    <figure class="tut-figure">
      <svg viewBox="0 0 300 150" role="img" aria-label="Nmap resume: puerto 5432 abierto, razón syn-ack.">
        <rect x="10" y="20" width="280" height="110" rx="6" fill="none" stroke="var(--dv-border-strong)"/>
        <text x="150" y="45" font-family="JetBrains Mono, monospace" font-size="11" fill="var(--dv-text-muted)" text-anchor="middle">Nmap dice…</text>
        <text x="150" y="78" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700" fill="#19E6A4" text-anchor="middle">5432/tcp open</text>
        <text x="150" y="102" font-family="JetBrains Mono, monospace" font-size="11" fill="var(--dv-text-secondary)" text-anchor="middle">reason: syn-ack</text>
      </svg>
      <figcaption>La <b>conclusión</b>.</figcaption>
    </figure>
    <figure class="tut-figure">
      <svg viewBox="0 0 300 150" role="img" aria-label="Wireshark muestra el porqué: SYN de Nmap, SYN/ACK del host y RST del sistema de Nmap.">
        <text x="40" y="16" font-family="JetBrains Mono, monospace" font-size="10" fill="var(--dv-text-primary)" text-anchor="middle">Nmap</text>
        <text x="260" y="16" font-family="JetBrains Mono, monospace" font-size="10" fill="var(--dv-text-primary)" text-anchor="middle">5432</text>
        <line x1="40" y1="22" x2="40" y2="140" stroke="var(--dv-border-strong)" stroke-dasharray="3 4"/>
        <line x1="260" y1="22" x2="260" y2="140" stroke="var(--dv-border-strong)" stroke-dasharray="3 4"/>
        <line x1="40" y1="45" x2="250" y2="45" stroke="var(--tl-l3)" stroke-width="1.6"/><polygon points="260,45 249,41 249,49" fill="var(--tl-l3)"/>
        <text x="150" y="39" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" fill="var(--tl-l3)" text-anchor="middle">SYN</text>
        <line x1="260" y1="85" x2="50" y2="85" stroke="var(--tl-l4)" stroke-width="1.6"/><polygon points="40,85 51,81 51,89" fill="var(--tl-l4)"/>
        <text x="150" y="79" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" fill="var(--tl-l4)" text-anchor="middle">SYN/ACK</text>
        <line x1="40" y1="125" x2="250" y2="125" stroke="var(--tl-l7)" stroke-width="1.6"/><polygon points="260,125 249,121 249,129" fill="var(--tl-l7)"/>
        <text x="150" y="119" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" fill="var(--tl-l7)" text-anchor="middle">RST</text>
      </svg>
      <figcaption>El <b>porqué</b>: el SYN/ACK que lo prueba.</figcaption>
    </figure>
  </div>

  <?= note('Sin salir de tu equipo',
      '<p>Todo esto ocurre contra <code>127.0.0.1</code> y se captura en <code>lo</code>:
      nada sale a la red. Es el laboratorio más seguro que existe y, aun así, enseña el
      mecanismo completo. Este apartado no modifica ni sustituye al tutorial de Wireshark;
      solo lo aprovecha.</p>', 'info') ?>

  <h3>El mismo escaneo, visto desde el otro lado</h3>

  <?= shot('nmap/10-nmap-en-wireshark.svg',
      'A la izquierda el comando nmap -sT -p 20-25; a la derecha, el Packet List que ve '
      . 'quien recibe el escaneo: SYN a puertos consecutivos con RST de vuelta en casi '
      . 'todos, salvo el 22 que responde SYN-ACK.',
      '<b>Dónde mirar:</b> el ritmo y la secuencia de puertos. Un mismo origen, puertos '
      . 'consecutivos, milisegundos entre paquetes y mayoría de <code>RST</code>: esa es '
      . 'la firma, y se ve sin esfuerzo.') ?>

  <p>Ejecutar un escaneo contra tu propio equipo mientras lo capturas con Wireshark es, con
  diferencia, el mejor ejercicio de este curso: ves <em>a la vez</em> lo que pides y lo que
  eso provoca. El laboratorio 14 lo recorre entero.</p>

  <?= pitfall('<p>Dar por hecho que ese patrón siempre es un escaneo. Un navegador abriendo
      veinte conexiones simultáneas a un CDN produce algo parecido: un origen, muchas
      conexiones, muy poco tiempo. Lo que separa los dos casos es la
      <strong>secuencialidad de los puertos</strong> y la proporción de rechazos — y, sobre
      todo, el contraste con lo que es normal en esa red.</p>') ?>

</section>

<?= nm_nivel('8', 'Análisis avanzado', 'Cuándo Nmap se equivoca, cómo no equivocarte tú, y cómo convertir un escaneo en una decisión defendible.', 'ciber') ?>

<!-- ========================= LIMITACIONES =========================== -->
<section id="limitaciones">
  <h2>Falsos positivos y limitaciones</h2>
  <p class="tut-sub">Nmap aporta evidencia técnica, no omnisciencia. Saber qué no puede ver es parte de saber usarlo.</p>

  <p>Nmap observa comportamiento de red desde un punto concreto. Todo lo que se interponga
  entre ese punto y el servicio puede distorsionar la foto:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Factores que pueden falsear un resultado de Nmap</caption>
      <thead><tr><th scope="col">Factor</th><th scope="col">Cómo distorsiona el resultado</th></tr></thead>
      <tbody>
        <tr><td class="f">Firewall</td><td class="d">Convierte puertos en <code>filtered</code>; puede responder por el servidor y falsear estados y hasta el SO detectado</td></tr>
        <tr><td class="f">NAT</td><td class="d">Muchos equipos tras una IP: escaneas la dirección pública, no la máquina real. Los puertos «abiertos» pueden ser de equipos distintos</td></tr>
        <tr><td class="f">Proxy inverso</td><td class="d">El 443 «abierto» es el proxy; el servidor real detrás no se ve, y su versión tampoco</td></tr>
        <tr><td class="f">Balanceador de carga</td><td class="d">Cada escaneo puede llegar a un servidor distinto: versiones que «cambian» entre ejecuciones sin que nada haya cambiado</td></tr>
        <tr><td class="f">IDS/IPS</td><td class="d">Un IPS puede bloquear tu origen a mitad de escaneo: puertos que se vuelven <code>filtered</code> de golpe no por su configuración, sino porque te han cortado</td></tr>
        <tr><td class="f">Rate limiting</td><td class="d">El límite de ICMP del objetivo hace que UDP dé <code>open|filtered</code> de más</td></tr>
        <tr><td class="f">Descubrimiento bloqueado</td><td class="d">Un host que filtra ICMP y 80/443 parece caído aunque tenga servicios (por eso existe <code>-Pn</code>)</td></tr>
        <tr><td class="f">Servicios tras otro equipo</td><td class="d">Reenvío de puertos: el servicio que respondes vive en otra máquina distinta de la que escaneas</td></tr>
        <tr><td class="f">Banners falsos o genéricos</td><td class="d">Un servicio puede anunciar una versión falsa, o una tan genérica que no dice nada</td></tr>
        <tr><td class="f">Fingerprinting imperfecto</td><td class="d">La detección de SO y de versión es estadística: da rangos y probabilidades, no certezas</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('Nmap proporciona evidencia técnica, no omnisciencia',
      '<p>Cada resultado es «esto es lo que respondió esta dirección, desde donde yo estaba,
      en este momento». No es «esto es lo que hay en esa máquina». La diferencia parece sutil
      y es enorme: la primera es una observación honesta; la segunda, una conclusión que a
      menudo el escaneo no sostiene.</p>') ?>
</section>

<!-- ============================ ERRORES ============================= -->
<section id="errores">
  <h2>Errores comunes</h2>
  <p class="tut-sub">Los tropiezos que se repiten, y cómo evitarlos.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Errores frecuentes con Nmap y su solución</caption>
      <thead><tr><th scope="col">Error</th><th scope="col">Qué provoca</th><th scope="col">Solución</th></tr></thead>
      <tbody>
        <tr><td class="d">Escanear el rango o la interfaz equivocados</td><td class="d">Analizas una red que no es la tuya, o ninguna</td><td class="d"><code>ip route</code> primero; <code>-sL</code> para confirmar el rango antes de enviar nada</td></tr>
        <tr><td class="d">Confundir «apagado» con «ICMP filtrado»</td><td class="d">Das por caído un host que solo no responde al descubrimiento</td><td class="d">Prueba <code>-Pn</code> sobre los que sospechas; en tu LAN, ARP (con root) es fiable</td></tr>
        <tr><td class="d">Creer que <code>open</code> = vulnerable</td><td class="d">Alarmas sobre servicios legítimos y bien configurados</td><td class="d">Abierto es exposición, no riesgo. Investiga contexto antes de concluir</td></tr>
        <tr><td class="d">Confiar ciegamente en VERSION</td><td class="d">Falsos positivos por backporting o banners falsos</td><td class="d">Trátala como pista; cruza con los avisos de la distribución</td></tr>
        <tr><td class="d">Usar <code>-A</code> sin entenderlo</td><td class="d">Escaneos lentos, ruidosos y difíciles de explicar</td><td class="d">Pide solo lo que necesitas: <code>-sV</code>, <code>-O</code> o scripts concretos</td></tr>
        <tr><td class="d">Escanear 65535 puertos por costumbre</td><td class="d">Tiempo perdido y más carga sobre el objetivo</td><td class="d"><code>-p-</code> cuando de verdad buscas servicios raros; si no, top ports o una lista</td></tr>
        <tr><td class="d">Usar <code>sudo</code> para todo</td><td class="d">Amplías sin motivo lo que un fallo podría afectar</td><td class="d">Solo <code>-sS</code>, <code>-sU</code>, <code>-O</code> y <code>--traceroute</code> lo necesitan</td></tr>
        <tr><td class="d">No guardar resultados</td><td class="d">No puedes comparar ni demostrar qué encontraste</td><td class="d"><code>-oA</code> en cualquier trabajo serio</td></tr>
        <tr><td class="d">No anotar fecha y objetivo</td><td class="d">Un resultado sin contexto no vale como evidencia</td><td class="d">La cabecera de <code>-oN</code>/<code>-oX</code> ya lo guarda; añade el porqué del escaneo</td></tr>
        <tr><td class="d">No verificar la autorización</td><td class="d">Problema legal, no técnico</td><td class="d">Alcance por escrito antes de la primera sonda</td></tr>
        <tr><td class="d">Confundir <code>filtered</code> con <code>closed</code></td><td class="d">Conclusiones equivocadas sobre firewalls y servicios</td><td class="d"><code>--reason</code> siempre: distingue «no hay nadie» de «no puedo llegar»</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('El más caro de todos',
      '<p>Confundir <code>open</code> con «vulnerable». De ese salto nacen los informes que
      asustan sin fundamento, las urgencias falsas y la desconfianza en la herramienta.
      Nmap encuentra puertas; decir cuáles están mal cerradas es un trabajo posterior, con
      más datos. Cuando escribas una conclusión, pregúntate si el escaneo la sostiene o si
      te has adelantado.</p>') ?>
</section>

<!-- ========================= METODOLOGÍA =========================== -->
<section id="metodologia">
  <h2>Árbol de decisión</h2>
  <p class="tut-sub">De la pregunta a la opción. Empieza siempre por qué quieres saber.</p>

  <ul class="nm-tree">
    <li><span class="nm-tree__q">¿Está activo el equipo?</span><span class="nm-tree__a">Host discovery: <code>-sn</code> (en tu LAN, con <code>sudo</code> para ARP)</span></li>
    <li><span class="nm-tree__q">¿Qué contiene este rango, sin tocarlo?</span><span class="nm-tree__a">List scan: <code>-sL -n</code></span></li>
    <li><span class="nm-tree__q">¿Qué puertos tiene abiertos?</span><span class="nm-tree__a">Port scan: <code>-sT</code> (sin root) o <code>-sS</code> (con root); <code>-p</code> para acotar</span></li>
    <li><span class="nm-tree__q">¿Y en UDP?</span><span class="nm-tree__a"><code>-sU</code> sobre puertos concretos (53, 123, 161…), nunca a ciegas</span></li>
    <li><span class="nm-tree__q">¿Qué servicio y versión corre?</span><span class="nm-tree__a">Detección de versión: <code>-sV</code></span></li>
    <li><span class="nm-tree__q">¿Qué sistema operativo parece?</span><span class="nm-tree__a">Detección de SO: <code>sudo nmap -O</code> (estimación, no certeza)</span></li>
    <li><span class="nm-tree__q">¿Necesito más información de un servicio?</span><span class="nm-tree__a">NSE seguro: <code>--script</code> con scripts safe/discovery, tras <code>--script-help</code></span></li>
    <li><span class="nm-tree__q">¿Por qué Nmap dice este estado?</span><span class="nm-tree__a"><code>--reason</code></span></li>
    <li><span class="nm-tree__q">¿Necesito conservar la evidencia?</span><span class="nm-tree__a">Guardar todo: <code>-oA base</code></span></li>
    <li><span class="nm-tree__q">¿Qué ha cambiado desde la última vez?</span><span class="nm-tree__a">Comparar: <code>ndiff antes.xml despues.xml</code></span></li>
  </ul>
</section>

<!-- ============================ AUDITORÍA =========================== -->
<section id="auditoria">
  <h2>Flujo de auditoría autorizada</h2>
  <p class="tut-sub">Once pasos, del permiso a la verificación. El orden importa tanto como los comandos.</p>

  <ol class="flow">
    <li><b>Definir el alcance</b><span class="flow__tool">documento de autorización</span><p>Qué equipos tienes permiso para analizar, qué técnicas y en qué ventana. Por escrito, antes de nada.</p></li>
    <li><b>Identificar objetivos</b><span class="flow__tool">IP / CIDR en alcance.txt</span><p>Traduce el alcance a direcciones concretas. Un archivo, no la memoria.</p></li>
    <li><b>Ensayo en seco</b><span class="flow__tool">nmap -sL -n -iL alcance.txt</span><p>Confirma que el conjunto es exactamente el autorizado. Sin enviar nada.</p></li>
    <li><b>Descubrimiento</b><span class="flow__tool">sudo nmap -sn -iL alcance.txt -oA 01-hosts</span><p>Qué equipos están activos.</p></li>
    <li><b>Puertos</b><span class="flow__tool">sudo nmap -sS -p- --reason -iL activos.txt -oA 02-puertos</span><p>Exposición: qué acepta conexiones.</p></li>
    <li><b>Servicios</b><span class="flow__tool">nmap -sV [--script safe…] -iL activos.txt -oA 03-servicios</span><p>Qué software y versión, con scripts seguros si procede.</p></li>
    <li><b>Contexto</b><span class="flow__tool">criterio + inventario esperado</span><p>Para cada servicio: ¿debería existir? Compara con lo que la organización dice tener.</p></li>
    <li><b>Evidencia</b><span class="flow__tool">-oA + archivo de alcance</span><p>Guarda resultados y autorización juntos. Trazabilidad.</p></li>
    <li><b>Comparación</b><span class="flow__tool">ndiff contra la línea base</span><p>Qué cambió respecto a la referencia aprobada.</p></li>
    <li><b>Hallazgos</b><span class="flow__tool">informe</span><p>Servicios inesperados, versiones antiguas, exposición excesiva. Hechos y su lectura, separados.</p></li>
    <li><b>Remediación y verificación</b><span class="flow__tool">hardening → repetir Nmap</span><p>Tras aplicar cambios (firewall, apagar servicios, parches), <strong>vuelve a escanear</strong> para confirmar que hicieron efecto. La auditoría no termina en el informe: termina cuando se verifica la corrección.</p></li>
  </ol>

  <h3>El orden de una auditoría, de principio a fin</h3>

  <?= shot('nmap/11-flujo-auditoria.svg',
      'Los seis pasos de una auditoría autorizada —autorizas, descubres, enumeras, '
      . 'identificas, contrastas, informas— y las dos reglas que los acompañan: no ampliar '
      . 'el alcance sobre la marcha, y entregar análisis en lugar de la salida cruda.',
      '<b>Dónde mirar:</b> el paso 1 y la banda de abajo. El trabajo técnico son los pasos '
      . '2 a 4; lo que convierte eso en una auditoría son el primero y el último.') ?>

</section>

<!-- ============================= INFORME ============================ -->
<section id="informe">
  <h2>Mini informe</h2>
  <p class="tut-sub">Una plantilla para que un escaneo se convierta en algo que otra persona pueda leer y accionar.</p>

  <?= term('Fecha:                 2026-09-10 16:25 (America/Mexico_City)' . "\n"
         . 'Analista:              (tu nombre)' . "\n"
         . 'Herramienta:           Nmap 7.991' . "\n"
         . 'Alcance autorizado:    192.168.56.10  (autorización: correo del 2026-09-08)' . "\n"
         . 'Host:                  lab-web' . "\n"
         . 'IP:                    192.168.56.10' . "\n"
         . 'Sistema detectado:     Linux 5.0–6.2 (estimación -O, no confirmada)' . "\n"
         . 'Puertos abiertos:      22/tcp, 80/tcp, 443/tcp, 3306/tcp' . "\n"
         . 'Servicios:             ssh, http, https, mysql' . "\n"
         . 'Versiones detectadas:  OpenSSH 9.2p1; nginx 1.22.1; MySQL 8.0.39' . "\n"
         . 'Servicios esperados:   ssh (22), https (443)' . "\n"
         . 'Servicios inesperados: mysql (3306) expuesto; http (80) sin redirección a 443' . "\n"
         . 'Puertos filtrados:     ninguno relevante' . "\n"
         . 'Scripts seguros:       http-title, http-server-header, ssl-cert' . "\n"
         . 'Observaciones:         3306 escucha en todas las interfaces; sin regla de firewall' . "\n"
         . 'Riesgo potencial:      base de datos accesible desde la red (a confirmar contexto)' . "\n"
         . 'Recomendaciones:       limitar 3306 a localhost o a IP autorizadas; redirigir 80→443' . "\n"
         . 'Verificacion pendiente: reescaneo tras aplicar reglas de firewall', 'plantilla de informe') ?>

  <p>La plantilla obliga a separar tres cosas que conviene no mezclar: lo que Nmap
  <strong>observó</strong> (puertos, versiones), lo que la organización <strong>esperaba</strong>
  (política) y lo que tú <strong>recomiendas</strong> (acción). Un informe así lo entiende
  quien no estuvo en el escaneo, y se puede verificar después punto por punto.</p>
</section>

<!-- ========================= HECHO/HIPÓTESIS ======================== -->
<section id="hecho-hipotesis">
  <h2>Hechos frente a hipótesis</h2>
  <p class="tut-sub">La disciplina que evita acusar a alguien de algo que no hizo.</p>

  <p>La diferencia entre un buen analista y uno peligroso es una frase: distinguir lo que
  observó de lo que supone. Con un mismo hallazgo:</p>

  <div class="panes">
    <div>
      <dt>Evidencia</dt>
      <dd><code>3306/tcp open mysql</code> — Nmap recibió un SYN/ACK del puerto 3306 y el
      servicio respondió como MySQL. Esto es un <strong>hecho</strong> verificable: cualquiera
      que repita el escaneo lo obtiene.</dd>
    </div>
    <div>
      <dt>Hipótesis</dt>
      <dd>«El servicio MySQL podría estar innecesariamente expuesto.» Es una
      <strong>hipótesis</strong> razonable, que hay que confirmar con el contexto: ¿quién
      debe acceder? ¿hay firewall por delante?</dd>
    </div>
    <div>
      <dt>Lo que NO se afirma</dt>
      <dd>«El servidor está comprometido.» El escaneo <strong>no sostiene</strong> esa
      conclusión en absoluto. Un puerto abierto no es una intrusión.</dd>
    </div>
  </div>

  <?= note('Escribe la frase que te frena',
      '<p>Cuando notes que estás construyendo una conclusión grande sobre una sola
      observación, escribe: <em>«lo que este escaneo no permite determinar es…»</em> y
      complétala. Casi siempre descubrirás que necesitas otro dato antes de afirmar nada.
      Esa frase, en un informe, no es debilidad: es rigor.</p>') ?>

  <?= reveal('Ejercicio: clasifica cada afirmación', '
    <p>Sobre este resultado: <code>80/tcp open http nginx 1.22.1</code>, <code>443/tcp open ssl/http nginx 1.22.1</code>.</p>
    <ol>
      <li>«Hay un nginx 1.22.1 escuchando en 80 y 443.»</li>
      <li>«El puerto 80 no redirige a 443, así que el sitio acepta tráfico sin cifrar.»</li>
      <li>«El administrador no sabe lo que hace.»</li>
    </ol>
    <p><strong>Solución.</strong> (1) es un <em>hecho</em>. (2) es una <em>hipótesis</em>
    plausible pero no confirmada: Nmap ve el 80 abierto, pero no ha comprobado si responde
    con una redirección; hay que verificarlo (por ejemplo, con <code>http-title</code> o
    <code>curl -I</code>). (3) es un <em>juicio</em> sin fundamento técnico que no tiene
    lugar en un informe. Un buen hallazgo se queda en (1) + (2) verificada + una
    recomendación.</p>') ?>
</section>

<?= nm_nivel('9', 'Práctica', 'Quince laboratorios progresivos, desafíos con solución razonada y la chuleta completa. Todo sobre tu propio equipo o tu laboratorio.', 'practica') ?>

<!-- ============================== LABS ============================== -->
<section id="labs">
  <h2>Quince laboratorios</h2>
  <p class="tut-sub">En orden. Cada uno se apoya en el anterior. Terminal en una ventana; cuando toque, Wireshark en la otra.</p>

  <?= note('Dónde se ejecutan estos laboratorios',
      '<p>Del 1 al 5, contra <strong>tu propio equipo</strong> (<code>127.0.0.1</code>): no
      sale nada a la red. Del 6 en adelante, contra una <strong>VM propia</strong> en una red
      de laboratorio que tú creas (VirtualBox <em>host-only</em> o KVM). Sustituye
      <code>&lt;IP-LAB&gt;</code> por la IP de tu VM. Ningún laboratorio requiere tocar una
      red ajena, y no debes adaptarlos para ello.</p>', 'info') ?>

  <div class="lab" id="lab1">
    <?= lab_head('01', 'Tu primer escaneo y tu propia exposición', 'basico',
        'Objetivo: leer un informe de Nmap entero y contrastarlo con tu sistema.') ?>
    <p><strong>Entorno:</strong> tu equipo. <strong>Requisitos:</strong> Nmap instalado.</p>
    <?= steps([
        'Ejecuta <code>nmap 127.0.0.1</code>.',
        'Identifica en la salida: la línea <code>Host is up</code>, la de <code>Not shown</code> y la tabla <code>PORT STATE SERVICE</code>.',
        'Ejecuta <code>ss -tlnp</code> y empareja cada puerto abierto de Nmap con el proceso que lo abre.',
        'Vuelve a escanear con <code>nmap --reason 127.0.0.1</code> y anota la razón de cada estado.',
    ]) ?>
    <p><strong>Salida esperada:</strong> unos pocos puertos abiertos (los que tengas), el
    resto agrupados en <code>Not shown</code>. <strong>Qué observar:</strong> la columna
    SERVICE es un nombre de tabla, no una detección. <strong>Preguntas:</strong> ¿reconoces
    todos los procesos que escuchan? ¿alguno te sorprende?</p>
    <?= hints([
        '<p>Nmap mira el equipo desde fuera. ¿Qué herramienta lo mira desde dentro?</p>',
        '<p><code>ss -tlnp</code> lista los sockets en escucha <em>y</em> el proceso de cada uno.</p>',
        '<p>Fíjate en la dirección de escucha: <code>127.0.0.1:5432</code> y <code>0.0.0.0:5432</code> no exponen lo mismo.</p>',
    ]) ?>
    <?= reveal('Solución razonada', '
      <p>Nmap ve el equipo desde la red; <code>ss</code> lo ve desde dentro y sabe el proceso
      exacto. Juntos responden «qué expongo y quién lo expone». Un servicio que no reconoces
      no es necesariamente malo —muchos programas de escritorio escuchan en loopback— pero es
      justo la pregunta que un administrador debe poder responder. Errores comunes: leer
      SERVICE como una detección real; olvidar que lo abierto en <code>127.0.0.1</code> puede
      no estarlo hacia la red.</p>
      <p><strong>Aprendizaje:</strong> leer el informe completo y desconfiar de la columna SERVICE.</p>') ?>
  </div>

  <div class="lab" id="lab2">
    <?= lab_head('02', 'Los estados de puerto', 'basico',
        'Objetivo: ver open y closed en el mismo comando y entender la razón de cada uno.') ?>
    <p><strong>Entorno:</strong> tu equipo. <strong>Requisitos:</strong> un puerto abierto
    conocido (si no tienes ninguno, arranca uno con <code>python3 -m http.server 8000</code>
    en otra terminal).</p>
    <?= steps([
        'Ejecuta <code>nmap --reason -p 8000,8001 127.0.0.1</code> (uno abierto, uno cerrado).',
        'Observa: el 8000 <code>open</code> con razón <code>syn-ack</code>; el 8001 <code>closed</code> con <code>conn-refused</code>.',
        'Para <code>closed</code> y <code>filtered</code>, la diferencia es teórica aquí (localhost no filtra). La verás de verdad en el lab 13.',
    ]) ?>
    <p><strong>Qué observar:</strong> un puerto cerrado <em>responde</em>; por eso Nmap sabe
    que el host está vivo.</p>
    <?= hints([
        '<p>Los dos estados que vas a ver responden a cosas distintas: uno es una respuesta, el otro también.</p>',
        '<p><code>--reason</code> añade una columna que dice qué paquete produjo cada estado.</p>',
        '<p>Busca <code>syn-ack</code> frente a <code>conn-refused</code>: ahí está la diferencia entera.</p>',
    ]) ?>
    <?= reveal('Solución razonada', '
      <p><code>syn-ack</code> = alguien escucha. <code>conn-refused</code> = el sistema rechaza
      = nadie escucha, pero el equipo existe. Detén el <code>http.server</code> con
      <kbd>Ctrl</kbd>+<kbd>C</kbd> y repite: el 8000 pasa a <code>closed</code>. Acabas de ver
      un puerto cambiar de estado al parar el servicio — la misma señal que distinguirás de un
      firewall en el lab 13.</p>
      <p><strong>Aprendizaje:</strong> el estado es una deducción de la respuesta, y
      <code>--reason</code> te la enseña.</p>') ?>
  </div>

  <div class="lab" id="lab3">
    <?= lab_head('03', 'Seleccionar puertos', 'basico',
        'Objetivo: dominar -p y entender el coste de -p-.') ?>
    <p><strong>Entorno:</strong> tu equipo.</p>
    <?= steps([
        'Compara: <code>nmap 127.0.0.1</code> (1000 puertos) y <code>nmap -p- 127.0.0.1</code> (65535).',
        '¿Aparece algún puerto con <code>-p-</code> que no salía antes? Anótalo: vive fuera del top 1000.',
        'Prueba <code>nmap --top-ports 20 127.0.0.1</code> y <code>nmap -F 127.0.0.1</code>.',
        'Prueba una lista y un rango: <code>nmap -p 22,80,443,8000-8100 127.0.0.1</code>.',
    ]) ?>
    <?= hints([
        '<p>Sin <code>-p</code>, Nmap no prueba los 65 535: prueba una lista de frecuentes.</p>',
        '<p>Compara cuánto tarda <code>-F</code> con cuánto tarda <code>-p-</code> y por qué.</p>',
        '<p>Un servicio en un puerto poco habitual solo aparece si lo pides explícitamente.</p>',
    ]) ?>
    <?= reveal('Solución razonada', '
      <p>Los servicios olvidados suelen vivir en puertos altos no estándar (paneles en 8080,
      8443, 9090…), que el top 1000 no cubre. Por eso <code>-p-</code> periódico sobre tus
      servidores encuentra lo que un escaneo por defecto no ve. Contra <code>127.0.0.1</code>
      es instantáneo porque todo responde; contra un host con firewall, 65535 puertos
      filtrados tardan. Error clásico: <code>-p 22, 80</code> con espacio (el 80 se toma como
      objetivo).</p>
      <p><strong>Aprendizaje:</strong> pide los puertos que necesitas; reserva <code>-p-</code>
      para buscar lo escondido.</p>') ?>
  </div>

  <div class="lab" id="lab4">
    <?= lab_head('04', 'Servicios y versiones', 'basico',
        'Objetivo: ver cuánto cambia la columna SERVICE al preguntar de verdad.') ?>
    <p><strong>Entorno:</strong> tu equipo.</p>
    <?= steps([
        'Ejecuta <code>nmap 127.0.0.1</code> y anota la columna SERVICE de cada puerto abierto.',
        'Ejecuta <code>nmap -sV 127.0.0.1</code> y compara.',
        'Fíjate en cuáles cambiaron de nombre y en cuáles aparece ahora una versión.',
        'Localiza cualquier <code>tcpwrapped</code> o servicio no reconocido.',
    ]) ?>
    <?= hints([
        '<p>La columna SERVICE de un escaneo normal sale de un fichero, no de una conversación.</p>',
        '<p>Ese fichero es <code>/usr/share/nmap/nmap-services</code>: ábrelo y busca tu puerto.</p>',
        '<p>Lanza el mismo escaneo con y sin <code>-sV</code> y compara la línea del mismo puerto.</p>',
    ]) ?>
    <?= reveal('Solución razonada', '
      <p>Sin <code>-sV</code>, SERVICE viene de la tabla por número de puerto y se equivoca
      cuando un servicio no está en su puerto habitual (en la máquina del tutorial, el 8090
      pasa de <code>opsmessaging</code> a <code>Apache httpd 2.4.68</code>). <code>tcpwrapped</code>
      significa que el servicio aceptó y cerró sin hablar: control de acceso o protocolo que
      esperaba otra cosa. <code>-sV</code> tarda más porque conversa con cada servicio.</p>
      <p><strong>Aprendizaje:</strong> solo <code>-sV</code> dice qué hay de verdad detrás de
      un puerto.</p>') ?>
  </div>

  <div class="lab" id="lab5">
    <?= lab_head('05', 'Guardar y comparar', 'intermedio',
        'Objetivo: producir evidencia y detectar un cambio con ndiff.') ?>
    <p><strong>Entorno:</strong> tu equipo. <strong>Requisitos:</strong> paquete
    <code>ndiff</code> (opcional; hay alternativa con <code>diff</code>).</p>
    <?= steps([
        'Ejecuta <code>nmap -oA base -p 1-10000 127.0.0.1</code>. Mira los tres archivos creados.',
        'Arranca un servicio nuevo: <code>python3 -m http.server 8000</code> en otra terminal.',
        'Ejecuta <code>nmap -oX despues.xml -p 1-10000 127.0.0.1</code>.',
        'Compara: <code>ndiff base.xml despues.xml</code> (o con grepable y <code>diff</code>).',
    ]) ?>
    <?= hints([
        '<p>De los tres formatos que produce <code>-oA</code>, solo uno está pensado para que lo lea otra herramienta.</p>',
        '<p><code>ndiff</code> compara dos ficheros XML y resume los cambios.</p>',
        '<p>Provoca tú el cambio: arranca un servicio nuevo entre el primer escaneo y el segundo.</p>',
    ]) ?>
    <?= reveal('Solución razonada', '
      <p><code>ndiff</code> marca <code>+8000/tcp open</code>: exactamente el servicio que
      arrancaste. Ese es el mecanismo de una auditoría de seguimiento: guardas una línea base
      aprobada y, en cada revisión, lo que aparece con <code>+</code> es lo que hay que
      justificar. Clave: compara escaneos hechos con <strong>las mismas opciones</strong>, o
      todo parecerá nuevo.</p>
      <p><strong>Aprendizaje:</strong> <code>-oA</code> para conservar y <code>ndiff</code>
      para vigilar cambios.</p>') ?>
  </div>

  <div class="lab" id="lab6">
    <?= lab_head('06', 'TCP connect con captura', 'intermedio',
        'Objetivo: ver los seis paquetes de un connect scan en Wireshark.') ?>
    <p><strong>Entorno:</strong> tu equipo + Wireshark. <strong>Requisitos:</strong> permisos
    de captura en <code>lo</code> y un puerto abierto (por ejemplo 5432 o el
    <code>http.server</code> del lab anterior).</p>
    <?= steps([
        'Abre Wireshark, captura en <code>lo</code>, filtro de visualización <code>tcp.port == 8000</code>.',
        'Ejecuta <code>nmap -sT -p 8000,8001 127.0.0.1</code>.',
        'En el puerto abierto, localiza SYN → SYN/ACK → ACK → RST.',
        'En el cerrado, localiza SYN → RST/ACK.',
    ]) ?>
    <?= hints([
        '<p>Un escaneo <code>-sT</code> usa la pila TCP del sistema: hace conexiones de verdad.</p>',
        '<p>En Wireshark, el filtro <code>tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0</code> deja solo los intentos de apertura.</p>',
        '<p>Cuenta los paquetes por puerto: ¿cuántos hacen falta para un puerto cerrado y cuántos para uno abierto?</p>',
    ]) ?>
    <?= reveal('Solución razonada', '
      <p>En el connect scan, el puerto abierto completa el saludo (tres paquetes) y Nmap lo
      corta con un RST: cuatro en total. El cerrado se resuelve en dos: SYN y RST/ACK. Es
      justo la captura real que aparece en la sección de <code>-sT</code>. Como la conexión se
      completa, la aplicación puede registrarla — por eso <code>-sT</code> deja más rastro que
      <code>-sS</code>.</p>
      <p><strong>Aprendizaje:</strong> ver, y no solo leer, qué hace un connect scan.</p>') ?>
  </div>

  <div class="lab" id="lab7">
    <?= lab_head('07', 'SYN scan y su diferencia', 'intermedio',
        'Objetivo: comparar -sS con -sT en la captura.') ?>
    <p><strong>Entorno:</strong> tu equipo + Wireshark. <strong>Requisitos:</strong> root
    (<code>sudo</code>).</p>
    <?= steps([
        'Con Wireshark capturando en <code>lo</code> (filtro <code>tcp.port == 8000</code>).',
        'Ejecuta <code>sudo nmap -sS -p 8000 127.0.0.1</code>.',
        'Compara con la captura del lab 6: ¿qué paquete del saludo falta ahora?',
        'Ejecuta <code>sudo nmap -sS --reason -p 8000,8001 127.0.0.1</code> y anota las razones.',
    ]) ?>
    <?= hints([
        '<p>La diferencia está en el tercer paquete, no en el resultado.</p>',
        '<p>Captura los dos escaneos y cuenta paquetes por puerto abierto en cada caso.</p>',
        '<p>Pregúntate quién puede registrar una conexión que nunca llegó a establecerse — y quién sigue viéndola igual.</p>',
    ]) ?>
    <?= reveal('Solución razonada', '
      <p>En <code>-sS</code> falta el ACK que completaba el saludo: SYN → SYN/ACK → RST. La
      conexión nunca se establece del todo (por eso «half-open»), y el RST lo envía tu propio
      sistema al recibir un SYN/ACK que no esperaba. Las razones: <code>syn-ack</code> para
      abierto, <code>reset</code> para cerrado — más detalladas que las de connect
      (<code>conn-refused</code>). Recuerda: half-open no es «invisible», solo evita que la
      aplicación vea una conexión completa.</p>
      <p><strong>Aprendizaje:</strong> qué distingue realmente a los dos escaneos TCP.</p>') ?>
  </div>

  <div class="lab" id="lab8">
    <?= lab_head('08', 'UDP: lento y ambiguo', 'intermedio',
        'Objetivo: comprobar por qué UDP da open|filtered.') ?>
    <p><strong>Entorno:</strong> tu equipo o VM. <strong>Requisitos:</strong> root.</p>
    <?= steps([
        'Ejecuta <code>sudo nmap -sU --reason -p 53,123 127.0.0.1</code> y cronométralo mentalmente frente a un escaneo TCP.',
        'Anota el estado y la razón de cada puerto.',
        'Si tienes un servicio UDP (systemd-resolved suele escuchar en 127.0.0.53:53), escanéalo: <code>sudo nmap -sU -p 53 127.0.0.53</code>.',
        'Añade <code>-sV</code> a un puerto <code>open|filtered</code> y observa si se resuelve.',
    ]) ?>
    <?= hints([
        '<p>UDP no confirma la recepción. ¿Qué puede deducir Nmap del silencio?</p>',
        '<p>Hay un caso en el que sí hay certeza: cuando el sistema responde con ICMP.</p>',
        '<p>Compara el tiempo de <code>-sU</code> sobre tres puertos con el de <code>-sT</code> sobre mil.</p>',
    ]) ?>
    <?= reveal('Solución razonada', '
      <p>UDP es lento porque el único «cerrado» fiable es un ICMP port unreachable, y el
      sistema limita cuántos genera por segundo. El silencio es ambiguo: servicio abierto que
      ignora la sonda y firewall que descarta producen lo mismo, <code>open|filtered</code>.
      <code>-sV</code> puede desambiguar enviando una sonda específica del protocolo (una
      consulta DNS real al 53), que provoca respuesta si hay servicio.</p>
      <p><strong>Aprendizaje:</strong> UDP se audita acotado y con paciencia; el silencio no
      es una respuesta.</p>') ?>
  </div>

  <div class="lab" id="lab9">
    <?= lab_head('09', 'Sistema operativo', 'intermedio',
        'Objetivo: obtener una estimación de SO y entender su incertidumbre.') ?>
    <p><strong>Entorno:</strong> VM propia. <strong>Requisitos:</strong> root; al menos un
    puerto abierto y uno cerrado en la VM.</p>
    <?= steps([
        'Ejecuta <code>sudo nmap -O &lt;IP-LAB&gt;</code>.',
        'Anota <code>OS details</code> y el <code>Network Distance</code>.',
        'Repite con <code>sudo nmap -O --osscan-guess &lt;IP-LAB&gt;</code> y compara los porcentajes.',
        'Escanea un contenedor Docker propio y compara el SO detectado con la distribución real del contenedor.',
    ]) ?>
    <?= hints([
        '<p><code>-O</code> no pregunta el sistema operativo: compara comportamiento con una base de huellas.</p>',
        '<p>Fíjate en el porcentaje de confianza y en si Nmap ofrece varias opciones.</p>',
        '<p>Necesita al menos un puerto abierto y uno cerrado para tener con qué comparar.</p>',
    ]) ?>
    <?= reveal('Solución razonada', '
      <p>El resultado es un rango de kernel, no una versión exacta, porque el fingerprinting
      es estadístico. Los porcentajes miden parecido a una huella conocida, no probabilidad de
      acierto. El contenedor es la lección más clara: comparte el kernel del anfitrión, así
      que un contenedor Debian sobre un host Arch se detecta como el kernel de Arch. Firewalls
      y NAT pueden hacer que identifiques el equipo intermedio, no el objetivo.</p>
      <p><strong>Aprendizaje:</strong> <code>-O</code> orienta; nunca se copia a un informe
      como certeza.</p>') ?>
  </div>

  <div class="lab" id="lab10">
    <?= lab_head('10', 'NSE seguro', 'intermedio',
        'Objetivo: usar scripts no destructivos y leer su ayuda antes.') ?>
    <p><strong>Entorno:</strong> tu equipo o VM con un servicio web/TLS.</p>
    <?= steps([
        'Lee primero: <code>nmap --script-help http-title,ssl-cert</code>. Anota categorías.',
        'Ejecuta <code>nmap -sV -p 8090 --script http-title,http-server-header 127.0.0.1</code> (usa tu puerto web).',
        'Si tienes un servicio TLS, prueba <code>nmap -p 443 --script ssl-cert &lt;IP-LAB&gt;</code>.',
        'Cuenta cuántos scripts son <code>safe</code> y no salen de tu red: <code>nmap --script-help "safe and not (broadcast or external)" | grep -c Categories</code>.',
    ]) ?>
    <?= hints([
        '<p><code>--script-help</code> explica qué hace un script antes de ejecutarlo. Úsalo siempre primero.</p>',
        '<p>Las categorías <code>safe</code> y <code>default</code> son las que no intentan nada intrusivo.</p>',
        '<p>Empieza por <code>http-title</code> contra tu propio servidor: es inofensivo y su salida se entiende sola.</p>',
    ]) ?>
    <?= reveal('Solución razonada', '
      <p>La rutina correcta es <em>leer, luego ejecutar</em>. <code>http-title</code> y
      <code>ssl-cert</code> son default/discovery/safe: leen información pública (título de la
      web, certificado) sin forzar nada. En la 7.991, «safe y no broadcast ni external» son
      281 scripts: los que puedes lanzar con más tranquilidad en tu laboratorio. Nunca
      ejecutes <code>exploit</code>, <code>brute</code> o <code>dos</code>.</p>
      <p><strong>Aprendizaje:</strong> NSE describe servicios; <code>--script-help</code> es la
      etiqueta que se lee antes.</p>') ?>
  </div>

  <div class="lab" id="lab11">
    <?= lab_head('11', 'Combinar TCP y UDP', 'intermedio',
        'Objetivo: una ejecución, dos protocolos, puertos con prefijos.') ?>
    <p><strong>Entorno:</strong> VM propia. <strong>Requisitos:</strong> root.</p>
    <?= steps([
        'Ejecuta <code>sudo nmap -sS -sU -p T:22,80,443,U:53,123 &lt;IP-LAB&gt;</code>.',
        'Observa cómo la tabla mezcla puertos <code>/tcp</code> y <code>/udp</code>.',
        'Añade <code>--reason</code> y compara las razones de TCP (reset/syn-ack) con las de UDP (port-unreach/no-response).',
    ]) ?>
    <?= hints([
        '<p>Se pueden pedir los dos escaneos en un mismo comando.</p>',
        '<p>La sintaxis de <code>-p</code> admite prefijos: <code>T:</code> y <code>U:</code>.</p>',
        '<p>Elige pocos puertos UDP o el comando tardará muchísimo más que la parte TCP.</p>',
    ]) ?>
    <?= reveal('Solución razonada', '
      <p>El calificador <code>T:</code> se aplica a los puertos que le siguen hasta que
      aparece <code>U:</code>. Por eso siempre hay que escribir el protocolo junto al puerto:
      <code>53/tcp</code> y <code>53/udp</code> son servicios distintos y pueden aparecer en la
      misma tabla. El manual exige <code>-sU</code> más al menos un tipo TCP para analizar
      ambos a la vez.</p>
      <p><strong>Aprendizaje:</strong> un puerto sin protocolo es un dato incompleto.</p>') ?>
  </div>

  <div class="lab" id="lab12">
    <?= lab_head('12', 'Inventario de laboratorio', 'avanzado',
        'Objetivo: recorrer el flujo completo de inventario de principio a fin.') ?>
    <p><strong>Entorno:</strong> tu red de laboratorio con 1–2 VM. <strong>Requisitos:</strong> root.</p>
    <?= steps([
        'Confirma tu red: <code>ip route</code>. Ensayo: <code>nmap -sL -n TU_RED/24</code>.',
        'Descubre: <code>sudo nmap -sn TU_RED/24 -oA lab-hosts</code>.',
        'Extrae activos: <code>grep "Status: Up" lab-hosts.gnmap</code>.',
        'Escanea: <code>sudo nmap -sS -sV -p- --reason -iL activos.txt -oA lab-servicios</code>.',
        'Revisa cada servicio: ¿debería estar ahí? Guarda <code>lab-servicios.xml</code> como línea base.',
    ]) ?>
    <?= hints([
        '<p>Un inventario útil no es una foto: es una serie que se puede comparar.</p>',
        '<p>Pon la fecha en el nombre del fichero y usa <code>-oA</code>.</p>',
        '<p>Piensa dónde vas a guardarlo: dice exactamente qué ofrece cada equipo de tu red.</p>',
    ]) ?>
    <?= reveal('Solución razonada', '
      <p>El orden importa: descubrir antes de escanear evita perder tiempo con direcciones
      vacías; guardar la línea base permite comparar después. El paso que más valor aporta no
      es ningún comando, sino el punto 5: cruzar lo que hay con lo que <em>debería</em> haber.
      Recuerda que el inventario resultante es información sensible: guárdalo con acceso
      restringido.</p>
      <p><strong>Aprendizaje:</strong> el inventario es un proceso —descubrir, escanear,
      contextualizar, conservar—, no un comando suelto.</p>') ?>
  </div>

  <div class="lab" id="lab13">
    <?= lab_head('13', 'Auditoría defensiva: validar un firewall', 'avanzado',
        'Objetivo: ver un puerto pasar de open a filtered y distinguirlo de closed.') ?>
    <p><strong>Entorno:</strong> VM propia con un servicio de prueba. <strong>Requisitos:</strong>
    saber configurar el firewall de tu VM (fuera del alcance de este tutorial).</p>
    <?= steps([
        'Con un servicio escuchando (por ejemplo, <code>python3 -m http.server 8000</code> en la VM), escanea desde el host: <code>nmap --reason -p 8000 &lt;IP-LAB&gt;</code> → <code>open</code>.',
        'En la VM, añade una regla de firewall que <strong>descarte</strong> (DROP) el 8000.',
        'Reescanea: debe pasar a <code>filtered</code> con razón <code>no-response</code>.',
        'Ahora cambia la regla a <strong>rechazar</strong> (REJECT) y reescanea: <code>filtered</code> con <code>admin-prohibited</code>.',
        'Quita la regla, detén el servicio y reescanea: <code>closed</code>. Compara con <code>filtered</code>.',
    ]) ?>
    <?= hints([
        '<p>Validar un firewall es comprobar que lo que <em>debería</em> estar bloqueado lo está.</p>',
        '<p>El estado que confirma que una regla funciona no es <code>closed</code>.</p>',
        '<p>Escanea desde dos sitios distintos —dentro y fuera de la regla— y compara las dos tablas.</p>',
    ]) ?>
    <?= reveal('Solución razonada', '
      <p>Este laboratorio hace tangible la distinción más importante del curso. DROP →
      <code>filtered</code>/<code>no-response</code>: el firewall se traga la sonda en
      silencio. REJECT → <code>filtered</code>/<code>admin-prohibited</code>: la bloquea pero
      lo dice con un ICMP. Servicio parado → <code>closed</code>: el equipo responde «aquí no
      hay nadie». Un puerto <code>closed</code> tras aplicar una regla significa que no
      filtraste nada: paraste el servicio. Sin <code>--reason</code> no verías esta diferencia.</p>
      <p><strong>Aprendizaje:</strong> <code>filtered</code> demuestra que la regla funciona;
      <code>closed</code> demuestra que el servicio no está.</p>') ?>
  </div>

  <div class="lab" id="lab14">
    <?= lab_head('14', 'Nmap + Wireshark: un escaneo entero', 'avanzado',
        'Objetivo: correlacionar la conclusión de Nmap con los paquetes que la sostienen.') ?>
    <p><strong>Entorno:</strong> tu equipo + Wireshark.</p>
    <?= steps([
        'Wireshark capturando en <code>lo</code>, sin filtro de captura.',
        'Ejecuta <code>nmap -sT --reason -p 22,5432,8000 127.0.0.1</code> (ajusta a tus puertos).',
        'En Wireshark, aplica <code>tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0</code>: verás un SYN por puerto.',
        'Para un puerto abierto, clic derecho → Follow → TCP Stream, y cuenta los paquetes.',
        'Cruza cada razón de Nmap (syn-ack, conn-refused) con lo que ves en la captura.',
    ]) ?>
    <?= hints([
        '<p>Arranca la captura antes del escaneo y detenla después: así el fichero contiene el escaneo entero.</p>',
        '<p>En Wireshark, <b>Statistics → Conversations</b> te dice cuántas conversaciones generó.</p>',
        '<p>Compara la tabla de Nmap con los paquetes: cada línea de la tabla tiene su par de paquetes en la captura.</p>',
    ]) ?>
    <?= reveal('Solución razonada', '
      <p>El filtro de SYN muestra una apertura por puerto: es la firma de un escaneo (un
      origen, muchos puertos, en un instante). Cada conclusión de Nmap tiene su reflejo en la
      captura: <code>syn-ack</code> ↔ el segundo paquete del saludo llegó;
      <code>conn-refused</code> ↔ RST/ACK del sistema. Este es el ejercicio que une los dos
      tutoriales: Nmap resume, Wireshark demuestra.</p>
      <p><strong>Aprendizaje:</strong> nunca más leerás un estado de Nmap sin saber qué
      paquete hay debajo.</p>') ?>
  </div>

  <div class="lab" id="lab15">
    <?= lab_head('15', 'Mini incidente: interpretar un conjunto de resultados', 'avanzado',
        'Objetivo: pasar de una tabla de puertos a un informe con hechos, hipótesis y recomendaciones.') ?>
    <p><strong>Entorno:</strong> papel y cabeza. Trabaja sobre este resultado de un servidor
    que, según su documentación, solo debería ofrecer una web pública:</p>
    <?= term('Nmap scan report for 192.168.56.10' . "\n"
           . 'PORT     STATE    SERVICE  VERSION' . "\n"
           . '22/tcp   <span class="st-open">open</span>     ssh      OpenSSH 8.4p1 Debian 5+deb11u1 (protocol 2.0)' . "\n"
           . '80/tcp   <span class="st-open">open</span>     http     nginx 1.18.0' . "\n"
           . '443/tcp  <span class="st-open">open</span>     ssl/http nginx 1.18.0' . "\n"
           . '3306/tcp <span class="st-open">open</span>     mysql    MySQL 5.7.38' . "\n"
           . '6379/tcp <span class="st-filt">filtered</span> redis' . "\n"
           . '8080/tcp <span class="st-open">open</span>     http     nginx 1.18.0', 'salida ilustrativa') ?>
    <p><strong>Redacta un mini informe</strong> (usa la plantilla del nivel 8) separando:
    servicios esperados, servicios inesperados, qué es hecho y qué es hipótesis, y tus
    recomendaciones. Hazlo antes de abrir la solución.</p>
    <?= hints([
        '<p>Empieza por separar lo esperado de lo inesperado, según lo que dice la documentación del servidor.</p>',
        '<p>De los inesperados, ¿cuál no tendría por qué escuchar en la red en ningún caso?</p>',
        '<p>Un estado <code>filtered</code> no es lo mismo que <code>open</code>: cambia la urgencia, no la pregunta.</p>',
    ]) ?>
    <?= reveal('Ver solución razonada', '
      <p><strong>Esperado:</strong> 80 y 443 (la web). <strong>Todo lo demás es inesperado</strong>
      para un servidor que «solo debería ofrecer una web pública».</p>
      <ul>
        <li><strong>22/tcp SSH</strong> — administración. Hecho: está abierto. Hipótesis:
        puede ser legítimo (alguien lo administra), pero ¿debería ser accesible desde donde
        escaneas, o solo desde la red de gestión? Recomendación: restringir por firewall a las
        IP de administración.</li>
        <li><strong>3306/tcp MySQL</strong> — hallazgo serio. Una base de datos no debería
        escuchar en la red en un servidor web; la web la usaría por <code>localhost</code>.
        Hecho: expuesta. Hipótesis: exposición innecesaria. Recomendación: escuchar solo en
        loopback o limitar por firewall. Además MySQL 5.7 está cerca de su fin de vida:
        revisar soporte.</li>
        <li><strong>8080/tcp otro nginx</strong> — ¿un entorno de pruebas o un panel olvidado?
        Es el tipo de servicio que un escaneo por defecto (top 1000 sí lo incluye) revela y
        que la documentación no menciona. Investigar qué sirve.</li>
        <li><strong>6379/tcp Redis filtered</strong> — matiz importante: <code>filtered</code>,
        no <code>open</code>. Algo ya impide llegar (probable firewall). Sigue mereciendo la
        pregunta «¿por qué hay Redis aquí?», pero la exposición está controlada. No es lo
        mismo que si estuviera <code>open</code>.</li>
      </ul>
      <p><strong>Lo que NO se afirma:</strong> «el servidor está comprometido». Nada en este
      escaneo lo sostiene. Lo que hay es <em>exposición mayor de la prevista</em>, que exige
      investigación y, muy probablemente, <em>hardening</em>. La diferencia entre este informe
      y uno alarmista es que este separa lo observado de lo supuesto y termina en acciones
      verificables.</p>
      <p><strong>Aprendizaje:</strong> el valor de Nmap no está en la tabla, sino en lo que
      haces con ella sin adelantarte a los datos.</p>') ?>
  </div>
</section>

<!-- ============================ DESAFÍOS ============================ -->
<section id="desafios">
  <h2>Desafíos</h2>
  <p class="tut-sub">Preguntas sin respuesta inmediata. Intenta resolverlas antes de desplegar la solución.</p>

  <div class="lab">
    <?= lab_head('D1', 'Leer una tabla de estados', 'intermedio',
        'Misión: interpretar cada línea de este resultado y decidir qué investigarías después.') ?>
    <?= term('PORT     STATE    SERVICE' . "\n"
           . '22/tcp   <span class="st-open">open</span>     ssh' . "\n"
           . '80/tcp   <span class="st-closed">closed</span>   http' . "\n"
           . '443/tcp  <span class="st-open">open</span>     https' . "\n"
           . '3306/tcp <span class="st-filt">filtered</span> mysql', 'salida ilustrativa') ?>
    <p>Responde: ¿qué servicios parecen disponibles? ¿cuál no acepta conexiones? ¿cuál podría
    estar protegido por un firewall? ¿qué investigarías a continuación?</p>
    <?= hints([
        '<p>Cada fila de la tabla dice dos cosas distintas: qué respondió el equipo y qué nombre tiene ese puerto en la tabla de Nmap.</p>',
        '<p>Solo una de las dos columnas es evidencia. La otra es una suposición.</p>',
        '<p>Fíjate en qué filas podrías defender ante alguien que te pidiera pruebas.</p>',
    ]) ?>
    <?= reveal('Ver solución razonada', '
      <ul>
        <li><strong>Disponibles:</strong> 22 (SSH) y 443 (HTTPS): <code>open</code>, alguien
        escucha y contesta.</li>
        <li><strong>No acepta conexiones:</strong> 80 (<code>closed</code>). El equipo
        responde «aquí no hay nadie» — está vivo, pero no hay servicio en ese puerto. Ojo: que
        el 80 esté cerrado y el 443 abierto es lo normal en un sitio que solo sirve HTTPS.</li>
        <li><strong>Posible firewall:</strong> 3306 (<code>filtered</code>). No hubo respuesta:
        algo impide llegar. Podría haber un MySQL detrás, protegido, o no haber nada; el
        escaneo no lo distingue.</li>
        <li><strong>Siguiente paso:</strong> <code>-sV</code> sobre 22 y 443 para saber qué
        software es; <code>--reason</code> sobre el 3306 para ver si es <code>no-response</code>
        (DROP) o <code>admin-prohibited</code> (REJECT). Y la pregunta de contexto: ¿debería
        haber MySQL en este equipo?</li>
      </ul>') ?>
  </div>

  <div class="lab">
    <?= lab_head('D2', 'open frente a filtered', 'avanzado',
        'Misión: explicar qué cambió entre dos escaneos del mismo puerto en el mismo host.') ?>
    <?= term('<span class="c"># lunes</span>' . "\n"
           . '3306/tcp <span class="st-open">open</span>     mysql' . "\n"
           . '<span class="c"># viernes</span>' . "\n"
           . '3306/tcp <span class="st-filt">filtered</span> mysql', 'salida ilustrativa') ?>
    <p>El servicio no se ha tocado. ¿Qué explicaciones tiene el cambio y cuál es la más
    probable en una red bien administrada?</p>
    <?= reveal('Ver pistas', '
      <ul>
        <li>¿Qué significa exactamente <code>filtered</code>?</li>
        <li>¿Qué acción de administración produce ese cambio sin tocar el servicio?</li>
        <li>¿Podría ser algo del camino y no del servidor?</li>
      </ul>') ?>
    <?= reveal('Ver solución razonada', '
      <p>La explicación más probable y deseable: <strong>alguien añadió una regla de firewall</strong>
      que ahora descarta el tráfico al 3306. El servicio sigue vivo (por eso no está
      <code>closed</code>), pero ya no es accesible desde donde escaneas. Es exactamente el
      resultado que buscabas si el objetivo era limitar esa base de datos: pasar de
      <code>open</code> a <code>filtered</code> es la prueba de que el <em>hardening</em>
      funcionó.</p>
      <p>Otras explicaciones a descartar: un IPS que empezó a bloquear tu origen; un cambio en
      la ruta o en un firewall intermedio; el servicio movido a escuchar solo en loopback
      (pero eso daría <code>closed</code>, no <code>filtered</code>). <code>--reason</code>
      ayuda a distinguirlas. Lo que <strong>no</strong> puedes afirmar solo con esto es que el
      servidor tenga un problema: puede que todo esté yendo como debía.</p>') ?>
  </div>

  <div class="lab">
    <?= lab_head('D3', 'El equipo que no debería hablar', 'avanzado',
        'Misión: un -sn de tu red de laboratorio devuelve un host que no reconoces. ¿Qué haces?') ?>
    <?= term('Nmap scan report for 192.168.56.10   <span class="c"># tu VM web</span>' . "\n"
           . 'Nmap scan report for 192.168.56.20   <span class="c"># tu VM de base de datos</span>' . "\n"
           . 'Nmap scan report for 192.168.56.77   <span class="c"># ¿?</span>' . "\n"
           . 'MAC Address: 3C:22:FB:… (Apple, Inc.)', 'salida ilustrativa') ?>
    <p>En tu laboratorio solo deberías tener dos VM y tu propio equipo. Aparece un tercero.
    ¿Qué pasos das, y en qué orden, sin sacar conclusiones precipitadas?</p>
    <?= reveal('Ver pistas', '
      <ul>
        <li>La MAC lleva el fabricante. ¿Qué te sugiere?</li>
        <li>¿Qué red es esta realmente? ¿Es puramente <em>host-only</em> o tiene salida?</li>
        <li>¿Qué información añadiría un escaneo de puertos y versiones de ese host?</li>
      </ul>') ?>
    <?= reveal('Ver solución razonada', '
      <p>Primero, <strong>los hechos</strong>: hay una tercera dirección activa con una MAC de
      Apple. Nada más. Antes de alarmarte, la pregunta clave es <em>qué red es esta</em>. Si tu
      «laboratorio» no es una red <em>host-only</em> aislada, sino tu red doméstica, ese
      <code>.77</code> es probablemente tu propio teléfono o portátil — y aquí aparece el
      límite ético del curso: <strong>si es un dispositivo de otra persona en una red que no es
      exclusivamente tuya, no lo escanees</strong>.</p>
      <p>Si de verdad es tu laboratorio aislado y no reconoces el equipo: (1) anota MAC, IP y
      hora; (2) identifícalo por la MAC y, si es tuyo, documéntalo en el inventario; (3) si no
      logras identificarlo y la red es enteramente tuya, un <code>-sV</code> acotado te dirá
      qué ofrece. Lo que <strong>no</strong> concluyes: «me han hackeado». Un host desconocido
      en una red mal inventariada casi siempre es un dispositivo olvidado, no un intruso. El
      valor del ejercicio es doble: detectar lo no inventariado, y frenar antes de tocar algo
      que quizá no te corresponde.</p>') ?>
  </div>
</section>

<!-- ============================= CHULETA ============================ -->
<section id="chuleta">
  <h2>Chuleta de Nmap</h2>
  <p class="tut-sub">Lo de uso diario, por bloques. Sin técnicas de evasión. Todo verificado contra Nmap 7.991.</p>

  <h4>Básico</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Comandos básicos</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">nmap 127.0.0.1</td><td class="d">Escaneo por defecto: 1000 puertos TCP más comunes</td></tr>
        <tr><td class="f">nmap --version</td><td class="d">Versión y capacidades compiladas</td></tr>
        <tr><td class="f">nmap --help</td><td class="d">Resumen de opciones por bloques</td></tr>
        <tr><td class="f">man nmap</td><td class="d">Manual completo (busca con <kbd>/</kbd>)</td></tr>
        <tr><td class="f">nmap -v 127.0.0.1</td><td class="d">Muestra el proceso mientras corre</td></tr>
        <tr><td class="f">nmap --reason 127.0.0.1</td><td class="d">Por qué cada puerto tiene ese estado</td></tr>
        <tr><td class="f">nmap --open 127.0.0.1</td><td class="d">Solo puertos abiertos</td></tr>
      </tbody>
    </table>
  </div>

  <h4>Objetivos</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Especificación de objetivos</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">nmap 192.168.56.10 192.168.56.20</td><td class="d">Varias IP</td></tr>
        <tr><td class="f">nmap 192.168.56.10-20</td><td class="d">Rango en el último octeto</td></tr>
        <tr><td class="f">nmap 192.168.56.0/24</td><td class="d">Red completa (CIDR)</td></tr>
        <tr><td class="f">nmap -iL alcance.txt</td><td class="d">Objetivos desde un archivo</td></tr>
        <tr><td class="f">nmap 192.168.56.0/24 --exclude 192.168.56.1</td><td class="d">Excluir equipos</td></tr>
        <tr><td class="f">nmap --excludefile excluir.txt</td><td class="d">Excluir desde archivo</td></tr>
      </tbody>
    </table>
  </div>

  <h4>Descubrimiento de hosts</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Host discovery</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">nmap -sL -n 192.168.56.0/24</td><td class="d">List scan: lista objetivos sin enviarles nada</td></tr>
        <tr><td class="f">sudo nmap -sn 192.168.56.0/24</td><td class="d">Ping scan: quién está activo, sin puertos (ARP en la LAN)</td></tr>
        <tr><td class="f">nmap -Pn 192.168.56.10</td><td class="d">Tratar el host como activo y escanear puertos igualmente</td></tr>
        <tr><td class="f">nmap -n …</td><td class="d">Sin resolución DNS inversa</td></tr>
        <tr><td class="f">nmap -R …</td><td class="d">Resolución inversa de todos los objetivos</td></tr>
      </tbody>
    </table>
  </div>

  <h4>Puertos</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Selección de puertos</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">-p 22</td><td class="d">Un puerto</td></tr>
        <tr><td class="f">-p 22,80,443</td><td class="d">Lista (sin espacios)</td></tr>
        <tr><td class="f">-p 1-1024</td><td class="d">Rango</td></tr>
        <tr><td class="f">-p-</td><td class="d">Todos (1–65535)</td></tr>
        <tr><td class="f">-p T:22,80,U:53,123</td><td class="d">TCP y UDP con prefijos</td></tr>
        <tr><td class="f">--top-ports 20</td><td class="d">Los 20 más frecuentes</td></tr>
        <tr><td class="f">-F</td><td class="d">Rápido: 100 puertos en vez de 1000</td></tr>
        <tr><td class="f">--exclude-ports 9100</td><td class="d">Excluir puertos</td></tr>
      </tbody>
    </table>
  </div>

  <h4>Técnicas de escaneo</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Técnicas de escaneo TCP y UDP</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">nmap -sT 127.0.0.1</td><td class="d">TCP connect (sin root; el defecto sin privilegios)</td></tr>
        <tr><td class="f">sudo nmap -sS 192.168.56.10</td><td class="d">TCP SYN (root; el defecto con privilegios)</td></tr>
        <tr><td class="f">sudo nmap -sU -p 53,123 192.168.56.10</td><td class="d">UDP (lento; acótalo a puertos concretos)</td></tr>
        <tr><td class="f">sudo nmap -sS -sU -p T:22,U:53 …</td><td class="d">TCP y UDP a la vez</td></tr>
      </tbody>
    </table>
  </div>

  <h4>Servicios y sistema operativo</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Detección de servicios y SO</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">nmap -sV 127.0.0.1</td><td class="d">Servicio y versión reales</td></tr>
        <tr><td class="f">nmap -sV --version-light …</td><td class="d">Versión con menos sondas (más rápido)</td></tr>
        <tr><td class="f">sudo nmap -O 192.168.56.10</td><td class="d">Estimación de sistema operativo</td></tr>
        <tr><td class="f">sudo nmap -O --osscan-guess …</td><td class="d">Adivinar SO de forma más agresiva</td></tr>
        <tr><td class="f">sudo nmap --traceroute …</td><td class="d">Saltos hasta el objetivo</td></tr>
        <tr><td class="f">sudo nmap -A 192.168.56.10</td><td class="d">-O + -sV + -sC + traceroute (úsalo sabiendo qué activa)</td></tr>
      </tbody>
    </table>
  </div>

  <h4>NSE (scripts seguros)</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Nmap Scripting Engine</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">nmap --script-help NOMBRE</td><td class="d">Leer qué hace un script antes de ejecutarlo</td></tr>
        <tr><td class="f">nmap -sC 127.0.0.1</td><td class="d">Scripts de la categoría <code>default</code></td></tr>
        <tr><td class="f">nmap --script http-title,ssl-cert -sV …</td><td class="d">Scripts concretos</td></tr>
        <tr><td class="f">nmap --script "safe and not (broadcast or external)" …</td><td class="d">Seguros que no salen de tu red</td></tr>
        <tr><td class="f">ls /usr/share/nmap/scripts/</td><td class="d">Ver los scripts instalados</td></tr>
      </tbody>
    </table>
  </div>

  <h4>Salida y diagnóstico</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Formatos de salida y diagnóstico</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">-oN archivo.txt</td><td class="d">Guardar en formato normal (legible)</td></tr>
        <tr><td class="f">-oX archivo.xml</td><td class="d">Guardar en XML (para <code>ndiff</code>/herramientas)</td></tr>
        <tr><td class="f">-oG archivo.gnmap</td><td class="d">Guardar en grepable (una línea por host)</td></tr>
        <tr><td class="f">-oA base</td><td class="d">Los tres formatos a la vez</td></tr>
        <tr><td class="f">--append-output</td><td class="d">Añadir en vez de sobrescribir</td></tr>
        <tr><td class="f">ndiff antes.xml despues.xml</td><td class="d">Comparar dos escaneos</td></tr>
        <tr><td class="f">--packet-trace</td><td class="d">Ver cada paquete (para aprender)</td></tr>
      </tbody>
    </table>
  </div>

  <h4>Administración (ritmo y cortesía)</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Opciones de administración y ritmo</caption>
      <thead><tr><th scope="col">Comando</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">-T3</td><td class="d">Ritmo normal (por defecto)</td></tr>
        <tr><td class="f">-T4</td><td class="d">Más rápido: red rápida y fiable (tu laboratorio)</td></tr>
        <tr><td class="f">-T2</td><td class="d">Cortés: equipos frágiles o enlaces lentos</td></tr>
        <tr><td class="f">--max-rate 50</td><td class="d">Techo de paquetes por segundo</td></tr>
        <tr><td class="f">--host-timeout 10m</td><td class="d">Abandonar un host que tarda demasiado</td></tr>
      </tbody>
    </table>
  </div>

  <p>Nota final sobre privilegios: necesitan <code>sudo</code> las técnicas que construyen
  paquetes en bruto — <code>-sS</code>, <code>-sU</code>, <code>-O</code> y
  <code>--traceroute</code>—, y <code>-sn</code> usa ARP solo con root. Todo lo demás
  (<code>-sT</code>, <code>-sV</code>, NSE, salida) funciona como usuario normal. Empieza sin
  <code>sudo</code>; añádelo solo cuando la técnica lo exija.</p>

  <aside class="tut-legal">
    <h3>Sobre dónde escanear</h3>
    <p>Todos los comandos de esta guía se practican contra <code>127.0.0.1</code> o contra
    máquinas virtuales y redes de laboratorio que tú controlas. Escanear equipos o redes que
    no son tuyos, o sin autorización escrita de su propietario, puede ser ilegal en la mayoría
    de jurisdicciones —incluida España y México— y, aunque no cause daño, genera alertas que
    alguien tendrá que investigar. En tu propia red y tus propias máquinas estás en tu
    derecho; en la de una empresa, una escuela, una cafetería, un vecino o cualquier servidor
    de Internet —incluido tu propio hosting, cuyo servidor es del proveedor—, no.</p>
    <p>La parte de ciberseguridad de esta guía está escrita en clave defensiva: explica qué
    hace cada técnica, qué evidencia produce y cómo reconocerla desde el lado que la recibe.
    No contiene procedimientos para evadir controles, ocultar actividad, comprometer servicios
    ni explotar vulnerabilidades, y no debe adaptarse para ello.</p>
  </aside>
</section>
