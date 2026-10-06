/**
 * Academia de Redes · Tipos de ejercicio de infraestructura (switches y routers)
 * ---------------------------------------------------------------------
 * Mismo contrato que tipos.js: crear(rng, nivel) → parámetros y
 * resolver(params) → { enunciado, tabla?, campos, pistas, pasos }.
 * Cubre el dominio 4 del CCST Networking: dispositivos, puertos y LED,
 * tabla MAC, ARP y puerta de enlace, tabla de enrutamiento y Cisco IOS.
 */
import { definir, campo, ent, elegir, niveles } from './tipos.js';
import { ip, aTexto, mascara, red, broadcast, tamano, miles } from './ip.js';

const cidr = (d, p) => aTexto(d) + '/' + p;
const plural = (n, uno, varios) => `${miles(n)} ${n === 1 ? uno : varios}`;
const hex = (rng, n) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(rng() * 16)]).join('');
/** MAC aleatoria en formato Cisco (0050.7966.68a1), con un fabricante verosímil. */
const macAzar = (rng) => `${elegir(rng, ['0050', '001a', '00d0', '0c1e', '5254', '0090'])}.${hex(rng, 4)}.${hex(rng, 4)}`;
function macsDistintas(rng, n) {
  const s = new Set();
  while (s.size < n) s.add(macAzar(rng));
  return [...s];
}
const LETRAS = 'ABCDEFGH';
const DIFUSION = 'ffff.ffff.ffff';

/* ======================================================== if-dominios */
// ramas: cada rama es una cadena de equipos ({ t: 'switch' | 'hub', pcs }) que cuelga de una
// interfaz del router (o, sin router, la única rama es toda la red).
function contarDominios(q) {
  // Cada enlace es un nodo; un hub fusiona todos sus enlaces en un mismo dominio de colisión.
  const padre = [];
  const nuevo = () => { padre.push(padre.length); return padre.length - 1; };
  const raiz = (x) => { while (padre[x] !== x) x = padre[x]; return x; };
  const unir = (a, b) => { padre[raiz(a)] = raiz(b); };
  const detalle = [];
  let sw = 0, hub = 0;
  q.ramas.forEach((rama, r) => {
    let previo = q.router ? nuevo() : null;   // enlace router – primer equipo
    let anterior = q.router ? `R1 (interfaz G0/${r})` : null;
    rama.forEach((eq, i) => {
      const nombre = eq.t === 'hub' ? `HUB${++hub}` : `SW${++sw}`;
      const enlaces = [];
      if (previo !== null) enlaces.push(previo);
      for (let k = 0; k < eq.pcs; k++) enlaces.push(nuevo());
      const siguiente = i < rama.length - 1 ? nuevo() : null;
      if (siguiente !== null) enlaces.push(siguiente);
      if (eq.t === 'hub') for (let k = 1; k < enlaces.length; k++) unir(enlaces[0], enlaces[k]);
      detalle.push({ nombre, t: eq.t, pcs: eq.pcs, a: anterior, enlaces: enlaces.length });
      previo = siguiente;
      anterior = nombre;
    });
  });
  const colision = new Set(padre.map((_, i) => raiz(i))).size;
  return { colision, broadcast: q.router ? q.ramas.length : 1, detalle };
}
definir('if-dominios', 'Dominios de colisión y de broadcast', {
  crear(rng, nivel) {
    const facil = nivel <= 1;
    const router = facil ? rng() < 0.5 : rng() < 0.8;
    const cuantas = router ? ent(rng, facil ? 1 : 2, facil ? 2 : 3) : 1;
    const ramas = Array.from({ length: cuantas }, () => {
      const largo = facil ? 1 : ent(rng, 1, 2);
      return Array.from({ length: largo }, () => ({ t: rng() < (facil ? 0.3 : 0.45) ? 'hub' : 'switch', pcs: ent(rng, 2, facil ? 4 : 6) }));
    });
    return { router, ramas };
  },
  resolver(q) {
    const r = contarDominios(q);
    const filas = [];
    if (q.router) filas.push(['R1', 'Router', `${plural(q.ramas.length, 'interfaz LAN en uso', 'interfaces LAN en uso')}`, '—']);
    for (const d of r.detalle) filas.push([d.nombre, d.t === 'hub' ? 'Hub' : 'Switch', d.a ?? '(es el equipo principal)', String(d.pcs)]);
    const pasosCol = r.detalle.map((d) => (d.t === 'hub'
      ? `**${d.nombre}** es un hub: repite la señal por todos sus puertos, así que sus ${d.enlaces} enlaces (${d.pcs} computadoras${d.enlaces > d.pcs ? ' y los enlaces hacia otros equipos' : ''}) forman **un solo** dominio de colisión.`
      : `**${d.nombre}** es un switch: cada uno de sus ${d.enlaces} puertos en uso es un dominio de colisión propio (salvo los que llevan a un hub, que se cuentan con el hub).`));
    return {
      enunciado: `Una red está montada como indica la tabla. Todos los switches son de capa 2 y no tienen VLAN configuradas. ¿Cuántos **dominios de colisión** y cuántos **dominios de broadcast** hay?`,
      tabla: { cab: ['Equipo', 'Tipo', 'Conectado a', 'Computadoras conectadas'], filas },
      campos: [campo('colision', 'Dominios de colisión', 'numero', r.colision), campo('broadcast', 'Dominios de broadcast', 'numero', r.broadcast)],
      pistas: [
        'Un hub no separa nada: todo lo que cuelga de él comparte un dominio de colisión. Un switch separa un dominio de colisión por puerto.',
        'Solo el router separa dominios de broadcast: uno por cada interfaz suya con una red conectada.',
        'Cuenta los enlaces (cables). Cada cable entre dos equipos que no sean hubs es un dominio de colisión; todos los cables de un mismo hub cuentan como uno.',
      ],
      pasos: [
        { t: 'Regla para los dominios de **colisión**: cada puerto de un switch o de un router es un dominio aparte; un hub junta todos sus puertos en uno solo.' },
        ...pasosCol.map((t) => ({ t })),
        { t: `Contando cada cable una sola vez y agrupando los de cada hub: **${r.colision}** ${r.colision === 1 ? 'dominio' : 'dominios'} de colisión.` },
        { t: q.router
          ? `Regla para los dominios de **broadcast**: ni los hubs ni los switches de capa 2 detienen un broadcast; solo el router. R1 usa ${plural(q.ramas.length, 'interfaz', 'interfaces')}, y cada interfaz es una red distinta: **${r.broadcast}** ${r.broadcast === 1 ? 'dominio' : 'dominios'} de broadcast.`
          : 'Regla para los dominios de **broadcast**: ni los hubs ni los switches de capa 2 detienen un broadcast; solo un router. Aquí no hay router, así que toda la red es **1** dominio de broadcast.' },
      ],
    };
  },
});

