import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProxyService } from '../../../../../core/services/proxy.service';
import { environment } from '../../../../../../environments/environment';
import { SstmaObraDetailModalComponent } from './components/sstma-obra-detail-modal/sstma-obra-detail-modal.component';

export interface SstmaObraReport {
  id: string;
  idUser: string;
  reportData: {
    obra: number;
    obra_text: string;
    area_trabajo: string;
    empresa: number;
    empresa_text: string;
    potencial_gravedad: number;
    potencial_gravedad_text: string;
    condicion_detectada: string;
    ambito: number;
    ambito_text: string;
    riesgo: number;
    riesgo_text: string;
    evidencia: string[];
    fecha_reporte: string;
    reportadoPor: string;
  };
  metaData: any;
  created: string;
}

interface ApiResponse {
  success: boolean;
  code: number;
  message: string;
  data: SstmaObraReport[];
}

@Component({
  selector: 'app-sstma-obra-report',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './sstma-obra-report.component.html',
  styleUrls: ['./sstma-obra-report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SstmaObraReportComponent implements OnInit {
  displayedColumns: string[] = ['id', 'obra', 'empresa', 'ambito', 'riesgo', 'fecha', 'acciones'];
  dataSource: SstmaObraReport[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';

  private readonly API_ENDPOINT = '/ws/ActividadSvcImpl.php';

  constructor(
    private proxyService: ProxyService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading = true;
    this.hasError = false;

    const requestBody = {
      caso: 'GetReportGrlSSTMA'
    };

    console.log('[SstmaObraReport] Cargando reportes:', requestBody);

    this.proxyService.post<ApiResponse>(environment.apiBaseUrl + this.API_ENDPOINT, requestBody)
      .subscribe({
        next: (response) => {
          console.log('[SstmaObraReport] Respuesta:', response);
          this.isLoading = false;

          if (response.success && response.data) {
            this.dataSource = response.data;
          } else {
            this.hasError = true;
            this.errorMessage = response.message || 'Error al cargar los reportes';
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('[SstmaObraReport] Error:', error);
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage = 'Error de conexión. Intente nuevamente.';
          this.cdr.markForCheck();
        }
      });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  openDetailModal(report: SstmaObraReport): void {
    this.dialog.open(SstmaObraDetailModalComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: report,
      panelClass: 'sstma-obra-detail-modal'
    });
  }
}
