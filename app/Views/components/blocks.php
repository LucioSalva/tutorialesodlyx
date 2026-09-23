<?php
/**
 * Bloques didácticos reutilizables.
 *
 * Los usan las vistas de tutorial para no repetir el mismo armazón HTML
 * decenas de veces. Cuando se añada un tutorial nuevo, hereda estos
 * componentes sin escribir marcado propio.
 *
 * Nota sobre el escapado: `$html` en term() y note() es contenido de autor
 * escrito dentro de una vista PHP del propio repositorio, no entrada de
 * usuario. Los valores que SÍ podrían venir de fuera (expresiones de filtro,
 * etiquetas) se escapan con e().
 */

if (!function_exists('block_uid')) {
    /** Identificador incremental y estable dentro de una misma respuesta. */
    function block_uid(string $prefix): string
    {
        static $n = 0;
        return $prefix . '-' . (++$n);
    }
}

if (!function_exists('term')) {
    /**
     * Bloque de terminal con botón de copiar.
     *
     * @param string $html  contenido ya marcado (usa <span class="p">$</span>
     *                      para el prompt y <span class="c">…</span> para
     *                      comentarios; el prompt se excluye al copiar)
     * @param string $label etiqueta de la barra superior
     */
    function term(string $html, string $label = 'bash'): string
    {
        $id = block_uid('term');

        return '<div class="term">'
             . '<div class="term__bar">'
             . '<span class="term__label">' . e($label) . '</span>'
             . '<button type="button" class="term__copy" data-copy="' . e($id) . '" '
             . 'data-label-idle="Copiar" data-label-aria="Copiar comando" '
             . 'aria-label="Copiar comando">Copiar</button>'
             . '</div>'
             . '<pre id="' . e($id) . '"><code>' . $html . '</code></pre>'
             . '</div>';
    }
}

if (!function_exists('filter_chip')) {
    /**
     * Chip de display filter de Wireshark, con copia directa.
     * La expresión se escapa: puede contener &&, <, > y comillas.
     */
    function filter_chip(string $expression, string $tag = 'Display'): string
    {
        $id = block_uid('filter');

        return '<div class="filter">'
             . '<span class="filter__tag">' . e($tag) . '</span>'
             . '<code class="filter__val" id="' . e($id) . '">' . e($expression) . '</code>'
             . '<button type="button" class="filter__copy" data-copy="' . e($id) . '" '
             . 'data-label-aria="Copiar filtro" '
             . 'aria-label="Copiar filtro ' . e($expression) . '">'
             . icon('copy', 15)
             . '</button>'
             . '</div>';
    }
}

if (!function_exists('note')) {
    /**
     * Callout. $variant: 'warn' (por defecto) o 'info'.
     */
    function note(string $label, string $html, string $variant = 'warn'): string
    {
        $class = $variant === 'info' ? 'note note--info' : 'note';

        return '<aside class="' . $class . '">'
             . '<span class="note__label">' . e($label) . '</span>'
             . $html
             . '</aside>';
    }
}

if (!function_exists('chapter')) {
    /**
     * Separador de capítulo. Marca el paso de un bloque temático al siguiente
     * (Fundamentos → Protocolos → Wireshark a fondo → Ciberseguridad → Práctica)
     * para que un tutorial largo se lea como un curso y no como un muro.
     *
     * @param string $numero  «01», «02»…
     * @param string $nivel   clave de dificultad; ver difficulty()
     */
    function chapter(string $numero, string $titulo, string $bajada, string $nivel): string
    {
        return '<div class="chapter">'
             . '<div class="chapter__top">'
             . '<span class="chapter__num">Parte ' . e($numero) . '</span>'
             . difficulty($nivel)
             . '</div>'
             . '<h2 class="chapter__title">' . e($titulo) . '</h2>'
             . '<p class="chapter__sub">' . e($bajada) . '</p>'
             . '</div>';
    }
}

