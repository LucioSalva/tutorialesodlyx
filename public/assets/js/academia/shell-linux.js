/**
 * Academia de Comandos · Comandos de Linux (subconjunto de Bash + GNU)
 * ---------------------------------------------------------------------
 * Cada comando implementado se comporta como el real en lo que el curso
 * enseña. Lo que no está implementado NO se finge: el motor responde que
 * ese comando todavía no existe en el simulador.
 */
import { comando, construirRegistro, Flujo } from './shell.js';
import { TIPO, modoTexto, ordenar, ErrorVFS } from './vfs.js';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function columnas(nombres, ancho = 80) {
  if (!nombres.length) return '';
  const max = Math.max(...nombres.map(n => n.length)) + 2;
  const porFila = Math.max(1, Math.floor(ancho / max));
  const filas = [];
  for (let i = 0; i < nombres.length; i += porFila) {
    filas.push(nombres.slice(i, i + porFila).map(n => n.padEnd(max)).join('').trimEnd());
  }
  return filas.join('\n') + '\n';
}

/**
 * ls decide su formato según a dónde escribe: en una terminal agrupa en
 * columnas, pero al final de una tubería o de una redirección imprime una
 * entrada por línea. Sin esto, `ls | wc -l` contaría 1 en vez de N, que es
 * justo lo que un estudiante escribe para contar archivos.
 */
function listaSimple(nombres, aTerminal) {
  if (!nombres.length) return '';
  return aTerminal ? columnas(nombres) : nombres.join('\n') + '\n';
}

function humano(bytes) {
  if (bytes < 1024) return String(bytes);
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1).replace('.0', '') + 'K';
  return (bytes / 1048576).toFixed(1).replace('.0', '') + 'M';
}

function fechaCorta(nodo) {
  const [f, h] = (nodo.mtime || '2026-09-22 10:00').split(' ');
  const [, mes, dia] = f.split('-');
  return `${MESES[parseInt(mes, 10) - 1]} ${String(parseInt(dia, 10)).padStart(2, ' ')} ${h}`;
}

function listadoLargo(nodos, vfs, { humanos = false } = {}) {
  const total = nodos.reduce((s, n) => s + Math.ceil(n.tamano / 1024) * 4, 0);
  const filas = nodos.map(n => {
    const tam = humanos ? humano(n.tamano) : String(n.tamano);
    return [
      modoTexto(n),
      String(n.esDir ? 2 + n.hijos.size : 1),
      n.propietario,
      n.grupo,
      tam.padStart(humanos ? 5 : 6),
      fechaCorta(n),
      n.nombre + (n.tipo === TIPO.ENLACE ? ' -> ' + n.destino : ''),
    ].join(' ');
  });
  return `total ${total}\n` + filas.join('\n') + (filas.length ? '\n' : '');
}

/** Copia superficial de un nodo con otro nombre: para las entradas . y .. */
function puntoNodo(ctx, ruta, nombre) {
  const base = ctx.vfs.nodo(ruta === undefined ? ctx.vfs.cwd : ruta);
  const destino = nombre === '.' ? base : (ctx.vfs.nodo(ctx.vfs.segmentos((ruta === undefined ? '.' : ruta) + '/..')) || base);
  const copia = Object.assign(Object.create(Object.getPrototypeOf(destino)), destino);
  copia.nombre = nombre;
  return copia;
}

function entradasDe(ctx, ruta, mostrarOcultos) {
  const nodo = ctx.vfs.nodo(ruta === undefined ? ctx.vfs.cwd : ruta);
  if (!nodo) throw new ErrorVFS('noexiste', ruta);
  let lista = nodo.esDir ? [...nodo.hijos.values()] : [nodo];
  if (!mostrarOcultos) lista = lista.filter(n => !n.nombre.startsWith('.'));
  return lista.sort(ordenar);
}

