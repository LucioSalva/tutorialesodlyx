# Academia de Inglés · documentación técnica

> Módulo de Tutoriales Lucio para aprender inglés desde cero, orientado a los
> niveles A1 y A2 del MCER (sin certificación oficial). Introducido en la
> **v1.6.0**. Vive en `/ingles` y no modifica Wireshark, Nmap, SSH ni la
> Academia de Comandos.

Documentos hermanos:

| Documento | Qué contiene |
|-----------|--------------|
| [`INGLES_CONTENIDO.md`](INGLES_CONTENIDO.md) | El **esquema** de todos los JSON: lección, concepto, ejercicio (11 tipos), evaluación, vocabulario, lecturas, escucha, conversaciones, escritura, exámenes. |
| [`INGLES_JUEGOS.md`](INGLES_JUEGOS.md) | El formato de datos de cada uno de los 10 juegos. |
| [`INGLES_REFERENCIA.md`](INGLES_REFERENCIA.md) | Cómo se usó el libro de referencia y la política de originalidad. |
| [`INGLES_AUDIO.md`](INGLES_AUDIO.md) | Audio pregenerado (v1.7.0): motor, voces, archivos, manifiesto y cómo regenerarlo. |

---

## 1. Principios

1. **Contenido original.** Todo el texto educativo se escribió desde cero; el
   libro de referencia solo fijó la lista de temas (ver `INGLES_REFERENCIA.md`).
2. **Explicar → mostrar → señalar → practicar → resolver → interpretar.** Cada
   concepto tiene qué es, para qué sirve, cómo funciona, fórmula visual,
   ejemplos anotados, pronunciación y errores frecuentes; cada ejercicio, tres
   pistas progresivas y una solución razonada.
3. **Un solo motor de corrección** (`js/ingles/evaluador.js` + `texto.js`) para
   lecciones, evaluaciones, exámenes, lecturas, escucha, conversaciones y juegos.
4. **Datos, no HTML.** El curso es JSON; PHP lo pinta con componentes y el
   navegador corrige con el mismo JSON. Añadir una lección no toca código.
5. **Métricas honestas.** Nada se estima: el progreso sale de lo que el
   estudiante hizo. Escritura libre y pronunciación no reciben notas inventadas.
6. **Privacidad.** Sin cuentas ni cookies; progreso en `localStorage`,
   exportable. El micrófono es opcional y la grabación no sale del navegador.

---

## 2. Arquitectura

```
app/
├── Controllers/InglesController.php     despachador de /ingles/* (18 rutas)
├── Models/InglesRepository.php          JSON (whitelist) + MySQL opcional
└── Views/
    ├── components/ingles-ui.php         componentes in_* (tira de oración, fórmula, ejemplo,
    │                                    tabla, diagramas SVG, diálogo, ejercicio, cabecera…)
    └── ingles/                          18 vistas (index, unidad, leccion, evaluacion, examen,
                                         vocabulario, tema, tarjetas, repaso, pronunciacion,
                                         pronunciacion-seccion, practica, lectura, escucha,
                                         conversacion, escritura, juegos, juego, progreso, audio)

public/assets/
├── css/ingles.css                       hoja del módulo (bajo .page-ingles)
├── ingles/data/                         CONTENIDO
│   ├── curso.json                       currículo: bloques, unidades, lecciones, prerrequisitos
│   ├── unidades/<unidad>.json           una unidad por archivo (se carga solo la que se visita)
│   ├── vocabulario.json · pronunciacion.json · lecturas.json · escucha.json
│   ├── conversaciones.json · escritura.json · juegos.json · examenes.json
│   ├── indice.json                      cifras por unidad (GENERADO)
│   └── tarjetas-gramatica.json          tarjetas de repaso de todas las lecciones (GENERADO)
└── js/ingles/
    ├── ingles.js                        arranque: audio, diálogos, tiempo de estudio; carga la vista
    ├── texto.js                         normalización (contracciones, puntuación, mayúsculas)
    ├── evaluador.js                     evaluar(ejercicio, respuesta) para los 11 tipos
    ├── ejercicios.js                    interfaz de los 11 tipos, pistas, solución, diff
    ├── voz.js                           síntesis de voz: voces, acento, velocidad, diálogos
    ├── microfono.js                     grabarte (local) y reconocimiento opcional con consentimiento
    ├── progreso.js                      progreso, SM-2, tiempo, exportar/importar validado
    ├── mazo.js                          tarjeta de memorización (5 modalidades + gramática)
    ├── vistas/*.js                      un módulo por tipo de página (carga diferida)
    └── juegos/base.js + 10 juegos       motor de rondas común y un módulo por juego

database/migrations/v1.6.0-ingles.sql    metadatos (GENERADO desde los JSON)
tools/ingles/                            herramientas de desarrollo (NO se despliegan)
```

