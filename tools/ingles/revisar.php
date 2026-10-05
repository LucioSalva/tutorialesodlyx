<?php
/**
 * Academia de Inglés · volcado compacto para revisión académica
 * ---------------------------------------------------------------------
 * Herramienta de desarrollo. Imprime una unidad en texto plano legible:
 * explicaciones, ejemplos con traducción, errores frecuentes, ejercicios con
 * sus respuestas aceptadas y soluciones. Pensado para que un revisor lea
 * TODO el contenido sin el ruido del JSON.
 *
 *   php tools/ingles/revisar.php <unidad> [--solo-ejercicios]
 */
declare(strict_types=1);

// Herramienta de línea de comandos: nunca debe ejecutarse desde la web.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$slug = $argv[1] ?? '';
$soloEj = in_array('--solo-ejercicios', $argv, true);
$ruta = dirname(__DIR__, 2) . "/public/assets/ingles/data/unidades/$slug.json";
if (!preg_match('/^[a-z0-9-]+$/', $slug) || !is_file($ruta)) {
    fwrite(STDERR, "Uso: php tools/ingles/revisar.php <unidad>\n");
    exit(1);
}
$u = json_decode((string) file_get_contents($ruta), true);

$p = static function (string $s = ''): void { echo $s, "\n"; };
$ej = static function (array $e) use ($p): void {
    $p("  [{$e['id']}] {$e['tipo']} d{$e['dificultad']} · {$e['enunciado']}" . (isset($e['leccion']) ? " · lección={$e['leccion']} · {$e['habilidad']}" : '') . (isset($e['unidad']) ? " · unidad={$e['unidad']}" : ''));
    switch ($e['tipo']) {
        case 'opcion':
        case 'conversacion':
            if (!empty($e['contexto'])) { $p("     contexto: {$e['contexto']}"); }
            foreach ($e['lineas'] ?? [] as $l) { $p("     {$l['quien']}: {$l['en']} | {$l['es']}"); }
            if (!empty($e['pregunta'])) { $p("     P: {$e['pregunta']}"); }
            foreach ($e['opciones'] as $o) { $p('     ' . (!empty($o['correcta']) ? '✔' : '✘') . " {$o['texto']} — {$o['porque']}"); }
            break;
        case 'completar':
            $p("     {$e['frase']}" . (isset($e['traduccion']) ? " | {$e['traduccion']}" : '') . (isset($e['banco']) ? ' · banco: ' . implode(', ', $e['banco']) : ''));
            $p('     → ' . implode(' ‖ ', array_map(static fn ($l) => implode(' / ', $l), $e['respuestas'])));
            break;
        case 'ordenar':
            $p('     fichas: ' . implode(' · ', $e['fichas']) . (isset($e['traduccion']) ? " | {$e['traduccion']}" : ''));
            $p('     → ' . implode(' / ', $e['respuestas']));
            break;
        case 'relacionar':
            $p('     ' . implode(' · ', array_map(static fn ($x) => "{$x['a']} = {$x['b']}", $e['pares'])));
            break;
        case 'traducir':
            $p("     ES: {$e['es']}");
            $p('     → ' . implode(' / ', $e['respuestas']));
            break;
        case 'transformar':
            $p("     {$e['origen']} ⇒ {$e['instruccion']}");
            $p('     → ' . implode(' / ', $e['respuestas']));
            break;
        case 'corregir':
            $p("     {$e['frase']}  (error: {$e['error']}) → " . implode(' / ', $e['correcciones']) . " ⇒ {$e['frase_correcta']}");
            break;
        case 'dictado':
            $p("     🔊 {$e['texto']}" . (!empty($e['respuestas']) ? ' · también: ' . implode(' / ', $e['respuestas']) : ''));
            break;
        case 'pronunciacion':
            $p("     🔊 {$e['texto']} {$e['ipa']} | {$e['es']} · {$e['consejo']}");
            return;
        case 'escritura':
            $p("     {$e['instrucciones']}");
            $p("     MODELO: {$e['modelo']}");
            return;
    }
    if (!empty($e['errores_tipicos'])) {
        foreach ($e['errores_tipicos'] as $k => $v) { $p("     ✘ «{$k}»: {$v}"); }
    }
    foreach ($e['pistas'] ?? [] as $i => $x) { $p('     pista ' . ($i + 1) . ": {$x}"); }
    $p("     SOL: {$e['solucion']['respuesta']} — {$e['solucion']['explicacion']}");
};

