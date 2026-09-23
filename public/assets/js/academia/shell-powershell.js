/**
 * Academia de Comandos · Simulador de PowerShell
 * ---------------------------------------------------------------------
 * Lo que distingue a PowerShell de Bash y de CMD no es la sintaxis: es que
 * por la tubería NO viaja texto, viajan OBJETOS con propiedades. Este
 * simulador respeta esa diferencia, porque es justo lo que el curso tiene
 * que enseñar:
 *
 *   · cada cmdlet que produce datos devuelve  new Flujo(textoFormateado, objetos)
 *   · cada cmdlet que recibe datos lee        ctx.entrada.objetos
 *   · Get-Member enseña las propiedades REALES del objeto que llega
 *
 * Los bloques de script (`Where-Object { $_.CPU -gt 10 }`) se interpretan
 * con un mini analizador propio: NUNCA con eval() ni new Function(). El
 * texto del estudiante jamás se ejecuta como JavaScript.
 *
 * Versión de referencia: PowerShell 7. Cuando un cmdlet solo existe en
 * Windows PowerShell 5.1 o necesita un módulo concreto, se dice.
 */
import { comando, construirRegistro, Flujo } from './shell.js';
import { TIPO, modoTexto, ordenar, ErrorVFS } from './vfs.js';

/* =====================================================================
   1. Parámetros al estilo PowerShell:  -Nombre valor  /  -Conmutador
   ===================================================================== */

/** Parámetros que consumen el argumento siguiente. */
const CON_VALOR = new Set([
  '-path', '-literalpath', '-name', '-value', '-destination', '-newname', '-itemtype',
  '-filter', '-include', '-exclude', '-pattern', '-property', '-expandproperty',
  '-first', '-last', '-skip', '-totalcount', '-tail', '-id', '-processname',
  '-computername', '-port', '-remoteport', '-format', '-displayname', '-count',
  '-errorencoding', '-encoding', '-scope', '-logname', '-maxevents', '-classname',
  '-erroraction', '-informationaction', '-warningaction',
]);

/** ¿Es un nombre de parámetro (-Path) y no un valor negativo ni un operador? */
function esParametro(argumento) {
  return /^-[A-Za-z]/.test(argumento);
}

/**
 * Valor de un parámetro con nombre, sin distinguir mayúsculas.
 * Admite «-Path C:\x» y «-Path:C:\x».
 */
export function parametro(ctx, nombre, alias = []) {
  const buscados = [nombre.toLowerCase(), ...alias.map(a => a.toLowerCase())];
  for (let i = 0; i < ctx.args.length; i++) {
    const actual = String(ctx.args[i]);
    const minus = actual.toLowerCase();
    if (buscados.includes(minus)) {
      const siguiente = ctx.args[i + 1];
      return siguiente !== undefined && !esParametro(siguiente) ? siguiente : null;
    }
    for (const b of buscados) {
      if (minus.startsWith(b + ':')) return actual.slice(b.length + 1);
    }
  }
  return null;
}

/** ¿Está presente un conmutador? (-Recurse, -Force, -Descending…) */
export function tiene(ctx, nombre) {
  const objetivo = nombre.toLowerCase();
  return ctx.args.some(a => {
    const m = String(a).toLowerCase();
    return m === objetivo || m === objetivo + ':$true';
  });
}

/** Argumentos posicionales: ni nombres de parámetro ni valores consumidos. */
export function posicionales(ctx, extraConValor = []) {
  const conValor = new Set([...CON_VALOR, ...extraConValor.map(e => e.toLowerCase())]);
  const salida = [];
  for (let i = 0; i < ctx.args.length; i++) {
    const actual = String(ctx.args[i]);
    if (esParametro(actual)) {
      if (conValor.has(actual.toLowerCase()) && ctx.args[i + 1] !== undefined && !esParametro(ctx.args[i + 1])) i++;
      continue;
    }
    salida.push(actual);
  }
  return salida;
}

/**
 * Nombres oficiales de cada cmdlet. No se deducen poniendo mayúscula a
 * cada trozo porque PowerShell escribe Get-ChildItem, ForEach-Object o
 * Get-NetIPAddress, y enseñar «Get-Childitem» sería enseñarlo mal.
 */
const NOMBRES_OFICIALES = {
  'get-location': 'Get-Location', 'set-location': 'Set-Location', 'get-childitem': 'Get-ChildItem',
  'clear-host': 'Clear-Host', 'write-output': 'Write-Output', 'write-host': 'Write-Host',
  'get-command': 'Get-Command', 'get-help': 'Get-Help', 'get-member': 'Get-Member',
  'new-item': 'New-Item', 'remove-item': 'Remove-Item', 'copy-item': 'Copy-Item',
  'move-item': 'Move-Item', 'rename-item': 'Rename-Item', 'get-content': 'Get-Content',
  'set-content': 'Set-Content', 'add-content': 'Add-Content', 'test-path': 'Test-Path',
  'select-string': 'Select-String', 'get-process': 'Get-Process', 'stop-process': 'Stop-Process',
  'start-process': 'Start-Process', 'get-service': 'Get-Service', 'start-service': 'Start-Service',
  'stop-service': 'Stop-Service', 'restart-service': 'Restart-Service',
  'get-computerinfo': 'Get-ComputerInfo', 'get-date': 'Get-Date', 'get-winevent': 'Get-WinEvent',
  'get-ciminstance': 'Get-CimInstance', 'test-connection': 'Test-Connection',
  'test-netconnection': 'Test-NetConnection', 'get-netipaddress': 'Get-NetIPAddress',
  'resolve-dnsname': 'Resolve-DnsName', 'get-nettcpconnection': 'Get-NetTCPConnection',
  'where-object': 'Where-Object', 'select-object': 'Select-Object', 'sort-object': 'Sort-Object',
  'foreach-object': 'ForEach-Object', 'measure-object': 'Measure-Object',
  'group-object': 'Group-Object', 'format-table': 'Format-Table', 'format-list': 'Format-List',
  'out-string': 'Out-String', 'set-variable': 'Set-Variable', 'get-variable': 'Get-Variable',
};

/** Nombre oficial del cmdlet; si no está en la tabla, se compone por trozos. */
function nombreOficial(clave) {
  const minus = String(clave).toLowerCase();
  if (NOMBRES_OFICIALES[minus]) return NOMBRES_OFICIALES[minus];
  return minus.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-');
}

/* =====================================================================
   2. Objetos y formateo (Format-Table / Format-List de verdad)
   ===================================================================== */

/** Crea un objeto del pipeline con su nombre de tipo .NET declarado. */
function objeto(tipo, propiedades) {
  return Object.defineProperty({ ...propiedades }, '__tipo', {
    value: tipo, enumerable: false, writable: true, configurable: true,
  });
}

function tipoDe(valor) {
  if (valor === null || valor === undefined) return 'System.Object';
  if (typeof valor === 'string') return 'System.String';
  if (typeof valor === 'number') return Number.isInteger(valor) ? 'System.Int32' : 'System.Double';
  if (typeof valor === 'boolean') return 'System.Boolean';
  return valor.__tipo || 'System.Management.Automation.PSCustomObject';
}

function propiedadesDe(valor) {
  if (valor === null || valor === undefined) return [];
  if (typeof valor !== 'object') return ['Length'];
  return Object.keys(valor);
}

function valorPropiedad(objeto, propiedad) {
  if (objeto === null || objeto === undefined) return undefined;
  if (typeof objeto !== 'object') {
    if (String(propiedad).toLowerCase() === 'length') return String(objeto).length;
    return undefined;
  }
  const clave = Object.keys(objeto).find(k => k.toLowerCase() === String(propiedad).toLowerCase());
  return clave === undefined ? undefined : objeto[clave];
}

