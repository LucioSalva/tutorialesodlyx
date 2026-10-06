# Academia de Redes · documentación técnica

> Módulo de Tutoriales Lucio para aprender redes con ejercicios que se corrigen
> solos. Introducido en la **v1.8.0** (Subneteo IPv4 y VLAN) y ampliado en la
> **v1.9.0** a una ruta completa para la certificación **Cisco CCST Networking
> (100-150)**. Vive en `/redes` y no modifica los tutoriales, la Academia de
> Comandos ni la Academia de Inglés.

## 1. Qué contiene

Ocho módulos, en el orden en que se estudian:

| Módulo | Dominio CCST | Lecciones | Ejemplos | Ejercicios | Banco |
|--------|--------------|-----------|----------|------------|-------|
| Fundamentos de redes (`/redes/fundamentos`) | 1 | 7 | 53 | 164 | 177 |
| Medios y dispositivos finales (`/redes/medios`) | 3 | 7 | 54 | 159 | 147 |
| Subneteo IPv4 (`/redes/subneteo`) | 2 | 13 | 93 | 245 | 42 |
| NAT, DHCP e IPv6 (`/redes/direccionamiento`) | 2 | 7 | 68 | 172 | 121 |
| Infraestructura (`/redes/infraestructura`) | 4 | 7 | 69 | 167 | 145 |
| VLAN (`/redes/vlans`) | 4 | 7 | 47 | 124 | 42 |
| Diagnóstico y soporte (`/redes/diagnostico`) | 5 | 8 | 64 | 204 | 144 |
| Seguridad de redes (`/redes/seguridad`) | 6 | 7 | 66 | 175 | 158 |
| **Total** | | **63** | **514** | **1,410** | **976** |

Cada módulo tiene **lecciones** (explicación, ejemplos resueltos y ejercicios
guiados), **práctica por niveles** (6 niveles; ejercicios generados con semilla,
`?nivel=3&s=12345` reproduce el mismo) y **exámenes** sin pistas. Subneteo tiene
además **herramientas** (calculadora visual, divisor, VLSM y tabla de prefijos).

**Certificación** (`/redes/certificacion`): ficha del examen, ruta de estudio,
los objetivos oficiales 1.1–6.3 enlazados a las lecciones que los cubren y un
plan de preparación. **Simulador** (`/redes/certificacion/simulador`): nueve
simulacros con cuenta atrás (completo de 45 preguntas en 50 minutos, rápido,
maratón y uno por dominio) que mezclan los ocho módulos, no repiten preguntas y
desglosan la nota por dominio. Subneteo y VLAN solo aportan sus niveles 1–3:
lo demás es nivel CCNA.

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
    └── redes/                         index, modulo, leccion, practica, examen, herramientas,
                                       certificacion, simulador

public/assets/
├── css/redes.css                      hoja del módulo (todo bajo .page-redes)
├── redes/data/                        CONTENIDO (GENERADO, no se edita a mano)
│   ├── curso.json                     módulos, niveles, exámenes, lista de lecciones y guía de certificación
│   ├── <modulo>.json                  lecciones completas con los ejemplos ya resueltos
│   └── banco-<modulo>.json            preguntas tipo examen, por nivel
└── js/redes/
    ├── ip.js                          aritmética IPv4 pura (red, broadcast, VLSM, resumen…)
    ├── ipv6.js                        IPv6 y MAC: abreviar, expandir, prefijo, tipo, EUI-64
    ├── tipos.js                       tipos de subneteo y los escritos a mano (opcion, varias, relacionar, ordenar)
    ├── tipos-<modulo>.js              tipos generados y niveles de cada módulo (87 tipos en total)
    ├── motor.js                       resolver, evaluarCampo, bancos, generador con semilla
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
| `/redes/certificacion` | Guía del examen CCST Networking y ruta de estudio |
| `/redes/certificacion/simulador` | Simulacros cronometrados |

### La regla de bits

