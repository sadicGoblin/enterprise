import { Component, OnInit, Inject } from '@angular/core';
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
import { of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UsuarioService } from '../../../services/usuario.service';
import { ControlService } from '../../../services/control.service';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

// Interface for project API request body
interface ProjectApiRequestBody {
  caso: string;
  idObra: number;
  idUsuario: number;
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
    ConfirmationDialogComponent,
    CustomSelectComponent,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ],
  templateUrl: './add-activities-pp.component.html',
  styleUrl: './add-activities-pp.component.scss',
})
export class AddActivitiesPpComponent implements OnInit {
  // Parameter types enum for custom-select
  parameterTypes = ParameterType;
  
  // Properties for Project app-custom-select
  projectControl = new FormControl(null, [Validators.required]);
  projectSelectedId: string | null = null;
  projectApiEndpoint = '/ws/ObrasSvcImpl.php';
  projectApiCaso = 'Consulta';
  projectApiRequestBody!: ProjectApiRequestBody; // Will be initialized in ngOnInit
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
  stageOptions: any[] = [];
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
  selectedSubprocesses: any[] = [];
  subprocessApiEndpoint = '/ws/EtapaConstructivaSvcImpl.php';
  subprocessApiRequestBody: SubprocessApiRequestBody = {
    caso: 'ConsultaSubProcesos',
    idEtapaConstructiva: 0, // Will be updated when stage is selected
    idSubProceso: 0,
    codigo: 0,
    nombre: null
  };
  loadingSubprocesses = false;
  
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
  activityOptions: any[] = [];
  selectedActivities: any[] = [];
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
  selectedPeriodicity = '';
  selectedCategory = '';
  selectedParameter = '';
  selectedDocument = '';
  
  userId: number | null = null;
  
  constructor(
    private proxyService: ProxyService, 
    private dateAdapter: DateAdapter<Date>,
    private usuarioService: UsuarioService,
    private controlService: ControlService,
    private dialog: MatDialog
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
  }
  
