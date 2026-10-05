<?php
/**
 * Une los borradores de vocabulario en public/assets/ingles/data/vocabulario.json.
 * 00-temas.json = lista de temas; NN-<tema>.json = lista de palabras del tema.
 * Uso: php tools/ingles/borradores/vocabulario/unir.php
 */
declare(strict_types=1);

// Herramienta de línea de comandos: nunca debe ejecutarse desde la web.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$dir = __DIR__;
$leer = static function (string $ruta): array {
    try {
        return json_decode((string) file_get_contents($ruta), true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        fwrite(STDERR, basename($ruta) . ': ' . $e->getMessage() . "\n");
        exit(1);
    }
};

$temas = $leer("$dir/00-temas.json");
$palabras = [];
foreach (glob("$dir/[0-9][0-9]-*.json") as $archivo) {
    if (basename($archivo) === '00-temas.json') { continue; }
    $lista = $leer($archivo);
    printf("%-32s %3d palabras\n", basename($archivo), count($lista));
    array_push($palabras, ...$lista);
}

$salida = dirname($dir, 4) . '/public/assets/ingles/data/vocabulario.json';
$json = json_encode(['temas' => $temas, 'palabras' => $palabras],
    JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
file_put_contents($salida, $json . "\n");
printf("Total: %d temas, %d palabras → %s\n", count($temas), count($palabras), $salida);
