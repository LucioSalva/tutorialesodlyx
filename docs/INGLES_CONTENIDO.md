# Academia de Inglés · esquema de contenido

> Contrato entre los archivos JSON de `public/assets/ingles/data/`, las vistas
> PHP que los pintan y el motor JavaScript que corrige los ejercicios.
> Si un campo no está aquí, el sistema lo ignora. Si un campo obligatorio
> falta, `php tools/ingles/validar.php` lo señala y la unidad no se publica.

## 0. Reglas editoriales (obligatorias)

1. **Contenido original.** Explicaciones, ejemplos, diálogos, lecturas,
   ejercicios y soluciones se escriben desde cero. El libro de referencia
   solo sirvió para fijar la lista de temas; no se copia ni se parafrasea
   ninguno de sus textos, ejemplos, diálogos, ejercicios ni respuestas.
2. **Español neutro de México** en las explicaciones (tú, no vos/vosotros).
   El inglés de los ejemplos es estadounidense por defecto; cuando el
   británico difiere de forma relevante, se señala.
3. **Nunca una regla falsa para simplificar.** Si hay excepciones
   relevantes para el nivel, se explican; si no lo son, se dice
   «hay excepciones que verás más adelante».
4. **Soluciones razonadas.** Nunca «Incorrecto. Respuesta: works». Siempre
   el porqué, anclado en la regla de la lección.
5. **Cada ejemplo con traducción** natural (no palabra por palabra).
6. **Varias respuestas válidas → todas en la lista.** El evaluador ya
   acepta mayúsculas, puntuación final y contracciones; las variantes de
   ORDEN o de VOCABULARIO hay que enumerarlas.
7. Nada de marcas, personas famosas reales ni datos personales reales.
   Los personajes son inventados (Ana, Tom, Mei, Carlos, Priya, Sam…).

## 1. Marcado dentro de los textos

Todos los campos de texto son texto plano, escapado por PHP. Se admiten
solo estas marcas, que el servidor convierte a HTML seguro:

| Marca | Resultado | Uso |
|-------|-----------|-----|
| `**texto**` | negrita | énfasis |
| `[[texto]]` | inglés resaltado, con `lang="en"` | palabras inglesas dentro de un texto en español |
| `{{rol:texto}}` | texto coloreado con su función gramatical | señalar el sujeto, el verbo, etc. dentro de una explicación |
| `/ipa/` dentro de `ipa` | se pinta en monoespaciada | solo en campos `ipa` |

Roles válidos (se usan igual en `partes`, `formula` y `{{rol:…}}`):
`sujeto`, `verbo`, `auxiliar`, `negacion`, `complemento`, `interrogativo`,
`tiempo`, `otro`.

## 2. `curso.json`

Índice académico. Bloques, unidades (con `slug`, `numero`, `bloque`,
`titulo`, `resumen`, `nivel`, `prerrequisitos`, `objetivos`,
`temas_vocabulario`) y la lista de `lecciones` de cada unidad
(`slug`, `titulo`, `resumen`). El `slug` de lección es único en todo el
curso. El archivo de la unidad debe tener exactamente esas lecciones, en
ese orden.

Una unidad se publica cuando existe `unidades/<slug>.json` y supera el
validador. No hay campo de «estado» que se pueda poner a mano.

## 3. Archivo de unidad `unidades/<slug-unidad>.json`

```json
{
  "slug": "verbo-to-be",
  "introduccion": "Texto breve: qué vas a poder hacer al terminar la unidad.",
  "lecciones": [ LECCION, … ],
  "evaluacion": EVALUACION
}
```

### 3.1 LECCION

```json
{
  "slug": "am-is-are",
  "titulo": "Am, is, are: ser y estar",
  "minutos": 30,
  "objetivos": ["…", "…"],
  "situacion": { "titulo": "…", "texto": "Escena breve que motiva la lección." , "dialogo": [LINEA, …] },
  "conceptos": [ CONCEPTO, … ],
  "ejercicios": [ EJERCICIO, … ],
  "practica_comunicativa": PRACTICA,
  "resumen": { "esencial": ["…"], "recuerda": ["…"] },
  "repaso": [ TARJETA_GRAMATICA, … ]
}
```

- `situacion` (opcional pero recomendada): la escena real que abre la lección.
- `conceptos`: de 1 a 4. Cada concepto importante pasa por el ciclo completo.
- `ejercicios`: **mínimo 8**, de al menos **4 tipos** distintos, en
  dificultad creciente (1 → 3).
