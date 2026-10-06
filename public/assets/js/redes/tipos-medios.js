/**
 * Academia de Redes · Tipos de ejercicio de «Medios y dispositivos finales»
 * ---------------------------------------------------------------------
 * Mismo contrato que tipos.js: crear(rng, nivel) → parámetros y
 * resolver(params) → { enunciado, tabla?, codigo?, campos, pistas, pasos }.
 * Cubre el dominio 3 del CCST Networking: cables y conectores, fibra,
 * Wi-Fi, direcciones MAC y la configuración de red de cada sistema operativo.
 */
import { definir, campo, ent, elegir, niveles } from './tipos.js';
import { ip, aTexto, analizar, mascara, tamano } from './ip.js';
import { mac as leerMac, macTexto } from './ipv6.js';

const SI_NO = ['Sí', 'No'];

/* ----------------------------------------------------------- md-cable */
// MDI: transmite por los pines 1-2. MDI-X: transmite por los pines 3-6.
const EQUIPOS = [
  { n: 'una computadora de escritorio', c: 'La computadora', g: 'MDI' },
  { n: 'una portátil', c: 'La portátil', g: 'MDI' },
  { n: 'un servidor', c: 'El servidor', g: 'MDI' },
  { n: 'una impresora de red', c: 'La impresora', g: 'MDI' },
  { n: 'un router', c: 'El router', g: 'MDI' },
  { n: 'un switch', c: 'El switch', g: 'MDI-X' },
  { n: 'un hub', c: 'El hub', g: 'MDI-X' },
];
const CABLES = ['Cable directo (straight-through)', 'Cable cruzado (crossover)', 'Cable de consola (rollover)'];
definir('md-cable', '¿Qué cable se usa?', {
  crear(rng) {
    if (rng() < 0.18) return { a: ent(rng, 0, 1), b: ent(rng, 4, 5), consola: true };
    const a = ent(rng, 0, EQUIPOS.length - 1);
    let b = ent(rng, 0, EQUIPOS.length - 1);
    if (a === b && EQUIPOS[a].g === 'MDI' && a < 4) b = 5;   // dos impresoras o dos servidores iguales no aportan nada
    return { a, b };
  },
  resolver(q) {
    const a = EQUIPOS[q.a];
    const b = EQUIPOS[q.b];
    if (q.consola) {
      return {
        enunciado: `Un técnico necesita configurar ${b.n} recién sacado de la caja, que todavía no tiene dirección IP. Conecta el puerto serie o USB de ${a.n} al **puerto de consola** del equipo. ¿Qué cable usa?`,
        campos: [campo('r', 'Cable', 'opcion', 2, { opciones: CABLES, lista: true })],
        pistas: [
          'El puerto de consola no es un puerto de red: no transporta tramas Ethernet.',
          'Sirve para administrar el equipo por una conexión serie, aunque la red no funcione.',
          'El cable de consola clásico de Cisco es plano, de color celeste, con un RJ-45 en un extremo.',
        ],
        pasos: [
          { t: 'El puerto de consola tiene forma de RJ-45, pero **no es Ethernet**: es una conexión serie pensada para administrar el equipo de forma local.' },
          { t: 'Por eso no sirven ni el cable directo ni el cruzado. Se usa el **cable de consola (rollover)**, que invierte por completo el orden de los hilos: el pin 1 de un extremo llega al pin 8 del otro, el 2 al 7 y así sucesivamente.' },
          { t: 'En la computadora se abre un programa emulador de terminal (PuTTY, Tera Term) sobre ese puerto serie. Los equipos modernos traen además un puerto de consola USB que hace lo mismo con un cable USB normal.' },
        ],
      };
    }
    const iguales = a.g === b.g;
    return {
      enunciado: `Vas a conectar ${a.n} con ${b.n} por sus puertos Ethernet. Los equipos son antiguos y **no tienen Auto-MDIX**. ¿Qué cable de par trenzado necesitas?`,
      campos: [campo('r', 'Cable', 'opcion', iguales ? 1 : 0, { opciones: CABLES, lista: true })],
      pistas: [
        'Clasifica cada equipo: ¿transmite por los pines 1 y 2 (MDI) o por los pines 3 y 6 (MDI-X)?',
        'MDI: computadoras, servidores, impresoras y routers. MDI-X: switches y hubs.',
        'Equipos de grupos distintos → cable directo. Equipos del mismo grupo → cable cruzado.',
      ],
      pasos: [
        { t: 'Cada puerto Ethernet transmite por un par de hilos y escucha por otro. Hay dos tipos de puerto:',
          tabla: { cab: ['Tipo de puerto', 'Transmite por', 'Recibe por', 'Equipos'], filas: [
            ['MDI', 'pines 1 y 2', 'pines 3 y 6', 'Computadoras, servidores, impresoras, routers'],
            ['MDI-X', 'pines 3 y 6', 'pines 1 y 2', 'Switches y hubs'],
          ] } },
        { t: `${a.c} tiene un puerto **${a.g}** y ${b.c.toLowerCase()} tiene un puerto **${b.g}**.` },
        { t: iguales
          ? `Los dos son ${a.g}: transmiten por los mismos pines. Con un cable directo, los dos «hablarían» por el mismo par y ninguno escucharía. Hace falta un **cable cruzado**, que lleva el par de transmisión de un extremo al par de recepción del otro (un extremo T568A y el otro T568B).`
          : 'Son de tipos distintos: lo que uno transmite llega justo a los pines por los que el otro escucha. Basta un **cable directo**, con la misma norma (normalmente T568B) en los dos extremos.' },
        { t: 'En la práctica, casi todos los equipos actuales tienen **Auto-MDIX**: detectan el tipo de cable y se adaptan solos, así que un cable directo funciona en cualquier caso. Aun así, el examen pregunta la regla clásica.' },
      ],
    };
  },
});

