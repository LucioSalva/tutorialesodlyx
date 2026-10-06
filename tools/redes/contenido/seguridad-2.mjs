// Seguridad de redes · lecciones 5 a 7: firewalls, seguridad inalámbrica y protección de los equipos de red.
import { h, h3, p, lista, orden, tabla, nota, codigo, ejemplo, ejercicios, op, vs, rel, ord } from './_ayuda.mjs';
import { cia, atq, pro, aaa } from './seguridad-1.mjs';

const P = 'permitir', D = 'denegar', X = 'cualquiera';
/** Firewall: reglas = [[acción, protocolo, origen, destino, puerto?], …]; paquete = [protocolo, origen, destino, puerto?]. */
export const fw = (reglas, [proto, o, d, puerto = 0]) => ({ tipo: 'sg-firewall',
  reglas: reglas.map(([a, pr, ro, rd, rp = 0]) => ({ a, proto: pr, o: ro, d: rd, puerto: rp })), paquete: { proto, o, d, puerto } });
export const wf = (lugar, individual, antiguos) => ({ tipo: 'sg-wifi', lugar, individual, antiguos });
export const end = (caso, extra = {}) => ({ tipo: 'sg-endurecer', caso, clave: 'R3d-Segura', usuario: 'admin', min: 5, max: 2, ...extra });

const LAN = '192.168.10.0/24', LAN2 = '192.168.20.0/24', SRV = '10.0.5.0/24', WEB = '10.0.5.10/32', RDP = '10.0.5.20/32';

