import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ProxyService } from '../../../../../../../core/services/proxy.service';
import { MatCardModule } from '@angular/material/card';
import { environment } from '../../../../../../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { SstmaModalComponent } from '../../../../../components/sstma-modal/sstma-modal.component';
import { ReportModalComponent } from '../../../../../components/report-modal/report-modal.component';
import { ARTReportModalComponent } from '../../../../../components/art-report-modal/art-report-modal.component';
import { ChecklistReportModalComponent } from '../../../../../components/checklist-report-modal/checklist-report-modal.component';

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
  origen: string;
  idObra: string;
  Obra: string;
  fecha: string;
  creador: string;
  idControl: string;
  profesionalResponsable: string;
  ambitoInvolucrado: string;
}

@Component({
  selector: 'app-reports-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatOptionModule,
    MatCardModule,
  ],
  templateUrl: './reports-table.component.html',
  styleUrls: ['./reports-table.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ height: '0', opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1 }),
        animate('200ms ease-in', style({ height: '0', opacity: 0 }))
      ])
    ])
  ]
})
export class ReportsTableComponent implements OnInit {
  // Date format options
  private dateFormatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  searchControl = new FormControl('');
  filteredReports: any[] = [];
  // Controles para el filtro de período
  dateControl = new FormControl(new Date());
  period: number = this.getCurrentPeriod(); // Período actual en formato YYYYMM
  displayPeriod: string = ''; // Texto legible del período para mostrar
  
  // Dropdown filter controls
  showFilters = false;
  tipoFilter = new FormControl('');
  obraFilter = new FormControl('');
  responsableFilter = new FormControl('');
  
  // Unique values for dropdown filters
  tipoOptions: string[] = [];
  obraOptions: string[] = [];
  responsableOptions: string[] = [];

  reports: Report[] = [];
  isLoading = false;
  error: string | null = null;

  // Define columns to display in the table
  displayedColumns: string[] = [
    'tipo',
    'origen',
    'Obra',
    'fecha',
    'creador',
    'profesionalResponsable',
    'view'
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private proxyService: ProxyService,
    private dialog: MatDialog
  ) {
  }

  ngOnInit() {
    // Inicializar el displayPeriod con el período actual
    this.updateDisplayPeriod();
    this.loadReports();
  }

