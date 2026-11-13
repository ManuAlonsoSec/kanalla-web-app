# Tres direcciones de arte para la home (pendiente de elegir)

Las maquetas del hero están en `maquetas/`: archivos `.html` que se abren en el navegador, más sus capturas a 1440×900 y 390×844. Usan vuestras fuentes, fotos y textos reales; no tocan la web.

Las capturas de cada referencia están en `referencias/`. Awwwards bloquea los navegadores automáticos, así que de las fichas de Awwwards se ha capturado la web real.

Lo que no cambia en ninguna de las tres:

- Kraft, tinta y cobre; Anton, Poppins y Barlow.
- Sin cards, esquinas redondeadas, sombras ni iconos.
- WhatsApp y teléfono a un toque.
- El formulario de reservas tal cual funciona hoy.
- Todo estático con movimiento reducido.

En las tres se eliminan los tics de plantilla detectados en la auditoría:

- Grano por todas partes.
- Manifiesto que se ilumina palabra a palabra.
- Logo que se dibuja solo.
- 55 elementos que «suben y aparecen».
- La misma sección centrada repetida siete veces.

---

## A · Cartel tipográfico

Maqueta: `maquetas/a-cartel.html` y capturas `a-cartel-escritorio.png` / `a-cartel-movil.png`.

