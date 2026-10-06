// Medios y dispositivos finales · lecciones 1 a 4: cobre, fibra, Wi-Fi y redes celulares.
import { h, h3, p, lista, orden, tabla, nota, ejemplo, ejercicios, op, vs, rel, ord } from './_ayuda.mjs';

// Equipos de md-cable: 0 computadora, 1 portátil, 2 servidor, 3 impresora, 4 router, 5 switch, 6 hub.
const cable = (a, b) => ({ tipo: 'md-cable', a, b });
const consola = (a, b) => ({ tipo: 'md-cable', a, b, consola: true });
const cat = (vel, dist) => ({ tipo: 'md-categoria', vel, dist });
const con = (caso) => ({ tipo: 'md-conector', caso });
const fib = (caso) => ({ tipo: 'md-fibra', caso });
const canal = (a, b) => ({ tipo: 'md-canal', a, b });
const wifi = (pregunta, i) => ({ tipo: 'md-wifi', pregunta, i });
const medio = (caso) => ({ tipo: 'md-medio', caso });

export default [
  /* ------------------------------------------------------------------ 1 */
  {
    slug: 'cables-de-cobre',
    titulo: 'Cables de cobre: par trenzado, coaxial y sus conectores',
    resumen: 'Cómo es por dentro un cable de red, qué significan UTP, Cat 6 o T568B, cuándo se usa un cable directo, cruzado o de consola y por qué no debe pasar de 100 metros.',
    nivel: 'facil',
    objetivos: [
      'Distinguir par trenzado, coaxial y sus conectores (RJ-45, RJ-11, F y BNC).',
      'Elegir la categoría de cable según la velocidad y la distancia.',
      'Decidir entre cable directo, cruzado y de consola.',
      'Explicar qué es la interferencia y por qué el par trenzado se limita a 100 m.',
    ],
    bloques: [
      h('Qué es un «medio» de red'),
      p(`Para que dos equipos se comuniquen, los bits tienen que viajar por **algo**. Ese algo se llama **medio de transmisión**. Hay tres grandes familias:`),
      tabla(['Medio', 'Qué transporta', 'Ejemplo'], [
        ['**Cobre**', 'Impulsos eléctricos', 'El cable de red que sale de tu computadora'],
        ['**Fibra óptica**', 'Pulsos de luz', 'El cable que trae Internet desde la calle'],
        ['**Inalámbrico**', 'Ondas de radio', 'El Wi-Fi y la red del celular'],
      ]),
      p(`En esta lección vemos el cobre, que es el más común dentro de una oficina. Piensa en él como en una tubería de agua: funciona muy bien en tramos cortos, pero si la haces demasiado larga, el agua llega sin fuerza. Con la electricidad pasa lo mismo: la señal **se debilita con la distancia**.`),

      h('El cable de par trenzado'),
      p(`El cable de red típico se llama **par trenzado**. Si le quitas la cubierta, verás **8 hilos de cobre** de colores, enrollados de dos en dos: son **4 pares**.

¿Por qué están trenzados? No es un adorno. Cuando un hilo lleva corriente, genera un pequeño campo magnético que «ensucia» a los hilos vecinos. Al enrollar los dos hilos de un par, uno sobre otro, el ruido que capta uno queda cancelado por el otro. Es un truco sencillo y muy eficaz.`),
      nota('clave', `El trenzado es la defensa del cable contra el ruido. Por eso, al poner un conector, no debes destrenzar los pares más de lo necesario (unos 13 mm): cada centímetro sin trenzar es un punto débil.`),
      h3('Con blindaje o sin blindaje'),
      tabla(['Sigla', 'Nombre', 'Cómo es', 'Dónde se usa'], [
        ['**UTP**', 'Par trenzado sin blindaje', 'Solo los pares y la cubierta de plástico', 'Oficinas y casas: el más común y barato'],
        ['**FTP**', 'Par trenzado con lámina', 'Una lámina de aluminio envuelve a todos los pares', 'Lugares con algo de interferencia'],
        ['**STP**', 'Par trenzado blindado', 'Malla o lámina metálica, a veces en cada par', 'Fábricas, cerca de motores o de cables eléctricos'],
      ], 'El blindaje solo funciona si se conecta a tierra en el extremo. Un cable blindado mal instalado puede captar más ruido que uno sin blindaje.'),

      h('Las categorías: Cat 5e, Cat 6, Cat 6a…'),
      p(`No todos los cables de par trenzado son iguales. Se clasifican en **categorías**: cuanto más alta, más apretado es el trenzado, mejor aguanta el ruido y más velocidad admite. La categoría viene impresa en la cubierta del cable.`),
      tabla(['Categoría', 'Velocidad máxima', 'Distancia', 'Comentario'], [
        ['**Cat 5e**', '1 Gbps', '100 m', 'El mínimo aceptable hoy. Muy extendido.'],
        ['**Cat 6**', '1 Gbps / 10 Gbps', '100 m / 55 m', 'Llega a 10 Gbps, pero solo en tramos de hasta 55 m.'],
        ['**Cat 6a**', '10 Gbps', '100 m', 'La «a» es de *aumentada*: 10 Gbps en los 100 m completos.'],
        ['**Cat 7**', '10 Gbps', '100 m', 'Siempre blindado. Poco usado: no lo reconoce la norma TIA.'],
        ['**Cat 8**', '25 o 40 Gbps', '30 m', 'Solo para centros de datos, entre el servidor y el switch.'],
      ]),
      nota('truco', `Para el examen memoriza tres datos: **Cat 5e = 1 Gbps**, **Cat 6 = 10 Gbps hasta 55 m** y **Cat 6a = 10 Gbps hasta 100 m**. Casi todas las preguntas de categorías salen de ahí.`),
      ejemplo('facil', 'Una oficina normal', cat(1000, 60)),
      ejemplo('medio', '10 Gbps en un tramo corto', cat(10000, 40)),
      ejemplo('medio', '10 Gbps en un tramo largo', cat(10000, 85)),

      h('El límite de 100 metros'),
      p(`Sea cual sea la categoría, un tramo de par trenzado Ethernet no debe pasar de **100 metros**. La norma los reparte así: hasta 90 m de cable fijo dentro de la pared y hasta 10 m entre los dos latiguillos de los extremos (el del escritorio y el del rack).

Pasado ese límite la señal llega tan débil y deformada que el receptor empieza a confundir unos con ceros. El síntoma no es que «no funcione»: es una conexión lenta, con cortes y errores intermitentes, que es mucho más difícil de diagnosticar.`),
      p(`Si necesitas más distancia tienes dos salidas: poner un **switch** a medio camino (regenera la señal y empiezan otros 100 m) o usar **fibra óptica**.`),
      ejemplo('medio', 'Cuando el cobre no alcanza', cat(1000, 180)),

      h('El conector RJ-45 y las normas T568A y T568B'),
      p(`El par trenzado de red termina en un conector **RJ-45**: una pieza de plástico transparente con **8 contactos** dorados, uno por hilo, y una pestaña que hace «clic» al entrar.

No lo confundas con el **RJ-11**, el del teléfono fijo: es más estrecho y tiene 4 o 6 posiciones. Un RJ-11 entra flojo en un puerto RJ-45, pero no funciona y puede doblar los contactos.`),
      p(`Los 8 hilos no se colocan en cualquier orden. Hay dos normas, que solo se diferencian en que **intercambian el par naranja y el par verde**:`),
      tabla(['Pin', 'T568A', 'T568B'], [
        ['1', 'Blanco-verde', 'Blanco-naranja'],
        ['2', 'Verde', 'Naranja'],
        ['3', 'Blanco-naranja', 'Blanco-verde'],
        ['4', 'Azul', 'Azul'],
        ['5', 'Blanco-azul', 'Blanco-azul'],
        ['6', 'Naranja', 'Verde'],
        ['7', 'Blanco-marrón', 'Blanco-marrón'],
        ['8', 'Marrón', 'Marrón'],
      ], 'T568B es la más usada. Lo importante no es cuál elijas, sino usar la misma en toda la instalación.'),
      ejemplo('facil', 'Reconocer el conector de red', con(0)),
      ejemplo('facil', 'El conector que no es de red', con(3)),

      h('Cable directo, cruzado y de consola'),
      p(`Con las dos normas se pueden armar tres cables distintos. Para entender cuál usar, imagina una conversación: lo que sale de **tu boca** tiene que llegar al **oído** del otro. Si conectas boca con boca, nadie escucha.

En Ethernet clásico (10 y 100 Mbps), un equipo «habla» por un par de hilos y «escucha» por otro. Hay dos tipos de puerto:`),
      tabla(['Tipo de puerto', 'Habla por los pines', 'Escucha por los pines', 'Equipos'], [
        ['**MDI**', '1 y 2', '3 y 6', 'Computadoras, servidores, impresoras, routers'],
        ['**MDI-X**', '3 y 6', '1 y 2', 'Switches y hubs'],
      ]),
      tabla(['Cable', 'Cómo se arma', 'Para qué sirve'], [
        ['**Directo** (straight-through)', 'La misma norma en los dos extremos (B–B)', 'Equipos de tipo **distinto**: computadora ↔ switch, router ↔ switch'],
        ['**Cruzado** (crossover)', 'Una norma en cada extremo (A–B)', 'Equipos del **mismo** tipo: switch ↔ switch, computadora ↔ computadora, computadora ↔ router'],
        ['**De consola** (rollover)', 'Orden totalmente invertido: 1↔8, 2↔7…', 'Administrar un router o switch por su puerto de consola. **No es Ethernet.**'],
      ]),
      nota('truco', `Regla rápida: **distintos → directo; iguales → cruzado**. Y recuerda que el router cuenta como una computadora (es MDI): por eso computadora ↔ router lleva cable cruzado, aunque parezcan equipos distintos.`),
      ejemplo('facil', 'El caso de todos los días', cable(0, 5)),
      ejemplo('facil', 'Dos switches', cable(5, 5)),
      ejemplo('medio', 'La trampa del router', cable(1, 4)),
      ejemplo('medio', 'Configurar un equipo nuevo', consola(1, 5)),
      nota('clave', `**Auto-MDIX.** Casi todos los equipos actuales detectan qué cable tienen conectado y cruzan los pares por dentro si hace falta. Con ellos, un cable directo funciona siempre. El cable cruzado apenas se ve ya, pero la regla clásica **sí se pregunta** en los exámenes, y el cable de consola sigue siendo imprescindible.`),

      h('El cable coaxial'),
      p(`El **coaxial** es el cable redondo y grueso de la televisión por cable. Tiene un solo alambre de cobre en el centro, rodeado por un aislante, una malla metálica y la cubierta exterior. La malla actúa como escudo, así que resiste bien la interferencia.

En las redes locales ya no se usa (fue el cable de las primeras Ethernet), pero sigue muy vivo en un sitio: el **Internet por cable**. El cablemódem de tu casa recibe la señal por coaxial.`),
      tabla(['Conector', 'Cómo se fija', 'Dónde lo verás'], [
        ['**F**', 'Se enrosca', 'Cablemódems, televisores, antenas'],
        ['**BNC**', 'Bayoneta: empujar y girar un cuarto de vuelta', 'Redes Ethernet antiguas, cámaras analógicas, equipos de medición'],
      ]),

      h('Las fuentes de interferencia'),
      p(`Como el cobre transporta electricidad, cualquier cosa que genere campos eléctricos o magnéticos puede alterar la señal:`),
      tabla(['Nombre', 'Qué es', 'De dónde viene'], [
        ['**EMI** (interferencia electromagnética)', 'Ruido causado por campos eléctricos o magnéticos', 'Motores, elevadores, lámparas fluorescentes, cables de corriente'],
        ['**RFI** (interferencia de radiofrecuencia)', 'Ruido causado por ondas de radio', 'Emisoras, radios de dos vías, hornos de microondas'],
        ['**Diafonía** (crosstalk)', 'La señal de un par se «cuela» en el par de al lado', 'El propio cable, sobre todo si está destrenzado o mal rematado'],
      ]),
      p(`Las defensas, de menor a mayor costo: no tender los cables de red pegados a los de electricidad, usar una categoría más alta (trenzado más apretado), usar cable blindado y, si nada alcanza, pasar a fibra óptica, que es inmune.`),
      ejemplo('medio', 'Diagnosticar un enlace que falla a ratos', op(
        'Una computadora de un taller se conecta al switch por un cable UTP Cat 5e de 70 m que comparte canaleta con los cables de alimentación de varias máquinas. La conexión funciona, pero con errores y cortes cuando las máquinas arrancan. ¿Cuál es la causa más probable?',
        ['El cable supera la distancia máxima', 'Interferencia electromagnética (EMI) de los cables eléctricos', 'Cat 5e no soporta Ethernet', 'El switch no tiene Auto-MDIX'], 1,
        ['Primero se descarta la distancia: 70 m está dentro del límite de 100 m del par trenzado.',
          'El dato clave es **cuándo** falla: al arrancar las máquinas. Un motor al arrancar genera un campo electromagnético fuerte, y el cable de red va justo al lado de sus cables de alimentación.',
          'Es **EMI**. El cable es UTP, sin blindaje, así que no tiene defensa. La solución es separar la canaleta de datos de la eléctrica, usar cable blindado (STP) bien aterrizado o cambiar ese tramo por fibra.',
          'Auto-MDIX no tiene nada que ver: si el tipo de cable fuera incorrecto, el enlace no funcionaría nunca, no «a ratos».'])),

      h('Resumen'),
      lista(
        'El par trenzado tiene 4 pares; el trenzado cancela el ruido. UTP no lleva blindaje; STP y FTP sí.',
        'Cat 5e: 1 Gbps. Cat 6: 10 Gbps hasta 55 m. Cat 6a: 10 Gbps hasta 100 m. Cat 8: 40 Gbps hasta 30 m.',
        'Ningún tramo de par trenzado pasa de 100 m.',
        'RJ-45 (8 contactos) para red; RJ-11 para teléfono; F y BNC para coaxial.',
        'Equipos distintos: cable directo. Equipos iguales: cable cruzado. Puerto de consola: cable rollover.',
        'EMI, RFI y diafonía son los enemigos del cobre.',
      ),

      ejercicios('Practica', 'En los ejercicios de cables, supón siempre equipos sin Auto-MDIX, como hace el examen.', [
        cable(0, 5), cable(4, 5), cable(0, 0), cable(5, 6), cable(4, 4), cable(2, 5), cable(3, 4), consola(0, 4),
        cat(100, 90), cat(1000, 100), cat(10000, 55), cat(10000, 56), cat(40000, 20), cat(40000, 60), cat(10000, 150),
        con(0), con(2), con(4), con(5),
        op('¿Para qué se trenzan los hilos de un cable de red?', ['Para que el cable sea más flexible', 'Para cancelar la interferencia entre pares y la que llega de fuera', 'Para que la señal viaje más rápido', 'Para distinguir los pares por su color'], 1, 'Al ir enrollados, los dos hilos de un par captan el mismo ruido y este se cancela. Es la protección básica del par trenzado.'),
        op('¿En qué se diferencian las normas T568A y T568B?', ['En el número de hilos que usan', 'En que intercambian la posición del par naranja y el par verde', 'En la velocidad máxima', 'En el tipo de conector'], 1, 'Las dos usan los 8 hilos en un RJ-45. Solo cambian de sitio los pares naranja y verde (pines 1, 2, 3 y 6).'),
        op('Un cable tiene T568A en un extremo y T568B en el otro. ¿Qué cable es?', ['Directo', 'Cruzado', 'De consola', 'Coaxial'], 1, 'Una norma distinta en cada extremo cruza los pares de transmisión y recepción: es un cable cruzado.'),
        vs('¿Cuáles **dos** conectores se usan con cable coaxial?', ['RJ-45', 'F', 'RJ-11', 'BNC', 'LC'], [1, 3], 'El F (roscado) y el BNC (bayoneta) son de coaxial. RJ-45 y RJ-11 son de par trenzado y telefónico; LC es de fibra.'),
        rel('Relaciona cada cable con su uso.', [['Directo', 'Computadora a switch'], ['Cruzado', 'Switch a switch'], ['De consola', 'Administrar un router por su puerto de gestión local'], ['Coaxial con conector F', 'Señal del proveedor al cablemódem']], 'Directo une equipos de tipo distinto; cruzado, del mismo tipo; el de consola no es Ethernet; el coaxial trae el servicio de Internet por cable.'),
        op('Un usuario dice que su conexión va lenta y con cortes. El cable UTP entre su computadora y el switch mide 135 m. ¿Qué haces?', ['Cambiar el cable por uno cruzado', 'Acortar el tramo a 100 m como máximo, con un switch intermedio o con fibra', 'Cambiar el conector RJ-45 por un RJ-11', 'Activar Auto-MDIX'], 1, 'El par trenzado garantiza 100 m. A 135 m la señal llega atenuada: el enlace sube, pero con errores. Hay que regenerar la señal o cambiar de medio.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 2 */
  {
    slug: 'fibra-optica',
    titulo: 'Fibra óptica: monomodo, multimodo y conectores',
    resumen: 'Cómo viaja la luz por un hilo de vidrio, la diferencia entre fibra monomodo y multimodo, los conectores LC, SC, ST y MPO, los módulos SFP y cuándo conviene la fibra.',
    nivel: 'facil',
    objetivos: [
      'Explicar cómo transporta datos una fibra óptica.',
      'Diferenciar fibra monomodo y multimodo por núcleo, alcance, fuente de luz y color.',
      'Reconocer los conectores de fibra y qué es un transceptor SFP.',
      'Decidir cuándo usar fibra y cuándo cobre.',
    ],
    bloques: [
      h('Datos convertidos en luz'),
      p(`Una fibra óptica es un hilo de **vidrio** (a veces de plástico) más delgado que un cabello. En lugar de electricidad transporta **luz**: un pulso de luz es un 1 y la ausencia de luz es un 0. En un extremo hay un emisor (un LED o un láser) que parpadea millones de veces por segundo, y en el otro, un sensor que lee esos destellos.

¿Y cómo no se escapa la luz? Piensa en un tubo cuyas paredes interiores son espejos: si alumbras por un extremo, la luz rebota y rebota hasta salir por el otro, aunque el tubo haga curvas. La fibra consigue ese efecto con dos capas de vidrio distinto.`),
      tabla(['Parte', 'Qué es', 'Para qué sirve'], [
        ['**Núcleo**', 'El hilo central de vidrio', 'Por aquí viaja la luz'],
        ['**Revestimiento**', 'Otra capa de vidrio que rodea al núcleo', 'Actúa como espejo: devuelve la luz al núcleo'],
        ['**Recubrimiento y cubierta**', 'Capas de plástico y fibras de refuerzo', 'Protegen el vidrio de golpes y humedad'],
      ]),
      nota('clave', `Como una fibra lleva luz en un solo sentido, un enlace normal usa **dos fibras**: una para transmitir (TX) y otra para recibir (RX). Por eso los latiguillos de fibra suelen ser dobles, y por eso un error típico es conectarlas al revés: TX de un lado debe llegar a RX del otro.`),

      h('Monomodo y multimodo'),
      p(`«Modo» significa aquí **camino de luz**. La diferencia entre los dos tipos de fibra es el grosor del núcleo, y de ahí sale todo lo demás.`),
      h3('Multimodo (MMF): núcleo ancho, varios caminos'),
      p(`Su núcleo mide **50 o 62.5 micras**. Es lo bastante ancho para que la luz entre con muchos ángulos y recorra **varios caminos** a la vez: unos rayos van casi rectos y otros rebotan mucho.

El problema: los rayos que rebotan más recorren más distancia y llegan un poco después. El pulso de luz, que salió nítido, llega «estirado». A esto se le llama **dispersión modal**. Si el cable es largo, un pulso se monta sobre el siguiente y el receptor ya no los distingue. Por eso la multimodo se usa en distancias **cortas**: dentro de un edificio o un centro de datos.

A cambio, como el núcleo es ancho, es fácil meterle luz: basta un **LED** o un láser económico (VCSEL). Los equipos son más baratos.`),
      h3('Monomodo (SMF): núcleo fino, un solo camino'),
      p(`Su núcleo mide solo **8 a 10 micras** (se suele decir 9). Es tan estrecho que la luz solo puede viajar por **un camino**, en línea recta. No hay rayos que lleguen tarde, así que el pulso se conserva nítido durante **decenas de kilómetros**.

A cambio, para acertar en un núcleo tan fino hace falta un **láser** de precisión. Los equipos son más caros.`),
      tabla(['', 'Monomodo (SMF)', 'Multimodo (MMF)'], [
        ['Núcleo', '8 – 10 micras', '50 o 62.5 micras'],
        ['Caminos de luz', 'Uno', 'Varios'],
        ['Fuente de luz', 'Láser', 'LED o VCSEL'],
        ['Alcance típico', 'Decenas de kilómetros', 'Hasta unos 550 m'],
        ['Color de la cubierta', '**Amarillo**', '**Naranja** (OM1/OM2), **aguamarina** (OM3/OM4), verde lima (OM5)'],
        ['Clases', 'OS1, OS2', 'OM1 a OM5'],
        ['Costo de los equipos', 'Mayor', 'Menor'],
        ['Uso típico', 'Entre edificios, entre ciudades, proveedores', 'Dentro de un edificio o centro de datos'],
      ]),
      nota('truco', `Para no confundirlos: **mono = uno = lejos = láser = amarillo**. Multimodo es todo lo contrario: muchos caminos, cerca, LED, naranja o aguamarina.`),
      ejemplo('facil', 'Reconocerla por el núcleo', fib(0)),
      ejemplo('facil', 'Reconocerla por el color', fib(3)),
      ejemplo('medio', 'Elegir según la distancia', fib(4)),
      ejemplo('medio', 'Elegir dentro de un edificio', fib(5)),
      tabla(['Estándar', 'Velocidad', 'Fibra', 'Alcance'], [
        ['1000BASE-SX', '1 Gbps', 'Multimodo', 'Hasta 550 m'],
        ['1000BASE-LX', '1 Gbps', 'Monomodo', 'Hasta 5 km'],
        ['10GBASE-SR', '10 Gbps', 'Multimodo OM3 / OM4', '300 m / 400 m'],
        ['10GBASE-LR', '10 Gbps', 'Monomodo', 'Hasta 10 km'],
        ['10GBASE-ER', '10 Gbps', 'Monomodo', 'Hasta 40 km'],
      ], 'En los nombres, S viene de «short» (corto alcance, multimodo) y L de «long» (largo alcance, monomodo).'),

      h('Los conectores de fibra'),
      tabla(['Conector', 'Cómo es', 'Dónde se usa'], [
        ['**LC**', 'Pequeño, con pestaña parecida a la del RJ-45', 'El más común hoy: es el de los módulos SFP'],
        ['**SC**', 'Cuadrado, se empuja para conectar y se tira para sacar', 'Paneles de fibra, fibra hasta el hogar'],
        ['**ST**', 'Redondo y metálico, de bayoneta (empujar y girar)', 'Instalaciones multimodo antiguas'],
        ['**MPO / MTP**', 'Rectangular y ancho, con 12 o 24 fibras juntas', 'Centros de datos, enlaces de 40 y 100 Gbps'],
      ], 'Trucos de memoria en inglés: LC, «Little Connector»; SC, «Square Connector»; ST, «Stick and Twist».'),
      ejemplo('facil', 'El conector de los SFP', con(6)),
      ejemplo('facil', 'El conector de muchas fibras', con(9)),

      h('Transceptores: SFP y SFP+'),
      p(`Un switch no trae la fibra «soldada». Tiene unas ranuras vacías donde se inserta un módulo pequeño llamado **transceptor** (transmisor + receptor), que convierte las señales eléctricas del switch en luz y viceversa. Así, el mismo switch sirve para multimodo o monomodo: solo cambias el módulo.`),
      tabla(['Módulo', 'Velocidad'], [
        ['**SFP**', '1 Gbps'],
        ['**SFP+**', '10 Gbps'],
        ['**SFP28**', '25 Gbps'],
        ['**QSFP+**', '40 Gbps'],
        ['**QSFP28**', '100 Gbps'],
      ], 'Un SFP y un SFP+ tienen la misma forma. También existen módulos SFP con puerto RJ-45, para cobre.'),
      nota('error', `Los dos extremos de un enlace deben coincidir en **tres cosas**: tipo de fibra (monomodo o multimodo), velocidad y longitud de onda del transceptor. Un módulo multimodo de un lado y uno monomodo del otro no levantan el enlace, o lo hacen con errores.`),

      h('Ventajas y cuidados'),
      tabla(['Ventajas', 'Inconvenientes'], [
        ['Distancias de kilómetros', 'Los equipos y transceptores cuestan más'],
        ['Velocidades muy altas (100 Gbps y más)', 'Es frágil: no admite dobleces cerrados'],
        ['Inmune a EMI y RFI: no lleva electricidad', 'Empalmarla exige herramienta y práctica'],
        ['Muy difícil de interceptar sin que se note', 'No transporta alimentación eléctrica (no hay PoE)'],
        ['No conduce rayos ni diferencias de tierra entre edificios', 'La suciedad en el conector degrada el enlace'],
      ]),
      nota('aviso', `**Seguridad.** Nunca mires de frente un conector o un puerto de fibra activo: la luz de los láseres es infrarroja, **no se ve**, y puede dañar la retina. Y mantén siempre puestas las tapas protectoras: una mota de polvo en la punta del conector tapa buena parte de un núcleo de 9 micras.`),

      h('¿Fibra o cobre?'),
      tabla(['Situación', 'Elige', 'Por qué'], [
        ['Computadora a la toma de pared, menos de 100 m', 'Cobre', 'Barato y el equipo ya trae el puerto'],
        ['Teléfonos IP, cámaras, puntos de acceso', 'Cobre', 'Reciben la corriente por el mismo cable (PoE)'],
        ['Entre pisos o edificios, más de 100 m', 'Fibra', 'El cobre no alcanza'],
        ['Zonas con motores o alta tensión', 'Fibra', 'Inmune a la interferencia'],
        ['Enlaces troncales de 40 o 100 Gbps', 'Fibra', 'El cobre no llega o solo en tramos muy cortos'],
      ]),
      ejemplo('medio', 'Un enlace entre edificios', op(
        'Una escuela quiere unir el switch del edificio administrativo con el del laboratorio, que está a 350 m cruzando un patio. Necesita 10 Gbps y quiere gastar lo menos posible en transceptores. ¿Qué instalas?',
        ['Cable UTP Cat 6a', 'Fibra multimodo OM4 con módulos 10GBASE-SR', 'Fibra monomodo con módulos 10GBASE-ER', 'Cable coaxial con conectores BNC'], 1,
        ['Se descarta el cobre: Cat 6a da 10 Gbps, pero solo en 100 m. A 350 m no funciona.',
          'Entre las dos fibras, ambas sirven técnicamente. La pregunta pide el menor costo en transceptores.',
          'La multimodo **OM4** con 10GBASE-SR alcanza 400 m a 10 Gbps: cubre los 350 m, y sus módulos son los más baratos. Con OM3 (300 m) no habría alcanzado.',
          'La monomodo con 10GBASE-ER (40 km) también funcionaría, pero es pagar de más por un alcance que no se necesita.'])),

      h('Resumen'),
      lista(
        'La fibra transporta luz por un núcleo de vidrio; el revestimiento la mantiene dentro.',
        'Multimodo: núcleo de 50 o 62.5 micras, LED, hasta unos 550 m, cubierta naranja o aguamarina.',
        'Monomodo: núcleo de 9 micras, láser, decenas de kilómetros, cubierta amarilla.',
        'Conectores: LC (pequeño), SC (cuadrado), ST (bayoneta), MPO (muchas fibras).',
        'SFP = 1 Gbps; SFP+ = 10 Gbps. Los dos extremos deben usar el mismo tipo de fibra y de módulo.',
        'La fibra gana en distancia, velocidad e inmunidad; el cobre, en precio y en PoE.',
      ),

      ejercicios('Practica', '', [
        fib(1), fib(2), fib(6), fib(7), fib(8), fib(9), fib(10), fib(11),
        con(6), con(7), con(8), con(9),
        cat(10000, 300), cat(40000, 25), medio(2), medio(3), medio(4), medio(5),
        op('¿Qué parte de la fibra óptica hace que la luz no se escape del núcleo?', ['La cubierta exterior de plástico', 'El revestimiento de vidrio que rodea al núcleo', 'Las fibras de refuerzo', 'El conector'], 1, 'El revestimiento tiene un índice de refracción distinto al del núcleo y refleja la luz hacia dentro, como un espejo.'),
        op('¿Por qué la fibra multimodo alcanza menos distancia que la monomodo?', ['Porque su vidrio es de peor calidad', 'Por la dispersión modal: los rayos recorren caminos de distinta longitud y el pulso se ensancha', 'Porque usa más corriente eléctrica', 'Porque sus conectores son más grandes'], 1, 'Al haber varios caminos, unos rayos llegan después que otros. El pulso se estira y, con suficiente distancia, se mezcla con el siguiente.'),
        op('Un técnico conecta un latiguillo de fibra doble y el enlace no sube. Los módulos y la fibra son correctos. ¿Qué revisa primero?', ['Que el cable sea cruzado T568A–T568B', 'Que las dos fibras no estén invertidas: TX debe llegar a RX', 'Que el switch tenga Auto-MDIX', 'Que el cable no pase de 100 m'], 1, 'Cada fibra lleva luz en un solo sentido. Si TX queda frente a TX, ningún receptor recibe luz. Basta intercambiar los dos conectores en un extremo.'),
        vs('¿Cuáles **dos** características corresponden a la fibra monomodo?', ['Núcleo de unas 9 micras', 'Cubierta naranja', 'Fuente de luz LED', 'Alcance de decenas de kilómetros', 'Clases OM3 y OM4'], [0, 3], 'Monomodo: núcleo fino y largo alcance. Naranja, LED y OM son rasgos de la multimodo.'),
        vs('¿Cuáles **dos** son ventajas de la fibra frente al par trenzado?', ['Es inmune a la interferencia electromagnética', 'Transporta alimentación PoE', 'Alcanza distancias mucho mayores', 'Sus equipos son más baratos', 'Se puede doblar en ángulos cerrados'], [0, 2], 'La fibra no lleva electricidad (no hay EMI, pero tampoco PoE) y llega a kilómetros. Es más cara y más frágil.'),
        rel('Relaciona cada módulo con su velocidad.', [['SFP', '1 Gbps'], ['SFP+', '10 Gbps'], ['QSFP+', '40 Gbps'], ['QSFP28', '100 Gbps']], 'SFP es el módulo de 1 Gbps; el signo + lo sube a 10. La Q de QSFP significa «cuádruple»: cuatro carriles.', ['25 Gbps']),
        op('¿Qué precaución de seguridad es propia del trabajo con fibra?', ['Usar pulsera antiestática al tocar el cable', 'No mirar de frente un conector o puerto activo', 'Descargar el cable a tierra antes de conectarlo', 'Mantenerla lejos de los cables eléctricos'], 1, 'El láser es infrarrojo: invisible y dañino para la retina. La fibra no lleva electricidad, así que ni se descarga ni le afecta la cercanía de cables eléctricos.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 3 */
  {
    slug: 'redes-inalambricas-wifi',
    titulo: 'Redes inalámbricas: Wi-Fi, bandas, estándares y canales',
    resumen: 'Cómo viajan los datos por ondas de radio, las bandas de 2.4, 5 y 6 GHz, los estándares 802.11 y sus nombres Wi-Fi 4 a Wi-Fi 7, los canales 1, 6 y 11, y qué interfiere con la señal.',
    nivel: 'medio',
    objetivos: [
      'Comparar las bandas de 2.4, 5 y 6 GHz en alcance, velocidad e interferencia.',
      'Relacionar cada estándar 802.11 con su nombre comercial y sus bandas.',
      'Explicar por qué en 2.4 GHz se usan los canales 1, 6 y 11.',
      'Definir punto de acceso, SSID y BSSID e identificar las fuentes de interferencia.',
    ],
    bloques: [
      h('Datos por el aire'),
      p(`El Wi-Fi envía los bits con **ondas de radio**, igual que una emisora de música, solo que a frecuencias mucho más altas y con mucha menos potencia. Tu teléfono y el router son, cada uno, un pequeño transmisor y receptor de radio.

La **frecuencia** dice cuántas veces vibra la onda por segundo y se mide en hercios (Hz). Un gigahercio (GHz) son mil millones de vibraciones por segundo. Hay una regla que explica casi todo lo que viene después:`),
      nota('clave', `**A mayor frecuencia: más velocidad, pero menos alcance.** Las ondas de frecuencia baja llegan lejos y atraviesan mejor los muros; las de frecuencia alta llevan más datos, pero se debilitan antes y los obstáculos las frenan más.`),
      p(`Piensa en la música del vecino: a través de la pared oyes los **graves** (frecuencia baja), no los agudos. Con el Wi-Fi ocurre igual.`),

      h('Las tres bandas: 2.4, 5 y 6 GHz'),
      p(`El Wi-Fi usa bandas **sin licencia**: cualquiera puede emitir en ellas sin pedir permiso ni pagar, siempre que respete la potencia máxima. Es la razón de que puedas comprar un router y encenderlo sin más. La contrapartida es que **todos** las usan, y se estorban.`),
      tabla(['Banda', 'Alcance', 'Velocidad', 'Interferencia', 'Comentario'], [
        ['**2.4 GHz**', 'El mayor; atraviesa mejor los muros', 'La menor', 'Mucha: está saturada', 'Solo 3 canales que no se pisan'],
        ['**5 GHz**', 'Medio', 'Alta', 'Poca', 'Muchos canales disponibles'],
        ['**6 GHz**', 'El menor', 'La mayor', 'Muy poca: es una banda nueva', 'Solo con Wi-Fi 6E y Wi-Fi 7'],
      ], 'Los canales permitidos en cada banda dependen de la regulación de cada país.'),
      nota('truco', `Regla práctica de soporte: equipo **lejos** del router o con muros de por medio → 2.4 GHz. Equipo **cerca** y que necesita velocidad (videollamadas, streaming) → 5 o 6 GHz.`),

      h('Los estándares 802.11'),
      p(`El Wi-Fi está definido por el IEEE en la familia de normas **802.11**. Cada generación añade una o dos letras. Como «802.11ax» no dice nada a un comprador, la Wi-Fi Alliance les puso nombres numerados: Wi-Fi 4, 5, 6…`),
      tabla(['Estándar', 'Nombre comercial', 'Bandas', 'Velocidad máxima teórica'], [
        ['802.11b', '—', '2.4 GHz', '11 Mbps'],
        ['802.11a', '—', '5 GHz', '54 Mbps'],
        ['802.11g', '—', '2.4 GHz', '54 Mbps'],
        ['802.11n', '**Wi-Fi 4**', '2.4 y 5 GHz', '600 Mbps'],
        ['802.11ac', '**Wi-Fi 5**', '5 GHz', '6.9 Gbps'],
        ['802.11ax', '**Wi-Fi 6**', '2.4 y 5 GHz', '9.6 Gbps'],
        ['802.11ax', '**Wi-Fi 6E**', '2.4, 5 y 6 GHz', '9.6 Gbps'],
        ['802.11be', '**Wi-Fi 7**', '2.4, 5 y 6 GHz', '46 Gbps'],
      ], 'Las velocidades son máximos teóricos sumando todas las antenas. En la práctica se obtiene una fracción.'),
      nota('truco', `Cómo memorizar las bandas: **b y g** solo 2.4 GHz; **a y ac** solo 5 GHz (las dos empiezan por «a»); **n y ax** las dos bandas. Los 6 GHz llegaron con la «E» de Wi-Fi 6E.`),
      p(`Los estándares son **compatibles hacia atrás**: un router Wi-Fi 6 atiende a un teléfono Wi-Fi 4. Pero la conexión se hace con el estándar más moderno que entiendan **los dos**, así que el equipo viejo irá a su velocidad vieja.`),
      ejemplo('facil', 'Un estándar de una sola banda', wifi('banda', 4)),
      ejemplo('facil', 'Del nombre técnico al comercial', wifi('nombre', 5)),
      ejemplo('medio', 'La banda nueva', wifi('banda', 6)),
      ejemplo('medio', 'Del nombre comercial al estándar', wifi('estandar', 7)),

      h('Los canales: por qué 1, 6 y 11'),
      p(`Cada banda se divide en **canales**, como los carriles de una avenida. Si dos puntos de acceso cercanos usan el mismo carril, tienen que turnarse y todo va más lento.

En **2.4 GHz** hay un problema de diseño: los canales están numerados cada **5 MHz**, pero cada uno ocupa unos **20 MHz** de ancho. Es como pintar carriles de 1 metro para autos de 4 metros de ancho: un auto en el carril 1 invade también los carriles 2, 3 y 4.`),
      p(`Para que dos canales no se toquen, sus números deben diferir **5 o más**. En América hay 11 canales, y solo caben tres que cumplan eso entre sí: **1, 6 y 11**.`),
      tabla(['Canal', 'Frecuencia central', '¿Se solapa con el 1?', '¿Con el 6?', '¿Con el 11?'], [
        ['1', '2412 MHz', '—', 'No', 'No'],
        ['3', '2422 MHz', 'Sí', 'Sí', 'No'],
        ['6', '2437 MHz', 'No', '—', 'No'],
        ['9', '2452 MHz', 'No', 'Sí', 'Sí'],
        ['11', '2462 MHz', 'No', 'No', '—'],
      ]),
      nota('error', `Un error frecuente: «el canal 1 y el 6 están saturados, pongo el **3**, que está libre». Es peor. En el canal 3 interfieres con el 1 **y** con el 6 a la vez, y además de la peor manera: dos equipos en el mismo canal se entienden y se turnan; dos en canales solapados solo se oyen como ruido.`),
      ejemplo('facil', 'Dos canales del plan clásico', canal(1, 6)),
      ejemplo('medio', 'Un canal «intermedio»', canal(6, 8)),
      ejemplo('medio', 'Justo en el límite', canal(4, 9)),
      h3('El ancho de canal'),
      p(`En 5 y 6 GHz hay mucho más espacio, y los canales se pueden **agrupar** para hacer uno más ancho: de 20 MHz a 40, 80 o 160 MHz (y hasta 320 MHz en Wi-Fi 7). Un canal el doble de ancho lleva aproximadamente el doble de datos, pero ocupa el sitio de dos: quedan menos canales libres para los vecinos y es más fácil sufrir interferencia. En 2.4 GHz se recomienda quedarse en **20 MHz**.`),

      h('Punto de acceso, SSID y BSSID'),
      tabla(['Término', 'Qué es', 'Ejemplo'], [
        ['**Punto de acceso (AP)**', 'El equipo que une a los clientes inalámbricos con la red cableada', 'El aparato del techo de una oficina'],
        ['**SSID**', 'El **nombre** de la red inalámbrica, el que eliges en la lista', '`Oficina-Ventas`'],
        ['**BSSID**', 'La **dirección MAC** de la radio de un punto de acceso concreto', '`a4:5e:60:c2:11:9f`'],
      ]),
      p(`Una red grande tiene **varios puntos de acceso** que anuncian el **mismo SSID**, cada uno con su BSSID y en un canal distinto. Así tu teléfono ve una sola red y, al caminar, salta de un punto de acceso a otro sin que lo notes. Eso se llama **itinerancia** (roaming).

El «router Wi-Fi» de una casa es en realidad tres aparatos en una caja: un router, un switch pequeño y un punto de acceso.`),

      h('Qué interfiere con el Wi-Fi'),
      tabla(['Tipo', 'Ejemplos', 'Qué hacer'], [
        ['Otras redes Wi-Fi', 'Los routers de los vecinos en el mismo canal o en uno solapado', 'Cambiar de canal o pasar a 5 GHz'],
        ['Aparatos que emiten en 2.4 GHz', 'Hornos de microondas, Bluetooth, teléfonos inalámbricos, monitores de bebé', 'Alejar el punto de acceso o usar 5 GHz'],
        ['Obstáculos', 'Muros de concreto, metal, espejos, agua (acuarios, tinacos, personas)', 'Reubicar el punto de acceso o añadir otro'],
        ['Distancia', 'La señal pierde fuerza al alejarse', 'Acercarse o añadir puntos de acceso'],
      ]),
      ejemplo('medio', 'Un caso real de soporte', op(
        'En una oficina, las portátiles de la cocineta pierden la conexión Wi-Fi todos los días hacia la hora de la comida y la recuperan después. Las computadoras cableadas no fallan. El punto de acceso emite solo en 2.4 GHz. ¿Cuál es la causa más probable?',
        ['El servidor DHCP se queda sin direcciones', 'El horno de microondas interfiere con la banda de 2.4 GHz', 'El cable del punto de acceso mide más de 100 m', 'Las portátiles usan un estándar incompatible'], 1,
        ['Las cableadas no fallan: el problema está en la parte inalámbrica, no en la red ni en Internet.',
          'El fallo tiene **horario** y **lugar**: la hora de la comida, en la cocineta. Algo se enciende ahí a esa hora.',
          'Un horno de microondas calienta emitiendo ondas de unos 2.45 GHz, justo en medio de la banda de 2.4 GHz del Wi-Fi. Mientras funciona, tapa la señal.',
          'Solución: mover los equipos a 5 GHz (el microondas no la afecta) o alejar el punto de acceso del horno. Si el cable midiera de más o el estándar fuera incompatible, fallaría todo el día.'])),

      h('Resumen'),
      lista(
        'Más frecuencia: más velocidad y menos alcance. 2.4 GHz llega lejos; 5 y 6 GHz corren más.',
        'El Wi-Fi usa bandas sin licencia: gratis, pero compartidas.',
        '802.11n = Wi-Fi 4, 802.11ac = Wi-Fi 5, 802.11ax = Wi-Fi 6 y 6E, 802.11be = Wi-Fi 7.',
        'En 2.4 GHz solo los canales 1, 6 y 11 no se solapan.',
        'SSID es el nombre de la red; BSSID, la MAC de un punto de acceso.',
        'Interfieren otras redes, los microondas, Bluetooth, y los muros, el metal y el agua.',
      ),

      ejercicios('Practica', '', [
        wifi('banda', 0), wifi('banda', 1), wifi('banda', 2), wifi('banda', 3), wifi('banda', 5), wifi('banda', 7),
        wifi('nombre', 3), wifi('nombre', 4), wifi('estandar', 5),
        canal(1, 11), canal(1, 3), canal(6, 11), canal(2, 7), canal(8, 11), canal(5, 6), canal(3, 9),
        op('¿Qué ventaja tiene la banda de 2.4 GHz sobre la de 5 GHz?', ['Más velocidad', 'Más canales sin solaparse', 'Más alcance y mejor paso a través de muros', 'Menos interferencia'], 2, 'La frecuencia más baja llega más lejos y atraviesa mejor los obstáculos. Todo lo demás favorece a 5 GHz.'),
        op('¿Qué es un SSID?', ['La dirección MAC del punto de acceso', 'El nombre de la red inalámbrica', 'La contraseña de la red', 'El canal en el que emite'], 1, 'El SSID es el nombre que aparece en la lista de redes. La MAC del punto de acceso es el BSSID.'),
        op('Una empresa tiene 6 puntos de acceso con el mismo SSID. ¿Qué distingue a cada uno?', ['Nada: son idénticos', 'Su BSSID, la dirección MAC de su radio', 'Su contraseña', 'Su estándar 802.11'], 1, 'Todos anuncian el mismo nombre de red, pero cada radio tiene su propia MAC: el BSSID. Así el cliente sabe a cuál está asociado.'),
        vs('¿Cuáles **dos** estándares trabajan **solo** en la banda de 5 GHz?', ['802.11b', '802.11a', '802.11g', '802.11ac', '802.11n'], [1, 3], '802.11a y 802.11ac son exclusivos de 5 GHz. 802.11b y g son de 2.4 GHz; 802.11n usa las dos.'),
        vs('¿Cuáles **dos** aparatos domésticos interfieren con el Wi-Fi de 2.4 GHz?', ['Horno de microondas', 'Televisor LED', 'Auriculares Bluetooth', 'Refrigerador', 'Lámpara de escritorio'], [0, 2], 'El microondas y Bluetooth emiten en torno a 2.4 GHz. Los demás no emiten radio en esa banda.'),
        rel('Relaciona cada banda con su rasgo principal.', [['2.4 GHz', 'Mayor alcance, pero saturada'], ['5 GHz', 'Buena velocidad y muchos canales'], ['6 GHz', 'La más nueva: exige Wi-Fi 6E o Wi-Fi 7']], 'A más frecuencia, menos alcance y más capacidad. Los 6 GHz se abrieron al Wi-Fi con 6E.'),
        op('Dos puntos de acceso vecinos en 2.4 GHz usan los canales 1 y 6. Hay que añadir un tercero entre ambos. ¿Qué canal le pones?', ['3', '4', '8', '11'], 3, 'Solo el 11 difiere en 5 o más de los otros dos. El 3, el 4 y el 8 se solaparían con alguno de sus vecinos.'),
        op('Un teléfono Wi-Fi 4 se conecta a un router Wi-Fi 6. ¿Qué ocurre?', ['No se puede conectar', 'Se conecta usando 802.11n, el estándar que los dos entienden', 'Se conecta a velocidad de Wi-Fi 6', 'El router baja a todos los clientes a Wi-Fi 4'], 1, 'Hay compatibilidad hacia atrás: se negocia el estándar común más moderno. El teléfono viejo no gana velocidad por conectarse a un router nuevo.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 4 */
  {
    slug: 'redes-celulares-y-comparacion',
    titulo: 'Redes celulares y cómo elegir entre cable, Wi-Fi y celular',
    resumen: 'Qué diferencia a la red del operador (3G, 4G, 5G) del Wi-Fi, qué son la SIM y el hotspot, las tecnologías de corto alcance y cómo decidir qué medio conviene en cada caso.',
    nivel: 'medio',
    objetivos: [
      'Diferenciar espectro con licencia y sin licencia.',
      'Describir las generaciones celulares, la SIM, la eSIM y el hotspot.',
      'Situar Bluetooth, NFC y otras tecnologías de corto alcance.',
      'Elegir entre red cableada, Wi-Fi y celular según el escenario.',
    ],
    bloques: [
      h('Con licencia y sin licencia'),
      p(`El aire es de todos, y si cada quien emitiera en la frecuencia que quisiera, nada funcionaría. Por eso el gobierno de cada país reparte el **espectro radioeléctrico** en dos tipos de bandas:`),
      tabla(['', 'Sin licencia', 'Con licencia'], [
        ['Quién puede emitir', 'Cualquiera, respetando la potencia máxima', 'Solo la empresa que pagó por esa banda'],
        ['Costo', 'Gratis', 'El operador paga al Estado; tú pagas un plan al operador'],
        ['Interferencia', 'Probable: la banda se comparte con los vecinos', 'Mínima: la banda es de uso exclusivo'],
        ['Tecnologías', 'Wi-Fi, Bluetooth, Zigbee', 'Redes celulares (3G, 4G, 5G), radio, televisión'],
      ]),
      nota('clave', `**Wi-Fi = sin licencia. Celular = con licencia.** Es la diferencia que más se pregunta. De ella salen las demás: el Wi-Fi lo montas tú y cubre un edificio; la red celular la monta un operador y cubre un país.`),

      h('Cómo funciona una red celular'),
      p(`El operador divide el territorio en zonas llamadas **celdas** (de ahí «celular»), cada una atendida por una antena o **estación base**. Tu teléfono habla con la antena más cercana y, cuando te mueves, la red te pasa de una celda a la siguiente sin cortar la llamada. Las antenas se unen entre sí y con Internet por fibra óptica.`),
      tabla(['Generación', 'Tecnología', 'Velocidad aproximada', 'Qué trajo'], [
        ['**3G**', 'UMTS, HSPA', 'Unos pocos Mbps', 'Internet móvil utilizable'],
        ['**4G**', 'LTE', 'Decenas a cientos de Mbps', 'Video, y la voz también viaja como datos (VoLTE)'],
        ['**5G**', 'NR', 'Cientos de Mbps hasta más de 1 Gbps', 'Mucha más capacidad, menor latencia y millones de dispositivos IoT'],
      ], 'Las cifras varían mucho según el operador, la banda y la cobertura. Varios operadores ya apagaron sus redes 3G para reutilizar ese espectro.'),
      p(`El 5G usa tres tipos de banda, y se repite la regla de la lección anterior: las **bajas** (menos de 1 GHz) cubren kilómetros y entran bien en los edificios, pero son las más lentas; las **medias** equilibran alcance y velocidad; las **altas** u **ondas milimétricas** (24 GHz o más) dan velocidades enormes en apenas unos cientos de metros y las frena hasta una pared.`),

      h('SIM, eSIM y hotspot'),
      tabla(['Término', 'Qué es'], [
        ['**SIM**', 'La tarjeta que identifica tu línea ante el operador. Sin ella (o sin eSIM) el teléfono no entra en la red celular, salvo para llamadas de emergencia.'],
        ['**eSIM**', 'Una SIM integrada en el equipo: se activa descargando un perfil, a menudo con un código QR. No hay tarjeta que insertar.'],
        ['**IMEI**', 'El número de serie del **aparato** (no de la línea). Sirve para bloquear un teléfono robado.'],
        ['**Hotspot** o zona Wi-Fi', 'El teléfono comparte su conexión celular creando una pequeña red Wi-Fi para otros equipos.'],
        ['**Tethering** o anclaje', 'Compartir los datos del teléfono con otro equipo, por Wi-Fi, USB o Bluetooth.'],
        ['**Datos móviles**', 'El acceso a Internet por la red celular. Se cobra según el plan contratado.'],
      ]),
      nota('aviso', `Un hotspot gasta la batería y el plan de datos del teléfono. Es útil como respaldo o de viaje, pero no sustituye a una conexión fija para trabajar todo el día.`),

      h('Tecnologías de corto alcance'),
      tabla(['Tecnología', 'Alcance típico', 'Para qué se usa'], [
        ['**Bluetooth**', 'Unos 10 m', 'Audífonos, teclados, relojes: une dispositivos personales (una PAN). Usa 2.4 GHz.'],
        ['**NFC**', 'Unos 4 cm', 'Pagos acercando el teléfono, tarjetas de acceso, emparejar equipos con un toque.'],
        ['**Zigbee / Z-Wave**', 'Decenas de metros, en malla', 'Sensores y domótica de muy bajo consumo.'],
        ['**RFID**', 'De centímetros a metros', 'Etiquetas de inventario, peajes, control de acceso.'],
      ], 'En el NFC, el alcance tan corto es parte de la seguridad: obliga a acercar el dispositivo a propósito.'),

      h('Cableado, Wi-Fi o celular: comparación'),
      tabla(['', 'Cableado (cobre o fibra)', 'Wi-Fi', 'Celular'], [
        ['Velocidad', 'La más alta y constante', 'Alta, pero variable', 'Variable según cobertura'],
        ['Estabilidad', 'Excelente', 'Depende de la interferencia y la distancia', 'Depende de la señal y la saturación de la celda'],
        ['Movilidad', 'Ninguna', 'Dentro del edificio', 'Total, incluso en movimiento'],
        ['Alcance', '100 m (cobre) o kilómetros (fibra)', 'Decenas de metros', 'Kilómetros'],
        ['Costo', 'Instalación cara; uso gratuito', 'Instalación barata; uso gratuito', 'Sin instalación; se paga por el consumo'],
        ['Seguridad', 'La mejor: hay que llegar físicamente al cable', 'La señal sale del edificio: exige cifrado', 'Cifrada por el operador'],
        ['Espectro', '—', 'Sin licencia', 'Con licencia'],
        ['Quién la administra', 'Tú', 'Tú', 'El operador'],
      ]),
      h3('Cómo decidir'),
      orden(
        '**¿El equipo se mueve?** Si no se mueve y hay forma de llevarle un cable, cablea: es lo más rápido, estable y seguro.',
        '**¿Se mueve dentro del edificio?** Wi-Fi.',
        '**¿Sale del edificio, o no hay infraestructura propia?** Celular.',
        '**¿Necesita alimentación por el mismo cable?** Cobre con PoE.',
        '**¿Más de 100 m, mucha velocidad o interferencia fuerte?** Fibra.',
      ),
      ejemplo('facil', 'Equipos fijos en una oficina', medio(0)),
      ejemplo('facil', 'Personas que se mueven', medio(6)),
      ejemplo('medio', 'Trabajo en carretera', medio(9)),
      ejemplo('medio', 'Una conexión de respaldo', medio(10)),
      ejemplo('medio', 'Datos y corriente por el mismo cable', medio(1)),
      ejemplo('dificil', 'Un caso con varias respuestas tentadoras', op(
        'Una clínica instala 12 computadoras de escritorio en consultorios fijos. Maneja expedientes médicos, así que quiere la máxima seguridad y una velocidad constante. Todos los consultorios están a menos de 60 m del cuarto de telecomunicaciones y hay canaletas disponibles. ¿Qué recomiendas?',
        ['Wi-Fi 6 con WPA3 para evitar el cableado', 'Par trenzado Cat 6 hasta cada consultorio', 'Un módem 5G en cada computadora', 'Fibra monomodo hasta cada escritorio'], 1,
        ['Los equipos son **fijos** y hay canaletas: no hay ninguna razón de movilidad para usar radio.',
          'Se pide seguridad máxima y velocidad constante. Una red cableada no emite la señal fuera del edificio y no sufre interferencia ni comparte el aire con nadie.',
          'La distancia es menor de 100 m: el **par trenzado** cumple de sobra, y cualquier computadora trae puerto RJ-45.',
          'Wi-Fi con WPA3 es seguro, pero menos estable. La fibra hasta el escritorio funcionaría, pero es mucho más cara y las computadoras necesitarían adaptadores. El 5G añade un costo mensual por equipo y depende del operador.'])),

      h('Resumen'),
      lista(
        'Wi-Fi usa espectro sin licencia; las redes celulares, espectro con licencia que el operador paga.',
        '3G, 4G (LTE) y 5G: cada generación da más velocidad y capacidad.',
        'La SIM o la eSIM identifica la línea; el IMEI, el aparato.',
        'Un hotspot comparte la conexión celular por Wi-Fi.',
        'Bluetooth une dispositivos personales a unos metros; NFC funciona a centímetros.',
        'Fijo: cable. Móvil dentro del edificio: Wi-Fi. Fuera o sin infraestructura: celular.',
      ),

      ejercicios('Practica', '', [
        medio(2), medio(3), medio(4), medio(5), medio(7), medio(8), medio(11), medio(12), medio(13),
        op('¿Qué significa que el Wi-Fi use «espectro sin licencia»?', ['Que no está regulado y se puede emitir con cualquier potencia', 'Que cualquiera puede usar esas bandas sin pagar ni pedir permiso, respetando los límites técnicos', 'Que su uso es ilegal en empresas', 'Que solo los operadores pueden emitir en ellas'], 1, 'Sin licencia no quiere decir sin reglas: hay límites de potencia. Lo que no hace falta es un permiso ni un pago por usar la banda.'),
        op('¿Por qué una red celular sufre menos interferencia de terceros que una red Wi-Fi?', ['Porque usa más potencia', 'Porque opera en bandas con licencia, de uso exclusivo del operador', 'Porque usa cables entre el teléfono y la antena', 'Porque solo funciona de noche'], 1, 'El operador paga por el uso exclusivo de sus bandas: nadie más puede emitir en ellas. En el Wi-Fi, todos los vecinos comparten las mismas frecuencias.'),
        op('Un empleado necesita Internet en su portátil durante un viaje en tren y solo lleva su teléfono con plan de datos. ¿Qué hace?', ['Conecta la portátil al teléfono por NFC', 'Activa el hotspot del teléfono y conecta la portátil a esa red Wi-Fi', 'Cambia la SIM a la portátil', 'Busca un canal libre de 2.4 GHz'], 1, 'El hotspot convierte al teléfono en un pequeño punto de acceso que comparte su conexión celular. NFC solo sirve a centímetros y no da acceso a Internet.'),
        op('¿Qué identifica el IMEI?', ['La línea telefónica', 'El aparato', 'El punto de acceso', 'La red Wi-Fi'], 1, 'El IMEI es el número de serie del equipo. La línea la identifica la SIM. Por eso un teléfono robado se bloquea por IMEI, aunque le cambien la SIM.'),
        op('¿Qué tecnología se usa para pagar acercando el teléfono a la terminal?', ['Bluetooth', 'NFC', 'LTE', 'Zigbee'], 1, 'NFC funciona a unos 4 cm: hay que acercar el teléfono a propósito, y eso forma parte de su seguridad.'),
        vs('¿Cuáles **dos** tecnologías usan espectro **con licencia**?', ['Wi-Fi 6', '4G LTE', 'Bluetooth', '5G', 'Zigbee'], [1, 3], 'Las redes celulares (LTE y 5G) operan en bandas que el operador adquiere. Wi-Fi, Bluetooth y Zigbee usan bandas sin licencia.'),
        vs('¿Cuáles **dos** son ventajas de una red cableada frente al Wi-Fi?', ['Permite moverse por el edificio', 'Velocidad más estable', 'Instalación más barata', 'Más difícil de interceptar desde fuera del edificio', 'No requiere switches'], [1, 3], 'El cable da velocidad constante y no radia la señal a la calle. A cambio, no ofrece movilidad y su instalación cuesta más.'),
        rel('Relaciona cada tecnología con su alcance típico.', [['NFC', 'Unos centímetros'], ['Bluetooth', 'Unos 10 metros'], ['Wi-Fi', 'Decenas de metros'], ['Red celular', 'Kilómetros']], 'De menor a mayor: NFC, Bluetooth, Wi-Fi y celular. Cada una cubre un tipo de red: de contacto, personal, local y de área amplia.'),
        ord('Ordena las generaciones celulares de la más antigua a la más reciente.', ['3G (UMTS)', '4G (LTE)', '5G (NR)'], 'Cada generación sustituyó a la anterior con más velocidad y capacidad: 3G, luego 4G LTE y después 5G.'),
        op('En 5G, ¿qué bandas ofrecen la mayor velocidad pero el menor alcance?', ['Las bajas, por debajo de 1 GHz', 'Las medias', 'Las altas u ondas milimétricas', 'Todas ofrecen lo mismo'], 2, 'Se cumple la regla general de la radio: a mayor frecuencia, más capacidad y menos alcance. Las ondas milimétricas apenas cubren unos cientos de metros.'),
      ]),
    ],
  },
];
