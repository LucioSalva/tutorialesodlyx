<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\View;
use App\Models\InglesRepository as Ingles;
use App\Models\TutorialRepository;

/**
 * Academia de Inglés.
 *
 * Las páginas se renderizan en el servidor desde los JSON del curso (se
 * pueden leer sin JavaScript). La corrección de ejercicios, el audio, las
 * tarjetas, los juegos y el progreso son JavaScript del navegador: el
 * servidor no recibe respuestas, grabaciones ni progreso del estudiante.
 *
 * Rutas (todas bajo /ingles):
 *   /                              portada y ruta académica
 *   /unidad/{u}                    unidad
 *   /unidad/{u}/evaluacion         evaluación de la unidad
 *   /leccion/{l}                   lección
 *   /examen/{x}                    examen acumulativo de un bloque
 *   /vocabulario[/{tema}]          vocabulario por temas
 *   /tarjetas                      tarjetas de memorización
 *   /repaso                        repaso espaciado
 *   /pronunciacion[/{seccion}]     guía y práctica de pronunciación
 *   /practica                      lecturas, escucha, conversación y escritura
 *   /{lecturas|escucha|conversaciones|escritura}/{slug}
 *   /juegos[/{juego}]              juegos
 *   /progreso                      panel de progreso
 *   /audio                         cómo funciona el audio y elegir voz
 */
final class InglesController
{
    private const PRACTICAS = ['lecturas', 'escucha', 'conversaciones', 'escritura'];

    /** Resuelve la ruta; null = 404. */
    public function ruta(array $s): ?string
    {
        $s = array_map(static fn ($x) => strtolower((string) $x), $s);
        foreach ($s as $parte) {
            if (!Ingles::esSlug($parte)) {
                return null;
            }
        }
        $n = \count($s);
        $a = $s[0] ?? null;
        $b = $s[1] ?? null;

        return match (true) {
            $n === 0 => $this->index(),
            $n === 2 && $a === 'unidad' => $this->unidad($b),
            $n === 3 && $a === 'unidad' && $s[2] === 'evaluacion' => $this->evaluacion($b),
            $n === 2 && $a === 'leccion' => $this->leccion($b),
            $n === 2 && $a === 'examen' => $this->examen($b),
            $n === 1 && $a === 'vocabulario' => $this->vocabulario(),
            $n === 2 && $a === 'vocabulario' => $this->tema($b),
            $n === 1 && $a === 'tarjetas' => $this->tarjetas(),
            $n === 1 && $a === 'repaso' => $this->repaso(),
            $n === 1 && $a === 'pronunciacion' => $this->pronunciacion(),
            $n === 2 && $a === 'pronunciacion' => $this->seccionPronunciacion($b),
            $n === 1 && $a === 'practica' => $this->practicaIndice(),
            $n === 2 && \in_array($a, self::PRACTICAS, true) => $this->practica($a, $b),
            $n === 1 && $a === 'juegos' => $this->juegos(),
            $n === 2 && $a === 'juegos' => $this->juego($b),
            $n === 1 && $a === 'progreso' => $this->progreso(),
            $n === 1 && $a === 'audio' => $this->audio(),
            default => null,
        };
    }

    /** Datos comunes a todas las vistas del módulo. */
    private function base(string $titulo, string $desc, string $vista): array
    {
        return [
            'pageTitle'  => $titulo . ' · Academia de Inglés · Tutoriales Lucio',
            'metaDesc'   => $desc,
            'bodyClass'  => 'page-ingles ingles-' . $vista,
            'activeSlug' => null,
            'enIngles'   => true,
            'tutorials'  => TutorialRepository::all(),
            'withInglesAssets' => true,
        ];
    }

    private function render(string $vista, string $titulo, string $desc, array $datos = []): string
    {
        return View::render('ingles/' . $vista, $this->base($titulo, $desc, $vista) + $datos);
    }

