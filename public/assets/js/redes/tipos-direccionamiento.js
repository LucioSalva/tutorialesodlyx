/**
 * Academia de Redes · Tipos de ejercicio de «NAT, DHCP e IPv6»
 * ---------------------------------------------------------------------
 * Mismo contrato que tipos.js: crear(rng, nivel) → parámetros y
 * resolver(params) → { enunciado, tabla?, campos, pistas, pasos }.
 * Todo se calcula con ip.js e ipv6.js; nada se escribe a mano.
 */
import { definir, campo, ent, elegir, niveles } from './tipos.js';
import { ip, aTexto, red, tamano, hostsUtiles, mascara, miles } from './ip.js';
import { ip6, larga, sinCeros, rachaDeCeros, corta, prefijo6, tipo6, mac, macTexto, eui64 } from './ipv6.js';

const SI_NO = ['Sí', 'No'];
const hx = (n, ancho = 1) => n.toString(16).padStart(ancho, '0');
const bin = (n, ancho) => n.toString(2).padStart(ancho, '0');
const dentro = (d, base, p) => red(d, p) === ip(base);

/* ---------------------------------------------------------- dr-ambito */
const AMBITOS = [
  'Pública: se enruta en Internet',
  'Privada (RFC 1918)',
  'Loopback: el propio equipo',
  'Enlace local automática (APIPA)',
  'Espacio compartido del proveedor (CGNAT)',
  'Multicast (clase D)',
  'Reservada o experimental (clase E)',
];
const BLOQUES4 = [
  ['10.0.0.0', 8, 1, 'Privado'], ['172.16.0.0', 12, 1, 'Privado'], ['192.168.0.0', 16, 1, 'Privado'],
  ['127.0.0.0', 8, 2, 'Loopback'], ['169.254.0.0', 16, 3, 'Enlace local (APIPA)'], ['100.64.0.0', 10, 4, 'Compartido del proveedor (CGNAT)'],
  ['224.0.0.0', 4, 5, 'Multicast'], ['240.0.0.0', 4, 6, 'Reservado (clase E)'],
];
const bloqueDe = (d) => BLOQUES4.find(([b, p]) => dentro(d, b, p)) ?? null;
const rango4 = (b, p) => `${b} – ${aTexto(ip(b) + tamano(p) - 1)}`;
const PORQUE4 = [
  'No cae en ningún bloque reservado: es una dirección **pública**, única en todo Internet y enrutable.',
  'Es **privada**: cualquier organización puede usarla dentro de su red, pero los routers de Internet la descartan. Para salir necesita NAT.',
  'Es de **loopback**: todo el bloque 127.0.0.0/8 apunta al propio equipo. El paquete nunca sale por el cable.',
  'Es una dirección **APIPA**: el equipo se la puso solo porque pidió una por DHCP y nadie respondió. Solo sirve para hablar con vecinos del mismo enlace que estén en la misma situación.',
  'Es del bloque **100.64.0.0/10**, que los proveedores usan entre el router del cliente y su propio NAT (CGNAT). No es RFC 1918, pero tampoco se enruta en Internet.',
  'Es **multicast**: identifica a un grupo de equipos, no a uno solo. Nunca se asigna como dirección propia de un host.',
  'Es de la antigua **clase E** (240.0.0.0/4), reservada para uso experimental. No se asigna a equipos.',
];
definir('dr-ambito', 'Tipo de dirección IPv4', {
  crear(rng) {
    const cola = () => `${ent(rng, 0, 255)}.${ent(rng, 1, 254)}`;
    return { ip: elegir(rng, [
      `10.${ent(rng, 0, 255)}.${cola()}`, `172.${ent(rng, 16, 31)}.${cola()}`, `192.168.${cola()}`,
      `172.${elegir(rng, [15, 32, 33, 40])}.${cola()}`, `192.${elegir(rng, [167, 169, 188])}.${cola()}`, `${elegir(rng, [9, 11])}.${ent(rng, 0, 255)}.${cola()}`,
      `${elegir(rng, [8, 23, 45, 77, 130, 151, 189, 200, 201])}.${ent(rng, 0, 255)}.${cola()}`, `${elegir(rng, [1, 64, 99, 146, 208])}.${ent(rng, 0, 255)}.${cola()}`,
      `127.${ent(rng, 0, 255)}.${cola()}`, `169.254.${cola()}`, `169.${elegir(rng, [253, 255])}.${cola()}`,
      `100.${ent(rng, 64, 127)}.${cola()}`, `100.${elegir(rng, [63, 128, 200])}.${cola()}`,
      `${ent(rng, 224, 239)}.${ent(rng, 0, 255)}.${cola()}`, `${ent(rng, 240, 254)}.${ent(rng, 0, 255)}.${cola()}`,
    ]) };
  },
  resolver(q) {
    const d = ip(q.ip);
    const b = bloqueDe(d);
    const r = b ? b[2] : 0;
    return {
      enunciado: `Clasifica la dirección IPv4 \`${aTexto(d)}\` y di si un router de Internet la reenviaría.`,
      campos: [
        campo('tipo', 'Tipo de dirección', 'opcion', r, { opciones: AMBITOS, lista: true }),
        campo('enrutable', '¿Se enruta en Internet?', 'opcion', r === 0 ? 0 : 1, { opciones: SI_NO }),
      ],
      pistas: [
        'Mira primero el primer octeto: 10, 127, 169, 172, 192, 100 y los mayores de 223 son los que piden una segunda mirada.',
        'Los bloques de 172 y de 100 no ocupan todo el octeto: solo valen 172.16 a 172.31 y 100.64 a 100.127.',
        'Privadas: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. Loopback: 127.0.0.0/8. APIPA: 169.254.0.0/16. CGNAT: 100.64.0.0/10. Multicast: 224 a 239. Reservadas: 240 en adelante.',
      ],
      pasos: [
        { t: 'Se compara la dirección con los bloques especiales. Si no cae en ninguno, es pública.',
          tabla: { cab: ['Bloque', 'Rango', 'Uso', '¿Cae aquí?'], filas: BLOQUES4.map(([base, p, , uso]) => [`${base}/${p}`, rango4(base, p), uso, dentro(d, base, p) ? '**Sí**' : 'No']) } },
        { t: b ? `\`${aTexto(d)}\` está dentro de \`${b[0]}/${b[1]}\` (${rango4(b[0], b[1])}).` : `\`${aTexto(d)}\` no pertenece a ninguno de esos bloques.` },
        { t: PORQUE4[r] + (r === 0 ? ' **Sí se enruta en Internet.**' : ' **No se enruta en Internet.**') },
      ],
    };
  },
});

