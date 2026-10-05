/**
 * Academia de Redes · Tipos de ejercicio de VLAN
 * ---------------------------------------------------------------------
 * Mismo contrato que tipos.js: crear(rng, nivel) → parámetros y
 * resolver(params) → { enunciado, tabla?, campos, pistas, pasos }.
 * Los comandos son de Cisco IOS, el dialecto que piden casi todos los
 * cursos; se corrigen aceptando las abreviaturas habituales (motor.js).
 */
import { definir, campo, ent, elegir } from './tipos.js';
import { ip, aTexto, analizar, mascara, tamano, vlsm, miles, hostsUtiles } from './ip.js';

const NOMBRES = ['VENTAS', 'SOPORTE', 'RRHH', 'FINANZAS', 'INGENIERIA', 'INVITADOS', 'SERVIDORES', 'DIRECCION', 'ALMACEN', 'LABORATORIO', 'CAMARAS', 'GESTION'];
const IDS = [10, 20, 30, 40, 50, 60, 70, 80, 99, 100, 110, 120, 150, 200];
const lista = (v) => [...v].sort((a, b) => a - b).join(',');
const varios = (rng, origen, n) => [...origen].sort(() => rng() - 0.5).slice(0, n);
const cidr = (d, p) => aTexto(d) + '/' + p;

/* ----------------------------------------------------------- vl-rango */
const RANGOS = ['VLAN por defecto (existe siempre y no se puede borrar)', 'Rango normal utilizable (2 a 1001)', 'Reservada para Token Ring y FDDI (1002 a 1005)', 'Rango extendido (1006 a 4094)', 'No es un ID de VLAN válido'];
const rangoDe = (id) => (id === 1 ? 0 : id >= 2 && id <= 1001 ? 1 : id >= 1002 && id <= 1005 ? 2 : id >= 1006 && id <= 4094 ? 3 : 4);
definir('vl-rango', 'Rango del ID de VLAN', {
  crear: (rng) => ({ id: elegir(rng, [1, ent(rng, 2, 1001), ent(rng, 2, 300), ent(rng, 1002, 1005), ent(rng, 1006, 4094), elegir(rng, [0, 4095, 4096, 5000]), 1001, 1006, 4094]) }),
  resolver({ id }) {
    const r = rangoDe(id);
    const porque = [
      'La VLAN 1 viene creada de fábrica, todos los puertos pertenecen a ella al principio y no se puede borrar ni renombrar.',
      `${id} está entre 2 y 1001: es el rango normal. Estas VLAN se pueden crear, renombrar y borrar libremente.`,
      `${id} está entre 1002 y 1005. Esos cuatro ID existen por compatibilidad con tecnologías antiguas (Token Ring y FDDI): aparecen en el switch, pero no se pueden usar ni borrar.`,
      `${id} está entre 1006 y 4094: es el rango extendido, pensado para proveedores y redes muy grandes.`,
      id === 0 || id === 4095 ? `El campo de VLAN tiene 12 bits (valores 0 a 4095), pero el 0 y el 4095 están reservados por el estándar. Los ID utilizables van de 1 a 4094.` : `El campo de VLAN de la etiqueta 802.1Q tiene 12 bits: solo admite valores de 0 a 4095. ${miles(id)} no cabe.`,
    ][r];
    return {
      enunciado: `¿Qué tipo de identificador es la VLAN **${id}** en un switch Cisco?`,
      campos: [campo('r', 'Tipo de ID', 'opcion', r, { opciones: RANGOS, lista: true })],
      pistas: [
        'El ID de VLAN ocupa 12 bits en la etiqueta 802.1Q: de 0 a 4095, con el primero y el último reservados.',
        'Rango normal: 1 a 1005. Rango extendido: 1006 a 4094.',
        'Dentro del rango normal hay cinco ID especiales: el 1 y del 1002 al 1005.',
      ],
      pasos: [
        { t: 'Los ID de VLAN se reparten así:', tabla: { cab: ['ID', 'Tipo', 'Qué se puede hacer'], filas: [
          ['0 y 4095', 'Reservados por el estándar', 'No se usan'], ['1', 'VLAN por defecto', 'Se usa, pero no se puede borrar'], ['2 – 1001', 'Rango normal', 'Crear, renombrar y borrar'],
          ['1002 – 1005', 'Reservadas (Token Ring / FDDI)', 'No se usan ni se borran'], ['1006 – 4094', 'Rango extendido', 'Crear y borrar (con algunas restricciones)']] } },
        { t: porque },
      ],
    };
  },
});

