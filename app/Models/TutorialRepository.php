<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Config;
use App\Core\Database;
use PDO;
use PDOException;

/**
 * Acceso al catálogo de tutoriales.
 *
 * Estrategia de dos fuentes:
 *   1. MySQL, si hay conexión — permite administrar el catálogo sin desplegar.
 *   2. config/catalog.php, si no la hay — el sitio sigue navegable.
 *
 * Ambas fuentes devuelven filas con exactamente las mismas claves, de forma
 * que las vistas no tienen que saber de dónde vienen los datos.
 */
final class TutorialRepository
{
    /** @var array<string,mixed>|null Catálogo de respaldo, cargado una vez. */
    private static ?array $catalog = null;

    /** Slugs válidos: minúsculas, dígitos y guiones. Nada más. */
    public const SLUG_PATTERN = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';

    public static function isSlug(string $slug): bool
    {
        return strlen($slug) <= 64 && (bool) preg_match(self::SLUG_PATTERN, $slug);
    }

    /** Indica si los datos se están sirviendo desde MySQL. */
    public static function usingDatabase(): bool
    {
        return Database::isConnected();
    }

    /**
     * Todos los tutoriales visibles, ordenados.
     * @return list<array<string,mixed>>
     */
    public static function all(): array
    {
        $pdo = Database::connection();

        if ($pdo instanceof PDO) {
            try {
                $sql = 'SELECT t.slug, t.name, t.tagline, t.description, t.icon,
                               t.view_key, t.status, t.sort_order, c.name AS category
                        FROM tutorials t
                        LEFT JOIN categories c ON c.id = t.category_id
                        WHERE t.status IN (:s1, :s2)
                        ORDER BY t.sort_order ASC, t.name ASC';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':s1' => 'available', ':s2' => 'coming_soon']);
                $rows = $stmt->fetchAll();
                if ($rows !== []) {
                    return $rows;
                }
            } catch (PDOException $e) {
                error_log('[Tutoriales] all() falló, usando catálogo local: ' . $e->getMessage());
            }
        }

        return self::catalog()['tutorials'];
    }

    /**
     * Un tutorial por slug, o null si no existe o no es visible.
     * @return array<string,mixed>|null
     */
    public static function findBySlug(string $slug): ?array
    {
        if (!self::isSlug($slug)) {
            return null;
        }

        $pdo = Database::connection();

        if ($pdo instanceof PDO) {
            try {
                $sql = 'SELECT t.slug, t.name, t.tagline, t.description, t.icon,
                               t.view_key, t.status, t.sort_order, c.name AS category
                        FROM tutorials t
                        LEFT JOIN categories c ON c.id = t.category_id
                        WHERE t.slug = :slug AND t.status IN (:s1, :s2)
                        LIMIT 1';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':slug' => $slug, ':s1' => 'available', ':s2' => 'coming_soon']);
                $row = $stmt->fetch();
                if ($row !== false) {
                    return $row;
                }
            } catch (PDOException $e) {
                error_log('[Tutoriales] findBySlug() falló, usando catálogo local: ' . $e->getMessage());
            }
        }

        foreach (self::catalog()['tutorials'] as $tutorial) {
            if ($tutorial['slug'] === $slug) {
                return $tutorial;
            }
        }
        return null;
    }

    /**
     * Índice de secciones de un tutorial, para el sumario y el scrollspy.
     * @return list<array{anchor:string,label:string,badge:string}>
     */
    public static function sections(string $slug): array
    {
        if (!self::isSlug($slug)) {
            return [];
        }

        $pdo = Database::connection();

        if ($pdo instanceof PDO) {
            // `group_label` agrupa el índice en capítulos. Se añadió en la v1.1.0,
            // así que una base de datos donde todavía no se haya aplicado la
            // migración no tiene la columna: en ese caso se repite la consulta
            // sin ella. Así el parche funciona antes y después de migrar, y el
            // índice se degrada a lista plana en vez de romperse.
            $consultas = [
                'SELECT s.anchor, s.label, s.badge, s.group_label AS `group`
                   FROM tutorial_sections s
                   JOIN tutorials t ON t.id = s.tutorial_id
                  WHERE t.slug = :slug
                  ORDER BY s.sort_order ASC',
                'SELECT s.anchor, s.label, s.badge
                   FROM tutorial_sections s
                   JOIN tutorials t ON t.id = s.tutorial_id
                  WHERE t.slug = :slug
                  ORDER BY s.sort_order ASC',
            ];

            foreach ($consultas as $sql) {
                try {
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([':slug' => $slug]);
                    $rows = $stmt->fetchAll();
                    if ($rows !== []) {
                        return $rows;
                    }
                    break; // consulta correcta pero sin filas: no insistir
                } catch (PDOException $e) {
                    error_log('[Tutoriales] sections(): ' . $e->getMessage());
                }
            }
        }

        return self::catalog()['sections'][$slug] ?? [];
    }

    /**
     * Traduce un view_key a un nombre de vista real.
     *
     * `view_key` procede de la base de datos, es decir, de fuera del código.
     * Solo se acepta si es una CLAVE EXACTA de la whitelist; nunca se
     * concatena a una ruta. Cualquier otro valor devuelve null y el
     * controlador responde 404.
     */
    public static function resolveViewKey(?string $viewKey): ?string
    {
        if ($viewKey === null || $viewKey === '') {
            return null;
        }

        $views = self::catalog()['views'];
        if (!\array_key_exists($viewKey, $views)) {
            error_log('[Tutoriales] view_key fuera de whitelist: ' . $viewKey);
            return null;
        }

        return 'tutorials/' . $views[$viewKey];
    }

    /** @return array{views:array<string,string>,tutorials:list<array<string,mixed>>,sections:array<string,list<array<string,string>>>} */
    private static function catalog(): array
    {
        if (self::$catalog === null) {
            /** @var array $loaded */
            $loaded = require Config::basePath('config/catalog.php');
            self::$catalog = [
                'views'     => $loaded['views'] ?? [],
                'tutorials' => $loaded['tutorials'] ?? [],
                'sections'  => $loaded['sections'] ?? [],
            ];
        }
        return self::$catalog;
    }
}
