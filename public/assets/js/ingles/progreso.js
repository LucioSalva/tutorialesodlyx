/**
 * Academia de Inglés · Progreso y repetición espaciada
 * ---------------------------------------------------------------------
 * Todo vive en localStorage de este navegador: el proyecto no tiene cuentas
 * y no se crea un sistema de autenticación solo para este módulo. Mismo
 * criterio que la Academia de Comandos: formato versionado, exportar a
 * archivo, importar validando CAMPO A CAMPO (lo que no encaja se descarta).
 *
 * Métricas honestas: todo lo que se muestra sale de algo que el estudiante
 * hizo de verdad. Nada se estima.
 *
 *   · ejercicio resuelto   = lo respondió bien (con o sin pistas). Si abrió la
 *                            solución antes de acertar, queda como «visto con
 *                            solución», no como resuelto.
 *   · lección completada   = resolvió al menos el 80 % de sus ejercicios
 *                            autocorregibles.
 *   · palabra aprendida    = la recordó bien dos repasos seguidos.
 *   · palabra dominada     = su intervalo de repaso ya es de 21 días o más.
 *   · tiempo de estudio    = segundos con la pestaña visible y actividad en el
 *                            último minuto y medio (sin actividad no cuenta).
 *
 * Repetición espaciada: SM-2 (el algoritmo clásico de SuperMemo) con cuatro
 * botones. Fallar devuelve la tarjeta a los 10 minutos; acertar la aleja
 * 1 día, luego 3–4, y después multiplica por su facilidad, que baja cada vez
 * que cuesta. Así lo difícil vuelve más a menudo que lo fácil.
 */

export const FORMATO = 'academia-ingles-progreso';
export const VERSION = 1;
const CLAVE = 'ingles:progreso:v1';
const DIA = 86400000;