if (!function_exists('difficulty')) {
    /**
     * Insignia de nivel. El texto lleva la información, no solo el color:
     * quien no distinga los tonos sigue leyendo «Ciberseguridad».
     */
    function difficulty(string $nivel): string
    {
        $niveles = [
            // Escala de dificultad común a TODOS los tutoriales (v1.3.0).
            // Todo ejercicio del proyecto debe llevar una de estas tres.
            'basico'      => 'Básico',
            'intermedio'  => 'Intermedio',
            'avanzado'    => 'Avanzado',
            // Etiquetas temáticas heredadas: siguen válidas para marcar
            // capítulos, no ejercicios.
            'fundamentos' => 'Fundamentos',
            'protocolos'  => 'Protocolos',
            'ciber'       => 'Ciberseguridad',
            'practica'    => 'Práctica',
        ];

        $etiqueta = $niveles[$nivel] ?? ucfirst($nivel);

        return '<span class="level level--' . e($nivel) . '">' . e($etiqueta) . '</span>';
    }
}

if (!function_exists('reveal')) {
    /**
     * Bloque plegable con <details> nativo: sin JavaScript, accesible por
     * teclado y buscable por el navegador (Ctrl+F lo despliega en Chrome).
     * Se usa para soluciones de desafíos y para detalle opcional que no debe
     * interrumpir la lectura principal.
     */
    function reveal(string $resumen, string $html, string $variante = ''): string
    {
        $clase = 'reveal' . ($variante !== '' ? ' reveal--' . $variante : '');

        return '<details class="' . e($clase) . '">'
             . '<summary>' . e($resumen) . '</summary>'
             . '<div class="reveal__body">' . $html . '</div>'
             . '</details>';
    }
}

if (!function_exists('lab_head')) {
    /**
     * Cabecera de laboratorio: número, título, nivel y objetivo en una sola
     * pieza, para que los doce labs se lean con la misma forma.
     */
    function lab_head(string $numero, string $titulo, string $nivel, string $objetivo): string
    {
        return '<div class="lab__head">'
             . '<span class="lab__num">' . e($numero) . '</span>'
             . '<h3>' . e($titulo) . '</h3>'
             . difficulty($nivel)
             . '</div>'
             . '<p class="lab__goal">' . e($objetivo) . '</p>';
    }
}

if (!function_exists('steps')) {
    /**
     * Lista de pasos numerada de un laboratorio.
     * @param list<string> $pasos  HTML de autor, uno por paso
     */
    function steps(array $pasos): string
    {
        $html = '';
        foreach ($pasos as $paso) {
            $html .= '<li>' . $paso . '</li>';
        }
        return '<ol class="steps">' . $html . '</ol>';
    }
}

/* =====================================================================
   Componentes del estándar de enseñanza visual (v1.3.0)
   ---------------------------------------------------------------------
   Implementan el ciclo obligatorio de todos los tutoriales:

       Explicar → Mostrar → Señalar → Practicar → Resolver → Interpretar

   Son genéricos a propósito: ninguno sabe nada de Wireshark ni de Nmap.
   SSH, Linux, Docker o Git los heredan sin escribir marcado propio.
   La norma completa está en docs/TUTORIAL_STANDARD.md.

   Regla de diseño: HTML nativo siempre que baste. Las pistas, las
   soluciones y las respuestas del quiz son <details>/<summary>, así que
   funcionan con JavaScript desactivado y son navegables con teclado.
   El único añadido opcional es la lupa de las figuras, y si el script
   no carga el enlace sigue abriendo la imagen.
   ===================================================================== */

if (!function_exists('figure_dims')) {
    /**
     * Lee width/height del encabezado de un SVG para poder emitirlos en el
     * <img>. Sin esas medidas el navegador no reserva sitio y la página da
     * un salto al terminar de cargar la figura.
     *
     * Solo se leen los primeros bytes del fichero y el resultado se cachea
     * por petición: 32 figuras no deben costar 32 lecturas repetidas.
     *
     * @return array{0:int,1:int}|null
     */
    function figure_dims(string $rutaRelativa): ?array
    {
        static $cache = [];

        if (array_key_exists($rutaRelativa, $cache)) {
            return $cache[$rutaRelativa];
        }

        $cache[$rutaRelativa] = null;
        $absoluta = \App\Core\Config::basePath('public/' . $rutaRelativa);

        if (!is_file($absoluta)) {
            return null;
        }

        $cabecera = (string) file_get_contents($absoluta, false, null, 0, 400);

        if (preg_match('/viewBox="0 0 ([\d.]+) ([\d.]+)"/', $cabecera, $m) === 1) {
            $cache[$rutaRelativa] = [(int) round((float) $m[1]), (int) round((float) $m[2])];
        }

        return $cache[$rutaRelativa];
    }
}

