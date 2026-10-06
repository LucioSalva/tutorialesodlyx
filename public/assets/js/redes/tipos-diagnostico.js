/**
 * Academia de Redes · Tipos de ejercicio de diagnóstico y soporte (dx-*)
 * ---------------------------------------------------------------------
 * Mismo contrato que tipos.js: crear(rng, nivel) → parámetros y
 * resolver(params) → { enunciado, tabla?, codigo?, campos, pistas, pasos }.
 * Las salidas de consola (ipconfig, tracert, show…) se GENERAN a partir de
 * los parámetros y el veredicto se calcula con ip.js: la salida que ve el
 * estudiante y la respuesta correcta no pueden discrepar.
 */
import { definir, campo, ent, elegir, niveles } from './tipos.js';
import { ip, aTexto, mascara, red, broadcast, tamano } from './ip.js';

const cidr = (d, p) => aTexto(d) + '/' + p;
const REMOTAS = ['203.0.113.10', '203.0.113.80', '198.51.100.25', '198.51.100.7', '192.0.2.44', '192.0.2.130'];
const NOMBRES = ['www.example.com', 'intranet.example.com', 'correo.example.net', 'portal.example.org', 'tienda.example.com'];
const LANS = ['192.168.1', '192.168.10', '192.168.20', '10.0.5', '10.10.30', '172.16.8', '172.20.4'];

/* ------------------------------------------------------------ dx-ping */
const PASOS_PING = [
  ['Loopback', (q) => 'ping 127.0.0.1'],
  ['IP propia', (q) => 'ping ' + q.propia],
  ['Puerta de enlace', (q) => 'ping ' + q.gw],
  ['IP remota', (q) => 'ping ' + q.remota],
  ['Nombre', (q) => 'ping ' + q.nombre],
];
const DX_PING = [
  'La pila TCP/IP del propio equipo está dañada o desactivada',
  'La tarjeta de red o la configuración IP del equipo tiene un problema',
  'El problema está en la red local: cable, Wi-Fi, switch, VLAN o la propia puerta de enlace',
  'El problema está más allá de la puerta de enlace: enrutamiento, el proveedor o un firewall',
  'Falla la resolución de nombres (DNS)',
  'La conectividad es correcta: hay que mirar la aplicación o el servicio',
];
const PORQUE_PING = [
  (q) => 'El ping a `127.0.0.1` no sale del equipo: solo comprueba que el software TCP/IP funciona. Si ni siquiera eso responde, el fallo está dentro del propio equipo y no tiene sentido revisar cables ni routers todavía.',
  (q) => `El loopback responde, así que TCP/IP funciona. Pero el equipo no se responde a sí mismo en \`${q.propia}\`: la tarjeta de red está desactivada, su controlador falla o la dirección no está realmente configurada en ella.`,
  (q) => `El equipo se responde a sí mismo, pero no alcanza a su puerta de enlace \`${q.gw}\`, que está en su misma red. Todo lo que hay entre los dos es red local: el cable o el Wi-Fi, el puerto del switch, la VLAN, o el router apagado o con otra dirección.`,
  (q) => `La puerta de enlace \`${q.gw}\` responde: la red local está bien. Lo que falla es llegar a \`${q.remota}\`, que está en otra red. El problema está del router hacia afuera: una ruta que falta, el enlace con el proveedor o un firewall que descarta el tráfico.`,
  (q) => `El ping a la dirección \`${q.remota}\` funciona, así que hay conectividad completa hasta Internet. Solo falla cuando se usa el nombre \`${q.nombre}\`: el equipo no logra traducir el nombre a una dirección. Es un problema de DNS, no de conectividad.`,
  (q) => 'Los cinco pings responden: el equipo, la red local, la salida a otras redes y el DNS funcionan. Si el usuario sigue sin poder trabajar, el problema está más arriba: la aplicación, el servicio, el puerto o las credenciales.',
];
definir('dx-ping', 'La secuencia de pings', {
  crear(rng) {
    const lan = elegir(rng, LANS);
    return { fallo: elegir(rng, [0, 1, 2, 2, 3, 3, 4, 4, 5]), propia: `${lan}.${ent(rng, 20, 200)}`, gw: `${lan}.${elegir(rng, [1, 254])}`, remota: elegir(rng, REMOTAS), nombre: elegir(rng, NOMBRES) };
  },
  resolver(q) {
    const filas = PASOS_PING.map(([nombre, cmd], i) => [String(i + 1), nombre, '`' + cmd(q) + '`', i < q.fallo ? 'Responde' : i === q.fallo ? '**No responde**' : 'No responde']);
    const primero = q.fallo < 5 ? PASOS_PING[q.fallo][0].toLowerCase() : '';
    return {
      enunciado: 'Un usuario dice que «no tiene red». Desde su computadora ejecutas la secuencia clásica de pings, de lo más cercano a lo más lejano, y obtienes estos resultados. ¿Dónde está el problema?',
      tabla: { cab: ['Paso', 'Qué se prueba', 'Comando', 'Resultado'], filas },
      campos: [campo('r', 'Diagnóstico', 'opcion', q.fallo, { opciones: DX_PING, lista: true })],
      pistas: [
        'Cada ping comprueba un tramo más largo que el anterior. Busca el PRIMERO que falla.',
        'Todo lo que respondió antes de ese primer fallo queda descartado como causa.',
        'Loopback = software TCP/IP · IP propia = tarjeta · puerta de enlace = red local · IP remota = enrutamiento · nombre = DNS.',
      ],
      pasos: [
        { t: 'La secuencia va de adentro hacia afuera. Cada paso que responde demuestra que todo lo anterior funciona.', tabla: { cab: ['Si responde…', 'queda demostrado que funciona…'], filas: [
          ['`127.0.0.1`', 'el software TCP/IP del equipo'], ['la IP propia', 'la tarjeta de red y su configuración'], ['la puerta de enlace', 'la red local (cable o Wi-Fi, switch, VLAN)'],
          ['una IP remota', 'el enrutamiento y la salida a otras redes'], ['un nombre', 'la resolución DNS']] } },
        { t: q.fallo < 5 ? `El primer paso que falla es el ${q.fallo + 1} (${primero}). Los ${q.fallo === 0 ? 'siguientes fallan también, pero es consecuencia del primero' : 'anteriores respondieron, así que no son la causa'}.` : 'No falla ningún paso.' },
        { t: PORQUE_PING[q.fallo](q) + ` **Diagnóstico: ${DX_PING[q.fallo].toLowerCase()}.**` },
      ],
    };
  },
});

