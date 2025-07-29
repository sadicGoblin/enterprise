import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ControlService } from '../../services/control.service';
import { CompletionApiRequest, CompletionApiResponse, CompletedActivity } from '../../models/control-api.models';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ActivityCompletedPipe } from '../../pipes/activity-completed.pipe';
import { MatDialog } from '@angular/material/dialog';
import { InspectionModalComponent } from '../inspection-modal/inspection-modal.component';
import { CheckListModalComponent } from './components/checklist-modal/checklist-modal.component';

// Interface for Activity
export interface Activity {
  id: number;
  name: string;
  percentage?: number;
  periodicity?: string;
  assigned?: number;
  realized: number;
  compliance: number;
  scheduledDays?: number[];
  completedDays?: number[];
  subProceso?: string;
  ambit?: string;
  dailyChecks: boolean[];
  idControl?: string;
  idParam?: string;
}

@Component({
  selector: 'app-planification-table',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule, MatTooltipModule, ActivityCompletedPipe],
  templateUrl: './planification-table.component.html',
  styleUrls: ['./planification-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class PlanificationTableComponent implements OnInit, OnChanges {
  constructor(
    private cdr: ChangeDetectorRef,
    private controlService: ControlService,
    private dialog: MatDialog
  ) {}
  
  // Endpoint manejado ahora por el ControlService
  
  // Completed activities data
  completedActivities: CompletedActivity[] = [];
  isLoadingCompletions = false;
  
  // Store the complete API response
  completedActivitiesApiResponse: CompletionApiResponse | null = null;
  @Input() set activities(data: Activity[]) {
    console.log('Planification Table received activities:', data);
    this._activities = data;
    console.log('Planification Table activities:', this._activities);
    this.updateGroupedActivities();
  }
  get activities(): Activity[] {
    return this._activities;
  }

  @Input() set days(data: number[]) {
    console.log('Planification Table received days:', data);
    this._days = data;
  }
  get days(): number[] {
    //console.log('Planification Table days:', this._days);
    return this._days;
  }

  @Input() set selectedPeriod(data: Date | null) {
    console.log('Planification Table received selectedPeriod:', data);
    this._selectedPeriod = data;
  }
  get selectedPeriod(): Date | null {
    return this._selectedPeriod;
  }

  @Input() projectId: string | null = null;
  @Input() selectedCollaboratorName: string | null = null;
  @Input() selectedCollaboratorId: string | null = null;

  private _activities: Activity[] = [];
  private _days: number[] = [];
  private _selectedPeriod: Date | null = null;
  
  @Output() activityStatusChanged = new EventEmitter<{activity: Activity, day: number}>();
  @Output() saveChanges = new EventEmitter<void>();
  
  /**
   * Group activities by ámbito/scope
   */
  groupedActivities: {ambit: string, activities: Activity[]}[] = [];

  // Summary totals for the footer row
  totalAssigned: number = 0;
  totalRealized: number = 0;
  totalCompliancePercentage: number = 0;

  /**
   * Group activities by ambit
   */
  /**
   * Updates the groupedActivities array by extracting unique ámbitos first 
   * and then grouping activities accordingly
   */
  updateGroupedActivities(): void {
    console.log('Updating grouped activities with:', this._activities);
    
    // Reset the grouped activities
    this.groupedActivities = [];
    
    // Reset totals
    this.totalAssigned = 0;
    this.totalRealized = 0;
    this.totalCompliancePercentage = 0;
    
    // Default ambit for activities without one
    const defaultAmbit = 'SIN CLASIFICAR';
    
    // Handle possible undefined activities array
    if (!this._activities || this._activities.length === 0) {
      console.warn('No activities to group!');
      return;
    }
    
    // STEP 1: Extract all unique ámbitos from the activities
    const uniqueAmbits = new Set<string>();
    
    this._activities.forEach(activity => {
      const ambit = activity.ambit || defaultAmbit;
      uniqueAmbits.add(ambit);
    });
    
    console.log('Found unique ámbitos:', Array.from(uniqueAmbits));
    
    // STEP 2: Create a group for each unique ámbito
    Array.from(uniqueAmbits).forEach(ambit => {
      this.groupedActivities.push({ 
        ambit: ambit, 
        activities: [] 
      });
      console.log(`Created group for ámbito: "${ambit}"`);
    });
    
    // STEP 3: Assign activities to their corresponding groups
    this._activities.forEach(activity => {
      const ambito = activity.ambit || defaultAmbit;
      const group = this.groupedActivities.find(g => g.ambit === ambito);
      
      if (group) {
        group.activities.push(activity);
        console.log('# Group activities:', group.activities);
        console.log(`Added activity ${activity.id} (${activity.name}) to group "${ambito}"`);
      } else {
        console.warn(`Could not find group for ámbito "${ambito}"`);
      }
    });
    
    // STEP 4: Sort groups alphabetically by ambit
    this.groupedActivities.sort((a, b) => a.ambit.localeCompare(b.ambit));
    
    // STEP 5: Sort activities within each group by name
    this.groupedActivities.forEach(group => {
      group.activities.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    // Calculate totals for summary row
    this.calculateTotals();
    
    // Final logging
    console.log(`Processed ${this.activities.length} activities with ${Array.from(uniqueAmbits).length} ámbitos`);
    console.log(`Totals - Assigned: ${this.totalAssigned}, Realized: ${this.totalRealized}, Compliance: ${this.totalCompliancePercentage.toFixed(1)}%`);
    
    // Log the first few activities to see the new name format
    if (this.activities.length > 0) {
      console.log('Sample activity names:');
      this.activities.slice(0, Math.min(5, this.activities.length)).forEach(a => {
        console.log(`- ${a.name}`);
      });
    }
    
    // Force change detection
    this.cdr.detectChanges();
  }

  /**
   * Angular lifecycle hooks
   */
  ngOnInit() {
    console.log('PlanificationTable component initialized', this.activities);
    this.updateGroupedActivities();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('PlanificationTable detected changes:', Object.keys(changes));
    if (changes['activities']) {
      console.log('Activities changed:', changes['activities'].currentValue);
      // The setter will handle updating grouped activities
    }
    if (changes['days']) {
      console.log('Days changed:', changes['days'].currentValue);
    }
    if (changes['selectedPeriod']) {
      console.log('SelectedPeriod changed:', changes['selectedPeriod'].currentValue);
    }
  }

  /**
   * Check if a day is a weekend day
   */
  isWeekend(day: number): boolean {
    if (!this.selectedPeriod) return false;
    
    const date = new Date(this.selectedPeriod.getFullYear(), this.selectedPeriod.getMonth(), day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
  }

  /**
   * Gets the abbreviated day of week in Spanish (Lun, Mar, Mié, etc.) for a given day of month
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

  /**
   * Cycles through the activity status for a given day
   */
  cycleActivityStatus(activity: Activity, day: number): void {
    this.activityStatusChanged.emit({activity, day});
  }

  /**
   * Save all activity changes
   */
  saveAllChanges(): void {
    this.saveChanges.emit();
  }
  
  /**
   * Fetch completed activities from the API
   * @param userId The user ID to fetch completions for
   * @param period The period in format YYYYMM (e.g. 202504)
   */
  fetchCompletedActivities(userId: number, period: number): void {
    console.log('Fetching completed activities for user:', userId, 'period:', period);
    this.isLoadingCompletions = true;
    
    // Reset previous data
    this.completedActivities = [];
    this.completedActivitiesApiResponse = null;
    
    // Create request body para el formato que espera ControlService.getCompletedActivities
    const requestParams = {
      caso: 'ConsultaPlanificacion',
      idUsuario: userId,
      periodo: period
    };
    
    console.log('API Request:', requestParams);
    
    // Call the API usando el ControlService
    this.controlService.getCompletedActivities(requestParams)
      .pipe(
        catchError(error => {
          console.error('Error fetching completed activities:', error);
          this.isLoadingCompletions = false;
          return of({ success: false, code: 500, message: 'Error', data: [] });
        }),
        finalize(() => {
          this.isLoadingCompletions = false;
        })
      )
      .subscribe(response => {
        // Store the complete response in our component variable
        this.completedActivitiesApiResponse = response;
        
        // Store the data array in our component variable
        if (response.data && Array.isArray(response.data)) {
          this.completedActivities = response.data;
        }
        
        // Log for debugging
        console.log('Completed activities API response saved:', this.completedActivitiesApiResponse);
        console.log('Completed activities data saved:', this.completedActivities);
        this.totalRealized = 0;
        this.totalRealized += this.completedActivities.length;
        this.totalCompliancePercentage = (this.totalRealized / this.totalAssigned) * 100;
        console.table(this.completedActivities);
        
        // Update activities with completion status
        this.updateActivitiesCompletionStatus();
      });
  }
  
  /**
   * Updates the activities with completion status
   */
  updateActivitiesCompletionStatus(): void {
    console.log('Actualizando estado de actividades completadas');
    console.log('Actividades completadas disponibles:', this.completedActivities);

    if (!this._activities || this._activities.length === 0) {
      console.warn('No hay actividades para actualizar estado de completado');
      return;
    }

    if (!this.completedActivities || this.completedActivities.length === 0) {
      console.warn('No hay datos de actividades completadas');
      // Even with no completions, we still update metrics
      this._activities.forEach(activity => {
        // Initialize completedDays if not already initialized
        if (!activity.completedDays) activity.completedDays = [];
        this.updateActivityMetrics(activity);
      });
      
      // Actualizar agrupaciones
      this.groupedActivities.forEach(group => {
        group.activities.forEach(activity => {
          this.updateActivityMetrics(activity);
        });
      });
      
      return;
    }

    // Map completions to activity IDs for easier lookup
    const completionsByControlId: {[key: string]: number[]} = {};
    
    // Group completions by control ID
    this.completedActivities.forEach(completion => {
      const controlId = completion.IdControl;
      const day = parseInt(completion.Dia);
      
      if (!completionsByControlId[controlId]) {
        completionsByControlId[controlId] = [];
      }
      
      if (!isNaN(day) && !completionsByControlId[controlId].includes(day)) {
        completionsByControlId[controlId].push(day);
      }
    });
    
    // Update activities with completion data
    this._activities.forEach(activity => {
      // Initialize completedDays if not already initialized
      if (!activity.completedDays) activity.completedDays = [];
      
      // If the activity has a control ID and there are completions for it
      if (activity.idControl && completionsByControlId[activity.idControl]) {
        activity.completedDays = completionsByControlId[activity.idControl];
      }
      
      // Update metrics for this activity
      this.updateActivityMetrics(activity);
    });
    
    // También actualizar las métricas para las actividades agrupadas
    this.groupedActivities.forEach(group => {
      group.activities.forEach(activity => {
        this.updateActivityMetrics(activity);
      });
    });
    
    // Forzar detección de cambios para actualizar la vista
    this.cdr.detectChanges();
    
    console.log('Métricas actualizadas para todas las actividades');
  }
  
  /**
   * Updates metrics for an activity
   */
  updateActivityMetrics(activity: Activity): void {
    console.log('Updating metrics for activity:', activity.scheduledDays);
    // Count total scheduled days
    activity.assigned = activity.scheduledDays?.length || 0;
    
    // Count completed days
    if (activity.completedDays) {
      activity.realized = activity.completedDays.length;
    } else {
      activity.realized = 0;
    }
    
    // Calculate compliance percentage
    if (activity.assigned > 0) {
      activity.compliance = Math.round((activity.realized / activity.assigned) * 100);
    } else {
      activity.compliance = 0;
    }
    
    console.log(`Activity ${activity.name} metrics: Assigned=${activity.assigned}, Realized=${activity.realized}, Compliance=${activity.compliance}%`);
  }

  /**
   * Calculate totals for the summary footer row
   */
  calculateTotals(): void {
    // Reset totals
    this.totalAssigned = 0;
    
    // Only calculate if we have activities
    if (this._activities && this._activities.length > 0) {
      // Sum up assigned and realized values
      this._activities.forEach(activity => {
        this.totalAssigned += activity.assigned || 0;
      });
      
      // Calculate overall compliance percentage
      if (this.totalAssigned > 0) {
        // this.totalCompliancePercentage = (this.totalRealized / this.totalAssigned) * 100;
      } else {
        this.totalCompliancePercentage = 0;
      }
    }
  }

  /**
   * Comprueba si una actividad está completada para un día específico
   * @param activity La actividad a comprobar
   * @param day El día a comprobar
   * @returns true si la actividad está completada para ese día
   */
  isActivityCompleted(activity: Activity, day: number): boolean {
    // Utilizamos el pipe ActivityCompletedPipe directamente
    if (!activity.idControl) return false;
    
    // Revisamos si esta actividad/día está en completedActivities
    return this.completedActivities.some(ca => 
      ca.IdControl === activity.idControl && parseInt(ca.Dia) === day
    );
  }
  
  /**
   * Maneja el clic en el icono de estado cuando la actividad está completada
   * @param activity La actividad seleccionada
   * @param day El día seleccionado
   */
  onStatusClick(activity: Activity, day: number): void {
    // Solo permitir la acción si la actividad está completada
    if (!this.isActivityCompleted(activity, day)) {
      return;
    }
    
    // Verificar si el nombre de la actividad contiene "SSOMA"
    if (activity.name.includes('SSOMA')) {
      console.log('Actividad SSOMA completada. Abriendo modal de inspección...');
      console.log(`idControl: ${activity.idControl}, día: ${day}`);
      this.openInspectionModal(activity.id, activity.idControl, day);
    } 
    // Verificar si el nombre de la actividad contiene "CHECK LIST"
    else if (activity.name.includes('CHECK LIST')) {
      console.log('Actividad CHECK LIST completada. Abriendo modal de checklist...');
      console.log(`idControl: ${activity.idControl}, día: ${day}, idParam: ${activity.idParam}`);
      this.openChecklistModal(activity.id, activity.idControl, day);
    } else {
      console.log('Actividad completada pero no es de tipo SSOMA ni CHECK LIST');
      // Aquí podría agregarse lógica para otros tipos de actividades en el futuro
    }
  }

  /**
   * Abre el modal de inspección SSTMA
   * @param activityId ID de la actividad seleccionada (opcional)
   * @param idControl ID de control asociado a la actividad
   * @param day Día seleccionado de la actividad
   */
  openInspectionModal(activityId?: number, idControl?: string, day?: number): void {
    const dialogRef = this.dialog.open(InspectionModalComponent, {
      width: '90vw',
      maxWidth: '1400px',
      disableClose: true,
      autoFocus: false,
      data: { 
        activityId: activityId,
        projectId: this.projectId,
        idControl: idControl,
        day: day,
        inspectionData: null,
        collaboratorName: this.selectedCollaboratorName || ''
      }
    });
    
    console.log('PlanificationTable: abriendo modal con projectId:', this.projectId);
    console.log('PlanificationTable: idControl:', idControl, 'day:', day);
    console.log('PlanificationTable: collaboratorName:', this.selectedCollaboratorName);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Inspección guardada:', result);
        // Aquí iría la lógica para guardar la inspección en el backend
        // y actualizar las actividades completadas si es necesario
      }
    });
  }

  /**
   * Abre el modal de checklist para bodega de gases u otras zonas comunes
   * @param activityId ID de la actividad seleccionada (opcional)
   * @param idControl ID de control asociado a la actividad
   * @param day Día seleccionado de la actividad
   */
  openChecklistModal(activityId?: number, idControl?: string, day?: number): void {
    // Buscar la actividad para obtener su idParam
    const selectedActivity = this._activities.find(a => a.id === activityId);
    const idParam = selectedActivity?.idParam || '';
    console.log('DEBUG IDPARAM - Actividad seleccionada:', selectedActivity);
    console.log('DEBUG IDPARAM - Valor extraído:', idParam);
    const dialogRef = this.dialog.open(CheckListModalComponent, {
      width: '90vw',
      maxWidth: '1400px',
      disableClose: true,
      autoFocus: false,
      data: { 
        activityId: activityId,
        projectId: this.projectId,
        idControl: idControl,
        day: day,
        checklistData: null,
        idParam: idParam,
        name: selectedActivity?.name || 'Check List',
        selectedCollaboratorId: this.selectedCollaboratorId,
        selectedCollaboratorName: this.selectedCollaboratorName,
        collaboratorApiConfig: {
          endpoint: '/ws/UsuarioSvcImpl.php',
          requestBody: {
            caso: 'ConsultaUsuariosObra',
            idObra: this.projectId ? parseInt(this.projectId) : 1,
            idUsuario: 0
          },
          valueKey: 'IdUsuario',
          labelKey: 'nombre'
        }
      }
    });
    
    console.log('PlanificationTable: abriendo modal checklist con projectId:', this.projectId);
    console.log('PlanificationTable: idControl:', idControl, 'day:', day);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Checklist guardado:', result);
        // Aquí iría la lógica para guardar el checklist en el backend
        // y actualizar las actividades completadas si es necesario
      }
    });
  }
}