    public function index(): string
    {
        $bloques = [];
        foreach (Ingles::bloques() as $b) {
            $b['unidades_meta'] = Ingles::unidadesDeBloque((string) $b['slug']);
            $b['examen_disponible'] = Ingles::examen((string) ($b['examen'] ?? '')) !== null;
            $bloques[] = $b;
        }
        return $this->render('index', 'Academia de Inglés',
            'Curso original de inglés desde cero, orientado a A1–A2: gramática, vocabulario, pronunciación, escucha, lectura, escritura, conversación, juegos y repaso espaciado.',
            ['curso' => Ingles::curso(), 'bloques' => $bloques, 'estadisticas' => Ingles::estadisticas(),
             'juegos' => Ingles::juegos(), 'temas' => Ingles::temasVocabulario()]);
    }

    public function unidad(string $slug): ?string
    {
        $meta = Ingles::unidadMeta($slug);
        $contenido = Ingles::unidad($slug);
        if ($meta === null || $contenido === null) {
            return null;
        }
        $prerrequisitos = array_values(array_filter(array_map([Ingles::class, 'unidadMeta'], $meta['prerrequisitos'])));
        $temas = array_values(array_filter(array_map([Ingles::class, 'temaVocabulario'], $meta['temas_vocabulario'])));
        return $this->render('unidad', 'Unidad ' . $meta['numero'] . ': ' . $meta['titulo'], (string) $meta['resumen'], [
            'meta' => $meta, 'unidad' => $contenido, 'bloque' => Ingles::bloque((string) $meta['bloque']),
            'prerrequisitos' => $prerrequisitos, 'temas' => $temas,
        ]);
    }

    public function evaluacion(string $slug): ?string
    {
        $meta = Ingles::unidadMeta($slug);
        $contenido = Ingles::unidad($slug);
        if ($meta === null || $contenido === null || empty($contenido['evaluacion']['preguntas'])) {
            return null;
        }
        $titulos = [];
        foreach ($contenido['lecciones'] as $l) {
            $titulos[$l['slug']] = $l['titulo'];
        }
        return $this->render('evaluacion', $contenido['evaluacion']['titulo'] ?? 'Evaluación',
            'Evaluación de la unidad ' . $meta['numero'] . ' con resultados explicados y temas para repasar.', [
            'meta' => $meta, 'bloque' => Ingles::bloque((string) $meta['bloque']),
            'evaluacion' => $contenido['evaluacion'], 'titulosLecciones' => $titulos,
        ]);
    }

    public function leccion(string $slug): ?string
    {
        $l = Ingles::leccion($slug);
        if ($l === null) {
            return null;
        }
        return $this->render('leccion', $l['leccion']['titulo'], 'Lección de la unidad ' . $l['meta']['numero'] . ': ' . ($l['meta']['lecciones'][$l['indice']]['resumen'] ?? ''), $l);
    }

    public function examen(string $slug): ?string
    {
        $x = Ingles::examen($slug);
        if ($x === null) {
            return null;
        }
        $bloque = Ingles::bloque((string) $x['bloque']);
        $titulosUnidades = [];
        foreach (Ingles::unidades() as $u) {
            $titulosUnidades[$u['slug']] = ['titulo' => $u['titulo'], 'numero' => $u['numero'], 'disponible' => $u['disponible']];
        }
        return $this->render('examen', (string) $x['titulo'],
            'Examen acumulativo del bloque ' . ($bloque['numero'] ?? '') . ' con preguntas de bloques anteriores para favorecer la retención.',
            ['examen' => $x, 'bloque' => $bloque, 'titulosUnidades' => $titulosUnidades]);
    }

    public function vocabulario(): string
    {
        return $this->render('vocabulario', 'Vocabulario', 'Vocabulario por temas con pronunciación, audio, ejemplos y relación con las lecciones.', [
            'temas' => Ingles::temasVocabulario(), 'total' => \count(Ingles::palabras()),
        ]);
    }