- `repaso`: de 3 a 6 tarjetas de gramática para el repaso espaciado.

### 3.2 CONCEPTO — el ciclo completo

```json
{
  "id": "formas-de-be",
  "titulo": "Las tres formas: am, is, are",
  "que_es": "Explicación sencilla en español.",
  "para_que": ["Situación real 1", "Situación real 2"],
  "como_funciona": "La regla, explicada con calma.",
  "estructuras": [ ESTRUCTURA, … ],
  "tablas": [ TABLA, … ],
  "ejemplos": [ EJEMPLO, … ],
  "comparacion": COMPARACION,
  "visual": VISUAL,
  "pronunciacion": [ PRON, … ],
  "errores": [ ERROR, … ],
  "nota": { "titulo": "…", "texto": "…", "tono": "info" }
}
```

Obligatorios: `id`, `titulo`, `que_es`, `para_que`, `como_funciona`,
`estructuras` (≥1), `ejemplos` (≥3), `pronunciacion` (≥1), `errores` (≥1).
Opcionales: `tablas`, `comparacion`, `visual`, `nota`.

**ESTRUCTURA** — la fórmula visual y un ejemplo que la sigue pieza a pieza:

```json
{
  "etiqueta": "Afirmación",
  "formula": [ {"t": "Sujeto", "rol": "sujeto"}, {"t": "am / is / are", "rol": "verbo"}, {"t": "complemento", "rol": "complemento"} ],
  "ejemplo": [ {"t": "She", "rol": "sujeto"}, {"t": "is", "rol": "verbo"}, {"t": "a nurse", "rol": "complemento"} ],
  "es": "Ella es enfermera."
}
```

**TABLA**

```json
{ "titulo": "…", "columnas": ["Sujeto", "Forma", "Ejemplo"], "filas": [["I", "am", "I am tired."]], "audio": [2] }
```
`audio` = índices de columna cuyas celdas tienen botón de escuchar
(solo columnas en inglés).

**EJEMPLO** (anotado)

```json
{
  "en": "My brother works at a hospital.",
  "es": "Mi hermano trabaja en un hospital.",
  "situacion": "Una persona explica la rutina de su familia.",
  "partes": [ {"t": "My brother", "rol": "sujeto"}, {"t": "works", "rol": "verbo"}, {"t": "at a hospital", "rol": "complemento"} ],
  "nota": "Por qué es así: works lleva -s porque el sujeto es tercera persona del singular."
}
```
Las `partes` concatenadas con espacios deben reproducir `en` (sin contar la
puntuación final). `situacion` y `nota` son opcionales, pero al menos la
mitad de los ejemplos de un concepto deberían tener `nota`.

**COMPARACION**

```json
{ "a": {"titulo": "I work", "items": ["…"]}, "b": {"titulo": "He works", "items": ["…"]}, "veredicto": "…" }
```

**VISUAL** — diagramas originales que PHP dibuja en SVG:

- Línea de tiempo:
  `{"tipo": "linea_tiempo", "titulo": "…", "marcas": [{"pos": 0.2, "texto": "every day", "tipo": "repeticion"}], "ahora": 0.5, "pie": "…"}`
  `pos` entre 0 y 1; `ahora` marca el presente; `tipo` = `punto` | `repeticion` | `tramo` (con `hasta`).
- Mapa conceptual:
  `{"tipo": "mapa", "titulo": "…", "centro": "to be", "ramas": [{"texto": "am", "detalle": "I"}]}`
- Escena de lugar (preposiciones):
  `{"tipo": "escena", "titulo": "…", "objetos": [{"emoji": "📦", "x": 0.5, "y": 0.6, "etiqueta": "box"}, {"emoji": "🐈", "x": 0.5, "y": 0.8, "etiqueta": "The cat is under the box."}]}`
- Transformación:
  `{"tipo": "transformacion", "titulo": "…", "pasos": [{"etiqueta": "Afirmación", "partes": [PARTES]}, {"etiqueta": "Pregunta", "partes": [PARTES]}], "pie": "…"}`

**PRON**

```json
{ "texto": "I'm", "ipa": "/aɪm/", "consejo": "Una sola sílaba: suena como «aim».", "lento": true }
```
El `consejo` explica qué hace la boca o con qué sonido del español se
parece; nunca se limita a una transcripción aproximada.

**ERROR**

```json
{ "mal": "I have 25 years.", "bien": "I'm 25 (years old).", "porque": "En inglés la edad se expresa con be, no con have." }
```

