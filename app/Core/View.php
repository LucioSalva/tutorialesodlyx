<?php
declare(strict_types=1);

namespace App\Core;

use RuntimeException;

/**
 * Renderizado de vistas PHP planas con un layout envolvente.
 *
 * Los nombres de vista se restringen a [a-z0-9_/-] y no pueden contener '..',
 * de modo que ninguna cadena externa (por ejemplo tutorials.view_key de
 * MySQL) pueda escapar de app/Views/ aunque la whitelist fallara.
 */
final class View
{
    /** Renderiza una vista dentro del layout y devuelve el HTML completo. */
    public static function render(string $view, array $data = [], string $layout = 'layouts/base'): string
    {
        $data['content'] = self::capture($view, $data);
        return self::capture($layout, $data);
    }

    /** Renderiza una vista suelta (componente, parcial) y devuelve su HTML. */
    public static function capture(string $view, array $data = []): string
    {
        $file = self::resolve($view);

        extract($data, EXTR_SKIP);
        ob_start();
        try {
            require $file;
        } catch (\Throwable $e) {
            ob_end_clean();
            throw $e;
        }
        return (string) ob_get_clean();
    }

    /** Comprueba si una vista existe sin renderizarla. */
    public static function exists(string $view): bool
    {
        return self::isSafeName($view) && is_file(Config::basePath('app/Views/' . $view . '.php'));
    }

    private static function resolve(string $view): string
    {
        if (!self::isSafeName($view)) {
            throw new RuntimeException('Nombre de vista no válido.');
        }

        $file = Config::basePath('app/Views/' . $view . '.php');
        $real = realpath($file);
        $root = realpath(Config::basePath('app/Views'));

        // Segunda barrera: el fichero resuelto debe estar dentro de app/Views.
        if ($real === false || $root === false || !str_starts_with($real, $root . DIRECTORY_SEPARATOR)) {
            throw new RuntimeException('Vista no encontrada: ' . $view);
        }

        return $real;
    }

    private static function isSafeName(string $view): bool
    {
        return $view !== ''
            && !str_contains($view, '..')
            && (bool) preg_match('/^[a-z0-9]+(?:[_\-\/][a-z0-9]+)*$/i', $view);
    }
}