if (!function_exists('shot')) {
    /**
     * Figura didáctica: captura, diagrama o representación de una pantalla.
     *
     * Obligatorio por norma del proyecto:
     *   · `alt` describe lo que se ve, para quien no puede verlo;
     *   · `figcaption` dice qué mirar, no repite el alt;
     *   · la procedencia se declara siempre —«captura real» solo si el
     *     material salió de verdad del laboratorio—.
     *
     * @param string $archivo  ruta bajo assets/img/tutorials/, por ejemplo
     *                         'wireshark/02-packet-list.svg'
     * @param string $alt      descripción para lectores de pantalla
     * @param string $pie      qué hay que mirar en la figura
     * @param string $origen   'real' | 'ilustrativo' | '' (sin distintivo)
     */
    function shot(string $archivo, string $alt, string $pie, string $origen = 'ilustrativo'): string
    {
        $rel  = 'assets/img/tutorials/' . ltrim($archivo, '/');
        $dims = figure_dims($rel);
        $url  = asset($rel);

        $medidas = $dims !== null
            ? ' width="' . $dims[0] . '" height="' . $dims[1] . '"'
            : '';

        $distintivo = '';
        if ($origen === 'real') {
            $distintivo = '<span class="shot__badge shot__badge--real">Captura real de laboratorio</span>';
        } elseif ($origen === 'ilustrativo') {
            $distintivo = '<span class="shot__badge">Ejemplo ilustrativo</span>';
        }

        // <a> y no <button>: sin JavaScript el enlace abre la imagen a
        // tamaño completo, que es exactamente lo que se pretendía.
        return '<figure class="shot">'
             . $distintivo
             . '<a class="shot__zoom" href="' . e($url) . '" data-lightbox '
             . 'aria-label="Ampliar figura: ' . e($alt) . '">'
             . '<img src="' . e($url) . '" alt="' . e($alt) . '"' . $medidas
             . ' loading="lazy" decoding="async">'
             . '<span class="shot__lens" aria-hidden="true">Ampliar</span>'
             . '</a>'
             . '<figcaption>' . $pie . '</figcaption>'
             . '</figure>';
    }
}

if (!function_exists('callouts')) {
    /**
     * Leyenda numerada que acompaña a una figura con marcas ①②③.
     * Sin ella, los números de la imagen no significan nada.
     *
     * @param list<array{0:string,1:string}> $items  [etiqueta, explicación HTML]
     */
    function callouts(array $items): string
    {
        $html = '';
        $n = 0;
        foreach ($items as $item) {
            $n++;
            $html .= '<li><span class="callouts__n" aria-hidden="true">' . $n . '</span>'
                   . '<b>' . e((string) $item[0]) . '</b>'
                   . '<span>' . $item[1] . '</span></li>';
        }
        return '<ol class="callouts">' . $html . '</ol>';
    }
}

if (!function_exists('anatomy')) {
    /**
     * Desglose anotado de un comando, una salida o un filtro: primero la
     * línea tal cual, después qué significa cada pieza.
     *
     * Es la pieza que convierte «aquí tienes un comando» en «mira qué hace
     * cada parte del comando».
     *
     * @param string $linea   HTML de autor de la línea (usa <b> para marcar piezas)
     * @param list<array{0:string,1:string}> $piezas  [pieza, qué significa]
     */
    function anatomy(string $linea, array $piezas, string $etiqueta = 'Desglose'): string
    {
        $filas = '';
        foreach ($piezas as $p) {
            $filas .= '<div><dt>' . e((string) $p[0]) . '</dt><dd>' . $p[1] . '</dd></div>';
        }

        return '<div class="anat">'
             . '<span class="anat__tag">' . e($etiqueta) . '</span>'
             . '<p class="anat__line"><code>' . $linea . '</code></p>'
             . '<dl class="anat__parts">' . $filas . '</dl>'
             . '</div>';
    }
}

