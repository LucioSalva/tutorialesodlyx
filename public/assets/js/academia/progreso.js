/**
 * Academia de Comandos · Progreso, logros y repaso espaciado
 * ---------------------------------------------------------------------
 * Todo vive en localStorage del navegador: no hay cuentas ni servidor.
 * El formato está versionado para poder exportarlo, importarlo y, el día
 * que haga falta, sincronizarlo con MySQL sin romper lo guardado.
 *
 * Al importar NO se ejecuta nada: se valida campo a campo y se copia solo
 * lo que encaja con el esquema. Un archivo manipulado no puede inyectar
 * comportamiento, solo datos que se descartan si no son del tipo correcto.
 */

export const FORMATO = 'academia-comandos-progreso';
export const VERSION_FORMATO = 1;
const CLAVE = 'academia:progreso:v1';

const VACIO = () => ({
  formato: FORMATO,
  version: VERSION_FORMATO,
  creado: new Date().toISOString(),
  actualizado: new Date().toISOString(),
  xp: 0,
  comandos: {},     // id → {os, aciertos, fallos, facilidad, intervalo, ultimo, proximo, aprendido}
  misiones: {},     // id → {completada, intentos, pistas, xp, fecha, mejorTiempo}
  juegos: {},       // id → {niveles:{n:{completado,puntos,tiempo}}, mejor}
  lecciones: {},    // id → {vista, fecha}
  logros: {},       // id → fecha
  preferencias: { os: 'linux', sonido: false, teclado: true },
});

/** Intervalos del repaso espaciado, en días (SM-2 simplificado y honesto). */
const INTERVALOS = [0, 1, 3, 7, 16, 35, 90];

export class Progreso {
  constructor(almacen = null) {
    this.almacen = almacen || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.datos = this._cargar();
    this.oyentes = new Set();
  }

  _cargar() {
    if (!this.almacen) return VACIO();
    try {
      const crudo = this.almacen.getItem(CLAVE);
      if (!crudo) return VACIO();
      const datos = JSON.parse(crudo);
      return this._migrar(this._validar(datos));
    } catch {
      return VACIO();
    }
  }

  _migrar(datos) {
    // Hoy solo existe la versión 1; el hueco queda preparado y documentado.
    if (datos.version !== VERSION_FORMATO) datos.version = VERSION_FORMATO;
    return datos;
  }

  /** Copia solo lo que encaja con el esquema: nada más entra. */
  _validar(entrada) {
    const base = VACIO();
    if (!entrada || typeof entrada !== 'object') return base;

    const num = (v, pordefecto = 0) => (typeof v === 'number' && isFinite(v) ? v : pordefecto);
    const txt = (v, max = 120) => (typeof v === 'string' ? v.slice(0, max) : '');
    const bool = (v) => v === true;

    base.creado = txt(entrada.creado) || base.creado;
    base.xp = Math.max(0, Math.min(num(entrada.xp), 10_000_000));

    const limpiarMapa = (origen, limite, formador) => {
      const salida = {};
      if (!origen || typeof origen !== 'object') return salida;
      for (const [clave, valor] of Object.entries(origen).slice(0, limite)) {
        if (!/^[a-z0-9_.:-]{1,64}$/i.test(clave)) continue;
        if (!valor || typeof valor !== 'object') continue;
        salida[clave] = formador(valor);
      }
      return salida;
    };

    base.comandos = limpiarMapa(entrada.comandos, 2000, v => ({
      os: ['linux', 'cmd', 'powershell'].includes(v.os) ? v.os : 'linux',
      aciertos: num(v.aciertos), fallos: num(v.fallos),
      facilidad: Math.min(Math.max(num(v.facilidad, 2.5), 1.3), 3.5),
      intervalo: Math.min(Math.max(num(v.intervalo), 0), INTERVALOS.length - 1),
      ultimo: txt(v.ultimo, 40), proximo: txt(v.proximo, 40),
      aprendido: bool(v.aprendido),
    }));

    base.misiones = limpiarMapa(entrada.misiones, 2000, v => ({
      completada: bool(v.completada), intentos: num(v.intentos), pistas: num(v.pistas),
      xp: num(v.xp), fecha: txt(v.fecha, 40), mejorTiempo: num(v.mejorTiempo),
    }));

    base.juegos = limpiarMapa(entrada.juegos, 500, v => {
      const niveles = {};
      if (v.niveles && typeof v.niveles === 'object') {
        for (const [n, d] of Object.entries(v.niveles).slice(0, 200)) {
          if (!/^[a-z0-9_-]{1,32}$/i.test(n) || !d || typeof d !== 'object') continue;
          niveles[n] = { completado: bool(d.completado), puntos: num(d.puntos), tiempo: num(d.tiempo) };
        }
      }
      return { niveles, mejor: num(v.mejor) };
    });

    base.lecciones = limpiarMapa(entrada.lecciones, 2000, v => ({ vista: bool(v.vista), fecha: txt(v.fecha, 40) }));

    if (entrada.logros && typeof entrada.logros === 'object') {
      for (const [id, fecha] of Object.entries(entrada.logros).slice(0, 200)) {
        if (/^[a-z0-9_-]{1,48}$/i.test(id)) base.logros[id] = txt(fecha, 40);
      }
    }

    const pref = entrada.preferencias || {};
    base.preferencias = {
      os: ['linux', 'cmd', 'powershell'].includes(pref.os) ? pref.os : 'linux',
      sonido: bool(pref.sonido),
      teclado: pref.teclado !== false,
    };
    return base;
  }

