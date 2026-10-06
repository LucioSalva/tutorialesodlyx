/**
 * Academia de Redes · Tipos de ejercicio de subneteo
 * ---------------------------------------------------------------------
 * Cada tipo sabe dos cosas:
 *   crear(rng, nivel)  → parámetros de un ejercicio nuevo (práctica infinita)
 *   resolver(params)   → { enunciado, tabla?, campos, pistas, pasos }
 *
 * Un ejercicio se guarda solo como { tipo, …parámetros }: la respuesta y la
 * solución paso a paso se CALCULAN con ip.js, nunca se escriben a mano.
 * Los ejemplos resueltos de las lecciones salen de estos mismos resolver().
 *
 * Marcado de los textos: **negrita** y `monoespaciado`.
 */
import {
  ip, aTexto, octetos, mascara, wildcard, red, broadcast, tamano, hostsUtiles, bin8, miles,
  octetoInteresante, analizar, prefijoParaHosts, clase, ambito, contiene, vlsm, resumen,
} from './ip.js';

export const TIPOS = {};
export const definir = (id, nombre, o) => { TIPOS[id] = { id, nombre, ...o }; };

/**
 * Niveles de práctica por módulo. Cada archivo tipos-<modulo>.js registra los suyos.
 * Cada entrada de `tipos` es [tipo, peso]: el peso es cuántas papeletas tiene ese tipo
 * en el sorteo del nivel. El tipo especial 'banco' saca una pregunta del banco del módulo.
 */
export const NIVELES = {};
export const niveles = (modulo, lista) => { NIVELES[modulo] = lista; };

/* ------------------------------------------------------------ utilidades */
export const ent = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
export const elegir = (rng, lista) => lista[Math.floor(rng() * lista.length)];
const NOMBRE_OCTETO = ['primer', 'segundo', 'tercer', 'cuarto'];
const SI_NO = ['Sí', 'No'];
export const campo = (id, etiqueta, tipo, valor, extra = {}) => ({ id, etiqueta, tipo, valor, ...extra });
const cidr = (d, p) => aTexto(d) + '/' + p;
const pot = (n) => `2^${n}`;

const ESPACIOS = [{ b: '10.0.0.0', p: 8 }, { b: '172.16.0.0', p: 12 }, { b: '192.168.0.0', p: 16 }];
/** Red privada aleatoria alineada al prefijo p. */
function baseAleatoria(rng, p) {
  const e = elegir(rng, ESPACIOS.filter((x) => x.p <= p));
  return ip(e.b) + ent(rng, 0, 2 ** (p - e.p) - 1) * tamano(p);
}
const hostAleatorio = (rng, r, p) => r + ent(rng, 1, tamano(p) - 2);
function prefijoDeNivel(rng, nivel) {
  if (nivel <= 2) return elegir(rng, [24, 25, 26, 26, 27, 27, 28, 28, 29, 30]);
  if (nivel === 3) return ent(rng, 17, 23);
  return ent(rng, 9, 15);
}

/** Vista de bits para un paso de la solución. */
const fila = (et, d, p, p0) => ({ et, ip: aTexto(d), p, ...(p0 !== undefined ? { p0 } : {}) });

/** «…, 64, **96**, 128, …»: los múltiplos del bloque alrededor del elegido. */
function multiplos(bloque, m) {
  const partes = [];
  const desde = Math.max(0, m - 2 * bloque);
  const hasta = Math.min(256 - bloque, m + 2 * bloque);
  if (desde > 0) partes.push('…');
  for (let x = desde; x <= hasta; x += bloque) partes.push(x === m ? `**${x}**` : String(x));
  if (hasta < 256 - bloque) partes.push('…');
  return partes.join(', ');
}

/** Párrafo que explica cómo se llega a la dirección de red de d/p. */
function explicaRed(d, p, quien = 'la IP') {
  const o = octetoInteresante(p);
  const r = red(d, p);
  if (!o) {
    const n = p / 8;
    return `Con **/${p}** la máscara es \`${aTexto(mascara(p))}\`: ${n === 1 ? 'el primer octeto es' : `los ${n} primeros octetos son`} de red y el resto de host. `
      + `Se copian los octetos de red de ${quien} y los de host se dejan en 0: la red es \`${aTexto(r)}\`.`;
  }
  const v = octetos(d)[o.i];
  const m = octetos(r)[o.i];
  return `Con **/${p}** la máscara es \`${aTexto(mascara(p))}\`. El octeto interesante es el ${NOMBRE_OCTETO[o.i]} octeto (vale ${o.valor} en la máscara): `
    + `número mágico = 256 − ${o.valor} = **${o.bloque}**. Las subredes empiezan en los múltiplos de ${o.bloque} (${multiplos(o.bloque, m)}). `
    + `En ${quien} ese octeto vale ${v}, que cae en el bloque que empieza en ${m} (${m} ≤ ${v} ≤ ${m + o.bloque - 1}). La red es \`${aTexto(r)}\`.`;
}

/** Párrafo que explica el broadcast a partir de la red. */
function explicaBroadcast(d, p) {
  const o = octetoInteresante(p);
  const r = red(d, p);
  const b = broadcast(d, p);
  if (!o) return `El broadcast pone todos los bits de host en 1, es decir, 255 en cada octeto de host: \`${aTexto(b)}\`.`;
  const m = octetos(r)[o.i];
  const sig = m + o.bloque;
  const resto = o.i < 3 ? ` y los octetos que quedan a la derecha valen 255` : '';
  return `La siguiente subred empezaría en ${sig === 256 ? `256 (ya no cabe en el octeto: sería otra red)` : sig} dentro del ${NOMBRE_OCTETO[o.i]} octeto, `
    + `así que esta termina uno antes: ${m} + ${o.bloque} − 1 = **${sig - 1}**${resto}. Broadcast: \`${aTexto(b)}\`.`;
}

const explicaHosts = (p) => `Quedan 32 − ${p} = **${32 - p}** bits de host: ${pot(32 - p)} = ${miles(tamano(p))} direcciones. `
  + `Se restan 2 (la de red y la de broadcast): **${miles(hostsUtiles(p))}** hosts asignables.`;

/* =============================================================== NIVEL 1 */
const PESOS = [128, 64, 32, 16, 8, 4, 2, 1];

definir('dec-bin', 'Decimal a binario', {
  crear: (rng) => ({ n: elegir(rng, [ent(rng, 1, 255), elegir(rng, [128, 192, 224, 240, 248, 252, 254, 255, 10, 172, 168])]) }),
  resolver({ n }) {
    let resto = n;
    const bits = [];
    const notas = [];
    for (const w of PESOS) {
      if (w <= resto) { bits.push('1'); notas.push(`${resto} − ${w} = ${resto - w}`); resto -= w; } else { bits.push('0'); notas.push(`${w} no cabe en ${resto}`); }
    }
    return {
      enunciado: `Convierte el número decimal **${n}** a binario de 8 bits.`,
      campos: [campo('bin', 'Binario (8 bits)', 'binario', bin8(n))],
      pistas: [
        'Usa los pesos de un octeto, de izquierda a derecha: 128, 64, 32, 16, 8, 4, 2, 1.',
        'Recorre los pesos: si el peso cabe en lo que te queda, escribe 1 y réstalo; si no cabe, escribe 0.',
        `El primer peso que cabe en ${n} es ${PESOS.find((w) => w <= n)}. Sigue restando hasta llegar a 0.`,
      ],
      pasos: [
        { t: `Se recorren los ocho pesos de izquierda a derecha. Si el peso cabe en lo que queda, el bit es 1 y se resta; si no cabe, el bit es 0.`,
          tabla: { cab: ['Peso', ...PESOS.map(String)], filas: [['Bit', ...bits], ['Operación', ...notas]] } },
        { t: `Leyendo los bits en orden: **${n}** = \`${bin8(n)}\`. Comprobación: ${PESOS.filter((_, i) => bits[i] === '1').join(' + ') || '0'} = ${n}.` },
      ],
    };
  },
});