function textoDe(valor) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'boolean') return valor ? 'True' : 'False';
  if (typeof valor === 'number') return String(valor);
  return String(valor);
}

/** ¿La columna se alinea a la derecha? PowerShell lo hace con los números. */
function esNumerica(objetos, columna) {
  return objetos.some(o => typeof valorPropiedad(o, columna) === 'number');
}

/** Tabla con el aspecto de Format-Table: cabecera, guiones y columnas. */
function tabla(objetos, columnas = null) {
  if (!objetos || !objetos.length) return '';
  const cols = columnas || propiedadesDe(objetos[0]);
  if (!cols.length) return objetos.map(textoDe).join('\n') + '\n';

  const anchos = cols.map(c => {
    const largoValores = objetos.map(o => textoDe(valorPropiedad(o, c)).length);
    return Math.max(c.length, ...largoValores);
  });

  const alinear = (texto, ancho, derecha) => derecha ? texto.padStart(ancho) : texto.padEnd(ancho);
  const derechas = cols.map(c => esNumerica(objetos, c));

  const cabecera = cols.map((c, i) => alinear(c, anchos[i], derechas[i])).join(' ').trimEnd();
  const guiones = cols.map((c, i) => alinear('-'.repeat(c.length), anchos[i], derechas[i])).join(' ').trimEnd();
  const filas = objetos.map(o =>
    cols.map((c, i) => alinear(textoDe(valorPropiedad(o, c)), anchos[i], derechas[i])).join(' ').trimEnd());

  return '\n' + cabecera + '\n' + guiones + '\n' + filas.join('\n') + '\n\n';
}

/** Lista vertical con el aspecto de Format-List. */
function listaVertical(objetos, columnas = null) {
  if (!objetos || !objetos.length) return '';
  const bloques = objetos.map(o => {
    const cols = columnas || propiedadesDe(o);
    const ancho = Math.max(...cols.map(c => c.length));
    return cols.map(c => `${c.padEnd(ancho)} : ${textoDe(valorPropiedad(o, c))}`).join('\n');
  });
  return '\n' + bloques.join('\n\n') + '\n\n';
}

/** Objetos que llegan por la tubería; si solo hay texto, sus líneas. */
function entradaObjetos(ctx) {
  if (ctx.entrada && Array.isArray(ctx.entrada.objetos)) return ctx.entrada.objetos;
  const texto = ctx.entrada ? ctx.entrada.texto : '';
  if (!texto) return [];
  return texto.replace(/\n$/, '').split('\n');
}

/* =====================================================================
   3. Comparaciones y bloques de script — SIN eval
   ===================================================================== */

const OPERADORES = ['-eq', '-ne', '-gt', '-lt', '-ge', '-le', '-like', '-notlike', '-match', '-notmatch', '-contains', '-notcontains'];

function comodinARegex(patron) {
  const escapado = String(patron).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp('^' + escapado + '$', 'i');
}

/** Compara como PowerShell: sin distinguir mayúsculas en las cadenas. */
function comparar(valor, operador, esperado) {
  const n1 = typeof valor === 'number' ? valor : parseFloat(valor);
  const n2 = parseFloat(esperado);
  const numerico = !Number.isNaN(n1) && !Number.isNaN(n2) && String(esperado).trim() !== '';
  const s1 = textoDe(valor).toLowerCase();
  const s2 = textoDe(esperado).toLowerCase();

  switch (operador) {
    case '-eq': return numerico ? n1 === n2 : s1 === s2;
    case '-ne': return numerico ? n1 !== n2 : s1 !== s2;
    case '-gt': return numerico ? n1 > n2 : s1 > s2;
    case '-ge': return numerico ? n1 >= n2 : s1 >= s2;
    case '-lt': return numerico ? n1 < n2 : s1 < s2;
    case '-le': return numerico ? n1 <= n2 : s1 <= s2;
    case '-like': return comodinARegex(esperado).test(textoDe(valor));
    case '-notlike': return !comodinARegex(esperado).test(textoDe(valor));
    case '-match': { try { return new RegExp(esperado, 'i').test(textoDe(valor)); } catch { return false; } }
    case '-notmatch': { try { return !new RegExp(esperado, 'i').test(textoDe(valor)); } catch { return false; } }
    case '-contains': return Array.isArray(valor) && valor.some(v => textoDe(v).toLowerCase() === s2);
    case '-notcontains': return !(Array.isArray(valor) && valor.some(v => textoDe(v).toLowerCase() === s2));
    default: return false;
  }
}

/**
 * Analiza un bloque `{ $_.Prop -op valor }`, admitiendo -and y -or.
 * Devuelve una lista de condiciones y los enlaces entre ellas; si algo no
 * encaja con lo que el simulador cubre, devuelve null y el cmdlet lo dice.
 */
