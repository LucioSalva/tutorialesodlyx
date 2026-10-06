// Seguridad de redes · lecciones 1 a 4: tríada CIA, amenazas, identidad y cifrado.
import { h, h3, p, lista, orden, tabla, nota, formula, ejemplo, ejercicios, op, vs, rel, ord } from './_ayuda.mjs';

export const cia = (caso) => ({ tipo: 'sg-cia', caso });
export const rg = (caso) => ({ tipo: 'sg-riesgo', caso });
export const atq = (caso) => ({ tipo: 'sg-ataque', caso });
export const aaa = (caso) => ({ tipo: 'sg-aaa', caso });
export const fac = (...metodos) => ({ tipo: 'sg-factores', metodos });
export const clv = (largo, juego, largo2, juego2) => ({ tipo: 'sg-claves', largo, juego, largo2, juego2 });
export const cif = (caso) => ({ tipo: 'sg-cifrado', caso });
export const pro = (caso) => ({ tipo: 'sg-protocolo', caso });

export default [
  /* ------------------------------------------------------------------ 1 */
  {
    slug: 'fundamentos-de-seguridad-cia',
    titulo: 'Fundamentos de seguridad: la tríada CIA',
    resumen: 'Qué significa que una red sea segura: confidencialidad, integridad y disponibilidad, el vocabulario del riesgo y la idea de defender por capas.',
    nivel: 'facil',
    objetivos: [
      'Explicar confidencialidad, integridad y disponibilidad con ejemplos propios.',
      'Distinguir activo, amenaza, vulnerabilidad, exploit, riesgo y mitigación.',
      'Describir la defensa en profundidad y el principio de mínimo privilegio.',
      'Reconocer por qué la seguridad física también es seguridad de red.',
    ],
    bloques: [
      h('¿Qué significa «seguro»?'),
      p(`Cuando alguien dice «esta red es segura», casi siempre piensa en una sola cosa: que nadie pueda entrar a robar. Pero esa es solo una parte. Imagina una clínica:

Si un extraño lee los expedientes de los pacientes, hay un problema de seguridad. Si alguien cambia la dosis de un medicamento en un expediente, también, aunque nadie haya «robado» nada. Y si el sistema se cae y los médicos no pueden consultar ningún expediente, el daño es igual de real.`),
      p(`Son tres problemas distintos, y cada uno tiene nombre. Juntos forman la **tríada CIA**, por sus iniciales en inglés: *Confidentiality*, *Integrity*, *Availability*. Es el punto de partida de toda la seguridad de la información y aparece en el examen CCST.`),
      tabla(['Propiedad', 'Pregunta que responde', 'En la clínica'], [
        ['**Confidencialidad**', '¿Quién puede **verlo**?', 'Solo el personal médico lee los expedientes.'],
        ['**Integridad**', '¿Es **exacto**? ¿Alguien lo cambió?', 'La dosis anotada es la que recetó el médico.'],
        ['**Disponibilidad**', '¿**Funciona** cuando lo necesito?', 'El sistema responde cuando llega una urgencia.'],
      ]),
      nota('clave', `Para saber cuál de las tres está en juego, fíjate en el verbo: **ver** sin permiso es confidencialidad, **cambiar** sin permiso es integridad y **no poder usar** es disponibilidad.`),

      h('Confidencialidad: que solo lo vea quien debe'),
      p(`La confidencialidad se rompe cuando la información llega a ojos que no deberían verla. No hace falta que el intruso borre o cambie nada: basta con que **lea**.`),
      tabla(['Cómo se pierde', 'Qué la protege'], [
        ['Alguien captura el tráfico de una red Wi-Fi abierta', '**Cifrado**: HTTPS, VPN, WPA2 o WPA3'],
        ['Se pierde una computadora portátil o una memoria USB', '**Cifrado del disco**'],
        ['Un empleado abre una carpeta que no es de su área', '**Permisos** y control de acceso'],
        ['Alguien adivina o roba una contraseña', '**Contraseñas fuertes** y autenticación multifactor'],
        ['Alguien mira tu pantalla por encima del hombro', 'Bloquear la sesión, filtros de privacidad'],
      ]),
      ejemplo('facil', 'Una sesión abierta', cia('correo-leido')),
      ejemplo('facil', 'Una medida que protege', cia('c-cifrado')),

      h('Integridad: que nadie lo cambie sin permiso'),
      p(`La integridad significa que los datos son **correctos y completos**: lo que se guardó es lo que se lee, y lo que se envió es lo que llega. Se pierde cuando algo cambia sin autorización, ya sea por un ataque o por un simple error (un archivo que se corrompe al copiarse también pierde integridad).`),
      tabla(['Cómo se pierde', 'Qué la protege'], [
        ['Alguien modifica un registro de la base de datos', 'Permisos de escritura limitados, registro de cambios'],
        ['Un archivo se altera al descargarse', '**Hash**: comparar la «huella» del archivo (SHA-256)'],
        ['Alguien cambia un documento ya aprobado', '**Firma digital**'],
        ['Un técnico cambia una configuración por error', 'Control de cambios y copias de respaldo de la configuración'],
      ]),
      ejemplo('facil', 'Un dato que ya no es cierto', cia('nomina-alterada')),
      ejemplo('medio', 'Comprobar una descarga', cia('c-hash')),

      h('Disponibilidad: que funcione cuando hace falta'),
      p(`De nada sirve un sistema secreto y exacto si está apagado. La disponibilidad es que los usuarios autorizados puedan usar los datos y los servicios **cuando los necesitan**. Es la propiedad que más toca a un técnico de soporte, porque no solo la rompen los atacantes: también los apagones, las averías, los cables cortados y los errores humanos.`),
      tabla(['Cómo se pierde', 'Qué la protege'], [
        ['Un ataque de denegación de servicio satura el servidor', 'Firewalls, servicios de mitigación, ancho de banda de sobra'],
        ['Se va la luz', '**UPS** (batería de respaldo) y generador'],
        ['Se avería un disco o un switch', '**Redundancia**: discos en espejo, equipos y enlaces duplicados'],
        ['Un ransomware cifra los archivos', '**Copias de seguridad** probadas y guardadas aparte'],
        ['Un fallo de software tumba el servicio', 'Actualizaciones y mantenimiento'],
      ]),
      ejemplo('facil', 'Sin atacante, pero sin servicio', cia('corte-luz')),
      ejemplo('medio', 'El ransomware', cia('ransomware'), 'El ransomware puede además robar datos (confidencialidad), pero su efecto inmediato y característico es impedir el uso de los archivos.'),
      nota('aviso', `Las tres propiedades a veces tiran en direcciones contrarias. Pedir diez contraseñas protege la confidencialidad, pero si nadie logra entrar a trabajar, se pierde disponibilidad. La seguridad consiste en **equilibrar** las tres según lo que necesita la organización.`),

      h('El vocabulario del riesgo'),
      p(`En seguridad hay seis palabras que se usan con mucha precisión y que la gente suele mezclar. Piénsalas con una casa:`),
      tabla(['Término', 'Qué es', 'En una casa', 'En una red'], [
        ['**Activo**', 'Lo que tiene valor y hay que proteger', 'La televisión, los documentos', 'Los datos de clientes, el servidor'],
        ['**Amenaza**', 'Lo que **podría** causar daño', 'Un ladrón, un incendio', 'Un delincuente, un malware, un apagón'],
        ['**Vulnerabilidad**', 'Una **debilidad**', 'Una ventana que no cierra', 'Un sistema sin actualizar, una contraseña de fábrica'],
        ['**Exploit**', 'Lo que **aprovecha** la debilidad', 'La palanca con la que abre la ventana', 'El programa que usa ese fallo'],
        ['**Riesgo**', 'Probabilidad de que ocurra × daño que causaría', 'Vivir en planta baja sin rejas', 'Servidor público sin parches'],
        ['**Mitigación**', 'Una medida que reduce el riesgo', 'Arreglar la ventana, poner alarma', 'Instalar el parche, activar MFA'],
      ]),
      formula('Riesgo = probabilidad × impacto', [['probabilidad', 'qué tan fácil es que una amenaza aproveche una vulnerabilidad'], ['impacto', 'cuánto daño causaría si ocurre']], 'No todo se puede proteger al máximo: se atiende primero lo que tiene más riesgo.'),
      nota('clave', `La frase que une todo: una **amenaza** usa un **exploit** para aprovechar una **vulnerabilidad** y dañar un **activo**. La **mitigación** rompe esa cadena. Sin vulnerabilidad, la amenaza sigue existiendo, pero no puede hacer daño.`),
      ejemplo('facil', 'Una debilidad', rg('v-clave-fabrica')),
      ejemplo('facil', 'Un peligro', rg('t-inundacion')),
      ejemplo('medio', 'El instrumento del ataque', rg('e-programa')),
      ejemplo('medio', 'Una medida', rg('m-respaldo')),

      h('Defensa en profundidad'),
      p(`Ninguna medida de seguridad es perfecta. Por eso no se confía en una sola: se colocan **varias capas**, de modo que si una falla, la siguiente detenga el problema. Es la idea de un castillo: foso, muralla, puerta, guardias y, al final, la caja fuerte.`),
      tabla(['Capa', 'Ejemplos'], [
        ['Física', 'Cuarto de equipos con llave, cámaras, control de visitas'],
        ['Perímetro de la red', 'Firewall entre la red interna e Internet'],
        ['Red interna', 'VLAN separadas, Wi-Fi con WPA3, puertos sin uso apagados'],
        ['Equipo', 'Antivirus, actualizaciones, firewall del sistema operativo'],
        ['Aplicación y datos', 'Permisos, cifrado, copias de seguridad'],
        ['Personas', 'Capacitación, políticas, contraseñas fuertes y MFA'],
      ]),
      ejemplo('medio', 'Por qué no basta con el firewall', op('Una empresa tiene un firewall muy bueno en su conexión a Internet. Una empleada conecta una memoria USB infectada que encontró en el estacionamiento y el malware se extiende por la red interna. ¿Qué principio habría limitado el daño?', ['Usar un firewall más caro', 'Defensa en profundidad: más capas de protección además del perímetro', 'Cambiar de proveedor de Internet', 'Ocultar el nombre de la red Wi-Fi'], 1, [
        'El malware no llegó desde Internet: entró por un puerto USB. El firewall del perímetro nunca vio ese tráfico, así que no pudo hacer nada.',
        'Con capas adicionales el ataque se habría frenado en varios puntos: capacitación (no conectar memorias desconocidas), antivirus en el equipo, puertos USB restringidos y VLAN que impidan que una computadora de oficina alcance los servidores.',
        'Eso es la **defensa en profundidad**: no depender de un solo control.',
      ])),

      h('Mínimo privilegio'),
      p(`El **principio de mínimo privilegio** dice que cada persona, cada programa y cada equipo debe tener **solo los permisos que necesita para su trabajo, y ninguno más**. La recepcionista no necesita entrar a la configuración del router; el técnico de nivel 1 no necesita leer la nómina.`),
      p(`¿Por qué importa? Porque cuando una cuenta cae en malas manos (por phishing, por ejemplo), el atacante hereda exactamente los permisos de esa cuenta. Cuantos menos tenga, menos daño puede hacer.`),
      nota('error', `Un error clásico es trabajar todo el día con una cuenta de administrador «para no tener problemas». Si ese usuario abre un adjunto malicioso, el malware se ejecuta con permisos totales. Lo correcto es usar una cuenta normal y elevar privilegios solo cuando hace falta.`),

      h('La seguridad física también cuenta'),
      p(`Quien puede **tocar** un equipo de red puede hacer casi cualquier cosa con él: conectarse por el puerto de consola, desenchufarlo, reiniciarlo para recuperar la contraseña o simplemente llevárselo. Por eso la primera capa de la seguridad es física:`),
      lista(
        'Los switches, routers y servidores van en **cuartos o racks con llave**.',
        'El acceso se limita a personal autorizado y se **registra** quién entra.',
        'Las tomas de red de zonas públicas (salas de espera, pasillos) se desactivan o se ponen en una red de invitados.',
        'Las pantallas se **bloquean** al levantarse del escritorio.',
        'Los equipos y discos que se desechan se **borran** de forma segura antes de salir del edificio.',
      ),
      ejemplo('medio', 'La puerta abierta', rg('v-puerta')),

      h('Resumen'),
      lista(
        '**CIA**: confidencialidad (ver), integridad (cambiar), disponibilidad (usar).',
        'Una **amenaza** aprovecha una **vulnerabilidad** con un **exploit** para dañar un **activo**. La **mitigación** reduce el **riesgo**.',
        '**Defensa en profundidad**: varias capas, porque ninguna es perfecta.',
        '**Mínimo privilegio**: solo los permisos necesarios.',
        'Sin **seguridad física**, lo demás se puede saltar.',
      ),

      ejercicios('Practica: la tríada CIA', 'Decide qué propiedad se afecta o se protege. Fíjate en el verbo: ver, cambiar o no poder usar.', [
        cia('wifi-espia'), cia('usb-perdida'), cia('archivo-corrupto'), cia('ddos-tienda'), cia('web-desfigurada'), cia('disco-roto'),
        cia('c-vpn'), cia('c-permisos'), cia('c-firma'), cia('c-ups'), cia('c-respaldo'), cia('dns-falso'),
      ]),
      ejercicios('Practica: vocabulario y principios', 'Activo, amenaza, vulnerabilidad, exploit o mitigación. Después, preguntas de concepto.', [
        rg('a-clientes'), rg('t-delincuente'), rg('v-parche'), rg('m-parchear'), rg('e-macro'), rg('v-sin-capacitacion'), rg('m-mfa'), rg('t-empleado'),
        op('¿Qué significan las siglas CIA en seguridad de la información?', ['Control, Identidad y Acceso', 'Confidencialidad, Integridad y Disponibilidad', 'Cifrado, Internet y Autenticación', 'Copia, Inspección y Auditoría'], 1, 'Vienen del inglés Confidentiality, Integrity, Availability: las tres propiedades que la seguridad debe proteger.'),
        op('Un becario tiene permisos de administrador en todos los servidores «por si acaso». ¿Qué principio se está incumpliendo?', ['Defensa en profundidad', 'Disponibilidad', 'Mínimo privilegio', 'Integridad'], 2, 'Cada cuenta debe tener solo los permisos que su trabajo requiere. Si roban esa cuenta, el atacante obtiene acceso total.'),
        op('¿Cuál de estas situaciones describe mejor la defensa en profundidad?', ['Comprar el firewall más caro del mercado', 'Combinar firewall, antivirus, VLAN, copias de seguridad y capacitación', 'Usar la misma contraseña larga en todos los equipos', 'Desconectar la red de Internet por las noches'], 1, 'Defensa en profundidad es apilar varios controles distintos para que el fallo de uno no deje todo expuesto.'),
        vs('¿Cuáles **dos** medidas protegen principalmente la **disponibilidad**?', ['Cifrar los discos', 'Instalar un UPS en el rack', 'Calcular el hash de los archivos', 'Tener un segundo enlace a Internet', 'Exigir contraseñas largas'], [1, 3], 'El UPS mantiene los equipos encendidos durante un apagón y el segundo enlace mantiene la conexión si el primero falla. El cifrado y las contraseñas protegen la confidencialidad; el hash, la integridad.'),
        rel('Relaciona cada medida con la propiedad que protege principalmente.', [['Cifrado del tráfico con una VPN', 'Confidencialidad'], ['Firma digital de un documento', 'Integridad'], ['Discos en espejo (RAID 1)', 'Disponibilidad'], ['Permisos de lectura por departamento', 'Confidencialidad']], 'Cifrar y limitar quién lee protegen la confidencialidad; la firma detecta cambios (integridad); los discos duplicados mantienen el servicio (disponibilidad).'),
        op('Una contraseña de fábrica sin cambiar en un punto de acceso es…', ['una amenaza', 'una vulnerabilidad', 'un exploit', 'un activo'], 1, 'Es una debilidad del equipo. La amenaza sería la persona que la aproveche.'),
        op('¿Por qué el cuarto de comunicaciones debe estar cerrado con llave?', ['Para que los equipos no se calienten', 'Porque quien tiene acceso físico a un equipo puede saltarse casi cualquier control lógico', 'Porque lo exige el estándar Ethernet', 'Para ahorrar energía'], 1, 'Con acceso físico se puede usar el puerto de consola, reiniciar el equipo para recuperar contraseñas, conectar dispositivos o llevárselo.'),
        op('Una empresa calcula que un fallo es poco probable pero causaría pérdidas enormes, y otro es muy probable pero casi no causa daño. ¿Qué concepto está aplicando?', ['Riesgo: probabilidad por impacto', 'Mínimo privilegio', 'Autenticación multifactor', 'No repudio'], 0, 'El riesgo combina qué tan probable es un incidente con cuánto daño causaría. Sirve para decidir qué proteger primero.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 2 */
  {
    slug: 'amenazas-y-ataques',
    titulo: 'Amenazas y ataques: cómo reconocerlos',
    resumen: 'Los tipos de malware, el phishing y sus variantes, la ingeniería social, la denegación de servicio y los ataques a contraseñas: qué señal delata a cada uno y qué hacer.',
    nivel: 'facil',
    objetivos: [
      'Diferenciar virus, gusano, troyano, ransomware, spyware, adware, rootkit y botnet.',
      'Reconocer phishing, spear phishing, whaling, vishing y smishing.',
      'Explicar qué son un ataque DoS, un DDoS y un ataque de intermediario.',
      'Saber qué debe hacer un técnico de soporte ante un incidente.',
    ],
    bloques: [
      h('Por qué estudiar los ataques'),
      p(`Un técnico de soporte no necesita saber atacar, pero sí **reconocer** un ataque cuando lo tiene delante. La mayoría de los incidentes llegan a la mesa de ayuda disfrazados de quejas normales: «mi computadora está lenta», «no puedo abrir mis archivos», «me llegó un correo raro del banco». Quien sabe ponerle nombre al problema sabe también a quién avisar y qué no tocar.`),
      p(`Las amenazas se agrupan en tres grandes familias:`),
      tabla(['Familia', 'A quién ataca', 'Ejemplos'], [
        ['**Malware**', 'Al equipo: es software malicioso', 'Virus, gusano, troyano, ransomware, spyware'],
        ['**Ingeniería social**', 'A la persona: la engaña', 'Phishing, vishing, smishing, suplantación'],
        ['**Ataques de red**', 'Al servicio o a la comunicación', 'DoS y DDoS, intermediario, fuerza bruta'],
      ]),

      h('Malware: software malicioso'),
      p(`**Malware** es cualquier programa hecho para dañar, espiar o tomar el control de un equipo sin permiso de su dueño. Hay varios tipos y el examen espera que los distingas. La clave casi siempre está en **cómo se propaga** o en **qué busca**.`),
      tabla(['Tipo', 'Cómo lo reconoces', 'Detalle que lo distingue'], [
        ['**Virus**', 'Se pega a archivos o programas legítimos', 'Necesita que **alguien abra** el archivo infectado'],
        ['**Gusano**', 'Salta de equipo en equipo por la red', 'Se propaga **solo**, sin que nadie haga nada'],
        ['**Troyano**', 'Parece un programa útil o un juego', 'La víctima lo **instala por su voluntad**'],
        ['**Ransomware**', 'Cifra los archivos y muestra una nota', 'Pide un **rescate** para devolverlos'],
        ['**Spyware**', 'No se nota; envía tus datos a un tercero', '**Espía**: teclas, contraseñas, historial'],
        ['**Adware**', 'Publicidad que aparece sin parar', 'Busca **mostrar anuncios**'],
        ['**Rootkit**', 'Se esconde en lo más profundo del sistema', '**Oculta** su presencia y la de otro malware'],
        ['**Botnet**', 'Muchos equipos infectados obedecen a un mando', 'Red de **«zombis»** controlada a distancia'],
      ]),
      nota('truco', `Para no confundir virus y gusano, piensa en la gripe y en una carta en cadena. El **virus** necesita un «portador» (un archivo) y que alguien lo abra. El **gusano** viaja solo por la red aprovechando fallos, y por eso se extiende tan rápido.`),
      ejemplo('facil', 'Se propaga sin ayuda', atq('se-propaga-solo')),
      ejemplo('facil', 'El programa «gratis»', atq('juego-gratis')),
      ejemplo('facil', 'Archivos secuestrados', atq('archivos-cifrados'), 'Las recomendaciones habituales: desconectar el equipo de la red, avisar al equipo de seguridad y no pagar; pagar no garantiza recuperar nada. La defensa real es tener copias de seguridad probadas.'),

      h('Ingeniería social: atacar a la persona'),
      p(`Es más fácil engañar a una persona que romper un cifrado. La **ingeniería social** es manipular a alguien para que haga algo que no debería: revelar una contraseña, abrir un adjunto, dejar pasar a un desconocido o hacer una transferencia.`),
      p(`Casi todos estos engaños usan las mismas palancas psicológicas:`),
      lista(
        '**Urgencia**: «su cuenta se cerrará en 24 horas».',
        '**Autoridad**: «le habla el director», «somos de soporte técnico».',
        '**Miedo**: «detectamos un cargo no reconocido».',
        '**Curiosidad o premio**: «ganó un sorteo», una memoria USB que dice «Nóminas».',
        '**Amabilidad**: alguien con las manos ocupadas que pide que le sostengan la puerta.',
      ),

      h3('Phishing y sus variantes'),
      p(`El **phishing** es el engaño más común: un mensaje que **suplanta a una entidad de confianza** (el banco, la paquetería, el área de sistemas) para que la víctima entregue sus credenciales o abra algo malicioso. Las variantes cambian **a quién** va dirigido o **por qué canal** llega:`),
      tabla(['Nombre', 'Canal', 'A quién va dirigido', 'Ejemplo'], [
        ['**Phishing**', 'Correo', 'A miles de personas, mensaje genérico', '«Su cuenta fue bloqueada, entre aquí»'],
        ['**Spear phishing**', 'Correo', 'A **una persona concreta**, con datos reales', '«Hola Abigail, te mando la factura del proveedor»'],
        ['**Whaling**', 'Correo', 'A un **alto directivo**', 'Al director: «autorice esta transferencia urgente»'],
        ['**Vishing**', '**Voz** (teléfono)', 'Quien conteste', '«Soy de soporte, dígame su contraseña»'],
        ['**Smishing**', '**SMS** o mensajería', 'Quien lo reciba', '«Cargo no reconocido, entre a este enlace»'],
      ]),
      nota('clave', `Señales de un correo de phishing: remitente con un dominio raro o parecido al real, saludo genérico, urgencia, faltas de ortografía, un enlace cuya dirección real no coincide con el texto (se ve al pasar el cursor por encima) y adjuntos que nadie pidió. **Ningún banco ni área de sistemas pide la contraseña por correo o por teléfono.**`),
      ejemplo('facil', 'El correo masivo', atq('banco-masivo')),
      ejemplo('medio', 'Hecho a la medida', atq('contadora')),
      ejemplo('medio', 'Por teléfono', atq('llamada-soporte')),

      h3('Ingeniería social cara a cara'),
      tabla(['Técnica', 'En qué consiste'], [
        ['**Tailgating** (colarse)', 'Entrar a una zona restringida pegado a alguien autorizado.'],
        ['**Suplantación**', 'Hacerse pasar por técnico, repartidor o inspector.'],
        ['**Baiting** (cebo)', 'Dejar memorias USB infectadas donde alguien las encuentre.'],
        ['**Shoulder surfing**', 'Mirar la pantalla o el teclado de otro por encima del hombro.'],
        ['**Dumpster diving**', 'Buscar información útil en la basura (papeles, discos).'],
      ]),
      ejemplo('medio', 'La puerta sostenida', atq('sin-gafete')),

      h('Ataques contra la disponibilidad: DoS y DDoS'),
      p(`Un ataque de **denegación de servicio (DoS)** no busca robar nada: busca que un servicio **deje de funcionar**. Lo consigue saturándolo con más peticiones de las que puede atender, como si mil personas llamaran al mismo tiempo a una pizzería solo para que los clientes de verdad encuentren la línea ocupada.`),
      tabla(['', 'DoS', 'DDoS'], [
        ['Origen', 'Un solo equipo', 'Miles de equipos a la vez (una **botnet**)'],
        ['Cómo se frena', 'Bloqueando esa dirección IP', 'Mucho más difícil: no hay una sola IP que bloquear'],
        ['La «D» extra', '—', '*Distributed*: distribuido'],
      ]),
      ejemplo('medio', 'Miles de orígenes', atq('inundacion-web')),

      h('Ataque de intermediario (on-path)'),
      p(`En un ataque de **intermediario** (en inglés *on-path*, antes llamado «hombre en el medio»), el atacante se coloca **entre** dos partes que se comunican. Las víctimas creen que hablan directamente entre sí, pero todo pasa por el atacante, que puede **leer** el tráfico (confidencialidad) o **modificarlo** (integridad).`),
      p(`El escenario típico es una red Wi-Fi falsa con el mismo nombre que la del aeropuerto o la cafetería. La defensa principal es el **cifrado de extremo a extremo**: con HTTPS o una VPN, el intermediario solo ve datos ilegibles, y si intenta suplantar al sitio, el navegador muestra un aviso de certificado.`),
      ejemplo('medio', 'La red Wi-Fi gemela', atq('wifi-falso')),

      h('Ataques a contraseñas'),
      tabla(['Ataque', 'Qué hace', 'Qué lo frena'], [
        ['**Fuerza bruta**', 'Prueba **todas** las combinaciones posibles', 'Contraseñas largas, bloqueo tras varios fallos'],
        ['**Diccionario**', 'Prueba una **lista** de palabras y contraseñas comunes', 'No usar palabras ni contraseñas típicas'],
        ['**Relleno de credenciales**', 'Prueba usuarios y contraseñas filtrados de otro sitio', 'No repetir contraseñas; MFA'],
      ]),
      ejemplo('medio', 'La lista de las más comunes', atq('lista-claves')),

      h('Reconocimiento'),
      p(`Antes de atacar, un intruso **observa**: qué direcciones responden, qué puertos están abiertos, qué versión de software corre en cada servidor, quién trabaja en la empresa. Esa fase se llama **reconocimiento**. Por sí sola no daña nada, pero es la señal de que alguien está preparando algo, y por eso los firewalls registran los escaneos de puertos.`),

      h('Qué hace un técnico ante un incidente'),
      p(`Como técnico de soporte, no eres quien investiga el ataque: eres quien lo **detecta primero** y evita que empeore. Sigue siempre la política de tu organización; en general, el orden es este:`),
      orden(
        '**No interactúes** con lo sospechoso: no abras el adjunto, no entres al enlace, no respondas al mensaje.',
        '**Aísla** el equipo afectado: desconéctalo de la red (cable y Wi-Fi) para que el malware no se propague. No lo apagues ni lo formatees si no te lo indican: se pierde evidencia.',
        '**Reporta** de inmediato por el canal oficial (equipo de seguridad, tu supervisor, el sistema de tickets).',
        '**Documenta** lo que viste: fecha, hora, usuario, equipo, mensajes en pantalla, qué se hizo.',
        '**No pagues** rescates ni negocies por tu cuenta, y no intentes «limpiar» el equipo sin autorización.',
      ),
      nota('aviso', `Si un usuario reconoce que hizo clic en un enlace o dio su contraseña, **agradécele que avise**. Regañarlo solo consigue que la próxima vez lo oculte, y cada minuto de retraso le da ventaja al atacante. Lo primero: cambiar esa contraseña y reportar.`),
      ejemplo('dificil', 'Un incidente en la mesa de ayuda', ord('Una usuaria llama: abrió un adjunto y ahora sus archivos tienen una extensión extraña y aparece una nota que pide un pago. Ordena lo que debe hacer el técnico.', ['Pedirle que no toque nada más y desconectar el equipo de la red', 'Reportar el incidente al equipo de seguridad por el canal oficial', 'Documentar en el ticket lo ocurrido: hora, equipo, mensaje y acciones', 'Esperar instrucciones para restaurar desde las copias de seguridad'], [
        'Lo primero es **contener**: el ransomware busca carpetas compartidas y otros equipos. Desconectar el cable y el Wi-Fi corta esa vía.',
        'Después se **escala**: el equipo de seguridad decide cómo investigar y si hay más equipos afectados.',
        'Se **documenta** mientras los detalles están frescos; el ticket es la memoria del incidente.',
        'La recuperación llega al final y la autoriza quien dirige la respuesta. No se paga el rescate: los archivos se restauran desde copias de seguridad.',
      ])),

      h('Resumen'),
      lista(
        'Virus: necesita que abras un archivo. Gusano: se propaga solo. Troyano: se disfraza. Ransomware: pide rescate. Spyware: espía.',
        'Phishing: correo masivo. Spear phishing: a una persona. Whaling: a un directivo. Vishing: por voz. Smishing: por SMS.',
        'DoS: un origen. DDoS: miles de orígenes (botnet).',
        'Intermediario: se coloca en medio. Se frena con cifrado.',
        'Ante un incidente: no interactuar, aislar, reportar, documentar.',
      ),

      ejercicios('Practica: ponle nombre', 'Lee el escenario y busca el detalle que lo delata.', [
        atq('paqueteria'), atq('sms-banco'), atq('director'), atq('teclas'), atq('anuncios'), atq('macro-infectada'), atq('un-solo-origen'), atq('arp-falso'),
        atq('todas-las-claves'), atq('usb-estacionamiento'), atq('escaneo'), atq('correo-basura'), atq('equipos-zombi'),
      ]),
      ejercicios('Practica: conceptos y reacción', 'Preguntas al estilo del examen.', [
        op('¿Cuál es la diferencia principal entre un virus y un gusano?', ['El virus es más reciente', 'El gusano se propaga solo por la red; el virus necesita que alguien ejecute un archivo infectado', 'El virus solo afecta a teléfonos', 'El gusano siempre pide un rescate'], 1, 'El gusano aprovecha fallos para saltar de equipo en equipo sin intervención humana. El virus viaja pegado a un archivo y se activa cuando alguien lo abre.'),
        op('Un usuario recibe un correo «de sistemas» que le pide confirmar su contraseña en un enlace. ¿Qué debe hacer?', ['Entrar al enlace para comprobar si es real', 'Responder al correo preguntando si es legítimo', 'No hacer clic y reportarlo por el canal oficial', 'Reenviarlo a todos sus compañeros para avisarles'], 2, 'Nunca se interactúa con el mensaje sospechoso. Responder confirma que la cuenta existe, y reenviarlo multiplica el riesgo. Se reporta para que seguridad lo bloquee.'),
        vs('¿Cuáles **dos** son señales típicas de un correo de phishing?', ['El remitente usa un dominio parecido pero distinto al real', 'El correo llega en horario de oficina', 'Pide actuar con urgencia para no perder la cuenta', 'Incluye el logotipo de la empresa', 'Está escrito en español'], [0, 2], 'Un dominio que imita al real y la presión de tiempo son las señales más fiables. El logotipo se copia con facilidad, así que no prueba nada.'),
        rel('Relaciona cada variante con su característica.', [['Vishing', 'Llega por una llamada de voz'], ['Smishing', 'Llega por mensaje de texto'], ['Whaling', 'Se dirige a un alto directivo'], ['Spear phishing', 'Está personalizado para una persona concreta']], 'Vishing = voz, smishing = SMS, whaling = «pez gordo», spear = «arpón», dirigido a un blanco concreto.', ['Se propaga solo por la red']),
        op('¿Qué distingue un DDoS de un DoS?', ['El DDoS roba datos y el DoS no', 'El DDoS viene de muchísimos orígenes a la vez', 'El DDoS solo afecta redes inalámbricas', 'El DoS es legal'], 1, 'La primera D es «distribuido»: el tráfico llega desde miles de equipos, normalmente de una botnet, y no se puede frenar bloqueando una sola IP.'),
        op('¿Qué propiedad de la tríada CIA ataca directamente un DDoS?', ['Confidencialidad', 'Integridad', 'Disponibilidad', 'Autenticidad'], 2, 'No lee ni cambia datos: impide que los usuarios legítimos usen el servicio.'),
        op('Un equipo muestra una nota de rescate. ¿Cuál es la primera acción correcta?', ['Pagar cuanto antes para que no suba el precio', 'Formatear el equipo', 'Desconectarlo de la red y reportar', 'Reiniciarlo varias veces'], 2, 'Aislar evita que el ransomware alcance carpetas compartidas y otros equipos. Formatear destruye evidencia y pagar no garantiza nada.'),
        op('¿Qué defensa protege mejor contra un ataque de intermediario en una Wi-Fi pública?', ['Usar una VPN o sitios con HTTPS', 'Bajar el brillo de la pantalla', 'Usar una contraseña más larga en el correo', 'Desactivar el Bluetooth'], 0, 'El cifrado hace que el intermediario solo vea datos ilegibles. La longitud de la contraseña no importa si viaja sin cifrar.'),
        op('Un programa se esconde en el sistema operativo para que ni el antivirus ni el usuario noten otro malware. ¿Qué es?', ['Adware', 'Rootkit', 'Spam', 'Gusano'], 1, 'El rootkit se especializa en ocultar: modifica el sistema para volverse invisible y mantener el acceso.'),
        vs('¿Cuáles **dos** medidas reducen el éxito de un ataque de diccionario contra las cuentas?', ['Bloquear la cuenta tras varios intentos fallidos', 'Usar el nombre de la empresa como contraseña', 'Activar la autenticación multifactor', 'Permitir contraseñas de cuatro caracteres', 'Desactivar los registros de inicio de sesión'], [0, 2], 'El bloqueo frena los intentos repetidos y la MFA hace que la contraseña sola no baste.'),
        ord('Ordena las acciones de un técnico ante un equipo con malware.', ['Aislar el equipo de la red', 'Reportar al equipo de seguridad', 'Documentar lo observado en el ticket', 'Restaurar el equipo cuando lo autoricen'], 'Contener, escalar, documentar y, al final, recuperar con autorización.'),
        op('Alguien deja memorias USB con la etiqueta «Confidencial» en la entrada del edificio. ¿Qué técnica es?', ['Baiting (cebo)', 'Vishing', 'DDoS', 'Fuerza bruta'], 0, 'El cebo explota la curiosidad: quien conecta la memoria ejecuta el malware.'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 3 */
  {
    slug: 'autenticacion-aaa-y-mfa',
    titulo: 'Autenticación, AAA y multifactor',
    resumen: 'Quién eres, qué puedes hacer y qué hiciste: el modelo AAA, los tres tipos de factor, la autenticación multifactor y cómo se mide la fuerza de una contraseña.',
    nivel: 'medio',
    objetivos: [
      'Diferenciar autenticación, autorización y contabilidad.',
      'Clasificar un método de inicio de sesión en su tipo de factor y decidir si una combinación es MFA.',
      'Calcular cuántas combinaciones permite una política de contraseñas y explicar por qué la longitud pesa más.',
      'Describir para qué sirven Active Directory, RADIUS y TACACS+.',
    ],
    bloques: [
      h('Tres preguntas en la puerta'),
      p(`Piensa en un hotel. En recepción te piden una identificación: quieren saber **quién eres**. Después te dan una tarjeta que abre **tu** habitación y el gimnasio, pero no las demás habitaciones ni la cocina: eso es **qué puedes hacer**. Y el sistema del hotel anota a qué hora entraste, qué consumiste del minibar y cuándo te fuiste: **qué hiciste**.`),
      p(`Esas tres preguntas son el modelo **AAA** (se lee «triple A»), que organiza el control de acceso en cualquier red:`),
      tabla(['Función', 'En inglés', 'Pregunta', 'En una red'], [
        ['**Autenticación**', 'Authentication', '¿Quién eres?', 'Usuario y contraseña, huella, certificado, código'],
        ['**Autorización**', 'Authorization', '¿Qué puedes hacer?', 'Permisos: qué carpetas, qué comandos, qué VLAN'],
        ['**Contabilidad**', 'Accounting', '¿Qué hiciste?', 'Registros: cuándo entraste, qué ejecutaste, cuánto usaste'],
      ]),
      nota('clave', `El orden importa: primero se **autentica**, después se **autoriza** y todo el tiempo se **contabiliza**. No se pueden dar permisos a alguien cuya identidad no se ha comprobado.`),
      nota('error', `Autenticación y autorización se confunden porque suenan parecido. Truco: **autenticar** es comprobar que algo es **auténtico** (que eres quien dices); **autorizar** es **dar permiso**, como un padre que autoriza una salida.`),
      ejemplo('facil', 'Comprobar la identidad', aaa('clave')),
      ejemplo('facil', 'Entró, pero no puede todo', aaa('sin-config')),
      ejemplo('facil', 'Dejar constancia', aaa('comandos')),

      h('Los tres tipos de factor'),
      p(`Para demostrar quién eres puedes presentar tres clases de prueba. Se llaman **factores de autenticación**:`),
      tabla(['Factor', 'Qué es', 'Ejemplos', 'Punto débil'], [
        ['Algo que **sabes**', 'Un secreto en tu memoria', 'Contraseña, PIN, patrón, pregunta de seguridad', 'Se puede adivinar, espiar o sacar con phishing'],
        ['Algo que **tienes**', 'Un objeto en tu poder', 'Teléfono con app autenticadora, llave USB, tarjeta inteligente, token', 'Se puede perder o robar'],
        ['Algo que **eres**', 'Un rasgo de tu cuerpo (biometría)', 'Huella, rostro, iris, voz', 'No se puede cambiar si se filtra'],
      ]),

      h('Autenticación multifactor (MFA)'),
      p(`Cada factor tiene su punto débil, pero es muy difícil que un atacante consiga **dos de naturaleza distinta a la vez**. Robar una contraseña por phishing desde otro país es fácil; robar además el teléfono de la víctima, no.`),
      p(`La **autenticación multifactor (MFA)** exige **dos o más factores de tipos distintos**. Cuando son exactamente dos, también se llama 2FA.`),
      nota('aviso', `La trampa favorita del examen: **dos pruebas del mismo tipo no son MFA**. Contraseña + PIN son dos cosas que sabes: sigue siendo un solo factor. Contraseña + código del teléfono sí es MFA (sabes + tienes).`),
      ejemplo('facil', 'Contraseña y aplicación autenticadora', fac('clave', 'app')),
      ejemplo('medio', 'Dos secretos', fac('clave', 'pregunta')),
      ejemplo('medio', 'Tarjeta y huella', fac('tarjeta', 'huella')),
      ejemplo('medio', 'Tres pruebas, ¿tres factores?', fac('clave', 'pin', 'sms')),
      p(`No todos los segundos factores son igual de fuertes. De menor a mayor resistencia: código por **SMS** (se puede interceptar o desviar), código de una **aplicación autenticadora**, notificación con confirmación en el teléfono y **llave de seguridad física**. Cualquiera de ellos es muchísimo mejor que no tener segundo factor.`),

      h('Contraseñas: longitud contra complejidad'),
      p(`Una contraseña resiste la fuerza bruta según **cuántas combinaciones** tenga que probar el atacante. El cálculo es sencillo. Si cada posición puede ser uno de \`N\` símbolos y la contraseña tiene \`L\` posiciones:`),
      formula('Combinaciones = N^L', [['N', 'cuántos símbolos distintos se permiten (la base)'], ['L', 'la longitud de la contraseña (el exponente)']], 'Es la misma idea que con los bits: cada posición multiplica el total por N.'),
      tabla(['Caracteres permitidos', 'N'], [
        ['Solo dígitos (0–9)', '10'],
        ['Solo minúsculas', '26'],
        ['Minúsculas y mayúsculas', '52'],
        ['Minúsculas, mayúsculas y dígitos', '62'],
        ['Todo lo anterior más símbolos del teclado', '94'],
      ]),
      p(`Un PIN de 4 dígitos tiene 10^4 = 10,000 combinaciones: un programa las prueba todas en un instante. Ahora compara dos formas de «mejorar» una contraseña de 8 minúsculas (26^8, unos 209 mil millones):`),
      tabla(['Cambio', 'Resultado', 'Cuántas veces mejor'], [
        ['Añadir mayúsculas, dígitos y símbolos (N = 94), misma longitud', '94^8 ≈ 6 × 10^15', 'unas 29,000 veces'],
        ['Seguir con minúsculas pero alargar a 16 caracteres', '26^16 ≈ 4 × 10^22', 'unas 209 mil millones de veces'],
      ]),
      nota('clave', `**La longitud pesa más que la complejidad.** Ampliar el juego de caracteres agranda la base; alargar la contraseña aumenta el exponente, y el exponente manda. Por eso hoy se recomiendan **frases de contraseña**: cuatro o cinco palabras sin relación (\`tortuga-violin-carretera-nube\`) son largas, fáciles de recordar y muy difíciles de adivinar.`),
      ejemplo('facil', 'Un PIN contra otro', clv(4, 'digitos', 6, 'digitos')),
      ejemplo('medio', 'Corta y compleja contra larga y simple', clv(8, 'todo', 16, 'minus')),

      h3('Buenas prácticas con contraseñas'),
      lista(
        '**Largas**: mínimo 12 caracteres; mejor una frase.',
        '**Únicas**: una distinta por servicio. Si un sitio sufre una filtración, las demás cuentas siguen a salvo.',
        '**Gestor de contraseñas**: genera y guarda contraseñas largas y distintas; tú solo recuerdas una.',
        '**Nunca las de fábrica**: lo primero al instalar un equipo es cambiar `admin` / `admin`.',
        '**No compartirlas** ni anotarlas en un papel pegado al monitor.',
        '**MFA siempre que exista**.',
      ),
      h3('Políticas de contraseñas'),
      tabla(['Política', 'Qué hace', 'Qué ataque frena'], [
        ['Longitud mínima', 'Rechaza contraseñas cortas', 'Fuerza bruta'],
        ['Bloqueo de cuenta', 'Tras varios intentos fallidos, la cuenta se bloquea un tiempo', 'Fuerza bruta y diccionario en línea'],
        ['Historial', 'Impide reutilizar las últimas contraseñas', 'Volver siempre a la misma'],
        ['Caducidad', 'Obliga a cambiarla cada cierto tiempo o tras una filtración', 'Uso prolongado de una contraseña robada'],
        ['Lista de prohibidas', 'Rechaza contraseñas comunes o filtradas', 'Diccionario'],
      ]),

      h('Dónde viven las cuentas'),
      p(`En una empresa nadie crea las cuentas equipo por equipo. Se guardan en un **almacén de identidades** central (un **directorio**) y todos los sistemas le preguntan a él.`),
      tabla(['Nombre', 'Qué es'], [
        ['**Active Directory (AD)**', 'El directorio de Microsoft: usuarios, grupos, equipos y políticas de un dominio Windows.'],
        ['**LDAP**', 'El protocolo estándar para consultar un directorio (AD también lo habla).'],
        ['**RADIUS**', 'Protocolo AAA muy usado para el **acceso a la red**: Wi-Fi empresarial, VPN, 802.1X.'],
        ['**TACACS+**', 'Protocolo AAA usado sobre todo para la **administración de equipos** de red: quién entra al router y qué comandos puede ejecutar.'],
        ['**SSO** (inicio de sesión único)', 'Te autenticas una vez y entras a varias aplicaciones sin volver a escribir la contraseña.'],
      ]),
      p(`Así funciona el Wi-Fi de una empresa: el punto de acceso no conoce ninguna contraseña. Recibe tu usuario, se lo pasa a un **servidor RADIUS**, y este consulta el **directorio**. La ventaja es enorme: cuando alguien deja la empresa, se desactiva **una** cuenta y pierde el acceso al Wi-Fi, a la VPN, al correo y a todo lo demás.`),
      ejemplo('dificil', 'Un empleado se va', op('Una empresa usa una única clave de Wi-Fi compartida por sus 80 empleados. Un empleado es despedido. ¿Qué problema tiene la empresa y qué lo habría evitado?', ['Ninguno: la clave sigue siendo secreta', 'Debe cambiar la clave en todos los equipos; con cuentas individuales en un directorio y RADIUS bastaría desactivar una cuenta', 'Debe comprar puntos de acceso nuevos', 'Debe cambiar el nombre de la red'], 1, [
        'El exempleado **sigue conociendo la clave**. Para cortarle el acceso hay que cambiarla, y eso obliga a reconfigurar los 80 equipos.',
        'Con autenticación centralizada (cuentas en un directorio y un servidor RADIUS), cada persona entra con **su** usuario. Al desactivar una cuenta, solo esa persona pierde el acceso.',
        'Además queda **contabilidad**: se sabe quién se conectó y cuándo, cosa imposible con una clave compartida.',
      ])),

      h('Resumen'),
      lista(
        'AAA: autenticación (quién eres), autorización (qué puedes hacer), contabilidad (qué hiciste).',
        'Factores: algo que sabes, algo que tienes, algo que eres.',
        'MFA = dos o más factores de **tipos distintos**.',
        'Combinaciones = N^L. La longitud pesa más que la complejidad.',
        'Las cuentas se centralizan en un directorio; RADIUS y TACACS+ lo conectan con la red.',
      ),

      ejercicios('Practica: AAA y factores', 'Primero clasifica; después decide si es multifactor.', [
        aaa('huella'), aaa('solo-lectura'), aaa('bitacora'), aaa('vlan-invitados'), aaa('codigo-app'), aaa('datos-usados'), aaa('horario'), aaa('auditoria'),
        fac('pin', 'huella'), fac('clave', 'patron'), fac('llave', 'tarjeta'), fac('rostro', 'token'), fac('huella', 'iris'), fac('clave', 'llave', 'rostro'),
      ]),
      ejercicios('Practica: contraseñas y directorios', 'Usa la fórmula N^L. Para comparar, piensa cuál tiene el exponente mayor.', [
        clv(6, 'digitos', 4, 'minus'), clv(8, 'minus', 8, 'alfanum'), clv(10, 'alfanum', 14, 'minus'), clv(8, 'todo', 12, 'letras'), clv(6, 'todo', 20, 'minus'),
        op('Un sistema pide contraseña y después un PIN. ¿Es autenticación multifactor?', ['Sí, porque pide dos cosas', 'No, porque las dos son algo que sabes', 'Sí, porque el PIN es un número', 'No, porque falta un certificado'], 1, 'MFA requiere tipos de factor distintos. Contraseña y PIN son ambos conocimiento.'),
        op('¿Qué protocolo AAA se usa sobre todo para controlar qué comandos puede ejecutar cada administrador en routers y switches?', ['DHCP', 'TACACS+', 'DNS', 'NTP'], 1, 'TACACS+ separa autenticación, autorización y contabilidad, y permite autorizar comando por comando. RADIUS se usa más para el acceso a la red.'),
        op('¿Cuál de estas contraseñas resiste mejor un ataque de fuerza bruta?', ['`Xk9$`', '`Password1`', '`mesa-lluvia-tren-farol-siete`', '`12345678`'], 2, 'Tiene 28 caracteres: aunque solo use minúsculas y guiones, su longitud la hace enormemente más fuerte. `Password1` y `12345678` además están en cualquier diccionario.'),
        vs('¿Cuáles **dos** son factores del tipo «algo que tienes»?', ['Una llave de seguridad USB', 'Un PIN', 'Una tarjeta inteligente', 'La huella dactilar', 'Una frase de contraseña'], [0, 2], 'La llave y la tarjeta son objetos físicos. El PIN y la frase son conocimiento; la huella es biometría.'),
        rel('Relaciona cada concepto con su descripción.', [['Active Directory', 'Directorio de usuarios y equipos de un dominio Windows'], ['RADIUS', 'Protocolo AAA típico del acceso Wi-Fi empresarial y la VPN'], ['SSO', 'Iniciar sesión una vez y acceder a varias aplicaciones'], ['Gestor de contraseñas', 'Genera y guarda contraseñas largas y distintas']], 'AD es el almacén de identidades; RADIUS conecta la red con ese almacén; SSO evita repetir el inicio de sesión; el gestor resuelve el problema de recordar muchas contraseñas únicas.'),
        op('¿Qué política frena mejor un ataque de diccionario en línea contra una cuenta?', ['Caducidad cada 90 días', 'Bloqueo de la cuenta tras cinco intentos fallidos', 'Permitir contraseñas sin símbolos', 'Mostrar la contraseña al escribirla'], 1, 'El bloqueo impide probar miles de contraseñas seguidas contra la misma cuenta.'),
        ord('Ordena lo que ocurre cuando un administrador entra a un router con AAA.', ['El router pide usuario y contraseña', 'El servidor AAA confirma la identidad', 'El servidor indica qué comandos puede usar ese usuario', 'Cada comando ejecutado queda registrado'], 'Autenticación (pedir y confirmar), autorización (permisos) y contabilidad (registro).'),
        op('¿Por qué es mala idea reutilizar la misma contraseña en varios servicios?', ['Porque caduca antes', 'Porque si se filtra en uno, sirve para entrar a todos los demás', 'Porque los servidores la rechazan', 'Porque ocupa más memoria'], 1, 'Los atacantes prueban las credenciales filtradas de un sitio en muchos otros (relleno de credenciales).'),
      ]),
    ],
  },

  /* ------------------------------------------------------------------ 4 */
  {
    slug: 'cifrado-y-certificados',
    titulo: 'Cifrado, hash y certificados',
    resumen: 'Cómo se esconde la información que viaja por la red: cifrado simétrico y asimétrico, hash, firma digital, certificados, HTTPS, VPN y los protocolos seguros que sustituyen a los inseguros.',
    nivel: 'medio',
    objetivos: [
      'Diferenciar cifrado simétrico, cifrado asimétrico y hash, y saber para qué sirve cada uno.',
      'Explicar qué demuestra un certificado digital y qué significa el candado de HTTPS.',
      'Distinguir datos en tránsito de datos en reposo.',
      'Elegir el protocolo seguro que sustituye a Telnet, HTTP, FTP y SNMPv2c.',
    ],
    bloques: [
      h('Texto claro y texto cifrado'),
      p(`Todo lo que viaja por una red se puede capturar: basta un programa como Wireshark y estar en el camino. Si los datos van en **texto claro**, quien los capture los lee tal cual, contraseñas incluidas.`),
      p(`**Cifrar** es transformar los datos con un algoritmo y una **clave** para que solo quien tenga la clave correcta pueda devolverlos a su forma original. El resultado se llama **texto cifrado**: se puede capturar, pero no entender.`),
      tabla(['Término', 'Significado'], [
        ['Texto claro', 'Los datos legibles, antes de cifrar'],
        ['Texto cifrado', 'Los datos ilegibles, después de cifrar'],
        ['Algoritmo', 'El método (público y conocido): AES, RSA…'],
        ['Clave', 'El secreto que hace único el resultado'],
        ['Cifrar / descifrar', 'Pasar de claro a cifrado / de cifrado a claro'],
      ]),
      nota('clave', `La seguridad no está en esconder el algoritmo, sino en **proteger la clave**. AES es público y lo estudia todo el mundo; lo que nadie conoce es tu clave.`),

      h('Cifrado simétrico: una sola clave'),
      p(`En el cifrado **simétrico**, la **misma clave** cifra y descifra. Es como el candado de una bicicleta con una sola llave: quien tenga copia de la llave abre.`),
      lista(
        '**Ventaja**: es muy rápido. Sirve para cifrar grandes volúmenes: discos enteros, tráfico de Wi-Fi, túneles VPN.',
        '**Problema**: las dos partes necesitan la misma clave. ¿Cómo se la haces llegar a alguien por Internet sin que la vea nadie más?',
        '**Algoritmo de referencia**: **AES** (*Advanced Encryption Standard*), con claves de 128, 192 o 256 bits. Los antiguos **DES** y **3DES** ya no se consideran seguros.',
      ),
      ejemplo('facil', 'Cifrar un disco entero', cif('disco')),

      h('Cifrado asimétrico: un par de claves'),
      p(`El cifrado **asimétrico** resuelve el problema de compartir la clave. Cada parte tiene **dos claves** ligadas entre sí por matemáticas:`),
      tabla(['Clave', 'Quién la tiene', 'Para qué'], [
        ['**Pública**', 'Cualquiera: se reparte sin miedo', 'Cifrar mensajes para el dueño; verificar su firma'],
        ['**Privada**', 'Solo el dueño, y nunca sale de su poder', 'Descifrar lo que le envían; firmar'],
      ]),
      p(`Piensa en un buzón de la calle: cualquiera puede **echar** una carta por la ranura (clave pública), pero solo el cartero con **la llave** la saca (clave privada). Lo que se cifra con una clave del par solo se descifra con la otra.`),
      lista(
        '**Ventaja**: no hace falta compartir ningún secreto de antemano.',
        '**Problema**: es mucho más lento que el simétrico.',
        '**Algoritmos**: **RSA** y los de curva elíptica (**ECC**).',
      ),
      nota('clave', `En la práctica se **combinan**: se usa el asimétrico solo al principio, para acordar de forma segura una clave simétrica, y después todo el tráfico se cifra con esa clave simétrica, que es rápida. Así funcionan HTTPS, SSH y las VPN.`),
      ejemplo('medio', 'Un secreto sin clave compartida', cif('enviar-secreto')),
      ejemplo('medio', 'Entrar por SSH con llaves', cif('ssh-llaves')),

      h('Hash: la huella digital de los datos'),
      p(`Una **función hash** toma cualquier dato (una palabra, un archivo de 4 GB) y devuelve un valor de **tamaño fijo**, su «huella». Tiene tres propiedades:`),
      lista(
        'El mismo dato da **siempre** el mismo hash.',
        'Un cambio mínimo (un solo bit) produce un hash **completamente distinto**.',
        'Es de **un solo sentido**: del hash no se puede volver al dato original. **No es cifrado**: no hay clave ni forma de «descifrar».',
      ),
      tabla(['Algoritmo', 'Tamaño', 'Estado'], [
        ['MD5', '128 bits', 'Roto: no usar para seguridad'],
        ['SHA-1', '160 bits', 'Obsoleto'],
        ['**SHA-256** (familia SHA-2)', '256 bits', 'El estándar actual'],
      ]),
      p(`Sirve para dos cosas muy prácticas. La primera, **comprobar integridad**: el fabricante publica el hash de un firmware; tú calculas el del archivo descargado y, si coinciden, el archivo es idéntico. La segunda, **guardar contraseñas**: un sistema bien hecho no guarda tu contraseña, sino su hash; al iniciar sesión calcula el hash de lo que tecleas y compara.`),
      ejemplo('facil', 'Verificar una descarga', cif('descarga')),
      ejemplo('medio', 'Contraseñas que nadie puede leer', cif('guardar-claves')),

      h('Firma digital'),
      p(`Una **firma digital** combina las dos ideas anteriores. Quien firma calcula el hash del documento y lo cifra con su **clave privada**. Quien recibe usa la **clave pública** del firmante para comprobarlo. Si la verificación sale bien, quedan demostradas tres cosas:`),
      tabla(['Garantía', 'Qué significa'], [
        ['**Autenticidad**', 'Lo firmó el dueño de esa clave privada.'],
        ['**Integridad**', 'El documento no cambió después de la firma.'],
        ['**No repudio**', 'El firmante no puede negar que lo firmó.'],
      ]),
      nota('aviso', `Firmar **no** es cifrar. Un documento firmado se puede leer; la firma no protege la confidencialidad, sino la integridad y la autoría.`),
      ejemplo('medio', 'Quién lo envió y que no cambió', cif('contrato')),

      h('Certificados digitales'),
      p(`Queda un problema: si alguien te da una clave pública y dice «soy tu banco», ¿cómo sabes que es verdad? Un **certificado digital** es un documento electrónico que **une una identidad** (por ejemplo, el nombre de un sitio web) **con una clave pública**, y que va **firmado por una autoridad de certificación (CA)** en la que todos confían. Es como un pasaporte: no lo crees porque lo diga el viajero, sino porque lo emitió un gobierno.`),
      tabla(['Campo del certificado', 'Qué indica'], [
        ['Sujeto', 'A quién pertenece: el nombre del sitio'],
        ['Clave pública', 'La clave del dueño'],
        ['Emisor', 'La autoridad de certificación que lo firmó'],
        ['Validez', 'Desde y hasta cuándo es válido'],
        ['Firma del emisor', 'Lo que impide falsificarlo'],
      ]),
      h3('Qué significa el candado de HTTPS'),
      p(`**HTTPS** es HTTP dentro de un túnel cifrado **TLS** (el sucesor de SSL), por el puerto **443**. Cuando el navegador muestra el candado, ha comprobado tres cosas: que el certificado corresponde al nombre que escribiste, que lo firmó una autoridad de confianza y que está vigente. A partir de ahí, todo viaja cifrado.`),
      nota('error', `El candado **no** significa que el sitio sea honesto. Solo dice que la conexión está cifrada y que el certificado corresponde a ese nombre. Un sitio de phishing en \`banco-seguro-login.example\` puede tener candado. Hay que mirar también **qué dominio** es.`),
      p(`Si el navegador muestra un **aviso de certificado**, las causas habituales son:`),
      tabla(['Aviso', 'Causa probable'], [
        ['Certificado caducado', 'Pasó su fecha de validez (o el reloj del equipo está mal)'],
        ['El nombre no coincide', 'El certificado es de otro dominio'],
        ['Emisor desconocido', 'Es autofirmado o de una autoridad en la que el navegador no confía'],
        ['Revocado', 'La autoridad lo anuló antes de tiempo'],
      ]),
      p(`En la página de administración de un switch o un router recién instalado es normal ver el aviso, porque usan certificados **autofirmados**. En un sitio de Internet, un aviso es motivo para **no continuar**: podría ser un ataque de intermediario.`),
      ejemplo('medio', '¿Es de verdad el banco?', cif('sitio-real')),
      ejemplo('dificil', 'El reloj equivocado', op('Una usuaria no puede abrir ningún sitio HTTPS: en todos aparece «certificado no válido o caducado». Los mismos sitios funcionan en las demás computadoras. ¿Cuál es la causa más probable?', ['Todos los sitios web renovaron mal su certificado a la vez', 'La fecha y la hora de su computadora están mal', 'Su cable de red está dañado', 'El firewall bloquea el puerto 80'], 1, [
        'Que fallen **todos** los sitios, pero solo en **un** equipo, apunta a ese equipo y no a los sitios.',
        'Cada certificado tiene un periodo de validez. Si el reloj del equipo marca, por ejemplo, el año 2015, para él todos los certificados «todavía no son válidos»; si marca 2040, están «caducados».',
        'La solución es corregir la fecha y la hora (y revisar por qué se desajustaron: la pila de la placa o la sincronización con NTP).',
      ])),

      h('Datos en tránsito y datos en reposo'),
      tabla(['Estado', 'Dónde están', 'Cómo se protegen'], [
        ['**En tránsito**', 'Viajando por la red', 'TLS/HTTPS, SSH, VPN, WPA2/WPA3'],
        ['**En reposo**', 'Guardados en un disco, una memoria o una copia', 'Cifrado de disco o de archivos'],
      ]),
      p(`Hacen falta las dos protecciones. HTTPS no sirve de nada si después roban la computadora portátil con el archivo sin cifrar; y cifrar el disco no ayuda si el archivo se envía por una conexión en texto claro.`),

      h('VPN: un túnel cifrado'),
      p(`Una **VPN** (red privada virtual) crea un **túnel cifrado** a través de una red que no es de confianza, normalmente Internet. Todo lo que entra por un extremo del túnel sale cifrado y solo el otro extremo puede leerlo.`),
      tabla(['Tipo', 'Une…', 'Uso típico'], [
        ['**Acceso remoto**', 'un equipo con la red de la empresa', 'Trabajo desde casa o desde un hotel'],
        ['**Sitio a sitio**', 'dos redes completas', 'La sucursal con la oficina central'],
      ]),

      h('Protocolos seguros en lugar de inseguros'),
      p(`Muchos protocolos clásicos se diseñaron cuando nadie pensaba en espías y envían todo en texto claro. Casi todos tienen un sustituto cifrado, y el examen espera que conozcas las parejas y sus puertos:`),
      tabla(['Para qué', 'Inseguro', 'Puerto', 'Seguro', 'Puerto'], [
        ['Administrar equipos por línea de comandos', 'Telnet', '23', '**SSH**', '22'],
        ['Páginas web', 'HTTP', '80', '**HTTPS**', '443'],
        ['Transferir archivos', 'FTP', '21', '**SFTP**', '22'],
        ['Transferir archivos sin contraseña', 'TFTP', '69 (UDP)', '**SFTP** o SCP', '22'],
        ['Monitorizar equipos', 'SNMPv1 / v2c', '161 (UDP)', '**SNMPv3**', '161 (UDP)'],
        ['Leer correo', 'IMAP / POP3', '143 / 110', '**IMAPS / POP3S**', '993 / 995'],
        ['Consultar un directorio', 'LDAP', '389', '**LDAPS**', '636'],
      ]),
      nota('truco', `SFTP **no** es «FTP con una S»: es transferencia de archivos **sobre SSH**, y por eso usa el puerto 22, igual que SSH. (Existe también FTPS, que es FTP sobre TLS, pero es menos común.)`),
      ejemplo('facil', 'Dejar Telnet', pro('telnet')),
      ejemplo('medio', 'Copiar archivos con seguridad', pro('ftp')),

      h('Resumen'),
      lista(
        'Simétrico (AES): una clave, rápido. Asimétrico (RSA): par pública/privada, resuelve el intercambio de claves.',
        'Hash (SHA-256): huella de un solo sentido; comprueba integridad. No es cifrado.',
        'Firma digital: autenticidad, integridad y no repudio.',
        'Certificado: une un nombre con una clave pública; lo firma una autoridad de certificación.',
        'HTTPS = HTTP sobre TLS, puerto 443. El candado indica conexión cifrada, no sitio honesto.',
        'SSH en vez de Telnet, HTTPS en vez de HTTP, SFTP en vez de FTP, SNMPv3 en vez de v2c.',
      ),

      ejercicios('Practica: la herramienta adecuada', 'Decide qué se necesita: esconder, comprobar, demostrar autoría o identificar.', [
        cif('wifi'), cif('respaldo'), cif('intercambio'), cif('detectar-cambios'), cif('actualizacion'), cif('no-repudio'), cif('candado'), cif('vpn-datos'), cif('wifi-enterprise'),
        pro('http'), pro('tftp'), pro('snmp'), pro('imap'), pro('pop3'), pro('ldap'),
      ]),
      ejercicios('Practica: conceptos', 'Preguntas al estilo del examen.', [
        op('¿Qué característica define al cifrado simétrico?', ['Usa una clave pública y una privada', 'Usa la misma clave para cifrar y descifrar', 'No usa ninguna clave', 'Solo sirve para firmar'], 1, 'Una sola clave compartida por las dos partes. Es rápido, pero obliga a resolver cómo compartir esa clave.'),
        op('Quieres enviar un mensaje que solo Camila pueda leer, usando cifrado asimétrico. ¿Con qué clave lo cifras?', ['Con tu clave privada', 'Con tu clave pública', 'Con la clave pública de Camila', 'Con la clave privada de Camila'], 2, 'Lo que se cifra con la clave pública de Camila solo se descifra con su clave privada, que únicamente ella tiene. Su clave privada nunca debes tenerla tú.'),
        op('¿Cuál es la diferencia esencial entre un hash y un cifrado?', ['El hash es más lento', 'El hash no se puede revertir y no usa clave; el cifrado sí se revierte con la clave', 'El cifrado siempre da el mismo tamaño', 'No hay diferencia'], 1, 'El hash es de un solo sentido y sirve para comprobar integridad. El cifrado es reversible y sirve para la confidencialidad.'),
        vs('¿Cuáles **dos** cosas garantiza una firma digital válida?', ['Que el documento no fue modificado', 'Que el documento es confidencial', 'Que lo firmó el dueño de la clave privada', 'Que el documento no contiene malware', 'Que el servidor está disponible'], [0, 2], 'La firma aporta integridad y autenticidad (y con ellas, no repudio). No cifra el contenido.'),
        op('El navegador muestra el candado en `https://mi-banco-seguro.example`. ¿Qué puedes afirmar?', ['Que el sitio es del banco real', 'Que la conexión está cifrada y el certificado corresponde a ese nombre de dominio', 'Que el sitio no tiene malware', 'Que tus datos no se guardarán'], 1, 'El candado habla de la conexión, no de la honestidad del dueño. Hay que comprobar que el dominio sea el del banco.'),
        rel('Relaciona cada algoritmo o protocolo con su categoría.', [['AES', 'Cifrado simétrico'], ['RSA', 'Cifrado asimétrico'], ['SHA-256', 'Función hash'], ['TLS', 'Protocolo que cifra la conexión de HTTPS']], 'AES cifra con una sola clave; RSA usa un par; SHA-256 produce huellas; TLS es el túnel que hay debajo de HTTPS.'),
        op('¿En qué puerto escucha SFTP por defecto y por qué?', ['21, porque es FTP', '22, porque funciona sobre SSH', '443, porque usa TLS', '69, porque es como TFTP'], 1, 'SFTP es un subsistema de SSH, así que comparte su puerto 22.'),
        op('Una empresa cifra el disco de todas las portátiles. ¿Qué tipo de datos protege?', ['Datos en tránsito', 'Datos en reposo', 'Datos en uso por la memoria RAM', 'Ninguno'], 1, 'El disco guarda datos almacenados: en reposo. Los datos en tránsito se protegen con TLS, SSH o VPN.'),
        op('¿Qué entidad firma un certificado digital para que los navegadores confíen en él?', ['El proveedor de Internet', 'Una autoridad de certificación (CA)', 'El servidor DNS', 'El fabricante del navegador, en cada visita'], 1, 'La CA verifica la identidad del solicitante y firma el certificado. Los navegadores traen una lista de autoridades de confianza.'),
        op('Un empleado trabaja desde un hotel y necesita entrar a las carpetas de la oficina de forma segura. ¿Qué tecnología corresponde?', ['VPN de acceso remoto', 'Telnet', 'Filtrado MAC', 'TFTP'], 0, 'La VPN de acceso remoto crea un túnel cifrado entre su equipo y la red de la empresa a través de Internet.'),
        vs('¿Cuáles **dos** protocolos envían las credenciales en texto claro?', ['SSH', 'Telnet', 'HTTPS', 'FTP', 'SNMPv3'], [1, 3], 'Telnet y FTP no cifran nada. SSH, HTTPS y SNMPv3 sí.'),
        ord('Ordena, de forma simplificada, lo que ocurre al abrir un sitio HTTPS.', ['El navegador pide la conexión segura al servidor', 'El servidor envía su certificado', 'El navegador comprueba el certificado', 'Las dos partes acuerdan una clave simétrica', 'El tráfico viaja cifrado con esa clave'], 'Primero se identifica al servidor con su certificado (asimétrico) y después se cifra el tráfico con una clave simétrica rápida.'),
      ]),
    ],
  },
];
