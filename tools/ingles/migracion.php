<?php
/**
 * Academia de Inglés · generador de la migración MySQL
 * ---------------------------------------------------------------------
 * Herramienta de desarrollo. Genera database/migrations/v1.6.0-ingles.sql
 * A PARTIR DE LOS JSON, para que la base de datos y el contenido nunca se
 * contradigan. No se edita el .sql a mano: se regenera.
 *
 *   php tools/ingles/migracion.php
 */
declare(strict_types=1);

// Herramienta de línea de comandos: nunca debe ejecutarse desde la web.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$raiz  = dirname(__DIR__, 2);
$datos = "$raiz/public/assets/ingles/data";
$leer  = static fn (string $f): array => is_file("$datos/$f") ? json_decode((string) file_get_contents("$datos/$f"), true, 512, JSON_THROW_ON_ERROR) : [];

$curso = $leer('curso.json');
$vocab = $leer('vocabulario.json');

/** Literal SQL seguro (comillas simples escapadas, sin interpretar nada). */
$q = static function (mixed $v): string {
    if ($v === null) { return 'NULL'; }
    if (is_int($v)) { return (string) $v; }
    return "'" . str_replace(["\\", "'", "\0", "\n", "\r"], ["\\\\", "''", '', ' ', ' '], (string) $v) . "'";
};
$corta = static fn (string $s, int $n): string => mb_substr($s, 0, $n);

