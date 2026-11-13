import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * La web pública se prerenderiza a HTML estático en el build (SEO + LCP rápido).
 * `/reservas` también, porque es la URL a la que vuelve el login de Google.
 * El panel de admin y las páginas legales se renderizan en el navegador.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'reservas', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