definir('bin-dec', 'Binario a decimal', {
  crear: (rng) => ({ n: elegir(rng, [ent(rng, 1, 255), elegir(rng, [128, 192, 224, 240, 248, 252, 254, 255])]) }),
  resolver({ n }) {
    const b = bin8(n).split('');
    const suma = PESOS.filter((_, i) => b[i] === '1');
    return {
      enunciado: `Convierte el octeto binario \`${bin8(n)}\` a decimal.`,
      campos: [campo('dec', 'Decimal', 'numero', n)],
      pistas: [
        'Cada posición tiene un peso fijo: 128, 64, 32, 16, 8, 4, 2, 1.',
        'Suma solo los pesos de las posiciones que tienen un 1.',
        `Hay ${suma.length} bit${suma.length === 1 ? '' : 's'} en 1. Suma sus pesos.`,
      ],
      pasos: [
        { t: 'Se coloca cada bit debajo de su peso y se suman los pesos que tienen un 1.',
          tabla: { cab: ['Peso', ...PESOS.map(String)], filas: [['Bit', ...b], ['Suma', ...b.map((x, i) => (x === '1' ? String(PESOS[i]) : '—'))]] } },
        { t: `${suma.join(' + ') || '0'} = **${n}**.` },
      ],
    };
  },
});

definir('prefijo-mascara', 'Prefijo a máscara', {
  crear: (rng, nivel) => ({ p: nivel <= 1 ? elegir(rng, [8, 16, 24, 25, 26, 27, 28, 29, 30, ent(rng, 17, 23)]) : ent(rng, 1, 30) }),
  resolver({ p }) {
    const o = octetoInteresante(p);
    const llenos = Math.floor(p / 8);
    const pasos = [{ t: `**/${p}** significa ${p} bits en 1 seguidos, empezando por la izquierda, y el resto (${32 - p}) en 0.`, bits: [fila('Máscara', mascara(p), p)] }];
    if (o) {
      const r = p % 8;
      pasos.push({ t: `${llenos} octeto${llenos === 1 ? '' : 's'} complet${llenos === 1 ? 'o' : 'os'} en 1 → ${llenos === 0 ? 'ninguno vale 255' : '255 cada uno'}. `
        + (r === 1 ? `En el ${NOMBRE_OCTETO[o.i]} octeto queda 1 bit en 1, el de peso 128: vale **128**.` : `En el ${NOMBRE_OCTETO[o.i]} octeto quedan ${r} bits en 1: ${PESOS.slice(0, r).join(' + ')} = **${o.valor}**.`) + ' Los octetos restantes valen 0.' });
    } else {
      pasos.push({ t: `${p} ÷ 8 = ${llenos} exacto: ${llenos} octeto${llenos === 1 ? '' : 's'} en 255 y el resto en 0.` });
    }
    pasos.push({ t: `Máscara: \`${aTexto(mascara(p))}\`.` });
    return {
      enunciado: `Escribe en decimal la máscara de subred que corresponde al prefijo **/${p}**.`,
      campos: [campo('mascara', 'Máscara', 'ip', aTexto(mascara(p)))],
      pistas: [
        'El prefijo cuenta cuántos bits en 1 tiene la máscara, de izquierda a derecha.',
        'Cada 8 bits completos son un octeto 255. Los bits que sobran se suman con los pesos 128, 64, 32…',
        `${p} = ${llenos} × 8 + ${p % 8}. ${llenos} octeto(s) valen 255 y en el siguiente hay ${p % 8} bit(s) en 1.`,
      ],
      pasos,
    };
  },
});

definir('mascara-prefijo', 'Máscara a prefijo', {
  crear: (rng, nivel) => ({ p: nivel <= 1 ? elegir(rng, [8, 16, 24, 25, 26, 27, 28, 29, 30, ent(rng, 17, 23)]) : ent(rng, 1, 30) }),
  resolver({ p }) {
    const o = octetos(mascara(p));
    const unos = o.map((x) => bin8(x).split('1').length - 1);
    return {
      enunciado: `¿Qué prefijo CIDR corresponde a la máscara \`${aTexto(mascara(p))}\`?`,
      campos: [campo('prefijo', 'Prefijo', 'prefijo', p)],
      pistas: [
        'El prefijo es la cantidad de bits en 1 de la máscara.',
        'Un octeto 255 aporta 8 bits. Valores parciales: 128→1, 192→2, 224→3, 240→4, 248→5, 252→6, 254→7.',
        `Suma los bits de cada octeto: ${o.join(', ')}.`,
      ],
      pasos: [
        { t: 'Se cuenta cuántos bits en 1 aporta cada octeto.', bits: [fila('Máscara', mascara(p), p)],
          tabla: { cab: ['Octeto', ...o.map(String)], filas: [['Binario', ...o.map(bin8)], ['Bits en 1', ...unos.map(String)]] } },
        { t: `${unos.join(' + ')} = **${p}**. El prefijo es **/${p}**.` },
      ],
    };
  },
});

const CLASES = ['A', 'B', 'C', 'D', 'E'];
definir('clase', 'Clase de la dirección', {
  crear: (rng) => ({ ip: [elegir(rng, [ent(rng, 1, 126), ent(rng, 128, 191), ent(rng, 192, 223), ent(rng, 224, 239), ent(rng, 240, 254), ent(rng, 1, 223)]), ent(rng, 0, 255), ent(rng, 0, 255), ent(rng, 1, 254)].join('.') }),
  resolver(q) {
    const d = ip(q.ip);
    const o = d >>> 24;
    const c = clase(d);
    const filas = [['A', '0 – 127', '0…', '/8'], ['B', '128 – 191', '10…', '/16'], ['C', '192 – 223', '110…', '/24'], ['D', '224 – 239', '1110…', 'multidifusión'], ['E', '240 – 255', '1111…', 'experimental']];
    return {
      enunciado: `¿A qué clase pertenece la dirección \`${aTexto(d)}\`?`,
      campos: [campo('clase', 'Clase', 'opcion', CLASES.indexOf(c), { opciones: CLASES })],
      pistas: [
        'La clase se decide mirando solo el primer octeto.',
        'A: 0–127 · B: 128–191 · C: 192–223 · D: 224–239 · E: 240–255.',
        `El primer octeto es ${o}. ¿En qué rango cae?`,
      ],
      pasos: [
        { t: `Solo importa el primer octeto: **${o}** (\`${bin8(o)}\` en binario).`, tabla: { cab: ['Clase', 'Primer octeto', 'Empieza por', 'Máscara por defecto'], filas } },
        { t: `${o} está en el rango de la clase **${c}**.` },
      ],
    };
  },
});

