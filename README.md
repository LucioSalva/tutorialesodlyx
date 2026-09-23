# Tutoriales Lucio · CODLYX

Biblioteca personal de laboratorios, apuntes y guías técnicas. Cada tutorial se
escribe sobre una máquina real y se puede seguir comando a comando.

Tutoriales disponibles hoy: **Wireshark**, **Nmap** y **SSH** (desde la v1.4.0).
Desde la **v1.5.0** el proyecto incluye además la **[Academia de Comandos](docs/ACADEMIA.md)**:
un módulo interactivo para aprender Linux, CMD y PowerShell con terminal simulada,
misiones, videojuegos y repaso espaciado.

> **Antes de escribir un tutorial nuevo, lee [`docs/TUTORIAL_STANDARD.md`](docs/TUTORIAL_STANDARD.md).**
> Es la norma pedagógica del proyecto, obligatoria desde la v1.3.0: todo
> tutorial debe seguir el ciclo *explicar → mostrar → señalar → practicar →
> resolver → interpretar*, con figuras, pistas progresivas, soluciones
> razonadas y separación entre evidencia e interpretación.

---

## Stack

| Capa | Tecnología | Nota |
|------|-----------|------|
| Servidor | PHP 8.1+ | Sin Composer: no hay dependencias de terceros en PHP |
| Vistas | HTML5 semántico + PHP plano | Sin motor de plantillas |
| Estilos | CSS3 propio + Bootstrap 5.3.3 **solo rejilla** | Igual que `web.codlyx.com.mx` |
| Interacción | JavaScript vanilla | Sin librerías, sin build |
| Datos | MySQL 8 / MariaDB vía **PDO** | Opcional: el sitio funciona sin ella |
| Servidor web | Apache + `.htaccess` | Compatible con hosting compartido |

No se usa Node, npm, Laravel, React ni ningún sistema de compilación.
Los ficheros que se suben al servidor son exactamente los del repositorio.

---

## Estructura

```
tutoriales/
├── app/
│   ├── Core/
│   │   ├── Config.php          Configuración, rutas y URL base autodetectada
│   │   ├── Database.php        Conexión PDO perezosa (devuelve null si no hay BD)
│   │   ├── Router.php          Enrutador mínimo (2 rutas)
│   │   ├── View.php            Render de vistas con validación de nombre
│   │   └── helpers.php         e(), url(), asset()
│   ├── Controllers/
│   │   ├── HomeController.php
│   │   └── TutorialController.php
│   ├── Models/
│   │   └── TutorialRepository.php   Catálogo: MySQL con respaldo local
│   └── Views/
│       ├── layouts/
│       │   ├── base.php            <html>, <head>, navbar, footer
│       │   └── tutorial.php        Armazón de cualquier tutorial
│       ├── components/
│       │   ├── navbar.php          Barra y selector de tutoriales
│       │   ├── footer.php
│       │   ├── icons.php           icon() — SVG en línea
│       │   ├── blocks.php          term(), filter_chip(), note()
│       │   ├── tutorial-card.php   Tarjeta de la biblioteca
│       │   ├── tutorial-toc.php    Sumario (móvil y escritorio)
│       │   └── tutorial-meta-wireshark.php   Ficha de máquina (opcional por tutorial)
│       ├── tutorials/
│       │   ├── wireshark.php       ← CONTENIDO del laboratorio
│       │   └── nmap.php
│       ├── errors/404.php
│       └── home.php
├── config/
│   ├── config.example.php      Plantilla; cópiala a config.php
│   └── catalog.php             Whitelist de vistas + catálogo de respaldo
├── database/
│   ├── schema.sql              3 tablas
│   └── seed.sql                Datos iniciales (idempotente)
├── docs/
│   ├── TUTORIAL_STANDARD.md    Norma de enseñanza visual (LÉELA)
│   └── ACADEMIA.md             Arquitectura del módulo Academia de Comandos
├── public/                     ← RAÍZ WEB
│   ├── index.php               Front controller
│   ├── .htaccess               Reescritura + cabeceras + caché
│   ├── assets/
│   │   ├── css/  js/
│   │   ├── academia/data/*.json    Contenido de la Academia de Comandos
│   │   ├── js/academia/            Simulador de terminal, misiones y juegos
│   │   └── img/tutorials/<slug>/   Figuras, una carpeta por tutorial
│   └── vendor/
│       ├── bootstrap-grid.min.css
│       └── phaser/                 Phaser 4.2.1 (MIT) para los videojuegos
├── .htaccess                   Solo si NO puedes apuntar el document root a public/
├── .gitignore
└── README.md
```

### Por qué el contenido no está en MySQL

MySQL guarda **metadatos** del catálogo (nombre, slug, descripción, icono,
categoría, orden, estado) y el **índice de secciones** de cada tutorial. El
contenido educativo vive en `app/Views/tutorials/<slug>.php`.

