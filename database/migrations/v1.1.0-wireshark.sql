-- =====================================================================
--  Tutoriales Lucio · CODLYX — migración v1.0.0 → v1.1.0
--  Ampliación del tutorial de Wireshark: 14 secciones → 43.
--
--  Qué hace:
--    1. Añade la columna `group_label` a tutorial_sections, para agrupar el
--       índice en capítulos. Es aditiva, con valor por defecto, y no afecta
--       a ningún otro tutorial.
--    2. Sustituye el índice de Wireshark por el nuevo.
--    3. Actualiza su descripción en el catálogo.
--
--  NO toca la fila de SSH ni ninguna otra.
--  Es idempotente: puede reejecutarse sin duplicar nada.
--
--  Aplicar DESPUÉS de subir los ficheros del parche:
--     mysql -u USUARIO -p NOMBRE_BD < v1.1.0-wireshark.sql
--  o desde cPanel > phpMyAdmin > Importar.
--
--  Si NO la aplicas, el sitio sigue funcionando: el índice se sirve desde
--  config/catalog.php, que el parche ya trae actualizado. La migración es
--  lo que permite administrarlo desde la base de datos.
-- =====================================================================

SET NAMES utf8mb4;

-- --- 1. Columna de capítulo (aditiva) --------------------------------
-- No todas las versiones de MySQL admiten ADD COLUMN IF NOT EXISTS, así que
-- se comprueba en information_schema y solo se ejecuta si falta.
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

-- --- 2. Índice nuevo de Wireshark ------------------------------------
-- El DELETE está acotado por slug mediante JOIN: ningún otro tutorial se toca.
DELETE s FROM tutorial_sections s
  JOIN tutorials t ON t.id = s.tutorial_id
 WHERE t.slug = 'wireshark';