/* ---------------------------------------------------------- dx-config */
const DX_CONFIG = [
  'La configuración es correcta',
  'El equipo no obtuvo respuesta del servidor DHCP y se autoasignó una dirección APIPA',
  'La dirección IP no es asignable: es la dirección de red o la de broadcast de su subred',
  'Falta la puerta de enlace predeterminada',
  'La puerta de enlace está fuera de la subred del equipo',
  'No hay ningún servidor DNS configurado',
];
/** Veredicto calculado solo con los datos de la salida. */
function veredictoConfig(q) {
  const d = ip(q.ip);
  if (red(d, 16) === ip('169.254.0.0')) return 1;
  if (d === red(d, q.p) || d === broadcast(d, q.p)) return 2;
  if (!q.gw) return 3;
  if (red(ip(q.gw), q.p) !== red(d, q.p)) return 4;
  if (!q.dns) return 5;
  return 0;
}
const linea = (etiqueta, valor) => `   ${(etiqueta + ' ').padEnd(40, '. ').slice(0, 40)}: ${valor}`;
function salidaIpconfig(q) {
  return ['Adaptador de Ethernet Ethernet0:', '',
    linea('Sufijo DNS específico para la conexión', ''),
    linea('DHCP habilitado', q.dhcp ? 'sí' : 'no'),
    ...(veredictoConfig(q) === 1 ? [linea('Configuración automática habilitada', 'sí'), linea('Dirección IPv4 de configuración automática', q.ip)] : [linea('Dirección IPv4', q.ip)]),
    linea('Máscara de subred', aTexto(mascara(q.p))),
    linea('Puerta de enlace predeterminada', q.gw || ''),
    linea('Servidores DNS', q.dns || ''),
  ].join('\n');
}
definir('dx-config', 'Leer la configuración IP', {
  crear(rng, nivel) {
    const p = nivel <= 3 ? elegir(rng, [24, 24, 25, 26]) : elegir(rng, [23, 24, 25, 26, 27, 28]);
    const base = red(ip(`${elegir(rng, ['192.168', '10.10', '172.16', '10.50'])}.${ent(rng, 0, 200)}.0`) + ent(rng, 0, 255), p);
    const host = base + ent(rng, 2, tamano(p) - 3);
    const gw = elegir(rng, [base + 1, base + tamano(p) - 2]);
    const dns = elegir(rng, ['8.8.8.8', '1.1.1.1', aTexto(gw), '9.9.9.9']);
    const caso = elegir(rng, ['ok', 'ok', 'apipa', 'apipa', 'noasignable', 'singw', 'gwfuera', 'gwfuera', 'sindns']);
    const q = { ip: aTexto(host === gw ? host - 1 : host), p, gw: aTexto(gw), dns, dhcp: rng() < 0.6 };
    if (caso === 'apipa') return { ip: `169.254.${ent(rng, 1, 254)}.${ent(rng, 1, 254)}`, p: 16, gw: '', dns: '', dhcp: true };
    if (caso === 'noasignable') return { ...q, ip: aTexto(rng() < 0.5 ? base : base + tamano(p) - 1), dhcp: false };
    if (caso === 'singw') return { ...q, gw: '', dhcp: false };
    if (caso === 'gwfuera') return { ...q, gw: aTexto(rng() < 0.5 ? base + tamano(p) + 1 : base - 2), dhcp: false };
    if (caso === 'sindns') return { ...q, dns: '', dhcp: false };
    return q;
  },
  resolver(q) {
    const d = ip(q.ip);
    const r = veredictoConfig(q);
    const laRed = red(d, q.p);
    const bc = broadcast(d, q.p);
    const rango = `\`${aTexto(laRed + 1)}\` – \`${aTexto(bc - 1)}\``;
    const final = [
      'Los cuatro datos son coherentes: la dirección es asignable, la puerta de enlace pertenece a la misma subred y hay un servidor DNS.',
      'Las direcciones `169.254.x.x` (APIPA) no las reparte nadie: Windows se las pone a sí mismo cuando pide una dirección por DHCP y no recibe respuesta. Por eso tampoco hay puerta de enlace ni DNS. El equipo solo podría hablar con otros equipos en la misma situación. Hay que averiguar por qué no llega al servidor DHCP: cable, VLAN del puerto, servidor caído o rango agotado.',
      `La dirección \`${q.ip}\` es ${d === laRed ? 'la dirección de **red**' : 'la dirección de **broadcast**'} de \`${cidr(laRed, q.p)}\`. Esas dos direcciones están reservadas y no se pueden poner en un equipo: hay que elegir una del rango ${rango}.`,
      'La línea de la puerta de enlace está vacía. El equipo puede hablar con los de su propia subred, pero no sabe a quién entregar los paquetes que van a otras redes: no tendrá Internet ni acceso a otras sedes.',
      `La puerta de enlace \`${q.gw}\` no pertenece a \`${cidr(laRed, q.p)}\` (rango ${rango}). Un equipo solo puede entregar tramas directamente a direcciones de su propia subred, así que nunca alcanzará esa puerta de enlace: funciona la red local y falla todo lo demás.`,
      'La línea de servidores DNS está vacía. Habrá conectividad por dirección IP (un ping a `8.8.8.8` responde), pero ningún nombre se podrá traducir: los navegadores y casi todas las aplicaciones fallarán.',
    ][r];
    return {
      enunciado: 'Un usuario reporta problemas de red. Ejecutas `ipconfig /all` en su equipo y obtienes esta salida (resumida). Calcula a qué red pertenece el equipo y decide qué problema tiene la configuración, si tiene alguno.',
      codigo: salidaIpconfig(q),
      campos: [campo('red', 'Red del equipo (dirección/prefijo)', 'red', cidr(laRed, q.p)), campo('r', 'Diagnóstico', 'opcion', r, { opciones: DX_CONFIG, lista: true })],
      pistas: [
        'Empieza por la dirección IPv4: ¿empieza por 169.254? Luego convierte la máscara en prefijo y calcula la red.',
        'Con la red calculada, comprueba dos cosas: que la IP no sea ni la de red ni la de broadcast, y que la puerta de enlace caiga dentro del mismo rango.',
        'Si todo lo anterior cuadra, mira si las líneas de puerta de enlace y de DNS tienen valor.',
      ],
      pasos: [
        { t: `La máscara \`${aTexto(mascara(q.p))}\` equivale a **/${q.p}**. Aplicada a \`${q.ip}\`, la red es \`${cidr(laRed, q.p)}\`: va de \`${aTexto(laRed)}\` (red) a \`${aTexto(bc)}\` (broadcast), con el rango asignable ${rango}.`,
          bits: [{ et: 'IP', ip: q.ip, p: q.p }, { et: 'Máscara', ip: aTexto(mascara(q.p)), p: q.p }] },
        { t: 'Se revisa en orden: ¿es APIPA? → ¿la IP es asignable? → ¿hay puerta de enlace y está en la misma subred? → ¿hay DNS?', tabla: { cab: ['Comprobación', 'Resultado'], filas: [
          ['¿Empieza por 169.254?', r === 1 ? '**Sí**' : 'No'],
          ['¿La IP es la de red o la de broadcast?', r === 2 ? '**Sí**' : 'No'],
          ['Puerta de enlace', !q.gw ? (r === 3 ? '**Vacía**' : 'Vacía') : red(ip(q.gw), q.p) === laRed ? `${q.gw}: dentro de la subred` : `**${q.gw}: fuera de la subred**`],
          ['Servidor DNS', q.dns ? q.dns : (r === 5 ? '**Vacío**' : 'Vacío')]] } },
        { t: final + ` **Diagnóstico: ${DX_CONFIG[r].toLowerCase()}.**` },
      ],
    };
  },
});

