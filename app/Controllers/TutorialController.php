<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\View;
use App\Models\TutorialRepository;

final class TutorialController
{
    /**
     * Muestra un tutorial.
     *
     * Devuelve null cuando el slug no existe, cuando el tutorial todavía no
     * tiene contenido (status coming_soon) o cuando su view_key no supera la
     * whitelist. El index.php traduce ese null a un 404 real.
     */
    public function show(string $slug): ?string
    {
        $tutorial = TutorialRepository::findBySlug($slug);
        if ($tutorial === null || ($tutorial['status'] ?? '') !== 'available') {
            return null;
        }

        $view = TutorialRepository::resolveViewKey($tutorial['view_key'] ?? null);
        if ($view === null || !View::exists($view)) {
            return null;
        }

        $name = (string) ($tutorial['name'] ?? $slug);

        return View::render('layouts/tutorial', [
            'pageTitle'   => $name . ' · Tutoriales Lucio',
            'metaDesc'    => (string) ($tutorial['description'] ?? $tutorial['tagline'] ?? ''),
            'bodyClass'   => 'page-tutorial tutorial-' . $slug,
            'activeSlug'  => $slug,
            'tutorial'    => $tutorial,
            'sections'    => TutorialRepository::sections($slug),
            'tutorials'   => TutorialRepository::all(),
            'tutorialView'=> $view,
            // Activa tutorial.css y tutorial.js solo en estas páginas.
            'withTutorialAssets' => true,
        ]);
    }
}
