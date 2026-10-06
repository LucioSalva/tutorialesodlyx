// Infraestructura · lecciones 5 a 7: ARP y puerta de enlace, cómo funciona un router y primeros pasos en Cisco IOS.
import { h, h3, p, lista, orden, tabla, nota, formula, codigo, ejemplo, ejercicios, op, vs, rel, ord } from './_ayuda.mjs';
import { ios } from './infraestructura-1.mjs';

/** ¿Local o remoto? origen/prefijo, puerta de enlace y destino. */
const lr = (origen, pr, gw, destino) => ({ tipo: 'if-local-remoto', origen, p: pr, gw, destino });
/** Tabla de enrutamiento: rutas = [[código, red, prefijo, siguiente salto o '', interfaz]]. */
const ruta = (destino, rutas) => ({ tipo: 'if-ruta', destino, rutas: rutas.map(([cod, red, pr, via, iface]) => ({ red, p: pr, cod, ...(via ? { via } : {}), iface })) });
/** Direcciones por tramo: routers (1 o 2), tramo (desde 1) y TTL inicial. */
const M = ['0050.7966.6801', '0c1e.aa01.9f20', '001a.2b3c.4d01', '001a.2b3c.4d02', '00d0.bc12.3401', '00d0.bc12.3402'];
const salto = (routers, tramo, ttl, pc = '192.168.10.25', srv = '172.16.50.80') => ({ tipo: 'if-salto', routers, tramo, ttl,
  pc: { ip: pc, mac: M[0] }, srv: { ip: srv, mac: M[1] }, r: Array.from({ length: routers }, (_, i) => ({ ent: M[2 + i * 2], sal: M[3 + i * 2] })) });
const modo = (caso) => ({ tipo: 'if-modo', caso });

const TABLA_R1 = [
  ['C', '192.168.1.0', 24, '', 'G0/0'],
  ['C', '192.168.12.0', 30, '', 'G0/1'],
  ['S', '10.20.0.0', 16, '192.168.12.2', 'G0/1'],
  ['O', '10.20.30.0', 24, '192.168.12.2', 'G0/1'],
  ['S*', '0.0.0.0', 0, '203.0.113.1', 'G0/2'],
];