/* -------------------------------------------------------- vl-etiqueta */
const ETIQUETAS = ['Sin etiqueta: sale por un puerto de acceso', 'Sin etiqueta: es la VLAN nativa del troncal', 'Con etiqueta 802.1Q'];
definir('vl-etiqueta', '¿Sale etiquetada?', {
  crear(rng) {
    const [a, b] = varios(rng, IDS, 2);
    const caso = ent(rng, 0, 2);
    return caso === 0 ? { vlan: a, puerto: 'acceso' } : { vlan: a, puerto: 'troncal', nativa: caso === 1 ? a : elegir(rng, [1, b, 99]) === a ? 1 : elegir(rng, [1, b]) };
  },
  resolver(q) {
    const troncal = q.puerto === 'troncal';
    const r = !troncal ? 0 : q.vlan === q.nativa ? 1 : 2;
    return {
      enunciado: troncal
        ? `Una trama que pertenece a la **VLAN ${q.vlan}** sale del switch por un **puerto troncal** 802.1Q cuya VLAN nativa es la **${q.nativa}**. ¿Cómo viaja la trama por el cable?`
        : `Una trama que pertenece a la **VLAN ${q.vlan}** sale del switch por un **puerto de acceso** asignado a esa VLAN, hacia una computadora. ¿Cómo viaja la trama por el cable?`,
      campos: [campo('r', 'La trama sale', 'opcion', r, { opciones: ETIQUETAS, lista: true })],
      pistas: [
        'Los equipos finales no entienden de VLAN: lo que les llega tiene que ser una trama Ethernet normal.',
        'En un troncal viajan varias VLAN por el mismo cable, así que hace falta marcar cada trama… con una excepción.',
        'La excepción es la VLAN nativa: sus tramas cruzan el troncal sin etiqueta.',
      ],
      pasos: [
        { t: troncal ? 'Es un puerto troncal: por él pasan tramas de varias VLAN, y el switch del otro extremo necesita saber a cuál pertenece cada una. Para eso se inserta la etiqueta 802.1Q de 4 bytes con el ID de la VLAN.'
          : 'Es un puerto de acceso: pertenece a una sola VLAN y conecta un equipo final. El switch **quita** cualquier etiqueta antes de entregar la trama, porque una computadora normal espera tramas Ethernet sin etiquetar.' },
        ...(troncal ? [{ t: q.vlan === q.nativa
          ? `La regla tiene una excepción: la **VLAN nativa**. Como la trama es de la VLAN ${q.vlan} y esa es justo la nativa del troncal, se envía **sin etiqueta**. El otro switch, al recibir una trama sin etiqueta por el troncal, la asigna a su propia VLAN nativa.`
          : `La VLAN nativa del troncal es la ${q.nativa}, distinta de la ${q.vlan}. La trama sale **con etiqueta**, y el campo VLAN ID de la etiqueta vale ${q.vlan}.` }] : []),
      ],
    };
  },
});