/* ------------------------------------------------------- md-categoria */
const MEDIOS_CAT = ['Cat 5e', 'Cat 6', 'Cat 6a', 'Cat 8', 'Fibra óptica'];
const VEL = { 100: '100 Mbps', 1000: '1 Gbps', 10000: '10 Gbps', 40000: '40 Gbps' };
function categoriaMinima(vel, dist) {
  if (dist > 100) return 4;
  if (vel <= 1000) return 0;
  if (vel === 10000) return dist <= 55 ? 1 : 2;
  return dist <= 30 ? 3 : 4;
}
definir('md-categoria', 'Categoría de cable mínima', {
  crear(rng) {
    const vel = elegir(rng, [100, 1000, 1000, 10000, 10000, 10000, 40000]);
    const dist = elegir(rng, [ent(rng, 3, 30), ent(rng, 31, 55), ent(rng, 56, 100), ent(rng, 12, 28) * 10]);
    return { vel, dist };
  },
  resolver({ vel, dist }) {
    const r = categoriaMinima(vel, dist);
    const motivo = dist > 100
      ? `El enlace mide ${dist} m y el par trenzado solo garantiza **100 m** por tramo, sea cual sea la categoría. Ningún cable de cobre de la tabla sirve: hace falta **fibra óptica** (o poner un switch intermedio que regenere la señal).`
      : vel <= 1000
        ? `Para ${VEL[vel]} a ${dist} m basta **Cat 5e**, que soporta hasta 1 Gbps en los 100 m completos. Las categorías superiores también funcionarían, pero cuestan más y la pregunta pide la mínima.`
        : vel === 10000
          ? (dist <= 55
            ? `Para 10 Gbps hay dos opciones de cobre. **Cat 6** alcanza 10 Gbps, pero solo hasta 55 m. Como el enlace mide ${dist} m, entra en ese límite y Cat 6 es la mínima que cumple.`
            : `Para 10 Gbps, Cat 6 solo llega a 55 m. El enlace mide ${dist} m, así que Cat 6 se queda corta. **Cat 6a** soporta 10 Gbps en los 100 m completos: es la mínima que cumple.`)
          : (dist <= 30
            ? `Para 40 Gbps sobre cobre solo existe **Cat 8**, y únicamente en tramos cortos de hasta 30 m (típicos de un centro de datos, entre un servidor y el switch de su rack). El enlace mide ${dist} m: cumple.`
            : `Para 40 Gbps sobre cobre solo existe Cat 8, y su alcance máximo es de 30 m. El enlace mide ${dist} m: ningún par trenzado cumple. Hace falta **fibra óptica**.`);
    return {
      enunciado: `Hay que tender un enlace de **${dist} m** que funcione a **${VEL[vel]}**. ¿Cuál es el medio **mínimo** (el más económico) que cumple el requisito?`,
      campos: [campo('r', 'Medio mínimo', 'opcion', r, { opciones: MEDIOS_CAT, lista: true })],
      pistas: [
        'Primero mira la distancia: el par trenzado tiene un límite de 100 m por tramo.',
        'Después la velocidad: Cat 5e llega a 1 Gbps; Cat 6 y Cat 6a, a 10 Gbps; Cat 8, a 25 o 40 Gbps.',
        'Cat 6 solo sostiene 10 Gbps hasta 55 m, y Cat 8 solo alcanza 30 m.',
      ],
      pasos: [
        { t: 'La tabla de referencia del par trenzado:', tabla: { cab: ['Categoría', 'Velocidad máxima', 'Distancia'], filas: [
          ['Cat 5e', '1 Gbps', '100 m'], ['Cat 6', '1 Gbps / 10 Gbps', '100 m / 55 m'], ['Cat 6a', '10 Gbps', '100 m'], ['Cat 8', '25 o 40 Gbps', '30 m'],
        ] } },
        { t: motivo },
      ],
    };
  },
});

/* -------------------------------------------------------- md-conector */
const CONECTORES = ['RJ-45', 'RJ-11', 'Conector F', 'BNC', 'LC', 'SC', 'ST', 'MPO/MTP'];
const PISTAS_CONECTOR = [
  { r: 0, cobre: true, d: 'Conector de plástico transparente con **8 contactos** que remata un cable de par trenzado de red (UTP).', p: 'El **RJ-45** (técnicamente 8P8C) tiene 8 posiciones y 8 contactos, uno por cada hilo de los 4 pares de un cable Ethernet.' },
  { r: 0, cobre: true, d: 'El conector que encuentras en el puerto Ethernet de una portátil y en los puertos de un switch de oficina.', p: 'Los puertos Ethernet de cobre usan **RJ-45**. Es más ancho que el conector telefónico y no entra en un puerto de teléfono.' },
  { r: 1, cobre: true, d: 'Conector pequeño de **4 o 6 posiciones** que usa el cable del teléfono fijo y de los módems DSL.', p: 'El **RJ-11** es el conector telefónico. Es más estrecho que el RJ-45 y lleva normalmente 2 o 4 hilos.' },
  { r: 1, cobre: true, d: 'Un usuario intenta enchufar el cable del teléfono fijo en el puerto de red de su computadora: entra flojo y no da enlace.', p: 'Ese cable termina en **RJ-11**. Cabe físicamente en un puerto RJ-45, pero queda suelto, no toca los contactos correctos y puede dañar el puerto.' },
  { r: 2, cobre: true, d: 'Conector **roscado** del cable coaxial que llega al cablemódem o al televisor.', p: 'El **conector F** se enrosca sobre el puerto y usa como contacto central el propio alambre del coaxial. Es el del servicio de Internet por cable.' },
  { r: 3, cobre: true, d: 'Conector de coaxial que se fija con un **giro de un cuarto de vuelta** (bayoneta); se usaba en las redes Ethernet antiguas y sigue en cámaras analógicas.', p: 'El **BNC** se acopla empujando y girando un cuarto de vuelta. Era el conector de 10BASE2 y hoy se ve en video y equipos de medición.' },
  { r: 4, cobre: false, d: 'Conector de fibra **pequeño**, de férula de 1.25 mm, con una pestaña como la del RJ-45. Es el que usan casi todos los módulos SFP.', p: 'El **LC** (Lucent Connector) mide la mitad que un SC, por eso caben dos en un transceptor SFP. Es el más común en equipos actuales.' },
  { r: 5, cobre: false, d: 'Conector de fibra **cuadrado**, de férula de 2.5 mm, que se conecta empujando y se desconecta tirando (push-pull).', p: 'El **SC** (Subscriber Connector) es cuadrado y de encaje a presión. Es habitual en paneles de fibra y en la fibra que llega al hogar.' },
  { r: 6, cobre: false, d: 'Conector de fibra **redondo y metálico** que se fija con bayoneta, girándolo. Se ve en instalaciones multimodo antiguas.', p: 'El **ST** (Straight Tip) se parece a un BNC: se empuja y se gira. Fue el estándar de las redes de campus de los años noventa.' },
  { r: 7, cobre: false, d: 'Conector de fibra **rectangular y ancho** que agrupa 12 o 24 fibras en una sola pieza, para enlaces de 40 y 100 Gbps.', p: 'El **MPO** (MTP es una marca comercial de MPO de alta calidad) junta muchas fibras en un solo conector. Se usa en centros de datos.' },
];
definir('md-conector', 'Identificar el conector', {
  crear(rng, nivel) {
    const validos = PISTAS_CONECTOR.map((x, i) => i).filter((i) => (nivel <= 1 ? PISTAS_CONECTOR[i].cobre : nivel === 2 ? !PISTAS_CONECTOR[i].cobre : true));
    return { caso: elegir(rng, validos) };
  },
  resolver({ caso }) {
    const c = PISTAS_CONECTOR[caso];
    return {
      enunciado: `${c.d}\n\n¿De qué conector se trata?`,
      campos: [campo('r', 'Conector', 'opcion', c.r, { opciones: CONECTORES })],
      pistas: [
        c.cobre ? 'Es un conector de cable de cobre: par trenzado, telefónico o coaxial.' : 'Es un conector de fibra óptica.',
        c.cobre ? 'Par trenzado de red: RJ-45. Teléfono: RJ-11. Coaxial: F (roscado) o BNC (bayoneta).' : 'LC es el pequeño; SC, el cuadrado; ST, el redondo de bayoneta; MPO, el de muchas fibras.',
        `Su nombre empieza por «${CONECTORES[c.r].slice(0, 1)}».`,
      ],
      pasos: [
        { t: c.p },
        { t: 'Los conectores de un vistazo:', tabla: { cab: ['Conector', 'Medio', 'Cómo reconocerlo'], filas: [
          ['RJ-45', 'Par trenzado', '8 contactos, pestaña de plástico'], ['RJ-11', 'Cable telefónico', 'Más estrecho, 4 o 6 posiciones'],
          ['F', 'Coaxial', 'Se enrosca'], ['BNC', 'Coaxial', 'Bayoneta: empujar y girar'],
          ['LC', 'Fibra', 'Pequeño, con pestaña; el de los SFP'], ['SC', 'Fibra', 'Cuadrado, a presión'],
          ['ST', 'Fibra', 'Redondo, bayoneta'], ['MPO/MTP', 'Fibra', 'Ancho, 12 o 24 fibras juntas'],
        ] } },
      ],
    };
  },
});

