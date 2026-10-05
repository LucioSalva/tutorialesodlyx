<?php
/**
 * Academia de Inglés · componentes de vista (prefijo in_).
 *
 * Todo el texto llega de los JSON del curso y se ESCAPA siempre con e();
 * el único marcado que se reconoce es el mínimo documentado en
 * docs/INGLES_CONTENIDO.md §1 (**negrita**, [[inglés]], {{rol:texto}}),
 * que se aplica DESPUÉS de escapar, así que no puede inyectar HTML.
 *
 * Lo visual que se repite en todo el curso —la «tira de oración» con el
 * color de cada función gramatical— vive aquí para que sea idéntico en
 * fórmulas, ejemplos, diagramas y ejercicios.
 */

const IN_ROLES = [
    'sujeto'        => 'Sujeto',
    'verbo'         => 'Verbo',
    'auxiliar'      => 'Auxiliar',
    'negacion'      => 'Negación',
    'complemento'   => 'Complemento',
    'interrogativo' => 'Interrogativo',
    'tiempo'        => 'Tiempo',
    'otro'          => '',
];

const IN_TIPOS = [
    'opcion'        => 'Elige',
    'completar'     => 'Completa',
    'ordenar'       => 'Ordena',
    'relacionar'    => 'Relaciona',
    'traducir'      => 'Traduce',
    'transformar'   => 'Transforma',
    'corregir'      => 'Corrige el error',
    'dictado'       => 'Dictado',
    'conversacion'  => 'Conversación',
    'escritura'     => 'Escritura',
    'pronunciacion' => 'Pronunciación',
];

const IN_HABILIDADES = [
    'gramatica'      => 'Gramática',
    'vocabulario'    => 'Vocabulario',
    'comprension'    => 'Comprensión',
    'interpretacion' => 'Interpretación',
    'produccion'     => 'Producción',
];

