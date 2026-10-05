# Encargo de redacción · Academia de Inglés (Tutoriales Lucio v1.6.0)

Vas a redactar contenido educativo ORIGINAL para un curso de inglés desde
cero (orientado a A1–A2) para un hispanohablante adulto de México que quiere
entender, escribir, escuchar y hablar inglés. Es el módulo más cuidado del
proyecto: la calidad pedagógica manda sobre la cantidad.

Proyecto: `/home/lucio/Documentos/creacionSoftware/tutoriales`

## Lee antes de escribir (obligatorio)

1. `docs/INGLES_CONTENIDO.md` — el esquema exacto de cada archivo. Todo campo
   obligatorio es obligatorio; el validador rechaza lo que no cumpla.
2. `public/assets/ingles/data/curso.json` — el currículo completo: bloques,
   unidades, lecciones, objetivos y prerrequisitos. Te dice qué se ha
   enseñado ANTES de tu contenido.
3. `docs/INGLES_JUEGOS.md` — solo si redactas juegos.

## Derechos de autor (innegociable)

- El currículo se inspiró en los TEMAS de un libro comercial. **No lo busques,
  no lo abras y no intentes recordar su contenido.** Todo lo que escribas
  (explicaciones, ejemplos, diálogos, lecturas, ejercicios, soluciones) se
  crea desde cero con tu conocimiento general del idioma.
- Nada de letras de canciones, citas, marcas, personas famosas ni lugares
  comerciales reales. Personajes inventados con nombres variados (Ana, Tom,
  Mei, Carlos, Priya, Sam, Lucía, Omar, Grace, Diego, Aisha, Ben…).

## Nivel pedagógico exigido

El estudiante pidió explícitamente NO recibir explicaciones superficiales.
Un ejemplo de la profundidad esperada, en presente simple:

> **Situación:** una persona explica su rutina laboral.
> **Oración:** "My brother works at a hospital." — «Mi hermano trabaja en un hospital».
> **Estructura:** My brother | works | at a hospital → Sujeto | Verbo | Complemento
> **Explicación:** usamos "works" porque el sujeto es tercera persona del singular.
> **Comparación:** "I work at a hospital." / "My brother works at a hospital." — por qué cambia el verbo.
> **Pregunta:** "Does your brother work at a hospital?" — por qué desaparece la -s de works al usar does.
> **Negación:** "My brother doesn't work at a hospital." — la estructura, otra vez explicada.

Cada concepto importante recorre el ciclo
EXPLICAR → MOSTRAR → SEÑALAR → PRACTICAR → RESOLVER → INTERPRETAR:
qué es · para qué sirve · cómo funciona · cómo se construye (fórmula visual) ·
ejemplos anotados y traducidos · pronunciación · errores frecuentes ·
ejercicios con pistas y solución razonada · práctica comunicativa.

Y además:

- **Diferencias con el español**: señala siempre los calcos que comete un
  hispanohablante (omitir el sujeto, «I have 20 years», «people is»,
  adjetivo después del sustantivo, «the life is…», «He don't…», etc.).
- **Extensión justificada**, no relleno: nada de repetir la misma idea con
  otras palabras. Cada ejemplo enseña algo (un sujeto distinto, un caso
  límite, un uso nuevo).
- **Reglas correctas**: nunca simplifiques con una regla falsa. Si hay una
  excepción relevante para el nivel, explícala; si no lo es, di que existe.
- **Progresión**: en ejercicios y ejemplos usa solo gramática ya enseñada
  (mira los prerrequisitos y las unidades anteriores en curso.json). Si
  necesitas algo posterior, preséntalo como expresión fija con traducción.
- **Pronunciación útil**: AFI entre barras con acento estadounidense general
  (señala el británico cuando difiere de verdad) y un `consejo` que explique
  qué hace la boca o con qué sonido del español se parece o NO se parece.
  Nada de depender solo de «se pronuncia como…» en ortografía española.
- **Español neutro de México** (tú; «celular», «carro/auto»; nada de vosotros).
- **Traducciones naturales**, no palabra por palabra.

## Ejercicios (lo más importante)

- Mínimo 8 por lección (ideal 10–12), de al menos 4 tipos, en dificultad
  creciente. Mezcla reconocimiento (opcion, relacionar) y producción
  (completar, ordenar, traducir, transformar, corregir, dictado). Incluye
  por lección al menos uno de `pronunciacion` o `dictado`, y en las
  lecciones donde encaje un `escritura` breve o una `conversacion`.
- **3 pistas progresivas**: 1) recuerda el concepto; 2) señala qué parte de
  la oración mirar; 3) enuncia la regla exacta. La pista 3 casi resuelve,
  pero no dice la respuesta.
- **Solución razonada**: «La respuesta correcta es works porque el sujeto es
  he, tercera persona del singular; en presente simple el verbo añade -s…».
- **Todas las respuestas válidas** en `respuestas` (el evaluador ya iguala
  mayúsculas, puntuación y contracciones; tú enumera variantes de orden y
  de vocabulario: «Hi»/«Hello», «I'm from Mexico»/«I come from Mexico»…).
  Si una traducción admite muchas formas, restringe el enunciado para que
  la respuesta quede acotada («Usa la forma contraída», «Usa have got»…).
- **`errores_tipicos`**: añade 1–3 en completar/traducir/transformar con los
  fallos previsibles y su explicación. Deben ser realmente incorrectos.
- En `opcion`/`conversacion`, CADA opción explica su porqué (también las
  incorrectas: por qué no vale).
- Evaluación de unidad: 12–20 preguntas NUEVAS (no copies los ejercicios de
  las lecciones) que cubran todas las lecciones y ≥3 habilidades.

## Visuales

Usa `visual` en los conceptos donde un diagrama enseñe algo que el texto no:
línea de tiempo para tiempos verbales; `transformacion` para mostrar cómo
una afirmación se convierte en negación o pregunta; `escena` para
preposiciones y there is; `mapa` para familias de formas (pronombres,
palabras interrogativas…). Sin visuales decorativos.

## Cómo trabajar

1. Escribe por piezas en `tools/ingles/borradores/<unidad>/`:
   `00-unidad.json` ({"slug", "introduccion"}), `01-<leccion>.json`, …,
   `99-evaluacion.json`. Una lección por archivo.
2. Ensambla: `php tools/ingles/ensamblar.php <unidad>`
3. Valida: `php tools/ingles/validar.php <unidad>` → 0 errores. Corrige los
   avisos cuando tengan sentido.
4. Prueba las respuestas con el evaluador real:
   `node tools/ingles/tests/datos.test.mjs <unidad>` → 0 errores.
5. Relee TODO tu inglés como lo haría un profesor nativo exigente: gramática,
   naturalidad, traducciones, que cada solución corresponda a su ejercicio y
   que no exista otra respuesta válida que el evaluador rechazaría.

No modifiques ningún archivo fuera de tus borradores y de los JSON que te
tocan. No toques `curso.json`: si crees que algo del currículo debería
cambiar, dilo en tu informe final.

## Informe final (breve, ≤150 palabras)

Qué archivos generaste, cuántas lecciones/ejercicios/preguntas, resultado
del validador y de datos.test, y cualquier duda lingüística o curricular.
