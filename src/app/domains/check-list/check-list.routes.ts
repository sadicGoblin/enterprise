import { Routes } from '@angular/router';
import { CheckListLayoutComponent } from './layout/check-list-layout/check-list-layout.component';
import { CheckListDashboardComponent } from './pages/check-list-dashboard/check-list-dashboard.component';
import { CheckListAccessComponent } from './pages/check-list-access/check-list-access.component';
import { ChangePasswordsComponent } from './pages/change-passwords/change-passwords.component';
import { OrganizationalMapComponent } from './pages/organizational-map/organizational-map.component';
import { WorkMaintenanceComponent } from './pages/work-maintenance/work-maintenance.component';
import { CreateParamsComponent } from './pages/create-params/create-params.component';
import { AddCustomParamsComponent } from './pages/add-custom-params/add-custom-params.component';
import { AddActivitiesPpComponent } from './pages/add-activities-pp/add-activities-pp.component';
import { LibraryPpComponent } from './pages/library-pp/library-pp.component';
import { AddReportsComponent } from './pages/add-reports/add-reports.component';
import { SstmaInspectionComponent } from './pages/sstma-inspection/sstma-inspection.component';
import { IncidentReportComponent } from './pages/incident-report/incident-report.component';
import { CreateDashboardPpComponent } from './pages/create-dashboard-pp/create-dashboard-pp.component';
import { InspectionTrackingComponent } from './pages/inspection-tracking/inspection-tracking.component';
import { ActivityPlanningComponent } from './pages/activity-planning/activity-planning.component';

export const checkListRoutes: Routes = [
  {
    path: '',
    component: CheckListLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: CheckListDashboardComponent },
      { path: 'accesos', component: CheckListAccessComponent },
      { path: 'cambio-clave', component: ChangePasswordsComponent },
      { path: 'mapa-organizacional', component: OrganizationalMapComponent },
      { path: 'obra-mantencion', component: WorkMaintenanceComponent },
      { path: 'parametros', component: CreateParamsComponent },
      { path: 'ingreso-parametros-pp', component: AddCustomParamsComponent },
      { path: 'carga-actividades', component: AddActivitiesPpComponent },
      { path: 'biblioteca', component: LibraryPpComponent },
      { path: 'ingreso-reporte', component: AddReportsComponent },
      { path: 'inspeccion-sstma', component: SstmaInspectionComponent },
      { path: 'reporte-incidentes', component: IncidentReportComponent },
      { path: 'creacion-dashboard-pp', component: CreateDashboardPpComponent },
      { path: 'seguimiento-inspecciones-sstma', component: InspectionTrackingComponent },
      { path: 'planificacion-actividades', component: ActivityPlanningComponent },
    ],
  },
];
