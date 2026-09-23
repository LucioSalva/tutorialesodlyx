# Estándar de enseñanza visual · Tutoriales Lucio

> Norma interna del proyecto, vigente desde la **v1.3.0**.
> Se aplica a **todos** los tutoriales: Wireshark y Nmap ya la cumplen;
> SSH, Linux, Redes, Docker, Git, PHP, MySQL, PostgreSQL, Ciberseguridad y
> cualquier tutorial futuro deben escribirse siguiéndola desde la primera línea.

---

## 1. La regla

Todo tutorial se diseña partiendo de una idea: el estudiante aprende
**visual + práctica + progresiva y explicada paso a paso**. No se publica
material que consista principalmente en muros de texto, listas de comandos sin
contexto, documentación copiada, ejemplos sin escenario, ejercicios sin solución
o teoría sin ninguna representación visual.

El ciclo obligatorio de cada tema importante es:

```
Explicar
   ↓
Mostrar
   ↓
Señalar
   ↓
Practicar
   ↓
Resolver
   ↓
Interpretar
```

| Fase | Qué significa | Con qué se hace |
|------|---------------|-----------------|
| **Explicar** | Qué es esto y para qué sirve, en prosa clara | texto, `note()` |
| **Mostrar** | Enseñar qué ocurre de verdad | `shot()`, `term()`, `anatomy()` |
| **Señalar** | Decir *dónde mirar* dentro de lo mostrado | `callouts()`, `figcaption`, resaltados en la figura |
| **Practicar** | Que el estudiante lo haga | `lab_head()`, `steps()` |
| **Resolver** | Dar la respuesta razonada, no antes | `hints()`, `solution()` |
| **Interpretar** | Qué se puede y qué **no** se puede concluir | `evidence()`, `pitfall()`, `recap()`, `quiz()` |

La frase que resume la norma:

> No basta con decirle al estudiante qué hacer. Hay que mostrarle qué ocurre,
> señalar dónde mirar, explicarle qué significa, dejarlo practicar y después
> enseñarle la solución razonada.

---

## 2. Qué debe poder responder cualquier tutorial

Al abrir una página, el estudiante tiene que poder contestar estas diez
preguntas sin salir de ella:

1. qué estoy aprendiendo;
2. para qué sirve;
3. qué tengo que hacer;
4. dónde tengo que mirar;
5. qué debería aparecer;
6. qué significa;
7. qué conclusión puedo sacar;
8. qué conclusión **NO** puedo sacar;
9. cómo practicarlo;
10. cómo comprobar si lo entendí.

Si alguna queda sin respuesta, el tema no está terminado.

---

## 3. Estructura de un ejemplo importante

Todo ejemplo que merezca la pena intenta seguir este orden. No es un formulario
rígido —hay ejemplos que no necesitan las trece piezas—, pero sí el orden.

```
Objetivo            qué vamos a aprender
Escenario           situación práctica y realista
Paso a paso         qué hace el estudiante
Comando / Acción    el comando o la interacción exacta
Desglose            qué significa cada opción, botón, filtro o campo
Qué deberías ver    salida o resultado esperado
Visual              captura real, SVG o diagrama
Dónde mirar         el dato concreto que importa
Qué significa       interpretación
Qué podemos concluir
Qué NO podemos concluir
Error común         la confusión típica
Mini resumen        la idea que debe quedar
```

---

## 4. Plantilla para un tutorial nuevo

```
# Tema

## Idea central
## Explicación sencilla
## Cómo funciona
## Visual
## Ejemplo
## Paso a paso
## Qué observar
## Interpretación
## Error común

## Ejercicio
### Misión
### Pistas
### Solución
### Explicación

## Resumen
## Quiz
```

---

## 5. Componentes disponibles

Todos viven en `app/Views/components/blocks.php` y su CSS en
`public/assets/css/tutorial.css`. **No dupliques estos estilos en la hoja
propia de un tutorial**: si el bloque es genérico, va en la hoja común.

### Ya existían antes de la v1.3.0

