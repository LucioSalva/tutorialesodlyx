# Academia de Redes · documentación técnica

> Módulo de Tutoriales Lucio para aprender redes con ejercicios que se corrigen
> solos. Introducido en la **v1.8.0** con dos módulos: **Subneteo IPv4** y
> **VLAN**. Vive en `/redes` y no modifica los tutoriales, la Academia de
> Comandos ni la Academia de Inglés.

## 1. Qué contiene

| Módulo | Lecciones | Ejemplos resueltos | Ejercicios guiados | Práctica |
|--------|-----------|--------------------|--------------------|----------|
| Subneteo IPv4 (`/redes/subneteo`) | 13 | 93 | 238 | 6 niveles, ilimitada |
| VLAN (`/redes/vlans`) | 7 | 47 | 124 | 6 niveles, ilimitada |

Subneteo: binario, clases A–E, máscara de red y AND, fórmulas (2^h − 2 hosts,
2^s subredes), máscara de subred y bits prestados, número mágico, división en N
subredes, diseño por hosts, cortes en el 3.er y 2.º octeto, diagnóstico de
configuración, VLSM, sumarización y wildcard.

VLAN: dominio de broadcast, rangos de ID, puertos de acceso, troncales y
etiqueta 802.1Q, VLAN nativa y buenas prácticas, enrutamiento entre VLAN
(router-on-a-stick y SVI), direccionamiento por VLAN con VLSM y diagnóstico.
Los comandos son de Cisco IOS.

Cada módulo tiene además **práctica por niveles** (ejercicios generados al
momento con una semilla; `?nivel=3&s=12345` reproduce el mismo ejercicio),
**exámenes** sin pistas con calificación y, en subneteo, **herramientas**
(calculadora visual, divisor de redes, planificador VLSM y tabla de prefijos).

## 2. Principio de diseño: nada se calcula a mano

Un ejercicio se guarda solo como `{ tipo, …parámetros }`, por ejemplo
`{ "tipo": "analizar", "ip": "192.168.1.100", "p": 26 }`. La respuesta, las
pistas y la solución paso a paso las **calcula el motor**. El mismo motor:

- corrige lo que escribe el estudiante en el navegador,
- genera los ejercicios de práctica y de examen,
- y produce, en tiempo de construcción, los **ejemplos resueltos** de las
  lecciones (PHP solo pinta el resultado).

Así una lección y la corrección de su ejercicio no pueden discrepar.

## 3. Arquitectura

```
app/
├── Controllers/RedesController.php    despachador de /redes/*
├── Models/RedesRepository.php         lee curso.json y <modulo>.json (sin MySQL)
└── Views/
    ├── components/redes-ui.php        componentes rd_* (regla de bits, tabla, pasos, bloques)
    └── redes/                         index, modulo, leccion, practica, examen, herramientas

public/assets/
├── css/redes.css                      hoja del módulo (todo bajo .page-redes)
├── redes/data/                        CONTENIDO (GENERADO, no se edita a mano)
│   ├── curso.json                     módulos, niveles, exámenes y lista de lecciones
│   ├── subneteo.json · vlans.json     lecciones completas con los ejemplos ya resueltos
└── js/redes/
    ├── ip.js                          aritmética IPv4 pura (red, broadcast, VLSM, resumen…)
    ├── tipos.js                       18 tipos de ejercicio de subneteo
    ├── tipos-vlans.js                 7 tipos de ejercicio de VLAN
    ├── motor.js                       resolver, evaluarCampo, niveles, generador con semilla
    ├── ui.js                          HTML de bits/tablas/pasos y montaje de un ejercicio
    ├── regla.js                       regla de bits interactiva (portada y calculadora)
    ├── progreso.js                    progreso en localStorage ('redes:progreso:v1')
    ├── redes.js                       arranque: carga la vista desde un mapa cerrado
    └── vistas/                        inicio, modulo, leccion, practica, examen, herramientas

tools/redes/                           herramientas de desarrollo (NO se despliegan)
├── contenido/                         las lecciones, escritas como datos (.mjs)
├── construir.mjs                      contenido → public/assets/redes/data/*.json
└── tests/motor.test.mjs · e2e.cjs     pruebas del motor y de navegador
```