/* ========================================================== if-switch */
const ACCIONES = ['La reenvía por un solo puerto', 'La inunda: sale por todos los puertos menos el de entrada', 'La descarta (filtra): no sale por ningún puerto'];
const APRENDE = ['Añade una entrada nueva: MAC de origen → puerto de entrada', 'No añade nada: ya conocía esa MAC en ese puerto (solo reinicia su temporizador)', 'Actualiza la entrada: esa MAC estaba anotada en otro puerto'];
const pto = (n) => `Fa0/${n}`;
definir('if-switch', '¿Qué hace el switch con la trama?', {
  crear(rng, nivel) {
    const puertos = ent(rng, 6, 8);
    const cuantas = ent(rng, 3, 4);
    const macs = macsDistintas(rng, cuantas + 2);
    const usados = [];
    const tabla = macs.slice(0, cuantas).map((mac) => {
      // A partir del nivel 4 puede haber dos MAC en el mismo puerto (un hub u otro switch detrás).
      const repetir = nivel >= 4 && usados.length && rng() < 0.35;
      const puerto = repetir ? elegir(rng, usados) : elegir(rng, Array.from({ length: puertos }, (_, i) => i + 1).filter((x) => !usados.includes(x)));
      usados.push(puerto);
      return { mac, puerto };
    });
    const casoOrigen = ent(rng, 0, nivel >= 4 ? 2 : 1);   // 0 nueva, 1 conocida, 2 movida
    const casoDestino = elegir(rng, nivel >= 4 ? [0, 0, 1, 1, 2, 3] : [0, 0, 1, 1, 2]);   // 0 conocida, 1 desconocida, 2 broadcast, 3 mismo puerto
    let origen, entrada;
    if (casoOrigen === 0) { origen = macs[cuantas]; entrada = ent(rng, 1, puertos); }
    else {
      const e = elegir(rng, tabla);
      origen = e.mac;
      entrada = casoOrigen === 1 ? e.puerto : elegir(rng, Array.from({ length: puertos }, (_, i) => i + 1).filter((x) => x !== e.puerto));
    }
    let destino;
    const otras = tabla.filter((e) => e.mac !== origen);
    const mismas = otras.filter((e) => e.puerto === entrada);
    const fuera = otras.filter((e) => e.puerto !== entrada);
    if (casoDestino === 3 && mismas.length) destino = mismas[0].mac;
    else if (casoDestino === 2) destino = DIFUSION;
    else if (casoDestino === 1 || !fuera.length) destino = macs[cuantas + 1];
    else destino = elegir(rng, fuera).mac;
    return { puertos, tabla, trama: { origen, destino, entrada } };
  },
  resolver(q) {
    const { origen, destino, entrada } = q.trama;
    const previa = q.tabla.find((e) => e.mac === origen);
    const aprende = !previa ? 0 : previa.puerto === entrada ? 1 : 2;
    const dest = destino === DIFUSION ? null : q.tabla.find((e) => e.mac === destino);
    let accion, salen, explica;
    if (destino === DIFUSION) {
      accion = 1; salen = q.puertos - 1;
      explica = `La MAC de destino es \`${DIFUSION}\`, la dirección de **broadcast**: va dirigida a todos. Un broadcast nunca está en la tabla; el switch lo **inunda** por los ${q.puertos - 1} puertos restantes.`;
    } else if (!dest) {
      accion = 1; salen = q.puertos - 1;
      explica = `La MAC de destino \`${destino}\` **no está en la tabla** (unicast desconocido). El switch no sabe dónde vive ese equipo, así que **inunda** la trama por todos los puertos menos el de entrada: ${q.puertos} − 1 = **${q.puertos - 1}** puertos.`;
    } else if (dest.puerto === entrada) {
      accion = 2; salen = 0;
      explica = `La MAC de destino \`${destino}\` está en la tabla, en ${pto(dest.puerto)}: **el mismo puerto por el que entró la trama**. El destino está del mismo lado que el origen (hay un hub u otro switch en ese puerto) y ya recibió la trama. El switch la **descarta**: sale por **0** puertos.`;
    } else {
      accion = 0; salen = 1;
      explica = `La MAC de destino \`${destino}\` está en la tabla, en **${pto(dest.puerto)}**. El switch **reenvía** la trama solo por ese puerto: **1** puerto. Los demás equipos no la ven.`;
    }
    return {
      enunciado: `Un switch de ${q.puertos} puertos (Fa0/1 a Fa0/${q.puertos}), todos con un equipo conectado y en la misma VLAN, tiene la tabla de direcciones MAC que se muestra. Por **${pto(entrada)}** entra una trama con MAC de origen \`${origen}\` y MAC de destino \`${destino}\`. ¿Qué hace el switch?`,
      tabla: { cab: ['Dirección MAC', 'Puerto'], filas: q.tabla.map((e) => [e.mac, pto(e.puerto)]) },
      campos: [
        campo('aprende', 'Con la MAC de origen', 'opcion', aprende, { opciones: APRENDE, lista: true }),
        campo('accion', 'Con la trama', 'opcion', accion, { opciones: ACCIONES, lista: true }),
        campo('salen', '¿Por cuántos puertos sale?', 'numero', salen),
      ],
      pistas: [
        'El switch hace siempre dos cosas, en este orden: primero **aprende** mirando la MAC de origen y después **decide** mirando la MAC de destino.',
        'Busca la MAC de destino en la tabla. Si no está (o es ffff.ffff.ffff), inunda. Si está, reenvía solo por su puerto.',
        'Caso especial: si el puerto del destino es el mismo por el que entró la trama, el switch no la reenvía.',
      ],
      pasos: [
        { t: [`**Aprender.** La MAC de origen \`${origen}\` no estaba en la tabla. El switch anota: \`${origen}\` → ${pto(entrada)}. Ahora sabe por dónde se llega a ese equipo.`,
          `**Aprender.** La MAC de origen \`${origen}\` ya estaba anotada en ${pto(entrada)}, el mismo puerto. No hay nada nuevo: solo se reinicia su temporizador de envejecimiento (300 segundos por defecto).`,
          `**Aprender.** La MAC de origen \`${origen}\` estaba anotada en ${pto(previa?.puerto ?? 0)}, pero la trama llegó por ${pto(entrada)}: el equipo cambió de puerto. El switch **actualiza** la entrada a ${pto(entrada)}.`][aprende] },
        { t: '**Decidir.** ' + explica },
      ],
    };
  },
});