const AMBITOS = ['Privada (RFC 1918)', 'Pública', 'Loopback', 'Enlace local (APIPA)'];
const CLAVE_AMBITO = ['privada', 'publica', 'loopback', 'apipa'];
definir('privada', 'Privada o pública', {
  crear(rng) {
    const cola = () => `${ent(rng, 0, 255)}.${ent(rng, 1, 254)}`;
    return { ip: elegir(rng, [
      `10.${ent(rng, 0, 255)}.${cola()}`, `172.${ent(rng, 16, 31)}.${cola()}`, `192.168.${cola()}`,
      `172.${elegir(rng, [15, 32, 33, 40])}.${cola()}`, `192.${elegir(rng, [167, 169, 188])}.${cola()}`, `11.${ent(rng, 0, 255)}.${cola()}`,
      `${elegir(rng, [8, 23, 45, 77, 130, 151, 189, 200, 201])}.${ent(rng, 0, 255)}.${cola()}`,
      `127.${ent(rng, 0, 255)}.${cola()}`, `169.254.${cola()}`,
    ]) };
  },
  resolver(q) {
    const d = ip(q.ip);
    const a = ambito(d);
    const porque = {
      privada: 'está dentro de uno de los tres bloques reservados para redes privadas, así que no se enruta en Internet',
      publica: 'no cae en ninguno de los bloques reservados, así que es una dirección pública enrutable en Internet',
      loopback: 'pertenece a 127.0.0.0/8, que representa al propio equipo',
      apipa: 'pertenece a 169.254.0.0/16, el rango que un equipo se asigna solo cuando no consigue respuesta de un servidor DHCP',
    }[a];
    return {
      enunciado: `¿Qué tipo de dirección es \`${aTexto(d)}\`?`,
      campos: [campo('tipo', 'Tipo', 'opcion', CLAVE_AMBITO.indexOf(a), { opciones: AMBITOS })],
      pistas: [
        'Hay tres bloques privados: uno empieza por 10, otro por 172 y otro por 192.168.',
        'El bloque de 172 no es todo 172.x: solo va de 172.16 a 172.31.',
        'Privadas: 10.0.0.0/8, 172.16.0.0/12 y 192.168.0.0/16. Loopback: 127.0.0.0/8. APIPA: 169.254.0.0/16.',
      ],
      pasos: [
        { t: 'Se compara la dirección con los bloques reservados.',
          tabla: { cab: ['Bloque', 'Rango', 'Uso'], filas: [
            ['10.0.0.0/8', '10.0.0.0 – 10.255.255.255', 'Privado'], ['172.16.0.0/12', '172.16.0.0 – 172.31.255.255', 'Privado'],
            ['192.168.0.0/16', '192.168.0.0 – 192.168.255.255', 'Privado'], ['127.0.0.0/8', '127.0.0.0 – 127.255.255.255', 'Loopback'],
            ['169.254.0.0/16', '169.254.0.0 – 169.254.255.255', 'Enlace local (APIPA)']] } },
        { t: `\`${aTexto(d)}\` ${porque}. Respuesta: **${AMBITOS[CLAVE_AMBITO.indexOf(a)]}**.` },
      ],
    };
  },
});

/* =============================================================== NIVEL 2 */
definir('hosts-prefijo', 'Hosts de un prefijo', {
  crear: (rng, nivel) => ({ p: nivel <= 2 ? ent(rng, 22, 30) : ent(rng, 8, 30) }),
  resolver({ p }) {
    return {
      enunciado: `Una subred usa el prefijo **/${p}**. ¿Cuántos bits de host tiene, cuántas direcciones en total y cuántos hosts asignables?`,
      campos: [
        campo('bits', 'Bits de host', 'numero', 32 - p),
        campo('total', 'Direcciones totales', 'numero', tamano(p)),
        campo('hosts', 'Hosts asignables', 'numero', hostsUtiles(p)),
      ],
      pistas: [
        'Una IPv4 tiene 32 bits. Los que no son de red son de host.',
        'Con h bits de host hay 2^h direcciones.',
        'De ese total se restan 2: la dirección de red y la de broadcast.',
      ],
      pasos: [{ t: explicaHosts(p), bits: [fila('Máscara', mascara(p), p)] }],
    };
  },
});

function pasosAnalizar(d, p) {
  const a = analizar(d, p);
  return [
    { t: `Se separa la parte de red (${p} bits) de la parte de host (${32 - p} bits).`, bits: [fila('IP', d, p), fila('Máscara', a.mascara, p)] },
    { t: '**Red.** ' + explicaRed(d, p) },
    { t: '**Broadcast.** ' + explicaBroadcast(d, p) },
    { t: `**Rango asignable.** El primer host es la red + 1 y el último es el broadcast − 1: de \`${aTexto(a.primero)}\` a \`${aTexto(a.ultimo)}\`.`,
      bits: [fila('Red', a.red, p), fila('Broadcast', a.broadcast, p)] },
    { t: '**Hosts.** ' + explicaHosts(p) },
  ];
}

definir('analizar', 'Analizar una dirección', {
  crear(rng, nivel) {
    const p = prefijoDeNivel(rng, nivel);
    return { ip: aTexto(hostAleatorio(rng, baseAleatoria(rng, p), p)), p };
  },
  resolver(q) {
    const d = ip(q.ip);
    const a = analizar(d, q.p);
    const o = octetoInteresante(q.p);
    return {
      enunciado: `Un equipo tiene la dirección \`${cidr(d, q.p)}\`. Calcula los datos de su subred.`,
      campos: [
        campo('mascara', 'Máscara', 'ip', aTexto(a.mascara)),
        campo('red', 'Dirección de red', 'ip', aTexto(a.red)),
        campo('primero', 'Primer host', 'ip', aTexto(a.primero)),
        campo('ultimo', 'Último host', 'ip', aTexto(a.ultimo)),
        campo('broadcast', 'Broadcast', 'ip', aTexto(a.broadcast)),
        campo('hosts', 'Hosts asignables', 'numero', a.hosts),
      ],
      pistas: [
        o ? `Busca el octeto interesante: el ${NOMBRE_OCTETO[o.i]} octeto, donde la máscara no vale 0 ni 255.` : 'El prefijo cae justo en un límite de octeto: no hay que partir ningún octeto.',
        o ? `Número mágico = 256 − ${o.valor} = ${o.bloque}. Las subredes empiezan en los múltiplos de ${o.bloque}.` : 'Los octetos de host valen 0 en la red y 255 en el broadcast.',
        'Primer host = red + 1. Último host = broadcast − 1. Hosts = 2^(bits de host) − 2.',
      ],
      pasos: pasosAnalizar(d, q.p),
    };
  },
});

const PAPELES = ['Dirección de red', 'Dirección de broadcast', 'Host válido (asignable)'];
definir('tipo-direccion', 'Red, broadcast o host', {
  crear(rng, nivel) {
    const p = nivel <= 2 ? ent(rng, 25, 30) : ent(rng, 17, 23);
    const r = baseAleatoria(rng, p);
    const b = broadcast(r, p);
    const o = octetoInteresante(p);
    // Tentadores: hosts que «parecen» red o broadcast (acaban en 0 o 255) cuando el prefijo lo permite.
    const trampas = o && o.i === 2 ? [r + 256, b - 256, r + 255].filter((x) => x > r && x < b) : [];
    return { ip: aTexto(elegir(rng, [r, b, hostAleatorio(rng, r, p), ...trampas, ...trampas])), p };
  },
  resolver(q) {
    const d = ip(q.ip);
    const a = analizar(d, q.p);
    const papel = d === a.red ? 0 : d === a.broadcast ? 1 : 2;
    const final = [
      `La dirección coincide con la de red: identifica a la subred y **no se puede asignar** a un equipo.`,
      `La dirección coincide con el broadcast: llega a todos los equipos de la subred y **no se puede asignar**.`,
      `No es ni la red (\`${aTexto(a.red)}\`) ni el broadcast (\`${aTexto(a.broadcast)}\`): está dentro del rango \`${aTexto(a.primero)}\` – \`${aTexto(a.ultimo)}\`, así que es un **host válido**${[0, 255].includes(d & 255) ? `. Que termine en ${d & 255} no la hace especial: lo que cuenta son los bits de host, y aquí no son todos 0 ni todos 1` : ''}.`,
    ][papel];
    return {
      enunciado: `En la subred a la que pertenece \`${cidr(d, q.p)}\`, ¿qué papel tiene esa dirección? Indica también la dirección de red.`,
      campos: [campo('red', 'Dirección de red', 'ip', aTexto(a.red)), campo('papel', 'La dirección es', 'opcion', papel, { opciones: PAPELES })],
      pistas: [
        'Calcula primero la red y el broadcast de esa subred.',
        'Es red si todos los bits de host valen 0, y broadcast si todos valen 1.',
        'Terminar en .0 o en .255 no decide nada por sí solo: depende del prefijo.',
      ],
      pasos: [
        { t: explicaRed(d, q.p), bits: [fila('IP', d, q.p)] },
        { t: explicaBroadcast(d, q.p) },
        { t: final },
      ],
    };
  },
});

