<?php
/**
 * Validación de los archivos complementarios (vocabulario, pronunciación,
 * lecturas, escucha, conversaciones, escritura, exámenes y juegos).
 * Lo incluye validar.php; reutiliza sus funciones err(), req(), ejercicio()…
 */
declare(strict_types=1);

const TIPOS_PALABRA = ['sustantivo', 'verbo', 'adjetivo', 'adverbio', 'preposicion', 'pronombre',
                       'expresion', 'numero', 'determinante', 'conjuncion', 'interjeccion'];

function unidadesDe(array $curso): array
{
    return array_map(static fn ($u) => $u['slug'], $curso['unidades']);
}

function validar_vocabulario(array $d, array $curso): void
{
    $temas = [];
    foreach ((array) ($d['temas'] ?? []) as $t) {
        req((array) $t, ['slug', 'nombre', 'icono', 'descripcion'], 'vocabulario tema');
        $temas[$t['slug'] ?? ''] = 0;
    }
    foreach ($curso['unidades'] as $u) {
        foreach ($u['temas_vocabulario'] as $t) {
            if (!isset($temas[$t])) { err('vocabulario', "la unidad {$u['slug']} pide el tema «{$t}», que no existe"); }
        }
    }
    $ids = [];
    $parejas = [];
    foreach ((array) ($d['palabras'] ?? []) as $i => $p) {
        $donde = 'vocabulario ' . ($p['id'] ?? "#$i");
        req((array) $p, ['id', 'en', 'es', 'tipo', 'tema', 'ipa', 'ejemplo'], $donde);
        if (isset($ids[$p['id'] ?? ''])) { err($donde, 'id repetido'); }
        $ids[$p['id'] ?? ''] = true;
        if (!preg_match('/^[a-z0-9-]+\.[a-z0-9-]+$/', (string) ($p['id'] ?? ''))) { err($donde, 'id debe ser tema.palabra'); }
        if (!isset($temas[$p['tema'] ?? ''])) { err($donde, 'tema inexistente'); } else { $temas[$p['tema']]++; }
        if (!str_starts_with((string) ($p['id'] ?? ''), ($p['tema'] ?? '') . '.')) { err($donde, 'el id debe empezar por su tema'); }
        if (!in_array($p['tipo'] ?? '', TIPOS_PALABRA, true)) { err($donde, 'tipo no válido'); }
        if (!texto($p['ejemplo']['en'] ?? null) || !texto($p['ejemplo']['es'] ?? null)) { err($donde, 'ejemplo incompleto'); }
        $ipa = (string) ($p['ipa'] ?? '');
        if (!preg_match('#^/.+/$#u', $ipa)) { err($donde, 'ipa debe ir entre barras /…/'); }
        $clave = mb_strtolower((string) ($p['en'] ?? '')) . '|' . ($p['tema'] ?? '');
        if (isset($parejas[$clave])) { err($donde, 'palabra repetida en el mismo tema'); }
        $parejas[$clave] = true;
    }
    foreach ($temas as $t => $n) {
        if ($n < 12) { err('vocabulario', "el tema «{$t}» tiene solo {$n} palabras (mínimo 12)"); }
    }
}

function validar_pronunciacion(array $d, array $curso): void
{
    req($d, ['introduccion', 'afi', 'secciones'], 'pronunciacion');
    foreach ((array) ($d['secciones'] ?? []) as $s) {
        $donde = 'pronunciacion ' . ($s['slug'] ?? '?');
        req((array) $s, ['slug', 'titulo', 'resumen', 'explicacion', 'practica'], $donde);
        foreach ((array) ($s['sonidos'] ?? []) as $x) { req((array) $x, ['simbolo', 'nombre', 'ejemplos', 'como', 'espanol'], "$donde sonido"); }
        foreach ((array) ($s['pares_minimos'] ?? []) as $x) { req((array) $x, ['a', 'ipa_a', 'es_a', 'b', 'ipa_b', 'es_b'], "$donde par mínimo"); }
        if (count((array) ($s['practica'] ?? [])) < 3) { err($donde, 'la práctica necesita al menos 3 ejercicios'); }
        foreach ((array) ($s['practica'] ?? []) as $e) {
            ejercicio((array) $e, $donde);
            if (!str_starts_with((string) ($e['id'] ?? ''), 'pron.')) { err($donde, 'id de práctica debe empezar por pron.'); }
        }
    }
}

