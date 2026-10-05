# Academia de Inglés · datos de los juegos

Los diez juegos leen sus niveles de `public/assets/ingles/data/juegos.json`.
Todos comparten el mismo armazón (`js/ingles/juegos/base.js`): marcador,
vidas o tiempo cuando aplica, **pista** por ronda, **solución razonada**
tras fallar, pantalla de resultado con lo que se practicó y guardado del
progreso. Ningún juego tiene su propia lógica de corrección: todos llaman a
`evaluar()` de `evaluador.js`.

Campos comunes de cada juego:

```json
{ "slug": "…", "numero": 1, "nombre": "…", "resumen": "…",
  "mecanica": "Cómo se juega, en dos o tres frases.",
  "controles": "Ratón/táctil y teclado.",
  "aprende": ["Qué se practica", "…"],
  "niveles": [ NIVEL, … ] }
```

Campos comunes de cada NIVEL:
`{"id": "1", "nombre": "…", "dificultad": "facil|media|dificil", "objetivo": "Qué hay que conseguir", "exito": {"minimo": 80}}`
(`exito.minimo` = porcentaje de aciertos para superar el nivel; por defecto 70).
Mínimo **3 niveles** por juego, de dificultad creciente, que recorran el
curso (bloques 1–3 en el nivel 1, 4–6 en el 2, 7–10 en el 3…).

Todo texto de ronda cumple las reglas editoriales de
`docs/INGLES_CONTENIDO.md` (original, traducción natural, porqué razonado).

## 1. `ordena-la-oracion`

`"rondas": [{"respuesta": "Where does your sister work?", "alternativas": [], "distractores": ["do"], "es": "¿Dónde trabaja tu hermana?", "explicacion": "…por qué ese orden…", "pista": "…"}]` (≥6)

Las fichas salen de partir `respuesta` por espacios (la puntuación final se
muestra fija). `distractores` (opcional) añade fichas que sobran.
`alternativas`: otros órdenes igualmente correctos.

## 2. `encuentra-el-error`

`"rondas": [{"frase": "She don't like tea.", "error": "don't", "correccion": "doesn't", "es": "A ella no le gusta el té.", "explicacion": "…", "pista": "…"}]` (≥6)

El jugador pulsa la palabra incorrecta; si acierta, elige/escribe la corrección.

## 3. `escucha-y-selecciona`

Generado desde `vocabulario.json`:
`{"modo": "significado", "temas": ["familia", "hogar"], "rondas": 10}` — se oye
una palabra y se elige su significado en español entre 4.
`{"modo": "palabra", …}` — se oye una palabra y se elige cómo se escribe entre 4.
`{"modo": "pares_minimos", "pares": [{"a": "ship", "es_a": "barco", "b": "sheep", "es_b": "oveja", "pista": "…"}]}` (≥6) —
se oye UNA de las dos y se elige cuál fue.

## 4. `memoria-de-vocabulario`

Generado desde `vocabulario.json`:
`{"modo": "imagen", "temas": ["comida"], "parejas": 6}` (imagen ↔ palabra, solo palabras con `emoji`) o
`{"modo": "significado", "temas": ["trabajo-y-profesiones"], "parejas": 8}` (inglés ↔ español).

## 5. `completa-el-dialogo`

`"rondas": [{"contexto": "…", "lineas": [{"quien": "Ana", "en": "…", "es": "…"}, {"quien": "Tú", "en": "___", "es": ""}], "opciones": [{"texto": "…", "correcta": true, "porque": "…"}], "pista": "…"}]` (≥5)

Exactamente una línea con `"en": "___"`: la que dice el jugador.

## 6. `detective-gramatical`

`"rondas": [{"frase": "My cousins aren't at home.", "es": "…", "resaltar": "aren't", "pregunta": "¿Qué regla explica «aren't»?", "opciones": [{"texto": "…", "correcta": true, "porque": "…"}], "pista": "…"}]` (≥6)

`resaltar` debe aparecer literalmente en `frase`.

## 7. `construye-la-pregunta`

`"rondas": [{"afirmacion": "Tom lives in Denver.", "objetivo": "Pregunta con where (la respuesta es «in Denver»)", "respuestas": ["Where does Tom live?"], "explicacion": "…", "pista": "…"}]` (≥6)

El jugador ESCRIBE la pregunta; se corrige con el evaluador.

## 8. `viaje-interactivo`

```json
"vidas": 3,
"paradas": [ {
  "lugar": "Aeropuerto", "emoji": "✈️",
  "situacion": "…",
  "retos": [
    {"tipo": "opcion", "linea": {"quien": "Agente", "en": "…", "es": "…"}, "pregunta": "¿Qué respondes?", "opciones": [{"texto": "…", "correcta": true, "porque": "…"}], "explicacion": "…", "pista": "…"},
    {"tipo": "escribir", "pregunta": "Pide un taxi al centro.", "respuestas": ["…"], "explicacion": "…", "pista": "…"},
    {"tipo": "ordenar", "pregunta": "Ordena para preguntar…", "respuesta": "…", "explicacion": "…", "pista": "…"}
  ] } ]
```
≥3 paradas por nivel. Cada fallo cuesta una vida; sin vidas, se repite la parada.

## 9. `desafio-de-tiempos`

`"segundos": 90, "rondas": [{"frase": "Look! It ___ .", "opciones": ["rains", "is raining", "rained"], "correcta": "is raining", "senal": "Look!", "es": "¡Mira! Está lloviendo.", "explicacion": "…", "pista": "…"}]` (≥8)

Contrarreloj: cada acierto suma tiempo; la `senal` es la expresión del
contexto que decide el tiempo verbal y se resalta al mostrar la solución.

## 10. `mision-final`

```json
"capitulos": [ { "titulo": "…", "narracion": "Texto en inglés que avanza la historia.", "es": "Traducción.",
  "retos": [ RETO (mismo formato que en viaje-interactivo) ] } ]
```
≥3 capítulos por nivel; los retos mezclan contenidos de varias unidades.