function analizarBloque(texto) {
  const limpio = texto.replace(/^\s*\{/, '').replace(/\}\s*$/, '').trim();
  if (!limpio) return null;

  const piezas = limpio.split(/\s+-(and|or)\s+/i);
  const condiciones = [];
  const enlaces = [];

  for (let i = 0; i < piezas.length; i++) {
    if (i % 2 === 1) { enlaces.push(piezas[i].toLowerCase()); continue; }
    const trozo = piezas[i].trim();
    const m = trozo.match(/^\$_\.([A-Za-z0-9_]+)\s+(-[A-Za-z]+)\s+(.+)$/);
    if (m) {
      const operador = m[2].toLowerCase();
      if (!OPERADORES.includes(operador)) return null;
      condiciones.push({ propiedad: m[1], operador, esperado: m[3].replace(/^["']|["']$/g, '') });
      continue;
    }
    const soloProp = trozo.match(/^\$_\.([A-Za-z0-9_]+)$/);
    if (soloProp) { condiciones.push({ propiedad: soloProp[1], operador: '-truthy' }); continue; }
    return null;
  }
  return { condiciones, enlaces };
}

function evaluarCondiciones(objeto, analisis) {
  let resultado = null;
  analisis.condiciones.forEach((cond, indice) => {
    const valor = valorPropiedad(objeto, cond.propiedad);
    const parcial = cond.operador === '-truthy'
      ? !!valor && valor !== 0 && valor !== ''
      : comparar(valor, cond.operador, cond.esperado);
    if (indice === 0) resultado = parcial;
    else resultado = analisis.enlaces[indice - 1] === 'or' ? (resultado || parcial) : (resultado && parcial);
  });
  return !!resultado;
}

/** Reconstruye el bloque { … } tal y como lo escribió el estudiante. */
function bloqueDe(ctx) {
  const unido = ctx.args.map(String).join(' ');
  const inicio = unido.indexOf('{');
  const fin = unido.lastIndexOf('}');
  if (inicio === -1 || fin === -1 || fin < inicio) return null;
  return unido.slice(inicio, fin + 1);
}

/* =====================================================================
   4. Utilidades del sistema de archivos virtual
   ===================================================================== */

function fechaPS(nodo) {
  const [fecha, hora] = (nodo.mtime || '2026-09-22 10:00').split(' ');
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}     ${hora}`;
}

function modoPS(nodo) {
  return nodo.esDir ? 'd----' : '-a---';
}

/** Objeto FileInfo / DirectoryInfo como el que devuelve Get-ChildItem. */
function itemObjeto(vfs, nodo, segs) {
  return objeto(nodo.esDir ? 'System.IO.DirectoryInfo' : 'System.IO.FileInfo', {
    Mode: modoPS(nodo),
    LastWriteTime: fechaPS(nodo),
    Length: nodo.esDir ? '' : nodo.tamano,
    Name: nodo.nombre,
    FullName: vfs.texto(segs),
    PSIsContainer: nodo.esDir,
  });
}

/** Tabla de Get-ChildItem, con su cabecera «Directorio:». */
function tablaDirectorio(items, rutaDirectorio) {
  if (!items.length) return '';
  const cuerpo = tabla(items, ['Mode', 'LastWriteTime', 'Length', 'Name']);
  return (rutaDirectorio ? `\n    Directorio: ${rutaDirectorio}\n` : '') + cuerpo;
}

function resolverRuta(ctx, ruta) {
  return ctx.vfs.segmentos(ruta === undefined || ruta === null ? '.' : ruta);
}

/* =====================================================================
   5. Cmdlets — fundamentos
   ===================================================================== */

const fundamentos = [
  comando('get-location', 'Muestra la ubicación actual', (ctx) => {
    const ruta = ctx.vfs.cwdTexto();
    return new Flujo(tabla([objeto('System.Management.Automation.PathInfo', { Path: ruta })], ['Path']),
      [objeto('System.Management.Automation.PathInfo', { Path: ruta })]);
  }, { alias: ['pwd', 'gl'] }),

  comando('set-location', 'Cambia de ubicación', (ctx) => {
    const destino = parametro(ctx, '-path') || posicionales(ctx)[0] || ctx.shell.entorno.USERPROFILE;
    const segs = resolverRuta(ctx, destino);
    const nodo = ctx.vfs.nodo(segs);
    if (!nodo) {
      ctx.error(`Set-Location : No se encuentra la ruta de acceso '${destino}' porque no existe.`);
      return { codigo: 1 };
    }
    if (!nodo.esDir) {
      ctx.error(`Set-Location : La ruta '${destino}' no es un directorio.`);
      return { codigo: 1 };
    }
    ctx.vfs.cwd = segs;
    return '';
  }, { alias: ['cd', 'sl', 'chdir'] }),

  comando('get-childitem', 'Lista el contenido de una ubicación', (ctx) => {
    const recursivo = tiene(ctx, '-recurse');
    const forzar = tiene(ctx, '-force');
    const filtro = parametro(ctx, '-filter');
    const ruta = parametro(ctx, '-path') || posicionales(ctx)[0] || '.';
    const segs = resolverRuta(ctx, ruta);
    const nodo = ctx.vfs.nodo(segs);

    if (!nodo) {
      ctx.error(`Get-ChildItem : No se encuentra la ruta de acceso '${ruta}' porque no existe.`);
      return { codigo: 1 };
    }

    const regexFiltro = filtro ? comodinARegex(filtro) : null;
    const visibles = (lista) => lista
      .filter(n => forzar || !n.nombre.startsWith('.'))
      .filter(n => !regexFiltro || regexFiltro.test(n.nombre))
      .sort(ordenar);

    if (!nodo.esDir) {
      const item = itemObjeto(ctx.vfs, nodo, segs);
      return new Flujo(tablaDirectorio([item], ctx.vfs.texto(segs.slice(0, -1))), [item]);
    }

    if (recursivo) {
      const objetos = [];
      const bloques = [];
      const porDirectorio = new Map();
      for (const { nodo: n, segs: s } of ctx.vfs.recorrer(segs)) {
        if (s.length === segs.length) continue;              // el propio directorio raíz
        const padre = ctx.vfs.texto(s.slice(0, -1));
        if (!porDirectorio.has(padre)) porDirectorio.set(padre, []);
        porDirectorio.get(padre).push(itemObjeto(ctx.vfs, n, s));
      }
      for (const [padre, items] of porDirectorio) {
        const filtrados = items.filter(i => !regexFiltro || regexFiltro.test(i.Name));
        if (!filtrados.length) continue;
        objetos.push(...filtrados);
        bloques.push(tablaDirectorio(filtrados, padre));
      }
      return new Flujo(bloques.join(''), objetos);
    }

    const items = visibles([...nodo.hijos.values()]).map(h => itemObjeto(ctx.vfs, h, segs.concat(h.nombre)));
    return new Flujo(tablaDirectorio(items, ctx.vfs.texto(segs)), items);
  }, { alias: ['gci', 'dir', 'ls'] }),

  comando('clear-host', 'Limpia la pantalla', () => ({ salida: '', limpiar: true }), { alias: ['cls', 'clear'] }),

  comando('write-output', 'Envía objetos al pipeline', (ctx) => {
    const valores = posicionales(ctx);
    if (!valores.length) return new Flujo(ctx.entrada.texto, entradaObjetos(ctx));
    return new Flujo(valores.join('\n') + '\n', valores);
  }, { alias: ['echo', 'write'] }),

  comando('write-host', 'Escribe en la consola (no en el pipeline)', (ctx) => {
    // Diferencia real: Write-Host pinta en pantalla y NO devuelve objetos,
    // por eso no se puede encadenar con | como Write-Output.
    const texto = posicionales(ctx).join(' ');
    return new Flujo(texto + '\n', null);
  }),

  comando('get-command', 'Lista los comandos disponibles', (ctx) => {
    const filtro = parametro(ctx, '-name') || posicionales(ctx)[0];
    const regex = filtro ? comodinARegex(filtro.includes('*') ? filtro : filtro + '*') : null;

    // PowerShell distingue Cmdlet de Alias, y eso importa: «Get-Command ls»
    // enseña que ls no es un comando, es un alias de Get-ChildItem.
    const canonicos = new Map();   // nombre canónico → comando
    const alias = [];              // {alias, apuntaA}
    for (const [clave, cmd] of ctx.shell.registro) {
      if (clave === cmd.nombre) canonicos.set(clave, cmd);
      else alias.push({ alias: clave, apuntaA: cmd.nombre });
    }

    const objetos = [
      ...[...canonicos.keys()].sort().map(n => objeto('System.Management.Automation.CmdletInfo', {
        CommandType: 'Cmdlet', Name: nombreOficial(n), Version: '7.4.0', Source: 'AcademiaSimulador',
      })),
      ...alias.sort((a, b) => a.alias.localeCompare(b.alias)).map(a => objeto('System.Management.Automation.AliasInfo', {
        CommandType: 'Alias', Name: `${a.alias} -> ${nombreOficial(a.apuntaA)}`, Version: '', Source: 'AcademiaSimulador',
      })),
    ].filter(o => !regex || regex.test(String(o.Name)));

    if (!objetos.length) {
      ctx.error(`Get-Command : No se encuentra ningún comando con el nombre '${filtro}'.`);
      return { codigo: 1 };
    }
    return new Flujo(tabla(objetos, ['CommandType', 'Name', 'Version', 'Source']), objetos);
  }, { alias: ['gcm'] }),

  comando('get-help', 'Ayuda de un cmdlet', (ctx) => {
    const nombre = (parametro(ctx, '-name') || posicionales(ctx)[0] || '').toLowerCase();
    if (!nombre) {
      return 'Get-Help : indica el nombre de un cmdlet. Ejemplo: Get-Help Get-Process\n';
    }
    const cmd = ctx.shell.registro.get(nombre);
    if (!cmd) {
      ctx.error(`Get-Help : No se encuentra la Ayuda para '${nombre}' en este simulador.`);
      return { codigo: 1 };
    }
    const ficha = (ctx.shell.fichas && ctx.shell.fichas[nombre]) || null;
    const oficial = nombreOficial(cmd.nombre);
    let salida = `\nNOMBRE\n    ${oficial}\n\nDESCRIPCIÓN\n    ${cmd.resumen}\n`;
    if (ficha) {
      if (ficha.sintaxis) salida += `\nSINTAXIS\n    ${ficha.sintaxis}\n`;
      if (ficha.explicacion_tecnica) salida += `\nDETALLE\n    ${ficha.explicacion_tecnica}\n`;
      if (Array.isArray(ficha.opciones) && ficha.opciones.length) {
        salida += '\nPARÁMETROS\n' + ficha.opciones.map(o => `    ${o.opcion}\n        ${o.significa}`).join('\n') + '\n';
      }
    }
    salida += '\nNOTA\n    Ayuda resumida del simulador de la Academia de Comandos.\n';
    return salida;
  }, { alias: ['help', 'man'] }),

  comando('get-member', 'Muestra las propiedades del objeto que llega por el pipeline', (ctx) => {
    const objetos = entradaObjetos(ctx);
    if (!objetos.length) {
      ctx.error('Get-Member : No se especificó ningún objeto para Get-Member.');
      return { codigo: 1 };
    }
    const muestra = objetos[0];
    const tipo = tipoDe(muestra);
    const miembros = propiedadesDe(muestra).map(p => {
      const valor = valorPropiedad(muestra, p);
      const tipoValor = typeof valor === 'number' ? 'double' : typeof valor === 'boolean' ? 'bool' : 'string';
      return objeto('Microsoft.PowerShell.Commands.MemberDefinition', {
        Name: p,
        MemberType: typeof muestra === 'object' ? 'Property' : 'Property',
        Definition: `${tipoValor} ${p} {get;set;}`,
      });
    });
    return new Flujo(`\n   TypeName: ${tipo}\n` + tabla(miembros, ['Name', 'MemberType', 'Definition']), miembros);
  }, { alias: ['gm'] }),
];

/* =====================================================================
   6. Cmdlets — archivos
   ===================================================================== */

const archivos = [
  comando('new-item', 'Crea un archivo o un directorio', (ctx) => {
    const tipo = (parametro(ctx, '-itemtype') || 'File').toLowerCase();
    const nombre = parametro(ctx, '-name');
    const rutaParam = parametro(ctx, '-path') || posicionales(ctx)[0];
    const valor = parametro(ctx, '-value') || '';
    const destino = nombre && rutaParam ? `${rutaParam}\\${nombre}` : (nombre || rutaParam);

    if (!destino) {
      ctx.error('New-Item : Falta el parámetro obligatorio -Path o -Name.');
      return { codigo: 1 };
    }
    const segs = resolverRuta(ctx, destino);
    if (ctx.vfs.nodo(segs) && !tiene(ctx, '-force')) {
      ctx.error(`New-Item : Ya existe un elemento con el nombre '${destino}'.`);
      return { codigo: 1 };
    }
    try {
      if (tipo.startsWith('dir')) ctx.vfs.mkdir(destino, { padres: true });
      else ctx.vfs.escribir(destino, valor);
    } catch (e) {
      ctx.error(`New-Item : No se puede crear '${destino}'.`);
      return { codigo: 1 };
    }
    const nodo = ctx.vfs.nodo(segs);
    const item = itemObjeto(ctx.vfs, nodo, segs);
    return new Flujo(tablaDirectorio([item], ctx.vfs.texto(segs.slice(0, -1))), [item]);
  }, { alias: ['ni'] }),

  comando('remove-item', 'Elimina archivos o directorios', (ctx) => {
    const recursivo = tiene(ctx, '-recurse');
    const forzar = tiene(ctx, '-force');
    const rutas = [parametro(ctx, '-path'), ...posicionales(ctx)].filter(Boolean);
    if (!rutas.length) {
      ctx.error('Remove-Item : Falta el parámetro obligatorio -Path.');
      return { codigo: 1 };
    }
    for (const ruta of rutas) {
      const nodo = ctx.vfs.nodo(resolverRuta(ctx, ruta));
      if (!nodo) {
        if (!forzar) ctx.error(`Remove-Item : No se encuentra la ruta de acceso '${ruta}' porque no existe.`);
        continue;
      }
      // PowerShell borra un directorio VACÍO sin -Recurse; si tiene
      // contenido pide confirmación. Aquí se exige -Recurse y se explica.
      if (nodo.esDir && nodo.hijos.size && !recursivo) {
        ctx.error(`Remove-Item : El directorio '${ruta}' no está vacío. Usa -Recurse para eliminarlo con su contenido.`);
        continue;
      }
      try {
        ctx.vfs.borrar(ruta, { recursivo: true });
      } catch (e) {
        ctx.error(`Remove-Item : No se puede eliminar '${ruta}': ${e.clave === 'protegido' ? 'acceso denegado' : 'error'}.`);
      }
    }
    return '';
  }, { alias: ['ri', 'rm', 'del', 'erase', 'rd'] }),

  comando('copy-item', 'Copia archivos o directorios', (ctx) => {
    const pos = posicionales(ctx);
    const origen = parametro(ctx, '-path') || pos[0];
    const destino = parametro(ctx, '-destination') || pos[1];
    const recursivo = tiene(ctx, '-recurse');
    if (!origen || !destino) {
      ctx.error('Copy-Item : Faltan -Path o -Destination.');
      return { codigo: 1 };
    }
    try {
      ctx.vfs.copiar(origen, destino, { recursivo: true });
    } catch (e) {
      if (e.clave === 'esdir' && !recursivo) ctx.error(`Copy-Item : '${origen}' es un directorio; usa -Recurse.`);
      else ctx.error(`Copy-Item : No se encuentra la ruta de acceso '${origen}' porque no existe.`);
      return { codigo: 1 };
    }
    return '';
  }, { alias: ['copy', 'cp', 'cpi' ] }),

  comando('move-item', 'Mueve archivos o directorios', (ctx) => {
    const pos = posicionales(ctx);
    const origen = parametro(ctx, '-path') || pos[0];
    const destino = parametro(ctx, '-destination') || pos[1];
    if (!origen || !destino) {
      ctx.error('Move-Item : Faltan -Path o -Destination.');
      return { codigo: 1 };
    }
    try {
      ctx.vfs.mover(origen, destino);
    } catch (e) {
      ctx.error(`Move-Item : No se encuentra la ruta de acceso '${origen}' porque no existe.`);
      return { codigo: 1 };
    }
    return '';
  }, { alias: ['move', 'mv', 'mi'] }),

  comando('rename-item', 'Cambia el nombre de un elemento', (ctx) => {
    const pos = posicionales(ctx);
    const origen = parametro(ctx, '-path') || pos[0];
    const nuevo = parametro(ctx, '-newname') || pos[1];
    if (!origen || !nuevo) {
      ctx.error('Rename-Item : Faltan -Path o -NewName.');
      return { codigo: 1 };
    }
    const segs = resolverRuta(ctx, origen);
    const destino = ctx.vfs.texto(segs.slice(0, -1).concat(nuevo));
    try {
      ctx.vfs.mover(origen, destino);
    } catch (e) {
      ctx.error(`Rename-Item : No se encuentra la ruta de acceso '${origen}' porque no existe.`);
      return { codigo: 1 };
    }
    return '';
  }, { alias: ['ren', 'rni'] }),

  comando('get-content', 'Lee el contenido de un archivo', (ctx) => {
    const ruta = parametro(ctx, '-path') || posicionales(ctx)[0];
    const total = parseInt(parametro(ctx, '-totalcount') || '0', 10);
    const cola = parseInt(parametro(ctx, '-tail') || '0', 10);
    if (!ruta) {
      ctx.error('Get-Content : Falta el parámetro obligatorio -Path.');
      return { codigo: 1 };
    }
    let contenido;
    try {
      contenido = ctx.vfs.leer(ruta);
    } catch (e) {
      if (e.clave === 'esdir') ctx.error(`Get-Content : El elemento '${ruta}' es un directorio.`);
      else ctx.error(`Get-Content : No se encuentra la ruta de acceso '${ruta}' porque no existe.`);
      return { codigo: 1 };
    }
    let lineas = contenido === '' ? [] : contenido.replace(/\n$/, '').split('\n');
    if (total > 0) lineas = lineas.slice(0, total);
    if (cola > 0) lineas = lineas.slice(-cola);
    // Get-Content devuelve un ARRAY de cadenas: por eso funciona
    // «Get-Content x.txt | Measure-Object -Line» y Get-Member dice String.
    return new Flujo(lineas.length ? lineas.join('\n') + '\n' : '', lineas);
  }, { alias: ['gc', 'cat', 'type'] }),

  comando('set-content', 'Escribe contenido en un archivo', (ctx) => {
    const pos = posicionales(ctx);
    const ruta = parametro(ctx, '-path') || pos[0];
    const valorParam = parametro(ctx, '-value');
    const objetos = entradaObjetos(ctx);
    const valor = valorParam !== null ? valorParam : (objetos.length ? objetos.map(textoDe).join('\n') : pos.slice(1).join(' '));
    if (!ruta) {
      ctx.error('Set-Content : Falta el parámetro obligatorio -Path.');
      return { codigo: 1 };
    }
    try {
      ctx.vfs.escribir(ruta, valor + (valor.endsWith('\n') ? '' : '\n'));
    } catch {
      ctx.error(`Set-Content : No se puede escribir en '${ruta}'.`);
      return { codigo: 1 };
    }
    return '';
  }, { alias: ['sc'] }),

  comando('add-content', 'Añade contenido al final de un archivo', (ctx) => {
    const pos = posicionales(ctx);
    const ruta = parametro(ctx, '-path') || pos[0];
    const valorParam = parametro(ctx, '-value');
    const objetos = entradaObjetos(ctx);
    const valor = valorParam !== null ? valorParam : (objetos.length ? objetos.map(textoDe).join('\n') : pos.slice(1).join(' '));
    if (!ruta) {
      ctx.error('Add-Content : Falta el parámetro obligatorio -Path.');
      return { codigo: 1 };
    }
    try {
      ctx.vfs.escribir(ruta, valor + (valor.endsWith('\n') ? '' : '\n'), { anexar: true });
    } catch {
      ctx.error(`Add-Content : No se puede escribir en '${ruta}'.`);
      return { codigo: 1 };
    }
    return '';
  }, { alias: ['ac'] }),

  comando('test-path', 'Comprueba si una ruta existe', (ctx) => {
    const ruta = parametro(ctx, '-path') || posicionales(ctx)[0];
    const existe = !!ruta && !!ctx.vfs.nodo(resolverRuta(ctx, ruta));
    return new Flujo((existe ? 'True' : 'False') + '\n', [existe]);
  }, { alias: ['tp'] }),

  comando('select-string', 'Busca texto dentro de archivos o del pipeline', (ctx) => {
    const pos = posicionales(ctx);
    const patron = parametro(ctx, '-pattern') || pos[0];
    const rutas = [parametro(ctx, '-path'), ...pos.slice(1)].filter(Boolean);
    if (!patron) {
      ctx.error('Select-String : Falta el parámetro obligatorio -Pattern.');
      return { codigo: 1 };
    }
    let regex;
    try {
      regex = new RegExp(patron, 'i');
    } catch {
      ctx.error(`Select-String : El patrón '${patron}' no es una expresión regular válida.`);
      return { codigo: 1 };
    }

    const coincidencias = [];
    const revisar = (nombreArchivo, texto) => {
      const lineas = texto.replace(/\n$/, '').split('\n');
      lineas.forEach((linea, i) => {
        if (regex.test(linea)) {
          coincidencias.push(objeto('Microsoft.PowerShell.Commands.MatchInfo', {
            Filename: nombreArchivo,
            LineNumber: i + 1,
            Line: linea,
            Pattern: patron,
          }));
        }
      });
    };

    if (rutas.length) {
      for (const ruta of rutas) {
        let contenido;
        try {
          contenido = ctx.vfs.leer(ruta);
        } catch {
          ctx.error(`Select-String : No se encuentra la ruta de acceso '${ruta}' porque no existe.`);
          continue;
        }
        revisar(ruta.split(/[\\/]/).pop(), contenido);
      }
    } else {
      revisar('InputStream', entradaObjetos(ctx).map(textoDe).join('\n'));
    }

    const texto = coincidencias.map(c => `${c.Filename}:${c.LineNumber}:${c.Line}`).join('\n');
    return new Flujo(texto ? texto + '\n' : '', coincidencias);
  }, { alias: ['sls'] }),
];

/* =====================================================================
   7. Cmdlets — procesos y servicios
   ===================================================================== */

/** Convierte un proceso del escenario en el objeto que ve PowerShell. */
function procesoObjeto(p) {
  return objeto('System.Diagnostics.Process', {
    Handles: p.handles !== undefined ? p.handles : 120,
    NPM: p.npm !== undefined ? p.npm : 12,
    PM: p.mem !== undefined ? Math.round(p.mem) : 0,
    WS: p.ws !== undefined ? p.ws : (p.mem !== undefined ? Math.round(p.mem) : 0),
    CPU: p.cpu !== undefined ? p.cpu : 0,
    Id: p.pid,
    SI: p.si !== undefined ? p.si : 1,
    Name: (p.comando || '').split(' ')[0].replace(/\.exe$/i, ''),
  });
}

const procesos = [
  comando('get-process', 'Lista los procesos en ejecución', (ctx) => {
    const nombre = parametro(ctx, '-name', ['-processname']) || posicionales(ctx)[0];
    const id = parametro(ctx, '-id');
    let lista = (ctx.shell.procesos || []).map(procesoObjeto);
    if (nombre) lista = lista.filter(p => comodinARegex(nombre).test(p.Name));
    if (id) lista = lista.filter(p => String(p.Id) === String(id));
    if (!lista.length && nombre) {
      ctx.error(`Get-Process : No se encuentra ningún proceso con el nombre '${nombre}'.`);
      return { codigo: 1 };
    }
    return new Flujo(tabla(lista, ['Handles', 'NPM', 'PM', 'WS', 'CPU', 'Id', 'SI', 'Name']), lista);
  }, { alias: ['ps', 'gps'] }),

  comando('stop-process', 'Detiene un proceso', (ctx) => {
    const id = parametro(ctx, '-id');
    const nombre = parametro(ctx, '-name', ['-processname']);
    const forzar = tiene(ctx, '-force');
    const lista = ctx.shell.procesos || [];
    const objetivos = [];

    if (id) objetivos.push(...lista.filter(p => String(p.pid) === String(id)));
    else if (nombre) objetivos.push(...lista.filter(p => comodinARegex(nombre).test((p.comando || '').split(' ')[0].replace(/\.exe$/i, ''))));
    else objetivos.push(...entradaObjetos(ctx).map(o => lista.find(p => p.pid === valorPropiedad(o, 'Id'))).filter(Boolean));

    if (!objetivos.length) {
      ctx.error(`Stop-Process : No se encuentra ningún proceso con ${id ? `Id ${id}` : `el nombre '${nombre || ''}'`}.`);
      return { codigo: 1 };
    }
    for (const p of objetivos) {
      if (p.protegido && !forzar) {
        ctx.error(`Stop-Process : No se puede detener el proceso '${(p.comando || '').split(' ')[0]}' (Id ${p.pid}): acceso denegado. Usa -Force si de verdad hace falta.`);
        continue;
      }
      const i = lista.indexOf(p);
      if (i >= 0) lista.splice(i, 1);
    }
    return '';
  }, { alias: ['spps', 'kill'] }),

  comando('start-process', 'Inicia un proceso', (ctx) => {
    const nombre = parametro(ctx, '-filepath', ['-name']) || posicionales(ctx)[0];
    if (!nombre) {
      ctx.error('Start-Process : Falta el parámetro obligatorio -FilePath.');
      return { codigo: 1 };
    }
    const lista = ctx.shell.procesos || (ctx.shell.procesos = []);
    const pid = 2000 + Math.floor(lista.length * 7 + 13);
    lista.push({ pid, usuario: ctx.shell.usuario || 'Alumno', comando: nombre, cpu: 0.1, mem: 25 });
    return '';
  }, { alias: ['saps'] }),

  comando('get-service', 'Lista los servicios del sistema', (ctx) => {
    const nombre = parametro(ctx, '-name') || posicionales(ctx)[0];
    const servicios = ctx.shell.servicios || {};
    let lista = Object.entries(servicios).map(([clave, s]) => objeto('System.ServiceProcess.ServiceController', {
      Status: s.activo ? 'Running' : 'Stopped',
      Name: clave,
      DisplayName: s.descripcion || clave,
    }));
    if (nombre) lista = lista.filter(s => comodinARegex(nombre).test(s.Name));
    if (!lista.length) {
      ctx.error(`Get-Service : No se encuentra ningún servicio con el nombre '${nombre || ''}'.`);
      return { codigo: 1 };
    }
    return new Flujo(tabla(lista, ['Status', 'Name', 'DisplayName']), lista);
  }, { alias: ['gsv'] }),

  comando('start-service', 'Inicia un servicio', (ctx) => {
    const nombre = parametro(ctx, '-name') || posicionales(ctx)[0];
    const servicios = ctx.shell.servicios || {};
    if (!nombre || !(nombre in servicios)) {
      ctx.error(`Start-Service : No se encuentra ningún servicio con el nombre '${nombre || ''}'.`);
      return { codigo: 1 };
    }
    servicios[nombre].activo = true;
    return '';
  }, { alias: ['sasv'] }),

  comando('stop-service', 'Detiene un servicio', (ctx) => {
    const nombre = parametro(ctx, '-name') || posicionales(ctx)[0];
    const servicios = ctx.shell.servicios || {};
    if (!nombre || !(nombre in servicios)) {
      ctx.error(`Stop-Service : No se encuentra ningún servicio con el nombre '${nombre || ''}'.`);
      return { codigo: 1 };
    }
    servicios[nombre].activo = false;
    return '';
  }, { alias: ['spsv'] }),

  comando('restart-service', 'Reinicia un servicio', (ctx) => {
    const nombre = parametro(ctx, '-name') || posicionales(ctx)[0];
    const servicios = ctx.shell.servicios || {};
    if (!nombre || !(nombre in servicios)) {
      ctx.error(`Restart-Service : No se encuentra ningún servicio con el nombre '${nombre || ''}'.`);
      return { codigo: 1 };
    }
    servicios[nombre].activo = true;
    return '';
  }),
];

/* =====================================================================
   8. Cmdlets — sistema
   ===================================================================== */

const sistema = [
  comando('get-computerinfo', 'Información del equipo', (ctx) => {
    const info = objeto('Microsoft.PowerShell.Commands.ComputerInfo', {
      CsName: ctx.shell.entorno.COMPUTERNAME || 'ACADEMIA',
      WindowsProductName: 'Windows 11 Pro',
      WindowsVersion: '23H2',
      OsArchitecture: '64 bits',
      CsProcessors: 'Intel(R) Core(TM) i5',
      CsTotalPhysicalMemory: 17179869184,
    });
    return new Flujo(listaVertical([info]), [info]);
  }),

  comando('get-date', 'Fecha y hora actuales', (ctx) => {
    const formato = parametro(ctx, '-format');
    const fecha = { anio: 2026, mes: 9, dia: 22, hora: 10, minuto: 0, segundo: 0 };
    const dosDigitos = (n) => String(n).padStart(2, '0');
    if (formato) {
      const texto = String(formato)
        .replace(/yyyy/g, String(fecha.anio))
        .replace(/MM/g, dosDigitos(fecha.mes))
        .replace(/dd/g, dosDigitos(fecha.dia))
        .replace(/HH/g, dosDigitos(fecha.hora))
        .replace(/mm/g, dosDigitos(fecha.minuto))
        .replace(/ss/g, dosDigitos(fecha.segundo));
      return new Flujo(texto + '\n', [texto]);
    }
    const objetoFecha = objeto('System.DateTime', {
      Year: fecha.anio, Month: fecha.mes, Day: fecha.dia,
      Hour: fecha.hora, Minute: fecha.minuto, Second: fecha.segundo,
      DayOfWeek: 'Tuesday',
    });
    return new Flujo('martes, 22 de septiembre de 2026 10:00:00\n', [objetoFecha]);
  }),

  comando('get-winevent', 'Lee registros de eventos de Windows', (ctx) => {
    const logName = parametro(ctx, '-logname') || posicionales(ctx)[0] || 'System';
    const maximo = parseInt(parametro(ctx, '-maxevents') || '0', 10);
    const registros = ctx.shell.registros || [];
    const servicios = ctx.shell.servicios || {};

    const eventos = [];
    registros.forEach((linea, i) => {
      eventos.push(objeto('System.Diagnostics.Eventing.Reader.EventLogRecord', {
        TimeCreated: '22/09/2026 10:00:00', Id: 1000 + i, LevelDisplayName: 'Information',
        ProviderName: logName, Message: textoDe(linea),
      }));
    });
    for (const [nombre, s] of Object.entries(servicios)) {
      for (const linea of (s.log || [])) {
        eventos.push(objeto('System.Diagnostics.Eventing.Reader.EventLogRecord', {
          TimeCreated: '22/09/2026 10:00:00', Id: 7000, LevelDisplayName: s.fallado ? 'Error' : 'Information',
          ProviderName: nombre, Message: linea,
        }));
      }
    }
    if (!eventos.length) {
      return 'Get-WinEvent : este escenario no tiene eventos cargados. Los escenarios que sí los traen los definen en su registro de sucesos.\n';
    }
    const lista = maximo > 0 ? eventos.slice(0, maximo) : eventos;
    return new Flujo(tabla(lista, ['TimeCreated', 'Id', 'LevelDisplayName', 'ProviderName', 'Message']), lista);
  }),

  comando('get-ciminstance', 'Consulta clases CIM/WMI', (ctx) => {
    const clase = (parametro(ctx, '-classname') || posicionales(ctx)[0] || '').toLowerCase();
    if (clase === 'win32_operatingsystem') {
      const o = objeto('Microsoft.Management.Infrastructure.CimInstance', {
        Caption: 'Microsoft Windows 11 Pro', Version: '10.0.22631',
        OSArchitecture: '64 bits', CSName: ctx.shell.entorno.COMPUTERNAME || 'ACADEMIA',
      });
      return new Flujo(listaVertical([o]), [o]);
    }
    if (clase === 'win32_logicaldisk') {
      const discos = [
        objeto('Microsoft.Management.Infrastructure.CimInstance', { DeviceID: 'C:', Size: 512110190592, FreeSpace: 208494592000 }),
      ];
      return new Flujo(tabla(discos, ['DeviceID', 'Size', 'FreeSpace']), discos);
    }
    ctx.error(`Get-CimInstance : este simulador solo cubre Win32_OperatingSystem y Win32_LogicalDisk. La clase '${clase || '(ninguna)'}' no está implementada.`);
    return { codigo: 1 };
  }, { alias: ['gcim'] }),
];

/* =====================================================================
   9. Cmdlets — red
   ===================================================================== */

const red = [
  comando('test-connection', 'Comprueba la conectividad con un equipo', (ctx) => {
    const destino = parametro(ctx, '-computername', ['-targetname']) || posicionales(ctx)[0];
    if (!destino) {
      ctx.error('Test-Connection : Falta el parámetro obligatorio -TargetName.');
      return { codigo: 1 };
    }
    const hosts = ctx.shell.red || {};
    const info = hosts[destino];
    if (!info) {
      ctx.error(`Test-Connection : No se puede resolver el nombre de host '${destino}'.`);
      return { codigo: 1 };
    }
    const respuestas = [1, 2, 3, 4].map(n => objeto('Microsoft.PowerShell.Commands.TestConnectionCommand+PingStatus', {
      Ping: n,
      Destination: destino,
      IPV4Address: info.ip,
      Latency: info.responde ? 1 + n : 0,
      Status: info.responde ? 'Success' : 'TimedOut',
    }));
    return new Flujo(tabla(respuestas, ['Ping', 'Destination', 'IPV4Address', 'Latency', 'Status']), respuestas);
  }, { alias: ['tnc-ping'] }),

  comando('test-netconnection', 'Comprueba conectividad y un puerto TCP', (ctx) => {
    const destino = parametro(ctx, '-computername') || posicionales(ctx)[0];
    const puerto = parametro(ctx, '-port', ['-remoteport']);
    const hosts = ctx.shell.red || {};
    const puertos = ctx.shell.puertos || [];
    const info = hosts[destino];
    if (!destino || !info) {
      ctx.error(`Test-NetConnection : No se puede resolver el nombre de host '${destino || ''}'.`);
      return { codigo: 1 };
    }
    const abierto = puerto ? puertos.some(p => String(p.puerto) === String(puerto)) : null;
    const resultado = objeto('Microsoft.PowerShell.Commands.NetConnectionResult', {
      ComputerName: destino,
      RemoteAddress: info.ip,
      RemotePort: puerto || '',
      PingSucceeded: !!info.responde,
      TcpTestSucceeded: puerto ? !!abierto : '',
    });
    return new Flujo(listaVertical([resultado]), [resultado]);
  }, { alias: ['tnc'] }),

  comando('get-netipaddress', 'Direcciones IP de los adaptadores', (ctx) => {
    const lista = [
      objeto('Microsoft.Management.Infrastructure.CimInstance', { InterfaceAlias: 'Ethernet', IPAddress: '192.168.56.10', PrefixLength: 24, AddressFamily: 'IPv4' }),
      objeto('Microsoft.Management.Infrastructure.CimInstance', { InterfaceAlias: 'Loopback', IPAddress: '127.0.0.1', PrefixLength: 8, AddressFamily: 'IPv4' }),
    ];
    return new Flujo(tabla(lista, ['InterfaceAlias', 'IPAddress', 'PrefixLength', 'AddressFamily']), lista);
  }),

  comando('resolve-dnsname', 'Consulta DNS', (ctx) => {
    const nombre = parametro(ctx, '-name') || posicionales(ctx)[0];
    const hosts = ctx.shell.red || {};
    const info = hosts[nombre];
    if (!info) {
      ctx.error(`Resolve-DnsName : ${nombre || ''} : El nombre DNS no existe.`);
      return { codigo: 1 };
    }
    const o = objeto('Microsoft.DnsClient.Commands.DnsRecord_A', {
      Name: nombre, Type: 'A', TTL: 300, IPAddress: info.ip,
    });
    return new Flujo(tabla([o], ['Name', 'Type', 'TTL', 'IPAddress']), [o]);
  }),

  comando('get-nettcpconnection', 'Conexiones y puertos TCP', (ctx) => {
    const lista = (ctx.shell.puertos || []).map(p => objeto('Microsoft.Management.Infrastructure.CimInstance', {
      LocalAddress: p.direccion,
      LocalPort: p.puerto,
      State: 'Listen',
      OwningProcess: p.proceso || '',
    }));
    if (!lista.length) return 'Este escenario no define puertos en escucha.\n';
    return new Flujo(tabla(lista, ['LocalAddress', 'LocalPort', 'State', 'OwningProcess']), lista);
  }),
];

/* =====================================================================
   10. Cmdlets — el pipeline de objetos (el corazón del curso)
   ===================================================================== */

const pipeline = [
  comando('where-object', 'Filtra objetos por una condición', (ctx) => {
    const objetos = entradaObjetos(ctx);
    const bloque = bloqueDe(ctx);

    if (bloque) {
      const analisis = analizarBloque(bloque);
      if (!analisis) {
        ctx.error('Where-Object : este simulador entiende bloques del tipo { $_.Propiedad -op valor } unidos por -and/-or. Otras expresiones de PowerShell no están implementadas.');
        return { codigo: 1 };
      }
      const filtrados = objetos.filter(o => evaluarCondiciones(o, analisis));
      return new Flujo(filtrados.length ? tabla(filtrados) : '', filtrados);
    }

    // Sintaxis simplificada:  Where-Object Propiedad -op valor
    const args = ctx.args.map(String);
    const iOperador = args.findIndex(a => OPERADORES.includes(a.toLowerCase()));
    if (iOperador <= 0) {
      ctx.error('Where-Object : usa «Where-Object Propiedad -op valor» o «Where-Object { $_.Propiedad -op valor }».');
      return { codigo: 1 };
    }
    const propiedad = args[iOperador - 1];
    const operador = args[iOperador].toLowerCase();
    const esperado = args[iOperador + 1];
    const filtrados = objetos.filter(o => comparar(valorPropiedad(o, propiedad), operador, esperado));
    return new Flujo(filtrados.length ? tabla(filtrados) : '', filtrados);
  }, { alias: ['where', '?'] }),

  comando('select-object', 'Elige propiedades o un número de objetos', (ctx) => {
    let objetos = entradaObjetos(ctx);
    const primeros = parametro(ctx, '-first');
    const ultimos = parametro(ctx, '-last');
    const saltar = parametro(ctx, '-skip');
    const expandir = parametro(ctx, '-expandproperty');
    const propParam = parametro(ctx, '-property');
    const pos = posicionales(ctx);
    const propiedades = (propParam || pos[0] || '').split(',').map(p => p.trim()).filter(Boolean);

    if (saltar) objetos = objetos.slice(parseInt(saltar, 10));
    if (primeros) objetos = objetos.slice(0, parseInt(primeros, 10));
    if (ultimos) objetos = objetos.slice(-parseInt(ultimos, 10));

    if (expandir) {
      const valores = objetos.map(o => valorPropiedad(o, expandir));
      return new Flujo(valores.map(textoDe).join('\n') + (valores.length ? '\n' : ''), valores);
    }

    if (propiedades.length) {
      const reducidos = objetos.map(o => {
        const nuevo = objeto('System.Management.Automation.PSCustomObject', {});
        for (const p of propiedades) {
          const clave = typeof o === 'object' && o !== null
            ? (Object.keys(o).find(k => k.toLowerCase() === p.toLowerCase()) || p)
            : p;
          nuevo[clave] = valorPropiedad(o, p);
        }
        return nuevo;
      });
      return new Flujo(tabla(reducidos), reducidos);
    }

    return new Flujo(objetos.length ? tabla(objetos) : '', objetos);
  }, { alias: ['select'] }),

  comando('sort-object', 'Ordena los objetos del pipeline', (ctx) => {
    const objetos = [...entradaObjetos(ctx)];
    const descendente = tiene(ctx, '-descending');
    const propParam = parametro(ctx, '-property');
    const propiedad = propParam || posicionales(ctx)[0] || null;

    objetos.sort((a, b) => {
      const va = propiedad ? valorPropiedad(a, propiedad) : a;
      const vb = propiedad ? valorPropiedad(b, propiedad) : b;
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      return textoDe(va).localeCompare(textoDe(vb), 'es');
    });
    if (descendente) objetos.reverse();
    return new Flujo(objetos.length ? tabla(objetos) : '', objetos);
  }, { alias: ['sort'] }),

  comando('foreach-object', 'Recorre los objetos del pipeline', (ctx) => {
    const objetos = entradaObjetos(ctx);
    const bloque = bloqueDe(ctx);
    let propiedad = null;

    if (bloque) {
      const m = bloque.replace(/^\s*\{/, '').replace(/\}\s*$/, '').trim().match(/^\$_\.([A-Za-z0-9_]+)$/);
      if (!m) {
        ctx.error('ForEach-Object : este simulador solo cubre la forma { $_.Propiedad }. Los bloques con cálculos o llamadas a métodos no están implementados.');
        return { codigo: 1 };
      }
      propiedad = m[1];
    } else {
      propiedad = posicionales(ctx)[0] || null;
    }
    if (!propiedad) {
      ctx.error('ForEach-Object : indica una propiedad, por ejemplo: ForEach-Object Name');
      return { codigo: 1 };
    }
    const valores = objetos.map(o => valorPropiedad(o, propiedad));
    return new Flujo(valores.map(textoDe).join('\n') + (valores.length ? '\n' : ''), valores);
  }, { alias: ['foreach', '%'] }),

  comando('measure-object', 'Calcula cuenta, suma, media, máximo y mínimo', (ctx) => {
    const objetos = entradaObjetos(ctx);
    const propParam = parametro(ctx, '-property');
    const propiedad = propParam || posicionales(ctx)[0] || null;
    const quiereSuma = tiene(ctx, '-sum');
    const quiereMedia = tiene(ctx, '-average');
    const quiereMax = tiene(ctx, '-maximum');
    const quiereMin = tiene(ctx, '-minimum');

    const numeros = objetos
      .map(o => (propiedad ? valorPropiedad(o, propiedad) : o))
      .map(v => (typeof v === 'number' ? v : parseFloat(v)))
      .filter(v => !Number.isNaN(v));

    const redondear = (n) => Math.round(n * 100) / 100;
    const resultado = objeto('Microsoft.PowerShell.Commands.GenericMeasureInfo', { Count: objetos.length });
    if (quiereMedia) resultado.Average = numeros.length ? redondear(numeros.reduce((s, n) => s + n, 0) / numeros.length) : '';
    if (quiereSuma) resultado.Sum = redondear(numeros.reduce((s, n) => s + n, 0));
    if (quiereMax) resultado.Maximum = numeros.length ? Math.max(...numeros) : '';
    if (quiereMin) resultado.Minimum = numeros.length ? Math.min(...numeros) : '';
    resultado.Property = propiedad || '';

    return new Flujo(listaVertical([resultado]), [resultado]);
  }, { alias: ['measure'] }),

  comando('group-object', 'Agrupa objetos por una propiedad', (ctx) => {
    const objetos = entradaObjetos(ctx);
    const propParam = parametro(ctx, '-property');
    const propiedad = propParam || posicionales(ctx)[0];
    if (!propiedad) {
      ctx.error('Group-Object : indica la propiedad por la que agrupar.');
      return { codigo: 1 };
    }
    const grupos = new Map();
    for (const o of objetos) {
      const clave = textoDe(valorPropiedad(o, propiedad));
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave).push(o);
    }
    const lista = [...grupos.entries()].map(([nombre, miembros]) => objeto('Microsoft.PowerShell.Commands.GroupInfo', {
      Count: miembros.length, Name: nombre, Group: miembros.length + ' elemento(s)',
    }));
    return new Flujo(tabla(lista, ['Count', 'Name', 'Group']), lista);
  }, { alias: ['group'] }),

  comando('format-table', 'Muestra los objetos como tabla', (ctx) => {
    const objetos = entradaObjetos(ctx);
    const propParam = parametro(ctx, '-property');
    const pos = posicionales(ctx);
    const columnas = (propParam || pos[0] || '').split(',').map(p => p.trim()).filter(Boolean);
    return new Flujo(objetos.length ? tabla(objetos, columnas.length ? columnas : null) : '', objetos);
  }, { alias: ['ft'] }),

  comando('format-list', 'Muestra los objetos como lista vertical', (ctx) => {
    const objetos = entradaObjetos(ctx);
    const propParam = parametro(ctx, '-property');
    const pos = posicionales(ctx);
    const columnas = (propParam || pos[0] || '').split(',').map(p => p.trim()).filter(Boolean);
    return new Flujo(objetos.length ? listaVertical(objetos, columnas.length ? columnas : null) : '', objetos);
  }, { alias: ['fl'] }),

  comando('out-string', 'Convierte los objetos en texto', (ctx) => {
    const objetos = entradaObjetos(ctx);
    const texto = objetos.length && typeof objetos[0] === 'object' ? tabla(objetos) : objetos.map(textoDe).join('\n') + '\n';
    return new Flujo(texto, null);
  }),
];

/* =====================================================================
   11. Variables
   ===================================================================== */

const variables = [
  comando('set-variable', 'Define una variable', (ctx) => {
    const pos = posicionales(ctx);
    const nombre = parametro(ctx, '-name') || pos[0];
    const valor = parametro(ctx, '-value') !== null ? parametro(ctx, '-value') : pos[1];
    if (!nombre) {
      ctx.error('Set-Variable : Falta el parámetro obligatorio -Name.');
      return { codigo: 1 };
    }
    ctx.shell.entorno[nombre] = valor === undefined ? '' : valor;
    return '';
  }, { alias: ['sv', 'set'] }),

  comando('get-variable', 'Muestra las variables definidas', (ctx) => {
    const nombre = parametro(ctx, '-name') || posicionales(ctx)[0];
    const entradas = Object.entries(ctx.shell.entorno)
      .filter(([clave]) => !clave.startsWith('__'))
      .filter(([clave]) => !nombre || comodinARegex(nombre).test(clave))
      .map(([clave, valor]) => objeto('System.Management.Automation.PSVariable', { Name: clave, Value: textoDe(valor) }));
    if (!entradas.length) {
      ctx.error(`Get-Variable : No se encuentra ninguna variable con el nombre '${nombre || ''}'.`);
      return { codigo: 1 };
    }
    return new Flujo(tabla(entradas, ['Name', 'Value']), entradas);
  }, { alias: ['gv'] }),
];

/* =====================================================================
   12. Registro
   ===================================================================== */

export const COMANDOS_PS = [
  ...fundamentos,
  ...archivos,
  ...procesos,
  ...sistema,
  ...red,
  ...pipeline,
  ...variables,
];

export const registroPs = () => construirRegistro(COMANDOS_PS);
