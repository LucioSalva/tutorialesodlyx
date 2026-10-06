/**
 * Academia de Redes · Tipos de ejercicio de seguridad
 * ---------------------------------------------------------------------
 * Mismo contrato que tipos.js: crear(rng, nivel) → parámetros y
 * resolver(params) → { enunciado, tabla?, campos, pistas, pasos }.
 * Módulo defensivo: reconocer amenazas, elegir el control adecuado y leer
 * reglas de firewall. Los casos de catálogo se guardan por su clave.
 */
import { definir, campo, ent, elegir, niveles } from './tipos.js';
import { ip, aTexto, red, miles } from './ip.js';

const claves = (o) => Object.keys(o);
function caso(tabla, clave, tipo) {
  const c = tabla[clave];
  if (!c) throw new Error(`${tipo}: caso desconocido «${clave}»`);
  return c;
}
const varios = (rng, origen, n) => [...origen].sort(() => rng() - 0.5).slice(0, n);

/* ------------------------------------------------------------- sg-cia */
const TRIADA = ['Confidencialidad', 'Integridad', 'Disponibilidad'];
const TRIADA_DEF = [
  '**Confidencialidad**: solo las personas autorizadas pueden **ver** la información.',
  '**Integridad**: la información es **exacta** y nadie la cambió sin permiso.',
  '**Disponibilidad**: la información y los servicios **funcionan cuando se necesitan**.',
];
// [situación, propiedad (0 C, 1 I, 2 D), ¿es un control que protege? , explicación]
const CIA = {
  'correo-leido': ['Un empleado deja su sesión abierta y un compañero lee sus correos privados.', 0, false, 'Nadie borró ni cambió nada y el correo sigue funcionando: lo que se perdió es el secreto. Alguien sin autorización **vio** la información.'],
  'wifi-espia': ['En una cafetería con Wi-Fi abierto, un desconocido captura el tráfico y lee las contraseñas que viajan sin cifrar.', 0, false, 'El atacante no modificó ni interrumpió nada: solo **leyó** datos que no eran para él.'],
  'usb-perdida': ['Un técnico pierde una memoria USB sin cifrar con la lista de clientes de la empresa.', 0, false, 'Quien encuentre la memoria puede leer los datos. La empresa conserva su copia y nada cambió: el daño es que la información quedó **expuesta**.'],
  'pantalla-hombro': ['En el transporte público, alguien mira por encima del hombro de una gerente y lee el informe financiero que tiene en la pantalla.', 0, false, 'Mirar la pantalla de otro («shoulder surfing») expone la información a quien no debe verla.'],
  'nomina-alterada': ['Alguien entra en la base de datos de nómina y cambia el sueldo de un empleado de 12,000 a 21,000.', 1, false, 'El dato sigue ahí y el sistema funciona, pero ya **no es correcto**: fue modificado sin autorización.'],
  'archivo-corrupto': ['Una actualización de firmware se descarga con errores y el archivo recibido no coincide con el original.', 1, false, 'El archivo llegó **distinto** al original. No importa si fue un accidente o un ataque: los datos ya no son exactos.'],
  'web-desfigurada': ['Un atacante cambia el texto de la página principal de una empresa por un mensaje falso.', 1, false, 'La página sigue en línea, pero su contenido fue **alterado** sin permiso.'],
  'dns-falso': ['Un atacante cambia un registro DNS para que el nombre del banco apunte a un servidor suyo.', 1, false, 'El registro DNS existe y responde, pero su contenido fue **modificado**: ahora dice algo falso.'],
  'ddos-tienda': ['Miles de equipos infectados inundan de peticiones la tienda en línea y los clientes no pueden entrar.', 2, false, 'Nadie leyó ni cambió datos: el servicio simplemente **dejó de responder** a los usuarios legítimos.'],
  'ransomware': ['Un ransomware cifra todos los archivos del servidor y el personal no puede abrirlos.', 2, false, 'Los archivos existen, pero sus dueños **no pueden usarlos**. Lo que se pierde primero es el acceso.'],
  'corte-luz': ['Se va la luz en el edificio y el servidor de archivos, que no tiene batería de respaldo, se apaga.', 2, false, 'No hubo ningún atacante, pero el servicio **no está** cuando se necesita. La disponibilidad también se pierde por accidentes.'],
  'disco-roto': ['El único disco duro del servidor de correo se avería y el correo deja de funcionar dos días.', 2, false, 'Una avería de hardware deja el servicio **fuera de línea**.'],
  'cable-cortado': ['Una excavadora corta la fibra óptica del proveedor y la oficina se queda sin Internet.', 2, false, 'Los datos están intactos y nadie los vio, pero la red **no se puede usar**.'],
  'c-cifrado': ['La empresa cifra los discos de todas las computadoras portátiles.', 0, true, 'Si alguien roba una portátil, no podrá **leer** su contenido sin la clave.'],
  'c-vpn': ['Los empleados remotos se conectan a la oficina por una VPN que cifra todo el tráfico.', 0, true, 'El cifrado impide que alguien en el camino **lea** lo que viaja por Internet.'],
  'c-permisos': ['La carpeta de recursos humanos solo se puede abrir con las cuentas de ese departamento.', 0, true, 'Los permisos limitan quién puede **ver** la información.'],
  'c-hash': ['El fabricante publica el hash SHA-256 de cada firmware para que lo compares con el del archivo que descargaste.', 1, true, 'Si los dos hash coinciden, el archivo **no cambió** por el camino.'],
  'c-firma': ['Un contrato se envía con firma digital.', 1, true, 'La firma digital demuestra que el documento **no fue alterado** después de firmarse (y además quién lo firmó).'],
  'c-control-cambios': ['Cada cambio en la configuración de los routers queda registrado y debe aprobarlo un segundo técnico.', 1, true, 'El control de cambios evita modificaciones **no autorizadas o equivocadas**.'],
  'c-ups': ['Se instala un UPS (batería de respaldo) y un generador para la sala de servidores.', 2, true, 'Con energía de respaldo, los servidores **siguen funcionando** durante un apagón.'],
  'c-respaldo': ['Se programan copias de seguridad diarias y se prueba su restauración cada mes.', 2, true, 'Con una copia probada, el servicio **se recupera** tras una avería, un borrado o un ransomware.'],
  'c-redundancia': ['La oficina contrata un segundo enlace a Internet con otro proveedor.', 2, true, 'Si un enlace falla, el otro mantiene el servicio **en pie**.'],
  'c-raid': ['El servidor de archivos usa dos discos en espejo (RAID 1).', 2, true, 'Si un disco se avería, el otro **mantiene el servicio** sin interrupción.'],
};
definir('sg-cia', 'Tríada CIA', {
  crear: (rng) => ({ caso: elegir(rng, claves(CIA)) }),
  resolver(q) {
    const [texto, r, control, porque] = caso(CIA, q.caso, 'sg-cia');
    return {
      enunciado: control
        ? `${texto} ¿Qué propiedad de la tríada CIA **protege principalmente** esta medida?`
        : `${texto} ¿Qué propiedad de la tríada CIA resultó **afectada principalmente**?`,
      campos: [campo('r', 'Propiedad', 'opcion', r, { opciones: TRIADA })],
      pistas: [
        'Hazte tres preguntas: ¿alguien vio lo que no debía?, ¿algo cambió sin permiso?, ¿algo dejó de funcionar?',
        'Ver sin permiso → confidencialidad. Cambiar sin permiso → integridad. No poder usar → disponibilidad.',
        control ? 'Piensa qué pasaría si esta medida no existiera: ¿qué se perdería primero?' : 'Fíjate en el verbo de la situación: leer, modificar o interrumpir.',
      ],
      pasos: [
        { t: 'Las tres propiedades de la seguridad de la información:', tabla: { cab: ['Propiedad', 'Pregunta que responde', 'Se pierde cuando…'], filas: [
          ['Confidencialidad', '¿Quién puede verlo?', 'alguien sin permiso lee los datos'], ['Integridad', '¿Es exacto y completo?', 'alguien (o algo) cambia los datos'], ['Disponibilidad', '¿Funciona cuando lo necesito?', 'el servicio o los datos no se pueden usar']] } },
        { t: porque },
        { t: `Respuesta: ${TRIADA_DEF[r]}` },
      ],
    };
  },
});

