// Diagnóstico y soporte · lecciones 1 a 4: método, mesa de ayuda, ping/traceroute y configuración IP/DNS.
import { h, h3, p, lista, orden, tabla, nota, codigo, ejemplo, ejercicios, op, vs, rel, ord } from './_ayuda.mjs';

export const ping = (fallo, propia = '192.168.1.25', gw = '192.168.1.1', remota = '203.0.113.10', nombre = 'www.example.com') => ({ tipo: 'dx-ping', fallo, propia, gw, remota, nombre });
export const cfg = (ip, pr, gw, dns, dhcp = true) => ({ tipo: 'dx-config', ip, p: pr, gw, dns, dhcp });
export const tr = (caso, k = 0, destino = '203.0.113.80', saltos = ['192.168.1.1', '10.255.0.1', '198.51.100.1', '192.0.2.65', '203.0.113.1']) => ({ tipo: 'dx-traceroute', caso, k, destino, saltos });
export const cmd = (caso, destino = '192.168.1.1', nombre = 'www.example.com') => ({ tipo: 'dx-comando', caso, destino, nombre });
export const sh = (caso, iface = 'g0/1') => ({ tipo: 'dx-show', caso, iface });
export const ifz = (estado, iface = 'GigabitEthernet0/0', ip = '192.168.1.1') => ({ tipo: 'dx-interfaz', estado, iface, ip });
export const pri = (impacto, urgencia, a = 0, b = 0) => ({ tipo: 'dx-prioridad', impacto, urgencia, a, b });
export const acc = (caso) => ({ tipo: 'dx-acceso', caso });
export const fil = (caso, host = '192.168.1.10', puerto = 443) => ({ tipo: 'dx-filtro', caso, host, puerto });

