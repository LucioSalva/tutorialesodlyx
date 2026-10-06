// Módulo «NAT, DHCP e IPv6» (CCST Networking, dominio 2). Las lecciones están en direccionamiento-1.mjs y direccionamiento-2.mjs.
import parte1 from './direccionamiento-1.mjs';
import parte2 from './direccionamiento-2.mjs';

export default {
  slug: 'direccionamiento', titulo: 'NAT, DHCP e IPv6', capa: 'CCST · Dominio 2 · Direccionamiento',
  resumen: 'Direcciones públicas y privadas, NAT y PAT, DHCP y todo IPv6: hexadecimal, abreviar y expandir, tipos de dirección, prefijos, subredes y EUI-64.',
  descripcion: 'Lo que le falta al subneteo para completar el dominio de direccionamiento del examen: por qué tu red usa direcciones privadas y cómo sale a Internet con NAT, cómo recibe un equipo su configuración por DHCP y qué significa una dirección 169.254, y IPv6 desde cero, con cada cuenta explicada dígito a dígito.',
  examenes: [
    { id: 'basico', nombre: 'Básico', resumen: '10 preguntas de los niveles 1 y 2: direcciones públicas, privadas y especiales, NAT y DHCP.', niveles: [1, 2], preguntas: 10 },
    { id: 'intermedio', nombre: 'Intermedio', resumen: '10 preguntas de los niveles 3 y 4: hexadecimal, abreviar y expandir, tipos de dirección y prefijos IPv6.', niveles: [3, 4], preguntas: 10 },
    { id: 'avanzado', nombre: 'Avanzado', resumen: '8 preguntas de los niveles 5 y 6: subredes IPv6, EUI-64 y prefijos que parten un hexteto.', niveles: [5, 6], preguntas: 8 },
    { id: 'completo', nombre: 'Completo', resumen: '12 preguntas, dos de cada nivel, de IPv4 privada a subredes IPv6.', niveles: [1, 2, 3, 4, 5, 6], preguntas: 12 },
  ],
  lecciones: [...parte1, ...parte2],
};
