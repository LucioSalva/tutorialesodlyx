/**
 * Academia de Redes · Tipos de ejercicio de «Fundamentos de redes»
 * ---------------------------------------------------------------------
 * Mismo contrato que tipos.js: crear(rng, nivel) → parámetros y
 * resolver(params) → { enunciado, tabla?, campos, pistas, pasos }.
 * Los datos de cada tipo (capas, puertos, escenarios) viven en tablas: el
 * ejercicio guarda solo la clave, y la explicación sale de la tabla.
 */
import { definir, campo, ent, elegir, niveles } from './tipos.js';
import { aTexto, ip, miles } from './ip.js';

const varios = (rng, origen, n) => {
  const copia = [...origen];
  for (let i = copia.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [copia[i], copia[j]] = [copia[j], copia[i]]; }
  return copia.slice(0, n);
};
const dato = (tabla, clave, tipo) => {
  const x = tabla[clave];
  if (!x) throw new Error(`${tipo}: clave desconocida «${clave}»`);
  return x;
};

/* ------------------------------------------------------------- fx-alcance */
const ALCANCES = ['PAN (red de área personal)', 'LAN (red de área local)', 'WLAN (LAN inalámbrica)', 'CAN (red de campus)', 'MAN (red de área metropolitana)', 'WAN (red de área amplia)'];
const SIGLA = ['PAN', 'LAN', 'WLAN', 'CAN', 'MAN', 'WAN'];
const ESCENAS_ALCANCE = {
  audifonos: ['Unos audífonos Bluetooth conectados a un teléfono que va en el bolsillo de su dueño.', 0, 'Son dispositivos de una sola persona, a uno o dos metros de distancia, enlazados por Bluetooth.'],
  reloj: ['Un reloj inteligente que sincroniza los pasos del día con el teléfono de la misma persona.', 0, 'El reloj y el teléfono pertenecen a una persona y se comunican a muy corta distancia.'],
  teclado: ['Un teclado y un ratón inalámbricos enlazados por Bluetooth con una laptop.', 0, 'Todo ocurre alrededor de una persona y de su equipo, a centímetros de distancia.'],
  oficina: ['Veinte computadoras y dos impresoras de una oficina, todas conectadas por cable a un mismo switch.', 1, 'Los equipos están en un solo lugar, pertenecen a la misma organización y se conectan por cable.'],
  casa: ['La computadora de escritorio y la consola de videojuegos de una casa, conectadas por cable Ethernet al router doméstico.', 1, 'Es una red pequeña, dentro de una sola vivienda y con conexión por cable.'],
  laboratorio: ['Las treinta computadoras de un laboratorio escolar, cableadas a dos switches que están en el mismo salón.', 1, 'Todo cabe en un salón y lo administra la escuela: es una red local cableada.'],
  cafe: ['Los clientes de una cafetería que se conectan con sus laptops a la red wifi del local.', 2, 'Es una red local, pero el medio no es un cable sino ondas de radio (wifi).'],
  tabletas: ['Las tabletas de los meseros de un restaurante, que envían los pedidos por wifi a la cocina.', 2, 'Cubre un solo local y sus equipos se conectan sin cables, por un punto de acceso.'],
  wificasa: ['Los teléfonos y televisores de una casa conectados por wifi al router doméstico.', 2, 'Es la red local de la casa en su versión inalámbrica.'],
  universidad: ['Los seis edificios de una universidad, unidos entre sí con fibra óptica que la propia universidad instaló dentro de su terreno.', 3, 'Son varias LAN de edificios cercanos, unidas con enlaces propios dentro de un mismo terreno.'],
  hospital: ['Las torres de consulta, urgencias y laboratorio de un complejo hospitalario, enlazadas con fibra propia dentro del mismo predio.', 3, 'Varios edificios de la misma organización, vecinos y conectados con infraestructura propia.'],
  corporativo: ['Los cuatro edificios de un parque corporativo de una sola empresa, interconectados dentro del mismo predio.', 3, 'Más que un edificio, menos que una ciudad, y toda la infraestructura es de la empresa.'],
  ciudad: ['Las oficinas de un ayuntamiento repartidas por toda la ciudad, unidas por un anillo de fibra que recorre el municipio.', 4, 'La red abarca una ciudad completa: es mayor que un campus y menor que una red entre ciudades.'],
  cable: ['La red de un proveedor de internet por cable que da servicio a todos los barrios de una ciudad.', 4, 'Su alcance es el área metropolitana de una ciudad.'],
  semaforos: ['Los semáforos y las cámaras de tránsito de toda una ciudad, conectados a un centro de control municipal.', 4, 'Los equipos están repartidos por la ciudad entera, sin salir de ella.'],
  sucursales: ['La oficina central de un banco en Monterrey conectada con sus sucursales de Guadalajara y Mérida mediante enlaces contratados a un proveedor.', 5, 'Une sitios de ciudades distintas, a cientos de kilómetros, usando enlaces de un proveedor.'],
  internet: ['Internet: miles de redes de todo el mundo interconectadas.', 5, 'Es el ejemplo más grande que existe de una red que cubre distancias enormes.'],
  paises: ['Una empresa que enlaza su fábrica de México con su centro de diseño en España.', 5, 'La distancia es intercontinental y los enlaces los presta un operador.'],
};
definir('fx-alcance', 'Tipo de red por su alcance', {
  crear: (rng) => ({ caso: elegir(rng, Object.keys(ESCENAS_ALCANCE)) }),
  resolver({ caso }) {
    const [texto, r, porque] = dato(ESCENAS_ALCANCE, caso, 'fx-alcance');
    return {
      enunciado: `¿Qué tipo de red, según su alcance, describe mejor esta situación?\n\n${texto}`,
      campos: [campo('r', 'Tipo de red', 'opcion', r, { opciones: ALCANCES, lista: true })],
      pistas: [
        'Fíjate en dos cosas: la distancia que cubre la red y si usa cable u ondas de radio.',
        'De menor a mayor: PAN (una persona), LAN (un lugar), CAN (varios edificios vecinos), MAN (una ciudad), WAN (entre ciudades o países).',
        'WLAN es una LAN cuyos equipos se conectan por wifi en lugar de por cable.',
      ],
      pasos: [
        { t: 'Las redes se clasifican por el área que cubren:', tabla: { cab: ['Tipo', 'Alcance', 'Ejemplo típico'], filas: [
          ['PAN', 'Alrededor de una persona (metros)', 'Teléfono y audífonos Bluetooth'], ['LAN', 'Una casa, una oficina o un edificio', 'Computadoras cableadas a un switch'],
          ['WLAN', 'Lo mismo que una LAN, pero por wifi', 'Laptops conectadas a un punto de acceso'], ['CAN', 'Varios edificios cercanos de una organización', 'Un campus universitario'],
          ['MAN', 'Una ciudad', 'La red de un proveedor de cable'], ['WAN', 'Entre ciudades, países o continentes', 'Las sucursales de un banco; Internet']] } },
        { t: `${porque} Por eso es una **${SIGLA[r]}**.` },
      ],
    };
  },
});

