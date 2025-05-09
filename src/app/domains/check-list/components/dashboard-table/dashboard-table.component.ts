import { Component, ViewChild, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatProgressBarModule
  ],
  templateUrl: './dashboard-table.component.html',
  styleUrl: './dashboard-table.component.scss'
})
export class DashboardTableComponent implements OnInit {
  displayedColumns: string[] = ['id', 'checklist', 'priority', 'status', 'progress'];

  dataSource = new MatTableDataSource([
    { id: 34, checklist: 'Distribuciones : CL Control de polvo', priority: 'High', status: 'Testing', progress: 40 },
    { id: 89, checklist: 'Distribuciones : Reporte incidente', priority: 'Normal', status: 'Completed', progress: 100 },
    { id: 73, checklist: 'Distribuciones : Insp. SSOMA', priority: 'Low', status: 'Testing', progress: 70 },
    { id: 65, checklist: 'Area Persona : Reporte Incidente', priority: 'Normal', status: 'Canceled', progress: 25 },
    { id: 34, checklist: 'Area Persona : CL Control Polvo', priority: 'High', status: 'Waiting', progress: 40 },
    { id: 89, checklist: 'Enfierradura : Contacto personal', priority: 'Normal', status: 'Pending', progress: 60 },
  ]);

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  getProgressColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'primary';
      case 'canceled':
        return 'warn';
      default:
        return 'accent';
    }
  }
}
