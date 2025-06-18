import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-add-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './add-reports.component.html',
  styleUrl: './add-reports.component.scss'
})

export class AddReportsComponent {
  project: string = '';
  type: string = '';
  period: Date | null = null;

  types = ['ART', 'INSPECCIÓN SSTMA', 'REPORTE INCIDENTES'];

  displayedColumns = ['project', 'name', 'period'];

  tableData1 = [
    { project: 'Proyecto A', name: 'Juan Pérez', period: '2024-12' },
  ];
  tableData2 = [
    { project: 'Proyecto B', name: 'Ana Torres', period: '2025-01' },
  ];
  tableData3 = [
    { project: 'Proyecto C', name: 'Luis Vega', period: '2025-02' },
  ];
}