/* ------------------------------------------------------------- dr-nat */
const SERVICIOS = { 80: 'HTTP', 443: 'HTTPS', 53: 'DNS', 22: 'SSH', 25: 'SMTP', 123: 'NTP' };
definir('dr-nat', 'Traducción con PAT', {
  crear(rng, nivel) {
    const interna = elegir(rng, [`192.168.${ent(rng, 0, 20)}.${ent(rng, 2, 250)}`, `10.${ent(rng, 0, 50)}.${ent(rng, 0, 255)}.${ent(rng, 2, 250)}`, `172.${ent(rng, 16, 31)}.${ent(rng, 0, 255)}.${ent(rng, 2, 250)}`]);
    const puerto = ent(rng, 49152, 65535);
    const ocupado = nivel >= 4 && rng() < 0.5;
    let traducido = puerto;
    if (ocupado) do { traducido = ent(rng, 1024, 65535); } while (traducido === puerto);
    return {
      interna, puerto, publica: `203.0.113.${ent(rng, 1, 254)}`, servidor: `198.51.100.${ent(rng, 1, 254)}`,
      destino: elegir(rng, [80, 443, 443, 53, 22, 25]), traducido,
    };
  },
  resolver(q) {
    const cambia = q.traducido !== q.puerto;
    const serv = SERVICIOS[q.destino] ? ` (${SERVICIOS[q.destino]})` : '';
    return {
      enunciado: `Una computadora de la red interna abre una conexión hacia un servidor de Internet${serv}. El router de salida hace **PAT** (NAT con sobrecarga) usando la dirección pública de su interfaz exterior. `
        + (cambia ? `Otro equipo interno ya tiene una conexión abierta que usa el puerto ${q.puerto} en la dirección pública, así que el router asigna a esta conexión el puerto **${q.traducido}**. ` : 'El puerto de origen está libre en el router, así que lo conserva. ')
        + 'Completa lo que ve el servidor y cómo vuelve la respuesta.',
      tabla: { cab: ['Dato', 'Valor'], filas: [
        ['IP de la computadora', q.interna], ['Puerto de origen que eligió', String(q.puerto)], ['IP pública del router', q.publica],
        ['IP del servidor', q.servidor], ['Puerto de destino', String(q.destino)]] },
      campos: [
        campo('ipo', 'IP de origen que ve el servidor', 'ip', q.publica),
        campo('po', 'Puerto de origen que ve el servidor', 'numero', q.traducido),
        campo('ipr', 'IP de destino de la respuesta al llegar al router', 'ip', q.publica),
        campo('ipl', 'IP de destino de la respuesta ya dentro de la LAN', 'ip', q.interna),
        campo('pl', 'Puerto de destino de la respuesta ya dentro de la LAN', 'numero', q.puerto),
      ],
      pistas: [
        'Al salir, el router cambia el **origen** del paquete; el destino (el servidor) no se toca.',
        'El servidor nunca ve la dirección privada: contesta a la IP y al puerto que le llegaron como origen.',
        'Al volver, el router busca en su tabla la pareja IP pública y puerto, y la cambia de nuevo por la IP privada y el puerto originales.',
      ],
      pasos: [
        { t: `**Salida.** El paquete llega al router con origen \`${q.interna}:${q.puerto}\` y destino \`${q.servidor}:${q.destino}\`. Una dirección privada no puede circular por Internet, así que el router sustituye el origen por su dirección pública ${cambia ? `y, como el puerto ${q.puerto} ya está en uso, también cambia el puerto` : 'y conserva el puerto porque está libre'}.`,
          tabla: { cab: ['', 'IP de origen', 'Puerto de origen', 'IP de destino', 'Puerto de destino'], filas: [
            ['Antes del router', q.interna, String(q.puerto), q.servidor, String(q.destino)],
            ['Después del router', `**${q.publica}**`, `**${q.traducido}**`, q.servidor, String(q.destino)]] } },
        { t: 'El router apunta la equivalencia en su **tabla de traducciones**. Esa línea es lo que le permitirá deshacer el cambio.',
          tabla: { cab: ['Inside local (privada)', 'Inside global (pública)', 'Outside global (servidor)'], filas: [[`${q.interna}:${q.puerto}`, `${q.publica}:${q.traducido}`, `${q.servidor}:${q.destino}`]] } },
        { t: `**Lo que ve el servidor:** un paquete que viene de \`${q.publica}\`, puerto \`${q.traducido}\`. No sabe que detrás hay una red privada, y contesta a esa misma dirección y puerto.` },
        { t: `**Vuelta.** La respuesta llega al router con destino \`${q.publica}:${q.traducido}\`. El router encuentra esa pareja en la tabla y restaura el destino original: \`${q.interna}:${q.puerto}\`. Así la respuesta llega a la computadora correcta aunque muchas compartan la misma IP pública.` },
      ],
    };
  },
});

