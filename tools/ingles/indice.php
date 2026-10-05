<?php
/**
 * Academia de Inglés · generador de índices
 * ---------------------------------------------------------------------
 * Herramienta de desarrollo. Regenera, a partir de las unidades publicadas:
 *
 *   public/assets/ingles/data/indice.json              cifras por unidad (portada)
 *   public/assets/ingles/data/tarjetas-gramatica.json  tarjetas de repaso de gramática
 *
 * Ejecutar SIEMPRE después de añadir o cambiar una unidad:
 *   php tools/ingles/indice.php
 */
declare(strict_types=1);

// Herramienta de línea de comandos: nunca debe ejecutarse desde la web.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$datos = dirname(__DIR__, 2) . '/public/assets/ingles/data';
$curso = json_decode((string) file_get_contents("$datos/curso.json"), true, 512, JSON_THROW_ON_ERROR);

$indice = ['generado' => gmdate('c'), 'unidades' => []];
$tarjetas = [];

foreach ($curso['unidades'] as $u) {
    $ruta = "$datos/unidades/{$u['slug']}.json";
    if (!is_file($ruta)) {
        continue;
    }
    $c = json_decode((string) file_get_contents($ruta), true, 512, JSON_THROW_ON_ERROR);
    $ejercicios = 0;
    $tipos = [];
    foreach ($c['lecciones'] as $l) {
        $ejercicios += count($l['ejercicios']);
        foreach ($l['ejercicios'] as $e) {
            $tipos[$e['tipo']] = ($tipos[$e['tipo']] ?? 0) + 1;
        }
        foreach ($l['repaso'] as $r) {
            $tarjetas[] = [
                'id'             => $r['id'],
                'frente'         => $r['frente'],
                'reverso'        => $r['reverso'],
                'nota'           => $r['nota'] ?? '',
                'leccion'        => $l['slug'],
                'leccion_titulo' => $l['titulo'],
                'unidad'         => $u['slug'],
            ];
        }
    }
    $indice['unidades'][$u['slug']] = [
        'lecciones'  => count($c['lecciones']),
        'ejercicios' => $ejercicios,
        'evaluacion' => count($c['evaluacion']['preguntas'] ?? []),
        'tipos'      => $tipos,
        'minutos'    => array_sum(array_map(static fn ($l) => (int) ($l['minutos'] ?? 0), $c['lecciones'])),
    ];
}

$opciones = JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
file_put_contents("$datos/indice.json", json_encode($indice, $opciones) . "\n");
file_put_contents("$datos/tarjetas-gramatica.json", json_encode(['tarjetas' => $tarjetas], $opciones) . "\n");

printf("indice.json: %d unidades · tarjetas-gramatica.json: %d tarjetas\n", count($indice['unidades']), count($tarjetas));