### 3.3 EJERCICIO — campos comunes

```json
{
  "id": "verbo-to-be.am-is-are.01",
  "tipo": "completar",
  "dificultad": 1,
  "enunciado": "Completa con am, is o are.",
  "pistas": ["Pista 1: recuerda el concepto.", "Pista 2: mira esta parte de la oración.", "Pista 3: la regla exacta."],
  "solucion": { "respuesta": "is", "explicacion": "La respuesta correcta es is porque el sujeto es she…" },
  "audio": true
}
```

- `id`: `<unidad>.<leccion>.<nn>` (en evaluaciones: `<unidad>.eval.<nn>`;
  en exámenes: `<examen>.<nn>`). Único en todo el curso.
- `pistas`: **exactamente 3**, progresivas (concepto → dónde mirar → regla).
- `solucion.explicacion`: razonada, con el porqué.
- `audio` (opcional): muestra un botón para escuchar la frase en inglés del
  ejercicio.
- `literal` (opcional, `true`): desactiva la equivalencia de contracciones.
  Úsalo SOLO cuando el objetivo del ejercicio es escribir la contracción
  («Escribe la forma contraída de I am» → solo vale `I'm`).
- `mayusculas` (opcional, `true`): distingue mayúsculas y minúsculas. Úsalo
  SOLO cuando el objetivo es la mayúscula (nacionalidades, idiomas, días,
  meses, el pronombre I). Ojo: también se exigirá la mayúscula inicial de
  la oración, así que redacta el enunciado para que quede claro.

**Cómo corrige el evaluador** (`public/assets/js/ingles/texto.js`): ignora
mayúsculas, puntuación (. , ! ? ; : comillas), espacios repetidos, guiones
(`twenty-one` = `twenty one`) y apóstrofos tipográficos; y considera
equivalentes las contracciones (`isn't` = `is not` = `'s not` tras
pronombre; `can't` = `cannot` = `can not`; `I'd` = `I would`;
`she's got` = `she has got`). El genitivo `Anna's` no se expande. Todo lo
demás (otra palabra, otro orden, una -s de más o de menos) es un error.
Por tanto, en `respuestas` NO hace falta repetir variantes de contracción
o de puntuación, pero SÍ las de orden o vocabulario (`I'm from Mexico` /
`I come from Mexico`).

### 3.4 Tipos de ejercicio

| `tipo` | Campos propios | Qué hace el estudiante |
|--------|----------------|------------------------|
| `opcion` | `pregunta`, `opciones: [{texto, correcta, porque}]` | Elige. **Cada opción** lleva `porque`: por qué es correcta o por qué no. |
| `completar` | `frase` con uno o más `___`, `respuestas: [[…],[…]]` (una lista por hueco), `banco` (opcional), `traduccion` (opcional), `errores_tipicos` (opcional) | Escribe (o elige del banco) la palabra de cada hueco. |
| `ordenar` | `fichas: ["…"]`, `respuestas: ["…"]`, `traduccion` | Construye la oración pulsando o arrastrando fichas. |
| `relacionar` | `pares: [{a, b}]` (4–8 pares) | Une cada elemento con su pareja. |
| `traducir` | `es`, `respuestas: ["…"]`, `errores_tipicos` | Escribe la oración en inglés. |
| `transformar` | `origen`, `instruccion` (p. ej. «Negativa»), `respuestas` | Convierte la oración. |
| `corregir` | `frase`, `error` (la palabra o grupo incorrecto, tal como aparece), `correcciones: ["…"]`, `frase_correcta` | Señala la palabra incorrecta y escribe la corrección. |
| `dictado` | `texto` (se escucha, no se ve), `respuestas` (opcional, variantes) | Escucha y escribe. |
| `conversacion` | `contexto`, `lineas: [LINEA]`, `opciones: [{texto, correcta, porque}]` | Elige la respuesta adecuada en el diálogo. |
| `escritura` | ver 3.5 | Redacta; se revisa con criterios. |
| `pronunciacion` | `texto`, `ipa`, `consejo`, `es` | Escucha, lee, repite, se graba (opcional) y compara. |

`errores_tipicos` convierte un fallo previsible en una explicación
concreta. Clave = respuesta incorrecta tal como la escribiría el
estudiante (en huecos múltiples, las respuestas unidas con ` | `);
valor = explicación.

```json
"errores_tipicos": { "work": "Falta la -s: con he/she/it el verbo lleva -s en presente simple." }
```

**LINEA** de diálogo: `{"quien": "Ana", "en": "…", "es": "…"}`.

