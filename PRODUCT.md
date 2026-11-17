# Product

<!-- impeccable:product-schema 1 -->

> Escrito con `impeccable teach` (nov 2026) a partir del brief del encargo y de los datos confirmados por el dueño durante el rediseño. Actualizado el 12-11-2026 con la dirección de arte elegida («La comanda» con hero cartel) y el Combo Sofá. Lo marcado como **[por confirmar]** o **TODO** no es un hecho todavía.

## Platform

web

## Users

- **Vecino con hambre, de noche, en el móvil.** Vive en Galapagar, Colmenarejo, Collado Villalba o Torrelodones, quiere cenar en casa y busca cómo pedir ya. Su trabajo: ver la carta y precios, decidir y pedir en segundos por WhatsApp o teléfono.
- **Grupo que quiere plan de terraza.** Busca dónde tomar algo y cenar fuera en Galapagar; necesita horario, ubicación y reservar mesa en la terraza.
- **Cliente con dudas concretas**: alérgenos, horario de hoy, si hay que reservar.

## Product Purpose

Web de una sola página de Kanalla Skybar, gastrobar con terraza rooftop y burgers en Galapagar (Madrid). Su prioridad es **el pedido a domicilio directo** (WhatsApp y teléfono, sin plataformas); después, la carta completa con precios, la reserva de mesa en terraza y los datos del local. Éxito = más pedidos directos por WhatsApp/teléfono y reservas de terraza que llegan bien al panel de admin.

## Positioning

- **Pide directo, sin intermediarios.** Se pide al local por WhatsApp o teléfono; la web no menciona ni enlaza Glovo, Uber Eats, Just Eat ni ninguna otra plataforma.
- **Burger de barrio con carácter canalla**: vaca de la Sierra de Guadarrama (La Kanalla), recetas propias (mermelada de bacon casera, cochinita pibil a baja temperatura) y una voz con humor.
- **Espacio solo exterior**: se reserva únicamente en la terraza.
- **Premio por pedir directo: COMBO SOFÁ.** Dos hamburguesas a elegir (se puede repetir; todas menos la del mes y el menú infantil), ración de patatas y tequeños. Precio base 35,00 €; La Puerca y La Clásica suman 1 € cada una, así que sale por 35, 36 o 37 €. No incluye bebida. El ahorro es carta (burgers + patatas 4 € + tequeños 12 €) menos el precio del combo: hasta 8 €. Solo pidiendo directo, por WhatsApp o teléfono. Precio, suplementos y reglas en `carta.json` (`combo`).

## Operating Context

- Pedidos: WhatsApp `https://wa.me/34668569390` con mensaje precargado y teléfono `+34 668 56 93 90`. Zonas de reparto: Galapagar · Colmenarejo · Torrelodones · Collado Villalba.
- **La web, el asistente de pedidos y el TPV tienen que decir lo mismo.** El cliente arma la comanda en la web y la manda por WhatsApp al asistente de pedidos (n8n + Claude), que crea el pedido en el TPV Last.app. Fuente de verdad de precios: el TPV (catálogo «KANALLA PEDIDOS»). Fuente de verdad de horario: el del asistente.
- **La comanda** (en la web): el cliente apunta platos con «+» y elige su zona de reparto (obligatoria). El ticket suma el envío (2,00 €, línea propia) y comprueba el pedido mínimo de la zona sobre los productos, sin el envío: si no llega, avisa («Te faltan X € para el mínimo de <zona>») y el botón de WhatsApp queda desactivado. Se guarda en su navegador. Sin backend, sin pago y sin tocar las reservas.
- **Mensajes de WhatsApp: textos fijos, los lee el asistente.**
  - **Con comanda:** empieza exactamente por «Hola Kanalla, quiero hacer un pedido a domicilio:» (con dos puntos); el asistente reconoce un pedido de la web por ese inicio más al menos una línea «N x …». Lleva una línea por producto (`1 x La Kanalla: 13,50€`), el combo como «COMBO SOFÁ» con «+1€» solo junto a La Puerca o La Clásica, y después «Zona:», «Envío:», «Total orientativo:» y «Dirección:».
  - **Extras** (carne, huevo/bacon, aguacate, queso, pan sin gluten): nunca como línea suelta. Van con su burger: `1 x La Ramona 2.0 (+ extra de queso): 14,20€`, y dentro del combo, `La Puerca +1€ con extra de queso`. En la web se añaden en el ticket, debajo de cada burger; en la carta no tienen «+».
  - **Sin comanda** (talón «Pide directo», ticket vacío y barra del móvil): exactamente «Hola Kanalla, quiero hacer un pedido a domicilio», sin dos puntos ni productos. El asistente lo reconoce como saludo desde la web.
  - No cambiar ninguno sin cambiar también el asistente (`comanda.service.ts` y `local.json`; hay pruebas que los fijan).
- Reservas: formulario existente (login con Google + Supabase, comprobación de aforo por RPC). La web avisa antes de enviar de que se pedirá entrar con Google. El dueño revisa las reservas en `admin.kanallaskybar.es` y **llama al cliente para confirmar**: es la única promesa de confirmación que hace la web.
- Horario oficial (cabecera «Hoy», pie y JSON-LD; manda el del asistente): lunes cerrado; martes a jueves 19:45–23:00; viernes y sábado 13:00–15:30 y 19:45–23:30; domingo 13:00–15:30 y 19:45–23:00. El formulario de reservas no usa este horario: lee el suyo de Supabase (`restaurant_schedule`).
- Dirección: Av. de las Víctimas del Terrorismo, 1, 28420 Galapagar (Madrid). Instagram `@kanallaskybar`.
- Carta en papel impresa (diseño "Carta", nov 2026) que la web traslada; datos en `frontend/src/data/carta.json`.