/* -------------------------------------------------------- vl-difusion */
definir('vl-difusion', 'Alcance de un broadcast', {
  crear(rng, nivel) {
    const vlans = varios(rng, [10, 20, 30, 40], nivel <= 1 ? 2 : 3);
    const total = ent(rng, 6, 8);
    const troncales = nivel <= 1 ? 0 : ent(rng, 1, 2);
    const puertos = [];
    for (let i = 1; i <= total - troncales; i++) puertos.push({ n: `Fa0/${i}`, vlan: elegir(rng, vlans) });
    for (let i = 1; i <= troncales; i++) puertos.push({ n: `Gi0/${i}`, permitidas: varios(rng, vlans, ent(rng, 1, vlans.length)).sort((a, b) => a - b) });
    return { puertos, origen: ent(rng, 0, total - troncales - 1) };
  },
  resolver(q) {
    const o = q.puertos[q.origen];
    const sale = (p, i) => i !== q.origen && (p.permitidas ? p.permitidas.includes(o.vlan) : p.vlan === o.vlan);
    const cuantos = q.puertos.filter(sale).length;
    const dominios = new Set(q.puertos.filter((p) => !p.permitidas).map((p) => p.vlan)).size;
    const motivo = (p, i) => (i === q.origen ? 'Es el puerto por donde entró'
      : p.permitidas ? (p.permitidas.includes(o.vlan) ? `Troncal que permite la VLAN ${o.vlan}` : `Troncal que no permite la VLAN ${o.vlan}`)
      : p.vlan === o.vlan ? `Misma VLAN (${p.vlan})` : `Otra VLAN (${p.vlan})`);
    return {
      enunciado: `Un switch tiene los puertos configurados como indica la tabla. El equipo conectado a **${o.n}** envía un broadcast (por ejemplo, una petición ARP). ¿Por cuántos puertos reenvía el switch esa trama? ¿Y cuántos dominios de broadcast forman sus puertos de acceso?`,
      tabla: { cab: ['Puerto', 'Modo', 'VLAN'], filas: q.puertos.map((p) => [p.n, p.permitidas ? 'Troncal' : 'Acceso', p.permitidas ? 'permite ' + p.permitidas.join(', ') : String(p.vlan)]) },
      campos: [campo('puertos', 'Puertos por los que sale', 'numero', cuantos), campo('dominios', 'Dominios de broadcast', 'numero', dominios)],
      pistas: [
        'Un broadcast solo se reenvía dentro de la VLAN en la que nació.',
        'Nunca vuelve a salir por el puerto por donde entró. Los troncales cuentan si permiten esa VLAN.',
        'Cada VLAN en uso es un dominio de broadcast distinto.',
      ],
      pasos: [
        { t: `El broadcast entra por ${o.n}, que pertenece a la **VLAN ${o.vlan}**. El switch lo reenvía por todos los demás puertos de esa VLAN y por los troncales que la permitan, nunca por los de otras VLAN.`,
          tabla: { cab: ['Puerto', '¿Sale?', 'Motivo'], filas: q.puertos.map((p, i) => [p.n, sale(p, i) ? '**Sí**' : 'No', motivo(p, i)]) } },
        { t: `Sale por **${cuantos}** puerto${cuantos === 1 ? '' : 's'}.` },
        { t: `Cada VLAN es un dominio de broadcast independiente. Los puertos de acceso usan ${dominios} VLAN distinta${dominios === 1 ? '' : 's'} (${lista(new Set(q.puertos.filter((p) => !p.permitidas).map((p) => p.vlan))).replace(/,/g, ', ')}): **${dominios}** dominio${dominios === 1 ? '' : 's'} de broadcast.` },
      ],
    };
  },
});