/* ------------------------------------------------------ dx-traceroute */
const DX_TRAZA = [
  'La ruta está completa: el paquete llega al destino sin problemas',
  'Un router intermedio no responde a los mensajes ICMP, pero la ruta funciona',
  'El paquete se pierde a mitad de camino: hay un corte o un filtro después del último salto que responde',
  'Hay un bucle de enrutamiento: dos routers se devuelven el paquete entre sí',
];
const ms = (n) => (String(n) + ' ms').padStart(6, ' ');
const SIN = '    *   ';
function salidaTraza(q) {
  const lineas = [`Traza a la dirección ${q.destino} sobre un máximo de 30 saltos`, ''];
  const resp = (n, dir, t) => `${String(n).padStart(3, ' ')}  ${ms(t)}  ${ms(t + 1)}  ${ms(t)}  ${dir}`;
  const mudo = (n) => `${String(n).padStart(3, ' ')}  ${SIN}${SIN}${SIN} Tiempo de espera agotado para esta solicitud.`;
  const n = q.saltos.length;
  if (q.caso === 'bucle') {
    q.saltos.slice(0, q.k).forEach((d, i) => lineas.push(resp(i + 1, d, 1 + i * 7)));
    const [a, b] = [q.saltos[q.k - 1], q.saltos[q.k]];
    for (let i = q.k; i < q.k + 6; i++) lineas.push(resp(i + 1, (i - q.k) % 2 === 0 ? b : a, 1 + i * 7));
    lineas.push('  (la lista sigue igual hasta el salto 30)');
    return lineas.join('\n');
  }
  if (q.caso === 'corte') {
    q.saltos.slice(0, q.k).forEach((d, i) => lineas.push(resp(i + 1, d, 1 + i * 7)));
    for (let i = q.k; i < q.k + 4; i++) lineas.push(mudo(i + 1));
    lineas.push('  (sigue igual hasta el salto 30)');
    return lineas.join('\n');
  }
  q.saltos.forEach((d, i) => lineas.push(q.caso === 'silencioso' && i === q.k - 1 ? mudo(i + 1) : resp(i + 1, d, 1 + i * 7)));
  lineas.push(resp(n + 1, q.destino, 1 + n * 7), '', 'Traza completa.');
  return lineas.join('\n');
}
definir('dx-traceroute', 'Leer un traceroute', {
  crear(rng) {
    const lan = elegir(rng, LANS);
    const n = ent(rng, 4, 6);
    const medio = ['10.255.0.1', '100.64.12.1', '198.51.100.1', '198.51.100.129', '192.0.2.1', '192.0.2.65', '203.0.113.1'].sort(() => rng() - 0.5).slice(0, n - 1);
    const caso = elegir(rng, ['ok', 'silencioso', 'silencioso', 'corte', 'corte', 'bucle']);
    return { caso, destino: elegir(rng, ['203.0.113.80', '203.0.113.200', '192.0.2.200', '198.51.100.77']), saltos: [`${lan}.1`, ...medio], k: caso === 'ok' ? 0 : ent(rng, 2, n - 1) };
  },
  resolver(q) {
    const r = ['ok', 'silencioso', 'corte', 'bucle'].indexOf(q.caso);
    const llega = r <= 1 ? 0 : 1;
    const n = q.saltos.length;
    const detalle = [
      `Todas las líneas muestran tiempos y una dirección, y la última línea (salto ${n + 1}) es el propio destino, \`${q.destino}\`. Además aparece «Traza completa». No hay nada que arreglar en la ruta.`,
      `El salto ${q.k} muestra tres asteriscos, pero los saltos siguientes SÍ responden y la última línea es el destino. Si el paquete se perdiera en el salto ${q.k}, no habría respuestas después. Lo que pasa es que ese router reenvía los paquetes con normalidad, pero está configurado para no contestar mensajes ICMP (o un firewall los filtra). Es muy habitual y no es una avería.`,
      `Responden los saltos 1 a ${q.k}; a partir del ${q.k + 1} solo hay asteriscos y el destino nunca aparece. El último router que contesta es \`${q.saltos[q.k - 1]}\`: el paquete llega hasta él y se pierde justo después. Hay que revisar ese router (¿tiene ruta hacia el destino?), el enlace que sale de él o un firewall situado a continuación.`,
      `A partir del salto ${q.k} se repiten una y otra vez las mismas dos direcciones, \`${q.saltos[q.k - 1]}\` y \`${q.saltos[q.k]}\`. Cada router cree que el camino al destino pasa por el otro y se devuelven el paquete hasta que el TTL llega a 0. Es un bucle de enrutamiento: hay que corregir las rutas de esos dos routers.`,
    ][r];
    return {
      enunciado: `Desde una computadora con Windows ejecutas \`tracert -d ${q.destino}\` y obtienes esta salida. ¿Qué indica? ¿Llegó el paquete a su destino?`,
      codigo: salidaTraza(q),
      campos: [campo('r', 'Qué indica la traza', 'opcion', r, { opciones: DX_TRAZA, lista: true }), campo('llega', '¿Llega al destino?', 'opcion', llega, { opciones: ['Sí', 'No'] })],
      pistas: [
        'Mira primero la última línea: ¿es la dirección del destino o no?',
        'Tres asteriscos en una línea solo significan que ESE salto no contestó. Lo importante es si hay respuestas después.',
        'Asteriscos hasta el final = el paquete se pierde. Las mismas direcciones repitiéndose = bucle.',
      ],
      pasos: [
        { t: 'Cada línea es un router del camino (un salto). Los tres tiempos son tres intentos, y la dirección de la derecha es la del router que contestó. Tres asteriscos significan que nadie contestó en ese salto dentro del tiempo de espera.' },
        { t: detalle },
        { t: `**${DX_TRAZA[r]}.** ¿Llega al destino? **${llega === 0 ? 'Sí' : 'No'}**.` },
      ],
    };
  },
});