/* ------------------------------------------------------------ dr-dhcp */
const DORA = [
  { n: 'Discover', quien: 0, puerto: 67, que: 'El cliente pregunta a toda la red si hay algún servidor DHCP. Todavía no tiene dirección: sale desde `0.0.0.0` hacia el broadcast `255.255.255.255`.' },
  { n: 'Offer', quien: 1, puerto: 68, que: 'El servidor propone una dirección concreta, con su máscara, su puerta de enlace, sus DNS y el tiempo de concesión.' },
  { n: 'Request', quien: 0, puerto: 67, que: 'El cliente acepta formalmente una de las ofertas. Lo dice por broadcast para que los demás servidores sepan que su oferta fue rechazada.' },
  { n: 'Acknowledge', quien: 1, puerto: 68, que: 'El servidor confirma la concesión. A partir de aquí el cliente ya puede usar la dirección.' },
];
const MENSAJES = DORA.map((m) => m.n);
const QUIEN = ['El cliente', 'El servidor'];
const ESTADOS = ['Sí: la dirección la entregó un servidor DHCP', 'No: es una dirección APIPA que el equipo se asignó solo', 'No: el equipo todavía no tiene ninguna dirección'];
const ORDINAL = ['primer', 'segundo', 'tercer', 'cuarto'];
const cidr4 = (d, p) => aTexto(d) + '/' + p;
definir('dr-dhcp', 'DHCP', {
  crear(rng, nivel) {
    const caso = elegir(rng, nivel <= 2 ? ['mensaje', 'mensaje', 'estado', 'ambito'] : ['mensaje', 'estado', 'ambito', 'ambito']);
    if (caso === 'mensaje') return { caso, n: ent(rng, 0, 3) };
    if (caso === 'estado') {
      return { caso, ip: elegir(rng, [`169.254.${ent(rng, 0, 255)}.${ent(rng, 1, 254)}`, `169.254.${ent(rng, 0, 255)}.${ent(rng, 1, 254)}`,
        `192.168.${ent(rng, 0, 50)}.${ent(rng, 2, 254)}`, `10.${ent(rng, 0, 50)}.${ent(rng, 0, 255)}.${ent(rng, 2, 254)}`, '0.0.0.0']) };
    }
    const p = nivel <= 2 ? 24 : elegir(rng, [24, 25, 26, 27, 23]);
    const base = ip(`192.168.${ent(rng, 0, 100) * 2}.0`);
    return { caso, red: aTexto(red(base, p)), p, excluidas: ent(rng, 1, Math.min(30, hostsUtiles(p) - 5)) };
  },
  resolver(q) {
    if (q.caso === 'mensaje') {
      const m = DORA[q.n];
      return {
        enunciado: `Una computadora se enciende y pide su configuración por DHCP. Del intercambio de cuatro mensajes, fíjate en el **${ORDINAL[q.n]}** mensaje. ¿Cuál es, quién lo envía y a qué puerto UDP va dirigido?`,
        campos: [
          campo('msg', 'Mensaje', 'opcion', q.n, { opciones: MENSAJES }),
          campo('quien', 'Lo envía', 'opcion', m.quien, { opciones: QUIEN }),
          campo('puerto', 'Puerto UDP de destino', 'numero', m.puerto),
        ],
        pistas: [
          'Las iniciales de los cuatro mensajes, en orden, forman la palabra **DORA**.',
          'Los mensajes se alternan: empieza el cliente, contesta el servidor, y otra vez igual.',
          'El servidor escucha en el puerto UDP 67 y el cliente en el 68. Cada mensaje va al puerto de quien lo recibe.',
        ],
        pasos: [
          { t: 'El intercambio DHCP completo se recuerda con la palabra **DORA**:',
            tabla: { cab: ['N.º', 'Mensaje', 'Lo envía', 'Puerto UDP de destino'], filas: DORA.map((x, i) => [String(i + 1), i === q.n ? `**${x.n}**` : x.n, QUIEN[x.quien], String(x.puerto)]) } },
          { t: `El ${ORDINAL[q.n]} mensaje es **${m.n}**. ${m.que}` },
          { t: `Lo envía ${QUIEN[m.quien].toLowerCase()}, así que va dirigido al puerto donde escucha ${m.quien === 0 ? 'el servidor: **67**' : 'el cliente: **68**'}.` },
        ],
      };
    }
    if (q.caso === 'estado') {
      const d = ip(q.ip);
      const r = d === 0 ? 2 : dentro(d, '169.254.0.0', 16) ? 1 : 0;
      return {
        enunciado: `Un usuario no puede navegar. Su computadora está configurada para obtener la dirección **automáticamente** y al revisar su configuración aparece la dirección IPv4 \`${q.ip}\`. ¿Recibió esa dirección de un servidor DHCP?`,
        campos: [campo('r', 'Diagnóstico', 'opcion', r, { opciones: ESTADOS, lista: true })],
        pistas: [
          'Hay un bloque entero que ningún servidor DHCP reparte: lo usa el propio equipo cuando nadie le contesta.',
          'Ese bloque es 169.254.0.0/16. Compara los dos primeros octetos.',
          'La dirección 0.0.0.0 significa «todavía no tengo dirección»: es la que usa el cliente mientras pide una.',
        ],
        pasos: [
          { t: `Se miran los dos primeros octetos de \`${q.ip}\`.` },
          { t: r === 1 ? 'Empieza por **169.254**: pertenece a 169.254.0.0/16, el bloque de direcciones automáticas de enlace local (APIPA). El equipo envió sus mensajes Discover, nadie respondió, y se asignó una dirección de ese bloque por su cuenta.'
            : r === 2 ? 'La dirección `0.0.0.0` no es una dirección asignable: indica que el equipo **aún no tiene ninguna**. Puede que la interfaz esté desconectada o que el proceso DHCP no haya terminado.'
            : 'No empieza por 169.254 y no es 0.0.0.0: es una dirección normal de un rango privado, la que entregaría un servidor DHCP de una red local.' },
          { t: r === 1 ? 'Conclusión: **DHCP falló**. Hay que revisar el cable o el wifi, que el servidor DHCP esté encendido y tenga direcciones libres, y que el equipo esté en la VLAN correcta.'
            : r === 2 ? 'Conclusión: **no hay dirección**. Revisa primero la capa física (cable, wifi, interfaz habilitada) y después renueva la concesión.'
            : 'Conclusión: **DHCP funcionó**. El problema de navegación está en otra parte: puerta de enlace, DNS o la salida a Internet.' },
        ],
      };
    }
    const r = ip(q.red);
    const utiles = hostsUtiles(q.p);
    const libres = utiles - q.excluidas;
    const primera = r + 1 + q.excluidas;
    return {
      enunciado: `Un router Cisco reparte direcciones por DHCP en la red \`${cidr4(r, q.p)}\`. El administrador reservó para equipos con dirección fija las primeras direcciones de la red con el comando \`ip dhcp excluded-address ${aTexto(r + 1)} ${aTexto(r + q.excluidas)}\`. ¿Cuántas direcciones puede entregar el servidor y cuál será la primera que entregue?`,
      campos: [campo('libres', 'Direcciones que puede entregar', 'numero', libres), campo('primera', 'Primera dirección que entrega', 'ip', aTexto(primera))],
      pistas: [
        'Empieza por contar cuántos hosts asignables tiene la red: 2^h − 2.',
        'A ese total réstale las direcciones excluidas. El rango excluido incluye sus dos extremos.',
        'La primera dirección que se entrega es la que va justo después de la última excluida.',
      ],
      pasos: [
        { t: `La red \`${cidr4(r, q.p)}\` (máscara \`${aTexto(mascara(q.p))}\`) tiene 32 − ${q.p} = ${32 - q.p} bits de host: 2^${32 - q.p} − 2 = **${miles(utiles)}** direcciones asignables, de \`${aTexto(r + 1)}\` a \`${aTexto(r + tamano(q.p) - 2)}\`.` },
        { t: `El rango excluido va de \`${aTexto(r + 1)}\` a \`${aTexto(r + q.excluidas)}\`: son **${q.excluidas}** direcciones (se cuentan los dos extremos). El servidor nunca las ofrecerá; quedan para el router, servidores e impresoras con dirección fija.` },
        { t: `Direcciones que puede entregar: ${miles(utiles)} − ${q.excluidas} = **${miles(libres)}**.` },
        { t: `La primera que entrega es la siguiente a la última excluida: \`${aTexto(primera)}\`.` },
      ],
    };
  },
});

/* ------------------------------------------------------------- dr-hex */
const digitos = (v, bits) => hx(v, bits / 4).split('');
const tablaNibbles = (v, bits) => ({ cab: ['Dígito hexadecimal', 'Vale en decimal', 'En binario (4 bits)'],
  filas: digitos(v, bits).map((c) => [c, String(parseInt(c, 16)), bin(parseInt(c, 16), 4)]) });