### 3.5 Escritura libre

```json
{
  "tipo": "escritura",
  "objetivo": "…",
  "instrucciones": "…",
  "vocabulario_apoyo": ["…"],
  "estructuras": ["I'm … years old.", "…"],
  "ejemplo": "Un ejemplo corto de OTRO tema parecido (no la respuesta).",
  "min_palabras": 30,
  "comprobaciones": [ {"descripcion": "Usas I'm o I am al menos una vez", "patron": "\\b(i'm|i am)\\b"} ],
  "criterios": ["¿Cada oración tiene sujeto?", "…"],
  "modelo": "Respuesta modelo original completa.",
  "explicacion": "Por qué el modelo funciona, estructura por estructura.",
  "errores_comunes": ["…"]
}
```

Las `comprobaciones` son expresiones regulares (sin distinguir mayúsculas)
que verifican **presencia** de estructuras. La interfaz dice claramente
que no evalúan la corrección gramatical: esa parte la hace el estudiante
con los `criterios` y el `modelo`.

### 3.6 PRACTICA comunicativa

```json
{
  "titulo": "…",
  "contexto": "Dónde estás y con quién hablas.",
  "dialogo": [LINEA, …],
  "tu_turno": "Qué tienes que decir o escribir tú.",
  "modelo": "Una respuesta posible.",
  "alternativas": ["Otra forma válida", "…"],
  "claves": ["Qué estructura usar", "…"]
}
```

### 3.7 TARJETA_GRAMATICA (repaso espaciado)

```json
{ "id": "verbo-to-be.am-is-are.r1", "frente": "¿Qué forma de be va con they?", "reverso": "are → They are students.", "nota": "…" }
```

### 3.8 EVALUACION de unidad

```json
{
  "titulo": "Evaluación: el verbo to be",
  "aprobado": 70,
  "preguntas": [ EJERCICIO + {"leccion": "am-is-are", "habilidad": "gramatica"} , … ]
}
```

- De **12 a 20** preguntas, que cubran **todas** las lecciones de la unidad.
- `habilidad` ∈ `gramatica`, `vocabulario`, `comprension`, `interpretacion`, `produccion`.
- Deben aparecer al menos 3 habilidades distintas y al menos 4 tipos de
  ejercicio. No se admite `escritura` ni `pronunciacion` en evaluaciones
  (no se pueden corregir de forma fiable).
- Las preguntas son **nuevas**: no repiten los ejercicios de las lecciones.

## 4. Otros archivos

| Archivo | Contenido |
|---------|-----------|
| `vocabulario.json` | `temas: [{slug, nombre, icono, descripcion}]`, `palabras: [PALABRA]` |
| `pronunciacion.json` | guía de sonidos, AFI y prácticas |
| `lecturas.json` | lecturas graduadas con preguntas |
| `escucha.json` | diálogos para comprensión auditiva |
| `conversaciones.json` | escenarios ramificados |
| `escritura.json` | tareas de escritura (formato 3.5) |
| `juegos.json` | juegos y sus niveles |
| `examenes.json` | exámenes acumulativos por bloque |

**PALABRA**

```json
{
  "id": "familia.brother",
  "en": "brother",
  "es": "hermano",
  "tipo": "sustantivo",
  "tema": "familia",
  "ipa": "/ˈbrʌðər/",
  "emoji": "👦",
  "ejemplo": { "en": "My brother is a nurse.", "es": "Mi hermano es enfermero." },
  "plural": "brothers",
  "formas": { "pasado": "…", "participio": "…", "tercera": "…", "ing": "…" },
  "variantes": { "us": "…", "gb": "…" },
  "relacionadas": ["sister", "siblings"],
  "nota": "…"
}
```

`tipo` ∈ `sustantivo`, `verbo`, `adjetivo`, `adverbio`, `preposicion`,
`pronombre`, `expresion`, `numero`, `determinante`, `conjuncion`,
`interjeccion`. `emoji` solo cuando representa la palabra sin ambigüedad
(se usa en las tarjetas «imagen → palabra»); si no la hay, se omite.

## 5. Esquemas de los archivos complementarios

### 5.1 `pronunciacion.json`

