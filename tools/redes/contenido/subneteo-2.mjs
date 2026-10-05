// Subneteo · lecciones 7 a 13: división en subredes, diseño por hosts, otros octetos, diagnóstico, VLSM, sumarización y retos.
import { h, p, lista, orden, tabla, nota, formula, bits, ejemplo, ejercicios, op, an, td, ms } from './_ayuda.mjs';

const flsm = (base, p0, n, k) => ({ tipo: 'flsm', base, p0, n, k });
const fh = (base, p0, hosts, k) => ({ tipo: 'flsm-hosts', base, p0, h: hosts, k });
const pph = (hosts) => ({ tipo: 'prefijo-para-hosts', h: hosts });
const diag = (ip, pr, gw) => ({ tipo: 'diagnostico', ip, p: pr, gw });
const sol = (a, pa, b, pb) => ({ tipo: 'solapan', a, pa, b, pb });
const vl = (base, p0, lista_, extra) => ({ tipo: 'vlsm', base, p0, reqs: lista_.map(([nombre, hosts]) => ({ nombre, hosts })), ...(extra ? { extra: true } : {}) });
const res = (...redes) => ({ tipo: 'resumen', redes: redes.map((r) => { const [ip, pr] = r.split('/'); return { ip, p: Number(pr) }; }) });
const ene = (base, p0, p1, k) => ({ tipo: 'enesima', base, p0, p1, k });
const wc = (pr) => ({ tipo: 'wildcard', p: pr });