if (!function_exists('evidence')) {
    /**
     * Evidencia · Interpretación · Lo que todavía no se puede afirmar.
     *
     * El componente central de todo el material de ciberseguridad del
     * proyecto. Existe para que nunca se presente un indicador aislado
     * como prueba: separa el dato observable de la lectura que se hace de
     * él y del límite de esa lectura.
     *
     * @param string $dato    lo que se observa, sin interpretar
     * @param string $lectura qué puede indicar
     * @param string $limite  qué sería una conclusión prematura
     */
    function evidence(string $dato, string $lectura, string $limite): string
    {
        return '<div class="evid">'
             . '<div class="evid__row evid__row--dato">'
             . '<span class="evid__k">Evidencia</span>'
             . '<div class="evid__v">' . $dato . '</div></div>'
             . '<div class="evid__row evid__row--lectura">'
             . '<span class="evid__k">Interpretación</span>'
             . '<div class="evid__v">' . $lectura . '</div></div>'
             . '<div class="evid__row evid__row--limite">'
             . '<span class="evid__k">No podemos afirmar</span>'
             . '<div class="evid__v">' . $limite . '</div></div>'
             . '</div>';
    }
}

if (!function_exists('pitfall')) {
    /**
     * Error común: la confusión típica de este tema, dicha en voz alta.
     * Se distingue de note() a propósito — note() avisa, pitfall() corrige
     * una idea equivocada concreta.
     */
    function pitfall(string $html, string $etiqueta = 'Error común'): string
    {
        return '<aside class="pitfall">'
             . '<span class="pitfall__label">' . e($etiqueta) . '</span>'
             . $html
             . '</aside>';
    }
}

if (!function_exists('hints')) {
    /**
     * Pistas progresivas. Cada una se despliega por separado, de modo que
     * quien solo necesita un empujón no ve la siguiente.
     *
     * Orden recomendado: 1) el concepto, 2) dónde mirar, 3) el comando o
     * filtro concreto. Nunca la respuesta: para eso está solution().
     *
     * @param list<string> $pistas  HTML de autor, de menos a más explícita
     */
    function hints(array $pistas): string
    {
        $html = '';
        $n = 0;
        foreach ($pistas as $pista) {
            $n++;
            $html .= '<details class="reveal reveal--hint">'
                   . '<summary>Pista ' . $n . '</summary>'
                   . '<div class="reveal__body">' . $pista . '</div>'
                   . '</details>';
        }
        return '<div class="hints">' . $html . '</div>';
    }
}

if (!function_exists('solution')) {
    /**
     * Solución razonada. Por norma del proyecto NO se acepta «Respuesta: 22»:
     * $razonamiento debe explicar de qué evidencia sale la respuesta.
     *
     * @param string $respuesta    la respuesta, en una línea
     * @param string $razonamiento por qué es esa y no otra
     * @param string $aprendido    qué queda para la próxima vez (opcional)
     */
    function solution(string $respuesta, string $razonamiento, string $aprendido = ''): string
    {
        $cuerpo = '<p class="sol__answer">' . $respuesta . '</p>' . $razonamiento;

        if ($aprendido !== '') {
            $cuerpo .= '<p class="sol__learned"><b>Qué aprendimos:</b> ' . $aprendido . '</p>';
        }

        return '<details class="reveal reveal--sol">'
             . '<summary>Ver solución razonada</summary>'
             . '<div class="reveal__body">' . $cuerpo . '</div>'
             . '</details>';
    }
}

if (!function_exists('quiz')) {
    /**
     * Mini quiz de comprobación: 2 a 5 preguntas de opción múltiple con la
     * respuesta plegada y, sobre todo, con el porqué.
     *
     * @param list<array{q:string,opts:array<string,string>,ok:string,why:string}> $preguntas
     */
    function quiz(array $preguntas, string $titulo = 'Comprueba que lo entendiste'): string
    {
        $html = '';
        $n = 0;

        foreach ($preguntas as $p) {
            $n++;
            $opciones = '';
            foreach (($p['opts'] ?? []) as $letra => $texto) {
                $opciones .= '<li><span class="quiz__opt">' . e((string) $letra) . '</span>'
                           . e((string) $texto) . '</li>';
            }

            $correcta = (string) ($p['ok'] ?? '');
            $textoOk  = (string) (($p['opts'] ?? [])[$correcta] ?? '');

            $html .= '<li class="quiz__item">'
                   . '<p class="quiz__q">' . e((string) ($p['q'] ?? '')) . '</p>'
                   . '<ul class="quiz__opts">' . $opciones . '</ul>'
                   . '<details class="reveal reveal--quiz">'
                   . '<summary>Ver respuesta</summary>'
                   . '<div class="reveal__body">'
                   . '<p class="quiz__ok"><b>' . e($correcta) . '.</b> ' . e($textoOk) . '</p>'
                   . '<p>' . ($p['why'] ?? '') . '</p>'
                   . '</div></details>'
                   . '</li>';
        }

        return '<section class="quiz" aria-label="' . e($titulo) . '">'
             . '<h3 class="quiz__title">' . e($titulo) . '</h3>'
             . '<ol class="quiz__list">' . $html . '</ol>'
             . '</section>';
    }
}