## Capabilities and Constraints

- Stack existente: Angular 21 (standalone, zoneless, prerender estático) desplegado en Vercel; Supabase para reservas y admin. Se mantiene.
- El formulario de reservas NO cambia cómo envía los datos (mismos campos, validaciones, login y RPC); solo se rediseña.
- Requisitos: Lighthouse ≥ 95 en las cuatro categorías, WCAG 2.1 AA, todo estático con `prefers-reduced-motion`, animar solo `transform` y `opacity`, ninguna animación retrasa el formulario ni los enlaces de pedido.
- SEO: JSON-LD `Restaurant` (telephone, areaServed, hasMenu), Open Graph, sitemap y robots.
- Sin analítica (no había).
- Horario de reparto = horario del local (confirmado por el dueño).
- **Pedido mínimo y envío:** mínimo de 20 € en Galapagar, 30 € en Colmenarejo y 40 € en Torrelodones y Collado Villalba, sobre los productos sin el envío; envío fijo de 2,00 €, que se suma al total. Están en `local.json` (`pedidoMinimo`, `gastosEnvio`).

## Brand Commitments

Vinculantes (del brief y del dueño):

- **Design system "Carta"** como fuente de verdad: fondo kraft (`#CF9E76 → #DDAC81 → #ECC9A3`, plano `#E3B88E`), tinta `#492310` para títulos, texto y logo; cobre `#955510` solo en texto grande y bold; paleta Noche (`#062037`, `#F7BD08`, `#FBFAF5`, grano) como mucho en una sección y nunca mezclada con kraft.
- **Tipografía**: Anton (títulos y platos, MAYÚSCULAS), Poppins 700 (kickers, precios, botones), Barlow Condensed 500/600 y Barlow Semi Condensed 600 (texto, mayúsculas con tracking 0.03em).
- **Sin** cards, esquinas redondeadas, cápsulas, sombras de tarjeta, glassmorphism, iconos decorativos ni emoji. Separadores tipográficos (" · ") o filetes finos de tinta. Kicker encima del título como en la carta impresa, pero solo cuando da información.
- **Logo**: `logo-kanalla-burger-tinta.png`, tinta, sin recolorear ni redibujar.
- **Fotos**: platos sobre kraft con luz cálida; la comida es la protagonista.
- **Voz**: canalla, directa, con humor, tuteando. Mayúsculas con tilde. Precios `13,50€`.
- Titular principal: SI ESTÁS AQUÍ, YA ERES UN POCO KANALLA.
- Manifiesto: «Ser un Kanalla es una personalidad, un estilo de vida, algo con lo que se nace o no se nace. No podemos enseñarte a serlo, pero sí que lo saborees.» Cierre: «Bienvenidos a nuestra experiencia.»
- Pedido directo: botón principal «PIDE POR WHATSAPP», secundario «LLAMA: 668 56 93 90»; copy «PIDE DIRECTO. SIN INTERMEDIARIOS, CON TODO EL SABOR.»
- **Dirección de arte (elegida el 12-11-2026): «La comanda» con hero cartel.**
  - **Hero:** el logo es la imagen (grande, a la izquierda, con las llamas animadas) y el titular «KANALLA SE NACE.» va en Anton a sangre a la derecha, con el kicker «GALAPAGAR · BURGERS · ROOFTOP» en cobre, el horario de hoy, las zonas y el talón «Pide directo · WhatsApp». En móvil, el logo arriba y el titular debajo. Sin fotos de platos: esas van solo en la carta, donde La Puerca es el plato destacado.
  - **Resto de la página:** la comanda. Cada plato lleva «+» y el ticket kraft va fijo (lateral en escritorio, barra y hoja en móvil).
- **Gesto de firma: el ticket**, como mucho tres veces (talón del hero, precio del combo y la comanda). Nada de revelados genéricos al hacer scroll.
- **Logo:** se ve desde el primer pintado, sin trazo ni viaje al header. Va siempre **recto**: sin rotación ni inclinación en ningún tamaño de pantalla ni animación (decisión del dueño, 13-11-2026). Solo se mueven las llamas, que se estiran y encogen: un parpadeo lento de menos de 5 s y se avivan al pasar el ratón.

## Evidence on Hand

- Fotos de platos (sobre kraft): La Clásica, La Ramona, Nachos, Tequeños, Fingers de pollo y La Puerca (DSC08550 integrada). En `frontend/public/images/` solo están las versiones optimizadas; los originales viven fuera del repo, en `../kanalla-originales/`.
- Logo tinta en PNG y su vectorización por capas.
- Tabla de alérgenos: la imagen descargable optimizada (`tabla-alergenos-kanalla.jpg`, con copias AVIF y WebP) y sus datos (`frontend/src/data/alergenos.json`). El original (`kanalla_carta_05_alergenos.jpg`) y el resto de páginas de la carta impresa están en `../kanalla-originales/`.
- **No hay**: fotos de la terraza, reseñas o testimonios, premios, prensa, cifras de pedidos. No se inventan.

## Product Principles

1. **El pedido va primero.** Cualquier pantalla deja WhatsApp y teléfono a un toque; nada lo retrasa.
2. **Directo y sin intermediarios** como argumento de marca, no solo como canal.
3. **La carta impresa manda.** La web es la carta del local hecha pantalla: mismos datos, mismo sistema, misma voz.
4. **Verdad antes que efecto.** Solo datos, fotos y promesas reales; lo que no se sabe, se consulta al personal.
5. **Para todos**: rápida en móvil de gama media, legible y usable sin animaciones.

## Accessibility & Inclusion

WCAG 2.1 AA; `prefers-reduced-motion` deja todo estático; tabla de alérgenos accesible (texto alternativo «contiene» / «trazas») con descarga de la imagen original.
