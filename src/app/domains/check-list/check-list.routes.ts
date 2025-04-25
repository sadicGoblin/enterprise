import { Routes } from '@angular/router';
import { CheckListLayoutComponent } from './layout/check-list-layout/check-list-layout.component';
import { CheckListDashboardComponent } from './pages/check-list-dashboard/check-list-dashboard.component';

export const checkListRoutes: Routes = [
  {
    path: '',
    component: CheckListLayoutComponent,
    children: [
      { path: '', component: CheckListDashboardComponent },
    ]
  }
];
