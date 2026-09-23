-- =====================================================================
--  Tutoriales Lucio · CODLYX — migración v1.1.0 → v1.2.0
--  Alta del tutorial de Nmap: descubrimiento de red y ciberseguridad
--  defensiva, en diez niveles y 57 secciones.
--
--  Qué hace:
--    1. Se asegura de que exista la columna `group_label` en
--       tutorial_sections (la añadió la migración v1.1.0; se repite la
--       comprobación para que este parche funcione también sobre una base
--       que aún no la tuviera). Es aditiva y no afecta a nadie más.
--    2. Da de alta (o actualiza) la fila del tutorial `nmap` en la
--       categoría Redes, con estado `available` y view_key `nmap`.
--    3. Inserta su índice de 57 secciones.
--
--  NO toca las filas de Wireshark ni de SSH ni ninguna otra.
--  Es idempotente: puede reejecutarse sin duplicar nada.
--
--  Aplicar DESPUÉS de subir los ficheros del parche:
--     mysql -u USUARIO -p NOMBRE_BD < v1.2.0-nmap.sql
--  o desde cPanel > phpMyAdmin > Importar.
--
--  Si NO la aplicas, el sitio sigue funcionando: el catálogo y el índice
--  de Nmap se sirven desde config/catalog.php, que el parche ya trae
--  actualizado. La migración es lo que permite administrarlo desde MySQL.
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

-- --- 2. Alta del tutorial de Nmap ------------------------------------
INSERT INTO tutorials (category_id, slug, name, tagline, description, icon, view_key, status, sort_order)
SELECT c.id, 'nmap', 'Nmap',
       'Descubrimiento de red y ciberseguridad defensiva',
       'Curso completo en diez niveles: fundamentos y modelo mental, descubrimiento de hosts y CIDR, escaneo de puertos (TCP connect, SYN y UDP), detección de servicios y sistema operativo, el motor de scripts NSE con categorías seguras, resultados y reporting, ciberseguridad defensiva (superficie, hardening, validación de firewall y detección de escaneos), análisis avanzado y quince laboratorios prácticos sobre localhost y laboratorio propio.',
       'nmap', 'nmap', 'available', 15
FROM categories c WHERE c.slug = 'redes'
ON DUPLICATE KEY UPDATE
    tagline     = VALUES(tagline),
    description = VALUES(description),
    icon        = VALUES(icon),
    status      = VALUES(status),
    view_key    = VALUES(view_key),
    sort_order  = VALUES(sort_order);

-- --- 3. Índice de secciones de Nmap ----------------------------------
-- El DELETE está acotado por slug mediante JOIN: ningún otro tutorial se toca.
DELETE s FROM tutorial_sections s
  JOIN tutorials t ON t.id = s.tutorial_id
 WHERE t.slug = 'nmap';