/* ---------------------------------------------------------- sg-riesgo */
const TERMINOS = ['Activo', 'Amenaza', 'Vulnerabilidad', 'Exploit', 'Mitigación'];
const TERMINOS_DEF = [
  'Un **activo** es cualquier cosa que tiene valor y hay que proteger: datos, equipos, servicios, personas.',
  'Una **amenaza** es cualquier cosa que **podría** causar daño: una persona, un programa malicioso o un accidente.',
  'Una **vulnerabilidad** es una **debilidad** que una amenaza puede aprovechar.',
  'Un **exploit** es la **herramienta o técnica concreta** que aprovecha una vulnerabilidad.',
  'Una **mitigación** es una **medida** que reduce la probabilidad o el daño.',
];
const RIESGO = {
  'a-clientes': ['La base de datos con los datos de los clientes de la empresa.', 0, 'Es algo valioso que la empresa necesita proteger.'],
  'a-servidor': ['El servidor donde corre el sistema de facturación.', 0, 'Si se pierde o se detiene, la empresa deja de cobrar: es un bien que hay que proteger.'],
  'a-reputacion': ['La buena reputación de la empresa ante sus clientes.', 0, 'Los activos no son solo equipos: también lo intangible que tiene valor.'],
  't-delincuente': ['Un grupo de delincuentes que envía correos falsos a los empleados para robar contraseñas.', 1, 'Es alguien que quiere y puede causar daño. Todavía no dice qué debilidad aprovecha.'],
  't-inundacion': ['La posibilidad de que una inundación alcance la sala de servidores del sótano.', 1, 'Las amenazas no siempre son personas: también los desastres y los accidentes.'],
  't-empleado': ['Un empleado descontento que tiene acceso a los sistemas y quiere vengarse.', 1, 'Es una amenaza interna: alguien con intención de dañar.'],
  't-ransomware': ['Una campaña de ransomware que está circulando este mes por las empresas del sector.', 1, 'Es un peligro que existe ahí fuera y podría afectar a la empresa.'],
  'v-parche': ['Un servidor web al que le faltan las actualizaciones de seguridad de los últimos dos años.', 2, 'La falta de parches es una debilidad: deja abiertos fallos ya conocidos.'],
  'v-clave-fabrica': ['Un router que sigue con la contraseña de fábrica `admin` / `admin`.', 2, 'Una contraseña que todo el mundo conoce es una debilidad esperando a que alguien la use.'],
  'v-puerta': ['La sala de servidores se queda con la puerta abierta por las tardes.', 2, 'Es una debilidad física: cualquiera podría entrar.'],
  'v-sin-capacitacion': ['Los empleados nunca han recibido capacitación para reconocer correos falsos.', 2, 'Las personas sin preparación son una debilidad que el phishing aprovecha.'],
  'v-telnet': ['Los switches se administran por Telnet, que envía la contraseña sin cifrar.', 2, 'Usar un protocolo sin cifrado es una debilidad de la configuración.'],
  'e-programa': ['Un programa publicado en Internet que aprovecha un fallo concreto del servidor web para tomar su control.', 3, 'Es la herramienta concreta que convierte una debilidad en un ataque real.'],
  'e-macro': ['Un documento adjunto preparado para ejecutar código al abrirse, usando un fallo del procesador de textos.', 3, 'El documento es el instrumento que aprovecha el fallo del programa.'],
  'm-parchear': ['Instalar las actualizaciones de seguridad cada mes.', 4, 'Parchear elimina debilidades conocidas: reduce la probabilidad de un ataque exitoso.'],
  'm-mfa': ['Activar la autenticación multifactor en todas las cuentas.', 4, 'Aunque roben una contraseña, no basta para entrar: se reduce el riesgo.'],
  'm-respaldo': ['Hacer copias de seguridad diarias guardadas fuera de la oficina.', 4, 'No evita el incidente, pero reduce muchísimo su daño.'],
  'm-capacitar': ['Dar un curso anual a todo el personal sobre phishing e ingeniería social.', 4, 'La capacitación corrige la debilidad humana.'],
  'm-firewall': ['Colocar un firewall entre la red interna e Internet.', 4, 'Es un control que reduce lo que una amenaza externa puede alcanzar.'],
};
definir('sg-riesgo', 'Vocabulario de riesgo', {
  crear: (rng) => ({ caso: elegir(rng, claves(RIESGO)) }),
  resolver(q) {
    const [texto, r, porque] = caso(RIESGO, q.caso, 'sg-riesgo');
    return {
      enunciado: `¿Qué término de seguridad describe mejor lo siguiente?\n\n«${texto}»`,
      campos: [campo('r', 'Término', 'opcion', r, { opciones: TERMINOS })],
      pistas: [
        'Activo = lo que proteges. Amenaza = quien o lo que puede dañarlo. Vulnerabilidad = la debilidad.',
        'Exploit = la herramienta o técnica que aprovecha la debilidad. Mitigación = la medida que reduce el riesgo.',
        'Pregúntate: ¿es algo valioso, un peligro, un punto débil, un instrumento de ataque o una defensa?',
      ],
      pasos: [
        { t: 'Los cinco términos encajan como una historia: una **amenaza** usa un **exploit** para aprovechar una **vulnerabilidad** y dañar un **activo**; la **mitigación** lo dificulta.',
          tabla: { cab: ['Término', 'Qué es', 'Ejemplo'], filas: [['Activo', 'Lo que tiene valor', 'La base de datos de clientes'], ['Amenaza', 'Lo que podría causar daño', 'Un delincuente, un incendio'], ['Vulnerabilidad', 'Una debilidad', 'Un sistema sin actualizar'], ['Exploit', 'Lo que aprovecha la debilidad', 'Un programa que usa ese fallo'], ['Mitigación', 'Lo que reduce el riesgo', 'Instalar el parche']] } },
        { t: porque },
        { t: TERMINOS_DEF[r] },
      ],
    };
  },
});

