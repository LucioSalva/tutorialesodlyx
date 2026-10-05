<?php
/**
 * Academia de Inglés · ensamblador de unidades
 * ---------------------------------------------------------------------
 * Herramienta de desarrollo (no se despliega). Una unidad se redacta por
 * piezas para poder revisarla lección a lección:
 *
 *   tools/ingles/borradores/<unidad>/
 *       00-unidad.json          {"slug": "...", "introduccion": "..."}
 *       01-<leccion>.json       LECCION
 *       02-<leccion>.json       LECCION
 *       …
 *       99-evaluacion.json      EVALUACION
 *
 *   php tools/ingles/ensamblar.php <unidad>
 *
 * Escribe public/assets/ingles/data/unidades/<unidad>.json y después hay
 * que pasar el validador: php tools/ingles/validar.php <unidad>
 */
declare(strict_types=1);

// Herramienta de línea de comandos: nunca debe ejecutarse desde la web.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$unidad = $argv[1] ?? '';
if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $unidad)) {
    fwrite(STDERR, "Uso: php tools/ingles/ensamblar.php <slug-unidad>\n");
    exit(1);
}

$dir = __DIR__ . '/borradores/' . $unidad;
if (!is_dir($dir)) {
    fwrite(STDERR, "No existe {$dir}\n");
    exit(1);
}

$leer = static function (string $ruta): array {
    try {
        $d = json_decode((string) file_get_contents($ruta), true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        fwrite(STDERR, basename($ruta) . ': JSON inválido — ' . $e->getMessage() . "\n");
        exit(1);
    }
    return (array) $d;
};

$piezas = glob($dir . '/*.json') ?: [];
sort($piezas, SORT_STRING);

$salida = ['slug' => $unidad, 'introduccion' => '', 'lecciones' => [], 'evaluacion' => null];
foreach ($piezas as $p) {
    $nombre = basename($p);
    $d = $leer($p);
    if (str_starts_with($nombre, '00-')) {
        $salida['introduccion'] = (string) ($d['introduccion'] ?? '');
    } elseif (str_starts_with($nombre, '99-')) {
        $salida['evaluacion'] = $d;
    } else {
        $salida['lecciones'][] = $d;
    }
}

$json = json_encode($salida, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$destino = dirname(__DIR__, 2) . '/public/assets/ingles/data/unidades/' . $unidad . '.json';
file_put_contents($destino, $json . "\n");
printf("%s: %d lecciones, %d ejercicios, evaluación con %d preguntas → %s\n",
    $unidad,
    count($salida['lecciones']),
    array_sum(array_map(static fn ($l) => count($l['ejercicios'] ?? []), $salida['lecciones'])),
    count($salida['evaluacion']['preguntas'] ?? []),
    str_replace(dirname(__DIR__, 2) . '/', '', $destino));
