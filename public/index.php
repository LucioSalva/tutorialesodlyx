<?php
/**
 * Tutoriales Lucio · CODLYX — front controller
 *
 * Único punto de entrada. Todo el tráfico llega aquí vía .htaccess.
 */
declare(strict_types=1);

use App\Core\Config;
use App\Core\Router;
use App\Core\View;
use App\Models\AcademiaRepository;
use App\Models\TutorialRepository;

// ---------------------------------------------------------------------
// Autoload PSR-4 mínimo. Sin Composer: el proyecto no tiene dependencias
// de terceros en PHP, así que un autoloader de doce líneas basta y evita
// subir un vendor/ a hosting compartido.
// ---------------------------------------------------------------------
spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
    $file     = \dirname(__DIR__) . '/app/' . $relative . '.php';
    if (is_file($file)) {
        require $file;
    }
});

require \dirname(__DIR__) . '/app/Core/helpers.php';

// ---------------------------------------------------------------------
// Errores: visibles en desarrollo, solo al log en producción.
// Una excepción de base de datos nunca debe llegar al visitante.
// ---------------------------------------------------------------------
if (Config::isProduction()) {
    ini_set('display_errors', '0');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
}

// Cabeceras de seguridad básicas, aplicables en hosting compartido.
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Frame-Options: SAMEORIGIN');

// ---------------------------------------------------------------------
// Enrutado
// ---------------------------------------------------------------------
$path    = Router::path();
$segments = $path === '' ? [] : explode('/', $path);

try {
    $html = null;

    if ($segments === []) {
        $html = (new App\Controllers\HomeController())->index();

    } elseif ($segments[0] === 'tutoriales' && isset($segments[1]) && count($segments) === 2) {
        $slug = strtolower($segments[1]);
        if (TutorialRepository::isSlug($slug)) {
            $html = (new App\Controllers\TutorialController())->show($slug);
        }

    } elseif ($segments[0] === 'academia') {
        // Academia de Comandos. Las palabras fijas se comprueban ANTES que
        // el sistema operativo, así que /academia/juegos nunca se confunde
        // con /academia/{os}. Todo lo que no encaje cae al 404 de siempre.
        $academia = new App\Controllers\AcademiaController();
        $uno      = isset($segments[1]) ? strtolower($segments[1]) : null;
        $dos      = isset($segments[2]) ? strtolower($segments[2]) : null;
        $tres     = isset($segments[3]) ? strtolower($segments[3]) : null;
        $total    = count($segments);

        if ($total === 1) {
            $html = $academia->index();

        } elseif ($total === 2 && $uno === 'juegos') {
            $html = $academia->juegos();
        } elseif ($total === 3 && $uno === 'juegos') {
            $html = $academia->juego((string) $dos);

        } elseif ($total === 2 && $uno === 'repaso') {
            $html = $academia->repaso();
        } elseif ($total === 2 && $uno === 'comparar') {
            $html = $academia->comparar();
        } elseif ($total === 2 && $uno === 'buscar') {
            $filtro = isset($_GET['os']) && AcademiaRepository::esSistema((string) $_GET['os'])
                ? (string) $_GET['os'] : null;
            $html = $academia->buscar((string) ($_GET['q'] ?? ''), $filtro);

        } elseif ($total === 2 && AcademiaRepository::esSistema((string) $uno)) {
            $html = $academia->sistema((string) $uno);
        } elseif ($total === 3 && AcademiaRepository::esSistema((string) $uno)) {
            $html = match ($dos) {
                'practica'      => $academia->practica((string) $uno),
                'misiones'      => $academia->misiones((string) $uno),
                'combinaciones' => $academia->combinaciones((string) $uno),
                default         => null,
            };
        } elseif ($total === 4 && AcademiaRepository::esSistema((string) $uno) && $dos === 'comando') {
            $html = $academia->comando((string) $uno, (string) $tres);
        }
    }

    if ($html === null) {
        http_response_code(404);
        $html = View::render('errors/404', [
            'pageTitle'  => 'Página no encontrada · Tutoriales Lucio',
            'metaDesc'   => 'La página solicitada no existe en Tutoriales Lucio.',
            'bodyClass'  => 'page-error',
            'activeSlug' => null,
            'tutorials'  => TutorialRepository::all(),
        ]);
    }

    header('Content-Type: text/html; charset=UTF-8');
    echo $html;

} catch (Throwable $e) {
    error_log('[Tutoriales] Error no controlado: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    http_response_code(500);
    header('Content-Type: text/html; charset=UTF-8');

    if (Config::isProduction()) {
        echo '<!doctype html><html lang="es"><head><meta charset="utf-8">'
           . '<title>Error del servidor</title></head><body>'
           . '<h1>Error del servidor</h1><p>Vuelve a intentarlo en unos minutos.</p>'
           . '</body></html>';
    } else {
        echo '<!doctype html><html lang="es"><head><meta charset="utf-8">'
           . '<title>Error</title></head><body><h1>Error (modo desarrollo)</h1><pre>'
           . htmlspecialchars($e->getMessage() . "\n\n" . $e->getTraceAsString(), ENT_QUOTES, 'UTF-8')
           . '</pre></body></html>';
    }
}
