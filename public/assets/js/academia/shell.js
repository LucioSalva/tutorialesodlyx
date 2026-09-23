/**
 * Academia de Comandos · Motor de shell simulado
 * ---------------------------------------------------------------------
 * Ejecuta una línea contra un REGISTRO CERRADO de comandos implementados.
 * Si el comando no está en el registro no se ejecuta nada: se responde con
 * el mensaje de «no encontrado» del shell correspondiente, o con el aviso
 * de «todavía no está implementado en el simulador» cuando el comando sí
 * existe en el catálogo del curso. Nunca se evalúa el texto del usuario.
 *
 * El canal entre comandos de una tubería lleva dos cosas:
 *   · texto    → lo que ven Bash y CMD
 *   · objetos  → lo que recorre el pipeline de PowerShell
 * Así el curso puede enseñar la diferencia real entre ambos modelos.
 */

import { parsear, expandirVariables, expandirComodines, separarOpciones, banderas } from './parser.js';

export class Flujo {
  constructor(texto = '', objetos = null) {
    this.texto = texto;
    this.objetos = objetos;
  }
  get lineas() {
    if (this.texto === '') return [];
    // Los archivos de los escenarios de Windows llevan CRLF. Una terminal
    // real no pinta el CR: aquí tampoco, o aparecería como basura al final
    // de cada línea y se colaría al copiar.
    return this.texto.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').map(l => l.replace(/\r$/, ''));
  }
  static de(valor) {
    if (valor instanceof Flujo) return valor;
    if (Array.isArray(valor)) return new Flujo(valor.join('\n') + (valor.length ? '\n' : ''), null);
    return new Flujo(valor === undefined || valor === null ? '' : String(valor), null);
  }
}

export class Shell {
  /**
   * @param {object} opciones
   *   vfs       sistema de archivos virtual
   *   estilo    'posix' | 'cmd' | 'powershell'
   *   registro  Map<string, comando>
   *   catalogo  Set<string> comandos que el curso explica (para avisos honestos)
   */
  constructor({ vfs, estilo, registro, catalogo = new Set(), usuario = 'alumno', host = 'academia', entorno = {} }) {
    this.vfs = vfs;
    this.estilo = estilo;
    this.registro = registro;
    this.catalogo = catalogo;
    this.usuario = usuario;
    this.host = host;
    this.historial = [];
    this.ultimoCodigo = 0;
    this.entorno = Object.assign(this._entornoBase(), entorno);
    this.eventos = new EventTarget();
    this.limiteSalida = 400;    // líneas por comando: evita bloquear la pestaña
  }

  _entornoBase() {
    if (this.estilo === 'cmd') {
      return { USERPROFILE: 'C:\\Users\\Alumno', USERNAME: 'Alumno', COMPUTERNAME: 'ACADEMIA',
               PATH: 'C:\\Windows\\system32;C:\\Windows', OS: 'Windows_NT', CD: 'C:\\Users\\Alumno' };
    }
    if (this.estilo === 'powershell') {
      return { USERPROFILE: 'C:\\Users\\Alumno', USERNAME: 'Alumno', COMPUTERNAME: 'ACADEMIA',
               PATH: 'C:\\Windows\\system32', HOME: 'C:\\Users\\Alumno' };
    }
    return { HOME: '/home/alumno', USER: this.usuario, SHELL: '/bin/bash', PWD: '/home/alumno',
             PATH: '/usr/local/bin:/usr/bin:/bin', LANG: 'es_ES.UTF-8' };
  }

  get prompt() {
    if (this.estilo === 'cmd') return this.vfs.cwdTexto() + '>';
    if (this.estilo === 'powershell') return 'PS ' + this.vfs.cwdTexto() + '>';
    return `${this.usuario}@${this.host}:${this.vfs.cwdTexto({ tilde: true })}$`;
  }

  /** Nombre canónico: en CMD y PowerShell no distingue mayúsculas. */
  _clave(nombre) {
    return this.estilo === 'posix' ? nombre : nombre.toLowerCase();
  }

  conoce(nombre) { return this.registro.has(this._clave(nombre)); }

