import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
  },
  {
    path: 'check-list',
    loadChildren: () =>
      import('./domains/check-list/check-list.routes').then((m) => m.checkListRoutes),
  },
];

