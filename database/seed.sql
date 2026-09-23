-- =====================================================================
--  Tutoriales Lucio · CODLYX — datos iniciales del catálogo
--  Importar DESPUÉS de schema.sql:
--     mysql -u USUARIO -p NOMBRE_BD < seed.sql
--  Es idempotente: puede reejecutarse sin duplicar filas.
-- =====================================================================

SET NAMES utf8mb4;

-- --------------------------- Categorías ------------------------------
INSERT INTO categories (slug, name, sort_order) VALUES
    ('redes',           'Redes',            10),
    ('sistemas',        'Sistemas',         20),
    ('desarrollo',      'Desarrollo',       30),
    ('bases-de-datos',  'Bases de datos',   40),
    ('infraestructura', 'Infraestructura',  50),
    ('seguridad',       'Seguridad',        60)
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);

-- --------------------------- Tutoriales ------------------------------
-- Wireshark: único tutorial con contenido real migrado.
INSERT INTO tutorials (category_id, slug, name, tagline, description, icon, view_key, status, sort_order)
SELECT c.id, 'wireshark', 'Wireshark',
       'Análisis de paquetes y protocolos',
       'Nueve laboratorios encadenados sobre una máquina real: ICMP, ARP, DNS, el handshake TCP, Follow Stream, TLS y su descifrado con SSLKEYLOGFILE, el menú Statistics y tshark en terminal.',
       'wireshark', 'wireshark', 'available', 10
FROM categories c WHERE c.slug = 'redes'
ON DUPLICATE KEY UPDATE
    tagline     = VALUES(tagline),
    description = VALUES(description),
    status      = VALUES(status),
    view_key    = VALUES(view_key),
    sort_order  = VALUES(sort_order);

-- SSH: marcador de posición. SIN contenido: view_key NULL y status coming_soon.
INSERT INTO tutorials (category_id, slug, name, tagline, description, icon, view_key, status, sort_order)
SELECT c.id, 'ssh', 'SSH', 'Acceso remoto seguro', '', 'ssh', NULL, 'coming_soon', 20
FROM categories c WHERE c.slug = 'sistemas'
ON DUPLICATE KEY UPDATE tagline = VALUES(tagline), status = VALUES(status), sort_order = VALUES(sort_order);

-- ------------------ Índice navegable de Wireshark --------------------
-- Cada `anchor` corresponde a un id="" existente en app/Views/tutorials/wireshark.php
-- y conserva los mismos identificadores del laboratorio original.
INSERT INTO tutorial_sections (tutorial_id, anchor, label, badge, sort_order)
SELECT t.id, s.anchor, s.label, s.badge, s.sort_order
FROM tutorials t
JOIN (
    SELECT 'instalar' AS anchor, 'Instalar'          AS label, ''   AS badge,  10 AS sort_order UNION ALL
    SELECT 'mental',             'Modelo mental',           '',           20 UNION ALL
    SELECT 'ventana',            'La ventana',              '',           30 UNION ALL
    SELECT 'filtros',            'Filtros',                 '',           40 UNION ALL
    SELECT 'e1',                 'Ping / ICMP',             '01',         50 UNION ALL
    SELECT 'e2',                 'ARP',                     '02',         60 UNION ALL
    SELECT 'e3',                 'DNS',                     '03',         70 UNION ALL
    SELECT 'e4',                 'Handshake TCP',           '04',         80 UNION ALL
    SELECT 'e5',                 'Follow Stream',           '05',         90 UNION ALL
    SELECT 'e6',                 'HTTPS / TLS',             '06',        100 UNION ALL
    SELECT 'e7',                 'Descifrar TLS',           '07',        110 UNION ALL
    SELECT 'e8',                 'Estadísticas',            '08',        120 UNION ALL
    SELECT 'e9',                 'tshark',                  '09',        130 UNION ALL
    SELECT 'chuleta',            'Chuleta de filtros',      '',          140
) AS s
WHERE t.slug = 'wireshark'
ON DUPLICATE KEY UPDATE
    label = VALUES(label), badge = VALUES(badge), sort_order = VALUES(sort_order);
