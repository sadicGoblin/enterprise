import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CustomSelectComponent, SelectOption, ParameterType } from '../../../../../shared/controls/custom-select/custom-select.component';
import { ProxyService } from '../../../../../core/services/proxy.service';

// Definir formato de fecha personalizado para solo mes/año
export const MY_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

// Interfaces para los datos de incidentes
interface IncidenteResponse {
  codigo: number;
  glosa: string;
  data: Incidente[];
}

interface Incidente {
  IdIncidente: string;
  IdObra: string;
  Obra: string;
  Nombre: string;
  FechaIncidente: string;
  Periodo: string;
}

interface ReporteIncidente {
  id: string;
  project: string;
  name: string;
  period: string;
  pdfUrl?: string;
}

@Component({
  selector: 'app-add-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    CustomSelectComponent
  ],
  templateUrl: './add-reports.component.html',
  styleUrl: './add-reports.component.scss',
  providers: [
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS}
  ]
})

export class AddReportsComponent implements OnInit {
  isLoading: boolean = false;
  loadingAppReports: boolean = false;
  isFormVisible: boolean = false;
  projectControl = new FormControl('');
  typeControl = new FormControl('');
  period: Date | null = null;
  selectedProjectId: string | null = null;
  errorMessage: string | null = null;
  
  // API configuration
  projectParameterType: ParameterType = ParameterType.OBRA;
  typeParameterType: ParameterType = ParameterType.CUSTOM_API;
  projectApiEndpoint = '/ws/ObrasSvcImpl.php';
  projectApiCaso = 'ObrasFiltro';
  projectApiRequestBody: any;
  projectOptionValue = 'IdObra';
  projectOptionLabel = 'NombreObra';

  // Options for dropdowns
  projects = [];
  types = ['ART', 'INSPECCIÓN SSTMA', 'REPORTE INCIDENTES'];
  typesOptions: SelectOption[] = [];

  displayedColumns = ['project', 'name', 'period', 'view'];

  tableData1 = [
    { project: 'Proyecto A', name: 'Juan Pérez', period: '2024-12' }
  ];
  tableData2: ReporteIncidente[] = []; // Datos que vendrán de la API
  tableData3 = [
    { project: 'Proyecto C', name: 'Luis Vega', period: '2025-02' }
  ];

  constructor(private proxyService: ProxyService, private dialog: MatDialog) {
    // Configurar las opciones del tipo de reporte
    this.typesOptions = this.types.map((type, index) => ({
      value: index.toString(),
      label: type
    }));
  }

  /**
   * Abre el visor de PDF
   * @param pdfUrl URL del PDF a visualizar
   */
  viewPdf(pdfUrl: string): void {
    window.open(pdfUrl, '_blank');
  }

  ngOnInit(): void {
    this.setupForm();
    this.loadAppReports();
  }

  /**
   * Maneja la selección de un mes en el datepicker y cierra el calendario
   * @param normalizedMonth Objeto Date con el mes seleccionado
   * @param datepicker Referencia al datepicker
   */
  closeMonthPicker(normalizedMonth: Date, datepicker: any): void {
    // Establece el día como 1 para normalizar la fecha al inicio del mes
    const selectedMonth = new Date(normalizedMonth.getFullYear(), normalizedMonth.getMonth(), 1);
    this.period = selectedMonth;
    datepicker.close();
  }

  /**
   * Configura el formulario
   */
  setupForm(): void {
    // Obtener el userId de localStorage
    let userId = 0; // ID de usuario por defecto
    if (typeof localStorage !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        const parsedUserId = parseInt(storedUserId, 10);
        if (!isNaN(parsedUserId)) {
          userId = parsedUserId;
        }
      }
    }

    // Para propósitos de prueba/desarrollo, si no hay userId en localStorage
    if (userId === 0) {
      console.log('No se encontró userId en localStorage, usando valor de prueba');
      userId = 478; // Valor de ejemplo proporcionado por el usuario
    }

    // Actualizar el request body con el userId obtenido
    this.projectApiRequestBody = {
      caso: this.projectApiCaso,
      idObra: 0, // For fetching all projects
      idUsuario: userId // Valor por defecto, se actualizará en ngOnInit
    };
  }

  /**
   * Carga los reportes de incidentes desde la API
   */
  loadAppReports(): void {
    this.loadingAppReports = true;
    this.errorMessage = null;

    const requestBody = {
      "caso": "ConsultasTodas"
    };

    this.proxyService.post<IncidenteResponse>('/ws/IncidentesSvcImpl.php', requestBody)
      .subscribe({
        next: (response: IncidenteResponse) => {
          if (response && response.data) {
            // Mapear los datos de la API al formato de la tabla
            this.tableData2 = response.data.map(incident => ({
              id: incident.IdIncidente,
              project: incident.Obra,
              name: incident.Nombre,
              period: this.formatPeriod(incident.Periodo || incident.FechaIncidente),
              pdfUrl: `http://raam-hosting.cl/apissoma/reportes/incidente_${incident.IdIncidente}.pdf`
            }));
          } else {
            this.tableData2 = [];
          }
          this.loadingAppReports = false;
        },
        error: (error) => {
          console.error('Error al cargar los incidentes:', error);
          this.errorMessage = 'No se pudieron cargar los reportes de incidentes. Por favor, intente nuevamente.';
          this.loadingAppReports = false;
          this.tableData2 = [];
        }
      });
  }

  /**
   * Formatea una fecha en formato de período (MM/YYYY)
   */
  formatPeriod(dateString: string): string {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Si es un período en formato MM/YYYY
        if (dateString.includes('/')) {
          return dateString;
        }
        return 'Fecha inválida';
      }

      // Formato MM/YYYY
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (e) {
      console.error('Error al formatear la fecha:', e);
      return dateString; // Devuelve la cadena original si hay error
    }
  }

  /**
   * Maneja el evento de selección de proyecto
   */
  onProjectSelectionChange(selectedOption: SelectOption | null): void {
    if (selectedOption && selectedOption.value) {
      this.selectedProjectId = String(selectedOption.value);
      console.log('Project selected:', this.selectedProjectId);
    } else {
      this.selectedProjectId = null;
      console.log('Project selection cleared');
    }
  }

  /**
   * Maneja el evento de selección de tipo
   */
  onTypeSelectionChange(selectedOption: SelectOption | null): void {
    if (selectedOption && selectedOption.value) {
      console.log('Type selected:', selectedOption.value);
    }
  }

  crearNuevoReporte(): void {
    // Mostrar el formulario de creación de reportes
    this.toggleFormVisibility();
  }

  toggleFormVisibility(): void {
    this.isFormVisible = !this.isFormVisible;
  }

  limpiarForm(): void {
    this.projectControl.reset();
    this.typeControl.reset();
    this.period = null;
  }

  buscarReportes(): void {
    console.log('Buscando reportes con los siguientes criterios:');
    console.log('Proyecto:', this.selectedProjectId);
    console.log('Tipo:', this.typeControl.value);
    console.log('Periodo:', this.period ? this.formatPeriod(this.period.toISOString()) : null);
    // Aquí irá la lógica para buscar reportes con los filtros seleccionados
    // Refresh app reports
    this.loadAppReports();
  }
}