/* ---------------------------------------------------------------- fx-capa */
const OSI = ['Capa 1 · Física', 'Capa 2 · Enlace de datos', 'Capa 3 · Red', 'Capa 4 · Transporte', 'Capa 5 · Sesión', 'Capa 6 · Presentación', 'Capa 7 · Aplicación'];
const TCPIP = ['Acceso a la red', 'Internet', 'Transporte', 'Aplicación'];
const aTcpip = (osi) => (osi <= 2 ? 0 : osi === 3 ? 1 : osi === 4 ? 2 : 3);
// clave: [cómo se nombra en el enunciado, capa OSI (1–7), por qué]
const ELEMENTOS = {
  http: ['el protocolo **HTTP**', 7, 'HTTP es el protocolo con el que el navegador pide páginas web: lo usa directamente la aplicación.'],
  dns: ['el protocolo **DNS**', 7, 'DNS traduce nombres como `www.ejemplo.com` a direcciones IP: es un servicio que usan las aplicaciones.'],
  dhcp: ['el protocolo **DHCP**', 7, 'DHCP reparte la configuración IP a los equipos: es un servicio de aplicación, aunque trabaje «en segundo plano».'],
  ftp: ['el protocolo **FTP**', 7, 'FTP transfiere archivos entre un cliente y un servidor: es un protocolo de aplicación.'],
  smtp: ['el protocolo **SMTP**', 7, 'SMTP envía correo electrónico: es un protocolo de aplicación.'],
  ssh: ['el protocolo **SSH**', 7, 'SSH abre una terminal remota cifrada: es un protocolo de aplicación.'],
  cifrado: ['el **cifrado y la compresión** de los datos antes de enviarlos', 6, 'La capa de presentación se ocupa del formato de los datos: codificación, compresión y cifrado.'],
  formatos: ['los **formatos de datos** como JPEG, MP3 o ASCII', 6, 'Acordar en qué formato se representan los datos es tarea de la capa de presentación.'],
  sesion: ['**abrir, mantener y cerrar el diálogo** entre dos aplicaciones', 5, 'Eso es justo lo que hace la capa de sesión: administra la conversación entre los dos extremos.'],
  tcp: ['el protocolo **TCP**', 4, 'TCP entrega los datos de extremo a extremo de forma confiable: es un protocolo de transporte.'],
  udp: ['el protocolo **UDP**', 4, 'UDP entrega datos de extremo a extremo sin establecer conexión: es un protocolo de transporte.'],
  puertos: ['los **números de puerto**', 4, 'Los puertos identifican a qué aplicación va cada dato, y eso se decide en la capa de transporte.'],
  segmento: ['la PDU llamada **segmento**', 4, 'El segmento es la unidad de datos de la capa de transporte (TCP).'],
  ip: ['el protocolo **IP** (IPv4 e IPv6)', 3, 'IP da una dirección lógica a cada equipo y permite llevar los paquetes de una red a otra.'],
  icmp: ['el protocolo **ICMP**, el que usa `ping`', 3, 'ICMP lleva mensajes de control y de error de IP: trabaja en la capa de red.'],
  router: ['un **router**', 3, 'El router decide por dónde enviar cada paquete mirando su dirección IP de destino, que es información de capa 3.'],
  dirip: ['la **dirección IP**', 3, 'La dirección IP es la dirección lógica, la que identifica al equipo de origen y al de destino final: capa 3.'],
  paquete: ['la PDU llamada **paquete**', 3, 'El paquete es la unidad de datos de la capa de red.'],
  ethernet: ['el estándar **Ethernet** (su formato de trama)', 2, 'Ethernet define cómo es la trama y cómo se direcciona con MAC dentro de la red local: capa 2.'],
  switch: ['un **switch** convencional', 2, 'El switch reenvía tramas mirando la dirección MAC de destino, que es información de capa 2.'],
  mac: ['la **dirección MAC**', 2, 'La dirección MAC es la dirección física de la tarjeta de red y solo sirve dentro de la red local: capa 2.'],
  trama: ['la PDU llamada **trama**', 2, 'La trama es la unidad de datos de la capa de enlace de datos.'],
  ap: ['un **punto de acceso inalámbrico** (wifi)', 2, 'El punto de acceso reenvía tramas 802.11 entre los clientes wifi y la red cableada: trabaja en capa 2.'],
  utp: ['un **cable UTP**', 1, 'Un cable solo transporta señales: es parte de la capa física.'],
  hub: ['un **hub** (concentrador)', 1, 'El hub repite la señal eléctrica por todos sus puertos sin leer direcciones: capa 1.'],
  fibra: ['un cable de **fibra óptica**', 1, 'La fibra transporta pulsos de luz: es un medio físico.'],
  bits: ['la conversión de **bits en señales** eléctricas, de luz o de radio', 1, 'Convertir los bits en señales que viajan por el medio es la tarea de la capa física.'],
  rj45: ['el **conector RJ-45**', 1, 'Los conectores y sus especificaciones mecánicas pertenecen a la capa física.'],
  repetidor: ['un **repetidor**', 1, 'Un repetidor solo regenera la señal para que llegue más lejos: capa 1.'],
};
const CAPAS_FACILES = ['http', 'dns', 'tcp', 'udp', 'ip', 'router', 'switch', 'mac', 'utp', 'hub', 'trama', 'paquete', 'dirip', 'ethernet', 'fibra'];
definir('fx-capa', '¿En qué capa trabaja?', {
  crear: (rng, nivel) => ({ que: elegir(rng, nivel <= 2 ? CAPAS_FACILES : Object.keys(ELEMENTOS)) }),
  resolver({ que }) {
    const [nombre, osi, porque] = dato(ELEMENTOS, que, 'fx-capa');
    const t = aTcpip(osi);
    return {
      enunciado: `¿En qué capa del modelo **OSI** se ubica ${nombre}? ¿Y a qué capa del modelo **TCP/IP** corresponde?`,
      campos: [
        campo('osi', 'Capa del modelo OSI', 'opcion', osi - 1, { opciones: OSI, lista: true }),
        campo('tcpip', 'Capa del modelo TCP/IP', 'opcion', t, { opciones: TCPIP, lista: true }),
      ],
      pistas: [
        'Pregúntate con qué trabaja: ¿señales y cables (1), direcciones MAC y tramas (2), direcciones IP y paquetes (3), puertos (4) o los datos de la aplicación (5 a 7)?',
        'Dispositivos: el hub es de capa 1, el switch de capa 2 y el router de capa 3.',
        'TCP/IP agrupa las capas: 1 y 2 de OSI son «Acceso a la red», la 3 es «Internet», la 4 «Transporte» y las 5, 6 y 7 son «Aplicación».',
      ],
      pasos: [
        { t: `${porque} En el modelo OSI es la **capa ${osi}** (${OSI[osi - 1].split(' · ')[1]}).` },
        { t: `El modelo TCP/IP tiene solo cuatro capas. La capa ${osi} de OSI queda dentro de **${TCPIP[t]}**.`,
          tabla: { cab: ['Capas OSI', 'Capa TCP/IP'], filas: [['7 Aplicación, 6 Presentación, 5 Sesión', 'Aplicación'], ['4 Transporte', 'Transporte'], ['3 Red', 'Internet'], ['2 Enlace de datos, 1 Física', 'Acceso a la red']] } },
      ],
    };
  },
});