if (!function_exists('recap')) {
    /**
     * Cierre de capítulo. Cuatro bloques fijos para que todos los capítulos
     * de todos los tutoriales terminen igual y el estudiante sepa siempre
     * dónde buscar el resumen.
     *
     * @param list<string> $esencial    3 a 6 ideas
     * @param list<string> $clave       comandos o filtros imprescindibles
     * @param list<string> $interpretar qué hay que saber leer
     */
    function recap(string $titulo, array $esencial, array $clave = [], array $interpretar = []): string
    {
        $lista = static function (array $items, string $clase = ''): string {
            $html = '';
            foreach ($items as $i) {
                $html .= '<li>' . $i . '</li>';
            }
            return '<ul class="' . $clase . '">' . $html . '</ul>';
        };

        $html = '<div class="recap">'
              . '<div class="recap__head"><span class="recap__tag">Resumen</span>'
              . '<h3>' . e($titulo) . '</h3></div>'
              . '<div class="recap__grid">'
              . '<div><h4>Lo esencial</h4>' . $lista($esencial) . '</div>';

        if ($clave !== []) {
            $html .= '<div><h4>Comandos y filtros clave</h4>'
                   . $lista($clave, 'recap__mono') . '</div>';
        }

        if ($interpretar !== []) {
            $html .= '<div><h4>Qué debes saber interpretar</h4>'
                   . $lista($interpretar) . '</div>';
        }

        return $html . '</div></div>';
    }
}

if (!function_exists('compare')) {
    /**
     * Comparación de dos conceptos que se confunden entre sí
     * (capture vs display filter, -sT vs -sS, contraseña vs clave…).
     *
     * @param array{0:string,1:string,2:string} $a  [título, subtítulo, HTML]
     * @param array{0:string,1:string,2:string} $b
     * @param string $veredicto  la frase que resuelve la duda
     */
    function compare(array $a, array $b, string $veredicto = ''): string
    {
        $columna = static function (array $c, string $lado): string {
            return '<div class="cmp__col cmp__col--' . $lado . '">'
                 . '<h4>' . e((string) $c[0]) . '</h4>'
                 . '<p class="cmp__sub">' . e((string) $c[1]) . '</p>'
                 . '<div class="cmp__body">' . $c[2] . '</div>'
                 . '</div>';
        };

        $html = '<div class="cmp">' . $columna($a, 'a') . $columna($b, 'b') . '</div>';

        if ($veredicto !== '') {
            $html .= '<p class="cmp__verdict">' . $veredicto . '</p>';
        }

        return $html;
    }
}

if (!function_exists('before_after')) {
    /**
     * Antes → cambio → después. Para configuración, hardening, permisos y
     * cualquier cosa cuyo valor esté en la diferencia, no en el estado.
     */
    function before_after(string $antes, string $cambio, string $despues): string
    {
        return '<div class="baft">'
             . '<div class="baft__step baft__step--before">'
             . '<span class="baft__k">Antes</span><div>' . $antes . '</div></div>'
             . '<div class="baft__arrow" aria-hidden="true">&darr;</div>'
             . '<div class="baft__step baft__step--change">'
             . '<span class="baft__k">El cambio</span><div>' . $cambio . '</div></div>'
             . '<div class="baft__arrow" aria-hidden="true">&darr;</div>'
             . '<div class="baft__step baft__step--after">'
             . '<span class="baft__k">Después</span><div>' . $despues . '</div></div>'
             . '</div>';
    }
}