  /**
   * Ejecuta una línea completa y devuelve las líneas de salida ya
   * clasificadas para pintarlas: {texto, clase}.
   */
  ejecutar(linea) {
    const bruta = String(linea);
    if (bruta.trim() !== '') this.historial.push(bruta);

    const salida = [];
    const { error, secuencia } = parsear(bruta);

    if (error === 'comilla') {
      salida.push({ texto: this._msg('comilla'), clase: 'err' });
      this.ultimoCodigo = 2;
      return { lineas: salida, codigo: 2 };
    }
    if (error === 'redir') {
      salida.push({ texto: this._msg('redir'), clase: 'err' });
      this.ultimoCodigo = 2;
      return { lineas: salida, codigo: 2 };
    }

    let codigo = this.ultimoCodigo;
    for (const grupo of secuencia) {
      if (grupo.operador === '&&' && codigo !== 0) continue;
      if (grupo.operador === '||' && codigo === 0) continue;
      const res = this._ejecutarTuberia(grupo.tuberia);
      salida.push(...res.lineas);
      codigo = res.codigo;
    }

    this.ultimoCodigo = codigo;
    this.entorno.__codigo = codigo;
    this.entorno.PWD = this.vfs.cwdTexto();
    this.entorno.CD = this.vfs.cwdTexto();
    this.eventos.dispatchEvent(new CustomEvent('cambio', { detail: { linea: bruta, codigo } }));
    return { lineas: salida, codigo };
  }

  _ejecutarTuberia(tuberia) {
    let entrada = new Flujo('');
    const lineas = [];
    let codigo = 0;

    for (let i = 0; i < tuberia.length; i++) {
      const paso = tuberia[i];
      const ultimo = i === tuberia.length - 1;
      // ls y compañía cambian de formato cuando NO escriben a una terminal
      // (tubería o redirección): una entrada por línea, como el ls real.
      const aTerminal = ultimo && !(paso.redir && paso.redir.salida);
      const resultado = this._ejecutarUno(paso, entrada, aTerminal);

      codigo = resultado.codigo;
      // El borrado de pantalla no es texto: viaja como marca hasta la interfaz.
      if (resultado.limpiar) lineas.push({ texto: '', clase: 'out', limpiar: true });

      // stderr se muestra siempre; no viaja por la tubería.
      for (const err of resultado.errores) lineas.push({ texto: err, clase: 'err' });

      const flujo = Flujo.de(resultado.salida);
      if (paso.redir && paso.redir.salida) {
        try {
          this.vfs.escribir(paso.redir.salida, flujo.texto, { anexar: !!paso.redir.anexar });
        } catch (e) {
          lineas.push({ texto: this._msg('noescribe', paso.redir.salida), clase: 'err' });
          codigo = 1;
        }
        entrada = new Flujo('');
        continue;
      }

      if (ultimo) {
        const fin = flujo.lineas.slice(0, this.limiteSalida);
        for (const l of fin) lineas.push({ texto: l, clase: resultado.clase || 'out' });
        if (flujo.lineas.length > this.limiteSalida) {
          lineas.push({ texto: `… salida recortada (${flujo.lineas.length - this.limiteSalida} líneas más)`, clase: 'dim' });
        }
      } else {
        entrada = flujo;
      }
    }
    return { lineas, codigo };
  }

  _ejecutarUno(paso, entrada, aTerminal = true) {
    const errores = [];
    const nombre = paso.nombre;
    const clave = this._clave(nombre);
    const comando = this.registro.get(clave);

    if (!comando) {
      if (this.catalogo.has(clave)) {
        errores.push(this._msg('nosimulado', nombre));
        return { salida: '', errores, codigo: 127 };
      }
      errores.push(this._msg('nohay', nombre));
      return { salida: '', errores, codigo: 127 };
    }

    // Expansión con las reglas reales de cada shell:
    //   'simples' → ni variables ni comodines
    //   "dobles"  → variables sí, comodines no
    //   sin comillas → ambas cosas
    const args = [];
    for (const bruto of paso.args) {
      const crudo = typeof bruto === 'string' ? { texto: bruto, comillas: null } : bruto;
      const texto = crudo.comillas === "'"
        ? crudo.texto
        : expandirVariables(crudo.texto, this.entorno, this.estilo === 'posix' ? 'posix' : this.estilo);
      if (this.estilo === 'posix' && !crudo.comillas) args.push(...expandirComodines(texto, this.vfs));
      else args.push(texto);
    }

    const estiloOpc = this.estilo === 'posix' ? 'posix' : this.estilo;
    const { opciones, operandos } = separarOpciones(args, estiloOpc);
    const flags = banderas(opciones);

    // Entrada redirigida desde archivo
    let entradaEfectiva = entrada;
    if (paso.redir && paso.redir.entrada) {
      try {
        entradaEfectiva = new Flujo(this.vfs.leer(paso.redir.entrada));
      } catch (e) {
        errores.push(this._msg('noexiste', paso.redir.entrada));
        return { salida: '', errores, codigo: 1 };
      }
    }

    const ctx = {
      shell: this, vfs: this.vfs, args, opciones, operandos, flags,
      entrada: entradaEfectiva, nombre, aTerminal,
      error: (texto) => errores.push(texto),
      msg: (clave, ruta, extra) => this._msg(clave, ruta, extra),
    };

    try {
      const res = comando.ejecutar(ctx);
      if (res === undefined || res === null) return { salida: '', errores, codigo: 0 };
      if (typeof res === 'string' || Array.isArray(res) || res instanceof Flujo) {
        return { salida: res, errores, codigo: errores.length ? 1 : 0 };
      }
      return {
        salida: res.salida !== undefined ? res.salida : '',
        errores: errores.concat(res.errores || []),
        codigo: res.codigo !== undefined ? res.codigo : (errores.length ? 1 : 0),
        clase: res.clase,
        limpiar: !!res.limpiar,     // clear / cls / Clear-Host
      };
    } catch (e) {
      if (e && e.clave) {
        errores.push(this._msg(e.clave, e.ruta, nombre));
        return { salida: '', errores, codigo: 1 };
      }
      errores.push(`${nombre}: error interno del simulador`);
      return { salida: '', errores, codigo: 1 };
    }
  }