export default [
  /* ------------------------------------------------------------------ 5 */
  {
    slug: 'firewalls-y-filtrado',
    titulo: 'Firewalls: cómo se filtra el tráfico',
    resumen: 'Qué es un firewall, cómo lee sus reglas de arriba abajo, la denegación implícita, la diferencia entre filtrar con y sin estado, y cómo un firewall cambia el resultado de un ping.',
    nivel: 'medio',
    objetivos: [
      'Explicar qué decide un firewall y con qué datos del paquete lo decide.',
      'Leer una lista de reglas y predecir si un paquete se permite o se deniega.',
      'Diferenciar filtrado sin estado y con estado, firewall de host y de red, IDS e IPS.',
      'Reconocer cuándo un fallo de conectividad se debe a un firewall.',
    ],
    bloques: [
      h('El guardia de la puerta'),
      p(`Un **firewall** (cortafuegos) es un dispositivo o un programa que se coloca **entre dos redes** y decide, paquete por paquete, qué pasa y qué no. Es el guardia de la entrada de un edificio: tiene una lista de instrucciones, mira la identificación de quien llega y lo deja pasar o lo detiene.`),
      p(`Su sitio más habitual es la frontera entre la **red interna** (de confianza) e **Internet** (sin confianza). Pero también hay firewalls entre partes de la misma red, por ejemplo entre las computadoras de oficina y los servidores.`),
      nota('clave', `Un firewall **no** es un antivirus. El firewall controla **qué conexiones** se permiten; el antivirus analiza **qué contienen** los archivos. Se complementan: son dos capas distintas de la defensa en profundidad.`),

      h('En qué se fija una regla'),
      p(`Cada **regla** del firewall describe un tipo de tráfico y dice qué hacer con él. Los datos que mira están en las cabeceras del paquete, los mismos que ya conoces:`),
      tabla(['Criterio', 'Qué es', 'Ejemplo'], [
        ['**Acción**', 'Qué se hace si la regla coincide', 'Permitir o denegar'],
        ['**Protocolo**', 'TCP, UDP, ICMP… o «IP» para cualquiera', 'TCP'],
        ['**Origen**', 'De qué dirección o red viene', '192.168.10.0/24'],
        ['**Destino**', 'A qué dirección o red va', 'El servidor 10.0.5.10'],
        ['**Puerto de destino**', 'A qué servicio va (solo TCP y UDP)', '443 = HTTPS'],
      ]),
      p(`Para que una regla **coincida** con un paquete tienen que cumplirse **todos** sus criterios a la vez. Si falla uno solo, esa regla no se aplica y el firewall pasa a la siguiente.`),
      p(`Recuerda del subneteo: \`192.168.10.0/24\` abarca todas las direcciones de \`192.168.10.0\` a \`192.168.10.255\`. Una regla con ese origen coincide con cualquier equipo de esa red. «Cualquiera» coincide con todas las direcciones.`),

      h('Las tres reglas de oro'),
      orden(
        'Las reglas se leen **de arriba abajo**, en orden.',
        'Se aplica la **primera que coincide** y el firewall **deja de leer**. Lo que haya debajo no importa para ese paquete.',
        'Si **ninguna** coincide, el paquete se **deniega**. Al final de toda lista hay una regla invisible que lo bloquea todo: la **denegación implícita**.',
      ),
      nota('clave', `La denegación implícita es la razón de que un firewall sea seguro por defecto: **lo que no está permitido expresamente, está prohibido**. Por eso las listas se escriben pensando en «qué necesito permitir», no en «qué quiero prohibir».`),
      ejemplo('facil', 'La primera regla coincide', fw([[P, 'tcp', LAN, X, 443], [P, 'tcp', LAN, X, 80], [D, 'ip', X, X]], ['tcp', '192.168.10.25', '203.0.113.50', 443])),
      ejemplo('facil', 'Ninguna regla coincide', fw([[P, 'tcp', LAN, X, 443], [P, 'udp', LAN, X, 53]], ['icmp', '192.168.10.25', '198.51.100.8']), 'Nadie escribió «denegar ICMP», y aun así el ping no pasa. Es el caso más frecuente de «el ping no funciona pero la página sí abre».'),

      h('El orden importa'),
      p(`Como el firewall se detiene en la primera coincidencia, una regla general colocada arriba puede **tapar** a una regla específica que esté debajo. La de abajo nunca llega a leerse.`),
      ejemplo('medio', 'Una regla tapada', fw([[D, 'ip', LAN2, SRV], [P, 'tcp', '192.168.20.15/32', WEB, 22]], ['tcp', '192.168.20.15', '10.0.5.10', 22]), 'El administrador quería una excepción para un equipo, pero la puso debajo de la prohibición general: la excepción no sirve.'),
      ejemplo('medio', 'El mismo caso, bien ordenado', fw([[P, 'tcp', '192.168.20.15/32', WEB, 22], [D, 'ip', LAN2, SRV]], ['tcp', '192.168.20.15', '10.0.5.10', 22])),
      nota('truco', `Regla práctica: **de lo más específico a lo más general**. Primero las excepciones (un equipo, un puerto), después las reglas amplias (una red entera), y al final, si se quiere dejar explícito, un «denegar todo».`),
      ejemplo('medio', 'El puerto no coincide', fw([[P, 'tcp', X, WEB, 443], [P, 'tcp', LAN, WEB, 22], [D, 'tcp', X, SRV]], ['tcp', '203.0.113.9', '10.0.5.10', 22]), 'Desde Internet se puede ver la página web del servidor (443), pero no administrarlo por SSH: eso solo se permite desde la red interna.'),
      ejemplo('dificil', 'Media red sí y media red no', fw([[P, 'tcp', '192.168.30.0/25', RDP, 3389], [D, 'tcp', '192.168.30.0/24', RDP, 3389], [P, 'ip', '192.168.30.0/24', X]], ['tcp', '192.168.30.200', '10.0.5.20', 3389]), 'La red /25 solo abarca de 192.168.30.0 a 192.168.30.127. El equipo .200 queda fuera de la primera regla y cae en la segunda.'),

      h('Puertos y protocolos que se bloquean'),
      p(`Muchas reglas se escriben por **puerto**, porque el puerto identifica al servicio. Estos son los que más aparecen en reglas y en preguntas de examen:`),
      tabla(['Puerto', 'Protocolo', 'Servicio', 'Regla habitual'], [
        ['22', 'TCP', 'SSH', 'Permitir solo desde la red de administración'],
        ['23', 'TCP', 'Telnet', '**Denegar siempre**: no cifra'],
        ['25', 'TCP', 'SMTP (envío de correo)', 'Permitir solo al servidor de correo'],
        ['53', 'UDP y TCP', 'DNS', 'Permitir hacia los servidores DNS'],
        ['80', 'TCP', 'HTTP', 'Permitir de salida; hoy casi todo redirige a 443'],
        ['443', 'TCP', 'HTTPS', 'Permitir de salida y hacia el servidor web propio'],
        ['3389', 'TCP', 'RDP (escritorio remoto)', 'Nunca abierto a Internet; solo por VPN'],
        ['—', 'ICMP', 'ping, traceroute', 'A menudo limitado o bloqueado'],
      ]),

      h('Sin estado y con estado'),
      p(`Hay dos formas de filtrar, y la diferencia es si el firewall **recuerda** o no las conversaciones.`),
      tabla(['', 'Sin estado (filtrado de paquetes)', 'Con estado (*stateful*)'], [
        ['Cómo decide', 'Mira cada paquete **por separado**', 'Recuerda las **conexiones** abiertas en una tabla de estado'],
        ['Las respuestas', 'Hace falta una regla aparte para dejarlas volver', 'Vuelven solas: pertenecen a una conexión que ya permitió'],
        ['Seguridad', 'Menor: es fácil dejar huecos', 'Mayor: solo entra lo que alguien de dentro pidió'],
        ['Ejemplo', 'Una ACL sencilla en un router', 'El firewall de un router doméstico, Windows Defender Firewall'],
      ]),
      p(`Piensa en el guardia de un edificio. El guardia **sin estado** revisa a cada persona con su lista, sin recordar nada: si saliste a comer, al volver te trata como a un desconocido. El guardia **con estado** apunta quién salió y deja volver a esa persona sin preguntar; a un extraño que nadie espera lo detiene.`),
      p(`Por eso en casa puedes navegar sin abrir ningún puerto: tu equipo **inicia** la conexión hacia el servidor web, el firewall del router lo anota, y la respuesta entra porque pertenece a esa conexión. En cambio, una conexión **iniciada desde Internet** hacia tu red se descarta, porque nadie de dentro la pidió.`),
      ejemplo('medio', 'La respuesta que vuelve sola', op('En una oficina, el firewall con estado solo tiene una regla: «permitir TCP de la red interna hacia cualquiera, puerto 443». No hay ninguna regla de entrada. Una empleada abre un sitio HTTPS. ¿Llegan las respuestas del servidor web?', ['No: falta una regla que permita el tráfico de entrada desde el puerto 443', 'Sí: el firewall recuerda la conexión saliente y deja pasar sus respuestas', 'Solo si el servidor web está en la misma red', 'Solo la primera respuesta'], 1, [
        'La petición sale de la red interna hacia el puerto 443: coincide con la regla y se permite.',
        'Al ser un firewall **con estado**, anota esa conexión en su tabla: origen, destino y puertos.',
        'Cuando llega la respuesta del servidor, el firewall ve que pertenece a una conexión ya permitida y la deja entrar sin necesidad de otra regla.',
        'Con un filtro **sin estado** sí haría falta una regla de entrada para las respuestas.',
      ])),

      h('Tipos de firewall'),
      tabla(['Tipo', 'Dónde está', 'Qué protege'], [
        ['**De red**', 'Un equipo dedicado en la frontera de la red', 'A toda la red que tiene detrás'],
        ['**De host**', 'Un programa en cada computadora o servidor', 'Solo a ese equipo, también frente a su propia red local'],
        ['**De nueva generación (NGFW)**', 'En la frontera, como el de red', 'Además de puertos, reconoce **aplicaciones**, usuarios y contenido, e incluye prevención de intrusiones'],
      ]),
      p(`Lo recomendable es tener los dos primeros a la vez. El firewall de red no ve el tráfico entre dos computadoras de la misma oficina; el de host sí. Windows trae **Windows Defender Firewall**, y en Linux se usan \`ufw\`, \`firewalld\` o \`nftables\`.`),

      h3('La DMZ'),
      p(`Una **DMZ** (zona desmilitarizada) es una red intermedia donde se colocan los servidores que deben ser **accesibles desde Internet**: el servidor web, el de correo. Si un atacante compromete uno, queda encerrado en la DMZ y no dentro de la red interna.`),
      tabla(['Desde', 'Hacia', '¿Se permite?'], [
        ['Internet', 'DMZ', 'Solo a los servicios publicados (por ejemplo, 443)'],
        ['Internet', 'Red interna', 'No'],
        ['Red interna', 'DMZ e Internet', 'Sí, lo necesario'],
        ['DMZ', 'Red interna', 'No, o solo lo mínimo imprescindible'],
      ]),

      h3('ACL, IDS e IPS'),
      tabla(['Sigla', 'Qué es', 'Qué hace'], [
        ['**ACL**', 'Lista de control de acceso', 'La lista de reglas permitir/denegar de un router o switch. Es la forma más simple de filtrado.'],
        ['**IDS**', 'Sistema de **detección** de intrusiones', 'Observa una copia del tráfico y **avisa** si ve algo sospechoso. No bloquea.'],
        ['**IPS**', 'Sistema de **prevención** de intrusiones', 'Está en el camino del tráfico y **bloquea** lo malicioso.'],
      ]),
      nota('truco', `IDS = **D**etecta y avisa (una alarma). IPS = **P**reviene, es decir, bloquea (un guardia). Las ACL de Cisco también terminan con una denegación implícita, igual que cualquier firewall.`),

      h('Cuando el firewall confunde el diagnóstico'),
      p(`Un técnico de soporte se encuentra con firewalls todos los días, casi siempre sin saberlo. Estas son las situaciones típicas, y conviene reconocerlas antes de dar un equipo por «caído»:`),
      tabla(['Síntoma', 'Explicación probable'], [
        ['El ping a un equipo Windows falla, pero sus carpetas compartidas funcionan', 'El firewall de Windows bloquea por defecto los ping entrantes. El equipo está bien.'],
        ['El ping a un servidor funciona, pero la aplicación no conecta', 'El firewall permite ICMP y bloquea el **puerto** de la aplicación.'],
        ['`tracert` muestra asteriscos (`* * *`) en algunos saltos y aun así llega al destino', 'Esos routers no responden a ICMP por política. No es una avería.'],
        ['La conexión «se queda esperando» hasta que caduca', 'Un firewall **descarta** el paquete en silencio.'],
        ['La conexión se rechaza al instante («connection refused»)', 'El equipo responde, pero no hay nada escuchando en ese puerto (o el firewall lo rechaza activamente).'],
        ['Funciona con el cable en la oficina y falla desde el Wi-Fi de invitados', 'Hay reglas distintas para cada red.'],
      ]),
      nota('aviso', `**Que el ping falle no demuestra que el equipo esté apagado**, y que el ping funcione no demuestra que el servicio funcione. El ping usa ICMP; las aplicaciones usan puertos TCP o UDP, y cada cosa tiene sus propias reglas. Para probar un puerto concreto se usa, por ejemplo, \`Test-NetConnection servidor -Port 443\` en PowerShell.`),
      codigo('Probar un puerto desde Windows (PowerShell)', `PS C:\\> Test-NetConnection 10.0.5.10 -Port 443

ComputerName     : 10.0.5.10
RemoteAddress    : 10.0.5.10
RemotePort       : 443
InterfaceAlias   : Ethernet
SourceAddress    : 192.168.10.25
TcpTestSucceeded : True

PS C:\\> Test-NetConnection 10.0.5.10 -Port 22
ADVERTENCIA: TCP connect to (10.0.5.10 : 22) failed

PingSucceeded    : True
TcpTestSucceeded : False`),
      p(`En esa salida, el servidor responde al ping y acepta conexiones en el 443, pero no en el 22: el equipo está encendido y lo que falla es **ese puerto**, por un firewall o porque el servicio SSH no está activo.`),
      ejemplo('dificil', 'Ping sí, aplicación no', op('Un usuario no puede abrir el sistema de facturación, que está en `https://10.0.5.10`. Desde su equipo, `ping 10.0.5.10` responde sin pérdidas. Los compañeros de otra VLAN sí pueden entrar. ¿Cuál es la causa más probable?', ['El servidor está apagado', 'El cable de red del usuario está dañado', 'Una regla de firewall bloquea el puerto 443 desde la red del usuario', 'El servidor DNS no resuelve el nombre'], 2, [
        'El ping funciona: hay conectividad IP entre el usuario y el servidor. Eso descarta el cable y el servidor apagado.',
        'Se usa la dirección IP directamente, así que el DNS no interviene.',
        'Los compañeros de otra VLAN sí entran: el servicio funciona. La diferencia entre ellos y el usuario es **la red de origen**.',
        'Lo que encaja con todo es una regla que permite ICMP pero no TCP 443 desde esa red. Se escala a quien administra el firewall, con estos datos en el ticket.',
      ])),

      h('Resumen'),
      lista(
        'Un firewall decide por acción, protocolo, origen, destino y puerto.',
        'Lee de arriba abajo, aplica la primera coincidencia y termina con una denegación implícita.',
        'Las reglas específicas van arriba; las generales, abajo.',
        'Con estado: recuerda las conexiones y deja volver las respuestas.',
        'De red protege a toda la red; de host, a un equipo. Lo ideal es tener ambos.',
        'IDS detecta; IPS bloquea. La DMZ aísla los servidores públicos.',
        'Un ping que falla puede ser solo un firewall.',
      ),

      ejercicios('Practica: lee las reglas', 'Compara el paquete con cada regla en orden. Tienen que coincidir todos los criterios.', [
        fw([[P, 'tcp', LAN, X, 443], [P, 'udp', LAN, X, 53], [D, 'ip', X, X]], ['udp', '192.168.10.77', '198.51.100.53', 53]),
        fw([[P, 'tcp', LAN, X, 443], [P, 'udp', LAN, X, 53], [D, 'ip', X, X]], ['tcp', '192.168.10.77', '203.0.113.20', 23]),
        fw([[D, 'tcp', X, X, 23], [P, 'tcp', LAN, SRV], [P, 'icmp', LAN, X]], ['tcp', '192.168.10.40', '10.0.5.10', 23]),
        fw([[D, 'tcp', X, X, 23], [P, 'tcp', LAN, SRV], [P, 'icmp', LAN, X]], ['tcp', '192.168.10.40', '10.0.5.10', 22]),
        fw([[D, 'tcp', X, X, 23], [P, 'tcp', LAN, SRV], [P, 'icmp', LAN, X]], ['icmp', '192.168.20.40', '10.0.5.10']),
        fw([[P, 'tcp', X, WEB, 443], [P, 'tcp', X, WEB, 80], [D, 'ip', X, SRV]], ['tcp', '203.0.113.200', '10.0.5.10', 80]),
        fw([[P, 'tcp', X, WEB, 443], [P, 'tcp', X, WEB, 80], [D, 'ip', X, SRV]], ['tcp', '203.0.113.200', '10.0.5.20', 443]),
        fw([[P, 'ip', LAN, X], [D, 'tcp', '192.168.10.50/32', X, 3389]], ['tcp', '192.168.10.50', '10.0.5.20', 3389]),
        fw([[D, 'tcp', '192.168.10.50/32', X, 3389], [P, 'ip', LAN, X]], ['tcp', '192.168.10.50', '10.0.5.20', 3389]),
        fw([[P, 'tcp', '192.168.10.0/25', WEB, 22], [D, 'tcp', LAN, WEB, 22], [P, 'tcp', LAN, WEB, 443]], ['tcp', '192.168.10.100', '10.0.5.10', 22]),
        fw([[P, 'tcp', '192.168.10.0/25', WEB, 22], [D, 'tcp', LAN, WEB, 22], [P, 'tcp', LAN, WEB, 443]], ['tcp', '192.168.10.130', '10.0.5.10', 22]),
        fw([[P, 'udp', LAN, '10.0.5.53/32', 53], [P, 'udp', LAN2, '10.0.5.53/32', 53], [P, 'tcp', LAN, X, 443], [D, 'icmp', X, X]], ['udp', '192.168.30.9', '10.0.5.53', 53]),
        fw([[D, 'icmp', X, SRV], [P, 'ip', LAN, SRV], [P, 'tcp', LAN2, WEB, 443]], ['icmp', '192.168.10.8', '10.0.5.10']),
        fw([[D, 'icmp', X, SRV], [P, 'ip', LAN, SRV], [P, 'tcp', LAN2, WEB, 443]], ['udp', '192.168.10.8', '10.0.5.10', 161]),
      ]),
      ejercicios('Practica: conceptos de firewall', 'Preguntas al estilo del examen.', [
        op('¿Qué ocurre con un paquete que no coincide con ninguna regla del firewall?', ['Se permite, porque nadie lo prohibió', 'Se deniega por la denegación implícita', 'Se devuelve al origen cifrado', 'Se guarda hasta que se cree una regla'], 1, 'Toda lista termina con una regla invisible que lo deniega todo. Lo que no está permitido expresamente, está prohibido.'),
        op('Un firewall tiene arriba «denegar todo el tráfico de la red 192.168.5.0/24» y debajo «permitir a 192.168.5.10 el puerto 443». ¿Puede 192.168.5.10 navegar por HTTPS?', ['Sí, porque la segunda regla es más específica', 'No, porque la primera regla coincide antes y el firewall deja de leer', 'Sí, pero solo media hora', 'Depende del navegador'], 1, 'Gana la primera coincidencia, no la más específica. Para que la excepción funcione debe ir arriba.'),
        op('¿Qué ventaja tiene un firewall con estado sobre un filtro de paquetes sin estado?', ['Es más barato', 'Recuerda las conexiones y permite automáticamente sus respuestas', 'No necesita reglas', 'Cifra el tráfico'], 1, 'La tabla de estado le permite distinguir una respuesta esperada de un paquete que nadie pidió.'),
        vs('¿Cuáles **dos** datos del paquete usa un firewall básico para decidir?', ['La dirección IP de origen', 'El nombre del usuario que escribió el mensaje', 'El puerto de destino', 'El color del cable', 'La marca de la tarjeta de red'], [0, 2], 'Las reglas básicas se escriben con direcciones IP, protocolo y puertos. El usuario y la aplicación solo los reconoce un firewall de nueva generación.'),
        rel('Relaciona cada elemento con su función.', [['IDS', 'Detecta actividad sospechosa y avisa'], ['IPS', 'Detecta actividad sospechosa y la bloquea'], ['DMZ', 'Red intermedia para servidores accesibles desde Internet'], ['Firewall de host', 'Filtra el tráfico de un solo equipo']], 'IDS avisa, IPS bloquea, la DMZ aísla lo público y el firewall de host protege al propio equipo.', ['Asigna direcciones IP automáticamente']),
        op('`ping 192.168.1.30` falla, pero puedes abrir las carpetas compartidas de ese mismo equipo Windows. ¿Qué explica mejor esto?', ['El equipo está apagado', 'El firewall del equipo bloquea las peticiones de eco ICMP entrantes', 'La máscara de subred es incorrecta', 'El cable está mal crimpado'], 1, 'Windows bloquea por defecto los ping entrantes en redes públicas. Si las carpetas funcionan, la conectividad es correcta.'),
        op('¿Qué puerto debería bloquear un firewall para impedir la administración remota sin cifrar de los switches?', ['22', '23', '443', '53'], 1, 'El 23 es Telnet, que envía todo en texto claro. El 22 es SSH, la alternativa segura.'),
        op('¿Dónde se coloca el servidor web público de una empresa?', ['En la red interna, junto a las computadoras de los empleados', 'En la DMZ', 'Conectado directamente a Internet sin firewall', 'En la red de invitados del Wi-Fi'], 1, 'En la DMZ es alcanzable desde Internet, pero si lo comprometen no da acceso directo a la red interna.'),
        op('Un intento de conexión se queda esperando 20 segundos y termina con «tiempo de espera agotado». ¿Qué sugiere?', ['Que un firewall descarta el paquete sin responder', 'Que la contraseña es incorrecta', 'Que el servicio respondió con un rechazo', 'Que el certificado caducó'], 0, 'Descartar en silencio produce esperas largas. Un rechazo activo o un puerto cerrado responde al instante.'),
        vs('¿Cuáles **dos** afirmaciones sobre un firewall de nueva generación (NGFW) son correctas?', ['Puede identificar la aplicación, no solo el puerto', 'Solo funciona con IPv6', 'Suele incluir prevención de intrusiones', 'Sustituye a las copias de seguridad', 'No necesita reglas'], [0, 2], 'Un NGFW añade reconocimiento de aplicaciones, de usuarios y funciones de IPS al filtrado clásico.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 6 */
  {
    slug: 'seguridad-inalambrica',
    titulo: 'Seguridad inalámbrica: de WEP a WPA3',
    resumen: 'Por qué una red Wi-Fi necesita cifrado, las cuatro generaciones de seguridad, Personal contra Enterprise y cómo dejar bien configurado un router doméstico, paso a paso.',
    nivel: 'medio',
    objetivos: [
      'Ordenar WEP, WPA, WPA2 y WPA3 de menor a mayor seguridad y decir qué usa cada uno.',
      'Elegir entre modo Personal y modo Enterprise según la situación.',
      'Configurar la seguridad básica de un router doméstico.',
      'Explicar por qué ocultar el SSID y filtrar por MAC no son protección suficiente.',
    ],
    bloques: [
      h('El aire no tiene paredes'),
      p(`En una red cableada, para capturar el tráfico hay que entrar al edificio y conectarse a un puerto. En una red **inalámbrica** las tramas viajan por **ondas de radio**, que atraviesan paredes y llegan a la calle, al estacionamiento y al vecino. Cualquiera con una antena puede **recibir** esas señales.`),
      p(`Por eso la seguridad inalámbrica tiene que resolver dos cosas que el cable da casi gratis:`),
      lista(
        '**Autenticación**: que solo se conecten los equipos autorizados.',
        '**Cifrado**: que quien capture las ondas no pueda leer nada.',
      ),
      nota('aviso', `Una red **abierta** (sin contraseña) no cifra. Todo lo que no vaya protegido por otra capa, como HTTPS o una VPN, lo puede leer cualquiera que esté cerca. En una Wi-Fi pública, usa siempre una VPN o limítate a sitios HTTPS.`),

      h('Cuatro generaciones'),
      tabla(['Estándar', 'Año', 'Cifrado', 'Estado', 'Veredicto'], [
        ['**WEP**', '1997', 'RC4 con clave fija', 'Roto: se descifra en minutos', '**No usar nunca**'],
        ['**WPA**', '2003', 'TKIP (un parche sobre RC4)', 'Obsoleto', 'No usar'],
        ['**WPA2**', '2004', '**AES** (CCMP)', 'Seguro con una clave fuerte', 'Mínimo aceptable'],
        ['**WPA3**', '2018', 'AES, con intercambio **SAE**', 'El estándar actual', '**La mejor opción**'],
      ]),
      p(`La historia explica los nombres. **WEP** se diseñó mal y se rompió pronto. **WPA** fue una solución de emergencia que funcionaba en el mismo hardware, con un cifrado provisional llamado TKIP. **WPA2** trajo el cifrado definitivo, AES. Y **WPA3** corrigió la debilidad que le quedaba a WPA2.`),
      h3('Qué mejora WPA3'),
      p(`En WPA2-Personal, si un atacante captura el momento en que un equipo se conecta, puede llevarse esa captura a su casa y probar millones de contraseñas sin prisa (un ataque de diccionario «fuera de línea»). Si la clave es débil, la encuentra.`),
      p(`WPA3-Personal sustituye ese intercambio por **SAE** (*Simultaneous Authentication of Equals*). Con SAE, cada intento de adivinar la clave exige hablar con el punto de acceso, así que no se pueden probar millones de claves en privado. Además:`),
      lista(
        'Aunque alguien descubra la clave en el futuro, **no puede descifrar** el tráfico que capturó antes.',
        'Protege las tramas de gestión, lo que impide desconectar a la fuerza a los clientes.',
        'Es **obligatorio** en la banda de 6 GHz (Wi-Fi 6E).',
      ),
      nota('truco', `Para el examen, memoriza las parejas: **WEP → RC4**, **WPA → TKIP**, **WPA2 → AES (CCMP)**, **WPA3 → SAE**. Y el orden de seguridad: WEP < WPA < WPA2 < WPA3.`),
      p(`Los routers ofrecen un **modo mixto o de transición WPA2/WPA3**: los equipos nuevos se conectan con WPA3 y los antiguos con WPA2. Es la opción práctica cuando hay algún dispositivo que no soporta WPA3. Lo que nunca debe elegirse es un modo que incluya WEP, WPA o TKIP.`),

      h('Personal o Enterprise'),
      p(`Tanto WPA2 como WPA3 tienen dos modos. La diferencia no es el cifrado, sino **cómo se autentica** cada usuario.`),
      tabla(['', 'Personal (PSK / SAE)', 'Enterprise (802.1X)'], [
        ['Cómo se entra', 'Con **una clave compartida** por todos', 'Cada persona con **su usuario y contraseña** (o su certificado)'],
        ['Qué hace falta', 'Solo el router o punto de acceso', 'Un **servidor RADIUS** y un directorio de usuarios'],
        ['Dar de baja a alguien', 'Cambiar la clave en todos los equipos', 'Desactivar su cuenta'],
        ['Saber quién se conectó', 'Imposible: todos usan la misma clave', 'Sí: queda registro por usuario'],
        ['Ideal para', 'Casa, oficina pequeña', 'Empresas, escuelas, hospitales'],
      ]),
      p(`**PSK** significa *Pre-Shared Key*, clave precompartida: la «contraseña del Wi-Fi» de toda la vida. En modo **Enterprise**, el punto de acceso no conoce ninguna contraseña: usa el estándar **802.1X** para pasar las credenciales a un servidor **RADIUS**, que las comprueba contra el directorio (por ejemplo, Active Directory). Es el modelo AAA de la lección 3 aplicado al Wi-Fi.`),
      ejemplo('facil', 'Una casa con equipos nuevos', wf('casa', false, false)),
      ejemplo('medio', 'Una oficina con una impresora antigua', wf('despacho', false, true)),
      ejemplo('medio', 'Una empresa grande', wf('empresa', true, false)),
      ejemplo('dificil', 'Un hospital con equipos de varias épocas', wf('hospital', true, true)),

      h('Configurar un router doméstico, paso a paso'),
      p(`Este es el recorrido que el examen llama «configurar la seguridad inalámbrica básica en un router doméstico». Las pantallas cambian según la marca, pero los pasos son siempre los mismos.`),
      orden(
        '**Entra a la administración.** Conéctate al router (mejor por cable) y abre en el navegador su dirección, que suele ser la puerta de enlace: `192.168.0.1` o `192.168.1.1`.',
        '**Cambia la contraseña de administración.** La de fábrica (`admin` / `admin` o la impresa en la etiqueta) es pública. Es el paso más importante y el que más se olvida.',
        '**Actualiza el firmware.** Las actualizaciones corrigen fallos de seguridad. Activa la actualización automática si existe.',
        '**Cambia el SSID.** Pon un nombre que no revele la marca del router, tu apellido ni tu dirección.',
        '**Elige el modo de seguridad.** WPA3-Personal; si algún equipo no lo soporta, WPA2/WPA3 mixto; como mínimo, WPA2-Personal con AES. Nunca WEP, WPA ni TKIP.',
        '**Pon una clave fuerte.** Larga (mejor una frase de 15 caracteres o más) y distinta de la contraseña de administración.',
        '**Desactiva WPS.** El PIN de WPS se puede adivinar por fuerza bruta.',
        '**Crea una red de invitados.** Con su propia clave y aislada de tus equipos.',
        '**Desactiva la administración remota** desde Internet, si no la necesitas.',
        '**Guarda y comprueba** que tus dispositivos se conectan.',
      ),
      nota('clave', `No confundas las **dos contraseñas** de un router. La **clave del Wi-Fi** sirve para conectarse a la red. La **contraseña de administración** sirve para cambiar la configuración. Son distintas y las dos deben cambiarse.`),
      tabla(['Ajuste en el router', 'Valor recomendado'], [
        ['Modo de seguridad', 'WPA3-Personal (o WPA2/WPA3 mixto)'],
        ['Cifrado', 'AES (nunca TKIP)'],
        ['Clave de la red', 'Frase larga, de 15 caracteres o más'],
        ['WPS', 'Desactivado'],
        ['Red de invitados', 'Activada y aislada'],
        ['Administración remota', 'Desactivada'],
        ['Firmware', 'Actualizado'],
      ]),

      h3('La red de invitados'),
      p(`Una **red de invitados** es un segundo SSID con su propia clave que solo da salida a Internet. Los equipos conectados a ella **no pueden ver** tus computadoras, tu impresora ni tu almacenamiento en red. Es el lugar correcto para las visitas y también para los dispositivos poco fiables: cámaras, televisores y otros aparatos del Internet de las cosas que rara vez reciben actualizaciones.`),

      h3('Por qué desactivar WPS'),
      p(`**WPS** (*Wi-Fi Protected Setup*) permite conectar un equipo pulsando un botón o tecleando un **PIN de 8 dígitos**, sin escribir la clave. El problema es el PIN: por su diseño se comprueba en dos mitades, lo que reduce las combinaciones a unas 11,000, y un atacante cercano las prueba todas en horas. Al conseguir el PIN, obtiene la clave de la red, por larga que sea.`),

      h('Dos medidas que parecen seguras y no lo son'),
      tabla(['Medida', 'Qué hace', 'Por qué es débil'], [
        ['**Ocultar el SSID**', 'El router deja de anunciar el nombre de la red', 'El nombre sigue viajando en claro cada vez que un equipo se conecta. Se descubre en segundos con herramientas comunes.'],
        ['**Filtrado MAC**', 'Solo se aceptan equipos cuya dirección MAC está en una lista', 'Las MAC viajan sin cifrar y se pueden **copiar**: basta ver la de un equipo permitido y usar la misma.'],
      ]),
      p(`Ninguna de las dos **cifra** nada. Pueden usarse como complemento, pero jamás **en lugar** de WPA2 o WPA3: dan trabajo de mantenimiento y una falsa sensación de seguridad. Además, ocultar el SSID hace que tus dispositivos vayan preguntando por esa red allá donde estén.`),
      ejemplo('medio', 'La red «invisible»', op('Un cliente dice: «Mi Wi-Fi es segura: está abierta, pero oculté el nombre y solo dejo entrar a las direcciones MAC de mis equipos». ¿Qué le respondes?', ['Que es una configuración muy segura', 'Que no es segura: el tráfico viaja sin cifrar y tanto el SSID como las MAC se pueden descubrir y copiar', 'Que solo le falta cambiar de canal', 'Que debería activar WEP para reforzarla'], 1, [
        'La red está **abierta**: no hay cifrado. Cualquiera en el alcance puede capturar y leer el tráfico que no vaya por HTTPS.',
        'El SSID oculto se revela cada vez que un equipo legítimo se conecta, y las direcciones MAC permitidas aparecen en esas mismas tramas. Un intruso copia una MAC válida y entra.',
        'La solución real es activar **WPA2 o WPA3** con una clave fuerte. WEP no sirve: está roto.',
      ])),
      ejemplo('medio', 'El botón cómodo', op('Al revisar un router doméstico ves: WPA2-Personal con AES, clave de 20 caracteres, firmware actualizado y WPS activado. ¿Qué cambiarías primero?', ['Nada: la configuración es correcta', 'Desactivar WPS', 'Cambiar AES por TKIP', 'Acortar la clave para que sea más fácil de recordar'], 1, [
        'El modo, el cifrado, la clave y el firmware están bien.',
        'El punto débil es **WPS**: su PIN de 8 dígitos se puede adivinar por fuerza bruta, y con él se obtiene la clave de la red sin importar su longitud.',
        'Cambiar a TKIP o acortar la clave empeoraría la seguridad.',
      ])),

      h('Resumen'),
      lista(
        'WEP (RC4) y WPA (TKIP): no usar. WPA2 (AES): mínimo. WPA3 (SAE): lo mejor.',
        'Personal: una clave compartida. Enterprise: cuentas individuales con 802.1X y RADIUS.',
        'En un router doméstico: cambiar la contraseña de administración, WPA3 o WPA2 con AES, clave larga, WPS apagado, red de invitados, firmware al día.',
        'Ocultar el SSID y filtrar por MAC no sustituyen al cifrado.',
      ),

      ejercicios('Practica: elige el modo', 'Dos decisiones: ¿clave compartida o cuentas individuales? ¿Todos los equipos soportan WPA3?', [
        wf('cafeteria', false, false), wf('consultorio', false, true), wf('universidad', true, false), wf('corporativo', true, true), wf('casa', false, true), wf('empresa', true, true),
      ]),
      ejercicios('Practica: seguridad inalámbrica', 'Preguntas al estilo del examen.', [
        ord('Ordena los estándares de menor a mayor seguridad.', ['WEP', 'WPA', 'WPA2', 'WPA3'], 'Es también su orden cronológico: 1997, 2003, 2004 y 2018.'),
        rel('Relaciona cada estándar con el mecanismo que lo caracteriza.', [['WEP', 'RC4 con clave fija'], ['WPA', 'TKIP'], ['WPA2', 'AES-CCMP'], ['WPA3', 'SAE']], 'WEP usa RC4 mal implementado; WPA lo parchea con TKIP; WPA2 trae AES-CCMP; WPA3 añade el intercambio SAE.'),
        op('¿Qué necesita una red WPA2-Enterprise que no necesita una WPA2-Personal?', ['Una clave más larga', 'Un servidor RADIUS que autentique a cada usuario', 'Una antena adicional', 'Un canal de 5 GHz'], 1, 'Enterprise usa 802.1X: el punto de acceso delega la autenticación en un servidor RADIUS.'),
        op('Un router ofrece estos modos. ¿Cuál eliges para una casa donde todos los equipos son recientes?', ['WEP', 'WPA-Personal (TKIP)', 'WPA2-Personal (TKIP)', 'WPA3-Personal'], 3, 'WPA3-Personal es la opción más segura. TKIP y WEP están obsoletos.'),
        op('¿Por qué se recomienda desactivar WPS?', ['Porque hace más lenta la red', 'Porque su PIN se puede adivinar por fuerza bruta y revela la clave de la red', 'Porque es incompatible con WPA2', 'Porque consume más energía'], 1, 'El PIN de 8 dígitos se valida en dos mitades y solo tiene unas 11,000 combinaciones efectivas.'),
        vs('¿Cuáles **dos** medidas NO cifran el tráfico inalámbrico?', ['Ocultar el SSID', 'WPA2-Personal con AES', 'Filtrado por dirección MAC', 'WPA3-Personal', 'WPA2-Enterprise'], [0, 2], 'Ocultar el nombre y filtrar direcciones solo dificultan un poco la conexión; no protegen el contenido.'),
        op('¿Cuál es el primer cambio que debe hacerse en un router recién sacado de la caja?', ['Cambiar el canal', 'Cambiar la contraseña de administración de fábrica', 'Ocultar el SSID', 'Activar la administración remota'], 1, 'Las credenciales de fábrica son públicas. Quien entre a la administración controla toda la red.'),
        op('¿Para qué sirve la red de invitados?', ['Para que las visitas tengan Internet sin acceso a los equipos de la red principal', 'Para aumentar la velocidad', 'Para ampliar la cobertura', 'Para evitar tener que usar una clave'], 0, 'Es un segundo SSID aislado: solo da salida a Internet.'),
        op('¿Qué ventaja ofrece SAE (WPA3) frente a la clave precompartida de WPA2?', ['Permite claves más cortas sin riesgo alguno', 'Impide probar contraseñas fuera de línea a partir de una captura de la conexión', 'Elimina la necesidad de un router', 'Funciona sin cifrado'], 1, 'Con SAE, cada intento de adivinar la clave requiere interactuar con el punto de acceso, lo que hace inviable el ataque de diccionario fuera de línea.'),
        op('Un empleado deja una empresa que usa WPA2-Personal. ¿Qué hay que hacer para que ya no pueda conectarse?', ['Nada', 'Cambiar la clave y reconfigurar todos los equipos', 'Cambiar el SSID solamente', 'Reiniciar el punto de acceso'], 1, 'Con clave compartida no se puede revocar a una sola persona. Es el argumento principal a favor del modo Enterprise.'),
        vs('¿Cuáles **dos** afirmaciones sobre una red Wi-Fi abierta son correctas?', ['No cifra el tráfico entre el equipo y el punto de acceso', 'Es más segura que WPA2', 'Conviene usar una VPN al conectarse a ella', 'Impide los ataques de intermediario', 'Requiere un servidor RADIUS'], [0, 2], 'Sin cifrado, cualquiera cercano puede leer el tráfico; una VPN añade el cifrado que la red no da.'),
        atq('wifi-falso'),
        cia('c-vpn'),
        op('¿Qué cifrado debe seleccionarse en una red WPA2?', ['TKIP', 'AES', 'RC4', 'DES'], 1, 'AES (CCMP) es el cifrado propio de WPA2. TKIP se mantiene solo por compatibilidad y es inseguro.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 7 */
  {
    slug: 'proteger-los-dispositivos-de-red',
    titulo: 'Proteger switches y routers',
    resumen: 'Cómo endurecer un equipo de red: contraseñas con hash, SSH en lugar de Telnet, puertos sin uso apagados, seguridad de puerto, registros, copias de la configuración y qué hacer ante un incidente.',
    nivel: 'dificil',
    objetivos: [
      'Proteger el acceso a un equipo Cisco con contraseñas cifradas y cuentas locales.',
      'Sustituir Telnet por SSH y limitar las sesiones.',
      'Apagar puertos sin uso y explicar la seguridad de puerto.',
      'Describir el papel de syslog, NTP, las copias de configuración y el control de acceso a la red.',
    ],
    bloques: [
      h('Por qué los equipos de red son un objetivo'),
      p(`Por un switch o un router pasa **todo** el tráfico de la organización. Quien lo controla puede leer conversaciones, desviar tráfico, cambiar VLAN o dejar a todos sin servicio. Y sin embargo, muchos se instalan y se olvidan, con la configuración de fábrica.`),
      p(`**Endurecer** (en inglés *hardening*) un equipo es cerrar todo lo que no se necesita y proteger lo que sí. No es una sola acción, sino una lista de comprobación. Esta lección recorre esa lista con comandos de Cisco IOS.`),

      h('Las puertas de entrada a un equipo'),
      tabla(['Acceso', 'Cómo es', 'Línea en IOS'], [
        ['**Consola**', 'Un cable directo al puerto de consola. Exige estar junto al equipo.', '`line console 0`'],
        ['**Remoto (VTY)**', 'Una sesión por la red: Telnet o SSH.', '`line vty 0 4` (o `0 15`)'],
        ['**Modo privilegiado**', 'El paso de `Switch>` a `Switch#` con `enable`.', '—'],
      ]),
      p(`Las tres deben pedir contraseña. De fábrica, ninguna la pide.`),

      h('Contraseñas: secret, no password'),
      p(`IOS tiene dos formas de guardar la contraseña del modo privilegiado, y la diferencia es de examen:`),
      tabla(['Comando', 'Cómo se guarda', '¿Usarlo?'], [
        ['`enable password CLAVE`', 'En **texto claro** en la configuración', 'No'],
        ['`enable secret CLAVE`', 'Como un **hash**: no se puede leer', '**Sí**'],
      ]),
      codigo('Proteger el modo privilegiado y crear una cuenta', `Switch> enable
Switch# configure terminal
Switch(config)# enable secret R3d-Segura
Switch(config)# username admin secret Acces0-9
Switch(config)# service password-encryption`),
      p(`\`username … secret\` crea una **cuenta local**: así cada administrador entra con su propio usuario, lo que permite saber quién hizo qué. \`service password-encryption\` ofusca las contraseñas que hayan quedado en texto claro para que no se lean a simple vista en \`show running-config\`; es un cifrado débil, útil solo contra miradas por encima del hombro.`),
      ejemplo('facil', 'La contraseña del modo privilegiado', end('secret')),
      ejemplo('facil', 'Una cuenta por administrador', end('usuario', { usuario: 'soporte', clave: 'Tunel-47' })),

      h('SSH en lugar de Telnet'),
      p(`**Telnet** (puerto 23) envía todo en texto claro, también el usuario y la contraseña. **SSH** (puerto 22) cifra la sesión completa. Esto es lo que vería alguien que capturara las dos sesiones con Wireshark:`),
      codigo('La misma sesión capturada en la red', `--- Telnet (puerto 23): se lee todo ---
Username: admin
Password: Acces0-9
Switch> enable

--- SSH (puerto 22): solo se ve tráfico cifrado ---
SSHv2  Encrypted packet (len=64)
SSHv2  Encrypted packet (len=48)
SSHv2  Encrypted packet (len=112)`),
      p(`Configurar SSH en un equipo Cisco requiere cinco cosas: un nombre de equipo, un nombre de dominio, un par de claves RSA, una cuenta local y decirle a las líneas VTY que solo acepten SSH.`),
      codigo('Activar SSH y cerrar Telnet', `Switch(config)# hostname SW-PISO1
SW-PISO1(config)# ip domain-name empresa.example
SW-PISO1(config)# crypto key generate rsa
How many bits in the modulus [512]: 2048
SW-PISO1(config)# ip ssh version 2
SW-PISO1(config)# username admin secret Acces0-9
SW-PISO1(config)# line vty 0 4
SW-PISO1(config-line)# transport input ssh
SW-PISO1(config-line)# login local
SW-PISO1(config-line)# exec-timeout 5 0`),
      tabla(['Comando', 'Para qué'], [
        ['`crypto key generate rsa`', 'Crea el par de claves que SSH usa para cifrar. Se recomiendan 2048 bits.'],
        ['`ip ssh version 2`', 'Desactiva la versión 1 de SSH, que es insegura.'],
        ['`transport input ssh`', 'Las líneas VTY aceptan **solo** SSH: Telnet queda rechazado.'],
        ['`login local`', 'Pide usuario y contraseña de las cuentas locales.'],
        ['`exec-timeout 5 0`', 'Cierra la sesión tras 5 minutos y 0 segundos sin actividad.'],
      ]),
      ejemplo('medio', 'Rechazar Telnet', end('ssh')),
      ejemplo('medio', 'Sesiones que no se quedan abiertas', end('espera', { min: 10 })),
      ejemplo('facil', 'El protocolo equivocado', pro('telnet')),

      h('El mensaje de aviso (banner)'),
      p(`Un **banner** es el texto que aparece antes de iniciar sesión. Sirve para avisar de que el acceso es solo para personal autorizado, lo cual tiene valor legal en muchos países.`),
      codigo('Banner de aviso', `Switch(config)# banner motd #Acceso solo para personal autorizado. La actividad queda registrada.#`),
      nota('error', `No escribas «Bienvenido» en un banner, ni el nombre de la empresa, el modelo del equipo o la versión de software. Un saludo puede interpretarse como una invitación, y los detalles técnicos son información útil para quien hace reconocimiento.`),

      h('Puertos sin uso: apagados'),
      p(`Cada puerto de switch encendido y sin dueño es una toma de red libre. Si alguien conecta ahí una computadora portátil, está dentro de la red. Lo correcto es **apagar los puertos que no se usan** y, de paso, asignarlos a una VLAN sin uso.`),
      codigo('Apagar los puertos Fa0/13 a Fa0/24', `Switch(config)# interface range fastEthernet 0/13 - 24
Switch(config-if-range)# switchport mode access
Switch(config-if-range)# switchport access vlan 999
Switch(config-if-range)# shutdown`),
      ejemplo('facil', 'Un puerto libre', end('apagar')),

      h('Seguridad de puerto y filtrado por MAC'),
      p(`La **seguridad de puerto** (*port security*) limita **qué direcciones MAC y cuántas** pueden usar un puerto de acceso. Es el «filtrado por dirección MAC» en el mundo cableado: el switch aprende la MAC del equipo legítimo y, si aparece otra distinta, reacciona.`),
      codigo('Seguridad de puerto en un puerto de escritorio', `Switch(config)# interface fastEthernet 0/5
Switch(config-if)# switchport mode access
Switch(config-if)# switchport port-security
Switch(config-if)# switchport port-security maximum 1
Switch(config-if)# switchport port-security mac-address sticky
Switch(config-if)# switchport port-security violation shutdown`),
      tabla(['Modo de violación', 'Qué hace con el tráfico no permitido', '¿Avisa?', '¿Apaga el puerto?'], [
        ['`protect`', 'Lo descarta', 'No', 'No'],
        ['`restrict`', 'Lo descarta', 'Sí', 'No'],
        ['`shutdown` (por defecto)', 'Lo descarta', 'Sí', '**Sí**: el puerto queda en *err-disabled*'],
      ]),
      p(`\`sticky\` hace que el switch **aprenda sola** la MAC del primer equipo que se conecte y la guarde en la configuración. Con \`maximum 1\`, si alguien desconecta esa computadora y conecta otra, o enchufa un pequeño switch para repartir la toma, el puerto se bloquea.`),
      nota('aviso', `Igual que en el Wi-Fi, una dirección MAC se puede **copiar**. La seguridad de puerto frena al curioso y al empleado que conecta su propio equipo, pero no a un atacante decidido. Para eso existe el control de acceso a la red con **802.1X**, que pide credenciales antes de dar servicio al puerto.`),
      ejemplo('medio', 'Activar la función', end('portsec')),
      ejemplo('dificil', 'Un puerto que «se murió»', op('Un usuario cambió de computadora y ahora su toma de red no funciona. En el switch, `show interfaces status` muestra el puerto como `err-disabled`. Otros puertos funcionan bien. ¿Cuál es la causa más probable?', ['El cable se dañó justo al cambiar de equipo', 'La seguridad de puerto detectó una dirección MAC distinta y apagó el puerto', 'El servidor DHCP se quedó sin direcciones', 'La VLAN fue borrada'], 1, [
        'El dato clave es el estado **err-disabled**: el switch apagó el puerto por su cuenta tras detectar un error. Un cable dañado dejaría el puerto en `notconnect`, no en `err-disabled`.',
        'Coincide con un cambio de equipo: la computadora nueva tiene otra dirección MAC. Con seguridad de puerto y violación `shutdown`, una MAC no autorizada apaga el puerto.',
        'No es un fallo: el control funcionó como debía. La solución es que un administrador autorice la nueva MAC y reactive el puerto (`shutdown` seguido de `no shutdown`). Como técnico, lo documentas y lo escalas.',
      ])),

      h('Gestión separada y con registro'),
      h3('VLAN de gestión'),
      p(`La dirección IP con la que se administra un switch debe estar en una **VLAN de gestión** propia, distinta de la de los usuarios y de la VLAN 1. Así, una computadora cualquiera de la oficina ni siquiera puede intentar una sesión SSH contra el switch.`),
      h3('Registros: syslog y NTP'),
      p(`Los equipos generan mensajes cuando algo ocurre: un puerto que cae, un inicio de sesión fallido, una violación de seguridad. Esos mensajes se envían a un **servidor syslog** central (puerto UDP 514), donde se guardan aunque el equipo se reinicie o alguien intente borrar sus huellas.`),
      p(`Para que los registros de distintos equipos se puedan comparar, todos deben tener **la misma hora**. De eso se encarga **NTP** (puerto UDP 123). Sin hora correcta, es imposible reconstruir el orden de un incidente, y además fallan los certificados.`),
      codigo('Hora y registros centralizados', `Switch(config)# ntp server 10.0.0.1
Switch(config)# service timestamps log datetime msec
Switch(config)# logging host 10.0.0.50`),
      ejemplo('medio', 'Lo que registra el equipo', aaa('intentos-fallidos')),

      h3('Actualizaciones y copias de la configuración'),
      lista(
        '**Actualizar el software** (IOS, firmware): los fabricantes publican correcciones de seguridad. Un equipo sin actualizar es una vulnerabilidad conocida.',
        '**Guardar la configuración**: `copy running-config startup-config`. Sin esto, todo se pierde al reiniciar.',
        '**Respaldar la configuración fuera del equipo**, por un medio seguro (SCP o SFTP mejor que TFTP), y guardarla protegida: contiene contraseñas y el mapa de la red.',
        '**Desactivar los servicios que no se usan**, como el servidor HTTP del equipo si se administra por SSH.',
      ),

      h('Seguridad física'),
      p(`Recuerda la lección 1: quien toca el equipo lo controla. Con acceso físico se puede conectar un cable de consola o iniciar el procedimiento de recuperación de contraseña.`),
      lista(
        'Equipos en un **rack o cuarto con llave**, con acceso limitado y registrado.',
        'Contraseña también en el **puerto de consola**.',
        'Ventilación y **UPS**: el calor y los apagones también tumban la red.',
        'Tomas de red en zonas públicas **desactivadas**.',
      ),

      h('Control de acceso a la red (NAC y 802.1X)'),
      p(`El **control de acceso a la red** (NAC) responde a una pregunta antes de dar servicio: ¿quién es este equipo y cumple las condiciones para conectarse? La pieza central es **802.1X**: el puerto del switch (o el punto de acceso) permanece cerrado hasta que el equipo o el usuario se autentica contra un servidor RADIUS.`),
      tabla(['Papel en 802.1X', 'Quién es'], [
        ['**Suplicante**', 'El equipo que quiere conectarse'],
        ['**Autenticador**', 'El switch o el punto de acceso'],
        ['**Servidor de autenticación**', 'El servidor RADIUS'],
      ]),
      p(`Es el mismo mecanismo que usa el Wi-Fi Enterprise, aplicado al cable. Un NAC completo puede además comprobar que el equipo tenga antivirus y actualizaciones, y mandar a una red de cuarentena al que no cumpla.`),

      h('Ante un incidente'),
      p(`Si sospechas que un equipo de red fue manipulado o hay un ataque en curso, aplica lo mismo que con cualquier incidente, con un cuidado adicional: **no cambies la configuración por tu cuenta**.`),
      orden(
        '**Reporta** de inmediato por el canal oficial.',
        '**Contén** solo lo que tengas autorizado (por ejemplo, apagar el puerto del equipo sospechoso).',
        '**Conserva la evidencia**: no reinicies ni borres registros.',
        '**Documenta** con horas exactas lo que viste y lo que hiciste.',
        '**Aprende**: tras el incidente se revisa qué falló y qué control faltaba.',
      ),

      h('Lista de comprobación'),
      tabla(['Control', 'Comando o acción'], [
        ['Contraseña del modo privilegiado con hash', '`enable secret`'],
        ['Cuentas individuales', '`username … secret`'],
        ['Solo SSH, versión 2', '`transport input ssh`, `ip ssh version 2`'],
        ['Sesiones que caducan', '`exec-timeout`'],
        ['Banner de aviso', '`banner motd`'],
        ['Puertos sin uso apagados', '`shutdown`'],
        ['Seguridad de puerto', '`switchport port-security`'],
        ['Hora y registros centralizados', '`ntp server`, `logging host`'],
        ['Configuración guardada y respaldada', '`copy running-config startup-config`'],
        ['Equipo bajo llave y software actualizado', 'Acción física y mantenimiento'],
      ]),

      ejercicios('Practica: comandos de protección', 'Puedes escribir el comando completo o abreviado, como en IOS. Los valores deben ser exactos.', [
        end('cifrar'), end('vty'), end('local'), end('sshv2'), end('llaves'), end('maximo', { max: 3 }), end('guardar'), end('secret', { clave: 'Cisc0-Lab' }), end('espera', { min: 3 }), end('ssh'),
      ]),
      ejercicios('Practica: endurecimiento', 'Preguntas al estilo del examen.', [
        op('¿Por qué se prefiere `enable secret` a `enable password`?', ['Porque es más corto de escribir', 'Porque guarda la contraseña como hash en lugar de texto claro', 'Porque permite contraseñas más largas', 'Porque funciona sin modo privilegiado'], 1, 'Con `enable password`, cualquiera que vea la configuración lee la contraseña.'),
        op('¿Qué comando hace que las líneas VTY rechacen Telnet?', ['`login local`', '`transport input ssh`', '`exec-timeout 5 0`', '`service password-encryption`'], 1, 'Solo se acepta el protocolo indicado: SSH.'),
        op('¿Qué hace `exec-timeout 5 0` en una línea?', ['Limita a cinco los intentos de inicio de sesión', 'Cierra la sesión tras cinco minutos sin actividad', 'Permite cinco sesiones simultáneas', 'Bloquea la línea cinco segundos'], 1, 'Los dos números son minutos y segundos de inactividad.'),
        vs('¿Cuáles **dos** acciones reducen el riesgo de que alguien se conecte a una toma de red libre?', ['Apagar los puertos sin uso', 'Aumentar la velocidad del puerto', 'Activar la seguridad de puerto', 'Cambiar el banner', 'Activar Telnet'], [0, 2], 'Un puerto apagado no da servicio, y la seguridad de puerto bloquea direcciones MAC no autorizadas.'),
        op('Un puerto con seguridad de puerto y violación `shutdown` recibe una trama de una MAC no autorizada. ¿Qué ocurre?', ['El puerto sigue funcionando y solo avisa', 'El puerto pasa a err-disabled y deja de reenviar tráfico', 'El switch se reinicia', 'La MAC se añade automáticamente a la lista'], 1, 'Es el modo por defecto: el puerto se desactiva hasta que un administrador lo reactiva.'),
        rel('Relaciona cada servicio con su función en la protección de equipos.', [['Syslog', 'Centralizar los mensajes de registro'], ['NTP', 'Mantener la misma hora en todos los equipos'], ['RADIUS', 'Autenticar usuarios y equipos de forma centralizada'], ['SSH', 'Administrar equipos con la sesión cifrada']], 'Syslog guarda los eventos, NTP los hace comparables, RADIUS centraliza las identidades y SSH protege la administración.'),
        op('¿Por qué importa NTP para la seguridad?', ['Porque cifra las contraseñas', 'Porque sin la hora correcta no se pueden correlacionar los registros de un incidente', 'Porque asigna direcciones IP', 'Porque bloquea puertos'], 1, 'Para reconstruir un incidente hay que ordenar los eventos de varios equipos; eso exige relojes sincronizados.'),
        op('En 802.1X, ¿qué papel tiene el switch?', ['Suplicante', 'Autenticador', 'Servidor de autenticación', 'Autoridad de certificación'], 1, 'El switch es el intermediario: mantiene el puerto cerrado y consulta al servidor RADIUS.'),
        op('¿Qué texto es más adecuado para un banner?', ['«Bienvenido al switch Catalyst 2960 de Contabilidad»', '«Acceso solo para personal autorizado. La actividad queda registrada.»', '«Contraseña: la de siempre»', '«Hola, administrador»'], 1, 'Debe advertir, sin dar la bienvenida ni revelar marca, modelo o ubicación.'),
        ord('Ordena los pasos para dejar SSH funcionando en un switch Cisco.', ['Configurar el nombre del equipo y el nombre de dominio', 'Generar el par de claves RSA', 'Crear una cuenta local con contraseña secreta', 'Indicar en las líneas VTY que solo acepten SSH con inicio de sesión local'], 'Las claves RSA necesitan nombre y dominio; SSH necesita un usuario; al final se restringen las líneas.'),
        op('¿Por qué la IP de administración de un switch debe estar en una VLAN de gestión aparte?', ['Para que los usuarios comunes no puedan alcanzar la interfaz de administración', 'Para que el switch sea más rápido', 'Porque la VLAN 1 no admite direcciones IP', 'Para ahorrar direcciones'], 0, 'Separar la gestión reduce quién puede siquiera intentar conectarse al equipo.'),
        op('Sospechas que alguien modificó la configuración de un router. ¿Qué haces primero?', ['Reiniciar el router para limpiarlo', 'Borrar los registros para empezar de cero', 'Reportarlo por el canal oficial sin alterar el equipo', 'Cambiar tú mismo toda la configuración'], 2, 'Reiniciar o borrar destruye evidencia. Se reporta y se sigue el procedimiento de incidentes.'),
        cia('c-control-cambios'),
        op('¿Qué método es más seguro para respaldar la configuración de un router en un servidor a través de una red no confiable?', ['TFTP', 'FTP', 'SCP o SFTP', 'Copiarla en un correo sin cifrar'], 2, 'SCP y SFTP viajan sobre SSH. TFTP y FTP no cifran, y la configuración contiene datos sensibles.'),
      ]),
    ],
  },
];