if (!function_exists('in_md')) {
    /** Texto de autor → HTML seguro con el marcado mínimo del curso. */
    function in_md(?string $texto): string
    {
        $h = e((string) $texto);
        $h = preg_replace('/\*\*(.+?)\*\*/u', '<strong>$1</strong>', $h) ?? $h;
        $h = preg_replace('/\[\[(.+?)\]\]/u', '<span class="in-en" lang="en">$1</span>', $h) ?? $h;
        $h = preg_replace_callback(
            '/\{\{(' . implode('|', array_keys(IN_ROLES)) . '):(.+?)\}\}/u',
            static fn (array $m): string => '<span class="in-rol in-rol--' . $m[1] . '" lang="en">' . $m[2] . '</span>',
            $h
        ) ?? $h;
        return $h;
    }

    /** Párrafos: un salto de línea doble separa párrafos. */
    function in_parrafos(?string $texto, string $clase = ''): string
    {
        $html = '';
        foreach (preg_split('/\n{2,}/', trim((string) $texto)) ?: [] as $p) {
            if (trim($p) !== '') {
                $html .= '<p' . ($clase !== '' ? ' class="' . e($clase) . '"' : '') . '>' . nl2br(in_md($p), false) . '</p>';
            }
        }
        return $html;
    }

    /** Configuración para ingles.js, en JSON no ejecutable. */
    function in_config(array $datos): string
    {
        $json = json_encode(
            $datos,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
        );
        return '<script type="application/json" data-ingles-config>' . ($json ?: '{}') . '</script>';
    }

    /** Icono de altavoz (SVG en línea, hereda currentColor). */
    function in_icono(string $nombre): string
    {
        $trazos = [
            'oir'      => '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>',
            'lento'    => '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 12h4"/>',
            'mic'      => '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
            'pista'    => '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
            'ok'       => '<path d="m5 12 5 5 9-10"/>',
            'mal'      => '<path d="M6 6l12 12M18 6 6 18"/>',
            'flecha'   => '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
            'libro'    => '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22z"/>',
        ];
        return '<svg class="in-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
             . ($trazos[$nombre] ?? '') . '</svg>';
    }

    /**
     * Botones de escuchar (normal y lento). El navegador pide el MP3
     * pregenerado de esa frase (assets/ingles/audio/…) en el acento elegido;
     * $rol elige la voz (n, f, m, m2: ver audio/voces.json).
     */
    function in_oir(string $texto, bool $conLento = true, string $rol = 'n'): string
    {
        // Sin botón para textos vacíos o en español: el audio del curso es inglés.
        if (trim($texto) === '' || in_es_espanol($texto)) {
            return '';
        }
        $v = $rol !== 'n' && preg_match('/^(n|f|m|m2)$/', $rol) ? ' data-rol="' . $rol . '"' : '';
        $html = '<span class="in-oir-grupo">'
              . '<button type="button" class="in-oir" data-decir="' . e($texto) . '"' . $v . ' aria-label="' . e('Escuchar: ' . $texto) . '" title="Escuchar">' . in_icono('oir') . '</button>';
        if ($conLento) {
            $html .= '<button type="button" class="in-oir in-oir--lento" data-decir="' . e($texto) . '" data-lento' . $v . ' aria-label="' . e('Escuchar despacio: ' . $texto) . '" title="Escuchar despacio">' . in_icono('lento') . '<span>lento</span></button>';
        }
        return $html . '</span>';
    }

    /**
     * La tira de oración: cada pieza con el color y la etiqueta de su función.
     * @param list<array{t:string, rol:string}> $partes
     */
    function in_tira(array $partes, bool $etiquetas = true, string $clase = ''): string
    {
        $html = '<span class="in-tira' . ($clase !== '' ? ' ' . e($clase) : '') . '" lang="en">';
        foreach ($partes as $p) {
            $rol = array_key_exists($p['rol'] ?? '', IN_ROLES) ? $p['rol'] : 'otro';
            $html .= '<span class="in-pieza in-rol--' . $rol . '">'
                   . '<span class="in-pieza__t">' . e($p['t'] ?? '') . '</span>'
                   . ($etiquetas && IN_ROLES[$rol] !== '' ? '<span class="in-pieza__r" lang="es">' . IN_ROLES[$rol] . '</span>' : '')
                   . '</span>';
        }
        return $html . '</span>';
    }

    /** Fórmula visual + ejemplo alineado + traducción. */
    function in_estructura(array $s): string
    {
        $formula = '<div class="in-formula" aria-label="Fórmula">';
        foreach ((array) ($s['formula'] ?? []) as $i => $p) {
            $rol = array_key_exists($p['rol'] ?? '', IN_ROLES) ? $p['rol'] : 'otro';
            if ($i > 0) {
                $formula .= '<span class="in-formula__mas" aria-hidden="true">+</span>';
            }
            $formula .= '<span class="in-formula__caja in-rol--' . $rol . '">' . e($p['t'] ?? '') . '</span>';
        }
        $formula .= '</div>';
        $ejemploTexto = implode(' ', array_map(static fn ($p) => (string) ($p['t'] ?? ''), (array) ($s['ejemplo'] ?? [])));
        return '<figure class="in-estructura">'
             . (!empty($s['etiqueta']) ? '<figcaption class="in-estructura__etiqueta">' . e($s['etiqueta']) . '</figcaption>' : '')
             . $formula
             . '<div class="in-estructura__ejemplo">' . in_tira((array) ($s['ejemplo'] ?? [])) . in_oir($ejemploTexto) . '</div>'
             . (!empty($s['es']) ? '<p class="in-es">' . e($s['es']) . '</p>' : '')
             . '</figure>';
    }

    /** Ejemplo anotado. */
    function in_ejemplo(array $x): string
    {
        $en = (string) ($x['en'] ?? '');
        $frase = !empty($x['partes']) ? in_tira((array) $x['partes']) : '<span class="in-frase" lang="en">' . e($en) . '</span>';
        return '<li class="in-ejemplo">'
             . (!empty($x['situacion']) ? '<p class="in-ejemplo__situacion">' . in_md($x['situacion']) . '</p>' : '')
             . '<div class="in-ejemplo__frase">' . $frase . in_oir($en) . '</div>'
             . '<p class="in-es">' . e($x['es'] ?? '') . '</p>'
             . (!empty($x['nota']) ? '<p class="in-ejemplo__nota"><b>Por qué:</b> ' . in_md($x['nota']) . '</p>' : '')
             . '</li>';
    }

    function in_tabla(array $t): string
    {
        $audio = array_map('intval', (array) ($t['audio'] ?? []));
        $html = '<div class="in-tabla">';
        if (!empty($t['titulo'])) {
            $html .= '<p class="in-tabla__titulo">' . in_md($t['titulo']) . '</p>';
        }
        $html .= '<table><thead><tr>';
        foreach ((array) ($t['columnas'] ?? []) as $c) {
            $html .= '<th scope="col">' . in_md($c) . '</th>';
        }
        $html .= '</tr></thead><tbody>';
        foreach ((array) ($t['filas'] ?? []) as $fila) {
            $html .= '<tr>';
            foreach (array_values((array) $fila) as $i => $celda) {
                $celda = (string) $celda;
                $html .= \in_array($i, $audio, true)
                    ? '<td class="in-tabla__en"><span lang="en">' . e($celda) . '</span>' . in_oir($celda, false) . '</td>'
                    : '<td>' . in_md($celda) . '</td>';
            }
            $html .= '</tr>';
        }
        return $html . '</tbody></table></div>';
    }

    function in_comparacion(array $c): string
    {
        $col = static function (array $x, string $lado): string {
            $h = '<div class="in-comparacion__col in-comparacion__col--' . $lado . '"><p class="in-comparacion__titulo" lang="en">' . in_md($x['titulo'] ?? '') . '</p><ul>';
            foreach ((array) ($x['items'] ?? []) as $i) {
                $h .= '<li>' . in_md($i) . '</li>';
            }
            return $h . '</ul></div>';
        };
        return '<div class="in-comparacion">'
             . '<div class="in-comparacion__cols">' . $col((array) ($c['a'] ?? []), 'a') . '<span class="in-comparacion__vs" aria-hidden="true">vs</span>' . $col((array) ($c['b'] ?? []), 'b') . '</div>'
             . (!empty($c['veredicto']) ? '<p class="in-comparacion__veredicto"><b>La clave:</b> ' . in_md($c['veredicto']) . '</p>' : '')
             . '</div>';
    }

    function in_errores(array $lista): string
    {
        $html = '<ul class="in-errores">';
        foreach ($lista as $x) {
            $html .= '<li class="in-error">'
                   . '<p class="in-error__mal"><span class="in-marca in-marca--mal" aria-label="Incorrecto">' . in_icono('mal') . '</span><s lang="en">' . e($x['mal'] ?? '') . '</s></p>'
                   . '<p class="in-error__bien"><span class="in-marca in-marca--ok" aria-label="Correcto">' . in_icono('ok') . '</span><span lang="en">' . e($x['bien'] ?? '') . '</span>' . in_oir((string) ($x['bien'] ?? ''), false) . '</p>'
                   . '<p class="in-error__porque">' . in_md($x['porque'] ?? '') . '</p>'
                   . '</li>';
        }
        return $html . '</ul>';
    }

    function in_pronunciacion(array $lista): string
    {
        $html = '<ul class="in-pron">';
        foreach ($lista as $p) {
            $html .= '<li class="in-pron__item">'
                   . '<div class="in-pron__cabeza"><span class="in-pron__texto" lang="en">' . e($p['texto'] ?? '') . '</span>'
                   . '<span class="in-ipa" title="Transcripción en el Alfabeto Fonético Internacional">' . e($p['ipa'] ?? '') . '</span>'
                   . in_oir((string) ($p['texto'] ?? '')) . '</div>'
                   . '<p class="in-pron__consejo">' . in_md($p['consejo'] ?? '') . '</p>'
                   . '</li>';
        }
        return $html . '</ul>';
    }

    function in_nota(array $n): string
    {
        $tono = ($n['tono'] ?? 'info') === 'warn' ? 'warn' : 'info';
        return '<aside class="in-nota in-nota--' . $tono . '">'
             . (!empty($n['titulo']) ? '<p class="in-nota__titulo">' . in_md($n['titulo']) . '</p>' : '')
             . in_parrafos((string) ($n['texto'] ?? ''))
             . '</aside>';
    }

    /** Configuración de voces (audio/voces.json), leída una vez por petición. */
    function in_voces(): array
    {
        static $c = null;
        if ($c === null) {
            $ruta = \App\Core\Config::basePath('public/assets/ingles/audio/voces.json');
            $c = is_readable($ruta) ? (array) json_decode((string) file_get_contents($ruta), true) : [];
        }
        return $c;
    }

    /** Personajes por voz. */
    function in_personajes(): array
    {
        $c = in_voces();
        return ['f' => (array) ($c['personajes']['f'] ?? []), 'm' => (array) ($c['personajes']['m'] ?? [])];
    }

    /**
     * ¿Es un texto en español? Misma regla que esEspanol() en
     * js/ingles/audio-textos.js: sin AFI ni paréntesis, al menos la mitad de
     * las palabras en la lista de voces.json o en minúscula con tilde/ñ.
     */
    function in_es_espanol(string $t): bool
    {
        static $lista = null;
        $lista ??= array_flip((array) (in_voces()['espanol'] ?? []));
        $limpio = preg_replace(['#/[^/]*/#u', '/\([^)]*\)/u'], ' ', $t) ?? $t;
        if (preg_match('/[¿¡]/u', $limpio)) {
            return true;
        }
        preg_match_all('/[A-Za-zÀ-ÿ]+/u', $limpio, $m);
        $palabras = $m[0];
        if ($palabras === []) {
            return true;
        }
        $es = 0;
        foreach ($palabras as $p) {
            // una letra mayúscula suelta (la «O» o la «Y» del alfabeto) no es español
            if ((!preg_match('/^[A-Z]$/', $p) && isset($lista[mb_strtolower($p)])) || (preg_match('/^[a-zà-ÿ]+$/u', $p) && preg_match('/[áéíóúñü]/u', $p))) {
                $es++;
            }
        }
        return $es * 2 >= \count($palabras);
    }

    /**
     * Reparte voces entre los hablantes de un diálogo. MISMA regla que
     * asignarRoles() en js/ingles/audio-textos.js (el generador de audio usa
     * la de JS; si cambias una, cambia la otra):
     * femeninos → n, f; masculinos → m, m2; sin género («Tú») → primera voz
     * libre del género contrario al del primer hablante conocido.
     * @param list<string> $quienes
     * @return array<string,string>
     */
    function in_roles_dialogo(array $quienes): array
    {
        $per = in_personajes();
        $genero = static fn (string $q): ?string => \in_array($q, $per['f'], true) ? 'f' : (\in_array($q, $per['m'], true) ? 'm' : null);
        $orden = array_values(array_unique(array_filter($quienes, static fn ($q) => $q !== '')));
        $libres = ['f' => ['n', 'f'], 'm' => ['m', 'm2']];
        $primero = 'm';
        foreach ($orden as $q) { if ($genero($q)) { $primero = $genero($q); break; } }
        $roles = [];
        foreach ($orden as $q) {
            $g = $genero($q);
            if ($g) { $roles[$q] = array_shift($libres[$g]) ?? ($g === 'f' ? 'n' : 'm'); }
        }
        $contrario = $primero === 'f' ? 'm' : 'f';
        foreach ($orden as $q) {
            if (!isset($roles[$q])) { $roles[$q] = array_shift($libres[$contrario]) ?? array_shift($libres[$primero]) ?? 'n'; }
        }
        return $roles;
    }

    /** Diálogo con burbujas; la traducción se muestra al pulsar. */
    function in_dialogo(array $lineas, string $titulo = ''): string
    {
        $roles = in_roles_dialogo(array_map(static fn ($l) => (string) ($l['quien'] ?? ''), $lineas));
        $quienes = [];
        $html = '<div class="in-dialogo">' . ($titulo !== '' ? '<p class="in-dialogo__titulo">' . in_md($titulo) . '</p>' : '')
              . '<ol class="in-dialogo__lineas">';
        foreach ($lineas as $l) {
            $quien = (string) ($l['quien'] ?? '');
            if (!isset($quienes[$quien])) {
                $quienes[$quien] = \count($quienes) % 2 === 0 ? 'a' : 'b';
            }
            $lado = $quienes[$quien];
            $html .= '<li class="in-burbuja in-burbuja--' . $lado . '">'
                   . '<span class="in-burbuja__quien">' . e($quien) . '</span>'
                   . '<span class="in-burbuja__en" lang="en">' . e($l['en'] ?? '') . '</span>'
                   . in_oir((string) ($l['en'] ?? ''), false, $roles[$quien] ?? 'n')
                   . (!empty($l['es']) ? '<span class="in-burbuja__es">' . e($l['es']) . '</span>' : '')
                   . '</li>';
        }
        $todo = implode(' ', array_map(static fn ($l) => (string) ($l['en'] ?? ''), $lineas));
        return $html . '</ol><div class="in-dialogo__pie">'
             . '<button type="button" class="in-btn in-btn--fino" data-dialogo-completo>' . in_icono('oir') . ' Escuchar el diálogo</button>'
             . '<button type="button" class="in-btn in-btn--fino" data-traducciones aria-pressed="false">Mostrar traducción</button>'
             . '</div></div>';
    }

    /** Diagramas originales definidos en el JSON (docs §3.2 VISUAL). */
    function in_visual(array $v): string
    {
        $tipo = (string) ($v['tipo'] ?? '');
        $titulo = !empty($v['titulo']) ? '<figcaption class="in-visual__titulo">' . in_md($v['titulo']) . '</figcaption>' : '';
        $pie = !empty($v['pie']) ? '<p class="in-visual__pie">' . in_md($v['pie']) . '</p>' : '';

        if ($tipo === 'linea_tiempo') {
            $x = static fn (float $p): float => round(40 + max(0.0, min(1.0, $p)) * 560, 1);
            $svg = '<svg class="in-linea" viewBox="0 0 640 170" role="img" aria-label="' . e('Línea de tiempo: ' . ($v['titulo'] ?? '')) . '">'
                 . '<line class="in-linea__eje" x1="30" y1="90" x2="612" y2="90"/><path class="in-linea__eje" d="M604 84 612 90 604 96"/>'
                 . '<text class="in-linea__ext" x="30" y="122">pasado</text><text class="in-linea__ext" x="612" y="122" text-anchor="end">futuro</text>';
            if (isset($v['ahora'])) {
                $ax = $x((float) $v['ahora']);
                $svg .= '<line class="in-linea__ahora" x1="' . $ax . '" y1="36" x2="' . $ax . '" y2="112"/>'
                      . '<text class="in-linea__ahora-t" x="' . $ax . '" y="28" text-anchor="middle">ahora</text>';
            }
            foreach ((array) ($v['marcas'] ?? []) as $i => $m) {
                $mx = $x((float) ($m['pos'] ?? 0.5));
                $tipoM = (string) ($m['tipo'] ?? 'punto');
                $ty = $i % 2 === 0 ? 150 : 62;
                if ($tipoM === 'tramo') {
                    $hx = $x((float) ($m['hasta'] ?? (($m['pos'] ?? 0.5) + 0.1)));
                    $svg .= '<rect class="in-linea__tramo" x="' . min($mx, $hx) . '" y="80" width="' . abs($hx - $mx) . '" height="20" rx="10"/>';
                    $mx = ($mx + $hx) / 2;
                } elseif ($tipoM === 'repeticion') {
                    foreach ([-0.12, -0.06, 0, 0.06, 0.12] as $d) {
                        $svg .= '<circle class="in-linea__rep" cx="' . $x((float) ($m['pos'] ?? 0.5) + $d) . '" cy="90" r="5"/>';
                    }
                } else {
                    $svg .= '<circle class="in-linea__punto" cx="' . $mx . '" cy="90" r="8"/>';
                }
                $svg .= '<text class="in-linea__marca" x="' . $mx . '" y="' . $ty . '" text-anchor="middle" lang="en">' . e($m['texto'] ?? '') . '</text>';
            }
            return '<figure class="in-visual in-visual--linea">' . $titulo . $svg . '</svg>' . $pie . '</figure>';
        }

        if ($tipo === 'mapa') {
            $html = '<div class="in-mapa"><p class="in-mapa__centro" lang="en">' . e($v['centro'] ?? '') . '</p><ul class="in-mapa__ramas">';
            foreach ((array) ($v['ramas'] ?? []) as $r) {
                $html .= '<li class="in-mapa__rama"><span class="in-mapa__texto" lang="en">' . e($r['texto'] ?? '') . '</span>'
                       . (!empty($r['detalle']) ? '<span class="in-mapa__detalle">' . in_md($r['detalle']) . '</span>' : '') . '</li>';
            }
            return '<figure class="in-visual in-visual--mapa">' . $titulo . $html . '</ul></div>' . $pie . '</figure>';
        }

        if ($tipo === 'escena') {
            $objetos = (array) ($v['objetos'] ?? []);
            $svg = '<svg class="in-escena" viewBox="0 0 480 280" role="img" aria-label="' . e('Escena: ' . ($v['titulo'] ?? '')) . '">'
                 . '<rect class="in-escena__fondo" x="1" y="1" width="478" height="278" rx="12"/>'
                 . '<line class="in-escena__suelo" x1="20" y1="236" x2="460" y2="236"/>';
            $leyenda = '<ol class="in-escena__leyenda">';
            foreach ($objetos as $i => $o) {
                $ox = round(20 + max(0.0, min(1.0, (float) ($o['x'] ?? 0.5))) * 440, 1);
                $oy = round(24 + max(0.0, min(1.0, (float) ($o['y'] ?? 0.5))) * 222, 1);
                $svg .= '<text class="in-escena__emoji" x="' . $ox . '" y="' . $oy . '" text-anchor="middle" dominant-baseline="central">' . e($o['emoji'] ?? '') . '</text>'
                      . '<circle class="in-escena__num-c" cx="' . ($ox + 22) . '" cy="' . ($oy - 20) . '" r="10"/>'
                      . '<text class="in-escena__num" x="' . ($ox + 22) . '" y="' . ($oy - 20) . '" text-anchor="middle" dominant-baseline="central">' . ($i + 1) . '</text>';
                $leyenda .= '<li><span lang="en">' . e($o['etiqueta'] ?? '') . '</span>' . in_oir((string) ($o['etiqueta'] ?? ''), false) . '</li>';
            }
            return '<figure class="in-visual in-visual--escena">' . $titulo . '<div class="in-escena__marco">' . $svg . '</svg>' . $leyenda . '</ol></div>' . $pie . '</figure>';
        }

        if ($tipo === 'transformacion') {
            $html = '<ol class="in-transf">';
            foreach ((array) ($v['pasos'] ?? []) as $p) {
                $texto = implode(' ', array_map(static fn ($x) => (string) ($x['t'] ?? ''), (array) ($p['partes'] ?? [])));
                $html .= '<li class="in-transf__paso"><span class="in-transf__etiqueta">' . e($p['etiqueta'] ?? '') . '</span>'
                       . '<div class="in-transf__frase">' . in_tira((array) ($p['partes'] ?? [])) . in_oir($texto, false) . '</div></li>';
            }
            return '<figure class="in-visual in-visual--transf">' . $titulo . $html . '</ol>' . $pie . '</figure>';
        }
        return '';
    }

    /** Un concepto completo: el ciclo explicar → mostrar → señalar → interpretar. */
    function in_concepto(array $c, int $n): string
    {
        $id = 'c-' . e($c['id'] ?? (string) $n);
        $h = '<section class="in-concepto" id="' . $id . '" aria-labelledby="' . $id . '-t">'
           . '<header class="in-concepto__cab"><span class="in-concepto__num">Concepto ' . $n . '</span>'
           . '<h2 class="in-concepto__titulo" id="' . $id . '-t">' . in_md($c['titulo'] ?? '') . '</h2></header>';

        $h .= '<div class="in-faceta in-faceta--que" data-fase="explicar"><h3 class="in-faceta__t">Qué es</h3>' . in_parrafos((string) ($c['que_es'] ?? '')) . '</div>';

        $h .= '<div class="in-faceta in-faceta--para" data-fase="explicar"><h3 class="in-faceta__t">Para qué sirve</h3><ul class="in-usos">';
        foreach ((array) ($c['para_que'] ?? []) as $u) {
            $h .= '<li>' . in_md($u) . '</li>';
        }
        $h .= '</ul></div>';

        $h .= '<div class="in-faceta in-faceta--como" data-fase="explicar"><h3 class="in-faceta__t">Cómo funciona</h3>' . in_parrafos((string) ($c['como_funciona'] ?? '')) . '</div>';

        $h .= '<div class="in-faceta in-faceta--construye" data-fase="mostrar"><h3 class="in-faceta__t">Cómo se construye</h3>';
        foreach ((array) ($c['estructuras'] ?? []) as $s) {
            $h .= in_estructura((array) $s);
        }
        foreach ((array) ($c['tablas'] ?? []) as $t) {
            $h .= in_tabla((array) $t);
        }
        $h .= '</div>';

        if (!empty($c['visual'])) {
            $h .= '<div class="in-faceta in-faceta--visual" data-fase="senalar">' . in_visual((array) $c['visual']) . '</div>';
        }

        $h .= '<div class="in-faceta in-faceta--ejemplos" data-fase="senalar"><h3 class="in-faceta__t">Ejemplos</h3><ul class="in-ejemplos">';
        foreach ((array) ($c['ejemplos'] ?? []) as $x) {
            $h .= in_ejemplo((array) $x);
        }
        $h .= '</ul></div>';

        if (!empty($c['comparacion'])) {
            $h .= '<div class="in-faceta" data-fase="senalar"><h3 class="in-faceta__t">Compara</h3>' . in_comparacion((array) $c['comparacion']) . '</div>';
        }

        $h .= '<div class="in-faceta in-faceta--pron" data-fase="mostrar"><h3 class="in-faceta__t">Pronunciación</h3>' . in_pronunciacion((array) ($c['pronunciacion'] ?? [])) . '</div>';
        $h .= '<div class="in-faceta in-faceta--errores" data-fase="interpretar"><h3 class="in-faceta__t">Errores frecuentes</h3>' . in_errores((array) ($c['errores'] ?? [])) . '</div>';

        if (!empty($c['nota'])) {
            $h .= in_nota((array) $c['nota']);
        }
        return $h . '</section>';
    }

    /** Marcadores de dificultad accesibles. */
    function in_dificultad(int $d): string
    {
        $d = max(1, min(3, $d));
        $nombres = [1 => 'básica', 2 => 'media', 3 => 'alta'];
        return '<span class="in-dif in-dif--' . $d . '" title="Dificultad ' . $nombres[$d] . '"><span aria-hidden="true">'
             . str_repeat('●', $d) . str_repeat('○', 3 - $d) . '</span><span class="visually-hidden">Dificultad ' . $nombres[$d] . '</span></span>';
    }

    /**
     * Armazón de un ejercicio. El enunciado y la pregunta se pintan en el
     * servidor (se leen sin JavaScript); ingles.js monta encima la parte
     * interactiva a partir del mismo objeto JSON.
     */
    function in_ejercicio(array $ej, int $n, string $extra = ''): string
    {
        $id = (string) ($ej['id'] ?? '');
        $tipo = (string) ($ej['tipo'] ?? '');
        $html = '<article class="in-ej in-ej--' . e($tipo) . '" id="ej-' . e($id) . '" data-ej="' . e($id) . '">'
              . '<header class="in-ej__cab"><span class="in-ej__num">' . $n . '</span>'
              . '<span class="in-ej__tipo">' . e(IN_TIPOS[$tipo] ?? $tipo) . '</span>'
              . in_dificultad((int) ($ej['dificultad'] ?? 1)) . $extra
              . '<span class="in-ej__estado" data-ej-estado></span></header>';

        $enunciado = $tipo === 'escritura' ? (string) ($ej['objetivo'] ?? '') : (string) ($ej['enunciado'] ?? '');
        $html .= '<p class="in-ej__enunciado">' . in_md($enunciado) . '</p>';

        // Vista previa sin JavaScript: la pregunta en texto plano.
        $previa = match ($tipo) {
            'opcion'       => (string) ($ej['pregunta'] ?? ''),
            'completar'    => (string) ($ej['frase'] ?? ''),
            'traducir'     => (string) ($ej['es'] ?? ''),
            'transformar'  => (string) ($ej['origen'] ?? ''),
            'corregir'     => (string) ($ej['frase'] ?? ''),
            'pronunciacion'=> (string) ($ej['texto'] ?? ''),
            default        => '',
        };
        $html .= '<div class="in-ej__cuerpo" data-ej-cuerpo>'
               . ($previa !== '' ? '<p class="in-ej__previa">' . in_md($previa) . '</p>' : '')
               . '<noscript><p class="in-nota in-nota--info">Este ejercicio necesita JavaScript para comprobar tu respuesta.</p></noscript>'
               . '</div>';
        return $html . '</article>';
    }

    /** Cabecera de página del módulo, con migas y posición. */
    function in_cabecera(string $titulo, string $bajada, array $migas = [], string $antetitulo = '', string $acciones = ''): string
    {
        $html = '<header class="in-cabecera"><div class="container">';
        if ($migas !== []) {
            $html .= '<nav aria-label="Ruta de navegación"><ol class="in-migas">';
            foreach ($migas as $texto => $u) {
                $html .= $u === null
                    ? '<li><span aria-current="page">' . e($texto) . '</span></li>'
                    : '<li><a href="' . e($u) . '">' . e($texto) . '</a></li>';
            }
            $html .= '</ol></nav>';
        }
        if ($antetitulo !== '') {
            $html .= '<p class="in-cabecera__ante">' . e($antetitulo) . '</p>';
        }
        $html .= '<h1 class="in-cabecera__titulo">' . in_md($titulo) . '</h1>';
        if ($bajada !== '') {
            $html .= '<p class="in-cabecera__bajada">' . in_md($bajada) . '</p>';
        }
        if ($acciones !== '') {
            $html .= '<div class="in-cabecera__acciones">' . $acciones . '</div>';
        }
        return $html . '</div></header>';
    }

    /** Migas comunes: Biblioteca / Inglés / … */
    function in_migas(array $mas = []): array
    {
        return ['Biblioteca' => url('/'), 'Academia de Inglés' => url('ingles')] + $mas;
    }

    /** Barra de secciones del módulo (navegación interna). */
    function in_subnav(string $activa = ''): string
    {
        $items = [
            ''              => 'Curso',
            'vocabulario'   => 'Vocabulario',
            'tarjetas'      => 'Tarjetas',
            'repaso'        => 'Repaso',
            'pronunciacion' => 'Pronunciación',
            'practica'      => 'Práctica',
            'juegos'        => 'Juegos',
            'progreso'      => 'Progreso',
        ];
        $html = '<nav class="in-subnav" aria-label="Secciones de la Academia de Inglés"><div class="container"><ul>';
        foreach ($items as $ruta => $texto) {
            $html .= '<li><a href="' . e(url('ingles' . ($ruta !== '' ? '/' . $ruta : ''))) . '"'
                   . ($activa === $ruta ? ' aria-current="page"' : '') . '>' . e($texto)
                   . ($ruta === 'repaso' ? ' <span class="in-subnav__cuenta" data-repasos-pendientes hidden></span>' : '')
                   . '</a></li>';
        }
        return $html . '<li class="in-subnav__voz"><a href="' . e(url('ingles/audio')) . '"' . ($activa === 'audio' ? ' aria-current="page"' : '') . '>' . in_icono('oir') . ' Voz <span class="in-subnav__estado-voz" data-voz-resumen></span></a></li></ul></div></nav>';
    }

    /** Tarjeta de unidad para la ruta académica. */
    function in_tarjeta_unidad(array $u): string
    {
        $num = str_pad((string) ($u['numero'] ?? ''), 2, '0', STR_PAD_LEFT);
        $cifras = (array) ($u['cifras'] ?? []);
        $cuerpo = '<span class="in-unidad__num" aria-hidden="true">' . e($num) . '</span>'
                . '<span class="in-unidad__texto"><span class="in-unidad__titulo">' . e($u['titulo'] ?? '') . '</span>'
                . '<span class="in-unidad__resumen">' . e($u['resumen'] ?? '') . '</span>';
        if (!empty($u['disponible'])) {
            $cuerpo .= '<span class="in-unidad__pie">' . count($u['lecciones'] ?? []) . ' lecciones · '
                     . (int) ($cifras['ejercicios'] ?? 0) . ' ejercicios · evaluación de ' . (int) ($cifras['evaluacion'] ?? 0) . ' preguntas</span>'
                     . '<span class="in-barra" aria-hidden="true"><span class="in-barra__relleno" data-unidad-barra="' . e($u['slug']) . '"></span></span>'
                     . '<span class="in-unidad__estado" data-unidad-estado="' . e($u['slug']) . '"></span>';
            return '<li class="in-unidad" data-unidad="' . e($u['slug']) . '"><a href="' . e(url('ingles/unidad/' . $u['slug'])) . '">'
                 . '<span class="visually-hidden">Unidad ' . (int) $u['numero'] . ': </span>' . $cuerpo . '</span></a></li>';
        }
        return '<li class="in-unidad es-preparacion"><div><span class="visually-hidden">Unidad ' . (int) $u['numero'] . ': </span>' . $cuerpo
             . '<span class="in-unidad__pie">En preparación: se publicará cuando esté completa.</span></span></div></li>';
    }
}
