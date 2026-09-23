/**
 * Academia de Comandos · Motor de misiones y validación
 * ---------------------------------------------------------------------
 * Una misión NO se corrige comparando el texto que escribió el estudiante
 * con una respuesta fija: se comprueba el ESTADO del escenario virtual.
 * Así `ls -la`, `ls -al` y `ls -a -l` valen lo mismo, y cualquier camino
 * que deje el escenario como pide el objetivo se da por bueno.
 *
 * Los validadores son declarativos (objetos JSON). No se evalúa código
 * que venga de los datos: cada tipo está implementado aquí.
 */

export const VALIDADORES = {
  existe: (ctx, v) => ctx.vfs.existe(v.ruta),
  'no-existe': (ctx, v) => !ctx.vfs.existe(v.ruta),

  'es-directorio': (ctx, v) => { const n = ctx.vfs.nodo(v.ruta); return !!n && n.esDir; },
  'es-fichero': (ctx, v) => { const n = ctx.vfs.nodo(v.ruta); return !!n && !n.esDir; },

  contenido: (ctx, v) => {
    const n = ctx.vfs.nodo(v.ruta);
    if (!n || n.esDir) return false;
    if (v.igual !== undefined) return n.contenido.trim() === String(v.igual).trim();
    if (v.incluye !== undefined) return n.contenido.includes(v.incluye);
    if (v.lineas !== undefined) return n.contenido.replace(/\n$/, '').split('\n').length === v.lineas;
    return true;
  },

  cwd: (ctx, v) => {
    const actual = ctx.vfs.cwdTexto().replace(/\\/g, '/').toLowerCase();
    const esperado = ctx.vfs.texto(ctx.vfs.segmentos(v.ruta)).replace(/\\/g, '/').toLowerCase();
    return actual === esperado;
  },

  'cuantos-en': (ctx, v) => {
    const n = ctx.vfs.nodo(v.ruta);
    if (!n || !n.esDir) return false;
    let lista = [...n.hijos.values()];
    if (v.patron) { const r = new RegExp(v.patron); lista = lista.filter(h => r.test(h.nombre)); }
    if (v.solo === 'fichero') lista = lista.filter(h => !h.esDir);
    if (v.solo === 'directorio') lista = lista.filter(h => h.esDir);
    return lista.length === v.cantidad;
  },

  permisos: (ctx, v) => {
    const n = ctx.vfs.nodo(v.ruta);
    if (!n) return false;
    return (n.modo & 0o777) === parseInt(String(v.modo), 8);
  },

  propietario: (ctx, v) => {
    const n = ctx.vfs.nodo(v.ruta);
    return !!n && n.propietario === v.usuario && (!v.grupo || n.grupo === v.grupo);
  },

  'salida-incluye': (ctx, v) => ctx.salida.some(l => l.texto.includes(v.texto)),
  'salida-coincide': (ctx, v) => { const r = new RegExp(v.patron, v.banderas || ''); return ctx.salida.some(l => r.test(l.texto)); },
  'sin-errores': (ctx) => !ctx.salida.some(l => l.clase === 'err'),

  'proceso-ausente': (ctx, v) => !(ctx.shell.procesos || []).some(p => p.comando.includes(v.nombre)),
  'proceso-presente': (ctx, v) => (ctx.shell.procesos || []).some(p => p.comando.includes(v.nombre)),
  'servicio-activo': (ctx, v) => !!(ctx.shell.servicios || {})[v.nombre]?.activo,
  'servicio-parado': (ctx, v) => !(ctx.shell.servicios || {})[v.nombre]?.activo,

  /** Último comando tecleado; se usa cuando el objetivo ES el comando. */
  'comando-usado': (ctx, v) => {
    const r = new RegExp(v.patron, v.banderas || '');
    const lista = v.ultimo ? ctx.historial.slice(-1) : ctx.historial;
    return lista.some(h => r.test(h));
  },
  'comando-no-usado': (ctx, v) => {
    const r = new RegExp(v.patron, v.banderas || '');
    return !ctx.historial.some(h => r.test(h));
  },

  variable: (ctx, v) => String(ctx.shell.entorno[v.nombre] ?? '') === String(v.valor),

  todos: (ctx, v) => v.de.every(sub => evaluar(ctx, sub)),
  alguno: (ctx, v) => v.de.some(sub => evaluar(ctx, sub)),
  ninguno: (ctx, v) => !v.de.some(sub => evaluar(ctx, sub)),
};

export function evaluar(ctx, validador) {
  if (!validador) return false;
  const fn = VALIDADORES[validador.tipo];
  if (!fn) {
    console.warn('[Academia] Validador desconocido:', validador.tipo);
    return false;
  }
  try {
    return !!fn(ctx, validador);
  } catch (error) {
    // Un validador que revienta NO puede pasar por «todavía no lo has
    // conseguido»: eso deja ejercicios imposibles sin que nadie se entere.
    // El caso típico es un patrón con (?i), que JavaScript no admite.
    console.error('[Academia] Validador roto', validador, error);
    return false;
  }
}

/**
 * Pistas automáticas que enseñan: comparan lo que hizo el estudiante con
 * lo que pedía la misión y explican la diferencia conceptual, en vez de
 * responder «incorrecto».
 */
