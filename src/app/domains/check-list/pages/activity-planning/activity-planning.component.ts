import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { InspectionModalComponent } from '../../components/planification-table/components/inspection-modal/inspection-modal.component';
import { CheckListModalComponent } from '../../components/planification-table/components/checklist-modal/checklist-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormControl } from '@angular/forms';
import { CustomSelectComponent, ParameterType, SelectOption } from '../../../../shared/controls/custom-select/custom-select.component';
import { PlanificationTableComponent, Activity as PlanificationActivity } from '../../components/planification-table/planification-table.component';
import { ProxyService } from '../../../../core/services/proxy.service';
import { ControlApiRequest, ControlApiResponse } from '../../models/control-api.models';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ArtModalComponent } from '../../components/planification-table/components/art-modal/art-modal.component';

// Activity interface definition - extended from the one used in PlanificationTableComponent
export interface Activity extends PlanificationActivity {
  id: number;
  name: string;
  periodicity: string;
  assigned: number;
  realized: number;
  compliance: number;
  scheduledDays: number[];
  completedDays?: number[];
  dailyChecks?: boolean[]; // For backward compatibility
  idControl?: string;
}

@Component({
  selector: 'app-activity-planning',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    CustomSelectComponent,
    PlanificationTableComponent,
  ],
  templateUrl: './activity-planning.component.html',
  styleUrls: ['./activity-planning.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ActivityPlanningComponent implements OnInit, AfterViewInit {
  // Toast notification properties
  showToast = false;
  toastMessage = '';
  
  // API related properties
  isLoading = false;
  selectedProjectId: string | null = null;
  selectedCollaboratorId: string | null = null;
  selectedCollaboratorName: string | null = null;
  apiEndpoint = '/ws/ControlSvcImpl.php';
  
  // Store the formatted period for API calls
  formattedPeriod: string = '';
  
  // Flag to control table visibility
  showPlanificationTable = false;
  
  @ViewChild('collaboratorSelect') collaboratorSelect!: CustomSelectComponent;
  @ViewChild(PlanificationTableComponent) planificationTable!: PlanificationTableComponent;
  constructor(
    private proxyService: ProxyService,
    private dialog: MatDialog
  ) {
    // Initialize with current date as default
    const now = new Date();
    this.selectedPeriod = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
  }
  
  ngOnInit(): void {
    this.formatPeriodString(this.selectedPeriod);
    console.log('Current period:', this.formattedPeriod);
    
    // Generate the calendar grid for the current month
    if (this.selectedPeriod) {
      this.generateCalendarGrid(this.selectedPeriod);
    }
    
    // Table is hidden initially
    this.showPlanificationTable = false;
    
    // Get user ID from localStorage
    const userId = localStorage.getItem('userId');
    
    // Set up project API request body
    this.projectApiRequestBody = {
      "caso": "Consulta",
      "idObra": 0,
      "idUsuario": userId || ''
    };
  }
  
  /**
   * Format date as Spanish month and year (e.g., "junio 2025")
   * @param date The date to format
   */
  formatPeriodString(date: Date | null): void {
    if (!date) {
      this.formattedPeriod = '';
      return;
    }
    
    const month = date.getMonth();
    const year = date.getFullYear();
    
    this.formattedPeriod = `${this.spanishMonths[month]} ${year}`;
  }
  
  /**
   * Handle date change from the datepicker
   * @param event The MatDatepickerInputEvent
   */
  onPeriodChange(event: any): void {
    this.formatPeriodString(event.value);
    // Note: No longer triggering API call automatically
  }
  
  /**
   * Set month and year when selected from datepicker
   * @param date The selected date
   * @param datepicker The datepicker instance
   */
  setMonthAndYear(date: Date, datepicker: any): void {
    console.log('setMonthAndYear called with date:', date);
    this.selectedPeriod = new Date(date);
    this.formatPeriodString(this.selectedPeriod);
    
    // Generate the calendar grid for the selected month
    this.generateCalendarGrid(this.selectedPeriod);
    
    // Note: No longer triggering API call automatically
    
    datepicker.close();
  }
  
  /**
   * Initialize mock data for activities
   */
  /**
   * Handler for the Consultar button
   * Fetches activities from API based on selected parameters
   */
  onConsultarClick(): void {
    console.log('Consultar button clicked');
    
    // Check if we have all required parameters
    if (!this.selectedProjectId || !this.selectedCollaboratorId || !this.selectedPeriod) {
      this.toastMessage = 'Por favor, seleccione proyecto, colaborador y periodo';
      this.showToast = true;
      setTimeout(() => this.showToast = false, 3000);
      return;
    }
    
    // Fetch activities from API
    this.fetchActivitiesFromApi();
  }
  
  initMockData(): void {
    // This replaces the loadActivityData function that didn't exist
    // Activities mock data should already be initialized in the component
    console.log('Mock data initialized');
  }

  /**
   * Generates a calendar grid for the selected month
   * This arranges days in weeks, with proper weekday alignment
   */
  generateCalendarGrid(date: Date): void {
    this.calendarWeeks = [];
    this.days = [];
    
    // Create a new date object for the first day of the month
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    
    // Get the number of days in the month (0 gives last day of previous month)
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Convert to Monday-based indexing (0 = Monday, ..., 6 = Sunday)
    let firstDayIndex = firstDayOfMonth.getDay() - 1;
    if (firstDayIndex < 0) firstDayIndex = 6; // Sunday becomes index 6
    
    // Initialize the first week with empty slots for days from previous month
    const firstWeek: (number | null)[] = Array(firstDayIndex).fill(null);
    
    // Fill the first week with actual days
    for (let i = 1; i <= 7 - firstDayIndex; i++) {
      firstWeek.push(i);
    }
    
    this.calendarWeeks.push(firstWeek);
    
    // Fill subsequent weeks
    let dayCounter = 7 - firstDayIndex + 1;
    
    while (dayCounter <= daysInMonth) {
      const week: (number | null)[] = [];
      
      for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) {
        week.push(dayCounter++);
      }
      
      // Fill the rest of the last week with null
      while (week.length < 7) {
        week.push(null);
      }
      
      this.calendarWeeks.push(week);
    }
    
    // Create flat days array (1 to daysInMonth)
    this.days = Array.from({length: daysInMonth}, (_, i) => i + 1);
    
    console.log('Calendar grid generated:', this.calendarWeeks);
    console.log('Days array generated:', this.days);
  }
  
  /**
   * Handle project selection change
   * @param selectedProject The selected project option
   */
  ngAfterViewInit(): void {
    // Disable collaborator select on initialization until a project is selected
    if (this.collaboratorSelect) {
      this.collaboratorSelect.isDisabled = true;
    }
  }
  
  onProjectSelectionChange(selectedProject: SelectOption | null): void {
    console.log('Selected project:', selectedProject);
    
    // Store the selected project ID
    this.selectedProjectId = selectedProject ? selectedProject.value : null;
    
    // Reset activities when project changes
    this.activities = [];
    
    // Enable collaborator selection after project is selected
    if (selectedProject && this.collaboratorSelect) {
      // Configure and enable the collaborator select component
      this.collaboratorSelect.isDisabled = false;
      this.collaboratorSelect.customApiEndpoint = '/ws/UsuarioSvcImpl.php';
      
      // Update API request body with the correct parameters
      this.collaboratorSelect.customApiRequestBody = {
        "caso": "ConsultaUsuariosObra",
        "idObra": Number(selectedProject.value) || 0,
        "idUsuario": 0
      };
      
      // Update mapping to match API response fields
      this.collaboratorSelect.customOptionValueKey = 'IdUsuario';
      this.collaboratorSelect.customOptionLabelKey = 'nombre';
      
      // Clear the selection
      this.collaboratorSelect.writeValue(null);
      console.log('Collaborator select enabled with project:', selectedProject.value);
      
      // Update component properties to match actual API settings
      this.collaboratorApiRequestBody = this.collaboratorSelect.customApiRequestBody;
      this.collaboratorOptionValue = this.collaboratorSelect.customOptionValueKey;
      this.collaboratorOptionLabel = this.collaboratorSelect.customOptionLabelKey;
      
      // Force the component to reload options with the new settings
      setTimeout(() => {
        if (this.collaboratorSelect) {
          console.log('Triggering reload of collaborator options with project ID:', selectedProject.value);
          this.collaboratorSelect.reloadOptions();
        }
      }, 100);
    } else if (this.collaboratorSelect) {
      // Disable if no project selected
      this.collaboratorSelect.isDisabled = true;
      this.collaboratorSelect.writeValue(null);
      this.selectedCollaboratorId = null;
    }
  }
  
  onCollaboratorSelectionChange(selectedCollaborator: SelectOption | null): void {
    console.log('Colaborador seleccionado:', selectedCollaborator);
    
    if (selectedCollaborator) {
      this.selectedCollaboratorId = selectedCollaborator.value;
      this.selectedCollaboratorName = selectedCollaborator.label;
      console.log('ID del colaborador seleccionado:', this.selectedCollaboratorId);
      console.log('Nombre del colaborador seleccionado:', this.selectedCollaboratorName);
    } else {
      this.selectedCollaboratorId = null;
      this.selectedCollaboratorName = null;
      console.log('Colaborador deseleccionado');
    }
  }

  /**
   * Fetch activity data from Control API
   */
  fetchActivitiesFromApi(): void {
    // Ensure we have all required parameters
    if (!this.selectedProjectId || !this.selectedCollaboratorId || !this.selectedPeriod) {
      console.warn('Cannot fetch activities: missing required parameters');
      return;
    }

    console.log('Starting API fetch with:', {
      projectId: this.selectedProjectId,
      collaboratorId: this.selectedCollaboratorId,
      period: this.selectedPeriod
    });

    // Format period as YYYYMM
    const year = this.selectedPeriod.getFullYear();
    const month = this.selectedPeriod.getMonth() + 1; // JavaScript months are 0-indexed
    this.formattedPeriod = `${year}${month.toString().padStart(2, '0')}`;

    // Prepare request body
    const requestBody = {
      caso: 'Consulta',
      idObra: Number(this.selectedProjectId),
      idUsuario: Number(this.selectedCollaboratorId),
      periodo: Number(this.formattedPeriod)
    };

    console.log('Fetching activities with params:', requestBody);
    
    // Clear any existing activities
    this.activities = [];
    
    // Hide table while loading
    this.showPlanificationTable = false;
    console.log('Setting showPlanificationTable to FALSE before API call');
    
    // Show loading indicator
    this.isLoading = true;
    
    // Define the expected response interface
    interface ApiResponseWrapper {
      success?: boolean;
      code?: number;
      message?: string;
      data?: ControlApiResponse[];
    }

    // Make API call
    this.proxyService.post<ApiResponseWrapper>(this.apiEndpoint, requestBody)
      .pipe(
        catchError(error => {
          console.error('Error fetching activities:', error);
          this.toastMessage = 'Error al cargar actividades';
          this.showToast = true;
          setTimeout(() => this.showToast = false, 3000);
          
          // Return empty wrapped response as fallback
          return of({ data: [] });
        }),
        finalize(() => {
          // Hide loading indicator when done
          this.isLoading = false;
          console.log('API call completed, loading indicator hidden');
        })
      )
      .subscribe(response => {
        console.log(this.apiEndpoint, requestBody)
        console.log('API Response received:', response);
        
        // Check if the response is an object with a data property containing an array
        const activitiesData = response.data || [];
        console.log('Activities data extracted:', activitiesData);
        
        if (Array.isArray(activitiesData) && activitiesData.length > 0) {
          console.log(`Processing ${activitiesData.length} activities from API response`);
          this.processApiResponse(activitiesData);
          
          // Debug the activities array after processing
          console.log(`After processing: ${this.activities.length} activities mapped`);
          
          // Force generate the days array for the selected month
          if (this.selectedPeriod) {
            const daysInMonth = new Date(this.selectedPeriod.getFullYear(), this.selectedPeriod.getMonth() + 1, 0).getDate();
            this.days = Array.from({length: daysInMonth}, (_, i) => i + 1);
            console.log(`Generated ${this.days.length} days for the month`);
          }
          
          // IMPORTANT: Show the table after data is loaded
          this.showPlanificationTable = true;
          console.log('✅ showPlanificationTable set to TRUE - table should be visible');
          
          // After showing the table, fetch completed activities
          // Using a delay to ensure the ViewChild is properly initialized
          setTimeout(() => {
            if (this.planificationTable && this.selectedCollaboratorId) {
              console.log('Calling fetchCompletedActivities with:', {
                user: Number(this.selectedCollaboratorId),
                period: Number(this.formattedPeriod)
              });
              this.planificationTable.fetchCompletedActivities(
                Number(this.selectedCollaboratorId), 
                Number(this.formattedPeriod)
              );
            } else {
              console.warn('Could not call fetchCompletedActivities - table not initialized or user not selected');
            }
          }, 1000);
          
          // Force Angular change detection after a short delay
          setTimeout(() => {
            console.log('Current state before timeout:', {
              activitiesLength: this.activities.length,
              daysLength: this.days.length,
              showTable: this.showPlanificationTable
            });
          }, 200);
        } else {
          // No activities found
          console.warn('No activities found in API response');
          this.activities = [];
          this.showPlanificationTable = false;
          this.toastMessage = 'No se encontraron actividades para el período seleccionado';
          this.showToast = true;
          setTimeout(() => this.showToast = false, 3000);
        }
      });
  }

  /**
   * Check if a day is a weekend day
   * In our calendar structure, the 5th and 6th columns (index 5 and 6) are weekends
   */
  isWeekend(day: number): boolean {
    // Find the day in our calendar grid
    for (let week of this.calendarWeeks) {
      const dayIndex = week.indexOf(day);
      if (dayIndex !== -1) {
        // Check if it's in the weekend columns (5 = Saturday, 6 = Sunday)
        return dayIndex === 5 || dayIndex === 6;
      }
    }
    return false;
  }
  
  /**
   * Gets the abbreviated day of week in Spanish (Lun, Mar, Mié, etc.) for a given day of month
   * @param day The day of the month (1-31)
   * @returns Abbreviated day name in Spanish (first 3 letters)
   */
  getDayOfWeekAbbr(day: number): string {
    if (!this.selectedPeriod) return '';
    
    // Create a date object for this day in the selected month/year
    const date = new Date(this.selectedPeriod.getFullYear(), this.selectedPeriod.getMonth(), day);
    
    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = date.getDay();
    
    // Spanish day abbreviations
    const dayAbbreviations = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    return dayAbbreviations[dayOfWeek];
  }
  
  // Project selection using custom select component
  projectControl = new FormControl();
  projectParameterType = ParameterType.OBRA;
  projectApiEndpoint = '/ws/ObrasSvcImpl.php';
  projectApiRequestBody: { [key: string]: string | number } = {
    idUsuario: localStorage.getItem('userId') || ''
  };
  projectOptionValue = 'IdObra';
  projectOptionLabel = 'Obra';

  // Collaborator selection using custom select component
  collaboratorControl = new FormControl();
  collaboratorParameterType = ParameterType.CUSTOM_API;
  collaboratorApiEndpoint = '/ws/UsuarioSvcImpl.php';
  collaboratorApiRequestBody: { [key: string]: string | number } = {
    caso: 'ConsultaUsuariosObra',
    idObra: 0,
    idUsuario: 0
  };
  collaboratorOptionValue = 'IdUsuario';
  collaboratorOptionLabel = 'nombre';
  selectedProject: string = '';
  selectedUser: string = '';
  selectedUserName: string = '';
  selectedPeriod: Date | null = null;
  
  // Spanish month names for formatting
  spanishMonths = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  // We'll use the custom select component instead of this static array
  // projects = ['Proyecto 1', 'Proyecto 2'];
  collaborators = ['Felipe Gallardo', 'Germán Medina', 'Patricio Baeza'];

  /**
   * Calendar grid with weeks for the UI display
   */
  calendarWeeks: (number | null)[][] = [];
  
  /**
   * Array of day numbers for the monthly calendar (1-31)
   * Used by the planification table component
   */
  days: number[] = Array.from({ length: 31 }, (_, i) => i + 1);
  
  /**
   * Day names for the calendar header
   */
  dayNames: string[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  
  // Columns for the master view
  displayedColumns = [
    'expand',
    'name',
    'periodicity',
    'assigned',
    'realized',
    'compliance'
  ];
  
  // Columns for the stats table
  statsColumns = [
    'name',
    'periodicity',
    'assigned',
    'realized',
    'compliance'
  ];
  
  // All columns including detail view
  allColumns = [
    'expand',
    'name',
    'periodicity',
    'assigned',
    'realized',
    'compliance'
  ];
  
  // Mock data for now - would come from an API in real app
  activities: Activity[] = [];

  /**
   * Track expanded activities
   */
  expandedRows: Activity[] = [];
  
  /**
   * Check if a row is expanded
   */
  isExpanded(row: Activity): boolean {
    return this.expandedRows.includes(row);
  }
  
  /**
   * Predicate function that determines if a row is an expansion detail row
   */
  isExpansionDetailRow = (_: number, row: any): boolean => row.element === undefined;
  
  /**
   * Predicate function that determines if a row is an expanded row
   */
  isExpandedRow = (_: number, row: any): boolean => row.element !== undefined;
  
  /**
   * Toggle row expansion
   */
  toggleRow(element: Activity, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const index = this.expandedRows.indexOf(element);
    if (index === -1) {
      this.expandedRows.push(element);
    } else {
      this.expandedRows.splice(index, 1);
    }
    console.log('Toggled row:', element.name, 'Expanded:', this.expandedRows.includes(element));
  }
  
  /**
   * Toggles a scheduled day for an activity
   */
  toggleScheduledDay(activity: Activity, day: number, checked: boolean): void {
    if (checked) {
      if (!activity.scheduledDays.includes(day)) {
        activity.scheduledDays.push(day);
        activity.scheduledDays.sort((a, b) => a - b);
      }
    } else {
      activity.scheduledDays = activity.scheduledDays.filter(d => d !== day);
    }
    
    // Update dailyChecks for backward compatibility
    if (activity.dailyChecks) {
      activity.dailyChecks[day - 1] = checked;
    }
  }
  
  /**
   * Cycles through the activity status for a given day
   * States: not scheduled -> scheduled (not completed) -> completed -> not scheduled
   * @param activity The activity to update
   * @param day The day to update the status for
   */
  cycleActivityStatus(activity: Activity, day: number): void {
    // Initialize completedDays array if it doesn't exist
    if (!activity.completedDays) {
      activity.completedDays = [];
    }
    
    // Check current status and cycle to next status
    if (!activity.scheduledDays.includes(day)) {
      // Not scheduled -> Scheduled (not completed)
      activity.scheduledDays.push(day);
      activity.scheduledDays.sort((a, b) => a - b);
    } else if (activity.scheduledDays.includes(day) && !activity.completedDays.includes(day)) {
      // Scheduled (not completed) -> Completed
      activity.completedDays.push(day);
      activity.completedDays.sort((a, b) => a - b);
    } else {
      // Completed -> Not scheduled
      activity.scheduledDays = activity.scheduledDays.filter(d => d !== day);
      activity.completedDays = activity.completedDays.filter(d => d !== day);
    }
    
    // Update realized and compliance metrics
    this.updateActivityMetrics(activity);
  }
  
  /**
   * Updates the metrics for an activity based on scheduled and completed days
   */
  updateActivityMetrics(activity: Activity): void {
    console.log("id controol ", activity);
    activity.assigned = activity.scheduledDays.length;
    activity.realized = activity.completedDays?.length || 0;
    activity.compliance = activity.assigned > 0 ? Math.round((activity.realized / activity.assigned) * 100) : 0;
    activity.idControl = activity.idControl || '';
  }
  
  /**
   * Save changes for a specific activity
   */
  saveActivityChanges(activity: Activity): void {
    // In a real app, this would save to backend
    console.log('Saved changes for activity:', activity);
    
    // Update compliance metrics
    this.updateCompliance(activity);
    
    // Toast notification
    this.toastMessage = 'Cambios guardados correctamente';
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
  
  /**
   * Save all activity changes
   */
  saveAllChanges(): void {
    // In a real app, this would batch save all activities to backend
    console.log('Saving all activities');
    
    // Update compliance for all activities
    this.activities.forEach(activity => {
      this.updateCompliance(activity);
    });
    
    // Toast notification
    this.toastMessage = 'Todos los cambios guardados correctamente';
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
  
  /**
   * Handle activity status changes from the planification table component
   */
  handleActivityStatusChanged(event: {activity: Activity, day: number}): void {
    // Call the cycle activity status method to update the activity
    this.cycleActivityStatus(event.activity, event.day);
  }
  
  /**
   * Update compliance metrics for an activity
   * @param activity The activity to update compliance for
   */
  updateCompliance(activity: Activity): void {
    const totalScheduled = activity.scheduledDays.length;
    const realized = activity.completedDays?.length || 0;
    activity.realized = realized;
    
    // Calculate compliance percentage
    activity.compliance = totalScheduled > 0 ? Math.round((realized / totalScheduled) * 100) : 0;
  }
  
  /**
   * Abre el modal de inspección SSTMA
   * @param activityId ID opcional de la actividad seleccionada
   */
  openInspectionModal(activityId?: number): void {
    const dialogRef = this.dialog.open(InspectionModalComponent, {
      width: '90vw',
      maxWidth: '1400px', // Aumentado a 1400px para mejor visualización
      disableClose: true,
      autoFocus: false,
      data: { 
        activityId: activityId,
        projectId: this.selectedProjectId,  // Agregar el ID del proyecto seleccionado
        inspectionData: null
      }
    });

    // Registrar para depuración
    console.log('Abriendo modal de inspección con projectId:', this.selectedProjectId);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Inspección guardada:', result);
        // Aquí iría la lógica para guardar la inspección en el backend
        // y actualizar las actividades completadas si es necesario
      }
    });
  }

  openChecklistModal(activityId?: number): void {
    const dialogRef = this.dialog.open(CheckListModalComponent, {
      width: '90vw',
      maxWidth: '1400px', // Aumentado a 1400px para mejor visualización
      disableClose: true,
      autoFocus: false,
      data: { 
        activityId: activityId,
        projectId: this.selectedProjectId,  // Agregar el ID del proyecto seleccionado
        checklistData: null
      }
    });

    // Registrar para depuración
    console.log('Abriendo modal de checklist con projectId:', this.selectedProjectId);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Checklist guardada:', result);
        // Aquí iría la lógica para guardar la checklist en el backend
        // y actualizar las actividades completadas si es necesario
      }
    });
  }

  openArtModal(activityId?: number): void {
    const dialogRef = this.dialog.open(ArtModalComponent, {
      width: '90vw',
      maxWidth: '1400px', // Aumentado a 1400px para mejor visualización
      disableClose: true,
      autoFocus: false,
      data: { 
        activityId: activityId,
        projectId: this.selectedProjectId,  // Agregar el ID del proyecto seleccionado
        artData: null
      }
    });

    // Registrar para depuración
    console.log('Abriendo modal de art con projectId:', this.selectedProjectId);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Art guardada:', result);
        // Aquí iría la lógica para guardar la art en el backend
        // y actualizar las actividades completadas si es necesario
      }
    });
  }
  


  /**
   * Process API response into our model
   */
  processApiResponse(apiData: ControlApiResponse[]): void {
    console.log('Processing API response with', apiData.length, 'items');
    console.log('First API item:', apiData[0]);
  
    // Group activities by both ID and SubProceso to keep subprocesses distinct
    const activitiesMap = new Map<string, Activity>();
  
    apiData.forEach(item => {
      const activityId = item.IdActividad;
      const subProceso = item.SubProceso || 'SIN SUBPROCESO';
      
      // Create a unique key combining activity ID and subprocess
      const uniqueKey = `${activityId}_${item.IdSubProceso}`;
      
      // Create a formatted display name that includes the subprocess
      const displayName = `${subProceso} :: ${item.Actividad}`;
      
      // Create new activity if we haven't seen this combination before
      if (!activitiesMap.has(uniqueKey)) {
        const activity: Activity = {
          id: Number(activityId),
          name: displayName, // Use the combined name format
          periodicity: item.Periocidad,
          ambito: item.Ambito || 'SIN CLASIFICAR',
          scheduledDays: [],
          completedDays: [],
          assigned: 0,
          realized: 0,
          compliance: 0,
          dailyChecks: Array(31).fill(false), // Initialize dailyChecks array
          idControl: item.IdControl || ''
        };
        activitiesMap.set(uniqueKey, activity);
        console.log(`Created activity: ID=${uniqueKey}, Name="${displayName}", SubProceso="${subProceso}", Ambito="${item.Ambito}"`);
      }
  
      // Add scheduled day to the activity
      const activity = activitiesMap.get(uniqueKey)!;
      const scheduledDay = Number(item.dias);
  
      if (!isNaN(scheduledDay) && scheduledDay > 0 && !activity.scheduledDays.includes(scheduledDay)) {
        activity.scheduledDays.push(scheduledDay);
        console.log(`Added day ${scheduledDay} to activity "${activity.name}"`);
      }
    });
  
    // Convert the map to an array
    this.activities = Array.from(activitiesMap.values());
    console.log(`Extracted ${this.activities.length} unique activities from ${apiData.length} API data items`);
  
    // Get unique ámbitos for reporting
    const uniqueAmbitos = new Set(this.activities.map(a => a.ambito));
    console.log('Unique ámbitos found:', Array.from(uniqueAmbitos));
  
    // Process each activity
    this.activities.forEach(activity => {
      // Sort scheduled days numerically
      activity.scheduledDays.sort((a, b) => a - b);
  
      // Update metrics
      this.updateActivityMetrics(activity);
    });
  
    // Sort activities by name
    this.activities.sort((a, b) => a.name.localeCompare(b.name));
  
    // Final logging
    console.log(`Processed ${this.activities.length} activities with ${Array.from(uniqueAmbitos).length} ámbitos`);
    
    // Log the first few activities to see the new name format
    if (this.activities.length > 0) {
      console.log('Sample activity names:');
      this.activities.slice(0, Math.min(5, this.activities.length)).forEach(a => {
        console.log(`- ${a.name}`);
      });
    }
  }
}
