<?php
/**
 * Academia de Redes · componentes de vista (funciones rd_*).
 *
 * Pintan los bloques de una lección tal como salen del JSON. El único
 * marcado admitido en los textos es **negrita** y `monoespaciado`, y se
 * aplica DESPUÉS de escapar: el contenido nunca se interpreta como HTML.
 * public/assets/js/redes/ui.js genera el mismo HTML para los ejercicios.
 */
declare(strict_types=1);

if (!function_exists('rd_md')) {

    function rd_md(?string $texto): string
    {
        $h = e((string) $texto);
        $h = preg_replace('/\*\*(.+?)\*\*/u', '<strong>$1</strong>', $h) ?? $h;
        $h = preg_replace('/`(.+?)`/u', '<code class="rd-c">$1</code>', $h) ?? $h;
        return $h;
    }

    /** Párrafos: una línea en blanco separa párrafos. */
    function rd_parrafos(?string $texto): string
    {
        $html = '';
        foreach (preg_split('/\n{2,}/', trim((string) $texto)) ?: [] as $p) {
            if (trim($p) !== '') {
                $html .= '<p>' . rd_md(trim($p)) . '</p>';
            }
        }
        return $html;
    }

    /** Configuración de la página como JSON que el navegador no ejecuta. */
    function rd_config(array $datos): string
    {
        $json = json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
        return '<script type="application/json" data-redes-config>' . ($json ?: '{}') . '</script>';
    }

    /** @param array<string,?string> $migas texto => url (null = página actual) */
    function rd_cabecera(string $titulo, string $bajada, array $migas, string $ante = '', string $extra = ''): string
    {
        $html = '<header class="rd-cabecera"><div class="container"><nav aria-label="Ruta de navegación"><ol class="rd-migas">';
        foreach ($migas as $texto => $u) {
            $html .= $u === null
                ? '<li><span aria-current="page">' . e($texto) . '</span></li>'
                : '<li><a href="' . e($u) . '">' . e($texto) . '</a></li>';
        }
        $html .= '</ol></nav>';
        if ($ante !== '') {
            $html .= '<p class="rd-ante">' . e($ante) . '</p>';
        }
        $html .= '<h1 class="rd-cabecera__titulo">' . rd_md($titulo) . '</h1>';
        if ($bajada !== '') {
            $html .= '<p class="rd-cabecera__bajada">' . rd_md($bajada) . '</p>';
        }
        return $html . $extra . '</div></header>';
    }

    /** Navegación secundaria de un módulo. */
    function rd_subnav(array $modulo, string $activa): string
    {
        $base = 'redes/' . $modulo['slug'];
        $enlaces = ['' => 'Lecciones', 'practica' => 'Práctica', 'examen' => 'Examen'];
        if (!empty($modulo['herramientas'])) {
            $enlaces['herramientas'] = 'Herramientas';
        }
        $html = '<nav class="rd-subnav" aria-label="Secciones de ' . e($modulo['titulo']) . '"><div class="container"><ul>';
        foreach ($enlaces as $ruta => $texto) {
            $html .= '<li><a href="' . e(url($ruta === '' ? $base : $base . '/' . $ruta)) . '"'
                . ($activa === $ruta ? ' aria-current="page"' : '') . '>' . e($texto) . '</a></li>';
        }
        return $html . '</ul></div></nav>';
    }

    /**
     * Regla de bits: cada fila es una dirección de 32 bits con la frontera
     * red | subred | host marcada. $filas = [['et','ip','p','p0'?], …]
     */
    function rd_bits(array $filas, string $pie = ''): string
    {
        $html = '<figure class="rd-bits">';
        $haySub = false;
        foreach ($filas as $f) {
            $oct = array_map('intval', explode('.', (string) $f['ip']));
            $p = (int) $f['p'];
            $p0 = isset($f['p0']) ? (int) $f['p0'] : $p;
            $haySub = $haySub || $p0 < $p;
            $html .= '<div class="rd-bits__fila"><span class="rd-bits__et">' . e($f['et'] ?? '') . '</span><span class="rd-bits__dir">';
            foreach ($oct as $i => $o) {
                $html .= '<span class="rd-bits__oct"><span class="rd-bits__celdas" aria-hidden="true">';
                foreach (str_split(str_pad(decbin($o), 8, '0', STR_PAD_LEFT)) as $j => $bit) {
                    $n = $i * 8 + $j;
                    $zona = $n < $p0 ? 'red' : ($n < $p ? 'sub' : 'host');
                    $html .= '<span class="rd-bit rd-bit--' . $zona . ($n === $p - 1 && $p < 32 ? ' rd-bit--corte' : '') . '">' . $bit . '</span>';
                }
                $html .= '</span><span class="rd-bits__dec">' . $o . '</span></span>';
            }
            $html .= '</span></div>';
        }
        $ultimo = end($filas) ?: ['p' => 0];
        $p = (int) $ultimo['p'];
        $p0 = isset($ultimo['p0']) ? (int) $ultimo['p0'] : $p;
        $html .= '<figcaption class="rd-bits__ley"><span class="rd-ley rd-ley--red">red · ' . $p0 . ' bits</span>';
        if ($haySub) {
            $html .= '<span class="rd-ley rd-ley--sub">subred · ' . ($p - $p0) . ' bits</span>';
        }
        $html .= '<span class="rd-ley rd-ley--host">host · ' . (32 - $p) . ' bits</span>';
        if ($pie !== '') {
            $html .= '<span class="rd-bits__pie">' . rd_md($pie) . '</span>';
        }
        return $html . '</figcaption></figure>';
    }

    function rd_tabla(array $t): string
    {
        $html = '<div class="rd-tabla-caja"><table class="rd-tabla"><thead><tr>';
        foreach ($t['cab'] ?? [] as $c) {
            $html .= '<th scope="col">' . rd_md((string) $c) . '</th>';
        }
        $html .= '</tr></thead><tbody>';
        foreach ($t['filas'] ?? [] as $fila) {
            $html .= '<tr>';
            foreach ($fila as $i => $celda) {
                $html .= ($i === 0 ? '<th scope="row">' : '<td>') . rd_md((string) $celda) . ($i === 0 ? '</th>' : '</td>');
            }
            $html .= '</tr>';
        }
        $html .= '</tbody></table></div>';
        if (!empty($t['pie'])) {
            $html .= '<p class="rd-tabla-pie">' . rd_md((string) $t['pie']) . '</p>';
        }
        return $html;
    }

    /** Pasos numerados de una solución. */
    function rd_pasos(array $pasos): string
    {
        $html = '<ol class="rd-pasos">';
        foreach ($pasos as $paso) {
            $html .= '<li><p>' . rd_md((string) ($paso['t'] ?? '')) . '</p>';
            if (!empty($paso['bits'])) {
                $html .= rd_bits($paso['bits']);
            }
            if (!empty($paso['tabla'])) {
                $html .= rd_tabla($paso['tabla']);
            }
            $html .= '</li>';
        }
        return $html . '</ol>';
    }

    define('RD_NIVELES', ['facil' => 'Fácil', 'medio' => 'Medio', 'dificil' => 'Difícil', 'experto' => 'Experto']);
    define('RD_NOTAS', ['clave' => 'Idea clave', 'aviso' => 'Cuidado', 'truco' => 'Atajo', 'error' => 'Error frecuente']);

    /**
     * Un bloque de lección. $contador lleva la numeración de los ejercicios
     * de la página, que es también su índice en la configuración de JS.
     */
    function rd_bloque(array $b, int &$contador): string
    {
        switch ($b['t'] ?? '') {
            case 'h':
                return '<h2 class="rd-h2" id="' . e($b['id'] ?? '') . '">' . rd_md($b['texto']) . '</h2>';
            case 'h3':
                return '<h3 class="rd-h3">' . rd_md($b['texto']) . '</h3>';
            case 'p':
                return '<div class="rd-prosa">' . rd_parrafos($b['texto']) . '</div>';
            case 'lista':
                $et = !empty($b['orden']) ? 'ol' : 'ul';
                $html = '<' . $et . ' class="rd-lista">';
                foreach ($b['items'] as $item) {
                    $html .= '<li>' . rd_md((string) $item) . '</li>';
                }
                return $html . '</' . $et . '>';
            case 'tabla':
                return rd_tabla($b);
            case 'codigo':
                return '<figure class="rd-codigo">' . (!empty($b['titulo']) ? '<figcaption>' . e($b['titulo']) . '</figcaption>' : '')
                    . '<pre tabindex="0"><code>' . e($b['texto']) . '</code></pre></figure>';
            case 'bits':
                return rd_bits($b['filas'], (string) ($b['pie'] ?? ''));
            case 'nota':
                $tono = isset(RD_NOTAS[$b['tono'] ?? '']) ? $b['tono'] : 'clave';
                return '<aside class="rd-nota rd-nota--' . $tono . '"><p class="rd-nota__et">' . e($b['titulo'] ?? RD_NOTAS[$tono]) . '</p>'
                    . rd_parrafos($b['texto']) . '</aside>';
            case 'formula':
                $html = '<figure class="rd-formula"><p class="rd-formula__expr">' . rd_md($b['expr']) . '</p>';
                if (!empty($b['leyenda'])) {
                    $html .= '<dl class="rd-formula__ley">';
                    foreach ($b['leyenda'] as [$simbolo, $significado]) {
                        $html .= '<div><dt>' . rd_md($simbolo) . '</dt><dd>' . rd_md($significado) . '</dd></div>';
                    }
                    $html .= '</dl>';
                }
                if (!empty($b['texto'])) {
                    $html .= '<figcaption>' . rd_md($b['texto']) . '</figcaption>';
                }
                return $html . '</figure>';
            case 'ejemplo':
                $nivel = isset(RD_NIVELES[$b['nivel'] ?? '']) ? $b['nivel'] : 'facil';
                $html = '<section class="rd-ejemplo rd-ejemplo--' . $nivel . '"><header class="rd-ejemplo__cab">'
                    . '<span class="rd-ejemplo__et">Ejemplo resuelto</span><span class="rd-nivel rd-nivel--' . $nivel . '">' . RD_NIVELES[$nivel] . '</span>'
                    . '<h3 class="rd-ejemplo__titulo">' . rd_md($b['titulo']) . '</h3></header>'
                    . '<div class="rd-ejemplo__enunciado">' . rd_parrafos($b['enunciado']) . '</div>';
                if (!empty($b['tabla'])) {
                    $html .= rd_tabla($b['tabla']);
                }
                $html .= rd_pasos($b['pasos'] ?? []);
                if (!empty($b['respuesta'])) {
                    $html .= '<dl class="rd-respuesta">';
                    foreach ($b['respuesta'] as [$etiqueta, $valor]) {
                        $html .= '<div><dt>' . e($etiqueta) . '</dt><dd>' . e($valor) . '</dd></div>';
                    }
                    $html .= '</dl>';
                }
                if (!empty($b['cierre'])) {
                    $html .= '<p class="rd-ejemplo__cierre">' . rd_md($b['cierre']) . '</p>';
                }
                return $html . '</section>';
            case 'ejercicios':
                $html = '<section class="rd-ejercicios"><h2 class="rd-h2">' . rd_md($b['titulo'] ?? 'Practica') . '</h2>';
                if (!empty($b['texto'])) {
                    $html .= '<p class="rd-bajada">' . rd_md($b['texto']) . '</p>';
                }
                foreach ($b['items'] as $_) {
                    $html .= '<article class="rd-ej" data-ej="' . $contador . '"><p class="rd-ej__espera">Ejercicio ' . ($contador + 1)
                        . ' · se carga con JavaScript.</p></article>';
                    $contador++;
                }
                return $html . '</section>';
            default:
                return '';
        }
    }
}