export default [
  /* ------------------------------------------------------------------ 5 */
  {
    slug: 'arp-y-la-puerta-de-enlace',
    titulo: 'ARP y la puerta de enlace: red local o red remota',
    resumen: 'Por qué hacen falta dos direcciones, cómo ARP averigua la MAC a partir de la IP, y cómo decide un equipo si entrega directamente o envía al router.',
    nivel: 'medio',
    objetivos: [
      'Explicar por qué una red necesita a la vez direcciones IP y direcciones MAC.',
      'Describir la petición y la respuesta de ARP y leer una tabla ARP.',
      'Decidir si un destino es local o remoto aplicando la máscara.',
      'Explicar el papel de la puerta de enlace y los síntomas de configurarla mal.',
    ],
    bloques: [
      h('Dos direcciones para un solo envío'),
      p('Ya conoces dos direcciones: la **IP**, de la capa 3, y la **MAC**, de la capa 2. La pregunta natural es: ¿por qué dos? ¿No bastaría con una?\n\nNo, porque responden preguntas distintas:'),
      tabla(['', 'Dirección IP', 'Dirección MAC'], [
        ['Pregunta que responde', '¿Cuál es el **destino final**?', '¿Quién es el **siguiente** que recibe esto?'],
        ['Alcance', 'Todo el camino, de extremo a extremo', 'Solo el tramo actual, de un equipo al siguiente'],
        ['Cambia por el camino', 'No', 'Sí, en cada router'],
        ['Quién la asigna', 'El administrador o DHCP', 'El fabricante de la tarjeta'],
        ['Analogía', 'La dirección escrita en el paquete: calle, ciudad, país', 'El nombre de quien lo recibe en cada relevo: el cartero, la bodega, el repartidor'],
      ]),
      p('Cuando envías un paquete por mensajería, la **dirección del destinatario** no cambia en todo el viaje. Lo que cambia es **quién lo tiene en las manos**: primero la tienda donde lo dejaste, luego el camión, luego el centro de distribución, luego el repartidor. La IP es la dirección del destinatario. La MAC es la de quien recibe el paquete en cada relevo.'),

      h('El problema que resuelve ARP'),
      p('Una computadora quiere enviar un paquete a `192.168.1.35`. Conoce la IP de destino, porque se la dio el usuario o el DNS. Pero para poner el paquete en el cable tiene que meterlo en una **trama Ethernet**, y la trama exige una **MAC de destino**. Esa MAC no la conoce.\n\n**ARP** (*Address Resolution Protocol*, protocolo de resolución de direcciones) es el mecanismo para averiguarla: **dada una dirección IP de mi red, dime qué MAC tiene**.'),

      h('Petición y respuesta'),
      p('ARP funciona como preguntar a gritos en una oficina: «¿quién es Juan Pérez?». Todos oyen la pregunta, pero solo Juan contesta, y te contesta a ti.'),
      tabla(['', 'Petición ARP (*request*)', 'Respuesta ARP (*reply*)'], [
        ['Qué dice', '«¿Quién tiene 192.168.1.35? Díganselo a 192.168.1.20»', '«192.168.1.35 está en la MAC 0050.7966.6802»'],
        ['MAC de destino de la trama', '`ffff.ffff.ffff` (**broadcast**: a todos)', 'La MAC de quien preguntó (**unicast**: solo a él)'],
        ['Quién la recibe', 'Todos los equipos de la red', 'Solo quien preguntó'],
        ['Quién la procesa', 'Solo el dueño de esa IP; los demás la descartan', 'Quien preguntó: guarda el dato en su tabla ARP'],
      ]),
      nota('clave', 'La petición ARP es un **broadcast**, y los routers no reenvían broadcast. Por eso ARP **solo sirve dentro de la propia red**: nunca puedes averiguar por ARP la MAC de un equipo que está en otra red. Esta idea es la base de toda la lección.'),
      ejemplo('facil', 'Cómo viaja la petición', op('PC-A envía una petición ARP para averiguar la MAC de PC-B, que está en su misma red. ¿Qué MAC de destino lleva la trama de esa petición?',
        ['La MAC de PC-B', 'La MAC del router', '`ffff.ffff.ffff`', '`0000.0000.0000`'], 2, [
          'PC-A todavía **no conoce** la MAC de PC-B: justo eso es lo que quiere averiguar. No puede ponerla en la trama.',
          'Como no sabe a quién dirigirse, pregunta a todos: la trama va a la MAC de **broadcast**, `ffff.ffff.ffff`.',
          'El switch inunda la trama, todos la reciben, y solo PC-B responde, ya en unicast.',
        ])),

      h('La tabla ARP'),
      p('Preguntar cada vez sería un desperdicio. Cada equipo guarda lo que aprende en su **tabla ARP** (o caché ARP): una lista de «IP → MAC». Las entradas aprendidas son **dinámicas** y caducan si no se usan: en una computadora, en cuestión de minutos; en un router Cisco, a las 4 horas.'),
      codigo('Tabla ARP en Windows', `C:\\> arp -a

Interfaz: 192.168.1.20 --- 0x5
  Dirección de Internet    Dirección física      Tipo
  192.168.1.1              00-1a-2b-3c-4d-01     dinámico
  192.168.1.35             00-50-79-66-68-02     dinámico
  192.168.1.255            ff-ff-ff-ff-ff-ff     estático`),
      codigo('Tabla ARP en un router Cisco', `R1# show ip arp
Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  192.168.1.1             -   001a.2b3c.4d01  ARPA   GigabitEthernet0/0
Internet  192.168.1.20           12   0050.7966.6801  ARPA   GigabitEthernet0/0
Internet  192.168.1.35            3   0050.7966.6802  ARPA   GigabitEthernet0/0`),
      tabla(['Sistema', 'Ver la tabla ARP'], [
        ['Windows', '`arp -a`'],
        ['Linux', '`ip neigh` (o el antiguo `arp -n`)'],
        ['macOS', '`arp -a`'],
        ['Cisco IOS', '`show ip arp` (o `show arp`)'],
      ]),
      p('En la salida de Cisco, la columna **Age** dice hace cuántos minutos se aprendió la entrada. Un guion (`-`) significa que esa dirección es **del propio router**: no la aprendió de nadie.'),
      nota('aviso', 'No confundas las dos tablas. La **tabla MAC** es del **switch** y relaciona MAC con **puerto**. La **tabla ARP** es de las **computadoras y los routers** y relaciona **IP** con MAC. Un switch de capa 2 no necesita ARP para reenviar tramas.'),

      h('¿El destino está en mi red?'),
      p('Antes de enviar cualquier paquete, la computadora se hace una pregunta: **¿el destino está en mi misma red o en otra?** De la respuesta depende todo lo demás.\n\nPara responderla usa **su propia máscara**:'),
      orden(
        'Aplica su máscara a **su propia IP** y obtiene su red.',
        'Aplica **la misma máscara** a la **IP de destino**.',
        'Compara. Si las dos dan la **misma red**, el destino es **local**. Si dan redes distintas, es **remoto**.',
      ),
      nota('error', 'La computadora **no conoce la máscara del destino**, ni la necesita. Usa siempre la suya. Por eso una máscara mal configurada en un solo equipo basta para que tome decisiones equivocadas.'),

      h('Destino local: entrega directa'),
      p('Si el destino es local, el paquete no necesita a nadie más:'),
      orden(
        'La computadora busca la IP de destino en su tabla ARP.',
        'Si no está, envía una petición ARP **por la IP del destino**.',
        'Con la MAC obtenida, arma la trama: **MAC de destino = la del equipo de destino**.',
        'El switch la entrega. El router no interviene.',
      ),
      ejemplo('facil', 'Dos equipos de la misma red', lr('192.168.1.20', 24, '192.168.1.1', '192.168.1.35')),

      h('Destino remoto: la puerta de enlace'),
      p('Si el destino está en otra red, hacer ARP por él no serviría: el broadcast no sale de la red. La computadora necesita a alguien que **sí sepa llegar a otras redes**. Ese alguien es el router, y su dirección en la red local es la **puerta de enlace** (*default gateway*).\n\nLa puerta de enlace es la salida del edificio. Si el sobre es para alguien de tu mismo piso, se lo llevas tú. Si es para otra ciudad, lo dejas en el buzón de la entrada y la oficina postal se encarga.'),
      orden(
        'La computadora ve que el destino es remoto.',
        'Busca en su tabla ARP **la IP de la puerta de enlace** (no la del destino).',
        'Si no está, envía una petición ARP **por la IP de la puerta de enlace**. Responde el router.',
        'Arma la trama con **MAC de destino = la del router**, pero deja en el paquete la **IP de destino final** sin tocar.',
        'El router recibe la trama, saca el paquete y lo envía hacia su red de destino.',
      ),
      nota('clave', 'En un envío a otra red, la trama y el paquete apuntan a **sitios distintos**: la **MAC de destino** es la del **router** y la **IP de destino** es la del **equipo final**. Es la pregunta favorita del tema.'),
      ejemplo('facil', 'Un servidor en Internet', lr('192.168.1.20', 24, '192.168.1.1', '8.8.8.8')),
      ejemplo('medio', 'Parece local, pero no lo es', lr('192.168.1.20', 26, '192.168.1.1', '192.168.1.70'), 'Las dos direcciones empiezan igual, pero con /26 la red del origen solo llega hasta .63. Nunca decidas por el parecido: aplica la máscara.'),
      ejemplo('dificil', 'Una subred pequeña', lr('172.16.5.130', 27, '172.16.5.158', '172.16.5.161')),
      ejemplo('dificil', 'Parece remoto, pero es local', lr('10.10.4.200', 22, '10.10.4.1', '10.10.7.15'), 'Con /22, la red abarca del tercer octeto 4 al 7. Aunque el tercer octeto cambie, el destino está en la misma red.'),

      h('Qué necesita un equipo para salir de su red'),
      tabla(['Dato', 'Para qué', 'Sin él…'], [
        ['Dirección IP', 'Identificarse en la red', 'No puede comunicarse con nadie.'],
        ['Máscara de subred', 'Saber qué destinos son locales', 'Decide mal qué va directo y qué va al router.'],
        ['Puerta de enlace', 'Salir hacia otras redes', 'Solo alcanza a los equipos de su propia red.'],
        ['Servidor DNS', 'Traducir nombres a direcciones IP', 'Solo funciona escribiendo direcciones IP.'],
      ]),
      nota('clave', 'La puerta de enlace debe estar **en la misma red que el equipo**. Si no, el equipo no podría hacerle ARP y no tendría cómo entregarle nada.'),

      h('Cuando la puerta de enlace está mal'),
      p('Es una de las averías más frecuentes, y tiene un síntoma inconfundible: el equipo **se comunica bien con los de su red, pero no con nada de fuera**.'),
      tabla(['Qué está mal', 'Qué se observa'], [
        ['No hay puerta de enlace configurada', 'Ping a equipos de la misma red: funciona. Ping a cualquier otra red: falla de inmediato.'],
        ['La puerta de enlace apunta a una IP que no es el router', 'Igual que arriba: lo local funciona, lo remoto no.'],
        ['La puerta de enlace está en otra red', 'El equipo la rechaza o no logra usarla: lo remoto no funciona.'],
        ['La máscara es más corta de lo debido (por ejemplo, /16 en vez de /24)', 'El equipo cree que destinos remotos son locales, les hace ARP y nadie responde.'],
        ['La máscara es más larga de lo debido (por ejemplo, /25 en vez de /24)', 'El equipo cree que algunos vecinos son remotos y les envía por el router. Puede funcionar, pero mal.'],
      ]),
      ejemplo('medio', 'Diagnóstico por síntomas', op('Una usuaria puede imprimir en la impresora de su oficina y abrir carpetas compartidas de un compañero, pero no puede abrir ninguna página web ni hacer ping a `8.8.8.8`. Los demás equipos de la oficina navegan sin problema. ¿Cuál es la causa más probable?',
        ['El cable de red está dañado', 'La puerta de enlace de su equipo está mal configurada', 'El switch está apagado', 'El servidor DNS de la empresa está caído'], 1, [
          'Lo **local funciona** (impresora, carpetas): el cable, la tarjeta y el switch están bien.',
          'Lo **remoto no funciona**, ni siquiera por dirección IP (`8.8.8.8`): no es un problema de DNS, que solo afecta a los nombres.',
          'Los demás navegan: el router y la conexión a Internet funcionan. El fallo está en **ese equipo**: su **puerta de enlace**.',
        ])),
      ejemplo('experto', 'Una máscara equivocada', op('La red de la oficina es `192.168.10.0/24` y su puerta de enlace es `192.168.10.1`. A una computadora le configuraron por error la dirección `192.168.10.50` con máscara `255.255.0.0`. ¿Qué pasa cuando intenta llegar al servidor `192.168.20.5`, que está en otra red detrás del router?',
        ['Funciona con normalidad', 'Envía el paquete a la puerta de enlace, pero el router lo rechaza', 'Cree que el servidor es local, le hace ARP directamente y nadie responde', 'Cambia su máscara automáticamente'], 2, [
          'Con la máscara `255.255.0.0` (/16), la computadora calcula que su red es `192.168.0.0/16`, de `192.168.0.0` a `192.168.255.255`.',
          'El servidor `192.168.20.5` cae dentro de ese rango: la computadora lo considera **local**.',
          'Entonces **no usa la puerta de enlace**: envía una petición ARP por `192.168.20.5`. Ese broadcast no cruza el router, nadie responde y la comunicación falla.',
          'A destinos como `8.8.8.8`, fuera del /16, sí llegaría: por eso este error es tan desconcertante.',
        ])),

      h('Resumen'),
      lista(
        '**IP** = destino final, no cambia. **MAC** = siguiente relevo, cambia en cada router.',
        '**ARP** averigua la MAC a partir de una IP **de la propia red**.',
        'Petición ARP: **broadcast**. Respuesta ARP: **unicast**.',
        'El equipo aplica **su máscara** al destino para saber si es local o remoto.',
        'Local: ARP por el destino, y la trama va a la MAC del destino.',
        'Remoto: ARP por la **puerta de enlace**, y la trama va a la MAC del router con la IP final intacta.',
        'Síntoma de puerta de enlace mal puesta: lo local funciona, lo remoto no.',
      ),

      ejercicios('Practica', 'En los ejercicios «¿local o remoto?», calcula primero el rango de la red del origen. No te fíes de que las direcciones se parezcan.', [
        op('¿Qué averigua ARP?', ['La dirección IP a partir de un nombre', 'La dirección MAC a partir de una dirección IP', 'La máscara a partir de la dirección IP', 'La ruta hacia otra red'], 1, 'ARP resuelve IP → MAC dentro de la red local. Nombre → IP es trabajo de DNS.'),
        op('¿Cómo se envía una respuesta ARP?', ['En broadcast, a todos', 'En unicast, solo a quien preguntó', 'En multicast, a los routers', 'No se envía: el switch contesta'], 1, 'La petición trae la MAC de quien pregunta, así que la respuesta ya puede ir dirigida solo a él.'),
        op('¿Qué comando muestra la tabla ARP en una computadora con Windows?', ['`ipconfig /all`', '`arp -a`', '`show ip arp`', '`netstat -r`'], 1, '`arp -a` lista las entradas IP → MAC. `show ip arp` es el equivalente en Cisco IOS.'),
        op('¿Por qué una computadora no puede usar ARP para averiguar la MAC de un servidor que está en otra red?', ['Porque los servidores no tienen MAC', 'Porque la petición ARP es un broadcast y los routers no reenvían broadcast', 'Porque ARP solo funciona con IPv6', 'Porque el switch bloquea ARP'], 1, 'El broadcast se queda en la red local. Para otras redes se le hace ARP a la puerta de enlace.'),
        lr('192.168.50.10', 24, '192.168.50.1', '192.168.50.200'),
        lr('192.168.50.10', 24, '192.168.50.1', '192.168.51.10'),
        lr('10.0.0.25', 24, '10.0.0.254', '142.250.72.14'),
        lr('192.168.1.100', 25, '192.168.1.1', '192.168.1.130'),
        lr('192.168.1.100', 25, '192.168.1.1', '192.168.1.90'),
        lr('172.16.8.77', 26, '172.16.8.65', '172.16.8.140'),
        lr('172.16.20.5', 23, '172.16.20.1', '172.16.21.240'),
        lr('10.10.32.14', 20, '10.10.32.1', '10.10.48.9'),
        lr('192.168.7.33', 28, '192.168.7.46', '192.168.7.49'),
        lr('172.16.100.130', 27, '172.16.100.129', '172.16.100.158'),
        op('Una computadora envía un paquete a un servidor web de Internet. ¿Qué direcciones de destino lleva al salir de la computadora?', ['MAC del servidor e IP del servidor', 'MAC de la puerta de enlace e IP del servidor', 'MAC de la puerta de enlace e IP de la puerta de enlace', 'MAC de broadcast e IP del servidor'], 1, 'La trama va al siguiente relevo (el router), pero el paquete conserva la IP del destino final.'),
        op('Un equipo hace ping sin problema a los demás equipos de su red, pero no a ninguna dirección de otras redes. ¿Qué revisas primero?', ['El cable de red', 'La puerta de enlace configurada en el equipo', 'La tabla MAC del switch', 'La velocidad del puerto'], 1, 'Local sí y remoto no es el síntoma clásico de una puerta de enlace ausente o equivocada.'),
        op('En `show ip arp`, una entrada muestra un guion (`-`) en la columna Age. ¿Qué significa?', ['Que la entrada caducó', 'Que esa dirección pertenece a una interfaz del propio router', 'Que el equipo está apagado', 'Que la MAC es de broadcast'], 1, 'Las direcciones propias no se aprenden ni envejecen: por eso no tienen edad.'),
        vs('¿Qué **dos** afirmaciones sobre una petición ARP son correctas?', ['Se envía a la MAC `ffff.ffff.ffff`', 'Los routers la reenvían a todas las redes', 'La reciben todos los equipos de la red local', 'Solo se usa para destinos de Internet', 'Va cifrada'], [0, 2], 'Es un broadcast de capa 2: llega a toda la red local y no cruza routers.'),
        vs('¿Qué **dos** datos compara una computadora para saber si un destino es local?', ['Su red (su IP con su máscara)', 'La dirección MAC del destino', 'La red del destino calculada con la máscara de la propia computadora', 'El nombre DNS del destino', 'La máscara configurada en el destino'], [0, 2], 'Aplica su propia máscara a las dos direcciones IP y compara los resultados.'),
        rel('Relaciona cada tabla con lo que contiene.', [['Tabla ARP', 'Dirección IP → dirección MAC'], ['Tabla de direcciones MAC', 'Dirección MAC → puerto del switch'], ['Tabla de enrutamiento', 'Red de destino → siguiente salto']], 'ARP es de equipos y routers; la tabla MAC, del switch; la de enrutamiento, del router.'),
        ord('Una computadora envía por primera vez un paquete a un servidor de otra red. Ordena lo que ocurre.', ['Aplica su máscara y ve que el destino es remoto', 'Envía una petición ARP preguntando por la IP de la puerta de enlace', 'El router responde con la MAC de su interfaz', 'Envía la trama a la MAC del router con la IP del servidor como destino', 'El router reenvía el paquete hacia la red del servidor'], 'Primero decide (local o remoto), después resuelve la MAC del relevo correcto y por último envía.'),
        op('La red es `10.5.5.0/24`. Un equipo tiene la IP `10.5.5.40/24` y como puerta de enlace `10.5.6.1`. ¿Cuál es el problema?', ['La IP del equipo es de broadcast', 'La puerta de enlace no está en la misma red que el equipo', 'La máscara es demasiado larga', 'No hay ningún problema'], 1, 'Con /24, la red del equipo va de 10.5.5.0 a 10.5.5.255. `10.5.6.1` queda fuera: el equipo no puede alcanzarla por ARP.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 6 */
  {
    slug: 'como-funciona-un-router',
    titulo: 'Cómo funciona un router: la tabla de enrutamiento',
    resumen: 'Qué hace un router con cada paquete, cómo leer `show ip route`, la regla de la coincidencia más larga y qué cambia (y qué no) en cada salto.',
    nivel: 'dificil',
    objetivos: [
      'Describir los pasos que sigue un router al recibir un paquete.',
      'Leer una tabla de enrutamiento: rutas conectadas, locales, estáticas, dinámicas y por defecto.',
      'Elegir la ruta correcta aplicando la coincidencia más larga.',
      'Decir qué direcciones cambian en cada salto y qué pasa con el TTL.',
    ],
    bloques: [
      h('El trabajo de un router'),
      p('Un switch conecta equipos de **una** red. Un router conecta **redes entre sí**. Cada interfaz de un router está en una red distinta, y su trabajo es recibir un paquete por una interfaz y sacarlo por la que lo acerque a su destino.\n\nUn router es como una glorieta con varias salidas y un letrero. Cada coche (paquete) llega, lee el letrero (tabla de enrutamiento) buscando su ciudad (red de destino) y toma la salida indicada. La glorieta no lleva a nadie hasta su casa: solo lo pone en la carretera correcta. El siguiente router hará lo mismo.'),
      nota('clave', 'A un router no le interesa el equipo concreto de destino, sino **la red** a la que pertenece. Por eso su tabla tiene redes, no computadoras: unas pocas líneas bastan para alcanzar millones de equipos.'),

      h('Qué hace el router con cada paquete'),
      orden(
        '**Recibe la trama** y comprueba que la MAC de destino sea la suya (o broadcast). Si no, la ignora.',
        '**Quita la trama** (desencapsula) y se queda con el paquete IP.',
        '**Resta 1 al TTL.** Si llega a 0, descarta el paquete y avisa al origen.',
        '**Busca la IP de destino** en su tabla de enrutamiento y elige la mejor ruta.',
        '**Arma una trama nueva** para el siguiente tramo: MAC de origen = la de su interfaz de salida; MAC de destino = la del siguiente salto (o la del destino final, si ya está en una red conectada).',
        '**Envía** la trama por la interfaz de salida.',
      ),
      p('Si en el paso 4 no encuentra ninguna ruta que sirva, **descarta el paquete** y envía al origen un mensaje ICMP de «destino inalcanzable».'),

      h('La tabla de enrutamiento'),
      p('La **tabla de enrutamiento** es el letrero de la glorieta: la lista de redes que el router conoce y por dónde se llega a cada una. Se ve con `show ip route`.'),
      codigo('show ip route', `R1# show ip route
Codes: L - local, C - connected, S - static, R - RIP, O - OSPF, D - EIGRP
       * - candidate default

Gateway of last resort is 203.0.113.1 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 203.0.113.1
      10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks
S        10.20.0.0/16 [1/0] via 192.168.12.2
O        10.20.30.0/24 [110/2] via 192.168.12.2, 00:12:44, GigabitEthernet0/1
      192.168.1.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.1.0/24 is directly connected, GigabitEthernet0/0
L        192.168.1.1/32 is directly connected, GigabitEthernet0/0
      192.168.12.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.12.0/30 is directly connected, GigabitEthernet0/1
L        192.168.12.1/32 is directly connected, GigabitEthernet0/1`),
      p('Cada línea con una letra al principio es una ruta. Se lee así, tomando como ejemplo la línea de OSPF:'),
      tabla(['Parte', 'En el ejemplo', 'Qué significa'], [
        ['Código', '`O`', 'Cómo aprendió el router esa ruta (aquí, por el protocolo OSPF).'],
        ['Red de destino', '`10.20.30.0/24`', 'La red a la que lleva esta ruta.'],
        ['Corchetes', '`[110/2]`', 'Distancia administrativa (qué tan fiable es la fuente) y métrica (qué tan buena es la ruta).'],
        ['Siguiente salto', '`via 192.168.12.2`', 'La IP del router vecino al que hay que entregar el paquete.'],
        ['Antigüedad', '`00:12:44`', 'Hace cuánto se aprendió o actualizó (solo en rutas dinámicas).'],
        ['Interfaz de salida', '`GigabitEthernet0/1`', 'Por dónde sale el paquete.'],
      ]),

      h('Los códigos: de dónde sale cada ruta'),
      tabla(['Código', 'Tipo de ruta', 'Cómo aparece en la tabla'], [
        ['`C`', '**Conectada**', 'Sola: al dar una IP a una interfaz y encenderla, el router añade la red de esa interfaz.'],
        ['`L`', '**Local**', 'Sola, junto a la conectada: la IP exacta de la interfaz del router, con prefijo /32.'],
        ['`S`', '**Estática**', 'La escribe a mano un administrador: «para llegar a esta red, ve por aquí».'],
        ['`S*`', '**Estática por defecto**', 'La ruta `0.0.0.0/0`, escrita a mano: «para todo lo demás, ve por aquí».'],
        ['`O`, `D`, `R`', '**Dinámica**', 'La aprende el router hablando con otros routers (OSPF, EIGRP, RIP).'],
      ]),
      nota('truco', 'Una interfaz **apagada o sin cable** no aporta rutas: sus líneas `C` y `L` desaparecen de la tabla. Si falta una red conectada en `show ip route`, revisa esa interfaz con `show ip interface brief`.'),
      ejemplo('facil', 'Reconocer el código', op('En `show ip route` aparece la línea `C 192.168.1.0/24 is directly connected, GigabitEthernet0/0`. ¿Cómo llegó esa ruta a la tabla?',
        ['La escribió un administrador con una ruta estática', 'La aprendió por OSPF', 'Apareció sola porque el router tiene una interfaz encendida con una IP de esa red', 'La envió el servidor DHCP'], 2, [
          'El código `C` significa *connected*: red **directamente conectada**.',
          'Nadie la escribe ni la anuncia: aparece cuando una interfaz tiene dirección IP y está encendida (up/up).',
          'Junto a ella aparece siempre una línea `L` con la IP exacta de esa interfaz y prefijo /32.',
        ])),

      h('La ruta por defecto'),
      p('Ningún router puede tener anotadas todas las redes de Internet. Para eso existe la **ruta por defecto**, `0.0.0.0/0`: una ruta que **coincide con cualquier destino** y dice «si no tienes nada mejor, envíalo por aquí».\n\nEn la salida aparece como `S*` y, arriba, como *Gateway of last resort* (puerta de enlace de último recurso). Es para el router lo que la puerta de enlace es para una computadora.'),
      nota('aviso', 'Si la tabla dice `Gateway of last resort is not set`, el router **no tiene ruta por defecto**: descartará todo paquete cuyo destino no esté en alguna de sus rutas.'),

      h('La coincidencia más larga'),
      p('A veces **varias rutas coinciden** con el mismo destino. En la tabla de arriba, un paquete para `10.20.30.7` coincide con tres:'),
      tabla(['Ruta', 'Rango que cubre', '¿Contiene a 10.20.30.7?', 'Bits que coinciden'], [
        ['`0.0.0.0/0`', 'Todo', 'Sí', '0'],
        ['`10.20.0.0/16`', '10.20.0.0 – 10.20.255.255', 'Sí', '16'],
        ['`10.20.30.0/24`', '10.20.30.0 – 10.20.30.255', 'Sí', '24'],
      ]),
      p('El router elige siempre **la ruta con el prefijo más largo**: la más específica. Aquí, la `/24`. Esa regla se llama **coincidencia más larga** (*longest prefix match*).\n\nLa lógica es la del correo: si tienes instrucciones para «México», para «Jalisco» y para «Guadalajara», y la carta va a Guadalajara, sigues las de Guadalajara. La más concreta gana.'),
      formula('gana la ruta que coincide con el destino y tiene el prefijo más largo', [], 'No importa el orden en la tabla ni el código de la ruta. La ruta por defecto (/0) solo gana cuando no coincide ninguna otra.'),
      ejemplo('facil', 'Solo coincide la ruta por defecto', ruta('8.8.8.8', TABLA_R1)),
      ejemplo('medio', 'Una red conectada', ruta('192.168.1.77', TABLA_R1)),
      ejemplo('medio', 'Dos rutas coinciden', ruta('10.20.99.5', TABLA_R1)),
      ejemplo('dificil', 'Tres rutas coinciden', ruta('10.20.30.7', TABLA_R1)),
      ejemplo('dificil', 'Sin ruta por defecto', ruta('172.16.9.1', [
        ['C', '192.168.1.0', 24, '', 'G0/0'], ['S', '172.16.8.0', 24, '10.255.0.2', 'G0/1'], ['S', '172.16.10.0', 23, '10.255.0.6', 'G0/2'], ['O', '10.0.0.0', 8, '10.255.0.2', 'G0/1'],
      ]), 'Las rutas 172.16.8.0/24 y 172.16.10.0/23 se parecen al destino, pero ninguna lo contiene. Sin ruta por defecto, el paquete no tiene salida.'),
      ejemplo('experto', 'Subredes dentro de subredes', ruta('172.16.4.200', [
        ['O', '172.16.0.0', 16, '10.255.1.1', 'G0/0'], ['S', '172.16.4.0', 22, '10.255.2.1', 'G0/1'], ['S', '172.16.4.0', 24, '10.255.3.1', 'G0/2'],
        ['O', '172.16.4.128', 25, '10.255.4.1', 'S0/0/0'], ['S', '172.16.4.192', 27, '10.255.5.1', 'S0/0/1'], ['S', '172.16.4.224', 27, '10.255.6.1', 'G0/1'], ['S*', '0.0.0.0', 0, '203.0.113.1', 'G0/2'],
      ]), 'La /27 que empieza en .224 es la trampa: es tan específica como la ganadora, pero su rango (.224 a .255) no contiene a .200.'),

      h('Qué cambia en cada salto'),
      p('Sigue un paquete de un PC a un servidor que está dos routers más allá. En cada tramo, mira qué direcciones lleva:'),
      tabla(['Tramo', 'MAC de origen', 'MAC de destino', 'IP de origen', 'IP de destino', 'TTL'], [
        ['PC → R1', 'PC', 'R1 (interfaz hacia el PC)', 'PC', 'Servidor', '64'],
        ['R1 → R2', 'R1 (interfaz hacia R2)', 'R2 (interfaz hacia R1)', 'PC', 'Servidor', '63'],
        ['R2 → Servidor', 'R2 (interfaz hacia el servidor)', 'Servidor', 'PC', 'Servidor', '62'],
      ]),
      lista(
        'Las **direcciones IP** son siempre las mismas: origen y destino finales. (Solo las cambia NAT, que es otro tema.)',
        'Las **direcciones MAC** son nuevas en cada tramo: cada router tira la trama vieja y fabrica otra.',
        'El **TTL** baja 1 en cada router.',
      ),
      ejemplo('medio', 'El primer tramo', salto(2, 1, 64)),
      ejemplo('dificil', 'El tramo entre los dos routers', salto(2, 2, 128)),
      ejemplo('dificil', 'El último tramo', salto(2, 3, 64)),

      h('El TTL: un seguro contra los bucles'),
      p('El **TTL** (*time to live*, tiempo de vida) es un número que va en el paquete IP. El origen lo pone con un valor inicial y **cada router le resta 1**. Si un router lo deja en **0**, **descarta** el paquete y envía al origen un mensaje ICMP de «tiempo excedido».\n\n¿Para qué? Si por un error dos routers se pasaran un paquete el uno al otro sin fin, ese paquete circularía para siempre. Con el TTL, muere solo después de unos cuantos saltos.'),
      tabla(['Sistema', 'TTL inicial habitual'], [
        ['Windows', '128'],
        ['Linux, macOS, Android', '64'],
        ['Cisco IOS', '255'],
      ]),
      nota('truco', 'El comando `tracert` / `traceroute` aprovecha esto: envía paquetes con TTL 1, 2, 3… Cada router que deja el TTL en 0 responde con «tiempo excedido», y así se va descubriendo el camino, salto por salto.'),

      h('Router o switch de capa 3'),
      p('Los dos enrutan. La diferencia está en dónde brilla cada uno:'),
      tabla(['', 'Router', 'Switch de capa 3'], [
        ['Dónde se usa', 'En el borde: hacia Internet y hacia otras sedes', 'Dentro del edificio: entre las VLAN'],
        ['Puertos', 'Pocos, de varios tipos (Ethernet, serie, fibra, celular)', 'Muchos, casi todos Ethernet'],
        ['Funciones extra', 'NAT, VPN, conexiones WAN, calidad de servicio avanzada', 'Conmutación muy rápida y enrutamiento entre VLAN con SVI'],
      ]),

      h('Resumen'),
      lista(
        'El router decide con la **IP de destino** y su **tabla de enrutamiento**.',
        '`C` conectada, `L` local (/32), `S` estática, `S*` por defecto, `O`/`D`/`R` dinámicas.',
        'Si varias rutas coinciden, gana la de **prefijo más largo**.',
        'La ruta por defecto `0.0.0.0/0` coincide con todo y es el último recurso.',
        'Sin ruta que coincida, el paquete se **descarta**.',
        'En cada salto: **MAC nuevas, IP iguales, TTL − 1**.',
      ),

      ejercicios('Practica', 'En cada tabla, descarta primero las rutas que no contienen al destino. Entre las que quedan, gana el prefijo más largo.', [
        op('¿Qué significa el código `S` en `show ip route`?', ['Ruta aprendida por un switch', 'Ruta estática, escrita a mano', 'Ruta de una interfaz serie', 'Ruta segura'], 1, '`S` es *static*: la configuró un administrador.'),
        op('¿Qué prefijo tiene siempre una ruta con código `L`?', ['/0', '/24', '/30', '/32'], 3, 'La ruta local es la dirección exacta de la interfaz del router: una sola dirección, /32.'),
        op('¿Cuál es la ruta por defecto en IPv4?', ['`127.0.0.1/8`', '`0.0.0.0/0`', '`255.255.255.255/32`', '`192.168.0.0/16`'], 1, '`0.0.0.0/0` coincide con cualquier destino porque no exige ningún bit en común.'),
        ruta('192.168.12.2', TABLA_R1),
        ruta('10.20.30.200', TABLA_R1),
        ruta('10.21.0.1', TABLA_R1),
        ruta('192.168.2.10', [['C', '192.168.1.0', 24, '', 'G0/0'], ['C', '192.168.3.0', 24, '', 'G0/1'], ['S', '192.168.4.0', 24, '192.168.3.2', 'G0/1']]),
        ruta('172.16.33.9', [['S', '172.16.0.0', 16, '10.255.0.1', 'G0/0'], ['S', '172.16.32.0', 20, '10.255.0.5', 'G0/1'], ['O', '172.16.34.0', 24, '10.255.0.9', 'G0/2'], ['S*', '0.0.0.0', 0, '10.255.0.13', 'S0/0/0']]),
        ruta('10.1.1.130', [['O', '10.1.1.0', 24, '10.255.1.1', 'G0/0'], ['O', '10.1.1.0', 25, '10.255.1.5', 'G0/1'], ['O', '10.1.1.128', 26, '10.255.1.9', 'G0/2'], ['S', '10.1.1.192', 26, '10.255.1.13', 'S0/0/0'], ['S*', '0.0.0.0', 0, '10.255.1.17', 'S0/0/1']]),
        ruta('192.168.100.65', [['C', '192.168.100.0', 26, '', 'G0/0'], ['C', '192.168.100.64', 26, '', 'G0/1'], ['S', '192.168.100.0', 24, '10.255.2.1', 'G0/2'], ['S*', '0.0.0.0', 0, '10.255.2.5', 'S0/0/0']]),
        salto(1, 1, 128),
        salto(1, 2, 128),
        salto(2, 2, 255, '192.168.30.14', '172.16.9.200'),
        salto(2, 3, 128, '192.168.77.90', '172.16.200.10'),
        op('Un router recibe un paquete con TTL 1 que debe reenviar a otro router. ¿Qué hace?', ['Lo reenvía con TTL 0', 'Lo reenvía con TTL 1', 'Resta 1, el TTL queda en 0, descarta el paquete y avisa al origen con ICMP', 'Lo devuelve por la interfaz de entrada'], 2, 'Al restar 1 el TTL llega a 0: el paquete muere ahí y el router envía un mensaje ICMP de tiempo excedido.'),
        op('Un router recibe un paquete cuyo destino no coincide con ninguna ruta, y no tiene ruta por defecto. ¿Qué hace?', ['Lo envía por todas sus interfaces', 'Lo descarta y envía un ICMP de destino inalcanzable', 'Lo guarda hasta aprender una ruta', 'Lo envía de vuelta al origen sin cambios'], 1, 'Un router nunca inunda paquetes. Sin ruta, descarta.'),
        op('En `show ip route` lees «Gateway of last resort is not set». ¿Qué significa?', ['Que el router no tiene dirección IP', 'Que no hay ruta por defecto configurada', 'Que el router está apagado', 'Que falta la contraseña'], 1, 'La puerta de enlace de último recurso es la ruta por defecto. Sin ella, solo se alcanzan las redes de la tabla.'),
        op('La red de una interfaz no aparece como `C` en la tabla de enrutamiento, aunque la interfaz tiene dirección IP. ¿Cuál es la causa más probable?', ['La interfaz está apagada o sin enlace', 'Falta una ruta estática', 'El TTL es demasiado bajo', 'La tabla ARP está vacía'], 0, 'Las rutas conectadas solo existen mientras la interfaz está up/up. Con `shutdown` o sin cable, desaparecen.'),
        vs('Cuando un router reenvía un paquete, ¿qué **dos** cosas cambian?', ['La dirección MAC de origen de la trama', 'La dirección IP de origen', 'La dirección IP de destino', 'El valor del TTL', 'El contenido de los datos'], [0, 3], 'El router fabrica una trama nueva (MAC nuevas) y resta 1 al TTL. Las IP y los datos no se tocan.'),
        vs('¿Qué **dos** tipos de ruta aparecen solos en la tabla al configurar y encender una interfaz?', ['Conectada (C)', 'Estática (S)', 'Local (L)', 'OSPF (O)', 'Por defecto (S*)'], [0, 2], 'Cada interfaz activa con IP aporta su red (C) y su propia dirección /32 (L).'),
        rel('Relaciona cada código de `show ip route` con su significado.', [['C', 'Red directamente conectada'], ['L', 'Dirección de la propia interfaz (/32)'], ['S', 'Ruta estática'], ['O', 'Ruta aprendida por OSPF']], 'C y L aparecen solas; S se escribe a mano; O la aprende un protocolo dinámico.', ['Ruta aprendida por DHCP']),
        ord('Ordena lo que hace un router al recibir un paquete que debe reenviar.', ['Comprueba que la MAC de destino de la trama sea la suya', 'Quita la trama y se queda con el paquete IP', 'Resta 1 al TTL', 'Busca la IP de destino en la tabla de enrutamiento', 'Arma una trama nueva y la envía por la interfaz de salida'], 'Recibir, desencapsular, restar el TTL, decidir y volver a encapsular.'),
        ios('showroute'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 7 */
  {
    slug: 'primeros-pasos-en-cisco-ios',
    titulo: 'Primeros pasos en Cisco IOS',
    resumen: 'Conectarse por consola, moverse entre los modos, usar la ayuda, hacer la configuración mínima de un equipo y guardarla.',
    nivel: 'medio',
    objetivos: [
      'Reconocer cada modo de IOS por su prompt y moverse entre ellos.',
      'Usar la ayuda `?`, el autocompletado y las abreviaturas.',
      'Hacer la configuración básica: nombre, contraseñas, dirección IP y puerta de enlace.',
      'Explicar la diferencia entre running-config y startup-config, y guardar los cambios.',
    ],
    bloques: [
      h('Qué es IOS'),
      p('**Cisco IOS** es el sistema operativo de los routers y switches de Cisco. No tiene ventanas ni ratón: se maneja escribiendo comandos en una **línea de comandos** (CLI). Al principio intimida, pero sigue unas pocas reglas muy regulares, y una vez que las entiendes todo encaja.\n\nPara el examen CCST no hace falta ser experto en configurar. Sí hace falta **orientarse**: saber en qué modo estás, pedir ayuda al propio equipo y ejecutar los comandos `show` que te pida un ingeniero.'),

      h('Conectarse'),
      tabla(['Forma', 'Qué necesitas', 'Cuándo se usa'], [
        ['**Consola**', 'Cable de consola y un emulador de terminal a 9600 8N1', 'Equipo nuevo, sin IP, o cuando la red no funciona.'],
        ['**SSH**', 'Que el equipo tenga IP, y usuario y contraseña', 'El acceso remoto normal. Va **cifrado**.'],
        ['**Telnet**', 'Que el equipo tenga IP', 'Acceso remoto antiguo. Va **en texto claro**: no debe usarse.'],
      ]),
      p('Al conectarte, el equipo muestra su nombre seguido de un símbolo. Ese conjunto se llama **prompt**, y es tu brújula: te dice en todo momento en qué modo estás.'),

      h('Los modos'),
      p('IOS se organiza en **modos**, como los pisos de un edificio: cada piso tiene sus propias puertas (comandos), y para llegar a los de arriba hay que pasar por los de abajo.'),
      tabla(['Modo', 'Prompt', 'Qué se puede hacer'], [
        ['**EXEC de usuario**', '`Switch>`', 'Mirar poco: algunos `show`, `ping`. No se puede cambiar nada.'],
        ['**EXEC privilegiado**', '`Switch#`', 'Verlo todo (`show running-config`), guardar, reiniciar, depurar.'],
        ['**Configuración global**', '`Switch(config)#`', 'Cambiar ajustes de todo el equipo.'],
        ['**Configuración de interfaz**', '`Switch(config-if)#`', 'Cambiar ajustes de un puerto concreto.'],
        ['**Configuración de línea**', '`Switch(config-line)#`', 'Cambiar ajustes de la consola o del acceso remoto.'],
      ]),
      nota('clave', 'Lee siempre el prompt antes de escribir. `>` = usuario. `#` = privilegiado. Y si hay **paréntesis**, estás configurando: lo que escribas **cambia el equipo al instante**.'),

      h('Moverse entre los modos'),
      codigo('Subir y bajar', `Switch> enable
Switch# configure terminal
Enter configuration commands, one per line.  End with CNTL/Z.
Switch(config)# interface gigabitEthernet 0/1
Switch(config-if)# exit
Switch(config)# line console 0
Switch(config-line)# end
Switch# disable
Switch>`),
      tabla(['Comando', 'Qué hace'], [
        ['`enable`', 'De usuario a privilegiado. Pide contraseña si está configurada.'],
        ['`disable`', 'De privilegiado a usuario.'],
        ['`configure terminal`', 'De privilegiado a configuración global.'],
        ['`interface …` / `line …`', 'De configuración global a un submodo.'],
        ['`exit`', 'Sube **un** nivel. En el modo de usuario o privilegiado, cierra la sesión.'],
        ['`end` o Ctrl+Z', 'Vuelve **de un salto** al modo privilegiado desde cualquier modo de configuración.'],
      ]),
      ejemplo('facil', 'Entrar al modo privilegiado', ios('enable')),
      ejemplo('facil', 'Entrar a configurar', ios('conft')),
      ejemplo('medio', '¿Dónde se escribe?', modo('showrun')),
      ejemplo('medio', 'Un ajuste de todo el equipo', modo('hostname')),
      ejemplo('medio', 'Un ajuste de un solo puerto', modo('ipadd')),
      ejemplo('dificil', 'Un ajuste del acceso', modo('login')),

      h('Niveles de privilegio'),
      p('Detrás de los modos hay números. IOS tiene **16 niveles de privilegio**, del 0 al 15:'),
      tabla(['Nivel', 'Corresponde a', 'Prompt'], [
        ['1', 'EXEC de usuario', '`>`'],
        ['15', 'EXEC privilegiado: control total', '`#`'],
        ['2 a 14', 'Niveles intermedios que un administrador puede definir a medida', '`#`'],
      ]),
      p('El comando `show privilege` dice en qué nivel estás. A un técnico de soporte suelen darle una cuenta con permisos limitados: lo justo para consultar, sin poder cambiar la configuración.'),

      h('La ayuda: el signo de interrogación'),
      p('No hay que memorizar todos los comandos. IOS te los dice si se lo preguntas con `?`:'),
      tabla(['Escribes', 'IOS responde con'], [
        ['`?`', 'Todos los comandos disponibles en el modo actual.'],
        ['`sh?` (sin espacio)', 'Los comandos que **empiezan** por «sh».'],
        ['`show ?` (con espacio)', 'Lo que puede venir **después** de `show`.'],
        ['`show ip ?`', 'Lo que puede venir después de `show ip`.'],
      ]),
      codigo('La ayuda en acción', `Switch# sh?
show

Switch# show ip ?
  arp        IP ARP table
  interface  IP interface status and configuration
  route      IP routing table
  ssh        Information on SSH
  <cr>

Switch# show ip interface ?
  brief      Brief summary of IP status and configuration
  <cr>`),
      p('`<cr>` (*carriage return*) significa que el comando **ya está completo** y puedes pulsar Enter.'),

      h('Tab, abreviaturas e historial'),
      lista(
        '**Tab** completa la palabra que estás escribiendo, si no hay ambigüedad: `conf` + Tab → `configure`.',
        '**Abreviar:** IOS acepta cualquier comienzo de palabra que no sea ambiguo. `conf t` = `configure terminal`; `sh ip int br` = `show ip interface brief`; `copy run start` = `copy running-config startup-config`.',
        '**Flecha arriba** (o Ctrl+P) recupera los comandos anteriores. `show history` los lista.',
        '**`no`** delante de un comando lo deshace: `shutdown` apaga una interfaz y `no shutdown` la enciende.',
        '**`do`** permite lanzar un comando `show` sin salir del modo de configuración: `do show ip interface brief`.',
        '**Ctrl+C** cancela lo que estés escribiendo. **Ctrl+Shift+6** interrumpe un `ping` o un `traceroute` en curso.',
      ),

      h('Los tres mensajes de error'),
      codigo('Errores habituales', `Switch# sh i
% Ambiguous command:  "sh i"

Switch# show ip
% Incomplete command.

Switch# show ip rute
                 ^
% Invalid input detected at '^' marker.`),
      tabla(['Mensaje', 'Qué pasó', 'Qué hacer'], [
        ['`% Ambiguous command`', 'La abreviatura sirve para varios comandos.', 'Escribe más letras, o usa `?` para ver las opciones.'],
        ['`% Incomplete command`', 'Al comando le faltan palabras.', 'Añade un espacio y `?` para ver qué sigue.'],
        ['`% Invalid input detected at \'^\' marker`', 'Hay un error de escritura, o el comando no existe **en este modo**.', 'Mira dónde apunta el `^`, y comprueba que estás en el modo correcto.'],
      ]),
      nota('truco', 'Si un comando que «debería funcionar» da *Invalid input*, lo primero es **mirar el prompt**. Casi siempre estás en el modo equivocado: por ejemplo, escribiste `show running-config` en el modo de usuario.'),
      ejemplo('medio', 'Interpretar un error', op('Un técnico escribe lo siguiente y recibe un error. ¿Cuál es la causa?',
        ['El comando está mal escrito', 'Está en el modo de usuario: ese comando exige el modo privilegiado', 'El switch no tiene configuración', 'Falta guardar la configuración'], 1, [
          'El comando `show running-config` está bien escrito: el `^` apunta al principio de `running-config`, no a una letra equivocada.',
          'El prompt es `Switch>`: modo **de usuario**. En ese modo, `show running-config` no existe.',
          'La solución es escribir `enable` y repetir el comando desde `Switch#`.',
        ], { codigo: `Switch> show running-config
              ^
% Invalid input detected at '^' marker.` })),

      h('Configuración básica de un equipo'),
      p('Estos son los ajustes mínimos que se le hacen a cualquier equipo nuevo. Léelos como una receta: cada bloque resuelve una necesidad.'),
      h3('1. Ponerle nombre'),
      codigo('hostname', `Switch> enable
Switch# configure terminal
Switch(config)# hostname SW-PISO2
SW-PISO2(config)#`),
      p('El prompt cambia al instante. Un buen nombre dice qué es el equipo y dónde está: es la primera defensa contra configurar el equipo equivocado.'),
      h3('2. Proteger el modo privilegiado'),
      codigo('enable secret', `SW-PISO2(config)# enable secret Redes2026`),
      p('`enable secret` guarda la contraseña como un **hash**: en la configuración no se puede leer. Existe también `enable password`, que la guarda en texto claro: no se usa.'),
      h3('3. Proteger la consola y el acceso remoto'),
      codigo('Líneas de consola y VTY', `SW-PISO2(config)# line console 0
SW-PISO2(config-line)# password Acceso2026
SW-PISO2(config-line)# login
SW-PISO2(config-line)# exit
SW-PISO2(config)# line vty 0 4
SW-PISO2(config-line)# password Acceso2026
SW-PISO2(config-line)# login
SW-PISO2(config-line)# transport input ssh
SW-PISO2(config-line)# exit`),
      lista(
        '`line console 0` es el puerto de consola. Solo hay uno.',
        '`line vty 0 4` son las cinco **líneas virtuales** (de la 0 a la 4) que atienden las conexiones remotas por SSH o Telnet.',
        '`password` pone la contraseña y `login` hace que **se pida**. Sin `login`, la contraseña no sirve de nada.',
        '`transport input ssh` acepta solo SSH y rechaza Telnet. Para que SSH funcione hacen falta además un usuario local, un nombre de dominio y un par de claves; es configuración que va más allá del CCST.',
      ),
      h3('4. Ofuscar las contraseñas y poner un aviso'),
      codigo('Cifrado y banner', `SW-PISO2(config)# service password-encryption
SW-PISO2(config)# banner motd #Acceso solo para personal autorizado#`),
      p('`service password-encryption` evita que las contraseñas de línea se lean a simple vista en la configuración. Es una protección débil, pero útil contra miradas curiosas. `banner motd` muestra un aviso legal a quien se conecta; el carácter `#` marca dónde empieza y dónde termina el texto.'),
      h3('5. Darle una dirección IP'),
      p('En un **router**, la IP va en cada interfaz física, que además hay que **encender**: las interfaces de un router vienen apagadas de fábrica.'),
      codigo('IP en un router', `R1(config)# interface gigabitEthernet 0/0
R1(config-if)# description LAN de oficinas
R1(config-if)# ip address 192.168.1.1 255.255.255.0
R1(config-if)# no shutdown`),
      p('En un **switch de capa 2**, los puertos físicos no llevan IP. La dirección para administrarlo se pone en una interfaz **virtual** de una VLAN, llamada **SVI**. Y como el switch no enruta, necesita su propia puerta de enlace, igual que una computadora:'),
      codigo('IP de gestión en un switch', `SW-PISO2(config)# interface vlan 1
SW-PISO2(config-if)# ip address 192.168.1.2 255.255.255.0
SW-PISO2(config-if)# no shutdown
SW-PISO2(config-if)# exit
SW-PISO2(config)# ip default-gateway 192.168.1.1`),
      nota('error', 'Dos olvidos clásicos: **no escribir `no shutdown`** en la interfaz de un router (queda *administratively down*), y **no poner `ip default-gateway`** en un switch (se le puede administrar desde su misma red, pero no desde otra).'),
      ejemplo('facil', 'Poner el nombre', ios('hostname', { nombre: 'R-SUCURSAL' })),
      ejemplo('medio', 'Asignar la dirección', ios('ipadd', { ip: '192.168.1.1', mascara: '255.255.255.0' })),
      ejemplo('medio', 'Encender la interfaz', ios('noshut')),
      ejemplo('dificil', 'La puerta de enlace del switch', ios('gw', { gw: '192.168.1.1' })),

      h('running-config y startup-config'),
      p('Este es el concepto que más disgustos evita. El equipo tiene **dos** configuraciones:'),
      tabla(['', 'running-config', 'startup-config'], [
        ['Qué es', 'La configuración **en uso ahora mismo**', 'La configuración que se carga **al arrancar**'],
        ['Dónde vive', 'En la **RAM**', 'En la **NVRAM**'],
        ['Al apagar o reiniciar', '**Se pierde**', 'Se conserva'],
        ['Cuándo cambia', 'Con cada comando de configuración, al instante', 'Solo cuando la guardas tú'],
        ['Cómo verla', '`show running-config`', '`show startup-config`'],
      ]),
      p('Es como un documento que estás editando. Lo que ves en pantalla es la running-config; el archivo guardado en el disco es la startup-config. Si se va la luz sin que hayas guardado, pierdes los cambios.'),
      codigo('Guardar', `SW-PISO2# copy running-config startup-config
Destination filename [startup-config]?
Building configuration...
[OK]`),
      nota('clave', '`copy running-config startup-config` se lee «copia **de** la running **a** la startup»: primero el origen, después el destino. Se abrevia `copy run start`. El comando antiguo `write memory` (o `wr`) hace lo mismo.'),
      ejemplo('medio', 'Guardar los cambios', ios('guardar')),
      ejemplo('dificil', 'Cambios que desaparecen', op('Un técnico configuró ayer el nombre y las contraseñas de un switch, y todo funcionaba. Esta mañana hubo un corte de luz y el switch volvió a encender con el nombre `Switch` y sin contraseñas. ¿Qué ocurrió?',
        ['El switch está averiado', 'Los cambios quedaron solo en la running-config y nunca se copiaron a la startup-config', 'Alguien borró la configuración a distancia', 'El corte de luz dañó la NVRAM'], 1, [
          'Los comandos de configuración cambian la **running-config**, que vive en la RAM.',
          'La RAM se borra al quedarse sin energía. Al arrancar, el switch carga la **startup-config** de la NVRAM.',
          'Como nadie ejecutó `copy running-config startup-config`, la startup-config seguía vacía: el switch arrancó de fábrica.',
        ])),

      h('Los comandos show que te pedirán'),
      p('La lista de comandos de consulta del temario del CCST. No cambian nada: son seguros de ejecutar.'),
      tabla(['Comando', 'Qué muestra'], [
        ['`show running-config`', 'La configuración activa.'],
        ['`show version`', 'Versión de IOS, modelo, número de serie, memoria y tiempo encendido.'],
        ['`show ip interface brief`', 'Una línea por interfaz: IP, estado físico y estado del protocolo.'],
        ['`show interfaces`', 'Todo el detalle de cada interfaz: velocidad, dúplex, errores, tráfico.'],
        ['`show interfaces status`', 'En switches: tabla con estado, VLAN, dúplex, velocidad y tipo de cada puerto.'],
        ['`show mac address-table`', 'En switches: MAC aprendidas y su puerto.'],
        ['`show ip route`', 'La tabla de enrutamiento.'],
        ['`show cdp neighbors`', 'Los equipos Cisco conectados directamente, y por qué puerto.'],
        ['`show inventory`', 'El hardware instalado: chasis, módulos y transceptores, con sus números de serie.'],
        ['`show switch`', 'En switches apilados: los miembros de la pila, su papel y su estado.'],
      ]),
      codigo('show ip interface brief', `R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     192.168.1.1     YES manual up                    up
GigabitEthernet0/1     192.168.12.1    YES manual up                    down
GigabitEthernet0/2     unassigned      YES unset  administratively down down
Serial0/0/0            203.0.113.2     YES manual down                  down`),
      tabla(['Status', 'Protocol', 'Qué significa'], [
        ['up', 'up', 'La interfaz funciona.'],
        ['administratively down', 'down', 'Está apagada por configuración: falta `no shutdown`.'],
        ['down', 'down', 'Problema físico: no hay cable, está dañado o el otro extremo está apagado.'],
        ['up', 'down', 'Hay señal, pero los dos extremos no se entienden en la capa 2.'],
      ]),
      ejemplo('medio', 'Leer el estado de las interfaces', op('Según la salida de arriba, ¿por qué no funciona `GigabitEthernet0/2`?',
        ['El cable está desconectado', 'Está apagada por configuración: falta `no shutdown`', 'Tiene una dirección IP duplicada', 'El otro extremo usa otra velocidad'], 1, [
          'La columna Status dice `administratively down`: la palabra *administratively* indica que alguien (o la configuración de fábrica) la apagó.',
          'Un cable desconectado mostraría `down` / `down`, sin esa palabra.',
          'Se arregla entrando en la interfaz y escribiendo `no shutdown`. Además, aún no tiene dirección IP (`unassigned`).',
        ])),

      h('Resumen'),
      lista(
        '`>` usuario, `#` privilegiado, `(config)#` global, `(config-if)#` interfaz, `(config-line)#` línea.',
        '`enable` → `configure terminal` → `interface` o `line`. `exit` sube uno; `end` vuelve al modo privilegiado.',
        '`?` es la ayuda, Tab completa, y las abreviaturas valen si no son ambiguas.',
        'Básico: `hostname`, `enable secret`, contraseñas con `login` en consola y VTY, `ip address` y `no shutdown`.',
        'Un switch de capa 2 lleva la IP en una SVI y necesita `ip default-gateway`.',
        'La running-config (RAM) se pierde al apagar: `copy running-config startup-config`.',
      ),

      ejercicios('Practica', 'Puedes escribir cada comando completo o abreviado. Fíjate siempre en el prompt.', [
        op('¿Qué indica el prompt `Router#`?', ['Modo EXEC de usuario', 'Modo EXEC privilegiado', 'Modo de configuración global', 'Modo de configuración de interfaz'], 1, 'El símbolo `#` sin paréntesis es el modo privilegiado. Con `>` sería el de usuario.'),
        op('¿Qué comando lleva del modo de usuario al modo privilegiado?', ['`configure terminal`', '`enable`', '`login`', '`end`'], 1, '`enable` sube al modo privilegiado. `configure terminal` solo funciona estando ya en él.'),
        ios('enable'), ios('conft'), ios('hostname', { nombre: 'SW-ALMACEN' }), ios('interfaz', { ifl: 'GigabitEthernet 0/1', ifc: 'g0/1' }), ios('end'),
        modo('enable'), modo('conft'), modo('copy'), modo('secret'), modo('linea'), modo('noshut'), modo('pass'), modo('gw'), modo('transporte'),
        ios('secret', { clave: 'Soporte24' }), ios('consola'), ios('vty'), ios('login'), ios('cifrar'), ios('svi'),
        ios('ipadd', { ip: '192.168.20.1', mascara: '255.255.255.128' }), ios('noshut'), ios('gw', { gw: '192.168.20.1' }), ios('guardar'),
        ios('showrun'), ios('showbrief'), ios('showver'), ios('showcdp'), ios('showstatus'),
        op('¿Qué diferencia hay entre escribir `sh?` y `show ?` en IOS?', ['Ninguna', '`sh?` lista los comandos que empiezan por «sh»; `show ?` lista lo que puede seguir a `show`', '`sh?` reinicia el equipo', '`show ?` solo funciona en modo de configuración'], 1, 'Sin espacio, completa la palabra; con espacio, muestra el siguiente argumento.'),
        op('¿Dónde se guarda la startup-config?', ['En la RAM', 'En la NVRAM', 'En la tabla ARP', 'En el servidor DHCP'], 1, 'La NVRAM es memoria no volátil: conserva su contenido sin energía. La running-config vive en la RAM.'),
        op('¿Por qué se prefiere `enable secret` a `enable password`?', ['Porque es más corto de escribir', 'Porque guarda la contraseña con un hash en vez de en texto claro', 'Porque no pide contraseña', 'Porque funciona sin guardar'], 1, 'Con `enable secret`, la contraseña no se puede leer en la configuración.'),
        op('IOS responde `% Incomplete command.` ¿Qué significa?', ['Que el comando no existe', 'Que faltan palabras o argumentos para completar el comando', 'Que no tienes permiso', 'Que la abreviatura sirve para varios comandos'], 1, 'El comando empezó bien pero no terminó. Añade un espacio y `?` para ver qué falta.'),
        vs('¿Cuáles **dos** comandos hacen falta para que el puerto de consola pida una contraseña?', ['`password` dentro de `line console 0`', '`enable secret`', '`login` dentro de `line console 0`', '`service password-encryption`', '`banner motd`'], [0, 2], '`password` define la contraseña y `login` activa la petición. `enable secret` protege otra cosa: el paso al modo privilegiado.'),
        vs('Un switch de capa 2 debe poder administrarse desde otra red. ¿Qué **dos** cosas hay que configurarle?', ['Una dirección IP en una SVI (`interface vlan`)', 'Una dirección IP en cada puerto físico', 'Una puerta de enlace con `ip default-gateway`', 'El comando `ip routing`', 'Una ruta estática por cada red'], [0, 2], 'La IP de gestión va en la SVI, y para responder a otras redes necesita su puerta de enlace.'),
        rel('Relaciona cada prompt con su modo.', [['Switch>', 'EXEC de usuario'], ['Switch#', 'EXEC privilegiado'], ['Switch(config)#', 'Configuración global'], ['Switch(config-if)#', 'Configuración de interfaz'], ['Switch(config-line)#', 'Configuración de línea']], 'El símbolo y lo que hay entre paréntesis identifican el modo.'),
        rel('Relaciona cada comando `show` con lo que muestra.', [['show version', 'Versión de IOS y tiempo encendido'], ['show ip interface brief', 'Resumen de interfaces con su IP y estado'], ['show cdp neighbors', 'Equipos Cisco conectados directamente'], ['show inventory', 'Hardware instalado y números de serie']], 'Son comandos del temario del CCST: conviene reconocerlos al vuelo.', ['Tabla de enrutamiento']),
        ord('Ordena los comandos para dar una dirección IP a la interfaz de un router, partiendo del modo de usuario.', ['enable', 'configure terminal', 'interface gigabitEthernet 0/0', 'ip address 192.168.1.1 255.255.255.0', 'no shutdown'], 'Hay que subir modo por modo hasta la interfaz, dar la IP y, al final, encenderla.'),
      ]),
    ],
  },
];
