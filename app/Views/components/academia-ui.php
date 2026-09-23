<?php
/**
 * Piezas de interfaz compartidas por la Academia de Comandos.
 *
 * Igual que blocks.php en los tutoriales: evita repetir el mismo marcado
 * en once vistas. El HTML que se pasa a estas funciones es de autor (sale
 * de los JSON del propio módulo); lo que pudiera venir de la URL o del
 * usuario se escapa siempre con e().
 *
 * Reutiliza blocks.php (note, term, reveal…) para no duplicar componentes
 * que ya existen en los tutoriales.
 */
require_once \App\Core\Config::basePath('app/Views/components/blocks.php');

if (!function_exists('ac_config')) {
    /**
     * Configuración que lee academia.js. Va en un <script type="application/json">
     * porque así el navegador NO lo ejecuta: solo lo lee JSON.parse.
     * JSON_HEX_* evita que una cadena con </script> rompa la página.
     */
    function ac_config(array $datos): string
    {
        $json = json_encode(
            $datos,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
        );
        return '<script type="application/json" data-academia-config>' . ($json ?: '{}') . '</script>';
    }
}

if (!function_exists('ac_cabecera')) {
    /** Cabecera de página del módulo, con migas y acciones opcionales. */
    function ac_cabecera(string $titulo, string $bajada, array $migas = [], string $acciones = ''): string
    {
        $html = '<header class="ac-cabecera"><div class="container">';
        if ($migas !== []) {
            $html .= '<nav aria-label="Ruta de navegación"><ol class="ac-migas">';
            foreach ($migas as $texto => $url) {
                $html .= $url === null
                    ? '<li><span aria-current="page">' . e($texto) . '</span></li>'
                    : '<li><a href="' . e($url) . '">' . e($texto) . '</a></li>';
            }
            $html .= '</ol></nav>';
        }
        $html .= '<h1 class="ac-cabecera__titulo">' . e($titulo) . '</h1>';
        if ($bajada !== '') {
            $html .= '<p class="ac-cabecera__bajada">' . e($bajada) . '</p>';
        }
        if ($acciones !== '') {
            $html .= '<div class="ac-cabecera__acciones">' . $acciones . '</div>';
        }
        return $html . '</div></header>';
    }
}

if (!function_exists('ac_panel_progreso')) {
    /** Tarjetas de progreso; los números los rellena JavaScript. */
    function ac_panel_progreso(bool $conAcciones = true): string
    {
        $datos = [
            ['xp', 'XP', 'Experiencia acumulada'],
            ['nivel', 'Nivel', 'Sube al practicar'],
            ['aprendidos', 'Comandos', 'Dominados (3 aciertos seguidos)'],
            ['misiones', 'Misiones', 'Completadas'],
            ['niveles', 'Niveles', 'De videojuego superados'],
            ['repasos', 'Repasos', 'Pendientes para hoy'],
        ];
        $html = '<section class="ac-progreso" aria-label="Tu progreso">'
              . '<div class="ac-progreso__nivel">'
              . '<p class="ac-progreso__nivel-texto" data-nivel-texto>Nivel 1 · 0 XP</p>'
              . '<div class="ac-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Progreso hacia el siguiente nivel">'
              . '<span class="ac-barra__relleno" data-barra-nivel style="width:0%"></span></div></div>'
              . '<ul class="ac-progreso__rejilla">';
        foreach ($datos as [$clave, $titulo, $pie]) {
            $html .= '<li class="ac-progreso__dato"><b data-progreso="' . e($clave) . '">0</b>'
                   . '<span>' . e($titulo) . '</span><small>' . e($pie) . '</small></li>';
        }
        $html .= '</ul>';
        if ($conAcciones) {
            $html .= '<div class="ac-progreso__acciones">'
                   . '<button type="button" class="ac-btn ac-btn--fino" data-exportar-progreso>Exportar progreso</button>'
                   . '<label class="ac-btn ac-btn--fino ac-btn--archivo">Importar progreso'
                   . '<input type="file" accept="application/json,.json" data-importar-progreso hidden></label>'
                   . '<button type="button" class="ac-btn ac-btn--fino ac-btn--peligro" data-borrar-progreso>Borrar</button>'
                   . '</div>'
                   . '<p class="ac-progreso__nota">El progreso se guarda en este navegador. Expórtalo si cambias de equipo.</p>';
        }
        return $html . '</section>';
    }
}