  guardar() {
    this.datos.actualizado = new Date().toISOString();
    if (this.almacen) {
      try { this.almacen.setItem(CLAVE, JSON.stringify(this.datos)); }
      catch { /* almacenamiento lleno o bloqueado: la sesión sigue funcionando */ }
    }
    this.oyentes.forEach(fn => { try { fn(this.datos); } catch {} });
  }

  alCambiar(fn) { this.oyentes.add(fn); return () => this.oyentes.delete(fn); }

  // ------------------------------------------------------------------- XP
  sumarXp(cantidad) {
    this.datos.xp += Math.max(0, Math.round(cantidad));
    this.guardar();
    return this.nivel();
  }

  /** Nivel por XP: curva suave, sin castigar al principiante. */
  nivel() {
    const xp = this.datos.xp;
    const nivel = Math.floor(Math.sqrt(xp / 40)) + 1;
    const xpNivel = 40 * Math.pow(nivel - 1, 2);
    const xpSiguiente = 40 * Math.pow(nivel, 2);
    return {
      nivel,
      xp,
      restante: xpSiguiente - xp,
      porcentaje: Math.round(((xp - xpNivel) / (xpSiguiente - xpNivel)) * 100),
    };
  }

  // ------------------------------------------------------------- misiones
  misionCompletada(id) { return !!this.datos.misiones[id]?.completada; }

  registrarMision(id, { intentos = 1, pistas = 0, xp = 0, tiempo = 0 } = {}) {
    const previo = this.datos.misiones[id] || { completada: false, intentos: 0, pistas: 0, xp: 0, mejorTiempo: 0 };
    const nuevo = {
      completada: true,
      intentos: previo.intentos + intentos,
      pistas: previo.pistas + pistas,
      xp: Math.max(previo.xp, xp),
      fecha: new Date().toISOString(),
      mejorTiempo: previo.mejorTiempo && tiempo ? Math.min(previo.mejorTiempo, tiempo) : (tiempo || previo.mejorTiempo),
    };
    this.datos.misiones[id] = nuevo;
    // Solo se suma la diferencia: repetir una misión no infla el marcador.
    const extra = Math.max(0, xp - previo.xp);
    this.datos.xp += extra;
    this.guardar();
    return nuevo;
  }