  /** Mensajes de error con el texto y el tono de cada shell. */
  _msg(clave, ruta = '', extra = '') {
    const r = String(ruta);
    if (this.estilo === 'cmd') {
      return ({
        noexiste: 'El sistema no puede encontrar la ruta especificada.',
        nofichero: 'El sistema no puede encontrar el archivo especificado.',
        esdir: 'Acceso denegado.',
        nodir: 'El directorio no es válido.',
        existe: 'Ya existe un subdirectorio o un archivo con el nombre ' + r + '.',
        nodirvacio: 'El directorio no está vacío.',
        nohay: `'${r || extra}' no se reconoce como un comando interno o externo,\noperable o archivo por lotes.`,
        nosimulado: `'${extra}' existe en Windows, pero todavía no está implementado en este simulador.`,
        protegido: 'Acceso denegado.',
        comilla: 'Falta cerrar una comilla.',
        redir: 'La sintaxis del comando no es correcta.',
        noescribe: 'El sistema no puede encontrar la ruta especificada.',
      })[clave] || 'Error.';
    }
    if (this.estilo === 'powershell') {
      return ({
        noexiste: `No se encuentra la ruta de acceso '${r}' porque no existe.`,
        nofichero: `No se encuentra la ruta de acceso '${r}' porque no existe.`,
        esdir: `El elemento '${r}' es un directorio.`,
        nodir: `La ruta '${r}' no es un directorio.`,
        existe: `Ya existe un elemento con el nombre '${r}'.`,
        nodirvacio: `El directorio '${r}' no está vacío. Usa -Recurse para eliminarlo.`,
        nohay: `${r || extra} : El término '${r || extra}' no se reconoce como nombre de un cmdlet, función,\narchivo de script o programa ejecutable.`,
        nosimulado: `'${extra}' existe en PowerShell, pero todavía no está implementado en este simulador.`,
        protegido: `Acceso denegado a '${r}'.`,
        comilla: 'Falta el terminador de cadena.',
        redir: 'Falta el destino de la redirección.',
        noescribe: `No se puede escribir en '${r}'.`,
      })[clave] || 'Error.';
    }
    return ({
      noexiste: `${extra || 'bash'}: ${r}: No existe el archivo o el directorio`,
      nofichero: `${extra || 'bash'}: ${r}: No existe el archivo o el directorio`,
      esdir: `${extra || 'bash'}: ${r}: Es un directorio`,
      nodir: `${extra || 'bash'}: ${r}: No es un directorio`,
      existe: `${extra || 'bash'}: ${r}: El archivo ya existe`,
      nodirvacio: `${extra || 'bash'}: ${r}: El directorio no está vacío`,
      nopermiso: `${extra || 'bash'}: ${r}: Permiso denegado`,
      nohay: `bash: ${r || extra}: orden no encontrada`,
      nosimulado: `bash: ${extra}: este comando se explica en el curso, pero todavía no está implementado en el simulador`,
      protegido: `${extra || 'rm'}: no se puede borrar '${r}': lo protege el escenario`,
      comilla: 'bash: falta cerrar una comilla',
      redir: 'bash: error de sintaxis cerca del token inesperado de redirección',
      noescribe: `bash: ${r}: No se puede crear el archivo`,
    })[clave] || 'bash: error';
  }
}

/** Ayuda para declarar comandos de forma compacta. */
export function comando(nombre, resumen, ejecutar, extra = {}) {
  return { nombre, resumen, ejecutar, ...extra };
}

export function construirRegistro(lista) {
  const mapa = new Map();
  for (const c of lista) {
    mapa.set(c.nombre, c);
    for (const alias of (c.alias || [])) mapa.set(alias, c);
  }
  return mapa;
}
