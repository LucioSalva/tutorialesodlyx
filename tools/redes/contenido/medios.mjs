// Módulo «Medios y dispositivos finales» (CCST Networking, dominio 3). Lecciones en medios-1.mjs y medios-2.mjs.
import parte1 from './medios-1.mjs';
import parte2 from './medios-2.mjs';

export default {
  slug: 'medios', titulo: 'Medios y dispositivos finales', capa: 'CCST · Dominio 3 · Medios y dispositivos finales',
  resumen: 'Cables de cobre y de fibra, Wi-Fi y redes celulares, los equipos que se conectan a la red y cómo se configura y se comprueba la conexión en Windows, Linux, macOS, Android y iOS.',
  descripcion: 'Por dónde viajan los datos y qué equipos los envían y los reciben: par trenzado y sus categorías, fibra monomodo y multimodo, bandas y canales de Wi-Fi, redes celulares, la tarjeta de red y la dirección MAC, y los comandos de cada sistema operativo. Con casos de soporte resueltos paso a paso y ejercicios que se corrigen solos.',
  examenes: [
    { id: 'basico', nombre: 'Básico', resumen: '10 preguntas de los niveles 1 y 2: par trenzado, categorías, conectores y fibra.', niveles: [1, 2], preguntas: 10 },
    { id: 'intermedio', nombre: 'Intermedio', resumen: '10 preguntas de los niveles 3 y 4: Wi-Fi, redes celulares, elección del medio y direcciones MAC.', niveles: [3, 4], preguntas: 10 },
    { id: 'avanzado', nombre: 'Avanzado', resumen: '10 preguntas de los niveles 5 y 6: comandos de cada sistema, lectura de salidas y casos de soporte.', niveles: [5, 6], preguntas: 10 },
    { id: 'completo', nombre: 'Completo', resumen: '18 preguntas, tres de cada nivel: todo el dominio 3.', niveles: [1, 2, 3, 4, 5, 6], preguntas: 18 },
  ],
  lecciones: [...parte1, ...parte2],
};
