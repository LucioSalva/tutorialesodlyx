<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Config;
use App\Core\Database;
use PDO;
use PDOException;

/**
 * Catálogo y contenido de la Academia de Inglés.
 *
 * Mismo principio que AcademiaRepository:
 *
 *   · El CONTENIDO vive en JSON bajo public/assets/ingles/data/. Cada unidad
 *     es un archivo propio (unidades/<slug>.json), así que una lección solo
 *     lee su unidad y nunca el curso entero.
 *   · indice.json guarda las cifras y los metadatos que necesita la portada
 *     (cuántos ejercicios tiene cada unidad…) para no abrir 28 archivos en
 *     cada visita. Lo genera tools/ingles/indice.php; si falta, se calcula.
 *   · MySQL guarda solo METADATOS (migración v1.6.0-ingles.sql). Si no está
 *     disponible, todo funciona igual desde los JSON.
 *
 * Ningún nombre que llegue de la URL se concatena a una ruta sin pasar
 * antes por una whitelist o por el catálogo de curso.json.
 */
final class InglesRepository
{
    /** Archivos de datos que se pueden leer. Cualquier otro nombre se rechaza. */
    private const ARCHIVOS = ['curso', 'indice', 'vocabulario', 'pronunciacion', 'lecturas', 'escucha',
                              'conversaciones', 'escritura', 'juegos', 'examenes', 'tarjetas-gramatica'];

    /** @var array<string,array> caché por archivo dentro de la misma petición */
    private static array $cache = [];