/* ----------------------------------------------------------------- fx-pdu */
const PDUS = ['Datos', 'Segmento', 'Paquete', 'Trama', 'Bits'];
const DIRECCIONES = ['Ninguna: la aplicación trabaja con el contenido', 'Números de puerto', 'Direcciones IP', 'Direcciones MAC', 'Ninguna: solo viajan señales'];
// clave: [nombre de la capa, PDU, direccionamiento, qué se añade]
const CAPAS_PDU = {
  aplicacion: ['aplicación (capas 5 a 7 de OSI)', 0, 0, 'La aplicación genera el contenido: una petición web, un correo, un archivo. A eso se le llama simplemente **datos**.'],
  transporte: ['transporte (capa 4)', 1, 1, 'La capa de transporte corta los datos en trozos y a cada uno le pone un encabezado con el **puerto de origen** y el **puerto de destino**. El resultado es un **segmento** (con UDP se le llama datagrama).'],
  red: ['red (capa 3)', 2, 2, 'La capa de red añade un encabezado con la **dirección IP de origen** y la **de destino**. El resultado es un **paquete**.'],
  enlace: ['enlace de datos (capa 2)', 3, 3, 'La capa de enlace añade un encabezado con las **direcciones MAC** de origen y destino y, al final, un tráiler para detectar errores. El resultado es una **trama**.'],
  fisica: ['física (capa 1)', 4, 4, 'La capa física no añade direcciones: convierte la trama en **bits** y estos en señales eléctricas, de luz o de radio.'],
};
definir('fx-pdu', 'PDU y direccionamiento de una capa', {
  crear: (rng) => ({ capa: elegir(rng, ['transporte', 'red', 'enlace', 'transporte', 'red', 'enlace', 'fisica', 'aplicacion']) }),
  resolver({ capa }) {
    const [nombre, pdu, dir, porque] = dato(CAPAS_PDU, capa, 'fx-pdu');
    return {
      enunciado: `En la capa de **${nombre}**, ¿cómo se llama la unidad de datos (PDU) y qué direccionamiento añade esa capa?`,
      campos: [
        campo('pdu', 'Nombre de la PDU', 'opcion', pdu, { opciones: PDUS }),
        campo('dir', 'Direccionamiento que añade', 'opcion', dir, { opciones: DIRECCIONES, lista: true }),
      ],
      pistas: [
        'De arriba abajo, las PDU son: datos, segmento, paquete, trama y bits.',
        'Cada capa añade su propio encabezado, con su propio tipo de dirección.',
        'Puertos en transporte, IP en red y MAC en enlace de datos.',
      ],
      pasos: [
        { t: porque },
        { t: 'El recorrido completo al enviar (encapsulación):', tabla: { cab: ['Capa', 'PDU', 'Dirección que añade'], filas: [
          ['Aplicación', 'Datos', '—'], ['Transporte', 'Segmento', 'Puertos de origen y destino'], ['Red', 'Paquete', 'IP de origen y destino'], ['Enlace de datos', 'Trama', 'MAC de origen y destino'], ['Física', 'Bits', '—']] } },
      ],
    };
  },
});