/* ----------------------------------------------------------- md-fibra */
const FIBRAS = ['Monomodo (SMF)', 'Multimodo (MMF)'];
const RASGOS_FIBRA = [
  { r: 0, d: 'Su núcleo mide unos **9 micras**, tan delgado que la luz viaja por un solo camino.', p: 'Un núcleo de 8 a 10 micras solo deja pasar un modo (un camino) de luz. Eso es la fibra **monomodo**.' },
  { r: 1, d: 'Su núcleo mide **50 o 62.5 micras**, y la luz rebota por varios caminos a la vez.', p: 'Un núcleo ancho deja entrar la luz con muchos ángulos: varios modos. Eso es la fibra **multimodo**.' },
  { r: 0, d: 'El latiguillo (cable de parcheo) tiene la cubierta de color **amarillo**.', p: 'Por convención, la cubierta amarilla indica fibra **monomodo** (OS1/OS2).' },
  { r: 1, d: 'El latiguillo tiene la cubierta de color **naranja** o **aguamarina**.', p: 'Naranja (OM1/OM2) y aguamarina (OM3/OM4) indican fibra **multimodo**. El verde lima es OM5, también multimodo.' },
  { r: 0, d: 'Hay que unir dos edificios de un proveedor separados por **18 km**.', p: 'Las distancias de kilómetros solo las cubre la **monomodo**: al haber un solo camino de luz, la señal casi no se deforma y llega a decenas de kilómetros.' },
  { r: 1, d: 'Hay que unir dos switches dentro del mismo edificio, a **120 m**, a 10 Gbps y con el menor costo en transceptores.', p: 'Para distancias cortas dentro de un edificio se usa **multimodo**: sus transceptores son más baratos y a 10 Gbps alcanza unos 300 m (OM3) o 400 m (OM4).' },
  { r: 0, d: 'Sus transceptores usan un **láser** de precisión como fuente de luz, y son los más caros.', p: 'Meter la luz en un núcleo de 9 micras exige un láser muy fino. Por eso la electrónica de **monomodo** cuesta más, aunque el cable sea barato.' },
  { r: 1, d: 'Sus transceptores usan **LED** o láseres VCSEL económicos como fuente de luz.', p: 'El núcleo ancho de la **multimodo** acepta fuentes de luz menos precisas (LED o VCSEL), que son más baratas.' },
  { r: 1, d: 'Sufre **dispersión modal**: los pulsos de luz se ensanchan con la distancia porque cada rayo recorre un camino de distinta longitud.', p: 'Solo hay dispersión modal si hay varios modos. Es la limitación típica de la **multimodo** y la razón de que alcance cientos de metros y no kilómetros.' },
  { r: 0, d: 'Se identifica con las siglas **OS1** u **OS2**.', p: 'OS (Optical Single-mode) son las clases de fibra **monomodo**. Las de multimodo son OM1 a OM5.' },
  { r: 1, d: 'Se identifica con las siglas **OM3** u **OM4**.', p: 'OM (Optical Multi-mode) son las clases de fibra **multimodo**.' },
  { r: 0, d: 'Es la fibra que usan los operadores para llevar Internet **hasta el hogar** (FTTH) desde la central.', p: 'La fibra hasta el hogar recorre kilómetros desde la central: es **monomodo**.' },
];
definir('md-fibra', '¿Monomodo o multimodo?', {
  crear: (rng) => ({ caso: ent(rng, 0, RASGOS_FIBRA.length - 1) }),
  resolver({ caso }) {
    const c = RASGOS_FIBRA[caso];
    return {
      enunciado: `${c.d}\n\n¿A qué tipo de fibra óptica corresponde?`,
      campos: [campo('r', 'Tipo de fibra', 'opcion', c.r, { opciones: FIBRAS })],
      pistas: [
        '«Modo» significa camino de luz. Monomodo: un solo camino. Multimodo: varios.',
        'Núcleo fino, láser y amarillo van juntos; núcleo ancho, LED y naranja o aguamarina, también.',
        'Monomodo cubre kilómetros; multimodo, cientos de metros dentro de un edificio o campus.',
      ],
      pasos: [
        { t: c.p },
        { t: 'Comparación completa:', tabla: { cab: ['', 'Monomodo (SMF)', 'Multimodo (MMF)'], filas: [
          ['Núcleo', '8 – 10 micras', '50 o 62.5 micras'], ['Caminos de luz', 'Uno', 'Varios'], ['Fuente de luz', 'Láser', 'LED o VCSEL'],
          ['Alcance típico', 'Decenas de kilómetros', 'Hasta unos 550 m'], ['Color de la cubierta', 'Amarillo', 'Naranja, aguamarina o verde lima'],
          ['Clases', 'OS1, OS2', 'OM1 a OM5'], ['Costo de los transceptores', 'Mayor', 'Menor'], ['Uso típico', 'Entre edificios, ciudades, proveedores', 'Dentro de un edificio o centro de datos'],
        ] } },
      ],
    };
  },
});

