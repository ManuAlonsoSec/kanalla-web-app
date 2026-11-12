# Auditoría tras el rediseño «La comanda» (12 nov 2026)

Rama `web-comanda`, build de producción servido en local, a 1440×900 y 390×844. Capturas y salida del detector en `despues/`.

## Resultado

| Medida | Antes | Después |
|---|---|---|
| Detector, código (`frontend/src/app`, `index.html`) | 1 (Google Fonts en `app.ts`) | **0** |
| Detector, `styles.scss` | 0 | **0** |
| Detector, página en vivo 1440×900 | 11 | **0** |
| Detector, página en vivo 390×844 (`/` y `/reservas`) | 11 | **0** |
| Lighthouse móvil (3 pasadas): rendimiento / accesibilidad / buenas prácticas / SEO | 81–91 / 100 / 96 / 100 | **99 / 100 / 100 / 100** |
| LCP móvil | 3,2–4,4 s | **2,1 s** (CLS 0) |
| Lighthouse escritorio | 100 / 100 / 96 / 100 | **100 / 100 / 100 / 100** |

**Notas sobre las mediciones:**

- **Reglas ignoradas:** solo las que impone la marca, `kicker-above-heading` y `all-caps-body` (ver `.impeccable/README.md`).
- **Bloques diferidos:** el detector también da 0 con los bloques de `content-visibility` forzados a visibles.
- **`/reservas` en Lighthouse:** saca 96 en buenas prácticas en local porque aún no hay `.env.local` y el formulario llama a un Supabase de relleno.

**El análisis estático del HTML prerenderizado** (`detect …/dist/…/index.html`) deja 10 avisos. Esa pasada no resuelve `clamp()`, `var()`, `cqi` ni el tamaño real del texto, y en el render real esos mismos elementos salen limpios:

| Aviso | Por qué es falso positivo |
|---|---|
| Padding «pegado» (5) | Los paddings usan `clamp()` y `var()`. |
| Interlineado (3) | Son rótulos y tablas. |
| Contraste del cobre | Solo se usa a 19 px en negrita o más, que es texto grande: 3,2:1 sobre 3:1 exigido. |
| Jerarquía plana | Lee el h1 a 17 px, cuando mide entre 95 y 190 px. |

## Los anti-patrones de la primera auditoría

| # | Antes | Ahora |
|---|---|---|
| 1 | La misma sección centrada siete veces | Cada bloque con otra composición y otra altura (ver abajo). |
| 2 | Jerarquía invertida (H1 de 89 px, pie de 240) | El H1 es lo más grande de la página (107 px por línea en móvil y 239 en escritorio). El rótulo del pie desaparece. |
| 3 | Rendimiento móvil de 81 a 91 | 99. El hero no lleva foto: su LCP es el titular, que se pinta sin animación, y Angular se hidrata después (sin ese paso, 93). |
| 4 | Copy de catálogo | Las descripciones vuelven a ser las de la carta impresa («O HAZ UN MIX», «LA VERSIÓN DOSPUNTOCERO», «LA SÉPTIMA MARAVILLA»). |
| 5 | Hero sin datos | El horario de hoy (o «Los lunes descansamos»), las cuatro zonas y el talón de WhatsApp. «LA PUERCA · 14,00€ · Apúntala» pasa a la carta como plato destacado. |
| 6 | Tildes que chocan | Manifiesto con interlineado 1,18; «AQUÍ» con aire sobre «SI ESTÁS»; el kicker del diálogo de alérgenos, fuera. |
| 7 | La reserva sorprende | Aviso antes del botón: «Para confirmar tu reserva te pediremos entrar con Google». Una sola promesa (te llamamos) y el consentimiento enlaza a la política de privacidad. |
| 8 | Terraza sin terraza | Terraza y reservas en un solo bloque. |
| 9 | «Pide directo» como segundo hero | Desaparece. El pedido es la comanda; «Sin intermediarios» aparece una vez, en la cabecera de la carta. |
| 10–13 | Revelados en 55 elementos, manifiesto palabra a palabra, grano y logo trazado | Fuera. El logo se ve desde el primer pintado y solo se mueven sus llamas. |
| 14 | Foto difuminada con parallax | Recorte a tijera horneado en la imagen (canal alfa), sin parallax. |
| 15 | 23 kickers vacíos | Quedan solo los que informan («Solo pidiendo directo»). |
| 16 | La carta en 5 pestañas | Una hoja larga. Las patatas van junto al aviso de que las burgers vienen sin patatas. |
| 17 | Hovers que engañan | Solo reaccionan los controles. |
| 18 | La barra móvil tapa el foco | `scroll-padding-bottom` y un hueco en el pie con la altura de la barra. |
| 19 | Google Fonts en las legales y el admin | Fuentes de la marca, más un subconjunto autoalojado de 26 iconos (4,4 KB) solo para el admin. |
| 20 | Placeholders a 3,5:1 | `#7A4A26`: 4,7:1. |
| 21 | Enlaces de 37 px | `.k-link` con 44 px de alto real. |
| 22–25 | Rótulo del pie, viudas, CSS heredado, Supabase para todos | Rótulo fuera; `text-wrap: pretty`; el formulario se carga al acercarse a Reservas, no en reposo. |