  ngOnInit(): void {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        this.userId = parsedData.userId;
        console.log('User ID from localStorage:', this.userId);
      } else {
        console.warn('No userData found in localStorage');
      }
    } catch (error) {
      console.error('Error parsing userData from localStorage:', error);
    }
    
    // Initialize project API request body with the current user ID
    this.projectApiRequestBody = {
      caso: this.projectApiCaso,
      idObra: 0, // For fetching all projects
      idUsuario: this.userId || 1
    };
  }
  
  /**
   * Handles project selection change from custom select component
   */
  onProjectSelectionChange(selectedProject: any): void {
    console.log('Project selection changed to:', selectedProject);
    
    if (selectedProject) {
      this.projectSelectedId = selectedProject.IdObra;
      
      // Reset stage selection when project changes
      this.stageControl.reset();
      this.stageSelectedId = null;
      
      // Load stages for the selected project
      this.loadStages();
      
      // Load users for the selected project
      this.loadUsersForProject(Number(this.projectSelectedId));
    } else {
      this.projectSelectedId = null;
      this.stageOptions = [];
    }
  }
  
  /**
   * Handles stage selection change from custom select component
   */
  onStageSelectionChange(selectedStageId: any): void {
    console.log('Stage selection changed to:', selectedStageId);
    
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
  onScopeSelectionChange(selectedScope: SelectOption | null): void {
    if (selectedScope && selectedScope.value) {
      this.scopeSelectedId = String(selectedScope.value);
      console.log('Scope selected:', this.scopeSelectedId);
      
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
      console.log('Scope selection cleared');
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
      console.log('Risk parameter selected:', this.riskParameterSelectedId);
    } else {
      console.log('Risk parameter selection cleared');
      this.riskParameterSelectedId = null;
    }
  }

  /**
   * Loads construction stages based on the selected project
   */
  loadStages(): void {
    if (!this.projectSelectedId) {
      this.stageOptions = [];
      return;
    }
    
    this.loadingStages = true;
    
    this.proxyService.post(this.stageApiEndpoint, this.stageApiRequestBody)
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
          this.stageOptions = response.data;
          console.log('Stages loaded:', this.stageOptions);
        } else {
          this.stageOptions = [];
          console.warn('No stages data available or request failed');
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
    this.proxyService.post('ws/UsuarioSvcImpl.php', requestBody)
      .pipe(
        catchError(error => {
          console.error('Error loading users:', error);
          this.loadingUsers = false;
          return of({ success: false, data: [] });
        })
      )
      .subscribe((response: any) => {
        this.loadingUsers = false;
        
        if (response && response.success && response.data) {
          this.users = response.data as User[];
          console.log('Users loaded:', this.users);
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
    
    this.proxyService.post(this.subprocessApiEndpoint, this.subprocessApiRequestBody)
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
          console.log('Subprocesses loaded:', this.subprocessOptions);
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
    
    this.proxyService.post(this.activityApiEndpoint, this.activityApiRequestBody)
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
          console.log('Activities loaded:', this.activityOptions);
        } else {
          this.activityOptions = [];
          console.warn('No activities data available or request failed');
        }
      });
  }
  
  /**
   * Toggles selection of a subprocess
   */
  toggleSubprocessSelection(subprocess: any): void {
    const index = this.selectedSubprocesses.findIndex(sp => sp.idSubproceso === subprocess.idSubproceso);
    
    if (index === -1) {
      // Add to selection
      this.selectedSubprocesses.push(subprocess);
    } else {
      // Remove from selection
      this.selectedSubprocesses.splice(index, 1);
    }
    
    console.log('Selected subprocesses:', this.selectedSubprocesses);
  }
  
  /**
   * Checks if a subprocess is selected
   */
  isSubprocessSelected(subprocess: any): boolean {
    return this.selectedSubprocesses.some(sp => sp.idSubproceso === subprocess.idSubproceso);
  }
  
  /**
   * Toggles selection of an activity
   */
  toggleActivitySelection(activity: any): void {
    const index = this.selectedActivities.findIndex(act => act.idActividades === activity.idActividades);
    
    if (index === -1) {
      // Add to selection
      this.selectedActivities.push(activity);
    } else {
      // Remove from selection
      this.selectedActivities.splice(index, 1);
    }
    
    console.log('Selected activities:', this.selectedActivities);
  }
  
  /**
   * Checks if an activity is selected
   */
  isActivitySelected(activity: any): boolean {
    return this.selectedActivities.some(act => act.idActividades === activity.idActividades);
  }

  tableData: any[] = [];

  addActivity() {
    // Verificar si hay actividades seleccionadas
    if (!this.selectedActivities || this.selectedActivities.length === 0) {
      console.error('No hay actividades seleccionadas');
      return;
    }
    
    // Extraer el periodo en formato YYYYMM a partir de la fecha seleccionada
    const periodoFormateado = this.selectedDate ? 
      (this.selectedDate.getFullYear() * 100 + (this.selectedDate.getMonth() + 1)) : 
      202506;
    
    // Para cada actividad seleccionada, enviar una solicitud
    this.selectedActivities.forEach((actividad, index) => {
      // Crear el objeto de control utilizando los valores del formulario
      // y la actividad actual del bucle
      const controlBody = {
        "caso": "Crea",
        "IdControl": 0,
        "idObra": this.projectSelectedId ? Number(this.projectSelectedId) : 7,
        "obra": null,
        "idUsuario": this.selectedUser ? Number(this.selectedUser) : 478,
        "usuario": null,
        "periodo": periodoFormateado,
        "idEtapaConst": this.stageSelectedId ? Number(this.stageSelectedId) : 100,
        "etapaConst": null,
        "idSubProceso": this.selectedSubprocesses.length > 0 ? Number(this.selectedSubprocesses[0].idSubproceso) : 616,
        "subProceso": null,
        "idAmbito": this.scopeSelectedId ? Number(this.scopeSelectedId) : 1,
        "ambito": null,
        "idActividad": Number(actividad.idActividades), // Usa la actividad actual
        "actividad": null,
        "idPeriocidad": this.selectedPeriodicity ? (this.selectedPeriodicity === 'DIARIA' ? 7 : (this.selectedPeriodicity === 'SEMANAL' ? 8 : 6)) : 6,
        "periocidad": null,
        "idCategoria": this.selectedCategory ? (this.selectedCategory === 'ALTA' ? 2 : (this.selectedCategory === 'MEDIA' ? 1 : 0)) : 0,
        "idParam": this.riskParameterSelectedId ? Number(this.riskParameterSelectedId) : 0,
        "dias": null,
        "fechaControl": "0001-01-01T00:00:00"
      };
      
      // Mostrar objeto en consola
      console.log(`Control para actividad ${index + 1}/${this.selectedActivities.length}:`, controlBody);
      
      // Enviar objeto al servicio POST usando controlService
      this.controlService.createControl(controlBody).subscribe({
        next: (response: any) => {
          console.log(`Respuesta del servicio para actividad ${actividad.nombre} (${actividad.idActividades}):`, response);
        },
        error: (error: any) => {
          console.error(`Error al enviar la solicitud para actividad ${actividad.nombre} (${actividad.idActividades}):`, error);
        }
      });
    });
    
    // Continuar con la lógica existente si todos los campos requeridos están completos
    if (
      this.projectSelectedId &&
      this.selectedUser &&
      this.selectedPeriod &&
      this.stageSelectedId &&
      this.selectedSubprocesses.length > 0 &&
      this.scopeSelectedId &&
      this.selectedActivities.length > 0 &&
      this.selectedPeriodicity &&
      this.selectedCategory &&
      this.riskParameterSelectedId &&
      this.selectedDocument
    ) {
      const activity = {
        id: Math.floor(Math.random() * 1000),
        code: Math.floor(Math.random() * 1000).toString(),
        name: this.selectedActivities.map(act => act.nombre).join(', '),
        project: this.projectSelectedId || '',
        period: this.selectedPeriod,
        user: this.selectedUser,
        stage: this.stageSelectedId || '',
        subprocesses: this.selectedSubprocesses,
        subprocessNames: this.selectedSubprocesses.map(sp => sp.nombre).join(', '),
        scope: this.scopeSelectedId || '',
        activities: this.selectedActivities,
        activityNames: this.selectedActivities.map(act => act.nombre).join(', '),
        periodicity: this.selectedPeriodicity,
        category: this.selectedCategory,
        parameter: this.riskParameterSelectedId || '',
        document: this.selectedDocument
      };

      this.tableData.push(activity);
      this.resetFields();
    } else {
      console.warn('Algunos campos requeridos están incompletos');
    }
  }

  resetFields() {
    // Reset date to current date
    this.selectedDate = new Date();
    this.formatSelectedDate();
    this.selectedPeriodicity = '';
    this.selectedCategory = '';
    this.selectedDocument = '';
    this.projectControl.reset();
    this.projectSelectedId = null;
    this.stageControl.reset();
    this.stageSelectedId = null;
    this.scopeControl.reset();
    this.scopeSelectedId = null;
    this.riskParameterControl.reset();
    this.riskParameterSelectedId = null;
    this.selectedSubprocesses = [];
    this.subprocessOptions = [];
    this.selectedActivities = [];
    this.activityOptions = [];
    this.selectedPeriod = '';
    this.selectedUser = '';
  }

  editActivity(activity: any) {
    this.projectControl.setValue(activity.project);
    this.projectSelectedId = activity.project;
    this.selectedPeriod = activity.period;
    this.selectedUser = activity.user;
    
    // Set stage first to trigger subprocess API update
    this.stageControl.setValue(activity.stage);
    this.stageSelectedId = activity.stage;
    
    // Update subprocess API request body with the selected stage ID
    this.subprocessApiRequestBody = {
      ...this.subprocessApiRequestBody,
      idEtapaConstructiva: Number(activity.stage)
    };
    
    // Load subprocesses and set selected ones after data is loaded
    this.loadSubprocesses();
    setTimeout(() => {
      if (activity.subprocesses && Array.isArray(activity.subprocesses)) {
        this.selectedSubprocesses = [...activity.subprocesses];
      }
    }, 500);
    
    // Set scope first to trigger activity API update
    this.scopeControl.setValue(activity.scope);
    this.scopeSelectedId = activity.scope;
    
    // Update activity API request body with the selected scope ID
    this.activityApiRequestBody = {
      ...this.activityApiRequestBody,
      idAmbito: Number(activity.scope)
    };
    
    // Load activities and set selected ones after data is loaded
    this.loadActivities();
    setTimeout(() => {
      if (activity.activities && Array.isArray(activity.activities)) {
        this.selectedActivities = [...activity.activities];
      }
    }, 700);
    
    this.selectedPeriodicity = activity.periodicity;
    this.selectedCategory = activity.category;
    this.riskParameterControl.setValue(activity.parameter);
    this.riskParameterSelectedId = activity.parameter;
    this.selectedDocument = activity.document;

    this.deleteActivity(activity);
  }

  deleteActivity(activity: any) {
    this.tableData = this.tableData.filter(item => item.id !== activity.id);
  }

  save() {
    console.log('Datos a grabar:', this.tableData);
    
    if (this.tableData.length === 0) {
      alert('No hay actividades para grabar');
      return;
    }
    
    // Preparar información para el diálogo
    const stageText = this.stageSelectedId ? 
      `ETAPA CONSTRUCTIVA: ${this.tableData[0].stage || 'No especificado'}` : 
      'ETAPA CONSTRUCTIVA: No especificada';
    
    // Obtener subprocesos únicos
    const subprocesses = this.tableData
      .map(item => item.subprocess)
      .filter((value, index, self) => value && self.indexOf(value) === index);
      
    const subprocessText = `SUB PROCESO:${subprocesses.length > 0 ? 
      '\n-' + subprocesses.join('\n-') : 
      '\n-No especificado'}`;
    
    // Obtener ámbitos únicos
    const scopes = this.tableData
      .map(item => item.scope)
      .filter((value, index, self) => value && self.indexOf(value) === index);
      
    const scopeText = `AMBITO: ${scopes.join(', ') || 'No especificado'}`;
    
    // Obtener actividades
    const activities = this.tableData.map(item => item.name);
    const activitiesText = `ACTIVIDADES:${activities.length > 0 ? 
      '\n-' + activities.join('\n-') : 
      '\n-No hay actividades seleccionadas'}`;
    
    // Open confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { 
        title: 'RaaM :: SSOMA',
        options: [
          stageText,
          subprocessText,
          scopeText,
          activitiesText
        ],
        question: 'DESEA CREAR LAS ACTIVIDADES?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'SÍ') {
        // Proceed with saving
        this.selectedActivities.forEach((actividad: any, index: number) => {
          // Create control object solo con los campos del formulario
          const controlBody = {
            "caso": "ConsultaEquipo",
            "IdControl": null,
            "idObra": this.projectSelectedId ? Number(this.projectSelectedId) : null,
            "obra": null,
            "idUsuario": this.selectedUser ? Number(this.selectedUser) : null,
            "usuario": null,
            "periodo": this.selectedPeriod ? Number(this.selectedPeriod) : null,
            "idEtapaConst": this.stageSelectedId ? Number(this.stageSelectedId) : null,
            "etapaConst": null,
            "idSubProceso": this.selectedSubprocesses.length > 0 ? Number(this.selectedSubprocesses[0].idSubProceso) : null,
            "subProceso": null,
            "idAmbito": this.scopeSelectedId ? Number(this.scopeSelectedId) : null,
            "ambito": null,
            "idActividad": actividad.idActividades ? Number(actividad.idActividades) : null,
            "actividad": null,
            "idPeriocidad": this.selectedPeriodicity ? 
                          (this.selectedPeriodicity === 'DIARIA' ? 7 : 
                           this.selectedPeriodicity === 'SEMANAL' ? 8 : 
                           this.selectedPeriodicity === 'MENSUAL' ? 6 : null) : null,
            "periocidad": null,
            "idCategoria": this.selectedCategory ? 
                          (this.selectedCategory === 'ALTA' ? 2 : 
                           this.selectedCategory === 'MEDIA' ? 1 : 
                           this.selectedCategory === 'BAJA' ? 0 : null) : null,
            "idParam": this.riskParameterSelectedId ? Number(this.riskParameterSelectedId) : null,
            "dias": null,
            "fechaControl": null
          };
          
          // Mostrar objeto en consola
          console.log(`Control para actividad ${index + 1}/${this.selectedActivities.length}:`, controlBody);
          
          // Enviar objeto al servicio POST usando controlService
          // this.controlService.createControl(controlBody).subscribe({
          //   next: (response: any) => {
          //     console.log(`Respuesta del servicio para actividad ${actividad.nombre} (${actividad.idActividades}):`, response);
          //   },
          //   error: (error: any) => {
          //     console.error(`Error al enviar la solicitud para actividad ${actividad.nombre} (${actividad.idActividades}):`, error);
          //   }
          // });

        });
      }
    });
  }

  displayedColumns = [
    'project',
    'user',
    'period',
    'stage',
    'subprocess',
    'scope',
    'activity',
    'periodicity',
    'edit',
    'delete',
  ];
}
