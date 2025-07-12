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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CustomSelectComponent, SelectOption, ParameterType } from '../../../../../shared/controls/custom-select/custom-select.component';
import { ProxyService } from '../../../../../core/services/proxy.service';
import { ReportsTableComponent } from './components/reports-table/reports-table.component';
import { ArtModalComponent } from '../../../components/planification-table/components/art-modal/art-modal.component';
import { InspectionModalComponent } from '../../../components/inspection-modal/inspection-modal.component';

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
    MatSnackBarModule,
    CustomSelectComponent,
    ReportsTableComponent
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
  period: Date = new Date(); // Inicializar con la fecha actual
  selectedProjectId: string | null = null;
  errorMessage: string | null = null;
  
  // API configuration
  projectParameterType: ParameterType = ParameterType.OBRA;
  typeParameterType: ParameterType = ParameterType.CUSTOM_API;
  projectApiEndpoint = '/ws/ObrasSvcImpl.php';
  projectApiCaso = 'Consulta';
  projectApiRequestBody: any;
  projectOptionValueKey = 'IdObra';
  projectOptionLabelKey = 'Obra';

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

  constructor(
    private proxyService: ProxyService, 
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
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
    this.toggleFormVisibility();
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
              pdfUrl: `https://inarco-ssoma.favric.cl/reportes/incidente_${incident.IdIncidente}.pdf`
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

  cleanForm(): void {
    this.projectControl.reset();
    this.typeControl.reset();
    this.period = new Date(); // Restablecer a la fecha actual
  }

  /**
   * Muestra un mensaje en un snackbar
   */
  showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Validar formulario y crear reporte según el tipo seleccionado
   */
  createReport(): void {
    // Validar que todos los campos requeridos estén completos
    if (!this.selectedProjectId) {
      this.showMessage('Debe seleccionar un proyecto');
      return;
    }

    if (!this.typeControl.value) {
      this.showMessage('Debe seleccionar un tipo de reporte');
      return;
    }

    if (!this.period) {
      this.showMessage('Debe seleccionar un período');
      return;
    }

    // Log para depuración
    console.log('Creando reporte con los siguientes datos:');
    console.log('Proyecto ID:', this.selectedProjectId);
    console.log('Tipo:', this.typeControl.value, '- Label:', this.types[parseInt(this.typeControl.value as string)]);
    console.log('Periodo:', this.formatPeriod(this.period.toISOString()));

    // Determinar qué hacer según el tipo de reporte seleccionado
    const tipoSeleccionado = parseInt(this.typeControl.value as string);
    
    if (tipoSeleccionado === 0) { // 0 = ART
      // Abrir modal ART
      this.openArtModal();
    } else if (tipoSeleccionado === 1) { // 1 = INSPECCIÓN SSTMA
      // Abrir modal de Inspección SSTMA
      this.openInspectionModal();
    } else if (tipoSeleccionado === 2) { // 2 = REPORTE INCIDENTES
      // Implementar en el futuro
      this.showMessage('Funcionalidad de Reporte de Incidentes en desarrollo');
    }
  }

  /**
   * Abre el modal de ART con el proyecto seleccionado
   */
  openArtModal(): void {
    const dialogRef = this.dialog.open(ArtModalComponent, {
      width: '90vw',
      maxWidth: '100%',
      disableClose: true,
      autoFocus: false,
      data: { 
        projectId: this.selectedProjectId,
        artData: null
      }
    });

    // Registrar para depuración
    console.log('Abriendo modal de ART con projectId:', this.selectedProjectId);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('ART guardada:', result);
        this.showMessage('ART creada exitosamente');
        // Recargar la tabla de reportes si es necesario
        this.loadAppReports();
      }
    });
  }

  /**
   * Abre el modal de Inspección SSTMA con el proyecto seleccionado
   */
  openInspectionModal(): void {
    const dialogRef = this.dialog.open(InspectionModalComponent, {
      width: '90vw',
      maxWidth: '1400px',
      disableClose: true,
      autoFocus: false,
      data: { 
        projectId: this.selectedProjectId,
        inspectionData: null
      }
    });
    
    console.log('Abriendo modal de Inspección SSTMA con projectId:', this.selectedProjectId);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Inspección guardada:', result);
        this.showMessage('Inspección SSTMA creada exitosamente');
        // Recargar la tabla de reportes si es necesario
        this.loadAppReports();
      }
    });
  }
}