$p("# UNIDAD {$u['slug']}");
$p($u['introduccion']);
foreach ($u['lecciones'] as $l) {
    $p();
    $p("## LECCIÓN {$l['slug']} — {$l['titulo']}");
    if (!$soloEj) {
        if (!empty($l['situacion'])) {
            $p("SITUACIÓN: {$l['situacion']['titulo']} — {$l['situacion']['texto']}");
            foreach ($l['situacion']['dialogo'] ?? [] as $x) { $p("  {$x['quien']}: {$x['en']} | {$x['es']}"); }
        }
        foreach ($l['conceptos'] as $c) {
            $p("### CONCEPTO {$c['id']}: {$c['titulo']}");
            $p("QUÉ ES: {$c['que_es']}");
            $p('PARA QUÉ: ' . implode(' · ', $c['para_que']));
            $p("CÓMO FUNCIONA: {$c['como_funciona']}");
            foreach ($c['estructuras'] as $s) {
                $p('FÓRMULA ' . ($s['etiqueta'] ?? '') . ': ' . implode(' + ', array_map(static fn ($x) => $x['t'] . '[' . $x['rol'] . ']', $s['formula'])) . ' ⇒ ' . implode(' ', array_column($s['ejemplo'], 't')) . " | {$s['es']}");
            }
            foreach ($c['tablas'] ?? [] as $t) {
                $p('TABLA ' . ($t['titulo'] ?? '') . ': ' . implode(' | ', $t['columnas']));
                foreach ($t['filas'] as $f) { $p('   ' . implode(' | ', $f)); }
            }
            foreach ($c['ejemplos'] as $x) { $p("EJ: {$x['en']} | {$x['es']}" . (!empty($x['nota']) ? " — {$x['nota']}" : '')); }
            if (!empty($c['comparacion'])) { $p('COMPARA: ' . json_encode($c['comparacion'], JSON_UNESCAPED_UNICODE)); }
            if (!empty($c['visual'])) { $p('VISUAL: ' . json_encode($c['visual'], JSON_UNESCAPED_UNICODE)); }
            foreach ($c['pronunciacion'] as $x) { $p("PRON: {$x['texto']} {$x['ipa']} — {$x['consejo']}"); }
            foreach ($c['errores'] as $x) { $p("ERROR: ✘ {$x['mal']} → ✔ {$x['bien']} — {$x['porque']}"); }
            if (!empty($c['nota'])) { $p('NOTA: ' . ($c['nota']['titulo'] ?? '') . ' — ' . $c['nota']['texto']); }
        }
    }
    $p('### EJERCICIOS');
    foreach ($l['ejercicios'] as $e) { $ej($e); }
    if (!$soloEj) {
        $pc = $l['practica_comunicativa'];
        $p("PRÁCTICA: {$pc['titulo']} — {$pc['contexto']}");
        foreach ($pc['dialogo'] as $x) { $p("  {$x['quien']}: {$x['en']} | {$x['es']}"); }
        $p("  TU TURNO: {$pc['tu_turno']} · MODELO: {$pc['modelo']}" . (!empty($pc['alternativas']) ? ' · ALT: ' . implode(' / ', $pc['alternativas']) : ''));
        foreach ($l['repaso'] as $r) { $p("REPASO: {$r['frente']} ⇒ {$r['reverso']}"); }
    }
}
$p();
$p('## EVALUACIÓN');
foreach ($u['evaluacion']['preguntas'] as $e) { $ej($e); }
