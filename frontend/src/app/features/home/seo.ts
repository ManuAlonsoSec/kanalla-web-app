import { CARTA, LOCAL } from '../../../data/datos';

const BASE = LOCAL.url;

/** "13,50€" → "13.50"; "Consultar" → null */
function precio(texto: string): string | null {
  const m = /(\d+)(?:,(\d+))?/.exec(texto);
  if (!m) return null;
  return `${m[1]}.${(m[2] ?? '00').padEnd(2, '0')}`;
}

/** Schema.org Restaurant para el SEO local. Todo sale de src/data/*.json. */
export function buildRestaurantJsonLd(): Record<string, unknown> {
  const d = LOCAL.direccion;
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${BASE}/#restaurante`,
    name: LOCAL.nombre,
    url: `${BASE}/`,
    logo: `${BASE}/images/logo-kanalla-burger-tinta.png`,
    image: [
      `${BASE}/images/og-kanalla.jpg`,
      `${BASE}/images/foto-la-clasica-912.webp`,
      `${BASE}/images/foto-nachos-912.webp`,
    ],
    telephone: LOCAL.telefono.e164,
    email: LOCAL.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: d.calle,
      postalCode: d.cp,
      addressLocality: d.localidad,
      addressRegion: d.region,
      addressCountry: d.pais,
    },
    geo: { '@type': 'GeoCoordinates', latitude: LOCAL.geo.lat, longitude: LOCAL.geo.lng },
    hasMap: LOCAL.mapa,
    sameAs: [LOCAL.instagram],
    servesCuisine: ['Hamburguesas'],
    priceRange: '€€',
    acceptsReservations: `${BASE}/reservas`,
    areaServed: LOCAL.zonasReparto.map((name) => ({ '@type': 'City', name })),
    openingHoursSpecification: LOCAL.horarioSchema.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.dias.map((day) => `https://schema.org/${day}`),
      opens: h.abre,
      // Google interpreta «hasta medianoche» como 23:59
      closes: h.cierra === '00:00' ? '23:59' : h.cierra,
    })),
    menu: `${BASE}/#carta`,
    hasMenu: {
      '@type': 'Menu',
      name: 'Carta Kanalla',
      url: `${BASE}/#carta`,
      inLanguage: 'es',
      hasMenuSection: CARTA.map((s) => ({
        '@type': 'MenuSection',
        name: s.titulo,
        hasMenuItem: s.platos.map((p) => {
          const price = precio(p.precio);
          return {
            '@type': 'MenuItem',
            name: p.nombre,
            ...(p.descripcion ? { description: p.descripcion } : {}),
            ...(price ? { offers: { '@type': 'Offer', price, priceCurrency: 'EUR' } } : {}),
          };
        }),
      })),
    },
  };
}
