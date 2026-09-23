<?php
/**
 * Tutoriales Lucio · CODLYX — configuración de ejemplo
 * ---------------------------------------------------------------------
 * COPIA este fichero a  config/config.php  y rellena tus credenciales.
 *
 *     cp config/config.example.php config/config.php
 *
 * config.php está en .gitignore y NUNCA debe subirse al repositorio ni
 * incluirse en un ZIP con credenciales reales dentro.
 *
 * La aplicación funciona SIN este fichero: si no existe o la conexión
 * falla, el catálogo se sirve desde config/catalog.php y el sitio sigue
 * navegable. MySQL añade la capacidad de administrar el catálogo sin
 * tocar código; no es un punto único de fallo.
 */

declare(strict_types=1);

return [

    // -----------------------------------------------------------------
    // Entorno: 'development' o 'production'
    //   development → muestra errores en pantalla
    //   production  → registra errores, jamás los imprime al visitante
    // -----------------------------------------------------------------
    'env' => 'development',

    // -----------------------------------------------------------------
    // Base de datos (MySQL / MariaDB)
    //
    // HostGator (cPanel > Bases de datos MySQL):
    //   host  → 'localhost'  (HostGator sirve MySQL en el mismo servidor)
    //   name  → cPanel antepone tu usuario: cpaneluser_tutoriales
    //   user  → cPanel antepone tu usuario: cpaneluser_tutor
    //   pass  → la que generes en cPanel; no la escribas aquí en el repo
    //
    // Deja 'enabled' => false para trabajar sin base de datos.
    // -----------------------------------------------------------------
    'db' => [
        'enabled' => false,
        'host'    => 'localhost',
        'port'    => 3306,
        'name'    => 'REEMPLAZA_NOMBRE_BD',
        'user'    => 'REEMPLAZA_USUARIO_BD',
        'pass'    => 'REEMPLAZA_CONTRASENA_BD',
        'charset' => 'utf8mb4',
    ],

    // -----------------------------------------------------------------
    // URL base pública.
    //
    // Déjala vacía ('') para que se detecte sola a partir de la petición.
    // La detección automática funciona en dominio, subdominio y
    // subdirectorio sin cambiar nada, así que normalmente NO hay que
    // tocar esto. Rellénala solo si usas un proxy inverso o quieres
    // forzar https:// en las URL canónicas.
    //
    //   Dominio      → 'https://tudominio.com'
    //   Subdominio   → 'https://tutoriales.tudominio.com'
    //   Subdirectorio→ 'https://tudominio.com/tutoriales'
    // -----------------------------------------------------------------
    'base_url' => '',

    // Se usa en <meta og:*> y en el <link rel="canonical">.
    'site_name' => 'Tutoriales Lucio',
    'brand'     => 'CODLYX',
];