INSERT INTO tutorial_sections (tutorial_id, anchor, label, badge, group_label, sort_order)
SELECT t.id, v.anchor, v.label, v.badge, v.group_label, v.sort_order
  FROM tutorials t
  JOIN (
    SELECT 'que-es' AS anchor, 'Qué es Nmap' AS label, '01' AS badge, 'Fundamentos' AS group_label, 10 AS sort_order UNION ALL
    SELECT 'alcance' AS anchor, 'Autorización y alcance' AS label, '02' AS badge, 'Fundamentos' AS group_label, 20 AS sort_order UNION ALL
    SELECT 'modelo' AS anchor, 'El modelo mental' AS label, '03' AS badge, 'Fundamentos' AS group_label, 30 AS sort_order UNION ALL
    SELECT 'instalar' AS anchor, 'Instalar y validar' AS label, '04' AS badge, 'Fundamentos' AS group_label, 40 AS sort_order UNION ALL
    SELECT 'privilegios' AS anchor, 'Privilegios: sudo' AS label, '05' AS badge, 'Fundamentos' AS group_label, 50 AS sort_order UNION ALL
    SELECT 'tcp-udp' AS anchor, 'TCP y UDP' AS label, '06' AS badge, 'Fundamentos' AS group_label, 60 AS sort_order UNION ALL
    SELECT 'primer' AS anchor, 'Primer escaneo' AS label, '07' AS badge, 'Fundamentos' AS group_label, 70 AS sort_order UNION ALL
    SELECT 'salida' AS anchor, 'Anatomía de la salida' AS label, '08' AS badge, 'Fundamentos' AS group_label, 80 AS sort_order UNION ALL
    SELECT 'estados' AS anchor, 'Estados de puerto' AS label, '09' AS badge, 'Fundamentos' AS group_label, 90 AS sort_order UNION ALL
    SELECT 'cidr' AS anchor, 'CIDR' AS label, '10' AS badge, 'Descubrimiento' AS group_label, 100 AS sort_order UNION ALL
    SELECT 'mi-red' AS anchor, 'Identificar tu red' AS label, '11' AS badge, 'Descubrimiento' AS group_label, 110 AS sort_order UNION ALL
    SELECT 'objetivos' AS anchor, 'Especificar objetivos' AS label, '12' AS badge, 'Descubrimiento' AS group_label, 120 AS sort_order UNION ALL
    SELECT 'list-scan' AS anchor, 'List scan (-sL)' AS label, '13' AS badge, 'Descubrimiento' AS group_label, 130 AS sort_order UNION ALL
    SELECT 'descubrimiento' AS anchor, 'Host discovery (-sn)' AS label, '14' AS badge, 'Descubrimiento' AS group_label, 140 AS sort_order UNION ALL
    SELECT 'pn' AS anchor, 'Omitir descubrimiento (-Pn)' AS label, '15' AS badge, 'Descubrimiento' AS group_label, 150 AS sort_order UNION ALL
    SELECT 'dns' AS anchor, 'DNS y nombres' AS label, '16' AS badge, 'Descubrimiento' AS group_label, 160 AS sort_order UNION ALL
    SELECT 'puertos' AS anchor, 'Seleccionar puertos (-p)' AS label, '17' AS badge, 'Puertos' AS group_label, 170 AS sort_order UNION ALL
    SELECT 'comunes' AS anchor, 'Puertos comunes' AS label, '18' AS badge, 'Puertos' AS group_label, 180 AS sort_order UNION ALL
    SELECT 'connect' AS anchor, 'TCP connect (-sT)' AS label, '19' AS badge, 'Puertos' AS group_label, 190 AS sort_order UNION ALL
    SELECT 'syn' AS anchor, 'SYN scan (-sS)' AS label, '20' AS badge, 'Puertos' AS group_label, 200 AS sort_order UNION ALL
    SELECT 'st-vs-ss' AS anchor, '-sT frente a -sS' AS label, '21' AS badge, 'Puertos' AS group_label, 210 AS sort_order UNION ALL
    SELECT 'udp' AS anchor, 'Escaneo UDP (-sU)' AS label, '22' AS badge, 'Puertos' AS group_label, 220 AS sort_order UNION ALL
    SELECT 'combinado' AS anchor, 'TCP y UDP juntos' AS label, '23' AS badge, 'Puertos' AS group_label, 230 AS sort_order UNION ALL
    SELECT 'razones' AS anchor, 'Verbosidad y razones' AS label, '24' AS badge, 'Puertos' AS group_label, 240 AS sort_order UNION ALL
    SELECT 'versiones' AS anchor, 'Servicios y versiones (-sV)' AS label, '25' AS badge, 'Servicios' AS group_label, 250 AS sort_order UNION ALL
    SELECT 'importa-version' AS anchor, '¿Por qué importa la versión?' AS label, '26' AS badge, 'Servicios' AS group_label, 260 AS sort_order UNION ALL
    SELECT 'os' AS anchor, 'Detección de SO (-O)' AS label, '27' AS badge, 'Sistema operativo' AS group_label, 270 AS sort_order UNION ALL
    SELECT 'traceroute' AS anchor, 'Camino al objetivo' AS label, '28' AS badge, 'Sistema operativo' AS group_label, 280 AS sort_order UNION ALL
    SELECT 'agresivo' AS anchor, 'La opción -A' AS label, '29' AS badge, 'Sistema operativo' AS group_label, 290 AS sort_order UNION ALL
    SELECT 'timing' AS anchor, 'Timing (-T0 a -T5)' AS label, '30' AS badge, 'Sistema operativo' AS group_label, 300 AS sort_order UNION ALL
    SELECT 'fuera-alcance' AS anchor, 'Fuera de alcance' AS label, '31' AS badge, 'Sistema operativo' AS group_label, 310 AS sort_order UNION ALL
    SELECT 'nse' AS anchor, 'Qué es NSE' AS label, '32' AS badge, 'NSE' AS group_label, 320 AS sort_order UNION ALL
    SELECT 'nse-categorias' AS anchor, 'Categorías NSE' AS label, '33' AS badge, 'NSE' AS group_label, 330 AS sort_order UNION ALL
    SELECT 'script-help' AS anchor, '--script-help' AS label, '34' AS badge, 'NSE' AS group_label, 340 AS sort_order UNION ALL
    SELECT 'nse-seguros' AS anchor, 'Scripts seguros' AS label, '35' AS badge, 'NSE' AS group_label, 350 AS sort_order UNION ALL
    SELECT 'nse-http' AS anchor, 'NSE sobre HTTP' AS label, '36' AS badge, 'NSE' AS group_label, 360 AS sort_order UNION ALL
    SELECT 'nse-tls' AS anchor, 'NSE sobre TLS' AS label, '37' AS badge, 'NSE' AS group_label, 370 AS sort_order UNION ALL
    SELECT 'nse-info' AS anchor, 'NSE: SSH y DNS' AS label, '38' AS badge, 'NSE' AS group_label, 380 AS sort_order UNION ALL
    SELECT 'guardar' AS anchor, 'Guardar resultados' AS label, '39' AS badge, 'Resultados' AS group_label, 390 AS sort_order UNION ALL
    SELECT 'formatos' AS anchor, '¿Qué formato usar?' AS label, '40' AS badge, 'Resultados' AS group_label, 400 AS sort_order UNION ALL
    SELECT 'comparar' AS anchor, 'Comparar escaneos' AS label, '41' AS badge, 'Resultados' AS group_label, 410 AS sort_order UNION ALL
    SELECT 'inventario' AS anchor, 'Inventario de red' AS label, '42' AS badge, 'Resultados' AS group_label, 420 AS sort_order UNION ALL
    SELECT 'superficie' AS anchor, 'Superficie de ataque' AS label, '43' AS badge, 'Ciberseguridad' AS group_label, 430 AS sort_order UNION ALL
    SELECT 'inesperados' AS anchor, 'Servicios inesperados' AS label, '44' AS badge, 'Ciberseguridad' AS group_label, 440 AS sort_order UNION ALL
    SELECT 'hardening' AS anchor, 'Inventario y hardening' AS label, '45' AS badge, 'Ciberseguridad' AS group_label, 450 AS sort_order UNION ALL
    SELECT 'firewall' AS anchor, 'Validar un firewall' AS label, '46' AS badge, 'Ciberseguridad' AS group_label, 460 AS sort_order UNION ALL
    SELECT 'deteccion' AS anchor, 'Detectar escaneos' AS label, '47' AS badge, 'Ciberseguridad' AS group_label, 470 AS sort_order UNION ALL
    SELECT 'wireshark' AS anchor, 'Nmap + Wireshark' AS label, '48' AS badge, 'Ciberseguridad' AS group_label, 480 AS sort_order UNION ALL
    SELECT 'limitaciones' AS anchor, 'Falsos positivos' AS label, '49' AS badge, 'Análisis avanzado' AS group_label, 490 AS sort_order UNION ALL
    SELECT 'errores' AS anchor, 'Errores comunes' AS label, '50' AS badge, 'Análisis avanzado' AS group_label, 500 AS sort_order UNION ALL
    SELECT 'metodologia' AS anchor, 'Árbol de decisión' AS label, '51' AS badge, 'Análisis avanzado' AS group_label, 510 AS sort_order UNION ALL
    SELECT 'auditoria' AS anchor, 'Flujo de auditoría' AS label, '52' AS badge, 'Análisis avanzado' AS group_label, 520 AS sort_order UNION ALL
    SELECT 'informe' AS anchor, 'Mini informe' AS label, '53' AS badge, 'Análisis avanzado' AS group_label, 530 AS sort_order UNION ALL
    SELECT 'hecho-hipotesis' AS anchor, 'Hechos vs hipótesis' AS label, '54' AS badge, 'Análisis avanzado' AS group_label, 540 AS sort_order UNION ALL
    SELECT 'labs' AS anchor, '15 laboratorios' AS label, '55' AS badge, 'Práctica' AS group_label, 550 AS sort_order UNION ALL
    SELECT 'desafios' AS anchor, 'Desafíos' AS label, '56' AS badge, 'Práctica' AS group_label, 560 AS sort_order UNION ALL
    SELECT 'chuleta' AS anchor, 'Chuleta de Nmap' AS label, '57' AS badge, 'Práctica' AS group_label, 570 AS sort_order
  ) AS v
 WHERE t.slug = 'nmap'
ON DUPLICATE KEY UPDATE
    label       = VALUES(label),
    badge       = VALUES(badge),
    group_label = VALUES(group_label),
    sort_order  = VALUES(sort_order);
