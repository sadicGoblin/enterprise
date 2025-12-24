import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

// Para localización española del datepicker
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEs, 'es');

import { ReportService, HistoricalReportItem } from '../../../../../core/services/report.service';
import { finalize, catchError, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

// Importamos la configuración y su servicio
import { ReportConfigService } from './services/report-config.service';
import { ReportConfig } from './models/report-config.model';

// Importamos los componentes de tabla y métricas
import { HistoryTableComponent } from './history-table/history-table.component';
import { HistoryMetricsComponent } from './history-metrics/history-metrics.component';

// Importamos el componente de mensajes
import { MessageComponent, MessageType } from '../../../../../shared/components/message/message.component';

// Importamos el componente de exportación
import { ExportSelectorComponent, ExportableItem } from '../../../../../shared/components/export-selector/export-selector.component';

@Component({
  selector: 'app-history-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatBadgeModule,
    MatSelectModule,
    MatTooltipModule,
    HistoryTableComponent,
    HistoryMetricsComponent,
    MessageComponent,
    ExportSelectorComponent
  ],
  providers: [
    // Configuración para el datepicker en español
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { provide: MAT_DATE_FORMATS, useValue: {
      parse: {
        dateInput: 'DD/MM/YYYY',
      },
      display: {
        dateInput: 'DD/MM/YYYY',
        monthYearLabel: 'MMMM YYYY',
        dateA11yLabel: 'DD/MM/YYYY',
        monthYearA11yLabel: 'MMMM YYYY',
      },
    }}
  ],
  templateUrl: './history-report.component.html',
  styleUrls: ['./history-report.component.scss']
})
export class HistoryReportComponent implements OnInit, OnDestroy {
  historyForm!: FormGroup;
  isLoading: boolean = false;
  isRetrying: boolean = false;
  private destroy$ = new Subject<void>();
  
  // Pestaña actualmente seleccionada
  selectedTab = 0;
  
  // Opciones para el tipo de reporte
  reportTypeOptions = [
    { value: 'custom-plans', label: 'PLAN PERSONALIZADO' },
    { value: 'repincidents', label: 'REPORTE DE INCIDENTE' },
    { value: 'inspsttma', label: 'INSPECCIÓN STTMA' }
  ];
  
  // Propiedades para el sistema de mensajes
  errorMessage = '';
  technicalDetails = '';
  messageType: MessageType = MessageType.INFO;
  showMessage = false;
  
  isFilterExpanded = true; // Control para expandir/colapsar el filtro
  selectedDateRange = false; // Indica si hay un rango de fechas seleccionado
  
  // Configuración del reporte actual
  reportConfig?: ReportConfig;
  readonly reportIndexName = 'custom-plans';
  
  // Datos para la tabla
  tableData: HistoricalReportItem[] = [];
  