const grupos4 = (v, bits) => bin(v, bits).match(/.{4}/g).join(' ');
definir('dr-hex', 'Hexadecimal', {
  crear(rng, nivel) {
    const bits = nivel <= 1 ? 8 : elegir(rng, [8, 16, 16]);
    const v = bits === 8 ? elegir(rng, [ent(rng, 10, 255), elegir(rng, [0xff, 0xfe, 0x80, 0xa0, 0x0f, 0xc0, 0xac])]) : elegir(rng, [ent(rng, 0x1000, 0xffff), elegir(rng, [0xfe80, 0x0db8, 0x2001, 0xff02, 0xfd00, 0xacad, 0xfffe])]);
    return { modo: elegir(rng, ['hex-dec', 'dec-hex', 'hex-bin', 'bin-hex']), v, bits };
  },
  resolver({ modo, v, bits }) {
    const n = bits / 4;
    const h = hx(v, n);
    const pesos = Array.from({ length: n }, (_, i) => 16 ** (n - 1 - i));
    const ds = digitos(v, bits).map((c) => parseInt(c, 16));
    const que = bits === 8 ? 'byte' : 'hexteto';
    if (modo === 'hex-dec') {
      return {
        enunciado: `Convierte el ${que} hexadecimal \`${h}\` a decimal.`,
        campos: [campo('dec', 'Decimal', 'numero', v)],
        pistas: [
          'Cada dígito hexadecimal vale de 0 a 15: a = 10, b = 11, c = 12, d = 13, e = 14, f = 15.',
          `Las posiciones, de derecha a izquierda, valen 1, 16, 256 y 4,096. Aquí hay ${n} dígitos.`,
          `Multiplica cada dígito por el peso de su posición y suma. El primer dígito, \`${h[0]}\`, vale ${ds[0]} × ${miles(pesos[0])}.`,
        ],
        pasos: [
          { t: 'Cada dígito se multiplica por el peso de su posición (potencias de 16).',
            tabla: { cab: ['Dígito', 'Vale', 'Peso', 'Dígito × peso'], filas: ds.map((d, i) => [h[i], String(d), miles(pesos[i]), miles(d * pesos[i])]) } },
          { t: `Se suman los productos: ${ds.map((d, i) => miles(d * pesos[i])).join(' + ')} = **${miles(v)}**.` },
        ],
      };
    }
    if (modo === 'dec-hex') {
      let resto = v;
      const filas = pesos.map((w) => { const c = Math.floor(resto / w); const f = [miles(resto), miles(w), String(c), hx(c), miles(resto - c * w)]; resto -= c * w; return f; });
      return {
        enunciado: `Convierte el número decimal **${miles(v)}** a hexadecimal (${n} dígitos).`,
        campos: [campo('hex', `Hexadecimal (${n} dígitos)`, 'hex', h)],
        pistas: [
          `Usa los pesos de ${n} dígitos hexadecimales: ${pesos.map(miles).join(', ')}.`,
          'Para cada peso: ¿cuántas veces cabe en lo que te queda? Ese número (de 0 a 15) es el dígito.',
          'Los dígitos del 10 al 15 se escriben a, b, c, d, e, f.',
        ],
        pasos: [
          { t: 'Se recorre cada peso, de mayor a menor. El número de veces que cabe es el dígito, y lo que sobra pasa al siguiente peso.',
            tabla: { cab: ['Queda', 'Peso', 'Cabe', 'Dígito', 'Sobra'], filas } },
          { t: `Leyendo los dígitos de arriba abajo: **${h}**.` },
        ],
      };
    }
    if (modo === 'hex-bin') {
      return {
        enunciado: `Convierte el ${que} hexadecimal \`${h}\` a binario (${bits} bits).`,
        campos: [campo('bin', `Binario (${bits} bits)`, 'binario', bin(v, bits))],
        pistas: [
          'Cada dígito hexadecimal equivale exactamente a 4 bits. No hace falta pasar por decimal.',
          'Los pesos dentro de cada grupo de 4 bits son 8, 4, 2, 1.',
          `Convierte cada dígito por separado y pega los grupos en el mismo orden. El primero, \`${h[0]}\`, es ${bin(ds[0], 4)}.`,
        ],
        pasos: [
          { t: 'Un dígito hexadecimal son 4 bits. Se convierte cada dígito por su cuenta, con los pesos 8, 4, 2, 1.', tabla: tablaNibbles(v, bits) },
          { t: `Se pegan los grupos en orden: \`${grupos4(v, bits)}\`. Sin espacios: **${bin(v, bits)}**.` },
        ],
      };
    }
    return {
      enunciado: `Convierte el número binario \`${grupos4(v, bits)}\` a hexadecimal (${n} dígitos).`,
      campos: [campo('hex', `Hexadecimal (${n} dígitos)`, 'hex', h)],
      pistas: [
        'Corta el número en grupos de 4 bits empezando por la derecha.',
        'Cada grupo se convierte con los pesos 8, 4, 2, 1 y da un número de 0 a 15.',
        'Del 10 al 15 se escriben a, b, c, d, e, f.',
      ],
      pasos: [
        { t: `Se separa en ${n} grupos de 4 bits y cada grupo se convierte en un dígito.`,
          tabla: { cab: ['Grupo de 4 bits', 'Vale en decimal', 'Dígito hexadecimal'], filas: ds.map((d) => [bin(d, 4), String(d), hx(d)]) } },
        { t: `Dígitos en orden: **${h}**.` },
      ],
    };
  },
});

/* ------------------------------------------------ direcciones de práctica */
const PRIMEROS = [0x2001, 0x2001, 0x2001, 0x2607, 0x2a00, 0x2800, 0xfd00, 0xfe80];
/** Un hexteto distinto de cero, a veces con ceros a la izquierda o a la derecha. */
function hexteto(rng) {
  return elegir(rng, [ent(rng, 0x1000, 0xffff), ent(rng, 0x1000, 0xffff), ent(rng, 1, 0xf), ent(rng, 0x10, 0xff), ent(rng, 0x100, 0xfff), ent(rng, 1, 0xff) << 8, ent(rng, 1, 0xf) << 12, 0xacad, 0xcafe, 0x1]);
}
/** Dirección a partir de una plantilla: 'x' = hexteto con valor, '0' = hexteto en cero. */
function desdePlantilla(rng, plantilla) {
  const g = plantilla.split('').map((c) => (c === 'x' ? hexteto(rng) : 0));
  if (plantilla[0] === 'x') g[0] = elegir(rng, PRIMEROS);
  if (g[0] === 0x2001 && plantilla[1] === 'x') g[1] = 0x0db8;
  if (g[0] === 0xfd00) g[0] = 0xfd00 + ent(rng, 0, 255);
  return g;
}
const FACILES = ['xx00000x', 'xxx0000x', 'xxxx000x', 'x000000x', 'xxxx00xx', 'xx0000xx', 'xxxxx00x', 'xxxx0000', 'xxx00000'];
const MEDIAS = ['xx0x000x', 'xxx0x00x', 'xx00xxxx', 'xxxxxxxx', 'xx0x0x0x', 'x0x0000x', 'xxxx0x00', '0000000x'];
const DIFICILES = ['xx00x00x', 'x00x000x', 'x000x00x', 'xx00xx00', 'x00xx00x', 'xx0x00xx', 'x00x00xx', 'x0x00x00', 'xx000x00'];
const plantillaDe = (rng, nivel) => elegir(rng, nivel <= 3 ? [...FACILES, ...FACILES, ...MEDIAS] : nivel <= 4 ? [...FACILES, ...MEDIAS, ...DIFICILES] : [...MEDIAS, ...DIFICILES, ...DIFICILES]);
/** Todas las rachas de hextetos en cero: [{ i, n }]. */
function rachas(g) {
  const lista = [];
  for (let i = 0; i < 8; i++) {
    if (g[i] !== 0) continue;
    let n = 0;
    while (i + n < 8 && g[i + n] === 0) n++;
    lista.push({ i, n });
    i += n;
  }
  return lista;
}
const posiciones = (r) => (r.n === 1 ? `hexteto ${r.i + 1}` : `hextetos ${r.i + 1} a ${r.i + r.n}`);

