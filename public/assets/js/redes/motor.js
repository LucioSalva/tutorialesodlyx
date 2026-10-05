/**
 * Academia de Redes · Motor de ejercicios
 * ---------------------------------------------------------------------
 * resolver(spec)      → ejercicio completo (enunciado, campos, pistas, pasos)
 * evaluarCampo(c, v)  → ¿lo que escribió el estudiante equivale a la respuesta?
 * generar(mod, n, rng)→ spec nuevo de un nivel (práctica y exámenes)
 *
 * Sin DOM: lo usan el navegador y las pruebas de tools/redes.
 */
import { aEntero } from './ip.js';
import { TIPOS, elegir } from './tipos.js';
import './tipos-vlans.js';

export { TIPOS };

export function resolver(spec) {
  const tipo = TIPOS[spec?.tipo];
  if (!tipo) throw new Error('Tipo de ejercicio desconocido: ' + spec?.tipo);
  return { tipo: tipo.id, nombre: tipo.nombre, ...tipo.resolver(spec) };
}

/** Generador pseudoaleatorio con semilla (mulberry32): mismo número → mismos ejercicios. */
export function azar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const soloDigitos = (v) => String(v ?? '').replace(/[\s,._]/g, '');

/** Comandos: sin distinguir mayúsculas ni espacios repetidos. */
export const normalizarComando = (v) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Nombre de interfaz en forma corta: «GigabitEthernet0/0.20», «gi0/0.20» y «g 0/0.20» → «g0/0.20». */
const interfazCorta = (t) => t.replace(/^(g|f|s|e)[a-z]*\s*(\d[\d/.]*)$/, '$1$2');

/**
 * ¿El comando escrito equivale al esperado? Como en IOS, cada palabra clave se
 * puede abreviar (mínimo 2 letras: «sw mo acc»). Los valores (números, listas
 * y nombres propios, que en el comando esperado van en MAYÚSCULAS) deben ser exactos.
 */
export function coincideComando(esperado, escrito) {
  const original = String(esperado).trim().split(/\s+/);
  const e = normalizarComando(esperado).split(' ');
  const d = normalizarComando(escrito).replace(/\b(g|gi|gig[a-z]*|f|fa|fast[a-z]*)\s+(\d)/g, '$1$2').split(' ');
  if (e.length !== d.length) return false;
  return e.every((palabra, i) => {
    if (palabra === d[i] || interfazCorta(palabra) === interfazCorta(d[i])) return true;
    const esValor = /\d/.test(palabra) || original[i] === original[i].toUpperCase();
    return !esValor && d[i].length >= 2 && palabra.startsWith(d[i]);
  });
}

export function evaluarCampo(campo, escrito) {
  const v = String(escrito ?? '').trim();
  if (v === '') return false;
  switch (campo.tipo) {
    case 'ip': {
      const n = aEntero(v);
      return n !== null && n === aEntero(campo.valor);
    }
    case 'red': {
      const m = /^(.+?)\s*\/\s*(\d{1,2})$/.exec(v);
      const [dir, pre] = String(campo.valor).split('/');
      return !!m && aEntero(m[1]) !== null && aEntero(m[1]) === aEntero(dir) && Number(m[2]) === Number(pre);
    }
    case 'prefijo': {
      const m = /^\/?\s*(\d{1,2})$/.exec(v);
      return !!m && Number(m[1]) === Number(campo.valor);
    }
    case 'numero': {
      const d = soloDigitos(v);
      return /^\d+$/.test(d) && Number(d) === Number(campo.valor);
    }
    case 'binario': {
      const d = soloDigitos(v);
      return /^[01]{1,32}$/.test(d) && parseInt(d, 2) === parseInt(campo.valor, 2);
    }
    case 'opcion':
      return Number(v) === Number(campo.valor);
    case 'comando':
      return [campo.valor, ...(campo.acepta ?? [])].some((x) => coincideComando(x, v));
    default:
      return false;
  }
}

