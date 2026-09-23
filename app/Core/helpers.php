<?php
/**
 * Helpers globales de plantilla.
 * Deliberadamente en el espacio de nombres global: aparecen en cada
 * interpolación de las vistas y calificarlos las volvería ilegibles.
 */
declare(strict_types=1);

if (!function_exists('e')) {
    /** Escape para contexto HTML (texto y atributos entrecomillados). */
    function e(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}

if (!function_exists('url')) {
    /** Construye una URL absoluta a partir de una ruta relativa a la raíz web. */
    function url(string $path = ''): string
    {
        return \App\Core\Config::baseUrl() . '/' . ltrim($path, '/');
    }
}

if (!function_exists('asset')) {
    /**
     * URL de un recurso estático con cache-busting basado en mtime.
     * Evita que un despliegue nuevo se sirva con CSS antiguo en caché.
     */
    function asset(string $path): string
    {
        $path = ltrim($path, '/');
        $file = \App\Core\Config::basePath('public/' . $path);
        $stamp = is_file($file) ? '?v=' . filemtime($file) : '';
        return url($path) . $stamp;
    }
}
