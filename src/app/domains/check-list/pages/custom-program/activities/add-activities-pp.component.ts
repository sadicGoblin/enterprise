import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { ProxyService } from '../../../../../core/services/proxy.service';
import { CustomSelectComponent, SelectOption } from '../../../../../shared/controls/custom-select/custom-select.component';
import { ParameterType } from '../../../../../shared/controls/custom-select/custom-select.component';
import { catchError } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UsuarioService } from '../../../services/usuario.service';
import { ControlService } from '../../../services/control.service';
// Componente usado programáticamente para mostrar diálogo de confirmación
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { CalendarDialogComponent } from '../../../../../shared/controls/multi-date-calendar/calendar-dialog.component';
import { CalendarSelectComponent } from '../../../../../shared/controls/multi-date-calendar/calendar-select.component';
import { environment } from '../../../../../../environments/environment';
import { ActividadService } from '../../../services/actividad.service';

// Interfaces para los diferentes tipos de objetos usados en el componente
interface ProjectApiRequestBody {
  caso: string;
  idObra: number;
  idUsuario: number | null;
  obra?: string | null;
  supervisor?: string | null;
}

interface StageOption {
  idEtapaConstructiva: number;
  nombre: string;
  [key: string]: any; // Para propiedades adicionales
}

interface SubprocessOption {
  idSubproceso: number;
  nombre: string;
  [key: string]: any; // Para propiedades adicionales
}

interface ActivityOption {
  idActividades: number;
  nombre: string;
  [key: string]: any; // Para propiedades adicionales
}

interface ScopeOption {
  IdAmbito: number;
  nombre: string;
  [key: string]: any; // Para propiedades adicionales
}

// Interface for construction stage API request body
interface StageApiRequestBody {
  caso: string;
  idEtapaConstructiva: number;
  idObra: number;
  codigo: number;
  nombre: string | null;
}

// Interface for scope (ámbito) API request body
interface ScopeApiRequestBody {
  caso: string;
  idAmbito: number;
  nombre: string | null;
  codigo: number;
}

// Interface for risk parameter API request body
interface RiskParameterApiRequestBody {
  caso: string;
  idEnt: number;
}

// Interface for subprocess API request body
interface SubprocessApiRequestBody {
  caso: string;
  idEtapaConstructiva: number;
  idSubProceso: number;
  codigo: number;
  nombre: string | null;
}

// Interface for user API request body
interface UserApiRequestBody {
  caso: string;
  idObra: number;
}

// Interface for user data
interface User {
  IdUsuario: string;
  Usuario: string;
  nombre: string;
  IdCargo: string;
  EMail: string;
}

// Interface for activities API request body
interface ActivityApiRequestBody {
  caso: string;
  idActividades: number;
  idAmbito: number;
  codigo: number;
  nombre: string | null;
  idPeriocidad: number;
  idCategoriaActividad: number;
  idParametroAsociado: number;
  idBiblioteca: number;
}