/* --------------------------------------------------------- dx-comando */
// [sistema, tarea, comando, alternativas aceptadas, explicación]. {D} = destino del ejercicio.
const CMD = {
  'win-ip': ['Windows', 'ver de forma resumida la dirección IP, la máscara y la puerta de enlace de cada adaptador', 'ipconfig', [], '`ipconfig` sin opciones muestra lo básico de cada adaptador: dirección IPv4, máscara y puerta de enlace.'],
  'win-all': ['Windows', 'ver la configuración completa de red, incluidos la dirección MAC, el servidor DHCP y los servidores DNS', 'ipconfig /all', [], 'La opción `/all` añade la dirección física (MAC), si DHCP está habilitado, el servidor DHCP, la concesión y los DNS.'],
  'win-release': ['Windows', 'liberar la dirección que el equipo obtuvo por DHCP', 'ipconfig /release', [], '`/release` devuelve la dirección al servidor DHCP: el adaptador se queda sin IP hasta que pidas otra.'],
  'win-renew': ['Windows', 'pedir de nuevo una dirección al servidor DHCP', 'ipconfig /renew', [], '`/renew` vuelve a solicitar la configuración al servidor DHCP. Suele usarse justo después de `/release`.'],
  'win-flush': ['Windows', 'vaciar la caché de nombres DNS que el equipo tiene guardada', 'ipconfig /flushdns', [], '`/flushdns` borra las traducciones nombre → IP recordadas, para obligar al equipo a preguntar de nuevo al servidor DNS.'],
  'win-ping-t': ['Windows', 'hacer un ping continuo a {D} que no se detenga hasta que pulses Ctrl+C', 'ping -t {D}', ['ping {D} -t'], 'En Windows `ping` envía solo 4 peticiones. Con `-t` sigue hasta que lo detengas: ideal para vigilar un enlace mientras mueves un cable.'],
  'win-ping-n': ['Windows', 'enviar exactamente 10 peticiones de eco a {D}', 'ping -n 10 {D}', ['ping {D} -n 10'], 'En Windows el número de peticiones se indica con `-n`. (En Linux y macOS es `-c`.)'],
  'win-tracert': ['Windows', 'mostrar todos los routers por los que pasa un paquete hasta {D}', 'tracert {D}', [], 'En Windows el comando se llama `tracert`; en Linux y macOS, `traceroute`.'],
  'win-tracert-d': ['Windows', 'trazar la ruta hasta {D} sin que intente traducir cada dirección a un nombre, para que termine más rápido', 'tracert -d {D}', [], 'La opción `-d` evita la consulta inversa de DNS de cada salto: la traza termina mucho antes.'],
  'win-arp': ['Windows', 'ver la tabla ARP: qué dirección MAC corresponde a cada IP de la red local', 'arp -a', [], '`arp -a` lista la caché ARP: las parejas IP–MAC que el equipo ha aprendido en su red local.'],
  'win-nslookup': ['Windows', 'preguntar al servidor DNS qué dirección IP corresponde al nombre {N}', 'nslookup {N}', [], '`nslookup` consulta directamente al servidor DNS y muestra tanto el servidor que respondió como la dirección obtenida.'],
  'lin-ip': ['Linux', 'ver las direcciones IP de todas las interfaces con el comando moderno del paquete iproute2', 'ip addr', ['ip a', 'ip address', 'ip addr show', 'ip address show', 'ip a show'], '`ip addr` (abreviado `ip a`) sustituye al antiguo `ifconfig` en las distribuciones actuales.'],
  'lin-route': ['Linux', 'ver la tabla de rutas del equipo, incluida la ruta por defecto (la puerta de enlace)', 'ip route', ['ip r', 'ip route show', 'ip r show'], '`ip route` muestra las rutas; la línea que empieza por `default via` indica la puerta de enlace.'],
  'lin-ping-c': ['Linux', 'enviar exactamente 4 peticiones de eco a {D} y terminar', 'ping -c 4 {D}', ['ping {D} -c 4', 'ping -c4 {D}'], 'En Linux `ping` no se detiene solo. Con `-c` (count) indicas cuántas peticiones enviar.'],
  'lin-traceroute': ['Linux', 'mostrar todos los routers por los que pasa un paquete hasta {D}', 'traceroute {D}', [], 'En Linux y macOS el comando es `traceroute`; `tracert` es el nombre de Windows.'],
  'lin-neigh': ['Linux', 'ver la tabla de vecinos (el equivalente a la tabla ARP) con el comando `ip`', 'ip neigh', ['ip n', 'ip neighbor', 'ip neighbour', 'ip neigh show', 'ip neighbor show'], '`ip neigh` lista las parejas IP–MAC aprendidas, igual que `arp -a`.'],
  'lin-dig': ['Linux', 'consultar al DNS la dirección de {N} con la herramienta `dig`', 'dig {N}', [], '`dig` es la herramienta de consulta DNS más detallada en Linux y macOS; la respuesta está en la sección ANSWER.'],
  'mac-ifconfig': ['macOS', 'ver la configuración IP de todas las interfaces desde la Terminal', 'ifconfig', [], 'macOS conserva `ifconfig`. La interfaz Wi-Fi o Ethernet principal suele llamarse `en0`.'],
  'mac-traceroute': ['macOS', 'mostrar los routers del camino hasta {D}', 'traceroute {D}', [], 'macOS usa `traceroute`, igual que Linux.'],
};
const CMD_NIVEL = [['win-ip', 'win-all', 'win-ping-t', 'win-tracert', 'lin-ping-c', 'lin-traceroute'], ['win-ip', 'win-ping-t', 'win-ping-n', 'win-tracert', 'win-tracert-d', 'lin-ping-c', 'lin-traceroute', 'mac-traceroute']];
definir('dx-comando', 'Comando de diagnóstico', {
  crear(rng, nivel) {
    const lista = nivel <= 2 ? CMD_NIVEL[nivel - 1] : Object.keys(CMD);
    return { caso: elegir(rng, lista), destino: elegir(rng, [...REMOTAS, '192.168.1.1', '10.0.0.1']), nombre: elegir(rng, NOMBRES) };
  },
  resolver(q) {
    const [so, tarea, comando, acepta, explica] = CMD[q.caso];
    const pon = (t) => t.replaceAll('{D}', q.destino ?? '192.168.1.1').replaceAll('{N}', q.nombre ?? 'www.example.com');
    const cmd = pon(comando);
    const palabras = cmd.split(' ');
    return {
      enunciado: `Estás en una terminal de **${so}**. Escribe el comando para ${pon(tarea)}.`,
      campos: [campo('cmd', `Comando (${so})`, 'texto', cmd, { acepta: acepta.map(pon) })],
      pistas: [
        `Fíjate en el sistema operativo: es ${so}. Varios comandos cambian de nombre o de opciones entre Windows y Linux/macOS.`,
        `El comando empieza por \`${palabras[0]}\`${palabras.length > 1 ? ` y tiene ${palabras.length} partes separadas por espacios` : ' y no lleva opciones'}.`,
        palabras.length > 1 ? `Empieza así: \`${palabras.slice(0, -1).join(' ')}\`…` : `Son ${cmd.length} letras, todas en minúsculas.`,
      ],
      pasos: [{ t: `Comando: \`${cmd}\`` }, { t: pon(explica) }],
    };
  },
});

