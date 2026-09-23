<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\View;
use App\Models\AcademiaRepository;
use App\Models\TutorialRepository;

/**
 * Academia de Comandos.
 *
 * Todas las páginas se renderizan en el servidor con el layout de siempre;
 * el simulador, los juegos y el progreso son JavaScript del navegador. El
 * servidor NUNCA recibe ni ejecuta comandos del estudiante: no hay ningún
 * endpoint que acepte una línea de terminal.
 */
final class AcademiaController
{
    /** Datos comunes a todas las vistas de la academia. */
    private function base(string $titulo, string $desc, string $vista): array
    {
        return [
            'pageTitle'   => $titulo . ' · Academia de Comandos · Tutoriales Lucio',
            'metaDesc'    => $desc,
            'bodyClass'   => 'page-academia academia-' . $vista,
            'activeSlug'  => null,
            'enAcademia'  => true,
            'tutorials'   => TutorialRepository::all(),
            'sistemas'    => AcademiaRepository::sistemas(),
            'estadisticas' => AcademiaRepository::estadisticas(),
            'withAcademiaAssets' => true,
        ];
    }

    /** Portada: elegir sistema, ver progreso y continuar donde lo dejaste. */
    public function index(): string
    {
        return View::render('academia/index', $this->base(
            'Academia de Comandos',
            'Aprende, practica y memoriza comandos de Linux, CMD y PowerShell con terminal simulada, misiones y videojuegos.',
            'index'
        ) + [
            'juegos'       => AcademiaRepository::juegos(),
            'comparativas' => \array_slice(AcademiaRepository::comparativas(), 0, 6),
        ]);
    }

    /** Ruta de aprendizaje de un sistema. */
    public function sistema(string $os): ?string
    {
        if (!AcademiaRepository::esSistema($os)) {
            return null;
        }
        $meta = AcademiaRepository::sistema($os);

        return View::render('academia/sistema', $this->base(
            $meta['nombre'],
            (string) ($meta['resumen'] ?? ''),
            'sistema'
        ) + [
            'os'          => $os,
            'meta'        => $meta,
            'categorias'  => AcademiaRepository::categorias($os),
            'misiones'    => AcademiaRepository::misiones($os),
            'escenarios'  => AcademiaRepository::escenarios($os),
        ]);
    }

    /** Ficha completa de un comando. */
    public function comando(string $os, string $slug): ?string
    {
        if (!AcademiaRepository::esSistema($os) || !AcademiaRepository::esSlug($slug)) {
            return null;
        }
        $comando = AcademiaRepository::comando($os, $slug);
        if ($comando === null) {
            return null;
        }

        $todos = AcademiaRepository::comandos($os);
        $indice = null;
        foreach ($todos as $i => $c) {
            if (($c['slug'] ?? '') === $slug) {
                $indice = $i;
                break;
            }
        }

        return View::render('academia/comando', $this->base(
            ($comando['nombre'] ?? $slug) . ' · ' . AcademiaRepository::sistema($os)['nombre'],
            (string) ($comando['resumen'] ?? ''),
            'comando'
        ) + [
            'os'        => $os,
            'meta'      => AcademiaRepository::sistema($os),
            'comando'   => $comando,
            'anterior'  => $indice !== null && $indice > 0 ? $todos[$indice - 1] : null,
            'siguiente' => $indice !== null && isset($todos[$indice + 1]) ? $todos[$indice + 1] : null,
            'escenario' => AcademiaRepository::escenarios($os)[0] ?? null,
        ]);
    }

    /** Terminal de práctica libre. */
    public function practica(string $os): ?string
    {
        if (!AcademiaRepository::esSistema($os)) {
            return null;
        }
        return View::render('academia/practica', $this->base(
            'Práctica libre · ' . AcademiaRepository::sistema($os)['nombre'],
            'Terminal simulada para practicar sin límite de intentos y sin riesgo.',
            'practica'
        ) + [
            'os'         => $os,
            'meta'       => AcademiaRepository::sistema($os),
            'escenarios' => AcademiaRepository::escenarios($os),
            'comandos'   => AcademiaRepository::comandos($os),
        ]);
    }

