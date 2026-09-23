<?php
/**
 * Iconos SVG en línea.
 *
 * Se dibujan a mano en lugar de cargar Bootstrap Icons porque el sitio usa
 * seis iconos: una fuente de iconos completa serían ~120 KB extra y una
 * petición más para eso. Heredan `currentColor`, así que cambian con el tema.
 *
 * Uso:  <?= icon('wireshark', 22) ?>
 */
if (!function_exists('icon')) {
    function icon(string $name, int $size = 24, string $class = ''): string
    {
        $paths = [
            // Ondas de captura: paquetes atravesando el cable.
            'wireshark' => '<path d="M2 12h3l2.5-7 4 14 3-9 2 2h5.5"/>',
            // Terminal: acceso remoto.
            'ssh'       => '<path d="M3 4h18v16H3z"/><path d="m7 9 3 3-3 3"/><path d="M13 15h4"/>',
            // Radar: descubrimiento de red y puertos.
            'nmap'      => '<circle cx="12" cy="12" r="9"/><path d="M12 12 6 6"/><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
            'book'      => '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22z"/>',
            'arrow'     => '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
            'copy'      => '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
            'up'        => '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
            'menu'      => '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
            'sun'       => '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
            'moon'      => '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
            'default'   => '<circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/>',
        ];

        $body = $paths[$name] ?? $paths['default'];

        return sprintf(
            '<svg class="%s" width="%d" height="%d" viewBox="0 0 24 24" fill="none" '
            . 'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '
            . 'stroke-linejoin="round" aria-hidden="true" focusable="false">%s</svg>',
            e($class),
            $size,
            $size,
            $body
        );
    }
}
