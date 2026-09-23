# Academia de Comandos · documentación técnica

> Módulo de Tutoriales Lucio para aprender, practicar y memorizar comandos de
> **Linux (Bash)**, **Windows CMD** y **PowerShell**. Introducido en la v1.5.0.

El resto del proyecto no cambia: la academia es un módulo aparte que reutiliza
el layout, la identidad CODLYX y el `Config`/`View`/`Router` existentes.

---

## 1. La regla que manda sobre todo lo demás

**La terminal es una simulación que vive en el navegador.** No existe ningún
endpoint que reciba un comando del estudiante, y el servidor nunca ejecuta nada
de lo que se teclea. En el código eso significa:

- Cero llamadas a `exec`, `shell_exec`, `system`, `passthru`, `proc_open`, `popen`
  o `eval` en PHP.
- Cero `eval()` y cero `new Function()` en JavaScript. Los comandos se comparan
  contra un **registro cerrado** de funciones implementadas; lo que no está en el
  registro no se ejecuta, se responde con el mensaje de «no encontrado» del shell
  correspondiente.
- Los archivos, procesos, servicios y puertos son objetos de JavaScript que solo
  existen en la pestaña. `rm -rf` dentro del simulador no toca nada real.
- El progreso se guarda en `localStorage`; al importarlo se valida campo a campo
  y se descarta lo que no encaja (ver `progreso.js`, método `_validar`).

---

## 2. Arquitectura

```
app/
├── Controllers/AcademiaController.php   11 acciones, todas devuelven HTML
├── Models/AcademiaRepository.php        catálogo: JSON + MySQL opcional
└── Views/
    ├── academia/                        11 vistas (index, sistema, comando…)
    └── components/academia-ui.php       piezas compartidas (ac_*)

public/assets/
├── css/academia.css                     hoja del módulo (tokens --dv-*/--tl-*)
├── academia/data/*.json                 CONTENIDO (comandos, escenarios, misiones, juegos)
├── vendor/phaser/phaser-4.2.1.min.js    Phaser vendorizado (MIT, sin CDN)
└── js/academia/
    ├── vfs.js            sistema de archivos virtual (POSIX y Windows)
    ├── parser.js         tokenizador: comillas, tuberías, redirecciones, variables
    ├── shell.js          ejecutor de tuberías, códigos de salida y mensajes por shell
    ├── shell-linux.js    comandos de Bash/GNU
    ├── shell-cmd.js      comandos de CMD
    ├── shell-powershell.js  cmdlets y pipeline de OBJETOS
    ├── misiones.js       validadores declarativos y errores que enseñan
    ├── progreso.js       XP, logros, repaso espaciado, exportar/importar
    ├── terminal.js       interfaz de la terminal y árbol del escenario
    ├── juego-base.js     cimientos comunes de los juegos (HUD, victoria, Phaser)
    ├── academia.js       arranque de cada vista
    └── games/*.js        un módulo por juego
```

### Flujo de una ejecución

```
tecla Enter
   ↓
terminal.js  → shell.ejecutar(linea)
   ↓
parser.js    → tokens → tubería → redirecciones
   ↓
shell.js     → busca cada comando en el REGISTRO
   ↓
shell-*.js   → la función del comando opera sobre el VFS
   ↓
vfs.js       → cambia el árbol virtual (y solo el árbol virtual)
   ↓
terminal.js  → pinta la salida con textContent (nunca innerHTML)
   ↓
misiones.js  → comprueba el ESTADO y decide si la misión está resuelta
```

---

## 3. Qué vive en MySQL y qué vive en archivos

| Dato | Dónde | Por qué |
|------|-------|---------|
| Explicaciones, ejemplos, ejercicios | `data/comandos-*.json` | Es lo que descarga el navegador para el simulador: una sola fuente |
| Escenarios (árbol, procesos, servicios) | `data/escenarios.json` | El simulador los necesita en el cliente |
| Misiones y validadores | `data/misiones.json` | Se evalúan en el navegador |
| Niveles de juego | `data/juegos.json` | Los consume el módulo del juego |
| Metadatos del catálogo | tablas `academia_*` | Listar, buscar y administrar desde SQL |
| Progreso del estudiante | `localStorage` | Sin cuentas; exportable a archivo |