/* ----------------------------------------------------------- md-canal */
definir('md-canal', 'Canales de 2.4 GHz', {
  crear(rng) {
    const a = ent(rng, 1, 11);
    let b = ent(rng, 1, 11);
    if (b === a) b = a <= 6 ? a + elegir(rng, [2, 5]) : a - elegir(rng, [3, 5]);
    return { a, b };
  },
  resolver({ a, b }) {
    const dif = Math.abs(a - b);
    const mhz = dif * 5;
    const solapan = dif < 5;
    const fa = 2407 + 5 * a;
    const fb = 2407 + 5 * b;
    return {
      enunciado: `Dos puntos de acceso vecinos trabajan en la banda de **2.4 GHz** con canales de 20 MHz de ancho. Uno usa el **canal ${a}** y el otro el **canal ${b}**. ¿Cuántos MHz separan sus frecuencias centrales? ¿Se solapan (se interfieren) los dos canales?`,
      campos: [campo('mhz', 'Separación (MHz)', 'numero', mhz), campo('r', '¿Se solapan?', 'opcion', solapan ? 0 : 1, { opciones: SI_NO })],
      pistas: [
        'En 2.4 GHz, cada número de canal está 5 MHz más arriba que el anterior.',
        'Cada canal ocupa unos 20 MHz (22 MHz en 802.11b): bastante más que esos 5 MHz.',
        'Dos canales no se solapan solo si sus números difieren en 5 o más (por ejemplo 1, 6 y 11).',
      ],
      pasos: [
        { t: `La frecuencia central de un canal de 2.4 GHz es 2407 + 5 × canal. Canal ${a}: 2407 + 5 × ${a} = **${fa} MHz**. Canal ${b}: 2407 + 5 × ${b} = **${fb} MHz**.` },
        { t: `Separación: |${a} − ${b}| = ${dif} canales × 5 MHz = **${mhz} MHz**.` },
        { t: solapan
          ? `Cada canal ocupa unos 20 MHz (10 a cada lado de su centro). Con solo ${mhz} MHz entre centros, las dos señales se pisan: **sí se solapan**. Es interferencia de canal adyacente, la peor, porque los equipos ni siquiera se entienden para turnarse.`
          : `Cada canal ocupa unos 20 MHz. Con ${mhz} MHz entre centros hay espacio para los dos sin pisarse: **no se solapan**. Por eso el plan clásico de 2.4 GHz usa los canales **1, 6 y 11**, separados 25 MHz entre sí.` },
      ],
    };
  },
});

/* ------------------------------------------------------------ md-wifi */
const WIFI = [
  { e: '802.11b', nombre: '', bandas: 0, vel: '11 Mbps' },
  { e: '802.11a', nombre: '', bandas: 1, vel: '54 Mbps' },
  { e: '802.11g', nombre: '', bandas: 0, vel: '54 Mbps' },
  { e: '802.11n', nombre: 'Wi-Fi 4', bandas: 2, vel: '600 Mbps' },
  { e: '802.11ac', nombre: 'Wi-Fi 5', bandas: 1, vel: '6.9 Gbps' },
  { e: '802.11ax', nombre: 'Wi-Fi 6', bandas: 2, vel: '9.6 Gbps' },
  { e: '802.11ax ampliado a 6 GHz', nombre: 'Wi-Fi 6E', bandas: 3, vel: '9.6 Gbps' },
  { e: '802.11be', nombre: 'Wi-Fi 7', bandas: 3, vel: '46 Gbps' },
];
const BANDAS = ['Solo 2.4 GHz', 'Solo 5 GHz', '2.4 y 5 GHz', '2.4, 5 y 6 GHz'];
const NOMBRES_WIFI = ['Wi-Fi 4', 'Wi-Fi 5', 'Wi-Fi 6', 'Wi-Fi 6E', 'Wi-Fi 7'];
const ESTANDARES = ['802.11n', '802.11ac', '802.11ax', '802.11be'];
const TABLA_WIFI = { cab: ['Estándar', 'Nombre comercial', 'Bandas', 'Velocidad máxima teórica'], filas: [
  ['802.11b', '(Wi-Fi 1)', '2.4 GHz', '11 Mbps'], ['802.11a', '(Wi-Fi 2)', '5 GHz', '54 Mbps'], ['802.11g', '(Wi-Fi 3)', '2.4 GHz', '54 Mbps'],
  ['802.11n', 'Wi-Fi 4', '2.4 y 5 GHz', '600 Mbps'], ['802.11ac', 'Wi-Fi 5', '5 GHz', '6.9 Gbps'],
  ['802.11ax', 'Wi-Fi 6 / Wi-Fi 6E', '2.4 y 5 GHz / + 6 GHz', '9.6 Gbps'], ['802.11be', 'Wi-Fi 7', '2.4, 5 y 6 GHz', '46 Gbps'],
] };
definir('md-wifi', 'Estándares Wi-Fi', {
  crear(rng) {
    const pregunta = elegir(rng, ['banda', 'banda', 'nombre', 'estandar']);
    if (pregunta === 'banda') return { pregunta, i: ent(rng, 0, WIFI.length - 1) };
    return { pregunta, i: elegir(rng, pregunta === 'nombre' ? [3, 4, 5, 7] : [3, 4, 5, 7]) };
  },
  resolver({ pregunta, i }) {
    const w = WIFI[i];
    const quien = w.nombre ? `**${w.nombre}** (${w.e})` : `**${w.e}**`;
    const comun = {
      pistas: [
        'Orden cronológico: b, a, g, n, ac, ax, be. Los nombres «Wi-Fi 4, 5, 6, 7» empiezan en 802.11n.',
        'Solo 2.4 GHz: b y g. Solo 5 GHz: a y ac. Las dos bandas: n y ax.',
        'La banda de 6 GHz llegó con Wi-Fi 6E y sigue en Wi-Fi 7.',
      ],
    };
    if (pregunta === 'banda') {
      return {
        enunciado: `¿En qué bandas de frecuencia puede trabajar ${quien}?`,
        campos: [campo('r', 'Bandas', 'opcion', w.bandas, { opciones: BANDAS, lista: true })],
        ...comun,
        pasos: [
          { t: 'La tabla de estándares 802.11:', tabla: TABLA_WIFI },
          { t: `${w.nombre || w.e} trabaja en: **${BANDAS[w.bandas].replace('Solo ', 'solo ')}**. Su velocidad máxima teórica es de ${w.vel}.` },
          { t: 'Recuerda el patrón: los estándares «de una sola banda» son b y g (2.4 GHz) y a y ac (5 GHz). 802.11n y 802.11ax usan las dos, y la banda de 6 GHz se añadió con Wi-Fi 6E.' },
        ],
      };
    }
    if (pregunta === 'nombre') {
      return {
        enunciado: `La caja de un router anuncia compatibilidad con el estándar **${w.e}**. ¿Con qué nombre comercial lo vende la Wi-Fi Alliance?`,
        campos: [campo('r', 'Nombre comercial', 'opcion', NOMBRES_WIFI.indexOf(w.nombre), { opciones: NOMBRES_WIFI })],
        ...comun,
        pasos: [
          { t: 'La Wi-Fi Alliance numeró las generaciones para que fueran fáciles de comparar:', tabla: TABLA_WIFI },
          { t: `${w.e} es **${w.nombre}**.${i === 5 ? ' Cuando el equipo además usa la banda de 6 GHz se anuncia como Wi-Fi 6E; el estándar sigue siendo 802.11ax.' : ''}` },
        ],
      };
    }
    return {
      enunciado: `Un usuario pregunta qué estándar del IEEE hay detrás de la etiqueta **${w.nombre}** de su portátil nueva. ¿Cuál es?`,
      campos: [campo('r', 'Estándar', 'opcion', ESTANDARES.indexOf(w.e), { opciones: ESTANDARES })],
      ...comun,
      pasos: [
        { t: 'Cada nombre comercial corresponde a un estándar 802.11:', tabla: TABLA_WIFI },
        { t: `${w.nombre} es **${w.e}**.` },
      ],
    };
  },
});