/* ---------------------------------------------------------- sg-ataque */
const ATAQUES = {
  phishing: 'Phishing', spear: 'Spear phishing', whaling: 'Whaling', vishing: 'Vishing', smishing: 'Smishing', ransomware: 'Ransomware', gusano: 'Gusano',
  troyano: 'Troyano', spyware: 'Spyware', adware: 'Adware', virus: 'Virus', ddos: 'Denegación de servicio distribuida (DDoS)', dos: 'Denegación de servicio (DoS)',
  onpath: 'Intermediario (on-path)', bruta: 'Fuerza bruta', diccionario: 'Ataque de diccionario', social: 'Ingeniería social presencial', reconocimiento: 'Reconocimiento', spam: 'Spam', botnet: 'Botnet',
};
const ORDEN_ATAQUES = claves(ATAQUES);
// [escenario, tipo, distractores por defecto, señal que lo delata]
const ESCENAS = {
  'banco-masivo': ['Miles de personas reciben el mismo correo: «Su cuenta bancaria fue bloqueada. Entre aquí para reactivarla». El enlace lleva a una copia de la página del banco.', 'phishing', ['spear', 'spam', 'troyano'], 'Un mensaje **genérico y masivo** que suplanta a una entidad conocida para que la víctima entregue sus datos en una página falsa.'],
  'paqueteria': ['Llega un correo de una supuesta empresa de paquetería con un enlace para «reprogramar la entrega» que pide usuario y contraseña del correo.', 'phishing', ['smishing', 'adware', 'vishing'], 'Suplanta a una marca por **correo electrónico** y busca credenciales: es phishing clásico.'],
  'contadora': ['La contadora Abigail Ramos recibe un correo que la llama por su nombre, menciona al proveedor real con el que trabaja y le pide pagar una factura a una cuenta nueva.', 'spear', ['phishing', 'whaling', 'spam'], 'El mensaje está **hecho a medida** para una persona concreta, con datos reales sobre ella. Eso lo distingue del phishing masivo.'],
  'director': ['El director general recibe un correo que aparenta venir del despacho de abogados de la empresa y le pide autorizar con urgencia una transferencia millonaria.', 'whaling', ['spear', 'phishing', 'vishing'], 'Es phishing dirigido a un **alto directivo** (un «pez gordo»), que tiene poder para mover dinero o datos.'],
  'llamada-soporte': ['Alguien llama por teléfono a recepción: «Soy de soporte técnico, necesito tu contraseña para arreglar tu cuenta ahora mismo».', 'vishing', ['smishing', 'phishing', 'social'], 'El engaño llega por **voz** (teléfono). Vishing viene de «voice phishing».'],
  'sms-banco': ['Un mensaje de texto dice: «Detectamos un cargo de $8,500. Si no lo reconoces entra a este enlace».', 'smishing', ['vishing', 'phishing', 'spam'], 'El engaño llega por **SMS** o mensajería. Smishing viene de «SMS phishing».'],
  'archivos-cifrados': ['Al encender las computadoras, todos los documentos tienen una extensión extraña y aparece una nota que pide un pago en criptomonedas para recuperarlos.', 'ransomware', ['troyano', 'spyware', 'dos'], 'Cifra los archivos y **pide un rescate**: esa es la marca del ransomware.'],
  'se-propaga-solo': ['Un programa malicioso aprovecha un fallo de Windows y salta de un equipo a otro por la red de la oficina sin que nadie abra ni instale nada.', 'gusano', ['virus', 'troyano', 'botnet'], 'Se **propaga solo por la red**, sin intervención humana. Un virus, en cambio, necesita que alguien ejecute el archivo infectado.'],
  'juego-gratis': ['Un usuario descarga un «editor de fotos gratis». El programa funciona, pero a escondidas abre una puerta para que un atacante controle el equipo.', 'troyano', ['virus', 'gusano', 'adware'], 'Se **disfraza de programa útil** para que la propia víctima lo instale, como el caballo de Troya.'],
  'teclas': ['Un programa oculto registra todo lo que la usuaria teclea y lo envía a un servidor externo, incluidas sus contraseñas.', 'spyware', ['adware', 'troyano', 'ransomware'], '**Espía** la actividad del usuario y la envía a un tercero sin que lo note. Un registrador de teclas es spyware.'],
  'anuncios': ['Después de instalar una barra de herramientas, el navegador muestra ventanas de publicidad sin parar y cambia la página de inicio.', 'adware', ['spyware', 'virus', 'spam'], 'Su fin es **mostrar publicidad** no deseada. Molesta más que destruye.'],
  'macro-infectada': ['Un archivo de hoja de cálculo infectado se copia a otros documentos del equipo cada vez que alguien lo abre.', 'virus', ['gusano', 'troyano', 'spyware'], 'Se **adjunta a archivos** y necesita que una persona los abra para activarse y copiarse.'],
  'inundacion-web': ['El sitio web de una tienda recibe millones de peticiones por segundo desde decenas de miles de direcciones IP de todo el mundo y deja de responder.', 'ddos', ['dos', 'gusano', 'bruta'], 'Satura el servicio desde **muchísimos orígenes a la vez**. Con un solo origen sería DoS; con miles, DDoS.'],
  'un-solo-origen': ['Un único equipo envía peticiones sin parar a un servidor pequeño hasta agotar sus recursos; al bloquear esa dirección IP, el servicio vuelve.', 'dos', ['ddos', 'bruta', 'onpath'], 'Busca dejar el servicio fuera de línea y viene de **un solo origen**: por eso bastó con bloquear una IP.'],
  'wifi-falso': ['En un aeropuerto, un atacante crea una red Wi-Fi con el mismo nombre que la oficial. Quien se conecta navega con normalidad, pero todo su tráfico pasa antes por el equipo del atacante.', 'onpath', ['spyware', 'phishing', 'reconocimiento'], 'El atacante se coloca **en medio** de la comunicación para leerla o alterarla. Antes se llamaba «hombre en el medio».'],
  'arp-falso': ['Un equipo de la red local engaña a los demás para que le envíen a él el tráfico destinado a la puerta de enlace; después lo reenvía, de modo que nadie nota nada.', 'onpath', ['dos', 'gusano', 'reconocimiento'], 'Intercepta la conversación **colocándose entre** las víctimas y su destino.'],
  'todas-las-claves': ['El registro del servidor muestra 40,000 intentos de inicio de sesión contra la misma cuenta, probando `aaaa`, `aaab`, `aaac`… en orden.', 'bruta', ['diccionario', 'dos', 'reconocimiento'], 'Prueba **todas las combinaciones posibles**, una tras otra. Es lento, pero acaba funcionando contra contraseñas cortas.'],
  'lista-claves': ['El registro muestra intentos de inicio de sesión que prueban `123456`, `password`, `qwerty`, `futbol2024` y otras contraseñas muy comunes.', 'diccionario', ['bruta', 'phishing', 'dos'], 'No prueba todo: usa una **lista de palabras y contraseñas frecuentes**. Por eso las contraseñas comunes caen en segundos.'],
  'sin-gafete': ['Una persona con una caja en las manos espera junto a la puerta de la oficina y entra detrás de un empleado que le sostiene la puerta por amabilidad.', 'social', ['vishing', 'phishing', 'reconocimiento'], 'Manipula a una persona **cara a cara** para saltarse un control físico. Entrar pegado a alguien autorizado se llama «tailgating».'],
  'usb-estacionamiento': ['Aparecen varias memorias USB con la etiqueta «Nóminas 2025» tiradas en el estacionamiento de la empresa, esperando que alguien las conecte por curiosidad.', 'social', ['troyano', 'phishing', 'gusano'], 'Explota la **curiosidad de las personas** en el mundo físico. Dejar cebos así se llama «baiting».'],
  'escaneo': ['El firewall registra que una dirección externa probó, uno por uno, los puertos 1 al 1024 de todos los servidores públicos, sin intentar entrar en ninguno.', 'reconocimiento', ['dos', 'bruta', 'onpath'], 'Solo **reúne información** (qué equipos y servicios existen). Es la fase previa a un ataque.'],
  'correo-basura': ['El buzón de un usuario recibe cada día decenas de correos publicitarios de productos que nunca pidió.', 'spam', ['phishing', 'adware', 'spear'], 'Es **correo masivo no solicitado**. Molesta y satura, pero por sí mismo no intenta robar credenciales.'],
  'equipos-zombi': ['Miles de cámaras y routers domésticos infectados obedecen a la vez las órdenes de un mismo servidor de control, sin que sus dueños lo sepan.', 'botnet', ['gusano', 'ddos', 'troyano'], 'Es una **red de equipos infectados** («zombis») controlados a distancia. Suele usarse para lanzar DDoS o enviar spam.'],
};
definir('sg-ataque', '¿Qué ataque es?', {
  crear(rng) {
    const clave = elegir(rng, claves(ESCENAS));
    const tipo = ESCENAS[clave][1];
    return { caso: clave, d: varios(rng, ORDEN_ATAQUES.filter((x) => x !== tipo), 3) };
  },
  resolver(q) {
    const [texto, tipo, cerca, senal] = caso(ESCENAS, q.caso, 'sg-ataque');
    const d = (q.d ?? cerca).filter((x) => ATAQUES[x] && x !== tipo);
    const ids = ORDEN_ATAQUES.filter((x) => x === tipo || d.includes(x));
    return {
      enunciado: `${texto}\n\n¿Qué tipo de amenaza describe mejor esta situación?`,
      campos: [campo('r', 'Tipo de amenaza', 'opcion', ids.indexOf(tipo), { opciones: ids.map((x) => ATAQUES[x]), lista: true })],
      pistas: [
        'Primero decide la familia: ¿es un engaño a una persona, un programa malicioso o un ataque contra un servicio o una contraseña?',
        'Dentro de la familia, fíjate en el detalle que lo distingue: el canal (correo, teléfono, SMS), cómo se propaga o cuántos orígenes hay.',
        'Busca la palabra clave del escenario: rescate, se propaga solo, a medida, por teléfono, miles de orígenes, en medio…',
      ],
      pasos: [
        { t: senal },
        { t: `Respuesta: **${ATAQUES[tipo]}**.` },
        { t: 'Como técnico de soporte, tu trabajo no es investigar por tu cuenta: **no abras** enlaces ni adjuntos sospechosos, **aísla** el equipo afectado de la red si hay malware y **reporta** el incidente por el canal que marque la política de la empresa.' },
      ],
    };
  },
});