| Función | Produce |
|---------|---------|
| `term($html, $etiqueta)` | Bloque de terminal con botón copiar. `<span class="p">$</span>` es el prompt (se excluye al copiar); `<span class="c">…</span>` un comentario. |
| `filter_chip($expr, $tag)` | Chip monoespaciado con copia directa. |
| `note($etiqueta, $html, 'warn'\|'info')` | Callout. |
| `icon($nombre, $tamaño)` | SVG en línea. |
| `chapter($num, $titulo, $bajada, $nivel)` | Separador de capítulo. |
| `difficulty($nivel)` | Insignia de nivel. |
| `reveal($resumen, $html, $variante)` | Bloque plegable `<details>` genérico. |
| `lab_head($num, $titulo, $nivel, $objetivo)` | Cabecera de laboratorio. |
| `steps([...])` | Lista de pasos numerada. |

### Nuevos en la v1.3.0

| Función | Produce | Cuándo |
|---------|---------|--------|
| `shot($archivo, $alt, $pie, $origen)` | Figura con procedencia declarada, lupa y pie | Siempre que haya algo que **mostrar** |
| `callouts([[etiqueta, explicación], …])` | Leyenda numerada ①②③ | Cuando la figura lleva marcas numeradas |
| `anatomy($linea, [[pieza, qué significa], …])` | Desglose anotado de un comando o una salida | Al presentar un comando nuevo |
| `evidence($dato, $lectura, $limite)` | Evidencia · Interpretación · No podemos afirmar | **Obligatorio** en todo lo que sea ciberseguridad |
| `pitfall($html)` | Bloque «Error común» | En cada tema con una confusión típica |
| `hints([p1, p2, p3])` | Pistas progresivas plegables | En ejercicios intermedios y avanzados |
| `solution($respuesta, $razonamiento, $aprendido)` | Solución razonada plegable | En todo ejercicio |
| `quiz([...])` | Mini quiz de 2 a 5 preguntas con respuesta plegada | Al cierre de cada capítulo importante |
| `recap($titulo, $esencial, $clave, $interpretar)` | Resumen de capítulo | Al cierre de cada capítulo importante |
| `compare([tituloA, subA, htmlA], [tituloB, subB, htmlB], $veredicto)` | Comparación de dos conceptos que se confunden | Capture vs display filter, `-sT` vs `-sS`, contraseña vs clave… |
| `before_after($antes, $cambio, $despues)` | Antes → cambio → después | Firewall, hardening, permisos, configuración |

Antes de crear un componente nuevo, comprueba que ninguno de estos sirve.
**No se construye un framework**: un componente solo se añade cuando elimina
duplicación real entre dos tutoriales o más.

---

## 6. Ejercicios

### Escala de dificultad

Única y global: **Básico**, **Intermedio**, **Avanzado**.

```php
<?= lab_head('01', 'Título del ejercicio', 'basico', 'Objetivo: …') ?>
```

La etiqueta lleva el texto, no solo el color: quien no distinga los tonos sigue
leyendo la palabra. `difficulty()` admite además las etiquetas temáticas
heredadas (`fundamentos`, `protocolos`, `ciber`, `practica`) pero esas son para
rotular **capítulos**, nunca ejercicios.

### Anatomía de un ejercicio completo

```
Misión · Preparación · Paso 1 · Paso 2 · Filtro o comando ·
Referencia visual · Qué buscar · Preguntas · Pistas ·
Solución · Explicación · Qué aprendimos
```

### Pistas progresivas

Tres, y en este orden:

1. **el concepto** — reencuadra el problema sin dar nada;
2. **dónde mirar** — la pantalla, el panel o el campo;
3. **el comando o filtro relacionado** — casi la respuesta, pero no la respuesta.

```php
<?= hints([
    '<p>El concepto…</p>',
    '<p>Dónde mirar…</p>',
    '<p>El comando…</p>',
]) ?>
```

### Solución razonada

Prohibido «Respuesta: 22». La solución dice **de qué evidencia sale**:

> El puerto 22 es la respuesta porque aparece con `STATE open` y `SERVICE ssh`.
> Eso significa que Nmap recibió una respuesta compatible con un servicio
> accesible en ese puerto.

```php
<?= solution(
    'La respuesta, en una línea.',
    '<p>De qué evidencia sale y por qué no es otra.</p>',
    'Qué queda para la próxima vez.') ?>
```

### Ejercicios de interpretación