/* ======================================================= if-tabla-mac */
definir('if-tabla-mac', 'La tabla MAC, trama a trama', {
  crear(rng, nivel) {
    const puertos = ent(rng, 5, 8);
    const n = ent(rng, 3, nivel >= 4 ? 5 : 4);
    const macs = macsDistintas(rng, n);
    const libres = Array.from({ length: puertos }, (_, i) => i + 1).sort(() => rng() - 0.5);
    const equipos = macs.map((mac, i) => ({ n: 'PC-' + LETRAS[i], mac, puerto: libres[i] }));
    // Desde el nivel 4, dos computadoras pueden compartir puerto a través de un hub.
    if (nivel >= 4 && rng() < 0.5) equipos[n - 1].puerto = equipos[0].puerto;
    const cuantas = ent(rng, 3, nivel >= 4 ? 5 : 4);
    const tramas = Array.from({ length: cuantas }, () => {
      const o = ent(rng, 0, n - 1);
      const r = rng();
      const d = r < 0.2 ? -1 : elegir(rng, equipos.map((_, i) => i).filter((i) => i !== o));
      return [o, d];
    });
    return { puertos, equipos, tramas };
  },
  resolver(q) {
    const tabla = new Map();
    const filas = [];
    let ultimas = 0;
    q.tramas.forEach(([o, d], k) => {
      const origen = q.equipos[o];
      const nueva = !tabla.has(origen.mac);
      tabla.set(origen.mac, origen.puerto);
      let accion, salen;
      if (d === -1) { accion = 'Broadcast: inunda'; salen = q.puertos - 1; }
      else {
        const destino = q.equipos[d];
        if (!tabla.has(destino.mac)) { accion = `No conoce a ${destino.n}: inunda`; salen = q.puertos - 1; }
        else if (tabla.get(destino.mac) === origen.puerto) { accion = `${destino.n} está en el mismo puerto: descarta`; salen = 0; }
        else { accion = `Conoce a ${destino.n} en ${pto(destino.puerto)}: reenvía`; salen = 1; }
      }
      ultimas = salen;
      filas.push([String(k + 1), `${origen.n} → ${d === -1 ? 'broadcast' : q.equipos[d].n}`, nueva ? `Sí: ${origen.n} en ${pto(origen.puerto)}` : 'No (ya la tenía)', accion, String(salen), String(tabla.size)]);
    });
    const comparten = q.equipos.some((e, i) => q.equipos.some((f, j) => j !== i && f.puerto === e.puerto));
    return {
      enunciado: `Un switch de ${q.puertos} puertos acaba de encenderse: su tabla de direcciones MAC está **vacía**. Todos sus puertos tienen algún equipo conectado y están en la misma VLAN${comparten ? ' (dos de las computadoras de la tabla comparten puerto porque cuelgan de un hub)' : ''}. Las computadoras envían, en este orden, las tramas: ${q.tramas.map(([o, d], k) => `**${k + 1})** ${q.equipos[o].n} → ${d === -1 ? 'broadcast' : q.equipos[d].n}`).join(', ')}. ¿Por cuántos puertos sale la **última** trama y cuántas entradas tiene la tabla al terminar?`,
      tabla: { cab: ['Equipo', 'Dirección MAC', 'Puerto del switch'], filas: q.equipos.map((e) => [e.n, e.mac, pto(e.puerto)]) },
      campos: [campo('salen', 'Puertos por los que sale la última trama', 'numero', ultimas), campo('entradas', 'Entradas en la tabla al final', 'numero', tabla.size)],
      pistas: [
        'El switch solo aprende la MAC de **origen** de cada trama. La de destino nunca se aprende.',
        'Si el destino todavía no envió nada, el switch no lo conoce e inunda por todos los puertos menos el de entrada.',
        'Haz una tabla: en cada trama anota qué aprende el switch y si, en ese momento, ya conoce al destino.',
      ],
      pasos: [
        { t: `Se sigue cada trama en orden. En cada una, el switch primero aprende el origen y luego busca el destino. Inundar significa salir por ${q.puertos} − 1 = ${q.puertos - 1} puertos.`,
          tabla: { cab: ['Trama', 'Origen → destino', '¿Aprende algo?', 'Qué hace', 'Puertos de salida', 'Entradas en la tabla'], filas } },
        { t: `La última trama sale por **${ultimas}** ${ultimas === 1 ? 'puerto' : 'puertos'}.` },
        { t: `La tabla termina con **${tabla.size}** ${tabla.size === 1 ? 'entrada' : 'entradas'}: una por cada computadora que envió al menos una trama (${[...tabla.keys()].map((m) => q.equipos.find((e) => e.mac === m).n).join(', ')}). Las que solo recibieron no aparecen.` },
      ],
    };
  },
});

/* ==================================================== if-local-remoto */
const DONDE = ['En la misma red (destino local)', 'En otra red (destino remoto)'];
const DEQUIEN = ['La MAC del equipo de destino', 'La MAC de la puerta de enlace (el router)'];
definir('if-local-remoto', '¿Local o remoto?', {
  crear(rng, nivel) {
    const p = nivel <= 4 ? elegir(rng, [24, 24, 25, 26, 27]) : elegir(rng, [20, 22, 23, 25, 26, 27, 28]);
    const base = ip(elegir(rng, ['192.168.0.0', '172.16.0.0', '10.10.0.0'])) + ent(rng, 0, 2 ** (p - 16) - 1) * tamano(p);
    const r = red(base, p);
    const t = tamano(p);
    const origen = r + ent(rng, 2, t - 3);
    const gw = rng() < 0.6 ? r + 1 : r + t - 2;
    const caso = ent(rng, 0, 3);
    let destino;
    if (caso <= 1) { do destino = r + ent(rng, 2, t - 3); while (destino === origen || destino === gw); }   // misma subred
    else if (caso === 2) destino = ((r + t * elegir(rng, [1, 1, 2, -1])) >>> 0) + ent(rng, 1, t - 2);          // subred vecina: parece local
    else destino = ip(elegir(rng, ['8.8.8.8', '1.1.1.1', '142.250.72.14', '200.33.146.201', '172.31.5.9']));
    if (red(destino, p) === r && (destino === r || destino === broadcast(r, p))) destino = r + 2 === origen ? r + 3 : r + 2;
    return { origen: aTexto(origen), p, gw: aTexto(gw), destino: aTexto(destino) };
  },
  resolver(q) {
    const o = ip(q.origen), d = ip(q.destino);
    const r = red(o, q.p), b = broadcast(o, q.p);
    const local = red(d, q.p) === r;
    return {
      enunciado: `Una computadora tiene la dirección \`${q.origen}\`, la máscara \`${aTexto(mascara(q.p))}\` (/${q.p}) y la puerta de enlace \`${q.gw}\`. Quiere enviar un paquete a \`${q.destino}\`. ¿El destino está en su red? ¿Por qué dirección IP pregunta con ARP? ¿De quién es la MAC de destino de la trama que envía?`,
      campos: [
        campo('red', 'Red de la computadora', 'red', cidr(r, q.p)),
        campo('donde', 'El destino está', 'opcion', local ? 0 : 1, { opciones: DONDE, lista: true }),
        campo('arp', 'Hace ARP preguntando por la IP', 'ip', local ? q.destino : q.gw),
        campo('mac', 'La MAC de destino de la trama es', 'opcion', local ? 0 : 1, { opciones: DEQUIEN, lista: true }),
      ],
      pistas: [
        'La computadora aplica **su propia máscara** a su IP y a la IP de destino. Si las dos dan la misma red, el destino es local.',
        `Calcula el rango de la red de la computadora con /${q.p} y mira si \`${q.destino}\` cae dentro.`,
        'Destino local: ARP por la IP del destino. Destino remoto: ARP por la IP de la puerta de enlace, y la trama va a la MAC del router.',
      ],
      pasos: [
        { t: `La computadora calcula su red: \`${q.origen}\` con /${q.p} pertenece a \`${cidr(r, q.p)}\`, que va de \`${aTexto(r)}\` a \`${aTexto(b)}\`.`,
          bits: [{ et: 'Origen', ip: q.origen, p: q.p }, { et: 'Destino', ip: q.destino, p: q.p }] },
        { t: local
          ? `El destino \`${q.destino}\` **está dentro** de ese rango (con la misma máscara da la misma red, \`${aTexto(r)}\`). Es un destino **local**: se puede entregar directamente, sin router.`
          : `El destino \`${q.destino}\` **no está** en ese rango (con la misma máscara da la red \`${aTexto(red(d, q.p))}\`, distinta de \`${aTexto(r)}\`). Es un destino **remoto**: hay que pasar por el router.` },
        { t: local
          ? `Para entregar la trama necesita la MAC del destino. Envía una petición ARP (broadcast): «¿quién tiene \`${q.destino}\`?». El propio destino responde con su MAC.`
          : `La computadora no hace ARP por una IP de otra red: el broadcast no saldría de la suya. Pregunta por su puerta de enlace: «¿quién tiene \`${q.gw}\`?». Responde el router con la MAC de su interfaz.` },
        { t: local
          ? `La trama lleva como MAC de destino la **del equipo de destino**, e IP de destino \`${q.destino}\`.`
          : `La trama lleva como MAC de destino la **del router**, pero el paquete que va dentro conserva la IP de destino \`${q.destino}\`. La MAC dice «siguiente parada»; la IP dice «destino final».` },
      ],
    };
  },
});