/* ------------------------------------------------------------- sg-aaa */
const AAA = ['Autenticación', 'Autorización', 'Contabilidad (registro)'];
const AAA_DEF = [
  '**Autenticación** responde a «¿quién eres?»: comprobar la identidad.',
  '**Autorización** responde a «¿qué puedes hacer?»: los permisos de esa identidad.',
  '**Contabilidad** (accounting) responde a «¿qué hiciste?»: dejar registro de la actividad.',
];
const ACCIONES = {
  'clave': ['El sistema pide usuario y contraseña antes de dejar entrar.', 0, 'Está comprobando la identidad de quien llega.'],
  'huella': ['El teléfono se desbloquea al reconocer la huella de su dueña.', 0, 'Reconocer la huella es comprobar que la persona es quien dice ser.'],
  'codigo-app': ['Después de la contraseña, el portal pide el código de seis dígitos de la aplicación autenticadora.', 0, 'Es un segundo factor para confirmar la identidad: sigue siendo autenticación.'],
  'certificado': ['El servidor VPN comprueba el certificado digital instalado en la computadora portátil antes de aceptar la conexión.', 0, 'El certificado demuestra la identidad del equipo.'],
  'tarjeta': ['La puerta del centro de datos lee la tarjeta de proximidad del técnico y verifica que pertenece a un empleado.', 0, 'Verificar a quién pertenece la tarjeta es identificar a la persona.'],
  'solo-lectura': ['Mateo Fuentes inicia sesión correctamente, pero solo puede leer la carpeta de contabilidad, no modificarla.', 1, 'Ya se sabe quién es; lo que se decide ahora es qué puede hacer.'],
  'sin-config': ['Un técnico de nivel 1 entra al switch, pero el sistema no le permite ejecutar `configure terminal`.', 1, 'El técnico está identificado; el sistema limita los comandos que puede usar.'],
  'vlan-invitados': ['Tras iniciar sesión en el Wi-Fi, los visitantes quedan en una red que solo permite salir a Internet.', 1, 'Según quién eres, se te concede un nivel de acceso distinto.'],
  'horario': ['La cuenta del becario solo puede iniciar sesión de lunes a viernes de 8:00 a 18:00.', 1, 'Es una regla sobre lo que esa identidad tiene permitido.'],
  'admin-impresora': ['Solo los miembros del grupo «Soporte» pueden instalar controladores de impresora.', 1, 'Los permisos por grupo son autorización.'],
  'bitacora': ['El servidor guarda que el usuario `rgomez` inició sesión a las 9:14 y cerró a las 17:32.', 2, 'Guarda cuándo y cuánto tiempo estuvo conectado: es registro de actividad.'],
  'comandos': ['El servidor TACACS+ guarda cada comando que los administradores ejecutan en los routers.', 2, 'Deja constancia de lo que se hizo, para poder revisarlo después.'],
  'datos-usados': ['El portal del hotel anota cuántos megabytes consumió cada habitación para cobrarlos.', 2, 'Medir el consumo para facturar es justo el origen de la palabra «contabilidad».'],
  'auditoria': ['Tras un incidente, el equipo de seguridad revisa quién abrió el archivo de nóminas y a qué hora.', 2, 'Esa revisión solo es posible porque el sistema registró los accesos.'],
  'intentos-fallidos': ['El firewall guarda una lista de todos los intentos de inicio de sesión fallidos con su fecha y dirección IP.', 2, 'Anotar lo que ocurrió, aunque el intento fallara, es contabilidad.'],
};
definir('sg-aaa', 'Autenticación, autorización o contabilidad', {
  crear: (rng) => ({ caso: elegir(rng, claves(ACCIONES)) }),
  resolver(q) {
    const [texto, r, porque] = caso(ACCIONES, q.caso, 'sg-aaa');
    return {
      enunciado: `¿A cuál de las tres «A» del modelo AAA corresponde esta situación?\n\n«${texto}»`,
      campos: [campo('r', 'Función AAA', 'opcion', r, { opciones: AAA })],
      pistas: [
        'Las tres preguntas, en orden: ¿quién eres?, ¿qué puedes hacer?, ¿qué hiciste?',
        'Comprobar identidad = autenticación. Permisos = autorización. Anotar lo ocurrido = contabilidad.',
        'Fíjate en el verbo: comprobar/verificar, permitir/impedir o guardar/registrar.',
      ],
      pasos: [
        { t: 'AAA son tres funciones que ocurren en este orden:', tabla: { cab: ['Función', 'Pregunta', 'Ejemplo'], filas: [['Autenticación', '¿Quién eres?', 'Usuario y contraseña, huella, código'], ['Autorización', '¿Qué puedes hacer?', 'Solo lectura, sin acceso a configuración'], ['Contabilidad', '¿Qué hiciste?', 'Registro de sesiones y comandos']] } },
        { t: porque },
        { t: AAA_DEF[r] },
      ],
    };
  },
});

/* -------------------------------------------------------- sg-factores */
const FACTORES = ['Algo que **sabes**', 'Algo que **tienes**', 'Algo que **eres**'];
const FACTOR_CORTO = ['sabes', 'tienes', 'eres'];
const METODOS = {
  clave: ['una contraseña', 0], pin: ['un PIN de cuatro dígitos', 0], pregunta: ['la respuesta a una pregunta de seguridad', 0], patron: ['un patrón de desbloqueo dibujado en la pantalla', 0],
  app: ['un código de una aplicación autenticadora en el teléfono', 1], sms: ['un código enviado por SMS al teléfono', 1], llave: ['una llave de seguridad USB', 1], tarjeta: ['una tarjeta inteligente', 1], token: ['un token físico que muestra un código', 1],
  huella: ['la huella dactilar', 2], rostro: ['el reconocimiento facial', 2], iris: ['el escaneo del iris', 2], voz: ['el reconocimiento de voz', 2],
};
definir('sg-factores', '¿Es multifactor?', {
  crear(rng, nivel) {
    const n = nivel >= 4 && rng() < 0.4 ? 3 : 2;
    if (rng() < 0.4) {
      const f = ent(rng, 0, 2);
      return { metodos: varios(rng, claves(METODOS).filter((m) => METODOS[m][1] === f), 2) };
    }
    return { metodos: varios(rng, claves(METODOS), n) };
  },
  resolver(q) {
    const ms = q.metodos.map((m) => caso(METODOS, m, 'sg-factores'));
    const distintos = new Set(ms.map(([, f]) => f)).size;
    const mfa = distintos >= 2;
    const lista = ms.map(([t]) => t);
    const frase = lista.length === 2 ? lista.join(' y ') : `${lista.slice(0, -1).join(', ')} y ${lista[lista.length - 1]}`;
    return {
      enunciado: `Para iniciar sesión, un sistema pide **${frase}**. ¿Cuántos tipos de factor **distintos** usa? ¿Es autenticación multifactor (MFA)?`,
      campos: [campo('n', 'Tipos de factor distintos', 'numero', distintos), campo('mfa', '¿Es MFA?', 'opcion', mfa ? 0 : 1, { opciones: ['Sí', 'No'] })],
      pistas: [
        'Hay tres tipos de factor: algo que sabes, algo que tienes y algo que eres.',
        'Clasifica cada método en uno de los tres tipos y cuenta cuántos tipos distintos aparecen.',
        'MFA exige al menos dos tipos **distintos**. Dos métodos del mismo tipo no cuentan.',
      ],
      pasos: [
        { t: 'Se clasifica cada método:', tabla: { cab: ['Método', 'Tipo de factor'], filas: ms.map(([t, f]) => [t.charAt(0).toUpperCase() + t.slice(1), FACTORES[f]]) } },
        { t: `Aparece${distintos === 1 ? '' : 'n'} **${distintos}** tipo${distintos === 1 ? '' : 's'} distinto${distintos === 1 ? '' : 's'}: ${[...new Set(ms.map(([, f]) => f))].sort().map((f) => `algo que ${FACTOR_CORTO[f]}`).join(', ')}.` },
        { t: mfa
          ? `Como combina al menos dos tipos distintos, **sí es MFA**. Quien robe uno de los factores todavía necesita otro de naturaleza diferente.`
          : `Todos los métodos son del mismo tipo (algo que ${FACTOR_CORTO[ms[0][1]]}): **no es MFA**, aunque pida ${lista.length} cosas. Quien consiga robar una probablemente pueda robar las otras de la misma forma.` },
      ],
    };
  },
});

