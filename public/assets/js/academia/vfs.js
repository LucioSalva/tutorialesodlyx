/**
 * Academia de Comandos · Sistema de archivos VIRTUAL
 * ---------------------------------------------------------------------
 * Todo lo que el estudiante crea, copia, mueve o borra ocurre AQUÍ: en un
 * objeto de JavaScript que vive en la memoria de la pestaña. No hay acceso
 * al disco real, ni al servidor, ni a ninguna API del sistema operativo.
 *
 * Soporta dos estilos de ruta porque la academia enseña tres shells:
 *   · POSIX   → raíz «/», separador «/»   (Linux)
 *   · Windows → raíz «C:», separador «\»  (CMD y PowerShell)
 *
 * Internamente una ruta es siempre un array de segmentos + una raíz, así
 * que las dos familias comparten la misma lógica de resolución.
 */

export const TIPO = { FICHERO: 'file', DIR: 'dir', ENLACE: 'link' };

let contadorInodo = 1;

export class VNode {
  constructor(opts = {}) {
    this.nombre = opts.nombre || '';
    this.tipo = opts.tipo || TIPO.FICHERO;
    this.contenido = opts.contenido || '';
    this.hijos = new Map();
    this.propietario = opts.propietario || 'alumno';
    this.grupo = opts.grupo || 'alumno';
    this.modo = opts.modo !== undefined ? opts.modo : (this.tipo === TIPO.DIR ? 0o755 : 0o644);
    this.oculto = opts.oculto !== undefined ? opts.oculto : this.nombre.startsWith('.');
    this.mtime = opts.mtime || '2026-09-22 10:00';
    this.destino = opts.destino || null;   // solo enlaces
    this.inodo = contadorInodo++;
    this.protegido = !!opts.protegido;     // el escenario no permite borrarlo
  }

  get esDir() { return this.tipo === TIPO.DIR; }

  get tamano() {
    if (this.esDir) return 4096;
    return this.contenido.length;
  }

  clonar(nombreNuevo) {
    const copia = new VNode({
      nombre: nombreNuevo || this.nombre,
      tipo: this.tipo,
      contenido: this.contenido,
      propietario: this.propietario,
      grupo: this.grupo,
      modo: this.modo,
      mtime: this.mtime,
      destino: this.destino,
    });
    for (const [nombre, hijo] of this.hijos) copia.hijos.set(nombre, hijo.clonar());
    return copia;
  }
}

/** Error con el mensaje que imprimiría la shell correspondiente. */
export class ErrorVFS extends Error {
  constructor(clave, ruta, extra) {
    super(clave);
    this.clave = clave;     // 'noexiste' | 'esdir' | 'nodir' | 'existe' | 'nopermiso' | 'nodirvacio' | 'protegido'
    this.ruta = ruta;
    this.extra = extra;
  }
}

export class VFS {
  /**
   * @param {object} spec  árbol declarativo del escenario
   * @param {'posix'|'windows'} estilo
   * @param {string} inicio  directorio inicial
   */
  constructor(spec, estilo = 'posix', inicio = null) {
    this.estilo = estilo;
    this.sep = estilo === 'windows' ? '\\' : '/';
    this.raizNombre = estilo === 'windows' ? 'C:' : '';
    this.raiz = new VNode({ nombre: '', tipo: TIPO.DIR });
    this.specOriginal = JSON.parse(JSON.stringify(spec || {}));
    this._construir(this.raiz, spec || {});
    this.cwd = inicio ? this.segmentos(inicio) : (estilo === 'windows'
      ? ['Users', 'Alumno'] : ['home', 'alumno']);
  }

  /** Reconstruye el escenario original: el botón «reiniciar». */
  reiniciar() {
    this.raiz = new VNode({ nombre: '', tipo: TIPO.DIR });
    this._construir(this.raiz, JSON.parse(JSON.stringify(this.specOriginal)));
  }

  _construir(padre, spec) {
    for (const [nombre, valor] of Object.entries(spec)) {
      if (valor && typeof valor === 'object' && valor.__tipo === 'file') {
        padre.hijos.set(nombre, new VNode({
          nombre, tipo: TIPO.FICHERO, contenido: valor.contenido || '',
          modo: valor.modo !== undefined ? valor.modo : 0o644,
          propietario: valor.propietario, grupo: valor.grupo, mtime: valor.mtime,
          protegido: valor.protegido,
        }));
      } else if (valor && typeof valor === 'object' && valor.__tipo === 'link') {
        padre.hijos.set(nombre, new VNode({ nombre, tipo: TIPO.ENLACE, destino: valor.destino }));
      } else if (typeof valor === 'string') {
        padre.hijos.set(nombre, new VNode({ nombre, tipo: TIPO.FICHERO, contenido: valor }));
      } else {
        const dir = new VNode({
          nombre, tipo: TIPO.DIR,
          modo: (valor && valor.__modo !== undefined) ? valor.__modo : 0o755,
          propietario: valor && valor.__propietario, grupo: valor && valor.__grupo,
          protegido: valor && valor.__protegido,
        });
        padre.hijos.set(nombre, dir);
        const resto = {};
        for (const [k, v] of Object.entries(valor || {})) if (!k.startsWith('__')) resto[k] = v;
        this._construir(dir, resto);
      }
    }
  }

