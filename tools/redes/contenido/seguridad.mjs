// Módulo de seguridad de redes (CCST Networking, dominio 6). Las lecciones están en seguridad-1.mjs y seguridad-2.mjs.
import parte1 from './seguridad-1.mjs';
import parte2 from './seguridad-2.mjs';

export default {
  slug: 'seguridad', titulo: 'Seguridad de redes', capa: 'CCST · Dominio 6 · Seguridad',
  resumen: 'La tríada CIA, las amenazas más comunes, autenticación y MFA, cifrado y certificados, firewalls y la seguridad del Wi-Fi y de los equipos de red.',
  descripcion: 'Seguridad para técnicos de soporte, desde cero: qué se protege y de qué, cómo reconocer un ataque, cómo se demuestra una identidad, cómo se cifra lo que viaja por la red, cómo decide un firewall y cómo dejar bien configurados un router doméstico y un switch. Con casos resueltos paso a paso y preguntas al estilo del examen.',
  examenes: [
    { id: 'basico', nombre: 'Básico', resumen: '10 preguntas de los niveles 1 y 2: tríada CIA, vocabulario de riesgo y tipos de amenazas.', niveles: [1, 2], preguntas: 10 },
    { id: 'intermedio', nombre: 'Intermedio', resumen: '10 preguntas de los niveles 3 y 4: AAA, MFA, contraseñas, cifrado y protocolos seguros.', niveles: [3, 4], preguntas: 10 },
    { id: 'avanzado', nombre: 'Avanzado', resumen: '10 preguntas de los niveles 5 y 6: reglas de firewall, seguridad Wi-Fi y protección de equipos.', niveles: [5, 6], preguntas: 10 },
    { id: 'completo', nombre: 'Completo', resumen: '18 preguntas, tres de cada nivel: todo el dominio de seguridad.', niveles: [1, 2, 3, 4, 5, 6], preguntas: 18 },
  ],
  lecciones: [...parte1, ...parte2],
};