Razones:

- El HTML de un laboratorio son decenas de miles de caracteres con SVG,
  tablas y bloques de terminal. En una columna `TEXT` no se puede revisar en
  un diff ni buscar con `grep`.
- En una vista PHP se versiona en Git, se ve el histórico y se pueden reutilizar
  los componentes `term()`, `filter_chip()` y `note()`.
- Si MySQL falla, el material de estudio sigue accesible.

El puente entre ambos mundos es la columna `tutorials.view_key`, que **siempre**
se valida contra la whitelist de `config/catalog.php` antes de resolverse a un
fichero. Nunca se concatena a una ruta.

---

## Desarrollo local

Requisito: PHP 8.1 o superior. MySQL es opcional.

```bash
cd tutoriales/public
php -S 127.0.0.1:8000 -t .
```

Abre <http://127.0.0.1:8000>. Sin `config/config.php` la biblioteca se sirve
desde `config/catalog.php` y todo funciona igual.

> Si editas ficheros y no ves los cambios, es OPcache. Arranca con
> `php -d opcache.enable=0 -S 127.0.0.1:8000 -t .`

Comprobación de sintaxis de todo el proyecto:

```bash
find . -name '*.php' -exec php -l {} \; | grep -v 'No syntax errors'
```

---

## Base de datos

### Crearla

```bash
mysql -u USUARIO -p -e "CREATE DATABASE tutoriales CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u USUARIO -p tutoriales < database/schema.sql
mysql -u USUARIO -p tutoriales < database/seed.sql
```

Ambos scripts son idempotentes: puedes reejecutarlos sin duplicar filas.

### Tablas

| Tabla | Para qué |
|-------|----------|
| `categories` | Áreas técnicas (Redes, Sistemas, Desarrollo…). Permite renombrar un área en un solo sitio. |
| `tutorials` | Una fila por tutorial: `slug`, `name`, `tagline`, `description`, `icon`, `category_id`, `sort_order`, `status`, `view_key`. |
| `tutorial_sections` | Índice navegable de cada tutorial: `anchor`, `label`, `badge`, `sort_order`. Alimenta el sumario y el scrollspy. |
| `academia_*` | Metadatos del catálogo de la Academia de Comandos (sistemas, categorías, comandos, misiones, juegos). Opcionales: el módulo funciona sin ellas. |

`status` admite `available` (visible y navegable), `coming_soon` (aparece en la
biblioteca sin enlace) y `draft` (oculto).

---

## Configuración

```bash
cp config/config.example.php config/config.php
```

Edita `config/config.php`:

```php
'env' => 'production',        // 'development' muestra errores en pantalla
'db'  => [
    'enabled' => true,
    'host'    => 'localhost',
    'name'    => 'cpaneluser_tutoriales',
    'user'    => 'cpaneluser_tutor',
    'pass'    => '…',
],
'base_url' => '',             // vacío = se detecta solo
```

`config/config.php` está en `.gitignore` y **no se incluye en el ZIP de
despliegue**. Nunca escribas credenciales reales en el repositorio.

Deja `base_url` vacío salvo que uses un proxy inverso: la detección automática
funciona en dominio, subdominio y subdirectorio sin cambios.

---

## Agregar un nuevo tutorial

Ejemplo: añadir **SSH**. Son cuatro pasos y **no hay que tocar Wireshark**.

### 1. Escribir el contenido

Crea `app/Views/tutorials/ssh.php`. Empieza por:

```php
<?php
require_once \App\Core\Config::basePath('app/Views/components/icons.php');
require_once \App\Core\Config::basePath('app/Views/components/blocks.php');
?>
<section id="introduccion">
  <h2>Título de la sección</h2>
  <p class="tut-sub">Subtítulo corto.</p>
  <p>Texto…</p>

  <?= term('<span class="p">$</span> ssh usuario@servidor') ?>

  <?= note('Importante', '<p>Aviso…</p>') ?>
  <?= note('Dato', '<p>Información…</p>', 'info') ?>
</section>
```

Componentes disponibles (`app/Views/components/blocks.php`):

