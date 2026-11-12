# Análisis visual de la competencia (12 nov 2026)

Capturas reales con Playwright y Chrome a 1440×900 y 390×844 (×2), de hero y página completa, en esta carpeta. Los datos de tipografía, color, animación y canales salen del DOM y de los estilos computados de cada web.

- **Cookies:** en Goiko y Vicio se pulsó «Rechazar». Hundred y TGB no ofrecen botón de rechazo, así que el banner se ocultó sin aceptarlo.
- **Vicio:** su home es una sola pantalla con scroll horizontal. Por eso, además del hero, hay una tira de fotogramas (`vicio-*-recorrido.jpg`).
- **Hundred:** también tiene `hundred-*-recorrido.jpg`.

| Archivo | Qué es |
|---|---|
| `<marca>-escritorio-hero.png`, `<marca>-movil-hero.png` | Primer pantallazo |
| `<marca>-escritorio-completa.jpg`, `<marca>-movil-completa.jpg` | Página completa |
| `*-recorrido.jpg` | Fotogramas del scroll (Vicio y Hundred) |

> El copy de cada marca se resume con paráfrasis; las frases literales se leen en las capturas.

---

## 1. Goiko — goiko.com

**Tipografía.** Knockout 700 (display, con licencia) y Nunito Sans 400/600/700 para el texto.

- Hero en escritorio: «KEVIN BACON» repetido a 112 px / 96 px de interlineado, en mayúsculas, alternando relleno blanco y contorno.
- Cuerpo: 18 px.
- Botones: Knockout 700, 16 px.

**Paleta real.**

- Negro `#000` (55 % del hero) y blanco.
- CTA «Reservar» en rojo `#EE2737`; «Hacer pedido» en contorno blanco de 2 px.
- Botones en cápsula, con radio de 32 px.
- Club en un degradado granate.

**Estructura de la home.**

1. Hero en vídeo: burger recortada sobre un marquee de texto gigante.
2. Slider de burgers destacadas.
3. Marquee «CARTA» y categorías en tarjetas.
4. Contador de Kevin Bacon vendidas este año.
5. Club «Friends with Benefits».
6. Foodtruck.
7. Producto de supermercado (Goikocina).
8. Noticias en tarjetas.
9. Pie con megamenú y otro marquee.

**Cómo empujan el pedido.**

- Header fijo con «HACER PEDIDO» y «RESERVAR» siempre visibles; en móvil, «PEDIR».
- Canal propio: `/delivery` y `/takeaway`, con «Recibirlo en casa» y «Recogerlo en local». Ni una plataforma en la web.
- Fidelización con puntos («Goikoins») y regalo por recoger: teques gratis en takeaway.

**Animación.**

- WordPress + Elementor con GSAP, ScrollTrigger, AOS, Swiper, Flickity y Three.
- Marquees infinitos de 24 s, texto rotando cada 6,4 s y vídeos en bucle.
- 50 reglas de hover con transform.
- Solo 3 reglas de `prefers-reduced-motion`.
- Más de 15 dominios de seguimiento: Cookiebot, Clarity, Crazy Egg, Criteo, TikTok, Outbrain…

**Tono.** Hiperbólico, spanglish y de cultura pop: un actor da nombre a la burger estrella, el club es un juego de palabras con una película y la jerga es de «chorreo». Mucha exclamación.

- **Haríamos igual:** convertir un plato en personaje con dato propio (el contador de unidades vendidas). Es mitología de marca que no se puede copiar.
- **Evitaríamos:** el peso. Seis librerías de animación, vídeos y más de 15 rastreadores; además, botones en cápsula, que nuestro sistema prohíbe.

## 2. Vicio — vicio.com (con ficha en Awwwards)

**Tipografía.**

- Helvetica Neue Condensed 700 para todo, a tamaños de cartel en los bloques gráficos.
- Menú y navegación en minúsculas: 9,7–13,6 px.
- Recoleta 700 solo en el botón «¡PIDE YA!».

**Paleta real.**

- Gris claro `#EDEDED` (46 %) y negro.
- Rojo `#FF1E0B` en el CTA y en las pegatinas, con acentos holográficos.
- Fotografía de moda a todo color: naranja, rojo, morado.

**Estructura.** Una sola pantalla de 100vh: es un collage, no una página que baja.

- Burger del momento recortada y con nombre.
- Pegatinas que son enlaces: club, pedidos grandes, colaboraciones.
- «COLLECTION» con toda la carta como lista de texto separada por barras.
- «VICIO CITIES» como tira de fotos que avanza en horizontal con la rueda.
- Pie con la navegación.

**Cómo empujan el pedido.**

