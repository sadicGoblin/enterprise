import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-activity-planning',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './activity-planning.component.html',
  styleUrl: './activity-planning.component.scss',
})
export class ActivityPlanningComponent {
  selectedProject: string = '';
  selectedUser: string = '';
  selectedPeriod: Date | null = null;

  projects = ['Proyecto 1', 'Proyecto 2'];
  collaborators = ['Felipe Gallardo', 'Germán Medina', 'Patricio Baeza'];

  days = Array.from({ length: 31 }, (_, i) => i + 1);
  
  displayedColumns = [
    'activity',
    'periodicity',
    ...this.days.map(d => 'day' + d),
    'assign',
    'realized',
    'compliance'
  ];
  
  activities = [
    {
      activity: 'Check List Seguridad',
      periodicity: 'Semanal',
      dailyChecks: Array(31).fill(false),
      assign: 1,
      realized: 0,
      compliance: 0,
    },
    {
      activity: 'Inspección SSTMA',
      periodicity: 'Quincenal',
      dailyChecks: Array(31).fill(false),
      assign: 1,
      realized: 1,
      compliance: 100,
    },
  ];
}
