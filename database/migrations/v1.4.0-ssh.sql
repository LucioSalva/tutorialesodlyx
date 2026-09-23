-- =====================================================================
--  Tutoriales Lucio · CODLYX — migración v1.3.0 → v1.4.0
--  Alta del tutorial de SSH: acceso remoto seguro, administración y
--  despliegues, en diez partes y 88 secciones.
--
--  Qué hace:
--    1. Se asegura de que exista la columna `group_label` en
--       tutorial_sections (la añadió la migración v1.1.0; se repite la
--       comprobación para que este parche funcione también sobre una base
--       que aún no la tuviera). Es aditiva y no afecta a nadie más.
--    2. Pasa la fila del tutorial `ssh` —que el seed creó como
--       `coming_soon` sin contenido— a `available`, con view_key `ssh` y
--       su descripción real. Si la fila no existiera, la crea en Sistemas.
--    3. Inserta su índice de 88 secciones.
--
--  NO toca las filas de Wireshark ni de Nmap ni ninguna otra.
--  Es idempotente: puede reejecutarse sin duplicar nada.
--
--  Aplicar DESPUÉS de subir los ficheros del parche:
--     mysql -u USUARIO -p NOMBRE_BD < v1.4.0-ssh.sql
--  o desde cPanel > phpMyAdmin > Importar.
--
--  Si NO la aplicas, el sitio sigue funcionando: el catálogo y el índice
--  de SSH se sirven desde config/catalog.php, que el parche ya trae
--  actualizado. OJO: si MySQL está activo y no migras, la base sigue
--  diciendo `coming_soon` y SSH aparecerá como «Próximamente».
-- =====================================================================

SET NAMES utf8mb4;

