# Clínica Dental Louzao — "Calma atlántica" (v2)

Web estática de una sola página para la **Clínica Dental Louzao** (Carballo,
A Coruña). HTML + CSS + JS sin build: se abre `index.html` directamente o se
sirve la carpeta tal cual (GitHub Pages, cualquier hosting estático).

```
python -m http.server 8911     # o cualquier servidor estático
```

Es la **segunda web** para este mismo negocio real. La primera
(`../louzao-dental-carballo-web`, React + Vite, "masked cards") sigue
intacta y con su propio remoto; esta v2 es una plantilla nueva, no una
revisión de aquella.

## Concepto

"Calma atlántica": la clínica como un spa de marea en la Costa da Morte.
Lento, líquido, con mucho aire, y un **contrapeso clínico** (ficha técnica
con grid rígido y datos grandes) para que no se lea solo como spa.

- **Paleta** sacada del logo: hueso cálido `#F7F4EE`, teal del trazo
  `#0F6E8C`–`#1A8BA8` como color estructural, teal tinta `#0A4A5E` para
  titulares, arena dorada `#D8B98A` solo como acento fino (líneas, tags,
  subrayados, trazo de sombra del logo). Sin azul dentista ni verde menta.
- **Tipografía**: Fraunces (serif variable de alto contraste, `opsz` 144,
  `SOFT` 50) para titulares; Outfit (sans geométrica) para cuerpo y UI.
- **Modo**: solo claro. No se añadió modo oscuro porque no aportaba; el
  hero y la sección de tratamientos ya son de teal profundo.

## Primera familia estructural DENTAL del workspace

Todas las plantillas anteriores de la carpeta son de hostelería. Esta es
estructuralmente propia, no una reskin:

1. **Hero de agua**: canvas WebGL a pantalla completa con un shader de
   ondas (fbm + rizos tipo caústica) en tonos teal que respiran despacio.
   El logo de línea continua flota encima y **se dibuja con el trazo**
   (`stroke-dashoffset`, `pathLength="1"`). Texto mínimo, CTA magnético.
2. **Marquee** sutil de especialidades en itálica serif con puntos arena.
3. **Manifiesto** (`#calma`): párrafo grande cuyas palabras se encienden
   con el scroll (scrub) mientras el fondo vira de hueso a bruma teal y
   vuelve; dos fotografías con parallax y tres notas.
4. **Tratamientos** (`#tratamientos`): **sticky-stack** de 6 tarjetas sobre
   teal tinta; cada tarjeta se encoge y se vela cuando la siguiente la cubre.
5. **La clínica** (`#clinica`): grid editorial de 12 columnas con foto grande
   (parallax interno), datos de dirección y bloque "primera visita".
6. **Ficha técnica** (`#ficha`): grid rígido con líneas de 1px, cuatro datos
   grandes en serif (5,0 · 10 · 3ºC · [AÑO]), equipo, tecnología y el
   **horario real en tabla tipográfica** con la fila de hoy y el estado
   "Abierto/Cerrado ahora" calculado en directo.
7. **Opiniones** (`#opiniones`): 5,0★ / 10 reseñas y tres citas.
8. **Contacto** (`#contacto`): el teléfono como titular magnético, estado en
   directo, mapa bajo consentimiento.

## Movimiento

- **Lenis** como único motor de scroll suave, sincronizado con
  **GSAP ScrollTrigger** (`lenis.on("scroll", ScrollTrigger.update)` +
  ticker de GSAP).
- Char-reveal lento en titulares (1,15 s, `power3.out`, stagger 0,028 s),
  reveals de 1,05 s, parallax scrub, gradiente scrub, sticky-stack,
  botones magnéticos (`gsap.quickTo`, solo `pointer: fine`). **Sin rebotes
  ni elásticos** en ningún sitio.
- **Shader** (`js/scene-agua.js`): un solo quad a **media resolución**, DPR
  ignorado, sin blur ni sombras por frame; se pausa cuando el hero sale de
  pantalla o la pestaña se oculta. Sin WebGL queda el degradado CSS
  `.agua-fallback` como primer frame estático.
- **Reduced motion** respetado: sin shader, sin Lenis, sin GSAP, sin
  marquee animado, todo visible desde el primer frame
  (`body.motion-reduced`).
- **Si el CDN falla** (GSAP/Lenis): todo el contenido queda visible y
  funcional; solo se pierde el movimiento.