/* --------------------------------------------------------- vl-comando */
// Cada caso: enunciado, comando esperado y modo de configuración desde el que se escribe.
const COMANDOS = {
  crear: (q) => ['Estás en modo de configuración global. Crea la VLAN ' + q.vlan + '.', `vlan ${q.vlan}`, 'Switch(config)#'],
  nombre: (q) => [`Acabas de crear la VLAN ${q.vlan} y estás dentro de ella. Ponle el nombre ${q.nombre}.`, `name ${q.nombre}`, 'Switch(config-vlan)#'],
  acceso: () => ['Estás dentro de la interfaz Fa0/5, que conecta una computadora. Fíjala como puerto de acceso.', 'switchport mode access', 'Switch(config-if)#'],
  asignar: (q) => [`Estás dentro de una interfaz de acceso. Asígnala a la VLAN ${q.vlan}.`, `switchport access vlan ${q.vlan}`, 'Switch(config-if)#'],
  voz: (q) => [`Estás dentro de un puerto de acceso que conecta un teléfono IP con una computadora detrás. Indica que la voz use la VLAN ${q.vlan}.`, `switchport voice vlan ${q.vlan}`, 'Switch(config-if)#'],
  troncal: () => ['Estás dentro de la interfaz Gi0/1, que conecta con otro switch. Fíjala como enlace troncal.', 'switchport mode trunk', 'Switch(config-if)#'],
  permitidas: (q) => [`Estás dentro de un puerto troncal. Limita el troncal para que solo deje pasar las VLAN ${q.lista.join(', ')}.`, `switchport trunk allowed vlan ${q.lista.join(',')}`, 'Switch(config-if)#'],
  agregar: (q) => [`Un troncal ya permite varias VLAN. Añade la VLAN ${q.vlan} a la lista sin borrar las que ya había.`, `switchport trunk allowed vlan add ${q.vlan}`, 'Switch(config-if)#'],
  nativa: (q) => [`Estás dentro de un puerto troncal. Cambia su VLAN nativa a la ${q.vlan}.`, `switchport trunk native vlan ${q.vlan}`, 'Switch(config-if)#'],
  sindtp: () => ['Estás dentro de un puerto troncal configurado a mano. Desactiva la negociación automática (DTP) en él.', 'switchport nonegotiate', 'Switch(config-if)#'],
  vervlan: () => ['Desde el modo privilegiado, muestra la lista resumida de VLAN con los puertos de acceso de cada una.', 'show vlan brief', 'Switch#'],
  vertroncal: () => ['Desde el modo privilegiado, muestra los puertos troncales, su VLAN nativa y las VLAN que permiten.', 'show interfaces trunk', 'Switch#'],
  encapsular: (q) => [`Estás dentro de una subinterfaz de router. Indica que atiende a la VLAN ${q.vlan} con etiquetado 802.1Q.`, `encapsulation dot1q ${q.vlan}`, 'Router(config-subif)#'],
  encapnativa: (q) => [`Estás dentro de una subinterfaz de router. Indica que atiende a la VLAN ${q.vlan} y que esa es la VLAN nativa del troncal.`, `encapsulation dot1q ${q.vlan} native`, 'Router(config-subif)#'],
  svi: (q) => [`En un switch de capa 3, desde configuración global, entra en la interfaz virtual (SVI) de la VLAN ${q.vlan}.`, `interface vlan ${q.vlan}`, 'Switch(config)#'],
  enrutar: () => ['En un switch de capa 3, desde configuración global, activa el enrutamiento IP para que pueda enrutar entre sus SVI.', 'ip routing', 'Switch(config)#'],
};
const POR_NIVEL = [
  ['crear', 'nombre', 'acceso', 'asignar', 'vervlan'],
  ['troncal', 'permitidas', 'nativa', 'vertroncal', 'asignar', 'voz', 'agregar'],
  ['permitidas', 'agregar', 'nativa', 'sindtp', 'vertroncal', 'troncal'],
  ['encapsular', 'encapnativa', 'svi', 'enrutar', 'permitidas'],
];
const EXPLICA = {
  crear: 'El comando `vlan` seguido del ID crea la VLAN (si no existía) y entra en su modo de configuración.',
  nombre: 'Dentro de la VLAN, `name` le pone una etiqueta legible. El nombre no afecta al funcionamiento: lo que cuenta es el ID.',
  acceso: '`switchport mode access` fija el puerto como acceso: pertenecerá a una sola VLAN y no intentará formar un troncal.',
  asignar: '`switchport access vlan` indica a qué VLAN pertenece el puerto de acceso. Si la VLAN no existe, el switch la crea.',
  voz: '`switchport voice vlan` añade al puerto de acceso una segunda VLAN solo para el teléfono; la computadora sigue en la VLAN de datos.',
  troncal: '`switchport mode trunk` fija el puerto como troncal 802.1Q: transporta varias VLAN a la vez.',
  permitidas: '`switchport trunk allowed vlan` sustituye la lista de VLAN permitidas por la que escribas. Los ID van separados por comas, sin espacios.',
  agregar: 'Con `add` se añade a la lista existente. Sin `add`, el comando reemplaza toda la lista y deja fuera a las demás VLAN: un error clásico.',
  nativa: '`switchport trunk native vlan` cambia la VLAN cuyas tramas cruzan el troncal sin etiqueta. Debe ser la misma en los dos extremos.',
  sindtp: '`switchport nonegotiate` apaga DTP, el protocolo que negocia troncales automáticamente. Es una medida de seguridad habitual.',
  vervlan: '`show vlan brief` lista cada VLAN con su nombre, su estado y sus puertos de acceso. Los troncales no aparecen en ella.',
  vertroncal: '`show interfaces trunk` muestra los troncales, el modo, la VLAN nativa y las VLAN permitidas y activas en cada uno.',
  encapsular: '`encapsulation dot1q` asocia la subinterfaz con una VLAN: procesará las tramas que lleguen con esa etiqueta. Debe escribirse antes de asignar la dirección IP.',
  encapnativa: 'La palabra `native` al final indica que las tramas de esa VLAN llegan sin etiqueta por el troncal.',
  svi: '`interface vlan` crea la interfaz virtual de esa VLAN en el switch. Con una IP, sirve de puerta de enlace para sus equipos.',
  enrutar: '`ip routing` convierte al switch de capa 3 en router: sin él, las SVI existen pero no se pasan paquetes entre sí.',
};
definir('vl-comando', 'Comando de configuración', {
  crear(rng, nivel) {
    const caso = elegir(rng, POR_NIVEL[Math.min(nivel, POR_NIVEL.length) - 1]);
    return { caso, vlan: elegir(rng, IDS), nombre: elegir(rng, NOMBRES), lista: varios(rng, IDS, 3).sort((a, b) => a - b) };
  },
  resolver(q) {
    const [enunciado, comando, modo] = COMANDOS[q.caso](q);
    const palabras = comando.split(' ');
    return {
      enunciado: `${enunciado}\n\nEstás en: \`${modo}\``,
      campos: [campo('cmd', 'Comando', 'comando', comando)],
      pistas: [
        q.caso.startsWith('ver') ? 'Los comandos para consultar empiezan por `show`.' : `El comando empieza por \`${palabras[0]}\`.`,
        `Tiene ${palabras.length} palabra${palabras.length === 1 ? '' : 's'}.`,
        `Empieza así: \`${palabras.slice(0, Math.max(1, palabras.length - 1)).join(' ')}\`…`,
      ],
      pasos: [{ t: `Comando: \`${comando}\`` }, { t: EXPLICA[q.caso] }],
    };
  },
});

