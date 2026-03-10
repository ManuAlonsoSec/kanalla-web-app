import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./features/menu/menu.component').then((m) => m.MenuComponent),
  },
  {
    path: 'reservas',
    loadComponent: () =>
      import('./features/booking/booking.component').then((m) => m.BookingComponent),
  },
  // ─── Admin (hidden — not linked in public UI) ───────────────────────────────
  {
    path: 'admin',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/admin-login/admin-login.component').then(
            (m) => m.AdminLoginComponent,
          ),
      },
      {
        path: 'dashboard',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
    ],
  },
  // ─── Legal pages ────────────────────────────────────────────────────────────
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