- «¡PIDE YA!» fijo arriba a la derecha, también en móvil.
- Canal 100 % propio: `vicio.com/menu`. Nacieron como delivery y no enlazan plataformas.
- Pegatinas de «Burger Club» y de «Big Orders».

**Animación.**

- Webflow con GSAP, ScrollTrigger y Lenis (scroll suave).
- Scroll horizontal secuestrado, vídeos en bucle y pegatinas que crecen hasta ×2 al pasar el ratón.
- **Cero** reglas de movimiento reducido.

**Tono.** De marca de ropa urbana: eslóganes en inglés, jerga española («ganas de vicio») y autoironía en las pegatinas. Habla como un *drop*, no como un restaurante.

- **Haríamos igual:** la carta completa como lista de texto corrida en el primer pantallazo. Se ve todo de un vistazo, sin tarjetas.
- **Evitaríamos:** el scroll horizontal secuestrado y el texto de 9–13 px; además, ignoran el movimiento reducido.

## 3. Hundred Burgers — hundredburgers.com

**Tipografía.**

- Hudson NY (condensada de estilo universitario estadounidense), a 60 px en el H2 del hero (50 px en móvil). Navegación a 20 px.
- Gotham 400/600 para el texto, a 15 px.

**Paleta real.**

- Granate `#8A1538` de fondo en toda la web.
- Paneles blancos y rosa con trama de semitono.
- Botones de esquina viva con borde de 3 px, nunca en cápsula.

**Estructura.**

1. Hero partido en dos: foto y panel con el premio *World's Best Burgers*.
2. Tres tarjetas iguales: reserva, burger del mes, recogida.
3. Banda «Ver carta».
4. Experiencia y tiendas, junto a «Meet the bear» (mascota).
5. Manifiesto.
6. Redes.
7. Pie.

**Cómo empujan el pedido.**

- Canal propio: `/pide` con carrito y app propia (App Store y Google Play).
- En móvil, barra inferior fija «App · Pide · Reserva» desde el primer pantallazo.
- Sin plataformas y sin club de puntos.

**Animación.**

- Nuxt (Vue) y casi nada más: un `fadeInUp` de 600 ms, esqueletos de carga y 7 hovers con transform.
- Es la más rápida y sobria de las cuatro.

**Tono.**

- Serio y orgulloso, con párrafos largos sobre el viaje para encontrar las mejores burgers del mundo, la carne madurada y el brioche propio.
- Usan exactamente nuestro argumento: «Sin intermediarios» (Hundred, sección «Somos Hundred»).

- **Haríamos igual:** la barra inferior fija desde el primer pantallazo y los botones cuadrados con borde. Encajan con nuestra regla de esquinas vivas.
- **Evitaríamos:** la rejilla de tres tarjetas iguales y los párrafos largos en el hero. Además, conviene tener en cuenta que «sin intermediarios» ya lo dicen ellos: no puede ser nuestro único argumento.

## 4. The Good Burger (TGB) — thegoodburger.com

**Tipografía.**

- Druk Medium y Druk Wide, a 90 px / 85 px en el hero (60 px en móvil).
- Akzidenz Grotesk Light, Medium y Bold para el texto (26 px de lead).
- Logo y franja vertical con «THEGOODBURGER» letra a letra.

**Paleta real.**

- Hueso `#E5E4DA` (81 %) y verde oscuro `#23352F` en titulares.
- Lima `#D8E999` en la franja vertical y verde `#00B189` en palabras clave.

**Estructura.**

1. Franja vertical, navegación centrada con el logo y burger recortada con «LA BUENA HAMBURGUESA.».
2. Foto de gente comiendo, con un sello circular de texto girando.
3. Tres productos destacados: snacks, menús y edición limitada «censurada».
4. Manifiesto en párrafo.
5. Tríptico de vídeos: carne, cerveza, fritos.
6. Club TGB (newsletter con descuentos).
7. Pie.

**Cómo empujan el pedido.**

- No hay botón de pedir en el hero: «Delivery» es un enlace más del menú.
- `/delivery` lleva a **Uber Eats**: es la única de las cuatro que depende de una plataforma.
- Club de email con promociones. En el menú pesa tanto «Abre tu franquicia» como «Delivery».

**Animación.**

- Sin librerías JS, con animate.css: un `fadeIn` de 1 s.
- Sello circular rotando y vídeos en bucle.

**Tono.** Amable e inclusivo: buen rollo, juegos con «good/buena», «la calidad es para todos».

- **Haríamos igual:** una sola marca gráfica propia y constante (la franja vertical) y un solo color de acento usado con disciplina.
- **Evitaríamos:** mandar el pedido a una plataforma y esconderlo en el menú, y animar con una librería genérica.

