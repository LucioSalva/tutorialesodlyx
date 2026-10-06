// Diagnóstico y soporte · lecciones 5 a 8: casos completos, Wireshark, acceso a los dispositivos y comandos show.
import { h, h3, p, lista, orden, tabla, nota, codigo, ejemplo, ejercicios, op, vs, rel, ord } from './_ayuda.mjs';
import { ping, cfg, tr, cmd, sh, ifz, acc, fil } from './diagnostico-1.mjs';

const BRIEF = `Router# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     192.168.10.1    YES manual up                    up
GigabitEthernet0/1     192.168.20.1    YES manual down                  down
GigabitEthernet0/2     unassigned      YES unset  administratively down down
Serial0/0/0            203.0.113.2     YES manual up                    up`;

const STATUS = `Switch# show interfaces status

Port      Name               Status       Vlan       Duplex  Speed Type
Gi1/0/1   PC-Recepcion       connected    10         a-full a-1000 10/100/1000BaseTX
Gi1/0/2                      notconnect   1            auto   auto 10/100/1000BaseTX
Gi1/0/3   Impresora          connected    20         a-full  a-100 10/100/1000BaseTX
Gi1/0/4                      disabled     1            auto   auto 10/100/1000BaseTX
Gi1/0/5   PC-Caja            err-disabled 10           auto   auto 10/100/1000BaseTX
Gi1/0/24  Enlace-SW2         connected    trunk      a-full a-1000 10/100/1000BaseTX`;

const RUTAS = `Router# show ip route
Codes: L - local, C - connected, S - static, O - OSPF, * - candidate default

Gateway of last resort is 203.0.113.1 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 203.0.113.1
      192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.10.0/24 is directly connected, GigabitEthernet0/0
L        192.168.10.1/32 is directly connected, GigabitEthernet0/0
S     192.168.30.0/24 [1/0] via 192.168.10.2
      203.0.113.0/24 is variably subnetted, 2 subnets, 2 masks
C        203.0.113.0/30 is directly connected, Serial0/0/0
L        203.0.113.2/32 is directly connected, Serial0/0/0`;

const CDP = `SW1# show cdp neighbors
Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge
                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone

Device ID        Local Intrfce     Holdtme    Capability  Platform   Port ID
SW2              Gig 1/0/24        154            S I     WS-C2960X  Gig 1/0/24
R1               Gig 1/0/23        132            R S I   ISR4321    Gig 0/0/1
SEP0C1A2B3C4D77  Gig 1/0/7         141            H P     IP Phone   Port 1`;

const MACS = `SW1# show mac address-table
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  10    0050.56a1.0b01    DYNAMIC     Gi1/0/1
  10    0050.56a1.0b02    DYNAMIC     Gi1/0/2
  20    0050.56a1.0c11    DYNAMIC     Gi1/0/3
  10    0050.56a1.0d21    DYNAMIC     Gi1/0/24
  10    0050.56a1.0d22    DYNAMIC     Gi1/0/24
  20    0050.56a1.0d23    DYNAMIC     Gi1/0/24
Total Mac Addresses for this criterion: 6`;

const IFDET = `Switch# show interfaces GigabitEthernet1/0/3
GigabitEthernet1/0/3 is up, line protocol is up (connected)
  Hardware is Gigabit Ethernet, address is 0c1a.2b3c.4d03 (bia 0c1a.2b3c.4d03)
  Description: Impresora
  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec,
  Half-duplex, 100Mb/s, media type is 10/100/1000BaseTX
  5 minute input rate 3000 bits/sec, 4 packets/sec
  5 minute output rate 9000 bits/sec, 8 packets/sec
     85210 packets input, 9912045 bytes
     1432 input errors, 1398 CRC, 34 frame, 0 overrun, 0 ignored
     120377 packets output, 15220981 bytes
     0 output errors, 2291 collisions, 3 interface resets
     0 babbles, 517 late collision, 0 deferred`;

