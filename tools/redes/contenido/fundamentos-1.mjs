// Fundamentos de redes · lecciones 1 a 4: qué es una red, modelos de capas, encapsulación y rendimiento.
import { h, h3, p, lista, orden, tabla, nota, formula, codigo, ejemplo, ejercicios, op, vs, rel, ord, topo, figura, figuras } from './_ayuda.mjs';

const TOPOS = ['Estrella', 'Malla completa', 'Malla parcial', 'Bus', 'Anillo', 'Punto a punto'];

export const alc = (caso) => ({ tipo: 'fx-alcance', caso });
export const capa = (que) => ({ tipo: 'fx-capa', que });
export const pdu = (c) => ({ tipo: 'fx-pdu', capa: c });
export const uni = (modo, mbps, mb) => ({ tipo: 'fx-unidades', modo, mbps, ...(mb ? { mb } : {}) });
/** Viaje PC-A → R1 → servidor con direcciones fijas: red = 'A' | 'B', sentido = 'ida' | 'vuelta'. */
export const salto = (red, sentido = 'ida', x = 10, y = 20) => ({ tipo: 'fx-salto', red, sentido,
  a: { ip: `192.168.${x}.25`, mac: '00:1a:2b:00:00:0a' }, ra: { ip: `192.168.${x}.1`, mac: '00:1c:58:00:00:01' },
  rb: { ip: `192.168.${y}.1`, mac: '00:1c:58:00:00:02' }, b: { ip: `192.168.${y}.80`, mac: '00:25:b3:00:00:0b' } });

