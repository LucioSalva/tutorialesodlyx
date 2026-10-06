// Infraestructura · lecciones 1 a 4: dispositivos, puertos y luces, diagramas y rack, y cómo funciona un switch.
import { h, h3, p, lista, orden, tabla, nota, formula, codigo, ejemplo, ejercicios, op, vs, rel, ord } from './_ayuda.mjs';

/** Dominios: ramas = [[['s', 3]], [['h', 4], ['s', 2]]] → cada rama es una cadena de equipos ('s' switch, 'h' hub) con sus computadoras. */
export const dom = (router, ramas) => ({ tipo: 'if-dominios', router, ramas: ramas.map((r) => r.map(([t, pcs]) => ({ t: t === 'h' ? 'hub' : 'switch', pcs }))) });
export const led = (cual, estado) => ({ tipo: 'if-led', led: cual, estado });
export const poe = (presupuesto, equipos) => ({ tipo: 'if-poe', presupuesto, equipos: equipos.map(([n, w, c]) => ({ n, w, c })) });
export const rack = (u, equipos) => ({ tipo: 'if-rack', rack: u, equipos: equipos.map(([n, alto, c]) => ({ n, u: alto, c })) });
/** Switch: tabla = [[mac, puerto]], y la trama que entra. */
export const sw = (puertos, tablaMac, origen, destino, entrada) => ({ tipo: 'if-switch', puertos, tabla: tablaMac.map(([mac, puerto]) => ({ mac, puerto })), trama: { origen, destino, entrada } });
/** Tabla MAC desde cero: equipos = puertos de PC-A, PC-B…; tramas = [[origen, destino]] con letras ('A', 'B') o '*' para broadcast. */
export const MACS = ['00a1.1111.1111', '00b2.2222.2222', '00c3.3333.3333', '00d4.4444.4444', '00e5.5555.5555'];
const idx = (x) => (x === '*' ? -1 : 'ABCDE'.indexOf(x));
export const tm = (puertos, puertosPc, tramas) => ({ tipo: 'if-tabla-mac', puertos, equipos: puertosPc.map((puerto, i) => ({ n: 'PC-' + 'ABCDE'[i], mac: MACS[i], puerto })), tramas: tramas.map(([o, d]) => [idx(o), idx(d)]) });
export const ios = (caso, extra = {}) => ({ tipo: 'if-comando', caso, ...extra });
const [A, B, C, D, E] = MACS;
const BC = 'ffff.ffff.ffff';