/* ---------------------------------------------------------- sg-claves */
const JUEGOS = {
  digitos: ['solo dígitos (0–9)', 10], minus: ['solo letras minúsculas', 26], letras: ['letras minúsculas y mayúsculas', 52],
  alfanum: ['letras minúsculas, mayúsculas y dígitos', 62], todo: ['letras minúsculas, mayúsculas, dígitos y símbolos', 94],
};
const bitsDe = (largo, n) => largo * Math.log2(n);
definir('sg-claves', 'Fuerza de una contraseña', {
  crear(rng, nivel) {
    const ids = claves(JUEGOS);
    for (;;) {
      const q = nivel <= 2
        ? { largo: ent(rng, 4, 8), juego: elegir(rng, ['digitos', 'minus']), largo2: ent(rng, 4, 10), juego2: elegir(rng, ['digitos', 'minus', 'alfanum']) }
        : { largo: ent(rng, 6, 10), juego: elegir(rng, ['alfanum', 'todo', 'letras']), largo2: ent(rng, 10, 20), juego2: elegir(rng, ids) };
      if (Math.abs(bitsDe(q.largo, JUEGOS[q.juego][1]) - bitsDe(q.largo2, JUEGOS[q.juego2][1])) > 1.5) return q;
    }
  },
  resolver(q) {
    const [tA, nA] = caso(JUEGOS, q.juego, 'sg-claves');
    const [tB, nB] = caso(JUEGOS, q.juego2, 'sg-claves');
    const bA = bitsDe(q.largo, nA), bB = bitsDe(q.largo2, nB);
    const r = Math.abs(bA - bB) < 0.001 ? 2 : bA > bB ? 0 : 1;
    const exacto = (n, l) => (n ** l <= 1e15 ? ` = ${miles(n ** l)}` : '');
    const aprox = (b) => `≈ 2^${Math.round(b)}`;
    return {
      enunciado: `Compara dos políticas de contraseñas (suponiendo contraseñas elegidas al azar). ¿Cuántas combinaciones permite la política A, escritas como potencia? ¿Cuál de las dos resiste mejor un ataque de fuerza bruta?`,
      tabla: { cab: ['Política', 'Longitud', 'Caracteres permitidos'], filas: [['A', `${q.largo} caracteres`, tA], ['B', `${q.largo2} caracteres`, tB]] },
      campos: [
        campo('base', 'Política A · base (símbolos posibles)', 'numero', nA),
        campo('exp', 'Política A · exponente (longitud)', 'numero', q.largo),
        campo('fuerte', 'Resiste mejor la fuerza bruta', 'opcion', r, { opciones: ['Política A', 'Política B', 'Son equivalentes'] }),
      ],
      pistas: [
        'Combinaciones = (símbolos posibles) elevado a (longitud).',
        'Símbolos posibles: 10 dígitos, 26 minúsculas, 26 mayúsculas y unos 32 símbolos del teclado. Se suman los grupos permitidos.',
        'Para comparar, calcula las dos potencias. Cada carácter extra multiplica el total por la base entera.',
      ],
      pasos: [
        { t: `Cada posición de la contraseña puede ser cualquiera de los símbolos permitidos, y las posiciones son independientes: se multiplica la base por sí misma tantas veces como caracteres haya. **Combinaciones = base^longitud**.`,
          tabla: { cab: ['Grupo', 'Símbolos'], filas: [['Dígitos', '10'], ['Minúsculas', '26'], ['Mayúsculas', '26'], ['Símbolos del teclado', '32'], ['Los cuatro grupos juntos', '94']] } },
        { t: `Política A: ${tA} → base **${nA}**, longitud **${q.largo}**: ${nA}^${q.largo}${exacto(nA, q.largo)} (${aprox(bA)}).` },
        { t: `Política B: ${tB} → base ${nB}, longitud ${q.largo2}: ${nB}^${q.largo2}${exacto(nB, q.largo2)} (${aprox(bB)}).` },
        { t: r === 2 ? 'Las dos políticas permiten el mismo número de combinaciones.'
          : `La política **${r === 0 ? 'A' : 'B'}** permite muchas más combinaciones (2^${Math.round(Math.max(bA, bB))} frente a 2^${Math.round(Math.min(bA, bB))}), así que un ataque de fuerza bruta tardaría mucho más. `
            + (((r === 0 ? q.largo : q.largo2) > (r === 0 ? q.largo2 : q.largo) && (r === 0 ? nA : nB) <= (r === 0 ? nB : nA))
              ? 'Fíjate: gana la más **larga** aunque use menos tipos de caracteres. La longitud pesa más que la complejidad.'
              : 'Añadir longitud multiplica el total por la base completa en cada carácter extra; ampliar el juego de caracteres solo agranda la base.') },
      ],
    };
  },
});

/* --------------------------------------------------------- sg-cifrado */
const HERRAMIENTAS = ['Cifrado simétrico (por ejemplo, AES)', 'Cifrado asimétrico (clave pública y privada)', 'Función hash (por ejemplo, SHA-256)', 'Firma digital', 'Certificado digital'];
const NECESIDADES = {
  'disco': ['Cifrar el disco completo de una computadora portátil, de 500 GB, de forma rápida.', 0, 'Para grandes volúmenes de datos se usa cifrado simétrico: una sola clave y muy rápido. AES es el estándar.'],
  'wifi': ['Cifrar todo el tráfico entre un teléfono y el punto de acceso Wi-Fi con WPA2.', 0, 'El tráfico continuo se cifra con un algoritmo simétrico rápido: WPA2 usa AES.'],
  'respaldo': ['Proteger con una contraseña un archivo comprimido de respaldos antes de subirlo a la nube.', 0, 'La misma clave cifra y descifra: es cifrado simétrico.'],
  'vpn-datos': ['Cifrar el flujo de datos de un túnel VPN una vez que los dos extremos ya acordaron una clave.', 0, 'Acordada la clave, los datos del túnel viajan con cifrado simétrico por su velocidad.'],
  'enviar-secreto': ['Enviar un secreto a alguien con quien nunca has compartido una clave, de modo que solo esa persona pueda leerlo.', 1, 'Se cifra con la clave **pública** del destinatario; solo su clave **privada** lo descifra. No hace falta compartir nada secreto antes.'],
  'intercambio': ['Que un navegador y un servidor web que no se conocen acuerden una clave secreta a través de Internet.', 1, 'El cifrado asimétrico resuelve el problema de compartir una clave por un canal inseguro.'],
  'ssh-llaves': ['Iniciar sesión por SSH sin contraseña, usando un par de claves: una se queda en tu equipo y la otra se copia al servidor.', 1, 'Un par de claves (pública en el servidor, privada en tu equipo) es criptografía asimétrica.'],
  'descarga': ['Comprobar que la imagen de IOS que descargaste es idéntica, bit a bit, a la que publicó el fabricante.', 2, 'Se calcula el hash del archivo y se compara con el publicado: si un solo bit cambió, el hash es totalmente distinto.'],
  'guardar-claves': ['Guardar las contraseñas de los usuarios en la base de datos de forma que ni el administrador pueda leerlas.', 2, 'Se guarda el hash, no la contraseña: el hash no se puede revertir. Al iniciar sesión se compara el hash de lo que tecleas.'],
  'detectar-cambios': ['Detectar si alguien modificó un archivo de configuración desde la última revisión.', 2, 'Se guarda el hash del archivo y se vuelve a calcular: si difiere, el archivo cambió.'],
  'contrato': ['Demostrar que un contrato en PDF lo envió realmente la directora y que nadie lo alteró después.', 3, 'La firma digital aporta dos cosas a la vez: autenticidad (quién) e integridad (no cambió).'],
  'actualizacion': ['Que un sistema operativo compruebe que una actualización viene de verdad del fabricante antes de instalarla.', 3, 'El fabricante firma la actualización con su clave privada y el sistema la verifica con la clave pública.'],
  'no-repudio': ['Que quien envió una orden de pago no pueda negar después haberla enviado.', 3, 'Solo el dueño de la clave privada pudo firmar: eso es el no repudio.'],
  'sitio-real': ['Que el navegador confirme que `banco.example` pertenece de verdad a ese banco y no a un impostor.', 4, 'El certificado digital, emitido por una autoridad de certificación, une un nombre de dominio con una clave pública.'],
  'candado': ['Que aparezca el candado de HTTPS en el sitio web de la empresa sin avisos de seguridad.', 4, 'El servidor necesita un certificado válido, vigente y emitido por una autoridad en la que confíen los navegadores.'],
  'wifi-enterprise': ['Que las computadoras portátiles comprueben que el servidor RADIUS del Wi-Fi corporativo es el auténtico antes de enviarle credenciales.', 4, 'El servidor se identifica con un certificado digital que los equipos validan.'],
};
definir('sg-cifrado', 'Herramienta criptográfica', {
  crear: (rng) => ({ caso: elegir(rng, claves(NECESIDADES)) }),
  resolver(q) {
    const [texto, r, porque] = caso(NECESIDADES, q.caso, 'sg-cifrado');
    return {
      enunciado: `¿Qué herramienta criptográfica resuelve mejor esta necesidad?\n\n«${texto}»`,
      campos: [campo('r', 'Herramienta', 'opcion', r, { opciones: HERRAMIENTAS, lista: true })],
      pistas: [
        'Decide qué se busca: ¿esconder datos, comprobar que no cambiaron, demostrar quién los envió o identificar a un servidor?',
        'Esconder muchos datos rápido → simétrico. Esconder sin clave compartida → asimétrico. Comprobar cambios → hash.',
        'Quién lo envió y que no cambió → firma digital. A quién pertenece una clave pública → certificado.',
      ],
      pasos: [
        { t: 'Cada herramienta resuelve un problema distinto:', tabla: { cab: ['Herramienta', 'Claves', 'Sirve para'], filas: [
          ['Cifrado simétrico (AES)', 'Una sola, compartida', 'Cifrar muchos datos con rapidez'], ['Cifrado asimétrico (RSA)', 'Par pública / privada', 'Intercambiar claves y cifrar sin secreto previo'],
          ['Hash (SHA-256)', 'Ninguna', 'Comprobar integridad; guardar contraseñas'], ['Firma digital', 'Privada firma, pública verifica', 'Autenticidad, integridad y no repudio'], ['Certificado digital', 'Contiene una clave pública', 'Demostrar a quién pertenece esa clave']] } },
        { t: porque },
        { t: `Respuesta: **${HERRAMIENTAS[r]}**.` },
      ],
    };
  },
});

