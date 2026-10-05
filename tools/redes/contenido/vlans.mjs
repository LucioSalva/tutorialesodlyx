// Módulo de VLAN: de «qué es un dominio de broadcast» a diseñar y diagnosticar una red con varias VLAN.
import { h, p, lista, orden, tabla, nota, formula, codigo, ejemplo, ejercicios, op } from './_ayuda.mjs';

const rango = (id) => ({ tipo: 'vl-rango', id });
const cmd = (caso, extra = {}) => ({ tipo: 'vl-comando', caso, ...extra });
const etq = (vlan, nativa) => (nativa === undefined ? { tipo: 'vl-etiqueta', vlan, puerto: 'acceso' } : { tipo: 'vl-etiqueta', vlan, puerto: 'troncal', nativa });
/** Broadcast en un switch: accesos = VLAN de Fa0/1, Fa0/2…; troncales = listas de VLAN permitidas; origen = n.º de puerto (desde 1). */
const dif = (accesos, troncales, origen) => ({ tipo: 'vl-difusion', origen: origen - 1,
  puertos: [...accesos.map((vlan, i) => ({ n: `Fa0/${i + 1}`, vlan })), ...troncales.map((permitidas, i) => ({ n: `Gi0/${i + 1}`, permitidas }))] });
/** Alcance: troncales en cadena, [switch, vlan] de cada PC y, si hay router, sus VLAN. */
const alc = (troncales, [swA, vlanA], [swB, vlanB], router) => ({ tipo: 'vl-alcance', troncales, a: { sw: swA, vlan: vlanA }, b: { sw: swB, vlan: vlanB }, ...(router ? { router: { vlans: router } } : {}) });
const sub = (vlan, red, pr, gw = 'primera', iface = 'g0/0') => ({ tipo: 'vl-subinterfaz', vlan, red, p: pr, gw, iface });
const dis = (base, p0, vlans) => ({ tipo: 'vl-diseno', base, p0, vlans: vlans.map(([id, nombre, hosts]) => ({ id, nombre, hosts })) });