/* ============================================================ if-ruta */
const CODIGOS = { C: 'Conectada', S: 'Estática', 'S*': 'Estática por defecto', O: 'OSPF' };
const textoRuta = (r) => `${r.cod} ${r.red}/${r.p}${r.via ? ` vía ${r.via}` : ' directamente conectada'}, ${r.iface}`;
definir('if-ruta', '¿Qué ruta usa el router?', {
  crear(rng, nivel) {
    const destino = ip(`${elegir(rng, ['10', '172', '192'])}.${ent(rng, 16, 200)}.${ent(rng, 1, 250)}.${ent(rng, 1, 254)}`);
    const rutas = [];
    const claves = new Set();
    const ifaces = ['G0/0', 'G0/1', 'G0/2', 'S0/0/0', 'S0/0/1'];
    const via = () => `10.255.${ent(rng, 0, 9)}.${ent(rng, 1, 254)}`;
    const poner = (d, p, cod) => {
      const r = red(d, p);
      const k = r + '/' + p;
      if (claves.has(k)) return;
      claves.add(k);
      rutas.push({ red: aTexto(r), p, cod, ...(cod === 'C' ? {} : { via: via() }), iface: ifaces[rutas.length % ifaces.length] });
    };
    // Rutas que contienen al destino, con prefijos distintos.
    const contienen = nivel >= 6 ? ent(rng, 2, 3) : ent(rng, 0, 2);
    const prefijos = [8, 12, 16, 20, 22, 24, 25, 26, 27, 28].sort(() => rng() - 0.5).slice(0, contienen);
    for (const p of prefijos) poner(destino, p, p >= 24 && rng() < 0.4 ? 'C' : elegir(rng, ['S', 'O']));
    // Rutas vecinas que NO lo contienen (se parecen).
    for (let i = 0; i < 3; i++) {
      const p = elegir(rng, [16, 24, 24, 26, 27]);
      const vecino = (red(destino, p) + tamano(p) * elegir(rng, [1, -1, 2, 3])) >>> 0;
      if (red(destino, p) !== red(vecino, p)) poner(vecino, p, elegir(rng, ['C', 'S', 'O']));
    }
    if (rng() < 0.7) { claves.add('0/0'); rutas.push({ red: '0.0.0.0', p: 0, cod: 'S*', via: via(), iface: 'S0/0/0' }); }
    rutas.sort(() => rng() - 0.5);
    return { destino: aTexto(destino), rutas };
  },
  resolver(q) {
    const d = ip(q.destino);
    const cumple = q.rutas.map((r) => red(d, r.p) === ip(r.red));
    const candidatas = q.rutas.filter((_, i) => cumple[i]);
    const mejor = candidatas.reduce((a, b) => (!a || b.p > a.p ? b : a), null);
    const opciones = [...q.rutas.map(textoRuta), 'Ninguna: descarta el paquete'];
    const valor = mejor ? q.rutas.indexOf(mejor) : q.rutas.length;
    const rango = (r) => (r.p === 0 ? 'todas las direcciones' : `${aTexto(ip(r.red))} – ${aTexto(broadcast(ip(r.red), r.p))}`);
    return {
      enunciado: `Un router tiene la tabla de enrutamiento de abajo y recibe un paquete con IP de destino \`${q.destino}\`. ¿Cuántas rutas de la tabla coinciden con ese destino y cuál usa el router?`,
      tabla: { cab: ['Código', 'Red de destino', 'Siguiente salto', 'Interfaz de salida'], filas: q.rutas.map((r) => [r.cod, `${r.red}/${r.p}`, r.via ?? 'directamente conectada', r.iface]) },
      campos: [campo('cuantas', 'Rutas que coinciden', 'numero', candidatas.length), campo('ruta', 'Ruta que usa', 'opcion', valor, { opciones, lista: true })],
      pistas: [
        'Una ruta coincide si la IP de destino cae dentro de su red: aplica la máscara de la ruta al destino y compara.',
        'La ruta por defecto `0.0.0.0/0` coincide con cualquier destino, pero con 0 bits: es siempre la última opción.',
        'Si coinciden varias, gana la del **prefijo más largo** (la más específica), sin importar el orden ni el código.',
      ],
      pasos: [
        { t: `Se comprueba cada ruta: ¿\`${q.destino}\` cae dentro de su rango?`,
          tabla: { cab: ['Ruta', 'Rango que cubre', `¿Contiene a ${q.destino}?`], filas: q.rutas.map((r, i) => [`${r.cod} ${r.red}/${r.p}`, rango(r), cumple[i] ? `**Sí** (${r.p} bits coinciden)` : 'No']) } },
        { t: candidatas.length === 0
          ? 'Ninguna ruta coincide y la tabla **no tiene ruta por defecto**. El router no sabe adónde enviar el paquete: lo **descarta** y avisa al origen con un mensaje ICMP de destino inalcanzable.'
          : candidatas.length === 1
            ? `Solo coincide **1** ruta: \`${mejor.red}/${mejor.p}\`. No hay nada que desempatar.`
            : `Coinciden **${candidatas.length}** rutas (${candidatas.map((r) => `/${r.p}`).join(', ')}). Se aplica la regla de la **coincidencia más larga**: gana la de prefijo mayor, **/${mejor.p}**, porque describe al destino con más precisión.` },
        ...(mejor ? [{ t: mejor.via
          ? `El router usa \`${CODIGOS[mejor.cod].toLowerCase()} ${mejor.red}/${mejor.p}\`: reenvía el paquete al siguiente salto \`${mejor.via}\` por la interfaz **${mejor.iface}**.${mejor.p === 0 ? ' Es la ruta por defecto: la «salida para todo lo que no conozco».' : ''}`
          : `El router usa la ruta conectada \`${mejor.red}/${mejor.p}\`: el destino está en una red pegada a su interfaz **${mejor.iface}**. Hace ARP por \`${q.destino}\` y entrega el paquete directamente, sin otro router.` }] : []),
      ],
    };
  },
});

