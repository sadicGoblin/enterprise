import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

// Para localización española del datepicker
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEs, 'es');

import { ReportService, HistoricalReportItem } from '../../../../../core/services/report.service';
import { finalize, catchError, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

import { ReportConfigService } from './services/report-config.service';
import { ReportConfig } from './models/report-config.model';

import { HistoryTableComponent } from './history-table/history-table.component';
import { HistoryMetricsComponent } from './history-metrics/history-metrics.component';

import { MessageComponent, MessageType } from '../../../../../shared/components/message/message.component';
import { ExportSelectorComponent, ExportableItem } from '../../../../../shared/components/export-selector/export-selector.component';
import { ExportService, ExportColumn } from '../../../../../shared/services/export.service';

import { BtnComponent, KpiTileComponent, PillComponent } from '../../../../../shared/ui';

type DateShortcut = 'today' | '7d' | '30d' | 'month' | 'quarter' | 'year';

interface KpiPlaceholder {
  eyebrow?: string;
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}

@Component({
  selector: 'app-history-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatSelectModule,
    MatTooltipModule,
    HistoryTableComponent,
    HistoryMetricsComponent,
    MessageComponent,
    ExportSelectorComponent,
    BtnComponent,
    PillComponent,
    KpiTileComponent,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: { dateInput: 'DD/MM/YYYY' },
        display: {
          dateInput: 'DD/MM/YYYY',
          monthYearLabel: 'MMMM YYYY',
          dateA11yLabel: 'DD/MM/YYYY',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ],
  templateUrl: './history-report.component.html',
  styleUrls: ['./history-report.component.scss'],
})
export class HistoryReportComponent implements OnInit, OnDestroy {
  historyForm!: FormGroup;
  isLoading = false;
  isRetrying = false;
  private destroy$ = new Subject<void>();

  reportTypeOptions = [
    { value: 'custom-plans', label: 'Plan personalizado' },
    { value: 'repincidents', label: 'Reporte de incidente' },
    { value: 'inspsttma', label: 'Inspección SSTMA' },
  ];

  dateShortcuts: Array<{ key: DateShortcut; label: string }> = [
    { key: 'today', label: 'Hoy' },
    { key: '7d', label: '7d' },
    { key: '30d', label: '30d' },
    { key: 'month', label: 'Mes' },
    { key: 'quarter', label: 'Trimestre' },
    { key: 'year', label: 'Año' },
  ];
  selectedShortcut: DateShortcut | null = null;

  errorMessage = '';
  technicalDetails = '';
  messageType: MessageType = MessageType.INFO;
  showMessage = false;

  reportConfig?: ReportConfig;
  readonly reportIndexName = 'custom-plans';

  tableData: HistoricalReportItem[] = [];

  // TODO: derivar de tableData o de un endpoint dedicado.
  kpis: KpiPlaceholder[] = [
    { eyebrow: 'Reportes', label: 'Generados este mes', value: '—', icon: 'description', highlight: true },
    { label: 'Plan Personalizado', value: '—', icon: 'event_available' },
    { label: 'Inspecciones', value: '—', icon: 'checklist' },
    { label: 'Rango activo', value: '—', icon: 'date_range' },
  ];

  isExportCartOpen = false;
  exportCartCount = 0;
  exportableItems: ExportableItem[] = [];
  selectedElementsForExport = new Set<string>();
  selectedElementsOrder: string[] = [];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private reportService: ReportService,
    private dateAdapter: DateAdapter<Date>,
    private reportConfigService: ReportConfigService,
    private exportService: ExportService,
  ) {}

  ngOnInit(): void {
    this.dateAdapter.setLocale('es-ES');
    this.initForm();

    this.reportService.isRetrying$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isRetrying) => {
        this.isRetrying = isRetrying;
      });

    if (!this.reportConfig) {
      console.warn(`No se encontró configuración para el reporte: ${this.reportIndexName}`);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(1);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);

    this.historyForm = this.fb.group({
      reportType: [this.reportIndexName, Validators.required],
      startDate: [startDate, Validators.required],
      endDate: [endDate, Validators.required],
    });

    this.historyForm.get('reportType')?.valueChanges.subscribe((reportType) => {
      this.onReportTypeChange(reportType);
    });

    // Cambios manuales en fechas resetean el highlight del atajo activo.
    this.historyForm.get('startDate')?.valueChanges.subscribe(() => {
      this.selectedShortcut = null;
    });
    this.historyForm.get('endDate')?.valueChanges.subscribe(() => {
      this.selectedShortcut = null;
    });
  }

  onReportTypeChange(reportType: string): void {
    this.reportConfigService.setReportType(reportType);
    this.reportConfig = this.reportConfigService.getReportConfig();
    this.tableData = [];
  }

  applyDateShortcut(key: DateShortcut): void {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);

    switch (key) {
      case 'today':
        break;
      case '7d':
        start.setDate(start.getDate() - 6);
        break;
      case '30d':
        start.setDate(start.getDate() - 29);
        break;
      case 'month':
        start.setDate(1);
        break;
      case 'quarter': {
        const q = Math.floor(end.getMonth() / 3);
        start.setMonth(q * 3, 1);
        break;
      }
      case 'year':
        start.setMonth(0, 1);
        break;
    }

    this.historyForm.patchValue({ startDate: start, endDate: end }, { emitEvent: false });
    this.selectedShortcut = key;
  }

  /**
   * Exporta los datos actualmente cargados en la vista previa a Excel.
   * Usa las columnas declaradas en reportConfig.columnsExport cuando existen,
   * o todas las propiedades del primer registro como fallback.
   */
  exportPreviewToExcel(): void {
    if (!this.tableData || this.tableData.length === 0) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 2500 });
      return;
    }

    const columnsConfig = this.reportConfig?.columnsExport ?? [];
    const sample = this.tableData[0] as unknown as Record<string, unknown>;
    const allKeys = Object.keys(sample).filter((k) => !k.startsWith('_'));
    const cols = columnsConfig.length > 0 ? columnsConfig : allKeys;

    const exportColumns: ExportColumn[] = cols.map((field) => ({
      field,
      header: field.charAt(0).toUpperCase() + field.slice(1),
      width: 20,
    }));

    const reportLabel = this.getSelectedReportTypeLabel() || 'Reporte';
    const today = new Date().toISOString().split('T')[0];
    const fileName = `Reporte_${reportLabel.replace(/\s+/g, '_')}_${today}`;

    this.exportService.exportToExcel(this.tableData, exportColumns, {
      fileName,
      sheetName: reportLabel.substring(0, 30),
    });
  }

  loadHistoricalReport(): void {
    if (!this.historyForm.valid) {
      this.markFormGroupTouched(this.historyForm);
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    const selectedReportType = this.historyForm.get('reportType')?.value;

    if (this.reportConfigService.getCurrentReportType() !== selectedReportType) {
      this.reportConfigService.setReportType(selectedReportType);
      this.reportConfig = this.reportConfigService.getReportConfig();
    }

    this.isLoading = true;
    this.showMessage = false;
    this.errorMessage = '';
    this.technicalDetails = '';
    const formValues = this.historyForm.value;

    const startDateStr = this.reportService.formatDateForApi(formValues.startDate);
    const endDateStr = this.reportService.formatDateForApi(formValues.endDate);

    const reportIndexToUse = selectedReportType || this.reportIndexName;

    this.reportService.getHistoricalReport(reportIndexToUse, startDateStr, endDateStr)
      .pipe(
        catchError((error) => {
          if (error.status === 0) {
            this.errorMessage = 'Error de conexión: No se puede establecer comunicación con el servidor.';
          } else if (error.status === 504 || error.status === 408) {
            this.errorMessage = 'Tiempo de espera agotado: El servidor tardó demasiado en responder.';
          } else if (error.status === 500) {
            this.errorMessage = 'Error interno del servidor: Ha ocurrido un problema procesando su solicitud.';
          } else if (error.status === 403) {
            this.errorMessage = 'Acceso denegado: No tiene permisos para acceder a este recurso.';
          } else if (error.status === 404) {
            this.errorMessage = 'Recurso no encontrado: El reporte solicitado no está disponible en el servidor.';
          } else if (error.status === 200) {
            this.errorMessage = 'Error al procesar la respuesta: El servidor devolvió datos en un formato inesperado.';
          } else {
            this.errorMessage = `Error al cargar el reporte: ${error.message || 'Error desconocido'}`;
          }

          this.technicalDetails = `Error completo: ${error.message}\n`;
          this.technicalDetails += `Código de estado: ${error.status || 'N/A'}\n`;
          if (error.stack) {
            this.technicalDetails += `\nStack trace:\n${error.stack}`;
          }

          this.messageType = MessageType.ERROR;
          this.showMessage = true;
          console.error('Error fetching historical report:', error);

          return of({ count: 0, data: [], from_cache: false });
        }),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe((response) => {
        if (response.data.length === 0) {
          this.errorMessage = 'No se encontraron registros para el período seleccionado';
          this.messageType = MessageType.WARNING;
          this.showMessage = true;
        } else {
          this.snackBar.open(`Se encontraron ${response.count} registros`, 'Cerrar', { duration: 3000 });
        }
        this.tableData = response.data;
      });
  }

  onGenerate(): void {
    this.tableData = [];
    this.showMessage = false;
    this.errorMessage = '';
    this.technicalDetails = '';
    this.loadHistoricalReport();
  }

  resetForm(): void {
    this.initForm();
    this.tableData = [];
    this.selectedShortcut = null;
    this.snackBar.open('Formulario reiniciado', 'Cerrar', { duration: 2000 });
  }

  getSelectedReportTypeLabel(): string {
    const value = this.historyForm?.get('reportType')?.value;
    return this.reportTypeOptions.find((o) => o.value === value)?.label ?? '';
  }

  get recordCount(): number {
    return this.tableData?.length ?? 0;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  toggleExportCart(): void {
    this.isExportCartOpen = !this.isExportCartOpen;
  }

  closeExportCart(): void {
    this.isExportCartOpen = false;
  }

  getSelectedElements(): string[] {
    return Array.from(this.selectedElementsForExport);
  }

  onExportModeChange(exportMode: boolean): void {
    console.log('Export mode changed:', exportMode);
  }

  onSelectionChange(selectedItemIds: string[]): void {
    this.selectedElementsForExport.clear();
    selectedItemIds.forEach((id) => this.selectedElementsForExport.add(id));
    this.exportCartCount = selectedItemIds.length;
  }

  onExportRequested(selectedItemIds: string[]): void {
    this.snackBar.open(`Exportando ${selectedItemIds.length} elementos...`, 'Cerrar', { duration: 3000 });
  }

  onOrderChange(newOrder: string[]): void {
    this.selectedElementsOrder = [...newOrder];
  }
}