No todo ejercicio requiere ejecutar algo. Sobre una captura, una salida, un
diagrama o una tabla se puede preguntar igual de bien:

> ¿Qué observas? · ¿Qué puedes afirmar? · ¿Qué **no** puedes afirmar?

Son los más valiosos en ciberseguridad y deben existir en todo tutorial de esa
área.

### Plegables

Pistas, soluciones y respuestas del quiz usan `<details>`/`<summary>` nativos.
**Funcionan sin JavaScript**, son navegables con teclado y Ctrl+F los despliega
en Chrome. No los sustituyas por acordeones con JS.

---

## 7. Material visual

### Captura real frente a ejemplo ilustrativo

Una figura rotulada **«Captura real de laboratorio»** tiene que proceder de
verdad del laboratorio. No se fabrican capturas falsas, nunca.

Cuando no sea posible obtener una real, se construye con SVG, HTML/CSS o una
terminal estilizada y se rotula **«Ejemplo ilustrativo»**. El parámetro
`$origen` de `shot()` lo controla:

```php
<?= shot('wireshark/02-packet-list.svg',
    'Descripción de lo que se ve, para quien no puede verlo.',
    '<b>Dónde mirar:</b> …',
    'real') ?>          // o 'ilustrativo'
```

### Privacidad

Antes de guardar cualquier material visual, elimina o evita: IP pública,
credenciales, tokens, correos, hostname sensible, nombres privados, información
del hosting, rutas privadas innecesarias y datos de terceros.

Las pruebas se hacen sobre **localhost, laboratorio propio, VM propia,
contenedor propio o datos ficticios**. Para direcciones inventadas, usa los
rangos de documentación (`192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`) o
redes privadas de laboratorio (`192.168.56.0/24`).

### Organización

Una carpeta por tutorial, nunca una carpeta plana con todo mezclado:

```
public/assets/img/tutorials/
├── wireshark/
├── nmap/
├── ssh/          ← futuros
├── linux/
└── docker/
```

Nombra los ficheros con prefijo numérico según el orden en que aparecen:
`01-tres-paneles.svg`, `02-packet-list.svg`…

### Formato y peso

- **SVG** para diagramas, representaciones de interfaz y terminales
  estilizadas: pesa poco, escala sin perder nitidez y `mod_deflate` ya lo
  comprime. Es el formato por defecto de este proyecto.
- **WebP** para fotografías y capturas de pantalla reales de mapa de bits.
- **PNG** solo cuando WebP no sirva.
- Nada de capturas de varios megabytes sin optimizar.

Las figuras SVG llevan su **propio fondo opaco**: son representaciones de una
pantalla, así que se leen igual sobre el tema claro y sobre el oscuro sin
necesidad de dos versiones.

### Obligatorio en cada figura

- `alt` que describa lo que se ve (lo pone `shot()`, tú escribes el texto);
- `figcaption` que diga **qué mirar**, no que repita el `alt`;
- procedencia declarada;
- `width`/`height` en el `<img>` para que la página no dé saltos — `shot()` los
  lee solo del `viewBox` del SVG.

### Captura completa + zoom

Cuando una figura tenga mucha información, no dependas de una sola imagen
enorme:

1. la vista general;
2. el recorte o zoom sobre el dato concreto;
3. la explicación.

### Anotaciones

Flechas, recuadros, números, etiquetas y resaltados, siempre que ayuden.
Si la figura lleva números, **debajo va la leyenda `callouts()`**: los números
solos no significan nada.

### Dos reglas que no se saltan

- **Ninguna captura decorativa.** Si una imagen no aporta aprendizaje, no se
  incluye.
- **Más visual no es menos texto.** Las figuras complementan la explicación, no
  la sustituyen. Cada una responde a: qué estás viendo · dónde mirar · qué
  significa.

---

## 8. Ciberseguridad

En todo material de seguridad se separan siempre cuatro cosas, y el componente
`evidence()` existe exactamente para eso:

| | |
|---|---|
| **Evidencia** | el dato observable, reproducible por cualquiera |
| **Interpretación** | qué puede indicar — una hipótesis, y se dice que lo es |
| **No podemos afirmar** | qué sería una conclusión prematura |
| **Limitaciones** | punto de observación, ventana temporal, cifrado, pérdida |

