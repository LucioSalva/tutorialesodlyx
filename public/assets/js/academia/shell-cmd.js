/**
 * Academia de Comandos · Comandos de Windows CMD
 * ---------------------------------------------------------------------
 * El intérprete tradicional de Windows, NO PowerShell. Aquí no hay
 * objetos ni cmdlets: todo lo que viaja por una tubería es texto, las
 * opciones se escriben con barra (/S, /B) y las variables con %VAR%.
 *
 * Igual que en el resto del simulador: ningún comando toca el disco real
 * ni ejecuta nada del sistema. Todo ocurre contra el VFS de la pestaña.
 * Lo que un comando real hace y aquí no está implementado se dice en voz
 * alta en vez de fingirlo.
 */
import { comando, construirRegistro, Flujo } from './shell.js';
import { TIPO, modoTexto, ordenar, ErrorVFS } from './vfs.js';

// ------------------------------------------------------------------ apoyo
const SERIE_VOLUMEN = '1A2B-3C4D';
const LIBRE_BYTES = 35651584;

function lineasDe(texto) {
  if (texto === '') return [];
  return texto.replace(/\n$/, '').split('\n');
}

function aTexto(lineas) {
  return lineas.length ? lineas.join('\n') + '\n' : '';
}

/** 35651584 → «35.651.584» (separador de miles español, como el dir real). */
function numeroEs(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** ¿Está presente la opción /X? banderas() las guarda en minúscula. */
function opcion(ctx, letra) {
  return ctx.flags.largas.has(String(letra).toLowerCase());
}

/**
 * Valor de las opciones con dos puntos (/C:"texto", /T:4). El separador de
 * opciones las deja en operandos porque llevan «:», así que se buscan a
 * mano sobre los argumentos originales.
 */
function valorPegado(ctx, prefijo) {
  const p = prefijo.toLowerCase();
  for (const a of ctx.args) {
    if (String(a).toLowerCase().startsWith(p)) return String(a).slice(prefijo.length);
  }
  return null;
}

/** Operandos «de verdad»: sin los que en realidad eran /C:algo o -an. */
function operandosLimpios(ctx) {
  return ctx.operandos.filter(o => !String(o).startsWith('/') && !/^-[A-Za-z]+$/.test(String(o)));
}

/** Algunos comandos de red usan guion al estilo UNIX (netstat -an, arp -a). */
function letrasGuion(ctx) {
  const set = new Set();
  for (const a of ctx.args) {
    const s = String(a);
    if (/^-[A-Za-z]+$/.test(s)) for (const c of s.slice(1)) set.add(c.toLowerCase());
  }
  return set;
}

/** 22/09/2026  10:00 — el formato de fecha corta del dir español. */
function fechaCmd(nodo) {
  const [f, h] = (nodo && nodo.mtime ? nodo.mtime : '2026-09-22 10:00').split(' ');
  const [anio, mes, dia] = f.split('-');
  return `${dia}/${mes}/${anio}  ${h}`;
}

/** Contenido de un fichero o, si no hay rutas, lo que llegue por la tubería. */
function textoEntrada(ctx, rutas) {
  if (rutas && rutas.length) {
    const partes = [];
    for (const r of rutas) {
      try { partes.push(ctx.vfs.leer(r)); }
      catch (e) {
        if (e.clave === 'esdir') ctx.error('Acceso denegado.');
        else ctx.error('El sistema no puede encontrar el archivo especificado.');
      }
    }
    return partes.join('');
  }
  return ctx.entrada.texto;
}

/** Expande comodines sencillos dentro de un directorio del VFS. */
function coincidencias(ctx, patron) {
  const texto = String(patron);
  if (!/[*?]/.test(texto)) return [texto];
  const corte = Math.max(texto.lastIndexOf('\\'), texto.lastIndexOf('/'));
  const prefijo = corte >= 0 ? texto.slice(0, corte + 1) : '';
  const nombre = corte >= 0 ? texto.slice(corte + 1) : texto;
  const dir = ctx.vfs.nodo(prefijo === '' ? ctx.vfs.cwd : ctx.vfs.segmentos(prefijo));
  if (!dir || !dir.esDir) return [texto];
  const regex = new RegExp('^' + nombre
    .replace(/[.+^${}()|\\[\]]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.') + '$', 'i');
  const hallados = [...dir.hijos.values()]
    .filter(h => regex.test(h.nombre))
    .map(h => prefijo + h.nombre)
    .sort((a, b) => a.localeCompare(b, 'es'));
  return hallados.length ? hallados : [texto];
}

/** Ejecuta una línea anidada (if, for, cmd /c) sin ensuciar el historial. */
function ejecutarAnidado(ctx, linea) {
  const r = ctx.shell.ejecutar(linea);
  ctx.shell.historial.pop();
  return {
    salida: aTexto(r.lineas.filter(l => l.clase !== 'err').map(l => l.texto)),
    errores: r.lineas.filter(l => l.clase === 'err').map(l => l.texto),
    codigo: r.codigo,
  };
}

// ----------------------------------------------------------- fundamentos
const fundamentos = [
  comando('help', 'Muestra los comandos disponibles en el simulador', (ctx) => {
    const nombres = [...new Set([...ctx.shell.registro.keys()])].sort();
    const filas = nombres.map(n => {
      const c = ctx.shell.registro.get(n);
      return `${n.toUpperCase().padEnd(12)} ${c.resumen}`;
    });
    return 'Para obtener más información sobre un comando específico, escriba HELP\n' +
           'seguido del nombre del comando. En este simulador están implementados:\n\n' +
           aTexto(filas);
  }),

  comando('dir', 'Muestra la lista de archivos y subdirectorios de un directorio', (ctx) => {
    const simple = opcion(ctx, 'b');
    const conOcultos = opcion(ctx, 'a');
    const recursivo = opcion(ctx, 's');
    const rutas = operandosLimpios(ctx);
    const objetivo = rutas.length ? rutas[0] : undefined;

    const segs = objetivo === undefined ? ctx.vfs.cwd : ctx.vfs.segmentos(objetivo);
    const nodo = ctx.vfs.nodo(segs);
    if (!nodo) return { errores: ['El sistema no puede encontrar la ruta especificada.'], codigo: 1 };

    // dir sobre un archivo suelto lo lista a él, no a su contenido.
    const dirs = nodo.esDir ? [{ segs, nodo }] : [{ segs: segs.slice(0, -1), nodo: ctx.vfs.nodo(segs.slice(0, -1)) }];
    if (recursivo && nodo.esDir) {
      for (const par of ctx.vfs.recorrer(segs)) {
        if (par.nodo.esDir && par.nodo !== nodo) dirs.push({ segs: par.segs, nodo: par.nodo });
      }
    }

    const partes = [];
    let totalArchivos = 0;
    let totalBytes = 0;

    if (!simple) {
      partes.push(' El volumen de la unidad C no tiene etiqueta.');
      partes.push(` El número de serie del volumen es: ${SERIE_VOLUMEN}`);
    }

    for (const d of dirs) {
      let hijos = nodo.esDir ? [...d.nodo.hijos.values()] : [nodo];
      if (!conOcultos) hijos = hijos.filter(h => !h.nombre.startsWith('.'));
      hijos.sort(ordenar);

      if (simple) {
        for (const h of hijos) partes.push(recursivo ? ctx.vfs.texto(d.segs.concat(h.nombre)) : h.nombre);
        continue;
      }

      partes.push('');
      partes.push(` Directorio de ${ctx.vfs.texto(d.segs)}`);
      partes.push('');

      const filas = [];
      if (d.segs.length) {
        filas.push(`${fechaCmd(d.nodo)}    <DIR>          .`);
        filas.push(`${fechaCmd(d.nodo)}    <DIR>          ..`);
      }
      let archivos = 0;
      let bytes = 0;
      for (const h of hijos) {
        if (h.esDir) {
          filas.push(`${fechaCmd(h)}    <DIR>          ${h.nombre}`);
        } else {
          archivos++;
          bytes += h.tamano;
          filas.push(`${fechaCmd(h)}    ${numeroEs(h.tamano).padStart(14)} ${h.nombre}`);
        }
      }
      partes.push(...filas);
      const numDirs = hijos.filter(h => h.esDir).length + (d.segs.length ? 2 : 0);
      partes.push(`${String(archivos).padStart(16)} archivos ${numeroEs(bytes).padStart(15)} bytes`);
      if (!recursivo) partes.push(`${String(numDirs).padStart(16)} dirs  ${numeroEs(LIBRE_BYTES).padStart(15)} bytes libres`);
      totalArchivos += archivos;
      totalBytes += bytes;
    }

    if (!simple && recursivo) {
      partes.push('');
      partes.push('     Total de archivos en la lista:');
      partes.push(`${String(totalArchivos).padStart(16)} archivos ${numeroEs(totalBytes).padStart(15)} bytes`);
      partes.push(`${String(dirs.length).padStart(16)} dirs  ${numeroEs(LIBRE_BYTES).padStart(15)} bytes libres`);
    }

    return aTexto(partes);
  }),

  comando('cd', 'Muestra el nombre del directorio actual o lo cambia', (ctx) => {
    // En CMD «cd» a secas IMPRIME la ruta: no vuelve al perfil del usuario
    // como hace cd en Linux. Es una de las confusiones clásicas del curso.
    let destino = operandosLimpios(ctx)[0];
    if (ctx.nombre === 'cd..' || ctx.nombre === 'chdir..') destino = '..';
    if (ctx.nombre === 'cd\\' || ctx.nombre === 'chdir\\') destino = '\\';
    if (destino === undefined) return ctx.vfs.cwdTexto() + '\n';

    const segs = ctx.vfs.segmentos(destino);
    const nodo = ctx.vfs.nodo(segs);
    if (!nodo) return { errores: ['El sistema no puede encontrar la ruta especificada.'], codigo: 1 };
    if (!nodo.esDir) return { errores: ['El directorio no es válido.'], codigo: 1 };
    ctx.vfs.cwd = segs;
    ctx.shell.entorno.CD = ctx.vfs.cwdTexto();
    return '';
  }, { alias: ['chdir', 'cd..', 'chdir..', 'cd\\', 'chdir\\'] }),

  comando('cls', 'Borra la pantalla', () => ({ salida: '', limpiar: true })),

  comando('echo', 'Muestra mensajes o activa y desactiva el eco', (ctx) => {
    // «echo.» imprime una línea vacía; es un token propio porque no lleva
    // espacio, así que llega como nombre del comando.
    if (ctx.nombre === 'echo.') return '\n';
    if (!ctx.args.length) return 'ECHO está activado.\n';
    const primero = String(ctx.args[0]).toLowerCase();
    if (ctx.args.length === 1 && (primero === 'off' || primero === 'on')) return '';
    return ctx.args.join(' ') + '\n';
  }, { alias: ['echo.'] }),

  comando('ver', 'Muestra la versión de Windows', () =>
    '\nMicrosoft Windows [Versión 10.0.19045.4529]\n'),

  comando('date', 'Muestra o establece la fecha', (ctx) => {
    if (opcion(ctx, 't')) return 'mar 22/09/2026\n';
    return 'La fecha actual es: mar 22/09/2026\nEscriba la nueva fecha: (dd-mm-aa) (el simulador no cambia la fecha del sistema)\n';
  }),

  comando('time', 'Muestra o establece la hora', (ctx) => {
    if (opcion(ctx, 't')) return '10:00\n';
    return 'La hora actual es: 10:00:00,00\nEscriba la nueva hora: (el simulador no cambia la hora del sistema)\n';
  }),

  comando('prompt', 'Cambia el símbolo del sistema', (ctx) =>
    ctx.args.length ? '' : 'PROMPT=$P$G\n'),

  comando('title', 'Establece el título de la ventana', () => ''),

  comando('exit', 'Sale del intérprete de comandos', () =>
    'En el simulador no hay ventana que cerrar: sigues en la terminal de la academia.\n'),

  comando('pause', 'Suspende la ejecución de un archivo por lotes', () =>
    'Presione una tecla para continuar . . .\n'),

  comando('rem', 'Comentario dentro de un archivo por lotes', () => ''),

  comando('cmd', 'Inicia una nueva instancia del intérprete', (ctx) => {
    const i = ctx.args.findIndex(a => String(a).toLowerCase() === '/c' || String(a).toLowerCase() === '/k');
    if (i < 0) return '\nMicrosoft Windows [Versión 10.0.19045.4529]\n(el simulador ya está dentro de cmd)\n';
    const linea = ctx.args.slice(i + 1).join(' ');
    if (!linea) return '';
    const r = ejecutarAnidado(ctx, linea);
    return { salida: r.salida, errores: r.errores, codigo: r.codigo };
  }),
];

// ------------------------------------------------------------- archivos
const archivos = [
  comando('mkdir', 'Crea un directorio', (ctx) => {
    const rutas = operandosLimpios(ctx);
    if (!rutas.length) return { errores: ['La sintaxis del comando no es correcta.'], codigo: 1 };
    for (const ruta of rutas) {
      try {
        // md crea toda la rama por defecto: no hace falta un -p como en Linux.
        ctx.vfs.mkdir(ruta, { padres: true });
      } catch (e) {
        if (e.clave === 'existe') ctx.error(`Ya existe un subdirectorio o un archivo con el nombre ${ruta}.`);
        else ctx.error('El sistema no puede encontrar la ruta especificada.');
      }
    }
    return '';
  }, { alias: ['md'] }),

  comando('rmdir', 'Elimina un directorio', (ctx) => {
    const conContenido = opcion(ctx, 's');
    const rutas = operandosLimpios(ctx);
    if (!rutas.length) return { errores: ['La sintaxis del comando no es correcta.'], codigo: 1 };
    for (const ruta of rutas) {
      const nodo = ctx.vfs.nodo(ruta);
      if (!nodo) { ctx.error('El sistema no puede encontrar el archivo especificado.'); continue; }
      if (!nodo.esDir) { ctx.error('El directorio no es válido.'); continue; }
      if (nodo.hijos.size && !conContenido) { ctx.error('El directorio no está vacío.'); continue; }
      try { ctx.vfs.borrar(ruta, { recursivo: true }); }
      catch (e) { ctx.error(e.clave === 'protegido' ? 'Acceso denegado.' : 'El sistema no puede encontrar el archivo especificado.'); }
    }
    return '';
  }, { alias: ['rd'] }),

  comando('copy', 'Copia uno o más archivos en otro lugar', (ctx) => {
    const rutas = operandosLimpios(ctx);
    if (rutas.length < 2) return { errores: ['La sintaxis del comando no es correcta.'], codigo: 1 };
    if (rutas.some(r => r.includes('+'))) {
      return { errores: ['En este simulador copy no implementa la concatenación con «+».'], codigo: 1 };
    }
    const destino = rutas[rutas.length - 1];
    const origenes = rutas.slice(0, -1).flatMap(o => coincidencias(ctx, o));
    let copiados = 0;
    for (const origen of origenes) {
      const nodo = ctx.vfs.nodo(origen);
      if (!nodo) { ctx.error('El sistema no puede encontrar el archivo especificado.'); continue; }
      // copy es solo para archivos: las carpetas son terreno de xcopy/robocopy.
      if (nodo.esDir) { ctx.error(`${origen} es un directorio: copy solo copia archivos, usa xcopy o robocopy.`); continue; }
      try { ctx.vfs.copiar(origen, destino); copiados++; }
      catch { ctx.error('El sistema no puede encontrar la ruta especificada.'); }
    }
    return copiados ? `        ${copiados} archivo(s) copiado(s).\n` : { salida: '', codigo: 1 };
  }),

  comando('xcopy', 'Copia archivos y árboles de directorios', (ctx) => {
    const rutas = operandosLimpios(ctx);
    const recursivo = opcion(ctx, 'e') || opcion(ctx, 's');
    const crearDestino = opcion(ctx, 'i');
    if (rutas.length < 2) return { errores: ['Faltan parámetros de archivo'], codigo: 4 };
    const [origen, destino] = rutas;
    const nodoOrigen = ctx.vfs.nodo(origen);
    if (!nodoOrigen) return { errores: ['No se encontró el archivo'], codigo: 4 };

    if (nodoOrigen.esDir && !recursivo) {
      return { errores: ['xcopy sin /E o /S no copia subdirectorios. Añade /E para copiar el árbol completo.'], codigo: 4 };
    }
    if (!ctx.vfs.existe(destino)) {
      if (nodoOrigen.esDir || crearDestino) ctx.vfs.mkdir(destino, { padres: true });
    }
    const copiados = [];
    if (nodoOrigen.esDir) {
      const baseSegs = ctx.vfs.segmentos(origen);
      const destSegs = ctx.vfs.segmentos(destino);
      for (const { nodo, segs } of ctx.vfs.recorrer(baseSegs)) {
        if (segs.length === baseSegs.length) continue;
        const rel = segs.slice(baseSegs.length);
        const rutaDestino = ctx.vfs.texto(destSegs.concat(rel));
        if (nodo.esDir) ctx.vfs.mkdir(rutaDestino, { padres: true });
        else { ctx.vfs.escribir(rutaDestino, nodo.contenido); copiados.push(rel.join('\\')); }
      }
    } else {
      ctx.vfs.copiar(origen, destino);
      copiados.push(nodoOrigen.nombre);
    }
    return aTexto(copiados.map(c => `${origen}\\${c}`.replace(/\\\\/g, '\\'))) +
           `${copiados.length} archivo(s) copiado(s)\n`;
  }),

  comando('robocopy', 'Copia robusta de archivos y carpetas', (ctx) => {
    const rutas = operandosLimpios(ctx);
    if (rutas.length < 2) return { errores: ['ERROR : Se requieren origen y destino.'], codigo: 16 };
    const [origen, destino] = rutas;
    const nodoOrigen = ctx.vfs.nodo(origen);
    if (!nodoOrigen || !nodoOrigen.esDir) {
      return { errores: [`ERROR 3 (0x00000003) Obteniendo el directorio de origen ${origen}`], codigo: 16 };
    }
    if (!ctx.vfs.existe(destino)) ctx.vfs.mkdir(destino, { padres: true });

    const baseSegs = ctx.vfs.segmentos(origen);
    const destSegs = ctx.vfs.segmentos(destino);
    let dirs = 0;
    let ficheros = 0;
    let bytes = 0;
    for (const { nodo, segs } of ctx.vfs.recorrer(baseSegs)) {
      if (segs.length === baseSegs.length) continue;
      const rel = segs.slice(baseSegs.length);
      const rutaDestino = ctx.vfs.texto(destSegs.concat(rel));
      if (nodo.esDir) { ctx.vfs.mkdir(rutaDestino, { padres: true }); dirs++; }
      else { ctx.vfs.escribir(rutaDestino, nodo.contenido); ficheros++; bytes += nodo.tamano; }
    }
    return [
      '-------------------------------------------------------------------------------',
      '   ROBOCOPY     ::     Herramienta para copia eficaz de archivos',
      '-------------------------------------------------------------------------------',
      '',
      `  Origen : ${ctx.vfs.texto(baseSegs)}\\`,
      ` Destino : ${ctx.vfs.texto(destSegs)}\\`,
      '',
      '    Archivos : *.*',
      '',
      '------------------------------------------------------------------------------',
      '',
      '                 Total  Copiado  Omitido   ERROR',
      `   Directorios : ${String(dirs + 1).padStart(6)} ${String(dirs + 1).padStart(8)} ${String(0).padStart(8)} ${String(0).padStart(7)}`,
      `      Archivos : ${String(ficheros).padStart(6)} ${String(ficheros).padStart(8)} ${String(0).padStart(8)} ${String(0).padStart(7)}`,
      `         Bytes : ${String(numeroEs(bytes)).padStart(6)}`,
      '',
    ].join('\n') + '\n';
  }),

  comando('move', 'Mueve archivos y cambia el nombre de archivos y directorios', (ctx) => {
    const rutas = operandosLimpios(ctx);
    if (rutas.length < 2) return { errores: ['La sintaxis del comando no es correcta.'], codigo: 1 };
    const destino = rutas[rutas.length - 1];
    const origenes = rutas.slice(0, -1).flatMap(o => coincidencias(ctx, o));
    let movidos = 0;
    for (const origen of origenes) {
      try { ctx.vfs.mover(origen, destino); movidos++; }
      catch (e) {
        if (e.clave === 'protegido') ctx.error('Acceso denegado.');
        else ctx.error('El sistema no puede encontrar el archivo especificado.');
      }
    }
    return movidos ? `        ${movidos} archivo(s) movido(s).\n` : { salida: '', codigo: 1 };
  }),

  comando('del', 'Elimina uno o más archivos', (ctx) => {
    const rutas = operandosLimpios(ctx).flatMap(o => coincidencias(ctx, o));
    const silencioso = opcion(ctx, 'q');
    if (!rutas.length) return { errores: ['La sintaxis del comando no es correcta.'], codigo: 1 };
    for (const ruta of rutas) {
      const nodo = ctx.vfs.nodo(ruta);
      if (!nodo) { ctx.error('No se encuentra ' + ctx.vfs.texto(ctx.vfs.segmentos(ruta))); continue; }
      if (nodo.esDir) {
        // El del real preguntaría «¿Está seguro (S/N)?» y vaciaría la carpeta.
        // El simulador no implementa esa confirmación: lo dice y no borra.
        ctx.error(`${ruta} es un directorio. En este simulador del no borra carpetas: usa rmdir /S ${ruta}.`);
        continue;
      }
      try { ctx.vfs.borrar(ruta); }
      catch (e) { ctx.error(e.clave === 'protegido' ? 'Acceso denegado.' : 'No se encuentra el archivo.'); }
    }
    return silencioso ? '' : '';
  }, { alias: ['erase'] }),

  comando('ren', 'Cambia el nombre de archivos', (ctx) => {
    const [origen, nombreNuevo] = operandosLimpios(ctx);
    if (!origen || !nombreNuevo) return { errores: ['La sintaxis del comando no es correcta.'], codigo: 1 };
    if (/[\\/]/.test(nombreNuevo)) {
      return { errores: ['ren no admite rutas en el destino: cambia el nombre en el mismo directorio.'], codigo: 1 };
    }
    const segs = ctx.vfs.segmentos(origen);
    if (!ctx.vfs.nodo(segs)) return { errores: ['El sistema no puede encontrar el archivo especificado.'], codigo: 1 };
    const destino = ctx.vfs.texto(segs.slice(0, -1).concat(nombreNuevo));
    if (ctx.vfs.existe(destino)) return { errores: ['Ya existe un archivo con el mismo nombre.'], codigo: 1 };
    ctx.vfs.mover(origen, destino);
    return '';
  }, { alias: ['rename'] }),

  comando('type', 'Muestra el contenido de un archivo de texto', (ctx) => {
    const rutas = operandosLimpios(ctx).flatMap(o => coincidencias(ctx, o));
    if (!rutas.length) return { errores: ['La sintaxis del comando no es correcta.'], codigo: 1 };
    const partes = [];
    for (const ruta of rutas) {
      const nodo = ctx.vfs.nodo(ruta);
      if (!nodo) { ctx.error('El sistema no puede encontrar el archivo especificado.'); continue; }
      if (nodo.esDir) { ctx.error('Acceso denegado.'); continue; }
      if (rutas.length > 1) partes.push(`\n${ruta}\n\n`);
      partes.push(nodo.contenido);
    }
    return partes.join('');
  }),

  comando('tree', 'Muestra gráficamente la estructura de carpetas', (ctx) => {
    const conArchivos = opcion(ctx, 'f');
    const base = operandosLimpios(ctx)[0];
    const segs = base ? ctx.vfs.segmentos(base) : ctx.vfs.cwd;
    const raiz = ctx.vfs.nodo(segs);
    if (!raiz) return { errores: ['El sistema no puede encontrar la ruta especificada.'], codigo: 1 };

    const lineas = [
      'Listado de rutas de carpetas para el volumen Windows',
      `El número de serie del volumen es ${SERIE_VOLUMEN}`,
      base ? ctx.vfs.texto(segs) : 'C:.',
    ];
    const recorrer = (nodo, prefijo) => {
      let hijos = [...nodo.hijos.values()].sort(ordenar);
      if (!conArchivos) hijos = hijos.filter(h => h.esDir);
      hijos.forEach((h, i) => {
        const ultimo = i === hijos.length - 1;
        // CMD dibuja el árbol con tres guiones, no con uno como tree de Linux.
        lineas.push(prefijo + (ultimo ? '└───' : '├───') + h.nombre);
        if (h.esDir) recorrer(h, prefijo + (ultimo ? '    ' : '│   '));
      });
    };
    recorrer(raiz, '');
    return aTexto(lineas);
  }),

  comando('attrib', 'Muestra o cambia los atributos de un archivo', (ctx) => {
    const rutas = operandosLimpios(ctx).flatMap(o => coincidencias(ctx, o));
    const cambios = ctx.args.filter(a => /^[+-][RHSA]$/i.test(String(a)));
    if (!rutas.length) {
      const hijos = [...ctx.vfs.nodo(ctx.vfs.cwd).hijos.values()].sort(ordenar);
      return aTexto(hijos.map(h => `${h.oculto ? 'H' : 'A'}  ${h.esDir ? 'D' : ' '}       ${ctx.vfs.texto(ctx.vfs.cwd.concat(h.nombre))}`));
    }
    const salida = [];
    for (const ruta of rutas) {
      const nodo = ctx.vfs.nodo(ruta);
      if (!nodo) { ctx.error(`No se encuentra el archivo - ${ruta}`); continue; }
      for (const c of cambios) {
        const letra = String(c).slice(1).toUpperCase();
        if (letra === 'H') nodo.oculto = String(c)[0] === '+';
      }
      if (!cambios.length) salida.push(`${nodo.oculto ? 'H' : 'A'}  ${nodo.esDir ? 'D' : ' '}       ${ctx.vfs.texto(ctx.vfs.segmentos(ruta))}`);
    }
    return aTexto(salida);
  }),

  comando('where', 'Busca archivos o comandos', (ctx) => {
    const operandos = operandosLimpios(ctx);
    // where /R CARPETA PATRÓN busca hacia abajo desde CARPETA. Antes esta
    // rama devolvía la propia carpeta en lugar de los archivos que
    // coinciden, que es justo lo contrario de lo que se le pide.
    const recursivo = ctx.args.some(a => /^\/r$/i.test(a));
    if (recursivo) {
      const i = ctx.args.findIndex(a => /^\/r$/i.test(a));
      const carpeta = ctx.args[i + 1];
      const patron = operandos.find(o => o !== carpeta) || '*';
      const segsBase = ctx.vfs.segmentos(carpeta || '.');
      if (!ctx.vfs.nodo(segsBase)) {
        return { errores: ['INFORMACIÓN: No se pudo encontrar los archivos para el patrón especificado.'], codigo: 1 };
      }
      const regex = new RegExp('^' + String(patron)
        .replace(/[.+^${}()|\[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.') + '$', 'i');
      const encontrados = [];
      for (const { nodo, segs } of ctx.vfs.recorrer(segsBase)) {
        if (nodo.esDir) continue;
        if (regex.test(nodo.nombre)) encontrados.push(ctx.vfs.texto(segs));
      }
      if (!encontrados.length) {
        return { errores: [`INFORMACIÓN: No se pudo encontrar los archivos para el patrón especificado: ${patron}`], codigo: 1 };
      }
      return aTexto(encontrados.sort());
    }

    const objetivo = operandos[0];
    if (!objetivo) return { errores: ['ERROR: La sintaxis del comando no es correcta.'], codigo: 2 };
    const salida = [];
    if (ctx.shell.registro.has(String(objetivo).toLowerCase())) {
      salida.push(`C:\\Windows\\System32\\${String(objetivo).toLowerCase()}.exe`);
    }
    for (const patron of coincidencias(ctx, objetivo)) {
      const segs = ctx.vfs.segmentos(patron);
      if (ctx.vfs.nodo(segs)) salida.push(ctx.vfs.texto(segs));
    }
    if (!salida.length) {
      return { errores: [`INFORMACIÓN: No se pudo encontrar los archivos para el patrón especificado: ${objetivo}`], codigo: 1 };
    }
    return aTexto([...new Set(salida)]);
  }),
];

// --------------------------------------------------- búsqueda y texto
const busqueda = [
  comando('find', 'Busca una cadena de texto en uno o más archivos', (ctx) => {
    const ignorar = opcion(ctx, 'i');
    const invertir = opcion(ctx, 'v');
    const contar = opcion(ctx, 'c');
    const numerar = opcion(ctx, 'n');
    const operandos = operandosLimpios(ctx);
    const patron = operandos[0];
    if (patron === undefined) return { errores: ['FIND: Formato de parámetros incorrecto'], codigo: 2 };

    const rutas = operandos.slice(1).flatMap(o => coincidencias(ctx, o));
    const aguja = ignorar ? String(patron).toLowerCase() : String(patron);
    const busca = (linea) => {
      const objetivo = ignorar ? linea.toLowerCase() : linea;
      return objetivo.includes(aguja);
    };

    const partes = [];
    const fuentes = rutas.length
      ? rutas.map(r => {
          const nodo = ctx.vfs.nodo(r);
          if (!nodo || nodo.esDir) { ctx.error(`FIND: ${r}: No se encuentra el archivo`); return null; }
          // find imprime el nombre tal y como lo escribió el usuario, en mayúsculas.
          return { nombre: String(r).toUpperCase(), texto: nodo.contenido };
        }).filter(Boolean)
      : [{ nombre: null, texto: ctx.entrada.texto }];

    let totalCoincidencias = 0;
    for (const f of fuentes) {
      const encontradas = [];
      lineasDe(f.texto).forEach((l, i) => {
        if (busca(l) !== invertir) encontradas.push(numerar ? `[${i + 1}]${l}` : l);
      });
      totalCoincidencias += encontradas.length;
      // find de verdad antepone «---------- ARCHIVO» en mayúsculas, y con /C
      // el recuento va en esa misma línea en vez de listar las coincidencias.
      if (contar) {
        partes.push(f.nombre ? `---------- ${f.nombre}: ${encontradas.length}` : String(encontradas.length));
      } else {
        if (f.nombre) partes.push(`---------- ${f.nombre}`);
        partes.push(...encontradas);
      }
    }
    return { salida: aTexto(partes), codigo: totalCoincidencias ? 0 : 1 };
  }),

  comando('findstr', 'Busca cadenas de texto en archivos', (ctx) => {
    const ignorar = opcion(ctx, 'i');
    const numerar = opcion(ctx, 'n');
    const recursivo = opcion(ctx, 's');
    const literal = opcion(ctx, 'l');
    const operandos = operandosLimpios(ctx);

    // /C:"frase con espacios" es la forma de buscar una cadena literal.
    const conC = valorPegado(ctx, '/C:');
    const patron = conC !== null ? conC : operandos[0];
    if (patron === undefined || patron === null) {
      return { errores: ['FINDSTR: Se esperaba un argumento de búsqueda'], codigo: 2 };
    }
    const rutasBrutas = conC !== null ? operandos : operandos.slice(1);
    const rutas = rutasBrutas.flatMap(o => coincidencias(ctx, o));

    let comprobar;
    if (literal || conC !== null) {
      const aguja = ignorar ? String(patron).toLowerCase() : String(patron);
      comprobar = (l) => (ignorar ? l.toLowerCase() : l).includes(aguja);
    } else {
      let regex;
      try { regex = new RegExp(String(patron), ignorar ? 'i' : ''); }
      catch { return { errores: ['FINDSTR: Expresión regular no válida'], codigo: 2 }; }
      comprobar = (l) => regex.test(l);
    }

    const fuentes = [];
    if (recursivo && !rutas.length) {
      for (const { nodo, segs } of ctx.vfs.recorrer(ctx.vfs.cwd)) {
        if (!nodo.esDir) fuentes.push({ nombre: ctx.vfs.texto(segs), texto: nodo.contenido });
      }
    } else if (rutas.length) {
      for (const r of rutas) {
        const nodo = ctx.vfs.nodo(r);
        if (!nodo) { ctx.error(`FINDSTR: No se puede abrir ${r}`); continue; }
        if (nodo.esDir) {
          if (!recursivo) continue;
          for (const par of ctx.vfs.recorrer(ctx.vfs.segmentos(r))) {
            if (!par.nodo.esDir) fuentes.push({ nombre: ctx.vfs.texto(par.segs), texto: par.nodo.contenido });
          }
        } else {
          fuentes.push({ nombre: r, texto: nodo.contenido });
        }
      }
    } else {
      fuentes.push({ nombre: null, texto: ctx.entrada.texto });
    }

    const salida = [];
    const varios = fuentes.length > 1;
    for (const f of fuentes) {
      lineasDe(f.texto).forEach((l, i) => {
        if (!comprobar(l)) return;
        const prefijoArchivo = (varios || recursivo) && f.nombre ? `${f.nombre}:` : '';
        salida.push(`${prefijoArchivo}${numerar ? (i + 1) + ':' : ''}${l}`);
      });
    }
    return { salida: aTexto(salida), codigo: salida.length ? 0 : 1 };
  }),

  comando('fc', 'Compara dos archivos y muestra las diferencias', (ctx) => {
    const [a, b] = operandosLimpios(ctx);
    if (!a || !b) return { errores: ['FC: Parámetros incorrectos'], codigo: 2 };
    let ta, tb;
    try { ta = lineasDe(ctx.vfs.leer(a)); } catch { return { errores: [`FC: no se puede abrir ${a} - No existe el archivo`], codigo: 2 }; }
    try { tb = lineasDe(ctx.vfs.leer(b)); } catch { return { errores: [`FC: no se puede abrir ${b} - No existe el archivo`], codigo: 2 }; }

    const cabecera = `Comparando los archivos ${a} y ${String(b).toUpperCase()}`;
    const iguales = ta.length === tb.length && ta.every((l, i) => l === tb[i]);
    if (iguales) return `${cabecera}\nFC: no se encontraron diferencias\n\n`;

    const dif = [];
    const max = Math.max(ta.length, tb.length);
    for (let i = 0; i < max; i++) {
      if (ta[i] !== tb[i]) {
        dif.push(`***** ${a}`);
        if (ta[i] !== undefined) dif.push(ta[i]);
        dif.push(`***** ${String(b).toUpperCase()}`);
        if (tb[i] !== undefined) dif.push(tb[i]);
        dif.push('*****');
      }
    }
    return { salida: `${cabecera}\n` + aTexto(dif), codigo: 1 };
  }),

  comando('sort', 'Ordena líneas de texto', (ctx) => {
    const invertir = opcion(ctx, 'r');
    const rutas = operandosLimpios(ctx);
    const lineas = lineasDe(textoEntrada(ctx, rutas));
    lineas.sort((x, y) => x.localeCompare(y, 'es'));
    if (invertir) lineas.reverse();
    return aTexto(lineas);
  }),

  comando('more', 'Muestra la salida pantalla a pantalla', (ctx) => {
    const rutas = operandosLimpios(ctx);
    // En el simulador no hay paginación: la terminal ya tiene barra propia.
    return textoEntrada(ctx, rutas);
  }),
];

// -------------------------------------------------------------- sistema
const sistema = [
  comando('hostname', 'Muestra el nombre del equipo', (ctx) =>
    (ctx.shell.entorno.COMPUTERNAME || 'ACADEMIA').toLowerCase() + '\n'),

  comando('whoami', 'Muestra el usuario actual', (ctx) => {
    const equipo = (ctx.shell.entorno.COMPUTERNAME || 'ACADEMIA').toLowerCase();
    const usuario = (ctx.shell.entorno.USERNAME || 'Alumno').toLowerCase();
    return `${equipo}\\${usuario}\n`;
  }),

  comando('systeminfo', 'Muestra la configuración del equipo', (ctx) => {
    const equipo = ctx.shell.entorno.COMPUTERNAME || 'ACADEMIA';
    return [
      `Nombre de host:                            ${equipo}`,
      'Nombre del sistema operativo:              Microsoft Windows 10 Pro',
      'Versión del sistema operativo:             10.0.19045 N/D Compilación 19045',
      'Fabricante del sistema operativo:          Microsoft Corporation',
      'Configuración del sistema operativo:       Estación de trabajo independiente',
      'Tipo de compilación del sistema operativo: Multiprocessor Free',
      `Propietario registrado:                    ${ctx.shell.entorno.USERNAME || 'Alumno'}`,
      'Fecha de instalación original:             22/09/2026, 09:00:00',
      'Tiempo de arranque del sistema:            22/09/2026, 06:44:00',
      'Fabricante del sistema:                    Academia de Comandos',
      'Modelo el sistema:                         Laboratorio virtual',
      'Tipo de sistema:                           x64-based PC',
      'Procesador(es):                            1 Procesador(es) instalado(s).',
      'Memoria física total:                      8.192 MB',
      'Memoria física disponible:                 4.096 MB',
      'Dominio:                                   WORKGROUP',
      '',
    ].join('\n');
  }),

  comando('tasklist', 'Muestra los procesos en ejecución', (ctx) => {
    const procesos = ctx.shell.procesos || [];
    const filtroImagen = valorPegado(ctx, '/FI') !== null ? null : null;
    const cabecera = [
      'Nombre de imagen                PID Nombre de sesión        Núm. de ses Uso de memoria',
      '========================= ======== ================ =================== ============',
    ];
    const filas = procesos.map(p => {
      const nombre = String(p.comando).split(/[\s]/)[0];
      const sesion = p.usuario === 'SYSTEM' ? 'Services' : 'Console';
      const numSesion = p.usuario === 'SYSTEM' ? 0 : 1;
      const memoria = p.memoria !== undefined ? p.memoria : Math.round((p.mem || 0) * 1024);
      return `${nombre.padEnd(25)} ${String(p.pid).padStart(8)} ${sesion.padEnd(16)} ${String(numSesion).padStart(19)} ${(numeroEs(memoria) + ' KB').padStart(12)}`;
    });
    return aTexto(cabecera.concat(filas));
  }),

  comando('taskkill', 'Finaliza uno o más procesos', (ctx) => {
    const procesos = ctx.shell.procesos || [];
    const forzar = opcion(ctx, 'f');
    const args = ctx.args.map(String);
    const iPid = args.findIndex(a => a.toLowerCase() === '/pid');
    const iIm = args.findIndex(a => a.toLowerCase() === '/im');
    const pid = iPid >= 0 ? parseInt(args[iPid + 1], 10) : parseInt(valorPegado(ctx, '/PID:') || '', 10);
    const imagen = iIm >= 0 ? args[iIm + 1] : valorPegado(ctx, '/IM:');

    if (Number.isNaN(pid) && !imagen) {
      return { errores: ['ERROR: argumentos no válidos o faltantes. Usa /PID o /IM.'], codigo: 1 };
    }

    const objetivos = procesos.filter(p =>
      (!Number.isNaN(pid) && p.pid === pid) ||
      (imagen && String(p.comando).split(/\s/)[0].toLowerCase() === String(imagen).toLowerCase()));

    if (!objetivos.length) {
      return {
        errores: [Number.isNaN(pid)
          ? `ERROR: el proceso "${imagen}" no se encontró.`
          : `ERROR: el proceso con PID ${pid} no se encontró.`],
        codigo: 128,
      };
    }

    const salida = [];
    for (const p of objetivos) {
      if (p.protegido && !forzar) {
        ctx.error(`ERROR: no se puede terminar el proceso con PID ${p.pid}. Razón: Acceso denegado. Prueba con /F.`);
        continue;
      }
      procesos.splice(procesos.indexOf(p), 1);
      const nombre = String(p.comando).split(/\s/)[0];
      salida.push(`Correcto: se terminó el proceso "${nombre}" con PID ${p.pid}.`);
    }
    return aTexto(salida);
  }),

  comando('sc', 'Consulta y controla servicios', (ctx) => {
    const servicios = ctx.shell.servicios || {};
    const accion = String(operandosLimpios(ctx)[0] || '').toLowerCase();
    const nombre = operandosLimpios(ctx)[1];

    if (accion !== 'query' && accion !== 'start' && accion !== 'stop') {
      return { errores: [`En este simulador sc implementa query, start y stop. «${accion || 'sin acción'}» no está disponible.`], codigo: 1 };
    }
    if (accion === 'query' && !nombre) {
      const bloques = Object.entries(servicios).map(([n, s]) => [
        `NOMBRE_SERVICIO: ${n}`,
        '        TIPO                   : 10  WIN32_OWN_PROCESS',
        `        ESTADO                 : ${s.activo ? '4  RUNNING' : '1  STOPPED'}`,
        '',
      ].join('\n'));
      return bloques.join('\n');
    }
    const clave = String(nombre || '').replace(/\.service$/, '');
    const s = servicios[clave];
    if (!s) return { errores: ['[SC] EnumQueryServicesStatus:OpenService ERROR 1060:', '', 'El servicio especificado no existe como servicio instalado.'], codigo: 1060 };
    if (accion === 'start') { s.activo = true; s.fallado = false; }
    if (accion === 'stop') { s.activo = false; }
    return [
      `NOMBRE_SERVICIO: ${clave}`,
      '        TIPO                   : 10  WIN32_OWN_PROCESS',
      `        ESTADO                 : ${s.activo ? '4  RUNNING' : '1  STOPPED'}`,
      `        PID                    : ${s.pid || 0}`,
      '',
    ].join('\n');
  }),

  comando('net', 'Administra recursos de red y del equipo', (ctx) => {
    const sub = String(operandosLimpios(ctx)[0] || '').toLowerCase();
    const servicios = ctx.shell.servicios || {};
    if (sub === 'start') {
      const activos = Object.entries(servicios).filter(([, s]) => s.activo).map(([n]) => '   ' + n);
      return 'Estos servicios de Windows se han iniciado:\n\n' + aTexto(activos) +
             '\nSe ha completado el comando correctamente.\n';
    }
    if (sub === 'user') {
      return [
        `Cuentas de usuario de \\\\${ctx.shell.entorno.COMPUTERNAME || 'ACADEMIA'}`,
        '',
        '-------------------------------------------------------------------------------',
        `Administrador            Invitado                 ${ctx.shell.entorno.USERNAME || 'Alumno'}`,
        'Se ha completado el comando correctamente.',
        '',
      ].join('\n');
    }
    return { errores: [`En este simulador net implementa «net start» y «net user». «net ${sub}» no está disponible.`], codigo: 1 };
  }),

  comando('shutdown', 'Apaga o reinicia el equipo', (ctx) => {
    // Nunca se apaga nada: el simulador vive en una pestaña del navegador.
    return [
      'En el simulador de la academia shutdown no apaga ni reinicia nada.',
      'Sintaxis real que conviene conocer:',
      '    shutdown /s /t 60      apagar dentro de 60 segundos',
      '    shutdown /r /t 0       reiniciar ahora',
      '    shutdown /a            cancelar un apagado programado',
      '',
    ].join('\n');
  }),

  comando('driverquery', 'Muestra los controladores instalados', () => [
    'Nombre del módulo Nombre para mostrar        Tipo de controlador Fecha de vínculo',
    '================= ========================== =================== ======================',
    'disk              Disk Driver                Kernel              21/09/2026 08:00:00',
    'i8042prt          i8042 Keyboard and Mouse    Kernel              21/09/2026 08:00:00',
    'netbios           NetBIOS Interface          Sistema de archivos 21/09/2026 08:00:00',
    'tcpip             TCP/IP Protocol Driver     Kernel              21/09/2026 08:00:00',
    '',
  ].join('\n')),
];

// ----------------------------------------------------------------- redes
const redes = [
  comando('ipconfig', 'Muestra la configuración IP', (ctx) => {
    const todo = opcion(ctx, 'all');
    const cabecera = ['', 'Configuración IP de Windows', ''];
    if (todo) {
      cabecera.push(
        `   Nombre de host. . . . . . . . . : ${(ctx.shell.entorno.COMPUTERNAME || 'ACADEMIA').toLowerCase()}`,
        '   Sufijo DNS principal. . . . . . :',
        '   Tipo de nodo. . . . . . . . . . : híbrido',
        '   Enrutamiento IP habilitado. . . : no',
        '   Proxy WINS habilitado . . . . . : no',
        '');
    }
    const cuerpo = [
      'Adaptador de Ethernet Ethernet0:',
      '',
      '   Sufijo DNS específico para la conexión. . : lab',
    ];
    if (todo) {
      cuerpo.push(
        '   Descripción . . . . . . . . . . . . . . . : Adaptador de red virtual',
        '   Dirección física. . . . . . . . . . . . . : 00-15-5D-01-2A-3B',
        '   DHCP habilitado . . . . . . . . . . . . . : sí');
    }
    cuerpo.push(
      '   Dirección IPv4. . . . . . . . . . . . . . : 192.168.56.11(Preferido)',
      '   Máscara de subred . . . . . . . . . . . . : 255.255.255.0',
      '   Puerta de enlace predeterminada . . . . . : 192.168.56.1');
    if (todo) cuerpo.push('   Servidores DNS. . . . . . . . . . . . . . : 192.168.56.1');
    cuerpo.push('');
    return aTexto(cabecera.concat(cuerpo));
  }),

  comando('ping', 'Comprueba la conectividad con otro equipo', (ctx) => {
    const destino = operandosLimpios(ctx)[0];
    if (!destino) return { errores: ['Compruebe el uso del comando: ping destino'], codigo: 1 };
    const hosts = ctx.shell.red || {};
    const info = hosts[destino];
    if (!info) {
      return { errores: [`La solicitud de ping no pudo encontrar el host ${destino}. Compruebe el nombre e inténtelo de nuevo.`], codigo: 1 };
    }
    const lineas = ['', `Haciendo ping a ${destino} [${info.ip}] con 32 bytes de datos:`];
    if (info.responde) {
      // Windows envía 4 ecos por defecto, sin necesidad de -c como en Linux.
      for (let i = 0; i < 4; i++) lineas.push(`Respuesta desde ${info.ip}: bytes=32 tiempo<1m TTL=128`);
      lineas.push('', `Estadísticas de ping para ${info.ip}:`,
        '    Paquetes: enviados = 4, recibidos = 4, perdidos = 0',
        '    (0% perdidos),',
        'Tiempos aproximados de ida y vuelta en milisegundos:',
        '    Mínimo = 0ms, Máximo = 0ms, Media = 0ms', '');
      return aTexto(lineas);
    }
    for (let i = 0; i < 4; i++) lineas.push('Tiempo de espera agotado para esta solicitud.');
    lineas.push('', `Estadísticas de ping para ${info.ip}:`,
      '    Paquetes: enviados = 4, recibidos = 0, perdidos = 4',
      '    (100% perdidos),', '');
    return { salida: aTexto(lineas), codigo: 1 };
  }),

  comando('tracert', 'Traza la ruta hasta un destino', (ctx) => {
    const destino = operandosLimpios(ctx)[0];
    if (!destino) return { errores: ['Compruebe el uso del comando: tracert destino'], codigo: 1 };
    const info = (ctx.shell.red || {})[destino];
    if (!info) return { errores: [`No se puede resolver el nombre del sistema de destino ${destino}.`], codigo: 1 };
    return aTexto([
      '',
      `Traza a ${destino} [${info.ip}]`,
      'sobre un máximo de 30 saltos:',
      '',
      '  1     <1 ms    <1 ms    <1 ms  192.168.56.1',
      info.responde
        ? `  2     <1 ms    <1 ms    <1 ms  ${info.ip}`
        : '  2     *        *        *     Tiempo de espera agotado para esta solicitud.',
      '',
      info.responde ? 'Traza completa.' : 'Traza incompleta: el destino no responde.',
      '',
    ]);
  }),

  comando('nslookup', 'Consulta servidores DNS', (ctx) => {
    const nombre = operandosLimpios(ctx)[0];
    if (!nombre) return 'Servidor predeterminado:  router.lab\nAddress:  192.168.56.1\n\n';
    const info = (ctx.shell.red || {})[nombre];
    if (!info) {
      return { salida: 'Servidor:  router.lab\nAddress:  192.168.56.1\n\n',
               errores: [`*** router.lab no puede encontrar ${nombre}: Non-existent domain`], codigo: 1 };
    }
    return aTexto(['Servidor:  router.lab', 'Address:  192.168.56.1', '',
                   'Respuesta no autoritativa:', `Nombre:    ${nombre}`, `Address:  ${info.ip}`, '']);
  }),

  comando('netstat', 'Muestra conexiones y puertos en escucha', (ctx) => {
    const letras = letrasGuion(ctx);
    const numerico = letras.has('n');
    const puertos = ctx.shell.puertos || [];
    const filas = puertos.map(p => {
      const local = `${p.direccion === '0.0.0.0' ? '0.0.0.0' : p.direccion}:${p.puerto}`;
      const servicio = numerico ? local : `${p.direccion}:${p.proceso || p.puerto}`;
      return `  TCP    ${servicio.padEnd(22)} 0.0.0.0:0${' '.repeat(14)}LISTENING`;
    });
    return aTexto(['', 'Conexiones activas', '',
      '  Proto  Dirección local          Dirección remota        Estado'].concat(filas).concat(['']));
  }),

  comando('arp', 'Muestra la tabla ARP', (ctx) => {
    const letras = letrasGuion(ctx);
    if (!letras.has('a')) return { errores: ['En este simulador arp implementa solo «arp -a».'], codigo: 1 };
    return aTexto(['', 'Interfaz: 192.168.56.11 --- 0x5', '  Dirección de Internet    Dirección física      Tipo',
      '  192.168.56.1          00-15-5d-00-00-01     dinámico',
      '  192.168.56.20         00-15-5d-00-00-14     dinámico',
      '  192.168.56.255        ff-ff-ff-ff-ff-ff     estático', '']);
  }),

  comando('route', 'Muestra la tabla de rutas', (ctx) => {
    const sub = String(operandosLimpios(ctx)[0] || '').toLowerCase();
    if (sub !== 'print') return { errores: ['En este simulador route implementa solo «route print».'], codigo: 1 };
    return aTexto(['===========================================================================',
      'Lista de rutas activas:',
      'Destino de red    Máscara de red   Puerta de enlace   Interfaz  Métrica',
      '          0.0.0.0          0.0.0.0     192.168.56.1   192.168.56.11     25',
      '     192.168.56.0    255.255.255.0        En vínculo    192.168.56.11    281',
      '===========================================================================', '']);
  }),

  comando('getmac', 'Muestra las direcciones MAC', () => aTexto([
    'Dirección física    Nombre de transporte',
    '=================== ==========================================================',
    '00-15-5D-01-2A-3B   \\Device\\Tcpip_{8F2C4A11-0C2E-4C1B-9A11-2B6F0C3D4E5F}', ''])),
];

// -------------------------------------------------------- automatización
const automatizacion = [
  comando('set', 'Muestra, establece o quita variables de entorno', (ctx) => {
    const args = ctx.args.map(String);
    if (args.some(a => a.toLowerCase() === '/a')) {
      return { errores: ['En este simulador set no implementa la aritmética /A.'], codigo: 1 };
    }
    if (args.some(a => a.toLowerCase() === '/p')) {
      return { errores: ['En este simulador set no implementa la entrada interactiva /P.'], codigo: 1 };
    }
    const entorno = ctx.shell.entorno;

    if (!args.length) {
      // PWD la escribe el motor del simulador para uso interno; CMD real no
      // define esa variable, así que no aparece en el listado.
      const filas = Object.keys(entorno)
        .filter(k => !k.startsWith('__') && k !== 'PWD')
        .sort((a, b) => a.localeCompare(b, 'es'))
        .map(k => `${k}=${entorno[k]}`);
      return aTexto(filas);
    }

    const expr = args.join(' ');
    const igual = expr.indexOf('=');
    if (igual > 0) {
      const clave = expr.slice(0, igual).trim().toUpperCase();
      const valor = expr.slice(igual + 1);
      if (valor === '') delete entorno[clave];
      else entorno[clave] = valor;
      return '';
    }

    const prefijo = expr.trim().toUpperCase();
    const filas = Object.keys(entorno)
      .filter(k => !k.startsWith('__') && k !== 'PWD' && k.toUpperCase().startsWith(prefijo))
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map(k => `${k}=${entorno[k]}`);
    if (!filas.length) {
      return { errores: ['El entorno no tiene definido ese nombre de variable.'], codigo: 1 };
    }
    return aTexto(filas);
  }),

  comando('setlocal', 'Inicia la localización de cambios del entorno', (ctx) => {
    // Guarda una copia para que endlocal pueda restaurarla.
    ctx.shell._pilaEntorno = ctx.shell._pilaEntorno || [];
    ctx.shell._pilaEntorno.push(Object.assign({}, ctx.shell.entorno));
    return '';
  }),

  comando('endlocal', 'Termina la localización de cambios del entorno', (ctx) => {
    const pila = ctx.shell._pilaEntorno || [];
    if (!pila.length) return '';
    ctx.shell.entorno = pila.pop();
    return '';
  }),

  comando('if', 'Ejecuta un comando de forma condicional', (ctx) => {
    let args = ctx.args.map(String);
    if (!args.length) return { errores: ['La sintaxis del comando no es correcta.'], codigo: 1 };

    let negar = false;
    if (args[0].toLowerCase() === 'not') { negar = true; args = args.slice(1); }
    if (args[0] && args[0].toLowerCase() === '/i') args = args.slice(1);

    let condicion = null;
    let resto = [];

    if (args[0] && args[0].toLowerCase() === 'exist') {
      condicion = ctx.vfs.existe(args[1]);
      resto = args.slice(2);
    } else if (args[0] && args[0].toLowerCase() === 'errorlevel') {
      condicion = (ctx.shell.ultimoCodigo || 0) >= parseInt(args[1], 10);
      resto = args.slice(2);
    } else if (args[0] && args[0].includes('==')) {
      const [izq, der] = args[0].split('==');
      condicion = izq === der;
      resto = args.slice(1);
    } else {
      return { errores: ['En este simulador if implementa: if exist, if not exist, if errorlevel N y comparación con ==.'], codigo: 1 };
    }

    if (negar) condicion = !condicion;
    if (!condicion || !resto.length) return '';
    const r = ejecutarAnidado(ctx, resto.join(' '));
    return { salida: r.salida, errores: r.errores, codigo: r.codigo };
  }),

  comando('for', 'Ejecuta un comando para cada elemento de un conjunto', (ctx) => {
    const args = ctx.args.map(String);
    const bajo = args.map(a => a.toLowerCase());

    const iIn = bajo.indexOf('in');
    const iDo = bajo.indexOf('do');
    const modificadores = bajo.filter(a => /^\/[a-z]$/.test(a));
    const soportados = ['/l'];
    const noSoportado = modificadores.find(m => !soportados.includes(m));
    if (noSoportado) {
      return { errores: [`En este simulador for implementa «for %%v in (...) do ...» y «for /L». ${noSoportado.toUpperCase()} no está implementado.`], codigo: 1 };
    }
    if (iIn < 0 || iDo < 0 || iDo < iIn) {
      return { errores: ['La sintaxis del comando no es correcta. Usa: for %%f in (*.txt) do comando %%f'], codigo: 1 };
    }

    const variable = args.slice(0, iIn).find(a => a.startsWith('%'));
    if (!variable) return { errores: ['Falta la variable del bucle (por ejemplo %%f).'], codigo: 1 };

    const conjuntoTexto = args.slice(iIn + 1, iDo).join(' ').replace(/^\(/, '').replace(/\)$/, '').trim();
    const plantilla = args.slice(iDo + 1).join(' ');
    if (!plantilla) return { errores: ['Falta el comando que ejecutar tras «do».'], codigo: 1 };

    let valores = [];
    if (modificadores.includes('/l')) {
      const [inicio, paso, fin] = conjuntoTexto.split(',').map(n => parseInt(n.trim(), 10));
      if ([inicio, paso, fin].some(Number.isNaN) || paso === 0) {
        return { errores: ['for /L espera (inicio,paso,fin) con números.'], codigo: 1 };
      }
      // Tope de seguridad: un bucle enorme colgaría la pestaña del navegador.
      for (let v = inicio; paso > 0 ? v <= fin : v >= fin; v += paso) {
        valores.push(String(v));
        if (valores.length > 500) break;
      }
    } else {
      for (const pieza of conjuntoTexto.split(/[\s,]+/).filter(Boolean)) {
        valores.push(...coincidencias(ctx, pieza));
      }
    }

    const salida = [];
    const errores = [];
    let codigo = 0;
    for (const valor of valores) {
      const linea = plantilla.split(variable).join(valor);
      const r = ejecutarAnidado(ctx, linea);
      if (r.salida) salida.push(r.salida.replace(/\n$/, ''));
      errores.push(...r.errores);
      codigo = r.codigo;
    }
    return { salida: aTexto(salida), errores, codigo };
  }),

  comando('call', 'Llama a otro comando o archivo por lotes', (ctx) => {
    const linea = ctx.args.map(String).join(' ');
    if (!linea) return '';
    if (linea.startsWith(':')) {
      return { errores: ['En este simulador call no implementa etiquetas (call :etiqueta): no hay archivos por lotes reales.'], codigo: 1 };
    }
    const r = ejecutarAnidado(ctx, linea);
    return { salida: r.salida, errores: r.errores, codigo: r.codigo };
  }),

  comando('goto', 'Salta a una etiqueta de un archivo por lotes', () => ({
    errores: ['goto solo tiene sentido dentro de un archivo .bat. El simulador ejecuta línea a línea, así que no implementa saltos.'],
    codigo: 1,
  })),

  comando('start', 'Inicia un programa o abre una ventana', () => ({
    salida: 'El simulador no abre programas reales: start queda registrado pero no lanza nada.\n',
    codigo: 0,
  })),
];

export const COMANDOS_CMD = [
  ...fundamentos,
  ...archivos,
  ...busqueda,
  ...sistema,
  ...redes,
  ...automatizacion,
];

export const registroCmd = () => construirRegistro(COMANDOS_CMD);