    public function tema(string $slug): ?string
    {
        $tema = Ingles::temaVocabulario($slug);
        if ($tema === null) {
            return null;
        }
        return $this->render('tema', 'Vocabulario: ' . $tema['nombre'], (string) ($tema['descripcion'] ?? ''), [
            'tema' => $tema, 'palabras' => Ingles::palabras($slug), 'unidades' => Ingles::unidadesDeTema($slug),
            'temas' => Ingles::temasVocabulario(),
        ]);
    }

    public function tarjetas(): string
    {
        return $this->render('tarjetas', 'Tarjetas de memorización',
            'Tarjetas de vocabulario en cinco modalidades: inglés → español, español → inglés, audio, imagen y completar la oración.',
            ['temas' => Ingles::temasVocabulario()]);
    }

    public function repaso(): string
    {
        return $this->render('repaso', 'Repaso espaciado',
            'Repetición espaciada de vocabulario y gramática: lo que fallas vuelve pronto, lo que dominas se espacia.',
            ['temas' => Ingles::temasVocabulario()]);
    }

    public function pronunciacion(): string
    {
        return $this->render('pronunciacion', 'Pronunciación',
            'Cómo suena el inglés: vocales, consonantes, AFI, acento, ritmo, entonación, contracciones y diferencias entre el inglés británico y el estadounidense.',
            ['pron' => Ingles::pronunciacion()]);
    }

    public function seccionPronunciacion(string $slug): ?string
    {
        $s = Ingles::seccionPronunciacion($slug);
        if ($s === null) {
            return null;
        }
        $secciones = Ingles::pronunciacion()['secciones'] ?? [];
        return $this->render('pronunciacion-seccion', 'Pronunciación: ' . $s['titulo'], (string) $s['resumen'], [
            'seccion' => $s, 'secciones' => $secciones, 'afi' => Ingles::pronunciacion()['afi'] ?? [],
        ]);
    }

    public function practicaIndice(): string
    {
        $unidades = [];
        foreach (Ingles::unidades() as $u) {
            $unidades[$u['slug']] = $u;
        }
        return $this->render('practica', 'Práctica de habilidades',
            'Lecturas graduadas, comprensión auditiva, conversaciones interactivas y tareas de escritura.', [
            'lecturas' => Ingles::practicas('lecturas'), 'escucha' => Ingles::practicas('escucha'),
            'conversaciones' => Ingles::practicas('conversaciones'), 'escritura' => Ingles::practicas('escritura'),
            'unidadesPorSlug' => $unidades,
        ]);
    }

    public function practica(string $tipo, string $slug): ?string
    {
        $p = Ingles::practica($tipo, $slug);
        if ($p === null) {
            return null;
        }
        $vista = ['lecturas' => 'lectura', 'escucha' => 'escucha', 'conversaciones' => 'conversacion', 'escritura' => 'escritura'][$tipo];
        return $this->render($vista, (string) $p['titulo'], (string) ($p['resumen'] ?? $p['contexto'] ?? $p['objetivo'] ?? ''), [
            'p' => $p, 'unidadRel' => Ingles::unidadMeta((string) ($p['unidad'] ?? '')),
        ]);
    }

    public function juegos(): string
    {
        return $this->render('juegos', 'Juegos', 'Diez juegos para practicar gramática, vocabulario, escucha y conversación, con niveles, pistas y soluciones.', [
            'juegos' => Ingles::juegos(),
        ]);
    }

    public function juego(string $slug): ?string
    {
        $j = Ingles::juego($slug);
        if ($j === null) {
            return null;
        }
        return $this->render('juego', (string) $j['nombre'], (string) $j['resumen'], ['juego' => $j]);
    }

    public function progreso(): string
    {
        return $this->render('progreso', 'Mi progreso',
            'Unidades, lecciones, ejercicios, vocabulario, evaluaciones, juegos y tiempo de estudio registrados en este navegador.', [
            'unidades' => Ingles::unidades(), 'bloques' => Ingles::bloques(), 'estadisticas' => Ingles::estadisticas(),
        ]);
    }

    public function audio(): string
    {
        return $this->render('audio', 'Audio y voces',
            'Cómo funciona el audio de la academia, cómo elegir una voz inglesa y cuáles son sus límites.');
    }
}