  /**
   * Obtiene el período actual en formato YYYYMM
   */
  getCurrentPeriod(): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() devuelve 0-11
    return year * 100 + month; // Formato YYYYMM (ej: 202507)
  }

  /**
   * Actualiza el texto legible del período
   */
  updateDisplayPeriod(): void {
    const year = Math.floor(this.period / 100);
    const month = this.period % 100;

    // Formatear el nombre del mes
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    // Validar que el mes esté entre 1 y 12
    if (month >= 1 && month <= 12) {
      this.displayPeriod = `${monthNames[month - 1]} ${year}`;
    } else {
      this.displayPeriod = `Período ${this.period}`;
    }
  }

  /**
   * Maneja el cambio en la fecha seleccionada
   */
  onDateChange(event: any): void {
    if (event.value) {
      const selectedDate = new Date(event.value);
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;

      // Actualizar el período en formato YYYYMM
      this.period = year * 100 + month;
      this.updateDisplayPeriod();
      console.log('Período seleccionado:', this.period);
    }
  }

  /**
   * Maneja la selección del mes en el datepicker
   */
  setMonthAndYear(normalizedMonthAndYear: Date, datepicker: any): void {
    const selectedDate = new Date(normalizedMonthAndYear);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    // Actualizar el período y la fecha seleccionada
    this.period = year * 100 + month;
    this.dateControl.setValue(selectedDate);
    this.updateDisplayPeriod();

    // Cerrar el datepicker
    datepicker.close();
    console.log('Mes y año seleccionados:', this.period);
  }

  /**
   * Loads reports from the API
   * @param forcePeriod Optional parameter to force a specific period
   */
  loadReports(forcePeriod?: number) {
    this.isLoading = true;
    this.error = null;

    // Usar el período actual si no se fuerza uno específico
    const periodToUse = forcePeriod || this.period;

    console.log(
      `Cargando reportes para período: ${periodToUse} (${this.displayPeriod})`
    );

    const requestBody = {
      caso: 'ReportAll',
      periodo: String(periodToUse),
    };

    console.log('Cargando reportes con el siguiente periodo:', requestBody);

    this.proxyService
      .post<ReportResponse>(environment.apiBaseUrl + '/ws/ReporteSvcImpl.php', requestBody)
      .subscribe({
        next: (response: ReportResponse) => {
          if (response.success && response.data) {
            this.reports = response.data;
            this.updateFilterOptions(); // Update dropdown options
            this.applyFilters(); // Apply any existing filters
            console.log('Reportes cargados:', this.reports);
            console.log(`Se cargaron ${this.reports.length} reportes`);
          } else {
            this.reports = [];
            this.filteredReports = [];
            this.error =
              response.message ||
              'No se encontraron reportes para este período';
            console.warn('No se encontraron reportes:', response);
          }
          this.isLoading = false;
        },
        error: (err: any) => {
          this.reports = [];
          this.filteredReports = [];
          this.error = 'Error de conexión al servicio';
          this.isLoading = false;
          console.error('Error fetching reports:', err);
        },
      });
  }

  /**
   * Updates filter dropdown options with unique values from reports
   */
  updateFilterOptions(): void {
    if (!this.reports || this.reports.length === 0) return;
    
    // Extract unique values for each filter
    this.tipoOptions = [...new Set(this.reports.map(report => report.tipo).filter(Boolean))];
    this.obraOptions = [...new Set(this.reports.map(report => report.Obra).filter(Boolean))];
    this.responsableOptions = [...new Set(this.reports.map(report => report.profesionalResponsable).filter(Boolean))];
  }
  
  /**
   * Formats a date string to local format
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL');
    } catch (error) {
      return dateString;
    }
  }
  
  /**
   * Applies all active filters (search text and dropdowns)
   */
  applyFilters(): void {
    if (!this.reports) {
      this.filteredReports = [];
      return;
    }
    
    // Get filter values
    const searchTerm = (this.searchControl.value || '').toLowerCase().trim();
    const tipoValue = this.tipoFilter.value;
    const obraValue = this.obraFilter.value;
    const responsableValue = this.responsableFilter.value;
    
    // Apply filters
    this.filteredReports = this.reports.filter(report => {
      // Text search filter
      const matchesSearch = !searchTerm || [
        report.tipo,
        report.idActividad,
        report.Obra,
        report.creador,
        report.profesionalResponsable,
        report.ambitoInvolucrado,
        this.formatDate(report.fecha)
      ].some(fieldValue => 
        fieldValue && String(fieldValue).toLowerCase().includes(searchTerm)
      );
      
      // Dropdown filters
      const matchesTipo = !tipoValue || report.tipo === tipoValue;
      const matchesObra = !obraValue || report.Obra === obraValue;
      const matchesResponsable = !responsableValue || report.profesionalResponsable === responsableValue;
      
      // All filters must match
      return matchesSearch && matchesTipo && matchesObra && matchesResponsable;
    });
  }
  
  /**
   * Clears the text search filter
   */
  clearSearch(): void {
    this.searchControl.setValue('');
    this.applyFilters();
  }
  
  /**
   * Clears all filters (search and dropdowns)
   */
  clearAllFilters(): void {
    this.searchControl.setValue('');
    this.tipoFilter.setValue('');
    this.obraFilter.setValue('');
    this.responsableFilter.setValue('');
    this.applyFilters();
  }
  
  /**
   * Toggles the visibility of the dropdown filters
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }
  
  /**
   * View report details
   */
  viewReport(report: Report): void {
    console.log('View report:', report);
    let idActivity = report.idActividad;
    let idControl = report.idControl;
    if(report.tipo.toUpperCase().includes('INCIDENTE')){
      this.dialog.open(ReportModalComponent, {
        data: idActivity
      });
    }else{
      if(report.tipo.toUpperCase().includes('SSTMA') || report.tipo.toUpperCase().includes('SSOMA')){
        this.dialog.open(SstmaModalComponent, {
          data: idActivity
        });
      }else{
        if(report.tipo.toUpperCase().includes('ART')){
          this.dialog.open(ARTReportModalComponent, {
            data: idActivity
          });
        }else{
          if(report.tipo.toUpperCase().includes('CHECKLIST') || report.tipo.toUpperCase().includes('CHECK LIST')){
            // Extraer el día de la fecha (formato: "2025-09-23 00:00:00")
            const day = new Date(report.fecha).getDate();
            
            this.dialog.open(ChecklistReportModalComponent, {
              data: { "idControl": idControl, "day": day }
            });
          }
        }
      }
    }
  }

  /**
   * Delete a report
   */
  deleteReport(report: Report): void {
    // Confirm before deleting
    const confirmation = window.confirm(
      `¿Está seguro que desea eliminar este reporte: ${report.tipo} - ${report.idActividad}?`
    );

    if (confirmation) {
      console.log('Delete report:', report);
      // Here you would call the API to delete the report
      // For now, we'll just show a message
      window.alert(`Reporte eliminado: ${report.tipo} - ${report.idActividad}`);

      // After successful deletion, reload the reports list
      this.loadReports();
    }
  }
}