| Función | Produce |
|---------|---------|
| `term($html, $etiqueta)` | Bloque de terminal con botón copiar. Usa `<span class="p">$</span>` para el prompt (se excluye al copiar) y `<span class="c">…</span>` para comentarios. |
| `filter_chip($expr, $tag)` | Chip monoespaciado con copia directa. |
| `note($etiqueta, $html, 'warn'\|'info')` | Callout. |
| `icon($nombre, $tamaño)` | SVG en línea. Añade el trazado en `icons.php`. |
| `chapter($num, $titulo, $bajada, $nivel)` | Separador de capítulo para tutoriales largos. |
| `difficulty($nivel)` | Insignia de nivel: `fundamentos`, `protocolos`, `intermedio`, `ciber`, `practica`. |
| `reveal($resumen, $html, $variante)` | Bloque plegable `<details>`, para soluciones de ejercicios. |
| `lab_head($num, $titulo, $nivel, $objetivo)` | Cabecera de laboratorio. `$nivel`: `basico`, `intermedio` o `avanzado`. |
| `steps([...])` | Lista de pasos numerada. |
| `shot($archivo, $alt, $pie, $origen)` | Figura con procedencia, lupa y pie. `$origen`: `'real'` o `'ilustrativo'`. |
| `callouts([[etiqueta, html], ...])` | Leyenda numerada ①②③ de una figura. |
| `anatomy($linea, [[pieza, html], ...])` | Desglose anotado de un comando o una salida. |
| `evidence($dato, $lectura, $limite)` | Evidencia · Interpretación · No podemos afirmar. |
| `pitfall($html)` | Bloque «Error común». |
| `hints([p1, p2, p3])` | Pistas progresivas plegables. |
| `solution($respuesta, $razonamiento, $aprendido)` | Solución razonada plegable. |
| `quiz([...])` | Mini quiz con respuesta plegada. |
| `recap($titulo, $esencial, $clave, $interpretar)` | Resumen de capítulo. |
| `compare($a, $b, $veredicto)` | Comparación de dos conceptos que se confunden. |
| `before_after($antes, $cambio, $despues)` | Antes → cambio → después. |

Los once últimos son la v1.3.0 y están descritos con ejemplos en
[`docs/TUTORIAL_STANDARD.md`](docs/TUTORIAL_STANDARD.md). Las figuras van en
`public/assets/img/tutorials/<slug>/`, una carpeta por tutorial.

Un tutorial extenso puede además agrupar su índice en capítulos: añade
`'group' => 'Nombre del capítulo'` a cada entrada de `sections` en
`config/catalog.php` (y la columna `group_label` en la tabla, ya creada por
la migración `database/migrations/v1.1.0-wireshark.sql`). Sin ese campo el
índice se muestra como lista plana, exactamente igual que antes.

Si un tutorial necesita estilos o scripts propios, basta con crear
`public/assets/css/tutorial-<slug>.css` o `public/assets/js/tutorial-<slug>.js`:
el layout los carga solo si existen, sin tocar ningún fichero compartido.

Clases útiles: `.lab` + `.lab__head`/`.lab__num`/`.lab__goal` para ejercicios
numerados, `.tut-table` para envolver tablas, `.tut-figure` para diagramas.

**Cada `<section>` necesita un `id`**: es el ancla del sumario.

### 2. Registrar la vista en la whitelist

`config/catalog.php` → array `views`:

```php
'views' => [
    'wireshark' => 'wireshark',
    'ssh'       => 'ssh',      // ← nuevo
],
```

Sin esta línea el tutorial devuelve 404, por diseño.

### 3. Añadirlo al catálogo de respaldo

`config/catalog.php` → arrays `tutorials` y `sections`. Copia el bloque de
Wireshark y ajústalo: `status` a `'available'` y `view_key` a `'ssh'`.
Las entradas de `sections` deben coincidir con los `id` de las `<section>`.

### 4. Actualizar MySQL

```sql
UPDATE tutorials
   SET status = 'available', view_key = 'ssh',
       description = 'Descripción real del tutorial…'
 WHERE slug = 'ssh';

INSERT INTO tutorial_sections (tutorial_id, anchor, label, badge, sort_order)
SELECT id, 'introduccion', 'Introducción', '', 10 FROM tutorials WHERE slug='ssh';
-- …una fila por sección
```

Si el tutorial necesita una ficha de datos en la cabecera (como la máquina de
Wireshark), crea `app/Views/components/tutorial-meta-ssh.php`; se inserta sola.

Si necesita JavaScript propio, crea `public/assets/js/tutorial-ssh.js` y
cárgalo desde su vista. `tutorial.js` es genérico y ya aporta sumario activo,
progreso, copiar y volver arriba.

---

## Despliegue en HostGator

No hace falta Node, Composer ni permisos especiales. Solo copiar ficheros.

### 1. Subir

Sube el contenido de `tutoriales-hostgator.zip` por cPanel → Administrador de
archivos → *Cargar* → *Extraer*. El ZIP no lleva carpeta contenedora: extrae
directamente en el destino que elijas.

### 2. Crear la base de datos

cPanel → **Bases de datos MySQL**:

1. Crea la base de datos (cPanel le antepone tu usuario: `cpaneluser_tutoriales`).
2. Crea un usuario MySQL con contraseña generada.
3. Añade el usuario a la base de datos con **ALL PRIVILEGES**.

### 3. Importar el esquema y los datos