  // --------------------------------------------------------------- juegos
  registrarNivel(juego, nivel, { completado = true, puntos = 0, tiempo = 0 } = {}) {
    const j = this.datos.juegos[juego] || { niveles: {}, mejor: 0 };
    const previo = j.niveles[nivel] || { completado: false, puntos: 0, tiempo: 0 };
    j.niveles[nivel] = {
      completado: completado || previo.completado,
      puntos: Math.max(previo.puntos, puntos),
      tiempo: previo.tiempo && tiempo ? Math.min(previo.tiempo, tiempo) : (tiempo || previo.tiempo),
    };
    j.mejor = Math.max(j.mejor, puntos);
    this.datos.juegos[juego] = j;
    this.guardar();
    return j;
  }

  nivelesCompletados(juego) {
    const j = this.datos.juegos[juego];
    if (!j) return 0;
    return Object.values(j.niveles).filter(n => n.completado).length;
  }

  // ------------------------------------------------------ repaso espaciado
  /**
   * Registra el resultado de practicar un comando.
   * Acertar sube de intervalo; fallar lo devuelve al principio, que es
   * exactamente lo que pidió el usuario: lo que falla vuelve antes.
   */
  practicarComando(id, acierto, os = 'linux') {
    const hoy = new Date();
    const c = this.datos.comandos[id] || {
      os, aciertos: 0, fallos: 0, facilidad: 2.5, intervalo: 0, ultimo: '', proximo: '', aprendido: false,
    };
    c.os = os;
    if (acierto) {
      c.aciertos++;
      c.intervalo = Math.min(c.intervalo + 1, INTERVALOS.length - 1);
      c.facilidad = Math.min(3.5, c.facilidad + 0.1);
      if (c.intervalo >= 3) c.aprendido = true;
    } else {
      c.fallos++;
      c.intervalo = 0;
      c.facilidad = Math.max(1.3, c.facilidad - 0.25);
      c.aprendido = false;
    }
    const dias = Math.round(INTERVALOS[c.intervalo] * (c.facilidad / 2.5));
    const proximo = new Date(hoy.getTime() + dias * 86400000);
    c.ultimo = hoy.toISOString();
    c.proximo = proximo.toISOString();
    this.datos.comandos[id] = c;
    this.datos.xp += acierto ? 4 : 1;   // equivocarse también deja algo
    this.guardar();
    return c;
  }

  marcarLeccionVista(id) {
    this.datos.lecciones[id] = { vista: true, fecha: new Date().toISOString() };
    if (!this.datos.comandos[id]) {
      this.datos.comandos[id] = { os: 'linux', aciertos: 0, fallos: 0, facilidad: 2.5, intervalo: 0, ultimo: '', proximo: new Date().toISOString(), aprendido: false };
    }
    this.guardar();
  }

  /** Comandos que tocan hoy, los que más fallas primero. */
  repasosPendientes(os = null, limite = 20) {
    const ahora = Date.now();
    return Object.entries(this.datos.comandos)
      .filter(([, c]) => !os || c.os === os)
      .filter(([, c]) => !c.proximo || new Date(c.proximo).getTime() <= ahora)
      .sort((a, b) => (b[1].fallos - b[1].aciertos) - (a[1].fallos - a[1].aciertos))
      .slice(0, limite)
      .map(([id, c]) => ({ id, ...c }));
  }

  comandosDificiles(limite = 12) {
    return Object.entries(this.datos.comandos)
      .filter(([, c]) => c.fallos > 0)
      .sort((a, b) => (b[1].fallos / (b[1].aciertos + 1)) - (a[1].fallos / (a[1].aciertos + 1)))
      .slice(0, limite)
      .map(([id, c]) => ({ id, ...c }));
  }

  resumen(os = null) {
    const comandos = Object.entries(this.datos.comandos).filter(([, c]) => !os || c.os === os);
    return {
      xp: this.datos.xp,
      nivel: this.nivel(),
      comandosVistos: comandos.length,
      comandosAprendidos: comandos.filter(([, c]) => c.aprendido).length,
      misiones: Object.values(this.datos.misiones).filter(m => m.completada).length,
      juegos: Object.keys(this.datos.juegos).length,
      nivelesJuego: Object.values(this.datos.juegos).reduce((s, j) => s + Object.values(j.niveles).filter(n => n.completado).length, 0),
      logros: Object.keys(this.datos.logros).length,
      repasos: this.repasosPendientes(os).length,
    };
  }