### Flujo de una página

```
/ingles/leccion/am-is-are
   ↓ public/index.php → InglesController::ruta(['leccion', 'am-is-are'])
   ↓ InglesRepository::leccion(): busca el slug en curso.json → lee SOLO unidades/verbo-to-be.json
   ↓ views/ingles/leccion.php: componentes in_* pintan conceptos y ejercicios (legibles sin JS)
   ↓ in_config(): el JSON de la lección va en <script type="application/json"> (no ejecutable)
   ↓ ingles.js → import('./vistas/leccion.js') → montarEjercicio() por cada <article data-ej>
   ↓ el estudiante responde → evaluar() → feedback razonado → progreso.intento() → localStorage
```

### Seguridad

- Cada segmento de la URL se valida con `^[a-z0-9]+(?:-[a-z0-9]+)*$` y además
  contra el catálogo (`curso.json`, listas de juegos, etc.). Nunca se concatena
  a una ruta sin haber pasado por esa whitelist; `InglesRepository::datos()`
  solo abre nombres de una lista cerrada.
- Todo el texto se escapa con `e()` y el único marcado (`**…**`, `[[…]]`,
  `{{rol:…}}`) se aplica **después** de escapar (`in_md()` en PHP, `fmt()` en
  JS). En JS, lo que escribe el estudiante se pinta con `textContent`.
- La configuración de cada página viaja como JSON con `JSON_HEX_*` dentro de
  un `<script type="application/json">`, que el navegador no ejecuta.
- Los módulos de juego se cargan desde un mapa cerrado (`vistas/juegos.js`).
- El servidor no recibe respuestas, progreso ni audio: no hay endpoints POST.
- Importar progreso: tamaño máximo, formato y versión comprobados, cada campo
  validado por tipo y rango, claves con patrón estricto y la URL de «continuar»
  limitada a rutas internas de `/ingles`.
- MySQL: PDO con sentencias preparadas (`unidadesBD()`); la migración escapa
  cada literal y solo crea tablas `ingles_*`.

---

## 3. Organización académica

11 bloques, 31 unidades, 98 lecciones (ver `curso.json`). Los bloques 1–10
cubren A1 y el paso a A2; el bloque 11 amplía con pronombres de objeto e
imperativo, comparativos y superlativos, y futuro. Cada unidad declara
objetivos, prerrequisitos y los temas de vocabulario que la acompañan. Cada
bloque termina con un examen acumulativo que incluye un 15–25 % de preguntas
de bloques anteriores.

Una unidad está **publicada** cuando existe `unidades/<slug>.json` (y se
desplegó tras pasar el validador). No hay un estado «disponible» manual: una
unidad sin contenido no puede aparecer como lista.

---

## 4. Ejercicios y evaluador

Tipos: `opcion`, `completar`, `ordenar`, `relacionar`, `traducir`,
`transformar`, `corregir`, `dictado`, `conversacion` (autocorregibles),
`escritura` y `pronunciacion` (con autoevaluación guiada). El esquema está en
`INGLES_CONTENIDO.md` §3.