/* --------------------------------------------------------- vl-alcance */
const ALCANCES = ['Sí, directamente por capa 2 (misma VLAN)', 'Sí, pero pasando por el router', 'No pueden comunicarse'];
/** ¿La VLAN v está permitida en todos los troncales entre el switch a y el b (numerados desde 1)? */
function camino(troncales, a, b, v) {
  for (let i = Math.min(a, b); i < Math.max(a, b); i++) if (!troncales[i - 1].includes(v)) return i;
  return 0;
}
definir('vl-alcance', '¿Se comunican?', {
  crear(rng, nivel) {
    const switches = nivel >= 6 ? 3 : 2;
    const vlans = varios(rng, [10, 20, 30, 40, 50], nivel >= 5 ? 4 : 3).sort((a, b) => a - b);
    const troncales = Array.from({ length: switches - 1 }, () => (rng() < 0.45 ? [...vlans] : varios(rng, vlans, ent(rng, 1, vlans.length - 1)).sort((a, b) => a - b)));
    const va = elegir(rng, vlans);
    const a = { sw: ent(rng, 1, switches), vlan: va };
    const b = { sw: ent(rng, 1, switches), vlan: rng() < 0.5 ? va : elegir(rng, vlans) };
    const router = nivel >= 4 ? { vlans: rng() < 0.5 ? [...vlans] : varios(rng, vlans, ent(rng, 2, vlans.length - 1)).sort((x, y) => x - y) } : null;
    return { troncales, a, b, ...(router ? { router } : {}) };
  },
  resolver(q) {
    const { a, b, troncales } = q;
    const n = troncales.length + 1;
    const filasTroncal = troncales.map((t, i) => [`SW${i + 1} – SW${i + 2}`, t.join(', ')]);
    let r;
    const pasos = [];
    if (a.vlan === b.vlan) {
      const corte = camino(troncales, a.sw, b.sw, a.vlan);
      pasos.push({ t: `Los dos equipos están en la **VLAN ${a.vlan}**: pertenecen a la misma red, así que solo pueden hablarse por capa 2. Un router no interviene entre equipos de la misma VLAN.` });
      if (a.sw === b.sw) { r = 0; pasos.push({ t: `Además están en el mismo switch (SW${a.sw}): el switch conmuta la trama directamente entre los dos puertos. **Sí se comunican.**` }); }
      else if (!corte) { r = 0; pasos.push({ t: `Para ir de SW${a.sw} a SW${b.sw} la trama cruza ${Math.abs(a.sw - b.sw) === 1 ? 'un troncal' : 'dos troncales'}, y la VLAN ${a.vlan} está permitida en ${Math.abs(a.sw - b.sw) === 1 ? 'él' : 'los dos'}. **Sí se comunican.**` }); }
      else { r = 2; pasos.push({ t: `Para ir de SW${a.sw} a SW${b.sw} la trama tiene que cruzar el troncal SW${corte} – SW${corte + 1}, que solo permite ${troncales[corte - 1].join(', ')}. La VLAN ${a.vlan} no está en la lista: el switch descarta la trama. **No se comunican**, aunque tengan la misma VLAN.` }); }
    } else {
      pasos.push({ t: `PC-A está en la VLAN ${a.vlan} y PC-B en la VLAN ${b.vlan}: son redes distintas. Un switch de capa 2 nunca pasa tramas de una VLAN a otra, así que necesitan un **router**.` });
      if (!q.router) { r = 2; pasos.push({ t: 'En esta red no hay ningún router ni switch de capa 3. **No se comunican.**' }); }
      else {
        const faltan = [a.vlan, b.vlan].filter((v) => !q.router.vlans.includes(v));
        const corteA = camino(troncales, a.sw, 1, a.vlan);
        const corteB = camino(troncales, b.sw, 1, b.vlan);
        if (faltan.length) { r = 2; pasos.push({ t: `El router solo tiene subinterfaces para las VLAN ${q.router.vlans.join(', ')}. Le falta la VLAN ${faltan.join(' y la ')}: los equipos de esa VLAN no tienen puerta de enlace. **No se comunican.**` }); }
        else if (corteA || corteB) {
          const [quien, corte, v] = corteA ? ['PC-A', corteA, a.vlan] : ['PC-B', corteB, b.vlan];
          r = 2;
          pasos.push({ t: `El router tiene subinterfaces para las dos VLAN, pero está conectado a SW1. Para llegar hasta él, las tramas de ${quien} (VLAN ${v}) deben cruzar el troncal SW${corte} – SW${corte + 1}, que no permite esa VLAN. ${quien} no alcanza su puerta de enlace. **No se comunican.**` });
        } else { r = 1; pasos.push({ t: `El router tiene subinterfaces para la VLAN ${a.vlan} y para la ${b.vlan}, y las dos VLAN llegan hasta SW1 (están permitidas en todos los troncales del camino). El paquete sube al router por una VLAN y baja por la otra. **Se comunican a través del router.**` }); }
      }
    }
    return {
      enunciado: `La red tiene ${n} switches conectados en línea por enlaces troncales. Todas las VLAN están creadas en todos los switches y la configuración IP de los equipos es correcta. ${q.router ? `Hay un router conectado a **SW1** por un troncal que permite todas las VLAN (router-on-a-stick), con subinterfaces para las VLAN **${q.router.vlans.join(', ')}**.` : 'No hay ningún router.'} ¿Puede PC-A comunicarse con PC-B?`,
      tabla: { cab: ['Elemento', 'Dato'], filas: [['PC-A', `SW${a.sw}, puerto de acceso en la VLAN ${a.vlan}`], ['PC-B', `SW${b.sw}, puerto de acceso en la VLAN ${b.vlan}`], ...filasTroncal.map(([e, v]) => [`Troncal ${e}`, `permite las VLAN ${v}`])] },
      campos: [campo('r', '¿Se comunican?', 'opcion', r, { opciones: ALCANCES, lista: true })],
      pistas: [
        'Primero compara las VLAN de los dos equipos: ¿es la misma o son distintas?',
        'Misma VLAN: la trama debe poder cruzar cada troncal del camino. VLAN distinta: hace falta un router que tenga las dos.',
        'Con router: cada equipo debe poder llegar hasta SW1, donde está el router, por troncales que permitan su VLAN.',
      ],
      pasos,
    };
  },
});

