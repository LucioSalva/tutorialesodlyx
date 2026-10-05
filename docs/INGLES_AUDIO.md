# Academia de Inglés · audio pregenerado (v1.7.0)

> Desde la v1.7.0 todo el audio del curso son **archivos MP3 generados de
> antemano y servidos por el propio hosting**. El estudiante no necesita voces
> instaladas, cuentas, claves ni complementos. La síntesis del navegador
> (Web Speech API) solo queda para leer el texto que escribe el propio
> estudiante, y se presenta como «voz del navegador».

## 1. Por qué cambió

Hasta la v1.6.0 cada botón llamaba a `speechSynthesis.speak()`. Si el
navegador no exponía ninguna voz inglesa (habitual en Linux, en muchos
Firefox y en equipos sin paquetes de idioma), **todos** los botones fallaban
con «Tu sistema no tiene ninguna voz en inglés instalada». No era un fallo de
una lectura concreta: afectaba a toda la academia.

## 2. Motor y licencias

| | |
|---|---|
| Motor | **Kokoro-82M** 0.9.4 (hexgrad), modelo abierto de síntesis neuronal |
| Licencia | pesos Apache 2.0; entrenado con audio de licencia permisiva (según su ficha). Permite generar, conservar, publicar y reproducir los audios sin coste ni atribución obligatoria |
| Dónde se ejecuta | **solo en el equipo de desarrollo** (GPU/CPU). HostGator solo sirve MP3 |
| Coste | 0: no hay API, ni claves, ni facturación por reproducción |

Alternativas evaluadas en septiembre de 2026 (no usadas): Google Cloud TTS
Chirp 3 HD, 30 $/millón de caracteres con 1 M gratis al mes; Azure Neural,
0,5 M gratis al mes y después de pago; ElevenLabs desde 6 $/mes (el plan
gratuito no permite uso comercial). Con ~306 000 caracteres por acento el
curso cabría en los gratuitos de Google o Azure, pero exigiría cuenta y clave;
Kokoro dio calidad suficiente en local sin ellas. Si algún día se quiere
cambiar de motor, solo hay que sustituir la clase `Sintetizador` de
`tools/ingles/audio/generar.py`.

## 3. Voces (`public/assets/ingles/audio/voces.json`)

| Rol | English (US) | English (UK) | Uso |
|-----|--------------|--------------|-----|
| `n` | `af_heart` | `bf_emma` | narración, ejemplos, vocabulario, lecturas; primera voz femenina de un diálogo |
| `f` | `af_bella` | `bf_isabella` | segunda voz femenina de un diálogo |
| `m` | `am_michael` | `bm_george` | primera voz masculina |
| `m2` | `am_puck` | `bm_fable` | segunda voz masculina |

Cada personaje tiene género en `voces.json → personajes`. Las voces de un
diálogo se reparten con **una sola regla** (`asignarRoles()` en
`js/ingles/audio-textos.js`, idéntica a `in_roles_dialogo()` en
`ingles-ui.php`): femeninos → `n`, `f`; masculinos → `m`, `m2`; «Tú» y
hablantes sin género → la primera voz libre del género contrario al del
primer hablante.

Cambiar una voz = cambiar su nombre en `voces.json` y regenerar. Como la voz
forma parte de la ruta, los archivos viejos no se sobrescriben (quedan como
huérfanos y `verificar.py --borrar-huerfanos` los elimina).

## 4. Dónde está cada audio

```
public/assets/ingles/audio/
├── voces.json                 voces por acento y rol, personajes, palabras solo españolas
├── manifest.json              registro de cada archivo (ver §6)
├── .htaccess                  caché: clips 1 año (nombre por contenido), pistas 1 día
├── us/<voz>/<h0h1>/<hash>.mp3 una frase (clip), acento estadounidense
├── gb/<voz>/<h0h1>/<hash>.mp3 ídem, británico
├── lecturas/<us|gb>/<slug>.mp3 + .json   lectura completa + tiempos de cada frase
└── escucha/<us|gb>/<slug>.mp3 + .json    diálogo de escucha completo + tiempos de cada línea
```

