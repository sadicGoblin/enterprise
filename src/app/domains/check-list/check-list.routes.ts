import { Routes } from '@angular/router';
import { CheckListLayoutComponent } from './layout/check-list-layout/check-list-layout.component';

// Administration components in new folder structure
import { CheckListAccessComponent } from './pages/administration/accesses/check-list-access.component';
import { ChangePasswordsComponent } from './pages/administration/password-change/change-passwords.component';
import { OrganizationalMapComponent } from './pages/administration/organizational-map/organizational-map.component';
import { WorkMaintenanceComponent } from './pages/maintenance/work-maintenance/work-maintenance.component';
import { CreateParamsComponent } from './pages/maintenance/create-params/create-params.component';
import { AddCustomParamsComponent } from './pages/maintenance/custom-params/add-custom-params.component';
import { AddActivitiesPpComponent } from './pages/custom-program/activities/add-activities-pp.component';
import { LibraryPpComponent } from './pages/custom-program/library/library-pp.component';

// Reports components in new folder structure
import { AddReportsComponent } from './pages/reports/add-reports/add-reports.component';
import { SstmaInspectionComponent } from './pages/reports/sstma-inspection/sstma-inspection.component';
import { IncidentReportComponent } from './pages/reports/incident-report/incident-report.component';
import { CreateDashboardPpComponent } from './pages/reports/create-dashboard-pp/create-dashboard-pp.component';
import { InspectionTrackingComponent } from './pages/reports/inspection-tracking/inspection-tracking.component';
import { ActivityPlanningComponent } from './pages/activity-planning/activity-planning.component';
import { ReplicatePpComponent } from './pages/replicate-pp/replicate-pp.component';
import { HistoryReportComponent } from './pages/reports/history-report/history-report.component';
import { SstmaObraReportComponent } from './pages/reports/sstma-obra-report/sstma-obra-report.component';
import { WorkflowOcComponent } from './pages/workflow-oc/workflow-oc.component';
import { AccidentsComponent } from './pages/accidents/accidents.component';
import { AccidentsListComponent } from './pages/accidents/accidents-list/accidents-list.component';
import { AccidentsStatisticsComponent } from './pages/accidents/accidents-statistics/accidents-statistics.component';

export const checkListRoutes: Routes = [
  {
    path: '',
    component: CheckListLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/check-list-dashboard/check-list-dashboard.component').then(m => m.CheckListDashboardComponent) },

      // Administration routes grouped logically
      {
        path: 'administration',
        children: [
          { path: 'accesses', component: CheckListAccessComponent },
          { path: 'password-change', component: ChangePasswordsComponent },
          { path: 'organizational-map', component: OrganizationalMapComponent },
        ],
      },
      // Maintenance routes grouped logically
      {
        path: 'maintenance',
        children: [
          { path: 'work', component: WorkMaintenanceComponent },
          { path: 'params', component: CreateParamsComponent },
          { path: 'custom-params', component: AddCustomParamsComponent },
          { path: 'workflow-oc', component: WorkflowOcComponent },
        ],
      },
      // Custom Program routes grouped logically
      {
        path: 'custom-program',
        children: [
          { path: 'activities', component: AddActivitiesPpComponent },
          { path: 'library', component: LibraryPpComponent },
          { path: 'replicate', component: ReplicatePpComponent },
        ],
      },
      // Reports routes grouped logically
      {
        path: 'reports',
        children: [
          { path: 'add', component: AddReportsComponent },
          { path: 'sstma', component: SstmaInspectionComponent },
          { path: 'incidents', component: IncidentReportComponent },
          { path: 'dashboard', component: CreateDashboardPpComponent },
          { path: 'tracking', component: InspectionTrackingComponent },
          { path: 'history', component: HistoryReportComponent },
          { path: 'sstma-obra', component: SstmaObraReportComponent },
        ],
      },
      // Planning route
      { path: 'planning', component: ActivityPlanningComponent },
      // Accidents routes grouped logically
      {
        path: 'accidents',
        children: [
          { path: '', redirectTo: 'register', pathMatch: 'full' },
          { path: 'register', component: AccidentsComponent },
          { path: 'list', component: AccidentsListComponent },
          { path: 'statistics', component: AccidentsStatisticsComponent },
        ],
      },
    ],
  },
];