/* ----------------------------------------------------- vl-subinterfaz */
definir('vl-subinterfaz', 'Subinterfaz del router', {
  crear(rng, nivel) {
    const vlan = elegir(rng, IDS);
    const p = nivel <= 4 ? 24 : ent(rng, 25, 29);
    const base = ip(`${elegir(rng, ['192.168', '172.16', '10.10'])}.${ent(rng, 1, 250)}.0`) + ent(rng, 0, 2 ** (p - 24) - 1) * tamano(p);
    return { vlan, red: aTexto(base), p, gw: elegir(rng, ['primera', 'ultima']), iface: elegir(rng, ['g0/0', 'g0/1']) };
  },
  resolver(q) {
    const a = analizar(ip(q.red), q.p);
    const gw = q.gw === 'ultima' ? a.ultimo : a.primero;
    const sub = `${q.iface}.${q.vlan}`;
    return {
      enunciado: `Un router hace enrutamiento entre VLAN por un solo cable (router-on-a-stick) usando su interfaz **${q.iface}**. La **VLAN ${q.vlan}** usa la red \`${cidr(a.red, q.p)}\` y su puerta de enlace debe ser la **${q.gw === 'ultima' ? 'última' : 'primera'}** dirección asignable. Usa el ID de la VLAN como número de subinterfaz y completa la configuración.`,
      campos: [
        campo('iface', 'Comando para entrar en la subinterfaz', 'comando', `interface ${sub}`),
        campo('encap', 'Comando de encapsulación', 'comando', `encapsulation dot1q ${q.vlan}`),
        campo('gw', 'Dirección IP de la subinterfaz', 'ip', aTexto(gw)),
        campo('mascara', 'Máscara', 'ip', aTexto(a.mascara)),
      ],
      pistas: [
        'Una subinterfaz se nombra con la interfaz física, un punto y un número.',
        'La encapsulación indica qué etiqueta 802.1Q atiende la subinterfaz: `encapsulation dot1q` y el ID.',
        `Calcula el rango asignable de ${cidr(a.red, q.p)} y toma la ${q.gw === 'ultima' ? 'última' : 'primera'} dirección.`,
      ],
      pasos: [
        { t: `La subinterfaz se crea al entrar en ella: \`interface ${sub}\`. El número tras el punto es libre, pero la costumbre es que coincida con la VLAN.` },
        { t: `Se asocia con la VLAN: \`encapsulation dot1q ${q.vlan}\`. Sin este comando el router no acepta una dirección IP en la subinterfaz.` },
        { t: `La red \`${cidr(a.red, q.p)}\` tiene máscara \`${aTexto(a.mascara)}\` y ${miles(tamano(q.p))} direcciones: de \`${aTexto(a.red)}\` (red) a \`${aTexto(a.broadcast)}\` (broadcast). Rango asignable: \`${aTexto(a.primero)}\` – \`${aTexto(a.ultimo)}\`.`,
          bits: [{ et: 'Red', ip: aTexto(a.red), p: q.p }, { et: 'Broadcast', ip: aTexto(a.broadcast), p: q.p }] },
        { t: `La ${q.gw === 'ultima' ? 'última' : 'primera'} dirección asignable es \`${aTexto(gw)}\`. Comando final: \`ip address ${aTexto(gw)} ${aTexto(a.mascara)}\`. Esa es la puerta de enlace que deben usar los equipos de la VLAN ${q.vlan}.` },
      ],
    };
  },
});