export default [
  /* ------------------------------------------------------------------ 1 */
  {
    slug: 'dispositivos-de-red',
    titulo: 'Los dispositivos de una red y qué hace cada uno',
    resumen: 'Hub, switch, router, punto de acceso, firewall y módem: en qué capa trabaja cada uno, qué separa y cómo contar dominios de colisión y de broadcast.',
    nivel: 'facil',
    objetivos: [
      'Decir qué hace un hub, un switch, un router, un punto de acceso, un firewall y un módem, y en qué capa trabaja cada uno.',
      'Contar los dominios de colisión y de broadcast de una red pequeña.',
      'Distinguir un switch de capa 2 de un switch de capa 3.',
      'Reconocer las funciones que junta un router doméstico «todo en uno».',
    ],
    bloques: [
      h('Equipos finales y equipos intermedios'),
      p('En una red hay dos familias de aparatos. Los **equipos finales** (computadoras, teléfonos, impresoras, servidores) son los que **originan o reciben** la información: son los dos extremos de cada conversación. Los **equipos intermedios** (switches, routers, puntos de acceso) no son el destino de nada: su trabajo es **llevar** la información de un extremo al otro.\n\nPiensa en el correo. Tú y tu amiga son los equipos finales: escriben y leen las cartas. El buzón, la oficina postal y el cartero son los equipos intermedios: nunca leen la carta, solo la mueven.'),
      p('Esta lección presenta los equipos intermedios uno por uno. Para cada uno hay que quedarse con tres ideas: **qué mira** para decidir (nada, la dirección MAC o la dirección IP), **en qué capa** del modelo OSI trabaja y **qué separa**.'),

      h('El hub: el que repite sin pensar'),
      p('Un **hub** (concentrador) es el aparato más simple. Cuando le llega una señal eléctrica por un puerto, la **repite por todos los demás**, sin mirar a quién va dirigida. No sabe qué es una dirección: solo ve bits. Por eso trabaja en la **capa 1** (física).\n\nEs como hablar en un cuarto lleno de gente: todos escuchan lo que dices, aunque solo le hables a una persona. Y si dos hablan a la vez, nadie entiende nada. En redes, a eso se le llama **colisión**.'),
      lista(
        'Todos los equipos conectados a un hub **comparten el mismo cable**, en la práctica: solo uno puede transmitir a la vez (half-duplex).',
        'Si dos transmiten a la vez, las señales chocan y los dos tienen que esperar un tiempo al azar y repetir el envío.',
        'Cuantos más equipos tiene el hub, más colisiones hay y más lenta va la red.',
      ),
      nota('clave', 'Los hubs ya no se venden ni se instalan: los switches los reemplazaron por completo. Se siguen estudiando porque explican dos conceptos que el examen sí pregunta: el **dominio de colisión** y por qué un switch es mejor.'),

      h('El switch: el que aprende dónde vive cada quien'),
      p('Un **switch** (conmutador) se parece a un hub por fuera, pero por dentro es mucho más listo. Lee la **dirección MAC** de cada trama que recibe, recuerda por qué puerto llegó cada equipo y, a partir de ahí, entrega cada trama **solo por el puerto del destinatario**. Como decide con direcciones MAC, trabaja en la **capa 2** (enlace de datos).\n\nSiguiendo con el ejemplo: el switch es una recepcionista que conoce la oficina de cada empleado. Si llega un sobre para Ana, lo lleva a la oficina de Ana y a ninguna otra.'),
      lista(
        'Cada puerto del switch es un enlace **privado** entre el switch y el equipo: no hay con quién chocar.',
        'El equipo y el switch pueden transmitir a la vez (full-duplex).',
        'Varias conversaciones ocurren al mismo tiempo sin estorbarse.',
      ),
      p('Cómo aprende el switch y qué hace cuando no conoce al destinatario se explica con detalle en la lección 4.'),

      h('El router: el que conecta redes distintas'),
      p('Un **router** (enrutador) une **redes diferentes** y decide por dónde enviar cada paquete para que llegue a su red de destino. Para decidir lee la **dirección IP** de destino, así que trabaja en la **capa 3** (red).\n\nSi el switch es la recepcionista de un edificio, el router es la oficina postal: no le interesa en qué oficina trabajas, sino a qué **ciudad** va la carta.'),
      lista(
        'Cada interfaz de un router pertenece a **una red distinta**.',
        'Es la **puerta de enlace** (gateway) de los equipos: la salida hacia todo lo que no está en su propia red.',
        'No deja pasar los **broadcast**: un mensaje «para todos» se queda en la red donde nació.',
      ),

      h('Los tres, lado a lado'),
      tabla(['', 'Hub', 'Switch', 'Router'], [
        ['Capa OSI', '1 · Física', '2 · Enlace de datos', '3 · Red'],
        ['Qué mira para decidir', 'Nada: solo repite bits', 'La dirección MAC de destino', 'La dirección IP de destino'],
        ['Qué mueve', 'Bits', 'Tramas', 'Paquetes'],
        ['A quién le entrega', 'A todos los puertos', 'Solo al puerto del destinatario', 'A la red de destino'],
        ['Para qué sirve', 'Nada hoy en día', 'Conectar equipos de la **misma** red', 'Conectar redes **distintas**'],
      ]),
      ejemplo('facil', '¿Qué equipo hace falta?', op('En una oficina hay 20 computadoras que deben quedar en la misma red y poder trabajar todas a la vez sin estorbarse. ¿Qué equipo las conecta entre sí?',
        ['Un hub', 'Un switch', 'Un router', 'Un módem'], 1, [
          'Se pide conectar equipos de la **misma red**: eso es trabajo de capa 2, no de capa 3. El router se descarta (une redes distintas), y el módem también (conecta con el proveedor de Internet).',
          'Quedan el hub y el switch. Con un hub, las 20 computadoras compartirían un solo canal y chocarían entre sí.',
          'El switch da a cada computadora un enlace propio y entrega cada trama solo a su destinatario: **switch**.',
        ])),
      ejemplo('facil', '¿Qué equipo hace falta ahora?', op('La misma oficina abre una segunda red para el almacén, con otro rango de direcciones IP. ¿Qué equipo permite que las computadoras de una red se comuniquen con las de la otra?',
        ['Otro switch de capa 2', 'Un hub', 'Un router', 'Un panel de parcheo'], 2, [
          'Son dos redes IP distintas. Un switch de capa 2 solo entrega tramas dentro de una misma red: no sabe pasar de una a otra.',
          'Pasar de una red a otra exige leer direcciones IP y elegir un camino: eso es enrutar, capa 3.',
          'Hace falta un **router** (o un switch de capa 3, que se ve más abajo).',
        ])),

      h('Dominio de colisión'),
      p('Un **dominio de colisión** es un tramo de red donde dos equipos que transmitan a la vez **chocan**. Cuantos menos equipos comparten un dominio de colisión, mejor: lo ideal es que cada equipo tenga el suyo.'),
      tabla(['Equipo', 'Qué hace con los dominios de colisión'], [
        ['Hub', 'No los separa. Todos sus puertos forman **un solo** dominio de colisión.'],
        ['Switch', 'Los separa: **cada puerto** es un dominio de colisión propio.'],
        ['Router', 'También: **cada interfaz** es un dominio de colisión propio.'],
      ]),
      nota('truco', 'Para contar dominios de colisión, cuenta **cables**. Cada cable que une dos equipos que no son hubs es un dominio. Y todos los cables conectados a un mismo hub cuentan como **uno solo**.'),
      ejemplo('facil', 'Un hub con cuatro computadoras', dom(false, [[['h', 4]]])),
      ejemplo('facil', 'Un switch con cuatro computadoras', dom(false, [[['s', 4]]])),
      ejemplo('medio', 'Un switch con un hub colgando', dom(false, [[['s', 3], ['h', 4]]]), 'El cable que une el switch con el hub pertenece al dominio del hub: por eso el hub y sus cuatro computadoras cuentan como un solo dominio.'),

      h('Dominio de broadcast'),
      p('Un **broadcast** es un mensaje dirigido **a todos** los equipos de la red. Lo usan, por ejemplo, ARP («¿quién tiene esta dirección IP?») y DHCP («¿hay algún servidor que me dé una dirección?»).\n\nUn **dominio de broadcast** es el conjunto de equipos a los que llega el broadcast de cualquiera de ellos. Es, en la práctica, **una red**.'),
      tabla(['Equipo', 'Qué hace con un broadcast'], [
        ['Hub', 'Lo repite por todos los puertos, como todo lo demás.'],
        ['Switch de capa 2', 'Lo reenvía por todos los puertos (menos por el que entró). **No lo detiene.**'],
        ['Router', '**Lo detiene.** Cada interfaz del router es un dominio de broadcast distinto.'],
      ]),
      formula('dominios de broadcast = interfaces del router con una red conectada', [], 'Sin router (y sin VLAN), toda la red es un único dominio de broadcast, tenga los switches que tenga.'),
      nota('clave', 'Regla para el examen: el **switch** separa dominios de **colisión**; el **router** separa dominios de **broadcast** (y también de colisión). El hub no separa nada.\n\nHay una segunda forma de separar dominios de broadcast sin router: las **VLAN**, que dividen un switch en varias redes. Se estudian en el módulo de VLAN.'),
      ejemplo('medio', 'Un router con dos redes', dom(true, [[['s', 3]], [['s', 4]]])),
      ejemplo('dificil', 'Router, switches y un hub', dom(true, [[['s', 4], ['h', 3]], [['h', 5]], [['s', 2]]])),
      ejemplo('experto', 'Una red de tres ramas con equipos en cadena', dom(true, [[['s', 5], ['s', 3]], [['h', 4], ['s', 6]], [['s', 2], ['h', 2]]]), 'Cuando hay equipos en cadena, el cable que los une se cuenta una sola vez, del lado del equipo que lo «absorbe»: si uno de los dos extremos es un hub, es parte del dominio del hub.'),
      nota('aviso', 'En las redes actuales, con switches y enlaces full-duplex, las colisiones ya no ocurren. El concepto se sigue preguntando porque explica por qué se dejaron de usar los hubs y qué ganamos con un switch.'),

      h('El punto de acceso inalámbrico'),
      p('Un **punto de acceso** (AP, *access point*) es el puente entre la red inalámbrica y la red cableada: recibe por radio las tramas de laptops y teléfonos y las pasa al switch por un cable, y al revés. Trabaja en las **capas 1 y 2**: no enruta, solo extiende la misma red al aire.\n\nUn detalle importante: el aire es un medio **compartido**, como el hub. Todos los equipos conectados a un mismo AP en un mismo canal se turnan para transmitir.'),
      p('En redes grandes, con decenas o cientos de AP, no se configura cada uno a mano. Un **controlador inalámbrico** (WLC, *wireless LAN controller*) los administra a todos desde un solo lugar: reparte los canales, la potencia, las redes (SSID) y las reglas de seguridad. Otra opción es la administración **desde la nube**, como en Cisco Meraki.'),

      h('El firewall'),
      p('Un **firewall** (cortafuegos) es el guardia de la entrada: revisa el tráfico que cruza entre dos redes (normalmente la red interna e Internet) y **permite o bloquea** cada conexión según unas reglas. Las reglas básicas miran direcciones IP (capa 3) y puertos TCP o UDP (capa 4); los firewalls modernos, llamados de **nueva generación**, también inspeccionan la aplicación (capa 7). Se estudia a fondo en el módulo de seguridad.'),

      h('El módem y la ONT'),
      p('El cable que llega de tu proveedor de Internet no es Ethernet: puede ser coaxial (cable de televisión), una línea telefónica (DSL) o fibra óptica. El **módem** convierte esa señal en Ethernet y al revés. Cuando la conexión es de fibra hasta la casa, el aparato equivalente se llama **ONT** (*optical network terminal*).\n\nEl módem no decide nada sobre direcciones: solo **traduce la señal** entre dos medios. Detrás de él va el router.'),

      h('Switch de capa 2 y switch de capa 3'),
      p('El switch descrito hasta ahora es un **switch de capa 2**: solo entiende direcciones MAC y entrega tramas dentro de una misma red.\n\nUn **switch de capa 3** (o multicapa) es un switch que, además, **sabe enrutar**: lee direcciones IP y pasa paquetes de una red a otra, como un router, pero a la velocidad de un switch. Se usa sobre todo para comunicar entre sí las VLAN de un edificio.'),
      tabla(['', 'Switch de capa 2', 'Switch de capa 3', 'Router'], [
        ['Reenvía por dirección MAC', 'Sí', 'Sí', 'No'],
        ['Enruta por dirección IP', 'No', 'Sí', 'Sí'],
        ['Número de puertos', 'Muchos (24, 48)', 'Muchos (24, 48)', 'Pocos'],
        ['Uso típico', 'Conectar los equipos de los usuarios', 'Enrutar entre VLAN dentro del edificio', 'Salir a Internet y a otras sedes (WAN)'],
        ['Tipos de conexión', 'Ethernet', 'Ethernet', 'Ethernet, serie, fibra del proveedor, celular…'],
      ]),

      h('El router doméstico: varios equipos en una caja'),
      p('El «router» de tu casa en realidad son **varios aparatos metidos en una sola caja**:'),
      tabla(['Función', 'Qué hace en casa'], [
        ['Router', 'Une tu red de casa con la red del proveedor y es tu puerta de enlace.'],
        ['Switch', 'Los 4 puertos amarillos o «LAN» donde enchufas equipos por cable.'],
        ['Punto de acceso', 'La red Wi-Fi.'],
        ['Firewall y NAT', 'Bloquea las conexiones que llegan de fuera sin que nadie las pidiera, y comparte una sola IP pública entre todos tus equipos.'],
        ['Servidor DHCP', 'Reparte las direcciones IP automáticamente a cada equipo que se conecta.'],
        ['Módem u ONT', 'En muchos modelos también viene integrado.'],
      ]),
      nota('truco', 'Si en el examen aparece «router inalámbrico doméstico» o «router SOHO» (*small office/home office*), piensa en esta caja multifunción. En una empresa, cada función suele ser un equipo aparte.'),
      ejemplo('medio', 'Funciones de un router doméstico', vs('Una familia conecta dos laptops por Wi-Fi y una consola por cable al aparato que les dejó su proveedor. ¿Qué **dos** funciones de ese aparato permiten que las laptops reciban una dirección IP sola y que la consola se enchufe por cable?',
        ['Servidor DHCP', 'Controlador inalámbrico (WLC)', 'Switch integrado', 'Hub', 'Servidor DNS raíz'], [0, 2], [
          'Que un equipo reciba su dirección IP sin configurarla a mano es obra del **servidor DHCP** integrado.',
          'Los puertos LAN por cable de la caja son un pequeño **switch integrado**.',
          'Un WLC administra muchos AP en una empresa, un hub ya no se usa y los servidores DNS raíz están en Internet: ninguno está dentro de un router doméstico.',
        ])),

      h('Resumen'),
      tabla(['Equipo', 'Capa', 'Decide con', 'Separa dominios de colisión', 'Separa dominios de broadcast'], [
        ['Hub', '1', 'Nada', 'No', 'No'],
        ['Switch de capa 2', '2', 'Dirección MAC', 'Sí, uno por puerto', 'No (salvo con VLAN)'],
        ['Punto de acceso', '1 y 2', 'Dirección MAC', 'No (el aire es compartido)', 'No'],
        ['Router', '3', 'Dirección IP', 'Sí, uno por interfaz', 'Sí, uno por interfaz'],
        ['Switch de capa 3', '2 y 3', 'MAC e IP', 'Sí', 'Sí, entre sus redes'],
        ['Firewall', '3, 4 y hasta 7', 'IP, puertos y aplicación', 'Sí', 'Sí'],
        ['Módem / ONT', '1', 'Nada: convierte señales', '—', '—'],
      ]),

      ejercicios('Practica', 'En los ejercicios de dominios, cuenta cables: uno por cada enlace, y todos los de un mismo hub como uno solo.', [
        op('¿En qué capa del modelo OSI trabaja un switch de capa 2?', ['Capa 1 · Física', 'Capa 2 · Enlace de datos', 'Capa 3 · Red', 'Capa 4 · Transporte'], 1, 'El switch decide con la dirección MAC, que es la dirección de la capa 2.'),
        op('¿Qué información usa un router para decidir por dónde enviar un paquete?', ['La dirección MAC de origen', 'La dirección MAC de destino', 'La dirección IP de destino', 'El número de puerto TCP'], 2, 'El router busca la dirección IP de destino en su tabla de enrutamiento. Las direcciones MAC solo le sirven para el tramo siguiente.'),
        op('¿Qué hace un hub cuando recibe una señal por uno de sus puertos?', ['La envía solo al puerto del destinatario', 'La repite por todos los demás puertos', 'La descarta si no conoce el destino', 'La guarda hasta que el destino se conecte'], 1, 'El hub trabaja en capa 1: no lee direcciones, solo regenera la señal y la repite por todos los puertos.'),
        dom(false, [[['h', 5]]]),
        dom(false, [[['s', 6]]]),
        dom(true, [[['s', 4]]]),
        dom(true, [[['s', 3]], [['s', 3]]]),
        dom(false, [[['s', 4], ['h', 3]]]),
        dom(true, [[['h', 4]], [['s', 5]]]),
        dom(true, [[['s', 2], ['s', 4]], [['h', 3]], [['s', 6]]]),
        dom(true, [[['h', 3], ['s', 3]], [['s', 4], ['h', 5]]]),
        op('Una red tiene tres switches de capa 2 conectados entre sí, sin VLAN y sin router. ¿Cuántos dominios de broadcast hay?', ['Uno', 'Tres', 'Uno por cada puerto', 'Ninguno'], 0, 'Los switches de capa 2 reenvían los broadcast. Sin router ni VLAN, toda la red es un solo dominio de broadcast.'),
        op('¿Qué equipo convierte la señal del proveedor (coaxial, DSL o fibra) en Ethernet?', ['El switch', 'El punto de acceso', 'El módem u ONT', 'El firewall'], 2, 'El módem (o la ONT, en fibra) traduce entre el medio del proveedor y Ethernet. No enruta ni filtra.'),
        op('En una empresa con 200 puntos de acceso, ¿qué equipo permite configurarlos y vigilarlos a todos desde un solo lugar?', ['Un switch de capa 3', 'Un controlador inalámbrico (WLC)', 'Un módem', 'Un hub'], 1, 'El WLC centraliza la configuración de los AP: canales, potencia, SSID y seguridad.'),
        op('¿Qué diferencia a un switch de capa 3 de uno de capa 2?', ['Tiene más puertos', 'Además de conmutar por MAC, enruta por dirección IP', 'Funciona sin electricidad', 'Solo acepta fibra óptica'], 1, 'El switch de capa 3 añade enrutamiento: puede pasar paquetes entre redes (por ejemplo, entre VLAN).'),
        vs('¿Qué **dos** equipos separan dominios de broadcast?', ['Hub', 'Switch de capa 2 sin VLAN', 'Router', 'Switch de capa 3 enrutando entre sus redes', 'Punto de acceso'], [2, 3], 'Solo los equipos que enrutan (capa 3) detienen los broadcast. Hub, switch de capa 2 y AP los dejan pasar.'),
        rel('Relaciona cada equipo con lo que usa para tomar sus decisiones.', [['Hub', 'Nada: repite la señal'], ['Switch de capa 2', 'Dirección MAC'], ['Router', 'Dirección IP'], ['Firewall básico', 'Dirección IP y puerto TCP/UDP']], 'Capa 1 no mira direcciones, capa 2 mira la MAC, capa 3 la IP, y un firewall añade los puertos de capa 4.'),
        rel('Relaciona cada equipo con la capa del modelo OSI en la que trabaja.', [['Hub', 'Capa 1'], ['Switch', 'Capa 2'], ['Router', 'Capa 3']], 'Hub: física. Switch: enlace de datos. Router: red.', ['Capa 4', 'Capa 7']),
        op('En una red doméstica, la laptop se conecta por Wi-Fi y recibe la dirección 192.168.1.20 automáticamente. ¿Qué función del router doméstico se la dio?', ['El switch integrado', 'El servidor DHCP', 'El firewall', 'El módem'], 1, 'DHCP es el servicio que reparte direcciones IP automáticamente.'),
        op('Dos computadoras conectadas a un **hub** transmiten exactamente a la vez. ¿Qué ocurre?', ['El hub guarda una trama y envía la otra', 'Las señales chocan (colisión) y las dos deben reintentar', 'El hub las envía por puertos distintos', 'El hub apaga uno de los puertos'], 1, 'El hub no almacena ni ordena nada. Las dos señales se mezclan: es una colisión, y cada equipo espera un tiempo al azar antes de reintentar.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 2 */
  {
    slug: 'puertos-y-luces-de-estado',
    titulo: 'Puertos y luces de estado de un equipo Cisco',
    resumen: 'Para qué sirve cada puerto (consola, Ethernet, SFP, serie, USB, PoE) y cómo leer los LED para decirle a un ingeniero exactamente qué ves.',
    nivel: 'facil',
    objetivos: [
      'Identificar los puertos de un switch y de un router Cisco y decir para qué sirve cada uno.',
      'Explicar qué es PoE, sus estándares y cómo se calcula el presupuesto de potencia.',
      'Interpretar el LED de sistema y los LED de los puertos en sus distintos modos.',
      'Describir por teléfono, sin ambigüedades, el estado de un equipo.',
    ],
    bloques: [
      h('Por qué importa esta lección'),
      p('Una tarea muy típica de un técnico de soporte es ser **los ojos y las manos** de un ingeniero que está en otra ciudad. Te dirá cosas como «conecta el cable de consola», «¿de qué color está el LED del puerto 12?» o «pasa el cable al puerto SFP». Para ayudarle necesitas dos cosas: **reconocer cada puerto** y **describir con exactitud lo que ves**. El examen CCST pregunta las dos.'),

      h('El puerto de consola'),
      p('El **puerto de consola** sirve para administrar el equipo **conectándote directamente a él**, sin pasar por la red. Es la entrada de emergencia: funciona aunque el equipo no tenga dirección IP, aunque la red esté caída o aunque el equipo sea nuevo y esté sin configurar.'),
      tabla(['Tipo de consola', 'Cómo se ve', 'Cable'], [
        ['RJ-45', 'Un conector igual al de red, normalmente con el borde azul claro y la etiqueta CONSOLE', 'Cable de consola (*rollover*), plano y azul claro. Hoy casi siempre con adaptador a USB para la laptop.'],
        ['USB', 'Un puerto mini-USB tipo B o USB-C, también marcado CONSOLE', 'Un cable USB normal. Puede necesitar un controlador en la laptop.'],
      ]),
      p('En la laptop se usa un programa **emulador de terminal** (PuTTY, Tera Term, SecureCRT). Los valores de la conexión serie son siempre los mismos, y vale la pena memorizarlos:'),
      formula('9600 baudios · 8 bits de datos · sin paridad · 1 bit de parada · sin control de flujo', [], 'Suele abreviarse «9600 8N1».'),
      nota('error', 'El puerto de consola RJ-45 **no es un puerto Ethernet**, aunque el conector sea el mismo. Si enchufas ahí un cable de red hacia un switch, no pasa nada: no da enlace ni se daña, pero tampoco funciona.'),
      p('Algunos routers tienen además un puerto **AUX** (auxiliar). Se parece al de consola y servía para conectar un módem telefónico y entrar al equipo a distancia cuando la red fallaba. Hoy casi no se usa.'),

      h('Los puertos Ethernet'),
      p('Son los puertos de datos: donde se conectan computadoras, teléfonos, puntos de acceso y otros equipos de red. Su nombre dice su **velocidad máxima**:'),
      tabla(['Nombre en IOS', 'Abreviatura', 'Velocidad'], [
        ['Ethernet', 'Et / E', '10 Mb/s (antiguo)'],
        ['FastEthernet', 'Fa', '100 Mb/s'],
        ['GigabitEthernet', 'Gi', '1,000 Mb/s = 1 Gb/s'],
        ['TenGigabitEthernet', 'Te', '10 Gb/s'],
      ]),
      p('Después del nombre va la **posición** del puerto. La forma depende del equipo:'),
      tabla(['Ejemplo', 'Cómo se lee'], [
        ['`Fa0/1`', 'Módulo 0, puerto 1. Habitual en switches fijos sencillos.'],
        ['`Gi1/0/24`', 'Switch 1 de la pila, módulo 0, puerto 24. Habitual en switches apilables.'],
        ['`Gi0/0/1`', 'En routers modernos: ranura 0, subranura 0, puerto 1.'],
      ]),
      nota('truco', 'En un switch, los puertos se numeran desde **1**. En muchos routers, desde **0**. Cuando el ingeniero diga «Gi1/0/5», repítele lo que lees impreso junto al puerto para confirmar que hablan del mismo.'),

      h('Puertos de fibra y ranuras SFP'),
      p('Los enlaces largos o muy rápidos (entre pisos, entre edificios, hacia los servidores) van por **fibra óptica**. Pero el switch no trae el conector de fibra soldado: trae **ranuras SFP**, unos huecos rectangulares donde se inserta un **transceptor**, un módulo pequeño que convierte las señales eléctricas del switch en luz.'),
      tabla(['Ranura', 'Velocidad', 'Nota'], [
        ['SFP', '1 Gb/s', '*Small form-factor pluggable*.'],
        ['SFP+', '10 Gb/s', 'Mismo tamaño físico que el SFP.'],
        ['QSFP+ / QSFP28', '40 / 100 Gb/s', 'Más ancho. En equipos de centro de datos.'],
      ]),
      lista(
        'Los transceptores se cambian **en caliente**: se meten y se sacan con el equipo encendido.',
        'Hay transceptores de fibra (casi siempre con conector **LC** doble) y también de cobre (con RJ-45).',
        'El transceptor debe ser del tipo correcto para la fibra instalada (multimodo o monomodo) e igual en los dos extremos.',
        'Los puertos que conectan un switch con otro o con el núcleo de la red se llaman **uplink** (enlaces de subida).',
      ),
      nota('aviso', 'Nunca mires de frente un puerto de fibra o la punta de un cable de fibra conectado: el láser es invisible y puede dañar la vista. Y deja puestas las tapas antipolvo en los puertos que no se usan.'),

      h('Puertos serie'),
      p('Los **puertos serie** (Serial) son de los routers, no de los switches. Servían para los enlaces WAN clásicos entre sedes: líneas dedicadas contratadas a un operador. Son conectores anchos, con muchos pines, y se nombran `Serial0/0/0` o `Se0/0/0`. Hoy la mayoría de los enlaces WAN llegan por Ethernet o fibra, pero los puertos serie siguen apareciendo en laboratorios y en el examen.'),

      h('Puertos USB y puerto de gestión'),
      lista(
        '**USB tipo A.** Para conectar una memoria USB: copiar una imagen de IOS, guardar un respaldo de la configuración o recuperarla. No sirve para dar red a una computadora.',
        '**Puerto de gestión** (rotulado MGMT, o `FastEthernet0` / `GigabitEthernet0/0` según el modelo). Es un puerto Ethernet **solo para administrar** el equipo desde una red aparte, separada de la de los usuarios. A esa red aparte se le llama gestión *fuera de banda*.',
      ),
      ejemplo('facil', '¿Qué puerto uso?', op('Llega un switch nuevo, sin configurar y sin dirección IP. El ingeniero te pide que conectes tu laptop para que él pueda darle la configuración inicial por escritorio remoto. ¿A qué puerto del switch conectas la laptop?',
        ['A cualquier puerto Ethernet', 'Al puerto de consola', 'A una ranura SFP', 'Al puerto USB tipo A'], 1, [
          'El switch no tiene dirección IP: por la red no se puede entrar a configurarlo, así que los puertos Ethernet quedan descartados.',
          'La ranura SFP es para transceptores de enlaces de datos, y el USB tipo A es para memorias.',
          'El puerto pensado para administrar el equipo sin depender de la red es el de **consola**, con el cable de consola y un emulador de terminal a 9600 baudios.',
        ])),
      ejemplo('medio', 'Identificar puertos por su función', rel('Relaciona cada puerto con su uso principal.', [
        ['Consola', 'Administrar el equipo conectándose directamente, sin red'],
        ['Ranura SFP', 'Insertar un transceptor para un enlace de fibra'],
        ['USB tipo A', 'Conectar una memoria para copiar IOS o configuraciones'],
        ['Serial', 'Enlace WAN clásico entre routers'],
      ], [
        'La consola es la entrada local de administración: no depende de la red.',
        'El SFP es un hueco para transceptores; el tipo de transceptor decide si el enlace es de fibra o de cobre.',
        'El USB tipo A acepta memorias; el puerto serie es propio de routers y de enlaces WAN antiguos.',
      ], ['Dar corriente a un teléfono IP'])),

      h('PoE: corriente por el cable de red'),
      p('**PoE** (*Power over Ethernet*) permite que el switch **alimente** a un equipo por el mismo cable de red por el que le envía los datos. Así un teléfono IP, un punto de acceso o una cámara funcionan sin un enchufe cerca.\n\nEn PoE hay dos papeles. El que **da** la energía (el switch) se llama **PSE**. El que la **recibe** (el teléfono, la cámara) se llama **PD**. Antes de enviar corriente, el switch **detecta** si el equipo conectado es PoE: a una computadora normal no le envía nada, así que no hay riesgo de dañarla.'),
      tabla(['Estándar', 'Nombre común', 'Potencia que da el puerto', 'Potencia que llega al equipo', 'Ejemplos'], [
        ['IEEE 802.3af', 'PoE', '15.4 W', '12.95 W', 'Teléfonos IP, cámaras fijas'],
        ['IEEE 802.3at', 'PoE+', '30 W', '25.5 W', 'Puntos de acceso, cámaras con motor'],
        ['IEEE 802.3bt (tipo 3)', 'PoE++ / UPOE', '60 W', '51 W', 'AP de alto rendimiento, pantallas pequeñas'],
        ['IEEE 802.3bt (tipo 4)', 'PoE++ / UPOE+', '90 W', '71.3 W', 'Iluminación, pantallas, equipos de videoconferencia'],
      ], 'La potencia que llega es menor que la que sale porque parte se pierde como calor en el cable.'),
      p('Un switch no puede dar la potencia máxima en todos sus puertos a la vez. Su fuente tiene un límite total llamado **presupuesto PoE** (por ejemplo, 370 W). Si los equipos conectados piden más que el presupuesto, el switch **niega la energía** a los últimos, y esos equipos no encienden.'),
      ejemplo('facil', 'Un presupuesto que alcanza', poe(370, [['Teléfono IP', 7, 20], ['Punto de acceso', 25, 6]])),
      ejemplo('medio', 'Un presupuesto que no alcanza', poe(185, [['Cámara IP', 13, 8], ['Punto de acceso Wi-Fi 6', 30, 4]]), 'Es un caso real muy común: el técnico conecta el último punto de acceso y no enciende. El cable está bien; lo que falta es presupuesto.'),

      h('El LED de sistema'),
      p('En el frente de un switch Catalyst hay un grupo de luces. La primera es **SYST** (sistema): resume cómo está **el switch entero**.'),
      tabla(['LED SYST', 'Significado'], [
        ['Apagado', 'El switch no recibe energía.'],
        ['Verde parpadeante', 'Está arrancando: carga el sistema y hace su autoprueba (POST).'],
        ['Verde fijo', 'Funciona con normalidad.'],
        ['Ámbar', 'Recibe energía, pero no funciona bien: falló el arranque o hay una avería.'],
      ]),
      ejemplo('facil', 'El switch acaba de encenderse', led('syst', 2)),
      ejemplo('facil', 'Algo va mal', led('syst', 3)),

      h('Los LED de los puertos y el botón MODE'),
      p('Cada puerto tiene su propio LED. Lo que ese LED cuenta depende del **modo** elegido con el botón **MODE**: cada pulsación pasa al modo siguiente, y un LED junto al botón indica cuál está activo (STAT, DUPLX, SPEED, PoE). Unos segundos después, el switch vuelve solo al modo STAT.'),
      h3('Modo STAT (estado): el modo normal'),
      tabla(['LED del puerto', 'Significado'], [
        ['Apagado', 'No hay enlace, o el puerto está apagado por configuración (`shutdown`).'],
        ['Verde fijo', 'Hay enlace, sin tráfico en este momento.'],
        ['Verde parpadeante', 'Hay enlace y pasa tráfico.'],
        ['Verde y ámbar alternando', 'Fallo de enlace: el puerto registra errores (tramas dañadas, colisiones excesivas).'],
        ['Ámbar fijo', 'El puerto está bloqueado por Spanning Tree y no reenvía datos.'],
      ]),
      nota('clave', 'Al conectar un equipo a un switch, el LED se pone **ámbar unos 30 segundos** y luego pasa a verde. No es una avería: Spanning Tree (STP) comprueba que la conexión nueva no forme un bucle antes de dejar pasar datos.'),
      h3('Modos DUPLX, SPEED y PoE'),
      tabla(['Modo', 'LED del puerto', 'Significado'], [
        ['DUPLX', 'Apagado', 'Half-duplex'],
        ['DUPLX', 'Verde', 'Full-duplex'],
        ['SPEED', 'Apagado', '10 Mb/s'],
        ['SPEED', 'Verde fijo', '100 Mb/s'],
        ['SPEED', 'Verde parpadeante', '1,000 Mb/s'],
        ['PoE', 'Apagado', 'El puerto no entrega energía'],
        ['PoE', 'Verde', 'El puerto alimenta al equipo conectado'],
        ['PoE', 'Verde y ámbar alternando', 'Energía negada: se excedería el presupuesto PoE'],
        ['PoE', 'Ámbar parpadeante', 'PoE cortado en ese puerto por una avería'],
      ]),
      nota('aviso', 'Estos significados son los habituales en los switches Catalyst de acceso (como la serie 2960). **Cambian entre modelos**: en otros equipos hay más LED (fuente redundante, pila, ventiladores) o colores distintos. La referencia final es siempre la guía de hardware del modelo.'),
      ejemplo('medio', 'Un puerto que no levanta', led('stat', 0)),
      ejemplo('medio', 'Un puerto con errores', led('stat', 3)),
      ejemplo('dificil', 'Comprobar la velocidad sin entrar al equipo', led('speed', 1), 'Un puerto Gigabit que negocia solo a 100 Mb/s suele delatar un cable dañado o de categoría antigua: con solo dos pares de hilos buenos, el enlace no pasa de 100.'),
      ejemplo('dificil', 'Un teléfono que no enciende', led('poe', 2)),

      h('Cómo decírselo al ingeniero'),
      p('Cuando describas un equipo por teléfono o en un ticket, da **datos**, no interpretaciones. «El switch está mal» no ayuda. Esto sí:'),
      orden(
        '**Qué equipo:** nombre o etiqueta, modelo y ubicación («el switch SW-PISO2, un Catalyst de 48 puertos, en el rack del segundo piso»).',
        '**Qué LED:** el de sistema, o el número exacto del puerto («el LED del puerto 12»).',
        '**Qué color y cómo:** verde, ámbar o apagado; **fijo o parpadeando**; si alterna entre dos colores.',
        '**Qué modo:** qué LED de modo está encendido (normalmente STAT).',
        '**Qué cambió:** si antes estaba distinto, o qué se hizo justo antes.',
      ),

      h('Resumen'),
      lista(
        '**Consola:** administración local sin red, a 9600 8N1. No es Ethernet aunque use RJ-45.',
        '**Fa, Gi, Te:** 100 Mb/s, 1 Gb/s y 10 Gb/s.',
        '**SFP / SFP+:** ranuras para transceptores de 1 y 10 Gb/s, normalmente de fibra.',
        '**Serial:** enlaces WAN clásicos, en routers.',
        '**USB tipo A:** memorias. **MGMT:** administración por una red aparte.',
        '**PoE:** af 15.4 W, at 30 W, bt 60 o 90 W por puerto, siempre dentro del presupuesto total.',
        '**SYST:** verde fijo bien, parpadeando arranca, ámbar falla, apagado sin corriente.',
        '**Puerto en STAT:** apagado sin enlace, verde enlace, parpadeo tráfico, ámbar bloqueado por STP, alternando errores.',
      ),

      ejercicios('Practica', 'En los ejercicios de LED, imagina que tienes el switch delante y que el ingeniero espera tu respuesta al teléfono.', [
        op('¿Qué configuración usa el emulador de terminal para conectarse al puerto de consola de un equipo Cisco?', ['115200 baudios, 8 bits, paridad par', '9600 baudios, 8 bits de datos, sin paridad, 1 bit de parada', '9600 baudios, 7 bits, paridad impar', '1200 baudios, 8 bits, 2 bits de parada'], 1, 'El valor por defecto es 9600 8N1, sin control de flujo.'),
        op('¿Qué velocidad máxima tiene un puerto llamado `GigabitEthernet0/1`?', ['10 Mb/s', '100 Mb/s', '1 Gb/s', '10 Gb/s'], 2, 'Gigabit = 1,000 Mb/s = 1 Gb/s. FastEthernet es 100 Mb/s y TenGigabitEthernet es 10 Gb/s.'),
        op('En un switch apilable aparece el puerto `Gi2/0/15`. ¿Qué indica el primer número?', ['La velocidad del puerto', 'El número de switch dentro de la pila', 'La VLAN del puerto', 'El número de puerto'], 1, 'El formato es switch/módulo/puerto: es el puerto 15 del módulo 0 del switch 2 de la pila.'),
        led('syst', 0), led('syst', 1), led('stat', 1), led('stat', 2), led('stat', 4), led('duplx', 0), led('speed', 2), led('poe', 1), led('poe', 3),
        poe(123, [['Teléfono IP', 7, 12], ['Lector de tarjetas', 5, 4]]),
        poe(370, [['Punto de acceso', 25, 10], ['Cámara IP', 13, 10]]),
        poe(740, [['Punto de acceso Wi-Fi 6', 30, 12], ['Cámara domo con motor', 40, 6], ['Teléfono IP', 7, 24]]),
        op('Un punto de acceso necesita 25 W para funcionar. ¿Cuál es el estándar PoE **mínimo** que debe tener el puerto del switch?', ['IEEE 802.3af (PoE)', 'IEEE 802.3at (PoE+)', 'IEEE 802.3bt tipo 4', 'IEEE 802.1Q'], 1, '802.3af entrega como máximo 12.95 W al equipo: no alcanza. 802.3at (PoE+) entrega hasta 25.5 W. 802.1Q no es PoE: es el etiquetado de VLAN.'),
        op('Conectas una computadora a un puerto del switch y el LED se queda en ámbar unos 30 segundos antes de ponerse verde. ¿Qué está pasando?', ['El puerto está averiado', 'Spanning Tree comprueba que no haya un bucle antes de reenviar', 'El cable es de categoría incorrecta', 'El switch se está reiniciando'], 1, 'Es el comportamiento normal de STP al levantarse un puerto. Si el ámbar no desaparece, entonces sí hay que investigar.'),
        op('¿Para qué sirve el puerto USB tipo A de un router Cisco?', ['Para dar red a una computadora', 'Para conectar una memoria USB con imágenes de IOS o configuraciones', 'Para alimentar teléfonos IP', 'Para conectar un monitor'], 1, 'El USB tipo A acepta almacenamiento. El acceso de administración por USB es otro puerto: la consola USB (mini-B o USB-C).'),
        vs('¿Cuáles **dos** afirmaciones sobre los transceptores SFP son correctas?', ['Se pueden insertar y retirar con el equipo encendido', 'Solo existen para fibra monomodo', 'Un SFP+ trabaja a 10 Gb/s', 'Se configuran con un tornillo en la parte trasera', 'Sirven para dar PoE a las cámaras'], [0, 2], 'Los SFP se cambian en caliente, y SFP+ es la versión de 10 Gb/s. Existen para fibra multimodo, monomodo y cobre.'),
        vs('Un ingeniero te pide por teléfono el estado del puerto 8. ¿Qué **dos** datos son indispensables?', ['El color del LED y si está fijo o parpadea', 'La marca de tu teléfono', 'Qué modo indica el botón MODE (STAT, DUPLX, SPEED, PoE)', 'El color del cable', 'La temperatura del cuarto'], [0, 2], 'El mismo LED significa cosas distintas según el modo: verde fijo es «enlace» en STAT, «100 Mb/s» en SPEED y «full-duplex» en DUPLX.'),
        rel('Relaciona cada estándar con la potencia máxima que entrega el puerto del switch.', [['IEEE 802.3af', '15.4 W'], ['IEEE 802.3at', '30 W'], ['IEEE 802.3bt tipo 3', '60 W'], ['IEEE 802.3bt tipo 4', '90 W']], 'af = PoE, at = PoE+, bt = PoE++ en sus dos tipos.'),
        op('El LED del puerto 5, en modo PoE, alterna entre verde y ámbar, y el teléfono IP conectado no enciende. ¿Cuál es la causa más probable?', ['El teléfono está en otra VLAN', 'El switch agotó su presupuesto PoE y negó la energía a ese puerto', 'El puerto está en half-duplex', 'El cable es de fibra'], 1, 'En modo PoE, verde y ámbar alternando significa energía negada por falta de presupuesto. Hay que liberar potencia o usar un switch con más presupuesto.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 3 */
  {
    slug: 'diagramas-cableado-y-rack',
    titulo: 'Diagramas de red, cableado y rack',
    resumen: 'Cómo leer un diagrama físico y uno lógico, conectar los cables que indica, y montar equipos en un rack con orden, energía y ventilación correctas.',
    nivel: 'medio',
    objetivos: [
      'Distinguir un diagrama físico de un diagrama lógico y saber qué pregunta responde cada uno.',
      'Seguir un diagrama para conectar cada cable en el puerto correcto.',
      'Explicar para qué sirven el panel de parcheo, los latiguillos y el etiquetado.',
      'Calcular el espacio en unidades de rack y aplicar las buenas prácticas de energía y ventilación.',
    ],
    bloques: [
      h('Para qué sirve un diagrama'),
      p('Un **diagrama de red** es el mapa de la red. Sin mapa, cada avería empieza con una hora perdida siguiendo cables con la mano. Con mapa, basta mirarlo para saber qué equipo conecta con cuál y por qué puerto.\n\nEn el examen CCST, y en el trabajo, la situación típica es esta: un ingeniero te envía un diagrama y te pide que **conectes los cables como indica**. Para hacerlo bien hay que saber leerlo.'),

      h('Diagrama físico y diagrama lógico'),
      p('Hay dos tipos de diagrama, y responden preguntas distintas.'),
      tabla(['', 'Diagrama físico', 'Diagrama lógico'], [
        ['Pregunta que responde', '¿**Dónde** está cada equipo y **qué cable** va a qué puerto?', '¿**Cómo fluye** la información y qué **direcciones** usa?'],
        ['Qué muestra', 'Ubicación (edificio, piso, rack), modelos, puertos, tipo y recorrido de los cables', 'Redes y subredes, direcciones IP, VLAN, nombres de equipos, protocolos de enrutamiento'],
        ['Quién lo usa más', 'El técnico que instala o reemplaza un equipo', 'El ingeniero que diseña o diagnostica'],
        ['Analogía', 'El plano de una casa: paredes, puertas, tuberías', 'El directorio: quién vive en cada departamento'],
      ]),
      nota('clave', 'Si la pregunta habla de **puertos, cables, racks o ubicaciones**, es el diagrama **físico**. Si habla de **direcciones IP, subredes o VLAN**, es el **lógico**. Muchos diagramas reales mezclan los dos, pero el examen los separa.'),
      ejemplo('facil', '¿Qué diagrama necesito?', op('Tienes que reemplazar un switch dañado y volver a conectar sus 24 cables exactamente como estaban. ¿Qué documento te sirve?',
        ['El diagrama lógico de la red', 'El diagrama físico (y la tabla de puertos)', 'La tabla de enrutamiento', 'La lista de contraseñas'], 1, [
          'La tarea consiste en saber **qué cable va en qué puerto**: es información física.',
          'El diagrama lógico diría a qué subred pertenece cada equipo, pero no en qué puerto se enchufa.',
          'El **diagrama físico**, normalmente acompañado de una tabla de conexiones puerto por puerto, es el documento correcto.',
        ])),
      ejemplo('facil', '¿Y ahora?', op('Un usuario del segundo piso no puede llegar al servidor de archivos. Quieres saber a qué subred pertenece su computadora y cuál es su puerta de enlace. ¿Qué diagrama consultas?',
        ['El diagrama físico', 'El diagrama lógico', 'El plano eléctrico del edificio', 'El diagrama del rack'], 1, [
          'Subred y puerta de enlace son datos de **direccionamiento**: capa 3.',
          'Eso vive en el **diagrama lógico**. El físico te serviría después, si resulta que el problema es un cable.',
        ])),

      h('Los símbolos'),
      p('Los diagramas usan símbolos estándar para que cualquiera los entienda sin leyenda. Estos son los de Cisco que más aparecen:'),
      tabla(['Equipo', 'Cómo es su símbolo'], [
        ['Router', 'Un cilindro bajo (un disco) con **cuatro flechas** en cruz: dos hacia dentro y dos hacia fuera.'],
        ['Switch de capa 2', 'Una caja rectangular con **flechas paralelas** que apuntan en sentidos opuestos.'],
        ['Switch de capa 3', 'La caja del switch con un círculo de flechas encima, como las del router.'],
        ['Punto de acceso', 'Una caja con **ondas** de radio.'],
        ['Firewall', 'Un **muro de ladrillos**.'],
        ['Nube', 'Una red que no administras o cuyo interior no interesa: Internet o la red del proveedor.'],
        ['Línea recta', 'Un enlace Ethernet (cable de cobre o fibra).'],
        ['Línea en zigzag (rayo)', 'Un enlace serie o WAN.'],
      ]),
      p('Junto a cada línea, el diagrama escribe **el puerto de cada extremo**. Esa es la parte que más importa al cablear.'),

      h('Leer un diagrama y conectar los cables'),
      p('Supón que el ingeniero te envía esta tabla de conexiones, sacada del diagrama físico:'),
      tabla(['Cable', 'Extremo A', 'Extremo B', 'Tipo'], [
        ['1', 'R1 · Gi0/0/0', 'ONT del proveedor · LAN1', 'Cobre, Cat 6'],
        ['2', 'R1 · Gi0/0/1', 'SW1 · Gi1/0/24', 'Cobre, Cat 6'],
        ['3', 'SW1 · Te1/1/1 (SFP+)', 'SW2 · Te1/1/1 (SFP+)', 'Fibra multimodo, LC-LC'],
        ['4', 'SW1 · Gi1/0/1', 'Panel de parcheo A · puerto 1', 'Cobre, Cat 6'],
      ]),
      p('Para conectarlos sin errores, sigue siempre el mismo orden:'),
      orden(
        '**Localiza los equipos** por su etiqueta, no por su aspecto: dos switches iguales se distinguen solo por el nombre pegado al frente.',
        '**Localiza el puerto exacto** leyendo el número impreso junto a él. `Gi1/0/24` es el puerto 24; `Te1/1/1` está en el módulo de uplink, aparte de los demás.',
        '**Comprueba el tipo de cable** que pide el diagrama: cobre o fibra, y qué conector.',
        '**Conecta** hasta oír el clic del seguro del conector.',
        '**Verifica** el LED de enlace en los dos extremos.',
        '**Etiqueta** el cable en las dos puntas y avisa de cualquier diferencia con el diagrama.',
      ),
      nota('error', 'El error más común es conectar en el puerto **de al lado**. En muchos switches los puertos van en dos filas: arriba los impares (1, 3, 5…) y abajo los pares (2, 4, 6…). El puerto 2 no está a la derecha del 1, sino debajo.'),
      ejemplo('medio', 'Elegir el cable correcto', op('Según la tabla de arriba, ¿qué necesitas para hacer la conexión 3 entre SW1 y SW2?',
        ['Un cable de cobre Cat 6 con conectores RJ-45', 'Un cable de consola', 'Dos transceptores SFP+ y un cable de fibra multimodo con conectores LC', 'Un cable serie'], 2, [
          'Los puertos son `Te1/1/1`: TenGigabit, y la tabla aclara que son ranuras **SFP+**. Una ranura vacía no acepta ningún cable.',
          'Hace falta un **transceptor SFP+ en cada switch**, los dos del mismo tipo.',
          'Entre los transceptores va el cable que pide la tabla: **fibra multimodo con conectores LC**.',
        ])),

      h('Cableado estructurado: panel de parcheo y latiguillos'),
      p('En un edificio, el cable que sale del conector de la pared **no llega directo al switch**. Recorre el techo o las canaletas y termina en un **panel de parcheo** (*patch panel*) dentro del rack. El panel es una regleta de conectores numerados: cada uno corresponde a un conector de pared.\n\nEse cable fijo, de la pared al panel, se llama **cableado horizontal** y no se toca nunca. Lo que sí se mueve son los **latiguillos** (*patch cords*): cables cortos y flexibles con un conector RJ-45 en cada punta.'),
      tabla(['Tramo', 'Qué une', 'Se mueve'], [
        ['Latiguillo de usuario', 'La computadora con el conector de la pared', 'Sí'],
        ['Cableado horizontal', 'El conector de la pared con el panel de parcheo', 'No: está fijo en la pared'],
        ['Latiguillo de parcheo', 'El panel de parcheo con un puerto del switch', 'Sí: aquí se decide qué puerto del switch usa cada escritorio'],
      ]),
      p('¿Por qué complicarse? Porque así, para cambiar a un usuario de puerto o de VLAN, solo se mueve un latiguillo de 30 centímetros en el rack. Nadie tiene que abrir el techo.'),
      nota('clave', 'Un enlace de cobre Ethernet mide como máximo **100 metros** en total: hasta 90 m de cableado horizontal fijo y hasta 10 m sumando los latiguillos de los dos extremos.'),

      h('Etiquetado'),
      p('Un cable sin etiqueta es un cable que alguien tendrá que seguir a mano algún día. La regla es simple: **cada cable se etiqueta en sus dos extremos**, y la etiqueta coincide con la documentación.'),
      lista(
        'Conector de pared y panel de parcheo llevan **el mismo código** (por ejemplo, `2B-017`: piso 2, panel B, puerto 17).',
        'Los equipos llevan su **nombre** al frente y atrás, igual que en el diagrama.',
        'Los cables de alimentación también: indican a qué circuito o PDU van.',
        'Si cambias una conexión, **actualiza el diagrama**. Un diagrama desactualizado es peor que no tener ninguno, porque se confía en él.',
      ),

      h('El rack y la unidad U'),
      p('Los equipos de red se montan en un **rack** (bastidor): una estructura metálica con rieles verticales perforados. Casi todos siguen el mismo estándar: **19 pulgadas** de ancho entre rieles.\n\nLa altura se mide en **unidades de rack**, que se abrevian **U** (a veces RU):'),
      formula('1U = 1.75 pulgadas = 44.45 mm', [['U', 'unidad de rack: la altura de tres perforaciones del riel']], 'Un rack completo estándar mide 42U. Los hay más pequeños (de pared, de 6U a 18U) y más altos.'),
      tabla(['Equipo', 'Altura típica'], [
        ['Switch de acceso, router pequeño, firewall, panel de parcheo', '1U'],
        ['Organizador horizontal de cables', '1U o 2U'],
        ['Servidor', '1U o 2U'],
        ['UPS para rack', '2U o más'],
        ['Switch modular (chasis)', '4U o más'],
      ]),
      ejemplo('facil', 'Cuánto espacio queda', rack(12, [['Switch de acceso', 1, 2], ['Panel de parcheo', 1, 2], ['Organizador de cables', 1, 2], ['Router', 1, 1]])),
      ejemplo('medio', 'Un rack de sala de servidores', rack(42, [['Servidor', 2, 4], ['Switch de acceso', 1, 3], ['Panel de parcheo', 1, 3], ['UPS', 2, 2], ['Switch modular', 4, 1]])),

      h('Energía: PDU, UPS y fuentes redundantes'),
      tabla(['Elemento', 'Qué es', 'Para qué sirve'], [
        ['PDU', 'Unidad de distribución de energía: una regleta de enchufes montada en el rack', 'Repartir la corriente a todos los equipos. Las administrables miden el consumo y permiten apagar tomas a distancia.'],
        ['UPS', 'Sistema de alimentación ininterrumpida: baterías', 'Mantener los equipos encendidos unos minutos si se va la luz, y protegerlos de picos de voltaje.'],
        ['Fuente redundante', 'Una segunda fuente de alimentación en el mismo equipo', 'Que el equipo siga encendido si una fuente falla.'],
      ]),
      nota('truco', 'Dos fuentes conectadas a la **misma** PDU no protegen de nada si esa PDU falla. La redundancia real es conectar cada fuente a una **PDU distinta**, alimentada por un **circuito distinto** (y, si se puede, por una UPS distinta).'),
      ejemplo('medio', 'Redundancia de verdad', op('Un switch crítico tiene dos fuentes de alimentación. ¿Cómo deben conectarse para que el switch siga encendido si falla un circuito eléctrico?',
        ['Las dos a la misma PDU, en tomas contiguas', 'Cada una a una PDU distinta, alimentadas por circuitos distintos', 'Una a la PDU y la otra se deja desconectada como repuesto', 'Las dos a una regleta doméstica conectada a la PDU'], 1, [
          'El objetivo es que **un solo fallo** no apague el equipo.',
          'Si las dos fuentes comparten PDU o circuito, ese elemento es un punto único de fallo.',
          'Cada fuente va a una **PDU y un circuito distintos**. Una fuente desconectada no protege: no entra en servicio sola.',
        ])),

      h('Buenas prácticas en el rack'),
      lista(
        '**Lo pesado, abajo.** Las UPS y los servidores grandes van en la parte baja para que el rack no se vuelque.',
        '**Respeta el flujo de aire.** Los equipos toman aire frío por delante y lo sacan caliente por detrás: todos orientados igual, sin tapar las rejillas.',
        '**Tapa los huecos** con paneles ciegos: evitan que el aire caliente vuelva hacia el frente.',
        '**Ordena los cables** con organizadores y cintas de velcro (no bridas de plástico apretadas, que dañan el cable). Los cables no deben tapar los puertos ni las etiquetas.',
        '**Separa datos y corriente:** los cables de red por un lado del rack y los de alimentación por el otro.',
        '**Respeta el radio de curvatura,** sobre todo en la fibra: una curva cerrada rompe o atenúa la señal.',
        '**Usa todos los tornillos** de las orejas de montaje, y pulsera antiestática al manipular módulos.',
      ),
      ejemplo('dificil', 'Montar un rack con criterio', ord('Vas a montar en un rack vacío estos equipos. Ordénalos de **abajo hacia arriba** siguiendo las buenas prácticas.', [
        'UPS (el equipo más pesado)', 'Servidores', 'Switch de acceso', 'Organizador de cables', 'Panel de parcheo',
      ], [
        'Lo más pesado va abajo: primero la **UPS** y encima los **servidores**.',
        'El **switch** queda a una altura cómoda para trabajar.',
        'Justo encima del switch va el **organizador**, y sobre él el **panel de parcheo**: así los latiguillos bajan del panel, pasan por el organizador y llegan al switch sin cruzarse.',
      ])),
      ejemplo('experto', 'Un caso completo', op('Vas a instalar un switch nuevo de 1U en un rack de 24U que ya tiene ocupadas 22U. El switch alimentará 20 teléfonos (7 W cada uno) y 6 puntos de acceso (25 W cada uno), y su presupuesto PoE es de 370 W. ¿Cuál es la conclusión correcta?',
        ['No cabe en el rack', 'Cabe en el rack, pero el presupuesto PoE no alcanza', 'Cabe en el rack y el presupuesto PoE alcanza', 'Cabe, pero solo si se retira la UPS'], 2, [
          'Espacio: 24U − 22U = 2U libres. El switch ocupa 1U: **cabe**, y aún queda 1U.',
          'Energía PoE: 20 × 7 W = 140 W y 6 × 25 W = 150 W. Total: 290 W.',
          '290 W ≤ 370 W: el presupuesto **alcanza**, con 80 W de margen.',
        ])),

      h('Resumen'),
      lista(
        '**Diagrama físico:** dónde y con qué cable. **Diagrama lógico:** qué redes y qué direcciones.',
        'Al cablear: equipo por su etiqueta, puerto por su número, tipo de cable según el diagrama, verificar el LED y etiquetar.',
        '**Panel de parcheo:** donde termina el cableado fijo. **Latiguillo:** el cable corto que sí se mueve.',
        'Cobre: 100 m como máximo, 90 fijos más 10 de latiguillos.',
        '**1U = 1.75 pulgadas.** Rack de 19 pulgadas de ancho; el estándar completo mide 42U.',
        '**PDU** reparte, **UPS** respalda, y las fuentes redundantes van a circuitos distintos.',
      ),

      ejercicios('Practica', 'Para los ejercicios de rack: multiplica cantidad por altura, suma y resta del total.', [
        op('¿Qué tipo de diagrama muestra las direcciones IP, las subredes y las VLAN de una red?', ['El diagrama físico', 'El diagrama lógico', 'El plano del rack', 'El diagrama eléctrico'], 1, 'El direccionamiento es información lógica. El físico muestra ubicaciones, puertos y cables.'),
        op('¿Qué tipo de diagrama indica en qué rack y en qué unidad está montado cada equipo?', ['El diagrama lógico', 'El diagrama físico', 'La tabla de enrutamiento', 'La tabla ARP'], 1, 'La ubicación de los equipos es información física.'),
        op('En un diagrama de Cisco, ¿qué equipo se dibuja como un disco con cuatro flechas en cruz?', ['Un switch', 'Un router', 'Un firewall', 'Un punto de acceso'], 1, 'El router es el cilindro bajo con cuatro flechas. El switch es una caja con flechas paralelas en sentidos opuestos.'),
        op('¿Qué representa una nube en un diagrama de red?', ['Un servidor de respaldo', 'Una red cuyo interior no se detalla, como Internet o la del proveedor', 'Una red inalámbrica', 'Un equipo apagado'], 1, 'La nube resume una red que no administras o cuyo detalle no importa para el diagrama.'),
        op('¿Cuánto mide de alto una unidad de rack (1U)?', ['1 pulgada', '1.75 pulgadas', '2.5 pulgadas', '19 pulgadas'], 1, '1U = 1.75 pulgadas = 44.45 mm. Las 19 pulgadas son el ancho estándar del rack.'),
        rack(24, [['Switch de acceso', 1, 4], ['Panel de parcheo', 1, 4], ['Organizador de cables', 1, 4], ['Router', 1, 2]]),
        rack(42, [['Servidor', 2, 6], ['Cabina de discos', 3, 2], ['UPS', 2, 2], ['Switch de acceso', 1, 2]]),
        rack(18, [['Switch modular', 4, 1], ['Firewall', 1, 2], ['Router', 1, 2], ['Panel de parcheo', 1, 3]]),
        rack(45, [['Servidor', 2, 10], ['Switch modular', 4, 2], ['UPS', 2, 3], ['Panel de parcheo', 1, 4]]),
        op('¿Cuál es la longitud máxima total de un enlace Ethernet de cobre, contando los latiguillos?', ['50 m', '90 m', '100 m', '500 m'], 2, 'El límite es 100 m: hasta 90 m de cableado fijo y 10 m repartidos entre los latiguillos de ambos extremos.'),
        op('¿Qué elemento del rack mantiene los equipos encendidos durante unos minutos si se va la luz?', ['La PDU', 'La UPS', 'El panel de parcheo', 'El organizador de cables'], 1, 'La UPS tiene baterías. La PDU solo reparte la corriente que recibe.'),
        op('En un switch con los puertos en dos filas, ¿dónde suele estar el puerto 2?', ['A la derecha del puerto 1', 'Debajo del puerto 1', 'En la parte trasera', 'En el módulo de uplink'], 1, 'Lo habitual es impares arriba y pares abajo. Por eso siempre se lee el número impreso antes de conectar.'),
        vs('¿Cuáles **dos** son buenas prácticas al montar un rack?', ['Colocar la UPS en la parte más alta', 'Poner los equipos más pesados en la parte baja', 'Orientar todos los equipos con la misma dirección de flujo de aire', 'Apretar los cables con bridas de plástico lo más posible', 'Dejar sin etiquetar los cables que no se van a mover'], [1, 2], 'Peso abajo para la estabilidad, y flujo de aire uniforme (frente frío, parte trasera caliente). Las bridas apretadas dañan los cables, y todo cable se etiqueta.'),
        vs('¿Qué **dos** datos encontrarías en un diagrama **físico**?', ['El puerto del switch al que llega cada cable', 'La máscara de subred de cada VLAN', 'El rack y el piso donde está cada equipo', 'El protocolo de enrutamiento', 'La puerta de enlace de cada red'], [0, 2], 'Puertos y ubicaciones son datos físicos. Máscaras, protocolos y puertas de enlace son datos lógicos.'),
        rel('Relaciona cada elemento con su función.', [['Panel de parcheo', 'Termina el cableado fijo que viene de las paredes'], ['Latiguillo', 'Une el panel con un puerto del switch'], ['PDU', 'Reparte la corriente dentro del rack'], ['UPS', 'Da energía de respaldo con baterías']], 'El panel es fijo y el latiguillo es lo que se mueve; la PDU reparte y la UPS respalda.'),
        ord('Ordena los pasos para hacer una conexión siguiendo un diagrama.', ['Localizar los dos equipos por su etiqueta', 'Localizar el puerto exacto en cada equipo', 'Comprobar que el cable es del tipo indicado', 'Conectar y verificar el LED de enlace', 'Etiquetar el cable y avisar de cualquier diferencia con el diagrama'], 'Primero se identifica (equipo, puerto, cable), luego se conecta y se verifica, y al final se documenta.'),
        op('Un equipo tiene dos fuentes de alimentación, las dos enchufadas a la misma PDU. ¿Qué riesgo queda sin cubrir?', ['Ninguno: ya es redundante', 'Que falle esa PDU o su circuito: se apagaría todo el equipo', 'Que el equipo consuma el doble', 'Que se dañen los puertos Ethernet'], 1, 'La PDU compartida es un punto único de fallo. Cada fuente debe ir a una PDU y a un circuito distintos.'),
        op('Mueves un latiguillo del puerto 5 al puerto 9 del switch a petición del ingeniero. ¿Qué debes hacer al terminar?', ['Nada más: ya funciona', 'Actualizar la documentación y el etiquetado para que reflejen el cambio', 'Reiniciar el switch', 'Cambiar el cable por uno nuevo'], 1, 'Todo cambio físico se documenta. Un diagrama que no coincide con la realidad hace perder tiempo en la siguiente avería.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 4 */
  {
    slug: 'como-funciona-un-switch',
    titulo: 'Cómo funciona un switch: la tabla de direcciones MAC',
    resumen: 'La trama Ethernet, la dirección MAC y las cuatro cosas que hace un switch: aprender, reenviar, inundar y filtrar. Con recorridos trama a trama.',
    nivel: 'medio',
    objetivos: [
      'Describir los campos de una trama Ethernet y el formato de una dirección MAC.',
      'Explicar cómo llena un switch su tabla de direcciones MAC.',
      'Predecir qué hace un switch con una trama: reenviar, inundar o filtrar.',
      'Leer la salida de `show mac address-table` y explicar el filtrado por MAC.',
    ],
    bloques: [
      h('La dirección MAC'),
      p('Cada tarjeta de red sale de fábrica con una **dirección MAC** (*media access control*): un identificador que, en principio, es único en el mundo. Se le llama también dirección física o dirección de hardware, porque va ligada a la tarjeta y no a la red en la que estés.\n\nUna MAC tiene **48 bits**, que se escriben como **12 dígitos hexadecimales**. Según el sistema, los verás agrupados de formas distintas, pero es la misma dirección:'),
      tabla(['Dónde', 'Formato', 'Ejemplo'], [
        ['Linux, macOS, Android', 'Seis pares separados por dos puntos', '`00:1a:2b:3c:4d:5e`'],
        ['Windows', 'Seis pares separados por guiones', '`00-1A-2B-3C-4D-5E`'],
        ['Cisco IOS', 'Tres grupos de cuatro, separados por puntos', '`001a.2b3c.4d5e`'],
      ]),
      p('Los 48 bits se reparten en dos mitades:'),
      tabla(['Parte', 'Bits', 'Qué identifica', 'En `00:1a:2b:3c:4d:5e`'], [
        ['OUI', 'Los primeros 24 (6 dígitos)', 'Al **fabricante** de la tarjeta', '`00:1a:2b`'],
        ['Número de serie', 'Los últimos 24 (6 dígitos)', 'A esa tarjeta concreta de ese fabricante', '`3c:4d:5e`'],
      ]),
      nota('clave', 'Hay una dirección MAC especial: `ff:ff:ff:ff:ff:ff` (en Cisco, `ffff.ffff.ffff`). Es la dirección de **broadcast**: una trama con ese destino va dirigida a **todos** los equipos de la red.'),

      h('La trama Ethernet'),
      p('En la capa 2, los datos viajan en **tramas**. Una trama es como un sobre: lleva escrito a quién va y quién lo envía, y dentro lleva el contenido (normalmente, un paquete IP).'),
      tabla(['Campo', 'Tamaño', 'Para qué sirve'], [
        ['Preámbulo y delimitador', '8 bytes', 'Avisan de que empieza una trama y sincronizan al receptor.'],
        ['MAC de destino', '6 bytes', 'A quién va la trama. Va **primero** para que el switch decida pronto.'],
        ['MAC de origen', '6 bytes', 'Quién la envía.'],
        ['Tipo (EtherType)', '2 bytes', 'Qué lleva dentro: `0x0800` IPv4, `0x0806` ARP, `0x86DD` IPv6.'],
        ['Datos', '46 a 1,500 bytes', 'El contenido: el paquete IP.'],
        ['FCS', '4 bytes', 'Código para detectar errores. Si no cuadra, la trama se descarta.'],
      ]),
      p('De todos esos campos, al switch le importan sobre todo dos: la **MAC de origen** y la **MAC de destino**. Con la primera aprende; con la segunda decide.'),

      h('La tabla de direcciones MAC'),
      p('El switch guarda en memoria una lista llamada **tabla de direcciones MAC** (o tabla CAM). Cada renglón dice: «la MAC tal está en el puerto tal». Es su libreta de direcciones.\n\nCuando el switch se enciende, la tabla está **vacía**. Nadie se la escribe: el switch la llena solo, observando el tráfico. Para entender cómo, hay que conocer las cuatro cosas que hace con cada trama.'),

      h('1. Aprender: mirar el origen'),
      p('Cada vez que entra una trama, el switch mira su **MAC de origen** y anota: «esta MAC llegó por este puerto, así que el equipo está de ese lado».\n\nEs la misma lógica de quien reparte el correo en una oficina: si Ana te entrega un sobre desde la oficina 3, ya sabes que a Ana se le encuentra en la oficina 3.'),
      lista(
        'Si la MAC **no estaba** en la tabla, se añade.',
        'Si **ya estaba** en ese puerto, no cambia nada: solo se reinicia su temporizador.',
        'Si estaba en **otro puerto**, se actualiza: el equipo se movió.',
      ),
      nota('error', 'El switch **nunca aprende de la MAC de destino**. Que alguien le escriba a Ana no dice dónde está Ana; solo dice dónde está quien escribe.'),

      h('2. Reenviar: el destino está en la tabla'),
      p('Después de aprender, el switch busca la **MAC de destino** en la tabla. Si la encuentra, envía la trama **solo por ese puerto**. Los demás equipos ni se enteran.'),

      h('3. Inundar: el destino no está en la tabla'),
      p('Si la MAC de destino **no está** en la tabla, el switch no sabe dónde vive ese equipo. No puede tirar la trama, porque el destino puede existir y simplemente no haber hablado todavía. Así que hace lo único seguro: envía una copia **por todos los puertos, menos por el que entró**. A eso se le llama **inundar** (*flooding*).\n\nHay dos casos de inundación:'),
      tabla(['Caso', 'Por qué se inunda'], [
        ['**Unicast desconocido**', 'La trama va a un solo equipo, pero su MAC todavía no está en la tabla.'],
        ['**Broadcast**', 'La MAC de destino es `ffff.ffff.ffff`: va para todos, así que siempre se inunda. Esa dirección nunca aparece en la tabla.'],
      ]),
      p('Cuando el destino responde, su trama trae su MAC como origen, el switch la aprende, y a partir de ahí ya no hace falta inundar.'),

      h('4. Filtrar: el destino está en el mismo puerto'),
      p('Queda un caso raro. Si la tabla dice que el destino está en **el mismo puerto por el que entró la trama**, el switch no la reenvía: la **descarta**. El destino está del mismo lado que el origen (hay un hub u otro switch en ese puerto) y ya recibió la trama por su cuenta.'),
      tabla(['¿Dónde está la MAC de destino?', 'Qué hace el switch', 'Sale por'], [
        ['En la tabla, en otro puerto', '**Reenvía**', '1 puerto'],
        ['No está en la tabla', '**Inunda**', 'Todos menos el de entrada'],
        ['Es `ffff.ffff.ffff`', '**Inunda**', 'Todos menos el de entrada'],
        ['En la tabla, en el mismo puerto de entrada', '**Filtra** (descarta)', 'Ninguno'],
      ]),
      ejemplo('facil', 'El destino es conocido', sw(6, [[A, 1], [B, 2], [C, 3]], A, C, 1)),
      ejemplo('facil', 'El destino es desconocido', sw(6, [[A, 1], [B, 2]], A, D, 1)),
      ejemplo('medio', 'Una trama de broadcast de un equipo nuevo', sw(8, [[A, 1], [B, 2], [C, 3]], D, BC, 5), 'Así empieza casi toda conversación en una red: con un broadcast de ARP. Fíjate en que, aunque la trama se inunde, el switch sí aprende al remitente.'),
      ejemplo('dificil', 'El equipo cambió de puerto', sw(8, [[A, 1], [B, 2], [C, 3]], B, A, 7), 'Pasa cuando alguien desenchufa su laptop y la conecta en otro conector de pared. El switch se corrige solo con la primera trama que envía.'),
      ejemplo('dificil', 'Origen y destino del mismo lado', sw(8, [[A, 4], [B, 4], [C, 2]], A, B, 4), 'En el puerto 4 hay un hub con dos computadoras. La trama de una a otra llega también al switch, que no tiene nada que hacer con ella.'),

      h('Recorrido completo, trama a trama'),
      p('Un switch de 4 puertos acaba de encenderse. En Fa0/1 está PC-A, en Fa0/2 PC-B y en Fa0/3 PC-C. Sigue lo que pasa:'),
      tabla(['Paso', 'Trama', 'El switch aprende', 'El switch hace', 'Tabla al terminar'], [
        ['1', 'PC-A → PC-B', 'A está en Fa0/1', 'No conoce a B: **inunda** por Fa0/2, Fa0/3 y Fa0/4', 'A'],
        ['2', 'PC-B → PC-A', 'B está en Fa0/2', 'Conoce a A: **reenvía** solo por Fa0/1', 'A, B'],
        ['3', 'PC-A → PC-B', 'Nada nuevo', 'Conoce a B: **reenvía** solo por Fa0/2', 'A, B'],
        ['4', 'PC-C → broadcast', 'C está en Fa0/3', 'Broadcast: **inunda** por Fa0/1, Fa0/2 y Fa0/4', 'A, B, C'],
      ]),
      p('En el paso 1, PC-C recibió una trama que no era para ella: su tarjeta de red la descartó al ver que la MAC de destino no era la suya. A partir del paso 2, la conversación entre A y B es privada.'),
      ejemplo('medio', 'Tres tramas desde cero', tm(6, [1, 2, 3], [['A', 'B'], ['B', 'A'], ['C', 'A']])),
      ejemplo('dificil', 'El destino nunca habló', tm(8, [2, 4, 6, 8], [['A', 'D'], ['B', 'D'], ['C', 'A'], ['A', 'D']]), 'PC-D recibe tramas pero nunca envía una: el switch jamás la aprende, y todo lo que va hacia ella se inunda una y otra vez.'),
      ejemplo('experto', 'Con un hub en uno de los puertos', tm(6, [3, 5, 3, 1], [['A', '*'], ['C', 'A'], ['B', 'C'], ['D', 'B'], ['C', 'A']]), 'PC-A y PC-C cuelgan del mismo hub en Fa0/3. Por eso el switch tiene dos MAC en un mismo puerto, y filtra lo que va de una a otra.'),

      h('El envejecimiento de las entradas'),
      p('Las entradas aprendidas no duran para siempre. Cada una tiene un temporizador: si pasan **300 segundos** (5 minutos, el valor por defecto en Cisco) sin que llegue una trama con esa MAC de origen, la entrada **se borra**.\n\nAsí la tabla no se llena de equipos que ya se apagaron o se fueron. Si el equipo vuelve a enviar algo, el switch lo aprende de nuevo. También se borran todas las entradas de un puerto cuando ese puerto pierde el enlace, y la tabla entera cuando el switch se reinicia.'),

      h('Ver la tabla: show mac address-table'),
      codigo('show mac address-table', `SW1# show mac address-table
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    0050.7966.6800    DYNAMIC     Fa0/1
   1    0050.7966.6801    DYNAMIC     Fa0/2
  10    00d0.bc12.3456    DYNAMIC     Fa0/5
  10    0c1e.aa01.9f20    STATIC      Fa0/6
   1    001a.2b3c.4d5e    DYNAMIC     Gi0/1
   1    001a.2b3c.4d5f    DYNAMIC     Gi0/1
   1    001a.2b3c.4d60    DYNAMIC     Gi0/1
Total Mac Addresses for this criterion: 7`),
      p('Cómo leerla:'),
      lista(
        '**Vlan:** la tabla es por VLAN. El switch solo reenvía e inunda dentro de la VLAN de la trama.',
        '**Mac Address:** en el formato de Cisco, tres grupos de cuatro dígitos.',
        '**Type:** `DYNAMIC` es aprendida sola y envejece; `STATIC` es escrita por un administrador (o fijada por seguridad) y no envejece.',
        '**Ports:** el puerto por el que se llega a esa MAC.',
      ),
      nota('truco', '¿Ves **varias MAC en un mismo puerto**, como en Gi0/1? Ese puerto no conecta una computadora: detrás hay **otro switch** (o un hub, o un punto de acceso). Es la forma más rápida de reconocer un enlace entre switches.'),
      ejemplo('medio', 'Leer la tabla', op('Según la salida de arriba, ¿qué hace SW1 con una trama de la VLAN 1 que entra por Fa0/1 con MAC de destino `0050.7966.6801`?',
        ['La inunda por todos los puertos de la VLAN 1', 'La reenvía solo por Fa0/2', 'La reenvía por Gi0/1', 'La descarta'], 1, [
          'Se busca la MAC de destino en la tabla, dentro de la VLAN 1.',
          'La entrada existe: `0050.7966.6801` está en **Fa0/2**.',
          'Fa0/2 es un puerto distinto del de entrada (Fa0/1): el switch **reenvía** solo por Fa0/2.',
        ])),
      ejemplo('facil', 'El comando', ios('showmac')),

      h('Filtrado por MAC y seguridad de puerto'),
      p('Como el switch ve la MAC de todo lo que se conecta, puede usarla para **controlar quién entra**. La idea se llama **filtrado por dirección MAC**, y aparece en dos sitios:'),
      tabla(['Dónde', 'Cómo se llama', 'Qué hace'], [
        ['En un switch Cisco', '**Seguridad de puerto** (*port security*)', 'Limita cuántas MAC puede haber en un puerto, o cuáles. Si aparece una MAC no permitida, el puerto puede bloquear ese tráfico o apagarse por completo (queda en estado *err-disabled*).'],
        ['En un router Wi-Fi doméstico', '**Filtro MAC**', 'Una lista de MAC permitidas (o prohibidas) para conectarse a la red inalámbrica.'],
      ]),
      nota('aviso', 'El filtrado por MAC **no es una seguridad fuerte**. Una dirección MAC se puede cambiar por software en segundos, y además viaja sin cifrar: quien quiera entrar solo tiene que copiar una MAC permitida. Sirve como una barrera más, nunca como la única.'),

      h('El switch y las VLAN'),
      p('Todo lo explicado ocurre **dentro de una VLAN**. Si el switch tiene varias VLAN, lleva una tabla MAC separada para cada una, y una trama que nace en la VLAN 10 solo se reenvía o se inunda por puertos de la VLAN 10. Por eso una VLAN es un dominio de broadcast aparte. Todo eso se estudia en el módulo de **VLAN**.'),

      h('Resumen'),
      lista(
        '**MAC:** 48 bits, 12 dígitos hexadecimales. Los 6 primeros son el fabricante (OUI).',
        '**Aprender:** con la MAC de **origen** y el puerto de entrada.',
        '**Reenviar:** destino conocido en otro puerto → sale por 1 puerto.',
        '**Inundar:** destino desconocido o broadcast → sale por todos menos el de entrada.',
        '**Filtrar:** destino en el mismo puerto de entrada → no sale.',
        '**Envejecimiento:** 300 segundos sin tráfico y la entrada se borra.',
        '`show mac address-table` muestra VLAN, MAC, tipo y puerto.',
      ),

      ejercicios('Practica', 'En cada trama, primero piensa qué aprende el switch (origen) y después qué decide (destino).', [
        op('¿Cuántos bits tiene una dirección MAC?', ['32', '48', '64', '128'], 1, 'Son 48 bits, escritos como 12 dígitos hexadecimales. 32 bits tiene una IPv4 y 128 una IPv6.'),
        op('En la dirección MAC `00:1a:2b:3c:4d:5e`, ¿qué parte identifica al fabricante?', ['`3c:4d:5e`', '`00:1a:2b`', '`00`', '`5e`'], 1, 'Los primeros 24 bits (6 dígitos hexadecimales) son el OUI, asignado al fabricante.'),
        op('¿Qué campo de la trama usa el switch para **llenar** su tabla de direcciones MAC?', ['La MAC de destino', 'La MAC de origen', 'El campo Tipo', 'El FCS'], 1, 'El switch aprende de quien envía: asocia la MAC de origen con el puerto de entrada.'),
        op('¿Cuál es la dirección MAC de broadcast?', ['`0000.0000.0000`', '`ffff.ffff.ffff`', '`0100.5e00.0001`', '`255.255.255.255`'], 1, 'Todos los bits en 1: `ffff.ffff.ffff`. `255.255.255.255` es el broadcast de IPv4, no una MAC.'),
        sw(6, [[A, 1], [B, 3], [C, 5]], B, C, 3),
        sw(8, [[A, 2], [B, 4]], C, A, 6),
        sw(8, [[A, 1], [B, 2], [C, 3], [D, 4]], A, E, 1),
        sw(6, [[A, 1], [B, 2], [C, 3]], C, BC, 3),
        sw(8, [[A, 1], [B, 2], [C, 3]], A, B, 5),
        sw(8, [[A, 6], [B, 6], [C, 6], [D, 1]], B, C, 6),
        sw(6, [[A, 2], [B, 2], [C, 4]], D, A, 2),
        tm(6, [1, 2, 3], [['A', 'B'], ['A', 'C'], ['B', 'A']]),
        tm(8, [1, 3, 5, 7], [['A', '*'], ['B', 'A'], ['C', 'D'], ['D', 'C']]),
        tm(5, [1, 2, 3], [['A', 'B'], ['A', 'B'], ['A', 'B'], ['A', 'B']]),
        tm(8, [2, 2, 5, 7], [['A', 'B'], ['B', 'A'], ['C', 'B'], ['D', '*'], ['A', 'B']]),
        tm(6, [1, 4, 4, 6], [['B', 'C'], ['D', 'A'], ['A', 'D'], ['C', 'B'], ['D', 'C']]),
        op('¿Cuánto tiempo conserva un switch Cisco, por defecto, una entrada dinámica de la que no vuelve a ver tráfico?', ['30 segundos', '300 segundos', '3,600 segundos', 'Para siempre'], 1, 'El tiempo de envejecimiento por defecto es de 300 segundos (5 minutos).'),
        op('En `show mac address-table` ves doce direcciones MAC distintas asociadas al puerto Gi0/1. ¿Qué hay conectado ahí con toda probabilidad?', ['Una computadora con doce tarjetas de red', 'Otro switch (o un punto de acceso) con varios equipos detrás', 'Un puerto averiado', 'Un router con doce interfaces'], 1, 'Un equipo final muestra una MAC. Muchas MAC en un puerto delatan otro equipo de capa 2 detrás.'),
        vs('¿En cuáles **dos** casos un switch **inunda** una trama?', ['Cuando la MAC de destino es `ffff.ffff.ffff`', 'Cuando la MAC de destino está en la tabla, en otro puerto', 'Cuando la MAC de destino no está en la tabla', 'Cuando la MAC de origen no está en la tabla', 'Cuando la trama trae un error en el FCS'], [0, 2], 'Se inunda el broadcast y el unicast desconocido. Que el origen sea nuevo solo hace que se aprenda; una trama con error se descarta.'),
        rel('Relaciona cada situación con lo que hace el switch.', [['Destino conocido en otro puerto', 'Reenvía por un puerto'], ['Destino desconocido', 'Inunda'], ['Destino en el mismo puerto de entrada', 'Filtra'], ['Origen desconocido', 'Aprende una entrada nueva']], 'Aprender depende del origen; reenviar, inundar o filtrar dependen del destino.'),
        op('¿Por qué el filtrado por dirección MAC no se considera una medida de seguridad fuerte?', ['Porque las direcciones MAC cambian solas cada día', 'Porque una MAC se puede falsificar fácilmente por software', 'Porque los switches no pueden leer la MAC', 'Porque solo funciona con fibra'], 1, 'Cualquiera puede cambiar la MAC de su tarjeta y copiar una permitida, que además viaja sin cifrar.'),
        ios('showmac'),
      ]),
    ],
  },
];