**Referencia:** Vicio, con ficha en Awwwards (https://www.awwwards.com/sites/vicio). Es un collage de cartel: condensada gigante, recortes, pegatinas que son botones y toda la carta como lista de texto. Captura: `referencias/vicio-*-hero.png`.

**La idea:** la home es una pared de carteles pegados en Galapagar.

- Anton a escala de cartel de concierto, a sangre y con composición asimétrica.
- Fotos recortadas «a tijera» y pegadas sobre el kraft en modo multiplicar, como una fotocopia.
- Una cinta de tinta con «ya eres un poco».
- El CTA principal es un **sello de goma**: «PIDE DIRECTO · WHATSAPP 668 56 93 90».

**Ritmo de la página.** Cada sección es otro cartel, con otra altura:

- La carta, como un cartel-lista: todos los platos en Anton, separados por « · », con el precio en cobre.
- El pedido se resuelve con el sello.
- Terraza y reserva, en un solo cartel Noche.

**Gesto de firma:** el sello de tinta (como mucho tres apariciones).

**Movimiento** (según `emil-design-eng`):

- **Entrada del titular:** una sola vez. Cada línea aparece por máscara: 650 ms, `cubic-bezier(.23, 1, .32, 1)`, 60 ms de desfase.
- **El sello:** entra como un golpe, de `scale(1.06)` a 1 con opacidad, en 180 ms ease-out. Al pulsarlo hace `scale(.97)` en 120 ms.
- **Lo demás:** nada de parallax ni de revelados.

**Riesgos.**

- Rompe la «composición centrada y simétrica» del brief original; ya la has abierto tú.
- El texto a sangre exige vigilar la legibilidad en móvil.
- Cada foto necesita un buen recorte; hay herramienta para hacerlo en local.
- Es la que más se parece al territorio de Vicio, así que habría que diferenciarla con el kraft y la tinta, sin pegatinas brillantes.

---

## B · Carta impresa / editorial

Maqueta: `maquetas/b-carta.html` y capturas `b-carta-escritorio.png` / `b-carta-movil.png`.

**Referencias.**

- **Principal:** vuestra carta en papel (`frontend/public/images/kanalla_carta_01…04.jpg`).
- **Traslado a web:** The Devonshire, en One Page Love (https://onepagelove.com/devonshire). Es un pub del Soho con cabecera de periódico, rótulos de sección, fotos enmarcadas y ritmo de prensa. Captura: `referencias/devonshire-*.png`. Su web actual abre con un aviso emergente.

**La idea:** la web es un pliego de la carta.

- **Cabecera de periódico:** folio («Nº 11 · Noviembre 2026 · Galapagar») y doble filete.
- **Titular:** a todo el ancho.
- **Columnas:** separadas por un filete vertical (corondel).
- **Platos:** numerados («01 LA KANALLA») con línea de puntos hasta el precio en cobre.
- **Fotos:** con pie («Fig. 1 — La Puerca, 14,00€…»).
- **Folio final:** «Pág. 1 · Sigue en la pág. 2: Entrantes».

**Ritmo de la página.** Cada sección es una «página» con su propia maqueta:

- Pedido: una columna de datos.
- Carta: a dos columnas, como el papel.
- Manifiesto: una portada.
- Terraza y reserva: contraportada Noche.

**Gesto de firma:** la línea de puntos con el precio en cobre.

**Movimiento:** casi nada, y solo donde ayuda.

- **Entrada del titular:** una sola vez.
- **Al pasar por un plato:** la línea de puntos se rellena hasta el precio (`scaleX`, 200 ms ease-out). Marca la fila que estás leyendo.
- **Al cambiar de sección de la carta:** fundido de 180 ms.

**Riesgos.**

- Es la más segura y la más fiel a la carta, y mantiene el eje central del brief original.
- Su peligro es quedarse en «correcta» si la tipografía no se cuida al milímetro.
- Es la más barata de mantener.

---

## C · La comanda (la arriesgada)

Maqueta: `maquetas/c-comanda.html` y capturas `c-comanda-escritorio.png` / `c-comanda-movil.png`.

**Referencia:** Allta, en One Page Love (https://onepagelove.com/allta). Restaurante de Dublín cuya web es un menú que se toca: platos que se mueven por la pantalla, información en monoespaciada tipo ticket y una cinta con su premio. Captura: `referencias/allta-*.png`.

**La idea:** la web es una comanda de cocina.

- Tocas «+» en cualquier plato y se apunta en un ticket de papel kraft que sale de una ranura.
- «Mandar por WhatsApp» abre WhatsApp con el pedido ya escrito: platos, cantidades y total de carta.
- El hero va sobre tinta, porque el pedido es lo principal.

Ninguna de las cuatro marcas analizadas hace esto: todas te mandan a otra página, a una app o a una plataforma.

**Ritmo de la página.**

- Hero en tinta con el ticket.
- Carta en kraft, maquetada como la impresa, con «+» en cada plato.
- En móvil, la comanda se convierte en barra inferior: «Tu comanda · 3 · 28,00€».
- El COMBO SOFÁ, si lo validas, se apunta con un toque.

**Gesto de firma:** el ticket que se imprime.

**Movimiento:**

- **Al añadir un plato:** la tira de papel baja una línea (`translateY`, 220 ms ease-out) y la línea nueva aparece en 150 ms. Es la respuesta a lo que has hecho, no decoración.
- **El botón «+»:** `scale(.97)` al pulsarlo.
- **Lo demás:** quieto.

**Riesgos y decisiones.**

- **Es funcionalidad nueva.** No toca reservas ni Supabase: todo pasa en el navegador y termina en un enlace de WhatsApp. Los botones de WhatsApp y teléfono siguen funcionando sin JavaScript.
- **Envío y pedido mínimo:** no los conocemos. El ticket dice «envío: te lo confirmamos por WhatsApp» hasta que los confirmes.
- **Precios:** salen de `carta.json`. Si la carta cambia, el ticket cambia con ella.
- **Brief:** el ticket es papel, no una tarjeta, pero roza la regla de «sin cards». Lo marco para que lo decidas tú.
- **Coste:** es la de más trabajo y más pruebas.

---

## Recomendación

**C, la comanda.** Es la única de las tres en la que el diseño es el propio mecanismo de pedido. Ataca el objetivo número uno de `PRODUCT.md` (más pedidos directos), ninguna marca de la competencia lo tiene y no depende de ninguna plataforma.

Su carta se maqueta como la impresa, así que conserva lo mejor de la B sin mezclar mundos. Si prefieres riesgo bajo y poco mantenimiento, elige la B.
