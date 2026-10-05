<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\View;
use App\Models\RedesRepository as Redes;
use App\Models\TutorialRepository;

/**
 * Academia de Redes.
 *
 * Las lecciones se renderizan en el servidor desde los JSON (se leen sin
 * JavaScript). Los ejercicios, la práctica, los exámenes y las herramientas
 * son JavaScript del navegador: el servidor no recibe respuestas ni progreso.
 *
 * Rutas (todas bajo /redes):
 *   /                             portada
 *   /{modulo}                     lecciones del módulo (subneteo, vlans)
 *   /{modulo}/leccion/{slug}      lección
 *   /{modulo}/practica            ejercicios generados por nivel
 *   /{modulo}/examen              examen
 *   /{modulo}/herramientas        calculadoras del módulo (si las tiene)
 */
final class RedesController
{
    /** Resuelve la ruta; null = 404. */
    public function ruta(array $s): ?string
    {
        $s = array_map(static fn ($x) => strtolower((string) $x), $s);
        foreach ($s as $parte) {
            if (!Redes::esSlug($parte)) {
                return null;
            }
        }
        $n = \count($s);
        if ($n === 0) {
            return $this->index();
        }
        $modulo = Redes::modulo($s[0]);
        if ($modulo === null) {
            return null;
        }
        return match (true) {
            $n === 1 => $this->modulo($modulo),
            $n === 3 && $s[1] === 'leccion' => $this->leccion($modulo, $s[2]),
            $n === 2 && $s[1] === 'practica' => $this->practica($modulo),
            $n === 2 && $s[1] === 'examen' => $this->examen($modulo),
            $n === 2 && $s[1] === 'herramientas' && !empty($modulo['herramientas']) => $this->herramientas($modulo),
            default => null,
        };
    }

    private function render(string $vista, string $titulo, string $desc, array $datos = []): string
    {
        return View::render('redes/' . $vista, $datos + [
            'pageTitle'  => $titulo . ' · Academia de Redes · Tutoriales Lucio',
            'metaDesc'   => $desc,
            'bodyClass'  => 'page-redes redes-' . $vista . (isset($datos['modulo']) ? ' redes-mod-' . $datos['modulo']['slug'] : ''),
            'activeSlug' => null,
            'enRedes'    => true,
            'tutorials'  => TutorialRepository::all(),
            'withRedesAssets' => true,
        ]);
    }

    public function index(): string
    {
        return $this->render('index', 'Academia de Redes',
            'Aprende redes paso a paso: subneteo IPv4 y VLAN explicados bit a bit, con ejemplos resueltos de fácil a experto y ejercicios ilimitados que se corrigen solos.',
            ['modulos' => Redes::modulos()]);
    }

    private function modulo(array $m): string
    {
        return $this->render('modulo', (string) $m['titulo'], (string) $m['resumen'], ['modulo' => $m]);
    }

    private function leccion(array $m, string $slug): ?string
    {
        $l = Redes::leccion((string) $m['slug'], $slug);
        if ($l === null) {
            return null;
        }
        return $this->render('leccion', (string) $l['meta']['titulo'], (string) $l['meta']['resumen'], ['modulo' => $m] + $l);
    }

    private function practica(array $m): string
    {
        return $this->render('practica', 'Práctica de ' . $m['titulo'],
            'Ejercicios de ' . $m['titulo'] . ' generados al momento, por niveles, con pistas y solución paso a paso.', ['modulo' => $m]);
    }

    private function examen(array $m): string
    {
        return $this->render('examen', 'Examen de ' . $m['titulo'],
            'Examen de ' . $m['titulo'] . ' sin pistas, con calificación y revisión paso a paso al terminar.', ['modulo' => $m]);
    }

    private function herramientas(array $m): string
    {
        return $this->render('herramientas', 'Herramientas de ' . $m['titulo'],
            'Calculadora visual de subredes, divisor de redes, planificador VLSM y tabla de prefijos.', ['modulo' => $m]);
    }
}
