<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Enrutador mínimo.
 *
 * Solo hay dos formas de URL en esta aplicación, así que no hace falta un
 * sistema de rutas con parámetros nombrados ni middlewares:
 *
 *     /                       → biblioteca
 *     /tutoriales/{slug}      → un tutorial
 *
 * La ruta se toma de la query `r` que escribe .htaccess, y si no existe se
 * deduce de REQUEST_URI restando el directorio base. Ese doble camino es lo
 * que permite funcionar en dominio, subdominio y subdirectorio sin cambios,
 * y también con `php -S` sin Apache.
 */
final class Router
{
    /** Devuelve la ruta solicitada, normalizada y sin barras extremas. */
    public static function path(): string
    {
        // 1) Vía .htaccess: index.php?r=tutoriales/wireshark
        $raw = $_GET['r'] ?? null;

        // 2) Sin reescritura: deducirla de la URI quitando el directorio base.
        if ($raw === null) {
            $uri  = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
            $base = str_replace('\\', '/', \dirname($_SERVER['SCRIPT_NAME'] ?? '/index.php'));
            $base = ($base === '/' || $base === '.') ? '' : rtrim($base, '/');

            if ($base !== '' && str_starts_with($uri, $base)) {
                $uri = substr($uri, strlen($base));
            }
            $raw = $uri;
        }

        $path = trim((string) $raw, '/');
        // Normaliza la barra repetida y descarta cualquier resto de recorrido.
        $path = preg_replace('#/+#', '/', $path) ?? '';

        return str_contains($path, '..') ? '' : $path;
    }
}