cPanel → **phpMyAdmin** → selecciona la base de datos → pestaña **Importar**:

1. `database/schema.sql`
2. `database/seed.sql`

### 4. Configurar credenciales

En el Administrador de archivos, copia `config/config.example.php` a
`config/config.php`, edítalo y pon `env` en `production`, `db.enabled` en `true`
y los datos reales de cPanel.

### 5. Elegir la raíz web

**Opción A — subdominio o dominio con document root propio (recomendada).**

cPanel → *Dominios* / *Subdominios* → apunta la raíz del documento a la carpeta
`public/` del proyecto. Ejemplo: proyecto en `/home/usuario/apps/tutoriales`,
document root en `/home/usuario/apps/tutoriales/public`. El `.htaccess` de la
raíz no se usa y el código PHP queda fuera del árbol web.

**Opción B — subdirectorio de un sitio existente.**

Sube el proyecto entero a `public_html/tutoriales/`. El `.htaccess` de la raíz
reenvía todo a `public/` y bloquea `app/`, `config/` y `database/`. La URL será
`https://tudominio.com/tutoriales/`. No hay que cambiar nada más: las rutas se
detectan solas.

**Opción C — dominio principal.**

Mueve el contenido de `public/` a `public_html/` y el resto (`app/`, `config/`,
`database/`) a un nivel por encima, fuera del árbol web. Ajusta en
`public_html/index.php` el `dirname(__DIR__)` si cambias esa disposición.

### 6. Comprobar

1. `.htaccess` presente en `public/` (activa «mostrar archivos ocultos»).
2. Abre la portada: deben verse las tarjetas de Wireshark y SSH.
3. Abre el tutorial de Wireshark: sumario lateral, botones copiar y progreso.
4. Comprueba que `https://tusitio/config/config.php` devuelve 403 o 404.
5. Comprueba que `https://tusitio/app/Core/Database.php` devuelve 403 o 404.
6. En la portada, «Origen del catálogo» debe decir **MySQL**. Si dice «catálogo
   local», revisa credenciales: el sitio funciona igual, pero no está leyendo
   de la base de datos.

### 7. Activar producción

Confirma que `config/config.php` tiene `'env' => 'production'`. Con eso los
errores se registran en el log de PHP y nunca se imprimen al visitante.

---

## Academia de Comandos

Módulo independiente en `/academia`, documentado en
[`docs/ACADEMIA.md`](docs/ACADEMIA.md). Tres modalidades (Linux, CMD y
PowerShell), cada una con su temario, su terminal simulada, sus misiones y su
progreso.

Lo que conviene saber antes de tocarlo:

- **La terminal es una simulación en el navegador.** No hay ningún endpoint que
  reciba comandos, y el servidor jamás ejecuta lo que escribe el estudiante. En
  PHP no se usa `exec`/`shell_exec`/`system`/`eval`, y en JavaScript no se usa
  `eval` ni `new Function`.
- **El contenido vive en JSON** (`public/assets/academia/data/`), que es el mismo
  archivo que descarga el navegador. MySQL solo guarda metadatos del catálogo, y
  la academia funciona igual sin base de datos.
- **El progreso vive en `localStorage`**, con exportar e importar a archivo. No
  hay cuentas ni cookies.
- **Phaser 4.2.1 está vendorizado** en `public/assets/vendor/phaser/` (MIT). Se
  carga solo en las páginas que tienen un juego que lo necesita.

Para añadir un comando, una misión o un juego no hace falta tocar PHP: se añade
un objeto al JSON correspondiente. El procedimiento exacto está en la
documentación del módulo.

---

## Seguridad implementada

- PDO con `ATTR_EMULATE_PREPARES = false`: sentencias preparadas reales.
- Todos los parámetros van enlazados; no se concatena SQL.
- Slugs validados con `^[a-z0-9]+(?:-[a-z0-9]+)*$` y longitud máxima 64.
- `view_key` procedente de MySQL validado contra whitelist; jamás usado como ruta.
- `View::resolve()` comprueba además con `realpath()` que el fichero está dentro
  de `app/Views/`.
- `htmlspecialchars(ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')` en toda interpolación.
- En producción los errores van al log, nunca al navegador.
- Cabeceras `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- `Options -Indexes` y bloqueo de `.sql`, `.log`, `.example` y ficheros ocultos.
- Sin cuentas, sin sesiones, sin cookies, sin tracking.
- Academia: terminal 100 % simulada en el cliente, sin ejecución real de comandos
  ni acceso al sistema de archivos del servidor; el progreso importado se valida
  campo a campo y nunca se ejecuta.

---

## Créditos

Identidad visual derivada de [web.codlyx.com.mx](https://web.codlyx.com.mx/):
paleta, tipografías (Space Grotesk · Inter · JetBrains Mono) y tratamiento de
tarjetas, botones y barra de navegación.
