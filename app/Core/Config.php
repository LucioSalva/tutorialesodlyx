<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Carga y expone la configuración de la aplicación.
 *
 * Fuente: config/config.php (copiado de config.example.php). Si no existe,
 * se usan valores por defecto seguros con la base de datos desactivada, de
 * modo que un checkout limpio arranca sin configurar nada.
 */
final class Config
{
    private static ?array $data = null;

    /** Raíz del proyecto (un nivel por encima de app/). */
    public static function basePath(string $append = ''): string
    {
        $root = \dirname(__DIR__, 2);
        return $append === '' ? $root : $root . '/' . ltrim($append, '/');
    }

    public static function all(): array
    {
        if (self::$data !== null) {
            return self::$data;
        }

        $defaults = [
            'env'       => 'production',
            'db'        => ['enabled' => false, 'host' => 'localhost', 'port' => 3306,
                            'name' => '', 'user' => '', 'pass' => '', 'charset' => 'utf8mb4'],
            'base_url'  => '',
            'site_name' => 'Tutoriales Lucio',
            'brand'     => 'CODLYX',
        ];

        $file   = self::basePath('config/config.php');
        $loaded = is_readable($file) ? require $file : [];
        if (!\is_array($loaded)) {
            $loaded = [];
        }

        // Mezcla superficial + mezcla del subarray db, suficiente para esta config.
        $merged       = array_merge($defaults, $loaded);
        $merged['db'] = array_merge($defaults['db'], $loaded['db'] ?? []);

        return self::$data = $merged;
    }

    /** Acceso puntual con notación de punto: Config::get('db.host'). */
    public static function get(string $key, mixed $default = null): mixed
    {
        $value = self::all();
        foreach (explode('.', $key) as $segment) {
            if (!\is_array($value) || !\array_key_exists($segment, $value)) {
                return $default;
            }
            $value = $value[$segment];
        }
        return $value;
    }

    public static function isProduction(): bool
    {
        return self::get('env') !== 'development';
    }

    /**
     * URL base pública, terminada SIN barra final.
     *
     * Si config.base_url está vacía se deduce de la petición, lo que permite
     * desplegar en dominio, subdominio o subdirectorio sin tocar configuración
     * ni hardcodear rutas de HostGator.
     */
    public static function baseUrl(): string
    {
        $configured = trim((string) self::get('base_url', ''));
        if ($configured !== '') {
            return rtrim($configured, '/');
        }

        $https  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
               || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
               || ((int) ($_SERVER['SERVER_PORT'] ?? 80) === 443);
        $scheme = $https ? 'https' : 'http';
        $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';

        // SCRIPT_NAME apunta a .../public/index.php; su carpeta es la raíz web.
        $dir = str_replace('\\', '/', \dirname($_SERVER['SCRIPT_NAME'] ?? '/index.php'));
        $dir = ($dir === '/' || $dir === '.') ? '' : rtrim($dir, '/');

        return $scheme . '://' . $host . $dir;
    }
}