export default [
  /* ------------------------------------------------------------------ 1 */
  {
    slug: 'que-es-una-red',
    titulo: 'Qué es una red y de qué está hecha',
    resumen: 'Los tres ingredientes de toda red, los tipos de red según el área que cubren (PAN, LAN, WLAN, CAN, MAN, WAN) y las formas de conectarlas.',
    nivel: 'facil',
    objetivos: [
      'Nombrar los componentes de una red: dispositivos finales, dispositivos intermedios y medios.',
      'Distinguir PAN, LAN, WLAN, CAN, MAN y WAN por el área que cubren.',
      'Diferenciar Internet, intranet y extranet.',
      'Reconocer las topologías más comunes y la diferencia entre topología física y lógica.',
    ],
    bloques: [
      h('Una red, explicada con una carretera'),
      p(`Una **red** es un conjunto de equipos conectados entre sí para **compartir información y recursos**: archivos, una impresora, la conexión a internet, una videollamada.

Piensa en un sistema de carreteras. Hay **lugares** de donde sale y a donde llega la gente (casas, tiendas, oficinas). Hay **cruces y casetas** que no son el destino de nadie, pero deciden por dónde sigue cada auto. Y hay **carreteras**, que son el camino físico. Una red de datos tiene exactamente esas tres cosas, con otros nombres.`),
      tabla(['En la carretera', 'En la red', 'Qué hace', 'Ejemplos'], [
        ['Casas y oficinas', '**Dispositivos finales** (también llamados hosts o endpoints)', 'Son el origen o el destino de los datos. Aquí están las personas y los servicios.', 'Computadora, teléfono, impresora, servidor, cámara, televisor'],
        ['Cruces y casetas', '**Dispositivos intermedios**', 'Conectan a los finales entre sí y dirigen los datos hacia su destino.', 'Switch, router, punto de acceso wifi, firewall'],
        ['Las carreteras', '**Medios**', 'Son el camino por el que viaja la señal.', 'Cable de cobre, fibra óptica, ondas de radio (wifi)'],
      ]),
      nota('clave', `Para saber si un equipo es **final** o **intermedio**, pregúntate: ¿los datos **empiezan o terminan** en él, o solo **pasan** por él? Una impresora recibe el documento y ahí termina el viaje: es un dispositivo final. Un switch nunca es el destino de tu documento: solo lo deja pasar.`),

      h('Los dispositivos intermedios, uno por uno'),
      p(`En todo el curso vas a encontrar tres aparatos una y otra vez. Conviene tenerlos claros desde ahora:`),
      tabla(['Dispositivo', 'Qué hace', 'Dónde lo ves'], [
        ['**Switch**', 'Conecta por cable a los equipos de **una misma red** y entrega cada dato solo al equipo al que va dirigido.', 'El aparato con muchos puertos al que llegan los cables de una oficina.'],
        ['**Router**', 'Conecta **redes distintas** entre sí y elige el camino hacia otras redes. Es la «salida» de tu red hacia internet.', 'En la frontera de la red: entre la oficina e internet.'],
        ['**Punto de acceso (AP)**', 'Conecta equipos **sin cable** (wifi) a la red cableada.', 'En el techo o la pared de oficinas, escuelas y cafés.'],
        ['**Firewall**', 'Revisa el tráfico que entra y sale, y bloquea lo que no está permitido.', 'Entre la red interna e internet.'],
      ]),
      nota('aviso', `El «router» de tu casa es en realidad **varios aparatos en una sola caja**: un router (conecta tu casa con internet), un switch (sus cuatro puertos de cable), un punto de acceso (el wifi) y un firewall básico. En una empresa cada función suele estar en un equipo aparte. En el examen, cuando se habla de un router o de un switch, se refiere a la función, no a la caja de tu casa.`),
      ejemplo('facil', 'Clasificar los equipos de una oficina', op(
        'En una oficina hay una laptop, un switch, una impresora de red y un router. ¿Cuáles son dispositivos **finales**?',
        ['La laptop y la impresora', 'El switch y el router', 'La laptop y el switch', 'Solo la laptop'], 0,
        [
          'Se aplica la pregunta clave a cada equipo: ¿los datos empiezan o terminan en él, o solo pasan?',
          'La **laptop** es donde el usuario crea y recibe la información: los datos empiezan y terminan ahí. Es un dispositivo final.',
          'La **impresora** recibe el documento y lo imprime: el documento termina su viaje en ella. También es final, aunque nadie se siente frente a ella.',
          'El **switch** y el **router** nunca son el destino de un documento ni de una página web: solo reenvían lo que pasa por ellos. Son intermedios.',
        ])),

      h('Clasificar las redes por el área que cubren'),
      p(`La forma más común de clasificar una red es por su **alcance geográfico**: cuánto espacio cubre. Va desde lo que rodea a una persona hasta el planeta entero.`),
      tabla(['Sigla', 'Nombre', 'Qué cubre', 'Ejemplo'], [
        ['**PAN**', 'Red de área personal', 'Los dispositivos de **una persona**, a pocos metros.', 'Teléfono, reloj y audífonos por Bluetooth.'],
        ['**LAN**', 'Red de área local', '**Un lugar**: una casa, una oficina, un piso o un edificio. Es de quien la usa.', 'Las computadoras de una oficina conectadas a un switch.'],
        ['**WLAN**', 'LAN inalámbrica', 'Lo mismo que una LAN, pero los equipos se conectan por **wifi**.', 'Las laptops de una cafetería.'],
        ['**CAN**', 'Red de campus', '**Varios edificios cercanos** de una misma organización, unidos con enlaces propios.', 'Los edificios de una universidad.'],
        ['**MAN**', 'Red de área metropolitana', 'Una **ciudad** o zona metropolitana.', 'La red de un proveedor de cable en una ciudad.'],
        ['**WAN**', 'Red de área amplia', '**Entre ciudades, países o continentes**. Normalmente usa enlaces de un proveedor.', 'Las sucursales de un banco. Internet.'],
      ]),
      p(`Fíjate en que no hay un número exacto de metros que separe un tipo de otro. Lo que cambia es **la escala** y **de quién es la infraestructura**:`),
      lista(
        'En una **LAN** (y en una CAN) los cables y los equipos son de la propia organización. Ella decide todo y no paga a nadie por usarlos.',
        'En una **WAN** casi siempre se **alquilan** enlaces a un proveedor de servicios, porque nadie tiende su propio cable entre dos ciudades.',
        'Una **LAN** suele ser rápida y barata por cada megabit; una **WAN** suele ser más lenta y más cara.',
      ),
      nota('truco', `Para ordenarlas de menor a mayor recuerda la frase **«Persona, Lugar, Campus, Metrópoli, Amplia»**: PAN → LAN → CAN → MAN → WAN. La WLAN no es otro tamaño: es una LAN que usa wifi.`),
      ejemplo('facil', 'Los dispositivos de una persona', alc('audifonos')),
      ejemplo('facil', 'Una oficina cableada', alc('oficina')),
      ejemplo('medio', 'Varios edificios vecinos', alc('universidad')),
      ejemplo('medio', 'Toda una ciudad', alc('ciudad')),
      ejemplo('medio', 'Sucursales en otras ciudades', alc('sucursales')),

      h('Internet, intranet y extranet'),
      p(`Estas tres palabras se parecen, pero responden a otra pregunta: **¿quién puede entrar?**`),
      tabla(['Término', 'Qué es', 'Quién entra'], [
        ['**Internet**', 'La red de redes: millones de redes de todo el mundo interconectadas. No tiene un dueño único.', 'Cualquiera.'],
        ['**Intranet**', 'La red privada de una organización, con sus sitios y servicios internos.', 'Solo el personal de la organización.'],
        ['**Extranet**', 'Una parte de la red de la organización que se abre de forma controlada a gente de fuera.', 'Proveedores, clientes o socios autorizados.'],
      ]),
      p(`Ejemplo: el portal donde los empleados consultan su recibo de nómina es parte de la **intranet**. El portal donde los proveedores de esa empresa suben sus facturas es una **extranet**. Y la página pública de la empresa está en **Internet**.`),

      h('Topologías: el dibujo de la red'),
      p(`La **topología** es la forma en que están conectados los equipos. Hay dos maneras de dibujarla, y un técnico de soporte usa las dos:`),
      tabla(['', 'Topología física', 'Topología lógica'], [
        ['Qué muestra', 'Dónde está cada equipo y por dónde va cada cable.', 'Cómo viajan los datos: redes, direcciones IP, qué se comunica con qué.'],
        ['Para qué sirve', 'Encontrar un equipo, un puerto o un cable en el edificio.', 'Entender por qué dos equipos se alcanzan o no.'],
        ['Qué incluye', 'Pisos, cuartos, racks, número de puerto, tipo de cable.', 'Nombres de equipos, direcciones de red, VLAN, interfaces.'],
      ]),
      p(`Las formas clásicas de conectar equipos son estas:`),
      tabla(['Topología', 'Cómo es', 'Ventaja', 'Desventaja'], [
        ['**Estrella**', 'Todos los equipos se conectan a un equipo central (un switch).', 'Si falla un cable, solo se cae un equipo. Fácil de ampliar.', 'Si falla el equipo central, se cae todo.'],
        ['**Estrella extendida**', 'Varias estrellas unidas: switches conectados a otro switch.', 'Es la forma normal de una LAN de empresa.', 'Depende de los switches centrales.'],
        ['**Malla completa**', 'Cada equipo tiene un enlace directo con todos los demás.', 'Máxima redundancia: siempre hay otro camino.', 'Muy cara: hacen falta muchísimos enlaces.'],
        ['**Malla parcial**', 'Solo algunos equipos tienen varios enlaces.', 'Buen equilibrio entre costo y redundancia. Así es Internet.', 'Más compleja de administrar.'],
        ['**Bus**', 'Todos comparten un único cable.', 'Barata y simple.', 'Antigua. Un corte en el cable tira toda la red.'],
        ['**Anillo**', 'Cada equipo se conecta con sus dos vecinos formando un círculo.', 'El tráfico es ordenado.', 'Antigua en LAN. Un fallo puede romper el anillo.'],
        ['**Punto a punto**', 'Un enlace directo entre dos equipos.', 'Sencilla.', 'Solo une dos puntos.'],
      ]),
      h3('Cómo se ve cada una dibujada'),
      p(`En el examen las topologías aparecen **dibujadas**, y hay que reconocerlas de un vistazo. En estos diagramas un cuadro es una computadora (PC), un rectángulo azul es un switch (SW) y un círculo es un router (R).`),
      figuras(
        [topo('estrella'), '**Estrella.** Todos los cables llegan a un equipo central. Es la forma de casi todas las LAN.'],
        [topo('estrella-extendida'), '**Estrella extendida.** Varias estrellas unidas por un switch central.'],
        [topo('malla', 4), '**Malla completa.** Todos con todos: con 4 equipos ya son 6 enlaces.'],
        [topo('malla-parcial'), '**Malla parcial.** Hay caminos alternativos, pero no todos se unen directamente.'],
        [topo('bus'), '**Bus.** Un único cable compartido, con un terminador en cada extremo.'],
        [topo('anillo'), '**Anillo.** Cada equipo solo toca a sus dos vecinos y el círculo se cierra.'],
        [topo('punto-a-punto'), '**Punto a punto.** Un enlace directo entre dos equipos, típico entre dos sedes.'],
      ),
      h3('Tres preguntas para reconocer cualquier dibujo'),
      p(`No hace falta memorizar las imágenes. Basta contar líneas:`),
      orden(
        '**¿Hay un equipo en el centro al que llegan todas las líneas?** Entonces es una **estrella**. Si hay varios centros unidos entre sí, es una estrella extendida.',
        '**¿Cuántas líneas salen de cada equipo?** Si de cada uno salen exactamente **dos** y el dibujo se cierra, es un **anillo**. Si salen hacia **todos los demás**, es una **malla completa**. Si salen varias pero no hacia todos, es una **malla parcial**.',
        '**¿Todos cuelgan de una sola línea larga?** Entonces es un **bus**. Y si solo hay dos equipos y una línea, es **punto a punto**.',
      ),
      tabla(['Topología', 'Enlaces de cada equipo', 'Si se corta un enlace…'], [
        ['Estrella', '1 (hacia el centro)', 'se queda sin red solo ese equipo.'],
        ['Malla completa', 'n − 1 (uno hacia cada uno de los demás)', 'no pasa nada: hay otros caminos.'],
        ['Malla parcial', '2 o más, pero menos de n − 1', 'casi siempre hay un camino alternativo.'],
        ['Bus', '1 (hacia el cable común)', 'si se corta el cable común, cae toda la red.'],
        ['Anillo', '2 (sus dos vecinos)', 'el anillo se abre; en los anillos simples cae la comunicación.'],
        ['Punto a punto', '1', 'los dos equipos quedan incomunicados.'],
      ]),
      ejemplo('facil', 'Reconocer una topología dibujada', op(
        'Un ingeniero te envía este diagrama de una oficina pequeña. ¿Qué topología física muestra?', TOPOS, 0, [
          'Primera pregunta: ¿hay un equipo central? Sí: el switch **SW** está en medio y todas las líneas terminan en él.',
          'Ninguna computadora está unida directamente con otra: cada una tiene **un solo enlace**, hacia el centro.',
          'Un centro con un cable propio para cada equipo es una **estrella**. Si se rompe el cable de PC3, solo PC3 pierde la red.',
        ], { figura: topo('estrella') })),
      ejemplo('medio', '¿Malla completa o malla parcial?', op(
        'Este diagrama muestra los routers de cinco sedes de una empresa. ¿Qué topología es?', TOPOS, 2, [
          'No hay un equipo central, así que no es una estrella. Y hay más de dos equipos: tampoco es punto a punto.',
          'Cuenta los enlaces de cada router. En una malla **completa** de 5 routers cada uno tendría 4 enlaces (uno hacia cada uno de los otros), y en total habría 5 × 4 ÷ 2 = 10 líneas.',
          'Aquí hay 6 líneas y varios routers solo tienen 2 enlaces. Existen caminos alternativos, pero no todos están unidos entre sí: es una **malla parcial**.',
        ], { figura: topo('malla-parcial') })),
      ejemplo('medio', 'Contar los enlaces de una malla completa', op(
        'El diagrama muestra cuatro routers. Si la empresa añade un quinto router y quiere mantener la misma topología, ¿cuántos enlaces habrá en total?', ['5', '8', '10', '20'], 2, [
          'En el dibujo cada router está unido con los otros tres: es una **malla completa** de 4 equipos, con 4 × 3 ÷ 2 = 6 enlaces.',
          'Para mantenerla, el quinto router necesita un enlace con cada uno de los 4 que ya existen: 6 + 4 = 10.',
          'Con la fórmula: n × (n − 1) ÷ 2 = 5 × 4 ÷ 2 = **10** enlaces. Por eso la malla completa se encarece tan rápido.',
        ], { figura: topo('malla', 4) })),
      h3('Física y lógica pueden no coincidir'),
      p(`El dibujo de los cables (topología **física**) no siempre coincide con la forma en que viajan los datos (topología **lógica**). El caso clásico: varias computadoras conectadas a un **hub**. Los cables forman una estrella, porque cada equipo tiene el suyo hasta el hub. Pero el hub repite cada señal por todos sus puertos, así que los datos se comportan como si todos compartieran un solo cable: lógicamente es un **bus**.`),
      tabla(['Red', 'Topología física', 'Topología lógica'], [
        ['Computadoras conectadas a un hub', 'Estrella', 'Bus: todos reciben todo.'],
        ['Computadoras conectadas a un switch', 'Estrella', 'Estrella: cada trama va solo a su destino.'],
        ['Un switch con dos VLAN', 'Estrella (un solo equipo central)', 'Dos redes separadas que no se ven entre sí.'],
      ]),
      nota('clave', `La topología que vas a ver en prácticamente todas las redes locales actuales es la **estrella** (o estrella extendida): cada computadora con su propio cable hasta un switch. Bus y anillo aparecen en el examen sobre todo como opciones para descartar.`),
      formula('Enlaces de una malla completa = n × (n − 1) ÷ 2', [['n', 'el número de equipos']], 'Con 4 equipos son 6 enlaces; con 10 equipos ya son 45. Por eso la malla completa casi no se usa.'),
      ejemplo('medio', 'Elegir topología en un caso real', op(
        'Una oficina tiene 12 computadoras. Cada una tiene su propio cable hasta un switch que está en el cuarto de comunicaciones. Se rompe el cable de la computadora 7. ¿Qué pasa y qué topología es?',
        ['Es una estrella: solo la computadora 7 pierde la conexión', 'Es un bus: toda la red se cae', 'Es un anillo: las computadoras 7 a 12 se quedan sin red', 'Es una malla completa: nadie nota el corte'], 0,
        [
          'Cada equipo tiene un cable propio hacia un punto central (el switch). Eso es la definición de la topología en **estrella**.',
          'En una estrella, cada cable da servicio a un solo equipo. Si se rompe, el único afectado es ese equipo: la computadora 7.',
          'En un bus todos comparten un cable, así que un corte afectaría a todos; y en una malla completa la computadora 7 tendría otros caminos. Ninguna de las dos coincide con la descripción.',
          'El punto débil de la estrella no es un cable, sino el **switch**: si falla él, se cae toda la oficina.',
        ])),
      ejemplo('dificil', 'Cuántos enlaces pide una malla completa', op(
        'Una empresa quiere unir sus 6 sucursales con una malla completa de enlaces WAN, para que cada sucursal tenga un enlace directo con todas las demás. ¿Cuántos enlaces debe contratar?',
        ['6', '12', '15', '30'], 2,
        [
          'En una malla completa cada sitio se une con todos los demás. Cada una de las 6 sucursales necesita 5 enlaces (uno hacia cada una de las otras).',
          '6 × 5 = 30, pero así cada enlace se contó dos veces (el enlace entre A y B es el mismo que entre B y A). Se divide entre 2.',
          'Enlaces = n × (n − 1) ÷ 2 = 6 × 5 ÷ 2 = **15**.',
          'Quince enlaces WAN es mucho dinero. Por eso en la práctica se usa una malla parcial o una estrella con la oficina central en medio (5 enlaces).',
        ])),

      h('Resumen'),
      lista(
        'Una red tiene **dispositivos finales** (origen y destino), **dispositivos intermedios** (reenvían) y **medios** (el camino).',
        'El **switch** une equipos de una misma red; el **router** une redes distintas; el **punto de acceso** da wifi.',
        'Por alcance: **PAN** (persona), **LAN** (lugar), **WLAN** (lugar, por wifi), **CAN** (campus), **MAN** (ciudad), **WAN** (entre ciudades o países).',
        '**Internet** es pública, la **intranet** es interna y la **extranet** se abre a socios autorizados.',
        'La **topología física** dice dónde están los cables; la **lógica**, cómo fluyen los datos. La más usada en LAN es la **estrella**.',
      ),

      ejercicios('Practica: reconocer topologías', 'Cuenta las líneas que salen de cada equipo antes de responder.', [
        op('¿Qué topología física muestra el diagrama?', TOPOS, 3, 'Todas las computadoras cuelgan de una única línea larga con un terminador en cada extremo: es un **bus**.', { figura: topo('bus') }),
        op('¿Qué topología física muestra el diagrama?', TOPOS, 4, 'De cada equipo salen exactamente dos enlaces, hacia sus dos vecinos, y el círculo se cierra: es un **anillo**.', { figura: topo('anillo') }),
        op('¿Qué topología muestra el diagrama?', TOPOS, 1, 'Cada router tiene un enlace directo con todos los demás (4 routers, 6 enlaces): es una **malla completa**.', { figura: topo('malla', 4) }),
        op('¿Qué topología muestra el diagrama?', TOPOS, 5, 'Solo hay dos equipos y un enlace directo entre ellos: **punto a punto**.', { figura: topo('punto-a-punto') }),
        op('¿Qué topología física muestra el diagrama?', ['Estrella', 'Estrella extendida', 'Malla completa', 'Bus'], 1, 'Hay un switch central (SW0) del que cuelgan otros switches, y de cada uno de ellos sus computadoras: varias estrellas unidas, es decir, una **estrella extendida**.', { figura: topo('estrella-extendida') }),
        op('En la red del diagrama se rompe el cable entre PC2 y el switch. ¿Qué equipos se quedan sin red?', ['Solo PC2', 'PC2 y sus dos vecinos', 'Todos los equipos', 'Ninguno: hay un camino alternativo'], 0, 'Es una estrella: cada computadora tiene su propio cable hasta el switch. El fallo de un cable solo afecta al equipo de ese cable.', { figura: topo('estrella') }),
        op('En la red del diagrama falla el switch central. ¿Qué ocurre?', ['Solo se pierde un equipo', 'Las computadoras siguen comunicándose entre ellas', 'Ninguna computadora puede comunicarse con otra', 'La red cambia sola a una malla'], 2, 'En una estrella todo el tráfico pasa por el equipo central. Si falla, no queda ningún camino entre las computadoras: es su punto único de fallo.', { figura: topo('estrella') }),
        op('En la red del diagrama se corta el enlace entre R1 y R2. ¿Puede R1 seguir enviando paquetes a R2?', ['Sí, por un camino alternativo a través de otros routers', 'No, quedan incomunicados', 'Solo si se reinician los routers', 'Solo los paquetes de broadcast'], 0, 'En una malla completa cada router tiene enlaces con todos los demás. R1 puede llegar a R2 pasando por R3 o por R4: esa redundancia es la gran ventaja de la malla.', { figura: topo('malla', 4) }),
        op('Seis sucursales se van a unir en malla completa. ¿Cuántos enlaces hacen falta?', ['6', '12', '15', '30'], 2, 'n × (n − 1) ÷ 2 = 6 × 5 ÷ 2 = 15 enlaces.'),
        op('Cinco computadoras están conectadas por cable a un hub. ¿Cuál es su topología física y cuál la lógica?', ['Física en estrella, lógica en bus', 'Física en bus, lógica en estrella', 'Física y lógica en anillo', 'Física en malla, lógica en estrella'], 0, 'Los cables llegan todos al hub: físicamente es una estrella. Pero el hub repite cada señal por todos los puertos, como si compartieran un solo cable: lógicamente es un bus.'),
      ]),
      ejercicios('Practica', 'Empieza por clasificar redes y termina con casos de soporte.', [
        alc('reloj'), alc('casa'), alc('cafe'), alc('hospital'), alc('cable'), alc('internet'), alc('teclado'), alc('laboratorio'), alc('tabletas'), alc('paises'),
        op('¿Cuál de estos equipos es un dispositivo **intermedio**?', ['Un servidor de archivos', 'Una impresora de red', 'Un switch', 'Un teléfono IP'], 2, 'El switch solo reenvía lo que pasa por él. El servidor, la impresora y el teléfono IP son origen o destino de los datos: son dispositivos finales.'),
        op('¿Qué dispositivo conecta redes distintas entre sí y elige el camino hacia otras redes?', ['El switch', 'El router', 'El punto de acceso', 'El hub'], 1, 'Unir redes distintas y decidir la ruta es el trabajo del router. El switch y el punto de acceso conectan equipos dentro de una misma red.'),
        vs('¿Cuáles **dos** son medios de red?', ['Fibra óptica', 'Router', 'Ondas de radio', 'Servidor', 'Switch'], [0, 2], 'El medio es el camino por el que viaja la señal: cobre, fibra u ondas de radio. El router y el switch son dispositivos intermedios, y el servidor es un dispositivo final.'),
        rel('Relaciona cada red con su tipo.', [
          ['Las oficinas de una empresa en tres países', 'WAN'], ['Un teléfono y un reloj inteligente', 'PAN'], ['Los equipos cableados de un piso de oficinas', 'LAN'], ['Los edificios de un campus universitario', 'CAN'],
        ], 'La PAN rodea a una persona; la LAN cubre un lugar; la CAN, varios edificios vecinos de la misma organización; la WAN, distancias entre ciudades o países.', ['MAN']),
        ord('Ordena los tipos de red de **menor a mayor** alcance.', ['PAN', 'LAN', 'CAN', 'MAN', 'WAN'], 'Persona, lugar, campus, ciudad y, por último, entre ciudades o países.'),
        op('El portal interno donde solo los empleados consultan sus vacaciones forma parte de…', ['Internet', 'la intranet', 'la extranet', 'una PAN'], 1, 'La intranet es la red privada de la organización, para uso de su personal. Una extranet daría acceso controlado a gente de fuera, como proveedores.'),
        op('Un fabricante da a sus distribuidores un usuario para consultar existencias en un sistema de la empresa. Ese acceso es un ejemplo de…', ['intranet', 'extranet', 'red pública', 'topología en bus'], 1, 'Abrir de forma controlada una parte de la red interna a socios externos es una extranet.'),
        op('Un técnico necesita saber en qué rack y en qué puerto del switch está conectada una impresora. ¿Qué documento consulta?', ['El diagrama de topología lógica', 'El diagrama de topología física', 'La tabla de enrutamiento', 'El contrato con el proveedor de internet'], 1, 'La topología física muestra la ubicación real de los equipos y el recorrido de los cables. La lógica mostraría redes y direcciones IP, no el rack.'),
        op('¿En qué topología el fallo del equipo central deja sin comunicación a todos los demás?', ['Malla completa', 'Estrella', 'Punto a punto', 'Malla parcial'], 1, 'En la estrella todo pasa por el equipo central. Es su único punto débil; a cambio, el fallo de un cable solo afecta a un equipo.'),
        op('¿Cuántos enlaces necesita una malla completa entre 5 routers?', ['5', '10', '20', '25'], 1, 'n × (n − 1) ÷ 2 = 5 × 4 ÷ 2 = 10 enlaces.'),
        vs('¿Cuáles **dos** afirmaciones sobre una WAN son correctas?', ['Suele usar enlaces alquilados a un proveedor', 'Cubre solo un edificio', 'Conecta sitios separados por grandes distancias', 'Siempre es más rápida que una LAN', 'Solo funciona con wifi'], [0, 2], 'Una WAN une sitios lejanos y casi siempre usa enlaces de un proveedor. Lo normal es que sea más lenta y más cara que una LAN, y no depende del wifi.'),
        op('El «router» de una casa tiene cuatro puertos de cable para conectar computadoras. ¿Qué función cumplen esos cuatro puertos?', ['La de un switch', 'La de un firewall', 'La de un servidor DNS', 'La de un módem de fibra'], 0, 'Los puertos LAN de un router doméstico son un pequeño switch integrado: conectan entre sí los equipos de la misma red de la casa.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 2 */
  {
    slug: 'modelos-osi-y-tcp-ip',
    titulo: 'Los modelos OSI y TCP/IP',
    resumen: 'Por qué las redes se explican por capas, qué hace cada una de las siete capas de OSI, las cuatro de TCP/IP y qué protocolos y dispositivos viven en cada una.',
    nivel: 'facil',
    objetivos: [
      'Explicar para qué sirve dividir la comunicación en capas.',
      'Nombrar las siete capas del modelo OSI en orden y decir qué hace cada una.',
      'Relacionar las capas de OSI con las cuatro capas de TCP/IP.',
      'Ubicar protocolos y dispositivos (hub, switch, router) en su capa.',
    ],
    bloques: [
      h('Por qué se usan capas'),
      p(`Enviar un mensaje por una red es un trabajo enorme: hay que darle formato, partirlo en trozos, ponerle dirección, elegir un camino, convertirlo en señales eléctricas… Si todo eso fuera un solo programa gigantesco, nadie podría entenderlo ni arreglarlo.

La solución es la misma que usa el **servicio de paquetería**. Cuando mandas un regalo, intervienen varias personas, y cada una hace **solo su parte**:`),
      orden(
        'Tú escribes la carta y eliges el regalo (el contenido).',
        'Lo metes en una caja y escribes el nombre de la persona que debe recibirlo.',
        'La oficina le pone la dirección completa: ciudad, calle y número.',
        'El centro de reparto decide en qué camión va en cada tramo.',
        'El camión lo transporta por la carretera.',
      ),
      p(`Quien escribe la carta no necesita saber qué camión se usará. Y el conductor no necesita saber qué dice la carta. Cada nivel confía en que el de abajo hará su trabajo. Eso es un **modelo de capas**.`),
      lista(
        '**Divide un problema grande en problemas pequeños**, más fáciles de estudiar.',
        '**Permite cambiar una capa sin tocar las demás.** Pasas del cable al wifi y tu navegador ni se entera.',
        '**Hace que equipos de distintos fabricantes se entiendan**, porque todos siguen las mismas reglas en cada capa.',
        '**Sirve para diagnosticar.** Un técnico pregunta: «¿el problema es de capa 1 (el cable), de capa 3 (la dirección IP) o de capa 7 (la aplicación)?».',
      ),
      nota('clave', `Un **protocolo** es un conjunto de reglas que dos equipos acuerdan para comunicarse: qué formato tienen los mensajes, en qué orden se envían y qué hacer si algo falla. Cada capa tiene sus protocolos.`),

      h('El modelo OSI: siete capas'),
      p(`El modelo **OSI** es un modelo de **referencia**: no es un programa ni un protocolo, sino un mapa para explicar y ubicar todo lo que ocurre en una red. Tiene siete capas, numeradas **de abajo hacia arriba**.`),
      tabla(['N.º', 'Capa', 'Qué hace, en una frase', 'Ejemplos'], [
        ['7', '**Aplicación**', 'Da servicios de red a los programas que usa la persona.', 'HTTP, DNS, DHCP, FTP, SMTP, SSH'],
        ['6', '**Presentación**', 'Da formato a los datos: codificación, compresión y cifrado.', 'JPEG, ASCII, cifrado'],
        ['5', '**Sesión**', 'Abre, mantiene y cierra el diálogo entre las dos aplicaciones.', 'Control de sesiones'],
        ['4', '**Transporte**', 'Entrega los datos de extremo a extremo y a la aplicación correcta, usando **puertos**.', 'TCP, UDP'],
        ['3', '**Red**', 'Da una **dirección lógica (IP)** y elige el camino entre redes distintas.', 'IPv4, IPv6, ICMP · **router**'],
        ['2', '**Enlace de datos**', 'Entrega los datos dentro de **una misma red**, usando **direcciones MAC**.', 'Ethernet, wifi (802.11) · **switch**'],
        ['1', '**Física**', 'Convierte los bits en **señales** y las pone en el medio.', 'Cables, conectores, señales de radio · **hub**'],
      ]),
      nota('truco', `Para recordar el orden de la capa 1 a la 7: **«Fíjate En Recordar Todas Sus Partes Ahora»** → **F**ísica, **E**nlace, **R**ed, **T**ransporte, **S**esión, **P**resentación, **A**plicación.`),
      p(`Una forma práctica de separarlas es por **con qué trabaja cada una**:`),
      tabla(['Si se habla de…', 'Es la capa…'], [
        ['cables, conectores, voltajes, luz, señal de radio', '1 · Física'],
        ['direcciones MAC, tramas, switch, Ethernet', '2 · Enlace de datos'],
        ['direcciones IP, paquetes, router, rutas', '3 · Red'],
        ['puertos, TCP, UDP, confiabilidad', '4 · Transporte'],
        ['la conversación entre dos programas', '5 · Sesión'],
        ['formato, cifrado, compresión', '6 · Presentación'],
        ['el servicio que usa el programa: web, correo, nombres', '7 · Aplicación'],
      ]),
      ejemplo('facil', 'Un protocolo que usa el navegador', capa('http')),
      ejemplo('facil', 'El aparato que une redes', capa('router')),
      ejemplo('facil', 'El aparato que une equipos de una red', capa('switch')),
      ejemplo('medio', 'Una dirección, ¿de qué capa?', capa('mac')),
      ejemplo('medio', 'Algo que no es un aparato ni un protocolo', capa('cifrado')),

      h('Los tres dispositivos y sus capas'),
      p(`Esta es una de las preguntas más repetidas en cualquier examen de redes. La regla es simple: un dispositivo pertenece a la capa **más alta cuya información lee para decidir**.`),
      tabla(['Dispositivo', 'Capa', 'Qué lee para decidir', 'Qué hace con lo que recibe'], [
        ['**Hub**', '1', 'Nada. No lee direcciones.', 'Repite la señal por todos los demás puertos.'],
        ['**Switch**', '2', 'La dirección **MAC** de destino de la trama.', 'La envía solo por el puerto donde está ese equipo.'],
        ['**Router**', '3', 'La dirección **IP** de destino del paquete.', 'La envía hacia la red de destino por el mejor camino.'],
      ]),
      nota('aviso', `Existe el **switch de capa 3** (o multicapa): un switch que además sabe enrutar entre redes, como un router. Cuando el examen dice «switch» a secas, se refiere al de capa 2.`),

      h('El modelo TCP/IP: cuatro capas'),
      p(`El modelo OSI es el mapa que se usa para estudiar. El modelo **TCP/IP** es el que describe los protocolos que **de verdad** funcionan en Internet. Dice lo mismo con menos capas: junta las tres de arriba en una y las dos de abajo en otra.`),
      tabla(['Capas OSI', 'Capa TCP/IP', 'Protocolos'], [
        ['7 Aplicación · 6 Presentación · 5 Sesión', '**Aplicación**', 'HTTP, HTTPS, DNS, DHCP, FTP, SMTP, SSH'],
        ['4 Transporte', '**Transporte**', 'TCP, UDP'],
        ['3 Red', '**Internet**', 'IPv4, IPv6, ICMP'],
        ['2 Enlace de datos · 1 Física', '**Acceso a la red**', 'Ethernet, wifi'],
      ]),
      nota('aviso', `Dos nombres que confunden: la capa 3 se llama **Red** en OSI e **Internet** en TCP/IP. Es la misma. Y la capa de **Acceso a la red** de TCP/IP equivale a las capas 1 y 2 de OSI juntas. Algunos libros usan un modelo TCP/IP de cinco capas, que separa otra vez la física del enlace de datos; el examen CCST usa el de cuatro.`),
      nota('clave', `Aunque TCP/IP tenga cuatro capas, en el trabajo diario todo el mundo usa los **números de OSI**. Cuando un ingeniero dice «es un problema de capa 2» o «un switch de capa 3», habla de OSI.`),
      ejemplo('medio', 'De OSI a TCP/IP', capa('udp')),
      ejemplo('medio', 'El protocolo de ping', capa('icmp')),

      h('Usar las capas para diagnosticar'),
      p(`Las capas no son solo teoría: ordenan la búsqueda de una falla. Un técnico puede empezar **desde abajo** (¿está conectado el cable?) e ir subiendo, o **desde arriba** (¿falla solo esta aplicación?) e ir bajando.`),
      tabla(['Síntoma', 'Capa sospechosa', 'Por qué'], [
        ['El puerto del switch no enciende su luz de enlace', '1 · Física', 'No hay señal: cable desconectado, roto o equipo apagado.'],
        ['Hay luz de enlace, pero el equipo no tiene dirección IP válida', '3 · Red', 'El enlace funciona; lo que falla es el direccionamiento.'],
        ['`ping` a una dirección IP funciona, pero al nombre del sitio no', '7 · Aplicación', 'La red lleva paquetes; lo que falla es DNS, un servicio de aplicación.'],
        ['Todo responde a `ping`, pero una página no abre porque un firewall bloquea el puerto 443', '4 · Transporte', 'El filtro actúa sobre el número de puerto.'],
      ]),
      ejemplo('dificil', 'Diagnóstico por capas', op(
        'Una usuaria no puede abrir ninguna página web. El técnico comprueba que el cable tiene luz de enlace, que la computadora tiene una dirección IP correcta y que `ping 8.8.8.8` responde bien. Pero `ping www.ejemplo.com` dice que no encuentra el host. ¿En qué capa está el problema?',
        ['Capa 1 · Física', 'Capa 2 · Enlace de datos', 'Capa 3 · Red', 'Capa 7 · Aplicación'], 3,
        [
          'Hay luz de enlace: la capa 1 (cable y señal) funciona.',
          'El `ping` a `8.8.8.8` responde: los paquetes salen a Internet y vuelven. Las capas 2 y 3 (tramas, direcciones IP, enrutamiento) funcionan.',
          'Lo único que falla es convertir el nombre `www.ejemplo.com` en una dirección IP. Ese trabajo lo hace **DNS**, que es un protocolo de la capa de **aplicación**.',
          'Conclusión: el problema está en la capa 7. Lo siguiente sería revisar qué servidor DNS tiene configurado el equipo.',
        ])),

      h('Resumen'),
      lista(
        'Las capas dividen el trabajo: cada una hace una cosa y confía en la de abajo.',
        'OSI, de la 1 a la 7: **Física, Enlace de datos, Red, Transporte, Sesión, Presentación, Aplicación**.',
        'TCP/IP: **Acceso a la red** (1 y 2), **Internet** (3), **Transporte** (4) y **Aplicación** (5, 6 y 7).',
        '**Hub** = capa 1, **switch** = capa 2 (lee MAC), **router** = capa 3 (lee IP).',
        'Capa 2 usa direcciones **MAC**, capa 3 usa direcciones **IP** y capa 4 usa **puertos**.',
      ),

      ejercicios('Practica', 'Ubica cada cosa en su capa. Si dudas, pregúntate con qué tipo de dirección o de información trabaja.', [
        capa('dns'), capa('tcp'), capa('ip'), capa('utp'), capa('hub'), capa('trama'), capa('paquete'), capa('ethernet'), capa('puertos'), capa('formatos'), capa('sesion'), capa('ap'), capa('fibra'), capa('dirip'),
        ord('Ordena las capas del modelo OSI de la **1 a la 7** (de abajo hacia arriba).', ['Física', 'Enlace de datos', 'Red', 'Transporte', 'Sesión', 'Presentación', 'Aplicación'], 'De abajo arriba: Física, Enlace de datos, Red, Transporte, Sesión, Presentación y Aplicación.'),
        ord('Ordena las capas del modelo TCP/IP de **abajo hacia arriba**.', ['Acceso a la red', 'Internet', 'Transporte', 'Aplicación'], 'TCP/IP tiene cuatro capas: Acceso a la red, Internet, Transporte y Aplicación.'),
        rel('Relaciona cada dispositivo con la capa OSI en la que trabaja.', [['Hub', 'Capa 1'], ['Switch', 'Capa 2'], ['Router', 'Capa 3']], 'El hub solo repite señales (1), el switch lee direcciones MAC (2) y el router lee direcciones IP (3).', ['Capa 4', 'Capa 7']),
        rel('Relaciona cada capa OSI con el tipo de dirección o identificador que usa.', [['Capa 2 · Enlace de datos', 'Dirección MAC'], ['Capa 3 · Red', 'Dirección IP'], ['Capa 4 · Transporte', 'Número de puerto']], 'MAC en enlace de datos, IP en red y puertos en transporte.', ['Nombre de dominio']),
        vs('¿Cuáles **tres** capas del modelo OSI equivalen a la capa de Aplicación de TCP/IP?', ['Aplicación', 'Presentación', 'Sesión', 'Transporte', 'Red'], [0, 1, 2], 'TCP/IP reúne las capas 5, 6 y 7 de OSI en una sola capa de Aplicación. Transporte y Red tienen su propia capa en TCP/IP.'),
        op('¿Qué capa del modelo TCP/IP equivale a la capa de Red de OSI?', ['Acceso a la red', 'Internet', 'Transporte', 'Aplicación'], 1, 'La capa 3 se llama Red en OSI e Internet en TCP/IP. Acceso a la red corresponde a las capas 1 y 2.'),
        op('Un ingeniero dice: «Eso es un problema de capa 1». ¿Qué debería revisar primero el técnico?', ['La dirección IP del equipo', 'El servidor DNS', 'El cable y la luz de enlace del puerto', 'El número de puerto de la aplicación'], 2, 'La capa 1 es la física: cables, conectores y señal. La dirección IP es de capa 3, los puertos de capa 4 y DNS de capa 7.'),
        op('¿Cuál es la principal ventaja de que la comunicación esté dividida en capas?', ['Los datos viajan más rápido', 'Se puede cambiar la tecnología de una capa sin modificar las demás', 'Ya no hacen falta direcciones IP', 'Los cables pueden ser más largos'], 1, 'Cada capa es independiente: puedes pasar de cable a wifi (capas 1 y 2) sin cambiar nada en las aplicaciones. Las capas no aumentan la velocidad ni la distancia.'),
        op('Un equipo recibe una trama y decide por qué puerto enviarla mirando la dirección MAC de destino. ¿Qué equipo es?', ['Un hub', 'Un switch', 'Un router', 'Un repetidor'], 1, 'Reenviar según la dirección MAC es lo que hace un switch (capa 2). El hub y el repetidor no leen direcciones; el router lee la dirección IP.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 3 */
  {
    slug: 'encapsulacion-tramas-y-paquetes',
    titulo: 'Encapsulación: datos, segmentos, paquetes y tramas',
    resumen: 'Cómo cada capa envuelve los datos con su propio encabezado, cómo se llama el resultado en cada nivel y qué direcciones cambian (y cuáles no) cuando un paquete cruza un router.',
    nivel: 'medio',
    objetivos: [
      'Nombrar la PDU de cada capa: datos, segmento, paquete, trama y bits.',
      'Explicar la encapsulación al enviar y la desencapsulación al recibir.',
      'Distinguir los tres direccionamientos: puerto, dirección IP y dirección MAC.',
      'Decir qué direcciones lleva una trama en cada tramo de su viaje.',
    ],
    bloques: [
      h('La idea: sobres dentro de sobres'),
      p(`Imagina que mandas una carta dentro de una empresa grande. Escribes la carta. La metes en un sobre con el nombre del **departamento** que debe leerla. Ese sobre va dentro de otro con la **dirección del edificio** de destino. Y el mensajero lo mete en una bolsa con la etiqueta del **siguiente punto de entrega** de su ruta.

Cada sobre añade la información que necesita **quien lo va a manejar**. Al llegar, se abren en orden inverso: primero la bolsa, luego el sobre del edificio, luego el del departamento, y por fin se lee la carta.

En una red ocurre lo mismo. Cada capa toma lo que le entrega la capa de arriba y le pone delante un **encabezado** con sus propios datos. A eso se le llama **encapsulación**.`),

      h('La PDU: cómo se llama el «sobre» en cada capa'),
      p(`A los datos, junto con el encabezado que les pone una capa, se les llama **PDU** (unidad de datos de protocolo). Cada capa le da a su PDU un nombre distinto, y esos nombres hay que saberlos de memoria:`),
      tabla(['Capa', 'PDU', 'Qué añade su encabezado'], [
        ['Aplicación (5 a 7)', '**Datos**', 'Nada todavía: es el contenido que genera el programa.'],
        ['Transporte (4)', '**Segmento** (con TCP) o datagrama (con UDP)', '**Puerto de origen y puerto de destino**: a qué aplicación va.'],
        ['Red (3)', '**Paquete**', '**IP de origen e IP de destino**: a qué equipo va, en cualquier red del mundo.'],
        ['Enlace de datos (2)', '**Trama**', '**MAC de origen y MAC de destino**: a qué equipo de esta red se entrega ahora. Añade también un tráiler al final para detectar errores.'],
        ['Física (1)', '**Bits**', 'Nada: convierte la trama en señales.'],
      ]),
      nota('truco', `De arriba abajo: **D**atos, **S**egmento, **P**aquete, **T**rama, **B**its. Una frase para recordarlo: «**D**ame **S**iempre **P**an **T**ostado **B**ien».`),
      nota('aviso', `En el habla diaria se dice «paquete» para todo. En el examen no: **paquete** es solo la PDU de capa 3, y **trama** la de capa 2. Si la pregunta habla de direcciones MAC, la respuesta es «trama»; si habla de direcciones IP, es «paquete».`),
      ejemplo('facil', 'La capa que pone los puertos', pdu('transporte')),
      ejemplo('facil', 'La capa que pone las direcciones IP', pdu('red')),
      ejemplo('facil', 'La capa que pone las direcciones MAC', pdu('enlace')),

      h('Encapsular al enviar, desencapsular al recibir'),
      p(`Sigamos un ejemplo completo: escribes \`www.ejemplo.com\` en el navegador y pulsas Enter.`),
      orden(
        '**Aplicación.** El navegador crea la petición HTTP: «dame la página principal». Son los **datos**.',
        '**Transporte.** TCP corta los datos en trozos y a cada uno le pone un encabezado con el puerto de origen (uno al azar, por ejemplo 51000) y el de destino (443, HTTPS). Ya es un **segmento**.',
        '**Red.** IP le pone un encabezado con la dirección IP de tu equipo y la del servidor. Ya es un **paquete**.',
        '**Enlace de datos.** Ethernet le pone un encabezado con tu dirección MAC y la MAC del siguiente equipo del camino, y un tráiler al final. Ya es una **trama**.',
        '**Física.** La tarjeta de red convierte la trama en **bits** y los bits en señales eléctricas, de luz o de radio.',
      ),
      p(`En el equipo que recibe ocurre lo contrario, de abajo arriba: cada capa lee **su** encabezado, comprueba que el mensaje es para ella, lo quita y pasa el resto a la capa de arriba. Eso es la **desencapsulación**.`),
      codigo('Una trama por dentro: cada capa envuelve a la anterior', `┌──────────────┬──────────────┬──────────────┬───────────────┬─────────┐
│ Encabezado   │ Encabezado   │ Encabezado   │    Datos      │ Tráiler │
│ de trama     │ IP           │ TCP          │ (petición     │ (FCS)   │
│ MAC origen   │ IP origen    │ Puerto orig. │  HTTP)        │         │
│ MAC destino  │ IP destino   │ Puerto dest. │               │         │
└──────────────┴──────────────┴──────────────┴───────────────┴─────────┘
               └────────────── paquete ─────────────────────┘
                              └──────────── segmento ───────┘`),
      nota('clave', `El **tráiler** de la trama lleva un código de comprobación llamado **FCS**. El equipo que recibe lo recalcula: si no coincide, la trama se dañó en el camino y se **descarta**. La capa 2 detecta el error, pero no lo corrige; pedir de nuevo lo perdido es trabajo de TCP, en la capa 4.`),
      ejemplo('medio', 'Ordenar la encapsulación', ord(
        'Un navegador envía una petición a un servidor web. Ordena las PDU en el orden en que se van creando en el equipo que **envía**.',
        ['Datos', 'Segmento', 'Paquete', 'Trama', 'Bits'],
        [
          'Al enviar se recorre el modelo de arriba abajo: la aplicación es la primera en actuar.',
          'La aplicación genera los **datos**. Transporte les añade los puertos y los convierte en **segmento**.',
          'Red añade las direcciones IP: **paquete**. Enlace de datos añade las direcciones MAC y el tráiler: **trama**.',
          'Por último, la capa física transmite la trama como **bits**. El receptor recorre el mismo camino al revés.',
        ])),

      h('Tres direcciones para tres preguntas'),
      p(`Una misma comunicación lleva **tres tipos de dirección**, cada una en una capa distinta, porque cada una responde a una pregunta diferente. Con el ejemplo del envío por paquetería:`),
      tabla(['Dirección', 'Capa', 'Pregunta que responde', 'En la paquetería sería…'], [
        ['**Puerto**', '4 · Transporte', '¿A qué **aplicación** del equipo va esto?', 'El nombre de la persona dentro de la casa.'],
        ['**Dirección IP**', '3 · Red', '¿A qué **equipo**, en cualquier red del mundo, va esto?', 'La dirección completa del destino final: ciudad, calle y número.'],
        ['**Dirección MAC**', '2 · Enlace de datos', '¿A qué equipo **de esta red** se lo entrego **ahora**?', 'La siguiente parada del camión en su ruta.'],
      ]),
      p(`La **dirección MAC** viene grabada de fábrica en cada tarjeta de red. Tiene **48 bits** y se escribe con 12 dígitos hexadecimales, por ejemplo \`00:1a:2b:3c:4d:5e\`. Los primeros 24 bits identifican al fabricante y los otros 24, a la tarjeta. Según el sistema la verás escrita de tres maneras:`),
      tabla(['Sistema', 'Formato'], [
        ['Linux y macOS', '`00:1a:2b:3c:4d:5e`'],
        ['Windows', '`00-1A-2B-3C-4D-5E`'],
        ['Cisco IOS', '`001a.2b3c.4d5e`'],
      ]),
      nota('clave', `¿Por qué hacen falta **dos** direcciones (IP y MAC) para un mismo equipo? Porque hacen trabajos distintos. La **IP** dice **a dónde va** el paquete en total; la **MAC** dice **quién es el siguiente** que lo recibe dentro de la red actual. El destino final no cambia durante el viaje; la siguiente parada cambia en cada tramo.`),

      h('Lo que cambia y lo que no en cada salto'),
      p(`Este es el punto más importante de la lección, y uno de los que más se preguntan. Cuando un paquete cruza un **router** para ir de una red a otra:`),
      lista(
        'Las **direcciones IP no cambian**: siguen siendo la del equipo que envió y la del destino final.',
        'Las **direcciones MAC cambian en cada red**: el router quita la trama con la que llegó el paquete y fabrica una trama nueva para la red siguiente.',
        'Los **puertos no cambian**: siguen identificando a las mismas dos aplicaciones.',
      ),
      p(`¿Por qué? Porque una trama **solo vive dentro de una red**. Un switch la reenvía tal cual, pero un router es el final de esa red: abre la trama, mira la IP de destino del paquete que venía dentro, decide por qué interfaz debe salir y lo mete en una **trama nueva**, con su propia MAC como origen.`),
      nota('error', `Un error típico: creer que la computadora pone como MAC de destino la del servidor remoto. No puede: no conoce la MAC de equipos de otras redes, ni le serviría. Cuando el destino está en **otra red**, la MAC de destino de la trama es la de la **puerta de enlace** (el router).`, 'Error frecuente'),
      ejemplo('medio', 'El primer tramo: de la computadora al router', salto('A')),
      ejemplo('medio', 'El segundo tramo: del router al servidor', salto('B')),
      ejemplo('dificil', 'La respuesta, de vuelta en la red de la computadora', salto('A', 'vuelta')),
      nota('aviso', `Hay una excepción a «la IP no cambia» que verás en el módulo de direccionamiento: la **NAT**, con la que el router de salida a internet sustituye la IP privada de origen por una pública. En este tema, y mientras no se mencione NAT, las direcciones IP se mantienen de extremo a extremo.`),

      h('Resumen'),
      lista(
        'Encapsular es añadir un encabezado en cada capa al bajar; desencapsular es quitarlo al subir.',
        'PDU: **datos** (aplicación), **segmento** (transporte), **paquete** (red), **trama** (enlace de datos) y **bits** (física).',
        'El **puerto** identifica la aplicación; la **IP**, el equipo de destino final; la **MAC**, el siguiente equipo dentro de la red actual.',
        'Al cruzar un router, las **IP se conservan** y las **MAC se sustituyen** por las del nuevo tramo.',
        'Si el destino está en otra red, la MAC de destino es la de la **puerta de enlace**.',
      ),

      ejercicios('Practica', 'En los ejercicios de tramos, decide primero quién envía y quién recibe la trama dentro de esa red.', [
        pdu('fisica'), pdu('aplicacion'), pdu('transporte'), pdu('red'), pdu('enlace'),
        salto('A', 'ida', 5, 7), salto('B', 'ida', 5, 7), salto('B', 'vuelta', 5, 7), salto('A', 'vuelta', 30, 40), salto('B', 'ida', 30, 40),
        ord('Un servidor **recibe** una petición. Ordena las PDU en el orden en que las va procesando (desencapsulación).', ['Bits', 'Trama', 'Paquete', 'Segmento', 'Datos'], 'Al recibir se sube por el modelo: los bits forman la trama, de la trama sale el paquete, del paquete el segmento y del segmento los datos.'),
        rel('Relaciona cada PDU con la capa OSI a la que pertenece.', [['Trama', 'Capa 2 · Enlace de datos'], ['Paquete', 'Capa 3 · Red'], ['Segmento', 'Capa 4 · Transporte'], ['Bits', 'Capa 1 · Física']], 'Bits en la capa física, trama en enlace de datos, paquete en red y segmento en transporte.', ['Capa 7 · Aplicación']),
        op('¿Qué información añade el encabezado de la capa de transporte?', ['Las direcciones MAC de origen y destino', 'Las direcciones IP de origen y destino', 'Los puertos de origen y destino', 'El código FCS de comprobación'], 2, 'Transporte identifica a las aplicaciones con puertos. Las MAC y el FCS son de la trama (capa 2) y las IP son del paquete (capa 3).'),
        op('Una computadora envía un paquete a un servidor que está en **otra red**. ¿Qué dirección MAC de destino lleva la trama que sale de la computadora?', ['La del servidor', 'La de la puerta de enlace (el router)', 'La del switch', 'La de broadcast, siempre'], 1, 'La trama solo llega hasta el siguiente equipo de la red local, que es el router. El switch reenvía la trama sin ser su destinatario, y la MAC del servidor remoto no se conoce ni sirve en esta red.'),
        op('Un paquete cruza tres routers hasta llegar a su destino. ¿Qué se mantiene igual durante todo el viaje (sin NAT)?', ['Las direcciones MAC de origen y destino', 'Las direcciones IP de origen y destino', 'La trama completa', 'El código FCS'], 1, 'Las direcciones IP identifican a los dos extremos y no cambian. La trama, sus MAC y su FCS se rehacen en cada red.'),
        vs('¿Cuáles **dos** afirmaciones sobre la dirección MAC son correctas?', ['Tiene 48 bits', 'Sirve para llegar a equipos de otras redes', 'Se escribe en hexadecimal', 'La asigna el servidor DHCP', 'Cambia cada vez que el equipo se mueve de red'], [0, 2], 'La MAC tiene 48 bits, se escribe con 12 dígitos hexadecimales y viene de fábrica en la tarjeta. Solo sirve dentro de la red local; lo que asigna DHCP y cambia al moverse es la dirección IP.'),
        op('Un equipo recibe una trama, recalcula el FCS y el resultado no coincide con el del tráiler. ¿Qué hace?', ['Corrige los bits dañados', 'Descarta la trama', 'La reenvía por todos los puertos', 'Pide una nueva dirección IP'], 1, 'El FCS solo sirve para detectar que la trama se dañó; al detectarlo, se descarta. Si la aplicación usa TCP, será TCP quien pida de nuevo los datos.'),
        op('¿Cuál de estas es una dirección MAC escrita en el formato de Cisco IOS?', ['`00:1a:2b:3c:4d:5e`', '`00-1A-2B-3C-4D-5E`', '`001a.2b3c.4d5e`', '`192.168.1.10`'], 2, 'Cisco agrupa los 12 dígitos en tres bloques de cuatro separados por puntos. Los dos puntos son de Linux y macOS, los guiones de Windows, y la última opción es una dirección IPv4.'),
        op('¿Qué hace un router con la trama en la que le llega un paquete?', ['La reenvía sin modificarla', 'La descarta y crea una trama nueva para la red de salida', 'Le cambia solo la dirección IP de destino', 'Le añade un segundo encabezado de trama encima'], 1, 'El router desencapsula hasta la capa 3, decide la salida y vuelve a encapsular el paquete en una trama nueva, con las MAC del nuevo tramo.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 4 */
  {
    slug: 'ancho-de-banda-y-rendimiento',
    titulo: 'Ancho de banda, throughput y latencia',
    resumen: 'La diferencia entre lo que un enlace promete y lo que entrega, qué son la latencia, el jitter y la pérdida, cómo no confundir megabits con megabytes y cómo se mide una conexión.',
    nivel: 'medio',
    objetivos: [
      'Diferenciar ancho de banda, throughput y goodput.',
      'Explicar latencia, jitter y pérdida de paquetes, y a qué aplicaciones afectan más.',
      'Convertir entre Mbps y MB/s y calcular tiempos de transferencia.',
      'Saber qué mide una prueba de velocidad y qué mide iPerf.',
    ],
    bloques: [
      h('La tubería y el agua'),
      p(`Piensa en una tubería. Su **diámetro** dice cuánta agua **podría** pasar como máximo. Pero la cantidad que **realmente** sale por la llave depende de más cosas: la presión, si hay fugas, si otras llaves están abiertas, si un tramo es más angosto.

En una red pasa igual, y hay una palabra para cada cosa:`),
      tabla(['Término', 'Qué es', 'En la tubería'], [
        ['**Ancho de banda**', 'La capacidad **máxima teórica** de un enlace: cuántos bits por segundo puede transportar.', 'El diámetro del tubo.'],
        ['**Throughput**', 'Los bits por segundo que **de verdad** pasan en un momento dado, medidos.', 'El agua que sale realmente por la llave.'],
        ['**Goodput**', 'La parte del throughput que es **dato útil** para la aplicación, sin contar encabezados ni retransmisiones.', 'El agua que cae dentro del vaso.'],
      ]),
      formula('goodput ≤ throughput ≤ ancho de banda', [], 'El throughput nunca supera al ancho de banda, y el goodput nunca supera al throughput.'),
      p(`El throughput casi siempre es menor que el ancho de banda. Las causas más comunes:`),
      lista(
        '**Congestión**: muchos equipos comparten el mismo enlace al mismo tiempo.',
        '**El tramo más lento del camino**: si entre tú y el servidor hay un enlace de 10 Mbps, no pasarán más de 10 Mbps, aunque todos los demás sean de 1 Gbps. A ese tramo se le llama **cuello de botella**.',
        '**Errores e interferencia**: tramas dañadas que hay que volver a enviar (muy común en wifi).',
        '**Latencia alta**: TCP envía más despacio cuando los acuses tardan en volver.',
        '**El propio equipo**: un disco lento, un procesador ocupado o una tarjeta de red antigua.',
      ),
      nota('clave', `En el examen, si la pregunta dice «capacidad», «máximo» o «lo que contrataste», la respuesta es **ancho de banda**. Si dice «medido», «real» u «obtenido», es **throughput**.`),
      ejemplo('facil', 'Lo contratado frente a lo medido', op(
        'Una oficina contrató un enlace de internet de 200 Mbps. A las 11 de la mañana, un técnico mide la velocidad y obtiene 140 Mbps. ¿Qué nombre recibe cada cifra?',
        ['200 Mbps es el ancho de banda y 140 Mbps es el throughput', '200 Mbps es el throughput y 140 Mbps es el ancho de banda', '200 Mbps es la latencia y 140 Mbps es el jitter', 'Las dos cifras son ancho de banda'], 0,
        [
          'Los 200 Mbps son lo que el enlace **puede** dar como máximo: es su capacidad, el **ancho de banda**.',
          'Los 140 Mbps son lo que **realmente** pasó en el momento de la medición: es el **throughput**.',
          'Que el throughput sea menor es normal: a media mañana hay más equipos usando el enlace (congestión). No significa, por sí solo, que el servicio esté fallando.',
        ])),
      ejemplo('medio', 'El tramo más lento manda', op(
        'Una computadora con tarjeta de 1 Gbps descarga un archivo de un servidor que también tiene 1 Gbps. Entre los dos hay un enlace WAN de 50 Mbps. Sin más tráfico en la red, ¿cuál es el throughput máximo posible de la descarga?',
        ['1 Gbps', '525 Mbps', '50 Mbps', '2 Gbps'], 2,
        [
          'Los datos tienen que pasar por **todos** los enlaces del camino, uno tras otro.',
          'El enlace más lento limita a los demás: es el **cuello de botella**. No sirve de nada que los extremos sean rápidos si en medio hay un tramo angosto.',
          'El enlace más lento es el de 50 Mbps, así que el throughput no puede pasar de **50 Mbps**. No se promedian ni se suman las velocidades.',
        ])),

      h('Latencia, jitter y pérdida'),
      p(`La velocidad no es lo único que importa. Una conexión puede tener mucho ancho de banda y aun así sentirse mal. Hay tres medidas más:`),
      tabla(['Medida', 'Qué es', 'Unidad', 'A quién afecta más'], [
        ['**Latencia** (retardo o delay)', 'El tiempo que tarda un dato en ir del origen al destino. `ping` muestra el tiempo de **ida y vuelta**.', 'Milisegundos (ms)', 'Llamadas, videollamadas, juegos en línea.'],
        ['**Jitter**', 'La **variación** de la latencia: que unos paquetes tarden 20 ms y otros 90 ms.', 'Milisegundos (ms)', 'Voz y video en tiempo real: el audio se entrecorta.'],
        ['**Pérdida de paquetes**', 'El porcentaje de paquetes que salen y nunca llegan.', 'Porcentaje (%)', 'Todo. Con TCP provoca retransmisiones y lentitud; con UDP, huecos en el audio o el video.'],
      ]),
      p(`Una analogía para separar **latencia** de **ancho de banda**: una autopista. El ancho de banda es el **número de carriles** (cuántos autos pasan a la vez). La latencia es **cuánto tarda cada auto** en llegar. Añadir carriles no acerca las ciudades: un enlace por satélite puede tener muchísimo ancho de banda y, aun así, una latencia de más de 500 ms, porque la señal tiene que viajar hasta el espacio y volver.`),
      p(`La latencia total es la suma de varios retardos: el tiempo que la señal tarda en recorrer la distancia (**propagación**), el tiempo que cada router tarda en procesar el paquete (**procesamiento**) y el tiempo que el paquete espera en fila cuando hay congestión (**encolamiento**).`),
      codigo('Una salida de ping: aquí se leen la latencia y la pérdida', `C:\\> ping 8.8.8.8

Haciendo ping a 8.8.8.8 con 32 bytes de datos:
Respuesta desde 8.8.8.8: bytes=32 tiempo=21ms TTL=117
Respuesta desde 8.8.8.8: bytes=32 tiempo=23ms TTL=117
Respuesta desde 8.8.8.8: bytes=32 tiempo=95ms TTL=117
Respuesta desde 8.8.8.8: bytes=32 tiempo=22ms TTL=117

Estadísticas de ping para 8.8.8.8:
    Paquetes: enviados = 4, recibidos = 4, perdidos = 0 (0% perdidos),
Tiempos aproximados de ida y vuelta en milisegundos:
    Mínimo = 21ms, Máximo = 95ms, Media = 40ms`),
      p(`En esa salida: la **latencia** de ida y vuelta ronda los 21 a 23 ms; hay un paquete que tardó 95 ms, y esa diferencia entre unos y otros es el **jitter**; y la **pérdida** es 0 %.`),
      nota('truco', `Valores orientativos para voz sobre IP de buena calidad: latencia de un sentido por debajo de **150 ms**, jitter por debajo de **30 ms** y pérdida por debajo del **1 %**. No son límites del examen, pero ayudan a juzgar una medición.`),
      ejemplo('medio', 'Qué medida explica el síntoma', op(
        'En una oficina las descargas de archivos van rápidas, pero en las llamadas de voz sobre IP la voz se oye entrecortada y robótica. Un `ping` al servidor de telefonía muestra tiempos de 15 ms, 140 ms, 20 ms, 180 ms y 18 ms, sin pérdidas. ¿Cuál es el problema?',
        ['Falta ancho de banda', 'Jitter alto', 'Pérdida de paquetes', 'El servidor DNS no responde'], 1,
        [
          'Las descargas van rápidas: el ancho de banda no es el problema.',
          'No hay paquetes perdidos, así que tampoco es pérdida.',
          'Lo llamativo es que los tiempos **saltan** de 15 a 180 ms. La latencia varía muchísimo de un paquete a otro: eso es **jitter**.',
          'La voz necesita que los paquetes lleguen a ritmo constante. Con jitter alto llegan a destiempo y el audio se entrecorta. Las descargas no lo notan porque TCP espera y reordena.',
        ])),

      h('Bits y bytes: la trampa de la «b»'),
      p(`Aquí se equivoca casi todo el mundo, y es fácil de evitar. Hay dos unidades con nombres parecidos:`),
      tabla(['Unidad', 'Símbolo', 'Dónde se usa'], [
        ['**bit**', '**b** minúscula', 'Velocidades de red: kbps, Mbps, Gbps.'],
        ['**byte** (8 bits)', '**B** mayúscula', 'Tamaños de archivos y de discos: kB, MB, GB.'],
      ]),
      formula('1 byte = 8 bits  →  MB/s = Mbps ÷ 8', [['Mbps', 'megabits por segundo: como anuncian la velocidad los proveedores'], ['MB/s', 'megabytes por segundo: como muestra la velocidad una descarga']], 'Por eso una conexión de 100 Mbps descarga, como mucho, a 12.5 MB/s. No es que te estén dando menos: son unidades distintas.'),
      tabla(['Prefijo', 'Significa', 'Ejemplo'], [
        ['k (kilo)', '1,000', '1 kbps = 1,000 bits por segundo'],
        ['M (mega)', '1,000,000', '1 Mbps = 1,000 kbps'],
        ['G (giga)', '1,000,000,000', '1 Gbps = 1,000 Mbps'],
      ]),
      nota('aviso', `En este curso se usa **1 GB = 1,000 MB**, que es lo habitual al hablar de redes. Algunos sistemas operativos cuentan con 1,024; para los cálculos del examen basta el factor 1,000 y, sobre todo, no olvidar el **8** entre bits y bytes.`),
      ejemplo('facil', 'De megabits a megabytes', uni('convertir', 80)),
      ejemplo('medio', 'Cuánto tarda una descarga', uni('tiempo', 40, 300)),
      ejemplo('medio', 'Un archivo en gigabytes', uni('tiempo', 200, 5000)),
      ejemplo('dificil', 'Calcular el throughput a partir de una copia', uni('medir', 64, 480)),

      h('Cómo se mide: prueba de velocidad e iPerf'),
      p(`Hay dos herramientas clásicas para medir el throughput, y miden **cosas distintas**. El examen pide saber cuándo usar cada una.`),
      tabla(['', 'Prueba de velocidad (speed test)', 'iPerf'], [
        ['Qué mide', 'El throughput entre tu equipo y un **servidor en Internet**.', 'El throughput entre **dos equipos que tú eliges**.'],
        ['Qué tramo evalúa', 'Tu red local, tu conexión con el proveedor y parte de Internet, todo junto.', 'Exactamente el camino entre los dos equipos: por ejemplo, solo tu LAN o solo un enlace WAN.'],
        ['Qué necesitas', 'Un navegador o una aplicación.', 'Instalar iPerf en los dos extremos: uno como **servidor** y otro como **cliente**.'],
        ['Resultados', 'Bajada, subida y latencia (ping).', 'Throughput y, con UDP, también jitter y pérdida.'],
        ['Úsalo para', 'Comprobar si el proveedor entrega lo contratado.', 'Encontrar en qué tramo interno está el cuello de botella.'],
      ]),
      codigo('iPerf: un equipo espera como servidor y el otro mide como cliente', `Servidor$ iperf3 -s
-----------------------------------------------------------
Server listening on 5201

Cliente$ iperf3 -c 192.168.10.50
Connecting to host 192.168.10.50, port 5201
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-10.00  sec  1.09 GBytes   938 Mbits/sec   sender
[  5]   0.00-10.00  sec  1.09 GBytes   936 Mbits/sec   receiver`),
      p(`En esa salida, iPerf transfirió 1.09 GB en 10 segundos entre dos equipos de la misma LAN: un throughput de unos 936 Mbps, lo esperado en un enlace de 1 Gbps.`),
      nota('clave', `Una prueba de velocidad con resultado bajo **no dice dónde** está el problema: puede ser tu wifi, tu router, el proveedor o el servidor de la prueba. Con **iPerf** entre dos equipos de tu propia red puedes descartar (o confirmar) que el problema esté dentro.`),
      ejemplo('dificil', 'Elegir la herramienta de medición', op(
        'Los usuarios del segundo piso se quejan de que copiar archivos al servidor de la planta baja es muy lento. La prueba de velocidad contra Internet da resultados normales. ¿Qué debe hacer el técnico para medir el tramo sospechoso?',
        ['Repetir la prueba de velocidad en otro navegador', 'Ejecutar iPerf entre una computadora del segundo piso y el servidor', 'Llamar al proveedor de internet para reclamar', 'Medir la latencia hacia `8.8.8.8` con `ping`'], 1,
        [
          'El problema está entre dos equipos de la **red interna**: las computadoras del segundo piso y el servidor. Internet no participa en esa copia.',
          'La prueba de velocidad mide el camino hacia un servidor de Internet. Ya salió bien y, además, no pasa por el tramo que falla. Repetirla o llamar al proveedor no aporta nada.',
          '**iPerf** mide el throughput exactamente entre los dos equipos que se elijan. Se pone el servidor en modo servidor y la computadora del segundo piso en modo cliente.',
          'Si iPerf da un valor bajo, el cuello de botella está en la LAN (un cable dañado, un puerto negociado a 100 Mbps, un switch saturado). Si da un valor normal, hay que mirar el disco o el servicio de archivos.',
        ])),

      h('Resumen'),
      lista(
        '**Ancho de banda** = capacidad máxima. **Throughput** = lo que realmente pasa. **Goodput** = lo útil para la aplicación.',
        'El throughput de un camino lo limita su enlace más lento: el **cuello de botella**.',
        '**Latencia** = tiempo de viaje. **Jitter** = variación de la latencia. **Pérdida** = paquetes que no llegan.',
        'La voz y el video en vivo sufren con la latencia y el jitter; las descargas, con la pérdida y el poco ancho de banda.',
        '**b** = bit, **B** = byte. Mbps ÷ 8 = MB/s.',
        'La **prueba de velocidad** mide contra Internet; **iPerf** mide entre dos equipos que tú controlas.',
      ),

      ejercicios('Practica', 'En los cálculos, iguala primero las unidades: pasa los Mbps a MB/s dividiendo entre 8.', [
        uni('convertir', 8), uni('convertir', 100 * 8), uni('convertir', 240), uni('convertir', 400),
        uni('tiempo', 80, 600), uni('tiempo', 16, 240), uni('tiempo', 400, 10000), uni('tiempo', 800, 4000),
        uni('tamano', 48, 180), uni('tamano', 120, 900), uni('medir', 96, 720), uni('medir', 160, 2000),
        op('¿Cómo se llama la cantidad de datos que **realmente** se transfiere por un enlace en un periodo de tiempo?', ['Ancho de banda', 'Throughput', 'Latencia', 'Jitter'], 1, 'El throughput es la medida real. El ancho de banda es la capacidad máxima teórica; latencia y jitter miden tiempos, no cantidad de datos.'),
        op('¿Qué medida describe la **variación** del retardo entre un paquete y otro?', ['Latencia', 'Goodput', 'Jitter', 'Ancho de banda'], 2, 'El jitter es la variación de la latencia. La latencia es el retardo en sí, no su variación.'),
        vs('¿Cuáles **dos** factores pueden hacer que el throughput sea menor que el ancho de banda?', ['La congestión del enlace', 'El color del cable', 'La interferencia y los errores de transmisión', 'El nombre del equipo', 'La marca del monitor'], [0, 2], 'La congestión y las retransmisiones por errores reducen lo que realmente pasa. Las otras opciones no tienen relación con la transmisión de datos.'),
        op('Una videollamada se congela a ratos. El `ping` muestra una latencia estable de 25 ms, pero un 8 % de paquetes perdidos. ¿Qué describe mejor el problema?', ['Jitter alto', 'Pérdida de paquetes', 'Latencia alta', 'Ancho de banda excesivo'], 1, 'La latencia es baja y estable, así que no es latencia ni jitter. Lo anormal es el 8 % de pérdida: esos paquetes nunca llegan y dejan huecos en el video.'),
        op('¿Qué herramienta mide el throughput entre dos equipos concretos de tu propia red?', ['Una prueba de velocidad en línea', 'iPerf', '`nslookup`', 'El administrador de tareas'], 1, 'iPerf mide entre un equipo que hace de servidor y otro que hace de cliente. La prueba de velocidad mide contra un servidor de Internet.'),
        op('Un enlace por satélite ofrece 100 Mbps, pero las videollamadas se sienten con mucho retraso. ¿Por qué?', ['Porque el ancho de banda es insuficiente', 'Porque la latencia es alta: la señal recorre una distancia enorme', 'Porque el satélite usa UDP', 'Porque los archivos son muy grandes'], 1, 'El ancho de banda es bueno, pero la señal debe subir al satélite y bajar: eso añade cientos de milisegundos de latencia, y el ancho de banda no lo compensa.'),
        rel('Relaciona cada medida con su unidad habitual.', [['Ancho de banda', 'Mbps'], ['Latencia', 'ms'], ['Pérdida de paquetes', '%'], ['Tamaño de un archivo', 'MB']], 'La capacidad se mide en bits por segundo, el tiempo en milisegundos, la pérdida en porcentaje y los archivos en bytes.', ['Hz']),
        op('Tu proveedor anuncia 300 Mbps. ¿Cuál es la velocidad máxima de descarga que mostrará el navegador, en MB/s?', ['300 MB/s', '37.5 MB/s', '2,400 MB/s', '30 MB/s'], 1, '300 Mbps ÷ 8 = 37.5 MB/s. Multiplicar por 8 sería ir en el sentido contrario.'),
        op('Entre una computadora y un servidor hay tres enlaces: 1 Gbps, 100 Mbps y 1 Gbps. ¿Cuál es el throughput máximo de extremo a extremo?', ['2.1 Gbps', '700 Mbps', '100 Mbps', '1 Gbps'], 2, 'Manda el enlace más lento del camino, el cuello de botella: 100 Mbps. Las velocidades no se suman ni se promedian.'),
      ]),
    ],
  },
];