/* ------------------------------------------------------------ dx-show */
const SHOW = {
  activa: ['la configuración que el dispositivo está usando en este momento (la que está en la RAM)', 'show running-config', '`show running-config` muestra la configuración activa. Los cambios que haces se aplican aquí al instante, pero se pierden al reiniciar si no los guardas.'],
  guardada: ['la configuración guardada en la NVRAM, que es la que se cargará en el próximo arranque', 'show startup-config', '`show startup-config` muestra la copia guardada. Si difiere de la activa, hay cambios sin guardar.'],
  version: ['la versión de IOS, el modelo, el tiempo que lleva encendido y la cantidad de memoria', 'show version', '`show version` resume el software y el hardware: versión de IOS, tiempo encendido (uptime), motivo del último reinicio, memoria e interfaces.'],
  brief: ['una tabla resumida con cada interfaz, su dirección IP y si está activa o caída', 'show ip interface brief', '`show ip interface brief` da una línea por interfaz con su IP y las columnas Status (capa 1) y Protocol (capa 2). Es el primer comando de casi cualquier diagnóstico.'],
  rutas: ['la tabla de enrutamiento: las redes que el router conoce y por dónde se llega a cada una', 'show ip route', '`show ip route` lista las rutas. La letra inicial indica su origen: C conectada, L local, S estática, y S* la ruta por defecto.'],
  mac: ['qué direcciones MAC ha aprendido el switch y por qué puerto se alcanza cada una', 'show mac address-table', '`show mac address-table` muestra la tabla con la que el switch decide por qué puerto reenviar cada trama.'],
  cdp: ['qué otros dispositivos Cisco están conectados directamente y por qué puerto', 'show cdp neighbors', '`show cdp neighbors` lista los vecinos Cisco: su nombre, tu puerto local, su modelo y su puerto. Sirve para dibujar o comprobar el diagrama de la red.'],
  cdpdet: ['la dirección IP y la versión de IOS de los dispositivos Cisco vecinos', 'show cdp neighbors detail', 'Añadiendo `detail` se obtienen además la dirección IP de gestión y la versión de software de cada vecino.'],
  inventario: ['el número de serie y el identificador de producto (PID) del equipo y de sus módulos, para abrir un caso de garantía', 'show inventory', '`show inventory` lista el chasis y cada módulo o transceptor con su PID y su número de serie (SN).'],
  estado: ['una tabla de todos los puertos del switch con su estado, VLAN, dúplex y velocidad', 'show interfaces status', '`show interfaces status` da una línea por puerto: connected o notconnect, VLAN, dúplex, velocidad y tipo.'],
  interfaz: ['los contadores de errores, la velocidad y el dúplex de la interfaz {I}', 'show interfaces {I}', '`show interfaces` seguido del nombre muestra todo el detalle de una interfaz: estado, MAC, dúplex, velocidad y contadores de errores.'],
  pila: ['los miembros de una pila (stack) de switches, cuál es el activo y el estado de cada uno', 'show switch', '`show switch` lista los switches apilados con su número, función (Active, Standby, Member), prioridad y estado.'],
  vlan: ['la lista de VLAN con sus nombres y los puertos de acceso de cada una', 'show vlan brief', '`show vlan brief` lista cada VLAN con su nombre, estado y puertos de acceso.'],
};
const IFACES = ['g0/1', 'g0/2', 'g0/0', 'f0/5', 'f0/12', 'g1/0/3'];
definir('dx-show', 'Comando show', {
  crear: (rng) => ({ caso: elegir(rng, Object.keys(SHOW)), iface: elegir(rng, IFACES) }),
  resolver(q) {
    const [que, comando, explica] = SHOW[q.caso];
    const iface = q.iface ?? 'g0/1';
    const cmd = comando.replace('{I}', iface);
    const palabras = cmd.split(' ');
    return {
      enunciado: `Estás conectado a un dispositivo Cisco en modo EXEC privilegiado. Un ingeniero te pide por teléfono ${que.replace('{I}', iface)}. ¿Qué comando escribes?\n\nEstás en: \`Dispositivo#\``,
      campos: [campo('cmd', 'Comando', 'comando', cmd)],
      pistas: [
        'Todos los comandos para consultar empiezan por `show`.',
        `Tiene ${palabras.length} palabras.`,
        `Empieza así: \`${palabras.slice(0, -1).join(' ')}\`…`,
      ],
      pasos: [{ t: `Comando: \`${cmd}\`` }, { t: explica }, { t: 'IOS acepta abreviaturas mientras no sean ambiguas (por ejemplo `sh ip int br`), y la tecla Tab completa la palabra.' }],
    };
  },
});

