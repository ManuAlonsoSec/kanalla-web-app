# Auditoría Impeccable de la home actual (12 nov 2026)

**Método.** Dos evaluaciones independientes:

- **A — crítica de diseño:** sin ver el detector.
- **B — detector y auditoría técnica:** detector de Impeccable sobre el código, sobre el build y en vivo, con su overlay en el navegador; además, Lighthouse 12.6.

Las conclusiones se cruzaron solo al final. Objetivo: el build de producción servido en local, a 1440×900 y 390×844.

**Capturas en esta carpeta.**

| Archivo | Qué muestra |
|---|---|
| `kanalla-escritorio-hero.png`, `kanalla-movil-hero.png` | Primer pantallazo |
| `kanalla-escritorio-completa.jpg`, `kanalla-movil-completa.jpg` | Página completa |
| `overlay-escritorio.png`, `overlay-movil.png` | Hallazgos del detector marcados en la página |
| `detector.json` | Salida en bruto del detector |

| Medida | Resultado |
|---|---|
| Crítica (Nielsen; 7 y 10 no aplican a una landing) | **21/32 (66 %), aceptable** |
| Auditoría técnica (a11y, rendimiento, theming, responsive, integridad) | **15/20, buena** |
| Lighthouse móvil: rendimiento / accesibilidad / buenas prácticas / SEO | **81–91** / 100 / 96 / 100 (objetivo ≥ 95) |
| Lighthouse escritorio | 100 / 100 / 96 / 100 |
| Detector: hallazgos reales | 7: fuente de Google en `app.ts`, 4 placeholders a 3,5:1, 2 viudas |
| Detector: falsos positivos | Los de «kicker encima del título» y «mayúsculas en el texto»: los impone vuestra marca |

## Veredicto

Se nota que está hecha con IA. **No es por la paleta ni por las fuentes**, que salen de la carta impresa: es por la **estructura** y el **movimiento**.

- Siete secciones repiten la misma plantilla centrada (kicker, titular cartel, párrafo corto, botones); solo cambia el color de fondo.
- Lleva los tres trucos de generador más reconocibles: grano de ruido por todas partes, un manifiesto que se ilumina palabra a palabra y un logo que se «dibuja».
- 55 elementos «suben y aparecen».
- La copy de la web es más correcta que la de la carta impresa, pero ha perdido la gracia del dueño.

## Anti-patrones, ordenados por impacto

**P1:**

1. **La misma sección repetida siete veces.** Kicker → titular → párrafo → dos botones, siempre centrado y con fondos alternos (hero, pedido, carta, terraza, reservas, pie). Es la firma estructural de una plantilla.
2. **Jerarquía invertida.** El H1 es el titular más pequeño de la página: 89 px en escritorio y 49 en móvil. «PIDE DIRECTO» mide 160, «ENTRANTES» 168, la terraza 176 y el rótulo del pie 240. Todo grita y nada manda.
3. **El rendimiento móvil no llega a 95** (81–91; LCP 3,2–4,4 s).
   - La foto del hero empieza invisible por su animación de entrada, así que la animación retrasa lo primero que se pinta. Eso incumple el brief.
   - `sizes` pide una foto mayor de la necesaria: unos 39 KB de más.
4. **Copy de catálogo y voz de la carta aplanada.**
   - La carta impresa dice cosas como «O HAZ UN MIX», «LA VERSIÓN DOSPUNTOCERO» o «LA SÉPTIMA MARAVILLA»; la web lo ha reducido a listas de ingredientes.
   - La copy nueva es genérica e inventa atmósfera: «con vistas» sin una foto que lo respalde, o «la forma más rápida».
5. **El primer pantallazo no da ningún dato.** La burger no tiene nombre ni precio, y no aparecen ni el horario ni las zonas.
6. **Tildes que chocan con la línea de arriba.** En el manifiesto (interlineado 1,02), la virgulilla de ENSEÑARTE cae sobre «NACE» y la tilde de SÍ roza la línea de arriba. En el diálogo de alérgenos, la É del kicker pisa la A de «KANALLA». Verificado en la captura.
7. **La reserva sorprende y promete dos cosas distintas.**
   - El login de Google aparece al pulsar «Confirmar», sin aviso previo.
   - Se dice «nos pondremos en contacto» y después «te confirmaremos por email», pero en la práctica llamáis vosotros.
   - El consentimiento enlaza a la política de cookies y no a la de privacidad.