/* ---------------------------------------------------------- vl-diseno */
definir('vl-diseno', 'Direccionamiento por VLAN', {
  crear(rng, nivel) {
    const cuantas = nivel >= 6 ? ent(rng, 5, 6) : ent(rng, 3, 4);
    const ids = varios(rng, IDS, cuantas).sort((a, b) => a - b);
    const nombres = varios(rng, NOMBRES, cuantas);
    const tope = nivel >= 6 ? 9 : 6;
    const vlans = ids.map((id, i) => { const b = ent(rng, 3, tope); return { id, nombre: nombres[i], hosts: ent(rng, 2 ** (b - 1) - 1, 2 ** b - 2) - 1 }; });
    const suma = vlans.reduce((t, v) => t + 2 ** Math.ceil(Math.log2(v.hosts + 3)), 0);
    const p0 = Math.max(16, 32 - Math.ceil(Math.log2(suma)));
    const base = ip(elegir(rng, ['10.0.0.0', '172.16.0.0', '192.168.0.0'])) + ent(rng, 0, 2 ** (p0 - 16) - 1) * tamano(p0);
    return { base: aTexto(base), p0, vlans };
  },
  resolver(q) {
    // Cada VLAN necesita una dirección más: la de su puerta de enlace.
    const plan = vlsm(ip(q.base), q.p0, q.vlans.map((v) => ({ nombre: `VLAN ${v.id} ${v.nombre}`, hosts: v.hosts + 1 })));
    if (!plan) throw new Error('vl-diseno: las VLAN no caben en ' + q.base + '/' + q.p0);
    const campos = [];
    plan.filas.forEach((f, i) => {
      campos.push(campo('red' + i, `${f.nombre} · red/prefijo`, 'red', cidr(f.red, f.p)));
      campos.push(campo('gw' + i, `${f.nombre} · puerta de enlace`, 'ip', aTexto(f.primero)));
    });
    return {
      enunciado: `Una empresa separa sus departamentos en VLAN y dispone de la red \`${q.base}/${q.p0}\`. Asigna una subred a cada VLAN con VLSM: de **mayor a menor** número de equipos, una tras otra desde la dirección base (si dos empatan, respeta el orden de la tabla). En cada VLAN, la puerta de enlace usa la **primera** dirección asignable, y esa dirección **no está contada** en los equipos de la tabla.`,
      tabla: { cab: ['VLAN', 'Nombre', 'Equipos'], filas: q.vlans.map((v) => [String(v.id), v.nombre, miles(v.hosts)]) },
      campos,
      pistas: [
        'A cada VLAN le corresponde una subred propia. Suma 1 a sus equipos para contar la puerta de enlace.',
        'Después es un VLSM normal: (equipos + 1) + 2 → siguiente potencia de 2 → prefijo. De mayor a menor.',
        'La puerta de enlace de cada VLAN es su dirección de red + 1.',
      ],
      pasos: [
        { t: 'Regla de diseño: **una VLAN = una subred**. Cada subred debe alojar a los equipos y además a la puerta de enlace (la interfaz del router en esa VLAN). Se ordena de mayor a menor y se calcula cada bloque.',
          tabla: { cab: ['VLAN', 'Equipos + gateway', '+ 2 (red y broadcast)', 'Bloque', 'Prefijo', 'Hosts que ofrece'], filas: plan.filas.map((f) => [f.nombre, miles(f.pedidos), miles(f.pedidos + 2), miles(f.bloque), '/' + f.p, miles(hostsUtiles(f.p))]) } },
        { t: 'Se asignan en ese orden, cada una a continuación del broadcast de la anterior. La puerta de enlace es la primera dirección asignable (red + 1).',
          tabla: { cab: ['VLAN', 'Subred', 'Máscara', 'Puerta de enlace', 'Equipos', 'Broadcast'], filas: plan.filas.map((f) => [f.nombre, cidr(f.red, f.p), aTexto(mascara(f.p)), aTexto(f.primero), `${aTexto(f.primero + 1)} – ${aTexto(f.ultimo)}`, aTexto(f.broadcast)]) } },
        { t: plan.sobran > 0 ? `Quedan ${miles(plan.sobran)} direcciones libres a partir de \`${aTexto(plan.libre)}\` para futuras VLAN.` : 'El bloque queda completamente asignado.' },
      ],
    };
  },
});