/* -------------------------------------------------------- dx-interfaz */
const ESTADOS = [
  ['up', 'up', 'La interfaz funciona: hay señal en el cable y el enlace de datos está activo'],
  ['administratively down', 'down', 'La interfaz está apagada por configuración (comando `shutdown`)'],
  ['down', 'down', 'Problema de capa 1: no hay señal (cable desconectado o dañado, o el otro extremo apagado)'],
  ['up', 'down', 'Problema de capa 2: hay señal, pero el protocolo de enlace no se establece'],
];
const ACCIONES = [
  'Ninguna: la interfaz está operativa',
  'Entrar en la interfaz y ejecutar `no shutdown`',
  'Revisar el cable y el equipo conectado en el otro extremo',
  'Revisar la configuración de capa 2 en los dos extremos (encapsulación, reloj, velocidad y dúplex)',
];
definir('dx-interfaz', 'Estado de una interfaz', {
  crear: (rng) => ({ estado: ent(rng, 0, 3), iface: elegir(rng, ['GigabitEthernet0/0', 'GigabitEthernet0/1', 'Serial0/0/0', 'Serial0/1/0', 'FastEthernet0/1']), ip: `${elegir(rng, LANS)}.${elegir(rng, [1, 254])}` }),
  resolver(q) {
    const [st, pr] = ESTADOS[q.estado];
    const porque = [
      'Status `up` significa que la capa física está bien (hay señal). Protocol `up` significa que el enlace de datos funciona. Con las dos en `up`, la interfaz puede enviar y recibir.',
      'La palabra `administratively` lo dice todo: alguien (o la configuración de fábrica en un router) dejó la interfaz con `shutdown`. No es una avería. Se activa con `no shutdown` dentro de la interfaz.',
      'Status `down` sin la palabra «administratively» significa que la interfaz está encendida pero no detecta señal: cable suelto o roto, tipo de cable equivocado, o el equipo del otro lado apagado o con su interfaz en shutdown. Como la capa 1 no funciona, el protocolo tampoco puede estar arriba.',
      'Status `up` indica que la capa física está bien: hay cable y hay señal. Pero Protocol `down` indica que los dos extremos no se entienden en capa 2. En enlaces serie suele ser una encapsulación distinta en cada extremo (HDLC en uno y PPP en el otro) o la falta de señal de reloj; en Ethernet, un desajuste de velocidad o dúplex.',
    ][q.estado];
    return {
      enunciado: `En un router Cisco ejecutas \`show ip interface brief\` y te fijas en la línea de **${q.iface}**. ¿Qué significa ese estado y qué harías primero?`,
      codigo: `Interface              IP-Address      OK? Method Status                Protocol\n${q.iface.padEnd(22, ' ')} ${q.ip.padEnd(15, ' ')} YES manual ${st.padEnd(21, ' ')} ${pr}`,
      campos: [campo('s', 'Qué significa', 'opcion', q.estado, { opciones: ESTADOS.map((e) => e[2]), lista: true }), campo('a', 'Primera acción', 'opcion', q.estado, { opciones: ACCIONES, lista: true })],
      pistas: [
        'La columna Status habla de la capa 1 (física) y la columna Protocol, de la capa 2 (enlace de datos).',
        'Si aparece la palabra «administratively», la causa es un comando, no una avería.',
        'down/down → mira lo físico. up/down → lo físico está bien: mira la configuración de enlace.',
      ],
      pasos: [
        { t: 'Las dos últimas columnas se leen así:', tabla: { cab: ['Status', 'Protocol', 'Significado'], filas: ESTADOS.map(([a, b, c], i) => [i === q.estado ? `**${a}**` : a, i === q.estado ? `**${b}**` : b, c]) } },
        { t: `La línea muestra \`${st}\` / \`${pr}\`. ${porque}` },
        { t: `Primera acción: **${ACCIONES[q.estado].replace(/`/g, '')}**.` },
      ],
    };
  },
});

/* ------------------------------------------------------- dx-prioridad */
const NIVEL3 = ['Alto', 'Medio', 'Bajo'];
const PRIORIDADES = ['P1 · Crítica', 'P2 · Alta', 'P3 · Media', 'P4 · Baja', 'P5 · Planificada'];
const IMPACTOS = [
  ['Toda la empresa se quedó sin acceso a Internet.', 'El servidor de archivos que usan todas las sedes no responde.', 'El sistema de cobro de todas las cajas de la tienda dejó de funcionar.'],
  ['El departamento de contabilidad (12 personas) no puede imprimir.', 'Los ocho equipos de una sala de juntas no tienen red.', 'El Wi-Fi de un piso completo se desconecta cada pocos minutos.'],
  ['Una sola persona no puede abrir el correo en su computadora.', 'El teléfono IP de un empleado no enciende.', 'Un usuario no puede conectarse a la impresora de su escritorio.'],
];
const URGENCIAS = [
  ['No existe ninguna alternativa y el trabajo está totalmente detenido.', 'Hay una entrega con fecha límite dentro de una hora.', 'Cada minuto de interrupción supone pérdida directa de ventas.'],
  ['Pueden seguir trabajando con una solución temporal incómoda durante el día.', 'Lo necesitan resuelto antes de mañana por la mañana.', 'Hay una alternativa, pero les hace perder bastante tiempo.'],
  ['No afecta a ninguna tarea de esta semana.', 'Hay una alternativa cómoda y nadie tiene prisa.', 'El usuario dice que puede esperar sin problema varios días.'],
];
const prioridadDe = (i, u) => i + u;
definir('dx-prioridad', 'Prioridad de un ticket', {
  crear: (rng) => ({ impacto: ent(rng, 0, 2), urgencia: ent(rng, 0, 2), a: ent(rng, 0, 2), b: ent(rng, 0, 2) }),
  resolver(q) {
    const pr = prioridadDe(q.impacto, q.urgencia);
    return {
      enunciado: `Llega este ticket a la mesa de ayuda: «${IMPACTOS[q.impacto][q.a]} ${URGENCIAS[q.urgencia][q.b]}» Clasifica su impacto y su urgencia, y asígnale la prioridad con la matriz de la organización.`,
      tabla: { cab: ['', 'Urgencia alta', 'Urgencia media', 'Urgencia baja'], filas: NIVEL3.map((n, i) => [`Impacto ${n.toLowerCase()}`, ...[0, 1, 2].map((u) => PRIORIDADES[prioridadDe(i, u)])]) },
      campos: [
        campo('i', 'Impacto', 'opcion', q.impacto, { opciones: NIVEL3 }),
        campo('u', 'Urgencia', 'opcion', q.urgencia, { opciones: ['Alta', 'Media', 'Baja'] }),
        campo('p', 'Prioridad', 'opcion', pr, { opciones: PRIORIDADES, desplegable: true }),
      ],
      pistas: [
        'Impacto = a cuántas personas o a qué parte del negocio afecta. Urgencia = cuánto puede esperar.',
        'La primera frase del ticket habla del impacto; la segunda, de la urgencia.',
        'Con los dos valores, busca la celda donde se cruzan la fila del impacto y la columna de la urgencia.',
      ],
      pasos: [
        { t: `**Impacto ${NIVEL3[q.impacto].toLowerCase()}**: «${IMPACTOS[q.impacto][q.a]}» ${['Afecta a toda la organización o a un servicio del que dependen todos.', 'Afecta a un grupo o departamento, no a toda la organización.', 'Afecta a una sola persona.'][q.impacto]}` },
        { t: `**Urgencia ${['alta', 'media', 'baja'][q.urgencia]}**: «${URGENCIAS[q.urgencia][q.b]}» ${['No se puede esperar: no hay alternativa o el plazo es inmediato.', 'Se puede esperar un poco: existe una solución temporal o el plazo no es inmediato.', 'Se puede esperar sin consecuencias.'][q.urgencia]}` },
        { t: `En la matriz, la fila «Impacto ${NIVEL3[q.impacto].toLowerCase()}» y la columna «Urgencia ${['alta', 'media', 'baja'][q.urgencia]}» se cruzan en **${PRIORIDADES[pr]}**. La prioridad no la decide quién grita más ni quién llegó primero: sale de combinar impacto y urgencia.` },
      ],
    };
  },
});

/* ---------------------------------------------------------- dx-acceso */
const ACCESOS = ['Cable de consola y un emulador de terminal', 'SSH', 'Telnet', 'RDP (Escritorio remoto)', 'VPN de acceso remoto', 'Panel de gestión en la nube'];
const CASOS_ACCESO = [
  ['Un switch Cisco nuevo acaba de salir de la caja: no tiene dirección IP ni ninguna configuración. Tienes que darle su configuración inicial.', 0, 'Sin dirección IP no hay forma de llegar al equipo por la red. El puerto de consola funciona siempre, aunque el equipo no tenga configuración: es el acceso fuera de banda.'],
  ['Un router perdió toda conectividad de red tras un cambio de configuración equivocado. Estás físicamente junto a él con una laptop.', 0, 'Si la red no funciona, SSH y Telnet tampoco. La consola no depende de la red: es la vía de rescate cuando todo lo demás falla.'],
  ['Necesitas entrar a la línea de comandos de un switch que está en otro edificio, a través de la red de la empresa, sin que nadie pueda leer tu contraseña por el camino.', 1, 'SSH da acceso a la línea de comandos por la red y cifra toda la sesión, incluidas las credenciales. Es el método estándar de administración remota.'],
  ['La política de seguridad exige que toda administración remota de routers y switches vaya cifrada. ¿Qué protocolo configuras en las líneas vty?', 1, 'SSH (puerto TCP 22) cifra la sesión. Telnet envía todo en texto claro y por eso las políticas de seguridad lo prohíben.'],
  ['Un equipo muy antiguo de laboratorio, aislado de la red de producción, no admite cifrado. Solo ofrece acceso remoto a la línea de comandos por el puerto TCP 23.', 2, 'El puerto TCP 23 es Telnet. Envía todo en texto claro, así que solo es aceptable en un laboratorio aislado; en producción se usa SSH.'],
  ['Un usuario necesita que controles el escritorio gráfico de su PC con Windows para instalarle una impresora, como si estuvieras sentado delante.', 3, 'RDP (puerto TCP 3389) muestra y controla el escritorio gráfico de un equipo Windows. SSH y Telnet solo dan línea de comandos.'],
  ['Tienes que administrar un servidor Windows que no tiene monitor ni teclado, usando sus ventanas y menús gráficos desde tu oficina.', 3, 'El Escritorio remoto (RDP) da acceso a la interfaz gráfica completa de Windows a través de la red.'],
  ['Una empleada trabaja desde su casa y necesita entrar, a través de Internet y de forma cifrada, a los servidores internos de la empresa como si estuviera en la oficina.', 4, 'Una VPN de acceso remoto crea un túnel cifrado entre el equipo del usuario y la red de la empresa: desde casa obtiene acceso a los recursos internos.'],
  ['Un técnico está en un hotel y debe conectarse por SSH a un switch que solo tiene una dirección privada (10.1.1.5) dentro de la red corporativa. ¿Qué necesita establecer primero?', 4, 'Una dirección privada no es alcanzable desde Internet. Primero hay que entrar a la red corporativa con una VPN de acceso remoto; después ya se puede abrir la sesión SSH.'],
  ['La empresa tiene 40 sucursales con puntos de acceso y switches Meraki. Quieres ver el estado de todos y cambiar un SSID desde el navegador, sin conectarte equipo por equipo.', 5, 'Los equipos gestionados en la nube (como Cisco Meraki) se administran desde un panel web central: los dispositivos se conectan ellos mismos a la nube y reciben de ahí su configuración.'],
  ['Envías un punto de acceso nuevo a una sucursal donde no hay personal técnico. Quieres que alguien solo lo enchufe y que tome su configuración por sí mismo.', 5, 'Con la gestión en la nube, el equipo se registra en el panel por su número de serie; al conectarse a Internet descarga su configuración sin intervención en sitio.'],
];
definir('dx-acceso', 'Método de acceso', {
  crear: (rng) => ({ caso: ent(rng, 0, CASOS_ACCESO.length - 1) }),
  resolver(q) {
    const [texto, r, porque] = CASOS_ACCESO[q.caso];
    return {
      enunciado: texto + ' ¿Qué método de acceso corresponde?',
      campos: [campo('r', 'Método de acceso', 'opcion', r, { opciones: ACCESOS, lista: true })],
      pistas: [
        'Pregúntate primero: ¿el equipo es alcanzable por la red o no? Si no lo es, solo queda el acceso físico.',
        '¿Hace falta línea de comandos o escritorio gráfico? ¿Cifrado o no?',
        'Consola = sin red · SSH = CLI cifrada · Telnet = CLI sin cifrar (23) · RDP = escritorio de Windows · VPN = entrar a la red interna desde fuera · nube = panel web central.',
      ],
      pasos: [
        { t: 'Los métodos de acceso se distinguen por tres cosas: si necesitan red, qué ofrecen y si cifran.', tabla: { cab: ['Método', 'Necesita red', 'Ofrece', 'Cifrado'], filas: [
          ['Consola', 'No', 'Línea de comandos', 'No aplica (cable directo)'], ['SSH (TCP 22)', 'Sí', 'Línea de comandos', 'Sí'], ['Telnet (TCP 23)', 'Sí', 'Línea de comandos', 'No'],
          ['RDP (TCP 3389)', 'Sí', 'Escritorio gráfico de Windows', 'Sí'], ['VPN', 'Sí (Internet)', 'Acceso a la red interna', 'Sí'], ['Panel en la nube', 'Sí (Internet)', 'Gestión web centralizada', 'Sí (HTTPS)']] } },
        { t: porque },
        { t: `Respuesta: **${ACCESOS[r]}**.` },
      ],
    };
  },
});

/* ---------------------------------------------------------- dx-filtro */
// [tarea, filtro, alternativas, explicación]. {H} = dirección, {P} = puerto.
const variantes = (f) => { const m = /^(\S+) == (\S+)$/.exec(f); return m ? [`${m[1]}==${m[2]}`, `${m[1]} eq ${m[2]}`] : []; };
const FILTROS = {
  dns: ['solo las consultas y respuestas DNS', 'dns', [], 'El nombre del protocolo en minúsculas es ya un filtro: `dns` deja solo los paquetes DNS.'],
  icmp: ['solo los mensajes ICMP, por ejemplo los de un ping', 'icmp', [], '`icmp` muestra las peticiones y respuestas de eco, además de los mensajes de error ICMP.'],
  arp: ['solo las tramas ARP', 'arp', [], '`arp` muestra las peticiones «¿quién tiene esta IP?» y sus respuestas.'],
  http: ['solo el tráfico HTTP sin cifrar', 'http', [], '`http` muestra las peticiones y respuestas web sin cifrar. El tráfico HTTPS no aparece aquí: va cifrado dentro de TLS.'],
  dhcp: ['solo los mensajes DHCP (Discover, Offer, Request, Ack)', 'dhcp', ['bootp'], '`dhcp` muestra los cuatro mensajes de la negociación. En versiones antiguas de Wireshark el filtro se llamaba `bootp`.'],
  addr: ['todos los paquetes cuya dirección de origen O de destino sea {H}', 'ip.addr == {H}', [], '`ip.addr` coincide con la dirección en cualquiera de los dos sentidos: ves la conversación completa de ese equipo.'],
  src: ['solo los paquetes ENVIADOS por {H} (dirección de origen)', 'ip.src == {H}', [], '`ip.src` compara solo la dirección de origen: lo que ese equipo envía.'],
  dst: ['solo los paquetes DIRIGIDOS a {H} (dirección de destino)', 'ip.dst == {H}', [], '`ip.dst` compara solo la dirección de destino: lo que ese equipo recibe.'],
  tcp: ['todo el tráfico TCP que use el puerto {P}, sea de origen o de destino', 'tcp.port == {P}', [], '`tcp.port` coincide con el puerto de origen o el de destino. Para un solo sentido existen `tcp.srcport` y `tcp.dstport`.'],
  udp: ['todo el tráfico UDP que use el puerto {P}', 'udp.port == {P}', [], '`udp.port` funciona igual que `tcp.port`, pero para segmentos UDP.'],
};
definir('dx-filtro', 'Filtro de Wireshark', {
  crear(rng) {
    const caso = elegir(rng, Object.keys(FILTROS));
    return { caso, host: elegir(rng, ['192.168.1.10', '192.168.1.25', '10.0.0.5', '172.16.0.20', '192.168.10.100']), puerto: caso === 'udp' ? elegir(rng, [53, 67, 123]) : elegir(rng, [80, 443, 22, 23, 3389]) };
  },
  resolver(q) {
    const [tarea, filtro, extra, explica] = FILTROS[q.caso];
    const puerto = q.puerto || (q.caso === 'udp' ? 53 : 443);
    const pon = (t) => t.replaceAll('{H}', q.host ?? '192.168.1.10').replaceAll('{P}', String(puerto));
    const f = pon(filtro);
    return {
      enunciado: `Tienes abierta en Wireshark una captura con miles de paquetes. Escribe el **filtro de visualización** que deja a la vista ${pon(tarea)}.`,
      campos: [campo('f', 'Filtro de visualización', 'texto', f, { acepta: [...extra, ...variantes(f)] })],
      pistas: [
        'Los filtros de visualización se escriben en minúsculas. El nombre de un protocolo, solo, ya es un filtro.',
        'Para comparar un campo se escribe `campo == valor`, con dos signos de igual. Los campos se nombran `protocolo.campo`.',
        f.includes('==') ? `El campo es \`${f.split(' ')[0]}\`.` : `Es una sola palabra de ${f.length} letras: el nombre del protocolo.`,
      ],
      pasos: [{ t: `Filtro: \`${f}\`` }, { t: pon(explica) }, { t: 'La barra de filtro se pone en verde cuando la sintaxis es válida y en rojo cuando no. El filtro de visualización solo oculta paquetes: no los borra de la captura.' }],
    };
  },
});