## Composición: cada bloque es distinto

1. **Hero cartel (kraft claro), cambiado el 12 nov a petición del dueño:**
   - El logo grande es la imagen, a la izquierda (5 de 12 columnas), con las llamas animadas.
   - «KANALLA SE NACE.» en dos líneas, a sangre por la derecha, con el kicker en cobre encima.
   - Talón de tinta «Pide directo · WhatsApp», el horario de hoy y las zonas.
   - En móvil, el logo arriba y el titular debajo. La cabecera ya no repite el logo.
   - La variante descartada (logo a la derecha, titular en una línea) está en `docs/direcciones/hero-logo/`.
2. **Combo Sofá (banda de tinta):**
   - Titular a todo el ancho.
   - Foto de los tequeños recortada, con el precio en un talón kraft.
   - Selector de las dos burgers y el ahorro calculado.
3. **La carta (hoja larga):**
   - Hamburguesas: La Puerca destacada con su foto, el aviso de las patatas junto a un collage y el resto a dos columnas.
   - Extras en una tira entre filetes.
   - Entrantes con la foto fija al lado.
   - Ensaladas y postres en pareja, separados por un corondel.
4. **Ticket de la comanda:**
   - En escritorio, fijo en el lateral mientras se recorren el combo y la carta.
   - En móvil, barra inferior y hoja.
5. **Manifiesto:** bloque tipográfico descolgado, con el giro final en cobre.
6. **Terraza y reservas:** columna de tinta fija con los pasos, y el formulario en kraft.
7. **Pie:** folio de la carta con el logo abajo, como en el papel.

**Gesto de firma: el ticket**, tres veces: el talón del hero, el precio del combo y la comanda.

## Movimiento (`emil-design-eng`)

Todas las curvas son ease-out fuertes: `cubic-bezier(.23, 1, .32, 1)`, o la de cajón `(.32, .72, 0, 1)` para la hoja. No hay ease-in. Solo se animan `transform` y `opacity`, y todo se queda quieto con «reducir movimiento».

| Qué | Cómo | Por qué |
|---|---|---|
| «+», talón, botones | `scale(.97)` al pulsar, en 120 ms; color al pasar el ratón en 180 ms | Respuesta inmediata al toque. |
| Ticket al apuntar | El papel baja una línea desde la ranura (220 ms) y la línea nueva aparece (150 ms) | Confirma lo que has hecho. Es el único momento «de autor». |
| Número de la barra móvil | Sube y aparece en 180 ms | Se ve que la comanda ha cambiado. |
| Barra móvil | Entra en 250 ms y sale en 180 ms | La salida, más rápida. |
| Hoja del ticket (móvil) | Sube en 260 ms (cajón) y baja en 200 ms; fondo en 200 ms | |
| Llamas del logo | Parpadeo lento de 2 × 2,2 s (menos de 5 s, WCAG 2.2.2); se avivan mientras pasas el ratón | Lo pidió el dueño. |
| Diálogo de alérgenos | 240 ms, desde 10 px | No escala desde 0. |

## Pendiente

- **TODO:** pedido mínimo y gastos de envío (`local.json`).
- **Hamburguesa del mes:** se apunta «a consultar», sin precio.
- **Supabase en local:** sin `.env.local` no se puede probar el formulario de principio a fin.