`hash` = 16 primeros hex del SHA-1 del texto **normalizado** (NFC, comillas
rectas, espacios simples). El navegador lo calcula igual
(`js/ingles/audio-ruta.js`, SHA-1 propio, sin `crypto.subtle`), así que la
misma frase en veinte páginas usa **un** archivo y no hace falta cargar un
índice para saber qué pedir.

Formato: MP3 mono, 24 kHz (la frecuencia nativa del modelo), VBR LAME
calidad 5 (~57 kbps): voz limpia sin artefactos audibles de compresión y con
tamaño contenido. Volumen normalizado a −19 LUFS con pico ≤ −1,5 dBFS (solo
ganancia: sin limitador ni compresión que distorsionen), silencios de los
extremos recortados.

## 5. Qué suena y con qué texto

- **Inventario** (`tools/ingles/audio/recolectar.mjs`): recorre las ~270
  páginas de `/ingles` en un servidor local y recoge cada botón
  `[data-decir]` que pinta PHP (con su `data-rol`), y aplica a los JSON las
  mismas reglas que usa la interfaz para los botones creados en JavaScript
  (`audio-textos.js`: enunciados, soluciones, diálogos, tarjetas, juegos,
  conversaciones). Resultado: `corpus.json`.
- **Sin audio en español**: un texto que es mayoritariamente español no lleva
  botón (`esEspanol()` / `in_es_espanol()` con la lista de `voces.json`).
- **Texto que se sintetiza** (`texto_para_voz()` en `generar.py`): la página
  muestra su texto sin cambios; al sintetizar se quitan la transcripción AFI
  (`/ʃɪp/`), las glosas en español (`(barco)`, `= el primer piso`), las
  flechas de entonación y los separadores visuales (`/`, `·`, `→`), que pasan
  a ser pausas. Una demostración que es solo AFI (`/θriː/`) se sintetiza
  directamente desde sus fonemas. `revisar_limpieza.py` comprueba que no se
  pierde ninguna palabra inglesa.
- **Léxico** (`LEXICO` en `generar.py`): pronunciación de los nombres propios
  que el conversor texto→fonemas lee mal (Lucía, Querétaro, Juárez, León,
  Inés, Priya…), por acento.
- **Texto del estudiante** (escritura, práctica comunicativa): no puede tener
  archivo; el botón dice «voz del navegador». En las conversaciones, lo que
  el estudiante teclea se escucha con la forma modelo aceptada.

## 6. Manifiesto (`manifest.json`)

Para cada clip: texto de la página, texto realmente sintetizado, acento, rol,
voz, duración, bytes, versión de configuración (`CONFIG_VERSION`) y el
resultado de la verificación automática (lo que oyó Whisper y su tasa de error).
Para cada pista: duración, número de segmentos y configuración.

Con él y `corpus.json`, `verificar.py` detecta **faltantes** (texto nuevo sin
audio), **referencias rotas**, **huérfanos** (audio que ya nadie usa: texto o
voz cambiados), **duplicados** (imposibles por construcción: el nombre es el
hash del texto) y **desactualizados** (configuración distinta). Si el texto de
una frase cambia, cambia su hash: la página pide el archivo nuevo y el
recolector lo marca como pendiente; nunca se reproduce un audio que ya no
coincide con su texto.

## 7. Interfaz

- `voz.js`: `decir(texto, {rol, lento})` → `<audio>` con el MP3;
  `playbackRate` con `preservesPitch` (0,75 / 0,9 / 1 / 1,25; «lento» =
  0,75); acento y velocidad en `localStorage` (`ingles:voz:v1`); errores
  claros por recurso («El audio de esta frase no está disponible»), nunca
  «instala una voz».
- `reproductor.js`: pistas completas (lecturas y escucha) con ▶/❚❚,
  reinicio, ±5 s, barra de posición accesible, duración, velocidad, acento y
  «Repetir frase». No descarga el MP3 hasta pulsar ▶ (solo el `.json` de
  tiempos, unos KB). En las lecturas cada frase se envuelve en un `<span>` y
  se resalta mientras suena; los tiempos son **exactos** porque la pista es la
  concatenación de los audios de cada frase con pausas fijas (0,35 s entre
  frases, 0,8 s entre párrafos, 0,55 s entre líneas de diálogo). Pulsar una
  frase la reproduce.