if (!function_exists('ac_tarjeta_comando')) {
    /** Tarjeta de un comando dentro de la ruta de aprendizaje. */
    function ac_tarjeta_comando(string $os, array $comando): string
    {
        $slug = (string) ($comando['slug'] ?? '');
        $concepto = ($comando['tipo'] ?? '') === 'concepto';
        $simulado = !$concepto && !empty($comando['simulado']);
        return '<li class="ac-comando" data-comando-id="' . e($os . ':' . $slug) . '">'
             . '<a class="ac-comando__enlace" href="' . e(url('academia/' . $os . '/comando/' . $slug)) . '">'
             . '<span class="ac-comando__nombre">' . e($comando['nombre'] ?? $slug) . '</span>'
             . '<span class="ac-comando__resumen">' . e($comando['resumen'] ?? '') . '</span>'
             . '<span class="ac-comando__pie">'
             . '<span class="ac-chip ac-chip--' . e($comando['dificultad'] ?? 'basico') . '">' . e(ucfirst((string) ($comando['dificultad'] ?? 'básico'))) . '</span>'
             . ($concepto
                 ? '<span class="ac-chip ac-chip--concepto" title="Explica una técnica del shell, no un comando suelto">Concepto</span>'
                 : ($simulado
                     ? '<span class="ac-chip ac-chip--sim" title="Se puede ejecutar en la terminal simulada">Practicable</span>'
                     : '<span class="ac-chip ac-chip--nosim" title="Se explica, pero el simulador todavía no lo ejecuta">Solo ficha</span>'))
             . '</span></a></li>';
    }
}

if (!function_exists('ac_selector_sistemas')) {
    /** Las tres modalidades, con sus cifras reales. */
    function ac_selector_sistemas(array $sistemas, ?string $activo = null): string
    {
        $html = '<ul class="ac-sistemas">';
        foreach ($sistemas as $s) {
            $slug = (string) ($s['slug'] ?? '');
            $html .= '<li class="ac-sistema' . ($activo === $slug ? ' es-activo' : '') . '">'
                   . '<a href="' . e(url('academia/' . $slug)) . '">'
                   . '<span class="ac-sistema__prompt">' . e($s['prompt'] ?? '$') . '</span>'
                   . '<h3 class="ac-sistema__nombre">' . e($s['nombre'] ?? $slug) . '</h3>'
                   . '<p class="ac-sistema__resumen">' . e($s['resumen'] ?? '') . '</p>'
                   . '<p class="ac-sistema__cifras">'
                   . '<b>' . (int) ($s['total_comandos'] ?? 0) . '</b> comandos · '
                   . '<b>' . (int) ($s['total_misiones'] ?? 0) . '</b> misiones</p>'
                   . '</a></li>';
        }
        return $html . '</ul>';
    }
}

if (!function_exists('ac_bloque')) {
    /** Bloque con título y contenido HTML de autor. */
    function ac_bloque(string $titulo, string $html, string $clase = ''): string
    {
        return '<section class="ac-bloque ' . e($clase) . '">'
             . '<h2 class="ac-bloque__titulo">' . e($titulo) . '</h2>'
             . $html . '</section>';
    }
}

if (!function_exists('ac_terminal_zona')) {
    /** Contenedor de terminal + árbol que monta academia.js. */
    function ac_terminal_zona(string $atributo, bool $conArbol = true, string $extra = ''): string
    {
        return '<div class="ac-zona-terminal" ' . $atributo . '>'
             . $extra
             . '<div class="ac-zona-terminal__term" data-terminal></div>'
             . ($conArbol ? '<aside class="ac-zona-terminal__arbol" data-arbol aria-label="Árbol del escenario"></aside>' : '')
             . '</div>';
    }
}