La migración `database/migrations/v1.5.0-academia.sql` se **genera desde los JSON**,
así que nunca se contradicen. Si no se aplica, la academia funciona igual.

---

## 4. Añadir contenido sin tocar código

### Un comando nuevo
Añade un objeto al array `comandos` de `data/comandos-<os>.json`. Campos mínimos:
`slug`, `nombre`, `categoria`, `dificultad`, `resumen`, `explicacion_sencilla`,
`explicacion_tecnica`, `sintaxis`, `opciones`, `ejemplos`, `que_esperar`,
`relacionados`, `errores`, `ejercicio`, `resumen_final`, `pregunta_repaso`,
`equivalentes`. Marca `"simulado": true` **solo** si el comando está implementado
en el `shell-*.js` correspondiente; si no, la ficha lo dirá honestamente.

### Una misión nueva
Añade un objeto a `data/misiones.json`. Lo importante es `exito`: un validador
declarativo que comprueba el **estado** del escenario, no el texto tecleado. Así
`ls -la` y `ls -al` valen igual, y cualquier camino correcto se acepta.

Validadores disponibles (`misiones.js`): `existe`, `no-existe`, `es-directorio`,
`es-fichero`, `contenido`, `cwd`, `cuantos-en`, `permisos`, `propietario`,
`salida-incluye`, `salida-coincide`, `sin-errores`, `proceso-ausente`,
`proceso-presente`, `servicio-activo`, `servicio-parado`, `comando-usado`,
`comando-no-usado`, `variable`, y los combinadores `todos`, `alguno`, `ninguno`.

### Un comando nuevo en el simulador
Añade una entrada al array del `shell-*.js` con `comando(nombre, resumen, ejecutar)`.
`ejecutar(ctx)` recibe `{ shell, vfs, args, opciones, operandos, flags, entrada, … }`
y devuelve texto o `{ salida, errores, codigo }`. Regla: si no puedes implementarlo
fielmente, no lo añadas al registro — es mejor que el simulador diga «todavía no
está implementado» a que finja un comportamiento equivocado.

### Un juego nuevo
1. Crea `js/academia/games/<nombre>.js` que exporte
   `export async function iniciar(contenedor, opciones)` y devuelva `{ destruir() }`.
2. Añade su entrada a `data/juegos.json` con sus `niveles`.
3. Reutiliza `juego-base.js` (HUD, victoria, progreso, Phaser) y el motor de
   comandos: un juego **no** implementa su propio intérprete.

---

## 5. Phaser

- Versión **4.2.1**, licencia MIT, vendorizada en `public/assets/vendor/phaser/`
  junto a su `LICENSE.md`. No se carga desde ninguna CDN.
- Se carga **bajo demanda** con `cargarPhaser(base)`: las páginas que no tienen un
  juego de Phaser no descargan 1,3 MB.
- Los juegos siguen la skill `phaser-core`: escenas como clases con
  `init/preload/create/update`, estado reseteado en `init()`, `this.registry` para
  datos compartidos y `scale: FIT + CENTER_BOTH` para que encajen en móvil.
- Sin assets externos: todo se dibuja con formas y texto, así que no hay imágenes
  que falten en producción.

---

## 6. Accesibilidad y responsive

- La terminal es un `<input>` real dentro de un `<form>`, con `<label>`, y la
  salida es una región `role="log"` con `aria-live="polite"`.
- Los juegos ofrecen alternativa de teclado a todo lo que se arrastra, y botones
  táctiles para las acciones frecuentes.
- Nada depende solo del color: los estados llevan texto o icono.
- Probado a 360, 768, 1024 y 1440 px. Sin scroll horizontal global.
- `prefers-reduced-motion` desactiva transiciones y animaciones.

---

## 7. Despliegue

El parche es incremental: se extrae desde la raíz del proyecto (la carpeta que
contiene `app/`, `config/` y `public/`) y, si usas MySQL, se importa después
`database/migrations/v1.5.0-academia.sql`.

No hace falta Node, ni Composer, ni procesos residentes: los `.js` se sirven como
archivos estáticos y el navegador los carga como módulos ES (`<script type="module">`).
Apache los sirve con su tipo MIME correcto sin configuración adicional.