/* ----------------------------------------------------------- md-medio */
const MEDIOS = ['Cobre (par trenzado)', 'Fibra óptica', 'Wi-Fi', 'Red celular'];
const ESCENARIOS = [
  { r: 0, d: 'Una oficina necesita conectar 20 computadoras de escritorio, cada una a menos de 40 m del cuarto de telecomunicaciones, al menor costo y con velocidad estable de 1 Gbps.', p: 'Equipos fijos, distancias menores de 100 m y 1 Gbps: es el caso de libro del **par trenzado**. Es barato, estable y cualquier computadora trae el puerto.' },
  { r: 0, d: 'Hay que instalar cámaras IP y teléfonos IP que reciban los datos y la **alimentación eléctrica** por el mismo cable.', p: 'Solo el **cobre** transporta electricidad: PoE (Power over Ethernet) alimenta cámaras, teléfonos y puntos de acceso por el mismo par trenzado. La fibra no conduce corriente.' },
  { r: 1, d: 'Hay que unir los switches principales de dos edificios de un campus separados por **900 m**.', p: 'El par trenzado se queda en 100 m. Para cientos de metros o kilómetros se usa **fibra óptica**. Además, entre edificios evita problemas de tierras eléctricas y rayos.' },
  { r: 1, d: 'El cable debe pasar junto a motores industriales y líneas de alta tensión que generan fuerte **interferencia electromagnética**.', p: 'La **fibra** transporta luz, no electricidad: es inmune a la interferencia electromagnética (EMI) y de radiofrecuencia (RFI).' },
  { r: 1, d: 'Un centro de datos necesita un enlace troncal de **100 Gbps** entre dos salas, a 150 m.', p: 'A 100 Gbps y 150 m no llega ningún par trenzado (Cat 8 alcanza 40 Gbps y solo 30 m). Es terreno de la **fibra óptica**.' },
  { r: 1, d: 'Una empresa teme que alguien «pinche» el cable para espiar el tráfico; quiere el medio más difícil de interceptar sin ser detectado.', p: 'La **fibra** no emite señales eléctricas que se puedan captar por inducción, y abrirla para derivar luz provoca pérdidas que se detectan. Es el medio más difícil de interceptar.' },
  { r: 2, d: 'Los empleados de una sala de juntas se mueven con sus portátiles y tabletas y necesitan seguir conectados a la red de la oficina.', p: 'Movilidad dentro de un edificio y acceso a la red local: **Wi-Fi**. No hace falta tender un cable hasta cada asiento.' },
  { r: 2, d: 'Una cafetería quiere dar Internet a los clientes que llegan con sus propios teléfonos y portátiles, usando su conexión de banda ancha.', p: 'Dispositivos variados, sin puerto de red y dentro de un local: **Wi-Fi**, que usa bandas sin licencia y comparte la conexión de Internet del negocio.' },
  { r: 2, d: 'En un edificio histórico está prohibido perforar muros y tender canaletas, pero hay que dar red a varias oficinas contiguas.', p: 'Si no se puede cablear, la alternativa dentro del edificio es **Wi-Fi**: basta colocar puntos de acceso donde sí llega cable.' },
  { r: 3, d: 'Un vendedor viaja por carretera entre ciudades y necesita enviar pedidos desde su portátil estando en cualquier lugar.', p: 'Cobertura de kilómetros y en movimiento: solo la **red celular** (4G/5G) la ofrece, a través del operador y con un plan de datos.' },
  { r: 3, d: 'Una sucursal quiere una conexión de **respaldo** a Internet que no dependa de ningún cable que llegue al edificio.', p: 'Un respaldo independiente del cableado es un módem **celular** 4G/5G: si una obra corta la fibra o el cobre, la red del operador sigue en el aire.' },
  { r: 3, d: 'Hay que conectar sensores de riego repartidos en un campo agrícola de varios kilómetros, sin infraestructura de red propia.', p: 'Sin cableado ni puntos de acceso, y a kilómetros: la opción de la lista es la **red celular**, que ya tiene las antenas desplegadas por el operador.' },
  { r: 0, d: 'Un servidor y su switch están en el mismo rack, a 2 m, y deben conectarse a 10 Gbps gastando lo mínimo.', p: 'A 2 m y 10 Gbps basta un latiguillo de **par trenzado** Cat 6 o Cat 6a: es más barato que dos transceptores de fibra.' },
  { r: 2, d: 'Un almacén usa lectores de códigos de barras de mano que los operarios llevan por todos los pasillos del edificio.', p: 'Equipos de mano que se mueven dentro de un edificio y hablan con el servidor local: **Wi-Fi**, con varios puntos de acceso que cubran los pasillos.' },
];
definir('md-medio', 'Elegir el medio', {
  crear: (rng) => ({ caso: ent(rng, 0, ESCENARIOS.length - 1) }),
  resolver({ caso }) {
    const c = ESCENARIOS[caso];
    return {
      enunciado: `${c.d}\n\n¿Qué medio de transmisión es el más adecuado?`,
      campos: [campo('r', 'Medio', 'opcion', c.r, { opciones: MEDIOS, lista: true })],
      pistas: [
        'Hazte tres preguntas: ¿el equipo se mueve?, ¿qué distancia hay?, ¿qué velocidad o condición especial se pide?',
        'Equipos fijos a menos de 100 m: cobre. Más distancia, más velocidad o interferencia: fibra.',
        'Movilidad dentro de un edificio: Wi-Fi. Movilidad o cobertura de kilómetros: red celular.',
      ],
      pasos: [
        { t: c.p },
        { t: 'Cada medio tiene su terreno:', tabla: { cab: ['Medio', 'Alcance', 'Punto fuerte', 'Punto débil'], filas: [
          ['Cobre (par trenzado)', '100 m por tramo', 'Barato, lleva electricidad (PoE)', 'Sensible a la interferencia'],
          ['Fibra óptica', 'Cientos de metros a decenas de km', 'Velocidad, distancia, inmune a EMI', 'Más cara y delicada'],
          ['Wi-Fi', 'Decenas de metros', 'Movilidad sin cables, sin licencia', 'Interferencia, medio compartido'],
          ['Red celular', 'Kilómetros', 'Cobertura amplia y en movimiento', 'Depende del operador y del plan de datos'],
        ] } },
      ],
    };
  },
});