/* ------------------------------------------------------- sg-protocolo */
const SEGUROS = ['HTTPS', 'IMAPS', 'LDAPS', 'POP3S', 'SFTP', 'SNMPv3', 'SSH'];
// inseguro: [nombre, puerto, para qué sirve, alternativa, puerto seguro, nota]
const PROTOCOLOS = {
  telnet: ['Telnet', 23, 'administrar un switch o un router por línea de comandos', 'SSH', 22, 'SSH cifra toda la sesión, incluida la contraseña. Telnet la envía en texto claro.'],
  http: ['HTTP', 80, 'entrar a la página de administración de un punto de acceso', 'HTTPS', 443, 'HTTPS es HTTP dentro de un túnel TLS: cifra y además identifica al servidor con un certificado.'],
  ftp: ['FTP', 21, 'copiar archivos de configuración a un servidor', 'SFTP', 22, 'SFTP transfiere archivos sobre SSH, por eso usa el mismo puerto 22. FTP envía usuario, contraseña y archivos sin cifrar.'],
  tftp: ['TFTP', 69, 'respaldar la imagen de IOS de un router en un servidor a través de Internet', 'SFTP', 22, 'TFTP no tiene ni cifrado ni contraseña. Para una red no confiable se usa SFTP (o SCP), que viaja sobre SSH.'],
  snmp: ['SNMPv2c', 161, 'monitorizar el estado de los switches desde un sistema de gestión', 'SNMPv3', 161, 'SNMPv3 añade autenticación y cifrado sin cambiar de puerto. SNMPv1 y v2c usan una «comunidad» que viaja en texto claro.'],
  imap: ['IMAP', 143, 'leer el correo desde un programa cliente', 'IMAPS', 993, 'IMAPS es IMAP sobre TLS.'],
  pop3: ['POP3', 110, 'descargar el correo a un programa cliente', 'POP3S', 995, 'POP3S es POP3 sobre TLS.'],
  ldap: ['LDAP', 389, 'consultar el directorio de usuarios de la empresa', 'LDAPS', 636, 'LDAPS es LDAP sobre TLS: protege las credenciales que se envían al directorio.'],
};
definir('sg-protocolo', 'Protocolo seguro equivalente', {
  crear: (rng) => ({ caso: elegir(rng, claves(PROTOCOLOS)) }),
  resolver(q) {
    const [nombre, puerto, uso, alt, puertoAlt, nota] = caso(PROTOCOLOS, q.caso, 'sg-protocolo');
    return {
      enunciado: `Un técnico usa **${nombre}** (puerto ${puerto}) para ${uso}. Ese protocolo no cifra lo que transmite. ¿Qué protocolo seguro debería usar en su lugar y en qué puerto escucha por defecto?`,
      campos: [campo('alt', 'Protocolo seguro', 'opcion', SEGUROS.indexOf(alt), { opciones: SEGUROS, desplegable: true }), campo('puerto', 'Puerto por defecto', 'numero', puertoAlt)],
      pistas: [
        'Casi todos los protocolos clásicos tienen una versión cifrada: muchas veces el mismo nombre con una «S».',
        'Para línea de comandos y transferencia de archivos, la versión segura viaja sobre SSH.',
        'Puertos cifrados más comunes: SSH y SFTP 22, HTTPS 443, LDAPS 636, IMAPS 993, POP3S 995.',
      ],
      pasos: [
        { t: `${nombre} envía todo en **texto claro**: cualquiera que capture el tráfico (por ejemplo con Wireshark) puede leer usuarios, contraseñas y datos.` },
        { t: `La alternativa segura es **${alt}**, puerto **${puertoAlt}**. ${nota}` },
        { t: 'Parejas que conviene memorizar:', tabla: { cab: ['Inseguro', 'Puerto', 'Seguro', 'Puerto'], filas: [['Telnet', '23', 'SSH', '22'], ['HTTP', '80', 'HTTPS', '443'], ['FTP', '21', 'SFTP', '22'], ['SNMPv1 / v2c', '161', 'SNMPv3', '161'], ['IMAP', '143', 'IMAPS', '993'], ['POP3', '110', 'POP3S', '995'], ['LDAP', '389', 'LDAPS', '636']] } },
      ],
    };
  },
});

