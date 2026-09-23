<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\View;
use App\Models\TutorialRepository;

final class HomeController
{
    /** Biblioteca: portada con el catálogo completo. */
    public function index(): string
    {
        $tutorials = TutorialRepository::all();

        $available = array_values(array_filter(
            $tutorials,
            static fn (array $t): bool => ($t['status'] ?? '') === 'available'
        ));

        return View::render('home', [
            'pageTitle'   => 'Tutoriales Lucio · CODLYX',
            'metaDesc'    => 'Biblioteca personal de laboratorios, apuntes y guías técnicas: redes, sistemas, desarrollo, bases de datos e infraestructura.',
            'bodyClass'   => 'page-home',
            'activeSlug'  => null,
            'tutorials'   => $tutorials,
            'countTotal'  => count($tutorials),
            'countReady'  => count($available),
        ]);
    }
}