8. **Una terraza sin terraza y un titular repetido.** «ESTO SE VIVE EN LA TERRAZA» va justo encima de «RESERVA EN LA TERRAZA»: es una sección de relleno.

**P2:**

9. **«Pide directo» es un segundo hero.** Repite los mismos botones a una pantalla de distancia, y «sin intermediarios» aparece tres veces. Además, Hundred ya usa esa frase.
10. **Revelado genérico** en 55 elementos (subir y aparecer, foto con zoom, filete que se dibuja) y en las líneas de 9 titulares. Retrasa la lectura de los precios.
11. **Manifiesto palabra a palabra.** A media pantalla, la mitad de la frase está al 16 %. Es un momento típico de plantilla Framer.
12. **Grano de ruido fractal por todas partes** y grano animado en bucle en la terraza, sin forma de pausarlo (WCAG 2.2.2).
13. **El logo se redibuja con trazo** en cada carga y las llamas se mueven en bucle. La marca dice «sin redibujar».
14. **Foto del hero con bordes difuminados y parallax.** Da el efecto de «recorte flotante» y choca con los rectángulos limpios de la carta.
15. **Kickers vacíos (23)** que no aportan nada: «RESERVAS» sobre «RESERVA EN…», «CARTA KANALLA» en cada pestaña.
16. **La carta en 5 pestañas.**
    - Ensaladas (2 platos) y Postres (3) quedan casi vacías.
    - La altura salta al cambiar de pestaña.
    - En móvil, «Postres» queda fuera de pantalla sin ninguna pista.
    - Las patatas y el aviso de que las hamburguesas vienen sin patatas están en pestañas distintas.
17. **Hovers que engañan:** zoom y subrayado sobre elementos que no se pueden pulsar. Además, «PIDE A DOMICILIO» en el header solo hace scroll.
18. **La barra de pedido móvil tapa el foco** de Teléfono, Notas y los enlaces del pie (WCAG 2.4.11).
19. **Las páginas legales cargan Google Fonts:** Space Grotesk, que ni se usa, y una fuente de iconos. Están fuera de marca y exponen datos a Google (RGPD).
20. **Placeholders del formulario a 3,5:1.**
21. **Los enlaces de texto miden 37 px de alto**, aunque el código promete 44.

**P3:**

22. Rótulo de 240 px en el pie, un recurso de plantilla.
23. Descripciones de plato con interlineado 1,25 y palabras sueltas al final de línea.
24. Al ampliar el texto al 200 %, se recorta el contenido.
25. El bundle público arrastra CSS heredado, y el código de Supabase (46 KB) se descarga para todas las visitas.

## Lo que funciona y hay que conservar

- **El titular partido alrededor de La Puerca,** con los botones de pedido visibles sin hacer scroll en 390 y en 1440.
- **La carta compuesta como la impresa:** nombre en Anton, precio en cobre, descripción en Barlow.
- **La tabla de alérgenos honesta,** con «Consulta al personal» y descarga del original.
- **El logo que viaja al header** y la barra de pedido móvil.
- **Lo técnico:** movimiento reducido correcto, sin overflow de 360 a 1440, accesibilidad 100 y CLS 0.

## Movimiento, con la lente de `emil-design-eng`

**Se queda:**

- **El acople del logo al header:** es lo más propio.
- **Movimiento reducido:** lo deja todo visible.

**Se quita:** parallax, trazo del logo, llamas en bucle, «rise» y «photo» en 55 elementos, filetes que se dibujan, manifiesto palabra a palabra y grano animado.

**Se ajusta:**

- **Entrada del hero:** 700 ms, solo ahí, y sin ocultar la foto.
- **Pulsación:** `scale(.97)` en 120 ms. Hoy no hay respuesta.
- **Barra móvil:** 250 ms al entrar y 180 ms al salir.
- **Botones de línea:** 200 ms, con la misma curva.