/* =========================================================== if-salto */
// PC – R1 [– R2] – Servidor. tramo: 1 = PC→R1, 2 = R1→(R2 o servidor), 3 = R2→servidor.
definir('if-salto', 'Direcciones en cada tramo', {
  crear(rng, nivel) {
    const routers = nivel >= 6 ? 2 : ent(rng, 1, 2);
    const macs = macsDistintas(rng, 2 + routers * 2);
    const a = ent(rng, 1, 250), b = ent(rng, 1, 250);
    return {
      routers, tramo: ent(rng, 1, routers + 1), ttl: elegir(rng, [64, 128, 255]),
      pc: { ip: `192.168.${a}.${ent(rng, 10, 200)}`, mac: macs[0] },
      srv: { ip: `172.16.${b}.${ent(rng, 10, 200)}`, mac: macs[1] },
      r: Array.from({ length: routers }, (_, i) => ({ ent: macs[2 + i * 2], sal: macs[3 + i * 2] })),
    };
  },
  resolver(q) {
    // Nodos de la cadena con la MAC que usa cada uno hacia cada lado.
    const nodos = [{ n: 'PC', sal: q.pc.mac }, ...q.r.map((r, i) => ({ n: `R${i + 1}`, ent: r.ent, sal: r.sal })), { n: 'Servidor', ent: q.srv.mac }];
    const de = nodos[q.tramo - 1], a = nodos[q.tramo];
    const ttl = q.ttl - (q.tramo - 1);
    const filas = [['PC', q.pc.ip, q.pc.mac, 'Origen del paquete']];
    q.r.forEach((r, i) => {
      filas.push([`R${i + 1}, interfaz G0/0`, i === 0 ? q.pc.ip.replace(/\.\d+$/, '.1') : `10.0.${i}.2`, r.ent, i === 0 ? 'Hacia la red del PC' : `Hacia R${i}`]);
      filas.push([`R${i + 1}, interfaz G0/1`, i === q.routers - 1 ? q.srv.ip.replace(/\.\d+$/, '.1') : `10.0.${i + 1}.1`, r.sal, i === q.routers - 1 ? 'Hacia la red del servidor' : `Hacia R${i + 2}`]);
    });
    filas.push(['Servidor', q.srv.ip, q.srv.mac, 'Destino del paquete']);
    const camino = nodos.map((x) => x.n).join(' → ');
    return {
      enunciado: `El PC envía un paquete al servidor siguiendo el camino **${camino}**. El PC lo crea con TTL ${q.ttl}. Observa el paquete mientras viaja por el tramo **${de.n} → ${a.n}**: ¿qué direcciones MAC e IP lleva y cuánto vale el TTL?`,
      tabla: { cab: ['Equipo o interfaz', 'Dirección IP', 'Dirección MAC', 'Mira hacia'], filas },
      campos: [
        campo('macO', 'MAC de origen', 'mac', de.sal),
        campo('macD', 'MAC de destino', 'mac', a.ent),
        campo('ipO', 'IP de origen', 'ip', q.pc.ip),
        campo('ipD', 'IP de destino', 'ip', q.srv.ip),
        campo('ttl', 'TTL en ese tramo', 'numero', ttl),
      ],
      pistas: [
        'Las direcciones IP del paquete **no cambian** en todo el viaje: son las del origen y el destino finales.',
        'Las direcciones MAC solo sirven dentro de cada tramo: son las de las dos interfaces que están en los extremos de ese cable.',
        'Cada router que reenvía el paquete le resta 1 al TTL antes de enviarlo.',
      ],
      pasos: [
        { t: `**Direcciones IP.** Identifican los extremos de la conversación y viajan intactas: origen \`${q.pc.ip}\` (el PC) y destino \`${q.srv.ip}\` (el servidor), en todos los tramos. Las IP de las interfaces de los routers no aparecen en el paquete.` },
        { t: `**Direcciones MAC.** Cada router quita la trama que recibió y construye una nueva para el siguiente tramo. En ${de.n} → ${a.n}, la trama sale de ${de.n}${de.ent ? ' por su interfaz G0/1' : ''} (MAC \`${de.sal}\`) y va a ${a.n}${a.sal ? ', interfaz G0/0' : ''} (MAC \`${a.ent}\`).` },
        { t: q.tramo === 1
          ? `**TTL.** En el primer tramo todavía no ha pasado por ningún router: sigue valiendo **${q.ttl}**.`
          : `**TTL.** Antes de este tramo el paquete ya fue reenviado por ${plural(q.tramo - 1, 'router', 'routers')}, y cada uno restó 1: ${q.ttl} − ${q.tramo - 1} = **${ttl}**.` },
      ],
    };
  },
});