const DESVIOS_COMUNES = [
  {
    cuando: (ctx, m) => /(^|\s)mv\s/.test(ctx.ultimoComando) && /cop/i.test(m.objetivo || ''),
    dice: 'Has usado <code>mv</code>, que <strong>mueve</strong>: el archivo original desaparece. La misión pide conservar el original y crear una copia, y eso lo hace <code>cp</code>.',
  },
  {
    cuando: (ctx, m) => /(^|\s)(move)\s/i.test(ctx.ultimoComando) && /copia/i.test(m.objetivo || ''),
    dice: 'En CMD, <code>move</code> mueve el archivo. Para duplicarlo conservando el original se usa <code>copy</code>.',
  },
  {
    cuando: (ctx) => /(^|\s)rm\s+[^-]/.test(ctx.ultimoComando) && ctx.salida.some(l => /Es un directorio/.test(l.texto)),
    dice: '<code>rm</code> sin opciones solo borra archivos. Para un directorio con contenido hace falta <code>rm -r</code>, y conviene mirar antes con <code>ls</code> qué hay dentro.',
  },
  {
    cuando: (ctx) => ctx.salida.some(l => /orden no encontrada|no se reconoce como un comando|no se reconoce como nombre/.test(l.texto)),
    dice: 'Ese comando no existe en este shell (o está escrito de otra forma). Revisa la ortografía y recuerda que Linux, CMD y PowerShell no comparten todos los nombres.',
  },
  {
    cuando: (ctx) => ctx.salida.some(l => /No existe el archivo o el directorio|no puede encontrar/.test(l.texto)),
    dice: 'La ruta no existe desde donde estás. Comprueba dónde estás con <code>pwd</code> (o <code>cd</code> en CMD) y qué hay alrededor antes de repetir el comando.',
  },
];

export class Mision {
  constructor(datos, entorno) {
    this.datos = datos;
    this.entorno = entorno;          // {vfs, shell, historialInicial}
    this.intentos = 0;
    this.pistasVistas = 0;
    this.solucionVista = false;
    this.completada = false;
    this.inicio = Date.now();
  }

  get id() { return this.datos.id; }

  /** Comprueba el estado tras un comando. Devuelve el veredicto didáctico. */
  comprobar(salida, ultimoComando) {
    const ctx = {
      vfs: this.entorno.vfs,
      shell: this.entorno.shell,
      salida: salida || [],
      historial: this.entorno.shell.historial,
      ultimoComando: ultimoComando || '',
    };

    this.intentos++;

    const logrado = evaluar(ctx, this.datos.exito);
    if (logrado) {
      this.completada = true;
      return {
        estado: 'completada',
        titulo: '¡Misión cumplida!',
        mensaje: this.datos.explicacion || '',
        xp: this.xpGanado(),
      };
    }

    // Comprobación de pasos intermedios, para dar avance parcial.
    const avance = (this.datos.pasos || []).map(p => ({
      texto: p.texto,
      hecho: evaluar(ctx, p.exito),
    }));

    // ¿Se equivocó de una forma que podemos explicar?
    const propias = (this.datos.desvios || []).find(d => {
      if (d.comando) return new RegExp(d.comando).test(ctx.ultimoComando);
      if (d.si) return evaluar(ctx, d.si);
      return false;
    });
    if (propias) return { estado: 'desvio', mensaje: propias.dice, avance };

    const comun = DESVIOS_COMUNES.find(d => { try { return d.cuando(ctx, this.datos); } catch { return false; } });
    if (comun) return { estado: 'desvio', mensaje: comun.dice, avance };

    return { estado: 'pendiente', avance };
  }

  siguientePista() {
    const pistas = this.datos.pistas || [];
    if (this.pistasVistas >= pistas.length) return null;
    return pistas[this.pistasVistas++];
  }

  verSolucion() {
    this.solucionVista = true;
    return { solucion: this.datos.solucion, explicacion: this.datos.explicacion };
  }

  /** La recompensa refleja el resultado real: pistas y solución la reducen. */
  xpGanado() {
    const base = this.datos.recompensa?.xp ?? 20;
    if (this.solucionVista) return Math.round(base * 0.25);
    const penalizacion = Math.min(this.pistasVistas * 0.2, 0.6);
    const porIntentos = this.intentos > 6 ? 0.1 : 0;
    return Math.max(5, Math.round(base * (1 - penalizacion - porIntentos)));
  }

  reiniciar() {
    this.entorno.vfs.reiniciar();
    this.entorno.vfs.cwd = this.entorno.vfs.segmentos(this.datos.inicio || (this.entorno.vfs.estilo === 'windows' ? 'C:\\Users\\Alumno' : '/home/alumno'));
    this.intentos = 0;
    this.completada = false;
  }
}

/** Progreso de una serie de misiones (una ruta, un juego, un capítulo). */
export class Campana {
  constructor(misiones, progreso) {
    this.misiones = misiones;
    this.progreso = progreso;
  }

  disponible(mision) {
    const req = mision.requisitos || [];
    return req.every(id => this.progreso.misionCompletada(id));
  }

  siguiente() {
    return this.misiones.find(m => !this.progreso.misionCompletada(m.id) && this.disponible(m)) || null;
  }

  porcentaje() {
    if (!this.misiones.length) return 0;
    const hechas = this.misiones.filter(m => this.progreso.misionCompletada(m.id)).length;
    return Math.round((hechas / this.misiones.length) * 100);
  }
}
