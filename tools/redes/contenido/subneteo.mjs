// Módulo de subneteo IPv4. Las lecciones están en subneteo-1.mjs y subneteo-2.mjs.
import parte1 from './subneteo-1.mjs';
import parte2 from './subneteo-2.mjs';

export default {
  slug: 'subneteo', titulo: 'Subneteo IPv4', capa: 'Capa 3 · Red',
  resumen: 'Direcciones, clases, máscaras y subredes: de convertir un octeto a binario hasta diseñar un campus con VLSM.',
  descripcion: 'De cero a experto: binario, clases, máscara de red y de subred, las fórmulas, el número mágico, VLSM y sumarización. Cada tema se explica bit a bit, con ejemplos resueltos y ejercicios que se corrigen solos.',
  herramientas: true,
  examenes: [
    { id: 'basico', nombre: 'Básico', resumen: '10 preguntas de los niveles 1 y 2: binario, máscaras y redes /24 a /30.', niveles: [1, 2], preguntas: 10 },
    { id: 'intermedio', nombre: 'Intermedio', resumen: '10 preguntas de los niveles 3 y 4: otros octetos, hosts requeridos, división y diagnóstico.', niveles: [3, 4], preguntas: 10 },
    { id: 'avanzado', nombre: 'Avanzado', resumen: '6 preguntas de los niveles 5 y 6: VLSM, rutas resumen y subredes lejanas.', niveles: [5, 6], preguntas: 6 },
    { id: 'completo', nombre: 'Completo', resumen: '12 preguntas, dos de cada nivel, de fundamentos a experto.', niveles: [1, 2, 3, 4, 5, 6], preguntas: 12 },
  ],
  lecciones: [...parte1, ...parte2],
};