  // ------------------------------------------------------------------ rutas
  esAbsoluta(ruta) {
    if (this.estilo === 'windows') return /^[A-Za-z]:[\\/]/.test(ruta) || ruta.startsWith('\\') || ruta.startsWith('/');
    return ruta.startsWith('/');
  }

  /** Convierte una ruta (absoluta o relativa) en un array de segmentos. */
  segmentos(ruta, cwd = null) {
    let limpio = String(ruta === undefined || ruta === null ? '' : ruta).trim();
    let base = cwd ? cwd.slice() : (this.cwd ? this.cwd.slice() : []);

    if (this.estilo === 'windows') {
      limpio = limpio.replace(/\//g, '\\');
      if (/^[A-Za-z]:\\?/.test(limpio)) { base = []; limpio = limpio.replace(/^[A-Za-z]:\\?/, ''); }
      else if (limpio.startsWith('\\')) { base = []; limpio = limpio.slice(1); }
    } else {
      // Las dos ramas son excluyentes: en «~/entrega» la barra pertenece al
      // home, no convierte la ruta en absoluta. Si se encadenan los dos if,
      // «mkdir ~/entrega» acaba creando /entrega en la raíz.
      if (limpio.startsWith('~')) {
        base = ['home', 'alumno'];
        limpio = limpio.slice(1).replace(/^\//, '');
      } else if (limpio.startsWith('/')) {
        base = [];
        limpio = limpio.slice(1);
      }
    }

    const partes = limpio.split(this.estilo === 'windows' ? '\\' : '/').filter(p => p !== '' && p !== '.');
    const salida = base;
    for (const parte of partes) {
      if (parte === '..') { if (salida.length) salida.pop(); }
      else salida.push(parte);
    }
    return salida;
  }

  /** Representación textual de unos segmentos, en el estilo del shell. */
  texto(segs) {
    if (this.estilo === 'windows') return 'C:\\' + segs.join('\\');
    return '/' + segs.join('/');
  }

  /** Ruta actual en formato legible, con ~ en Linux cuando procede. */
  cwdTexto({ tilde = false } = {}) {
    const t = this.texto(this.cwd);
    if (tilde && this.estilo === 'posix' && t.startsWith('/home/alumno')) {
      return '~' + t.slice('/home/alumno'.length);
    }
    return t;
  }

  // ----------------------------------------------------------------- acceso
  nodo(ruta, cwd = null) {
    const segs = Array.isArray(ruta) ? ruta : this.segmentos(ruta, cwd);
    let actual = this.raiz;
    for (const seg of segs) {
      if (!actual.esDir) return null;
      const hijo = actual.hijos.get(seg);
      if (!hijo) return null;
      actual = hijo;
    }
    return actual;
  }

  existe(ruta, cwd = null) { return this.nodo(ruta, cwd) !== null; }

  padreDe(segs) {
    const copia = segs.slice();
    const nombre = copia.pop();
    return { padre: this.nodo(copia), nombre, segsPadre: copia };
  }

  listar(ruta, cwd = null) {
    const nodo = this.nodo(ruta, cwd);
    if (!nodo) throw new ErrorVFS('noexiste', ruta);
    if (!nodo.esDir) return [nodo];
    return [...nodo.hijos.values()];
  }

  // --------------------------------------------------------------- escritura
  mkdir(ruta, { padres = false } = {}) {
    const segs = this.segmentos(ruta);
    if (!segs.length) throw new ErrorVFS('existe', ruta);
    let actual = this.raiz;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      const ultimo = i === segs.length - 1;
      let hijo = actual.hijos.get(seg);
      if (hijo) {
        if (ultimo && !padres) throw new ErrorVFS('existe', ruta);
        if (!hijo.esDir) throw new ErrorVFS('nodir', ruta);
      } else {
        if (!ultimo && !padres) throw new ErrorVFS('noexiste', ruta);
        hijo = new VNode({ nombre: seg, tipo: TIPO.DIR });
        actual.hijos.set(seg, hijo);
      }
      actual = hijo;
    }
    return actual;
  }

  escribir(ruta, contenido, { anexar = false, crear = true } = {}) {
    const segs = this.segmentos(ruta);
    const { padre, nombre } = this.padreDe(segs);
    if (!padre || !padre.esDir) throw new ErrorVFS('noexiste', ruta);
    let nodo = padre.hijos.get(nombre);
    if (!nodo) {
      if (!crear) throw new ErrorVFS('noexiste', ruta);
      nodo = new VNode({ nombre, tipo: TIPO.FICHERO });
      padre.hijos.set(nombre, nodo);
    }
    if (nodo.esDir) throw new ErrorVFS('esdir', ruta);
    nodo.contenido = anexar ? (nodo.contenido + contenido) : contenido;
    return nodo;
  }

  leer(ruta, cwd = null) {
    const nodo = this.nodo(ruta, cwd);
    if (!nodo) throw new ErrorVFS('noexiste', ruta);
    if (nodo.esDir) throw new ErrorVFS('esdir', ruta);
    return nodo.contenido;
  }

  copiar(origen, destino, { recursivo = false } = {}) {
    const nOrigen = this.nodo(origen);
    if (!nOrigen) throw new ErrorVFS('noexiste', origen);
    if (nOrigen.esDir && !recursivo) throw new ErrorVFS('esdir', origen);

    const segsDest = this.segmentos(destino);
    const nDestino = this.nodo(segsDest);
    if (nDestino && nDestino.esDir) {
      nDestino.hijos.set(nOrigen.nombre, nOrigen.clonar());
      return;
    }
    const { padre, nombre } = this.padreDe(segsDest);
    if (!padre || !padre.esDir) throw new ErrorVFS('noexiste', destino);
    padre.hijos.set(nombre, nOrigen.clonar(nombre));
  }

  mover(origen, destino) {
    const segsOrigen = this.segmentos(origen);
    const nOrigen = this.nodo(segsOrigen);
    if (!nOrigen) throw new ErrorVFS('noexiste', origen);
    if (nOrigen.protegido) throw new ErrorVFS('protegido', origen);

    const segsDest = this.segmentos(destino);
    const nDestino = this.nodo(segsDest);
    const { padre: padreOrigen, nombre: nombreOrigen } = this.padreDe(segsOrigen);

    if (nDestino && nDestino.esDir) {
      padreOrigen.hijos.delete(nombreOrigen);
      nOrigen.nombre = nombreOrigen;
      nDestino.hijos.set(nombreOrigen, nOrigen);
      return;
    }
    const { padre, nombre } = this.padreDe(segsDest);
    if (!padre || !padre.esDir) throw new ErrorVFS('noexiste', destino);
    padreOrigen.hijos.delete(nombreOrigen);
    nOrigen.nombre = nombre;
    padre.hijos.set(nombre, nOrigen);
  }

  borrar(ruta, { recursivo = false } = {}) {
    const segs = this.segmentos(ruta);
    if (!segs.length) throw new ErrorVFS('protegido', ruta);
    const nodo = this.nodo(segs);
    if (!nodo) throw new ErrorVFS('noexiste', ruta);
    if (nodo.protegido) throw new ErrorVFS('protegido', ruta);
    if (nodo.esDir && !recursivo) throw new ErrorVFS('esdir', ruta);
    if (nodo.esDir && nodo.hijos.size && !recursivo) throw new ErrorVFS('nodirvacio', ruta);
    const { padre, nombre } = this.padreDe(segs);
    padre.hijos.delete(nombre);
  }

  chmod(ruta, modo) {
    const nodo = this.nodo(ruta);
    if (!nodo) throw new ErrorVFS('noexiste', ruta);
    nodo.modo = modo;
    return nodo;
  }

  chown(ruta, propietario, grupo) {
    const nodo = this.nodo(ruta);
    if (!nodo) throw new ErrorVFS('noexiste', ruta);
    if (propietario) nodo.propietario = propietario;
    if (grupo) nodo.grupo = grupo;
    return nodo;
  }

  /** Recorrido en profundidad: [{nodo, segs}] */
  recorrer(desdeSegs = []) {
    const salida = [];
    const raiz = this.nodo(desdeSegs);
    if (!raiz) return salida;
    const pila = [[raiz, desdeSegs.slice()]];
    while (pila.length) {
      const [nodo, segs] = pila.pop();
      salida.push({ nodo, segs });
      if (nodo.esDir) {
        for (const hijo of [...nodo.hijos.values()].reverse()) pila.push([hijo, segs.concat(hijo.nombre)]);
      }
    }
    return salida;
  }

  /** Árbol serializable, para pintarlo al lado de la terminal. */
  arbol(desde = null, profundidadMax = 6) {
    const segs = desde ? this.segmentos(desde) : [];
    const construir = (nodo, nivel) => ({
      nombre: nodo.nombre || (this.estilo === 'windows' ? 'C:' : '/'),
      tipo: nodo.tipo,
      modo: nodo.modo,
      hijos: (nodo.esDir && nivel < profundidadMax)
        ? [...nodo.hijos.values()].sort(ordenar).map(h => construir(h, nivel + 1))
        : [],
    });
    const raiz = this.nodo(segs) || this.raiz;
    return construir(raiz, 0);
  }
}

export function ordenar(a, b) {
  if (a.esDir !== b.esDir) return a.esDir ? -1 : 1;
  return a.nombre.localeCompare(b.nombre, 'es');
}

/** 0o644 → "-rw-r--r--" */
export function modoTexto(nodo) {
  const bits = ['x', 'w', 'r'];
  let salida = nodo.esDir ? 'd' : (nodo.tipo === TIPO.ENLACE ? 'l' : '-');
  for (let grupo = 2; grupo >= 0; grupo--) {
    for (let bit = 2; bit >= 0; bit--) {
      salida += (nodo.modo >> (grupo * 3 + bit)) & 1 ? bits[bit] : '-';
    }
  }
  return salida;
}
