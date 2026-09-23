<?php
/**
 * Tutorial: Wireshark — de cero al análisis defensivo de tráfico
 * ---------------------------------------------------------------------
 * v1.1.0 — ampliación del laboratorio original de nueve ejercicios a un
 * curso completo en cinco partes: Fundamentos, Protocolos, Wireshark a
 * fondo, Ciberseguridad y Práctica.
 *
 * Procedencia del contenido
 *   · Todo el material de la v1.0.0 (a su vez migrado de wireshark-lab.html)
 *     se conserva palabra por palabra, redistribuido por capítulos.
 *   · Las anclas antiguas (instalar, mental, ventana, filtros, chuleta y
 *     e1..e9) siguen existiendo: las de los ejercicios se mantienen como
 *     anclas heredadas invisibles sobre la sección que las sustituye, para
 *     que ningún enlace guardado se rompa.
 *
 * Rigor técnico
 *   · Los display filters de esta página se validaron uno a uno con
 *     `dftest` de Wireshark 4.7.3, el mismo motor que usa el programa.
 *   · Las rutas de menú se contrastaron con la Wireshark User's Guide
 *     oficial (Analyze → Follow, Statistics → …, Analyze → Expert
 *     Information) y con las cadenas del binario instalado.
 *
 * Enfoque de seguridad: exclusivamente defensivo. Se explica qué señal
 * deja una técnica y cómo reconocerla, nunca cómo ejecutarla.
 *
 * v1.3.0 — aplicación del estándar de enseñanza visual del proyecto
 * (docs/TUTORIAL_STANDARD.md). El contenido anterior se conserva íntegro;
 * lo que se añade es lo que faltaba para cumplir la norma:
 *   · 20 figuras con procedencia declarada, alt, pie y lupa;
 *   · leyendas numeradas para las figuras anotadas;
 *   · nueve bloques evidencia / interpretación / límite;
 *   · diez bloques de error común;
 *   · pregunta, pistas progresivas y solución razonada en los 12 labs;
 *   · los 15 ejercicios reclasificados a la escala global
 *     Básico / Intermedio / Avanzado;
 *   · resumen y quiz al cierre de cada uno de los cuatro capítulos.
 *
 * Procedencia del material visual
 *   · Las figuras rotuladas «captura real de laboratorio» salen de una
 *     captura hecha con `tshark -i lo -f "icmp or tcp port 8090"` sobre
 *     `ping -c 3 127.0.0.1` y `curl http://127.0.0.1:8090/`. Tráfico
 *     propio, en loopback, sin un solo dato de terceros.
 *   · Las demás son representaciones didácticas y lo dicen en la página.
 */
require_once \App\Core\Config::basePath('app/Views/components/icons.php');
require_once \App\Core\Config::basePath('app/Views/components/blocks.php');
?>

<!-- Entradilla original del laboratorio, conservada palabra por palabra:
     es la que fija la promesa del tutorial y el orden de lectura. -->
<p class="tl-eyebrow">Guía práctica · CachyOS · wlan0 — «Wireshark en 9 capturas»</p>
<p class="tut-lead">
  Nueve ejercicios en orden, cada uno construido sobre el anterior. Abres Wireshark,
  ejecutas el comando, miras lo que aparece. Al final sabes leer una conversación de red
  entera.
</p>
<p class="tut-lead">
  Esa era la promesa de la primera versión y sigue en pie: los nueve ejercicios están
  todos aquí. Alrededor han crecido cuatro partes más, hasta cubrir el camino completo
  —qué es un paquete, cómo se lee cada protocolo, cómo se maneja Wireshark de verdad y
  cómo se usa todo eso para investigar tráfico sospechoso—. Puedes leerlo de principio a
  fin como un curso, o entrar por el índice a la sección que necesites.
</p>

<div class="tut-search" role="search">
  <label class="visually-hidden" for="tut-q">Buscar en este tutorial</label>
  <input type="search" id="tut-q" class="tut-search__input" data-tut-search
         placeholder="Buscar: tcp, dns, beaconing, retransmisión, filtro…"
         autocomplete="off" spellcheck="false">
  <p class="tut-search__status" data-tut-search-status role="status" aria-live="polite"></p>
</div>

<?= chapter('01', 'Fundamentos', 'Qué es un paquete, qué hace Wireshark con él y cómo se mueve uno por el programa.', 'fundamentos') ?>