/** Texto legible de la respuesta correcta de un campo. */
export function respuestaDe(campo) {
  if (campo.tipo === 'opcion') return String(campo.opciones[campo.valor]).replace(/\*\*|`/g, '');
  if (campo.tipo === 'prefijo') return '/' + campo.valor;
  if (campo.tipo === 'numero') return String(campo.valor).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return String(campo.valor);
}

/**
 * Niveles por módulo. Cada entrada de `tipos` es [tipo, peso]: el peso es
 * cuántas papeletas tiene ese tipo en el sorteo del nivel.
 */
export const NIVELES = {
  subneteo: [
    { n: 1, nombre: 'Fundamentos', resumen: 'Binario, máscaras, prefijos y clases.',
      tipos: [['dec-bin', 2], ['bin-dec', 2], ['prefijo-mascara', 2], ['mascara-prefijo', 2], ['clase', 1], ['privada', 1]] },
    { n: 2, nombre: 'Básico', resumen: 'Red, broadcast y rango en el cuarto octeto (/24 a /30).',
      tipos: [['analizar', 4], ['hosts-prefijo', 1], ['tipo-direccion', 2], ['wildcard', 1], ['subredes-prestadas', 1]] },
    { n: 3, nombre: 'Intermedio', resumen: 'Tercer octeto (/17 a /23), hosts requeridos y diagnóstico.',
      tipos: [['analizar', 3], ['prefijo-para-hosts', 2], ['misma-subred', 2], ['diagnostico', 2], ['tipo-direccion', 1], ['subredes-prestadas', 1]] },
    { n: 4, nombre: 'Avanzado', resumen: 'Segundo octeto (/9 a /15), división en subredes iguales y solapes.',
      tipos: [['analizar', 2], ['flsm', 3], ['flsm-hosts', 2], ['solapan', 2], ['misma-subred', 1], ['diagnostico', 1], ['wildcard', 1]] },
    { n: 5, nombre: 'Difícil', resumen: 'VLSM, rutas resumen y subredes lejanas.',
      tipos: [['vlsm', 3], ['resumen', 2], ['enesima', 2], ['flsm', 1], ['flsm-hosts', 1]] },
    { n: 6, nombre: 'Experto', resumen: 'VLSM con enlaces WAN, resúmenes no alineados y redes /8 divididas en miles de subredes.',
      tipos: [['vlsm', 3], ['resumen', 2], ['enesima', 2], ['flsm-hosts', 1]] },
  ],
  vlans: [
    { n: 1, nombre: 'Fundamentos', resumen: 'Rangos de ID, puertos de acceso y los primeros comandos.',
      tipos: [['vl-rango', 2], ['vl-difusion', 2], ['vl-comando', 3], ['vl-etiqueta', 1]] },
    { n: 2, nombre: 'Troncales', resumen: 'Etiquetado 802.1Q, VLAN nativa, VLAN permitidas y broadcast con troncales.',
      tipos: [['vl-etiqueta', 3], ['vl-difusion', 3], ['vl-comando', 3]] },
    { n: 3, nombre: 'Alcance en capa 2', resumen: 'Dos switches y un troncal: quién alcanza a quién.',
      tipos: [['vl-alcance', 4], ['vl-comando', 2], ['vl-difusion', 1]] },
    { n: 4, nombre: 'Enrutamiento entre VLAN', resumen: 'Router-on-a-stick: subinterfaces, puertas de enlace y alcance con router.',
      tipos: [['vl-alcance', 3], ['vl-subinterfaz', 3], ['vl-comando', 2]] },
    { n: 5, nombre: 'Diseño', resumen: 'Una subred por VLAN con VLSM y subinterfaces sobre subredes pequeñas.',
      tipos: [['vl-diseno', 3], ['vl-subinterfaz', 2], ['vl-alcance', 2]] },
    { n: 6, nombre: 'Experto', resumen: 'Tres switches en cadena, troncales restringidos y diseños de cinco o seis VLAN.',
      tipos: [['vl-alcance', 3], ['vl-diseno', 3], ['vl-subinterfaz', 1]] },
  ],
};

export function generar(modulo, nivel, rng) {
  const def = (NIVELES[modulo] ?? []).find((x) => x.n === nivel);
  if (!def) throw new Error(`Nivel ${nivel} no existe en ${modulo}`);
  const bolsa = def.tipos.flatMap(([tipo, peso]) => Array(peso).fill(tipo));
  const tipo = elegir(rng, bolsa);
  return { tipo, ...TIPOS[tipo].crear(rng, nivel) };
}