export default [
  /* ------------------------------------------------------------------ 5 */
  {
    slug: 'diagnostico-paso-a-paso',
    titulo: 'Diagnóstico paso a paso: casos completos',
    resumen: 'Cinco averías típicas resueltas de principio a fin combinando las herramientas, y cómo un firewall cambia lo que ves en ping y traceroute.',
    nivel: 'dificil',
    objetivos: [
      'Combinar ipconfig, ping, tracert y nslookup en un diagnóstico ordenado.',
      'Reconocer por sus síntomas las cinco averías más comunes.',
      'Explicar cómo un firewall altera los resultados de ping y traceroute.',
      'Relacionar cada síntoma con la capa del modelo OSI donde suele estar la causa.',
    ],
    bloques: [
      h('La rutina completa'),
      p(`Ya conoces las herramientas por separado. Ahora toca usarlas **juntas y en orden**, como un médico que primero toma la temperatura, luego la presión y solo después pide análisis. Esta es la rutina que resuelve la gran mayoría de los casos de «no tengo red»:`),
      tabla(['Paso', 'Qué haces', 'Qué buscas', 'Capa'], [
        ['1', 'Miras el **enlace**: LED del puerto, icono de red, «cable desconectado».', '¿Hay señal física?', '1'],
        ['2', '`ipconfig /all`', '¿Tiene IP válida (no 169.254)? ¿Máscara, puerta de enlace y DNS correctos?', '3'],
        ['3', '`ping` a la puerta de enlace', '¿Funciona la red local?', '1–3'],
        ['4', '`ping 8.8.8.8` (una IP remota)', '¿Hay salida a otras redes?', '3'],
        ['5', '`ping` o `nslookup` a un nombre', '¿Funciona el DNS?', '7'],
        ['6', '`tracert` al destino que falla', '¿Hasta dónde llega el paquete?', '3'],
        ['7', 'Pruebas la aplicación o el puerto concreto', '¿Falla el servicio, no la red?', '4–7'],
      ]),
      nota('clave', `No hace falta dar siempre los siete pasos. Cada resultado te dice **cuál es el siguiente**. Si el paso 2 muestra una dirección 169.254, ya tienes el diagnóstico (no hay DHCP) y no tiene sentido hacer ping a Internet.`),

      h('Caso 1: no hay enlace'),
      p(`**Síntoma:** el icono de red muestra una X o «cable de red desconectado». El LED del puerto está apagado.`),
      codigo('ipconfig cuando no hay enlace', `C:\\> ipconfig

Adaptador de Ethernet Ethernet0:

   Estado de los medios. . . . . . . . . . . : medios desconectados
   Sufijo DNS específico para la conexión. . :`),
      p(`**«Medios desconectados»** es Windows diciéndote que la tarjeta no detecta señal. Es un problema de **capa 1** y no hay nada más que probar hasta resolverlo: sin enlace, todo lo demás falla.`),
      orden(
        '¿El cable está bien encajado en **los dos** extremos? (el clic del conector)',
        '¿Está conectado a la roseta o al puerto correcto?',
        'Prueba con **otro cable** que sepas que funciona (sustitución).',
        'Prueba en **otro puerto** del switch.',
        'En el switch: ¿el puerto está apagado (`disabled`) o en `err-disabled`?',
      ),
      ejemplo('facil', 'Medios desconectados', op('Un usuario no tiene red. `ipconfig` muestra «Estado de los medios: medios desconectados» en su adaptador Ethernet. ¿Cuál es el siguiente paso lógico?',
        ['Ejecutar `nslookup` para comprobar el DNS', 'Revisar el cable y el puerto del switch: es un problema de capa física', 'Ejecutar `ipconfig /flushdns`', 'Hacer un `tracert` a Internet'], 1,
        ['«Medios desconectados» significa que la tarjeta no detecta señal eléctrica: no hay enlace.',
          'Sin enlace físico, ninguna prueba de capas superiores puede funcionar: `nslookup` y `tracert` fallarán seguro y no aportarán información.',
          'Enfoque ascendente: cable bien encajado en los dos extremos, otro cable, otro puerto, y el estado del puerto en el switch.'])),

      h('Caso 2: no recibe dirección (DHCP)'),
      p(`**Síntoma:** hay enlace (el LED está encendido), pero «no hay Internet». \`ipconfig\` muestra una dirección **169.254.x.x**.`),
      p(`El equipo pidió configuración por DHCP y nadie contestó. La pregunta es **por qué** la petición no llegó al servidor o la respuesta no volvió:`),
      tabla(['Causa', 'Cómo se reconoce'], [
        ['El puerto del switch está en una **VLAN equivocada**', 'Les pasa a uno o pocos equipos, justo tras un cambio de puerto o de switch.'],
        ['El **servidor DHCP está caído**', 'Les pasa a todos los que encienden o renuevan; los que ya tenían dirección siguen funcionando un tiempo.'],
        ['El **rango de direcciones se agotó**', 'Los equipos nuevos no obtienen dirección; los antiguos sí. Típico en redes de invitados.'],
        ['Problema de **Wi-Fi**: contraseña o autenticación', 'El equipo aparece «conectado» pero sin Internet.'],
      ]),
      ejemplo('medio', 'APIPA en un solo equipo', op('Tras reemplazar un switch, la PC de recepción muestra la dirección 169.254.44.9. Las otras once PC conectadas al mismo switch funcionan bien y obtienen direcciones 192.168.10.x. ¿Cuál es la causa más probable?',
        ['El servidor DHCP está apagado', 'El rango de direcciones DHCP se agotó', 'El puerto de esa PC quedó en una VLAN distinta a la de las demás', 'El servidor DNS no responde'], 2,
        ['169.254.x.x = el equipo no recibió respuesta del DHCP. Hay que averiguar por qué.',
          'Las otras once PC del mismo switch **sí** obtienen dirección: el servidor DHCP funciona y le quedan direcciones. Eso descarta las dos primeras opciones.',
          'El problema es de **ese puerto**. Hubo un cambio reciente (el switch): lo más probable es que su puerto quedara en la VLAN por defecto y no en la de las demás, así que su petición DHCP nunca llega al servidor. Se confirma con `show vlan brief` o `show interfaces status`.'])),

      h('Caso 3: llega a la puerta de enlace, pero no a Internet'),
      p(`**Síntoma:** la configuración IP es correcta, el ping a la puerta de enlace responde, pero nada de fuera funciona. El problema está **del router hacia afuera**.`),
      ejemplo('medio', 'La red local está bien', ping(3)),
      p(`El siguiente paso es un \`tracert\`: dirá hasta qué router llega el paquete.`),
      ejemplo('medio', 'El paquete muere tras el segundo salto', tr('corte', 2)),
      p(`Si la traza se corta en el **primer salto** (tu propio router), el problema es tuyo: la conexión WAN del router, su configuración o su ruta por defecto. Si se corta **más allá**, ya en la red del proveedor, lo que corresponde es **llamar al proveedor** con la traza en la mano: es la mejor prueba que puedes darle.`),

      h('Caso 4: funciona por IP, pero no por nombre'),
      p(`**Síntoma:** «no abre ninguna página», pero los programas que no usan nombres (o que ya tenían la dirección guardada) siguen funcionando.`),
      ejemplo('facil', 'El DNS', ping(4)),
      p(`Confirmación: \`nslookup\` con el servidor configurado falla, y con otro servidor (\`nslookup nombre 8.8.8.8\`) funciona. Causas habituales: el servidor DNS configurado está caído, la dirección del DNS está mal escrita, o el campo quedó vacío en una configuración manual.`),
      ejemplo('medio', 'Configuración sin DNS', cfg('192.168.20.14', 24, '192.168.20.1', '', false)),

      h('Caso 5: falla un solo sitio'),
      p(`**Síntoma:** todo funciona excepto un sitio web o un servidor concreto.`),
      p(`Si todo lo demás funciona, **tu red está bien**. Las preguntas cambian:`),
      lista(
        '¿Les falla **a todos** o solo a este usuario? Pruébalo desde otro equipo, e incluso desde otra red (los datos del móvil).',
        '¿El nombre **resuelve**? (`nslookup`)',
        '¿El servidor **responde al ping**? Ojo: muchos servidores no responden ping y aun así funcionan.',
        '¿Hasta dónde llega el **tracert**?',
        '¿El **servicio** está en marcha? Puede que el servidor esté encendido pero el servicio web no.',
      ),
      ejemplo('dificil', 'Un solo sitio, desde todas partes', op('Los usuarios no pueden abrir `https://portal.example.org`. Todo lo demás en Internet funciona. Desde tu equipo: `nslookup portal.example.org` devuelve 198.51.100.25; `ping 198.51.100.25` responde con 20 ms; el navegador muestra «No se puede acceder a este sitio: se rechazó la conexión». Con los datos del teléfono móvil ocurre lo mismo. ¿Dónde está el problema?',
        ['En el DNS de tu empresa', 'En el firewall de tu empresa', 'En el servidor de destino: el servicio web no está en marcha o rechaza las conexiones', 'En el cable de red de los usuarios'], 2,
        ['El nombre resuelve: el DNS funciona. El ping responde: hay ruta de ida y de vuelta hasta el servidor. La red, de la capa 1 a la 3, está bien.',
          'Falla también con los datos del móvil, que no pasan por la red de la empresa. Eso descarta el firewall y el DNS corporativos.',
          '«Se rechazó la conexión» significa que el servidor **contestó activamente que no** en ese puerto: está encendido, pero nada escucha en el 443 (el servicio web está detenido). No es algo que puedas arreglar: se avisa a los responsables del portal.'])),

      h('El efecto de los firewalls'),
      p(`Un **firewall** es un filtro que decide qué tráfico pasa y cuál no. Es imprescindible para la seguridad, pero **cambia lo que ven tus herramientas**, y si no lo tienes presente llegarás a conclusiones equivocadas.`),
      tabla(['Lo que ves', 'Lo que quizá ocurre', 'Cómo comprobarlo'], [
        ['El ping a un servidor no responde', 'El servidor funciona, pero su firewall **descarta ICMP**.', 'Prueba el servicio real: abre la página, conecta por SSH.'],
        ['El ping responde, pero la aplicación no conecta', 'El firewall permite ICMP y **bloquea el puerto** de la aplicación.', 'Revisa las reglas para ese puerto.'],
        ['`* * *` en uno o varios saltos de traceroute', 'Routers o firewalls que no contestan con «Tiempo excedido».', 'Mira si los saltos posteriores responden.'],
        ['La traza termina en asteriscos, pero el sitio funciona', 'El destino no contesta a los paquetes de la traza.', 'Abre el servicio: si funciona, no hay avería.'],
        ['Funciona desde dentro de la oficina y no desde fuera', 'El firewall perimetral bloquea las conexiones entrantes.', 'Compara las dos pruebas.'],
      ]),
      nota('aviso', `**Que un ping no responda no demuestra que el equipo esté apagado.** Windows, por ejemplo, trae su firewall configurado para no contestar ping en redes públicas. Antes de dar un servidor por caído, prueba el servicio que realmente interesa.`),
      p(`También hay que distinguir cómo falla una conexión a un puerto, porque cada forma apunta a una causa:`),
      tabla(['Lo que ocurre', 'Mensaje típico', 'Qué significa'], [
        ['La conexión se **rechaza** al instante', '«Conexión rechazada»', 'El equipo respondió que no: el puerto está **cerrado** (no hay servicio escuchando).'],
        ['La conexión **se queda esperando** y caduca', '«Se agotó el tiempo de espera»', 'Nadie respondió: un firewall **descarta** el tráfico en silencio (puerto filtrado), o el equipo no existe.'],
      ]),
      ejemplo('dificil', 'El ping no responde, pero el servicio sí', op('Un técnico afirma que el servidor web 203.0.113.80 «está caído» porque `ping 203.0.113.80` da «Tiempo de espera agotado». Sin embargo, los usuarios abren su página sin problema. ¿Cuál es la explicación?',
        ['Los usuarios están viendo una copia guardada en su navegador', 'Un firewall descarta los mensajes ICMP, pero permite el tráfico web (TCP 443)', 'El servidor tiene dos direcciones IP', 'El DNS apunta a otro servidor'], 1,
        ['Los usuarios abren la página: el servidor está encendido y el servicio web funciona. El técnico se equivoca.',
          'Lo que falla es solo el ping, que usa ICMP. Es habitual que el firewall de un servidor público descarte ICMP para no revelar información y para evitar abusos.',
          'Un firewall filtra **por protocolo y por puerto**: puede bloquear ICMP y permitir TCP 443 al mismo tiempo. La prueba correcta para un servidor web es abrir la página, no hacerle ping.'])),
      ejemplo('dificil', 'El ping responde, pero la aplicación no', op('Desde una PC, `ping 10.20.0.15` (el servidor de base de datos) responde bien. Pero la aplicación, que se conecta a ese servidor por el puerto TCP 1433, muestra «Se agotó el tiempo de espera de la conexión». Desde otra PC de la misma red del servidor, la aplicación funciona. ¿Cuál es la causa más probable?',
        ['El servidor está apagado', 'Un firewall entre las dos redes permite ICMP, pero descarta el puerto TCP 1433', 'El DNS no resuelve el nombre del servidor', 'El cable de la PC está dañado'], 1,
        ['El ping responde: el servidor está encendido y hay ruta. El cable de la PC está bien. No interviene el DNS porque se usó la dirección IP.',
          'Desde la red del propio servidor, la aplicación funciona: el servicio está en marcha y escucha en el 1433.',
          'La diferencia entre la PC que funciona y la que no es que una debe **cruzar** de una red a otra. Y el fallo es un tiempo de espera agotado, no un rechazo: algo descarta el tráfico en silencio. Es un firewall que deja pasar ICMP y filtra TCP 1433.'])),

      h('Síntoma → capa → causa probable'),
      tabla(['Síntoma', 'Capa', 'Causas probables'], [
        ['LED apagado, «medios desconectados»', '1 · Física', 'Cable suelto o dañado, puerto apagado, equipo del otro extremo apagado'],
        ['Hay enlace, muchos errores CRC o colisiones', '1–2', 'Cable defectuoso, interferencias, desajuste de dúplex'],
        ['Enlace correcto, pero dirección 169.254.x.x', '2–3', 'VLAN equivocada, DHCP caído o sin direcciones'],
        ['Ping a la puerta de enlace falla (con IP correcta)', '2–3', 'VLAN, puerta de enlace mal escrita o fuera de la subred, router apagado'],
        ['Puerta de enlace responde, Internet no', '3 · Red', 'Ruta por defecto, enlace WAN, proveedor, firewall'],
        ['IP responde, el nombre no', '7 · Aplicación (DNS)', 'Servidor DNS caído, mal configurado o vacío'],
        ['Ping responde, la aplicación no conecta', '4–7', 'Puerto bloqueado por firewall, servicio detenido, credenciales'],
        ['Todo funciona, pero muy lento', 'Varias', 'Enlace saturado, pérdida de paquetes, Wi-Fi débil, desajuste de dúplex'],
      ]),

      h('Resumen'),
      lista(
        'Rutina: **enlace → ipconfig → puerta de enlace → IP remota → nombre → tracert → aplicación**.',
        'Cada resultado decide el siguiente paso; no hace falta darlos todos.',
        '«Medios desconectados» = capa 1. «169.254» = sin DHCP. Puerta de enlace sí e Internet no = del router hacia afuera. IP sí y nombre no = DNS.',
        'Si todo funciona menos un sitio, tu red está bien: mira ese sitio.',
        'Un firewall puede bloquear ICMP y permitir el servicio, o al revés. **Un ping sin respuesta no prueba que el equipo esté apagado.**',
        '«Conexión rechazada» = puerto cerrado. «Tiempo de espera agotado» = alguien descarta en silencio.',
      ),

      ejercicios('Practica', 'Escenarios completos. Antes de responder, anota mentalmente qué queda descartado por cada prueba que funcionó.', [
        ping(2, '192.168.10.44', '192.168.10.1', '203.0.113.80', 'www.example.com'), ping(3, '172.20.4.60', '172.20.4.1', '198.51.100.7', 'correo.example.net'), ping(4, '10.0.5.31', '10.0.5.254', '192.0.2.44', 'intranet.example.com'), ping(5, '192.168.1.90', '192.168.1.254', '203.0.113.10', 'tienda.example.com'), ping(1, '10.10.30.12', '10.10.30.1', '198.51.100.25', 'portal.example.org'),
        cfg('169.254.200.3', 16, '', ''), cfg('192.168.1.130', 25, '192.168.1.126', '8.8.8.8', false), cfg('10.50.7.63', 26, '10.50.7.1', '1.1.1.1', false), cfg('172.16.4.200', 23, '172.16.5.254', '9.9.9.9'),
        tr('corte', 2, '192.0.2.200'), tr('silencioso', 4, '198.51.100.77'), tr('bucle', 3, '203.0.113.200'), tr('ok', 0, '198.51.100.77'),
        op('`ipconfig` muestra «Estado de los medios: medios desconectados». ¿En qué capa está el problema?', ['Capa 1, física', 'Capa 3, red', 'Capa 4, transporte', 'Capa 7, aplicación'], 0, 'El adaptador no detecta señal: es un problema físico (cable, puerto o el equipo del otro extremo).'),
        op('Todos los equipos nuevos de la red de invitados obtienen 169.254.x.x; los que llevan días conectados funcionan. ¿Cuál es la causa más probable?', ['El DNS está caído', 'El rango de direcciones del DHCP se agotó', 'El cable principal está roto', 'La puerta de enlace está apagada'], 1, 'Los antiguos conservan su concesión; los nuevos no encuentran dirección libre. Si el cable principal o la puerta de enlace fallaran, tampoco funcionarían los antiguos.'),
        op('Un `tracert` muestra respuesta en el salto 1 (tu router) y asteriscos desde el salto 2 hasta el 30. ¿A quién corresponde revisar primero?', ['Al usuario: su tarjeta de red', 'A ti: la conexión WAN y la ruta por defecto de tu router; después, al proveedor', 'Al administrador del servidor de destino', 'A nadie: es normal'], 1, 'El paquete llega a tu router y se pierde justo después: o tu router no tiene salida (WAN caída, sin ruta por defecto) o el primer equipo del proveedor no responde.'),
        op('Un servidor responde al ping, pero el navegador muestra «Se rechazó la conexión» al abrir su página. ¿Qué indica?', ['Que el servidor está apagado', 'Que el equipo respondió, pero no hay ningún servicio escuchando en ese puerto', 'Que el DNS falla', 'Que el cable está desconectado'], 1, 'Un rechazo es una respuesta activa: el servidor existe y está encendido, pero el puerto está cerrado (servicio detenido).'),
        op('Una conexión a un puerto queda esperando 20 segundos y termina con «Se agotó el tiempo de espera». ¿Qué es lo más probable?', ['El puerto está abierto', 'Un firewall descarta el tráfico en silencio, o el equipo no existe', 'El servicio rechazó las credenciales', 'El DNS devolvió dos direcciones'], 1, 'Nadie contestó. Un puerto cerrado respondería con un rechazo inmediato; el silencio es típico de un firewall que descarta.'),
        op('Un sitio web no abre desde la oficina, pero sí desde los datos del móvil. ¿Dónde es más probable que esté el problema?', ['En el servidor del sitio', 'En la red de la oficina: su DNS, su firewall o su proveedor', 'En el dominio, que venció', 'En el navegador del móvil'], 1, 'Si desde otra red funciona, el servidor y el dominio están bien. Lo que cambia entre las dos pruebas es la red de la oficina.'),
        op('Un usuario dice que «Internet va lentísimo». `ping -t` a la puerta de enlace muestra tiempos de 1 ms y de vez en cuando «Tiempo de espera agotado» (15 % de pérdida). ¿Qué revisas primero?', ['El servidor DNS', 'El tramo local: cable, puerto del switch o señal Wi-Fi', 'El proveedor de Internet', 'El servidor web de destino'], 1, 'Hay pérdida ya en el primer tramo, hasta la puerta de enlace. Antes de mirar más lejos hay que arreglar lo local: cable dañado, puerto con errores o Wi-Fi débil.'),
        vs('`ping 203.0.113.80` no responde. ¿Qué DOS explicaciones son posibles?', ['El servidor está apagado o no hay ruta', 'Un firewall descarta ICMP aunque el servidor funcione', 'El nombre no se resolvió', 'El equipo usa IPv6 exclusivamente y por eso responde', 'El ping usa TCP y el puerto está cerrado'], [0, 1], 'El silencio puede ser un equipo apagado o inalcanzable, o un firewall. No interviene el DNS (se usó una IP), y ping no usa TCP.'),
        vs('La PC tiene IP 192.168.10.50/24 y obtiene respuesta al ping de 192.168.10.1 (puerta de enlace), pero no de 8.8.8.8. ¿Qué DOS cosas quedan descartadas?', ['El cable y la tarjeta de red de la PC', 'El enlace del router hacia Internet', 'La red local entre la PC y el router', 'El proveedor de Internet', 'La ruta por defecto del router'], [0, 2], 'El ping a la puerta de enlace prueba el equipo y la red local. Lo que queda por revisar está del router hacia afuera.'),
        rel('Relaciona cada síntoma con su causa más probable.', [
          ['Dirección 169.254.x.x', 'No hay respuesta del DHCP'],
          ['Medios desconectados', 'No hay enlace físico'],
          ['Responde por IP, no por nombre', 'Fallo de DNS'],
          ['Ping sí, aplicación no', 'Puerto bloqueado o servicio detenido'],
        ], 'Cada síntoma señala una capa: APIPA apunta al DHCP, «medios desconectados» a la capa física, nombres al DNS, y un ping correcto con la aplicación caída a transporte o aplicación.', ['Bucle de enrutamiento']),
        ord('Un usuario «no tiene Internet». Ordena las comprobaciones de la rutina de diagnóstico.', ['Comprobar que hay enlace (LED, icono de red)', 'Revisar la configuración con ipconfig /all', 'Hacer ping a la puerta de enlace', 'Hacer ping a una IP de Internet', 'Hacer ping a un nombre'], 'Se avanza de lo físico a lo lógico y de lo cercano a lo lejano: enlace, configuración IP, red local, salida a Internet y, por último, nombres.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 6 */
  {
    slug: 'wireshark-y-captura-de-paquetes',
    titulo: 'Wireshark y la captura de paquetes',
    resumen: 'Para qué sirve un analizador de protocolos, cómo capturar, los tres paneles, los filtros de visualización, reconocer DNS, DHCP y el saludo TCP, y guardar una captura .pcap.',
    nivel: 'medio',
    objetivos: [
      'Explicar para qué sirve un analizador de paquetes y cuándo usarlo.',
      'Iniciar, detener, guardar y abrir una captura (.pcap y .pcapng).',
      'Escribir filtros de visualización básicos.',
      'Reconocer en una captura el saludo de tres vías, una consulta DNS y la negociación DHCP.',
    ],
    bloques: [
      h('Qué es un analizador de paquetes'),
      p(`Las herramientas anteriores te dicen **si** algo funciona. Un **analizador de paquetes** te deja ver **qué se dicen exactamente** los equipos. Es como pasar de saber que dos personas hablaron por teléfono a escuchar la grabación de la llamada.

**Wireshark** es el analizador más usado: gratuito, de código abierto y disponible para Windows, Linux y macOS. Captura todo lo que entra y sale por una tarjeta de red y lo muestra descifrado, protocolo por protocolo.`),
      tabla(['Sirve para…', 'Ejemplo'], [
        ['**Comprobar** qué ocurre de verdad', '¿El equipo envía la petición DHCP? ¿Alguien le contesta?'],
        ['**Diagnosticar** lo que las demás herramientas no explican', 'La aplicación se conecta pero se corta a los 30 segundos.'],
        ['**Aprender** cómo funcionan los protocolos', 'Ver con tus ojos el saludo de tres vías de TCP.'],
        ['**Aportar pruebas** al escalar', 'Adjuntar la captura al ticket para el ingeniero o el fabricante.'],
        ['**Detectar** tráfico extraño', 'Un equipo que envía miles de paquetes a destinos desconocidos.'],
      ]),
      nota('aviso', `**Capturar tráfico es delicado.** En una captura pueden aparecer contraseñas de protocolos sin cifrar, correos y datos personales. Captura **solo con autorización**, solo en redes de las que eres responsable, solo lo necesario, y trata el archivo como información confidencial. Capturar el tráfico de otras personas sin permiso puede ser ilegal.`),

      h('Capturar: elegir interfaz, iniciar y detener'),
      orden(
        'Abre Wireshark. La pantalla inicial lista las **interfaces** del equipo (Ethernet, Wi-Fi, loopback…), cada una con una pequeña gráfica de actividad.',
        'Elige la interfaz **por la que pasa el tráfico que te interesa**: la que tiene la gráfica en movimiento. Si el equipo está por cable, Ethernet; si está por Wi-Fi, la inalámbrica.',
        'Haz doble clic en ella, o pulsa el botón de la **aleta azul de tiburón**, para **iniciar** la captura.',
        '**Reproduce el problema**: abre la página que falla, lanza el ping, renueva la dirección.',
        'Pulsa el **cuadrado rojo** para **detener**. Cuanto más corta sea la captura, más fácil será leerla.',
      ),
      nota('error', `El error de principiante es capturar en la **interfaz equivocada** y encontrar la lista vacía, o llena de tráfico que no tiene nada que ver. Si no ves lo que esperas, comprueba primero qué interfaz elegiste.`),
      p(`Importante: Wireshark en tu PC solo ve el tráfico que **llega a tu tarjeta**: el tuyo, el de difusión y el de multidifusión. En una red con switches no ves las conversaciones de los demás equipos. Para verlas, el administrador configura en el switch un **puerto espejo** (SPAN), que copia el tráfico de otro puerto hacia el tuyo.`),

      h('Los tres paneles'),
      tabla(['Panel', 'Dónde está', 'Qué muestra'], [
        ['**Lista de paquetes**', 'Arriba', 'Una línea por paquete: número, tiempo, origen, destino, protocolo, longitud e información resumida.'],
        ['**Detalles del paquete**', 'En medio', 'El paquete elegido, desglosado por capas que se pueden desplegar: trama, Ethernet, IP, TCP/UDP y aplicación.'],
        ['**Bytes del paquete**', 'Abajo', 'El contenido en bruto, en hexadecimal y en texto.'],
      ]),
      codigo('Lista de paquetes: un ping', `No.  Time      Source          Destination     Protocol Length Info
  1  0.000000  192.168.1.25    192.168.1.1     ICMP     74     Echo (ping) request  id=0x0001, seq=1, ttl=128
  2  0.001204  192.168.1.1     192.168.1.25    ICMP     74     Echo (ping) reply    id=0x0001, seq=1, ttl=64
  3  1.004811  192.168.1.25    192.168.1.1     ICMP     74     Echo (ping) request  id=0x0001, seq=2, ttl=128
  4  1.005990  192.168.1.1     192.168.1.25    ICMP     74     Echo (ping) reply    id=0x0001, seq=2, ttl=64`),
      p(`Aquí se ve el ping por dentro: la PC (TTL 128, Windows) pregunta y el router (TTL 64) contesta. Cada \`request\` tiene su \`reply\`. Si solo aparecieran las peticiones, sabrías que **salen pero nadie contesta**: justo lo que el comando ping resume como «tiempo de espera agotado».`),
      codigo('Detalles del paquete 1: las capas, una dentro de otra', `> Frame 1: 74 bytes on wire (592 bits), 74 bytes captured
> Ethernet II, Src: 00:1a:2b:3c:4d:5e, Dst: 0c:1a:2b:3c:4d:01
> Internet Protocol Version 4, Src: 192.168.1.25, Dst: 192.168.1.1
> Internet Control Message Protocol`),
      p(`Este panel es el modelo de capas **hecho visible**: la trama Ethernet (capa 2, con direcciones MAC) lleva dentro un paquete IP (capa 3, con direcciones IP), que lleva dentro el mensaje ICMP. Cada línea se despliega para ver todos sus campos.`),

      h('Filtros de visualización'),
      p(`Una captura de un minuto puede tener decenas de miles de paquetes. El **filtro de visualización** se escribe en la barra superior y **oculta** todo lo que no coincide. No borra nada: al quitar el filtro, todo vuelve a aparecer.`),
      tabla(['Filtro', 'Deja a la vista'], [
        ['`icmp`', 'Solo ICMP (los ping).'],
        ['`dns`', 'Solo consultas y respuestas DNS.'],
        ['`arp`', 'Solo ARP.'],
        ['`dhcp`', 'Solo DHCP (en versiones antiguas, `bootp`).'],
        ['`http`', 'Solo HTTP sin cifrar.'],
        ['`tcp` · `udp`', 'Solo ese protocolo de transporte.'],
        ['`ip.addr == 192.168.1.25`', 'Todo lo que tenga esa dirección como origen **o** destino.'],
        ['`ip.src == 192.168.1.25`', 'Solo lo que **envía** esa dirección.'],
        ['`ip.dst == 192.168.1.25`', 'Solo lo que **recibe** esa dirección.'],
        ['`tcp.port == 443`', 'TCP con el puerto 443 en origen o destino.'],
        ['`udp.port == 53`', 'UDP con el puerto 53.'],
        ['`eth.addr == 00:1a:2b:3c:4d:5e`', 'Tramas con esa dirección MAC.'],
      ]),
      p(`Los filtros se combinan con operadores lógicos:`),
      tabla(['Operador', 'Significado', 'Ejemplo'], [
        ['`&&` (o `and`)', 'Las dos condiciones', '`ip.addr == 192.168.1.25 && dns`'],
        ['`||` (o `or`)', 'Cualquiera de las dos', '`dns || icmp`'],
        ['`!` (o `not`)', 'Lo contrario', '`!arp`'],
      ]),
      nota('truco', `La barra de filtro te corrige mientras escribes: fondo **verde** = sintaxis válida, fondo **rojo** = hay un error. Recuerda que se compara con **dos** signos de igual (\`==\`).`),
      ejemplo('facil', 'Ver solo el DNS', fil('dns')),
      ejemplo('facil', 'La conversación de un equipo', fil('addr', '192.168.1.25')),
      ejemplo('medio', 'Solo lo que envía', fil('src', '10.0.0.5')),
      ejemplo('medio', 'El tráfico de un puerto', fil('tcp', '192.168.1.10', 443)),

      h('Filtros de captura: no son lo mismo'),
      p(`Existe un segundo tipo de filtro, el **de captura**. Se escribe **antes** de empezar y decide qué se guarda; lo que no coincide **no se captura** y no se puede recuperar. Además usa **otra sintaxis**.`),
      tabla(['', 'Filtro de captura', 'Filtro de visualización'], [
        ['Cuándo se aplica', 'Antes de capturar', 'Después (o durante), sobre lo capturado'],
        ['Qué hace', 'Decide qué se **guarda**', 'Decide qué se **muestra**'],
        ['¿Se puede deshacer?', 'No: lo descartado se perdió', 'Sí: se quita el filtro'],
        ['Un equipo', '`host 192.168.1.25`', '`ip.addr == 192.168.1.25`'],
        ['Un puerto', '`port 53`', '`udp.port == 53`'],
        ['Un puerto TCP', '`tcp port 80`', '`tcp.port == 80`'],
      ]),
      nota('clave', `Para diagnosticar, lo habitual es **capturar todo y filtrar al visualizar**: así no pierdes nada que luego resulte importante. El filtro de captura se reserva para capturas largas o redes con muchísimo tráfico, donde guardarlo todo llenaría el disco.`),

      h('Reconocer el saludo de tres vías'),
      p(`Toda conexión TCP empieza con tres segmentos. Es como una llamada: «¿me oyes?» · «te oigo, ¿y tú a mí?» · «también te oigo».`),
      codigo('El saludo de tres vías en Wireshark', `No.  Source          Destination     Protocol Info
  1  192.168.1.25    203.0.113.10    TCP      51514 → 443 [SYN] Seq=0 Win=64240 Len=0
  2  203.0.113.10    192.168.1.25    TCP      443 → 51514 [SYN, ACK] Seq=0 Ack=1 Win=65535 Len=0
  3  192.168.1.25    203.0.113.10    TCP      51514 → 443 [ACK] Seq=1 Ack=1 Win=64240 Len=0`),
      tabla(['Segmento', 'Quién', 'Significado'], [
        ['`[SYN]`', 'El cliente', '«Quiero abrir una conexión.» Sale de un puerto alto al azar (51514) hacia el puerto del servicio (443).'],
        ['`[SYN, ACK]`', 'El servidor', '«De acuerdo, y yo también quiero abrirla.»'],
        ['`[ACK]`', 'El cliente', '«Recibido.» La conexión queda establecida.'],
      ]),
      p(`Lo que le sigue a un \`SYN\` es diagnóstico puro:`),
      tabla(['Tras el SYN aparece…', 'Significado'], [
        ['`[SYN, ACK]`', 'El puerto está **abierto**: el servicio funciona.'],
        ['`[RST, ACK]`', 'El puerto está **cerrado**: el equipo responde, pero nada escucha ahí («conexión rechazada»).'],
        ['Nada; el SYN se repite (retransmisión)', 'El tráfico se **descarta** por el camino: un firewall, o el equipo no existe.'],
      ]),
      ejemplo('medio', 'SYN sin respuesta', op('En una captura filtras por la dirección del servidor y ves solo esto. ¿Qué está pasando?',
        ['La conexión se estableció correctamente', 'El servidor rechazó la conexión porque el puerto está cerrado', 'El cliente envía SYN una y otra vez y nadie responde: algo descarta el tráfico', 'El DNS no resolvió el nombre'], 2,
        ['Los tres paquetes van en el mismo sentido: del cliente al servidor. No hay ninguna línea de vuelta.',
          'El segundo y el tercero están marcados como retransmisión: el cliente, al no recibir respuesta, repite su SYN esperando cada vez más.',
          'Si el puerto estuviera cerrado, el servidor contestaría con RST. El silencio total indica que el tráfico se descarta: un firewall, o el servidor está apagado. No es DNS: el cliente ya tiene la dirección IP.'],
        { codigo: `No.  Time      Source          Destination     Protocol Info
  1  0.000000  192.168.1.25    10.20.0.15      TCP      51620 → 1433 [SYN] Seq=0 Win=64240 Len=0
  2  1.001337  192.168.1.25    10.20.0.15      TCP      [TCP Retransmission] 51620 → 1433 [SYN] Seq=0
  3  3.002004  192.168.1.25    10.20.0.15      TCP      [TCP Retransmission] 51620 → 1433 [SYN] Seq=0` })),

      h('Reconocer DNS y DHCP'),
      codigo('Una consulta DNS y su respuesta', `No.  Source          Destination     Protocol Info
  1  192.168.1.25    192.168.1.1     DNS      Standard query 0x3a1f A www.example.com
  2  192.168.1.1     192.168.1.25    DNS      Standard query response 0x3a1f A www.example.com A 203.0.113.10`),
      p(`La PC pregunta a su servidor DNS por el registro **A** (la dirección IPv4) de un nombre, y el servidor contesta con la dirección. El número \`0x3a1f\` empareja cada pregunta con su respuesta. DNS viaja normalmente por **UDP, puerto 53**. Si ves la consulta repetida y ninguna respuesta, el servidor DNS no contesta.`),
      codigo('La negociación DHCP (DORA)', `No.  Source          Destination       Protocol Info
  1  0.0.0.0         255.255.255.255   DHCP     DHCP Discover - Transaction ID 0x7c2d11a0
  2  192.168.1.1     192.168.1.37      DHCP     DHCP Offer    - Transaction ID 0x7c2d11a0
  3  0.0.0.0         255.255.255.255   DHCP     DHCP Request  - Transaction ID 0x7c2d11a0
  4  192.168.1.1     192.168.1.37      DHCP     DHCP ACK      - Transaction ID 0x7c2d11a0`),
      tabla(['Mensaje', 'Quién lo envía', 'Qué dice'], [
        ['**D**iscover', 'El cliente, a todos (broadcast)', '«¿Hay algún servidor DHCP?»'],
        ['**O**ffer', 'El servidor', '«Te ofrezco esta dirección.»'],
        ['**R**equest', 'El cliente', '«La acepto: la quiero.»'],
        ['**A**ck', 'El servidor', '«Es tuya, con esta máscara, puerta de enlace y DNS.»'],
      ]),
      p(`Fíjate en que el cliente envía desde **0.0.0.0** (todavía no tiene dirección) hacia **255.255.255.255** (a todos, porque no sabe dónde está el servidor). DHCP usa **UDP 67** (servidor) y **UDP 68** (cliente).`),
      nota('clave', `Si en la captura ves **Discover, Discover, Discover…** y ningún Offer, tienes la prueba visual de lo que \`ipconfig\` mostraba como 169.254: el equipo pide y **nadie contesta**.`),
      ejemplo('medio', 'DHCP sin respuesta', op('Un equipo obtiene una dirección 169.254.x.x. Capturas con el filtro `dhcp` mientras ejecutas `ipconfig /renew` y solo ves cuatro mensajes «DHCP Discover» enviados desde 0.0.0.0, sin nada más. ¿Qué demuestra la captura?',
        ['Que la tarjeta de red no envía nada', 'Que el equipo sí pide dirección, pero ningún servidor DHCP le contesta', 'Que el servidor DHCP ofrece direcciones y el equipo las rechaza', 'Que el DNS no funciona'], 1,
        ['Los Discover están en la captura: la tarjeta **sí** envía. El equipo hace bien su parte.',
          'El mensaje siguiente tendría que ser un Offer del servidor. No aparece ninguno: la petición no llega al servidor o la respuesta no vuelve.',
          'La causa está fuera del equipo: VLAN del puerto, servidor DHCP caído, o rango agotado. La captura te permite afirmarlo con pruebas.'])),

      h('Seguir un flujo'),
      p(`En una captura hay muchas conversaciones mezcladas. Para aislar una sola: clic derecho sobre cualquiera de sus paquetes → **Seguir → Secuencia TCP** (Follow → TCP Stream). Wireshark aplica un filtro que deja solo esa conexión y abre una ventana con el diálogo completo, lo que dijo el cliente en un color y lo que dijo el servidor en otro.

Con protocolos **sin cifrar** (HTTP, Telnet, FTP) leerás el contenido tal cual, **contraseñas incluidas**. Con protocolos **cifrados** (HTTPS, SSH) solo verás caracteres sin sentido. Es la demostración más clara de por qué se usa SSH y no Telnet.`),

      h('Guardar y abrir capturas'),
      tabla(['Acción', 'Cómo'], [
        ['Guardar', '**Archivo → Guardar como**. Formato por defecto: **.pcapng**; el clásico es **.pcap**.'],
        ['Abrir', '**Archivo → Abrir**, o arrastrar el archivo a la ventana.'],
        ['Guardar solo una parte', '**Archivo → Exportar paquetes especificados**: guarda solo los que pasan el filtro actual.'],
      ]),
      tabla(['Formato', 'Características'], [
        ['**.pcap**', 'El formato clásico. Lo abre prácticamente cualquier herramienta (tcpdump, analizadores de seguridad).'],
        ['**.pcapng**', 'El formato actual y el que Wireshark usa por defecto. Admite varias interfaces, comentarios y más detalle.'],
      ]),
      p(`Guardar la captura te permite analizarla con calma, **adjuntarla a un ticket** y enviarla a un ingeniero. Antes de compartirla, recuerda lo que contiene: exporta **solo los paquetes necesarios**.

En servidores sin entorno gráfico se captura con **tcpdump** (\`tcpdump -i eth0 -w captura.pcap\`) y el archivo se abre después en Wireshark.`),

      h('Resumen'),
      lista(
        'Un analizador muestra **qué se dicen** los equipos. Úsalo con autorización y trata las capturas como confidenciales.',
        'Elegir interfaz → iniciar (aleta azul) → reproducir el problema → detener (cuadrado rojo).',
        'Tres paneles: **lista**, **detalles** (por capas) y **bytes**.',
        'Filtro de visualización: `dns`, `icmp`, `ip.addr == x`, `tcp.port == n`; se combinan con `&&`, `||` y `!`. El de captura usa otra sintaxis (`host x`, `port n`) y descarta para siempre.',
        'TCP: **SYN → SYN, ACK → ACK**. RST = puerto cerrado. SYN repetido sin respuesta = se descarta.',
        'DHCP: **Discover, Offer, Request, Ack** (UDP 67 y 68). DNS: consulta y respuesta (UDP 53).',
        'Se guarda en **.pcapng** (por defecto) o **.pcap**.',
      ),

      ejercicios('Practica', 'Los filtros se escriben en minúsculas y con dos signos de igual. Se aceptan con o sin espacios alrededor de `==`.', [
        fil('icmp'), fil('arp'), fil('dhcp'), fil('http'), fil('dns'), fil('addr', '192.168.10.100'), fil('src', '172.16.0.20'), fil('dst', '192.168.1.25'), fil('tcp', '192.168.1.10', 80), fil('tcp', '192.168.1.10', 22), fil('udp', '192.168.1.10', 53), fil('udp', '192.168.1.10', 67),
        op('¿Para qué sirve un analizador de paquetes como Wireshark?', ['Para asignar direcciones IP', 'Para capturar y examinar el tráfico que pasa por una interfaz de red', 'Para configurar las VLAN de un switch', 'Para acelerar la conexión'], 1, 'Captura el tráfico y lo muestra descifrado por protocolo. No configura ni modifica nada en la red.'),
        op('¿Cuál es el formato de archivo que Wireshark usa por defecto al guardar?', ['.txt', '.pcapng', '.cfg', '.log'], 1, 'Por defecto guarda en .pcapng. El formato clásico .pcap también se puede elegir y es el más compatible con otras herramientas.'),
        op('¿En qué panel de Wireshark se ve un paquete desglosado por capas (Ethernet, IP, TCP…)?', ['Lista de paquetes', 'Detalles del paquete', 'Bytes del paquete', 'Barra de filtro'], 1, 'El panel central, de detalles, muestra cada capa desplegable. La lista (arriba) da una línea por paquete y los bytes (abajo) el contenido en hexadecimal.'),
        op('Aplicas el filtro de visualización `dns` y desaparecen miles de paquetes. ¿Se perdieron?', ['Sí, se borraron de la captura', 'No: solo están ocultos y reaparecen al quitar el filtro', 'Sí, salvo que guardes antes', 'Depende del sistema operativo'], 1, 'El filtro de visualización solo oculta. El que descarta de forma definitiva es el filtro de captura.'),
        op('¿Qué secuencia de segmentos establece una conexión TCP?', ['ACK → SYN → FIN', 'SYN → SYN, ACK → ACK', 'SYN → ACK → RST', 'Discover → Offer → Request'], 1, 'Es el saludo de tres vías. Discover/Offer/Request pertenecen a DHCP, no a TCP.'),
        op('En una captura, tras el `[SYN]` del cliente aparece un `[RST, ACK]` del servidor. ¿Qué significa?', ['La conexión se estableció', 'El puerto está cerrado: el servidor responde, pero no hay servicio escuchando', 'Un firewall descarta el tráfico en silencio', 'El cliente no tiene dirección IP'], 1, 'RST es un rechazo activo. Un firewall que descarta no contestaría nada, y verías retransmisiones del SYN.'),
        op('¿Qué dirección de origen usa un cliente en su mensaje DHCP Discover?', ['127.0.0.1', '0.0.0.0', '169.254.0.1', 'La de la puerta de enlace'], 1, 'Todavía no tiene dirección, así que envía desde 0.0.0.0 hacia 255.255.255.255.'),
        op('Sigues la secuencia TCP de una sesión Telnet. ¿Qué verás?', ['Caracteres cifrados sin sentido', 'El texto de la sesión, incluidos el usuario y la contraseña', 'Solo las direcciones IP', 'Nada: Telnet no usa TCP'], 1, 'Telnet no cifra. Todo viaja en texto claro y un analizador lo muestra tal cual. Por eso se sustituye por SSH.'),
        op('Tu PC está conectada a un switch. Capturas con Wireshark y no ves el tráfico entre otras dos PC del mismo switch. ¿Por qué?', ['Wireshark está averiado', 'El switch entrega cada trama solo al puerto de su destino; haría falta un puerto espejo (SPAN)', 'Falta el filtro `arp`', 'Las otras PC usan otra VLAN de voz'], 1, 'Un switch no reparte el tráfico de unidifusión a todos los puertos. Para verlo hay que copiarlo a tu puerto con SPAN.'),
        vs('¿Qué DOS precauciones son obligatorias al capturar tráfico?', ['Tener autorización para capturar en esa red', 'Capturar siempre con el filtro `arp`', 'Tratar el archivo de captura como información confidencial', 'Desactivar el firewall del equipo', 'Compartir la captura completa en el chat del equipo'], [0, 2], 'Una captura puede contener contraseñas y datos personales: se necesita permiso y hay que protegerla. Se comparte solo lo necesario y por canales adecuados.'),
        vs('¿Qué DOS filtros son de VISUALIZACIÓN (no de captura)?', ['`ip.addr == 10.0.0.5`', '`host 10.0.0.5`', '`tcp.port == 443`', '`port 443`', '`tcp port 443`'], [0, 2], 'Los de visualización usan la forma `protocolo.campo == valor`. `host`, `port` y `tcp port` son sintaxis de filtros de captura.'),
        rel('Relaciona cada filtro de visualización con lo que muestra.', [
          ['ip.src == 10.0.0.5', 'Lo que envía 10.0.0.5'],
          ['ip.dst == 10.0.0.5', 'Lo que recibe 10.0.0.5'],
          ['ip.addr == 10.0.0.5', 'Lo que envía o recibe 10.0.0.5'],
          ['!arp', 'Todo excepto ARP'],
        ], '`src` es origen, `dst` es destino, `addr` cubre los dos sentidos y `!` niega la condición.', ['Solo ARP']),
        ord('Ordena los mensajes de la negociación DHCP.', ['Discover', 'Offer', 'Request', 'Ack'], 'DORA: el cliente descubre, el servidor ofrece, el cliente solicita y el servidor confirma.'),
        ord('Ordena los pasos para capturar un problema con Wireshark.', ['Elegir la interfaz de red correcta', 'Iniciar la captura', 'Reproducir el problema', 'Detener la captura', 'Guardar el archivo .pcapng'], 'Se elige por dónde pasa el tráfico, se captura mientras ocurre el fallo, se detiene pronto para que sea legible y se guarda.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 7 */
  {
    slug: 'acceso-a-los-dispositivos',
    titulo: 'Cómo acceder a los dispositivos de red',
    resumen: 'Consola, Telnet, SSH, RDP y VPN; sistemas de gestión de red, SNMP y syslog; redes gestionadas en la nube como Meraki; y cuándo usar cada método.',
    nivel: 'medio',
    objetivos: [
      'Conectarse por consola con un emulador de terminal (9600 8N1).',
      'Comparar Telnet y SSH, y explicar por qué se usa SSH.',
      'Distinguir RDP, VPN de acceso remoto y VPN de sitio a sitio.',
      'Describir qué aportan un NMS, SNMP, syslog y la gestión en la nube.',
    ],
    bloques: [
      h('Los equipos de red no tienen pantalla'),
      p(`Un router o un switch no tiene monitor ni teclado. Para ver su estado o configurarlo hay que **conectarse a él** desde otro equipo. Hay varias formas, y elegir la correcta depende de dos preguntas: **¿el equipo es alcanzable por la red?** y **¿qué necesito hacer?**`),
      tabla(['Método', 'Necesita red', 'Ofrece', 'Cifrado', 'Puerto'], [
        ['**Consola**', 'No', 'Línea de comandos', 'No aplica: cable directo', 'Físico'],
        ['**Telnet**', 'Sí', 'Línea de comandos', '**No**', 'TCP 23'],
        ['**SSH**', 'Sí', 'Línea de comandos', '**Sí**', 'TCP 22'],
        ['**RDP**', 'Sí', 'Escritorio gráfico de Windows', 'Sí', 'TCP 3389'],
        ['**Interfaz web**', 'Sí', 'Páginas de administración', 'Solo con HTTPS', 'TCP 443 (80 sin cifrar)'],
        ['**Panel en la nube**', 'Sí, con Internet', 'Gestión centralizada', 'Sí (HTTPS)', 'TCP 443'],
      ]),

      h('La consola: el acceso que siempre funciona'),
      p(`El **puerto de consola** es una conexión directa, por cable, entre tu computadora y el equipo. No pasa por la red, así que funciona aunque el equipo **no tenga dirección IP**, aunque **la red esté caída** o aunque **la configuración esté dañada**. Es como la llave física de un edificio cuando falla la cerradura electrónica.`),
      tabla(['Qué necesitas', 'Detalle'], [
        ['**Cable de consola**', 'El clásico es azul claro, con RJ-45 en un extremo y un conector serie o USB en el otro (cable *rollover*). Los equipos modernos traen también consola **USB** (mini-B o USB-C).'],
        ['**Puerto de consola**', 'En el equipo, rotulado **CONSOLE** y normalmente con el borde azul. **No es un puerto de red**, aunque tenga forma de RJ-45.'],
        ['**Emulador de terminal**', 'El programa que muestra la sesión: **PuTTY** o **Tera Term** en Windows; `screen` o `minicom` en Linux y macOS.'],
      ]),
      p(`El emulador se configura con los parámetros de la línea serie. Los valores por defecto de Cisco se resumen en **«9600 8N1»**:`),
      tabla(['Parámetro', 'Valor', 'Qué es'], [
        ['Velocidad', '**9600** baudios', 'Bits por segundo de la línea serie.'],
        ['Bits de datos', '**8**', 'Bits por cada carácter.'],
        ['Paridad', '**N**inguna', 'No se usa bit de comprobación.'],
        ['Bits de parada', '**1**', 'Marca el final de cada carácter.'],
        ['Control de flujo', 'Ninguno', 'Sin señales de pausa.'],
      ]),
      nota('error', `Si conectas la consola y solo ves **símbolos extraños**, casi siempre es la **velocidad**: el emulador no está a 9600 baudios. Si no ves **nada**, revisa que elegiste el puerto COM correcto y pulsa Enter.`),
      nota('clave', `La consola es acceso **fuera de banda**: no usa la red que estás administrando. SSH, Telnet y la web son acceso **en banda**: viajan por la misma red que los datos, y por eso dejan de funcionar cuando esa red falla. Regla práctica: **equipo nuevo o red caída → consola**.`),
      ejemplo('facil', 'Un switch recién sacado de la caja', acc(0)),
      ejemplo('facil', 'La red se cayó tras un cambio', acc(1)),

      h('Telnet y SSH'),
      p(`Los dos dan lo mismo: una **línea de comandos a distancia**, a través de la red. La diferencia es una sola, y es enorme:`),
      tabla(['', 'Telnet', 'SSH'], [
        ['Puerto', 'TCP **23**', 'TCP **22**'],
        ['Cifrado', '**Ninguno**: todo viaja en texto claro', '**Todo cifrado**, incluidos usuario y contraseña'],
        ['Autenticación', 'Solo contraseña, visible en la red', 'Contraseña o claves, y se verifica la identidad del servidor'],
        ['¿Se usa hoy?', 'Solo en laboratorios o equipos muy antiguos', 'Es el **estándar**'],
      ]),
      p(`Con Telnet, cualquiera que capture el tráfico por el camino **lee tu contraseña**. Lo viste en la lección de Wireshark: «Seguir secuencia TCP» muestra la sesión completa. Con SSH, la misma captura solo muestra datos ilegibles.`),
      codigo('Conectarse por SSH', `C:\\> ssh admin@192.168.10.2
admin@192.168.10.2's password:

SW1>`),
      p(`Para que un equipo Cisco acepte SSH necesita: un nombre de equipo y de dominio, un par de claves criptográficas, un usuario local, y las líneas de acceso remoto (\`vty\`) configuradas con \`transport input ssh\`. Esa última línea es la que **prohíbe Telnet**.`),
      nota('aviso', `Telnet tiene todavía un uso legítimo en diagnóstico: **probar si un puerto TCP está abierto**. \`telnet servidor 25\` intenta conectar al puerto 25: si la pantalla se queda en negro o aparece un saludo, el puerto está abierto; si dice que no pudo conectar, está cerrado o filtrado. Ahí no se usa para administrar, sino como sonda.`),
      ejemplo('facil', 'Administración remota cifrada', acc(2)),
      ejemplo('medio', 'El puerto 23', acc(4)),

      h('RDP: el escritorio a distancia'),
      p(`**RDP** (Protocolo de Escritorio Remoto) muestra en tu pantalla el **escritorio gráfico** de un equipo Windows y te deja usar su ratón y teclado. Usa el puerto **TCP 3389** y va cifrado. Es lo que se usa para administrar servidores Windows y para dar soporte a usuarios.

No sirve para un router o un switch: esos no tienen escritorio. Y al revés, SSH no te da las ventanas de Windows.`),
      nota('aviso', `**Nunca se expone RDP directamente a Internet.** Es uno de los puertos más atacados del mundo. Si hay que usarlo desde fuera, se entra primero por una VPN.`),
      ejemplo('facil', 'Ayudar a un usuario con su escritorio', acc(5)),

      h('VPN: entrar a la red desde fuera'),
      p(`Los equipos internos de una empresa tienen direcciones privadas y no son alcanzables desde Internet. Una **VPN** (red privada virtual) crea un **túnel cifrado** a través de Internet, de modo que el tráfico viaja protegido y el equipo remoto se comporta como si estuviera dentro de la red.`),
      tabla(['Tipo', 'Quién se conecta', 'Ejemplo'], [
        ['**De acceso remoto**', 'Una persona, con un programa cliente en su equipo', 'Una empleada desde su casa o un técnico desde un hotel.'],
        ['**De sitio a sitio**', 'Dos redes completas, de router a router (o de firewall a firewall)', 'La sucursal y la sede central, unidas permanentemente. Los usuarios no instalan nada.'],
      ]),
      nota('clave', `La VPN **no sustituye** a SSH ni a RDP: es el paso **previo**. Primero la VPN te mete en la red interna; después usas SSH o RDP hacia la dirección privada del equipo, como si estuvieras en la oficina.`),
      ejemplo('medio', 'Trabajar desde casa', acc(7)),
      ejemplo('dificil', 'SSH a una dirección privada desde un hotel', acc(8)),

      h('Sistemas de gestión de red'),
      p(`Conectarse equipo por equipo funciona con cinco dispositivos. Con quinientos, no. Un **NMS** (sistema de gestión de red) es un programa central que vigila todos los equipos a la vez, dibuja el mapa de la red, guarda historiales y **avisa cuando algo falla**. Se apoya sobre todo en dos protocolos:`),
      tabla(['Protocolo', 'Qué hace', 'Puerto'], [
        ['**SNMP**', 'El NMS **pregunta** a cada equipo por sus datos (tráfico, CPU, temperatura, estado de las interfaces). El equipo también puede **avisar por su cuenta** con un mensaje *trap* cuando ocurre algo.', 'UDP 161 (consultas) y 162 (traps)'],
        ['**Syslog**', 'Los equipos **envían sus mensajes de registro** a un servidor central, donde quedan guardados con fecha y hora.', 'UDP 514'],
      ]),
      p(`Los mensajes de syslog llevan un **nivel de gravedad** del 0 al 7. Cuanto **menor** el número, **más grave**:`),
      tabla(['Nivel', 'Nombre', 'Significado'], [
        ['0', 'Emergencia', 'El sistema no se puede usar.'],
        ['1', 'Alerta', 'Hay que actuar de inmediato.'],
        ['2', 'Crítico', 'Condición crítica.'],
        ['3', 'Error', 'Condición de error.'],
        ['4', 'Advertencia', 'Algo anormal, pero sigue funcionando.'],
        ['5', 'Notificación', 'Normal pero relevante (una interfaz sube o baja).'],
        ['6', 'Informativo', 'Información general.'],
        ['7', 'Depuración', 'Detalle máximo, para diagnóstico.'],
      ]),
      codigo('Un mensaje de syslog de Cisco', `*Oct  6 09:14:22.531: %LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to down`),
      p(`Se lee así: fecha y hora, el origen (\`LINK\`), la **gravedad** (\`3\`, error), el nombre del evento (\`UPDOWN\`) y la descripción. Con SNMP y syslog el técnico se entera del fallo **antes** de que llamen los usuarios, y puede ver qué pasó a las 3 de la madrugada.`),
      nota('truco', `Para que los registros de varios equipos se puedan comparar, todos deben tener **la misma hora**. Por eso se configura **NTP** (sincronización horaria) en todos los dispositivos de red.`),

      h('Gestión en la nube'),
      p(`En el modelo tradicional, cada equipo guarda su configuración y lo administras conectándote a él. En el modelo **gestionado en la nube** (el más conocido es **Cisco Meraki**), los equipos se conectan por sí solos a un servicio en Internet, y tú administras **toda la red desde un panel web** (el *dashboard*).`),
      tabla(['', 'Gestión tradicional', 'Gestión en la nube'], [
        ['Dónde se configura', 'En cada equipo, por consola o SSH', 'En un panel web central'],
        ['Poner un equipo nuevo', 'Configurarlo a mano antes o en sitio', 'Se registra por número de serie; al conectarse a Internet descarga su configuración'],
        ['Visión global', 'Hace falta un NMS aparte', 'Incluida en el panel'],
        ['Qué necesita', 'Acceso a cada equipo', 'Conexión a Internet y una licencia vigente'],
        ['Si se pierde Internet', 'Se sigue administrando localmente', 'La red sigue funcionando, pero no se pueden hacer cambios'],
      ]),
      ejemplo('medio', 'Cuarenta sucursales desde el navegador', acc(9)),

      h('Scripts y automatización'),
      p(`Cuando hay que hacer **lo mismo en muchos equipos** (cambiar una contraseña en 200 switches, recoger la versión de software de todos), hacerlo a mano es lento y propenso a errores. Un **script** es un pequeño programa (a menudo en Python) que se conecta a cada equipo, ejecuta los comandos y recoge los resultados. Los equipos modernos ofrecen además **API**: interfaces pensadas para que sean programas, y no personas, quienes consulten y configuren.

Para el CCST basta con saber que existen y para qué sirven: **repetir tareas a escala, sin errores de tecleo**, y recoger datos de muchos equipos a la vez.`),

      h('Resumen'),
      lista(
        '**Consola**: cable directo, sin red, 9600 8N1, con PuTTY o Tera Term. Para equipos nuevos y emergencias. Fuera de banda.',
        '**Telnet** (TCP 23): sin cifrar. **SSH** (TCP 22): cifrado, el estándar.',
        '**RDP** (TCP 3389): escritorio gráfico de Windows.',
        '**VPN**: túnel cifrado. De acceso remoto (una persona) o de sitio a sitio (dos redes). Es el paso previo a SSH o RDP desde fuera.',
        '**NMS**, **SNMP** (UDP 161/162) y **syslog** (UDP 514, gravedad 0–7, menor = más grave): vigilar muchos equipos.',
        '**Nube (Meraki)**: toda la red desde un panel web.',
      ),

      ejercicios('Practica', 'Para cada escenario pregúntate: ¿hay red hasta el equipo?, ¿necesito comandos o escritorio?, ¿estoy dentro o fuera de la red?', [
        acc(0), acc(1), acc(2), acc(3), acc(4), acc(5), acc(6), acc(7), acc(8), acc(9), acc(10),
        op('¿Qué parámetros usa por defecto el puerto de consola de un equipo Cisco?', ['115200 baudios, 7 bits, paridad par', '9600 baudios, 8 bits de datos, sin paridad, 1 bit de parada', '1000 Mb/s, dúplex completo', '9600 baudios, 8 bits, paridad impar, 2 bits de parada'], 1, 'Es el famoso «9600 8N1», sin control de flujo. Si la velocidad no coincide, aparecen símbolos sin sentido.'),
        op('¿Qué puerto usa SSH?', ['TCP 22', 'TCP 23', 'TCP 3389', 'UDP 161'], 0, 'SSH usa TCP 22. El 23 es Telnet, el 3389 es RDP y UDP 161 es SNMP.'),
        op('¿Por qué se prefiere SSH a Telnet?', ['SSH es más rápido', 'SSH cifra toda la sesión; Telnet lo envía todo en texto claro', 'Telnet no funciona en redes IP', 'SSH no necesita contraseña'], 1, 'La diferencia es la seguridad. Con Telnet, quien capture el tráfico lee usuario, contraseña y comandos.'),
        op('Conectas el cable de consola y el emulador muestra símbolos sin sentido. ¿Qué revisas primero?', ['La dirección IP del switch', 'La velocidad configurada en el emulador (debe ser 9600 baudios)', 'El servidor DNS', 'La VLAN del puerto'], 1, 'Los símbolos extraños son el síntoma clásico de una velocidad de línea que no coincide. La consola no usa IP, DNS ni VLAN.'),
        op('¿Qué programa es un emulador de terminal?', ['Wireshark', 'PuTTY', 'nslookup', 'Meraki Dashboard'], 1, 'PuTTY (como Tera Term) muestra sesiones de consola, Telnet y SSH. Wireshark captura tráfico y nslookup consulta el DNS.'),
        op('¿Qué tipo de VPN une de forma permanente la red de una sucursal con la de la sede, sin que los usuarios instalen nada?', ['De acceso remoto', 'De sitio a sitio', 'RDP', 'Telnet'], 1, 'La VPN de sitio a sitio se establece entre los routers o firewalls de las dos sedes y es transparente para los usuarios.'),
        op('¿Qué protocolo usa un NMS para consultar a los equipos su tráfico, su CPU y el estado de sus interfaces?', ['SNMP', 'RDP', 'DHCP', 'ARP'], 0, 'SNMP permite al sistema de gestión leer datos de los equipos (UDP 161) y recibir sus avisos, los traps (UDP 162).'),
        op('En syslog, ¿qué nivel de gravedad es el MÁS grave?', ['7', '5', '3', '0'], 3, 'La escala va de 0 (emergencia) a 7 (depuración): cuanto menor es el número, mayor la gravedad.'),
        op('Un mensaje dice `%LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to down`. ¿Qué gravedad tiene?', ['0, emergencia', '3, error', '5, notificación', '7, depuración'], 1, 'El número entre guiones es la gravedad: 3, error. Indica que la interfaz perdió el enlace.'),
        op('¿Por qué se configura NTP en todos los equipos de red?', ['Para cifrar las sesiones', 'Para que todos tengan la misma hora y sus registros se puedan comparar', 'Para repartir direcciones IP', 'Para traducir nombres'], 1, 'Sin hora sincronizada es imposible reconstruir en qué orden ocurrieron los eventos en distintos equipos.'),
        op('¿Qué significa que la consola sea un acceso «fuera de banda»?', ['Que usa Wi-Fi', 'Que no depende de la red que se está administrando', 'Que es más rápida que SSH', 'Que solo funciona desde Internet'], 1, 'Va por un cable aparte: funciona aunque la red de datos esté caída. SSH y Telnet son «en banda».'),
        vs('¿Qué DOS métodos dan acceso a la línea de comandos a través de la red?', ['SSH', 'Consola', 'Telnet', 'RDP', 'Cable de alimentación'], [0, 2], 'SSH y Telnet son accesos remotos a la CLI por la red. La consola es por cable directo y RDP muestra un escritorio gráfico.'),
        vs('¿Qué DOS afirmaciones sobre la gestión en la nube (como Meraki) son ciertas?', ['Los equipos se administran desde un panel web central', 'Los equipos necesitan conexión a Internet para recibir cambios de configuración', 'Solo se puede configurar por el puerto de consola', 'No necesita licencias', 'Usa Telnet para comunicarse con el panel'], [0, 1], 'Los equipos se conectan a la nube por Internet (HTTPS) y se gestionan desde el panel. Requiere licencias vigentes.'),
        rel('Relaciona cada protocolo con su puerto.', [
          ['SSH', 'TCP 22'],
          ['Telnet', 'TCP 23'],
          ['RDP', 'TCP 3389'],
          ['Syslog', 'UDP 514'],
        ], 'SSH 22, Telnet 23, RDP 3389 y syslog UDP 514. Son los cuatro que más se preguntan en este tema.', ['UDP 161']),
        ord('Un técnico está en su casa y debe administrar un switch de la oficina con dirección privada. Ordena lo que hace.', ['Conectarse a Internet', 'Establecer la VPN de acceso remoto con la empresa', 'Abrir una sesión SSH a la dirección privada del switch', 'Ejecutar los comandos show necesarios', 'Cerrar la sesión SSH y la VPN'], 'La VPN es el paso previo: sin ella, la dirección privada no es alcanzable. Al terminar se cierran las dos sesiones.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 8 */
  {
    slug: 'comandos-show-de-cisco',
    titulo: 'Los comandos show de Cisco',
    resumen: 'Niveles de privilegio, la ayuda con ? y Tab, y cómo leer línea a línea las salidas de los comandos show que pide el examen.',
    nivel: 'dificil',
    objetivos: [
      'Distinguir los modos EXEC de usuario y privilegiado y los niveles de privilegio.',
      'Usar la ayuda `?`, el autocompletado y las abreviaturas.',
      'Leer las salidas de los comandos show del temario.',
      'Elegir el comando show que responde a cada pregunta.',
    ],
    bloques: [
      h('Mirar sin tocar'),
      p(`Los comandos \`show\` son los ojos del técnico. **Solo muestran información: no cambian nada.** Por eso son la herramienta ideal para un técnico de soporte: un ingeniero puede pedirte por teléfono «dime qué sale en \`show ip interface brief\`» sin ningún riesgo de que rompas algo.

El objetivo de esta lección es doble: saber **qué comando responde a cada pregunta** y saber **leer lo que sale**.`),

      h('Modos y niveles de privilegio'),
      p(`Al conectarte a un equipo Cisco entras en un modo limitado. La forma del **indicador** (prompt) te dice siempre en qué modo estás:`),
      tabla(['Modo', 'Indicador', 'Qué permite', 'Cómo se entra'], [
        ['**EXEC de usuario**', '`Switch>`', 'Unas pocas consultas básicas. No se ve la configuración.', 'Al conectarte'],
        ['**EXEC privilegiado**', '`Switch#`', 'Todos los comandos `show` y de diagnóstico.', '`enable`'],
        ['**Configuración global**', '`Switch(config)#`', 'Cambiar la configuración.', '`configure terminal`'],
      ]),
      codigo('Pasar de un modo a otro', `Switch> enable
Password:
Switch# configure terminal
Switch(config)# exit
Switch# disable
Switch>`),
      p(`Por dentro, IOS tiene **16 niveles de privilegio**, del 0 al 15. Tres vienen definidos:`),
      tabla(['Nivel', 'Qué es'], [
        ['**0**', 'El mínimo: solo `enable`, `disable`, `exit`, `help` y `logout`.'],
        ['**1**', 'El **EXEC de usuario** (`>`). Es donde entras por defecto.'],
        ['**15**', 'El **EXEC privilegiado** (`#`). Acceso total.'],
      ], 'Los niveles 2 a 14 están libres: el administrador puede asignarles comandos concretos, por ejemplo para dar a un técnico acceso a ciertos `show` sin darle control total.'),
      nota('clave', `Si un comando \`show\` «no existe» o da error, mira el indicador. Lo más probable es que sigas en modo usuario (\`>\`). Escribe \`enable\`. Y si estás en modo de configuración, antepón \`do\`: \`do show ip interface brief\`.`),

      h('La ayuda: ?, Tab y abreviaturas'),
      p(`No hace falta memorizar los comandos completos. IOS te ayuda de tres maneras:`),
      tabla(['Escribes', 'Qué hace', 'Ejemplo'], [
        ['`?` solo', 'Lista todos los comandos disponibles en ese modo.', '`Switch# ?`'],
        ['Letras y `?` **pegado**', 'Lista los comandos que empiezan por esas letras.', '`Switch# sh?` → `show`'],
        ['Comando, espacio y `?`', 'Lista lo que puede ir **a continuación**.', '`Switch# show ?`'],
        ['Tecla **Tab**', 'Completa la palabra, si no hay ambigüedad.', '`sh` + Tab → `show`'],
        ['Abreviatura', 'Basta con las letras que hagan único el comando.', '`sh ip int br`'],
      ]),
      codigo('La ayuda en acción', `Switch# show ip int?
interface

Switch# show ip interface ?
  brief               Brief summary of IP status and configuration
  GigabitEthernet     GigabitEthernet IEEE 802.3z
  Vlan                Catalyst Vlans
  <cr>`),
      p(`\`<cr>\` («retorno de carro») significa que el comando ya está completo y puedes pulsar Enter. IOS también te dice **por qué** falla un comando:`),
      tabla(['Mensaje', 'Significado', 'Qué hacer'], [
        ['`% Ambiguous command: "s"`', 'Las letras escritas coinciden con varios comandos.', 'Escribe más letras.'],
        ['`% Incomplete command.`', 'Faltan palabras o valores.', 'Añade un espacio y `?` para ver qué falta.'],
        ['`% Invalid input detected at \'^\' marker.`', 'Hay un error. El símbolo `^` señala dónde.', 'Corrige desde ese punto; o no estás en el modo adecuado.'],
      ]),
      p(`Dos ayudas más: la **flecha arriba** recupera los comandos anteriores, y cuando una salida es larga aparece \`--More--\`: la **barra espaciadora** avanza una página, **Enter** una línea, y **Q** sale.`),
      ejemplo('facil', 'Ver qué puede seguir', op('Estás en `Switch#` y quieres saber qué opciones existen después de `show interfaces`. ¿Qué escribes?',
        ['`show interfaces?` (sin espacio)', '`show interfaces ?` (con espacio)', '`help show interfaces`', '`show interfaces /all`'], 1,
        ['El signo `?` se comporta distinto según lleve o no un espacio delante.',
          '**Pegado** a las letras (`show interfaces?`), lista los comandos que **empiezan** por esas letras: solo diría «interfaces».',
          '**Tras un espacio** (`show interfaces ?`), lista lo que puede ir **a continuación**: los nombres de interfaz, `status`, `trunk`, `description`…'])),

      h('show running-config y show startup-config'),
      codigo('show running-config (fragmento)', `Switch# show running-config
Building configuration...

Current configuration : 1420 bytes
!
version 15.2
hostname SW1
!
interface GigabitEthernet1/0/1
 description PC-Recepcion
 switchport access vlan 10
 switchport mode access
!
interface Vlan1
 ip address 192.168.10.2 255.255.255.0
!
ip default-gateway 192.168.10.1
!
line vty 0 15
 transport input ssh
!
end`),
      tabla(['Comando', 'Qué muestra', 'Dónde vive'], [
        ['`show running-config`', 'La configuración **en uso ahora mismo**.', 'En la RAM: se pierde al apagar.'],
        ['`show startup-config`', 'La configuración **guardada**, la que se cargará al arrancar.', 'En la NVRAM: sobrevive al apagado.'],
      ]),
      p(`Los cambios que haces se aplican a la *running-config* **al instante**, pero no se guardan solos. Si el equipo se reinicia, vuelve a lo que diga la *startup-config*. Se guardan con \`copy running-config startup-config\`.`),
      nota('error', `Un clásico: «configuré el switch ayer, hubo un corte de luz y hoy no tiene nada». No se guardó. Si las dos configuraciones difieren, hay **cambios sin guardar**.`),

      h('show version'),
      codigo('show version (fragmento)', `Router# show version
Cisco IOS XE Software, Version 16.09.04
ROM: IOS-XE ROMMON

R1 uptime is 3 weeks, 2 days, 4 hours, 11 minutes
System returned to ROM by power-on
System image file is "bootflash:isr4300-universalk9.16.09.04.SPA.bin"

cisco ISR4321/K9 (1RU) processor with 1687137K/6147K bytes of memory.
Processor board ID FLM2301W0AB
2 Gigabit Ethernet interfaces
2 Serial interfaces
3223551K bytes of flash memory at bootflash:.

Configuration register is 0x2102`),
      tabla(['Línea', 'Qué te dice'], [
        ['`Version 16.09.04`', 'La **versión del sistema operativo**. Lo primero que te pedirá el fabricante.'],
        ['`uptime is 3 weeks…`', 'Cuánto lleva **encendido**. Si un usuario dice «falló anoche» y el uptime es de 9 horas, el equipo se reinició.'],
        ['`System returned to ROM by power-on`', 'El **motivo del último arranque**: encendido normal, recarga ordenada o fallo.'],
        ['`System image file is…`', 'El archivo de sistema que se cargó.'],
        ['`cisco ISR4321/K9`', 'El **modelo**.'],
        ['`Processor board ID`', 'El número de serie de la placa.'],
        ['Interfaces y memoria', 'Qué hardware tiene.'],
        ['`Configuration register is 0x2102`', 'El modo de arranque. `0x2102` es el valor normal.'],
      ]),

      h('show ip interface brief'),
      codigo('show ip interface brief', BRIEF),
      p(`Es **el** comando de diagnóstico: una línea por interfaz, con su dirección y su estado. Las dos últimas columnas son las importantes: **Status** habla de la capa 1 y **Protocol**, de la capa 2.`),
      tabla(['Status', 'Protocol', 'Significado', 'Qué hacer'], [
        ['up', 'up', 'Funciona.', 'Nada.'],
        ['administratively down', 'down', 'Apagada con el comando `shutdown`.', '`no shutdown` en la interfaz.'],
        ['down', 'down', 'Sin señal: problema físico.', 'Cable, conector, equipo del otro extremo.'],
        ['up', 'down', 'Hay señal, pero la capa 2 no se establece.', 'Encapsulación, reloj, velocidad o dúplex.'],
      ]),
      p(`En la salida de arriba: **Gi0/0** y **Serial0/0/0** funcionan. **Gi0/1** tiene dirección, pero está down/down: revisa su cable. **Gi0/2** no tiene dirección (\`unassigned\`) y está apagada por configuración: nunca se puso en servicio.`),
      ejemplo('facil', 'Una interfaz apagada a propósito', ifz(1, 'GigabitEthernet0/1', '192.168.20.1')),
      ejemplo('medio', 'Sin señal', ifz(2, 'GigabitEthernet0/0', '192.168.10.1')),
      ejemplo('dificil', 'Hay señal, pero no hay enlace de datos', ifz(3, 'Serial0/0/0', '10.0.5.1')),

      h('show interfaces'),
      p(`\`show interfaces\` muestra **todo el detalle** de todas las interfaces. Seguido de un nombre, solo de esa: \`show interfaces GigabitEthernet1/0/3\` (o abreviado, \`sh int g1/0/3\`).`),
      codigo('show interfaces GigabitEthernet1/0/3', IFDET),
      tabla(['Línea', 'Qué mirar'], [
        ['`is up, line protocol is up`', 'Los mismos Status y Protocol de la tabla anterior.'],
        ['`address is 0c1a.2b3c.4d03`', 'La **MAC** de la interfaz. Cisco la escribe en tres grupos de cuatro dígitos.'],
        ['`Description`', 'El texto que puso el administrador: a qué está conectada.'],
        ['`Half-duplex, 100Mb/s`', '**Dúplex y velocidad** negociados. *Half-duplex* en un puerto moderno es señal de alarma.'],
        ['`input errors`, `CRC`', 'Tramas recibidas dañadas. Deben ser **0** o casi. Si crecen: cable defectuoso, interferencias o desajuste de dúplex.'],
        ['`collisions`, `late collision`', 'En dúplex completo deben ser **0**. Las colisiones tardías delatan un **desajuste de dúplex**.'],
        ['`interface resets`', 'Veces que la interfaz se reinició.'],
      ]),
      p(`La salida de arriba es un caso de libro: el puerto negoció **semidúplex** y acumula **errores CRC y colisiones tardías**. Un extremo está en dúplex completo y el otro en semidúplex. El enlace funciona, pero **muy lento y con pérdidas**: justo la queja de «la impresora tarda muchísimo».`),
      ejemplo('dificil', 'El puerto lento', op('Los usuarios dicen que la impresora «va lentísima». En el puerto del switch donde está conectada ves la salida de abajo. ¿Cuál es la causa más probable?',
        ['El puerto está apagado con `shutdown`', 'Un desajuste de dúplex entre el switch y la impresora', 'La impresora no tiene dirección IP', 'El puerto está en la VLAN equivocada'], 1,
        ['La primera línea dice `up` / `up`: el puerto no está apagado y hay enlace.',
          'Tres pistas apuntan a lo mismo: el puerto está en **Half-duplex**, hay más de mil **errores CRC** y hay **colisiones tardías** (late collision).',
          'En un enlace sano en dúplex completo no existen las colisiones. Que aparezcan, y además tardías, significa que un extremo transmite mientras el otro también lo hace: uno está en dúplex completo y el otro en semidúplex. Solución: poner los dos extremos en negociación automática, o fijar los dos igual.',
          'Una VLAN equivocada o la falta de IP provocarían que no funcionara nada, no que funcionara lento.'],
        { codigo: IFDET })),

      h('show interfaces status'),
      codigo('show interfaces status', STATUS),
      p(`Es el resumen de los puertos de un **switch**: una línea por puerto. Perfecto para responder «¿en qué estado está el puerto 5?» sin leer páginas de detalle.`),
      tabla(['Columna', 'Valores y significado'], [
        ['Name', 'La descripción del puerto, si la tiene.'],
        ['Status', '`connected`: hay enlace. `notconnect`: nada conectado o equipo apagado. `disabled`: apagado con `shutdown`. `err-disabled`: **el switch lo desactivó por un error** (por ejemplo, una violación de seguridad de puerto).'],
        ['Vlan', 'El número de VLAN del puerto de acceso, o `trunk` si es troncal.'],
        ['Duplex', '`a-full`: dúplex completo negociado **automáticamente** (la `a-` significa «auto»). `full` o `half` sin prefijo: fijado a mano.'],
        ['Speed', '`a-1000`: 1000 Mb/s negociado. `a-100`: 100 Mb/s negociado.'],
        ['Type', 'El tipo de puerto: cobre 10/100/1000BaseTX o un módulo de fibra.'],
      ]),
      nota('aviso', `Un puerto en **err-disabled** no se recupera solo al quitar la causa. Hay que entrar en la interfaz y ejecutar \`shutdown\` y después \`no shutdown\`, una vez corregido lo que lo provocó.`),
      ejemplo('medio', 'Leer la tabla de puertos', op('Con la salida de abajo, ¿por qué no tiene red la PC conectada a Gi1/0/5?',
        ['El puerto no tiene nada conectado', 'El switch desactivó el puerto por un error (err-disabled)', 'El puerto está en una VLAN que no existe', 'El puerto es un troncal'], 1,
        ['Se busca la línea de Gi1/0/5 y se lee la columna Status: dice `err-disabled`.',
          'No es `notconnect` (eso es Gi1/0/2) ni `disabled` (Gi1/0/4, apagado a mano). `err-disabled` significa que el propio switch cerró el puerto al detectar una condición de error, normalmente una violación de seguridad de puerto.',
          'La VLAN 10 es la misma del puerto Gi1/0/1, que funciona. Para recuperarlo: corregir la causa y hacer `shutdown` seguido de `no shutdown` en la interfaz.'],
        { codigo: STATUS })),

      h('show ip route'),
      codigo('show ip route', RUTAS),
      p(`Es la **tabla de enrutamiento**: la lista de redes que el router conoce y por dónde se llega a cada una. La letra del principio indica **cómo aprendió** la ruta:`),
      tabla(['Código', 'Significado', 'En el ejemplo'], [
        ['**C**', 'Red **conectada** directamente a una interfaz.', '192.168.10.0/24 por Gi0/0'],
        ['**L**', 'Dirección **local**: la IP exacta del router en esa interfaz (/32).', '192.168.10.1/32'],
        ['**S**', 'Ruta **estática**, escrita a mano.', '192.168.30.0/24 vía 192.168.10.2'],
        ['**S\\***', 'Ruta estática **por defecto**: adonde va todo lo que no tiene una ruta más concreta.', '0.0.0.0/0 vía 203.0.113.1'],
        ['**O**, **D**, **R**', 'Aprendidas por protocolos de enrutamiento (OSPF, EIGRP, RIP).', '—'],
      ]),
      p(`La línea \`Gateway of last resort is 203.0.113.1\` confirma que hay ruta por defecto. Si dijera \`Gateway of last resort is not set\`, el router **no sabría adónde enviar el tráfico hacia Internet**: es una de las causas del caso «llego a la puerta de enlace, pero no salgo».`),
      nota('clave', `Una interfaz que está **down** no aparece en la tabla de rutas. Si una red conectada «falta» en \`show ip route\`, mira su interfaz con \`show ip interface brief\`.`),

      h('show mac address-table'),
      codigo('show mac address-table', MACS),
      p(`Es la tabla con la que un **switch** decide por qué puerto enviar cada trama. Cada línea dice: «la dirección MAC tal, de la VLAN tal, está detrás del puerto tal». El tipo \`DYNAMIC\` significa que el switch la **aprendió solo**, al ver llegar tramas con esa MAC de origen.`),
      p(`Dos lecturas útiles:`),
      lista(
        '**Localizar un equipo**: conoces su MAC (por `ipconfig /all` o por la tabla ARP) y buscas en qué puerto está. Así se encuentra una PC en un edificio.',
        '**Varias MAC en un mismo puerto** (como Gi1/0/24 arriba): detrás de ese puerto hay **otro switch**. Es un enlace entre switches, no un equipo final.',
      ),

      h('show cdp neighbors'),
      codigo('show cdp neighbors', CDP),
      p(`**CDP** es un protocolo de Cisco con el que los equipos se **presentan a sus vecinos directos**. Este comando responde: «¿qué hay conectado a cada uno de mis puertos?». Es la forma más rápida de dibujar, o de comprobar, el diagrama de una red.`),
      tabla(['Columna', 'Qué es', 'Primera línea del ejemplo'], [
        ['Device ID', 'El nombre del vecino.', 'SW2'],
        ['Local Intrfce', '**Mi** puerto, por el que lo veo.', 'Gig 1/0/24'],
        ['Holdtme', 'Segundos que quedan antes de darlo por desaparecido.', '154'],
        ['Capability', 'Qué tipo de equipo es: R router, S switch, H host, P teléfono.', 'S I (switch)'],
        ['Platform', 'El modelo.', 'WS-C2960X'],
        ['Port ID', '**Su** puerto, al que estoy conectado.', 'Gig 1/0/24'],
      ]),
      p(`Con \`show cdp neighbors detail\` se añaden la **dirección IP** de cada vecino y su **versión de software**: justo lo que necesitas para conectarte a él por SSH.`),
      nota('aviso', `CDP solo muestra vecinos **directamente conectados** y que hablen CDP (equipos Cisco). No muestra lo que hay dos saltos más allá, ni las PC normales. El equivalente estándar, que funciona entre fabricantes, es **LLDP** (\`show lldp neighbors\`).`),
      ejemplo('medio', 'Leer la tabla de vecinos', op('Con la salida `show cdp neighbors` de abajo, ejecutada en SW1, ¿a qué puerto del router R1 está conectado SW1?',
        ['Gig 1/0/23', 'Gig 0/0/1', 'Gig 1/0/24', 'Port 1'], 1,
        ['Se busca la línea cuyo Device ID es **R1**.',
          'En esa línea hay dos puertos. **Local Intrfce** (Gig 1/0/23) es el puerto de SW1, el equipo donde se ejecutó el comando.',
          '**Port ID** (Gig 0/0/1) es el puerto del vecino, R1. La pregunta pide el puerto del router: **Gig 0/0/1**. Confundir las dos columnas es el error típico.'],
        { codigo: CDP })),

      h('show inventory y show switch'),
      codigo('show inventory', `Switch# show inventory
NAME: "1", DESCR: "WS-C2960X-24PS-L"
PID: WS-C2960X-24PS-L  , VID: V05  , SN: FOC1234X0AB

NAME: "GigabitEthernet1/0/25", DESCR: "1000BaseSX SFP"
PID: GLC-SX-MMD        , VID: V01  , SN: FNS17320ABC`),
      p(`\`show inventory\` lista el equipo y **cada componente reemplazable** (módulos, fuentes, transceptores SFP) con su **PID** (identificador de producto: el modelo exacto) y su **SN** (número de serie). Es lo que te piden para una **garantía** o para hacer el inventario.`),
      codigo('show switch', `Switch# show switch
Switch/Stack Mac Address : 0c1a.2b3c.4d00
                                           H/W   Current
Switch#  Role    Mac Address     Priority Version  State
----------------------------------------------------------
*1       Active  0c1a.2b3c.4d00     15     V05     Ready
 2       Standby 0c1a.2b3c.5e00     14     V05     Ready
 3       Member  0c1a.2b3c.6f00      1     V05     Ready`),
      p(`Varios switches se pueden unir en una **pila** (stack) que se administra como si fuera un solo equipo. \`show switch\` lista los miembros:`),
      tabla(['Columna', 'Significado'], [
        ['Switch#', 'El número del miembro. El asterisco marca aquel al que estás conectado.'],
        ['Role', '`Active`: el que controla la pila. `Standby`: el suplente, que toma el mando si el activo falla. `Member`: los demás.'],
        ['Priority', 'Cuanto mayor, más opciones de ser elegido activo.'],
        ['State', '`Ready`: funcionando. Cualquier otro valor merece atención.'],
      ]),
      p(`El número de miembro es la **primera cifra** del nombre de los puertos: \`Gi2/0/5\` es el puerto 5 del switch **2** de la pila.`),

      h('Qué comando responde a cada pregunta'),
      tabla(['Te preguntan…', 'Comando'], [
        ['¿Cómo está configurado ahora?', '`show running-config`'],
        ['¿Qué configuración se cargará al reiniciar?', '`show startup-config`'],
        ['¿Qué versión de IOS, qué modelo, cuánto lleva encendido?', '`show version`'],
        ['¿Qué interfaces están arriba y qué IP tienen?', '`show ip interface brief`'],
        ['¿Hay errores, qué dúplex y velocidad tiene este puerto?', '`show interfaces g1/0/3`'],
        ['¿Estado, VLAN y velocidad de todos los puertos del switch?', '`show interfaces status`'],
        ['¿Qué redes conoce el router? ¿Hay ruta por defecto?', '`show ip route`'],
        ['¿En qué puerto está esta MAC?', '`show mac address-table`'],
        ['¿Qué equipos Cisco tengo conectados, y dónde?', '`show cdp neighbors`'],
        ['¿Qué IP tiene el vecino?', '`show cdp neighbors detail`'],
        ['¿Número de serie y modelo exacto?', '`show inventory`'],
        ['¿Qué miembros tiene la pila y cuál manda?', '`show switch`'],
      ]),
      ejemplo('facil', 'El primer comando de cualquier diagnóstico', sh('brief')),
      ejemplo('medio', 'Para abrir un caso de garantía', sh('inventario')),

      h('Resumen'),
      lista(
        'Los `show` **no cambian nada**. Casi todos necesitan el modo privilegiado (`#`, nivel 15), al que se entra con `enable`.',
        'Ayuda: `?` pegado = comandos que empiezan así; `?` tras un espacio = lo que sigue; **Tab** completa.',
        '`running-config` = en uso (RAM). `startup-config` = guardada (NVRAM).',
        '`show ip interface brief`: Status = capa 1, Protocol = capa 2. *administratively down* = `shutdown`.',
        'CRC + colisiones tardías + semidúplex = **desajuste de dúplex**.',
        '`show ip route`: C conectada, L local, S estática, S* por defecto.',
        '`show cdp neighbors`: *Local Intrfce* es mi puerto y *Port ID* el del vecino.',
        '`show inventory` = números de serie. `show switch` = miembros de la pila.',
      ),

      ejercicios('Practica', 'En los ejercicios de comando puedes escribirlo completo o abreviado, como en un equipo real (por ejemplo `sh ip int br`).', [
        sh('activa'), sh('guardada'), sh('version'), sh('brief'), sh('rutas'), sh('mac'), sh('cdp'), sh('cdpdet'), sh('inventario'), sh('estado'), sh('interfaz', 'g0/2'), sh('interfaz', 'f0/12'), sh('pila'), sh('vlan'),
        ifz(0, 'GigabitEthernet0/1', '10.10.30.1'), ifz(1, 'Serial0/1/0', '172.16.8.1'), ifz(2, 'FastEthernet0/1', '192.168.20.254'), ifz(3, 'Serial0/0/0', '172.20.4.1'),
        op('¿Qué indicador muestra que estás en modo EXEC privilegiado?', ['`Switch>`', '`Switch#`', '`Switch(config)#`', '`Switch(config-if)#`'], 1, 'El símbolo `#` solo es el modo privilegiado. `>` es el modo usuario, y los que llevan paréntesis son modos de configuración.'),
        op('¿Qué nivel de privilegio corresponde al modo EXEC privilegiado?', ['0', '1', '7', '15'], 3, 'El nivel 15 es el más alto. El nivel 1 es el EXEC de usuario, y el 0 solo permite cinco comandos básicos.'),
        op('IOS responde `% Ambiguous command: "s"`. ¿Qué significa?', ['El comando no existe', 'Las letras escritas coinciden con varios comandos: hay que escribir más', 'Falta un valor al final', 'No tienes privilegios suficientes'], 1, 'Una abreviatura debe ser única. Con una «s» hay muchos comandos posibles (show, shutdown, ssh…).'),
        op('IOS responde `% Invalid input detected at \'^\' marker`. ¿Qué indica el símbolo `^`?', ['El final del comando', 'El punto exacto donde IOS encontró el error', 'Que falta el modo privilegiado', 'Que el comando se ejecutó'], 1, 'El acento circunflejo señala el primer carácter que IOS no pudo interpretar. Se corrige desde ahí.'),
        op('Hiciste cambios en un switch y quieres saber si quedarían tras un reinicio. ¿Qué comparas?', ['`show version` con `show inventory`', '`show running-config` con `show startup-config`', '`show ip route` con `show cdp neighbors`', '`show switch` con `show interfaces status`'], 1, 'Si la configuración en uso difiere de la guardada, hay cambios que se perderían al reiniciar.'),
        op('En `show ip route`, ¿qué indica una línea que empieza por `S*`?', ['Una red conectada directamente', 'La ruta estática por defecto', 'Una ruta aprendida por OSPF', 'La dirección local del router'], 1, 'S es estática y el asterisco la marca como candidata a ruta por defecto: 0.0.0.0/0.'),
        op('`show ip route` muestra «Gateway of last resort is not set». ¿Qué consecuencia tiene?', ['El router no puede enrutar entre sus redes conectadas', 'El router descarta el tráfico hacia redes que no conoce, como Internet', 'El router no tiene dirección IP', 'El router está en modo usuario'], 1, 'Sin ruta por defecto, todo destino que no figure en la tabla se descarta. Las redes conectadas siguen enrutándose entre sí.'),
        op('En `show interfaces status`, un puerto muestra `a-full` y `a-1000`. ¿Qué significa la `a-`?', ['Que el puerto está apagado', 'Que el valor se negoció automáticamente', 'Que el puerto es de acceso', 'Que hay un error'], 1, 'El prefijo indica autonegociación: el puerto acordó con el otro extremo dúplex completo a 1000 Mb/s.'),
        op('En `show mac address-table`, el puerto Gi1/0/24 aparece con cinco direcciones MAC distintas. ¿Qué es lo más probable?', ['Hay un error en la tabla', 'En ese puerto hay conectado otro switch', 'El puerto está en err-disabled', 'Hay cinco VLAN nativas'], 1, 'Un puerto con un equipo final aprende una MAC (o dos, con un teléfono). Varias indican que detrás hay otro switch.'),
        op('Estás en `Switch(config)#` y quieres ejecutar `show ip interface brief` sin salir del modo de configuración. ¿Qué escribes?', ['`do show ip interface brief`', '`enable show ip interface brief`', '`run show ip interface brief`', '`exit show ip interface brief`'], 0, 'El prefijo `do` permite ejecutar comandos del modo EXEC desde cualquier modo de configuración.'),
        vs('En `show interfaces` de un puerto ves muchos errores CRC y colisiones tardías. ¿Qué DOS causas son las más probables?', ['Desajuste de dúplex entre los dos extremos', 'Cable defectuoso o con interferencias', 'Servidor DNS mal configurado', 'Contraseña de enable incorrecta', 'Falta de ruta por defecto'], [0, 1], 'CRC y colisiones tardías son síntomas de capa 1 y 2: dúplex desajustado o cable en mal estado. El DNS, las contraseñas y las rutas no generan errores de trama.'),
        vs('¿Qué DOS datos aparecen en `show version`?', ['La versión del sistema operativo', 'La tabla de direcciones MAC', 'El tiempo que lleva encendido el equipo', 'Los vecinos CDP', 'Las VLAN creadas'], [0, 2], 'show version da la versión de IOS, el uptime, el motivo del último arranque, el modelo y la memoria.'),
        rel('Relaciona cada pregunta con el comando que la responde.', [
          ['¿Qué IP y estado tiene cada interfaz?', 'show ip interface brief'],
          ['¿Qué equipos Cisco hay conectados?', 'show cdp neighbors'],
          ['¿Cuál es el número de serie?', 'show inventory'],
          ['¿En qué puerto está esta MAC?', 'show mac address-table'],
        ], 'Cada comando tiene su pregunta: interfaces e IP, vecinos, números de serie y ubicación de una MAC.', ['show switch']),
        rel('Relaciona cada código de `show ip route` con su significado.', [
          ['C', 'Red conectada directamente'],
          ['L', 'Dirección local del router'],
          ['S', 'Ruta estática'],
          ['S*', 'Ruta estática por defecto'],
        ], 'C y L aparecen solas al activar una interfaz con dirección; S la escribe el administrador; S* es la salida para todo lo demás.', ['Ruta aprendida por OSPF']),
        ord('Entras por consola a un switch y quieres ver la configuración en uso. Ordena los pasos.', ['Pulsar Enter para obtener el indicador Switch>', 'Escribir enable', 'Introducir la contraseña', 'Escribir show running-config', 'Avanzar con la barra espaciadora cuando aparezca --More--'], 'Primero se llega al modo usuario, se sube al privilegiado con enable y su contraseña, y entonces se lanza el show; las salidas largas se paginan.'),
      ]),
    ],
  },
];