definir('wildcard', 'Máscara wildcard', {
  crear: (rng, nivel) => ({ p: nivel <= 2 ? ent(rng, 24, 30) : ent(rng, 9, 30) }),
  resolver({ p }) {
    const m = octetos(mascara(p));
    const w = octetos(wildcard(p));
    return {
      enunciado: `Escribe la máscara wildcard que corresponde a **/${p}** (máscara \`${aTexto(mascara(p))}\`).`,
      campos: [campo('wildcard', 'Wildcard', 'ip', aTexto(wildcard(p)))],
      pistas: [
        'La wildcard es la máscara invertida: donde la máscara tiene 1, la wildcard tiene 0, y al revés.',
        'En decimal basta restar cada octeto de la máscara a 255.',
        `Resta octeto a octeto: 255 − ${m.join(', 255 − ')}.`,
      ],
      pasos: [
        { t: 'La wildcard invierte los bits de la máscara. En decimal: 255 menos cada octeto.',
          tabla: { cab: ['', '1.º', '2.º', '3.º', '4.º'], filas: [['255', '255', '255', '255', '255'], ['− máscara', ...m.map(String)], ['= wildcard', ...w.map(String)]] } },
        { t: `Wildcard: \`${aTexto(wildcard(p))}\`. Los bits en 0 deben coincidir; los bits en 1 se ignoran.` },
      ],
    };
  },
});

definir('subredes-prestadas', 'Bits prestados', {
  crear(rng, nivel) {
    const p0 = nivel <= 2 ? 24 : elegir(rng, [8, 16, 16, 20, 22, 24]);
    return { p0, p1: Math.min(30, p0 + ent(rng, 1, nivel <= 2 ? 6 : 9)) };
  },
  resolver({ p0, p1 }) {
    const s = p1 - p0;
    return {
      enunciado: `Una red **/${p0}** se divide usando el prefijo **/${p1}** en todas sus subredes. ¿Cuántos bits se tomaron prestados, cuántas subredes salen y cuántos hosts asignables tiene cada una?`,
      campos: [
        campo('bits', 'Bits prestados', 'numero', s),
        campo('subredes', 'Subredes', 'numero', 2 ** s),
        campo('hosts', 'Hosts por subred', 'numero', hostsUtiles(p1)),
      ],
      pistas: [
        'Los bits prestados son la diferencia entre el prefijo nuevo y el original.',
        'Con s bits prestados salen 2^s subredes.',
        'Los hosts dependen de los bits que QUEDAN para host: 32 − prefijo nuevo.',
      ],
      pasos: [
        { t: `Bits prestados: ${p1} − ${p0} = **${s}**. Esos bits pasan de la parte de host a numerar subredes.`, bits: [fila('Máscara nueva', mascara(p1), p1, p0)] },
        { t: `Subredes: ${pot(s)} = **${miles(2 ** s)}**.` },
        { t: explicaHosts(p1) },
      ],
    };
  },
});

/* =============================================================== NIVEL 3 */
definir('prefijo-para-hosts', 'Prefijo según hosts', {
  crear(rng, nivel) {
    const bits = ent(rng, 2, nivel <= 3 ? 10 : 14);
    const max = 2 ** bits - 2;
    const min = bits === 2 ? 1 : 2 ** (bits - 1) - 1;
    // Los valores justo en la frontera (2^n − 2, 2^n − 1, 2^n) son donde más se falla.
    return { h: elegir(rng, [ent(rng, min, max), ent(rng, min, max), max, min, Math.min(max, min + 1)]) };
  },
  resolver({ h }) {
    const p = prefijoParaHosts(h);
    const bits = 32 - p;
    const corto = 2 ** (bits - 1) - 2;
    return {
      enunciado: `Necesitas una subred para **${miles(h)}** equipo${h === 1 ? '' : 's'}. ¿Cuál es el prefijo más largo (la subred más pequeña) que sirve? Indica también su máscara y cuántos hosts ofrece.`,
      campos: [
        campo('prefijo', 'Prefijo', 'prefijo', p),
        campo('mascara', 'Máscara', 'ip', aTexto(mascara(p))),
        campo('hosts', 'Hosts que ofrece', 'numero', hostsUtiles(p)),
      ],
      pistas: [
        'Busca la potencia de 2 más pequeña que, tras restarle 2, alcance para los equipos.',
        `Necesitas al menos ${miles(h)} + 2 = ${miles(h + 2)} direcciones (red y broadcast no se asignan).`,
        'Si esa potencia es 2^n, la subred tiene n bits de host y el prefijo es 32 − n.',
      ],
      pasos: [
        { t: `Hacen falta ${miles(h)} direcciones para equipos más 2 reservadas (red y broadcast): **${miles(h + 2)}** como mínimo.` },
        { t: `La potencia de 2 más pequeña que llega es ${pot(bits)} = ${miles(2 ** bits)}${bits > 2 ? ` (con ${pot(bits - 1)} = ${miles(2 ** (bits - 1))} solo habría ${miles(corto)} hosts: no alcanza)` : ''}. Se necesitan **${bits}** bits de host.` },
        { t: `Prefijo: 32 − ${bits} = **/${p}**, máscara \`${aTexto(mascara(p))}\`, con ${miles(2 ** bits)} − 2 = **${miles(hostsUtiles(p))}** hosts asignables.`, bits: [fila('Máscara', mascara(p), p)] },
      ],
    };
  },
});