export default [
  /* ------------------------------------------------------------------ 7 */
  {
    slug: 'dividir-en-subredes-iguales',
    titulo: 'Dividir una red en N subredes iguales',
    resumen: 'El procedimiento completo cuando te piden «necesito tantas subredes»: cuántos bits prestar, la nueva máscara y la lista de subredes.',
    nivel: 'medio',
    objetivos: [
      'Decidir cuántos bits prestar para obtener al menos N subredes.',
      'Escribir la tabla de subredes con red, rango y broadcast.',
      'Saltar directamente a la subred número k sin listar las anteriores.',
    ],
    bloques: [
      h('El problema típico'),
      p(`«Tienes la red \`192.168.1.0/24\` y necesitas 4 subredes». Es el ejercicio clásico de subneteo. Como todas las subredes resultan del mismo tamaño, a esta técnica se le llama **subneteo de longitud fija** (FLSM, por sus siglas en inglés).`),

      h('El procedimiento en cinco pasos'),
      orden(
        '**¿Cuántos bits presto?** Busca el menor s tal que 2^s sea mayor o igual que las subredes que necesitas.',
        '**Nueva máscara.** Prefijo nuevo = prefijo original + s. Conviértelo a decimal.',
        '**Hosts por subred.** Con los bits que quedan: 2^h − 2. Comprueba que te alcanzan.',
        '**Número mágico.** 256 menos el octeto interesante de la nueva máscara. Es el salto entre subredes.',
        '**Lista las subredes** sumando el número mágico: la primera empieza en la dirección base.',
      ),
      tabla(['Subredes que necesitas', 'Bits a prestar (s)', 'Subredes que obtienes (2^s)'], [
        ['2', '1', '2'], ['3 o 4', '2', '4'], ['5 a 8', '3', '8'], ['9 a 16', '4', '16'], ['17 a 32', '5', '32'], ['33 a 64', '6', '64'], ['65 a 128', '7', '128'], ['129 a 256', '8', '256'],
      ], 'Como las subredes salen en potencias de 2, casi siempre obtienes más de las que pediste. Las que sobran quedan libres para el futuro.'),
      ejemplo('facil', 'Cuatro subredes en un /24', flsm('192.168.1.0', 24, 4, 3)),
      ejemplo('medio', 'Seis subredes: se obtienen ocho', flsm('192.168.1.0', 24, 6, 5), 'Pediste 6 y salieron 8. No existe forma de obtener exactamente 6 subredes iguales: las dos que sobran se guardan.'),
      ejemplo('medio', 'Diez subredes en un /24', flsm('192.168.50.0', 24, 10, 9)),

      h('Saltar a la subred número k'),
      p(`No hace falta escribir toda la lista para llegar a una subred concreta. Como la primera subred (la n.º 1) empieza en la base, la n.º k empieza **(k − 1) saltos** después.`),
      formula('inicio de la subred k = base + (k − 1) × tamaño del bloque', [['k', 'número de subred, contando desde 1'], ['tamaño del bloque', 'direcciones de cada subred = 2^h']],
        'Para la subred 5 de bloques de 32: (5 − 1) × 32 = 128. Empieza en .128.'),
      nota('aviso', `Atento a cómo se cuentan las subredes en cada enunciado. En este curso la primera es siempre la **n.º 1**. Algunos libros la llaman «subred 0»: en ese caso la fórmula es base + k × bloque. Lee el enunciado antes de multiplicar.`),

      h('Con redes de clase B'),
      p(`El procedimiento es idéntico con un /16; solo cambia el octeto donde ocurre el salto. Cuando los bits prestados llenan justo un octeto (de /16 a /24), el tercer octeto funciona directamente como contador de subredes.`),
      ejemplo('medio', 'Doscientas subredes en una clase B', flsm('172.16.0.0', 16, 200, 150), 'Con 8 bits prestados el salto es de 1 en el tercer octeto: la subred 150 es simplemente `172.16.149.0`.'),
      ejemplo('dificil', 'Más de 256 subredes: el salto baja al cuarto octeto', flsm('172.16.0.0', 16, 1000, 600), 'Al prestar 10 bits la numeración de subredes ocupa todo el tercer octeto y dos bits del cuarto. El desplazamiento en octetos lo hace la suma: fíjate en cómo `0.0.149.192` se añade a la base.'),

      ejercicios('Practica', 'Para cada red: bits prestados, nueva máscara, hosts por subred y los datos de la subred indicada.', [
        flsm('192.168.10.0', 24, 2, 2), flsm('192.168.20.0', 24, 4, 2), flsm('192.168.30.0', 24, 5, 6), flsm('192.168.40.0', 24, 8, 8),
        flsm('192.168.60.0', 24, 12, 11), flsm('192.168.70.0', 24, 20, 17), flsm('10.10.10.0', 24, 40, 33), flsm('192.168.90.0', 24, 3, 4),
        flsm('172.16.0.0', 16, 256, 100), flsm('172.20.0.0', 16, 130, 77), flsm('10.0.0.0', 8, 256, 201), flsm('172.30.0.0', 16, 500, 300),
        op('Necesitas 9 subredes. ¿Cuántos bits debes prestar?', ['3', '4', '5', '9'], 1, '2^3 = 8 no alcanza para 9. 2^4 = 16 sí: se prestan 4 bits y sobran 7 subredes.'),
        op('Divides `192.168.1.0/24` en 16 subredes. ¿Cuántos equipos caben en cada una?', ['16', '14', '30', '6'], 1, 'Se prestan 4 bits: quedan 4 de host. 2^4 − 2 = 14.'),
        op('En `192.168.1.0/24` dividida en /27, ¿dónde empieza la subred n.º 6 (la primera es la n.º 1)?', ['`192.168.1.192`', '`192.168.1.160`', '`192.168.1.128`', '`192.168.1.6`'], 1, 'El bloque de /27 es 32. (6 − 1) × 32 = 160.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 8 */
  {
    slug: 'disenar-segun-los-hosts',
    titulo: 'Diseñar a partir de los hosts',
    resumen: 'Cuando el dato es «necesito tantos equipos por subred»: cómo elegir el prefijo justo y no caer en las trampas de las fronteras.',
    nivel: 'medio',
    objetivos: [
      'Elegir el prefijo más ajustado para una cantidad de equipos.',
      'Evitar el error de olvidar la dirección de red y la de broadcast.',
      'Dividir una red sabiendo cuántos hosts debe tener cada subred.',
    ],
    bloques: [
      h('Empezar por el otro lado'),
      p(`En la lección anterior el dato era el número de subredes y se contaban bits desde la izquierda. Ahora el dato es **cuántos equipos debe alojar cada subred**, y se cuentan bits desde la derecha: primero se reservan los bits de host necesarios y lo que sobra queda para subredes.`),
      orden(
        'Suma **2** a los equipos que necesitas (la dirección de red y la de broadcast también ocupan sitio).',
        'Busca la **menor potencia de 2** que sea mayor o igual que ese número. Si es 2^h, necesitas h bits de host.',
        'El prefijo es **32 − h**.',
      ),
      formula('2^h − 2 ≥ equipos necesarios', [['h', 'bits de host: el más pequeño que cumple la desigualdad']], 'Y después: prefijo = 32 − h.'),
      tabla(['Equipos que necesitas', 'Bits de host (h)', 'Bloque (2^h)', 'Prefijo', 'Máscara'], [
        ['1 – 2', '2', '4', '/30', '255.255.255.252'],
        ['3 – 6', '3', '8', '/29', '255.255.255.248'],
        ['7 – 14', '4', '16', '/28', '255.255.255.240'],
        ['15 – 30', '5', '32', '/27', '255.255.255.224'],
        ['31 – 62', '6', '64', '/26', '255.255.255.192'],
        ['63 – 126', '7', '128', '/25', '255.255.255.128'],
        ['127 – 254', '8', '256', '/24', '255.255.255.0'],
        ['255 – 510', '9', '512', '/23', '255.255.254.0'],
        ['511 – 1,022', '10', '1,024', '/22', '255.255.252.0'],
        ['1,023 – 2,046', '11', '2,048', '/21', '255.255.248.0'],
      ]),
      ejemplo('facil', 'Una oficina de 50 equipos', pph(50)),
      ejemplo('facil', 'Un enlace entre dos routers', pph(2)),
      ejemplo('medio', 'Justo en el límite: 30 equipos', pph(30), '30 es exactamente lo que da un /27. Cabe, pero sin una sola dirección libre: si mañana llega un equipo más, hay que rehacer la subred.'),
      ejemplo('medio', 'Un equipo más: 31', pph(31), 'Un solo equipo de diferencia obliga a duplicar el bloque. Por eso las fronteras 14, 30, 62, 126, 254 son las que más aparecen en exámenes.'),
      ejemplo('dificil', 'La trampa del 2^n exacto: 64 equipos', pph(64), 'Mucha gente responde /26 porque «64 = 2^6». Pero un /26 tiene 64 direcciones y solo 62 son asignables. Hacen falta 7 bits.'),
      ejemplo('dificil', 'Una red de campus', pph(500)),
      nota('error', `Los tres valores donde más se falla son **2^n − 1**, **2^n** y **2^n − 2**. Para 62 equipos sirve un /26; para 63 y para 64 ya no. Suma siempre el 2 antes de buscar la potencia.`),
      nota('truco', `En un diseño real nunca ajustes al límite. Si hoy hay 28 equipos, un /27 (30 hosts) se queda corto en cuanto crezca el departamento. Lo habitual es prever el crecimiento y elegir el bloque para la cifra futura. En los ejercicios, en cambio, se pide el bloque **más pequeño que sirva** para la cifra dada.`),

      h('Dividir una red según los hosts'),
      p(`Si además te dan la red base, el número de subredes sale solo: son los bits que quedan entre el prefijo original y el nuevo.`),
      formula('subredes = 2^(prefijo nuevo − prefijo original)', [], 'Primero se fija el prefijo nuevo por los hosts; después se cuenta cuántas subredes de ese tamaño caben en la red base.'),
      ejemplo('medio', 'Subredes de 25 equipos en un /24', fh('192.168.10.0', 24, 25, 4)),
      ejemplo('medio', 'Subredes de 200 equipos en una clase B', fh('172.16.0.0', 16, 200, 10)),
      ejemplo('dificil', 'Subredes de 1,000 equipos en una clase B', fh('172.16.0.0', 16, 1000, 5), 'Cada subred ocupa 1,024 direcciones, es decir, cuatro valores del tercer octeto. La lección siguiente trabaja este tipo de cortes con detalle.'),

      ejercicios('Practica', 'Recuerda: equipos + 2, siguiente potencia de 2, y prefijo = 32 − bits de host.', [
        pph(5), pph(6), pph(7), pph(14), pph(20), pph(60), pph(62), pph(63), pph(100), pph(126), pph(127), pph(254), pph(255), pph(300), pph(1000), pph(2000),
        fh('192.168.1.0', 24, 12, 5), fh('192.168.2.0', 24, 60, 3), fh('192.168.3.0', 24, 6, 20), fh('192.168.4.0', 24, 2, 40),
        fh('172.16.0.0', 16, 250, 100), fh('10.0.0.0', 8, 65000, 37),
        op('Necesitas una subred para 16 equipos. ¿Qué prefijo eliges?', ['/28', '/27', '/26', '/29'], 1, 'Un /28 tiene 16 direcciones pero solo 14 asignables. Para 16 equipos hacen falta 18 direcciones: el siguiente bloque es 32, un /27.'),
        op('¿Cuántos equipos admite como máximo una subred con máscara `255.255.255.248`?', ['8', '6', '4', '14'], 1, '248 deja 3 bits de host: 2^3 − 2 = 6.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 9 */
  {
    slug: 'tercer-y-segundo-octeto',
    titulo: 'Cuando el corte cae en el tercer o en el segundo octeto',
    resumen: 'El mismo número mágico aplicado a prefijos /17 a /23 y /9 a /15, donde los hosts ocupan más de un octeto.',
    nivel: 'dificil',
    objetivos: [
      'Aplicar el número mágico en el tercer y en el segundo octeto.',
      'Calcular rangos de host que abarcan varios octetos sin equivocarse con los 0 y los 255.',
      'Reconocer direcciones terminadas en .0 o .255 que son hosts válidos.',
    ],
    bloques: [
      h('Nada cambia, salvo el octeto'),
      p(`Hasta ahora el octeto interesante era el cuarto. Con prefijos entre /17 y /23 es el **tercero**; con prefijos entre /9 y /15 es el **segundo**. El método es exactamente el mismo, con una diferencia: a la derecha del octeto interesante quedan octetos enteros que son todo host.`),
      tabla(['Prefijo', 'Octeto interesante', 'Octetos que se copian de la IP', 'Octetos que son todo host'], [
        ['/25 – /30', '4.º', '1.º, 2.º y 3.º', 'ninguno'],
        ['/17 – /23', '3.º', '1.º y 2.º', '4.º'],
        ['/9 – /15', '2.º', '1.º', '3.º y 4.º'],
      ]),
      orden(
        'Copia los octetos que están a la **izquierda** del interesante.',
        'En el octeto interesante, aplica el número mágico: el múltiplo que no se pasa es el valor de la **red**; el siguiente múltiplo menos 1 es el valor del **broadcast**.',
        'En los octetos a la **derecha**: todo **0** para la red, todo **255** para el broadcast.',
        'Primer host = red + 1 (termina en .1). Último host = broadcast − 1 (termina en .254).',
      ),
      bits([['IP', '172.16.45.200', 20], ['Máscara', '255.255.240.0', 20], ['Red', '172.16.32.0', 20], ['Broadcast', '172.16.47.255', 20]],
        'Con /20 el corte está en mitad del tercer octeto. Los 4 bits de host de ese octeto y los 8 del cuarto valen 0 en la red y 1 en el broadcast.'),
      ejemplo('medio', 'Un /20: bloques de 16 en el tercer octeto', an('172.16.45.200', 20)),
      ejemplo('medio', 'Un /22: bloques de 4', an('10.50.130.7', 22)),
      ejemplo('dificil', 'Un /23: el bloque más pequeño del tercer octeto', an('192.168.37.129', 23), 'Con /23 las redes empiezan siempre en un tercer octeto **par**. El impar siguiente pertenece a la misma red.'),
      ejemplo('dificil', 'Un /18 en una clase B', an('172.20.100.50', 18)),

      h('El segundo octeto'),
      p(`Con /9 a /15 ocurre lo mismo un octeto más a la izquierda. Los rangos son enormes, pero la cuenta no es más difícil: solo hay más octetos que rellenar con 0 o con 255.`),
      ejemplo('dificil', 'Un /13: bloques de 8 en el segundo octeto', an('10.200.15.1', 13)),
      ejemplo('experto', 'Un /11', an('10.75.250.99', 11)),

      h('Los .0 y .255 que sí son hosts'),
      p(`Cuando la parte de host abarca más de un octeto, hay muchas direcciones que terminan en .0 o en .255 y son equipos normales. Lo que hace especial a una dirección son **todos** sus bits de host a la vez, no los del último octeto.`),
      ejemplo('medio', 'Termina en 255 y es un host', td('172.16.1.255', 22)),
      ejemplo('medio', 'Termina en 0 y es un host', td('172.16.5.0', 22)),
      ejemplo('dificil', 'Termina en 255 y sí es el broadcast', td('172.16.7.255', 21)),
      nota('aviso', `Asignar \`172.16.1.255/22\` a un equipo es válido, aunque algunos programas antiguos lo rechazan por prudencia. El broadcast real de esa subred es \`172.16.3.255\`: los 10 bits de host en 1.`),

      h('Dividir redes grandes'),
      p(`Las divisiones de la lección 7 funcionan igual cuando el salto cae en el tercer octeto. La tabla de subredes avanza de bloque en bloque en ese octeto, y el cuarto empieza siempre en 0.`),
      ejemplo('medio', 'Diez subredes en una clase B', { tipo: 'flsm', base: '172.16.0.0', p0: 16, n: 10, k: 7 }),
      ejemplo('dificil', 'Subredes de 2,000 equipos en una clase A', { tipo: 'flsm-hosts', base: '10.0.0.0', p0: 8, h: 2000, k: 300 }, 'Cuando la subred pedida está lejos, el desplazamiento se calcula multiplicando y se pasa a octetos: es más seguro que contar bloques a mano.'),

      ejercicios('Practica', 'Identifica primero en qué octeto cae el corte. Después, el mismo número mágico de siempre.', [
        an('172.16.10.5', 23), an('172.16.99.200', 22), an('10.1.50.50', 21), an('172.18.200.1', 20), an('192.168.130.77', 19), an('172.31.70.70', 18), an('10.10.200.10', 17),
        an('10.33.1.1', 15), an('10.100.0.9', 14), an('10.140.20.30', 12), an('10.222.5.5', 10), an('172.25.14.255', 21),
        td('10.0.3.255', 22), td('10.0.2.0', 22), td('10.0.4.0', 22), td('172.18.6.255', 21), td('172.16.63.255', 18), td('192.168.9.0', 23), td('192.168.9.255', 23), td('10.40.255.255', 12),
        { tipo: 'flsm', base: '172.16.0.0', p0: 16, n: 6, k: 4 }, { tipo: 'flsm', base: '10.0.0.0', p0: 8, n: 30, k: 21 },
        { tipo: 'flsm-hosts', base: '172.16.0.0', p0: 16, h: 500, k: 20 }, { tipo: 'flsm-hosts', base: '10.0.0.0', p0: 8, h: 4000, k: 100 },
        op('¿En qué octeto está el número mágico de un /19?', ['Primero', 'Segundo', 'Tercero', 'Cuarto'], 2, 'Los prefijos de /17 a /23 cortan el tercer octeto. Para /19 la máscara es `255.255.224.0` y el número mágico es 32.'),
        op('¿Cuál es el broadcast de `172.16.64.0/18`?', ['`172.16.64.255`', '`172.16.127.255`', '`172.16.128.255`', '`172.16.255.255`'], 1, 'Número mágico 64 en el tercer octeto: la red siguiente empieza en 128, así que el tercer octeto del broadcast es 127 y el cuarto, 255.'),
      ]),
    ],
  },

  /* ----------------------------------------------------------------- 10 */
  {
    slug: 'misma-subred-y-diagnostico',
    titulo: '¿Misma subred? Puerta de enlace, solapes y diagnóstico',
    resumen: 'Cómo decide un equipo si el destino es vecino o está lejos, qué debe cumplir la puerta de enlace y cómo detectar configuraciones rotas.',
    nivel: 'dificil',
    objetivos: [
      'Determinar si dos equipos están en la misma subred.',
      'Detectar los cuatro errores de configuración IP más frecuentes.',
      'Comprobar si dos redes se solapan antes de usarlas a la vez.',
    ],
    bloques: [
      h('Cómo decide un equipo a quién le entrega el paquete'),
      p(`Antes de enviar cualquier paquete, el equipo hace una comprobación con **su propia máscara**:`),
      orden(
        'Calcula su red: su IP AND su máscara.',
        'Calcula la red del destino con esa misma máscara: IP de destino AND su máscara.',
        'Si las dos redes coinciden, el destino es un **vecino**: lo busca en la red local (con ARP) y le entrega el paquete directamente.',
        'Si no coinciden, el destino está en **otra red**: entrega el paquete a su **puerta de enlace** (el router) para que lo reenvíe.',
      ),
      nota('clave', `Dos equipos están en la misma subred si, aplicando la misma máscara, obtienen **la misma dirección de red**. No basta con que se parezcan los primeros octetos.`),
      ejemplo('facil', 'Parecen vecinos y no lo son', ms('192.168.1.60', '192.168.1.70', 26), 'Las dos direcciones comparten `192.168.1`, pero con /26 la frontera está en 64: una queda a cada lado.'),
      ejemplo('facil', 'Lejos en apariencia, misma subred', ms('192.168.1.130', '192.168.1.190', 26)),
      ejemplo('medio', 'Distinto tercer octeto, misma subred', ms('172.16.4.200', '172.16.7.10', 22), 'Con /22 los terceros octetos 4, 5, 6 y 7 forman una sola red. Que el tercer octeto sea distinto no implica redes distintas.'),
      ejemplo('dificil', 'Vecinos por un solo número', ms('10.1.31.250', '10.1.32.5', 19)),

      h('La puerta de enlace'),
      p(`La puerta de enlace (gateway) es la dirección del router dentro de la subred del equipo. Como el equipo solo puede entregar paquetes directamente a su propia subred, el gateway **tiene que estar en la misma subred que él** y ser una dirección de host válida. Por costumbre se usa la primera o la última dirección asignable del rango, pero cualquiera sirve.`),
      tabla(['Error', 'Síntoma', 'Por qué ocurre'], [
        ['La IP del equipo es la dirección de red', 'El sistema la rechaza o nadie le responde', 'Esa dirección nombra a la subred; no es de ningún equipo.'],
        ['La IP del equipo es el broadcast', 'El sistema la rechaza o el tráfico se comporta de forma errática', 'Esa dirección significa «todos los de la subred».'],
        ['El gateway está en otra subred', 'Funciona la red local, pero no se sale a otras redes ni a Internet', 'El equipo no puede entregar nada a un router que no es su vecino.'],
        ['El gateway es la red o el broadcast', 'Igual que el anterior', 'Ningún router puede tener esa dirección.'],
        ['Máscara distinta a la de los vecinos', 'Algunos equipos de la misma red no se alcanzan', 'Cada uno calcula una frontera diferente y no se ponen de acuerdo en quién es vecino.'],
      ]),
      ejemplo('facil', 'Una configuración bien hecha', diag('192.168.1.50', 27, '192.168.1.33')),
      ejemplo('medio', 'El gateway «de siempre» que ya no sirve', diag('192.168.1.50', 28, '192.168.1.1'), 'Es el fallo típico después de subnetear: se cambia la máscara y se deja el gateway `.1` de cuando la red era un /24.'),
      ejemplo('medio', 'Una IP que no se puede asignar', diag('192.168.10.95', 27, '192.168.10.65')),
      ejemplo('dificil', 'Un .0 que esta vez sí es la red', diag('10.0.4.0', 22, '10.0.4.1')),
      ejemplo('dificil', 'El gateway en el último número del bloque', diag('172.16.20.9', 29, '172.16.20.15')),

      h('Redes que se solapan'),
      p(`Dos redes se solapan cuando comparten direcciones. Si configuras dos segmentos distintos con redes solapadas, el router no sabe por cuál interfaz enviar los paquetes de la zona común, y normalmente se niega a aceptar la segunda.

Los bloques CIDR tienen una propiedad útil: **nunca se cruzan a medias**. O uno está completamente dentro del otro, o no comparten nada.`),
      orden(
        'Toma el prefijo **más corto** de los dos (el de la red más grande).',
        'Aplícalo a las dos direcciones.',
        'Si el resultado es la misma red, la pequeña está **dentro** de la grande: se solapan. Si no, son independientes.',
      ),
      ejemplo('facil', 'Una mitad dentro del todo', sol('192.168.1.0', 24, '192.168.1.128', 25)),
      ejemplo('medio', 'Contiguas pero independientes', sol('10.1.0.0', 23, '10.1.2.0', 24)),
      ejemplo('dificil', 'La grande no es la que parece', sol('172.16.8.0', 22, '172.16.0.0', 20)),

      ejercicios('Practica', 'Calcula siempre las redes completas antes de decidir.', [
        ms('192.168.1.10', '192.168.1.100', 25), ms('192.168.1.120', '192.168.1.130', 25), ms('192.168.5.33', '192.168.5.62', 27), ms('192.168.5.62', '192.168.5.65', 27),
        ms('10.0.0.14', '10.0.0.17', 28), ms('172.16.9.1', '172.16.10.1', 23), ms('172.16.10.1', '172.16.11.254', 23), ms('10.8.255.1', '10.15.0.1', 13),
        diag('192.168.1.100', 26, '192.168.1.65'), diag('192.168.1.100', 26, '192.168.1.1'), diag('192.168.1.64', 26, '192.168.1.65'), diag('192.168.20.31', 28, '192.168.20.17'),
        diag('10.10.10.10', 29, '10.10.10.8'), diag('172.16.5.200', 22, '172.16.7.254'), diag('172.16.8.20', 22, '172.16.7.254'), diag('192.168.1.130', 25, '192.168.1.255'),
        sol('192.168.0.0', 23, '192.168.1.0', 24), sol('192.168.2.0', 24, '192.168.3.0', 24), sol('10.0.0.0', 8, '10.200.4.0', 22), sol('172.16.32.0', 20, '172.16.48.0', 20),
        sol('192.168.1.64', 27, '192.168.1.0', 25), sol('172.16.16.0', 21, '172.16.24.0', 22),
        op('Un equipo con `192.168.1.200/25` quiere enviar un paquete a `192.168.1.50`. ¿Qué hace?', ['Lo entrega directamente: comparten los tres primeros octetos', 'Lo envía a su puerta de enlace, porque el destino está en otra subred', 'Lo descarta', 'Lo envía por broadcast a toda la red'], 1, 'Con /25 la red de `.200` es `192.168.1.128` y la de `.50` es `192.168.1.0`. Son subredes distintas: el paquete va al router.'),
        op('Un equipo alcanza a sus vecinos pero no sale a Internet. ¿Qué revisarías primero?', ['Que la IP no sea de clase A', 'Que la puerta de enlace pertenezca a la misma subred que el equipo', 'Que la máscara sea 255.255.255.255', 'Que el broadcast termine en 255'], 1, 'Si la red local funciona, la IP y la máscara son coherentes con los vecinos. Lo que falla es la salida: el gateway debe ser una dirección válida de la misma subred.'),
      ]),
    ],
  },

  /* ----------------------------------------------------------------- 11 */
  {
    slug: 'vlsm',
    titulo: 'VLSM: subredes de distinto tamaño',
    resumen: 'Cómo repartir una red entre departamentos de tamaños muy distintos sin desperdiciar direcciones, de mayor a menor y sin solapes.',
    nivel: 'dificil',
    objetivos: [
      'Explicar por qué las subredes iguales desperdician direcciones.',
      'Diseñar un plan de direccionamiento con VLSM de mayor a menor.',
      'Asignar enlaces entre routers con /30 y calcular el espacio libre.',
    ],
    bloques: [
      h('El problema de las subredes iguales'),
      p(`Una empresa tiene la red \`192.168.1.0/24\` y necesita cuatro subredes: una de 100 equipos, una de 50, una de 20 y un enlace entre dos routers (2 direcciones).

Con subredes iguales harían falta 4 subredes, es decir /26, con 62 equipos cada una. La de 100 equipos **no cabe**. Y aunque cupiera, el enlace de 2 direcciones ocuparía un bloque de 64. El problema no es la falta de direcciones (hay 254 y se necesitan 172), sino que están mal repartidas.`),
      p(`**VLSM** (máscara de subred de longitud variable) resuelve esto: cada subred recibe **la máscara que le corresponde por su tamaño**. En una misma red conviven un /25, un /26, un /27 y un /30.`),
      tabla(['Subred', 'Equipos', 'Con subredes iguales (/26)', 'Con VLSM'], [
        ['Producción', '100', 'no cabe (62)', '/25 → 126 hosts'],
        ['Oficinas', '50', '62 hosts', '/26 → 62 hosts'],
        ['Almacén', '20', '62 hosts (sobran 42)', '/27 → 30 hosts'],
        ['Enlace entre routers', '2', '62 hosts (sobran 60)', '/30 → 2 hosts'],
      ]),

      h('El método'),
      orden(
        '**Ordena** las subredes de **mayor a menor** número de equipos.',
        'Para cada una calcula su **bloque**: equipos + 2, redondeado a la siguiente potencia de 2. De ahí sale su prefijo (lección 8).',
        'La primera subred empieza en la **dirección base** de la red.',
        'Cada subred siguiente empieza en la dirección **inmediatamente posterior al broadcast** de la anterior.',
        'Al final, comprueba que la última subred no se sale de la red base. Lo que sobra queda libre.',
      ),
      nota('clave', `**¿Por qué de mayor a menor?** Una subred solo puede empezar en un múltiplo de su propio tamaño: un bloque de 64 empieza en 0, 64, 128 o 192, nunca en 4. Si colocas primero los bloques pequeños, el siguiente bloque grande tendría que saltar hasta su próximo múltiplo y dejaría un hueco. Colocando primero los grandes, cada bloque termina siempre en un punto donde el siguiente, más pequeño, puede empezar.`),
      ejemplo('medio', 'El caso de la introducción', vl('192.168.1.0', 24, [['Producción', 100], ['Oficinas', 50], ['Almacén', 20], ['Enlace entre routers', 2]])),
      ejemplo('medio', 'Requisitos desordenados y dos enlaces', vl('192.168.10.0', 24, [['Soporte', 28], ['Enlace WAN 1', 2], ['Ventas', 60], ['Dirección', 12], ['Enlace WAN 2', 2]]), 'La tabla venía desordenada: lo primero fue ordenarla. Los dos enlaces empatan, así que conservan su orden.'),
      nota('truco', `Los enlaces entre dos routers solo necesitan 2 direcciones: siempre reciben un **/30**. Van al final del plan, en los huecos más pequeños.`),
      ejemplo('dificil', 'Una red /22 con seis subredes', vl('172.16.0.0', 22, [['Estudiantes', 400], ['Docentes', 200], ['Administración', 100], ['Laboratorio', 50], ['Enlace WAN 1', 2], ['Enlace WAN 2', 2]]), 'Aquí los bloques grandes ocupan más de un valor del tercer octeto. Fíjate en cómo «broadcast + 1» hace avanzar el tercer octeto cuando el cuarto llega a 255.'),
      ejemplo('experto', 'Un campus sobre un /20', vl('10.10.0.0', 20, [['Residencias', 1000], ['Aulas norte', 500], ['Aulas sur', 500], ['Biblioteca', 250], ['Laboratorios', 120], ['Administración', 60], ['Enlace WAN 1', 2], ['Enlace WAN 2', 2], ['Enlace WAN 3', 2]], true)),

      h('Comprobar un plan VLSM'),
      lista(
        '**Ninguna subred se solapa** con otra: cada una empieza después del broadcast de la anterior.',
        '**Cada red es válida para su máscara**: su dirección de inicio es múltiplo de su tamaño de bloque.',
        '**Todo cabe en la red base**: el último broadcast no supera el broadcast de la red original.',
        '**Cada subred tiene hosts suficientes**: 2^h − 2 es mayor o igual que los equipos pedidos.',
      ),
      nota('aviso', `VLSM exige que los routers anuncien la máscara junto con cada red. Todos los protocolos de enrutamiento actuales lo hacen (OSPF, EIGRP, RIPv2, BGP). Los antiguos protocolos «con clase», como RIPv1, no enviaban la máscara y no admiten VLSM.`),

      ejercicios('Practica', 'Ordena de mayor a menor, calcula bloques y encadena: cada subred empieza donde termina la anterior. Las redes se escriben como dirección/prefijo.', [
        vl('192.168.5.0', 24, [['Ventas', 50], ['Soporte', 25], ['Dirección', 10]]),
        vl('192.168.20.0', 24, [['Planta', 100], ['Oficinas', 60], ['Enlace WAN', 2]]),
        vl('192.168.30.0', 24, [['Aula 1', 28], ['Aula 2', 28], ['Docentes', 12], ['Servidores', 5]]),
        vl('10.0.8.0', 24, [['Invitados', 30], ['Cámaras', 14], ['Operaciones', 120], ['Telefonía', 30], ['Enlace WAN', 2]]),
        vl('192.168.40.0', 24, [['Recepción', 5], ['Enlace WAN 1', 2], ['Ingeniería', 61], ['Enlace WAN 2', 2], ['Finanzas', 13], ['Marketing', 29], ['Enlace WAN 3', 2]]),
        vl('172.16.4.0', 23, [['Piso 1', 200], ['Piso 2', 100], ['Piso 3', 50], ['Servidores', 20], ['Enlace WAN 1', 2], ['Enlace WAN 2', 2]]),
        vl('172.20.0.0', 21, [['Sede central', 800], ['Sucursal norte', 400], ['Sucursal sur', 150], ['Centro de datos', 60], ['Enlace WAN 1', 2], ['Enlace WAN 2', 2]], true),
        vl('10.50.0.0', 16, [['Región 1', 8000], ['Región 2', 4000], ['Región 3', 2000], ['Región 4', 1000], ['Región 5', 500], ['Región 6', 250], ['Enlace WAN 1', 2], ['Enlace WAN 2', 2], ['Enlace WAN 3', 2], ['Enlace WAN 4', 2]], true),
        op('En VLSM, ¿por qué se asignan primero las subredes más grandes?', ['Porque son las más importantes', 'Porque cada bloque debe empezar en un múltiplo de su tamaño, y así no quedan huecos', 'Porque los routers leen la tabla de arriba abajo', 'Porque las pequeñas no necesitan broadcast'], 1, 'Un bloque grande solo puede empezar en múltiplos de su tamaño. Si se colocan primero los pequeños, el grande tiene que saltar hasta su siguiente múltiplo y deja direcciones sin usar.'),
        op('¿Qué prefijo se asigna normalmente a un enlace entre dos routers?', ['/24', '/28', '/29', '/30'], 3, 'Solo hacen falta 2 direcciones asignables: 2^2 − 2 = 2, es decir, un /30.'),
        op('Tras asignar `192.168.1.0/25` y `192.168.1.128/26`, ¿dónde empieza la siguiente subred?', ['`192.168.1.129`', '`192.168.1.190`', '`192.168.1.192`', '`192.168.1.193`'], 2, 'El /26 ocupa de 128 a 191 (broadcast). La siguiente subred empieza en la dirección posterior: 192.'),
      ]),
    ],
  },

  /* ----------------------------------------------------------------- 12 */
  {
    slug: 'sumarizacion-de-rutas',
    titulo: 'Sumarización de rutas (supernetting)',
    resumen: 'El proceso inverso al subneteo: agrupar varias redes contiguas en una sola ruta contando los bits que tienen en común.',
    nivel: 'dificil',
    objetivos: [
      'Calcular la ruta resumen de un grupo de redes.',
      'Reconocer cuándo un resumen es exacto y cuándo anuncia direcciones de más.',
      'Entender la relación entre subnetear y sumarizar.',
    ],
    bloques: [
      h('Para qué sirve resumir'),
      p(`Un router guarda una ruta por cada red que conoce. Si detrás de él hay ocho subredes, sus vecinos tendrían que aprender ocho rutas que apuntan todas al mismo sitio. **Sumarizar** es sustituirlas por **una sola ruta** que las incluya a todas.`),
      lista(
        'Las tablas de rutas son más pequeñas y las búsquedas, más rápidas.',
        'Los cambios se propagan menos: si una de las ocho subredes cae, los vecinos ni se enteran, porque el resumen sigue siendo válido.',
        'Es lo que permite que Internet funcione: los proveedores anuncian bloques enormes en lugar de millones de redes sueltas.',
      ),
      p(`Sumarizar es **subnetear al revés**. Al subnetear se alarga la máscara y los bits pasan de host a red. Al sumarizar se **acorta** la máscara: los bits que diferenciaban a las subredes vuelven a ser de host. Por eso también se llama **supernetting**: el resultado es una «superred».`),
      bits([['Red 1', '192.168.0.0', 24, 22], ['Red 2', '192.168.1.0', 24, 22], ['Red 3', '192.168.2.0', 24, 22], ['Red 4', '192.168.3.0', 24, 22]],
        'Las cuatro redes comparten los 22 bits azules y solo se diferencian en los 2 bits ámbar. El resumen es `192.168.0.0/22`.'),

      h('El método'),
      orden(
        'Toma la **dirección más baja** del grupo (la dirección de red de la primera) y la **más alta** (el broadcast de la última).',
        'Escribe en **binario** el primer octeto en el que difieren.',
        'Cuenta cuántos bits tienen **en común empezando por la izquierda**. Súmales los bits de los octetos anteriores (8 por cada uno).',
        'Ese total es el **prefijo** del resumen. La **dirección** del resumen conserva los bits comunes y pone el resto en 0.',
      ),
      ejemplo('facil', 'Dos mitades vuelven a ser un todo', res('192.168.10.0/25', '192.168.10.128/25')),
      ejemplo('medio', 'Cuatro redes /24', res('192.168.0.0/24', '192.168.1.0/24', '192.168.2.0/24', '192.168.3.0/24')),
      ejemplo('medio', 'Ocho redes /24 que no empiezan en cero', res('172.16.8.0/24', '172.16.9.0/24', '172.16.10.0/24', '172.16.11.0/24', '172.16.12.0/24', '172.16.13.0/24', '172.16.14.0/24', '172.16.15.0/24')),
      nota('truco', `Atajo para redes /24 seguidas: si son **2^n redes** y el tercer octeto de la primera es **múltiplo de 2^n**, el resumen es exacto y su prefijo es **24 − n**. Ocho redes que empiezan en 8 (múltiplo de 8): 24 − 3 = /21. En general, el grupo debe empezar justo donde empezaría un bloque de su tamaño total.`),

      h('Cuando el resumen anuncia de más'),
      p(`No siempre las redes forman un bloque perfecto. Si son 3, o si son 4 pero no empiezan en un múltiplo de 4, el resumen más ajustado **incluye direcciones que no están en la lista**.`),
      ejemplo('medio', 'Tres redes: el resumen incluye una cuarta', res('10.1.4.0/24', '10.1.5.0/24', '10.1.6.0/24'), 'El resumen `/22` cubre también `10.1.7.0/24`. Si esa red no existe, el router atraerá tráfico hacia ella y lo descartará; si existe en otra parte de la red, habrá un problema de enrutamiento.'),
      ejemplo('dificil', 'Dos redes vecinas mal alineadas', res('10.1.3.0/24', '10.1.4.0/24'), 'Son solo dos redes contiguas, pero 3 es `011` y 4 es `100`: no comparten casi ningún bit en el tercer octeto. El resumen tiene que abarcar de 0 a 7, ocho redes para cubrir dos. En estos casos suele ser mejor anunciar las dos rutas por separado.'),
      ejemplo('dificil', 'Redes de distinto tamaño', res('172.16.64.0/20', '172.16.80.0/20', '172.16.96.0/19')),
      ejemplo('experto', 'Subredes dispersas dentro de un bloque', res('10.20.33.0/24', '10.20.40.128/25', '10.20.44.0/22', '10.20.36.64/26')),
      nota('aviso', `Antes de configurar un resumen comprueba **qué más cabe dentro**. Un resumen exacto es seguro. Uno que cubre de más solo es aceptable si los rangos sobrantes no se usan en ningún otro sitio de la red.`),

      ejercicios('Practica', 'Dirección más baja, dirección más alta, bits comunes. La respuesta se escribe como dirección/prefijo.', [
        res('192.168.4.0/24', '192.168.5.0/24'),
        res('192.168.16.0/24', '192.168.17.0/24', '192.168.18.0/24', '192.168.19.0/24'),
        res('10.0.0.0/25', '10.0.0.128/25'),
        res('172.16.0.0/24', '172.16.1.0/24', '172.16.2.0/24', '172.16.3.0/24', '172.16.4.0/24', '172.16.5.0/24', '172.16.6.0/24', '172.16.7.0/24'),
        res('192.168.1.0/26', '192.168.1.64/26', '192.168.1.128/26', '192.168.1.192/26'),
        res('10.4.0.0/16', '10.5.0.0/16', '10.6.0.0/16', '10.7.0.0/16'),
        res('172.16.32.0/20', '172.16.48.0/20'),
        res('192.168.8.0/24', '192.168.9.0/24', '192.168.10.0/24'),
        res('10.10.7.0/24', '10.10.8.0/24'),
        res('172.20.16.0/22', '172.20.20.0/22', '172.20.24.0/21'),
        res('192.168.100.0/27', '192.168.100.32/27', '192.168.100.64/26'),
        res('10.100.0.0/14', '10.104.0.0/14', '10.108.0.0/15'),
        op('Sumarizar varias redes consiste en…', ['alargar la máscara para crear más subredes', 'acortar la máscara para que varias redes queden dentro de un solo bloque', 'cambiar la clase de la dirección', 'eliminar las direcciones de broadcast'], 1, 'Es la operación inversa al subneteo: se devuelven bits a la parte de host, la máscara se acorta y el bloque resultante contiene a todas las redes.'),
        op('¿Cuál es el resumen exacto de 16 redes /24 seguidas que empiezan en `10.1.32.0`?', ['`10.1.32.0/20`', '`10.1.32.0/21`', '`10.1.0.0/16`', '`10.1.32.0/28`'], 0, '16 = 2^4 redes y 32 es múltiplo de 16: el prefijo es 24 − 4 = /20, que cubre de `10.1.32.0` a `10.1.47.255`.'),
      ]),
    ],
  },

  /* ----------------------------------------------------------------- 13 */
  {
    slug: 'wildcard-y-retos-de-experto',
    titulo: 'Máscara wildcard y retos de experto',
    resumen: 'La máscara invertida que usan las listas de acceso y OSPF, y los problemas más duros del módulo: subredes lejanas y diseños completos.',
    nivel: 'experto',
    objetivos: [
      'Calcular la wildcard de cualquier máscara.',
      'Encontrar la subred número N de una red dividida en miles de subredes.',
      'Resolver diseños completos que combinan todo lo anterior.',
    ],
    bloques: [
      h('La máscara wildcard'),
      p(`Algunas configuraciones de router, sobre todo las **listas de control de acceso (ACL)** y el protocolo **OSPF**, no usan la máscara de subred sino su versión invertida: la **wildcard** o máscara comodín.`),
      tabla(['', 'Bit en 1 significa', 'Bit en 0 significa'], [
        ['Máscara de subred', 'este bit es de red', 'este bit es de host'],
        ['Wildcard', 'este bit **no importa** (comodín)', 'este bit **debe coincidir**'],
      ]),
      formula('wildcard = 255.255.255.255 − máscara', [], 'Se resta octeto a octeto. Es lo mismo que invertir cada bit de la máscara.'),
      p(`La wildcard de un /24 es \`0.0.0.255\`: «los tres primeros octetos deben coincidir; el cuarto, cualquiera». Escribir \`192.168.1.0 0.0.0.255\` en una ACL selecciona toda la red \`192.168.1.0/24\`.`),
      ejemplo('facil', 'La wildcard de un /24', wc(24)),
      ejemplo('medio', 'La wildcard de un /27', wc(27), 'El último octeto de la wildcard (31) es siempre el tamaño del bloque menos 1: 32 − 1.'),
      ejemplo('dificil', 'La wildcard de un /20', wc(20)),
      nota('truco', `En el octeto interesante, la wildcard vale **número mágico − 1**. Para /26: 64 − 1 = 63. Para /20: 16 − 1 = 15 en el tercer octeto y 255 en el cuarto.`),

      h('Reto 1: la subred número N'),
      p(`«La red \`10.0.0.0/8\` se divide en subredes /20. ¿Cuál es la subred n.º 1,000?» Contar bloques es imposible. Hay dos caminos, y conviene dominar los dos para comprobar uno con el otro.`),
      orden(
        '**Por bits.** La subred n.º k lleva el número k − 1 escrito en binario en sus bits de subred. Convierte k − 1 a binario con tantos bits como bits de subred haya y colócalo a continuación de los bits de la red original.',
        '**Por aritmética.** Multiplica (k − 1) por el tamaño del bloque para obtener el desplazamiento en direcciones. Pásalo a octetos (dividiendo entre 256 sucesivamente) y súmalo a la base.',
      ),
      ejemplo('dificil', 'La subred 40 de una clase B en /22', ene('172.16.0.0', 16, 22, 40)),
      ejemplo('experto', 'La subred 1,000 de una clase A en /20', ene('10.0.0.0', 8, 20, 1000)),
      ejemplo('experto', 'La subred 1,500 de una clase B en /27', ene('172.16.0.0', 16, 27, 1500), 'Con /27 los bits de subred ocupan todo el tercer octeto y tres bits del cuarto. Por eso la respuesta tiene un tercer octeto «raro» y un cuarto que no es 0.'),
      nota('clave', `Para pasar un desplazamiento a octetos: divide entre 256 y quédate con el resto, que es el cuarto octeto; el cociente se vuelve a dividir entre 256 para el tercero, y así sucesivamente. en el reto de la subred 1,000, el desplazamiento es 999 × 4,096 = 4,091,904. 4,091,904 ÷ 256 = 15,984 resto **0**; 15,984 ÷ 256 = 62 resto **112**; queda **62**. Resultado: \`0.62.112.0\`.`),

      h('Reto 2: diseños completos'),
      p(`Los problemas de examen más difíciles encadenan varias técnicas: un VLSM con muchas subredes, el resumen de lo asignado o la subred lejana de una división. No hay conceptos nuevos; la dificultad está en no cometer un solo error de cuenta en veinte pasos. Trabaja con orden y comprueba cada subred antes de pasar a la siguiente.`),
      ejemplo('experto', 'Un proveedor reparte un /19', { tipo: 'vlsm', base: '172.24.64.0', p0: 19, extra: true, reqs: [
        { nombre: 'Cliente A', hosts: 2000 }, { nombre: 'Cliente B', hosts: 1000 }, { nombre: 'Cliente C', hosts: 1000 }, { nombre: 'Cliente D', hosts: 500 },
        { nombre: 'Cliente E', hosts: 120 }, { nombre: 'Gestión', hosts: 30 }, { nombre: 'Enlace 1', hosts: 2 }, { nombre: 'Enlace 2', hosts: 2 }, { nombre: 'Enlace 3', hosts: 2 }, { nombre: 'Enlace 4', hosts: 2 }] }),
      ejemplo('experto', 'Resumir lo que quedó detrás de un router', { tipo: 'resumen', redes: [{ ip: '172.24.64.0', p: 21 }, { ip: '172.24.72.0', p: 22 }, { ip: '172.24.76.0', p: 22 }, { ip: '172.24.80.0', p: 23 }] }),

      ejercicios('Retos', 'Sin prisa. En los de subred lejana, resuelve por bits y comprueba por aritmética.', [
        wc(25), wc(28), wc(30), wc(22), wc(18), wc(13),
        ene('172.16.0.0', 16, 24, 200), ene('172.16.0.0', 16, 26, 500), ene('10.0.0.0', 8, 16, 150), ene('10.0.0.0', 8, 22, 5000), ene('10.0.0.0', 8, 27, 100000), ene('172.20.0.0', 14, 23, 333),
        fh('10.0.0.0', 8, 500, 12345), fh('172.16.0.0', 12, 60, 9999),
        vl('192.168.0.0', 22, [['Edificio A', 300], ['Edificio B', 150], ['Edificio C', 100], ['Wi-Fi invitados', 50], ['Servidores', 25], ['Impresoras', 10], ['Enlace 1', 2], ['Enlace 2', 2], ['Enlace 3', 2]], true),
        vl('10.200.0.0', 18, [['Planta 1', 3000], ['Planta 2', 3000], ['Planta 3', 1500], ['Oficinas', 700], ['Centro de datos', 400], ['Seguridad', 90], ['Enlace 1', 2], ['Enlace 2', 2], ['Enlace 3', 2], ['Enlace 4', 2], ['Enlace 5', 2]], true),
        res('10.16.0.0/13', '10.24.0.0/14', '10.28.0.0/15', '10.30.0.0/16'),
        res('192.168.37.0/24', '192.168.40.64/26', '192.168.47.128/25'),
        res('172.16.129.0/24', '172.16.130.0/23', '172.16.132.0/22', '172.16.136.0/21'),
        op('En una ACL aparece `172.16.32.0 0.0.15.255`. ¿A qué red equivale?', ['`172.16.32.0/16`', '`172.16.32.0/20`', '`172.16.32.0/24`', '`172.16.32.0/28`'], 1, 'La wildcard `0.0.15.255` corresponde a la máscara `255.255.240.0`: 255 − 15 = 240 en el tercer octeto. Eso es un /20.'),
      ]),
      nota('truco', `Ya tienes todas las técnicas. A partir de aquí lo que hace falta es volumen: en **Práctica**, los niveles 5 y 6 generan problemas como estos sin límite, y el **examen avanzado** te dice si estás listo.`, 'Qué sigue'),
    ],
  },
];