/* -------------------------------------------------------- dr-abreviar */
definir('dr-abreviar', 'Abreviar IPv6', {
  crear: (rng, nivel) => ({ ip: larga(desdePlantilla(rng, plantillaDe(rng, nivel))) }),
  resolver(q) {
    const g = ip6(q.ip);
    const todas = rachas(g);
    const r = rachaDeCeros(g);
    const largas = todas.filter((x) => x.n >= 2);
    const empate = r ? largas.filter((x) => x.n === r.n).length > 1 : false;
    const sueltos = todas.filter((x) => x.n === 1);
    let regla2;
    if (!r) {
      regla2 = todas.length
        ? `**Regla 2.** Los hextetos en cero están sueltos (${todas.map(posiciones).join(', ')}): no hay dos seguidos. El \`::\` solo se usa para dos o más hextetos en cero consecutivos, así que aquí **no se usa** y cada cero suelto queda como \`0\`.`
        : '**Regla 2.** No hay ningún hexteto en cero, así que no hay nada que sustituir por `::`.';
    } else {
      regla2 = `**Regla 2.** Se buscan hextetos en cero consecutivos: ${largas.map((x) => `${posiciones(x)} (${x.n} seguidos)`).join('; ')}. `
        + (largas.length === 1 ? 'Esa racha se sustituye por `::`.'
          : empate ? `Hay empate en la más larga, y el \`::\` solo puede aparecer **una vez**: se aplica a la **primera** (${posiciones(r)}). La otra se escribe con sus ceros.`
            : `El \`::\` solo puede aparecer **una vez**, y se aplica a la racha **más larga** (${posiciones(r)}). La otra se escribe con sus ceros.`)
        + (sueltos.length ? ` Un cero suelto (${sueltos.map(posiciones).join(', ')}) nunca se cambia por \`::\`: queda como \`0\`.` : '');
    }
    return {
      enunciado: `Escribe la dirección IPv6 \`${larga(g)}\` en su forma **más corta**.`,
      campos: [campo('ip', 'Dirección abreviada', 'ipv6', corta(g), { forma: 'corta' })],
      pistas: [
        'Regla 1: en cada hexteto se quitan los ceros de la **izquierda** (nunca los de la derecha). Un hexteto `0000` queda como `0`.',
        'Regla 2: una racha de dos o más hextetos en cero seguidos se cambia por `::`, pero solo una vez en toda la dirección.',
        'Si hay varias rachas, el `::` va en la más larga; si empatan, en la primera. Las demás se escriben con `0`.',
      ],
      pasos: [
        { t: `**Regla 1.** Se quitan los ceros a la izquierda de cada hexteto. Los ceros de la derecha no se tocan (\`0a00\` es \`a00\`, no \`a\`).`,
          tabla: { cab: ['Hexteto', ...g.map((_, i) => String(i + 1))], filas: [['Completo', ...g.map((x) => hx(x, 4))], ['Sin ceros a la izquierda', ...g.map((x) => hx(x))]] } },
        { t: `Después de la regla 1: \`${sinCeros(g)}\`.` },
        { t: regla2 },
        { t: `Forma más corta: \`${corta(g)}\`.` },
      ],
    };
  },
});

/* -------------------------------------------------------- dr-expandir */
definir('dr-expandir', 'Expandir IPv6', {
  crear: (rng, nivel) => ({ ip: corta(desdePlantilla(rng, plantillaDe(rng, nivel))) }),
  resolver(q) {
    const g = ip6(q.ip);
    const texto = corta(g);
    const doble = texto.includes('::');
    const escritos = texto.split(':').filter((x) => x !== '').length;
    const faltan = 8 - escritos;
    return {
      enunciado: `Escribe la dirección IPv6 \`${texto}\` en su forma **completa**: los 8 hextetos, cada uno con 4 dígitos.`,
      campos: [campo('ip', 'Dirección completa', 'ipv6', larga(g), { forma: 'larga' })],
      pistas: [
        'Una dirección IPv6 completa tiene siempre 8 hextetos. Cuenta cuántos hay escritos.',
        'El `::` representa todos los hextetos en cero que faltan para llegar a 8.',
        'Al final, rellena cada hexteto con ceros a la **izquierda** hasta que tenga 4 dígitos.',
      ],
      pasos: [
        { t: doble
          ? `La dirección tiene escritos **${escritos}** hextetos. Una dirección completa tiene 8, así que el \`::\` sustituye a 8 − ${escritos} = **${faltan}** hexteto${faltan === 1 ? '' : 's'} en cero.`
          : 'La dirección no tiene `::` y ya muestra sus 8 hextetos: no falta ninguno. Solo hay que devolver los ceros a la izquierda.' },
        ...(doble ? [{ t: `Se escribe${faltan === 1 ? '' : 'n'} ${faltan === 1 ? 'ese cero' : 'esos ceros'} en el lugar del \`::\`: \`${sinCeros(g)}\`.` }] : []),
        { t: 'Cada hexteto se completa con ceros a la izquierda hasta tener 4 dígitos.',
          tabla: { cab: ['Hexteto', ...g.map((_, i) => String(i + 1))], filas: [['Abreviado', ...g.map((x) => hx(x))], ['Con 4 dígitos', ...g.map((x) => hx(x, 4))]] } },
        { t: `Forma completa: \`${larga(g)}\`.` },
      ],
    };
  },
});

