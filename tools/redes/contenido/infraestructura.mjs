// Módulo de infraestructura (CCST Networking, dominio 4). Las lecciones están en infraestructura-1.mjs y infraestructura-2.mjs.
import parte1 from './infraestructura-1.mjs';
import parte2 from './infraestructura-2.mjs';

export default {
  slug: 'infraestructura', titulo: 'Infraestructura: switches y routers', capa: 'CCST · Dominio 4 · Infraestructura',
  resumen: 'Los equipos que forman la red: qué hace cada uno, sus puertos y luces, cómo decide un switch, cómo decide un router y cómo moverse por Cisco IOS.',
  descripcion: 'Del hub al router: dispositivos y capas, puertos y LED de un equipo Cisco, diagramas y rack, la tabla de direcciones MAC, ARP y la puerta de enlace, la tabla de enrutamiento y los primeros comandos de Cisco IOS. Con recorridos trama a trama, ejemplos resueltos y ejercicios que se corrigen solos.',
  examenes: [
    { id: 'basico', nombre: 'Básico', resumen: '10 preguntas de los niveles 1 y 2: dispositivos, dominios, puertos, luces, PoE y rack.', niveles: [1, 2], preguntas: 10 },
    { id: 'intermedio', nombre: 'Intermedio', resumen: '10 preguntas de los niveles 3 y 4: tabla MAC, ARP y puerta de enlace.', niveles: [3, 4], preguntas: 10 },
    { id: 'avanzado', nombre: 'Avanzado', resumen: '10 preguntas de los niveles 5 y 6: enrutamiento, saltos y Cisco IOS.', niveles: [5, 6], preguntas: 10 },
    { id: 'completo', nombre: 'Completo', resumen: '18 preguntas, tres de cada nivel, de dispositivos a Cisco IOS.', niveles: [1, 2, 3, 4, 5, 6], preguntas: 18 },
  ],
  lecciones: [...parte1, ...parte2],
};