export default [
  /* ------------------------------------------------------------------ 1 */
  {
    slug: 'metodologia-de-diagnostico',
    titulo: 'El método de diagnóstico: resolver problemas con orden',
    resumen: 'Los pasos del diagnóstico estructurado, los enfoques ascendente, descendente y divide y vencerás, y cómo hacer buenas preguntas al usuario.',
    nivel: 'facil',
    objetivos: [
      'Enumerar en orden los pasos del método estructurado de diagnóstico.',
      'Elegir el enfoque adecuado (ascendente, descendente, divide y vencerás, seguir la ruta, sustitución o comparación) según el síntoma.',
      'Distinguir preguntas abiertas y cerradas y saber cuándo usar cada una.',
      'Explicar por qué se cambia una sola cosa a la vez y por qué se documenta.',
    ],
    bloques: [
      h('Por qué hace falta un método'),
      p(`Imagina que tu coche no arranca. Puedes empezar a cambiar piezas al azar (la batería, las bujías, el motor de arranque) hasta que funcione. Tal vez aciertes, pero habrás gastado tiempo y dinero, y no sabrás cuál de los cambios lo arregló. Un buen mecánico hace otra cosa: **pregunta, observa, descarta y prueba una sola idea cada vez**.

En redes pasa lo mismo. Cuando alguien dice «no tengo Internet», la causa puede ser un cable suelto, una dirección IP mal puesta, un servidor DNS caído o un firewall. Probar cosas al azar se llama **disparar a ciegas**, y tiene tres defectos: tarda más, puede crear averías nuevas, y no deja nada aprendido para la próxima vez.`),
      nota('clave', `Diagnosticar no es «saber la respuesta». Es **seguir un procedimiento que te lleva a la respuesta** aunque nunca hayas visto ese problema. Por eso el examen pregunta por el método: es lo que distingue a un técnico de alguien que prueba cosas.`),

      h('Los pasos del método estructurado'),
      p(`El método que enseña Cisco tiene siete pasos, y al terminar se documenta. Apréndelos en orden: es una de las preguntas de «ordenar» más frecuentes.`),
      tabla(['Paso', 'Qué se hace', 'Ejemplo con «no puedo imprimir»'], [
        ['1. Definir el problema', 'Entender exactamente qué falla y qué no. Hablar con el usuario.', '«No imprime nadie del piso 2 desde las 9:00; el piso 1 sí imprime.»'],
        ['2. Reunir información', 'Recoger datos: mensajes de error, comandos, registros, cambios recientes.', 'Ping a la impresora: no responde. Luces del puerto del switch: apagadas.'],
        ['3. Analizar la información', 'Comparar los datos con cómo debería funcionar la red.', 'La impresora tendría que responder al ping y el puerto tendría que estar encendido.'],
        ['4. Descartar causas posibles', 'Tachar lo que los datos demuestran que funciona.', 'El piso 1 imprime: el servidor de impresión y la impresora del piso 1 están bien.'],
        ['5. Proponer una hipótesis', 'Elegir la causa más probable de las que quedan.', '«El cable de la impresora del piso 2 está desconectado.»'],
        ['6. Probar la hipótesis', 'Hacer UN cambio para comprobarla. Si no funciona, deshacerlo y volver al paso 5.', 'Se revisa el cable: estaba suelto. Se conecta.'],
        ['7. Resolver el problema', 'Confirmar con el usuario que todo funciona de verdad.', 'El piso 2 imprime una página de prueba.'],
        ['Documentar', 'Escribir el síntoma, la causa y la solución en el ticket.', '«Cable de red de la impresora P2 desconectado tras la limpieza. Reconectado.»'],
      ], 'Otros organismos (como CompTIA) numeran los pasos de otra forma, pero la idea es idéntica: entender → reunir datos → hipótesis → probar → verificar → documentar.'),
      nota('error', `El error más común es **saltar directo al paso 6**: empezar a cambiar cosas sin haber definido el problema ni reunido información. El segundo más común es **olvidar el final**: dar el caso por cerrado sin confirmarlo con el usuario y sin documentarlo.`),
      ejemplo('facil', 'Poner los pasos en orden', ord('Ordena los pasos del método estructurado de diagnóstico, del primero al último.',
        ['Definir el problema', 'Reunir información', 'Analizar la información', 'Descartar causas posibles', 'Proponer una hipótesis', 'Probar la hipótesis', 'Resolver el problema y documentar'],
        ['Primero hay que **entender** qué pasa: definir el problema y reunir información. Nada de tocar todavía.',
          'Después se **piensa**: se analiza la información, se descartan las causas que los datos ya desmienten y se propone la hipótesis más probable.',
          'Solo entonces se **actúa**: se prueba la hipótesis, se resuelve el problema y se documenta. Entender → pensar → actuar.'])),
      ejemplo('facil', '¿En qué paso estás?', op('Un técnico recibe la queja «la red va lenta». Antes de tocar nada pregunta: «¿Le pasa con todas las páginas o con una sola? ¿Desde cuándo? ¿Le pasa también a sus compañeros?». ¿Qué paso del método está aplicando?',
        ['Definir el problema', 'Probar la hipótesis', 'Descartar causas posibles', 'Documentar la solución'], 0,
        ['«La red va lenta» es una queja, no un problema definido: no dice qué falla, ni a quién, ni desde cuándo.',
          'Las preguntas del técnico convierten la queja en algo preciso («solo esa página, desde ayer, a todo el departamento»). Eso es **definir el problema**, el paso 1.',
          'No está probando una hipótesis porque todavía no tiene ninguna, y no puede descartar causas sin haber reunido datos.'])),

      h('Definir bien el problema: el arte de preguntar'),
      p(`El usuario rara vez describe el problema con precisión. Dice «no funciona nada» cuando solo falla una página. Tu trabajo es **traducir** su queja a hechos. Para eso hay dos tipos de preguntas:`),
      tabla(['Tipo', 'Cómo es', 'Para qué sirve', 'Ejemplos'], [
        ['**Abierta**', 'No se puede contestar con «sí» o «no». Invita a explicar.', 'Al principio: para que el usuario cuente lo que pasó con sus palabras.', '«¿Qué estaba haciendo cuando falló?» · «¿Qué ve en la pantalla?»'],
        ['**Cerrada**', 'Se contesta con «sí», «no» o un dato concreto.', 'Después: para confirmar detalles y acotar.', '«¿Le aparece algún mensaje de error?» · «¿El cable está conectado?»'],
      ]),
      p(`Hay cinco preguntas que casi siempre aclaran el caso:`),
      lista(
        '**¿Qué** falla exactamente, y qué sí funciona?',
        '**¿A quién** le pasa: solo a usted, a su área, a todos?',
        '**¿Desde cuándo?** ¿Alguna vez funcionó?',
        '**¿Qué cambió** justo antes? (un equipo nuevo, una actualización, una mudanza de escritorio)',
        '**¿Se puede repetir?** ¿Pasa siempre o a ratos?',
      ),
      nota('truco', `La pregunta más rentable es **«¿qué cambió?»**. La mayoría de las averías aparecen justo después de un cambio: una actualización, un cable movido, una configuración nueva. Si algo funcionaba ayer y hoy no, busca qué es distinto.`),
      ejemplo('facil', 'Abierta o cerrada', op('¿Cuál de estas es una pregunta ABIERTA?',
        ['¿Tiene conectado el cable de red?', '¿Puede describirme qué pasa cuando intenta abrir el correo?', '¿Ya reinició el equipo?', '¿El problema empezó hoy?'], 1,
        ['Una pregunta cerrada se contesta con «sí», «no» o un dato corto. «¿Tiene conectado el cable?», «¿Ya reinició?» y «¿Empezó hoy?» son cerradas.',
          '«¿Puede describirme qué pasa…?» no admite un «sí» o un «no»: obliga al usuario a explicar. Es **abierta**.',
          'Se empieza con preguntas abiertas para tener el panorama y se termina con cerradas para confirmar los detalles.'])),

      h('Los enfoques: por dónde empezar a buscar'),
      p(`Con el problema definido, hay que decidir **por dónde empezar a revisar**. Los enfoques se apoyan en las capas del modelo OSI: cada capa depende de la de abajo, así que si una capa falla, todas las de arriba fallan también.`),
      tabla(['Enfoque', 'Cómo funciona', 'Cuándo conviene'], [
        ['**Ascendente** (bottom-up)', 'Empieza en la capa física (cables, luces) y sube.', 'Cuando sospechas de algo físico: no hay luz de enlace, equipo recién movido, «no funciona nada».'],
        ['**Descendente** (top-down)', 'Empieza en la aplicación y baja.', 'Cuando falla una sola aplicación y lo demás funciona.'],
        ['**Divide y vencerás**', 'Empieza en una capa intermedia (normalmente con un ping, capa 3). Si funciona, el fallo está arriba; si no, abajo.', 'Cuando no hay pistas claras. Es el más usado: una sola prueba descarta medio modelo.'],
        ['**Seguir la ruta**', 'Recorre el camino del paquete, salto a salto, de origen a destino.', 'Cuando el fallo está en algún punto del trayecto. Se combina con traceroute.'],
        ['**Sustitución**', 'Cambia la pieza sospechosa por otra que sabes que funciona.', 'Con hardware barato de cambiar: un cable, un adaptador, un puerto.'],
        ['**Comparación**', 'Compara el equipo que falla con uno igual que funciona.', 'Cuando hay un equipo «gemelo» sano: se buscan las diferencias de configuración.'],
      ]),
      nota('clave', `**Divide y vencerás con un ping** es la jugada estrella. Si el ping al destino **funciona**, las capas 1, 2 y 3 están bien: el problema está arriba (transporte o aplicación). Si **falla**, el problema está en la capa 3 o por debajo. Una sola prueba y ya sabes hacia dónde mirar.`),
      ejemplo('medio', 'Elegir el enfoque: solo falla una aplicación', op('Una usuaria navega por Internet, recibe correo y usa el chat sin problemas, pero el programa de nóminas no logra conectar con su servidor. ¿Qué enfoque es el más eficiente para empezar?',
        ['Ascendente: revisar primero el cable de red y las luces del puerto', 'Descendente: empezar por la aplicación de nóminas y su configuración', 'Sustitución: cambiar la tarjeta de red del equipo', 'Sustitución: reemplazar el switch del piso'], 1,
        ['Navegación, correo y chat funcionan. Eso demuestra que el cable, la tarjeta, la dirección IP, la puerta de enlace y el DNS están bien: las capas bajas quedan descartadas.',
          'Empezar por el cable (ascendente) sería revisar justo lo que ya sabemos que funciona.',
          'Lo único que falla es una aplicación. Lo eficiente es empezar arriba, por la aplicación (su configuración, el servidor al que apunta, el puerto), y bajar solo si hace falta: enfoque **descendente**.'])),
      ejemplo('medio', 'Elegir el enfoque: no hay luz de enlace', op('Tras una mudanza de escritorios, una computadora no tiene red y el LED del puerto de red está apagado. ¿Qué enfoque corresponde?',
        ['Descendente, empezando por el navegador', 'Ascendente, empezando por el cable y el puerto', 'Comparación de la configuración del navegador con la de otro equipo', 'Seguir la ruta con un traceroute a Internet'], 1,
        ['Hay dos pistas físicas: hubo una mudanza (se movieron cables) y el LED de enlace está apagado (no hay señal eléctrica).',
          'Sin enlace físico no puede funcionar nada de lo que está encima. Revisar el navegador o lanzar un traceroute no aporta nada: fallarán seguro.',
          'Se empieza abajo, por la capa 1: ¿el cable está conectado en los dos extremos?, ¿está en el puerto correcto?, ¿funciona con otro cable? Enfoque **ascendente**.'])),
      ejemplo('medio', 'Divide y vencerás', op('Un usuario no puede abrir la página de la intranet. Sin más pistas, el técnico hace un ping a la dirección IP del servidor de la intranet y **responde**. ¿Qué conclusión es correcta?',
        ['El problema está en el cable del usuario', 'Las capas 1 a 3 funcionan: hay que revisar de la capa de transporte hacia arriba (puerto, servicio web, DNS, navegador)', 'El servidor está apagado', 'La dirección IP del usuario está duplicada'], 1,
        ['Un ping que responde demuestra que el paquete fue y volvió: hay enlace físico (capa 1), tramas (capa 2) y enrutamiento IP (capa 3) entre los dos equipos.',
          'Por eso quedan descartados el cable, el servidor apagado y un problema de direccionamiento.',
          'Lo que queda por revisar está arriba: ¿el servicio web está en marcha?, ¿un firewall bloquea el puerto 80/443?, ¿el nombre de la intranet se resuelve bien?, ¿el navegador tiene un proxy mal configurado?'])),
      ejemplo('dificil', 'Sustitución y comparación', op('Dos computadoras idénticas están en la misma mesa, conectadas al mismo switch. Una tiene red y la otra no. El técnico intercambia los cables de red entre las dos y ahora falla la que antes funcionaba. ¿Qué demuestra y qué enfoque usó?',
        ['Que la tarjeta de red de la primera está dañada; usó el enfoque descendente', 'Que el fallo viaja con el cable (o con el puerto del switch al que va): usó sustitución', 'Que el servidor DHCP está caído; usó divide y vencerás', 'Que el sistema operativo está dañado; usó comparación'], 1,
        ['Al intercambiar los cables, el fallo **se movió** de una computadora a la otra. El fallo va con el cable, no con la computadora.',
          'Así quedan descartados las dos tarjetas de red, los dos sistemas operativos y el servidor DHCP (una de las dos siempre funciona).',
          'Cambiar una pieza por otra que se sabe buena es el enfoque de **sustitución**. Falta un paso para afinar: probar ese cable en otro puerto del switch, para saber si el malo es el cable o el puerto.'])),

      h('Un cambio a la vez'),
      p(`Cuando pruebas una hipótesis, **cambia una sola cosa** y comprueba el resultado. Si cambias tres cosas a la vez y el problema desaparece, no sabrás cuál de las tres era la causa; y si el problema empeora, no sabrás cuál lo empeoró.

Y la segunda mitad de la regla: **si el cambio no arregla nada, deshazlo** antes de probar otra cosa. Si no, vas dejando la red llena de cambios a medias y acabas con dos averías en vez de una.`),
      orden(
        'Anota cómo estaba antes (o guarda una copia de la configuración).',
        'Haz **un** cambio.',
        'Comprueba si el síntoma desapareció.',
        'Si no, **revierte** el cambio y vuelve a pensar otra hipótesis.',
      ),

      h('Cuándo escalar'),
      p(`Escalar es pasar el caso a alguien con más conocimientos o más permisos. No es rendirse: es parte del método. Se escala cuando el problema está fuera de lo que puedes o debes tocar, cuando se agota el tiempo que marca la política, o cuando hay riesgo de seguridad. Al escalar, **entrega todo lo que ya averiguaste**: qué síntoma hay, qué probaste y qué resultados obtuviste, para que la siguiente persona no empiece de cero.`),

      h('Resumen'),
      lista(
        'Pasos: **definir → reunir información → analizar → descartar → hipótesis → probar → resolver**, y al final **documentar**.',
        'Preguntas **abiertas** para empezar, **cerradas** para confirmar. La mejor: «¿qué cambió?».',
        'Enfoques: **ascendente** (sospecha física), **descendente** (una sola aplicación), **divide y vencerás** (sin pistas: un ping), **seguir la ruta**, **sustitución** y **comparación**.',
        '**Un cambio a la vez**, y lo que no arregla se deshace.',
        'Escalar con toda la información reunida es parte del trabajo bien hecho.',
      ),

      ejercicios('Practica', 'De fácil a difícil. Lee cada escenario buscando las pistas: qué funciona, qué no y qué cambió.', [
        ord('Ordena estos pasos del método de diagnóstico.', ['Definir el problema', 'Reunir información', 'Proponer una hipótesis', 'Probar la hipótesis', 'Documentar la solución'], 'Primero se entiende y se reúnen datos; después se piensa una causa probable y se prueba; al final se documenta lo ocurrido.'),
        op('¿Cuál es el PRIMER paso del método estructurado de diagnóstico?', ['Probar la hipótesis', 'Definir el problema', 'Reiniciar el equipo', 'Documentar la solución'], 1, 'Sin saber exactamente qué falla no se puede buscar la causa. Reiniciar «por si acaso» es disparar a ciegas, y documentar es lo último.'),
        op('¿Cuál es el ÚLTIMO paso, el que más se olvida?', ['Proponer una hipótesis', 'Reunir información', 'Documentar el problema y su solución', 'Descartar causas'], 2, 'Tras confirmar con el usuario que todo funciona, se documenta: así el siguiente técnico (o tú mismo dentro de seis meses) resuelve lo mismo en minutos.'),
        op('¿Cuál de estas es una pregunta CERRADA?', ['¿Qué estaba haciendo cuando apareció el error?', '¿Cómo es su conexión habitualmente?', '¿La luz del router está encendida?', '¿Qué ha notado diferente esta semana?'], 2, 'Se contesta con «sí» o «no». Las otras tres obligan al usuario a explicar: son abiertas.'),
        op('Un usuario dice «no funciona nada». ¿Qué conviene preguntar primero?', ['Una pregunta abierta, como «¿qué intentó hacer y qué pasó?»', 'Una pregunta cerrada sobre la versión del sistema operativo', 'Nada: se reinicia el router directamente', 'Su contraseña, para probar con su cuenta'], 0, 'Al principio se necesita el panorama: una pregunta abierta deja que el usuario lo cuente. Nunca se pide la contraseña a un usuario.'),
        op('¿Qué enfoque empieza revisando cables y luces de enlace y va subiendo por las capas?', ['Descendente', 'Ascendente', 'Comparación', 'Seguir la ruta'], 1, 'Ascendente (bottom-up): desde la capa física hacia la de aplicación.'),
        op('¿Qué enfoque empieza con una prueba en una capa intermedia, como un ping, para decidir si se sigue hacia arriba o hacia abajo?', ['Sustitución', 'Divide y vencerás', 'Descendente', 'Comparación'], 1, 'Divide y vencerás: una prueba en medio del modelo descarta de golpe la mitad de las capas.'),
        op('Un técnico compara, línea por línea, la configuración de un switch que falla con la de otro switch idéntico que funciona. ¿Qué enfoque usa?', ['Seguir la ruta', 'Ascendente', 'Comparación', 'Sustitución'], 2, 'Buscar diferencias con un equipo sano equivalente es el enfoque de comparación (también llamado «buscar las diferencias»).'),
        op('Sospechas de un cable de red y lo cambias por uno nuevo para ver si el problema desaparece. ¿Qué enfoque es?', ['Sustitución', 'Descendente', 'Divide y vencerás', 'Comparación'], 0, 'Reemplazar el componente sospechoso por uno que se sabe bueno es sustitución. Es rápido cuando la pieza es barata y fácil de cambiar.'),
        op('Un ping desde la PC al servidor web FALLA. Según divide y vencerás, ¿dónde se sigue buscando?', ['En la capa de aplicación: el navegador', 'En la capa 3 o por debajo: direccionamiento, enlace o cableado', 'En la base de datos del servidor', 'En ningún sitio: el ping no aporta información'], 1, 'Si el ping falla, no tiene sentido mirar las aplicaciones: el problema está en red, enlace o física (o un firewall filtra ICMP, que se verá más adelante).'),
        op('Un técnico cambia a la vez el cable, la dirección IP y el servidor DNS de un equipo, y el problema desaparece. ¿Cuál es el inconveniente?', ['Ninguno: el problema está resuelto', 'No sabe cuál de los tres cambios era la causa, y puede haber dejado cambios innecesarios', 'Que tardó demasiado', 'Que debió cambiar también el switch'], 1, 'Con tres cambios a la vez no se identifica la causa raíz y no se puede documentar bien. Se cambia una cosa, se comprueba y, si no sirve, se revierte.'),
        op('Pruebas una hipótesis cambiando la puerta de enlace de un equipo y el problema sigue igual. ¿Qué haces antes de probar otra hipótesis?', ['Dejar el cambio, por si ayuda más adelante', 'Revertir el cambio para dejar el equipo como estaba', 'Cerrar el ticket', 'Formatear el equipo'], 1, 'Un cambio que no arregla el problema se deshace. Si no, se acumulan modificaciones y aparecen averías nuevas.'),
        op('Todos los usuarios de un piso perdieron la red justo después de que un electricista trabajó en el cuarto de comunicaciones. ¿Qué pregunta del diagnóstico señala directamente la causa probable?', ['¿A quién le pasa?', '¿Qué cambió justo antes?', '¿Qué navegador usan?', '¿Qué sistema operativo tienen?'], 1, 'El fallo coincide con un trabajo en el cuarto de comunicaciones: lo que cambió es la pista principal (un switch sin corriente o un cable desconectado).'),
        vs('Un usuario informa de un fallo. ¿Qué DOS datos ayudan más a definir el problema?', ['A cuántas personas afecta', 'La marca de su monitor', 'Desde cuándo ocurre y qué cambió antes', 'El color del cable de red', 'Su número de empleado'], [0, 2], 'El alcance (una persona, un área, todos) y el momento en que empezó, junto con los cambios previos, delimitan el problema. Los demás datos no orientan el diagnóstico.'),
        vs('¿Qué DOS situaciones justifican escalar un caso?', ['El problema requiere permisos o conocimientos que no tienes', 'Llevas dos minutos con el caso', 'Se agotó el tiempo que la política da a tu nivel de soporte', 'El usuario es amable', 'El problema se resolvió con un reinicio'], [0, 2], 'Se escala cuando el caso supera tus permisos o conocimientos, o cuando se cumple el plazo que fija la política. Siempre con todo lo que ya averiguaste.'),
        rel('Relaciona cada situación con el enfoque más adecuado.', [
          ['No hay luz de enlace en el puerto', 'Ascendente'],
          ['Solo falla un programa; todo lo demás funciona', 'Descendente'],
          ['No hay pistas: se empieza con un ping', 'Divide y vencerás'],
          ['Hay un equipo idéntico que sí funciona', 'Comparación'],
        ], 'La pista física lleva al ascendente; una sola aplicación, al descendente; sin pistas, divide y vencerás; y un «gemelo» sano invita a comparar.', ['Sustitución']),
        op('Un técnico resuelve un problema, pero no lo comprueba con la usuaria y cierra el ticket. Al día siguiente ella vuelve a llamar por lo mismo. ¿Qué paso omitió?', ['Proponer una hipótesis', 'Verificar con el usuario que el problema quedó resuelto', 'Reunir información', 'Elegir el enfoque'], 1, 'Resolver incluye confirmar que funciona desde el punto de vista del usuario. Lo que al técnico le parece arreglado puede no serlo para quien usa el servicio.'),
        op('Una sucursal entera no llega al servidor de la sede central, pero sí navega por Internet. El técnico revisa, uno por uno y en orden, cada router entre la sucursal y la sede. ¿Qué enfoque aplica?', ['Seguir la ruta', 'Descendente', 'Sustitución', 'Comparación'], 0, 'Recorrer el camino del tráfico salto a salto, de origen a destino, es el enfoque de seguir la ruta. Encaja cuando el fallo afecta a un destino concreto.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 2 */
  {
    slug: 'mesa-de-ayuda-y-documentacion',
    titulo: 'Mesa de ayuda, tickets y documentación',
    resumen: 'Niveles de soporte, qué lleva un buen ticket, cómo se calcula la prioridad con impacto y urgencia, SLA, escalamiento y trato con el usuario.',
    nivel: 'facil',
    objetivos: [
      'Describir los niveles de soporte y cuándo se escala de uno a otro.',
      'Redactar un ticket completo y exacto.',
      'Calcular la prioridad de un incidente a partir de su impacto y su urgencia.',
      'Aplicar buenas prácticas de comunicación, políticas y cierre de casos.',
    ],
    bloques: [
      h('Qué es una mesa de ayuda'),
      p(`La **mesa de ayuda** (help desk, o service desk) es la ventanilla única a la que los usuarios acuden cuando algo falla o necesitan algo. Funciona como la recepción de urgencias de un hospital: alguien recibe a cada paciente, anota qué le pasa, decide qué tan grave es y lo atiende o lo deriva al especialista.

Sin esa ventanilla, cada usuario llamaría al técnico que conoce, nada quedaría registrado y los problemas graves esperarían detrás de los triviales.`),

      h('Los niveles de soporte'),
      tabla(['Nivel', 'Quiénes son', 'Qué resuelven'], [
        ['**Nivel 1**', 'Primer contacto: quienes atienden llamadas, chats y correos.', 'Registran el ticket, resuelven lo frecuente con guías (contraseñas, cables, reinicios) y escalan lo demás.'],
        ['**Nivel 2**', 'Técnicos con más experiencia.', 'Problemas que requieren diagnóstico: configuración de equipos, red local, software.'],
        ['**Nivel 3**', 'Especialistas e ingenieros (red, servidores, seguridad).', 'Fallos complejos de infraestructura, diseño y cambios mayores.'],
        ['**Externo** (a veces «nivel 4»)', 'El fabricante o el proveedor de servicio.', 'Garantías, fallos de hardware, defectos de software, la línea del proveedor de Internet.'],
      ]),
      nota('clave', `Como técnico de soporte (el perfil del CCST) estarás normalmente en el **nivel 1 o 2**. Tu trabajo: registrar bien, resolver lo que te corresponde y **escalar con buena información** lo que no.`),

      h('El ticket'),
      p(`Un **ticket** es el expediente de un caso. Todo lo que pasa con un problema, desde que el usuario llama hasta que se cierra, queda escrito ahí. Un buen ticket permite que cualquier compañero lo abra y entienda el caso **sin tener que llamar otra vez al usuario**.`),
      tabla(['Campo', 'Qué se anota', 'Ejemplo'], [
        ['Quién', 'Nombre, área y forma de contacto.', 'Laura Méndez, Contabilidad, ext. 2231'],
        ['Qué', 'El síntoma exacto y el mensaje de error literal.', '«Al abrir el sistema de nóminas aparece: No se puede conectar con el servidor»'],
        ['Dónde', 'Equipo, ubicación, puerto o dirección IP.', 'PC-CONTA-07, piso 2, roseta 2-14'],
        ['Cuándo', 'Desde cuándo y con qué frecuencia.', 'Desde hoy a las 9:10, siempre'],
        ['Alcance', 'A quién más afecta.', 'A los 12 equipos del área'],
        ['Qué cambió', 'Cambios recientes.', 'Ayer por la tarde se actualizó el sistema de nóminas'],
        ['Qué se hizo', 'Cada prueba y su resultado, con hora.', '9:25 ping al servidor: responde. 9:30 prueba desde otra PC: mismo error'],
        ['Prioridad y categoría', 'Según impacto y urgencia.', 'P2 · Aplicaciones'],
      ]),
      nota('error', `«No funciona la red» **no es** una descripción. Tampoco «ya quedó» es una solución. Escribe hechos: qué se ve, qué se probó, qué resultado dio. Copia los mensajes de error **tal cual**, sin resumirlos.`),
      ejemplo('facil', 'Qué le falta a este ticket', op('Un ticket dice únicamente: «Usuario sin Internet. Urgente.» ¿Qué le falta para ser útil?',
        ['Nada: es breve y claro', 'Quién es, dónde está, desde cuándo, a quién más afecta y qué se probó', 'Una disculpa al usuario', 'El nombre del técnico que lo resolverá'], 1,
        ['Con ese texto, el siguiente técnico no sabe a quién llamar, qué equipo revisar ni si es un caso aislado o general.',
          '«Urgente» lo dice todo el mundo: la prioridad se calcula con impacto y urgencia, no con adjetivos.',
          'Faltan los datos básicos: **quién, qué exactamente, dónde, desde cuándo, alcance y pruebas realizadas**.'])),

      h('Prioridad: impacto y urgencia'),
      p(`No todos los tickets valen lo mismo. Si llegan a la vez «no puedo cambiar el fondo de pantalla» y «el sistema de cobro de la tienda no funciona», no se atienden por orden de llegada. Se atienden por **prioridad**, que sale de combinar dos cosas:`),
      tabla(['Concepto', 'Pregunta que responde', 'Alto', 'Bajo'], [
        ['**Impacto**', '¿A cuánta gente o a qué parte del negocio afecta?', 'Toda la empresa, un servicio crítico', 'Una sola persona'],
        ['**Urgencia**', '¿Cuánto puede esperar?', 'El trabajo está detenido y no hay alternativa', 'Hay alternativa y nadie tiene prisa'],
      ]),
      p(`Con los dos valores se entra en una **matriz de prioridad**. Cada organización define la suya; esta es la que usan los ejercicios del módulo:`),
      tabla(['', 'Urgencia alta', 'Urgencia media', 'Urgencia baja'], [
        ['Impacto alto', 'P1 · Crítica', 'P2 · Alta', 'P3 · Media'],
        ['Impacto medio', 'P2 · Alta', 'P3 · Media', 'P4 · Baja'],
        ['Impacto bajo', 'P3 · Media', 'P4 · Baja', 'P5 · Planificada'],
      ], 'Se lee como la tabla de multiplicar: fila del impacto, columna de la urgencia, y la celda donde se cruzan es la prioridad.'),
      nota('aviso', `Impacto y urgencia **no son lo mismo**. Un directivo sin impresora tiene mucha prisa (urgencia alta), pero es una sola persona (impacto bajo): P3. Una copia de seguridad que falla afecta a toda la empresa (impacto alto), pero puede no notarse hoy. Evalúa las dos cosas por separado.`),
      ejemplo('facil', 'Todo detenido y sin alternativa', pri(0, 0, 0, 0)),
      ejemplo('facil', 'Una persona, sin prisa', pri(2, 2, 0, 2)),
      ejemplo('medio', 'Un departamento con solución temporal', pri(1, 1, 0, 0)),
      ejemplo('medio', 'Una persona, pero con plazo inmediato', pri(2, 0, 0, 1)),
      ejemplo('dificil', 'Mucha gente, pero puede esperar', pri(0, 2, 1, 0)),

      h('SLA: el compromiso de tiempos'),
      p(`Un **SLA** (acuerdo de nivel de servicio) es el compromiso escrito de en cuánto tiempo se **responde** y en cuánto se **resuelve** cada prioridad. Por ejemplo:`),
      tabla(['Prioridad', 'Tiempo de respuesta', 'Tiempo de resolución'], [
        ['P1 · Crítica', '15 minutos', '4 horas'],
        ['P2 · Alta', '1 hora', '8 horas'],
        ['P3 · Media', '4 horas', '2 días hábiles'],
        ['P4 · Baja', '1 día hábil', '5 días hábiles'],
      ], 'Los valores son de ejemplo: cada organización firma los suyos.'),
      p(`**Respuesta** es el tiempo hasta que alguien toma el caso y contacta al usuario. **Resolución** es el tiempo hasta que el problema queda arreglado. Si un ticket está por incumplir su SLA, la política suele obligar a escalarlo.`),

      h('Escalamiento'),
      tabla(['Tipo', 'Hacia quién', 'Cuándo'], [
        ['**Funcional** (o técnico)', 'Un nivel con más conocimientos o permisos: de nivel 1 a nivel 2.', 'El problema supera lo que tu nivel puede resolver.'],
        ['**Jerárquico**', 'Un supervisor o gerente.', 'El SLA está en riesgo, el impacto es muy alto o hay que tomar una decisión que no te corresponde.'],
      ]),
      p(`Antes de escalar, deja el ticket al día: síntoma, alcance, todo lo que probaste y sus resultados. Y **avisa al usuario** de que su caso pasó a otro equipo y de cuándo tendrá noticias.`),
      ejemplo('medio', 'Qué tipo de escalamiento es', op('Una técnica de nivel 1 diagnostica que el fallo está en la configuración de un router central, que ella no tiene permiso de modificar. Pasa el ticket al equipo de redes con todas sus pruebas. ¿Qué tipo de escalamiento es?',
        ['Jerárquico', 'Funcional', 'Externo al fabricante', 'No es un escalamiento'], 1,
        ['El caso pasa a un grupo con **más conocimientos y permisos** (el equipo de redes), no a un jefe.',
          'Eso es escalamiento **funcional**. Sería jerárquico si lo llevara a su supervisor porque el SLA está por vencer o porque hace falta una decisión de gestión.',
          'Lo hizo bien: adjuntó sus pruebas, así el equipo de redes no empieza de cero.'])),

      h('Políticas y procedimientos'),
      p(`Una **política** dice **qué** se debe hacer y por qué («toda contraseña se restablece solo tras verificar la identidad del usuario»). Un **procedimiento** dice **cómo** hacerlo, paso a paso. Seguirlos no es burocracia: es lo que hace que el soporte sea igual de bueno lo atienda quien lo atienda, y lo que te protege si algo sale mal.`),
      lista(
        '**Verifica la identidad** antes de restablecer contraseñas o dar acceso. Es el truco favorito de los estafadores: llamar haciéndose pasar por otro.',
        '**No pidas ni anotes contraseñas** de los usuarios.',
        '**Los cambios en producción** se piden y se aprueban (gestión de cambios) antes de hacerlos, y se hacen en la ventana acordada.',
        '**No te saltes el procedimiento** porque alguien «importante» te presiona: escala.',
      ),

      h('Trato con el usuario'),
      lista(
        '**Escucha sin interrumpir** y repite el problema con tus palabras para confirmar que lo entendiste.',
        '**Sin jerga**: di «el equipo que reparte Internet» si «router» no le dice nada.',
        '**No culpes** al usuario ni a un compañero, aunque el error sea evidente.',
        '**Di lo que harás y cuándo** tendrá noticias. Y cumple.',
        '**Mantén la calma** con usuarios molestos: su enojo es con el problema, no contigo.',
      ),

      h('Cerrar el ticket y la base de conocimiento'),
      p(`Un ticket se cierra cuando se cumplen tres cosas: el problema está resuelto, **el usuario lo confirma**, y la solución quedó escrita. La nota de cierre debe decir **causa** y **solución**:`),
      codigo('Una buena nota de cierre', `Causa:    el puerto Gi1/0/14 del switch SW-P2 estaba asignado a la VLAN 1
          en lugar de la VLAN 20 (Contabilidad) tras el reemplazo del switch.
Solución: se reasignó el puerto a la VLAN 20. El equipo obtuvo la dirección
          192.168.20.37 por DHCP y abre el sistema de nóminas.
Verificó: Laura Méndez, 10:42.`),
      p(`Cuando un problema se repite, su solución se pasa a la **base de conocimiento**: una colección de artículos «síntoma → causa → solución» que cualquiera puede buscar. Es lo que permite al nivel 1 resolver en cinco minutos lo que la primera vez llevó dos horas.`),

      h('Resumen'),
      lista(
        'La mesa de ayuda es el punto único de contacto. Niveles: 1 (primer contacto), 2 (técnicos), 3 (especialistas), y el fabricante o proveedor.',
        'Un buen ticket responde: **quién, qué, dónde, cuándo, alcance, qué cambió y qué se probó**.',
        '**Prioridad = impacto + urgencia**, leída en la matriz. No por orden de llegada ni por quién insiste más.',
        'El **SLA** fija los tiempos de respuesta y de resolución.',
        'Escalamiento **funcional** (más conocimiento) o **jerárquico** (más autoridad).',
        'Se cierra con la confirmación del usuario y con causa y solución documentadas.',
      ),

      ejercicios('Practica', 'En los tickets, la primera frase describe el impacto y la segunda la urgencia. Usa la matriz que acompaña a cada ejercicio.', [
        pri(0, 0, 1, 2), pri(2, 2, 1, 1), pri(1, 0, 1, 0), pri(0, 1, 2, 1), pri(1, 2, 2, 0), pri(2, 1, 2, 1), pri(1, 1, 1, 2), pri(2, 0, 1, 0),
        op('¿Qué nivel de soporte es el primer contacto con el usuario y registra el ticket?', ['Nivel 1', 'Nivel 2', 'Nivel 3', 'El fabricante'], 0, 'El nivel 1 recibe la solicitud, la registra, resuelve lo habitual y escala lo demás.'),
        op('¿Qué mide el IMPACTO de un incidente?', ['Cuánto tiempo puede esperar', 'A cuántas personas o a qué parte del negocio afecta', 'Cuánto cuesta el equipo averiado', 'Qué tan molesto está el usuario'], 1, 'Impacto es alcance: cuánta gente o qué servicio se ve afectado. Cuánto puede esperar es la urgencia.'),
        op('¿Qué es un SLA?', ['Un tipo de cable de consola', 'Un acuerdo que fija los tiempos de respuesta y de resolución del servicio', 'Un protocolo de enrutamiento', 'El registro de eventos de un switch'], 1, 'El acuerdo de nivel de servicio compromete tiempos máximos según la prioridad del caso.'),
        op('En un SLA, ¿qué es el «tiempo de respuesta»?', ['El tiempo hasta que el problema queda resuelto', 'El tiempo hasta que alguien toma el caso y contacta al usuario', 'El tiempo de ida y vuelta de un ping', 'El tiempo que tarda en arrancar un router'], 1, 'Respuesta = primer contacto. Resolución = problema arreglado. Son dos plazos distintos.'),
        op('Un supervisor recibe un ticket P1 porque faltan 20 minutos para incumplir el SLA. ¿Qué tipo de escalamiento es?', ['Funcional', 'Jerárquico', 'Externo', 'Ninguno'], 1, 'Se sube en la cadena de mando por un riesgo de incumplimiento: es jerárquico. El funcional va hacia quien tiene más conocimiento técnico.'),
        op('Alguien llama diciendo que es el director y exige que le restablezcan la contraseña de inmediato, sin el proceso de verificación. ¿Qué haces?', ['Restablecerla: es el director', 'Seguir el procedimiento de verificación de identidad, y escalar si insiste', 'Darle la contraseña de otro usuario', 'Colgar sin registrar nada'], 1, 'Presionar invocando autoridad y prisa es la técnica típica de ingeniería social. El procedimiento se sigue siempre; si hay conflicto, se escala.'),
        op('¿Cuál es la mejor descripción del síntoma para un ticket?', ['«La red está rara»', '«No funciona nada, urgente»', '«Desde las 9:10, al abrir https://intranet.example.com aparece: Se agotó el tiempo de espera. Afecta a los 12 equipos de Contabilidad»', '«Problema de Internet»'], 2, 'Tiene hora, acción, mensaje de error literal y alcance: cualquier técnico puede empezar a trabajar sin llamar al usuario.'),
        op('¿Cuándo se puede cerrar un ticket?', ['En cuanto el técnico cree que lo arregló', 'Cuando el usuario confirma que funciona y la solución está documentada', 'A las 24 horas, pase lo que pase', 'Cuando el usuario deja de llamar'], 1, 'El cierre requiere la confirmación del usuario y la documentación de causa y solución.'),
        op('¿Para qué sirve la base de conocimiento?', ['Para guardar las contraseñas de los usuarios', 'Para que soluciones ya encontradas se puedan buscar y reutilizar', 'Para medir la velocidad de la red', 'Para sustituir al sistema de tickets'], 1, 'Reúne artículos «síntoma → causa → solución». Acorta el tiempo de resolución y permite al nivel 1 resolver más casos.'),
        op('¿Qué diferencia hay entre una política y un procedimiento?', ['Ninguna: son sinónimos', 'La política dice qué se debe hacer; el procedimiento explica cómo hacerlo paso a paso', 'La política es opcional y el procedimiento obligatorio', 'El procedimiento lo escribe el usuario'], 1, 'Política = la regla y su porqué. Procedimiento = los pasos concretos para cumplirla.'),
        vs('¿Qué DOS datos son imprescindibles en un ticket bien redactado?', ['El síntoma exacto, con el mensaje de error literal', 'La opinión del técnico sobre el usuario', 'Las pruebas realizadas y sus resultados', 'La contraseña del usuario', 'El precio del equipo'], [0, 2], 'El síntoma preciso y el registro de pruebas permiten continuar el caso. Las opiniones no aportan, y las contraseñas nunca se anotan.'),
        vs('Un usuario está muy molesto por una caída del servicio. ¿Qué DOS conductas son correctas?', ['Escucharlo sin interrumpir y resumir el problema para confirmar', 'Explicarle que la culpa fue de un compañero', 'Decirle qué vas a hacer y cuándo tendrá noticias', 'Usar muchos términos técnicos para demostrar dominio', 'Pedirle que llame cuando esté más tranquilo'], [0, 2], 'Escucha activa y expectativas claras calman y generan confianza. Culpar, abrumar con jerga o posponer empeoran la situación.'),
        rel('Relaciona cada concepto con su definición.', [
          ['Impacto', 'A cuántos afecta'],
          ['Urgencia', 'Cuánto puede esperar'],
          ['SLA', 'Tiempos comprometidos de respuesta y resolución'],
          ['Escalamiento funcional', 'Pasar el caso a quien tiene más conocimiento técnico'],
        ], 'Impacto es alcance; urgencia es tiempo; el SLA fija plazos; y el escalamiento funcional busca más pericia técnica.', ['Pasar el caso a un superior jerárquico']),
        ord('Ordena el ciclo de vida de un ticket.', ['El usuario reporta el problema', 'Se registra y se clasifica el ticket', 'Se diagnostica y se resuelve (o se escala)', 'El usuario confirma la solución', 'Se documenta y se cierra el ticket'], 'Se recibe, se registra y clasifica, se trabaja, se verifica con el usuario y, solo entonces, se cierra con la documentación completa.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 3 */
  {
    slug: 'ping-y-traceroute',
    titulo: 'ping y traceroute: ¿llega?, ¿por dónde pasa?',
    resumen: 'Cómo funciona ping, cómo leer su salida y sus mensajes de error, la secuencia clásica de cinco pings y cómo traceroute dibuja el camino con el TTL.',
    nivel: 'medio',
    objetivos: [
      'Leer la salida de `ping` en Windows y Linux: tiempo, TTL y pérdida.',
      'Interpretar «Tiempo de espera agotado», «Host de destino inaccesible» y «Error general».',
      'Aplicar la secuencia de cinco pings para ubicar un fallo.',
      'Explicar cómo funciona `tracert`/`traceroute` y leer sus saltos y asteriscos.',
    ],
    bloques: [
      h('Qué hace ping'),
      p(`\`ping\` es la herramienta más simple y más usada del diagnóstico. Hace una sola pregunta: **«¿estás ahí?»**. Es como gritar «¡eco!» en una cueva: si la voz vuelve, hay algo enfrente, y el tiempo que tarda en volver te dice qué tan lejos está.

Por dentro usa el protocolo **ICMP**. Tu equipo envía un mensaje **Echo Request** (petición de eco) y, si el destino lo recibe y quiere contestar, devuelve un **Echo Reply** (respuesta de eco).`),
      nota('clave', `Un ping que responde demuestra **cuatro cosas a la vez**: que tu equipo puede enviar, que existe un camino de ida, que el destino está encendido, y que existe un camino de vuelta. Por eso un solo ping descarta tantas causas.`),

      h('Leer un ping en Windows'),
      codigo('ping 192.168.1.1 (Windows)', `C:\\> ping 192.168.1.1

Haciendo ping a 192.168.1.1 con 32 bytes de datos:
Respuesta desde 192.168.1.1: bytes=32 tiempo=2ms TTL=64
Respuesta desde 192.168.1.1: bytes=32 tiempo=1ms TTL=64
Respuesta desde 192.168.1.1: bytes=32 tiempo=1ms TTL=64
Respuesta desde 192.168.1.1: bytes=32 tiempo=3ms TTL=64

Estadísticas de ping para 192.168.1.1:
    Paquetes: enviados = 4, recibidos = 4, perdidos = 0
    (0% perdidos),
Tiempos aproximados de ida y vuelta en milisegundos:
    Mínimo = 1ms, Máximo = 3ms, Media = 1ms`),
      tabla(['Dato', 'Qué significa', 'Qué es normal'], [
        ['`Respuesta desde 192.168.1.1`', 'Quién contestó. Normalmente, el destino.', 'La misma dirección a la que hiciste ping.'],
        ['`bytes=32`', 'Tamaño de los datos enviados.', '32 en Windows, 56 en Linux (64 con la cabecera ICMP).'],
        ['`tiempo=2ms`', 'Ida y vuelta, en milisegundos.', 'Red local: 1–5 ms. Internet: 10–100 ms. Satélite: 500 ms o más.'],
        ['`TTL=64`', 'Saltos que le quedaban al paquete de respuesta al llegar.', 'Depende del sistema que responde (ver más abajo).'],
        ['`perdidos = 0 (0% perdidos)`', 'Cuántas peticiones quedaron sin respuesta.', '0 %. Cualquier pérdida en red local merece atención.'],
      ]),
      p(`Windows envía **4 peticiones** y se detiene. Con \`ping -t\` sigue hasta que pulses Ctrl+C, y con \`ping -n 10\` envía exactamente 10.`),

      h('Leer un ping en Linux y macOS'),
      codigo('ping -c 4 192.168.1.1 (Linux)', `$ ping -c 4 192.168.1.1
PING 192.168.1.1 (192.168.1.1) 56(84) bytes of data.
64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=1.82 ms
64 bytes from 192.168.1.1: icmp_seq=2 ttl=64 time=1.10 ms
64 bytes from 192.168.1.1: icmp_seq=3 ttl=64 time=1.05 ms
64 bytes from 192.168.1.1: icmp_seq=4 ttl=64 time=2.91 ms

--- 192.168.1.1 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
rtt min/avg/max/mdev = 1.050/1.720/2.910/0.752 ms`),
      p(`Es la misma información con otro formato. Dos diferencias importantes: en Linux y macOS **ping no se detiene solo** (hay que indicar \`-c 4\` o pulsar Ctrl+C), y aparece \`icmp_seq\`, el número de cada petición: si ves 1, 2, 4, 5, se perdió la 3.`),
      tabla(['Quiero…', 'Windows', 'Linux / macOS'], [
        ['Enviar un número concreto de peticiones', '`ping -n 10 destino`', '`ping -c 10 destino`'],
        ['Ping continuo', '`ping -t destino`', '`ping destino` (es el comportamiento normal)'],
        ['Detenerlo', 'Ctrl+C', 'Ctrl+C'],
      ]),

      h('El TTL'),
      p(`**TTL** significa «tiempo de vida», pero no es tiempo: es un **contador de saltos**. Cada paquete IP sale con un TTL inicial, y **cada router que lo reenvía le resta 1**. Si llega a 0, el router lo descarta y avisa al origen. Su función es evitar que un paquete dé vueltas para siempre si hay un bucle en la red.`),
      tabla(['Sistema que responde', 'TTL inicial habitual'], [
        ['Linux, macOS, Android, iOS', '64'],
        ['Windows', '128'],
        ['Equipos de red Cisco (IOS)', '255'],
      ]),
      p(`Con eso puedes estimar cuántos routers hay de por medio. Si haces ping a un servidor Linux y ves \`TTL=57\`, la respuesta salió con 64 y perdió 7: pasó por **7 routers**.`),
      ejemplo('facil', 'Contar saltos con el TTL', op('Haces ping a un servidor Windows y la respuesta muestra `TTL=121`. ¿Por cuántos routers pasó la respuesta?',
        ['7', '121', '128', '57'], 0,
        ['Windows envía sus paquetes con TTL inicial **128**.',
          'Cada router del camino resta 1. Llegó con 121: 128 − 121 = **7** routers.',
          'Si el servidor fuera Linux (TTL inicial 64), un TTL de 57 indicaría también 7 saltos. Por eso hay que saber, o deducir, el valor inicial: siempre es el valor típico inmediatamente superior al que ves (64, 128 o 255).'])),

      h('Cuando el ping falla: los tres mensajes'),
      codigo('Tiempo de espera agotado', `C:\\> ping 203.0.113.10

Haciendo ping a 203.0.113.10 con 32 bytes de datos:
Tiempo de espera agotado para esta solicitud.
Tiempo de espera agotado para esta solicitud.
Tiempo de espera agotado para esta solicitud.
Tiempo de espera agotado para esta solicitud.

Estadísticas de ping para 203.0.113.10:
    Paquetes: enviados = 4, recibidos = 0, perdidos = 4
    (100% perdidos),`),
      p(`**«Tiempo de espera agotado»** significa: envié la pregunta y **nadie contestó nada**. El silencio puede deberse a que el destino está apagado, a que no hay camino de vuelta, o a que **un firewall descarta los ping** sin avisar. Es el mensaje más ambiguo.`),
      codigo('Host de destino inaccesible', `C:\\> ping 192.168.1.77

Haciendo ping a 192.168.1.77 con 32 bytes de datos:
Respuesta desde 192.168.1.25: Host de destino inaccesible.
Respuesta desde 192.168.1.25: Host de destino inaccesible.`),
      p(`**«Host de destino inaccesible»** es distinto: aquí **sí hubo respuesta**, pero de alguien que dice «no sé cómo llegar ahí». Fíjate en **quién** responde:`),
      lista(
        'Si responde **tu propia IP** (como arriba, 192.168.1.25): el destino está en tu misma red y **no contesta al ARP**. Está apagado, desconectado o esa dirección no existe.',
        'Si responde **un router** (tu puerta de enlace u otro): ese router **no tiene ruta** hacia la red de destino.',
      ),
      codigo('Error general', `C:\\> ping 203.0.113.10

Haciendo ping a 203.0.113.10 con 32 bytes de datos:
PING: error en la transmisión. Error general.`),
      p(`**«Error general»** (o «error en la transmisión») significa que el paquete **ni siquiera salió** de tu equipo: no hay ninguna interfaz de red utilizable. Típicamente, el adaptador está desactivado, el cable desconectado y sin Wi-Fi, o no hay dirección IP.`),
      codigo('No se pudo encontrar el host', `C:\\> ping www.exmple.com
La solicitud de ping no pudo encontrar el host www.exmple.com.
Compruebe el nombre y vuelva a intentarlo.`),
      p(`Y este cuarto mensaje no es de conectividad sino de **nombres**: el equipo no pudo traducir el nombre a una dirección IP (el nombre está mal escrito o el DNS no funciona). Ni siquiera llegó a enviar un ping.`),
      tabla(['Mensaje', 'Qué pasó', 'Dónde mirar'], [
        ['Tiempo de espera agotado', 'Se envió, nadie contestó', 'Destino apagado, ruta de vuelta, firewall'],
        ['Host de destino inaccesible (desde tu IP)', 'El destino local no responde al ARP', 'El destino: apagado o dirección inexistente'],
        ['Host de destino inaccesible (desde un router)', 'Ese router no tiene ruta', 'La tabla de enrutamiento de ese router'],
        ['Error general', 'El paquete no salió del equipo', 'Tu adaptador, tu cable, tu dirección IP'],
        ['No se pudo encontrar el host', 'El nombre no se resolvió', 'DNS, o el nombre mal escrito'],
      ]),
      ejemplo('medio', 'Leer quién responde', op('Desde la PC 192.168.1.25/24 (puerta de enlace 192.168.1.1) ejecutas el ping de abajo. ¿Qué indica el resultado?',
        ['El equipo no tiene tarjeta de red', 'La puerta de enlace recibió el paquete, pero no tiene ruta hacia la red 10.50.0.0', 'El servidor DNS no responde', 'El destino está en la red local y está apagado'], 1,
        ['El mensaje es «Host de destino inaccesible» y lo envía **192.168.1.1**, que es la puerta de enlace, no la propia PC.',
          'Eso significa que el paquete salió de la PC y llegó al router sin problema: la red local funciona.',
          'El router es quien avisa: «no sé llegar a 10.50.0.20». Le falta una ruta hacia esa red. No interviene el DNS (se usó una dirección IP) ni está el destino en la red local (10.50.0.20 no pertenece a 192.168.1.0/24).'],
        { codigo: `C:\\> ping 10.50.0.20

Haciendo ping a 10.50.0.20 con 32 bytes de datos:
Respuesta desde 192.168.1.1: Host de destino inaccesible.
Respuesta desde 192.168.1.1: Host de destino inaccesible.` })),

      h('La secuencia de cinco pings'),
      p(`Cuando alguien «no tiene red», hay una rutina que ubica el fallo en menos de un minuto. Consiste en hacer ping **de lo más cercano a lo más lejano**. El primer ping que falla te dice dónde está el problema.`),
      tabla(['Paso', 'Comando', 'Si responde, funciona…', 'Si falla, revisa…'], [
        ['1', '`ping 127.0.0.1`', 'El software TCP/IP del equipo', 'El sistema operativo (rarísimo)'],
        ['2', '`ping` a tu propia IP', 'La tarjeta de red y su configuración', 'El adaptador, su controlador, la dirección IP'],
        ['3', '`ping` a la puerta de enlace', 'La red local', 'Cable, Wi-Fi, switch, VLAN, el router'],
        ['4', '`ping` a una IP de Internet (8.8.8.8)', 'El enrutamiento y la salida a Internet', 'El router, el proveedor, un firewall'],
        ['5', '`ping` a un nombre (www.example.com)', 'El DNS', 'El servidor DNS configurado'],
      ]),
      nota('truco', `En la práctica se empieza por el final. Si \`ping www.example.com\` responde, **los cinco pasos funcionan** y no hace falta más. Solo si falla se retrocede. Pero para el examen, y para explicarlo, apréndela de adentro hacia afuera.`),
      nota('aviso', `\`127.0.0.1\` es la dirección de **loopback**: el paquete nunca sale de la tarjeta. Por eso responde aunque el cable esté desconectado. Que responda **no** demuestra que tengas red.`),
      ejemplo('facil', 'Falla en la puerta de enlace', ping(2)),
      ejemplo('facil', 'Solo falla el nombre', ping(4)),
      ejemplo('medio', 'Llega al router, pero no sale', ping(3, '10.0.5.40', '10.0.5.1', '198.51.100.25', 'portal.example.org')),
      ejemplo('medio', 'Todo responde', ping(5, '172.16.8.90', '172.16.8.254', '192.0.2.44', 'intranet.example.com')),

      h('traceroute: el camino completo'),
      p(`\`ping\` contesta «¿llega?». \`traceroute\` contesta **«¿por dónde pasa, y hasta dónde llega?»**. Muestra, en orden, cada router del camino. En Windows el comando se llama \`tracert\`; en Linux, macOS y Cisco IOS, \`traceroute\`.`),
      p(`Su truco es ingenioso y usa el TTL que acabas de aprender:`),
      orden(
        'Envía un paquete con **TTL = 1**. El primer router le resta 1, queda en 0, lo descarta y contesta con un mensaje ICMP **«Tiempo excedido»**. Esa respuesta revela la dirección del primer router.',
        'Envía otro con **TTL = 2**. Pasa el primer router y muere en el segundo, que se delata igual.',
        'Sigue con TTL = 3, 4, 5… cada vez un salto más lejos.',
        'Cuando el paquete alcanza el destino, este contesta normalmente y la traza termina.',
      ),
      codigo('tracert 203.0.113.80 (Windows)', `C:\\> tracert -d 203.0.113.80

Traza a la dirección 203.0.113.80 sobre un máximo de 30 saltos

  1     1 ms     1 ms     1 ms  192.168.1.1
  2     8 ms     7 ms     9 ms  10.255.0.1
  3    15 ms    14 ms    15 ms  198.51.100.1
  4    22 ms    23 ms    22 ms  192.0.2.65
  5    29 ms    30 ms    29 ms  203.0.113.80

Traza completa.`),
      tabla(['Columna', 'Qué es'], [
        ['Número (1, 2, 3…)', 'El salto: cuántos routers lleva recorridos. El salto 1 es casi siempre tu puerta de enlace.'],
        ['Tres tiempos', 'Tres intentos por salto, con su ida y vuelta. Sirven para ver si la demora es estable.'],
        ['Dirección', 'El router que contestó en ese salto. La última línea debe ser el destino.'],
      ]),
      p(`La opción \`-d\` (en Linux, \`-n\`) evita que el comando intente averiguar el nombre de cada router. La traza sale **mucho más rápido**, y es lo habitual al diagnosticar.`),

      h('Los asteriscos'),
      p(`Un asterisco significa que ese intento **no recibió respuesta**. Tres asteriscos en una línea, que ningún intento de ese salto la recibió. Lo que importa es **qué pasa después**:`),
      tabla(['Lo que ves', 'Qué significa', '¿Es una avería?'], [
        ['Una línea con `* * *` y después los saltos **siguen respondiendo**', 'Ese router reenvía bien, pero no contesta ICMP (o un firewall lo filtra).', 'No. Es normal en Internet.'],
        ['`* * *` desde un salto **hasta el final**, sin llegar al destino', 'El paquete se pierde después del último salto que respondió.', 'Sí: revisa ese último router y lo que hay tras él.'],
        ['Las **mismas dos direcciones** se repiten una y otra vez', 'Bucle de enrutamiento: dos routers se pasan el paquete.', 'Sí: hay rutas mal configuradas.'],
        ['Todo responde, pero la última línea son asteriscos', 'El destino no contesta ICMP (firewall del servidor).', 'No necesariamente: prueba el servicio real.'],
      ]),
      nota('clave', `La regla de oro: **el último salto que responde es el último lugar al que llegó tu paquete con seguridad**. El problema está en ese router o inmediatamente después.`),
      ejemplo('facil', 'Una traza sana', tr('ok')),
      ejemplo('medio', 'Un router mudo en medio', tr('silencioso', 3)),
      ejemplo('medio', 'El paquete se pierde', tr('corte', 2)),
      ejemplo('dificil', 'Las mismas direcciones una y otra vez', tr('bucle', 3)),

      h('Resumen'),
      lista(
        '`ping` usa ICMP Echo Request y Echo Reply. Que responda demuestra ida, vuelta y destino encendido.',
        'TTL inicial: **64** Linux/macOS, **128** Windows, **255** Cisco. Cada router resta 1.',
        '«Tiempo de espera agotado» = silencio. «Host inaccesible» = alguien avisa de que no hay camino (mira quién). «Error general» = no salió de tu equipo.',
        'Secuencia: **loopback → IP propia → puerta de enlace → IP remota → nombre**. El primero que falla ubica el problema.',
        '`tracert` (Windows) / `traceroute` (Linux, macOS) usa TTL crecientes. Asteriscos sueltos son normales; asteriscos hasta el final son un corte.',
      ),

      ejercicios('Practica', 'En los ejercicios de la secuencia de pings, busca el primer paso que no responde.', [
        ping(0), ping(1), ping(2, '10.10.30.77', '10.10.30.254', '192.0.2.130', 'correo.example.net'), ping(3), ping(4, '192.168.20.15', '192.168.20.1', '198.51.100.7', 'tienda.example.com'), ping(5),
        tr('ok', 0, '192.0.2.200'), tr('silencioso', 2), tr('corte', 4), tr('bucle', 2), tr('corte', 3, '198.51.100.77'),
        cmd('win-ping-t'), cmd('lin-ping-c'), cmd('win-tracert', '203.0.113.10'), cmd('lin-traceroute', '203.0.113.10'), cmd('win-tracert-d', '198.51.100.25'), cmd('win-ping-n', '10.0.0.1'),
        op('¿Qué protocolo usa `ping`?', ['TCP', 'UDP', 'ICMP', 'ARP'], 2, 'ping envía mensajes ICMP Echo Request y espera Echo Reply. No usa puertos TCP ni UDP.'),
        op('Haces ping a un router Cisco y la respuesta muestra `TTL=252`. ¿Cuántos routers hay entre tú y él?', ['3', '252', '0', '255'], 0, 'Cisco IOS responde con TTL inicial 255. 255 − 252 = 3 routers intermedios.'),
        op('¿Qué significa «PING: error en la transmisión. Error general.»?', ['El destino está apagado', 'El paquete no pudo salir del equipo: no hay interfaz de red utilizable', 'El DNS no responde', 'Un router no tiene ruta'], 1, 'Es un fallo local: adaptador desactivado, sin enlace o sin dirección IP. Ningún paquete llegó a la red.'),
        op('`ping 127.0.0.1` responde, pero el cable de red está desconectado. ¿Es contradictorio?', ['Sí: debería fallar', 'No: el loopback nunca sale de la tarjeta, solo prueba el software TCP/IP', 'No: el ping viaja por Wi-Fi', 'Sí: indica que el cable en realidad funciona'], 1, 'El loopback es interno. Responde aunque no haya ningún medio conectado.'),
        op('¿Cómo descubre `traceroute` la dirección de cada router del camino?', ['Pregunta al servidor DNS', 'Envía paquetes con TTL 1, 2, 3… y cada router que descarta uno responde con ICMP «Tiempo excedido»', 'Lee la tabla ARP del equipo', 'Usa el protocolo CDP'], 1, 'Aumenta el TTL de uno en uno; el router donde el TTL llega a 0 se delata al avisar del descarte.'),
        op('En un tracert, el salto 4 muestra `* * *` pero los saltos 5, 6 y 7 responden y el 7 es el destino. ¿Qué conclusión es correcta?', ['El enlace del salto 4 está caído', 'El router del salto 4 no responde ICMP, pero sí reenvía: no hay avería', 'Hay un bucle de enrutamiento', 'El destino está apagado'], 1, 'Si el paquete se perdiera en el salto 4, no habría respuestas de los saltos posteriores.'),
        vs('¿Qué DOS afirmaciones sobre el mensaje «Tiempo de espera agotado» son ciertas?', ['Significa que no llegó ninguna respuesta', 'Demuestra con certeza que el destino está apagado', 'Puede deberse a un firewall que descarta ICMP', 'Indica que el nombre no se resolvió', 'Lo envía la puerta de enlace'], [0, 2], 'Es silencio: no lo envía nadie. El destino puede estar apagado, pero también encendido tras un firewall que no contesta ping.'),
        rel('Relaciona cada paso de la secuencia de pings con lo que comprueba.', [
          ['ping 127.0.0.1', 'El software TCP/IP'],
          ['ping a la IP propia', 'La tarjeta de red'],
          ['ping a la puerta de enlace', 'La red local'],
          ['ping a un nombre', 'El DNS'],
        ], 'Loopback → pila TCP/IP; IP propia → adaptador; puerta de enlace → red local; nombre → resolución DNS.', ['El enrutamiento hacia Internet']),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 4 */
  {
    slug: 'ipconfig-ifconfig-ip-y-nslookup',
    titulo: 'ipconfig, ifconfig, ip y nslookup: leer la configuración',
    resumen: 'Cómo ver y entender la configuración IP en Windows, Linux y macOS, detectar APIPA y puertas de enlace equivocadas, y separar un fallo de DNS de uno de conectividad.',
    nivel: 'medio',
    objetivos: [
      'Leer la salida de `ipconfig /all`, `ip addr` e `ifconfig`.',
      'Detectar una dirección APIPA, una puerta de enlace fuera de la subred y la falta de DNS.',
      'Usar `nslookup` para comprobar la resolución de nombres.',
      'Distinguir un fallo de DNS de un fallo de conectividad.',
    ],
    bloques: [
      h('Los cuatro datos que necesita un equipo'),
      p(`Para funcionar en una red, todo equipo necesita **cuatro datos**. Piensa en una carta: necesitas tu dirección, saber qué calles son de tu colonia, dónde está la oficina de correos para lo que va lejos, y una agenda para saber la dirección de cada persona.`),
      tabla(['Dato', 'Para qué sirve', 'Si falta o está mal…'], [
        ['**Dirección IP**', 'Identifica al equipo.', 'No hay comunicación (o hay conflicto con otro equipo).'],
        ['**Máscara de subred**', 'Dice qué direcciones son «de mi red» y cuáles no.', 'El equipo se equivoca sobre quién está cerca y quién lejos.'],
        ['**Puerta de enlace**', 'El router al que se entrega lo que va a otras redes.', 'Funciona la red local, pero no Internet ni otras sedes.'],
        ['**Servidor DNS**', 'Traduce nombres a direcciones IP.', 'Funciona por IP, pero no por nombre: «no abre ninguna página».'],
      ]),
      p(`Esos datos se ponen **a mano** (configuración estática) o los entrega un servidor **DHCP** automáticamente. Los comandos de esta lección sirven para ver cuáles tiene el equipo ahora mismo.`),

      h('Windows: ipconfig'),
      codigo('ipconfig', `C:\\> ipconfig

Adaptador de Ethernet Ethernet0:

   Sufijo DNS específico para la conexión. . : example.local
   Dirección IPv4. . . . . . . . . . . . . . : 192.168.10.37
   Máscara de subred . . . . . . . . . . . . : 255.255.255.0
   Puerta de enlace predeterminada . . . . . : 192.168.10.1`),
      p(`\`ipconfig\` a secas da lo esencial: dirección, máscara y puerta de enlace. **No muestra el DNS ni la MAC.** Para eso está \`ipconfig /all\`:`),
      codigo('ipconfig /all', `C:\\> ipconfig /all

Adaptador de Ethernet Ethernet0:

   Sufijo DNS específico para la conexión. . : example.local
   Descripción . . . . . . . . . . . . . . . : Intel(R) Ethernet Connection I219-LM
   Dirección física. . . . . . . . . . . . . : 00-1A-2B-3C-4D-5E
   DHCP habilitado . . . . . . . . . . . . . : sí
   Dirección IPv4. . . . . . . . . . . . . . : 192.168.10.37(Preferido)
   Máscara de subred . . . . . . . . . . . . : 255.255.255.0
   Concesión obtenida. . . . . . . . . . . . : lunes, 5 de octubre de 2026 8:02:11
   La concesión expira . . . . . . . . . . . : martes, 6 de octubre de 2026 8:02:11
   Puerta de enlace predeterminada . . . . . : 192.168.10.1
   Servidor DHCP . . . . . . . . . . . . . . : 192.168.10.1
   Servidores DNS. . . . . . . . . . . . . . : 192.168.10.1
                                               8.8.8.8`),
      tabla(['Línea', 'Qué te dice'], [
        ['Dirección física', 'La dirección **MAC** de la tarjeta. Windows la escribe con guiones.'],
        ['DHCP habilitado: sí', 'La configuración llegó de un servidor DHCP. Si dice «no», se puso a mano.'],
        ['Concesión obtenida / expira', 'Cuándo recibió la dirección y hasta cuándo la puede usar.'],
        ['Servidor DHCP', 'Quién le dio la configuración. Útil si hay un DHCP «intruso» repartiendo datos malos.'],
        ['Servidores DNS', 'A quién pregunta por los nombres. Puede haber varios.'],
      ]),
      tabla(['Comando', 'Qué hace'], [
        ['`ipconfig`', 'Resumen: IP, máscara, puerta de enlace.'],
        ['`ipconfig /all`', 'Todo: MAC, DHCP, concesión, DNS.'],
        ['`ipconfig /release`', 'Suelta la dirección obtenida por DHCP.'],
        ['`ipconfig /renew`', 'Pide una dirección nueva al DHCP.'],
        ['`ipconfig /flushdns`', 'Borra la caché de nombres DNS del equipo.'],
        ['`ipconfig /displaydns`', 'Muestra esa caché.'],
      ]),
      nota('truco', `La pareja \`ipconfig /release\` y luego \`ipconfig /renew\` es el «apagar y encender» de DHCP: obliga al equipo a pedir su configuración de nuevo. Úsala cuando el equipo tiene una dirección vieja o una APIPA y ya arreglaste la causa.`),

      h('La señal de alarma: 169.254.x.x'),
      p(`Si un equipo Windows está configurado para usar DHCP y **nadie le contesta**, no se queda sin dirección: se inventa una que empieza por **169.254**. Se llama **APIPA** (direccionamiento IP privado automático).`),
      codigo('Un equipo con APIPA', `   DHCP habilitado . . . . . . . . . . . . . : sí
   Configuración automática habilitada . . . : sí
   Dirección IPv4 de configuración automática: 169.254.83.117(Preferido)
   Máscara de subred . . . . . . . . . . . . : 255.255.0.0
   Puerta de enlace predeterminada . . . . . :
   Servidores DNS. . . . . . . . . . . . . . :`),
      nota('clave', `Ver **169.254.x.x** con máscara 255.255.0.0 y **sin puerta de enlace** significa siempre lo mismo: **el equipo pidió una dirección por DHCP y no recibió respuesta**. El problema no es la dirección: es que no llega al servidor DHCP. Revisa el cable o el Wi-Fi, la VLAN del puerto, y si el servidor DHCP está en marcha y le quedan direcciones.`),
      ejemplo('facil', 'Reconocer APIPA', cfg('169.254.83.117', 16, '', '')),

      h('Comprobar que la configuración cuadra'),
      p(`Una configuración puede estar completa y aun así **estar mal**. Hay tres comprobaciones que resuelven la mayoría de los casos, y las tres usan lo que aprendiste en subneteo:`),
      orden(
        'Convierte la máscara en prefijo y **calcula la red** del equipo.',
        'Comprueba que la IP **no sea la dirección de red ni la de broadcast**.',
        'Comprueba que la **puerta de enlace esté dentro de esa misma red**. Un equipo solo puede entregar tramas directamente a direcciones de su propia subred: si la puerta de enlace cae fuera, nunca la alcanzará.',
      ),
      ejemplo('facil', 'Una configuración correcta', cfg('192.168.10.37', 24, '192.168.10.1', '192.168.10.1')),
      ejemplo('medio', 'La puerta de enlace que no está en la subred', cfg('192.168.10.37', 24, '192.168.11.1', '8.8.8.8', false)),
      ejemplo('medio', 'Sin puerta de enlace', cfg('10.10.30.45', 24, '', '1.1.1.1', false)),
      ejemplo('dificil', 'Una dirección que no se puede asignar', cfg('172.16.8.127', 25, '172.16.8.1', '8.8.8.8', false)),
      ejemplo('dificil', 'Con una máscara /26, la puerta de enlace queda fuera', cfg('192.168.50.70', 26, '192.168.50.1', '9.9.9.9', false)),

      h('Linux: ip addr e ip route'),
      codigo('ip addr', `$ ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP
    link/ether 00:1a:2b:3c:4d:5e brd ff:ff:ff:ff:ff:ff
    inet 192.168.10.37/24 brd 192.168.10.255 scope global dynamic eth0
    inet6 fe80::21a:2bff:fe3c:4d5e/64 scope link`),
      tabla(['Fragmento', 'Significado'], [
        ['`lo`', 'La interfaz de loopback (127.0.0.1). Siempre está.'],
        ['`eth0`', 'La primera interfaz Ethernet. En sistemas modernos puede llamarse `enp3s0`, `ens33`…; el Wi-Fi, `wlan0` o `wlp2s0`.'],
        ['`UP,LOWER_UP`', '`UP`: la interfaz está activada. `LOWER_UP`: hay enlace físico (cable conectado).'],
        ['`state UP` / `state DOWN`', 'Estado operativo. `DOWN` con el cable puesto apunta a un problema físico.'],
        ['`link/ether 00:1a:2b:3c:4d:5e`', 'La dirección MAC. Linux la escribe con dos puntos.'],
        ['`inet 192.168.10.37/24`', 'La dirección IPv4 **con el prefijo** en vez de la máscara.'],
        ['`dynamic`', 'La dirección vino de DHCP.'],
      ]),
      p(`En Linux la puerta de enlace no aparece en \`ip addr\`: está en la tabla de rutas.`),
      codigo('ip route', `$ ip route
default via 192.168.10.1 dev eth0 proto dhcp metric 100
192.168.10.0/24 dev eth0 proto kernel scope link src 192.168.10.37`),
      p(`La línea \`default via 192.168.10.1\` es la **puerta de enlace**. La segunda dice que la red 192.168.10.0/24 está conectada directamente por eth0. Los servidores DNS se guardan en el archivo \`/etc/resolv.conf\`.`),

      h('macOS y Linux antiguo: ifconfig'),
      codigo('ifconfig (macOS)', `$ ifconfig en0
en0: flags=8863<UP,BROADCAST,SMART,RUNNING,SIMPLEX,MULTICAST> mtu 1500
        ether 00:1a:2b:3c:4d:5e
        inet 192.168.10.37 netmask 0xffffff00 broadcast 192.168.10.255
        status: active`),
      p(`\`ifconfig\` es el comando clásico. En Linux está en desuso (lo sustituye \`ip\`), pero **macOS lo sigue usando**. Fíjate en dos detalles de macOS: la interfaz principal se llama \`en0\` y la máscara aparece **en hexadecimal** (\`0xffffff00\` = 255.255.255.0). \`status: active\` indica que hay enlace.`),
      tabla(['Quiero ver…', 'Windows', 'Linux', 'macOS'], [
        ['Dirección IP y máscara', '`ipconfig`', '`ip addr`', '`ifconfig`'],
        ['Todo, con MAC y DNS', '`ipconfig /all`', '`ip addr` + `/etc/resolv.conf`', '`ifconfig` + `scutil --dns`'],
        ['Puerta de enlace', '`ipconfig`', '`ip route`', '`netstat -rn`'],
        ['Tabla ARP', '`arp -a`', '`ip neigh`', '`arp -a`'],
        ['Renovar DHCP', '`ipconfig /renew`', '`dhclient` o reconectar', 'Preferencias de red'],
      ]),
      nota('aviso', `No confundas **\`ipconfig\`** (Windows) con **\`ifconfig\`** (Linux/macOS). Se diferencian en una letra y el examen juega con eso: \`ipconfig\` no existe en Linux, e \`ifconfig\` no existe en Windows.`),

      h('arp -a y netstat'),
      codigo('arp -a (Windows)', `C:\\> arp -a

Interfaz: 192.168.10.37 --- 0x4
  Dirección de Internet          Dirección física      Tipo
  192.168.10.1                   0c-1a-2b-3c-4d-01     dinámico
  192.168.10.50                  00-50-56-a1-0b-22     dinámico
  192.168.10.255                 ff-ff-ff-ff-ff-ff     estático`),
      p(`\`arp -a\` muestra la **tabla ARP**: las parejas IP–MAC que el equipo ha aprendido en su red local. Si la IP de la puerta de enlace aparece ahí con una MAC, el equipo **sí la alcanza en capa 2**. Si dos IP distintas muestran la misma MAC sin motivo, sospecha de un conflicto o de un ataque de suplantación ARP.

\`netstat\` muestra las conexiones y los puertos abiertos en el equipo; \`netstat -an\` los lista con números, y \`netstat -r\` muestra la tabla de rutas.`),

      h('nslookup: preguntar al DNS'),
      p(`\`nslookup\` hace una sola cosa: le pregunta a un servidor DNS **«¿qué dirección tiene este nombre?»** y muestra la respuesta. Existe en Windows, Linux y macOS.`),
      codigo('nslookup que funciona', `C:\\> nslookup www.example.com
Servidor:  dns.example.local
Address:  192.168.10.1

Respuesta no autoritativa:
Nombre:  www.example.com
Address:  203.0.113.10`),
      tabla(['Parte', 'Qué significa'], [
        ['`Servidor` / `Address` (arriba)', 'El servidor DNS **al que se preguntó**: el que tiene configurado el equipo.'],
        ['`Respuesta no autoritativa`', 'El servidor no es el dueño del dominio: contestó con lo que averiguó o tenía guardado. Es lo normal, **no es un error**.'],
        ['`Nombre` / `Address` (abajo)', 'La respuesta: el nombre y su dirección IP.'],
      ]),
      codigo('El nombre no existe', `C:\\> nslookup www.exmple.com
Servidor:  dns.example.local
Address:  192.168.10.1

*** dns.example.local no encuentra www.exmple.com: Non-existent domain`),
      p(`**Non-existent domain**: el servidor DNS **sí contestó**, y lo que dijo es «ese nombre no existe». El DNS funciona; el nombre está mal escrito o de verdad no existe.`),
      codigo('El servidor DNS no contesta', `C:\\> nslookup www.example.com
DNS request timed out.
    timeout was 2 seconds.
Servidor:  UnKnown
Address:  192.168.10.1

DNS request timed out.
    timeout was 2 seconds.
*** Se agotó el tiempo de espera de la solicitud a UnKnown`),
      p(`**Timed out**: aquí el servidor DNS **no contestó**. O está caído, o no hay conectividad hasta él, o la dirección del servidor DNS está mal configurada.`),
      p(`Puedes preguntar a **otro** servidor DNS escribiéndolo al final. Es la prueba decisiva para saber si el culpable es tu servidor DNS:`),
      codigo('Preguntar a un servidor concreto', `C:\\> nslookup www.example.com 8.8.8.8
Servidor:  dns.google
Address:  8.8.8.8

Respuesta no autoritativa:
Nombre:  www.example.com
Address:  203.0.113.10`),
      p(`En Linux y macOS existe además \`dig\`, más detallado. La respuesta está en la sección \`ANSWER SECTION\`:`),
      codigo('dig', `$ dig www.example.com

;; ANSWER SECTION:
www.example.com.        3600    IN      A       203.0.113.10

;; Query time: 18 msec
;; SERVER: 192.168.10.1#53(192.168.10.1)`),

      h('¿Es el DNS o es la conectividad?'),
      p(`Es la distinción más útil de toda la lección. El usuario dice lo mismo en los dos casos («no abre ninguna página»), pero la causa es totalmente distinta. Dos pings lo aclaran:`),
      tabla(['`ping 8.8.8.8`', '`ping www.example.com`', 'Conclusión'], [
        ['Responde', 'Responde', 'Todo bien: el problema está en la aplicación.'],
        ['**Responde**', '**No encuentra el host**', '**Fallo de DNS.** Hay Internet, pero no se traducen los nombres.'],
        ['No responde', 'No encuentra el host', 'Fallo de conectividad. El DNS no puede funcionar sin red: no es la causa.'],
      ]),
      ejemplo('medio', 'Hay Internet, pero no abre páginas', op('Una usuaria no puede abrir ninguna página web. Ejecutas las dos pruebas de abajo. ¿Cuál es la causa más probable?',
        ['El cable de red está desconectado', 'La puerta de enlace está apagada', 'La resolución de nombres (DNS) no funciona', 'El servidor web de example.com está caído'], 2,
        ['El ping a `8.8.8.8`, una dirección de Internet, **responde**. Eso descarta el cable, la tarjeta, la red local y la puerta de enlace: hay conectividad completa.',
          'El ping a `www.example.com` no falla por falta de respuesta: falla **antes de enviarse**, porque «no pudo encontrar el host». El equipo no consiguió traducir el nombre a una dirección.',
          'No es el servidor web: ni siquiera se llegó a saber su dirección. Es **DNS**. Siguiente paso: `ipconfig /all` para ver qué servidor DNS tiene, y `nslookup www.example.com 8.8.8.8` para probar con otro.'],
        { codigo: `C:\\> ping 8.8.8.8
Respuesta desde 8.8.8.8: bytes=32 tiempo=14ms TTL=117
Respuesta desde 8.8.8.8: bytes=32 tiempo=13ms TTL=117

C:\\> ping www.example.com
La solicitud de ping no pudo encontrar el host www.example.com.
Compruebe el nombre y vuelva a intentarlo.` })),
      ejemplo('dificil', 'Cuál servidor DNS falla', op('En el equipo de un usuario obtienes las dos salidas de abajo. ¿Qué concluyes?',
        ['No hay conexión a Internet', 'El servidor DNS interno 192.168.10.5 no responde; los nombres sí se resuelven con otro servidor', 'El nombre www.example.com no existe', 'La tarjeta de red está dañada'], 1,
        ['La primera consulta va al DNS configurado en el equipo, `192.168.10.5`, y **se agota el tiempo**: ese servidor no contesta.',
          'La segunda consulta pide lo mismo a `8.8.8.8` y **obtiene respuesta**. Eso demuestra dos cosas: hay conexión a Internet, y el nombre existe.',
          'La avería está acotada al servidor DNS interno: caído, inalcanzable o mal escrito en la configuración. Solución temporal: usar otro DNS. Solución real: revisar ese servidor, y escalar si no es tuyo.'],
        { codigo: `C:\\> nslookup www.example.com
DNS request timed out.
    timeout was 2 seconds.
Servidor:  UnKnown
Address:  192.168.10.5

*** Se agotó el tiempo de espera de la solicitud a UnKnown

C:\\> nslookup www.example.com 8.8.8.8
Servidor:  dns.google
Address:  8.8.8.8

Respuesta no autoritativa:
Nombre:  www.example.com
Address:  203.0.113.10` })),

      h('Resumen'),
      lista(
        'Cuatro datos: **IP, máscara, puerta de enlace y DNS**.',
        'Windows: `ipconfig` (resumen) e `ipconfig /all` (MAC, DHCP, DNS). Linux: `ip addr` e `ip route`. macOS: `ifconfig`.',
        '**169.254.x.x** = APIPA = el equipo no recibió respuesta del DHCP.',
        'La puerta de enlace **debe estar en la misma subred** que el equipo. La IP no puede ser la de red ni la de broadcast.',
        '`nslookup nombre` pregunta al DNS. «Non-existent domain» = el DNS contestó que no existe. «Timed out» = el DNS no contestó.',
        'Responde por IP pero no por nombre → **DNS**. No responde ni por IP → **conectividad**.',
      ),

      ejercicios('Practica', 'En los ejercicios de configuración, calcula primero la red con la máscara y después comprueba la IP y la puerta de enlace.', [
        cfg('192.168.1.50', 24, '192.168.1.1', '8.8.8.8'), cfg('169.254.12.200', 16, '', ''), cfg('10.0.5.40', 24, '10.0.6.1', '1.1.1.1', false), cfg('172.16.8.20', 24, '', '8.8.8.8', false),
        cfg('192.168.20.14', 24, '192.168.20.1', '', false), cfg('192.168.30.0', 24, '192.168.30.1', '8.8.8.8', false), cfg('192.168.40.130', 25, '192.168.40.1', '9.9.9.9', false), cfg('10.10.30.191', 26, '10.10.30.129', '1.1.1.1', false),
        cfg('192.168.60.100', 27, '192.168.60.97', '192.168.60.97'),
        cmd('win-ip'), cmd('win-all'), cmd('win-release'), cmd('win-renew'), cmd('win-flush'), cmd('lin-ip'), cmd('lin-route'), cmd('mac-ifconfig'), cmd('win-arp'), cmd('win-nslookup', '192.168.1.1', 'intranet.example.com'), cmd('lin-dig', '192.168.1.1', 'correo.example.net'), cmd('lin-neigh'),
        op('¿Qué comando de Windows muestra la dirección MAC del adaptador y los servidores DNS?', ['`ipconfig`', '`ipconfig /all`', '`ifconfig`', '`ping -t`'], 1, '`ipconfig` solo da IP, máscara y puerta de enlace. La MAC, el DHCP y los DNS aparecen con `/all`. `ifconfig` no existe en Windows.'),
        op('Un equipo muestra la dirección 169.254.20.9 con máscara 255.255.0.0. ¿Qué pasó?', ['Alguien la configuró a mano', 'Pidió una dirección por DHCP y no recibió respuesta', 'El DNS falló', 'Es una dirección pública válida'], 1, '169.254.0.0/16 es el rango APIPA: el equipo se autoasigna una cuando el DHCP no contesta.'),
        op('Un equipo tiene IP 192.168.5.20/24 y puerta de enlace 192.168.6.1. ¿Qué síntoma tendrá?', ['No podrá comunicarse con nadie', 'Alcanzará a los equipos de su red local, pero no a otras redes', 'Funcionará todo con normalidad', 'Solo fallará el DNS'], 1, 'La puerta de enlace no está en 192.168.5.0/24, así que el equipo no puede entregarle tramas. La red local sigue funcionando.'),
        op('En la salida de `nslookup`, ¿qué significa «Respuesta no autoritativa»?', ['Que la respuesta es falsa', 'Que el servidor consultado no es el dueño del dominio y respondió con datos obtenidos de otros o guardados', 'Que el DNS está caído', 'Que el nombre no existe'], 1, 'Es el caso normal al preguntar a un servidor DNS que resuelve por ti. No indica ningún error.'),
        op('`nslookup` devuelve «Non-existent domain». ¿Qué significa?', ['El servidor DNS no respondió', 'El servidor DNS respondió que ese nombre no existe', 'No hay conexión a Internet', 'La tarjeta de red está desactivada'], 1, 'Hubo respuesta: el DNS funciona. Hay que revisar cómo está escrito el nombre.'),
        op('En Linux, ¿qué línea de `ip route` indica la puerta de enlace?', ['La que empieza por `default via`', 'La que contiene `scope link`', 'La de la interfaz `lo`', 'La que contiene `link/ether`'], 0, '`default via 192.168.10.1 dev eth0` es la ruta por defecto: el router al que se envía todo lo que no es local.'),
        vs('`ping 8.8.8.8` responde, pero `ping www.example.com` dice que no encuentra el host. ¿Qué DOS acciones son las siguientes más lógicas?', ['Revisar qué servidor DNS tiene configurado el equipo con `ipconfig /all`', 'Cambiar el cable de red', 'Probar `nslookup www.example.com 8.8.8.8`', 'Reemplazar el switch', 'Reinstalar el controlador de la tarjeta'], [0, 2], 'La conectividad funciona; falla la resolución. Se revisa el DNS configurado y se prueba con otro servidor. El cable, el switch y la tarjeta están descartados por el ping que respondió.'),
        rel('Relaciona cada comando con el sistema operativo donde se usa.', [
          ['ipconfig /all', 'Windows'],
          ['ip addr', 'Linux'],
          ['ifconfig en0', 'macOS'],
        ], '`ipconfig` es de Windows, `ip` es el comando moderno de Linux e `ifconfig` sigue vigente en macOS, donde la interfaz principal es `en0`.', ['Cisco IOS']),
        ord('Un equipo tiene una dirección APIPA. Ya reconectaste el cable que estaba suelto. Ordena lo que haces a continuación.', ['Ejecutar ipconfig /release', 'Ejecutar ipconfig /renew', 'Comprobar con ipconfig que la dirección ya no empieza por 169.254', 'Hacer ping a la puerta de enlace'], 'Se libera la dirección, se pide una nueva, se comprueba que ahora es válida y se verifica la conectividad empezando por la puerta de enlace.'),
      ]),
    ],
  },
];