Nunca se presenta un solo indicador como prueba de un ataque.

Los laboratorios son **defensivos, propios, autorizados y educativos**. No se
añaden técnicas de evasión, explotación ni acceso no autorizado para conseguir
material «más interesante».

---

## 9. Frontend

### JavaScript

HTML nativo siempre que baste. `<details>` para plegables. JavaScript solo
donde hace falta de verdad: búsqueda, copiar, lupa de figuras, navegación.

La lupa (`lbox` en `public/assets/js/tutorial.js`) es **progresiva**: `shot()`
envuelve la figura en un `<a>` que apunta a la imagen, así que sin JavaScript
el clic sigue abriéndola. Cierra con la X y con `Escape`, atrapa el foco
mientras está abierta y lo devuelve al cerrar.

### Responsive

Todo el material visual debe funcionar a **320, 375, 768, 1024, 1440 y
1920 px**. No se permite: figuras que se salen, diagramas ilegibles, terminales
cortadas ni tablas que rompen el layout. Las tablas anchas van dentro de
`.tut-table`, que ya aporta el desplazamiento horizontal propio.

### CSS

Si el componente es genérico, su CSS va en `public/assets/css/tutorial.css`.
`public/assets/css/tutorial-<slug>.css` es solo para lo que de verdad pertenece
a un único tutorial (los diagramas de cabeceras de Wireshark, los estados de
puerto de Nmap). El layout lo carga solo si el fichero existe.

---

## 10. La regla es metodológica, no estética

Adapta el recurso visual al contenido. La filosofía educativa es la misma en
todos; las figuras, no:

| Tutorial | Recurso visual natural |
|----------|------------------------|
| Wireshark | capturas de la interfaz, paneles, árboles de paquete |
| Nmap | terminal, tablas de resultados, diagramas de secuencia |
| SSH | cliente–servidor y terminal |
| Linux | terminal y sistema de ficheros |
| Git | historial y ramas |
| Docker | contenedores, capas, redes |
| MySQL / PostgreSQL | esquemas, planes de ejecución |

Un tutorial de SSH no necesita las mismas visualizaciones que Wireshark. Lo que
sí comparte es el ciclo: explicar, mostrar, señalar, practicar, resolver,
interpretar.

---

## 11. Antes de publicar

**Contenido**

- [ ] Cada tema importante responde a las diez preguntas del apartado 2.
- [ ] Opciones, sintaxis, nombres de menú y campos verificados contra la
      herramienta real y su documentación, no de memoria.
- [ ] Cada ejercicio tiene nivel, pistas y solución razonada.
- [ ] Cada capítulo importante termina con `recap()` y `quiz()`.
- [ ] Todo el material de seguridad separa evidencia, interpretación y límite.

**Imágenes**

- [ ] 0 imágenes rotas y 0 rutas incorrectas.
- [ ] 0 datos sensibles.
- [ ] Todas con `alt`, `figcaption`, procedencia y medidas.
- [ ] Peso razonable y legibles a 320 px.
- [ ] Ninguna decorativa.

**Funcional**

- [ ] Home, cada tutorial, 404.
- [ ] Sumario, scrollspy, copiar, buscador.
- [ ] Plegables de pistas y soluciones.
- [ ] Lupa: abre, cierra con X y con `Escape`, funciona con teclado.
- [ ] Tema claro y oscuro.
- [ ] Navegación móvil.

**Código**

- [ ] `find . -name '*.php' -exec php -l {} \; | grep -v 'No syntax errors'`
- [ ] JavaScript validado y consola sin errores.
- [ ] Sin regresiones en los tutoriales que no tocabas.

---

## 12. Registro

| Versión | Qué introdujo |
|---------|---------------|
| v1.1.0 | Wireshark como curso completo en cinco partes |
| v1.2.0 | Nmap en diez niveles |
| **v1.3.0** | **Este estándar**, sus once componentes compartidos, la lupa de figuras, 32 figuras y su aplicación a Wireshark y Nmap |
| v1.4.0 | SSH en diez partes, escrito desde cero con este estándar: 88 secciones, 20 ejercicios y figuras de laboratorio real (contenedores propios) |