---

## Qué hace que ninguna parezca hecha con IA

1. **Tipografía con licencia o con mucho carácter, usada a escala extrema:** Knockout, Druk, Hudson NY y Helvetica Neue Condensed. Ninguna usa la fuente por defecto de una plantilla.
2. **Un gesto gráfico propio que se repite:**
   - Goiko: marquee con letras en contorno.
   - Vicio: pegatinas holográficas.
   - Hundred: marcos de camiseta universitaria y semitono.
   - TGB: franja vertical letra a letra.
3. **Mitología y datos propios, no adjetivos:**
   - Goiko: contador de una burger concreta.
   - Hundred: premio con enlace al ranking y mascota.
   - Vicio: «Collection» y ciudades.
   - TGB: edición «censurada».
4. **Fotografía de su propio mundo:** gente, locales, sesiones de moda. Nunca solo platos sobre fondo neutro.
5. **Estructura irregular:** ninguna repite «kicker + titular + párrafo centrado + dos botones» en cada sección; cada bloque tiene otra composición y otra altura.
6. **Voz con jerga propia:** cada una tiene palabras que solo usa ella.

## Conclusiones para Kanalla: 5 decisiones para la home

Respetan kraft, tinta, cobre, Anton/Poppins/Barlow y el pedido directo por WhatsApp y teléfono.

1. **Un plato con nombre y precio en el primer pantallazo.** Hoy la burger del hero no tiene nombre. Pasa a ser «LA PUERCA · 14,00€» con una línea de la carta impresa, y el enlace de WhatsApp llega con ese plato ya escrito. Se puede rotar con la Hamburguesa del mes. (Lo hacen Goiko y Vicio.)
2. **Datos y la voz de la carta impresa, en vez de copy de catálogo.**
   - El hero responde a las dos dudas del vecino: si abrís hoy («Hoy, de 19:00 a 23:30» / «Los lunes descansamos») y si llegáis a su pueblo (las cuatro zonas).
   - Las descripciones vuelven a ser las de la carta en papel, con su gracia.
   - «Sin intermediarios» deja de repetirse tres veces, porque Hundred ya lo dice.
3. **Un solo gesto de firma, sacado de vuestro material**, usado como mucho tres veces: el sello de tinta, el filete con puntos y precio en cobre, o la comanda, según la dirección que elijas. A cambio salen los tics de plantilla: grano por todas partes, manifiesto palabra a palabra, logo que se dibuja y 55 elementos que «suben y aparecen».
4. **Ritmo editorial: cada sección con otra composición y otra altura:**
   - «Pide directo» se convierte en una franja de datos, no en un segundo hero.
   - La carta pasa a ser una hoja larga como la impresa, con accesos fijos a cada sección.
   - Terraza y reservas se fusionan en un solo bloque Noche.
   - Como mucho dos secciones centradas.
5. **El canal directo con premio propio y medible.** Goiko regala teques al recoger, TGB y Goiko tienen club, Hundred tiene app. Kanalla: un **combo solo por WhatsApp** (propuesta abajo). El mensaje llega precargado con su nombre, así que se cuenta en el propio WhatsApp sin instalar analítica.

### Propuesta: «COMBO SOFÁ», solo por WhatsApp (pendiente de tu validación; no se publica nada)

- **Qué lleva:** 2 hamburguesas a elegir de la carta + 1 ración de patatas + tequeños.
- **Precio propuesto: 35,00€.** Por separado, con precios de la carta actual:
  - 2 burgers: entre 25,00€ (2 × La Bribona) y 28,00€ (2 × La Puerca).
  - Patatas: 4€. Tequeños: 10€.
  - **Total: 39,00–42,00€.** El combo ahorra entre 4 y 7€ (10–17 %).
- **Por qué este:** la carta impresa ya avisa de que las hamburguesas vienen sin patatas y recomienda una ración para cada dos. El combo convierte esa fricción en el gancho, y además sube el ticket con los tequeños, que son nuevos.
- **Cómo se pide:** el botón abre WhatsApp con el texto «Hola Kanalla, quiero el COMBO SOFÁ con…». Basta contar los mensajes con «COMBO SOFÁ» para medirlo.
- **Para decidir tú:**
  - El precio y el margen.
  - Si excluye la Hamburguesa del mes y el Menú infantil.
  - Si «solo por WhatsApp» deja fuera a quien llama. La alternativa es «solo pidiendo directo»: WhatsApp o teléfono.
  - El nombre. Otras opciones: «EL KANALLA DE SOFÁ» o «PACK SOFÁ Y MANTA».