/* ----------------------------------------------------------- dr-tipo6 */
const TIPOS6 = ['Unicast global', 'Link-local', 'Única local', 'Multicast', 'Loopback', 'Sin especificar'];
const CLAVE6 = { global: 0, documentacion: 0, 'link-local': 1, 'unica-local': 2, multicast: 3, loopback: 4, 'sin-especificar': 5 };
const RANGOS6 = [
  ['Unicast global', '2000::/3', '2 o 3', 'Pública: única en Internet y enrutable.'],
  ['Link-local', 'fe80::/10', 'fe80 a febf', 'Solo vale dentro del enlace; los routers no la reenvían.'],
  ['Única local', 'fc00::/7', 'fc o fd', 'Privada: para redes internas, no sale a Internet.'],
  ['Multicast', 'ff00::/8', 'ff', 'Identifica a un grupo de equipos.'],
  ['Loopback', '::1', 'todo ceros y un 1 final', 'El propio equipo.'],
  ['Sin especificar', '::', 'todo ceros', 'Significa «todavía no tengo dirección».'],
];
definir('dr-tipo6', 'Tipo de dirección IPv6', {
  crear(rng, nivel) {
    const cola = () => [hexteto(rng), hexteto(rng), hexteto(rng), hexteto(rng)];
    const dificil = nivel >= 5;
    const g = elegir(rng, [
      [elegir(rng, [0x2001, 0x2607, 0x2a00, 0x2800, 0x2400]), ent(rng, 1, 0xffff), ent(rng, 0, 0xffff), ent(rng, 0, 0xff), ...cola()],
      [dificil ? elegir(rng, [0x2000, 0x3fff, 0x3001, 0x2c0f]) : 0x2001, 0x0db8, ent(rng, 0, 0xffff), ent(rng, 0, 0xff), 0, 0, 0, ent(rng, 1, 0xff)],
      [dificil ? ent(rng, 0xfe80, 0xfebf) : 0xfe80, 0, 0, 0, ...cola()],
      [0xfe80, 0, 0, 0, 0, 0, 0, ent(rng, 1, 0xff)],
      [0xfd00 + ent(rng, 0, 255), ent(rng, 0, 0xffff), ent(rng, 0, 0xffff), ent(rng, 0, 0xff), 0, 0, 0, ent(rng, 1, 0xffff)],
      [dificil ? 0xfc00 + ent(rng, 0, 255) : 0xfd00, ent(rng, 1, 0xffff), 0, ent(rng, 0, 0xff), ...cola()],
      [elegir(rng, [0xff02, 0xff02, 0xff05, 0xff0e, 0xff01]), 0, 0, 0, 0, 0, 0, elegir(rng, [1, 2, 5, 0xfb])],
      [0xff02, 0, 0, 0, 0, 1, 0xff00 + ent(rng, 0, 255), ent(rng, 0, 0xffff)],
      [0, 0, 0, 0, 0, 0, 0, 1], [0, 0, 0, 0, 0, 0, 0, 0],
    ]);
    return { ip: rng() < 0.3 ? larga(g) : corta(g) };
  },
  resolver(q) {
    const g = ip6(q.ip);
    const t = tipo6(g);
    if (!(t in CLAVE6)) throw new Error('dr-tipo6: dirección fuera de los tipos del curso: ' + q.ip);
    const r = CLAVE6[t];
    const primero = hx(g[0], 4);
    const detalle = {
      global: `El primer hexteto es \`${primero}\`: empieza por ${primero[0]}, así que sus tres primeros bits son \`001\` y cae en \`2000::/3\`. Es una dirección **unicast global**, el equivalente a una IPv4 pública.`,
      documentacion: `El primer hexteto es \`${primero}\`: empieza por 2, así que cae en \`2000::/3\` y tiene formato de **unicast global**. Además pertenece a \`2001:db8::/32\`, el bloque reservado para ejemplos y documentación: por eso es el que verás en libros y exámenes.`,
      'link-local': `El primer hexteto es \`${primero}\`, que está entre \`fe80\` y \`febf\`: sus diez primeros bits son \`1111 1110 10\`. Es **link-local**: toda interfaz con IPv6 tiene una, y solo sirve para hablar con vecinos del mismo enlace.`,
      'unica-local': `El primer hexteto es \`${primero}\`: empieza por \`${primero.slice(0, 2)}\`, dentro de \`fc00::/7\` (que abarca fc y fd). Es **única local**, el equivalente a una IPv4 privada.`,
      multicast: `El primer hexteto es \`${primero}\`: empieza por \`ff\`, dentro de \`ff00::/8\`. Es **multicast**: un grupo de equipos. ${g[0] === 0xff02 && g[7] === 1 && g.slice(1, 7).every((x) => x === 0) ? '`ff02::1` es el grupo de todos los nodos del enlace: lo más parecido al broadcast de IPv4.' : g[0] === 0xff02 && g[7] === 2 && g.slice(1, 7).every((x) => x === 0) ? '`ff02::2` es el grupo de todos los routers del enlace.' : 'En IPv6 no existe el broadcast: su trabajo lo hace el multicast.'}`,
      loopback: 'Son 127 bits en cero y un 1 al final: `::1`. Es la dirección de **loopback**, la del propio equipo, igual que 127.0.0.1 en IPv4.',
      'sin-especificar': 'Los 128 bits están en cero: `::`. Es la dirección **sin especificar**: la usa como origen un equipo que todavía no tiene dirección, y nunca puede ser destino.',
    }[t];
    return {
      enunciado: `¿Qué tipo de dirección IPv6 es \`${q.ip}\`?`,
      campos: [campo('tipo', 'Tipo de dirección', 'opcion', r, { opciones: TIPOS6, lista: true })],
      pistas: [
        'El tipo se reconoce por el principio de la dirección: basta con el primer hexteto.',
        'Las que empiezan por 2 o 3 son globales; por fe80, link-local; por fc o fd, únicas locales; por ff, multicast.',
        'Dos casos especiales no tienen prefijo: `::1` (loopback) y `::` (sin especificar).',
      ],
      pasos: [
        { t: `Forma completa: \`${larga(g)}\`. El tipo lo decide el comienzo de la dirección.`,
          tabla: { cab: ['Tipo', 'Bloque', 'Empieza por', 'Para qué sirve'], filas: RANGOS6.map((f, i) => (i === r ? f.map((c) => `**${c}**`) : f)) } },
        { t: detalle },
      ],
    };
  },
});