Es el componente visual del módulo: los 32 bits de una dirección con la
frontera red | subred | host marcada. Los bits de red son siempre azules, los
de subred ámbar y los de host verdes, y la leyenda escribe cuántos hay de cada
uno (el color nunca es el único indicador). `rd_bits()` en PHP y `htmlBits()`
en JS generan el mismo HTML.

## 4. Añadir o cambiar contenido

1. Edita `tools/redes/contenido/<modulo>*.mjs` (bloques: `h`, `h3`, `p`, `lista`,
   `tabla`, `nota`, `formula`, `bits`, `codigo`, `ejemplo`, `ejercicios`) o
   `banco-<modulo>.mjs` (`{ nivel: [preguntas] }`).
2. `node tools/redes/construir.mjs` — resuelve cada ejemplo, cada ejercicio y cada
   pregunta de banco; si algo no es válido (un VLSM que no cabe, una opción
   repetida, una lección citada en la guía que no existe), falla y dice cuál.
   `--solo <modulo>` valida un módulo sin escribir nada.
3. `node tools/redes/tests/motor.test.mjs` y, con el servidor local en marcha,
   `node tools/redes/tests/e2e.cjs`.

**Tipos generados**: `definir(id, nombre, { crear, resolver })` en
`tipos-<modulo>.js` y añadirlo a un nivel con `niveles(modulo, [...])`. `resolver`
devuelve enunciado, campos, 3 pistas y pasos.

**Preguntas escritas a mano** (ayudantes en `_ayuda.mjs`): `op` (opción única),
`vs` (varias respuestas), `rel` (relacionar) y `ord` (ordenar). La explicación es
un párrafo o un arreglo de pasos; admiten `codigo` (salida de consola) y `tabla`.
En un nivel, `['banco', peso]` saca preguntas del banco y baraja sus opciones.

**Tipos de campo** que entiende el corrector: `ip`, `red`, `prefijo`, `numero`
(admite `65,534`), `binario`, `hex`, `ipv6` (con `forma: 'corta' | 'larga'`),
`red6`, `mac` (cualquier formato), `opcion` (botones o lista desplegable),
`multi` (casillas), `comando` (acepta abreviaturas de IOS como `sw mo acc`) y
`texto` (exacto, con variantes en `acepta`).

**Guía de certificación**: `contenido/certificacion.mjs` (ficha, ruta, objetivos
→ lecciones, plan y simulacros). Los simulacros son
`{ id, nombre, minutos, aprobado, partes: [{ nombre, modulo, niveles, preguntas }] }`.

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

- `motor.test.mjs` (1.79 millones de comprobaciones): compara `ip.js` con una
  implementación independiente sobre 20,000 direcciones; prueba `ipv6.js`
  (abreviar, expandir, tipos, prefijos, EUI-64) y cada tipo de campo; y genera
  3,000 ejercicios por nivel y módulo comprobando que se resuelven, que son
  deterministas, que la respuesta correcta se acepta y la basura no, que los
  planes VLSM no se solapan y que cada resumen contiene a sus redes.
- `e2e.cjs` (Puppeteer, 657 comprobaciones): portada, las 63 lecciones, resolver
  y fallar ejercicios, persistencia del progreso, los 48 niveles de práctica,
  preguntas de varias respuestas y desplegables, guía de certificación,
  simulacro completo con nota desglosada, exámenes de los ocho módulos,
  herramientas, vista móvil sin desborde y regresión del resto del sitio.

## 7. Fuentes

El contenido es original. El temario sigue los objetivos públicos del examen
Cisco CCST Networking 100-150 (seis dominios); la academia es material de
estudio independiente, sin afiliación con Cisco. Como referencia temática se
consultó el artículo de IONOS «Subnetting: ¿cómo funcionan las subredes?» (solo
su índice de temas) y los documentos RFC 950, 1518/1519, 1878, 1918, 3021,
3927, 4291, 4193, 5952 y 6598, además de los estándares IEEE 802.1Q, 802.3 y 802.11.
