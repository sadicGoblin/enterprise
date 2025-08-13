import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
  },
  {
    path: 'check-list',
    canActivate: [authGuard], // Proteger todas las rutas de check-list
    loadChildren: () =>
      import('./domains/check-list/check-list.routes').then((m) => m.checkListRoutes),
  },
  // Redirigir cualquier ruta no encontrada al login
  {
    path: '**',
    redirectTo: '',
  },
];