definir('misma-subred', '¿Misma subred?', {
  crear(rng, nivel) {
    const p = nivel <= 3 ? ent(rng, 20, 29) : ent(rng, 9, 23);
    const r = baseAleatoria(rng, p);
    const a = hostAleatorio(rng, r, p);
    const vecina = (r + tamano(p) * elegir(rng, [1, -1])) >>> 0;
    const b = rng() < 0.5 ? hostAleatorio(rng, r, p) : hostAleatorio(rng, red(vecina, p), p);
    return { a: aTexto(a), b: aTexto(b === a ? r + 1 + ((a - r) % (tamano(p) - 2)) : b), p };
  },
  resolver(q) {
    const a = ip(q.a);
    const b = ip(q.b);
    const ra = red(a, q.p);
    const rb = red(b, q.p);
    const misma = ra === rb;
    return {
      enunciado: `El equipo A tiene \`${aTexto(a)}\` y el equipo B tiene \`${aTexto(b)}\`. Los dos usan el prefijo **/${q.p}**. ¿Están en la misma subred?`,
      campos: [
        campo('redA', 'Red de A', 'ip', aTexto(ra)),
        campo('redB', 'Red de B', 'ip', aTexto(rb)),
        campo('misma', '¿Misma subred?', 'opcion', misma ? 0 : 1, { opciones: SI_NO }),
      ],
      pistas: [
        'Dos equipos están en la misma subred si, con la misma máscara, obtienen la misma dirección de red.',
        'Calcula la red de cada uno por separado con el número mágico.',
        'Que se parezcan los primeros octetos no basta: compara las dos direcciones de red completas.',
      ],
      pasos: [
        { t: '**Equipo A.** ' + explicaRed(a, q.p, 'A'), bits: [fila('A', a, q.p), fila('B', b, q.p)] },
        { t: '**Equipo B.** ' + explicaRed(b, q.p, 'B') },
        { t: misma
          ? `Las dos redes coinciden (\`${aTexto(ra)}\`): **sí** están en la misma subred y se comunican directamente, sin router.`
          : `Las redes son distintas (\`${aTexto(ra)}\` y \`${aTexto(rb)}\`): **no** están en la misma subred. Para comunicarse necesitan un router (su puerta de enlace).` },
      ],
    };
  },
});

const DIAGNOSTICOS = [
  'La configuración es correcta',
  'La IP del equipo es la dirección de red',
  'La IP del equipo es la dirección de broadcast',
  'La puerta de enlace está en otra subred',
  'La puerta de enlace es una dirección de red o de broadcast',
];
definir('diagnostico', 'Diagnóstico de configuración', {
  crear(rng, nivel) {
    const p = nivel <= 3 ? ent(rng, 24, 29) : ent(rng, 18, 23);
    const r = baseAleatoria(rng, p);
    const b = broadcast(r, p);
    const caso = ent(rng, 0, 4);
    const host = hostAleatorio(rng, r, p);
    const gwBueno = host === r + 1 ? b - 1 : r + 1;
    const fuera = red((r + tamano(p)) >>> 0, p) + 1;
    const [d, gw] = [[host, gwBueno], [r, gwBueno], [b, gwBueno], [host, fuera], [host, elegir(rng, [r, b])]][caso];
    return { ip: aTexto(d), p, gw: aTexto(gw) };
  },
  resolver(q) {
    const d = ip(q.ip);
    const gw = ip(q.gw);
    const a = analizar(d, q.p);
    let caso = 0;
    if (d === a.red) caso = 1;
    else if (d === a.broadcast) caso = 2;
    else if (red(gw, q.p) !== a.red) caso = 3;
    else if (gw === a.red || gw === a.broadcast) caso = 4;
    const cierre = [
      `La IP está dentro del rango asignable y la puerta de enlace \`${aTexto(gw)}\` también pertenece a esa subred sin ser la red ni el broadcast: **la configuración es correcta**.`,
      `La IP del equipo es exactamente la dirección de red: no se puede asignar a un host.`,
      `La IP del equipo es exactamente el broadcast de su subred: no se puede asignar a un host.`,
      `La puerta de enlace \`${aTexto(gw)}\` pertenece a la red \`${aTexto(red(gw, q.p))}\`, distinta de la del equipo. Un equipo solo alcanza directamente a su propia subred, así que nunca podrá llegar a ese gateway.`,
      `La puerta de enlace \`${aTexto(gw)}\` es la dirección de ${gw === a.red ? 'red' : 'broadcast'} de la subred: ningún router puede tener esa dirección.`,
    ][caso];
    return {
      enunciado: 'Un técnico configuró un equipo con estos datos. ¿Qué diagnóstico es el correcto?',
      tabla: { cab: ['Parámetro', 'Valor'], filas: [['Dirección IP', aTexto(d)], ['Máscara', `${aTexto(a.mascara)} (/${q.p})`], ['Puerta de enlace', aTexto(gw)]] },
      campos: [campo('diag', 'Diagnóstico', 'opcion', caso, { opciones: DIAGNOSTICOS })],
      pistas: [
        'Calcula la red, el broadcast y el rango asignable de la subred del equipo.',
        'La IP del equipo y la del gateway deben estar DENTRO del rango asignable de la misma subred.',
        'Revisa en este orden: ¿la IP es red o broadcast?, ¿el gateway cae en la misma red?, ¿el gateway es red o broadcast?',
      ],
      pasos: [
        { t: explicaRed(d, q.p), bits: [fila('IP', d, q.p), fila('Gateway', gw, q.p)] },
        { t: explicaBroadcast(d, q.p) + ` Rango asignable: \`${aTexto(a.primero)}\` – \`${aTexto(a.ultimo)}\`.` },
        { t: cierre },
      ],
    };
  },
});

/* =============================================================== NIVEL 4 */
/** Tabla con las primeras subredes y, si queda lejos, la número k. */
function tablaSubredes(base, p1, total, k) {
  const t = tamano(p1);
  const indices = [...new Set([1, 2, 3, 4, k - 1, k, k + 1, total].filter((n) => n >= 1 && n <= total))].sort((a, b) => a - b);
  const filas = [];
  let previo = 0;
  for (const n of indices) {
    if (n !== previo + 1) filas.push(['…', '…', '…', '…']);
    const a = analizar(base + (n - 1) * t, p1);
    filas.push([n === k ? `**${miles(n)}**` : miles(n), cidr(a.red, p1), `${aTexto(a.primero)} – ${aTexto(a.ultimo)}`, aTexto(a.broadcast)]);
    previo = n;
  }
  return { cab: ['N.º', 'Subred', 'Rango asignable', 'Broadcast'], filas };
}

function explicaSalto(base, p1, k) {
  const t = tamano(p1);
  const o = octetoInteresante(p1);
  const salto = o ? `Cada subred avanza **${o.bloque}** en el ${NOMBRE_OCTETO[o.i]} octeto` : `Cada subred ocupa ${miles(t)} direcciones (octetos completos)`;
  return `${salto}. La subred n.º ${miles(k)} está ${miles(k - 1)} bloque${k === 2 ? '' : 's'} después de la primera: ${miles(k - 1)} × ${miles(t)} = ${miles((k - 1) * t)} direcciones, `
    + `que en notación de octetos son \`${aTexto((k - 1) * t)}\`. Sumadas a la base \`${aTexto(base)}\` dan \`${aTexto(base + (k - 1) * t)}\`.`;
}