**Normalización** (`texto.js`): ignora mayúsculas, puntuación, espacios,
guiones y apóstrofos tipográficos; iguala contracciones (`isn't` = `is not` =
`'s not`; `can't` = `cannot`; `I'd` = `I would`; `she's got` = `she has got`;
`Priya's not` = `Priya is not`) sin tocar el genitivo (`Anna's phone`).
`literal: true` exige la contracción; `mayusculas: true` exige la mayúscula.
Lo que cambia la respuesta (otra palabra, otro orden, una -s) sigue siendo error.

**Mensajes** (`evaluador.js`): el fallo nunca revela la respuesta; explica el
error previsto (`errores_tipicos`, `porque` de cada opción), avisa de «casi»
(una letra) o marca qué hueco/pareja falla. Tras «Ver solución» se muestra la
respuesta, su explicación y un diff palabra a palabra con lo que se escribió.

**Escritura libre**: comprobaciones de *presencia* de estructuras (regex) —
presentadas como tales—, criterios de autoevaluación, modelo y explicación.

---

## 5. Vocabulario, tarjetas y repaso espaciado

- `vocabulario.json`: 22 temas, 613 palabras con AFI, audio, ejemplo,
  plural/formas, variantes EE. UU./R. U., relacionadas y notas.
- **Tarjetas** (`mazo.js`): inglés→español, español→inglés, audio→palabra,
  imagen→palabra (solo palabras con emoji inequívoco) y completar la oración.
- **Repaso** (`progreso.js`, SM-2 con 4 notas): «Otra vez» devuelve la tarjeta
  a los 10 min; los aciertos la alejan 1 día → 3–4 → intervalo × facilidad.
  La facilidad baja con cada dificultad, así que lo difícil vuelve más.
  Límite configurable de tarjetas nuevas por día. Las tarjetas de gramática
  de una lección entran al completarla.

---

## 6. Audio

Desde la **v1.7.0** todo el audio son **MP3 pregenerados** con voces
neuronales (Kokoro-82M, en local) y servidos por el hosting: no depende de las
voces instaladas en el equipo del estudiante. Acentos estadounidense y
británico, voces distintas por personaje, velocidad 0,75–1,25× y reproductor
de lecturas y escucha con resaltado de la frase que suena.
Todo el detalle —motor, licencias, estructura de archivos, manifiesto,
regeneración y límites— está en [`INGLES_AUDIO.md`](INGLES_AUDIO.md).

- **Micrófono** (`microfono.js`): «Grabarme» usa MediaRecorder y deja la
  grabación en memoria de la pestaña (tope 20 s). El reconocimiento de voz es
  opcional, pide consentimiento en cada sesión porque en Chrome/Edge envía el
  audio al fabricante, y se presenta como «qué entendió el reconocedor», nunca
  como evaluación fonética.

---

## 7. Juegos

Diez juegos DOM accesibles (sin Phaser: son juegos de lenguaje), con 4 niveles
cada uno, pista por ronda, explicación tras cada respuesta, condición de éxito,
pantalla final con los fallos para repasar y guardado del nivel. Base común en
`juegos/base.js` (`jugarRondas`, `jugarReto`, `elegirOpcion`, `escribir`,
`ordenarFichas`). Datos en `INGLES_JUEGOS.md`.

| # | Juego | Mecánica |
|---|-------|----------|
| 1 | Ordena la oración | fichas para construir la frase |
| 2 | Encuentra el error | señalar la palabra y escribir la corrección |
| 3 | Escucha y selecciona | significado, palabra o pares mínimos por audio |
| 4 | Memoria de vocabulario | parejas imagen/palabra o inglés/español |
| 5 | Completa el diálogo | elegir la réplica adecuada |
| 6 | Detective gramatical | qué regla explica la palabra resaltada |
| 7 | Construye la pregunta | escribir la pregunta pedida |
| 8 | Viaje interactivo | paradas con situaciones, con vidas |
| 9 | Desafío de tiempos | contrarreloj; la señal del contexto decide |
| 10 | Misión final | historia por capítulos que mezcla todo |

---

## 8. Progreso