/* -------------------------------------------------------- dr-prefijo6 */
definir('dr-prefijo6', 'Prefijo de red IPv6', {
  crear(rng, nivel) {
    const p = nivel <= 4 ? elegir(rng, nivel <= 3 ? [64, 64, 48, 32] : [64, 48, 56, 56, 60, 52, 32, 40])
      : elegir(rng, nivel === 5 ? [56, 60, 52, 44, 36, 40] : [50, 54, 58, 62, 57, 61, 52, 60, 46, 35]);
    const g = [elegir(rng, [0x2001, 0x2001, 0x2607, 0x2a00, 0xfd00 + ent(rng, 0, 255)]), ent(rng, 0x100, 0xffff), ent(rng, 0x1000, 0xffff), ent(rng, 0x1111, 0xffff),
      ...elegir(rng, [[hexteto(rng), hexteto(rng), hexteto(rng), hexteto(rng)], [0, 0, 0, ent(rng, 1, 0xffff)], [ent(rng, 0x200, 0xfeff), ent(rng, 0, 255) << 8 | 0xff, 0xfe00 | ent(rng, 0, 255), ent(rng, 1, 0xffff)]])];
    if (g[0] === 0x2001) g[1] = 0x0db8;
    return { ip: corta(g), p };
  },
  resolver(q) {
    const g = ip6(q.ip);
    const p = q.p;
    const r = prefijo6(g, p);
    const k = Math.floor(p / 16);          // hextetos completos de red
    const resto = p % 16;                  // bits de red dentro del hexteto k
    const valor = `${corta(r)}/${p}`;
    const pasos = [{ t: `Se escribe la dirección completa para ver los 8 hextetos: \`${larga(g)}\`. Cada hexteto son 16 bits y cada dígito hexadecimal, 4 bits.` }];
    if (resto === 0) {
      pasos.push({ t: `**/${p}** significa que los primeros ${p} bits son de red: ${p} ÷ 16 = **${k}** hextetos completos. El corte cae justo entre dos hextetos.` });
      pasos.push({ t: `Se copian los ${k} primeros hextetos (\`${g.slice(0, k).map((x) => hx(x, 4)).join(':')}\`) y los ${8 - k} restantes se ponen en cero.` });
    } else {
      const h = hx(g[k], 4);
      const hr = hx(r[k], 4);
      pasos.push({ t: `**/${p}**: ${p} ÷ 16 = ${k} hextetos completos (${k * 16} bits) y sobran **${resto}** bits, que caen dentro del hexteto ${k + 1}: \`${h}\`. El corte está en medio de ese hexteto.` });
      if (resto % 4 === 0) {
        pasos.push({ t: `Como cada dígito hexadecimal son 4 bits, ${resto} bits son **${resto / 4}** dígito${resto === 4 ? '' : 's'}. De \`${h}\` se conserva${resto === 4 ? '' : 'n'} ${resto === 4 ? 'el primer dígito' : `los ${resto / 4} primeros dígitos`} y el resto pasa a cero: \`${h}\` → \`${hr}\`.` });
      } else {
        const j = Math.floor(resto / 4);
        const b = resto % 4;
        const dig = parseInt(h[j], 16);
        const nuevo = parseInt(hr[j], 16);
        pasos.push({ t: `${resto} bits son ${j} dígito${j === 1 ? '' : 's'} completo${j === 1 ? '' : 's'} (${j * 4} bits) y **${b}** bit${b === 1 ? '' : 's'} más: el corte parte un dígito por la mitad, el \`${h[j]}\`. Hay que pasarlo a binario.`,
          tabla: { cab: ['', 'Hexadecimal', 'Binario', 'Qué pasa'], filas: [
            ['Dígito original', h[j], bin(dig, 4), `los ${b} primeros bits son de red`],
            ['Dígito del prefijo', hr[j], bin(nuevo, 4), `se conserva${b === 1 ? '' : 'n'} ${b === 1 ? 'ese bit' : `esos ${b} bits`} y los demás pasan a 0`]] } });
        pasos.push({ t: `El hexteto ${k + 1} queda así: ${j ? `se copia${j === 1 ? '' : 'n'} \`${h.slice(0, j)}\`, ` : ''}el dígito partido pasa de \`${h[j]}\` a \`${hr[j]}\` y los dígitos siguientes son 0: \`${h}\` → \`${hr}\`.` });
      }
      pasos.push({ t: `Se copian los ${k} hextetos anteriores, se escribe \`${hr}\` y los ${7 - k} hextetos que siguen se ponen en cero.` });
    }
    pasos.push({ t: `Prefijo completo: \`${larga(r)}\`. Abreviado y con su longitud: \`${valor}\`. Quedan 128 − ${p} = **${128 - p}** bits para ${p === 64 ? 'el ID de interfaz' : 'subredes e interfaces'}.` });
    return {
      enunciado: `Un equipo tiene la dirección \`${q.ip}/${p}\`. ¿A qué red (prefijo) pertenece? Escríbela con su longitud, por ejemplo \`2001:db8:1::/64\`.`,
      campos: [campo('red', 'Prefijo de red', 'red6', valor), campo('resto', 'Bits que quedan fuera del prefijo', 'numero', 128 - p)],
      pistas: [
        'El número tras la barra dice cuántos bits, contados desde la izquierda, son de red. Cada hexteto aporta 16.',
        resto === 0 ? `${p} ÷ 16 = ${k}: son ${k} hextetos completos. Cópialos y pon el resto en cero.` : `${p} ÷ 16 = ${k} hextetos completos y sobran ${resto} bits. Cada dígito hexadecimal son 4 bits.`,
        'Los bits que no son de red se ponen en cero y el final se abrevia con `::`.',
      ],
      pasos,
    };
  },
});

/* ------------------------------------------------------- dr-subredes6 */
definir('dr-subredes6', 'Subredes IPv6', {
  crear(rng, nivel) {
    const [p0, p1] = elegir(rng, nivel <= 5 ? [[48, 64], [48, 64], [56, 64], [60, 64], [52, 64]] : [[48, 64], [56, 64], [52, 64], [60, 64], [32, 48], [32, 64], [48, 56], [44, 64], [40, 48]]);
    const g = prefijo6([0x2001, 0x0db8, ent(rng, 1, 0xffff), ent(rng, 0, 0xffff), 0, 0, 0, 0], p0);
    const q = { base: corta(g), p0, p1 };
    if (p0 >= 48 && p1 === 64 && (nivel >= 6 || rng() < 0.6)) q.n = ent(rng, 1, 2 ** (64 - p0) - 1);
    return q;
  },
  resolver(q) {
    const g = prefijo6(ip6(q.base), q.p0);
    const s = q.p1 - q.p0;
    const total = 2 ** s;
    const conN = q.n !== undefined;
    const campos = [campo('bits', 'Bits de subred', 'numero', s), campo('total', `Subredes /${q.p1}`, 'numero', total)];
    const pasos = [
      { t: `El bloque recibido es \`${corta(g)}/${q.p0}\` y las subredes serán **/${q.p1}**. Los bits que hay entre un prefijo y el otro son los bits de subred: ${q.p1} − ${q.p0} = **${s}**.` },
      { t: `Con ${s} bits se pueden formar 2^${s} = **${miles(total)}** subredes /${q.p1}. A diferencia de IPv4, en IPv6 no se resta nada: todas las subredes se pueden usar.` },
    ];
    if (conN) {
      const sub = [...g];
      sub[3] = g[3] | q.n;
      const digs = s / 4;
      campos.push(campo('sub', `Subred número ${miles(q.n)}`, 'red6', `${corta(sub)}/64`));
      pasos.push({ t: `Los ${s} bits de subred son ${Number.isInteger(digs) ? `los últimos **${digs}** dígito${digs === 1 ? '' : 's'} hexadecimal${digs === 1 ? '' : 'es'}` : `los últimos ${s} bits`} del cuarto hexteto, que en el bloque vale \`${hx(g[3], 4)}\`. La primera subred (la número 0) deja esos bits en cero.` });
      pasos.push({ t: `El número de subred se pasa a hexadecimal: ${miles(q.n)} en decimal = \`${hx(q.n)}\`. Se coloca en los bits de subred: \`${hx(g[3], 4)}\` → \`${hx(sub[3], 4)}\`.` });
      pasos.push({ t: `Subred número ${miles(q.n)}: \`${corta(sub)}/64\`. Sus equipos usan los 64 bits restantes como ID de interfaz.` });
    }
    return {
      enunciado: `Una organización recibe el bloque \`${corta(g)}/${q.p0}\` y lo divide en subredes **/${q.p1}**. ¿Cuántos bits usa para numerar las subredes y cuántas subredes obtiene?`
        + (conN ? ` Si la primera subred es la número 0, ¿cuál es la subred número **${miles(q.n)}**?` : ''),
      campos,
      pistas: [
        'Los bits de subred son los que hay entre el prefijo que te dan y el prefijo de las subredes: se restan.',
        'Con s bits de subred salen 2^s subredes. En IPv6 no se resta ninguna.',
        conN ? 'Convierte el número de subred a hexadecimal y colócalo en los últimos dígitos del cuarto hexteto.' : 'Potencias útiles: 2^4 = 16, 2^8 = 256, 2^12 = 4,096, 2^16 = 65,536.',
      ],
      pasos,
    };
  },
});

