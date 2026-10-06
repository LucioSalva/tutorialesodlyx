// Módulo de diagnóstico y soporte (CCST Networking, dominio 5). Las lecciones están en diagnostico-1.mjs y diagnostico-2.mjs.
import parte1 from './diagnostico-1.mjs';
import parte2 from './diagnostico-2.mjs';

export default {
  slug: 'diagnostico', titulo: 'Diagnóstico y soporte', capa: 'CCST · Dominio 5 · Diagnóstico de problemas',
  resumen: 'El método para resolver averías, la mesa de ayuda, ping, traceroute, ipconfig, nslookup, Wireshark, el acceso a los equipos y los comandos show de Cisco.',
  descripcion: 'Cómo encontrar la causa de un problema de red con orden y no a ciegas: el método paso a paso, tickets y prioridades, las herramientas de cada sistema operativo, la lectura de sus salidas línea a línea, capturas con Wireshark y los comandos show. Con casos resueltos y ejercicios que generan salidas de consola reales.',
  examenes: [
    { id: 'basico', nombre: 'Básico', resumen: '10 preguntas de los niveles 1 y 2: método, tickets, ping y traceroute.', niveles: [1, 2], preguntas: 10 },
    { id: 'intermedio', nombre: 'Intermedio', resumen: '10 preguntas de los niveles 3 y 4: configuración IP, DNS, casos completos y Wireshark.', niveles: [3, 4], preguntas: 10 },
    { id: 'avanzado', nombre: 'Avanzado', resumen: '10 preguntas de los niveles 5 y 6: acceso a los equipos, comandos show y escenarios mezclados.', niveles: [5, 6], preguntas: 10 },
    { id: 'completo', nombre: 'Completo', resumen: '18 preguntas, tres de cada nivel.', niveles: [1, 2, 3, 4, 5, 6], preguntas: 18 },
  ],
  lecciones: [...parte1, ...parte2],
};