/* ============================================================ if-modo */
const MODOS = [
  'EXEC de usuario: `Switch>`',
  'EXEC privilegiado: `Switch#`',
  'Configuración global: `Switch(config)#`',
  'Configuración de interfaz: `Switch(config-if)#`',
  'Configuración de línea: `Switch(config-line)#`',
];
// [comando, modo, explicación]
const DONDE_VA = {
  enable: ['enable', 0, 'Se escribe en el modo de usuario para subir al modo privilegiado.'],
  ping: ['show version', 0, 'Los comandos `show` básicos, como este, ya funcionan en el modo de usuario (y también en el privilegiado).'],
  conft: ['configure terminal', 1, 'Solo desde el modo privilegiado se puede entrar a configurar.'],
  showrun: ['show running-config', 1, 'Ver la configuración completa exige el modo privilegiado: en el modo de usuario el comando no existe.'],
  copy: ['copy running-config startup-config', 1, 'Guardar la configuración es una tarea del modo privilegiado.'],
  reload: ['reload', 1, 'Reiniciar el equipo solo se permite en el modo privilegiado.'],
  hostname: ['hostname SW-PISO1', 2, 'El nombre afecta a todo el equipo: es un ajuste global.'],
  secret: ['enable secret Clave2026', 2, 'La contraseña del modo privilegiado es un ajuste de todo el equipo: configuración global.'],
  banner: ['banner motd #Solo personal autorizado#', 2, 'El mensaje de bienvenida es global: se muestra a cualquiera que se conecte.'],
  interfaz: ['interface gigabitEthernet 0/1', 2, 'Para entrar en una interfaz hay que estar en configuración global.'],
  linea: ['line console 0', 2, 'Para entrar en una línea (consola o VTY) hay que estar en configuración global.'],
  cifrar: ['service password-encryption', 2, 'Es un servicio de todo el equipo: configuración global.'],
  gw: ['ip default-gateway 192.168.1.1', 2, 'La puerta de enlace de un switch de capa 2 es única para todo el equipo: configuración global.'],
  ipadd: ['ip address 192.168.1.2 255.255.255.0', 3, 'Una dirección IP pertenece a una interfaz concreta (física o SVI): se escribe dentro de ella.'],
  noshut: ['no shutdown', 3, 'Encender o apagar afecta a una interfaz concreta.'],
  desc: ['description Enlace al router', 3, 'La descripción es una etiqueta de una interfaz concreta.'],
  duplex: ['speed 100', 3, 'La velocidad se ajusta puerto por puerto.'],
  login: ['login', 4, '`login` le dice a una línea (consola o VTY) que pida contraseña al entrar.'],
  pass: ['password Acceso2026', 4, 'La contraseña de acceso se pone en cada línea: en la de consola o en las VTY.'],
  transporte: ['transport input ssh', 4, 'Los protocolos de acceso remoto se eligen en las líneas VTY.'],
};
definir('if-modo', '¿En qué modo se escribe?', {
  crear: (rng) => ({ caso: elegir(rng, Object.keys(DONDE_VA)) }),
  resolver(q) {
    const [comando, modo, porque] = DONDE_VA[q.caso];
    const camino = ['(ya estás ahí al conectarte)', '`enable`', '`enable` → `configure terminal`', '`enable` → `configure terminal` → `interface …`', '`enable` → `configure terminal` → `line console 0` o `line vty 0 4`'][modo];
    return {
      enunciado: `¿En qué modo de Cisco IOS hay que estar para escribir el comando \`${comando}\`?`,
      campos: [campo('modo', 'Modo', 'opcion', modo, { opciones: MODOS, lista: true })],
      pistas: [
        'Pregúntate a qué afecta el comando: ¿solo consulta, a todo el equipo, a un puerto o a una forma de acceso?',
        'Consultar y guardar: modos EXEC. Ajustes de todo el equipo: `(config)#`. De un puerto: `(config-if)#`. De consola o acceso remoto: `(config-line)#`.',
        'El prompt te dice dónde estás: `>` usuario, `#` privilegiado, y entre paréntesis el modo de configuración.',
      ],
      pasos: [
        { t: 'Los modos de IOS van de menos a más permiso, y cada comando vive en uno:',
          tabla: { cab: ['Modo', 'Prompt', 'Para qué sirve'], filas: [
            ['EXEC de usuario', 'Switch>', 'Consultas básicas'], ['EXEC privilegiado', 'Switch#', 'Ver todo, guardar, reiniciar, depurar'],
            ['Configuración global', 'Switch(config)#', 'Ajustes de todo el equipo'], ['Configuración de interfaz', 'Switch(config-if)#', 'Ajustes de un puerto o SVI'],
            ['Configuración de línea', 'Switch(config-line)#', 'Ajustes de la consola o del acceso remoto (VTY)']] } },
        { t: `\`${comando}\`: ${porque} Modo correcto: **${MODOS[modo].replace(/`/g, '')}**.` },
        { t: `Cómo llegar desde que te conectas: ${camino}.` },
      ],
    };
  },
});

/* ========================================================= if-comando */
// Cada caso: (q) => [enunciado, comando, prompt, explicación, otras formas aceptadas]
const IOS = {
  enable: () => ['Acabas de conectarte por consola y estás en el modo de usuario. Entra al modo privilegiado.', 'enable', 'Switch>', '`enable` sube del modo de usuario (`>`) al privilegiado (`#`). Si hay `enable secret` configurado, pide esa contraseña.'],
  conft: () => ['Estás en el modo privilegiado. Entra al modo de configuración global.', 'configure terminal', 'Switch#', '`configure terminal` abre la configuración global. Casi todo el mundo lo abrevia `conf t`.', ['configure t']],
  hostname: (q) => [`Estás en configuración global. Ponle al equipo el nombre ${q.nombre}.`, `hostname ${q.nombre}`, 'Switch(config)#', '`hostname` cambia el nombre del equipo. El prompt cambia al instante, y así sabes en qué equipo estás.'],
  secret: (q) => [`Estás en configuración global. Protege el modo privilegiado con la contraseña ${q.clave}, guardada con hash (la forma segura).`, `enable secret ${q.clave}`, 'Switch(config)#', '`enable secret` guarda la contraseña con un hash. `enable password` la dejaría en texto claro: no se usa.'],
  cifrar: () => ['Estás en configuración global. Haz que las contraseñas en texto claro de la configuración dejen de leerse a simple vista.', 'service password-encryption', 'Switch(config)#', '`service password-encryption` ofusca las contraseñas de línea (tipo 7). Es débil, pero evita que alguien las lea por encima del hombro.'],
  consola: () => ['Estás en configuración global. Entra a configurar el puerto de consola.', 'line console 0', 'Switch(config)#', 'Solo hay una consola, la número 0: `line console 0`.', ['line con 0']],
  vty: () => ['Estás en configuración global. Entra a configurar las cinco primeras líneas de acceso remoto (de la 0 a la 4).', 'line vty 0 4', 'Switch(config)#', 'Las líneas VTY atienden Telnet y SSH. `line vty 0 4` configura cinco a la vez: cinco sesiones remotas simultáneas.'],
  interfaz: (q) => [`Estás en configuración global. Entra en la interfaz ${q.ifl}.`, `interface ${q.ifc}`, 'Switch(config)#', '`interface` seguido del tipo y el número entra en ese puerto. Se puede abreviar: `int g0/1`.'],
  svi: () => ['Estás en configuración global de un switch de capa 2. Entra en la interfaz virtual de la VLAN 1 para darle una IP de gestión.', 'interface vlan 1', 'Switch(config)#', 'Un switch de capa 2 no pone IP en sus puertos físicos: usa una interfaz virtual (SVI) de una VLAN.'],
  ipadd: (q) => [`Estás dentro de una interfaz. Asígnale la dirección ${q.ip} con máscara ${q.mascara}.`, `ip address ${q.ip} ${q.mascara}`, 'Router(config-if)#', '`ip address` lleva la dirección y la máscara en decimal (no en formato /n).'],
  noshut: () => ['Estás dentro de una interfaz de router, que viene apagada de fábrica. Enciéndela.', 'no shutdown', 'Router(config-if)#', 'Las interfaces de un router nacen apagadas (`administratively down`). `no shutdown` las enciende.'],
  gw: (q) => [`Estás en configuración global de un switch de capa 2. Indícale que su puerta de enlace es ${q.gw}, para poder administrarlo desde otra red.`, `ip default-gateway ${q.gw}`, 'Switch(config)#', 'Un switch de capa 2 no enruta: para responder a equipos de otras redes necesita `ip default-gateway`, igual que una computadora.'],
  guardar: () => ['Estás en el modo privilegiado. Guarda la configuración en ejecución para que sobreviva a un reinicio.', 'copy running-config startup-config', 'Switch#', 'La running-config vive en la RAM y se pierde al apagar. Este comando la copia a la startup-config, en la NVRAM.'],
  showrun: () => ['Estás en el modo privilegiado. Muestra la configuración que el equipo está usando ahora mismo.', 'show running-config', 'Switch#', '`show running-config` muestra la configuración activa (la de la RAM).'],
  showbrief: () => ['Estás en el modo privilegiado. Muestra un resumen de todas las interfaces con su dirección IP y su estado.', 'show ip interface brief', 'Router#', '`show ip interface brief` da una línea por interfaz: IP, estado físico y estado del protocolo.'],
  showmac: () => ['Estás en el modo privilegiado de un switch. Muestra qué direcciones MAC ha aprendido y en qué puerto.', 'show mac address-table', 'Switch#', '`show mac address-table` lista VLAN, MAC, tipo (dinámica o estática) y puerto.'],
  showroute: () => ['Estás en el modo privilegiado de un router. Muestra su tabla de enrutamiento.', 'show ip route', 'Router#', '`show ip route` lista las redes que conoce el router, cómo las aprendió y por dónde se llega.'],
  showver: () => ['Estás en el modo privilegiado. Muestra la versión de IOS, el modelo y el tiempo que lleva encendido el equipo.', 'show version', 'Switch#', '`show version` muestra versión de IOS, modelo, número de serie, memoria y tiempo encendido.'],
  showcdp: () => ['Estás en el modo privilegiado. Muestra los equipos Cisco conectados directamente a este.', 'show cdp neighbors', 'Switch#', '`show cdp neighbors` usa el protocolo CDP para listar los vecinos Cisco y por qué puerto se ven.'],
  showstatus: () => ['Estás en el modo privilegiado de un switch. Muestra en una tabla el estado, la VLAN, el dúplex y la velocidad de cada puerto.', 'show interfaces status', 'Switch#', '`show interfaces status` es el resumen por puerto de un switch: connected/notconnect, VLAN, dúplex, velocidad y tipo.', ['show interface status']],
  login: () => ['Estás dentro de la línea de consola y ya le pusiste contraseña. Haz que realmente la pida al entrar.', 'login', 'Switch(config-line)#', 'Sin `login`, la contraseña de la línea existe pero no se pide.'],
  end: () => ['Estás dentro de una interfaz y terminaste. Vuelve de un salto al modo privilegiado.', 'end', 'Switch(config-if)#', '`end` (o Ctrl+Z) regresa directo al modo privilegiado desde cualquier modo de configuración. `exit` solo sube un nivel.'],
};
const IOS_NIVEL = [
  ['enable', 'conft', 'hostname', 'showrun', 'showver', 'end'],
  ['enable', 'conft', 'hostname', 'interfaz', 'noshut', 'showbrief', 'showmac', 'guardar', 'end'],
  Object.keys(IOS),
];
definir('if-comando', 'Comando de Cisco IOS', {
  crear(rng, nivel) {
    const caso = elegir(rng, IOS_NIVEL[nivel <= 2 ? 0 : nivel <= 5 ? 1 : 2]);
    const n = ent(rng, 1, 3);
    const [ifl, ifc] = elegir(rng, [[`GigabitEthernet 0/${n}`, `g0/${n}`], [`FastEthernet 0/${n + 3}`, `f0/${n + 3}`]]);
    const b = ent(rng, 1, 250);
    return { caso, nombre: elegir(rng, ['SW-PISO1', 'SW-PISO2', 'R-SUCURSAL', 'SW-ALMACEN', 'R-BORDE', 'SW-LAB']), clave: elegir(rng, ['Redes2026', 'Cisco2026', 'Acceso99', 'Soporte24']),
      ifl, ifc, ip: `192.168.${b}.${ent(rng, 2, 250)}`, mascara: elegir(rng, ['255.255.255.0', '255.255.255.128', '255.255.255.192']), gw: `192.168.${b}.1` };
  },
  resolver(q) {
    const [enunciado, comando, prompt, explica, acepta = []] = IOS[q.caso](q);
    const palabras = comando.split(' ');
    return {
      enunciado: `${enunciado}\n\nEstás en: \`${prompt}\``,
      campos: [campo('cmd', 'Comando', 'comando', comando, acepta.length ? { acepta } : {})],
      pistas: [
        q.caso.startsWith('show') ? 'Los comandos para consultar empiezan por `show`.' : `El comando empieza por \`${palabras[0]}\`.`,
        `Tiene ${palabras.length} ${palabras.length === 1 ? 'palabra' : 'palabras'}.`,
        palabras.length === 1 ? `Tiene ${comando.length} letras y empieza por «${comando[0]}».` : `Empieza así: \`${palabras.slice(0, palabras.length - 1).join(' ')}\`…`,
      ],
      pasos: [{ t: `Comando: \`${comando}\`` }, { t: explica }],
    };
  },
});

/* ============================================================= if-led */
// Significados habituales en un switch Catalyst de acceso (la serie 2960). Cambian algo según el modelo.
const LEDS = {
  syst: { nombre: 'LED de sistema (SYST)', estados: [
    ['está apagado', 'El switch no recibe energía (o está apagado)', 'Un LED de sistema apagado significa que el equipo no está encendido: revisa el cable de corriente, la toma y la fuente.'],
    ['está en verde fijo', 'El switch funciona con normalidad', 'Verde fijo en SYST es el estado sano: el sistema arrancó y opera bien.'],
    ['parpadea en verde', 'El switch está arrancando (autoprueba POST en curso)', 'Mientras carga el sistema y hace su autoprueba (POST), el LED SYST parpadea en verde. Hay que esperar.'],
    ['está en ámbar', 'El switch recibe energía pero no funciona bien (falló el arranque o hay una avería)', 'Ámbar en SYST significa que hay corriente pero el sistema no opera correctamente: típico de un fallo del POST.'],
  ] },
  stat: { nombre: 'LED de un puerto, con el modo STAT seleccionado', estados: [
    ['está apagado', 'No hay enlace, o el puerto está apagado por configuración', 'Sin luz no hay enlace: el cable está suelto o dañado, el equipo del otro extremo está apagado, o el puerto tiene `shutdown`.'],
    ['está en verde fijo', 'Hay enlace, pero en este momento no pasa tráfico', 'Verde fijo: el enlace está levantado y en reposo.'],
    ['parpadea en verde', 'Hay enlace y el puerto está enviando o recibiendo datos', 'El parpadeo verde es actividad: cada destello es tráfico.'],
    ['alterna entre verde y ámbar', 'Fallo de enlace: el puerto registra errores (tramas dañadas, colisiones excesivas)', 'Verde y ámbar alternando indica un fallo de enlace con errores: suele ser un cable malo o un desajuste de dúplex.'],
    ['está en ámbar fijo', 'El puerto está bloqueado por Spanning Tree y no reenvía datos', 'Ámbar fijo: STP mantiene el puerto bloqueado. Es normal durante unos 30 segundos al conectar un equipo; si no cambia, STP está evitando un bucle.'],
  ] },
  duplx: { nombre: 'LED de un puerto, con el modo DUPLX seleccionado', estados: [
    ['está apagado', 'El puerto trabaja en half-duplex', 'En modo DUPLX, apagado es half-duplex: solo un extremo transmite a la vez.'],
    ['está en verde', 'El puerto trabaja en full-duplex', 'En modo DUPLX, verde es full-duplex: los dos extremos transmiten a la vez.'],
  ] },
  speed: { nombre: 'LED de un puerto 10/100/1000, con el modo SPEED seleccionado', estados: [
    ['está apagado', 'El puerto trabaja a 10 Mb/s', 'En modo SPEED, apagado es 10 Mb/s.'],
    ['está en verde fijo', 'El puerto trabaja a 100 Mb/s', 'En modo SPEED, verde fijo es 100 Mb/s.'],
    ['parpadea en verde', 'El puerto trabaja a 1000 Mb/s', 'En modo SPEED, verde parpadeante es 1000 Mb/s (1 Gb/s).'],
  ] },
  poe: { nombre: 'LED de un puerto, con el modo PoE seleccionado', estados: [
    ['está apagado', 'El puerto no está entregando energía PoE', 'En modo PoE, apagado significa que no se entrega energía: no hay equipo PoE conectado.'],
    ['está en verde', 'El puerto está entregando energía PoE al equipo conectado', 'En modo PoE, verde significa que el puerto alimenta al equipo.'],
    ['alterna entre verde y ámbar', 'Se negó la energía: el equipo pide más de lo que queda en el presupuesto PoE del switch', 'Verde y ámbar alternando en modo PoE: el switch negó la alimentación porque excedería su presupuesto de potencia.'],
    ['parpadea en ámbar', 'PoE desactivado en ese puerto por una avería', 'Ámbar parpadeante en modo PoE indica que la alimentación se cortó por un fallo (por ejemplo, un cable o un equipo defectuoso).'],
  ] },
};
definir('if-led', 'Luces de estado', {
  crear(rng, nivel) {
    const led = elegir(rng, nivel <= 1 ? ['syst', 'stat', 'stat'] : ['syst', 'stat', 'stat', 'duplx', 'speed', 'poe']);
    return { led, estado: ent(rng, 0, LEDS[led].estados.length - 1) };
  },
  resolver(q) {
    const l = LEDS[q.led];
    const [como, , porque] = l.estados[q.estado];
    return {
      enunciado: `Estás frente a un switch Cisco Catalyst y un ingeniero te pide por teléfono que le digas qué ves. El **${l.nombre}** ${como}. ¿Qué significa?`,
      campos: [campo('r', 'Significado', 'opcion', q.estado, { opciones: l.estados.map((e) => e[1]), lista: true })],
      pistas: [
        'Verde suele ser «bien», ámbar «atención» y apagado «nada». El parpadeo casi siempre indica actividad o un proceso en curso.',
        q.led === 'syst' ? 'El LED SYST habla del switch entero, no de un puerto.' : 'El botón MODE cambia lo que cuentan los LED de los puertos: estado (STAT), dúplex, velocidad o PoE.',
        'Descarta primero los significados que pertenecen a otro color o a otro modo.',
      ],
      pasos: [
        { t: `Estos son los significados habituales del ${l.nombre}:`, tabla: { cab: ['Lo que ves', 'Lo que significa'], filas: l.estados.map((e) => [e[0].replace(/^está |^se /, '').replace(/^./, (c) => c.toUpperCase()), e[1]]) } },
        { t: porque },
        { t: 'El detalle cambia entre modelos y versiones: ante la duda, se consulta la guía de hardware de ese modelo. Al ingeniero hay que decirle exactamente el color y si la luz está fija o parpadea.' },
      ],
    };
  },
});

/* ============================================================= if-poe */
const PD = [['Teléfono IP', 7], ['Cámara IP', 13], ['Punto de acceso', 25], ['Punto de acceso Wi-Fi 6', 30], ['Lector de tarjetas', 5], ['Cámara domo con motor', 40]];
const norma = (w) => (w <= 15 ? '802.3af (PoE, hasta 15.4 W por puerto)' : w <= 30 ? '802.3at (PoE+, hasta 30 W por puerto)' : '802.3bt (PoE++, hasta 60 o 90 W por puerto)');
definir('if-poe', 'Presupuesto PoE', {
  crear(rng) {
    const tipos = [...PD].sort(() => rng() - 0.5).slice(0, ent(rng, 2, 3));
    return { presupuesto: elegir(rng, [123, 185, 370, 740]), equipos: tipos.map(([n, w]) => ({ n, w, c: ent(rng, 2, 12) })) };
  },
  resolver(q) {
    const total = q.equipos.reduce((s, e) => s + e.w * e.c, 0);
    const alcanza = total <= q.presupuesto;
    const dif = Math.abs(q.presupuesto - total);
    const mayor = Math.max(...q.equipos.map((e) => e.w));
    return {
      enunciado: `Un switch PoE tiene un **presupuesto de ${q.presupuesto} W** para alimentar equipos por el cable de red. Se le quieren conectar los equipos de la tabla (la potencia es la que el switch debe reservar para cada uno). ¿Cuántos vatios hacen falta en total? ¿Alcanza el presupuesto? ¿Cuántos vatios sobran o faltan?`,
      tabla: { cab: ['Equipo', 'Cantidad', 'Potencia por equipo'], filas: q.equipos.map((e) => [e.n, String(e.c), `${e.w} W`]) },
      campos: [
        campo('total', 'Vatios necesarios', 'numero', total),
        campo('alcanza', '¿Alcanza el presupuesto?', 'opcion', alcanza ? 0 : 1, { opciones: ['Sí', 'No'] }),
        campo('dif', 'Vatios que sobran o que faltan', 'numero', dif),
      ],
      pistas: [
        'Multiplica la cantidad de cada equipo por su potencia y suma los resultados.',
        'Compara la suma con el presupuesto del switch: si la suma es mayor, no alcanza.',
        'La diferencia entre el presupuesto y la suma es lo que sobra o lo que falta.',
      ],
      pasos: [
        { t: 'Se calcula lo que consume cada grupo de equipos:', tabla: { cab: ['Equipo', 'Cuenta', 'Vatios'], filas: [...q.equipos.map((e) => [e.n, `${e.c} × ${e.w} W`, `${e.c * e.w} W`]), ['**Total**', '', `**${total} W**`]] } },
        { t: alcanza
          ? `${total} W ≤ ${q.presupuesto} W: **sí alcanza**. Sobran ${q.presupuesto} − ${total} = **${dif} W**.`
          : `${total} W > ${q.presupuesto} W: **no alcanza**. Faltan ${total} − ${q.presupuesto} = **${dif} W**. El switch alimentará los puertos hasta agotar el presupuesto y negará la energía a los demás (por defecto, por orden de número de puerto).` },
        { t: `Además del total hay que mirar el estándar: el equipo que más pide necesita ${mayor} W, así que los puertos deben ser al menos ${norma(mayor)}.` },
      ],
    };
  },
});

/* ============================================================ if-rack */
const EN_RACK = [['Switch de acceso', 1], ['Router', 1], ['Panel de parcheo', 1], ['Organizador de cables', 1], ['Firewall', 1], ['Servidor', 2], ['UPS', 2], ['Switch modular', 4], ['Cabina de discos', 3]];
definir('if-rack', 'Unidades de rack', {
  crear(rng) {
    const tipos = [...EN_RACK].sort(() => rng() - 0.5).slice(0, ent(rng, 3, 4));
    const equipos = tipos.map(([n, u]) => ({ n, u, c: ent(rng, 1, 4) }));
    const usadas = equipos.reduce((s, e) => s + e.u * e.c, 0);
    const rack = [12, 18, 24, 42, 45].find((x) => x >= usadas) ?? 45;
    return { rack: rack === usadas ? Math.min(45, rack + 6) : rack, equipos };
  },
  resolver(q) {
    const usadas = q.equipos.reduce((s, e) => s + e.u * e.c, 0);
    const libres = q.rack - usadas;
    if (libres < 0) throw new Error('if-rack: los equipos no caben en el rack');
    return {
      enunciado: `En un rack de **${q.rack}U** hay que montar los equipos de la tabla. ¿Cuántas unidades de rack ocupan en total, cuántas quedan libres y cuántos servidores de 2U más cabrían en el espacio libre?`,
      tabla: { cab: ['Equipo', 'Cantidad', 'Altura de cada uno'], filas: q.equipos.map((e) => [e.n, String(e.c), `${e.u}U`]) },
      campos: [campo('usadas', 'Unidades ocupadas (U)', 'numero', usadas), campo('libres', 'Unidades libres (U)', 'numero', libres), campo('caben', 'Servidores de 2U que aún caben', 'numero', Math.floor(libres / 2))],
      pistas: [
        'La «U» es la unidad de altura de un rack: 1U = 1.75 pulgadas (44.45 mm). Un equipo de 2U ocupa dos huecos.',
        'Multiplica cantidad por altura en cada fila y suma.',
        'Las unidades libres son las del rack menos las ocupadas. Para los servidores de 2U, divide entre 2 y quédate con la parte entera.',
      ],
      pasos: [
        { t: 'Altura que ocupa cada grupo:', tabla: { cab: ['Equipo', 'Cuenta', 'Unidades'], filas: [...q.equipos.map((e) => [e.n, `${e.c} × ${e.u}U`, `${e.c * e.u}U`]), ['**Total**', '', `**${usadas}U**`]] } },
        { t: `Quedan libres ${q.rack} − ${usadas} = **${libres}U**.` },
        { t: `Cada servidor ocupa 2U: ${libres} ÷ 2 = ${libres / 2}${libres % 2 ? `, y solo cuentan los enteros: **${Math.floor(libres / 2)}** (sobra 1U)` : `: caben **${libres / 2}**`}. En la práctica conviene dejar algo de espacio libre para ventilación y para ordenar el cableado.` },
      ],
    };
  },
});

/* ============================================================ niveles */
niveles('infraestructura', [
  { n: 1, nombre: 'Dispositivos', resumen: 'Hub, switch, router y punto de acceso: capas, dominios de colisión y de broadcast.',
    tipos: [['if-dominios', 3], ['if-led', 1], ['if-rack', 1], ['banco', 5]] },
  { n: 2, nombre: 'Puertos, luces y rack', resumen: 'Puertos de un equipo Cisco, LED de estado, PoE, diagramas y montaje en rack.',
    tipos: [['if-led', 3], ['if-poe', 2], ['if-rack', 2], ['if-dominios', 1], ['banco', 5]] },
  { n: 3, nombre: 'Conmutación', resumen: 'La tabla de direcciones MAC: aprender, reenviar, inundar y filtrar.',
    tipos: [['if-switch', 3], ['if-tabla-mac', 3], ['if-comando', 1], ['banco', 4]] },
  { n: 4, nombre: 'ARP y puerta de enlace', resumen: 'Destino local o remoto, a quién se le hace ARP y tablas MAC con hubs.',
    tipos: [['if-local-remoto', 4], ['if-switch', 2], ['if-tabla-mac', 2], ['banco', 4]] },
  { n: 5, nombre: 'Enrutamiento', resumen: 'Tabla de enrutamiento, coincidencia más larga y qué cambia en cada salto.',
    tipos: [['if-ruta', 4], ['if-salto', 3], ['if-local-remoto', 2], ['if-comando', 1], ['banco', 4]] },
  { n: 6, nombre: 'Cisco IOS y casos completos', resumen: 'Modos y comandos de IOS, rutas solapadas y recorridos de varios saltos.',
    tipos: [['if-modo', 3], ['if-comando', 4], ['if-ruta', 2], ['if-salto', 2], ['banco', 5]] },
]);