/* ----------------------------------------------------------- dr-eui64 */
definir('dr-eui64', 'ID de interfaz EUI-64', {
  crear(rng) {
    const bytes = [elegir(rng, [0x00, 0x00, 0x02, 0x08, 0x1c, 0x3c, 0x58, 0x70, 0xa4, 0xb8, 0xd4, 0xf0, 0xfc, 0x0a, 0x06]), ...Array.from({ length: 5 }, () => ent(rng, 0, 255))];
    const prefijo = elegir(rng, ['fe80::', 'fe80::', `2001:db8:${hx(ent(rng, 1, 0xffff))}:${hx(ent(rng, 1, 0xff))}::`, `2001:db8:acad:${hx(ent(rng, 1, 0xff))}::`, `fd${hx(ent(rng, 0, 255), 2)}:${hx(ent(rng, 1, 0xffff))}:${hx(ent(rng, 1, 0xffff))}:${hx(ent(rng, 1, 0xff))}::`]);
    return { mac: macTexto(bytes, elegir(rng, [':', '-', '.'])), prefijo };
  },
  resolver(q) {
    const b = mac(q.mac);
    if (!b) throw new Error('dr-eui64: MAC no válida: ' + q.mac);
    const pre = ip6(q.prefijo);
    const id = eui64(b);
    const completa = [...pre.slice(0, 4), ...id];
    const nuevo = b[0] ^ 0x02;
    const h2 = (x) => hx(x, 2);
    const estaba = (b[0] & 0x02) !== 0;
    return {
      enunciado: `Una interfaz tiene la dirección MAC \`${q.mac}\` y genera su ID de interfaz con el método **EUI-64**. El prefijo de la red es \`${corta(pre)}/64\`. Calcula el primer byte ya modificado, el ID de interfaz y la dirección IPv6 completa.`,
      campos: [
        campo('byte', 'Primer byte tras invertir el 7.º bit (hex)', 'hex', h2(nuevo)),
        campo('id', 'ID de interfaz (4 hextetos)', 'texto', id.map((x) => hx(x)).join(':'), { acepta: [id.map((x) => hx(x, 4)).join(':')] }),
        campo('ip', 'Dirección IPv6 completa', 'ipv6', corta(completa)),
      ],
      pistas: [
        'Una MAC tiene 48 bits y el ID de interfaz necesita 64. Los 16 que faltan son siempre `fffe`, y van justo en medio.',
        'Después se invierte el séptimo bit del primer byte, el que vale 2: si era 0 pasa a 1 (se suma 2) y si era 1 pasa a 0 (se resta 2).',
        'Agrupa los 8 bytes de dos en dos para formar 4 hextetos y pégalos detrás del prefijo /64.',
      ],
      pasos: [
        { t: `**1. Partir la MAC por la mitad.** La MAC son 6 bytes: \`${b.map(h2).join(' ')}\`. Los tres primeros identifican al fabricante (\`${b.slice(0, 3).map(h2).join(' ')}\`) y los tres últimos, a la tarjeta (\`${b.slice(3).map(h2).join(' ')}\`).` },
        { t: `**2. Insertar \`ff fe\` en medio.** Así se pasa de 48 a 64 bits: \`${b.slice(0, 3).map(h2).join(' ')}\` **\`ff fe\`** \`${b.slice(3).map(h2).join(' ')}\`.` },
        { t: `**3. Invertir el séptimo bit del primer byte.** El primer byte es \`${h2(b[0])}\`. En binario, su séptimo bit (el que vale 2) está en ${estaba ? '1, así que pasa a 0: se restan 2' : '0, así que pasa a 1: se suman 2'}.`,
          tabla: { cab: ['', 'Hexadecimal', 'Binario', 'Séptimo bit'], filas: [['Antes', h2(b[0]), bin(b[0], 8), estaba ? '1' : '0'], ['Después', h2(nuevo), bin(nuevo, 8), estaba ? '0' : '1']] } },
        { t: `**4. Agrupar de dos en dos bytes.** \`${h2(nuevo)}${h2(b[1])}\` : \`${h2(b[2])}ff\` : \`fe${h2(b[3])}\` : \`${h2(b[4])}${h2(b[5])}\`. ID de interfaz: \`${id.map((x) => hx(x, 4)).join(':')}\`.` },
        { t: `**5. Unir prefijo e ID.** El prefijo /64 ocupa los cuatro primeros hextetos y el ID, los cuatro últimos: \`${larga(completa)}\`. Abreviada: \`${corta(completa)}\`.` },
      ],
    };
  },
});

niveles('direccionamiento', [
  { n: 1, nombre: 'Fundamentos', resumen: 'Direcciones públicas, privadas y especiales, y las primeras conversiones a hexadecimal.',
    tipos: [['dr-ambito', 4], ['dr-hex', 2], ['banco', 4]] },
  { n: 2, nombre: 'NAT y DHCP', resumen: 'La tabla de traducciones de PAT, los cuatro mensajes de DHCP y cómo reconocer que falló.',
    tipos: [['dr-nat', 3], ['dr-dhcp', 3], ['dr-ambito', 1], ['banco', 3]] },
  { n: 3, nombre: 'Escribir IPv6', resumen: 'Hexadecimal, abreviar y expandir direcciones con una sola racha de ceros.',
    tipos: [['dr-hex', 2], ['dr-abreviar', 3], ['dr-expandir', 3], ['banco', 3]] },
  { n: 4, nombre: 'Tipos y prefijos', resumen: 'Reconocer cada tipo de dirección IPv6 y obtener su prefijo de red.',
    tipos: [['dr-tipo6', 3], ['dr-prefijo6', 3], ['dr-abreviar', 1], ['dr-expandir', 1], ['banco', 3]] },
  { n: 5, nombre: 'Subredes y EUI-64', resumen: 'Contar y numerar subredes /64, prefijos que cortan un hexteto e ID de interfaz EUI-64.',
    tipos: [['dr-subredes6', 3], ['dr-eui64', 3], ['dr-prefijo6', 2], ['dr-tipo6', 1], ['banco', 3]] },
  { n: 6, nombre: 'Experto', resumen: 'Prefijos que parten un dígito, bloques /32 y /40, PAT con puertos ocupados y direcciones con varias rachas de ceros.',
    tipos: [['dr-prefijo6', 3], ['dr-subredes6', 2], ['dr-eui64', 1], ['dr-nat', 2], ['dr-dhcp', 1], ['dr-abreviar', 1], ['dr-expandir', 1], ['banco', 4]] },
]);