-- --- 1. Columna de capítulo (aditiva, idempotente) -------------------
SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = 'tutorial_sections'
       AND COLUMN_NAME  = 'group_label'
);
SET @sql := IF(@existe = 0,
    'ALTER TABLE tutorial_sections ADD COLUMN group_label VARCHAR(48) NOT NULL DEFAULT '''' AFTER badge',
    'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- --- 2. Alta / publicación del tutorial de SSH -----------------------
INSERT INTO tutorials (category_id, slug, name, tagline, description, icon, view_key, status, sort_order)
SELECT c.id, 'ssh', 'SSH',
       'Acceso remoto seguro, administración y despliegues',
       'Curso completo en diez partes: fundamentos (cliente y servidor, qué ocurre al conectar, huellas, host keys y known_hosts), trabajo en el servidor, autenticación con llaves y ssh-agent, el cliente a fondo (~/.ssh/config, debug, multiplexing), transferencia de archivos con scp, sftp y rsync, configuración y seguridad del servidor, túneles, ProxyJump y Git, despliegues profesionales, diagnóstico de errores y veinte ejercicios sobre un laboratorio propio.',
       'ssh', 'ssh', 'available', 20
FROM categories c WHERE c.slug = 'sistemas'
ON DUPLICATE KEY UPDATE
    tagline     = VALUES(tagline),
    description = VALUES(description),
    icon        = VALUES(icon),
    status      = VALUES(status),
    view_key    = VALUES(view_key),
    sort_order  = VALUES(sort_order);

-- --- 3. Índice de secciones de SSH -----------------------------------
-- El DELETE está acotado por slug mediante JOIN: ningún otro tutorial se toca.
DELETE s FROM tutorial_sections s
  JOIN tutorials t ON t.id = s.tutorial_id
 WHERE t.slug = 'ssh';

INSERT INTO tutorial_sections (tutorial_id, anchor, label, badge, group_label, sort_order)
SELECT t.id, v.anchor, v.label, v.badge, v.group_label, v.sort_order
  FROM tutorials t
  JOIN (
    SELECT 'que-es' AS anchor, 'Qué es SSH' AS label, '01' AS badge, 'Fundamentos' AS group_label, 10 AS sort_order UNION ALL
    SELECT 'cliente-servidor' AS anchor, 'ssh frente a sshd' AS label, '02' AS badge, 'Fundamentos' AS group_label, 20 AS sort_order UNION ALL
    SELECT 'puerto' AS anchor, 'El puerto 22' AS label, '03' AS badge, 'Fundamentos' AS group_label, 30 AS sort_order UNION ALL
    SELECT 'anatomia' AS anchor, 'Anatomía del comando' AS label, '04' AS badge, 'Fundamentos' AS group_label, 40 AS sort_order UNION ALL
    SELECT 'flujo' AS anchor, 'Qué ocurre al pulsar Enter' AS label, '05' AS badge, 'Fundamentos' AS group_label, 50 AS sort_order UNION ALL
    SELECT 'primera' AS anchor, 'Primera conexión' AS label, '06' AS badge, 'Fundamentos' AS group_label, 60 AS sort_order UNION ALL
    SELECT 'fingerprint' AS anchor, 'La huella (fingerprint)' AS label, '07' AS badge, 'Fundamentos' AS group_label, 70 AS sort_order UNION ALL
    SELECT 'host-key' AS anchor, 'Host key y user key' AS label, '08' AS badge, 'Fundamentos' AS group_label, 80 AS sort_order UNION ALL
    SELECT 'known-hosts' AS anchor, 'known_hosts' AS label, '09' AS badge, 'Fundamentos' AS group_label, 90 AS sort_order UNION ALL
    SELECT 'host-cambiado' AS anchor, 'Host key cambiada' AS label, '10' AS badge, 'Fundamentos' AS group_label, 100 AS sort_order UNION ALL
    SELECT 'practica-fundamentos' AS anchor, 'Práctica: fundamentos' AS label, '11' AS badge, 'Fundamentos' AS group_label, 110 AS sort_order UNION ALL
    SELECT 'navegar' AS anchor, 'Navegar: pwd, ls, cd' AS label, '12' AS badge, 'En el servidor' AS group_label, 120 AS sort_order UNION ALL
    SELECT 'rutas' AS anchor, 'Rutas absolutas y relativas' AS label, '13' AS badge, 'En el servidor' AS group_label, 130 AS sort_order UNION ALL
    SELECT 'ficheros' AS anchor, 'mkdir, cp y mv' AS label, '14' AS badge, 'En el servidor' AS group_label, 140 AS sort_order UNION ALL
    SELECT 'rm' AS anchor, 'rm no tiene papelera' AS label, '15' AS badge, 'En el servidor' AS group_label, 150 AS sort_order UNION ALL
    SELECT 'usuarios' AS anchor, 'whoami, id y groups' AS label, '16' AS badge, 'En el servidor' AS group_label, 160 AS sort_order UNION ALL
    SELECT 'root-sudo' AS anchor, 'root y sudo' AS label, '17' AS badge, 'En el servidor' AS group_label, 170 AS sort_order UNION ALL
    SELECT 'permisos-linux' AS anchor, 'Permisos Linux' AS label, '18' AS badge, 'En el servidor' AS group_label, 180 AS sort_order UNION ALL
    SELECT 'procesos' AS anchor, 'Procesos: ps y top' AS label, '19' AS badge, 'En el servidor' AS group_label, 190 AS sort_order UNION ALL
    SELECT 'practica-linux' AS anchor, 'Práctica: en el servidor' AS label, '20' AS badge, 'En el servidor' AS group_label, 200 AS sort_order UNION ALL
    SELECT 'password-vs-llave' AS anchor, 'Contraseña frente a llave' AS label, '21' AS badge, 'Llaves' AS group_label, 210 AS sort_order UNION ALL
    SELECT 'llave-publica' AS anchor, 'Llave pública y privada' AS label, '22' AS badge, 'Llaves' AS group_label, 220 AS sort_order UNION ALL
    SELECT 'ssh-keygen' AS anchor, 'ssh-keygen' AS label, '23' AS badge, 'Llaves' AS group_label, 230 AS sort_order UNION ALL
    SELECT 'passphrase' AS anchor, 'La passphrase' AS label, '24' AS badge, 'Llaves' AS group_label, 240 AS sort_order UNION ALL
    SELECT 'ssh-copy-id' AS anchor, 'ssh-copy-id' AS label, '25' AS badge, 'Llaves' AS group_label, 250 AS sort_order UNION ALL
    SELECT 'authorized-keys' AS anchor, 'authorized_keys' AS label, '26' AS badge, 'Llaves' AS group_label, 260 AS sort_order UNION ALL
    SELECT 'permisos-ssh' AS anchor, 'Permisos que exige OpenSSH' AS label, '27' AS badge, 'Llaves' AS group_label, 270 AS sort_order UNION ALL
    SELECT 'ssh-agent' AS anchor, 'ssh-agent y ssh-add' AS label, '28' AS badge, 'Llaves' AS group_label, 280 AS sort_order UNION ALL
    SELECT 'practica-llaves' AS anchor, 'Práctica: llaves' AS label, '29' AS badge, 'Llaves' AS group_label, 290 AS sort_order UNION ALL
    SELECT 'comandos-remotos' AS anchor, 'Comandos remotos' AS label, '30' AS badge, 'El cliente a fondo' AS group_label, 300 AS sort_order UNION ALL
    SELECT 'quoting' AS anchor, 'Comillas: local o remoto' AS label, '31' AS badge, 'El cliente a fondo' AS group_label, 310 AS sort_order UNION ALL
    SELECT 'ssh-config' AS anchor, '~/.ssh/config' AS label, '32' AS badge, 'El cliente a fondo' AS group_label, 320 AS sort_order UNION ALL
    SELECT 'config-progresiva' AS anchor, 'Configuración progresiva' AS label, '33' AS badge, 'El cliente a fondo' AS group_label, 330 AS sort_order UNION ALL
    SELECT 'wildcards' AS anchor, 'Wildcards y precedencia' AS label, '34' AS badge, 'El cliente a fondo' AS group_label, 340 AS sort_order UNION ALL
    SELECT 'debug' AS anchor, 'Debug: -v, -vv, -vvv' AS label, '35' AS badge, 'El cliente a fondo' AS group_label, 350 AS sort_order UNION ALL
    SELECT 'debug-real' AS anchor, 'Leer un ssh -v real' AS label, '36' AS badge, 'El cliente a fondo' AS group_label, 360 AS sort_order UNION ALL
    SELECT 'keepalive' AS anchor, 'Keepalive' AS label, '37' AS badge, 'El cliente a fondo' AS group_label, 370 AS sort_order UNION ALL
    SELECT 'multiplexing' AS anchor, 'Multiplexing' AS label, '38' AS badge, 'El cliente a fondo' AS group_label, 380 AS sort_order UNION ALL
    SELECT 'practica-cliente' AS anchor, 'Práctica: el cliente' AS label, '39' AS badge, 'El cliente a fondo' AS group_label, 390 AS sort_order UNION ALL
    SELECT 'transferir' AS anchor, 'SSH, SCP, SFTP y rsync' AS label, '40' AS badge, 'Archivos' AS group_label, 400 AS sort_order UNION ALL
    SELECT 'scp' AS anchor, 'SCP' AS label, '41' AS badge, 'Archivos' AS group_label, 410 AS sort_order UNION ALL
    SELECT 'sftp' AS anchor, 'SFTP' AS label, '42' AS badge, 'Archivos' AS group_label, 420 AS sort_order UNION ALL
    SELECT 'rsync' AS anchor, 'rsync sobre SSH' AS label, '43' AS badge, 'Archivos' AS group_label, 430 AS sort_order UNION ALL
    SELECT 'rsync-barra' AS anchor, 'La barra final de rsync' AS label, '44' AS badge, 'Archivos' AS group_label, 440 AS sort_order UNION ALL
    SELECT 'dry-run' AS anchor, '--dry-run' AS label, '45' AS badge, 'Archivos' AS group_label, 450 AS sort_order UNION ALL
    SELECT 'delete' AS anchor, '--delete, con cuidado' AS label, '46' AS badge, 'Archivos' AS group_label, 460 AS sort_order UNION ALL
    SELECT 'hosting' AS anchor, 'SSH en hosting compartido' AS label, '47' AS badge, 'Archivos' AS group_label, 470 AS sort_order UNION ALL
    SELECT 'practica-archivos' AS anchor, 'Práctica: archivos' AS label, '48' AS badge, 'Archivos' AS group_label, 480 AS sort_order UNION ALL
    SELECT 'sshd' AS anchor, 'sshd y systemd' AS label, '49' AS badge, 'Servidor y seguridad' AS group_label, 490 AS sort_order UNION ALL
    SELECT 'sshd-config' AS anchor, 'sshd_config' AS label, '50' AS badge, 'Servidor y seguridad' AS group_label, 500 AS sort_order UNION ALL
    SELECT 'config-vs-config' AS anchor, 'ssh_config frente a sshd_config' AS label, '51' AS badge, 'Servidor y seguridad' AS group_label, 510 AS sort_order UNION ALL
    SELECT 'validar' AS anchor, 'Validar con sshd -t' AS label, '52' AS badge, 'Servidor y seguridad' AS group_label, 520 AS sort_order UNION ALL
    SELECT 'reinicio-seguro' AS anchor, 'Aplicar cambios sin quedarte fuera' AS label, '53' AS badge, 'Servidor y seguridad' AS group_label, 530 AS sort_order UNION ALL
    SELECT 'seguridad' AS anchor, 'Seguridad por capas' AS label, '54' AS badge, 'Servidor y seguridad' AS group_label, 540 AS sort_order UNION ALL
    SELECT 'password-auth' AS anchor, 'PasswordAuthentication' AS label, '55' AS badge, 'Servidor y seguridad' AS group_label, 550 AS sort_order UNION ALL
    SELECT 'root-login' AS anchor, 'PermitRootLogin' AS label, '56' AS badge, 'Servidor y seguridad' AS group_label, 560 AS sort_order UNION ALL
    SELECT 'logs' AS anchor, 'Logs de SSH' AS label, '57' AS badge, 'Servidor y seguridad' AS group_label, 570 AS sort_order UNION ALL
    SELECT 'intentos' AS anchor, 'Intentos fallidos' AS label, '58' AS badge, 'Servidor y seguridad' AS group_label, 580 AS sort_order UNION ALL
    SELECT 'fail2ban' AS anchor, 'Fail2Ban' AS label, '59' AS badge, 'Servidor y seguridad' AS group_label, 590 AS sort_order UNION ALL
    SELECT 'practica-sshd' AS anchor, 'Práctica: servidor' AS label, '60' AS badge, 'Servidor y seguridad' AS group_label, 600 AS sort_order UNION ALL
    SELECT 'tuneles' AS anchor, 'Qué es un túnel' AS label, '61' AS badge, 'Túneles y Git' AS group_label, 610 AS sort_order UNION ALL
    SELECT 'local-forward' AS anchor, 'Local forwarding (-L)' AS label, '62' AS badge, 'Túneles y Git' AS group_label, 620 AS sort_order UNION ALL
    SELECT 'remote-forward' AS anchor, 'Remote forwarding (-R)' AS label, '63' AS badge, 'Túneles y Git' AS group_label, 630 AS sort_order UNION ALL
    SELECT 'dynamic-forward' AS anchor, 'Dynamic forwarding (-D)' AS label, '64' AS badge, 'Túneles y Git' AS group_label, 640 AS sort_order UNION ALL
    SELECT 'comparar-tuneles' AS anchor, '-L frente a -R frente a -D' AS label, '65' AS badge, 'Túneles y Git' AS group_label, 650 AS sort_order UNION ALL
    SELECT 'proxyjump' AS anchor, 'ProxyJump y bastión' AS label, '66' AS badge, 'Túneles y Git' AS group_label, 660 AS sort_order UNION ALL
    SELECT 'git-ssh' AS anchor, 'Git sobre SSH' AS label, '67' AS badge, 'Túneles y Git' AS group_label, 670 AS sort_order UNION ALL
    SELECT 'practica-tuneles' AS anchor, 'Práctica: túneles y Git' AS label, '68' AS badge, 'Túneles y Git' AS group_label, 680 AS sort_order UNION ALL
    SELECT 'deploy-niveles' AS anchor, 'Seis niveles de despliegue' AS label, '69' AS badge, 'Despliegues' AS group_label, 690 AS sort_order UNION ALL
    SELECT 'deploy-rsync' AS anchor, 'Deploy con rsync' AS label, '70' AS badge, 'Despliegues' AS group_label, 700 AS sort_order UNION ALL
    SELECT 'no-subir' AS anchor, 'Lo que no se sube' AS label, '71' AS badge, 'Despliegues' AS group_label, 710 AS sort_order UNION ALL
    SELECT 'backup' AS anchor, 'Backup antes de desplegar' AS label, '72' AS badge, 'Despliegues' AS group_label, 720 AS sort_order UNION ALL
    SELECT 'atomico' AS anchor, 'Deploy atómico' AS label, '73' AS badge, 'Despliegues' AS group_label, 730 AS sort_order UNION ALL
    SELECT 'automatizar' AS anchor, 'Script de despliegue' AS label, '74' AS badge, 'Despliegues' AS group_label, 740 AS sort_order UNION ALL
    SELECT 'scripts-seguros' AS anchor, 'SSH en scripts' AS label, '75' AS badge, 'Despliegues' AS group_label, 750 AS sort_order UNION ALL
    SELECT 'practica-deploy' AS anchor, 'Práctica: despliegue' AS label, '76' AS badge, 'Despliegues' AS group_label, 760 AS sort_order UNION ALL
    SELECT 'arbol' AS anchor, 'Árbol de diagnóstico' AS label, '77' AS badge, 'Diagnóstico' AS group_label, 770 AS sort_order UNION ALL
    SELECT 'refused' AS anchor, 'Connection refused' AS label, '78' AS badge, 'Diagnóstico' AS group_label, 780 AS sort_order UNION ALL
    SELECT 'timeout' AS anchor, 'Timed out y No route' AS label, '79' AS badge, 'Diagnóstico' AS group_label, 790 AS sort_order UNION ALL
    SELECT 'resolve' AS anchor, 'Could not resolve hostname' AS label, '80' AS badge, 'Diagnóstico' AS group_label, 800 AS sort_order UNION ALL
    SELECT 'publickey' AS anchor, 'Permission denied (publickey)' AS label, '81' AS badge, 'Diagnóstico' AS group_label, 810 AS sort_order UNION ALL
    SELECT 'too-many' AS anchor, 'Too many authentication failures' AS label, '82' AS badge, 'Diagnóstico' AS group_label, 820 AS sort_order UNION ALL
    SELECT 'hostkey-failed' AS anchor, 'Host key verification failed' AS label, '83' AS badge, 'Diagnóstico' AS group_label, 830 AS sort_order UNION ALL
    SELECT 'dos-lados' AS anchor, 'Cliente y servidor a la vez' AS label, '84' AS badge, 'Diagnóstico' AS group_label, 840 AS sort_order UNION ALL
    SELECT 'practica-diagnostico' AS anchor, 'Práctica: diagnóstico' AS label, '85' AS badge, 'Diagnóstico' AS group_label, 850 AS sort_order UNION ALL
    SELECT 'decision' AS anchor, '¿Qué herramienta uso?' AS label, '86' AS badge, 'Referencia' AS group_label, 860 AS sort_order UNION ALL
    SELECT 'chuleta' AS anchor, 'Chuleta de SSH' AS label, '87' AS badge, 'Referencia' AS group_label, 870 AS sort_order UNION ALL
    SELECT 'glosario' AS anchor, 'Glosario' AS label, '88' AS badge, 'Referencia' AS group_label, 880 AS sort_order
  ) AS v
 WHERE t.slug = 'ssh'
ON DUPLICATE KEY UPDATE
    label       = VALUES(label),
    badge       = VALUES(badge),
    group_label = VALUES(group_label),
    sort_order  = VALUES(sort_order);