/* ------------------------------------------------------------- md-mac */
const ESTILO = { ':': 'con dos puntos, como lo muestran Linux, macOS y Android', '-': 'con guiones y mayúsculas, como lo muestra Windows', '.': 'en tres grupos de cuatro dígitos separados por puntos, como lo muestra Cisco IOS' };
const estiloDe = (t) => (t.includes('.') ? '.' : t.includes('-') ? '-' : ':');
definir('md-mac', 'Dirección MAC', {
  crear(rng) {
    const b = Array.from({ length: 6 }, () => ent(rng, 0, 255));
    b[0] &= 0xFC;   // unicast y administrada globalmente, como las de fábrica
    const de = elegir(rng, [':', '-', '.']);
    const a = elegir(rng, [':', '-', '.'].filter((x) => x !== de));
    return { mac: macTexto(b, de), a };
  },
  resolver({ mac, a }) {
    const b = leerMac(mac);
    const de = estiloDe(mac);
    const hex = b.map((x) => x.toString(16).padStart(2, '0'));
    const oui = hex.slice(0, 3);
    const destino = macTexto(b, a);
    return {
      enunciado: `La tarjeta de red de un equipo tiene la dirección MAC \`${mac}\` (${ESTILO[de].split(',')[0]}). Escríbela ${ESTILO[a]}. Después indica su **OUI**, la parte que identifica al fabricante.`,
      campos: [
        campo('conv', 'La misma MAC en el otro formato', 'texto', destino),
        campo('oui', 'OUI (los 3 primeros bytes)', 'texto', oui.join(':'), { acepta: [oui.join('-'), oui.join(''), oui.join(' '), `${oui[0]}${oui[1]}.${oui[2]}`] }),
      ],
      pistas: [
        'Una MAC son siempre 12 dígitos hexadecimales (48 bits). Los separadores son solo una forma de escribirla.',
        'Quita los separadores, deja los 12 dígitos seguidos y vuelve a agruparlos como pide el formato nuevo.',
        'El OUI son los 6 primeros dígitos hexadecimales (24 bits); los otros 6 son el número que el fabricante dio a esa tarjeta.',
      ],
      pasos: [
        { t: `Sin separadores, la MAC son 12 dígitos hexadecimales: \`${hex.join('')}\`. Cada dígito son 4 bits: 12 × 4 = 48 bits, es decir, 6 bytes.` },
        { t: `Agrupados como se pide: \`${destino}\`. El valor no cambia; solo la forma de escribirlo.`,
          tabla: { cab: ['Formato', 'Así se escribe', 'Dónde lo verás'], filas: [
            ['Dos puntos', macTexto(b, ':'), 'Linux, macOS, Android, iOS'], ['Guiones', macTexto(b, '-'), 'Windows (`ipconfig /all`)'], ['Puntos, de 4 en 4', macTexto(b, '.'), 'Cisco IOS (`show mac address-table`)'],
          ] } },
        { t: `Los 3 primeros bytes, \`${oui.join(':')}\`, son el **OUI** (identificador único de organización): el IEEE se lo asigna al fabricante. Los 3 últimos, \`${hex.slice(3).join(':')}\`, los numera el fabricante para que no haya dos tarjetas iguales.` },
      ],
    };
  },
});

/* ------------------------------------------------------ md-comando-so */
const SISTEMAS = { windows: 'Windows (Símbolo del sistema)', linux: 'Linux (terminal)', macos: 'macOS (Terminal)' };
// [tarea, comando, alternativas aceptadas, explicación]
const COMANDOS_SO = {
  windows: [
    ['ver un resumen de la configuración IP de cada adaptador: dirección IPv4, máscara y puerta de enlace', 'ipconfig', [], '`ipconfig` sin parámetros muestra lo esencial de cada adaptador: dirección IP, máscara de subred y puerta de enlace predeterminada.'],
    ['ver la configuración **completa**, incluidas la dirección MAC (dirección física), los servidores DNS y si DHCP está habilitado', 'ipconfig /all', [], '`ipconfig /all` añade lo que el resumen calla: dirección física (MAC), si DHCP está habilitado, servidor DHCP, servidores DNS y la vigencia de la concesión.'],
    ['**soltar** la dirección IP que el equipo obtuvo por DHCP', 'ipconfig /release', [], '`ipconfig /release` avisa al servidor DHCP de que el equipo deja su dirección. El adaptador se queda sin IP hasta que se renueve.'],
    ['pedir de nuevo una dirección IP al servidor DHCP', 'ipconfig /renew', [], '`ipconfig /renew` vuelve a pedir configuración al servidor DHCP. Junto con `/release` es la primera prueba cuando un equipo tiene una dirección incorrecta.'],
    ['**vaciar la caché de DNS** del equipo, porque un sitio cambió de dirección y sigue resolviendo a la antigua', 'ipconfig /flushdns', [], '`ipconfig /flushdns` borra los nombres ya resueltos que Windows guarda en memoria, de modo que la siguiente consulta vuelve a preguntar al servidor DNS.'],
    ['ver la tabla de rutas del equipo', 'route print', ['netstat -r'], '`route print` muestra la tabla de rutas de Windows. La fila con destino 0.0.0.0 es la ruta por defecto: apunta a la puerta de enlace.'],
  ],
  linux: [
    ['ver las direcciones IP de todas las interfaces', 'ip addr', ['ip a', 'ip address', 'ip addr show', 'ip address show', 'ip a s', 'ip a show'], '`ip addr` (abreviado `ip a`) lista cada interfaz con su estado, su MAC (`link/ether`) y sus direcciones (`inet` para IPv4, `inet6` para IPv6) en notación CIDR.'],
    ['ver la tabla de rutas, donde aparece la puerta de enlace predeterminada', 'ip route', ['ip r', 'ip route show', 'ip r s', 'ip route list', 'ip r show'], '`ip route` (abreviado `ip r`) muestra las rutas. La línea que empieza por `default via` indica la puerta de enlace.'],
    ['ver el estado de las interfaces (si están arriba o abajo) y su dirección MAC, sin las direcciones IP', 'ip link', ['ip l', 'ip link show', 'ip l show', 'ip l s'], '`ip link` muestra solo la capa de enlace: nombre de la interfaz, estado (`UP`/`DOWN`), MTU y dirección MAC.'],
    ['ver la configuración de las interfaces con la herramienta **antigua**, la que hoy sustituye el comando `ip`', 'ifconfig', ['ifconfig -a'], '`ifconfig` pertenece al paquete net-tools, ya en desuso; muchas distribuciones no lo instalan. Sigue apareciendo en exámenes y en equipos viejos.'],
  ],
  macos: [
    ['ver la configuración de todas las interfaces de red, con sus direcciones IP y MAC', 'ifconfig', ['ifconfig -a'], 'macOS conserva `ifconfig`: muestra cada interfaz (`en0`, `en1`…) con su MAC (`ether`) y sus direcciones (`inet`).'],
    ['obtener **solo** la dirección IPv4 de la interfaz `en0`', 'ipconfig getifaddr en0', [], 'En macOS, `ipconfig getifaddr en0` devuelve únicamente la dirección IPv4 de esa interfaz. Ojo: el `ipconfig` de macOS no es el de Windows y siempre necesita un subcomando.'],
    ['ver la tabla de rutas en formato numérico, con la puerta de enlace en la fila `default`', 'netstat -rn', ['netstat -nr'], '`netstat -rn` muestra la tabla de rutas sin traducir direcciones a nombres. La fila `default` indica la puerta de enlace.'],
    ['listar los puertos de hardware (Wi-Fi, Ethernet…) con el nombre de dispositivo y la MAC de cada uno', 'networksetup -listallhardwareports', [], '`networksetup -listallhardwareports` relaciona cada puerto («Wi-Fi», «Ethernet») con su dispositivo (`en0`, `en1`) y su dirección MAC.'],
  ],
};
definir('md-comando-so', 'Comando de red por sistema', {
  crear(rng) {
    const so = elegir(rng, ['windows', 'windows', 'linux', 'linux', 'macos']);
    return { so, caso: ent(rng, 0, COMANDOS_SO[so].length - 1) };
  },
  resolver({ so, caso }) {
    const [tarea, comando, acepta, explica] = COMANDOS_SO[so][caso];
    const palabras = comando.split(' ');
    return {
      enunciado: `Estás en **${SISTEMAS[so]}** y necesitas ${tarea}. ¿Qué comando escribes?`,
      campos: [campo('cmd', 'Comando', 'texto', comando, acepta.length ? { acepta } : {})],
      pistas: [
        so === 'windows' ? 'En Windows casi todo lo relacionado con la configuración IP empieza por `ipconfig`.' : so === 'linux' ? 'En Linux moderno la herramienta es `ip`, seguida del objeto que quieres ver.' : 'macOS hereda las herramientas clásicas de Unix, además de algunas propias.',
        `El comando empieza por \`${palabras[0]}\` y tiene ${palabras.length} ${palabras.length === 1 ? 'palabra' : 'palabras'}.`,
        palabras.length === 1 ? `Tiene ${comando.length} letras y termina en «${comando.slice(-3)}».` : `Empieza así: \`${palabras.slice(0, -1).join(' ')}\`…`,
      ],
      pasos: [
        { t: `Comando: \`${comando}\`` },
        { t: explica },
        { t: 'La misma tarea en cada sistema:', tabla: { cab: ['Tarea', 'Windows', 'Linux', 'macOS'], filas: [
          ['Ver la configuración IP', '`ipconfig`', '`ip addr`', '`ifconfig`'],
          ['Ver la MAC', '`ipconfig /all`', '`ip link`', '`ifconfig`'],
          ['Ver la puerta de enlace', '`ipconfig`', '`ip route`', '`netstat -rn`'],
          ['Renovar DHCP', '`ipconfig /release` y `/renew`', '`nmcli` o reconectar', 'Ajustes del Sistema'],
        ] } },
      ],
    };
  },
});