definir('flsm', 'Dividir en N subredes', {
  crear(rng, nivel) {
    const p0 = nivel <= 4 ? elegir(rng, [24, 24, 16]) : elegir(rng, [16, 16, 8, 20]);
    const s = ent(rng, 2, Math.min(nivel <= 4 ? 5 : 9, 30 - p0));
    const n = ent(rng, 2 ** (s - 1) + 1, 2 ** s);
    return { base: aTexto(baseAleatoria(rng, p0)), p0, n, k: ent(rng, 2, 2 ** s) };
  },
  resolver(q) {
    const base = red(ip(q.base), q.p0);
    let s = 1;
    while (2 ** s < q.n) s++;
    const p1 = q.p0 + s;
    const k = Math.min(q.k, 2 ** s);
    const a = analizar(base + (k - 1) * tamano(p1), p1);
    return {
      enunciado: `La red \`${cidr(base, q.p0)}\` debe dividirse en al menos **${miles(q.n)}** subredes del mismo tamaño, desperdiciando lo mínimo. Calcula el nuevo prefijo y los datos de la subred n.º **${miles(k)}** (la primera es la n.º 1).`,
      campos: [
        campo('bits', 'Bits prestados', 'numero', s),
        campo('prefijo', 'Nuevo prefijo', 'prefijo', p1),
        campo('mascara', 'Nueva máscara', 'ip', aTexto(mascara(p1))),
        campo('hosts', 'Hosts por subred', 'numero', hostsUtiles(p1)),
        campo('red', `Red de la subred ${miles(k)}`, 'ip', aTexto(a.red)),
        campo('broadcast', `Broadcast de la subred ${miles(k)}`, 'ip', aTexto(a.broadcast)),
      ],
      pistas: [
        'Busca cuántos bits s hacen falta para que 2^s alcance el número de subredes pedido.',
        `Nuevo prefijo = ${q.p0} + s. El número mágico de ese prefijo es el salto entre subredes.`,
        'La subred n.º k empieza (k − 1) saltos después de la dirección base.',
      ],
      pasos: [
        { t: `Con s bits prestados salen 2^s subredes. ${s > 1 ? `${pot(s - 1)} = ${2 ** (s - 1)} no alcanza para ${miles(q.n)}; ` : ''}${pot(s)} = ${miles(2 ** s)} sí. Se prestan **${s}** bits.` },
        { t: `Nuevo prefijo: ${q.p0} + ${s} = **/${p1}**, máscara \`${aTexto(mascara(p1))}\`. ` + explicaHosts(p1), bits: [fila('Máscara', mascara(p1), p1, q.p0)] },
        { t: explicaSalto(base, p1, k), tabla: tablaSubredes(base, p1, 2 ** s, k) },
        { t: `Subred n.º ${miles(k)}: red \`${aTexto(a.red)}\`, broadcast \`${aTexto(a.broadcast)}\`.`, bits: [fila('Red', a.red, p1, q.p0), fila('Broadcast', a.broadcast, p1, q.p0)] },
      ],
    };
  },
});

definir('flsm-hosts', 'Dividir según hosts', {
  crear(rng, nivel) {
    const p0 = nivel <= 4 ? elegir(rng, [24, 16, 22]) : elegir(rng, [16, 8, 12]);
    const bits = ent(rng, 2, Math.min(32 - p0 - 1, nivel <= 4 ? 7 : 11));
    const p1 = 32 - bits;
    return { base: aTexto(baseAleatoria(rng, p0)), p0, h: ent(rng, bits === 2 ? 2 : 2 ** (bits - 1) - 1, 2 ** bits - 2), k: ent(rng, 2, Math.min(2 ** (p1 - p0), 4096)) };
  },
  resolver(q) {
    const base = red(ip(q.base), q.p0);
    const p1 = Math.max(prefijoParaHosts(q.h), q.p0);
    const total = 2 ** (p1 - q.p0);
    const k = Math.min(q.k, total);
    const a = analizar(base + (k - 1) * tamano(p1), p1);
    const bits = 32 - p1;
    return {
      enunciado: `La red \`${cidr(base, q.p0)}\` se va a dividir en subredes iguales. Cada una debe alojar al menos **${miles(q.h)}** hosts y se quiere obtener el mayor número posible de subredes. Calcula el prefijo, cuántas subredes salen y los datos de la n.º **${miles(k)}**.`,
      campos: [
        campo('prefijo', 'Nuevo prefijo', 'prefijo', p1),
        campo('mascara', 'Nueva máscara', 'ip', aTexto(mascara(p1))),
        campo('subredes', 'Subredes que salen', 'numero', total),
        campo('red', `Red de la subred ${miles(k)}`, 'ip', aTexto(a.red)),
        campo('primero', `Primer host de la subred ${miles(k)}`, 'ip', aTexto(a.primero)),
        campo('broadcast', `Broadcast de la subred ${miles(k)}`, 'ip', aTexto(a.broadcast)),
      ],
      pistas: [
        'Empieza por los hosts: ¿cuántos bits de host hacen falta para alojar esa cantidad (más 2)?',
        'El prefijo es 32 menos los bits de host. Los bits que quedan entre el prefijo original y el nuevo numeran subredes.',
        'La subred n.º k empieza (k − 1) bloques después de la base.',
      ],
      pasos: [
        { t: `Se parte de los hosts: hacen falta ${miles(q.h)} + 2 = ${miles(q.h + 2)} direcciones. La potencia de 2 más pequeña que alcanza es ${pot(bits)} = ${miles(2 ** bits)}: **${bits}** bits de host.` },
        { t: `Prefijo: 32 − ${bits} = **/${p1}** (máscara \`${aTexto(mascara(p1))}\`). Bits prestados: ${p1} − ${q.p0} = ${p1 - q.p0}, así que salen ${pot(p1 - q.p0)} = **${miles(total)}** subredes de ${miles(hostsUtiles(p1))} hosts.`, bits: [fila('Máscara', mascara(p1), p1, q.p0)] },
        { t: explicaSalto(base, p1, k), tabla: tablaSubredes(base, p1, total, k) },
        { t: `Subred n.º ${miles(k)}: red \`${aTexto(a.red)}\`, primer host \`${aTexto(a.primero)}\`, broadcast \`${aTexto(a.broadcast)}\`.` },
      ],
    };
  },
});

const SOLAPES = ['No se solapan', 'A contiene a B', 'B contiene a A', 'Son la misma red'];
definir('solapan', '¿Se solapan?', {
  crear(rng) {
    const pa = ent(rng, 16, 27);
    const a = baseAleatoria(rng, pa);
    const caso = ent(rng, 0, 3);
    if (caso === 3) return { a: aTexto(a), pa, b: aTexto(a), pb: pa };
    if (caso === 0) {
      const pb = ent(rng, pa, 28);
      const vecina = red((a + tamano(pa) * ent(rng, 1, 2)) >>> 0, pa);
      return { a: aTexto(a), pa, b: aTexto(red(vecina + ent(rng, 0, tamano(pa) - 1), pb)), pb };
    }
    const pb = ent(rng, pa + 1, 29);
    const dentro = red(a + ent(rng, 0, tamano(pa) - 1), pb);
    return caso === 1 ? { a: aTexto(a), pa, b: aTexto(dentro), pb } : { a: aTexto(dentro), pa: pb, b: aTexto(a), pb: pa };
  },
  resolver(q) {
    const a = red(ip(q.a), q.pa);
    const b = red(ip(q.b), q.pb);
    const corto = Math.min(q.pa, q.pb);
    const caso = a === b && q.pa === q.pb ? 3 : contiene(a, q.pa, b, q.pb) ? 1 : contiene(b, q.pb, a, q.pa) ? 2 : 0;
    const [grande, chica] = q.pa <= q.pb ? ['A', 'B'] : ['B', 'A'];
    const aa = analizar(a, q.pa);
    const bb = analizar(b, q.pb);
    return {
      enunciado: `Se quieren usar a la vez la red A \`${cidr(a, q.pa)}\` y la red B \`${cidr(b, q.pb)}\`. ¿Se solapan?`,
      campos: [campo('solape', 'Relación', 'opcion', caso, { opciones: SOLAPES })],
      pistas: [
        'Escribe el rango completo de cada red: de su dirección de red a su broadcast.',
        'Dos bloques CIDR nunca se cruzan a medias: o uno está dentro del otro, o no se tocan.',
        `Aplica el prefijo más corto (/${corto}) a las dos direcciones. Si dan la misma red, la pequeña está dentro de la grande.`,
      ],
      pasos: [
        { t: 'Se escribe el rango de cada red.', tabla: { cab: ['Red', 'Desde', 'Hasta', 'Direcciones'], filas: [
          ['A ' + cidr(a, q.pa), aTexto(aa.red), aTexto(aa.broadcast), miles(aa.total)], ['B ' + cidr(b, q.pb), aTexto(bb.red), aTexto(bb.broadcast), miles(bb.total)]] } },
        { t: caso === 3 ? 'Misma dirección y mismo prefijo: es exactamente la misma red.'
          : `Atajo: se aplica el prefijo más corto (/${corto}, el de ${grande}) a la dirección de ${chica}. Resultado: \`${aTexto(red(q.pa <= q.pb ? b : a, corto))}\`, `
            + (caso === 0 ? `que es distinto de la red ${grande} (\`${aTexto(q.pa <= q.pb ? a : b)}\`).` : `que es justo la red ${grande}.`),
          bits: [fila('A', a, corto), fila('B', b, corto)] },
        { t: caso === 0 ? 'Los rangos no comparten ninguna dirección: **no se solapan** y pueden convivir.'
          : caso === 3 ? '**Son la misma red**: no pueden asignarse a dos segmentos distintos.'
          : `Todo el rango de ${chica} cae dentro del de ${grande}: **${grande} contiene a ${chica}**. No se pueden usar las dos en segmentos distintos sin crear rutas ambiguas.` },
      ],
    };
  },
});

