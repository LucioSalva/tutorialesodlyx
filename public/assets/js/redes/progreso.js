/**
 * Academia de Redes · Progreso (solo en este navegador)
 * ---------------------------------------------------------------------
 * localStorage 'redes:progreso:v1'. Nada sale del equipo. Todo lo leído
 * se valida: si el dato guardado está roto, se empieza de cero sin fallar.
 */
const CLAVE = 'redes:progreso:v1';
const vacio = () => ({ v: 1, lecciones: {}, niveles: {}, examenes: {} });
const entero = (x) => (Number.isInteger(x) && x >= 0 && x < 1e7 ? x : 0);

function leer() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    if (!d || d.v !== 1 || typeof d.lecciones !== 'object' || typeof d.niveles !== 'object' || typeof d.examenes !== 'object') return vacio();
    return d;
  } catch { return vacio(); }
}
function guardar(d) {
  try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch { /* modo privado o cuota llena: se sigue sin guardar */ }
}

/** Índices de ejercicios resueltos de una lección. */
export function resueltos(modulo, leccion) {
  const lista = leer().lecciones[`${modulo}/${leccion}`];
  return Array.isArray(lista) ? lista.filter((x) => Number.isInteger(x) && x >= 0 && x < 500) : [];
}

export function marcarResuelto(modulo, leccion, indice) {
  const d = leer();
  const clave = `${modulo}/${leccion}`;
  const lista = new Set(Array.isArray(d.lecciones[clave]) ? d.lecciones[clave] : []);
  lista.add(indice);
  d.lecciones[clave] = [...lista].sort((a, b) => a - b);
  guardar(d);
  return d.lecciones[clave].length;
}

export function nivel(modulo, n) {
  const x = leer().niveles[`${modulo}:${n}`] ?? {};
  return { ok: entero(x.ok), mal: entero(x.mal), racha: entero(x.racha), mejor: entero(x.mejor) };
}

export function registrarPractica(modulo, n, correcto) {
  const d = leer();
  const x = nivel(modulo, n);
  if (correcto) { x.ok++; x.racha++; x.mejor = Math.max(x.mejor, x.racha); } else { x.mal++; x.racha = 0; }
  d.niveles[`${modulo}:${n}`] = x;
  guardar(d);
  return x;
}

/** Mejor nota (0–100) de un examen, o null. */
export function mejorExamen(modulo, id) {
  const x = leer().examenes[`${modulo}:${id}`];
  return Number.isFinite(x) && x >= 0 && x <= 100 ? x : null;
}

export function registrarExamen(modulo, id, nota) {
  const d = leer();
  const previa = mejorExamen(modulo, id);
  d.examenes[`${modulo}:${id}`] = Math.max(previa ?? 0, Math.round(nota));
  guardar(d);
}
