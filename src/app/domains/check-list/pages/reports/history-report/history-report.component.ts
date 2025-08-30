import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

// Para localización española del datepicker
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEs, 'es');

import { ReportService, HistoricalReportItem } from '../../../../../core/services/report.service';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Importamos los componentes de tabla y métricas
import { HistoryTableComponent } from './history-table/history-table.component';
import { HistoryMetricsComponent } from './history-metrics/history-metrics.component';

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
    HistoryTableComponent,
    HistoryMetricsComponent
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
export class HistoryReportComponent implements OnInit {
  historyForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  isFilterExpanded = true; // Control para expandir/colapsar el filtro
  selectedDateRange = false; // Indica si hay un rango de fechas seleccionado
  
  // Datos para la tabla
  tableData: HistoricalReportItem[] = [];
  
  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private reportService: ReportService,
    private dateAdapter: DateAdapter<Date>
  ) { }

  ngOnInit(): void {
    // Configurar el adaptador de fechas para usar formato español
    this.dateAdapter.setLocale('es-ES');
    this.initForm();
  }

  initForm(): void {
    // Fecha desde: primer día del mes de hace 2 meses
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 0);
    startDate.setDate(1); // Primer día del mes
    
    // Fecha hasta: día de ayer
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Ayer
    
    this.historyForm = this.fb.group({
      startDate: [startDate, Validators.required],
      endDate: [endDate, Validators.required]
    });
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

    this.isLoading = true;
    this.errorMessage = '';
    const formValues = this.historyForm.value;
    
    // Formatear fechas para la API
    const startDateStr = this.reportService.formatDateForApi(formValues.startDate);
    const endDateStr = this.reportService.formatDateForApi(formValues.endDate);

    this.reportService.getHistoricalReport(startDateStr, endDateStr)
      .pipe(
        catchError(error => {
          this.errorMessage = 'Error al cargar el reporte: ' + (error.message || 'Desconocido');
          console.error('Error fetching historical report:', error);
          
          return of({ count: 0, data: [], from_cache: false });
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe(response => {
        if (response.data.length === 0) {
          this.snackBar.open('No se encontraron registros para el período seleccionado', 'Cerrar', {
            duration: 3000
          });
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
  
  // Formatea la fecha para mostrarla con nombre de mes en español
  formatDateForDisplay(date: Date): string {
    if (!date) return '';
    
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    
    // Nombres de los meses en español
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const mes = meses[d.getMonth()];
    
    return `${day} de ${mes} de ${year}`;
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
}
