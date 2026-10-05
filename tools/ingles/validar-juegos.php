<?php
/**
 * Validación de los datos de cada nivel de juego. Documentado en
 * docs/INGLES.md § Juegos. Lo incluye validar-complementos.php.
 */
declare(strict_types=1);

function rondas(array $n, int $min, string $donde, array $campos): array
{
    $r = (array) ($n['rondas'] ?? []);
    if (count($r) < $min) { err($donde, "necesita al menos {$min} rondas (tiene " . count($r) . ')'); }
    foreach ($r as $i => $x) { req((array) $x, $campos, "$donde ronda $i"); }
    return $r;
}

function validar_nivel_juego(string $juego, array $n, string $donde): void
{
    static $vocab = null;
    if ($vocab === null) {
        $ruta = dirname(__DIR__, 2) . '/public/assets/ingles/data/vocabulario.json';
        $v = is_file($ruta) ? json_decode((string) file_get_contents($ruta), true) : null;
        $vocab = [];
        foreach ((array) ($v['palabras'] ?? []) as $p) { $vocab[$p['tema']][] = $p; }
    }
    $temasOk = static function (array $n) use ($vocab, $donde): void {
        $temas = (array) ($n['temas'] ?? []);
        if ($temas === []) { err($donde, 'faltan temas de vocabulario'); }
        foreach ($temas as $t) { if (!isset($vocab[$t])) { err($donde, "tema de vocabulario «{$t}» inexistente"); } }
    };

    switch ($juego) {
        case 'ordena-la-oracion':
            foreach (rondas($n, 6, $donde, ['respuesta', 'es', 'explicacion', 'pista']) as $i => $r) {
                if (count(explode(' ', norm((string) ($r['respuesta'] ?? '')))) < 3) { err("$donde ronda $i", 'oración demasiado corta'); }
            }
            break;
        case 'encuentra-el-error':
            foreach (rondas($n, 6, $donde, ['frase', 'error', 'correccion', 'explicacion', 'es', 'pista']) as $i => $r) {
                if (!str_contains(' ' . norm((string) $r['frase']) . ' ', ' ' . norm((string) $r['error']) . ' ')) { err("$donde ronda $i", 'el error no aparece en la frase'); }
            }
            break;
        case 'escucha-y-selecciona':
            if (($n['modo'] ?? '') === 'pares_minimos') {
                $p = (array) ($n['pares'] ?? []);
                if (count($p) < 6) { err($donde, 'necesita al menos 6 pares mínimos'); }
                foreach ($p as $x) { req((array) $x, ['a', 'b', 'es_a', 'es_b', 'pista'], "$donde par"); }
            } else {
                if (!in_array($n['modo'] ?? '', ['significado', 'palabra'], true)) { err($donde, 'modo debe ser significado, palabra o pares_minimos'); }
                $temasOk($n);
                if ((int) ($n['rondas'] ?? 0) < 6) { err($donde, 'rondas (número) debe ser al menos 6'); }
            }
            break;
        case 'memoria-de-vocabulario':
            $temasOk($n);
            if (!in_array($n['modo'] ?? '', ['imagen', 'significado'], true)) { err($donde, 'modo debe ser imagen o significado'); }
            $k = (int) ($n['parejas'] ?? 0);
            if ($k < 4 || $k > 10) { err($donde, 'parejas debe estar entre 4 y 10'); }
            if (($n['modo'] ?? '') === 'imagen') {
                $conEmoji = 0;
                foreach ((array) ($n['temas'] ?? []) as $t) { foreach ($vocab[$t] ?? [] as $p) { if (!empty($p['emoji'])) { $conEmoji++; } } }
                if ($conEmoji < $k) { err($donde, "solo hay {$conEmoji} palabras con imagen en esos temas y se piden {$k} parejas"); }
            }
            break;
        case 'completa-el-dialogo':
            foreach (rondas($n, 5, $donde, ['contexto', 'lineas', 'opciones', 'pista']) as $i => $r) {
                opciones($r['opciones'] ?? null, "$donde ronda $i");
                $huecos = 0;
                foreach ((array) ($r['lineas'] ?? []) as $l) { if (($l['en'] ?? '') === '___') { $huecos++; } else { linea($l, "$donde ronda $i"); } }
                if ($huecos !== 1) { err("$donde ronda $i", 'debe haber exactamente una línea con en = "___"'); }
            }
            break;
        case 'detective-gramatical':
            foreach (rondas($n, 6, $donde, ['frase', 'es', 'resaltar', 'pregunta', 'opciones', 'pista']) as $i => $r) {
                opciones($r['opciones'] ?? null, "$donde ronda $i");
                if (!str_contains((string) $r['frase'], (string) $r['resaltar'])) { err("$donde ronda $i", 'resaltar no aparece en la frase'); }
            }
            break;
        case 'construye-la-pregunta':
            rondas($n, 6, $donde, ['afirmacion', 'objetivo', 'respuestas', 'explicacion', 'pista']);
            break;
        case 'viaje-interactivo':
            $paradas = (array) ($n['paradas'] ?? []);
            if (count($paradas) < 3) { err($donde, 'necesita al menos 3 paradas'); }
            foreach ($paradas as $p) {
                req((array) $p, ['lugar', 'emoji', 'situacion', 'retos'], "$donde parada");
                foreach ((array) ($p['retos'] ?? []) as $r) { reto((array) $r, "$donde parada " . ($p['lugar'] ?? '')); }
            }
            break;
        case 'desafio-de-tiempos':
            foreach (rondas($n, 8, $donde, ['frase', 'opciones', 'correcta', 'senal', 'explicacion', 'es', 'pista']) as $i => $r) {
                if (!in_array($r['correcta'], (array) $r['opciones'], true)) { err("$donde ronda $i", 'la correcta no está entre las opciones'); }
                if (substr_count((string) $r['frase'], '___') !== 1) { err("$donde ronda $i", 'la frase debe tener un hueco ___'); }
            }
            break;
        case 'mision-final':
            $caps = (array) ($n['capitulos'] ?? []);
            if (count($caps) < 3) { err($donde, 'necesita al menos 3 capítulos'); }
            foreach ($caps as $c) {
                req((array) $c, ['titulo', 'narracion', 'es', 'retos'], "$donde capítulo");
                foreach ((array) ($c['retos'] ?? []) as $r) { reto((array) $r, "$donde capítulo " . ($c['titulo'] ?? '')); }
            }
            break;
        default:
            err($donde, 'juego desconocido');
    }
}

/** Reto de los juegos narrativos: opcion | escribir | ordenar. */
function reto(array $r, string $donde): void
{
    req($r, ['tipo', 'pregunta', 'explicacion', 'pista'], $donde);
    switch ($r['tipo'] ?? '') {
        case 'opcion':
            opciones($r['opciones'] ?? null, $donde);
            break;
        case 'escribir':
            if (!is_array($r['respuestas'] ?? null) || $r['respuestas'] === []) { err($donde, 'reto escribir sin respuestas'); }
            break;
        case 'ordenar':
            if (!texto($r['respuesta'] ?? null)) { err($donde, 'reto ordenar sin respuesta'); }
            break;
        default:
            err($donde, 'tipo de reto no válido (opcion, escribir, ordenar)');
    }
    if (isset($r['linea'])) { linea($r['linea'], $donde); }
}