  // --------------------------------------------------------------- logros
  otorgar(id) {
    if (this.datos.logros[id]) return false;
    this.datos.logros[id] = new Date().toISOString();
    this.guardar();
    return true;
  }

  tieneLogro(id) { return !!this.datos.logros[id]; }

  // ----------------------------------------------------- exportar/importar
  exportar() {
    return JSON.stringify({ ...this.datos, exportado: new Date().toISOString() }, null, 2);
  }

  /**
   * @returns {{ok:boolean, mensaje:string}} — nunca lanza, nunca ejecuta.
   */
  importar(textoJson, { fusionar = true } = {}) {
    let crudo;
    try { crudo = JSON.parse(textoJson); }
    catch { return { ok: false, mensaje: 'El archivo no es un JSON válido.' }; }

    if (!crudo || crudo.formato !== FORMATO) {
      return { ok: false, mensaje: 'Ese archivo no es un progreso de la Academia de Comandos.' };
    }
    if (typeof crudo.version !== 'number' || crudo.version > VERSION_FORMATO) {
      return { ok: false, mensaje: `El archivo usa la versión ${crudo.version} del formato y esta academia entiende hasta la ${VERSION_FORMATO}.` };
    }

    const limpio = this._validar(crudo);
    if (!fusionar) {
      this.datos = limpio;
    } else {
      this.datos.xp = Math.max(this.datos.xp, limpio.xp);
      for (const grupo of ['comandos', 'misiones', 'juegos', 'lecciones', 'logros']) {
        this.datos[grupo] = { ...this.datos[grupo], ...limpio[grupo] };
      }
      this.datos.preferencias = limpio.preferencias;
    }
    this.guardar();
    return {
      ok: true,
      mensaje: `Progreso importado: ${Object.keys(limpio.misiones).length} misiones, ${Object.keys(limpio.comandos).length} comandos y ${limpio.xp} XP.`,
    };
  }

  borrarTodo() {
    this.datos = VACIO();
    this.guardar();
  }
}

export const LOGROS = [
  { id: 'primer-comando', nombre: 'Primer contacto', descripcion: 'Ejecutaste tu primer comando en la terminal virtual.', icono: '🌱' },
  { id: 'primera-mision', nombre: 'Misión inicial', descripcion: 'Completaste tu primera misión.', icono: '🎯' },
  { id: 'sin-pistas', nombre: 'Sin ayuda', descripcion: 'Completaste una misión sin abrir ninguna pista.', icono: '🧠' },
  { id: 'cinco-misiones', nombre: 'Constancia', descripcion: 'Cinco misiones completadas.', icono: '🔁' },
  { id: 'quince-misiones', nombre: 'Veteranía', descripcion: 'Quince misiones completadas.', icono: '🏅' },
  { id: 'tres-sistemas', nombre: 'Trilingüe', descripcion: 'Practicaste en Linux, CMD y PowerShell.', icono: '🌍' },
  { id: 'tuberia', nombre: 'Fontanería', descripcion: 'Resolviste una misión combinando comandos con una tubería.', icono: '🔗' },
  { id: 'permisos', nombre: 'Guardián', descripcion: 'Arreglaste unos permisos rotos.', icono: '🔐' },
  { id: 'detective', nombre: 'Detective', descripcion: 'Encontraste el archivo oculto de una investigación.', icono: '🔎' },
  { id: 'sin-errores', nombre: 'Pulso firme', descripcion: 'Completaste una misión sin un solo mensaje de error.', icono: '✨' },
  { id: 'repaso-diario', nombre: 'Memoria fresca', descripcion: 'Completaste una tanda de repaso espaciado.', icono: '🧩' },
  { id: 'juego-completo', nombre: 'Jugador', descripcion: 'Terminaste todos los niveles de un juego.', icono: '🎮' },
];
