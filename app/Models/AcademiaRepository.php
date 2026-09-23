<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Config;
use App\Core\Database;
use PDO;
use PDOException;

/**
 * Catálogo de la Academia de Comandos.
 *
 * Igual que TutorialRepository, funciona con y sin MySQL:
 *
 *   · El CONTENIDO (fichas de comandos, misiones, escenarios, niveles de
 *     juego) vive en JSON bajo public/assets/academia/data/. Es el mismo
 *     archivo que descarga el navegador para el simulador y los juegos,
 *     así que servidor y cliente nunca se contradicen.
 *   · MySQL guarda solo METADATOS del catálogo (qué comandos existen, de
 *     qué sistema, en qué categoría y con qué dificultad) para poder
 *     listarlos, buscarlos y ordenarlos sin leer todos los JSON.
 *
 * Si la base de datos no está disponible, se sirve todo desde los JSON y
 * la academia sigue funcionando entera.
 */
final class AcademiaRepository
{
    public const SISTEMAS = ['linux', 'cmd', 'powershell'];

    /** @var array<string,array> caché por archivo dentro de la misma petición */
    private static array $cache = [];

    public static function esSistema(string $os): bool
    {
        return \in_array($os, self::SISTEMAS, true);
    }

    /** Slug de comando: letras, dígitos y guiones. Nunca se usa como ruta. */
    public static function esSlug(string $slug): bool
    {
        return $slug !== '' && \strlen($slug) <= 64 && (bool) preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug);
    }

    public static function usandoBaseDeDatos(): bool
    {
        return Database::isConnected();
    }

    /**
     * Carga un archivo de datos validando el nombre contra una whitelist.
     * @return array<mixed>
     */
    private static function datos(string $nombre): array
    {
        $permitidos = ['comandos-linux', 'comandos-cmd', 'comandos-powershell',
                       'escenarios', 'misiones', 'juegos', 'comparativas'];
        if (!\in_array($nombre, $permitidos, true)) {
            return [];
        }
        if (isset(self::$cache[$nombre])) {
            return self::$cache[$nombre];
        }

        $ruta = Config::basePath('public/assets/academia/data/' . $nombre . '.json');
        if (!is_readable($ruta)) {
            return self::$cache[$nombre] = [];
        }

        $crudo = (string) file_get_contents($ruta);
        try {
            $datos = json_decode($crudo, true, 64, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            error_log('[Academia] JSON inválido en ' . $nombre . ': ' . $e->getMessage());
            return self::$cache[$nombre] = [];
        }

        return self::$cache[$nombre] = \is_array($datos) ? $datos : [];
    }

    /** @return list<array<string,mixed>> fichas de comandos de un sistema */
    public static function comandos(string $os): array
    {
        if (!self::esSistema($os)) {
            return [];
        }
        $datos = self::datos('comandos-' . $os);
        return $datos['comandos'] ?? [];
    }

    /** Ficha completa de un comando, o null. */
    public static function comando(string $os, string $slug): ?array
    {
        if (!self::esSlug($slug)) {
            return null;
        }
        foreach (self::comandos($os) as $comando) {
            if (($comando['slug'] ?? '') === $slug) {
                return $comando;
            }
        }
        return null;
    }

    /** Categorías de un sistema, con sus comandos ya agrupados. */
    public static function categorias(string $os): array
    {
        $datos = self::datos('comandos-' . $os);
        $categorias = $datos['categorias'] ?? [];
        $porCategoria = [];

        foreach (self::comandos($os) as $comando) {
            $clave = (string) ($comando['categoria'] ?? 'otros');
            $porCategoria[$clave][] = $comando;
        }

        $salida = [];
        foreach ($categorias as $categoria) {
            $clave = (string) ($categoria['slug'] ?? '');
            $salida[] = $categoria + ['comandos' => $porCategoria[$clave] ?? []];
        }
        return $salida;
    }

    /** Metadatos de un sistema: nombre, shell, prompt, descripción. */
    public static function sistema(string $os): array
    {
        $datos = self::datos('comandos-' . $os);
        $meta = $datos['sistema'] ?? [];
        return $meta + [
            'slug'    => $os,
            'nombre'  => ucfirst($os),
            'shell'   => $os,
            'prompt'  => '$',
            'resumen' => '',
        ];
    }

    /** Los tres sistemas con su resumen y sus cifras reales. */
    public static function sistemas(): array
    {
        $salida = [];
        foreach (self::SISTEMAS as $os) {
            $meta = self::sistema($os);
            $meta['total_comandos'] = \count(self::comandos($os));
            $meta['total_misiones'] = \count(self::misiones($os));
            $salida[] = $meta;
        }
        return $salida;
    }

    /** @return list<array<string,mixed>> */
    public static function misiones(?string $os = null): array
    {
        $todas = self::datos('misiones')['misiones'] ?? [];
        if ($os === null) {
            return $todas;
        }
        return array_values(array_filter($todas, static fn (array $m): bool => ($m['os'] ?? '') === $os));
    }

    public static function mision(string $id): ?array
    {
        foreach (self::misiones() as $mision) {
            if (($mision['id'] ?? '') === $id) {
                return $mision;
            }
        }
        return null;
    }

    /** @return list<array<string,mixed>> */
    public static function escenarios(?string $os = null): array
    {
        $todos = self::datos('escenarios')['escenarios'] ?? [];
        if ($os === null) {
            return $todos;
        }
        return array_values(array_filter($todos, static fn (array $e): bool => ($e['os'] ?? '') === $os));
    }

    /** @return list<array<string,mixed>> */
    public static function juegos(): array
    {
        return self::datos('juegos')['juegos'] ?? [];
    }

    public static function juego(string $slug): ?array
    {
        if (!self::esSlug($slug)) {
            return null;
        }
        foreach (self::juegos() as $juego) {
            if (($juego['slug'] ?? '') === $slug) {
                return $juego;
            }
        }
        return null;
    }

    /** Tabla de equivalencias entre los tres sistemas. */
    public static function comparativas(): array
    {
        return self::datos('comparativas')['tareas'] ?? [];
    }

    /**
     * Búsqueda por nombre, resumen, categoría o palabras clave.
     * Devuelve resultados de los tres sistemas para poder compararlos.
     *
     * @return list<array<string,mixed>>
     */
    public static function buscar(string $consulta, ?string $os = null, int $limite = 40): array
    {
        $aguja = self::normalizar($consulta);
        if ($aguja === '') {
            return [];
        }

        $resultados = [];
        foreach (self::SISTEMAS as $sistema) {
            if ($os !== null && $os !== $sistema) {
                continue;
            }
            foreach (self::comandos($sistema) as $comando) {
                $heno = self::normalizar(implode(' ', [
                    $comando['nombre'] ?? '',
                    $comando['resumen'] ?? '',
                    $comando['categoria'] ?? '',
                    implode(' ', $comando['palabras_clave'] ?? []),
                    $comando['explicacion_sencilla'] ?? '',
                ]));
                if (!str_contains($heno, $aguja)) {
                    continue;
                }
                $peso = str_starts_with(self::normalizar((string) ($comando['nombre'] ?? '')), $aguja) ? 0 : 1;
                $resultados[] = ['peso' => $peso, 'os' => $sistema, 'comando' => $comando];
            }
        }

        usort($resultados, static fn (array $a, array $b): int => $a['peso'] <=> $b['peso']);
        return \array_slice($resultados, 0, $limite);
    }

    /** minúsculas y sin acentos, para que «mover» encuentre «MOVER». */
    public static function normalizar(string $texto): string
    {
        $texto = mb_strtolower(trim($texto), 'UTF-8');
        return strtr($texto, [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
        ]);
    }

    /**
     * Cifras para el panel: salen de los datos reales, no de constantes.
     * @return array<string,int>
     */
    public static function estadisticas(): array
    {
        $comandos = 0;
        foreach (self::SISTEMAS as $os) {
            $comandos += \count(self::comandos($os));
        }
        $niveles = 0;
        foreach (self::juegos() as $juego) {
            $niveles += \count($juego['niveles'] ?? []);
        }
        return [
            'comandos'  => $comandos,
            'misiones'  => \count(self::misiones()),
            'juegos'    => \count(self::juegos()),
            'niveles'   => $niveles,
            'escenarios' => \count(self::escenarios()),
        ];
    }

    /**
     * Metadatos desde MySQL cuando está disponible. Hoy sirve para el
     * buscador del servidor y para administrar el catálogo sin desplegar;
     * el contenido sigue viniendo del JSON.
     *
     * @return list<array<string,mixed>>
     */
    public static function catalogoBD(?string $os = null): array
    {
        $pdo = Database::connection();
        if (!$pdo instanceof PDO) {
            return [];
        }
        try {
            $sql = 'SELECT c.slug, c.nombre, c.os, c.categoria, c.resumen, c.dificultad, c.sort_order
                      FROM academia_comandos c
                     WHERE (:os IS NULL OR c.os = :os2)
                     ORDER BY c.os ASC, c.sort_order ASC, c.nombre ASC';
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':os' => $os, ':os2' => $os]);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log('[Academia] catalogoBD(): ' . $e->getMessage());
            return [];
        }
    }
}