function validar_lecturas(array $d, array $curso): void
{
    $unidades = unidadesDe($curso);
    foreach ((array) ($d['lecturas'] ?? []) as $l) {
        $donde = 'lectura ' . ($l['slug'] ?? '?');
        req((array) $l, ['slug', 'titulo', 'nivel', 'unidad', 'resumen', 'antes_de_leer', 'parrafos', 'vocabulario', 'gramatica', 'preguntas'], $donde);
        if (!in_array($l['unidad'] ?? '', $unidades, true)) { err($donde, 'unidad relacionada inexistente'); }
        foreach ((array) ($l['parrafos'] ?? []) as $p) { if (!texto($p['en'] ?? null) || !texto($p['es'] ?? null)) { err($donde, 'párrafo incompleto'); } }
        if (count((array) ($l['preguntas'] ?? [])) < 5) { err($donde, 'necesita al menos 5 preguntas'); }
        foreach ((array) ($l['preguntas'] ?? []) as $e) {
            ejercicio((array) $e, $donde);
            if (!str_starts_with((string) ($e['id'] ?? ''), 'lectura.' . ($l['slug'] ?? '') . '.')) { err($donde, 'id de pregunta debe empezar por lectura.<slug>.'); }
        }
    }
}

function validar_escucha(array $d, array $curso): void
{
    $unidades = unidadesDe($curso);
    foreach ((array) ($d['audios'] ?? []) as $a) {
        $donde = 'escucha ' . ($a['slug'] ?? '?');
        req((array) $a, ['slug', 'titulo', 'nivel', 'unidad', 'contexto', 'hablantes', 'lineas', 'vocabulario', 'preguntas'], $donde);
        if (!in_array($a['unidad'] ?? '', $unidades, true)) { err($donde, 'unidad relacionada inexistente'); }
        $nombres = array_map(static fn ($h) => $h['nombre'] ?? '', (array) ($a['hablantes'] ?? []));
        foreach ((array) ($a['lineas'] ?? []) as $l) {
            linea($l, $donde);
            if (!in_array($l['quien'] ?? '', $nombres, true)) { err($donde, 'línea de un hablante no declarado: ' . ($l['quien'] ?? '')); }
        }
        if (count((array) ($a['preguntas'] ?? [])) < 4) { err($donde, 'necesita al menos 4 preguntas'); }
        foreach ((array) ($a['preguntas'] ?? []) as $e) {
            ejercicio((array) $e, $donde);
            if (!str_starts_with((string) ($e['id'] ?? ''), 'escucha.' . ($a['slug'] ?? '') . '.')) { err($donde, 'id debe empezar por escucha.<slug>.'); }
        }
    }
}

function validar_conversaciones(array $d, array $curso): void
{
    $unidades = unidadesDe($curso);
    foreach ((array) ($d['escenarios'] ?? []) as $s) {
        $donde = 'conversación ' . ($s['slug'] ?? '?');
        req((array) $s, ['slug', 'titulo', 'nivel', 'unidad', 'contexto', 'personaje', 'tu_papel', 'inicio', 'nodos'], $donde);
        if (!in_array($s['unidad'] ?? '', $unidades, true)) { err($donde, 'unidad relacionada inexistente'); }
        $ids = [];
        foreach ((array) ($s['nodos'] ?? []) as $n) { $ids[$n['id'] ?? ''] = $n; }
        if (!isset($ids[$s['inicio'] ?? ''])) { err($donde, 'el nodo de inicio no existe'); }
        $finales = 0;
        foreach ($ids as $id => $n) {
            marcadoProfundo($n, "$donde nodo $id");
            if (!empty($n['fin'])) { $finales++; if (!texto($n['resumen'] ?? null)) { err("$donde nodo $id", 'el final necesita resumen'); } continue; }
            req((array) $n, ['quien', 'en', 'es', 'significa', 'estructura', 'respuestas'], "$donde nodo $id");
            opciones($n['respuestas'] ?? null, "$donde nodo $id");
            foreach ((array) ($n['respuestas'] ?? []) as $r) {
                if (!empty($r['correcta']) && !isset($ids[$r['siguiente'] ?? ''])) { err("$donde nodo $id", 'respuesta correcta sin siguiente válido'); }
            }
            if (isset($n['escribir']) && !isset($ids[$n['escribir']['siguiente'] ?? ''])) { err("$donde nodo $id", 'escribir.siguiente no existe'); }
        }
        if ($finales < 1) { err($donde, 'no tiene nodo final'); }
        // Todos los nodos alcanzables desde el inicio.
        $vistos = []; $pila = [$s['inicio'] ?? ''];
        while ($pila) {
            $x = array_pop($pila);
            if (isset($vistos[$x]) || !isset($ids[$x])) { continue; }
            $vistos[$x] = true;
            foreach ((array) ($ids[$x]['respuestas'] ?? []) as $r) { if (!empty($r['siguiente'])) { $pila[] = $r['siguiente']; } }
            if (!empty($ids[$x]['escribir']['siguiente'])) { $pila[] = $ids[$x]['escribir']['siguiente']; }
        }
        foreach (array_keys($ids) as $id) { if (!isset($vistos[$id])) { err($donde, "nodo inalcanzable: $id"); } }
    }
}

