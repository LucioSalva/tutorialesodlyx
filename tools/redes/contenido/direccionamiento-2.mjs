// NAT, DHCP e IPv6 · lecciones 4 a 7: IPv6 desde cero, escritura, tipos de dirección, prefijos y subredes.
import { h, h3, p, lista, orden, tabla, nota, formula, codigo, ejemplo, ejercicios, op, vs, rel, ord } from './_ayuda.mjs';
import { hex, abr, exp, t6, pre, sr, eui } from './direccionamiento-1.mjs';

export default [
  /* ------------------------------------------------------------------ 4 */
  {
    slug: 'introduccion-a-ipv6',
    titulo: 'Introducción a IPv6 y al sistema hexadecimal',
    resumen: 'Por qué existe IPv6, cuánto son 128 bits, cómo se cuenta en hexadecimal y en qué se diferencia de IPv4.',
    nivel: 'facil',
    objetivos: [
      'Explicar por qué se creó IPv6 y cuántas direcciones tiene.',
      'Convertir entre hexadecimal, binario y decimal.',
      'Describir cómo se escribe una dirección IPv6: 8 hextetos separados por dos puntos.',
      'Enumerar las diferencias principales con IPv4 y las formas de convivencia.',
    ],
    bloques: [
      h('Por qué hizo falta otra versión'),
      p(`IPv4 tiene 32 bits: unos 4,300 millones de direcciones para un planeta con más de 8,000 millones de personas y muchos más aparatos conectados. NAT permitió estirar esas direcciones durante décadas, pero es un parche: complica las redes y rompe la comunicación directa entre equipos.

La solución de fondo fue cambiar el tamaño de la dirección. **IPv6** usa **128 bits**.`),
      nota('aviso', `¿Y la versión 5? Existió un protocolo experimental para transmitir audio y video que usó el número 5, así que la siguiente versión de IP tomó el 6. No hay un «IPv5» que te hayas perdido.`),

      h('Cuánto son 128 bits'),
      p(`Ya sabes que **cada bit que se agrega duplica** la cantidad de combinaciones. Pasar de 32 a 128 bits no es «cuatro veces más direcciones»: es duplicar 96 veces seguidas.`),
      tabla(['', 'IPv4', 'IPv6'], [
        ['Bits', '32', '128'],
        ['Direcciones', '2^32', '2^128'],
        ['En cifras', '4,294,967,296', '340,282,366,920,938,463,463,374,607,431,768,211,456'],
        ['Aproximadamente', '4.3 × 10^9', '3.4 × 10^38'],
      ]),
      p(`Ese número no cabe en la cabeza, así que una comparación: con IPv6 habría direcciones suficientes para dar **miles de millones de direcciones a cada grano de arena** de todas las playas de la Tierra. En la práctica, las direcciones IPv6 no se van a agotar.`),

      h('El problema de escribir 128 bits'),
      p(`En IPv4 escribimos los 32 bits como cuatro números decimales. Si hiciéramos lo mismo con IPv6 tendríamos **dieciséis** números separados por puntos: imposible de leer y de dictar.

Hace falta una forma de escribir más compacta. Esa forma es el sistema **hexadecimal**.`),

      h('Hexadecimal desde cero'),
      p(`Ya conoces dos sistemas de numeración:`),
      lista(
        '**Decimal** (base 10): diez símbolos, del 0 al 9. Al pasar de 9 se acaban los símbolos y se escribe 10.',
        '**Binario** (base 2): dos símbolos, 0 y 1. Al pasar de 1 se acaban y se escribe 10.',
      ),
      p(`El **hexadecimal** (base 16) tiene **dieciséis** símbolos. Como solo hay diez cifras, los seis que faltan se toman del abecedario: **a, b, c, d, e, f**.`),
      tabla(['Decimal', 'Hexadecimal', 'Binario (4 bits)', '', 'Decimal', 'Hexadecimal', 'Binario (4 bits)'], [
        ['0', '0', '0000', '', '8', '8', '1000'],
        ['1', '1', '0001', '', '9', '9', '1001'],
        ['2', '2', '0010', '', '10', '**a**', '1010'],
        ['3', '3', '0011', '', '11', '**b**', '1011'],
        ['4', '4', '0100', '', '12', '**c**', '1100'],
        ['5', '5', '0101', '', '13', '**d**', '1101'],
        ['6', '6', '0110', '', '14', '**e**', '1110'],
        ['7', '7', '0111', '', '15', '**f**', '1111'],
      ], 'Esta tabla es todo lo que hay que saber. Las letras pueden escribirse en mayúscula o minúscula; en IPv6 se recomienda minúscula.'),
      nota('clave', `La razón de usar hexadecimal: **un dígito hexadecimal equivale exactamente a 4 bits**. Con 4 bits hay 2^4 = 16 combinaciones, justo las que cubre un dígito del 0 a la f. Por eso pasar de hexadecimal a binario es inmediato: se cambia cada dígito por sus 4 bits, sin hacer cuentas largas.`),

      h3('De hexadecimal a binario'),
      p(`Se sustituye cada dígito por sus 4 bits, usando los pesos **8, 4, 2, 1**. El dígito \`a\` vale 10 = 8 + 2, así que es \`1010\`.`),
      ejemplo('facil', 'Un byte de hexadecimal a binario', hex('hex-bin', 0xac)),
      ejemplo('medio', 'Un hexteto completo a binario', hex('hex-bin', 0xfe80, 16)),
      h3('De binario a hexadecimal'),
      p(`Al revés: se corta el número en grupos de 4 bits, **empezando por la derecha**, y cada grupo se convierte en un dígito.`),
      ejemplo('facil', 'Un byte de binario a hexadecimal', hex('bin-hex', 0x5e)),
      ejemplo('medio', 'Dieciséis bits a hexadecimal', hex('bin-hex', 0x2001, 16)),
      h3('De hexadecimal a decimal'),
      p(`En decimal las posiciones valen 1, 10, 100, 1000 (potencias de 10). En hexadecimal valen **1, 16, 256, 4,096** (potencias de 16). Se multiplica cada dígito por el peso de su posición y se suma.`),
      ejemplo('facil', 'El mayor valor de un byte', hex('hex-dec', 0xff)),
      ejemplo('medio', 'Un byte cualquiera', hex('hex-dec', 0xc0)),
      ejemplo('dificil', 'Un hexteto a decimal', hex('hex-dec', 0x0db8, 16)),
      h3('De decimal a hexadecimal'),
      p(`Se pregunta cuántas veces cabe cada peso, de mayor a menor, igual que al pasar de decimal a binario.`),
      ejemplo('medio', 'Un número conocido de las máscaras', hex('dec-hex', 192)),
      ejemplo('dificil', 'Un número de cuatro dígitos hexadecimales', hex('dec-hex', 65152, 16)),
      nota('truco', `Dos valores que conviene saber de memoria: \`ff\` = 255 (un byte con todos sus bits en 1) y \`ffff\` = 65,535 (un hexteto con todos sus bits en 1).`),

      h('Cómo se escribe una dirección IPv6'),
      p(`Los 128 bits se cortan en **8 grupos de 16 bits**. Cada grupo se escribe con **4 dígitos hexadecimales** (4 dígitos × 4 bits = 16 bits) y los grupos se separan con **dos puntos**.`),
      codigo('Una dirección IPv6 completa', `2001:0db8:acad:0001:0000:0000:0000:0010
└──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘
 1    2    3    4    5    6    7    8      ← 8 hextetos de 16 bits = 128 bits`),
      p(`Cada grupo de 16 bits se llama **hexteto** (también lo verás como *hextet* o, a veces, «grupo»). Es el equivalente al octeto de IPv4.`),
      tabla(['', 'IPv4', 'IPv6'], [
        ['Tamaño', '32 bits', '128 bits'],
        ['Se divide en', '4 octetos de 8 bits', '8 hextetos de 16 bits'],
        ['Cada grupo se escribe en', 'decimal (0 a 255)', 'hexadecimal (0000 a ffff)'],
        ['Separador', 'punto', 'dos puntos'],
        ['Ejemplo', '192.168.10.77', '2001:0db8:acad:0001:0000:0000:0000:0010'],
      ]),
      p(`Una dirección completa tiene 32 dígitos. Para no escribirlos todos existen dos reglas de abreviación, que son el tema de la lección siguiente.`),

      h('En qué más cambia IPv6'),
      tabla(['Tema', 'IPv4', 'IPv6'], [
        ['Direcciones', 'Escasas', 'Prácticamente ilimitadas'],
        ['NAT', 'Imprescindible en casi toda red', 'No es necesario: cada equipo puede tener una dirección global'],
        ['Broadcast', 'Existe', '**No existe.** Lo sustituye el multicast'],
        ['Encontrar la MAC de un vecino', 'ARP', 'NDP (descubrimiento de vecinos), que viaja sobre ICMPv6'],
        ['Configuración automática', 'Solo con un servidor DHCP', 'El equipo puede configurarse solo (SLAAC), sin servidor'],
        ['Cabecera del paquete', 'Tamaño variable (20 a 60 bytes), con muchos campos', 'Tamaño fijo de 40 bytes, más simple de procesar'],
        ['Máscara', 'Máscara decimal o prefijo', 'Siempre prefijo (/64)'],
      ]),
      nota('clave', `Las dos diferencias que más se preguntan: en IPv6 **no hay broadcast** y **no hace falta NAT**.`),

      h('Convivir con IPv4'),
      p(`Internet no puede apagarse un día y encenderse al siguiente con otro protocolo. IPv4 e IPv6 **no son compatibles entre sí** (un equipo solo IPv4 no entiende un paquete IPv6), así que conviven con tres técnicas:`),
      tabla(['Técnica', 'Cómo funciona', 'Cuándo se usa'], [
        ['**Doble pila** (dual stack)', 'El equipo tiene las dos direcciones, una IPv4 y una IPv6, y usa la que haga falta para cada destino.', 'Es la opción preferida. Tu computadora y tu teléfono ya lo hacen.'],
        ['**Túnel**', 'Un paquete IPv6 viaja metido dentro de un paquete IPv4 para cruzar una red que solo entiende IPv4.', 'Unir dos islas IPv6 separadas por una red IPv4.'],
        ['**Traducción** (NAT64)', 'Un equipo intermedio convierte paquetes IPv6 en IPv4 y al revés.', 'Clientes solo IPv6 que necesitan llegar a servidores solo IPv4.'],
      ]),

      h('Resumen'),
      lista(
        'IPv6 usa direcciones de **128 bits**: 2^128, unas 3.4 × 10^38.',
        'Se escribe en **hexadecimal**: 8 hextetos de 4 dígitos, separados por dos puntos.',
        'Un dígito hexadecimal = 4 bits. Un hexteto = 16 bits.',
        'No hay broadcast, no hace falta NAT, y el equipo puede configurarse solo.',
        'IPv4 e IPv6 conviven con doble pila, túneles y traducción.',
      ),

      ejercicios('Practica', 'Empieza por un byte (dos dígitos) y pasa después a hextetos completos (cuatro dígitos).', [
        hex('hex-bin', 0x0f), hex('hex-bin', 0xa5), hex('hex-bin', 0xfd00, 16), hex('hex-bin', 0xcafe, 16),
        hex('bin-hex', 0xf0), hex('bin-hex', 0x3c), hex('bin-hex', 0xfe80, 16), hex('bin-hex', 0x0db8, 16),
        hex('hex-dec', 0x10), hex('hex-dec', 0x7f), hex('hex-dec', 0xfe), hex('hex-dec', 0x0100, 16), hex('hex-dec', 0xffff, 16),
        hex('dec-hex', 10), hex('dec-hex', 172), hex('dec-hex', 254), hex('dec-hex', 4096, 16), hex('dec-hex', 8193, 16),
        op('¿Cuántos bits tiene una dirección IPv6?', ['32', '64', '128', '256'], 2, 'IPv6 usa 128 bits, cuatro veces la longitud de IPv4 (32). 64 es solo la mitad: el tamaño habitual del prefijo de una red.'),
        op('¿Cuántos bits representa un solo dígito hexadecimal?', ['2', '4', '8', '16'], 1, 'Con 4 bits hay 16 combinaciones, las mismas que cubre un dígito del 0 a la f. 8 bits son dos dígitos (un byte) y 16 bits, cuatro dígitos (un hexteto).'),
        op('¿Cuántos hextetos tiene una dirección IPv6 completa?', ['4', '6', '8', '16'], 2, '128 bits ÷ 16 bits por hexteto = 8 hextetos. 16 serían los octetos, si se escribiera como IPv4.'),
        vs('¿Cuáles de estas afirmaciones sobre IPv6 son ciertas?', ['No existe la dirección de broadcast', 'NAT es obligatorio para salir a Internet', 'Un equipo puede generar su propia dirección sin servidor DHCP', 'Las direcciones se escriben en decimal'], [0, 2], 'IPv6 sustituye el broadcast por multicast y permite la autoconfiguración (SLAAC). NAT deja de ser necesario porque sobran direcciones, y la notación es hexadecimal.'),
        rel('Relaciona cada técnica de convivencia con su descripción.', [['Doble pila', 'El equipo tiene a la vez una dirección IPv4 y una IPv6'], ['Túnel', 'El paquete IPv6 viaja dentro de un paquete IPv4'], ['NAT64', 'Un equipo intermedio traduce entre IPv6 e IPv4']], 'La doble pila es la preferida; el túnel cruza redes que solo hablan IPv4; la traducción comunica mundos que solo hablan un protocolo cada uno.', ['El equipo cambia de protocolo cada hora']),
        op('¿Qué protocolo sustituye a ARP en IPv6?', ['DHCPv6', 'NDP, sobre ICMPv6', 'NAT64', 'DNS'], 1, 'El descubrimiento de vecinos (NDP) usa mensajes ICMPv6 enviados por multicast para averiguar la MAC de un vecino. ARP no existe en IPv6 porque dependía del broadcast.'),
        op('¿Qué valor decimal tiene el dígito hexadecimal `c`?', ['10', '11', '12', '13'], 2, 'a = 10, b = 11, c = 12, d = 13, e = 14, f = 15.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 5 */
  {
    slug: 'escribir-direcciones-ipv6',
    titulo: 'Escribir direcciones IPv6: abreviar y expandir',
    resumen: 'Las dos reglas para acortar una dirección IPv6, cómo recuperar la forma completa y los errores que más puntos cuestan.',
    nivel: 'medio',
    objetivos: [
      'Aplicar la regla 1: quitar los ceros a la izquierda de cada hexteto.',
      'Aplicar la regla 2: sustituir una racha de hextetos en cero por `::`, una sola vez.',
      'Expandir cualquier dirección abreviada a sus 8 hextetos de 4 dígitos.',
      'Detectar direcciones IPv6 mal escritas.',
    ],
    bloques: [
      h('Por qué se abrevia'),
      p(`Una dirección IPv6 completa tiene 32 dígitos y 7 signos de dos puntos:`),
      codigo('Forma completa', `2001:0db8:0000:0000:0000:0000:0000:0001`),
      p(`La mayoría de esos dígitos son ceros que no aportan información. Con dos reglas, esa misma dirección se escribe así:`),
      codigo('Forma abreviada', `2001:db8::1`),
      p(`Las dos formas representan **exactamente los mismos 128 bits**. Abreviar no cambia la dirección, solo la manera de escribirla, igual que «007» y «7» son el mismo número.`),

      h('Regla 1: quitar los ceros a la izquierda'),
      p(`En **cada hexteto**, los ceros que están **a la izquierda** se pueden omitir.`),
      tabla(['Hexteto completo', 'Abreviado', 'Comentario'], [
        ['`0db8`', '`db8`', 'Se quita un cero.'],
        ['`0042`', '`42`', 'Se quitan dos.'],
        ['`000a`', '`a`', 'Se quitan tres.'],
        ['`0000`', '`0`', 'Un hexteto entero en cero deja **un** cero. No puede quedar vacío.'],
        ['`ab00`', '`ab00`', 'Los ceros de la **derecha** no se tocan.'],
        ['`0a0b`', '`a0b`', 'Solo se quita el primero: el cero del medio no está «a la izquierda».'],
      ]),
      nota('error', `Nunca se quitan ceros de la derecha ni de en medio. \`ab00\` no es \`ab\`: es como decir que 1200 pesos son 12 pesos. Si quitas un cero que no está a la izquierda, cambias el número.`),
      ejemplo('facil', 'Solo ceros a la izquierda, sin rachas de ceros', abr('2001:0db8:00a1:0b00:0001:0020:0300:4000'),
        'Observa `0b00`, `0300` y `4000`: los ceros de la derecha se quedan.'),

      h('Regla 2: los dos puntos dobles'),
      p(`Cuando hay **dos o más hextetos seguidos que valen cero**, toda la racha se sustituye por **\`::\`** (dos puntos dobles).`),
      tabla(['Después de la regla 1', 'Con la regla 2'], [
        ['`2001:db8:0:0:0:0:0:1`', '`2001:db8::1`'],
        ['`fe80:0:0:0:0:0:0:1`', '`fe80::1`'],
        ['`2001:db8:acad:1:0:0:0:0`', '`2001:db8:acad:1::`'],
        ['`0:0:0:0:0:0:0:1`', '`::1`'],
        ['`0:0:0:0:0:0:0:0`', '`::`'],
      ], 'El `::` puede ir en medio, al final o al principio de la dirección.'),
      h3('La condición: solo una vez'),
      p(`El \`::\` solo puede aparecer **una vez** en la dirección. La razón es que quien lee la dirección tiene que poder deshacer la abreviatura: sabe que en total hay 8 hextetos, cuenta los que ve y deduce cuántos ceros representa el \`::\`.

Con dos \`::\` eso sería imposible. Mira \`2001::1::5\`: hay 3 hextetos escritos y faltan 5 ceros, pero ¿son 1 y 4, 2 y 3, 3 y 2 o 4 y 1? Cada reparto es una dirección distinta. Por eso está prohibido.`),
      h3('Si hay varias rachas, ¿cuál se abrevia?'),
      p(`La norma que fija la forma correcta de escribir IPv6 (la RFC 5952) da tres criterios:`),
      orden(
        'Se abrevia la racha **más larga**.',
        'Si hay dos rachas igual de largas, se abrevia la **primera** (la de la izquierda).',
        'Un hexteto en cero **suelto** nunca se cambia por `::`: se escribe `0`.',
      ),
      tabla(['Dirección (tras la regla 1)', 'Rachas de ceros', 'Forma correcta'], [
        ['`2001:db8:0:0:1:0:0:0`', 'una de 2 y otra de 3', '`2001:db8:0:0:1::` (la de 3)'],
        ['`2001:db8:0:0:1:0:0:1`', 'dos de 2: empate', '`2001:db8::1:0:0:1` (la primera)'],
        ['`2001:db8:0:1:2:3:4:5`', 'un cero suelto', '`2001:db8:0:1:2:3:4:5` (sin `::`)'],
      ]),
      ejemplo('facil', 'Una racha larga en medio', abr('2001:0db8:0000:0000:0000:0000:0000:0001')),
      ejemplo('facil', 'La racha está al final', abr('2001:0db8:acad:0001:0000:0000:0000:0000')),
      ejemplo('medio', 'Una racha y un cero suelto', abr('2001:0db8:0000:00ab:0000:0000:0000:0100')),
      ejemplo('dificil', 'Dos rachas de distinto tamaño', abr('2001:0000:0000:0a00:0000:0000:0000:0001')),
      ejemplo('dificil', 'Dos rachas iguales: empate', abr('2001:0db8:0000:0000:0001:0000:0000:0001')),
      ejemplo('dificil', 'Ningún par de ceros seguidos', abr('2001:0db8:0000:0001:0000:0002:0000:0003')),

      h('El camino inverso: expandir'),
      p(`Para recuperar la forma completa se deshacen las dos reglas, en orden contrario:`),
      orden(
        '**Cuenta** los hextetos que hay escritos.',
        'Si hay `::`, sustitúyelo por tantos hextetos en cero como falten para llegar a **8**.',
        '**Rellena** cada hexteto con ceros a la izquierda hasta que tenga 4 dígitos.',
      ),
      formula('hextetos que representa :: = 8 − hextetos escritos', [], 'Ejemplo: `2001:db8::1` tiene 3 hextetos escritos, así que el `::` son 8 − 3 = 5 hextetos en cero.'),
      ejemplo('facil', 'Expandir la dirección más típica', exp('2001:db8::1')),
      ejemplo('medio', 'El `::` al final', exp('2001:db8:acad:1::')),
      ejemplo('medio', 'El `::` al principio', exp('::1')),
      ejemplo('dificil', 'Un `::` y ceros sueltos', exp('2001:db8::1:0:0:1')),
      ejemplo('dificil', 'Sin `::`: solo faltan ceros a la izquierda', exp('2001:db8:0:1:a:b0:c00:d000')),

      h('Errores típicos'),
      tabla(['Escrito', 'Qué está mal'], [
        ['`2001:db8::1::2`', 'Dos `::` en la misma dirección.'],
        ['`2001:db8:acad:1`', 'Solo 4 hextetos y sin `::`: faltan 4. Lo correcto sería `2001:db8:acad:1::`.'],
        ['`2001:db8:acad:1:0:0:0:0:1`', 'Nueve hextetos: sobra uno.'],
        ['`2001:db8:gafa::1`', 'La `g` no es un dígito hexadecimal (solo de la a a la f).'],
        ['`2001:0db81::1`', 'Un hexteto con cinco dígitos: el máximo es cuatro.'],
        ['`2001:db8:0:0:0:0:0:1`', 'Es válida, pero no es la forma más corta: debería ser `2001:db8::1`.'],
        ['`2001:db8::0:1`', 'Válida, pero el `::` no cubre toda la racha de ceros.'],
      ]),
      nota('truco', `Para comprobar una abreviatura, expándela mentalmente: cuenta los hextetos escritos, réstalos de 8 y mira si el resultado coincide con los ceros que quitaste.`),
      nota('aviso', `En los ejercicios de **abreviar** solo se acepta la forma más corta, tal como la define la RFC 5952. En los de **expandir** solo se acepta la forma completa de 32 dígitos.`),

      h('Resumen'),
      lista(
        '**Regla 1:** fuera los ceros a la izquierda de cada hexteto. `0000` se queda en `0`.',
        '**Regla 2:** una racha de dos o más hextetos en cero se cambia por `::`, **una sola vez**.',
        'Varias rachas: la más larga; si empatan, la primera.',
        'Para expandir: `::` = 8 menos los hextetos escritos; después, rellenar a 4 dígitos.',
      ),

      ejercicios('Practica: abreviar', 'Aplica primero la regla 1 a toda la dirección y después busca las rachas de ceros.', [
        abr('2001:0db8:0000:0000:0000:0000:0000:0025'), abr('fe80:0000:0000:0000:0000:0000:0000:0001'), abr('2001:0db8:acad:0010:0000:0000:0000:0000'),
        abr('2001:0db8:000a:000b:000c:000d:000e:000f'), abr('fd00:0000:0000:0001:0000:0000:0000:00ff'), abr('2001:0db8:1000:0200:0030:0004:0000:0000'),
        abr('2607:f8b0:0000:0000:0000:0000:0000:200e'), abr('2001:0db8:0000:0000:1234:0000:0000:0000'), abr('2001:0db8:0000:0000:1234:0000:0000:5678'),
        abr('ff02:0000:0000:0000:0000:0000:0000:0002'), abr('2001:0000:0001:0000:0001:0000:0001:0000'), abr('0000:0000:0000:0000:0000:0000:0000:0001'),
        abr('2001:0db8:0000:0100:0000:0000:0ab0:0000'),
      ]),
      ejercicios('Practica: expandir', 'Cuenta los hextetos antes de escribir nada.', [
        exp('2001:db8::25'), exp('fe80::1'), exp('2001:db8:acad:10::'), exp('::'), exp('fd00:0:0:1::ff'), exp('ff02::1:ff00:1'),
        exp('2001:db8::1234:0:0:5678'), exp('2607:f8b0::200e'), exp('2001:db8:1:2:3:4:5:6'), exp('2001:0:0:a::b'),
        op('¿Cuántas veces puede aparecer `::` en una dirección IPv6?', ['Ninguna', 'Una sola vez', 'Dos veces', 'Las que hagan falta'], 1, 'Con más de un `::` no se podría saber cuántos ceros corresponden a cada uno, y la dirección sería ambigua.'),
        op('¿Cuál es la forma abreviada correcta de `2001:0db8:0000:0000:0a00:0000:0000:0001`?', ['2001:db8::a::1', '2001:db8::a00:0:0:1', '2001:db8:0:0:a00::1', '2001:db8::a:0:0:1'], 1, 'Hay dos rachas de dos hextetos: empate, así que el `::` va en la primera. La primera opción usa dos `::`; la tercera abrevia la segunda racha; la cuarta quita ceros de la derecha de `0a00`, que no está permitido.'),
        vs('¿Cuáles de estas direcciones IPv6 están bien escritas (son válidas)?', ['2001:db8::1', '2001:db8::1::2', 'fe80::1ff:fe23:4567:890a', '2001:db8:1:2:3:4:5:6:7', '2001:db8::g1'], [0, 2], 'La segunda tiene dos `::`, la cuarta tiene nueve hextetos y la quinta usa la letra g, que no es hexadecimal.'),
        op('En `2001:db8:a::b`, ¿cuántos hextetos en cero representa el `::`?', ['2', '3', '4', '5'], 2, 'Hay 4 hextetos escritos (2001, db8, a, b). 8 − 4 = 4 hextetos en cero.'),
        op('¿Cuál es la forma abreviada correcta del hexteto `0a0b`?', ['ab', 'a0b', 'a0b0', '0a0b es la única forma'], 1, 'Solo se quita el cero de la izquierda. El cero que está entre la a y la b forma parte del valor.'),
        ord('Ordena los pasos para expandir una dirección IPv6 abreviada.', ['Contar los hextetos escritos', 'Sustituir el `::` por los hextetos en cero que faltan', 'Rellenar cada hexteto con ceros a la izquierda hasta 4 dígitos'], 'Primero hay que saber cuántos hextetos faltan; después se reponen, y por último se completa cada uno.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 6 */
  {
    slug: 'tipos-de-direcciones-ipv6',
    titulo: 'Tipos de direcciones IPv6',
    resumen: 'Unicast global, link-local, única local, multicast, loopback y sin especificar: cómo reconocer cada una por su comienzo y para qué sirve.',
    nivel: 'medio',
    objetivos: [
      'Distinguir unicast, multicast y anycast.',
      'Reconocer por su primer hexteto una dirección global, link-local, única local o multicast.',
      'Explicar para qué sirve la dirección link-local y por qué toda interfaz tiene una.',
      'Explicar qué sustituye al broadcast en IPv6.',
    ],
    bloques: [
      h('Tres formas de entregar un paquete'),
      tabla(['Tipo', 'A quién llega', 'Se parece a…'], [
        ['**Unicast**', 'A una sola interfaz.', 'Una carta a una persona.'],
        ['**Multicast**', 'A todas las interfaces que pertenecen a un grupo.', 'Un mensaje a un grupo de chat: lo reciben quienes se unieron.'],
        ['**Anycast**', 'A la más cercana de varias interfaces que comparten la misma dirección.', 'Marcar al número de emergencias: contesta la central más cercana.'],
      ]),
      nota('clave', `En IPv6 **no existe el broadcast**. En IPv4, un broadcast interrumpe a todos los equipos de la red, les interese o no. En IPv6, lo que antes se gritaba a todos se envía por **multicast** solo a los equipos que escuchan ese grupo.`),

      h('Una interfaz, varias direcciones'),
      p(`En IPv4 lo normal es que una interfaz tenga una dirección. En IPv6 es normal que tenga **dos o más**: siempre una link-local y, además, una global o una única local para hablar más allá de su enlace.`),
      codigo('Windows: una interfaz con dos direcciones IPv6', `C:\\> ipconfig

   Dirección IPv6 . . . . . . . . . . : 2001:db8:acad:1:c5d2:7fa1:22b0:9e31
   Vínculo: dirección IPv6 local. . . : fe80::c5d2:7fa1:22b0:9e31%12
   Dirección IPv4. . . . . . . . . . .: 192.168.1.57
   Puerta de enlace predeterminada . .: fe80::1%12
                                        192.168.1.1`),

      h('Unicast global: la dirección pública'),
      p(`Una dirección **unicast global** (GUA, *Global Unicast Address*) es única en todo Internet y enrutable. Es el equivalente a una IPv4 pública.

Hoy se asignan del bloque **\`2000::/3\`**. Un /3 fija los tres primeros bits en \`001\`, y eso deja como primer dígito hexadecimal solo dos posibilidades: \`0010\` = **2** y \`0011\` = **3**.`),
      formula('Unicast global: el primer dígito es 2 o 3', [], 'Va de `2000::` a `3fff:ffff:ffff:ffff:ffff:ffff:ffff:ffff`.'),
      nota('aviso', `El bloque **\`2001:db8::/32\`** está dentro de ese rango, pero se reservó para **documentación**: ejemplos de libros, cursos y exámenes. Tiene el formato de una dirección global y así se trata en los ejercicios, pero no se enruta en Internet. Es el equivalente a los bloques 192.0.2.0/24 de IPv4.`),

      h('Link-local: la dirección para hablar con los vecinos'),
      p(`Una dirección **link-local** (LLA) solo vale dentro de **un enlace**: el cable, el switch o la red wifi a la que está conectada la interfaz. **Los routers nunca la reenvían.**

Pertenece al bloque **\`fe80::/10\`**. En la práctica casi siempre verás \`fe80::\` seguido del ID de interfaz.`),
      lista(
        '**Toda** interfaz con IPv6 activado tiene una, y se la crea ella sola, sin servidor.',
        'La usa el equipo para descubrir a sus vecinos y a su router antes de tener cualquier otra dirección.',
        'La **puerta de enlace** de un equipo IPv6 es normalmente la dirección link-local del router.',
        'Los protocolos de enrutamiento intercambian sus mensajes usando direcciones link-local.',
      ),
      p(`Como todos los enlaces usan el mismo bloque \`fe80::\`, la misma dirección link-local puede repetirse en redes distintas sin conflicto. Por eso, al hacer ping a una link-local hay que indicar **por qué interfaz** salir: es el \`%12\` o \`%eth0\` que aparece al final.`),
      h3('¿Por qué /10 y no /16?'),
      p(`El prefijo /10 fija los diez primeros bits: \`1111 1110 10\`. Los dos primeros dígitos son \`fe\` y del tercero solo están fijos dos bits (\`10\`), así que el tercer dígito puede ser 8, 9, a o b. El bloque completo va de \`fe80\` a \`febf\`. En el día a día solo se usa \`fe80\`.`),

      h('Única local: la dirección privada'),
      p(`Una dirección **única local** (ULA, *Unique Local Address*) sirve para comunicarse dentro de una organización sin salir a Internet. Es el equivalente a las privadas de IPv4 (10.x, 172.16.x, 192.168.x).

El bloque es **\`fc00::/7\`**, que abarca las direcciones que empiezan por \`fc\` y por \`fd\`. En la práctica solo se usa la mitad **\`fd00::/8\`**, así que una única local real **empieza por fd**.`),
      nota('truco', `Regla para el examen: empieza por **2 o 3** → global. Por **fe80** → link-local. Por **fc o fd** → única local. Por **ff** → multicast.`),

      h('Multicast: los grupos'),
      p(`Las direcciones **multicast** pertenecen al bloque **\`ff00::/8\`**: empiezan siempre por **ff**. Un paquete enviado a una de ellas llega a todos los equipos que se han unido a ese grupo. Nunca se usan como dirección de origen.`),
      tabla(['Dirección', 'Grupo', 'Equivalente en IPv4'], [
        ['`ff02::1`', 'Todos los nodos del enlace', 'El broadcast de la red'],
        ['`ff02::2`', 'Todos los routers del enlace', '224.0.0.2'],
        ['`ff02::1:2`', 'Todos los servidores y agentes DHCPv6', 'El broadcast del Discover de DHCP'],
        ['`ff02::1:ffXX:XXXX`', 'Nodo solicitado: lo usa NDP para preguntar por la MAC de un vecino', 'La petición ARP'],
      ], 'El `02` del primer hexteto indica el alcance: solo el enlace local. Estos grupos no cruzan routers.'),

      h('Dos direcciones especiales'),
      tabla(['Dirección', 'Nombre', 'Significado', 'En IPv4'], [
        ['`::1`', 'Loopback', 'El propio equipo. `ping ::1` comprueba que IPv6 funciona en la máquina.', '127.0.0.1'],
        ['`::`', 'Sin especificar', '«Todavía no tengo dirección». Solo puede ser origen, nunca destino. `::/0` es la ruta por defecto.', '0.0.0.0'],
      ]),

      h('Anycast'),
      p(`Una dirección **anycast** no se distingue de una unicast global a simple vista: es una dirección normal que se configura **en varios equipos a la vez**, en lugares distintos. La red entrega cada paquete al más cercano. Así funcionan los grandes servidores DNS públicos: la misma dirección responde desde decenas de ciudades.`),

      h('Tabla de reconocimiento'),
      tabla(['Tipo', 'Bloque', 'Empieza por', 'Equivalente en IPv4', '¿Cruza routers?'], [
        ['Unicast global', '`2000::/3`', '2 o 3', 'Pública', 'Sí, hasta Internet'],
        ['Link-local', '`fe80::/10`', 'fe80', '169.254.x.x (más o menos)', 'No'],
        ['Única local', '`fc00::/7`', 'fc o fd', 'Privada (RFC 1918)', 'Sí, dentro de la organización'],
        ['Multicast', '`ff00::/8`', 'ff', '224.0.0.0/4', 'Depende del grupo'],
        ['Loopback', '`::1/128`', '—', '127.0.0.1', 'No'],
        ['Sin especificar', '`::/128`', '—', '0.0.0.0', 'No'],
      ]),
      ejemplo('facil', 'La dirección de ejemplo más común', t6('2001:db8:acad:1::10')),
      ejemplo('facil', 'La que tiene toda interfaz', t6('fe80::1')),
      ejemplo('facil', 'Una dirección interna de empresa', t6('fd12:3456:789a:1::1')),
      ejemplo('medio', 'Todos los nodos del enlace', t6('ff02::1')),
      ejemplo('medio', 'El propio equipo', t6('::1')),
      ejemplo('dificil', 'Una dirección de un proveedor real', t6('2607:f8b0:4012:819::200e')),
      ejemplo('dificil', 'El límite superior de link-local', t6('febf::2a')),
      ejemplo('dificil', 'Escrita completa, para no dar pistas', t6('0000:0000:0000:0000:0000:0000:0000:0000')),
      ejemplo('medio', 'Elegir la dirección para cada tarea', op('Una PC necesita enviar un paquete a su puerta de enlace para salir a Internet. La PC tiene la dirección `2001:db8:acad:1::20/64` y la `fe80::20`. ¿A qué dirección del router apunta normalmente su puerta de enlace predeterminada?',
        ['A la dirección multicast `ff02::1`', 'A la dirección link-local del router, por ejemplo `fe80::1`', 'A la dirección de loopback `::1`', 'A la dirección sin especificar `::`'], 1, [
          'La puerta de enlace es un vecino directo: está en el mismo enlace que la PC. Para hablar con un vecino basta una dirección link-local.',
          'El router se anuncia a los equipos con mensajes que salen desde su dirección link-local, y los equipos apuntan esa dirección como puerta de enlace.',
          '`ff02::1` es un grupo, no un equipo concreto; `::1` es la propia PC, y `::` no puede ser destino.',
        ])),

      h('Resumen'),
      lista(
        'IPv6 tiene unicast, multicast y anycast. **No tiene broadcast.**',
        '**2 o 3** → unicast global (pública). **fe80** → link-local (solo el enlace). **fd** → única local (privada). **ff** → multicast.',
        '`::1` es loopback y `::` es «sin dirección».',
        'Toda interfaz IPv6 tiene una link-local, y la puerta de enlace suele ser la link-local del router.',
        '`ff02::1` = todos los nodos; `ff02::2` = todos los routers.',
      ),

      ejercicios('Practica', 'Fíjate solo en el comienzo de cada dirección.', [
        t6('2001:db8::1'), t6('fe80::a1b2:c3d4:e5f6:7890'), t6('fd00::1'), t6('ff02::2'), t6('::1'), t6('::'),
        t6('2a00:1450:4003:80e::200e'), t6('fdff:1:2:3::4'), t6('ff05::1:3'), t6('3001:1:2:3::4'), t6('fe80:0000:0000:0000:0000:0000:0000:00aa'),
        t6('fc00:1::1'), t6('ff02::1:ff23:4567'), t6('2800:3f0:4003:c00::5e'),
        op('¿Qué tipo de dirección IPv6 equivale a una IPv4 privada?', ['Unicast global', 'Link-local', 'Única local', 'Multicast'], 2, 'Las únicas locales (fc00::/7, en la práctica fd00::/8) se usan dentro de una organización y no salen a Internet, como las de la RFC 1918.'),
        op('¿Qué usa IPv6 en lugar del broadcast?', ['Anycast', 'Multicast', 'Unicast global', 'NAT'], 1, 'El grupo multicast `ff02::1` llega a todos los nodos del enlace, y hay grupos más específicos para routers, servidores DHCPv6 y descubrimiento de vecinos.'),
        vs('¿Cuáles de estas afirmaciones sobre las direcciones link-local son ciertas?', ['Empiezan por fe80', 'Los routers las reenvían a otras redes', 'Toda interfaz con IPv6 tiene una', 'Hay que pedirlas al proveedor de Internet'], [0, 2], 'La interfaz se crea sola su dirección link-local y solo vale dentro del enlace: un router jamás la reenvía.'),
        rel('Relaciona cada dirección IPv6 con su equivalente en IPv4.', [['::1', '127.0.0.1'], ['::', '0.0.0.0'], ['fd00::/8', '10.0.0.0/8 y demás privadas'], ['ff02::1', 'El broadcast de la red local']], 'Loopback con loopback, sin especificar con todo ceros, únicas locales con privadas, y el grupo de todos los nodos hace el papel del broadcast.', ['255.255.255.0']),
        op('¿A qué grupo multicast envía un equipo un mensaje para encontrar a los routers de su enlace?', ['ff02::1', 'ff02::2', 'fe80::1', '::1'], 1, '`ff02::2` es el grupo de todos los routers del enlace. `ff02::1` son todos los nodos; `fe80::1` es una link-local cualquiera y `::1` es el propio equipo.'),
        op('Al hacer ping a `fe80::1` desde Windows, el sistema pide añadir algo como `%12` al final. ¿Por qué?', ['Es el número de paquetes que enviar', 'Porque la misma dirección link-local puede existir en varios enlaces y hay que indicar por qué interfaz salir', 'Es el prefijo de la red', 'Porque fe80::1 no es una dirección válida'], 1, 'Todas las interfaces usan el bloque fe80::, así que la dirección sola no dice por dónde está el destino. El número tras el signo de porcentaje identifica la interfaz de salida.'),
        op('Varios servidores en distintas ciudades tienen configurada la misma dirección IPv6 y cada usuario es atendido por el más cercano. ¿Qué tipo de direccionamiento es?', ['Multicast', 'Anycast', 'Link-local', 'Broadcast'], 1, 'En anycast la misma dirección está en varios equipos y la red entrega el paquete a uno solo, el más próximo. En multicast lo recibirían todos.'),
        op('¿Cuál de estas direcciones NO puede usarse como destino de un paquete?', ['ff02::1', '::', '::1', '2001:db8::1'], 1, 'La dirección sin especificar solo sirve como origen provisional de un equipo que aún no tiene dirección.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 7 */
  {
    slug: 'prefijos-y-subredes-ipv6',
    titulo: 'Prefijos, subredes y configuración de IPv6',
    resumen: 'La notación /n en IPv6, la estructura 48 + 16 + 64, cómo sacar el prefijo de una dirección, contar subredes, EUI-64, SLAAC y DHCPv6.',
    nivel: 'dificil',
    objetivos: [
      'Leer un prefijo IPv6 y obtener la red a la que pertenece una dirección.',
      'Explicar la estructura típica: prefijo de enrutamiento global, ID de subred e ID de interfaz.',
      'Calcular cuántas subredes /64 caben en un bloque y escribir cualquiera de ellas.',
      'Generar un ID de interfaz con EUI-64 y distinguir SLAAC de DHCPv6.',
    ],
    bloques: [
      h('El prefijo: lo mismo que en IPv4, sin máscara'),
      p(`En IPv4 la máscara separa la parte de red de la parte de host. En IPv6 la idea es idéntica, pero **solo se usa la notación de barra**: no existe una «máscara» escrita con ocho hextetos.`),
      p(`\`2001:db8:acad:1::10/64\` significa: los **primeros 64 bits** identifican la red y los 64 restantes, al equipo dentro de ella.`),
      tabla(['', 'IPv4', 'IPv6'], [
        ['Parte que identifica la red', 'Red (y subred)', '**Prefijo**'],
        ['Parte que identifica al equipo', 'Host', '**ID de interfaz**'],
        ['Cómo se indica el corte', 'Máscara o /n', 'Solo /n (longitud de prefijo)'],
        ['Longitud máxima', '/32', '/128'],
      ]),
      nota('truco', `Para trabajar con prefijos recuerda dos equivalencias: **un hexteto = 16 bits** y **un dígito hexadecimal = 4 bits**. Con eso, /64 son 4 hextetos; /48 son 3; /56 son 3 hextetos y 2 dígitos.`),

      h('La estructura 48 + 16 + 64'),
      p(`Una dirección unicast global típica se reparte en tres trozos:`),
      codigo('Las tres partes de una dirección global', `2001:0db8:acad : 0001 : 0000:0000:0000:0010
└─────┬──────┘   └─┬┘   └────────┬────────┘
 Prefijo de       ID de        ID de interfaz
 enrutamiento     subred         (64 bits)
 global (48 bits) (16 bits)`),
      tabla(['Parte', 'Bits', 'Quién la decide', 'Para qué'], [
        ['**Prefijo de enrutamiento global**', '48 (lo habitual)', 'El proveedor', 'Identifica a tu organización en Internet.'],
        ['**ID de subred**', '16', 'Tú', 'Numera tus redes internas: una por VLAN, por piso, por sede.'],
        ['**ID de interfaz**', '64', 'El equipo, o tú', 'Identifica a un equipo dentro de la subred.'],
      ]),
      p(`Comparado con IPv4, subnetear en IPv6 es muy sencillo: el **cuarto hexteto es el número de subred**. Con un /48 tienes 16 bits para subredes: 2^16 = 65,536 redes, cada una con más direcciones de las que usarás jamás.`),
      h3('Por qué las LAN son siempre /64'),
      p(`Una red /64 tiene 2^64 direcciones: unos 18 trillones. Parece un desperdicio, pero hay un motivo: la **autoconfiguración (SLAAC)** necesita exactamente 64 bits para el ID de interfaz. Si usas otro tamaño en una red con equipos de usuario, los equipos no pueden configurarse solos.`),
      nota('clave', `Regla de diseño: **toda red con equipos finales es /64**. No se calculan hosts ni se ajusta el tamaño como en VLSM: en IPv6 se cuentan **subredes**, no hosts.`),

      h('Obtener el prefijo de una dirección'),
      p(`Es el equivalente a calcular la dirección de red en IPv4: se conservan los bits del prefijo y **todo lo demás se pone en cero**.`),
      h3('Caso 1: el corte cae entre dos hextetos (/16, /32, /48, /64)'),
      p(`Se divide el prefijo entre 16 y se copian esos hextetos completos. Para /64 son los 4 primeros.`),
      ejemplo('facil', 'El caso de todos los días: /64', pre('2001:db8:acad:1:a1b2:c3d4:e5f6:7890', 64)),
      ejemplo('facil', 'El prefijo que entrega el proveedor: /48', pre('2001:db8:acad:12ff::1', 48)),
      h3('Caso 2: el corte cae entre dos dígitos (/52, /56, /60)'),
      p(`Si el prefijo no es múltiplo de 16 pero sí de 4, el corte parte un hexteto pero respeta los dígitos. Los bits que sobran se convierten en dígitos (4 bits cada uno), se copian esos dígitos y el resto del hexteto pasa a cero.`),
      ejemplo('medio', 'Un /56: dos dígitos del cuarto hexteto', pre('2001:db8:acad:12ff::1', 56)),
      ejemplo('medio', 'Un /60: tres dígitos', pre('2001:db8:acad:12ff:1:2:3:4', 60)),
      h3('Caso 3: el corte parte un dígito (/50, /58, /62…)'),
      p(`Es el caso difícil y el menos frecuente. Hay que pasar a binario **solo el dígito partido**, conservar los bits que le tocan y poner en cero los demás.`),
      ejemplo('dificil', 'Un /58: el corte cae dentro de un dígito', pre('2001:db8:acad:12ff:1:2:3:4', 58)),
      ejemplo('dificil', 'Un /50 sobre una única local', pre('fd3a:91c2:77e0:b7c4::25', 50)),

      h('Contar y numerar subredes'),
      p(`Si el proveedor te da un bloque y tú quieres redes /64, los bits que hay entre un prefijo y el otro son tus **bits de subred**.`),
      formula('subredes = 2^(prefijo de la subred − prefijo recibido)', [['/48 → /64', '2^16 = 65,536 subredes'], ['/56 → /64', '2^8 = 256 subredes'], ['/60 → /64', '2^4 = 16 subredes']], 'En IPv6 no se resta nada: la primera y la última subred se usan con normalidad.'),
      p(`Para escribir una subred concreta, se pasa su número a hexadecimal y se coloca en los bits de subred. Con un /48 es directo: el número de subred **es** el cuarto hexteto.`),
      tabla(['Bloque recibido', 'Subred n.º', 'En hexadecimal', 'Subred /64'], [
        ['`2001:db8:acad::/48`', '0', '0', '`2001:db8:acad::/64`'],
        ['`2001:db8:acad::/48`', '1', '1', '`2001:db8:acad:1::/64`'],
        ['`2001:db8:acad::/48`', '10', 'a', '`2001:db8:acad:a::/64`'],
        ['`2001:db8:acad::/48`', '255', 'ff', '`2001:db8:acad:ff::/64`'],
        ['`2001:db8:acad::/48`', '256', '100', '`2001:db8:acad:100::/64`'],
      ]),
      nota('error', `La subred número 10 **no** es \`2001:db8:acad:10::/64\`. El hexteto está en hexadecimal: \`10\` vale dieciséis. La subred diez es la \`a\`.`),
      ejemplo('facil', 'Cuántas subredes da un /48', sr('2001:db8:acad::', 48, 64)),
      ejemplo('medio', 'Un bloque doméstico /56 y su subred 20', sr('2001:db8:acad:1200::', 56, 64, 20)),
      ejemplo('dificil', 'Un /48 y su subred 1,000', sr('2001:db8:cafe::', 48, 64, 1000)),
      ejemplo('dificil', 'Un /60: solo dieciséis subredes', sr('2001:db8:acad:12f0::', 60, 64, 11)),

      h('El ID de interfaz: de dónde salen los últimos 64 bits'),
      p(`Hay cuatro maneras de rellenar los 64 bits del ID de interfaz:`),
      tabla(['Método', 'Cómo queda', 'Dónde se usa'], [
        ['**Manual**', 'Lo que tú escribas: `::1`, `::10`', 'Routers y servidores.'],
        ['**EUI-64**', 'Se calcula a partir de la dirección MAC', 'Routers Cisco (link-local por defecto), algunos equipos.'],
        ['**Aleatorio**', 'Un número generado al azar, que cambia con el tiempo', 'Windows, macOS, Android e iOS, por privacidad.'],
        ['**DHCPv6**', 'Lo asigna un servidor', 'Redes donde se quiere controlar quién tiene qué dirección.'],
      ]),

      h('EUI-64 paso a paso'),
      p(`Una dirección MAC tiene 48 bits y el ID de interfaz necesita 64. El método **EUI-64** fabrica los 64 a partir de los 48 en tres pasos:`),
      orden(
        '**Partir** la MAC por la mitad: 3 bytes del fabricante y 3 bytes de la tarjeta.',
        '**Insertar `ff:fe`** en medio. Con esos 16 bits ya son 64.',
        '**Invertir el séptimo bit** del primer byte (contando desde la izquierda).',
      ),
      h3('El séptimo bit'),
      p(`Es el bit que vale **2** dentro del primer byte. Invertirlo significa: si está en 0, se pone en 1 (el byte aumenta en 2); si está en 1, se pone en 0 (disminuye en 2). En la práctica, el **segundo dígito hexadecimal** de la MAC cambia así:`),
      tabla(['Segundo dígito original', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'], [
        ['Tras invertir el bit', '2', '3', '0', '1', '6', '7', '4', '5', 'a', 'b', '8', '9', 'e', 'f', 'c', 'd'],
      ], 'Ejemplo: una MAC que empieza por `00` pasa a `02`; una que empieza por `1c` pasa a `1e`; una que empieza por `0a` pasa a `08`.'),
      nota('truco', `Una dirección cuyo ID de interfaz tiene **\`ff:fe\` justo en medio** (por ejemplo \`…:021a:2bff:fe3c:4d5e\`) se generó con EUI-64. Es una pista que sale en los exámenes.`),
      ejemplo('medio', 'EUI-64 para una link-local', eui('00:1a:2b:3c:4d:5e', 'fe80::')),
      ejemplo('dificil', 'EUI-64 con un prefijo global y MAC en formato Cisco', eui('001c.b3a4.5f60', '2001:db8:acad:1::')),
      ejemplo('dificil', 'Cuando el séptimo bit ya estaba en 1', eui('0A-00-27-00-00-14', '2001:db8:1:a::')),

      h('Cómo se configura un equipo: SLAAC y DHCPv6'),
      p(`En IPv6 el router participa en la configuración de los equipos. Periódicamente, o cuando un equipo lo pide, envía un mensaje llamado **anuncio de router** (RA, *Router Advertisement*) al grupo \`ff02::1\`. Ese anuncio dice: «el prefijo de esta red es tal, yo soy la puerta de enlace, y obtén tu dirección de esta manera».`),
      orden(
        'El equipo se crea su dirección **link-local**.',
        'Envía una **solicitud de router** (RS) al grupo `ff02::2`: «¿hay algún router?».',
        'El router contesta con un **anuncio de router** (RA) que incluye el prefijo /64.',
        'El equipo une el prefijo recibido con un ID de interfaz generado por él: ya tiene dirección global.',
      ),
      tabla(['Método', 'Dirección', 'DNS y demás datos', '¿El servidor lleva registro?'], [
        ['**SLAAC**', 'La crea el equipo (prefijo del RA + ID propio)', 'Vienen en el RA', 'No hay servidor'],
        ['**SLAAC + DHCPv6 sin estado**', 'La crea el equipo', 'Los entrega un servidor DHCPv6', 'No'],
        ['**DHCPv6 con estado**', 'La entrega el servidor DHCPv6', 'Los entrega el servidor', 'Sí, como en DHCP de IPv4'],
      ]),
      nota('clave', `**SLAAC** significa *Stateless Address Autoconfiguration*: autoconfiguración **sin estado**. «Sin estado» quiere decir que nadie lleva una lista de qué dirección tiene cada equipo. En los tres casos, la **puerta de enlace** se aprende del anuncio de router, no de DHCPv6.`),

      h('Comandos básicos'),
      codigo('Router Cisco: activar IPv6 y poner direcciones', `Router(config)# ipv6 unicast-routing
Router(config)# interface g0/0
Router(config-if)# ipv6 address 2001:db8:acad:1::1/64
Router(config-if)# ipv6 address fe80::1 link-local
Router(config-if)# no shutdown`),
      p(`\`ipv6 unicast-routing\` es imprescindible: sin él, el router tiene direcciones IPv6 pero **no reenvía** paquetes IPv6 ni envía anuncios de router, y los equipos no pueden usar SLAAC.`),
      codigo('Router Cisco: dirección con EUI-64 y verificación', `Router(config-if)# ipv6 address 2001:db8:acad:2::/64 eui-64
Router# show ipv6 interface brief
GigabitEthernet0/0     [up/up]
    FE80::1
    2001:DB8:ACAD:1::1`),
      codigo('Comprobar desde un equipo', `C:\\> ipconfig                        Windows: muestra IPv4 e IPv6
C:\\> ping -6 2001:db8:acad:1::1      Windows: ping forzando IPv6
C:\\> ping fe80::1%12                 Windows: link-local, indicando la interfaz
$ ip -6 addr                         Linux: direcciones IPv6
$ ping -6 2001:db8:acad:1::1         Linux
$ ping fe80::1%eth0                  Linux: link-local, indicando la interfaz`),

      h('Resumen'),
      lista(
        'En IPv6 solo hay prefijo (/n): no existe la máscara escrita.',
        'Estructura típica: **48** bits del proveedor + **16** de subred + **64** de interfaz.',
        'Las redes con equipos son siempre **/64**.',
        'Subredes = 2 elevado a los bits que hay entre los dos prefijos. No se resta nada.',
        'EUI-64: partir la MAC, insertar `ff:fe`, invertir el séptimo bit.',
        'SLAAC: el equipo se configura solo con el prefijo del anuncio de router.',
        '`ipv6 unicast-routing` convierte al equipo Cisco en router IPv6.',
      ),

      ejercicios('Practica: prefijos', 'Divide el prefijo entre 16 para saber cuántos hextetos completos son de red.', [
        pre('2001:db8:cafe:1:1:2:3:4', 64), pre('fe80::21a:2bff:fe3c:4d5e', 64), pre('2001:db8:aaaa:bbbb:cccc:dddd:eeee:ffff', 48),
        pre('2001:db8:aaaa:bbbb:cccc:dddd:eeee:ffff', 32), pre('2001:db8:aaaa:bbbb:cccc:dddd:eeee:ffff', 56), pre('2001:db8:aaaa:bbbb:cccc:dddd:eeee:ffff', 52),
        pre('2001:db8:aaaa:bbbb:cccc:dddd:eeee:ffff', 60), pre('fd00:1234:5678:9abc::1', 40), pre('2001:db8:aaaa:bbbb:cccc:dddd:eeee:ffff', 54),
        pre('2001:db8:acad:7f9c::100', 62), pre('2607:f8b0:4012:819::200e', 44),
      ]),
      ejercicios('Practica: subredes, EUI-64 y configuración', 'En las subredes numeradas, recuerda pasar el número a hexadecimal.', [
        sr('2001:db8:1::', 48, 64), sr('2001:db8:1:a00::', 56, 64), sr('2001:db8:1:a0::', 60, 64),
        sr('2001:db8:beef::', 48, 64, 10), sr('2001:db8:beef::', 48, 64, 255), sr('2001:db8:beef::', 48, 64, 4096),
        sr('2001:db8:beef:4000::', 52, 64, 100), sr('2001:db8:beef:ab00::', 56, 64, 200), sr('2001:db8::', 32, 48),
        eui('00:50:56:c0:00:08', 'fe80::'), eui('3c:22:fb:10:9a:01', '2001:db8:acad:5::'), eui('F0-18-98-AB-CD-EF', '2001:db8:10:20::'), eui('0200.5e00.5301', 'fe80::'),
        op('¿Qué longitud de prefijo debe tener una red IPv6 con equipos de usuario para que funcione SLAAC?', ['/48', '/56', '/64', '/128'], 2, 'SLAAC necesita exactamente 64 bits para el ID de interfaz. /48 y /56 son tamaños de bloque que entrega el proveedor, y /128 es una sola dirección.'),
        op('En una dirección unicast global con un prefijo de enrutamiento global de 48 bits, ¿qué hexteto contiene el ID de subred?', ['El primero', 'El tercero', 'El cuarto', 'El octavo'], 2, 'Los tres primeros hextetos (48 bits) son el prefijo global; el cuarto (16 bits) es el ID de subred, y los cuatro últimos, el ID de interfaz.'),
        op('¿Qué comando hace que un router Cisco reenvíe paquetes IPv6 y envíe anuncios de router?', ['ipv6 enable', 'ipv6 unicast-routing', 'ip routing', 'ipv6 address autoconfig'], 1, '`ipv6 enable` solo crea la link-local de una interfaz; `ip routing` es de IPv4, y `ipv6 address autoconfig` hace que la interfaz se configure como cliente. El que activa el enrutamiento IPv6 es `ipv6 unicast-routing`.'),
        vs('¿Qué dos operaciones hace EUI-64 sobre la dirección MAC?', ['Inserta `fffe` en medio', 'Invierte el séptimo bit del primer byte', 'Invierte el orden de los bytes', 'Añade el prefijo fe80 al final'], [0, 1], 'EUI-64 parte la MAC, inserta `ff:fe` entre las dos mitades e invierte el bit U/L, que es el séptimo del primer byte. No reordena bytes.'),
        op('Una dirección IPv6 termina en `…:0250:56ff:fec0:0008`. ¿Qué te indica el `ff:fe` del medio?', ['Que es una dirección multicast', 'Que el ID de interfaz se generó con EUI-64 a partir de la MAC', 'Que la asignó un servidor DHCPv6', 'Que es una dirección de loopback'], 1, 'El `fffe` insertado entre las dos mitades de la MAC es la huella de EUI-64. Multicast se reconoce por el principio (ff), no por el medio.'),
        rel('Relaciona cada método de configuración con quién proporciona la dirección.', [['SLAAC', 'El propio equipo, con el prefijo del anuncio de router'], ['DHCPv6 con estado', 'Un servidor DHCPv6, que lleva registro'], ['Manual', 'El administrador, escribiéndola']], 'En SLAAC no hay servidor que reparta direcciones; con DHCPv6 con estado sí lo hay; y la configuración manual se reserva para routers y servidores.', ['El servidor DNS']),
        op('Con SLAAC y DHCPv6, ¿de dónde aprende un equipo IPv6 cuál es su puerta de enlace?', ['Del servidor DHCPv6', 'Del anuncio de router (RA)', 'Del servidor DNS', 'La calcula con EUI-64'], 1, 'A diferencia de IPv4, DHCPv6 no entrega la puerta de enlace: el equipo la aprende del anuncio que envía el propio router.'),
        ord('Ordena lo que hace un equipo para obtener una dirección global con SLAAC.', ['Crea su dirección link-local', 'Envía una solicitud de router (RS) a ff02::2', 'Recibe el anuncio de router (RA) con el prefijo', 'Une el prefijo con su ID de interfaz'], 'Sin link-local no puede enviar nada; con ella pregunta por routers, recibe el prefijo y forma su dirección global.'),
      ]),
    ],
  },
];
