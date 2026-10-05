# Encargo: pistas que regalan la respuesta · Academia de Inglés

Proyecto: `/home/lucio/Documentos/creacionSoftware/tutoriales`.

Regla del curso (docs/INGLES_CONTENIDO.md §3.3): cada ejercicio tiene 3 pistas
progresivas: 1) recuerda el concepto; 2) señala qué parte de la oración mirar;
3) enuncia la regla exacta. **La pista 3 casi resuelve, pero NO escribe la
respuesta.** Tampoco la pista 2.

Fugas típicas a corregir:
- La oración entera con «+» o en orden: «Is + it + cold + today?».
- La forma pedida entre comillas o tras flecha: «take → took», «usa "doesn't"».
- La respuesta deletreada, o la opción correcta citada.

Aceptable (no lo toques): una regla que por naturaleza nombra la forma cuando
el ejercicio es precisamente elegir entre formas y la pista explica la
condición («con he/she/it o un sustantivo singular, is»), siempre que no
aplique esa regla al caso concreto por el estudiante («aquí el sujeto es
Ana, así que is»).

Cómo reescribir: da la regla general, la estructura con nombres de funciones
(«auxiliar + sujeto + verbo en forma base + complemento + ?»), un ejemplo
PARALELO con otras palabras («como en Are they ready?»), o la condición que
hay que comprobar. Mantén el tono y el español de México.

## Procedimiento

1. `python3 tools/ingles/pistas-sospechosas.py <unidad>` lista candidatas;
   revisa además TODAS las pistas 2 y 3 de la unidad con
   `php tools/ingles/revisar.php <unidad> --solo-ejercicios` (el detector no lo ve todo).
2. Edita SOLO los borradores `tools/ingles/borradores/<unidad>/*.json` (usa
   Python para no romper el JSON) y cambia solo pistas (y, si una pista 2
   también regala, esa).
3. `php tools/ingles/ensamblar.php <unidad>`, `php tools/ingles/validar.php <unidad>`
   y `node --no-warnings tools/ingles/tests/datos.test.mjs <unidad>` → 0 errores.

Informe final (≤100 palabras): pistas reescritas por unidad.