/* --------------------------------------------------------------- fx-salto */
const macAzar = (rng) => [0x00, ent(rng, 0x10, 0x5f), ent(rng, 0, 255), ent(rng, 0, 255), ent(rng, 0, 255), ent(rng, 1, 254)].map((b) => b.toString(16).padStart(2, '0')).join(':');
definir('fx-salto', 'Direcciones en cada tramo', {
  crear(rng) {
    const [x, y] = varios(rng, [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], 2);
    const [ha, hb] = [ent(rng, 10, 200), ent(rng, 10, 200)];
    const macs = new Set();
    while (macs.size < 4) macs.add(macAzar(rng));
    const [m1, m2, m3, m4] = [...macs];
    return {
      a: { ip: `192.168.${x}.${ha}`, mac: m1 }, ra: { ip: `192.168.${x}.1`, mac: m2 },
      rb: { ip: `192.168.${y}.1`, mac: m3 }, b: { ip: `192.168.${y}.${hb}`, mac: m4 },
      red: elegir(rng, ['A', 'B']), sentido: elegir(rng, ['ida', 'ida', 'vuelta']),
    };
  },
  resolver(q) {
    for (const k of ['a', 'ra', 'rb', 'b']) ip(q[k].ip);
    const ida = q.sentido === 'ida';
    const [origen, destino] = ida ? [q.a, q.b] : [q.b, q.a];
    const [nOrigen, nDestino] = ida ? ['PC-A', 'el servidor'] : ['el servidor', 'PC-A'];
    const redOrigen = ida ? 'A' : 'B';
    const enOrigen = q.red === redOrigen;
    const iface = q.red === 'A' ? q.ra : q.rb;
    const nIface = q.red === 'A' ? 'G0/0' : 'G0/1';
    const macO = enOrigen ? origen.mac : iface.mac;
    const macD = enOrigen ? iface.mac : destino.mac;
    return {
      enunciado: `PC-A y un servidor están en redes distintas, unidas por el router R1. ${ida ? '**PC-A envía un paquete al servidor.**' : '**El servidor le responde a PC-A.**'} Indica qué direcciones lleva la trama mientras viaja por la **red ${q.red}** (el tramo entre ${q.red === 'A' ? 'PC-A y R1' : 'R1 y el servidor'}).`,
      tabla: { cab: ['Equipo', 'Red', 'Dirección IP', 'Dirección MAC'], filas: [
        ['PC-A', 'A', q.a.ip, q.a.mac], ['R1, interfaz G0/0', 'A', q.ra.ip, q.ra.mac], ['R1, interfaz G0/1', 'B', q.rb.ip, q.rb.mac], ['Servidor', 'B', q.b.ip, q.b.mac]] },
      campos: [
        campo('macO', 'MAC de origen', 'mac', macO), campo('macD', 'MAC de destino', 'mac', macD),
        campo('ipO', 'IP de origen', 'ip', origen.ip), campo('ipD', 'IP de destino', 'ip', destino.ip),
      ],
      pistas: [
        'Las direcciones IP identifican a los dos extremos de la conversación y no cambian en todo el viaje.',
        'Las direcciones MAC solo sirven dentro de una red: en cada tramo son las de los dos equipos que están en los extremos de ese tramo.',
        `En la red ${q.red} el router participa con su interfaz ${nIface}. Decide si en este tramo el router es quien envía o quien recibe.`,
      ],
      pasos: [
        { t: `**Direcciones IP (capa 3).** El paquete va de ${nOrigen} a ${nDestino}, y esas direcciones no se tocan en ningún salto: IP de origen \`${origen.ip}\`, IP de destino \`${destino.ip}\`.` },
        { t: `**Direcciones MAC (capa 2).** La trama solo vive dentro de una red. Como el destino está en otra red, ${nOrigen} no le entrega la trama directamente: la manda a su puerta de enlace, el router. El router quita esa trama, mira la IP de destino y fabrica una **trama nueva** para la otra red.` },
        { t: enOrigen
          ? `La red ${q.red} es la de ${nOrigen}, el que envía. En este tramo la trama sale de ${nOrigen} (\`${origen.mac}\`) y va hacia la interfaz ${nIface} del router (\`${iface.mac}\`).`
          : `La red ${q.red} es la de ${nDestino}, el destinatario. En este tramo la trama la fabrica el router: sale de su interfaz ${nIface} (\`${iface.mac}\`) y va hacia ${nDestino} (\`${destino.mac}\`).` },
        { t: 'Resumen del viaje completo:', tabla: { cab: ['Tramo', 'MAC origen', 'MAC destino', 'IP origen', 'IP destino'], filas: [
          [`Red ${redOrigen}`, origen.mac, (redOrigen === 'A' ? q.ra : q.rb).mac, origen.ip, destino.ip],
          [`Red ${redOrigen === 'A' ? 'B' : 'A'}`, (redOrigen === 'A' ? q.rb : q.ra).mac, destino.mac, origen.ip, destino.ip]] } },
      ],
    };
  },
});

/* ------------------------------------------------------------ fx-unidades */
const txt = (n) => miles(n);
definir('fx-unidades', 'Velocidad, tamaño y tiempo', {
  crear(rng, nivel) {
    const modo = elegir(rng, nivel <= 4 ? ['convertir', 'convertir', 'tiempo', 'tiempo', 'tamano'] : ['tiempo', 'tiempo', 'tamano', 'medir', 'medir', 'convertir']);
    const a = elegir(rng, [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 100, 125]);
    if (modo === 'convertir') return { modo, mbps: a * 8 };
    if (modo === 'tiempo' && rng() < 0.4) { const b = elegir(rng, [5, 10, 20, 25, 40, 50, 100, 125]); return { modo, mbps: b * 8, mb: ent(rng, 1, 20) * 1000 }; }
    const s = elegir(rng, [5, 10, 15, 20, 30, 40, 45, 60, 90, 120]);
    return { modo, mbps: a * 8, mb: a * s };
  },
  resolver(q) {
    const mbs = q.mbps / 8;
    if (!Number.isInteger(mbs) || (q.modo !== 'convertir' && !Number.isInteger(q.mb / mbs))) throw new Error('fx-unidades: los datos no dan un resultado entero');
    const pistas = [
      'Cuidado con las letras: **b** minúscula es bit y **B** mayúscula es byte. Un byte son 8 bits.',
      'Para pasar de megabits por segundo (Mbps) a megabytes por segundo (MB/s) se divide entre 8.',
      'Tiempo = tamaño ÷ velocidad, pero solo cuando las dos cosas están en la misma unidad (por ejemplo, MB y MB/s).',
    ];
    const regla = { t: 'Las velocidades de red se anuncian en **bits** por segundo y los tamaños de archivo se miden en **bytes**. Como 1 byte = 8 bits, hay que igualar las unidades antes de calcular.' };
    if (q.modo === 'convertir') {
      return {
        enunciado: `Un enlace transfiere datos a **${txt(q.mbps)} Mbps** (megabits por segundo). ¿A cuántos **MB/s** (megabytes por segundo) equivale?`,
        campos: [campo('mbs', 'Megabytes por segundo (MB/s)', 'numero', mbs)],
        pistas,
        pasos: [regla, { t: `${txt(q.mbps)} Mbps ÷ 8 = **${txt(mbs)} MB/s**. Es decir: cada segundo pasan ${txt(q.mbps)} megabits, que son ${txt(mbs)} megabytes.` }],
      };
    }
    const s = q.mb / mbs;
    const enGb = q.mb >= 1000 && q.mb % 1000 === 0;
    const tam = enGb ? `${txt(q.mb / 1000)} GB` : `${txt(q.mb)} MB`;
    const pasoGb = enGb ? [{ t: `El archivo está en gigabytes. Con 1 GB = 1,000 MB: ${txt(q.mb / 1000)} GB = ${txt(q.mb)} MB.` }] : [];
    const minutos = s >= 60 ? ` (${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ''})` : '';
    if (q.modo === 'tiempo') {
      return {
        enunciado: `Vas a descargar un archivo de **${tam}** y el throughput real de tu conexión es de **${txt(q.mbps)} Mbps**. ¿Cuántos **segundos** tarda la descarga?${enGb ? ' Usa 1 GB = 1,000 MB.' : ''}`,
        campos: [campo('s', 'Segundos', 'numero', s)],
        pistas,
        pasos: [regla, ...pasoGb,
          { t: `Se pasa la velocidad a megabytes: ${txt(q.mbps)} Mbps ÷ 8 = ${txt(mbs)} MB/s.` },
          { t: `Tiempo = tamaño ÷ velocidad = ${txt(q.mb)} MB ÷ ${txt(mbs)} MB/s = **${txt(s)} segundos**${minutos}.` }],
      };
    }
    if (q.modo === 'tamano') {
      return {
        enunciado: `Una descarga mantiene un throughput de **${txt(q.mbps)} Mbps** durante **${txt(s)} segundos**. ¿Cuántos **megabytes (MB)** se descargaron?`,
        campos: [campo('mb', 'Megabytes (MB)', 'numero', q.mb)],
        pistas,
        pasos: [regla,
          { t: `Se pasa la velocidad a megabytes: ${txt(q.mbps)} Mbps ÷ 8 = ${txt(mbs)} MB/s.` },
          { t: `Tamaño = velocidad × tiempo = ${txt(mbs)} MB/s × ${txt(s)} s = **${txt(q.mb)} MB**.` }],
      };
    }
    return {
      enunciado: `Copias un archivo de **${tam}** entre dos equipos y tarda exactamente **${txt(s)} segundos**. ¿Cuál fue el throughput, en **Mbps**?${enGb ? ' Usa 1 GB = 1,000 MB.' : ''}`,
      campos: [campo('mbps', 'Throughput (Mbps)', 'numero', q.mbps)],
      pistas,
      pasos: [regla, ...pasoGb,
        { t: `Velocidad = tamaño ÷ tiempo = ${txt(q.mb)} MB ÷ ${txt(s)} s = ${txt(mbs)} MB/s.` },
        { t: `Para expresarla en bits se multiplica por 8: ${txt(mbs)} MB/s × 8 = **${txt(q.mbps)} Mbps**. Ese es el throughput: lo que realmente pasó, no lo que promete el enlace.` }],
    };
  },
});