`localStorage['ingles:progreso:v1']`, formato `academia-ingles-progreso` v1:
lecciones (vista, completada), ejercicios (intentos, resuelto, a la primera,
pistas, visto con solución), evaluaciones (mejor, último, aprobado, temas a
repasar), tarjetas (SM-2), juegos (niveles superados, mejor puntuación),
prácticas completadas, tiempo por día y última página para «continuar».
Definiciones exactas en la cabecera de `progreso.js`. Exportar/importar desde
`/ingles/progreso`. La preferencia de voz vive aparte (`ingles:voz:v1`).

---

## 9. Cómo ampliar el curso

### Añadir una lección o una unidad

1. Añádela a `curso.json` (unidad con `lecciones`, o una lección más en la
   lista de su unidad). Los slugs de lección son únicos en todo el curso.
2. Redacta en `tools/ingles/borradores/<unidad>/`: `00-unidad.json`,
   `NN-<leccion>.json` (una por archivo, formato `INGLES_CONTENIDO.md` §3) y
   `99-evaluacion.json`. El encargo editorial que siguieron las unidades
   actuales está en `tools/ingles/BRIEF_REDACCION.md`.
3. Ensambla, valida y prueba:
   ```bash
   php tools/ingles/ensamblar.php <unidad>
   php tools/ingles/validar.php <unidad>
   node --no-warnings tools/ingles/tests/datos.test.mjs <unidad>
   php tools/ingles/revisar.php <unidad>     # volcado legible para revisar el contenido
   ```
4. Regenera índices y migración: `php tools/ingles/indice.php` y
   `php tools/ingles/migracion.php`.

### Añadir un ejercicio

Añádelo al array `ejercicios` de su lección en el borrador (id
`<unidad>.<leccion>.<nn>`), con 3 pistas y solución razonada, y repite el paso 3.
`datos.test.mjs` comprueba con el evaluador real que cada respuesta declarada se
acepta y que cada error típico se rechaza.

### Añadir material visual

Los diagramas son datos (`visual` del concepto: `linea_tiempo`, `mapa`,
`escena`, `transformacion`) y PHP los dibuja en SVG/HTML accesible con los
colores de la tira de oración. Para una imagen propia, colócala en
`public/assets/img/ingles/<unidad>/` (con licencia clara) y referénciala desde
una `nota` o un componente nuevo en `ingles-ui.php`; se sirve con
`loading="lazy"`.

### Añadir palabras, lecturas, audios, conversaciones o juegos

Edita el JSON correspondiente (vocabulario: borradores por tema en
`tools/ingles/borradores/vocabulario/` + `unir.php`) y valida con
`php tools/ingles/validar.php --archivo=<nombre>`.

---

## 10. Pruebas

```bash
php tools/ingles/validar.php                       # esquema de todo el contenido
node --no-warnings tools/ingles/tests/texto.test.mjs   # normalizador y evaluador
node --no-warnings tools/ingles/tests/datos.test.mjs   # cada respuesta, con el evaluador real
php -S 127.0.0.1:8765 -t public &                  # y después, en navegador headless:
PUPPETEER=/ruta/node_modules/puppeteer CHROMIUM=/usr/bin/chromium node tools/ingles/tests/e2e.cjs
```

`e2e.cjs` resuelve ejercicios de cada tipo, hace una evaluación completa,
estudia tarjetas, recorre una conversación, comprueba el bloqueo de la
transcripción, arranca los 10 juegos y supera un nivel, prueba
exportar/importar (incluido un archivo manipulado) y revisa errores de consola
y scroll horizontal a 360, 768 y 1440 px.

---

## 11. Despliegue en HostGator

Parche incremental: se extrae desde la raíz del proyecto (la carpeta que
contiene `app/`, `config/` y `public/`). Solo añade archivos del módulo y
modifica tres compartidos (`public/index.php`, `layouts/base.php`,
`components/navbar.php`). Después, si usas MySQL, importa
`database/migrations/v1.6.0-ingles.sql` (idempotente). Sin Node, sin Composer,
sin procesos residentes: los `.js` son módulos ES estáticos. `tools/` no se sube.