export default {
  slug: 'vlans', titulo: 'VLAN', capa: 'Capa 2 · Enlace',
  resumen: 'Redes locales virtuales: separar un switch en varias redes, enlaces troncales 802.1Q y enrutamiento entre VLAN.',
  descripcion: 'Cómo un mismo switch aloja varias redes aisladas, cómo viajan etiquetadas entre switches, cómo se enrutan entre sí y cómo se diseña su direccionamiento. Con comandos de Cisco IOS, ejemplos resueltos y ejercicios que se corrigen solos.',
  examenes: [
    { id: 'basico', nombre: 'Básico', resumen: '10 preguntas de los niveles 1 y 2: rangos, puertos de acceso, etiquetado y troncales.', niveles: [1, 2], preguntas: 10 },
    { id: 'intermedio', nombre: 'Intermedio', resumen: '10 preguntas de los niveles 3 y 4: alcance entre switches y enrutamiento entre VLAN.', niveles: [3, 4], preguntas: 10 },
    { id: 'avanzado', nombre: 'Avanzado', resumen: '6 preguntas de los niveles 5 y 6: diseño con VLSM y redes de tres switches.', niveles: [5, 6], preguntas: 6 },
    { id: 'completo', nombre: 'Completo', resumen: '12 preguntas, dos de cada nivel.', niveles: [1, 2, 3, 4, 5, 6], preguntas: 12 },
  ],
  lecciones: [
    /* ---------------------------------------------------------------- 1 */
    {
      slug: 'que-es-una-vlan',
      titulo: 'Qué es una VLAN y qué problema resuelve',
      resumen: 'El dominio de broadcast, por qué una red plana no escala y cómo una VLAN parte un switch en varias redes independientes.',
      nivel: 'facil',
      objetivos: [
        'Explicar qué es un dominio de broadcast y por qué conviene hacerlo pequeño.',
        'Describir qué hace una VLAN dentro de un switch.',
        'Reconocer los rangos de ID de VLAN y los tipos de VLAN más comunes.',
      ],
      bloques: [
        h('El punto de partida: un switch, una sola red'),
        p(`Un switch recién sacado de la caja conecta todos sus puertos entre sí. Cuando un equipo envía un **broadcast** (una trama dirigida a todos, como las peticiones ARP o DHCP), el switch la copia por **todos los demás puertos**. Y si ese switch está conectado a otros, la trama sigue viajando por ellos.

El conjunto de equipos que reciben el broadcast de cualquiera de ellos se llama **dominio de broadcast**. Sin configurar nada, todos los switches de un edificio forman un único dominio de broadcast: una **red plana**.`),
        p(`Una red plana da problemas en cuanto crece:`),
        lista(
          '**Ruido.** Cada equipo recibe y procesa los broadcast de todos los demás. Con cientos de equipos, una parte apreciable del tráfico es ruido.',
          '**Seguridad.** Todos están en la misma red: la computadora de un visitante alcanza directamente los servidores de contabilidad.',
          '**Fragilidad.** Un equipo averiado o un bucle que inunde la red de broadcast afecta a todo el mundo.',
          '**Rigidez.** Para separar dos departamentos haría falta comprar switches distintos y tender cables aparte.',
        ),

        h('Qué es una VLAN'),
        p(`Una **VLAN** (red de área local virtual) es una red separada que existe **por configuración**, no por cableado. Al crear VLAN en un switch y repartir sus puertos entre ellas, el switch se comporta como si fuera **varios switches independientes**: las tramas de una VLAN solo salen por puertos de esa misma VLAN.`),
        tabla(['', 'Sin VLAN', 'Con VLAN'], [
          ['Dominios de broadcast', 'Uno solo para todo el switch', 'Uno por cada VLAN'],
          ['Un broadcast llega a…', 'todos los puertos', 'solo los puertos de su VLAN'],
          ['Dos equipos de departamentos distintos', 'se ven directamente', 'no se ven: necesitan un router'],
          ['Para separar redes', 'más switches y más cable', 'unos comandos de configuración'],
        ]),
        nota('clave', `Una VLAN es **un dominio de broadcast**. Los equipos de VLAN distintas no pueden comunicarse por capa 2, aunque estén enchufados al mismo switch, uno al lado del otro. Para pasar de una VLAN a otra hace falta un dispositivo de capa 3: un router o un switch de capa 3.`),
        ejemplo('facil', 'Un broadcast en un switch con dos VLAN', dif([10, 10, 20, 20, 10, 20], [], 1)),
        ejemplo('facil', 'Tres VLAN en el mismo switch', dif([10, 20, 30, 10, 30, 30, 20, 30], [], 3)),

        h('Una VLAN, una subred'),
        p(`Como cada VLAN es una red aparte, a cada una le corresponde **su propia subred IP**. Es la regla de diseño más importante del módulo:`),
        formula('1 VLAN = 1 dominio de broadcast = 1 subred IP', [], 'Por eso VLAN y subneteo se estudian juntos: las VLAN separan en capa 2 y las subredes direccionan cada una en capa 3.'),
        tabla(['VLAN', 'Nombre', 'Subred', 'Puerta de enlace'], [
          ['10', 'VENTAS', '192.168.10.0/24', '192.168.10.1'],
          ['20', 'SOPORTE', '192.168.20.0/24', '192.168.20.1'],
          ['30', 'DIRECCION', '192.168.30.0/24', '192.168.30.1'],
        ], 'Una costumbre muy útil: hacer coincidir el tercer octeto de la subred con el número de VLAN. No es obligatorio, pero evita muchos errores.'),

        h('El identificador de VLAN'),
        p(`Cada VLAN se identifica con un número, el **VLAN ID**. Ese número viaja en un campo de **12 bits**, así que hay 2^12 = 4,096 valores, del 0 al 4095. El primero y el último están reservados: los utilizables van del **1 al 4094**.`),
        tabla(['ID', 'Rango', 'Qué son'], [
          ['0 y 4095', 'Reservados', 'No se pueden usar.'],
          ['1', 'VLAN por defecto', 'Existe siempre. Todos los puertos pertenecen a ella de fábrica. No se puede borrar.'],
          ['2 – 1001', 'Rango normal', 'Las que se crean en el día a día.'],
          ['1002 – 1005', 'Reservadas', 'Heredadas de Token Ring y FDDI. Aparecen en el switch, pero no se usan ni se borran.'],
          ['1006 – 4094', 'Rango extendido', 'Para redes muy grandes y proveedores.'],
        ]),
        ejemplo('facil', 'La VLAN de fábrica', rango(1)),
        ejemplo('facil', 'Una VLAN corriente', rango(150)),
        ejemplo('medio', 'Un ID que aparece pero no se usa', rango(1003)),
        ejemplo('medio', 'El último valor de 12 bits', rango(4095)),

        h('Tipos de VLAN según su uso'),
        tabla(['Tipo', 'Para qué se usa'], [
          ['**De datos**', 'El tráfico normal de los usuarios. Normalmente una por departamento o función.'],
          ['**De voz**', 'Los teléfonos IP, separados de los datos para darles prioridad.'],
          ['**De gestión**', 'El acceso de los administradores a los propios switches (SSH, monitorización).'],
          ['**Nativa**', 'La que cruza los enlaces troncales sin etiqueta. Se explica en la lección 4.'],
          ['**Por defecto**', 'La VLAN 1: donde están todos los puertos antes de configurarlos.'],
        ]),
        nota('aviso', `Se recomienda **no usar la VLAN 1** para tráfico de usuarios ni para gestión. Como todos los puertos nacen en ella, cualquier puerto olvidado sin configurar da acceso a esa red.`),

        ejercicios('Practica', 'En los ejercicios de broadcast, cuenta los puertos de la misma VLAN sin incluir el puerto de origen.', [
          rango(1), rango(20), rango(999), rango(1001), rango(1002), rango(1006), rango(3000), rango(4094), rango(0), rango(4096),
          dif([10, 10, 10, 20, 20], [], 1), dif([10, 20, 10, 20, 10, 20, 10, 20], [], 2), dif([30, 30, 40, 50, 50, 50, 30], [], 4), dif([10, 10, 10, 10, 10, 10], [], 6),
          op('¿Qué es un dominio de broadcast?', ['El conjunto de equipos que comparten el mismo cable', 'El conjunto de equipos que reciben un broadcast enviado por cualquiera de ellos', 'El rango de direcciones IP de una empresa', 'El número de puertos de un switch'], 1, 'Un dominio de broadcast es el alcance de una trama de broadcast. Cada VLAN es uno, y los routers los separan.'),
          op('Dos computadoras están conectadas al mismo switch, una en la VLAN 10 y otra en la VLAN 20. ¿Pueden hacerse ping?', ['Sí, porque comparten switch', 'Sí, si tienen direcciones IP de la misma subred', 'No, salvo que un router o switch de capa 3 enrute entre las dos VLAN', 'No, nunca: las VLAN no se pueden comunicar'], 2, 'El switch no pasa tramas de una VLAN a otra. Para comunicarlas hace falta enrutamiento entre VLAN, que se ve en la lección 5.'),
          op('¿Cuántos ID de VLAN se pueden usar en total, contando la VLAN 1?', ['1,005', '4,094', '4,096', '65,536'], 1, 'El campo tiene 12 bits (4,096 valores), pero el 0 y el 4095 están reservados: quedan del 1 al 4094.'),
          op('Una empresa crea las VLAN 10, 20 y 30. ¿Cuántas subredes IP necesita como mínimo?', ['Una para todas', 'Dos', 'Tres, una por VLAN', 'Depende del número de switches'], 2, 'Cada VLAN es una red independiente y necesita su propia subred.'),
          op('¿Cuál de estas NO es una ventaja de usar VLAN?', ['Reducir el tamaño de los dominios de broadcast', 'Separar departamentos sin comprar más switches', 'Aumentar la velocidad máxima de cada puerto', 'Agrupar equipos por función aunque estén en pisos distintos'], 2, 'Las VLAN organizan y aíslan el tráfico, pero no cambian la velocidad física de los puertos.'),
        ]),
      ],
    },

    /* ---------------------------------------------------------------- 2 */
    {
      slug: 'crear-vlan-y-puertos-de-acceso',
      titulo: 'Crear VLAN y asignar puertos de acceso',
      resumen: 'Los comandos para crear una VLAN, ponerle nombre, asignarle puertos y comprobar el resultado con show vlan brief.',
      nivel: 'facil',
      objetivos: [
        'Crear y nombrar una VLAN en un switch Cisco.',
        'Configurar un puerto como acceso y asignarlo a una VLAN.',
        'Leer la salida de `show vlan brief`.',
      ],
      bloques: [
        h('Qué es un puerto de acceso'),
        p(`Un **puerto de acceso** pertenece a **una sola VLAN** y conecta un equipo final: una computadora, una impresora, una cámara. El equipo no sabe nada de VLAN; envía y recibe tramas Ethernet normales. Es el switch el que recuerda «todo lo que entra por este puerto es de la VLAN 10».`),
        nota('clave', `La VLAN se decide por el **puerto del switch**, no por el equipo. Si cambias una computadora de un puerto de la VLAN 10 a uno de la VLAN 20, cambia de red, y su dirección IP anterior deja de servir.`),

        h('Paso 1: crear la VLAN'),
        p(`Se hace desde el modo de configuración global. El comando \`vlan\` crea la VLAN y entra en ella; \`name\` le pone un nombre.`),
        codigo('Crear las VLAN 10 y 20', `Switch> enable
Switch# configure terminal
Switch(config)# vlan 10
Switch(config-vlan)# name VENTAS
Switch(config-vlan)# exit
Switch(config)# vlan 20
Switch(config-vlan)# name SOPORTE
Switch(config-vlan)# end`),
        ejemplo('facil', 'Crear una VLAN', cmd('crear', { vlan: 30 })),
        ejemplo('facil', 'Ponerle nombre', cmd('nombre', { vlan: 30, nombre: 'DIRECCION' })),

        h('Paso 2: asignar los puertos'),
        p(`Dentro de cada interfaz hacen falta dos comandos: uno fija el puerto como acceso y el otro indica su VLAN.`),
        codigo('Puerto Fa0/1 en la VLAN 10', `Switch(config)# interface fastEthernet 0/1
Switch(config-if)# switchport mode access
Switch(config-if)# switchport access vlan 10
Switch(config-if)# exit`),
        p(`Para configurar muchos puertos iguales de una vez se usa \`interface range\`:`),
        codigo('Puertos Fa0/4 a Fa0/6 en la VLAN 20', `Switch(config)# interface range fastEthernet 0/4 - 6
Switch(config-if-range)# switchport mode access
Switch(config-if-range)# switchport access vlan 20`),
        ejemplo('facil', 'Fijar el modo acceso', cmd('acceso')),
        ejemplo('facil', 'Asignar la VLAN', cmd('asignar', { vlan: 20 })),
        nota('truco', `IOS acepta abreviaturas mientras no sean ambiguas: \`sw mo acc\` equivale a \`switchport mode access\`, e \`int fa0/1\` a \`interface fastEthernet 0/1\`. En los ejercicios puedes escribir el comando completo o abreviado.`),
        nota('aviso', `Si asignas un puerto a una VLAN que no existe, el switch la crea automáticamente. Pero si **borras** una VLAN (\`no vlan 20\`), sus puertos no vuelven a la VLAN 1: quedan inactivos hasta que los asignes a otra VLAN.`),

        h('Paso 3: comprobar'),
        codigo('show vlan brief', `Switch# show vlan brief

VLAN Name                             Status    Ports
---- -------------------------------- --------- ---------------------------
1    default                          active    Fa0/7, Fa0/8, Gi0/1, Gi0/2
10   VENTAS                           active    Fa0/1, Fa0/2, Fa0/3
20   SOPORTE                          active    Fa0/4, Fa0/5, Fa0/6
1002 fddi-default                     act/unsup
1003 token-ring-default               act/unsup
1004 fddinet-default                  act/unsup
1005 trnet-default                    act/unsup`),
        p(`Cómo leerla: cada fila es una VLAN, con su nombre y los **puertos de acceso** que le pertenecen. Los puertos sin configurar siguen en la VLAN 1. Las VLAN 1002 a 1005 aparecen siempre. Los puertos troncales **no** salen en esta lista.`),
        ejemplo('facil', 'El comando de comprobación', cmd('vervlan')),
        ejemplo('medio', 'Un broadcast con esa configuración', dif([10, 10, 10, 20, 20, 20, 1, 1], [], 5), 'Es el switch de la salida anterior: Fa0/1 a Fa0/3 en la VLAN 10, Fa0/4 a Fa0/6 en la 20 y el resto en la VLAN 1.'),

        h('La VLAN de voz'),
        p(`Un teléfono IP suele tener un pequeño switch interno: se conecta al puerto de la pared y la computadora se conecta al teléfono. Así un solo puerto del switch atiende a dos equipos. Para separarlos, el puerto de acceso lleva **dos VLAN**: la de datos para la computadora y la de voz para el teléfono.`),
        codigo('Puerto con datos y voz', `Switch(config)# interface fastEthernet 0/10
Switch(config-if)# switchport mode access
Switch(config-if)# switchport access vlan 10
Switch(config-if)# switchport voice vlan 150`),
        ejemplo('medio', 'Añadir la VLAN de voz', cmd('voz', { vlan: 150 })),

        ejercicios('Practica', 'Escribe el comando completo o abreviado. Fíjate en el modo en el que estás: indica qué comandos son válidos ahí.', [
          cmd('crear', { vlan: 10 }), cmd('crear', { vlan: 99 }), cmd('nombre', { vlan: 10, nombre: 'VENTAS' }), cmd('nombre', { vlan: 99, nombre: 'GESTION' }),
          cmd('acceso'), cmd('asignar', { vlan: 10 }), cmd('asignar', { vlan: 40 }), cmd('voz', { vlan: 200 }), cmd('vervlan'),
          dif([10, 10, 20, 20, 20, 30], [], 3), dif([1, 1, 10, 10, 1, 1, 1, 20], [], 1), dif([40, 40, 40, 40, 50, 60], [], 6),
          op('En la salida de `show vlan brief`, ¿qué puertos aparecen junto a cada VLAN?', ['Todos los puertos del switch', 'Solo los puertos de acceso asignados a esa VLAN', 'Solo los puertos troncales', 'Los puertos que están apagados'], 1, 'La columna Ports lista los puertos de acceso de cada VLAN. Los troncales se consultan con `show interfaces trunk`.'),
          op('Borras la VLAN 20 con `no vlan 20`. ¿Qué pasa con los puertos que estaban en ella?', ['Pasan automáticamente a la VLAN 1', 'Quedan inactivos hasta asignarlos a una VLAN existente', 'Se convierten en troncales', 'Se borra también su configuración'], 1, 'Los puertos conservan la asignación a una VLAN que ya no existe y dejan de pasar tráfico. Hay que reasignarlos.'),
          op('¿Quién decide a qué VLAN pertenece una computadora conectada a un puerto de acceso?', ['La configuración de red de la computadora', 'La configuración del puerto del switch', 'El servidor DHCP', 'La dirección MAC de la tarjeta, siempre'], 1, 'En un puerto de acceso la VLAN es una propiedad del puerto. El equipo ni siquiera sabe que existe.'),
        ]),
      ],
    },

    /* ---------------------------------------------------------------- 3 */
    {
      slug: 'enlaces-troncales-802-1q',
      titulo: 'Enlaces troncales y la etiqueta 802.1Q',
      resumen: 'Cómo viajan varias VLAN por un solo cable entre switches: la etiqueta de 4 bytes, los puertos troncales y la lista de VLAN permitidas.',
      nivel: 'medio',
      objetivos: [
        'Explicar para qué sirve un enlace troncal y qué añade la etiqueta 802.1Q a la trama.',
        'Configurar un troncal y limitar las VLAN que transporta.',
        'Decidir si dos equipos de la misma VLAN en switches distintos se alcanzan.',
      ],
      bloques: [
        h('El problema: varias VLAN entre dos switches'),
        p(`Tienes dos switches, uno por piso, y las VLAN 10, 20 y 30 en los dos. Para que los equipos de la VLAN 10 del primer piso hablen con los del segundo, las tramas deben pasar de un switch al otro **sin perder su VLAN**.

Con puertos de acceso haría falta un cable por VLAN: tres cables y tres puertos por switch. Con 20 VLAN, veinte cables. No escala.`),
        p(`La solución es el **enlace troncal** (trunk): un solo enlace que transporta las tramas de **muchas VLAN a la vez**. Para que el switch que recibe sepa de qué VLAN es cada trama, el que envía le pega una **etiqueta** con el número de VLAN.`),
        tabla(['', 'Puerto de acceso', 'Puerto troncal'], [
          ['VLAN que transporta', 'Una', 'Muchas'],
          ['Conecta con…', 'equipos finales', 'otros switches, routers, servidores con varias VLAN'],
          ['Las tramas viajan…', 'sin etiqueta', 'con etiqueta 802.1Q (salvo la VLAN nativa)'],
          ['Aparece en `show vlan brief`', 'Sí', 'No'],
        ]),

        h('La etiqueta 802.1Q'),
        p(`El estándar **IEEE 802.1Q** define la etiqueta: **4 bytes** que se insertan dentro de la trama Ethernet, entre la dirección MAC de origen y el campo de tipo.`),
        tabla(['Campo', 'Tamaño', 'Contenido'], [
          ['TPID', '16 bits', 'El valor fijo `0x8100`. Avisa de que la trama lleva etiqueta 802.1Q.'],
          ['PCP (prioridad)', '3 bits', 'Prioridad de 0 a 7. La usa la calidad de servicio, por ejemplo para la voz.'],
          ['DEI', '1 bit', 'Indica si la trama se puede descartar en caso de congestión.'],
          ['**VID (VLAN ID)**', '**12 bits**', 'El número de VLAN. De aquí sale el límite de 4,094 VLAN.'],
        ], 'Total: 16 + 3 + 1 + 12 = 32 bits = 4 bytes. Una trama Ethernet de tamaño máximo pasa de 1,518 a 1,522 bytes.'),
        orden(
          'Una computadora de la VLAN 10 envía una trama normal, **sin etiqueta**, a su puerto de acceso.',
          'El switch la recibe y anota internamente que es de la VLAN 10.',
          'Si el destino está en el otro switch, la envía por el troncal **insertándole la etiqueta** con VID = 10.',
          'El segundo switch lee la etiqueta, sabe que es de la VLAN 10 y busca el destino solo entre sus puertos de esa VLAN.',
          'Antes de entregarla por el puerto de acceso de destino, **quita la etiqueta**. La computadora recibe una trama normal.',
        ),
        nota('clave', `Las etiquetas solo existen **entre switches** (y entre un switch y un router). Los equipos finales nunca las ven: se ponen al entrar en un troncal y se quitan al salir por un puerto de acceso.`),
        ejemplo('facil', 'Hacia una computadora', etq(10)),
        ejemplo('facil', 'Hacia otro switch', etq(20, 1)),

        h('Configurar un troncal'),
        codigo('Troncal en Gi0/1 (en los dos switches)', `Switch(config)# interface gigabitEthernet 0/1
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport trunk allowed vlan 10,20,30`),
        p(`En algunos modelos antiguos, que también admiten el protocolo propietario ISL, hay que escribir antes \`switchport trunk encapsulation dot1q\`. En los switches actuales solo existe 802.1Q y ese comando no hace falta.`),
        ejemplo('facil', 'Activar el modo troncal', cmd('troncal')),

        h('VLAN permitidas en el troncal'),
        p(`Por defecto un troncal deja pasar **todas** las VLAN. Es mejor limitarlo a las que de verdad hacen falta al otro lado: se reduce el tráfico de broadcast innecesario y se evita que una VLAN llegue adonde no debe.`),
        ejemplo('medio', 'Limitar las VLAN', cmd('permitidas', { lista: [10, 20, 30] })),
        ejemplo('medio', 'Añadir una VLAN sin borrar las demás', cmd('agregar', { vlan: 40 })),
        nota('error', `El error más caro de esta lección: escribir \`switchport trunk allowed vlan 40\` para «añadir» la VLAN 40. Ese comando **reemplaza** la lista entera: el troncal pasa a permitir solo la 40 y todas las demás VLAN se quedan incomunicadas. Para añadir se usa siempre \`add\`.`),
        codigo('show interfaces trunk', `Switch# show interfaces trunk

Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      1

Port        Vlans allowed on trunk
Gi0/1       10,20,30

Port        Vlans allowed and active in management domain
Gi0/1       10,20,30`),
        ejemplo('facil', 'Consultar los troncales', cmd('vertroncal')),

        h('Broadcast y alcance a través de un troncal'),
        p(`Para el switch, un troncal es un puerto más de cada VLAN que permite. Un broadcast de la VLAN 10 sale por los puertos de acceso de la VLAN 10 **y por los troncales que permitan la 10**.`),
        ejemplo('medio', 'Un broadcast con dos troncales', dif([10, 10, 20, 20, 30], [[10, 20, 30], [20, 30]], 1)),
        p(`Y para que dos equipos de la misma VLAN en switches distintos se alcancen, esa VLAN tiene que estar permitida en el troncal que los une.`),
        ejemplo('medio', 'Misma VLAN, troncal que la permite', alc([[10, 20]], [1, 10], [2, 10])),
        ejemplo('medio', 'Misma VLAN, troncal que no la permite', alc([[10, 20]], [1, 30], [2, 30]), 'Es uno de los fallos más frecuentes en redes reales: la VLAN existe en los dos switches y los puertos están bien, pero alguien olvidó añadirla al troncal.'),
        ejemplo('dificil', 'VLAN distintas y sin router', alc([[10, 20, 30]], [1, 10], [2, 20])),

        h('DTP: la negociación automática'),
        p(`Los switches Cisco traen un protocolo, **DTP**, que intenta negociar automáticamente si un enlace debe ser troncal. Es cómodo pero poco predecible, y un riesgo de seguridad: un equipo malintencionado podría negociar un troncal y recibir tráfico de todas las VLAN. La práctica recomendada es **configurar cada puerto a mano** (\`mode access\` o \`mode trunk\`) y desactivar DTP en los troncales con \`switchport nonegotiate\`.`),

        ejercicios('Practica', 'En los de alcance: misma VLAN y permitida en el troncal → se comunican. VLAN distinta sin router → no.', [
          etq(10), etq(30, 1), etq(99, 1), etq(40, 99),
          cmd('troncal'), cmd('permitidas', { lista: [10, 20] }), cmd('permitidas', { lista: [20, 30, 99] }), cmd('agregar', { vlan: 50 }), cmd('vertroncal'),
          dif([10, 20, 10, 20, 10], [[10, 20]], 1), dif([10, 10, 20, 30, 30, 30], [[10, 30], [20]], 4), dif([20, 20, 20, 40], [[10, 20, 40], [10, 20, 40]], 4),
          alc([[10, 20, 30]], [1, 20], [2, 20]), alc([[10]], [1, 20], [2, 20]), alc([[10, 20, 30]], [1, 10], [1, 10]), alc([[20, 30]], [2, 30], [1, 30]),
          alc([[10, 20, 30]], [1, 10], [2, 30]), alc([[30]], [1, 10], [1, 10]),
          op('¿Cuántos bytes añade la etiqueta 802.1Q a una trama?', ['2', '4', '8', '12'], 1, 'Son 32 bits: TPID (16), prioridad (3), DEI (1) y VLAN ID (12). En total, 4 bytes.'),
          op('Un troncal permite las VLAN 10, 20 y 30. Escribes `switchport trunk allowed vlan 40`. ¿Qué VLAN permite ahora?', ['10, 20, 30 y 40', 'Solo la 40', 'Ninguna', 'Todas'], 1, 'Sin la palabra `add`, el comando reemplaza la lista completa. Solo queda la VLAN 40.'),
          op('¿En qué tramo lleva etiqueta 802.1Q una trama que va de una computadora en SW1 a otra en SW2 (misma VLAN, no nativa)?', ['En todo el recorrido', 'Solo entre la computadora y SW1', 'Solo en el troncal entre SW1 y SW2', 'En ningún momento'], 2, 'La etiqueta se añade al salir por el troncal y se quita antes de entregar por el puerto de acceso. Las computadoras nunca la ven.'),
        ]),
      ],
    },

    /* ---------------------------------------------------------------- 4 */
    {
      slug: 'vlan-nativa-y-buenas-practicas',
      titulo: 'La VLAN nativa y las buenas prácticas de seguridad',
      resumen: 'La única VLAN que cruza el troncal sin etiqueta, qué ocurre si no coincide en los dos extremos y cómo dejar un switch bien protegido.',
      nivel: 'medio',
      objetivos: [
        'Explicar qué es la VLAN nativa y cómo se tratan las tramas sin etiqueta en un troncal.',
        'Reconocer los síntomas de una VLAN nativa mal configurada.',
        'Aplicar la lista de buenas prácticas de seguridad en VLAN.',
      ],
      bloques: [
        h('Qué es la VLAN nativa'),
        p(`En un troncal 802.1Q hay una VLAN especial, la **VLAN nativa**, cuyas tramas se envían **sin etiqueta**. Y al revés: cuando un switch recibe por un troncal una trama sin etiqueta, la asigna a su VLAN nativa.

Existe por compatibilidad: permite que un equipo que no entiende 802.1Q, conectado a ese enlace, pueda seguir comunicándose. Por defecto la VLAN nativa es la **VLAN 1**.`),
        tabla(['La trama es de…', 'Sale por el troncal…', 'El otro switch…'], [
          ['una VLAN cualquiera (no nativa)', 'con etiqueta 802.1Q y su VLAN ID', 'lee el ID de la etiqueta'],
          ['la VLAN nativa', '**sin etiqueta**', 'la asigna a **su** VLAN nativa'],
        ]),
        ejemplo('facil', 'La trama es de la VLAN nativa', etq(99, 99)),
        ejemplo('facil', 'La trama es de otra VLAN', etq(10, 99)),
        codigo('Cambiar la VLAN nativa (en los dos extremos)', `Switch(config)# interface gigabitEthernet 0/1
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport trunk native vlan 99`),
        ejemplo('medio', 'El comando', cmd('nativa', { vlan: 99 })),

        h('Cuando la nativa no coincide'),
        p(`La VLAN nativa se configura por separado en cada extremo del troncal, y **debe ser la misma en los dos**. Si no lo es, ocurre algo peligroso. Supón que SW1 tiene nativa 10 y SW2 tiene nativa 20:`),
        orden(
          'Un equipo de la VLAN 10 en SW1 envía una trama. Como la 10 es la nativa de SW1, sale por el troncal **sin etiqueta**.',
          'SW2 recibe una trama sin etiqueta y la asigna a **su** nativa: la VLAN 20.',
          'La trama, que nació en la VLAN 10, acaba entregada a equipos de la VLAN 20.',
        ),
        p(`El tráfico **se filtra de una VLAN a otra**, rompiendo el aislamiento. Los síntomas son confusos: equipos que reciben direcciones del DHCP equivocado, conexiones intermitentes y este aviso repetido en la consola de los switches:`),
        codigo('Aviso de VLAN nativa distinta', `%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on
GigabitEthernet0/1 (10), with SW2 GigabitEthernet0/1 (20).`),
        nota('error', `La nativa distinta en cada extremo **no tira el enlace**: el troncal sigue activo y casi todo funciona, lo que hace el fallo difícil de ver. Compara siempre la columna «Native vlan» de \`show interfaces trunk\` en los dos switches.`),

        h('Por qué la VLAN 1 no debe ser la nativa'),
        p(`Dejar la nativa en la VLAN 1 permite un ataque conocido como **doble etiquetado** (una forma de «VLAN hopping»): una trama preparada con dos etiquetas puede saltar a otra VLAN, porque el primer switch quita la etiqueta exterior (la de la nativa) y reenvía el resto, y el segundo switch obedece a la etiqueta interior. El ataque solo funciona si el atacante está en la misma VLAN que la nativa del troncal.

La defensa es sencilla: que **ningún puerto de usuario pertenezca a la VLAN nativa**. Se crea una VLAN que no se usa para nada más (por ejemplo, la 99 o la 999) y se configura como nativa en todos los troncales.`),

        h('Lista de buenas prácticas'),
        tabla(['Práctica', 'Comando', 'Qué evita'], [
          ['Fijar a mano el modo de cada puerto', '`switchport mode access` / `switchport mode trunk`', 'Que un puerto negocie un troncal por su cuenta.'],
          ['Desactivar DTP en los troncales', '`switchport nonegotiate`', 'Negociaciones no deseadas con equipos ajenos.'],
          ['Nativa en una VLAN sin usuarios', '`switchport trunk native vlan 99`', 'El doble etiquetado.'],
          ['Limitar las VLAN de cada troncal', '`switchport trunk allowed vlan …`', 'Que una VLAN llegue a switches donde no hace falta.'],
          ['No usar la VLAN 1 para usuarios ni gestión', 'asignar todos los puertos a otras VLAN', 'Acceso por puertos olvidados.'],
          ['Puertos sin usar: apagados y en una VLAN sin salida', '`shutdown` y `switchport access vlan 999`', 'Que alguien se conecte a una toma libre.'],
        ]),
        codigo('Puertos sin usar', `Switch(config)# vlan 999
Switch(config-vlan)# name SIN_USO
Switch(config-vlan)# exit
Switch(config)# interface range fastEthernet 0/20 - 24
Switch(config-if-range)# switchport mode access
Switch(config-if-range)# switchport access vlan 999
Switch(config-if-range)# shutdown`),
        ejemplo('medio', 'Desactivar la negociación', cmd('sindtp')),
        nota('aviso', `Sobre **VTP**: los switches Cisco pueden sincronizar su lista de VLAN automáticamente con el protocolo VTP. Es cómodo, pero un switch con una base de datos más «nueva» (número de revisión mayor) conectado por error puede **borrar las VLAN de toda la red** en segundos. Mucha gente lo deja en modo transparente o apagado y crea las VLAN a mano en cada switch.`),

        ejercicios('Practica', 'Recuerda: sin etiqueta solo viajan las tramas de un puerto de acceso y las de la VLAN nativa de un troncal.', [
          etq(1, 1), etq(20, 1), etq(99, 99), etq(10, 99), etq(999, 999), etq(30),
          cmd('nativa', { vlan: 999 }), cmd('nativa', { vlan: 99 }), cmd('sindtp'), cmd('troncal'), cmd('asignar', { vlan: 999 }),
          op('Un troncal tiene nativa 10 en SW1 y nativa 20 en SW2. ¿Qué ocurre?', ['El enlace se apaga automáticamente', 'Las tramas de la VLAN 10 de SW1 acaban en la VLAN 20 de SW2', 'Solo deja de funcionar la VLAN 1', 'No ocurre nada: la nativa es solo informativa'], 1, 'SW1 envía la VLAN 10 sin etiqueta y SW2 mete lo que llega sin etiqueta en su nativa, la 20. El tráfico se mezcla entre las dos VLAN.'),
          op('¿Cuál es la VLAN nativa de un troncal si no se configura nada?', ['No tiene', 'La VLAN 1', 'La VLAN 99', 'La VLAN más baja permitida'], 1, 'Por defecto la VLAN nativa es la 1, igual que la VLAN por defecto de los puertos.'),
          op('¿Qué medida impide el ataque de doble etiquetado?', ['Usar cables más cortos', 'Que la VLAN nativa de los troncales no tenga puertos de usuario', 'Activar DTP en todos los puertos', 'Poner todos los equipos en la VLAN 1'], 1, 'El ataque necesita que el atacante esté en la VLAN nativa. Si la nativa es una VLAN dedicada y vacía, no hay desde dónde lanzarlo.'),
          op('¿Qué comando muestra la VLAN nativa de cada troncal?', ['`show vlan brief`', '`show interfaces trunk`', '`show ip route`', '`show mac address-table`'], 1, '`show interfaces trunk` tiene una columna «Native vlan». `show vlan brief` no lista los troncales.'),
          op('¿Qué se recomienda hacer con los puertos del switch que no se usan?', ['Dejarlos en la VLAN 1 por si acaso', 'Configurarlos como troncales', 'Apagarlos y asignarlos a una VLAN sin salida', 'Nada: no suponen ningún riesgo'], 2, 'Un puerto activo en la VLAN 1 es una puerta abierta. Apagado y en una VLAN que no va a ninguna parte, no sirve a un intruso.'),
        ]),
      ],
    },

    /* ---------------------------------------------------------------- 5 */
    {
      slug: 'enrutamiento-entre-vlan',
      titulo: 'Enrutamiento entre VLAN',
      resumen: 'Cómo se comunican dos VLAN: un router por VLAN, router-on-a-stick con subinterfaces y switch de capa 3 con SVI.',
      nivel: 'dificil',
      objetivos: [
        'Explicar por qué hace falta capa 3 para comunicar dos VLAN.',
        'Configurar un router-on-a-stick: subinterfaz, encapsulación y dirección IP.',
        'Decidir si dos equipos de VLAN distintas se alcanzan en una red dada.',
      ],
      bloques: [
        h('Por qué hace falta un router'),
        p(`Las VLAN aíslan a propósito. Pero en una empresa real, Ventas necesita llegar a los servidores, y todos necesitan salir a Internet. Como cada VLAN es una subred distinta, pasar de una a otra es **enrutar**, y eso lo hace un dispositivo de capa 3.

Cada equipo tiene configurada una **puerta de enlace**: la dirección IP del router **dentro de su propia VLAN**. Cuando el destino está en otra subred, el equipo entrega el paquete a esa dirección y el router lo reenvía hacia la VLAN de destino.`),
        tabla(['Método', 'Cómo funciona', 'Ventaja', 'Inconveniente'], [
          ['**Un router, una interfaz por VLAN**', 'Cada VLAN usa un puerto físico del router conectado a un puerto de acceso del switch.', 'Muy simple de entender.', 'Gasta un puerto de router y otro de switch por VLAN. No escala.'],
          ['**Router-on-a-stick**', 'Un solo cable troncal hacia el router, con una subinterfaz virtual por VLAN.', 'Un único enlace para todas las VLAN.', 'Todo el tráfico entre VLAN pasa dos veces por ese cable: cuello de botella.'],
          ['**Switch de capa 3 (SVI)**', 'El propio switch enruta, con una interfaz virtual por VLAN.', 'Rápido y sin cables extra. Es lo habitual hoy.', 'Requiere un switch con funciones de capa 3.'],
        ]),

        h('Router-on-a-stick'),
        p(`El puerto del switch hacia el router se configura como **troncal**. En el router, la interfaz física se divide en **subinterfaces**: interfaces virtuales con nombre «interfaz.número». Cada subinterfaz atiende a una VLAN y tiene la dirección IP que sirve de puerta de enlace a esa VLAN.`),
        codigo('En el switch: troncal hacia el router', `Switch(config)# interface gigabitEthernet 0/1
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport trunk allowed vlan 10,20`),
        codigo('En el router: una subinterfaz por VLAN', `Router(config)# interface gigabitEthernet 0/0
Router(config-if)# no shutdown
Router(config-if)# exit
Router(config)# interface gigabitEthernet 0/0.10
Router(config-subif)# encapsulation dot1q 10
Router(config-subif)# ip address 192.168.10.1 255.255.255.0
Router(config-subif)# exit
Router(config)# interface gigabitEthernet 0/0.20
Router(config-subif)# encapsulation dot1q 20
Router(config-subif)# ip address 192.168.20.1 255.255.255.0`),
        orden(
          'La interfaz física se enciende con `no shutdown` y **no lleva dirección IP**.',
          'Cada subinterfaz se crea al entrar en ella. El número tras el punto es libre; la costumbre es usar el ID de la VLAN.',
          '`encapsulation dot1q` indica qué VLAN atiende. Va **antes** de la dirección IP.',
          'La dirección IP de la subinterfaz es la **puerta de enlace** de los equipos de esa VLAN.',
        ),
        ejemplo('facil', 'El comando de encapsulación', cmd('encapsular', { vlan: 30 })),
        ejemplo('medio', 'Una subinterfaz completa', { tipo: 'vl-subinterfaz', vlan: 10, red: '192.168.10.0', p: 24, gw: 'primera', iface: 'g0/0' }),
        ejemplo('medio', 'Con la puerta de enlace al final del rango', { tipo: 'vl-subinterfaz', vlan: 20, red: '192.168.20.0', p: 24, gw: 'ultima', iface: 'g0/1' }),
        p(`Si la VLAN nativa también debe enrutarse, su subinterfaz lleva la palabra \`native\`, porque sus tramas llegan sin etiqueta:`),
        ejemplo('dificil', 'La subinterfaz de la VLAN nativa', cmd('encapnativa', { vlan: 99 })),

        h('Switch de capa 3 e interfaces SVI'),
        p(`Un switch de capa 3 no necesita router externo. Por cada VLAN se crea una **SVI** (interfaz virtual de switch), que es una interfaz lógica con dirección IP dentro de esa VLAN. Con \`ip routing\` activado, el switch enruta entre sus SVI.`),
        codigo('Enrutamiento entre VLAN en un switch de capa 3', `Switch(config)# ip routing
Switch(config)# interface vlan 10
Switch(config-if)# ip address 192.168.10.1 255.255.255.0
Switch(config-if)# no shutdown
Switch(config-if)# exit
Switch(config)# interface vlan 20
Switch(config-if)# ip address 192.168.20.1 255.255.255.0
Switch(config-if)# no shutdown`),
        ejemplo('medio', 'Entrar en una SVI', cmd('svi', { vlan: 10 })),
        ejemplo('medio', 'Activar el enrutamiento', cmd('enrutar')),
        nota('aviso', `Una SVI solo está activa (up/up) si la VLAN existe en el switch **y** tiene al menos un puerto activo, de acceso o troncal. Una SVI caída suele significar que la VLAN no se creó o que no tiene ningún puerto en uso.`),

        h('¿Se alcanzan dos equipos de VLAN distintas?'),
        p(`Para que un equipo de la VLAN 10 llegue a uno de la VLAN 20 deben cumplirse tres condiciones a la vez:`),
        orden(
          'El router (o switch de capa 3) tiene una interfaz en **cada una** de las dos VLAN.',
          'Cada equipo puede **llegar hasta el router** por capa 2: su VLAN está permitida en todos los troncales del camino.',
          'Cada equipo tiene como **puerta de enlace** la dirección del router en su VLAN.',
        ),
        ejemplo('medio', 'Todo en orden', alc([[10, 20, 30]], [1, 10], [2, 20], [10, 20, 30])),
        ejemplo('dificil', 'Al router le falta una subinterfaz', alc([[10, 20, 30]], [1, 10], [2, 30], [10, 20])),
        ejemplo('dificil', 'Un troncal corta el camino hasta el router', alc([[10, 30]], [1, 10], [2, 20], [10, 20, 30]), 'El router está en SW1 y tiene las dos subinterfaces, pero la VLAN 20 de SW2 no puede cruzar el troncal para llegar a él.'),

        ejercicios('Practica', 'En las subinterfaces usa el ID de la VLAN como número. Puedes escribir g0/0, gi0/0 o gigabitEthernet0/0.', [
          cmd('encapsular', { vlan: 10 }), cmd('encapsular', { vlan: 50 }), cmd('encapnativa', { vlan: 1 }), cmd('svi', { vlan: 20 }), cmd('enrutar'),
          { tipo: 'vl-subinterfaz', vlan: 30, red: '192.168.30.0', p: 24, gw: 'primera', iface: 'g0/0' },
          { tipo: 'vl-subinterfaz', vlan: 40, red: '172.16.40.0', p: 24, gw: 'ultima', iface: 'g0/0' },
          { tipo: 'vl-subinterfaz', vlan: 100, red: '10.0.100.0', p: 24, gw: 'primera', iface: 'g0/1' },
          { tipo: 'vl-subinterfaz', vlan: 99, red: '10.99.0.0', p: 24, gw: 'ultima', iface: 'g0/1' },
          alc([[10, 20]], [1, 10], [1, 20], [10, 20]), alc([[10, 20]], [2, 10], [2, 20], [10, 20]), alc([[10]], [2, 10], [2, 20], [10, 20]),
          alc([[10, 20, 30]], [1, 30], [2, 10], [10, 20]), alc([[10, 20, 30]], [2, 20], [2, 20], [10, 30]), alc([[20, 30]], [1, 10], [2, 30], [10, 20, 30]),
          alc([[20, 30]], [2, 10], [1, 30], [10, 20, 30]),
          op('En un router-on-a-stick, ¿qué dirección IP lleva la interfaz física?', ['La de la VLAN 1', 'La primera de cada subred', 'Ninguna: las direcciones van en las subinterfaces', 'La misma que el switch'], 2, 'La interfaz física solo se enciende. Cada subinterfaz lleva la dirección de su VLAN.'),
          op('Los equipos de la VLAN 20 alcanzan a sus vecinos, pero no a otras VLAN. La subinterfaz del router es `192.168.20.1/24`. ¿Qué revisarías primero en los equipos?', ['Que su puerta de enlace sea `192.168.20.1`', 'Que su dirección MAC sea correcta', 'Que usen la VLAN 1', 'Que tengan una IP pública'], 0, 'Si la red local funciona, el problema está en la salida: la puerta de enlace de los equipos debe ser la dirección del router en su misma VLAN.'),
          op('¿Qué ventaja tiene un switch de capa 3 frente al router-on-a-stick?', ['No necesita direcciones IP', 'El tráfico entre VLAN no tiene que salir y volver por un único cable', 'Permite más de 4,094 VLAN', 'No usa etiquetas 802.1Q en los troncales'], 1, 'En el router-on-a-stick todo el tráfico entre VLAN cruza dos veces el mismo enlace. El switch de capa 3 enruta internamente.'),
        ]),
      ],
    },

    /* ---------------------------------------------------------------- 6 */
    {
      slug: 'vlan-y-subneteo-juntos',
      titulo: 'VLAN y subneteo juntos: diseñar el direccionamiento',
      resumen: 'Una subred por VLAN: cómo repartir un bloque con VLSM, elegir las puertas de enlace y configurar las subinterfaces sobre subredes pequeñas.',
      nivel: 'dificil',
      objetivos: [
        'Asignar una subred a cada VLAN con VLSM, contando la puerta de enlace.',
        'Configurar subinterfaces sobre subredes que no son /24.',
        'Documentar un plan de VLAN completo.',
      ],
      bloques: [
        h('El plan de direccionamiento'),
        p(`Aquí se unen los dos módulos. Diseñar una red con VLAN es rellenar una tabla: por cada VLAN, su ID, su nombre, su subred, su máscara y su puerta de enlace. Las subredes salen del bloque que tenga la empresa, y lo normal es repartirlo con **VLSM**, porque los departamentos nunca tienen el mismo tamaño.`),
        orden(
          '**Cuenta los equipos** de cada VLAN y **suma 1** por la puerta de enlace (la interfaz del router en esa VLAN también ocupa una dirección).',
          '**Calcula el bloque** de cada una: esa cifra + 2 (red y broadcast), redondeada a la siguiente potencia de 2.',
          '**Ordena de mayor a menor** y asigna las subredes una tras otra desde la dirección base.',
          '**Elige la puerta de enlace** de cada subred con un criterio fijo: siempre la primera dirección asignable o siempre la última.',
        ),
        formula('direcciones necesarias = equipos + 1 (gateway) + 2 (red y broadcast)', [], 'Olvidar la puerta de enlace es el error típico: una VLAN con 62 equipos no cabe en un /26, porque con el router son 63.'),
        ejemplo('medio', 'Tres VLAN en un /24', { tipo: 'vl-diseno', base: '192.168.10.0', p0: 24, vlans: [{ id: 10, nombre: 'VENTAS', hosts: 50 }, { id: 20, nombre: 'SOPORTE', hosts: 25 }, { id: 30, nombre: 'DIRECCION', hosts: 10 }] }),
        ejemplo('dificil', 'La trampa de la puerta de enlace', { tipo: 'vl-diseno', base: '192.168.4.0', p0: 24, vlans: [{ id: 10, nombre: 'VENTAS', hosts: 62 }, { id: 20, nombre: 'SOPORTE', hosts: 30 }, { id: 30, nombre: 'DIRECCION', hosts: 14 }] },
          'Las tres cifras (62, 30 y 14) son justo el máximo de un /26, un /27 y un /28. Al sumar la puerta de enlace, cada VLAN necesita el bloque siguiente.'),
        ejemplo('experto', 'Seis VLAN en un /22', { tipo: 'vl-diseno', base: '10.1.0.0', p0: 22, vlans: [{ id: 10, nombre: 'INGENIERIA', hosts: 400 }, { id: 20, nombre: 'VENTAS', hosts: 200 }, { id: 30, nombre: 'SOPORTE', hosts: 100 }, { id: 40, nombre: 'FINANZAS', hosts: 60 }, { id: 50, nombre: 'RRHH', hosts: 20 }, { id: 99, nombre: 'GESTION', hosts: 5 }] }),

        h('Subinterfaces sobre subredes pequeñas'),
        p(`Cuando la subred de una VLAN no es un /24, la subinterfaz del router lleva la máscara de esa subred, y la puerta de enlace hay que calcularla con el número mágico.`),
        ejemplo('medio', 'Una VLAN con un /26', { tipo: 'vl-subinterfaz', vlan: 20, red: '192.168.10.64', p: 26, gw: 'primera', iface: 'g0/0' }),
        ejemplo('dificil', 'Un /28 con el gateway al final', { tipo: 'vl-subinterfaz', vlan: 30, red: '192.168.10.96', p: 28, gw: 'ultima', iface: 'g0/0' }),
        ejemplo('dificil', 'Un /27 que no empieza en cero', { tipo: 'vl-subinterfaz', vlan: 50, red: '172.16.5.160', p: 27, gw: 'ultima', iface: 'g0/1' }),
        nota('truco', `Con subredes pequeñas, el error habitual es configurar la subinterfaz con máscara \`255.255.255.0\` «por costumbre». El router lo acepta, pero entonces cree que toda la red /24 está en esa VLAN y deja de enrutar hacia las demás subredes de ese rango.`),

        h('Documentar el plan'),
        p(`El resultado de un buen diseño es una tabla que cualquiera pueda consultar. Es lo primero que se mira cuando algo falla.`),
        tabla(['VLAN', 'Nombre', 'Subred', 'Máscara', 'Puerta de enlace', 'Rango para equipos'], [
          ['10', 'VENTAS', '192.168.10.0/26', '255.255.255.192', '192.168.10.1', '192.168.10.2 – 192.168.10.62'],
          ['20', 'SOPORTE', '192.168.10.64/27', '255.255.255.224', '192.168.10.65', '192.168.10.66 – 192.168.10.94'],
          ['30', 'DIRECCION', '192.168.10.96/28', '255.255.255.240', '192.168.10.97', '192.168.10.98 – 192.168.10.110'],
        ], 'Es el plan del primer ejemplo de esta lección.'),

        ejercicios('Practica', 'Suma siempre la puerta de enlace antes de calcular el bloque. Las subredes se escriben como dirección/prefijo.', [
          { tipo: 'vl-diseno', base: '192.168.50.0', p0: 25, vlans: [{ id: 10, nombre: 'VENTAS', hosts: 28 }, { id: 20, nombre: 'SOPORTE', hosts: 12 }, { id: 30, nombre: 'DIRECCION', hosts: 5 }] },
          { tipo: 'vl-diseno', base: '192.168.0.0', p0: 24, vlans: [{ id: 10, nombre: 'INGENIERIA', hosts: 61 }, { id: 20, nombre: 'VENTAS', hosts: 29 }, { id: 30, nombre: 'SOPORTE', hosts: 29 }, { id: 40, nombre: 'RRHH', hosts: 13 }] },
          { tipo: 'vl-diseno', base: '172.16.0.0', p0: 23, vlans: [{ id: 10, nombre: 'VENTAS', hosts: 100 }, { id: 20, nombre: 'SOPORTE', hosts: 100 }, { id: 30, nombre: 'ALMACEN', hosts: 50 }, { id: 99, nombre: 'GESTION', hosts: 10 }] },
          { tipo: 'vl-diseno', base: '10.20.0.0', p0: 24, vlans: [{ id: 110, nombre: 'CAMARAS', hosts: 14 }, { id: 120, nombre: 'INVITADOS', hosts: 100 }, { id: 150, nombre: 'SERVIDORES', hosts: 6 }] },
          { tipo: 'vl-diseno', base: '172.20.0.0', p0: 21, vlans: [{ id: 10, nombre: 'INGENIERIA', hosts: 500 }, { id: 20, nombre: 'VENTAS', hosts: 250 }, { id: 30, nombre: 'SOPORTE', hosts: 250 }, { id: 40, nombre: 'FINANZAS', hosts: 120 }, { id: 50, nombre: 'RRHH', hosts: 60 }, { id: 60, nombre: 'LABORATORIO', hosts: 30 }, { id: 99, nombre: 'GESTION', hosts: 10 }] },
          { tipo: 'vl-subinterfaz', vlan: 10, red: '192.168.1.0', p: 25, gw: 'primera', iface: 'g0/0' },
          { tipo: 'vl-subinterfaz', vlan: 20, red: '192.168.1.128', p: 26, gw: 'ultima', iface: 'g0/0' },
          { tipo: 'vl-subinterfaz', vlan: 30, red: '192.168.1.192', p: 27, gw: 'primera', iface: 'g0/0' },
          { tipo: 'vl-subinterfaz', vlan: 40, red: '192.168.1.224', p: 28, gw: 'ultima', iface: 'g0/0' },
          { tipo: 'vl-subinterfaz', vlan: 99, red: '192.168.1.240', p: 29, gw: 'primera', iface: 'g0/0' },
          { tipo: 'vl-subinterfaz', vlan: 200, red: '10.8.12.0', p: 22, gw: 'ultima', iface: 'g0/1' },
          op('Una VLAN tiene 30 computadoras y su puerta de enlace está en un router. ¿Qué prefijo necesita como mínimo?', ['/27', '/26', '/28', '/25'], 1, '30 equipos + 1 gateway = 31 direcciones asignables. Un /27 solo ofrece 30; hace falta un /26, con 62.'),
          op('La subinterfaz de la VLAN 20 es `192.168.10.65/27`. ¿Cuál de estas IP puede tener una computadora de esa VLAN?', ['`192.168.10.64`', '`192.168.10.95`', '`192.168.10.80`', '`192.168.10.97`'], 2, 'La subred es `192.168.10.64/27`: va de .64 (red) a .95 (broadcast). .80 está dentro del rango asignable; .97 ya es de otra subred.'),
        ]),
      ],
    },

    /* ---------------------------------------------------------------- 7 */
    {
      slug: 'diagnostico-y-retos-de-vlan',
      titulo: 'Diagnóstico de VLAN y retos de experto',
      resumen: 'Un método para encontrar por qué dos equipos no se comunican, y redes de tres switches con troncales restringidos.',
      nivel: 'experto',
      objetivos: [
        'Diagnosticar un fallo de comunicación recorriendo el camino capa por capa.',
        'Relacionar cada síntoma con su causa y con el comando que la confirma.',
        'Resolver redes con varios switches, troncales restringidos y router.',
      ],
      bloques: [
        h('El método: seguir el camino'),
        p(`Cuando dos equipos no se comunican, no pruebes cosas al azar. Recorre el camino de la trama desde el origen, y en cada salto hazte una sola pregunta. El primer «no» es el fallo.`),
        orden(
          '**¿El puerto del equipo está en la VLAN correcta?** `show vlan brief` en su switch.',
          '**¿La VLAN existe en todos los switches del camino?** Si no existe en uno, ese switch descarta sus tramas.',
          '**¿La VLAN está permitida en cada troncal del camino?** `show interfaces trunk`, en los dos extremos.',
          '**¿La VLAN nativa coincide en los dos extremos de cada troncal?**',
          'Si son VLAN distintas: **¿el router tiene interfaz en las dos?** ¿Con la encapsulación y la IP correctas?',
          '**¿La configuración IP de los equipos es coherente?** IP dentro de la subred de su VLAN, máscara correcta y puerta de enlace igual a la IP del router en esa VLAN.',
        ),
        tabla(['Síntoma', 'Causa más probable', 'Cómo confirmarlo'], [
          ['Un solo equipo no alcanza a nadie de su VLAN', 'Su puerto está en otra VLAN', '`show vlan brief`'],
          ['Los equipos de una VLAN se ven dentro del switch, pero no con los del otro switch', 'La VLAN no está permitida en el troncal, o no existe en el otro switch', '`show interfaces trunk`'],
          ['Tráfico mezclado entre dos VLAN, avisos de «native VLAN mismatch»', 'VLAN nativa distinta en cada extremo', '`show interfaces trunk` en los dos switches'],
          ['Una VLAN funciona por dentro pero no llega a otras VLAN', 'Falta la subinterfaz o la SVI, o la puerta de enlace de los equipos es incorrecta', '`show ip interface brief` en el router'],
          ['Ninguna VLAN llega a otra', 'El enlace al router no es troncal, o falta `ip routing` en el switch de capa 3', '`show interfaces trunk`, `show ip route`'],
          ['Tras «añadir» una VLAN a un troncal, todas las demás dejan de funcionar', 'Se usó `allowed vlan` sin `add`', '`show interfaces trunk`'],
        ]),

        h('Redes de tres switches'),
        p(`Con varios switches en cadena, cada troncal tiene su propia lista de VLAN permitidas. Una VLAN solo comunica dos puntos si está permitida en **todos** los troncales intermedios: un solo eslabón que la bloquee corta el camino.`),
        ejemplo('dificil', 'De punta a punta', alc([[10, 20, 30], [10, 30]], [1, 10], [3, 10])),
        ejemplo('dificil', 'El eslabón roto', alc([[10, 20, 30], [10, 30]], [1, 20], [3, 20])),
        ejemplo('experto', 'Hasta el router y de vuelta', alc([[10, 20, 30], [20, 30]], [3, 20], [2, 30], [10, 20, 30]), 'El router está en SW1. Para ir de la VLAN 20 a la 30, el paquete viaja de SW3 a SW1 por la VLAN 20 y vuelve hasta SW2 por la VLAN 30, aunque los dos equipos estén más cerca entre sí que del router.'),
        ejemplo('experto', 'Cerca en el mapa, lejos en la red', alc([[10, 30], [10, 20, 30]], [2, 20], [3, 30], [10, 20, 30]), 'Los dos equipos están en switches vecinos y el troncal entre ellos permite las dos VLAN. Pero para cambiar de VLAN hay que pasar por el router, y la VLAN 20 no puede llegar a SW1.'),

        h('El último eslabón: la configuración IP'),
        p(`Cuando la capa 2 está bien y aun así no hay comunicación, queda revisar la dirección, la máscara y la puerta de enlace de cada equipo. Es exactamente el diagnóstico del módulo de subneteo.`),
        ejemplo('dificil', 'Un equipo de la VLAN 20 con el gateway de otra VLAN', { tipo: 'diagnostico', ip: '192.168.10.70', p: 27, gw: '192.168.10.1' }, 'La subred de esta VLAN es `192.168.10.64/27` y su router es `192.168.10.65`. El técnico dejó el gateway de la VLAN 10.'),

        ejercicios('Retos', 'Dibuja la red en un papel: los switches en fila, las listas de cada troncal y dónde está el router. Después sigue el camino.', [
          alc([[10, 20], [10, 20]], [1, 10], [3, 10]), alc([[10, 20], [20]], [1, 10], [3, 10]), alc([[10], [10, 20, 30]], [2, 20], [3, 20]), alc([[10, 20, 30], [30]], [2, 20], [3, 20]),
          alc([[10, 20, 30], [10, 20, 30]], [3, 10], [3, 20], [10, 20]), alc([[10, 20, 30], [10, 20, 30]], [3, 10], [1, 30], [10, 20]), alc([[10, 20], [10, 20, 30]], [3, 30], [3, 10], [10, 20, 30]),
          alc([[10, 20, 30], [10, 20]], [3, 20], [2, 30], [10, 20, 30]), alc([[20, 30], [10, 20, 30]], [2, 10], [3, 10], [10, 20, 30]), alc([[20, 30], [10, 20, 30]], [2, 10], [3, 20], [10, 20, 30]),
          dif([10, 20, 30, 10, 20, 30], [[10, 20, 30], [10], [20, 30]], 2),
          { tipo: 'vl-diseno', base: '10.200.0.0', p0: 20, vlans: [{ id: 10, nombre: 'INGENIERIA', hosts: 1000 }, { id: 20, nombre: 'VENTAS', hosts: 1000 }, { id: 30, nombre: 'SOPORTE', hosts: 510 }, { id: 40, nombre: 'FINANZAS', hosts: 254 }, { id: 50, nombre: 'RRHH', hosts: 126 }, { id: 60, nombre: 'INVITADOS', hosts: 62 }] },
          { tipo: 'vl-diseno', base: '192.168.100.0', p0: 24, vlans: [{ id: 10, nombre: 'VENTAS', hosts: 45 }, { id: 20, nombre: 'SOPORTE', hosts: 45 }, { id: 30, nombre: 'CAMARAS', hosts: 20 }, { id: 40, nombre: 'SERVIDORES', hosts: 10 }, { id: 99, nombre: 'GESTION', hosts: 4 }] },
          { tipo: 'vl-subinterfaz', vlan: 60, red: '10.200.15.128', p: 25, gw: 'ultima', iface: 'g0/0' },
          { tipo: 'vl-subinterfaz', vlan: 30, red: '10.200.8.0', p: 22, gw: 'ultima', iface: 'g0/1' },
          { tipo: 'diagnostico', ip: '192.168.100.130', p: 27, gw: '192.168.100.129' }, { tipo: 'diagnostico', ip: '192.168.100.66', p: 26, gw: '192.168.100.1' }, { tipo: 'diagnostico', ip: '10.200.4.0', p: 22, gw: '10.200.4.1' },
          op('Los equipos de la VLAN 30 de SW1 hacen ping entre sí, pero no a los de la VLAN 30 de SW2. Las demás VLAN funcionan entre los dos switches. ¿Causa más probable?', ['El cable entre los switches está roto', 'La VLAN 30 no está permitida en el troncal o no existe en SW2', 'El router no tiene subinterfaz para la VLAN 30', 'Los equipos tienen mal la puerta de enlace'], 1, 'El cable funciona (las demás VLAN pasan) y dentro de una misma VLAN no interviene el router ni la puerta de enlace. Falla el transporte de esa VLAN concreta por el troncal.'),
          op('Después de escribir `switchport trunk allowed vlan 50` en un troncal, toda la oficina se queda sin red excepto la VLAN 50. ¿Qué comando lo arregla sin perder la 50?', ['`switchport mode access`', '`switchport trunk allowed vlan add 10,20,30`', '`no vlan 50`', '`switchport trunk native vlan 50`'], 1, 'El comando sin `add` reemplazó la lista. Con `add` se vuelven a incluir las VLAN que faltan y se conserva la 50.'),
          op('Dos equipos están en la misma VLAN y en el mismo switch, con IP `192.168.1.10/24` y `192.168.2.10/24`. ¿Se hacen ping directamente?', ['Sí: misma VLAN, mismo switch', 'No: aunque compartan VLAN, sus IP son de subredes distintas y cada uno buscará su puerta de enlace', 'Sí, pero solo en un sentido', 'No, porque la VLAN bloquea el tráfico'], 1, 'La capa 2 está bien, pero cada equipo cree que el otro está en otra red y envía el paquete a su puerta de enlace. Por eso a cada VLAN le corresponde una sola subred.'),
        ]),
        nota('truco', `Con esto terminas el módulo. En **Práctica**, los niveles 5 y 6 generan diseños y redes de tres switches sin límite, y el **examen avanzado** mezcla ambos.`, 'Qué sigue'),
      ],
    },
  ],
};