/* ---------------------------------------------------------- fx-transporte */
const TRANSPORTES = ['TCP', 'UDP'];
const USOS = {
  web: ['Cargar una página web con HTTPS.', 0, 'Una página a la que le falten trozos no sirve: hace falta que todo llegue completo y en orden.'],
  correo: ['Enviar un correo electrónico con SMTP.', 0, 'Un correo no puede llegar con partes perdidas: se necesita entrega confiable.'],
  archivo: ['Descargar un archivo de instalación por FTP.', 0, 'Si se pierde un solo byte, el archivo queda dañado. TCP retransmite lo que se pierda.'],
  ssh: ['Administrar un router por SSH.', 0, 'Cada tecla y cada respuesta deben llegar completas y en orden.'],
  banca: ['Hacer una transferencia en el portal de un banco.', 0, 'Los datos deben llegar íntegros y en orden; un pequeño retraso no importa.'],
  voz: ['Una llamada de voz sobre IP (VoIP).', 1, 'Importa más que el audio llegue a tiempo que perfecto: retransmitir una sílaba perdida llegaría tarde y sería peor.'],
  video: ['Una videollamada en vivo.', 1, 'En tiempo real, un cuadro perdido se ignora; esperar a retransmitirlo congelaría la imagen.'],
  dns: ['Una consulta DNS normal para resolver un nombre.', 1, 'Es una pregunta corta y una respuesta corta: abrir una conexión costaría más que la consulta misma.'],
  dhcp: ['Un equipo recién encendido que pide su configuración por DHCP.', 1, 'El equipo aún no tiene dirección IP y envía por broadcast: no puede abrir una conexión TCP. DHCP usa UDP.'],
  juego: ['La posición de los jugadores en un videojuego en línea, enviada muchas veces por segundo.', 1, 'Si se pierde una actualización, la siguiente llega enseguida y la sustituye. Se prefiere velocidad.'],
  tftp: ['Copiar la imagen del sistema de un switch con TFTP.', 1, 'TFTP es deliberadamente simple y usa UDP; la confiabilidad la resuelve el propio TFTP con sus acuses.'],
  ntp: ['Sincronizar el reloj de un servidor con NTP.', 1, 'Son mensajes pequeños y periódicos; NTP usa UDP.'],
  streaming: ['La transmisión en vivo de un partido por IPTV (multidifusión).', 1, 'El video en vivo tolera pequeñas pérdidas, pero no retrasos; además, la multidifusión no funciona con conexiones TCP.'],
  snmp: ['Un sistema de monitoreo que pregunta a los switches su estado con SNMP.', 1, 'Son consultas breves y frecuentes; SNMP usa UDP.'],
};
definir('fx-transporte', '¿TCP o UDP?', {
  crear: (rng) => ({ uso: elegir(rng, Object.keys(USOS)) }),
  resolver({ uso }) {
    const [texto, r, porque] = dato(USOS, uso, 'fx-transporte');
    return {
      enunciado: `¿Qué protocolo de transporte usa esta comunicación?\n\n${texto}`,
      campos: [campo('r', 'Protocolo de transporte', 'opcion', r, { opciones: TRANSPORTES })],
      pistas: [
        'TCP garantiza que todo llegue completo y en orden, a cambio de más trabajo y algo de retraso.',
        'UDP envía sin establecer conexión ni confirmar nada: es más rápido y ligero, pero no recupera lo perdido.',
        'Pregúntate qué es peor para esta aplicación: que falte un trozo o que llegue tarde.',
      ],
      pasos: [
        { t: porque },
        { t: `Por eso usa **${TRANSPORTES[r]}**. ${r === 0 ? 'TCP establece una conexión (saludo de tres vías), numera los bytes, espera acuses de recibo y retransmite lo que no se confirme.' : 'UDP no establece conexión, no numera ni confirma: solo añade los puertos y envía. Menos sobrecarga y menos retraso.'}` },
      ],
    };
  },
});

