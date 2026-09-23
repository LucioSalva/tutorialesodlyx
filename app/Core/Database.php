<?php
declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;

/**
 * Conexión PDO perezosa a MySQL.
 *
 * Principio de diseño: la base de datos es OPCIONAL. Si está desactivada o
 * la conexión falla, connection() devuelve null y el repositorio recurre al
 * catálogo de config/catalog.php. Un fallo de MySQL degrada la
 * administración del catálogo, nunca deja el sitio sin material de estudio.
 *
 * En producción el detalle de la excepción se registra en el log de PHP y
 * jamás se envía al navegador.
 */
final class Database
{
    private static ?PDO $pdo = null;
    private static bool $attempted = false;
    private static ?string $lastError = null;

    public static function connection(): ?PDO
    {
        if (self::$attempted) {
            return self::$pdo;
        }
        self::$attempted = true;

        $db = Config::get('db', []);
        if (empty($db['enabled'])) {
            self::$lastError = 'Base de datos desactivada en configuración.';
            return null;
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            (string) ($db['host'] ?? 'localhost'),
            (int)    ($db['port'] ?? 3306),
            (string) ($db['name'] ?? ''),
            (string) ($db['charset'] ?? 'utf8mb4')
        );

        try {
            self::$pdo = new PDO($dsn, (string) ($db['user'] ?? ''), (string) ($db['pass'] ?? ''), [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                // Sentencias preparadas reales en el servidor, no emuladas:
                // el driver envía SQL y parámetros por separado.
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_STRINGIFY_FETCHES  => false,
            ]);
        } catch (PDOException $e) {
            self::$pdo       = null;
            self::$lastError = $e->getMessage();
            error_log('[Tutoriales] Conexión MySQL fallida: ' . $e->getMessage());
        }

        return self::$pdo;
    }

    public static function isConnected(): bool
    {
        return self::connection() instanceof PDO;
    }

    /** Motivo del último fallo. Solo para mostrarlo en desarrollo. */
    public static function lastError(): ?string
    {
        return self::$lastError;
    }
}