const ahoraISO = () => new Date().toISOString();
const hoyClave = (d = new Date()) => {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

export const VACIO = () => ({
  formato: FORMATO,
  version: VERSION,
  creado: ahoraISO(),
  actualizado: ahoraISO(),
  lecciones: {},     // slug → {vista, completada, fechaCompletada}
  ejercicios: {},    // id → {intentos, resuelto, primera, pistas, solucion, fecha}
  evaluaciones: {},  // id → {intentos, mejor, ultimo, aprobado, fecha, repasar:[]}
  tarjetas: {},      // id → {tipo, rep, ef, intervalo, proximo, ultimo, aciertos, fallos}
  juegos: {},        // slug → {niveles: {id: {superado, mejor, fecha}}}
  practicas: {},     // 'lecturas:slug' → {completada, aciertos, total, fecha}
  tiempo: {},        // 'AAAA-MM-DD' → segundos
  nuevasHoy: {},     // 'AAAA-MM-DD' → nº de tarjetas nuevas introducidas
  ultima: null,      // {url, titulo, tipo, fecha}
  preferencias: { acento: 'us', voz: '', velocidad: 1, traducciones: false, nuevasPorDia: 15 },
});

export class Progreso {
  constructor(almacen = null) {
    this.almacen = almacen ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    this.datos = this._cargar();
    this.oyentes = new Set();
  }

  _cargar() {
    try {
      const crudo = this.almacen?.getItem(CLAVE);
      return crudo ? validar(JSON.parse(crudo)) : VACIO();
    } catch {
      return VACIO();
    }
  }

  guardar() {
    this.datos.actualizado = ahoraISO();
    try { this.almacen?.setItem(CLAVE, JSON.stringify(this.datos)); }
    catch { /* almacenamiento lleno o bloqueado: la sesión sigue funcionando */ }
    this.oyentes.forEach(fn => { try { fn(this.datos); } catch { /* un oyente roto no para a los demás */ } });
  }

  alCambiar(fn) { this.oyentes.add(fn); return () => this.oyentes.delete(fn); }

  // ------------------------------------------------------------ lecciones
  visitar({ url, titulo, tipo, leccion }) {
    if (leccion) {
      const l = this.datos.lecciones[leccion] || { vista: '', completada: false, fechaCompletada: '' };
      l.vista = l.vista || ahoraISO();
      this.datos.lecciones[leccion] = l;
    }
    this.datos.ultima = { url: String(url).slice(0, 300), titulo: String(titulo).slice(0, 160), tipo, fecha: ahoraISO() };
    this.guardar();
  }

  /**
   * Revisa si la lección llega al 80 % de ejercicios resueltos.
   * @returns {boolean} true si ACABA de completarse ahora
   */
  revisarLeccion(slug, idsAutocorregibles) {
    const total = idsAutocorregibles.length;
    if (!total) return false;
    const resueltos = idsAutocorregibles.filter(id => this.datos.ejercicios[id]?.resuelto).length;
    const l = this.datos.lecciones[slug] || { vista: ahoraISO(), completada: false, fechaCompletada: '' };
    if (!l.completada && resueltos / total >= 0.8) {
      l.completada = true;
      l.fechaCompletada = ahoraISO();
      this.datos.lecciones[slug] = l;
      this.guardar();
      return true;
    }
    return false;
  }

  leccion(slug) { return this.datos.lecciones[slug] || null; }

  // ----------------------------------------------------------- ejercicios
  /** Registra un intento. `correcto` null = no autocorregible (no cuenta). */
  intento(id, correcto, { pistas = 0 } = {}) {
    const e = this.datos.ejercicios[id] || { intentos: 0, resuelto: false, primera: false, pistas: 0, solucion: false, fecha: '' };
    if (correcto === null) return e;
    e.intentos++;
    e.pistas = Math.max(e.pistas, pistas);
    if (correcto && !e.resuelto && !e.solucion) {
      e.resuelto = true;
      e.primera = e.intentos === 1 && pistas === 0;
      e.fecha = ahoraISO();
    }
    this.datos.ejercicios[id] = e;
    this.guardar();
    return e;
  }

  verSolucion(id) {
    const e = this.datos.ejercicios[id] || { intentos: 0, resuelto: false, primera: false, pistas: 0, solucion: false, fecha: '' };
    if (!e.resuelto) e.solucion = true;
    this.datos.ejercicios[id] = e;
    this.guardar();
    return e;
  }

  /** Reintentar desde cero un ejercicio visto con solución. */
  reiniciarEjercicio(id) {
    const e = this.datos.ejercicios[id];
    if (e && !e.resuelto) { e.solucion = false; this.guardar(); }
  }

  ejercicio(id) { return this.datos.ejercicios[id] || null; }

  // --------------------------------------------------------- evaluaciones
  registrarEvaluacion(id, { porcentaje, aprobado, repasar = [] }) {
    const x = this.datos.evaluaciones[id] || { intentos: 0, mejor: 0, ultimo: 0, aprobado: false, fecha: '', repasar: [] };
    x.intentos++;
    x.ultimo = Math.round(porcentaje);
    x.mejor = Math.max(x.mejor, x.ultimo);
    x.aprobado = x.aprobado || !!aprobado;
    x.fecha = ahoraISO();
    x.repasar = repasar.slice(0, 30).map(String);
    this.datos.evaluaciones[id] = x;
    this.guardar();
    return x;
  }

  evaluacion(id) { return this.datos.evaluaciones[id] || null; }

  // --------------------------------------------------- prácticas y juegos
  registrarPractica(clave, { aciertos, total }) {
    const p = this.datos.practicas[clave] || { completada: false, aciertos: 0, total: 0, fecha: '' };
    p.completada = true;
    p.aciertos = Math.max(p.aciertos, aciertos);
    p.total = total;
    p.fecha = ahoraISO();
    this.datos.practicas[clave] = p;
    this.guardar();
  }

  registrarNivel(juego, nivel, { superado, puntos }) {
    const j = this.datos.juegos[juego] || { niveles: {} };
    const n = j.niveles[nivel] || { superado: false, mejor: 0, fecha: '' };
    n.superado = n.superado || !!superado;
    n.mejor = Math.max(n.mejor, Math.round(puntos));
    n.fecha = ahoraISO();
    j.niveles[nivel] = n;
    this.datos.juegos[juego] = j;
    this.guardar();
    return n;
  }

  // ---------------------------------------------------------------- tiempo
  sumarTiempo(segundos) {
    const k = hoyClave();
    this.datos.tiempo[k] = (this.datos.tiempo[k] || 0) + segundos;
    this.guardar();
  }

  // -------------------------------------------------- repetición espaciada
  tieneTarjeta(id) { return !!this.datos.tarjetas[id]; }

  /** Mete tarjetas en el mazo (sin duplicar). Devuelve cuántas eran nuevas. */
  anadirTarjetas(ids, tipo) {
    let nuevas = 0;
    for (const id of ids) {
      if (this.datos.tarjetas[id]) continue;
      this.datos.tarjetas[id] = { tipo, rep: 0, ef: 2.5, intervalo: 0, proximo: ahoraISO(), ultimo: '', aciertos: 0, fallos: 0 };
      nuevas++;
    }
    if (nuevas) this.guardar();
    return nuevas;
  }

  quitarTarjetas(ids) {
    ids.forEach(id => delete this.datos.tarjetas[id]);
    this.guardar();
  }

  /**
   * Califica un repaso. nota: 0 = otra vez, 1 = difícil, 2 = bien, 3 = fácil.
   * Devuelve la tarjeta actualizada.
   */
  calificar(id, nota, tipo = 'v', ahora = Date.now()) {
    const t = this.datos.tarjetas[id] || { tipo, rep: 0, ef: 2.5, intervalo: 0, proximo: '', ultimo: '', aciertos: 0, fallos: 0 };
    const nueva = t.rep === 0 && t.aciertos === 0 && t.fallos === 0;
    const r = programar(t, nota);
    Object.assign(t, r.tarjeta);
    t.ultimo = new Date(ahora).toISOString();
    t.proximo = new Date(ahora + r.espera).toISOString();
    this.datos.tarjetas[id] = t;
    if (nueva) {
      const k = hoyClave(new Date(ahora));
      this.datos.nuevasHoy = { [k]: (this.datos.nuevasHoy[k] || 0) + 1 };
    }
    this.guardar();
    return t;
  }

  /** Tarjetas que tocan ahora: primero las más difíciles y las más atrasadas. */
  pendientes({ tipo = null, ahora = Date.now(), limite = 50 } = {}) {
    return Object.entries(this.datos.tarjetas)
      .filter(([, t]) => (!tipo || t.tipo === tipo) && (t.aciertos + t.fallos > 0) && new Date(t.proximo).getTime() <= ahora)
      .sort((a, b) => (a[1].ef - b[1].ef) || (new Date(a[1].proximo) - new Date(b[1].proximo)))
      .slice(0, limite)
      .map(([id, t]) => ({ id, ...t }));
  }

  /** Tarjetas del mazo que nunca se han repasado. */
  sinEstudiar({ tipo = null } = {}) {
    return Object.entries(this.datos.tarjetas)
      .filter(([, t]) => (!tipo || t.tipo === tipo) && t.aciertos + t.fallos === 0)
      .map(([id, t]) => ({ id, ...t }));
  }

  nuevasPermitidasHoy() {
    const hechas = this.datos.nuevasHoy[hoyClave()] || 0;
    return Math.max(0, (this.datos.preferencias.nuevasPorDia || 15) - hechas);
  }

  dificiles(limite = 15) {
    return Object.entries(this.datos.tarjetas)
      .filter(([, t]) => t.fallos > 0)
      .sort((a, b) => (b[1].fallos / (b[1].aciertos + 1)) - (a[1].fallos / (a[1].aciertos + 1)))
      .slice(0, limite)
      .map(([id, t]) => ({ id, ...t }));
  }

  // --------------------------------------------------------------- resumen
  resumen() {
    const d = this.datos;
    const tarjetas = Object.values(d.tarjetas);
    const vocab = tarjetas.filter(t => t.tipo === 'v');
    const segundos = Object.values(d.tiempo).reduce((s, x) => s + x, 0);
    const evals = Object.entries(d.evaluaciones);
    return {
      leccionesVistas: Object.values(d.lecciones).filter(l => l.vista).length,
      leccionesCompletadas: Object.values(d.lecciones).filter(l => l.completada).length,
      ejerciciosResueltos: Object.values(d.ejercicios).filter(e => e.resuelto).length,
      ejerciciosPrimera: Object.values(d.ejercicios).filter(e => e.primera).length,
      ejerciciosConSolucion: Object.values(d.ejercicios).filter(e => e.solucion && !e.resuelto).length,
      palabrasEnRepaso: vocab.length,
      palabrasAprendidas: vocab.filter(t => t.rep >= 2).length,
      palabrasDominadas: vocab.filter(t => t.intervalo >= 21).length,
      gramaticaEnRepaso: tarjetas.filter(t => t.tipo === 'g').length,
      repasosPendientes: this.pendientes({ limite: 9999 }).length,
      evaluaciones: evals.length,
      evaluacionesAprobadas: evals.filter(([, x]) => x.aprobado).length,
      nivelesSuperados: Object.values(d.juegos).reduce((s, j) => s + Object.values(j.niveles).filter(n => n.superado).length, 0),
      practicas: Object.values(d.practicas).filter(p => p.completada).length,
      segundos,
      segundosHoy: d.tiempo[hoyClave()] || 0,
      diasEstudiados: Object.values(d.tiempo).filter(s => s >= 60).length,
    };
  }

  // ---------------------------------------------------- exportar/importar
  exportar() {
    return JSON.stringify({ ...this.datos, exportado: ahoraISO() }, null, 2);
  }

  /** Nunca lanza y nunca ejecuta nada del archivo. */
  importar(texto, { fusionar = true } = {}) {
    if (typeof texto !== 'string' || texto.length > 5_000_000) return { ok: false, mensaje: 'El archivo es demasiado grande para ser un progreso.' };
    let crudo;
    try { crudo = JSON.parse(texto); } catch { return { ok: false, mensaje: 'El archivo no es un JSON válido.' }; }
    if (!crudo || crudo.formato !== FORMATO) return { ok: false, mensaje: 'Ese archivo no es un progreso de la Academia de Inglés.' };
    if (typeof crudo.version !== 'number' || crudo.version > VERSION) {
      return { ok: false, mensaje: `El archivo usa la versión ${crudo.version} del formato y esta academia entiende hasta la ${VERSION}.` };
    }
    const limpio = validar(crudo);
    if (!fusionar) {
      this.datos = limpio;
    } else {
      for (const grupo of ['lecciones', 'ejercicios', 'evaluaciones', 'tarjetas', 'juegos', 'practicas']) {
        this.datos[grupo] = { ...this.datos[grupo], ...limpio[grupo] };
      }
      for (const [dia, s] of Object.entries(limpio.tiempo)) {
        this.datos.tiempo[dia] = Math.max(this.datos.tiempo[dia] || 0, s);
      }
      this.datos.preferencias = limpio.preferencias;
    }
    this.guardar();
    return {
      ok: true,
      mensaje: `Progreso importado: ${Object.keys(limpio.lecciones).length} lecciones, ${Object.keys(limpio.ejercicios).length} ejercicios y ${Object.keys(limpio.tarjetas).length} tarjetas.`,
    };
  }

  borrarTodo() {
    this.datos = VACIO();
    this.guardar();
  }
}

/**
 * SM-2 con cuatro notas. Puro: se prueba sin navegador.
 * @returns {{tarjeta: object, espera: number}} espera en milisegundos
 */
export function programar(t, nota) {
  const q = [1, 3, 4, 5][Math.max(0, Math.min(3, nota))];
  const salida = { ...t };
  let espera;
  if (q < 3) {
    salida.rep = 0;
    salida.intervalo = 0;
    salida.fallos = (t.fallos || 0) + 1;
    espera = 10 * 60 * 1000; // vuelve en 10 minutos, dentro de la misma sesión
  } else {
    salida.rep = (t.rep || 0) + 1;
    salida.aciertos = (t.aciertos || 0) + 1;
    if (salida.rep === 1) salida.intervalo = q === 5 ? 3 : 1;
    else if (salida.rep === 2) salida.intervalo = q === 3 ? 2 : (q === 5 ? 6 : 4);
    else salida.intervalo = Math.max(1, Math.round((t.intervalo || 1) * (q === 3 ? 1.2 : t.ef || 2.5) * (q === 5 ? 1.3 : 1)));
    salida.intervalo = Math.min(salida.intervalo, 365);
    espera = salida.intervalo * DIA;
  }
  salida.ef = Math.max(1.3, Math.min(3.0, (t.ef || 2.5) + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))));
  return { tarjeta: salida, espera };
}