  // Propiedades del carrito de exportación
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
    private reportConfigService: ReportConfigService
  ) { }

  ngOnInit(): void {
    // Configurar el adaptador de fechas para usar formato español
    this.dateAdapter.setLocale('es-ES');
    this.initForm();
    
    // Suscribirse al estado de reintento del servicio
    this.reportService.isRetrying$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isRetrying => {
        this.isRetrying = isRetrying;
      });
    
    // Cargar la configuración del reporte
    // this.reportConfig = this.reportConfigService.getReportConfig(this.reportIndexName);
    
    if (!this.reportConfig) {
      console.warn(`No se encontró configuración para el reporte: ${this.reportIndexName}`);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    // Fecha desde: primer día del mes de hace 2 meses
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(1); // Primer día del mes
    
    // Fecha hasta: día de ayer
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Ayer
    
    // Valor por defecto para el tipo de reporte
    const defaultReportType = this.reportIndexName;
    
    this.historyForm = this.fb.group({
      reportType: [defaultReportType, Validators.required],
      startDate: [startDate, Validators.required],
      endDate: [endDate, Validators.required]
    });
    
    // Primero nos suscribimos a los cambios en el tipo de reporte
    // para capturar cambios futuros
    this.historyForm.get('reportType')?.valueChanges.subscribe(reportType => {
      console.log(`Report type changed to1: ${reportType}`);
      this.onReportTypeChange(reportType);
    });
    
    // Llamamos explícitamente a onReportTypeChange con el valor por defecto
    // para asegurar que se active la configuración correcta desde el inicio
    // this.onReportTypeChange(defaultReportType);
  }
  
  /**
   * Handle changes in report type selection
   * @param reportType The selected report type
   */
  onReportTypeChange(reportType: string): void {
    console.log(`Report type changed to2: ${reportType}`);
    
    // Update the configuration service with the new report type
    this.reportConfigService.setReportType(reportType);
    
    // Get the configuration for the selected report type
    this.reportConfig = this.reportConfigService.getReportConfig();
    
    // Reset table data when report type changes
    this.tableData = [];
  }
  // Los métodos de filtrado ahora están en el componente HistoryTableComponent

  // Comentarios eliminados

  /**
   * Obtiene el reporte histórico de la API
   */
  loadHistoricalReport(): void {
    if (!this.historyForm.valid) {
      this.markFormGroupTouched(this.historyForm);
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', {
        duration: 3000
      });
      return;
    }
    
    // Get the currently selected report type
    const selectedReportType = this.historyForm.get('reportType')?.value;
    
    // Update configuration in service if needed
    if (this.reportConfigService.getCurrentReportType() !== selectedReportType) {
      this.reportConfigService.setReportType(selectedReportType);
      this.reportConfig = this.reportConfigService.getReportConfig();
    }

    // Reseteamos el estado del mensaje y comenzamos la carga
    this.isLoading = true;
    this.showMessage = false;
    this.errorMessage = '';
    this.technicalDetails = '';
    const formValues = this.historyForm.value;
    
    // Formatear fechas para la API
    const startDateStr = this.reportService.formatDateForApi(formValues.startDate);
    const endDateStr = this.reportService.formatDateForApi(formValues.endDate);

    // Determinar qué índice de reporte usar basado en la selección del usuario
    const reportIndexToUse = selectedReportType || this.reportIndexName;
    console.log(`Loading report data for index: ${reportIndexToUse} with config:`, this.reportConfig);
    
    // Comenzamos la llamada al API
    this.reportService.getHistoricalReport(
      reportIndexToUse,
      startDateStr,
      endDateStr
    )
      .pipe(
        catchError(error => {
          // Configuramos el mensaje principal para el usuario
          if (error.status === 0) {
            this.errorMessage = 'Error de conexión: No se puede establecer comunicación con el servidor.';
          } else if (error.status === 504 || error.status === 408) {
            this.errorMessage = `Tiempo de espera agotado: El servidor tardó demasiado en responder.`;
          } else if (error.status === 500) {
            this.errorMessage = 'Error interno del servidor: Ha ocurrido un problema procesando su solicitud.';
          } else if (error.status === 403) {
            this.errorMessage = 'Acceso denegado: No tiene permisos para acceder a este recurso.';
          } else if (error.status === 404) {
            this.errorMessage = 'Recurso no encontrado: El reporte solicitado no está disponible en el servidor.';
          } else if (error.status === 200) {
            // Error específico de parsing con estado 200
            this.errorMessage = 'Error al procesar la respuesta: El servidor devolvió datos en un formato inesperado.';
          } else {
            // Para otros errores, usamos un mensaje simplificado
            this.errorMessage = `Error al cargar el reporte: ${error.message || 'Error desconocido'}`;
          }
          
          // Guardamos los detalles técnicos completos para mostrarlos en el área expandible
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
        finalize(() => this.isLoading = false)
      )
      .subscribe(response => {
        // console.log('Response General Data:', response);
        if (response.data.length === 0) {
          // Mostramos un mensaje de advertencia si no hay datos
          this.errorMessage = 'No se encontraron registros para el período seleccionado';
          this.messageType = MessageType.WARNING;
          this.showMessage = true;
        } else {
          this.snackBar.open(`Se encontraron ${response.count} registros`, 'Cerrar', {
            duration: 3000
          });
        }
        
        // Actualizamos los datos para el componente de tabla
        this.tableData = response.data;
      });
  }

  onSubmit(): void {
    // Limpiar datos anteriores
    this.tableData = [];
    this.showMessage = false;
    this.errorMessage = '';
    this.technicalDetails = '';
    
    // Cargar nuevos datos
    this.loadHistoricalReport();
    
    // Colapsar el formulario y mostrar el rango de fechas seleccionado
    this.isFilterExpanded = false;
    this.selectedDateRange = true;
  }

  resetForm(): void {
    // Inicializar el formulario nuevamente con los valores por defecto
    this.initForm();
    
    // Limpiar datos de la tabla
    this.tableData = [];
    
    // Si estaba colapsado, expandir el formulario
    this.isFilterExpanded = true;
    this.selectedDateRange = false;
    
    this.snackBar.open('Formulario reiniciado', 'Cerrar', {
      duration: 2000
    });
  }

  // Método para alternar la visibilidad del filtro
  toggleFilterVisibility(): void {
    this.isFilterExpanded = !this.isFilterExpanded;
    
    // Si se expande el filtro y no hay datos, resetear el indicador de rango seleccionado
    if (this.isFilterExpanded && this.tableData.length === 0) {
      this.selectedDateRange = false;
    }
  }
  
  // Get the label text for the selected report type
  getSelectedReportTypeLabel(): string {
    const selectedValue = this.historyForm?.get('reportType')?.value;
    if (!selectedValue) return '';
    
    const selectedOption = this.reportTypeOptions.find(option => option.value === selectedValue);
    return selectedOption ? selectedOption.label : '';
  }

  // Formatea la fecha para mostrarla con formato compacto
  formatDateForDisplay(date: Date): string {
    if (!date) return '';
    
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    
    // Nombres de los meses abreviados en español (3 letras) con primera letra mayúscula
    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    const mes = meses[d.getMonth()];
    
    return `${day} ${mes} ${year}`;
  }

  // Helper method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  // Métodos del carrito de exportación
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
    // Handle export mode change if needed
    console.log('Export mode changed:', exportMode);
  }
  
  onSelectionChange(selectedItemIds: string[]): void {
    this.selectedElementsForExport.clear();
    selectedItemIds.forEach(id => this.selectedElementsForExport.add(id));
    this.exportCartCount = selectedItemIds.length;
  }
  
  onExportRequested(selectedItemIds: string[]): void {
    console.log('Export requested for items:', selectedItemIds);
    // TODO: Implement actual export logic
    this.snackBar.open(`Exportando ${selectedItemIds.length} elementos...`, 'Cerrar', {
      duration: 3000
    });
  }
  
  onOrderChange(newOrder: string[]): void {
    this.selectedElementsOrder = [...newOrder];
    console.log('Order changed:', newOrder);
  }
}