/* ----------------------------------------------------------- fx-handshake */
definir('fx-handshake', 'Números de secuencia y de acuse', {
  crear(rng) {
    return rng() < 0.55
      ? { modo: 'saludo', x: ent(rng, 1, 90) * 100, y: ent(rng, 1, 90) * 100 + 50 }
      : { modo: 'datos', seq: ent(rng, 1, 400) * 10 + 1, bytes: elegir(rng, [100, 200, 250, 500, 536, 1000, 1200, 1460]) };
  },
  resolver(q) {
    if (q.modo === 'saludo') {
      return {
        enunciado: `Un cliente abre una conexión TCP con un servidor. El cliente envía un **SYN** con número de secuencia **${txt(q.x)}**. El servidor elige como número de secuencia inicial **${txt(q.y)}**. Completa los números de los dos mensajes que faltan del saludo de tres vías.`,
        campos: [
          campo('ack2', 'SYN-ACK del servidor: número de acuse (ACK)', 'numero', q.x + 1),
          campo('seq3', 'ACK final del cliente: número de secuencia', 'numero', q.x + 1),
          campo('ack3', 'ACK final del cliente: número de acuse (ACK)', 'numero', q.y + 1),
        ],
        pistas: [
          'El saludo tiene tres mensajes: SYN (cliente), SYN-ACK (servidor) y ACK (cliente).',
          'El número de acuse dice «el siguiente byte que espero de ti».',
          'Un SYN cuenta como un byte: se confirma con el número de secuencia recibido más 1.',
        ],
        pasos: [
          { t: `**1. SYN** (cliente → servidor): secuencia ${txt(q.x)}. El cliente dice «quiero conectarme y empiezo a contar desde ${txt(q.x)}».` },
          { t: `**2. SYN-ACK** (servidor → cliente): secuencia ${txt(q.y)}, acuse **${txt(q.x + 1)}**. El acuse es lo recibido más 1: «recibí tu ${txt(q.x)}, espero el ${txt(q.x + 1)}». Con su propio SYN el servidor anuncia que él contará desde ${txt(q.y)}.` },
          { t: `**3. ACK** (cliente → servidor): secuencia **${txt(q.x + 1)}** (justo la que el servidor dijo esperar) y acuse **${txt(q.y + 1)}** («recibí tu ${txt(q.y)}, espero el ${txt(q.y + 1)}»).` },
          { t: 'La conexión queda abierta en los dos sentidos:', tabla: { cab: ['Mensaje', 'De → a', 'Secuencia', 'Acuse'], filas: [
            ['SYN', 'Cliente → servidor', txt(q.x), '—'], ['SYN-ACK', 'Servidor → cliente', txt(q.y), txt(q.x + 1)], ['ACK', 'Cliente → servidor', txt(q.x + 1), txt(q.y + 1)]] } },
        ],
      };
    }
    return {
      enunciado: `Con la conexión TCP ya abierta, un equipo envía un segmento con número de secuencia **${txt(q.seq)}** que lleva **${txt(q.bytes)} bytes** de datos, y el receptor lo recibe completo. ¿Qué número de acuse (ACK) devuelve el receptor? ¿Y qué número de secuencia llevará el siguiente segmento del emisor?`,
      campos: [
        campo('ack', 'Acuse (ACK) del receptor', 'numero', q.seq + q.bytes),
        campo('seq', 'Secuencia del siguiente segmento', 'numero', q.seq + q.bytes),
      ],
      pistas: [
        'TCP numera cada byte de datos, no cada segmento.',
        'El acuse indica el número del siguiente byte que el receptor espera.',
        'Suma: número de secuencia del segmento más los bytes que lleva.',
      ],
      pasos: [
        { t: `El segmento lleva los bytes numerados del ${txt(q.seq)} al ${txt(q.seq + q.bytes - 1)}: son ${txt(q.bytes)} bytes.` },
        { t: `El receptor confirma con el número del **siguiente byte que espera**: ${txt(q.seq)} + ${txt(q.bytes)} = **${txt(q.seq + q.bytes)}**. Ese acuse significa «tengo todo hasta el ${txt(q.seq + q.bytes - 1)}».` },
        { t: `El emisor continúa justo ahí: su siguiente segmento lleva la secuencia **${txt(q.seq + q.bytes)}**. Si el acuse no llegara a tiempo, el emisor retransmitiría el segmento ${txt(q.seq)}.` },
      ],
    };
  },
});

/* -------------------------------------------------------------- fx-puerto */
const T_OPC = ['TCP', 'UDP', 'Los dos (UDP y TCP)'];
// clave: [nombre, puerto, transporte (índice de T_OPC), para qué sirve]
const PROTOCOLOS = {
  ftp: ['FTP (canal de control)', 21, 0, 'FTP transfiere archivos. Usa el puerto 21 para las órdenes (control) y el 20 para los datos en modo activo, sobre TCP y sin cifrar.'],
  ssh: ['SSH', 22, 0, 'SSH da acceso remoto cifrado a la línea de comandos de un equipo. Puerto 22 sobre TCP.'],
  sftp: ['SFTP', 22, 0, 'SFTP transfiere archivos dentro de una sesión SSH, por eso comparte su puerto: el 22 sobre TCP.'],
  telnet: ['Telnet', 23, 0, 'Telnet da acceso remoto a la línea de comandos, pero sin cifrar: todo viaja en texto claro. Puerto 23 sobre TCP.'],
  smtp: ['SMTP', 25, 0, 'SMTP envía correo electrónico entre servidores. Puerto 25 sobre TCP.'],
  dns: ['DNS', 53, 2, 'DNS traduce nombres a direcciones IP. Puerto 53: las consultas normales van por UDP, y usa TCP para respuestas grandes y transferencias de zona.'],
  dhcp: ['DHCP (lado del servidor)', 67, 1, 'DHCP reparte la configuración IP. El servidor escucha en el puerto 67 y el cliente en el 68, sobre UDP.'],
  tftp: ['TFTP', 69, 1, 'TFTP es una transferencia de archivos mínima, sin usuario ni contraseña. Puerto 69 sobre UDP.'],
  http: ['HTTP', 80, 0, 'HTTP transporta páginas web sin cifrar. Puerto 80 sobre TCP.'],
  pop3: ['POP3', 110, 0, 'POP3 descarga el correo del servidor al equipo. Puerto 110 sobre TCP.'],
  ntp: ['NTP', 123, 1, 'NTP sincroniza la hora de los equipos. Puerto 123 sobre UDP.'],
  imap: ['IMAP', 143, 0, 'IMAP consulta el correo dejándolo en el servidor, sincronizado entre dispositivos. Puerto 143 sobre TCP.'],
  snmp: ['SNMP', 161, 1, 'SNMP consulta y administra dispositivos de red. Puerto 161 sobre UDP (las alertas, o traps, van al 162).'],
  https: ['HTTPS', 443, 0, 'HTTPS es HTTP cifrado con TLS. Puerto 443 sobre TCP.'],
  rdp: ['RDP', 3389, 0, 'RDP es el escritorio remoto de Windows. Puerto 3389 sobre TCP.'],
};
const P_BASICOS = ['ftp', 'ssh', 'telnet', 'smtp', 'dns', 'http', 'https', 'dhcp'];
definir('fx-puerto', 'Protocolos y puertos', {
  crear(rng, nivel) {
    const claves = nivel <= 4 ? P_BASICOS : Object.keys(PROTOCOLOS);
    const proto = elegir(rng, claves);
    if (rng() < 0.5) return { modo: 'puerto', proto };
    // Al revés: del puerto al protocolo. Los distractores no pueden compartir el puerto.
    const correcto = proto === 'sftp' ? 'ssh' : proto;
    const otros = varios(rng, Object.keys(PROTOCOLOS).filter((k) => PROTOCOLOS[k][1] !== PROTOCOLOS[correcto][1]), 3);
    return { modo: 'protocolo', proto: correcto, opciones: varios(rng, [correcto, ...otros], 4) };
  },
  resolver(q) {
    const [nombre, puerto, t, porque] = dato(PROTOCOLOS, q.proto, 'fx-puerto');
    const tablaRef = { cab: ['Protocolo', 'Puerto', 'Transporte'], filas: [
      ['FTP', '20 y 21', 'TCP'], ['SSH y SFTP', '22', 'TCP'], ['Telnet', '23', 'TCP'], ['SMTP', '25', 'TCP'], ['DNS', '53', 'UDP y TCP'], ['DHCP', '67 y 68', 'UDP'], ['TFTP', '69', 'UDP'],
      ['HTTP', '80', 'TCP'], ['POP3', '110', 'TCP'], ['NTP', '123', 'UDP'], ['IMAP', '143', 'TCP'], ['SNMP', '161', 'UDP'], ['HTTPS', '443', 'TCP'], ['RDP', '3389', 'TCP']] };
    if (q.modo === 'protocolo') {
      const opciones = q.opciones.map((k) => dato(PROTOCOLOS, k, 'fx-puerto')[0]);
      return {
        enunciado: `Un firewall registra tráfico hacia el puerto de destino **${puerto}**${t === 2 ? '' : ` sobre ${T_OPC[t]}`}. ¿Qué protocolo de aplicación usa ese puerto por defecto?`,
        campos: [campo('r', 'Protocolo', 'opcion', q.opciones.indexOf(q.proto), { opciones })],
        pistas: [
          'Los puertos del 0 al 1023 son los «bien conocidos»: cada servicio clásico tiene el suyo.',
          'Agrúpalos para recordarlos: web (80 y 443), acceso remoto (22 y 23), correo (25, 110 y 143), archivos (20, 21 y 69).',
          'Los servicios de infraestructura usan UDP: DNS 53, DHCP 67 y 68, NTP 123, SNMP 161.',
        ],
        pasos: [{ t: `El puerto ${puerto} es el de **${nombre}**. ${porque}` }, { t: 'Tabla de referencia:', tabla: tablaRef }],
      };
    }
    return {
      enunciado: `¿Qué número de puerto usa por defecto **${nombre}** y sobre qué protocolo de transporte trabaja?`,
      campos: [campo('puerto', 'Número de puerto', 'numero', puerto), campo('t', 'Transporte', 'opcion', t, { opciones: T_OPC })],
      pistas: [
        'Los puertos del 0 al 1023 son los «bien conocidos»: cada servicio clásico tiene el suyo.',
        'Agrúpalos para recordarlos: web (80 y 443), acceso remoto (22 y 23), correo (25, 110 y 143), archivos (20, 21 y 69).',
        'Los servicios de infraestructura usan UDP: DNS 53, DHCP 67 y 68, NTP 123, SNMP 161.',
      ],
      pasos: [{ t: porque }, { t: 'Tabla de referencia:', tabla: tablaRef }],
    };
  },
});