<!-- ============================== QUÉ ES ============================= -->
<section id="que-es">
  <h2>Qué es Wireshark y qué no es</h2>
  <p class="tut-sub">Antes de instalar nada, conviene saber qué esperas de la herramienta.</p>

  <p>Wireshark es un <strong>analizador de protocolos de red</strong>. Hace dos cosas, y es
  útil separarlas desde el principio porque son independientes:</p>

  <dl class="panes panes--2">
    <div>
      <dt>1 · Capturar</dt>
      <dd>Le pide al sistema operativo una copia de cada trama que entra o sale por una
      interfaz de red, y la guarda. Esta parte es privilegiada y en Linux la hace un
      binario aparte, <code>dumpcap</code>.</dd>
    </div>
    <div>
      <dt>2 · Analizar</dt>
      <dd>Coge esos bytes y los <em>disecciona</em>: reconoce que los primeros catorce son
      una cabecera Ethernet, que dentro hay IP, dentro TCP, dentro HTTP, y te lo presenta
      con nombres. Esta parte no necesita permisos: puedes analizar un fichero guardado
      sin capturar nada.</dd>
    </div>
  </dl>

  <p>Un <strong>sniffer</strong> es cualquier programa que hace lo primero. Wireshark es un
  sniffer, pero su valor está en lo segundo: conoce más de tres mil protocolos y sabe
  desmontarlos campo a campo.</p>

  <h3>Lo que Wireshark <em>no</em> hace</h3>

  <p>Esto ahorra malentendidos, y algunos son frecuentes:</p>

  <ul>
    <li><strong>No bloquea, no modifica, no inyecta.</strong> Es un microscopio, no un
    cortafuegos. Si algo va mal en tu red, Wireshark te dice qué está pasando, pero
    arreglarlo es otra herramienta.</li>
    <li><strong>No descifra tráfico ajeno.</strong> Sin las claves, HTTPS es ruido. Más
    adelante descifrarás tráfico <em>tuyo</em> porque tu propio navegador te presta sus
    claves; no hay forma de conseguir las de nadie más.</li>
    <li><strong>No detecta ataques por su cuenta.</strong> No es un IDS. Marca anomalías
    de protocolo, y eres tú quien decide si significan algo.</li>
    <li><strong>No ve lo que no pasa por tu interfaz.</strong> Esta es la limitación que
    más sorprende y merece su propio apartado.</li>
  </ul>

  <h3>Trama, paquete y qué ve realmente tu tarjeta</h3>

  <p>Los términos se usan indistintamente en conversación, pero designan cosas distintas y
  Wireshark los distingue en el árbol:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Unidades de datos por capa</caption>
      <thead><tr><th scope="col">Nombre</th><th scope="col">Capa</th><th scope="col">Qué incluye</th></tr></thead>
      <tbody>
        <tr><td class="f">Trama (frame)</td><td class="d">Enlace</td><td class="d">Todo lo que viaja por el cable o el aire, cabecera Ethernet incluida. Es la unidad que Wireshark numera y cronometra.</td></tr>
        <tr><td class="f">Paquete (packet)</td><td class="d">Red</td><td class="d">La cabecera IP y su contenido, sin la envoltura Ethernet.</td></tr>
        <tr><td class="f">Segmento</td><td class="d">Transporte</td><td class="d">La unidad de TCP. En UDP se llama datagrama.</td></tr>
      </tbody>
    </table>
  </div>

  <p>Por eso el campo <code>frame.len</code> mide la trama completa y <code>ip.len</code>
  solo el paquete IP: son números distintos y la diferencia son los 14 bytes de Ethernet.</p>

  <h3>Tráfico propio, tráfico ajeno y modo promiscuo</h3>

  <p>Una tarjeta de red normal descarta las tramas que no van dirigidas a su MAC. En
  <strong>modo promiscuo</strong> deja de descartarlas y entrega todo lo que oye. Suena
  potente, pero en una red moderna oye menos de lo que parece:</p>

  <ul>
    <li>En una red con <strong>switch</strong> (todas las cableadas de hoy), el switch
    envía cada trama solo al puerto de su destinatario. En modo promiscuo verás tu propio
    tráfico, el broadcast y el multicast — no las conversaciones de tus vecinos.</li>
    <li>En <strong>wifi</strong> hace falta además el <strong>modo monitor</strong>, que es
    otra cosa: captura tramas 802.11 en bruto del aire. Muchos controladores no lo
    soportan y al activarlo pierdes la conexión.</li>
    <li>Para ver tráfico de terceros de forma legítima se usa un <strong>port mirroring
    / SPAN</strong> configurado en el switch, o un TAP físico. Es una decisión de
    infraestructura, no una casilla de Wireshark.</li>
  </ul>

  <?= note('Lo que esto significa en la práctica',
      '<p>Si capturas en tu portátil, estás viendo <strong>el tráfico de tu portátil</strong>.
      Eso es exactamente lo que necesitas para aprender, y es lo que hacen todos los
      ejercicios de esta guía. Cuando en la parte de ciberseguridad se hable de
      «detectar un escaneo», se entiende un escaneo <em>dirigido a tu equipo</em> o una
      captura tomada donde corresponde.</p>', 'info') ?>

  <h3>Las cuatro limitaciones de cualquier captura</h3>

  <p>Tenlas presentes antes de sacar conclusiones de una investigación:</p>

  <ol>
    <li><strong>Punto de observación.</strong> Solo ves lo que pasa por donde capturas.
    Un mismo incidente se ve distinto desde el portátil, desde el router o desde el
    servidor.</li>
    <li><strong>Ventana temporal.</strong> Una captura de dos minutos no dice nada sobre
    un patrón que se repite cada hora.</li>
    <li><strong>Cifrado.</strong> Ves con quién se habla y cuánto, casi nunca qué se dice.</li>
    <li><strong>Pérdida.</strong> Si el equipo va justo de CPU o disco, <code>dumpcap</code>
    descarta tramas. El diálogo <strong>Statistics → Capture File Properties</strong> te
    dice cuántas se perdieron; si el número no es cero, tu captura está incompleta.</li>
  </ol>
</section>

<!-- ============================ INSTALAR ============================ -->
<section id="instalar">
  <h2>Instalar y entender los permisos</h2>
  <p class="tut-sub">Dos paquetes y un grupo de usuario. Y una lección de diseño seguro.</p>

  <p>Wireshark en Arch viene partido en dos: <code>wireshark-cli</code> trae el motor de
  captura y las herramientas de terminal, <code>wireshark-qt</code> añade la interfaz
  gráfica. Instalando el segundo entra el primero como dependencia.</p>

  <?= term('<span class="p">$</span> sudo pacman -S wireshark-qt') ?>

  <p>Capturar paquetes es una operación privilegiada: le estás pidiendo al kernel que te
  entregue tramas en crudo de la tarjeta de red. Ejecutar toda la GUI como root sería una
  mala idea (es un programa enorme que parsea datos hostiles de la red), así que Wireshark
  aísla esa parte en un binario diminuto, <code>dumpcap</code>, y da acceso solo a los
  miembros del grupo <code>wireshark</code>.</p>

  <?= term('<span class="p">$</span> sudo usermod -aG wireshark $USER') ?>

  <?= note('Importante',
      '<p>El grupo no se aplica hasta que vuelves a iniciar sesión. Cierra sesión y entra
      de nuevo, o reinicia. Comprueba con <code>id | grep wireshark</code> — si no aparece,
      todavía no ha entrado en vigor y Wireshark te mostrará la lista de interfaces vacía.</p>') ?>

  <p>Verifica que todo está en su sitio:</p>

  <?= term('<span class="p">$</span> tshark --version | head -1' . "\n"
         . '<span class="p">$</span> getcap /usr/bin/dumpcap' . "\n"
         . '<span class="c">/usr/bin/dumpcap cap_net_admin,cap_net_raw=ep</span>') ?>

  <p>Esas dos <em>capabilities</em> son exactamente los permisos mínimos:
  <code>cap_net_raw</code> para leer tramas crudas y <code>cap_net_admin</code> para poner
  la interfaz en modo promiscuo. Nada más.</p>

  <h3>Leer la salida de <code>getcap</code>, letra a letra</h3>

  <p>Las <em>capabilities</em> de Linux trocean el poder de root en permisos sueltos, para
  poder dar uno sin dar todos. La salida tiene forma <code>nombre=letras</code> y cada
  letra es un conjunto:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Conjuntos de capabilities en la salida de getcap</caption>
      <thead><tr><th scope="col">Letra</th><th scope="col">Conjunto</th><th scope="col">Significado</th></tr></thead>
      <tbody>
        <tr><td class="f">e</td><td class="d">effective</td><td class="d">Activa en cuanto arranca el proceso, sin que el programa tenga que pedirla.</td></tr>
        <tr><td class="f">p</td><td class="d">permitted</td><td class="d">El proceso tiene derecho a usarla.</td></tr>
        <tr><td class="f">i</td><td class="d">inheritable</td><td class="d">Se transmite a procesos hijos que también la tengan marcada.</td></tr>
      </tbody>
    </table>
  </div>

  <p>Así que <code>cap_net_admin,cap_net_raw=ep</code> se lee: «este binario puede leer
  tramas crudas y administrar la interfaz, y esos permisos están activos desde el
  arranque». Si tu salida incluye además <code>cap_dac_override</code> o termina en
  <code>=eip</code>, tu distribución ha sido algo más generosa; es habitual y no es un
  problema, pero ahora sabes leerlo.</p>

  <p>Comprueba también quién puede ejecutarlo:</p>

  <?= term('<span class="p">$</span> ls -l /usr/bin/dumpcap' . "\n"
         . '<span class="c">-rwxr-xr-- 1 root wireshark ... /usr/bin/dumpcap</span>') ?>

  <p>El último tramo de permisos es <code>---</code>: quien no sea root ni miembro del
  grupo <code>wireshark</code> ni siquiera puede ejecutarlo. Ese es el mecanismo completo.</p>

  <?= note('Por qué no ejecutar Wireshark como root',
      '<p>Un disector procesa datos que llegan de la red, es decir, datos que un tercero
      controla. Wireshark tiene millones de líneas de código de disección; históricamente
      han aparecido fallos explotables en algunos. Si la GUI corre como root, un fallo en
      un disector es un compromiso total del equipo. Con el diseño de arriba, lo único
      privilegiado son unos pocos miles de líneas de <code>dumpcap</code>, que no disecciona
      nada: solo copia bytes a un fichero.</p>') ?>

  <h3>Identificar la interfaz correcta</h3>

  <p>Capturar en la interfaz equivocada es el error número uno de quien empieza: la captura
  sale vacía y parece que Wireshark no funciona. Averigua primero cuál usas de verdad.</p>

  <?= term('<span class="p">$</span> ip addr') ?>

  <p>Busca la interfaz que tenga una dirección <code>inet</code> de tu red y la marca
  <code>state UP</code>. En este equipo es <code>wlan0</code> con <code>10.2.3.170/24</code>.
  El <code>/24</code> te dice además que tu red local va de <code>10.2.3.1</code> a
  <code>10.2.3.254</code>: cualquier IP fuera de ese rango sale por el router.</p>

  <?= term('<span class="p">$</span> ip link') ?>

  <p>Muestra lo mismo sin las direcciones IP, pero incluye la MAC (<code>link/ether</code>)
  y el estado físico del enlace. Es donde verías la marca <code>PROMISC</code> si una
  interfaz estuviera en modo promiscuo.</p>

  <?= term('<span class="p">$</span> ip route | head -1' . "\n"
         . '<span class="c">default via 10.2.3.1 dev wlan0</span>') ?>

  <p>Tu <strong>gateway</strong>. Apúntalo: aparecerá constantemente, porque todo lo que
  sale de tu red lleva su MAC como destino en la capa 2.</p>

  <p>Y la lista tal y como la ve Wireshark:</p>

  <?= term('<span class="p">$</span> tshark -D' . "\n"
         . '<span class="c">1. wlan0' . "\n"
         . '2. any' . "\n"
         . '3. lo (Loopback)' . "\n"
         . '4. enp8s0' . "\n"
         . '5. docker0 (Docker Bridge)</span>') ?>

  <p>Tres de esas merecen un comentario: <code>lo</code> es el tráfico que tu equipo se
  manda a sí mismo (útil para depurar un servidor local, invisible desde fuera);
  <code>any</code> es una pseudointerfaz que agrega todas a la vez, cómoda para no fallar
  al elegir pero sin cabecera Ethernet real; y <code>docker0</code> solo tiene tráfico si
  hay contenedores corriendo. Si <code>tshark -D</code> no lista ninguna interfaz real, el
  grupo todavía no está activo: vuelve al aviso de arriba.</p>
</section>

<!-- ============================ INTERFAZ ============================ -->
<section id="interfaz">
  <h2>La interfaz por dentro</h2>
  <p class="tut-sub">Un recorrido por el programa antes de empezar a capturar.</p>

  <h3>La pantalla de inicio</h3>

  <p>Al abrir Wireshark no hay ninguna captura: hay una <strong>lista de interfaces</strong>
  con una <em>sparkline</em> al lado de cada una. Esa gráfica en miniatura es tráfico en
  vivo, y es la forma más rápida de acertar con la interfaz: la que se mueve es la que
  está en uso. Doble clic sobre ella empieza a capturar.</p>

  <p>Debajo de la lista hay un campo etiquetado <strong>«…using this filter»</strong>: ahí
  va el <em>capture filter</em>, no el de visualización. Es una distinción que confunde a
  todo el mundo al principio y tiene su propia sección más abajo.</p>

  <h3>La barra de herramientas</h3>

  <p>De izquierda a derecha, los controles que vas a usar de verdad:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Controles principales de la barra de herramientas</caption>
      <thead><tr><th scope="col">Control</th><th scope="col">Qué hace</th></tr></thead>
      <tbody>
        <tr><td class="f">Aleta azul</td><td class="d">Iniciar captura en la interfaz seleccionada.</td></tr>
        <tr><td class="f">Cuadrado rojo</td><td class="d">Detener. La captura sigue en memoria y se puede analizar y guardar.</td></tr>
        <tr><td class="f">Flecha circular</td><td class="d">Reiniciar: descarta lo capturado y vuelve a empezar.</td></tr>
        <tr><td class="f">Lupa</td><td class="d">Buscar dentro de los paquetes (<kbd>Ctrl</kbd>+<kbd>F</kbd>), por cadena, hex o filtro.</td></tr>
        <tr><td class="f">Flechas ← →</td><td class="d">Ir al paquete anterior/siguiente del historial de navegación.</td></tr>
        <tr><td class="f">Regla / reloj</td><td class="d">Poner el tiempo a cero desde el paquete seleccionado. Imprescindible para medir intervalos.</td></tr>
        <tr><td class="f">Colores</td><td class="d">Activa o desactiva las reglas de coloreado.</td></tr>
      </tbody>
    </table>
  </div>

  <h3>La barra de estado</h3>

  <p>La franja de abajo se ignora y no debería. De izquierda a derecha lleva:</p>

  <ul>
    <li>Un <strong>círculo de color</strong> con el nivel máximo de Expert Information de la
    captura. Rojo es «error». Pulsarlo abre el diálogo directamente.</li>
    <li>El <strong>fichero</strong> de captura y su tamaño.</li>
    <li><strong>Packets</strong> (capturados), <strong>Displayed</strong> (los que pasan el
    filtro actual, con su porcentaje) y <strong>Dropped</strong>. Vigila ese último número.</li>
    <li>El <strong>perfil</strong> activo, a la derecha. Pulsar ahí cambia de perfil.</li>
  </ul>

  <h3>Preferences: lo que merece la pena tocar</h3>

  <p>En <strong>Edit → Preferences</strong>, tres ajustes cambian el día a día:</p>

  <ul>
    <li><strong>Appearance → Layout.</strong> Coloca los tres paneles. En pantallas anchas,
    poner Packet Details y Packet Bytes uno al lado del otro gana mucho espacio vertical.</li>
    <li><strong>Appearance → Columns.</strong> Las columnas de la lista; tiene sección
    propia más abajo.</li>
    <li><strong>Protocols.</strong> Un ajuste por disector. Aquí desactivarás los números de
    secuencia relativos de TCP y configurarás el descifrado de TLS.</li>
  </ul>

  <h3>Name Resolution: cómodo y peligroso a la vez</h3>

  <p>En <strong>View → Name Resolution</strong> puedes pedir que Wireshark traduzca lo que
  ve. Hay tres tipos y no son equivalentes:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Tipos de resolución de nombres</caption>
      <thead><tr><th scope="col">Tipo</th><th scope="col">Convierte</th><th scope="col">Cuidado</th></tr></thead>
      <tbody>
        <tr><td class="f">Physical</td><td class="d">MAC → fabricante (<code>b8:1e:a4</code> → el OUI del fabricante)</td><td class="d">Ninguno: es una tabla local.</td></tr>
        <tr><td class="f">Transport</td><td class="d">Puerto → servicio (443 → https)</td><td class="d">Es una convención, no un hecho: un servicio puede usar cualquier puerto.</td></tr>
        <tr><td class="f">Network</td><td class="d">IP → nombre de dominio</td><td class="d"><strong>Genera consultas DNS desde tu equipo.</strong></td></tr>
      </tbody>
    </table>
  </div>

  <?= note('Regla de análisis forense',
      '<p>Deja <strong>Network</strong> desactivado al analizar un incidente. Al activarlo,
      Wireshark resuelve por DNS las IP de la captura: contaminas tu propia captura si
      estás grabando, y —peor— avisas a la infraestructura del atacante de que alguien
      está investigando sus direcciones. Si necesitas nombres, sácalos del tráfico DNS que
      ya está <em>dentro</em> de la captura, que además es lo que realmente resolvió el
      equipo en su momento.</p>') ?>

  <h3>Dónde mirar en la pantalla de inicio</h3>

  <?= shot('wireshark/18-seleccion-interfaz.svg',
      'Pantalla de bienvenida de Wireshark con cuatro interfaces listadas: wlan0 con una '
      . 'gráfica de actividad muy movida, lo con actividad menor, enp3s0 plana y any.',
      '<b>Dónde mirar:</b> la columna de gráficas. La que se mueve es la interfaz por la '
      . 'que está pasando tu tráfico, y ese es el único criterio fiable — el nombre no lo es.') ?>

  <?= pitfall('<p>Elegir <code>any</code> «por si acaso». Captura por todas las interfaces
      a la vez, pero las tramas que entrega llevan una cabecera sintética de Linux en lugar
      de una Ethernet real. Los ejercicios de capa 2 —MAC, ARP, tipo de EtherType— dejan de
      salir y no entiendes por qué.</p>') ?>

</section>

<!-- ============================ LA VENTANA ========================== -->
<section id="ventana">
  <h2>Los tres paneles</h2>
  <p class="tut-sub">Siempre son los mismos tres, siempre significan lo mismo.</p>

  <dl class="panes">
    <div>
      <dt>Arriba · Packet List</dt>
      <dd>Una línea por paquete. <b>No.</b> orden de captura · <b>Time</b> segundos desde
      que empezaste · <b>Source</b> y <b>Destination</b> · <b>Protocol</b> el más alto que
      Wireshark supo reconocer · <b>Length</b> bytes totales · <b>Info</b> el resumen
      legible. Los colores vienen de reglas configurables: negro sobre rojo casi siempre
      significa problema.</dd>
    </div>
    <div>
      <dt>Medio · Packet Details</dt>
      <dd>El paquete seleccionado, desmontado en el árbol de capas de arriba. Cada rama se
      despliega. <b>Aquí es donde se aprende</b>: despliega TCP y verás los puertos, el
      número de secuencia, los flags, la ventana. Clic derecho sobre cualquier campo →
      <b>Apply as Filter</b> construye el filtro por ti.</dd>
    </div>
    <div>
      <dt>Abajo · Packet Bytes</dt>
      <dd>Los bytes reales en hexadecimal y ASCII. Al pinchar un campo del árbol, se
      resaltan sus bytes aquí. Es la prueba de que el árbol no se inventa nada: cada nombre
      bonito corresponde a una posición concreta.</dd>
    </div>
  </dl>

  <p>Para empezar una captura: doble clic en <code>wlan0</code> en la pantalla de inicio.
  La sparkline al lado de cada interfaz muestra actividad — así sabes cuál está viva antes
  de elegir. Para parar, el cuadrado rojo. Para descartar y volver a empezar, la escoba.</p>

  <h3>El puente entre el panel del medio y el de abajo</h3>

  <p>Esta correspondencia es el mejor ejercicio conceptual de todo Wireshark, porque
  demuestra que los nombres bonitos del árbol son solo una lectura de bytes concretos.
  Selecciona un paquete y mira dónde cae cada campo:</p>

  <figure class="bytemap">
    <div class="bytemap__row">
      <div class="bytemap__off">0x0000</div>
      <div class="bytemap__hex">
        <span class="b l2">b8 1e a4 5a ac 8d</span>
        <span class="b l2">2c 3a fd 11 04 e0</span>
        <span class="b l2">08 00</span>
        <span class="b l3">45 00</span>
      </div>
    </div>
    <div class="bytemap__row">
      <div class="bytemap__off">0x0010</div>
      <div class="bytemap__hex">
        <span class="b l3">00 54</span><span class="b l3">1a 2b</span><span class="b l3">40 00</span>
        <span class="b l3 hot">40</span><span class="b l3">01</span><span class="b l3">7c d9</span>
        <span class="b l3">0a 02 03 aa</span>
      </div>
    </div>
    <div class="bytemap__row">
      <div class="bytemap__off">0x0020</div>
      <div class="bytemap__hex">
        <span class="b l3">01 01 01 01</span>
        <span class="b l4">08 00</span><span class="b l4">c9 77</span>
      </div>
    </div>
    <figcaption>
      Los primeros 36 bytes de un <em>echo request</em>. Al pinchar <code>Time to Live</code>
      en el árbol, Wireshark resalta el byte marcado: <code>40</code> hexadecimal = 64.
    </figcaption>
  </figure>

  <ul class="encap__legend">
    <li><i class="l2" aria-hidden="true"></i>Ethernet: MAC destino, MAC origen, EtherType</li>
    <li><i class="l3" aria-hidden="true"></i>IPv4: versión, longitud, TTL, protocolo, IP origen y destino</li>
    <li><i class="l4" aria-hidden="true"></i>ICMP: tipo, código, identificador</li>
  </ul>

  <p>Compruébalo tú: pincha <code>Time to Live</code> y verás un solo byte resaltado abajo;
  pincha <code>Source Address</code> y se resaltan cuatro; pincha la rama
  <code>Internet Protocol Version 4</code> entera y se resaltan los veinte de la cabecera.
  El panel de bytes es la verdad; el árbol es su traducción.</p>

  <p>El menú <strong>View → Time Display Format</strong> cambia lo que significa la columna
  <b>Time</b>: segundos desde el inicio de la captura (por defecto), hora del día, o delta
  respecto al paquete anterior. El delta es el que usarás para medir periodicidad.</p>

  <h3>Los tres paneles, de un vistazo</h3>

  <?= shot('wireshark/01-tres-paneles.svg',
      'Ventana de Wireshark con la barra de filtro arriba y tres paneles apilados: '
      . 'Packet List, Packet Details y Packet Bytes, numerados del uno al tres.',
      '<b>Qué estás viendo:</b> la disposición que tendrá Wireshark siempre. '
      . '<b>Dónde mirar:</b> los tres bloques numerados — de arriba abajo se pasa del '
      . 'índice de la captura al paquete concreto, y de ahí a sus bytes.',
      'ilustrativo') ?>

  <?= callouts([
      ['Packet List', 'El índice. Una línea por paquete, en orden de captura. Aquí eliges; los otros dos paneles solo muestran lo que has elegido.'],
      ['Packet Details', 'El paquete seleccionado, desmontado capa por capa. Es donde se aprende de verdad.'],
      ['Packet Bytes', 'Los mismos datos sin traducir. Sirve para comprobar que el árbol no te está contando un cuento.'],
  ]) ?>

  <h3>Las siete columnas del Packet List</h3>

  <?= shot('wireshark/02-packet-list.svg',
      'Packet List con seis paquetes de una captura de loopback: dos ICMP, dos TCP y dos '
      . 'HTTP. Las columnas No., Time, Source, Destination, Protocol, Length e Info '
      . 'aparecen numeradas del uno al siete.',
      '<b>Qué estás viendo:</b> una captura real de este laboratorio — un <code>ping</code> '
      . 'y un <code>curl</code> contra el propio equipo. <b>Dónde mirar:</b> las columnas '
      . 'numeradas; cada una responde a una pregunta distinta.',
      'real') ?>

  <?= callouts([
      ['No.', 'El número de orden dentro de la captura. No viaja en el paquete: lo pone Wireshark. Sirve para referirte a un paquete concreto («mira la trama 7»).'],
      ['Time', 'Segundos desde que empezó la captura. Cámbialo en <b>View → Time Display Format</b>: la vista de delta respecto al paquete anterior es la que mide periodicidad.'],
      ['Source', 'Quién lo envía. En esta captura ambos extremos son <code>127.0.0.1</code> porque el equipo se habla a sí mismo.'],
      ['Destination', 'A quién va. En Source y Destination, Wireshark muestra la dirección de la capa más alta que entiende: normalmente IP, pero en ARP verás MAC.'],
      ['Protocol', 'El protocolo de nivel más alto que Wireshark ha sabido disecar. Que ponga <code>TCP</code> y no <code>HTTP</code> suele significar que ese paquete concreto no lleva datos de aplicación.'],
      ['Length', 'Bytes de la trama completa, cabecera Ethernet incluida. Por eso no coincide con <code>ip.len</code>.'],
      ['Info', 'Un resumen que escribe el disector. Es orientativo y riquísimo: los flags de TCP, el nombre consultado en DNS o el código de respuesta HTTP salen aquí sin desplegar nada.'],
  ]) ?>

  <h3>El árbol del Packet Details</h3>

  <?= shot('wireshark/03-packet-details.svg',
      'Árbol del Packet Details de la trama 7: Frame contiene Ethernet II, que contiene '
      . 'IPv4, que contiene TCP; el campo Flags 0x002 SYN aparece resaltado.',
      '<b>Qué estás viendo:</b> el paquete que abre una conexión TCP, desmontado. '
      . '<b>Dónde mirar:</b> la sangría. Cada nivel está <em>dentro</em> del anterior, y '
      . 'eso es literalmente cierto: son bytes contenidos en bytes.',
      'real') ?>

  <p>La rama <strong>Frame</strong> es la única que no viaja por el cable: son los
  metadatos que añade Wireshark —número, marca de tiempo, interfaz, longitud—. De
  <strong>Ethernet II</strong> hacia abajo, todo lo que ves estaba en los bytes.</p>

  <h3>El panel de bytes, y su relación con el árbol</h3>

  <?= shot('wireshark/04-packet-bytes.svg',
      'Volcado hexadecimal y ASCII de la trama 10; los bytes que forman la petición '
      . 'GET / HTTP/1.1 están resaltados a la vez en la columna hexadecimal y en la ASCII.',
      '<b>Qué estás viendo:</b> los mismos datos dos veces — en hexadecimal a la izquierda '
      . 'y como texto imprimible a la derecha. <b>Dónde mirar:</b> el resaltado verde: es '
      . 'el mismo tramo de bytes en las dos mitades.',
      'real') ?>

  <p>La relación con el árbol es directa y conviene comprobarla una vez con las manos:
  <strong>al seleccionar un campo en el Packet Details, sus bytes se resaltan aquí
  abajo</strong>. Pincha <code>Time to Live</code> y verás resaltarse un solo byte; pincha
  <code>Source Address</code> y se resaltan cuatro; pincha la rama
  <code>Internet Protocol Version 4</code> entera y se resaltan los veinte de la cabecera.</p>

  <?= evidence(
      '<p>En la zona ASCII se lee <code>GET / HTTP/1.1</code> y <code>Host: 127.0.0.1:8090</code>.</p>',
      '<p>Esa conexión transporta HTTP <strong>sin cifrar</strong>: el contenido es legible
      para cualquiera que esté en el camino.</p>',
      '<p>Que el servicio sea inseguro «en general». Es un servidor de laboratorio en la
      propia máquina y el tráfico no sale de ella. Lo que demuestra la captura es el
      formato del protocolo, no una exposición real.</p>') ?>

</section>

<!-- ========================== MODELO MENTAL ========================= -->
<section id="mental">
  <h2>Encapsulación: el modelo mental</h2>
  <p class="tut-sub">Un paquete es una cebolla. Wireshark la pela.</p>

  <p>Cuando tu navegador pide una página, ese dato no viaja solo: cada capa de la pila de
  red lo envuelve con su propia cabecera antes de pasarlo abajo. Lo que sale por la antena
  wifi es este bloque de bytes:</p>

  <figure class="encap">
    <div class="encap__row">
      <div class="l2"><span class="encap__k">Ethernet</span><span class="encap__b">14 bytes</span></div>
      <div class="l3"><span class="encap__k">IPv4</span><span class="encap__b">20 bytes</span></div>
      <div class="l4"><span class="encap__k">TCP</span><span class="encap__b">20+ bytes</span></div>
      <div class="l7"><span class="encap__k">HTTP · datos</span><span class="encap__b">lo que realmente querías</span></div>
    </div>
    <figcaption class="visually-hidden">
      Diagrama de encapsulado: la cabecera Ethernet de 14 bytes envuelve la cabecera IPv4
      de 20 bytes, que envuelve la cabecera TCP de 20 o más bytes, que envuelve los datos
      HTTP.
    </figcaption>
    <ul class="encap__legend">
      <li><i class="l2" aria-hidden="true"></i>MAC origen y destino — el salto físico</li>
      <li><i class="l3" aria-hidden="true"></i>IP origen y destino — la ruta global</li>
      <li><i class="l4" aria-hidden="true"></i>Puertos, secuencia, flags — la conversación</li>
      <li><i class="l7" aria-hidden="true"></i>El contenido</li>
    </ul>
  </figure>

  <p>Cada capa solo sabe de la siguiente. Ethernet entrega la trama al router de al lado;
  IP sabe llevarla hasta el otro extremo del mundo; TCP se encarga de que llegue completa
  y en orden; HTTP es el idioma que hablan los dos programas. Wireshark hace una cosa:
  coge esos bytes y te los desmonta capa por capa, con nombres.</p>

  <p>Y algo que conviene tener claro desde el principio: <strong>Wireshark no toca
  nada</strong>. No bloquea, no modifica, no inyecta. Es un microscopio, no un cortafuegos.
  Si algo va mal en tu red, Wireshark te dice qué está pasando, pero arreglarlo es otra
  herramienta.</p>

  <h3>Dónde encaja cada protocolo</h3>

  <p>El modelo OSI tiene siete capas y el de TCP/IP cuatro. Wireshark no dibuja ninguno de
  los dos: dibuja lo que hay realmente en la trama. Esta tabla traduce entre ambos mundos y
  te dice qué escribir en la barra de filtros para quedarte con cada nivel:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Correspondencia entre capas, protocolos y filtros</caption>
      <thead><tr><th scope="col">OSI</th><th scope="col">TCP/IP</th><th scope="col">Protocolos</th><th scope="col">Filtro</th></tr></thead>
      <tbody>
        <tr><td class="d">7–5 Aplicación</td><td class="d">Aplicación</td><td class="d">HTTP, DNS, DHCP, TLS</td><td class="f">http · dns · dhcp · tls</td></tr>
        <tr><td class="d">4 Transporte</td><td class="d">Transporte</td><td class="d">TCP, UDP</td><td class="f">tcp · udp</td></tr>
        <tr><td class="d">3 Red</td><td class="d">Internet</td><td class="d">IPv4, IPv6, ICMP</td><td class="f">ip · ipv6 · icmp</td></tr>
        <tr><td class="d">2 Enlace</td><td class="d">Acceso a red</td><td class="d">Ethernet, ARP</td><td class="f">eth · arp</td></tr>
        <tr><td class="d">1 Física</td><td class="d">Acceso a red</td><td class="d">Cable, radio</td><td class="d">No se captura</td></tr>
      </tbody>
    </table>
  </div>

  <p>Dos detalles que rompen la simetría del dibujo y conviene saber: <strong>ARP no tiene
  cabecera IP</strong> —vive entre la capa 2 y la 3, y por eso no se puede filtrar por
  <code>ip.addr</code>—; y <strong>TLS no es una capa OSI</strong>, sino una envoltura que
  se coloca entre TCP y la aplicación, que es exactamente como Wireshark lo muestra en el
  árbol.</p>

  <?= note('El truco de leer el árbol de abajo arriba',
      '<p>Cuando no entiendas un paquete, léelo desde la capa más baja: «esto sale de mi
      MAC hacia la del router» → «va a la IP 1.1.1.1» → «es TCP al puerto 443» → «es un
      Client Hello de TLS». En cuatro frases has descrito el paquete entero. Este es el
      hábito que separa a quien mira paquetes de quien los entiende.</p>', 'info') ?>

  <h3>La misma idea, en una sola imagen</h3>

  <?= shot('wireshark/12-encapsulacion.svg',
      'Cuatro rectángulos anidados: Ethernet II de 14 bytes contiene IPv4 de 20, que '
      . 'contiene TCP de 32, que contiene 78 bytes de HTTP con la petición GET.',
      '<b>Qué estás viendo:</b> una trama real de 144 bytes de este laboratorio. '
      . '<b>Dónde mirar:</b> los tamaños. 14 + 20 + 32 + 78 = 144, exactamente lo que '
      . 'dice la columna <b>Length</b> del Packet List.',
      'real') ?>

  <?= pitfall('<p>Creer que las capas son «niveles de abstracción» y ya está. No lo son:
      son <strong>bytes físicamente contenidos en otros bytes</strong>. Por eso
      <code>frame.len</code> y <code>ip.len</code> dan números distintos, y por eso al
      seleccionar la rama IPv4 se resalta un tramo del volcado hexadecimal y no otro.</p>') ?>

</section>

<!-- ============================= FILTROS ============================ -->
<section id="filtros">
  <h2>Filtros: la distinción que hay que interiorizar</h2>
  <p class="tut-sub">Hay dos tipos de filtro y no se parecen en nada.</p>

  <p>Este es el punto donde más gente se atasca. Wireshark tiene <strong>dos sistemas de
  filtrado distintos, con sintaxis distintas, en momentos distintos</strong>.</p>

  <h4>Capture filter — antes de capturar</h4>
  <p>Se escribe en la pantalla de inicio, debajo de la lista de interfaces. Decide qué
  paquetes se guardan y cuáles se tiran a la basura sin mirarlos. Usa sintaxis BPF, la
  misma de <code>tcpdump</code>: <code>host 1.1.1.1</code>, <code>port 53</code>,
  <code>tcp and not port 22</code>. Lo que descartas aquí, lo pierdes para siempre. Se usa
  cuando el volumen es tan alto que capturarlo todo no es viable.</p>

  <h4>Display filter — después de capturar</h4>
  <p>La barra verde ancha en la parte superior de la ventana principal. Filtra la
  <em>vista</em>; los paquetes ocultos siguen ahí y vuelven en cuanto borras el filtro.
  Sintaxis propia de Wireshark, mucho más rica: <code>ip.addr == 1.1.1.1</code>,
  <code>dns</code>, <code>tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0</code>.</p>

  <?= note('Regla práctica',
      '<p>Salvo que estés capturando en un enlace saturado, <strong>captura todo y filtra
      en la vista</strong>. El display filter es el que vas a usar el 95 % del tiempo, y es
      el que enseñan los nueve ejercicios de abajo. La barra se pone verde si la sintaxis
      es válida y roja si no.</p>', 'info') ?>

  <p>Dos detalles de sintaxis que ahorran confusión: <code>ip.addr == X</code> significa
  «origen <em>o</em> destino es X», mientras que <code>ip.src</code> e <code>ip.dst</code>
  son direccionales. Y escribir solo el nombre de un protocolo (<code>dns</code>,
  <code>tls</code>, <code>arp</code>) filtra todos los paquetes que lo contienen — es el
  filtro más útil y más corto que existe.</p>

  <h3>Comparación lado a lado</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Capture filter frente a display filter</caption>
      <thead><tr><th scope="col"></th><th scope="col">Capture filter</th><th scope="col">Display filter</th></tr></thead>
      <tbody>
        <tr><td class="f">Cuándo</td><td class="d">Antes de capturar</td><td class="d">Sobre lo ya capturado</td></tr>
        <tr><td class="f">Dónde</td><td class="d">Pantalla de inicio, bajo las interfaces</td><td class="d">Barra ancha superior</td></tr>
        <tr><td class="f">Sintaxis</td><td class="d">BPF, la de <code>tcpdump</code></td><td class="d">Propia de Wireshark</td></tr>
        <tr><td class="f">Reversible</td><td class="d">No: lo descartado se pierde</td><td class="d">Sí: borras el filtro y vuelve todo</td></tr>
        <tr><td class="f">Campos</td><td class="d">Pocos, de bajo nivel</td><td class="d">Más de 300 000 campos</td></tr>
        <tr><td class="f">Igualdad</td><td class="d"><code>host 10.2.3.1</code></td><td class="d"><code>ip.addr == 10.2.3.1</code></td></tr>
        <tr><td class="f">Puerto</td><td class="d"><code>port 53</code></td><td class="d"><code>tcp.port == 53 || udp.port == 53</code></td></tr>
        <tr><td class="f">Negación</td><td class="d"><code>not arp</code></td><td class="d"><code>!arp</code></td></tr>
        <tr><td class="f">Conjunción</td><td class="d"><code>tcp and port 443</code></td><td class="d"><code>tcp &amp;&amp; tcp.port == 443</code></td></tr>
        <tr><td class="f">Para qué</td><td class="d">Contener el volumen en enlaces cargados</td><td class="d">Investigar</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('El error clásico',
      '<p>Escribir <code>ip.addr == 10.2.3.1</code> en el campo de la pantalla de inicio.
      Wireshark lo rechaza y el principiante concluye que «el filtro no funciona». No es el
      filtro: es el campo. En la pantalla de inicio va sintaxis BPF (<code>host
      10.2.3.1</code>); en la barra de arriba va la de Wireshark. Fíjate en el color: la
      barra de display filter se pone <strong>verde</strong> con sintaxis válida y
      <strong>roja</strong> con inválida, y te lo dice mientras escribes.</p>') ?>

  <h3>Los dos filtros, uno al lado del otro</h3>

  <?= shot('wireshark/07-capture-vs-display.svg',
      'Comparación en dos columnas: el filtro de captura descarta tramas antes de '
      . 'escribirlas en el fichero; el de visualización las guarda todas y solo esconde '
      . 'las que no coinciden.',
      '<b>Dónde mirar:</b> qué llega al fichero <code>.pcapng</code> en cada caso. Es la '
      . 'diferencia entera entre los dos filtros, y explica por qué uno se puede deshacer '
      . 'y el otro no.') ?>

  <?= compare(
      ['Capture filter', 'Sintaxis BPF · se decide antes de capturar',
       '<ul>
          <li>Se escribe en la pantalla de inicio, bajo <em>«…using this filter»</em>.</li>
          <li>Lo que no coincide <strong>no se guarda</strong>.</li>
          <li>Sintaxis distinta: <code>host</code>, <code>port</code>, <code>net</code>, <code>and</code>, <code>not</code>.</li>
          <li>Se usa cuando el volumen sería inmanejable, o cuando por política no debes grabar cierto tráfico.</li>
        </ul>'],
      ['Display filter', 'Sintaxis de Wireshark · se decide después',
       '<ul>
          <li>Se escribe en la barra verde, sobre el Packet List.</li>
          <li>Lo que no coincide <strong>sigue en el fichero</strong>, solo se oculta.</li>
          <li>Sintaxis de campos: <code>ip.addr</code>, <code>tcp.port</code>, <code>==</code>, <code>&amp;&amp;</code>.</li>
          <li>Es el que usarás el 99 % del tiempo.</li>
        </ul>'],
      'Regla práctica: <strong>captura ancho, filtra estrecho.</strong> Lo que no capturaste
       no lo puedes recuperar; lo que filtraste de más se deshace borrando el filtro.') ?>

</section>

<!-- ======================== DISPLAY FILTERS ========================= -->
<section id="display-filters">
  <h2>El lenguaje de los display filters</h2>
  <p class="tut-sub">Construir un filtro por capas en lugar de memorizarlo.</p>

  <p>Un display filter es una expresión que se evalúa contra cada paquete: si da verdadero,
  el paquete se muestra. Hay tres formas de construirla, de menor a mayor precisión.</p>

  <h3>Nivel 1 · Solo el nombre del protocolo</h3>

  <p>Escribir el nombre de un protocolo es un filtro completo: significa «este paquete
  contiene ese protocolo en alguna capa».</p>

  <?= filter_chip('dns') ?>

  <h3>Nivel 2 · Un campo comparado con un valor</h3>

  <p>La forma <code>campo operador valor</code>. Los operadores de comparación:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Operadores de comparación</caption>
      <thead><tr><th scope="col">Operador</th><th scope="col">Alias</th><th scope="col">Significado</th><th scope="col">Ejemplo</th></tr></thead>
      <tbody>
        <tr><td class="f">==</td><td class="f">eq</td><td class="d">Igual</td><td class="f">ip.src == 10.2.3.170</td></tr>
        <tr><td class="f">!=</td><td class="f">ne</td><td class="d">Distinto</td><td class="f">tcp.dstport != 443</td></tr>
        <tr><td class="f">&gt;</td><td class="f">gt</td><td class="d">Mayor que</td><td class="f">frame.len &gt; 1400</td></tr>
        <tr><td class="f">&lt;</td><td class="f">lt</td><td class="d">Menor que</td><td class="f">ip.ttl &lt; 10</td></tr>
        <tr><td class="f">&gt;=</td><td class="f">ge</td><td class="d">Mayor o igual</td><td class="f">http.response.code &gt;= 400</td></tr>
        <tr><td class="f">&lt;=</td><td class="f">le</td><td class="d">Menor o igual</td><td class="f">tcp.window_size_value &lt;= 1000</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Nivel 3 · Combinar condiciones</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Operadores lógicos</caption>
      <thead><tr><th scope="col">Operador</th><th scope="col">Alias</th><th scope="col">Significado</th></tr></thead>
      <tbody>
        <tr><td class="f">&amp;&amp;</td><td class="f">and</td><td class="d">Se cumplen las dos condiciones</td></tr>
        <tr><td class="f">||</td><td class="f">or</td><td class="d">Se cumple al menos una</td></tr>
        <tr><td class="f">!</td><td class="f">not</td><td class="d">Niega la condición</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Operadores de contenido</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Operadores de contenido y pertenencia</caption>
      <thead><tr><th scope="col">Operador</th><th scope="col">Qué hace</th><th scope="col">Ejemplo</th></tr></thead>
      <tbody>
        <tr><td class="f">contains</td><td class="d">Busca una secuencia de bytes o texto dentro del campo. Distingue mayúsculas.</td><td class="f">dns.qry.name contains "example"</td></tr>
        <tr><td class="f">matches</td><td class="d">Expresión regular PCRE. Antepón <code>(?i)</code> para ignorar mayúsculas.</td><td class="f">http.host matches "(?i)cdn"</td></tr>
        <tr><td class="f">in</td><td class="d">Pertenencia a un conjunto. <strong>Los elementos van separados por comas.</strong></td><td class="f">tcp.port in {80, 443, 8080}</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('Cuidado con la sintaxis de «in»',
      '<p>Muchos apuntes y respuestas antiguas escriben <code>tcp.port in {80 443 8080}</code>,
      con espacios. Esa forma era válida en Wireshark 3.x y <strong>ya no lo es</strong>: en
      4.x hay que separar con comas. Lo puedes comprobar sin abrir Wireshark, con la
      herramienta oficial de validación de filtros:</p>') ?>

  <?= term('<span class="p">$</span> dftest \'tcp.port in {80, 443, 8080}\'   <span class="c"># válido</span>' . "\n"
         . '<span class="p">$</span> dftest \'tcp.port in {80 443 8080}\'     <span class="c"># error de sintaxis</span>') ?>

  <p>Otro conjunto útil es el rango, con dos puntos suspensivos: <code>ip.ttl in {1 .. 5}</code>
  selecciona los TTL del 1 al 5, que es lo que verías en un <em>traceroute</em>.</p>

  <h3>Construir un filtro por capas</h3>

  <p>No escribas el filtro completo de una vez. Empieza ancho y ve estrechando, mirando
  cuántos paquetes quedan en <b>Displayed</b> después de cada paso:</p>

  <?= steps([
      'Todo lo que tenga que ver con ese equipo: <code>ip.addr == 10.2.3.170</code>',
      'Solo lo que <em>sale</em> de él: <code>ip.src == 10.2.3.170</code>',
      'Solo TCP: <code>ip.src == 10.2.3.170 &amp;&amp; tcp</code>',
      'Solo HTTPS: <code>ip.src == 10.2.3.170 &amp;&amp; tcp.port == 443</code>',
      'Solo aperturas de conexión: <code>ip.src == 10.2.3.170 &amp;&amp; tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0</code>',
  ]) ?>

  <p>Si en un paso el resultado se queda vacío, sabes exactamente qué condición lo vació.
  Depurar un filtro de cinco condiciones escrito de golpe es mucho más difícil.</p>

  <h3>El atajo que hace innecesario memorizar campos</h3>

  <p>Nadie recuerda que el nombre del servidor en TLS es
  <code>tls.handshake.extensions_server_name</code>. No hace falta: <strong>clic derecho
  sobre el campo en el árbol → Apply as Filter → Selected</strong>. Wireshark escribe el
  filtro correcto en la barra. Así es como se aprenden los nombres de los campos —
  trabajando, no estudiando una lista.</p>

  <p>Variantes del mismo menú que conviene conocer:</p>

  <ul>
    <li><strong>Prepare as Filter</strong> escribe el filtro en la barra pero
    <em>no lo aplica</em>: sirve para seguir editándolo antes de pulsar Intro.</li>
    <li><strong>…and Selected</strong> / <strong>…or Selected</strong> añade la condición
    al filtro que ya tenías, en vez de sustituirlo.</li>
    <li><strong>…not Selected</strong> lo añade negado. Es la forma rápida de ir quitando
    ruido: aplica, ves lo que sobra, lo excluyes, repites.</li>
  </ul>

  <p>Y el botón <strong>+</strong> al final de la barra guarda el filtro actual como botón
  con nombre. Si repites un filtro cada día, déjalo ahí.</p>

  <h3>Un filtro, paso a paso</h3>

  <p><strong>Qué queremos encontrar:</strong> solo el tráfico ICMP de una captura que
  también tiene TCP y HTTP.</p>

  <p><strong>Qué escribimos</strong> en la barra de filtro:</p>

  <?= filter_chip('icmp') ?>

  <p><strong>Qué ocurre:</strong> Wireshark recorre los paquetes ya capturados y deja
  visibles únicamente aquellos en los que su disector reconoció ICMP.</p>

  <?= shot('wireshark/06-filtro-antes-despues.svg',
      'A la izquierda la lista completa con paquetes ICMP, TCP y HTTP; a la derecha, tras '
      . 'escribir icmp en la barra de filtro, solo quedan visibles los dos paquetes ICMP.',
      '<b>Dónde mirar:</b> el contador de abajo. Los paquetes que desaparecen '
      . '<strong>no se han borrado</strong>: siguen en el fichero y vuelven en cuanto '
      . 'vacías la barra.',
      'real') ?>

  <?= pitfall('<p>Escribir el filtro en la barra equivocada. Si pones <code>icmp</code> en
      el campo de la pantalla de inicio, eso es un <em>capture filter</em> y BPF no entiende
      esa sintaxis igual. Y al revés: un <code>host 1.1.1.1</code> escrito en la barra verde
      no es un display filter válido. Wireshark lo avisa con el color de fondo — verde si la
      expresión es válida, rojo si no.</p>') ?>

  <?= recap('Fundamentos', [
      'Wireshark hace dos cosas independientes: <strong>capturar</strong> (privilegiada) y <strong>analizar</strong> (no lo es).',
      'Solo ves lo que pasa por la interfaz donde capturas. En una red con switch, eso es casi siempre tu propio tráfico.',
      'La ventana son siempre los mismos tres paneles: lista, árbol y bytes. Seleccionar en uno mueve los otros dos.',
      'Un paquete es bytes dentro de bytes: el árbol del Packet Details es esa anidación, no una metáfora.',
      'Hay dos filtros y no son intercambiables: el de captura decide qué se guarda, el de visualización qué se enseña.',
  ], [
      'ip addr · ip route | head -1',
      'tshark -D',
      'icmp · dns · tcp',
      'ip.addr == 10.2.3.170',
  ], [
      'La columna <b>Length</b> mide la trama entera, cabecera Ethernet incluida.',
      'Un fondo rojo en la barra de filtro significa expresión inválida, no «peligro».',
      'Que la columna <b>Protocol</b> diga <code>TCP</code> en vez de <code>HTTP</code> suele indicar que ese paquete no lleva datos de aplicación.',
  ]) ?>

  <?= quiz([
      [
          'q' => 'En el Packet List, ¿qué representa la columna Source?',
          'opts' => ['A' => 'El puerto de destino', 'B' => 'El origen del paquete', 'C' => 'La longitud de la trama', 'D' => 'El protocolo detectado'],
          'ok' => 'B',
          'why' => 'Es la dirección de quien envía, en la capa más alta que Wireshark sabe leer: normalmente IP, pero en un paquete ARP verás la dirección MAC, porque ARP no llega a tener capa de red.',
      ],
      [
          'q' => 'Aplicas el filtro dns y de 4 000 paquetes quedan 12 visibles. ¿Qué ha pasado con los otros 3 988?',
          'opts' => ['A' => 'Se han borrado del fichero', 'B' => 'Siguen en el fichero, solo están ocultos', 'C' => 'Nunca se capturaron', 'D' => 'Se han movido a otra pestaña'],
          'ok' => 'B',
          'why' => 'Un display filter no toca el fichero: decide qué se pinta. Vacía la barra y vuelven los 4 000. Lo que sí habría hecho desaparecer paquetes de verdad es un <em>capture filter</em>, porque actúa antes de escribir en disco.',
      ],
      [
          'q' => 'Estás capturando en un portátil conectado a un switch, en modo promiscuo. ¿Qué verás del tráfico de tu vecino de escritorio?',
          'opts' => ['A' => 'Todo su tráfico', 'B' => 'Solo su tráfico sin cifrar', 'C' => 'Prácticamente nada: broadcast y multicast', 'D' => 'Solo sus consultas DNS'],
          'ok' => 'C',
          'why' => 'El switch envía cada trama únicamente al puerto de su destinatario, así que el modo promiscuo no cambia gran cosa: tu tarjeta no llega a oír esas tramas. Ver tráfico ajeno de forma legítima exige un port mirroring o un TAP configurados en la infraestructura.',
      ],
      [
          'q' => 'En el Packet Details seleccionas el campo Time to Live. ¿Qué ocurre en el panel de bytes?',
          'opts' => ['A' => 'No ocurre nada', 'B' => 'Se resalta un byte', 'C' => 'Se resaltan cuatro bytes', 'D' => 'Se resalta la cabecera IP entera'],
          'ok' => 'B',
          'why' => 'El TTL ocupa exactamente un octeto. Ese vínculo campo↔bytes es la mejor comprobación de que el árbol es una traducción fiel: si dudas de lo que dice un disector, selecciona el campo y mira los bytes.',
      ],
  ]) ?>

</section>

<?= chapter('02', 'Protocolos', 'Capa por capa, de la MAC al TLS: qué campos importan, cómo se filtran y qué revelan.', 'protocolos') ?>

<!-- ============================ ETHERNET ============================ -->
<section id="ethernet">
  <h2>Ethernet</h2>
  <p class="tut-sub">La capa 2: catorce bytes que deciden el siguiente salto.</p>

  <p><strong>Qué es.</strong> Ethernet mueve tramas entre dos equipos <em>del mismo
  segmento de red</em>. No sabe nada de internet ni de rutas: solo «entrega esto a la
  tarjeta cuya dirección física es esta».</p>

  <p><strong>Cómo funciona.</strong> Su cabecera son 14 bytes con tres campos:</p>

  <figure class="hdr">
    <div class="hdr__row">
      <div class="hdr__f l2" style="flex:6"><b>MAC destino</b><span>6 bytes</span></div>
      <div class="hdr__f l2" style="flex:6"><b>MAC origen</b><span>6 bytes</span></div>
      <div class="hdr__f l2" style="flex:2"><b>EtherType</b><span>2 bytes</span></div>
    </div>
    <figcaption>Cabecera Ethernet II. Después viene directamente el paquete de la capa superior.</figcaption>
  </figure>

  <p>Una dirección MAC son 6 bytes, escritos como <code>b8:1e:a4:5a:ac:8d</code>. Los tres
  primeros son el <strong>OUI</strong>, el identificador del fabricante: Wireshark lo
  traduce solo, y por eso en la columna a veces ves <code>IntelCor_5a:ac:8d</code> en lugar
  del hexadecimal. Es información real y gratuita: te dice qué clase de dispositivo hay
  detrás de una MAC.</p>

  <p>El <strong>EtherType</strong> dice qué viene después. Los tres que verás:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Valores de EtherType habituales</caption>
      <thead><tr><th scope="col">Valor</th><th scope="col">Contenido</th><th scope="col">Filtro</th></tr></thead>
      <tbody>
        <tr><td class="f">0x0800</td><td class="d">IPv4</td><td class="f">eth.type == 0x0800</td></tr>
        <tr><td class="f">0x0806</td><td class="d">ARP</td><td class="f">eth.type == 0x0806</td></tr>
        <tr><td class="f">0x86dd</td><td class="d">IPv6</td><td class="f">eth.type == 0x86dd</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Unicast, broadcast y multicast</h3>

  <p>La MAC de destino determina quién recoge la trama, y el <strong>bit menos
  significativo del primer byte</strong> lo decide:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Tipos de destino Ethernet</caption>
      <thead><tr><th scope="col">Tipo</th><th scope="col">Destino</th><th scope="col">Quién la recibe</th></tr></thead>
      <tbody>
        <tr><td class="f">Unicast</td><td class="d">Una MAC concreta</td><td class="d">Un solo equipo. Es la inmensa mayoría del tráfico.</td></tr>
        <tr><td class="f">Broadcast</td><td class="d"><code>ff:ff:ff:ff:ff:ff</code></td><td class="d">Todos los equipos del segmento. ARP y DHCP lo usan.</td></tr>
        <tr><td class="f">Multicast</td><td class="d">Primer byte impar (p. ej. <code>01:00:5e:…</code>)</td><td class="d">Los que se han suscrito a ese grupo. mDNS, SSDP, IPv6.</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Cómo lo veo en Wireshark</h3>

  <p>Despliega la rama <strong>Ethernet II</strong> del panel del medio. Dentro de
  <code>Destination</code> hay dos subcampos que Wireshark calcula por ti:
  <code>LG bit</code> (dirección local o global) e <code>IG bit</code> (individual o de
  grupo). Ese <code>IG bit</code> a 1 es precisamente la definición de multicast/broadcast.</p>

  <h3>Filtros</h3>

  <?= filter_chip('eth.addr == b8:1e:a4:5a:ac:8d') ?>
  <p>Todo lo que sale o entra en esa tarjeta. Útil cuando investigas un equipo cuya IP
  cambia (DHCP) pero cuya MAC no.</p>

  <?= filter_chip('eth.src == b8:1e:a4:5a:ac:8d') ?>
  <p>Solo lo que ese equipo <em>emite</em>. Con <code>eth.dst</code>, solo lo que recibe.</p>

  <?= filter_chip('eth.dst == ff:ff:ff:ff:ff:ff') ?>
  <p>Todo el broadcast del segmento: ARP, DHCP, anuncios de servicios. Es un buen primer
  vistazo a «quién hay» en una red desconocida, porque los equipos se anuncian solos.</p>

  <?= filter_chip('eth.ig == 1') ?>
  <p>Broadcast y multicast a la vez. Si el tráfico de grupo se dispara sin motivo, aquí se
  ve.</p>

  <?= note('Por qué la MAC de destino no es la del servidor',
      '<p>Al hacer ping a <code>1.1.1.1</code>, la MAC de destino de la trama es la de
      <em>tu router</em>, no la de Cloudflare. Ethernet solo llega hasta el siguiente salto:
      el router quita esa cabecera, pone una nueva con la MAC del siguiente y reenvía. La
      cabecera IP sobrevive todo el camino; la Ethernet se reescribe en cada tramo. Si
      entiendes esto, entiendes la diferencia entre capa 2 y capa 3.</p>', 'info') ?>

  <p><strong>Error común.</strong> Buscar la MAC de un servidor de internet en la captura.
  Nunca aparecerá: solo ves las MAC de tu propio segmento.</p>
</section>

<!-- ============================== ARP =============================== -->
<span id="e2" class="legacy-anchor" aria-hidden="true"></span>
<section id="arp">
  <h2>ARP</h2>
  <p class="tut-sub">Cómo encuentra tu equipo al router — y por qué es el protocolo más fácil de abusar.</p>
  <p class="tut-goal">Objetivo: ver la capa 2 en acción, por debajo de IP.</p>

  <p>En el apartado anterior tu equipo puso la MAC del router en la trama. ¿Cómo la sabía?
  La preguntó a gritos. Filtra:</p>

  <?= filter_chip('arp') ?>

  <p>Fuerza uno borrando la entrada de la tabla y volviendo a hablar con el router:</p>

  <?= term('<span class="p">$</span> sudo ip neigh flush all' . "\n"
         . '<span class="p">$</span> ping -c 2 10.2.3.1') ?>

  <p>Verás el par clásico. El primero va a destino <code>ff:ff:ff:ff:ff:ff</code> —
  broadcast, lo recibe <em>toda</em> la red local — y su Info dice <strong>Who has
  10.2.3.1? Tell 10.2.3.170</strong>. El segundo es la respuesta directa:
  <strong>10.2.3.1 is at ...</strong>.</p>

  <p>ARP no tiene cabecera IP. Es capa 2 pura: solo funciona dentro de tu red local, y por
  eso no hay ARP para <code>1.1.1.1</code> — para salir de la red, todo va al router y él
  se encarga.</p>

  <h3>Los dos mensajes, y cómo separarlos</h3>

  <p>El campo <code>arp.opcode</code> distingue la pregunta de la respuesta:</p>

  <?= filter_chip('arp.opcode == 1') ?>
  <p><strong>Request.</strong> Va en broadcast porque el emisor todavía no sabe a quién
  preguntar. El campo «Target MAC address» va a ceros: es justo lo que está preguntando.</p>

  <?= filter_chip('arp.opcode == 2') ?>
  <p><strong>Reply.</strong> Va en unicast, directo al que preguntó. Lleva la MAC en
  <code>arp.src.hw_mac</code>.</p>

  <h3>La caché ARP</h3>

  <p>El resultado se guarda unos minutos para no preguntar cada vez. Puedes verla:</p>

  <?= term('<span class="p">$</span> ip neigh' . "\n"
         . '<span class="c">10.2.3.1 dev wlan0 lladdr 2c:3a:fd:11:04:e0 REACHABLE</span>') ?>

  <p>Esa tabla es la que un atacante intenta envenenar, y por eso ARP importa en seguridad.</p>

  <h3 class="ciber-head">Ciberseguridad: reconocer ARP anómalo</h3>

  <p>ARP se diseñó en 1982 sin ninguna autenticación: <strong>cualquier equipo puede
  responder a cualquier pregunta</strong>, y el que pregunta se cree la respuesta. Un
  atacante en el mismo segmento puede afirmar «10.2.3.1 soy yo» y hacer que tu tráfico
  pase por su máquina. Eso se llama <em>ARP spoofing</em> o <em>poisoning</em>.</p>

  <p>No vas a aprender a hacerlo aquí. Vas a aprender <strong>qué rastro deja</strong>,
  que es lo que te sirve como defensor:</p>

  <ul>
    <li><strong>Dos MAC distintas afirmando ser la misma IP.</strong> Es la señal más
    directa. En una red sana, cada IP tiene una sola MAC.</li>
    <li><strong>Replies sin request previo</strong> (ARP «gratuito» en exceso). Uno
    ocasional es normal —los equipos lo usan al arrancar para anunciarse—; un goteo
    constante hacia un mismo objetivo, no.</li>
    <li><strong>La MAC del gateway cambia</strong> a mitad de la captura. El gateway es el
    objetivo preferido porque por él pasa todo.</li>
    <li><strong>Frecuencia anormal.</strong> El envenenamiento hay que refrescarlo antes de
    que caduque la caché legítima, así que suele verse un ritmo regular.</li>
  </ul>

  <p>Wireshark trae un detector para el primer caso, y es el filtro que deberías conocer:</p>

  <?= filter_chip('arp.duplicate-address-detected') ?>

  <p>Marca los paquetes donde el disector ha visto que una IP cambia de MAC. Junto a él,
  <code>arp.duplicate-address-frame</code> apunta al número de trama del conflicto anterior,
  para poder comparar los dos.</p>

  <?= note('Un positivo no es una conclusión',
      '<p><code>arp.duplicate-address-detected</code> también salta en situaciones
      completamente legítimas: un portátil que pasa de cable a wifi conservando la IP, un
      par de routers en alta disponibilidad (VRRP/HSRP) que comparten una IP virtual, una
      máquina virtual migrada, o dos equipos mal configurados con la misma IP por error.
      El filtro te dice <em>dónde mirar</em>. Lo que decide es el contexto: ¿esa MAC nueva
      tiene un fabricante coherente? ¿aparece a la hora en que alguien se conectó?
      ¿el cambio persiste o fue un instante?</p>') ?>

  <p><strong>Práctica.</strong> Aplica <code>arp</code> a una captura de diez minutos de tu
  red y abre <strong>Statistics → Endpoints → Ethernet</strong>. Anota qué MAC corresponde a
  tu gateway. Esa es tu línea base: si otro día no coincide, tienes algo que investigar.</p>

  <h3>La secuencia completa, en una imagen</h3>

  <?= shot('wireshark/11-arp-secuencia.svg',
      'La pregunta ARP sale en difusión hacia todos los equipos de la red; solo el dueño '
      . 'de la dirección responde, y lo hace en unicast a quien preguntó.',
      '<b>Dónde mirar:</b> los destinatarios. La pregunta va a todos (destino Ethernet '
      . '<code>ff:ff:ff:ff:ff:ff</code>); la respuesta va solo a uno.') ?>

  <?= evidence(
      '<p>Dos respuestas ARP distintas anuncian la misma IP con dos direcciones MAC
      diferentes, en pocos segundos.</p>',
      '<p>Podría ser un intento de <strong>ARP spoofing</strong>: alguien se está anunciando
      como el gateway para que el tráfico pase por su equipo.</p>',
      '<p>Que lo sea. Un router con dos interfaces, un cambio de equipo, un failover de alta
      disponibilidad o una máquina virtual que acaba de arrancar producen exactamente la
      misma evidencia. Antes de concluir hay que saber qué MAC <em>debería</em> tener esa IP
      —eso es tener línea base— y comprobar si el cambio coincide con algo previsto.</p>') ?>

</section>

<!-- ============================== IPv4 ============================== -->
<section id="ipv4">
  <h2>IPv4</h2>
  <p class="tut-sub">Veinte bytes que llevan un paquete de un extremo del mundo al otro.</p>

  <p><strong>Qué es.</strong> IP es el protocolo que sabe llegar a cualquier destino de
  internet. Es <em>no fiable</em> a propósito: no garantiza entrega, ni orden, ni ausencia
  de duplicados. Todo eso lo pone TCP encima. IP solo se ocupa de direccionar y de que el
  paquete no dé vueltas para siempre.</p>

  <h3>La cabecera, campo a campo</h3>

  <p>Este es el diagrama que conviene tener en la cabeza. Cada fila son 32 bits (4 bytes);
  la cabecera mínima son cinco filas, 20 bytes:</p>

  <figure class="hdr hdr--ip">
    <div class="hdr__scale" aria-hidden="true">
      <span>0</span><span>4</span><span>8</span><span>16</span><span>19</span><span>31</span>
    </div>
    <div class="hdr__row">
      <div class="hdr__f l3" style="flex:4"><b>Version</b><span>4 bits</span></div>
      <div class="hdr__f l3" style="flex:4"><b>IHL</b><span>4 bits</span></div>
      <div class="hdr__f l3" style="flex:6"><b>DSCP</b><span>6 bits</span></div>
      <div class="hdr__f l3" style="flex:2"><b>ECN</b><span>2</span></div>
      <div class="hdr__f l3" style="flex:16"><b>Total Length</b><span>16 bits</span></div>
    </div>
    <div class="hdr__row">
      <div class="hdr__f l3" style="flex:16"><b>Identification</b><span>16 bits</span></div>
      <div class="hdr__f l3" style="flex:3"><b>Flags</b><span>3</span></div>
      <div class="hdr__f l3" style="flex:13"><b>Fragment Offset</b><span>13 bits</span></div>
    </div>
    <div class="hdr__row">
      <div class="hdr__f l3 hot" style="flex:8"><b>TTL</b><span>8 bits</span></div>
      <div class="hdr__f l3" style="flex:8"><b>Protocol</b><span>8 bits</span></div>
      <div class="hdr__f l3" style="flex:16"><b>Header Checksum</b><span>16 bits</span></div>
    </div>
    <div class="hdr__row">
      <div class="hdr__f l3" style="flex:32"><b>Source Address</b><span>32 bits · 4 bytes</span></div>
    </div>
    <div class="hdr__row">
      <div class="hdr__f l3" style="flex:32"><b>Destination Address</b><span>32 bits · 4 bytes</span></div>
    </div>
    <figcaption>Cabecera IPv4. Las opciones, si existen, van después; por eso hace falta el campo IHL.</figcaption>
  </figure>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Campos de la cabecera IPv4 y su significado</caption>
      <thead><tr><th scope="col">Campo</th><th scope="col">Qué significa</th><th scope="col">Filtro</th></tr></thead>
      <tbody>
        <tr><td class="f">Version</td><td class="d">Siempre 4 aquí. Es lo que distingue IPv4 de IPv6 al empezar a leer.</td><td class="f">ip.version</td></tr>
        <tr><td class="f">IHL</td><td class="d">Longitud de la cabecera en palabras de 4 bytes. Vale 5 (=20 bytes) salvo que haya opciones. Wireshark ya lo muestra en bytes.</td><td class="f">ip.hdr_len</td></tr>
        <tr><td class="f">DSCP</td><td class="d">Marca de calidad de servicio. Voz y vídeo la usan para pedir prioridad; el resto va a 0.</td><td class="f">ip.dsfield.dscp</td></tr>
        <tr><td class="f">ECN</td><td class="d">Notificación de congestión. Permite avisar de congestión sin descartar el paquete.</td><td class="f">ip.dsfield.ecn</td></tr>
        <tr><td class="f">Total Length</td><td class="d">Cabecera IP + contenido, en bytes. <strong>No incluye Ethernet</strong>: por eso es 14 menos que <code>frame.len</code>.</td><td class="f">ip.len</td></tr>
        <tr><td class="f">Identification</td><td class="d">Identificador del datagrama original. Todos los fragmentos de un mismo paquete lo comparten: así se reensambla.</td><td class="f">ip.id</td></tr>
        <tr><td class="f">Flags</td><td class="d">Tres bits. <code>DF</code> (no fragmentar) y <code>MF</code> (vienen más fragmentos).</td><td class="f">ip.flags</td></tr>
        <tr><td class="f">Fragment Offset</td><td class="d">Posición de este fragmento dentro del original, en unidades de 8 bytes.</td><td class="f">ip.frag_offset</td></tr>
        <tr><td class="f">TTL</td><td class="d">Cada router lo decrementa en 1. Al llegar a 0 el paquete se descarta y se devuelve un ICMP. Evita bucles infinitos.</td><td class="f">ip.ttl</td></tr>
        <tr><td class="f">Protocol</td><td class="d">Qué viene después: 1=ICMP, 6=TCP, 17=UDP.</td><td class="f">ip.proto</td></tr>
        <tr><td class="f">Header Checksum</td><td class="d">Suma de verificación de la cabecera. Se recalcula en cada salto porque el TTL cambia.</td><td class="f">ip.checksum</td></tr>
        <tr><td class="f">Source / Destination</td><td class="d">Las direcciones. <strong>Sobreviven todo el trayecto</strong>, a diferencia de las MAC.</td><td class="f">ip.src · ip.dst</td></tr>
      </tbody>
    </table>
  </div>

  <h3>El TTL cuenta una historia</h3>

  <p>Este es el campo que más información gratuita da. Los sistemas operativos parten de
  valores conocidos: Linux y macOS de <strong>64</strong>, Windows de <strong>128</strong>,
  muchos routers de <strong>255</strong>. Como cada salto resta 1, la distancia al origen es
  la diferencia.</p>

  <p>Haz un ping a <code>1.1.1.1</code> y compara: el request sale con <code>ttl=64</code>
  y la respuesta llega con <code>ttl=51</code>. Como 64 − 51 = 13, esa respuesta atravesó
  <strong>13 routers</strong> para llegar a ti. Y como el valor de partida era 64, el equipo
  del otro lado es casi seguro un Linux.</p>

  <?= filter_chip('ip.ttl < 20') ?>
  <p>Paquetes que han recorrido muchos saltos. En una captura de red local no debería
  aparecer casi nada; si tu tráfico interno tiene TTL bajo, algo lo está enrutando de más.</p>

  <?= note('Lo que el TTL no demuestra',
      '<p>El TTL es una <em>pista</em>, no una prueba. Se puede fijar a cualquier valor en
      el origen, y hay sistemas que no usan los valores por defecto. Sirve para agrupar
      («estos veinte paquetes vienen del mismo sitio, todos con TTL 51») y para detectar
      incoherencias («este equipo dice ser mi vecino de red pero su TTL indica 12 saltos»).
      Nunca para afirmar de qué sistema operativo se trata.</p>') ?>

  <h3>Fragmentación</h3>

  <p>Si un paquete no cabe en el MTU de un enlace (típicamente 1500 bytes), se parte. Los
  fragmentos comparten <code>ip.id</code>, todos menos el último llevan el bit
  <code>MF</code> a 1, y cada uno indica su posición en <code>ip.frag_offset</code>.</p>

  <?= filter_chip('ip.flags.mf == 1 || ip.frag_offset > 0') ?>

  <p>Ese filtro muestra todos los fragmentos. En una red bien dimensionada la fragmentación
  IPv4 es rara: si aparece mucha, suele haber un problema de MTU (una VPN, un túnel) que
  además degrada el rendimiento. Wireshark reensambla los fragmentos y te muestra el
  paquete completo en el último, indicando de qué tramas lo ha compuesto.</p>

  <h3>Filtros de dirección: la diferencia que hay que tener clara</h3>

  <?= filter_chip('ip.addr == 10.2.3.170') ?>
  <p>Origen <strong>o</strong> destino. Es «todo lo que tenga que ver con este equipo».</p>

  <?= filter_chip('ip.src == 10.2.3.170') ?>
  <p>Solo lo que sale. <code>ip.dst</code> para lo que entra.</p>

  <?= filter_chip('ip.addr == 10.2.3.0/24') ?>
  <p>Una red entera en notación CIDR. Combinado con una negación, aísla el tráfico que sale
  de tu red — que es justo lo que interesa mirar en un análisis de exfiltración:</p>

  <?= filter_chip('ip.src == 10.2.3.0/24 && !(ip.dst == 10.2.3.0/24)') ?>

  <?= note('El error de negar mal',
      '<p><code>!(ip.addr == 10.2.3.1)</code> y <code>ip.addr != 10.2.3.1</code>
      <strong>no son lo mismo</strong>. Como un paquete tiene dos campos <code>ip.addr</code>
      (origen y destino), el segundo se lee «<em>alguno</em> de los dos es distinto de
      10.2.3.1», y eso es cierto en casi todos los paquetes, incluidos los que van a esa IP.
      Para excluir de verdad, niega la expresión completa con paréntesis. Es la trampa más
      frecuente del lenguaje de filtros.</p>') ?>

  <p><strong>Práctica.</strong> Captura treinta segundos de navegación normal y aplica
  <code>ip.ttl &lt; 64 &amp;&amp; ip.ttl &gt; 40</code>. Ordena por la columna Source. Los
  grupos de TTL iguales son grupos de servidores a la misma distancia de ti.</p>
</section>

<!-- ============================== IPv6 ============================== -->
<section id="ipv6">
  <h2>IPv6</h2>
  <p class="tut-sub">Está en tu captura aunque no lo hayas configurado.</p>

  <p>Abre una captura cualquiera y filtra por <code>ipv6</code>: casi seguro que hay
  tráfico. Los sistemas modernos lo traen activado y prefieren IPv6 cuando hay ambos
  disponibles. Merece la pena reconocerlo aunque no lo administres.</p>

  <p><strong>Lo que cambia respecto a IPv4:</strong></p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Diferencias entre IPv4 e IPv6</caption>
      <thead><tr><th scope="col"></th><th scope="col">IPv4</th><th scope="col">IPv6</th></tr></thead>
      <tbody>
        <tr><td class="f">Dirección</td><td class="d">32 bits · <code>10.2.3.170</code></td><td class="d">128 bits · <code>fe80::b81e:a4ff:fe5a:ac8d</code></td></tr>
        <tr><td class="f">Cabecera</td><td class="d">20 bytes variables</td><td class="d">40 bytes fijos, más simple</td></tr>
        <tr><td class="f">Checksum</td><td class="d">Sí</td><td class="d">No: lo hacen las capas de arriba</td></tr>
        <tr><td class="f">Fragmenta</td><td class="d">Cualquier router</td><td class="d">Solo el origen</td></tr>
        <tr><td class="f">Equivale a TTL</td><td class="d"><code>ip.ttl</code></td><td class="d"><code>ipv6.hlim</code> (hop limit)</td></tr>
        <tr><td class="f">Siguiente capa</td><td class="d"><code>ip.proto</code></td><td class="d"><code>ipv6.nxt</code></td></tr>
        <tr><td class="f">ARP</td><td class="d">ARP</td><td class="d">NDP, dentro de ICMPv6</td></tr>
        <tr><td class="f">Broadcast</td><td class="d">Existe</td><td class="d">No existe: solo multicast</td></tr>
      </tbody>
    </table>
  </div>

  <p>Las direcciones que empiezan por <code>fe80::</code> son <strong>link-local</strong>:
  se autoconfiguran solas, solo valen dentro del segmento y no salen a internet. Son las
  que más verás en una captura doméstica.</p>

  <?= filter_chip('ipv6') ?>
  <?= filter_chip('ipv6.addr == fe80::1') ?>
  <?= filter_chip('icmpv6') ?>

  <p>Ese último es importante: en IPv6, el descubrimiento de vecinos (el equivalente a ARP),
  el anuncio de routers y la autoconfiguración van todos dentro de ICMPv6. Si filtras
  <code>icmpv6</code> en tu red verás los <em>Router Advertisement</em> y los
  <em>Neighbor Solicitation</em> que hacen ese trabajo.</p>

  <?= note('Por qué importa en seguridad',
      '<p>Un control que solo mira IPv4 tiene un punto ciego. Si tu red tiene IPv6 activo
      —y probablemente lo tiene— el tráfico puede salir por ahí sin pasar por reglas
      pensadas solo para IPv4. Cuando establezcas la línea base de la parte de
      ciberseguridad, mira <code>ipv6</code> además de <code>ip</code>.</p>') ?>
</section>

<!-- ============================== ICMP ============================== -->
<span id="e1" class="legacy-anchor" aria-hidden="true"></span>
<section id="icmp">
  <h2>ICMP</h2>
  <p class="tut-sub">El protocolo más simple que hay — y por eso el mejor para aprender a leer el árbol.</p>
  <p class="tut-goal">Objetivo: leer el árbol de capas de un paquete que entiendes entero.</p>

  <p>Empieza la captura en <code>wlan0</code>. Verás una avalancha de tráfico de fondo —
  es normal, tu equipo habla solo todo el rato. Pega este filtro en la barra verde para
  quedarte solo con lo tuyo:</p>

  <?= filter_chip('icmp') ?>

  <p>La lista se queda vacía. Ahora, en la terminal:</p>

  <?= term('<span class="p">$</span> ping -c 4 1.1.1.1') ?>

  <p>Aparecen ocho paquetes: cuatro <em>Echo (ping) request</em> y cuatro <em>Echo (ping)
  reply</em>, alternados. Selecciona el primer request y despliega el árbol del panel del
  medio. Vas a ver exactamente las tres capas del diagrama de arriba:</p>

  <ul>
    <li><strong>Ethernet II</strong> — origen <code>b8:1e:a4:5a:ac:8d</code> (tu tarjeta
    wifi) y destino la MAC de tu router. Fíjate: la MAC destino <em>no</em> es la de
    Cloudflare. Es la del siguiente salto.</li>
    <li><strong>Internet Protocol Version 4</strong> — origen <code>10.2.3.170</code>,
    destino <code>1.1.1.1</code>. Aquí sí está el destino final. Despliega y busca
    <code>Time to Live</code>: es el contador de saltos que evita que un paquete perdido
    dé vueltas para siempre.</li>
    <li><strong>Internet Control Message Protocol</strong> — tipo 8 (request). En la
    respuesta será tipo 0 (reply). Al final hay un campo <code>Data</code> con bytes de
    relleno.</li>
  </ul>

  <p>Pincha el campo TTL en el árbol y mira el panel de abajo: se resalta un byte. Ese
  byte <em>es</em> el TTL. No hay magia.</p>

  <?= note('Por qué importa',
      '<p>ICMP es el protocolo más simple que hay, y por eso es el mejor sitio para
      aprender a leer el árbol. Todo lo demás usa la misma estructura, solo que con más
      capas encima.</p>', 'info') ?>

  <h3>Emparejar request y reply</h3>

  <p>Un ping son pares. Despliega el árbol ICMP y verás dos campos que los enlazan:</p>

  <ul>
    <li><code>Identifier</code> — igual en toda la serie. Identifica <em>esta</em> ejecución
    de <code>ping</code>, para que dos pings simultáneos no se mezclen.</li>
    <li><code>Sequence Number</code> — incrementa 1, 2, 3, 4. Identifica cada envío.</li>
  </ul>

  <p>Wireshark hace el emparejamiento por ti: en la respuesta verás una línea
  <code>[Request In: 1]</code>, y en el request un <code>[Response In: 2]</code>. Y en la
  respuesta añade <code>[Response Time: …ms]</code>, que es la latencia real medida sobre
  el paquete, no la que estima <code>ping</code>.</p>

  <?= filter_chip('icmp.ident == 0xc977') ?>
  <p>Aísla una ejecución concreta de ping cuando hay varias mezcladas.</p>

  <h3>Los tipos que vas a encontrar</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Tipos de mensaje ICMP habituales</caption>
      <thead><tr><th scope="col">Tipo</th><th scope="col">Nombre</th><th scope="col">Qué significa</th></tr></thead>
      <tbody>
        <tr><td class="f">8</td><td class="d">Echo Request</td><td class="d">«¿Estás ahí?» — lo que envía <code>ping</code>.</td></tr>
        <tr><td class="f">0</td><td class="d">Echo Reply</td><td class="d">«Sí». Ojo al orden contraintuitivo: la respuesta es el tipo 0.</td></tr>
        <tr><td class="f">3</td><td class="d">Destination Unreachable</td><td class="d">No hay camino. El <em>code</em> dice por qué: 0 red, 1 host, 3 puerto, 13 prohibido administrativamente (un cortafuegos).</td></tr>
        <tr><td class="f">11</td><td class="d">Time Exceeded</td><td class="d">El TTL llegó a 0. Es lo que hace funcionar a <code>traceroute</code>.</td></tr>
        <tr><td class="f">5</td><td class="d">Redirect</td><td class="d">«Usa mejor este otro router». Poco frecuente y a menudo indeseado.</td></tr>
      </tbody>
    </table>
  </div>

  <?= filter_chip('icmp.type == 8') ?>
  <?= filter_chip('icmp.type == 3 && icmp.code == 13') ?>
  <p>Ese segundo es muy útil al diagnosticar: significa que un cortafuegos está bloqueando
  <em>y avisando</em>. Si no llega nada en absoluto, el cortafuegos descarta en silencio,
  que es lo habitual.</p>

  <?= note('El regalo del tipo 3 y el 11',
      '<p>Un <em>Destination Unreachable</em> y un <em>Time Exceeded</em> incluyen dentro
      una copia de la cabecera del paquete que los provocó. Despliégala: verás el paquete
      original, con su IP de destino y su puerto. Es la forma de averiguar qué conexión
      concreta se rompió, y por eso <code>traceroute</code> puede decirte qué router hay en
      cada salto.</p>', 'info') ?>

  <h3 class="ciber-head">Ciberseguridad: qué mirar en ICMP</h3>

  <p>ICMP es una herramienta de diagnóstico legítima y necesaria. Bloquearlo entero es un
  error clásico que rompe el descubrimiento de MTU. Pero hay patrones que merecen mirada:</p>

  <ul>
    <li><strong>Barrido (<em>ping sweep</em>).</strong> Un origen envía <em>echo request</em>
    a muchas IP consecutivas del rango en poco tiempo. La señal es la <em>forma</em>: un
    origen, muchos destinos, secuencial, sin respuestas para la mayoría.</li>
    <li><strong>Volumen desproporcionado.</strong> ICMP debería ser una fracción mínima del
    tráfico. Compruébalo en <strong>Statistics → Protocol Hierarchy</strong>: si ICMP es un
    porcentaje llamativo, pregúntate por qué.</li>
    <li><strong>Payload grande o con contenido.</strong> El campo <code>Data</code> de un
    ping normal es relleno predecible. Paquetes ICMP con cargas grandes y variables, de
    forma sostenida y bidireccional, son el patrón de un túnel sobre ICMP.</li>
    <li><strong>Periodicidad.</strong> Echo requests cada N segundos exactos hacia un
    destino externo fijo.</li>
  </ul>

  <?= filter_chip('icmp && data.len > 64') ?>

  <?= note('ICMP no equivale a ataque',
      '<p>Los sistemas de monitorización hacen ping constantemente. Los balanceadores
      comprueban salud con ICMP. El descubrimiento de MTU lo usa en cada conexión. Ver ICMP
      —incluso bastante— es normal. Lo que hace sospechoso a un patrón es la combinación de
      <em>forma</em> (uno a muchos, secuencial), <em>persistencia</em> y <em>ausencia de
      una explicación conocida</em> en tu inventario. Un solo paquete nunca es evidencia.</p>') ?>

  <h3>Un ping, visto por dentro</h3>

  <?= shot('wireshark/10-icmp-echo.svg',
      'Tres pares de paquetes ICMP: cada Echo request de tu equipo tiene su Echo reply de '
      . 'vuelta, con números de secuencia 1, 2 y 3.',
      '<b>Dónde mirar:</b> el identificador y la secuencia. <code>id</code> es el mismo en '
      . 'los seis paquetes —identifica esta ejecución de <code>ping</code>—; '
      . '<code>seq</code> va subiendo e identifica cada ida y vuelta.',
      'real') ?>

  <?= pitfall('<p>Interpretar la ausencia de <em>reply</em> como «el equipo está apagado».
      Muchísimos cortafuegos —el de Windows por defecto, entre ellos— descartan el Echo
      request sin contestar. Un equipo perfectamente encendido y sirviendo páginas web puede
      no responder a un ping. La conclusión honesta es «no responde a ICMP», no «está
      caído».</p>') ?>

</section>

<!-- ============================== TCP =============================== -->
<span id="e4" class="legacy-anchor" aria-hidden="true"></span>
<section id="tcp">
  <h2>TCP</h2>
  <p class="tut-sub">La sección más larga, porque es el protocolo del que más se diagnostica.</p>
  <p class="tut-goal">Objetivo: entender cómo TCP abre una conexión — el concepto central del protocolo.</p>

  <p><strong>Qué es.</strong> TCP convierte el servicio no fiable de IP en un flujo de bytes
  ordenado y sin pérdidas. Para conseguirlo numera cada byte, confirma lo recibido,
  retransmite lo que falta y controla el ritmo para no ahogar al receptor ni a la red.
  Todo eso deja rastro en la cabecera, y ese rastro es lo que lees en Wireshark.</p>

  <h3>Puertos: cómo se identifica una conversación</h3>

  <p>Una conexión TCP se identifica por <strong>cuatro valores</strong>: IP origen, puerto
  origen, IP destino, puerto destino. Esa tupla es única, y es lo que permite a tu navegador
  tener veinte conexiones al mismo servidor a la vez: cambia el puerto origen.</p>

  <p>El puerto de destino identifica el servicio (443 = HTTPS); el de origen lo elige el
  sistema al azar en el rango alto (32768–60999 en Linux) y se llama <em>puerto efímero</em>.
  Por eso, en una captura, el lado con puerto alto es casi siempre el cliente.</p>

  <h3>El handshake de tres vías</h3>

  <p>Antes de que se envíe un solo byte útil, los dos extremos se sincronizan con tres
  paquetes:</p>

  <figure class="tut-figure">
    <svg viewBox="0 0 480 214" role="img"
         aria-label="Diagrama del handshake TCP de tres vías: el cliente 10.2.3.170 envía SYN con Seq=0, el servidor responde SYN-ACK con Seq=0 y Ack=1, y el cliente cierra con ACK Ack=1, quedando la conexión abierta.">
      <text x="58" y="18" font-family="JetBrains Mono, monospace" font-size="11" fill="var(--dv-text-primary)" text-anchor="middle">10.2.3.170</text>
      <text x="422" y="18" font-family="JetBrains Mono, monospace" font-size="11" fill="var(--dv-text-primary)" text-anchor="middle">servidor:80</text>

      <line x1="58" y1="28" x2="58" y2="204" stroke="var(--dv-border-strong)" stroke-width="1" stroke-dasharray="3 4"/>
      <line x1="422" y1="28" x2="422" y2="204" stroke="var(--dv-border-strong)" stroke-width="1" stroke-dasharray="3 4"/>

      <line x1="58" y1="62" x2="410" y2="62" stroke="var(--tl-l3)" stroke-width="1.7"/>
      <polygon points="422,62 408,57 408,67" fill="var(--tl-l3)"/>
      <text x="240" y="54" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700" fill="var(--tl-l3)" text-anchor="middle">SYN</text>
      <text x="240" y="78" font-family="JetBrains Mono, monospace" font-size="10" fill="var(--dv-text-muted)" text-anchor="middle">Seq=0 · «quiero hablar»</text>

      <line x1="422" y1="120" x2="70" y2="120" stroke="var(--tl-l4)" stroke-width="1.7"/>
      <polygon points="58,120 72,115 72,125" fill="var(--tl-l4)"/>
      <text x="240" y="112" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700" fill="var(--tl-l4)" text-anchor="middle">SYN, ACK</text>
      <text x="240" y="136" font-family="JetBrains Mono, monospace" font-size="10" fill="var(--dv-text-muted)" text-anchor="middle">Seq=0 Ack=1 · «vale, y yo también»</text>

      <line x1="58" y1="178" x2="410" y2="178" stroke="var(--tl-l7)" stroke-width="1.7"/>
      <polygon points="422,178 408,173 408,183" fill="var(--tl-l7)"/>
      <text x="240" y="170" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700" fill="var(--tl-l7)" text-anchor="middle">ACK</text>
      <text x="240" y="194" font-family="JetBrains Mono, monospace" font-size="10" fill="var(--dv-text-muted)" text-anchor="middle">Ack=1 · conexión abierta</text>
    </svg>
    <figcaption>Tres paquetes, cero bytes de datos. Después ya se puede hablar.</figcaption>
  </figure>

  <p>Vamos a verlo. Este filtro aísla exactamente los paquetes de apertura — SYN activo y
  ACK apagado, que solo ocurre en el primer paquete de cada conexión nueva:</p>

  <?= filter_chip('tcp.flags.syn == 1 && tcp.flags.ack == 0') ?>

  <?= term('<span class="p">$</span> curl -s -o /dev/null http://neverssl.com') ?>

  <p>Aparece un SYN. Ahora quita el filtro y en su lugar haz clic derecho sobre ese paquete
  → <strong>Conversation Filter → TCP</strong>. Wireshark escribe solo un filtro con las
  dos IPs y los dos puertos, y te deja la conversación completa: los tres paquetes del
  handshake, la petición HTTP, la respuesta, y el cierre con FIN.</p>

  <p>En el árbol de cada paquete despliega <strong>Flags</strong> dentro de TCP. Los bits
  que importan:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Flags de TCP y su significado</caption>
      <thead><tr><th scope="col">Flag</th><th scope="col">Significa</th></tr></thead>
      <tbody>
        <tr><td class="f">SYN</td><td class="d">Abriendo conexión, sincroniza números de secuencia</td></tr>
        <tr><td class="f">ACK</td><td class="d">Confirmo lo que me has mandado hasta el byte N</td></tr>
        <tr><td class="f">PSH</td><td class="d">Entrega estos datos a la aplicación ya, no esperes</td></tr>
        <tr><td class="f">FIN</td><td class="d">He terminado de enviar, cierre ordenado</td></tr>
        <tr><td class="f">RST</td><td class="d">Corte abrupto. Casi siempre señal de problema</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('Truco',
      '<p>Por defecto Wireshark muestra números de secuencia <em>relativos</em> (empiezan
      en 0) para que sean legibles. Los reales son aleatorios de 32 bits. Si alguna vez
      necesitas los de verdad: Edit → Preferences → Protocols → TCP → desmarcar «Relative
      sequence numbers».</p>', 'info') ?>

  <h3>Sequence y Acknowledgement, sin misterio</h3>

  <p>Estos dos números confunden hasta que se entiende que <strong>cuentan bytes, no
  paquetes</strong>:</p>

  <ul>
    <li><code>tcp.seq</code> — el número del primer byte de datos que va en <em>este</em>
    segmento.</li>
    <li><code>tcp.ack</code> — el número del siguiente byte que <em>espero recibir</em>. Es
    decir: «tengo todo hasta el byte ack−1».</li>
    <li><code>tcp.len</code> — cuántos bytes de datos lleva este segmento. Los ACK puros
    llevan 0.</li>
  </ul>

  <p>La aritmética es siempre la misma: si recibo un segmento con <code>seq=1</code> y
  <code>len=500</code>, responderé con <code>ack=501</code>. Con números relativos esto se
  lee de un vistazo.</p>

  <p>SYN y FIN consumen un número de secuencia aunque no lleven datos. Por eso el
  <code>ack=1</code> del handshake, cuando no se había enviado ningún byte: el 0 lo gastó
  el SYN.</p>

  <h3>Window size: el control de flujo</h3>

  <p><code>tcp.window_size_value</code> es lo que el emisor anuncia; <code>tcp.window_size</code>
  es ese valor ya multiplicado por el factor de escala que se negoció en el handshake.
  Wireshark calcula el segundo por ti, y es el que debes mirar.</p>

  <p>Significa «tengo sitio para tantos bytes más sin confirmar». Si baja mucho, el receptor
  no da abasto procesando. Si llega a cero, se para todo:</p>

  <?= filter_chip('tcp.analysis.zero_window') ?>

  <p>Ventana cero es un hallazgo de primera categoría cuando alguien reporta lentitud: el
  problema no está en la red, está en el equipo que anuncia el cero, que no lee su buffer
  lo bastante rápido.</p>

  <h3>Cerrar la conexión</h3>

  <p>Hay dos formas, y distinguirlas importa:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Formas de cerrar una conexión TCP</caption>
      <thead><tr><th scope="col">Cierre</th><th scope="col">Secuencia</th><th scope="col">Qué significa</th></tr></thead>
      <tbody>
        <tr><td class="f">Ordenado (FIN)</td><td class="d">FIN → ACK → FIN → ACK</td><td class="d">Cada lado dice que terminó de enviar. Es lo normal y garantiza que no se pierden datos en vuelo.</td></tr>
        <tr><td class="f">Abrupto (RST)</td><td class="d">RST</td><td class="d">«Se acabó, ya». Descarta lo que hubiera pendiente.</td></tr>
      </tbody>
    </table>
  </div>

  <?= filter_chip('tcp.flags.fin == 1') ?>
  <?= filter_chip('tcp.flags.reset == 1') ?>

  <h3>El motor de análisis de Wireshark</h3>

  <p>Wireshark no solo muestra los campos: sigue el estado de cada conexión y marca lo que
  no cuadra. Esos son los campos <code>tcp.analysis.*</code>, y son la herramienta de
  diagnóstico más potente del programa.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Campos de análisis TCP y cómo interpretarlos</caption>
      <thead><tr><th scope="col">Filtro</th><th scope="col">Qué detectó</th><th scope="col">Cómo interpretarlo</th></tr></thead>
      <tbody>
        <tr><td class="f">tcp.analysis.retransmission</td><td class="d">Datos ya enviados vuelven a enviarse</td><td class="d">Algo se perdió por el camino, o el ACK no llegó a tiempo.</td></tr>
        <tr><td class="f">tcp.analysis.fast_retransmission</td><td class="d">Retransmisión disparada por ACK duplicados, sin esperar al temporizador</td><td class="d">Pérdida detectada rápido. Es el mecanismo funcionando bien.</td></tr>
        <tr><td class="f">tcp.analysis.duplicate_ack</td><td class="d">El receptor repite el mismo ACK</td><td class="d">«Me falta un trozo». Tres seguidos disparan la retransmisión rápida.</td></tr>
        <tr><td class="f">tcp.analysis.out_of_order</td><td class="d">Un segmento llegó antes que otro anterior</td><td class="d">Suele ser reordenación de la red, no pérdida. No es grave por sí solo.</td></tr>
        <tr><td class="f">tcp.analysis.lost_segment</td><td class="d">Hay un hueco en la numeración</td><td class="d">Ojo: puede significar que se perdió, o solo que <em>tú</em> no lo capturaste.</td></tr>
        <tr><td class="f">tcp.analysis.zero_window</td><td class="d">Ventana anunciada a 0</td><td class="d">El receptor está saturado. Problema de aplicación, no de red.</td></tr>
        <tr><td class="f">tcp.analysis.flags</td><td class="d">Cualquiera de las anteriores</td><td class="d">El filtro de barrido: empieza siempre por aquí.</td></tr>
      </tbody>
    </table>
  </div>

  <?= filter_chip('tcp.analysis.flags') ?>

  <p>Muestra solo los paquetes que Wireshark ha marcado como problemáticos. En una red sana,
  apenas aparece nada.</p>

  <?= note('Un aviso sobre el punto de captura',
      '<p><code>tcp.analysis.lost_segment</code> y las retransmisiones dependen de dónde
      capturas. Si capturas en el cliente, ves lo que <em>al cliente</em> le llegó tarde o
      no le llegó. Un paquete puede estar marcado como retransmisión simplemente porque tu
      equipo iba justo de CPU y <code>dumpcap</code> descartó el original. Comprueba siempre
      <strong>Statistics → Capture File Properties</strong> antes de concluir que la red
      pierde paquetes.</p>') ?>

  <h3>Navegar por una conexión</h3>

  <p><code>tcp.stream</code> es un número que Wireshark asigna a cada conexión de la
  captura, empezando en 0. Es la forma más rápida de moverse:</p>

  <?= filter_chip('tcp.stream eq 3') ?>

  <p>Y <code>tcp.time_delta</code> es el tiempo desde el paquete anterior <em>de la misma
  conexión</em> — mucho más útil que el delta global cuando hay tráfico mezclado. Para
  usarlo hay que activarlo en Edit → Preferences → Protocols → TCP → «Calculate conversation
  timestamps».</p>

  <?= filter_chip('tcp.time_delta > 1') ?>

  <p>Paquetes que llegaron más de un segundo después del anterior de su conexión. Es la
  forma de encontrar dónde exactamente se quedó parada una transferencia lenta.</p>

  <p><strong>Práctica.</strong> Captura un <code>curl</code> a cualquier web, aplica
  <code>tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0</code> para localizar la apertura,
  anota el número de <code>tcp.stream</code>, y filtra por él. Sigue la conversación entera
  contando los paquetes: tres de handshake, la petición, la respuesta, el cierre. Si sabes
  explicar cada paquete de esa lista, entiendes TCP.</p>

  <h3>El saludo de tres vías, paso a paso</h3>

  <?= shot('wireshark/08-tcp-handshake.svg',
      'Diagrama de secuencia entre cliente y servidor: el cliente envía SYN con Seq=0, el '
      . 'servidor responde SYN-ACK con Seq=0 y Ack=1, y el cliente confirma con ACK Ack=1.',
      '<b>Dónde mirar:</b> los números. El <code>Ack</code> de cada lado es siempre el '
      . 'siguiente byte que espera recibir — por eso responder a <code>Seq=0</code> con '
      . '<code>Ack=1</code> significa «he recibido el byte 0».',
      'real') ?>

  <?= callouts([
      ['SYN', 'Un solo bit levantado y ningún dato. El cliente propone una conversación y anuncia su número de secuencia inicial.'],
      ['SYN-ACK', 'El servidor hace dos cosas a la vez: confirma lo del cliente y propone su propio número de secuencia. Por eso lleva los dos flags.'],
      ['ACK', 'El cliente confirma. Terminado este paquete la conexión está establecida y ya pueden viajar datos.'],
  ]) ?>

  <h3>De la línea resumen al bit concreto</h3>

  <p>La columna <b>Info</b> te dice <code>[SYN]</code>, pero eso es un resumen que escribe
  el disector. Lo que hay debajo es un campo de dieciséis bits:</p>

  <?= shot('wireshark/05-zoom-tcp-flags.svg',
      'Arriba la línea resumen del Packet List con la etiqueta SYN; abajo el campo Flags '
      . 'desplegado bit a bit, con Syn a 1 y Acknowledgment a 0.',
      '<b>Dónde mirar:</b> los dos bits que importan. <code>Syn: Set</code> con '
      . '<code>Acknowledgment: Not set</code> es la firma del primer paquete de una '
      . 'conexión — y la razón de que el filtro <code>tcp.flags.syn == 1 &amp;&amp; '
      . 'tcp.flags.ack == 0</code> sea el más usado de Wireshark.',
      'real') ?>

  <?= evidence(
      '<p>Una conexión TCP termina con <code>RST</code> en lugar de con el intercambio de
      <code>FIN</code> habitual.</p>',
      '<p>Alguien cortó de golpe: puede ser la aplicación que cerró sin avanzar, un puerto
      que no escucha, o un dispositivo intermedio inyectando el reset.</p>',
      '<p>Que haya intervención de terceros. Un <code>RST</code> es cotidiano y casi siempre
      inocente. El dato que empieza a distinguir un caso de otro es el <strong>TTL</strong>
      del <code>RST</code>: si no coincide con el del resto de paquetes de ese extremo, el
      reset no lo generó ese extremo. Y aun así, eso es un indicio más, no una prueba.</p>') ?>

</section>

<!-- ============================== UDP =============================== -->
<section id="udp">
  <h2>UDP</h2>
  <p class="tut-sub">Ocho bytes de cabecera y ninguna promesa.</p>

  <p><strong>Qué es.</strong> UDP es la alternativa mínima a TCP: pone puertos sobre IP y
  poco más. No hay conexión, ni confirmación, ni orden, ni retransmisión. Si un datagrama se
  pierde, se pierde y nadie se entera — salvo la aplicación, si le importa.</p>

  <p>Eso, que suena a defecto, es exactamente lo que quieren DNS (una pregunta, una
  respuesta: montar una conexión costaría más que reintentar), el vídeo en tiempo real (un
  fotograma retransmitido llega tarde y ya no sirve) y DHCP (todavía no tienes ni IP).</p>

  <figure class="hdr">
    <div class="hdr__row">
      <div class="hdr__f l4" style="flex:16"><b>Source Port</b><span>16 bits</span></div>
      <div class="hdr__f l4" style="flex:16"><b>Destination Port</b><span>16 bits</span></div>
    </div>
    <div class="hdr__row">
      <div class="hdr__f l4" style="flex:16"><b>Length</b><span>16 bits</span></div>
      <div class="hdr__f l4" style="flex:16"><b>Checksum</b><span>16 bits</span></div>
    </div>
    <figcaption>Cabecera UDP completa: 8 bytes. La de TCP son 20 como mínimo.</figcaption>
  </figure>

  <ul>
    <li><code>udp.srcport</code> / <code>udp.dstport</code> — igual que en TCP.</li>
    <li><code>udp.length</code> — cabecera <strong>más</strong> datos. Como la cabecera son
    8, el contenido es <code>udp.length − 8</code>.</li>
    <li><code>udp.checksum</code> — opcional en IPv4, obligatorio en IPv6.</li>
  </ul>

  <h3>TCP frente a UDP, de un vistazo</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Comparación entre TCP y UDP</caption>
      <thead><tr><th scope="col"></th><th scope="col">TCP</th><th scope="col">UDP</th></tr></thead>
      <tbody>
        <tr><td class="f">Conexión</td><td class="d">Handshake de 3 vías</td><td class="d">Ninguna: se envía y ya</td></tr>
        <tr><td class="f">Cabecera</td><td class="d">20 bytes mínimo</td><td class="d">8 bytes fijos</td></tr>
        <tr><td class="f">Entrega</td><td class="d">Garantizada y en orden</td><td class="d">Sin garantía</td></tr>
        <tr><td class="f">Retransmite</td><td class="d">Sí, automáticamente</td><td class="d">No: si acaso, la aplicación</td></tr>
        <tr><td class="f">Control de flujo</td><td class="d">Sí (window)</td><td class="d">No</td></tr>
        <tr><td class="f">En Wireshark</td><td class="d">Estado por conexión, <code>tcp.analysis.*</code>, Follow Stream</td><td class="d">Sin estado: cada datagrama es independiente</td></tr>
        <tr><td class="f">Se usa en</td><td class="d">HTTP, HTTPS, SSH, correo</td><td class="d">DNS, DHCP, NTP, QUIC, voz y vídeo</td></tr>
      </tbody>
    </table>
  </div>

  <?= filter_chip('udp') ?>
  <?= filter_chip('udp.port == 53') ?>
  <?= filter_chip('udp.length > 512') ?>

  <?= note('Wireshark no puede ayudarte igual con UDP',
      '<p>No existe <code>udp.analysis.retransmission</code> y no puede existir: sin números
      de secuencia, Wireshark no tiene forma de saber si un datagrama se perdió. Con UDP, el
      análisis de pérdidas hay que hacerlo con lo que ponga el protocolo de aplicación
      encima (el Transaction ID de DNS, los números de secuencia de RTP). Es una diferencia
      práctica importante al investigar.</p>', 'info') ?>
</section>

<!-- ============================== DNS =============================== -->
<span id="e3" class="legacy-anchor" aria-hidden="true"></span>
<section id="dns">
  <h2>DNS</h2>
  <p class="tut-sub">Nombres a números — y el protocolo que más cuenta sobre lo que hace un equipo.</p>
  <p class="tut-goal">Objetivo: emparejar consulta y respuesta, y ver el primer protocolo de aplicación.</p>

  <?= filter_chip('dns') ?>

  <?= term('<span class="p">$</span> dig +short archlinux.org') ?>

  <p>Dos paquetes: <em>Standard query</em> y <em>Standard query response</em>. Despliega la
  consulta y fíjate en el <strong>Transaction ID</strong> — un número aleatorio de 16 bits.
  Ahora mira la respuesta: tiene el mismo ID. Así se emparejan; DNS va normalmente sobre
  UDP, que no tiene conexión, así que la correspondencia hay que llevarla en el propio
  mensaje.</p>

  <p>Dentro de la respuesta, despliega <code>Answers</code>: ahí están las direcciones IP
  reales. Y observa el campo <strong>Time</strong> que Wireshark añade a la respuesta — te
  dice cuánto tardó tu resolver. Eso convierte a Wireshark en una herramienta de
  diagnóstico: un DNS lento se ve aquí de un vistazo.</p>

  <?= note('Detalle de privacidad',
      '<p>El nombre <code>archlinux.org</code> viaja en texto plano. Aunque después la web
      sea HTTPS, la consulta DNS clásica no está cifrada: cualquiera en el camino ve qué
      dominios visitas. Es el motivo de que existan DoH y DoT.</p>') ?>

  <h3>Tipos de registro</h3>

  <p>El campo <code>dns.qry.type</code> dice qué se pregunta. Los que verás:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Tipos de registro DNS</caption>
      <thead><tr><th scope="col">Tipo</th><th scope="col">Nº</th><th scope="col">Devuelve</th><th scope="col">Nota para el analista</th></tr></thead>
      <tbody>
        <tr><td class="f">A</td><td class="d">1</td><td class="d">Una IPv4</td><td class="d">El caso normal.</td></tr>
        <tr><td class="f">AAAA</td><td class="d">28</td><td class="d">Una IPv6</td><td class="d">Los navegadores piden A y AAAA a la vez.</td></tr>
        <tr><td class="f">CNAME</td><td class="d">5</td><td class="d">Un alias hacia otro nombre</td><td class="d">Encadena: el nombre real puede estar a varios saltos.</td></tr>
        <tr><td class="f">MX</td><td class="d">15</td><td class="d">Servidor de correo</td><td class="d">Un equipo de escritorio no debería consultarlos a menudo.</td></tr>
        <tr><td class="f">TXT</td><td class="d">16</td><td class="d">Texto libre</td><td class="d">Legítimo (SPF, verificaciones) pero es el registro preferido para sacar datos por DNS.</td></tr>
        <tr><td class="f">PTR</td><td class="d">12</td><td class="d">IP → nombre (inverso)</td><td class="d">También lo usa mDNS para descubrir servicios en la red local.</td></tr>
        <tr><td class="f">NS</td><td class="d">2</td><td class="d">Servidor autoritativo del dominio</td><td class="d">Frecuente en resolvers, raro en clientes.</td></tr>
      </tbody>
    </table>
  </div>

  <?= filter_chip('dns.qry.type == 16') ?>
  <?= filter_chip('dns.flags.response == 0') ?>
  <p>Solo las preguntas. Con <code>== 1</code>, solo las respuestas.</p>

  <?= filter_chip('dns.qry.name contains "archlinux"') ?>
  <?= filter_chip('dns.time > 0.5') ?>
  <p>Resoluciones que tardaron más de medio segundo: el diagnóstico directo de «internet va
  lento» cuando la culpa es del DNS.</p>

  <h3>Cuando la respuesta es «no existe»</h3>

  <p>El código de respuesta va en <code>dns.flags.rcode</code>. El valor 0 es éxito; el 3 es
  <strong>NXDOMAIN</strong>, «ese nombre no existe».</p>

  <?= filter_chip('dns.flags.rcode == 3') ?>

  <p>Algún NXDOMAIN suelto es normal: una errata al teclear, un dominio de búsqueda mal
  configurado. Un volumen alto y sostenido, no — y ahí empieza el interés defensivo.</p>

  <h3 class="ciber-head">Ciberseguridad: DNS es donde primero se ve casi todo</h3>

  <p>Aunque el contenido esté cifrado, <strong>el nombre que se resuelve casi nunca lo
  está</strong>. Por eso DNS es el registro más valioso en una investigación: te dice a
  dónde intentó ir un equipo, incluso si la conexión luego falló. Estos son los patrones
  que se miran, con lo que <em>de verdad</em> significa cada uno:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Indicadores DNS y su interpretación</caption>
      <thead><tr><th scope="col">Indicador</th><th scope="col">Por qué llama la atención</th><th scope="col">Explicación benigna frecuente</th></tr></thead>
      <tbody>
        <tr><td class="d">Muchos NXDOMAIN distintos</td><td class="d">Un algoritmo que genera dominios va probando hasta acertar con el que está registrado</td><td class="d">Sufijos de búsqueda mal configurados; un cliente de correo reintentando; antivirus con listas de reputación</td></tr>
        <tr><td class="d">Subdominios muy largos y aleatorios</td><td class="d">Los datos se codifican en el propio nombre para sacarlos por DNS</td><td class="d">CDN, antivirus en la nube y servicios de reputación usan nombres largos generados</td></tr>
        <tr><td class="d">Consultas a intervalos exactos</td><td class="d">Un implante consultando a su servidor de control</td><td class="d">Sincronización horaria, actualizaciones, telemetría, sondas de monitorización</td></tr>
        <tr><td class="d">Volumen alto de TXT</td><td class="d">TXT admite más datos por respuesta que A</td><td class="d">Validación de dominios, SPF/DKIM en servidores de correo</td></tr>
        <tr><td class="d">Resolver distinto del habitual</td><td class="d">Un equipo salta el DNS corporativo y su registro</td><td class="d">DoH del navegador activado por defecto; VPN; un móvil con su propia configuración</td></tr>
      </tbody>
    </table>
  </div>

  <p>Filtros para explorar cada uno:</p>

  <?= filter_chip('dns.flags.rcode == 3 && dns.flags.response == 1') ?>
  <?= filter_chip('dns.qry.name.len > 50') ?>
  <?= filter_chip('dns && !(ip.dst == 10.2.3.1)') ?>
  <p>Ese último saca las consultas DNS que <em>no</em> van a tu resolver habitual.
  Sustituye la IP por la de tu red.</p>

  <?= note('Indicador no es evidencia',
      '<p>Ninguna de las señales de arriba prueba nada por sí sola, y conviene decirlo con
      claridad porque es donde más se equivoca quien empieza. Un dominio de 60 caracteres
      generado automáticamente puede ser un CDN legítimo. Cien NXDOMAIN pueden ser un
      sufijo de búsqueda mal puesto. Una consulta cada 300 segundos exactos puede ser el
      agente de monitorización que instaló el propio departamento de sistemas.</p>
      <p>Lo que convierte un indicador en un hallazgo es la <strong>acumulación</strong>:
      varios indicadores independientes sobre el mismo equipo y el mismo destino, que
      además no encajan con la línea base ni con ningún software conocido del inventario.
      Y aun entonces, lo que tienes es una hipótesis que hay que confirmar con más
      fuentes.</p>') ?>

  <p><strong>Práctica.</strong> Abre <strong>Statistics → DNS</strong> sobre una captura de
  navegación normal. Mira el reparto por tipo de consulta y el de códigos de respuesta.
  Esa distribución es tu línea base de DNS: cuando algo se salga de ella, lo notarás.</p>

  <h3>Una resolución completa, en una imagen</h3>

  <?= shot('wireshark/09-dns-secuencia.svg',
      'El equipo pregunta al resolver por el nombre example.com y recibe una respuesta con '
      . 'la dirección; ambos mensajes comparten el mismo Transaction ID.',
      '<b>Dónde mirar:</b> el <b>Transaction ID</b>. DNS va sobre UDP, que no tiene '
      . 'conexión: ese número de dos bytes es lo único que empareja una pregunta con su '
      . 'respuesta.') ?>

  <?= evidence(
      '<p>Un equipo hace consultas DNS a nombres largos y aparentemente aleatorios bajo un
      mismo dominio, cada pocos segundos y durante horas.</p>',
      '<p>Encaja con <strong>tunelización por DNS</strong>: usar el campo del nombre para
      transportar datos hacia fuera, aprovechando que casi ninguna red bloquea el puerto 53.</p>',
      '<p>Que lo sea. Las listas de reputación, los antivirus, los CDN y algunos sistemas de
      caché generan tráfico con exactamente esa forma. Lo que hay que comprobar antes de
      afirmar nada: si ese dominio aparece en la línea base del equipo, si el volumen de
      salida es desproporcionado respecto al de entrada, y si el patrón temporal es
      demasiado regular para ser humano.</p>') ?>

  <?= pitfall('<p>Dar por hecho que verás DNS siempre. Si el navegador o el sistema usan
      <strong>DNS sobre HTTPS</strong> o <strong>DNS sobre TLS</strong>, las consultas viajan
      cifradas dentro de otra conexión y no aparecerán nunca con el filtro <code>dns</code>.
      No ver DNS no significa que no lo haya: significa que no lo ves ahí.</p>') ?>

</section>

<!-- ============================= DHCP =============================== -->
<section id="dhcp">
  <h2>DHCP</h2>
  <p class="tut-sub">Cómo un equipo consigue una IP cuando todavía no tiene ninguna.</p>

  <p><strong>El problema.</strong> Un equipo que acaba de arrancar no tiene dirección IP,
  así que no puede enviar un paquete dirigido a nadie. La solución es hablar en broadcast:
  origen <code>0.0.0.0</code>, destino <code>255.255.255.255</code>, y que conteste quien
  sepa.</p>

  <h3>DORA: los cuatro mensajes</h3>

  <figure class="dora">
    <ol class="dora__list">
      <li><span class="dora__k">D</span><b>Discover</b><span>Cliente → broadcast. «¿Hay algún servidor DHCP?»</span></li>
      <li><span class="dora__k">O</span><b>Offer</b><span>Servidor → cliente. «Te ofrezco 10.2.3.170»</span></li>
      <li><span class="dora__k">R</span><b>Request</b><span>Cliente → broadcast. «Acepto esa». Va en broadcast para que los demás servidores retiren su oferta.</span></li>
      <li><span class="dora__k">A</span><b>Acknowledge</b><span>Servidor → cliente. «Confirmado, y aquí van máscara, gateway y DNS»</span></li>
    </ol>
    <figcaption>El intercambio DORA. Renovar una concesión ya existente usa solo Request y ACK.</figcaption>
  </figure>

  <?= filter_chip('dhcp') ?>

  <?= note('Si el filtro «dhcp» no te funciona',
      '<p>El protocolo se llamaba <code>bootp</code> en Wireshark hasta la versión 2.6,
      porque DHCP es técnicamente una extensión de BOOTP. Desde entonces el nombre correcto
      es <code>dhcp</code>. Si sigues un tutorial antiguo que usa <code>bootp</code> y no te
      funciona, ya sabes por qué. Con Wireshark 4.x usa <code>dhcp</code>.</p>', 'info') ?>

  <p>Para provocar un intercambio completo, renueva la concesión mientras capturas. En un
  sistema con NetworkManager basta con desconectar y reconectar la interfaz.</p>

  <p>El tipo de mensaje va en la opción 53:</p>

  <?= filter_chip('dhcp.option.dhcp == 1') ?>
  <p>Discover. Los valores son 1=Discover, 2=Offer, 3=Request, 5=ACK, 6=NAK, 7=Release.</p>

  <h3>Qué mirar en un paquete DHCP</h3>

  <ul>
    <li><code>dhcp.hw.mac_addr</code> — la MAC del cliente. Es lo que identifica al equipo
    en todo el intercambio.</li>
    <li><code>dhcp.option.hostname</code> — <strong>el nombre que el equipo se da a sí
    mismo</strong>. En una red desconocida, filtrar DHCP y leer esta opción es la forma más
    rápida de saber qué dispositivos hay: los nombres suelen delatar el modelo y el dueño.</li>
    <li><code>dhcp.option.requested_ip_address</code> — la IP que pide, normalmente la que
    tenía antes.</li>
    <li>En el ACK, las opciones de <strong>router</strong> (gateway) y <strong>Domain Name
    Server</strong>: la configuración de red completa que va a usar el equipo.</li>
  </ul>

  <?= filter_chip('dhcp.option.hostname') ?>

  <h3 class="ciber-head">Ciberseguridad: dos cosas que mirar</h3>

  <ul>
    <li><strong>Servidor DHCP inesperado.</strong> Si en tus capturas aparecen Offers desde
    una IP o una MAC que no es la de tu router, hay un segundo servidor DHCP en la red. Casi
    siempre es un accidente —alguien enchufó un router doméstico por el puerto equivocado—,
    pero un DHCP falso puede repartir un gateway y un DNS controlados por un tercero, y eso
    redirige todo el tráfico del que le haga caso.</li>
    <li><strong>Inventario.</strong> DHCP es el mejor censo de una red: cada dispositivo que
    se conecta pasa por aquí, con su MAC y su nombre. Guarda esa lista; es la base para
    detectar el día que aparezca uno que no reconoces.</li>
  </ul>

  <p><strong>Práctica.</strong> Captura mientras reconectas la wifi, filtra <code>dhcp</code>
  y localiza los cuatro mensajes. En el ACK, despliega las opciones y anota gateway y DNS:
  compáralos con lo que devuelven <code>ip route</code> y <code>resolvectl status</code>.
  Deben coincidir; si no coinciden, algo ha cambiado tu configuración después.</p>
</section>

<!-- ============================== HTTP ============================== -->
<section id="http">
  <h2>HTTP</h2>
  <p class="tut-sub">Texto plano: todo lo que se ve, se ve porque nadie lo cifró.</p>

  <p>HTTP es una conversación en texto sobre TCP. El cliente manda una petición, el servidor
  una respuesta, y ambas tienen la misma forma: una línea inicial, unas cabeceras, una línea
  en blanco y un cuerpo opcional.</p>

  <?= filter_chip('http') ?>

  <?= term('<span class="p">$</span> curl -s -o /dev/null http://neverssl.com') ?>

  <h3>La petición</h3>

  <?= term('GET / HTTP/1.1' . "\n"
         . 'Host: neverssl.com' . "\n"
         . 'User-Agent: curl/8.x' . "\n"
         . 'Accept: */*', 'petición http') ?>

  <ul>
    <li><strong>Método</strong> — <code>GET</code> pide, <code>POST</code> envía datos en el
    cuerpo, <code>HEAD</code> pide solo las cabeceras, <code>PUT</code> y
    <code>DELETE</code> modifican recursos.</li>
    <li><strong>Host</strong> — obligatorio en HTTP/1.1. Permite alojar muchos sitios en una
    IP, y es el campo que te dice a qué sitio se pedía realmente.</li>
    <li><strong>User-Agent</strong> — quién dice ser el cliente. Es texto libre y se puede
    poner cualquier cosa, pero delata la herramienta.</li>
  </ul>

  <h3>La respuesta</h3>

  <?= term('HTTP/1.1 200 OK' . "\n"
         . 'Content-Type: text/html' . "\n"
         . 'Content-Length: 1256' . "\n"
         . '...', 'respuesta http') ?>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Familias de códigos de estado HTTP</caption>
      <thead><tr><th scope="col">Rango</th><th scope="col">Familia</th><th scope="col">Ejemplos</th></tr></thead>
      <tbody>
        <tr><td class="f">2xx</td><td class="d">Éxito</td><td class="d">200 OK · 204 sin contenido</td></tr>
        <tr><td class="f">3xx</td><td class="d">Redirección</td><td class="d">301 permanente · 302 temporal · 304 no modificado</td></tr>
        <tr><td class="f">4xx</td><td class="d">Error del cliente</td><td class="d">401 no autenticado · 403 prohibido · 404 no existe</td></tr>
        <tr><td class="f">5xx</td><td class="d">Error del servidor</td><td class="d">500 interno · 502 puerta de enlace · 503 no disponible</td></tr>
      </tbody>
    </table>
  </div>

  <?= filter_chip('http.request') ?>
  <?= filter_chip('http.request.method == "GET"') ?>
  <?= filter_chip('http.response.code >= 400') ?>
  <?= filter_chip('http.host contains "example"') ?>
  <?= filter_chip('http.user_agent') ?>

  <h3>Extraer los ficheros que viajaron</h3>

  <p><strong>File → Export Objects → HTTP</strong> lista todos los objetos que pasaron por
  la captura —páginas, imágenes, scripts, descargas— con su host, tamaño y tipo, y te los
  reconstruye en disco. En una investigación es la forma de recuperar exactamente qué se
  descargó.</p>

  <?= note('Precaución al exportar',
      '<p>Si sospechas que un fichero descargado es malicioso, no lo exportes al equipo con
      el que estás trabajando. Usa una máquina aislada, y trátalo como lo que es: una
      muestra. Del mismo modo, un objeto exportado es evidencia: anota de qué trama salió y
      calcula su hash antes de tocarlo.</p>') ?>

  <h3 class="ciber-head">Ciberseguridad: por qué HTTP sin cifrar es un problema</h3>

  <p>Con HTTP, cualquiera que esté en el camino ve la petición completa: la URL, las
  cabeceras, las cookies de sesión y el cuerpo del POST. No hace falta ninguna herramienta
  especial ni ningún ataque: está ahí, en claro, y Wireshark simplemente lo muestra.</p>

  <p>Cosas concretas que quedan expuestas y por qué importan:</p>

  <ul>
    <li><strong>La URL completa</strong>, incluidos parámetros. Si una aplicación pasa un
    identificador de sesión o un token en la query string, viaja visible.</li>
    <li><strong>Las cookies</strong> (<code>http.cookie</code>). Una cookie de sesión
    interceptada equivale a la sesión: por eso existe la marca <code>Secure</code>.</li>
    <li><strong>El cuerpo de un POST</strong> (<code>http.file_data</code>): el formulario
    tal cual se envió.</li>
    <li><strong>La cabecera Authorization</strong> (<code>http.authorization</code>). En
    autenticación básica es el usuario y la contraseña, solo codificados en Base64 — que no
    es cifrado, es una forma de escribirlos.</li>
  </ul>

  <?= filter_chip('http.authorization') ?>
  <?= filter_chip('http.request.method == "POST" && http.content_type contains "form"') ?>

  <p>Indicadores de tráfico HTTP que merece revisar:</p>

  <ul>
    <li><strong>User-Agent llamativo:</strong> vacío, muy corto, con errores de escritura, o
    de una herramienta que nadie debería estar usando en ese equipo. Recuerda que es texto
    libre: un agente que dice ser un navegador puede no serlo, y uno raro puede ser un
    dispositivo legítimo mal programado.</li>
    <li><strong>Peticiones a una IP en vez de a un nombre.</strong> Un navegador humano
    llega casi siempre por DNS; una petición a <code>http://203.0.113.9/algo</code> sin
    consulta DNS previa es, como mínimo, distinta del resto.</li>
    <li><strong>Métodos poco habituales</strong> en un cliente de escritorio: PUT, DELETE,
    o un CONNECT hacia un destino inesperado.</li>
    <li><strong>La misma petición repetida a intervalos regulares</strong>, con respuestas
    pequeñas y casi idénticas. Es el patrón de beaconing, que tiene sección propia.</li>
    <li><strong>Descargas de ejecutables</strong> por HTTP: mira los tipos en Export Objects.</li>
  </ul>

  <?= filter_chip('http.user_agent matches "(?i)curl|wget|python|powershell"') ?>

  <p><strong>Error común.</strong> Filtrar <code>http</code> y concluir que no hay tráfico
  web. Hoy casi todo es HTTPS, y con HTTPS no hay ningún paquete que Wireshark clasifique
  como <code>http</code>: el disector solo ve TLS. Para ver el tráfico web real filtra
  <code>tls</code> o <code>tcp.port == 443</code>. Y si una aplicación usa HTTP en un puerto
  raro, <strong>clic derecho → Decode As…</strong> le dice a Wireshark que lo interprete
  como HTTP.</p>
</section>

<!-- ============================== TLS =============================== -->
<span id="e6" class="legacy-anchor" aria-hidden="true"></span>
<section id="tls">
  <h2>HTTPS y TLS</h2>
  <p class="tut-sub">Qué protege exactamente el cifrado — y qué sigue estando a la vista.</p>
  <p class="tut-goal">Objetivo: entender qué protege TLS exactamente y qué no.</p>

  <?= filter_chip('tls') ?>

  <?= term('<span class="p">$</span> curl -s -o /dev/null https://archlinux.org') ?>

  <p>Ahora el Follow Stream devuelve ruido binario: el contenido está cifrado. Pero el
  <em>sobre</em> no lo está. Selecciona el primer paquete, el <strong>Client Hello</strong>,
  y despliega hasta las extensiones. Busca <code>server_name</code>:</p>

  <?= filter_chip('tls.handshake.extensions_server_name') ?>

  <p>Ahí está <code>archlinux.org</code>, en texto plano. Es el SNI: el cliente tiene que
  decir a qué sitio se conecta <em>antes</em> de que exista el cifrado, porque una misma IP
  aloja muchos dominios y el servidor necesita saber qué certificado enviar.</p>

  <p>Así que un observador en la red ve: tu IP, la IP del servidor, el dominio (por SNI y
  por DNS), el momento, el volumen y el ritmo del tráfico. Lo que no ve es el contenido:
  qué páginas concretas, qué escribiste, qué te devolvieron.</p>

  <p>Despliega también el <strong>Certificate</strong> en la respuesta del servidor — está
  sin cifrar y contiene el emisor, la validez y el nombre común. Es exactamente lo que tu
  navegador comprueba.</p>

  <h3>El handshake, mensaje a mensaje</h3>

  <p>El campo <code>tls.handshake.type</code> identifica cada paso:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Mensajes del handshake TLS</caption>
      <thead><tr><th scope="col">Tipo</th><th scope="col">Mensaje</th><th scope="col">Qué lleva y qué se ve</th></tr></thead>
      <tbody>
        <tr><td class="f">1</td><td class="d">Client Hello</td><td class="d">Versiones que acepta, cipher suites que soporta, y el <strong>SNI en claro</strong>. Su combinación concreta de opciones es tan característica del cliente que se usa como huella (JA3/JA4).</td></tr>
        <tr><td class="f">2</td><td class="d">Server Hello</td><td class="d">La versión y el cipher suite elegidos. A partir de aquí, en TLS 1.3, casi todo lo demás va cifrado.</td></tr>
        <tr><td class="f">11</td><td class="d">Certificate</td><td class="d">La cadena de certificados. En TLS 1.2 va en claro; en 1.3 va cifrada.</td></tr>
        <tr><td class="f">16</td><td class="d">Client Key Exchange</td><td class="d">Material para derivar la clave (solo TLS 1.2 y anteriores).</td></tr>
      </tbody>
    </table>
  </div>

  <?= filter_chip('tls.handshake.type == 1') ?>
  <?= filter_chip('tls.handshake.type == 2') ?>
  <?= filter_chip('tls.handshake.type == 11') ?>

  <?= note('TLS 1.2 y 1.3 no enseñan lo mismo',
      '<p>En TLS 1.2 el certificado del servidor viaja en claro, así que puedes leer a quién
      pertenece. En TLS 1.3, que ya es lo normal, el certificado va cifrado y esa
      información desaparece de la captura. Lo que sí sigue viéndose en ambos es el
      <strong>SNI del Client Hello</strong>. Si en una captura reciente no encuentras
      certificados legibles, no es que falte: es TLS 1.3 funcionando.</p>', 'info') ?>

  <p>Distinguir la versión tiene truco: <code>tls.record.version</code> suele valer 1.2 por
  compatibilidad incluso en conexiones 1.3. La versión real negociada está en la extensión
  <em>supported_versions</em> del Server Hello. Si necesitas inventariar versiones de TLS,
  fíjate en esa, no en la del registro.</p>

  <?= filter_chip('tls.alert_message') ?>
  <p>Las alertas TLS marcan handshakes fallidos: certificado caducado, autoridad
  desconocida, no hay cipher suite en común. Es lo primero que hay que mirar cuando una
  aplicación «no conecta» y no da más detalle.</p>

  <h3 class="ciber-head">Ciberseguridad: analizar lo que no puedes leer</h3>

  <p>Que el contenido esté cifrado no deja al analista sin nada. Estos son los metadatos que
  siguen siendo válidos:</p>

  <ul>
    <li><strong>El SNI</strong> — el destino real, aunque el contenido no se vea. Es el dato
    más valioso de una conexión TLS.</li>
    <li><strong>El tamaño y el ritmo</strong> — una conexión que envía 200 bytes cada 60
    segundos exactos tiene una forma reconocible aunque no sepas qué dice.</li>
    <li><strong>La duración</strong> — conexiones muy largas y muy silenciosas destacan
    frente a la navegación normal.</li>
    <li><strong>El cipher suite y la huella del Client Hello</strong> — dos programas
    distintos negocian TLS de forma distinta. Un cliente cuya huella no coincide con ningún
    navegador conocido, en un equipo donde solo debería haber navegadores, es una anomalía.</li>
    <li><strong>Certificados llamativos</strong> (cuando son visibles): autofirmados, con
    validez muy corta, o con campos de organización claramente generados.</li>
  </ul>

  <?= filter_chip('tls.handshake.extensions_server_name contains "duckdns"') ?>
  <p>Ejemplo del método: buscar en el SNI proveedores de DNS dinámico, muy usados para
  infraestructura efímera. Sustituye la cadena por lo que estés investigando. Y recuerda que
  esos servicios también tienen usos completamente legítimos.</p>

  <h3>Qué queda a la vista y qué no</h3>

  <?= shot('wireshark/19-tls-que-se-ve.svg',
      'Dos columnas: a la izquierda lo visible en una conexión TLS —nombre del servidor en '
      . 'el Client Hello, IP, puerto, versión, cifrado, volumen y momento—; a la derecha lo '
      . 'que no se ve —URL, cabeceras, cookies, cuerpo y respuesta—.',
      '<b>Dónde mirar:</b> la columna izquierda. Eso es lo que un analista tiene sobre una '
      . 'conexión cifrada — y para investigar suele bastar. El dominio y la dirección son '
      . 'de laboratorio; en tu captura verás los del sitio que hayas visitado.') ?>

  <?= pitfall('<p>Concluir que «con HTTPS Wireshark no sirve». Sirve bastante: ve con quién
      hablas (el <strong>SNI</strong> del Client Hello va en claro), cuándo, cuánto y con qué
      ritmo. Lo que no ve es el contenido. La frase correcta no es «no ve nada», sino
      <strong>ve los metadatos, no el contenido</strong> — y media investigación se hace con
      metadatos.</p>') ?>

  <?= recap('Protocolos', [
      'Cada protocolo responde a una pregunta distinta, y por eso se leen en orden: ARP resuelve IP→MAC, IP entrega entre redes, TCP garantiza el orden, DNS traduce nombres y TLS envuelve el contenido.',
      'ARP no comprueba quién responde. Dos MAC para una misma IP es un hecho que se investiga, no una conclusión.',
      'El saludo de tres vías se lee en los flags, no en la columna Info: SYN sin ACK identifica quién inició la conversación.',
      'DNS va sobre UDP y solo el Transaction ID empareja pregunta y respuesta.',
      'TLS deja a la vista el nombre del servidor, el volumen y el ritmo. El contenido, no.',
  ], [
      'arp · icmp · dns · tls',
      'tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0',
      'tls.handshake.type == 1',
      'dns.flags.response == 0',
  ], [
      'Un <code>RST</code> es normal; lo que se mira es su TTL comparado con el del resto de ese extremo.',
      'No ver tráfico DNS puede significar DNS cifrado, no ausencia de resolución.',
      'Con TLS 1.3 es normal no ver certificados: van cifrados.',
  ]) ?>

  <?= quiz([
      [
          'q' => 'En una conexión TCP, ¿qué paquete identifica sin ambigüedad a quien inició la conversación?',
          'opts' => ['A' => 'El primero de la captura', 'B' => 'El que lleva SYN y no lleva ACK', 'C' => 'El que usa el puerto más bajo', 'D' => 'El que lleva más bytes'],
          'ok' => 'B',
          'why' => 'Es el único paquete de toda la conexión con esa combinación de flags: el SYN-ACK del servidor lleva los dos, y a partir del tercer paquete todos llevan ACK. No hace falta saber qué puerto es cuál.',
      ],
      [
          'q' => 'Capturas una conexión HTTPS a un sitio. ¿Cuál de estos datos NO vas a poder leer?',
          'opts' => ['A' => 'El nombre del servidor en el Client Hello', 'B' => 'La dirección IP de destino', 'C' => 'La URL concreta que se pidió', 'D' => 'El volumen de bytes intercambiado'],
          'ok' => 'C',
          'why' => 'La ruta viaja dentro de la petición HTTP, que va cifrada. El nombre del servidor sí se ve, porque el SNI se envía en claro en el Client Hello para que el servidor sepa qué certificado presentar — antes de que exista cifrado.',
      ],
      [
          'q' => 'Ves dos respuestas ARP que anuncian la IP del gateway con MAC distintas. ¿Qué puedes afirmar?',
          'opts' => ['A' => 'Que hay un ataque de ARP spoofing', 'B' => 'Que el gateway está mal configurado', 'C' => 'Que hay una incoherencia que hay que contrastar con la línea base', 'D' => 'Que la captura está corrupta'],
          'ok' => 'C',
          'why' => 'La evidencia es la incoherencia, y es real. La causa no está determinada: un failover, un router con dos interfaces o una VM recién arrancada la producen igual. Afirmar «ataque» con solo este dato es exactamente el salto que este tutorial intenta evitar.',
      ],
  ]) ?>

</section>

<?= chapter('03', 'Wireshark a fondo', 'Las herramientas del programa que convierten una lista de paquetes en una investigación.', 'intermedio') ?>

<!-- ============================= FOLLOW ============================= -->
<span id="e5" class="legacy-anchor" aria-hidden="true"></span>
<section id="follow">
  <h2>Follow Stream</h2>
  <p class="tut-sub">Dejar de mirar paquetes sueltos y ver el diálogo.</p>
  <p class="tut-goal">Objetivo: dejar de mirar paquetes sueltos y ver el diálogo.</p>

  <p>Un paquete aislado dice poco. Lo interesante es la conversación reensamblada. Con la
  captura de HTTP del ejercicio anterior todavía abierta, clic derecho en cualquier paquete
  de esa conexión → <strong>Follow → TCP Stream</strong>.</p>

  <p>Se abre una ventana con el diálogo completo en texto: en un color lo que tú enviaste,
  en otro lo que respondió el servidor. Verás literalmente la petición HTTP:</p>

  <?= term("GET / HTTP/1.1\nHost: neverssl.com\nUser-Agent: curl/8.x\nAccept: */*\n\nHTTP/1.1 200 OK\nContent-Type: text/html\n...", 'follow tcp stream') ?>

  <p>Eso es lo que significa que HTTP «no es seguro»: no hace falta ninguna herramienta
  especial, está ahí en claro. Fíjate en que el <code>User-Agent</code> te identifica y el
  <code>Host</code> dice qué sitio pides.</p>

  <p>Al cerrar la ventana, Wireshark deja puesto un filtro <code>tcp.stream eq N</code>. Ese
  número identifica la conexión dentro de la captura, y es una de las formas más rápidas de
  moverse: cambia el número y saltas a otra conversación.</p>

  <p>Prueba también <strong>File → Export Objects → HTTP</strong>: Wireshark lista todos
  los ficheros que viajaron por la captura (páginas, imágenes, scripts) y te los guarda en
  disco reconstruidos.</p>

  <h3>La ruta completa del menú</h3>

  <p>La entrada oficial es <strong>Analyze → Follow</strong>, y también está en el menú
  contextual de la lista de paquetes. El submenú ofrece un tipo de flujo por protocolo:
  TCP, UDP, DCCP, TLS, HTTP, HTTP/2, QUIC, WebSocket, SIP y USB CDC. Elegir el correcto
  importa:</p>

  <ul>
    <li><strong>TCP Stream</strong> te da el flujo de bytes tal cual viajó, con las
    cabeceras HTTP incluidas.</li>
    <li><strong>HTTP Stream</strong> aplica además la descompresión: si la respuesta venía
    con <code>Content-Encoding: gzip</code>, aquí la ves legible y en TCP Stream no.</li>
    <li><strong>TLS Stream</strong> muestra el contenido descifrado, y solo sirve si has
    configurado las claves como se explica más abajo.</li>
  </ul>

  <h3>El diálogo por dentro</h3>

  <p>Abajo del todo hay tres controles que se pasan por alto:</p>

  <ul>
    <li>Un desplegable de <strong>dirección</strong>: la conversación entera, solo
    cliente→servidor o solo servidor→cliente. Aislar un sentido es lo que hace legible una
    conversación larga.</li>
    <li><strong>Show data as</strong>, con los formatos <em>ASCII</em>, <em>C Arrays</em>,
    <em>EBCDIC</em>, <em>HEX Dump</em>, <em>UTF-8</em>, <em>UTF-16</em>, <em>YAML</em> y
    <em>Raw</em>. Si ASCII se ve como basura, el contenido es binario: pasa a HEX Dump, que
    muestra offset, hexadecimal y texto a la vez.</li>
    <li>Un campo de <strong>búsqueda</strong> dentro del flujo, y los botones para navegar
    entre streams sin cerrar la ventana.</li>
  </ul>

  <h3>Limitaciones</h3>

  <ul>
    <li><strong>Solo reconstruye lo que capturaste.</strong> Si empezaste a capturar a
    mitad de la conexión, faltará el principio y Wireshark lo indicará.</li>
    <li><strong>Necesita el flujo completo.</strong> Con paquetes perdidos, aparecen huecos.</li>
    <li><strong>No descifra por sí solo.</strong> Sin claves, TLS es binario.</li>
    <li><strong>Se carga en memoria.</strong> Seguir una descarga de dos gigabytes puede
    dejar el programa inutilizable un buen rato.</li>
    <li><strong>El texto que ves es datos, no comandos.</strong> Un flujo puede contener
    cualquier cosa que el otro extremo haya querido enviar; trátalo como material a
    analizar.</li>
  </ul>

  <h3>Cómo se ve una conversación reconstruida</h3>

  <?= shot('wireshark/13-follow-stream.svg',
      'Ventana de Follow TCP Stream con la petición del cliente en un color y la respuesta '
      . 'del servidor en otro, incluidas las cabeceras HTTP y el comienzo del HTML.',
      '<b>Qué estás viendo:</b> los datos de todos los paquetes de una conexión, pegados '
      . 'en orden y sin cabeceras de TCP. <b>Dónde mirar:</b> los dos colores — separan '
      . 'quién dijo qué.',
      'real') ?>

  <?= pitfall('<p>Usar Follow Stream sobre HTTPS y concluir que «está roto». No lo está:
      lo que muestra es exactamente lo que viajó, y lo que viajó estaba cifrado. Follow
      Stream reconstruye <em>bytes</em>, no descifra.</p>') ?>

</section>

<!-- =========================== STATISTICS =========================== -->
<span id="e8" class="legacy-anchor" aria-hidden="true"></span>
<section id="statistics">
  <h2>El menú Statistics</h2>
  <p class="tut-sub">Pasar del paquete al panorama. Aquí es donde se diagnostica de verdad.</p>
  <p class="tut-goal">Objetivo: pasar del paquete al panorama. Aquí es donde se diagnostica de verdad.</p>

  <p>Captura treinta segundos de navegación normal, para y recorre el menú
  <strong>Statistics</strong>:</p>

  <h4>Protocol Hierarchy</h4>
  <p>Un desglose porcentual de todo lo capturado por protocolo. Es la primera parada ante
  una captura desconocida: en diez segundos sabes si esto es sobre todo TLS, o hay un
  torrente de UDP, o alguien está haciendo mucho DNS.</p>

  <h4>Conversations</h4>
  <p>Una fila por par de extremos, con bytes y duración. Ordena por la columna
  <strong>Bytes</strong> descendente y tienes al instante quién está consumiendo el ancho de
  banda. Clic derecho en una fila → Apply as Filter para bajar al detalle.</p>

  <h4>Endpoints</h4>
  <p>Lo mismo pero por dirección individual, no por pareja. La pestaña IPv4 tiene una
  casilla de resolución geográfica útil para ver adónde sale tu tráfico.</p>

  <h4>I/O Graph</h4>
  <p>Tráfico en el tiempo. Sirve para ver picos, cortes y patrones periódicos. Puedes añadir
  varias líneas, cada una con su propio display filter — por ejemplo una con
  <code>tcp.analysis.retransmission</code> superpuesta al total, y si las retransmisiones
  suben cuando sube el tráfico, tienes congestión.</p>

  <h4>Expert Information</h4>
  <p>La lista de todo lo que Wireshark considera anómalo, clasificado por severidad.
  Retransmisiones, ACKs duplicados, ventanas a cero, conexiones reiniciadas. Ante «la red va
  lenta», este diálogo es el atajo.</p>

  <p>Y el filtro de diagnóstico que más se usa:</p>

  <?= filter_chip('tcp.analysis.flags') ?>

  <p>Muestra solo los paquetes que Wireshark ha marcado como problemáticos. En una red sana,
  apenas aparece nada.</p>

  <h3>Cómo se usan de verdad en una investigación</h3>

  <p>Cada diálogo responde a una pregunta distinta. En este orden:</p>

  <h4>Capture File Properties · ¿me puedo fiar de esta captura?</h4>
  <p>Antes que nada. Da el intervalo temporal cubierto, el número de paquetes y —lo
  importante— <strong>cuántos se descartaron</strong>. Si hay descartes, cualquier
  conclusión sobre pérdidas es sospechosa: puede que el problema fuera tu propio equipo
  capturando. También tiene un campo de comentarios que se guarda dentro del
  <code>.pcapng</code>: úsalo para anotar dónde y cuándo capturaste.</p>

  <h4>Protocol Hierarchy · ¿qué hay aquí dentro?</h4>
  <p>El árbol con el porcentaje de bytes de cada protocolo. Lo que hay que buscar no es un
  valor concreto sino <strong>lo que no encaja</strong>: un protocolo que no debería estar
  en ese segmento, un porcentaje de «Data» alto (tráfico que Wireshark no supo clasificar,
  a menudo por ir en puertos no estándar), o UDP dominando donde esperabas TCP. Clic derecho
  en cualquier fila → Apply as Filter para bajar al detalle.</p>

  <h4>Conversations · ¿quién habla con quién?</h4>
  <p>Una fila por par de extremos, con pestañas Ethernet, IPv4, IPv6, TCP y UDP. Tres
  columnas que se leen juntas: <strong>Bytes A→B</strong> y <strong>B→A</strong> (la
  asimetría cuenta la historia: descargar es normal, subir mucho no siempre),
  <strong>Duration</strong> y <strong>Bits/s</strong>.</p>
  <p>Marca la casilla <strong>Limit to display filter</strong> para que el diálogo respete
  el filtro que tengas puesto. Sin ella verás la captura entera y te preguntarás por qué no
  cuadran los números.</p>

  <h4>Endpoints · ¿con cuántos sitios distintos?</h4>
  <p>Por dirección individual. La pestaña IPv4 admite resolución geográfica si tienes las
  bases de datos de MaxMind configuradas. Ordenar por número de paquetes revela al instante
  los destinos dominantes; ordenar por número de <em>conversaciones</em> revela a un equipo
  que habla con muchísimos sitios, que es la forma de un escaneo.</p>

  <h4>Packet Lengths · ¿qué forma tiene este tráfico?</h4>
  <p>Un histograma por rangos de tamaño. Es más útil de lo que parece porque cada tipo de
  tráfico tiene su perfil: la navegación mezcla paquetes pequeños (peticiones, ACK) con
  grandes (contenido). Un flujo compuesto casi solo de paquetes pequeños de tamaño casi
  idéntico no se parece a navegación humana — puede ser telemetría, una sesión interactiva
  o un canal de control.</p>

  <h4>I/O Graphs · ¿cuándo pasó?</h4>
  <p>El eje del tiempo. Añade una línea por filtro, ajusta el intervalo y compara. Con
  intervalos de un segundo ves ráfagas; con intervalos de un minuto ves patrones de fondo.
  Es la herramienta central para detectar periodicidad, y aparece otra vez en la sección de
  beaconing.</p>

  <h4>Flow Graph · ¿en qué orden?</h4>
  <p>Un diagrama de secuencia con el tiempo en vertical y los equipos en columnas. Limitado
  al flujo TCP que estés investigando, es la mejor forma de explicarle a otra persona qué
  pasó en una conexión: se ve el handshake, los datos y el cierre como una escalera.</p>

  <h3>Protocol Hierarchy: de qué está hecha una captura</h3>

  <?= shot('wireshark/14-protocol-hierarchy.svg',
      'Árbol de protocolos con Frame al 100 %, Ethernet al 100 %, IPv4 al 100 %, ICMP al '
      . '37,5 %, TCP al 62,5 % y HTTP al 12,5 %, con el número de paquetes y de bytes de cada uno.',
      '<b>Qué estás viendo:</b> la composición de una captura entera antes de leer un solo '
      . 'paquete. <b>Dónde mirar:</b> lo que <em>no</em> esperabas encontrar: un protocolo '
      . 'que no debería estar ahí salta a la vista en esta pantalla y en ninguna otra.',
      'real') ?>

  <h3>Conversations: quién habla con quién, y cuánto</h3>

  <?= shot('wireshark/15-conversations.svg',
      'Tabla de conversaciones TCP con direcciones, puertos, paquetes, bytes totales y '
      . 'bytes en cada sentido; las dos columnas de sentido aparecen resaltadas.',
      '<b>Dónde mirar:</b> las columnas A→B y B→A. La <em>asimetría</em> es el dato: '
      . '351 bytes de subida contra 2 940 de bajada es una descarga corriente.',
      'real') ?>

  <?= evidence(
      '<p>Una conversación muestra 40 MB en sentido A→B y 300 KB en sentido B→A, sostenidos
      durante veinte minutos hacia una IP externa.</p>',
      '<p>El perfil encaja con una <strong>subida masiva de datos</strong>: alguien o algo
      está sacando información del equipo.</p>',
      '<p>Que sea exfiltración. Una copia de seguridad en la nube, la sincronización de un
      cliente de almacenamiento, una subida de vídeo o el envío de un adjunto grande
      producen exactamente esa forma. Lo que hay que averiguar antes de afirmar nada: qué
      proceso abrió la conexión, si el destino aparece en la línea base del equipo, y si el
      horario encaja con la actividad normal de esa máquina.</p>') ?>

</section>

<!-- ============================ EXPERT ============================== -->
<section id="expert">
  <h2>Expert Information</h2>
  <p class="tut-sub">La lista de todo lo que a Wireshark le ha parecido raro.</p>

  <p>Se abre en <strong>Analyze → Expert Information</strong>, o pulsando el círculo de
  color de la esquina inferior izquierda. Agrupa los avisos por tipo, con el número de
  ocurrencias y un desplegable con los paquetes concretos.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Niveles de severidad de Expert Information</caption>
      <thead><tr><th scope="col">Nivel</th><th scope="col">Qué agrupa</th><th scope="col">Ejemplos</th></tr></thead>
      <tbody>
        <tr><td class="f">Error</td><td class="d">Algo está mal formado o es inválido</td><td class="d">Paquete malformado, checksum incorrecto</td></tr>
        <tr><td class="f">Warning</td><td class="d">Comportamiento anómalo del protocolo</td><td class="d">Conexión reiniciada, ventana a cero, ACK de segmento no visto</td></tr>
        <tr><td class="f">Note</td><td class="d">Comportamiento normal pero digno de mención</td><td class="d">Retransmisión, ACK duplicado, fuera de orden</td></tr>
        <tr><td class="f">Chat</td><td class="d">Eventos normales del flujo</td><td class="d">SYN, FIN, petición HTTP</td></tr>
        <tr><td class="f">Comment</td><td class="d">Comentarios añadidos a paquetes</td><td class="d">Anotaciones tuyas guardadas en el pcapng</td></tr>
      </tbody>
    </table>
  </div>

  <p>El desplegable <strong>Severity</strong> filtra la vista, y la casilla <strong>Limit to
  Display Filter</strong> restringe el análisis a lo que estés mirando — imprescindible en
  capturas grandes, donde la lista completa es inmanejable.</p>

  <p>Cada línea tiene un menú contextual con <strong>Apply as Filter</strong>: de la lista
  agregada saltas directamente a los paquetes implicados.</p>

  <?= note('Expert Information no dice que haya un ataque',
      '<p>Conviene repetirlo porque es el error de interpretación más común. Este diálogo
      es un <strong>detector de anomalías de protocolo</strong>, no de seguridad. Una
      captura de red doméstica normal tiene decenas de <em>Notes</em>: retransmisiones por
      wifi, ACK duplicados, segmentos fuera de orden. Eso es TCP trabajando, no un ataque.</p>
      <p>Y al revés: un ataque bien hecho puede no generar <em>ni una sola</em> entrada aquí,
      porque respeta el protocolo perfectamente. Expert Information te dice dónde el
      protocolo se comporta de forma inusual. Lo que eso significa lo decides tú, con el
      contexto.</p>') ?>

  <p><strong>Práctica.</strong> Abre Expert Information sobre una captura de tu navegación
  normal. Anota qué avisos aparecen y cuántos. Esa es tu línea base: la próxima vez que
  investigues algo, sabrás qué parte de la lista es simplemente cómo se comporta tu red.</p>

  <h3>Los cuatro niveles, y qué significa cada uno</h3>

  <?= shot('wireshark/16-expert-information.svg',
      'Los cuatro niveles de Expert Information —Error, Warning, Note y Chat— con su '
      . 'descripción y un mensaje de ejemplo para cada uno.',
      '<b>Dónde mirar:</b> los ejemplos de la derecha. <code>Previous segment not '
      . 'captured</code> suena grave y casi siempre significa que tu equipo iba justo de '
      . 'CPU mientras capturaba.') ?>

  <?= pitfall('<p>Leer «Warning» como «ataque». Expert Information describe
      <strong>anomalías de protocolo</strong>, no intenciones. En una red wifi con
      interferencias la pestaña se llena de avisos sin que haya absolutamente nadie
      haciendo nada malo. Sirve para saber si tu captura es fiable y si la red funciona,
      no para acusar.</p>') ?>

</section>

<!-- =========================== COLORING ============================= -->
<section id="coloring">
  <h2>Coloring rules</h2>
  <p class="tut-sub">Que la captura te avise antes de que la mires con detalle.</p>

  <p>Los colores de la lista de paquetes no son decorativos ni fijos: son una lista de
  reglas en <strong>View → Coloring Rules</strong>. Cada regla es un display filter con
  un color de fondo y otro de texto. Wireshark evalúa de arriba abajo y aplica
  <strong>la primera que coincide</strong>; el orden es, por tanto, la parte importante.</p>

  <p>Las reglas de fábrica ya dicen bastante: negro sobre rojo es «Checksum Errors», rojo
  claro es «Bad TCP» (retransmisiones, ACK duplicados, resets), gris es tráfico de control
  TCP como SYN y FIN. Por eso «negro sobre rojo casi siempre significa problema».</p>

  <h3>Crear una regla propia</h3>

  <?= steps([
      'Abre <strong>View → Coloring Rules</strong>.',
      'Pulsa <strong>+</strong>: aparece una regla nueva al principio de la lista.',
      'Ponle un nombre descriptivo, por ejemplo <em>DNS lento</em>.',
      'En el campo de filtro escribe la condición: <code>dns.time &gt; 0.5</code>.',
      'Con la regla seleccionada, elige <strong>Background</strong> y <strong>Foreground</strong>.',
      'Arrástrala por encima de las reglas más generales, o nunca llegará a evaluarse.',
      '<strong>OK</strong>. La lista se recolorea al instante.',
  ]) ?>

  <p>Un atajo que ahorra tiempo: clic derecho sobre un paquete → <strong>Colorize with
  Filter → New Coloring Rule…</strong> crea la regla con el filtro ya rellenado.</p>

  <h3>Un juego de reglas orientado a seguridad</h3>

  <p>Estas cinco, en este orden, hacen que las anomalías salten a la vista:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Reglas de coloreado propuestas para análisis defensivo</caption>
      <thead><tr><th scope="col">Nombre</th><th scope="col">Filtro</th><th scope="col">Para qué</th></tr></thead>
      <tbody>
        <tr><td class="d">SYN sin respuesta</td><td class="f">tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0</td><td class="d">Aperturas de conexión: un escaneo se ve como una franja de color.</td></tr>
        <tr><td class="d">Conexión rechazada</td><td class="f">tcp.flags.reset == 1</td><td class="d">Puertos cerrados y cortes abruptos.</td></tr>
        <tr><td class="d">DNS sin resolver</td><td class="f">dns.flags.rcode == 3</td><td class="d">NXDOMAIN, para verlos agrupados.</td></tr>
        <tr><td class="d">Texto sin cifrar</td><td class="f">http || ftp || telnet</td><td class="d">Protocolos que exponen contenido.</td></tr>
        <tr><td class="d">Salida de la red</td><td class="f">ip.src == 10.2.3.0/24 &amp;&amp; !(ip.dst == 10.2.3.0/24)</td><td class="d">Todo lo que abandona tu segmento.</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('Elige colores que se distingan de verdad',
      '<p>Rojo y verde son los dos colores que peor distingue una parte importante de la
      población. Si vas a montar tu propio juego de reglas, usa combinaciones que además
      varíen en luminosidad, y apóyate en el nombre de la regla: la columna de la derecha
      del diálogo lo muestra, y el menú <strong>View → Colorize Packet List</strong> permite
      apagar el coloreado entero cuando estorba.</p>', 'info') ?>

  <p>Las reglas se guardan en el <strong>perfil</strong> activo, en un fichero
  <code>colorfilters</code>. Se pueden exportar e importar desde el mismo diálogo, que es
  como se comparte un juego de reglas con un equipo.</p>

  <h3>Qué dice cada color</h3>

  <?= shot('wireshark/17-coloring-rules.svg',
      'Cinco reglas de color por defecto con el filtro que las dispara y lo que indican: '
      . 'rojo para problemas de TCP, amarillo para resets, azul para DNS e ICMP, gris para '
      . 'TCP corriente y verde para HTTP.',
      '<b>Dónde mirar:</b> la columna de la derecha. Cada color es <em>un filtro</em> que '
      . 'se cumple, nada más — y puedes cambiarlos todos.') ?>

  <?= pitfall('<p>El error más extendido de todo Wireshark: <strong>pensar que un paquete
      rojo significa un ataque</strong>. El rojo por defecto se dispara con
      <code>tcp.analysis.flags</code>, es decir, con retransmisiones y segmentos perdidos.
      En un wifi saturado la pantalla se pone roja entera y lo único que está pasando es
      que hay interferencias. El color indica <em>qué filtro se cumple</em>, no
      <em>qué intención hay detrás</em>.</p>') ?>

</section>

<!-- =========================== COLUMNAS ============================= -->
<section id="columnas">
  <h2>Columnas propias</h2>
  <p class="tut-sub">Ver el dato que importa sin abrir el árbol en cada paquete.</p>

  <p>Las columnas por defecto son genéricas. Al investigar un protocolo concreto, poner
  <em>ese</em> campo en una columna cambia la forma de trabajar: puedes ordenar por él,
  compararlo entre paquetes de un vistazo y exportarlo a CSV.</p>

  <h3>La forma rápida</h3>

  <p>Selecciona el campo en el árbol → clic derecho → <strong>Apply as Column</strong>. Ya
  está. Para quitarla, clic derecho en su cabecera → <strong>Remove this Column</strong>.</p>

  <p>La forma completa está en <strong>Edit → Preferences → Appearance → Columns</strong>,
  donde puedes reordenarlas, ocultarlas sin borrarlas y elegir el tipo (usa <em>Custom</em>
  y escribe el nombre del campo).</p>

  <h3>Columnas que merecen la pena</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Columnas personalizadas recomendadas</caption>
      <thead><tr><th scope="col">Columna</th><th scope="col">Campo</th><th scope="col">Por qué ayuda</th></tr></thead>
      <tbody>
        <tr><td class="d">Puerto origen</td><td class="f">tcp.srcport</td><td class="d">Distinguir cliente de servidor de un vistazo.</td></tr>
        <tr><td class="d">Puerto destino</td><td class="f">tcp.dstport</td><td class="d">Ordenando por él, un escaneo de puertos se ve como una escalera.</td></tr>
        <tr><td class="d">Stream</td><td class="f">tcp.stream</td><td class="d">Saber a qué conexión pertenece cada paquete sin abrir el árbol.</td></tr>
        <tr><td class="d">Consulta DNS</td><td class="f">dns.qry.name</td><td class="d">Leer todos los dominios consultados como una lista.</td></tr>
        <tr><td class="d">Host HTTP</td><td class="f">http.host</td><td class="d">Igual, para peticiones web sin cifrar.</td></tr>
        <tr><td class="d">SNI</td><td class="f">tls.handshake.extensions_server_name</td><td class="d">El destino real de cada conexión HTTPS. La columna más útil hoy.</td></tr>
        <tr><td class="d">TTL</td><td class="f">ip.ttl</td><td class="d">Agrupar orígenes y detectar incoherencias.</td></tr>
        <tr><td class="d">Delta de conexión</td><td class="f">tcp.time_delta</td><td class="d">Medir periodicidad dentro de una misma conexión.</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('Una columna vacía no significa que el campo no exista',
      '<p>Una columna personalizada solo se rellena en los paquetes que <em>tienen</em> ese
      campo. La columna SNI estará vacía en todos los paquetes salvo en los Client Hello, y
      eso es correcto. Combínala con el filtro adecuado (<code>tls.handshake.type == 1</code>)
      para ver solo las filas con dato.</p>', 'info') ?>

  <p>Con las columnas puestas, <strong>File → Export Packet Dissections → As CSV</strong>
  exporta exactamente esas columnas de los paquetes mostrados. Es la forma de llevar un
  hallazgo a una hoja de cálculo o a un informe.</p>
</section>

<!-- =========================== PERFILES ============================= -->
<section id="perfiles">
  <h2>Perfiles</h2>
  <p class="tut-sub">Un Wireshark distinto para cada tipo de trabajo.</p>

  <p>Un <strong>perfil</strong> es un conjunto completo de configuración: columnas, reglas
  de coloreado, filtros guardados, preferencias de disectores y diseño de paneles. Wireshark
  guarda cada uno en su propio directorio y se cambia entre ellos al instante.</p>

  <p>La razón de usarlos es práctica: la configuración que quieres para diagnosticar una red
  lenta no es la que quieres para investigar un incidente. En vez de reconfigurar cada vez,
  cambias de perfil.</p>

  <h3>Crear uno</h3>

  <?= steps([
      'Abre <strong>Edit → Configuration Profiles</strong> (o pulsa la esquina inferior derecha de la barra de estado, donde pone el perfil actual).',
      'Pulsa <strong>+</strong> y ponle nombre, por ejemplo <em>Cybersecurity</em>.',
      'Con el perfil ya activo, añade las columnas de la sección anterior.',
      'Añade las reglas de coloreado de la sección de coloring rules.',
      'Guarda como botón los filtros que más repitas, con el <strong>+</strong> de la barra de filtros.',
      'Ajusta Preferences → Protocols → TCP para activar los timestamps de conversación.',
  ]) ?>

  <p>Para partir de una copia de otro perfil en vez de empezar en blanco, selecciónalo y usa
  el botón de <strong>copiar</strong> del mismo diálogo.</p>

  <p>Los perfiles viven en el directorio personal de configuración, dentro de
  <code>profiles/</code>. Puedes verlo desde <strong>Help → About Wireshark →
  Folders</strong>, que te da la ruta exacta en tu sistema. Copiar esa carpeta a otro equipo
  lleva el perfil entero con él.</p>

  <?= note('Tres perfiles que cubren casi todo',
      '<p><strong>Default</strong> sin tocar, para no perder la referencia.
      <strong>Rendimiento</strong>, con columnas de ventana TCP, delta de conexión y reglas
      que resalten retransmisiones y ventana cero.
      <strong>Cybersecurity</strong>, con SNI, consulta DNS, host HTTP y las reglas de
      coloreado orientadas a anomalías. Cambiar de perfil no altera la captura abierta: solo
      cambia cómo la ves.</p>', 'info') ?>

  <h3>Qué gana un perfil, en concreto</h3>

  <p>Un perfil no «configura Wireshark»: cambia a qué prestas atención sin tener que
  recordar nada. Este es el caso de un perfil pensado para investigar tráfico web.</p>

  <?= before_after(
      '<p>Perfil <em>Default</em>. Las columnas son las de fábrica —No., Time, Source,
      Destination, Protocol, Length, Info— y para saber a qué dominio iba una conexión TLS
      hay que seleccionar el paquete y desplegar el árbol hasta las extensiones.</p>
      <p>Una vez por paquete. Durante una investigación, cientos de veces.</p>',
      '<p><b>Edit → Configuration Profiles → +</b>, se crea uno nuevo, y dentro de él se
      añade una columna personalizada con el campo
      <code>tls.handshake.extensions_server_name</code> y otra con
      <code>tcp.stream</code>.</p>
      <p>Los cambios quedan guardados en ese perfil y no tocan el <em>Default</em>.</p>',
      '<p>El dominio de cada conexión se lee <strong>en la propia lista</strong>, sin abrir
      un solo paquete. Ordenando por esa columna, todas las conexiones al mismo destino
      quedan juntas.</p>
      <p>Y al volver a <em>Default</em>, Wireshark vuelve a estar como estaba.</p>') ?>

  <?= pitfall('<p>Configurar columnas, filtros y reglas de color sobre el perfil
      <em>Default</em> y acabar con un Wireshark que solo sirve para el último caso que
      investigaste. Los perfiles existen justo para eso: uno por tipo de trabajo, y el
      Default intacto.</p>') ?>
</section>

<!-- ======================== TLS DESCIFRADO ========================== -->
<span id="e7" class="legacy-anchor" aria-hidden="true"></span>
<section id="tls-descifrado">
  <h2>Descifrar tu propio TLS</h2>
  <p class="tut-sub">Ver HTTPS en claro usando las claves de tu propio navegador, en tu propio laboratorio.</p>
  <p class="tut-goal">Objetivo: ver HTTPS en claro usando las claves de tu propio navegador.</p>

  <p>No es un ataque: es que el navegador te presta sus claves de sesión porque tú se lo
  pides. Firefox y Chrome escriben las claves efímeras en un fichero si defines
  <code>SSLKEYLOGFILE</code>, y Wireshark sabe leerlo.</p>

  <?= term('<span class="p">$</span> export SSLKEYLOGFILE=~/tls-keys.log' . "\n"
         . '<span class="p">$</span> firefox --new-instance') ?>

  <p>Firefox tiene que arrancar <em>desde esa misma terminal</em> para heredar la variable;
  si ya estaba abierto, ciérralo del todo antes. Luego, en Wireshark:</p>

  <?= term('<span class="c">Edit → Preferences → Protocols → TLS' . "\n"
         . '  → (Pre)-Master-Secret log filename: ~/tls-keys.log</span>',
         'wireshark · preferencias') ?>

  <p>Empieza la captura, navega a cualquier sitio HTTPS, y filtra por <code>http2</code>.
  Los paquetes que antes eran «Application Data» ilegible ahora aparecen desmontados:
  cabeceras, cookies, JSON, todo. Follow → HTTP/2 Stream lo muestra en texto.</p>

  <?= note('Limpieza',
      '<p>Ese fichero permite descifrar todo lo que capturaste durante esa sesión. Bórralo
      cuando termines (<code>rm ~/tls-keys.log</code>) y no exportes la variable en tu
      <code>.bashrc</code>. Solo funciona con tráfico de <em>tu</em> navegador: no hay forma
      de obtener las claves de nadie más.</p>') ?>

  <h3>Por qué esto funciona</h3>

  <p>Merece entenderse, porque explica a la vez el alcance y el límite de la técnica.</p>

  <p>TLS moderno usa intercambio de claves con <strong>secreto hacia adelante</strong>: las
  claves que cifran la sesión se generan al vuelo para esa conexión y no se derivan de la
  clave privada del servidor. Por eso, ni siquiera teniendo la clave privada del servidor se
  puede descifrar una sesión TLS 1.3 grabada.</p>

  <p>Lo que sí existe es el material de la sesión, dentro de la memoria del cliente. El
  navegador, si le pides que colabore, lo escribe en el fichero de
  <code>SSLKEYLOGFILE</code>. Wireshark lee ese fichero y descifra. Es decir: funciona porque
  <strong>uno de los dos extremos de la conversación —tú— coopera voluntariamente</strong>.</p>

  <p>De ahí se sigue lo importante:</p>

  <ul>
    <li>Solo descifra las conexiones cuyas claves están en <em>tu</em> fichero, es decir, las
    que hizo <em>tu</em> navegador mientras la variable estaba puesta.</li>
    <li>No hay forma de obtener las claves de otra persona con esta técnica. No es una
    debilidad de TLS: es una función de depuración.</li>
    <li>Si capturaste antes de arrancar el navegador con la variable, esas conexiones no se
    descifrarán nunca.</li>
  </ul>

  <?= note('Marco de uso: solo tráfico propio y autorizado',
      '<p>Esta técnica es para <strong>tu</strong> equipo, <strong>tu</strong> navegador y
      <strong>tu</strong> laboratorio, o para un entorno donde tengas autorización expresa
      por escrito. Sirve para depurar una aplicación que consume una API, para entender un
      protocolo, o para analizar en un laboratorio aislado qué hace una muestra. Aplicarla
      al tráfico de otra persona sin su consentimiento no es un problema técnico: es un
      problema legal, y no se aborda en esta guía.</p>') ?>

  <h3>Riesgos del fichero de claves</h3>

  <ul>
    <li>Mientras la variable esté activa, <strong>todas</strong> tus sesiones TLS quedan
    descifrables por quien tenga el fichero y la captura. Incluidas las que no pretendías
    analizar: correo, banca, sesiones de trabajo.</li>
    <li>Un <code>.pcapng</code> puede llevar las claves <em>dentro</em>, si usas
    <strong>File → Export Packet Dissections</strong> o incrustas el <em>secrets block</em>.
    Cómodo para compartir un caso con un compañero; catastrófico si ese fichero acaba donde
    no debe.</li>
    <li>Ponlo en la variable solo en la terminal donde lo necesites; jamás en
    <code>.bashrc</code>, <code>.profile</code> ni en el entorno del escritorio.</li>
    <li>Bórralo al terminar, y borra también las capturas de laboratorio que ya no necesites.</li>
  </ul>
</section>

<!-- ============================ TSHARK ============================== -->
<span id="e9" class="legacy-anchor" aria-hidden="true"></span>
<section id="tshark">
  <h2>tshark</h2>
  <p class="tut-sub">Lo mismo sin ventana: servidores, scripts y sesiones SSH.</p>
  <p class="tut-goal">Objetivo: capturar en servidores, en scripts y en sesiones SSH.</p>

  <p><code>tshark</code> es el mismo motor sin GUI, con los mismos display filters. Captura
  diez paquetes DNS y muéstralos:</p>

  <?= term('<span class="p">$</span> tshark -i wlan0 -c 10 -f "port 53"') ?>

  <p>Fíjate en <code>-f</code>: es el <em>capture</em> filter (sintaxis BPF). El display
  filter va con <code>-Y</code>:</p>

  <?= term('<span class="p">$</span> tshark -i wlan0 -Y "dns.flags.response == 0"') ?>

  <p>Lo más potente es extraer campos concretos en columnas, listo para <code>sort</code> o
  <code>awk</code>:</p>

  <?= term('<span class="p">$</span> tshark -i wlan0 -Y dns -T fields \\' . "\n"
         . '      -e frame.time_relative -e ip.src -e dns.qry.name') ?>

  <p>El flujo de trabajo habitual es capturar sin interfaz y analizar con la GUI:</p>

  <?= term('<span class="c"># capturar 60 s a fichero</span>' . "\n"
         . '<span class="p">$</span> tshark -i wlan0 -a duration:60 -w ~/captura.pcapng' . "\n\n"
         . '<span class="c"># abrirlo en la GUI</span>' . "\n"
         . '<span class="p">$</span> wireshark ~/captura.pcapng') ?>

  <p>El formato <code>.pcapng</code> es estándar: lo lee cualquier herramienta de análisis,
  y es lo que te pasarán si alguien te pide ayuda con un problema de red. Guardar la captura
  (<kbd>Ctrl</kbd>+<kbd>S</kbd>) es parte del trabajo, no un extra.</p>

  <h3>Recetas que resuelven preguntas reales</h3>

  <p>Aquí es donde <code>tshark</code> supera a la interfaz: contar, agrupar y ordenar.</p>

  <h4>Los veinte dominios más consultados</h4>
  <?= term('<span class="p">$</span> tshark -r captura.pcapng -Y "dns.flags.response == 0" \\' . "\n"
         . '      -T fields -e dns.qry.name | sort | uniq -c | sort -rn | head -20') ?>
  <p>La primera pregunta de casi cualquier investigación. Si un dominio desconocido aparece
  cientos de veces, ya tienes por dónde empezar.</p>

  <h4>Todos los destinos HTTPS, por nombre</h4>
  <?= term('<span class="p">$</span> tshark -r captura.pcapng -Y "tls.handshake.type == 1" \\' . "\n"
         . '      -T fields -e tls.handshake.extensions_server_name | sort -u') ?>

  <h4>Quién habla con quién y cuánto</h4>
  <?= term('<span class="p">$</span> tshark -r captura.pcapng -q -z conv,tcp') ?>
  <p>La misma tabla que Statistics → Conversations, en texto. <code>-q</code> silencia el
  volcado de paquetes y <code>-z</code> pide una estadística. Otras útiles:
  <code>-z io,phs</code> (jerarquía de protocolos) y <code>-z endpoints,ip</code>.</p>

  <h4>Intervalos entre conexiones, para medir periodicidad</h4>
  <?= term('<span class="p">$</span> tshark -r captura.pcapng \\' . "\n"
         . '      -Y "tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0 &amp;&amp; ip.dst == 203.0.113.9" \\' . "\n"
         . '      -T fields -e frame.time_epoch \\' . "\n"
         . '  | awk \'NR&gt;1 {printf "%.1f\\n", $1-prev} {prev=$1}\'') ?>
  <p>Imprime el hueco en segundos entre cada intento de conexión. Si la columna es casi
  constante, tienes periodicidad — el indicador central de la sección de beaconing.</p>

  <h4>Cortar una captura enorme</h4>
  <?= term('<span class="c"># quedarse solo con un equipo</span>' . "\n"
         . '<span class="p">$</span> tshark -r grande.pcapng -Y "ip.addr == 10.2.3.170" -w recorte.pcapng') ?>
  <p>Trabajar sobre un recorte es más rápido y, si vas a compartirlo, expone mucho menos.</p>

  <?= note('Capturar como root tampoco aquí',
      '<p><code>tshark</code> disecciona, igual que la interfaz gráfica, así que se aplica
      el mismo razonamiento: pertenece al grupo <code>wireshark</code> y deja que
      <code>dumpcap</code> haga la parte privilegiada. Para capturas largas y desatendidas,
      usa <code>dumpcap</code> directamente: es más ligero y no disecciona nada.</p>') ?>
</section>

<!-- ============================== PCAP ============================== -->
<section id="pcap">
  <h2>PCAP y su custodia</h2>
  <p class="tut-sub">El formato de las capturas, y por qué un fichero de estos es información sensible.</p>

  <p>Hay dos formatos y conviene distinguirlos:</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Formatos de captura</caption>
      <thead><tr><th scope="col">Formato</th><th scope="col">Características</th></tr></thead>
      <tbody>
        <tr><td class="f">.pcap</td><td class="d">El clásico. Una sola interfaz, marcas de tiempo con precisión de microsegundo, sin metadatos. Máxima compatibilidad con herramientas antiguas.</td></tr>
        <tr><td class="f">.pcapng</td><td class="d">El actual, y el que Wireshark usa por defecto. Varias interfaces en un fichero, nanosegundos, comentarios por paquete, metadatos del equipo que capturó y bloques de secretos.</td></tr>
      </tbody>
    </table>
  </div>

  <p>Trabajar sobre ficheros en lugar de capturar en vivo es lo normal en análisis: es
  repetible, se puede compartir, y no te obliga a estar delante cuando ocurre el problema.</p>

  <h3>Operaciones habituales</h3>

  <ul>
    <li><strong>Abrir:</strong> File → Open, o <code>wireshark fichero.pcapng</code>.</li>
    <li><strong>Guardar solo lo filtrado:</strong> File → <strong>Export Specified
    Packets…</strong>, con la opción <em>All packets / Displayed</em>. Es la forma correcta
    de reducir una captura a lo relevante.</li>
    <li><strong>Anotar:</strong> clic derecho en un paquete → <strong>Packet Comment…</strong>.
    El comentario se guarda dentro del <code>.pcapng</code> y aparece en Expert Information.
    Es la manera de dejar dicho por qué ese paquete importa.</li>
    <li><strong>Unir o dividir:</strong> las herramientas de línea de comandos
    <code>mergecap</code> y <code>editcap</code>. Por ejemplo, trocear por tiempo:</li>
  </ul>

  <?= term('<span class="c"># dividir en trozos de 60 segundos</span>' . "\n"
         . '<span class="p">$</span> editcap -i 60 grande.pcapng trozo.pcapng') ?>

  <h3 class="ciber-head">Un PCAP es información sensible</h3>

  <?= note('Antes de compartir una captura, léela con esta lista delante',
      '<p>Una captura de red contiene, casi siempre sin que lo pretendas: direcciones IP
      internas y la topología que revelan; nombres de equipo y de usuario (DHCP, mDNS,
      NetBIOS); todos los dominios visitados (DNS y SNI); cookies y tokens de sesión si hay
      HTTP; contenido completo de cualquier protocolo sin cifrar; direcciones MAC que
      identifican dispositivos; y —si incluiste el fichero de claves TLS— absolutamente todo
      lo demás.</p>
      <p>Subir un PCAP «para que alguien me ayude» a un foro público es una fuga de datos.
      Ha ocurrido muchas veces.</p>') ?>

  <p>Reglas prácticas para manejarlos:</p>

  <ul>
    <li><strong>Captura lo mínimo necesario.</strong> Un capture filter bien puesto es
    también una medida de protección de datos: lo que no capturas no puede filtrarse.</li>
    <li><strong>Recorta antes de compartir.</strong> Export Specified Packets con solo la
    conversación relevante.</li>
    <li><strong>Anonimiza si el destinatario no necesita las direcciones.</strong> Existen
    herramientas específicas de <em>sanitizado</em> de PCAP; ten en cuenta que anonimizar
    bien es más difícil de lo que parece, porque los identificadores aparecen en muchos
    sitios a la vez.</li>
    <li><strong>Para aprender, usa capturas públicas de laboratorio</strong> en lugar de
    tráfico real de una organización.</li>
    <li><strong>Trátalos como evidencia</strong> si lo son: calcula el hash al obtenerlos,
    guarda dónde y cuándo se capturaron, y no trabajes sobre el original sino sobre una
    copia.</li>
    <li><strong>Bórralos cuando ya no hagan falta.</strong> Una carpeta de capturas viejas
    es un problema esperando a ocurrir.</li>
  </ul>
</section>

  <?= recap('Wireshark a fondo', [
      'Follow Stream reconstruye los datos de una conversación entera; sobre tráfico cifrado devuelve ruido, y eso es correcto.',
      'Statistics responde preguntas de conjunto: de qué está hecha la captura, quién habla con quién y cuánto en cada sentido.',
      'Expert Information describe anomalías de protocolo y salud de la captura, no intenciones.',
      'Los colores son filtros que se cumplen; el rojo por defecto significa retransmisión, no ataque.',
      'Un fichero PCAP es un inventario de la actividad de alguien: se trata como dato sensible desde el momento en que se guarda.',
  ], [
      'Analyze → Follow → TCP Stream',
      'Statistics → Protocol Hierarchy',
      'Statistics → Conversations',
      'Analyze → Expert Information',
      'tshark -r captura.pcapng -Y \'dns\'',
  ], [
      'La asimetría de bytes en Conversations, que insinúa subida o descarga.',
      'Un protocolo inesperado en Protocol Hierarchy, que es el hallazgo más barato de toda la herramienta.',
      'Un contador de paquetes descartados distinto de cero: la captura está incompleta.',
  ]) ?>

  <?= quiz([
      [
          'q' => 'Abres una captura y en Protocol Hierarchy aparece un protocolo que no esperabas. ¿Qué es eso?',
          'opts' => ['A' => 'Un error del disector', 'B' => 'Un punto de partida para investigar', 'C' => 'Prueba de un compromiso', 'D' => 'Ruido que se descarta'],
          'ok' => 'B',
          'why' => 'Es un hallazgo, y de los más baratos que da la herramienta: cuesta un clic. Pero solo dice «aquí hay algo que no encaja con lo que esperaba». Podría ser un servicio legítimo que desconocías, un disector que se ha equivocado o algo que merece atención.',
      ],
      [
          'q' => 'La pantalla se llena de paquetes rojos. ¿Qué es lo más probable?',
          'opts' => ['A' => 'Un escaneo en curso', 'B' => 'Retransmisiones de TCP por una red con pérdidas', 'C' => 'Tráfico cifrado', 'D' => 'Un fallo de Wireshark'],
          'ok' => 'B',
          'why' => 'La regla roja por defecto es <code>tcp.analysis.flags</code>: retransmisiones, segmentos perdidos, ACK duplicados. Es un síntoma de red, no de adversario. Un wifi con interferencias lo produce constantemente.',
      ],
      [
          'q' => 'Statistics → Capture File Properties dice que se descartaron 1 204 paquetes. ¿Qué implica para tu análisis?',
          'opts' => ['A' => 'Nada, Wireshark lo reconstruye', 'B' => 'Que la captura está incompleta y toda conclusión hereda esa limitación', 'C' => 'Que hubo un ataque de denegación', 'D' => 'Que hay que reinstalar dumpcap'],
          'ok' => 'B',
          'why' => 'Si <code>dumpcap</code> no dio abasto, hay tramas que nunca llegaron al fichero. Eso no invalida el trabajo, pero sí obliga a escribirlo en el informe: lo que no está en la captura no se puede afirmar ni descartar.',
      ],
  ]) ?>


<?= chapter('04', 'Ciberseguridad', 'Análisis defensivo: reconocer, investigar y documentar. Nada de esta parte enseña a atacar.', 'ciber') ?>

<!-- ============================= CIBER ============================== -->
<section id="ciber">
  <h2>Wireshark para análisis defensivo</h2>
  <p class="tut-sub">Qué se puede y qué no se puede concluir mirando tráfico.</p>

  <p>Todo lo que viene ahora está escrito desde el lado del defensor: alguien que tiene una
  captura de una red que administra o que está autorizado a analizar, y que necesita
  responder «¿esto es normal?».</p>

  <p>Wireshark <strong>no es un IDS</strong>. No tiene firmas, no puntúa amenazas, no avisa.
  Lo que aporta es la máxima resolución posible: el paquete exacto, con todos sus campos.
  Por eso es la herramienta de la fase de <em>confirmación</em>, no la de detección. El
  camino típico es: una alerta llega de otro sitio → se recupera la captura → Wireshark
  responde qué pasó exactamente.</p>

  <h3>Las tres preguntas que ordenan cualquier análisis</h3>

  <ol>
    <li><strong>¿Qué veo?</strong> Hechos observables en la captura. «El equipo 10.2.3.55
    abrió 40 conexiones al puerto 443 de 203.0.113.9 en diez minutos.» Esto no se discute:
    está en el fichero.</li>
    <li><strong>¿Qué significa?</strong> Interpretación, que depende del contexto. «Cuarenta
    conexiones en diez minutos a intervalos casi constantes no se parecen a navegación
    humana.»</li>
    <li><strong>¿Qué no puedo saber desde aquí?</strong> El límite. «No sé qué se envió,
    porque va cifrado. No sé si ese destino es legítimo. No sé si el proceso que lo generó
    es malicioso.»</li>
  </ol>

  <?= note('La disciplina que hay que adquirir',
      '<p>Separar <strong>evidencia</strong> de <strong>hipótesis</strong>, siempre y por
      escrito. La evidencia es lo que otra persona vería abriendo la misma captura. La
      hipótesis es tu explicación de por qué. Un informe que las mezcla es un informe que no
      se puede revisar — y, si el asunto acaba teniendo consecuencias para alguien, es un
      informe que hace daño.</p>
      <p>La mayoría de los errores de análisis no vienen de no saber leer un paquete. Vienen
      de saltar de «esto es raro» a «esto es un ataque» sin pasar por «esto es raro y no
      tengo explicación todavía».</p>') ?>

  <h3>Lo que una captura no te va a decir</h3>

  <ul>
    <li><strong>Qué proceso lo generó.</strong> La captura ve puertos, no programas. Eso se
    responde en el equipo, con <code>ss -tanp</code> o el registro del sistema.</li>
    <li><strong>Quién estaba delante.</strong> Una IP identifica un equipo, y solo mientras
    dure la concesión DHCP.</li>
    <li><strong>El contenido cifrado.</strong> Salvo que sea tu propio tráfico y tengas las
    claves.</li>
    <li><strong>Qué pasó fuera de la ventana capturada.</strong></li>
    <li><strong>Si el destino es malicioso.</strong> Eso es inteligencia externa, no
    análisis de paquetes.</li>
  </ul>

  <p>Reconocer estos límites en voz alta es lo que distingue un análisis serio. Las secciones
  que siguen dan indicadores concretos; ninguno es una conclusión por sí mismo.</p>

  <h3>El camino de la observación a la conclusión</h3>

  <?= shot('wireshark/20-flujo-analisis.svg',
      'Cuatro pasos encadenados —observas, aíslas, contrastas, concluyes— y debajo las '
      . 'cuatro limitaciones que acompañan siempre a una captura.',
      '<b>Dónde mirar:</b> la banda inferior. Esas cuatro limitaciones no se saltan nunca '
      . 'y forman parte de cualquier conclusión honesta.') ?>

  <p>Todo el capítulo que empieza aquí usa el mismo formato de tres bloques —evidencia,
  interpretación y lo que todavía no se puede afirmar—, porque es precisamente donde más
  se falla: el salto del dato a la acusación.</p>

</section>

<!-- ============================ BASELINE ============================ -->
<section id="baseline">
  <h2>Línea base</h2>
  <p class="tut-sub">Para reconocer el tráfico malo primero hay que conocer el normal.</p>

  <p>Este es el consejo más importante de toda esta parte, y el que más se ignora. Sin una
  referencia de cómo se comporta tu red cuando no pasa nada, cualquier captura parece
  sospechosa: verás retransmisiones, dominios que no reconoces, conexiones a nubes de medio
  mundo. Y casi todo será normal.</p>

  <p>La solución es barata: dedica una tarde a capturar tu red funcionando bien y anota qué
  hay. Ese documento vale más que cualquier lista de filtros.</p>

  <h3>Qué apuntar</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Elementos de una línea base de red</caption>
      <thead><tr><th scope="col">Dimensión</th><th scope="col">Dónde se mira</th><th scope="col">Qué anotar</th></tr></thead>
      <tbody>
        <tr><td class="d">Equipos</td><td class="d">Statistics → Endpoints (IPv4 y Ethernet)</td><td class="d">Qué IP y qué MAC existen; cuál es el gateway.</td></tr>
        <tr><td class="d">Protocolos</td><td class="d">Statistics → Protocol Hierarchy</td><td class="d">Reparto porcentual habitual. Qué protocolos aparecen y cuáles no.</td></tr>
        <tr><td class="d">Destinos</td><td class="d">Columna SNI + consultas DNS</td><td class="d">Los veinte o treinta dominios recurrentes.</td></tr>
        <tr><td class="d">Puertos</td><td class="d">Statistics → Conversations → TCP/UDP</td><td class="d">Qué puertos de destino son normales aquí.</td></tr>
        <tr><td class="d">Volumen</td><td class="d">Statistics → I/O Graphs</td><td class="d">Tráfico típico por minuto, y la forma de las horas punta.</td></tr>
        <tr><td class="d">Periodicidad</td><td class="d">I/O Graphs con intervalo largo</td><td class="d">Qué cosas ya laten solas: actualizaciones, NTP, monitorización.</td></tr>
        <tr><td class="d">Anomalías normales</td><td class="d">Analyze → Expert Information</td><td class="d">Cuántas retransmisiones y ACK duplicados hay <em>de normal</em>.</td></tr>
      </tbody>
    </table>
  </div>

  <p>Ese último punto es el que más disgustos ahorra: si tu wifi genera de normal un 2 % de
  retransmisiones, encontrarlas durante un incidente no significa nada.</p>

  <?= term('<span class="c"># línea base de destinos: los 30 dominios más consultados</span>' . "\n"
         . '<span class="p">$</span> tshark -r baseline.pcapng -Y "dns.flags.response == 0" \\' . "\n"
         . '      -T fields -e dns.qry.name | sort | uniq -c | sort -rn | head -30 \\' . "\n"
         . '  &gt; baseline-dominios.txt') ?>

  <p>Guarda ese fichero. La próxima vez, genera el mismo listado sobre la captura nueva y
  compáralos con <code>comm</code> o <code>diff</code>: lo que aparece y no estaba es tu
  lista de candidatos a investigar. Es una técnica sencilla y sorprendentemente eficaz.</p>

  <?= note('Cuándo rehacer la línea base',
      '<p>Cada vez que cambie algo estructural: un equipo nuevo, un servicio nuevo, una
      actualización grande del sistema. Una línea base vieja produce falsos positivos y,
      peor, hace que dejes de fiarte del método.</p>', 'info') ?>
</section>

<!-- ============================== SCAN ============================== -->
<section id="scan">
  <h2>Escaneo de puertos</h2>
  <p class="tut-sub">Cómo se ve desde el lado del que lo recibe.</p>

  <p><strong>Qué es.</strong> Alguien quiere saber qué servicios tiene un equipo, así que
  intenta abrir conexiones a muchos puertos y observa qué contesta cada uno. No es en sí un
  ataque: es reconocimiento. Pero rara vez hay una razón legítima para que un equipo de tu
  red escanee a otro sin que tú lo sepas.</p>

  <p><strong>Qué rastro deja.</strong> La firma no está en ningún paquete individual —cada
  SYN es un SYN perfectamente normal— sino en la <strong>forma del conjunto</strong>:</p>

  <ul>
    <li>Muchos SYN desde <strong>un mismo origen</strong>.</li>
    <li>Hacia <strong>muchos puertos distintos</strong> (escaneo de puertos) o muchas IP
    distintas (barrido de red).</li>
    <li>En una <strong>ventana de tiempo corta</strong>.</li>
    <li>Con <strong>pocos handshakes completos</strong>: la mayoría acaba en RST (puerto
    cerrado) o sin respuesta (filtrado).</li>
    <li>A menudo con puertos de destino <strong>secuenciales</strong> o siguiendo una lista
    conocida de servicios.</li>
  </ul>

  <h3>Cómo se investiga</h3>

  <?= steps([
      'Aísla las aperturas de conexión: <code>tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0</code>. Mira el contador <b>Displayed</b>: si es un número grande respecto al total, ya es un dato.',
      'Abre <strong>Statistics → Conversations</strong> con <em>Limit to display filter</em> marcado y ve a la pestaña <strong>TCP</strong>. Ordena por origen. Un escaneo se ve como cientos de filas con la misma IP A y puertos B distintos, cada una con muy pocos paquetes.',
      'Añade <code>tcp.dstport</code> como columna y ordena por ella: si los puertos suben en escalera, la forma es inconfundible.',
      'Comprueba qué contestó: <code>tcp.flags.reset == 1</code> son puertos cerrados que respondieron. Los que no aparecen es que no contestaron nada.',
      'Busca los que <strong>sí</strong> se completaron: esos son los servicios que el escaneo encontró abiertos, y son el foco de lo que venga después.',
      'Mira el <strong>I/O Graph</strong> con la vista filtrada por los SYN: un escaneo produce un pico compacto, no una curva suave.',
  ]) ?>

  <?= filter_chip('tcp.flags.syn == 1 && tcp.flags.ack == 0') ?>
  <?= filter_chip('tcp.flags.reset == 1 && tcp.flags.ack == 1') ?>
  <?= filter_chip('tcp.completeness < 7') ?>
  <p>Este último aprovecha un campo que Wireshark calcula por conexión: marca las
  conexiones que no llegaron a completarse. Muchas conexiones incompletas desde un mismo
  origen es exactamente el patrón.</p>

  <?= reveal('¿Qué distingue un escaneo de una aplicación con problemas?', '
    <p>Una aplicación que reintenta conectar contra un servicio caído también genera muchos
    SYN sin respuesta. Se distinguen por tres cosas:</p>
    <ul>
      <li><strong>Variedad de destino.</strong> La aplicación insiste contra <em>el mismo</em>
      puerto e IP; el escaneo recorre <em>muchos</em>.</li>
      <li><strong>Retransmisiones.</strong> El reintento legítimo de TCP retransmite el mismo
      SYN con intervalos que se van doblando (1 s, 2 s, 4 s…), y Wireshark lo marca como
      <code>tcp.analysis.retransmission</code>. Un escáner no espera: lanza y sigue.</li>
      <li><strong>Puerto origen.</strong> Los reintentos de una misma conexión conservan el
      puerto origen; un escaneo usa uno nuevo por cada intento.</li>
    </ul>') ?>

  <?= note('Antes de dar la alarma',
      '<p>Escanean legítimamente: los inventarios de activos, los escáneres de
      vulnerabilidades del propio departamento de seguridad, las sondas de monitorización,
      los descubrimientos de impresoras y de dispositivos multimedia. Antes de escalar,
      comprueba si el origen es un equipo conocido con esa función. Un escaneo desde el
      servidor de inventario a las 3:00 de la mañana probablemente sea el inventario.</p>') ?>

  <?= evidence(
      '<p>Un mismo origen envía <code>SYN</code> a decenas de puertos distintos del mismo
      destino en menos de un segundo, y recibe <code>RST</code> de casi todos.</p>',
      '<p>Encaja con un <strong>escaneo de puertos</strong>: alguien está enumerando qué
      servicios ofrece ese equipo.</p>',
      '<p>Quién lo hizo ni con qué intención. Un inventario autorizado, un monitor de
      disponibilidad, un escáner de vulnerabilidades contratado por tu propia organización o
      tu propia prueba de laboratorio producen la misma forma exacta. Y la IP de origen puede
      no ser la del responsable. Lo que se afirma es <em>qué se observó y cuándo</em>; lo
      demás se contrasta con quién tenía autorización para hacerlo.</p>') ?>

  <?= pitfall('<p>Confundir un escaneo con un compromiso. Un escaneo es alguien
      <em>mirando</em>. No dice que haya entrado, ni que lo haya intentado. En una IP pública
      es además ruido de fondo constante: internet se escanea entera cada pocas horas.</p>') ?>

</section>

<!-- =========================== BEACONING ============================ -->
<section id="beaconing">
  <h2>Beaconing</h2>
  <p class="tut-sub">El latido: conexiones regulares hacia un mismo destino.</p>

  <p><strong>Qué es.</strong> Un programa que se comunica periódicamente con un servidor
  para preguntar si hay órdenes. Es el patrón de comunicación de la mayoría del software de
  control remoto — el legítimo y el que no lo es. Lo que lo hace detectable es que un
  programa es regular de un modo en que una persona no lo es.</p>

  <figure class="beacon">
    <div class="beacon__line">
      <span class="beacon__t" style="left:2%"></span>
      <span class="beacon__t" style="left:18%"></span>
      <span class="beacon__t" style="left:34%"></span>
      <span class="beacon__t" style="left:50%"></span>
      <span class="beacon__t" style="left:66%"></span>
      <span class="beacon__t" style="left:82%"></span>
      <span class="beacon__t" style="left:98%"></span>
    </div>
    <p class="beacon__lbl">Beaconing · intervalo constante, transferencia mínima</p>
    <div class="beacon__line beacon__line--human">
      <span class="beacon__t" style="left:3%"></span>
      <span class="beacon__t" style="left:6%"></span>
      <span class="beacon__t" style="left:9%"></span>
      <span class="beacon__t" style="left:11%"></span>
      <span class="beacon__t" style="left:41%"></span>
      <span class="beacon__t" style="left:44%"></span>
      <span class="beacon__t" style="left:46%"></span>
      <span class="beacon__t" style="left:88%"></span>
    </div>
    <p class="beacon__lbl">Navegación humana · ráfagas irregulares y silencios largos</p>
    <figcaption>La diferencia no está en un paquete: está en el eje del tiempo.</figcaption>
  </figure>

  <p><strong>Qué rastro deja:</strong></p>

  <ul>
    <li><strong>Intervalo casi constante</strong> entre conexiones al mismo destino.</li>
    <li><strong>Transferencias pequeñas y de tamaño parecido</strong> — la mayoría de las
    veces la respuesta es «no hay nada para ti».</li>
    <li><strong>Persistencia en el tiempo</strong>, incluso fuera de horario laboral, cuando
    nadie está usando el equipo.</li>
    <li><strong>Un solo destino</strong>, o unos pocos, repetidos.</li>
  </ul>

  <h3>Cómo se mide la periodicidad</h3>

  <?= steps([
      'Localiza al candidato en <strong>Statistics → Conversations</strong>: ordena por número de paquetes o de conexiones hacia un mismo destino externo.',
      'Filtra esa pareja: <code>ip.addr == 10.2.3.55 &amp;&amp; ip.addr == 203.0.113.9</code>.',
      'Quédate solo con los inicios de conexión, que es lo que marca el ritmo: añade <code>&amp;&amp; tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0</code>.',
      'Cambia <strong>View → Time Display Format</strong> a <em>Seconds Since Previous Displayed Packet</em>. La columna Time pasa a ser directamente el intervalo.',
      'Mira esa columna: si los valores rondan siempre el mismo número, tienes periodicidad.',
      'Confírmalo visualmente en <strong>Statistics → I/O Graphs</strong>, con una línea para ese filtro y un intervalo de 1 segundo: el beaconing se dibuja como un peine regular.',
  ]) ?>

  <p>Y la forma rápida, en terminal, sobre una captura ya guardada:</p>

  <?= term('<span class="p">$</span> tshark -r captura.pcapng \\' . "\n"
         . '      -Y "ip.dst == 203.0.113.9 &amp;&amp; tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0" \\' . "\n"
         . '      -T fields -e frame.time_epoch \\' . "\n"
         . '  | awk \'NR&gt;1 {printf "%.1f\\n", $1-prev} {prev=$1}\' \\' . "\n"
         . '  | sort -n | uniq -c') ?>

  <p>Si la salida se concentra en uno o dos valores, el intervalo es fijo. Si está repartida
  por todas partes, es tráfico irregular — probablemente humano.</p>

  <h3>El <em>jitter</em></h3>

  <p>El software de control moderno introduce una variación aleatoria deliberada en el
  intervalo, precisamente para no dibujar un peine perfecto. Un beacon de 60 segundos con un
  20 % de jitter aparecerá entre 48 y 72. Sigue siendo detectable: la distribución continúa
  siendo estrecha comparada con la de un humano, que salta de dos segundos a media hora.</p>

  <p>Por eso conviene mirar la <strong>dispersión</strong>, no solo la media. Con la columna
  de deltas exportada a CSV y una hoja de cálculo, la desviación típica dividida entre la
  media da un número: cuanto más cerca de cero, más regular.</p>

  <?= note('Lo periódico casi nunca es malicioso',
      '<p>Y esto hay que interiorizarlo antes de usar la técnica. En cualquier red hay
      decenas de cosas latiendo con toda legitimidad: NTP cada 64 segundos, comprobación de
      actualizaciones, telemetría del sistema operativo, sincronización de nubes de
      almacenamiento, agentes de monitorización, clientes de correo que consultan cada
      minuto, sesiones que se mantienen vivas con keep-alive.</p>
      <p>La periodicidad <strong>por sí sola no es un indicador de compromiso</strong>. Se
      convierte en interesante cuando además: el destino no está en tu línea base, no se
      corresponde con ningún software conocido del equipo, el volumen es minúsculo y
      simétrico, y persiste a horas en las que ese equipo debería estar en silencio. Son
      cuatro condiciones, no una.</p>') ?>

  <?= evidence(
      '<p>Un equipo contacta con el mismo destino externo cada 60 segundos, con una
      desviación de menos de un segundo, durante seis horas, siempre con conexiones de
      tamaño muy parecido.</p>',
      '<p>Es el patrón de un <strong>beacon</strong>: un proceso que pregunta
      periódicamente a un servidor si tiene instrucciones. Es la forma que tiene el malware
      de mando y control, entre otras cosas.</p>',
      '<p>Que sea malicioso. La regularidad extrema es de máquina, no de humano — pero casi
      todo el software moderno la tiene: comprobación de actualizaciones, sincronización de
      correo, telemetría, latidos de un agente de monitorización, un cliente de
      mensajería. Lo que convierte un beacon en hallazgo es que <strong>no puedas
      atribuirlo a un proceso conocido</strong> y que el destino no aparezca en tu línea
      base.</p>') ?>

</section>

<!-- =========================== DNS RARO ============================= -->
<section id="dns-raro">
  <h2>DNS sospechoso</h2>
  <p class="tut-sub">Checklist defensivo sobre el protocolo que más cuenta.</p>

  <p>La sección de DNS ya explicó los indicadores. Aquí van convertidos en un procedimiento
  que puedes ejecutar sobre cualquier captura.</p>

  <h3>Checklist</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Checklist de revisión de DNS</caption>
      <thead><tr><th scope="col">#</th><th scope="col">Comprobación</th><th scope="col">Filtro o herramienta</th></tr></thead>
      <tbody>
        <tr><td class="f">1</td><td class="d">¿Cuántas consultas hay y a qué resolver van?</td><td class="f">dns.flags.response == 0</td></tr>
        <tr><td class="f">2</td><td class="d">¿Alguien consulta a un resolver distinto del corporativo?</td><td class="f">dns &amp;&amp; !(ip.dst == 10.2.3.1)</td></tr>
        <tr><td class="f">3</td><td class="d">¿Qué proporción de NXDOMAIN hay?</td><td class="f">dns.flags.rcode == 3</td></tr>
        <tr><td class="f">4</td><td class="d">¿Hay nombres anormalmente largos?</td><td class="f">dns.qry.name.len &gt; 50</td></tr>
        <tr><td class="f">5</td><td class="d">¿Hay consultas TXT desde equipos de escritorio?</td><td class="f">dns.qry.type == 16</td></tr>
        <tr><td class="f">6</td><td class="d">¿Hay un dominio consultado con una frecuencia rara?</td><td class="d">tshark + <code>uniq -c</code></td></tr>
        <tr><td class="f">7</td><td class="d">¿Hay muchos subdominios distintos de un mismo dominio padre?</td><td class="d">Ordenar la lista de nombres</td></tr>
        <tr><td class="f">8</td><td class="d">¿Aparece algún dominio que no esté en tu línea base?</td><td class="d"><code>comm</code> contra el fichero base</td></tr>
      </tbody>
    </table>
  </div>

  <p>El punto 7 merece explicación porque es el más característico. Sacar datos por DNS
  obliga a codificarlos en el <em>nombre</em> consultado, y como cada consulta lleva pocos
  bytes, hacen falta muchas. El resultado es un mismo dominio padre con cientos o miles de
  subdominios distintos, cada uno consultado una sola vez.</p>

  <?= term('<span class="c"># subdominios distintos por dominio padre</span>' . "\n"
         . '<span class="p">$</span> tshark -r captura.pcapng -Y "dns.flags.response == 0" \\' . "\n"
         . '      -T fields -e dns.qry.name \\' . "\n"
         . '  | awk -F. \'{print $(NF-1)"."$NF}\' | sort | uniq -c | sort -rn | head') ?>

  <p>Un dominio con 3 000 consultas y 3 000 nombres distintos tiene una forma muy diferente
  de uno con 3 000 consultas al mismo nombre. El primero merece una mirada; el segundo es
  probablemente una caché mal configurada.</p>

  <?= reveal('Qué explicaciones benignas hay que descartar primero', '
    <ul>
      <li><strong>Antivirus y reputación en la nube.</strong> Consultan nombres generados a
      partir del hash de lo que analizan. Producen exactamente el patrón de «muchos
      subdominios largos y únicos».</li>
      <li><strong>Redes de distribución de contenido.</strong> Generan nombres largos y
      aparentemente aleatorios.</li>
      <li><strong>Sufijos de búsqueda.</strong> Un dominio de búsqueda mal configurado hace
      que cada nombre se intente varias veces, multiplicando los NXDOMAIN.</li>
      <li><strong>mDNS.</strong> El descubrimiento de impresoras y altavoces en la red local
      genera mucho tráfico con aspecto extraño en el puerto 5353. Es normal.</li>
      <li><strong>DoH del navegador.</strong> Explica que un equipo «no consulte» al resolver
      corporativo: sus consultas van cifradas dentro de HTTPS y no las verás como DNS.</li>
    </ul>
    <p>Si ninguna de estas explica lo que ves, y el equipo no debería estar haciendo eso,
    entonces tienes un hallazgo que documentar — todavía no una conclusión.</p>') ?>
</section>

<!-- =========================== ARP RARO ============================= -->
<section id="arp-raro">
  <h2>ARP anómalo</h2>
  <p class="tut-sub">Ejercicio defensivo sobre el protocolo sin autenticación.</p>

  <p>La sección de ARP explicó el mecanismo. Aquí está el procedimiento para revisar una
  captura buscando inconsistencias, y —lo más importante— qué hacer con lo que encuentres.</p>

  <?= steps([
      'Filtra <code>arp</code> y abre <strong>Statistics → Conversations → Ethernet</strong>: obtienes las parejas de MAC que han hablado.',
      'Aplica <code>arp.duplicate-address-detected</code>. Si no hay nada, la captura no muestra conflictos y puedes pasar a otra cosa.',
      'Si hay algo, abre uno de esos paquetes: Wireshark te dice en <code>arp.duplicate-address-frame</code> con qué trama anterior choca. Compara ambas.',
      'Anota <strong>las dos MAC</strong> y la IP en disputa. Mira el fabricante que resuelve Wireshark para cada MAC: ¿son coherentes con dispositivos que existen en tu red?',
      'Comprueba si la IP en disputa es <strong>el gateway</strong>. Si lo es, sube la prioridad: es el objetivo con más valor.',
      'Mira la línea temporal: ¿fue un instante durante un cambio de red, o es persistente y se repite?',
      'Contrasta con tu tabla ARP local (<code>ip neigh</code>) y con la tabla de direcciones MAC del switch, si tienes acceso.',
  ]) ?>

  <?= filter_chip('arp.duplicate-address-detected') ?>
  <?= filter_chip('arp.opcode == 2 && arp.src.proto_ipv4 == 10.2.3.1') ?>
  <p>Ese segundo filtro muestra todas las respuestas que afirman ser el gateway. En una red
  sana, todas traerán la misma MAC de origen. Añade la columna <code>arp.src.hw_mac</code>
  y compruébalo de un vistazo.</p>

  <?= note('Las explicaciones inocentes son la mayoría',
      '<p>Un mismo IP con dos MAC aparece cuando: un portátil pasa de cable a wifi
      conservando la dirección; hay dos routers en alta disponibilidad compartiendo una IP
      virtual (VRRP, HSRP, CARP); una máquina virtual se migra a otro anfitrión; alguien
      configuró una IP fija que ya estaba en uso; o hay un dispositivo que hace de puente
      transparente.</p>
      <p>El procedimiento no es «encontrar un duplicado y dar la alarma». Es encontrarlo,
      explicarlo, y <strong>si no hay explicación</strong>, escalarlo con los datos
      recogidos. La mayoría de las veces la explicación existe.</p>') ?>

  <p>Defensas que se aplican después, y que no dependen de Wireshark: entradas ARP estáticas
  para el gateway en equipos críticos, inspección dinámica de ARP en switches gestionados,
  y segmentación para reducir cuántos equipos comparten un dominio de difusión.</p>
</section>

<!-- ============================= EXFIL ============================== -->
<section id="exfil">
  <h2>Transferencias de salida inusuales</h2>
  <p class="tut-sub">Detectar que salen datos, desde el lado del que vigila.</p>

  <p><strong>Qué se busca.</strong> Volumen de datos saliendo de la red hacia un destino que
  no corresponde. La detección es puramente estadística: no hace falta ver el contenido, solo
  medir cuánto sale, hacia dónde y cuándo.</p>

  <p><strong>El indicador central: la asimetría.</strong> La navegación normal es
  asimétrica <em>en el sentido contrario</em> — descargas mucho más de lo que subes. Una
  conversación donde el equipo interno <strong>envía</strong> mucho más de lo que recibe
  invierte el patrón habitual, y eso es lo que llama la atención.</p>

  <h3>Procedimiento</h3>

  <?= steps([
      'Abre <strong>Statistics → Conversations</strong>, pestaña <strong>IPv4</strong>.',
      'Ordena por <strong>Bytes A→B</strong> descendente, asegurándote de qué lado es el interno (la columna A es la que aparece primero en la fila).',
      'Compara las columnas A→B y B→A de las primeras filas. Busca las que envían mucho más de lo que reciben.',
      'Descarta los destinos conocidos de tu línea base: copias de seguridad, sincronización de ficheros, subida de registros.',
      'De los que quedan, mira <strong>Duration</strong> y la hora de inicio. ¿Ocurrió cuando alguien estaba trabajando?',
      'Filtra esa pareja y mira el <strong>I/O Graph</strong>: ¿fue un bloque continuo o goteo constante durante horas?',
      'Comprueba el protocolo y el puerto. ¿Encaja con lo que ese equipo debería hacer?',
      'Si hay DNS previo, busca qué nombre resolvió esa IP: <code>dns.a == 203.0.113.9</code>.',
  ]) ?>

  <?= filter_chip('ip.src == 10.2.3.0/24 && !(ip.dst == 10.2.3.0/24)') ?>
  <p>Todo lo que abandona tu red. Con este filtro puesto y <em>Limit to display filter</em>
  marcado en Conversations, las cifras que veas son exclusivamente de salida.</p>

  <?= filter_chip('dns.a == 203.0.113.9') ?>
  <p>Qué nombre de dominio resolvió a esa IP. Es la forma de convertir una dirección
  anónima en un destino con nombre, usando la propia captura en lugar de consultas externas
  que avisarían al otro lado.</p>

  <h3>Otros indicadores</h3>

  <ul>
    <li><strong>Horario.</strong> Transferencias grandes fuera de la jornada, cuando el
    equipo debería estar inactivo.</li>
    <li><strong>Destino desconocido.</strong> Una IP o un dominio que no aparece en la línea
    base, en un proveedor de nube que la organización no usa.</li>
    <li><strong>Protocolo impropio.</strong> Un volumen alto por un protocolo que no está
    hecho para transportar datos: DNS, ICMP, o un puerto TCP no habitual en ese equipo.</li>
    <li><strong>Continuidad.</strong> Una sesión larga a ritmo constante encaja peor con
    trabajo humano que un pico y una pausa.</li>
    <li><strong>Puerto no estándar</strong> con protocolo estándar dentro, o al revés:
    Protocol Hierarchy con mucho «Data» sin clasificar es una pista.</li>
  </ul>

  <?= note('Los falsos positivos aquí son la norma',
      '<p>Sube muchos datos, legítimamente: una copia de seguridad en la nube, la
      sincronización de una carpeta compartida, la subida de un vídeo, el envío de registros
      a un servicio externo, una videollamada larga (que además es simétrica y sostenida),
      una actualización que sube telemetría o un volcado de fallo.</p>
      <p>Por eso este análisis <strong>no funciona sin línea base</strong>. La pregunta útil
      no es «¿este equipo ha subido 2 GB?», sino «¿este equipo sube 2 GB normalmente, a este
      destino, a esta hora?». Sin la referencia, solo estás mirando números grandes.</p>') ?>

  <p>Y el límite honesto: si el tráfico va cifrado —lo normal—, la captura te dice
  <em>cuánto</em> salió y <em>hacia dónde</em>, nunca <em>qué</em>. Determinar qué se llevaron
  exige el equipo de origen: registros de aplicación, auditoría de ficheros, herramientas de
  detección en el endpoint. Wireshark aporta la mitad de la respuesta, y hay que decirlo así
  en el informe.</p>

  <?= evidence(
      '<p>Una única conversación acumula varios cientos de megabytes de <em>subida</em> hacia
      una IP externa, con muy poco tráfico de vuelta.</p>',
      '<p>Podría ser <strong>exfiltración</strong>: información saliendo del equipo.</p>',
      '<p>Que lo sea, y ni siquiera qué información es si va cifrada. El mismo perfil lo
      genera una copia de seguridad en la nube, una sincronización de fotos, la subida de un
      vídeo o el envío de un volcado de logs a un proveedor. La pregunta que decide no es
      «¿cuántos bytes?», sino <strong>«¿es normal que <em>este</em> equipo suba esto a
      <em>ese</em> destino a <em>esta</em> hora?»</strong> — y responderla exige línea base,
      no captura.</p>') ?>

</section>

<!-- =========================== HTTP RARO ============================ -->
<section id="http-raro">
  <h2>Tráfico HTTP sospechoso</h2>
  <p class="tut-sub">Qué revisar en el poco tráfico web sin cifrar que queda.</p>

  <p>Que casi todo sea HTTPS hace que el HTTP restante sea, precisamente por eso,
  interesante: dispositivos antiguos, aparatos empotrados, portales cautivos... y programas
  que no se molestan en cifrar.</p>

  <h3>Qué revisar, en orden</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Revisión de tráfico HTTP</caption>
      <thead><tr><th scope="col">Qué</th><th scope="col">Filtro</th><th scope="col">Qué buscas</th></tr></thead>
      <tbody>
        <tr><td class="d">Inventario de destinos</td><td class="f">http.request</td><td class="d">Añade <code>http.host</code> como columna. ¿Reconoces todos?</td></tr>
        <tr><td class="d">Agentes de usuario</td><td class="f">http.user_agent</td><td class="d">Vacíos, con erratas, o de herramientas que ahí no pintan nada.</td></tr>
        <tr><td class="d">Peticiones a IP directa</td><td class="f">http.host matches "^[0-9.]+$"</td><td class="d">Sin resolución DNS previa: poco propio de un navegador.</td></tr>
        <tr><td class="d">Métodos poco comunes</td><td class="f">http.request.method != "GET" &amp;&amp; http.request.method != "POST"</td><td class="d">PUT, DELETE, CONNECT donde no se esperan.</td></tr>
        <tr><td class="d">Errores repetidos</td><td class="f">http.response.code >= 400</td><td class="d">Muchos 404 seguidos: alguien probando rutas.</td></tr>
        <tr><td class="d">Descargas</td><td class="d">File → Export Objects → HTTP</td><td class="d">Tipos de fichero ejecutables o comprimidos.</td></tr>
        <tr><td class="d">Repetición regular</td><td class="f">http.request.uri contains "/api"</td><td class="d">La misma petición cada N segundos: ver la sección de beaconing.</td></tr>
      </tbody>
    </table>
  </div>

  <?= filter_chip('http.user_agent matches "(?i)curl|wget|python|powershell"') ?>

  <?= note('El User-Agent no identifica nada',
      '<p>Es una cadena de texto que el cliente escribe libremente. Un programa puede
      declararse Chrome sin serlo, y una herramienta legítima de administración puede
      declararse <code>curl</code> con toda naturalidad. Sirve para <em>agrupar</em> y para
      <em>notar diferencias</em> dentro de un mismo equipo, nunca para afirmar qué programa
      generó el tráfico. Eso se responde en el equipo, no en la captura.</p>') ?>
</section>

<!-- ============================= CLARO ============================== -->
<section id="claro">
  <h2>Credenciales en texto claro</h2>
  <p class="tut-sub">Por qué los protocolos sin cifrar son un riesgo, demostrado con datos ficticios.</p>

  <p>Algunos protocolos veteranos transmiten la autenticación sin ninguna protección. No es
  un fallo de implementación: se diseñaron cuando la red era un entorno de confianza.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Protocolos que transmiten credenciales sin cifrar y sus alternativas</caption>
      <thead><tr><th scope="col">Protocolo</th><th scope="col">Qué expone</th><th scope="col">Alternativa</th></tr></thead>
      <tbody>
        <tr><td class="f">Telnet</td><td class="d">La sesión entera, incluida la contraseña tecleada carácter a carácter</td><td class="d">SSH</td></tr>
        <tr><td class="f">FTP</td><td class="d">Usuario y contraseña en los comandos USER y PASS</td><td class="d">SFTP o FTPS</td></tr>
        <tr><td class="f">HTTP básico</td><td class="d">Usuario y contraseña en Base64, que no es cifrado</td><td class="d">HTTPS</td></tr>
        <tr><td class="f">SNMPv1/v2c</td><td class="d">La <em>community string</em>, que funciona como contraseña</td><td class="d">SNMPv3</td></tr>
        <tr><td class="f">POP3 / IMAP sin TLS</td><td class="d">Credenciales de correo</td><td class="d">Sus variantes sobre TLS</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Demostración de laboratorio</h3>

  <p>Así se ve un inicio de sesión FTP en un Follow TCP Stream. Los datos son ficticios y el
  servidor, uno de laboratorio propio:</p>

  <?= term('220 Servidor FTP de laboratorio' . "\n"
         . 'USER usuario_demo' . "\n"
         . '331 Please specify the password.' . "\n"
         . 'PASS password_demo' . "\n"
         . '230 Login successful.', 'follow tcp stream · ftp de laboratorio') ?>

  <p>No hay ninguna técnica detrás: es Follow TCP Stream sobre una conexión FTP. El
  protocolo envía esas dos líneas tal cual.</p>

  <?= filter_chip('ftp.request.command == "PASS"') ?>
  <?= filter_chip('ftp || telnet') ?>
  <?= filter_chip('http.authorization') ?>

  <?= note('Para qué sirve esto en tu trabajo',
      '<p>El objetivo de esta sección no es enseñar a recoger credenciales, sino a
      <strong>auditar tu propia red</strong>. Ejecuta <code>ftp || telnet ||
      http.authorization</code> sobre una captura de tu segmento: cada coincidencia es un
      sistema que está exponiendo credenciales y que hay que migrar o aislar. Es una tarea
      de inventario perfectamente legítima y bastante reveladora, sobre todo en redes con
      impresoras, cámaras o equipamiento industrial antiguo.</p>
      <p>En esta guía nunca aparecen credenciales reales de ningún sistema. Los ejemplos
      usan <code>usuario_demo</code> y <code>password_demo</code>, y así deberías hacerlo tú
      en cualquier material que compartas.</p>', 'info') ?>
</section>

<!-- ============================ RESETS ============================== -->
<section id="resets">
  <h2>Resets, retransmisiones y cómo no equivocarse</h2>
  <p class="tut-sub">Los hallazgos que más veces se malinterpretan.</p>

  <p>Un RST o una retransmisión no dicen por sí solos qué ha pasado. Dicen que algo
  interrumpió el flujo esperado. La causa hay que deducirla del contexto, y hay varias
  posibles con firmas distintas.</p>

  <h3>Un RST: cuatro explicaciones</h3>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Interpretaciones posibles de un TCP reset</caption>
      <thead><tr><th scope="col">Causa</th><th scope="col">Cómo se distingue</th></tr></thead>
      <tbody>
        <tr><td class="d">Puerto cerrado</td><td class="d">El RST responde inmediatamente a un SYN. Nunca hubo conexión. Es la respuesta correcta del sistema operativo.</td></tr>
        <tr><td class="d">La aplicación cerró de golpe</td><td class="d">Hubo handshake y datos, y luego RST en vez de FIN. El programa terminó sin cerrar bien; muy común y no indica nada malo.</td></tr>
        <tr><td class="d">Un intermediario cortó</td><td class="d">RST a mitad de una sesión sana, a menudo <strong>desde los dos lados</strong> o con un TTL que no encaja con el del resto de la conversación. Cortafuegos o proxy.</td></tr>
        <tr><td class="d">Tiempo de espera agotado</td><td class="d">RST después de un silencio largo. Un equipo de red descartó el estado de una conexión ociosa.</td></tr>
      </tbody>
    </table>
  </div>

  <p>El truco del <strong>TTL</strong> es el más útil de la tabla: si todos los paquetes del
  servidor llegan con TTL 51 y de pronto aparece un RST «del servidor» con TTL 64, ese RST
  no lo envió el servidor. Lo envió algo mucho más cercano.</p>

  <?= filter_chip('tcp.flags.reset == 1') ?>

  <h3>Retransmisiones: qué las causa de verdad</h3>

  <ul>
    <li><strong>Pérdida real en la red.</strong> Congestión, enlace saturado, wifi con
    interferencias. Suele venir con ACK duplicados y afecta a varias conversaciones a la vez.</li>
    <li><strong>Pérdida solo en tu captura.</strong> Tu equipo no dio abasto y
    <code>dumpcap</code> descartó paquetes. Wireshark ve un hueco y lo marca. La red estaba
    perfectamente.</li>
    <li><strong>Punto de observación.</strong> Capturando en el cliente ves lo que le llegó
    al cliente; el paquete pudo llegar bien al servidor.</li>
    <li><strong>Reordenación.</strong> Marcado como <em>out-of-order</em>, no como pérdida.
    Es benigno.</li>
  </ul>

  <?= steps([
      'Comprueba primero <strong>Statistics → Capture File Properties</strong>: si hay paquetes descartados, sospecha de tu propia captura antes que de la red.',
      'Mira si el problema afecta a <strong>una sola conversación</strong> o a todas. Una sola apunta a ese servidor o esa ruta; todas apuntan al enlace local.',
      'Compara el porcentaje con tu línea base. En wifi, un pequeño porcentaje de retransmisiones es normal.',
      'Mira si hay <code>tcp.analysis.zero_window</code>: si lo hay, el cuello de botella es un extremo saturado, no la red.',
      'Superpón en el <strong>I/O Graph</strong> el tráfico total y las retransmisiones. Si suben juntas, es congestión.',
  ]) ?>

  <?= note('Retransmisión no es ataque',
      '<p>Es la corrección de errores de TCP haciendo su trabajo. Ver retransmisiones
      significa que la red pierde algo y que TCP lo está arreglando — que es exactamente
      para lo que se diseñó. Sacar de ahí la conclusión de que hay un ataque es el error de
      interpretación más frecuente entre quien empieza a usar Expert Information.</p>') ?>

  <?= evidence(
      '<p>Varias conexiones a un mismo dominio terminan con <code>RST</code> justo después
      del <em>Client Hello</em>, y el TTL de esos <code>RST</code> no coincide con el del
      resto de paquetes de ese extremo.</p>',
      '<p>Sugiere que el <code>RST</code> <strong>no lo envió el servidor</strong>, sino
      algo situado en el camino: un cortafuegos con inspección de SNI, un sistema de
      filtrado o un proxy transparente.</p>',
      '<p>Quién lo hace ni con qué finalidad. El TTL discrepante indica que el paquete
      recorrió menos saltos de los que debería, lo cual es un indicio bueno, pero un
      balanceador o un CDN pueden explicarlo también. Y desde una sola captura no se puede
      decir dónde está exactamente ese dispositivo.</p>') ?>

</section>

<!-- ============================= FLUJO ============================== -->
<section id="flujo">
  <h2>Flujo de análisis en diez preguntas</h2>
  <p class="tut-sub">El procedimiento que aplicar a cualquier captura, en este orden.</p>

  <p>Cuando llega una captura y hay que decir algo sobre ella, el error es empezar a mirar
  paquetes al azar. Esta secuencia va de lo general a lo concreto y evita perderse.</p>

  <ol class="flow">
    <li>
      <b>¿Quién habla?</b>
      <span class="flow__tool">Statistics → Endpoints</span>
      <p>Inventario de equipos que aparecen. ¿Reconoces todas las direcciones? ¿Hay alguna
      que no debería estar en este segmento?</p>
    </li>
    <li>
      <b>¿Con quién?</b>
      <span class="flow__tool">Statistics → Conversations</span>
      <p>Parejas y volumen. Ordena por bytes y por número de paquetes. Los extremos de la
      lista son siempre lo más informativo.</p>
    </li>
    <li>
      <b>¿Qué protocolo?</b>
      <span class="flow__tool">Statistics → Protocol Hierarchy</span>
      <p>Reparto por protocolo. Busca lo que no debería estar, y el porcentaje de tráfico
      sin clasificar.</p>
    </li>
    <li>
      <b>¿Cuándo?</b>
      <span class="flow__tool">Columna Time · Capture File Properties</span>
      <p>Ventana temporal cubierta y a qué hora ocurrió lo interesante. Pon el formato de
      hora absoluta para poder correlacionar con otros registros.</p>
    </li>
    <li>
      <b>¿Con qué frecuencia?</b>
      <span class="flow__tool">I/O Graphs · delta de tiempo</span>
      <p>¿Es un evento único, una ráfaga o un latido regular? Cambia la escala del gráfico:
      lo que a un segundo parece ruido, a un minuto puede ser un patrón.</p>
    </li>
    <li>
      <b>¿Cuánto tráfico?</b>
      <span class="flow__tool">Conversations · bytes A→B y B→A</span>
      <p>Volumen y sobre todo dirección. La asimetría cuenta más que el total.</p>
    </li>
    <li>
      <b>¿Qué contenido?</b>
      <span class="flow__tool">Follow Stream · Export Objects</span>
      <p>Si está en claro, léelo. Si va cifrado, quédate con los metadatos: SNI, tamaños,
      tiempos. Y dilo explícitamente en el informe.</p>
    </li>
    <li>
      <b>¿Es normal?</b>
      <span class="flow__tool">Tu línea base</span>
      <p>La pregunta que da sentido a las siete anteriores. Sin referencia, todo parece
      sospechoso y nada lo es.</p>
    </li>
    <li>
      <b>¿Qué evidencia tengo?</b>
      <span class="flow__tool">Números de trama · marcas de tiempo · hash del fichero</span>
      <p>Anota tramas concretas, no impresiones. Otra persona debe poder abrir la misma
      captura y ver lo mismo.</p>
    </li>
    <li>
      <b>¿Qué hipótesis tengo?</b>
      <span class="flow__tool">Escrito aparte de la evidencia</span>
      <p>Formúlala como hipótesis, con lo que la apoya y lo que la contradice. Y anota qué
      haría falta para confirmarla, porque casi nunca está en la captura.</p>
    </li>
  </ol>

  <?= note('Los dos últimos pasos son los que más se saltan',
      '<p>Y son los que convierten «he estado mirando una captura» en un análisis. Separar
      evidencia de hipótesis no es burocracia: es lo que permite que otra persona revise tu
      trabajo, que tú mismo detectes que te habías precipitado, y que una conclusión
      equivocada no acabe teniendo consecuencias sobre alguien que no había hecho nada.</p>') ?>
</section>

<!-- ============================ INFORME ============================= -->
<section id="informe">
  <h2>Mini informe de incidente</h2>
  <p class="tut-sub">Una plantilla corta que obliga a separar lo observado de lo supuesto.</p>

  <p>Un informe no tiene que ser largo. Tiene que ser <strong>reproducible</strong>:
  cualquiera con la misma captura debe llegar a los mismos hechos.</p>

  <?= term('Fecha:                 2026-09-08 14:05–14:35 UTC-6' . "\n"
         . 'Captura:               incidente-20260908.pcapng' . "\n"
         . 'SHA-256 de la captura: 3f9a…  (calculado al obtenerla)' . "\n"
         . 'Punto de captura:      switch principal, puerto espejo del segmento 10.2.3.0/24' . "\n"
         . 'Equipo origen:         PC-CONTABILIDAD-04' . "\n"
         . 'IP origen:             10.2.3.55   (MAC 00:1a:2b:3c:4d:5e)' . "\n"
         . 'Destino:               203.0.113.9' . "\n"
         . 'Puerto / protocolo:    443/tcp · TLS 1.3 · SNI: api.ejemplo-desconocido.net' . "\n"
         . 'Primera conexión:      14:07:12' . "\n"
         . 'Última conexión:       14:34:48' . "\n"
         . 'Frecuencia:            cada 60 s ± 6 s  (28 conexiones)' . "\n"
         . 'Bytes enviados:        41 kB' . "\n"
         . 'Bytes recibidos:       12 kB' . "\n"
         . 'DNS relacionado:       trama 812 · A api.ejemplo-desconocido.net → 203.0.113.9' . "\n"
         . "\n"
         . 'Indicadores observados:' . "\n"
         . '  - Intervalo casi constante entre conexiones (tramas 815, 1042, 1288…)' . "\n"
         . '  - Transferencias pequeñas y de tamaño similar en cada conexión' . "\n"
         . '  - Dominio ausente de la línea base de 2026-08-15' . "\n"
         . '  - Actividad continúa fuera del horario del usuario' . "\n"
         . "\n"
         . 'Evidencia:' . "\n"
         . '  - tcp.stream 14, 15, 16 … 41 en la captura citada' . "\n"
         . '  - Consulta DNS en la trama 812' . "\n"
         . '  - Statistics → Conversations: 28 conexiones, 53 kB totales' . "\n"
         . "\n"
         . 'Hipótesis (NO confirmada):' . "\n"
         . '  Proceso automatizado en el equipo consultando periódicamente un servicio' . "\n"
         . '  externo. La periodicidad y el destino desconocido son compatibles con un' . "\n"
         . '  canal de control, pero también con software legítimo no inventariado.' . "\n"
         . "\n"
         . 'Lo que esta captura NO permite determinar:' . "\n"
         . '  - Qué proceso del equipo generó el tráfico' . "\n"
         . '  - Qué contenido se transmitió (TLS 1.3, sin claves)' . "\n"
         . '  - Si el destino es legítimo' . "\n"
         . "\n"
         . 'Siguientes pasos:' . "\n"
         . '  1. En el equipo: ss -tanp durante una ventana de conexión' . "\n"
         . '  2. Revisar inventario de software autorizado del puesto' . "\n"
         . '  3. Consultar reputación del dominio en fuentes de inteligencia' . "\n"
         . '  4. Ampliar la ventana de captura a 24 h para confirmar el patrón' . "\n"
         . '  5. Revisar si otros equipos contactan el mismo destino',
         'plantilla de informe') ?>

  <p>Los tres apartados que hacen que esta plantilla funcione:</p>

  <ul>
    <li><strong>Evidencia</strong> — números de trama y de stream. Verificable.</li>
    <li><strong>Hipótesis</strong> — marcada como tal, con la alternativa benigna incluida.</li>
    <li><strong>Lo que no se puede determinar</strong> — el apartado que casi nadie escribe
    y que evita que otra persona lea de más en tus conclusiones.</li>
  </ul>

  <?= note('Sobre nombrar personas',
      '<p>Un informe técnico habla de <em>equipos</em> y <em>cuentas</em>, no de personas.
      «PC-CONTABILIDAD-04 se comunicó con…» es un hecho; «Fulano estaba exfiltrando datos»
      es una acusación que la captura no sostiene. Un equipo puede estar comprometido sin
      que su usuario tenga nada que ver — de hecho, es el caso más frecuente.</p>') ?>
</section>

  <?= recap('Ciberseguridad defensiva', [
      'Todo análisis empieza por una línea base. Sin saber qué es normal, ninguna anomalía significa nada.',
      'Un indicador aislado nunca es una conclusión: escaneo, beacon, subida grande o reset tienen explicaciones legítimas frecuentes.',
      'Lo que se afirma es qué se observó, dónde y cuándo. La causa es una hipótesis y se escribe como tal.',
      'Las cuatro limitaciones —punto de observación, ventana temporal, cifrado y pérdida— forman parte de cualquier informe honesto.',
      'El objetivo es defensivo: reconocer la señal que deja una técnica, no ejecutarla.',
  ], [
      'tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0',
      'tcp.flags.reset == 1',
      'dns.qry.name contains "ejemplo"',
      'tcp.analysis.flags',
  ], [
      'Regularidad de máquina frente a ritmo humano.',
      'Asimetría de bytes entre los dos sentidos de una conversación.',
      'TTL discrepante dentro de un mismo flujo.',
      'La diferencia entre «no responde a ICMP» y «está apagado».',
  ]) ?>

  <?= quiz([
      [
          'q' => 'Un equipo contacta con el mismo destino cada 60 segundos exactos durante horas. ¿Qué has encontrado?',
          'opts' => ['A' => 'Malware de mando y control', 'B' => 'Un patrón de beaconing que hay que atribuir a un proceso', 'C' => 'Un fallo de red', 'D' => 'Tráfico de un usuario'],
          'ok' => 'B',
          'why' => 'La regularidad demuestra que hay una máquina detrás, no una persona: eso sí es una conclusión sólida. Pero la mayoría de los beacons de cualquier red son actualizaciones, telemetría y agentes de monitorización. El hallazgo se convierte en incidente cuando no consigues atribuirlo.',
      ],
      [
          'q' => '¿Cuál de estas frases pertenece a un informe correcto?',
          'opts' => ['A' => 'El equipo fue comprometido mediante un escaneo', 'B' => 'La IP atacante escaneó el servidor', 'C' => 'Entre las 14:02 y las 14:03 se observaron 412 SYN desde 10.0.0.9 hacia 61 puertos del host 10.0.0.20, con RST en 59 de ellos', 'D' => 'Hay actividad sospechosa en la red'],
          'ok' => 'C',
          'why' => 'Es la única que se puede defender entera: dice qué se observó, cuándo, desde dónde, hacia dónde y en qué cantidad. Las otras tres mezclan observación con interpretación, o son tan vagas que no permiten a nadie hacer nada. La hipótesis va después, en su propio apartado y marcada como hipótesis.',
      ],
      [
          'q' => 'Capturaste dos minutos en tu portátil. ¿Qué NO puedes afirmar con esa captura?',
          'opts' => ['A' => 'Que tu equipo habló con esas direcciones', 'B' => 'Que ese servidor no recibió tráfico de nadie más', 'C' => 'Que hubo una resolución DNS de ese nombre', 'D' => 'Que esa conexión transportó 40 KB'],
          'ok' => 'B',
          'why' => 'Es la limitación del punto de observación. Tu portátil solo ve lo que pasa por su propia interfaz: lo que ese servidor haya hablado con otros equipos ocurre en un sitio donde no estabas mirando. Las otras tres afirmaciones sí están sostenidas por lo que hay en el fichero.',
      ],
  ]) ?>


<?= chapter('05', 'Práctica', 'Doce laboratorios sobre tu propia máquina, desafíos con solución razonada y la chuleta completa.', 'practica') ?>

<!-- ============================== LABS ============================== -->
<section id="labs">
  <h2>Doce laboratorios</h2>
  <p class="tut-sub">Wireshark en una ventana, terminal en la otra. En orden. Cada uno se apoya en el anterior; todos sobre tu propio equipo.</p>

  <?= note('Dónde se ejecutan estos laboratorios',
      '<p>Todos capturan <strong>tu propio tráfico en tu propia máquina</strong>. Los que
      hablan de tráfico sospechoso trabajan sobre capturas que generas tú mismo con
      herramientas normales. No hay ningún ejercicio que requiera tocar una red ajena, y no
      debes adaptarlos para hacerlo.</p>', 'info') ?>

  <div class="lab" id="lab1">
    <?= lab_head('01', 'Encontrar tu propia IP y tu interfaz', 'basico',
        'Objetivo: no volver a capturar en la interfaz equivocada.') ?>
    <p><strong>Preparación:</strong> ninguna. Solo una terminal.</p>
    <?= steps([
        'Ejecuta <code>ip addr</code> y localiza la interfaz con estado <code>UP</code> y una dirección <code>inet</code>.',
        'Anota interfaz, IP y máscara. Aquí: <code>wlan0</code>, <code>10.2.3.170/24</code>.',
        'Ejecuta <code>ip route | head -1</code> y anota el gateway.',
        'Ejecuta <code>ip link</code> y anota tu dirección MAC.',
        'Ejecuta <code>tshark -D</code> y comprueba que tu interfaz aparece la primera.',
    ]) ?>
    <p><strong>Qué observar:</strong> el <code>/24</code> te dice el tamaño de tu red local.
    Todo lo que esté fuera de <code>10.2.3.0–10.2.3.255</code> saldrá por el gateway.</p>
    <p><strong>Comprobación:</strong> abre Wireshark y verifica que la sparkline de esa
    interfaz se mueve.</p>
    <p><strong>Error común:</strong> elegir <code>any</code> «por si acaso». Funciona, pero
    no tiene cabecera Ethernet real y luego los ejercicios de capa 2 no salen.</p>
    <p><strong>Qué has aprendido:</strong> los cuatro datos —interfaz, IP, máscara,
    gateway— que hacen falta antes de cualquier análisis.</p>
    <p><strong>Pregunta:</strong> tu red es <code>10.2.3.0/24</code>. Capturas y ves un
    paquete hacia <code>10.2.9.4</code>. ¿A qué dirección MAC irá dirigida esa trama?</p>
    <?= hints([
        '<p>Una máscara <code>/24</code> significa que los tres primeros octetos identifican tu red.</p>',
        '<p>¿Está <code>10.2.9.4</code> dentro de <code>10.2.3.0–10.2.3.255</code>?</p>',
        '<p>Todo lo que no está en tu red sale por un único sitio. Míralo con <code>ip route | head -1</code>.</p>',
    ]) ?>
    <?= solution(
        'A la MAC del <strong>gateway</strong>, no a ninguna MAC de 10.2.9.4.',
        '<p>Con máscara <code>/24</code> tu red local llega hasta <code>10.2.3.255</code>, así
        que <code>10.2.9.4</code> está fuera. Tu equipo no puede entregarle una trama
        directamente —no comparten segmento de capa 2— y tampoco tiene forma de conocer su
        MAC: ARP solo funciona dentro de la red local.</p>
        <p>Lo que hace es poner la <strong>IP de destino final</strong> en la cabecera IP y
        la <strong>MAC del gateway</strong> en la cabecera Ethernet. Esa disociación —destino
        de capa 3 lejano, destino de capa 2 vecino— es la idea central del encaminamiento, y
        se ve con los ojos en cualquier captura.</p>',
        'Que la MAC de destino de una trama casi nunca es la del equipo con el que estás hablando.') ?>

  </div>

  <div class="lab" id="lab2">
    <?= lab_head('02', 'Capturar un ping y leer el árbol', 'basico',
        'Objetivo: leer las tres capas de un paquete que entiendes entero.') ?>
    <p><strong>Preparación:</strong> Wireshark capturando en tu interfaz, filtro
    <code>icmp</code> puesto.</p>
    <?= steps([
        'En una terminal: <code>ping -c 4 1.1.1.1</code>.',
        'Selecciona el primer <em>Echo (ping) request</em>.',
        'Despliega <strong>Ethernet II</strong> y compara la MAC destino con la de tu gateway.',
        'Despliega <strong>IPv4</strong> y localiza el TTL.',
        'Despliega <strong>ICMP</strong> y localiza tipo, identificador y número de secuencia.',
        'Pincha el campo TTL y mira qué byte se resalta abajo.',
    ]) ?>
    <div class="filter"><span class="filter__tag">Display</span><code class="filter__val">icmp</code></div>
    <p><strong>Qué observar:</strong> ocho paquetes, cuatro request y cuatro reply. El
    identificador es igual en todos; la secuencia va 1, 2, 3, 4.</p>
    <p><strong>Explicación:</strong> el TTL de salida es 64 y el de vuelta menor; la
    diferencia son los saltos que recorrió la respuesta.</p>
    <p><strong>Comprobación:</strong> 64 menos el TTL de la respuesta debe dar un número
    razonable de saltos (entre 5 y 25 para un destino de internet).</p>
    <p><strong>Error común:</strong> no ver nada porque el filtro está en la barra de
    captura y no en la de visualización.</p>
    <p><strong>Qué has aprendido:</strong> a leer el árbol completo y a relacionar campo y
    byte.</p>
    <p><strong>Pregunta:</strong> el TTL de tus <em>request</em> es 64 y el de los
    <em>reply</em> que llegan es 53. ¿Cuántos saltos hay hasta el destino?</p>
    <?= hints([
        '<p>El TTL lo fija el sistema que <em>origina</em> el paquete, con un valor inicial redondo.</p>',
        '<p>Cada router que reenvía un paquete le resta uno. El valor que tú ves es el que quedó al llegar.</p>',
        '<p>Los valores iniciales habituales son 64 (Linux, macOS), 128 (Windows) y 255 (algunos equipos de red).</p>',
    ]) ?>
    <?= solution(
        'Once saltos, <em>probablemente</em>.',
        '<p>El razonamiento: el <em>reply</em> salió del destino con un TTL inicial que no
        ves. Si ese destino es un Linux, salió con 64; llegó con 53; luego lo decrementaron
        once routers. 64 − 53 = 11.</p>
        <p>El «probablemente» es importante y es la mitad del ejercicio. Si el destino fuera
        un Windows habría salido con 128 y el resultado serían 75 saltos, cifra absurda que
        delataría la suposición errónea. Se asume 64 porque es el valor inicial más común y
        porque 11 saltos es una distancia razonable en internet — pero es una
        <strong>inferencia</strong>, no una medición. La medición se hace con
        <code>traceroute</code>.</p>',
        'A distinguir un dato leído de una cifra deducida a partir de una suposición.') ?>

  </div>

  <div class="lab" id="lab3">
    <?= lab_head('03', 'Provocar y leer un intercambio ARP', 'basico',
        'Objetivo: ver la capa 2 en acción, por debajo de IP.') ?>
    <p><strong>Preparación:</strong> capturando, filtro <code>arp</code>.</p>
    <?= steps([
        'Vacía la tabla: <code>sudo ip neigh flush all</code>.',
        'Provoca la resolución: <code>ping -c 2 10.2.3.1</code> (tu gateway).',
        'Localiza el par request/reply.',
        'En el request, comprueba que el destino Ethernet es <code>ff:ff:ff:ff:ff:ff</code>.',
        'En el reply, anota la MAC del gateway.',
        'Contrasta con <code>ip neigh</code> en la terminal.',
    ]) ?>
    <p><strong>Qué observar:</strong> el request va en broadcast y el reply en unicast. En el
    request, el campo «Target MAC» está a ceros: es lo que se pregunta.</p>
    <p><strong>Comprobación:</strong> la MAC del reply y la de <code>ip neigh</code> deben
    coincidir.</p>
    <p><strong>Error común:</strong> esperar ARP para <code>1.1.1.1</code>. No existe: para
    salir de la red todo va al gateway.</p>
    <p><strong>Qué has aprendido:</strong> cómo se resuelve IP→MAC, y cuál es la MAC de tu
    gateway — el dato base del laboratorio 12.</p>
    <p><strong>Pregunta:</strong> haces <code>ping 1.1.1.1</code> con la tabla ARP vacía.
    ¿Verás un ARP request preguntando por <code>1.1.1.1</code>?</p>
    <?= hints([
        '<p>ARP es un protocolo de capa 2 y no sale de tu red local.</p>',
        '<p>¿Está <code>1.1.1.1</code> en tu red local?</p>',
        '<p>Piensa qué dirección necesita tu equipo para poder <em>enviar</em> la trama.</p>',
    ]) ?>
    <?= solution(
        'No. Verás un ARP request preguntando por la IP de tu <strong>gateway</strong>.',
        '<p>ARP no atraviesa routers: es un protocolo de difusión dentro de un mismo segmento
        de capa 2. Preguntar «¿quién tiene 1.1.1.1?» en tu red doméstica no tendría sentido,
        porque ahí no está y nadie podría responder.</p>
        <p>Lo que tu equipo necesita es entregar la trama al siguiente salto. Consulta su
        tabla de rutas, ve que <code>1.1.1.1</code> no es local, decide mandarla al gateway y
        entonces necesita la MAC <em>del gateway</em>. Esa es la resolución que provoca el
        ARP. Después, ese ARP no se repite: la respuesta queda en caché durante minutos, que
        es por lo que el ejercicio empieza vaciando la tabla.</p>',
        'Que ARP solo pregunta por vecinos, y que por eso vaciar la caché es el paso obligatorio para verlo.') ?>

  </div>

  <div class="lab" id="lab4">
    <?= lab_head('04', 'Observar una resolución DNS completa', 'basico',
        'Objetivo: emparejar consulta y respuesta y leer los registros.') ?>
    <p><strong>Preparación:</strong> capturando, filtro <code>dns</code>.</p>
    <?= steps([
        'Ejecuta <code>dig +short archlinux.org</code>.',
        'Selecciona la consulta y anota el <strong>Transaction ID</strong>.',
        'Selecciona la respuesta y comprueba que el ID coincide.',
        'Despliega <code>Answers</code> y anota las IP devueltas.',
        'Busca el campo <code>[Time: …]</code> que Wireshark añade a la respuesta.',
        'Repite con <code>dig AAAA archlinux.org</code> y compara.',
    ]) ?>
    <div class="filter"><span class="filter__tag">Display</span><code class="filter__val">dns</code></div>
    <p><strong>Qué observar:</strong> el nombre viaja en claro. El ID es lo único que
    empareja pregunta y respuesta, porque UDP no tiene conexión.</p>
    <p><strong>Comprobación:</strong> las IP de <code>Answers</code> deben ser las mismas que
    imprime <code>dig +short</code>.</p>
    <p><strong>Error común:</strong> no ver nada porque el sistema usa DNS sobre TLS o sobre
    HTTPS. Si es tu caso, <code>dig</code> a un resolver concreto: <code>dig @10.2.3.1
    archlinux.org</code>.</p>
    <p><strong>Qué has aprendido:</strong> que DNS delata a dónde va un equipo aunque el
    resto vaya cifrado.</p>
    <p><strong>Pregunta:</strong> ves la respuesta DNS pero <em>no</em> encuentras la
    consulta que la provocó. ¿Qué explica eso?</p>
    <?= hints([
        '<p>Piensa primero en cuándo empezaste a capturar.</p>',
        '<p>El campo que empareja las dos mitades es el <b>Transaction ID</b>: búscalo en la respuesta y filtra por él.</p>',
        '<p>Y piensa también por dónde salió la consulta: ¿tiene que haber salido por la misma interfaz?</p>',
    ]) ?>
    <?= solution(
        'Lo más probable: la consulta salió antes de que empezaras a capturar.',
        '<p>Es la explicación más frecuente y la primera que hay que descartar, porque es
        trivial: la captura tiene un principio, y lo que ocurrió antes no está.</p>
        <p>Otras dos explicaciones posibles, en orden de probabilidad: que la consulta saliera
        por <strong>otra interfaz</strong> (capturas en <code>wlan0</code> y el sistema la
        mandó por el cable), o que se perdieran tramas —<strong>Statistics → Capture File
        Properties</strong> te dice si <code>dumpcap</code> descartó algo—.</p>
        <p>Lo que <em>no</em> es una buena explicación es «DNS cifrado»: si el equipo usara
        DoH o DoT, tampoco verías la respuesta. Que veas una mitad y no la otra apunta a un
        problema de la captura, no del protocolo.</p>',
        'A ordenar las hipótesis por probabilidad antes de saltar a la más interesante.') ?>

  </div>

  <div class="lab" id="lab5">
    <?= lab_head('05', 'Reconstruir un handshake TCP', 'intermedio',
        'Objetivo: identificar los tres paquetes de apertura y su aritmética.') ?>
    <p><strong>Preparación:</strong> capturando, sin filtro.</p>
    <?= steps([
        'Ejecuta <code>curl -s -o /dev/null http://neverssl.com</code>.',
        'Aplica <code>tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0</code> y localiza el SYN.',
        'Clic derecho sobre él → <strong>Conversation Filter → TCP</strong>.',
        'Cuenta los paquetes e identifica: SYN, SYN-ACK, ACK, petición, respuesta, cierre.',
        'En cada uno, despliega <strong>Flags</strong> y anota cuáles están activos.',
        'Anota <code>Seq</code> y <code>Ack</code> de los tres primeros.',
    ]) ?>
    <div class="filter"><span class="filter__tag">Display</span><code class="filter__val">tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0</code></div>
    <p><strong>Qué observar:</strong> con números relativos, SYN lleva Seq=0; SYN-ACK lleva
    Seq=0 y Ack=1; el ACK lleva Ack=1. El 0 lo consumió el SYN.</p>
    <p><strong>Comprobación:</strong> si sumas <code>Seq + Len</code> de un segmento con
    datos, obtienes el <code>Ack</code> con que responde el otro lado.</p>
    <p><strong>Error común:</strong> buscar el handshake en HTTPS y perderse entre los
    paquetes de TLS. Empieza por HTTP, que es más corto.</p>
    <p><strong>Qué has aprendido:</strong> a leer el estado de una conexión TCP a partir de
    sus flags y sus números.</p>
    <p><strong>Pregunta:</strong> ves un <code>SYN</code> al puerto 80 al que responde un
    <code>RST, ACK</code>. Después, otro <code>SYN</code> al 8080 que no recibe ninguna
    respuesta. ¿Qué dice cada caso del puerto correspondiente?</p>
    <?= hints([
        '<p>Las dos respuestas posibles a un SYN significan cosas opuestas; la ausencia de respuesta es un tercer caso.</p>',
        '<p>Un <code>RST</code> exige que alguien lo genere: es una respuesta activa.</p>',
        '<p>¿Qué tendría que pasar en el camino para que un paquete no produjera ninguna reacción?</p>',
    ]) ?>
    <?= solution(
        'El 80 está cerrado pero el equipo está vivo. El 8080 está filtrado, y no sabes si hay algo detrás.',
        '<p><strong>El 80.</strong> Un <code>RST, ACK</code> es una negativa explícita: la
        pila TCP del destino recibió el SYN, comprobó que nadie escucha en ese puerto y
        contestó «no». Eso demuestra dos cosas a la vez: que el puerto está cerrado y que
        <strong>el equipo está encendido y es alcanzable</strong>. Un «no» también es
        información.</p>
        <p><strong>El 8080.</strong> El silencio no distingue. Puede que un cortafuegos
        descartara el SYN a la ida, o la respuesta a la vuelta, o que el paquete se perdiera.
        Lo único que puedes afirmar es que <em>no obtuviste respuesta</em>. Si hay un
        servicio escuchando detrás o no, esta captura no lo dice — y esa incertidumbre es
        exactamente lo que Nmap llama <code>filtered</code>.</p>',
        'Que la ausencia de respuesta es un resultado distinto de una respuesta negativa, y mucho menos informativo.') ?>

  </div>

  <div class="lab" id="lab6">
    <?= lab_head('06', 'Analizar un handshake TLS', 'intermedio',
        'Objetivo: ver qué revela HTTPS aunque el contenido esté cifrado.') ?>
    <p><strong>Preparación:</strong> capturando, filtro <code>tls</code>.</p>
    <?= steps([
        'Ejecuta <code>curl -s -o /dev/null https://archlinux.org</code>.',
        'Localiza el <strong>Client Hello</strong> (<code>tls.handshake.type == 1</code>).',
        'Despliega hasta las extensiones y encuentra <code>server_name</code>.',
        'Añade <code>tls.handshake.extensions_server_name</code> como columna.',
        'Localiza el <strong>Server Hello</strong> y anota la versión y el cipher suite.',
        'Intenta un Follow TCP Stream y comprueba que el contenido es ilegible.',
    ]) ?>
    <div class="filter"><span class="filter__tag">Display</span><code class="filter__val">tls.handshake.type == 1</code></div>
    <p><strong>Qué observar:</strong> el SNI está en claro. Con TLS 1.3 probablemente no
    veas certificados: van cifrados.</p>
    <p><strong>Comprobación:</strong> la columna SNI debe mostrar <code>archlinux.org</code>
    exactamente en el Client Hello y estar vacía en el resto.</p>
    <p><strong>Error común:</strong> concluir que «Wireshark no ve HTTPS». Ve bastante: el
    destino, el tamaño y el ritmo. No ve el contenido.</p>
    <p><strong>Qué has aprendido:</strong> a distinguir metadatos de contenido — la base de
    todo el análisis de tráfico cifrado.</p>
    <p><strong>Pregunta:</strong> con TLS 1.3 no ves el certificado del servidor. ¿Significa
    eso que la conexión es menos transparente que con TLS 1.2?</p>
    <?= hints([
        '<p>Pregúntate primero qué información del certificado te interesaba de verdad.</p>',
        '<p>¿Hay algún otro campo del handshake que te dé el nombre del servidor?</p>',
        '<p>Filtra por <code>tls.handshake.type == 1</code> y despliega hasta las extensiones.</p>',
    ]) ?>
    <?= solution(
        'Para identificar con quién se habla, no. El SNI del Client Hello sigue en claro.',
        '<p>En TLS 1.2 el certificado viajaba sin cifrar y de ahí salía el nombre del
        servidor. En TLS 1.3 el certificado va cifrado, y esa parte concreta sí se pierde.</p>
        <p>Pero el dato que más se usa en análisis —<em>a qué nombre se conectó este
        equipo</em>— sigue disponible, porque el <strong>SNI</strong> se envía en el Client
        Hello, antes de que exista cifrado alguno. Tiene que ser así: el servidor necesita
        saber qué certificado presentar antes de poder cifrar nada.</p>
        <p>Lo que sí pierdes con TLS 1.3 es el detalle del certificado: emisor, fechas de
        validez, algoritmo. Para una investigación de «con quién habla», irrelevante. Para
        una auditoría de la configuración TLS de <em>tu propio</em> servidor, ahí sí importa
        — y se hace desde el servidor, no desde una captura.</p>',
        'Que «cifrado» no es un interruptor: distintas versiones esconden cosas distintas.') ?>

  </div>

  <div class="lab" id="lab7">
    <?= lab_head('07', 'Follow TCP Stream sobre HTTP', 'intermedio',
        'Objetivo: dejar de mirar paquetes y leer la conversación.') ?>
    <p><strong>Preparación:</strong> la captura del laboratorio 5, con la petición a
    <code>neverssl.com</code>.</p>
    <?= steps([
        'Clic derecho en cualquier paquete de esa conexión → <strong>Follow → TCP Stream</strong>.',
        'Identifica en la ventana qué parte enviaste tú y cuál el servidor: van en colores distintos.',
        'Localiza la línea <code>GET / HTTP/1.1</code> y las cabeceras <code>Host</code> y <code>User-Agent</code>.',
        'Cambia el desplegable de dirección a solo <em>cliente → servidor</em>.',
        'Cambia <strong>Show data as</strong> a <em>HEX Dump</em> y compara.',
        'Cierra y observa el filtro que Wireshark ha dejado puesto: <code>tcp.stream eq N</code>.',
    ]) ?>
    <p><strong>Qué observar:</strong> no hace falta ninguna herramienta especial para leer
    HTTP. Eso <em>es</em> lo que significa que no esté cifrado.</p>
    <p><strong>Comprobación:</strong> cambia el número de <code>tcp.stream</code> y verás
    otra conversación distinta de la captura.</p>
    <p><strong>Error común:</strong> usar Follow sobre TLS y concluir que está roto. El
    contenido cifrado se ve como basura binaria; es lo esperado.</p>
    <p><strong>Qué has aprendido:</strong> a reensamblar un diálogo completo y a moverte por
    la captura con <code>tcp.stream</code>.</p>
    <p><strong>Pregunta:</strong> en Follow Stream ves la petición completa del cliente pero
    la respuesta del servidor aparece cortada a la mitad. ¿Qué ha pasado?</p>
    <?= hints([
        '<p>Follow Stream reconstruye lo que hay en el fichero. Si falta algo, faltaba antes.</p>',
        '<p>Mira si la conexión llegó a cerrarse: busca los <code>FIN</code> al final del flujo.</p>',
        '<p><b>Statistics → Capture File Properties</b> dice cuántas tramas descartó <code>dumpcap</code>.</p>',
    ]) ?>
    <?= solution(
        'Casi siempre: se perdieron tramas al capturar, o la captura se detuvo antes de que terminara la respuesta.',
        '<p>Follow Stream no inventa: pega los bytes de los segmentos que están en el fichero,
        en orden. Un hueco en la salida es un hueco en la captura.</p>
        <p>Las dos causas, en orden de probabilidad: <strong>pérdida durante la captura</strong>
        —el equipo iba justo de CPU o disco y <code>dumpcap</code> descartó tramas; el diálogo
        de Capture File Properties te lo dice con un número— o <strong>una captura
        detenida</strong> antes de que el servidor terminara de enviar.</p>
        <p>Una tercera, menos común pero real: un <strong>filtro de captura demasiado
        estrecho</strong> que dejó fuera parte del flujo. Por eso la regla es capturar ancho
        y filtrar estrecho.</p>',
        'Que un análisis se hace sobre lo que hay en el fichero, y que comprobar si el fichero está completo es el primer paso, no el último.') ?>

  </div>

  <div class="lab" id="lab8">
    <?= lab_head('08', 'Inventariar los endpoints principales', 'intermedio',
        'Objetivo: pasar del paquete al panorama con Statistics.') ?>
    <p><strong>Preparación:</strong> captura de 2–3 minutos de navegación normal.</p>
    <?= steps([
        'Abre <strong>Statistics → Capture File Properties</strong> y comprueba que no hay paquetes descartados.',
        'Abre <strong>Statistics → Protocol Hierarchy</strong> y anota los tres protocolos con más bytes.',
        'Abre <strong>Statistics → Endpoints → IPv4</strong> y ordena por bytes. Anota los cinco primeros.',
        'Abre <strong>Statistics → Conversations → TCP</strong> y ordena por bytes.',
        'Añade la columna SNI y anota los dominios que aparecen.',
        'Guarda todo esto: es tu primera línea base.',
    ]) ?>
    <p><strong>Qué observar:</strong> unos pocos destinos concentran casi todo el tráfico, y
    hay una cola larga de conexiones pequeñas. Esa forma es la normal.</p>
    <p><strong>Comprobación:</strong> los bytes de Protocol Hierarchy deben cuadrar
    aproximadamente con el tamaño del fichero.</p>
    <p><strong>Error común:</strong> olvidar <em>Limit to display filter</em> y no entender
    por qué los números no coinciden con lo que se ve en pantalla.</p>
    <p><strong>Qué has aprendido:</strong> el recorrido de Statistics que abre cualquier
    investigación, y tu primera referencia de normalidad.</p>
    <p><strong>Pregunta:</strong> en Endpoints, tu portátil aparece con 78 destinos externos
    distintos en cinco minutos. ¿Es eso preocupante?</p>
    <?= hints([
        '<p>Piensa en qué software estaba abierto mientras capturabas.</p>',
        '<p>¿Cuántos dominios distintos contacta una sola página web moderna?</p>',
        '<p>Compara la pregunta «¿cuántos destinos?» con «¿cuántos destinos para lo que es este equipo?».</p>',
    ]) ?>
    <?= solution(
        'En un portátil con un navegador abierto, no: es lo normal.',
        '<p>Una sola página web actual contacta con decenas de dominios —CDN, tipografías,
        analítica, publicidad, APIs, imágenes—. Setenta y ocho destinos en cinco minutos de
        navegación es un número corriente, y el número por sí solo no dice nada.</p>
        <p>Lo que convierte ese dato en interesante es el <strong>contraste</strong>. Los
        mismos 78 destinos desde una impresora, una cámara IP, un servidor de base de datos o
        un controlador industrial <em>sí</em> serían un hallazgo, porque ninguno de esos
        equipos tiene razón para hablar con 78 sitios de internet.</p>
        <p>La pregunta correcta nunca es «¿cuántos?», sino <strong>«¿cuántos para lo que es
        <em>este</em> equipo?»</strong>. Y responderla exige saber qué es normal en ese
        equipo: línea base otra vez.</p>',
        'Que una cifra sin contexto no es una anomalía, y que el contexto es la línea base.') ?>

  </div>

  <div class="lab" id="lab9">
    <?= lab_head('09', 'Encontrar y explicar retransmisiones', 'intermedio',
        'Objetivo: diagnosticar sin saltar a conclusiones.') ?>
    <p><strong>Preparación:</strong> una captura larga de wifi, mejor si la haces alejándote
    del router mientras descargas algo.</p>
    <?= steps([
        'Aplica <code>tcp.analysis.flags</code> y anota cuántos paquetes quedan.',
        'Abre <strong>Analyze → Expert Information</strong> y mira el reparto por severidad.',
        'Calcula el porcentaje: paquetes con anomalía sobre el total. Ese número es tu línea base de wifi.',
        'Aplica <code>tcp.analysis.retransmission</code> y comprueba si se concentran en una conversación o están repartidas.',
        'Comprueba en Capture File Properties si hubo descartes en la captura.',
        'Superpón en <strong>I/O Graphs</strong> el tráfico total y las retransmisiones.',
    ]) ?>
    <div class="filter"><span class="filter__tag">Display</span><code class="filter__val">tcp.analysis.flags</code></div>
    <p><strong>Qué observar:</strong> si las retransmisiones suben cuando sube el tráfico,
    es congestión. Si están repartidas y son pocas, es el wifi comportándose como el wifi.</p>
    <p><strong>Comprobación:</strong> repite la captura pegado al router. El porcentaje debe
    bajar de forma apreciable.</p>
    <p><strong>Error común:</strong> concluir que la red está mal sin comprobar antes si fue
    tu propia captura la que perdió paquetes.</p>
    <p><strong>Qué has aprendido:</strong> que una anomalía necesita una línea base antes de
    significar algo.</p>
    <p><strong>Pregunta:</strong> tu captura tiene un 4 % de retransmisiones. ¿Red con
    problemas, o alguien haciendo algo raro?</p>
    <?= hints([
        '<p>Una retransmisión significa que un segmento no se confirmó a tiempo. ¿Quién puede provocar eso?</p>',
        '<p>¿Están repartidas por toda la captura o concentradas en una sola conversación?</p>',
        '<p>Compáralo con una captura tuya de otro momento o de otra interfaz.</p>',
    ]) ?>
    <?= solution(
        'Casi con total seguridad, red con problemas. Y la distribución lo confirma o lo desmiente.',
        '<p>Las retransmisiones son el síntoma de red más común que existe: wifi con
        interferencias, un enlace saturado, un buffer que desborda. En una conexión
        inalámbrica un 4 % ni siquiera llama la atención.</p>
        <p>El dato que distingue es <strong>cómo se reparten</strong>. Si están esparcidas
        por todas las conversaciones, el problema es del medio: le pasa a todo el mundo por
        igual. Si se concentran en <em>una sola</em> conversación mientras el resto va fino,
        el problema es de ese camino concreto —o de ese servidor— y ahí sí hay algo que
        mirar.</p>
        <p>Lo que casi nunca son las retransmisiones es un indicio de adversario. Ningún
        atacante gana nada haciendo que TCP repita paquetes.</p>',
        'A leer la distribución de una anomalía, no solo su cantidad.') ?>

  </div>

  <div class="lab" id="lab10">
    <?= lab_head('10', 'Buscar tráfico llamativo en tu propia captura', 'avanzado',
        'Objetivo: aplicar el checklist defensivo sobre datos reales y tuyos.') ?>
    <p><strong>Preparación:</strong> una captura de 10–15 minutos de tu equipo con actividad
    normal. Guárdala en <code>.pcapng</code>.</p>
    <?= steps([
        'Lista los dominios consultados y ordénalos por frecuencia con <code>tshark</code>.',
        'Aplica <code>dns.flags.rcode == 3</code> y cuenta los NXDOMAIN.',
        'Aplica <code>dns.qry.name.len &gt; 50</code> y mira si hay nombres largos.',
        'Busca conexiones de salida: <code>ip.src == 10.2.3.0/24 &amp;&amp; !(ip.dst == 10.2.3.0/24)</code>.',
        'En Conversations, ordena por bytes enviados y busca asimetrías hacia arriba.',
        'Para cada destino que no reconozcas, busca el SNI o el DNS que lo resolvió.',
        'Escribe, para cada uno, la explicación benigna que encuentres.',
    ]) ?>
    <p><strong>Qué observar:</strong> vas a encontrar muchos destinos que no reconoces, y
    casi todos tendrán explicación: CDN, telemetría, actualizaciones, servicios del sistema.</p>
    <p><strong>Explicación:</strong> ese es exactamente el punto del ejercicio. Aprender a
    <em>explicar</em> lo desconocido es más útil que aprender a alarmarse.</p>
    <p><strong>Comprobación:</strong> deberías poder justificar el 90 % de los destinos. El
    resto es tu lista de pendientes.</p>
    <p><strong>Error común:</strong> dar por sospechoso todo lo que no se reconoce.</p>
    <p><strong>Qué has aprendido:</strong> que la mayor parte del trabajo defensivo consiste
    en descartar, no en encontrar.</p>
    <p><strong>Pregunta:</strong> encuentras una conexión a una IP que no resuelve a ningún
    nombre y que no aparece en ninguna consulta DNS de tu captura. ¿Qué has descubierto?</p>
    <?= hints([
        '<p>Que no haya DNS en la captura no significa que no lo hubiera nunca.</p>',
        '<p>¿Cuánto tiempo dura la caché de una resolución DNS?</p>',
        '<p>Hay al menos tres formas de llegar a una IP sin resolverla en este momento.</p>',
    ]) ?>
    <?= solution(
        'Has descubierto una pregunta, no una respuesta: por qué ese equipo llegó a esa IP sin resolverla aquí.',
        '<p>Las explicaciones inocentes son varias y todas frecuentes:</p>
        <ul>
          <li><strong>Caché.</strong> La resolución ocurrió antes de que empezaras a capturar
          y el resultado sigue en memoria. Es, con diferencia, la más probable.</li>
          <li><strong>DNS cifrado.</strong> Si el navegador usa DoH, la consulta viajó dentro
          de una conexión HTTPS y nunca aparecerá como <code>dns</code>.</li>
          <li><strong>IP escrita a mano.</strong> Muchísimo software se conecta a direcciones
          fijas: clientes NTP, agentes de monitorización, algunos servicios en la nube.</li>
        </ul>
        <p>Y una menos inocente: software que evita DNS <em>a propósito</em> para no dejar
        rastro. Pero esa es la cuarta hipótesis, no la primera, y solo se sostiene después de
        descartar las tres anteriores — que es exactamente lo que este laboratorio
        enseña.</p>',
        'A ordenar hipótesis por probabilidad y a no empezar por la más emocionante.') ?>

  </div>

  <div class="lab" id="lab11">
    <?= lab_head('11', 'Detectar un patrón periódico', 'avanzado',
        'Objetivo: medir periodicidad con datos que generas tú.') ?>
    <p><strong>Preparación:</strong> vas a fabricar tu propio patrón periódico para tener un
    caso conocido. En una terminal, mientras capturas:</p>
    <?= term('<span class="p">$</span> while true; do curl -s -o /dev/null https://example.com; sleep 30; done') ?>
    <p>Déjalo cinco minutos y detén la captura con <kbd>Ctrl</kbd>+<kbd>C</kbd>.</p>
    <?= steps([
        'Filtra las aperturas hacia ese destino: <code>tls.handshake.type == 1 &amp;&amp; tls.handshake.extensions_server_name contains "example"</code>.',
        'Cambia <strong>View → Time Display Format</strong> a <em>Seconds Since Previous Displayed Packet</em>.',
        'Lee la columna Time: deberían ser todos cercanos a 30.',
        'Abre <strong>Statistics → I/O Graphs</strong>, pon intervalo de 1 s y una línea con ese filtro.',
        'Compara la forma con la de tu navegación normal en el mismo gráfico.',
        'Repite el cálculo de intervalos con la receta de <code>tshark</code> de la sección de beaconing.',
    ]) ?>
    <p><strong>Qué observar:</strong> el peine regular frente a las ráfagas irregulares de la
    navegación humana. Esa diferencia visual es la señal.</p>
    <p><strong>Comprobación:</strong> los intervalos deben agruparse en torno a 30 s con muy
    poca dispersión.</p>
    <p><strong>Error común:</strong> concluir que todo lo periódico es malicioso. Acabas de
    generar tú un patrón perfectamente periódico y perfectamente inocente.</p>
    <p><strong>Qué has aprendido:</strong> a medir periodicidad, y por qué la periodicidad
    sola no basta.</p>
    <p><strong>Pregunta:</strong> dos procesos contactan con destinos externos cada 300
    segundos exactos. Uno es un cliente de correo; el otro no lo sabes. ¿Qué te haría
    preocuparte por el segundo y no por el primero?</p>
    <?= hints([
        '<p>La periodicidad es idéntica en los dos casos, así que no puede ser el criterio.</p>',
        '<p>Piensa en qué sabes del destino de cada uno.</p>',
        '<p>Compara también el volumen de datos en cada sentido.</p>',
    ]) ?>
    <?= solution(
        'La atribución: que puedas explicar el primero con un proceso conocido y el segundo no.',
        '<p>La periodicidad demuestra una sola cosa, y la demuestra bien: <strong>hay una
        máquina detrás, no una persona</strong>. Ningún humano pulsa nada cada 300 segundos
        con un margen de medio segundo durante seis horas.</p>
        <p>Pero casi todo el software moderno es así. Lo que separa un latido normal de un
        hallazgo son tres cosas, ninguna de ellas el intervalo:</p>
        <ul>
          <li><strong>Atribución.</strong> ¿Qué proceso abrió la conexión? En Linux,
          <code>ss -tp</code>. Si sabes que es el cliente de correo, se acabó.</li>
          <li><strong>Destino.</strong> ¿Aparece en la línea base de ese equipo? ¿Tiene un
          nombre que encaja con el software que debería estar corriendo?</li>
          <li><strong>Asimetría.</strong> Un latido normal envía poco y recibe poco. Enviar
          mucho y recibir casi nada cada cinco minutos es otra cosa.</li>
        </ul>',
        'Que la anomalía no está en el patrón, sino en tu incapacidad de explicarlo.') ?>

  </div>

  <div class="lab" id="lab12">
    <?= lab_head('12', 'Redactar un informe de incidente', 'avanzado',
        'Objetivo: convertir observaciones en un documento revisable.') ?>
    <p><strong>Preparación:</strong> la captura del laboratorio 11, que contiene un patrón
    periódico conocido, provocado por ti.</p>
    <?= steps([
        'Copia la plantilla de la sección «Mini informe de incidente».',
        'Rellena los datos objetivos: fechas, IP, puerto, protocolo, SNI, bytes en ambos sentidos.',
        'Calcula el hash de la captura: <code>sha256sum captura.pcapng</code>.',
        'Anota los números de trama concretos que sostienen cada observación.',
        'En «Indicadores observados» escribe solo hechos, sin interpretación.',
        'En «Hipótesis» escribe tu explicación — que aquí conoces: el bucle que lanzaste.',
        'Rellena «Lo que esta captura NO permite determinar». Sé estricto.',
        'Dale el informe a otra persona con la captura y comprueba si llega a lo mismo.',
    ]) ?>
    <p><strong>Qué observar:</strong> el ejercicio real es el último apartado. Con la captura
    delante, no puedes saber qué proceso lo generó ni qué contenía la conexión.</p>
    <p><strong>Comprobación:</strong> si alguien puede reproducir tus hechos abriendo la
    captura, el informe sirve. Si tiene que fiarse de tu palabra, no.</p>
    <p><strong>Error común:</strong> mezclar evidencia e hipótesis en el mismo párrafo.</p>
    <p><strong>Qué has aprendido:</strong> a documentar de forma que otro pueda revisarte —
    la parte del análisis que más importa cuando hay consecuencias de por medio.</p>
    <p><strong>Pregunta de interpretación</strong> (no hace falta ejecutar nada). Clasifica
    cada una de estas cuatro frases como <em>evidencia</em>, <em>hipótesis</em> o
    <em>conclusión no sostenida</em>:</p>
    <ol>
      <li>«A las 03:14 el host 10.0.0.15 abrió 118 conexiones a 203.0.113.7:443 en 40 segundos.»</li>
      <li>«El equipo está infectado.»</li>
      <li>«El patrón es compatible con un agente de copia de seguridad mal configurado.»</li>
      <li>«La captura no cubre el periodo anterior a las 03:10.»</li>
    </ol>
    <?= hints([
        '<p>Una evidencia se puede volver a comprobar abriendo el fichero. Una hipótesis, no.</p>',
        '<p>¿Cuál de las frases afirma algo que la captura no puede demostrar por sí sola?</p>',
        '<p>Una de las cuatro no es ninguna de las tres categorías: es una limitación, y también va en el informe.</p>',
    ]) ?>
    <?= solution(
        '1 es evidencia · 2 es conclusión no sostenida · 3 es hipótesis · 4 es una limitación.',
        '<p><strong>1 · Evidencia.</strong> Cualquiera puede abrir el fichero, aplicar el
        filtro y contar las mismas 118 conexiones. Es reproducible y no interpreta nada.</p>
        <p><strong>2 · Conclusión no sostenida.</strong> «Infectado» es un estado del sistema
        operativo del equipo. Una captura de red no puede demostrarlo: vería tráfico, no
        procesos ni ficheros. Para afirmarlo hace falta análisis del <em>host</em>.</p>
        <p><strong>3 · Hipótesis.</strong> Está bien formulada precisamente porque dice
        «compatible con»: propone una explicación y admite que hay otras. Es falsable —se
        comprueba mirando si ese agente existe y cómo está configurado—.</p>
        <p><strong>4 · Limitación.</strong> No es ninguna de las tres, y sin embargo es la
        frase que más protege el informe: delimita qué se puede afirmar. Un informe sin
        limitaciones explícitas es un informe que no se puede revisar.</p>',
        'Que un informe honesto tiene cuatro apartados, no uno: qué se observó, qué se supone, qué se concluye y qué queda fuera de alcance.') ?>

  </div>
</section>

<!-- ============================ DESAFÍOS ============================ -->
<section id="desafios">
  <h2>Desafíos</h2>
  <p class="tut-sub">Preguntas sin respuesta inmediata. Intenta resolverlas antes de desplegar la solución.</p>

  <p>Trabaja sobre una captura tuya de navegación normal, de unos minutos. Cada desafío tiene
  primero la <strong>misión</strong>, luego unas <strong>pistas</strong>, y solo después la
  <strong>solución razonada</strong>.</p>

  <div class="lab">
    <?= lab_head('D1', 'Reconstruir una visita web completa', 'avanzado',
        'Misión: elige un dominio de tu captura y reconstruye toda la secuencia que llevó a conectar con él.') ?>
    <p>Debes poder rellenar esta cadena con datos concretos de tu captura:</p>
    <?= term('DNS       consulta de ___________  →  responde ___________' . "\n"
           . '   ↓' . "\n"
           . 'TCP       SYN a ___________:443   (trama ____)' . "\n"
           . '   ↓' . "\n"
           . 'TLS       Client Hello, SNI = ___________  (trama ____)' . "\n"
           . '   ↓' . "\n"
           . 'Datos     ____ bytes intercambiados en ____ segundos', 'cadena a reconstruir') ?>
    <?= reveal('Ver pistas', '
      <ul>
        <li>Empieza por el final: pon <code>tls.handshake.extensions_server_name</code> como columna y elige un dominio.</li>
        <li>De ahí sacas la IP del servidor. Ahora busca hacia atrás en el tiempo.</li>
        <li>Para encontrar el DNS que resolvió esa IP, el filtro es <code>dns.a == esa.ip</code>.</li>
        <li>Para el handshake TCP, filtra por <code>tcp.stream</code> del Client Hello.</li>
        <li>Los bytes y la duración están en Statistics → Conversations.</li>
      </ul>') ?>
    <?= reveal('Ver solución razonada', '
      <p>El orden de trabajo correcto es <strong>hacia atrás</strong>, y esa es la lección
      del ejercicio. En una investigación real casi nunca empiezas por el principio: empiezas
      por el indicador que te llamó la atención —una IP, un dominio— y reconstruyes cómo se
      llegó hasta ahí.</p>
      <ol>
        <li><strong>SNI → IP.</strong> El Client Hello te da nombre e IP a la vez. Es el
        punto de partida más rico de una captura moderna.</li>
        <li><strong>IP → DNS.</strong> <code>dns.a == 203.0.113.34</code> localiza la
        respuesta DNS que devolvió esa dirección. Si no aparece ninguna, es un dato en sí
        mismo: el equipo llegó a esa IP sin resolverla en esta captura (la tenía en caché, la
        llevaba escrita, o usó DoH).</li>
        <li><strong>DNS → consulta.</strong> El Transaction ID te lleva a la pregunta, y con
        ella al momento exacto en que empezó todo.</li>
        <li><strong>TCP.</strong> El <code>tcp.stream</code> del Client Hello te da la
        conexión entera: SYN, SYN-ACK, ACK, handshake TLS, datos, cierre.</li>
        <li><strong>Volumen y tiempo.</strong> Conversations, con <em>Limit to display
        filter</em> marcado.</li>
      </ol>
      <p>Si en el paso 2 no encuentras DNS, no des por hecho que es sospechoso: comprueba
      primero si tu navegador usa DNS sobre HTTPS, en cuyo caso las consultas van cifradas
      dentro de otra conexión y no aparecerán nunca como <code>dns</code>.</p>') ?>
  </div>

  <div class="lab">
    <?= lab_head('D2', 'Quién inició, quién respondió', 'intermedio',
        'Misión: dada una conversación TCP cualquiera de tu captura, responde sin mirar los puertos conocidos.') ?>
    <ul>
      <li>¿Qué equipo inició la conexión?</li>
      <li>¿Qué puerto usó cada extremo?</li>
      <li>¿Se completó el handshake?</li>
      <li>¿Cómo terminó: FIN o RST?</li>
      <li>¿Hubo retransmisiones?</li>
      <li>¿Cuántos bytes fue en cada sentido?</li>
    </ul>
    <?= reveal('Ver pistas', '
      <ul>
        <li>El que inicia es el que envía el SYN <em>sin</em> ACK. Ese único paquete responde a las dos primeras preguntas.</li>
        <li>El puerto alto y aleatorio es el del cliente; el bajo y estable, el del servicio.</li>
        <li><code>tcp.completeness</code> resume el estado de la conexión.</li>
        <li>Para el final, mira los últimos paquetes del <code>tcp.stream</code>.</li>
      </ul>') ?>
    <?= reveal('Ver solución razonada', '
      <p><strong>Quién inició:</strong> el emisor del SYN sin ACK. Es el único paquete de una
      conexión con esa combinación, y por eso <code>tcp.flags.syn == 1 &amp;&amp;
      tcp.flags.ack == 0</code> es el filtro más usado de todo Wireshark.</p>
      <p><strong>Los puertos:</strong> el cliente elige uno efímero (en Linux, entre 32768 y
      60999); el servidor escucha en uno fijo. Si ves 51234 → 443, la dirección está clara
      sin necesidad de saber que 443 es HTTPS.</p>
      <p><strong>Si se completó:</strong> tienen que estar los tres paquetes. Un SYN al que
      responde un RST es un puerto cerrado; un SYN sin ninguna respuesta es un puerto
      filtrado o un servidor caído. <code>tcp.completeness</code> lo resume en un valor.</p>
      <p><strong>Cómo terminó:</strong> FIN por ambos lados es un cierre limpio. Un RST puede
      ser normal (la aplicación cerró de golpe) o significar que alguien intervino: revisa el
      TTL del RST y compáralo con el del resto de paquetes de ese extremo.</p>
      <p><strong>Retransmisiones:</strong> añade <code>&amp;&amp; tcp.analysis.flags</code> al
      filtro de la conversación.</p>
      <p><strong>Bytes:</strong> Statistics → Conversations, columnas A→B y B→A. La asimetría
      te dice si el equipo descargaba o subía.</p>') ?>
  </div>

  <div class="lab">
    <?= lab_head('D3', 'El equipo que no debería estar hablando', 'avanzado',
        'Misión: en tu captura, encuentra el equipo con más destinos externos distintos y explica por qué.') ?>
    <?= reveal('Ver pistas', '
      <ul>
        <li>Statistics → Endpoints → IPv4, y ordena por la columna de número de conexiones o de paquetes.</li>
        <li>Filtra la salida de tu red y vuelve a mirar con <em>Limit to display filter</em>.</li>
        <li>Para cada destino, busca el SNI o el DNS asociado.</li>
        <li>Pregúntate qué software del equipo explicaría esa cantidad de destinos.</li>
      </ul>') ?>
    <?= reveal('Ver solución razonada', '
      <p>En una red doméstica el equipo con más destinos externos suele ser aquel en el que
      hay un navegador abierto: una sola página web moderna contacta con decenas de dominios
      —CDN, analítica, fuentes tipográficas, publicidad, APIs—. Eso, que parece alarmante,
      es simplemente cómo funciona la web hoy.</p>
      <p>Lo que convierte este dato en interesante es el <strong>contraste</strong>: un
      servidor, una impresora o una cámara que hablan con decenas de destinos externos no
      tienen la misma explicación. La pregunta correcta no es «¿cuántos destinos?», sino
      «¿cuántos destinos <em>para lo que es este equipo</em>?».</p>
      <p>Y el método para responderla es el mismo de siempre: mirar el SNI de cada destino,
      buscar la consulta DNS que lo resolvió, y comprobar si encaja con el software que
      debería estar corriendo ahí. Cuando no encaje y no encuentres explicación, tienes un
      hallazgo — y entonces se aplica el flujo de diez preguntas y la plantilla de informe.</p>') ?>
  </div>
</section>

<!-- ============================ ERRORES ============================= -->
<section id="errores">
  <h2>Errores comunes</h2>
  <p class="tut-sub">Los once tropiezos que se repiten, y cómo evitarlos.</p>

  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Errores frecuentes al usar Wireshark y su solución</caption>
      <thead><tr><th scope="col">Error</th><th scope="col">Qué pasa</th><th scope="col">Solución</th></tr></thead>
      <tbody>
        <tr><td class="d">Capturar en la interfaz equivocada</td><td class="d">La captura sale vacía o llena de tráfico que no es el tuyo</td><td class="d"><code>ip addr</code> primero; fíjate en la sparkline</td></tr>
        <tr><td class="d">Confundir capture filter y display filter</td><td class="d">La sintaxis se rechaza y parece que «el filtro no funciona»</td><td class="d">BPF abajo en la pantalla de inicio; Wireshark en la barra verde de arriba</td></tr>
        <tr><td class="d">Pensar que todo lo rojo es malo</td><td class="d">Alarma por retransmisiones normales de wifi</td><td class="d">Los colores son reglas configurables; compara con tu línea base</td></tr>
        <tr><td class="d">Retransmisión = ataque</td><td class="d">Se concluye compromiso donde hay congestión</td><td class="d">Es TCP corrigiendo errores. Mira si afecta a una conversación o a todas</td></tr>
        <tr><td class="d">Analizar sin contexto</td><td class="d">Todo parece sospechoso porque no hay referencia</td><td class="d">Construye la línea base antes de necesitarla</td></tr>
        <tr><td class="d">Olvidar los timestamps</td><td class="d">No se puede correlacionar con registros de otros sistemas</td><td class="d">View → Time Display Format → hora absoluta; anota la zona horaria</td></tr>
        <tr><td class="d">Ignorar el DNS</td><td class="d">Se investigan IP sueltas sin saber a qué nombre corresponden</td><td class="d">El DNS de la propia captura te da los nombres sin consultar fuera</td></tr>
        <tr><td class="d">Esperar leer HTTPS</td><td class="d">Frustración con Follow Stream sobre TLS</td><td class="d">Va cifrado. Analiza metadatos: SNI, tamaños, tiempos</td></tr>
        <tr><td class="d">Ejecutar Wireshark como root</td><td class="d">Se expone todo el equipo a un fallo en un disector</td><td class="d">Grupo <code>wireshark</code> y <code>dumpcap</code> con capabilities</td></tr>
        <tr><td class="d">Capturar demasiado</td><td class="d">Ficheros enormes, paquetes descartados, y un problema de privacidad</td><td class="d">Capture filter, límites de tamaño o de tiempo, ficheros en anillo</td></tr>
        <tr><td class="d">Concluir con un solo paquete</td><td class="d">Se construye una teoría sobre una coincidencia</td><td class="d">Un indicador no es evidencia. Busca varios independientes</td></tr>
      </tbody>
    </table>
  </div>

  <?= note('El más caro de todos',
      '<p>El último. Un paquete aislado casi nunca demuestra nada, y las consecuencias de
      equivocarse no son técnicas: alguien acaba señalado por algo que no hizo. Cuando notes
      que estás construyendo una explicación a partir de una sola observación, es el momento
      de escribir la frase «lo que esta captura no permite determinar es…» y seguir
      investigando.</p>') ?>
</section>

<!-- ============================= CHULETA ============================ -->
<section id="chuleta">
  <h2>Chuleta de display filters</h2>
  <p class="tut-sub">Los que se usan a diario, por protocolo. Todos verificados contra el motor de filtros de Wireshark 4.7.</p>

  <h4>Los de uso diario</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Display filters de uso diario y qué muestra cada uno</caption>
      <thead><tr><th scope="col">Filtro</th><th scope="col">Qué muestra</th></tr></thead>
      <tbody>
        <tr><td class="f">ip.addr == 10.2.3.1</td><td class="d">Todo lo que va o viene de esa IP</td></tr>
        <tr><td class="f">ip.src == 10.2.3.170</td><td class="d">Solo lo que sale de tu equipo</td></tr>
        <tr><td class="f">tcp.port == 443</td><td class="d">Tráfico HTTPS por puerto</td></tr>
        <tr><td class="f">dns || icmp || arp</td><td class="d">Varios protocolos a la vez</td></tr>
        <tr><td class="f">!(arp || dns)</td><td class="d">Todo menos el ruido de fondo</td></tr>
        <tr><td class="f">http.request</td><td class="d">Solo peticiones HTTP, sin respuestas</td></tr>
        <tr><td class="f">http.response.code &gt;= 400</td><td class="d">Errores HTTP</td></tr>
        <tr><td class="f">tcp.flags.reset == 1</td><td class="d">Conexiones cortadas de golpe</td></tr>
        <tr><td class="f">tcp.analysis.retransmission</td><td class="d">Paquetes reenviados: pérdida en la red</td></tr>
        <tr><td class="f">tcp.stream eq 3</td><td class="d">Una conversación TCP concreta</td></tr>
        <tr><td class="f">frame contains "password"</td><td class="d">Busca una cadena en el contenido crudo</td></tr>
        <tr><td class="f">frame.len &gt; 1400</td><td class="d">Paquetes grandes, cerca del MTU</td></tr>
      </tbody>
    </table>
  </div>

  <h4>Ethernet y ARP</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Filtros de Ethernet y ARP</caption>
      <thead><tr><th scope="col">Filtro</th><th scope="col">Qué muestra</th></tr></thead>
      <tbody>
        <tr><td class="f">eth.addr == b8:1e:a4:5a:ac:8d</td><td class="d">Todo lo de esa tarjeta, entre y salga</td></tr>
        <tr><td class="f">eth.src · eth.dst</td><td class="d">Direccional: solo emitido o solo recibido</td></tr>
        <tr><td class="f">eth.dst == ff:ff:ff:ff:ff:ff</td><td class="d">Broadcast del segmento</td></tr>
        <tr><td class="f">eth.ig == 1</td><td class="d">Broadcast y multicast juntos</td></tr>
        <tr><td class="f">eth.type == 0x0806</td><td class="d">Tramas ARP por EtherType</td></tr>
        <tr><td class="f">arp.opcode == 1 · 2</td><td class="d">Preguntas · respuestas</td></tr>
        <tr><td class="f">arp.src.proto_ipv4 == 10.2.3.1</td><td class="d">Quién dice ser el gateway</td></tr>
        <tr><td class="f">arp.duplicate-address-detected</td><td class="d">Una IP con dos MAC distintas</td></tr>
      </tbody>
    </table>
  </div>

  <h4>IPv4 e IPv6</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Filtros de IPv4 e IPv6</caption>
      <thead><tr><th scope="col">Filtro</th><th scope="col">Qué muestra</th></tr></thead>
      <tbody>
        <tr><td class="f">ip.addr == 10.2.3.0/24</td><td class="d">Una red entera en notación CIDR</td></tr>
        <tr><td class="f">ip.ttl &lt; 20</td><td class="d">Paquetes que han dado muchos saltos</td></tr>
        <tr><td class="f">ip.ttl in {1 .. 5}</td><td class="d">Rango de TTL: la firma de un traceroute</td></tr>
        <tr><td class="f">ip.flags.mf == 1 || ip.frag_offset &gt; 0</td><td class="d">Paquetes fragmentados</td></tr>
        <tr><td class="f">ip.proto == 6</td><td class="d">Por número de protocolo: 1 ICMP, 6 TCP, 17 UDP</td></tr>
        <tr><td class="f">ip.len &gt; 1400</td><td class="d">Paquetes IP grandes</td></tr>
        <tr><td class="f">ipv6</td><td class="d">Todo el tráfico IPv6</td></tr>
        <tr><td class="f">ipv6.hlim &lt; 20</td><td class="d">El equivalente al TTL en IPv6</td></tr>
        <tr><td class="f">icmpv6</td><td class="d">Descubrimiento de vecinos y anuncios de router</td></tr>
      </tbody>
    </table>
  </div>

  <h4>ICMP</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Filtros de ICMP</caption>
      <thead><tr><th scope="col">Filtro</th><th scope="col">Qué muestra</th></tr></thead>
      <tbody>
        <tr><td class="f">icmp.type == 8 · 0</td><td class="d">Echo request · echo reply</td></tr>
        <tr><td class="f">icmp.type == 3</td><td class="d">Destino inalcanzable</td></tr>
        <tr><td class="f">icmp.type == 3 &amp;&amp; icmp.code == 13</td><td class="d">Bloqueado por un cortafuegos que avisa</td></tr>
        <tr><td class="f">icmp.type == 11</td><td class="d">TTL agotado: la base de traceroute</td></tr>
        <tr><td class="f">icmp.ident == 0xc977</td><td class="d">Una ejecución concreta de ping</td></tr>
      </tbody>
    </table>
  </div>

  <h4>TCP y UDP</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Filtros de TCP y UDP</caption>
      <thead><tr><th scope="col">Filtro</th><th scope="col">Qué muestra</th></tr></thead>
      <tbody>
        <tr><td class="f">tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0</td><td class="d">Aperturas de conexión. El filtro más usado</td></tr>
        <tr><td class="f">tcp.flags.fin == 1</td><td class="d">Cierres ordenados</td></tr>
        <tr><td class="f">tcp.port in {80, 443, 8080}</td><td class="d">Conjunto de puertos. <strong>Con comas</strong></td></tr>
        <tr><td class="f">tcp.len &gt; 0</td><td class="d">Solo segmentos con datos, sin ACK vacíos</td></tr>
        <tr><td class="f">tcp.analysis.flags</td><td class="d">Todo lo que Wireshark marca como anómalo</td></tr>
        <tr><td class="f">tcp.analysis.duplicate_ack</td><td class="d">«Me falta un trozo»</td></tr>
        <tr><td class="f">tcp.analysis.zero_window</td><td class="d">Receptor saturado</td></tr>
        <tr><td class="f">tcp.analysis.lost_segment</td><td class="d">Hueco en la numeración</td></tr>
        <tr><td class="f">tcp.completeness &lt; 7</td><td class="d">Conexiones que no llegaron a completarse</td></tr>
        <tr><td class="f">tcp.time_delta &gt; 1</td><td class="d">Pausas dentro de una misma conexión</td></tr>
        <tr><td class="f">tcp.window_size &lt; 1000</td><td class="d">Ventana pequeña: posible cuello de botella</td></tr>
        <tr><td class="f">udp.port == 53</td><td class="d">DNS por UDP</td></tr>
        <tr><td class="f">udp.length &gt; 512</td><td class="d">Datagramas UDP grandes</td></tr>
      </tbody>
    </table>
  </div>

  <h4>DNS y DHCP</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Filtros de DNS y DHCP</caption>
      <thead><tr><th scope="col">Filtro</th><th scope="col">Qué muestra</th></tr></thead>
      <tbody>
        <tr><td class="f">dns.flags.response == 0 · 1</td><td class="d">Consultas · respuestas</td></tr>
        <tr><td class="f">dns.qry.name contains "ejemplo"</td><td class="d">Consultas de un dominio concreto</td></tr>
        <tr><td class="f">dns.qry.type == 1 · 28 · 5 · 15 · 16 · 12</td><td class="d">A · AAAA · CNAME · MX · TXT · PTR</td></tr>
        <tr><td class="f">dns.flags.rcode == 3</td><td class="d">NXDOMAIN: el nombre no existe</td></tr>
        <tr><td class="f">dns.qry.name.len &gt; 50</td><td class="d">Nombres anormalmente largos</td></tr>
        <tr><td class="f">dns.time &gt; 0.5</td><td class="d">Resoluciones lentas</td></tr>
        <tr><td class="f">dns.a == 203.0.113.9</td><td class="d">Qué nombre resolvió a esa IP</td></tr>
        <tr><td class="f">dns.count.answers == 0</td><td class="d">Respuestas sin registros</td></tr>
        <tr><td class="f">dhcp</td><td class="d">Todo DHCP (era <code>bootp</code> antes de la 2.6)</td></tr>
        <tr><td class="f">dhcp.option.dhcp == 1 · 2 · 3 · 5</td><td class="d">Discover · Offer · Request · ACK</td></tr>
        <tr><td class="f">dhcp.option.hostname</td><td class="d">El nombre que se da cada equipo</td></tr>
      </tbody>
    </table>
  </div>

  <h4>HTTP y TLS</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Filtros de HTTP y TLS</caption>
      <thead><tr><th scope="col">Filtro</th><th scope="col">Qué muestra</th></tr></thead>
      <tbody>
        <tr><td class="f">http.request.method == "GET"</td><td class="d">Por método. Las comillas son obligatorias</td></tr>
        <tr><td class="f">http.host contains "ejemplo"</td><td class="d">Por sitio de destino</td></tr>
        <tr><td class="f">http.user_agent</td><td class="d">Paquetes que declaran agente de usuario</td></tr>
        <tr><td class="f">http.user_agent matches "(?i)curl|wget"</td><td class="d">Agentes que no son navegadores</td></tr>
        <tr><td class="f">http.authorization</td><td class="d">Autenticación HTTP: credenciales expuestas</td></tr>
        <tr><td class="f">http.cookie</td><td class="d">Cookies viajando en claro</td></tr>
        <tr><td class="f">http.file_data</td><td class="d">Cuerpo de la petición o la respuesta</td></tr>
        <tr><td class="f">tls.handshake.type == 1 · 2 · 11</td><td class="d">Client Hello · Server Hello · Certificate</td></tr>
        <tr><td class="f">tls.handshake.extensions_server_name</td><td class="d">El SNI: el destino real de cada conexión</td></tr>
        <tr><td class="f">tls.alert_message</td><td class="d">Handshakes TLS fallidos</td></tr>
        <tr><td class="f">tls.record.content_type == 23</td><td class="d">Datos de aplicación cifrados</td></tr>
      </tbody>
    </table>
  </div>

  <h4>Análisis y ciberseguridad</h4>
  <div class="tut-table">
    <table>
      <caption class="visually-hidden">Filtros orientados a análisis defensivo</caption>
      <thead><tr><th scope="col">Filtro</th><th scope="col">Para qué</th></tr></thead>
      <tbody>
        <tr><td class="f">ip.src == 10.2.3.0/24 &amp;&amp; !(ip.dst == 10.2.3.0/24)</td><td class="d">Todo lo que abandona tu red</td></tr>
        <tr><td class="f">dns &amp;&amp; !(ip.dst == 10.2.3.1)</td><td class="d">Consultas a un resolver que no es el tuyo</td></tr>
        <tr><td class="f">tcp.flags.syn == 1 &amp;&amp; tcp.flags.ack == 0</td><td class="d">Indicio de escaneo, junto con Conversations</td></tr>
        <tr><td class="f">tcp.flags.reset == 1 &amp;&amp; tcp.flags.ack == 1</td><td class="d">Puertos cerrados que respondieron</td></tr>
        <tr><td class="f">ftp || telnet || http.authorization</td><td class="d">Auditar protocolos que exponen credenciales</td></tr>
        <tr><td class="f">ftp.request.command == "PASS"</td><td class="d">Envío de contraseña por FTP</td></tr>
        <tr><td class="f">frame.len &gt; 1400 &amp;&amp; ip.dst != 10.2.3.0/24</td><td class="d">Paquetes grandes hacia fuera</td></tr>
        <tr><td class="f">http.host matches "^[0-9.]+$"</td><td class="d">Peticiones a IP directa, sin nombre</td></tr>
      </tbody>
    </table>
  </div>

  <p>Operadores: <code>==</code> <code>!=</code> <code>&gt;</code> <code>&lt;</code> para
  comparar; <code>&amp;&amp;</code> o <code>and</code>, <code>||</code> o <code>or</code>,
  <code>!</code> o <code>not</code> para combinar; <code>contains</code> para subcadenas y
  <code>matches</code> para expresiones regulares.</p>

  <p>Y el atajo que hace innecesario memorizar nada: <strong>clic derecho sobre cualquier
  campo del árbol → Apply as Filter → Selected</strong>. Wireshark escribe el filtro
  correcto y así es como se aprenden los nombres de los campos — trabajando, no estudiando
  una lista.</p>

  <aside class="tut-legal">
    <h3>Sobre dónde capturar</h3>
    <p>Todo lo de esta guía captura tu propio tráfico en tu propia máquina. Analizar tráfico
    en redes que no son tuyas o sin autorización del propietario es ilegal en la mayoría de
    jurisdicciones, incluida España. En una red wifi propia estás en tu derecho; en la de
    una cafetería, una empresa o un vecino, no.</p>
    <p>La parte de ciberseguridad de esta guía está escrita en clave defensiva: describe
    qué rastro deja cada técnica y cómo reconocerlo en una captura propia o autorizada. No
    contiene procedimientos para comprometer sistemas, interceptar comunicaciones ajenas ni
    eludir controles de seguridad, y no debe adaptarse para ello.</p>
  </aside>
</section>
