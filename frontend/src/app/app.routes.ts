import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  // ─── Web pública: una sola página ───────────────────────────────────────────
  // La home va en el paquete inicial (sin esperar a otro chunk para hidratar);
  // el admin y las legales siguen cargándose aparte.
  { path: '', component: HomeComponent },
  // `/reservas` muestra la misma página y baja al formulario. Se mantiene porque
  // el login de Google (Supabase OAuth) vuelve a la URL desde la que se envió.
  { path: 'reservas', component: HomeComponent, data: { seccion: 'reservas' } },
  // URL antigua de la carta en PDF
  { path: 'menu', redirectTo: '/', pathMatch: 'full' },
  // ─── Admin (oculto — no enlazado en la web pública) ─────────────────────────
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  // ─── Páginas legales ────────────────────────────────────────────────────────
  {
    path: 'privacidad',
    loadComponent: () =>
      import('./features/legal/privacy/privacy.component').then((m) => m.PrivacyComponent),
  },
  {
    path: 'cookies',
    loadComponent: () =>
      import('./features/legal/cookies/cookies.component').then((m) => m.CookiesComponent),
  },
  // ─── Catch-all ──────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
