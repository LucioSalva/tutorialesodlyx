// Módulo «Fundamentos de redes» (CCST Networking, dominio 1). Las lecciones están en fundamentos-1.mjs y fundamentos-2.mjs.
import parte1 from './fundamentos-1.mjs';
import parte2 from './fundamentos-2.mjs';

export default {
  slug: 'fundamentos', titulo: 'Fundamentos de redes', capa: 'CCST · Dominio 1 · Estándares y conceptos',
  resumen: 'Qué es una red, los modelos OSI y TCP/IP, la encapsulación, el rendimiento de un enlace, TCP y UDP, los protocolos de aplicación y la nube.',
  descripcion: 'El punto de partida del curso: de qué está hecha una red, cómo se reparte el trabajo en capas, cómo viaja un dato de un equipo a otro, qué significan ancho de banda y latencia, cómo funcionan TCP y UDP y para qué sirve cada protocolo. Con analogías, ejemplos resueltos y preguntas al estilo del examen CCST.',
  examenes: [
    { id: 'basico', nombre: 'Básico', resumen: '10 preguntas de los niveles 1 y 2: tipos de red, topologías y modelos de capas.', niveles: [1, 2], preguntas: 10 },
    { id: 'intermedio', nombre: 'Intermedio', resumen: '10 preguntas de los niveles 3 y 4: encapsulación, direcciones en cada salto y rendimiento.', niveles: [3, 4], preguntas: 10 },
    { id: 'avanzado', nombre: 'Avanzado', resumen: '10 preguntas de los niveles 5 y 6: TCP y UDP, puertos, protocolos de aplicación y nube.', niveles: [5, 6], preguntas: 10 },
    { id: 'completo', nombre: 'Completo', resumen: '18 preguntas, tres de cada nivel: todo el dominio 1 del examen.', niveles: [1, 2, 3, 4, 5, 6], preguntas: 18 },
  ],
  lecciones: [...parte1, ...parte2],
};