/* --------------------------------------------------------- md-ipconfig */
const ORIGENES = ['La obtuvo de un servidor DHCP', 'Es estática: la escribió alguien a mano', 'Es automática (APIPA): pidió DHCP y nadie respondió'];
const DNS = ['8.8.8.8', '1.1.1.1', '9.9.9.9', '208.67.222.222'];
const punteado = (etiqueta, valor) => `   ${(etiqueta + ' ').padEnd(42, '. ').slice(0, 42).trimEnd()} : ${valor}`.trimEnd();
definir('md-ipconfig', 'Leer la configuración de red', {
  crear(rng, nivel) {
    const so = elegir(rng, ['windows', 'windows', 'linux']);
    const origen = so === 'windows' ? elegir(rng, ['dhcp', 'dhcp', 'estatica', 'apipa']) : elegir(rng, ['dhcp', 'estatica']);
    const b = Array.from({ length: 6 }, () => ent(rng, 0, 255));
    b[0] &= 0xFC;
    const m = macTexto(b, so === 'windows' ? '-' : ':');
    if (origen === 'apipa') return { so, origen, ip: `169.254.${ent(rng, 1, 254)}.${ent(rng, 1, 254)}`, p: 16, gw: 'primera', mac: m, dns: 0 };
    const p = nivel >= 6 ? elegir(rng, [22, 23, 25, 26, 27]) : elegir(rng, [24, 24, 24, 25, 26]);
    const base = (ip(elegir(rng, ['192.168.0.0', '10.10.0.0', '172.16.0.0'])) + ent(rng, 0, 2 ** (p - 16) - 1) * tamano(p)) >>> 0;
    const gw = elegir(rng, ['primera', 'ultima']);
    const host = base + ent(rng, 2, tamano(p) - 3);   // nunca la primera ni la última asignable
    return { so, origen, ip: aTexto(host), p, gw, mac: m, dns: ent(rng, 0, DNS.length - 1) };
  },
  resolver(q) {
    const a = analizar(ip(q.ip), q.p);
    const gw = aTexto(q.gw === 'ultima' ? a.ultimo : a.primero);
    const masc = aTexto(mascara(q.p));
    const apipa = q.origen === 'apipa';
    const dhcp = q.origen === 'dhcp';
    const dns = DNS[q.dns];
    let codigo;
    let dondeIp, dondeMasc, dondeGw, dondeMac, dondeOrigen;
    if (q.so === 'windows') {
      codigo = ['C:\\> ipconfig /all', '', 'Adaptador de Ethernet Ethernet:', '',
        punteado('Sufijo DNS específico para la conexión', ''),
        punteado('Descripción', 'Intel(R) Ethernet Connection I219-V'),
        punteado('Dirección física', q.mac),
        punteado('DHCP habilitado', q.origen === 'estatica' ? 'no' : 'sí'),
        punteado('Configuración automática habilitada', 'sí'),
        punteado(apipa ? 'Dirección IPv4 de configuración automática' : 'Dirección IPv4', `${q.ip}(Preferido)`),
        punteado('Máscara de subred', masc),
        ...(dhcp ? [punteado('Concesión obtenida', 'lunes, 5 de octubre de 2026 8:14:02'), punteado('La concesión expira', 'martes, 6 de octubre de 2026 8:14:02')] : []),
        punteado('Puerta de enlace predeterminada', apipa ? '' : gw),
        ...(dhcp ? [punteado('Servidor DHCP', gw)] : []),
        ...(apipa ? [] : [punteado('Servidores DNS', dns)]),
      ].join('\n');
      dondeIp = apipa ? 'la línea «Dirección IPv4 de configuración automática»' : 'la línea «Dirección IPv4»';
      dondeMasc = `La línea «Máscara de subred» dice \`${masc}\`.`;
      dondeGw = 'la línea «Puerta de enlace predeterminada»';
      dondeMac = 'Windows llama «Dirección física» a la MAC y la escribe con guiones';
      dondeOrigen = apipa
        ? 'La dirección empieza por **169.254** y Windows la etiqueta «de configuración automática». DHCP está habilitado, pero no hay servidor DHCP en la salida ni puerta de enlace: el equipo pidió una dirección, nadie contestó y se asignó una él mismo (**APIPA**). Con ella solo alcanza a otros equipos en la misma situación; no sale a Internet.'
        : dhcp ? 'La línea «DHCP habilitado» dice **sí**, y aparecen el servidor DHCP y las fechas de la concesión: la configuración la entregó un **servidor DHCP**.'
          : 'La línea «DHCP habilitado» dice **no**, y no hay servidor DHCP ni fechas de concesión: la dirección es **estática**, alguien la escribió a mano.';
    } else {
      const bc = aTexto(a.broadcast);
      codigo = ['$ ip addr show enp3s0',
        '2: enp3s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000',
        `    link/ether ${q.mac} brd ff:ff:ff:ff:ff:ff`,
        `    inet ${q.ip}/${q.p} brd ${bc} scope global ${dhcp ? 'dynamic ' : ''}noprefixroute enp3s0`,
        `       valid_lft ${dhcp ? '85963sec' : 'forever'} preferred_lft ${dhcp ? '85963sec' : 'forever'}`,
        '', '$ ip route',
        `default via ${gw} dev enp3s0 proto ${dhcp ? 'dhcp' : 'static'} metric 100`,
        `${aTexto(a.red)}/${q.p} dev enp3s0 proto kernel scope link src ${q.ip} metric 100`,
      ].join('\n');
      dondeIp = 'la línea `inet`';
      dondeMasc = `Linux no escribe la máscara: la da como prefijo pegado a la dirección, \`/${q.p}\` (equivale a \`${masc}\`).`;
      dondeGw = 'la línea `default via` de `ip route`';
      dondeMac = 'la línea `link/ether` contiene la MAC, escrita con dos puntos';
      dondeOrigen = dhcp
        ? 'La línea `inet` lleva la palabra **dynamic** y un tiempo de validez que va descontando (`valid_lft 85963sec`); además la ruta por defecto dice `proto dhcp`. La configuración vino de un **servidor DHCP**.'
        : 'La línea `inet` no lleva la palabra `dynamic` y su validez es `forever`; la ruta por defecto dice `proto static`. La dirección es **estática**.';
    }
    const campos = [
      campo('ip', 'Dirección IPv4 del equipo', 'ip', q.ip),
      campo('p', 'Prefijo de la red', 'prefijo', q.p),
      ...(apipa ? [] : [campo('gw', 'Puerta de enlace', 'ip', gw)]),
      campo('mac', 'Dirección MAC', 'mac', q.mac),
      campo('origen', '¿De dónde salió la dirección IP?', 'opcion', apipa ? 2 : dhcp ? 0 : 1, { opciones: ORIGENES, lista: true }),
    ];
    return {
      enunciado: `Un usuario te envía esta salida de su equipo con ${q.so === 'windows' ? 'Windows' : 'Linux'}. Léela y completa los datos.`,
      codigo,
      campos,
      pistas: [
        q.so === 'windows' ? 'Busca las líneas «Dirección IPv4», «Máscara de subred», «Puerta de enlace predeterminada» y «Dirección física».' : 'La IP y el prefijo están en la línea `inet`; la MAC, en `link/ether`; la puerta de enlace, en la línea `default via`.',
        q.so === 'windows' ? 'Convierte la máscara a prefijo contando sus bits en 1 (255 = 8 bits).' : 'El número tras la barra en la línea `inet` ya es el prefijo.',
        q.so === 'windows' ? 'Para el origen, mira «DHCP habilitado» y si la dirección empieza por 169.254.' : 'Para el origen, busca la palabra `dynamic` en la línea `inet`.',
      ],
      pasos: [
        { t: `**Dirección IP.** Está en ${dondeIp}: \`${q.ip}\`.${q.so === 'windows' ? ' La palabra «(Preferido)» no forma parte de la dirección: solo indica que es la dirección en uso.' : ''}` },
        { t: `**Prefijo.** ${dondeMasc}${q.so === 'windows' ? ` Sus bits en 1 suman **/${q.p}**.` : ''} La red es \`${aTexto(a.red)}/${q.p}\`.` },
        ...(apipa ? [{ t: '**Puerta de enlace.** La línea está vacía: el equipo no tiene por dónde salir de su red.' }]
          : [{ t: `**Puerta de enlace.** Está en ${dondeGw}: \`${gw}\`. Pertenece a la misma red que el equipo (es su ${q.gw === 'ultima' ? 'última' : 'primera'} dirección asignable), como debe ser.` }]),
        { t: `**MAC.** ${dondeMac.charAt(0).toUpperCase() + dondeMac.slice(1)}: \`${q.mac}\`.` },
        { t: `**Origen.** ${dondeOrigen}` },
      ],
    };
  },
});