```json
{
  "introduccion": "…",
  "afi": { "que_es": "…", "como_leer": ["…"], "simbolos_extra": [{"simbolo": "ˈ", "significa": "…"}] },
  "secciones": [
    {
      "slug": "vocales-cortas-y-largas",
      "titulo": "…",
      "resumen": "…",
      "explicacion": "…",
      "sonidos": [ { "simbolo": "iː", "nombre": "i larga", "ejemplos": ["see", "green"], "como": "Qué hace la boca.", "espanol": "Comparación con el español.", "ipa_ejemplos": ["/siː/", "/ɡriːn/"] } ],
      "puntos": [ { "titulo": "…", "texto": "…", "ejemplos": [ {"en": "…", "ipa": "…", "es": "…"} ] } ],
      "pares_minimos": [ { "a": "ship", "ipa_a": "/ʃɪp/", "es_a": "barco", "b": "sheep", "ipa_b": "/ʃiːp/", "es_b": "oveja" } ],
      "practica": [ EJERCICIO ]
    }
  ]
}
```
`sonidos`, `puntos` y `pares_minimos` son opcionales según la sección, pero
cada sección tiene `practica` (≥3 ejercicios: `pronunciacion`, `opcion`,
`dictado`…).

### 5.2 `lecturas.json`

```json
{ "lecturas": [ {
  "slug": "…", "titulo": "…", "nivel": "A1", "unidad": "slug-de-unidad-relacionada",
  "resumen": "…", "antes_de_leer": "Qué fijarse al leer.",
  "parrafos": [ {"en": "…", "es": "…"} ],
  "vocabulario": [ {"en": "…", "es": "…", "nota": "…"} ],
  "gramatica": [ {"titulo": "…", "texto": "…", "ejemplo": "…"} ],
  "preguntas": [ EJERCICIO ]
} ] }
```

### 5.3 `escucha.json`

```json
{ "audios": [ {
  "slug": "…", "titulo": "…", "nivel": "A1", "unidad": "…",
  "contexto": "Lo que sabes ANTES de escuchar (sin revelar las respuestas).",
  "hablantes": [ {"nombre": "Ana", "voz": "a"}, {"nombre": "Tom", "voz": "b"} ],
  "lineas": [ {"quien": "Ana", "en": "…", "es": "…"} ],
  "vocabulario": [ {"en": "…", "es": "…"} ],
  "preguntas": [ EJERCICIO ]
} ] }
```
La transcripción y la traducción NO se muestran hasta que el estudiante
ha escuchado el audio al menos una vez y ha intentado responder.

### 5.4 `conversaciones.json`

```json
{ "escenarios": [ {
  "slug": "…", "titulo": "…", "nivel": "A1", "unidad": "…",
  "contexto": "…", "personaje": "Nombre y papel", "tu_papel": "…",
  "inicio": "n1",
  "nodos": [
    { "id": "n1", "quien": "Recepcionista", "en": "Good morning! How can I help you?", "es": "…",
      "significa": "Qué significa la pregunta.", "estructura": "Qué estructura usa.",
      "respuestas": [
        {"texto": "I have a reservation.", "correcta": true, "porque": "…", "siguiente": "n2"},
        {"texto": "I am have a reservation.", "correcta": false, "porque": "…"}
      ],
      "escribir": { "respuestas": ["I have a reservation", "I've got a reservation"], "siguiente": "n2" } },
    { "id": "fin", "fin": true, "en": "…", "es": "…", "resumen": "Qué practicaste." }
  ]
} ] }
```
Cada nodo no final: ≥2 respuestas, ≥1 correcta, todas con `porque`.
`escribir` es opcional (permite teclear en lugar de elegir).

### 5.5 `escritura.json`

`{ "tareas": [ ESCRITURA (3.5) + {"slug", "titulo", "nivel", "unidad"} ] }`

### 5.6 `examenes.json`

```json
{ "examenes": [ {
  "slug": "examen-construir-oraciones", "bloque": "construir-oraciones",
  "titulo": "…", "aprobado": 70,
  "preguntas": [ EJERCICIO + {"unidad": "slug", "habilidad": "…"} ]
} ] }
```
De 20 a 30 preguntas. Cubren todas las unidades del bloque y, desde el
bloque 2, entre el 15 % y el 25 % de las preguntas son de bloques
anteriores (retención). Sin `escritura` ni `pronunciacion`.

### 5.7 `juegos.json`

`{ "juegos": [ {"slug", "numero", "nombre", "resumen", "mecanica", "controles", "aprende": [], "niveles": [NIVEL] } ] }`

Cada NIVEL: `{"id", "nombre", "dificultad", "objetivo", "exito": {"minimo": 80}, …datos del juego}`.
Los datos por juego están descritos en `docs/INGLES.md` §Juegos.
