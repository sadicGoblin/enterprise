import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ProxyService } from '../../../../../core/services/proxy.service';
import { environment } from '../../../../../../environments/environment';
import { SstmaObraDetailModalComponent } from './components/sstma-obra-detail-modal/sstma-obra-detail-modal.component';
import { ExportService, ExportColumn } from '../../../../../shared/services/export.service';
import { BtnComponent, KpiTileComponent, PillComponent, PillVariant } from '../../../../../shared/ui';

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

interface FilterState {
  obra: string;
  empresa: string;
  ambito: string;
  riesgo: string;
  search: string;
}

@Component({
  selector: 'app-sstma-obra-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    BtnComponent,
    PillComponent,
    KpiTileComponent,
  ],
  templateUrl: './sstma-obra-report.component.html',
  styleUrls: ['./sstma-obra-report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SstmaObraReportComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'obra', 'empresa', 'ambito', 'riesgo', 'fecha', 'acciones'];
  dataSource = new MatTableDataSource<SstmaObraReport>([]);
  isLoading = false;
  hasError = false;
  errorMessage = '';

  filterObra = '';
  filterEmpresa = '';
  filterAmbito = '';
  filterRiesgo = '';
  filterSearch = '';

  obrasUnicas: string[] = [];
  empresasUnicas: string[] = [];
  ambitosUnicos: string[] = [];
  riesgosUnicos: string[] = [];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private readonly API_ENDPOINT = '/ws/ActividadSvcImpl.php';

  constructor(
    private proxyService: ProxyService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private exportService: ExportService,
  ) {
    this.dataSource.filterPredicate = this.createFilter();
  }

  ngOnInit(): void {
    this.loadReports();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    this.dataSource.sortingDataAccessor = (item: SstmaObraReport, property: string) => {
      switch (property) {
        case 'obra': return item.reportData?.obra_text?.toLowerCase() || '';
        case 'empresa': return item.reportData?.empresa_text?.toLowerCase() || '';
        case 'ambito': return item.reportData?.ambito_text?.toLowerCase() || '';
        case 'riesgo': return item.reportData?.riesgo_text?.toLowerCase() || '';
        case 'fecha': return item.reportData?.fecha_reporte || '';
        default: return (item as any)[property];
      }
    };
  }

  loadReports(): void {
    this.isLoading = true;
    this.hasError = false;

    const requestBody = { caso: 'GetReportGrlSSTMA' };

    this.proxyService.post<ApiResponse>(environment.apiBaseUrl + this.API_ENDPOINT, requestBody)
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          if (response.success && response.data) {
            this.dataSource.data = response.data;
            this.extractUniqueValues(response.data);
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
        },
      });
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  }

  openDetailModal(report: SstmaObraReport): void {
    this.dialog.open(SstmaObraDetailModalComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: report,
      panelClass: 'sstma-obra-detail-modal',
    });
  }

  private extractUniqueValues(data: SstmaObraReport[]): void {
    const obras = new Set<string>();
    const empresas = new Set<string>();
    const ambitos = new Set<string>();
    const riesgos = new Set<string>();

    data.forEach((item) => {
      if (item.reportData?.obra_text) obras.add(item.reportData.obra_text);
      if (item.reportData?.empresa_text) empresas.add(item.reportData.empresa_text);
      if (item.reportData?.ambito_text) ambitos.add(item.reportData.ambito_text);
      if (item.reportData?.riesgo_text) riesgos.add(item.reportData.riesgo_text);
    });

    this.obrasUnicas = Array.from(obras).sort();
    this.empresasUnicas = Array.from(empresas).sort();
    this.ambitosUnicos = Array.from(ambitos).sort();
    this.riesgosUnicos = Array.from(riesgos).sort();
  }

  private createFilter(): (data: SstmaObraReport, filter: string) => boolean {
    return (data: SstmaObraReport, filter: string): boolean => {
      const f = JSON.parse(filter) as FilterState;

      const obraMatch = !f.obra || (data.reportData?.obra_text?.toLowerCase().includes(f.obra.toLowerCase()) ?? false);
      const empresaMatch = !f.empresa || (data.reportData?.empresa_text?.toLowerCase().includes(f.empresa.toLowerCase()) ?? false);
      const ambitoMatch = !f.ambito || (data.reportData?.ambito_text?.toLowerCase().includes(f.ambito.toLowerCase()) ?? false);
      const riesgoMatch = !f.riesgo || (data.reportData?.riesgo_text?.toLowerCase().includes(f.riesgo.toLowerCase()) ?? false);

      let searchMatch = true;
      if (f.search) {
        const q = f.search.toLowerCase();
        const fields = [
          data.id,
          data.reportData?.obra_text,
          data.reportData?.empresa_text,
          data.reportData?.ambito_text,
          data.reportData?.riesgo_text,
          data.reportData?.reportadoPor,
          data.reportData?.area_trabajo,
          data.reportData?.condicion_detectada,
        ];
        searchMatch = fields.some((v) => v?.toString().toLowerCase().includes(q));
      }

      return obraMatch && empresaMatch && ambitoMatch && riesgoMatch && searchMatch;
    };
  }

  applyFilters(): void {
    const filterValue = JSON.stringify({
      obra: this.filterObra,
      empresa: this.filterEmpresa,
      ambito: this.filterAmbito,
      riesgo: this.filterRiesgo,
      search: this.filterSearch,
    } satisfies FilterState);

    this.dataSource.filter = filterValue;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters(): void {
    this.filterObra = '';
    this.filterEmpresa = '';
    this.filterAmbito = '';
    this.filterRiesgo = '';
    this.filterSearch = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.filterObra || this.filterEmpresa || this.filterAmbito || this.filterRiesgo || this.filterSearch);
  }

  exportToExcel(): void {
    const dataToExport = this.dataSource.filteredData;
    if (dataToExport.length === 0) return;

    const columns: ExportColumn[] = [
      { field: 'id', header: 'ID', width: 10 },
      { field: 'reportData.obra_text', header: 'Obra', width: 30 },
      { field: 'reportData.empresa_text', header: 'Empresa', width: 25 },
      { field: 'reportData.ambito_text', header: 'Ámbito', width: 20 },
      { field: 'reportData.riesgo_text', header: 'Riesgo', width: 20 },
      { field: 'reportData.potencial_gravedad_text', header: 'Potencial Gravedad', width: 20 },
      { field: 'reportData.area_trabajo', header: 'Área de Trabajo', width: 25 },
      { field: 'reportData.condicion_detectada', header: 'Condición Detectada', width: 40 },
      { field: 'reportData.reportadoPor', header: 'Reportado Por', width: 25 },
      { field: 'reportData.fecha_reporte', header: 'Fecha Reporte', width: 15, format: (v: string) => this.formatDate(v) },
      { field: 'created', header: 'Fecha Creación', width: 15, format: (v: string) => this.formatDate(v) },
    ];

    this.exportService.exportToExcel(dataToExport, columns, {
      fileName: 'Reporte_SSTMA_Obra',
      sheetName: 'Reportes SSTMA',
    });
  }

  // ---------------- KPIs derivados ----------------

  get kpiTotal(): number {
    return this.dataSource.data.length;
  }

  get kpiSeguridad(): number {
    return this.dataSource.data.filter((r) => /segur/i.test(r.reportData?.ambito_text ?? '')).length;
  }

  get kpiSalud(): number {
    return this.dataSource.data.filter((r) => /salud/i.test(r.reportData?.ambito_text ?? '')).length;
  }

  get kpiMedioAmbiente(): number {
    return this.dataSource.data.filter((r) => /(medio|ambient)/i.test(r.reportData?.ambito_text ?? '')).length;
  }

  get kpiCriticos(): number {
    return this.dataSource.data.filter((r) =>
      /(alto|crítico|critico|fatal|alta)/i.test(r.reportData?.potencial_gravedad_text ?? '') ||
      /(alto|crítico|critico|fatal|alta)/i.test(r.reportData?.riesgo_text ?? ''),
    ).length;
  }

  // ---------------- Pill variant mapping ----------------

  riesgoVariant(value: string | undefined | null): PillVariant {
    if (!value) return 'neutral';
    const v = value.toLowerCase();
    if (/(alto|crítico|critico|fatal|alta)/.test(v)) return 'danger';
    if (/(medio|moderado|media)/.test(v)) return 'warn';
    if (/(bajo|leve|baja)/.test(v)) return 'success';
    return 'neutral';
  }

  riesgoIcon(value: string | undefined | null): string {
    const variant = this.riesgoVariant(value);
    switch (variant) {
      case 'danger': return 'warning';
      case 'warn': return 'error';
      case 'success': return 'check_circle';
      default: return 'circle';
    }
  }

  empresaVariant(value: string | undefined | null): PillVariant {
    if (!value) return 'neutral';
    return /inarco/i.test(value) ? 'brand' : 'neutral';
  }
}
