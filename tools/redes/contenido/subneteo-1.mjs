// Subneteo · lecciones 1 a 6: binario, clases, máscara, fórmulas, bits prestados y número mágico.
import { h, h3, p, lista, orden, tabla, nota, formula, bits, ejemplo, ejercicios, op, an, td } from './_ayuda.mjs';

export default [
  /* ------------------------------------------------------------------ 1 */
  {
    slug: 'direccion-ip-y-binario',
    titulo: 'La dirección IP y el sistema binario',
    resumen: 'Qué es una dirección IPv4, por qué son cuatro números y cómo pasar cada uno de decimal a binario y de vuelta.',
    nivel: 'facil',
    objetivos: [
      'Explicar qué identifica una dirección IPv4 y cómo se escribe.',
      'Convertir cualquier octeto de decimal a binario y de binario a decimal usando los ocho pesos.',
      'Decir cuántas direcciones caben en 32 bits y por qué un octeto nunca pasa de 255.',
    ],
    bloques: [
      h('Para qué sirve una dirección IP'),
      p(`Para que dos equipos se envíen datos, cada uno necesita una dirección que lo identifique, igual que una casa necesita una dirección postal para recibir cartas. En las redes que usan el protocolo IP esa dirección es la **dirección IP**.

En IPv4, la versión que vas a subnetear en este módulo, una dirección es un número de **32 bits**: treinta y dos cifras que solo pueden valer 0 o 1. Así la ve y la procesa cualquier equipo de red.`),
      p(`Treinta y dos ceros y unos seguidos son ilegibles para una persona, así que se escriben de otra manera: se cortan en cuatro grupos de 8 bits, cada grupo se convierte a un número decimal y los cuatro números se separan con puntos. Cada grupo de 8 bits se llama **octeto**, y esta forma de escribir se llama **notación decimal punteada**.`),
      tabla(['', '1.er octeto', '2.º octeto', '3.er octeto', '4.º octeto'], [
        ['Lo que ve el equipo', '11000000', '10101000', '00001010', '01001101'],
        ['Lo que escribimos', '192', '168', '10', '77'],
      ], 'La dirección `192.168.10.77` y sus 32 bits son exactamente lo mismo, escrito de dos formas.'),
      nota('clave', `Subnetear es trabajar con esos 32 bits. Todo lo que parece raro en decimal (¿por qué 255?, ¿por qué 192?, ¿por qué las subredes van de 64 en 64?) se vuelve obvio en binario. Por eso esta lección va primero.`),

      h('Los ocho pesos de un octeto'),
      p(`En decimal cada posición vale diez veces más que la de su derecha: unidades, decenas, centenas. En binario cada posición vale **el doble** que la de su derecha. En un octeto, de derecha a izquierda, las posiciones valen 1, 2, 4, 8, 16, 32, 64 y 128.`),
      tabla(['Posición', '1.ª', '2.ª', '3.ª', '4.ª', '5.ª', '6.ª', '7.ª', '8.ª'], [
        ['Potencia', '2^7', '2^6', '2^5', '2^4', '2^3', '2^2', '2^1', '2^0'],
        ['Peso', '128', '64', '32', '16', '8', '4', '2', '1'],
      ], 'Apréndete esta fila de pesos de memoria: **128, 64, 32, 16, 8, 4, 2, 1**. La vas a usar en cada ejercicio del módulo.'),
      p(`Un bit en 1 significa «este peso sí cuenta» y un bit en 0, «este no». El valor del octeto es la suma de los pesos que tienen un 1.

Con los ocho bits en 0 el octeto vale 0. Con los ocho en 1 vale 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = **255**. Por eso ningún número de una dirección IP puede pasar de 255: no hay más bits.`),

      h('De binario a decimal'),
      p(`Coloca cada bit debajo de su peso y suma solo los pesos que tengan un 1.`),
      ejemplo('facil', 'Un octeto con pocos unos', { tipo: 'bin-dec', n: 10 }),
      ejemplo('facil', 'El primer octeto de 172.16.0.0', { tipo: 'bin-dec', n: 172 }),
      ejemplo('medio', 'Unos seguidos a la izquierda', { tipo: 'bin-dec', n: 224 }, 'Fíjate en este patrón: unos seguidos pegados a la izquierda. Así son siempre los octetos de una máscara, y verás `224` muchas veces.'),

      h('De decimal a binario'),
      p(`Es el camino inverso. Recorre los pesos de izquierda a derecha, del 128 al 1, y en cada uno hazte la misma pregunta: **¿cabe este peso en lo que me queda?**`),
      orden(
        'Si cabe, escribe un **1** y réstalo de lo que te queda.',
        'Si no cabe, escribe un **0** y pasa al siguiente peso sin restar nada.',
        'Al llegar al peso 1 debes haber llegado a 0. Si no, hay un error en alguna resta.',
      ),
      ejemplo('facil', 'El 192 de las redes domésticas', { tipo: 'dec-bin', n: 192 }),
      ejemplo('medio', 'Un número con bits salteados', { tipo: 'dec-bin', n: 77 }),
      ejemplo('medio', 'Un número cercano al máximo', { tipo: 'dec-bin', n: 250 }),
      nota('truco', `Escribe siempre los **ocho** bits, con los ceros de la izquierda incluidos. El 10 es \`00001010\`, no \`1010\`. Si omites ceros, al juntar los cuatro octetos los bits quedan desplazados y todo el cálculo sale mal.`),

      h('Cuántas direcciones existen'),
      p(`Esta parte responde a una sola pregunta: **si tengo cierta cantidad de bits, ¿cuántos números distintos puedo escribir con ellos?** Vamos a verlo contando, empezando por lo más pequeño.`),

      h3('Con 1 bit'),
      p(`Un bit es como un interruptor de luz: solo tiene dos posiciones, apagado (\`0\`) o encendido (\`1\`). Con un solo bit puedes escribir **2** cosas distintas, y ninguna más.`),

      h3('Con 2 bits'),
      p(`Ahora tienes dos interruptores. El primero puede estar apagado o encendido, y por cada una de esas dos posiciones el segundo también puede estar apagado o encendido. Si las escribes todas, salen **4**:`),
      tabla(['Primer bit', 'Segundo bit', 'Combinación'], [
        ['0', '0', '`00`'], ['0', '1', '`01`'], ['1', '0', '`10`'], ['1', '1', '`11`'],
      ], 'No existe una quinta combinación: ya están todas.'),

      h3('Con 3 bits'),
      p(`Añade un tercer interruptor. Toma las 4 combinaciones de antes y escríbelas **dos veces**: una vez con un \`0\` delante y otra vez con un \`1\` delante. Salen 4 + 4 = **8**:`),
      tabla(['Con un 0 delante', 'Con un 1 delante'], [
        ['`0`00', '`1`00'], ['`0`01', '`1`01'], ['`0`10', '`1`10'], ['`0`11', '`1`11'],
      ], 'Las cuatro de la izquierda y las cuatro de la derecha son las mismas de antes; solo cambia el bit nuevo.'),

      h3('La regla: cada bit duplica'),
      p(`Ese es todo el secreto. **Cada vez que agregas un bit, la cantidad de combinaciones se multiplica por 2**, porque todas las que ya tenías se pueden repetir con el bit nuevo en 0 y con el bit nuevo en 1.`),
      tabla(['Bits', 'Cómo se calcula', 'Combinaciones'], [
        ['1', '2', '2'],
        ['2', '2 × 2', '4'],
        ['3', '2 × 2 × 2', '8'],
        ['4', '2 × 2 × 2 × 2', '16'],
        ['5', '2 × 2 × 2 × 2 × 2', '32'],
        ['6', '2 × 2 × 2 × 2 × 2 × 2', '64'],
        ['7', '2 × 2 × 2 × 2 × 2 × 2 × 2', '128'],
        ['8', '2 × 2 × 2 × 2 × 2 × 2 × 2 × 2', '256'],
      ], 'Cada fila es el doble de la anterior: 2, 4, 8, 16, 32, 64, 128, 256.'),

      h3('Cómo se escribe: 2^n'),
      p(`Escribir «2 × 2 × 2 × 2 × 2 × 2 × 2 × 2» es muy largo. En matemáticas se abrevia con una **potencia**: \`2^8\`, que se lee «dos elevado a la ocho» y significa «multiplica el 2 por sí mismo 8 veces». El número pequeño (el exponente) es simplemente **cuántos bits tienes**.`),
      formula('combinaciones = 2^n', [['2', 'porque cada bit solo tiene dos valores: 0 y 1'], ['n', 'la cantidad de bits que tienes']],
        'Ejemplos: 2^3 = 2 × 2 × 2 = 8.   2^5 = 2 × 2 × 2 × 2 × 2 = 32.   2^8 = 256.'),
      nota('truco', `No hace falta multiplicar cada vez. Apréndete la lista **2, 4, 8, 16, 32, 64, 128, 256, 512, 1,024** (son 2^1 hasta 2^10). Si se te olvida un valor, duplica el anterior: después de 64 viene 128, después de 128 viene 256.`),

      h3('Aplicado a un octeto'),
      p(`Un octeto tiene 8 bits, así que puede tomar 2^8 = **256** valores distintos. Como se empieza a contar desde el 0, esos 256 valores son del **0 al 255**. Por eso el número más grande que verás en una dirección IP es 255, y no 256: el 0 también cuenta como uno de los valores.`),

      h3('Aplicado a la dirección completa'),
      p(`Una dirección IPv4 tiene 32 bits. Aplicando la misma regla, existen 2^32 direcciones posibles:`),
      formula('2^32 = 4,294,967,296 direcciones', [], 'Otra forma de verlo: son 4 octetos y cada uno tiene 256 valores, así que 256 × 256 × 256 × 256 = 4,294,967,296. Un poco más de cuatro mil millones.'),
      nota('clave', `¿Por qué importa esto? Porque es **la cuenta que harás en todo el subneteo**. Siempre será la misma pregunta: «tengo tantos bits, ¿cuántas cosas distintas puedo numerar con ellos?». Si una red deja 8 bits para los equipos, caben 2^8 = 256 direcciones; si deja 6 bits, caben 2^6 = 64; si deja 4, caben 2^4 = 16. Menos bits, menos direcciones.`),

      ejercicios('Practica las conversiones', 'Escribe los ocho bits completos. Puedes separar el octeto en dos mitades con un espacio si te ayuda.', [
        { tipo: 'bin-dec', n: 5 }, { tipo: 'bin-dec', n: 128 }, { tipo: 'bin-dec', n: 240 }, { tipo: 'bin-dec', n: 99 }, { tipo: 'bin-dec', n: 201 }, { tipo: 'bin-dec', n: 254 },
        { tipo: 'dec-bin', n: 8 }, { tipo: 'dec-bin', n: 168 }, { tipo: 'dec-bin', n: 255 }, { tipo: 'dec-bin', n: 130 }, { tipo: 'dec-bin', n: 45 }, { tipo: 'dec-bin', n: 248 },
        op('¿Cuántos bits tiene una dirección IPv4 completa?', ['8', '16', '32', '64'], 2, 'Son cuatro octetos de 8 bits cada uno: 4 × 8 = 32 bits.'),
        op('¿Por qué `192.168.1.256` no es una dirección IPv4 válida?', ['Porque termina en un número par', 'Porque un octeto solo tiene 8 bits y su valor máximo es 255', 'Porque las direcciones que empiezan por 192 no pueden usar el cuarto octeto', 'Porque 256 está reservado para el broadcast'], 1, 'Con 8 bits el mayor valor es 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255. El 256 necesitaría un noveno bit.'),
        op('¿Cuántos valores distintos se pueden formar con 5 bits?', ['10', '25', '32', '64'], 2, 'Con n bits hay 2^n combinaciones: 2^5 = 32.'),
        op('¿Cuántas combinaciones distintas hay con 4 bits?', ['4', '8', '16', '32'], 2, '2^4 = 2 × 2 × 2 × 2 = 16. Van de `0000` a `1111`.'),
        op('Con 6 bits hay 64 combinaciones. ¿Cuántas habrá si agregas un bit más?', ['65', '70', '128', '256'], 2, 'Cada bit que se agrega duplica las combinaciones: 64 × 2 = 128, que es 2^7.'),
        op('Un octeto puede tomar 256 valores. ¿Por qué el mayor es 255 y no 256?', ['Porque el 256 está reservado', 'Porque se cuenta desde el 0: del 0 al 255 hay 256 valores', 'Porque un octeto solo tiene 7 bits útiles', 'Porque 255 es un número impar'], 1, 'Los 256 valores empiezan en 0. Contando el 0, el último es el 255.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 2 */
  {
    slug: 'clases-de-direcciones',
    titulo: 'Clases de direcciones: A, B, C, D y E',
    resumen: 'El reparto original de IPv4 en cinco clases, cómo reconocer cada una por su primer octeto, su máscara por defecto y los rangos privados.',
    nivel: 'facil',
    objetivos: [
      'Reconocer la clase de cualquier dirección mirando solo su primer octeto.',
      'Saber qué parte es red y qué parte es host en las clases A, B y C, y cuál es su máscara por defecto.',
      'Distinguir direcciones privadas, públicas, de loopback y de enlace local.',
    ],
    bloques: [
      h('Primero: toda dirección tiene dos partes'),
      p(`Piensa en un número de teléfono: \`55 1234 5678\`. Los primeros dígitos (\`55\`) son la clave de la ciudad, y el resto es el número de una casa dentro de esa ciudad. Todos los vecinos comparten la misma clave y cada uno tiene un número distinto.

Una dirección IP funciona igual. Tiene dos partes pegadas una a la otra:`),
      tabla(['Parte', 'Qué dice', 'En el teléfono sería…'], [
        ['**Parte de red** (la de la izquierda)', 'A qué red pertenece el equipo. Es **igual** en todos los equipos de esa red.', 'la clave de la ciudad'],
        ['**Parte de host** (la de la derecha)', 'Cuál equipo es dentro de esa red. Es **distinta** en cada equipo. «Host» significa equipo.', 'el número de la casa'],
      ]),
      p(`Mira tres computadoras de una misma oficina:`),
      tabla(['Equipo', 'Dirección', 'Parte de red', 'Parte de host'], [
        ['Computadora de Ana', '192.168.1.10', '192.168.1', '10'],
        ['Computadora de Luis', '192.168.1.11', '192.168.1', '11'],
        ['Impresora', '192.168.1.12', '192.168.1', '12'],
      ], 'Las tres empiezan igual (`192.168.1`): están en la misma red. Solo cambia el final, que identifica a cada equipo.'),

      h('La pregunta que responden las clases'),
      p(`Aquí está el problema: al ver una dirección como \`172.16.30.40\`, **¿dónde termina la parte de red y dónde empieza la de host?** ¿Después del primer número? ¿Del segundo? ¿Del tercero? La dirección sola no lo dice.

La primera solución que se inventó, en 1981, fue una regla muy simple: **mira el primer número de la dirección, y según su valor ya sabes dónde va el corte**. A cada grupo de valores se le llamó una **clase**.`),
      nota('clave', `Una clase es solo eso: una regla que dice «si la dirección empieza con un número de este rango, la parte de red ocupa tantos octetos». Nada más.`),

      h('Las tres clases que se usan: A, B y C'),
      h3('Clase A: el corte va después del primer número'),
      p(`Si el primer número está entre **0 y 127**, la dirección es de clase A. La parte de red es **solo el primer octeto**; los otros tres son de host.

Ejemplo: en \`10.20.30.40\`, la red es \`10\` y el equipo es el \`20.30.40\`. Como quedan tres octetos enteros para numerar equipos, una red de clase A es enorme: caben más de 16 millones.`),
      h3('Clase B: el corte va después del segundo número'),
      p(`Si el primer número está entre **128 y 191**, es de clase B. La parte de red son **los dos primeros octetos**; los otros dos son de host.

Ejemplo: en \`172.16.30.40\`, la red es \`172.16\` y el equipo es el \`30.40\`. Caben 65,534 equipos.`),
      h3('Clase C: el corte va después del tercer número'),
      p(`Si el primer número está entre **192 y 223**, es de clase C. La parte de red son **los tres primeros octetos**; solo el último es de host.

Ejemplo: en \`192.168.30.40\`, la red es \`192.168.30\` y el equipo es el \`40\`. Caben 254 equipos. Es la red típica de una casa o una oficina pequeña.`),
      bits([['Clase A', '10.20.30.40', 8], ['Clase B', '172.16.30.40', 16], ['Clase C', '192.168.30.40', 24]],
        'Las tres clases, vistas en bits. Lo azul es la parte de red y lo verde la parte de host. La raya blanca es el corte: en la A está después del primer octeto, en la B después del segundo y en la C después del tercero.'),
      tabla(['Clase', 'Si empieza con…', 'Parte de red', 'Parte de host', 'Ejemplo', 'Equipos que caben'], [
        ['A', '0 a 127', '1.er octeto', 'los 3 últimos', '`10`.20.30.40', '16,777,214'],
        ['B', '128 a 191', 'los 2 primeros', 'los 2 últimos', '`172.16`.30.40', '65,534'],
        ['C', '192 a 223', 'los 3 primeros', 'el último', '`192.168.30`.40', '254'],
      ], 'En la columna Ejemplo, lo resaltado es la parte de red.'),

      h('Qué significa el /8, el /16 y el /24'),
      p(`Verás muchas direcciones escritas con una barra y un número al final, como \`192.168.10.200/24\`. Ese número **no es parte de la dirección**: es una nota que dice **cuántos bits, contando desde la izquierda, son de red**. Se llama **prefijo**, y se lee «barra veinticuatro».

Recuerda de la lección anterior que cada octeto tiene 8 bits. Entonces:`),
      tabla(['Se escribe', 'Significa', 'Porque…', 'Es el corte de la clase'], [
        ['**/8**', 'los primeros 8 bits son de red: **el primer octeto**', '1 octeto × 8 bits = 8', 'A'],
        ['**/16**', 'los primeros 16 bits son de red: **los dos primeros octetos**', '2 octetos × 8 bits = 16', 'B'],
        ['**/24**', 'los primeros 24 bits son de red: **los tres primeros octetos**', '3 octetos × 8 bits = 24', 'C'],
      ]),
      p(`El mismo número de dirección se reparte de forma distinta según el prefijo que lleve. Mira \`192.168.10.200\` con dos prefijos diferentes:`),
      bits([['Con /24', '192.168.10.200', 24], ['Con /8', '192.168.10.200', 8]],
        'Con `/24`, la red es `192.168.10` y el equipo es el `200`. Con `/8`, la red es solo `192` y el equipo es el `168.10.200`. Los números son los mismos; lo que cambia es dónde está el corte.'),
      tabla(['Dirección', 'Parte de red', 'Parte de host', 'Equipos que caben en esa red'], [
        ['`192.168.10.200/24`', '192.168.10', '200', '254'],
        ['`192.168.10.200/16`', '192.168', '10.200', '65,534'],
        ['`192.168.10.200/8`', '192', '168.10.200', '16,777,214'],
      ]),
      nota('clave', `**Por qué hace falta escribir el prefijo.** Con las clases, el corte se deducía del primer número. Hoy ya no se deduce: cada red puede tener el corte donde le convenga, así que **siempre se escribe** junto a la dirección. Por eso casi nunca verás una dirección sola: la verás como \`192.168.10.200/24\`, o acompañada de su máscara.`),
      nota('truco', `**Dónde lo verás explicado a fondo.** El prefijo y la máscara son la misma información escrita de dos formas (\`/24\` es lo mismo que \`255.255.255.0\`). La lección siguiente, **La máscara de red y la notación CIDR**, lo explica paso a paso. Además, el prefijo no tiene que ser 8, 16 o 24: puede ser cualquier número, como /26 o /19, y entonces el corte cae **en medio** de un octeto. Eso es precisamente subnetear, y es de lo que trata el resto del módulo.`, 'Qué sigue'),

      h('Las clases D y E'),
      p(`Hay dos clases más, pero **no se asignan a equipos**, así que no tienen parte de red ni de host:`),
      tabla(['Clase', 'Si empieza con…', 'Para qué se usa'], [
        ['D', '224 a 239', 'Multidifusión (multicast): enviar lo mismo a un grupo de equipos a la vez, por ejemplo vídeo o avisos entre routers.'],
        ['E', '240 a 255', 'Reservada para pruebas. No la verás en una red normal.'],
      ]),

      h('Resumen de las cinco clases'),
      tabla(['Clase', 'Primer octeto', 'Parte de red', 'Prefijo', 'Máscara por defecto', 'Uso'], [
        ['A', '0 – 127', '1 octeto', '/8', '`255.0.0.0`', 'Redes enormes'],
        ['B', '128 – 191', '2 octetos', '/16', '`255.255.0.0`', 'Redes medianas y grandes'],
        ['C', '192 – 223', '3 octetos', '/24', '`255.255.255.0`', 'Redes pequeñas'],
        ['D', '224 – 239', '—', '—', 'no tiene', 'Multidifusión'],
        ['E', '240 – 255', '—', '—', 'no tiene', 'Reservada'],
      ], 'La «máscara por defecto» es otra forma de escribir el mismo corte: un 255 en cada octeto de red y un 0 en cada octeto de host. Se explica en la lección siguiente.'),
      nota('truco', `Para saber la clase solo hay que mirar **el primer número** y recordar tres fronteras: hasta **127** es A, hasta **191** es B, hasta **223** es C.`),

      h('De dónde salen 127, 191 y 223'),
      p(`Esta parte es para quien quiera el porqué; si solo necesitas reconocer la clase, basta con las tres fronteras de arriba.

Los límites no son arbitrarios: salen de los **primeros bits** del primer octeto. La clase A es toda dirección cuyo primer bit es 0; la B, las que empiezan por 10; la C, las que empiezan por 110. Al convertir esos patrones a decimal aparecen los rangos.`),
      tabla(['Clase', 'Primer octeto en binario', 'Valor mínimo', 'Valor máximo'], [
        ['A', '`0`xxxxxxx', '`00000000` = 0', '`01111111` = 127'],
        ['B', '`10`xxxxxx', '`10000000` = 128', '`10111111` = 191'],
        ['C', '`110`xxxxx', '`11000000` = 192', '`11011111` = 223'],
        ['D', '`1110`xxxx', '`11100000` = 224', '`11101111` = 239'],
        ['E', '`1111`xxxx', '`11110000` = 240', '`11111111` = 255'],
      ], 'Los bits marcados son fijos; las x pueden valer 0 o 1. El mínimo pone todas las x en 0 y el máximo, todas en 1.'),
      nota('truco', `Para memorizar los inicios: **128, 192, 224, 240**. Cada uno añade el siguiente peso: 128, luego 128 + 64, luego 128 + 64 + 32, luego 128 + 64 + 32 + 16. Son los mismos números que verás en las máscaras.`),

      h('Cuántas redes y cuántos hosts tiene cada clase'),
      p(`Aquí aparece otra vez la fórmula 2^n. Los bits de red que quedan libres (los que no son el prefijo fijo de la clase) dan el número de redes; los bits de host dan el número de equipos por red.`),
      tabla(['Clase', 'Bits de red libres', 'Redes', 'Bits de host', 'Hosts por red'], [
        ['A', '8 − 1 = 7', '2^7 = 128', '24', '2^24 − 2 = 16,777,214'],
        ['B', '16 − 2 = 14', '2^14 = 16,384', '16', '2^16 − 2 = 65,534'],
        ['C', '24 − 3 = 21', '2^21 = 2,097,152', '8', '2^8 − 2 = 254'],
      ], 'El «− 2» de los hosts se explica en la lección 4: en cada red hay dos direcciones que no se pueden asignar a equipos.'),
      p(`De las 128 redes de clase A, dos no se usan para equipos normales: la \`0.x.x.x\` significa «esta red» y la \`127.x.x.x\` es el **loopback**, que veremos enseguida. Por eso suele decirse que la clase A utilizable va de 1 a 126.`),
      nota('aviso', `El salto entre clases es brutal: una clase C da 254 equipos y la siguiente opción, una clase B, da 65,534. Una empresa con 500 equipos recibía una clase B y desperdiciaba más de 65,000 direcciones. Ese despilfarro es la razón por la que se inventó el subneteo, y más tarde, en 1993, el sistema sin clases (**CIDR**) que se usa hoy.`),

      h('Entonces, ¿las clases siguen importando?'),
      p(`Hoy los routers ya no deducen la máscara a partir de la clase: la máscara se indica siempre de forma explícita. Aun así las clases siguen siendo necesarias por tres motivos:`),
      lista(
        'Dan nombre a las **máscaras por defecto** (/8, /16 y /24), que son el punto de partida de casi todos los ejercicios de subneteo.',
        'Se siguen usando en el lenguaje diario: «una clase C» quiere decir «un /24».',
        'Aparecen en exámenes de certificación y en configuraciones antiguas.',
      ),
      ejemplo('facil', 'Una dirección doméstica', { tipo: 'clase', ip: '192.168.1.20' }),
      ejemplo('facil', 'Una dirección que empieza por 172', { tipo: 'clase', ip: '172.20.5.9' }),
      ejemplo('medio', 'Justo en una frontera', { tipo: 'clase', ip: '191.255.3.1' }, 'El 191 es el último valor de la clase B. Con un 192 ya sería clase C: en las fronteras conviene comprobar el rango con cuidado.'),

      h('Direcciones privadas y direcciones especiales'),
      p(`Dentro de las clases A, B y C se reservó un bloque para **uso privado**. Cualquiera puede usar esas direcciones dentro de su casa u oficina sin pedir permiso, pero no circulan por Internet: el router las traduce a una dirección pública al salir (eso es NAT).`),
      tabla(['Bloque privado', 'Rango', 'Viene de', 'Direcciones'], [
        ['`10.0.0.0/8`', '10.0.0.0 – 10.255.255.255', 'una red de clase A', '16,777,216'],
        ['`172.16.0.0/12`', '172.16.0.0 – 172.31.255.255', '16 redes de clase B seguidas', '1,048,576'],
        ['`192.168.0.0/16`', '192.168.0.0 – 192.168.255.255', '256 redes de clase C seguidas', '65,536'],
      ], 'Estos tres bloques están definidos en el documento RFC 1918.'),
      nota('error', `No toda dirección que empieza por 172 es privada. El bloque va solo de **172.16** a **172.31**. \`172.15.0.1\` y \`172.32.0.1\` son públicas. Lo mismo con 192: solo \`192.168.x.x\` es privada; \`192.169.0.1\` es pública.`),
      tabla(['Dirección o bloque', 'Nombre', 'Para qué sirve'], [
        ['`127.0.0.0/8`', 'Loopback', 'El equipo se habla a sí mismo. `127.0.0.1` es «yo mismo»; sirve para probar servicios sin salir a la red.'],
        ['`169.254.0.0/16`', 'Enlace local (APIPA)', 'Un equipo se la asigna solo cuando pide dirección por DHCP y nadie responde. Si la ves, el DHCP está fallando.'],
        ['`0.0.0.0`', 'Sin especificar', '«Todavía no tengo dirección» o, en una tabla de rutas, «cualquier destino».'],
        ['`255.255.255.255`', 'Broadcast limitado', 'Llega a todos los equipos de la red local y no cruza routers.'],
      ]),
      ejemplo('facil', 'Un bloque privado clásico', { tipo: 'privada', ip: '10.200.3.4' }),
      ejemplo('medio', 'La trampa del 172', { tipo: 'privada', ip: '172.32.10.1' }),
      ejemplo('medio', 'Una dirección que delata un fallo', { tipo: 'privada', ip: '169.254.18.7' }),

      ejercicios('Practica', 'Mira solo el primer octeto para la clase, y compara con los tres bloques privados para el tipo.', [
        { tipo: 'clase', ip: '10.1.1.1' }, { tipo: 'clase', ip: '128.0.0.1' }, { tipo: 'clase', ip: '200.33.146.5' }, { tipo: 'clase', ip: '224.0.0.5' },
        { tipo: 'clase', ip: '126.255.255.254' }, { tipo: 'clase', ip: '223.1.2.3' }, { tipo: 'clase', ip: '245.10.10.10' },
        { tipo: 'privada', ip: '192.168.100.14' }, { tipo: 'privada', ip: '172.31.255.1' }, { tipo: 'privada', ip: '172.15.0.9' },
        { tipo: 'privada', ip: '8.8.8.8' }, { tipo: 'privada', ip: '127.0.0.1' }, { tipo: 'privada', ip: '192.169.1.1' },
        op('¿Cuál es la máscara por defecto de una dirección de clase B?', ['`255.0.0.0`', '`255.255.0.0`', '`255.255.255.0`', '`255.255.255.255`'], 1, 'En la clase B los dos primeros octetos son de red: 16 bits en 1, es decir `255.255.0.0` o /16.'),
        op('Una red de clase C sin subnetear, ¿cuántos equipos admite?', ['256', '255', '254', '128'], 2, 'Tiene 8 bits de host: 2^8 = 256 direcciones, menos la de red y la de broadcast: 254.'),
        op('Un equipo muestra la dirección `169.254.7.33`. ¿Qué indica?', ['Que está conectado a Internet con una IP pública', 'Que no obtuvo dirección de un servidor DHCP y se asignó una él mismo', 'Que es un servidor', 'Que usa una red de clase A'], 1, 'El bloque `169.254.0.0/16` es de autoconfiguración: el equipo se lo asigna cuando el DHCP no responde.'),
        op('¿Qué indica el `/16` en `172.16.30.40/16`?', ['Que la red tiene 16 equipos', 'Que los primeros 16 bits (los dos primeros octetos) son la parte de red', 'Que la dirección es la número 16 de la red', 'Que el último octeto vale 16'], 1, 'El número tras la barra es el prefijo: cuántos bits, desde la izquierda, son de red. 16 bits son dos octetos: la red es `172.16`.'),
        op('En `192.168.10.200/24`, ¿cuál es la parte de host?', ['192', '168.10.200', '10.200', '200'], 3, '/24 significa que los tres primeros octetos (24 bits) son de red: `192.168.10`. Lo que queda, el `200`, identifica al equipo.'),
        op('En `10.20.30.40/8`, ¿cuál es la parte de red?', ['10', '10.20', '10.20.30', '40'], 0, '/8 significa que solo el primer octeto (8 bits) es de red. El resto, `20.30.40`, es el equipo.'),
        op('Dos equipos tienen `192.168.5.10/24` y `192.168.5.77/24`. ¿Están en la misma red?', ['Sí: los dos tienen la misma parte de red, `192.168.5`', 'No: el último número es distinto', 'No: una es par y la otra impar', 'Solo si tienen la misma clase'], 0, 'Con /24 la parte de red son los tres primeros octetos, y en los dos es `192.168.5`. El último número distinto solo indica que son equipos diferentes.'),
        op('¿Por qué `11.0.0.1` es pública y `10.0.0.1` es privada si las dos son de clase A?', ['Porque la clase A entera es privada y 11 es una excepción', 'Porque solo el bloque `10.0.0.0/8` fue reservado para uso privado', 'Porque las direcciones impares son públicas', 'Porque 11 pertenece a la clase B'], 1, 'Ser de clase A no hace privada a una dirección. De toda la clase A, solo la red 10 está reservada para uso privado.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 3 */
  {
    slug: 'la-mascara-de-red',
    titulo: 'La máscara de red y la notación CIDR',
    resumen: 'Qué es la máscara, cómo separa red y host bit a bit con la operación AND, los nueve valores posibles de un octeto y la notación /n.',
    nivel: 'facil',
    objetivos: [
      'Explicar qué hace la máscara y por qué sus unos siempre van seguidos.',
      'Obtener la dirección de red aplicando AND entre la IP y la máscara.',
      'Pasar de prefijo a máscara y de máscara a prefijo sin tabla.',
    ],
    bloques: [
      h('El problema: la IP sola no dice dónde termina la red'),
      p(`Mira la dirección \`172.16.45.200\`. ¿Cuál es su parte de red? Con las clases diríamos «clase B: los dos primeros octetos». Pero en una red real esa misma dirección puede pertenecer a una red de 65,000 equipos, a una de 4,000 o a una de 6. La dirección sola no lo dice.

Hace falta un segundo dato que marque la frontera entre red y host. Ese dato es la **máscara de red**.`),

      h('Qué es la máscara'),
      p(`La máscara es otro número de 32 bits que se coloca «encima» de la dirección IP, bit con bit, y funciona como una plantilla:`),
      lista(
        'Donde la máscara tiene un **1**, ese bit de la IP pertenece a la **red**.',
        'Donde la máscara tiene un **0**, ese bit de la IP pertenece al **host**.',
      ),
      bits([['IP', '192.168.10.77', 24], ['Máscara', '255.255.255.0', 24]],
        'La máscara `255.255.255.0` tiene 24 unos y 8 ceros: los primeros 24 bits de la IP son red y los últimos 8 son host.'),
      p(`Hay una regla que la máscara cumple siempre: **los unos van todos seguidos a la izquierda y los ceros todos seguidos a la derecha**. Nunca se mezclan. Tiene sentido: la red es la parte izquierda de la dirección y el host la derecha, con un único corte entre las dos.`),
      nota('clave', `Por eso una máscara queda definida por un solo número: **cuántos unos tiene**. Ese número es el prefijo, y es lo que mueve la frontera en la regla de bits de la portada.`),

      h('La máscara por defecto de cada clase'),
      p(`Cuando una red de clase A, B o C se usa entera, sin dividir, su máscara es la **máscara por defecto** (también llamada máscara natural o máscara de red). Simplemente marca con unos los octetos que la clase asigna a la red.`),
      tabla(['Clase', 'Máscara por defecto', 'En binario', 'Unos'], [
        ['A', '`255.0.0.0`', '11111111.00000000.00000000.00000000', '8'],
        ['B', '`255.255.0.0`', '11111111.11111111.00000000.00000000', '16'],
        ['C', '`255.255.255.0`', '11111111.11111111.11111111.00000000', '24'],
      ]),
      p(`Cuando la red se divide en subredes, la máscara se alarga con más unos y pasa a llamarse **máscara de subred**. Es el mismo mecanismo con el corte más a la derecha; lo verás a fondo en la lección 5. En la práctica mucha gente dice «máscara de subred» para cualquier máscara, y no pasa nada.`),

      h('Cómo usa el equipo la máscara: la operación AND'),
      p(`Para saber a qué red pertenece una dirección, el equipo hace una operación lógica llamada **AND** entre cada bit de la IP y el bit de la máscara que tiene debajo. La regla del AND es muy simple: el resultado es 1 **solo si los dos bits son 1**.`),
      tabla(['Bit de la IP', 'Bit de la máscara', 'Resultado (AND)', 'Qué significa'], [
        ['0', '1', '0', 'La máscara deja pasar el bit de la IP'],
        ['1', '1', '1', 'La máscara deja pasar el bit de la IP'],
        ['0', '0', '0', 'La máscara lo borra'],
        ['1', '0', '0', 'La máscara lo borra'],
      ]),
      p(`Dicho de otra forma: donde la máscara tiene 1, el bit de la IP **se copia** tal cual; donde tiene 0, el resultado **es 0**. Lo que queda después del AND es la **dirección de red**: la parte de red intacta y la parte de host puesta a cero.`),
      tabla(['', '1.er octeto', '2.º octeto', '3.er octeto', '4.º octeto', 'Decimal'], [
        ['IP', '11000000', '10101000', '00001010', '01001101', '192.168.10.77'],
        ['Máscara', '11111111', '11111111', '11111111', '00000000', '255.255.255.0'],
        ['AND = red', '11000000', '10101000', '00001010', '00000000', '**192.168.10.0**'],
      ], 'Los tres primeros octetos se copian (la máscara vale 255 = todo unos) y el cuarto se borra (la máscara vale 0).'),
      nota('truco', `En decimal: donde la máscara vale **255**, copia el octeto de la IP; donde vale **0**, escribe 0. Solo cuando la máscara tiene otro valor (128, 192, 224…) hay que pensar un poco más, y para eso está el número mágico de la lección 6.`),
      p(`El equipo usa este resultado constantemente. Antes de enviar un paquete calcula su propia red y la red del destino. Si coinciden, entrega el paquete directamente; si no, se lo manda al router (la puerta de enlace). Una máscara mal puesta hace que el equipo crea que un vecino está lejos, o que un equipo lejano está al lado.`),

      h('La notación CIDR: /n'),
      p(`Escribir \`255.255.255.0\` cada vez es largo. Como la máscara son unos seguidos, basta con decir cuántos hay. Eso es la **notación CIDR** o de prefijo: una barra y el número de bits en 1.`),
      tabla(['Notación larga', 'Notación CIDR', 'Se lee'], [
        ['192.168.10.77 con máscara 255.255.255.0', '`192.168.10.77/24`', '«barra veinticuatro»'],
        ['172.16.45.200 con máscara 255.255.0.0', '`172.16.45.200/16`', '«barra dieciséis»'],
        ['10.1.2.3 con máscara 255.0.0.0', '`10.1.2.3/8`', '«barra ocho»'],
      ]),
      formula('bits de host = 32 − prefijo', [['prefijo', 'bits de red (los unos de la máscara)'], ['32', 'bits totales de una dirección IPv4']],
        'Un /24 tiene 24 bits de red y 8 de host. Un /26 tiene 26 de red y 6 de host.'),

      h('Los nueve valores de un octeto de máscara'),
      p(`Como los unos entran siempre por la izquierda, un octeto de máscara solo puede tener 0, 1, 2… hasta 8 unos seguidos. Eso da **nueve valores posibles**, y ninguno más. Una máscara con un 200 o un 250 no existe.`),
      tabla(['Unos en el octeto', 'Binario', 'Cómo se suma', 'Decimal'], [
        ['0', '00000000', '—', '**0**'],
        ['1', '10000000', '128', '**128**'],
        ['2', '11000000', '128 + 64', '**192**'],
        ['3', '11100000', '128 + 64 + 32', '**224**'],
        ['4', '11110000', '128 + 64 + 32 + 16', '**240**'],
        ['5', '11111000', '128 + 64 + 32 + 16 + 8', '**248**'],
        ['6', '11111100', '128 + 64 + 32 + 16 + 8 + 4', '**252**'],
        ['7', '11111110', '128 + 64 + 32 + 16 + 8 + 4 + 2', '**254**'],
        ['8', '11111111', '128 + 64 + 32 + 16 + 8 + 4 + 2 + 1', '**255**'],
      ], 'Memoriza la columna decimal: 128, 192, 224, 240, 248, 252, 254, 255. Cada valor suma el siguiente peso.'),

      h('De prefijo a máscara'),
      orden(
        'Divide el prefijo entre 8. El cociente dice cuántos octetos valen **255**.',
        'El resto dice cuántos unos hay en el siguiente octeto: busca su valor en la tabla de los nueve valores.',
        'Los octetos que queden valen **0**.',
      ),
      ejemplo('facil', 'Un prefijo que cae justo entre octetos', { tipo: 'prefijo-mascara', p: 16 }),
      ejemplo('medio', 'Dos bits más allá del tercer octeto', { tipo: 'prefijo-mascara', p: 26 }),
      ejemplo('medio', 'El corte en el tercer octeto', { tipo: 'prefijo-mascara', p: 20 }),
      ejemplo('dificil', 'El corte en el segundo octeto', { tipo: 'prefijo-mascara', p: 13 }),

      h('De máscara a prefijo'),
      p(`Al revés: cuenta los unos. Cada 255 aporta 8, y el octeto parcial aporta lo que diga la tabla.`),
      ejemplo('facil', 'Una máscara muy común', { tipo: 'mascara-prefijo', p: 24 }),
      ejemplo('medio', 'Una máscara con octeto parcial', { tipo: 'mascara-prefijo', p: 27 }),
      ejemplo('dificil', 'Una máscara corta', { tipo: 'mascara-prefijo', p: 11 }),

      ejercicios('Practica', 'Intenta hacerlos sin mirar la tabla: suma los pesos 128, 64, 32… mentalmente.', [
        { tipo: 'prefijo-mascara', p: 8 }, { tipo: 'prefijo-mascara', p: 24 }, { tipo: 'prefijo-mascara', p: 25 }, { tipo: 'prefijo-mascara', p: 28 },
        { tipo: 'prefijo-mascara', p: 30 }, { tipo: 'prefijo-mascara', p: 22 }, { tipo: 'prefijo-mascara', p: 18 }, { tipo: 'prefijo-mascara', p: 12 },
        { tipo: 'mascara-prefijo', p: 16 }, { tipo: 'mascara-prefijo', p: 26 }, { tipo: 'mascara-prefijo', p: 29 }, { tipo: 'mascara-prefijo', p: 23 },
        { tipo: 'mascara-prefijo', p: 19 }, { tipo: 'mascara-prefijo', p: 14 },
        op('¿Cuál de estas NO puede ser una máscara de red?', ['`255.255.255.192`', '`255.255.240.0`', '`255.255.255.200`', '`255.254.0.0`'], 2, '200 es `11001000`: tiene un 0 entre unos. En una máscara los unos van todos seguidos, así que un octeto solo puede valer 0, 128, 192, 224, 240, 248, 252, 254 o 255.'),
        op('Si haces AND entre `10.50.60.70` y la máscara `255.255.0.0`, ¿qué obtienes?', ['`10.50.60.70`', '`10.50.0.0`', '`10.0.0.0`', '`255.255.60.70`'], 1, 'Donde la máscara vale 255 se copia el octeto (10 y 50) y donde vale 0 el resultado es 0. Queda la dirección de red `10.50.0.0`.'),
        op('En un AND, ¿cuándo el resultado es 1?', ['Cuando al menos uno de los dos bits es 1', 'Solo cuando los dos bits son 1', 'Cuando los dos bits son iguales', 'Cuando el bit de la máscara es 0'], 1, 'AND da 1 únicamente si los dos bits son 1. Por eso un 0 en la máscara borra el bit de la IP y un 1 lo deja pasar.'),
        op('¿Cuántos bits de host tiene una dirección con prefijo /27?', ['27', '8', '5', '3'], 2, 'Bits de host = 32 − prefijo = 32 − 27 = 5.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 4 */
  {
    slug: 'red-broadcast-y-hosts',
    titulo: 'Dirección de red, broadcast y hosts: las fórmulas',
    resumen: 'Las dos direcciones reservadas de toda red, el rango asignable y la fórmula 2^h − 2 para saber cuántos equipos caben.',
    nivel: 'facil',
    objetivos: [
      'Identificar la dirección de red y la de broadcast de una red cuyo corte cae entre octetos.',
      'Calcular cuántas direcciones y cuántos hosts tiene cualquier prefijo con 2^h y 2^h − 2.',
      'Dar el primer y el último host asignable.',
    ],
    bloques: [
      h('Las dos direcciones que nadie puede usar'),
      p(`Dentro de una red, la parte de host puede tomar muchos valores. Dos de ellos están reservados y **no se pueden asignar a ningún equipo**:`),
      tabla(['Dirección', 'Bits de host', 'Para qué sirve'], [
        ['**Dirección de red**', 'todos en **0**', 'Es el nombre de la red. Aparece en las tablas de rutas y en la documentación. Es la primera dirección del bloque.'],
        ['**Dirección de broadcast**', 'todos en **1**', 'Un paquete enviado a ella llega a todos los equipos de la red. Es la última dirección del bloque.'],
      ]),
      p(`Todo lo que hay entre las dos es el **rango asignable**: las direcciones que sí pueden ponerse a computadoras, impresoras, teléfonos o routers.`),
      bits([['Red', '192.168.10.0', 24], ['Primer host', '192.168.10.1', 24], ['Último host', '192.168.10.254', 24], ['Broadcast', '192.168.10.255', 24]],
        'En `192.168.10.0/24` la parte de red (azul) no cambia nunca. La parte de host va de todo ceros a todo unos.'),

      h('La fórmula de los hosts'),
      p(`Si una red tiene **h** bits de host, esos bits pueden formar 2^h combinaciones. Ese es el tamaño total del bloque. Quitando las dos reservadas quedan los equipos que realmente caben.`),
      formula('direcciones totales = 2^h', [['h', 'bits de host = 32 − prefijo']]),
      formula('hosts asignables = 2^h − 2', [['2^h', 'todas las combinaciones de los bits de host'], ['− 2', 'la dirección de red (todo 0) y la de broadcast (todo 1)']],
        'Esta es la fórmula que más vas a usar en todo el módulo.'),
      tabla(['Prefijo', 'Bits de host (h)', '2^h', 'Hosts (2^h − 2)'], [
        ['/30', '2', '4', '2'], ['/29', '3', '8', '6'], ['/28', '4', '16', '14'], ['/27', '5', '32', '30'],
        ['/26', '6', '64', '62'], ['/25', '7', '128', '126'], ['/24', '8', '256', '254'], ['/23', '9', '512', '510'],
        ['/22', '10', '1,024', '1,022'], ['/20', '12', '4,096', '4,094'], ['/16', '16', '65,536', '65,534'], ['/8', '24', '16,777,216', '16,777,214'],
      ], 'Cada bit de host que se añade duplica el tamaño del bloque. Cada bit que se quita lo reduce a la mitad.'),
      nota('error', `El error más común es olvidar el «− 2» o restarlo donde no toca. Regla fija: el **tamaño del bloque** es 2^h (sin restar); los **equipos que caben** son 2^h − 2.`),
      ejemplo('facil', 'Cuántos equipos caben en un /24', { tipo: 'hosts-prefijo', p: 24 }),
      ejemplo('facil', 'Un bloque pequeño', { tipo: 'hosts-prefijo', p: 28 }),
      ejemplo('medio', 'Un bloque grande', { tipo: 'hosts-prefijo', p: 21 }),

      h('Calcular red, broadcast y rango cuando el corte cae entre octetos'),
      p(`Con /8, /16 y /24 la máscara solo tiene 255 y 0, así que no hay nada que calcular en binario:`),
      orden(
        '**Red:** copia los octetos donde la máscara vale 255 y pon **0** en los demás.',
        '**Broadcast:** copia los mismos octetos y pon **255** en los demás.',
        '**Primer host:** la dirección de red más 1.',
        '**Último host:** la dirección de broadcast menos 1.',
      ),
      ejemplo('facil', 'Una red de clase C completa', an('192.168.10.77', 24)),
      ejemplo('facil', 'Una red de clase B completa', an('172.16.45.200', 16), 'Aquí la parte de host son dos octetos, así que el broadcast termina en `255.255` y el último host en `255.254`.'),
      ejemplo('medio', 'Una red de clase A completa', an('10.99.3.250', 8)),
      nota('aviso', `En redes grandes hay direcciones de host que terminan en 0 o en 255 y son perfectamente válidas. En \`172.16.0.0/16\`, la dirección \`172.16.5.0\` es un host normal: sus 16 bits de host no son todos 0. Lo que define a la red y al broadcast son **todos** los bits de host, no solo el último octeto.`),

      h('Dos casos especiales: /31 y /32'),
      p(`Con /31 solo queda 1 bit de host: 2 direcciones, y 2 − 2 = 0 equipos. Parecería inútil, pero en un enlace directo entre dos routers no hace falta ni dirección de red ni broadcast, así que se permite usar las dos (norma RFC 3021). Con /32 no queda ningún bit de host: la «red» es un único equipo, y se usa para identificar una máquina concreta en rutas y reglas de firewall.

En el resto del módulo, salvo que se diga lo contrario, la subred más pequeña para equipos normales es **/30**, con 2 hosts.`),

      ejercicios('Practica', 'En los primeros solo aplica la fórmula. En los últimos, recuerda: octetos de host a 0 para la red y a 255 para el broadcast.', [
        { tipo: 'hosts-prefijo', p: 30 }, { tipo: 'hosts-prefijo', p: 27 }, { tipo: 'hosts-prefijo', p: 26 }, { tipo: 'hosts-prefijo', p: 25 },
        { tipo: 'hosts-prefijo', p: 23 }, { tipo: 'hosts-prefijo', p: 22 }, { tipo: 'hosts-prefijo', p: 19 }, { tipo: 'hosts-prefijo', p: 16 },
        an('192.168.1.50', 24), an('192.168.200.199', 24), an('172.30.8.15', 16), an('172.16.255.1', 16), an('10.0.0.25', 8), an('10.255.0.255', 8),
        op('¿Por qué se restan 2 direcciones al calcular los hosts?', ['Por el router y el servidor DHCP', 'Por la dirección de red y la de broadcast', 'Por la IP `0.0.0.0` y la `127.0.0.1`', 'Porque dos bits siempre se pierden'], 1, 'En toda red, la combinación con todos los bits de host en 0 es la dirección de red, y la que tiene todos en 1 es el broadcast. Ninguna de las dos se asigna a un equipo.'),
        op('En la red `172.16.0.0/16`, ¿la dirección `172.16.3.255` se puede asignar a un equipo?', ['No, porque termina en 255', 'Sí, porque sus 16 bits de host no son todos 1', 'No, porque es el broadcast', 'Solo si el equipo es un router'], 1, 'El broadcast de esa red es `172.16.255.255` (los 16 bits de host en 1). `172.16.3.255` tiene el tercer octeto en 3, así que es un host normal.'),
        op('Si a una red le quitas un bit de host (el prefijo crece en 1), su tamaño…', ['se duplica', 'se reduce a la mitad', 'disminuye en 2', 'no cambia'], 1, 'Cada bit de host duplica las combinaciones. Quitar uno deja la mitad: de 2^h a 2^(h−1).'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 5 */
  {
    slug: 'que-es-subnetear',
    titulo: 'Subnetear: la máscara de subred y los bits prestados',
    resumen: 'Por qué se divide una red, cómo se alarga la máscara tomando bits del host y las dos fórmulas que gobiernan el reparto.',
    nivel: 'medio',
    objetivos: [
      'Explicar qué problema resuelve dividir una red en subredes.',
      'Ver una dirección en tres partes: red, subred y host.',
      'Calcular cuántas subredes y cuántos hosts resultan al prestar s bits.',
    ],
    bloques: [
      h('Por qué dividir una red'),
      p(`Imagina una empresa con la red \`192.168.1.0/24\` y 200 equipos de cuatro departamentos conectados todos juntos. Funciona, pero tiene problemas:`),
      lista(
        '**Ruido.** Cada broadcast (y los equipos emiten muchos) llega a los 200 equipos. Cuantos más equipos comparten red, más tráfico inútil recibe cada uno.',
        '**Seguridad.** Todos se ven con todos. El equipo de un visitante alcanza directamente el servidor de nóminas.',
        '**Orden.** No hay forma de aplicar reglas distintas por departamento ni de localizar rápido un problema.',
        '**Desperdicio.** Un enlace entre dos routers solo necesita 2 direcciones; darle un /24 entero tira 252.',
      ),
      p(`La solución es **subnetear**: partir una red grande en varias redes más pequeñas, llamadas **subredes**. Cada subred es una red independiente, con su propia dirección de red, su broadcast y su rango. Para pasar de una subred a otra hace falta un router, y ahí es donde se ponen las reglas.`),

      h('La idea: pedirle bits prestados al host'),
      p(`La parte de red no se puede tocar: es la que te asignaron. Lo único que controlas es la parte de host. Subnetear consiste en **tomar algunos bits de la izquierda de la parte de host y usarlos para numerar subredes**. Se dice que esos bits se «prestan».

La dirección pasa de tener dos partes a tener tres:`),
      bits([['Antes', '192.168.1.77', 24], ['Después', '192.168.1.77', 26, 24]],
        'Arriba, la red original /24. Abajo, la misma dirección con 2 bits prestados (ámbar): el prefijo pasa de /24 a /26.'),
      tabla(['Parte', 'Quién la decide', 'Qué identifica'], [
        ['**Red** (azul)', 'Quien te asignó el bloque', 'La red original. No cambia.'],
        ['**Subred** (ámbar)', 'Tú, al elegir cuántos bits prestar', 'Cuál de las subredes es.'],
        ['**Host** (verde)', 'Lo que sobra', 'El equipo dentro de la subred.'],
      ]),

      h('La máscara de subred'),
      p(`Para un equipo, los bits de subred son simplemente más bits de red. Así que la máscara se alarga: los bits prestados pasan de 0 a 1. La máscara resultante es la **máscara de subred**.`),
      tabla(['', 'Máscara en binario', 'Decimal', 'Prefijo'], [
        ['Máscara por defecto (clase C)', '11111111.11111111.11111111.`00`000000', '255.255.255.0', '/24'],
        ['Máscara de subred (2 bits prestados)', '11111111.11111111.11111111.`11`000000', '255.255.255.192', '/26'],
      ], 'Los dos bits marcados son los prestados. En decimal, 128 + 64 = 192.'),
      formula('prefijo nuevo = prefijo original + bits prestados', [['bits prestados (s)', 'los que pasan de host a subred']],
        'De /24 con 2 bits prestados se pasa a /26. De /16 con 4 bits prestados, a /20.'),

      h('Las dos fórmulas del subneteo'),
      p(`Cada bit que prestas tiene un efecto doble: duplica el número de subredes y reduce a la mitad el tamaño de cada una. No se puede ganar en un lado sin perder en el otro.`),
      formula('subredes = 2^s', [['s', 'bits prestados = prefijo nuevo − prefijo original']]),
      formula('hosts por subred = 2^h − 2', [['h', 'bits de host que quedan = 32 − prefijo nuevo']]),
      p(`Con dos bits prestados se forman 2^2 = 4 combinaciones (00, 01, 10 y 11), así que salen 4 subredes. Quedan 6 bits de host: 2^6 − 2 = 62 equipos en cada una.`),
      tabla(['Bits de subred', 'Subred', 'Rango asignable', 'Broadcast'], [
        ['`00`', '192.168.1.0/26', '192.168.1.1 – 192.168.1.62', '192.168.1.63'],
        ['`01`', '192.168.1.64/26', '192.168.1.65 – 192.168.1.126', '192.168.1.127'],
        ['`10`', '192.168.1.128/26', '192.168.1.129 – 192.168.1.190', '192.168.1.191'],
        ['`11`', '192.168.1.192/26', '192.168.1.193 – 192.168.1.254', '192.168.1.255'],
      ], 'Las cuatro subredes de `192.168.1.0/24` con máscara /26. Van de 64 en 64 porque cada una ocupa 2^6 = 64 direcciones.'),
      bits([['Subred 00', '192.168.1.0', 26, 24], ['Subred 01', '192.168.1.64', 26, 24], ['Subred 10', '192.168.1.128', 26, 24], ['Subred 11', '192.168.1.192', 26, 24]],
        'Lo único que cambia de una subred a la siguiente son los bits ámbar: 00, 01, 10, 11. Así se «cuentan» las subredes.'),

      h('Todo lo que puedes hacer con un /24'),
      tabla(['Bits prestados (s)', 'Prefijo', 'Máscara de subred', 'Subredes (2^s)', 'Bits de host (h)', 'Hosts por subred (2^h − 2)'], [
        ['1', '/25', '255.255.255.128', '2', '7', '126'],
        ['2', '/26', '255.255.255.192', '4', '6', '62'],
        ['3', '/27', '255.255.255.224', '8', '5', '30'],
        ['4', '/28', '255.255.255.240', '16', '4', '14'],
        ['5', '/29', '255.255.255.248', '32', '3', '6'],
        ['6', '/30', '255.255.255.252', '64', '2', '2'],
      ], 'De arriba abajo: las subredes se duplican y los hosts se reducen a la mitad (aproximadamente).'),
      nota('clave', `Fíjate en el total de direcciones: subredes × tamaño del bloque da siempre 256. Subnetear no crea ni destruye direcciones; solo las reparte. Lo que sí se «gasta» son 2 direcciones por cada subred (su red y su broadcast): con 4 subredes de 62 hosts hay 248 equipos posibles en lugar de 254.`),
      nota('aviso', `En libros y exámenes antiguos verás la fórmula **2^s − 2** para las subredes. Antes no se permitía usar la primera subred (todos los bits de subred en 0, «subred cero») ni la última. Esa restricción desapareció hace décadas: hoy se usan todas, y la fórmula correcta es **2^s**. Si un examen pide explícitamente «sin usar la subred cero», resta 2.`, 'Sobre la fórmula antigua'),

      ejemplo('facil', 'Partir un /24 en dos mitades', { tipo: 'subredes-prestadas', p0: 24, p1: 25 }),
      ejemplo('medio', 'Tres bits prestados', { tipo: 'subredes-prestadas', p0: 24, p1: 27 }),
      ejemplo('medio', 'Una clase B dividida en redes tamaño clase C', { tipo: 'subredes-prestadas', p0: 16, p1: 24 }, 'Es el subneteo más cómodo que existe: el corte cae justo entre octetos y el tercer octeto hace de «número de subred».'),
      ejemplo('dificil', 'Una clase A con muchos bits prestados', { tipo: 'subredes-prestadas', p0: 8, p1: 22 }),

      ejercicios('Practica', 'Tres cuentas por ejercicio: bits prestados (resta de prefijos), subredes (2^s) y hosts (2^h − 2).', [
        { tipo: 'subredes-prestadas', p0: 24, p1: 26 }, { tipo: 'subredes-prestadas', p0: 24, p1: 28 }, { tipo: 'subredes-prestadas', p0: 24, p1: 30 },
        { tipo: 'subredes-prestadas', p0: 24, p1: 29 }, { tipo: 'subredes-prestadas', p0: 16, p1: 20 }, { tipo: 'subredes-prestadas', p0: 16, p1: 18 },
        { tipo: 'subredes-prestadas', p0: 16, p1: 26 }, { tipo: 'subredes-prestadas', p0: 8, p1: 16 }, { tipo: 'subredes-prestadas', p0: 8, p1: 12 },
        { tipo: 'subredes-prestadas', p0: 20, p1: 24 }, { tipo: 'subredes-prestadas', p0: 22, p1: 27 }, { tipo: 'subredes-prestadas', p0: 8, p1: 30 },
        op('Al subnetear, ¿de qué parte de la dirección se toman los bits?', ['De la parte de red, por la derecha', 'De la parte de host, por la izquierda', 'De la parte de host, por la derecha', 'Del primer octeto'], 1, 'La parte de red no se puede modificar. Se toman los bits más a la izquierda de la parte de host, pegados a la red, para que la máscara siga teniendo todos sus unos seguidos.'),
        op('Tienes un /24 y necesitas subredes de al menos 50 equipos. ¿Cuántos bits puedes prestar como máximo?', ['1', '2', '3', '4'], 1, 'Con 2 bits prestados quedan 6 de host: 2^6 − 2 = 62 equipos, suficiente. Con 3 prestados quedarían 5 de host: solo 30 equipos.'),
        op('Si prestas un bit más del que tenías, ¿qué ocurre?', ['El doble de subredes y cada una con el doble de hosts', 'El doble de subredes y cada una con la mitad de direcciones', 'La mitad de subredes y el doble de hosts', 'Nada: solo cambia la máscara'], 1, 'Cada bit prestado duplica las subredes (2^s) y, al quitar un bit de host, deja cada bloque en la mitad (2^h).'),
        op('¿Qué máscara de subred corresponde a una red de clase C con 4 bits prestados?', ['`255.255.255.192`', '`255.255.255.224`', '`255.255.255.240`', '`255.255.240.0`'], 2, '/24 + 4 = /28. Cuatro unos en el cuarto octeto: 128 + 64 + 32 + 16 = 240.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 6 */
  {
    slug: 'el-numero-magico',
    titulo: 'El número mágico: red y broadcast sin pasar a binario',
    resumen: 'El método rápido para encontrar la subred de cualquier dirección: 256 menos el octeto de la máscara y contar múltiplos.',
    nivel: 'medio',
    objetivos: [
      'Calcular el tamaño de bloque (número mágico) de cualquier máscara.',
      'Encontrar la red, el broadcast y el rango de una dirección con prefijo /25 a /30 en segundos.',
      'Saber si una dirección concreta es red, broadcast o host válido.',
    ],
    bloques: [
      h('De dónde sale el número mágico'),
      p(`En la lección anterior las subredes /26 empezaban en 0, 64, 128 y 192: de 64 en 64. Ese salto no es casualidad. Es el **peso del último bit de red**, el bit prestado que está más a la derecha.`),
      bits([['Máscara /26', '255.255.255.192', 26, 24]], 'El último bit en 1 del cuarto octeto está en la posición de peso 64. Cada vez que los bits de subred avanzan una unidad, la dirección avanza 64.'),
      p(`Hay una forma de obtener ese salto sin mirar los bits: restar a 256 el valor del octeto de la máscara.`),
      formula('número mágico = 256 − octeto interesante de la máscara', [
        ['octeto interesante', 'el único octeto de la máscara que no vale 255 ni 0'],
        ['número mágico', 'el tamaño de cada bloque dentro de ese octeto; también se llama tamaño de bloque o salto'],
      ], 'Con `255.255.255.192`: 256 − 192 = 64. Las subredes empiezan en los múltiplos de 64.'),
      tabla(['Prefijo', 'Octeto de máscara', 'Número mágico', 'Las subredes empiezan en…'], [
        ['/25', '128', '128', '0, 128'],
        ['/26', '192', '64', '0, 64, 128, 192'],
        ['/27', '224', '32', '0, 32, 64, 96, 128, 160, 192, 224'],
        ['/28', '240', '16', '0, 16, 32, 48, 64, 80, 96, 112, 128… 240'],
        ['/29', '248', '8', '0, 8, 16, 24, 32, 40, 48, 56, 64… 248'],
        ['/30', '252', '4', '0, 4, 8, 12, 16, 20, 24, 28, 32… 252'],
      ], 'El número mágico es siempre una potencia de 2, y coincide con el total de direcciones del bloque cuando el corte está en el cuarto octeto.'),

      h('El método, paso a paso'),
      orden(
        '**Localiza el octeto interesante**: el de la máscara que no es 255 ni 0.',
        '**Calcula el número mágico**: 256 menos ese valor.',
        '**Cuenta múltiplos** del número mágico (0, luego súmalo una y otra vez) hasta pasarte del valor que tiene la IP en ese octeto. El último múltiplo que no se pasa es el inicio del bloque: esa es la **red**.',
        'El siguiente múltiplo es la red siguiente. **Una dirección antes** está el **broadcast**.',
        '**Primer host** = red + 1. **Último host** = broadcast − 1.',
      ),
      p(`Con /25 a /30 el octeto interesante es el cuarto, así que los tres primeros octetos se copian de la IP sin tocarlos.`),
      ejemplo('facil', 'Un /26, el más fácil de ver', an('192.168.1.100', 26)),
      ejemplo('medio', 'Un /27', an('192.168.5.77', 27)),
      ejemplo('medio', 'Un /28, con más múltiplos que contar', an('10.10.10.200', 28)),
      ejemplo('dificil', 'Un /30, bloques de cuatro', an('172.16.9.150', 30), 'Con /30 hay 64 bloques de 4 direcciones. Para no contar 37 múltiplos, divide: 150 ÷ 4 = 37 y sobra 2, así que el bloque empieza en 37 × 4 = 148.'),
      nota('truco', `Para valores altos no cuentes desde 0. **Divide** el octeto de la IP entre el número mágico, quédate con la parte entera y multiplícala otra vez: 200 ÷ 16 = 12.5 → 12 × 16 = 192. O empieza a contar desde un múltiplo conocido (128 y 192 siempre son inicio de bloque para /26 en adelante).`),

      h('¿Red, broadcast o host?'),
      p(`Con el mismo método puedes saber qué papel tiene una dirección concreta: si coincide con un múltiplo del número mágico es una **dirección de red**; si es un múltiplo menos 1 es un **broadcast**; cualquier otra es un **host válido**.`),
      ejemplo('facil', 'Una dirección que es inicio de bloque', td('192.168.1.64', 26)),
      ejemplo('medio', 'Una dirección justo antes de un múltiplo', td('192.168.1.95', 27)),
      ejemplo('medio', 'Un número redondo que es un host normal', td('192.168.1.100', 27)),
      ejemplo('dificil', 'Un número cualquiera que resulta ser una red', td('192.168.1.100', 30)),
      nota('error', `Con máscaras como /26 o /27, una dirección que no termina en 0 ni en 255 puede ser de red o de broadcast: \`192.168.1.64/26\` es una red y \`192.168.1.127/26\` es un broadcast. Si se la asignas a un equipo, no funcionará. Comprueba siempre con el número mágico.`),

      ejercicios('Practica', 'Seis datos por dirección. Empieza siempre por el número mágico.', [
        an('192.168.1.10', 25), an('192.168.1.200', 25), an('192.168.10.70', 26), an('192.168.10.190', 26), an('192.168.3.33', 27), an('192.168.3.130', 27),
        an('10.0.0.50', 28), an('10.1.1.241', 28), an('172.16.0.21', 29), an('172.16.4.99', 29), an('192.168.100.6', 30), an('10.20.30.253', 30),
        td('192.168.1.128', 25), td('192.168.1.63', 26), td('192.168.1.96', 27), td('192.168.1.47', 28), td('10.0.0.23', 29), td('10.0.0.25', 30),
        op('¿Cuál es el número mágico de la máscara `255.255.255.224`?', ['8', '16', '32', '64'], 2, '256 − 224 = 32. Las subredes /27 van de 32 en 32.'),
        op('Con máscara /28, ¿cuál de estas es una dirección de red?', ['`192.168.1.24`', '`192.168.1.40`', '`192.168.1.48`', '`192.168.1.100`'], 2, 'El número mágico de /28 es 16. De las cuatro, solo 48 es múltiplo de 16 (16 × 3).'),
        op('La red `10.5.5.160/27`, ¿qué broadcast tiene?', ['`10.5.5.175`', '`10.5.5.191`', '`10.5.5.192`', '`10.5.5.255`'], 1, 'Número mágico 32: la red siguiente empieza en 160 + 32 = 192, así que el broadcast es 191.'),
      ]),
    ],
  },
];
