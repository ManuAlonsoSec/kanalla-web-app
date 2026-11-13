import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

/** Rutas del panel (carga diferida: Supabase no entra en el bundle de la web pública). */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-login/admin-login.component').then((m) => m.AdminLoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },
];
