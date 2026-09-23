-- =====================================================================
--  Tutoriales Lucio · CODLYX
--  Esquema mínimo del catálogo de tutoriales.
--
--  Alcance deliberado: MySQL guarda SOLO los METADATOS del catálogo.
--  El contenido educativo (HTML extenso, diagramas SVG, ejercicios) vive
--  en vistas PHP bajo app/Views/tutorials/ porque:
--    · se versiona en Git y se puede revisar en diff;
--    · no obliga a escapar/desescapar bloques enormes de HTML;
--    · evita que un fallo de BD deje al usuario sin material de estudio.
--  La columna `view_key` enlaza ambos mundos y SIEMPRE se valida contra
--  una whitelist en PHP antes de resolverse a un fichero (anti path traversal).
--
--  Importar:  mysql -u USUARIO -p NOMBRE_BD < schema.sql
--  cPanel:    phpMyAdmin > Importar > schema.sql
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------
-- categories · agrupa tutoriales por área técnica (Redes, Sistemas, ...)
-- Tabla de consulta: permite renombrar un área en un solo sitio y ordenar
-- la biblioteca por bloques sin repetir el literal en cada fila.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug        VARCHAR(64)       NOT NULL,
    name        VARCHAR(96)       NOT NULL,
    sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_slug (slug),
    KEY idx_categories_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- tutorials · una fila por tutorial de la biblioteca
--   slug      → segmento de URL (/tutoriales/wireshark). Validado por regex.
--   view_key  → clave lógica de la vista PHP. NUNCA se usa como ruta directa.
--   status    → available  : visible y navegable
--               coming_soon: se muestra en la biblioteca, sin enlace
--               draft      : oculto en producción
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tutorials (
    id           SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    category_id  SMALLINT UNSIGNED     NULL,
    slug         VARCHAR(64)       NOT NULL,
    name         VARCHAR(96)       NOT NULL,
    tagline      VARCHAR(160)      NOT NULL DEFAULT '',
    description  VARCHAR(320)      NOT NULL DEFAULT '',
    icon         VARCHAR(32)       NOT NULL DEFAULT 'default',
    view_key     VARCHAR(64)           NULL,
    status       ENUM('available','coming_soon','draft') NOT NULL DEFAULT 'draft',
    sort_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    created_at   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tutorials_slug (slug),
    KEY idx_tutorials_status_sort (status, sort_order),
    KEY idx_tutorials_category (category_id),
    CONSTRAINT fk_tutorials_category
        FOREIGN KEY (category_id) REFERENCES categories (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- tutorial_sections · índice navegable de cada tutorial
--   Alimenta el sumario lateral y el scrollspy. Se guarda en BD (y no
--   se deduce del HTML) para poder reordenar o renombrar el índice sin
--   tocar la vista, y para que el <nav> se renderice antes que el cuerpo.
--   `anchor` debe coincidir con un id="" real dentro de la vista.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tutorial_sections (
    id           MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tutorial_id  SMALLINT UNSIGNED  NOT NULL,
    anchor       VARCHAR(64)        NOT NULL,
    label        VARCHAR(96)        NOT NULL,
    badge        VARCHAR(8)         NOT NULL DEFAULT '',
    sort_order   SMALLINT UNSIGNED  NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_section_anchor (tutorial_id, anchor),
    KEY idx_section_sort (tutorial_id, sort_order),
    CONSTRAINT fk_sections_tutorial
        FOREIGN KEY (tutorial_id) REFERENCES tutorials (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