$sql = [];
$sql[] = <<<'SQL'
-- =====================================================================
--  Tutoriales Lucio · CODLYX — migración v1.5.0 → v1.6.0
--  Academia de Inglés: catálogo académico (bloques, unidades, lecciones,
--  prerrequisitos), vocabulario, ejercicios, evaluaciones y recursos.
--
--  GENERADO por tools/ingles/migracion.php a partir de los JSON de
--  public/assets/ingles/data/. No editar a mano: regenerar.
--
--  QUÉ VIVE AQUÍ Y QUÉ NO
--    · MySQL guarda METADATOS: qué existe, en qué orden, con qué nivel y
--      de qué tipo, para listar, buscar y administrar el curso con SQL.
--    · El CONTENIDO (explicaciones, ejemplos, enunciados, soluciones) vive
--      en los JSON, que es lo que sirve PHP y descarga el navegador. No se
--      duplica: dos copias del mismo texto acaban contradiciéndose.
--    · No se guardan audios, imágenes ni código de juegos en columnas.
--    · El progreso del estudiante NO está aquí (vive en su navegador).
--
--  La academia funciona SIN base de datos: si no aplicas esta migración,
--  todo se sirve desde los JSON.
--
--  Solo CREA tablas nuevas con prefijo ingles_. No toca categories,
--  tutorials, tutorial_sections ni academia_*. Es idempotente: se puede
--  reejecutar (usa CREATE TABLE IF NOT EXISTS e INSERT … ON DUPLICATE KEY
--  UPDATE) sin duplicar filas ni borrar nada.
--
--  Aplicar DESPUÉS de subir los archivos del parche:
--     mysql -u USUARIO -p NOMBRE_BD < database/migrations/v1.6.0-ingles.sql
--  o desde cPanel > phpMyAdmin > Importar.
-- =====================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS ingles_bloques (
    id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug        VARCHAR(64)  NOT NULL,
    numero      SMALLINT UNSIGNED NOT NULL,
    titulo      VARCHAR(160) NOT NULL,
    nivel       VARCHAR(8)   NOT NULL DEFAULT '',
    resumen     VARCHAR(400) NOT NULL DEFAULT '',
    examen      VARCHAR(64)  NOT NULL DEFAULT '',
    PRIMARY KEY (id),
    UNIQUE KEY uq_ingles_bloques_slug (slug),
    KEY idx_ingles_bloques_numero (numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- `publicada` = existe su archivo de contenido y superó el validador al
-- generar esta migración. Las cifras salen del contenido real.
CREATE TABLE IF NOT EXISTS ingles_unidades (
    id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    bloque_id   SMALLINT UNSIGNED NOT NULL,
    slug        VARCHAR(64)  NOT NULL,
    numero      SMALLINT UNSIGNED NOT NULL,
    titulo      VARCHAR(160) NOT NULL,
    nivel       VARCHAR(8)   NOT NULL DEFAULT '',
    resumen     VARCHAR(400) NOT NULL DEFAULT '',
    publicada   TINYINT(1)   NOT NULL DEFAULT 0,
    lecciones   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    ejercicios  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    minutos     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ingles_unidades_slug (slug),
    KEY idx_ingles_unidades_bloque (bloque_id, numero),
    CONSTRAINT fk_ingles_unidades_bloque FOREIGN KEY (bloque_id)
        REFERENCES ingles_bloques (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ingles_prerrequisitos (
    unidad_id   SMALLINT UNSIGNED NOT NULL,
    requiere_id SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (unidad_id, requiere_id),
    KEY idx_ingles_prerreq_requiere (requiere_id),
    CONSTRAINT fk_ingles_prerreq_unidad FOREIGN KEY (unidad_id)
        REFERENCES ingles_unidades (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ingles_prerreq_requiere FOREIGN KEY (requiere_id)
        REFERENCES ingles_unidades (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ingles_lecciones (
    id          MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    unidad_id   SMALLINT UNSIGNED NOT NULL,
    slug        VARCHAR(64)  NOT NULL,
    orden       SMALLINT UNSIGNED NOT NULL,
    titulo      VARCHAR(160) NOT NULL,
    resumen     VARCHAR(400) NOT NULL DEFAULT '',
    minutos     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    ejercicios  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ingles_lecciones_slug (slug),
    KEY idx_ingles_lecciones_unidad (unidad_id, orden),
    CONSTRAINT fk_ingles_lecciones_unidad FOREIGN KEY (unidad_id)
        REFERENCES ingles_unidades (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ingles_temas (
    id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug        VARCHAR(64)  NOT NULL,
    nombre      VARCHAR(96)  NOT NULL,
    icono       VARCHAR(16)  NOT NULL DEFAULT '',
    descripcion VARCHAR(400) NOT NULL DEFAULT '',
    orden       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ingles_temas_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ingles_palabras (
    id          MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tema_id     SMALLINT UNSIGNED NOT NULL,
    clave       VARCHAR(96)  NOT NULL,
    en          VARCHAR(96)  NOT NULL,
    es          VARCHAR(160) NOT NULL,
    tipo        VARCHAR(16)  NOT NULL,
    ipa         VARCHAR(96)  NOT NULL DEFAULT '',
    ejemplo_en  VARCHAR(255) NOT NULL DEFAULT '',
    ejemplo_es  VARCHAR(255) NOT NULL DEFAULT '',
    PRIMARY KEY (id),
    UNIQUE KEY uq_ingles_palabras_clave (clave),
    KEY idx_ingles_palabras_en (en),
    KEY idx_ingles_palabras_tema (tema_id),
    CONSTRAINT fk_ingles_palabras_tema FOREIGN KEY (tema_id)
        REFERENCES ingles_temas (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relación unidad ↔ tema de vocabulario (qué vocabulario acompaña a cada unidad).
CREATE TABLE IF NOT EXISTS ingles_unidad_temas (
    unidad_id   SMALLINT UNSIGNED NOT NULL,
    tema_id     SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (unidad_id, tema_id),
    KEY idx_ingles_unidad_temas_tema (tema_id),
    CONSTRAINT fk_ingles_ut_unidad FOREIGN KEY (unidad_id)
        REFERENCES ingles_unidades (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ingles_ut_tema FOREIGN KEY (tema_id)
        REFERENCES ingles_temas (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Metadatos de cada ejercicio (el enunciado y la solución viven en el JSON).
CREATE TABLE IF NOT EXISTS ingles_ejercicios (
    id          MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    clave       VARCHAR(128) NOT NULL,
    ambito      ENUM('leccion','evaluacion','examen','lectura','escucha','pronunciacion') NOT NULL,
    unidad_id   SMALLINT UNSIGNED NULL,
    leccion_id  MEDIUMINT UNSIGNED NULL,
    recurso     VARCHAR(64)  NOT NULL DEFAULT '',
    tipo        VARCHAR(16)  NOT NULL,
    dificultad  TINYINT UNSIGNED NOT NULL DEFAULT 1,
    habilidad   VARCHAR(16)  NOT NULL DEFAULT '',
    PRIMARY KEY (id),
    UNIQUE KEY uq_ingles_ejercicios_clave (clave),
    KEY idx_ingles_ejercicios_ambito (ambito, tipo),
    KEY idx_ingles_ejercicios_unidad (unidad_id),
    KEY idx_ingles_ejercicios_leccion (leccion_id),
    CONSTRAINT fk_ingles_ej_unidad FOREIGN KEY (unidad_id)
        REFERENCES ingles_unidades (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ingles_ej_leccion FOREIGN KEY (leccion_id)
        REFERENCES ingles_lecciones (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ingles_evaluaciones (
    id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    clave       VARCHAR(96)  NOT NULL,
    tipo        ENUM('unidad','bloque') NOT NULL,
    unidad_id   SMALLINT UNSIGNED NULL,
    bloque_id   SMALLINT UNSIGNED NULL,
    titulo      VARCHAR(200) NOT NULL,
    preguntas   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    aprobado    TINYINT UNSIGNED NOT NULL DEFAULT 70,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ingles_evaluaciones_clave (clave),
    KEY idx_ingles_evaluaciones_unidad (unidad_id),
    KEY idx_ingles_evaluaciones_bloque (bloque_id),
    CONSTRAINT fk_ingles_eval_unidad FOREIGN KEY (unidad_id)
        REFERENCES ingles_unidades (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ingles_eval_bloque FOREIGN KEY (bloque_id)
        REFERENCES ingles_bloques (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lecturas, audios, conversaciones, tareas de escritura, juegos y secciones
-- de pronunciación: cada recurso con su unidad relacionada.
CREATE TABLE IF NOT EXISTS ingles_recursos (
    id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tipo        ENUM('lectura','escucha','conversacion','escritura','juego','pronunciacion') NOT NULL,
    slug        VARCHAR(64)  NOT NULL,
    titulo      VARCHAR(200) NOT NULL,
    nivel       VARCHAR(8)   NOT NULL DEFAULT '',
    unidad_id   SMALLINT UNSIGNED NULL,
    elementos   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ingles_recursos (tipo, slug),
    KEY idx_ingles_recursos_unidad (unidad_id),
    CONSTRAINT fk_ingles_recursos_unidad FOREIGN KEY (unidad_id)
        REFERENCES ingles_unidades (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;

$upsert = static function (string $tabla, array $cols, array $filas, array $actualizar) use (&$sql): void {
    foreach (array_chunk($filas, 200) as $lote) {
        $sql[] = "INSERT INTO $tabla (" . implode(', ', $cols) . ") VALUES\n"
            . implode(",\n", array_map(static fn ($f) => '    (' . implode(', ', $f) . ')', $lote))
            . "\nON DUPLICATE KEY UPDATE " . implode(', ', array_map(static fn ($c) => "$c = VALUES($c)", $actualizar)) . ';';
    }
};
$idUnidad  = static fn (string $s): string => '(SELECT id FROM ingles_unidades WHERE slug = ' . $q($s) . ')';
$idLeccion = static fn (string $s): string => '(SELECT id FROM ingles_lecciones WHERE slug = ' . $q($s) . ')';

// ---------------------------------------------------------------- bloques
$sql[] = "\n-- Bloques";
$upsert('ingles_bloques', ['slug', 'numero', 'titulo', 'nivel', 'resumen', 'examen'],
    array_map(static fn ($b) => [$q($b['slug']), (int) $b['numero'], $q($b['titulo']), $q($b['nivel']), $q($corta($b['resumen'], 400)), $q($b['examen'] ?? '')], $curso['bloques']),
    ['numero', 'titulo', 'nivel', 'resumen', 'examen']);

// --------------------------------------------------------------- unidades
$contenidos = [];
$filasU = [];
foreach ($curso['unidades'] as $u) {
    $ruta = "$datos/unidades/{$u['slug']}.json";
    $c = is_file($ruta) ? json_decode((string) file_get_contents($ruta), true) : null;
    $contenidos[$u['slug']] = $c;
    $ej = $c ? array_sum(array_map(static fn ($l) => count($l['ejercicios']), $c['lecciones'])) : 0;
    $min = $c ? array_sum(array_map(static fn ($l) => (int) ($l['minutos'] ?? 0), $c['lecciones'])) : 0;
    $filasU[] = ["(SELECT id FROM ingles_bloques WHERE slug = " . $q($u['bloque']) . ")", $q($u['slug']), (int) $u['numero'], $q($u['titulo']), $q($u['nivel']),
                 $q($corta($u['resumen'], 400)), $c ? 1 : 0, count($u['lecciones']), $ej, $min];
}
$sql[] = "\n-- Unidades";
$upsert('ingles_unidades', ['bloque_id', 'slug', 'numero', 'titulo', 'nivel', 'resumen', 'publicada', 'lecciones', 'ejercicios', 'minutos'],
    $filasU, ['bloque_id', 'numero', 'titulo', 'nivel', 'resumen', 'publicada', 'lecciones', 'ejercicios', 'minutos']);

$sql[] = "\n-- Prerrequisitos";
$filasP = [];
foreach ($curso['unidades'] as $u) {
    foreach ($u['prerrequisitos'] as $p) {
        $filasP[] = [$idUnidad($u['slug']), $idUnidad($p)];
    }
}
if ($filasP) { $upsert('ingles_prerrequisitos', ['unidad_id', 'requiere_id'], $filasP, ['requiere_id']); }

// -------------------------------------------------------------- lecciones
$sql[] = "\n-- Lecciones";
$filasL = [];
foreach ($curso['unidades'] as $u) {
    $c = $contenidos[$u['slug']];
    foreach ($u['lecciones'] as $i => $l) {
        $lc = $c['lecciones'][$i] ?? null;
        $filasL[] = [$idUnidad($u['slug']), $q($l['slug']), $i + 1, $q($l['titulo']), $q($corta($l['resumen'], 400)),
                     (int) ($lc['minutos'] ?? 0), count($lc['ejercicios'] ?? [])];
    }
}
$upsert('ingles_lecciones', ['unidad_id', 'slug', 'orden', 'titulo', 'resumen', 'minutos', 'ejercicios'], $filasL,
    ['unidad_id', 'orden', 'titulo', 'resumen', 'minutos', 'ejercicios']);

// ------------------------------------------------------------ vocabulario
$sql[] = "\n-- Temas y palabras";
$upsert('ingles_temas', ['slug', 'nombre', 'icono', 'descripcion', 'orden'],
    array_map(static fn ($t, $i) => [$q($t['slug']), $q($t['nombre']), $q($t['icono'] ?? ''), $q($corta($t['descripcion'] ?? '', 400)), $i + 1], $vocab['temas'] ?? [], array_keys($vocab['temas'] ?? [])),
    ['nombre', 'icono', 'descripcion', 'orden']);
$upsert('ingles_palabras', ['tema_id', 'clave', 'en', 'es', 'tipo', 'ipa', 'ejemplo_en', 'ejemplo_es'],
    array_map(static fn ($p) => ["(SELECT id FROM ingles_temas WHERE slug = " . $q($p['tema']) . ")", $q($p['id']), $q($corta($p['en'], 96)), $q($corta($p['es'], 160)),
        $q($p['tipo']), $q($corta($p['ipa'] ?? '', 96)), $q($corta($p['ejemplo']['en'] ?? '', 255)), $q($corta($p['ejemplo']['es'] ?? '', 255))], $vocab['palabras'] ?? []),
    ['tema_id', 'en', 'es', 'tipo', 'ipa', 'ejemplo_en', 'ejemplo_es']);
$filasUT = [];
foreach ($curso['unidades'] as $u) {
    foreach ($u['temas_vocabulario'] as $t) {
        $filasUT[] = [$idUnidad($u['slug']), "(SELECT id FROM ingles_temas WHERE slug = " . $q($t) . ")"];
    }
}
if ($filasUT) { $upsert('ingles_unidad_temas', ['unidad_id', 'tema_id'], $filasUT, ['tema_id']); }

// ------------------------------------------------ ejercicios y evaluaciones
$sql[] = "\n-- Ejercicios (metadatos)";
$filasE = [];
$filasEv = [];
foreach ($curso['unidades'] as $u) {
    $c = $contenidos[$u['slug']];
    if (!$c) { continue; }
    foreach ($c['lecciones'] as $l) {
        foreach ($l['ejercicios'] as $e) {
            $filasE[] = [$q($e['id']), "'leccion'", $idUnidad($u['slug']), $idLeccion($l['slug']), "''", $q($e['tipo']), (int) $e['dificultad'], "''"];
        }
    }
    foreach ($c['evaluacion']['preguntas'] as $e) {
        $filasE[] = [$q($e['id']), "'evaluacion'", $idUnidad($u['slug']), $idLeccion($e['leccion']), "''", $q($e['tipo']), (int) $e['dificultad'], $q($e['habilidad'])];
    }
    $filasEv[] = [$q($u['slug'] . '.eval'), "'unidad'", $idUnidad($u['slug']), 'NULL', $q($c['evaluacion']['titulo']), count($c['evaluacion']['preguntas']), (int) $c['evaluacion']['aprobado']];
}
foreach ($leer('examenes.json')['examenes'] ?? [] as $x) {
    foreach ($x['preguntas'] as $e) {
        $filasE[] = [$q($e['id']), "'examen'", $idUnidad($e['unidad']), 'NULL', $q($x['slug']), $q($e['tipo']), (int) $e['dificultad'], $q($e['habilidad'])];
    }
    $filasEv[] = [$q($x['slug']), "'bloque'", 'NULL', "(SELECT id FROM ingles_bloques WHERE slug = " . $q($x['bloque']) . ")", $q($x['titulo']), count($x['preguntas']), (int) $x['aprobado']];
}
foreach ([['lecturas.json', 'lecturas', 'lectura'], ['escucha.json', 'audios', 'escucha']] as [$f, $k, $amb]) {
    foreach ($leer($f)[$k] ?? [] as $r) {
        foreach ($r['preguntas'] as $e) {
            $filasE[] = [$q($e['id']), "'$amb'", $idUnidad($r['unidad']), 'NULL', $q($r['slug']), $q($e['tipo']), (int) $e['dificultad'], "''"];
        }
    }
}
foreach ($leer('pronunciacion.json')['secciones'] ?? [] as $s) {
    foreach ($s['practica'] as $e) {
        $filasE[] = [$q($e['id']), "'pronunciacion'", 'NULL', 'NULL', $q($s['slug']), $q($e['tipo']), (int) ($e['dificultad'] ?? 1), "''"];
    }
}
$upsert('ingles_ejercicios', ['clave', 'ambito', 'unidad_id', 'leccion_id', 'recurso', 'tipo', 'dificultad', 'habilidad'], $filasE,
    ['ambito', 'unidad_id', 'leccion_id', 'recurso', 'tipo', 'dificultad', 'habilidad']);
$sql[] = "\n-- Evaluaciones de unidad y exámenes de bloque";
$upsert('ingles_evaluaciones', ['clave', 'tipo', 'unidad_id', 'bloque_id', 'titulo', 'preguntas', 'aprobado'], $filasEv,
    ['tipo', 'unidad_id', 'bloque_id', 'titulo', 'preguntas', 'aprobado']);

// --------------------------------------------------------------- recursos
$sql[] = "\n-- Recursos: lecturas, audios, conversaciones, escritura, juegos y pronunciación";
$filasR = [];
foreach ([['lecturas.json', 'lecturas', 'lectura', 'preguntas'], ['escucha.json', 'audios', 'escucha', 'preguntas'],
          ['conversaciones.json', 'escenarios', 'conversacion', 'nodos'], ['escritura.json', 'tareas', 'escritura', null]] as [$f, $k, $tipo, $cuenta]) {
    foreach ($leer($f)[$k] ?? [] as $r) {
        $filasR[] = ["'$tipo'", $q($r['slug']), $q($corta($r['titulo'], 200)), $q($r['nivel'] ?? ''), $idUnidad($r['unidad']), $cuenta ? count($r[$cuenta]) : 1];
    }
}
foreach ($leer('juegos.json')['juegos'] ?? [] as $j) {
    $filasR[] = ["'juego'", $q($j['slug']), $q($j['nombre']), "''", 'NULL', count($j['niveles'])];
}
foreach ($leer('pronunciacion.json')['secciones'] ?? [] as $s) {
    $filasR[] = ["'pronunciacion'", $q($s['slug']), $q($corta($s['titulo'], 200)), "''", 'NULL', count($s['practica'])];
}
$upsert('ingles_recursos', ['tipo', 'slug', 'titulo', 'nivel', 'unidad_id', 'elementos'], $filasR, ['titulo', 'nivel', 'unidad_id', 'elementos']);

$destino = "$raiz/database/migrations/v1.6.0-ingles.sql";
file_put_contents($destino, implode("\n", $sql) . "\n");
printf("%s: %d unidades, %d lecciones, %d palabras, %d ejercicios, %d evaluaciones, %d recursos (%s KB)\n",
    basename($destino), count($filasU), count($filasL), count($vocab['palabras'] ?? []), count($filasE), count($filasEv), count($filasR), number_format(filesize($destino) / 1024, 0));