    public static function esSlug(string $slug): bool
    {
        return $slug !== '' && \strlen($slug) <= 64 && (bool) preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug);
    }

    public static function usandoBaseDeDatos(): bool
    {
        return Database::isConnected();
    }

    /** @return array<mixed> */
    private static function leer(string $ruta, string $clave): array
    {
        if (isset(self::$cache[$clave])) {
            return self::$cache[$clave];
        }
        if (!is_readable($ruta)) {
            return self::$cache[$clave] = [];
        }
        try {
            $datos = json_decode((string) file_get_contents($ruta), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            error_log('[Inglés] JSON inválido en ' . $clave . ': ' . $e->getMessage());
            return self::$cache[$clave] = [];
        }
        return self::$cache[$clave] = \is_array($datos) ? $datos : [];
    }

    /** @return array<mixed> */
    public static function datos(string $nombre): array
    {
        if (!\in_array($nombre, self::ARCHIVOS, true)) {
            return [];
        }
        return self::leer(Config::basePath('public/assets/ingles/data/' . $nombre . '.json'), $nombre);
    }

    // ------------------------------------------------------------ currículo

    public static function curso(): array
    {
        return self::datos('curso')['curso'] ?? [];
    }

    /** @return list<array<string,mixed>> */
    public static function bloques(): array
    {
        return self::datos('curso')['bloques'] ?? [];
    }

    public static function bloque(string $slug): ?array
    {
        foreach (self::bloques() as $b) {
            if (($b['slug'] ?? '') === $slug) {
                return $b;
            }
        }
        return null;
    }

    /** @return list<array<string,mixed>> metadatos de todas las unidades, con su disponibilidad */
    public static function unidades(): array
    {
        if (isset(self::$cache['unidades'])) {
            return self::$cache['unidades'];
        }
        $salida = [];
        foreach (self::datos('curso')['unidades'] ?? [] as $u) {
            $u['disponible'] = self::disponible((string) $u['slug']);
            $u['cifras'] = self::indice()['unidades'][$u['slug']] ?? null;
            $salida[] = $u;
        }
        return self::$cache['unidades'] = $salida;
    }

    /** Metadatos de una unidad (de curso.json), o null. */
    public static function unidadMeta(string $slug): ?array
    {
        if (!self::esSlug($slug)) {
            return null;
        }
        foreach (self::unidades() as $u) {
            if ($u['slug'] === $slug) {
                return $u;
            }
        }
        return null;
    }

    /** @return list<array<string,mixed>> unidades de un bloque, en orden */
    public static function unidadesDeBloque(string $bloque): array
    {
        return array_values(array_filter(self::unidades(), static fn (array $u): bool => $u['bloque'] === $bloque));
    }

    /**
     * Una unidad se publica cuando su archivo existe (y el validador lo
     * aprobó antes de desplegarlo). No hay estado «disponible» manual que
     * pueda marcar como lista una unidad vacía.
     */
    public static function disponible(string $slug): bool
    {
        return self::esSlug($slug) && is_file(self::rutaUnidad($slug));
    }

    private static function rutaUnidad(string $slug): string
    {
        return Config::basePath('public/assets/ingles/data/unidades/' . $slug . '.json');
    }

    /** Contenido completo de una unidad. Solo acepta slugs de curso.json. */
    public static function unidad(string $slug): ?array
    {
        $meta = self::unidadMeta($slug);
        if ($meta === null || !$meta['disponible']) {
            return null;
        }
        $datos = self::leer(self::rutaUnidad($slug), 'unidad:' . $slug);
        return $datos === [] ? null : $datos;
    }

    /**
     * Una lección con su contexto: unidad, bloque, posición y vecinas.
     * @return array{unidad: array, meta: array, bloque: ?array, leccion: array, indice: int, total: int, anterior: ?array, siguiente: ?array}|null
     */
    public static function leccion(string $slug): ?array
    {
        if (!self::esSlug($slug)) {
            return null;
        }
        foreach (self::datos('curso')['unidades'] ?? [] as $u) {
            foreach ($u['lecciones'] as $i => $l) {
                if ($l['slug'] !== $slug) {
                    continue;
                }
                $contenido = self::unidad((string) $u['slug']);
                if ($contenido === null) {
                    return null;
                }
                $lecciones = $contenido['lecciones'] ?? [];
                $leccion = $lecciones[$i] ?? null;
                if (!\is_array($leccion) || ($leccion['slug'] ?? '') !== $slug) {
                    return null;
                }
                return [
                    'unidad'    => $contenido,
                    'meta'      => self::unidadMeta((string) $u['slug']),
                    'bloque'    => self::bloque((string) $u['bloque']),
                    'leccion'   => $leccion,
                    'indice'    => $i,
                    'total'     => \count($lecciones),
                    'anterior'  => self::vecina((string) $u['slug'], $i, -1),
                    'siguiente' => self::vecina((string) $u['slug'], $i, +1),
                ];
            }
        }
        return null;
    }

    /**
     * Lección anterior o siguiente en TODO el curso (cruza unidades), saltando
     * las unidades que aún no están publicadas.
     */
    private static function vecina(string $unidad, int $indice, int $paso): ?array
    {
        $plano = [];
        foreach (self::unidades() as $u) {
            if (!$u['disponible']) {
                continue;
            }
            foreach ($u['lecciones'] as $i => $l) {
                $plano[] = ['unidad' => $u['slug'], 'unidad_titulo' => $u['titulo'], 'i' => $i] + $l;
            }
        }
        foreach ($plano as $k => $l) {
            if ($l['unidad'] === $unidad && $l['i'] === $indice) {
                return $plano[$k + $paso] ?? null;
            }
        }
        return null;
    }

    // ------------------------------------------------------------- recursos

    /** @return list<array<string,mixed>> */
    public static function temasVocabulario(): array
    {
        $temas = self::datos('vocabulario')['temas'] ?? [];
        $cuenta = [];
        foreach (self::palabras() as $p) {
            $cuenta[$p['tema']] = ($cuenta[$p['tema']] ?? 0) + 1;
        }
        foreach ($temas as &$t) {
            $t['total'] = $cuenta[$t['slug']] ?? 0;
        }
        return $temas;
    }

    public static function temaVocabulario(string $slug): ?array
    {
        foreach (self::temasVocabulario() as $t) {
            if (($t['slug'] ?? '') === $slug) {
                return $t;
            }
        }
        return null;
    }

    /** @return list<array<string,mixed>> */
    public static function palabras(?string $tema = null): array
    {
        $todas = self::datos('vocabulario')['palabras'] ?? [];
        if ($tema === null) {
            return $todas;
        }
        return array_values(array_filter($todas, static fn (array $p): bool => ($p['tema'] ?? '') === $tema));
    }

    /** Unidades que usan un tema de vocabulario. */
    public static function unidadesDeTema(string $tema): array
    {
        return array_values(array_filter(self::unidades(), static fn (array $u): bool => \in_array($tema, $u['temas_vocabulario'] ?? [], true)));
    }

    public static function pronunciacion(): array
    {
        return self::datos('pronunciacion');
    }

    public static function seccionPronunciacion(string $slug): ?array
    {
        foreach (self::pronunciacion()['secciones'] ?? [] as $s) {
            if (($s['slug'] ?? '') === $slug) {
                return $s;
            }
        }
        return null;
    }

    /** Lista de un archivo de práctica (lecturas, escucha, conversaciones, escritura). */
    public static function practicas(string $tipo): array
    {
        return match ($tipo) {
            'lecturas'       => self::datos('lecturas')['lecturas'] ?? [],
            'escucha'        => self::datos('escucha')['audios'] ?? [],
            'conversaciones' => self::datos('conversaciones')['escenarios'] ?? [],
            'escritura'      => self::datos('escritura')['tareas'] ?? [],
            default          => [],
        };
    }

    public static function practica(string $tipo, string $slug): ?array
    {
        if (!self::esSlug($slug)) {
            return null;
        }
        foreach (self::practicas($tipo) as $p) {
            if (($p['slug'] ?? '') === $slug) {
                return $p;
            }
        }
        return null;
    }

    /** @return list<array<string,mixed>> */
    public static function juegos(): array
    {
        return self::datos('juegos')['juegos'] ?? [];
    }

    public static function juego(string $slug): ?array
    {
        foreach (self::juegos() as $j) {
            if (($j['slug'] ?? '') === $slug) {
                return $j;
            }
        }
        return null;
    }

    public static function examen(string $slug): ?array
    {
        if (!self::esSlug($slug)) {
            return null;
        }
        foreach (self::datos('examenes')['examenes'] ?? [] as $x) {
            if (($x['slug'] ?? '') === $slug) {
                return $x;
            }
        }
        return null;
    }

    /** Tarjetas de gramática de las unidades publicadas (repaso espaciado). */
    public static function tarjetasGramatica(): array
    {
        $t = self::datos('tarjetas-gramatica')['tarjetas'] ?? null;
        if (\is_array($t)) {
            return $t;
        }
        // Sin archivo generado: se reúnen desde las unidades (más lento, mismo resultado).
        $salida = [];
        foreach (self::unidades() as $u) {
            $contenido = $u['disponible'] ? self::unidad($u['slug']) : null;
            foreach ($contenido['lecciones'] ?? [] as $l) {
                foreach ($l['repaso'] ?? [] as $r) {
                    $salida[] = $r + ['leccion' => $l['slug'], 'leccion_titulo' => $l['titulo'], 'unidad' => $u['slug']];
                }
            }
        }
        return $salida;
    }

    // --------------------------------------------------------------- cifras

    /** Índice generado por tools/ingles/indice.php (o calculado al vuelo). */
    public static function indice(): array
    {
        $i = self::datos('indice');
        if ($i !== []) {
            return $i;
        }
        if (isset(self::$cache['indice:calculado'])) {
            return self::$cache['indice:calculado'];
        }
        $unidades = [];
        foreach (self::datos('curso')['unidades'] ?? [] as $u) {
            $slug = (string) $u['slug'];
            if (!is_file(self::rutaUnidad($slug))) {
                continue;
            }
            $c = self::leer(self::rutaUnidad($slug), 'unidad:' . $slug);
            $ej = 0;
            foreach ($c['lecciones'] ?? [] as $l) {
                $ej += \count($l['ejercicios'] ?? []);
            }
            $unidades[$slug] = [
                'lecciones'  => \count($c['lecciones'] ?? []),
                'ejercicios' => $ej,
                'evaluacion' => \count($c['evaluacion']['preguntas'] ?? []),
            ];
        }
        return self::$cache['indice:calculado'] = ['unidades' => $unidades];
    }

    /**
     * Cifras reales del curso publicado para la portada. Todo sale de los
     * datos: si una unidad no está, no cuenta.
     * @return array<string,int>
     */
    public static function estadisticas(): array
    {
        $ind = self::indice()['unidades'] ?? [];
        $lecciones = $ejercicios = $preguntas = 0;
        foreach ($ind as $u) {
            $lecciones  += (int) ($u['lecciones'] ?? 0);
            $ejercicios += (int) ($u['ejercicios'] ?? 0);
            $preguntas  += (int) ($u['evaluacion'] ?? 0);
        }
        $examenes = self::datos('examenes')['examenes'] ?? [];
        $niveles = 0;
        foreach (self::juegos() as $j) {
            $niveles += \count($j['niveles'] ?? []);
        }
        return [
            'unidades'        => \count($ind),
            'unidades_total'  => \count(self::datos('curso')['unidades'] ?? []),
            'lecciones'       => $lecciones,
            'ejercicios'      => $ejercicios,
            'preguntas'       => $preguntas,
            'palabras'        => \count(self::palabras()),
            'lecturas'        => \count(self::practicas('lecturas')),
            'audios'          => \count(self::practicas('escucha')),
            'conversaciones'  => \count(self::practicas('conversaciones')),
            'escritura'       => \count(self::practicas('escritura')),
            'juegos'          => \count(self::juegos()),
            'niveles'         => $niveles,
            'examenes'        => \count($examenes),
        ];
    }

    /**
     * Metadatos de las unidades desde MySQL cuando está disponible (migración
     * v1.6.0-ingles.sql). El contenido sigue viniendo del JSON.
     * @return list<array<string,mixed>>
     */
    public static function unidadesBD(): array
    {
        $pdo = Database::connection();
        if (!$pdo instanceof PDO) {
            return [];
        }
        try {
            $stmt = $pdo->prepare(
                'SELECT u.slug, u.numero, u.titulo, u.nivel, b.slug AS bloque
                   FROM ingles_unidades u
                   JOIN ingles_bloques b ON b.id = u.bloque_id
                  ORDER BY u.numero ASC'
            );
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log('[Inglés] unidadesBD(): ' . $e->getMessage());
            return [];
        }
    }
}
