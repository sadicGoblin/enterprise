import { Routes } from '@angular/router';
import { CheckListLayoutComponent } from './layout/check-list-layout/check-list-layout.component';
import { CheckListDashboardComponent } from './pages/check-list-dashboard/check-list-dashboard.component';
import { CheckListAccessComponent } from './pages/check-list-access/check-list-access.component';
import { ChangePasswordsComponent } from './pages/change-passwords/change-passwords.component';
import { OrganizationalMapComponent } from './pages/organizational-map/organizational-map.component';
import { WorkMaintenanceComponent } from './pages/work-maintenance/work-maintenance.component';
import { CreateParamsComponent } from './pages/create-params/create-params.component';

export const checkListRoutes: Routes = [
  {
    path: '',
    component: CheckListLayoutComponent,
    children: [
      { path: 'dashboard', component: CheckListDashboardComponent },
      { path: 'accesos', component: CheckListAccessComponent },
      { path: 'cambio-clave', component: ChangePasswordsComponent },
      { path: 'mapa-organizacional', component: OrganizationalMapComponent },
      { path: 'obra-mantencion', component: WorkMaintenanceComponent },
      { path: 'parametros', component: CreateParamsComponent },
    ],
  },
];