@Component({
  selector: 'app-add-activities-pp',
  standalone: true,
  imports: [
    MatSnackBarModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    CalendarDialogComponent,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    ConfirmationDialogComponent,
    CustomSelectComponent,
    CalendarSelectComponent,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ],
  templateUrl: './add-activities-pp.component.html',
  styleUrls: ['./add-activities-pp.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddActivitiesPpComponent implements OnInit {
  // Parameter types enum for custom-select
  parameterTypes = ParameterType;

  // Properties for Project app-custom-select
  projectControl = new FormControl(null, [Validators.required]);
  projectSelectedId: string | null = null;
  projectApiEndpoint = '/ws/ObrasSvcImpl.php';
  projectApiCaso = 'Consulta';
  projectApiRequestBody: { [key: string]: string | number } = {
    idUsuario: localStorage.getItem('userId') || ''
  };
  projectOptionValue = 'IdObra';
  projectOptionLabel = 'Obra';
  projectParameterType = ParameterType.OBRA;

  // Properties for Stage select
  stageControl = new FormControl(null, [Validators.required]);
  stageSelectedId: string | null = null;
  stageApiEndpoint = '/ws/EtapaConstructivaSvcImpl.php';
  stageApiRequestBody: StageApiRequestBody = {
    caso: 'ConsultaEtapaConstructivaByObra',
    idEtapaConstructiva: 0,
    idObra: 0,
    codigo: 0,
    nombre: null
  };
  stageOptions: Array<StageOption> = [];
  loadingStages = false;

  // Properties for Scope (Ámbito) app-custom-select
  scopeControl = new FormControl(null, [Validators.required]);
  scopeSelectedId: string | null = null;
  scopeApiEndpoint = '/ws/AmbitosSvcImpl.php';
  scopeApiRequestBody: ScopeApiRequestBody = {
    caso: 'ConsultaAmbitos',
    idAmbito: 0,
    nombre: null,
    codigo: 0
  };
  scopeOptionValue = 'IdAmbito';
  scopeOptionLabel = 'nombre';
  scopeParameterType = ParameterType.OBRA; // Using OBRA type for custom API

  // Properties for Risk Parameter app-custom-select
  riskParameterControl = new FormControl(null, [Validators.required]);
  riskParameterSelectedId: string | null = null;
  riskParameterApiEndpoint = '/ws/SubParametrosSvcImpl.php';
  riskParameterApiRequestBody: RiskParameterApiRequestBody = {
    caso: 'SubParametroConsulta',
    idEnt: 206
  };
  riskParameterOptionValue = 'IdSubParam';
  riskParameterOptionLabel = 'Nombre';
  riskParameterType = ParameterType.OBRA; // Using OBRA type for custom API

  // Properties for subprocess multi-select
  subprocessOptions: any[] = [];
  // Definición explícita con tipado adecuado para evitar errores 'never'
  selectedSubprocesses: Array<SubprocessOption> = [];
  subprocessApiEndpoint = '/ws/EtapaConstructivaSvcImpl.php';
  subprocessApiRequestBody: SubprocessApiRequestBody = {
    caso: 'ConsultaSubProcesos',
    idEtapaConstructiva: 0, // Will be updated when stage is selected
    idSubProceso: 0,
    codigo: 0,
    nombre: null
  };
  loadingSubprocesses = false;

  // Bandera para indicar si se están cargando controles existentes
  loadingExistingControls = false;

  // Keep the original arrays for other dropdowns
  periods = ['may.-2025', 'jun.-2025'];
  // Lista de usuarios cargada desde la API
  users: User[] = [];
  loadingUsers = false;
  stages = ['OBRA GRUESA', 'TERMINACIONES'];
  periodicities = ['DIARIA', 'SEMANAL', 'MENSUAL'];
  categories = ['ALTA', 'MEDIA', 'BAJA'];
  parameters = ['CAÍDA MISMO NIVEL', 'CAÍDA DISTINTO NIVEL'];
  documents = ['PROCEDIMIENTO', 'INSTRUCTIVO', 'MANUAL'];

  // Properties for activity multi-select
  activityOptions: Array<ActivityOption> = [];
  activityItems: any[] = [];
  // Definición con tipado explícito para selectedActivities
  selectedActivities: Array<ActivityOption> = [];
  activityApiEndpoint = '/ws/AmbitosSvcImpl.php';
  activityApiRequestBody: ActivityApiRequestBody = {
    caso: 'ConsultaActividades',
    idActividades: 0,
    idAmbito: 0, // Will be updated when scope is selected
    codigo: 0,
    nombre: null,
    idPeriocidad: 0,
    idCategoriaActividad: 0,
    idParametroAsociado: 0,
    idBiblioteca: 0
  };
  loadingActivities = false;

  // Date picker for period
  selectedDate = new Date();
  spanishMonths = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  selectedPeriod = '';
  selectedUser = '';
  selectedPeriodicity = 'MENSUAL';
  selectedCategory = '';
  selectedParameter = '';
  selectedDocument = '';

  userId: number | null = null;

  constructor(
    private proxyService: ProxyService,
    private usuarioService: UsuarioService,
    private controlService: ControlService,
    private actividadService: ActividadService,
    private dateAdapter: DateAdapter<Date>,
    @Inject(MAT_DATE_LOCALE) private _locale: string,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Set locale to Spanish
    this.dateAdapter.setLocale('es');

    // Initialize period with current date in Spanish format
    this.formatSelectedDate();
  }

  /**
   * Format the selected date as Spanish month and year (e.g., "junio 2025")
   */
  formatSelectedDate(): void {
    const month = this.selectedDate.getMonth();
    const year = this.selectedDate.getFullYear();
    this.selectedPeriod = `${this.spanishMonths[month]} ${year}`;
  }

  /**
   * Handle date change from the datepicker
   */
  onDateChange(): void {
    this.formatSelectedDate();

    // Verificar si tenemos los datos mínimos necesarios para cargar controles existentes
    // Solo necesitamos obra, colaborador y fecha (etapa no es obligatoria)
    if (this.projectSelectedId && this.selectedUser && this.selectedDate) {
      console.log('Fecha cambió - recargando controles existentes automáticamente...');
      this.loadExistingControls();
    } else {
      console.log('Fecha cambió pero faltan datos para recargar:', {
        proyecto: !!this.projectSelectedId,
        colaborador: !!this.selectedUser,
        fecha: !!this.selectedDate
      });
    }
  }

  /**
   * Establece solo mes y año seleccionado en el datepicker y cierra el picker
   */
  setMonthAndYear(date: Date, datepicker: any): void {
    // Establecer el día 1 para tener una fecha válida del mes seleccionado
    const selectedDate = new Date(date.getFullYear(), date.getMonth(), 1);
    this.selectedDate = selectedDate;
    this.formatSelectedDate();
    datepicker.close();
    
    // Disparar el evento de cambio de fecha automáticamente
    this.onDateChange();
  }

  /**
   * Búsqueda manual de actividades - permite recargar datos sin necesidad de cambiar colaborador
   */
  buscarActividades(): void {
    if (!this.projectSelectedId) {
      this.snackBar.open('Seleccione una obra primero', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['warning-snackbar']
      });
      return;
    }

    if (!this.selectedUser) {
      this.snackBar.open('Seleccione un colaborador primero', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['warning-snackbar']
      });
      return;
    }

    if (!this.selectedDate) {
      this.snackBar.open('Seleccione un período primero', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['warning-snackbar']
      });
      return;
    }

    console.log('Búsqueda manual iniciada - cargando controles existentes...');
    this.loadExistingControls();

    this.snackBar.open('Buscando actividades...', 'Cerrar', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['info-snackbar']
    });
  }

  ngOnInit(): void {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        this.userId = parsedData.userId;
        // console.log('User ID from localStorage:', this.userId);
      } else {
        // console.warn('No userData found in localStorage');
      }
    } catch (error) {
      console.error('Error parsing userData from localStorage:', error);
    }

    

    // Initialize project API request body with the current user ID (matching activity-planning)
    const userId = localStorage.getItem('userId') || '';
    this.projectApiRequestBody = {
      "caso": "Consulta",
      "idObra": 0,
      "idUsuario": userId || ''
    };
  }

  /**
   * Handles project selection change from custom select component
   */
  onProjectSelectionChange(selectedProject: any): void {
    // console.log('Project selection changed to:', selectedProject);

    if (selectedProject) {
      this.projectSelectedId = selectedProject.value;

      // Reset all form fields except project
      this.resetFormFieldsExceptProject();

      // Load stages for the selected project
      // console.log('Loading stages for project 0:', this.projectSelectedId);
      this.loadStages();

      // Load users for the selected project
      this.loadUsersForProject(Number(this.projectSelectedId));
    } else {
      this.projectSelectedId = null;
      this.stageOptions = [];
      this.users = [];
      
      // Limpiar la tabla de actividades
      this.tableData = [];
    }
  }
  
  /**
   * Resetea todos los campos del formulario excepto el proyecto seleccionado
   */
  resetFormFieldsExceptProject(): void {
    // Resetear controles de formulario
    this.stageControl.reset();
    this.scopeControl.reset();
    this.riskParameterControl.reset();
    
    // Resetear IDs seleccionados
    this.stageSelectedId = null;
    this.scopeSelectedId = null;
    this.riskParameterSelectedId = null;
    
    // Resetear selecciones
    this.selectedSubprocesses = [];
    this.selectedActivities = [];
    this.selectedUser = '';
    this.selectedPeriodicity = 'MENSUAL'; // Valor por defecto
    this.selectedCategory = '';
    this.selectedParameter = '';
    this.selectedDocument = '';
    
    // Resetear opciones cargadas
    this.subprocessOptions = [];
    this.activityOptions = [];
    
    // Limpiar la tabla de actividades al cambiar de proyecto
    this.tableData = [];
  }

  /**
   * Handles stage selection change from custom select component
   */
  onStageSelectionChange(selectedStageId: any): void {
    // console.log('Stage selection changed to:', selectedStageId);

    if (selectedStageId) {
      this.stageSelectedId = selectedStageId.toString();

      // Reset current subprocess selections
      this.selectedSubprocesses = [];

      // Load subprocesses for the selected stage
      this.loadSubprocesses();
    } else {
      console.log('Stage selection cleared');
      this.stageSelectedId = null;

      // Clear subprocesses when stage is cleared
      this.subprocessOptions = [];
      this.selectedSubprocesses = [];
    }
  }

  /**
   * Handles scope (ámbito) selection change from custom select component
   */
  /**
   * Maneja el cambio de selección del ámbito desde el componente custom-select
   * @param selectedScope La opción seleccionada del componente custom-select
   */
  onScopeSelectionChange(selectedScope: SelectOption | null): void {
    // console.log('onScopeSelectionChange recibió:', selectedScope);

    if (selectedScope && selectedScope.value) {
      // Convertir el valor a string para asegurar compatibilidad
      this.scopeSelectedId = String(selectedScope.value);
      // console.log('Ámbito seleccionado:', this.scopeSelectedId, typeof this.scopeSelectedId);

      // Verificar si el valor es un objeto y extraer el ID correcto si es necesario
      if (typeof selectedScope.value === 'object' && selectedScope.value !== null) {
        if ('IdAmbito' in selectedScope.value) {
          this.scopeSelectedId = String(selectedScope.value.IdAmbito);
        }
      }

      // Update activity API request body with the selected scope ID
      this.activityApiRequestBody = {
        ...this.activityApiRequestBody,
        idAmbito: Number(this.scopeSelectedId)
      };

      // Reset current activity selections
      this.selectedActivities = [];

      // Load activities for the selected scope
      this.loadActivities();
    } else {
      // console.log('Se limpió la selección de ámbito');
      this.scopeSelectedId = null;

      // Clear activities when scope is cleared
      this.activityOptions = [];
      this.selectedActivities = [];
    }
  }

  /**
   * Handles risk parameter selection change from custom select component
   */
  onRiskParameterSelectionChange(selectedRiskParameter: SelectOption | null): void {
    if (selectedRiskParameter && selectedRiskParameter.value) {
      this.riskParameterSelectedId = String(selectedRiskParameter.value);
      // console.log('Risk parameter selected:', this.riskParameterSelectedId);
    } else {
      // console.log('Risk parameter selection cleared');
      this.riskParameterSelectedId = null;
    }
  }

  /**
   * Loads construction stages based on the selected project
   */
  loadStages(): void {
    // console.log('Loading stages for project:', this.projectSelectedId);
    if (!this.projectSelectedId) {
      this.stageOptions = [];
      return;
    }
    // console.log('Loading stages for project2:', this.projectSelectedId);

    this.loadingStages = true;

    this.stageApiRequestBody.idObra = Number(this.projectSelectedId);
    console.log('Loading stages for service2:', this.stageApiRequestBody);

    this.proxyService.post(environment.apiBaseUrl + this.stageApiEndpoint, this.stageApiRequestBody)
      .pipe(
        catchError(error => {
          console.error('Error loading stages:', error);
          this.loadingStages = false;
          return of({ success: false, data: [] });
        })
      )
      .subscribe((response: any) => {
        this.loadingStages = false;

        if (response && response.success && response.data) {
          // order alphabetically by name
          let result = response.data;
          console.log('Stages loaded:', result);
          result.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
          this.stageOptions = result;
          // console.log('Stages loaded:', this.stageOptions);
        } else {
          this.stageOptions = [];
          // console.warn('No stages data available or request failed');
        }
      });
  }

  /**
   * Load users for the selected project from the API
   * @param projectId The ID of the selected project
   */
  loadUsersForProject(projectId: number): void {
    if (!projectId) return;

    this.loadingUsers = true;

    // Prepare the request body
    const requestBody: UserApiRequestBody = {
      caso: 'ConsultaUsuariosObra',
      idObra: projectId
    };

    // Call the API to get users for the selected project
    this.proxyService.post(environment.apiBaseUrl + '/ws/UsuarioSvcImpl.php', requestBody)
      .pipe(
        catchError(error => {
          console.error('Error loading users:', error);
          this.loadingUsers = false;
          return of({ success: false, data: [] });
        })
      )
      .subscribe((response: any) => {
        this.loadingUsers = false;
        console.log('Respuesta completa de colaboradores:', response);

        if (response && response.success && response.data) {
          this.users = response.data as User[];
          // console.log('Users loaded:', this.users);
        } else {
          this.users = [];
          console.warn('No users found or error in response:', response);
        }
      });
  }

  /**
   * Loads subprocesses based on the selected construction stage
   */
  loadSubprocesses(): void {
    if (!this.stageSelectedId) {
      return;
    }

    this.loadingSubprocesses = true;
    this.subprocessApiRequestBody.idEtapaConstructiva = Number(this.stageSelectedId);
    // console.log('Loading subprocesses for stage:', this.subprocessApiEndpoint, this.subprocessApiRequestBody);
    this.proxyService.post(environment.apiBaseUrl + this.subprocessApiEndpoint, this.subprocessApiRequestBody)
      .pipe(
        catchError(error => {
          console.error('Error loading subprocesses:', error);
          this.loadingSubprocesses = false;
          return of({ success: false, data: [] });
        })
      )
      .subscribe((response: any) => {
        this.loadingSubprocesses = false;

        if (response && response.success && response.data) {
          this.subprocessOptions = response.data;
         // console.log('Subprocesses loaded:', this.subprocessOptions);
        } else {
          this.subprocessOptions = [];
          console.warn('No subprocesses data available or request failed');
        }
      });
  }

  /**
   * Loads activities based on the selected scope
   */
  loadActivities(): void {
    if (!this.scopeSelectedId) {
      return;
    }

    this.loadingActivities = true;

    this.proxyService.post(environment.apiBaseUrl + this.activityApiEndpoint, this.activityApiRequestBody)
      .pipe(
        catchError(error => {
          console.error('Error loading activities:', error);
          this.loadingActivities = false;
          return of({ success: false, data: [] });
        })
      )
      .subscribe((response: any) => {
        this.loadingActivities = false;

        if (response && response.success && response.data) {
          this.activityOptions = response.data;
          this.activityItems = response.data;
         // console.log('Activities loaded:', this.activityOptions);
        } else {
          this.activityOptions = [];
          console.warn('No activities data available or request failed');
        }
      });
  }

  /**
   * Toggles selection of a subprocess
   */
  toggleSubprocessSelection(subprocess: SubprocessOption): void {
    // Verificar primero si ya está seleccionado
    if (this.isSubprocessSelected(subprocess)) {
      // Si ya está seleccionado, lo quitamos
      this.selectedSubprocesses = this.selectedSubprocesses.filter((sp: SubprocessOption) => sp.idSubproceso !== subprocess.idSubproceso);
    } else {
      // Si no está seleccionado, lo añadimos
      this.selectedSubprocesses.push(subprocess);
    }
    // console.log('Selected subprocesses:', this.selectedSubprocesses);
  }

  /**
   * Checks if a subprocess is selected
   */
  isSubprocessSelected(subprocess: any): boolean {
    return this.selectedSubprocesses.some((sp: any) => sp.idSubproceso === subprocess.idSubproceso);
  }

  /**
   * Función para comparar objetos de subproceso en selección múltiple
   * Necesaria para que ngModel funcione correctamente con objetos
   */
  compareSubprocesses(sp1: SubprocessOption, sp2: SubprocessOption): boolean {
    return sp1 && sp2 ? sp1.idSubproceso === sp2.idSubproceso : sp1 === sp2;
  }

  /**
   * Toggles selection of an activity
   */
  toggleActivitySelection(activity: ActivityOption): void {
    // Verificar primero si ya está seleccionado
    if (this.isActivitySelected(activity)) {
      // Si ya está seleccionado, lo quitamos
      this.selectedActivities = this.selectedActivities.filter((act: ActivityOption) => act.idActividades !== activity.idActividades);
    } else {
      // Si no está seleccionado, lo añadimos
      this.selectedActivities.push(activity);
    }

    // console.log('Selected activities:', this.selectedActivities);
  }

  /**
   * Checks if an activity is selected
   */
  isActivitySelected(activity: ActivityOption): boolean {
    // Usar 'as any' para evitar errores de tipo 'never'
    return this.selectedActivities.some((act: any) => act.idActividades === activity.idActividades);
  }

  // Columnas a mostrar en la tabla
  displayedColumns: string[] = [
    'expand',
    'project',
    'assignee',
    'period',
    'stage',
    'subprocess',
    'scope',
    'name',
    'days',
    'periodicity',
    'delete'
  ];

  // Propiedades para manejar expansión de filas
  expandedElements = new Set<number>();
  planificationData: { [controlId: number]: any[] } = {};
  loadingPlanification: { [controlId: number]: boolean } = {};

  /**
   * Aplica estilo a filas alternadas
   * @param index índice de la fila
   * @param row datos de la fila
   */
  getRowStyle(index: number): object {
    return {
      'background-color': index % 2 === 0 ? 'white' : '#fafafa',
      'height': '52px',
      'transition': 'background-color 0.2s ease'
    };
  }

  // Array para almacenar los datos de la tabla con tipado explícito para evitar errores
  tableData: Array<{
    id: number;
    project: string | number;
    user?: string | number;
    period?: string | number;
    stage: string | number;
    subprocess: string;
    scope: string | number;
    name: string;
    days: string; // Campo para los días/íconos
    selectedDays?: Date[]; // Almacena las fechas seleccionadas como objetos Date
    periodicity: string;
    category: string;
    parameter: string | number | null;
    document: string;
    activities: Array<ActivityOption>;
    subprocesses?: Array<SubprocessOption>;
    // Campos adicionales para editar/recargar la actividad
  }> = [];

  /**
   * Agrega actividades seleccionadas a la tabla y muestra dialogo de confirmación
   */
  addActivity(): void {
    // Validar que se hayan seleccionado los campos requeridos
    console.log('Validando campos requeridos...');
    console.log('projectSelectedId:', this.projectSelectedId, typeof this.projectSelectedId);
    console.log('stageSelectedId:', this.stageSelectedId, typeof this.stageSelectedId);
    console.log('scopeSelectedId:', this.scopeSelectedId, typeof this.scopeSelectedId);
    console.log('selectedSubprocesses:', this.selectedSubprocesses.length, this.selectedSubprocesses);
    console.log('selectedActivities:', this.selectedActivities.length, this.selectedActivities);

    // Verificar el valor actual del control de ámbito
    console.log('scopeControl.value:', this.scopeControl.value);

    // Si el scopeSelectedId es null pero el control tiene un valor, intentar extraerlo
    if (!this.scopeSelectedId && this.scopeControl.value) {
      const scopeValue = this.scopeControl;
      console.log('Intentando recuperar ámbito desde scopeControl.value:', scopeValue);

      if (typeof scopeValue === 'object' && scopeValue !== null) {
        // Intentar extraer el ID del ámbito del objeto
        if ('value' in scopeValue) {
          this.scopeSelectedId = String(scopeValue.value);
          console.log('Ámbito recuperado de value:', this.scopeSelectedId);
        } else if ('IdAmbito' in scopeValue) {
          this.scopeSelectedId = String(scopeValue['']);
          console.log('Ámbito recuperado de IdAmbito:', this.scopeSelectedId);
        }
      } else if (typeof scopeValue === 'string' || typeof scopeValue === 'number') {
        this.scopeSelectedId = String(scopeValue);
        console.log('Ámbito recuperado directamente:', this.scopeSelectedId);
      }
    }

    if (!this.projectSelectedId || !this.stageSelectedId || !this.scopeSelectedId ||
      this.selectedSubprocesses.length === 0 || this.selectedActivities.length === 0) {
      console.error('Error: Faltan campos requeridos');
      this.snackBar.open('Faltan campos requeridos', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
      if (!this.scopeSelectedId) {
        console.error('El ámbito (scope) no está seleccionado. Por favor, seleccione un ámbito.');

      }
      // Mostrar mensaje de error al usuario
      return;
    }

    // Crear un nuevo ID único para cada fila de la tabla
    const newId = Date.now();

    // Preparar los items para la tabla antes de mostrar el diálogo
    const tableItems = this.selectedActivities.map(actividad => {
      // Crear objeto para la tabla con validaciones de tipo
      const tableItem: {
        id: number;
        project: string | number;
        stage: string | number;
        subprocess: string;
        scope: string | number;
        scopeName: string; // Campo para mostrar el nombre del ámbito
        name: string;
        days: string; // Campo para los íconos de días
        selectedDays?: Date[]; // Almacena las fechas seleccionadas como objetos Date
        periodicity: string;
        category: string;
        parameter: string | number | null;
        document: string;
        activities: Array<any>;
        user: string | number;
        period: string;
        subprocesses: Array<any>;
      } = {
        id: newId,
        project: this.projectSelectedId || '',
        stage: this.stageSelectedId || '',
        subprocess: (() => {
          if (this.selectedSubprocesses.length === 0) return '';
          return this.selectedSubprocesses
            .map(sp => typeof sp === 'object' && sp !== null && 'nombre' in sp ? sp.nombre : '')
            .join(', ');
        })(),
        scope: this.scopeSelectedId || '',
        // Para el scopeName usamos un valor más simple por ahora
        scopeName: 'SEGURIDAD', // Valor estático para las nuevas filas agregadas
        name: (() => {
          // Usar 'any' temporalmente para acceder a la propiedad nombre
          const act = actividad as any;

          if ('nombre' in act && act.nombre !== undefined) {
            return String(act.nombre);
          }
          return '';
        })(),
        periodicity: this.selectedPeriodicity || '',
        category: this.selectedCategory || '',
        parameter: this.riskParameterSelectedId || '',
        document: this.selectedDocument || '',
        // Campo para mostrar íconos de días en la tabla
        days: '15',  // Valor por defecto para los íconos de calendario
        selectedDays: [],
        // También almacenar los valores reales para recuperarlos después
        activities: [actividad] as any[],
        // Campos adicionales para recuperación
        user: this.selectedUser || 0,
        period: this.selectedPeriod || '',
        subprocesses: [...this.selectedSubprocesses] as any[]
      };

      return tableItem;
    });

    // Preparar información para el diálogo con tipado explícito y validaciones
    const stageText = `ETAPA CONSTRUCTIVA: ${this.stageSelectedId ?
      (() => {
        const foundStage = this.stageOptions.find((s: StageOption) => s.idEtapaConstructiva?.toString() === this.stageSelectedId);
        return foundStage && typeof foundStage.nombre === 'string' ? foundStage.nombre : 'No especificado';
      })() :
      'No especificada'}`;

    // Obtener subprocesos únicos con tipado seguro
    const subprocessNames = this.selectedSubprocesses.length > 0 ?
      this.selectedSubprocesses.map((sp: any) => {
        if (sp && typeof sp === 'object' && 'nombre' in sp) {
          return typeof sp.nombre === 'string' ? sp.nombre : '';
        }
        return '';
      }) : [];

    const subprocessText = `SUB PROCESO:${subprocessNames.length > 0 ?
      '\n-' + subprocessNames.join('\n-') :
      '\n-No especificado'}`;

    // Obtener ámbito con validación de tipo
    const scopeText = `AMBITO: ${(() => {
      if (!this.scopeControl.value) return 'No especificado';
      const scopeValue = this.scopeControl.value as any;
      if (scopeValue && typeof scopeValue === 'object' && 'nombre' in scopeValue) {
        return typeof scopeValue.nombre === 'string' ? scopeValue.nombre : 'No especificado';
      }
      return 'No especificado';
    })()}`;

    // Obtener actividades con tipado seguro
    const activityNames = this.selectedActivities.length > 0 ?
      this.selectedActivities.map((act: any) => {
        if (act && typeof act === 'object' && 'nombre' in act) {
          return typeof act.nombre === 'string' ? act.nombre : '';
        }
        return '';
      }) : [];

    const activitiesText = `ACTIVIDADES:${activityNames.length > 0 ?
      '\n-' + activityNames.join('\n-') :
      '\n-No hay actividades seleccionadas'}`;

    // Abrir diálogo de confirmación
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmación',
        options: [
          stageText,
          subprocessText,
          scopeText,
          activitiesText
        ],
        question: 'DESEA CREAR LAS ACTIVIDADES?'
      }
    });

    dialogRef.afterClosed().subscribe((result: string) => {
      if (result === 'SÍ') {
        // Proceder con el guardado
        // Extraer el periodo en formato YYYYMM a partir de la fecha seleccionada
          const periodoFormateado = this.selectedDate ?
            (this.selectedDate.getFullYear() * 100 + (this.selectedDate.getMonth() + 1)) :
            202506;

          this.loadingExistingControls = true; // Activar loader

            // Contador para un seguimiento más claro
            let totalControles = 0;
            const totalCombinaciones = this.selectedSubprocesses.length * this.selectedActivities.length;
            const controlObservables: Array<Observable<any>> = [];

            // Bucle anidado: para cada subproceso, crear controles para todas las actividades
            this.selectedSubprocesses.forEach((subproceso: SubprocessOption) => {
              this.selectedActivities.forEach((actividad: { idActividades?: number; nombre: string }) => {
                totalControles++;

                const actividadSeleccionada = this.activityItems.find((activity) => activity.idActividades === actividad.idActividades);
                // Crear objeto de control con la combinación actual de subproceso y actividad
                const controlBody = {
                  "caso": "Crea",
                  "IdControl": 0,
                  "idObra": this.projectSelectedId ? Number(this.projectSelectedId) : 0,
                  "obra": null,
                  "idUsuario": this.selectedUser ? Number(this.selectedUser) : 0,
                  "usuario": null,
                  "periodo": periodoFormateado,
                  "idEtapaConst": this.stageSelectedId ? Number(this.stageSelectedId) : 0,
                  "etapaConst": null,
                  "idSubProceso": subproceso?.idSubproceso ? Number(subproceso.idSubproceso) : 0,
                  "subProceso": null,
                  "idAmbito": this.scopeSelectedId ? Number(this.scopeSelectedId) : 0,
                  "ambito": null,
                  "idActividad": actividad.idActividades ? Number(actividad.idActividades) : 0,
                  "actividad": null,
                  "idPeriocidad": actividadSeleccionada.idPeriocidad ? Number(actividadSeleccionada.idPeriocidad) : 0,
                  "periocidad": null,
                  "idCategoria": this.selectedCategory ?
                    (this.selectedCategory === 'ALTA' ? 2 :
                      this.selectedCategory === 'MEDIA' ? 1 : 
                        this.selectedCategory === 'BAJA' ? 0 : 0) : 0,
                  "idParam": 0,
                  "dias": null,
                  "fechaControl": "0001-01-01T00:00:00"
                };

                // Mostrar información en consola
                // console.log(`Control ${totalControles}/${totalCombinaciones}: Subproceso [${subproceso.nombre} (${subproceso.idSubproceso})] + Actividad [${actividad.nombre} (${actividad.idActividades})]`);

                // Recolectar observables
                controlObservables.push(this.controlService.createControl(controlBody).pipe(
                  catchError(error => {
                    console.error(`Error al enviar la solicitud para control ${totalControles}/${totalCombinaciones}:`, error);
                    return of(null); // Retornar un observable que emita null en caso de error
                  })
                ));
              });
            });

            // Usar forkJoin para esperar a que todas las llamadas se completen
            forkJoin(controlObservables).subscribe({
              next: (responses: any[]) => {
                console.log('Todas las llamadas al servicio de control han finalizado:', responses);
                // Agregar los items a la tabla solo una vez después de que todas las llamadas hayan terminado
                tableItems.forEach(item => {
                  this.tableData.push(item);
                });
                // Cargar los controles existentes después de guardar una sola vez
                console.log('Recargando controles existentes después de guardar...');
                this.loadExistingControls();
                this.loadingExistingControls = false; // Desactivar loader
              },
              error: (error: any) => {
                console.error('Error en alguna de las llamadas al servicio de control:', error);
                this.loadingExistingControls = false; // Desactivar loader en caso de error
              }
            });

      } else {
        // Si el usuario cancela, no hacer nada
        console.log('Operación cancelada por el usuario');
      }
    });
  }

  /**
   * Resetea los campos del formulario con opción de preservar el proyecto seleccionado
   * @param preserveProject Si es true, mantiene el proyecto seleccionado
   */
  resetFields(preserveProject: boolean = false): void {
    // Guardar el proyecto actual si se va a preservar
    const currentProjectId = preserveProject ? this.projectSelectedId : null;
    const currentProjectControl = preserveProject ? this.projectControl.value : null;

    // Resetear controles de formulario
    this.projectControl.reset();
    this.stageControl.reset();
    this.scopeControl.reset();
    this.riskParameterControl.reset();

    // Resetear IDs seleccionados
    this.projectSelectedId = null;
    this.stageSelectedId = null;
    this.scopeSelectedId = null;
    this.riskParameterSelectedId = null;

    // Resetear arrays de selección
    this.selectedSubprocesses = [];
    this.selectedActivities = [];
    this.subprocessOptions = [];
    this.activityOptions = [];
    this.activityItems = [];

    // Resetear dropdowns
    this.selectedPeriodicity = '';
    this.selectedCategory = '';
    this.selectedParameter = '';
    this.selectedDocument = '';
    this.selectedUser = '';

    // Resetear tabla y estados de carga
    if (!preserveProject) {
      this.tableData = [];
    }
    this.loadingActivities = false;
    this.loadingSubprocesses = false;

    // Si se debe preservar el proyecto, restaurar sus valores
    if (preserveProject && currentProjectId && currentProjectControl) {
      this.projectSelectedId = currentProjectId;
      this.projectControl.setValue(currentProjectControl);
      console.log('Campos reseteados, manteniendo proyecto:', currentProjectId);
    } else {
      console.log('Todos los campos reseteados, incluido proyecto');
    }
  }


  /**
   * Maneja el cambio de selección de usuario
   * @param event El evento de cambio de selección
   */
  onUserSelectionChange(event: any): void {
    this.selectedUser = event?.value;
    console.log('Usuario seleccionado:', this.selectedUser);

    // Si tenemos obra, etapa, usuario y periodo seleccionados, cargamos los controles existentes
    this.loadExistingControls();
  }

  /**
   * Carga los controles existentes para la combinación de obra, usuario y periodo
   */
  loadExistingControls(): void {
    console.log('loadExistingControls: Cargando controles existentes...');
    // Validar que tengamos los datos necesarios
    if (!this.projectSelectedId || !this.selectedUser || !this.selectedDate) {
      console.warn('Faltan datos necesarios para cargar controles existentes');
      return;
    }

    // Extraer el periodo en formato YYYYMM a partir de la fecha seleccionada
    const periodoFormateado = this.selectedDate ?
      (this.selectedDate.getFullYear() * 100 + (this.selectedDate.getMonth() + 1)) :
      202507;

    // Preparar parámetros para la consulta
    const queryParams = {
      caso: "Consulta",
      idObra: Number(this.projectSelectedId),
      idUsuario: Number(this.selectedUser),
      periodo: periodoFormateado
    };

    console.log('Consultando controles existentes con parámetros:', queryParams);
    this.loadingExistingControls = true;

    // Llamar al servicio para obtener los controles existentes
    this.controlService.getControls(queryParams).subscribe({
      next: (response: any) => {
        this.loadingExistingControls = false;

        if (response && response.success && response.data && Array.isArray(response.data)) {
          console.log(`Se encontraron ${response.data.length} controles existentes:`, response.data);

          // Convertir los datos recibidos al formato de la tabla
          this.tableData = response.data.map((control: any) => {
            return {
              id: Number(control.IdControl),
              project: control.Obra, // Usar directamente el nombre para mostrar
              projectId: control.IdObra,
              user: control.Usuario, // Usar directamente el nombre para mostrar
              userId: control.IdUsuario,
              period: control.Periodo,
              stage: control.EtapaConst, // Usar directamente el nombre para mostrar
              stageId: control.IdEtapaConst,
              subprocess: control.SubProceso,
              subprocessId: control.IdSubProceso,
              scope: control.Ambito, // Usar directamente el nombre para mostrar
              scopeId: control.IdAmbito,
              name: control.Actividad,
              activityId: control.IdActividad,
              // Campo para días seleccionados
              days: control.dias || '',  
              selectedDays: control.dias ? this.parseDaysString(control.dias, control.Periodo) : [],
              periodicity: control.Periocidad,
              periodicityId: control.IdPeriocidad,
              category: control.idCategoria,
              parameter: control.idParam,
              // Campos necesarios para el componente
              activities: [{
                idActividades: Number(control.IdActividad),
                nombre: control.Actividad
              }],
              subprocesses: [{
                idSubProceso: Number(control.IdSubProceso),
                nombre: control.SubProceso
              }],
              assignee: control.Usuario // Agregar campo para mostrar en la columna "Asignado"
            };
          });

          console.log('Tabla actualizada con controles existentes:', this.tableData);
          
          // Precargar datos de planificación para cada control (para detectar días cumplidos)
          this.preloadPlanificationData();
        } else {
          console.warn('No se encontraron controles o la respuesta no tiene el formato esperado');
        }
      },
      error: (error: any) => {
        this.loadingExistingControls = false;
        console.error('Error al cargar controles existentes:', error);
      }
    });
  }

  /**
   * Precarga los datos de planificación para todos los controles de la tabla
   * Esto permite detectar días cumplidos antes de abrir el calendario
   */
  private preloadPlanificationData(): void {
    if (!this.tableData || this.tableData.length === 0) return;
    
    console.log('Precargando datos de planificación para', this.tableData.length, 'controles...');
    
    this.tableData.forEach((element: any) => {
      const controlId = element.id;
      const period = element.period;
      
      // Solo cargar si no existe ya
      if (!this.planificationData[controlId] && period) {
        this.loadPlanificationData(controlId, period.toString());
      }
    });
  }

  /**
   * Genera el texto para el tooltip que muestra los días seleccionados
   * @param element Elemento con los días seleccionados
   * @returns Texto para el tooltip
   */
  getDaysTooltip(element: any): string {
    if (!element.selectedDays || element.selectedDays.length === 0) {
      return 'Seleccionar días';
    }

    // Ordenar las fechas cronológicamente
    const sortedDates = [...element.selectedDays].sort((a, b) => a.getTime() - b.getTime());

    // Formatear cada fecha como dd/MM y unirlas
    const formattedDates = sortedDates.map(date => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    });

    // Devolver lista de días seleccionados
    return `Días seleccionados: ${formattedDates.join(', ')}`;
  }

  /**
   * Abre el diálogo del calendario para seleccionar días
   * @param element Fila de la tabla seleccionada
   */
  activeCalendarControl: number | null = null;

  openCalendarDialog(element: any): void {
    // Establecer este control como activo para resaltarlo
    this.activeCalendarControl = element.id;

    // Convertir los días como string a números para defaultDays
    const defaultDays = element.days ?
      element.days.split(',').map((d: string) => parseInt(d.trim(), 10)) : [];

    const dialogRef = this.dialog.open(CalendarDialogComponent, {
      width: '400px',
      data: {
        selectedDates: [],  // Inicializar siempre con array vacío para que no haya días seleccionados por defecto
        defaultDays: [],    // Inicializar con array vacío para no tener días predeterminados
        rowData: element,
        controlId: element.id
      },
      panelClass: 'calendar-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      // Limpiamos la marca de control activo
      this.activeCalendarControl = null;
      console.log('Selected dates (AddActivitiesPpComponent):', result);

      if (result) {
        // Actualizamos los datos localmente
        const control = this.tableData.find(c => c.id === result.controlId);
        if (control) {
          control.selectedDays = result.selectedDates;
          control.days = this.formatDaysToString(result.selectedDates);
          // Actualizar los días en la base de datos
          this.updateControlDays(control.id, control.days);
        }
      }
    });
  }

  /**
   * Maneja la selección de fechas desde el componente calendar-select
   * @param dates Las fechas seleccionadas
   * @param element El elemento de la tabla que contiene el control
   */
  onCalendarDatesSelected(dates: Date[], element: any): void {
    // Actualizamos los datos localmente
    const control = this.tableData.find(c => c.id === element.id);
    if (control) {
      control.selectedDays = dates;
      control.days = this.formatDaysToString(dates);
      // Actualizar los días en la base de datos
      this.updateControlDays(control.id, control.days);
    }
  }

  /**
   * Convierte un array de objetos Date a un string formato '1,5,10,15,20'
   */
  formatDaysToString(dates: Date[]): string {
    if (!dates || dates.length === 0) return '';

    // Extraer solo los días del mes y ordenarlos
    return dates
      .map(date => date.getDate())
      .sort((a, b) => a - b)
      .join('-');
  }

  /**
   * Convierte un string de días '1-5-10' a objetos Date
   * @param daysString String con los días separados por guiones (ej: '1-5-10')
   * @param period Período en formato YYYYMM (ej: '202512' para Diciembre 2025)
   */
  parseDaysString(daysString: string, period?: string): Date[] {
    if (!daysString) return [];

    let year: number;
    let month: number;

    if (period && period.length === 6) {
      // Parsear período en formato YYYYMM
      year = parseInt(period.substring(0, 4), 10);
      month = parseInt(period.substring(4, 6), 10) - 1; // Restar 1 porque JavaScript usa meses 0-indexed
    } else {
      // Fallback a fecha actual si no hay período
      const currentDate = new Date();
      year = currentDate.getFullYear();
      month = currentDate.getMonth();
    }

    return daysString.split('-').map(day => {
      const dayNumber = parseInt(day.trim(), 10);
      if (isNaN(dayNumber)) return null;

      return new Date(year, month, dayNumber);
    }).filter(date => date !== null) as Date[];
  }

  /**
   * Actualiza los días seleccionados en la base de datos
   */
  updateControlDays(controlId: number, daysString: string): void {
    console.log(`Actualizando días para control ID ${controlId}: ${daysString}`);

   // Reemplazar comas por guiones
    daysString = daysString.replaceAll(',', '-');

     // Preparar el body para la llamada al servicio
    const updateBody = {
      "caso": "ActualizaDias",
      "idControl": controlId,
      "dias": daysString
    };

    // Llamar al servicio para actualizar los días en la base de datos
    this.controlService.updateControlDays(updateBody).subscribe({
      next: (response) => {
        console.log('Días actualizados correctamente:', response);
        this.snackBar.open('Días actualizados correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });

        // Recargar los datos de planificación si la fila está expandida
        this.refreshPlanificationDataIfExpanded(controlId);
      },
      error: (error) => {
        console.error('Error al actualizar días:', error);
        this.snackBar.open('Error al actualizar días', 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
    });

    // La tabla se actualiza automáticamente porque estamos modificando
    // directamente el objeto element que ya está en el array tableData
    console.log('Datos actualizados en la tabla:', this.tableData);
  }

  /**
   * Recarga los datos de planificación si la fila está expandida
   */
  refreshPlanificationDataIfExpanded(controlId: number): void {
    if (this.expandedElements.has(controlId)) {
      console.log(`Recargando datos de planificación para control ${controlId} (fila expandida)`);
      
      // Encontrar el elemento de la tabla para obtener el período
      const tableElement = this.tableData.find(item => item.id === controlId);
      
      if (tableElement && tableElement.period) {
        // Limpiar los datos cacheados
        delete this.planificationData[controlId];
        delete this.loadingPlanification[controlId];
        
        // Recargar los datos
        this.loadPlanificationData(controlId, tableElement.period.toString());
      } else {
        console.warn(`No se pudo encontrar elemento de tabla o período para control ${controlId}`);
      }
    }
  }

  /**
   * Alternar expansión de fila y cargar datos de planificación si es necesario
   */
  toggleRowExpansion(element: any): void {
    const controlId = element.id;
    
    if (this.expandedElements.has(controlId)) {
      // Si ya está expandido, colapsar
      this.expandedElements.delete(controlId);
    } else {
      // Si no está expandido, expandir y cargar datos si no los tiene
      this.expandedElements.add(controlId);
      
      if (!this.planificationData[controlId]) {
        this.loadPlanificationData(controlId, element.period);
      }
    }
  }

  /**
   * Verificar si una fila está expandida
   */
  isExpanded(element: any): boolean {
    return this.expandedElements.has(element.id);
  }

  /**
   * Cargar datos de planificación desde la API
   */
  loadPlanificationData(idControl: number, period: string): void {
    this.loadingPlanification[idControl] = true;
    
    this.actividadService.getcontrolPlanificacion(idControl, period).subscribe({
      next: (response: any) => {
        this.loadingPlanification[idControl] = false;
        
        if (response && response.success && response.data && Array.isArray(response.data)) {
          this.planificationData[idControl] = response.data;
          console.log(`Datos de planificación cargados para control ${idControl}:`, response.data);
        } else {
          console.warn('No se encontraron datos de planificación o la respuesta no tiene el formato esperado');
          this.planificationData[idControl] = [];
        }
      },
      error: (error) => {
        this.loadingPlanification[idControl] = false;
        console.error('Error al cargar datos de planificación:', error);
        this.planificationData[idControl] = [];
        
        this.snackBar.open('Error al cargar datos de planificación', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Obtener datos de planificación para un control específico
   */
  getPlanificationData(controlId: number): any[] {
    return this.planificationData[controlId] || [];
  }

  /**
   * Obtener los días completados (cumplidos) para un control específico
   * Estos días no pueden ser deseleccionados del calendario
   */
  getCompletedDays(controlId: number): number[] {
    const planData = this.planificationData[controlId] || [];
    return planData
      .filter((item: any) => item.estado === 'cumplida')
      .map((item: any) => parseInt(item.dia, 10));
  }

  /**
   * Verifica si los datos de planificación están listos para un control
   * Retorna true si los datos ya fueron cargados (o si están vacíos pero no están cargando)
   */
  isPlanificationDataReady(controlId: number): boolean {
    // Si está cargando, no está listo
    if (this.loadingPlanification[controlId]) {
      return false;
    }
    // Si ya tiene datos o ya se intentó cargar, está listo
    return this.planificationData[controlId] !== undefined;
  }

  /**
   * Verificar si está cargando datos de planificación
   */
  isLoadingPlanification(controlId: number): boolean {
    return this.loadingPlanification[controlId] || false;
  }

  /**
   * Eliminar un elemento de planificación
   */
  deletePlanItem(planItem: any, parentRow: any): void {
    // Mostrar diálogo de confirmación
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { 
        title: 'Confirmar eliminación', 
        message: `¿Está seguro que desea eliminar esta planificación? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Proceder con la eliminación
        this.loadingPlanification[parentRow.id] = true;
        
        // Preparar request para eliminar la planificación
        const requestBody = {
          caso: 'EliminarPlanificacion',
          idForm: planItem.idForm
        };

        console.log('Eliminando planificación:', requestBody);
        
        // Llamada a la API para eliminar
        this.proxyService.post('/ws/PlanificacionSvcImpl.php', requestBody).subscribe({
          next: (response: any) => {
            this.loadingPlanification[parentRow.id] = false;
            
            if (response && response.success) {
              // Mostrar mensaje de éxito
              this.snackBar.open('Planificación eliminada correctamente', 'Cerrar', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
                panelClass: ['success-snackbar']
              });
              
              // Actualizar datos en memoria
              if (this.planificationData[parentRow.id]) {
                this.planificationData[parentRow.id] = this.planificationData[parentRow.id].filter(
                  (item: any) => item.idForm !== planItem.idForm
                );
              }
            } else {
              console.error('Error al eliminar planificación:', response);
              this.snackBar.open('Error al eliminar planificación', 'Cerrar', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
                panelClass: ['error-snackbar']
              });
            }
          },
          error: (error) => {
            this.loadingPlanification[parentRow.id] = false;
            console.error('Error al eliminar planificación:', error);
            
            this.snackBar.open('Error al eliminar planificación', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  /**
   * Verificar si una actividad tiene días asignados
   */
  hasDaysAssigned(element: any): boolean {
    // Remover console.log para evitar spam en change detection
    const daysField = element.days;
    return daysField != "";
  }

  /**
   * Eliminar una actividad de la tabla
   */
  deleteActivity(element: any): void {
    // Verificar que el elemento tenga un ID de control válido
    if (!element.id) {
      this.snackBar.open('Error: No se puede eliminar la actividad, ID no encontrado', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Mostrar diálogo de confirmación
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: { 
        title: 'Confirmar eliminación', 
        options: [
          `ACTIVIDAD: ${element.name || 'No especificada'}`,
          `PROYECTO: ${element.project || 'No especificado'}`,
          `ETAPA: ${element.stage || 'No especificada'}`,
          `SUBPROCESO: ${element.subprocess || 'No especificado'}`,
          `ÁMBITO: ${element.scope || 'No especificado'}`
        ],
        question: '¿Está seguro que desea eliminar esta actividad? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog result:', result); // Debug
      if (result === 'SÍ') {
        // Mostrar snackbar de progreso
        this.snackBar.open('Eliminando actividad...', '', {
          duration: 0, // No se cierra automáticamente
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['info-snackbar']
        });

        // Preparar request para eliminar el control
        const requestBody = {
          caso: 'Elimina',
          idControl: element.id
        };

        console.log('Eliminando control:', requestBody);
        
        // Llamada a la API para eliminar
        this.proxyService.post(environment.apiBaseUrl + '/ws/ControlSvcImpl.php', requestBody).subscribe({
          next: (response: any) => {
            // Cerrar snackbar de progreso
            this.snackBar.dismiss();
            
            if (response && response.success) {
              // Mostrar mensaje de éxito
              this.snackBar.open('Actividad eliminada correctamente', 'Cerrar', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
                panelClass: ['success-snackbar']
              });
              
              // Actualizar tabla eliminando el elemento
              this.tableData = this.tableData.filter(item => item.id !== element.id);
              
              // También eliminar datos de planificación si existen
              if (this.planificationData[element.id]) {
                delete this.planificationData[element.id];
              }
              
              // Remover de elementos expandidos si está expandido
              this.expandedElements.delete(element.id);
              
            } else {
              console.error('Error al eliminar actividad:', response);
              this.snackBar.open('Error al eliminar actividad', 'Cerrar', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
                panelClass: ['error-snackbar']
              });
            }
          },
          error: (error) => {
            // Cerrar snackbar de progreso
            this.snackBar.dismiss();
            
            console.error('Error al eliminar actividad:', error);
            
            this.snackBar.open('Error al eliminar actividad', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }
}