function validar_escritura(array $d, array $curso): void
{
    $unidades = unidadesDe($curso);
    foreach ((array) ($d['tareas'] ?? []) as $t) {
        $donde = 'escritura ' . ($t['slug'] ?? '?');
        req((array) $t, ['slug', 'titulo', 'nivel', 'unidad'], $donde);
        if (!in_array($t['unidad'] ?? '', $unidades, true)) { err($donde, 'unidad relacionada inexistente'); }
        escritura((array) $t, $donde);
    }
}

function validar_examenes(array $d, array $curso): void
{
    global $idsEjercicio;
    $bloques = [];
    foreach ($curso['bloques'] as $b) { $bloques[$b['slug']] = $b; }
    $ordenUnidad = [];
    foreach ($curso['unidades'] as $u) { $ordenUnidad[$u['slug']] = $u['bloque']; }
    $ordenBloque = array_flip(array_keys($bloques));
    foreach ((array) ($d['examenes'] ?? []) as $x) {
        $donde = 'examen ' . ($x['slug'] ?? '?');
        req((array) $x, ['slug', 'bloque', 'titulo', 'aprobado', 'preguntas'], $donde);
        $b = $bloques[$x['bloque'] ?? ''] ?? null;
        if ($b === null) { err($donde, 'bloque inexistente'); continue; }
        if (($b['examen'] ?? '') !== ($x['slug'] ?? '')) { err($donde, 'el slug no coincide con curso.json'); }
        $preg = (array) ($x['preguntas'] ?? []);
        if (count($preg) < 20 || count($preg) > 30) { err($donde, 'debe tener entre 20 y 30 preguntas'); }
        $cubiertas = []; $anteriores = 0;
        foreach ($preg as $q) {
            ejercicio((array) $q, $donde, true);
            if (!str_starts_with((string) ($q['id'] ?? ''), ($x['slug'] ?? '') . '.')) { err($donde, 'id debe empezar por el slug del examen'); }
            $u = (string) ($q['unidad'] ?? '');
            if (!isset($ordenUnidad[$u])) { err($donde, "pregunta con unidad desconocida «{$u}»"); continue; }
            if ($ordenUnidad[$u] === $x['bloque']) { $cubiertas[$u] = true; }
            elseif ($ordenBloque[$ordenUnidad[$u]] < $ordenBloque[$x['bloque']]) { $anteriores++; }
            else { err($donde, "pregunta de un bloque POSTERIOR ({$u})"); }
            if (!in_array($q['habilidad'] ?? '', HABILIDADES, true)) { err($donde, 'habilidad no válida en ' . ($q['id'] ?? '')); }
        }
        foreach ($b['unidades'] as $u) { if (!isset($cubiertas[$u])) { err($donde, "no evalúa la unidad «{$u}»"); } }
        if ($b['numero'] > 1 && count($preg) > 0) {
            $pct = $anteriores / count($preg);
            if ($pct < 0.15 || $pct > 0.25) { aviso($donde, sprintf('%.0f %% de preguntas de bloques anteriores (objetivo 15–25 %%)', $pct * 100)); }
        }
    }
}

function validar_juegos(array $d, array $curso): void
{
    $esperados = ['ordena-la-oracion', 'encuentra-el-error', 'escucha-y-selecciona', 'memoria-de-vocabulario',
                  'completa-el-dialogo', 'detective-gramatical', 'construye-la-pregunta', 'viaje-interactivo',
                  'desafio-de-tiempos', 'mision-final'];
    $hay = [];
    foreach ((array) ($d['juegos'] ?? []) as $j) {
        $donde = 'juego ' . ($j['slug'] ?? '?');
        req((array) $j, ['slug', 'numero', 'nombre', 'resumen', 'mecanica', 'controles', 'aprende', 'niveles'], $donde);
        $hay[] = $j['slug'] ?? '';
        $niveles = (array) ($j['niveles'] ?? []);
        if (count($niveles) < 3) { err($donde, 'necesita al menos 3 niveles'); }
        foreach ($niveles as $n) {
            req((array) $n, ['id', 'nombre', 'dificultad', 'objetivo'], "$donde nivel " . ($n['id'] ?? '?'));
            marcadoProfundo($n, "$donde nivel");
            require_once __DIR__ . '/validar-juegos.php';
            validar_nivel_juego((string) ($j['slug'] ?? ''), (array) $n, "$donde nivel " . ($n['id'] ?? '?'));
        }
    }
    foreach ($esperados as $e) { if (!in_array($e, $hay, true)) { err('juegos', "falta el juego «{$e}»"); } }
}
