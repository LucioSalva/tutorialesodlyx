// Medios y dispositivos finales · lecciones 5 a 7: dispositivos finales y configuración de red en cada sistema.
import { h, h3, p, lista, orden, tabla, nota, codigo, ejemplo, ejercicios, op, vs, rel, ord } from './_ayuda.mjs';

const mac = (m, a) => ({ tipo: 'md-mac', mac: m, a });
/** Comando por sistema: so = windows | linux | macos; caso = índice de la tarea. */
const cso = (so, caso) => ({ tipo: 'md-comando-so', so, caso });
/** Lectura de una salida: origen = dhcp | estatica | apipa; gw = primera | ultima. */
const ipc = (so, origen, ip, pr, gw, m, dns = 0) => ({ tipo: 'md-ipconfig', so, origen, ip, p: pr, gw, mac: m, dns });
const medio = (caso) => ({ tipo: 'md-medio', caso });

export default [
  /* ------------------------------------------------------------------ 5 */
  {
    slug: 'dispositivos-finales',
    titulo: 'Dispositivos finales, la tarjeta de red y la dirección MAC',
    resumen: 'Qué es un dispositivo final, los tipos que verás en soporte (computadoras, móviles, servidores, impresoras, teléfonos IP, IoT), cómo es su tarjeta de red y los cuatro datos que necesita para comunicarse.',
    nivel: 'facil',
    objetivos: [
      'Distinguir un dispositivo final de un dispositivo intermediario.',
      'Describir los tipos de dispositivos finales y cómo se conecta cada uno.',
      'Leer una dirección MAC, identificar su OUI y escribirla en los tres formatos.',
      'Enumerar los cuatro datos de configuración IP que necesita un equipo.',
    ],
    bloques: [
      h('Finales e intermediarios'),
      p(`En una red hay dos clases de aparatos. Piensa en el correo postal: están **las personas** que escriben y reciben cartas, y están **las oficinas y los carteros** que las llevan de un lado a otro.`),
      tabla(['', 'Dispositivo final', 'Dispositivo intermediario'], [
        ['Papel', 'Origen o destino de los datos', 'Hace que los datos lleguen'],
        ['En el correo sería…', 'Quien escribe o recibe la carta', 'La oficina postal y el cartero'],
        ['Ejemplos', 'Computadora, teléfono, impresora, servidor, cámara', 'Switch, router, punto de acceso, firewall'],
        ['Otro nombre', '**Host** o *endpoint*', 'Dispositivo de red o de infraestructura'],
      ]),
      nota('clave', `Un dispositivo final es donde **empieza o termina** una comunicación. Si el aparato solo deja pasar los datos de otros, es intermediario. En soporte técnico, casi todos los reportes llegan de un dispositivo final.`),

      h('Los tipos de dispositivos finales'),
      tabla(['Dispositivo', 'Cómo se conecta', 'Qué debes saber'], [
        ['**Computadora de escritorio**', 'Cable (RJ-45); a veces Wi-Fi', 'No se mueve: lo ideal es cablearla.'],
        ['**Portátil**', 'Wi-Fi; cable con puerto o adaptador USB', 'Cambia de red a menudo: casi siempre usa DHCP.'],
        ['**Teléfono y tableta**', 'Wi-Fi y red celular', 'No tienen puerto de red; se configuran desde Ajustes.'],
        ['**Servidor**', 'Cable o fibra, a menudo con varias tarjetas', 'Ofrece servicios a otros: necesita **IP fija** para que siempre lo encuentren.'],
        ['**Impresora de red**', 'Cable o Wi-Fi', 'También conviene IP fija o reservada: si cambia, las computadoras la pierden.'],
        ['**Teléfono IP**', 'Cable, alimentado por PoE', 'Envía la voz como datos (VoIP). Suele traer un segundo puerto para la computadora.'],
        ['**Dispositivo IoT**', 'Wi-Fi, Zigbee, celular o cable', 'Sensores, cámaras, focos, termostatos: muchos, sencillos y a menudo poco seguros.'],
      ]),
      h3('Cliente y servidor'),
      p(`Un **cliente** pide un servicio; un **servidor** lo da. Cuando abres una página, tu navegador es el cliente y la máquina que guarda la página es el servidor. La diferencia es el **papel**, no el aparato: una misma computadora puede ser cliente de un servicio y servidor de otro.`),
      h3('El teléfono IP y PoE'),
      p(`Un teléfono IP necesita dos cosas: red y electricidad. **PoE** (Power over Ethernet) le da ambas por el mismo cable de par trenzado: el switch envía la corriente junto con los datos. Así no hace falta un enchufe en cada escritorio, y si el switch tiene batería de respaldo, los teléfonos siguen funcionando durante un apagón.`),
      tabla(['Estándar', 'Nombre', 'Potencia que entrega el switch', 'Para qué alcanza'], [
        ['802.3af', 'PoE', '15.4 W', 'Teléfonos IP, cámaras fijas'],
        ['802.3at', 'PoE+', '30 W', 'Puntos de acceso, cámaras con movimiento'],
        ['802.3bt', 'PoE++', '60 W o 90 W', 'Pantallas, puntos de acceso de alta gama'],
      ]),
      p(`Muchos teléfonos IP traen dos puertos: uno va al switch y en el otro se enchufa la computadora del escritorio. El teléfono actúa como un switch diminuto, y una sola toma de pared da servicio a los dos equipos.`),
      h3('Internet de las cosas (IoT)'),
      p(`**IoT** agrupa a los objetos que se conectan a la red sin ser computadoras: cámaras, cerraduras, sensores de temperatura, focos, televisores, básculas. Suelen tener poca memoria y un sistema muy simple, y por eso son un problema de seguridad: contraseñas de fábrica que nadie cambia y actualizaciones que nunca llegan. La práctica recomendada es ponerlos en una **red separada** de las computadoras.`),

      h('La tarjeta de red (NIC)'),
      p(`Todo dispositivo final se une a la red a través de una **tarjeta de interfaz de red** o **NIC**. Puede ser un puerto RJ-45, una radio Wi-Fi o un módem celular. Un equipo puede tener varias: una portátil trae Wi-Fi y, a veces, Ethernet; un teléfono, Wi-Fi, celular y Bluetooth.

Cada NIC sale de fábrica con un número de serie único grabado: su **dirección MAC**.`),

      h('La dirección MAC'),
      p(`La **dirección MAC** (también llamada dirección física o de hardware) identifica a una tarjeta de red **dentro de su red local**. Tiene **48 bits**, que se escriben como **12 dígitos hexadecimales** (cada dígito hexadecimal vale 4 bits).`),
      tabla(['Parte', 'Bits', 'Dígitos', 'Qué es', 'Quién la asigna'], [
        ['**OUI**', 'Los primeros 24', 'Los primeros 6', 'Identificador del fabricante', 'El IEEE, a cada fabricante'],
        ['**Identificador de la tarjeta**', 'Los últimos 24', 'Los últimos 6', 'Número de serie de esa tarjeta', 'El fabricante'],
      ]),
      p(`Es como la placa de un auto que incluyera el código de la fábrica: mirando la primera mitad sabes quién la hizo. Hay buscadores en Internet donde escribes un OUI y te dicen el fabricante, algo muy útil para averiguar qué es ese aparato desconocido que aparece en tu red.`),
      h3('Tres formas de escribir la misma MAC'),
      tabla(['Formato', 'Ejemplo', 'Dónde lo verás'], [
        ['Dos puntos', '`00:1a:2b:3c:4d:5e`', 'Linux, macOS, Android, iOS'],
        ['Guiones', '`00-1A-2B-3C-4D-5E`', 'Windows'],
        ['Puntos, de 4 en 4', '`001a.2b3c.4d5e`', 'Cisco IOS'],
      ], 'Son la misma dirección. Mayúsculas o minúsculas da igual: el hexadecimal no distingue.'),
      ejemplo('facil', 'De Windows a Linux', mac('00-1A-2B-3C-4D-5E', ':')),
      ejemplo('medio', 'De Linux a Cisco', mac('a4:5e:60:c2:11:9f', '.')),
      ejemplo('medio', 'De Cisco a Windows', mac('f0de.f1a2.03b4', '-')),
      nota('aviso', `Una MAC especial que debes reconocer: \`ff:ff:ff:ff:ff:ff\`, los 48 bits en 1. Es la dirección de **broadcast**: una trama dirigida a ella la reciben todos los equipos de la red local.`),
      h3('MAC e IP: no son lo mismo'),
      tabla(['', 'Dirección MAC', 'Dirección IP'], [
        ['Identifica a…', 'La tarjeta de red', 'El equipo dentro de una red'],
        ['Tamaño', '48 bits (12 dígitos hexadecimales)', '32 bits en IPv4 (4 números decimales)'],
        ['¿Cambia al cambiar de red?', 'No: va con la tarjeta', 'Sí: depende de la red donde estés'],
        ['Alcance', 'Solo la red local', 'De extremo a extremo, por Internet'],
        ['Se parece a…', 'Tu nombre', 'Tu domicilio'],
      ]),
      p(`Tu nombre es el mismo vivas donde vivas; tu domicilio cambia si te mudas. Para entregarte una carta hacen falta los dos: el domicilio para llegar al edificio correcto y el nombre para dársela a la persona correcta.`),

      h('Lo que necesita un equipo para comunicarse'),
      p(`Un dispositivo final necesita **cuatro datos** para funcionar en una red y salir a Internet:`),
      tabla(['Dato', 'Para qué sirve', 'Si falta o está mal…'], [
        ['**Dirección IP**', 'Identifica al equipo en la red', 'No se comunica con nadie'],
        ['**Máscara de subred**', 'Dice qué direcciones están en su misma red', 'No alcanza a equipos que cree lejanos, o al revés'],
        ['**Puerta de enlace**', 'La dirección del router: la salida hacia otras redes', 'Funciona la red local, pero no Internet'],
        ['**Servidor DNS**', 'Traduce nombres (`ejemplo.com`) a direcciones IP', 'Internet «funciona» por IP, pero no abre ninguna página por nombre'],
      ]),
      p(`Estos datos llegan de dos maneras: **automática**, por **DHCP** (un servidor los reparte al conectarse), o **manual**, también llamada **estática** (alguien los escribe). Lo normal es DHCP para los equipos de los usuarios y direcciones fijas para servidores, impresoras y equipos de red.`),
      ejemplo('medio', 'Diagnosticar por el síntoma', op(
        'Un usuario puede imprimir en la impresora de su piso y abrir carpetas compartidas del servidor de la oficina, pero no puede entrar a ningún sitio de Internet, ni siquiera escribiendo una dirección IP pública en el navegador. ¿Qué dato de su configuración revisas primero?',
        ['La dirección IP', 'La máscara de subred', 'La puerta de enlace predeterminada', 'El servidor DNS'], 2,
        ['Alcanza a la impresora y al servidor de la oficina: la **red local funciona**. Su IP y su máscara son válidas.',
          'No sale a Internet **ni por IP**. Eso descarta el DNS: el DNS solo traduce nombres, y aquí falla incluso sin nombres.',
          'Lo que separa «mi red» de «todo lo demás» es la **puerta de enlace**. Si está vacía, mal escrita o apunta a un equipo que no es el router, los paquetes hacia otras redes no tienen por dónde salir.'])),
      ejemplo('medio', 'El otro síntoma clásico', op(
        'Otro usuario dice que «no hay Internet». Compruebas que sí responde un ping a la dirección pública 8.8.8.8, pero el navegador no abre ninguna página escribiendo su nombre. ¿Dónde está el problema?',
        ['En el cable de red', 'En la puerta de enlace', 'En el servidor DNS configurado', 'En la dirección MAC'], 2,
        ['El ping a 8.8.8.8 responde: hay conexión física, IP válida y la puerta de enlace funciona. El equipo **sí llega a Internet**.',
          'Falla solo cuando se usa un **nombre**. El servicio que convierte nombres en direcciones es el DNS.',
          'O el equipo no tiene servidor DNS configurado, o el que tiene no responde. Se confirma con `nslookup`, y se arregla corrigiendo el DNS o renovando la configuración DHCP.'])),
      ejemplo('medio', 'Elegir cómo conectar un equipo', op(
        'Una empresa instala 30 teléfonos IP en escritorios que ya tienen una toma de red, pero pocos enchufes libres. Quiere además que los teléfonos sigan funcionando durante un apagón. ¿Qué solución propones?',
        ['Conectarlos por Wi-Fi y con cargadores USB', 'Un switch con PoE respaldado por una batería (UPS)', 'Un adaptador de corriente en cada escritorio', 'Usar la red celular en cada teléfono'], 1,
        ['Los teléfonos IP ya van cableados a una toma de red: esa misma toma puede darles la corriente.',
          '**PoE** envía la alimentación por el cable de par trenzado, así que no se necesita ningún enchufe en el escritorio.',
          'Toda la energía sale entonces de un solo punto: el switch. Si ese switch se conecta a una batería de respaldo (UPS), los 30 teléfonos sobreviven al apagón. Con adaptadores individuales, se apagarían todos.'])),

      h('Resumen'),
      lista(
        'Un dispositivo final (host) es origen o destino de los datos; un intermediario los hace llegar.',
        'Servidores e impresoras usan IP fija; los equipos de usuario, DHCP.',
        'PoE alimenta teléfonos IP, cámaras y puntos de acceso por el cable de red.',
        'La MAC tiene 48 bits: 24 de OUI (fabricante) y 24 de la tarjeta.',
        'La MAC va con la tarjeta; la IP depende de la red.',
        'Un equipo necesita IP, máscara, puerta de enlace y DNS.',
      ),

      ejercicios('Practica', 'En los ejercicios de MAC, escribe los dígitos tal como los pide el formato; no importa si usas mayúsculas o minúsculas.', [
        mac('3c:22:fb:91:0a:77', '-'), mac('B8-27-EB-4F-10-C2', ':'), mac('0050.56ab.cdef', ':'), mac('dc:a6:32:01:9e:5b', '.'), mac('00-0C-29-7A-33-D1', '.'),
        medio(1), medio(0),
        op('¿Cuál de estos es un dispositivo **intermediario**?', ['Una impresora de red', 'Un switch', 'Un servidor web', 'Una cámara IP'], 1, 'El switch no origina ni recibe los datos de los usuarios: los reenvía. Los otros tres son origen o destino de una comunicación: dispositivos finales.'),
        op('¿Cuántos bits tiene una dirección MAC?', ['32', '48', '64', '128'], 1, 'Son 48 bits, escritos como 12 dígitos hexadecimales. 32 bits tiene una dirección IPv4, y 128, una IPv6.'),
        op('¿Qué parte de la MAC `00:1a:2b:3c:4d:5e` identifica al fabricante?', ['`3c:4d:5e`', '`00:1a:2b`', '`00:1a`', 'Toda la dirección'], 1, 'El OUI son los 3 primeros bytes (24 bits). Los 3 últimos son el número que el fabricante dio a esa tarjeta.'),
        op('¿Por qué un servidor de archivos debe tener una dirección IP fija?', ['Porque así es más rápido', 'Porque los clientes necesitan encontrarlo siempre en la misma dirección', 'Porque los servidores no entienden DHCP', 'Porque usa fibra óptica'], 1, 'Si la IP del servidor cambiara, los clientes que lo buscan por esa dirección dejarían de encontrarlo. No tiene que ver con la velocidad.'),
        op('Un equipo se comunica con otros de su misma red, pero no con redes distintas. ¿Qué dato falta o está mal?', ['El servidor DNS', 'La puerta de enlace predeterminada', 'La dirección MAC', 'El nombre del equipo'], 1, 'La puerta de enlace es la salida hacia otras redes. Sin ella, el equipo solo habla con sus vecinos.'),
        op('¿Qué servicio entrega automáticamente la configuración IP a un equipo cuando se conecta?', ['DNS', 'DHCP', 'PoE', 'NFC'], 1, 'DHCP reparte dirección IP, máscara, puerta de enlace y DNS. El DNS solo traduce nombres.'),
        op('¿Qué estándar PoE necesitas para un punto de acceso que consume 25 W?', ['802.3af (15.4 W)', '802.3at, PoE+ (30 W)', 'Ninguno: PoE no alimenta puntos de acceso', 'Cat 5e'], 1, '802.3af se queda en 15.4 W. PoE+ (802.3at) entrega hasta 30 W y cubre los 25 W del equipo.'),
        vs('¿Cuáles **dos** equipos conviene configurar con IP fija o reservada?', ['La portátil de un vendedor', 'La impresora de red del piso', 'El teléfono de un visitante', 'El servidor de archivos', 'Una tableta de uso personal'], [1, 3], 'Los equipos que ofrecen un servicio deben estar siempre en la misma dirección. Los que solo consumen servicios y cambian de red usan DHCP.'),
        vs('¿Cuáles **dos** afirmaciones sobre la dirección MAC son ciertas?', ['Cambia cada vez que el equipo cambia de red', 'Identifica a una tarjeta de red', 'Tiene 32 bits', 'Sus primeros 24 bits identifican al fabricante', 'Se escribe con cuatro números decimales'], [1, 3], 'La MAC va con la tarjeta, tiene 48 bits en hexadecimal y su primera mitad es el OUI. Lo que cambia con la red y se escribe en decimal es la IP.'),
        rel('Relaciona cada dato de configuración con su función.', [['Dirección IP', 'Identifica al equipo en la red'], ['Máscara de subred', 'Delimita qué direcciones son de su misma red'], ['Puerta de enlace', 'Es la salida hacia otras redes'], ['Servidor DNS', 'Convierte nombres en direcciones']], 'Son los cuatro datos básicos. Con IP y máscara funciona la red local; la puerta de enlace abre el resto de las redes y el DNS permite usar nombres.'),
        rel('Relaciona cada formato de MAC con el sistema que lo muestra así.', [['00-1A-2B-3C-4D-5E', 'Windows'], ['00:1a:2b:3c:4d:5e', 'Linux y macOS'], ['001a.2b3c.4d5e', 'Cisco IOS']], 'Guiones en Windows, dos puntos en los sistemas tipo Unix y grupos de cuatro con puntos en Cisco.'),
        op('¿Por qué se recomienda poner los dispositivos IoT en una red separada?', ['Porque consumen mucho ancho de banda', 'Porque suelen ser poco seguros y así no comprometen a las computadoras', 'Porque no tienen dirección MAC', 'Porque solo funcionan con IP fija'], 1, 'Muchos traen contraseñas de fábrica y casi no se actualizan. Si uno queda comprometido, en una red aparte no alcanza a los equipos importantes.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 6 */
  {
    slug: 'configurar-la-red-en-windows-linux-y-macos',
    titulo: 'Configurar y comprobar la red en Windows, Linux y macOS',
    resumen: 'Dónde se configura la red en cada sistema, los comandos para ver la IP, la MAC, la puerta de enlace y el DNS, cómo renovar una concesión DHCP y cómo leer cada salida línea por línea.',
    nivel: 'medio',
    objetivos: [
      'Diferenciar una configuración por DHCP de una estática y reconocer una dirección APIPA.',
      'Usar `ipconfig`, `ip` e `ifconfig` en el sistema que corresponde.',
      'Leer la IP, la máscara, la puerta de enlace, el DNS y la MAC en la salida de cada sistema.',
      'Renovar una concesión DHCP y vaciar la caché de DNS.',
    ],
    bloques: [
      h('DHCP o estática'),
      p(`En la lección anterior vimos que un equipo necesita cuatro datos: IP, máscara, puerta de enlace y DNS. Hay dos formas de dárselos.`),
      tabla(['', 'DHCP (automática)', 'Estática (manual)'], [
        ['Quién pone los datos', 'Un servidor DHCP, al conectarse', 'Una persona, escribiéndolos'],
        ['Ventaja', 'Sin trabajo ni errores de dedo; el equipo puede cambiar de red', 'La dirección nunca cambia'],
        ['Riesgo', 'Depende de que el servidor DHCP funcione', 'Errores al escribir y direcciones duplicadas'],
        ['Se usa en', 'Computadoras, portátiles, teléfonos', 'Servidores, impresoras, routers, switches'],
      ]),
      p(`Con DHCP, el equipo recibe la dirección «en préstamo» por un tiempo, llamado **concesión**. Antes de que venza, la renueva él solo.`),
      h3('APIPA: la dirección 169.254'),
      p(`¿Qué pasa si un equipo pide configuración por DHCP y **nadie contesta**? No se queda sin dirección: se inventa una del rango **169.254.0.0/16**. Este mecanismo se llama **APIPA** (en Windows) o dirección de enlace local.`),
      nota('clave', `Si ves una dirección que empieza por **169.254**, no es una configuración mala: es un **síntoma**. Significa «pedí DHCP y no obtuve respuesta». Las causas habituales son un cable suelto, un servidor DHCP caído o sin direcciones libres, o un puerto de switch en la VLAN equivocada. Con esa dirección el equipo no sale a Internet.`),

      h('Windows'),
      h3('Por la interfaz gráfica'),
      p(`En **Configuración → Red e Internet** eliges la conexión (Ethernet o Wi-Fi) y, en sus propiedades, verás la dirección IP y un botón para editar la asignación: «Automático (DHCP)» o «Manual». Los nombres exactos cambian un poco entre versiones de Windows.

Hay un atajo que funciona en todas: pulsa \`Win + R\`, escribe \`ncpa.cpl\` y se abre la ventana clásica de «Conexiones de red», donde las propiedades de **Protocolo de Internet versión 4 (TCP/IPv4)** muestran los cuatro datos.`),
      h3('Por comandos'),
      p(`Abre el **Símbolo del sistema** (\`cmd\`) o **PowerShell**. El comando central es \`ipconfig\`.`),
      tabla(['Comando', 'Qué hace'], [
        ['`ipconfig`', 'Resumen: dirección IPv4, máscara y puerta de enlace de cada adaptador.'],
        ['`ipconfig /all`', 'Todo: además la MAC (dirección física), si DHCP está habilitado, el servidor DHCP, los DNS y la concesión.'],
        ['`ipconfig /release`', 'Suelta la dirección obtenida por DHCP.'],
        ['`ipconfig /renew`', 'Pide de nuevo configuración al servidor DHCP.'],
        ['`ipconfig /flushdns`', 'Vacía la caché de nombres ya resueltos.'],
        ['`ipconfig /displaydns`', 'Muestra esa caché.'],
        ['`getmac /v`', 'Lista las direcciones MAC de los adaptadores.'],
        ['`route print`', 'Muestra la tabla de rutas.'],
        ['`netsh interface ip show config`', 'Muestra la configuración IP de cada interfaz.'],
        ['`netsh wlan show interfaces`', 'Estado del Wi-Fi: SSID, BSSID, canal, señal y tipo de autenticación.'],
      ]),
      codigo('Salida de ipconfig /all (un adaptador)', `C:\\> ipconfig /all

Adaptador de Ethernet Ethernet:

   Descripción . . . . . . . . . . . . . . . : Intel(R) Ethernet Connection I219-V
   Dirección física. . . . . . . . . . . . . : 00-1A-2B-3C-4D-5E
   DHCP habilitado . . . . . . . . . . . . . : sí
   Dirección IPv4. . . . . . . . . . . . . . : 192.168.1.34(Preferido)
   Máscara de subred . . . . . . . . . . . . : 255.255.255.0
   Concesión obtenida. . . . . . . . . . . . : lunes, 5 de octubre de 2026 8:14:02
   La concesión expira . . . . . . . . . . . : martes, 6 de octubre de 2026 8:14:02
   Puerta de enlace predeterminada . . . . . : 192.168.1.1
   Servidor DHCP . . . . . . . . . . . . . . : 192.168.1.1
   Servidores DNS. . . . . . . . . . . . . . : 8.8.8.8`),
      tabla(['Línea', 'Qué te dice'], [
        ['Dirección física', 'La MAC, con guiones.'],
        ['DHCP habilitado', '«sí»: la configuración es automática. «no»: es estática.'],
        ['Dirección IPv4', 'La IP del equipo. «(Preferido)» solo indica que es la dirección en uso.'],
        ['Máscara de subred', 'En decimal. 255.255.255.0 equivale a /24.'],
        ['Puerta de enlace predeterminada', 'La IP del router. Vacía = sin salida a otras redes.'],
        ['Servidor DHCP', 'Quién le dio la configuración.'],
        ['Servidores DNS', 'A quién pregunta por los nombres.'],
      ]),
      ejemplo('facil', 'El comando básico de Windows', cso('windows', 0)),
      ejemplo('facil', 'Cuando hace falta la MAC o el DNS', cso('windows', 1)),
      ejemplo('medio', 'Leer una salida de Windows con DHCP', ipc('windows', 'dhcp', '192.168.10.57', 24, 'primera', '3C-22-FB-91-0A-77', 0)),
      ejemplo('medio', 'Reconocer una dirección APIPA', ipc('windows', 'apipa', '169.254.83.12', 16, 'primera', 'B8-27-EB-4F-10-C2', 0)),
      nota('truco', `La pareja \`ipconfig /release\` y \`ipconfig /renew\` es la primera prueba ante una dirección 169.254 o una IP de otra red: obliga al equipo a pedir de nuevo. Si tras renovar sigue igual, el problema no está en el equipo, sino en el cable, el switch o el servidor DHCP.`),

      h('Linux'),
      h3('Por la interfaz gráfica'),
      p(`En los escritorios habituales (GNOME, KDE) está en **Configuración → Red** (cable) o **→ Wi-Fi**: el icono de engrane de la conexión abre la pestaña IPv4, con el método «Automático (DHCP)» o «Manual».`),
      h3('Por comandos'),
      p(`La herramienta actual es \`ip\`, del paquete **iproute2**. Va seguida del **objeto** que quieres ver: \`addr\` (direcciones), \`route\` (rutas) o \`link\` (interfaces).`),
      tabla(['Comando', 'Abreviado', 'Qué hace'], [
        ['`ip addr`', '`ip a`', 'Direcciones IP de cada interfaz, con su prefijo y su MAC.'],
        ['`ip route`', '`ip r`', 'Tabla de rutas. La línea `default via` es la puerta de enlace.'],
        ['`ip link`', '`ip l`', 'Estado de las interfaces (UP/DOWN) y su MAC, sin direcciones IP.'],
        ['`nmcli device status`', '', 'Estado de cada interfaz según NetworkManager.'],
        ['`nmcli device show`', '', 'Detalle de cada interfaz: IP, puerta de enlace y DNS.'],
        ['`nmcli device wifi list`', '', 'Redes Wi-Fi visibles, con canal, señal y seguridad.'],
        ['`resolvectl status`', '', 'Servidores DNS en uso (también en `/etc/resolv.conf`).'],
        ['`ifconfig`', '', 'La herramienta **antigua** (net-tools). Muchas distribuciones ya no la instalan.'],
      ]),
      codigo('Salida de ip addr e ip route', `$ ip addr show enp3s0
2: enp3s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 00:1a:2b:3c:4d:5e brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.34/24 brd 192.168.1.255 scope global dynamic noprefixroute enp3s0
       valid_lft 85963sec preferred_lft 85963sec

$ ip route
default via 192.168.1.1 dev enp3s0 proto dhcp metric 100
192.168.1.0/24 dev enp3s0 proto kernel scope link src 192.168.1.34 metric 100`),
      tabla(['Fragmento', 'Qué te dice'], [
        ['`enp3s0`', 'El nombre de la interfaz. Las cableadas suelen empezar por `en` o `eth`; las Wi-Fi, por `wl`.'],
        ['`state UP`', 'La interfaz está activa y con enlace. `DOWN` = apagada o sin cable.'],
        ['`link/ether`', 'La MAC, con dos puntos.'],
        ['`inet 192.168.1.34/24`', 'La IPv4 **con su prefijo**. Linux no escribe la máscara en decimal.'],
        ['`dynamic`', 'La dirección vino por DHCP. Si no aparece, es estática.'],
        ['`default via 192.168.1.1`', 'La puerta de enlace.'],
      ]),
      nota('aviso', `Linux muestra \`/24\`; Windows muestra \`255.255.255.0\`. Es el mismo dato en dos notaciones. En soporte tendrás que pasar de una a otra todo el tiempo: es justo lo que practicaste en el módulo de subneteo.`),
      ejemplo('facil', 'El comando moderno de Linux', cso('linux', 0)),
      ejemplo('medio', 'Encontrar la puerta de enlace en Linux', cso('linux', 1)),
      ejemplo('medio', 'Leer una salida de Linux con IP estática', ipc('linux', 'estatica', '10.10.20.200', 25, 'ultima', 'dc:a6:32:01:9e:5b', 1)),

      h('macOS'),
      h3('Por la interfaz gráfica'),
      p(`En **Ajustes del Sistema → Red** (en versiones anteriores, «Preferencias del Sistema») eliges Wi-Fi o Ethernet y pulsas **Detalles**: la sección TCP/IP muestra la dirección, la máscara y el **router** (así llama macOS a la puerta de enlace), y permite cambiar entre «Usar DHCP» y «Manualmente».`),
      h3('Por comandos'),
      p(`macOS es un sistema tipo Unix y conserva \`ifconfig\`. Las interfaces se llaman \`en0\`, \`en1\`… En una Mac con solo Wi-Fi, \`en0\` es el Wi-Fi.`),
      tabla(['Comando', 'Qué hace'], [
        ['`ifconfig`', 'Configuración de todas las interfaces: IP (`inet`) y MAC (`ether`).'],
        ['`ipconfig getifaddr en0`', 'Solo la dirección IPv4 de `en0`.'],
        ['`netstat -rn`', 'Tabla de rutas. La fila `default` es la puerta de enlace.'],
        ['`networksetup -listallhardwareports`', 'Relaciona cada puerto (Wi-Fi, Ethernet) con su dispositivo y su MAC.'],
        ['`networksetup -getinfo "Wi-Fi"`', 'IP, máscara y router del servicio indicado.'],
        ['`scutil --dns`', 'Servidores DNS en uso.'],
      ]),
      codigo('Salida de ifconfig en0', `$ ifconfig en0
en0: flags=8863<UP,BROADCAST,SMART,RUNNING,SIMPLEX,MULTICAST> mtu 1500
	ether a4:83:e7:2b:10:9c
	inet 192.168.1.42 netmask 0xffffff00 broadcast 192.168.1.255
	status: active`),
      nota('aviso', `Dos trampas de macOS. Primera: \`ifconfig\` muestra la máscara en **hexadecimal**: \`0xffffff00\` es \`ff.ff.ff.00\`, es decir, 255.255.255.0 (/24). Segunda: macOS también tiene un comando \`ipconfig\`, pero **no es el de Windows**: siempre necesita un subcomando, como \`getifaddr\`.`),
      ejemplo('facil', 'El comando de macOS', cso('macos', 0)),
      ejemplo('medio', 'Solo la IP, en macOS', cso('macos', 1)),

      h('La misma tarea en los tres sistemas'),
      tabla(['Tarea', 'Windows', 'Linux', 'macOS'], [
        ['Ver la IP', '`ipconfig`', '`ip addr`', '`ifconfig`'],
        ['Ver la MAC', '`ipconfig /all`', '`ip link`', '`ifconfig`'],
        ['Ver la puerta de enlace', '`ipconfig`', '`ip route`', '`netstat -rn`'],
        ['Ver los DNS', '`ipconfig /all`', '`resolvectl status`', '`scutil --dns`'],
        ['Renovar DHCP', '`ipconfig /release` y `/renew`', '`nmcli` o reconectar la interfaz', 'Botón «Renovar concesión DHCP» en Ajustes'],
        ['Cómo llama a la puerta de enlace', 'Puerta de enlace predeterminada', '`default via`', 'Router'],
      ]),
      ejemplo('dificil', 'Un reporte con dos equipos', op(
        'En una oficina, la computadora A (Windows) muestra la dirección 192.168.5.23 y navega bien. La computadora B, enchufada en la toma de al lado, muestra 169.254.14.201 y no navega. Las dos están configuradas con DHCP. ¿Qué haces primero en B?',
        ['Escribirle a mano la IP 192.168.5.23', 'Revisar el cable y la toma de B y ejecutar `ipconfig /renew`', 'Ejecutar `ipconfig /flushdns`', 'Reinstalar el navegador'], 1,
        ['A obtuvo una dirección y navega: el servidor DHCP y el router **funcionan**. El problema es solo de B.',
          'La dirección 169.254 de B es APIPA: B pidió DHCP y no recibió respuesta. Su petición no llega al servidor, o la respuesta no vuelve.',
          'Lo más probable es algo físico en el camino de B: cable dañado o mal enchufado, toma de pared sin conectar al switch. Se revisa eso y se fuerza una nueva petición con `ipconfig /renew`.',
          'Copiar la IP de A crearía una dirección **duplicada** y tumbaría también a A. `flushdns` no tiene que ver: el problema es anterior al DNS.'])),

      h('Resumen'),
      lista(
        'DHCP reparte la configuración; la estática se escribe a mano.',
        'Una dirección 169.254.x.x significa que el equipo pidió DHCP y nadie contestó.',
        'Windows: `ipconfig`, `ipconfig /all`, `/release`, `/renew`, `/flushdns`.',
        'Linux: `ip addr`, `ip route`, `ip link`; `ifconfig` es la herramienta antigua.',
        'macOS: `ifconfig`, `ipconfig getifaddr en0`, `netstat -rn`.',
        'Windows da la máscara en decimal; Linux, como prefijo; macOS, en hexadecimal.',
      ),

      ejercicios('Practica', 'Escribe cada comando tal como lo teclearías en la consola.', [
        cso('windows', 0), cso('windows', 1), cso('windows', 2), cso('windows', 3), cso('windows', 4), cso('windows', 5),
        cso('linux', 0), cso('linux', 1), cso('linux', 2), cso('linux', 3),
        cso('macos', 0), cso('macos', 1), cso('macos', 2), cso('macos', 3),
        ipc('windows', 'dhcp', '172.16.8.140', 26, 'primera', '00-0C-29-7A-33-D1', 1),
        ipc('windows', 'estatica', '192.168.50.9', 24, 'ultima', 'F0-DE-F1-A2-03-B4', 2),
        ipc('windows', 'apipa', '169.254.201.7', 16, 'primera', '28-D2-44-6B-90-1E', 0),
        ipc('linux', 'dhcp', '192.168.1.117', 24, 'primera', '52:54:00:ab:34:c6', 0),
        ipc('linux', 'estatica', '10.10.4.77', 23, 'primera', '00:16:3e:5d:02:f8', 3),
        op('Un equipo con Windows muestra la dirección 169.254.33.8. ¿Qué significa?', ['Tiene una IP estática válida', 'Pidió configuración por DHCP y no recibió respuesta', 'Está conectado a una VPN', 'Su DNS no funciona'], 1, 'El rango 169.254.0.0/16 es APIPA: el equipo se asigna una dirección él mismo cuando ningún servidor DHCP contesta.'),
        op('En la salida de `ip addr` de Linux, ¿qué palabra indica que la dirección se obtuvo por DHCP?', ['`global`', '`dynamic`', '`UP`', '`brd`'], 1, '`dynamic` marca una dirección con concesión. `global` es el ámbito, `UP` el estado de la interfaz y `brd` la dirección de broadcast.'),
        op('En macOS, `ifconfig en0` muestra `netmask 0xffffff00`. ¿Qué máscara es?', ['255.255.0.0', '255.255.255.0', '255.255.255.128', '255.0.0.0'], 1, 'Cada par de dígitos hexadecimales es un octeto: ff = 255 y 00 = 0. Resulta 255.255.255.0, es decir, /24.'),
        op('Un sitio web cambió de servidor y a un usuario de Windows le sigue abriendo el antiguo. ¿Qué comando pruebas?', ['`ipconfig /release`', '`ipconfig /flushdns`', '`route print`', '`getmac /v`'], 1, 'El equipo guarda en memoria los nombres ya resueltos. `ipconfig /flushdns` vacía esa caché y obliga a preguntar de nuevo al DNS.'),
        vs('¿Cuáles **dos** datos aparecen en `ipconfig /all` pero **no** en `ipconfig` a secas?', ['La dirección IPv4', 'La dirección física (MAC)', 'La máscara de subred', 'Los servidores DNS', 'La puerta de enlace predeterminada'], [1, 3], 'El resumen solo da IP, máscara y puerta de enlace. La MAC, los DNS y los datos de DHCP exigen `/all`.'),
        vs('¿Cuáles **dos** comandos muestran la dirección IP de un equipo con Linux?', ['`ip addr`', '`ipconfig /all`', '`ifconfig`', '`route print`', '`getmac /v`'], [0, 2], '`ip addr` es la herramienta actual e `ifconfig` la antigua. Los otros tres son de Windows.'),
        rel('Relaciona cada sistema con el nombre que da a la puerta de enlace.', [['Windows', 'Puerta de enlace predeterminada'], ['Linux', 'default via'], ['macOS e iOS', 'Router']], 'Es el mismo dato con tres nombres: la dirección del router por donde el equipo sale de su red.'),
        ord('Un equipo con Windows tiene una dirección 169.254. Ordena los pasos de diagnóstico.', ['Comprobar el cable y la luz de enlace del puerto', 'Ejecutar `ipconfig /release`', 'Ejecutar `ipconfig /renew`', 'Revisar con `ipconfig /all` si ya obtuvo dirección y servidor DHCP'], 'Primero lo físico; después se suelta la dirección, se pide una nueva y se comprueba el resultado. Si sigue en 169.254, el problema está en la red, no en el equipo.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 7 */
  {
    slug: 'configurar-la-red-en-android-y-ios',
    titulo: 'Configurar y comprobar la red en Android y iOS',
    resumen: 'Dónde ver la IP, la máscara, la puerta de enlace y el DNS en un teléfono, cómo poner una IP estática u olvidar una red, qué es la MAC privada y cómo se eligen el SSID y el modo WPA.',
    nivel: 'medio',
    objetivos: [
      'Encontrar la configuración IP de una red Wi-Fi en Android y en iOS.',
      'Cambiar entre DHCP e IP estática y olvidar una red guardada.',
      'Explicar qué es la dirección MAC privada o aleatoria y qué problemas causa.',
      'Elegir los ajustes del cliente inalámbrico: SSID, autenticación y modo WPA.',
    ],
    bloques: [
      h('Un teléfono también es un host'),
      p(`Un teléfono necesita los mismos cuatro datos que una computadora: IP, máscara, puerta de enlace y DNS. La diferencia es que **no hay consola**: todo se consulta y se cambia en la aplicación de **Ajustes**, y cada red Wi-Fi guarda su propia configuración.

Además, un teléfono tiene dos caminos hacia Internet: el **Wi-Fi** y los **datos móviles**. Cuando hay Wi-Fi conectado lo prefiere, y si el Wi-Fi se queda sin salida a Internet, puede pasar a los datos sin avisar. Tenlo presente al diagnosticar: «en mi teléfono sí abre» puede querer decir que está saliendo por la red celular.`),
      nota('truco', `Antes de diagnosticar el Wi-Fi de un teléfono, **apaga los datos móviles**. Así sabes con certeza que lo que funciona o falla es el Wi-Fi.`),

      h('Android'),
      p(`Los menús de Android cambian según la versión y el fabricante (Samsung, Xiaomi, Motorola…), pero el recorrido es siempre parecido:`),
      orden(
        'Abre **Ajustes** y entra en **Red e Internet** (en algunos equipos, «Conexiones»).',
        'Entra en **Internet** o **Wi-Fi**.',
        'Toca el **engrane** que aparece junto a la red a la que estás conectado.',
        'En los detalles de la red (a veces tras pulsar «Avanzado» o «Ver más») aparecen la dirección IP, la puerta de enlace, la máscara de subred y el DNS.',
      ),
      tabla(['Qué quieres hacer', 'Dónde'], [
        ['Ver la IP, la puerta de enlace y el DNS', 'Detalles de la red Wi-Fi'],
        ['Poner una IP estática', 'Editar la red (icono de lápiz) → Opciones avanzadas → **Ajustes de IP**: cambiar de «DHCP» a «Estática»'],
        ['Olvidar la red', 'Detalles de la red → **Olvidar**'],
        ['Elegir MAC aleatoria o del dispositivo', 'Detalles de la red → **Privacidad**'],
        ['Ver la MAC real del teléfono', 'Ajustes → Acerca del teléfono (o «Información del teléfono»)'],
        ['Usar un DNS cifrado en todo el sistema', 'Red e Internet → **DNS privado**'],
      ], 'Si no encuentras una opción, usa el buscador de Ajustes: escribir «IP» o «MAC» te lleva directo.'),
      nota('aviso', `Al cambiar a «Estática», Android pide **todos** los datos: IP, puerta de enlace, longitud del prefijo (por ejemplo 24, en lugar de 255.255.255.0) y dos DNS. Un error en cualquiera deja al teléfono conectado al Wi-Fi pero sin Internet.`),

      h('iOS y iPadOS'),
      orden(
        'Abre **Ajustes** y entra en **Wi-Fi**.',
        'Toca la **ⓘ** que está junto a la red conectada.',
        'En la sección **Dirección IPv4** verás la dirección IP, la máscara de subred y el **router** (la puerta de enlace).',
      ),
      tabla(['Qué quieres hacer', 'Dónde'], [
        ['Ver la IP, la máscara y el router', 'Ajustes → Wi-Fi → ⓘ → Dirección IPv4'],
        ['Poner una IP estática', '**Configurar IP** → cambiar de «Automático» a «Manual»'],
        ['Cambiar el servidor DNS', '**Configurar DNS** → «Manual»'],
        ['Renovar la dirección por DHCP', '**Renovar concesión**'],
        ['Olvidar la red', '**Omitir esta red**'],
        ['MAC privada', '**Dirección Wi-Fi privada**'],
        ['Ver la MAC real del equipo', 'Ajustes → General → Información → Dirección Wi-Fi'],
      ], 'iOS llama «router» a la puerta de enlace, igual que macOS.'),
      ejemplo('facil', 'Encontrar la puerta de enlace en un iPhone', op(
        'Un usuario con iPhone te llama: necesitas saber la dirección de la puerta de enlace de la red Wi-Fi a la que está conectado. ¿Qué le pides que haga?',
        ['Abrir Ajustes → Wi-Fi, tocar la ⓘ de la red y leer el campo «Router»', 'Abrir Ajustes → General → Información y leer «Dirección Wi-Fi»', 'Abrir Ajustes → Datos móviles', 'Escribir `ipconfig` en la aplicación Teléfono'], 0,
        ['En iOS, la configuración IP de cada red está en Ajustes → Wi-Fi → ⓘ.',
          'Ahí aparecen tres campos: Dirección IP, Máscara de subred y **Router**. iOS (como macOS) llama «router» a la puerta de enlace.',
          '«Dirección Wi-Fi», en Información, es la **MAC** del equipo, no una dirección IP. Y en iOS no existe una consola donde escribir `ipconfig`.'])),

      h('IP estática en un teléfono'),
      p(`Lo normal es que un teléfono use DHCP, porque cambia de red todo el día. La IP estática solo tiene sentido en casos concretos: una tableta fija que hace de terminal de punto de venta, o una prueba de diagnóstico.

Recuerda que en un teléfono la configuración se guarda **por red**. Una IP estática puesta en la red de la oficina no afecta a la red de casa. Y si olvidas que la pusiste, verás el síntoma clásico: «en la oficina funciona, y en la otra sucursal, con el mismo nombre de red, no».`),

      h('Olvidar una red'),
      p(`Cuando te conectas a una red Wi-Fi, el teléfono guarda su **perfil**: el nombre (SSID), la contraseña y los ajustes. **Olvidar** la red borra ese perfil. Es la reparación más útil del Wi-Fi móvil:`),
      lista(
        'Cambiaron la contraseña del Wi-Fi y el teléfono sigue intentando con la antigua.',
        'Cambiaron el tipo de seguridad (por ejemplo, de WPA2 a WPA3) y el perfil guardado ya no coincide.',
        'Alguien dejó una IP estática o un DNS manual en ese perfil.',
        'El teléfono se conecta solo a una red que ya no quieres usar.',
      ),
      p(`Después de olvidarla, vuelves a elegirla en la lista y escribes la contraseña como si fuera la primera vez.`),
      ejemplo('medio', 'La contraseña cambió', op(
        'El lunes cambiaron la contraseña del Wi-Fi de la oficina. Un empleado dice que su teléfono Android «ve la red, pero dice error de autenticación» y ya no le pide la contraseña. ¿Qué le indicas?',
        ['Activar el modo avión durante una hora', 'Olvidar la red y volver a conectarse con la contraseña nueva', 'Poner una IP estática', 'Cambiar a la banda de 2.4 GHz'], 1,
        ['El teléfono **ve** la red: la radio funciona y hay cobertura.',
          'El mensaje habla de **autenticación**: el punto de acceso rechaza la contraseña. El teléfono sigue enviando la antigua, que tiene guardada en el perfil.',
          'Al **olvidar** la red se borra ese perfil. Cuando la elija de nuevo, el teléfono pedirá la contraseña y podrá escribir la nueva.',
          'Una IP estática o cambiar de banda no ayudan: el problema ocurre antes de recibir una dirección IP.'])),

      h('La MAC privada o aleatoria'),
      p(`La MAC real de un teléfono es única y no cambia. Eso permite que las tiendas, los aeropuertos y cualquier red Wi-Fi **sigan tus pasos** de un lugar a otro, solo escuchando esa MAC.

Para evitarlo, Android (desde la versión 10) e iOS (desde la 14) usan por defecto una **MAC privada o aleatoria**: el teléfono se presenta ante cada red con una MAC inventada, distinta para cada SSID.`),
      tabla(['Sistema', 'Cómo se llama', 'Dónde se cambia'], [
        ['Android', '«Usar MAC aleatoria» / «Usar MAC del dispositivo»', 'Detalles de la red → Privacidad'],
        ['iOS / iPadOS', '«Dirección Wi-Fi privada»', 'Ajustes → Wi-Fi → ⓘ'],
      ]),
      p(`Es bueno para la privacidad, pero en una red administrada causa confusiones:`),
      lista(
        '**Filtrado por MAC.** Si el router solo deja entrar a las MAC de una lista, hay que registrar la MAC que el teléfono usa **en esa red**, no la de fábrica.',
        '**Reservas de DHCP.** Si le reservaste una IP por su MAC real, no la recibirá.',
        '**Portales cautivos y controles parentales.** El teléfono puede aparecer como un «dispositivo nuevo».',
      ),
      nota('truco', `Una MAC aleatoria se reconoce por su **segundo dígito hexadecimal**: es 2, 6, A o E (por ejemplo \`da:a1:19:3c:07:5b\`). Ese dígito indica que la dirección fue «administrada localmente», no asignada por un fabricante. Si buscas su OUI, no aparecerá ningún fabricante.`),
      ejemplo('medio', 'El filtro que dejó de reconocer a un teléfono', op(
        'Una escuela filtra por MAC: solo entran al Wi-Fi los equipos de una lista. Un profesor estrena un iPhone; el administrador registra la MAC que aparece en Ajustes → General → Información, pero el teléfono sigue sin entrar. ¿Cuál es la causa más probable?',
        ['El iPhone no es compatible con el filtrado por MAC', 'El iPhone se presenta con una dirección Wi-Fi privada, distinta de la registrada', 'La MAC de un iPhone cambia cada hora', 'Falta activar los datos móviles'], 1,
        ['La MAC de «Información» es la **de fábrica**. Es correcta, pero no es la que el teléfono está usando.',
          'Por defecto, iOS activa **Dirección Wi-Fi privada**: ante esa red se presenta con otra MAC, inventada para ese SSID.',
          'El filtro ve una MAC que no está en la lista y lo rechaza. Hay dos soluciones: registrar la MAC privada que aparece en Ajustes → Wi-Fi → ⓘ, o desactivar ahí la dirección privada para esa red y que use la real.'])),

      h('Modo avión'),
      p(`El **modo avión** apaga de golpe todas las radios del teléfono: celular, Wi-Fi y Bluetooth. Después puedes volver a encender el Wi-Fi o el Bluetooth a mano sin salir del modo avión.

En soporte tiene un uso práctico: activar y desactivar el modo avión obliga al teléfono a **reconectarse desde cero** a la red celular y al Wi-Fi. Es el equivalente a desenchufar y enchufar, y resuelve muchos bloqueos pasajeros.`),

      h('Los ajustes del cliente inalámbrico'),
      p(`Para unirse a una red Wi-Fi, un cliente (teléfono, portátil o lo que sea) necesita que coincidan tres cosas con el punto de acceso: el **nombre** de la red, el **tipo de seguridad** y la **credencial**.`),
      h3('1. El SSID'),
      p(`Es el nombre de la red. Distingue mayúsculas de minúsculas: \`Oficina\` y \`oficina\` son redes distintas.`),
      h3('2. El modo de seguridad'),
      tabla(['Modo', 'Estado', 'Comentario'], [
        ['**Abierta**', 'Sin contraseña', 'Cualquiera entra y el tráfico viaja sin cifrar. Solo para invitados, y con cuidado.'],
        ['**WEP**', 'Obsoleto', 'Se rompe en minutos. No debe usarse nunca.'],
        ['**WPA**', 'Obsoleto', 'Un parche temporal sobre WEP (TKIP). Tampoco debe usarse.'],
        ['**WPA2**', 'Vigente', 'Cifrado AES. El mínimo aceptable hoy.'],
        ['**WPA3**', 'El más seguro', 'Protege mejor frente a quien intenta adivinar la contraseña. Obligatorio en la banda de 6 GHz.'],
      ]),
      h3('3. Personal o Enterprise'),
      p(`WPA2 y WPA3 existen en dos variantes. La diferencia es **cómo demuestras que tienes permiso**:`),
      tabla(['', 'Personal', 'Enterprise'], [
        ['Credencial', 'Una **contraseña compartida** por todos (clave precompartida, PSK)', 'Un **usuario y contraseña** (o certificado) por persona'],
        ['Quién la valida', 'El propio punto de acceso', 'Un servidor de autenticación (RADIUS), con 802.1X'],
        ['Si alguien se va de la empresa', 'Hay que cambiar la contraseña de todos', 'Se desactiva solo su cuenta'],
        ['Se usa en', 'Casas y negocios pequeños', 'Empresas, universidades, hospitales'],
        ['Qué pide el teléfono', 'Solo la contraseña', 'Método EAP, identidad (usuario), contraseña y, a veces, un certificado'],
      ]),
      nota('clave', `Si al conectarte el teléfono te pide solo una **contraseña**, la red es Personal. Si te pide **usuario y contraseña**, es Enterprise. Es la pista más rápida para saber en qué tipo de red estás.`),
      h3('Redes ocultas'),
      p(`Un punto de acceso puede configurarse para **no anunciar su SSID**. La red no aparece en la lista, y para unirse hay que elegir «Añadir red» u «Otra…» y escribir a mano el nombre exacto, el tipo de seguridad y la contraseña.

Ocultar el SSID **no es una medida de seguridad**: el nombre sigue viajando por el aire cada vez que un cliente se conecta, y cualquier analizador de Wi-Fi lo muestra. Lo único que protege una red es un buen cifrado (WPA2 o WPA3) con una buena contraseña.`),
      ejemplo('medio', 'Elegir entre Personal y Enterprise', op(
        'Una empresa de 200 empleados usa WPA2-Personal con una única contraseña. Cada vez que alguien deja la empresa hay que cambiarla y avisar a todos. ¿Qué recomiendas?',
        ['Ocultar el SSID', 'Pasar a WPA2 o WPA3 Enterprise, con una cuenta por usuario', 'Volver a WEP, que es más sencillo', 'Dejar la red abierta y filtrar por MAC'], 1,
        ['El problema es que la credencial es **compartida**: quitarle el acceso a una persona obliga a cambiársela a todas.',
          'En el modo **Enterprise** cada persona entra con su propio usuario y contraseña, que valida un servidor RADIUS mediante 802.1X.',
          'Cuando alguien se va, se desactiva su cuenta y nadie más se entera. Además queda registro de quién se conectó.',
          'Ocultar el SSID no impide que un exempleado que conoce la contraseña vuelva a entrar; WEP y una red abierta son retrocesos graves de seguridad.'])),
      ejemplo('medio', 'Unirse a una red oculta', ord(
        'Un técnico debe conectar una tableta a una red Wi-Fi que no anuncia su SSID. Ordena los pasos.',
        ['Abrir los ajustes de Wi-Fi y elegir «Añadir red» u «Otra…»', 'Escribir el SSID exacto, respetando mayúsculas y minúsculas', 'Elegir el tipo de seguridad que usa la red', 'Escribir la contraseña y conectar'],
        ['Una red oculta no aparece en la lista: hay que crearla a mano con la opción de añadir red.',
          'El teléfono necesita los tres datos que normalmente aprende solo del anuncio del punto de acceso: nombre, tipo de seguridad y credencial.',
          'Si el nombre no coincide letra por letra o el tipo de seguridad es otro, el teléfono buscará una red que no existe y nunca conectará.'])),
      ejemplo('dificil', 'Un diagnóstico completo', op(
        'Una tableta Android se conecta al Wi-Fi de una tienda (aparece «Conectado»), pero ninguna aplicación tiene Internet. Los demás equipos de la misma red funcionan. En los detalles de la red, la tableta muestra IP 192.168.1.50, puerta de enlace 192.168.0.1 y ajustes de IP en «Estática». La red de la tienda es 192.168.1.0/24 y su router es 192.168.1.1. ¿Cuál es el problema?',
        ['La contraseña del Wi-Fi es incorrecta', 'La puerta de enlace escrita a mano no pertenece a la red de la tableta', 'La tableta usa una MAC aleatoria', 'El punto de acceso emite en un canal solapado'], 1,
        ['Dice «Conectado»: el SSID, la seguridad y la contraseña son correctos. Se descarta la autenticación.',
          'Los demás equipos funcionan: el router y la salida a Internet están bien. El problema es de configuración de la tableta.',
          'Sus ajustes de IP están en **Estática**, así que alguien los escribió. La IP 192.168.1.50 sí pertenece a 192.168.1.0/24, pero la puerta de enlace **192.168.0.1** es de otra red: la tableta no puede alcanzarla.',
          'Sin puerta de enlace válida no sale de su red local. La solución es corregirla a 192.168.1.1 o, mejor, volver los ajustes de IP a **DHCP**.'])),

      h('Resumen'),
      lista(
        'En Android: Ajustes → Red e Internet → Wi-Fi → engrane de la red.',
        'En iOS: Ajustes → Wi-Fi → ⓘ. La puerta de enlace se llama «Router».',
        'La configuración se guarda por red. Olvidar la red borra su perfil y arregla contraseñas y ajustes viejos.',
        'La MAC privada protege la privacidad, pero rompe el filtrado por MAC y las reservas de DHCP.',
        'Personal: una contraseña compartida. Enterprise: una cuenta por usuario, validada por RADIUS.',
        'Ocultar el SSID no da seguridad. WEP y WPA están obsoletos; usa WPA2 o WPA3.',
      ),

      ejercicios('Practica', '', [
        op('En Android, ¿dónde se cambia una red Wi-Fi de DHCP a IP estática?', ['En Acerca del teléfono', 'En las opciones avanzadas de esa red, en «Ajustes de IP»', 'En el modo avión', 'En Datos móviles'], 1, 'Cada red guarda su propia configuración. Al editarla, las opciones avanzadas permiten cambiar los ajustes de IP de DHCP a Estática.'),
        op('En iOS, ¿con qué nombre aparece la puerta de enlace de una red Wi-Fi?', ['Gateway', 'Router', 'Servidor', 'Proxy'], 1, 'iOS, igual que macOS, llama «Router» a la puerta de enlace predeterminada.'),
        op('¿Qué hace la opción «Olvidar» (u «Omitir esta red»)?', ['Apaga el Wi-Fi', 'Borra el perfil guardado de esa red: nombre, contraseña y ajustes', 'Bloquea esa red para siempre', 'Restablece el teléfono de fábrica'], 1, 'Solo elimina lo que el teléfono recordaba de esa red. Puedes volver a conectarte cuando quieras, escribiendo de nuevo la contraseña.'),
        op('¿Para qué sirve la MAC privada o aleatoria de un teléfono?', ['Para que el Wi-Fi vaya más rápido', 'Para dificultar que te rastreen de una red a otra', 'Para conectarse sin contraseña', 'Para ahorrar batería'], 1, 'Al presentarse con una MAC distinta en cada red, nadie puede seguir al mismo teléfono de un lugar a otro por su dirección de hardware.'),
        op('¿Qué apaga el modo avión?', ['Solo la red celular', 'Todas las radios: celular, Wi-Fi y Bluetooth', 'Solo el Wi-Fi', 'La pantalla'], 1, 'Desactiva de golpe todas las transmisiones de radio. Después se pueden reactivar el Wi-Fi o el Bluetooth por separado.'),
        op('Al conectarte a una red Wi-Fi, el teléfono te pide un nombre de usuario y una contraseña. ¿Qué tipo de red es?', ['Abierta', 'WPA2 o WPA3 Personal', 'WPA2 o WPA3 Enterprise', 'WEP'], 2, 'El modo Enterprise autentica a cada persona con sus propias credenciales mediante 802.1X. El modo Personal solo pide la contraseña compartida.'),
        op('¿Cuál de estos modos de seguridad es el más seguro?', ['WEP', 'WPA', 'WPA2', 'WPA3'], 3, 'WPA3 es la generación actual. WEP y WPA están rotos y obsoletos; WPA2 sigue siendo aceptable.'),
        op('Un administrador oculta el SSID de la red para «hacerla más segura». ¿Qué opinas?', ['Es suficiente como única protección', 'No aporta seguridad real: el nombre se puede descubrir con un analizador', 'Impide que los vecinos interfieran', 'Aumenta el alcance de la señal'], 1, 'El SSID viaja en el aire cuando los clientes se conectan. La protección real es el cifrado WPA2 o WPA3 con una buena contraseña.'),
        op('Un teléfono dice «Conectado, sin Internet» en el Wi-Fi, pero el usuario navega sin problema. ¿Qué está ocurriendo?', ['El Wi-Fi sí tiene Internet y el aviso es un error', 'El teléfono está saliendo por los datos móviles', 'Está usando Bluetooth', 'Tiene una IP estática'], 1, 'Cuando el Wi-Fi no tiene salida a Internet, el teléfono puede usar la red celular sin avisar. Por eso conviene apagar los datos móviles al diagnosticar.'),
        op('Un teléfono muestra la MAC `da:a1:19:3c:07:5b` en una red. ¿Qué te indica el segundo dígito, la «a»?', ['Que es una MAC de broadcast', 'Que es una dirección administrada localmente, probablemente aleatoria', 'Que el fabricante es Apple', 'Que la tarjeta es de 5 GHz'], 1, 'Un segundo dígito 2, 6, A o E marca una MAC administrada localmente. Las MAC privadas de los teléfonos son así, y su OUI no corresponde a ningún fabricante.'),
        op('En Android, al poner una IP estática, ¿cómo se indica la máscara de subred?', ['Como «longitud del prefijo», por ejemplo 24', 'No se indica: se calcula sola', 'En hexadecimal, como 0xffffff00', 'Con la dirección MAC'], 0, 'Android pide la longitud del prefijo de red: 24 equivale a 255.255.255.0.'),
        op('Una empresa cambió su Wi-Fi de WPA2 a WPA3. Un teléfono antiguo dejó de conectarse y ya no pide contraseña. ¿Qué pruebas primero?', ['Olvidar la red y volver a conectarse', 'Activar los datos móviles', 'Poner una IP estática', 'Cambiar el DNS'], 0, 'El perfil guardado conserva el tipo de seguridad anterior. Al olvidar la red, el teléfono la detecta de nuevo con su seguridad actual. Si aun así no conecta, puede que el equipo no soporte WPA3.'),
        vs('¿Cuáles **dos** datos hay que escribir para unirse a una red oculta, además de la contraseña?', ['El SSID exacto', 'La dirección MAC del router', 'El tipo de seguridad', 'El canal', 'La dirección IP pública'], [0, 2], 'El teléfono no puede aprenderlos del anuncio de la red: hay que escribir el nombre y elegir el tipo de seguridad. El canal lo encuentra solo.'),
        vs('¿Cuáles **dos** funciones de una red pueden fallar cuando un teléfono usa MAC privada?', ['El filtrado por MAC', 'El cifrado WPA3', 'Las reservas de dirección en DHCP', 'La velocidad de la banda de 5 GHz', 'La itinerancia entre puntos de acceso'], [0, 2], 'Las dos se basan en reconocer al equipo por su MAC. Si el teléfono se presenta con otra, ni el filtro ni la reserva lo identifican.'),
        vs('¿Cuáles **dos** modos de seguridad están obsoletos y no deben usarse?', ['WEP', 'WPA2', 'WPA (con TKIP)', 'WPA3', 'WPA3 Enterprise'], [0, 2], 'WEP y el WPA original tienen fallos conocidos. WPA2 y WPA3, en sus dos variantes, son los vigentes.'),
        rel('Relaciona cada acción con la opción de iOS que la realiza.', [['Ver la puerta de enlace', 'Campo «Router»'], ['Borrar la contraseña guardada de la red', '«Omitir esta red»'], ['Pedir de nuevo una dirección', '«Renovar concesión»'], ['Presentarse con una MAC distinta', '«Dirección Wi-Fi privada»']], 'Todas están en Ajustes → Wi-Fi → ⓘ de la red.', ['«Modo avión»']),
        rel('Relaciona cada modo con la forma de autenticarse.', [['WPA3 Personal', 'Una contraseña compartida'], ['WPA3 Enterprise', 'Usuario y contraseña validados por un servidor'], ['Red abierta', 'Sin credencial']], 'Personal usa una clave precompartida; Enterprise, credenciales individuales con 802.1X y RADIUS; una red abierta no pide nada.'),
        ord('Ordena los pasos para ver la IP de un teléfono Android en una red Wi-Fi.', ['Abrir Ajustes', 'Entrar en Red e Internet', 'Entrar en Internet o Wi-Fi', 'Tocar el engrane de la red conectada'], 'El recorrido general es Ajustes → Red e Internet → Wi-Fi → engrane. Los nombres exactos varían según el fabricante.'),
        medio(6), medio(9),
      ]),
    ],
  },
];