### Rutas

| Ruta | Página |
|------|--------|
| `/redes` | Portada con la regla de bits interactiva |
| `/redes/{modulo}` | Lecciones, niveles de práctica y examen del módulo |
| `/redes/{modulo}/leccion/{slug}` | Lección |
| `/redes/{modulo}/practica` | Práctica por niveles |
| `/redes/{modulo}/examen` | Examen |
| `/redes/subneteo/herramientas` | Calculadora, divisor, VLSM y tabla de prefijos |

### La regla de bits

Es el componente visual del módulo: los 32 bits de una dirección con la
frontera red | subred | host marcada. Los bits de red son siempre azules, los
de subred ámbar y los de host verdes, y la leyenda escribe cuántos hay de cada
uno (el color nunca es el único indicador). `rd_bits()` en PHP y `htmlBits()`
en JS generan el mismo HTML.

## 4. Añadir o cambiar contenido

1. Edita `tools/redes/contenido/<modulo>.mjs` (bloques: `h`, `p`, `lista`,
   `tabla`, `nota`, `formula`, `bits`, `codigo`, `ejemplo`, `ejercicios`).
2. `node tools/redes/construir.mjs` — resuelve cada ejemplo y cada ejercicio; si
   un dato no es válido (por ejemplo, un VLSM que no cabe), falla y dice cuál.
3. `node tools/redes/tests/motor.test.mjs` y, con el servidor local en marcha,
   `node tools/redes/tests/e2e.cjs`.

Para un tipo de ejercicio nuevo: `definir(id, nombre, { crear, resolver })` en
`tipos.js` o `tipos-vlans.js` y añadirlo a un nivel en `NIVELES` (`motor.js`).

Tipos de campo que entiende el corrector: `ip`, `red` (dirección/prefijo),
`prefijo` (`/26` o `26`), `numero` (admite `65,534`), `binario`, `opcion` y
`comando` (acepta abreviaturas de IOS como `sw mo acc`; los valores y los
nombres deben ser exactos).

## 5. Seguridad y privacidad

- Cada segmento de la URL se valida con `^[a-z0-9]+(?:-[a-z0-9]+)*$` y el
  módulo se busca en `curso.json` antes de abrir su archivo.
- Todo el texto se escapa antes de aplicar el marcado mínimo (`**negrita**` y
  `` `mono` ``), en PHP (`rd_md`) y en JS (`fmt`). Lo que escribe el estudiante
  solo se lee de `input.value`; en las herramientas se escapa antes de pintarlo.
- La configuración de cada página viaja como JSON con `JSON_HEX_*` en un
  `<script type="application/json">`, que el navegador no ejecuta.
- No hay endpoints que reciban datos: respuestas y progreso se quedan en el
  navegador (`localStorage`). Sin cuentas, sin cookies y sin MySQL.

## 6. Pruebas

- `motor.test.mjs`: compara `ip.js` con una implementación independiente sobre
  20,000 direcciones, y genera 3,000 ejercicios por nivel y módulo comprobando
  que se resuelven, que son deterministas, que la respuesta correcta se acepta,
  que los planes VLSM no se solapan y que cada resumen contiene a sus redes.
- `e2e.cjs` (Puppeteer): portada y regla de bits, las 20 lecciones, resolver y
  fallar ejercicios, persistencia del progreso, los 12 niveles de práctica,
  exámenes, herramientas, vista móvil sin desborde y regresión del resto del sitio.

## 7. Fuentes

El contenido es original. Como referencia temática se consultó el artículo de
IONOS «Subnetting: ¿cómo funcionan las subredes?» (solo su índice de temas) y
los documentos RFC 950, 1518/1519, 1878, 1918, 3021 y 3927, además del estándar
IEEE 802.1Q.
