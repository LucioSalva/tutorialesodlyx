// NAT, DHCP e IPv6 · lecciones 1 a 3: direcciones públicas y privadas, NAT/PAT y DHCP.
import { h, h3, p, lista, orden, tabla, nota, codigo, ejemplo, ejercicios, op, vs, rel, ord } from './_ayuda.mjs';

/* Atajos de los tipos generados del módulo (los usa también direccionamiento-2.mjs). */
export const amb = (ip) => ({ tipo: 'dr-ambito', ip });
/** PAT: host interno, su puerto, IP pública del router, servidor, puerto de destino y puerto que asigna el router. */
export const nat = (interna, puerto, publica, servidor, destino, traducido = puerto) => ({ tipo: 'dr-nat', interna, puerto, publica, servidor, destino, traducido });
export const dora = (n) => ({ tipo: 'dr-dhcp', caso: 'mensaje', n: n - 1 });
export const est = (ip) => ({ tipo: 'dr-dhcp', caso: 'estado', ip });
export const pool = (red, pr, excluidas) => ({ tipo: 'dr-dhcp', caso: 'ambito', red, p: pr, excluidas });
export const hex = (modo, v, bits = 8) => ({ tipo: 'dr-hex', modo, v, bits });
export const abr = (ip) => ({ tipo: 'dr-abreviar', ip });
export const exp = (ip) => ({ tipo: 'dr-expandir', ip });
export const t6 = (ip) => ({ tipo: 'dr-tipo6', ip });
export const pre = (ip, pr) => ({ tipo: 'dr-prefijo6', ip, p: pr });
export const sr = (base, p0, p1, n) => ({ tipo: 'dr-subredes6', base, p0, p1, ...(n !== undefined ? { n } : {}) });
export const eui = (mac, prefijo) => ({ tipo: 'dr-eui64', mac, prefijo });