INSERT INTO tutorial_sections (tutorial_id, anchor, label, badge, group_label, sort_order)
SELECT t.id, v.anchor, v.label, v.badge, v.group_label, v.sort_order
  FROM tutorials t
  JOIN (
    SELECT 'que-es'           AS anchor, 'Qué es Wireshark'       AS label, '01'   AS badge, 'Fundamentos'         AS group_label,   10 AS sort_order UNION ALL
    SELECT 'instalar'         AS anchor, 'Instalar y permisos'     AS label, '02'   AS badge, 'Fundamentos'         AS group_label,   20 AS sort_order UNION ALL
    SELECT 'interfaz'         AS anchor, 'La interfaz por dentro'  AS label, '03'   AS badge, 'Fundamentos'         AS group_label,   30 AS sort_order UNION ALL
    SELECT 'ventana'          AS anchor, 'Los tres paneles'        AS label, '04'   AS badge, 'Fundamentos'         AS group_label,   40 AS sort_order UNION ALL
    SELECT 'mental'           AS anchor, 'Encapsulación y capas'  AS label, '05'   AS badge, 'Fundamentos'         AS group_label,   50 AS sort_order UNION ALL
    SELECT 'filtros'          AS anchor, 'Captura vs. visualización' AS label, '06'   AS badge, 'Fundamentos'         AS group_label,   60 AS sort_order UNION ALL
    SELECT 'display-filters'  AS anchor, 'Lenguaje de filtros'     AS label, '07'   AS badge, 'Fundamentos'         AS group_label,   70 AS sort_order UNION ALL
    SELECT 'ethernet'         AS anchor, 'Ethernet'                AS label, '08'   AS badge, 'Protocolos'          AS group_label,   80 AS sort_order UNION ALL
    SELECT 'arp'              AS anchor, 'ARP'                     AS label, '09'   AS badge, 'Protocolos'          AS group_label,   90 AS sort_order UNION ALL
    SELECT 'ipv4'             AS anchor, 'IPv4'                    AS label, '10'   AS badge, 'Protocolos'          AS group_label,  100 AS sort_order UNION ALL
    SELECT 'ipv6'             AS anchor, 'IPv6'                    AS label, '11'   AS badge, 'Protocolos'          AS group_label,  110 AS sort_order UNION ALL
    SELECT 'icmp'             AS anchor, 'ICMP'                    AS label, '12'   AS badge, 'Protocolos'          AS group_label,  120 AS sort_order UNION ALL
    SELECT 'tcp'              AS anchor, 'TCP'                     AS label, '13'   AS badge, 'Protocolos'          AS group_label,  130 AS sort_order UNION ALL
    SELECT 'udp'              AS anchor, 'UDP'                     AS label, '14'   AS badge, 'Protocolos'          AS group_label,  140 AS sort_order UNION ALL
    SELECT 'dns'              AS anchor, 'DNS'                     AS label, '15'   AS badge, 'Protocolos'          AS group_label,  150 AS sort_order UNION ALL
    SELECT 'dhcp'             AS anchor, 'DHCP'                    AS label, '16'   AS badge, 'Protocolos'          AS group_label,  160 AS sort_order UNION ALL
    SELECT 'http'             AS anchor, 'HTTP'                    AS label, '17'   AS badge, 'Protocolos'          AS group_label,  170 AS sort_order UNION ALL
    SELECT 'tls'              AS anchor, 'HTTPS y TLS'             AS label, '18'   AS badge, 'Protocolos'          AS group_label,  180 AS sort_order UNION ALL
    SELECT 'follow'           AS anchor, 'Follow Stream'           AS label, '19'   AS badge, 'Wireshark a fondo'   AS group_label,  190 AS sort_order UNION ALL
    SELECT 'statistics'       AS anchor, 'Statistics'              AS label, '20'   AS badge, 'Wireshark a fondo'   AS group_label,  200 AS sort_order UNION ALL
    SELECT 'expert'           AS anchor, 'Expert Information'      AS label, '21'   AS badge, 'Wireshark a fondo'   AS group_label,  210 AS sort_order UNION ALL
    SELECT 'coloring'         AS anchor, 'Coloring rules'          AS label, '22'   AS badge, 'Wireshark a fondo'   AS group_label,  220 AS sort_order UNION ALL
    SELECT 'columnas'         AS anchor, 'Columnas propias'        AS label, '23'   AS badge, 'Wireshark a fondo'   AS group_label,  230 AS sort_order UNION ALL
    SELECT 'perfiles'         AS anchor, 'Perfiles'                AS label, '24'   AS badge, 'Wireshark a fondo'   AS group_label,  240 AS sort_order UNION ALL
    SELECT 'tls-descifrado'   AS anchor, 'Descifrar TLS propio'    AS label, '25'   AS badge, 'Wireshark a fondo'   AS group_label,  250 AS sort_order UNION ALL
    SELECT 'tshark'           AS anchor, 'tshark'                  AS label, '26'   AS badge, 'Wireshark a fondo'   AS group_label,  260 AS sort_order UNION ALL
    SELECT 'pcap'             AS anchor, 'PCAP y su custodia'      AS label, '27'   AS badge, 'Wireshark a fondo'   AS group_label,  270 AS sort_order UNION ALL
    SELECT 'ciber'            AS anchor, 'Análisis defensivo'     AS label, '28'   AS badge, 'Ciberseguridad'      AS group_label,  280 AS sort_order UNION ALL
    SELECT 'baseline'         AS anchor, 'Línea base'             AS label, '29'   AS badge, 'Ciberseguridad'      AS group_label,  290 AS sort_order UNION ALL
    SELECT 'scan'             AS anchor, 'Escaneo de puertos'      AS label, '30'   AS badge, 'Ciberseguridad'      AS group_label,  300 AS sort_order UNION ALL
    SELECT 'beaconing'        AS anchor, 'Beaconing'               AS label, '31'   AS badge, 'Ciberseguridad'      AS group_label,  310 AS sort_order UNION ALL
    SELECT 'dns-raro'         AS anchor, 'DNS sospechoso'          AS label, '32'   AS badge, 'Ciberseguridad'      AS group_label,  320 AS sort_order UNION ALL
    SELECT 'arp-raro'         AS anchor, 'ARP anómalo'            AS label, '33'   AS badge, 'Ciberseguridad'      AS group_label,  330 AS sort_order UNION ALL
    SELECT 'exfil'            AS anchor, 'Exfiltración'           AS label, '34'   AS badge, 'Ciberseguridad'      AS group_label,  340 AS sort_order UNION ALL
    SELECT 'http-raro'        AS anchor, 'HTTP sospechoso'         AS label, '35'   AS badge, 'Ciberseguridad'      AS group_label,  350 AS sort_order UNION ALL
    SELECT 'claro'            AS anchor, 'Credenciales en claro'   AS label, '36'   AS badge, 'Ciberseguridad'      AS group_label,  360 AS sort_order UNION ALL
    SELECT 'resets'           AS anchor, 'Resets y pérdidas'      AS label, '37'   AS badge, 'Ciberseguridad'      AS group_label,  370 AS sort_order UNION ALL
    SELECT 'flujo'            AS anchor, 'Flujo de análisis'      AS label, '38'   AS badge, 'Ciberseguridad'      AS group_label,  380 AS sort_order UNION ALL
    SELECT 'informe'          AS anchor, 'Informe de incidente'    AS label, '39'   AS badge, 'Ciberseguridad'      AS group_label,  390 AS sort_order UNION ALL
    SELECT 'labs'             AS anchor, '12 laboratorios'         AS label, '40'   AS badge, 'Práctica'           AS group_label,  400 AS sort_order UNION ALL
    SELECT 'desafios'         AS anchor, 'Desafíos'               AS label, '41'   AS badge, 'Práctica'           AS group_label,  410 AS sort_order UNION ALL
    SELECT 'errores'          AS anchor, 'Errores comunes'         AS label, '42'   AS badge, 'Práctica'           AS group_label,  420 AS sort_order UNION ALL
    SELECT 'chuleta'          AS anchor, 'Chuleta de filtros'      AS label, '43'   AS badge, 'Práctica'           AS group_label,  430 AS sort_order
  ) AS v
 WHERE t.slug = 'wireshark'
ON DUPLICATE KEY UPDATE
    label       = VALUES(label),
    badge       = VALUES(badge),
    group_label = VALUES(group_label),
    sort_order  = VALUES(sort_order);

-- --- 3. Descripción actualizada del tutorial -------------------------
UPDATE tutorials
   SET tagline     = 'Análisis de paquetes y ciberseguridad defensiva',
       description = 'Curso completo en cinco partes: fundamentos de captura, los protocolos capa por capa (Ethernet, ARP, IPv4, IPv6, ICMP, TCP, UDP, DNS, DHCP, HTTP y TLS), las herramientas de Wireshark a fondo, análisis defensivo de tráfico y doce laboratorios prácticos con desafíos.'
 WHERE slug = 'wireshark';