/* ---------------------------------------------------------------- fx-nube */
const SERVICIOS = ['SaaS (software como servicio)', 'PaaS (plataforma como servicio)', 'IaaS (infraestructura como servicio)', 'Local (on-premises)'];
const DESPLIEGUES = ['Nube pública', 'Nube privada', 'Nube híbrida', 'Nube comunitaria'];
// clave: [grupo, escenario, respuesta, por qué]
const NUBES = {
  correo: ['servicio', 'Una empresa contrata correo electrónico y hojas de cálculo que sus empleados usan desde el navegador, pagando una cuota mensual por usuario.', 0, 'La empresa solo **usa** una aplicación terminada. No instala, no actualiza ni administra servidores: todo eso lo hace el proveedor.'],
  crm: ['servicio', 'El equipo de ventas usa un sistema de clientes (CRM) en línea; solo necesitan un navegador y su usuario.', 0, 'Es una aplicación lista para usar a la que se entra por internet. El cliente no ve ni el servidor ni el sistema operativo.'],
  video: ['servicio', 'Una escuela usa una plataforma de videoconferencias en línea para sus clases, sin instalar ningún servidor propio.', 0, 'La escuela consume una aplicación terminada que el proveedor opera por completo.'],
  desarrollo: ['servicio', 'Unos programadores suben el código de su aplicación a un servicio que ya incluye el sistema operativo, la base de datos y el entorno de ejecución; ellos solo se ocupan del código.', 1, 'El proveedor entrega la **plataforma** ya montada (sistema, base de datos, entorno). El cliente pone su aplicación y sus datos, nada más.'],
  basedatos: ['servicio', 'Una empresa usa una base de datos administrada: el proveedor instala, parcha y respalda el motor, y la empresa solo crea sus tablas y consultas.', 1, 'El cliente no administra el sistema operativo ni el motor: recibe una plataforma lista sobre la que construir.'],
  funciones: ['servicio', 'Un equipo publica su sitio web en un servicio que escala solo y que no les deja tocar el sistema operativo: únicamente suben el código de la aplicación.', 1, 'No hay acceso al sistema operativo: el proveedor da el entorno y el cliente aporta la aplicación.'],
  maquinas: ['servicio', 'Un administrador alquila tres máquinas virtuales en un proveedor, elige cuánta memoria y disco tienen e instala él mismo el sistema operativo y los programas.', 2, 'El proveedor presta la **infraestructura** (cómputo, almacenamiento, red). Del sistema operativo hacia arriba, todo lo administra el cliente.'],
  almacenamiento: ['servicio', 'Una empresa alquila servidores virtuales, discos y redes virtuales en un proveedor para montar ahí sus propios sistemas, que ella misma instala y mantiene.', 2, 'Se alquilan los «fierros» virtuales; instalar y mantener el sistema operativo y las aplicaciones es tarea del cliente.'],
  respaldo: ['servicio', 'Para un proyecto de dos meses, un equipo crea veinte servidores virtuales con Linux, los configura a su gusto y los borra al terminar.', 2, 'Tienen control completo del sistema operativo y pagan solo por el tiempo de uso: es infraestructura alquilada.'],
  sala: ['servicio', 'Una clínica compra sus propios servidores, los instala en un cuarto del edificio y su personal se encarga de la electricidad, el aire acondicionado, los respaldos y las actualizaciones.', 3, 'Todo, desde el edificio hasta la aplicación, es propiedad y responsabilidad de la organización. No hay proveedor de nube.'],
  nomina: ['servicio', 'El sistema de nómina de una fábrica corre en un servidor físico que está en la oficina de sistemas de la propia fábrica.', 3, 'El equipo está en las instalaciones de la empresa y lo administra su propio personal.'],
  publica: ['despliegue', 'Una empresa nueva monta su tienda en línea en los servidores de un gran proveedor, que comparte su infraestructura entre miles de clientes por internet.', 0, 'La infraestructura es del proveedor, se comparte entre muchos clientes y cualquiera puede contratarla.'],
  publica2: ['despliegue', 'Un estudiante crea una cuenta con su tarjeta en un proveedor de nube y en cinco minutos tiene un servidor funcionando.', 0, 'Está abierta al público general: cualquiera puede contratarla por internet.'],
  privada: ['despliegue', 'Un banco construye su propia plataforma de nube en centros de datos que usa en exclusiva; ninguna otra organización tiene acceso.', 1, 'Los recursos son para **una sola organización**, que controla quién entra y cómo se usan.'],
  privada2: ['despliegue', 'Una secretaría de gobierno opera una nube en su propio centro de datos, solo para sus dependencias internas, por exigencias de confidencialidad.', 1, 'El uso es exclusivo de una organización, aunque la tecnología sea la misma de una nube.'],
  hibrida: ['despliegue', 'Un hospital guarda los expedientes clínicos en su centro de datos propio, pero su portal de citas corre en un proveedor externo; los dos entornos están conectados y trabajan juntos.', 2, 'Combina un entorno privado con uno público, conectados entre sí: lo sensible queda dentro y lo demás aprovecha la nube pública.'],
  hibrida2: ['despliegue', 'Una tienda usa sus servidores propios todo el año y, durante las ventas de fin de año, añade capacidad en un proveedor público que se integra con su sistema interno.', 2, 'Mezcla recursos propios con recursos públicos que funcionan como un solo sistema.'],
  comunitaria: ['despliegue', 'Varias universidades públicas comparten una misma plataforma de nube, creada solo para ellas y con las reglas de seguridad que acordaron entre todas.', 3, 'La comparten **varias organizaciones con necesidades comunes**, pero no está abierta al público.'],
  comunitaria2: ['despliegue', 'Un grupo de hospitales de una región comparte una nube exclusiva para ellos, diseñada para cumplir las normas del sector salud.', 3, 'Es de uso compartido entre organizaciones del mismo sector, con requisitos en común.'],
};
definir('fx-nube', 'Modelos de nube', {
  crear: (rng) => ({ caso: elegir(rng, Object.keys(NUBES)) }),
  resolver({ caso }) {
    const [grupo, texto, r, porque] = dato(NUBES, caso, 'fx-nube');
    if (grupo === 'servicio') {
      return {
        enunciado: `¿Qué modelo de servicio describe esta situación?\n\n${texto}`,
        campos: [campo('r', 'Modelo de servicio', 'opcion', r, { opciones: SERVICIOS, lista: true })],
        pistas: [
          'La pregunta clave es: ¿qué administra el cliente y qué administra el proveedor?',
          'IaaS: te prestan máquinas y tú instalas todo. PaaS: te dan el entorno listo y tú pones tu aplicación. SaaS: usas una aplicación terminada.',
          'Si los servidores están en el edificio de la propia organización y los cuida su personal, no es nube: es local.',
        ],
        pasos: [
          { t: porque },
          { t: `Es **${SERVICIOS[r]}**. Quién administra cada cosa:`, tabla: { cab: ['', 'Local', 'IaaS', 'PaaS', 'SaaS'], filas: [
            ['Aplicación y datos', 'Tú', 'Tú', 'Tú', 'Proveedor (los datos son tuyos)'], ['Sistema operativo y entorno', 'Tú', 'Tú', 'Proveedor', 'Proveedor'], ['Servidores, discos y red', 'Tú', 'Proveedor', 'Proveedor', 'Proveedor']] } },
        ],
      };
    }
    return {
      enunciado: `¿Qué modelo de despliegue de nube describe esta situación?\n\n${texto}`,
      campos: [campo('r', 'Modelo de despliegue', 'opcion', r, { opciones: DESPLIEGUES, lista: true })],
      pistas: [
        'La pregunta clave es: ¿quién puede usar esa nube?',
        'Pública: cualquiera que la contrate. Privada: una sola organización. Comunitaria: varias organizaciones con intereses comunes.',
        'Híbrida: dos o más de las anteriores conectadas y trabajando juntas.',
      ],
      pasos: [
        { t: porque },
        { t: `Es una **${DESPLIEGUES[r].toLowerCase()}**.`, tabla: { cab: ['Modelo', 'Quién la usa'], filas: [
          ['Pública', 'Cualquier cliente, compartiendo la infraestructura del proveedor'], ['Privada', 'Una sola organización'], ['Híbrida', 'Combina privada y pública, conectadas entre sí'], ['Comunitaria', 'Varias organizaciones con necesidades comunes']] } },
      ],
    };
  },
});