export default [
  /* ------------------------------------------------------------------ 1 */
  {
    slug: 'direcciones-publicas-y-privadas',
    titulo: 'Direcciones públicas, privadas y especiales',
    resumen: 'Quién reparte las direcciones de Internet, cuáles puedes usar libremente en tu red y qué significan 127.0.0.1, 169.254.x.x y otras direcciones reservadas.',
    nivel: 'facil',
    objetivos: [
      'Explicar la diferencia entre una dirección pública y una privada.',
      'Reconocer de memoria los tres rangos privados de la RFC 1918.',
      'Identificar las direcciones especiales: loopback, APIPA, CGNAT, multicast y broadcast limitado.',
      'Explicar por qué se agotaron las direcciones IPv4 y qué se hizo para seguir adelante.',
    ],
    bloques: [
      h('Dos tipos de dirección para dos lugares distintos'),
      p(`Piensa en un edificio de oficinas. El edificio tiene **una dirección postal** que nadie más en el mundo tiene: calle, número y ciudad. Dentro, cada oficina tiene un **número de extensión**: la 101, la 102, la 205. Esas extensiones se repiten en miles de edificios, y no pasa nada, porque solo tienen sentido de puertas para adentro.

Con las direcciones IPv4 ocurre lo mismo:`),
      tabla(['', 'Dirección pública', 'Dirección privada'], [
        ['Se parece a…', 'la dirección postal del edificio', 'la extensión de cada oficina'],
        ['¿Se puede repetir?', 'No: es única en todo Internet', 'Sí: millones de redes usan las mismas'],
        ['¿Quién la asigna?', 'Tu proveedor de Internet', 'Tú, o el router de tu red'],
        ['¿Cuesta dinero?', 'Sí, son escasas', 'No, son de uso libre'],
        ['¿Viaja por Internet?', 'Sí', 'No: los routers de Internet la descartan'],
      ]),
      nota('clave', `Una dirección **pública** identifica a un equipo ante todo Internet. Una dirección **privada** solo identifica a un equipo dentro de su propia red. Tu computadora, tu teléfono y tu televisión usan direcciones privadas; el único equipo de tu casa con dirección pública es el router.`),

      h('Quién reparte las direcciones públicas'),
      p(`Si cada quien eligiera su dirección pública, habría repetidas y los paquetes no sabrían adónde ir. Por eso existe una cadena de reparto, de lo más grande a lo más pequeño:`),
      orden(
        '**IANA** (Internet Assigned Numbers Authority) administra el espacio completo de direcciones y entrega bloques enormes a cinco organizaciones regionales.',
        '**Los RIR** (registros regionales de Internet) reparten esos bloques en su región del mundo.',
        '**Los proveedores de Internet (ISP)** reciben bloques de su RIR.',
        '**Tú** recibes de tu proveedor una dirección pública (o unas pocas) para tu router.',
      ),
      tabla(['RIR', 'Región'], [
        ['**LACNIC**', 'América Latina y el Caribe (incluye a México)'],
        ['**ARIN**', 'Estados Unidos, Canadá y parte del Caribe'],
        ['**RIPE NCC**', 'Europa, Medio Oriente y Asia Central'],
        ['**APNIC**', 'Asia y el Pacífico'],
        ['**AFRINIC**', 'África'],
      ]),

      h('Los tres rangos privados'),
      p(`En 1996, el documento **RFC 1918** apartó tres bloques de direcciones para uso interno. Nadie tiene que pedir permiso para usarlos, y a cambio los routers de Internet tienen la orden de **no reenviarlos nunca**.`),
      tabla(['Bloque', 'Desde', 'Hasta', 'Direcciones', 'Dónde lo verás'], [
        ['`10.0.0.0/8`', '10.0.0.0', '10.255.255.255', '16,777,216', 'Empresas grandes'],
        ['`172.16.0.0/12`', '172.16.0.0', '172.31.255.255', '1,048,576', 'Empresas medianas'],
        ['`192.168.0.0/16`', '192.168.0.0', '192.168.255.255', '65,536', 'Casas y oficinas pequeñas'],
      ], 'Hay uno por cada clase antigua: uno de clase A, uno de clase B y uno de clase C. Las clases se explican en el módulo de Subneteo, lección «Clases de direcciones: A, B, C, D y E».'),
      nota('error', `El error más repetido en los exámenes: creer que **todo** lo que empieza por 172 es privado. Solo lo es del **172.16** al **172.31**. \`172.15.0.1\` y \`172.32.0.1\` son públicas. Lo mismo con 192: solo es privado **192.168**; \`192.167.1.1\` y \`192.169.1.1\` son públicas.`),
      h3('Por qué el bloque de 172 termina en 31'),
      p(`El prefijo es /12: los 8 bits del primer octeto más 4 bits del segundo son fijos. Con 4 bits fijos, al segundo octeto le quedan otros 4 bits libres, que dan 2^4 = 16 valores seguidos. Empezando en 16, los 16 valores son del 16 al 31. No hay que memorizarlo: sale de la máscara.`),
      ejemplo('facil', 'Una dirección de casa', amb('192.168.1.25')),
      ejemplo('facil', 'Una dirección de un servidor de Internet', amb('8.8.8.8')),
      ejemplo('medio', 'El 172 que sí es privado', amb('172.20.14.3')),
      ejemplo('medio', 'El 172 que no lo es', amb('172.32.5.9')),

      h('Direcciones especiales'),
      p(`Además de las privadas hay otros bloques que no se asignan a equipos de forma normal. Cada uno tiene un significado propio, y reconocerlos a simple vista ahorra mucho tiempo al diagnosticar.`),
      tabla(['Bloque', 'Nombre', 'Qué significa'], [
        ['`127.0.0.0/8`', 'Loopback', 'El propio equipo. `127.0.0.1` es «yo mismo»: el paquete nunca sale por el cable. Sirve para probar que el software de red del equipo funciona.'],
        ['`169.254.0.0/16`', 'APIPA (enlace local)', 'El equipo pidió una dirección por DHCP, nadie contestó y se puso una él solo. Ver una dirección así es señal de avería.'],
        ['`100.64.0.0/10`', 'Espacio compartido (CGNAT)', 'Lo usan los proveedores entre tu router y su propio NAT. Va de 100.64.0.0 a 100.127.255.255.'],
        ['`224.0.0.0/4`', 'Multicast (clase D)', 'Del 224 al 239. Una dirección identifica a un grupo de equipos, no a uno.'],
        ['`240.0.0.0/4`', 'Reservado (clase E)', 'Del 240 al 255. Experimental; no se asigna.'],
        ['`255.255.255.255`', 'Broadcast limitado', '«A todos los de esta red». Nunca cruza un router.'],
        ['`0.0.0.0`', 'Sin especificar', '«Todavía no tengo dirección». En una tabla de rutas, `0.0.0.0/0` significa «cualquier destino» (la ruta por defecto).'],
      ]),
      nota('truco', `**APIPA** significa *Automatic Private IP Addressing*. Si un usuario te dice «no tengo Internet» y su dirección empieza por **169.254**, ya sabes dónde buscar: su equipo no consiguió hablar con el servidor DHCP. El detalle está en la lección 3.`),
      nota('aviso', `Hay tres bloques pensados para **escribir ejemplos** en manuales sin tocar direcciones reales: \`192.0.2.0/24\`, \`198.51.100.0/24\` y \`203.0.113.0/24\`. Los verás en este curso haciendo el papel de «direcciones públicas».`),
      ejemplo('facil', 'La dirección de uno mismo', amb('127.0.0.1')),
      ejemplo('medio', 'Una dirección que delata un fallo', amb('169.254.83.12')),
      ejemplo('dificil', 'El bloque de los proveedores', amb('100.72.14.6')),
      ejemplo('dificil', 'Casi dentro del bloque de los proveedores', amb('100.63.255.1')),
      ejemplo('dificil', 'Una dirección de grupo', amb('224.0.0.5')),

      h('Por qué se acabaron las direcciones IPv4'),
      p(`Una dirección IPv4 tiene 32 bits, así que existen 2^32 = **4,294,967,296** direcciones: unos 4,300 millones. En los años ochenta parecía infinito. Hoy hay más teléfonos que personas, y además cada casa tiene televisiones, consolas, focos y cámaras conectados.

Para colmo, no todas se pueden usar: hay que descontar las privadas, las de multicast, las reservadas y las que se pierden como dirección de red y de broadcast en cada subred.`),
      tabla(['Año', 'Qué pasó'], [
        ['1981', 'Se publica IPv4 con direcciones de 32 bits.'],
        ['1993', 'Se abandonan las clases rígidas (llega CIDR) para repartir bloques a la medida.'],
        ['1996', 'La RFC 1918 define las direcciones privadas. Con NAT, miles de equipos comparten una sola pública.'],
        ['1998', 'Se publica IPv6, con direcciones de 128 bits.'],
        ['2011', 'IANA entrega sus últimos bloques libres a los RIR.'],
        ['2011 – 2020', 'Los RIR agotan uno a uno sus reservas. LACNIC entra en su última fase en 2020.'],
      ]),
      p(`Se tomaron tres medidas, y las tres siguen vigentes:`),
      lista(
        '**Subneteo y CIDR**: repartir bloques del tamaño justo en lugar de clases enteras. Es el módulo de Subneteo.',
        '**Direcciones privadas con NAT**: toda una red sale a Internet con una sola dirección pública. Es la lección siguiente.',
        '**IPv6**: direcciones de 128 bits, la solución definitiva. Son las lecciones 4 a 7.',
      ),

      h('Resumen'),
      lista(
        'Pública = única en Internet y enrutable. Privada = de uso libre dentro de una red, no enrutable en Internet.',
        'Privadas: **10.0.0.0/8**, **172.16.0.0/12** (172.16 a 172.31) y **192.168.0.0/16**.',
        '**127.x.x.x** es el propio equipo. **169.254.x.x** significa que DHCP falló. **100.64.0.0/10** es del proveedor.',
        'Del 224 al 239 es multicast; del 240 en adelante, reservado.',
        'IPv4 solo tiene unos 4,300 millones de direcciones: por eso existen NAT e IPv6.',
      ),

      ejercicios('Practica', 'Clasifica cada dirección. Recuerda mirar el segundo octeto cuando el primero sea 172, 192, 169 o 100.', [
        amb('10.200.3.4'), amb('192.168.100.1'), amb('172.16.0.1'), amb('172.31.255.254'), amb('172.15.9.9'), amb('192.169.1.1'),
        amb('11.0.0.1'), amb('127.45.6.7'), amb('169.254.1.1'), amb('169.253.1.1'), amb('100.64.0.1'), amb('100.127.255.254'), amb('100.128.0.1'),
        amb('239.255.255.250'), amb('245.1.1.1'), amb('200.57.3.10'),
        op('¿Cuál es la diferencia principal entre una dirección pública y una privada?', ['La pública es más rápida', 'La pública es única en Internet y enrutable; la privada se puede repetir en muchas redes y no se enruta en Internet', 'La privada necesita contraseña', 'La pública solo la usan los servidores'], 1, 'La velocidad y las contraseñas no tienen que ver con el tipo de dirección. Lo que las distingue es el alcance: una pública vale en todo Internet y una privada solo dentro de su red.'),
        op('¿Qué organización reparte las direcciones IP en América Latina y el Caribe?', ['ARIN', 'RIPE NCC', 'LACNIC', 'APNIC'], 2, 'LACNIC es el registro regional de América Latina y el Caribe. ARIN atiende a Estados Unidos y Canadá, RIPE NCC a Europa y APNIC a Asia y el Pacífico.'),
        vs('¿Cuáles de estas direcciones son privadas según la RFC 1918?', ['172.18.4.1', '172.33.4.1', '192.168.200.9', '192.186.1.1', '11.1.1.1'], [0, 2], 'El bloque de 172 solo va de 172.16 a 172.31, así que 172.18 es privada y 172.33 no. `192.186` no es `192.168`: basta cambiar de orden dos cifras para salir del bloque. Y solo es privado el 10, no el 11.'),
        rel('Relaciona cada dirección con lo que significa.', [['127.0.0.1', 'El propio equipo (loopback)'], ['169.254.20.3', 'DHCP no respondió (APIPA)'], ['255.255.255.255', 'Todos los equipos de la red local'], ['0.0.0.0', 'Aún no hay dirección asignada']], 'Son cuatro direcciones que conviene reconocer al instante: 127 es uno mismo, 169.254 delata un fallo de DHCP, todo unos es el broadcast limitado y todo ceros es «sin dirección».', ['Un grupo multicast']),
        op('Un usuario dice que no puede navegar. Su dirección es `169.254.77.4`. ¿Qué es lo primero que revisas?', ['El servidor DNS', 'Que el equipo pueda alcanzar al servidor DHCP (cable, wifi, servidor encendido)', 'La contraseña de su correo', 'La velocidad contratada'], 1, 'Una dirección 169.254.x.x no la entrega ningún servidor: el equipo se la asignó porque DHCP no contestó. Mientras eso no se arregle, el DNS da igual, porque el equipo ni siquiera tiene puerta de enlace.'),
        op('¿Cuántas direcciones existen en total en IPv4?', ['65,536', 'Unos 16 millones', 'Unos 4,300 millones', 'Un número prácticamente infinito'], 2, '32 bits dan 2^32 = 4,294,967,296 direcciones. 65,536 es 2^16 y 16 millones es 2^24.'),
        ord('Ordena la cadena de reparto de direcciones públicas, de la organización más grande al usuario final.', ['IANA', 'RIR (por ejemplo, LACNIC)', 'Proveedor de Internet (ISP)', 'Cliente'], 'IANA administra el espacio completo y lo entrega a los cinco registros regionales; estos lo reparten a los proveedores, y cada proveedor da direcciones a sus clientes.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 2 */
  {
    slug: 'nat-y-pat',
    titulo: 'NAT y PAT: salir a Internet con direcciones privadas',
    resumen: 'Cómo un router cambia direcciones privadas por una pública, la tabla de traducciones paso a paso y la diferencia entre NAT estático, dinámico y PAT.',
    nivel: 'medio',
    objetivos: [
      'Explicar qué problema resuelve NAT y dónde se hace la traducción.',
      'Distinguir NAT estático, NAT dinámico y PAT (sobrecarga).',
      'Seguir un paquete a través de PAT y leer la tabla de traducciones.',
      'Usar los términos inside local, inside global y outside global.',
    ],
    bloques: [
      h('El problema'),
      p(`Tu computadora tiene la dirección \`192.168.1.10\`. Quiere abrir una página que está en el servidor \`198.51.100.20\`. Si el paquete saliera a Internet tal cual, pasarían dos cosas malas:`),
      lista(
        'Los routers de Internet **descartan** los paquetes con direcciones privadas.',
        'Aunque llegara, el servidor no podría contestar: hay millones de equipos en el mundo con la dirección `192.168.1.10`. ¿A cuál le responde?',
      ),
      p(`La solución se llama **NAT** (*Network Address Translation*, traducción de direcciones de red). El router que une tu red con Internet **reescribe la dirección de origen** de cada paquete que sale: quita la privada y pone una pública. Cuando llega la respuesta, deshace el cambio.`),
      nota('clave', `NAT es como la recepcionista de una empresa. Los empleados llaman al exterior desde su extensión, pero quien recibe la llamada ve **el número principal de la empresa**. Cuando devuelven la llamada, la recepcionista sabe a qué extensión pasarla porque **lo tiene apuntado**.`),

      h('Dónde ocurre: interior y exterior'),
      p(`El router de borde tiene (al menos) dos interfaces, y a NAT hay que decirle cuál es cuál:`),
      tabla(['Lado', 'En Cisco', 'Qué hay ahí'], [
        ['**Interior** (inside)', '`ip nat inside`', 'Tu red local, con direcciones privadas.'],
        ['**Exterior** (outside)', '`ip nat outside`', 'Internet (el enlace con el proveedor), con direcciones públicas.'],
      ]),
      p(`La traducción solo se hace cuando un paquete **cruza** de un lado al otro. El tráfico entre dos equipos de la misma red local no pasa por NAT.`),

      h('Los cuatro nombres de una dirección'),
      p(`Cisco usa cuatro términos que salen en el examen. Parecen un trabalenguas, pero se forman con dos preguntas:`),
      lista(
        '**¿De quién es el equipo?** *Inside* = de mi red. *Outside* = de fuera (el servidor de Internet).',
        '**¿Desde dónde se ve la dirección?** *Local* = como se ve desde dentro de mi red. *Global* = como se ve desde Internet.',
      ),
      tabla(['Término', 'Qué es', 'Ejemplo'], [
        ['**Inside local**', 'La dirección privada real de tu equipo.', '192.168.1.10'],
        ['**Inside global**', 'La dirección pública con la que tu equipo aparece en Internet.', '203.0.113.5'],
        ['**Outside global**', 'La dirección pública real del servidor de Internet.', '198.51.100.20'],
        ['**Outside local**', 'La dirección del servidor tal como se ve desde tu red. Casi siempre es igual a la outside global.', '198.51.100.20'],
      ], 'Para el examen: **inside local = privada** e **inside global = pública**. Son las dos que cambia NAT.'),

      h('Tres formas de hacer NAT'),
      h3('NAT estático: uno a uno, fijo'),
      p(`Se escribe a mano una equivalencia permanente: «la privada \`192.168.1.50\` siempre es la pública \`203.0.113.50\`». Se usa para **servidores internos que deben ser alcanzables desde Internet**, porque la entrada existe siempre y permite iniciar conexiones desde fuera.`),
      codigo('NAT estático en Cisco IOS', `Router(config)# ip nat inside source static 192.168.1.50 203.0.113.50`),
      h3('NAT dinámico: uno a uno, por turnos'),
      p(`El router tiene un **conjunto** (pool) de direcciones públicas y presta una a cada equipo interno que quiere salir. Cuando el equipo termina, la dirección vuelve al conjunto. Sigue siendo uno a uno: si el conjunto tiene 5 direcciones, solo 5 equipos pueden salir a la vez; el sexto tiene que esperar.`),
      h3('PAT: muchos a uno'),
      p(`**PAT** (*Port Address Translation*), también llamado **NAT con sobrecarga** (*overload*), es el que usan todas las casas y casi todas las empresas. **Todos** los equipos internos salen con **la misma dirección pública**, y el router los distingue por el **número de puerto**.`),
      tabla(['', 'NAT estático', 'NAT dinámico', 'PAT (sobrecarga)'], [
        ['Relación privadas : públicas', '1 a 1, fija', '1 a 1, temporal', 'Muchas a 1'],
        ['Direcciones públicas necesarias', 'Una por equipo', 'Una por equipo que sale a la vez', 'Con una basta'],
        ['¿Se puede entrar desde Internet?', 'Sí', 'No', 'No (salvo reenvío de puertos)'],
        ['Uso típico', 'Servidores publicados', 'Poco usado hoy', 'Salida a Internet de usuarios'],
      ]),

      ejemplo('facil', 'Elegir el tipo de NAT', op('Una clínica tiene 40 computadoras, un servidor de citas que los pacientes consultan desde Internet y dos direcciones públicas. ¿Cómo repartes las dos direcciones?',
        ['NAT dinámico con las dos direcciones para todos los equipos', 'Una dirección con NAT estático para el servidor y la otra con PAT para las 40 computadoras', 'PAT con las dos direcciones y nada para el servidor', 'NAT estático para dos computadoras y el resto sin Internet'], 1, [
          'El servidor debe ser alcanzable **desde fuera** y siempre en la misma dirección: eso solo lo da una entrada fija, es decir, **NAT estático**. Se le dedica una dirección pública.',
          'Las 40 computadoras solo necesitan **salir**. Con PAT, todas comparten la otra dirección pública y se distinguen por el puerto.',
          'El NAT dinámico con dos direcciones dejaría salir solo a dos equipos a la vez, y no garantizaría una dirección fija para el servidor.',
        ])),

      h('PAT paso a paso'),
      p(`Para entender PAT hay que recordar que una conexión no se identifica solo por direcciones IP, sino por **cuatro datos**: IP de origen, puerto de origen, IP de destino y puerto de destino. El puerto de destino indica el servicio (443 es HTTPS). El **puerto de origen** lo inventa tu computadora al azar para cada conexión, normalmente por encima del 49152.

Ese puerto de origen es la «extensión» que la recepcionista apunta.`),
      orden(
        'La computadora envía el paquete con su IP privada y su puerto de origen.',
        'El router cambia la **IP de origen** por su IP pública. El puerto de origen lo conserva si está libre; si otro equipo ya lo está usando, asigna otro.',
        'El router **apunta** la equivalencia en su tabla de traducciones.',
        'El servidor recibe el paquete, ve solo la IP pública y contesta a esa IP y a ese puerto.',
        'La respuesta llega al router. Busca la IP y el puerto de destino en la tabla y los cambia por los originales.',
        'La computadora recibe la respuesta sin enterarse de nada.',
      ),
      ejemplo('facil', 'Una computadora navega: el puerto se conserva', nat('192.168.1.10', 51000, '203.0.113.5', '198.51.100.20', 443)),
      ejemplo('medio', 'Una consulta DNS desde una red 10', nat('10.0.5.23', 49733, '203.0.113.77', '198.51.100.53', 53)),
      ejemplo('dificil', 'Dos equipos eligieron el mismo puerto', nat('192.168.1.11', 51000, '203.0.113.5', '198.51.100.20', 443, 1024),
        'Este es el caso que justifica el nombre de PAT: cuando dos equipos coinciden en el puerto, el router cambia también el puerto para que las dos conexiones no se confundan.'),
      ejemplo('dificil', 'Una conexión SSH con el puerto cambiado', nat('172.16.40.8', 60122, '198.51.100.9', '203.0.113.200', 22, 4507)),

      h('Leer la tabla de traducciones'),
      p(`En un router Cisco la tabla se consulta con \`show ip nat translations\`. Cada línea es una conexión viva.`),
      codigo('Dos computadoras navegando a la vez', `Router# show ip nat translations
Pro  Inside global        Inside local         Outside local        Outside global
tcp  203.0.113.5:51000    192.168.1.10:51000   198.51.100.20:443    198.51.100.20:443
tcp  203.0.113.5:1024     192.168.1.11:51000   198.51.100.20:443    198.51.100.20:443`),
      p(`Fíjate en la columna **Inside global**: las dos líneas tienen la misma IP pública, pero puertos distintos (\`51000\` y \`1024\`). Eso es lo que permite al router saber a quién pertenece cada respuesta.`),
      ejemplo('medio', 'Interpretar una línea de la tabla', op('Según la tabla, ¿qué dirección y puerto ve el servidor como origen de la conexión de la computadora `192.168.1.11`?',
        ['192.168.1.11:51000', '203.0.113.5:51000', '203.0.113.5:1024', '198.51.100.20:443'], 2, [
          'Se busca la línea cuya columna **Inside local** es `192.168.1.11:51000`: es la segunda.',
          'En esa línea, la columna **Inside global** es `203.0.113.5:1024`. Esa es la dirección con la que el equipo aparece en Internet.',
          'El puerto no es 51000 porque la otra computadora ya lo ocupaba en la dirección pública: el router asignó el 1024.',
        ], { codigo: `Pro  Inside global        Inside local         Outside local        Outside global
tcp  203.0.113.5:51000    192.168.1.10:51000   198.51.100.20:443    198.51.100.20:443
tcp  203.0.113.5:1024     192.168.1.11:51000   198.51.100.20:443    198.51.100.20:443` })),
      codigo('PAT en Cisco IOS', `Router(config)# access-list 1 permit 192.168.1.0 0.0.0.255
Router(config)# ip nat inside source list 1 interface g0/1 overload
Router(config)# interface g0/0
Router(config-if)# ip nat inside
Router(config-if)# interface g0/1
Router(config-if)# ip nat outside`),
      nota('truco', `La palabra que convierte NAT en PAT es **\`overload\`**. La lista de acceso dice qué direcciones internas se traducen, e \`interface g0/1\` indica que se use la dirección pública de esa interfaz.`),

      h('Entrar desde Internet: reenvío de puertos'),
      p(`Con PAT, las conexiones solo pueden **empezar desde dentro**: la línea de la tabla se crea cuando sale el primer paquete. Si alguien de Internet intenta conectarse a tu IP pública sin que nadie lo haya pedido, el router no encuentra ninguna línea y descarta el paquete.

Para publicar un servicio interno (una cámara, un servidor web) se crea una entrada fija: «lo que llegue a mi IP pública por el puerto 8080, envíalo a \`192.168.1.50\` puerto 80». Eso es el **reenvío de puertos** (*port forwarding*), un NAT estático que incluye el puerto.`),
      codigo('Reenvío de puertos en Cisco IOS', `Router(config)# ip nat inside source static tcp 192.168.1.50 80 203.0.113.5 8080`),

      h('Ventajas e inconvenientes'),
      tabla(['Ventajas', 'Inconvenientes'], [
        ['Ahorra direcciones públicas: una sola sirve para miles de equipos.', 'Rompe la comunicación de extremo a extremo: desde fuera no se puede llegar a un equipo interno sin configurar algo.'],
        ['Puedes cambiar de proveedor sin renumerar la red interna.', 'Algunas aplicaciones (voz, juegos, VPN) necesitan ayudas especiales para atravesarlo.'],
        ['Oculta las direcciones internas.', 'El router trabaja más: reescribe y recalcula cada paquete.'],
        ['', 'Dificulta saber qué equipo interno hizo qué: desde fuera todos parecen el mismo.'],
      ]),
      nota('aviso', `NAT **no es un firewall**. Es verdad que impide las conexiones entrantes no solicitadas, pero no inspecciona nada ni aplica reglas. La seguridad de una red no debe depender de NAT.`),

      h('Resumen'),
      lista(
        'NAT cambia direcciones privadas por públicas en el router de borde, al cruzar de inside a outside.',
        '**Estático**: 1 a 1 fijo (servidores). **Dinámico**: 1 a 1 con un conjunto. **PAT**: muchos a 1 usando puertos.',
        'El servidor de Internet siempre ve la dirección **inside global** (la pública), nunca la privada.',
        'La tabla de traducciones guarda la pareja IP + puerto para devolver cada respuesta a su dueño.',
        'Para entrar desde Internet hace falta NAT estático o reenvío de puertos.',
      ),

      ejercicios('Practica', 'En los ejercicios de traducción, rellena primero lo que ve el servidor y después el camino de vuelta.', [
        nat('192.168.0.15', 50211, '203.0.113.9', '198.51.100.80', 80),
        nat('192.168.10.200', 62001, '203.0.113.120', '198.51.100.44', 443),
        nat('10.1.1.5', 49999, '203.0.113.1', '198.51.100.8', 53),
        nat('172.20.3.77', 55555, '198.51.100.250', '203.0.113.60', 25),
        nat('192.168.0.16', 50211, '203.0.113.9', '198.51.100.80', 80, 2001),
        nat('10.50.0.9', 61234, '203.0.113.14', '198.51.100.99', 443, 30500),
        nat('172.31.255.2', 49152, '198.51.100.3', '203.0.113.210', 22, 49153),
        op('¿En qué equipo se hace normalmente la traducción NAT?', ['En cada computadora', 'En el switch de acceso', 'En el router que une la red interna con Internet', 'En el servidor de destino'], 2, 'NAT se hace donde la red privada se encuentra con la pública: el router de borde. Los switches de acceso no miran direcciones IP y las computadoras ni se enteran de la traducción.'),
        op('Una oficina tiene 80 computadoras y una sola dirección pública. ¿Qué tipo de NAT necesita para que todas naveguen a la vez?', ['NAT estático', 'NAT dinámico con un conjunto de una dirección', 'PAT (NAT con sobrecarga)', 'No es posible'], 2, 'Estático y dinámico son uno a uno: con una dirección pública solo saldría un equipo. PAT reutiliza la misma dirección para todos y los distingue por el puerto.'),
        op('¿Qué dato usa PAT para distinguir las conexiones de dos equipos que comparten la misma dirección pública?', ['La dirección MAC', 'El número de puerto de origen', 'El nombre del equipo', 'La máscara de subred'], 1, 'La MAC no sale de la red local. PAT apunta la pareja IP + puerto de origen, y si dos equipos coinciden en el puerto, cambia uno.'),
        op('Una empresa tiene un servidor web interno en `192.168.1.50` que debe ser accesible desde Internet siempre en la misma dirección pública. ¿Qué configuras?', ['NAT estático', 'PAT', 'NAT dinámico', 'APIPA'], 0, 'Solo una entrada fija permite iniciar conexiones desde fuera. Con PAT o NAT dinámico la entrada se crea cuando el equipo interno sale, y no hay una dirección pública garantizada.'),
        rel('Relaciona cada término de NAT con su significado.', [['Inside local', 'Dirección privada del equipo interno'], ['Inside global', 'Dirección pública con la que el equipo interno aparece en Internet'], ['Outside global', 'Dirección pública real del servidor de Internet']], 'Inside u outside dice de quién es el equipo; local o global, desde dónde se mira. Las dos «inside» son las que NAT intercambia.', ['Dirección MAC del router']),
        op('¿Qué palabra del comando `ip nat inside source list 1 interface g0/1 overload` hace que varios equipos compartan la misma dirección pública?', ['inside', 'source', 'list', 'overload'], 3, '`overload` activa la sobrecarga, es decir, PAT. Sin ella el router haría NAT uno a uno con la dirección de la interfaz y solo saldría un equipo.'),
        vs('¿Cuáles son ventajas reales de NAT?', ['Ahorra direcciones IPv4 públicas', 'Cifra el tráfico que sale a Internet', 'Permite cambiar de proveedor sin renumerar la red interna', 'Acelera la conexión'], [0, 2], 'NAT no cifra nada ni acelera: al contrario, da trabajo extra al router. Sus ventajas son el ahorro de direcciones y la independencia entre el direccionamiento interno y el del proveedor.'),
        op('Desde Internet, alguien intenta conectarse a la IP pública de tu router doméstico por el puerto 3389 y nadie de tu red había iniciado esa conexión. ¿Qué pasa?', ['El router la envía a todas las computadoras', 'El router la descarta porque no hay ninguna entrada en la tabla de traducciones', 'El router la envía a la primera computadora que encendiste', 'La conexión se abre con el propio proveedor'], 1, 'Con PAT las entradas se crean al salir. Un paquete entrante sin entrada no tiene a quién entregarse, salvo que exista un reenvío de puertos para ese puerto.'),
        ord('Ordena lo que ocurre cuando una computadora con IP privada abre una página web a través de PAT.', ['La computadora envía el paquete con su IP privada', 'El router cambia la IP de origen por la pública y apunta la traducción', 'El servidor contesta a la IP pública del router', 'El router busca el puerto en su tabla y restaura la IP privada'], 'La traducción se hace al salir y se deshace al volver. El servidor solo interviene en medio y nunca ve la dirección privada.'),
        op('Con NAT dinámico y un conjunto de 4 direcciones públicas, ¿cuántos equipos internos pueden estar conectados a Internet al mismo tiempo?', ['1', '4', '254', 'Ilimitados'], 1, 'El NAT dinámico presta una dirección pública completa a cada equipo. Con 4 direcciones salen 4 equipos; el quinto espera a que alguna se libere. Para no tener ese límite se usa PAT.'),
        op('¿Cuál de estas afirmaciones sobre NAT es correcta?', ['NAT sustituye a un firewall', 'NAT cambia la dirección MAC de los paquetes', 'NAT impide las conexiones entrantes no solicitadas, pero no inspecciona el tráfico', 'NAT solo funciona con IPv6'], 2, 'NAT trabaja con direcciones IP (y puertos en PAT), no con MAC, y nació para IPv4. Bloquea lo que no tiene entrada en la tabla, pero eso es un efecto secundario, no una política de seguridad.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 3 */
  {
    slug: 'como-obtiene-un-equipo-su-direccion',
    titulo: 'Cómo obtiene un equipo su dirección: estática, DHCP y APIPA',
    resumen: 'Los cuatro datos que necesita un equipo, la diferencia entre ponerlos a mano y recibirlos por DHCP, los cuatro mensajes DORA y cómo reconocer que DHCP falló.',
    nivel: 'medio',
    objetivos: [
      'Enumerar los datos de configuración IP que necesita un equipo.',
      'Decidir cuándo conviene una dirección estática y cuándo una dinámica.',
      'Describir los cuatro mensajes de DHCP (DORA), quién envía cada uno y por qué puerto.',
      'Reconocer una dirección APIPA y saber qué revisar.',
    ],
    bloques: [
      h('Los cuatro datos que necesita un equipo'),
      p(`Para funcionar en una red, a un equipo no le basta con tener una dirección IP. Necesita cuatro datos:`),
      tabla(['Dato', 'Para qué sirve', 'Si falta o está mal…'], [
        ['**Dirección IP**', 'Lo identifica en la red.', 'No se comunica con nadie, o choca con otro equipo.'],
        ['**Máscara de subred**', 'Le dice qué direcciones están en su misma red.', 'Cree que vecinos son lejanos o al revés.'],
        ['**Puerta de enlace** (gateway)', 'La dirección del router por donde sale a otras redes.', 'Funciona la red local, pero no sale a Internet.'],
        ['**Servidor DNS**', 'Traduce nombres como `ejemplo.com` a direcciones IP.', 'Hay conexión, pero «no abre páginas» por nombre.'],
      ]),
      p(`Hay dos formas de darle esos datos: escribirlos a mano o dejar que los reciba solo.`),

      h('Estática o dinámica'),
      tabla(['', 'Estática (manual)', 'Dinámica (DHCP)'], [
        ['Quién pone los datos', 'Una persona, equipo por equipo', 'Un servidor, automáticamente'],
        ['¿Cambia la dirección?', 'No', 'Puede cambiar'],
        ['Riesgo', 'Errores de dedo y direcciones duplicadas', 'Si el servidor cae, nadie nuevo recibe dirección'],
        ['Se usa en', 'Routers, switches, servidores, impresoras', 'Computadoras, teléfonos, tabletas, invitados'],
      ]),
      nota('clave', `La regla práctica: los equipos **a los que otros necesitan encontrar** llevan dirección fija (el router, el servidor, la impresora). Los equipos **que solo consumen servicios** la reciben por DHCP.`),

      h('DHCP: el repartidor de direcciones'),
      p(`**DHCP** (*Dynamic Host Configuration Protocol*) es el servicio que entrega los cuatro datos a quien los pide. En una casa, el servidor DHCP es el propio router. En una empresa puede ser un router, un switch de capa 3 o un servidor dedicado.

Imagina un hotel. Llegas a recepción sin habitación (sin dirección). El recepcionista te ofrece una habitación libre, tú la aceptas, él te entrega la llave y apunta hasta qué día es tuya. Eso, exactamente, es DHCP.`),

      h('Los cuatro mensajes: DORA'),
      p(`El intercambio tiene cuatro mensajes. Sus iniciales forman la palabra **DORA**:`),
      tabla(['N.º', 'Mensaje', 'Quién lo envía', 'Qué dice', 'Cómo viaja'], [
        ['1', '**D**iscover', 'Cliente', '«¿Hay algún servidor DHCP? Necesito una dirección.»', 'Broadcast'],
        ['2', '**O**ffer', 'Servidor', '«Te ofrezco la 192.168.1.50, con esta máscara, este gateway y este DNS.»', 'Al cliente'],
        ['3', '**R**equest', 'Cliente', '«Acepto la 192.168.1.50 que me ofreció este servidor.»', 'Broadcast'],
        ['4', '**A**cknowledge', 'Servidor', '«Confirmado. Es tuya durante 24 horas.»', 'Al cliente'],
      ]),
      h3('¿Por qué el primer mensaje es un broadcast?'),
      p(`Porque el cliente está en una situación imposible: **no tiene dirección y no sabe dónde está el servidor**. Lo único que puede hacer es gritar a toda la red. Por eso el Discover sale con origen \`0.0.0.0\` («todavía no soy nadie») y destino \`255.255.255.255\` («a todos»).`),
      h3('¿Y por qué el Request también?'),
      p(`Porque en la red puede haber **más de un servidor** DHCP, y todos habrán hecho una oferta. Con el Request por broadcast, el cliente avisa a todos a la vez: el elegido confirma, y los demás retiran su oferta y devuelven la dirección a su lista de libres.`),
      h3('Los puertos'),
      p(`DHCP usa **UDP**, no TCP: es un intercambio corto y un equipo sin dirección no puede establecer una conexión. El **servidor escucha en el puerto 67** y el **cliente en el 68**. Cada mensaje va dirigido al puerto de quien lo recibe.`),
      tabla(['Mensaje', 'IP de origen', 'IP de destino', 'Puerto de origen', 'Puerto de destino'], [
        ['Discover', '0.0.0.0', '255.255.255.255', '68', '67'],
        ['Offer', 'IP del servidor', 'IP ofrecida o broadcast', '67', '68'],
        ['Request', '0.0.0.0', '255.255.255.255', '68', '67'],
        ['Acknowledge', 'IP del servidor', 'IP ofrecida o broadcast', '67', '68'],
      ]),
      ejemplo('facil', 'El primer mensaje', dora(1)),
      ejemplo('facil', 'La respuesta del servidor', dora(2)),
      ejemplo('medio', 'El mensaje con el que el cliente acepta', dora(3)),
      ejemplo('medio', 'La confirmación final', dora(4)),

      h('El ámbito, las exclusiones y las reservas'),
      p(`El servidor no reparte direcciones al azar. Se le configura un **ámbito** (*scope* o *pool*): la red de la que puede repartir y los datos que acompañan a cada dirección.`),
      tabla(['Concepto', 'Qué es', 'Ejemplo'], [
        ['**Ámbito**', 'El rango de direcciones que el servidor puede entregar.', '192.168.1.0/24'],
        ['**Exclusión**', 'Direcciones del ámbito que el servidor nunca entregará, porque se usan con IP fija.', 'De 192.168.1.1 a 192.168.1.20'],
        ['**Reserva**', 'Una dirección que se entrega siempre al mismo equipo, reconocido por su dirección MAC.', 'La impresora recibe siempre 192.168.1.30'],
        ['**Concesión** (lease)', 'El tiempo durante el cual la dirección es del cliente.', '24 horas'],
      ]),
      codigo('Servidor DHCP en un router Cisco', `Router(config)# ip dhcp excluded-address 192.168.1.1 192.168.1.20
Router(config)# ip dhcp pool OFICINA
Router(dhcp-config)# network 192.168.1.0 255.255.255.0
Router(dhcp-config)# default-router 192.168.1.1
Router(dhcp-config)# dns-server 8.8.8.8
Router(dhcp-config)# lease 1`),
      nota('error', `Olvidar las exclusiones es un error clásico: el servidor acaba entregando a un teléfono la misma dirección que tiene el router o la impresora, y aparece un **conflicto de direcciones**: dos equipos con la misma IP, que funcionan a ratos.`),
      p(`La concesión **caduca**. Cuando ha pasado la mitad del tiempo, el cliente pide renovarla directamente a su servidor (ya solo hacen falta el Request y el Acknowledge). Si el servidor no contesta, el cliente sigue usando la dirección y vuelve a intentarlo más tarde; al terminar el plazo debe soltarla y empezar de nuevo con un Discover.`),
      ejemplo('medio', 'Cuántas direcciones quedan para repartir', pool('192.168.1.0', 24, 20)),
      ejemplo('dificil', 'Un ámbito pequeño con exclusiones', pool('192.168.10.64', 26, 5)),
      ejemplo('dificil', 'Un ámbito de dos redes de clase C juntas', pool('192.168.4.0', 23, 30)),

      h('Cuando el servidor está en otra red: el agente de retransmisión'),
      p(`El Discover es un broadcast, y **los routers no reenvían los broadcast**. Entonces, si el servidor DHCP está en otra red (lo habitual en una empresa con varias VLAN), el Discover nunca le llega.

La solución es el **agente de retransmisión** (*relay agent*): se le dice al router «cuando oigas un broadcast DHCP en esta interfaz, envíaselo tú al servidor, por unicast». En Cisco se configura en la interfaz del lado de los clientes:`),
      codigo('Agente de retransmisión', `Router(config)# interface g0/0
Router(config-if)# ip helper-address 10.0.0.5`),

      h('Cuando DHCP falla: APIPA'),
      p(`Si el cliente envía varios Discover y **nadie contesta**, no se queda sin dirección: se asigna él mismo una del bloque **169.254.0.0/16**, con máscara 255.255.0.0, **sin puerta de enlace y sin DNS**. A eso se le llama **APIPA**.

Con esa dirección solo puede hablar con otros equipos del mismo cable que también tengan una 169.254. No puede salir a Internet.`),
      codigo('Windows: una interfaz con dirección APIPA', `C:\\> ipconfig

Adaptador de Ethernet Ethernet:

   Dirección IPv4 de configuración automática : 169.254.83.12
   Máscara de subred . . . . . . . . . . . .  : 255.255.0.0
   Puerta de enlace predeterminada . . . . .  :`),
      p(`Las causas, de la más frecuente a la menos:`),
      orden(
        'El cable está desconectado o dañado, o el wifi no llegó a asociarse.',
        'El servidor DHCP está apagado o el servicio se detuvo.',
        'El ámbito se quedó sin direcciones libres.',
        'El equipo está en una VLAN distinta de la del servidor y falta el agente de retransmisión.',
      ),
      codigo('Windows: soltar la dirección y pedir otra', `C:\\> ipconfig /release
C:\\> ipconfig /renew`),
      ejemplo('facil', 'Una dirección que delata el fallo', est('169.254.10.7')),
      ejemplo('facil', 'Una dirección entregada por el servidor', est('192.168.1.57')),
      ejemplo('medio', 'Un equipo que aún no tiene nada', est('0.0.0.0')),

      h('Resumen'),
      lista(
        'Un equipo necesita IP, máscara, puerta de enlace y DNS.',
        'Dirección fija para lo que debe ser localizable; DHCP para todo lo demás.',
        'DHCP = **DORA**: Discover, Offer, Request, Acknowledge. Cliente, servidor, cliente, servidor.',
        'UDP, servidor en el puerto **67** y cliente en el **68**. El Discover sale de 0.0.0.0 hacia 255.255.255.255.',
        'Los routers no pasan broadcast: para un servidor en otra red se usa `ip helper-address`.',
        'Una dirección **169.254.x.x** significa que DHCP no respondió.',
      ),

      ejercicios('Practica', 'Empieza por los mensajes y termina con los ámbitos, que requieren hacer cuentas.', [
        dora(1), dora(2), dora(3), dora(4),
        est('169.254.200.200'), est('10.0.0.84'), est('0.0.0.0'), est('192.168.50.3'),
        pool('192.168.0.0', 24, 10), pool('192.168.20.0', 24, 50), pool('192.168.30.128', 25, 10), pool('192.168.8.0', 23, 25), pool('192.168.40.32', 27, 3),
        op('¿Qué significa la sigla DORA?', ['Dynamic, Open, Routed, Addressed', 'Discover, Offer, Request, Acknowledge', 'Deliver, Obtain, Renew, Accept', 'Domain, Offer, Route, Address'], 1, 'Son los cuatro mensajes del intercambio DHCP, en orden: el cliente descubre, el servidor ofrece, el cliente solicita y el servidor confirma.'),
        op('¿Por qué el mensaje DHCP Discover se envía por broadcast?', ['Porque es más rápido', 'Porque el cliente aún no tiene dirección ni conoce la del servidor', 'Porque así llega a Internet', 'Porque UDP solo admite broadcast'], 1, 'Sin dirección propia y sin saber quién es el servidor, lo único posible es preguntar a toda la red. Un broadcast no sale a Internet: se queda en la red local.'),
        vs('¿Qué puertos y protocolo de transporte usa DHCP?', ['UDP', 'TCP', 'Puerto 67 para el servidor', 'Puerto 68 para el cliente', 'Puerto 53 para el servidor'], [0, 2, 3], 'DHCP va sobre UDP: servidor en el 67 y cliente en el 68. El 53 es el de DNS, y TCP no sirve aquí porque un equipo sin dirección no puede abrir una conexión.'),
        op('Una impresora de red debe tener siempre la misma dirección, pero quieres seguir administrándola desde el servidor DHCP. ¿Qué usas?', ['Una exclusión', 'Una reserva asociada a su dirección MAC', 'Una concesión de un minuto', 'APIPA'], 1, 'La reserva hace que el servidor entregue siempre la misma dirección a esa MAC. Una exclusión solo impide que el servidor reparta la dirección: habría que configurarla a mano en la impresora.'),
        op('El servidor DHCP está en la red 10.0.0.0/24 y los clientes en la 192.168.5.0/24, separados por un router. Los clientes reciben direcciones 169.254.x.x. ¿Qué falta?', ['Un servidor DNS', 'El comando `ip helper-address` en la interfaz del router que da a los clientes', 'Un cable cruzado', 'Activar NAT'], 1, 'El Discover es un broadcast y el router no lo reenvía. El agente de retransmisión lo convierte en un mensaje unicast dirigido al servidor.'),
        op('Un equipo con dirección APIPA, ¿con quién puede comunicarse?', ['Con todo Internet', 'Con cualquier equipo de la empresa', 'Solo con equipos del mismo enlace que también tengan una dirección 169.254.x.x', 'Con nadie'], 2, 'Una dirección APIPA no trae puerta de enlace, así que no sale de su red. Sí permite hablar con vecinos del mismo segmento que estén en el mismo bloque.'),
        rel('Relaciona cada concepto de DHCP con su descripción.', [['Ámbito', 'Rango de direcciones que el servidor puede entregar'], ['Exclusión', 'Direcciones del rango que el servidor nunca entrega'], ['Reserva', 'Dirección fija para un equipo, según su MAC'], ['Concesión', 'Tiempo durante el que la dirección pertenece al cliente']], 'Los cuatro términos aparecen en cualquier servidor DHCP, sea un router doméstico, uno Cisco o un servidor Windows.', ['Dirección del servidor de nombres']),
        op('¿Cuál de estos equipos debería tener dirección IP estática?', ['El teléfono de un visitante', 'La laptop de un vendedor', 'El router que hace de puerta de enlace', 'Una tableta de la sala de juntas'], 2, 'Todos los demás equipos de la red apuntan a la puerta de enlace: si su dirección cambiara, nadie saldría a Internet. Los equipos de usuario pueden recibir cualquier dirección.'),
        op('Un usuario puede hacer ping a `8.8.8.8` pero no abre ninguna página escribiendo su nombre. ¿Cuál de los cuatro datos de configuración está fallando?', ['La dirección IP', 'La máscara', 'La puerta de enlace', 'El servidor DNS'], 3, 'Si llega a una dirección de Internet, tiene IP, máscara y puerta de enlace correctas. Lo que no funciona es la traducción de nombres a direcciones: el DNS.'),
        ord('Ordena los cuatro mensajes del intercambio DHCP.', ['Discover', 'Offer', 'Request', 'Acknowledge'], 'DORA: el cliente descubre, el servidor ofrece, el cliente solicita y el servidor confirma.'),
      ]),
    ],
  },
];