// ------------------------------------------------------------------ básicos
const basicos = [
  comando('pwd', 'Imprime el directorio de trabajo actual', (ctx) => ctx.vfs.cwdTexto() + '\n'),

  comando('cd', 'Cambia de directorio', (ctx) => {
    const destino = ctx.operandos[0] || '~';
    if (destino === '-') return '';
    const segs = ctx.vfs.segmentos(destino);
    const nodo = ctx.vfs.nodo(segs);
    if (!nodo) { ctx.error(`cd: ${destino}: No existe el archivo o el directorio`); return { codigo: 1 }; }
    if (!nodo.esDir) { ctx.error(`cd: ${destino}: No es un directorio`); return { codigo: 1 }; }
    ctx.vfs.cwd = segs;
    return '';
  }),

  comando('ls', 'Lista el contenido de un directorio', (ctx) => {
    // -a incluye . y ..; -A incluye los ocultos pero NO esas dos entradas.
    const casiTodos = ctx.flags.cortas.has('A') || ctx.flags.largas.has('almost-all');
    const ocultos = ctx.flags.cortas.has('a') || ctx.flags.largas.has('all') || casiTodos;
    const conPuntosDobles = ocultos && !casiTodos;
    const largo = ctx.flags.cortas.has('l');
    const humanos = ctx.flags.cortas.has('h');
    const recursivo = ctx.flags.cortas.has('R');

    // Igual que ls real: los ficheros sueltos se listan juntos y sin
    // cabecera; solo los directorios llevan «ruta:» cuando hay varios.
    const ficheros = [];
    const directorios = [];
    for (const ruta of ctx.operandos) {
      const nodo = ctx.vfs.nodo(ruta);
      if (!nodo) { ctx.error(`ls: no se puede acceder a '${ruta}': No existe el archivo o el directorio`); continue; }
      (nodo.esDir ? directorios : ficheros).push({ ruta, nodo });
    }
    if (!ctx.operandos.length) directorios.push({ ruta: undefined, nodo: ctx.vfs.nodo(ctx.vfs.cwd) });

    const partes = [];
    if (ficheros.length) {
      const lista = ficheros.map(f => f.nodo).sort(ordenar);
      partes.push(largo
        ? listadoLargo(lista, ctx.vfs, { humanos })
        : listaSimple(ficheros.map(f => f.ruta), ctx.aTerminal));
    }

    const conCabecera = directorios.length + ficheros.length > 1;
    const pintarDir = (ruta, nivel) => {
      const lista = entradasDe(ctx, ruta, ocultos);
      const conPuntos = conPuntosDobles
        ? [puntoNodo(ctx, ruta, '.'), puntoNodo(ctx, ruta, '..')].concat(lista)
        : lista;
      if (conCabecera || nivel > 0) partes.push(`${ruta === undefined ? '.' : ruta}:`);
      partes.push(largo
        ? listadoLargo(conPuntos, ctx.vfs, { humanos })
        : listaSimple(conPuntos.map(n => n.nombre), ctx.aTerminal));
      if (recursivo) {
        for (const hijo of lista.filter(n => n.esDir)) {
          pintarDir((ruta === undefined ? '.' : ruta) + '/' + hijo.nombre, nivel + 1);
        }
      }
    };
    for (const d of directorios) pintarDir(d.ruta, 0);

    return partes.join('\n').replace(/\n{3,}/g, '\n\n');
  }),

  comando('clear', 'Limpia la pantalla', (ctx) => ({ salida: '', limpiar: true })),

  comando('echo', 'Muestra un texto', (ctx) => {
    const sinSalto = ctx.flags.cortas.has('n');
    const texto = ctx.operandos.join(' ');
    return texto + (sinSalto ? '' : '\n');
  }),

  comando('whoami', 'Muestra el usuario actual', (ctx) => ctx.shell.usuario + '\n'),
  comando('hostname', 'Muestra el nombre del equipo', (ctx) => ctx.shell.host + '\n'),
  comando('id', 'Muestra identificadores de usuario y grupos', (ctx) => {
    // root es siempre uid 0: es la primera cosa que se mira al auditar.
    const esRoot = ctx.shell.usuario === 'root';
    const uid = esRoot ? 0 : 1000;
    const u = ctx.shell.usuario;
    return esRoot
      ? `uid=0(root) gid=0(root) grupos=0(root)\n`
      : `uid=${uid}(${u}) gid=${uid}(${u}) grupos=${uid}(${u}),27(sudo)\n`;
  }),
  comando('groups', 'Muestra los grupos del usuario', (ctx) => `${ctx.shell.usuario} sudo\n`),
  comando('date', 'Fecha y hora del sistema', () => 'lun 22 sep 2026 10:00:00 CST\n'),
  comando('uname', 'Información del núcleo', (ctx) =>
    ctx.flags.cortas.has('a')
      ? 'Linux academia 6.12.4-arch1-1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux\n'
      : 'Linux\n'),
  comando('uptime', 'Tiempo encendido y carga', () => ' 10:00:00 hasta 3:16, 1 usuario, carga promedio: 0,08, 0,03, 0,01\n'),

  comando('history', 'Historial de comandos', (ctx) =>
    ctx.shell.historial.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`).join('\n') + '\n'),

  comando('type', 'Indica qué es un comando', (ctx) => {
    const n = ctx.operandos[0];
    if (!n) return '';
    if (['cd', 'echo', 'pwd', 'history', 'type', 'help'].includes(n)) return `${n} es una orden interna del shell\n`;
    if (ctx.shell.registro.has(n)) return `${n} es /usr/bin/${n}\n`;
    return { errores: [`bash: type: ${n}: no se encontró`], codigo: 1 };
  }),

  comando('which', 'Ruta de un ejecutable', (ctx) => {
    const n = ctx.operandos[0];
    if (!n) return '';
    if (ctx.shell.registro.has(n)) return `/usr/bin/${n}\n`;
    return { codigo: 1 };
  }),

  comando('help', 'Ayuda del simulador', (ctx) => {
    const nombres = [...new Set([...ctx.shell.registro.keys()])].sort();
    return 'Comandos implementados en este simulador:\n\n' + columnas(nombres, 70) +
      '\nEscribe «man COMANDO» para ver su ficha, o «ayuda» para las teclas de la terminal.\n';
  }),

  comando('man', 'Manual de un comando', (ctx) => {
    const n = ctx.operandos[0];
    if (!n) return { errores: ['¿Qué página de manual quieres?'], codigo: 1 };
    const c = ctx.shell.registro.get(n);
    if (!c) return { errores: [`No hay entrada de manual para ${n}`], codigo: 16 };
    const ficha = (ctx.shell.fichas && ctx.shell.fichas[n]) || null;
    let salida = `${n.toUpperCase()}(1)\n\nNOMBRE\n       ${n} — ${c.resumen}\n`;
    if (ficha) {
      salida += `\nDESCRIPCIÓN\n       ${ficha.explicacion_tecnica || ficha.explicacion_sencilla || ''}\n`;
      if (ficha.sintaxis) salida += `\nSINTAXIS\n       ${ficha.sintaxis}\n`;
      if (ficha.opciones && ficha.opciones.length) {
        salida += '\nOPCIONES\n' + ficha.opciones.map(o => `       ${o.opcion}\n              ${o.significa}`).join('\n') + '\n';
      }
    }
    salida += `\nNOTA\n       Página resumida del simulador de la Academia de Comandos.\n`;
    return salida;
  }),
];

// -------------------------------------------------------- archivos y rutas
const archivos = [
  comando('mkdir', 'Crea directorios', (ctx) => {
    const padres = ctx.flags.cortas.has('p') || ctx.flags.largas.has('parents');
    if (!ctx.operandos.length) return { errores: ['mkdir: falta un operando'], codigo: 1 };
    for (const ruta of ctx.operandos) {
      try { ctx.vfs.mkdir(ruta, { padres }); }
      catch (e) {
        if (e.clave === 'existe') ctx.error(`mkdir: no se puede crear el directorio «${ruta}»: El archivo ya existe`);
        else ctx.error(`mkdir: no se puede crear el directorio «${ruta}»: No existe el archivo o el directorio`);
      }
    }
    return '';
  }),

  comando('touch', 'Crea un archivo vacío o actualiza su fecha', (ctx) => {
    if (!ctx.operandos.length) return { errores: ['touch: falta un operando'], codigo: 1 };
    for (const ruta of ctx.operandos) {
      const nodo = ctx.vfs.nodo(ruta);
      if (nodo) { nodo.mtime = '2026-09-22 10:00'; continue; }
      try { ctx.vfs.escribir(ruta, ''); }
      catch { ctx.error(`touch: no se puede efectuar «touch» sobre '${ruta}': No existe el archivo o el directorio`); }
    }
    return '';
  }),

  comando('cp', 'Copia archivos y directorios', (ctx) => {
    const recursivo = ctx.flags.cortas.has('r') || ctx.flags.cortas.has('R') || ctx.flags.largas.has('recursive');
    if (ctx.operandos.length < 2) return { errores: ['cp: falta un operando de destino'], codigo: 1 };
    const destino = ctx.operandos[ctx.operandos.length - 1];
    const origenes = ctx.operandos.slice(0, -1);
    const nodoDestino = ctx.vfs.nodo(destino);
    if (origenes.length > 1 && (!nodoDestino || !nodoDestino.esDir)) {
      return { errores: [`cp: el destino '${destino}' no es un directorio`], codigo: 1 };
    }
    for (const origen of origenes) {
      try { ctx.vfs.copiar(origen, destino, { recursivo }); }
      catch (e) {
        if (e.clave === 'esdir') ctx.error(`cp: se omite el directorio '${origen}' (usa -r para copiarlo)`);
        else ctx.error(`cp: no se puede efectuar stat sobre '${origen}': No existe el archivo o el directorio`);
      }
    }
    return '';
  }),

  comando('mv', 'Mueve o renombra', (ctx) => {
    if (ctx.operandos.length < 2) return { errores: ['mv: falta un operando de destino'], codigo: 1 };
    const destino = ctx.operandos[ctx.operandos.length - 1];
    for (const origen of ctx.operandos.slice(0, -1)) {
      try { ctx.vfs.mover(origen, destino); }
      catch (e) {
        if (e.clave === 'protegido') ctx.error(`mv: no se puede mover '${origen}': lo protege el escenario`);
        else ctx.error(`mv: no se puede efectuar stat sobre '${origen}': No existe el archivo o el directorio`);
      }
    }
    return '';
  }),

  comando('rm', 'Borra archivos y directorios', (ctx) => {
    const recursivo = ctx.flags.cortas.has('r') || ctx.flags.cortas.has('R') || ctx.flags.largas.has('recursive');
    const forzar = ctx.flags.cortas.has('f') || ctx.flags.largas.has('force');
    if (!ctx.operandos.length) return forzar ? '' : { errores: ['rm: falta un operando'], codigo: 1 };
    for (const ruta of ctx.operandos) {
      const segs = ctx.vfs.segmentos(ruta);
      if (segs.length === 0 || (segs.length <= 2 && segs[0] === 'home')) {
        ctx.error(`rm: el escenario protege '${ruta}': aquí no se practica borrando el home entero`);
        continue;
      }
      try { ctx.vfs.borrar(ruta, { recursivo }); }
      catch (e) {
        if (forzar && e.clave === 'noexiste') continue;
        if (e.clave === 'esdir') ctx.error(`rm: no se puede borrar '${ruta}': Es un directorio`);
        else if (e.clave === 'protegido') ctx.error(`rm: no se puede borrar '${ruta}': lo protege el escenario`);
        else ctx.error(`rm: no se puede borrar '${ruta}': No existe el archivo o el directorio`);
      }
    }
    return '';
  }),

  comando('rmdir', 'Borra directorios vacíos', (ctx) => {
    for (const ruta of ctx.operandos) {
      const nodo = ctx.vfs.nodo(ruta);
      if (!nodo) { ctx.error(`rmdir: fallo al borrar '${ruta}': No existe el archivo o el directorio`); continue; }
      if (!nodo.esDir) { ctx.error(`rmdir: fallo al borrar '${ruta}': No es un directorio`); continue; }
      if (nodo.hijos.size) { ctx.error(`rmdir: fallo al borrar '${ruta}': El directorio no está vacío`); continue; }
      ctx.vfs.borrar(ruta, { recursivo: true });
    }
    return '';
  }),

  comando('tree', 'Muestra el árbol de directorios', (ctx) => {
    const raizRuta = ctx.operandos[0] || '.';
    const raiz = ctx.vfs.nodo(raizRuta);
    if (!raiz) return { errores: [`${raizRuta}  [error al abrir el directorio]`], codigo: 1 };
    const ocultos = ctx.flags.cortas.has('a');
    let dirs = 0, ficheros = 0;
    const lineas = [raizRuta];
    const recorrer = (nodo, prefijo) => {
      const hijos = [...nodo.hijos.values()].filter(h => ocultos || !h.nombre.startsWith('.')).sort(ordenar);
      hijos.forEach((h, i) => {
        const ultimo = i === hijos.length - 1;
        lineas.push(prefijo + (ultimo ? '└── ' : '├── ') + h.nombre);
        if (h.esDir) { dirs++; recorrer(h, prefijo + (ultimo ? '    ' : '│   ')); }
        else ficheros++;
      });
    };
    recorrer(raiz, '');
    lineas.push('');
    lineas.push(`${dirs} directorios, ${ficheros} archivos`);
    return lineas.join('\n') + '\n';
  }),

  comando('find', 'Busca archivos por nombre o tipo', (ctx) => {
    const base = ctx.operandos[0] || '.';
    const iName = ctx.args.indexOf('-name') >= 0 ? ctx.args[ctx.args.indexOf('-name') + 1] : null;
    const iType = ctx.args.indexOf('-type') >= 0 ? ctx.args[ctx.args.indexOf('-type') + 1] : null;
    const iDepth = ctx.args.indexOf('-maxdepth') >= 0 ? parseInt(ctx.args[ctx.args.indexOf('-maxdepth') + 1], 10) : null;
    const segsBase = ctx.vfs.segmentos(base);
    if (!ctx.vfs.nodo(segsBase)) return { errores: [`find: '${base}': No existe el archivo o el directorio`], codigo: 1 };

    const patron = iName ? new RegExp('^' + iName.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$') : null;
    const salida = [];
    for (const { nodo, segs } of ctx.vfs.recorrer(segsBase)) {
      // -maxdepth 1 = el directorio de partida y sus hijos directos.
      if (iDepth !== null && !Number.isNaN(iDepth) && (segs.length - segsBase.length) > iDepth) continue;
      if (patron && !patron.test(nodo.nombre || '')) continue;
      if (iType === 'f' && nodo.esDir) continue;
      if (iType === 'd' && !nodo.esDir) continue;
      const rel = base === '.' ? './' + segs.slice(ctx.vfs.cwd.length).join('/') : ctx.vfs.texto(segs);
      salida.push(rel.replace(/\/$/, '') || base);
    }
    return salida.sort().join('\n') + (salida.length ? '\n' : '');
  }),

  comando('stat', 'Metadatos de un archivo', (ctx) => {
    const ruta = ctx.operandos[0];
    const nodo = ctx.vfs.nodo(ruta);
    if (!nodo) return { errores: [`stat: no se puede hacer stat de '${ruta}': No existe el archivo o el directorio`], codigo: 1 };
    const octal = (nodo.modo & 0o777).toString(8).padStart(3, '0');
    return `  Fichero: ${ruta}\n  Tamaño: ${nodo.tamano}\tTipo: ${nodo.esDir ? 'directorio' : 'fichero regular'}\n` +
           `Acceso: (${octal}/${modoTexto(nodo)})  Uid: ( 1000/${nodo.propietario})   Gid: ( 1000/${nodo.grupo})\n` +
           `Modificación: ${nodo.mtime}\n`;
  }),

  comando('file', 'Adivina el tipo de un archivo', (ctx) => {
    const salida = [];
    for (const ruta of ctx.operandos) {
      const nodo = ctx.vfs.nodo(ruta);
      if (!nodo) { ctx.error(`${ruta}: no se puede abrir (No existe el archivo o el directorio)`); continue; }
      if (nodo.esDir) salida.push(`${ruta}: directory`);
      else if (/^#!/.test(nodo.contenido)) salida.push(`${ruta}: a shell script, ASCII text executable`);
      else if (nodo.contenido === '') salida.push(`${ruta}: empty`);
      else salida.push(`${ruta}: ASCII text`);
    }
    return salida.join('\n') + (salida.length ? '\n' : '');
  }),

  comando('ln', 'Crea enlaces', (ctx) => {
    if (!ctx.flags.cortas.has('s')) return { errores: ['ln: este simulador solo implementa enlaces simbólicos (-s)'], codigo: 1 };
    const [destino, nombre] = ctx.operandos;
    if (!destino || !nombre) return { errores: ['ln: falta un operando'], codigo: 1 };
    const segs = ctx.vfs.segmentos(nombre);
    const { padre, nombre: base } = ctx.vfs.padreDe(segs);
    if (!padre) return { errores: [`ln: no se puede crear el enlace '${nombre}'`], codigo: 1 };
    const { VNode } = ctx.vfs.raiz.constructor === Object ? {} : {};
    const nodo = Object.create(Object.getPrototypeOf(ctx.vfs.raiz));
    Object.assign(nodo, ctx.vfs.raiz, { nombre: base, tipo: TIPO.ENLACE, destino, hijos: new Map(), contenido: '', modo: 0o777 });
    padre.hijos.set(base, nodo);
    return '';
  }),
];


// --------------------------------------------------- lectura y proceso de texto
function textoEntrada(ctx, rutas) {
  if (rutas && rutas.length) {
    const partes = [];
    for (const r of rutas) {
      try { partes.push(ctx.vfs.leer(r)); }
      catch (e) {
        if (e.clave === 'esdir') ctx.error(`${ctx.nombre}: ${r}: Es un directorio`);
        else ctx.error(`${ctx.nombre}: ${r}: No existe el archivo o el directorio`);
      }
    }
    return partes.join('');
  }
  return ctx.entrada.texto;
}

function lineasDe(texto) {
  if (texto === '') return [];
  return texto.replace(/\n$/, '').split('\n');
}

function aTexto(lineas) {
  return lineas.length ? lineas.join('\n') + '\n' : '';
}

/** head -3 y tail -5: abreviatura histórica que GNU sigue aceptando. */
function numeroSuelto(ctx) {
  for (const o of ctx.opciones) {
    const m = /^-(\d+)$/.exec(o);
    if (m) return m[1];
  }
  return null;
}

function valorOpcion(ctx, corta, larga) {
  // Acepta las tres formas reales: «-d ,», «-d,» y «--delimiter=,»
  for (let i = 0; i < ctx.args.length; i++) {
    const a = ctx.args[i];
    if (a === corta || a === larga) return ctx.args[i + 1] !== undefined ? ctx.args[i + 1] : null;
    if (larga && a.startsWith(larga + '=')) return a.slice(larga.length + 1);
    if (corta && a.startsWith(corta) && a.length > corta.length) return a.slice(corta.length);
  }
  return null;
}

/** Rutas de un comando de texto: los operandos que no son valor de opción. */
function rutasDe(ctx, valores) {
  const usados = new Set(valores.filter(v => v !== null && v !== undefined).map(String));
  return ctx.operandos.filter(o => !usados.has(o));
}

const texto = [
  comando('cat', 'Muestra el contenido de archivos', (ctx) => {
    const numerar = ctx.flags.cortas.has('n');
    const contenido = textoEntrada(ctx, ctx.operandos);
    if (!numerar) return contenido;
    return aTexto(lineasDe(contenido).map((l, i) => `${String(i + 1).padStart(6)}\t${l}`));
  }),

  comando('less', 'Pagina un archivo (aquí se muestra entero)', (ctx) => {
    const contenido = textoEntrada(ctx, ctx.operandos);
    return contenido + (contenido ? '' : '') ;
  }, { alias: ['more'] }),

  comando('head', 'Primeras líneas', (ctx) => {
    const crudo = valorOpcion(ctx, '-n', '--lines') || numeroSuelto(ctx);
    const n = parseInt(crudo || '10', 10);
    const lineas = lineasDe(textoEntrada(ctx, rutasDe(ctx, [crudo])));
    return aTexto(lineas.slice(0, n));
  }),

  comando('tail', 'Últimas líneas', (ctx) => {
    const crudo = valorOpcion(ctx, '-n', '--lines') || numeroSuelto(ctx);
    const n = parseInt(crudo || '10', 10);
    const lineas = lineasDe(textoEntrada(ctx, rutasDe(ctx, [crudo])));
    return aTexto(lineas.slice(-n));
  }),

  comando('wc', 'Cuenta líneas, palabras y bytes', (ctx) => {
    const soloLineas = ctx.flags.cortas.has('l');
    const soloPalabras = ctx.flags.cortas.has('w');
    const soloBytes = ctx.flags.cortas.has('c');
    const rutas = ctx.operandos;
    const medir = (t) => ({
      l: t === '' ? 0 : t.replace(/\n$/, '').split('\n').length,
      w: t.trim() === '' ? 0 : t.trim().split(/\s+/).length,
      c: t.length,
    });
    const filas = [];
    if (rutas.length) {
      for (const r of rutas) {
        let t; try { t = ctx.vfs.leer(r); } catch { ctx.error(`wc: ${r}: No existe el archivo o el directorio`); continue; }
        const m = medir(t);
        filas.push(soloLineas ? `${m.l} ${r}` : soloPalabras ? `${m.w} ${r}` : soloBytes ? `${m.c} ${r}`
          : `${String(m.l).padStart(4)} ${String(m.w).padStart(5)} ${String(m.c).padStart(6)} ${r}`);
      }
    } else {
      const m = medir(ctx.entrada.texto);
      filas.push(soloLineas ? `${m.l}` : soloPalabras ? `${m.w}` : soloBytes ? `${m.c}`
        : `${String(m.l).padStart(4)} ${String(m.w).padStart(5)} ${String(m.c).padStart(6)}`);
    }
    return aTexto(filas);
  }),

  comando('grep', 'Filtra líneas que coinciden con un patrón', (ctx) => {
    const ignorar = ctx.flags.cortas.has('i');
    const invertir = ctx.flags.cortas.has('v');
    const contar = ctx.flags.cortas.has('c');
    const numerar = ctx.flags.cortas.has('n');
    const recursivo = ctx.flags.cortas.has('r') || ctx.flags.cortas.has('R');
    const patron = ctx.operandos[0];
    if (patron === undefined) return { errores: ['Uso: grep [OPCIÓN]... PATRÓN [ARCHIVO]...'], codigo: 2 };

    let regex;
    try { regex = new RegExp(patron, ignorar ? 'i' : ''); }
    catch { return { errores: [`grep: ${patron}: expresión regular no válida`], codigo: 2 }; }

    const rutas = ctx.operandos.slice(1);
    const bloques = [];

    if (recursivo && rutas.length) {
      for (const base of rutas) {
        for (const { nodo, segs } of ctx.vfs.recorrer(ctx.vfs.segmentos(base))) {
          if (nodo.esDir) continue;
          lineasDe(nodo.contenido).forEach((l) => {
            if (regex.test(l) !== invertir) bloques.push(`${ctx.vfs.texto(segs)}:${l}`);
          });
        }
      }
      return aTexto(bloques);
    }

    const varios = rutas.length > 1;
    const fuentes = rutas.length
      ? rutas.map(r => { try { return { r, t: ctx.vfs.leer(r) }; } catch { ctx.error(`grep: ${r}: No existe el archivo o el directorio`); return null; } }).filter(Boolean)
      : [{ r: null, t: ctx.entrada.texto }];

    let total = 0;
    for (const { r, t } of fuentes) {
      const coincidentes = [];
      lineasDe(t).forEach((l, i) => {
        if (regex.test(l) !== invertir) coincidentes.push((numerar ? `${i + 1}:` : '') + l);
      });
      total += coincidentes.length;
      if (contar) bloques.push((varios ? `${r}:` : '') + coincidentes.length);
      else bloques.push(...coincidentes.map(l => (varios ? `${r}:` : '') + l));
    }
    return { salida: aTexto(bloques), codigo: total ? 0 : 1 };
  }),

  comando('cut', 'Extrae columnas', (ctx) => {
    const delimCrudo = valorOpcion(ctx, '-d', '--delimiter');
    const camposCrudo = valorOpcion(ctx, '-f', '--fields');
    const delim = delimCrudo || '\t';
    const campos = (camposCrudo || '1').split(',').map(n => parseInt(n, 10));
    const lineas = lineasDe(textoEntrada(ctx, rutasDe(ctx, [delimCrudo, camposCrudo])));
    return aTexto(lineas.map(l => campos.map(c => l.split(delim)[c - 1] ?? '').join(delim)));
  }),

  comando('sort', 'Ordena líneas', (ctx) => {
    const invertir = ctx.flags.cortas.has('r');
    const numerico = ctx.flags.cortas.has('n');
    const unico = ctx.flags.cortas.has('u');
    let lineas = lineasDe(textoEntrada(ctx, ctx.operandos));
    lineas = lineas.sort((a, b) => numerico ? (parseFloat(a) || 0) - (parseFloat(b) || 0) : a.localeCompare(b, 'es'));
    if (invertir) lineas.reverse();
    if (unico) lineas = [...new Set(lineas)];
    return aTexto(lineas);
  }),

  comando('uniq', 'Colapsa líneas repetidas consecutivas', (ctx) => {
    const contar = ctx.flags.cortas.has('c');
    const lineas = lineasDe(textoEntrada(ctx, ctx.operandos));
    const salida = [];
    for (const l of lineas) {
      const ultimo = salida[salida.length - 1];
      if (ultimo && ultimo.t === l) ultimo.n++;
      else salida.push({ t: l, n: 1 });
    }
    return aTexto(salida.map(x => contar ? `${String(x.n).padStart(7)} ${x.t}` : x.t));
  }),

  comando('tr', 'Sustituye o borra caracteres', (ctx) => {
    const borrar = ctx.flags.cortas.has('d');
    const [a, b] = ctx.operandos;
    let t = ctx.entrada.texto;
    if (borrar && a) { t = t.split('').filter(c => !a.includes(c)).join(''); return t; }
    if (a && b) {
      const expandir = (s) => s === 'a-z' ? 'abcdefghijklmnopqrstuvwxyz' : s === 'A-Z' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : s;
      const ea = expandir(a), eb = expandir(b);
      t = t.split('').map(c => { const i = ea.indexOf(c); return i >= 0 ? (eb[i] || eb[eb.length - 1]) : c; }).join('');
    }
    return t;
  }),

  comando('tee', 'Escribe en un archivo y deja pasar el texto', (ctx) => {
    const anexar = ctx.flags.cortas.has('a');
    const t = ctx.entrada.texto;
    for (const ruta of ctx.operandos) {
      try { ctx.vfs.escribir(ruta, t, { anexar }); }
      catch { ctx.error(`tee: ${ruta}: No se puede crear el archivo`); }
    }
    return t;
  }),

  comando('diff', 'Compara dos archivos línea a línea', (ctx) => {
    const [a, b] = ctx.operandos;
    let ta, tb;
    try { ta = lineasDe(ctx.vfs.leer(a)); } catch { return { errores: [`diff: ${a}: No existe el archivo o el directorio`], codigo: 2 }; }
    try { tb = lineasDe(ctx.vfs.leer(b)); } catch { return { errores: [`diff: ${b}: No existe el archivo o el directorio`], codigo: 2 }; }
    const salida = [];
    const max = Math.max(ta.length, tb.length);
    for (let i = 0; i < max; i++) {
      if (ta[i] !== tb[i]) {
        if (ta[i] !== undefined && tb[i] !== undefined) salida.push(`${i + 1}c${i + 1}`, `< ${ta[i]}`, '---', `> ${tb[i]}`);
        else if (ta[i] === undefined) salida.push(`${i}a${i + 1}`, `> ${tb[i]}`);
        else salida.push(`${i + 1}d${i}`, `< ${ta[i]}`);
      }
    }
    return { salida: aTexto(salida), codigo: salida.length ? 1 : 0 };
  }),

  comando('sed', 'Edita texto con una expresión s/patrón/reemplazo/', (ctx) => {
    const expr = ctx.operandos[0] || '';
    const rutas = ctx.operandos.slice(1);
    const m = expr.match(/^s(.)(.*?)\1(.*?)\1([gi]*)$/);
    if (!m) return { errores: ['sed: este simulador implementa solo s/patrón/reemplazo/[gi]'], codigo: 1 };
    const [, , patron, reemplazo, banderas] = m;
    let regex;
    try { regex = new RegExp(patron, banderas.includes('g') ? 'g' : ''); }
    catch { return { errores: [`sed: expresión no válida: ${patron}`], codigo: 1 }; }
    const t = textoEntrada(ctx, rutas);
    return aTexto(lineasDe(t).map(l => l.replace(regex, reemplazo)));
  }),

  comando('xargs', 'Convierte la entrada en argumentos de otro comando', (ctx) => {
    const destino = ctx.operandos[0];
    if (!destino) return ctx.entrada.texto;
    const piezas = ctx.entrada.texto.trim().split(/\s+/).filter(Boolean);
    if (!piezas.length) return '';
    const linea = [destino, ...ctx.operandos.slice(1), ...piezas].join(' ');
    const r = ctx.shell.ejecutar(linea);
    ctx.shell.historial.pop();
    return aTexto(r.lineas.map(l => l.texto));
  }),
];

// ------------------------------------------------------------- permisos
function modoDesdeTexto(actual, spec) {
  if (/^[0-7]{3,4}$/.test(spec)) return parseInt(spec, 8);
  const m = spec.match(/^([ugoa]*)([+\-=])([rwx]+)$/);
  if (!m) return null;
  const [, quienes, op, bits] = m;
  const destinos = (quienes || 'a').includes('a') ? ['u', 'g', 'o'] : quienes.split('');
  let modo = actual;
  const mapa = { r: 4, w: 2, x: 1 };
  const desplaz = { u: 6, g: 3, o: 0 };
  let valor = 0;
  for (const b of bits) valor |= mapa[b];
  for (const d of destinos) {
    const sh = desplaz[d];
    if (op === '+') modo |= (valor << sh);
    else if (op === '-') modo &= ~(valor << sh);
    else modo = (modo & ~(0o7 << sh)) | (valor << sh);
  }
  return modo;
}

const permisos = [
  comando('chmod', 'Cambia los permisos de un archivo', (ctx) => {
    const recursivo = ctx.flags.cortas.has('R');
    const [spec, ...rutas] = ctx.operandos;
    if (!spec || !rutas.length) return { errores: ['chmod: faltan operandos'], codigo: 1 };
    for (const ruta of rutas) {
      const nodo = ctx.vfs.nodo(ruta);
      if (!nodo) { ctx.error(`chmod: no se puede acceder a '${ruta}': No existe el archivo o el directorio`); continue; }
      const nuevo = modoDesdeTexto(nodo.modo, spec);
      if (nuevo === null) { ctx.error(`chmod: modo no válido: «${spec}»`); continue; }
      nodo.modo = nuevo;
      if (recursivo) for (const { nodo: hijo } of ctx.vfs.recorrer(ctx.vfs.segmentos(ruta))) hijo.modo = modoDesdeTexto(hijo.modo, spec);
    }
    return '';
  }),

  comando('chown', 'Cambia propietario y grupo', (ctx) => {
    const [spec, ...rutas] = ctx.operandos;
    if (!spec || !rutas.length) return { errores: ['chown: faltan operandos'], codigo: 1 };
    const [propietario, grupo] = spec.split(':');
    for (const ruta of rutas) {
      try { ctx.vfs.chown(ruta, propietario, grupo); }
      catch { ctx.error(`chown: no se puede acceder a '${ruta}': No existe el archivo o el directorio`); }
    }
    return '';
  }),

  comando('umask', 'Muestra la máscara de creación', (ctx) => ctx.operandos.length ? '' : '0022\n'),

  comando('sudo', 'Ejecuta un comando como administrador', (ctx) => {
    if (!ctx.operandos.length) return { errores: ['uso: sudo COMANDO'], codigo: 1 };
    // Durante el comando la identidad ES root, igual que con sudo real:
    // si no, `sudo whoami` respondería «alumno» y enseñaría algo falso.
    const usuarioPrevio = ctx.shell.usuario;
    ctx.shell.usuario = 'root';
    let r;
    try { r = ctx.shell.ejecutar(ctx.operandos.join(' ')); }
    finally { ctx.shell.usuario = usuarioPrevio; }
    ctx.shell.historial.pop();
    return { salida: aTexto(r.lineas.filter(l => l.clase !== 'err').map(l => l.texto)),
             errores: r.lineas.filter(l => l.clase === 'err').map(l => l.texto), codigo: r.codigo };
  }),
];

// ------------------------------------------------ procesos, servicios, sistema
const sistema = [
  comando('ps', 'Lista procesos', (ctx) => {
    // ps admite dos sintaxis: BSD sin guion («ps aux») y UNIX con guion
    // («ps -ef»). El simulador entiende las dos, como el ps real.
    const bsd = ctx.operandos.filter(o => /^[auxef]+$/.test(o)).join('');
    const letras = new Set([...bsd, ...ctx.flags.cortas]);
    const todos = letras.has('a') || letras.has('e') || letras.has('x');
    const detallado = letras.has('u') || letras.has('f') || todos;
    const procesos = ctx.shell.procesos || [];
    const lista = todos ? procesos : procesos.filter(p => p.usuario === ctx.shell.usuario);
    if (detallado) {
      return 'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\n' +
        aTexto(lista.map(p => `${p.usuario.padEnd(9)} ${String(p.pid).padStart(5)} ${String(p.cpu).padStart(4)} ${String(p.mem).padStart(4)} ${String(p.vsz || 12000).padStart(6)} ${String(p.rss || 4000).padStart(5)} ${(p.tty || '?').padEnd(8)} ${(p.estado || 'S').padEnd(4)} ${p.inicio || '10:00'} ${p.tiempo || '0:00'} ${p.comando}`));
    }
    return '    PID TTY          TIME CMD\n' +
      aTexto(lista.map(p => `${String(p.pid).padStart(7)} ${(p.tty || 'pts/0').padEnd(8)} ${(p.tiempo || '00:00:00').padStart(8)} ${p.comando.split(' ')[0]}`));
  }),

  comando('top', 'Procesos por consumo (instantánea)', (ctx) => {
    const procesos = [...(ctx.shell.procesos || [])].sort((a, b) => b.cpu - a.cpu);
    return `top - 10:00:00 hasta 3:16,  1 usuario,  carga promedio: 0,08, 0,03, 0,01\n` +
      `Tareas: ${procesos.length} total,   1 ejecutando, ${procesos.length - 1} hibernando\n` +
      `%Cpu(s):  2,0 us,  0,7 sy,  0,0 ni, 97,3 id\n` +
      `MiB Mem :   3741,3 total,   1900,8 libre,   1138,6 usado\n\n` +
      '    PID USUARIO   PR  NI    VIRT    RES  %CPU  %MEM     TIME+ ORDEN\n' +
      aTexto(procesos.slice(0, 12).map(p =>
        `${String(p.pid).padStart(7)} ${p.usuario.padEnd(9)} 20   0 ${String(p.vsz || 12000).padStart(7)} ${String(p.rss || 4000).padStart(6)} ${String(p.cpu).padStart(5)} ${String(p.mem).padStart(5)}   ${p.tiempo || '0:00.01'} ${p.comando.split(' ')[0]}`)) +
      '\n(en el simulador top muestra una instantánea; en un sistema real se actualiza y se sale con q)\n';
  }, { alias: ['htop'] }),

  comando('kill', 'Envía una señal a un proceso', (ctx) => {
    const pid = parseInt(ctx.operandos[ctx.operandos.length - 1], 10);
    const forzar = ctx.opciones.includes('-9') || ctx.opciones.includes('-KILL');
    const procesos = ctx.shell.procesos || [];
    const i = procesos.findIndex(p => p.pid === pid);
    if (Number.isNaN(pid)) return { errores: ['kill: uso: kill [-señal] PID'], codigo: 1 };
    if (i < 0) return { errores: [`bash: kill: (${pid}) - No existe el proceso`], codigo: 1 };
    if (procesos[i].protegido && !forzar) return { errores: [`bash: kill: (${pid}) - Operación no permitida`], codigo: 1 };
    procesos.splice(i, 1);
    return '';
  }),

  comando('pgrep', 'Busca PIDs por nombre', (ctx) => {
    const patron = ctx.operandos[0] || '';
    const procesos = (ctx.shell.procesos || []).filter(p => p.comando.includes(patron));
    return { salida: aTexto(procesos.map(p => String(p.pid))), codigo: procesos.length ? 0 : 1 };
  }),

  comando('pkill', 'Mata procesos por nombre', (ctx) => {
    const patron = ctx.operandos[0] || '';
    const procesos = ctx.shell.procesos || [];
    let matados = 0;
    for (let i = procesos.length - 1; i >= 0; i--) {
      if (procesos[i].comando.includes(patron) && !procesos[i].protegido) { procesos.splice(i, 1); matados++; }
    }
    return { salida: '', codigo: matados ? 0 : 1 };
  }),

  comando('jobs', 'Trabajos en segundo plano', () => ''),

  comando('df', 'Espacio en disco', (ctx) => {
    const h = ctx.flags.cortas.has('h');
    return 'S.ficheros     Tamaño Usados  Disp Uso% Montado en\n' +
      (h ? '/dev/sda2        50G    14G   34G  30% /\n/dev/sda1       512M    62M  450M  13% /boot\n'
         : '/dev/sda2      52428800 14680064 35651584  30% /\n/dev/sda1        524288    63488   460800  13% /boot\n');
  }),

  comando('du', 'Espacio usado por directorios', (ctx) => {
    const h = ctx.flags.cortas.has('h');
    const resumen = ctx.flags.cortas.has('s');
    const base = ctx.operandos[0] || '.';
    const segs = ctx.vfs.segmentos(base);
    if (!ctx.vfs.nodo(segs)) return { errores: [`du: no se puede acceder a '${base}': No existe el archivo o el directorio`], codigo: 1 };
    const filas = [];
    const tamanoDe = (nodo) => {
      let total = 4;
      for (const hijo of nodo.hijos.values()) total += hijo.esDir ? tamanoDe(hijo) : Math.max(4, Math.ceil(hijo.tamano / 1024) * 4);
      return total;
    };
    const nodo = ctx.vfs.nodo(segs);
    if (resumen) filas.push(`${h ? humano(tamanoDe(nodo) * 1024) : tamanoDe(nodo)}\t${base}`);
    else {
      for (const { nodo: n, segs: s } of ctx.vfs.recorrer(segs)) {
        if (!n.esDir) continue;
        filas.push(`${h ? humano(tamanoDe(n) * 1024) : tamanoDe(n)}\t${ctx.vfs.texto(s)}`);
      }
    }
    return aTexto(filas);
  }),

  comando('free', 'Memoria disponible', (ctx) => {
    const h = ctx.flags.cortas.has('h');
    return '               total        usado       libre   compartido  búf/caché  disponible\n' +
      (h ? 'Mem:           3,7Gi       1,1Gi       1,9Gi        82Mi       959Mi       2,5Gi\nInterc.:       1,0Gi          0B       1,0Gi\n'
         : 'Mem:         3830068     1165924     1946420       84212      982624     2664144\nInterc.:     1048572           0     1048572\n');
  }),

  comando('systemctl', 'Controla servicios del sistema', (ctx) => {
    const servicios = ctx.shell.servicios || {};
    const accion = ctx.operandos[0];
    const nombre = (ctx.operandos[1] || '').replace(/\.service$/, '');

    if (!accion || accion === 'list-units') {
      return 'UNIT                 LOAD   ACTIVE   SUB     DESCRIPTION\n' +
        aTexto(Object.entries(servicios).map(([n, s]) =>
          `${(n + '.service').padEnd(20)} loaded ${(s.activo ? 'active' : 'inactive').padEnd(8)} ${(s.activo ? 'running' : 'dead').padEnd(7)} ${s.descripcion || n}`));
    }
    if (!(nombre in servicios)) {
      return { errores: [`Unit ${nombre}.service could not be found.`], codigo: 4 };
    }
    const s = servicios[nombre];
    if (accion === 'status') {
      const punto = s.activo ? '●' : '○';
      return `${punto} ${nombre}.service - ${s.descripcion || nombre}\n` +
        `     Loaded: loaded (/usr/lib/systemd/system/${nombre}.service; ${s.habilitado ? 'enabled' : 'disabled'})\n` +
        `     Active: ${s.activo ? 'active (running)' : (s.fallado ? 'failed (Result: exit-code)' : 'inactive (dead)')}\n` +
        (s.pid && s.activo ? `   Main PID: ${s.pid} (${nombre})\n` : '') +
        (s.log ? '\n' + s.log.map(l => `sep 22 10:00:00 academia ${nombre}[${s.pid || 1}]: ${l}`).join('\n') + '\n' : '');
    }
    if (accion === 'start') { s.activo = true; s.fallado = false; return ''; }
    if (accion === 'stop') { s.activo = false; return ''; }
    if (accion === 'restart') { s.activo = true; s.fallado = false; return ''; }
    if (accion === 'enable') { s.habilitado = true; return ''; }
    if (accion === 'disable') { s.habilitado = false; return ''; }
    if (accion === 'is-active') return { salida: (s.activo ? 'active' : 'inactive') + '\n', codigo: s.activo ? 0 : 3 };
    return { errores: [`systemctl: acción no implementada en el simulador: ${accion}`], codigo: 1 };
  }),

  comando('journalctl', 'Registros del sistema', (ctx) => {
    const unidad = valorOpcion(ctx, '-u', '--unit');
    const servicios = ctx.shell.servicios || {};
    const registros = ctx.shell.registros || [];
    if (unidad) {
      const nombre = unidad.replace(/\.service$/, '');
      const s = servicios[nombre];
      if (!s) return '-- No entries --\n';
      return aTexto((s.log || []).map(l => `sep 22 10:00:00 academia ${nombre}[${s.pid || 1}]: ${l}`)) || '-- No entries --\n';
    }
    return aTexto(registros) || '-- No entries --\n';
  }),

  comando('dmesg', 'Mensajes del núcleo', (ctx) => aTexto((ctx.shell.registros || []).slice(0, 10)) || '[    0.000000] Linux version 6.12.4-arch1-1\n'),
];

// ------------------------------------------------------------------- red
const red = [
  comando('ping', 'Comprueba si un host responde', (ctx) => {
    const destino = ctx.operandos[0];
    if (!destino) return { errores: ['ping: falta el destino'], codigo: 1 };
    const hosts = ctx.shell.red || {};
    const info = hosts[destino];
    if (!info) return { errores: [`ping: ${destino}: Nombre o servicio desconocido`], codigo: 2 };
    if (!info.responde) {
      return { salida: `PING ${destino} (${info.ip}) 56(84) bytes de datos.\n\n--- ${destino} estadísticas del ping ---\n4 paquetes transmitidos, 0 recibidos, 100% perdidos, tiempo 3070ms\n`, codigo: 1 };
    }
    const lineas = [`PING ${destino} (${info.ip}) 56(84) bytes de datos.`];
    for (let i = 1; i <= 4; i++) lineas.push(`64 bytes desde ${info.ip}: icmp_seq=${i} ttl=64 tiempo=${(0.3 + i * 0.05).toFixed(2)} ms`);
    lineas.push('', `--- ${destino} estadísticas del ping ---`, '4 paquetes transmitidos, 4 recibidos, 0% perdidos, tiempo 3005ms');
    return aTexto(lineas);
  }),

  comando('ip', 'Configuración de red', (ctx) => {
    const sub = ctx.operandos[0] || 'addr';
    if (sub.startsWith('a')) {
      return '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n' +
             '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    inet 192.168.56.10/24 brd 192.168.56.255 scope global eth0\n';
    }
    if (sub.startsWith('r')) return 'default via 192.168.56.1 dev eth0\n192.168.56.0/24 dev eth0 proto kernel scope link src 192.168.56.10\n';
    return { errores: [`ip: subcomando no implementado en el simulador: ${sub}`], codigo: 1 };
  }),

  comando('ss', 'Sockets en escucha', (ctx) => {
    const puertos = ctx.shell.puertos || [];
    return 'State   Recv-Q  Send-Q   Local Address:Port   Peer Address:Port  Process\n' +
      aTexto(puertos.map(p => `LISTEN  0       128      ${p.direccion}:${p.puerto}`.padEnd(52) + `0.0.0.0:*    ${p.proceso ? 'users:(("' + p.proceso + '"))' : ''}`));
  }),

  comando('curl', 'Descarga una URL', (ctx) => {
    const url = ctx.operandos[0];
    const web = ctx.shell.web || {};
    if (!url) return { errores: ['curl: try \'curl --help\' for more information'], codigo: 2 };
    const clave = Object.keys(web).find(k => url.includes(k));
    if (!clave) return { errores: [`curl: (6) Could not resolve host: ${url.replace(/^https?:\/\//, '').split('/')[0]}`], codigo: 6 };
    return web[clave] + '\n';
  }),

  comando('wget', 'Descarga un archivo', (ctx) => {
    const url = ctx.operandos[0];
    const web = ctx.shell.web || {};
    const clave = Object.keys(web).find(k => (url || '').includes(k));
    if (!clave) return { errores: [`wget: no se pudo resolver la dirección «${url}»`], codigo: 4 };
    const nombre = url.split('/').pop() || 'index.html';
    ctx.vfs.escribir(nombre, web[clave] + '\n');
    return `Guardado «${nombre}» [${web[clave].length}]\n`;
  }),

  comando('dig', 'Consulta DNS', (ctx) => {
    const nombre = ctx.operandos[0];
    const hosts = ctx.shell.red || {};
    const info = hosts[nombre];
    if (!info) return `; <<>> DiG 9.20 <<>> ${nombre}\n;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN\n`;
    return `; <<>> DiG 9.20 <<>> ${nombre}\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR\n\n;; SECCIÓN RESPUESTA:\n${nombre}.\t300\tIN\tA\t${info.ip}\n`;
  }),
];

// ------------------------------------------------------------ compresión
const compresion = [
  comando('tar', 'Empaqueta y desempaqueta archivos', (ctx) => {
    const banderasTar = ctx.opciones.join('') + (ctx.operandos[0] && !ctx.operandos[0].includes('.') ? ctx.operandos[0] : '');
    const crear = /c/.test(banderasTar);
    const extraer = /x/.test(banderasTar);
    const listar = /t/.test(banderasTar);
    const verboso = /v/.test(banderasTar);
    const archivo = ctx.operandos.find(o => /\.(tar|tgz)(\.gz)?$/.test(o));
    if (!archivo) return { errores: ['tar: falta el nombre del archivo (-f)'], codigo: 2 };
    const fuentes = ctx.operandos.filter(o => o !== archivo && /[.\/]/.test(o) === false || (o !== archivo && ctx.vfs.existe(o)));

    if (crear) {
      const incluidos = [];
      for (const f of fuentes) {
        const segs = ctx.vfs.segmentos(f);
        if (!ctx.vfs.nodo(segs)) { ctx.error(`tar: ${f}: No se puede open: No existe el archivo o el directorio`); continue; }
        for (const { nodo, segs: s } of ctx.vfs.recorrer(segs)) {
          incluidos.push({ ruta: s.slice(ctx.vfs.cwd.length).join('/') || nodo.nombre, contenido: nodo.esDir ? null : nodo.contenido });
        }
      }
      ctx.vfs.escribir(archivo, '__TAR__' + JSON.stringify(incluidos));
      return verboso ? aTexto(incluidos.map(i => i.ruta)) : '';
    }
    if (listar || extraer) {
      let datos;
      try { datos = ctx.vfs.leer(archivo); } catch { return { errores: [`tar: ${archivo}: No se puede open: No existe el archivo o el directorio`], codigo: 2 }; }
      if (!datos.startsWith('__TAR__')) return { errores: ['tar: no parece un archivo tar creado en este simulador'], codigo: 2 };
      const entradas = JSON.parse(datos.slice(7));
      if (listar) return aTexto(entradas.map(e => e.ruta));
      for (const e of entradas) {
        if (e.contenido === null) ctx.vfs.mkdir(e.ruta, { padres: true });
        else { ctx.vfs.mkdir(e.ruta.split('/').slice(0, -1).join('/') || '.', { padres: true }); ctx.vfs.escribir(e.ruta, e.contenido); }
      }
      return verboso ? aTexto(entradas.map(e => e.ruta)) : '';
    }
    return { errores: ['tar: hay que indicar una operación: -c, -x o -t'], codigo: 2 };
  }),

  comando('gzip', 'Comprime un archivo', (ctx) => {
    for (const ruta of ctx.operandos) {
      let contenido;
      try { contenido = ctx.vfs.leer(ruta); } catch { ctx.error(`gzip: ${ruta}: No existe el archivo o el directorio`); continue; }
      ctx.vfs.escribir(ruta + '.gz', '__GZ__' + contenido);
      ctx.vfs.borrar(ruta);
    }
    return '';
  }),

  comando('gunzip', 'Descomprime un .gz', (ctx) => {
    for (const ruta of ctx.operandos) {
      let contenido;
      try { contenido = ctx.vfs.leer(ruta); } catch { ctx.error(`gunzip: ${ruta}: No existe el archivo o el directorio`); continue; }
      if (!contenido.startsWith('__GZ__')) { ctx.error(`gunzip: ${ruta}: no tiene el formato gzip`); continue; }
      ctx.vfs.escribir(ruta.replace(/\.gz$/, ''), contenido.slice(6));
      ctx.vfs.borrar(ruta);
    }
    return '';
  }),
];

export const COMANDOS_LINUX_EXTRA = [...texto, ...permisos, ...sistema, ...red, ...compresion];

export const COMANDOS_LINUX = [...basicos, ...archivos, ...COMANDOS_LINUX_EXTRA];
export const registroLinux = () => construirRegistro(COMANDOS_LINUX);