    /** Lista de misiones de un sistema. */
    public function misiones(string $os): ?string
    {
        if (!AcademiaRepository::esSistema($os)) {
            return null;
        }
        return View::render('academia/misiones', $this->base(
            'Misiones · ' . AcademiaRepository::sistema($os)['nombre'],
            'Ejercicios guiados con pistas progresivas y solución razonada.',
            'misiones'
        ) + [
            'os'       => $os,
            'meta'     => AcademiaRepository::sistema($os),
            'misiones' => AcademiaRepository::misiones($os),
        ]);
    }

    /** Laboratorio de combinaciones: tuberías y comandos encadenados. */
    public function combinaciones(string $os): ?string
    {
        if (!AcademiaRepository::esSistema($os)) {
            return null;
        }
        $misiones = array_values(array_filter(
            AcademiaRepository::misiones($os),
            static fn (array $m): bool => \in_array('combinaciones', $m['etiquetas'] ?? [], true)
        ));

        return View::render('academia/combinaciones', $this->base(
            'Laboratorio de combinaciones · ' . AcademiaRepository::sistema($os)['nombre'],
            'Aprende a encadenar comandos con tuberías, filtros y redirecciones.',
            'combinaciones'
        ) + [
            'os'       => $os,
            'meta'     => AcademiaRepository::sistema($os),
            'misiones' => $misiones,
            'escenarios' => AcademiaRepository::escenarios($os),
        ]);
    }

    /** Índice de videojuegos. */
    public function juegos(): string
    {
        return View::render('academia/juegos', $this->base(
            'Videojuegos',
            'Doce juegos para practicar comandos: laberintos, rescates, investigación, permisos y misiones finales.',
            'juegos'
        ) + ['juegos' => AcademiaRepository::juegos()]);
    }

    /** Un videojuego concreto. */
    public function juego(string $slug): ?string
    {
        $juego = AcademiaRepository::juego($slug);
        if ($juego === null) {
            return null;
        }
        return View::render('academia/juego', $this->base(
            (string) ($juego['nombre'] ?? $slug),
            (string) ($juego['resumen'] ?? ''),
            'juego'
        ) + [
            'juego'      => $juego,
            'escenarios' => AcademiaRepository::escenarios(),
        ]);
    }

    /** Repaso espaciado: «mis comandos difíciles». */
    public function repaso(): string
    {
        $fichas = [];
        foreach (AcademiaRepository::SISTEMAS as $os) {
            foreach (AcademiaRepository::comandos($os) as $comando) {
                $fichas[] = [
                    'id'       => $os . ':' . ($comando['slug'] ?? ''),
                    'os'       => $os,
                    'nombre'   => $comando['nombre'] ?? '',
                    'resumen'  => $comando['resumen'] ?? '',
                    'sintaxis' => $comando['sintaxis'] ?? '',
                    'pregunta' => $comando['pregunta_repaso'] ?? null,
                ];
            }
        }

        return View::render('academia/repaso', $this->base(
            'Repasar mis comandos',
            'Repetición espaciada: lo que fallas vuelve antes, lo que dominas se espacia.',
            'repaso'
        ) + ['fichas' => $fichas]);
    }

    /** Comparador Linux / CMD / PowerShell. */
    public function comparar(): string
    {
        return View::render('academia/comparar', $this->base(
            'Comparar los tres sistemas',
            'La misma tarea resuelta en Linux, CMD y PowerShell, con sus diferencias reales de sintaxis y comportamiento.',
            'comparar'
        ) + ['comparativas' => AcademiaRepository::comparativas()]);
    }

    /** Buscador de comandos (server-side, sin JavaScript obligatorio). */
    public function buscar(string $consulta, ?string $os = null): string
    {
        $consulta = mb_substr(trim($consulta), 0, 80);
        $resultados = $consulta === '' ? [] : AcademiaRepository::buscar($consulta, $os);

        return View::render('academia/buscar', $this->base(
            'Buscar comandos',
            'Busca un comando por nombre, por lo que hace o por categoría, en los tres sistemas a la vez.',
            'buscar'
        ) + [
            'consulta'   => $consulta,
            'osFiltro'   => $os,
            'resultados' => $resultados,
        ]);
    }
}