/* ============================================================ NIVELES 5–6 */
definir('enesima', 'La subred número N', {
  crear(rng, nivel) {
    const p0 = nivel <= 5 ? 16 : elegir(rng, [8, 8, 12]);
    const p1 = nivel <= 5 ? ent(rng, 19, 27) : ent(rng, 17, 28);
    return { base: aTexto(baseAleatoria(rng, p0)), p0, p1, k: ent(rng, 5, 2 ** (p1 - p0)) };
  },
  resolver(q) {
    const base = red(ip(q.base), q.p0);
    const s = q.p1 - q.p0;
    const k = Math.min(q.k, 2 ** s);
    const a = analizar(base + (k - 1) * tamano(q.p1), q.p1);
    return {
      enunciado: `La red \`${cidr(base, q.p0)}\` se divide entera en subredes **/${q.p1}**. Calcula la subred n.º **${miles(k)}** (la primera es la n.º 1).`,
      campos: [
        campo('red', 'Dirección de red', 'ip', aTexto(a.red)),
        campo('primero', 'Primer host', 'ip', aTexto(a.primero)),
        campo('ultimo', 'Último host', 'ip', aTexto(a.ultimo)),
        campo('broadcast', 'Broadcast', 'ip', aTexto(a.broadcast)),
      ],
      pistas: [
        `La subred n.º k tiene escrito el número k − 1 en sus bits de subred (los bits ${q.p0 + 1} a ${q.p1}).`,
        `Escribe ${miles(k - 1)} en binario con ${s} bits y colócalo justo después de los ${q.p0} bits de la red original.`,
        'Otra vía: multiplica (k − 1) por el tamaño del bloque y suma ese desplazamiento a la base, octeto a octeto.',
      ],
      pasos: [
        { t: `Bits de subred: ${q.p1} − ${q.p0} = **${s}**, así que hay ${pot(s)} = ${miles(2 ** s)} subredes de ${miles(tamano(q.p1))} direcciones.` },
        { t: `La subred n.º ${miles(k)} lleva el número ${miles(k)} − 1 = **${miles(k - 1)}** en sus bits de subred. En binario con ${s} bits: \`${(k - 1).toString(2).padStart(s, '0')}\`. Se escribe a continuación de los ${q.p0} bits de red y los bits de host se dejan en 0.`,
          bits: [fila('Red', a.red, q.p1, q.p0)] },
        { t: 'Comprobación por aritmética. ' + explicaSalto(base, q.p1, k) },
        { t: explicaBroadcast(a.red, q.p1) + ` Rango asignable: \`${aTexto(a.primero)}\` – \`${aTexto(a.ultimo)}\`.`, bits: [fila('Broadcast', a.broadcast, q.p1, q.p0)] },
      ],
    };
  },
});

const AREAS = ['Ventas', 'Soporte', 'Dirección', 'Almacén', 'Ingeniería', 'Recursos Humanos', 'Invitados', 'Servidores', 'Laboratorio', 'Finanzas', 'Cámaras', 'Telefonía'];
definir('vlsm', 'Diseño con VLSM', {
  crear(rng, nivel) {
    const dificil = nivel >= 6;
    const cuantas = dificil ? ent(rng, 4, 5) : ent(rng, 3, 4);
    const nombres = [...AREAS].sort(() => rng() - 0.5).slice(0, cuantas);
    const tope = dificil ? 10 : 6;
    const reqs = nombres.map((nombre) => { const b = ent(rng, 3, tope); return { nombre, hosts: ent(rng, 2 ** (b - 1) - 1, 2 ** b - 2) }; });
    for (let i = 0; i < (dificil ? ent(rng, 2, 3) : rng() < 0.5 ? 1 : 0); i++) reqs.push({ nombre: `Enlace WAN ${i + 1}`, hosts: 2 });
    const suma = reqs.reduce((t, r) => t + tamano(prefijoParaHosts(r.hosts)), 0);
    const p0 = 32 - Math.ceil(Math.log2(suma)) - (rng() < 0.3 ? 1 : 0);
    return { base: aTexto(baseAleatoria(rng, Math.max(p0, 16))), p0: Math.max(p0, 16), reqs, ...(dificil ? { extra: true } : {}) };
  },
  resolver(q) {
    const base = red(ip(q.base), q.p0);
    const plan = vlsm(base, q.p0, q.reqs);
    if (!plan) throw new Error('VLSM: los requisitos no caben en ' + cidr(base, q.p0));
    const campos = [];
    plan.filas.forEach((f, i) => {
      campos.push(campo('red' + i, `${f.nombre} · red/prefijo`, 'red', cidr(f.red, f.p), { grupo: f.nombre }));
      campos.push(campo('bc' + i, `${f.nombre} · broadcast`, 'ip', aTexto(f.broadcast), { grupo: f.nombre }));
    });
    if (q.extra) campos.push(campo('sobran', 'Direcciones que quedan sin asignar', 'numero', plan.sobran));
    const pasos = [
      { t: 'Se ordenan los requisitos de **mayor a menor** y se calcula el bloque de cada uno: hosts + 2, redondeado hacia arriba a la siguiente potencia de 2.',
        tabla: { cab: ['Subred', 'Hosts', 'Hosts + 2', 'Bloque', 'Prefijo'], filas: plan.filas.map((f) => [f.nombre, miles(f.pedidos), miles(f.pedidos + 2), miles(f.bloque), '/' + f.p]) } },
    ];
    plan.filas.forEach((f, i) => {
      const previo = plan.filas[i - 1];
      pasos.push({ t: (i === 0 ? `**${f.nombre}** empieza en la dirección base \`${aTexto(f.red)}\`.` : `**${f.nombre}** empieza justo después del broadcast anterior (\`${aTexto(previo.broadcast)}\` + 1 = \`${aTexto(f.red)}\`).`)
        + ` Su bloque es de ${miles(f.bloque)} direcciones (/${f.p}): termina en \`${aTexto(f.red)}\` + ${miles(f.bloque)} − 1 = \`${aTexto(f.broadcast)}\`.` });
    });
    pasos.push({ t: 'Plan completo:', tabla: { cab: ['Subred', 'Red', 'Máscara', 'Rango asignable', 'Broadcast'],
      filas: plan.filas.map((f) => [f.nombre, cidr(f.red, f.p), aTexto(f.mascara), `${aTexto(f.primero)} – ${aTexto(f.ultimo)}`, aTexto(f.broadcast)]) } });
    pasos.push({ t: plan.sobran > 0
      ? `Se usaron ${miles(tamano(q.p0) - plan.sobran)} de las ${miles(tamano(q.p0))} direcciones. Quedan **${miles(plan.sobran)}** libres, a partir de \`${aTexto(plan.libre)}\`, para crecer.`
      : `Se usaron las ${miles(tamano(q.p0))} direcciones: no queda espacio libre.` });
    return {
      enunciado: `Diseña el direccionamiento de la red \`${cidr(base, q.p0)}\` con VLSM. Asigna las subredes de **mayor a menor** número de hosts, una a continuación de la otra y empezando en la dirección base (si dos empatan, respeta el orden de la tabla). Cada subred debe ser la más pequeña que sirva.`,
      tabla: { cab: ['Subred', 'Hosts necesarios'], filas: q.reqs.map((r) => [r.nombre, miles(r.hosts)]) },
      campos,
      pistas: [
        'Ordena los requisitos de mayor a menor antes de asignar nada.',
        'Para cada uno: hosts + 2 → siguiente potencia de 2 → ese es el bloque, y de ahí sale el prefijo.',
        'Cada subred empieza en la dirección siguiente al broadcast de la anterior.',
      ],
      pasos,
    };
  },
});