- Escucha: la transcripción sigue bloqueada hasta haber oído el 90 % del
  audio e intentado una pregunta (o, si el audio no cargara, al intentar
  responder).
- `/ingles/audio`: elegir acento y velocidad, probarlos y leer cómo está
  hecho el audio.

## 8. Regenerar o ampliar

Requisitos de desarrollo (no se despliegan): entorno Python con `kokoro`,
`soundfile`, `torch`, `faster-whisper`, `pyloudnorm`, `whisper-normalizer`
(en este equipo: `~/.local/share/tutoriales-tts/`), `ffmpeg` y Node.

```bash
php -d opcache.enable_cli=0 -S 127.0.0.1:8765 -t public &      # servidor local
node tools/ingles/audio/recolectar.mjs                          # 1. inventario
PY=~/.local/share/tutoriales-tts/bin/python
$PY tools/ingles/audio/revisar_limpieza.py                     # 2. ¿se pierde alguna palabra?
$PY tools/ingles/audio/generar.py todos                        # 3. solo lo nuevo o cambiado
$PY tools/ingles/audio/verificar.py --asr --borrar-huerfanos   # 4. archivos + Whisper
PUPPETEER=… CHROMIUM=/usr/bin/chromium node tools/ingles/tests/audio.e2e.cjs   # 5. navegador
```

Paso opcional tras el 4: `$PY tools/ingles/audio/mejorar.py` toma los audios
que Whisper marcó como dudosos, prueba variantes (punto final, velocidad 0,95
y otra voz **del mismo acento y género**) y guarda en
`tools/ingles/audio/variantes.json` solo las que Whisper entiende mejor;
después se repiten 3 y 4. En la v1.7.0 quedaron 423 variantes (158 con otra
voz, sobre todo `bf_isabella` en lugar de `bf_emma`). La carpeta del archivo
sigue siendo la del rol (el navegador la calcula así); la voz real está en el
manifiesto.

Tras añadir una lección, palabra o lectura basta con repetir 1–5: el
generador solo sintetiza lo que falta. Un nombre propio nuevo mal
pronunciado se corrige en `LEXICO`; un personaje nuevo, en
`voces.json → personajes`.

## 9. Verificación de la v1.7.0

- 9 463 frases × 2 acentos + 24 pistas × 2 acentos: todos los archivos
  existen, se decodifican, no están vacíos y su duración es coherente con su
  texto; 0 huérfanos.
- Whisper transcribió los 18 926 clips con texto: **17 442 (92,2 %)
  coinciden palabra por palabra** con lo sintetizado. De los 559 avisos, la
  mayoría son del reconocedor y no del audio: horas escritas «7.30»,
  homófonos (*write/right*, *their/there*), nombres (*Mei* → «May», que es su
  pronunciación), fragmentos didácticos («s chool», «DOC-tor», «between …
  and …») y palabras sueltas, donde el reconocedor es poco fiable. Quedan
  unas decenas de casos plausiblemente reales, sobre todo frases de `bf_emma`
  con una distensión vocálica al final («homes», «runnings»). La lista
  completa está en `tools/ingles/audio/verificacion.txt` para revisarla
  escuchando.
- Las dos pistas de «Hola, soy Lucía» (US y UK) transcritas enteras: 65/65
  palabras, 0 diferencias.

## 10. Límites conocidos (dichos con claridad)

- Es voz **sintética neuronal**, no humana. Se verificó automáticamente que
  cada audio dice su texto (Whisper) y que los fonemas de los sonidos
  difíciles son correctos, pero la naturalidad de la entonación solo puede
  juzgarla una persona escuchando.
- Las voces británicas de Kokoro están peor valoradas por su autor que la
  principal estadounidense (`bf_emma` B−, `af_heart` A).
- «Lento» y 0,75× ralentizan el audio con el tono preservado por el
  navegador; a velocidades muy bajas puede notarse un leve artefacto.