/* ------------------------------------------------------------ niveles */
niveles('diagnostico', [
  { n: 1, nombre: 'Método y mesa de ayuda', resumen: 'Los pasos del diagnóstico, tickets, prioridad y documentación.',
    tipos: [['dx-prioridad', 3], ['banco', 6]] },
  { n: 2, nombre: 'Ping y traceroute', resumen: 'La secuencia de pings, leer una traza y los comandos de cada sistema.',
    tipos: [['dx-ping', 3], ['dx-traceroute', 2], ['dx-comando', 2], ['banco', 3]] },
  { n: 3, nombre: 'Configuración IP y DNS', resumen: 'Leer ipconfig, detectar APIPA y puertas de enlace equivocadas, nslookup.',
    tipos: [['dx-config', 3], ['dx-comando', 3], ['dx-ping', 1], ['banco', 3]] },
  { n: 4, nombre: 'Casos y capturas', resumen: 'Diagnósticos completos, el efecto de los firewalls y filtros de Wireshark.',
    tipos: [['dx-filtro', 3], ['dx-ping', 2], ['dx-config', 2], ['dx-traceroute', 2], ['banco', 4]] },
  { n: 5, nombre: 'Acceso y comandos show', resumen: 'Consola, SSH, Telnet, RDP y VPN; comandos show y estado de las interfaces.',
    tipos: [['dx-acceso', 3], ['dx-show', 3], ['dx-interfaz', 3], ['banco', 3]] },
  { n: 6, nombre: 'Experto', resumen: 'Todo mezclado: escenarios de soporte con salidas de consola reales.',
    tipos: [['dx-config', 2], ['dx-traceroute', 2], ['dx-show', 2], ['dx-interfaz', 1], ['dx-filtro', 1], ['dx-ping', 1], ['dx-prioridad', 1], ['dx-acceso', 1], ['banco', 5]] },
]);