definir('resumen', 'Ruta resumen', {
  crear(rng, nivel) {
    if (nivel <= 5) {
      const p = elegir(rng, [24, 24, 25, 26, 23]);
      const n = elegir(rng, [2, 4, 4, 8]);
      const inicio = baseAleatoria(rng, p - Math.log2(n));
      return { redes: Array.from({ length: n }, (_, i) => ({ ip: aTexto(inicio + i * tamano(p)), p })) };
    }
    const marco = ent(rng, 18, 21);
    const zona = baseAleatoria(rng, marco);
    const redes = new Map();
    for (let i = 0, n = ent(rng, 3, 5); i < n; i++) {
      const p = ent(rng, 23, 26);
      const r = red(zona + ent(rng, 0, tamano(marco) - 1), p);
      redes.set(r + '/' + p, { ip: aTexto(r), p });
    }
    return { redes: [...redes.values()] };
  },
  resolver(q) {
    const lista = q.redes.map((r) => ({ d: red(ip(r.ip), r.p), p: r.p })).sort((a, b) => a.d - b.d);
    const s = resumen(q.redes);
    // Primer octeto donde la dirección más baja y la más alta dejan de coincidir.
    const oMin = octetos(s.min);
    const oMax = octetos(s.max);
    let i = 0;
    while (i < 3 && oMin[i] === oMax[i]) i++;
    const comunes = s.p - i * 8;
    return {
      enunciado: 'Un router conoce estas redes y quiere anunciarlas con una sola ruta. Escribe la ruta resumen más ajustada (dirección/prefijo) que las incluye a todas.',
      tabla: { cab: ['Redes a resumir'], filas: lista.map((r) => [cidr(r.d, r.p)]) },
      campos: [campo('resumen', 'Ruta resumen', 'red', cidr(s.red, s.p))],
      pistas: [
        'Toma la dirección más baja (la primera red) y la más alta (el broadcast de la última).',
        'Escríbelas en binario y cuenta cuántos bits tienen en común empezando por la izquierda.',
        'Ese número de bits comunes es el prefijo. La dirección del resumen conserva esos bits y pone el resto en 0.',
      ],
      pasos: [
        { t: `El resumen debe cubrir desde la dirección más baja, \`${aTexto(s.min)}\`, hasta la más alta, \`${aTexto(s.max)}\` (el broadcast de la última red).` },
        { t: `Los ${i === 0 ? 'octetos no coinciden desde el primero' : `${i} primeros octetos coinciden (${i * 8} bits)`}. En el ${NOMBRE_OCTETO[i]} octeto, ${oMin[i]} = \`${bin8(oMin[i])}\` y ${oMax[i]} = \`${bin8(oMax[i])}\` `
            + `comparten ${comunes === 0 ? 'ningún bit inicial' : `los ${comunes} primeros bits (\`${bin8(oMin[i]).slice(0, comunes)}\`)`}. Bits comunes en total: ${i * 8} + ${comunes} = **${s.p}**.`,
          bits: [fila('Más baja', s.min, s.p), fila('Más alta', s.max, s.p)] },
        { t: `Se conservan esos ${s.p} bits y el resto se pone en 0: ruta resumen \`${cidr(s.red, s.p)}\` (máscara \`${aTexto(mascara(s.p))}\`), que abarca de \`${aTexto(s.red)}\` a \`${aTexto(broadcast(s.red, s.p))}\`.` },
        { t: s.exacta
          ? 'El resumen cubre exactamente las redes de la lista, ni una dirección más.'
          : `Ojo: este resumen abarca ${miles(tamano(s.p))} direcciones, más de las que suman las redes de la lista. Anuncia también rangos que no están en ella; es el precio de usar una sola ruta, y hay que comprobar que esos rangos de más no existan en otra parte de la red.` },
      ],
    };
  },
});

/* ============================================================ conceptual */
// Preguntas escritas a mano (lecciones y banco de examen). La explicación va en
// `porque` (un párrafo) o en `pasos` (razonamiento por pasos: textos o { t, tabla }).
// Admiten `tabla`, `codigo` (una salida de consola) y `figura` (un diagrama) junto al enunciado.
const razonamiento = (q) => [...(q.pasos ?? []).map((x) => (typeof x === 'string' ? { t: x } : x)), ...(q.porque ? [{ t: q.porque }] : [])];
const base = (q) => ({ enunciado: q.pregunta, ...(q.tabla ? { tabla: q.tabla } : {}), ...(q.codigo ? { codigo: q.codigo } : {}), ...(q.figura ? { figura: q.figura } : {}), pistas: q.pistas ?? [], pasos: razonamiento(q) });
const alfabetico = (lista) => [...new Set(lista)].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));

definir('opcion', 'Pregunta de concepto', {
  resolver: (q) => ({ ...base(q), campos: [campo('r', 'Respuesta', 'opcion', q.correcta, { opciones: q.opciones, lista: true })] }),
});

/** Varias respuestas correctas («elige dos»). correctas = índices. */
definir('varias', 'Varias respuestas', {
  resolver(q) {
    const correctas = [...q.correctas].sort((a, b) => a - b);
    const n = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco'][correctas.length] ?? correctas.length;
    return { ...base(q), campos: [campo('r', `Elige ${n}`, 'multi', correctas, { opciones: q.opciones })] };
  },
});

/** Relacionar: pares = [[concepto, respuesta], …]; extra = respuestas que sobran (distractores). */
definir('relacionar', 'Relacionar', {
  resolver(q) {
    const opciones = alfabetico([...q.pares.map(([, d]) => d), ...(q.extra ?? [])]);
    return { ...base(q), campos: q.pares.map(([izq, der], i) => campo('r' + i, izq, 'opcion', opciones.indexOf(der), { opciones, desplegable: true })) };
  },
});

/** Ordenar: orden = los elementos en el orden correcto. */
definir('ordenar', 'Ordenar', {
  resolver(q) {
    const opciones = alfabetico(q.orden);
    return { ...base(q), campos: q.orden.map((x, i) => campo('r' + i, `${i + 1}.º`, 'opcion', opciones.indexOf(x), { opciones, desplegable: true })) };
  },
});

/** Marcador de nivel: «una pregunta del banco del módulo» (la elige motor.js). */
definir('banco', 'Preguntas tipo examen', {});