/* -------------------------------------------------------- sg-firewall */
const SERVICIOS = { 20: 'FTP datos', 21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS', 69: 'TFTP', 80: 'HTTP', 110: 'POP3', 123: 'NTP', 143: 'IMAP', 161: 'SNMP', 443: 'HTTPS', 3389: 'RDP' };
const PUERTOS = { tcp: [22, 23, 25, 80, 443, 3389], udp: [53, 69, 123, 161] };
const PROTO = { tcp: 'TCP', udp: 'UDP', icmp: 'ICMP', ip: 'IP (cualquiera)' };
const ACCION = { permitir: 'Permitir', denegar: 'Denegar' };
const esCualquiera = (x) => x === 'cualquiera';
/** "192.168.1.0/24" o "10.0.0.5" → { d, p } */
function bloque(texto) {
  const [dir, pre] = String(texto).split('/');
  return { d: ip(dir), p: pre === undefined ? 32 : Number(pre) };
}
const dentro = (regla, direccion) => { if (esCualquiera(regla)) return true; const b = bloque(regla); return red(ip(direccion), b.p) === red(b.d, b.p); };
const verPuerto = (n) => (n ? `${n}${SERVICIOS[n] ? ` (${SERVICIOS[n]})` : ''}` : 'cualquiera');
const verDir = (x) => (esCualquiera(x) ? 'cualquiera' : x.endsWith('/32') ? `host ${x.slice(0, -3)}` : x);
/** Primer criterio que falla, o '' si la regla coincide con el paquete. */
function fallo(r, k) {
  if (r.proto !== 'ip' && r.proto !== k.proto) return `el protocolo es ${PROTO[k.proto]}, no ${PROTO[r.proto]}`;
  if (!dentro(r.o, k.o)) return `el origen ${k.o} no está en ${verDir(r.o)}`;
  if (!dentro(r.d, k.d)) return `el destino ${k.d} no está en ${verDir(r.d)}`;
  if (r.puerto && r.puerto !== k.puerto) return `el puerto de destino es ${k.puerto || 'ninguno'}, no ${r.puerto}`;
  return '';
}
definir('sg-firewall', 'Reglas de firewall', {
  crear(rng, nivel) {
    const a = ent(rng, 1, 60), b = ent(rng, 61, 120), c = ent(rng, 1, 50);
    const lan = `192.168.${a}.0/24`, lan2 = `192.168.${b}.0/24`, srvRed = `10.${c}.${c + 1}.0/24`;
    const srv = `10.${c}.${c + 1}.${ent(rng, 5, 30)}`;
    const pc = `192.168.${a}.${ent(rng, 10, 120)}`;
    const mitad = nivel >= 5 ? `192.168.${a}.128/25` : lan;
    const origenes = [lan, lan, lan2, 'cualquiera', `${pc}/32`, mitad];
    const destinos = [`${srv}/32`, srvRed, 'cualquiera', `${srv}/32`];
    const total = nivel <= 2 ? 3 : nivel <= 4 ? 4 : 5;
    const reglas = [];
    const vistas = new Set();
    while (reglas.length < total) {
      const proto = elegir(rng, ['tcp', 'tcp', 'tcp', 'udp', 'icmp', 'ip']);
      const r = { a: elegir(rng, ['permitir', 'permitir', 'denegar']), proto, o: elegir(rng, origenes), d: elegir(rng, destinos), puerto: PUERTOS[proto] ? (rng() < 0.85 ? elegir(rng, PUERTOS[proto]) : 0) : 0 };
      const clave = `${r.proto}|${r.o}|${r.d}|${r.puerto}`;
      if (vistas.has(clave) || (r.proto === 'ip' && esCualquiera(r.o) && esCualquiera(r.d) && reglas.length < total - 1)) continue;
      vistas.add(clave);
      reglas.push(r);
    }
    // El paquete se construye para que encaje en una regla al azar (o en ninguna): así salen reglas que «tapan» a otras.
    const k = rng() < 0.22 ? -1 : ent(rng, 0, total - 1);
    const hostEn = (x, otro) => { if (esCualquiera(x)) return otro; const q = bloque(x); return aTexto(q.d + (q.p === 32 ? 0 : ent(rng, 2, 2 ** (32 - q.p) - 3))); };
    const externo = `203.0.113.${ent(rng, 2, 250)}`;
    let paquete;
    if (k < 0) {
      const proto = elegir(rng, ['tcp', 'udp', 'icmp']);
      paquete = { proto, o: elegir(rng, [externo, hostEn(lan2), hostEn(lan)]), d: elegir(rng, [srv, hostEn(srvRed)]), puerto: PUERTOS[proto] ? elegir(rng, PUERTOS[proto]) : 0 };
    } else {
      const r = reglas[k];
      const proto = r.proto === 'ip' ? elegir(rng, ['tcp', 'udp', 'icmp']) : r.proto;
      paquete = { proto, o: hostEn(r.o, elegir(rng, [externo, hostEn(lan)])), d: hostEn(r.d, elegir(rng, [srv, `198.51.100.${ent(rng, 2, 250)}`])), puerto: PUERTOS[proto] ? (r.puerto || elegir(rng, PUERTOS[proto])) : 0 };
    }
    return { reglas, paquete };
  },
  resolver(q) {
    const k = q.paquete;
    const fallos = q.reglas.map((r) => fallo(r, k));
    const i = fallos.findIndex((f) => f === '');
    const permite = i >= 0 && q.reglas[i].a === 'permitir';
    const opcionesRegla = [...q.reglas.map((_, n) => `Regla ${n + 1}`), 'Ninguna: se aplica la denegación implícita'];
    const tapadas = q.reglas.map((_, n) => n).filter((n) => i >= 0 && n > i && fallos[n] === '');
    const conPuerto = k.proto === 'tcp' || k.proto === 'udp';
    return {
      enunciado: `Un firewall revisa cada paquete con estas reglas, **de arriba abajo**, y aplica la **primera que coincide**. Si ninguna coincide, deniega el paquete (denegación implícita). Llega un paquete **${PROTO[k.proto]}** de \`${k.o}\` a \`${k.d}\`${conPuerto ? `, puerto de destino **${verPuerto(k.puerto)}**` : ' (un ping, por ejemplo)'}. ¿Qué regla se le aplica y qué hace el firewall?`,
      tabla: { cab: ['Regla', 'Acción', 'Protocolo', 'Origen', 'Destino', 'Puerto destino'], filas: q.reglas.map((r, n) => [String(n + 1), ACCION[r.a], PROTO[r.proto], verDir(r.o), verDir(r.d), PUERTOS[r.proto] ? verPuerto(r.puerto) : '—']) },
      campos: [
        campo('regla', 'Regla que se aplica', 'opcion', i >= 0 ? i : q.reglas.length, { opciones: opcionesRegla, desplegable: true }),
        campo('accion', 'El paquete', 'opcion', permite ? 0 : 1, { opciones: ['Se permite', 'Se deniega'] }),
      ],
      pistas: [
        'Empieza por la regla 1 y compara los cuatro criterios: protocolo, origen, destino y puerto. Tienen que coincidir **todos**.',
        'Una red como 192.168.5.0/24 incluye a todas las direcciones 192.168.5.x. «Cualquiera» coincide con todo, y el protocolo IP incluye TCP, UDP e ICMP.',
        'En cuanto una regla coincide, se aplica su acción y se deja de leer. Si llegas al final sin coincidencias, el paquete se deniega.',
      ],
      pasos: [
        { t: 'Se compara el paquete con cada regla, en orden. Una regla coincide solo si se cumplen **todos** sus criterios.',
          tabla: { cab: ['Regla', '¿Coincide?', 'Motivo'], filas: q.reglas.map((r, n) => [String(n + 1),
            i >= 0 && n > i ? 'No se evalúa' : fallos[n] === '' ? '**Sí**' : 'No',
            i >= 0 && n > i ? 'El firewall ya se detuvo en una regla anterior' : fallos[n] === '' ? 'Protocolo, origen, destino y puerto coinciden' : `No coincide: ${fallos[n]}`]) } },
        { t: i >= 0
          ? `La primera regla que coincide es la **${i + 1}**, cuya acción es ${ACCION[q.reglas[i].a].toLowerCase()}: el paquete **se ${permite ? 'permite' : 'deniega'}**.`
          : 'Ninguna regla coincide. Al final de toda lista hay una regla invisible que lo deniega todo: la **denegación implícita**. El paquete **se deniega**.' },
        { t: tapadas.length
          ? `Ojo: la regla ${tapadas.map((n) => n + 1).join(' y la ')} también habría coincidido${tapadas.some((n) => q.reglas[n].a !== q.reglas[i].a) ? ', y con la acción contraria' : ''}, pero nunca llega a leerse para este paquete. Por eso **el orden de las reglas importa**: las más específicas van arriba.`
          : 'Regla práctica: las reglas más específicas se colocan arriba y las más generales abajo, porque el firewall deja de leer en la primera coincidencia.' },
      ],
    };
  },
});

/* ------------------------------------------------------------ sg-wifi */
const MODOS = ['WEP', 'WPA2-Personal o WPA3-Personal en modo mixto (transición)', 'WPA3-Personal', 'WPA2-Enterprise o WPA3-Enterprise (802.1X con servidor RADIUS)', 'Red abierta con filtrado por dirección MAC'];
const LUGARES = {
  casa: ['una casa con cinco dispositivos de la familia', false], cafeteria: ['una cafetería pequeña que da Wi-Fi a su personal', false], despacho: ['un despacho de seis personas sin servidores', false],
  consultorio: ['un consultorio médico con tres computadoras', false], empresa: ['una empresa de 300 empleados con Active Directory', true], universidad: ['una universidad con miles de estudiantes y cuentas institucionales', true],
  hospital: ['un hospital con 800 trabajadores y un servidor RADIUS', true], corporativo: ['un corporativo con rotación alta de personal y cuentas de dominio', true],
};
definir('sg-wifi', 'Modo de seguridad Wi-Fi', {
  crear(rng) {
    const lugar = elegir(rng, claves(LUGARES));
    return { lugar, individual: LUGARES[lugar][1] ? rng() < 0.85 : false, antiguos: rng() < 0.45 };
  },
  resolver(q) {
    const [texto] = caso(LUGARES, q.lugar, 'sg-wifi');
    const r = q.individual ? 3 : q.antiguos ? 1 : 2;
    const requisitos = [
      q.individual ? 'Cada persona debe entrar con **su propio usuario y contraseña**, y al dar de baja a alguien su acceso debe cortarse sin cambiar nada a los demás.' : 'Todos los usuarios pueden compartir **una misma clave** de la red.',
      q.antiguos ? 'Hay algunos equipos de hace varios años que **no son compatibles con WPA3**.' : 'Todos los equipos son recientes y **compatibles con WPA3**.',
    ];
    return {
      enunciado: `Vas a configurar el Wi-Fi de ${texto}. ${requisitos.join(' ')} ¿Qué modo de seguridad recomiendas?`,
      campos: [campo('r', 'Modo de seguridad', 'opcion', r, { opciones: MODOS, lista: true })],
      pistas: [
        'Primera decisión: ¿una clave compartida (Personal) o credenciales individuales (Enterprise)?',
        'Segunda decisión: usa siempre la generación más nueva que soporten todos los equipos. WPA3 es mejor que WPA2.',
        'WEP está roto y una red abierta no cifra nada: ninguna de las dos es aceptable. El filtrado MAC no protege, porque una MAC se puede copiar.',
      ],
      pasos: [
        { t: q.individual
          ? 'Se piden **credenciales individuales** y poder revocar a una sola persona. Eso es el modo **Enterprise**: el punto de acceso usa 802.1X y delega la autenticación en un servidor RADIUS, que consulta el directorio de usuarios.'
          : 'Basta con **una clave compartida**: es el modo **Personal** (clave precompartida, PSK). No hace falta ningún servidor, pero si la clave se filtra hay que cambiarla en todos los equipos.' },
        { t: q.individual
          ? (q.antiguos ? 'Los equipos antiguos entrarán con WPA2-Enterprise y los nuevos con WPA3-Enterprise; en los dos casos cada usuario se autentica con su cuenta.' : 'Como todos los equipos son recientes, lo ideal es WPA3-Enterprise; WPA2-Enterprise sigue siendo válido.')
          : (q.antiguos ? 'Como hay equipos que no soportan WPA3, se usa el **modo mixto o de transición WPA2/WPA3**: los equipos nuevos negocian WPA3 (SAE) y los antiguos WPA2 (AES). Nunca se baja a WPA ni a WEP.' : 'Todos soportan WPA3, así que se elige **WPA3-Personal**: usa SAE, que resiste los ataques de diccionario contra la clave aunque alguien capture la conexión.') },
        { t: `Respuesta: **${MODOS[r]}**.`, tabla: { cab: ['Opción', '¿Es aceptable?'], filas: [['WEP', 'No: se rompe en minutos'], ['Red abierta + filtrado MAC', 'No: no cifra y la MAC se puede copiar'], ['WPA2/WPA3 mixto', 'Sí, cuando hay equipos sin WPA3'], ['WPA3-Personal', 'Sí: lo mejor con clave compartida'], ['Enterprise (802.1X)', 'Sí: lo mejor con cuentas individuales']] } },
      ],
    };
  },
});

/* -------------------------------------------------------- sg-endurecer */
// [enunciado, comando, modo, explicación]
const ENDURECER = {
  secret: (q) => [`Estás en configuración global. Protege el acceso al modo privilegiado con la contraseña ${q.clave}, guardada con hash (no con el comando antiguo que la deja en texto claro).`, `enable secret ${q.clave}`, 'Switch(config)#', '`enable secret` guarda la contraseña como un hash. `enable password` la guarda en texto claro: no debe usarse.'],
  cifrar: () => ['Estás en configuración global. Haz que las contraseñas que están en texto claro en la configuración se guarden ofuscadas.', 'service password-encryption', 'Switch(config)#', '`service password-encryption` ofusca las contraseñas de las líneas para que no se lean a simple vista en `show running-config`. Es un cifrado débil, pero evita miradas indiscretas.'],
  usuario: (q) => [`Estás en configuración global. Crea el usuario local ${q.usuario} con la contraseña ${q.clave} guardada con hash.`, `username ${q.usuario} secret ${q.clave}`, 'Switch(config)#', 'Las cuentas locales con `secret` permiten que cada administrador tenga su propio usuario, en vez de compartir una contraseña.'],
  vty: () => ['Estás en configuración global. Entra en las cinco primeras líneas de acceso remoto (de la 0 a la 4).', 'line vty 0 4', 'Switch(config)#', 'Las líneas VTY son las «puertas» por las que entran las sesiones remotas (Telnet o SSH). Ahí se decide qué protocolo se acepta.'],
  ssh: () => ['Estás dentro de las líneas VTY. Permite solo conexiones SSH, de modo que Telnet quede rechazado.', 'transport input ssh', 'Switch(config-line)#', '`transport input ssh` acepta únicamente SSH. Telnet envía la contraseña sin cifrar y queda bloqueado.'],
  local: () => ['Estás dentro de las líneas VTY. Haz que el inicio de sesión pida un usuario y contraseña de la base de datos local del equipo.', 'login local', 'Switch(config-line)#', '`login local` usa las cuentas creadas con `username`. SSH necesita un nombre de usuario, así que este comando es obligatorio.'],
  espera: (q) => [`Estás dentro de la línea de consola. Haz que una sesión sin actividad se cierre sola a los ${q.min} minutos.`, `exec-timeout ${q.min} 0`, 'Switch(config-line)#', '`exec-timeout minutos segundos` cierra las sesiones olvidadas. Así nadie aprovecha una consola que un técnico dejó abierta.'],
  apagar: () => ['Estás dentro de la interfaz Fa0/20, que no tiene ningún equipo conectado. Desactívala.', 'shutdown', 'Switch(config-if)#', 'Un puerto sin uso y encendido es una entrada libre a la red. Los puertos que no se usan se apagan con `shutdown`.'],
  portsec: () => ['Estás dentro de un puerto de acceso. Activa la seguridad de puerto para limitar qué direcciones MAC pueden usarlo.', 'switchport port-security', 'Switch(config-if)#', '`switchport port-security` activa la función. Por defecto permite una sola dirección MAC y apaga el puerto si aparece otra.'],
  maximo: (q) => [`Estás dentro de un puerto de acceso con seguridad de puerto. Permite como máximo ${q.max} direcciones MAC.`, `switchport port-security maximum ${q.max}`, 'Switch(config-if)#', 'El máximo evita que alguien conecte un switch pequeño o un punto de acceso propio en un puerto de escritorio.'],
  sshv2: () => ['Estás en configuración global. Obliga a usar la versión 2 de SSH.', 'ip ssh version 2', 'Switch(config)#', 'La versión 1 de SSH tiene fallos conocidos. `ip ssh version 2` la desactiva.'],
  llaves: () => ['Estás en configuración global y ya configuraste el nombre del equipo y el dominio. Genera el par de claves RSA que SSH necesita.', 'crypto key generate rsa', 'Switch(config)#', 'SSH necesita un par de claves RSA en el equipo. Al ejecutarlo, IOS pregunta el tamaño: se recomiendan 2048 bits.'],
  guardar: () => ['Estás en modo privilegiado. Guarda la configuración en ejecución para que sobreviva a un reinicio.', 'copy running-config startup-config', 'Switch#', 'Sin guardar, todo el endurecimiento se pierde al reiniciar. `copy running-config startup-config` copia la configuración activa a la NVRAM.'],
};
definir('sg-endurecer', 'Comando de protección', {
  crear: (rng) => ({ caso: elegir(rng, claves(ENDURECER)), clave: elegir(rng, ['R3d-Segura', 'Cisc0-Lab', 'Tunel-47', 'Acces0-9']), usuario: elegir(rng, ['admin', 'soporte', 'tecnico']), min: elegir(rng, [3, 5, 10]), max: elegir(rng, [2, 3, 4]) }),
  resolver(q) {
    const f = caso(ENDURECER, q.caso, 'sg-endurecer');
    const [enunciado, comando, modo, explica] = f(q);
    const palabras = comando.split(' ');
    return {
      enunciado: `${enunciado}\n\nEstás en: \`${modo}\``,
      campos: [campo('cmd', 'Comando', 'comando', comando)],
      pistas: [
        `El comando empieza por \`${palabras[0]}\`.`,
        `Tiene ${palabras.length} palabra${palabras.length === 1 ? '' : 's'}.`,
        palabras.length === 1 ? 'Es el mismo comando que se usa para apagar cualquier interfaz.' : `Empieza así: \`${palabras.slice(0, palabras.length - 1).join(' ')}\`…`,
      ],
      pasos: [{ t: `Comando: \`${comando}\`` }, { t: explica }],
    };
  },
});

/* ------------------------------------------------------------ niveles */
niveles('seguridad', [
  { n: 1, nombre: 'Fundamentos', resumen: 'Tríada CIA y vocabulario: activo, amenaza, vulnerabilidad, exploit y mitigación.',
    tipos: [['sg-cia', 3], ['sg-riesgo', 3], ['banco', 4]] },
  { n: 2, nombre: 'Amenazas', resumen: 'Reconocer malware, phishing y sus variantes, ingeniería social y denegación de servicio.',
    tipos: [['sg-ataque', 4], ['sg-cia', 1], ['banco', 5]] },
  { n: 3, nombre: 'Identidad', resumen: 'AAA, factores de autenticación, MFA y fuerza de las contraseñas.',
    tipos: [['sg-aaa', 2], ['sg-factores', 3], ['sg-claves', 2], ['banco', 4]] },
  { n: 4, nombre: 'Cifrado', resumen: 'Simétrico, asimétrico, hash, firma, certificados y protocolos seguros.',
    tipos: [['sg-cifrado', 3], ['sg-protocolo', 2], ['sg-factores', 1], ['banco', 4]] },
  { n: 5, nombre: 'Firewalls', resumen: 'Leer listas de reglas: primera coincidencia, orden y denegación implícita.',
    tipos: [['sg-firewall', 5], ['sg-protocolo', 1], ['banco', 4]] },
  { n: 6, nombre: 'Wi-Fi y dispositivos', resumen: 'Elegir el modo de seguridad inalámbrica, endurecer switches y routers, y reglas de firewall más largas.',
    tipos: [['sg-wifi', 3], ['sg-endurecer', 3], ['sg-firewall', 2], ['sg-claves', 1], ['banco', 4]] },
]);
