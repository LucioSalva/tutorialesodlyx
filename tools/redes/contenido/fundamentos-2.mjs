// Fundamentos de redes · lecciones 5 a 7: TCP y UDP, protocolos de aplicación y nube.
import { h, h3, p, lista, orden, tabla, nota, formula, codigo, ejemplo, ejercicios, op, vs, rel, ord } from './_ayuda.mjs';
import { capa, uni } from './fundamentos-1.mjs';

const tr = (uso) => ({ tipo: 'fx-transporte', uso });
const saludo = (x, y) => ({ tipo: 'fx-handshake', modo: 'saludo', x, y });
const datos = (seq, bytes) => ({ tipo: 'fx-handshake', modo: 'datos', seq, bytes });
const pto = (proto) => ({ tipo: 'fx-puerto', modo: 'puerto', proto });
/** Del puerto al protocolo: la primera clave es la correcta. */
const quien = (proto, ...otros) => ({ tipo: 'fx-puerto', modo: 'protocolo', proto, opciones: [otros[0], proto, ...otros.slice(1)] });
const nube = (caso) => ({ tipo: 'fx-nube', caso });

export default [
  /* ------------------------------------------------------------------ 5 */
  {
    slug: 'tcp-y-udp',
    titulo: 'TCP y UDP: la capa de transporte',
    resumen: 'Qué hace la capa de transporte, cómo TCP garantiza la entrega con su saludo de tres vías y sus acuses, por qué UDP no lo hace, y para qué sirven los puertos.',
    nivel: 'medio',
    objetivos: [
      'Explicar qué problema resuelven los puertos y qué es un socket.',
      'Describir el saludo de tres vías y los acuses de recibo de TCP.',
      'Comparar TCP (orientado a conexión) con UDP (sin conexión).',
      'Decidir qué protocolo de transporte conviene a cada tipo de aplicación.',
    ],
    bloques: [
      h('El problema: un equipo, muchas conversaciones'),
      p(`La dirección IP lleva un paquete hasta el **equipo** correcto. Pero en ese equipo hay muchos programas usando la red a la vez: el navegador con cinco pestañas, el correo, una videollamada, las actualizaciones. Cuando llega un paquete, ¿a cuál de todos se le entrega?

Es como un edificio de departamentos. La dirección de la calle (la IP) lleva al cartero hasta el edificio, pero falta el **número de departamento**. En redes ese número es el **puerto**, y de él se encarga la **capa de transporte** (capa 4).`),
      p(`La capa de transporte hace tres cosas:`),
      lista(
        '**Separa las conversaciones** con números de puerto, para que cada dato llegue a su aplicación.',
        '**Corta los datos en trozos** del tamaño adecuado al enviar y los **vuelve a armar** al recibir.',
        'Según el protocolo que se use, **garantiza o no** que todo llegue completo y en orden.',
      ),
      p(`Hay dos protocolos de transporte: **TCP** y **UDP**. La aplicación elige uno u otro según lo que necesite.`),

      h('Los puertos'),
      p(`Un puerto es un número de **16 bits**: va del 0 al 65,535. Cada segmento lleva dos: el **puerto de destino** (a qué servicio va) y el **puerto de origen** (a dónde hay que contestar).`),
      tabla(['Rango', 'Nombre', 'Para qué se usa'], [
        ['0 – 1023', '**Bien conocidos**', 'Los servicios clásicos: web (80, 443), correo (25), DNS (53), SSH (22).'],
        ['1024 – 49151', '**Registrados**', 'Aplicaciones concretas que registran su número, como el escritorio remoto (3389).'],
        ['49152 – 65535', '**Dinámicos o efímeros**', 'Los que el sistema asigna al azar al **cliente** como puerto de origen, solo mientras dura la conversación.'],
      ]),
      p(`El **servidor** escucha en un puerto fijo y conocido, para que todos sepan dónde encontrarlo. El **cliente** usa un puerto de origen elegido al azar. Así, tu computadora puede tener diez pestañas abiertas contra el mismo sitio web: todas van al puerto 443 del servidor, pero cada una sale de un puerto de origen distinto, y las respuestas no se mezclan.`),
      nota('clave', `La combinación de **dirección IP + puerto** se llama **socket**, y se escribe con dos puntos: \`192.168.1.10:51000\`. Una conversación queda identificada por el par de sockets (el del cliente y el del servidor) y por el protocolo de transporte.`),
      codigo('Dos pestañas contra el mismo servidor: mismo destino, distinto puerto de origen', `Origen                  Destino                  Protocolo
192.168.1.10:51000  →   203.0.113.20:443         TCP   (pestaña 1)
192.168.1.10:51001  →   203.0.113.20:443         TCP   (pestaña 2)

Respuesta a la pestaña 1:
203.0.113.20:443    →   192.168.1.10:51000       TCP`),
      nota('aviso', `En la respuesta los puertos **se intercambian**: lo que era puerto de origen pasa a ser puerto de destino. Si el cliente salió del 51000 hacia el 443, el servidor contesta desde el 443 hacia el 51000.`),
      ejemplo('facil', 'Identificar los puertos de una respuesta', op(
        'Una computadora con IP `10.0.0.5` abre una página en un servidor web `198.51.100.7` usando HTTPS. El sistema eligió el puerto de origen 52311. En el segmento con el que el **servidor responde**, ¿cuáles son los puertos?',
        ['Origen 443, destino 52311', 'Origen 52311, destino 443', 'Origen 443, destino 443', 'Origen 80, destino 52311'], 0,
        [
          'HTTPS escucha en el puerto 443. La petición del cliente fue: origen 52311, destino 443.',
          'En la respuesta los papeles se invierten: quien responde es el servidor, así que el puerto de **origen** es el suyo, 443.',
          'Y el destino es el puerto desde el que preguntó el cliente: **52311**. Gracias a eso, el sistema del cliente sabe a qué pestaña entregar la respuesta.',
        ])),

      h('TCP: como una llamada telefónica'),
      p(`**TCP** (protocolo de control de transmisión) es **orientado a conexión** y **confiable**. Se parece a una llamada: antes de hablar marcas, la otra persona contesta y los dos confirman que se oyen. Durante la llamada, si algo no se entendió, se repite. Y al terminar, se despiden.

TCP ofrece cuatro garantías:`),
      tabla(['Garantía', 'Cómo lo consigue'], [
        ['**Conexión establecida**', 'Antes de enviar datos hace el **saludo de tres vías**.'],
        ['**Entrega confiable**', 'El receptor confirma lo que recibe con **acuses de recibo (ACK)**. Lo que no se confirma a tiempo, se **retransmite**.'],
        ['**Orden correcto**', 'Cada byte lleva un **número de secuencia**; el receptor reordena lo que llegue desordenado.'],
        ['**Control de flujo**', 'El receptor anuncia cuánto puede recibir (la **ventana**), para que el emisor no lo sature.'],
      ]),
      h3('El saludo de tres vías'),
      p(`Para abrir una conexión, cliente y servidor intercambian tres mensajes. Se llaman así por las **banderas** (flags) que llevan encendidas:`),
      orden(
        '**SYN** — el cliente dice: «quiero conectarme; empezaré a numerar mis bytes desde X».',
        '**SYN-ACK** — el servidor responde: «recibido, espero tu byte X+1; y yo empezaré a numerar desde Y».',
        '**ACK** — el cliente confirma: «recibido, espero tu byte Y+1». La conexión queda abierta.',
      ),
      nota('clave', `El **número de acuse (ACK)** siempre significa «**el siguiente byte que espero de ti**». Por eso es el último número recibido **más uno** en el saludo, y el número de secuencia **más los bytes recibidos** cuando ya viajan datos.`),
      ejemplo('medio', 'Completar un saludo de tres vías', saludo(1000, 5050)),
      h3('Acuses y retransmisión'),
      p(`Una vez abierta la conexión, cada segmento lleva un número de secuencia que indica el número de su primer byte. El receptor contesta con el número del siguiente byte que espera. Si el emisor no recibe ese acuse en un tiempo razonable, supone que el segmento se perdió y lo **vuelve a enviar**.`),
      ejemplo('medio', 'El acuse de un segmento con datos', datos(2001, 500)),
      h3('Cerrar la conexión'),
      p(`Al terminar, cada lado avisa con la bandera **FIN** y el otro lo confirma con un ACK; por eso el cierre normal usa cuatro mensajes. Si algo va mal (por ejemplo, llega un segmento a un puerto donde nadie escucha), se usa **RST** para cortar la conexión de golpe.`),
      tabla(['Bandera', 'Significado'], [
        ['**SYN**', 'Solicitud para abrir la conexión y sincronizar números de secuencia.'],
        ['**ACK**', 'Acuse de recibo.'],
        ['**FIN**', 'Ya no tengo más datos que enviar: cierre ordenado.'],
        ['**RST**', 'Reinicio: corta la conexión de inmediato.'],
      ]),

      h('UDP: como enviar postales'),
      p(`**UDP** (protocolo de datagramas de usuario) es **sin conexión** y **no confiable**. Se parece a echar postales al buzón: no avisas antes, no sabes si llegaron y pueden llegar desordenadas. A cambio, es lo más simple y rápido que hay.

«No confiable» no quiere decir «malo». Quiere decir que UDP **no se encarga** de confirmar ni de retransmitir: si la aplicación lo necesita, lo hará ella. El encabezado de UDP tiene solo **8 bytes**, frente a los **20 bytes** como mínimo del de TCP.`),
      tabla(['', 'TCP', 'UDP'], [
        ['Conexión', 'Orientado a conexión (saludo de tres vías)', 'Sin conexión: envía directamente'],
        ['Confiabilidad', 'Acuses y retransmisión', 'Ninguna: lo que se pierde, se pierde'],
        ['Orden', 'Reordena con números de secuencia', 'No reordena'],
        ['Control de flujo', 'Sí (ventana)', 'No'],
        ['Encabezado', '20 bytes como mínimo', '8 bytes'],
        ['Velocidad', 'Más lento: más trabajo y más mensajes', 'Más rápido y ligero'],
        ['PDU', 'Segmento', 'Datagrama'],
        ['Se usa en', 'Web, correo, transferencia de archivos, SSH', 'Voz y video en vivo, DNS, DHCP, TFTP, NTP, SNMP'],
      ]),

      h('Cuál elegir'),
      p(`La pregunta que decide todo es: **¿qué es peor para esta aplicación, que falte un trozo o que llegue tarde?**`),
      lista(
        'Si **no puede faltar nada** (una página, un correo, un archivo, una orden de compra) → **TCP**. Un pequeño retraso no importa.',
        'Si **no puede llegar tarde** (una llamada, una videoconferencia, un juego en línea) → **UDP**. Retransmitir una sílaba que ya pasó no sirve de nada.',
        'Si es una **pregunta corta con respuesta corta** (DNS, DHCP, NTP) → **UDP**. Abrir una conexión costaría más que la consulta.',
      ),
      ejemplo('facil', 'Una aplicación que no tolera pérdidas', tr('archivo')),
      ejemplo('facil', 'Una aplicación en tiempo real', tr('voz')),
      ejemplo('medio', 'Una consulta corta', tr('dns')),
      ejemplo('dificil', 'Leer una captura de tráfico', op(
        'Un técnico captura el tráfico de una computadora y ve estos tres mensajes seguidos hacia un servidor. ¿Qué está ocurriendo?',
        ['Se está abriendo una conexión TCP hacia un servidor web seguro', 'Se está cerrando una conexión TCP', 'Es una consulta DNS por UDP', 'El servidor está rechazando la conexión'], 0,
        [
          'Los tres mensajes llevan las banderas SYN, luego SYN y ACK, y por último ACK. Esa secuencia exacta es el **saludo de tres vías**: se está **abriendo** una conexión TCP.',
          'El puerto de destino del primer mensaje es el 443, que corresponde a HTTPS: el servidor es un servidor web seguro.',
          'No es un cierre (llevaría la bandera FIN), no es UDP (UDP no tiene banderas ni saludo) y no es un rechazo (el servidor contestaría con RST en lugar de SYN-ACK).',
        ],
        { codigo: `N.º  Origen              Destino             Protocolo  Información
1    192.168.1.10:50122  203.0.113.20:443    TCP        [SYN] Seq=0
2    203.0.113.20:443    192.168.1.10:50122  TCP        [SYN, ACK] Seq=0 Ack=1
3    192.168.1.10:50122  203.0.113.20:443    TCP        [ACK] Seq=1 Ack=1` })),

      h('Resumen'),
      lista(
        'La capa de transporte entrega los datos a la **aplicación** correcta usando **puertos** (0 a 65,535).',
        'Bien conocidos: 0–1023. Registrados: 1024–49151. Dinámicos: 49152–65535.',
        '**Socket** = dirección IP + puerto.',
        '**TCP**: con conexión (SYN, SYN-ACK, ACK), confiable, ordenado, con control de flujo. Más lento.',
        '**UDP**: sin conexión, sin acuses, encabezado de 8 bytes. Más rápido.',
        'TCP cuando no puede faltar nada; UDP cuando no puede llegar tarde o la consulta es muy corta.',
      ),

      ejercicios('Practica', 'En los ejercicios de números de secuencia recuerda: el acuse es «el siguiente byte que espero».', [
        tr('web'), tr('video'), tr('correo'), tr('dhcp'), tr('ssh'), tr('juego'), tr('tftp'), tr('banca'), tr('ntp'), tr('streaming'),
        saludo(300, 750), saludo(4200, 8150), saludo(100, 9050), datos(1, 1460), datos(3501, 1000), datos(721, 536),
        ord('Ordena los tres mensajes con los que se abre una conexión TCP.', ['SYN', 'SYN-ACK', 'ACK'], 'El cliente envía SYN, el servidor contesta SYN-ACK y el cliente confirma con ACK.'),
        rel('Relaciona cada rango de puertos con su nombre.', [['0 a 1023', 'Bien conocidos'], ['1024 a 49151', 'Registrados'], ['49152 a 65535', 'Dinámicos o efímeros']], 'Los servicios clásicos usan los bien conocidos; los clientes toman su puerto de origen del rango dinámico.'),
        vs('¿Cuáles **dos** características son de TCP y no de UDP?', ['Establece una conexión antes de enviar datos', 'Tiene un encabezado de 8 bytes', 'Retransmite los segmentos perdidos', 'No usa números de puerto', 'Es el preferido para voz en tiempo real'], [0, 2], 'TCP abre una conexión y retransmite lo que no se confirma. El encabezado de 8 bytes y el uso en voz en vivo son de UDP; los dos protocolos usan puertos.'),
        vs('¿Cuáles **tres** servicios usan UDP por defecto?', ['DHCP', 'HTTPS', 'TFTP', 'SSH', 'NTP'], [0, 2, 4], 'DHCP, TFTP y NTP trabajan sobre UDP. HTTPS y SSH necesitan la entrega confiable de TCP.'),
        op('¿Qué es un socket?', ['La combinación de una dirección IP y un número de puerto', 'El conector físico de un cable de red', 'La dirección MAC de la tarjeta', 'Un sinónimo de segmento'], 0, 'Un socket identifica un extremo de la conversación: en qué equipo (IP) y en qué aplicación (puerto). No tiene relación con el conector físico.'),
        op('Un cliente abre una página web. ¿De qué rango suele tomar el sistema operativo el puerto de **origen**?', ['0 a 1023', '49152 a 65535', 'Siempre usa el 80', 'Siempre usa el 443'], 1, 'El cliente usa un puerto dinámico o efímero, elegido al azar. Los puertos 80 y 443 son los de destino, donde escucha el servidor.'),
        op('Un emisor TCP envía un segmento y no recibe su acuse de recibo dentro del tiempo de espera. ¿Qué hace?', ['Cierra la conexión con FIN', 'Retransmite el segmento', 'Cambia a UDP', 'Sigue enviando sin hacer nada'], 1, 'La falta de acuse se interpreta como pérdida, y TCP vuelve a enviar el segmento. Esa es la base de su confiabilidad.'),
        op('Un equipo envía un SYN a un puerto en el que ningún programa está escuchando. ¿Qué suele contestar el equipo de destino?', ['SYN-ACK', 'RST', 'FIN', 'Nada: UDP no responde'], 1, 'Si no hay servicio en ese puerto, el sistema contesta con RST para rechazar la conexión. SYN-ACK significaría que sí hay un servicio escuchando.'),
        op('¿Por qué la voz sobre IP usa UDP en lugar de TCP?', ['Porque UDP cifra el audio', 'Porque retransmitir un trozo de audio perdido llegaría demasiado tarde para servir', 'Porque UDP garantiza el orden de llegada', 'Porque TCP no admite números de puerto'], 1, 'En tiempo real, un dato que llega tarde ya no sirve; es mejor perderlo que esperar. UDP no cifra ni ordena, y TCP sí usa puertos.'),
        op('¿Qué campo del encabezado TCP permite al receptor avisar cuántos datos puede recibir sin saturarse?', ['El número de secuencia', 'El tamaño de ventana', 'La bandera SYN', 'El puerto de origen'], 1, 'La ventana es el mecanismo de control de flujo: indica cuántos bytes acepta el receptor antes del siguiente acuse.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 6 */
  {
    slug: 'protocolos-de-aplicacion',
    titulo: 'Protocolos de aplicación y sus puertos',
    resumen: 'Para qué sirve cada protocolo que nombra el examen (HTTP, HTTPS, DNS, DHCP, FTP, SFTP, TFTP, NTP, ICMP, SSH, Telnet, correo, SNMP y RDP), en qué puerto escucha y qué transporte usa.',
    nivel: 'medio',
    objetivos: [
      'Explicar para qué sirve cada protocolo de aplicación común.',
      'Asociar cada protocolo con su puerto y con TCP o UDP.',
      'Distinguir las versiones seguras de las inseguras (HTTP y HTTPS, Telnet y SSH, FTP y SFTP).',
      'Describir cómo trabajan juntos DHCP y DNS cuando un equipo se conecta y abre una página.',
    ],
    bloques: [
      h('Cliente y servidor'),
      p(`Casi todos los protocolos de aplicación siguen el mismo modelo: un **cliente** hace una petición y un **servidor** la responde. El servidor es un programa que está siempre esperando en un **puerto conocido**; el cliente es quien inicia la conversación.

«Servidor» no significa una máquina enorme: es un **papel**. Tu computadora es cliente cuando abres una página y puede ser servidor cuando compartes una carpeta.`),
      p(`Para estudiarlos conviene agruparlos por lo que hacen. Empecemos por el mapa completo, y luego vemos cada grupo.`),
      tabla(['Protocolo', 'Para qué sirve', 'Puerto', 'Transporte'], [
        ['**HTTP**', 'Páginas web sin cifrar', '80', 'TCP'],
        ['**HTTPS**', 'Páginas web cifradas con TLS', '443', 'TCP'],
        ['**DNS**', 'Traducir nombres a direcciones IP', '53', 'UDP (y TCP)'],
        ['**DHCP**', 'Dar configuración IP automática', '67 (servidor) y 68 (cliente)', 'UDP'],
        ['**FTP**', 'Transferir archivos, sin cifrar', '21 (control) y 20 (datos)', 'TCP'],
        ['**SFTP**', 'Transferir archivos, cifrado sobre SSH', '22', 'TCP'],
        ['**TFTP**', 'Transferir archivos de forma mínima', '69', 'UDP'],
        ['**SSH**', 'Terminal remota cifrada', '22', 'TCP'],
        ['**Telnet**', 'Terminal remota sin cifrar', '23', 'TCP'],
        ['**SMTP**', 'Enviar correo', '25', 'TCP'],
        ['**POP3**', 'Descargar correo', '110', 'TCP'],
        ['**IMAP**', 'Consultar correo en el servidor', '143', 'TCP'],
        ['**NTP**', 'Sincronizar la hora', '123', 'UDP'],
        ['**SNMP**', 'Monitorear y administrar dispositivos', '161', 'UDP'],
        ['**RDP**', 'Escritorio remoto de Windows', '3389', 'TCP'],
        ['**ICMP**', 'Mensajes de control y error (`ping`)', 'No usa puertos', 'Va directo sobre IP'],
      ]),
      nota('truco', `No intentes memorizar la lista de corrido. Apréndela **por parejas**: web 80 y 443; terminal remota 22 y 23; archivos 20, 21 y 69; correo 25, 110 y 143; infraestructura por UDP: DNS 53, DHCP 67 y 68, NTP 123, SNMP 161.`),

      h('La web: HTTP y HTTPS'),
      p(`**HTTP** es el protocolo con el que el navegador pide una página y el servidor la entrega. Todo viaja **en texto claro**: cualquiera que capture el tráfico puede leer lo que envías, contraseñas incluidas.

**HTTPS** es el mismo HTTP, pero dentro de un canal **cifrado con TLS**. Aporta tres cosas: nadie puede **leer** el contenido, nadie puede **alterarlo** sin que se note y, gracias al **certificado** del sitio, puedes comprobar que hablas con el servidor auténtico.`),
      tabla(['', 'HTTP', 'HTTPS'], [
        ['Puerto', '80', '443'],
        ['Cifrado', 'No', 'Sí, con TLS'],
        ['En el navegador', '`http://` y aviso de «No seguro»', '`https://` y el candado'],
        ['Úsalo para', 'Casi nada hoy en día', 'Todo, y obligatoriamente donde haya contraseñas o pagos'],
      ]),

      h('Nombres y direcciones: DNS'),
      p(`Las personas recordamos nombres; las redes trabajan con números. **DNS** (sistema de nombres de dominio) es la **agenda de contactos** de Internet: le das un nombre como \`www.ejemplo.com\` y te devuelve su dirección IP.

Tu equipo no sabe resolver nombres por sí mismo: se lo pregunta al **servidor DNS** que tiene configurado. Esa consulta normal viaja por **UDP al puerto 53**. DNS usa TCP en ese mismo puerto cuando la respuesta es demasiado grande y para copiar zonas completas entre servidores.`),
      codigo('Consultar un nombre a mano con nslookup', `C:\\> nslookup www.ejemplo.com
Servidor:  dns.miempresa.local
Address:  192.168.1.1

Respuesta no autoritativa:
Nombre:  www.ejemplo.com
Address:  203.0.113.20`),
      nota('clave', `El síntoma clásico de un fallo de DNS: **«el ping a una dirección IP funciona, pero las páginas no abren por su nombre»**. La red está bien; lo que falla es la traducción.`),

      h('Configuración automática: DHCP'),
      p(`Para funcionar en una red, un equipo necesita cuatro datos: **dirección IP**, **máscara de subred**, **puerta de enlace** y **servidor DNS**. Ponerlos a mano en cada equipo sería lento y propenso a errores. **DHCP** los entrega solo, en cuanto el equipo se conecta.

El intercambio tiene cuatro pasos, que se recuerdan con la palabra **DORA**:`),
      tabla(['Paso', 'Mensaje', 'Quién lo envía', 'Qué dice'], [
        ['**D**', 'Discover', 'Cliente (por broadcast)', '«¿Hay algún servidor DHCP? Necesito una dirección.»'],
        ['**O**', 'Offer', 'Servidor', '«Te ofrezco esta dirección.»'],
        ['**R**', 'Request', 'Cliente (por broadcast)', '«Acepto esa dirección.»'],
        ['**A**', 'Acknowledge', 'Servidor', '«Confirmado: es tuya durante este tiempo.»'],
      ]),
      p(`La dirección no se regala para siempre: se **presta** durante un tiempo (la **concesión** o *lease*). Antes de que venza, el equipo la renueva.

DHCP usa **UDP**: el servidor escucha en el puerto **67** y el cliente en el **68**. No puede usar TCP porque, al empezar, el cliente todavía no tiene dirección IP y ni siquiera sabe dónde está el servidor: por eso pregunta por **broadcast**.`),
      nota('aviso', `Si un equipo con Windows no encuentra ningún servidor DHCP, se asigna él mismo una dirección del rango **169.254.0.0/16** (APIPA). Ver una dirección \`169.254.x.x\` en un equipo significa casi siempre: «pedí configuración por DHCP y nadie me contestó».`),
      ejemplo('medio', 'Ordenar el intercambio DHCP', ord(
        'Una laptop se conecta a la red de la oficina y obtiene su configuración por DHCP. Ordena los cuatro mensajes del intercambio.',
        ['Discover', 'Offer', 'Request', 'Acknowledge'],
        [
          'El equipo recién conectado no tiene dirección ni conoce al servidor: empieza preguntando a todos con un **Discover** por broadcast.',
          'El servidor DHCP que lo oye responde con un **Offer**: le propone una dirección libre.',
          'El cliente contesta con un **Request**: acepta formalmente esa oferta (podría haber recibido varias, de distintos servidores).',
          'El servidor cierra con un **Acknowledge** y anota la concesión. La regla para recordarlo es **DORA**.',
        ])),
      ejemplo('medio', 'El puerto y el transporte de DHCP', pto('dhcp')),

      h('Transferir archivos: FTP, SFTP y TFTP'),
      tabla(['', 'FTP', 'SFTP', 'TFTP'], [
        ['Puerto', '21 para las órdenes y 20 para los datos', '22 (va dentro de SSH)', '69'],
        ['Transporte', 'TCP', 'TCP', 'UDP'],
        ['Usuario y contraseña', 'Sí, pero viajan en texto claro', 'Sí, cifrados', 'No tiene'],
        ['Cifrado', 'No', 'Sí', 'No'],
        ['Uso típico', 'Transferencias en redes de confianza', 'Transferencias seguras', 'Copiar la imagen del sistema o la configuración de routers y switches dentro de la red local'],
      ]),
      nota('aviso', `No confundas **SFTP** con FTP «con algo más». SFTP es un protocolo distinto que funciona **dentro de una sesión SSH**; por eso usa el puerto **22** y no el 21.`),

      h('Acceso remoto: SSH, Telnet y RDP'),
      p(`Sirven para manejar un equipo sin estar frente a él.`),
      tabla(['Protocolo', 'Qué te da', 'Puerto', 'Seguridad'], [
        ['**Telnet**', 'Una línea de comandos remota', '23 TCP', '**Sin cifrar**: usuario, contraseña y comandos viajan en texto claro. No debe usarse.'],
        ['**SSH**', 'Una línea de comandos remota', '22 TCP', '**Cifrado**. Es el reemplazo de Telnet y la forma correcta de administrar routers y switches.'],
        ['**RDP**', 'El escritorio gráfico de un equipo con Windows', '3389 TCP', 'Cifrado; aun así no conviene exponerlo directamente a Internet.'],
      ]),
      ejemplo('facil', 'El reemplazo seguro de Telnet', pto('ssh')),
      ejemplo('medio', 'Elegir el protocolo correcto', op(
        'Un técnico debe conectarse desde su casa a la línea de comandos de un switch de la empresa. La política de seguridad prohíbe que las contraseñas viajen en texto claro. ¿Qué protocolo debe usar y en qué puerto?',
        ['SSH, puerto 22', 'Telnet, puerto 23', 'TFTP, puerto 69', 'HTTP, puerto 80'], 0,
        [
          'Se necesita una **línea de comandos remota**. Los dos protocolos que la ofrecen son Telnet y SSH.',
          'Telnet envía todo, también la contraseña, **sin cifrar**: lo prohíbe la política.',
          '**SSH** hace lo mismo que Telnet, pero cifrado, y escucha en el puerto **22** sobre TCP.',
          'TFTP y HTTP no dan una terminal: uno copia archivos y el otro sirve páginas web.',
        ])),

      h('Correo: SMTP, POP3 e IMAP'),
      p(`El correo usa un protocolo para **enviar** y otro para **leer**.`),
      tabla(['Protocolo', 'Dirección', 'Puerto', 'Cómo trabaja'], [
        ['**SMTP**', 'Enviar: del cliente al servidor y entre servidores', '25', 'Es «el cartero que se lleva» la carta.'],
        ['**POP3**', 'Recibir', '110', 'Descarga los mensajes al equipo y, normalmente, los borra del servidor. Pensado para un solo dispositivo.'],
        ['**IMAP**', 'Recibir', '143', 'Los mensajes se quedan en el servidor y se ven sincronizados desde todos tus dispositivos.'],
      ]),
      nota('truco', `**S**MTP = **S**alida (send). Para leer el mismo buzón desde el teléfono y desde la computadora a la vez, la respuesta es **IMAP**.`),

      h('Servicios de la red: NTP, SNMP e ICMP'),
      tabla(['Protocolo', 'Qué hace', 'Por qué importa'], [
        ['**NTP** (UDP 123)', 'Sincroniza el reloj de los equipos con un servidor de hora.', 'Sin la hora correcta, los registros de distintos equipos no se pueden comparar y fallan los certificados y algunas autenticaciones.'],
        ['**SNMP** (UDP 161)', 'Permite a un sistema de monitoreo preguntar a routers, switches e impresoras por su estado.', 'Es la base de las herramientas que vigilan la red.'],
        ['**ICMP**', 'Lleva mensajes de control y de error de la capa de red. Lo usan `ping` y `tracert`.', 'Es la herramienta básica de diagnóstico.'],
      ]),
      nota('error', `**ICMP no usa puertos.** No es un protocolo de aplicación montado sobre TCP o UDP: viaja directamente dentro de IP, en la capa 3. Si una pregunta ofrece «ICMP, puerto 7» o parecido, esa opción es incorrecta.`, 'Error frecuente'),
      ejemplo('facil', 'El puerto del correo saliente', pto('smtp')),
      ejemplo('medio', 'Del puerto al protocolo', quien('ntp', 'snmp', 'tftp', 'dns')),

      h('Todo junto: qué pasa cuando abres una página'),
      p(`Conectas tu laptop a la red y escribes \`https://www.ejemplo.com\`. En un par de segundos trabajan casi todos los protocolos de esta lección:`),
      orden(
        '**DHCP** (UDP 67 y 68): la laptop pide y recibe su dirección IP, máscara, puerta de enlace y servidor DNS.',
        '**DNS** (UDP 53): la laptop pregunta al servidor DNS «¿qué IP tiene `www.ejemplo.com`?» y recibe la respuesta.',
        '**TCP**: la laptop abre una conexión con esa IP en el puerto 443 mediante el saludo de tres vías.',
        '**TLS**: cliente y servidor acuerdan el cifrado y el servidor presenta su certificado.',
        '**HTTPS**: el navegador pide la página y el servidor la envía, ya cifrada.',
      ),
      ejemplo('dificil', 'Diagnosticar con la lista de protocolos', op(
        'Una computadora recién conectada muestra la dirección `169.254.18.7` y no puede navegar ni hacer ping a ningún equipo de la oficina. ¿Qué servicio falló?',
        ['DNS', 'DHCP', 'NTP', 'HTTPS'], 1,
        [
          'Una dirección `169.254.x.x` es del rango APIPA: Windows se la asigna a sí mismo cuando **pide configuración por DHCP y nadie responde**.',
          'Sin una dirección válida de la red de la oficina, el equipo no puede alcanzar ni a su puerta de enlace: por eso falla todo, no solo la navegación.',
          'Si el fallo fuera de **DNS**, el equipo tendría una dirección correcta y podría hacer ping por IP; solo fallarían los nombres.',
          'El técnico debe revisar el servidor DHCP, si el equipo está en la VLAN correcta y si el cable o el wifi llegan al servidor.',
        ])),

      h('Resumen'),
      lista(
        'Web: **HTTP 80** (sin cifrar) y **HTTPS 443** (cifrado con TLS).',
        '**DNS 53** traduce nombres; **DHCP 67 y 68** entrega la configuración IP con los pasos **DORA**.',
        'Archivos: **FTP 20 y 21** (TCP, sin cifrar), **SFTP 22** (dentro de SSH) y **TFTP 69** (UDP, sin autenticación).',
        'Acceso remoto: **SSH 22** (seguro), **Telnet 23** (inseguro) y **RDP 3389** (escritorio de Windows).',
        'Correo: **SMTP 25** envía; **POP3 110** descarga; **IMAP 143** sincroniza.',
        '**NTP 123** da la hora, **SNMP 161** monitorea e **ICMP** (sin puertos) diagnostica.',
      ),

      ejercicios('Practica', 'Escribe el puerto de memoria; si no lo recuerdas, usa la pista de las parejas.', [
        pto('http'), pto('https'), pto('dns'), pto('telnet'), pto('ftp'), pto('tftp'), pto('ntp'), pto('snmp'), pto('rdp'), pto('pop3'), pto('imap'), pto('sftp'),
        quien('ssh', 'telnet', 'ftp', 'smtp'), quien('https', 'http', 'rdp', 'dns'), quien('rdp', 'ssh', 'imap', 'snmp'), quien('tftp', 'ftp', 'dhcp', 'ntp'), quien('imap', 'pop3', 'smtp', 'http'),
        rel('Relaciona cada protocolo inseguro con su reemplazo seguro.', [['HTTP', 'HTTPS'], ['Telnet', 'SSH'], ['FTP', 'SFTP']], 'HTTPS cifra la web con TLS; SSH cifra la terminal remota; SFTP transfiere archivos dentro de SSH.', ['TFTP', 'SNMP']),
        rel('Relaciona cada necesidad con el protocolo que la resuelve.', [
          ['Saber la dirección IP de un nombre', 'DNS'], ['Recibir dirección IP automáticamente', 'DHCP'], ['Tener la misma hora en todos los equipos', 'NTP'], ['Vigilar el estado de los switches', 'SNMP'],
        ], 'DNS resuelve nombres, DHCP reparte configuración, NTP sincroniza relojes y SNMP monitorea dispositivos.', ['SMTP']),
        ord('Ordena los cuatro mensajes con los que un cliente obtiene su dirección por DHCP.', ['Discover', 'Offer', 'Request', 'Acknowledge'], 'DORA: el cliente descubre, el servidor ofrece, el cliente solicita y el servidor confirma.'),
        vs('¿Cuáles **dos** protocolos envían usuario y contraseña sin cifrar?', ['Telnet', 'SSH', 'FTP', 'HTTPS', 'SFTP'], [0, 2], 'Telnet y FTP transmiten todo en texto claro. SSH, HTTPS y SFTP cifran la sesión.'),
        vs('¿Cuáles **dos** protocolos sirven para **leer** el correo de un buzón?', ['SMTP', 'POP3', 'IMAP', 'SNMP', 'NTP'], [1, 2], 'POP3 e IMAP recuperan el correo. SMTP solo lo envía; SNMP y NTP no tienen relación con el correo.'),
        op('Un usuario puede hacer ping a `8.8.8.8`, pero no puede abrir `www.ejemplo.com`. ¿Qué servicio conviene revisar primero?', ['DHCP', 'DNS', 'NTP', 'SNMP'], 1, 'Hay conectividad por IP, pero no se resuelven los nombres: es el síntoma típico de un fallo de DNS. Si fallara DHCP, el equipo no tendría una dirección válida.'),
        op('¿Qué protocolo usa `ping` para comprobar si un equipo responde?', ['TCP', 'UDP', 'ICMP', 'SNMP'], 2, '`ping` envía mensajes ICMP de solicitud de eco y espera las respuestas. ICMP viaja directamente sobre IP y no usa puertos.'),
        op('Un administrador necesita copiar la imagen del sistema operativo a un switch desde un servidor de la misma red local, con el método más simple y sin usuario ni contraseña. ¿Qué protocolo usa?', ['SFTP', 'TFTP', 'IMAP', 'RDP'], 1, 'TFTP es la transferencia mínima, sin autenticación y sobre UDP 69, habitual para imágenes y configuraciones dentro de una LAN. SFTP exigiría una cuenta y SSH.'),
        op('Una persona quiere ver el mismo correo, con las mismas carpetas, en su teléfono y en su computadora. ¿Qué protocolo debe configurar para recibir?', ['POP3', 'IMAP', 'SMTP', 'FTP'], 1, 'IMAP deja los mensajes en el servidor y los sincroniza entre dispositivos. POP3 los descarga a un solo equipo y SMTP solo sirve para enviar.'),
        op('Los registros de dos routers muestran el mismo evento con cinco minutos de diferencia y es imposible ordenar lo que pasó. ¿Qué protocolo evita este problema?', ['NTP', 'DNS', 'DHCP', 'TFTP'], 0, 'NTP mantiene sincronizados los relojes para que los registros de distintos equipos sean comparables.'),
        capa('dhcp'), capa('smtp'), capa('icmp'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 7 */
  {
    slug: 'nube-y-servicios-locales',
    titulo: 'La nube y los servicios locales',
    resumen: 'Qué diferencia hay entre tener los servidores en tu edificio y usar los de un proveedor, los modelos de servicio (SaaS, PaaS, IaaS), los modelos de despliegue (pública, privada, híbrida, comunitaria) y el trabajo remoto e híbrido.',
    nivel: 'medio',
    objetivos: [
      'Comparar los servicios locales (on-premises) con los servicios en la nube.',
      'Distinguir SaaS, PaaS e IaaS por lo que administra el cliente y lo que administra el proveedor.',
      'Distinguir nube pública, privada, híbrida y comunitaria.',
      'Explicar qué necesita la red para dar soporte al trabajo remoto e híbrido.',
    ],
    bloques: [
      h('Dos formas de tener un servicio'),
      p(`Una empresa necesita correo, un sistema de ventas y un lugar donde guardar archivos. Puede conseguirlos de dos maneras.

**Local (on-premises).** La empresa compra los servidores, los instala en un cuarto de su edificio y su propio personal los cuida: electricidad, aire acondicionado, discos, respaldos, actualizaciones y seguridad. Todo es suyo y todo es su responsabilidad.

**En la nube.** Los servidores están en los centros de datos de un **proveedor**. La empresa los usa **a través de Internet** y paga por lo que consume, como la luz o el agua.`),
      p(`Una analogía: para moverte por la ciudad puedes **comprar un auto** (lo eliges a tu gusto, pero pagas el seguro, el taller y la cochera, lo uses o no) o **tomar un taxi** cuando lo necesitas (no te preocupas del mantenimiento y pagas por viaje, pero dependes de que haya servicio).`),
      tabla(['', 'Local (on-premises)', 'Nube'], [
        ['Dónde están los servidores', 'En las instalaciones de la organización.', 'En centros de datos del proveedor.'],
        ['Costo', 'Inversión inicial alta en equipos (gasto de capital).', 'Pago mensual o por uso (gasto operativo), casi sin inversión inicial.'],
        ['Crecer o reducir', 'Lento: hay que comprar e instalar equipos.', 'En minutos: se pide más capacidad y se devuelve cuando sobra.'],
        ['Mantenimiento', 'Lo hace el personal propio.', 'Lo hace el proveedor (según el modelo).'],
        ['Control', 'Total, también sobre dónde están los datos.', 'Compartido: el proveedor controla la infraestructura.'],
        ['Dependencia de Internet', 'Los usuarios de la oficina siguen trabajando aunque se caiga Internet.', 'Sin conexión a Internet no hay servicio.'],
        ['Acceso desde fuera', 'Requiere preparar accesos (por ejemplo, una VPN).', 'Natural: se entra desde cualquier lugar.'],
      ]),
      nota('clave', `La nube no es «mejor» ni «peor»: es otra forma de repartir **costos, control y responsabilidad**. La pregunta de examen típica describe una necesidad («crecer rápido en temporada alta», «los datos no pueden salir del edificio») y pide elegir el modelo que la cumple.`),
      p(`Las cinco características que definen a un servicio de nube:`),
      lista(
        '**Autoservicio bajo demanda**: pides recursos tú mismo, sin esperar a que alguien los instale.',
        '**Acceso amplio por red**: se usa desde cualquier dispositivo con conexión.',
        '**Recursos compartidos**: el proveedor atiende a muchos clientes con la misma infraestructura.',
        '**Elasticidad**: la capacidad crece y se reduce rápidamente según la demanda.',
        '**Servicio medido**: se paga por lo que se usa.',
      ),
      ejemplo('facil', 'Servidores en el propio edificio', nube('sala')),

      h('Modelos de servicio: ¿quién administra qué?'),
      p(`«Usar la nube» puede significar cosas muy distintas. La diferencia está en **cuánto hace el proveedor y cuánto te toca a ti**. Hay tres niveles, y la mejor forma de entenderlos es con una pizza:`),
      tabla(['Modelo', 'Con la pizza', 'Qué te da el proveedor', 'Qué pones tú', 'Ejemplos de uso'], [
        ['**Local**', 'La haces en casa: compras ingredientes, usas tu horno y tu mesa.', 'Nada.', 'Todo.', 'Servidor de archivos en la oficina.'],
        ['**IaaS** · Infraestructura como servicio', 'Compras la pizza congelada: la horneas tú.', 'Servidores virtuales, almacenamiento y red.', 'Sistema operativo, programas, datos.', 'Alquilar máquinas virtuales.'],
        ['**PaaS** · Plataforma como servicio', 'Pides a domicilio: solo pones la mesa.', 'Además, el sistema operativo, la base de datos y el entorno de ejecución.', 'Tu aplicación y tus datos.', 'Publicar una aplicación sin administrar servidores.'],
        ['**SaaS** · Software como servicio', 'Vas al restaurante: solo comes.', 'Todo, hasta la aplicación terminada.', 'Tus datos y tus usuarios.', 'Correo web, ofimática en línea, videoconferencias.'],
      ]),
      tabla(['¿Quién administra…?', 'Local', 'IaaS', 'PaaS', 'SaaS'], [
        ['La aplicación', 'Tú', 'Tú', 'Tú', 'Proveedor'],
        ['El sistema operativo y el entorno', 'Tú', 'Tú', 'Proveedor', 'Proveedor'],
        ['Los servidores, discos y redes', 'Tú', 'Proveedor', 'Proveedor', 'Proveedor'],
        ['El edificio, la electricidad y la refrigeración', 'Tú', 'Proveedor', 'Proveedor', 'Proveedor'],
      ]),
      nota('truco', `Tres preguntas rápidas para acertar siempre: ¿**solo usas** una aplicación ya hecha? → **SaaS**. ¿**Subes tu código** sin tocar el sistema operativo? → **PaaS**. ¿**Instalas tú el sistema operativo** en máquinas alquiladas? → **IaaS**.`),
      nota('aviso', `En ningún modelo el proveedor se hace responsable de **todo**. Incluso en SaaS, tus **datos**, las **cuentas de usuario** y **quién tiene acceso a qué** siguen siendo responsabilidad tuya. A esto se le llama modelo de **responsabilidad compartida**.`),
      ejemplo('facil', 'Una aplicación lista para usar', nube('correo')),
      ejemplo('medio', 'Solo subir el código', nube('desarrollo')),
      ejemplo('medio', 'Máquinas virtuales alquiladas', nube('maquinas')),

      h('Modelos de despliegue: ¿quién puede usar esa nube?'),
      p(`La segunda clasificación no mira qué se ofrece, sino **para quién es** la infraestructura.`),
      tabla(['Modelo', 'Quién la usa', 'Ventaja principal', 'Inconveniente'], [
        ['**Pública**', 'Cualquiera que la contrate; la infraestructura se comparte entre muchos clientes.', 'Barata, inmediata y prácticamente sin límite de crecimiento.', 'Menos control sobre dónde y cómo se guardan los datos.'],
        ['**Privada**', '**Una sola organización**, en su centro de datos o en uno dedicado.', 'Máximo control y aislamiento.', 'Cara: la organización paga toda la infraestructura.'],
        ['**Híbrida**', 'Combina una privada (o servidores locales) con una pública, **conectadas y trabajando juntas**.', 'Lo sensible se queda dentro y lo demás aprovecha la nube pública.', 'Más compleja de integrar y de asegurar.'],
        ['**Comunitaria**', '**Varias organizaciones** con necesidades comunes (mismo sector, mismas normas).', 'Comparten costos y cumplen las mismas reglas.', 'Hay que ponerse de acuerdo entre todas.'],
      ]),
      nota('error', `Nube **privada** no significa «con contraseña». Una nube pública también pide usuario y contraseña. «Privada» quiere decir que la **infraestructura es de uso exclusivo** de una organización.`, 'Error frecuente'),
      ejemplo('facil', 'Abierta a cualquier cliente', nube('publica')),
      ejemplo('medio', 'Dos entornos que trabajan juntos', nube('hibrida')),
      ejemplo('dificil', 'Elegir el modelo para un caso real', op(
        'Una tienda en línea usa todo el año sus propios servidores, en su centro de datos. En noviembre el tráfico se multiplica por diez durante dos semanas. La dirección no quiere comprar servidores que estarían apagados el resto del año, y la base de datos de clientes debe permanecer en el centro de datos propio. ¿Qué modelo de despliegue conviene?',
        ['Nube híbrida', 'Nube privada', 'Nube comunitaria', 'Seguir solo con servidores locales'], 0,
        [
          'Hay dos requisitos que tiran en direcciones opuestas: **crecer mucho por poco tiempo** (lo que mejor hace la nube pública) y **mantener ciertos datos dentro** (lo que da la infraestructura propia).',
          'Solo con servidores locales o con una nube privada, la tienda tendría que comprar capacidad para el pico de noviembre y dejarla sin usar once meses.',
          'La nube comunitaria es para varias organizaciones con intereses comunes; aquí hay una sola empresa.',
          'La **nube híbrida** combina las dos cosas: la base de datos se queda en el centro de datos propio y, en el pico, los servidores web adicionales se levantan en la nube pública, conectados a lo demás.',
        ])),

      h('Trabajo remoto e híbrido'),
      p(`Con las aplicaciones en la nube ya no hace falta estar en la oficina para trabajar. En el **trabajo remoto** la persona trabaja siempre desde fuera; en el **trabajo híbrido** alterna días en la oficina y días en casa.

Para la red y para el equipo de soporte, eso cambia varias cosas:`),
      tabla(['Necesidad', 'Cómo se resuelve'], [
        ['Llegar a los recursos internos desde fuera', 'Con una **VPN**: un túnel cifrado entre el equipo del empleado y la red de la empresa.'],
        ['Reuniones y colaboración', 'Con aplicaciones **SaaS** de videoconferencia, mensajería y documentos compartidos.'],
        ['Buena calidad de voz y video', 'La conexión de casa debe tener suficiente ancho de banda, poca latencia y poco jitter.'],
        ['Seguridad', 'Autenticación de varios factores, equipos actualizados y cifrado, porque la red de casa no la controla la empresa.'],
        ['Soporte', 'Herramientas de acceso remoto para que el técnico vea y arregle el equipo a distancia.'],
      ]),
      nota('clave', `Para un técnico de soporte, el trabajo remoto añade una variable que no controla: **la red de la casa del usuario**. Cuando alguien dice «la videollamada va mal», lo primero es averiguar si el problema está en su wifi, en su proveedor de internet o en el servicio.`),
      ejemplo('medio', 'Soporte a un empleado remoto', op(
        'Una empleada que trabaja desde su casa puede navegar por Internet y usar el correo web de la empresa, pero no puede abrir la carpeta compartida del servidor de archivos que está en la oficina. ¿Cuál es la causa más probable?',
        ['No ha conectado la VPN de la empresa', 'Su proveedor de internet bloquea el correo', 'El servidor DNS público está caído', 'Su ancho de banda es insuficiente'], 0,
        [
          'Navega y usa el correo web: su conexión a Internet funciona y la resolución de nombres también.',
          'El correo web es un servicio **en la nube**, accesible desde cualquier lugar. El servidor de archivos, en cambio, está **dentro de la red de la oficina** y no se alcanza directamente desde Internet.',
          'Para llegar a un recurso interno desde casa hace falta el túnel cifrado de la **VPN**. Sin ella, la carpeta compartida es invisible.',
          'El ancho de banda haría lenta la carpeta, no inaccesible; y un bloqueo del correo o un fallo de DNS contradicen que el correo web y la navegación funcionen.',
        ])),

      h('Resumen'),
      lista(
        '**Local**: servidores propios, en tu edificio y bajo tu responsabilidad. **Nube**: recursos de un proveedor, por Internet y pagando por uso.',
        '**IaaS**: alquilas la infraestructura e instalas todo. **PaaS**: te dan la plataforma y pones tu aplicación. **SaaS**: usas una aplicación terminada.',
        '**Pública**: para cualquiera. **Privada**: para una organización. **Híbrida**: combinación conectada. **Comunitaria**: para varias organizaciones afines.',
        'La nube da elasticidad y acceso desde cualquier lugar, a cambio de depender de Internet y de ceder parte del control.',
        'El trabajo remoto e híbrido se apoya en SaaS, VPN y buenas prácticas de seguridad.',
      ),

      ejercicios('Practica', 'Para el modelo de servicio pregunta «¿qué administra el cliente?»; para el de despliegue, «¿quién puede usar esa nube?».', [
        nube('crm'), nube('basedatos'), nube('almacenamiento'), nube('nomina'), nube('video'), nube('funciones'), nube('respaldo'),
        nube('publica2'), nube('privada'), nube('hibrida2'), nube('comunitaria'), nube('privada2'), nube('comunitaria2'),
        rel('Relaciona cada modelo de servicio con lo que el **cliente** todavía administra.', [
          ['IaaS', 'El sistema operativo, las aplicaciones y los datos'], ['PaaS', 'Solo su aplicación y sus datos'], ['SaaS', 'Solo sus datos y sus usuarios'],
        ], 'Cuanto más arriba en la lista SaaS → PaaS → IaaS, más administra el cliente.', ['El edificio y la electricidad']),
        ord('Ordena los modelos del que deja **más** trabajo al cliente al que deja **menos**.', ['Local (on-premises)', 'IaaS', 'PaaS', 'SaaS'], 'En local el cliente hace todo; en IaaS deja la infraestructura al proveedor; en PaaS también la plataforma; en SaaS, hasta la aplicación.'),
        vs('¿Cuáles **dos** son ventajas de la nube frente a los servidores locales?', ['Se puede ampliar la capacidad en minutos', 'Funciona aunque no haya conexión a Internet', 'Reduce la inversión inicial en equipos', 'Da control físico total sobre los servidores', 'Elimina la necesidad de cuentas de usuario'], [0, 2], 'La elasticidad y el pago por uso son las ventajas clásicas. La dependencia de Internet y el menor control físico son sus inconvenientes.'),
        vs('¿Cuáles **dos** características definen a un servicio de nube?', ['Elasticidad rápida', 'Servicio medido: se paga por lo usado', 'Instalación obligatoria en el edificio del cliente', 'Uso exclusivo de cable de cobre', 'Un solo cliente por proveedor'], [0, 1], 'Entre las características de la nube están la elasticidad y el servicio medido, junto con el autoservicio, el acceso por red y los recursos compartidos.'),
        op('Una organización exige, por ley, que ciertos datos nunca salgan de sus propias instalaciones. ¿Qué opción cumple ese requisito por sí sola?', ['SaaS en nube pública', 'Servidores locales (on-premises)', 'PaaS en nube pública', 'Una extranet'], 1, 'Solo con infraestructura en sus propias instalaciones los datos permanecen físicamente dentro. Los modelos de nube pública los llevan a centros de datos del proveedor.'),
        op('En un servicio SaaS de correo, ¿de quién es la responsabilidad de dar de baja la cuenta de un empleado que dejó la empresa?', ['Del proveedor de la nube', 'Del cliente', 'Del proveedor de internet', 'De nadie: se borra sola'], 1, 'Por el modelo de responsabilidad compartida, las cuentas, los accesos y los datos son siempre del cliente, incluso en SaaS.'),
        op('¿Qué tecnología permite a un empleado remoto acceder de forma cifrada a los servidores internos de su empresa?', ['Una VPN', 'TFTP', 'Un hub', 'NTP'], 0, 'La VPN crea un túnel cifrado hasta la red de la empresa. TFTP copia archivos sin cifrar, el hub es un repetidor y NTP sincroniza la hora.'),
        op('Una empresa en la nube se queda sin conexión a Internet en su oficina durante dos horas. ¿Qué consecuencia tiene para sus aplicaciones SaaS?', ['Siguen funcionando con normalidad en la oficina', 'No se pueden usar desde la oficina hasta que vuelva la conexión', 'Los datos se borran', 'El proveedor las traslada a los equipos locales'], 1, 'El punto débil de la nube es que depende de la conexión. Los datos siguen seguros en el proveedor, pero desde la oficina no se puede llegar a ellos.'),
        op('Un empleado remoto se queja de que el audio de sus videollamadas se corta, aunque las páginas web cargan bien. ¿Qué medidas de su conexión conviene revisar?', ['El jitter y la pérdida de paquetes', 'El tamaño del disco duro', 'La dirección MAC de su tarjeta', 'El nombre del equipo'], 0, 'La voz y el video en vivo son sensibles al jitter y a la pérdida; la navegación web, que usa TCP, los disimula.'),
        uni('tiempo', 80, 1200),
      ]),
    ],
  },
];