## Requisitos técnicos cumplidos

- **Mapa**: `google.com/maps?q=<nombre+dirección>&output=embed`, sin API
  key, construido **solo al pulsar** (`.map-consent`), coherente con el
  aviso "sin cookies de terceros".
- **Aviso de cookies**: `.cookie-banner[hidden] { display: none }` gana al
  `display: flex` — el botón "Entendido" funciona (verificado).
- **Responsive** completo incluido 400 px (sin scroll horizontal; el
  marquee vive dentro de `overflow: hidden`).
- **Verificado con Playwright** (`check_louzao*.js` en el scratchpad de la
  sesión): 0 errores de consola, 0 longtasks en hero y durante el scroll,
  ~54 fps en headless, cookie OK, mapa OK (0→1 iframes al pulsar),
  reduced-motion OK, sin CDN OK, menú móvil OK.

## Contenido real (aportado por el usuario, usado tal cual)

- Nombre, dirección (Rúa Vázquez de Parga, 5, 3ºC, 15100 Carballo),
  teléfono (981 75 54 18), valoración 5,0★ / 10 reseñas, horario semanal
  completo (también en JSON-LD `Dentist`).
- **Logo**: el usuario lo pasó como imagen. Se **recreó como SVG**
  (`assets/img/logo/mark.svg`): diente de línea continua con trazo teal y
  trazo arena desplazado, más wordmark tipográfico "LOUZAO / CLÍNICA
  DENTAL". No es el archivo vectorial original: si la clínica tiene el logo
  en vectores, sustituir `mark.svg` y los `<svg>` inline de `index.html`.
- **Reseñas**: las tres citas de `#opiniones` (Paula Vila Vieito, Ana
  Iglesias Fernández, The Reignman) se tomaron del repo de la v1, donde
  estaban marcadas como reseñas reales de Google recogidas de la captura de
  la ficha. **Confirmar antes de publicar**; si no, sustituir por
  placeholder.

## Fotografía — IMPORTANTE

El brief pedía fotografía generada. En este entorno **no había herramienta
de generación de imagen**, así que se usaron **fotografías de ambiente con
licencia Unsplash** (uso comercial libre), elegidas para el concepto y
**gradadas todas igual** (`scripts/process_photos.py`: blancos cálidos,
sombras viradas a teal, saturación contenida). Ninguna es una foto real de
la clínica y la web lo dice junto a cada imagen y en el pie. Sin personas
ni sonrisas de banco.

| Archivo | Autor/a | Uso |
| --- | --- | --- |
| `mar-pantin` | Tino Rischawy | `#calma`, ola en Pantín (Galicia) |
| `ceramica` | Suzanne Boureau | `#calma`, cerámica y lino |
| `gabinete` | Kari Bjorn Photography | `#clinica`, gabinete genérico |
| `tarros` | Yana Hurska | `#clinica`, cerámica arena |
| `praia-bruma` | Lydia Lögga | `#clinica`, playa con bruma |
| `mar-malpica` | Eduardo Fernández | descargada y gradada, sin usar aún |

**Sustituir por fotografía propia o generada en cuanto exista**: la
estructura no depende de ellas. Cada slot tiene `width/height`, `srcset`
y `alt` ya preparados.

## Placeholders (nada inventado)

Marcados en la web con `<mark>[…]</mark>` (arena, subrayado discontinuo):

- Lista real de tratamientos (la actual es orientativa y así se indica).
- Precios: primera visita y presupuestos.
- Equipo: nombres, especialidades, nº de colegiado/a.
- Tecnología y protocolos.
- Año de apertura.
- Email, WhatsApp, redes sociales.
- Ascensor / accesibilidad.
- Aviso legal y política de privacidad.
- Foto real de la clínica.

## Estructura de archivos

```
index.html            página única
404.html              página de error (GitHub Pages)
manifest.json
css/style.css
js/scene-agua.js      shader de agua (WebGL)
js/main.js            Lenis, GSAP, reveals, sticky-stack, magnéticos,
                      menú, horario en directo, cookies, mapa
assets/img/logo/      mark.svg (recreación) + icon-96/180/192/512.png
assets/img/photos/    fotos gradadas (-1600, -900, -lqip)
assets/img/web/       og-image.jpg
scripts/process_photos.py   descarga + gradación (procedencia documentada)
scripts/generate_brand.js   favicons y OG a partir de mark.svg (Playwright)
```