/** Copia solo lo que encaja con el esquema. */
export function validar(entrada) {
  const base = VACIO();
  if (!entrada || typeof entrada !== 'object') return base;
  const num = (v, min = 0, max = 1e9, def = 0) => (typeof v === 'number' && isFinite(v) ? Math.min(Math.max(v, min), max) : def);
  const txt = (v, max = 40) => (typeof v === 'string' ? v.slice(0, max) : '');
  const bool = (v) => v === true;
  const fecha = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(v) ? v : '');
  const mapa = (origen, limite, patron, formar) => {
    const salida = {};
    if (!origen || typeof origen !== 'object' || Array.isArray(origen)) return salida;
    for (const [k, v] of Object.entries(origen).slice(0, limite)) {
      if (!patron.test(k) || !v || typeof v !== 'object') continue;
      salida[k] = formar(v);
    }
    return salida;
  };
  const ID = /^[a-z0-9][a-z0-9._:-]{0,120}$/;

  base.creado = fecha(entrada.creado) || base.creado;
  base.lecciones = mapa(entrada.lecciones, 1000, ID, v => ({ vista: fecha(v.vista), completada: bool(v.completada), fechaCompletada: fecha(v.fechaCompletada) }));
  base.ejercicios = mapa(entrada.ejercicios, 20000, ID, v => ({
    intentos: num(v.intentos, 0, 1e6), resuelto: bool(v.resuelto), primera: bool(v.primera),
    pistas: num(v.pistas, 0, 3), solucion: bool(v.solucion), fecha: fecha(v.fecha),
  }));
  base.evaluaciones = mapa(entrada.evaluaciones, 500, ID, v => ({
    intentos: num(v.intentos, 0, 1e6), mejor: num(v.mejor, 0, 100), ultimo: num(v.ultimo, 0, 100),
    aprobado: bool(v.aprobado), fecha: fecha(v.fecha),
    repasar: Array.isArray(v.repasar) ? v.repasar.filter(x => typeof x === 'string' && ID.test(x)).slice(0, 30) : [],
  }));
  base.tarjetas = mapa(entrada.tarjetas, 20000, ID, v => ({
    tipo: v.tipo === 'g' ? 'g' : 'v', rep: num(v.rep, 0, 1000), ef: num(v.ef, 1.3, 3.0, 2.5),
    intervalo: num(v.intervalo, 0, 365), proximo: fecha(v.proximo) || ahoraISO(), ultimo: fecha(v.ultimo),
    aciertos: num(v.aciertos, 0, 1e6), fallos: num(v.fallos, 0, 1e6),
  }));
  base.juegos = mapa(entrada.juegos, 100, ID, v => ({
    niveles: mapa(v.niveles, 100, /^[a-z0-9_-]{1,32}$/i, n => ({ superado: bool(n.superado), mejor: num(n.mejor, 0, 1e7), fecha: fecha(n.fecha) })),
  }));
  base.practicas = mapa(entrada.practicas, 2000, ID, v => ({
    completada: bool(v.completada), aciertos: num(v.aciertos, 0, 1000), total: num(v.total, 0, 1000), fecha: fecha(v.fecha),
  }));
  if (entrada.tiempo && typeof entrada.tiempo === 'object') {
    for (const [dia, s] of Object.entries(entrada.tiempo).slice(0, 5000)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dia)) base.tiempo[dia] = num(s, 0, 86400);
    }
  }
  if (entrada.ultima && typeof entrada.ultima === 'object') {
    const u = entrada.ultima;
    // Solo rutas internas de la academia: nada de enlaces a otros sitios.
    // Solo rutas internas de este sitio: «//otro-servidor/ingles» o «/a//b» se rechazan.
    const ruta = typeof u.url === 'string' ? u.url.replace(/^https?:\/\/[^/]+/, '') : '';
    const url = /^\/[a-z0-9_-]+(\/[a-z0-9_-]+)*$/i.test(ruta) && /\/ingles(\/|$)/.test(ruta) ? ruta : '';
    base.ultima = url ? { url, titulo: txt(u.titulo, 160), tipo: txt(u.tipo, 20), fecha: fecha(u.fecha) } : null;
  }
  const p = entrada.preferencias || {};
  base.preferencias = {
    acento: p.acento === 'gb' ? 'gb' : 'us',
    voz: txt(p.voz, 120),
    velocidad: num(p.velocidad, 0.5, 1.3, 1),
    traducciones: bool(p.traducciones),
    nuevasPorDia: num(p.nuevasPorDia, 0, 100, 15),
  };
  return base;
}