/* ---------------------------------------------------------------- niveles */
niveles('fundamentos', [
  { n: 1, nombre: 'Qué es una red', resumen: 'Componentes, tipos de red por su alcance y topologías.',
    tipos: [['fx-alcance', 4], ['banco', 6]] },
  { n: 2, nombre: 'Modelos de capas', resumen: 'Las capas de OSI y TCP/IP: qué hace cada una y qué vive en ella.',
    tipos: [['fx-capa', 4], ['fx-pdu', 1], ['banco', 5]] },
  { n: 3, nombre: 'Encapsulación', resumen: 'PDU, encabezados y qué direcciones cambian en cada salto.',
    tipos: [['fx-salto', 3], ['fx-pdu', 2], ['fx-capa', 1], ['banco', 4]] },
  { n: 4, nombre: 'Rendimiento', resumen: 'Ancho de banda, throughput, latencia y cálculos con bits y bytes.',
    tipos: [['fx-unidades', 5], ['banco', 5]] },
  { n: 5, nombre: 'Transporte', resumen: 'TCP y UDP, saludo de tres vías, acuses y puertos.',
    tipos: [['fx-transporte', 2], ['fx-handshake', 2], ['fx-puerto', 2], ['fx-unidades', 1], ['banco', 4]] },
  { n: 6, nombre: 'Aplicaciones y nube', resumen: 'Protocolos de aplicación con sus puertos y modelos de servicio en la nube.',
    tipos: [['fx-puerto', 3], ['fx-nube', 3], ['fx-transporte', 1], ['banco', 5]] },
]);
