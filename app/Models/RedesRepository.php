<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Config;

/**
 * Catálogo y contenido de la Academia de Redes.
 *
 * Todo el contenido vive en JSON bajo public/assets/redes/data/:
 *
 *   · curso.json        módulos y la lista de lecciones de cada uno
 *   · <modulo>.json     las lecciones completas de ese módulo
 *
 * Los dos archivos los GENERA tools/redes/construir.mjs a partir de
 * tools/redes/contenido/: los ejemplos resueltos se calculan con el mismo
 * motor que corrige los ejercicios en el navegador. El módulo no usa MySQL.
 *
 * Ningún nombre que llegue de la URL se concatena a una ruta: el módulo se
 * busca en curso.json y solo entonces se abre su archivo.
 */
final class RedesRepository
{
    /** @var array<string,array> caché por archivo dentro de la misma petición */
    private static array $cache = [];

    public static function esSlug(string $slug): bool
    {
        return $slug !== '' && \strlen($slug) <= 64 && (bool) preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug);
    }

    /** @return array<mixed> */
    private static function leer(string $nombre): array
    {
        if (isset(self::$cache[$nombre])) {
            return self::$cache[$nombre];
        }
        $ruta = Config::basePath('public/assets/redes/data/' . $nombre . '.json');
        if (!is_readable($ruta)) {
            return self::$cache[$nombre] = [];
        }
        try {
            $datos = json_decode((string) file_get_contents($ruta), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            error_log('[Redes] JSON inválido en ' . $nombre . ': ' . $e->getMessage());
            return self::$cache[$nombre] = [];
        }
        return self::$cache[$nombre] = \is_array($datos) ? $datos : [];
    }

    /** @return list<array> todos los módulos, disponibles o no */
    public static function modulos(): array
    {
        return array_values(self::leer('curso')['modulos'] ?? []);
    }

    /** Módulo publicado (estado «disponible») o null. */
    public static function modulo(string $slug): ?array
    {
        foreach (self::modulos() as $m) {
            if (($m['slug'] ?? '') === $slug) {
                return ($m['estado'] ?? '') === 'disponible' ? $m : null;
            }
        }
        return null;
    }

    /**
     * Lección completa con su posición en el módulo.
     * @return array{meta:array,leccion:array,anterior:?array,siguiente:?array,numero:int}|null
     */
    public static function leccion(string $modulo, string $slug): ?array
    {
        $m = self::modulo($modulo);
        if ($m === null) {
            return null;
        }
        $lista = array_values($m['lecciones'] ?? []);
        foreach ($lista as $i => $meta) {
            if (($meta['slug'] ?? '') !== $slug) {
                continue;
            }
            // $modulo ya está validado contra curso.json: es seguro como nombre de archivo.
            $contenido = self::leer($modulo)['lecciones'][$slug] ?? null;
            if (!\is_array($contenido)) {
                return null;
            }
            return [
                'meta' => $meta, 'leccion' => $contenido, 'numero' => $i + 1,
                'anterior' => $lista[$i - 1] ?? null, 'siguiente' => $lista[$i + 1] ?? null,
            ];
        }
        return null;
    }
}
