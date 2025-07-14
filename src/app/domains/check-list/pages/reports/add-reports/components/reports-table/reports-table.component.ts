import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProxyService } from '../../../../../../../core/services/proxy.service';

// Interface for the API response
interface ReportResponse {
  success: boolean;
  code: number;
  message: string;
  data: Report[];
}

// Interface for a report item
interface Report {
  tipo: string;
  idActividad: string;
  idObra: string;
  Obra: string;
  fecha: string;
  creador: string;
  profesionalResponsable: string;
  ambitoInvolucrado: string;
  comunicadoA: string;
}

@Component({
  selector: 'app-reports-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './reports-table.component.html',
  styleUrl: './reports-table.component.scss'
})
export class ReportsTableComponent implements OnInit {
  @Input() period: number = 202507; // Default value if not provided
  
  reports: Report[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Define columns to display in the table
  displayedColumns: string[] = [
    'tipo', 
    'idActividad',
    'Obra',
    'fecha', 
    'creador',
    'profesionalResponsable',
    'ambitoInvolucrado',
    'comunicadoA',
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private proxyService: ProxyService) {}

  ngOnInit() {
    this.loadReports();
  }

  /**
   * Loads reports from the API
   * @param forcePeriod Optional parameter to force a specific period
   */
  loadReports(forcePeriod?: number) {
    this.isLoading = true;
    this.error = null;
    
    const requestBody = {
      caso: 'ReportAll',
      periodo: forcePeriod || this.period
    };

    this.proxyService.post<ReportResponse>('/ws/ReporteSvcImpl.php', requestBody)
      .subscribe({
        next: (response: ReportResponse) => {
          if (response.success) {
            this.reports = response.data;
          } else {
            this.error = response.message || 'Error al cargar reportes';
          }
          this.isLoading = false;
        },
        error: (err: any) => {
          this.error = 'Error de conexión al servicio';
          this.isLoading = false;
          console.error('Error fetching reports:', err);
        }
      });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL');
    } catch (error) {
      return dateString;
    }
  }

  viewReport(report: Report) {
    // Open report detail view or PDF if available
    console.log('View report:', report);
    // Check if there's a PDF URL or navigate to detail view
    if (report.idActividad) {
      // You would implement PDF viewing or detail navigation here
      // Example: this.router.navigate(['/report-detail', report.idActividad]);
      window.alert('Ver detalle del reporte: ${report.tipo} - ${report.idActividad}');
    }
  }

  deleteReport(report: Report) {
    // Confirm before deleting
    const confirmation = window.confirm('¿Está seguro que desea eliminar este reporte: ${report.tipo} - ${report.idActividad}?');
    
    if (confirmation) {
      console.log('Delete report:', report);
      // Here you would call the API to delete the report
      // For now, we'll just show a message
      window.alert('Reporte eliminado: ${report.tipo} - ${report.idActividad}');
      
      // After successful deletion, reload the reports list
      this.loadReports();
    }
  }
}