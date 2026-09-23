-- =====================================================================
--  Tutoriales Lucio · CODLYX — migración v1.4.0 → v1.5.0
--  Academia de Comandos: catálogo de sistemas, categorías, comandos,
--  misiones y juegos.
--
--  QUÉ VIVE AQUÍ Y QUÉ NO
--    · MySQL guarda METADATOS: qué existe, de qué sistema es, en qué
--      categoría, con qué dificultad y en qué orden. Sirve para listar,
--      buscar y administrar el catálogo sin abrir los JSON.
--    · El CONTENIDO (explicaciones, ejemplos, escenarios, niveles) vive en
--      public/assets/academia/data/*.json, que es lo que descarga el
--      navegador para el simulador y los juegos. No se duplica en la BD:
--      tener dos copias del mismo texto es garantía de que se contradigan.
--    · NO se guardan escenas de Phaser ni bloques de JavaScript en MySQL.
--
--  La academia funciona SIN base de datos: si no aplicas esta migración,
--  todo se sirve desde los JSON. La migración solo habilita la consulta
--  del catálogo desde SQL.
--
--  NO toca ninguna tabla de los tutoriales (tutorials, tutorial_sections,
--  categories): solo crea tablas nuevas con prefijo academia_.
--  Es idempotente: puede reejecutarse sin duplicar nada.
--
--  Aplicar DESPUÉS de subir los archivos del parche:
--     mysql -u USUARIO -p NOMBRE_BD < v1.5.0-academia.sql
--  o desde cPanel > phpMyAdmin > Importar.
-- =====================================================================

SET NAMES utf8mb4;

-- --------------------------- Sistemas --------------------------------
CREATE TABLE IF NOT EXISTS academia_sistemas (
    slug        VARCHAR(16)  NOT NULL,
    nombre      VARCHAR(64)  NOT NULL,
    shell       VARCHAR(32)  NOT NULL DEFAULT '',
    prompt      VARCHAR(64)  NOT NULL DEFAULT '',
    resumen     VARCHAR(320) NOT NULL DEFAULT '',
    sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------- Categorías -------------------------------
CREATE TABLE IF NOT EXISTS academia_categorias (
    id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    os          VARCHAR(16)  NOT NULL,
    slug        VARCHAR(48)  NOT NULL,
    nombre      VARCHAR(96)  NOT NULL,
    descripcion VARCHAR(240) NOT NULL DEFAULT '',
    sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_academia_cat (os, slug),
    CONSTRAINT fk_academia_cat_sistema FOREIGN KEY (os)
        REFERENCES academia_sistemas (slug) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------- Comandos --------------------------------
-- `simulado` refleja si la terminal virtual lo ejecuta de verdad; es la
-- diferencia entre «lo explicamos» y «lo puedes practicar», y el sitio la
-- muestra tal cual para no prometer de más.
CREATE TABLE IF NOT EXISTS academia_comandos (
    id          MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    os          VARCHAR(16)  NOT NULL,
    slug        VARCHAR(64)  NOT NULL,
    nombre      VARCHAR(64)  NOT NULL,
    categoria   VARCHAR(48)  NOT NULL DEFAULT '',
    resumen     VARCHAR(320) NOT NULL DEFAULT '',
    dificultad  ENUM('basico','intermedio','avanzado') NOT NULL DEFAULT 'basico',
    simulado    TINYINT(1)   NOT NULL DEFAULT 0,
    sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_academia_cmd (os, slug),
    KEY idx_academia_cmd_cat (os, categoria, sort_order),
    CONSTRAINT fk_academia_cmd_sistema FOREIGN KEY (os)
        REFERENCES academia_sistemas (slug) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------- Misiones --------------------------------
CREATE TABLE IF NOT EXISTS academia_misiones (
    id          VARCHAR(48)  NOT NULL,
    os          VARCHAR(16)  NOT NULL,
    escenario   VARCHAR(48)  NOT NULL DEFAULT '',
    titulo      VARCHAR(160) NOT NULL,
    nivel       ENUM('basico','intermedio','avanzado') NOT NULL DEFAULT 'basico',
    objetivo    VARCHAR(320) NOT NULL DEFAULT '',
    xp          SMALLINT UNSIGNED NOT NULL DEFAULT 20,
    sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_academia_mis_os (os, sort_order),
    CONSTRAINT fk_academia_mis_sistema FOREIGN KEY (os)
        REFERENCES academia_sistemas (slug) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------- Juegos ---------------------------------
CREATE TABLE IF NOT EXISTS academia_juegos (
    slug        VARCHAR(48)  NOT NULL,
    nombre      VARCHAR(96)  NOT NULL,
    numero      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    motor       ENUM('phaser','dom') NOT NULL DEFAULT 'dom',
    resumen     VARCHAR(320) NOT NULL DEFAULT '',
    niveles     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------- Datos: sistemas -----------------------------
INSERT INTO academia_sistemas (slug, nombre, shell, prompt, resumen, sort_order) VALUES
    ('linux', 'Linux · Bash', 'bash', 'alumno@academia:~$', 'La terminal de GNU/Linux: Bash y las herramientas clásicas del sistema. Todo son archivos y todo se puede encadenar.', 10),
    ('cmd', 'Windows · CMD', 'cmd', 'C:\\Users\\Alumno>', 'El intérprete clásico de Windows. Rutas con barra invertida, opciones con barra normal y una tubería que transporta texto: heredero directo del MS-DOS y todavía presente en cualquier Windows.', 20),
    ('powershell', 'Windows · PowerShell', 'powershell', 'PS C:\\Users\\Alumno>', 'La consola moderna de Windows: cmdlets con nombre Verbo-Sustantivo y un pipeline por el que viajan objetos, no texto. Eso cambia la forma de filtrar, ordenar y contar.', 30)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), shell = VALUES(shell),
    prompt = VALUES(prompt), resumen = VALUES(resumen), sort_order = VALUES(sort_order);

-- ---------------------- Datos: categorías ----------------------------
INSERT INTO academia_categorias (os, slug, nombre, descripcion, sort_order) VALUES
    ('linux', 'fundamentos', 'Fundamentos', 'Orientarte: dónde estás, qué hay y quién eres.', 10),
    ('linux', 'archivos', 'Archivos y directorios', 'Crear, copiar, mover y borrar con cabeza.', 20),
    ('linux', 'texto', 'Leer y procesar texto', 'Ver archivos, filtrarlos y transformarlos.', 30),
    ('linux', 'permisos', 'Usuarios y permisos', 'Quién puede leer, escribir y ejecutar.', 40),
    ('linux', 'procesos', 'Procesos', 'Qué se está ejecutando y cómo pararlo.', 50),
    ('linux', 'sistema', 'Sistema', 'Disco, memoria, servicios y registros.', 60),
    ('linux', 'redes', 'Redes', 'Conectividad, nombres y puertos.', 70),
    ('linux', 'compresion', 'Compresión', 'Empaquetar y desempaquetar.', 80),
    ('linux', 'bash', 'Bash y automatización', 'Variables, tuberías, redirecciones y scripts.', 90),
    ('cmd', 'fundamentos', 'Fundamentos', 'Orientarte: dónde estás, qué hay y cómo se ve.', 10),
    ('cmd', 'archivos', 'Archivos y carpetas', 'Crear, copiar, mover y borrar con cabeza.', 20),
    ('cmd', 'busqueda', 'Búsqueda y texto', 'Encontrar archivos, filtrar líneas y comparar contenidos.', 30),
    ('cmd', 'automatizacion', 'Automatización', 'Variables, condiciones, bucles y archivos por lotes.', 40),
    ('cmd', 'sistema', 'Sistema', 'Procesos, servicios, usuarios e información del equipo.', 50),
    ('cmd', 'redes', 'Redes', 'Direcciones, conectividad, nombres y puertos.', 60),
    ('powershell', 'fundamentos', 'Fundamentos', 'Orientarte, descubrir cmdlets y leer su ayuda.', 10),
    ('powershell', 'pipeline-objetos', 'Pipeline y objetos', 'Lo que hace distinto a PowerShell: filtrar, ordenar y contar por propiedades.', 20),
    ('powershell', 'archivos', 'Archivos y contenido', 'Crear, copiar, mover, borrar y leer, con Item y Content.', 30),
    ('powershell', 'procesos-servicios', 'Procesos y servicios', 'Qué se ejecuta, qué servicios hay y cómo pararlos.', 40),
    ('powershell', 'automatizacion', 'Automatización', 'Variables, colecciones, bucles, funciones, scripts y errores.', 50),
    ('powershell', 'sistema', 'Sistema', 'Información del equipo, fechas, eventos y clases CIM.', 60),
    ('powershell', 'redes', 'Redes', 'Conectividad, puertos, direcciones y DNS.', 70)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion), sort_order = VALUES(sort_order);

-- ----------------------- Datos: comandos -----------------------------
INSERT INTO academia_comandos (os, slug, nombre, categoria, resumen, dificultad, simulado, sort_order) VALUES
    ('linux', 'ls', 'ls', 'fundamentos', 'Lista el contenido de un directorio.', 'basico', 1, 10),
    ('linux', 'pwd', 'pwd', 'fundamentos', 'Imprime la ruta del directorio en el que estás.', 'basico', 1, 20),
    ('linux', 'cd', 'cd', 'fundamentos', 'Cambia el directorio de trabajo.', 'basico', 1, 30),
    ('linux', 'clear', 'clear', 'fundamentos', 'Limpia la pantalla de la terminal.', 'basico', 1, 40),
    ('linux', 'whoami', 'whoami', 'fundamentos', 'Muestra el nombre del usuario actual.', 'basico', 1, 50),
    ('linux', 'hostname', 'hostname', 'fundamentos', 'Muestra el nombre del equipo.', 'basico', 1, 60),
    ('linux', 'date', 'date', 'fundamentos', 'Muestra (o formatea) la fecha y la hora del sistema.', 'basico', 1, 70),
    ('linux', 'history', 'history', 'fundamentos', 'Lista los comandos que has escrito.', 'basico', 1, 80),
    ('linux', 'man', 'man', 'fundamentos', 'Abre el manual de un comando.', 'basico', 1, 90),
    ('linux', 'echo', 'echo', 'fundamentos', 'Escribe texto en la salida.', 'basico', 1, 100),
    ('linux', 'type', 'type', 'fundamentos', 'Dice qué es realmente un comando.', 'intermedio', 1, 110),
    ('linux', 'which', 'which', 'fundamentos', 'Muestra la ruta del ejecutable que se usaría.', 'basico', 1, 120),
    ('linux', 'mkdir', 'mkdir', 'archivos', 'Crea directorios.', 'basico', 1, 130),
    ('linux', 'touch', 'touch', 'archivos', 'Crea un archivo vacío o actualiza su fecha.', 'basico', 1, 140),
    ('linux', 'cp', 'cp', 'archivos', 'Copia archivos y directorios.', 'basico', 1, 150),
    ('linux', 'mv', 'mv', 'archivos', 'Mueve o renombra archivos y directorios.', 'basico', 1, 160),
    ('linux', 'rm', 'rm', 'archivos', 'Borra archivos y directorios. Sin papelera.', 'intermedio', 1, 170),
    ('linux', 'rmdir', 'rmdir', 'archivos', 'Borra directorios vacíos.', 'basico', 1, 180),
    ('linux', 'find', 'find', 'archivos', 'Busca archivos recorriendo el árbol de directorios.', 'intermedio', 1, 190),
    ('linux', 'tree', 'tree', 'archivos', 'Dibuja el árbol de directorios.', 'basico', 1, 200),
    ('linux', 'file', 'file', 'archivos', 'Dice qué tipo de contenido tiene un archivo.', 'basico', 1, 210),
    ('linux', 'stat', 'stat', 'archivos', 'Muestra todos los metadatos de un archivo.', 'intermedio', 1, 220),
    ('linux', 'ln', 'ln', 'archivos', 'Crea enlaces entre archivos.', 'avanzado', 1, 230),
    ('linux', 'cat', 'cat', 'texto', 'Muestra el contenido de uno o varios archivos.', 'basico', 1, 240),
    ('linux', 'less', 'less', 'texto', 'Lee un archivo página a página.', 'basico', 1, 250),
    ('linux', 'head', 'head', 'texto', 'Muestra las primeras líneas de un archivo.', 'basico', 1, 260),
    ('linux', 'tail', 'tail', 'texto', 'Muestra las últimas líneas de un archivo.', 'basico', 1, 270),
    ('linux', 'wc', 'wc', 'texto', 'Cuenta líneas, palabras y caracteres.', 'basico', 1, 280),
    ('linux', 'grep', 'grep', 'texto', 'Filtra las líneas que coinciden con un patrón.', 'intermedio', 1, 290),
    ('linux', 'cut', 'cut', 'texto', 'Extrae columnas de cada línea.', 'intermedio', 1, 300),
    ('linux', 'sort', 'sort', 'texto', 'Ordena líneas.', 'basico', 1, 310),
    ('linux', 'uniq', 'uniq', 'texto', 'Colapsa líneas repetidas consecutivas.', 'intermedio', 1, 320),
    ('linux', 'tr', 'tr', 'texto', 'Sustituye o elimina caracteres.', 'intermedio', 1, 330),
    ('linux', 'diff', 'diff', 'texto', 'Compara dos archivos línea a línea.', 'intermedio', 1, 340),
    ('linux', 'sed', 'sed', 'texto', 'Edita texto sobre la marcha con reglas de sustitución.', 'avanzado', 1, 350),
    ('linux', 'tee', 'tee', 'texto', 'Escribe en un archivo y deja pasar el texto.', 'intermedio', 1, 360),
    ('linux', 'xargs', 'xargs', 'texto', 'Convierte la entrada en argumentos de otro comando.', 'avanzado', 1, 370),
    ('linux', 'id', 'id', 'permisos', 'Muestra el identificador y los grupos del usuario.', 'basico', 1, 380),
    ('linux', 'groups', 'groups', 'permisos', 'Lista los grupos a los que perteneces.', 'basico', 1, 390),
    ('linux', 'chmod', 'chmod', 'permisos', 'Cambia los permisos de archivos y directorios.', 'intermedio', 1, 400),
    ('linux', 'chown', 'chown', 'permisos', 'Cambia el propietario y el grupo de un archivo.', 'avanzado', 1, 410),
    ('linux', 'umask', 'umask', 'permisos', 'Define qué permisos NO tendrán los archivos nuevos.', 'avanzado', 1, 420),
    ('linux', 'sudo', 'sudo', 'permisos', 'Ejecuta un comando con privilegios de administrador.', 'intermedio', 1, 430),
    ('linux', 'ps', 'ps', 'procesos', 'Lista los procesos en ejecución.', 'intermedio', 1, 440),
    ('linux', 'top', 'top', 'procesos', 'Muestra los procesos ordenados por consumo, en tiempo real.', 'intermedio', 1, 450),
    ('linux', 'kill', 'kill', 'procesos', 'Envía una señal a un proceso, normalmente para terminarlo.', 'intermedio', 1, 460),
    ('linux', 'pgrep', 'pgrep', 'procesos', 'Busca los PID de los procesos por su nombre.', 'intermedio', 1, 470),
    ('linux', 'pkill', 'pkill', 'procesos', 'Termina procesos por su nombre.', 'avanzado', 1, 480),
    ('linux', 'uname', 'uname', 'sistema', 'Muestra información del núcleo y la arquitectura.', 'basico', 1, 490),
    ('linux', 'uptime', 'uptime', 'sistema', 'Dice cuánto lleva encendida la máquina y su carga media.', 'basico', 1, 500),
    ('linux', 'df', 'df', 'sistema', 'Muestra el espacio libre en disco.', 'basico', 1, 510),
    ('linux', 'du', 'du', 'sistema', 'Mide cuánto ocupa un directorio.', 'intermedio', 1, 520),
    ('linux', 'free', 'free', 'sistema', 'Muestra el uso de memoria RAM.', 'basico', 1, 530),
    ('linux', 'systemctl', 'systemctl', 'sistema', 'Controla los servicios del sistema.', 'intermedio', 1, 540),
    ('linux', 'journalctl', 'journalctl', 'sistema', 'Consulta los registros del sistema.', 'avanzado', 1, 550),
    ('linux', 'ping', 'ping', 'redes', 'Comprueba si otro equipo responde.', 'basico', 1, 560),
    ('linux', 'ip', 'ip', 'redes', 'Consulta y configura las interfaces de red.', 'intermedio', 1, 570),
    ('linux', 'ss', 'ss', 'redes', 'Muestra los puertos abiertos y las conexiones.', 'intermedio', 1, 580),
    ('linux', 'curl', 'curl', 'redes', 'Descarga o consulta una URL desde la terminal.', 'intermedio', 1, 590),
    ('linux', 'wget', 'wget', 'redes', 'Descarga archivos desde una URL.', 'basico', 1, 600),
    ('linux', 'dig', 'dig', 'redes', 'Consulta el DNS: traduce nombres a direcciones.', 'avanzado', 1, 610),
    ('linux', 'tar', 'tar', 'compresion', 'Empaqueta varios archivos en uno solo.', 'intermedio', 1, 620),
    ('linux', 'gzip', 'gzip', 'compresion', 'Comprime un archivo.', 'basico', 1, 630),
    ('linux', 'gunzip', 'gunzip', 'compresion', 'Descomprime un archivo .gz.', 'basico', 1, 640),
    ('linux', 'variables-y-entorno', 'Variables y entorno ($VAR)', 'bash', 'Guardar valores y consultarlos con $.', 'intermedio', 1, 650),
    ('linux', 'tuberias', 'Tuberías (|)', 'bash', 'Conectar la salida de un comando con la entrada del siguiente.', 'intermedio', 1, 660),
    ('linux', 'redirecciones', 'Redirecciones (> >> <)', 'bash', 'Enviar la salida a un archivo o leer la entrada desde uno.', 'intermedio', 1, 670),
    ('linux', 'comodines', 'Comodines (* ? [])', 'bash', 'Seleccionar varios archivos con un patrón.', 'intermedio', 1, 680),
    ('linux', 'codigos-de-salida', 'Códigos de salida ($? && ||)', 'bash', 'Saber si un comando funcionó y encadenar según el resultado.', 'avanzado', 1, 690),
    ('linux', 'condicionales-y-bucles', 'Condicionales y bucles (if, for, while)', 'bash', 'Tomar decisiones y repetir acciones en Bash.', 'avanzado', 0, 700),
    ('linux', 'scripts', 'Scripts de shell (.sh)', 'bash', 'Guardar una serie de comandos en un archivo ejecutable.', 'avanzado', 0, 710),
    ('cmd', 'dir', 'dir', 'fundamentos', 'Lista el contenido de una carpeta.', 'basico', 1, 10),
    ('cmd', 'cd', 'cd', 'fundamentos', 'Cambia de carpeta o, sin argumentos, muestra en cuál estás.', 'basico', 1, 20),
    ('cmd', 'cls', 'cls', 'fundamentos', 'Limpia la pantalla de la consola.', 'basico', 1, 30),
    ('cmd', 'echo', 'echo', 'fundamentos', 'Muestra un texto o el valor de una variable.', 'basico', 1, 40),
    ('cmd', 'ver', 'ver', 'fundamentos', 'Muestra la versión de Windows.', 'basico', 1, 50),
    ('cmd', 'date', 'date', 'fundamentos', 'Muestra o cambia la fecha del sistema.', 'basico', 1, 60),
    ('cmd', 'time', 'time', 'fundamentos', 'Muestra o cambia la hora del sistema.', 'basico', 1, 70),
    ('cmd', 'prompt', 'prompt', 'fundamentos', 'Cambia el texto que aparece antes de cada comando.', 'intermedio', 1, 80),
    ('cmd', 'title', 'title', 'fundamentos', 'Cambia el título de la ventana de la consola.', 'basico', 1, 90),
    ('cmd', 'help', 'help', 'fundamentos', 'Lista los comandos disponibles o explica uno concreto.', 'basico', 1, 100),
    ('cmd', 'exit', 'exit', 'fundamentos', 'Cierra la consola o termina un script.', 'basico', 1, 110),
    ('cmd', 'mkdir', 'mkdir (md)', 'archivos', 'Crea carpetas.', 'basico', 1, 120),
    ('cmd', 'rmdir', 'rmdir (rd)', 'archivos', 'Borra carpetas.', 'intermedio', 1, 130),
    ('cmd', 'copy', 'copy', 'archivos', 'Copia archivos, conservando el original.', 'basico', 1, 140),
    ('cmd', 'xcopy', 'xcopy', 'archivos', 'Copia carpetas enteras con su contenido.', 'intermedio', 1, 150),
    ('cmd', 'robocopy', 'robocopy', 'archivos', 'Copia y sincroniza carpetas de forma robusta.', 'avanzado', 1, 160),
    ('cmd', 'move', 'move', 'archivos', 'Mueve o renombra archivos y carpetas.', 'basico', 1, 170),
    ('cmd', 'del', 'del (erase)', 'archivos', 'Borra archivos. No borra carpetas.', 'intermedio', 1, 180),
    ('cmd', 'ren', 'ren (rename)', 'archivos', 'Cambia el nombre de un archivo o carpeta.', 'basico', 1, 190),
    ('cmd', 'type', 'type', 'archivos', 'Muestra el contenido de un archivo de texto.', 'basico', 1, 200),
    ('cmd', 'tree', 'tree', 'archivos', 'Dibuja la estructura de carpetas en forma de árbol.', 'basico', 1, 210),
    ('cmd', 'attrib', 'attrib', 'archivos', 'Muestra o cambia los atributos de un archivo.', 'intermedio', 1, 220),
    ('cmd', 'where', 'where', 'archivos', 'Localiza archivos ejecutables o patrones en el PATH.', 'intermedio', 1, 230),
    ('cmd', 'find', 'find', 'busqueda', 'Busca una cadena literal dentro de archivos.', 'intermedio', 1, 240),
    ('cmd', 'findstr', 'findstr', 'busqueda', 'Busca texto con patrones dentro de archivos.', 'intermedio', 1, 250),
    ('cmd', 'fc', 'fc', 'busqueda', 'Compara dos archivos y muestra sus diferencias.', 'intermedio', 1, 260),
    ('cmd', 'sort', 'sort', 'busqueda', 'Ordena líneas de texto alfabéticamente.', 'basico', 1, 270),
    ('cmd', 'more', 'more', 'busqueda', 'Muestra texto por páginas.', 'basico', 1, 280),
    ('cmd', 'set', 'set', 'automatizacion', 'Muestra, crea o cambia variables de entorno.', 'intermedio', 1, 290),
    ('cmd', 'setlocal', 'setlocal', 'automatizacion', 'Aísla los cambios de variables dentro de un script.', 'avanzado', 1, 300),
    ('cmd', 'if', 'if', 'automatizacion', 'Ejecuta un comando solo si se cumple una condición.', 'intermedio', 1, 310),
    ('cmd', 'for', 'for', 'automatizacion', 'Repite un comando sobre un conjunto de elementos.', 'avanzado', 1, 320),
    ('cmd', 'call', 'call', 'automatizacion', 'Llama a otro script o a una etiqueta y vuelve.', 'avanzado', 1, 330),
    ('cmd', 'archivos-bat', 'Archivos .bat', 'automatizacion', 'Guardar una secuencia de comandos en un archivo ejecutable.', 'avanzado', 0, 340),
    ('cmd', 'operadores-y-redirecciones', 'Operadores y redirecciones', 'automatizacion', 'Encadenar comandos y decidir a dónde va su salida.', 'intermedio', 1, 350),
    ('cmd', 'systeminfo', 'systeminfo', 'sistema', 'Informe completo del equipo y del sistema operativo.', 'intermedio', 1, 360),
    ('cmd', 'hostname', 'hostname', 'sistema', 'Muestra el nombre del equipo.', 'basico', 1, 370),
    ('cmd', 'whoami', 'whoami', 'sistema', 'Muestra el usuario con el que estás trabajando.', 'basico', 1, 380),
    ('cmd', 'tasklist', 'tasklist', 'sistema', 'Lista los procesos en ejecución.', 'intermedio', 1, 390),
    ('cmd', 'taskkill', 'taskkill', 'sistema', 'Cierra procesos por PID o por nombre.', 'intermedio', 1, 400),
    ('cmd', 'sc', 'sc', 'sistema', 'Consulta y controla los servicios de Windows.', 'avanzado', 1, 410),
    ('cmd', 'net', 'net', 'sistema', 'Familia de comandos de red, usuarios y servicios.', 'intermedio', 1, 420),
    ('cmd', 'shutdown', 'shutdown', 'sistema', 'Apaga, reinicia o cierra la sesión del equipo.', 'intermedio', 1, 430),
    ('cmd', 'driverquery', 'driverquery', 'sistema', 'Lista los controladores instalados.', 'avanzado', 1, 440),
    ('cmd', 'ipconfig', 'ipconfig', 'redes', 'Muestra la configuración de red del equipo.', 'basico', 1, 450),
    ('cmd', 'ping', 'ping', 'redes', 'Comprueba si otro equipo responde en la red.', 'basico', 1, 460),
    ('cmd', 'tracert', 'tracert', 'redes', 'Muestra el camino que siguen los paquetes hasta un destino.', 'intermedio', 1, 470),
    ('cmd', 'nslookup', 'nslookup', 'redes', 'Consulta el sistema de nombres (DNS).', 'intermedio', 1, 480),
    ('cmd', 'netstat', 'netstat', 'redes', 'Muestra las conexiones de red y los puertos en escucha.', 'intermedio', 1, 490),
    ('cmd', 'arp', 'arp', 'redes', 'Muestra la tabla que relaciona direcciones IP con direcciones físicas.', 'avanzado', 1, 500),
    ('cmd', 'route', 'route', 'redes', 'Muestra o modifica la tabla de rutas del equipo.', 'avanzado', 1, 510),
    ('cmd', 'getmac', 'getmac', 'redes', 'Muestra las direcciones físicas (MAC) del equipo.', 'basico', 1, 520),
    ('powershell', 'get-childitem', 'Get-ChildItem', 'fundamentos', 'Lista el contenido de una carpeta devolviendo objetos de archivo y directorio.', 'basico', 1, 10),
    ('powershell', 'get-location', 'Get-Location', 'fundamentos', 'Dice en qué carpeta estás.', 'basico', 1, 20),
    ('powershell', 'set-location', 'Set-Location', 'fundamentos', 'Cambia la carpeta actual.', 'basico', 1, 30),
    ('powershell', 'get-help', 'Get-Help', 'fundamentos', 'Muestra la ayuda de un cmdlet: qué hace, qué parámetros acepta y ejemplos.', 'basico', 1, 40),
    ('powershell', 'get-command', 'Get-Command', 'fundamentos', 'Busca qué cmdlets existen y de qué módulo vienen.', 'basico', 1, 50),
    ('powershell', 'get-member', 'Get-Member', 'fundamentos', 'Enseña de qué tipo es un objeto y qué propiedades y métodos tiene.', 'intermedio', 1, 60),
    ('powershell', 'clear-host', 'Clear-Host', 'fundamentos', 'Limpia la pantalla de la consola.', 'basico', 1, 70),
    ('powershell', 'write-output', 'Write-Output', 'fundamentos', 'Envía un valor al pipeline, que acaba mostrándose en pantalla.', 'basico', 1, 80),
    ('powershell', 'el-pipeline-de-objetos', 'El pipeline de objetos', 'pipeline-objetos', 'En PowerShell por la tubería viajan objetos con propiedades, no líneas de texto.', 'intermedio', 0, 90),
    ('powershell', 'where-object', 'Where-Object', 'pipeline-objetos', 'Filtra los objetos del pipeline y deja pasar solo los que cumplen una condición.', 'intermedio', 1, 100),
    ('powershell', 'select-object', 'Select-Object', 'pipeline-objetos', 'Elige qué propiedades mostrar o cuántos objetos dejar pasar.', 'intermedio', 1, 110),
    ('powershell', 'sort-object', 'Sort-Object', 'pipeline-objetos', 'Ordena los objetos del pipeline por una o varias propiedades.', 'intermedio', 1, 120),
    ('powershell', 'foreach-object', 'ForEach-Object', 'pipeline-objetos', 'Ejecuta una acción sobre cada objeto que pasa por la tubería.', 'intermedio', 1, 130),
    ('powershell', 'measure-object', 'Measure-Object', 'pipeline-objetos', 'Cuenta objetos y calcula suma, media, mínimo y máximo de una propiedad.', 'intermedio', 1, 140),
    ('powershell', 'group-object', 'Group-Object', 'pipeline-objetos', 'Agrupa los objetos que comparten el valor de una propiedad.', 'avanzado', 1, 150),
    ('powershell', 'format-table', 'Format-Table', 'pipeline-objetos', 'Presenta los objetos como tabla, eligiendo las columnas.', 'intermedio', 1, 160),
    ('powershell', 'new-item', 'New-Item', 'archivos', 'Crea archivos, carpetas y otros elementos.', 'basico', 1, 170),
    ('powershell', 'copy-item', 'Copy-Item', 'archivos', 'Copia archivos y carpetas conservando el original.', 'basico', 1, 180),
    ('powershell', 'move-item', 'Move-Item', 'archivos', 'Mueve archivos y carpetas de un sitio a otro.', 'basico', 1, 190),
    ('powershell', 'remove-item', 'Remove-Item', 'archivos', 'Borra archivos y carpetas. No hay papelera.', 'intermedio', 1, 200),
    ('powershell', 'rename-item', 'Rename-Item', 'archivos', 'Cambia el nombre de un archivo o carpeta.', 'basico', 1, 210),
    ('powershell', 'get-content', 'Get-Content', 'archivos', 'Lee el contenido de un archivo y lo emite línea a línea.', 'basico', 1, 220),
    ('powershell', 'set-content', 'Set-Content', 'archivos', 'Escribe contenido en un archivo, reemplazando lo que hubiera.', 'basico', 1, 230),
    ('powershell', 'add-content', 'Add-Content', 'archivos', 'Añade contenido al final de un archivo sin borrar lo anterior.', 'basico', 1, 240),
    ('powershell', 'test-path', 'Test-Path', 'archivos', 'Comprueba si una ruta existe y devuelve True o False.', 'basico', 1, 250),
    ('powershell', 'select-string', 'Select-String', 'archivos', 'Busca texto dentro de archivos y devuelve las coincidencias como objetos.', 'intermedio', 1, 260),
    ('powershell', 'get-process', 'Get-Process', 'procesos-servicios', 'Lista los procesos en ejecución como objetos.', 'basico', 1, 270),
    ('powershell', 'stop-process', 'Stop-Process', 'procesos-servicios', 'Termina un proceso en ejecución.', 'intermedio', 1, 280),
    ('powershell', 'start-process', 'Start-Process', 'procesos-servicios', 'Inicia un programa o abre un archivo con su aplicación asociada.', 'intermedio', 1, 290),
    ('powershell', 'get-service', 'Get-Service', 'procesos-servicios', 'Lista los servicios de Windows y su estado.', 'basico', 1, 300),
    ('powershell', 'start-service', 'Start-Service', 'procesos-servicios', 'Arranca un servicio que está detenido.', 'intermedio', 1, 310),
    ('powershell', 'stop-service', 'Stop-Service', 'procesos-servicios', 'Detiene un servicio en ejecución.', 'intermedio', 1, 320),
    ('powershell', 'variables-y-tipos', 'Variables y tipos', 'automatizacion', 'Guardar datos en variables y entender que una variable guarda objetos, no solo texto.', 'basico', 0, 330),
    ('powershell', 'arrays-y-hashtables', 'Arrays y hashtables', 'automatizacion', 'Colecciones ordenadas (arrays) y pares clave-valor (hashtables).', 'intermedio', 0, 340),
    ('powershell', 'condicionales-y-bucles', 'Condicionales y bucles', 'automatizacion', 'Tomar decisiones con if y repetir con foreach o while.', 'intermedio', 0, 350),
    ('powershell', 'funciones', 'Funciones', 'automatizacion', 'Agrupar comandos bajo un nombre para reutilizarlos.', 'avanzado', 0, 360),
    ('powershell', 'scripts-ps1-y-politica-de-ejecucion', 'Scripts .ps1 y política de ejecución', 'automatizacion', 'Guardar comandos en un archivo .ps1 y entender por qué Windows se niega a ejecutarlo.', 'intermedio', 0, 370),
    ('powershell', 'manejo-de-errores', 'Manejo de errores', 'automatizacion', 'Distinguir errores que paran el script de los que no, y capturarlos con try/catch.', 'avanzado', 0, 380),
    ('powershell', 'get-computerinfo', 'Get-ComputerInfo', 'sistema', 'Resume la información del equipo: sistema, versión, hardware.', 'basico', 1, 390),
    ('powershell', 'get-date', 'Get-Date', 'sistema', 'Devuelve la fecha y la hora como objeto DateTime.', 'basico', 1, 400),
    ('powershell', 'get-winevent', 'Get-WinEvent', 'sistema', 'Consulta los registros de eventos de Windows.', 'avanzado', 1, 410),
    ('powershell', 'get-ciminstance', 'Get-CimInstance', 'sistema', 'Consulta información detallada del sistema a través de clases CIM/WMI.', 'avanzado', 1, 420),
    ('powershell', 'test-connection', 'Test-Connection', 'redes', 'Comprueba si un equipo responde, como un ping que devuelve objetos.', 'basico', 1, 430),
    ('powershell', 'test-netconnection', 'Test-NetConnection', 'redes', 'Comprueba si un puerto concreto está accesible en otro equipo.', 'intermedio', 1, 440),
    ('powershell', 'get-netipaddress', 'Get-NetIPAddress', 'redes', 'Muestra las direcciones IP configuradas en el equipo.', 'intermedio', 1, 450),
    ('powershell', 'resolve-dnsname', 'Resolve-DnsName', 'redes', 'Resuelve un nombre de dominio a su dirección IP.', 'intermedio', 1, 460),
    ('powershell', 'get-nettcpconnection', 'Get-NetTCPConnection', 'redes', 'Lista las conexiones TCP y los puertos en escucha.', 'avanzado', 1, 470)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), categoria = VALUES(categoria),
    resumen = VALUES(resumen), dificultad = VALUES(dificultad), simulado = VALUES(simulado), sort_order = VALUES(sort_order);

-- ----------------------- Datos: misiones -----------------------------
INSERT INTO academia_misiones (id, os, escenario, titulo, nivel, objetivo, xp, sort_order) VALUES
    ('linux-m01', 'linux', 'linux-hogar', 'Orientarte en una carpeta desconocida', 'basico', 'Averigua dónde estás y qué hay a tu alrededor, y entra en documentos.', 20, 10),
    ('linux-m02', 'linux', 'linux-hogar', 'Una copia de seguridad, sin perder el original', 'basico', 'Copia documentos/notas.txt dentro de backups/ sin que desaparezca el original.', 25, 20),
    ('linux-m03', 'linux', 'linux-hogar', 'Un inventario completo de la carpeta', 'basico', 'Guarda en backups/inventario.txt el listado detallado de tu carpeta personal, incluidos los archivos ocultos.', 25, 30),
    ('linux-m04', 'linux', 'linux-hogar', 'El resumen del informe', 'basico', 'Guarda en backups/resumen.txt solo las dos primeras líneas de documentos/informe.txt.', 25, 40),
    ('linux-m05', 'linux', 'linux-hogar', 'Rutas relativas sin moverte de sitio', 'basico', 'Estando dentro de documentos, crea la carpeta backups/2026 usando una ruta relativa, y quédate en documentos.', 25, 50),
    ('linux-m06', 'linux', 'linux-proyecto', 'La estructura de la entrega', 'basico', 'Crea dentro de entrega/ las carpetas css y js en un solo comando.', 25, 60),
    ('linux-m07', 'linux', 'linux-proyecto', 'Ordenar el proyecto', 'intermedio', 'Mueve index.html, estilo.css y app.js dentro de entrega/, y renombra borrador.txt como notas.txt.', 35, 70),
    ('linux-m08', 'linux', 'linux-proyecto', 'Limpiar temporales sin tocar lo del cliente', 'intermedio', 'Borra los archivos .tmp de tmp/ y deja intacto manual-cliente.pdf.', 40, 80),
    ('linux-m09', 'linux', 'linux-investigacion', 'El archivo que alguien escondió', 'intermedio', 'Encuentra config.ini y copia una copia en hallazgos/.', 40, 90),
    ('linux-m10', 'linux', 'linux-hogar', 'Cuenta los errores del registro', 'intermedio', 'Deja en /home/alumno/backups/errores.txt solo las líneas del registro que contienen ERROR.', 35, 100),
    ('linux-m11', 'linux', 'linux-hogar', '¿Cuántos errores hay?', 'intermedio', 'Guarda en backups/total.txt solo el número de líneas con ERROR de /var/log/sistema.log.', 35, 110),
    ('linux-m12', 'linux', 'linux-hogar', 'Solo la columna de productos', 'intermedio', 'Guarda en backups/productos.txt los nombres de los tres productos de documentos/lista.csv, sin la cabecera.', 40, 120),
    ('linux-m13', 'linux', 'linux-hogar', 'Sin repetidos y en orden', 'intermedio', 'Guarda en backups/unicos.txt las líneas de /var/log/sistema.log ordenadas y sin repetidos.', 40, 130),
    ('linux-m14', 'linux', 'linux-hogar', 'Contar archivos de texto de verdad', 'intermedio', 'Guarda en backups/conteo.txt cuántos archivos .txt hay en documentos/, contándolos con find.', 40, 140),
    ('linux-m15', 'linux', 'linux-servidor', 'La línea que explica la caída', 'intermedio', 'Guarda en /home/alumno/resumen-fallo.txt la primera línea del registro de nginx que menciona «Address already in use».', 45, 150),
    ('linux-m16', 'linux', 'linux-permisos', 'Permisos rotos', 'avanzado', 'Deja arranca.sh ejecutable (755) y clave.key legible solo por su dueño (600).', 50, 160),
    ('linux-m17', 'linux', 'linux-servidor', 'El proceso que ocupa el puerto 80', 'avanzado', 'Encuentra qué proceso está escuchando en el puerto 80 y párale.', 50, 170),
    ('linux-m18', 'linux', 'linux-servidor', 'Incidente completo: el sitio no responde', 'avanzado', 'Libera el puerto 80, arranca nginx y deja un informe en /home/alumno/informe-incidente.txt que mencione nginx.', 60, 180),
    ('cmd-m01', 'cmd', 'cmd-hogar', 'Primeros pasos en el Símbolo del sistema', 'basico', 'Entra en la carpeta Documents y lista lo que contiene.', 20, 10),
    ('cmd-m02', 'cmd', 'cmd-hogar', 'Un inventario con dir', 'basico', 'Guarda en Backups\\inventario.txt el listado de Documents, incluidos los archivos ocultos.', 25, 20),
    ('cmd-m03', 'cmd', 'cmd-hogar', 'Copiar sin perder el original', 'basico', 'Copia Documents\\notas.txt a Backups\\ dejando el original donde está.', 25, 30),
    ('cmd-m04', 'cmd', 'cmd-hogar', 'Rutas relativas en Windows', 'basico', 'Desde Documents, crea la carpeta Backups\\2026 usando una ruta relativa y quédate en Documents.', 25, 40),
    ('cmd-m05', 'cmd', 'cmd-proyecto', 'La estructura de la entrega', 'basico', 'Crea dentro de Entrega las carpetas css y js.', 25, 50),
    ('cmd-m06', 'cmd', 'cmd-proyecto', 'Copiar la web a la entrega', 'intermedio', 'Copia index.html y estilo.css dentro de Entrega\\ sin quitarlos de la raíz del proyecto.', 35, 60),
    ('cmd-m07', 'cmd', 'cmd-proyecto', 'Mover y renombrar', 'intermedio', 'Mueve notas.txt dentro de Entrega y renómbralo como pendientes.txt.', 35, 70),
    ('cmd-m08', 'cmd', 'cmd-proyecto', 'Borrar temporales sin tocar el manual', 'intermedio', 'Borra los .tmp de tmp\\ y deja intacto manual-cliente.pdf.', 40, 80),
    ('cmd-m09', 'cmd', 'cmd-servidor', 'Filtrar el registro del servicio', 'intermedio', 'Guarda en Informes\\errores.txt solo las líneas de C:\\Logs\\servicio.log que contienen ERROR.', 35, 90),
    ('cmd-m10', 'cmd', 'cmd-servidor', '¿Cuántos errores hay?', 'intermedio', 'Guarda en Informes\\total.txt el recuento de líneas con ERROR del registro.', 35, 100),
    ('cmd-m11', 'cmd', 'cmd-servidor', 'Rastrear al intruso en el registro de accesos', 'intermedio', 'Guarda en Informes\\intruso.txt las líneas de C:\\Logs\\acceso.log que mencionan minero, sin distinguir mayúsculas.', 35, 110),
    ('cmd-m12', 'cmd', 'cmd-hogar', 'Ordenar una lista', 'intermedio', 'Guarda en Backups\\ordenada.txt el contenido de Documents\\lista.csv ordenado alfabéticamente.', 30, 120),
    ('cmd-m13', 'cmd', 'cmd-hogar', 'Solo los .txt, encadenando comandos', 'intermedio', 'Guarda en Backups\\solotxt.txt los nombres de los archivos .txt de Documents, usando una tubería.', 40, 130),
    ('cmd-m14', 'cmd', 'cmd-servidor', 'Errores, filtrados y ordenados', 'intermedio', 'Guarda en Informes\\ordenados.txt las líneas de ERROR del registro, ordenadas alfabéticamente, encadenando tres comandos.', 45, 140),
    ('cmd-m15', 'cmd', 'cmd-servidor', 'Aislar el proceso sospechoso', 'intermedio', 'Guarda en Informes\\proceso.txt la línea de tasklist correspondiente a minero.exe.', 40, 150),
    ('cmd-m16', 'cmd', 'cmd-servidor', 'Detener el proceso que consume la CPU', 'avanzado', 'Detén el proceso minero.exe.', 50, 160),
    ('cmd-m17', 'cmd', 'cmd-servidor', 'Levantar el servicio caído', 'avanzado', 'Deja el servicio Spooler en marcha.', 50, 170),
    ('cmd-m18', 'cmd', 'cmd-servidor', 'Incidente completo en el servidor Windows', 'avanzado', 'Detén minero.exe, arranca el Spooler y deja un informe en Informes\\incidente.txt que mencione minero.', 60, 180),
    ('ps-m01', 'powershell', 'ps-hogar', 'Orientarse con cmdlets', 'basico', 'Entra en Documents y comprueba dónde estás con el cmdlet correspondiente.', 20, 10),
    ('ps-m02', 'powershell', 'ps-hogar', 'Un inventario con Get-ChildItem', 'basico', 'Guarda en Backups\\inventario.txt el listado de tu carpeta personal incluyendo los elementos ocultos.', 25, 20),
    ('ps-m03', 'powershell', 'ps-hogar', 'Copiar conservando el original', 'basico', 'Copia Documents\\notas.txt a Backups\\ sin quitarlo de su sitio.', 25, 30),
    ('ps-m04', 'powershell', 'ps-hogar', 'Rutas relativas con cmdlets', 'basico', 'Desde Documents, crea la carpeta Backups\\2026 con una ruta relativa y quédate en Documents.', 25, 40),
    ('ps-m05', 'powershell', 'ps-hogar', 'Estructura de carpetas', 'basico', 'Crea las carpetas Informes\\2026 e Informes\\graficos.', 25, 50),
    ('ps-m06', 'powershell', 'ps-hogar', 'Guardar un archivo nuevo', 'intermedio', 'Crea Informes\\resumen.txt con el texto «Revision de septiembre» usando Set-Content.', 30, 60),
    ('ps-m07', 'powershell', 'ps-hogar', 'Mover y renombrar', 'intermedio', 'Mueve Informes\\resumen.txt a Backups\\ y renómbralo como resumen-septiembre.txt.', 35, 70),
    ('ps-m08', 'powershell', 'ps-hogar', 'Borrar una carpeta con contenido', 'intermedio', 'Borra la carpeta Informes\\plantillas, que ya no hace falta.', 40, 80),
    ('ps-m09', 'powershell', 'ps-servidor', 'Filtrar texto con Select-String', 'intermedio', 'Guarda en Informes\\errores.txt las líneas de C:\\Logs\\servicio.log que contienen ERROR.', 35, 90),
    ('ps-m10', 'powershell', 'ps-servidor', 'Sumar con Measure-Object', 'intermedio', 'Guarda en Informes\\cpu.txt la suma de la CPU de todos los procesos.', 40, 100),
    ('ps-m11', 'powershell', 'ps-servidor', 'Filtrar por propiedad, no por texto', 'intermedio', 'Guarda en Informes\\altos.txt los procesos cuya CPU supera 40.', 45, 110),
    ('ps-m12', 'powershell', 'ps-servidor', 'Elegir solo las columnas que importan', 'intermedio', 'Guarda en Informes\\resumen-procesos.txt solo el nombre y la CPU de cada proceso.', 40, 120),
    ('ps-m13', 'powershell', 'ps-servidor', 'Filtrar, ordenar y elegir, todo seguido', 'avanzado', 'Guarda en Informes\\top.txt los procesos con CPU mayor que 40, ordenados de mayor a menor, con solo Name y CPU.', 50, 130),
    ('ps-m14', 'powershell', 'ps-servidor', 'Inspeccionar un objeto con Get-Member', 'intermedio', 'Guarda en Informes\\propiedades.txt la lista de miembros de los objetos que devuelve Get-Process.', 40, 140),
    ('ps-m15', 'powershell', 'ps-servidor', 'Servidores parados en el CSV', 'intermedio', 'Guarda en Informes\\parados.txt las líneas de Documents\\servidores.csv cuyo estado es «parado».', 40, 150),
    ('ps-m16', 'powershell', 'ps-servidor', 'Detener el proceso desbocado', 'avanzado', 'Detén el proceso minero.', 50, 160),
    ('ps-m17', 'powershell', 'ps-servidor', 'Arrancar el servicio caído', 'avanzado', 'Deja el servicio WSearch en marcha.', 50, 170),
    ('ps-m18', 'powershell', 'ps-servidor', 'Incidente completo con objetos', 'avanzado', 'Detén el proceso minero, arranca WSearch y deja un informe en Informes\\incidente.txt que mencione minero.', 60, 180)
ON DUPLICATE KEY UPDATE titulo = VALUES(titulo), nivel = VALUES(nivel),
    objetivo = VALUES(objetivo), xp = VALUES(xp), sort_order = VALUES(sort_order);

-- ------------------------ Datos: juegos ------------------------------
INSERT INTO academia_juegos (slug, nombre, numero, motor, resumen, niveles) VALUES
    ('laberinto-directorios', 'Laberinto de directorios', 1, 'phaser', 'Muévete por un mapa de carpetas escribiendo comandos de navegación hasta encontrar el archivo perdido.', 5),
    ('rescate-archivos', 'Rescate de archivos', 2, 'phaser', 'Hay archivos en la carpeta equivocada. Colócalos en su sitio distinguiendo cuándo hay que copiar y cuándo mover.', 5),
    ('detective-terminal', 'Detective de la terminal', 3, 'dom', 'Investiga un sistema con los comandos que ya conoces y responde quién, qué y cuándo a partir de lo que encuentres.', 4),
    ('guardian-permisos', 'Guardián de permisos', 4, 'dom', 'Arregla permisos rotos: llaves que lee todo el mundo, scripts que no se pueden ejecutar y directorios en los que no se puede entrar.', 5),
    ('constructor-comandos', 'Constructor de comandos', 5, 'dom', 'Ordena las piezas sueltas hasta formar un comando válido y míralo ejecutarse de verdad en el simulador.', 6),
    ('terminal-contrarreloj', 'Terminal contrarreloj', 6, 'phaser', 'Rondas de micro-retos encadenados. Con cronómetro para competir contigo mismo, o sin reloj para aprender sin prisa.', 4),
    ('repara-servidor', 'Repara el servidor', 7, 'dom', 'Algo se ha caído y solo tienes un síntoma. Investiga registros, procesos y puertos, di cuál es la causa y arréglalo.', 4),
    ('memoria-comandos', 'Memoria de comandos', 8, 'dom', 'Parejas de cartas: cada comando con lo que hace, con su sintaxis o con la salida que produce.', 5),
    ('escape-room', 'Escape room de la terminal', 9, 'phaser', 'Cuatro salas encadenadas. Cada puzle se resuelve con comandos reales y entrega el código que abre la puerta siguiente.', 4),
    ('linux-vs-windows', 'Linux vs Windows', 10, 'dom', 'La misma tarea en tres sistemas: elige el comando correcto para el shell que pide cada ronda y aprende dónde dejan de parecerse.', 5),
    ('encuentra-error', 'Encuentra el error', 11, 'dom', 'Comandos que parecen correctos y no lo son. Señala la pieza que falla, escribe la versión buena y compruébala en el simulador.', 5),
    ('mision-final', 'Misión final', 12, 'dom', 'El examen práctico: una cadena de tareas que recorre todo el temario, con terminal real y sin ayudas por defecto.', 3)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), numero = VALUES(numero),
    motor = VALUES(motor), resumen = VALUES(resumen), niveles = VALUES(niveles);
