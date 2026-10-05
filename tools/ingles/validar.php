<?php
/**
 * Academia de Inglés · validador de contenido
 * ---------------------------------------------------------------------
 * Herramienta de desarrollo (no se despliega). Comprueba que los JSON de
 * public/assets/ingles/data/ cumplen docs/INGLES_CONTENIDO.md.
 *
 *   php tools/ingles/validar.php                 todo
 *   php tools/ingles/validar.php verbo-to-be     solo esa unidad
 *   php tools/ingles/validar.php --archivo=lecturas
 *
 * Sale con código 1 si hay errores. Los avisos no bloquean.
 */
declare(strict_types=1);

// Herramienta de línea de comandos: nunca debe ejecutarse desde la web.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$raiz  = dirname(__DIR__, 2);
$datos = $raiz . '/public/assets/ingles/data';

$errores = [];
$avisos  = [];
$idsEjercicio = [];

function err(string $donde, string $msg): void { global $errores; $errores[] = "[$donde] $msg"; }
function aviso(string $donde, string $msg): void { global $avisos; $avisos[] = "[$donde] $msg"; }

function leer(string $ruta): ?array
{
    if (!is_file($ruta)) { return null; }
    try {
        $d = json_decode((string) file_get_contents($ruta), true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        err(basename($ruta), 'JSON inválido: ' . $e->getMessage());
        return null;
    }
    return is_array($d) ? $d : null;
}

const ROLES = ['sujeto', 'verbo', 'auxiliar', 'negacion', 'complemento', 'interrogativo', 'tiempo', 'otro'];
const TIPOS = ['opcion', 'completar', 'ordenar', 'relacionar', 'traducir', 'transformar', 'corregir',
               'dictado', 'conversacion', 'escritura', 'pronunciacion'];
const HABILIDADES = ['gramatica', 'vocabulario', 'comprension', 'interpretacion', 'produccion'];

function texto(mixed $v): bool { return is_string($v) && trim($v) !== ''; }

function req(array $o, array $campos, string $donde): void
{
    foreach ($campos as $c) {
        if (!array_key_exists($c, $o) || $o[$c] === '' || $o[$c] === [] || $o[$c] === null) {
            err($donde, "falta el campo «{$c}»");
        }
    }
}

/** Normaliza para comparar tokens: minúsculas, apóstrofo recto, sin puntuación final. */
function norm(string $s): string
{
    $s = str_replace(['’', '‘', '“', '”'], ["'", "'", '"', '"'], $s);
    $s = mb_strtolower(trim($s));
    $s = preg_replace('/[.,!?¿¡;:"]+/u', ' ', $s) ?? $s;
    return trim(preg_replace('/\s+/u', ' ', $s) ?? $s);
}

/** Comprueba el marcado propio: ** ** pares, {{rol:…}} con rol válido, [[ ]] balanceado. */
function marcado(string $s, string $donde): void
{
    if (substr_count($s, '**') % 2 !== 0) { err($donde, 'negritas ** desparejadas'); }
    if (substr_count($s, '[[') !== substr_count($s, ']]')) { err($donde, 'marcas [[ ]] desparejadas'); }
    if (preg_match_all('/\{\{([a-z]+):/u', $s, $m)) {
        foreach ($m[1] as $rol) {
            if (!in_array($rol, ROLES, true)) { err($donde, "rol desconocido en {{{$rol}:…}}"); }
        }
    }
    if (substr_count($s, '{{') !== substr_count($s, '}}')) { err($donde, 'marcas {{ }} desparejadas'); }
}

/** Recorre recursivamente todas las cadenas de un nodo y valida su marcado. */
function marcadoProfundo(mixed $v, string $donde): void
{
    if (is_string($v)) { marcado($v, $donde); return; }
    if (is_array($v)) { foreach ($v as $k => $x) { marcadoProfundo($x, $donde); } }
}

function partes(mixed $p, string $donde): void
{
    if (!is_array($p) || $p === []) { err($donde, 'partes vacías'); return; }
    foreach ($p as $i => $pieza) {
        if (!is_array($pieza) || !texto($pieza['t'] ?? null)) { err($donde, "pieza $i sin texto"); continue; }
        if (!in_array($pieza['rol'] ?? '', ROLES, true)) { err($donde, "pieza «{$pieza['t']}» con rol no válido «" . ($pieza['rol'] ?? '') . '»'); }
        if (trim((string) $pieza['t']) === '+') { err($donde, 'pieza «+» sobrante: la interfaz ya dibuja el + entre piezas'); }
    }
}

function pistasYSolucion(array $e, string $donde, bool $conSolucion = true): void
{
    $p = $e['pistas'] ?? null;
    if (!is_array($p) || count($p) !== 3) { err($donde, 'debe tener exactamente 3 pistas'); }
    elseif (count(array_filter($p, 'texto')) !== 3) { err($donde, 'hay pistas vacías'); }
    else { pistaQueRegala($e, $donde); }
    if ($conSolucion) {
        if (!texto($e['solucion']['respuesta'] ?? null)) { err($donde, 'falta solucion.respuesta'); }
        if (!texto($e['solucion']['explicacion'] ?? null)) { err($donde, 'falta solucion.explicacion'); }
        elseif (mb_strlen($e['solucion']['explicacion']) < 40) { aviso($donde, 'explicación de la solución muy corta'); }
    }
}

/**
 * La pista 3 debe llevar casi a la respuesta, pero no escribirla: si contiene
 * la respuesta completa (o la oración entera) es un error.
 */
function pistaQueRegala(array $e, string $donde): void
{
    $pista = ' ' . norm((string) ($e['pistas'][2] ?? '')) . ' ';
    $candidatas = match ($e['tipo'] ?? '') {
        'ordenar', 'traducir', 'transformar' => (array) ($e['respuestas'] ?? []),
        'corregir' => [(string) ($e['frase_correcta'] ?? '')],
        'dictado' => [(string) ($e['texto'] ?? '')],
        default => [],
    };
    foreach ($candidatas as $r) {
        $r = norm((string) $r);
        if (substr_count($r, ' ') >= 2 && str_contains($pista, ' ' . $r . ' ')) {
            err($donde, 'la pista 3 contiene la respuesta completa: «' . $r . '»');
            return;
        }
    }
}

function opciones(mixed $ops, string $donde): void
{
    if (!is_array($ops) || count($ops) < 2) { err($donde, 'necesita al menos 2 opciones'); return; }
    $correctas = 0;
    $vistos = [];
    foreach ($ops as $i => $o) {
        if (!texto($o['texto'] ?? null)) { err($donde, "opción $i sin texto"); continue; }
        if (!texto($o['porque'] ?? null)) { err($donde, "la opción «{$o['texto']}» no explica su porqué"); }
        if (!empty($o['correcta'])) { $correctas++; }
        // Sensible a mayúsculas: «mexican» y «Mexican» son opciones distintas a propósito.
        $n = trim(preg_replace('/\s+/u', ' ', $o['texto']) ?? $o['texto']);
        if (isset($vistos[$n])) { err($donde, "opción repetida «{$o['texto']}»"); }
        $vistos[$n] = true;
    }
    if ($correctas < 1) { err($donde, 'ninguna opción es correcta'); }
}

function linea(mixed $l, string $donde): void
{
    if (!is_array($l) || !texto($l['quien'] ?? null) || !texto($l['en'] ?? null) || !texto($l['es'] ?? null)) {
        err($donde, 'línea de diálogo incompleta (quien, en, es)');
    }
}

function ejercicio(array $e, string $donde, bool $enEvaluacion = false): void
{
    global $idsEjercicio;
    $id = (string) ($e['id'] ?? '');
    $donde .= ' ' . ($id ?: '(sin id)');
    if (!preg_match('/^[a-z0-9-]+(\.[a-z0-9-]+){1,3}$/', $id)) { err($donde, 'id con formato no válido'); }
    if (isset($idsEjercicio[$id])) { err($donde, "id repetido (también en {$idsEjercicio[$id]})"); }
    $idsEjercicio[$id] = $donde;

    $tipo = $e['tipo'] ?? '';
    if (!in_array($tipo, TIPOS, true)) { err($donde, "tipo desconocido «{$tipo}»"); return; }
    if ($enEvaluacion && in_array($tipo, ['escritura', 'pronunciacion'], true)) {
        err($donde, "«{$tipo}» no se admite en evaluaciones");
    }
    if (!texto($e['enunciado'] ?? null) && $tipo !== 'escritura') { err($donde, 'falta enunciado'); }
    $dif = $e['dificultad'] ?? null;
    if (!in_array($dif, [1, 2, 3], true)) { err($donde, 'dificultad debe ser 1, 2 o 3'); }
    marcadoProfundo($e, $donde);

    switch ($tipo) {
        case 'opcion':
            if (!texto($e['pregunta'] ?? null)) { err($donde, 'falta pregunta'); }
            opciones($e['opciones'] ?? null, $donde);
            pistasYSolucion($e, $donde);
            break;

        case 'completar':
            $frase = (string) ($e['frase'] ?? '');
            $huecos = substr_count($frase, '___');
            $resp = $e['respuestas'] ?? null;
            if ($huecos < 1) { err($donde, 'la frase no tiene huecos ___'); }
            if (!is_array($resp) || count($resp) !== $huecos) {
                err($donde, "hay {$huecos} huecos pero " . (is_array($resp) ? count($resp) : 0) . ' listas de respuestas');
            } else {
                foreach ($resp as $i => $lista) {
                    if (!is_array($lista) || $lista === [] || count(array_filter($lista, 'texto')) !== count($lista)) {
                        err($donde, "respuestas del hueco $i: debe ser una lista de textos no vacía");
                    }
                }
                if (isset($e['banco'])) {
                    $banco = array_map('norm', (array) $e['banco']);
                    foreach ($resp as $i => $lista) {
                        $alguna = false;
                        foreach ((array) $lista as $r) { if (in_array(norm((string) $r), $banco, true)) { $alguna = true; } }
                        if (!$alguna) { err($donde, "ninguna respuesta del hueco $i está en el banco"); }
                    }
                }
            }
            pistasYSolucion($e, $donde);
            break;

        case 'ordenar':
            $fichas = $e['fichas'] ?? null;
            $resp = $e['respuestas'] ?? null;
            if (!is_array($fichas) || count($fichas) < 3) { err($donde, 'necesita al menos 3 fichas'); }
            if (!is_array($resp) || $resp === []) { err($donde, 'faltan respuestas'); }
            if (is_array($fichas) && is_array($resp)) {
                $a = array_map('norm', $fichas);
                $a = array_values(array_filter($a, static fn ($x) => $x !== ''));
                sort($a);
                foreach ($resp as $r) {
                    $b = explode(' ', norm((string) $r));
                    sort($b);
                    if ($a !== $b) { err($donde, "las fichas no forman exactamente «{$r}»"); }
                }
            }
            if (!texto($e['traduccion'] ?? null)) { aviso($donde, 'ordenar sin traducción'); }
            pistasYSolucion($e, $donde);
            break;

        case 'relacionar':
            $pares = $e['pares'] ?? null;
            if (!is_array($pares) || count($pares) < 4 || count($pares) > 8) { err($donde, 'relacionar necesita entre 4 y 8 pares'); }
            else {
                $as = []; $bs = [];
                foreach ($pares as $p) {
                    if (!texto($p['a'] ?? null) || !texto($p['b'] ?? null)) { err($donde, 'par incompleto'); continue; }
                    $as[] = norm($p['a']); $bs[] = norm($p['b']);
                }
                if (count(array_unique($as)) !== count($as) || count(array_unique($bs)) !== count($bs)) { err($donde, 'pares con elementos repetidos (ambiguo)'); }
            }
            pistasYSolucion($e, $donde);
            break;

        case 'traducir':
            if (!texto($e['es'] ?? null)) { err($donde, 'falta es'); }
            if (!is_array($e['respuestas'] ?? null) || $e['respuestas'] === []) { err($donde, 'faltan respuestas'); }
            pistasYSolucion($e, $donde);
            break;

        case 'transformar':
            if (!texto($e['origen'] ?? null)) { err($donde, 'falta origen'); }
            if (!texto($e['instruccion'] ?? null)) { err($donde, 'falta instruccion'); }
            if (!is_array($e['respuestas'] ?? null) || $e['respuestas'] === []) { err($donde, 'faltan respuestas'); }
            pistasYSolucion($e, $donde);
            break;

        case 'corregir':
            $frase = (string) ($e['frase'] ?? '');
            $error = (string) ($e['error'] ?? '');
            if ($error === '' || !str_contains(' ' . norm($frase) . ' ', ' ' . norm($error) . ' ')) { err($donde, "el error «{$error}» no aparece como palabra(s) en la frase"); }
            if (!is_array($e['correcciones'] ?? null) || $e['correcciones'] === []) { err($donde, 'faltan correcciones'); }
            if (!texto($e['frase_correcta'] ?? null)) { err($donde, 'falta frase_correcta'); }
            pistasYSolucion($e, $donde);
            break;

        case 'dictado':
            if (!texto($e['texto'] ?? null)) { err($donde, 'falta texto'); }
            pistasYSolucion($e, $donde);
            break;

        case 'conversacion':
            if (!texto($e['contexto'] ?? null)) { err($donde, 'falta contexto'); }
            if (!is_array($e['lineas'] ?? null) || $e['lineas'] === []) { err($donde, 'faltan lineas'); }
            foreach ((array) ($e['lineas'] ?? []) as $l) { linea($l, $donde); }
            opciones($e['opciones'] ?? null, $donde);
            pistasYSolucion($e, $donde);
            break;

        case 'escritura':
            escritura($e, $donde);
            break;

        case 'pronunciacion':
            req($e, ['texto', 'ipa', 'consejo', 'es'], $donde);
            if (isset($e['pistas'])) { pistasYSolucion($e, $donde, false); }
            break;
    }
}

function escritura(array $e, string $donde): void
{
    req($e, ['objetivo', 'instrucciones', 'vocabulario_apoyo', 'estructuras', 'ejemplo', 'criterios', 'modelo', 'explicacion', 'errores_comunes'], $donde);
    foreach ((array) ($e['comprobaciones'] ?? []) as $c) {
        $patron = (string) ($c['patron'] ?? '');
        if (!texto($c['descripcion'] ?? null) || $patron === '') { err($donde, 'comprobación incompleta'); continue; }
        if (@preg_match('/' . str_replace('/', '\/', $patron) . '/iu', '') === false) { err($donde, "patrón no válido: {$patron}"); continue; }
        if (!preg_match('/' . str_replace('/', '\/', $patron) . '/iu', (string) ($e['modelo'] ?? ''))) {
            err($donde, "el modelo no cumple su propia comprobación «{$c['descripcion']}»");
        }
    }
    $min = (int) ($e['min_palabras'] ?? 0);
    $palabras = str_word_count(preg_replace("/[^A-Za-z' ]+/", ' ', (string) ($e['modelo'] ?? '')) ?? '');
    if ($min > 0 && $palabras < $min) { err($donde, "el modelo tiene {$palabras} palabras y el mínimo pedido es {$min}"); }
}

function concepto(array $c, string $donde): void
{
    $donde .= ' concepto ' . ($c['id'] ?? '?');
    req($c, ['id', 'titulo', 'que_es', 'para_que', 'como_funciona', 'estructuras', 'ejemplos', 'pronunciacion', 'errores'], $donde);
    marcadoProfundo($c, $donde);
    foreach ((array) ($c['estructuras'] ?? []) as $i => $s) {
        partes($s['formula'] ?? null, "$donde estructura $i fórmula");
        partes($s['ejemplo'] ?? null, "$donde estructura $i ejemplo");
        if (!texto($s['es'] ?? null)) { err("$donde estructura $i", 'falta traducción es'); }
    }
    $ejemplos = (array) ($c['ejemplos'] ?? []);
    if (count($ejemplos) < 3) { err($donde, 'necesita al menos 3 ejemplos'); }
    $conNota = 0;
    foreach ($ejemplos as $i => $x) {
        if (!texto($x['en'] ?? null) || !texto($x['es'] ?? null)) { err("$donde ejemplo $i", 'falta en o es'); continue; }
        if (!empty($x['nota'])) { $conNota++; }
        if (isset($x['partes'])) {
            partes($x['partes'], "$donde ejemplo $i");
            $unido = norm(implode(' ', array_map(static fn ($p) => (string) ($p['t'] ?? ''), (array) $x['partes'])));
            if ($unido !== norm($x['en'])) { err("$donde ejemplo $i", "las partes («{$unido}») no reproducen la frase «{$x['en']}»"); }
        }
    }
    if ($ejemplos !== [] && $conNota * 2 < count($ejemplos)) { aviso($donde, 'menos de la mitad de los ejemplos tienen nota explicativa'); }
    foreach ((array) ($c['tablas'] ?? []) as $i => $t) {
        $cols = count((array) ($t['columnas'] ?? []));
        if ($cols < 2) { err("$donde tabla $i", 'necesita columnas'); }
        foreach ((array) ($t['filas'] ?? []) as $j => $f) {
            if (count((array) $f) !== $cols) { err("$donde tabla $i", "la fila $j no tiene $cols celdas"); }
        }
    }
    foreach ((array) ($c['pronunciacion'] ?? []) as $i => $p) {
        req((array) $p, ['texto', 'ipa', 'consejo'], "$donde pronunciación $i");
    }
    foreach ((array) ($c['errores'] ?? []) as $i => $x) {
        req((array) $x, ['mal', 'bien', 'porque'], "$donde error $i");
    }
    if (isset($c['visual'])) {
        $v = $c['visual'];
        $tipos = ['linea_tiempo', 'mapa', 'escena', 'transformacion'];
        if (!in_array($v['tipo'] ?? '', $tipos, true)) { err($donde, 'visual con tipo desconocido'); }
        if (($v['tipo'] ?? '') === 'transformacion') {
            foreach ((array) ($v['pasos'] ?? []) as $i => $paso) { partes($paso['partes'] ?? null, "$donde visual paso $i"); }
        }
        if (($v['tipo'] ?? '') === 'mapa' && count((array) ($v['ramas'] ?? [])) < 2) { err($donde, 'mapa con menos de 2 ramas'); }
        if (($v['tipo'] ?? '') === 'linea_tiempo' && count((array) ($v['marcas'] ?? [])) < 1) { err($donde, 'línea de tiempo sin marcas'); }
    }
}

function unidad(array $meta, array $u, string $donde): void
{
    if (($u['slug'] ?? '') !== $meta['slug']) { err($donde, 'el slug del archivo no coincide con curso.json'); }
    if (!texto($u['introduccion'] ?? null)) { err($donde, 'falta introduccion'); }
    $esperadas = array_map(static fn ($l) => $l['slug'], $meta['lecciones']);
    $reales = array_map(static fn ($l) => (string) ($l['slug'] ?? ''), (array) ($u['lecciones'] ?? []));
    if ($esperadas !== $reales) {
        err($donde, 'las lecciones no coinciden con curso.json: esperadas [' . implode(', ', $esperadas) . '], hay [' . implode(', ', $reales) . ']');
    }
    foreach ((array) ($u['lecciones'] ?? []) as $l) {
        $dl = $donde . ' › ' . ($l['slug'] ?? '?');
        req($l, ['slug', 'titulo', 'minutos', 'objetivos', 'conceptos', 'ejercicios', 'practica_comunicativa', 'resumen', 'repaso'], $dl);
        if (isset($l['situacion']['dialogo'])) { foreach ((array) $l['situacion']['dialogo'] as $x) { linea($x, "$dl situación"); } }
        $conceptos = (array) ($l['conceptos'] ?? []);
        if (count($conceptos) < 1 || count($conceptos) > 4) { err($dl, 'debe tener entre 1 y 4 conceptos'); }
        foreach ($conceptos as $c) { concepto((array) $c, $dl); }

        $ej = (array) ($l['ejercicios'] ?? []);
        if (count($ej) < 8) { err($dl, 'necesita al menos 8 ejercicios (tiene ' . count($ej) . ')'); }
        $tipos = array_unique(array_map(static fn ($e) => $e['tipo'] ?? '', $ej));
        if (count($tipos) < 4) { err($dl, 'necesita al menos 4 tipos de ejercicio distintos'); }
        $prefijo = $meta['slug'] . '.' . ($l['slug'] ?? '') . '.';
        foreach ($ej as $e) {
            ejercicio((array) $e, $dl);
            if (!str_starts_with((string) ($e['id'] ?? ''), $prefijo)) { err($dl, "el id «" . ($e['id'] ?? '') . "» debe empezar por {$prefijo}"); }
        }

        $p = (array) ($l['practica_comunicativa'] ?? []);
        req($p, ['titulo', 'contexto', 'dialogo', 'tu_turno', 'modelo', 'claves'], "$dl práctica");
        foreach ((array) ($p['dialogo'] ?? []) as $x) { linea($x, "$dl práctica"); }
        marcadoProfundo($p, "$dl práctica");

        if (!is_array($l['resumen']['esencial'] ?? null) || $l['resumen']['esencial'] === []) { err($dl, 'resumen.esencial vacío'); }
        $rep = (array) ($l['repaso'] ?? []);
        if (count($rep) < 3 || count($rep) > 6) { err($dl, 'repaso debe tener entre 3 y 6 tarjetas'); }
        foreach ($rep as $r) {
            req((array) $r, ['id', 'frente', 'reverso'], "$dl repaso");
            if (!str_starts_with((string) ($r['id'] ?? ''), $prefijo)) { err($dl, "tarjeta de repaso con id fuera de su lección: " . ($r['id'] ?? '')); }
        }
    }

    $ev = (array) ($u['evaluacion'] ?? []);
    $de = $donde . ' › evaluación';
    req($ev, ['titulo', 'aprobado', 'preguntas'], $de);
    $preg = (array) ($ev['preguntas'] ?? []);
    if (count($preg) < 12 || count($preg) > 20) { err($de, 'debe tener entre 12 y 20 preguntas (tiene ' . count($preg) . ')'); }
    $cubiertas = []; $habs = []; $tipos = [];
    foreach ($preg as $q) {
        ejercicio((array) $q, $de, true);
        if (!str_starts_with((string) ($q['id'] ?? ''), $meta['slug'] . '.eval.')) { err($de, 'id de pregunta debe empezar por ' . $meta['slug'] . '.eval.'); }
        $lec = (string) ($q['leccion'] ?? '');
        if (!in_array($lec, $esperadas, true)) { err($de, "pregunta " . ($q['id'] ?? '') . " con leccion desconocida «{$lec}»"); }
        $cubiertas[$lec] = true;
        $h = (string) ($q['habilidad'] ?? '');
        if (!in_array($h, HABILIDADES, true)) { err($de, "pregunta " . ($q['id'] ?? '') . " con habilidad no válida «{$h}»"); }
        $habs[$h] = true;
        $tipos[$q['tipo'] ?? ''] = true;
    }
    foreach ($esperadas as $s) { if (!isset($cubiertas[$s])) { err($de, "ninguna pregunta evalúa la lección «{$s}»"); } }
    if (count($habs) < 3) { err($de, 'debe evaluar al menos 3 habilidades'); }
    if (count($tipos) < 4) { err($de, 'debe usar al menos 4 tipos de ejercicio'); }
}

// ------------------------------------------------------------------ main
$curso = leer($datos . '/curso.json');
if ($curso === null) { fwrite(STDERR, "No se pudo leer curso.json\n"); exit(1); }

$filtro = null; $archivo = null;
foreach (array_slice($argv, 1) as $a) {
    if (str_starts_with($a, '--archivo=')) { $archivo = substr($a, 10); }
    else { $filtro = $a; }
}

$unidadesMeta = [];
$leccionesGlobal = [];
foreach ($curso['unidades'] as $u) {
    $unidadesMeta[$u['slug']] = $u;
    foreach ($u['lecciones'] as $l) {
        if (isset($leccionesGlobal[$l['slug']])) { err('curso.json', "slug de lección repetido: {$l['slug']}"); }
        $leccionesGlobal[$l['slug']] = $u['slug'];
    }
    foreach ($u['prerrequisitos'] as $p) {
        if (!isset($unidadesMeta[$p])) { err('curso.json', "{$u['slug']}: prerrequisito «{$p}» inexistente o posterior"); }
    }
}

$publicadas = 0;
if ($archivo === null) {
    foreach ($unidadesMeta as $slug => $meta) {
        if ($filtro !== null && $filtro !== $slug) { continue; }
        $ruta = "$datos/unidades/$slug.json";
        $u = leer($ruta);
        if ($u === null) { if ($filtro !== null) { err($slug, 'no existe el archivo de la unidad'); } continue; }
        unidad($meta, $u, $slug);
        $publicadas++;
    }
}

// Archivos complementarios
$complementarios = ['vocabulario', 'pronunciacion', 'lecturas', 'escucha', 'conversaciones', 'escritura', 'examenes', 'juegos'];
foreach ($complementarios as $nombre) {
    if ($filtro !== null && $archivo === null) { break; }
    if ($archivo !== null && $archivo !== $nombre) { continue; }
    $d = leer("$datos/$nombre.json");
    if ($d === null) { continue; }
    require_once __DIR__ . '/validar-complementos.php';
    ('validar_' . $nombre)($d, $curso);
}

foreach ($avisos as $a) { echo "AVISO  $a\n"; }
foreach ($errores as $e) { echo "ERROR  $e\n"; }
printf("\n%d unidades revisadas · %d ejercicios · %d errores · %d avisos\n",
    $publicadas, count($idsEjercicio), count($errores), count($avisos));
exit($errores === [] ? 0 : 1);