/* ------------------------------------------------------------ niveles */
niveles('medios', [
  { n: 1, nombre: 'Cobre', resumen: 'Par trenzado, categorías, conectores y cable directo, cruzado o de consola.',
    tipos: [['md-cable', 3], ['md-categoria', 2], ['md-conector', 2], ['banco', 5]] },
  { n: 2, nombre: 'Fibra', resumen: 'Monomodo y multimodo, conectores de fibra y cuándo el cobre ya no alcanza.',
    tipos: [['md-fibra', 3], ['md-conector', 2], ['md-categoria', 2], ['banco', 5]] },
  { n: 3, nombre: 'Wi-Fi', resumen: 'Bandas, estándares 802.11, canales que se solapan e interferencia.',
    tipos: [['md-canal', 3], ['md-wifi', 3], ['banco', 6]] },
  { n: 4, nombre: 'Elegir el medio', resumen: 'Red celular, comparación de medios, dispositivos finales y direcciones MAC.',
    tipos: [['md-medio', 3], ['md-mac', 2], ['md-wifi', 1], ['banco', 6]] },
  { n: 5, nombre: 'Computadoras', resumen: 'Comandos de red de Windows, Linux y macOS y lectura de sus salidas.',
    tipos: [['md-comando-so', 3], ['md-ipconfig', 3], ['md-mac', 1], ['banco', 5]] },
  { n: 6, nombre: 'Soporte completo', resumen: 'Móviles, cliente inalámbrico y casos que mezclan todo el dominio.',
    tipos: [['md-ipconfig', 2], ['md-comando-so', 1], ['md-canal', 1], ['md-medio', 1], ['md-cable', 1], ['banco', 7]] },
]);
